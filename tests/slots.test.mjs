import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zonedDayStart, daySlots, bookableDays, openSlots, isDateISO } from '../site/core/lib/slots.js';
import { BOOKING } from '../site/assets/js/config.js';

const TEN_MIN = 10 * 60 * 1000;
// 3:30 PM to 8:50 PM inclusive in 10-minute steps: (1260 - 930) / 10 = 33 (the plan's "34" miscounts).
const SLOTS_PER_DAY = 33;

function assertEvenSteps(slots) {
  for (let i = 1; i < slots.length; i += 1) {
    assert.equal(Date.parse(slots[i].start) - Date.parse(slots[i - 1].start), TEN_MIN, `step at ${i}`);
  }
  for (const s of slots) assert.equal(Date.parse(s.end) - Date.parse(s.start), TEN_MIN);
}

test('zonedDayStart gives the instant of Winnipeg midnight (CDT and CST)', () => {
  assert.equal(zonedDayStart('2026-10-27', 'America/Winnipeg').toISOString(), '2026-10-27T05:00:00.000Z');
  assert.equal(zonedDayStart('2026-11-02', 'America/Winnipeg').toISOString(), '2026-11-02T06:00:00.000Z');
});

test('daySlots on a normal CDT day: 33 slots, 3:30 PM to 8:50 PM', () => {
  const slots = daySlots('2026-10-27');
  assert.equal(slots.length, SLOTS_PER_DAY);
  assert.equal(slots[0].label, '3:30 PM');
  assert.equal(slots.at(-1).label, '8:50 PM');
  assert.equal(slots[0].start, '2026-10-27T20:30:00.000Z');
  assert.equal(slots[0].end, '2026-10-27T20:40:00.000Z');
  assert.equal(slots.at(-1).end, '2026-10-28T02:00:00.000Z');
  assertEvenSteps(slots);
});

test('daySlots after the fall change uses CST (UTC-6)', () => {
  assert.equal(daySlots('2026-11-02')[0].start, '2026-11-02T21:30:00.000Z');
});

test('daySlots on both daylight-saving change days stays 15:30-20:50 local', () => {
  const fall = daySlots('2026-11-01');
  assert.equal(fall.length, SLOTS_PER_DAY);
  assert.equal(fall[0].start, '2026-11-01T21:30:00.000Z');
  assert.equal(fall[0].label, '3:30 PM');
  assertEvenSteps(fall);

  const spring = daySlots('2027-03-14');
  assert.equal(spring.length, SLOTS_PER_DAY);
  assert.equal(spring[0].start, '2027-03-14T20:30:00.000Z');
  assert.equal(spring.at(-1).label, '8:50 PM');
  assertEvenSteps(spring);
});

test('daySlots rejects malformed dates', () => {
  assert.deepEqual(daySlots('2026-02-30'), []);
  assert.deepEqual(daySlots('nope'), []);
  assert.equal(isDateISO('2026-10-27'), true);
  assert.equal(isDateISO('2026-13-01'), false);
});

test('bookableDays starts at today in Winnipeg, not in UTC', () => {
  const days = bookableDays(new Date('2026-10-28T04:30:00Z'));
  assert.equal(days[0], '2026-10-27');
  assert.equal(days[1], '2026-10-28');
  assert.equal(days.length, BOOKING.horizonDays + 1);
  assert.equal(days.at(-1), '2026-12-26');
  assert.equal(new Set(days).size, days.length);
});

test('openSlots drops slots inside the 2 h lead time', () => {
  const slots = openSlots('2026-10-27', { now: new Date('2026-10-27T19:00:00Z'), busy: [] });
  assert.equal(slots[0].start, '2026-10-27T21:00:00.000Z');
  assert.ok(slots.every((s) => Date.parse(s.start) >= Date.parse('2026-10-27T21:00:00Z')));
  assert.equal(slots.length, SLOTS_PER_DAY - 3);
});

test('openSlots drops slots that overlap a busy block', () => {
  const busy = [{ start: '2026-10-27T20:35:00Z', end: '2026-10-27T20:55:00Z' }];
  const slots = openSlots('2026-10-27', { now: new Date('2026-10-27T12:00:00Z'), busy });
  const starts = slots.map((s) => s.start);
  for (const gone of ['2026-10-27T20:30:00.000Z', '2026-10-27T20:40:00.000Z', '2026-10-27T20:50:00.000Z']) {
    assert.ok(!starts.includes(gone), gone);
  }
  assert.equal(starts[0], '2026-10-27T21:00:00.000Z');
  assert.equal(slots.length, SLOTS_PER_DAY - 3);
});

test('openSlots keeps slots that only touch a busy block edge', () => {
  const busy = [{ start: '2026-10-27T20:40:00Z', end: '2026-10-27T20:50:00Z' }];
  const slots = openSlots('2026-10-27', { now: new Date('2026-10-27T12:00:00Z'), busy });
  assert.equal(slots.length, SLOTS_PER_DAY - 1);
  assert.equal(slots[1].start, '2026-10-27T20:50:00.000Z');
});
