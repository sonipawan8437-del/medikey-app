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
  if (!supabase) throw new Error('Supabase not connected');
  const { data, error } = await supabase.storage
    .from('medikey-documents')
    .createSignedUrl(filePath, validitySeconds);
  if (error || !data) throw (error || new Error('URL generation failed'));
  return data.signedUrl;
}

export async function deleteDocument(docId, filePath, userId) {
  if (!supabase) throw new Error('Supabase not connected');
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
        <div class="crud-card" data-id="${escapeHTML(doc.id)}">
          <div class="crud-card-body">
            <span class="doc-badge ${escapeHTML(doc.category)}">${escapeHTML(doc.category)}</span>
            <strong style="margin-top: 4px;">📄 ${escapeHTML(doc.title)}</strong>
            <p class="muted" style="margin: 2px 0;">${escapeHTML(doc.file_name)} (${formatBytes(doc.file_size)})</p>
            ${doc.notes ? `<p class="muted">${escapeHTML(doc.notes)}</p>` : ''}
            <small class="muted">Date: ${escapeHTML(doc.document_date || new Date().toISOString().slice(0, 10))}</small>
          </div>
          <div class="crud-card-actions">
            <button class="btn light sm btn-download-doc" data-path="${escapeHTML(doc.file_path)}" data-name="${escapeHTML(doc.file_name)}" title="Generate secure signed download URL">📥 View / Download</button>
            <button class="btn danger sm btn-delete-doc" data-id="${escapeHTML(doc.id)}" data-path="${escapeHTML(doc.file_path)}" title="Delete document">🗑</button>
          </div>
        </div>
      `).join('')
      : '<p class="muted">No files uploaded in this category yet.</p>';

    openModal(
      title,
      `
      <p class="muted">${escapeHTML(description)}</p>

      <form id="uploadDocForm" style="margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--line);">
        <div class="field">
          <label for="docFile">Choose Medical File (PDF, PNG, JPG - up to 10 MB) *</label>
          <input id="docFile" type="file" required accept=".pdf,image/png,image/jpeg,image/jpg">
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

        <button class="btn primary" type="submit" id="btnUploadDoc">⬆ Upload to Private Vault</button>
      </form>

      <h4>Saved Documents in Vault (${list.length})</h4>
      <div class="crud-list">${itemsHtml}</div>
      `
    );

    $('#docFile').onchange = e => {
      const file = e.target.files[0];
      if (file && !$('#docTitle').value) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        $('#docTitle').value = cleanName;
      }
    };

    $('#uploadDocForm').onsubmit = async e => {
      e.preventDefault();
      const file = $('#docFile').files[0];
      if (!file) return toast('Please select a file to upload.');

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
          title: $('#docTitle').value.trim(),
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
        if (!confirm('Are you sure you want to permanently delete this medical document from the cloud vault?')) return;

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
