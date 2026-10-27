import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { POINTS_PER_EVENT, pointEventId, award } from '../api/_lib/points.js';
import cron from '../api/cron/complete-bookings.js';
import { recordBooking } from '../api/_lib/store.js';
import { fakeReq, fakeRes } from './_api-helpers.mjs';
import { setFirebaseEnv, clearFirebaseEnv, fakeFirestore, signIdToken } from './_firestore-fake.mjs';

/* ---------- pure rules ---------- */

test('every qualifying event is worth 5 points', () => {
  assert.equal(POINTS_PER_EVENT, 5);
  assert.equal(award(new Set(), { kind: 'service', refId: 'acq1' }).points, 5);
});

test('event ids are stable per kind and reference, and safe as document ids', () => {
  assert.equal(pointEventId('booking', 'evt123'), pointEventId('booking', 'evt123'));
  assert.notEqual(pointEventId('booking', 'x'), pointEventId('referral', 'x'));
  assert.doesNotMatch(pointEventId('service', 'a/b c'), /[/\s]/);
  assert.throws(() => pointEventId('gift', 'x'));
  assert.throws(() => pointEventId('booking', ''));
});

test('awarding the same event twice awards only once', () => {
  const first = award(new Set(), { kind: 'booking', refId: 'evt1', status: 'completed' });
  assert.equal(first.award, true);
  const second = award(new Set([first.id]), { kind: 'booking', refId: 'evt1', status: 'completed' });
  assert.equal(second.award, false);
  assert.equal(second.id, first.id);
});

test('a completed booking and a referral first consult are two events, 10 points', () => {
  const existing = new Set();
  const events = [
    { kind: 'booking', refId: 'evt1', status: 'completed' },
    { kind: 'referral', refId: 'friendUid' },
  ];
  const results = events.map((event) => {
    const result = award(existing, event);
    if (result.award) existing.add(result.id);
    return result;
  });
  assert.equal(new Set(results.map((r) => r.id)).size, 2);
  assert.equal(results.filter((r) => r.award).reduce((sum, r) => sum + r.points, 0), 10);
});

test('a cancelled, no-show or pending booking earns nothing', () => {
  for (const status of ['cancelled', 'no-show', 'confirmed', 'pending', undefined]) {
    assert.equal(award(new Set(), { kind: 'booking', refId: 'evt1', status }).award, false, String(status));
  }
});

/* ---------- cron: complete bookings ---------- */

const PAST = '2026-10-20T20:30:00.000Z';
const PAST_END = '2026-10-20T20:40:00.000Z';
const FUTURE = '2099-01-01T20:30:00.000Z';
const CRON_SECRET = 'cron-test-secret';

let store;

beforeEach(() => {
  setFirebaseEnv();
  process.env.CRON_SECRET = CRON_SECRET;
  store = fakeFirestore();
});

afterEach(() => {
  store?.restore();
  store = null;
  clearFirebaseEnv();
  delete process.env.CRON_SECRET;
});

const runCron = async (secret = CRON_SECRET) => {
  const res = fakeRes();
  const headers = secret ? { authorization: `Bearer ${secret}` } : {};
  const req = { ...fakeReq({ method: 'GET' }), headers };
  await cron(req, res);
  return res;
};

function seedBookings() {
  store.put('users/friend', { role: 'client', email: 'friend@example.com', points: 0, referralCode: 'FRIEND1', referredBy: 'ANA1' });
  store.put('users/ana', { role: 'client', email: 'ana@example.com', points: 0, referralCode: 'ANA1' });
  store.put('bookings/evtA', { status: 'confirmed', uid: 'friend', email: 'friend@example.com', start: PAST, end: PAST_END });
  store.put('bookings/evtB', { status: 'cancelled', uid: 'ana', email: 'ana@example.com', start: PAST, end: PAST_END });
  store.put('bookings/evtC', { status: 'confirmed', uid: 'ana', email: 'ana@example.com', start: FUTURE, end: FUTURE });
  store.put('bookings/evtD', { status: 'no-show', uid: 'ana', email: 'ana@example.com', start: PAST, end: PAST_END });
}

test('the cron completes past confirmed bookings and awards points once, even when run twice', async () => {
  seedBookings();
  const first = await runCron();
  assert.equal(first.statusCode, 200);
  assert.equal(first.json.completed, 1);
  const second = await runCron();
  assert.equal(second.statusCode, 200);
  assert.equal(second.json.completed, 0);

  assert.equal(store.get('bookings/evtA').status, 'completed');
  assert.equal(store.get('bookings/evtB').status, 'cancelled');
  assert.equal(store.get('bookings/evtC').status, 'confirmed');
  assert.equal(store.get('bookings/evtD').status, 'no-show');

  // The friend earns 5 for the consultation; Ana earns 5 for referring them.
  assert.equal(store.get('users/friend').points, 5);
  assert.deepEqual(store.list('users/friend/points/'), [`users/friend/points/${pointEventId('booking', 'evtA')}`]);
  assert.equal(store.get('users/ana').points, 5);
  assert.deepEqual(store.list('users/ana/points/'), [`users/ana/points/${pointEventId('referral', 'friend')}`]);
});

test('a retry after a half-finished run does not award twice', async () => {
  seedBookings();
  await runCron();
  // Simulate a crash after the award and before the status change.
  store.put('bookings/evtA', { ...store.get('bookings/evtA'), status: 'confirmed' });
  const again = await runCron();
  assert.equal(again.statusCode, 200);
  assert.equal(store.get('users/friend').points, 5);
  assert.equal(store.get('users/ana').points, 5);
  assert.equal(store.get('bookings/evtA').status, 'completed');
});

test('the cron needs the CRON_SECRET bearer', async () => {
  assert.equal((await runCron('wrong')).statusCode, 401);
  assert.equal((await runCron(null)).statusCode, 401);
});

test('the cron answers 503 not_configured without the Firebase service account', async () => {
  clearFirebaseEnv();
  const res = await runCron();
  assert.equal(res.statusCode, 503);
  assert.equal(res.json.error, 'not_configured');
});

/* ---------- recordBooking ---------- */

test('recordBooking stores a booking linked to the verified signed-in user, without the token', async () => {
  const idToken = signIdToken({ uid: 'ana', email: 'ana@example.com' });
  const id = await recordBooking({
    id: 'evt9', start: FUTURE, end: FUTURE, name: 'Ana', email: 'ana@example.com', meetUrl: 'https://meet.google.com/x', status: 'confirmed', idToken,
  });
  assert.equal(id, 'evt9');
  const doc = store.get('bookings/evt9');
  assert.equal(doc.uid, 'ana');
  assert.equal(doc.status, 'confirmed');
  assert.equal(doc.idToken, undefined);
});

test('recordBooking with a bad token still stores the booking, unlinked', async () => {
  await recordBooking({ id: 'evt10', start: FUTURE, end: FUTURE, name: 'Bo', email: 'bo@example.com', status: 'confirmed', idToken: 'not.a.token' });
  assert.equal(store.get('bookings/evt10').uid, null);
});

test('recordBooking is a no-op without the service account', async () => {
  clearFirebaseEnv();
  assert.equal(await recordBooking({ id: 'evt11', start: FUTURE, end: FUTURE, email: 'a@b.ca', status: 'pending' }), null);
  assert.equal(store.get('bookings/evt11'), undefined);
});
