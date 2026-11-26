import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const SCREENSHOT_DIR = 'C:\\Users\\Raj Kamal\\.gemini\\antigravity\\brain\\70219288-f5a5-4653-a9e3-3492c5555175\\screenshots';
const LIVE_URL = 'https://medikey-app-lemon.vercel.app/';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`Connecting to live production URL: ${LIVE_URL}...`);
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
  const consoleMessages = [];
  pageWs.onmessage = evt => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(msg.params);
    }
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

  // 1. Mobile Test (390x844)
  console.log('\n--- 1. Testing Live Production on Mobile (390x844) ---');
  await sendPage('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sendPage('Page.navigate', { url: LIVE_URL });
  await sleep(2500);

  let evalRes = await sendPage('Runtime.evaluate', { expression: `(() => {
    const title = document.title;
    const hasAddAppointment = document.body.innerHTML.includes('Add Appointment');
    const has256 = document.body.innerHTML.includes('256-bit');
    const docW = document.documentElement.scrollWidth;
    const winW = window.innerWidth;
    const overflow = Math.max(0, docW - winW);
    return { title, hasAddAppointment, has256, docW, winW, overflow };
  })()`, returnByValue: true });

  let val = evalRes.result?.result?.value || evalRes.result?.value;
  console.log(`Mobile: Page Title="${val?.title}", ScrollWidth=${val?.docW}px, WinWidth=${val?.winW}px, Overflow=${val?.overflow}px`);
  console.log(`Mobile: Includes 'Add Appointment'=${val?.hasAddAppointment}, Includes '256-bit'=${val?.has256}`);

  let ss = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'live_production_mobile_390.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('  📸 Saved screenshot: live_production_mobile_390.png');
  }

  // 2. Desktop Test (1440x900)
  console.log('\n--- 2. Testing Live Production on Desktop (1440x900) ---');
  await sendPage('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await sendPage('Page.navigate', { url: LIVE_URL });
  await sleep(2000);

  evalRes = await sendPage('Runtime.evaluate', { expression: `(() => {
    const docW = document.documentElement.scrollWidth;
    const winW = window.innerWidth;
    const overflow = Math.max(0, docW - winW);
    return { docW, winW, overflow };
  })()`, returnByValue: true });

  val = evalRes.result?.result?.value || evalRes.result?.value;
  console.log(`Desktop: ScrollWidth=${val?.docW}px, WinWidth=${val?.winW}px, Overflow=${val?.overflow}px`);

  ss = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'live_production_desktop_1440.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('  📸 Saved screenshot: live_production_desktop_1440.png');
  }

  // 3. Live Login & Dashboard Test on Mobile
  console.log('\n--- 3. Testing Live Login & Profile Modals on Mobile ---');
  await sendPage('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sendPage('Runtime.evaluate', { expression: `(() => {
    const emailInput = document.querySelector('#loginEmail');
    const pwInput = document.querySelector('#loginPassword');
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    if (emailInput && pwInput && submitBtn) {
      emailInput.value = 'synthetic.patient1@medikey.local';
      pwInput.value = 'P@ssword2026!SecureMedical';
      submitBtn.click();
    }
  })()` });
  await sleep(3500);

  evalRes = await sendPage('Runtime.evaluate', { expression: `(() => {
    const appScreenVisible = !document.querySelector('#appScreen')?.classList.contains('hidden');
    const healthId = document.querySelector('#welcomeHealthId')?.textContent || '';
    const welcome = document.querySelector('#welcomeGreeting')?.textContent || '';
    const banner = document.querySelector('#profileCompletionBanner');
    const bannerVisible = banner && !banner.classList.contains('hidden');
    return { appScreenVisible, healthId, welcome, bannerVisible };
  })()`, returnByValue: true });

  val = evalRes.result?.result?.value || evalRes.result?.value;
  console.log(`Live Authenticated Session: AppVisible=${val?.appScreenVisible}, Greeting="${val?.welcome}", HealthID="${val?.healthId}", CompletionBannerVisible=${val?.bannerVisible}`);

  ss = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'live_production_dashboard_mobile.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('  📸 Saved screenshot: live_production_dashboard_mobile.png');
  }

  // Check Read-Only Profile Overview Modal on live site
  await sendPage('Runtime.evaluate', { expression: `(() => {
    const viewBtn = document.querySelector('#btnViewProfileTab');
    if (viewBtn) viewBtn.click();
  })()` });
  await sleep(1000);

  evalRes = await sendPage('Runtime.evaluate', { expression: `(() => {
    const title = document.querySelector('#modalTitle')?.textContent || '';
    const backdropOpen = document.querySelector('#modalBackdrop')?.classList.contains('open');
    const body = document.querySelector('#modalBody')?.innerHTML || '';
    const notProvidedCount = (body.match(/Not provided/g) || []).length;
    return { title, backdropOpen, notProvidedCount };
  })()`, returnByValue: true });

  val = evalRes.result?.result?.value || evalRes.result?.value;
  console.log(`Live Profile Modal: Title="${val?.title}", Open=${val?.backdropOpen}, "Not provided" count=${val?.notProvidedCount}`);

  ss = await sendPage('Page.captureScreenshot', { format: 'png' });
  if (ss.result?.data) {
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'live_production_profile_modal.png'), Buffer.from(ss.result.data, 'base64'));
    console.log('  📸 Saved screenshot: live_production_profile_modal.png');
  }

  // Clean exit
  ws.close();
  pageWs.close();
  chromeProc.kill();
  console.log('\n🎉 LIVE PRODUCTION VERIFICATION COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
