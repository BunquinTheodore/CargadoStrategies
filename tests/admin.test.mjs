import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import admin from '../api/admin/[action].js';
import claimPartner from '../api/claim-partner.js';
import { pointEventId } from '../api/_lib/points.js';
import { fakeReq, fakeRes } from './_api-helpers.mjs';
import { setFirebaseEnv, clearFirebaseEnv, fakeFirestore, signIdToken } from './_firestore-fake.mjs';

const OWNER = Object.freeze({ uid: 'owner', email: 'owner@example.com' });
const CLIENT = Object.freeze({ uid: 'ana', email: 'ana@example.com' });

let store;

function seed(options) {
  store = fakeFirestore(options);
  store.put('users/owner', { role: 'admin', email: OWNER.email, points: 0 });
  store.put('users/ana', { role: 'client', email: CLIENT.email, points: 0, referralCode: 'ANA1' });
  store.put('partnerApplications/app1', { email: 'pro@example.com', inviteEmail: 'pro@example.com', business: 'Pro Law', contact: 'Pat Pro', status: 'pending', fields: {} });
}

beforeEach(() => {
  setFirebaseEnv();
  seed();
});

afterEach(() => {
  store?.restore();
  store = null;
  clearFirebaseEnv();
});

async function call(action, body = {}, who = OWNER, handler = admin) {
  const res = fakeRes();
  const req = fakeReq({ body, query: { action } });
  if (who) req.headers.authorization = `Bearer ${typeof who === 'string' ? who : signIdToken(who)}`;
  await handler(req, res);
  return res;
}

/* ---------- access ---------- */

test('without a token the admin API answers 401', async () => {
  const res = await call('adjust-points', { uid: 'ana', points: 5, reason: 'x' }, null);
  assert.equal(res.statusCode, 401);
  assert.equal(res.json.error, 'unauthorized');
});

test('a forged or expired token answers 401', async () => {
  assert.equal((await call('adjust-points', {}, 'a.b.c')).statusCode, 401);
  const expired = signIdToken({ ...OWNER, expiresIn: -60 });
  assert.equal((await call('adjust-points', {}, expired)).statusCode, 401);
  const otherProject = signIdToken({ ...OWNER, aud: 'someone-else' });
  assert.equal((await call('adjust-points', {}, otherProject)).statusCode, 401);
});

test('a client token answers 403', async () => {
  const res = await call('adjust-points', { uid: 'ana', points: 5, reason: 'x' }, CLIENT);
  assert.equal(res.statusCode, 403);
  assert.equal(res.json.error, 'forbidden');
  assert.equal(store.get('users/ana').points, 0);
});

test('without the service account the admin API answers 503 not_configured', async () => {
  clearFirebaseEnv();
  const res = await call('adjust-points', { uid: 'ana', points: 5, reason: 'x' });
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.json, { ok: false, error: 'not_configured' });
});

test('an unknown action answers 404 and GET answers 405', async () => {
  assert.equal((await call('drop-tables')).statusCode, 404);
  const res = fakeRes();
  await admin(fakeReq({ method: 'GET', query: { action: 'approve-partner' } }), res);
  assert.equal(res.statusCode, 405);
});

/* ---------- partners ---------- */

test('approve-partner with no matching verified account sets invited and sends one invite email', async () => {
  const res = await call('approve-partner', { applicationId: 'app1' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.status, 'invited');
  const application = store.get('partnerApplications/app1');
  assert.equal(application.status, 'invited');
  assert.equal(store.emails.length, 1);
  assert.deepEqual(store.emails[0].to, ['pro@example.com']);
  assert.match(store.emails[0].text, /account\.html/);
});

test('approve-partner does not count an unverified account with that email', async () => {
  store.restore();
  seed({ authUsers: [{ localId: 'pro', email: 'pro@example.com', emailVerified: false }] });
  const res = await call('approve-partner', { applicationId: 'app1' });
  assert.equal(res.json.status, 'invited');
  assert.equal(store.get('users/pro'), undefined);
});

test('approve-partner with a verified account grants the partner role at once', async () => {
  store.restore();
  seed({ authUsers: [{ localId: 'pro', email: 'pro@example.com', emailVerified: true }] });
  store.put('users/pro', { role: 'client', email: 'pro@example.com', points: 0 });
  const res = await call('approve-partner', { applicationId: 'app1' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.status, 'approved');
  assert.equal(store.get('users/pro').role, 'partner');
  assert.equal(store.get('partners/pro').status, 'active');
  assert.equal(store.get('partnerApplications/app1').partnerUid, 'pro');
});

test('approve-partner can re-send the invite to another address', async () => {
  await call('approve-partner', { applicationId: 'app1' });
  const res = await call('approve-partner', { applicationId: 'app1', email: 'pat@other.ca' });
  assert.equal(res.statusCode, 200);
  assert.equal(store.get('partnerApplications/app1').inviteEmail, 'pat@other.ca');
  assert.deepEqual(store.emails.at(-1).to, ['pat@other.ca']);
});

test('approve-partner for a missing application answers 404', async () => {
  assert.equal((await call('approve-partner', { applicationId: 'nope' })).statusCode, 404);
});

test('decline-partner marks the application declined', async () => {
  const res = await call('decline-partner', { applicationId: 'app1' });
  assert.equal(res.statusCode, 200);
  assert.equal(store.get('partnerApplications/app1').status, 'declined');
});

test('claim-partner grants the role on first sign-in only to the verified invited email', async () => {
  await call('approve-partner', { applicationId: 'app1' });
  const unverified = await call('', {}, { uid: 'pro', email: 'pro@example.com', emailVerified: false }, claimPartner);
  assert.equal(unverified.json.role, null);
  const other = await call('', {}, { uid: 'eve', email: 'eve@example.com' }, claimPartner);
  assert.equal(other.json.role, null);
  const pro = await call('', {}, { uid: 'pro', email: 'pro@example.com' }, claimPartner);
  assert.equal(pro.statusCode, 200);
  assert.equal(pro.json.role, 'partner');
  assert.equal(store.get('users/pro').role, 'partner');
  assert.equal(store.get('partnerApplications/app1').status, 'approved');
});

/* ---------- points and records ---------- */

test('adjust-points logs the change with its reason and moves the balance', async () => {
  const res = await call('adjust-points', { uid: 'ana', points: -3, reason: 'Duplicate entry' });
  assert.equal(res.statusCode, 200);
  assert.equal(store.get('users/ana').points, -3);
  const [path] = store.list('users/ana/points/');
  const entry = store.get(path);
  assert.equal(entry.kind, 'adjustment');
  assert.equal(entry.reason, 'Duplicate entry');
  assert.equal(entry.by, 'owner');
});

test('adjust-points needs a reason and a whole non-zero number', async () => {
  for (const body of [{ uid: 'ana', points: 5 }, { uid: 'ana', points: 0, reason: 'x' }, { uid: 'ana', points: 2.5, reason: 'x' }, { points: 5, reason: 'x' }]) {
    const res = await call('adjust-points', body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
  }
});

test('mark-acquired awards 5 points once per acquisition id', async () => {
  const first = await call('mark-acquired', { uid: 'ana', service: 'Business Strategy', id: 'acq1' });
  assert.equal(first.statusCode, 200);
  assert.equal(first.json.awarded, true);
  const again = await call('mark-acquired', { uid: 'ana', service: 'Business Strategy', id: 'acq1' });
  assert.equal(again.json.awarded, false);
  assert.equal(store.get('users/ana').points, 5);
  assert.ok(store.get(`users/ana/points/${pointEventId('service', 'acq1')}`));
  assert.equal(store.get('acquisitions/acq1').service, 'Business Strategy');
});

test('mark-acquired for an unknown client answers 404', async () => {
  assert.equal((await call('mark-acquired', { uid: 'ghost', service: 'X' })).statusCode, 404);
});

test('assign-referral stores a record for a partner only, and record-earning is gone', async () => {
  store.put('users/pro', { role: 'partner', email: 'pro@example.com', points: 0 });
  const notPartner = await call('assign-referral', { partnerUid: 'ana', clientName: 'Bo' });
  assert.equal(notPartner.statusCode, 400);

  const referral = await call('assign-referral', { partnerUid: 'pro', clientUid: 'ana', note: 'Will' });
  assert.equal(referral.statusCode, 200);
  const saved = store.get(`referrals/${referral.json.id}`);
  assert.equal(saved.partner, 'pro');
  assert.equal(saved.client, 'ana');

  assert.equal((await call('record-earning', { partnerUid: 'pro', amount: 120.5 })).statusCode, 404);
});

test('set-booking-status completed awards once; no-show awards nothing', async () => {
  store.put('bookings/evt1', { status: 'confirmed', uid: 'ana', email: CLIENT.email, start: '2026-10-20T20:30:00.000Z', end: '2026-10-20T20:40:00.000Z' });
  store.put('bookings/evt2', { status: 'confirmed', uid: 'ana', email: CLIENT.email, start: '2026-10-21T20:30:00.000Z', end: '2026-10-21T20:40:00.000Z' });
  assert.equal((await call('set-booking-status', { bookingId: 'evt2', status: 'no-show' })).statusCode, 200);
  assert.equal((await call('set-booking-status', { bookingId: 'evt1', status: 'completed' })).statusCode, 200);
  assert.equal((await call('set-booking-status', { bookingId: 'evt1', status: 'completed' })).statusCode, 200);
  assert.equal(store.get('bookings/evt2').status, 'no-show');
  assert.equal(store.get('users/ana').points, 5);
  assert.equal((await call('set-booking-status', { bookingId: 'evt1', status: 'lost' })).statusCode, 400);
});
