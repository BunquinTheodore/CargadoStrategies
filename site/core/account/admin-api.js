/**
 * The admin dashboard's calls to /api/admin/<action> (plan Task 11 serves them).
 *
 *   const result = await adminAction('adjust-points', { uid, points, reason });
 *   // → { ok, httpStatus, error?, ...the server's reply }  never throws for HTTP or network failures
 *   adminMessage(result) → the line the page shows
 *
 * The server checks the ID token and the admin role; the page only sends it.
 */
import { getIdToken } from './auth.js';

export const ADMIN_ACTIONS = Object.freeze([
  'approve-partner', 'decline-partner', 'mark-acquired', 'adjust-points',
  'assign-referral', 'set-booking-status',
]);
const ENDPOINT = '/api/admin/';

const MESSAGES = Object.freeze({
  not_configured: 'Admin tools are being set up: the server is not connected to Firebase yet.',
  unauthorized: 'Please log in again.',
  forbidden: 'This account is not an admin.',
  invalid: 'Please check the fields and try again.',
  not_found: 'That record no longer exists. Reload the page.',
  network: 'No connection. Please check your connection and try again.',
});
const INVITED = 'Approved. No account uses that email yet, so an invitation to sign up was sent.';
const BY_STATUS = Object.freeze({ 401: 'unauthorized', 403: 'forbidden', 404: 'not_found', 503: 'not_configured' });

export async function adminAction(action, body, { getToken = getIdToken, fetchImpl = (...args) => fetch(...args) } = {}) {
  if (!ADMIN_ACTIONS.includes(action)) throw new Error(`unknown admin action: ${action}`);
  const token = await getToken();
  let res;
  try {
    res = await fetchImpl(`${ENDPOINT}${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    return { ok: false, httpStatus: 0, error: 'network' };
  }
  const data = await res.json().catch(() => ({}));
  const ok = res.ok && data.ok !== false;
  return { ...data, ok, httpStatus: res.status, error: ok ? undefined : data.error || BY_STATUS[res.status] || 'failed' };
}

export function adminMessage(result) {
  if (result?.ok) return result.status === 'invited' ? INVITED : 'Saved.';
  const key = result?.error || BY_STATUS[result?.httpStatus];
  return MESSAGES[key] || 'That did not work. Please try again.';
}
