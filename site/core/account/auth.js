/**
 * Sign-in for accounts (v2 §8.1, plan Task 12). Every call loads Firebase lazily
 * (firebase.js) and rejects with an error whose `code` friendlyError() turns into
 * a message for the page; nothing here writes to the console.
 *
 *   signInEmail(email, password)                      → user
 *   signUpEmail(name, email, password, referralCode?)  → user (verification email sent)
 *   signInGoogle(referralCode?)                        → user | null (window closed)
 *   signOut(), resetPassword(email), getIdToken() → string | ''
 *   onUser(cb) → unsubscribe; cb(user | null), user = { uid, email, emailVerified,
 *                displayName, name, role, profile }   (role 'client' until the server sets one)
 *
 * A first sign-in creates users/{uid} as firestore.rules allows: role 'client',
 * points 0, name, email, phone, referralCode, referredBy. Later the page changes
 * only name and phone; role and points belong to the server. If
 * Firestore is not set up yet, sign-in still works and the profile waits.
 */
import { loadFirebase } from './firebase.js';
import { COLLECTIONS, normalizeReferralCode, referralCodeFor } from './schema.js';

export const SETUP_MESSAGE = 'Sign-in is being set up. Please try again soon.';
const DEFAULT_ROLE = 'client';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

const MESSAGES = Object.freeze({
  'auth/operation-not-allowed': SETUP_MESSAGE,
  'auth/configuration-not-found': SETUP_MESSAGE,
  'auth/unauthorized-domain': SETUP_MESSAGE,
  'auth/admin-restricted-operation': SETUP_MESSAGE,
  'app/not-configured': SETUP_MESSAGE,
  'auth/invalid-credential': 'That email and password do not match. Please try again.',
  'auth/wrong-password': 'That email and password do not match. Please try again.',
  'auth/user-not-found': 'That email and password do not match. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/missing-password': 'Please enter your password.',
  'auth/email-already-in-use': 'That email already has an account. Log in instead, or reset the password.',
  'auth/weak-password': 'Please choose a password of at least 6 characters.',
  'auth/too-many-requests': 'Too many tries. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'No connection. Please check your connection and try again.',
  'auth/popup-blocked': 'The Google window was blocked. Please allow pop-ups for this site and try again.',
  'auth/user-disabled': 'This account is turned off. Please contact Cargado Strategies.',
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': '',
  'permission-denied': 'This account cannot see that yet. Please contact Cargado Strategies.',
  unavailable: 'No connection. Please check your connection and try again.',
});

/** The message the page shows for a failed call ('' when there is nothing to say). */
export function friendlyError(error) {
  const code = String(error?.code || '').replace(/^firestore\//, '');
  return Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : GENERIC_MESSAGE;
}

const codeError = (code) => Object.assign(new Error(code), { code });

async function ready() {
  const fb = await loadFirebase();
  if (!fb) throw codeError('app/not-configured');
  return fb;
}

/* ---------- profile (users/{uid}) ---------- */

const userRef = (fb, uid) => fb.storeSdk.doc(fb.db, COLLECTIONS.users, uid);

/** The stored profile, or null when it is missing or Firestore cannot be read yet. */
async function readProfile(fb, uid) {
  try {
    const snap = await fb.storeSdk.getDoc(userRef(fb, uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;   // Firestore not enabled, offline or rules not deployed: the page still works
  }
}

/** Create the profile on first sign-in (never role or points). Returns the profile or null. */
async function ensureProfile(fb, user, { name = '', referralCode = '' } = {}) {
  const existing = await readProfile(fb, user.uid);
  if (existing) return existing;
  const own = referralCodeFor(user.uid);
  const referredBy = normalizeReferralCode(referralCode);
  /* firestore.rules validNewUser: a client with 0 points, the token's email in lower case. */
  const profile = {
    role: DEFAULT_ROLE,
    points: 0,
    name: String(name || user.displayName || '').trim(),
    email: String(user.email || '').toLowerCase(),
    phone: '',
    referralCode: own,
    ...(referredBy && referredBy !== own ? { referredBy } : {}),
  };
  try {
    await fb.storeSdk.setDoc(userRef(fb, user.uid), { ...profile, createdAt: fb.storeSdk.serverTimestamp() });
    return profile;
  } catch {
    return null;
  }
}

function toUser(user, profile) {
  const role = profile?.role || DEFAULT_ROLE;
  return {
    uid: user.uid,
    email: user.email || '',
    emailVerified: !!user.emailVerified,
    displayName: profile?.name || user.displayName || '',
    name: profile?.name || user.displayName || '',
    role,
    profile,
  };
}

/* ---------- sign-in ---------- */

export async function signInEmail(email, password) {
  const fb = await ready();
  const { user } = await fb.authSdk.signInWithEmailAndPassword(fb.auth, String(email).trim(), password);
  return toUser(user, await ensureProfile(fb, user));
}

export async function signUpEmail(name, email, password, referralCode = '') {
  const fb = await ready();
  const { user } = await fb.authSdk.createUserWithEmailAndPassword(fb.auth, String(email).trim(), password);
  const displayName = String(name || '').trim();
  try {
    if (displayName) await fb.authSdk.updateProfile(user, { displayName });
    await fb.authSdk.sendEmailVerification(user);   // a verified email is what a partner role needs (§10b)
  } catch {
    /* the account exists; the name and verification email can follow later */
  }
  return toUser(user, await ensureProfile(fb, user, { name: displayName, referralCode }));
}

/** Google in a pop-up; resolves null when the visitor closes the window. */
export async function signInGoogle(referralCode = '') {
  const fb = await ready();
  try {
    const { user } = await fb.authSdk.signInWithPopup(fb.auth, new fb.authSdk.GoogleAuthProvider());
    return toUser(user, await ensureProfile(fb, user, { referralCode }));
  } catch (error) {
    if (friendlyError(error) === '') return null;
    throw error;
  }
}

export async function signOut() {
  const fb = await loadFirebase();
  if (fb) await fb.authSdk.signOut(fb.auth);
}

export async function resetPassword(email) {
  const fb = await ready();
  await fb.authSdk.sendPasswordResetEmail(fb.auth, String(email).trim());
}

/** The signed-in user's ID token for /api calls, or '' when signed out or unconfigured. */
export async function getIdToken() {
  const fb = await loadFirebase();
  const user = fb?.auth.currentUser;
  return user ? user.getIdToken() : '';
}

/** Save the editable profile fields (name, phone) of the signed-in user. */
export async function saveProfile(fields) {
  const fb = await ready();
  const user = fb.auth.currentUser;
  if (!user) throw codeError('auth/user-not-found');
  const name = String(fields.name ?? '').trim();
  const phone = String(fields.phone ?? '').trim();
  await fb.storeSdk.updateDoc(userRef(fb, user.uid), { name, phone, updatedAt: fb.storeSdk.serverTimestamp() });
  if (name && name !== user.displayName) await fb.authSdk.updateProfile(user, { displayName: name }).catch(() => {});
  return { name, phone };
}

/**
 * Follow the auth state. The callback gets null when signed out, unconfigured or
 * when the SDK cannot load, so callers always hear once.
 */
export function onUser(cb) {
  let stop = () => {};
  let live = true;
  loadFirebase()
    .then((fb) => {
      if (!live) return;
      if (!fb) { cb(null); return; }
      stop = fb.authSdk.onAuthStateChanged(fb.auth, async (user) => {
        if (!live) return;
        cb(user ? toUser(user, await readProfile(fb, user.uid)) : null);
      }, () => { if (live) cb(null); });
    })
    .catch(() => { if (live) cb(null); });
  return () => { live = false; stop(); };
}
