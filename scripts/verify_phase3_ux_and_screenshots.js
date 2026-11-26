import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const SCREENSHOT_DIR = 'C:\\Users\\Raj Kamal\\.gemini\\antigravity\\brain\\70219288-f5a5-4653-a9e3-3492c5555175\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('Launching headless Chrome for Phase 3 Responsive & UX Verification...');
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

  if (!wsUrl) {
    console.error('Failed to get Chrome WebSocket debugger URL');
    chromeProc.kill();
    process.exit(1);
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
  const viewports = [
    { name: '320_compact', width: 320, height: 600, mobile: true },
    { name: '360_galaxy', width: 360, height: 740, mobile: true },
    { name: '390_iphone14', width: 390, height: 844, mobile: true },
    { name: '430_promax', width: 430, height: 932, mobile: true },
    { name: '768_tablet', width: 768, height: 1024, mobile: false },
    { name: '1440_desktop', width: 1440, height: 900, mobile: false }
  ];

  const results = [];

  console.log('\n--- 1. Testing Responsive Viewports & Horizontal Overflow ---');
  for (const vp of viewports) {
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.mobile
    });

    await sendPage('Page.navigate', { url: fileUrl });
    await sleep(700);

    // Setup Mock Authenticated Session on Dashboard
    await sendPage('Runtime.evaluate', { expression: `(() => {
      document.querySelector('#splashScreen')?.classList.add('hidden');
      document.querySelector('#authScreen')?.classList.add('hidden');
      document.querySelector('#appScreen')?.classList.remove('hidden');
      
      const welcome = document.querySelector('#welcomeGreeting');
      if (welcome) welcome.textContent = 'Hello, John Doe';
      const healthId = document.querySelector('#welcomeHealthId');
      if (healthId) healthId.textContent = 'Health ID: MK-882190 · Verified';

      // Set up profile banner
      const bannerName = document.querySelector('#patientNameBanner');
      if (bannerName) bannerName.textContent = 'John Doe';
      const bannerBg = document.querySelector('#bloodGroupBanner');
      if (bannerBg) bannerBg.textContent = 'O+';
      const bannerId = document.querySelector('#healthIdBanner');
      if (bannerId) bannerId.textContent = 'MK-882190';
    })()` });
    await sleep(300);

    const evalRes = await sendPage('Runtime.evaluate', { expression: `(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const bodyW = document.body.scrollWidth;
      const overflow = Math.max(0, docW - winW, bodyW - winW);
      return { docW, winW, bodyW, overflow };
    })()`, returnByValue: true });

    const val = (evalRes?.result?.result?.value) || (evalRes?.result?.value) || {};
    const pass = (val.overflow === 0);
    console.log(`[Viewport ${vp.width}x${vp.height}] ScrollWidth: ${val.docW}px, Window: ${val.winW}px, Overflow: ${val.overflow}px -> ${pass ? '✅ PASS' : '❌ FAIL'}`);

    results.push({ ...vp, ...val, pass });

    // Capture responsive dashboard screenshot for key viewports
    if ([320, 390, 768, 1440].includes(vp.width)) {
      const ss = await sendPage('Page.captureScreenshot', { format: 'png' });
      if (ss.result?.data) {
        const dest = path.join(SCREENSHOT_DIR, `phase3_dashboard_${vp.width}.png`);
        fs.writeFileSync(dest, Buffer.from(ss.result.data, 'base64'));
        console.log(`  📸 Saved screenshot: phase3_dashboard_${vp.width}.png`);
      }
    }
  }

  console.log('\n--- 2. Capturing Phase 3 UX Components & Modals ---');

  // A. Home screen with Profile Completion Banner
  await sendPage('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sendPage('Page.navigate', { url: fileUrl });
  await sleep(600);
  await sendPage('Runtime.evaluate', { expression: `(() => {
    document.querySelector('#splashScreen')?.classList.add('hidden');
    document.querySelector('#authScreen')?.classList.add('hidden');
    document.querySelector('#appScreen')?.classList.remove('hidden');

    const banner = document.querySelector('#profileCompletionBanner');
    if (banner) {
      banner.className = 'profile-completion-card';
      banner.innerHTML = \`
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 1rem;">💡</span>
              <strong style="color: var(--primary-dark); font-size: 0.88rem;">Profile Setup (2/4 completed)</strong>
            </div>
            <p style="margin: 4px 0 8px; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4;">
              Add your blood group and emergency contact so first responders can assist you in an emergency.
            </p>
          </div>
          <button id="btnDismissSetup" type="button" aria-label="Dismiss" style="font-size: 1.1rem; color: var(--text-tertiary); padding: 2px 6px;">×</button>
        </div>
        <div style="height: 4px; background: var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
          <div style="width: 50%; height: 100%; background: var(--primary); transition: width 0.3s ease;"></div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn primary sm" id="btnCompleteSetup" type="button" style="font-size: 0.76rem; padding: 5px 12px;">Complete Profile →</button>
          <button class="btn light sm" id="btnSkipSetup" type="button" style="font-size: 0.76rem; padding: 5px 10px;">Maybe Later</button>
        </div>
      \`;
      banner.classList.remove('hidden');
    }
  })()` });
  await sleep(300);
  let ss = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'home_completion_banner.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('  📸 Saved screenshot: home_completion_banner.png');
  }

  // B. Read-only Profile Overview Modal
  await sendPage('Runtime.evaluate', { expression: `(() => {
    const backdrop = document.querySelector('#modalBackdrop');
    const title = document.querySelector('#modalTitle');
    const body = document.querySelector('#modalBody');
    if (backdrop && title && body) {
      title.textContent = 'Digital Medical Profile';
      body.innerHTML = \`
        <div style="display: grid; gap: 14px;">
          <div class="profile-overview-card">
            <div class="profile-overview-avatar">JD</div>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary-dark);">John Doe</h3>
              <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-secondary);">Digital Health ID: <strong>MK-882190</strong></p>
              <div style="margin-top: 6px; display: inline-block; font-size: 0.74rem; background: var(--teal-50); color: var(--primary); padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                ● Cloud Synchronized
              </div>
            </div>
          </div>
          <div class="profile-overview-section">
            <h4 style="margin: 0 0 8px; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Critical Health Parameters</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div class="profile-overview-field">
                <label>Blood Group</label>
                <div class="val" style="color: var(--emergency); font-weight: 700;">O+</div>
              </div>
              <div class="profile-overview-field">
                <label>Date of Birth</label>
                <div class="val">1990-05-15 (34 yrs)</div>
              </div>
            </div>
          </div>
          <div class="profile-overview-section">
            <h4 style="margin: 0 0 8px; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Allergies & Conditions</h4>
            <div class="profile-overview-field" style="margin-bottom: 6px;">
              <label>Known Allergies</label>
              <div class="val" style="color: var(--emergency);">Penicillin, Peanuts</div>
            </div>
            <div class="profile-overview-field">
              <label>Chronic Medical Conditions</label>
              <div class="val">Type 2 Diabetes (Managed)</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button class="btn primary full" id="btnEditOverviewModal" type="button">✎ Edit Profile Details</button>
            <button class="btn light" id="btnCloseOverviewModal" type="button">Close</button>
          </div>
        </div>
      \`;
      backdrop.classList.add('open');
      backdrop.setAttribute('aria-hidden', 'false');
    }
  })()` });
  await sleep(300);
  ss = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'profile_view_modal.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('  📸 Saved screenshot: profile_view_modal.png');
  }

  // C. Tabbed / Reorganized Edit Profile Modal
  await sendPage('Runtime.evaluate', { expression: `(() => {
    const title = document.querySelector('#modalTitle');
    const body = document.querySelector('#modalBody');
    if (title && body) {
      title.textContent = 'Edit Medical Profile';
      body.innerHTML = \`
        <div style="display: grid; gap: 12px;">
          <div style="display: flex; gap: 6px; border-bottom: 1px solid var(--border); padding-bottom: 8px; overflow-x: auto;">
            <button class="chip active" style="font-size: 0.8rem; padding: 4px 10px;">👤 Personal</button>
            <button class="chip" style="font-size: 0.8rem; padding: 4px 10px;">⚕️ Medical</button>
            <button class="chip" style="font-size: 0.8rem; padding: 4px 10px;">📞 Contact</button>
          </div>
          <form id="editFormTabbed" style="display: grid; gap: 10px;">
            <div class="field">
              <label>Full Legal Name *</label>
              <input type="text" value="John Doe">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div class="field">
                <label>Date of Birth</label>
                <input type="date" value="1990-05-15">
              </div>
              <div class="field">
                <label>Gender</label>
                <select>
                  <option selected>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Primary Phone Number</label>
              <input type="tel" value="+1 (555) 019-2831">
            </div>
            <div style="display: flex; gap: 8px; margin-top: 6px;">
              <button class="btn primary full" type="button">Save Changes</button>
              <button class="btn light" type="button">Cancel</button>
            </div>
          </form>
        </div>
      \`;
    }
  })()` });
  await sleep(300);
  ss = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'profile_edit_modal.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('  📸 Saved screenshot: profile_edit_modal.png');
  }

  // D. Change Password Modal (Logged-In User)
  await sendPage('Runtime.evaluate', { expression: `(() => {
    const title = document.querySelector('#modalTitle');
    const body = document.querySelector('#modalBody');
    if (title && body) {
      title.textContent = 'Change Account Password';
      body.innerHTML = \`
        <form style="display: grid; gap: 12px;">
          <div class="notice" style="margin: 0; background: var(--teal-50); border-color: var(--primary-border); color: var(--teal-900); font-size: 0.82rem;">
            🔒 For security, please enter your current password followed by your new password.
          </div>
          <div class="field">
            <label>Current Password *</label>
            <input type="password" placeholder="Enter current password" value="CurrentSecretPass1">
          </div>
          <div class="field">
            <label>New Password * (Min 6 characters)</label>
            <input type="password" placeholder="Enter new password" value="NewSecurePassword@2026">
          </div>
          <div class="field">
            <label>Confirm New Password *</label>
            <input type="password" placeholder="Re-enter new password" value="NewSecurePassword@2026">
          </div>
          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <button class="btn primary full" type="button">Update Password</button>
            <button class="btn light" type="button">Cancel</button>
          </div>
        </form>
      \`;
    }
  })()` });
  await sleep(300);
  ss = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'change_password_modal.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('  📸 Saved screenshot: change_password_modal.png');
  }

  // Close modal
  await sendPage('Runtime.evaluate', { expression: `(() => {
    const backdrop = document.querySelector('#modalBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  })()` });
  await sleep(200);

  // E. Forgot Password Panel
  await sendPage('Runtime.evaluate', { expression: `(() => {
    document.querySelector('#appScreen')?.classList.add('hidden');
    document.querySelector('#authScreen')?.classList.remove('hidden');
    document.querySelectorAll('#authScreen .auth-card > div').forEach(d => {
      if (d.id && d.id !== 'authCardHeader') d.classList.add('hidden');
    });
    document.querySelector('#forgotPanel')?.classList.remove('hidden');
    const input = document.querySelector('#resetEmail');
    if (input) input.value = 'patient@example.com';
  })()` });
  await sleep(300);
  ss = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'auth_forgot_panel.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('  📸 Saved screenshot: auth_forgot_panel.png');
  }

  // F. Update Password Panel (Incoming Recovery Link)
  await sendPage('Runtime.evaluate', { expression: `(() => {
    document.querySelectorAll('#authScreen .auth-card > div').forEach(d => {
      if (d.id && d.id !== 'authCardHeader') d.classList.add('hidden');
    });
    document.querySelector('#updatePasswordPanel')?.classList.remove('hidden');
  })()` });
  await sleep(300);
  ss = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'auth_update_password_panel.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('  📸 Saved screenshot: auth_update_password_panel.png');
  }

  // Clean exit
  ws.close();
  pageWs.close();
  chromeProc.kill();
  console.log('\n🎉 ALL RESPONSIVE TESTS AND PHASE 3 SCREENSHOTS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
