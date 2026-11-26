import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9226;
const ICONS_DIR = path.resolve('assets/icons');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('Generating high-resolution PWA icons and shortcuts...');

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

  const regularSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="medikeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1D4ED8"/>
        <stop offset="55%" stop-color="#2563EB"/>
        <stop offset="100%" stop-color="#60A5FA"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.25"/>
      </filter>
    </defs>
    <rect width="512" height="512" rx="128" fill="url(#medikeyGrad)"/>
    <g filter="url(#shadow)">
      <path d="M256 90 L390 145 C390 280 256 410 256 410 C256 410 122 280 122 145 Z" fill="#ffffff" fill-opacity="0.18" stroke="#ffffff" stroke-width="8"/>
      <rect x="226" y="170" width="60" height="170" rx="16" fill="#ffffff"/>
      <rect x="171" y="225" width="170" height="60" rx="16" fill="#ffffff"/>
    </g>
  </svg>
  `.trim();

  const maskableSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="medikeyMaskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1D4ED8"/>
        <stop offset="55%" stop-color="#2563EB"/>
        <stop offset="100%" stop-color="#60A5FA"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.25"/>
      </filter>
    </defs>
    <rect width="512" height="512" fill="url(#medikeyMaskGrad)"/>
    <g transform="translate(51, 51) scale(0.8)" filter="url(#shadow)">
      <path d="M256 90 L390 145 C390 280 256 410 256 410 C256 410 122 280 122 145 Z" fill="#ffffff" fill-opacity="0.18" stroke="#ffffff" stroke-width="8"/>
      <rect x="226" y="170" width="60" height="170" rx="16" fill="#ffffff"/>
      <rect x="171" y="225" width="170" height="60" rx="16" fill="#ffffff"/>
    </g>
  </svg>
  `.trim();

  // Save updated SVGs
  fs.writeFileSync(path.join(ICONS_DIR, 'icon.svg'), regularSvg);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon-maskable.svg'), maskableSvg);
  console.log('✅ SVGs updated with Light Blue healthcare palette.');

  // Helper to render SVG to PNG at specified dimensions
  async function renderSvgToPng(svgStr, width, height) {
    const res = await sendPage('Runtime.evaluate', {
      expression: `(async () => {
        const img = new Image();
        const svgBlob = new Blob([\`${svgStr}\`], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = ${width};
        canvas.height = ${height};
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, ${width}, ${height});
        URL.revokeObjectURL(url);
        return canvas.toDataURL('image/png').split(',')[1];
      })()`,
      returnByValue: true,
      awaitPromise: true
    });
    return Buffer.from(res.result?.result?.value, 'base64');
  }

  // 1. icon-512.png
  const png512 = await renderSvgToPng(regularSvg, 512, 512);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon-512.png'), png512);
  console.log(`✅ icon-512.png generated (${(png512.length / 1024).toFixed(1)} KB)`);

  // 2. icon-192.png
  const png192 = await renderSvgToPng(regularSvg, 192, 192);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon-192.png'), png192);
  console.log(`✅ icon-192.png generated (${(png192.length / 1024).toFixed(1)} KB)`);

  // 3. icon-maskable-512.png
  const maskable512 = await renderSvgToPng(maskableSvg, 512, 512);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon-maskable-512.png'), maskable512);
  console.log(`✅ icon-maskable-512.png generated (${(maskable512.length / 1024).toFixed(1)} KB)`);

  // 4. icon-maskable-192.png
  const maskable192 = await renderSvgToPng(maskableSvg, 192, 192);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon-maskable-192.png'), maskable192);
  console.log(`✅ icon-maskable-192.png generated (${(maskable192.length / 1024).toFixed(1)} KB)`);

  // 5. apple-touch-icon.png (180x180)
  const appleTouch = await renderSvgToPng(regularSvg, 180, 180);
  fs.writeFileSync(path.join(ICONS_DIR, 'apple-touch-icon.png'), appleTouch);
  console.log(`✅ apple-touch-icon.png generated (${(appleTouch.length / 1024).toFixed(1)} KB)`);

  // 6. favicon-32.png
  const favicon32 = await renderSvgToPng(regularSvg, 32, 32);
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon-32.png'), favicon32);
  console.log(`✅ favicon-32.png generated (${(favicon32.length / 1024).toFixed(1)} KB)`);

  chromeProc.kill();
  console.log('🎉 All icons successfully generated and saved!');
}

main().catch(err => {
  console.error('Fatal icon generation error:', err);
  process.exit(1);
});
