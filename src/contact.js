import './styles.css';
import { initCursor } from './cursor.js';
import { initMenu } from './menu.js';

/* ============================================================
   Contact page — form validation + Web3Forms submission.
   Progressive enhancement: the <form> has a real action/method/
   redirect, so it still works if this script fails to load.
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const VALID_SECTIONS = [
  'automotive',
  'portraits',
  'automotive-portraits',
  'products',
  'pets',
  'contact',
];

function backHref() {
  const from = new URLSearchParams(location.search).get('from');
  const section = VALID_SECTIONS.includes(from) ? from : 'automotive';
  return `index.html#${section}`;
}

function initBackLinks() {
  const href = backHref();
  $$('[data-back-link]').forEach((a) => (a.href = href));
}

function showSent() {
  $('#contactFormSection')?.setAttribute('hidden', '');
  $('#contactSent')?.removeAttribute('hidden');
}

// Non-JS submissions come back here via the form's `redirect` field.
function initSentFromRedirect() {
  if (new URLSearchParams(location.search).get('sent') === '1') showSent();
}

function initForm() {
  const form = $('#contactForm');
  const errorEl = $('#formError');
  const submitBtn = $('#formSubmit');
  if (!form) return;

  const setError = (msg) => {
    if (!msg) {
      errorEl.hidden = true;
      errorEl.textContent = '';
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = msg;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !email || !message) {
      setError('Please fill in your name, email and message.');
      return;
    }
    if (!emailOk) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');

    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING…';

    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Submission failed.');
      showSent();
    } catch {
      setError("Couldn't send your message — please try again, or email me directly via Instagram.");
      submitBtn.disabled = false;
      submitBtn.textContent = 'SEND';
    }
  });
}

function boot() {
  initCursor();
  initMenu();
  initSentFromRedirect();
  initBackLinks();
  initForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
