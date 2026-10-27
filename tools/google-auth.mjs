/**
 * One-time Google authorisation for the booking calendar: prints the refresh
 * token that api/_lib/google.js uses (GOOGLE_REFRESH_TOKEN). Run it on your own
 * computer, signed in to the Google account whose calendar takes the bookings.
 *
 *   node tools/google-auth.mjs --client-id=… --client-secret=…
 *   (or set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in the env or .env.local)
 *
 * Uses the OAuth "Desktop app" loopback flow with PKCE: a tiny server on
 * 127.0.0.1 (random port) receives Google's redirect, the code is exchanged for
 * tokens, and the refresh token is printed once. Nothing is written to disk.
 * See docs/setup-google-calendar.md.
 */
import http from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
];
const HOST = '127.0.0.1';
const TIMEOUT_MS = 5 * 60 * 1000;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const out = (line = '') => process.stdout.write(`${line}\n`);
const fail = (message) => { process.stderr.write(`google-auth: ${message}\n`); process.exit(1); };
const base64url = (buffer) => buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** KEY=value pairs from .env.local, if it exists (quotes stripped). */
function readEnvLocal() {
  try {
    return Object.fromEntries(readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)
      .map((line) => /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line))
      .filter(Boolean)
      .map(([, key, value]) => [key, value.replace(/^(['"])(.*)\1$/, '$2')]));
  } catch {
    return {};
  }
}

function credentials() {
  const args = Object.fromEntries(process.argv.slice(2)
    .map((arg) => /^--([a-z-]+)=(.*)$/.exec(arg)).filter(Boolean).map(([, key, value]) => [key, value]));
  const local = readEnvLocal();
  const clientId = args['client-id'] || process.env.GOOGLE_CLIENT_ID || local.GOOGLE_CLIENT_ID;
  const clientSecret = args['client-secret'] || process.env.GOOGLE_CLIENT_SECRET || local.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) fail('give --client-id=… and --client-secret=… (from the OAuth client you created).');
  return { clientId, clientSecret };
}

function authLink({ clientId, redirectUri, state, challenge }) {
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `${AUTH_URL}?${query}`;
}

async function exchange({ clientId, clientSecret, code, redirectUri, verifier }) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status} ${result.error || ''} ${result.error_description || ''}`.trim());
  if (!result.refresh_token) throw new Error('Google sent no refresh token. Remove the app at myaccount.google.com/permissions and run this again.');
  return result.refresh_token;
}

function page(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><meta charset="utf-8"><title>Cargado Strategies</title><p style="font:16px sans-serif">${message}</p>`);
}

function main() {
  const { clientId, clientSecret } = credentials();
  const state = base64url(randomBytes(16));
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  let redirectUri = '';

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${HOST}`);
    if (url.pathname !== '/callback') return page(res, 404, 'Not found.');
    if (url.searchParams.get('state') !== state) return page(res, 400, 'State mismatch. Run the tool again.');
    const code = url.searchParams.get('code');
    if (!code) return page(res, 400, `Google said: ${url.searchParams.get('error') || 'no code'}. Run the tool again.`);
    try {
      const refreshToken = await exchange({ clientId, clientSecret, code, redirectUri, verifier });
      out('\nGOOGLE_REFRESH_TOKEN (keep it secret; paste it into Vercel, never into the repo):\n');
      out(refreshToken);
      out();
      res.on('finish', () => process.exit(0));
      page(res, 200, 'Done. You can close this tab and go back to the terminal.');
    } catch (error) {
      res.on('finish', () => fail(`token exchange failed: ${error.message}`));
      page(res, 500, 'The token exchange failed. See the terminal.');
    }
  });

  server.listen(0, HOST, () => {
    redirectUri = `http://${HOST}:${server.address().port}/callback`;
    out('Open this link in the browser where you are signed in to the booking Google account:\n');
    out(authLink({ clientId, redirectUri, state, challenge }));
    out('\nWaiting for Google (5 minutes)…');
  });
  setTimeout(() => fail('timed out waiting for the browser.'), TIMEOUT_MS).unref();
}

main();
