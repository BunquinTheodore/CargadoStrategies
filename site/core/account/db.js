/**
 * Firestore reads and the few own-profile writes the dashboards make (v2 §8.5).
 * Every list resolves to an array ([] when a read is refused or Firestore is not
 * set up), plus an `error` code on the array so the page can say why it is empty.
 * Admin changes never go through here: they go to /api/admin (admin-api.js).
 *
 *   myPoints(uid) · myBookings(user) · myReferrals(uid)
 *   myPartnerProfile(uid) · savePartnerProfile(uid, fields)
 *   adminLists() → { applications, bookings, users }
 */
import { loadFirebase } from './firebase.js';
import { COLLECTIONS } from './schema.js';

const LIST_LIMIT = 200;

const withError = (rows, error) => Object.assign(rows, { error });
const docsOf = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

async function sdk() {
  const fb = await loadFirebase();
  if (!fb) throw Object.assign(new Error('app/not-configured'), { code: 'app/not-configured' });
  return fb;
}

/** Run a query builder; a refused or failed read becomes [] with the error code. */
async function list(build) {
  try {
    const fb = await sdk();
    return docsOf(await fb.storeSdk.getDocs(build(fb.storeSdk, fb.db)));
  } catch (error) {
    return withError([], error?.code || 'failed');
  }
}

export const myPoints = (uid) => list((s, db) => s.query(s.collection(db, COLLECTIONS.users, uid, COLLECTIONS.points), s.limit(LIST_LIMIT)));

/** Bookings linked to the uid, plus those made with the account's email before signing in. */
export async function myBookings(user) {
  const byField = (field, value) => list((s, db) => s.query(s.collection(db, COLLECTIONS.bookings), s.where(field, '==', value), s.limit(LIST_LIMIT)));
  const [byUid, byEmail] = await Promise.all([byField('uid', user.uid), user.email ? byField('email', user.email.toLowerCase()) : []]);
  const merged = new Map([...byEmail, ...byUid].map((b) => [b.id, b]));
  return withError([...merged.values()], byUid.error && byEmail.error ? byUid.error : undefined);
}

/* The rules let a partner read only documents whose `partner` is their uid, so the query must say so. */
const byPartner = (name) => (uid) => list((s, db) => s.query(s.collection(db, name), s.where('partner', '==', uid), s.limit(LIST_LIMIT)));
export const myReferrals = byPartner(COLLECTIONS.referrals);

export async function myPartnerProfile(uid) {
  try {
    const fb = await sdk();
    const snap = await fb.storeSdk.getDoc(fb.storeSdk.doc(fb.db, COLLECTIONS.partners, uid));
    return snap.exists() ? snap.data() : {};
  } catch (error) {
    return { error: error?.code || 'failed' };
  }
}

/** Partner edits wait in pendingProfile until the owner reviews them (§8.3); nothing is published. */
export async function savePartnerProfile(uid, fields) {
  const fb = await sdk();
  const s = fb.storeSdk;
  await s.updateDoc(s.doc(fb.db, COLLECTIONS.partners, uid), { pendingProfile: { ...fields }, updatedAt: s.serverTimestamp() });
}

/** Everything the admin dashboard lists (admin read access comes from firestore.rules). */
export async function adminLists() {
  const all = (name, order) => list((s, db) => s.query(s.collection(db, name), ...(order ? [s.orderBy(order, 'desc')] : []), s.limit(LIST_LIMIT)));
  const [applications, bookings, users] = await Promise.all([
    all(COLLECTIONS.applications), all(COLLECTIONS.bookings, 'start'), all(COLLECTIONS.users),
  ]);
  return { applications, bookings, users };
}

/** One user's point history (admin). */
export const pointsOf = myPoints;
