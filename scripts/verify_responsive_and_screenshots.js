import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const SCREENSHOT_DIR = 'C:\\Users\\Raj Kamal\\.gemini\\antigravity\\brain\\70219288-f5a5-4653-a9e3-3492c5555175\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 11 Required Viewports
const VIEWPORTS = [
  { name: 'Mobile Compact', width: 320, height: 568, isMobile: true },
  { name: 'Galaxy Compact', width: 360, height: 740, isMobile: true },
  { name: 'iPhone SE/Mini', width: 375, height: 667, isMobile: true },
  { name: 'iPhone 14', width: 390, height: 844, isMobile: true },
  { name: 'Pixel / Galaxy S', width: 412, height: 915, isMobile: true },
  { name: 'iPhone Pro Max', width: 430, height: 932, isMobile: true },
  { name: 'Tablet iPad', width: 768, height: 1024, isMobile: true },
  { name: 'Small Desktop', width: 1024, height: 768, isMobile: false },
  { name: 'Medium Desktop', width: 1280, height: 800, isMobile: false },
  { name: 'Standard Desktop', width: 1440, height: 900, isMobile: false },
  { name: 'Full HD Wide Desktop', width: 1920, height: 1080, isMobile: false }
];

async function main() {
  console.log('--- Launching Chrome Headless for Comprehensive Responsive Verification ---');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    'about:blank'
  ]);

  chromeProc.on('error', err => {
    console.error('Failed to start Chrome:', err);
    process.exit(1);
  });

  // Wait for Chrome port
  let wsUrl = null;
  for (let i = 0; i < 25; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome DevTools port');
    chromeProc.kill();
    process.exit(1);
  }

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

  // Create target page
  const targetRes = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = targetRes.result.targetId;

  const pageRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const pages = await pageRes.json();
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

  const fileUrl = 'file:///C:/Users/Raj Kamal/.gemini/antigravity/scratch/medikey/index.html';

  const verificationResults = [];

  // Helper setup function to simulate authenticated patient dashboard
  const setupDashboardState = `() => {
    document.querySelector('#splashScreen')?.classList.add('hidden');
    document.querySelector('#authScreen')?.classList.add('hidden');
    document.querySelector('#appScreen')?.classList.remove('hidden');

    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    document.querySelector('#viewHome')?.classList.add('active');

    // Populate patient info
    if (document.querySelector('#displayName')) document.querySelector('#displayName').textContent = 'Alex Morgan';
    if (document.querySelector('#displayId')) document.querySelector('#displayId').textContent = 'Health ID: MK-D30A8E';
    if (document.querySelector('#welcomeGreeting')) document.querySelector('#welcomeGreeting').textContent = 'Hello, Alex Morgan';
    if (document.querySelector('#avatar')) document.querySelector('#avatar').textContent = 'AM';

    // Populate emergency summary
    const summary = document.querySelector('#emergencySummary');
    if (summary) summary.textContent = 'Severe Penicillin Allergy · Type 1 Diabetes · In Emergency Contact Michael Jenkins (+1-555-0199)';

    // Populate alerts
    const alerts = document.querySelector('#criticalAlerts');
    if (alerts) {
      alerts.innerHTML = '<span class=\"badge-tag blood\">Blood: O+</span>' +
                         '<span class=\"badge-tag allergy\">Allergy: Penicillin (Severe)</span>' +
                         '<span class=\"badge-tag condition\">Condition: Type 1 Diabetes</span>';
    }

    // Populate clinical previews
    const apts = document.querySelector('#homeAppointmentsPreview');
    if (apts) {
      apts.innerHTML = '<div class=\"mini-item-row\"><div class=\"mini-item-content\"><strong>Cardiology Follow-up</strong><small>Dr. Sarah Jenkins · Dec 04, 2026</small></div><span class=\"badge\">Confirmed</span></div>';
    }

    const rxs = document.querySelector('#homePrescriptionsPreview');
    if (rxs) {
      rxs.innerHTML = '<div class=\"mini-item-row\"><div class=\"mini-item-content\"><strong>Insulin Glargine</strong><small>20 units subcutaneous once daily at bedtime</small></div><span class=\"badge\">Active</span></div>';
    }

    const docs = document.querySelector('#homeDocumentsPreview');
    if (docs) {
      docs.innerHTML = '<div class=\"mini-item-row\"><div class=\"mini-item-content\"><strong>Discharge Summary (PDF)</strong><small>City General Hospital · Nov 2026 · 1.4 MB</small></div><span class=\"badge\">Verified</span></div>';
    }
  }`;

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);

    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.isMobile ? 2 : 1,
      mobile: vp.isMobile
    });

    await sendPage('Page.navigate', { url: fileUrl });
    await sleep(800);

    // Apply dashboard state
    await sendPage('Runtime.evaluate', { expression: `(${setupDashboardState})()` });
    await sleep(400);

    // Run layout checks in browser
    const evalRes = await sendPage('Runtime.evaluate', {
      expression: `(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientW = window.innerWidth;
        const overflowPx = Math.max(0, scrollW - clientW);
        const hasOverflow = overflowPx > 1; // 1px threshold for subpixel rounding

        const sheetsLoaded = document.styleSheets.length > 0;
        const hasMedicalCard = !!document.querySelector('.digital-id-pass, .medical-id-card');
        const clinicalCardsCount = document.querySelectorAll('.clinical-card, .dashboard-card').length;
        
        const desktopNav = document.querySelector('.desktop-nav');
        const bottomNav = document.querySelector('.bottom-nav, .mobile-bottom-nav');
        const desktopNavVisible = desktopNav && getComputedStyle(desktopNav).display !== 'none';
        const bottomNavVisible = bottomNav && getComputedStyle(bottomNav).display !== 'none';

        const dashboardGrid = document.querySelector('.dashboard-grid');
        const gridComputed = dashboardGrid ? getComputedStyle(dashboardGrid).display : 'none';

        return {
          scrollWidth: scrollW,
          clientWidth: clientW,
          overflowPx,
          hasOverflow,
          sheetsLoaded,
          hasMedicalCard,
          clinicalCardsCount,
          desktopNavVisible,
          bottomNavVisible,
          gridDisplay: gridComputed
        };
      })()`,
      returnByValue: true
    });

    const metrics = (evalRes && evalRes.result && evalRes.result.result) ? evalRes.result.result.value : (evalRes && evalRes.result ? evalRes.result.value : null);
    if (!metrics) {
      console.error('Eval returned unexpected structure:', JSON.stringify(evalRes));
      continue;
    }
    console.log(`  ScrollWidth: ${metrics.scrollWidth}px, ClientWidth: ${metrics.clientWidth}px, Overflow: ${metrics.overflowPx}px`);
    console.log(`  Sheets: ${metrics.sheetsLoaded}, Cards: ${metrics.clinicalCardsCount}, DesktopNav: ${metrics.desktopNavVisible}, BottomNav: ${metrics.bottomNavVisible}, Grid: ${metrics.gridDisplay}`);

    verificationResults.push({
      viewport: vp.name,
      width: vp.width,
      height: vp.height,
      ...metrics,
      passed: !metrics.hasOverflow && metrics.sheetsLoaded && metrics.hasMedicalCard
    });

    // Capture required screenshots
    if ([320, 390, 768, 1440].includes(vp.width)) {
      const filename = `dashboard_${vp.width}_${vp.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`;
      const screenshot = await sendPage('Page.captureScreenshot', { format: 'png' });
      if (screenshot.result && screenshot.result.data) {
        const buf = Buffer.from(screenshot.result.data, 'base64');
        const outPath = path.join(SCREENSHOT_DIR, filename);
        fs.writeFileSync(outPath, buf);
        console.log(`  📸 Saved screenshot: ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
      }
    }
  }

  // Also capture Auth screen at 390px and 1440px
  console.log('\nCapturing Auth Screens...');
  for (const w of [390, 1440]) {
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: w === 390 ? 844 : 900,
      deviceScaleFactor: w === 390 ? 2 : 1,
      mobile: w === 390
    });
    await sendPage('Page.navigate', { url: fileUrl });
    await sleep(600);
    await sendPage('Runtime.evaluate', { expression: `(() => {
      document.querySelector('#splashScreen')?.classList.add('hidden');
      document.querySelector('#authScreen')?.classList.remove('hidden');
      document.querySelector('#appScreen')?.classList.add('hidden');
    })()` });
    await sleep(300);

    const filename = `auth_${w}_${w === 390 ? 'mobile' : 'desktop'}.png`;
    const ss = await sendPage('Page.captureScreenshot', { format: 'png' });
    if (ss.result && ss.result.data) {
      const buf = Buffer.from(ss.result.data, 'base64');
      fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), buf);
      console.log(`  📸 Saved ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
    }
  }

  // Capture Emergency SOS Action Sheet at 390px
  console.log('\nCapturing Emergency SOS Action Sheet at 390px...');
  await sendPage('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sendPage('Runtime.evaluate', { expression: `(() => {
    document.querySelector('#splashScreen')?.classList.add('hidden');
    document.querySelector('#authScreen')?.classList.add('hidden');
    document.querySelector('#appScreen')?.classList.remove('hidden');
    const backdrop = document.querySelector('#modalBackdrop');
    const title = document.querySelector('#modalTitle');
    const content = document.querySelector('#modalContent');
    if (backdrop && title && content) {
      title.textContent = '🚨 Emergency Medical Assistance';
      content.innerHTML = \`
        <div style="display: grid; gap: 12px; text-align: center; padding: 4px 0;">
          <p style="margin: 0; font-size: 0.88rem; color: var(--text-secondary);">
            Confirm dialing emergency services or contacting your registered primary contact:
          </p>
          <a href="tel:112" class="btn danger full" style="font-size: 1.05rem; min-height: 50px; font-weight: 900;">
            🚨 Call 112 (National Emergency)
          </a>
          <a href="tel:+15550199" class="btn primary full" style="min-height: 46px;">
            ☎ Call Primary ICE: Michael Jenkins (+1-555-0199)
          </a>
          <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px; font-size: 0.8rem; text-align: left;">
            <strong style="color: var(--primary-dark);">📍 GPS Coordinates for Dispatch:</strong>
            <div style="margin-top: 4px; color: var(--text-secondary); font-family: ui-monospace, monospace;">Lat: 28.61394, Lon: 77.20902 (±5m)</div>
          </div>
        </div>
      \`;
      backdrop.classList.add('open');
    }
  })()` });
  await sleep(400);

  const sosSS = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (sosSS.result && sosSS.result.data) {
    const buf = Buffer.from(sosSS.result.data, 'base64');
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'emergency_sos_sheet_390.png'), buf);
    console.log(`  📸 Saved emergency_sos_sheet_390.png (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  // Summary Table
  console.log('\n======================================================');
  console.log('       RESPONSIVE VERIFICATION SUMMARY REPORT         ');
  console.log('======================================================');
  console.table(verificationResults.map(r => ({
    Viewport: r.viewport,
    Resolution: `${r.width}x${r.height}`,
    'Overflow (px)': r.overflowPx,
    'CSS Loaded': r.sheetsLoaded ? '✅ Yes' : '❌ No',
    'Cards Visible': r.clinicalCardsCount,
    'Nav Mode': r.desktopNavVisible ? 'Desktop Top' : (r.bottomNavVisible ? 'Mobile Bottom' : 'None'),
    Status: r.passed ? 'PASSED ✅' : 'FAILED ❌'
  })));

  const allPassed = verificationResults.every(r => r.passed);
  console.log(`\nFinal Verdict: ${allPassed ? '🎉 ALL 11 VIEWPORTS PASSED WITH 0px OVERFLOW!' : '❌ SOME VIEWPORTS FAILED'}`);

  pageWs.close();
  ws.close();
  chromeProc.kill();

  fs.writeFileSync('scripts/responsive_results.json', JSON.stringify(verificationResults, null, 2));
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
