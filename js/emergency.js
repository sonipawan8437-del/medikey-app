/**
 * MediKey | Emergency Contacts, SOS & Nearby Hospitals (emergency.js)
 */

import { supabase } from './supabase-client.js';
import { $, $$, toast, openModal, closeModal, escapeHTML, t } from './utils.js';
import { getCurrentUser } from './auth.js';
import { getCurrentProfile, openProfileEditor } from './profile.js';

let currentContacts = [];

export function getEmergencyContacts() {
  return currentContacts;
}

export function getPrimaryEmergencyContact() {
  return currentContacts.find(c => c.is_primary) || currentContacts[0] || null;
}

export async function loadEmergencyContacts(userId) {
  if (!supabase || !userId) return [];

  const { data: contacts, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false });

  currentContacts = (!error && contacts) ? contacts : [];
  return currentContacts;
}

export function updateEmergencyContactDisplay(contacts) {
  const primary = (contacts && contacts.length) ? (contacts.find(c => c.is_primary) || contacts[0]) : getPrimaryEmergencyContact();
  const contactDisplay = $('#emergencyContactDisplay');
  const callBtn = $('#callEmergencyBtn');

  if (primary && primary.phone) {
    const cleanPhone = primary.phone.replace(/[^+\d]/g, '');
    if (contactDisplay) contactDisplay.textContent = `${primary.name} · ${primary.phone}`;
    if (callBtn) {
      callBtn.href = `tel:${cleanPhone}`;
      callBtn.classList.remove('hidden');
    }
  } else {
    if (contactDisplay) contactDisplay.textContent = t('noEmergencyContactSaved');
    if (callBtn) {
      callBtn.classList.add('hidden');
      callBtn.removeAttribute('href');
    }
  }
}

export function openEmergencyContactsModal(onUpdate) {
  const user = getCurrentUser();
  if (!user) return toast('Please sign in first.');

  function render() {
    const itemsHtml = currentContacts.length
      ? currentContacts.map(c => `
        <div class="crud-card" data-id="${escapeHTML(c.id)}">
          <div class="crud-card-body">
            <strong>👤 ${escapeHTML(c.name)} ${c.is_primary ? '<span class="badge" style="background:#dcfce7; color:#15803d;">Primary ICE</span>' : ''}</strong>
            <p>Phone: <strong>${escapeHTML(c.phone)}</strong> ${c.relationship ? `(${escapeHTML(c.relationship)})` : ''}</p>
          </div>
          <div class="crud-card-actions">
            <button class="btn danger sm btn-delete-contact" data-id="${escapeHTML(c.id)}" title="Delete contact">🗑</button>
          </div>
        </div>
      `).join('')
      : '<p class="muted">No emergency contacts registered yet.</p>';

    openModal(
      'Emergency Contacts (In Case of Emergency - ICE)',
      `
      <form id="contactForm" style="margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--line);">
        <div class="field">
          <label for="ecName">Contact Name *</label>
          <input id="ecName" required placeholder="e.g. Sarah Smith">
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="ecPhone">Mobile Number *</label>
            <input id="ecPhone" type="tel" required placeholder="+91 9876543210">
          </div>
          <div class="field">
            <label for="ecRelation">Relationship</label>
            <input id="ecRelation" placeholder="e.g. Spouse, Parent, Sibling">
          </div>
        </div>
        <label style="display:flex; align-items:center; gap:8px; font-size:0.84rem; margin-top:6px;">
          <input type="checkbox" id="ecIsPrimary" ${currentContacts.length === 0 ? 'checked' : ''}> Set as primary emergency contact
        </label>
        <button class="btn primary" type="submit" style="margin-top: 12px;">＋ Save Emergency Contact</button>
      </form>

      <h4>Registered Contacts (${currentContacts.length})</h4>
      <div class="crud-list">${itemsHtml}</div>
      `
    );

    $('#contactForm').onsubmit = async e => {
      e.preventDefault();
      const payload = {
        name: $('#ecName').value.trim(),
        phone: $('#ecPhone').value.trim(),
        relationship: $('#ecRelation').value.trim(),
        is_primary: $('#ecIsPrimary').checked
      };

      try {
        if (payload.is_primary) {
          await supabase.from('emergency_contacts').update({ is_primary: false }).eq('user_id', user.id);
          currentContacts.forEach(c => c.is_primary = false);
        }

        const { data } = await supabase.from('emergency_contacts').insert({ ...payload, user_id: user.id }).select().single();
        currentContacts.unshift(data);
        updateEmergencyContactDisplay(currentContacts);
        if (typeof onUpdate === 'function') onUpdate(currentContacts);
        render();
        toast('Emergency contact saved.');
      } catch (err) {
        toast('Error saving contact: ' + err.message);
      }
    };

    $$('.btn-delete-contact').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm('Remove this emergency contact?')) return;
        try {
          await supabase.from('emergency_contacts').delete().eq('id', id).eq('user_id', user.id);
          currentContacts = currentContacts.filter(x => x.id !== id);
          updateEmergencyContactDisplay(currentContacts);
          if (typeof onUpdate === 'function') onUpdate(currentContacts);
          render();
          toast('Contact removed.');
        } catch (err) {
          toast('Delete failed: ' + err.message);
        }
      };
    });
  }

  render();
}

export function openEmergencyConfirmationModal() {
  const p = getCurrentProfile();
  const primary = getPrimaryEmergencyContact();

  openModal(
    '🚨 Emergency Assistance & SOS',
    `
    <div style="text-align: center; margin-bottom: 14px;">
      <div style="font-size: 2.2rem; margin-bottom: 6px;">🚑</div>
      <h3 style="margin: 0; color: var(--red-900);">Emergency Call Confirmation</h3>
      <p class="muted" style="margin: 4px 0 0; font-size: 0.82rem;">
        Prevent accidental calls. Select an action below:
      </p>
    </div>

    <div style="display: grid; gap: 10px; margin-bottom: 16px;">
      <a href="tel:112" class="btn full" style="background: var(--emergency); color: #fff; min-height: 48px; font-size: 0.95rem; font-weight: 850; text-decoration: none; border-radius: var(--radius-md);">
        🚨 Call 112 (National Emergency)
      </a>

      ${primary && primary.phone ? `
        <a href="tel:${escapeHTML(primary.phone.replace(/[^+\d]/g, ''))}" class="btn full" style="background: var(--green-700); color: #fff; min-height: 48px; font-size: 0.9rem; font-weight: 800; text-decoration: none; border-radius: var(--radius-md);">
          ☎ Call Primary ICE: ${escapeHTML(primary.name)} (${escapeHTML(primary.phone)})
        </a>
      ` : `
        <button class="btn light full" id="sosAddContactBtn" type="button" style="font-size: 0.84rem;">
          ＋ Add Emergency Contact
        </button>
      `}

      <button class="btn secondary full" id="sosHospitalMapBtn" type="button">
        🏥 Locate Nearby Trauma Centers
      </button>
    </div>

    <!-- Live GPS Coordinates Box for 911 / 112 Dispatchers -->
    <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 12px; font-size: 0.82rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <strong style="color: var(--text-main);">📍 Your Current Location (For First Responders):</strong>
      </div>
      <div id="sosGpsCoordinates" style="font-family: ui-monospace, monospace; color: var(--text-muted); font-size: 0.78rem;">
        Acquiring GPS coordinates...
      </div>
    </div>

    <div class="notice danger" style="margin: 0 0 12px; font-size: 0.78rem;">
      <strong>Note:</strong> MediKey provides personal healthcare records. It does not automatically dispatch first responders. Dialing 112 will connect you to local dispatchers.
    </div>

    <div style="display: flex; justify-content: flex-end;">
      <button class="btn light full" id="sosCancelBtn" type="button">Dismiss</button>
    </div>
    `
  );

  $('#sosCancelBtn').onclick = closeModal;

  const addContactBtn = $('#sosAddContactBtn');
  if (addContactBtn) {
    addContactBtn.onclick = () => {
      closeModal();
      openEmergencyContactsModal(contacts => updateEmergencyContactDisplay(contacts));
    };
  }

  const hospBtn = $('#sosHospitalMapBtn');
  if (hospBtn) {
    hospBtn.onclick = () => {
      closeModal();
      findNearbyHospitals();
    };
  }

  // Request GPS position for reading out to first responders
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coordsEl = $('#sosGpsCoordinates');
        if (coordsEl) {
          coordsEl.innerHTML = `<strong>Lat:</strong> ${pos.coords.latitude.toFixed(5)}, <strong>Lon:</strong> ${pos.coords.longitude.toFixed(5)} <br><span style="color:var(--green-700);">● High accuracy GPS location locked</span>`;
        }
      },
      err => {
        const coordsEl = $('#sosGpsCoordinates');
        if (coordsEl) {
          coordsEl.textContent = 'GPS location unavailable (permission denied or timeout).';
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  } else {
    const coordsEl = $('#sosGpsCoordinates');
    if (coordsEl) coordsEl.textContent = 'Geolocation not supported on this device.';
  }
}

export function openEmergencyCardModal() {
  const p = getCurrentProfile();
  const primary = getPrimaryEmergencyContact();
  if (!p) return;

  openModal(
    'Emergency Medical Card',
    `
    <div style="border-left: 4px solid var(--red); padding-left: 12px; margin-bottom: 14px;">
      <h3 style="margin: 0; color: #991b1b;">Immediate Medical Information</h3>
      <p class="muted" style="margin: 4px 0 0;">First responders can consult this card for urgent interventions.</p>
    </div>

    <div style="display: grid; gap: 8px; font-size: 0.9rem;">
      <p><strong>Patient Name:</strong> ${escapeHTML(p.full_name || 'Not provided')}</p>
      <p><strong>Blood Group:</strong> <span class="badge-tag blood">${escapeHTML(p.blood_group || 'Unknown')}</span></p>
      <p><strong>Age:</strong> ${escapeHTML(p.age || 'Not provided')}</p>
      <p><strong>Critical Allergies:</strong> <span style="color:#b91c1c; font-weight:700;">${escapeHTML(p.allergies || 'Not provided')}</span></p>
      <p><strong>Active Medications:</strong> ${escapeHTML(p.current_medications || 'Not provided')}</p>
      <p><strong>Chronic Conditions:</strong> ${escapeHTML(p.chronic_conditions || 'Not provided')}</p>
      <p><strong>Emergency Contact:</strong> ${escapeHTML(primary?.name || 'Not provided')} 
         ${primary?.phone ? `— <a href="tel:${escapeHTML(primary.phone)}" style="color:var(--green); font-weight:700;">☎ ${escapeHTML(primary.phone)}</a>` : ''}
      </p>
    </div>

    <div class="notice danger" style="margin-top: 16px;">
      <strong>National Emergency Warning:</strong> This is a personal medical pass, not an active dispatch service. If in immediate danger, dial <strong>112</strong>.
    </div>

    <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
      <button class="btn light" id="emClose" type="button">Close</button>
      <button class="btn primary" id="emEdit" type="button">Edit Profile</button>
    </div>
    `
  );

  $('#emClose').onclick = closeModal;
  $('#emEdit').onclick = openProfileEditor;
}

export function findNearbyHospitals() {
  const status = $('#hospitalStatus');
  const mapIframe = $('#hospitalMap');
  const mapBtn = $('#openHospitalMapBtn');

  if (status) status.textContent = 'Acquiring GPS location...';

  if (!navigator.geolocation) {
    if (status) status.textContent = 'Geolocation is not supported by your browser.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const searchUrl = `https://www.google.com/maps/search/hospitals/@${lat},${lon},14z`;

      if (mapBtn) mapBtn.dataset.url = searchUrl;
      if (mapIframe) {
        mapIframe.src = `https://maps.google.com/maps?q=hospitals%20near%20${lat},${lon}&z=14&output=embed`;
        mapIframe.classList.remove('hidden');
      }

      if (status) status.textContent = 'Showing emergency hospitals near your location. Always verify trauma center availability.';
    },
    err => {
      if (status) status.textContent = err.code === 1 ? 'Location permission was denied.' : 'Could not acquire GPS location.';
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}
