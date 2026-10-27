/**
 * GET /api/cron/complete-bookings: the daily Vercel cron (vercel.json). Every
 * confirmed booking whose end time has passed becomes 'completed' and earns
 * its points (spec §8.4, §10b). Safe to run twice: awards are keyed by event id.
 *
 *   Authorization: Bearer $CRON_SECRET   (Vercel sends it for crons)
 *   → 200 { ok: true, completed, failed } · 401 unauthorized · 503 not_configured
 */
import crypto from 'node:crypto';
import { reply } from '../_lib/http.js';
import { isFirebaseServerConfigured, bearerToken } from '../_lib/firebase.js';
import { dueBookings, completeBooking } from '../_lib/store.js';

function sameSecret(given, secret) {
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!isFirebaseServerConfigured() || !secret) return reply(res, 503, { ok: false, error: 'not_configured' });
  if (!sameSecret(bearerToken(req), secret)) return reply(res, 401, { ok: false, error: 'unauthorized' });

  let due;
  try {
    due = await dueBookings(new Date());
  } catch (error) {
    console.error('cron: listing bookings failed', error.message);
    return reply(res, 502, { ok: false, error: 'store_failed' });
  }
  let completed = 0;
  let failed = 0;
  for (const { id, data } of due) {
    try {
      await completeBooking(id, data);
      completed += 1;
    } catch (error) {
      failed += 1;
      console.error('cron: completing a booking failed', id, error.message);
    }
  }
  return reply(res, 200, { ok: true, completed, failed });
}
