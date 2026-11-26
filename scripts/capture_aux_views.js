import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const SCREENSHOT_DIR = 'C:\\Users\\Raj Kamal\\.gemini\\antigravity\\brain\\70219288-f5a5-4653-a9e3-3492c5555175\\screenshots';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
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
  const pages = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
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

  const fileUrl = 'file:///C:/Users/Raj Kamal/.gemini/antigravity/scratch/medikey/index.html';

  async function captureView(viewName, filename, extraSetup) {
    await sendPage('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await sendPage('Page.navigate', { url: fileUrl });
    await sleep(800);
    await sendPage('Runtime.evaluate', { expression: `(() => {
      document.querySelector('#splashScreen')?.classList.add('hidden');
      document.querySelector('#authScreen')?.classList.add('hidden');
      document.querySelector('#appScreen')?.classList.remove('hidden');

      document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
      document.querySelector('#${viewName}')?.classList.add('active');

      document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('active'));
      const navTarget = '${viewName.replace('view', '')}';
      document.querySelector('[data-nav=\"' + navTarget + '\"]')?.classList.add('active');

      const titles = { Records: 'Medical Records', Scan: 'Scan Emergency Pass', Profile: 'Profile & Settings' };
      if (document.querySelector('#topBarTitle')) document.querySelector('#topBarTitle').textContent = titles[navTarget] || 'MediKey';
      document.querySelector('#btnTopBack')?.classList.remove('hidden');

      ${extraSetup || ''}
    })()` });
    await sleep(400);

    const ss = await sendPage('Page.captureScreenshot', { format: 'png' });
    if (ss.result && ss.result.data) {
      const buf = Buffer.from(ss.result.data, 'base64');
      fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), buf);
      console.log(`Saved ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
    }
  }

  // 1. Records View
  await captureView('viewRecords', 'view_records_390.png', `
    const container = document.querySelector('#recordsListContainer');
    if (container) {
      container.innerHTML = \`
        <div class="crud-list">
          <div class="crud-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span class="badge" style="background:var(--primary-light); color:var(--primary-dark);">Hospital Record</span>
              <small style="color:var(--text-secondary);">Nov 24, 2026</small>
            </div>
            <div class="crud-card-body">
              <strong>Annual Comprehensive Health Evaluation</strong>
              <p>Metropolitan Medical Center · Dr. Sarah Jenkins (Cardiology)</p>
            </div>
            <div class="crud-card-actions">
              <button class="btn light sm" type="button">📄 View Document</button>
              <button class="btn secondary sm" type="button">⬇ Download</button>
            </div>
          </div>
          <div class="crud-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span class="badge" style="background:#E0F2FE; color:#0369A1;">Prescription</span>
              <small style="color:var(--text-secondary);">Nov 18, 2026</small>
            </div>
            <div class="crud-card-body">
              <strong>Insulin Glargine 100 units/mL</strong>
              <p>Dosage: 20 units SC daily at bedtime · 90-day refill verified</p>
            </div>
            <div class="crud-card-actions">
              <button class="btn light sm" type="button">✎ Edit Details</button>
            </div>
          </div>
        </div>
      \`;
    }
  `);

  // 2. Scan View
  await captureView('viewScan', 'view_scan_390.png', '');

  // 3. Profile View
  await captureView('viewProfile', 'view_profile_390.png', `
    if (document.querySelector('#profileTabName')) document.querySelector('#profileTabName').textContent = 'Alex Morgan';
    if (document.querySelector('#profileTabId')) document.querySelector('#profileTabId').textContent = 'Health ID: MK-D30A8E';
    if (document.querySelector('#profileTabAvatar')) document.querySelector('#profileTabAvatar').textContent = 'AM';
  `);

  pageWs.close();
  ws.close();
  chromeProc.kill();
  console.log('All auxiliary views captured!');
}

main().catch(console.error);
