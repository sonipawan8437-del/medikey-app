/**
 * MediKey | Main Application Orchestrator (script.js)
 * Mobile-First Healthcare Web Application Controller.
 * Coordinates Auth, Profile, Records, Storage, QR, and Emergency modules.
 */

import { $, $$, toast, openModal, closeModal, applyLanguage, escapeHTML, formatBytes, t, getLanguage } from './utils.js';
import { supabase } from './supabase-client.js';
import {
  getCurrentUser,
  setCurrentUser,
  showAuthScreen,
  showAuthAlert,
  hideAuthAlert,
  getSessionUser,
  registerUser,
  loginUser,
  requestPasswordReset,
  updatePassword,
  logoutUser
} from './auth.js';
import {
  getCurrentProfile,
  setCurrentProfile,
  loadProfile,
  openProfileEditor,
  updateProfileBannerUI,
  openViewProfileModal,
  openEditProfileModal,
  openPersonalInfoModal,
  openContactDetailsModal,
  openMedicalInfoModal,
  openChangePasswordModal,
  openAppPreferencesModal,
  checkAndRenderProfileCompletion
} from './profile.js';
import {
  loadAllRecords,
  getPrescriptions,
  getAppointments,
  getKit,
  getNotes,
  getHistory,
  openPrescriptionsModal,
  openAppointmentsModal,
  openMedicalKitModal,
  openNotesModal,
  openMedicalHistoryModal,
  updateRecordTileCounts
} from './records.js';
import {
  loadDocuments,
  getDocuments,
  openDocumentSection,
  getDocumentCounts,
  getSignedDocumentUrl
} from './storage.js';
import {
  refreshDashboardQR,
  showQRModal,
  resolveAndShowEmergencyShare,
  openQRScannerModal,
  stopQRScanner,
  startInlineQRScanner,
  scanQRCodeFromFile
} from './qr.js';
import {
  loadEmergencyContacts,
  getEmergencyContacts,
  getPrimaryEmergencyContact,
  openEmergencyContactsModal,
  updateEmergencyContactDisplay,
  openEmergencyCardModal,
  openEmergencyConfirmationModal,
  findNearbyHospitals
} from './emergency.js';

// ----------------------------------------------------------------------------
// Mobile View State & Navigation Manager
// ----------------------------------------------------------------------------
let currentActiveView = 'Home';
let activeRecordFilter = 'all';
let recordSearchQuery = '';

export function switchView(viewName, pushHistory = true) {
  if (currentActiveView === 'Scan' && viewName !== 'Scan') {
    stopQRScanner();
  }

  currentActiveView = viewName;

  // 1. Toggle Screen Sections
  const views = {
    Home: $('#viewHome'),
    Records: $('#viewRecords'),
    Scan: $('#viewScan'),
    Profile: $('#viewProfile')
  };

  Object.entries(views).forEach(([name, el]) => {
    if (!el) return;
    el.classList.toggle('active', name === viewName);
  });

  // 2. Update Nav Active State (both Desktop header and Mobile bottom nav)
  $$('[data-nav]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === viewName);
  });

  // 3. Update Top Bar Header & Back Button
  const topTitle = $('#topBarTitle');
  const topBack = $('#btnTopBack');
  const topBrand = $('#topBrand');

  if (viewName === 'Home') {
    if (topTitle) topTitle.textContent = 'MediKey';
    if (topBack) topBack.classList.add('hidden');
    if (topBrand) topBrand.classList.remove('hidden');
  } else {
    const titles = {
      Records: 'Medical Records',
      Scan: 'Scan Emergency Pass',
      Profile: 'Profile & Settings'
    };
    if (topTitle) topTitle.textContent = titles[viewName] || 'MediKey';
    if (topBack) topBack.classList.remove('hidden');
    if (topBrand) topBrand.classList.add('hidden');
  }

  // 4. View-specific activations
  if (viewName === 'Records') {
    renderMobileRecordsList();
  } else if (viewName === 'Scan') {
    startInlineQRScanner('reader');
  } else if (viewName === 'Home') {
    renderHomeClinicalPreviews();
  }

  window.scrollTo({ top: 0, behavior: 'instant' });

  if (pushHistory && window.history) {
    history.pushState({ view: viewName }, '', `#view=${viewName.toLowerCase()}`);
  }
}

// ----------------------------------------------------------------------------
// Full Application Synchronization
// ----------------------------------------------------------------------------
async function syncDashboardData(user) {
  if (!user) return;

  try {
    const [profile, , contacts, docs] = await Promise.all([
      loadProfile(user),
      loadAllRecords(user),
      loadEmergencyContacts(user.id),
      loadDocuments(user.id)
    ]);

    // Fetch user language settings if available
    if (supabase) {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings?.language) {
        applyLanguage(settings.language);
        if ($('#appLanguage')) $('#appLanguage').value = settings.language;
      }
    }

    // Update UI components
    const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
    updateProfileBannerUI(profile, primaryContact);
    updateEmergencyContactDisplay(contacts);
    updateRecordTileCounts(getDocumentCounts());
    refreshDashboardQR();
    renderHomeClinicalPreviews();

    $('#authScreen').classList.add('hidden');
    $('#appScreen').classList.remove('hidden');

    handleUrlRouting();
  } catch (err) {
    console.error('Error synchronizing dashboard:', err);
    toast('Unable to synchronize records: ' + (err.message || 'Please check connection'));
  }
}

// ----------------------------------------------------------------------------
// Clinical Priority Cards on Home Dashboard
// ----------------------------------------------------------------------------
export function renderHomeClinicalPreviews() {
  renderHomeAppointmentsPreview();
  renderHomePrescriptionsPreview();
  renderHomeDocumentsPreview();
}

function renderHomeAppointmentsPreview() {
  const container = $('#homeAppointmentsPreview');
  if (!container) return;

  const apts = getAppointments() || [];
  if (apts.length === 0) {
    container.innerHTML = `<div class="clinical-card-empty">${t('noAppointments')}</div>`;
    return;
  }

  const next = apts[0];
  container.innerHTML = `
    <div class="mini-item-row" style="padding: 6px 0;">
      <div class="mini-item-content">
        <strong style="font-size: 0.9rem; color: var(--text-main);">🏥 ${escapeHTML(next.clinic_name)}</strong>
        <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">
          ${t('recordDate')}: <strong>${escapeHTML(next.appointment_date)}</strong> ${next.appointment_time ? `· ${escapeHTML(next.appointment_time)}` : ''}
          ${next.reason ? `· <em>${escapeHTML(next.reason)}</em>` : ''}
        </p>
      </div>
      <button class="btn light sm btn-open-apt-quick" type="button">${t('detailsBtn')}</button>
    </div>
    ${apts.length > 1 ? `<div style="margin-top: 6px; font-size: 0.76rem; color: var(--primary); font-weight: 700;">＋ ${apts.length - 1} ${t('qaVisits')}</div>` : ''}
  `;

  const manageBtn = container.querySelector('.btn-open-apt-quick');
  if (manageBtn) {
    manageBtn.onclick = () => openAppointmentsModal(() => {
      renderHomeClinicalPreviews();
      updateRecordTileCounts(getDocumentCounts());
    });
  }
}

function renderHomePrescriptionsPreview() {
  const container = $('#homePrescriptionsPreview');
  if (!container) return;

  const rxs = getPrescriptions() || [];
  if (rxs.length === 0) {
    container.innerHTML = `<div class="clinical-card-empty">${t('noPrescriptions')}</div>`;
    return;
  }

  const top3 = rxs.slice(0, 3);
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${top3.map(rx => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border);">
          <div>
            <strong style="font-size: 0.88rem; color: var(--text-main);">💊 ${escapeHTML(rx.medication_name)}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 1px;">
              ${escapeHTML(rx.dosage || '')} ${rx.frequency ? `· ${escapeHTML(rx.frequency)}` : ''}
            </div>
          </div>
          ${rx.prescribing_doctor ? `<small style="font-size: 0.72rem; color: var(--text-tertiary);">${escapeHTML(rx.prescribing_doctor)}</small>` : ''}
        </div>
      `).join('')}
    </div>
    ${rxs.length > 3 ? `<div style="margin-top: 6px; font-size: 0.76rem; color: var(--primary); font-weight: 700;">＋ ${rxs.length - 3} ${t('qaMedicines')}</div>` : ''}
  `;
}

function renderHomeDocumentsPreview() {
  const container = $('#homeDocumentsPreview');
  if (!container) return;

  const docs = getDocuments() || {};
  const allDocs = [...(docs.medical || []), ...(docs.labs || []), ...(docs.certificates || [])];

  if (allDocs.length === 0) {
    container.innerHTML = `<div class="clinical-card-empty">${t('noDocuments')}</div>`;
    return;
  }

  const top3 = allDocs.slice(0, 3);
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${top3.map(d => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border);">
          <div style="min-width: 0; flex: 1;">
            <strong style="font-size: 0.88rem; color: var(--text-main); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              📄 ${escapeHTML(d.title)}
            </strong>
            <small style="font-size: 0.75rem; color: var(--text-muted);">
              ${escapeHTML(d.category)} · ${formatBytes(d.file_size)}
            </small>
          </div>
          <button class="btn light sm btn-quick-view-doc" data-path="${escapeHTML(d.file_path)}" type="button" style="min-height: 30px; padding: 2px 8px; font-size: 0.74rem;">
            ${t('view')}
          </button>
        </div>
      `).join('')}
    </div>
    ${allDocs.length > 3 ? `<div style="margin-top: 6px; font-size: 0.76rem; color: var(--primary); font-weight: 700;">＋ ${allDocs.length - 3} ${t('qaRecords')}</div>` : ''}
  `;

  container.querySelectorAll('.btn-quick-view-doc').forEach(btn => {
    btn.onclick = async () => {
      const path = btn.dataset.path;
      btn.disabled = true;
      btn.textContent = 'Loading...';
      try {
        const url = await getSignedDocumentUrl(path, 300);
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (err) {
        toast('Could not open document: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'View';
      }
    };
  });
}

// ----------------------------------------------------------------------------
// Dedicated Mobile Medical Records View Controller
// ----------------------------------------------------------------------------
export function renderMobileRecordsList() {
  const container = $('#recordsListContainer');
  if (!container) return;

  const docs = getDocuments() || {};
  const prescriptions = getPrescriptions() || [];
  const appointments = getAppointments() || [];
  const kit = getKit() || [];
  const notes = getNotes() || [];
  const history = getHistory() || {};

  let items = [];

  // 1. Documents
  if (['all', 'medical'].includes(activeRecordFilter)) {
    (docs.medical || []).forEach(d => items.push({ type: 'document', category: 'medical', title: d.title, sub: `${d.file_name} · ${formatBytes(d.file_size)}`, date: d.document_date, raw: d }));
  }
  if (['all', 'labs'].includes(activeRecordFilter)) {
    (docs.labs || []).forEach(d => items.push({ type: 'document', category: 'labs', title: d.title, sub: `${d.file_name} · ${formatBytes(d.file_size)}`, date: d.document_date, raw: d }));
  }
  if (['all', 'certificates'].includes(activeRecordFilter)) {
    (docs.certificates || []).forEach(d => items.push({ type: 'document', category: 'certificates', title: d.title, sub: `${d.file_name} · ${formatBytes(d.file_size)}`, date: d.document_date, raw: d }));
  }

  // 2. Prescriptions
  if (['all', 'prescriptions'].includes(activeRecordFilter)) {
    prescriptions.forEach(rx => items.push({ type: 'prescription', category: 'prescription', title: `💊 ${rx.medication_name}`, sub: `${rx.dosage || ''} ${rx.frequency || ''} ${rx.prescribing_doctor ? `· Dr. ${rx.prescribing_doctor}` : ''}`, date: rx.created_at ? rx.created_at.slice(0, 10) : '', raw: rx }));
  }

  // 3. Appointments
  if (['all'].includes(activeRecordFilter)) {
    appointments.forEach(apt => items.push({ type: 'appointment', category: 'medical', title: `📅 ${apt.clinic_name}`, sub: `Visit Date: ${apt.appointment_date} ${apt.appointment_time || ''}`, date: apt.appointment_date, raw: apt }));
  }

  // 4. Notes
  if (['all', 'notes'].includes(activeRecordFilter)) {
    notes.forEach(n => items.push({ type: 'note', category: 'labs', title: `📝 ${n.title}`, sub: n.note, date: n.created_at ? n.created_at.slice(0, 10) : '', raw: n }));
  }

  // 5. Medical Kit
  if (['all', 'kit'].includes(activeRecordFilter)) {
    kit.forEach(k => items.push({ type: 'kit', category: 'certificates', title: `🩹 ${k.item_name}`, sub: `Quantity: ${k.quantity || '1'}`, date: '', raw: k }));
  }

  // Search Filter
  if (recordSearchQuery.trim()) {
    const q = recordSearchQuery.toLowerCase();
    items = items.filter(it => (it.title || '').toLowerCase().includes(q) || (it.sub || '').toLowerCase().includes(q));
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="clinical-card" style="text-align: center; padding: 36px 16px;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">📂</div>
        <strong style="color: var(--text-main); display: block; font-size: 1rem; margin-bottom: 4px;">No Records Found</strong>
        <p class="muted" style="margin: 0 0 16px;">There are no entries matching your current filter.</p>
        <button class="btn primary sm" id="btnEmptyAddRecord" type="button">＋ Add Entry</button>
      </div>
    `;
    const addBtn = $('#btnEmptyAddRecord');
    if (addBtn) addBtn.onclick = showAddRecordActionSheet;
    return;
  }

  container.innerHTML = `
    <div class="crud-list">
      ${items.map(it => `
        <div class="record-card">
          <div class="record-body">
            <span class="record-badge ${escapeHTML(it.category)}">${escapeHTML(it.category)}</span>
            <strong>${escapeHTML(it.title)}</strong>
            <p>${escapeHTML(it.sub)}</p>
            ${it.date ? `<div class="record-meta">Recorded: ${escapeHTML(it.date)}</div>` : ''}
          </div>
          <div class="record-actions">
            ${it.type === 'document' ? `<button class="btn light sm btn-rec-view-doc" data-path="${escapeHTML(it.raw.file_path)}" type="button">View</button>` : ''}
            ${it.type === 'prescription' ? `<button class="btn light sm btn-rec-edit-rx" type="button">Manage</button>` : ''}
            ${it.type === 'appointment' ? `<button class="btn light sm btn-rec-edit-apt" type="button">Manage</button>` : ''}
            ${it.type === 'note' ? `<button class="btn light sm btn-rec-edit-note" type="button">Manage</button>` : ''}
            ${it.type === 'kit' ? `<button class="btn light sm btn-rec-edit-kit" type="button">Manage</button>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Attach Item Click Handlers
  container.querySelectorAll('.btn-rec-view-doc').forEach(btn => {
    btn.onclick = async () => {
      const path = btn.dataset.path;
      btn.disabled = true;
      btn.textContent = 'Opening...';
      try {
        const url = await getSignedDocumentUrl(path, 300);
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (e) {
        toast('Could not open file: ' + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'View';
      }
    };
  });

  const refreshAll = () => {
    renderMobileRecordsList();
    renderHomeClinicalPreviews();
    updateRecordTileCounts(getDocumentCounts());
  };

  container.querySelectorAll('.btn-rec-edit-rx').forEach(btn => {
    btn.onclick = () => openPrescriptionsModal(refreshAll);
  });

  container.querySelectorAll('.btn-rec-edit-apt').forEach(btn => {
    btn.onclick = () => openAppointmentsModal(refreshAll);
  });

  container.querySelectorAll('.btn-rec-edit-note').forEach(btn => {
    btn.onclick = () => openNotesModal(refreshAll);
  });

  container.querySelectorAll('.btn-rec-edit-kit').forEach(btn => {
    btn.onclick = () => openMedicalKitModal(refreshAll);
  });
}

function showAddRecordActionSheet() {
  const refreshAll = () => {
    renderMobileRecordsList();
    renderHomeClinicalPreviews();
    updateRecordTileCounts(getDocumentCounts());
  };

  openModal(
    'Add Healthcare Entry',
    `
    <p class="muted" style="margin-top: 0; font-size: 0.84rem;">Select the record type to add to your MediKey profile:</p>
    <div style="display: grid; gap: 8px;">
      <button class="btn secondary full" id="sheetAddDoc" type="button" style="justify-content: flex-start; text-align: left; padding: 12px 14px;">
        📄 <strong>Upload Medical Document / Lab Report</strong>
      </button>
      <button class="btn secondary full" id="sheetAddRx" type="button" style="justify-content: flex-start; text-align: left; padding: 12px 14px;">
        💊 <strong>Add Active Prescription / Medication</strong>
      </button>
      <button class="btn secondary full" id="sheetAddApt" type="button" style="justify-content: flex-start; text-align: left; padding: 12px 14px;">
        📅 <strong>Schedule Doctor Appointment</strong>
      </button>
      <button class="btn secondary full" id="sheetAddNote" type="button" style="justify-content: flex-start; text-align: left; padding: 12px 14px;">
        📝 <strong>Record Health Observation / Symptom Note</strong>
      </button>
      <button class="btn secondary full" id="sheetAddKit" type="button" style="justify-content: flex-start; text-align: left; padding: 12px 14px;">
        🩹 <strong>Add to Personal Medical Kit</strong>
      </button>
    </div>
    <button class="btn light full" id="sheetCancelAdd" type="button" style="margin-top: 12px;">Cancel</button>
    `
  );

  $('#sheetCancelAdd').onclick = closeModal;

  $('#sheetAddDoc').onclick = () => {
    closeModal();
    openDocumentSection('Hospital & Medical Records', 'medical', 'Upload discharge summaries, lab tests and health reports.', refreshAll);
  };
  $('#sheetAddRx').onclick = () => {
    closeModal();
    openPrescriptionsModal(refreshAll);
  };
  $('#sheetAddApt').onclick = () => {
    closeModal();
    openAppointmentsModal(refreshAll);
  };
  $('#sheetAddNote').onclick = () => {
    closeModal();
    openNotesModal(refreshAll);
  };
  $('#sheetAddKit').onclick = () => {
    closeModal();
    openMedicalKitModal(refreshAll);
  };
}

// ----------------------------------------------------------------------------
// Deterministic Authentication State Machine
// ----------------------------------------------------------------------------
export const AUTH_STATES = {
  INITIALIZING: 'INITIALIZING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  PASSWORD_RECOVERY: 'PASSWORD_RECOVERY',
  ERROR: 'ERROR'
};

let currentAuthState = AUTH_STATES.INITIALIZING;

export function getAuthState() {
  return currentAuthState;
}

export function setAuthState(state, payload = null) {
  currentAuthState = state;
  const splash = $('#splashScreen');
  const auth = $('#authScreen');
  const app = $('#appScreen');

  switch (state) {
    case AUTH_STATES.INITIALIZING:
      if (splash) {
        splash.classList.remove('hidden', 'fade-out');
      }
      auth?.classList.add('hidden');
      app?.classList.add('hidden');
      break;

    case AUTH_STATES.AUTHENTICATED:
      auth?.classList.add('hidden');
      app?.classList.remove('hidden');
      if (splash && !splash.classList.contains('hidden')) {
        splash.classList.add('fade-out');
        setTimeout(() => splash.classList.add('hidden'), 280);
      }
      break;

    case AUTH_STATES.UNAUTHENTICATED:
      app?.classList.add('hidden');
      auth?.classList.remove('hidden');
      showAuthScreen('loginPanel');
      if (splash && !splash.classList.contains('hidden')) {
        splash.classList.add('fade-out');
        setTimeout(() => splash.classList.add('hidden'), 280);
      }
      break;

    case AUTH_STATES.PASSWORD_RECOVERY:
      app?.classList.add('hidden');
      auth?.classList.remove('hidden');
      showAuthScreen('updatePasswordPanel');
      if (splash && !splash.classList.contains('hidden')) {
        splash.classList.add('fade-out');
        setTimeout(() => splash.classList.add('hidden'), 280);
      }
      break;

    case AUTH_STATES.ERROR:
      app?.classList.add('hidden');
      auth?.classList.remove('hidden');
      showAuthScreen('loginPanel');
      showAuthAlert(payload?.message || 'Unable to connect to healthcare service. Please check your connection and retry.', 'warning');
      if (splash && !splash.classList.contains('hidden')) {
        splash.classList.add('fade-out');
        setTimeout(() => splash.classList.add('hidden'), 280);
      }
      break;
  }
}

// ----------------------------------------------------------------------------
// URL Router (Tokens & Recovery Links)
// ----------------------------------------------------------------------------
let isRecoverySessionActive = false;

function handleUrlRouting() {
  const hash = window.location.hash || '';
  if (!hash) return;

  if (hash.startsWith('#emergency-share=')) {
    const token = hash.slice('#emergency-share='.length);
    setTimeout(() => resolveAndShowEmergencyShare(token), 100);
    return;
  }

  // Handle expired, invalid, or access-denied password recovery tokens
  if (hash.includes('error=') || hash.includes('error_code=otp_expired') || hash.includes('error_code=access_denied')) {
    setAuthState(AUTH_STATES.UNAUTHENTICATED);
    showAuthAlert('The password reset link has expired or is invalid. Please request a new recovery link.', 'error');
    window.history.replaceState(null, '', window.location.pathname);
    return;
  }

  // Handle valid incoming password recovery hash
  if (hash.includes('type=recovery')) {
    isRecoverySessionActive = true;
    setAuthState(AUTH_STATES.PASSWORD_RECOVERY);
    toast('Please set your new secure password.');
  }
}

// ----------------------------------------------------------------------------
// Rate Limit & Cooldown State Management
// ----------------------------------------------------------------------------
let isAuthProcessing = false;
let authCooldownTimer = null;

function startButtonCooldown(btn, originalText, seconds = 60) {
  if (!btn) return;
  if (authCooldownTimer) clearInterval(authCooldownTimer);

  let remaining = seconds;
  btn.disabled = true;
  btn.textContent = `Please wait (${remaining}s)...`;

  authCooldownTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(authCooldownTimer);
      authCooldownTimer = null;
      btn.disabled = false;
      btn.textContent = originalText;
    } else {
      btn.textContent = `Please wait (${remaining}s)...`;
    }
  }, 1000);
}

// ----------------------------------------------------------------------------
// Event Listeners & Interactive Routing
// ----------------------------------------------------------------------------
function initEventListeners() {
  // --- Navigation (Desktop Header Tabs & Mobile Bottom Navigation) ---
  $$('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const navTarget = btn.dataset.nav;
      if (['Home', 'Records', 'Scan', 'Profile'].includes(navTarget)) {
        switchView(navTarget);
      } else if (navTarget === 'Appointments') {
        openAppointmentsModal(() => renderHomeClinicalPreviews());
      } else if (navTarget === 'Health ID') {
        showQRModal();
      } else if (navTarget === 'Medical Kit') {
        openMedicalKitModal(() => renderHomeClinicalPreviews());
      }
    });
  });

  // Top Bar Back Button
  const btnTopBack = $('#btnTopBack');
  if (btnTopBack) {
    btnTopBack.onclick = () => switchView('Home');
  }

  // Floating Action Button on Records Screen
  const fabAdd = $('#fabAddRecord');
  if (fabAdd) fabAdd.onclick = showAddRecordActionSheet;

  // Records Category Filter Chips
  $$('.records-filter-bar .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.records-filter-bar .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeRecordFilter = chip.dataset.category || 'all';
      renderMobileRecordsList();
    });
  });

  // Records Search Input
  const searchInput = $('#recordSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      recordSearchQuery = e.target.value;
      renderMobileRecordsList();
    });
  }

  // Home Quick Action Links
  const btnManageApts = $('#btnManageAppointments');
  if (btnManageApts) {
    btnManageApts.onclick = () => openAppointmentsModal(() => renderHomeClinicalPreviews());
  }

  const btnManageRxs = $('#btnManagePrescriptions');
  if (btnManageRxs) {
    btnManageRxs.onclick = () => openPrescriptionsModal(() => renderHomeClinicalPreviews());
  }

  const btnManageDocs = $('#btnManageDocuments');
  if (btnManageDocs) {
    btnManageDocs.onclick = () => openDocumentSection('Hospital & Medical Records', 'medical', 'Upload discharge summaries and medical records.', () => renderHomeClinicalPreviews());
  }

  // Dedicated Scanner Controls
  const btnRestartScan = $('#btnRestartScanner');
  if (btnRestartScan) {
    btnRestartScan.onclick = () => startInlineQRScanner('reader');
  }

  const qrFileInput = $('#qrFileInput');
  if (qrFileInput) {
    qrFileInput.onchange = e => {
      if (e.target.files && e.target.files[0]) {
        scanQRCodeFromFile(e.target.files[0]);
      }
    };
  }

  // Profile View Items
  const onProfileUpdated = updatedProf => {
    updateProfileBannerUI(updatedProf, getPrimaryEmergencyContact());
    refreshDashboardQR();
  };

  const btnViewProfTab = $('#btnViewProfileTab');
  if (btnViewProfTab) {
    btnViewProfTab.onclick = () => openViewProfileModal(() => openEditProfileModal(onProfileUpdated));
  }

  const btnEditProfTab = $('#btnEditProfileFromTab');
  if (btnEditProfTab) {
    btnEditProfTab.onclick = () => openEditProfileModal(onProfileUpdated);
  }

  const itemPersonalView = $('#itemPersonalView');
  if (itemPersonalView) {
    itemPersonalView.onclick = () => openViewProfileModal(() => openEditProfileModal(onProfileUpdated));
  }

  const itemPersonal = $('#itemPersonal');
  if (itemPersonal) itemPersonal.onclick = () => openPersonalInfoModal(onProfileUpdated);

  const itemContact = $('#itemContact');
  if (itemContact) itemContact.onclick = () => openContactDetailsModal(onProfileUpdated);

  const itemMedInfo = $('#itemMedicalInfo');
  if (itemMedInfo) itemMedInfo.onclick = () => openMedicalInfoModal(onProfileUpdated);

  const itemMedHistory = $('#itemMedicalHistory');
  if (itemMedHistory) {
    itemMedHistory.onclick = () => openMedicalHistoryModal(() => renderHomeClinicalPreviews());
  }

  const itemICE = $('#itemICE');
  if (itemICE) {
    itemICE.onclick = () => openEmergencyContactsModal(contacts => {
      updateEmergencyContactDisplay(contacts);
      const prof = getCurrentProfile();
      if (prof) updateProfileBannerUI(prof, contacts[0]);
    });
  }

  const itemQRPass = $('#itemQRPass');
  if (itemQRPass) itemQRPass.onclick = showQRModal;

  const itemChangePw = $('#itemChangePassword');
  if (itemChangePw) itemChangePw.onclick = openChangePasswordModal;

  const itemAppPref = $('#itemAppPreferences');
  if (itemAppPref) itemAppPref.onclick = () => openAppPreferencesModal(lang => applyLanguage(lang));

  const itemPrivacy = $('#itemPrivacy');
  if (itemPrivacy) itemPrivacy.onclick = showPrivacyInfo;

  const itemLogout = $('#itemLogout');
  if (itemLogout) {
    itemLogout.onclick = async () => {
      if (!confirm('Sign out of your MediKey account?')) return;
      await logoutUser();
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      toast('Signed out safely.');
    };
  }

  // --- Auth Segmented Tabs ---
  const tabBtnLogin = $('#tabBtnLogin');
  const tabBtnRegister = $('#tabBtnRegister');

  if (tabBtnLogin && tabBtnRegister) {
    tabBtnLogin.onclick = () => {
      tabBtnLogin.classList.add('active');
      tabBtnRegister.classList.remove('active');
      showAuthScreen('loginPanel');
    };
    tabBtnRegister.onclick = () => {
      tabBtnRegister.classList.add('active');
      tabBtnLogin.classList.remove('active');
      showAuthScreen('registerPanel');
    };
  }

  // Password Visibility Toggle Buttons
  $$('.pw-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.dataset.target;
      const input = $(`#${targetId}`);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    };
  });

  // --- Auth Forms ---
  $('#registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (isAuthProcessing) return;

    const name = $('#regName').value.trim();
    const email = $('#regEmail').value.trim().toLowerCase();
    const pw = $('#regPassword').value;
    const confirm = $('#regConfirm').value;
    const lang = $('#regLanguage').value || 'en';

    if (!name) return toast('Please enter your full name.');
    if (!email || !email.includes('@')) return toast('Enter a valid email.');
    if (pw.length < 6) return toast('Password must be at least 6 characters.');
    if (pw !== confirm) return toast('Passwords do not match.');

    const btn = $('#registerForm button[type="submit"]');
    isAuthProcessing = true;
    btn.disabled = true;
    btn.textContent = 'Registering...';
    hideAuthAlert();

    try {
      const res = await registerUser(name, email, pw, lang);
      if (res.verified && res.user) {
        toast('Account registered and signed in!');
        await syncDashboardData(res.user);
        setAuthState(AUTH_STATES.AUTHENTICATED);
      }
      $('#registerForm').reset();
    } catch (err) {
      console.warn('Registration attempt failed:', err);

      if (err.isRateLimit) {
        showAuthAlert(
          'Too many email requests. Please try again later.',
          'warning',
          '<button id="alertBtnSwitchLogin" type="button">Sign in with an existing account</button>'
        );
        const switchBtn = $('#alertBtnSwitchLogin');
        if (switchBtn) {
          switchBtn.onclick = () => {
            showAuthScreen('loginPanel');
            if ($('#loginEmail')) $('#loginEmail').value = email;
          };
        }
        startButtonCooldown(btn, 'Register Account', 60);
      } else if (err.isExistingUser) {
        showAuthAlert(
          'An account with this email already exists.',
          'info',
          '<button id="alertBtnLoginNow" type="button">Click here to Sign In</button>'
        );
        const loginBtn = $('#alertBtnLoginNow');
        if (loginBtn) {
          loginBtn.onclick = () => {
            showAuthScreen('loginPanel');
            if ($('#loginEmail')) $('#loginEmail').value = email;
          };
        }
      } else {
        showAuthAlert(err.message || 'Registration request could not be processed.', 'error');
        toast(err.message || 'Registration failed.');
      }
    } finally {
      isAuthProcessing = false;
      if (!authCooldownTimer) {
        btn.disabled = false;
        btn.textContent = 'Register Account';
      }
    }
  });

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (isAuthProcessing) return;

    const email = $('#loginEmail').value.trim().toLowerCase();
    const pw = $('#loginPassword').value;
    if (!email || !pw) return toast('Please enter your email and password.');

    const btn = $('#loginForm button[type="submit"]');
    isAuthProcessing = true;
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    hideAuthAlert();

    try {
      const user = await loginUser(email, pw);
      toast('Signed in! Loading cloud records...');
      $('#loginForm').reset();
      await syncDashboardData(user);
      setAuthState(AUTH_STATES.AUTHENTICATED);
    } catch (err) {
      console.warn('Login attempt failed:', err);
      showAuthAlert(err.message || 'Incorrect email or password.', 'error');
      toast(err.message || 'Incorrect email or password.');
    } finally {
      isAuthProcessing = false;
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  // Demo Credentials Quick Filler Button
  const btnFillDemo = $('#btnFillDemoCreds');
  if (btnFillDemo) {
    btnFillDemo.onclick = () => {
      $('#loginEmail').value = 'demo.patient@medikey.local';
      $('#loginPassword').value = 'MediKeyDemo@2026';
      hideAuthAlert();
      toast('Demo credentials populated! Click Sign In to test.');
    };
  }

  $('#resetForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (isAuthProcessing) return;

    const email = $('#resetEmail').value.trim().toLowerCase();
    if (!email) return toast('Enter your email address.');

    const btn = $('#resetForm button[type="submit"]');
    isAuthProcessing = true;
    btn.disabled = true;
    btn.textContent = 'Sending recovery email...';
    hideAuthAlert();

    try {
      await requestPasswordReset(email);
    } catch (err) {
      console.warn('Password reset request failed:', err);
      if (err.isRateLimit) {
        showAuthAlert(
          'Too many email requests. Please try again later.',
          'warning'
        );
        startButtonCooldown(btn, 'Send Recovery Email', 60);
      } else {
        showAuthAlert(err.message || 'Could not send reset email.', 'error');
        toast(err.message || 'Could not send reset email.');
      }
    } finally {
      isAuthProcessing = false;
      if (!authCooldownTimer) {
        btn.disabled = false;
        btn.textContent = 'Send Recovery Email';
      }
    }
  });

  $('#updatePasswordForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (isAuthProcessing) return;

    const p1 = $('#updatePassword').value;
    const p2 = $('#updateConfirmPassword').value;
    if (p1.length < 6) return toast('Password must be at least 6 characters.');
    if (p1 !== p2) return toast('Passwords do not match.');

    const btn = $('#updatePasswordForm button[type="submit"]');
    isAuthProcessing = true;
    btn.disabled = true;
    btn.textContent = 'Updating password...';

    try {
      await updatePassword(p1);
      toast('Password updated successfully! Please sign in with your new password.');
      $('#updatePasswordForm').reset();
      isRecoverySessionActive = false;
      await logoutUser();
      window.history.replaceState(null, '', window.location.pathname);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    } catch (err) {
      toast(err.message || 'Failed to update password.');
    } finally {
      isAuthProcessing = false;
      btn.disabled = false;
      btn.textContent = 'Update Password';
    }
  });

  const btnCancelRecovery = $('#btnCancelRecovery');
  if (btnCancelRecovery) {
    btnCancelRecovery.onclick = () => {
      isRecoverySessionActive = false;
      window.history.replaceState(null, '', window.location.pathname);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    };
  }

  $('#showLogin').onclick = () => {
    if (tabBtnLogin) tabBtnLogin.click();
    else showAuthScreen('loginPanel');
  };
  $('#showRegister').onclick = () => {
    if (tabBtnRegister) tabBtnRegister.click();
    else showAuthScreen('registerPanel');
  };
  $('#forgotBtn').onclick = () => showAuthScreen('forgotPanel');
  $('#backLogin').onclick = () => {
    if (tabBtnLogin) tabBtnLogin.click();
    else showAuthScreen('loginPanel');
  };

  // --- Top Navigation & Menu ---
  const menuToggle = $('#menuToggle');
  const topMenu = $('#topMenu');

  function closeTopMenu() {
    if (topMenu) topMenu.classList.remove('open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle) {
    menuToggle.onclick = () => {
      const isOpen = topMenu.classList.contains('open');
      topMenu.classList.toggle('open', !isOpen);
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
    };
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('.menu-wrap')) closeTopMenu();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeTopMenu();
      closeModal();
    }
  });

  $('#closeModal').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', e => {
    if (e.target === $('#modalBackdrop')) closeModal();
  });

  // Top Menu Actions
  function handleEditProfile() {
    closeTopMenu();
    openEditProfileModal(onProfileUpdated);
  }

  const menuProf = $('#menuProfile');
  if (menuProf) {
    menuProf.onclick = () => {
      closeTopMenu();
      openViewProfileModal(() => openEditProfileModal(onProfileUpdated));
    };
  }

  const menuPersonal = $('#menuPersonal');
  if (menuPersonal) {
    menuPersonal.onclick = () => {
      closeTopMenu();
      openPersonalInfoModal(onProfileUpdated);
    };
  }

  const editBtn = $('#editBtn');
  if (editBtn) {
    editBtn.onclick = () => {
      closeTopMenu();
      openEditProfileModal(onProfileUpdated);
    };
  }

  const settingsBtn = $('#settingsBtn');
  if (settingsBtn) {
    settingsBtn.onclick = () => {
      closeTopMenu();
      switchView('Profile');
    };
  }

  const privacyBtn = $('#privacyBtn');
  if (privacyBtn) {
    privacyBtn.onclick = () => {
      closeTopMenu();
      showPrivacyInfo();
    };
  }

  const btnLearnPriv = $('#btnLearnPrivacy');
  if (btnLearnPriv) btnLearnPriv.onclick = () => showPrivacyInfo();

  const logoutBtn = $('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      closeTopMenu();
      if (!confirm('Sign out of your MediKey account?')) return;
      await logoutUser();
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      toast('Logged out safely.');
    };
  }

  // Accidental SOS Protection: Opens confirmation action sheet
  $('#sosCallBtn').onclick = e => {
    e.preventDefault();
    openEmergencyConfirmationModal();
  };

  // Emergency & Hospital Actions
  $('#emergencyBtn').onclick = openEmergencyCardModal;
  $('#qrBtn').onclick = showQRModal;
  const onEditContact = () => {
    openEmergencyContactsModal(contacts => {
      updateEmergencyContactDisplay(contacts);
      const prof = getCurrentProfile();
      if (prof) updateProfileBannerUI(prof, contacts[0]);
    });
  };
  $('#editEmergencyContactBtn').onclick = onEditContact;
  const editContactSide = $('#editEmergencyContactBtnSide');
  if (editContactSide) editContactSide.onclick = onEditContact;

  $('#findHospitalsBtn').onclick = findNearbyHospitals;
  $('#openHospitalMapBtn').onclick = () => {
    const url = $('#openHospitalMapBtn').dataset.url || 'https://www.google.com/maps/search/hospitals/';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Language Switcher & Persistence
  $('#appLanguage').addEventListener('change', async e => {
    const lang = e.target.value;
    applyLanguage(lang);
    const user = getCurrentUser();
    if (supabase && user) {
      await supabase.from('user_settings').upsert({ user_id: user.id, language: lang });
      toast(t('prefSavedToast'));
    }
  });

  window.addEventListener('medikey:languagechange', () => {
    const user = getCurrentUser();
    if (user) {
      const profile = getCurrentProfile();
      const contacts = getEmergencyContacts() || [];
      const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
      updateProfileBannerUI(profile, primaryContact);
      updateEmergencyContactDisplay(contacts);
      renderHomeClinicalPreviews();
    }
  });

  // Section Tiles Router (6 Tiles Compatibility)
  $$('.tile[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.section;
      const refreshCounts = () => updateRecordTileCounts(getDocumentCounts());

      switch (sec) {
        case 'Personal Information': openViewProfileModal(() => openEditProfileModal(onProfileUpdated)); break;
        case 'Medical Records': openDocumentSection('Hospital & Medical Records', 'medical', 'Store discharge summaries and records.', refreshCounts); break;
        case 'Medical History': openMedicalHistoryModal(refreshCounts); break;
        case 'Prescriptions': openPrescriptionsModal(refreshCounts); break;
        case 'Lab Reports': openDocumentSection('Laboratory & Diagnostic Reports', 'labs', 'Store blood tests and radiology reports.', refreshCounts); break;
        case 'Medical Certificates': openDocumentSection('Medical & Fitness Certificates', 'certificates', 'Store fitness cards and vaccine passes.', refreshCounts); break;
      }
    });
  });

  // Quick Action Items Router
  $$('.quick-card[data-section], .quick-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.section;
      switch (sec) {
        case 'Medical Records':
          switchView('Records');
          break;
        case 'Prescriptions':
          openPrescriptionsModal(() => renderHomeClinicalPreviews());
          break;
        case 'Emergency Card':
          openEmergencyCardModal();
          break;
        case 'Share Health ID':
          showQRModal();
          break;
        case 'Add Health Note':
          openNotesModal(() => renderHomeClinicalPreviews());
          break;
        case 'Scan QR Code':
          switchView('Scan');
          break;
        case 'Privacy & Safety':
          showPrivacyInfo();
          break;
      }
    });
  });

  $$('.quick-card[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.quick;
      if (q === 'appointments') {
        openAppointmentsModal(() => renderHomeClinicalPreviews());
      } else if (q === 'medical-kit') {
        openMedicalKitModal(() => renderHomeClinicalPreviews());
      }
    });
  });

  // Hardware / Browser Back Navigation
  window.addEventListener('popstate', e => {
    const backdrop = $('#modalBackdrop');
    if (backdrop && backdrop.classList.contains('open')) {
      closeModal();
      return;
    }
    if (currentActiveView !== 'Home') {
      switchView('Home', false);
    }
  });

  // Network Online/Offline Listeners
  window.addEventListener('online', () => {
    const net = $('#networkStatus');
    if (net) {
      net.className = 'online-badge';
      net.textContent = '● Secure Cloud';
    }
    toast('Network online. Synchronized with secure cloud.');
  });

  window.addEventListener('offline', () => {
    const net = $('#networkStatus');
    if (net) {
      net.className = 'offline-badge';
      net.textContent = '● Offline';
    }
    toast('Network offline. Cached static app shell active.');
  });
}

function showPrivacyInfo() {
  openModal(
    'MediKey Architecture & Security',
    `
    <div style="display: grid; gap: 10px; font-size: 0.88rem; line-height: 1.6;">
      <div class="notice" style="margin: 0; background: var(--soft-blue); border-color: var(--border); color: var(--text-main);">
        <strong>⚡ Secure Healthcare Architecture:</strong><br>
        Organized into clean modular components, encrypted in transit, with strict patient data isolation and secure cloud storage.
      </div>
      <ul style="margin: 0; padding-left: 20px;">
        <li><strong>Responsive Healthcare Design:</strong> Balanced desktop multi-column dashboard, mobile bottom navigation bar, touch targets $\ge 44\text{px}$, and safe-area insets.</li>
        <li><strong>Patient Data Isolation:</strong> Strict database isolation across all health records. Each patient can strictly only view their own records.</li>
        <li><strong>Private Cloud Vault:</strong> Documents are stored with time-limited signed cryptographic URLs.</li>
        <li><strong>Emergency Cryptographic Tokens:</strong> Emergency passes invoke a restricted server-side verification without exposing full health history.</li>
        <li><strong>Offline PWA Service Worker:</strong> Caches static app shell only; strictly ignores medical APIs and auth tokens.</li>
      </ul>
    </div>
    `
  );
}

// ----------------------------------------------------------------------------
// Advanced PWA: Installation, Smart Updates, Offline & Shortcuts Management
// ----------------------------------------------------------------------------
let deferredInstallPrompt = null;
let newWorkerWaiting = null;

export function isStandaloneMode() {
  return (typeof window !== 'undefined') && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIosDevice() {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export function updateInstallUiState() {
  const btn = $('#menuInstallApp');
  if (!btn) return;
  if (isStandaloneMode()) {
    btn.classList.add('hidden');
  } else {
    btn.classList.remove('hidden');
  }
}

export function openIosInstallModal() {
  openModal(
    'Install MediKey on iOS',
    `
    <div style="text-align: left; padding: 4px 0;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
        <img src="assets/icons/icon-192.png" width="48" height="48" style="border-radius: 12px;" alt="MediKey">
        <div>
          <strong style="display: block; font-size: 0.95rem;">Install MediKey on iPhone / iPad</strong>
          <span class="muted" style="font-size: 0.8rem;">Add to your Home Screen for instant standalone access</span>
        </div>
      </div>
      <ol style="margin: 0; padding-left: 20px; font-size: 0.88rem; line-height: 1.8;">
        <li>Open <strong>MediKey</strong> in Safari.</li>
        <li>Tap the <strong>Share</strong> button <span style="font-size: 1.1rem;">⎋</span> in the Safari toolbar.</li>
        <li>Scroll down and tap <strong>Add to Home Screen</strong> <span style="font-size: 1.1rem;">⊞</span>.</li>
        <li>Tap <strong>Add</strong> in the top-right corner to confirm.</li>
      </ol>
      <div class="notice" style="margin-top: 14px; font-size: 0.8rem;">
        Once added, MediKey launches instantly from your home screen in full-screen standalone mode.
      </div>
      <div style="text-align: right; margin-top: 14px;">
        <button class="btn primary sm" id="btnCloseIosInstall" type="button">Got It</button>
      </div>
    </div>
    `
  );
  const btn = $('#btnCloseIosInstall');
  if (btn) btn.onclick = closeModal;
}

export async function promptPWAInstall() {
  if (isStandaloneMode()) {
    toast('MediKey is already running in standalone mode.');
    return;
  }
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      toast('Thank you for installing MediKey!');
    }
    deferredInstallPrompt = null;
    updateInstallUiState();
    return;
  }
  if (isIosDevice()) {
    openIosInstallModal();
    return;
  }
  openModal(
    'Install MediKey App',
    `
    <div style="text-align: center; padding: 10px;">
      <img src="assets/icons/icon-192.png" width="64" height="64" style="border-radius: 16px; margin-bottom: 10px;" alt="MediKey">
      <h3>Install MediKey</h3>
      <p class="muted" style="margin: 0 0 14px; font-size: 0.86rem;">
        Install MediKey on your device for instant access to your emergency medical ID, offline shell, and fast startup.
      </p>
      <div class="notice" style="text-align: left; font-size: 0.82rem;">
        Click the <strong>Install</strong> icon in your browser address bar (⊕ or 📲), or open your browser menu and choose <strong>"Install MediKey"</strong>.
      </div>
      <button class="btn light" id="btnCloseGenericInstall" type="button" style="margin-top: 14px;">Close</button>
    </div>
    `
  );
  const closeBtn = $('#btnCloseGenericInstall');
  if (closeBtn) closeBtn.onclick = closeModal;
}

if (typeof window !== 'undefined') {
  window.medikeyPromptInstall = promptPWAInstall;
}

function initPwaInstallation() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    updateInstallUiState();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    updateInstallUiState();
    toast('MediKey installed successfully!');
  });

  $('#menuInstallApp')?.addEventListener('click', () => {
    promptPWAInstall();
  });

  updateInstallUiState();
}

function isUserBusyWithCriticalTask() {
  if (window.__medikey_is_uploading) return true;
  const title = $('#modalTitle')?.textContent || '';
  if ($('#modalBackdrop')?.classList.contains('open') && title.toLowerCase().includes('emergency')) {
    return true;
  }
  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  if (['input', 'textarea'].includes(activeTag)) return true;
  return false;
}

function showUpdateNotification(worker) {
  newWorkerWaiting = worker;
  const banner = $('#pwaUpdateBanner');
  if (banner) banner.classList.remove('hidden');
}

function initPwaSmartUpdates(reg) {
  if (!reg) return;

  if (reg.waiting && navigator.serviceWorker.controller) {
    showUpdateNotification(reg.waiting);
  }

  reg.addEventListener('updatefound', () => {
    const installingWorker = reg.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        showUpdateNotification(installingWorker);
      }
    });
  });

  $('#btnPwaUpdateNow')?.addEventListener('click', () => {
    if (newWorkerWaiting) {
      newWorkerWaiting.postMessage({ type: 'SKIP_WAITING' });
    }
    $('#pwaUpdateBanner')?.classList.add('hidden');
  });

  $('#btnPwaUpdateLater')?.addEventListener('click', () => {
    $('#pwaUpdateBanner')?.classList.add('hidden');
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    if (isUserBusyWithCriticalTask()) {
      console.log('[PWA] Postponing refresh: user engaged in critical task.');
      return;
    }
    refreshing = true;
    window.location.reload();
  });
}

function initNetworkAndOfflineExperience() {
  const updateNetUi = () => {
    const isOnline = navigator.onLine;
    const badge = $('#networkStatus');

    if (badge) {
      if (isOnline) {
        badge.textContent = '● Secure Cloud';
        badge.className = 'online-badge';
      } else {
        badge.textContent = '○ Offline';
        badge.className = 'offline-badge';
      }
    }
  };

  window.addEventListener('online', () => {
    toast('Internet connection restored.');
    $('#offlineOverlay')?.classList.add('hidden');
    updateNetUi();
    const user = getCurrentUser();
    if (user) syncDashboardData(user);
  });

  window.addEventListener('offline', () => {
    toast('You are currently offline.');
    updateNetUi();
  });

  $('#btnRetryOffline')?.addEventListener('click', () => {
    if (navigator.onLine) {
      $('#offlineOverlay')?.classList.add('hidden');
      toast('Internet reconnected.');
      const user = getCurrentUser();
      if (user) syncDashboardData(user);
    } else {
      toast('Still offline. Please check your WiFi or mobile data.');
    }
  });

  updateNetUi();
}

function handleAppShortcuts() {
  const searchParams = new URLSearchParams(window.location.search);
  const action = searchParams.get('action');
  if (!action) return;

  const cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState(null, '', cleanUrl);

  switch (action) {
    case 'scan':
      switchView('Scan');
      break;
    case 'id':
      switchView('Home');
      break;
    case 'contacts':
      const user = getCurrentUser();
      if (user) {
        openEmergencyContactsModal();
      } else {
        toast('Please sign in to view your emergency contacts.');
      }
      break;
  }
}

// ----------------------------------------------------------------------------
// Application Bootstrap
// ----------------------------------------------------------------------------
async function bootstrap() {
  initEventListeners();
  initPwaInstallation();
  initNetworkAndOfflineExperience();

  // Fast Emergency Route Bypass: If URL is an emergency share, bypass full auth init
  const hash = window.location.hash || '';
  if (hash.startsWith('#emergency-share=')) {
    handleUrlRouting();
    setAuthState(AUTH_STATES.UNAUTHENTICATED);
    return;
  }

  // State 1: Keep startup splash visible, keep auth & app screens hidden
  setAuthState(AUTH_STATES.INITIALIZING);

  // Register PWA Service Worker with Smart Updates Hook
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      initPwaSmartUpdates(reg);
    }).catch(err => {
      console.warn('PWA ServiceWorker registration failed:', err);
    });
  }

  // Supabase auth state change listener for PASSWORD_RECOVERY
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        isRecoverySessionActive = true;
        setAuthState(AUTH_STATES.PASSWORD_RECOVERY);
        toast('Please set your new secure password.');
      }
    });
  }

  // Handle incoming hash routing and PWA app shortcuts
  handleUrlRouting();
  handleAppShortcuts();

  // If a password recovery session is active, keep user on recovery panel
  if (isRecoverySessionActive) {
    setAuthState(AUTH_STATES.PASSWORD_RECOVERY);
    return;
  }

  // State 2 & 3: Check active Supabase session deterministically
  try {
    const user = await getSessionUser();
    if (user) {
      await syncDashboardData(user);
      setAuthState(AUTH_STATES.AUTHENTICATED);
      return;
    }

    // Default to Login view
    setAuthState(AUTH_STATES.UNAUTHENTICATED);
  } catch (err) {
    console.warn('Error during authentication initialization:', err);
    if (!navigator.onLine) {
      setAuthState(AUTH_STATES.ERROR, { message: 'Network offline. Cached static app shell active.' });
    } else {
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
