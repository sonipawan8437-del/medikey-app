/**
 * MediKey | QR Code Generation, Scanning & Secure Sharing (qr.js)
 */

import { supabase } from './supabase-client.js';
import { $, toast, openModal, closeModal, escapeHTML } from './utils.js';
import { getCurrentUser } from './auth.js';
import { getCurrentProfile } from './profile.js';

let qrScannerInstance = null;

export function renderLocalQRCode(containerElement, text, width = 180, height = 180) {
  if (!containerElement) return null;
  containerElement.innerHTML = '';

  if (!window.QRCode) {
    containerElement.innerHTML = '<div class="notice danger">Local QR code engine is loading...</div>';
    return null;
  }

  try {
    return new QRCode(containerElement, {
      text: text,
      width: width,
      height: height,
      colorDark: '#1D4ED8',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (err) {
    console.error('Local QR rendering error:', err);
    containerElement.innerHTML = '<div class="notice danger">QR Code could not be created.</div>';
    return null;
  }
}

export async function getActiveEmergencyShareUrl() {
  const user = getCurrentUser();
  if (!supabase || !user) {
    return `${location.origin}${location.pathname}#offline`;
  }

  try {
    const nowIso = new Date().toISOString();
    const { data: shares } = await supabase
      .from('emergency_shares')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_revoked', false)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (shares && shares.length > 0) {
      return `${location.origin}${location.pathname}#emergency-share=${shares[0].share_token}`;
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newShare } = await supabase
      .from('emergency_shares')
      .insert({
        user_id: user.id,
        expires_at: expiresAt,
        consented_fields: { name: true, blood: true, allergies: true, conditions: true, medicines: true, emergency_contacts: true }
      })
      .select()
      .single();

    if (newShare) {
      return `${location.origin}${location.pathname}#emergency-share=${newShare.share_token}`;
    }
  } catch (e) {
    console.warn('Could not generate share token from Supabase:', e);
  }
  return `${location.origin}${location.pathname}`;
}

export async function refreshDashboardQR() {
  const container = $('#qrPreviewContainer');
  if (!container) return;
  const shareUrl = await getActiveEmergencyShareUrl();
  renderLocalQRCode(container, shareUrl, 84, 84);
}

export async function showQRModal() {
  const user = getCurrentUser();
  const profile = getCurrentProfile();
  if (!supabase || !user || !profile) return toast('Please sign in to manage emergency QR passes.');

  const nowIso = new Date().toISOString();
  const { data: shares } = await supabase
    .from('emergency_shares')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_revoked', false)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order('created_at', { ascending: false });

  let activeShare = (shares && shares.length) ? shares[0] : null;

  if (!activeShare) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: created } = await supabase
      .from('emergency_shares')
      .insert({
        user_id: user.id,
        expires_at: expiresAt,
        consented_fields: { name: true, blood: true, allergies: true, conditions: true, medicines: true, emergency_contacts: true }
      })
      .select()
      .single();
    activeShare = created;
  }

  const consent = activeShare ? activeShare.consented_fields : {};
  const shareUrl = activeShare ? `${location.origin}${location.pathname}#emergency-share=${activeShare.share_token}` : location.href;

  openModal(
    'Secure Emergency QR Pass (Cryptographic Token)',
    `
    <div style="text-align: center;">
      <div id="fullQRContainer" style="display:inline-block; padding:12px; background:#fff; border:1px solid #d8e6f3; border-radius:16px; margin: 8px auto;"></div>
      <div>
        <h3 style="margin: 4px 0;">${escapeHTML(profile.full_name || 'Patient')}</h3>
        <p class="muted" style="margin: 0 0 10px;">ID: <strong>${escapeHTML(profile.health_id)}</strong> &nbsp;|&nbsp; Blood: <strong>${escapeHTML(profile.blood_group)}</strong></p>
        <span class="share-status-pill active">● Active Secure Pass</span>
      </div>

      <div class="consent-group" style="text-align: left; margin-top: 14px;">
        <strong style="font-size: 0.84rem; color: var(--navy); display: block; margin-bottom: 6px;">🛡️ Consented Emergency Information:</strong>
        <p class="muted" style="font-size: 0.78rem; margin: 0 0 8px;">Select what first responders see when scanning this cryptographic pass:</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <label class="consent-item"><input type="checkbox" id="scBlood" ${consent.blood !== false ? 'checked' : ''}> Blood group</label>
          <label class="consent-item"><input type="checkbox" id="scAllergies" ${consent.allergies !== false ? 'checked' : ''}> Critical allergies</label>
          <label class="consent-item"><input type="checkbox" id="scConditions" ${consent.conditions !== false ? 'checked' : ''}> Chronic conditions</label>
          <label class="consent-item"><input type="checkbox" id="scMedicines" ${consent.medicines !== false ? 'checked' : ''}> Active medications</label>
          <label class="consent-item"><input type="checkbox" id="scContacts" ${consent.emergency_contacts !== false ? 'checked' : ''}> Emergency contacts</label>
        </div>

        <div style="margin-top: 10px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: #273b54;">Pass Duration:</label>
          <select id="shareExpirySelect" style="width: 100%; border: 1px solid #cbdbeb; border-radius: 8px; padding: 7px; margin-top: 4px; font-size: 0.82rem;">
            <option value="24h">Valid for 24 Hours</option>
            <option value="7d" selected>Valid for 7 Days</option>
            <option value="30d">Valid for 30 Days</option>
            <option value="never">Permanent (Until Revoked)</option>
          </select>
        </div>
      </div>

      <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 14px;">
        <button class="btn primary" id="btnOpenPVCCard" type="button" style="background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%); color: #fff; font-weight: 700;">🪪 Emergency PVC Card</button>
        <button class="btn light" id="btnDownloadQR" type="button">📥 QR Only</button>
        <button class="btn light" id="btnCopyShareLink" type="button">🔗 Copy Link</button>
        <button class="btn danger" id="btnRevokePass" type="button">🚫 Revoke</button>
      </div>

      <div class="notice" style="margin-top: 14px; text-align: left;">
        <strong>🔒 Zero Exposure Guarantee:</strong> The QR code points to a secure cryptographic verification endpoint that only serves the fields you have enabled above.
      </div>
    </div>
    `
  );

  const qrContainer = $('#fullQRContainer');
  renderLocalQRCode(qrContainer, shareUrl, 200, 200);

  const updateShareConsent = async () => {
    if (!activeShare) return;
    const expiryChoice = $('#shareExpirySelect').value;
    let expiresAt = null;
    if (expiryChoice === '24h') expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    else if (expiryChoice === '7d') expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    else if (expiryChoice === '30d') expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

    const consented = {
      name: true,
      blood: $('#scBlood').checked,
      allergies: $('#scAllergies').checked,
      conditions: $('#scConditions').checked,
      medicines: $('#scMedicines').checked,
      emergency_contacts: $('#scContacts').checked
    };

    try {
      await supabase
        .from('emergency_shares')
        .update({ consented_fields: consented, expires_at: expiresAt })
        .eq('id', activeShare.id);
      toast('Emergency pass permissions updated.');
    } catch (err) {
      toast('Failed to update consent.');
    }
  };

  ['#scBlood', '#scAllergies', '#scConditions', '#scMedicines', '#scContacts', '#shareExpirySelect'].forEach(sel => {
    const el = $(sel);
    if (el) el.addEventListener('change', updateShareConsent);
  });

  $('#btnRevokePass').onclick = async () => {
    if (!confirm('Are you sure you want to revoke this emergency pass? Anyone scanning this QR code will no longer be able to view your information.')) return;
    try {
      await supabase
        .from('emergency_shares')
        .update({ is_revoked: true })
        .eq('id', activeShare.id);
      toast('Pass revoked.');
      closeModal();
      refreshDashboardQR();
    } catch (err) {
      toast('Could not revoke pass.');
    }
  };

  $('#btnDownloadQR').onclick = () => {
    const canvas = qrContainer.querySelector('canvas');
    const img = qrContainer.querySelector('img');
    let dataUrl = canvas ? canvas.toDataURL('image/png') : (img ? img.src : null);
    if (!dataUrl) return toast('Could not generate download image.');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `MediKey-EmergencyPass-${profile.health_id}.png`;
    link.click();
    toast('QR downloaded.');
  };

  $('#btnOpenPVCCard').onclick = () => {
    openPVCCardModal(activeShare, shareUrl);
  };

  $('#btnCopyShareLink').onclick = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('Emergency pass URL copied to clipboard!');
    } catch (e) {
      prompt('Copy your Emergency Pass link:', shareUrl);
    }
  };
}

export async function generateCR80CardCanvas(shareUrl) {
  const canvas = document.createElement('canvas');
  canvas.width = 1275;
  canvas.height = 2022;
  const ctx = canvas.getContext('2d');

  // Background - clinical white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1275, 2022);

  // Top header band - rich medical blue gradient
  const grad = ctx.createLinearGradient(0, 0, 1275, 340);
  grad.addColorStop(0, '#1D4ED8'); // primary-dark
  grad.addColorStop(1, '#2563EB'); // primary
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1275, 340);

  // Rounded rectangle helper
  const drawRoundedRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // MediKey Cross Logo mark & Brand Text
  const iconX = 140;
  const iconY = 100;
  const iconSize = 90;
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(iconX, iconY, iconSize, iconSize, 22);
  ctx.fill();

  // Draw blue cross inside icon
  ctx.fillStyle = '#2563EB';
  const armW = 18;
  const armL = 54;
  ctx.fillRect(iconX + (iconSize - armL) / 2, iconY + (iconSize - armW) / 2, armL, armW);
  ctx.fillRect(iconX + (iconSize - armW) / 2, iconY + (iconSize - armL) / 2, armW, armL);

  // "MediKey" brand text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 74px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MediKey', iconX + iconSize + 28, iconY + iconSize / 2);

  // Subtitle / Header Type: "EMERGENCY QR CARD"
  ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#DBEAFE'; // soft blue
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  ctx.fillText('EMERGENCY QR CARD', 140, 265);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Inner border on card body
  ctx.strokeStyle = '#DBEAFE';
  ctx.lineWidth = 4;
  drawRoundedRect(60, 60, 1155, 1902, 40);
  ctx.stroke();

  // QR Code Quiet Zone container
  const qrBoxSize = 780;
  const qrBoxX = (1275 - qrBoxSize) / 2;
  const qrBoxY = 460;
  
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 32);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Render QR Code using vendor QRCode
  const qrSize = 680;
  const qrX = (1275 - qrSize) / 2;
  const qrY = qrBoxY + (qrBoxSize - qrSize) / 2;

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);

  new QRCode(tempDiv, {
    text: shareUrl,
    width: qrSize,
    height: qrSize,
    colorDark: '#0F172A',
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });

  await new Promise(r => setTimeout(r, 60));
  const qrSource = tempDiv.querySelector('canvas') || tempDiv.querySelector('img');
  if (qrSource) {
    ctx.drawImage(qrSource, qrX, qrY, qrSize, qrSize);
  }
  document.body.removeChild(tempDiv);

  // Below QR Instructions
  ctx.textAlign = 'center';

  // 1. Prominent emergency instruction
  ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#DC2626'; // Emergency Red
  ctx.fillText('SCAN IN AN EMERGENCY', 1275 / 2, 1370);

  // 2. Secondary helper text
  ctx.font = '600 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText('Access shared emergency health information', 1275 / 2, 1445);

  // 3. Internet connection required badge
  const pillW = 560;
  const pillH = 64;
  const pillX = (1275 - pillW) / 2;
  const pillY = 1515;
  ctx.fillStyle = '#EFF6FF';
  drawRoundedRect(pillX, pillY, pillW, pillH, 32);
  ctx.fill();
  ctx.strokeStyle = '#DBEAFE';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#2563EB';
  ctx.fillText('⚡ Internet connection required', 1275 / 2, pillY + 41);

  // 4. Privacy badge note (Strictly NO patient info on card surface)
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('🔒 Zero personal patient information on card surface', 1275 / 2, 1630);
  ctx.fillText('Encrypted access controlled by patient emergency pass', 1275 / 2, 1675);

  // Footer bar
  const footerH = 150;
  const footerY = 2022 - footerH;
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(62, footerY, 1151, footerH - 62);
  
  ctx.strokeStyle = '#DBEAFE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(62, footerY);
  ctx.lineTo(1213, footerY);
  ctx.stroke();

  ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#2563EB';
  ctx.fillText('Powered by MediKey • Digital Healthcare Identity', 1275 / 2, footerY + 60);

  return canvas;
}

export async function canvasToCR80Pdf(canvas) {
  const jpegBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
  const jpegBuffer = new Uint8Array(await jpegBlob.arrayBuffer());
  const widthPx = canvas.width;
  const heightPx = canvas.height;

  // CR80 standard physical dimensions in points (72 points per inch)
  // 53.98 mm = 2.1252 inches = 153.01 pt
  // 85.60 mm = 3.3701 inches = 242.65 pt
  const ptWidth = 153.01;
  const ptHeight = 242.65;

  const contentStream = `q\n${ptWidth} 0 0 ${ptHeight} 0 0 cm\n/Im1 Do\nQ\n`;
  const enc = new TextEncoder();
  const contentBytes = enc.encode(contentStream);

  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth} ${ptHeight}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n`;
  const obj4Header = `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`;
  const obj4Footer = '\nendstream\nendobj\n';
  const obj5Header = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuffer.length} >>\nstream\n`;
  const obj5Footer = '\nendstream\nendobj\n';

  const bHeader = enc.encode(header);
  const bObj1 = enc.encode(obj1);
  const bObj2 = enc.encode(obj2);
  const bObj3 = enc.encode(obj3);
  const bObj4H = enc.encode(obj4Header);
  const bObj4F = enc.encode(obj4Footer);
  const bObj5H = enc.encode(obj5Header);
  const bObj5F = enc.encode(obj5Footer);

  let offset = bHeader.length;
  const offsets = [0];

  offsets.push(offset); offset += bObj1.length;
  offsets.push(offset); offset += bObj2.length;
  offsets.push(offset); offset += bObj3.length;
  offsets.push(offset); offset += bObj4H.length + contentBytes.length + bObj4F.length;
  offsets.push(offset); offset += bObj5H.length + jpegBuffer.length + bObj5F.length;

  const xrefOffset = offset;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  const bXref = enc.encode(xref);
  const bTrailer = enc.encode(trailer);

  return new Blob([
    bHeader,
    bObj1,
    bObj2,
    bObj3,
    bObj4H,
    contentBytes,
    bObj4F,
    bObj5H,
    jpegBuffer,
    bObj5F,
    bXref,
    bTrailer
  ], { type: 'application/pdf' });
}

export async function add600DpiToPngBlob(blob) {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50) return blob;
    const ihdrEnd = 33;
    const physChunk = new Uint8Array([
      0x00, 0x00, 0x00, 0x09,
      0x70, 0x48, 0x59, 0x73,
      0x00, 0x00, 0x5C, 0x46,
      0x00, 0x00, 0x5C, 0x46,
      0x01,
      0x14, 0x94, 0x43, 0x41
    ]);
    const newBytes = new Uint8Array(bytes.length + physChunk.length);
    newBytes.set(bytes.subarray(0, ihdrEnd), 0);
    newBytes.set(physChunk, ihdrEnd);
    newBytes.set(bytes.subarray(ihdrEnd), ihdrEnd + physChunk.length);
    return new Blob([newBytes], { type: 'image/png' });
  } catch (err) {
    return blob;
  }
}

export async function openPVCCardModal(activeShare, shareUrl) {
  openModal(
    'Branded Emergency QR PVC Card',
    `
    <div style="text-align: center; padding: 20px;">
      <div class="upload-progress-bar" style="width: 100%;"></div>
      <p class="muted" style="margin-top: 12px;">Generating 600 DPI print-ready CR80 card...</p>
    </div>
    `
  );

  let cardCanvas = null;
  try {
    cardCanvas = await generateCR80CardCanvas(shareUrl);
  } catch (err) {
    console.error('Failed to generate PVC card canvas:', err);
    toast('Could not generate PVC card.');
    return;
  }

  const previewDataUrl = cardCanvas.toDataURL('image/png');
  const expiryText = activeShare && activeShare.expires_at
    ? `Valid until ${new Date(activeShare.expires_at).toLocaleDateString()} (${new Date(activeShare.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
    : 'Valid until revoked';

  openModal(
    'Branded Emergency QR PVC Card',
    `
    <div style="text-align: center;">
      <!-- Interactive Preview -->
      <div style="margin: 4px auto 14px; max-width: 240px;">
        <img id="pvcCardPreviewImg" src="${previewDataUrl}" alt="Emergency QR PVC Card Preview" style="width: 100%; border-radius: 12px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16); border: 1px solid #DBEAFE; display: block;" />
      </div>

      <!-- Card specs -->
      <p class="muted" style="font-size: 0.8rem; margin: 0 0 10px;">
        Standard CR80 Portrait (53.98 × 85.60 mm) • 1275 × 2022 px (600 DPI)
      </p>

      <!-- Token validity disclosure -->
      <div class="notice" style="text-align: left; margin-bottom: 14px; font-size: 0.82rem;">
        <strong>⚠️ Token Validity Disclosure:</strong>
        <p style="margin: 4px 0 0; color: var(--text-secondary);">
          This card is linked to your active emergency pass (${escapeHTML(expiryText)}). If this pass expires or is revoked, scanning the physical card will no longer display emergency health information.
        </p>
      </div>

      <!-- Action buttons -->
      <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
        <button class="btn primary" id="btnDownloadPVCPNG" type="button">📥 Download PNG (600 DPI)</button>
        <button class="btn secondary" id="btnDownloadPVCPDF" type="button">📄 Print-Ready PDF (CR80)</button>
        <button class="btn light" id="btnSharePVCCard" type="button">📲 Share Card</button>
        <button class="btn light" id="btnBackToPass" type="button">↩ Back to Settings</button>
      </div>
    </div>
    `
  );

  // Wire download PNG (Embedded 600 DPI pHYs Metadata)
  $('#btnDownloadPVCPNG').onclick = async () => {
    try {
      const rawBlob = await new Promise(r => cardCanvas.toBlob(r, 'image/png'));
      const blob600Dpi = await add600DpiToPngBlob(rawBlob);
      const url = URL.createObjectURL(blob600Dpi);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MediKey-EmergencyCard-CR80.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast('600 DPI PNG card downloaded.');
    } catch (e) {
      const link = document.createElement('a');
      link.href = previewDataUrl;
      link.download = `MediKey-EmergencyCard-CR80.png`;
      link.click();
      toast('PNG card downloaded.');
    }
  };

  // Wire download PDF
  $('#btnDownloadPVCPDF').onclick = async () => {
    try {
      toast('Synthesizing exact CR80 physical PDF...');
      const pdfBlob = await canvasToCR80Pdf(cardCanvas);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `MediKey-EmergencyCard-CR80.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 30000);
      toast('Print-ready CR80 PDF downloaded.');
    } catch (err) {
      console.error('Failed to create PDF:', err);
      toast('Could not synthesize PDF.');
    }
  };

  // Wire native share
  $('#btnSharePVCCard').onclick = async () => {
    try {
      if (navigator.share) {
        const blob = await new Promise(r => cardCanvas.toBlob(r, 'image/png'));
        const file = new File([blob], 'MediKey-EmergencyCard-CR80.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'MediKey Emergency QR Card',
            text: 'Here is my MediKey Emergency QR Medical Card.',
            files: [file]
          });
          toast('Card shared.');
          return;
        }
      }
      await navigator.clipboard.writeText(shareUrl);
      toast('Pass URL copied to clipboard (native image sharing unsupported on this browser).');
    } catch (e) {
      if (e.name !== 'AbortError') {
        prompt('Copy your Emergency Pass link:', shareUrl);
      }
    }
  };

  // Wire back to pass settings
  $('#btnBackToPass').onclick = () => {
    showQRModal();
  };
}

export async function resolveAndShowEmergencyShare(token) {
  if (!supabase) return;

  openModal(
    'Emergency Healthcare Verification',
    `<div style="text-align: center; padding: 20px;"><div class="upload-progress-bar" style="width: 100%;"></div><p class="muted">Verifying secure token with healthcare cloud...</p></div>`
  );

  try {
    const { data, error } = await supabase.rpc('get_emergency_share', { p_token: token });

    if (error || !data || !data.valid) {
      openModal(
        'Emergency Link Invalid',
        `
        <div style="text-align: center; padding: 10px;">
          <div style="font-size: 2.5rem; margin-bottom: 10px;">⚠️</div>
          <h3 style="color: #991b1b;">Link Expired or Revoked</h3>
          <p class="muted">${escapeHTML(data?.error || 'This emergency link is not valid or has been revoked by the patient.')}</p>
          <div class="notice danger">Do not rely on this expired pass for medical decisions. In life-threatening emergencies, call 112 immediately.</div>
          <button class="btn light" id="btnCloseExpired" type="button" style="margin-top: 12px;">Close</button>
        </div>
        `
      );
      $('#btnCloseExpired').onclick = closeModal;
      return;
    }

    const contactsHtml = (data.emergency_contacts && data.emergency_contacts.length)
      ? data.emergency_contacts.map(c => `
          <div style="padding: 8px 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-top: 5px;">
            <strong>${escapeHTML(c.name)}</strong> ${c.relationship ? `(${escapeHTML(c.relationship)})` : ''} — 
            <a href="tel:${escapeHTML(c.phone)}" style="color:var(--primary); font-weight:700;">☎ ${escapeHTML(c.phone)}</a>
          </div>
        `).join('')
      : '<p class="muted">No emergency contacts authorized.</p>';

    openModal(
      'Verified Emergency Healthcare Pass',
      `
      <div style="text-align: center; margin-bottom: 14px;">
        <span class="share-status-pill active">● Verified Patient Emergency Pass</span>
        <h3 style="margin: 8px 0 2px;">${escapeHTML(data.full_name || 'Patient')}</h3>
        <p class="muted" style="margin: 0;">Health ID: <strong>${escapeHTML(data.health_id)}</strong></p>
      </div>

      <div style="display: grid; gap: 8px; font-size: 0.9rem;">
        ${data.blood_group ? `<p><strong>Blood Group:</strong> <span class="badge-tag blood">${escapeHTML(data.blood_group)}</span></p>` : ''}
        ${data.allergies ? `<p><strong>Critical Allergies:</strong> <span style="color:#b91c1c; font-weight:700;">⚠️ ${escapeHTML(data.allergies)}</span></p>` : ''}
        ${data.conditions ? `<p><strong>Chronic Conditions:</strong> ⚕️ ${escapeHTML(data.conditions)}</p>` : ''}
        ${data.medicines ? `<p><strong>Active Medications:</strong> 💊 ${escapeHTML(data.medicines)}</p>` : ''}
        
        <div style="margin-top: 8px;">
          <strong style="color: var(--navy);">Emergency Contacts:</strong>
          ${contactsHtml}
        </div>
      </div>

      <div class="notice" style="margin-top: 16px;">
        <strong>🛡️ Cryptographic Access Notice:</strong> Loaded through a restricted emergency verification endpoint. No full medical history or private vault files were exposed.
      </div>
      `
    );
  } catch (err) {
    console.error('Error resolving emergency share:', err);
    toast('Failed to load emergency data.');
  }
}

export function stopQRScanner() {
  if (qrScannerInstance) {
    try {
      qrScannerInstance.stop().then(() => {
        try { qrScannerInstance.clear(); } catch (e) {}
      }).catch(() => {});
    } catch (e) {}
    qrScannerInstance = null;
  }
}

export function startInlineQRScanner(targetElementId = 'reader', onDecoded = null) {
  stopQRScanner();

  const container = $(`#${targetElementId}`);
  if (!container) return;

  if (!window.Html5Qrcode) {
    container.innerHTML = '<div class="notice danger">Local QR scanner engine is unavailable.</div>';
    return;
  }

  container.innerHTML = '';

  try {
    qrScannerInstance = new Html5Qrcode(targetElementId);
    qrScannerInstance.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      },
      decodedText => {
        stopQRScanner();
        if (typeof onDecoded === 'function') {
          onDecoded(decodedText);
        } else {
          handleScannedCode(decodedText);
        }
      },
      () => {}
    ).catch(err => {
      console.warn('Camera scan failed or permission denied:', err);
      const isDenied = String(err).toLowerCase().includes('permission') || String(err).toLowerCase().includes('denied');
      container.innerHTML = `
        <div style="padding: 24px 16px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📷</div>
          <strong style="color: var(--primary-dark); display: block; margin-bottom: 4px;">
            ${isDenied ? 'Camera Permission Denied' : 'Camera Unavailable'}
          </strong>
          <p style="font-size: 0.8rem; margin: 0 0 14px;">
            ${isDenied ? 'Please grant camera access in your browser settings to scan patient QR passes.' : 'Could not initialize camera hardware.'}
          </p>
          <label class="btn secondary sm" style="cursor: pointer; display: inline-flex;">
            🖼️ Scan from Image File
            <input type="file" id="inlineScanFileInput" accept="image/*" class="sr-only">
          </label>
        </div>
      `;

      const fileInput = $('#inlineScanFileInput');
      if (fileInput) {
        fileInput.onchange = e => {
          if (e.target.files && e.target.files[0]) {
            scanQRCodeFromFile(e.target.files[0], onDecoded);
          }
        };
      }
    });
  } catch (e) {
    container.innerHTML = `<div class="notice danger">Scanner error: ${escapeHTML(e.message)}</div>`;
  }
}

export async function scanQRCodeFromFile(file, onDecoded = null) {
  if (!file || !window.Html5Qrcode) return;
  try {
    toast('Scanning image for MediKey QR...');
    const html5QrCode = new Html5Qrcode('qrFileScannerHelper' + Date.now(), { verbose: false });
    const decodedText = await html5QrCode.scanFile(file, true);
    if (decodedText) {
      if (typeof onDecoded === 'function') {
        onDecoded(decodedText);
      } else {
        handleScannedCode(decodedText);
      }
    }
  } catch (err) {
    toast('No valid QR code found in the selected image.');
  }
}

export function openQRScannerModal() {
  openModal(
    'Scan MediKey Emergency Pass',
    `
    <p class="muted">Point your camera at a MediKey Emergency QR code to verify patient details.</p>
    <div id="reader"></div>
    <div class="notice">
      <strong>🔒 Camera Access:</strong> Scanning operates locally on your browser. Requires HTTPS or localhost.
    </div>
    `
  );

  startInlineQRScanner('reader', decodedText => {
    closeModal();
    handleScannedCode(decodedText);
  });
}

export function handleScannedCode(text) {
  if (!text) return;
  if (text.includes('#emergency-share=')) {
    const token = text.split('#emergency-share=')[1];
    resolveAndShowEmergencyShare(token);
  } else {
    openModal(
      'QR Code Scanned',
      `
      <div class="notice">The QR code was scanned, but is not recognized as a modern MediKey Emergency Share pass.</div>
      <p class="muted" style="overflow-wrap:anywhere;">Raw data: ${escapeHTML(text)}</p>
      `
    );
  }
}
