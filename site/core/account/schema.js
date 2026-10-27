/**
 * Firestore names shared by the app pages (v2 §8.5). The server side (api/_lib,
 * firestore.rules) uses the same names; change them together.
 *
 *   users/{uid}                 role, name, email, phone, points, referralCode, referredBy, createdAt
 *   users/{uid}/points/{event}  points, kind (booking|service|referral|adjustment), refId, reason, at
 *   bookings/{id}               start, end, status, uid, email, name, service, meetUrl, createdAt
 *   partnerApplications/{id}    email, business, contact, fields, status, createdAt
 *   partners/{uid}              status, business, contact, email, pendingProfile, updatedAt
 *   referrals/{id}              partner, client, clientName, clientEmail, note, status, at
 *
 * The page never writes role or points: the server and the rules own them.
 */
export const COLLECTIONS = Object.freeze({
  users: 'users',
  points: 'points',
  bookings: 'bookings',
  applications: 'partnerApplications',
  partners: 'partners',
  referrals: 'referrals',
});

export const ROLES = Object.freeze(['client', 'partner', 'admin']);
export const BOOKING_STATUSES = Object.freeze(['pending', 'confirmed', 'cancelled', 'no-show', 'completed']);   // = api/_lib/store.js

const CODE_LENGTH = 8;
const CODE_PATTERN = /^[A-Z0-9]{4,16}$/;

/** A client's referral code: the first letters and digits of their uid, upper case. */
export const referralCodeFor = (uid) => String(uid || '').replace(/[^a-z0-9]/gi, '').slice(0, CODE_LENGTH).toUpperCase();

/** A referral code read from a link (?ref=), or '' when it is not a clean code. */
export function normalizeReferralCode(raw) {
  const code = String(raw ?? '').trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : '';
}
