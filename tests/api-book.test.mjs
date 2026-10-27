import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import book from '../api/book.js';
import { resetRateLimits } from '../api/_lib/http.js';
import { resetGoogleToken } from '../api/_lib/google.js';
import { setEnv, fakeReq, fakeRes, stubFetch, freshIp } from './_api-helpers.mjs';

// 10:00 am in Winnipeg (CDT) on 2026-10-27; the first slot that day is 20:30Z (3:30 PM).
const NOW = new Date('2026-10-27T15:00:00.000Z');
const SLOT = '2026-10-27T20:30:00.000Z';
const VISITOR = Object.freeze({
  start: SLOT,
  name: 'Ana Reyes',
  email: 'ana@example.com',
  phone: '204 555 0100',
  service: 'Business Strategy',
  note: 'A short question about outsourcing.',
  consent: true,
});

let fetchStub;

beforeEach(() => {
  mock.timers.enable({ apis: ['Date'], now: NOW });
  resetRateLimits();
  resetGoogleToken();
  setEnv();
});

afterEach(() => {
  fetchStub?.restore();
  fetchStub = null;
  mock.timers.reset();
});

async function post(body, opts = {}) {
  const res = fakeRes();
  await book(fakeReq({ body, ...opts }), res);
  return res;
}

test('a valid booking with Google configured creates a Meet event and emails both sides', async () => {
  fetchStub = stubFetch();
  const res = await post({ ...VISITOR });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json, { ok: true, id: 'evt123', meetUrl: 'https://meet.google.com/abc-defg-hij', start: SLOT });

  const insert = fetchStub.calls.find((c) => c.name === 'insert');
  assert.match(insert.url, /conferenceDataVersion=1/);
  assert.match(insert.url, /sendUpdates=all/);
  const event = JSON.parse(insert.init.body);
  assert.equal(event.conferenceData.createRequest.conferenceSolutionKey.type, 'hangoutsMeet');
  assert.equal(event.start.dateTime, SLOT);
  assert.equal(event.end.dateTime, '2026-10-27T20:40:00.000Z');
  assert.deepEqual(event.attendees, [{ email: VISITOR.email }]);

  assert.equal(fetchStub.emails.length, 2);
  const [toVisitor, toOwner] = [
    fetchStub.emails.find((m) => m.to.includes(VISITOR.email)),
    fetchStub.emails.find((m) => m.to.includes('malee.holgado@mygreatway.ca')),
  ];
  assert.ok(toVisitor && toOwner, 'one email to the visitor and one to the owner');
  for (const mail of [toVisitor, toOwner]) {
    assert.match(mail.text, /Central Time/);
    assert.match(mail.text, /3:30 PM/);
    assert.match(mail.text, /meet\.google\.com\/abc-defg-hij/);
  }
});

test('BOOKING_NOTIFY_EMAIL overrides the owner recipient', async () => {
  process.env.BOOKING_NOTIFY_EMAIL = 'desk@example.com';
  fetchStub = stubFetch();
  const res = await post({ ...VISITOR });
  assert.equal(res.statusCode, 200);
  assert.ok(fetchStub.emails.some((m) => m.to.includes('desk@example.com')));
});

test('a slot that overlaps a busy block answers 409 slot_taken and creates nothing', async () => {
  fetchStub = stubFetch({
    freeBusy: () => [200, { calendars: { 'owner@example.com': { busy: [{ start: '2026-10-27T20:35:00Z', end: '2026-10-27T20:55:00Z' }] } } }],
  });
  const res = await post({ ...VISITOR });
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.json, { ok: false, error: 'slot_taken' });
  assert.ok(!fetchStub.calls.some((c) => c.name === 'insert'));
  assert.equal(fetchStub.emails.length, 0);
});

test('with Google not configured the owner is emailed the requested time (pending)', async () => {
  setEnv({ google: false });
  fetchStub = stubFetch();
  const res = await post({ ...VISITOR });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json, { ok: true, pending: true });
  assert.ok(!fetchStub.calls.some((c) => c.url.includes('googleapis.com')));
  assert.equal(fetchStub.emails.length, 1);
  const [mail] = fetchStub.emails;
  assert.deepEqual(mail.to, ['malee.holgado@mygreatway.ca']);
  assert.equal(mail.reply_to, VISITOR.email);
  assert.match(mail.text, /3:30 PM/);
  assert.match(mail.text, /Central Time/);
  assert.match(mail.text, /Ana Reyes/);
});

test('a Google 500 falls back to the pending owner email', async () => {
  fetchStub = stubFetch({ freeBusy: () => [500, { error: { message: 'backend' } }] });
  const res = await post({ ...VISITOR });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json, { ok: true, pending: true });
  assert.equal(fetchStub.emails.length, 1);
  assert.match(fetchStub.emails[0].text, /3:30 PM/);
});

test('a failed event insert also falls back to the pending owner email', async () => {
  fetchStub = stubFetch({ insert: () => [500, { error: { message: 'boom' } }] });
  const res = await post({ ...VISITOR });
  assert.deepEqual(res.json, { ok: true, pending: true });
  assert.equal(fetchStub.emails.length, 1);
});

test('when even the fallback email fails the visitor is told it was not sent', async () => {
  setEnv({ google: false, mail: false });
  fetchStub = stubFetch();
  const res = await post({ ...VISITOR });
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.json, { ok: false, error: 'not_sent' });
});

test('a filled honeypot answers ok and sends nothing', async () => {
  fetchStub = stubFetch();
  const res = await post({ ...VISITOR, hp: 'http://spam.example' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.equal(fetchStub.calls.length, 0);
});

for (const [why, start] of [
  ['off a slot boundary', '2026-10-27T20:35:00.000Z'],
  ['outside the booking hours', '2026-10-27T18:00:00.000Z'],
  ['beyond the 60-day horizon', '2027-01-05T21:30:00.000Z'],
  ['in the past', '2026-10-26T20:30:00.000Z'],
  ['not a date', 'tomorrow at 4'],
]) {
  test(`a start ${why} answers 400 invalid with fields ['start']`, async () => {
    fetchStub = stubFetch();
    const res = await post({ ...VISITOR, start });
    assert.equal(res.statusCode, 400);
    assert.equal(res.json.error, 'invalid');
    assert.deepEqual(res.json.fields, ['start']);
    assert.equal(fetchStub.calls.length, 0);
  });
}

test('a start within the 2-hour lead time answers 400', async () => {
  mock.timers.setTime(Date.parse('2026-10-27T19:00:00.000Z'));
  fetchStub = stubFetch();
  const res = await post({ ...VISITOR });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.json.fields, ['start']);
});

test('missing consent and a bad email are listed in fields', async () => {
  fetchStub = stubFetch();
  const res = await post({ ...VISITOR, consent: false, email: 'not-an-email', name: '' });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.json, { ok: false, error: 'invalid', fields: ['name', 'email', 'consent'] });
});

test('a body that is not JSON answers 400', async () => {
  fetchStub = stubFetch();
  const res = await post('{nope');
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.error, 'invalid');
});

test('GET answers 405', async () => {
  const res = fakeRes();
  await book(fakeReq({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
});

test('a second booking for an email with a future event answers 409 already_booked', async () => {
  fetchStub = stubFetch({
    events: () => [200, { items: [{
      id: 'old1', status: 'confirmed',
      start: { dateTime: '2026-10-30T21:00:00Z' }, end: { dateTime: '2026-10-30T21:10:00Z' },
      attendees: [{ email: 'Ana@Example.com' }],
    }] }],
  });
  const res = await post({ ...VISITOR });
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.json, { ok: false, error: 'already_booked' });
  assert.ok(!fetchStub.calls.some((c) => c.name === 'insert'));
});

test('a cancelled event or another attendee does not count as a booking', async () => {
  fetchStub = stubFetch({
    events: () => [200, { items: [
      { id: 'a', status: 'cancelled', attendees: [{ email: VISITOR.email }] },
      { id: 'b', status: 'confirmed', attendees: [{ email: 'someone-else@example.com' }] },
    ] }],
  });
  const res = await post({ ...VISITOR });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.id, 'evt123');
});

test('the 6th request from one IP within 10 minutes answers 429', async () => {
  fetchStub = stubFetch({ freeBusy: () => [200, { calendars: { 'owner@example.com': { busy: [{ start: SLOT, end: '2026-10-27T20:40:00Z' }] } } }] });
  const ip = freshIp();
  for (let i = 0; i < 5; i += 1) {
    const res = await post({ ...VISITOR }, { ip });
    assert.equal(res.statusCode, 409, `request ${i + 1}`);
  }
  const sixth = await post({ ...VISITOR }, { ip });
  assert.equal(sixth.statusCode, 429);
  assert.deepEqual(sixth.json, { ok: false, error: 'rate_limited' });
  const other = await post({ ...VISITOR });
  assert.equal(other.statusCode, 409, 'another IP is not limited');
  mock.timers.tick(10 * 60 * 1000 + 1);
  const later = await post({ ...VISITOR }, { ip });
  assert.equal(later.statusCode, 409, 'the window resets after 10 minutes');
});
