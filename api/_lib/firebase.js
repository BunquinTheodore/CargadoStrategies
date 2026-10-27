/**
 * Firebase on the server with fetch and node:crypto (no dependency):
 *  - a service-account JWT traded for an OAuth token (Firestore REST, Identity Toolkit);
 *  - Firebase ID-token verification against Google's securetoken x509 certificates;
 *  - small Firestore REST helpers: getDoc, commit, runQuery and the write builders.
 * The service account bypasses firestore.rules, so every caller checks roles first.
 *
 * Env, read per call (all three = configured; docs/setup-firebase.md):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (literal \n allowed)
 */
import crypto from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const IDENTITY_API = 'https://identitytoolkit.googleapis.com/v1';
const FIRESTORE_API = 'https://firestore.googleapis.com/v1';
const SCOPES = 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit';
const JWT_LIFETIME_S = 3600;
const TOKEN_EARLY_MS = 60 * 1000;
const DEFAULT_CERTS_MAX_AGE_S = 3600;
const CLOCK_SKEW_S = 300;
const MAX_UID_LENGTH = 128;

let cachedToken = null;
let cachedCerts = null;

export function isFirebaseServerConfigured() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  return Boolean(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY);
}

/** Forgets the cached access token and certificates (tests, or a changed key). */
export function resetFirebaseCaches() {
  cachedToken = null;
  cachedCerts = null;
}

const projectId = () => process.env.FIREBASE_PROJECT_ID;
const privateKey = () => String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const b64url = (value) => Buffer.from(value).toString('base64url');
const nowSeconds = () => Math.floor(Date.now() / 1000);

/** A thrown Firebase REST error; `status` is Google's status name, `conflict` a failed precondition. */
export class FirebaseError extends Error {
  constructor(what, code, status, message) {
    super(`Firebase ${what} ${code}: ${status || ''} ${message || ''}`.trim());
    this.code = code;
    this.status = status;
    this.conflict = code === 409 || status === 'ALREADY_EXISTS' || status === 'FAILED_PRECONDITION';
    this.notFound = code === 404;
  }
}

async function readJson(response, what) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = Array.isArray(result) ? result[0]?.error : result.error;
    throw new FirebaseError(what, response.status, error?.status, typeof error?.message === 'string' ? error.message : '');
  }
  return result;
}

/* ---------- service account → access token ---------- */

function signedAssertion() {
  const iat = nowSeconds();
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: process.env.FIREBASE_CLIENT_EMAIL, scope: SCOPES, aud: TOKEN_URL, iat, exp: iat + JWT_LIFETIME_S,
  }));
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${claims}`), privateKey()).toString('base64url');
  return `${header}.${claims}.${signature}`;
}

/** An OAuth access token for the service account, cached until a minute before it expires. */
export async function getServiceToken() {
  if (!isFirebaseServerConfigured()) throw new Error('Firebase is not configured');
  const owner = process.env.FIREBASE_CLIENT_EMAIL;
  if (cachedToken && cachedToken.owner === owner && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: signedAssertion() }).toString(),
  });
  const result = await readJson(response, 'token');
  const lifetimeMs = Number(result.expires_in || 0) * 1000;
  cachedToken = { owner, value: result.access_token, expiresAt: Date.now() + Math.max(0, lifetimeMs - TOKEN_EARLY_MS) };
  return result.access_token;
}

/* ---------- ID tokens ---------- */

const maxAgeOf = (response) => Number(/max-age=(\d+)/.exec(response.headers.get('cache-control') || '')?.[1] || DEFAULT_CERTS_MAX_AGE_S);

async function securetokenCerts() {
  if (cachedCerts && Date.now() < cachedCerts.expiresAt) return cachedCerts.certs;
  const response = await fetch(CERTS_URL);
  const certs = await readJson(response, 'certs');
  cachedCerts = { certs, expiresAt: Date.now() + maxAgeOf(response) * 1000 };
  return certs;
}

function decodePart(part) {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

function checkClaims(claims) {
  const now = nowSeconds();
  const project = projectId();
  if (claims.aud !== project) throw new Error('ID token: wrong audience');
  if (claims.iss !== `https://securetoken.google.com/${project}`) throw new Error('ID token: wrong issuer');
  if (typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > MAX_UID_LENGTH) throw new Error('ID token: bad subject');
  if (!(claims.exp > now)) throw new Error('ID token: expired');
  if (!(claims.iat <= now + CLOCK_SKEW_S) || !(claims.auth_time <= now + CLOCK_SKEW_S)) throw new Error('ID token: issued in the future');
}

/**
 * Verifies a Firebase ID token (RS256, Google's current keys, this project):
 * { uid, email, emailVerified, name }. Throws when it is not valid.
 */
export async function verifyIdToken(idToken) {
  if (!projectId()) throw new Error('Firebase is not configured');
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('ID token: malformed');
  let header;
  let claims;
  try {
    header = decodePart(parts[0]);
    claims = decodePart(parts[1]);
  } catch {
    throw new Error('ID token: malformed');
  }
  if (header.alg !== 'RS256') throw new Error('ID token: wrong algorithm');
  const pem = (await securetokenCerts())[header.kid];
  if (!pem) throw new Error('ID token: unknown key');
  const signed = crypto.verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), crypto.createPublicKey(pem), Buffer.from(parts[2], 'base64url'));
  if (!signed) throw new Error('ID token: bad signature');
  checkClaims(claims);
  return {
    uid: claims.sub,
    email: typeof claims.email === 'string' ? claims.email.toLowerCase() : '',
    emailVerified: claims.email_verified === true,
    name: typeof claims.name === 'string' ? claims.name : '',
  };
}

/** The bearer ID token of a request ('' when absent). */
export function bearerToken(req) {
  const header = String(req.headers?.authorization || '');
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
}

/* ---------- Identity Toolkit ---------- */

/** The Auth account with this email: { uid, email, emailVerified } or null. */
export async function lookupAuthByEmail(email) {
  const response = await fetch(`${IDENTITY_API}/projects/${projectId()}/accounts:lookup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getServiceToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: [String(email).toLowerCase()] }),
  });
  const result = await readJson(response, 'accounts.lookup');
  const user = (result.users || [])[0];
  return user ? { uid: user.localId, email: String(user.email || '').toLowerCase(), emailVerified: user.emailVerified === true } : null;
}

/* ---------- Firestore values ---------- */

export function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  return { mapValue: { fields: encodeFields(value) } };
}

export const encodeFields = (data) => Object.fromEntries(Object.entries(data)
  .filter(([, value]) => value !== undefined)
  .map(([key, value]) => [key, encodeValue(value)]));

export function decodeValue(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return null;
}

export const decodeFields = (fields = {}) => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));

/* ---------- Firestore REST ---------- */

const documentsName = () => `projects/${projectId()}/databases/(default)/documents`;
const docName = (path) => `${documentsName()}/${path}`;
const idOf = (name) => name.slice(name.lastIndexOf('/') + 1);

async function firestoreFetch(url, what, body) {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${await getServiceToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401) cachedToken = null;
  return readJson(response, what);
}

/** One document's data, or null when it does not exist. */
export async function getDoc(path) {
  try {
    const doc = await firestoreFetch(`${FIRESTORE_API}/${docName(path)}`, 'get');
    return decodeFields(doc.fields);
  } catch (error) {
    if (error.notFound) return null;
    throw error;
  }
}

/**
 * Runs the writes atomically (all or none). A failed precondition throws a
 * FirebaseError with `conflict: true`.
 */
export function commit(writes) {
  return firestoreFetch(`${FIRESTORE_API}/${documentsName()}:commit`, 'commit', { writes });
}

const OPS = Object.freeze({ '==': 'EQUAL', '<': 'LESS_THAN', '<=': 'LESS_THAN_OR_EQUAL', '>': 'GREATER_THAN', '>=': 'GREATER_THAN_OR_EQUAL' });

function whereOf(filters) {
  const list = filters.map(([field, op, value]) => ({ fieldFilter: { field: { fieldPath: field }, op: OPS[op], value: encodeValue(value) } }));
  if (list.length === 0) return undefined;
  return list.length === 1 ? list[0] : { compositeFilter: { op: 'AND', filters: list } };
}

/**
 * The documents of a top-level collection matching every [field, op, value]
 * filter: [{ id, data }]. Equality filters only need Firestore's automatic
 * single-field indexes; callers filter ranges in code to avoid composite indexes.
 */
export async function runQuery(collection, filters = [], { limit } = {}) {
  const structuredQuery = { from: [{ collectionId: collection }], where: whereOf(filters), ...(limit ? { limit } : {}) };
  const rows = await firestoreFetch(`${FIRESTORE_API}/${documentsName()}:runQuery`, 'runQuery', { structuredQuery });
  return rows.filter((row) => row.document).map((row) => ({ id: idOf(row.document.name), data: decodeFields(row.document.fields) }));
}

/**
 * A write of `data` to `path`. With `merge`, only the given fields change
 * (an update mask); otherwise the document is replaced. `exists` adds a
 * precondition (false = create only, true = must already exist).
 */
export function setWrite(path, data, { merge = false, exists } = {}) {
  return {
    update: { name: docName(path), fields: encodeFields(data) },
    ...(merge ? { updateMask: { fieldPaths: Object.keys(data).filter((key) => data[key] !== undefined) } } : {}),
    ...(exists === undefined ? {} : { currentDocument: { exists } }),
  };
}

/** A write that adds `by` to the integer `field` of `path`. */
export function incrementWrite(path, field, by) {
  return { transform: { document: docName(path), fieldTransforms: [{ fieldPath: field, increment: { integerValue: String(by) } }] } };
}
