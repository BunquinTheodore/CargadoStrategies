/* Header account button (plan Task 10): hidden without Firebase config, "Log In" at
   once without the SDK, and auth is imported only when a stored session exists. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasStoredSession, initAccountButton } from '../site/core/chrome/account-button.js';

const SESSION_KEY = 'firebase:authUser:KEY:[DEFAULT]';

/** A Storage-like object over a plain map. */
function fakeStorage(entries = {}) {
  const keys = Object.keys(entries);
  return { get length() { return keys.length; }, key: (i) => keys[i] ?? null, getItem: (k) => entries[k] ?? null };
}

/** A minimal anchor: the attributes, text and children the module touches. */
function fakeLink() {
  const attrs = { href: 'account.html' };
  return {
    hidden: true, textContent: 'Log In', children: [],
    setAttribute(name, value) { attrs[name] = String(value); },
    getAttribute: (name) => attrs[name] ?? null,
    removeAttribute(name) { delete attrs[name]; },
    replaceChildren(...nodes) { this.children = nodes; this.textContent = nodes.map((n) => n.textContent).join(''); },
    ownerDocument: { createElement: () => ({ className: '', textContent: '' }), createTextNode: (t) => ({ textContent: t }) },
  };
}
const rootWith = (el) => ({ querySelector: (sel) => (sel === '[data-account]' ? el : null) });
const now = (cb) => cb();

test('hasStoredSession finds only the Firebase auth-persistence key', () => {
  assert.equal(hasStoredSession(fakeStorage({ [SESSION_KEY]: '{}' })), true);
  assert.equal(hasStoredSession(fakeStorage({ 'cs-sound': 'on' })), false);
  assert.equal(hasStoredSession(null), false);
  const throwing = { get length() { throw new Error('blocked'); } };
  assert.equal(hasStoredSession(throwing), false);
});

test('unconfigured Firebase leaves the button hidden and never loads auth', async () => {
  const el = fakeLink();
  let loaded = false;
  const { ready } = initAccountButton({ root: rootWith(el), configured: false, storage: fakeStorage({ [SESSION_KEY]: '{}' }), schedule: now, loadAuth: async () => { loaded = true; } });
  await ready;
  assert.equal(el.hidden, true);
  assert.equal(loaded, false);
});

test('configured and signed out: "Log In" shows at once and auth is never imported', async () => {
  const el = fakeLink();
  let loaded = false;
  const { ready } = initAccountButton({ root: rootWith(el), configured: true, storage: fakeStorage(), schedule: now, loadAuth: async () => { loaded = true; } });
  assert.equal(el.hidden, false);
  await ready;
  assert.equal(el.textContent, 'Log In');
  assert.equal(loaded, false);
});

test('a stored session loads auth after idle and shows "Dashboard" linking to the right dashboard', async () => {
  const el = fakeLink();
  const loadAuth = async () => ({
    onUser: (cb) => { cb({ displayName: 'Lee Holgado', role: 'partner' }); return () => {}; },
    routeFor: (role) => (role === 'partner' ? 'partner-dashboard.html' : 'dashboard.html'),
  });
  const { ready } = initAccountButton({ root: rootWith(el), configured: true, storage: fakeStorage({ [SESSION_KEY]: '{}' }), schedule: now, loadAuth });
  await ready;
  assert.equal(el.textContent, 'Dashboard');
  assert.equal(el.getAttribute('href'), 'partner-dashboard.html');
});

test('an auth import failure keeps "Log In" without throwing', async () => {
  const el = fakeLink();
  const { ready } = initAccountButton({ root: rootWith(el), configured: true, storage: fakeStorage({ [SESSION_KEY]: '{}' }), schedule: now, loadAuth: async () => { throw new Error('offline'); } });
  await ready;
  assert.equal(el.textContent, 'Log In');
  assert.equal(el.getAttribute('href'), 'account.html');
});

test('no button on the page is a no-op', async () => {
  const { el, ready } = initAccountButton({ root: rootWith(null), configured: true, storage: fakeStorage(), schedule: now });
  await ready;
  assert.equal(el, null);
});
