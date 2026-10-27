/**
 * POST /api/book: books a free 10-minute consultation (spec §6.4).
 *
 *   body: { start, name, email, phone?, service?, note?, consent: true, hp?, idToken? }
 *   → 200 { ok: true, id, meetUrl, start }      event created, visitor invited, both emailed
 *     200 { ok: true, pending: true }           Google off or failed: the owner is emailed the
 *                                               requested time to confirm by hand (nothing is lost)
 *     409 { ok: false, error: 'slot_taken' | 'already_booked' }
 *     400 { ok: false, error: 'invalid', fields: [...] } · 429 rate_limited · 502 not_sent
 *
 * `start` must be an open slot instant from /api/slots (on the 10-minute grid, inside
 * 3:30-9:00 pm Winnipeg, at least 2 h ahead, within 60 days). One live future booking
 * per email. A filled honeypot (`hp`) gets a quiet 200 and nothing is sent.
 */
import { BOOKING } from '../site/assets/js/config.js';
import { bookableDays, openSlots } from '../site/core/lib/slots.js';
import { reply, rejectMethod, readBody, clientIp, isRateLimited } from './_lib/http.js';
import { isGoogleConfigured, freeBusy, createEvent, listEventsByEmail } from './_lib/google.js';
import { sendMail, OWNER_EMAIL, EMAIL_PATTERN, escapeHtml, oneLine } from './_lib/mail.js';
import { recordBooking } from './_lib/store.js';

const RATE = Object.freeze({ limit: 5, windowMs: 10 * 60 * 1000 });
const LIMITS = Object.freeze({ name: 120, email: 254, phone: 40, service: 120, note: 1000, idToken: 4096 });
const PHONE_PATTERN = /^[0-9+().\-\s]{7,}$/;
const ZONE_LABEL = 'Central Time';
const BRAND = 'Cargado Strategies';

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const notifyEmail = () => process.env.BOOKING_NOTIFY_EMAIL || OWNER_EMAIL;

const dateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: BOOKING.timeZone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
});
const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: BOOKING.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
});

/** The open slot that starts at `start`, or null (off the grid, too soon, too far, malformed). */
function slotAt(start, now) {
  const ms = Date.parse(start);
  if (typeof start !== 'string' || Number.isNaN(ms)) return null;
  const date = dayFormat.format(new Date(ms));
  if (!bookableDays(now, BOOKING).includes(date)) return null;
  const iso = new Date(ms).toISOString();
  return openSlots(date, { now }, BOOKING).find((slot) => slot.start === iso) || null;
}

/** The cleaned fields and the names of the bad ones. */
function validate(body, now) {
  const form = {
    name: oneLine(text(body.name)),
    email: text(body.email).toLowerCase(),
    phone: oneLine(text(body.phone)),
    service: oneLine(text(body.service)),
    note: text(body.note),
    idToken: text(body.idToken),
  };
  const slot = slotAt(body.start, now);
  const bad = [];
  if (!slot) bad.push('start');
  if (!form.name || form.name.length > LIMITS.name) bad.push('name');
  if (form.email.length > LIMITS.email || !EMAIL_PATTERN.test(form.email)) bad.push('email');
  if (form.phone && (form.phone.length > LIMITS.phone || !PHONE_PATTERN.test(form.phone))) bad.push('phone');
  if (form.service.length > LIMITS.service) bad.push('service');
  if (form.note.length > LIMITS.note) bad.push('note');
  if (body.consent !== true) bad.push('consent');
  if (form.idToken.length > LIMITS.idToken) bad.push('idToken');
  return { form, slot, bad };
}

const whenOf = (slot) => `${dateFormat.format(new Date(slot.start))} at ${slot.label} ${ZONE_LABEL}`;

function detailRows(form, slot) {
  return [
    ['When', whenOf(slot)],
    ['Length', BOOKING.durationLabel],
    ['Name', form.name],
    ['Email', form.email],
    ['Phone', form.phone],
    ['Service', form.service],
    ['Note', form.note],
  ].filter(([, value]) => value);
}

const textOf = (intro, rows) => [...intro, '', ...rows.map(([label, value]) => `${label}: ${value}`)].join('\n');

function htmlOf(intro, rows) {
  const cells = rows.map(([label, value]) => `<tr><th align="left" valign="top" style="padding:6px 16px 6px 0;white-space:nowrap">${escapeHtml(label)}</th>`
    + `<td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join('');
  const paragraphs = intro.map((line) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`).join('');
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">${paragraphs}<table cellspacing="0" cellpadding="0">${cells}</table></div>`;
}

function mailOf(intro, rows) {
  return { text: textOf(intro, rows), html: htmlOf(intro, rows) };
}

function confirmedMails(form, slot, meetUrl) {
  const link = meetUrl ? `Google Meet: ${meetUrl}` : 'The Google Meet link is in the calendar invitation.';
  const rows = detailRows(form, slot);
  const visitor = mailOf([
    `Hello ${form.name},`,
    `Your ${BOOKING.meetingLabel.toLowerCase()} with ${BRAND} is booked for ${whenOf(slot)}.`,
    link,
    `A calendar invitation is on its way. To change or cancel, reply to this email.`,
  ], rows);
  const owner = mailOf([`New ${BOOKING.meetingLabel.toLowerCase()} booked from the website.`, link], rows);
  return [
    { to: form.email, subject: `Your ${BOOKING.meetingLabel} with ${BRAND}: ${whenOf(slot)}`, replyTo: notifyEmail(), ...visitor },
    { to: notifyEmail(), subject: `New booking: ${form.name}, ${whenOf(slot)}`, replyTo: form.email, ...owner },
  ];
}

function pendingMail(form, slot, reason) {
  const body = mailOf([
    `Booking request from the website, not yet in the calendar (${reason}).`,
    `Please confirm this time with the visitor by email, or offer another one.`,
  ], detailRows(form, slot));
  return { to: notifyEmail(), subject: `Booking request to confirm: ${form.name}, ${whenOf(slot)}`, replyTo: form.email, ...body };
}

/** Sends each email; a failure is logged and does not undo a created booking. */
async function sendAll(mails) {
  const results = await Promise.allSettled(mails.map((mail) => sendMail(mail)));
  results.filter((r) => r.status === 'rejected').forEach((r) => console.error('book: email failed', r.reason?.message));
}

async function record(booking) {
  try {
    await recordBooking(booking);
  } catch (error) {
    console.error('book: record failed', error.message);
  }
}

/** Books through Google: 'slot_taken' | 'already_booked' | { id, meetUrl }. Throws on Google errors. */
async function bookWithGoogle(form, slot, now) {
  const busy = await freeBusy(slot.start, slot.end);
  if (busy.some((b) => Date.parse(b.start) < Date.parse(slot.end) && Date.parse(slot.start) < Date.parse(b.end))) return 'slot_taken';
  const existing = await listEventsByEmail(form.email, now.toISOString());
  if (existing.length) return 'already_booked';
  return createEvent({
    start: slot.start,
    end: slot.end,
    summary: `${BOOKING.meetingLabel}: ${form.name} (${BRAND})`,
    description: textOf([`${BOOKING.meetingLabel} booked from the ${BRAND} website.`], detailRows(form, slot)),
    attendeeEmail: form.email,
  });
}

async function fallback(res, form, slot, reason) {
  try {
    await sendMail(pendingMail(form, slot, reason));
  } catch (error) {
    console.error('book: fallback email failed', error.message);
    return reply(res, 502, { ok: false, error: 'not_sent' });
  }
  await record({ ...form, start: slot.start, end: slot.end, status: 'pending' });
  return reply(res, 200, { ok: true, pending: true });
}

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  if (isRateLimited('book', clientIp(req), RATE)) return reply(res, 429, { ok: false, error: 'rate_limited' });
  const body = readBody(req);
  if (!body) return reply(res, 400, { ok: false, error: 'invalid', fields: [] });
  if (text(body.hp)) return reply(res, 200, { ok: true, pending: true });

  const now = new Date();
  const { form, slot, bad } = validate(body, now);
  if (bad.length) return reply(res, 400, { ok: false, error: 'invalid', fields: bad });
  if (!isGoogleConfigured()) return fallback(res, form, slot, 'Google Calendar is not connected');

  let outcome;
  try {
    outcome = await bookWithGoogle(form, slot, now);
  } catch (error) {
    console.error('book: Google failed', error.message);
    return fallback(res, form, slot, 'Google Calendar could not be reached');
  }
  if (typeof outcome === 'string') return reply(res, 409, { ok: false, error: outcome });

  await sendAll(confirmedMails(form, slot, outcome.meetUrl));
  await record({ ...form, ...outcome, start: slot.start, end: slot.end, status: 'confirmed' });
  return reply(res, 200, { ok: true, id: outcome.id, meetUrl: outcome.meetUrl, start: slot.start });
}
