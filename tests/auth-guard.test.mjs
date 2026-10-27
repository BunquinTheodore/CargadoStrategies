/* Accounts and dashboards (plan Task 12): role routing, the guard's decision, the
   client dashboard model, friendly sign-in errors, the lazy Firebase loader (both an
   empty and a filled FIREBASE config) and the admin API helper. No network: the SDK
   and fetch are stubbed. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { routeFor, guardDecision, ROLE_ROUTES, LOGIN_PAGE } from '../site/core/account/guard.js';
import { dashboardModel, partnerModel, referralLinks, formatWhen } from '../site/core/account/model.js';
import { friendlyError, SETUP_MESSAGE } from '../site/core/account/auth.js';
import { loadFirebase, resetFirebase, SDK_VERSION } from '../site/core/account/firebase.js';
import { referralCodeFor, normalizeReferralCode } from '../site/core/account/schema.js';
import { adminAction, adminMessage, ADMIN_ACTIONS } from '../site/core/account/admin-api.js';
import { FIREBASE } from '../site/assets/js/config.js';

/* ---------- routing and the guard ---------- */

test('routeFor sends each role to its dashboard and anything else to the client one', () => {
  assert.equal(routeFor('client'), 'dashboard.html');
  assert.equal(routeFor('partner'), 'partner-dashboard.html');
  assert.equal(routeFor('admin'), 'admin.html');
  assert.equal(routeFor(undefined), 'dashboard.html');
  assert.equal(routeFor('owner'), 'dashboard.html');
  assert.equal(routeFor('__proto__'), 'dashboard.html');
  assert.ok(Object.isFrozen(ROLE_ROUTES));
});

test('guardDecision: signed out goes to the log-in page, wrong role to its own dashboard', () => {
  assert.deepEqual(guardDecision(null, 'client'), { action: 'login', to: LOGIN_PAGE });
  assert.deepEqual(guardDecision({ uid: 'a', role: 'client' }, 'client'), { action: 'allow' });
  assert.deepEqual(guardDecision({ uid: 'a' }, 'client'), { action: 'allow' });   // no role yet = client
  assert.deepEqual(guardDecision({ uid: 'a', role: 'client' }, 'admin'), { action: 'redirect', to: 'dashboard.html' });
  assert.deepEqual(guardDecision({ uid: 'a', role: 'partner' }, 'client'), { action: 'redirect', to: 'partner-dashboard.html' });
  assert.deepEqual(guardDecision({ uid: 'a', role: 'admin' }, 'admin'), { action: 'allow' });
});

/* ---------- client dashboard model ---------- */

const NOW = new Date('2026-10-27T18:00:00.000Z');

test('dashboardModel sums the balance and lists history newest first', () => {
  const points = [
    { id: 'booking_e1', points: 5, kind: 'booking', createdAt: '2026-10-01T10:00:00.000Z' },
    { id: 'service_s1', points: 5, kind: 'service', createdAt: { seconds: Date.parse('2026-10-20T10:00:00.000Z') / 1000 } },
    { id: 'adjust_1', points: -2, kind: 'adjustment', reason: 'Correction', at: new Date('2026-10-10T10:00:00.000Z') },
  ];
  const model = dashboardModel({ uid: 'u1', displayName: 'Ana Cruz', email: 'ana@example.com' }, points, [], NOW);
  assert.equal(model.balance, 8);
  assert.deepEqual(model.history.map((p) => p.id), ['service_s1', 'adjust_1', 'booking_e1']);
  assert.equal(model.history[1].label, 'Correction');
  assert.equal(model.history[2].label, 'Consultation completed');
  assert.equal(model.firstName, 'Ana');
});

test('dashboardModel splits bookings into upcoming (soonest first) and past (newest first)', () => {
  const bookings = [
    { id: 'b1', start: '2026-10-20T20:30:00.000Z', status: 'completed' },
    { id: 'b2', start: '2026-11-03T21:30:00.000Z', status: 'confirmed' },
    { id: 'b3', start: '2026-10-28T20:30:00.000Z', status: 'confirmed' },
    { id: 'b4', start: '2026-10-25T20:30:00.000Z', status: 'no-show' },
    { id: 'b5', start: 'not a date', status: 'confirmed' },
  ];
  const model = dashboardModel({ uid: 'u1' }, [], bookings, NOW);
  assert.deepEqual(model.upcoming.map((b) => b.id), ['b3', 'b2']);
  assert.deepEqual(model.past.map((b) => b.id), ['b4', 'b1']);
  assert.equal(model.balance, 0);
  assert.deepEqual(model.history, []);
});

test('dashboardModel ignores non-numeric point values and handles missing lists', () => {
  const model = dashboardModel({ uid: 'u1' }, [{ id: 'x', points: 'lots' }], undefined, NOW);
  assert.equal(model.balance, 0);
  assert.deepEqual(model.upcoming, []);
});

test('referral links carry the code to Contact and to sign-up', () => {
  assert.deepEqual(referralLinks('ANA12345', 'https://example.ca'), {
    book: 'https://example.ca/contact.html?ref=ANA12345',
    signUp: 'https://example.ca/account.html?ref=ANA12345',
  });
  assert.equal(referralLinks('', 'https://example.ca'), null);
});

test('formatWhen writes Winnipeg time and says Central Time', () => {
  const text = formatWhen('2026-10-27T20:30:00.000Z');
  assert.match(text, /Oct 27/);
  assert.match(text, /3:30\s?PM/);
  assert.match(text, /Central Time$/);
  assert.equal(formatWhen('nope'), '');
});

test('partnerModel lists referrals newest first and adds no totals or earnings', () => {
  const model = partnerModel([{ id: 'r1', at: '2026-10-01T00:00:00Z' }, { id: 'r2', createdAt: '2026-10-05T00:00:00Z' }]);
  assert.deepEqual(model.referrals.map((r) => r.id), ['r2', 'r1']);
  assert.equal('total' in model, false);
  assert.equal('earnings' in model, false);
});

/* ---------- referral codes ---------- */

test('referral codes come from the uid and only clean codes are accepted from a link', () => {
  assert.equal(referralCodeFor('aB3-dE6fGh9xyz'), 'AB3DE6FG');
  assert.equal(normalizeReferralCode(' ana12345 '), 'ANA12345');
  assert.equal(normalizeReferralCode('<script>'), '');
  assert.equal(normalizeReferralCode(''), '');
  assert.equal(normalizeReferralCode(null), '');
});

/* ---------- friendly errors ---------- */

test('provider not enabled or not configured shows the setup message', () => {
  for (const code of ['auth/operation-not-allowed', 'auth/configuration-not-found', 'app/not-configured', 'auth/unauthorized-domain']) {
    assert.equal(friendlyError({ code }), SETUP_MESSAGE, code);
  }
  assert.equal(SETUP_MESSAGE, 'Sign-in is being set up. Please try again soon.');
});

test('common sign-in errors read plainly; closing the Google window says nothing', () => {
  assert.match(friendlyError({ code: 'auth/invalid-credential' }), /do not match/);
  assert.match(friendlyError({ code: 'auth/email-already-in-use' }), /already has an account/);
  assert.match(friendlyError({ code: 'auth/weak-password' }), /at least 6/);
  assert.match(friendlyError({ code: 'auth/network-request-failed' }), /connection/);
  assert.equal(friendlyError({ code: 'auth/popup-closed-by-user' }), '');
  assert.match(friendlyError(new Error('boom')), /Something went wrong/);
});

/* ---------- the Firebase loader ---------- */

function fakeSdk(log) {
  const app = { name: '[DEFAULT]' };
  return {
    app: async () => ({
      getApps: () => [], getApp: () => app,
      initializeApp: (config) => { log.push(['initializeApp', config]); return app; },
      setLogLevel: (level) => log.push(['setLogLevel', level]),
    }),
    auth: async () => ({
      browserLocalPersistence: 'local', browserSessionPersistence: 'session', browserPopupRedirectResolver: 'popup',
      initializeAuth: (a, deps) => { log.push(['initializeAuth', deps]); return { app: a }; },
      getAuth: (a) => { log.push(['getAuth']); return { app: a }; },
    }),
    firestore: async () => ({ getFirestore: (a) => { log.push(['getFirestore']); return { app: a }; }, setLogLevel: () => {} }),
  };
}

test('an empty FIREBASE config loads nothing and resolves null ("Accounts are coming soon")', async () => {
  resetFirebase();
  let touched = false;
  const sdk = { app: async () => { touched = true; }, auth: async () => {}, firestore: async () => {} };
  const empty = { apiKey: '', authDomain: '', projectId: '', appId: '' };
  assert.equal(await loadFirebase({ config: empty, sdk }), null);
  assert.equal(await loadFirebase({ config: {}, sdk }), null);
  assert.equal(touched, false);
});

test('a filled config initialises app, auth and Firestore once, silences SDK logs, and has no Analytics', async () => {
  resetFirebase();
  const log = [];
  const sdk = fakeSdk(log);
  const [a, b] = await Promise.all([loadFirebase({ sdk }), loadFirebase({ sdk })]);
  assert.equal(a, b);
  assert.ok(a.app && a.auth && a.db);
  assert.equal(log.filter(([name]) => name === 'initializeApp').length, 1);
  assert.deepEqual(log.find(([name]) => name === 'initializeApp')[1], { ...FIREBASE });
  assert.ok(log.some(([name, level]) => name === 'setLogLevel' && level === 'silent'));
  // Sessions in localStorage first: the header button and the guard read firebase:authUser:* there.
  assert.deepEqual(log.find(([name]) => name === 'initializeAuth')[1].persistence, ['local', 'session']);
  resetFirebase();
});

test('a failed SDK download rejects and the next call tries again', async () => {
  resetFirebase();
  const log = [];
  let fail = true;
  const good = fakeSdk(log);
  const sdk = { ...good, app: async () => { if (fail) throw new Error('offline'); return good.app(); } };
  await assert.rejects(loadFirebase({ sdk }));
  fail = false;
  assert.ok(await loadFirebase({ sdk }));
  resetFirebase();
});

test('the SDK URLs are the pinned gstatic version and Analytics is never imported', () => {
  const source = readFileSync(new URL('../site/core/account/firebase.js', import.meta.url), 'utf8');
  const urls = [...source.matchAll(/import\('([^']+)'\)/g)].map((m) => m[1]);
  assert.equal(SDK_VERSION, '10.12.2');
  assert.equal(urls.length, 3);
  urls.forEach((url) => assert.match(url, /^https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.2\/firebase-(app|auth|firestore)\.js$/));
  assert.doesNotMatch(source, /firebase-analytics|getAnalytics/);
});

/* ---------- admin API helper ---------- */

test('adminAction posts JSON with the ID token as a bearer', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const result = await adminAction('adjust-points', { uid: 'u1', points: 5, reason: 'Thanks' }, { getToken: async () => 'tok', fetchImpl });
  assert.equal(result.ok, true);
  assert.equal(calls[0].url, '/api/admin/adjust-points');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer tok');
  assert.deepEqual(JSON.parse(calls[0].init.body), { uid: 'u1', points: 5, reason: 'Thanks' });
});

test('adminAction rejects unknown actions and maps 503 not_configured to a calm message', async () => {
  assert.ok(ADMIN_ACTIONS.includes('approve-partner'));
  await assert.rejects(adminAction('drop-tables', {}, { getToken: async () => 't', fetchImpl: async () => null }));
  const fetchImpl = async () => new Response(JSON.stringify({ ok: false, error: 'not_configured' }), { status: 503 });
  const result = await adminAction('approve-partner', { applicationId: 'a1' }, { getToken: async () => 't', fetchImpl });
  assert.equal(result.ok, false);
  assert.match(adminMessage(result), /being set up/);
  assert.match(adminMessage({ ok: false, httpStatus: 403, error: 'forbidden' }), /admin/i);
  assert.match(adminMessage({ ok: false, httpStatus: 403 }), /admin/i);
  assert.match(adminMessage({ ok: true, status: 'invited' }), /invitation/);
  assert.equal(adminMessage({ ok: true, httpStatus: 200 }), 'Saved.');
});

test('adminAction turns a network failure into a result, not a throw', async () => {
  const fetchImpl = async () => { throw new TypeError('Failed to fetch'); };
  const result = await adminAction('assign-referral', { partnerUid: 'p1', clientName: 'Bo' }, { getToken: async () => 't', fetchImpl });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'network');
  assert.match(adminMessage(result), /connection/);
});
