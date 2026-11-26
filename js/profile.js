/**
 * MediKey | Profile Management & Single Source of Truth (profile.js)
 * Clean, structured healthcare profile architecture with focused modals.
 */

import { supabase } from './supabase-client.js';
import { $, $$, toast, openModal, closeModal, escapeHTML, compressImageToBlob, t, getLanguage } from './utils.js';
import { getCurrentUser } from './auth.js';

let currentProfile = null;

export function getCurrentProfile() {
  return currentProfile;
}

export function setCurrentProfile(profile) {
  currentProfile = profile;
}

export async function loadProfile(user) {
  if (!supabase || !user) return null;

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const healthId = 'MK-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data: newProf } = await supabase.from('profiles').insert({
      id: user.id,
      health_id: healthId,
      full_name: user.user_metadata?.full_name || 'Patient',
      email: user.email
    }).select().single();
    profile = newProf;
  }

  currentProfile = profile || {
    id: user.id,
    health_id: 'MK-DEMO',
    full_name: 'Patient',
    blood_group: 'Unknown'
  };

  return currentProfile;
}

/**
 * Updates all profile-related banners and ID cards across the application.
 */
export function updateProfileBannerUI(profile, primaryContact) {
  const p = profile || currentProfile;
  if (!p) return;

  const fullName = p.full_name || 'Patient';
  const healthId = p.health_id || '—';
  const lang = getLanguage();

  let greetingPrefix = 'Hello';
  if (lang === 'hi') greetingPrefix = 'नमस्ते';
  else if (lang === 'mr') greetingPrefix = 'नमस्कार';

  const displayedGreeting = (fullName === 'Patient' || fullName === 'मरीज') ? t('helloPatient') : `${greetingPrefix}, ${fullName}`;

  if ($('#displayName')) $('#displayName').textContent = fullName;
  if ($('#displayId')) $('#displayId').textContent = `${t('healthIdLabel')} ${healthId}`;
  if ($('#welcomeGreeting')) $('#welcomeGreeting').textContent = displayedGreeting;
  if ($('#welcomeHealthId')) $('#welcomeHealthId').textContent = `${t('digitalPassVerified')} · ID: ${healthId}`;
  if ($('#profileTabName')) $('#profileTabName').textContent = fullName;
  if ($('#profileTabId')) $('#profileTabId').textContent = `${t('healthIdLabel')} ${healthId}`;

  const initials = fullName
    .split(/\s+/)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'MK';

  ['#avatar', '#profileTabAvatar'].forEach(selector => {
    const el = $(selector);
    if (!el) return;
    if (p.avatar_url) {
      el.innerHTML = `<img src="${escapeHTML(p.avatar_url)}" alt="Avatar">`;
    } else {
      el.textContent = initials;
    }
  });

  // Critical Alerts Badges
  const badgeContainer = $('#criticalAlerts');
  if (badgeContainer) {
    badgeContainer.innerHTML = '';
    if (p.blood_group && p.blood_group !== 'Unknown') {
      badgeContainer.innerHTML += `<span class="badge-tag blood">🩸 ${t('bloodGroupLabel')}: ${escapeHTML(p.blood_group)}</span>`;
    }
    if (p.allergies) {
      badgeContainer.innerHTML += `<span class="badge-tag allergy">⚠️ ${t('knownAllergiesLabel')}: ${escapeHTML(p.allergies)}</span>`;
    }
    if (p.chronic_conditions) {
      badgeContainer.innerHTML += `<span class="badge-tag condition">⚕️ ${escapeHTML(p.chronic_conditions)}</span>`;
    }
  }

  // Emergency summary card
  const notProvided = t('notProvided');
  const contactText = primaryContact ? `${escapeHTML(primaryContact.name)} (${escapeHTML(primaryContact.phone)})` : notProvided;
  const allergyText = p.allergies ? escapeHTML(p.allergies) : notProvided;
  if ($('#emergencySummary')) {
    $('#emergencySummary').innerHTML = `<strong>${t('icePrefix')}</strong> ${contactText} &nbsp;|&nbsp; <strong>${t('allergiesPrefix')}</strong> ${allergyText}`;
  }

  checkAndRenderProfileCompletion(p, primaryContact);
}

/**
 * First-Time UX: Optional, lightweight profile completion banner based on real stored data.
 */
export function checkAndRenderProfileCompletion(profile, primaryContact) {
  const container = $('#profileCompletionBanner');
  if (!container) return;

  const p = profile || currentProfile;
  if (!p) {
    container.classList.add('hidden');
    return;
  }

  // Check if dismissed in this session
  if (sessionStorage.getItem('medikey_dismiss_profile_setup') === 'true') {
    container.classList.add('hidden');
    return;
  }

  const items = [
    { label: 'Full Name', done: !!p.full_name && p.full_name !== 'Patient' },
    { label: 'Blood Group', done: !!p.blood_group && p.blood_group !== 'Unknown' },
    { label: 'Emergency Contact', done: !!primaryContact },
    { label: 'Contact Phone', done: !!p.phone }
  ];

  const completed = items.filter(i => i.done).length;
  const total = items.length;

  if (completed === total) {
    container.classList.add('hidden');
    return;
  }

  container.className = 'profile-completion-card';
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
      <div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 1rem;">💡</span>
          <strong style="color: var(--primary-dark); font-size: 0.88rem;">Profile Setup (${completed}/${total} completed)</strong>
        </div>
        <p style="margin: 4px 0 8px; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4;">
          Add your blood group and emergency contact so first responders can assist you in an emergency.
        </p>
      </div>
      <button id="btnDismissSetup" type="button" aria-label="Dismiss" style="font-size: 1.1rem; color: var(--text-tertiary); padding: 2px 6px;">×</button>
    </div>
    <div style="height: 4px; background: var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
      <div style="width: ${(completed / total) * 100}%; height: 100%; background: var(--primary); transition: width 0.3s ease;"></div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn primary sm" id="btnCompleteSetup" type="button" style="font-size: 0.76rem; padding: 5px 12px;">Complete Profile →</button>
      <button class="btn light sm" id="btnSkipSetup" type="button" style="font-size: 0.76rem; padding: 5px 10px;">Maybe Later</button>
    </div>
  `;
  container.classList.remove('hidden');

  const onDismiss = () => {
    sessionStorage.setItem('medikey_dismiss_profile_setup', 'true');
    container.classList.add('hidden');
  };

  const btnDismiss = $('#btnDismissSetup');
  if (btnDismiss) btnDismiss.onclick = onDismiss;

  const btnSkip = $('#btnSkipSetup');
  if (btnSkip) btnSkip.onclick = onDismiss;

  const btnComplete = $('#btnCompleteSetup');
  if (btnComplete) {
    btnComplete.onclick = () => {
      openMedicalInfoModal(updated => {
        updateProfileBannerUI(updated, primaryContact);
      });
    };
  }
}

/**
 * 1. View Profile: Dedicated READ-ONLY Profile Overview with explicit Edit button.
 */
export function openViewProfileModal(onEditRequested) {
  const p = currentProfile;
  if (!p) return toast('Please sign in to view profile.');

  const initials = (p.full_name || 'Patient')
    .split(/\s+/)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'MK';

  openModal(
    t('profileOverviewTitle'),
    `
    <div class="profile-overview-card">
      <div style="text-align: center; padding-bottom: 14px; border-bottom: 1px solid var(--border); margin-bottom: 14px;">
        <div class="avatar" style="margin: 0 auto 10px; width: 68px; height: 68px; font-size: 1.6rem;">
          ${p.avatar_url ? `<img src="${escapeHTML(p.avatar_url)}" alt="Avatar">` : initials}
        </div>
        <h2 style="margin: 0 0 4px; font-size: 1.25rem; color: var(--text-main);">${escapeHTML(p.full_name || 'Patient')}</h2>
        <span class="patient-id-chip">${escapeHTML(p.health_id || 'MK-DEMO')}</span>
      </div>

      <div style="display: grid; gap: 12px; font-size: 0.88rem;">
        <div class="profile-overview-field">
          <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">${t('regEmailAccountId')}</span>
          <div style="color: var(--text-main); font-weight: 600;">${escapeHTML(p.email || 'Registered Patient')}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="profile-overview-field">
            <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">${t('bloodGroupLabel')}</span>
            <div style="color: var(--emergency-dark); font-weight: 800; font-size: 1rem;">${escapeHTML(p.blood_group || t('unknown'))}</div>
          </div>
          <div class="profile-overview-field">
            <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">${t('ageLabel')}</span>
            <div style="color: var(--text-main); font-weight: 600;">${p.age ? `${p.age} ${t('yearsOld')}` : t('notSpecified')}</div>
          </div>
        </div>

        <div class="profile-overview-field">
          <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">${t('phoneNumberLabel')}</span>
          <div style="color: var(--text-main); font-weight: 600;">${escapeHTML(p.phone || t('notProvided'))}</div>
        </div>

        <div class="profile-overview-field">
          <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">${t('knownAllergiesLabel')}</span>
          <div style="color: ${p.allergies ? 'var(--amber-700)' : 'var(--text-main)'}; font-weight: 600;">
            ${escapeHTML(p.allergies || t('notProvided'))}
          </div>
        </div>

        <div class="profile-overview-field">
          <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">${t('chronicConditionsLabel')}</span>
          <div style="color: var(--text-main); font-weight: 600;">${escapeHTML(p.chronic_conditions || t('notProvided'))}</div>
        </div>

        <div class="profile-overview-field">
          <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">${t('activeMedicationsLabel')}</span>
          <div style="color: var(--text-main); font-weight: 600;">${escapeHTML(p.current_medications || t('notProvided'))}</div>
        </div>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; border-top: 1px solid var(--border); padding-top: 14px;">
        <button class="btn light sm" type="button" id="btnCloseViewProfile">${t('closeBtn')}</button>
        <button class="btn primary sm" type="button" id="btnProceedToEdit">${t('proceedToEdit')}</button>
      </div>
    </div>
    `
  );

  $('#btnCloseViewProfile').onclick = closeModal;
  $('#btnProceedToEdit').onclick = () => {
    closeModal();
    if (typeof onEditRequested === 'function') {
      onEditRequested();
    } else {
      openEditProfileModal();
    }
  };
}

/**
 * 2. Edit Profile: Organized, Tabbed Profile Editor.
 */
export function openEditProfileModal(onProfileSaved, initialSection = 'personal') {
  const p = currentProfile;
  const user = getCurrentUser();
  if (!p || !user) return toast('Please sign in to edit profile.');

  openModal(
    t('editPatientProfile'),
    `
    <div>
      <!-- Segmented Tab Navigation for Organized Editing -->
      <div class="auth-tab-bar" style="margin-bottom: 16px;">
        <button class="auth-tab-btn ${initialSection === 'personal' ? 'active' : ''}" type="button" id="tabSectionPersonal">${t('tabPersonal')}</button>
        <button class="auth-tab-btn ${initialSection === 'contact' ? 'active' : ''}" type="button" id="tabSectionContact">${t('tabContact')}</button>
        <button class="auth-tab-btn ${initialSection === 'medical' ? 'active' : ''}" type="button" id="tabSectionMedical">${t('tabMedical')}</button>
      </div>

      <form id="organizedProfileForm">
        <!-- Section A: Personal Identity -->
        <div id="sectionPersonal" class="${initialSection === 'personal' ? '' : 'hidden'}">
          <div class="field">
            <label for="fPhotoFile">${t('profileAvatarLabel')}</label>
            <input id="fPhotoFile" type="file" accept="image/*">
            <img id="fPhotoPreview" class="photo-preview ${p.avatar_url ? '' : 'hidden'}" src="${escapeHTML(p.avatar_url || '')}" alt="Avatar preview">
          </div>
          <div class="field">
            <label for="fFullName">${t('fullName')}</label>
            <input id="fFullName" required maxlength="70" value="${escapeHTML(p.full_name || '')}" placeholder="e.g. Alex Morgan">
          </div>
          <div class="field">
            <label for="fAgeVal">${t('ageFieldLabel')}</label>
            <input id="fAgeVal" type="number" min="0" max="130" value="${escapeHTML(p.age || '')}" placeholder="e.g. 34">
          </div>
        </div>

        <!-- Section B: Contact Details -->
        <div id="sectionContact" class="${initialSection === 'contact' ? '' : 'hidden'}">
          <div class="field">
            <label for="fEmailReadonly">${t('accountEmailReadonly')}</label>
            <input id="fEmailReadonly" type="email" value="${escapeHTML(p.email || user.email || '')}" readonly style="background: var(--bg-subtle); color: var(--text-secondary); cursor: not-allowed;">
            <small style="color: var(--text-secondary); font-size: 0.74rem;">${t('accountEmailNote')}</small>
          </div>
          <div class="field">
            <label for="fPhoneVal">${t('mobileNumberLabel')}</label>
            <input id="fPhoneVal" type="tel" value="${escapeHTML(p.phone || '')}" placeholder="e.g. +1 555-0199">
          </div>
        </div>

        <!-- Section C: Medical Parameters -->
        <div id="sectionMedical" class="${initialSection === 'medical' ? '' : 'hidden'}">
          <div class="field">
            <label for="fBloodVal">${t('bloodGroupSelectLabel')}</label>
            <select id="fBloodVal">
              ${['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
                .map(v => `<option value="${v}" ${p.blood_group === v ? 'selected' : ''}>${v === 'Unknown' ? t('unknown') : v}</option>`)
                .join('')}
            </select>
          </div>
          <div class="field">
            <label for="fAllergiesVal">${t('knownAllergiesField')}</label>
            <input id="fAllergiesVal" value="${escapeHTML(p.allergies || '')}" placeholder="e.g. Penicillin, Tree nuts">
          </div>
          <div class="field">
            <label for="fMedicinesVal">${t('currentMedicationsField')}</label>
            <input id="fMedicinesVal" value="${escapeHTML(p.current_medications || '')}" placeholder="e.g. Metformin 500mg, Lisinopril 10mg">
          </div>
          <div class="field">
            <label for="fConditionsVal">${t('chronicConditionsField')}</label>
            <input id="fConditionsVal" value="${escapeHTML(p.chronic_conditions || '')}" placeholder="e.g. Type 1 Diabetes, Hypertension">
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; border-top: 1px solid var(--border); padding-top: 14px;">
          <button class="btn light" type="button" id="btnCancelEditProf">${t('cancelBtn')}</button>
          <button class="btn primary" type="submit" id="btnSaveFullProfile">${t('saveChangesBtn')}</button>
        </div>
      </form>
    </div>
    `
  );

  // Tab switching logic
  const tabPersonal = $('#tabSectionPersonal');
  const tabContact = $('#tabSectionContact');
  const tabMedical = $('#tabSectionMedical');
  const secPersonal = $('#sectionPersonal');
  const secContact = $('#sectionContact');
  const secMedical = $('#sectionMedical');

  function switchTab(target) {
    tabPersonal.classList.toggle('active', target === 'personal');
    tabContact.classList.toggle('active', target === 'contact');
    tabMedical.classList.toggle('active', target === 'medical');
    secPersonal.classList.toggle('hidden', target !== 'personal');
    secContact.classList.toggle('hidden', target !== 'contact');
    secMedical.classList.toggle('hidden', target !== 'medical');
  }

  tabPersonal.onclick = () => switchTab('personal');
  tabContact.onclick = () => switchTab('contact');
  tabMedical.onclick = () => switchTab('medical');

  let newAvatarFile = null;

  $('#fPhotoFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      newAvatarFile = await compressImageToBlob(file, 240, 0.85);
      const preview = $('#fPhotoPreview');
      preview.src = URL.createObjectURL(newAvatarFile);
      preview.classList.remove('hidden');
    } catch (err) {
      toast('Image error: ' + err.message);
    }
  });

  $('#btnCancelEditProf').onclick = closeModal;

  $('#organizedProfileForm').onsubmit = async e => {
    e.preventDefault();
    const saveBtn = $('#btnSaveFullProfile');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      let avatarUrl = p.avatar_url;

      if (newAvatarFile && supabase) {
        const filePath = `${user.id}/avatar_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('medikey-avatars')
          .upload(filePath, newAvatarFile, { upsert: true, contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: signedData } = await supabase.storage
            .from('medikey-avatars')
            .createSignedUrl(filePath, 60 * 60 * 24 * 365);
          if (signedData) avatarUrl = signedData.signedUrl;
        }
      }

      const updates = {
        full_name: $('#fFullName').value.trim() || p.full_name,
        age: parseInt($('#fAgeVal').value, 10) || null,
        phone: $('#fPhoneVal').value.trim(),
        blood_group: $('#fBloodVal').value,
        allergies: $('#fAllergiesVal').value.trim(),
        current_medications: $('#fMedicinesVal').value.trim(),
        chronic_conditions: $('#fConditionsVal').value.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      Object.assign(currentProfile, updates);
      closeModal();
      toast('Profile updated successfully.');
      if (typeof onProfileSaved === 'function') onProfileSaved(currentProfile);
    } catch (err) {
      console.error('Error saving profile:', err);
      toast('Failed to save profile: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  };
}

/**
 * 3. Personal Identity: Dedicated Modal for Name, Age, and Avatar.
 */
export function openPersonalInfoModal(onProfileSaved) {
  openEditProfileModal(onProfileSaved, 'personal');
}

/**
 * 4. Contact Details: Dedicated Modal for Phone & Email.
 */
export function openContactDetailsModal(onProfileSaved) {
  openEditProfileModal(onProfileSaved, 'contact');
}

/**
 * 5. Medical Info: Dedicated Modal for Blood Group, Allergies & Conditions.
 */
export function openMedicalInfoModal(onProfileSaved) {
  openEditProfileModal(onProfileSaved, 'medical');
}

/**
 * 6. Change Password: Dedicated Modal for Logged-In Users.
 */
export function openChangePasswordModal() {
  const user = getCurrentUser();
  if (!user) return toast('Please sign in to change your password.');

  openModal(
    t('changePasswordTitle'),
    `
    <form id="changePasswordModalForm">
      <p class="muted" style="margin: 0 0 14px; font-size: 0.88rem; line-height: 1.45;">
        ${t('updatePasswordSubtitle')}
      </p>

      <div class="field">
        <label for="cpCurrent">${t('currentPasswordLabel')}</label>
        <div class="pw-wrap">
          <input id="cpCurrent" type="password" required autocomplete="current-password" placeholder="${t('passwordPlaceholder')}">
          <button class="pw-toggle-btn" type="button" aria-label="Toggle password visibility" data-target="cpCurrent">👁️</button>
        </div>
      </div>

      <div class="field">
        <label for="cpNew">${t('newPasswordChangeLabel')}</label>
        <div class="pw-wrap">
          <input id="cpNew" type="password" minlength="6" required autocomplete="new-password" placeholder="${t('passwordMin')}">
          <button class="pw-toggle-btn" type="button" aria-label="Toggle password visibility" data-target="cpNew">👁️</button>
        </div>
      </div>

      <div class="field">
        <label for="cpConfirm">${t('confirmNewPasswordChangeLabel')}</label>
        <div class="pw-wrap">
          <input id="cpConfirm" type="password" minlength="6" required autocomplete="new-password" placeholder="${t('confirmPasswordPlaceholder')}">
          <button class="pw-toggle-btn" type="button" aria-label="Toggle password visibility" data-target="cpConfirm">👁️</button>
        </div>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; border-top: 1px solid var(--border); padding-top: 14px;">
        <button class="btn light" type="button" id="btnCancelChangePw">${t('cancelBtn')}</button>
        <button class="btn primary" type="submit" id="btnSubmitChangePw">${t('updatePasswordBtn')}</button>
      </div>
    </form>
    `
  );

  // Toggle buttons inside modal
  $$('#changePasswordModalForm .pw-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      const target = $(`#${btn.dataset.target}`);
      if (!target) return;
      if (target.type === 'password') {
        target.type = 'text';
        btn.textContent = '🙈';
      } else {
        target.type = 'password';
        btn.textContent = '👁️';
      }
    };
  });

  $('#btnCancelChangePw').onclick = closeModal;

  $('#changePasswordModalForm').onsubmit = async e => {
    e.preventDefault();
    const curPw = $('#cpCurrent').value;
    const newPw = $('#cpNew').value;
    const confirmPw = $('#cpConfirm').value;

    if (!curPw) return toast('Please enter your current password.');
    if (newPw.length < 6) return toast('New password must be at least 6 characters.');
    if (newPw !== confirmPw) return toast('New passwords do not match.');
    if (newPw === curPw) return toast('New password must be different from current password.');

    const btn = $('#btnSubmitChangePw');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
      // 1. Verify current password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: curPw
      });
      if (signInErr) {
        throw new Error('Current password is incorrect. Please verify and try again.');
      }

      // 2. Update to new password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPw
      });
      if (updateErr) throw updateErr;

      closeModal();
      toast('Password updated successfully.');
    } catch (err) {
      console.warn('Password change failed:', err);
      toast(err.message || 'Failed to update password.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Update Password';
    }
  };
}

/**
 * 7. App Preferences: Language and Display settings.
 */
export function openAppPreferencesModal(onSaved) {
  const user = getCurrentUser();
  const currentLang = localStorage.getItem('medikey_lang') || 'en';
  const isStandalone = (typeof window !== 'undefined') &&
    (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

  openModal(
    t('appPreferencesTitle'),
    `
    <form id="appPreferencesForm">
      <div class="field">
        <label for="prefLanguage">${t('preferredLanguageSetting')}</label>
        <select id="prefLanguage">
          <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
          <option value="hi" ${currentLang === 'hi' ? 'selected' : ''}>हिन्दी (Hindi)</option>
          <option value="mr" ${currentLang === 'mr' ? 'selected' : ''}>मराठी (Marathi)</option>
        </select>
      </div>

      <div style="margin: 14px 0; padding-top: 14px; border-top: 1px solid var(--border);">
        <strong style="font-size: 0.84rem; display: block; margin-bottom: 4px;">PWA Application Mode</strong>
        <p class="muted" style="font-size: 0.78rem; margin: 0 0 8px;">
          ${isStandalone ? '✅ Running in standalone application mode on this device.' : 'Install MediKey on your device home screen for quick offline access and fast startup.'}
        </p>
        ${!isStandalone ? `<button class="btn secondary sm" id="btnInstallFromPref" type="button">${t('menuInstallApp')}</button>` : ''}
      </div>

      <div class="notice" style="margin: 14px 0; font-size: 0.8rem;">
        <strong>Offline Storage:</strong> Your preferences are stored securely in your patient settings and will synchronize across all your devices.
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
        <button class="btn light" type="button" id="btnCancelPref">${t('cancelBtn')}</button>
        <button class="btn primary" type="submit" id="btnSavePref">${t('saveChangesBtn')}</button>
      </div>
    </form>
    `
  );

  $('#btnCancelPref').onclick = closeModal;

  const installBtn = $('#btnInstallFromPref');
  if (installBtn) {
    installBtn.onclick = () => {
      closeModal();
      if (typeof window.medikeyPromptInstall === 'function') {
        window.medikeyPromptInstall();
      }
    };
  }

  $('#appPreferencesForm').onsubmit = async e => {
    e.preventDefault();
    const lang = $('#prefLanguage').value;

    localStorage.setItem('medikey_lang', lang);
    if ($('#appLanguage')) $('#appLanguage').value = lang;

    if (supabase && user) {
      await supabase.from('user_settings').upsert({ user_id: user.id, language: lang });
    }

    closeModal();
    toast('Preferences saved successfully.');
    if (typeof onSaved === 'function') onSaved(lang);
  };
}

// Backward compatibility alias
export const openProfileEditor = openEditProfileModal;
