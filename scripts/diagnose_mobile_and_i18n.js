import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9228;
const SERVER_PORT = 4186;
const ROOT_DIR = process.cwd();
const SCREENSHOT_DIR = path.resolve('..\\..\\brain\\70219288-f5a5-4653-a9e3-3492c5555175\\screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise(resolve => {
    server.listen(SERVER_PORT, () => {
      resolve(server);
    });
  });
}

async function main() {
  const server = await startStaticServer();
  console.log(`Local static server running on http://127.0.0.1:${SERVER_PORT}`);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${CHROME_PORT}`,
    'about:blank'
  ]);

  await sleep(1500);

  const versionRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
  const versionData = await versionRes.json();
  const wsUrl = versionData.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();
  ws.onmessage = evt => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  await new Promise(resolve => { ws.onopen = resolve; });

  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const targetRes = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = targetRes.result.targetId;

  const pagesRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`);
  const pages = await pagesRes.json();
  const pageTarget = pages.find(p => p.id === targetId);
  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);

  const pagePending = new Map();
  pageWs.onmessage = evt => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pagePending.has(msg.id)) {
      pagePending.get(msg.id)(msg);
      pagePending.delete(msg.id);
    }
  };
  await new Promise(resolve => { pageWs.onopen = resolve; });

  function sendPage(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      pagePending.set(id, resolve);
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');
  await sendPage('DOM.enable');

  async function evalInPage(expr) {
    const res = await sendPage('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.result?.exceptionDetails) {
      console.error('Page evaluation exception:', res.result.exceptionDetails.text, res.result.exceptionDetails.exception?.description);
    }
    return res.result?.result?.value ?? res.result?.value;
  }

  async function setViewport(w, h) {
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 2,
      mobile: w < 1024
    });
  }

  async function captureScreenshot(filepath) {
    const shot = await sendPage('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filepath, Buffer.from(shot.result.data, 'base64'));
  }

  await sendPage('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/index.html` });
  await sleep(2000);

  // Setup synthetic authenticated state
  await evalInPage(`(() => {
    document.querySelector('#splashScreen')?.classList.add('hidden');
    document.querySelector('#authScreen')?.classList.add('hidden');
    document.querySelector('#appScreen')?.classList.remove('hidden');

    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    document.querySelector('#viewHome')?.classList.add('active');

    // Populate patient info
    if (document.querySelector('#displayName')) document.querySelector('#displayName').textContent = 'Rajesh Kumar';
    if (document.querySelector('#displayId')) document.querySelector('#displayId').textContent = 'Health ID: MK-884920';
    if (document.querySelector('#welcomeGreeting')) document.querySelector('#welcomeGreeting').textContent = 'Hello, Rajesh Kumar';
    if (document.querySelector('#avatar')) document.querySelector('#avatar').textContent = 'RK';

    const summary = document.querySelector('#emergencySummary');
    if (summary) summary.innerHTML = '<strong>ICE:</strong> Sunita Kumar (+91 98765 43210) &nbsp;|&nbsp; <strong>Allergies:</strong> Penicillin (Severe)';

    const alerts = document.querySelector('#criticalAlerts');
    if (alerts) {
      alerts.innerHTML = '<span class="badge-tag blood">🩸 Blood: B+</span>' +
                         '<span class="badge-tag allergy">⚠️ Allergy: Penicillin</span>' +
                         '<span class="badge-tag condition">⚕️ Hypertension</span>';
    }

    const apts = document.querySelector('#homeAppointmentsPreview');
    if (apts) {
      apts.innerHTML = '<div class="mini-item-row"><div class="mini-item-content"><strong>Cardiology Checkup</strong><small>Dr. Mehta · Dec 10, 2026</small></div><span class="badge">Confirmed</span></div>';
    }

    const rxs = document.querySelector('#homePrescriptionsPreview');
    if (rxs) {
      rxs.innerHTML = '<div class="mini-item-row"><div class="mini-item-content"><strong>Amlodipine 5mg</strong><small>Once daily after breakfast</small></div><span class="badge">Active</span></div>';
    }
  })()`);

  console.log('\n--- DIAGNOSING MOBILE VIEWPORTS (CURRENT BEFORE STATE) ---');
  const viewports = [
    { w: 320, h: 568, name: '320x568 (iPhone SE 1st gen)' },
    { w: 360, h: 800, name: '360x800 (Galaxy S20)' },
    { w: 375, h: 812, name: '375x812 (iPhone X/11)' },
    { w: 390, h: 844, name: '390x844 (iPhone 12/13/14)' },
    { w: 412, h: 915, name: '412x915 (Pixel 7)' },
    { w: 430, h: 932, name: '430x932 (iPhone 14 Pro Max)' },
    { w: 768, h: 1024, name: '768x1024 (iPad Mini)' },
    { w: 1024, h: 768, name: '1024x768 (iPad Landscape)' },
    { w: 1440, h: 900, name: '1440x900 (Desktop HD)' }
  ];

  for (const vp of viewports) {
    await setViewport(vp.w, vp.h);
    await sleep(300);

    const metrics = await evalInPage(`(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientW = doc.clientWidth;
      const overflow = scrollW - clientW;

      // Header metrics
      const topbar = document.querySelector('.topbar');
      const topbarRect = topbar ? topbar.getBoundingClientRect() : null;
      const brand = document.querySelector('#topBrand');
      const brandRect = brand ? brand.getBoundingClientRect() : null;
      const onlineBadge = document.querySelector('#networkStatus');
      const badgeRect = onlineBadge ? onlineBadge.getBoundingClientRect() : null;
      const sosBtn = document.querySelector('#sosCallBtn');
      const sosRect = sosBtn ? sosBtn.getBoundingClientRect() : null;
      const menuBtn = document.querySelector('#menuToggle');
      const menuRect = menuBtn ? menuBtn.getBoundingClientRect() : null;

      // Quick actions metrics
      const qaGrid = document.querySelector('.quick-action-grid');
      const qaGridCols = qaGrid ? window.getComputedStyle(qaGrid).gridTemplateColumns.split(' ').length : 0;
      const qaCards = Array.from(document.querySelectorAll('.quick-card')).map(c => {
        const r = c.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });

      // Bottom nav metrics
      const bNav = document.querySelector('.bottom-nav');
      const bNavRect = bNav ? bNav.getBoundingClientRect() : null;
      const bNavDisplay = bNav ? window.getComputedStyle(bNav).display : 'none';

      return {
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        scrollW,
        clientW,
        overflow,
        topbarHeight: topbarRect ? Math.round(topbarRect.height) : null,
        badgeVisible: onlineBadge && window.getComputedStyle(onlineBadge).display !== 'none',
        badgeRect: badgeRect ? { w: Math.round(badgeRect.width), right: Math.round(badgeRect.right) } : null,
        sosRect: sosRect ? { w: Math.round(sosRect.width), right: Math.round(sosRect.right) } : null,
        menuRect: menuRect ? { w: Math.round(menuRect.width), right: Math.round(menuRect.right) } : null,
        qaGridCols,
        qaCardCount: qaCards.length,
        qaSampleCard: qaCards[0] || null,
        bNavDisplay,
        bNavHeight: bNavRect ? Math.round(bNavRect.height) : null
      };
    })()`);

    console.log(`[${vp.name}] Overflow: ${metrics.overflow}px | Topbar H: ${metrics.topbarHeight}px | Badge visible: ${metrics.badgeVisible} | QA cols: ${metrics.qaGridCols} | BottomNav: ${metrics.bNavDisplay} (${metrics.bNavHeight}px)`);

    if (vp.w === 320) {
      const overflowing = await evalInPage(`(() => {
        const els = document.querySelectorAll('*');
        const bad = [];
        els.forEach(el => {
          if (el.scrollWidth > 320 || el.offsetWidth > 320) {
            bad.push({
              tag: el.tagName,
              id: el.id,
              cls: typeof el.className === 'string' ? el.className.slice(0, 30) : '',
              scrollW: el.scrollWidth,
              offsetW: el.offsetWidth
            });
          }
        });
        return bad.filter(b => b.tag !== 'HTML' && b.tag !== 'BODY' && b.id !== 'appScreen');
      })()`);
      console.log('Overflow elements on 320px:', JSON.stringify(overflowing, null, 2));
    }
  }

  console.log('\n--- DIAGNOSING TRANSLATION DEFICIENCIES (HINDI SWITCH TEST) ---');
  // Switch to Hindi
  await evalInPage(`(() => {
    // Call existing applyLanguage('hi')
    const select = document.querySelector('#appLanguage');
    if (select) {
      select.value = 'hi';
      select.dispatchEvent(new Event('change'));
    }
  })()`);
  await sleep(600);

  const i18nAudit = await evalInPage(`(() => {
    // Check all visible text nodes in the DOM to see how many English strings remain
    const untranslated = [];
    const elementsToCheck = [
      { sel: '#welcomeGreeting', desc: 'Welcome Greeting' },
      { sel: '#welcomeHealthId', desc: 'Welcome Health ID' },
      { sel: '#settingsBtn', desc: 'Settings Button' },
      { sel: '.id-pass-brand', desc: 'ID Card Brand' },
      { sel: '#displayId', desc: 'ID Card Health ID' },
      { sel: '#qrBtn small', desc: 'ID Card Share text' },
      { sel: '.emergency-bar-header h3', desc: 'Emergency Card Header' },
      { sel: '#emergencyBtn', desc: 'Emergency Details Button' },
      { sel: '#callEmergencyBtn', desc: 'Call Emergency Contact Button' },
      { sel: '#editEmergencyContactBtn', desc: 'Add / Edit Contact Button' },
      { sel: '#emergencyContactDisplay', desc: 'Emergency Contact Status' },
      { sel: '.appointments-card h3', desc: 'Appointments Header' },
      { sel: '#btnManageAppointments', desc: 'Add Appointment Button' },
      { sel: '.prescriptions-card h3', desc: 'Prescriptions Header' },
      { sel: '#btnManagePrescriptions', desc: 'Add Medicine Button' },
      { sel: '.documents-card h3', desc: 'Documents Header' },
      { sel: '#btnManageDocuments', desc: 'Upload Document Button' },
      { sel: '.quick-actions-card h3', desc: 'Quick Actions Header' },
      { sel: '.quick-actions-card .badge', desc: 'Quick Actions Badge' },
      { sel: '.ice-card h3', desc: 'ICE Card Header' },
      { sel: '.ice-card p', desc: 'ICE Card Description' },
      { sel: '#editEmergencyContactBtnSide', desc: 'ICE Card Action Button' },
      { sel: '.hospitals-card h3', desc: 'Nearby Hospitals Header' },
      { sel: '#findHospitalsBtn', desc: 'Find Hospitals Button' },
      { sel: '#openHospitalMapBtn', desc: 'Open Maps Button' },
      { sel: '#hospitalStatus', desc: 'Hospital Status Muted' },
      { sel: '.privacy-guarantee-card h3', desc: 'Privacy Guarantee Header' },
      { sel: '.privacy-guarantee-card p', desc: 'Privacy Guarantee Paragraph' },
      { sel: '#btnLearnPrivacy', desc: 'Privacy Guarantee Link' },
      { sel: '#loginPanel h1', desc: 'Login Title' },
      { sel: 'label[for="loginEmail"]', desc: 'Login Email Label' },
      { sel: 'label[for="loginPassword"]', desc: 'Login Password Label' },
      { sel: '#forgotBtn', desc: 'Forgot Password Link' },
      { sel: '#showRegister', desc: 'New Patient Link' },
      { sel: '#btnFillDemoCreds', desc: 'Fill Demo Creds Button' },
      { sel: '#topMenu #menuProfile', desc: 'Menu Profile' },
      { sel: '#topMenu #editBtn', desc: 'Menu Edit Profile' },
      { sel: '#topMenu #menuPersonal', desc: 'Menu Personal Identity' },
      { sel: '#topMenu #menuInstallApp', desc: 'Menu Install App' },
      { sel: '#topMenu #privacyBtn', desc: 'Menu Privacy' },
      { sel: '#topMenu #logoutBtn', desc: 'Menu Logout' },
      { sel: '.bottom-nav button[data-nav="Home"]', desc: 'Bottom Nav Home' },
      { sel: '.bottom-nav button[data-nav="Records"]', desc: 'Bottom Nav Records' },
      { sel: '.bottom-nav button[data-nav="Scan"]', desc: 'Bottom Nav Scan' },
      { sel: '.bottom-nav button[data-nav="Profile"]', desc: 'Bottom Nav Profile' }
    ];

    const results = [];
    for (const item of elementsToCheck) {
      const el = document.querySelector(item.sel);
      if (el) {
        const text = el.textContent.trim().replace(/\\s+/g, ' ');
        results.push({ desc: item.desc, text });
      }
    }
    return results;
  })()`);

  console.log(`Audited ${i18nAudit.length} key elements after switching to Hindi:`);
  for (const item of i18nAudit) {
    console.log(`  - ${item.desc}: "${item.text}"`);
  }

  await captureScreenshot(path.join(SCREENSHOT_DIR, 'before_hindi_switch_dashboard.png'));

  // Cleanup
  await sendPage('Page.close');
  ws.close();
  chromeProc.kill();
  server.close();
  console.log('\nDiagnostic complete. Before screenshots saved.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
