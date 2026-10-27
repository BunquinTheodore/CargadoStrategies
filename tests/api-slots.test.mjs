import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import slots from '../api/slots.js';
import { resetRateLimits } from '../api/_lib/http.js';
import { resetGoogleToken } from '../api/_lib/google.js';
import { setEnv, fakeReq, fakeRes, stubFetch } from './_api-helpers.mjs';

// 10:00 am in Winnipeg on 2026-10-27: the first two slots (20:30Z, 20:40Z) are after the 2 h lead.
const NOW = new Date('2026-10-27T15:00:00.000Z');
const SLOTS_PER_DAY = 33;

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

async function get(date, { viaQuery = false } = {}) {
  const res = fakeRes();
  const url = date === undefined ? '/api/slots' : `/api/slots?date=${encodeURIComponent(date)}`;
  await slots(fakeReq({ method: 'GET', url, query: viaQuery ? { date } : undefined }), res);
  return res;
}

test('without Google the day is computed locally (live: false)', async () => {
  setEnv({ google: false });
  fetchStub = stubFetch();
  const res = await get('2026-10-28');
  assert.equal(res.statusCode, 200);
  const body = res.json;
  assert.equal(body.ok, true);
  assert.equal(body.date, '2026-10-28');
  assert.equal(body.timeZone, 'America/Winnipeg');
  assert.equal(body.live, false);
  assert.equal(body.slots.length, SLOTS_PER_DAY);
  assert.deepEqual(Object.keys(body.slots[0]).sort(), ['end', 'label', 'start']);
  assert.equal(body.slots[0].label, '3:30 PM');
  assert.equal(fetchStub.calls.length, 0);
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('with Google the busy blocks are removed (live: true)', async () => {
  fetchStub = stubFetch({
    freeBusy: (url, init) => {
      const ask = JSON.parse(init.body);
      assert.equal(ask.timeMin, '2026-10-28T05:00:00.000Z');
      assert.equal(ask.timeMax, '2026-10-29T05:00:00.000Z');
      assert.deepEqual(ask.items, [{ id: 'owner@example.com' }]);
      return [200, { calendars: { 'owner@example.com': { busy: [{ start: '2026-10-28T20:35:00Z', end: '2026-10-28T20:55:00Z' }] } } }];
    },
  });
  const res = await get('2026-10-28', { viaQuery: true });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.live, true);
  assert.equal(res.json.slots.length, SLOTS_PER_DAY - 3);
  assert.equal(res.json.slots[0].start, '2026-10-28T21:00:00.000Z');
});

test('today drops slots inside the 2-hour lead time', async () => {
  mock.timers.setTime(Date.parse('2026-10-27T19:00:00.000Z'));
  setEnv({ google: false });
  const res = await get('2026-10-27');
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.slots[0].start, '2026-10-27T21:00:00.000Z');
});

test('a Google error still answers with local slots (live: false)', async () => {
  fetchStub = stubFetch({ freeBusy: () => [500, { error: { message: 'backend' } }] });
  const res = await get('2026-10-28');
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.live, false);
  assert.equal(res.json.slots.length, SLOTS_PER_DAY);
});

for (const [why, date] of [
  ['missing', undefined],
  ['malformed', '28-10-2026'],
  ['not a real day', '2026-02-30'],
  ['yesterday in Winnipeg', '2026-10-26'],
  ['beyond the 60-day horizon', '2026-12-27'],
]) {
  test(`a date that is ${why} answers 400 bad_date`, async () => {
    setEnv({ google: false });
    const res = await get(date);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.json, { ok: false, error: 'bad_date' });
  });
}

test('the last day of the horizon is still bookable', async () => {
  setEnv({ google: false });
  const res = await get('2026-12-26');
  assert.equal(res.statusCode, 200);
});

test('POST answers 405', async () => {
  const res = fakeRes();
  await slots(fakeReq({ method: 'POST' }), res);
  assert.equal(res.statusCode, 405);
});
