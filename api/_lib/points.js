/**
 * The points rules (spec §8.4), pure: 5 points per qualifying event, every
 * kind, each event awarded once. The event id is the point document id
 * (users/{uid}/points/{eventId}), so a second award of the same event is
 * refused by Firestore's exists:false precondition (store.js).
 *
 *   kind 'booking'  refId = booking id; only once its status is 'completed'
 *   kind 'service'  refId = acquisition id (the owner marks it in admin)
 *   kind 'referral' refId = the referred friend's uid (their first consultation)
 */

export const POINTS_PER_EVENT = 5;
export const POINT_KINDS = Object.freeze(['booking', 'service', 'referral']);

const UNSAFE_ID_CHARS = /[^A-Za-z0-9_-]/g;
const MAX_REF_LENGTH = 200;

/** The stable point document id of one event: 'booking-evt123'. Throws on a bad kind or empty ref. */
export function pointEventId(kind, refId) {
  if (!POINT_KINDS.includes(kind)) throw new Error(`Unknown point kind: ${kind}`);
  const ref = String(refId ?? '').replace(UNSAFE_ID_CHARS, '_').slice(0, MAX_REF_LENGTH);
  if (!ref) throw new Error('A point event needs a reference id');
  return `${kind}-${ref}`;
}

const qualifies = (event) => event.kind !== 'booking' || event.status === 'completed';

/** Whether `event` earns points given the event ids already awarded: { award, id, points }. */
export function award(existing, event) {
  const id = pointEventId(event.kind, event.refId);
  return { award: qualifies(event) && !existing.has(id), id, points: POINTS_PER_EVENT };
}
