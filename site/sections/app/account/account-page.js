/**
 * account.html: log in, sign up, reset password, Continue With Google (v2 §8.1).
 *
 * - FIREBASE empty: "Accounts are coming soon" (startApp) and no SDK.
 * - No stored session: the forms show at once; the SDK loads on the first submit.
 * - A stored session: "You Are Logged In" with a link to the right dashboard.
 * - ?ref=CODE (a client's referral link) rides along into the new account.
 * - Provider not enabled yet: friendlyError → "Sign-in is being set up. Please try again soon."
 */
import { signInEmail, signUpEmail, signInGoogle, resetPassword, onUser, friendlyError } from '../../../core/account/auth.js';
import { routeFor } from '../../../core/account/guard.js';
import { normalizeReferralCode } from '../../../core/account/schema.js';
import { hasStoredSession } from '../../../core/chrome/account-button.js';
import { $, $$, busy, formValues, setStatus, showMain, startApp } from '../_shared.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;
const TITLES = Object.freeze({ login: 'Log In', signup: 'Create an Account', reset: 'Reset Your Password' });
const RESET_SENT = 'If an account uses that email, a reset link is on its way. Check the inbox and spam folder.';
const CHECKS = Object.freeze({
  name: (v) => (v ? '' : 'Please enter your name.'),
  email: (v) => (EMAIL.test(v) ? '' : 'Please enter a valid email address.'),
  password: (v, form) => {
    if (!v) return 'Please enter your password.';
    return form.dataset.authForm === 'signup' && v.length < MIN_PASSWORD ? `Please choose a password of at least ${MIN_PASSWORD} characters.` : '';
  },
});

const status = () => $('[data-auth-status]');

function localStore() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function setView(view) {
  $$('[data-auth-form]').forEach((form) => { form.hidden = form.dataset.authForm !== view; });
  $$('.app-switch [data-auth-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.authView === view)));
  $('[data-auth-google]').hidden = view === 'reset';
  const title = $('[data-auth-title]');
  title.textContent = TITLES[view];
  setStatus(status(), '');
  return title;
}

/** The first problem in the form (fields marked aria-invalid), or ''. */
function validate(form) {
  const values = formValues(form);
  let first = '';
  $$('input[name]', form).forEach((input) => {
    const message = CHECKS[input.name]?.(values[input.name] ?? '', form) || '';
    input.setAttribute('aria-invalid', String(!!message));
    if (message && !first) { first = message; input.focus(); }
  });
  return first;
}

const goTo = (user) => location.assign(routeFor(user.role));

const SUBMIT = Object.freeze({
  login: async ({ email, password }) => goTo(await signInEmail(email, password)),
  signup: async ({ name, email, password }, ref) => goTo(await signUpEmail(name, email, password, ref)),
  reset: async ({ email }) => {
    try {
      await resetPassword(email);
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error;   // never reveal whether an account exists
    }
    setStatus(status(), RESET_SENT, 'ok');
  },
});

function wireForm(form, ref) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const problem = validate(form);
    if (problem) { setStatus(status(), problem, 'error'); return; }
    setStatus(status(), 'One moment…');
    await busy(form, async () => {
      try {
        await SUBMIT[form.dataset.authForm](formValues(form), ref);
      } catch (error) {
        setStatus(status(), friendlyError(error), 'error');
      }
    });
  });
}

function wireGoogle(ref) {
  const button = $('[data-google]');
  button.addEventListener('click', async () => {
    button.disabled = true;
    setStatus(status(), '');
    try {
      const user = await signInGoogle(ref);
      if (user) goTo(user);
    } catch (error) {
      setStatus(status(), friendlyError(error), 'error');
    } finally {
      button.disabled = false;
    }
  });
}

function showSigned(user) {
  $('[data-auth]').hidden = true;
  const card = $('[data-app-signed]');
  $('[data-signed-email]', card).textContent = user.email;
  $('[data-signed-go]', card).setAttribute('href', routeFor(user.role));
  showMain(user, card);
}

function showForms() {
  $('[data-app-signed]').hidden = true;
  showMain(null, $('[data-auth]'));
}

export function initAccount() {
  if (!startApp()) return;
  const ref = normalizeReferralCode(new URLSearchParams(location.search).get('ref'));
  if (ref) {
    $('[data-auth-ref-code]').textContent = ref;
    $('[data-auth-ref]').hidden = false;
  }
  $$('[data-auth-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.authView).focus()));
  $$('[data-auth-form]').forEach((form) => wireForm(form, ref));
  wireGoogle(ref);
  setView(ref ? 'signup' : 'login');
  if (!hasStoredSession(localStore())) { showForms(); return; }
  onUser((user) => (user ? showSigned(user) : showForms()));
}
