/**
 * Who is calling: the verified Firebase ID token from `Authorization: Bearer`,
 * joined with the caller's user doc. Roles live only in Firestore (written by
 * the service account), never in the page.
 */
import { isFirebaseServerConfigured, verifyIdToken, bearerToken, getDoc } from './firebase.js';
import { reply } from './http.js';

/**
 * The caller { uid, email, emailVerified, role }, or null after answering
 * 503 not_configured / 401 unauthorized / 403 forbidden (when `role` is given
 * and the caller's user doc does not hold it).
 */
export async function requireCaller(req, res, role) {
  if (!isFirebaseServerConfigured()) {
    reply(res, 503, { ok: false, error: 'not_configured' });
    return null;
  }
  let caller;
  try {
    caller = await verifyIdToken(bearerToken(req));
  } catch {
    reply(res, 401, { ok: false, error: 'unauthorized' });
    return null;
  }
  let user;
  try {
    user = await getDoc(`users/${caller.uid}`);
  } catch (error) {
    console.error('auth: reading the user failed', error.message);
    reply(res, 502, { ok: false, error: 'store_failed' });
    return null;
  }
  const withRole = { ...caller, role: user?.role || null, user };
  if (role && withRole.role !== role) {
    reply(res, 403, { ok: false, error: 'forbidden' });
    return null;
  }
  return withRole;
}
