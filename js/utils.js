/**
 * MediKey | Shared Utilities & UI Helpers (utils.js)
 */

export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

let toastTimer = null;
export function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

let lastActiveElement = null;
let currentCloseCallback = null;
let modalKeydownHandler = null;

export function openModal(title, htmlContent, onClose) {
  // 1. Store triggering element if outside modal
  const active = document.activeElement;
  const backdrop = $('#modalBackdrop');
  if (active && (!backdrop || !backdrop.contains(active))) {
    lastActiveElement = active;
  }
  currentCloseCallback = onClose || null;

  $('#modalTitle').textContent = title;
  $('#modalContent').innerHTML = htmlContent;

  if (backdrop) {
    // 2. Remove hidden/inert and set accessible attributes
    backdrop.classList.add('open');
    backdrop.removeAttribute('inert');
    backdrop.setAttribute('aria-hidden', 'false');

    // Android back navigation support: push modal state if not already open
    try {
      if (!window.history.state || !window.history.state.medikeyModal) {
        window.history.pushState({ medikeyModal: true }, '');
      }
    } catch (e) {}

    // 3. Prevent background scrolling
    document.body.style.overflow = 'hidden';

    // 4. Focus appropriate element inside modal
    const focusableSelectors = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = backdrop.querySelectorAll(focusableSelectors);
    const firstInteractive = $('#modalContent input, #modalContent select, #modalContent textarea, #modalContent button');

    requestAnimationFrame(() => {
      if (firstInteractive) {
        firstInteractive.focus();
      } else if (focusableElements.length > 0) {
        const closeBtn = $('#closeModal');
        if (closeBtn) closeBtn.focus();
        else focusableElements[0].focus();
      }
    });

    // 5. Attach accessible focus trap & keyboard handler
    if (modalKeydownHandler) {
      backdrop.removeEventListener('keydown', modalKeydownHandler);
    }

    modalKeydownHandler = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        const freshFocusables = Array.from(backdrop.querySelectorAll(focusableSelectors)).filter(
          el => el.offsetParent !== null && !el.hasAttribute('disabled')
        );
        if (freshFocusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = freshFocusables[0];
        const last = freshFocusables[freshFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !backdrop.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !backdrop.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    backdrop.addEventListener('keydown', modalKeydownHandler);
  }
}

export function closeModal(triggerHistoryBack = true) {
  const backdrop = $('#modalBackdrop');

  // Pop modal history state if closing via UI button and not via popstate
  if (triggerHistoryBack) {
    try {
      if (window.history.state && window.history.state.medikeyModal) {
        window.history.back();
      }
    } catch (e) {}
  }

  // 1. Remove keyboard trap listener
  if (backdrop && modalKeydownHandler) {
    backdrop.removeEventListener('keydown', modalKeydownHandler);
    modalKeydownHandler = null;
  }

  // 2. Move focus safely OUTSIDE the modal BEFORE setting aria-hidden
  if (backdrop && backdrop.contains(document.activeElement)) {
    // Attempt to return focus to triggering element
    if (lastActiveElement && document.body.contains(lastActiveElement) && !backdrop.contains(lastActiveElement) && typeof lastActiveElement.focus === 'function') {
      try { lastActiveElement.focus(); } catch (e) {}
    } else {
      // Fallback target outside modal
      const fallback = document.querySelector('#topBrand') || document.querySelector('[data-nav="Home"]') || document.body;
      if (fallback) {
        try {
          if (!fallback.hasAttribute('tabindex')) fallback.setAttribute('tabindex', '-1');
          fallback.focus();
        } catch (e) {}
      }
    }

    // Ensure no descendant retains focus
    if (backdrop.contains(document.activeElement) && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }

  // 3. ONLY THEN apply aria-hidden="true" and remove open state
  if (backdrop) {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }

  // 4. Restore background scrolling
  document.body.style.overflow = '';

  // 5. Clear modal content
  const content = $('#modalContent');
  if (content) content.innerHTML = '';

  // 6. Execute callback if registered
  if (typeof currentCloseCallback === 'function') {
    try { currentCloseCallback(); } catch (e) {}
    currentCloseCallback = null;
  }
}

export function compressImageToBlob(file, maxDimension = 240, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('File is not an image.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.onload = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h) {
          if (w > maxDimension) { h = Math.round((h * maxDimension) / w); w = maxDimension; }
        } else {
          if (h > maxDimension) { w = Math.round((w * maxDimension) / h); h = maxDimension; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Centralized Internationalization System
export { i18n, t, getLanguage, applyLanguage } from './i18n.js';

// Android physical / swipe back button support: dismiss open modal without page unload
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const backdrop = $('#modalBackdrop');
    if (backdrop && backdrop.classList.contains('open')) {
      closeModal(false);
    }
  });
}
