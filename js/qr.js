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
      colorDark: '#123575',
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
    'Secure Emergency QR Pass (Supabase Token)',
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
        <button class="btn primary" id="btnDownloadQR" type="button">📥 Download QR (PNG)</button>
        <button class="btn light" id="btnCopyShareLink" type="button">🔗 Copy Link</button>
        <button class="btn danger" id="btnRevokePass" type="button">🚫 Revoke This Pass</button>
      </div>

      <div class="notice" style="margin-top: 14px; text-align: left;">
        <strong>🔒 Zero Exposure Guarantee:</strong> The QR code points to a restricted Supabase RPC endpoint that only serves the fields you have enabled above.
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

  $('#btnCopyShareLink').onclick = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('Emergency pass URL copied to clipboard!');
    } catch (e) {
      prompt('Copy your Emergency Pass link:', shareUrl);
    }
  };
}

export async function resolveAndShowEmergencyShare(token) {
  if (!supabase) return;

  openModal(
    'Emergency Healthcare Verification',
    `<div style="text-align: center; padding: 20px;"><div class="upload-progress-bar" style="width: 100%;"></div><p class="muted">Verifying secure token with Supabase...</p></div>`
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
            <a href="tel:${escapeHTML(c.phone)}" style="color:var(--green); font-weight:700;">☎ ${escapeHTML(c.phone)}</a>
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
        <strong>🛡️ Cryptographic Access Notice:</strong> Loaded through a restricted Supabase RPC function. No full medical history or private vault files were exposed.
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
      qrScannerInstance.stop().then(() => qrScannerInstance.clear()).catch(() => {});
    } catch (e) {}
    qrScannerInstance = null;
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

  if (!window.Html5Qrcode) {
    $('#reader').innerHTML = '<div class="notice danger">Local QR scanner engine could not start.</div>';
    return;
  }

  try {
    qrScannerInstance = new Html5Qrcode('reader');
    qrScannerInstance.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 230, height: 230 } },
      decodedText => {
        stopQRScanner();
        closeModal();
        handleScannedCode(decodedText);
      },
      () => {}
    ).catch(err => {
      $('#reader').innerHTML = `<div class="notice danger">Camera access unavailable: ${escapeHTML(err)}</div>`;
    });
  } catch (e) {
    $('#reader').innerHTML = `<div class="notice danger">Scanner error: ${escapeHTML(e.message)}</div>`;
  }
}

function handleScannedCode(text) {
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
