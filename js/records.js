/**
 * MediKey | Medical Records & CRUD Operations (records.js)
 */

import { supabase } from './supabase-client.js';
import { $, $$, toast, openModal, closeModal, escapeHTML } from './utils.js';
import { getCurrentUser } from './auth.js';

let currentPrescriptions = [];
let currentAppointments = [];
let currentKit = [];
let currentNotes = [];
let currentHistory = { surgeries: '', family_history: '', primary_doctor: '', doctor_phone: '', preferred_hospital: '' };

export function getPrescriptions() { return currentPrescriptions; }
export function getAppointments() { return currentAppointments; }
export function getKit() { return currentKit; }
export function getNotes() { return currentNotes; }
export function getHistory() { return currentHistory; }

export async function loadAllRecords(user) {
  if (!supabase || !user) return;

  const [rxRes, aptRes, kitRes, notesRes, histRes] = await Promise.all([
    supabase.from('prescriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('appointments').select('*').eq('user_id', user.id).order('appointment_date', { ascending: true }),
    supabase.from('medical_kit').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('health_notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('medical_history').select('*').eq('user_id', user.id).maybeSingle()
  ]);

  currentPrescriptions = rxRes.data || [];
  currentAppointments = aptRes.data || [];
  currentKit = kitRes.data || [];
  currentNotes = notesRes.data || [];
  currentHistory = histRes.data || { surgeries: '', family_history: '', primary_doctor: '', doctor_phone: '', preferred_hospital: '' };

  return {
    prescriptions: currentPrescriptions,
    appointments: currentAppointments,
    kit: currentKit,
    notes: currentNotes,
    history: currentHistory
  };
}

export function updateRecordTileCounts(docCounts = { medical: 0, labs: 0, certificates: 0 }) {
  const countMap = {
    'Personal Information': null,
    'Medical Records': docCounts.medical || 0,
    'Medical History': (currentHistory && (currentHistory.surgeries || currentHistory.primary_doctor)) ? 'Documented' : '0',
    'Prescriptions': (currentPrescriptions || []).length,
    'Lab Reports': docCounts.labs || 0,
    'Medical Certificates': docCounts.certificates || 0
  };

  $$('.tile[data-section]').forEach(tile => {
    const sec = tile.dataset.section;
    let countEl = tile.querySelector('.tile-count');
    if (countMap[sec] !== null && countMap[sec] !== undefined) {
      if (!countEl) {
        countEl = document.createElement('div');
        countEl.className = 'tile-count';
        tile.appendChild(countEl);
      }
      const val = countMap[sec];
      countEl.textContent = val === 'Documented' ? 'Documented' : val === 0 ? 'No entries' : `${val} items`;
    }
  });
}

// --------------------------------------------------------------------------
// Prescriptions CRUD
// --------------------------------------------------------------------------
export function openPrescriptionsModal(onUpdate) {
  const user = getCurrentUser();
  if (!user) return toast('Please sign in first.');

  function render() {
    const itemsHtml = currentPrescriptions.length
      ? currentPrescriptions.map(item => `
        <div class="crud-card" data-id="${escapeHTML(item.id)}">
          <div class="crud-card-body">
            <strong>💊 ${escapeHTML(item.medication_name)}</strong>
            <p>Dosage: <strong>${escapeHTML(item.dosage || 'Standard')}</strong> &nbsp;|&nbsp; Frequency: <strong>${escapeHTML(item.frequency || 'As needed')}</strong></p>
            ${item.instructions ? `<p class="muted">${escapeHTML(item.instructions)}</p>` : ''}
            ${item.prescribing_doctor ? `<small class="muted">Prescribed by: ${escapeHTML(item.prescribing_doctor)}</small>` : ''}
          </div>
          <div class="crud-card-actions">
            <button class="btn light sm btn-edit-rx" data-id="${escapeHTML(item.id)}" title="Edit prescription">✎ Edit</button>
            <button class="btn danger sm btn-delete-rx" data-id="${escapeHTML(item.id)}" title="Delete medication">🗑</button>
          </div>
        </div>
      `).join('')
      : '<p class="muted">No active prescriptions entered yet.</p>';

    openModal(
      'Prescriptions & Medications',
      `
      <form id="rxForm" style="margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--line);">
        <input type="hidden" id="editRxId" value="">
        <div class="field">
          <label for="rxName">Medication Name *</label>
          <input id="rxName" required placeholder="e.g. Metformin, Amoxicillin">
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="rxDose">Dosage</label>
            <input id="rxDose" placeholder="e.g. 500 mg">
          </div>
          <div class="field">
            <label for="rxFreq">Frequency</label>
            <input id="rxFreq" placeholder="e.g. Twice daily after meals">
          </div>
        </div>
        <div class="field">
          <label for="rxDoctor">Prescribing Doctor</label>
          <input id="rxDoctor" placeholder="e.g. Dr. A. Sharma">
        </div>
        <div class="field">
          <label for="rxNotes">Instructions / Notes</label>
          <input id="rxNotes" placeholder="e.g. Take with water">
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn primary" type="submit" id="btnSubmitRx">＋ Save Prescription</button>
          <button class="btn light hidden" type="button" id="btnCancelEditRx">Cancel Edit</button>
        </div>
      </form>

      <h4>Prescription List (${currentPrescriptions.length})</h4>
      <div class="crud-list">${itemsHtml}</div>
      `
    );

    $('#rxForm').onsubmit = async e => {
      e.preventDefault();
      const editId = $('#editRxId').value;
      const payload = {
        medication_name: $('#rxName').value.trim(),
        dosage: $('#rxDose').value.trim(),
        frequency: $('#rxFreq').value.trim(),
        prescribing_doctor: $('#rxDoctor').value.trim(),
        instructions: $('#rxNotes').value.trim()
      };

      try {
        if (editId) {
          const { error } = await supabase.from('prescriptions').update(payload).eq('id', editId).eq('user_id', user.id);
          if (error) throw error;
          const idx = currentPrescriptions.findIndex(x => x.id === editId);
          if (idx !== -1) Object.assign(currentPrescriptions[idx], payload);
          toast('Prescription updated.');
        } else {
          const { data, error } = await supabase.from('prescriptions').insert({ ...payload, user_id: user.id }).select().single();
          if (error) throw error;
          currentPrescriptions.unshift(data);
          toast('Prescription added.');
        }
        if (typeof onUpdate === 'function') onUpdate();
        render();
      } catch (err) {
        toast('Error saving prescription: ' + err.message);
      }
    };

    $$('.btn-edit-rx').forEach(btn => {
      btn.onclick = () => {
        const item = currentPrescriptions.find(x => x.id === btn.dataset.id);
        if (!item) return;
        $('#editRxId').value = item.id;
        $('#rxName').value = item.medication_name;
        $('#rxDose').value = item.dosage || '';
        $('#rxFreq').value = item.frequency || '';
        $('#rxDoctor').value = item.prescribing_doctor || '';
        $('#rxNotes').value = item.instructions || '';
        $('#btnSubmitRx').textContent = '💾 Update Prescription';
        $('#btnCancelEditRx').classList.remove('hidden');
        $('#rxName').focus();
      };
    });

    $('#btnCancelEditRx').onclick = () => {
      $('#rxForm').reset();
      $('#editRxId').value = '';
      $('#btnSubmitRx').textContent = '＋ Save Prescription';
      $('#btnCancelEditRx').classList.add('hidden');
    };

    $$('.btn-delete-rx').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm('Delete this prescription?')) return;
        try {
          await supabase.from('prescriptions').delete().eq('id', id).eq('user_id', user.id);
          currentPrescriptions = currentPrescriptions.filter(x => x.id !== id);
          if (typeof onUpdate === 'function') onUpdate();
          render();
          toast('Prescription removed.');
        } catch (err) {
          toast('Delete failed: ' + err.message);
        }
      };
    });
  }

  render();
}

// --------------------------------------------------------------------------
// Appointments CRUD
// --------------------------------------------------------------------------
export function openAppointmentsModal(onUpdate) {
  const user = getCurrentUser();
  if (!user) return toast('Please sign in first.');

  function render() {
    const itemsHtml = currentAppointments.length
      ? currentAppointments.map(item => `
        <div class="crud-card" data-id="${escapeHTML(item.id)}">
          <div class="crud-card-body">
            <strong>📅 ${escapeHTML(item.clinic_name)}</strong>
            <p>Schedule: <strong>${escapeHTML(item.appointment_date)} ${escapeHTML(item.appointment_time || '')}</strong></p>
            ${item.reason ? `<p class="muted">${escapeHTML(item.reason)}</p>` : ''}
            <small class="badge">${escapeHTML(item.status || 'scheduled')}</small>
          </div>
          <div class="crud-card-actions">
            <button class="btn light sm btn-edit-apt" data-id="${escapeHTML(item.id)}" title="Edit appointment">✎ Edit</button>
            <button class="btn danger sm btn-delete-apt" data-id="${escapeHTML(item.id)}" title="Delete appointment">🗑</button>
          </div>
        </div>
      `).join('')
      : '<p class="muted">No upcoming appointments recorded.</p>';

    openModal(
      'Medical Appointments',
      `
      <form id="aptForm" style="margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--line);">
        <input type="hidden" id="editAptId" value="">
        <div class="field">
          <label for="aptClinic">Doctor / Clinic / Hospital Name *</label>
          <input id="aptClinic" required placeholder="e.g. Apollo Clinic">
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="aptDate">Date *</label>
            <input id="aptDate" type="date" required>
          </div>
          <div class="field">
            <label for="aptTime">Time</label>
            <input id="aptTime" type="time">
          </div>
        </div>
        <div class="field">
          <label for="aptReason">Purpose of Visit</label>
          <input id="aptReason" placeholder="e.g. Blood pressure review, Follow-up">
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn primary" type="submit" id="btnSubmitApt">＋ Save Appointment</button>
          <button class="btn light hidden" type="button" id="btnCancelEditApt">Cancel</button>
        </div>
      </form>

      <h4>Scheduled Visits (${currentAppointments.length})</h4>
      <div class="crud-list">${itemsHtml}</div>
      `
    );

    $('#aptForm').onsubmit = async e => {
      e.preventDefault();
      const editId = $('#editAptId').value;
      const payload = {
        clinic_name: $('#aptClinic').value.trim(),
        appointment_date: $('#aptDate').value,
        appointment_time: $('#aptTime').value || '',
        reason: $('#aptReason').value.trim()
      };

      try {
        if (editId) {
          await supabase.from('appointments').update(payload).eq('id', editId).eq('user_id', user.id);
          const idx = currentAppointments.findIndex(x => x.id === editId);
          if (idx !== -1) Object.assign(currentAppointments[idx], payload);
          toast('Appointment updated.');
        } else {
          const { data } = await supabase.from('appointments').insert({ ...payload, user_id: user.id }).select().single();
          currentAppointments.unshift(data);
          toast('Appointment scheduled.');
        }
        if (typeof onUpdate === 'function') onUpdate();
        render();
      } catch (err) {
        toast('Error saving appointment: ' + err.message);
      }
    };

    $$('.btn-edit-apt').forEach(btn => {
      btn.onclick = () => {
        const item = currentAppointments.find(x => x.id === btn.dataset.id);
        if (!item) return;
        $('#editAptId').value = item.id;
        $('#aptClinic').value = item.clinic_name;
        $('#aptDate').value = item.appointment_date;
        $('#aptTime').value = item.appointment_time || '';
        $('#aptReason').value = item.reason || '';
        $('#btnSubmitApt').textContent = '💾 Update Appointment';
        $('#btnCancelEditApt').classList.remove('hidden');
        $('#aptClinic').focus();
      };
    });

    $('#btnCancelEditApt').onclick = () => {
      $('#aptForm').reset();
      $('#editAptId').value = '';
      $('#btnSubmitApt').textContent = '＋ Save Appointment';
      $('#btnCancelEditApt').classList.add('hidden');
    };

    $$('.btn-delete-apt').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm('Delete this appointment?')) return;
        try {
          await supabase.from('appointments').delete().eq('id', id).eq('user_id', user.id);
          currentAppointments = currentAppointments.filter(x => x.id !== id);
          if (typeof onUpdate === 'function') onUpdate();
          render();
          toast('Appointment deleted.');
        } catch (err) {
          toast('Delete failed: ' + err.message);
        }
      };
    });
  }

  render();
}

// --------------------------------------------------------------------------
// Medical Kit CRUD
// --------------------------------------------------------------------------
export function openMedicalKitModal(onUpdate) {
  const user = getCurrentUser();
  if (!user) return toast('Please sign in first.');

  function render() {
    const itemsHtml = currentKit.length
      ? currentKit.map(item => `
        <div class="crud-card" data-id="${escapeHTML(item.id)}">
          <div class="crud-card-body">
            <strong>🩹 ${escapeHTML(item.item_name)}</strong>
            <p>Quantity / Details: <strong>${escapeHTML(item.quantity || '1')}</strong></p>
          </div>
          <div class="crud-card-actions">
            <button class="btn light sm btn-edit-kit" data-id="${escapeHTML(item.id)}" title="Edit kit item">✎ Edit</button>
            <button class="btn danger sm btn-delete-kit" data-id="${escapeHTML(item.id)}" title="Delete item">🗑</button>
          </div>
        </div>
      `).join('')
      : '<p class="muted">No items in your personal medical kit yet.</p>';

    openModal(
      'Personal Medical Kit Inventory',
      `
      <form id="kitForm" style="margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--line);">
        <input type="hidden" id="editKitId" value="">
        <div class="field">
          <label for="kitItem">Item Name *</label>
          <input id="kitItem" required placeholder="e.g. Inhaler, Glucose Meter, Paracetamol">
        </div>
        <div class="field">
          <label for="kitQty">Quantity & Dosage Notes</label>
          <input id="kitQty" placeholder="e.g. 2 boxes, 10 strips, Exp: 2027">
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn primary" type="submit" id="btnSubmitKit">＋ Save Kit Item</button>
          <button class="btn light hidden" type="button" id="btnCancelEditKit">Cancel</button>
        </div>
      </form>

      <h4>Kit Items (${currentKit.length})</h4>
      <div class="crud-list">${itemsHtml}</div>
      `
    );

    $('#kitForm').onsubmit = async e => {
      e.preventDefault();
      const editId = $('#editKitId').value;
      const payload = {
        item_name: $('#kitItem').value.trim(),
        quantity: $('#kitQty').value.trim() || '1'
      };

      try {
        if (editId) {
          await supabase.from('medical_kit').update(payload).eq('id', editId).eq('user_id', user.id);
          const idx = currentKit.findIndex(x => x.id === editId);
          if (idx !== -1) Object.assign(currentKit[idx], payload);
          toast('Kit item updated.');
        } else {
          const { data } = await supabase.from('medical_kit').insert({ ...payload, user_id: user.id }).select().single();
          currentKit.unshift(data);
          toast('Item added to kit.');
        }
        if (typeof onUpdate === 'function') onUpdate();
        render();
      } catch (err) {
        toast('Error saving kit item: ' + err.message);
      }
    };

    $$('.btn-edit-kit').forEach(btn => {
      btn.onclick = () => {
        const item = currentKit.find(x => x.id === btn.dataset.id);
        if (!item) return;
        $('#editKitId').value = item.id;
        $('#kitItem').value = item.item_name;
        $('#kitQty').value = item.quantity || '';
        $('#btnSubmitKit').textContent = '💾 Update Item';
        $('#btnCancelEditKit').classList.remove('hidden');
        $('#kitItem').focus();
      };
    });

    $('#btnCancelEditKit').onclick = () => {
      $('#kitForm').reset();
      $('#editKitId').value = '';
      $('#btnSubmitKit').textContent = '＋ Save Kit Item';
      $('#btnCancelEditKit').classList.add('hidden');
    };

    $$('.btn-delete-kit').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm('Remove this item from your kit?')) return;
        try {
          await supabase.from('medical_kit').delete().eq('id', id).eq('user_id', user.id);
          currentKit = currentKit.filter(x => x.id !== id);
          if (typeof onUpdate === 'function') onUpdate();
          render();
          toast('Kit item removed.');
        } catch (err) {
          toast('Delete failed: ' + err.message);
        }
      };
    });
  }

  render();
}

// --------------------------------------------------------------------------
// Health Notes CRUD
// --------------------------------------------------------------------------
export function openNotesModal(onUpdate) {
  const user = getCurrentUser();
  if (!user) return toast('Please sign in first.');

  function render() {
    const itemsHtml = currentNotes.length
      ? currentNotes.map(item => `
        <div class="crud-card" data-id="${escapeHTML(item.id)}">
          <div class="crud-card-body">
            <strong>📝 ${escapeHTML(item.title)}</strong>
            <p style="white-space: pre-wrap;">${escapeHTML(item.note)}</p>
            <small class="muted">${new Date(item.created_at).toLocaleDateString()}</small>
          </div>
          <div class="crud-card-actions">
            <button class="btn light sm btn-edit-note" data-id="${escapeHTML(item.id)}" title="Edit note">✎ Edit</button>
            <button class="btn danger sm btn-delete-note" data-id="${escapeHTML(item.id)}" title="Delete note">🗑</button>
          </div>
        </div>
      `).join('')
      : '<p class="muted">No health notes recorded yet.</p>';

    openModal(
      'Health & Daily Symptom Notes',
      `
      <form id="noteForm" style="margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--line);">
        <input type="hidden" id="editNoteId" value="">
        <div class="field">
          <label for="noteTitle">Note Title *</label>
          <input id="noteTitle" required placeholder="e.g. Fasting Sugar 110 mg/dL, Headache after work">
        </div>
        <div class="field">
          <label for="noteText">Note Details *</label>
          <textarea id="noteText" required placeholder="Write your health observations..."></textarea>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn primary" type="submit" id="btnSubmitNote">＋ Save Note</button>
          <button class="btn light hidden" type="button" id="btnCancelEditNote">Cancel</button>
        </div>
      </form>

      <h4>Notes History (${currentNotes.length})</h4>
      <div class="crud-list">${itemsHtml}</div>
      `
    );

    $('#noteForm').onsubmit = async e => {
      e.preventDefault();
      const editId = $('#editNoteId').value;
      const payload = {
        title: $('#noteTitle').value.trim(),
        note: $('#noteText').value.trim()
      };

      try {
        if (editId) {
          await supabase.from('health_notes').update(payload).eq('id', editId).eq('user_id', user.id);
          const idx = currentNotes.findIndex(x => x.id === editId);
          if (idx !== -1) Object.assign(currentNotes[idx], payload);
          toast('Note updated.');
        } else {
          const { data } = await supabase.from('health_notes').insert({ ...payload, user_id: user.id }).select().single();
          currentNotes.unshift(data);
          toast('Health note saved.');
        }
        if (typeof onUpdate === 'function') onUpdate();
        render();
      } catch (err) {
        toast('Error saving note: ' + err.message);
      }
    };

    $$('.btn-edit-note').forEach(btn => {
      btn.onclick = () => {
        const item = currentNotes.find(x => x.id === btn.dataset.id);
        if (!item) return;
        $('#editNoteId').value = item.id;
        $('#noteTitle').value = item.title;
        $('#noteText').value = item.note;
        $('#btnSubmitNote').textContent = '💾 Update Note';
        $('#btnCancelEditNote').classList.remove('hidden');
        $('#noteTitle').focus();
      };
    });

    $('#btnCancelEditNote').onclick = () => {
      $('#noteForm').reset();
      $('#editNoteId').value = '';
      $('#btnSubmitNote').textContent = '＋ Save Note';
      $('#btnCancelEditNote').classList.add('hidden');
    };

    $$('.btn-delete-note').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm('Delete this health note?')) return;
        try {
          await supabase.from('health_notes').delete().eq('id', id).eq('user_id', user.id);
          currentNotes = currentNotes.filter(x => x.id !== id);
          if (typeof onUpdate === 'function') onUpdate();
          render();
          toast('Note deleted.');
        } catch (err) {
          toast('Delete failed: ' + err.message);
        }
      };
    });
  }

  render();
}

// --------------------------------------------------------------------------
// Medical History
// --------------------------------------------------------------------------
export function openMedicalHistoryModal(onUpdate) {
  const user = getCurrentUser();
  if (!user) return toast('Please sign in first.');
  const h = currentHistory || {};

  openModal(
    'Medical History & Preferred Hospital',
    `
    <form id="historyForm">
      <div class="field">
        <label for="hSurgeries">Past Surgeries & Major Medical Events</label>
        <textarea id="hSurgeries" placeholder="e.g. Appendectomy (2020), Knee Arthroscopy (2023)">${escapeHTML(h.surgeries || '')}</textarea>
      </div>
      <div class="field">
        <label for="hFamily">Family Medical History</label>
        <textarea id="hFamily" placeholder="e.g. Family history of coronary artery disease">${escapeHTML(h.family_history || '')}</textarea>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="hDoctor">Primary Treating Physician</label>
          <input id="hDoctor" value="${escapeHTML(h.primary_doctor || '')}" placeholder="Dr. Name">
        </div>
        <div class="field">
          <label for="hDoctorPhone">Doctor Contact Number</label>
          <input id="hDoctorPhone" type="tel" value="${escapeHTML(h.doctor_phone || '')}" placeholder="+91 ...">
        </div>
      </div>
      <div class="field">
        <label for="hHospital">Preferred Emergency Hospital</label>
        <input id="hHospital" value="${escapeHTML(h.preferred_hospital || '')}" placeholder="e.g. Fortis Hospital">
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
        <button class="btn light" type="button" id="cancelHistory">Cancel</button>
        <button class="btn primary" type="submit" id="btnSaveHistory">Save Medical History</button>
      </div>
    </form>
    `
  );

  $('#cancelHistory').onclick = closeModal;

  $('#historyForm').onsubmit = async e => {
    e.preventDefault();
    const saveBtn = $('#btnSaveHistory');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const payload = {
      user_id: user.id,
      surgeries: $('#hSurgeries').value.trim(),
      family_history: $('#hFamily').value.trim(),
      primary_doctor: $('#hDoctor').value.trim(),
      doctor_phone: $('#hDoctorPhone').value.trim(),
      preferred_hospital: $('#hHospital').value.trim(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('medical_history').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      currentHistory = payload;
      if (typeof onUpdate === 'function') onUpdate();
      closeModal();
      toast('Medical history saved to cloud.');
    } catch (err) {
      toast('Failed to save history: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Medical History';
    }
  };
}
