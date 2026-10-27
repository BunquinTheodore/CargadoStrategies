/**
 * POST /api/admin/{action}: the owner's dashboard actions (spec §8.3). Every
 * call needs `Authorization: Bearer <Firebase ID token>` of a user whose doc
 * holds role 'admin' (tools/make-admin.mjs sets it).
 *
 *   approve-partner    { applicationId, email? }    → { ok, status: 'approved'|'invited', uid? }
 *   decline-partner    { applicationId }            → { ok }
 *   mark-acquired      { uid, service, note?, id? } → { ok, id, awarded }   (5 points, once per id)
 *   adjust-points      { uid, points, reason }      → { ok, id }            (logged in the history)
 *   assign-referral    { partnerUid, clientUid?, clientName?, clientEmail?, note? } → { ok, id }
 *   set-booking-status { bookingId, status }        → { ok, status }        (completed awards points)
 *
 *   errors: 400 invalid · 401 unauthorized · 403 forbidden · 404 not_found ·
 *           405 · 502 store_failed · 503 not_configured
 */
import { reply, rejectMethod, readBody, queryParam } from '../_lib/http.js';
import { requireCaller } from '../_lib/auth.js';
import { getDoc, commit, setWrite } from '../_lib/firebase.js';
import { EMAIL_PATTERN } from '../_lib/mail.js';
import { getUserByEmail, awardPoints, adjustPoints, completeBooking, newId, BOOKING_STATUSES } from '../_lib/store.js';
import { grantPartner, invitePartner, siteOrigin } from '../_lib/partners.js';

const MAX_TEXT = 1000;
const MAX_ADJUST = 1000;
const DOC_ID = /^[A-Za-z0-9_-]{1,128}$/;

const text = (value, max = MAX_TEXT) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const isId = (value) => typeof value === 'string' && DOC_ID.test(value);
const invalid = (fields) => [400, { ok: false, error: 'invalid', fields }];
const notFound = () => [404, { ok: false, error: 'not_found' }];

async function approvePartner(body, _caller, req) {
  if (!isId(body.applicationId)) return invalid(['applicationId']);
  const override = text(body.email).toLowerCase();
  if (override && !EMAIL_PATTERN.test(override)) return invalid(['email']);
  const application = await getDoc(`partnerApplications/${body.applicationId}`);
  if (!application) return notFound();
  const email = override || application.inviteEmail || application.email;
  const account = await getUserByEmail(email);
  if (account?.emailVerified) {
    await grantPartner(account.uid, email, body.applicationId, application);
    return [200, { ok: true, status: 'approved', uid: account.uid }];
  }
  await invitePartner(body.applicationId, application, email, siteOrigin(req));
  return [200, { ok: true, status: 'invited' }];
}

async function declinePartner(body) {
  if (!isId(body.applicationId)) return invalid(['applicationId']);
  if (!(await getDoc(`partnerApplications/${body.applicationId}`))) return notFound();
  await commit([setWrite(`partnerApplications/${body.applicationId}`, { status: 'declined', declinedAt: new Date() }, { merge: true })]);
  return [200, { ok: true }];
}

async function markAcquired(body, caller) {
  const service = text(body.service, 120);
  const bad = [!isId(body.uid) && 'uid', !service && 'service', body.id !== undefined && !isId(body.id) && 'id'].filter(Boolean);
  if (bad.length) return invalid(bad);
  if (!(await getDoc(`users/${body.uid}`))) return notFound();
  const id = body.id || newId();
  await commit([setWrite(`acquisitions/${id}`, { uid: body.uid, service, note: text(body.note), by: caller.uid, at: new Date() })]);
  const awarded = await awardPoints(body.uid, { kind: 'service', refId: id }, { service });
  return [200, { ok: true, id, awarded }];
}

async function adjust(body, caller) {
  const reason = text(body.reason, 300);
  const points = body.points;
  const okPoints = Number.isInteger(points) && points !== 0 && Math.abs(points) <= MAX_ADJUST;
  const bad = [!isId(body.uid) && 'uid', !okPoints && 'points', !reason && 'reason'].filter(Boolean);
  if (bad.length) return invalid(bad);
  if (!(await getDoc(`users/${body.uid}`))) return notFound();
  const id = await adjustPoints(body.uid, points, reason, caller.uid);
  return [200, { ok: true, id }];
}

const isPartner = async (uid) => isId(uid) && (await getDoc(`users/${uid}`))?.role === 'partner';

async function assignReferral(body, caller) {
  const clientName = text(body.clientName, 120);
  const clientEmail = text(body.clientEmail, 254).toLowerCase();
  const bad = [
    !(await isPartner(body.partnerUid)) && 'partnerUid',
    body.clientUid !== undefined && !isId(body.clientUid) && 'clientUid',
    !body.clientUid && !clientName && !clientEmail && 'client',
    clientEmail && !EMAIL_PATTERN.test(clientEmail) && 'clientEmail',
  ].filter(Boolean);
  if (bad.length) return invalid(bad);
  const id = newId();
  await commit([setWrite(`referrals/${id}`, {
    partner: body.partnerUid, client: body.clientUid || null, clientName, clientEmail,
    note: text(body.note), status: 'assigned', by: caller.uid, at: new Date(),
  }, { exists: false })]);
  return [200, { ok: true, id }];
}

async function setBookingStatus(body) {
  const bad = [!isId(body.bookingId) && 'bookingId', !BOOKING_STATUSES.includes(body.status) && 'status'].filter(Boolean);
  if (bad.length) return invalid(bad);
  const booking = await getDoc(`bookings/${body.bookingId}`);
  if (!booking) return notFound();
  if (body.status === 'completed') await completeBooking(body.bookingId, booking);
  else await commit([setWrite(`bookings/${body.bookingId}`, { status: body.status, statusAt: new Date() }, { merge: true })]);
  return [200, { ok: true, status: body.status }];
}

const ACTIONS = Object.freeze({
  'approve-partner': approvePartner,
  'decline-partner': declinePartner,
  'mark-acquired': markAcquired,
  'adjust-points': adjust,
  'assign-referral': assignReferral,
  'set-booking-status': setBookingStatus,
});

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  const name = queryParam(req, 'action');
  if (!Object.hasOwn(ACTIONS, name)) return reply(res, 404, { ok: false, error: 'unknown_action' });
  const caller = await requireCaller(req, res, 'admin');
  if (!caller) return;
  const body = readBody(req);
  if (!body) return reply(res, 400, { ok: false, error: 'invalid', fields: [] });
  try {
    const [status, payload] = await ACTIONS[name](body, caller, req);
    return reply(res, status, payload);
  } catch (error) {
    console.error('admin: action failed', name, error.message);
    return reply(res, 502, { ok: false, error: 'store_failed' });
  }
}
