/**
 * Booking slot calculation (spec §6.4). Pure functions, shared by the Contact
 * page and the api/ functions, so the browser and the server offer the same slots.
 *
 *   daySlots('2026-10-27')[0]  → { start: '2026-10-27T20:30:00.000Z', end: '…20:40…', label: '3:30 PM' }
 *   bookableDays(now)          → ['2026-10-27', …] (today in Winnipeg, then horizonDays more)
 *   openSlots(date, { now, busy })  → daySlots minus the lead time and busy blocks
 *
 * Times are local wall-clock minutes in BOOKING.timeZone, turned into instants
 * with Intl.DateTimeFormat offsets only, so daylight-saving days keep the same
 * 3:30-8:50 pm slots. Dates are 'YYYY-MM-DD' strings in that time zone.
 */
import { BOOKING } from '../../assets/js/config.js';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DATE_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

const formatters = new Map();

function partsFormatter(timeZone) {
  if (!formatters.has(timeZone)) {
    formatters.set(timeZone, new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }
  return formatters.get(timeZone);
}

/** The wall-clock fields of an instant in a time zone, as numbers. */
function zonedParts(ms, timeZone) {
  const out = {};
  for (const { type, value } of partsFormatter(timeZone).formatToParts(new Date(ms))) {
    if (type !== 'literal') out[type] = Number(value);
  }
  return out;
}

/** The zone's offset from UTC at an instant, in ms (Winnipeg CDT = -5 h). */
function offsetAt(ms, timeZone) {
  const p = zonedParts(ms, timeZone);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(ms / 1000) * 1000;
}

/** The instant of a local wall-clock time (ms since the epoch); two passes settle a DST change. */
function zonedInstant(wallMs, timeZone) {
  const guess = wallMs - offsetAt(wallMs, timeZone);
  return wallMs - offsetAt(guess, timeZone);
}

function parseDate(dateISO) {
  const m = DATE_ISO.exec(String(dateISO ?? ''));
  if (!m) return null;
  const [year, month, day] = m.slice(1).map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const back = new Date(utc);
  if (back.getUTCMonth() !== month - 1 || back.getUTCDate() !== day) return null;
  return utc;
}

/** True for a real calendar date written 'YYYY-MM-DD'. */
export const isDateISO = (dateISO) => parseDate(dateISO) !== null;

/** The instant of local midnight on dateISO in timeZone. */
export function zonedDayStart(dateISO, timeZone = BOOKING.timeZone) {
  const utc = parseDate(dateISO);
  if (utc === null) throw new RangeError(`Bad date: ${dateISO}`);
  return new Date(zonedInstant(utc, timeZone));
}

/** '3:30 PM' from minutes after midnight. */
function slotLabel(minutes) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = String(minutes % 60).padStart(2, '0');
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

/** Every slot of a day, booked or not; [] for a malformed date. */
export function daySlots(dateISO, booking = BOOKING) {
  const utc = parseDate(dateISO);
  if (utc === null) return [];
  const { timeZone, startMinutes, endMinutes, slotMinutes } = booking;
  const slots = [];
  for (let m = startMinutes; m + slotMinutes <= endMinutes; m += slotMinutes) {
    const start = zonedInstant(utc + m * MINUTE_MS, timeZone);
    slots.push({
      start: new Date(start).toISOString(),
      end: new Date(start + slotMinutes * MINUTE_MS).toISOString(),
      label: slotLabel(m),
    });
  }
  return slots;
}

/** Today's date in timeZone, 'YYYY-MM-DD'. */
function zonedToday(now, timeZone) {
  const p = zonedParts(now.getTime(), timeZone);
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).toISOString().slice(0, 10);
}

/** The bookable dates: today in the booking time zone, then horizonDays more (inclusive). */
export function bookableDays(now = new Date(), booking = BOOKING) {
  const first = parseDate(zonedToday(now, booking.timeZone));
  return Array.from({ length: booking.horizonDays + 1 },
    (_, i) => new Date(first + i * DAY_MS).toISOString().slice(0, 10));
}

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

/** The slots of a day that start after now + leadHours and touch no busy block. */
export function openSlots(dateISO, { now = new Date(), busy = [] } = {}, booking = BOOKING) {
  const earliest = now.getTime() + booking.leadHours * HOUR_MS;
  const blocks = busy.map((b) => [Date.parse(b.start), Date.parse(b.end)]);
  return daySlots(dateISO, booking).filter((slot) => {
    const start = Date.parse(slot.start);
    const end = Date.parse(slot.end);
    if (start < earliest) return false;
    return !blocks.some(([bs, be]) => overlaps(start, end, bs, be));
  });
}
