/**
 * MediKey | Authentication & Session Management (auth.js)
 * Clean, production-hardened Supabase Auth module with rate-limit defense & user-friendly error translations.
 */

import { supabase } from './supabase-client.js';
import { $, toast, openModal, closeModal, escapeHTML } from './utils.js';

let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUser(user) {
  currentUser = user;
}

export function showAuthScreen(panelId) {
  ['registerPanel', 'loginPanel', 'forgotPanel', 'updatePasswordPanel'].forEach(id => {
    const el = $(`#${id}`);
    if (el) el.classList.toggle('hidden', id !== panelId);
  });
  // Clear any active alert banners when switching panels
  hideAuthAlert();
}

export function showAuthAlert(message, type = 'error', actionHtml = '') {
  const banner = $('#authAlertBanner');
  if (!banner) return;
  banner.className = `auth-alert-banner ${type}`;
  banner.innerHTML = `
    <div class="auth-alert-icon" aria-hidden="true">${type === 'warning' ? '⚠️' : type === 'info' ? 'ℹ️' : '⛔'}</div>
    <div class="auth-alert-body">
      <div class="auth-alert-msg">${escapeHTML(message)}</div>
      ${actionHtml ? `<div class="auth-alert-action">${actionHtml}</div>` : ''}
    </div>
  `;
  banner.classList.remove('hidden');
}

export function hideAuthAlert() {
  const banner = $('#authAlertBanner');
  if (banner) {
    banner.classList.add('hidden');
    banner.innerHTML = '';
  }
}

/**
 * Translates raw Supabase technical errors into patient-friendly, helpful guidance.
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected authentication error occurred. Please try again.';

  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();
  const status = error.status;

  if (status === 429 || code === 'over_email_send_rate_limit' || msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many email requests. Please try again later.';
  }

  if (msg.includes('user already registered') || code === 'user_already_exists') {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  if (msg.includes('invalid login credentials') || code === 'invalid_credentials') {
    return 'Incorrect email address or password. Please verify your details.';
  }

  if (msg.includes('email not confirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox for the verification link.';
  }

  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return 'Password is too weak. Please provide at least 6 characters.';
  }

  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Unable to reach the MediKey cloud service. Please check your internet connection.';
  }

  return error.message || 'Authentication request could not be processed.';
}

export async function getSessionUser() {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      currentUser = session.user;
      return session.user;
    }
  } catch (err) {
    console.warn('Session check error:', err);
  }
  return null;
}

export async function registerUser(name, email, password, language = 'en') {
  if (!supabase) throw new Error('Supabase client is not available.');

  const siteOrigin = window.location.origin;
  const redirectTarget = `${siteOrigin}/`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTarget,
      data: {
        full_name: name,
        language: language
      }
    }
  });

  if (error) {
    const friendlyMsg = formatAuthError(error);
    const err = new Error(friendlyMsg);
    err.originalError = error;
    err.status = error.status;
    err.code = error.code;
    err.isRateLimit = (error.status === 429 || error.code === 'over_email_send_rate_limit' || (error.message || '').toLowerCase().includes('rate limit'));
    err.isExistingUser = (error.message || '').toLowerCase().includes('already registered');
    throw err;
  }

  // Handle case where email verification is required (no active session returned)
  if (data.user && !data.session) {
    openModal(
      'Email Verification Required',
      `
      <div style="text-align: center; padding: 12px 6px;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">✉️</div>
        <h3>Verify Your Email Address</h3>
        <p class="muted">A verification link has been dispatched to <strong>${escapeHTML(email)}</strong>.</p>
        <p>Please click the confirmation link in your email to activate your account and access your MediKey dashboard.</p>
        <div class="notice" style="text-align: left; margin: 14px 0; font-size: 0.85rem;">
          <strong>Tip:</strong> If you don't see the email within 2 minutes, please check your Spam or Junk folder.
        </div>
        <button class="btn primary" id="btnGoToLogin" type="button" style="margin-top: 10px;">Go to Login</button>
      </div>
      `
    );
    $('#btnGoToLogin').onclick = () => {
      closeModal();
      showAuthScreen('loginPanel');
      if ($('#loginEmail')) $('#loginEmail').value = email;
    };
    return { verified: false, user: data.user };
  }

  currentUser = data.user;
  return { verified: true, user: data.user };
}

export async function loginUser(email, password) {
  if (!supabase) throw new Error('Supabase client is not available.');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    const friendlyMsg = formatAuthError(error);
    const err = new Error(friendlyMsg);
    err.originalError = error;
    err.status = error.status;
    err.code = error.code;
    err.isEmailUnconfirmed = (error.message || '').toLowerCase().includes('email not confirmed');
    throw err;
  }

  currentUser = data.user;
  return data.user;
}

export async function requestPasswordReset(email) {
  if (!supabase) throw new Error('Supabase client is not available.');

  const redirectUrl = `${window.location.origin}/#type=recovery`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  });

  if (error) {
    const friendlyMsg = formatAuthError(error);
    const err = new Error(friendlyMsg);
    err.originalError = error;
    err.status = error.status;
    err.code = error.code;
    err.isRateLimit = (error.status === 429 || error.code === 'over_email_send_rate_limit' || (error.message || '').toLowerCase().includes('rate limit'));
    throw err;
  }

  openModal(
    'Recovery Email Dispatched',
    `
    <div style="text-align: center; padding: 12px 6px;">
      <div style="font-size: 2.5rem; margin-bottom: 12px;">📬</div>
      <h3>Check Your Inbox</h3>
      <p class="muted">If an account exists for <strong>${escapeHTML(email)}</strong>, a secure password recovery link has been dispatched.</p>
      <p>Click the link in the email to return to MediKey and configure your new password.</p>
      <button class="btn primary" id="btnBackToLoginAfterReset" type="button" style="margin-top: 14px;">Return to Login</button>
    </div>
    `
  );
  $('#btnBackToLoginAfterReset').onclick = () => {
    closeModal();
    showAuthScreen('loginPanel');
    if ($('#loginEmail')) $('#loginEmail').value = email;
  };
}

export async function updatePassword(newPassword) {
  if (!supabase) throw new Error('Supabase client is not available.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function logoutUser() {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  }
  currentUser = null;
}
