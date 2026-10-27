/**
 * GET /api/slots?date=YYYY-MM-DD: the free consultation slots of one Winnipeg day.
 *
 *   → 200 { ok: true, date, timeZone, slots: [{ start, end, label }], live }
 *     · 400 { ok: false, error: 'bad_date' } (malformed, past, or beyond the horizon)
 *     · 429 { ok: false, error: 'rate_limited' }
 *
 * live: true when the owner's Google Calendar free/busy was read; false when Google
 * is not configured or failed, and the slots are computed locally (site/core/lib/slots.js).
 */
import { BOOKING } from '../site/assets/js/config.js';
import { bookableDays, openSlots, zonedDayStart, isDateISO } from '../site/core/lib/slots.js';
import { reply, rejectMethod, queryParam, clientIp, isRateLimited } from './_lib/http.js';
import { isGoogleConfigured, freeBusy } from './_lib/google.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const RATE = Object.freeze({ limit: 120, windowMs: 10 * 60 * 1000 });

/** True when dateISO is a real date between today in Winnipeg and the horizon. */
function isBookableDate(dateISO, now) {
  return isDateISO(dateISO) && bookableDays(now, BOOKING).includes(dateISO);
}

/** The next calendar date after dateISO ('YYYY-MM-DD'). */
const nextDate = (dateISO) => new Date(Date.parse(`${dateISO}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);

/** The busy blocks of the day from Google, or null when Google is off or failed. */
async function busyOf(dateISO) {
  if (!isGoogleConfigured()) return null;
  try {
    const timeMin = zonedDayStart(dateISO, BOOKING.timeZone).toISOString();
    const timeMax = zonedDayStart(nextDate(dateISO), BOOKING.timeZone).toISOString();
    return await freeBusy(timeMin, timeMax);
  } catch (error) {
    console.error('slots: Google free/busy failed', error.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return;
  if (isRateLimited('slots', clientIp(req), RATE)) return reply(res, 429, { ok: false, error: 'rate_limited' });
  const now = new Date();
  const date = queryParam(req, 'date');
  if (!isBookableDate(date, now)) return reply(res, 400, { ok: false, error: 'bad_date' });

  const busy = await busyOf(date);
  const slots = openSlots(date, { now, busy: busy || [] }, BOOKING);
  return reply(res, 200, { ok: true, date, timeZone: BOOKING.timeZone, slots, live: busy !== null });
}
