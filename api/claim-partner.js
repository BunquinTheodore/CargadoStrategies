/**
 * POST /api/claim-partner: called by the account pages after each sign-in.
 * When the owner approved a partner application before its applicant had an
 * account, the partner role is granted here, on first sign-in, but only to a
 * verified email equal to the invite address (spec §10b).
 *
 *   Authorization: Bearer <Firebase ID token>
 *   → 200 { ok: true, role }   role: the caller's role after the check, or null when no user doc
 *     401 unauthorized · 502 store_failed · 503 not_configured
 */
import { reply, rejectMethod } from './_lib/http.js';
import { requireCaller } from './_lib/auth.js';
import { grantPartner, invitedApplicationFor } from './_lib/partners.js';

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  const caller = await requireCaller(req, res);
  if (!caller) return;
  if (caller.role === 'partner' || caller.role === 'admin' || !caller.emailVerified || !caller.email) {
    return reply(res, 200, { ok: true, role: caller.role });
  }
  try {
    const invited = await invitedApplicationFor(caller.email);
    if (!invited) return reply(res, 200, { ok: true, role: caller.role });
    await grantPartner(caller.uid, caller.email, invited.id, invited.data);
    return reply(res, 200, { ok: true, role: 'partner' });
  } catch (error) {
    console.error('claim-partner: failed', error.message);
    return reply(res, 502, { ok: false, error: 'store_failed' });
  }
}
