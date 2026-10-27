/**
 * An in-memory Firestore, Identity Toolkit and Resend behind a stubbed global
 * fetch (no network), plus a test RSA key that signs both the service account
 * JWT and Firebase ID tokens. It speaks the REST shapes api/_lib/firebase.js
 * uses: documents GET, :commit (update + mask + precondition, transform
 * increment) and :runQuery (field filters, AND, limit).
 */
import crypto from 'node:crypto';
import { resetFirebaseCaches } from '../api/_lib/firebase.js';

export const PROJECT_ID = 'test-project';
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PRIVATE_PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });
const PUBLIC_PEM = publicKey.export({ type: 'spki', format: 'pem' });
const KID = 'test-kid';
const ENV_KEYS = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'RESEND_API_KEY', 'RESEND_FROM'];

export function setFirebaseEnv() {
  resetFirebaseCaches();
  Object.assign(process.env, {
    FIREBASE_PROJECT_ID: PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: 'svc@test-project.iam.gserviceaccount.com',
    // Vercel stores the key with literal \n; the lib must turn them back into newlines.
    FIREBASE_PRIVATE_KEY: PRIVATE_PEM.replace(/\n/g, '\\n'),
    RESEND_API_KEY: 're_test',
  });
}

export function clearFirebaseEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
  resetFirebaseCaches();
}

const b64url = (value) => Buffer.from(value).toString('base64url');

/** A Firebase ID token signed with the test key. */
export function signIdToken({ uid, email, emailVerified = true, aud = PROJECT_ID, expiresIn = 3600 }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', kid: KID, typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: `https://securetoken.google.com/${aud}`, aud, sub: uid, user_id: uid, auth_time: now - 10,
    iat: now - 10, exp: now + expiresIn, email, email_verified: emailVerified,
  }));
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), privateKey).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

/* ---------- value encoding (the REST wire format) ---------- */

function decodeValue(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  throw new Error(`fake firestore: unknown value ${JSON.stringify(value)}`);
}
const decodeFields = (fields) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]));

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  return { mapValue: { fields: encodeFields(value) } };
}
const encodeFields = (data) => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encodeValue(v)]));

/* ---------- the fake ---------- */

const json = (status, payload) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
const failure = (code, status) => json(code, { error: { code, status, message: status } });

/**
 * Installs the fake. `authUsers` lists Identity Toolkit accounts:
 * [{ localId, email, emailVerified }]. Returns { put, get, list, emails, calls, restore }.
 */
export function fakeFirestore({ authUsers = [] } = {}) {
  const docs = new Map();
  const emails = [];
  const calls = [];
  const original = globalThis.fetch;
  const docsRoot = `projects/${PROJECT_ID}/databases/(default)/documents/`;
  const pathOf = (name) => name.slice(name.indexOf(docsRoot) + docsRoot.length);

  const toDoc = (path) => ({ name: `${docsRoot}${path}`, fields: encodeFields(docs.get(path)), updateTime: '2026-10-25T00:00:00Z' });

  function precondition(write) {
    const name = write.update?.name || write.transform?.document;
    const exists = docs.has(pathOf(name));
    const want = write.currentDocument?.exists;
    if (want === false && exists) return failure(409, 'ALREADY_EXISTS');
    if (want === true && !exists) return failure(404, 'NOT_FOUND');
    return null;
  }

  function apply(write) {
    if (write.update) {
      const path = pathOf(write.update.name);
      const data = decodeFields(write.update.fields || {});
      const mask = write.updateMask?.fieldPaths;
      const base = mask ? { ...(docs.get(path) || {}) } : {};
      if (mask) mask.forEach((field) => { if (field in data) base[field] = data[field]; else delete base[field]; });
      docs.set(path, mask ? base : data);
    }
    if (write.transform) {
      const path = pathOf(write.transform.document);
      const next = { ...(docs.get(path) || {}) };
      for (const t of write.transform.fieldTransforms) next[t.fieldPath] = (next[t.fieldPath] || 0) + Number(t.increment.integerValue);
      docs.set(path, next);
    }
  }

  function commit(body) {
    for (const write of body.writes) {
      const problem = precondition(write);
      if (problem) return problem;
    }
    body.writes.forEach(apply);
    return json(200, { writeResults: body.writes.map(() => ({})) });
  }

  const OPS = {
    EQUAL: (a, b) => a === b,
    LESS_THAN: (a, b) => a < b,
    LESS_THAN_OR_EQUAL: (a, b) => a <= b,
  };
  const matches = (data, filter) => {
    if (!filter) return true;
    if (filter.compositeFilter) return filter.compositeFilter.filters.every((f) => matches(data, f));
    const { field, op, value } = filter.fieldFilter;
    return OPS[op](data[field.fieldPath], decodeValue(value));
  };

  function runQuery(url, body) {
    const parent = pathOf(`${url.split(':runQuery')[0]}/`).replace(/\/$/, '');
    const q = body.structuredQuery;
    const collection = q.from[0].collectionId;
    const prefix = parent ? `${parent}/${collection}/` : `${collection}/`;
    const found = [...docs.keys()]
      .filter((path) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .filter((path) => matches(docs.get(path), q.where))
      .slice(0, q.limit || Infinity);
    return json(200, found.length ? found.map((path) => ({ document: toDoc(path), readTime: 'x' })) : [{ readTime: 'x' }]);
  }

  function lookup(body) {
    const wanted = (body.email || []).map((e) => e.toLowerCase());
    const users = authUsers.filter((u) => wanted.includes(u.email.toLowerCase()));
    return json(200, users.length ? { users } : {});
  }

  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    const method = init.method || 'GET';
    const body = init.body && typeof init.body === 'string' && init.body.startsWith('{') ? JSON.parse(init.body) : null;
    calls.push({ url, method, body });
    if (url.startsWith('https://oauth2.googleapis.com/token')) return json(200, { access_token: 'ya29.fb', expires_in: 3600 });
    if (url.includes('securetoken@system.gserviceaccount.com')) {
      return new Response(JSON.stringify({ [KID]: PUBLIC_PEM }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
    }
    if (url.includes('identitytoolkit.googleapis.com') && url.endsWith('accounts:lookup')) return lookup(body);
    if (url.startsWith('https://api.resend.com/')) {
      emails.push(body);
      return json(200, { id: `mail${emails.length}` });
    }
    if (url.includes('firestore.googleapis.com')) {
      if (url.endsWith(':commit')) return commit(body);
      if (url.endsWith(':runQuery')) return runQuery(url, body);
      if (method === 'GET') {
        const path = pathOf(url);
        return docs.has(path) ? json(200, toDoc(path)) : failure(404, 'NOT_FOUND');
      }
    }
    throw new Error(`fake firestore: unexpected fetch ${method} ${url}`);
  };

  return {
    put: (path, data) => docs.set(path, structuredClone(data)),
    get: (path) => (docs.has(path) ? structuredClone(docs.get(path)) : undefined),
    list: (prefix) => [...docs.keys()].filter((path) => path.startsWith(prefix)).sort(),
    emails,
    calls,
    restore: () => { globalThis.fetch = original; },
  };
}
