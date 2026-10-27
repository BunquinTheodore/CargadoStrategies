import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ZONE_LABEL, formatSlotLabel, dayChip, validateBooking, buildBookingPayload, resultMessage, apiAvailable,
  WEEKDAYS, monthKeyOf, shiftMonth, shiftDate, clampDate, dayLabel, monthGrid,
} from '../site/sections/contact/book/booking-ui.js';
import { bookableDays } from '../site/core/lib/slots.js';
import { BOOKING } from '../site/assets/js/config.js';

const VALID = Object.freeze({
  start: '2026-10-27T20:30:00.000Z', name: '  Ana Cruz ', email: ' ana@example.com ', phone: '',
  service: 'Web Design', note: '  A new site  ', consent: true, website: '',
});

test('formatSlotLabel names the Winnipeg date and time, labelled Central Time', () => {
  assert.equal(ZONE_LABEL, 'Central Time');
  assert.equal(formatSlotLabel('2026-10-27T20:30:00.000Z'), 'Tuesday, October 27, 3:30 PM Central Time');
  // CST after the change: 21:30Z is still 3:30 PM.
  assert.equal(formatSlotLabel('2026-11-02T21:30:00.000Z'), 'Monday, November 2, 3:30 PM Central Time');
  // Near midnight UTC: 01:50Z on the 28th is 8:50 PM on the 27th in Winnipeg (a visitor's own zone never shows).
  assert.equal(formatSlotLabel('2026-10-28T01:50:00.000Z'), 'Tuesday, October 27, 8:50 PM Central Time');
  assert.equal(formatSlotLabel('not a date'), '');
});

test('dayChip reads a calendar date without shifting it into another zone', () => {
  assert.deepEqual(dayChip('2026-10-27'), { weekday: 'Tue', day: '27', month: 'Oct', full: 'Tuesday, October 27' });
  assert.deepEqual(dayChip('2027-03-14'), { weekday: 'Sun', day: '14', month: 'Mar', full: 'Sunday, March 14' });
});

const datesOf = (grid) => grid.weeks.flat().filter(Boolean).map((c) => c.date);
const leadOf = (grid) => grid.weeks[0].findIndex(Boolean);

test('monthGrid lays a month out Sunday first, with only the rows it needs', () => {
  assert.deepEqual(WEEKDAYS.map((d) => d.short), ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const nov = monthGrid('2026-11'); // starts on a Sunday
  assert.equal(nov.label, 'November 2026');
  assert.equal(leadOf(nov), 0);
  assert.equal(nov.weeks.length, 5);
  assert.ok(nov.weeks.every((w) => w.length === 7));
  assert.deepEqual(nov.weeks[0][0], { date: '2026-11-01', day: 1 });
  assert.equal(datesOf(nov).at(-1), '2026-11-30');
  assert.equal(monthGrid('2026-02').weeks.length, 4); // 28 days from a Sunday
  const aug = monthGrid('2026-08'); // 31 days from a Saturday
  assert.equal(leadOf(aug), 6);
  assert.equal(aug.weeks.length, 6);
  assert.equal(monthGrid('2028-02').weeks.flat().filter(Boolean).length, 29); // leap year
});

test('monthGrid keeps every date once across the DST changes (Winnipeg: Nov 1 2026, Mar 14 2027)', () => {
  for (const [key, length] of [['2026-11', 30], ['2027-03', 31]]) {
    const dates = datesOf(monthGrid(key));
    assert.equal(dates.length, length);
    dates.forEach((d, i) => assert.equal(d, `${key}-${String(i + 1).padStart(2, '0')}`));
  }
  const mar = monthGrid('2027-03');
  assert.equal(leadOf(mar), 1); // March 1 2027 is a Monday
  assert.equal(mar.weeks[2][0].date, '2027-03-14'); // the spring-forward Sunday sits in the Sunday column
});

test('monthGrid rejects a malformed month', () => {
  assert.equal(monthGrid('2026-13'), null);
  assert.equal(monthGrid('2026-00'), null);
  assert.equal(monthGrid('Nov 2026'), null);
  assert.equal(monthGrid(undefined), null);
});

test('month and day arithmetic crosses month, year and DST boundaries', () => {
  assert.equal(monthKeyOf('2026-10-31'), '2026-10');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2027-01', -1), '2026-12');
  assert.equal(shiftMonth('2026-10', 14), '2027-12');
  assert.equal(shiftDate('2026-10-31', 1), '2026-11-01');
  assert.equal(shiftDate('2026-11-01', 1), '2026-11-02'); // fall-back day is still one date
  assert.equal(shiftDate('2027-03-14', 1), '2027-03-15'); // spring-forward day too
  assert.equal(shiftDate('2026-12-29', 7), '2027-01-05');
  assert.equal(shiftDate('2026-11-03', -7), '2026-10-27');
  assert.equal(clampDate('2026-10-01', '2026-10-25', '2026-12-24'), '2026-10-25');
  assert.equal(clampDate('2027-01-01', '2026-10-25', '2026-12-24'), '2026-12-24');
  assert.equal(clampDate('2026-11-11', '2026-10-25', '2026-12-24'), '2026-11-11');
});

test('dayLabel names the full date, year included', () => {
  assert.equal(dayLabel('2026-11-01'), 'Sunday, November 1, 2026');
  assert.equal(dayLabel('2027-03-14'), 'Sunday, March 14, 2027');
});

test('the calendar opens on the Winnipeg month, not the visitor month', () => {
  // 04:30 UTC on Nov 1 is still 11:30 PM on Oct 31 in Winnipeg (CDT, UTC-5).
  const days = bookableDays(new Date('2026-11-01T04:30:00Z'), BOOKING);
  assert.equal(days[0], '2026-10-31');
  assert.equal(monthKeyOf(days[0]), '2026-10');
  // 06:30 UTC on Jan 1 is 12:30 AM on Jan 1 in Winnipeg (CST, UTC-6): already the new year.
  assert.equal(monthKeyOf(bookableDays(new Date('2027-01-01T06:30:00Z'), BOOKING)[0]), '2027-01');
  assert.equal(monthKeyOf(bookableDays(new Date('2027-01-01T05:30:00Z'), BOOKING)[0]), '2026-12');
  // The window spans three calendar months at most (60 days from Oct 31 ends Dec 30).
  assert.equal(days.at(-1), '2026-12-30');
  assert.equal(shiftMonth(monthKeyOf(days[0]), 2), monthKeyOf(days.at(-1)));
});

test('validateBooking flags each missing or malformed answer by field id', () => {
  assert.deepEqual(validateBooking(VALID), []);
  const ids = (values) => validateBooking(values).map((e) => e.id);
  assert.deepEqual(ids({ ...VALID, start: '' }), ['start']);
  assert.deepEqual(ids({ ...VALID, name: '  ' }), ['name']);
  assert.deepEqual(ids({ ...VALID, email: 'ana@' }), ['email']);
  assert.deepEqual(ids({ ...VALID, phone: '12' }), ['phone']);
  assert.deepEqual(ids({ ...VALID, consent: false }), ['consent']);
  assert.ok(validateBooking({ ...VALID, consent: false })[0].message.length > 0);
});

test('buildBookingPayload trims, drops empty optionals and sends consent as a boolean', () => {
  assert.deepEqual(buildBookingPayload(VALID), {
    start: '2026-10-27T20:30:00.000Z', name: 'Ana Cruz', email: 'ana@example.com',
    service: 'Web Design', note: 'A new site', consent: true,
  });
  const withPhone = buildBookingPayload({ ...VALID, phone: ' 204 555 0123 ' });
  assert.equal(withPhone.phone, '204 555 0123');
  assert.equal(buildBookingPayload({ ...VALID, consent: 'on' }).consent, true);
  assert.equal(buildBookingPayload({ ...VALID, consent: '' }).consent, false);
});

test('buildBookingPayload carries the honeypot and the idToken only when given', () => {
  assert.equal('hp' in buildBookingPayload(VALID), false);
  assert.equal(buildBookingPayload({ ...VALID, website: 'spam' }).hp, 'spam');
  assert.equal('idToken' in buildBookingPayload(VALID), false);
  assert.equal('idToken' in buildBookingPayload({ ...VALID, idToken: '' }), false);
  assert.equal(buildBookingPayload({ ...VALID, idToken: 'tok' }).idToken, 'tok');
});

test('resultMessage: a confirmed booking shows the Central time and the Meet link', () => {
  const r = resultMessage({ status: 200, body: { ok: true, id: 'e1', meetUrl: 'https://meet.google.com/abc', start: '2026-10-27T20:30:00.000Z' } });
  assert.equal(r.kind, 'confirmed');
  assert.equal(r.done, true);
  assert.equal(r.meetUrl, 'https://meet.google.com/abc');
  assert.match(r.text, /Tuesday, October 27, 3:30 PM Central Time/);
});

test('resultMessage: pending says the time is confirmed by email', () => {
  const r = resultMessage({ status: 200, body: { ok: true, pending: true } }, '2026-10-27T20:30:00.000Z');
  assert.equal(r.kind, 'pending');
  assert.equal(r.done, true);
  assert.equal(r.meetUrl, '');
  assert.match(r.text, /confirm/i);
  assert.match(r.text, /by email/);
  assert.match(r.text, /3:30 PM Central Time/);
});

test('resultMessage: slot_taken reloads the times on the time step', () => {
  const r = resultMessage({ status: 409, body: { ok: false, error: 'slot_taken' } });
  assert.equal(r.kind, 'slot_taken');
  assert.equal(r.done, false);
  assert.equal(r.reloadSlots, true);
  assert.equal(r.step, 'time');
});

test('resultMessage: already_booked, invalid, rate_limited, server and network errors', () => {
  const booked = resultMessage({ status: 409, body: { ok: false, error: 'already_booked' } });
  assert.equal(booked.kind, 'already_booked');
  assert.equal(booked.done, false);

  const invalid = resultMessage({ status: 400, body: { ok: false, error: 'invalid', fields: ['email', 'consent'] } });
  assert.equal(invalid.kind, 'invalid');
  assert.deepEqual(invalid.fields, ['email', 'consent']);
  assert.equal(invalid.step, 'details');
  assert.equal(resultMessage({ status: 400, body: { ok: false, error: 'invalid', fields: ['start'] } }).step, 'time');

  assert.equal(resultMessage({ status: 429, body: { ok: false, error: 'rate_limited' } }).kind, 'rate_limited');

  const server = resultMessage({ status: 502, body: { ok: false, error: 'not_sent' } });
  assert.equal(server.kind, 'error');
  assert.equal(server.whatsapp, true);

  const offline = resultMessage(null);
  assert.equal(offline.kind, 'error');
  assert.equal(offline.whatsapp, true);
  for (const r of [booked, invalid, server, offline]) assert.ok(r.text.length > 0);
});

test('apiAvailable is off on a local static preview unless ?api=1', () => {
  assert.equal(apiAvailable({ hostname: 'cargadostrategies.com', search: '' }), true);
  assert.equal(apiAvailable({ hostname: '127.0.0.1', search: '' }), false);
  assert.equal(apiAvailable({ hostname: 'localhost', search: '?review=1' }), false);
  assert.equal(apiAvailable({ hostname: 'localhost', search: '?api=1' }), true);
});
