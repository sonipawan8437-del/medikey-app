/**
 * MediKey | Main Application Orchestrator (script.js)
 * Clean native ES module coordinating Auth, Profile, Records, Storage, QR, and Emergency modules.
 */

import { $, $$, toast, openModal, closeModal, applyLanguage } from './utils.js';
import { supabase, isSupabaseConnected } from './supabase-client.js';
import {
  getCurrentUser,
  setCurrentUser,
  showAuthScreen,
  getSessionUser,
  registerUser,
  loginUser,
  requestPasswordReset,
  updatePassword,
  logoutUser
} from './auth.js';
import {
  getCurrentProfile,
  loadProfile,
  openProfileEditor,
  updateProfileBannerUI
} from './profile.js';
import {
  loadAllRecords,
  openPrescriptionsModal,
  openAppointmentsModal,
  openMedicalKitModal,
  openNotesModal,
  openMedicalHistoryModal,
  updateRecordTileCounts
} from './records.js';
import {
  loadDocuments,
  openDocumentSection,
  getDocumentCounts
} from './storage.js';
import {
  refreshDashboardQR,
  showQRModal,
  resolveAndShowEmergencyShare,
  openQRScannerModal,
  stopQRScanner
} from './qr.js';
import {
  loadEmergencyContacts,
  getPrimaryEmergencyContact,
  openEmergencyContactsModal,
  updateEmergencyContactDisplay,
  openEmergencyCardModal,
  findNearbyHospitals
} from './emergency.js';

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

    $('#authScreen').classList.add('hidden');
    $('#appScreen').classList.remove('hidden');

    handleUrlRouting();
  } catch (err) {
    console.error('Error synchronizing dashboard:', err);
    toast('Error loading records from cloud: ' + err.message);
  }
}

// ----------------------------------------------------------------------------
// URL Router (Tokens & Recovery Links)
// ----------------------------------------------------------------------------
function handleUrlRouting() {
  const hash = window.location.hash;
  if (!hash) return;

  // 1. First-responder Emergency Share Token (#emergency-share=<token>)
  if (hash.startsWith('#emergency-share=')) {
    const token = hash.slice('#emergency-share='.length);
    setTimeout(() => resolveAndShowEmergencyShare(token), 100);
    return;
  }

  // 2. Supabase Password Recovery Link (#type=recovery)
  if (hash.includes('type=recovery')) {
    showAuthScreen('updatePasswordPanel');
    toast('Please set your new password.');
  }
}

// ----------------------------------------------------------------------------
// Event Listeners & Interactive Routing
// ----------------------------------------------------------------------------
function initEventListeners() {
  // --- Auth Forms ---
  $('#registerForm').addEventListener('submit', async e => {
    e.preventDefault();
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
    btn.disabled = true;
    btn.textContent = 'Registering...';

    try {
      const res = await registerUser(name, email, pw, lang);
      if (res.verified && res.user) {
        toast('Account registered and signed in!');
        await syncDashboardData(res.user);
      }
      $('#registerForm').reset();
    } catch (err) {
      toast(err.message || 'Registration failed.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Register Account';
    }
  });

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim().toLowerCase();
    const pw = $('#loginPassword').value;
    if (!email || !pw) return toast('Please enter your email and password.');

    const btn = $('#loginForm button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
      const user = await loginUser(email, pw);
      toast('Signed in! Loading cloud records...');
      $('#loginForm').reset();
      await syncDashboardData(user);
    } catch (err) {
      toast(err.message || 'Incorrect email or password.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  $('#resetForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#resetEmail').value.trim().toLowerCase();
    if (!email) return toast('Enter your email address.');

    const btn = $('#resetForm button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending link...';

    try {
      await requestPasswordReset(email);
    } catch (err) {
      toast(err.message || 'Could not send reset email.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Recovery Email';
    }
  });

  $('#updatePasswordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const p1 = $('#updatePassword').value;
    const p2 = $('#updateConfirmPassword').value;
    if (p1.length < 6) return toast('Password must be at least 6 characters.');
    if (p1 !== p2) return toast('Passwords do not match.');

    try {
      await updatePassword(p1);
      toast('Password updated successfully! Please sign in.');
      $('#updatePasswordForm').reset();
      showAuthScreen('loginPanel');
    } catch (err) {
      toast(err.message || 'Failed to update password.');
    }
  });

  $('#showLogin').onclick = () => showAuthScreen('loginPanel');
  $('#showRegister').onclick = () => showAuthScreen('registerPanel');
  $('#forgotBtn').onclick = () => showAuthScreen('forgotPanel');
  $('#backLogin').onclick = () => showAuthScreen('loginPanel');

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
  const handleEditProfile = () => {
    closeTopMenu();
    openProfileEditor(updatedProf => {
      updateProfileBannerUI(updatedProf, getPrimaryEmergencyContact());
      refreshDashboardQR();
    });
  };

  $('#menuProfile').onclick = handleEditProfile;
  $('#menuPersonal').onclick = handleEditProfile;
  $('#editBtn').onclick = handleEditProfile;
  $('#settingsBtn').onclick = () => { closeTopMenu(); showPrivacyInfo(); };
  $('#privacyBtn').onclick = () => { closeTopMenu(); showPrivacyInfo(); };
  $('#logoutBtn').onclick = async () => {
    closeTopMenu();
    await logoutUser();
    $('#appScreen').classList.add('hidden');
    $('#authScreen').classList.remove('hidden');
    showAuthScreen('loginPanel');
    toast('Logged out safely.');
  };

  // Emergency & Hospital Actions
  $('#emergencyBtn').onclick = openEmergencyCardModal;
  $('#qrBtn').onclick = showQRModal;
  $('#editEmergencyContactBtn').onclick = () => {
    openEmergencyContactsModal(contacts => {
      updateEmergencyContactDisplay(contacts);
      const prof = getCurrentProfile();
      if (prof) updateProfileBannerUI(prof, contacts[0]);
    });
  };

  $('#findHospitalsBtn').onclick = findNearbyHospitals;
  $('#openHospitalMapBtn').onclick = () => {
    const url = $('#openHospitalMapBtn').dataset.url || 'https://www.google.com/maps/search/hospitals/';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Language Switcher
  $('#appLanguage').addEventListener('change', async e => {
    const lang = e.target.value;
    applyLanguage(lang);
    const user = getCurrentUser();
    if (supabase && user) {
      await supabase.from('user_settings').upsert({ user_id: user.id, language: lang });
      toast('Language preference saved.');
    }
  });

  // Section Tiles Router
  $$('.tile[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.section;
      const refreshCounts = () => updateRecordTileCounts(getDocumentCounts());

      switch (sec) {
        case 'Personal Information': handleEditProfile(); break;
        case 'Medical Records': openDocumentSection('Hospital & Medical Records', 'medical', 'Store discharge summaries and records.', refreshCounts); break;
        case 'Medical History': openMedicalHistoryModal(refreshCounts); break;
        case 'Prescriptions': openPrescriptionsModal(refreshCounts); break;
        case 'Lab Reports': openDocumentSection('Laboratory & Diagnostic Reports', 'labs', 'Store blood tests and radiology reports.', refreshCounts); break;
        case 'Medical Certificates': openDocumentSection('Medical & Fitness Certificates', 'certificates', 'Store fitness cards and vaccine passes.', refreshCounts); break;
      }
    });
  });

  // Quick Action Items Router
  $$('.quick-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.section;
      switch (sec) {
        case 'Emergency Card': openEmergencyCardModal(); break;
        case 'Share Health ID': showQRModal(); break;
        case 'Add Health Note': openNotesModal(); break;
        case 'Scan QR Code': openQRScannerModal(); break;
        case 'Privacy & Safety': showPrivacyInfo(); break;
      }
    });
  });

  // Mobile Bottom Navigation Bar
  $$('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-nav]').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      const refreshCounts = () => updateRecordTileCounts(getDocumentCounts());

      const actions = {
        Home: () => { closeModal(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
        Appointments: () => openAppointmentsModal(refreshCounts),
        'Health ID': showQRModal,
        'Medical Kit': () => openMedicalKitModal(refreshCounts),
        Profile: handleEditProfile
      };
      if (actions[btn.dataset.nav]) actions[btn.dataset.nav]();
    });
  });

  // Network Online/Offline Listeners
  window.addEventListener('online', () => {
    const net = $('#networkStatus');
    if (net) {
      net.className = 'online-badge';
      net.textContent = '● Cloud Sync';
    }
    toast('Network online. Synchronized with Supabase.');
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
      <div class="notice" style="margin: 0; background: #f0fdf4; border-color: #bbf7d0; color: #166534;">
        <strong>⚡ Supabase Modular Architecture (Phase 02):</strong><br>
        Organized into clean ES modules with Row-Level Security (RLS) and private cloud storage buckets.
      </div>
      <ul style="margin: 0; padding-left: 20px;">
        <li><strong>Native ES Modules:</strong> Separated into <code>supabase-client.js</code>, <code>auth.js</code>, <code>profile.js</code>, <code>records.js</code>, <code>storage.js</code>, <code>qr.js</code>, <code>emergency.js</code>, and <code>utils.js</code>.</li>
        <li><strong>Row Level Security:</strong> Hardened on all 10 PostgreSQL tables. Each user can only view their own records.</li>
        <li><strong>Private Cloud Vault:</strong> Documents are stored in <code>medikey-documents</code> with 5-minute signed URLs.</li>
        <li><strong>Cryptographic Share Tokens:</strong> Emergency passes invoke a restricted server-side RPC without exposing full health history.</li>
        <li><strong>PWA Service Worker:</strong> Caches static app shell only; strictly ignores medical APIs and auth tokens.</li>
      </ul>
    </div>
    `
  );
}

// ----------------------------------------------------------------------------
// Application Bootstrap
// ----------------------------------------------------------------------------
async function bootstrap() {
  initEventListeners();

  // Register PWA Service Worker (Static shell only)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('PWA ServiceWorker registration failed:', err);
    });
  }

  // Handle incoming hash routing (e.g. #emergency-share=...)
  handleUrlRouting();

  // Check active Supabase session
  const user = await getSessionUser();
  if (user) {
    await syncDashboardData(user);
    return;
  }

  // Default to Login view
  $('#authScreen').classList.remove('hidden');
  showAuthScreen('loginPanel');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
