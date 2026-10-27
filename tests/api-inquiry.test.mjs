import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import inquiry from '../api/inquiry.js';
import { setEnv, fakeReq, fakeRes, stubFetch } from './_api-helpers.mjs';

// Pins api/inquiry.js behaviour across its move onto api/_lib/ (recipient, statuses, messages).
const VALID = Object.freeze({
  kind: 'inquiry',
  page: 'services',
  fields: { Name: 'Ana', Email: 'ana@example.com', Service: 'Business Strategy', website: '' },
});

let fetchStub;
beforeEach(() => setEnv({ google: false }));
afterEach(() => { fetchStub?.restore(); fetchStub = null; });

async function post(body) {
  const res = fakeRes();
  await inquiry(fakeReq({ body }), res);
  return res;
}

test('a valid inquiry is emailed to the owner with the visitor as reply-to', async () => {
  fetchStub = stubFetch();
  const res = await post({ ...VALID });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json, { ok: true, id: 'mail0' });
  const [mail] = fetchStub.emails;
  assert.deepEqual(mail.to, ['malee.holgado@mygreatway.ca']);
  assert.equal(mail.reply_to, 'ana@example.com');
  assert.equal(mail.subject, 'New website inquiry — Business Strategy');
  assert.match(mail.text, /Name: Ana/);
  assert.doesNotMatch(mail.text, /website:/);
});

test('a bot (website field) gets 200 with a null id and nothing is sent', async () => {
  fetchStub = stubFetch();
  const res = await post({ ...VALID, fields: { ...VALID.fields, website: 'x' } });
  assert.deepEqual(res.json, { ok: true, id: null });
  assert.equal(fetchStub.calls.length, 0);
});

test('bad payloads keep their 400 messages', async () => {
  assert.deepEqual((await post({ ...VALID, kind: 'nope' })).json, { ok: false, error: 'Unknown kind.' });
  assert.equal((await post('not json')).statusCode, 400);
});

test('a missing key answers 500 and a Resend failure 502', async () => {
  setEnv({ google: false, mail: false });
  assert.deepEqual((await post({ ...VALID })).json, { ok: false, error: 'Email is not configured.' });
  setEnv({ google: false });
  fetchStub = stubFetch({ resend: () => [422, { name: 'validation_error', message: 'bad' }] });
  const res = await post({ ...VALID });
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.json, { ok: false, error: 'The email could not be sent.' });
});

test('GET answers 405 with the original message', async () => {
  const res = fakeRes();
  await inquiry(fakeReq({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.json, { ok: false, error: 'Method not allowed.' });
});
