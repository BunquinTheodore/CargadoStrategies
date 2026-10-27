/**
 * Pure view models for the dashboards (v2 §8.3, §8.4, plan Task 12). No DOM, no SDK:
 * the pages pass in what Firestore returned and render the result.
 *
 *   dashboardModel(user, points, bookings, now) → { name, firstName, email, balance, history, upcoming, past, referralCode }
 *   partnerModel(referrals)                     → { referrals }   (recorded values only, no totals)
 *   referralLinks(code, origin)                 → { book, signUp } | null
 *   formatWhen(value) → 'Tue, Oct 27, 3:30 PM Central Time'   toMillis(value) → number | null
 *
 * Dashboard figures: counts and sums of what the lists already hold, never estimates.
 *   clientStats(model)          → { balance, upcoming, completed, referred }
 *   nextBooking(model)          → the soonest upcoming booking that is not cancelled | null
 *   pointsSeries(history)       → [{ at, total }] the running balance, oldest first
 *   partnerStats(model)         → { referrals }
 *   partnerStatus(stored)       → { label, pending }
 *   adminStats(lists, now)      → { pendingApplications, upcomingBookings, clients, partners }
 */
import { BOOKING } from '../../assets/js/config.js';
import { referralCodeFor } from './schema.js';

const POINT_LABELS = Object.freeze({
  booking: 'Consultation completed',
  service: 'Service acquired',
  referral: 'Friend referred',
  adjustment: 'Adjustment',
});
const CENTRAL = 'Central Time';
const WHEN = new Intl.DateTimeFormat('en-US', {   // '3:30 PM', as the booking slots write it
  timeZone: BOOKING.timeZone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
});
const DAY = new Intl.DateTimeFormat('en-CA', { timeZone: BOOKING.timeZone, year: 'numeric', month: 'short', day: 'numeric' });

/** Milliseconds from a Firestore Timestamp, a Date, an ISO string, { seconds } or a number. */
export function toMillis(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

export function formatWhen(value) {
  const ms = toMillis(value);
  return ms === null ? '' : `${WHEN.format(ms)} ${CENTRAL}`;
}

export function formatDay(value) {
  const ms = toMillis(value);
  return ms === null ? '' : DAY.format(ms);
}

const newestFirst = (a, b) => (b.at ?? 0) - (a.at ?? 0);
const firstWord = (text) => String(text || '').trim().split(/\s+/)[0] || '';

function pointRow(doc) {
  const points = Number(doc.points);
  return {
    id: doc.id,
    points: Number.isFinite(points) ? points : 0,
    kind: doc.kind || '',
    label: doc.reason || POINT_LABELS[doc.kind] || POINT_LABELS.adjustment,
    at: toMillis(doc.at ?? doc.createdAt),
    when: formatDay(doc.at ?? doc.createdAt),
  };
}

function bookingRow(doc) {
  const at = toMillis(doc.start);
  return { ...doc, at, when: formatWhen(doc.start), status: doc.status || 'confirmed' };
}

export function dashboardModel(user, points = [], bookings = [], now = new Date()) {
  const history = (points || []).map(pointRow).sort(newestFirst);
  const rows = (bookings || []).map(bookingRow).filter((b) => b.at !== null);
  const t = now.getTime();
  const name = user?.name || user?.displayName || '';
  return {
    name,
    firstName: firstWord(name) || String(user?.email || '').split('@')[0],
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    balance: history.reduce((sum, p) => sum + p.points, 0),
    history,
    upcoming: rows.filter((b) => b.at >= t).sort((a, b) => a.at - b.at),
    past: rows.filter((b) => b.at < t).sort(newestFirst),
    referralCode: user?.profile?.referralCode || (user?.uid ? referralCodeFor(user.uid) : ''),
  };
}

export function referralLinks(code, origin) {
  if (!code) return null;
  const ref = encodeURIComponent(code);
  return { book: `${origin}/contact.html?ref=${ref}`, signUp: `${origin}/account.html?ref=${ref}` };
}

/** Only what the owner recorded: each referral as entered, newest first, no sums. */
export function partnerModel(referrals = []) {
  const refRows = (referrals || []).map((r) => ({ ...r, at: toMillis(r.at ?? r.createdAt), when: formatDay(r.at ?? r.createdAt) })).sort(newestFirst);
  return { referrals: refRows };
}

/* ---------- dashboard figures (counts and sums of the rows above, nothing estimated) ---------- */

const isLive = (b) => b.status !== 'cancelled';
const oldestFirst = (a, b) => (a.at ?? 0) - (b.at ?? 0);

export function clientStats(model) {
  return {
    balance: model.balance,
    upcoming: model.upcoming.filter(isLive).length,
    completed: [...model.upcoming, ...model.past].filter((b) => b.status === 'completed').length,
    referred: model.history.filter((p) => p.kind === 'referral' && p.points > 0).length,
  };
}

export const nextBooking = (model) => model.upcoming.find(isLive) || null;

/** The running balance after each dated point event, oldest first (undated events are left out). */
export function pointsSeries(history = []) {
  let total = 0;
  return history.filter((p) => p.at !== null).sort(oldestFirst).map((p) => {
    total += p.points;
    return { at: p.at, total };
  });
}

export function partnerStats(model) {
  return { referrals: model.referrals.length };
}


/** partners/{uid}: 'approved' reads Approved; edits under review set `pending`. */
export function partnerStatus(stored = {}) {
  const status = String(stored.status || '').trim();
  const label = status ? status[0].toUpperCase() + status.slice(1) : 'Pending';
  return { label, pending: Boolean(stored.pendingProfile) };
}

export function adminStats({ applications = [], bookings = [], users = [] } = {}, now = new Date()) {
  const t = now.getTime();
  return {
    pendingApplications: applications.filter((a) => !a.status || a.status === 'pending').length,
    upcomingBookings: bookings.filter((b) => isLive(b) && (toMillis(b.start) ?? -Infinity) >= t).length,
    clients: users.filter((u) => (u.role || 'client') === 'client').length,
    partners: users.filter((u) => u.role === 'partner').length,
  };
}
