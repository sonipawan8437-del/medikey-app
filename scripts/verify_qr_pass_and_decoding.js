import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://dplqchnemrdckjzmrtrc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Th5qKZynF1gi5OJFU9MUng_YAsdhSmg';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9225;
const LIVE_URL = 'https://medikey-app-lemon.vercel.app/';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('\n======================================================================');
  console.log('  MediKey Section 01: Emergency QR Generation, Decoding & Verification');
  console.log('======================================================================');

  // 1. Authenticate synthetic user via Supabase SDK
  console.log('\n[1/5] Authenticating synthetic test patient with Supabase...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: process.env.MEDIKEY_TEST_EMAIL || 'synthetic.patient1@medikey.local',
    password: process.env.MEDIKEY_TEST_PASSWORD || 'P@ssword2026!SecureMedical'
  });
  if (authErr || !authData.user) {
    console.error('❌ Authentication failed:', authErr?.message);
    process.exit(1);
  }
  const userId = authData.user.id;
  console.log('✅ Synthetic patient signed in successfully. User ID:', userId.slice(0, 8) + '...[REDACTED]');

  // 2. Generate an active emergency share token
  console.log('\n[2/5] Creating active emergency pass token with selective consent...');
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const consentedFields = {
    name: true,
    blood: true,
    allergies: true,
    conditions: true,
    medicines: false, // Withheld by patient for privacy
    emergency_contacts: true
  };

  const { data: shareRow, error: shareErr } = await supabase
    .from('emergency_shares')
    .insert({
      user_id: userId,
      expires_at: expiresAt,
      consented_fields: consentedFields,
      is_revoked: false
    })
    .select()
    .single();

  if (shareErr || !shareRow) {
    console.error('❌ Failed to insert emergency share:', shareErr?.message);
    process.exit(1);
  }

  const rawToken = shareRow.share_token;
  const maskedToken = rawToken.slice(0, 4) + '...' + rawToken.slice(-4);
  console.log(`✅ Emergency share token generated: ${maskedToken} (Token length: ${rawToken.length} chars)`);

  const expectedUrl = `${LIVE_URL}#emergency-share=${rawToken}`;

  // 3. Launch headless Chrome to render CR80 Card, extract PNG/PDF and decode QR
  console.log('\n[3/5] Rendering CR80 Card and Decoding QR from exported image...');
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

  const targetRes = await send('Target.createTarget', { url: LIVE_URL });
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
  await sleep(2500);

  // In page: generate canvas, convert to blob, decode with Html5Qrcode.scanFile
  const decodeResult = await (async () => {
    const res = await sendPage('Runtime.evaluate', {
      expression: `(async () => {
        try {
          const { generateCR80CardCanvas, add600DpiToPngBlob, canvasToCR80Pdf } = await import('./js/qr.js');
          const shareUrl = '${expectedUrl}';
          
          // 1. Generate canvas
          const canvas = await generateCR80CardCanvas(shareUrl);
          
          // 2. Export 600 DPI PNG
          const rawPngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
          const pngWithDpi = await add600DpiToPngBlob(rawPngBlob);

          // 3. Export PDF
          const pdfBlob = await canvasToCR80Pdf(canvas);

          // 4. Decode QR from the generated PNG image using in-browser Html5Qrcode
          const helperDiv = document.createElement('div');
          helperDiv.id = 'qrDecoderHelper' + Date.now();
          document.body.appendChild(helperDiv);
          
          const html5QrCode = new Html5Qrcode(helperDiv.id, { verbose: false });
          const file = new File([pngWithDpi], 'test_card.png', { type: 'image/png' });
          const decodedText = await html5QrCode.scanFile(file, true);
          
          document.body.removeChild(helperDiv);

          return {
            success: true,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            pngSize: pngWithDpi.size,
            pdfSize: pdfBlob.size,
            decodedText
          };
        } catch (err) {
          return { success: false, error: err.message, stack: err.stack };
        }
      })()`,
      returnByValue: true,
      awaitPromise: true
    });
    console.log('Evaluate raw response:', JSON.stringify(res));
    return res.result?.result?.value;
  })();

  console.log('Decode test output:', {
    canvasWidth: decodeResult.canvasWidth,
    canvasHeight: decodeResult.canvasHeight,
    pngSize: decodeResult.pngSize,
    pdfSize: decodeResult.pdfSize,
    decodedMatchesUrl: decodeResult.decodedText === expectedUrl
  });

  if (!decodeResult.success || decodeResult.decodedText !== expectedUrl) {
    console.error('❌ QR decoding failed or URL mismatch');
    process.exit(1);
  }
  console.log('✅ PASS: QR code successfully decoded from exported PNG! Matches exact expected production URL.');

  // 4. Open decoded URL in a completely unauthenticated, clean incognito target
  console.log('\n[4/5] Opening decoded emergency URL in unauthenticated browser...');
  const unauthTarget = await send('Target.createTarget', { url: 'about:blank' });
  const unauthPages = await (await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`)).json();
  const unauthPageTarget = unauthPages.find(p => p.id === unauthTarget.result.targetId);
  const unauthWs = new WebSocket(unauthPageTarget.webSocketDebuggerUrl);

  const unauthPending = new Map();
  unauthWs.onmessage = evt => {
    const msg = JSON.parse(evt.data);
    if (msg.id && unauthPending.has(msg.id)) { unauthPending.get(msg.id)(msg); unauthPending.delete(msg.id); }
  };
  await new Promise(r => { unauthWs.onopen = r; });

  function sendUnauth(method, params = {}) {
    return new Promise(r => {
      const id = msgId++;
      unauthPending.set(id, r);
      unauthWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendUnauth('Page.enable');
  await sendUnauth('Runtime.enable');
  await sendUnauth('Page.navigate', { url: expectedUrl });
  await sleep(3000);

  // Inspect the emergency pass modal in the unauthenticated session
  const passInspection = await (async () => {
    const res = await sendUnauth('Runtime.evaluate', {
      expression: `(() => {
        const title = document.querySelector('#modalTitle')?.textContent;
        const bodyText = document.querySelector('#modalContent')?.textContent || '';
        const backdrop = document.querySelector('#modalBackdrop');
        return {
          isOpen: backdrop?.classList.contains('open'),
          title,
          hasBlood: bodyText.includes('Blood Group') && bodyText.includes('B+'),
          hasAllergies: bodyText.includes('Penicillin'),
          hasMedications: bodyText.includes('Active Medications') || bodyText.includes('Lisinopril'),
          hasContacts: bodyText.includes('Emergency Contacts'),
          snippet: bodyText.slice(0, 120)
        };
      })()`,
      returnByValue: true
    });
    return res.result?.result?.value;
  })();

  console.log('Public Emergency Modal Inspection (Unauthenticated):', passInspection);
  const passValid = passInspection.isOpen && 
                    passInspection.hasBlood && 
                    passInspection.hasAllergies && 
                    !passInspection.hasMedications; // Medications were withheld!

  if (passValid) {
    console.log('✅ PASS: Public emergency verification opened WITHOUT login. Consented fields displayed; withheld medications shielded!');
  } else {
    console.error('❌ FAIL: Emergency pass modal inspection failed');
    process.exit(1);
  }

  // 5. Test Revocation
  console.log('\n[5/5] Testing revocation enforcement...');
  await supabase
    .from('emergency_shares')
    .update({ is_revoked: true })
    .eq('id', shareRow.id);

  console.log('Revocation flag set to true in database. Reloading public page...');
  await sendUnauth('Page.reload');
  await sleep(2500);

  const revokedInspection = await (async () => {
    const res = await sendUnauth('Runtime.evaluate', {
      expression: `(() => {
        const title = document.querySelector('#modalTitle')?.textContent;
        const bodyText = document.querySelector('#modalContent')?.textContent || '';
        return {
          title,
          isRevokedMsg: bodyText.includes('Link Expired or Revoked') || bodyText.includes('revoked by the patient')
        };
      })()`,
      returnByValue: true
    });
    return res.result?.result?.value;
  })();

  console.log('Revocation Inspection:', revokedInspection);
  if (revokedInspection.isRevokedMsg) {
    console.log('✅ PASS: Revocation immediately enforced! Unauthenticated viewer receives "Link Expired or Revoked".');
  } else {
    console.error('❌ FAIL: Revoked pass was not rejected');
    process.exit(1);
  }

  console.log('\n======================================================================');
  console.log('  SECTION 01: ALL EMERGENCY QR FUNCTIONALITY VERIFIED 100% SUCCESS');
  console.log('======================================================================');

  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error during QR verification:', err);
  process.exit(1);
});
