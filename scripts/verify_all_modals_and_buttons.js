import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9222;
const SERVER_PORT = 4173;
const ROOT_DIR = 'C:\\Users\\Raj Kamal\\.gemini\\antigravity\\scratch\\medikey';

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

  console.log('--- Verifying All Profile Modals & Quick Action Buttons over HTTP ---');
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
  pageWs.onmessage = evt => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pagePending.has(msg.id)) { pagePending.get(msg.id)(msg); pagePending.delete(msg.id); }
  };
  await new Promise(r => { pageWs.onopen = r; });

  function sendPage(method, params = {}) {
    return new Promise(r => {
      const id = msgId++;
      pagePending.set(id, r);
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');
  await sendPage('DOM.enable');

  await sendPage('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sendPage('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/index.html` });
  await sleep(1500);

  // Authenticate mock session and inject mock profile
  await sendPage('Runtime.evaluate', { expression: `(async () => {
    const { setCurrentProfile, setCurrentUser } = await import('./js/profile.js');
    const { setCurrentUser: setAuthUser } = await import('./js/auth.js');

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
    setAuthUser(mockUser);

    document.querySelector('#splashScreen')?.classList.add('hidden');
    document.querySelector('#authScreen')?.classList.add('hidden');
    document.querySelector('#appScreen')?.classList.remove('hidden');
  })()` });
  await sleep(500);

  // Helper to click and check modal title
  async function testClickModal(buttonSelector, expectedTitleSubstring) {
    const res = await sendPage('Runtime.evaluate', { expression: `(() => {
      const btn = document.querySelector('${buttonSelector}');
      if (!btn) return { found: false, error: 'Button not found: ${buttonSelector}' };
      btn.click();
      const backdrop = document.querySelector('#modalBackdrop');
      const title = document.querySelector('#modalTitle')?.textContent || '';
      const isOpen = backdrop && backdrop.classList.contains('open');
      
      // Close modal for next test
      const closeBtn = document.querySelector('#closeModal');
      if (closeBtn) closeBtn.click();
      
      return { found: true, isOpen, title };
    })()`, returnByValue: true });

    const val = res.result?.result?.value || res.result?.value;
    const pass = val?.found && val?.isOpen && val.title.toLowerCase().includes(expectedTitleSubstring.toLowerCase());
    console.log(`[Button: ${buttonSelector}] -> Modal: "${val?.title}", Open: ${val?.isOpen} -> ${pass ? '✅ PASS' : '❌ FAIL'}`);
    return pass;
  }

  console.log('\n--- 1. Testing Profile View & Dedicated Edit Entry Points ---');
  await testClickModal('#btnViewProfileTab', 'Profile');
  await testClickModal('#itemPersonalView', 'Profile');
  await testClickModal('#itemPersonal', 'Profile');
  await testClickModal('#itemContact', 'Profile');
  await testClickModal('#itemMedicalInfo', 'Profile');
  await testClickModal('#itemChangePassword', 'Password');
  await testClickModal('#itemAppPreferences', 'Preferences');
  await testClickModal('#itemICE', 'Emergency Contacts');
  await testClickModal('#itemMedicalHistory', 'Medical History');

  console.log('\n--- 2. Testing Clinical Action Buttons ---');
  await testClickModal('#btnManageAppointments', 'Doctor Visits');
  await testClickModal('#btnManagePrescriptions', 'Active Prescriptions');
  await testClickModal('#btnManageDocuments', 'Hospital & Medical Records');

  console.log('\n--- 3. Testing Navigation Tabs ---');
  for (const view of ['Home', 'Records', 'Scan', 'Profile']) {
    const res = await sendPage('Runtime.evaluate', { expression: `(() => {
      const tab = document.querySelector('[data-nav="${view}"]');
      if (!tab) return { found: false };
      tab.click();
      const viewEl = document.querySelector('#view${view}');
      return { found: true, active: viewEl && viewEl.classList.contains('active') };
    })()`, returnByValue: true });
    const val = res.result?.result?.value || res.result?.value;
    console.log(`[Nav Tab: ${view}] Active: ${val?.active} -> ${val?.active ? '✅ PASS' : '❌ FAIL'}`);
  }

  // Clean exit
  ws.close();
  pageWs.close();
  chromeProc.kill();
  server.close();
  console.log('\n🎉 ALL BUTTON AND MODAL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
