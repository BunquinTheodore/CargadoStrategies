import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import apply from '../api/partner-apply.js';
import { resetRateLimits } from '../api/_lib/http.js';
import { fakeReq, fakeRes } from './_api-helpers.mjs';
import { setFirebaseEnv, clearFirebaseEnv, fakeFirestore } from './_firestore-fake.mjs';

const FIELDS = Object.freeze({
  'Business name': 'Pro Law',
  'Contact name': 'Pat Pro',
  Email: 'Pat@Example.com',
  Phone: '204 555 0100',
  Service: 'Legal',
});

let store;

beforeEach(() => {
  resetRateLimits();
  setFirebaseEnv();
  store = fakeFirestore();
});

afterEach(() => {
  store?.restore();
  clearFirebaseEnv();
});

async function post(body, ip) {
  const res = fakeRes();
  await apply(fakeReq({ body, ip }), res);
  return res;
}

test('an application is stored as pending and emailed to the owner once', async () => {
  const res = await post({ page: 'partners', fields: { ...FIELDS } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.stored, true);
  const [path] = store.list('partnerApplications/');
  const saved = store.get(path);
  assert.equal(saved.status, 'pending');
  assert.equal(saved.email, 'pat@example.com');
  assert.equal(saved.inviteEmail, 'pat@example.com');
  assert.equal(saved.business, 'Pro Law');
  assert.equal(saved.fields.Phone, '204 555 0100');
  assert.equal(store.emails.length, 1);
  assert.deepEqual(store.emails[0].to, ['malee.holgado@mygreatway.ca']);
  assert.match(store.emails[0].subject, /partner application/i);
  assert.match(store.emails[0].text, /Pro Law/);
});

test('without the service account it still emails the owner', async () => {
  clearFirebaseEnv();
  process.env.RESEND_API_KEY = 're_test';
  const res = await post({ page: 'partners', fields: { ...FIELDS } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.stored, false);
  assert.equal(store.emails.length, 1);
  assert.deepEqual(store.list('partnerApplications/'), []);
});

test('a bad email or a missing business name answers 400; the honeypot stores nothing', async () => {
  assert.equal((await post({ fields: { ...FIELDS, Email: 'nope' } })).statusCode, 400);
  assert.equal((await post({ fields: { ...FIELDS, 'Business name': '' } })).statusCode, 400);
  const bot = await post({ fields: { ...FIELDS, website: 'spam.example' } });
  assert.equal(bot.statusCode, 200);
  assert.deepEqual(store.list('partnerApplications/'), []);
  assert.equal(store.emails.length, 0);
});

test('the sixth application from one IP within 10 minutes answers 429', async () => {
  const ip = '203.0.113.9';
  for (let i = 0; i < 5; i += 1) assert.equal((await post({ fields: { ...FIELDS } }, ip)).statusCode, 200);
  assert.equal((await post({ fields: { ...FIELDS } }, ip)).statusCode, 429);
});
