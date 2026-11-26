/**
 * MediKey | Supabase Storage & File Management (storage.js)
 */

import { supabase } from './supabase-client.js';
import { $, $$, toast, openModal, closeModal, escapeHTML, formatBytes } from './utils.js';
import { getCurrentUser } from './auth.js';

let currentDocuments = { medical: [], labs: [], certificates: [] };

export function getDocuments() {
  return currentDocuments;
}

export function getDocumentCounts() {
  return {
    medical: (currentDocuments.medical || []).length,
    labs: (currentDocuments.labs || []).length,
    certificates: (currentDocuments.certificates || []).length
  };
}

export async function loadDocuments(userId) {
  if (!supabase || !userId) return currentDocuments;

  const { data: docs, error } = await supabase
    .from('medical_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  currentDocuments = { medical: [], labs: [], certificates: [] };
  if (!error && docs) {
    docs.forEach(d => {
      if (currentDocuments[d.category]) {
        currentDocuments[d.category].push(d);
      }
    });
  }
  return currentDocuments;
}

export async function getSignedDocumentUrl(filePath, validitySeconds = 300) {
  if (!supabase) throw new Error('Cloud storage not connected');
  const { data, error } = await supabase.storage
    .from('medikey-documents')
    .createSignedUrl(filePath, validitySeconds);
  if (error || !data) throw (error || new Error('URL generation failed'));
  return data.signedUrl;
}

export async function deleteDocument(docId, filePath, userId) {
  if (!supabase) throw new Error('Cloud storage not connected');
  await supabase.storage.from('medikey-documents').remove([filePath]);
  await supabase.from('medical_documents').delete().eq('id', docId).eq('user_id', userId);
}

export function openDocumentSection(title, category, description, onUpdate) {
  const user = getCurrentUser();
  if (!user) return toast('Please sign in first.');
  const list = currentDocuments[category] || [];

  function render() {
    const itemsHtml = list.length
      ? list.map(doc => `
        <div class="record-card" data-id="${escapeHTML(doc.id)}">
          <div class="record-body">
            <span class="record-badge ${escapeHTML(doc.category)}">${escapeHTML(doc.category)}</span>
            <strong>📄 ${escapeHTML(doc.title)}</strong>
            <p>${escapeHTML(doc.file_name)} · <span>${formatBytes(doc.file_size)}</span></p>
            ${doc.notes ? `<p style="color:var(--text-muted); font-size:0.75rem;">${escapeHTML(doc.notes)}</p>` : ''}
            <div class="record-meta">Date: ${escapeHTML(doc.document_date || new Date().toISOString().slice(0, 10))}</div>
          </div>
          <div class="record-actions">
            <button class="btn light sm btn-download-doc" data-path="${escapeHTML(doc.file_path)}" data-name="${escapeHTML(doc.file_name)}" title="Generate secure signed download URL">📥 View</button>
            <button class="btn danger sm btn-delete-doc" data-id="${escapeHTML(doc.id)}" data-path="${escapeHTML(doc.file_path)}" title="Delete document">🗑</button>
          </div>
        </div>
      `).join('')
      : '<p class="clinical-card-empty">No files uploaded in this category yet.</p>';

    openModal(
      title,
      `
      <p class="muted" style="margin-top:0;">${escapeHTML(description)}</p>

      <form id="uploadDocForm" style="margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--border);">
        <div class="field">
          <label>Select Document (PDF, PNG, JPG - up to 10 MB) *</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <label class="btn secondary sm" style="cursor: pointer; flex: 1;">
              📁 Choose File / Photo
              <input id="docFile" type="file" accept=".pdf,image/png,image/jpeg,image/jpg" class="sr-only">
            </label>
            <label class="btn light sm" style="cursor: pointer; flex: 1;">
              📷 Camera Capture
              <input id="docFileCamera" type="file" accept="image/*" capture="environment" class="sr-only">
            </label>
          </div>
          <div id="selectedFilePreview" class="hidden" style="margin-top: 8px; padding: 10px; background: var(--bg-subtle); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
              <span id="previewFileIcon" style="font-size: 1.4rem;">📄</span>
              <div style="min-width: 0;">
                <strong id="previewFileName" style="display: block; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">filename.pdf</strong>
                <small id="previewFileSize" style="color: var(--text-tertiary); font-size: 0.72rem;">0 KB</small>
              </div>
            </div>
            <button type="button" id="btnClearSelectedFile" class="btn light sm" style="min-height: 28px; padding: 2px 8px; font-size: 0.72rem;">✕</button>
          </div>
        </div>

        <div class="field">
          <label for="docTitle">Document Name / Title *</label>
          <input id="docTitle" required placeholder="e.g. Complete Blood Count (CBC) Report">
        </div>
        <div class="field">
          <label for="docDate">Document Date</label>
          <input id="docDate" type="date" value="${new Date().toISOString().slice(0, 10)}">
        </div>
        <div class="field">
          <label for="docNotes">Doctor Observations / Summary</label>
          <input id="docNotes" placeholder="e.g. Hemoglobin 13.5 g/dL, Platelets normal">
        </div>

        <div id="uploadProgressContainer" class="upload-progress hidden">
          <div class="upload-progress-bar" id="uploadProgressBar"></div>
        </div>

        <button class="btn primary full" type="submit" id="btnUploadDoc" style="margin-top: 6px;">⬆ Upload to Private Vault</button>
      </form>

      <div class="section-heading" style="margin-top: 0;">
        <h3 style="font-size: 0.95rem;">Saved Documents in Vault (${list.length})</h3>
      </div>
      <div class="crud-list">${itemsHtml}</div>
      `
    );

    let activeSelectedFile = null;

    const handleFileChosen = file => {
      if (!file) return;
      activeSelectedFile = file;

      const previewBox = $('#selectedFilePreview');
      const nameEl = $('#previewFileName');
      const sizeEl = $('#previewFileSize');
      const iconEl = $('#previewFileIcon');

      if (previewBox) {
        previewBox.classList.remove('hidden');
        if (nameEl) nameEl.textContent = file.name;
        if (sizeEl) sizeEl.textContent = formatBytes(file.size);
        if (iconEl) iconEl.textContent = file.type.startsWith('image/') ? '🖼️' : '📄';
      }

      if ($('#docTitle') && !$('#docTitle').value) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        $('#docTitle').value = cleanName;
      }
    };

    if ($('#docFile')) $('#docFile').onchange = e => handleFileChosen(e.target.files[0]);
    if ($('#docFileCamera')) $('#docFileCamera').onchange = e => handleFileChosen(e.target.files[0]);

    const clearBtn = $('#btnClearSelectedFile');
    if (clearBtn) {
      clearBtn.onclick = () => {
        activeSelectedFile = null;
        if ($('#docFile')) $('#docFile').value = '';
        if ($('#docFileCamera')) $('#docFileCamera').value = '';
        if ($('#selectedFilePreview')) $('#selectedFilePreview').classList.add('hidden');
      };
    }

    $('#uploadDocForm').onsubmit = async e => {
      e.preventDefault();
      const file = activeSelectedFile || ($('#docFile') && $('#docFile').files[0]) || ($('#docFileCamera') && $('#docFileCamera').files[0]);
      if (!file) return toast('Please select or capture a file to upload.');

      if (file.size > 10 * 1024 * 1024) {
        return toast('File is too large. Maximum size is 10 MB.');
      }

      const uploadBtn = $('#btnUploadDoc');
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Uploading file...';
      $('#uploadProgressContainer').classList.remove('hidden');
      $('#uploadProgressBar').style.width = '60%';

      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${user.id}/${category}/${Date.now()}_${safeName}`;

        const { error: storageError } = await supabase.storage
          .from('medikey-documents')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (storageError) throw storageError;

        $('#uploadProgressBar').style.width = '90%';

        const docRow = {
          user_id: user.id,
          title: $('#docTitle').value.trim() || file.name,
          category: category,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          notes: $('#docNotes').value.trim(),
          document_date: $('#docDate').value
        };

        const { data: inserted, error: dbErr } = await supabase
          .from('medical_documents')
          .insert(docRow)
          .select()
          .single();

        if (dbErr) throw dbErr;

        list.unshift(inserted);
        if (typeof onUpdate === 'function') onUpdate();
        render();
        toast('Document uploaded securely to private vault.');
      } catch (err) {
        console.error('Document upload error:', err);
        toast('Upload failed: ' + err.message);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = '⬆ Upload to Private Vault';
        $('#uploadProgressContainer').classList.add('hidden');
      }
    };

    $$('.btn-download-doc').forEach(btn => {
      btn.onclick = async () => {
        const path = btn.dataset.path;
        btn.disabled = true;
        btn.textContent = 'Generating URL...';
        try {
          const url = await getSignedDocumentUrl(path, 300);
          window.open(url, '_blank', 'noopener,noreferrer');
          toast('Opening secure 5-minute preview link.');
        } catch (err) {
          toast('Could not open file: ' + err.message);
        } finally {
          btn.disabled = false;
          btn.textContent = '📥 View / Download';
        }
      };
    });

    $$('.btn-delete-doc').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const path = btn.dataset.path;
        if (!confirm('Are you sure you want to permanently delete this medical document?')) return;

        try {
          await deleteDocument(id, path, user.id);
          const idx = list.findIndex(x => x.id === id);
          if (idx !== -1) list.splice(idx, 1);
          if (typeof onUpdate === 'function') onUpdate();
          render();
          toast('Document deleted.');
        } catch (err) {
          toast('Delete failed: ' + err.message);
        }
      };
    });
  }

  render();
}
