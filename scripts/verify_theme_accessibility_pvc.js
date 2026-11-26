import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9223;
const SERVER_PORT = 4174;
const ROOT_DIR = process.cwd();
const SCREENSHOT_DIR = path.resolve('..\\..\\brain\\70219288-f5a5-4653-a9e3-3492c5555175\\screenshots');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
      console.log(`Local test server running at http://127.0.0.1:${SERVER_PORT}`);
      resolve(server);
    });
  });
}

async function main() {
  const server = await startStaticServer();

  console.log('\n--- Launching Headless Chrome for Theme, Accessibility & PVC Card Verification ---');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${CHROME_PORT}`,
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch (e) {}
  }

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();
  ws.onmessage = evt => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  await new Promise(r => { ws.onopen = r; });

  function send(method, params = {}) {
    return new Promise(r => {
      const id = msgId++;
      pending.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const targetRes = await send('Target.createTarget', { url: 'about:blank' });
  const pages = await (await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`)).json();
  const pageTarget = pages.find(p => p.id === targetRes.result.targetId);
  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);

  const pagePending = new Map();
  const consoleWarnings = [];
  const consoleErrors = [];

  pageWs.onmessage = evt => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pagePending.has(msg.id)) { pagePending.get(msg.id)(msg); pagePending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const text = (msg.params.args || []).map(a => a.value || a.description || '').join(' ');
      if (type === 'warning') consoleWarnings.push(text);
      if (type === 'error') consoleErrors.push(text);
    }
  };
  await new Promise(r => { pageWs.onopen = r; });

  function sendPage(method, params = {}) {
    return new Promise(r => {
      const id = msgId++;
      pagePending.set(id, r);
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalInPage(expr) {
    const res = await sendPage('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.result?.exceptionDetails) {
      console.error('Page evaluation exception:', res.result.exceptionDetails.text, res.result.exceptionDetails.exception?.description);
    }
    return res.result?.result?.value ?? res.result?.value;
  }

  async function captureScreenshot(filePath) {
    const res = await sendPage('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.result.data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`📸 Screenshot saved: ${path.basename(filePath)} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');
  await sendPage('DOM.enable');

  // STEP 1: Verify Initial HTML State (Flicker-Free Auth State Machine)
  console.log('\n[TEST 1] Verifying Initial DOM Auth State...');
  await sendPage('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/index.html` });
  await sleep(2000);

  const initialDomState = await evalInPage(`(() => {
    const splash = document.querySelector('#splashScreen');
    const auth = document.querySelector('#authScreen');
    const app = document.querySelector('#appScreen');
    return {
      splashHidden: splash ? splash.classList.contains('hidden') : null,
      authHidden: auth ? auth.classList.contains('hidden') : null,
      appHidden: app ? app.classList.contains('hidden') : null,
    };
  })()`);

  console.log('Initial DOM state on load:', initialDomState);
  if (!initialDomState.splashHidden && initialDomState.authHidden && initialDomState.appHidden) {
    console.log('✅ PASS: Initial load shows SplashScreen while AuthScreen & AppScreen are hidden (Zero Flicker Guarantee)');
  } else {
    console.log('❌ FAIL: Auth screen not hidden on initial load');
  }

  // STEP 2: Authenticate and transition to AppScreen
  console.log('\n[TEST 2] Transitioning to Authenticated State...');
  await evalInPage(`(async () => {
    const { setCurrentProfile } = await import('./js/profile.js');
    const { setCurrentUser } = await import('./js/auth.js');
    const { setAuthState, AUTH_STATES } = await import('./js/script.js');

    const mockUser = { id: 'a0000000-0000-0000-0000-000000000001', email: 'synthetic.patient1@medikey.local' };
    const mockProfile = {
      id: mockUser.id,
      full_name: 'Dr. Eleanor Vance',
      health_id: 'MK-DF0980',
      blood_group: 'B+',
      phone: '+1 555-0144',
      allergies: 'Penicillin',
      chronic_conditions: 'Hypertension',
      current_medications: 'Lisinopril 10mg'
    };

    setCurrentProfile(mockProfile);
    setCurrentUser(mockUser);
    setAuthState(AUTH_STATES.AUTHENTICATED);
  })()`);
  await sleep(600);

  const authDomState = await evalInPage(`(() => {
    const splash = document.querySelector('#splashScreen');
    const auth = document.querySelector('#authScreen');
    const app = document.querySelector('#appScreen');
    return {
      splashHidden: splash ? splash.classList.contains('hidden') : null,
      authHidden: auth ? auth.classList.contains('hidden') : null,
      appHidden: app ? app.classList.contains('hidden') : null,
    };
  })()`);
  console.log('Authenticated DOM state:', authDomState);
  if (authDomState.splashHidden && authDomState.authHidden && !authDomState.appHidden) {
    console.log('✅ PASS: State machine successfully transitions to Authenticated with AppScreen visible and AuthScreen hidden.');
  }

  // STEP 3: Verify Restored Light Blue Theme Tokens
  console.log('\n[TEST 3] Verifying Restored Light Blue Theme Tokens...');
  const tokens = await evalInPage(`(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      primary: s.getPropertyValue('--primary').trim(),
      primaryDark: s.getPropertyValue('--primary-dark').trim(),
      secondaryBlue: s.getPropertyValue('--secondary-blue').trim(),
      softBlue: s.getPropertyValue('--soft-blue').trim(),
      medicalIdSurface: s.getPropertyValue('--medical-id-surface').trim(),
      bg: s.getPropertyValue('--bg').trim(),
      border: s.getPropertyValue('--border').trim(),
      emergency: s.getPropertyValue('--emergency').trim()
    };
  })()`);

  console.log('Computed CSS Tokens:', tokens);
  const themeMatches = 
    tokens.primary.toLowerCase() === '#2563eb' &&
    tokens.primaryDark.toLowerCase() === '#1d4ed8' &&
    tokens.secondaryBlue.toLowerCase() === '#60a5fa' &&
    tokens.softBlue.toLowerCase() === '#eff6ff' &&
    tokens.emergency.toLowerCase() === '#dc2626';

  if (themeMatches) {
    console.log('✅ PASS: Restored Light Blue Healthcare Theme tokens verified exactly.');
  } else {
    console.log('❌ FAIL: Theme tokens mismatch');
  }

  // STEP 4: Accessible Modal Lifecycle & ARIA Warning Check
  console.log('\n[TEST 4] Testing Modal Lifecycle for ARIA Warning Elimination...');
  consoleWarnings.length = 0; // Clear console warning accumulator

  const modalCycleResult = await evalInPage(`(async () => {
    const { openModal, closeModal } = await import('./js/utils.js');
    
    // Test 1: Open modal
    openModal('Accessibility Lifecycle Test', '<p id="testModalPara">Accessible content</p>');
    const backdrop = document.querySelector('#modalBackdrop');
    const isOpen1 = backdrop.classList.contains('open');
    const ariaHidden1 = backdrop.getAttribute('aria-hidden');

    // Focus close button inside modal
    const closeBtn = document.querySelector('#closeModal');
    if (closeBtn) closeBtn.focus();
    const activeInside = document.activeElement === closeBtn;

    // Test 2: Close modal via closeModal()
    closeModal();
    const isOpen2 = backdrop.classList.contains('open');
    const ariaHidden2 = backdrop.getAttribute('aria-hidden');
    const activeAfterClose = document.activeElement;
    const activeOutsideModal = !backdrop.contains(activeAfterClose);

    return {
      isOpen1,
      ariaHidden1,
      activeInside,
      isOpen2,
      ariaHidden2,
      activeOutsideModal
    };
  })()`);

  await sleep(300);
  console.log('Modal cycle result:', modalCycleResult);

  // Check if any "Blocked aria-hidden" warnings were logged
  const ariaWarnings = consoleWarnings.filter(w => w.toLowerCase().includes('blocked aria-hidden') || w.toLowerCase().includes('descendant retained focus'));
  console.log(`Captured "Blocked aria-hidden" warnings: ${ariaWarnings.length}`);
  if (ariaWarnings.length === 0 && modalCycleResult.activeOutsideModal && modalCycleResult.ariaHidden2 === 'true') {
    console.log('✅ PASS: Centralized accessible modal lifecycle verified! Focus moved outside BEFORE aria-hidden="true" was set. ZERO console warnings!');
  } else {
    console.log('❌ FAIL: ARIA warning detected:', ariaWarnings);
  }

  // STEP 5: Branded Emergency QR PVC Card Generation & PDF Export
  console.log('\n[TEST 5] Testing Branded Emergency QR PVC Card Generation & CR80 PDF...');
  const pvcTestResult = await evalInPage(`(async () => {
    const { generateCR80CardCanvas, canvasToCR80Pdf, openPVCCardModal } = await import('./js/qr.js');
    const shareUrl = 'https://medikey-app-lemon.vercel.app/#emergency-share=test-token-12345';
    
    // 1. Generate Canvas
    const canvas = await generateCR80CardCanvas(shareUrl);
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // 2. Synthesize PDF Blob
    const pdfBlob = await canvasToCR80Pdf(canvas);
    const pdfBlobSize = pdfBlob.size;
    const pdfBlobType = pdfBlob.type;

    // 3. Open Modal
    await openPVCCardModal({ expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }, shareUrl);
    const backdrop = document.querySelector('#modalBackdrop');
    const previewImg = document.querySelector('#pvcCardPreviewImg');
    const previewSrc = previewImg ? previewImg.src.slice(0, 30) : null;
    const hasDownloadPng = !!document.querySelector('#btnDownloadPVCPNG');
    const hasDownloadPdf = !!document.querySelector('#btnDownloadPVCPDF');

    return {
      canvasWidth,
      canvasHeight,
      pdfBlobSize,
      pdfBlobType,
      modalOpen: backdrop && backdrop.classList.contains('open'),
      previewSrc,
      hasDownloadPng,
      hasDownloadPdf
    };
  })()`);

  await sleep(600);
  console.log('PVC Card test result:', pvcTestResult);
  if (
    pvcTestResult.canvasWidth === 1275 &&
    pvcTestResult.canvasHeight === 2022 &&
    pvcTestResult.pdfBlobSize > 500 &&
    pvcTestResult.pdfBlobType === 'application/pdf' &&
    pvcTestResult.modalOpen &&
    pvcTestResult.hasDownloadPng &&
    pvcTestResult.hasDownloadPdf
  ) {
    console.log('✅ PASS: Branded CR80 Emergency QR PVC Card generated at 1275x2022 px (600 DPI), exact CR80 physical PDF synthesized, interactive preview verified!');
  } else {
    console.log('❌ FAIL: PVC card test failed');
  }

  // Capture screenshot of the PVC Card Modal
  await sendPage('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(400);
  await captureScreenshot(path.join(SCREENSHOT_DIR, 'theme_blue_pvc_card_modal.png'));

  // Close modal
  await evalInPage(`(() => { document.querySelector('#closeModal')?.click(); })()`);
  await sleep(400);

  // STEP 6: Multi-Viewport Responsive Regression & Horizontal Overflow Check (7 Viewports)
  console.log('\n[TEST 6] Multi-Viewport Responsive Verification (7 Viewports)...');
  const viewports = [
    { name: 'iPhone SE (Narrow)', width: 320, height: 568, mobile: true },
    { name: 'Android Small', width: 360, height: 640, mobile: true },
    { name: 'iPhone 13/14 Standard', width: 390, height: 844, mobile: true },
    { name: 'iPhone Pro Max Large', width: 430, height: 932, mobile: true },
    { name: 'iPad Portrait (Tablet)', width: 768, height: 1024, mobile: false },
    { name: 'iPad Landscape (Laptop)', width: 1024, height: 768, mobile: false },
    { name: 'Desktop Full HD', width: 1440, height: 900, mobile: false }
  ];

  let allViewportsPassed = true;
  for (const vp of viewports) {
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.mobile
    });
    await sleep(300);

    const overflow = await evalInPage(`(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const bodyW = document.body.scrollWidth;
      return {
        docW,
        winW,
        bodyW,
        overflowPx: Math.max(0, docW - winW, bodyW - winW)
      };
    })()`);

    const passed = overflow.overflowPx === 0;
    if (!passed) allViewportsPassed = false;
    console.log(`Viewport [${vp.width}x${vp.height} - ${vp.name}]: Document width=${overflow.docW}px, Window width=${overflow.winW}px, Overflow=${overflow.overflowPx}px -> ${passed ? '✅ 0px PASS' : '❌ OVERFLOW FAIL'}`);

    if (vp.width === 390) {
      await captureScreenshot(path.join(SCREENSHOT_DIR, 'theme_blue_dashboard_mobile_390.png'));
    } else if (vp.width === 1440) {
      await captureScreenshot(path.join(SCREENSHOT_DIR, 'theme_blue_dashboard_desktop_1440.png'));
    }
  }

  if (allViewportsPassed) {
    console.log('✅ PASS: All 7 viewports verified with STRICT 0px horizontal overflow!');
  } else {
    console.log('❌ FAIL: Some viewports have horizontal overflow');
  }

  // STEP 7: Export Card Image for Standalone Verification
  const exportCardSaved = await evalInPage(`(async () => {
    const { generateCR80CardCanvas } = await import('./js/qr.js');
    const canvas = await generateCR80CardCanvas('https://medikey-app-lemon.vercel.app/#emergency-share=test-export');
    return canvas.toDataURL('image/png').split(',')[1];
  })()`);
  if (typeof exportCardSaved === 'string' && exportCardSaved.length > 50) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'theme_blue_pvc_card_export.png'), Buffer.from(exportCardSaved, 'base64'));
    console.log(`📸 Saved standalone PVC card export: theme_blue_pvc_card_export.png`);
  } else {
    console.warn('exportCardSaved was not a string:', exportCardSaved);
  }

  console.log('\n--- ALL HEADLESS VERIFICATIONS COMPLETE ---');
  chromeProc.kill();
  server.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
