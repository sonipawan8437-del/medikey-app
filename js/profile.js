/**
 * MediKey | Profile Management & Single Source of Truth (profile.js)
 * Clean, structured healthcare profile architecture with focused modals.
 */

import { supabase } from './supabase-client.js';
import { $, $$, toast, openModal, closeModal, escapeHTML, compressImageToBlob } from './utils.js';
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

  if ($('#displayName')) $('#displayName').textContent = fullName;
  if ($('#displayId')) $('#displayId').textContent = `Health ID: ${healthId}`;
  if ($('#welcomeGreeting')) $('#welcomeGreeting').textContent = `Hello, ${fullName}`;
  if ($('#welcomeHealthId')) $('#welcomeHealthId').textContent = `Digital Healthcare Pass · ID: ${healthId}`;
  if ($('#profileTabName')) $('#profileTabName').textContent = fullName;
  if ($('#profileTabId')) $('#profileTabId').textContent = `Health ID: ${healthId}`;

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
      badgeContainer.innerHTML += `<span class="badge-tag blood">🩸 Blood: ${escapeHTML(p.blood_group)}</span>`;
    }
    if (p.allergies) {
      badgeContainer.innerHTML += `<span class="badge-tag allergy">⚠️ Allergy: ${escapeHTML(p.allergies)}</span>`;
    }
    if (p.chronic_conditions) {
      badgeContainer.innerHTML += `<span class="badge-tag condition">⚕️ ${escapeHTML(p.chronic_conditions)}</span>`;
    }
  }

  // Emergency summary card
  const contactText = primaryContact ? `${escapeHTML(primaryContact.name)} (${escapeHTML(primaryContact.phone)})` : 'Not provided';
  const allergyText = p.allergies ? escapeHTML(p.allergies) : 'Not provided';
  if ($('#emergencySummary')) {
    $('#emergencySummary').innerHTML = `<strong>ICE:</strong> ${contactText} &nbsp;|&nbsp; <strong>Allergies:</strong> ${allergyText}`;
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
    'Patient Profile Overview',
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
          <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">REGISTERED EMAIL (ACCOUNT ID)</span>
          <div style="color: var(--text-main); font-weight: 600;">${escapeHTML(p.email || 'Registered Patient')}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="profile-overview-field">
            <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">BLOOD GROUP</span>
            <div style="color: var(--emergency-dark); font-weight: 800; font-size: 1rem;">${escapeHTML(p.blood_group || 'Unknown')}</div>
          </div>
          <div class="profile-overview-field">
            <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">AGE</span>
            <div style="color: var(--text-main); font-weight: 600;">${p.age ? `${p.age} years` : 'Not specified'}</div>
          </div>
        </div>

        <div class="profile-overview-field">
          <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">PHONE NUMBER</span>
          <div style="color: var(--text-main); font-weight: 600;">${escapeHTML(p.phone || 'Not provided')}</div>
        </div>

        <div class="profile-overview-field">
          <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">KNOWN ALLERGIES</span>
          <div style="color: ${p.allergies ? 'var(--amber-700)' : 'var(--text-main)'}; font-weight: 600;">
            ${escapeHTML(p.allergies || 'Not provided')}
          </div>
        </div>

        <div class="profile-overview-field">
          <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">CHRONIC CONDITIONS</span>
          <div style="color: var(--text-main); font-weight: 600;">${escapeHTML(p.chronic_conditions || 'Not provided')}</div>
        </div>

        <div class="profile-overview-field">
          <span style="color: var(--text-secondary); font-size: 0.78rem; font-weight: 700;">ACTIVE MEDICATIONS</span>
          <div style="color: var(--text-main); font-weight: 600;">${escapeHTML(p.current_medications || 'Not provided')}</div>
        </div>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; border-top: 1px solid var(--border); padding-top: 14px;">
        <button class="btn light sm" type="button" id="btnCloseViewProfile">Close</button>
        <button class="btn primary sm" type="button" id="btnProceedToEdit">✎ Edit Profile</button>
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
    'Edit Patient Profile',
    `
    <div>
      <!-- Segmented Tab Navigation for Organized Editing -->
      <div class="auth-tab-bar" style="margin-bottom: 16px;">
        <button class="auth-tab-btn ${initialSection === 'personal' ? 'active' : ''}" type="button" id="tabSectionPersonal">👤 Personal</button>
        <button class="auth-tab-btn ${initialSection === 'contact' ? 'active' : ''}" type="button" id="tabSectionContact">📞 Contact</button>
        <button class="auth-tab-btn ${initialSection === 'medical' ? 'active' : ''}" type="button" id="tabSectionMedical">🩺 Medical</button>
      </div>

      <form id="organizedProfileForm">
        <!-- Section A: Personal Identity -->
        <div id="sectionPersonal" class="${initialSection === 'personal' ? '' : 'hidden'}">
          <div class="field">
            <label for="fPhotoFile">Profile Avatar (Tap to select picture)</label>
            <input id="fPhotoFile" type="file" accept="image/*">
            <img id="fPhotoPreview" class="photo-preview ${p.avatar_url ? '' : 'hidden'}" src="${escapeHTML(p.avatar_url || '')}" alt="Avatar preview">
          </div>
          <div class="field">
            <label for="fFullName">Full name *</label>
            <input id="fFullName" required maxlength="70" value="${escapeHTML(p.full_name || '')}" placeholder="e.g. Alex Morgan">
          </div>
          <div class="field">
            <label for="fAgeVal">Age</label>
            <input id="fAgeVal" type="number" min="0" max="130" value="${escapeHTML(p.age || '')}" placeholder="e.g. 34">
          </div>
        </div>

        <!-- Section B: Contact Details -->
        <div id="sectionContact" class="${initialSection === 'contact' ? '' : 'hidden'}">
          <div class="field">
            <label for="fEmailReadonly">Account Email (Read-only)</label>
            <input id="fEmailReadonly" type="email" value="${escapeHTML(p.email || user.email || '')}" readonly style="background: var(--bg-subtle); color: var(--text-secondary); cursor: not-allowed;">
            <small style="color: var(--text-secondary); font-size: 0.74rem;">Account email is verified with secure authentication and cannot be changed here.</small>
          </div>
          <div class="field">
            <label for="fPhoneVal">Mobile Number</label>
            <input id="fPhoneVal" type="tel" value="${escapeHTML(p.phone || '')}" placeholder="e.g. +1 555-0199">
          </div>
        </div>

        <!-- Section C: Medical Parameters -->
        <div id="sectionMedical" class="${initialSection === 'medical' ? '' : 'hidden'}">
          <div class="field">
            <label for="fBloodVal">Blood Group</label>
            <select id="fBloodVal">
              ${['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
                .map(v => `<option value="${v}" ${p.blood_group === v ? 'selected' : ''}>${v}</option>`)
                .join('')}
            </select>
          </div>
          <div class="field">
            <label for="fAllergiesVal">Known Allergies (e.g. Penicillin, Peanuts, Sulfa)</label>
            <input id="fAllergiesVal" value="${escapeHTML(p.allergies || '')}" placeholder="e.g. Penicillin (Severe), Tree nuts">
          </div>
          <div class="field">
            <label for="fMedicinesVal">Active Medications & Dosages</label>
            <input id="fMedicinesVal" value="${escapeHTML(p.current_medications || '')}" placeholder="e.g. Metformin 500mg BID, Lisinopril 10mg QD">
          </div>
          <div class="field">
            <label for="fConditionsVal">Chronic Medical Conditions</label>
            <input id="fConditionsVal" value="${escapeHTML(p.chronic_conditions || '')}" placeholder="e.g. Type 1 Diabetes, Hypertension">
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; border-top: 1px solid var(--border); padding-top: 14px;">
          <button class="btn light" type="button" id="btnCancelEditProf">Cancel</button>
          <button class="btn primary" type="submit" id="btnSaveFullProfile">Save Changes</button>
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
    'Change Password & Security',
    `
    <form id="changePasswordModalForm">
      <p class="muted" style="margin: 0 0 14px; font-size: 0.88rem; line-height: 1.45;">
        Configure a new secure password for your MediKey account. You will use this new password on your next sign in.
      </p>

      <div class="field">
        <label for="cpCurrent">Current Password *</label>
        <div class="pw-wrap">
          <input id="cpCurrent" type="password" required autocomplete="current-password" placeholder="Enter your current password">
          <button class="pw-toggle-btn" type="button" aria-label="Toggle password visibility" data-target="cpCurrent">👁️</button>
        </div>
      </div>

      <div class="field">
        <label for="cpNew">New Password * (At least 6 characters)</label>
        <div class="pw-wrap">
          <input id="cpNew" type="password" minlength="6" required autocomplete="new-password" placeholder="At least 6 characters">
          <button class="pw-toggle-btn" type="button" aria-label="Toggle password visibility" data-target="cpNew">👁️</button>
        </div>
      </div>

      <div class="field">
        <label for="cpConfirm">Confirm New Password *</label>
        <div class="pw-wrap">
          <input id="cpConfirm" type="password" minlength="6" required autocomplete="new-password" placeholder="Re-enter new password">
          <button class="pw-toggle-btn" type="button" aria-label="Toggle password visibility" data-target="cpConfirm">👁️</button>
        </div>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; border-top: 1px solid var(--border); padding-top: 14px;">
        <button class="btn light" type="button" id="btnCancelChangePw">Cancel</button>
        <button class="btn primary" type="submit" id="btnSubmitChangePw">Update Password</button>
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

  openModal(
    'Language & App Preferences',
    `
    <form id="appPreferencesForm">
      <div class="field">
        <label for="prefLanguage">Preferred Language / भाषा निवडा / भाषा चुनें</label>
        <select id="prefLanguage">
          <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
          <option value="hi" ${currentLang === 'hi' ? 'selected' : ''}>हिन्दी (Hindi)</option>
          <option value="mr" ${currentLang === 'mr' ? 'selected' : ''}>मराठी (Marathi)</option>
        </select>
      </div>

      <div class="notice" style="margin: 14px 0; font-size: 0.8rem;">
        <strong>Offline Storage:</strong> Your preferences are stored securely in your patient settings and will synchronize across all your devices.
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
        <button class="btn light" type="button" id="btnCancelPref">Cancel</button>
        <button class="btn primary" type="submit" id="btnSavePref">Save Preferences</button>
      </div>
    </form>
    `
  );

  $('#btnCancelPref').onclick = closeModal;

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
