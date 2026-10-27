/**
 * Firestore records for accounts and points (spec §8.5), through the service
 * account in firebase.js. Every function is a quiet no-op (null) while the
 * server is not configured, so api/book.js and the forms keep working.
 *
 *   users/{uid}                 role, name, email, phone, points, referralCode, referredBy (a referralCode)
 *   users/{uid}/points/{eventId} kind, refId, points, reason, at   (eventId from points.js)
 *   bookings/{id}               start, end, name, email, phone, service, note, meetUrl, status, uid, createdAt
 *   partnerApplications/{id}    email, inviteEmail, business, contact, fields, status, partnerUid
 *   partners/{uid}              status, applicationId, business, contact, email, pendingProfile
 *   acquisitions/{id}           uid, service, note, by, at
 *   referrals/{id}   written by the admin API
 *
 * Booking status: pending (Google off, the owner confirms by hand) · confirmed ·
 * cancelled · no-show · completed. Points only on completed (spec §10b).
 */
import crypto from 'node:crypto';
import {
  isFirebaseServerConfigured, verifyIdToken, lookupAuthByEmail,
  getDoc, commit, runQuery, setWrite, incrementWrite,
} from './firebase.js';
import { award } from './points.js';

export const BOOKING_STATUSES = Object.freeze(['pending', 'confirmed', 'cancelled', 'no-show', 'completed']);
const MAX_OPEN_BOOKINGS = 500;
const REASONS = Object.freeze({
  booking: 'Consultation completed',
  service: 'Service acquired',
  referral: 'A friend you referred completed their first consultation',
});

export const newId = () => crypto.randomUUID().replace(/-/g, '');

async function uidOfToken(idToken) {
  if (!idToken) return null;
  try {
    return (await verifyIdToken(idToken)).uid;
  } catch {
    return null;
  }
}

/**
 * Stores one booking from api/book.js: { id?, start, end, name, email, phone,
 * service, note, meetUrl?, status, idToken? }. A valid ID token links it to
 * that account (for points); the token itself is never stored. → the booking id.
 */
export async function recordBooking(booking) {
  if (!isFirebaseServerConfigured()) return null;
  const id = booking.id || `req${newId()}`;
  const { idToken, ...fields } = booking;
  const record = {
    start: fields.start,
    end: fields.end,
    name: fields.name || '',
    email: String(fields.email || '').toLowerCase(),
    phone: fields.phone || '',
    service: fields.service || '',
    note: fields.note || '',
    meetUrl: fields.meetUrl || '',
    status: BOOKING_STATUSES.includes(fields.status) ? fields.status : 'pending',
    uid: await uidOfToken(idToken),
    createdAt: new Date(),
  };
  await commit([setWrite(`bookings/${id}`, record, { exists: false })]);
  return id;
}

/** The verified-or-not Auth account with this email, joined with its user doc: { uid, emailVerified, ...doc } or null. */
export async function getUserByEmail(email) {
  if (!isFirebaseServerConfigured()) return null;
  const account = await lookupAuthByEmail(email);
  if (!account) return null;
  const doc = await getDoc(`users/${account.uid}`);
  return { ...(doc || {}), uid: account.uid, email: account.email, emailVerified: account.emailVerified };
}

/** The uid whose referralCode is `code`, or null. */
export async function uidByReferralCode(code) {
  if (typeof code !== 'string' || !code) return null;
  const [row] = await runQuery('users', [['referralCode', '==', code]], { limit: 1 });
  return row?.id || null;
}

/**
 * Awards one point event to `uid`: the point doc and the balance in one commit,
 * with exists:false on the point doc, so a repeat is refused. → true when awarded.
 */
export async function awardPoints(uid, event, extra = {}) {
  const result = award(new Set(), event);
  if (!result.award) return false;
  const entry = { kind: event.kind, refId: String(event.refId), points: result.points, reason: REASONS[event.kind], at: new Date(), ...extra };
  try {
    await commit([
      setWrite(`users/${uid}/points/${result.id}`, entry, { exists: false }),
      incrementWrite(`users/${uid}`, 'points', result.points),
    ]);
    return true;
  } catch (error) {
    if (error.conflict) return false;
    throw error;
  }
}

/** A manual adjustment by the owner, logged in the points history with its reason. */
export async function adjustPoints(uid, points, reason, by) {
  const id = `adjust-${newId()}`;
  await commit([
    setWrite(`users/${uid}/points/${id}`, { kind: 'adjustment', refId: id, points, reason, by, at: new Date() }, { exists: false }),
    incrementWrite(`users/${uid}`, 'points', points),
  ]);
  return id;
}

/** The referral award for `friendUid`'s first completed consultation, when someone referred them. */
async function awardReferral(friendUid) {
  const friend = await getDoc(`users/${friendUid}`);
  const referrer = await uidByReferralCode(friend?.referredBy);
  if (!referrer || referrer === friendUid) return false;
  return awardPoints(referrer, { kind: 'referral', refId: friendUid });
}

/**
 * Completes one booking: awards first (idempotent), then sets the status, so a
 * crash in between is repaired by the next run without a second award.
 */
export async function completeBooking(id, booking) {
  if (booking.uid) {
    await awardPoints(booking.uid, { kind: 'booking', refId: id, status: 'completed' }, { bookingId: id });
    await awardReferral(booking.uid);
  }
  await commit([setWrite(`bookings/${id}`, { status: 'completed', completedAt: new Date() }, { merge: true, exists: true })]);
}

/** Confirmed bookings whose end time has passed: [{ id, data }]. */
export async function dueBookings(now = new Date()) {
  const confirmed = await runQuery('bookings', [['status', '==', 'confirmed']], { limit: MAX_OPEN_BOOKINGS });
  return confirmed.filter(({ data }) => Date.parse(data.end) <= now.getTime());
}
