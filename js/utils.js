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

export function openModal(title, htmlContent, onClose) {
  lastActiveElement = document.activeElement;
  currentCloseCallback = onClose || null;
  $('#modalTitle').textContent = title;
  $('#modalContent').innerHTML = htmlContent;
  $('#modalBackdrop').classList.add('open');
  $('#modalBackdrop').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling on mobile

  const firstInteractive = $('#modalContent input, #modalContent button, #modalContent select, #modalContent textarea');
  if (firstInteractive) {
    setTimeout(() => firstInteractive.focus(), 60);
  } else {
    $('#closeModal').focus();
  }
}

export function closeModal() {
  if (typeof currentCloseCallback === 'function') {
    try { currentCloseCallback(); } catch (e) {}
    currentCloseCallback = null;
  }
  const backdrop = $('#modalBackdrop');
  if (backdrop) {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = ''; // Restore background scrolling
  const content = $('#modalContent');
  if (content) content.innerHTML = '';
  if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
    lastActiveElement.focus();
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

export const i18n = {
  en: {
    create: 'Create your account',
    registerText: 'Register with email to create your personal MediKey Digital Health ID.',
    fullName: 'Full name',
    email: 'Email address',
    password: 'Create password',
    confirm: 'Confirm password',
    register: 'Register Account',
    already: 'Already registered?',
    loginHere: 'Login here',
    welcome: 'Welcome back',
    loginText: 'Sign in to access your MediKey healthcare dashboard.',
    login: 'Sign In',
    privacy: 'Privacy & Architecture',
    edit: '✎ Edit Profile',
    logout: 'Logout',
    eyebrow: 'Your digital healthcare pass',
    headline: 'Your health, in one place.',
    subtitle: 'Organise essential health details and make emergency information easier to access.',
    logged: '● Secure Synced',
    healthId: '✚ MediKey Health ID',
    settings: '⚙ Settings',
    emergency: 'Emergency Health Summary',
    view: 'View Details →',
    records: 'Your Health Records',
    quick: 'Quick Actions',
    home: 'Home',
    appointments: 'Appointments',
    profile: 'Profile',
    health: 'Health ID',
    kit: 'Medical Kit'
  },
  hi: {
    create: 'अपना खाता बनाएँ',
    registerText: 'अपना MediKey Digital Health ID बनाने के लिए ईमेल से पंजीकरण करें।',
    fullName: 'पूरा नाम',
    email: 'ईमेल पता',
    password: 'पासवर्ड बनाएँ',
    confirm: 'पासवर्ड की पुष्टि करें',
    register: 'खाता पंजीकृत करें',
    already: 'पहले से पंजीकृत हैं?',
    loginHere: 'यहाँ लॉगिन करें',
    welcome: 'वापस स्वागत है',
    loginText: 'MediKey डैशबोर्ड खोलने के लिए लॉगिन करें।',
    login: 'साइन इन करें',
    privacy: 'गोपनीयता और वास्तुकला',
    edit: '✎ प्रोफ़ाइल संपादित करें',
    logout: 'लॉगआउट',
    eyebrow: 'आपका डिजिटल हेल्थकेयर पास',
    headline: 'आपका स्वास्थ्य, एक जगह।',
    subtitle: 'ज़रूरी स्वास्थ्य जानकारी व्यवस्थित रखें और आपातकालीन जानकारी आसानी से उपलब्ध करें।',
    logged: '● क्लाउड सिंक सक्रिय',
    healthId: '✚ MediKey हेल्थ ID',
    settings: '⚙ सेटिंग्स',
    emergency: 'आपातकालीन जानकारी',
    view: 'जानकारी देखें →',
    records: 'आपके स्वास्थ्य रिकॉर्ड',
    quick: 'त्वरित विकल्प',
    home: 'होम',
    appointments: 'अपॉइंटमेंट',
    profile: 'प्रोफ़ाइल',
    health: 'हेल्थ ID',
    kit: 'मेडिकल किट'
  },
  mr: {
    create: 'तुमचे खाते तयार करा',
    registerText: 'तुमचा MediKey Digital Health ID तयार करण्यासाठी ईमेलने नोंदणी करा.',
    fullName: 'पूर्ण नाव',
    email: 'ईमेल पत्ता',
    password: 'पासवर्ड तयार करा',
    confirm: 'पासवर्डची पुष्टी करा',
    register: 'खाते नोंदणी करा',
    already: 'आधीच नोंदणी केली आहे?',
    loginHere: 'येथे लॉगिन करा',
    welcome: 'पुन्हा स्वागत आहे',
    loginText: 'MediKey डॅशबोर्ड उघडण्यासाठी लॉगिन करा.',
    login: 'लॉगिन करा',
    privacy: 'गोपनीयता आणि सुरक्षा',
    edit: '✎ प्रोफाइल संपादित करा',
    logout: 'लॉगआउट',
    eyebrow: 'तुमचा डिजिटल हेल्थकेअर पास',
    headline: 'तुमचे आरोग्य, एकाच ठिकाणी.',
    subtitle: 'महत्त्वाची आरोग्य माहिती व्यवस्थित ठेवा आणि आपत्कालीन माहिती सहज उपलब्ध करा.',
    logged: '● क्लाउड सिंक सुरू आहे',
    healthId: '✚ MediKey हेल्थ ID',
    settings: '⚙ सेटिंग्ज',
    emergency: 'आपत्कालीन माहिती',
    view: 'तपशील पहा →',
    records: 'तुमचे आरोग्य रेकॉर्ड',
    quick: 'जलद पर्याय',
    home: 'होम',
    appointments: 'अपॉइंटमेंट्स',
    profile: 'प्रोफाइल',
    health: 'हेल्थ ID',
    kit: 'मेडिकल किट'
  }
};

export function applyLanguage(lang) {
  const t = i18n[lang] || i18n.en;
  const set = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };

  set('#registerPanel h1', t.create);
  set('#registerPanel .muted', t.registerText);
  set('label[for="regName"]', t.fullName);
  set('label[for="regEmail"]', t.email);
  set('label[for="regPassword"]', t.password);
  set('label[for="regConfirm"]', t.confirm);
  set('#registerForm button[type="submit"]', t.register);
  set('#registerPanel .auth-links span', t.already);
  set('#showLogin', t.loginHere);

  set('#loginPanel h1', t.welcome);
  set('#loginPanel .muted', t.loginText);
  set('#loginForm button[type="submit"]', t.login);

  set('#privacyBtn', t.privacy);
  set('#editBtn', t.edit);
  set('#logoutBtn', t.logout);

  set('.welcome .eyebrow', t.eyebrow);
  set('.welcome h1', t.headline);
  set('.welcome .subtitle', t.subtitle);
  set('.welcome .status', t.logged);

  set('.mini-brand', t.healthId);
  set('#settingsBtn', t.settings);
  set('.emergency h3', t.emergency);
  set('#emergencyBtn', t.view);

  set('.section-title h3', t.records);
  set('.side-head h3', t.quick);

  $$('[data-nav]').forEach(b => {
    const k = b.dataset.nav;
    const label = {
      Home: t.home,
      Appointments: t.appointments,
      'Health ID': t.health,
      'Medical Kit': t.kit,
      Profile: t.profile
    }[k];
    if (label) {
      const icon = b.querySelector('span');
      b.textContent = '';
      if (icon) b.appendChild(icon);
      b.append(' ' + label);
    }
  });
}
