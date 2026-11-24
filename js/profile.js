/**
 * MediKey | Profile Management (profile.js)
 */

import { supabase } from './supabase-client.js';
import { $, toast, openModal, closeModal, escapeHTML, compressImageToBlob } from './utils.js';
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

export function updateProfileBannerUI(profile, primaryContact) {
  const p = profile || currentProfile;
  if (!p) return;

  $('#displayName').textContent = p.full_name || 'Patient';
  $('#displayId').textContent = `Health ID: ${p.health_id}`;

  const av = $('#avatar');
  if (p.avatar_url) {
    av.innerHTML = `<img src="${escapeHTML(p.avatar_url)}" alt="Avatar">`;
  } else {
    const initials = (p.full_name || 'MK')
      .split(/\s+/)
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    av.textContent = initials;
  }

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
  const contactText = primaryContact ? `${escapeHTML(primaryContact.name)} (${escapeHTML(primaryContact.phone)})` : 'Not entered';
  const allergyText = p.allergies ? escapeHTML(p.allergies) : 'None reported';
  $('#emergencySummary').innerHTML = `<strong>ICE:</strong> ${contactText} &nbsp;|&nbsp; <strong>Allergies:</strong> ${allergyText}`;
}

export function openProfileEditor(onProfileSaved) {
  const p = currentProfile;
  const user = getCurrentUser();
  if (!p || !user) return toast('Please sign in to edit profile.');

  openModal(
    'Edit MediKey Profile',
    `
    <form id="profileForm">
      <div class="field">
        <label for="photoFile">Profile Avatar (Saved to medikey-avatars Storage)</label>
        <input id="photoFile" type="file" accept="image/*">
        <img id="photoPreview" class="photo-preview ${p.avatar_url ? '' : 'hidden'}" src="${escapeHTML(p.avatar_url || '')}" alt="Avatar preview">
      </div>
      <div class="field">
        <label for="fName">Full name *</label>
        <input id="fName" required maxlength="70" value="${escapeHTML(p.full_name || '')}">
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="fAge">Age</label>
          <input id="fAge" type="number" min="0" max="120" value="${escapeHTML(p.age || '')}">
        </div>
        <div class="field">
          <label for="fBlood">Blood group</label>
          <select id="fBlood">
            ${['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
              .map(v => `<option value="${v}" ${p.blood_group === v ? 'selected' : ''}>${v}</option>`)
              .join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="fPhone">Mobile number</label>
        <input id="fPhone" type="tel" value="${escapeHTML(p.phone || '')}">
      </div>
      <div class="field">
        <label for="fAllergies">Known Allergies (e.g. Penicillin, Peanuts)</label>
        <input id="fAllergies" value="${escapeHTML(p.allergies || '')}">
      </div>
      <div class="field">
        <label for="fMedicines">Active Medications</label>
        <input id="fMedicines" value="${escapeHTML(p.current_medications || '')}">
      </div>
      <div class="field">
        <label for="fConditions">Chronic Conditions (e.g. Asthma, Diabetes)</label>
        <input id="fConditions" value="${escapeHTML(p.chronic_conditions || '')}">
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
        <button class="btn light" type="button" id="cancelEdit">Cancel</button>
        <button class="btn primary" type="submit" id="btnSaveProfile">Save Changes</button>
      </div>
    </form>
    `
  );

  let newAvatarFile = null;

  $('#photoFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      newAvatarFile = await compressImageToBlob(file, 240, 0.85);
      const preview = $('#photoPreview');
      preview.src = URL.createObjectURL(newAvatarFile);
      preview.classList.remove('hidden');
    } catch (err) {
      toast('Image error: ' + err.message);
    }
  });

  $('#cancelEdit').onclick = closeModal;

  $('#profileForm').onsubmit = async e => {
    e.preventDefault();
    const saveBtn = $('#btnSaveProfile');
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
        full_name: $('#fName').value.trim(),
        age: parseInt($('#fAge').value, 10) || null,
        blood_group: $('#fBlood').value,
        phone: $('#fPhone').value.trim(),
        allergies: $('#fAllergies').value.trim(),
        current_medications: $('#fMedicines').value.trim(),
        chronic_conditions: $('#fConditions').value.trim(),
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
      toast('Profile updated in Supabase.');
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
