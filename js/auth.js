/**
 * MediKey | Authentication & Session Management (auth.js)
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        language: language
      }
    }
  });

  if (error) throw error;

  if (data.user && !data.session) {
    openModal(
      'Email Verification Required',
      `
      <div style="text-align: center; padding: 12px 6px;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">✉️</div>
        <h3>Verify Your Email Address</h3>
        <p class="muted">A verification link has been dispatched to <strong>${escapeHTML(email)}</strong>.</p>
        <p>Please click the confirmation link in the email to activate your account and access your MediKey dashboard.</p>
        <button class="btn primary" id="btnGoToLogin" type="button" style="margin-top: 14px;">Go to Login</button>
      </div>
      `
    );
    $('#btnGoToLogin').onclick = () => {
      closeModal();
      showAuthScreen('loginPanel');
      $('#loginEmail').value = email;
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

  if (error) throw error;
  currentUser = data.user;
  return data.user;
}

export async function requestPasswordReset(email) {
  if (!supabase) throw new Error('Supabase client is not available.');

  const redirectUrl = window.location.origin + window.location.pathname;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  });

  if (error) throw error;

  openModal(
    'Recovery Email Dispatched',
    `
    <div style="text-align: center; padding: 12px 6px;">
      <div style="font-size: 2.5rem; margin-bottom: 12px;">📬</div>
      <h3>Check Your Inbox</h3>
      <p class="muted">If an account exists for <strong>${escapeHTML(email)}</strong>, a secure password recovery link has been sent.</p>
      <p>Click the link in the email to return to MediKey and configure your new password.</p>
      <button class="btn primary" id="btnBackToLoginAfterReset" type="button" style="margin-top: 14px;">Return to Login</button>
    </div>
    `
  );
  $('#btnBackToLoginAfterReset').onclick = () => {
    closeModal();
    showAuthScreen('loginPanel');
  };
}

export async function updatePassword(newPassword) {
  if (!supabase) throw new Error('Supabase client is not available.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function logoutUser() {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  currentUser = null;
}
