/**
 * The booking picker's pure helpers (spec §6.4): labels, the month calendar, validation, the
 * POST /api/book payload and what each API answer means for the visitor. No DOM,
 * so tests/booking-ui.test.mjs runs them in Node.
 *
 *   formatSlotLabel('2026-10-28T01:50:00Z')  → 'Tuesday, October 27, 8:50 PM Central Time'
 *   resultMessage({ status, body }, start)   → { kind, done, title, text, meetUrl, step, … }
 *
 * Every time is shown in BOOKING.timeZone (Winnipeg) and labelled "Central Time",
 * whatever the visitor's own zone; a chosen slot is sent as its ISO instant.
 */
import { BOOKING, SITE_NAME } from '../../../assets/js/config.js';

export const ZONE_LABEL = 'Central Time';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_DIGITS_MIN = 7;
/** Local static previews (serve.mjs) have no api/; `?api=1` opts in (vercel dev). */
const PREVIEW_HOSTS = new Set(['127.0.0.1', 'localhost']);
const API_PARAM = 'api';

const formatters = new Map();
function formatter(timeZone, options) {
  const key = `${timeZone}|${JSON.stringify(options)}`;
  if (!formatters.has(key)) formatters.set(key, new Intl.DateTimeFormat('en-US', { timeZone, ...options }));
  return formatters.get(key);
}

const partsOf = (date, timeZone, options) =>
  Object.fromEntries(formatter(timeZone, options).formatToParts(date).map(({ type, value }) => [type, value]));

const DATE_PARTS = { weekday: 'long', month: 'long', day: 'numeric' };
const TIME_PARTS = { hour: 'numeric', minute: '2-digit', hour12: true };

/** 'Tuesday, October 27, 3:30 PM Central Time' for an ISO instant; '' when malformed. */
export function formatSlotLabel(startISO, timeZone = BOOKING.timeZone) {
  const ms = Date.parse(startISO);
  if (Number.isNaN(ms)) return '';
  const date = new Date(ms);
  const d = partsOf(date, timeZone, DATE_PARTS);
  const t = partsOf(date, timeZone, TIME_PARTS);
  // Built from parts: some ICU versions put a narrow no-break space before PM.
  return `${d.weekday}, ${d.month} ${d.day}, ${t.hour}:${t.minute} ${t.dayPeriod.toUpperCase()} ${ZONE_LABEL}`;
}

/** The chip text of a calendar date 'YYYY-MM-DD' (read in UTC, so the date never shifts). */
export function dayChip(dateISO) {
  const date = new Date(`${dateISO}T12:00:00Z`);
  const short = partsOf(date, 'UTC', { weekday: 'short', month: 'short', day: 'numeric' });
  const long = partsOf(date, 'UTC', DATE_PARTS);
  return { weekday: short.weekday, day: short.day, month: short.month, full: `${long.weekday}, ${long.month} ${long.day}` };
}

/* ---------- the month calendar (step 1) ---------- */

const DAY_MS = 24 * 60 * 60 * 1000;
const NOON_MS = 12 * 60 * 60 * 1000;
const WEEK_DAYS = 7;
const MONTHS_IN_YEAR = 12;
const MONTH_KEY = /^(\d{4})-(\d{2})$/;

/** The weekday header, Sunday first (the Canadian wall-calendar order). */
export const WEEKDAYS = Object.freeze([
  ['Sun', 'Sunday'], ['Mon', 'Monday'], ['Tue', 'Tuesday'], ['Wed', 'Wednesday'],
  ['Thu', 'Thursday'], ['Fri', 'Friday'], ['Sat', 'Saturday'],
].map(([short, long]) => Object.freeze({ short, long })));

const isoOf = (ms) => new Date(ms).toISOString().slice(0, 10);

/** 'YYYY-MM' of a calendar date 'YYYY-MM-DD'. */
export const monthKeyOf = (dateISO) => String(dateISO).slice(0, 7);

/** The month `n` months after 'YYYY-MM' (n may be negative). */
export function shiftMonth(key, n) {
  const [year, month] = String(key).split('-').map(Number);
  return isoOf(Date.UTC(year, month - 1 + n, 1)).slice(0, 7);
}

/** The calendar date `n` days after 'YYYY-MM-DD'. Counted in UTC, so a DST change never skips or repeats a date. */
export const shiftDate = (dateISO, n) => isoOf(Date.parse(`${dateISO}T00:00:00Z`) + n * DAY_MS);

/** `dateISO` held inside [first, last] ('YYYY-MM-DD' strings compare in date order). */
export const clampDate = (dateISO, first, last) => (dateISO < first ? first : dateISO > last ? last : dateISO);

/** 'Sunday, November 1, 2026': the accessible name of a calendar day. */
export function dayLabel(dateISO) {
  const p = partsOf(new Date(`${dateISO}T12:00:00Z`), 'UTC', { ...DATE_PARTS, year: 'numeric' });
  return `${p.weekday}, ${p.month} ${p.day}, ${p.year}`;
}

/**
 * One month as a wall calendar: { key, label: 'November 2026', weeks }. Each week
 * is 7 cells, Sunday first; a cell is { date, day }, or null outside the month.
 * Only the rows the month needs (4 to 6). null for a malformed key.
 */
export function monthGrid(key) {
  const m = MONTH_KEY.exec(String(key ?? ''));
  const month = m ? Number(m[2]) - 1 : -1;
  if (month < 0 || month >= MONTHS_IN_YEAR) return null;
  const year = Number(m[1]);
  const first = Date.UTC(year, month, 1);
  const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const days = Array.from({ length }, (_, i) => ({ date: isoOf(first + i * DAY_MS), day: i + 1 }));
  const cells = [...Array(new Date(first).getUTCDay()).fill(null), ...days];
  while (cells.length % WEEK_DAYS) cells.push(null);
  const weeks = Array.from({ length: cells.length / WEEK_DAYS }, (_, w) => cells.slice(w * WEEK_DAYS, (w + 1) * WEEK_DAYS));
  const p = partsOf(new Date(first + NOON_MS), 'UTC', { month: 'long', year: 'numeric' });
  return { key: m[0], label: `${p.month} ${p.year}`, weeks };
}

const clean = (value) => String(value ?? '').trim();
const isChecked = (value) => value === true || value === 'on';

/** [{ id, message }] for every answer that needs another look, in form order. */
export function validateBooking(values) {
  const errors = [];
  const phoneDigits = clean(values.phone).replace(/\D/g, '');
  if (!clean(values.start)) errors.push({ id: 'start', message: 'Choose a time.' });
  if (!clean(values.name)) errors.push({ id: 'name', message: 'Please add your name.' });
  if (!EMAIL_PATTERN.test(clean(values.email))) errors.push({ id: 'email', message: 'Add your email, so the meeting link can reach you.' });
  if (clean(values.phone) && phoneDigits.length < PHONE_DIGITS_MIN) errors.push({ id: 'phone', message: 'This number looks too short.' });
  if (!isChecked(values.consent)) errors.push({ id: 'consent', message: 'Please tick the box, so Cargado Strategies can use these details to book the call.' });
  return errors;
}

/** The POST /api/book body: trimmed, empty optionals left out, hp and idToken only when given. */
export function buildBookingPayload(values) {
  const payload = {
    start: clean(values.start),
    name: clean(values.name),
    email: clean(values.email),
  };
  for (const key of ['phone', 'service', 'note']) {
    if (clean(values[key])) payload[key] = clean(values[key]);
  }
  payload.consent = isChecked(values.consent);
  if (clean(values.website)) payload.hp = clean(values.website);
  if (clean(values.idToken)) payload.idToken = clean(values.idToken);
  return payload;
}

const TRY_WHATSAPP = `Please try again, or message ${SITE_NAME} on WhatsApp.`;
const STEP_OF_FIELD = { start: 'time' };

function failure(kind, text, extra = {}) {
  return { kind, done: false, title: '', text, meetUrl: '', step: '', reloadSlots: false, whatsapp: false, fields: [], ...extra };
}

/**
 * What an /api/book answer means: `response` is { status, body } (null when the
 * request never got an answer); `start` is the slot the visitor chose.
 */
export function resultMessage(response, start = '') {
  const body = response?.body || {};
  if (body.ok && body.pending) {
    const when = formatSlotLabel(start);
    return {
      ...failure('pending', `${SITE_NAME} will confirm ${when ? `${when} ` : 'the time '}by email, with the meeting link.`),
      done: true, title: 'Request Received',
    };
  }
  if (body.ok) {
    return {
      ...failure('confirmed', `${formatSlotLabel(body.start || start)}. The Google Meet link is below and in the confirmation email.`),
      done: true, title: 'You Are Booked', meetUrl: typeof body.meetUrl === 'string' ? body.meetUrl : '',
    };
  }
  switch (body.error) {
    case 'slot_taken':
      return failure('slot_taken', 'That time was just taken. Please choose another one.', { step: 'time', reloadSlots: true });
    case 'already_booked':
      return failure('already_booked', `This email already has a consultation booked. To change it, reply to the confirmation email from ${SITE_NAME}.`);
    case 'invalid': {
      const fields = Array.isArray(body.fields) ? body.fields : [];
      const step = fields.map((f) => STEP_OF_FIELD[f]).find(Boolean) || 'details';
      return failure('invalid', 'Some answers need a second look.', { fields, step, reloadSlots: fields.includes('start') });
    }
    case 'rate_limited':
      return failure('rate_limited', `Too many tries in a short time. Please wait a few minutes, or message ${SITE_NAME} on WhatsApp.`, { whatsapp: true });
    default:
      return failure('error', `The booking could not be sent. ${TRY_WHATSAPP}`, { whatsapp: true });
  }
}

/** False on a local static preview (no api/), unless the URL carries ?api=1. */
export function apiAvailable({ hostname = '', search = '' } = {}) {
  if (new URLSearchParams(search).get(API_PARAM) === '1') return true;
  return !PREVIEW_HOSTS.has(hostname);
}
