import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9230;
const SERVER_PORT = 4187;
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
  console.log(`Local test server running on http://127.0.0.1:${SERVER_PORT}`);

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

  async function captureScreenshot(filePath) {
    const res = await sendPage('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.result.data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`📸 Screenshot saved: ${path.basename(filePath)} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  await sendPage('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/index.html` });
  await sleep(2000);

  // Setup synthetic authenticated patient state
  await evalInPage(`(() => {
    document.querySelector('#splashScreen')?.classList.add('hidden');
    document.querySelector('#authScreen')?.classList.add('hidden');
    document.querySelector('#appScreen')?.classList.remove('hidden');

    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    document.querySelector('#viewHome')?.classList.add('active');

    // Synthetic patient profile
    window.syntheticProfile = {
      id: 'demo-user-123',
      health_id: 'MK-884920',
      full_name: 'Rajesh Kumar',
      email: 'rajesh.kumar@medikey.local',
      blood_group: 'B+',
      age: 42,
      phone: '+91 98765 43210',
      allergies: 'Penicillin, Dust',
      chronic_conditions: 'Hypertension',
      current_medications: 'Amlodipine 5mg QD'
    };

    window.syntheticContact = {
      id: 'contact-1',
      name: 'Sunita Kumar',
      phone: '+91 98765 11111',
      relationship: 'Spouse',
      is_primary: true
    };

    // Populate patient info in English first
    if (document.querySelector('#displayName')) document.querySelector('#displayName').textContent = 'Rajesh Kumar';
    if (document.querySelector('#displayId')) document.querySelector('#displayId').textContent = 'Health ID: MK-884920';
    if (document.querySelector('#welcomeGreeting')) document.querySelector('#welcomeGreeting').textContent = 'Hello, Rajesh Kumar';
    if (document.querySelector('#avatar')) document.querySelector('#avatar').textContent = 'RK';

    const summary = document.querySelector('#emergencySummary');
    if (summary) summary.innerHTML = '<strong>ICE:</strong> Sunita Kumar (+91 98765 11111) &nbsp;|&nbsp; <strong>Allergies:</strong> Penicillin, Dust';

    const alerts = document.querySelector('#criticalAlerts');
    if (alerts) {
      alerts.innerHTML = '<span class="badge-tag blood">🩸 Blood: B+</span>' +
                         '<span class="badge-tag allergy">⚠️ Allergy: Penicillin, Dust</span>' +
                         '<span class="badge-tag condition">⚕️ Hypertension</span>';
    }

    const apts = document.querySelector('#homeAppointmentsPreview');
    if (apts) {
      apts.innerHTML = '<div class="mini-item-row" style="padding: 6px 0;"><div class="mini-item-content"><strong style="font-size: 0.9rem; color: var(--text-main);">🏥 Apollo Clinic</strong><p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">Date: <strong>2026-12-10</strong> · 10:30 AM · <em>Cardiology Review</em></p></div><button class="btn light sm" type="button">Details →</button></div>';
    }

    const rxs = document.querySelector('#homePrescriptionsPreview');
    if (rxs) {
      rxs.innerHTML = '<div style="display: flex; flex-direction: column; gap: 8px;"><div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border);"><div><strong style="font-size: 0.88rem; color: var(--text-main);">💊 Amlodipine 5mg</strong><div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 1px;">Once daily · After breakfast</div></div><small style="font-size: 0.72rem; color: var(--text-tertiary);">Dr. Mehta</small></div></div>';
    }
  })()`);

  console.log('\n======================================================================');
  console.log('   TASK 04: MANDATORY RESPONSIVE VIEWPORT TESTING (ENGLISH)           ');
  console.log('======================================================================');

  const viewports = [
    { w: 320, h: 568, name: '320 × 568 (iPhone SE)' },
    { w: 360, h: 800, name: '360 × 800 (Galaxy S20)' },
    { w: 375, h: 812, name: '375 × 812 (iPhone X/11)' },
    { w: 390, h: 844, name: '390 × 844 (iPhone 12/13/14)' },
    { w: 412, h: 915, name: '412 × 915 (Pixel 7)' },
    { w: 430, h: 932, name: '430 × 932 (iPhone 14 Pro Max)' },
    { w: 768, h: 1024, name: '768 × 1024 (iPad Portrait)' },
    { w: 1024, h: 768, name: '1024 × 768 (iPad Landscape)' },
    { w: 1440, h: 900, name: '1440 × 900 (Desktop HD)' }
  ];

  let allEnglishViewportsPassed = true;
  for (const vp of viewports) {
    await setViewport(vp.w, vp.h);
    await sleep(250);

    const overflowCheck = await evalInPage(`(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientW = doc.clientWidth;
      const overflow = scrollW - clientW;

      const qaGrid = document.querySelector('.quick-action-grid');
      const cols = qaGrid ? window.getComputedStyle(qaGrid).gridTemplateColumns.split(' ').length : 0;

      return { overflow, cols, scrollW, clientW };
    })()`);

    const passed = overflowCheck.overflow <= 0;
    if (!passed) allEnglishViewportsPassed = false;
    console.log(`[EN] ${vp.name.padEnd(30)} | Overflow: ${overflowCheck.overflow}px | QA Columns: ${overflowCheck.cols} | ${passed ? '✅ PASS' : '❌ FAIL'}`);

    if (vp.w === 390) {
      await captureScreenshot(path.join(SCREENSHOT_DIR, 'after_mobile_390_dashboard_en.png'));
    } else if (vp.w === 1440) {
      await captureScreenshot(path.join(SCREENSHOT_DIR, 'dashboard_desktop_1440_en.png'));
    }
  }

  console.log(`\nEnglish Responsive Viewports Result: ${allEnglishViewportsPassed ? '100% PASSED (0px overflow)' : 'FAILED'}`);

  console.log('\n======================================================================');
  console.log('   TASK 02 & 04: COMPLETE HINDI SWITCH & VIEWPORT AUDIT               ');
  console.log('======================================================================');

  // Trigger switch to Hindi
  await evalInPage(`(() => {
    const sel = document.querySelector('#appLanguage');
    if (sel) {
      sel.value = 'hi';
      sel.dispatchEvent(new Event('change'));
    }
  })()`);
  await sleep(600);

  let allHindiViewportsPassed = true;
  for (const vp of viewports) {
    await setViewport(vp.w, vp.h);
    await sleep(250);

    const overflowCheck = await evalInPage(`(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientW = doc.clientWidth;
      const overflow = scrollW - clientW;

      const qaGrid = document.querySelector('.quick-action-grid');
      const cols = qaGrid ? window.getComputedStyle(qaGrid).gridTemplateColumns.split(' ').length : 0;

      return { overflow, cols, scrollW, clientW };
    })()`);

    const passed = overflowCheck.overflow <= 0;
    if (!passed) allHindiViewportsPassed = false;
    console.log(`[HI] ${vp.name.padEnd(30)} | Overflow: ${overflowCheck.overflow}px | QA Columns: ${overflowCheck.cols} | ${passed ? '✅ PASS' : '❌ FAIL'}`);

    if (vp.w === 320) {
      await captureScreenshot(path.join(SCREENSHOT_DIR, 'viewports_320_mobile_hi.png'));
    } else if (vp.w === 390) {
      await captureScreenshot(path.join(SCREENSHOT_DIR, 'after_mobile_390_dashboard_hi.png'));
    } else if (vp.w === 1440) {
      await captureScreenshot(path.join(SCREENSHOT_DIR, 'dashboard_desktop_1440_hi.png'));
    }
  }

  console.log(`\nHindi Responsive Viewports Result: ${allHindiViewportsPassed ? '100% PASSED (0px overflow)' : 'FAILED'}`);

  console.log('\n======================================================================');
  console.log('   TASK 04: MISSING TRANSLATION AUDIT IN HINDI MODE                   ');
  console.log('======================================================================');

  const auditItems = await evalInPage(`(() => {
    const checks = [
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
      { sel: '#btnFillDemoCreds #txtFillDemoCreds', desc: 'Fill Demo Creds Button' },
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

    return checks.map(c => {
      const el = document.querySelector(c.sel);
      return {
        desc: c.desc,
        text: el ? el.textContent.trim().replace(/\\s+/g, ' ') : 'NOT FOUND'
      };
    });
  })()`);

  let untranslatedCount = 0;
  for (const item of auditItems) {
    // English detection check (ignoring brand and technical symbols)
    const isEnglishOnly = /^[A-Za-z0-9\s\.,\-\+\*—→↗🔒●🛡️📅💊📄⚡🚑🏥✎👤📲↪⌂📁📷♙⚙🚨]+$/.test(item.text) &&
      !item.text.includes('MediKey') &&
      !item.text.includes('MK-') &&
      !item.text.includes('112') &&
      item.desc !== 'ID Card Brand';

    console.log(`  ${isEnglishOnly ? '⚠️ UNTRANSLATED:' : '✅ TRANSLATED:'} [${item.desc}] -> "${item.text}"`);
    if (isEnglishOnly) untranslatedCount++;
  }

  console.log(`\nAudit Summary: ${auditItems.length - untranslatedCount}/${auditItems.length} elements properly localized in Hindi.`);

  console.log('\n======================================================================');
  console.log('   TESTING & CAPTURING MODALS IN ENGLISH & HINDI                      ');
  console.log('======================================================================');

  await setViewport(390, 844);

  // 1. Profile Overview Modal in Hindi
  await evalInPage(`(async () => {
    const m = await import('./js/profile.js');
    m.openViewProfileModal();
  })()`);
  await sleep(600);
  await captureScreenshot(path.join(SCREENSHOT_DIR, 'profile_overview_modal_hi.png'));

  // Close modal
  await evalInPage(`(async () => {
    const m = await import('./js/utils.js');
    m.closeModal();
  })()`);
  await sleep(400);

  // 2. Profile Overview Modal in English
  await evalInPage(`(async () => {
    const { applyLanguage, closeModal } = await import('./js/utils.js');
    applyLanguage('en');
    const pm = await import('./js/profile.js');
    pm.openViewProfileModal();
  })()`);
  await sleep(600);
  await captureScreenshot(path.join(SCREENSHOT_DIR, 'profile_overview_modal_en.png'));

  // Close modal and switch back to Hindi
  await evalInPage(`(async () => {
    const { applyLanguage, closeModal } = await import('./js/utils.js');
    closeModal();
    applyLanguage('hi');
  })()`);
  await sleep(400);

  // 3. Edit Profile Modal in Hindi
  await evalInPage(`(async () => {
    const m = await import('./js/profile.js');
    m.openEditProfileModal();
  })()`);
  await sleep(600);
  await captureScreenshot(path.join(SCREENSHOT_DIR, 'edit_profile_modal_hi.png'));

  await evalInPage(`(async () => {
    const m = await import('./js/utils.js');
    m.closeModal();
  })()`);
  await sleep(400);

  // 4. PVC Card Preview Modal in Hindi
  await evalInPage(`(async () => {
    const m = await import('./js/qr.js');
    const activeShare = { id: 'test-token', expires_at: new Date(Date.now() + 86400000).toISOString() };
    const shareUrl = 'https://medikey-app-lemon.vercel.app/#emergency-share=test-token';
    await m.openPVCCardModal(activeShare, shareUrl);
  })()`);
  await sleep(1200);
  await captureScreenshot(path.join(SCREENSHOT_DIR, 'pvc_card_modal_mobile_hi.png'));

  // 5. PVC Card Preview Modal in English
  await evalInPage(`(async () => {
    const { applyLanguage, closeModal } = await import('./js/utils.js');
    closeModal();
    applyLanguage('en');
    const qm = await import('./js/qr.js');
    const activeShare = { id: 'test-token', expires_at: new Date(Date.now() + 86400000).toISOString() };
    const shareUrl = 'https://medikey-app-lemon.vercel.app/#emergency-share=test-token';
    await qm.openPVCCardModal(activeShare, shareUrl);
  })()`);
  await sleep(1200);
  await captureScreenshot(path.join(SCREENSHOT_DIR, 'pvc_card_modal_mobile_en.png'));

  await evalInPage(`(async () => {
    const { applyLanguage, closeModal } = await import('./js/utils.js');
    closeModal();
    applyLanguage('en'); // Reset to default English
  })()`);
  await sleep(400);

  console.log('\n======================================================================');
  console.log('   LANGUAGE PERSISTENCE VERIFICATION                                 ');
  console.log('======================================================================');

  // Test language persistence in localStorage
  const persistenceTest = await evalInPage(`(async () => {
    const { applyLanguage } = await import('./js/utils.js');
    applyLanguage('hi');
    const stored = localStorage.getItem('medikey_lang');
    const htmlLang = document.documentElement.lang;
    return { stored, htmlLang };
  })()`);
  console.log(`Storage persistence check: localStorage='${persistenceTest.stored}', <html lang>='${persistenceTest.htmlLang}' -> ${persistenceTest.stored === 'hi' && persistenceTest.htmlLang === 'hi' ? '✅ PASS' : '❌ FAIL'}`);

  // Reload page to test restoration
  await sendPage('Page.reload');
  await sleep(2000);

  const reloadRestoration = await evalInPage(`(() => {
    const stored = localStorage.getItem('medikey_lang');
    const htmlLang = document.documentElement.lang;
    const homeNav = document.querySelector('.bottom-nav button[data-nav="Home"]')?.textContent.trim();
    return { stored, htmlLang, homeNav };
  })()`);
  console.log(`Reload restoration check: localStorage='${reloadRestoration.stored}', <html lang>='${reloadRestoration.htmlLang}', Home Nav='${reloadRestoration.homeNav}' -> ${reloadRestoration.stored === 'hi' && reloadRestoration.htmlLang === 'hi' ? '✅ PASS' : '❌ FAIL'}`);

  // Reset back to English
  await evalInPage(`(() => {
    import('./js/utils.js').then(m => m.applyLanguage('en'));
  })()`);

  // Cleanup
  await sendPage('Page.close');
  ws.close();
  chromeProc.kill();
  server.close();
  console.log('\nAll tests complete and screenshots captured successfully.');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
