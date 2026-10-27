/**
 * Makes one account the admin (the owner), once (docs/setup-firebase.md).
 * The account must exist (sign up on account.html first) and its email must
 * be verified. Uses the service account, from a key file or the env vars.
 *
 *   node tools/make-admin.mjs owner@example.com --key=secrets/service-account.json
 *   node tools/make-admin.mjs owner@example.com          (FIREBASE_* env vars already set)
 *
 * Keep the key file out of the repo: secrets/ is gitignored.
 */
import { readFileSync } from 'node:fs';
import { isFirebaseServerConfigured, lookupAuthByEmail, getDoc, commit, setWrite } from '../api/_lib/firebase.js';

const out = (line = '') => process.stdout.write(`${line}\n`);
const fail = (line) => {
  process.stderr.write(`${line}\n`);
  process.exit(1);
};

function loadKey(path) {
  const key = JSON.parse(readFileSync(path, 'utf8'));
  process.env.FIREBASE_PROJECT_ID = key.project_id;
  process.env.FIREBASE_CLIENT_EMAIL = key.client_email;
  process.env.FIREBASE_PRIVATE_KEY = key.private_key;
}

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((arg) => !arg.startsWith('--'))?.trim().toLowerCase();
  const keyPath = args.find((arg) => arg.startsWith('--key='))?.slice('--key='.length);
  if (!email) fail('Usage: node tools/make-admin.mjs owner@example.com [--key=secrets/service-account.json]');
  if (keyPath) loadKey(keyPath);
  if (!isFirebaseServerConfigured()) fail('Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or pass --key=<service account JSON>.');

  const account = await lookupAuthByEmail(email);
  if (!account) fail(`No account uses ${email}. Sign up on account.html first, then run this again.`);
  if (!account.emailVerified) fail(`${email} is not verified yet. Open the verification email (or use "Continue with Google"), then run this again.`);

  const user = await getDoc(`users/${account.uid}`);
  const write = user
    ? setWrite(`users/${account.uid}`, { role: 'admin' }, { merge: true })
    : setWrite(`users/${account.uid}`, { role: 'admin', email, name: '', points: 0, createdAt: new Date() }, { exists: false });
  await commit([write]);
  out(`${email} (uid ${account.uid}) is now the admin. Sign out and in again on account.html to open admin.html.`);
}

main().catch((error) => fail(`make-admin failed: ${error.message}`));
