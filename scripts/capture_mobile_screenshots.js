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

async function run() {
  console.log('--- Launching Chrome Headless with DevTools Protocol ---');
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

  // Wait for Chrome to listen on port 9222
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
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

  console.log('✅ Chrome DevTools connected:', wsUrl);

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

  // Create a new target page
  const targetRes = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = targetRes.result.targetId;

  // Connect to target
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

  async function captureDeviceScreenshot(deviceWidth, deviceHeight, filename, setupFn) {
    console.log(`\n📸 Capturing ${filename} (${deviceWidth}x${deviceHeight})...`);
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: deviceWidth,
      height: deviceHeight,
      deviceScaleFactor: 2,
      mobile: true
    });

    await sendPage('Page.navigate', { url: fileUrl });
    await sleep(1500); // Wait for scripts & local styles to load

    if (setupFn) {
      await sendPage('Runtime.evaluate', { expression: `(${setupFn.toString()})()` });
      await sleep(600);
    }

    const screenshot = await sendPage('Page.captureScreenshot', { format: 'png' });
    if (screenshot.result && screenshot.result.data) {
      const buf = Buffer.from(screenshot.result.data, 'base64');
      const outPath = path.join(SCREENSHOT_DIR, filename);
      fs.writeFileSync(outPath, buf);
      console.log(`✅ Saved: ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`❌ Screenshot failed for ${filename}`);
    }
  }

  try {
    // 1. Mobile Auth Screen (iPhone 14: 390x844)
    await captureDeviceScreenshot(390, 844, 'mobile_auth_390.png', () => {
      document.querySelector('#splashScreen')?.classList.add('hidden');
      document.querySelector('#authScreen')?.classList.remove('hidden');
    });

    // 2. Mobile Home Dashboard (Patient Alex Morgan)
    await captureDeviceScreenshot(390, 844, 'mobile_home_dashboard_390.png', () => {
      document.querySelector('#splashScreen')?.classList.add('hidden');
      document.querySelector('#authScreen')?.classList.add('hidden');
      document.querySelector('#appScreen')?.classList.remove('hidden');

      // Populate synthetic verified patient data
      if (document.querySelector('#welcomeGreeting')) document.querySelector('#welcomeGreeting').textContent = 'Hello, Alex';
      if (document.querySelector('#welcomeHealthId')) document.querySelector('#welcomeHealthId').textContent = 'Digital Healthcare Pass · Verified';
      if (document.querySelector('#displayName')) document.querySelector('#displayName').textContent = 'Alex Morgan';
      if (document.querySelector('#displayId')) document.querySelector('#displayId').textContent = 'Health ID: MK-D30A8E';
      if (document.querySelector('#avatar')) document.querySelector('#avatar').textContent = 'AM';

      const alerts = document.querySelector('#criticalAlerts');
      if (alerts) {
        alerts.innerHTML = `
          <span class="id-tag blood">🩸 Blood: O+</span>
          <span class="id-tag allergy">⚠️ Allergy: Penicillin, Peanuts</span>
          <span class="id-tag condition">⚕️ Asthma (Mild)</span>
        `;
      }

      const emSummary = document.querySelector('#emergencySummary');
      if (emSummary) emSummary.textContent = 'ICE: Michael Jenkins (+1-555-0199) · Allergies: Penicillin, Peanuts';

      const emContact = document.querySelector('#emergencyContactDisplay');
      if (emContact) emContact.textContent = 'Primary ICE: Michael Jenkins (+1-555-0199)';

      const callBtn = document.querySelector('#callEmergencyBtn');
      if (callBtn) {
        callBtn.href = 'tel:+15550199';
        callBtn.classList.remove('hidden');
      }

      // Render appointments preview
      const apt = document.querySelector('#homeAppointmentsPreview');
      if (apt) {
        apt.innerHTML = `
          <div class="mini-item-row" style="padding: 6px 0;">
            <div class="mini-item-content">
              <strong style="font-size: 0.9rem; color: var(--teal-900);">🏥 Apollo Healthcare City</strong>
              <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">
                Schedule: <strong>2026-12-05</strong> · 10:30 AM · Routine Pulmonary Review
              </p>
            </div>
            <span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:0.7rem;">Scheduled</span>
          </div>
        `;
      }

      // Render prescriptions preview
      const rx = document.querySelector('#homePrescriptionsPreview');
      if (rx) {
        rx.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
            <div>
              <strong style="font-size: 0.88rem; color: var(--teal-900);">💊 Salbutamol Inhaler</strong>
              <p style="margin: 1px 0 0; font-size: 0.78rem; color: var(--text-muted);">100 mcg · 2 puffs as needed · Dr. A. Sharma</p>
            </div>
            <span class="badge" style="background:#fdf2f8; color:#be185d; font-size:0.7rem;">Active</span>
          </div>
        `;
      }

      // Render documents preview
      const docs = document.querySelector('#homeDocumentsPreview');
      if (docs) {
        docs.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
            <div>
              <span class="record-badge medical" style="font-size: 0.65rem;">medical</span>
              <strong style="display:block; font-size: 0.86rem; color: var(--teal-900);">Discharge Summary & Pulmonary Evaluation.pdf</strong>
              <small style="color: var(--text-tertiary); font-size: 0.74rem;">342 KB · 2026-11-20</small>
            </div>
            <button class="btn light sm" type="button">View</button>
          </div>
        `;
      }
    });

    // 3. Mobile Medical Records Tab
    await captureDeviceScreenshot(390, 844, 'mobile_records_view_390.png', () => {
      document.querySelector('#splashScreen')?.classList.add('hidden');
      document.querySelector('#authScreen')?.classList.add('hidden');
      document.querySelector('#appScreen')?.classList.remove('hidden');

      // Switch to records view
      document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
      document.querySelector('#viewRecords')?.classList.add('active');

      document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-nav="Records"]')?.classList.add('active');

      if (document.querySelector('#topBarTitle')) document.querySelector('#topBarTitle').textContent = 'Health Records';
      document.querySelector('#btnTopBack')?.classList.remove('hidden');

      const container = document.querySelector('#recordsListContainer');
      if (container) {
        container.innerHTML = `
          <div class="crud-list">
            <div class="record-card">
              <div class="record-body">
                <span class="record-badge medical">HOSPITAL RECORD</span>
                <strong>📄 Pulmonary Function Test Report.pdf</strong>
                <p>Apollo Healthcare Center (280 KB)</p>
                <div class="record-meta">Date: 2026-11-20 · Signed Cloud Vault</div>
              </div>
              <div class="record-actions">
                <button class="btn light sm" type="button">View</button>
                <button class="btn danger sm" type="button">🗑</button>
              </div>
            </div>

            <div class="record-card">
              <div class="record-body">
                <span class="record-badge prescription">PRESCRIPTION</span>
                <strong>💊 Salbutamol Inhaler (100mcg)</strong>
                <p>2 puffs as needed for shortness of breath</p>
                <div class="record-meta">Prescribed by Dr. A. Sharma · Active</div>
              </div>
              <div class="record-actions">
                <button class="btn light sm" type="button">✎ Edit</button>
              </div>
            </div>

            <div class="record-card">
              <div class="record-body">
                <span class="record-badge labs">LAB REPORT</span>
                <strong>🧪 Complete Blood Count (CBC) & Serum IgE.pdf</strong>
                <p>Metropolis Diagnostic Labs (1.2 MB)</p>
                <div class="record-meta">Date: 2026-11-15 · Normal Eosinophils</div>
              </div>
              <div class="record-actions">
                <button class="btn light sm" type="button">View</button>
              </div>
            </div>
          </div>
        `;
      }
    });

    // 4. Mobile Profile & Settings Tab
    await captureDeviceScreenshot(390, 844, 'mobile_profile_view_390.png', () => {
      document.querySelector('#splashScreen')?.classList.add('hidden');
      document.querySelector('#authScreen')?.classList.add('hidden');
      document.querySelector('#appScreen')?.classList.remove('hidden');

      document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
      document.querySelector('#viewProfile')?.classList.add('active');

      document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-nav="Profile"]')?.classList.add('active');

      if (document.querySelector('#topBarTitle')) document.querySelector('#topBarTitle').textContent = 'Profile & Settings';
      document.querySelector('#btnTopBack')?.classList.remove('hidden');

      if (document.querySelector('#profileTabName')) document.querySelector('#profileTabName').textContent = 'Alex Morgan';
      if (document.querySelector('#profileTabId')) document.querySelector('#profileTabId').textContent = 'Health ID: MK-D30A8E';
      if (document.querySelector('#profileTabAvatar')) document.querySelector('#profileTabAvatar').textContent = 'AM';
    });

    // 5. Emergency SOS Protection Action Sheet
    await captureDeviceScreenshot(390, 844, 'mobile_emergency_sheet_390.png', () => {
      document.querySelector('#splashScreen')?.classList.add('hidden');
      document.querySelector('#authScreen')?.classList.add('hidden');
      document.querySelector('#appScreen')?.classList.remove('hidden');

      const backdrop = document.querySelector('#modalBackdrop');
      const title = document.querySelector('#modalTitle');
      const content = document.querySelector('#modalContent');

      if (backdrop && title && content) {
        title.textContent = '🚨 Emergency Medical Assistance';
        content.innerHTML = `
          <div style="display: grid; gap: 12px; text-align: center; padding: 4px 0;">
            <p style="margin: 0; font-size: 0.88rem; color: var(--text-muted);">
              Confirm dialing emergency services or contacting your registered primary contact:
            </p>
            <a href="tel:112" class="btn danger full" style="font-size: 1.05rem; min-height: 50px; font-weight: 900;">
              🚨 Call 112 (National Emergency)
            </a>
            <a href="tel:+15550199" class="btn primary full" style="min-height: 46px;">
              ☎ Call Primary ICE: Michael Jenkins (+1-555-0199)
            </a>
            <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px; font-size: 0.8rem; text-align: left;">
              <strong style="color: var(--teal-900);">📍 Your GPS Coordinates for First Responders:</strong>
              <div style="margin-top: 4px; color: var(--text-muted); font-family: ui-monospace, monospace;">Lat: 28.61394, Lon: 77.20902 (±5m)</div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: center; margin-top: 6px;">
              <button class="btn secondary sm" type="button">🏥 Nearby Hospitals</button>
              <button class="btn light sm" type="button">Cancel</button>
            </div>
          </div>
        `;
        backdrop.classList.add('open');
      }
    });

    // 6. Responsive Viewport Check: Compact Phone (320x568 - iPhone SE 1st Gen)
    await captureDeviceScreenshot(320, 568, 'responsive_320px_compact.png', () => {
      document.querySelector('#splashScreen')?.classList.add('hidden');
      document.querySelector('#authScreen')?.classList.add('hidden');
      document.querySelector('#appScreen')?.classList.remove('hidden');
      document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
      document.querySelector('#viewHome')?.classList.add('active');
      if (document.querySelector('#displayName')) document.querySelector('#displayName').textContent = 'Alex Morgan';
      if (document.querySelector('#displayId')) document.querySelector('#displayId').textContent = 'Health ID: MK-D30A8E';
    });

    // 7. Responsive Viewport Check: Tablet (768x1024 - iPad)
    await captureDeviceScreenshot(768, 1024, 'responsive_768px_tablet.png', () => {
      document.querySelector('#splashScreen')?.classList.add('hidden');
      document.querySelector('#authScreen')?.classList.add('hidden');
      document.querySelector('#appScreen')?.classList.remove('hidden');
      document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
      document.querySelector('#viewHome')?.classList.add('active');
      if (document.querySelector('#displayName')) document.querySelector('#displayName').textContent = 'Alex Morgan';
      if (document.querySelector('#displayId')) document.querySelector('#displayId').textContent = 'Health ID: MK-D30A8E';
    });

    console.log('\n🎉 ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    pageWs.close();
    ws.close();
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Fatal screenshot runner error:', err);
  process.exit(1);
});
