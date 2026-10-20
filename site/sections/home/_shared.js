/**
 * Home helpers shared by more than one section: the phone query and the J-cut
 * lead (api.md §4.3) that #one-message, #situations and #find append to their
 * cut timelines. Every tween is positioned by label (never by absolute time,
 * so the same code runs in cut and touch-cut mode).
 */

import { irisFades } from '../../core/engine/iris.js';

export const PHONE_QUERY = '(max-width: 759px)';
const PAN_IN_S = 0.08; // the incoming pan's fade, as the engine's (cut.js PAN_IN_S), moved to the lead
const LEAD_IN_S = 0.12; // H3/H5: the in group starts this long before 'in' on a J-cut
const ACTION = '[data-group="action"]'; // keeps its slot: its fine print would straddle the circle's edge

export const qsa = (root, sel) => Array.from(root.querySelectorAll(sel));
export const isPhone = () => window.matchMedia(PHONE_QUERY).matches;

/**
 * W2 is a J-cut: the strikes arrive from the 'iris' label, while the outgoing scene leaves, so
 * no seek frame falls between the two scenes (§10.2, T5). The pan's fade moves with them. A swap
 * (tier C, reduced motion) changes the field just before 'in', so there they keep the 'in' slot.
 */
export function leadLabel(tl, el, { fieldChange, origin }) {
  const { iris, in: inAt } = tl.labels;
  if (iris === undefined || inAt === undefined || iris >= inAt || (fieldChange && irisFades(undefined, origin))) return 'in';
  const pan = el.querySelector('.scene__pan');
  if (pan) {
    tl.getTweensOf(pan).forEach((tween) => tween.kill());
    tl.fromTo(pan, { opacity: 0, y: 0 }, { opacity: 1, y: 0, duration: PAN_IN_S, ease: 'none' }, 'iris');
  }
  return 'iris';
}

/**
 * H3 and H5 as J-cuts too: when the pan leads from 'iris', the engine's in group (all but the
 * action group) moves up by LEAD_IN_S, so the rows and the headline are drawn inside the opening
 * circle (or over the leaving scene on a same-field cut) instead of on a bare field. Swaps keep
 * the engine's slots.
 */
export function leadInGroup(tl, el, event) {
  if (leadLabel(tl, el, event) !== 'iris') return;
  const pan = el.querySelector('.scene__pan');
  const from = tl.labels.in - 0.001;
  tl.getChildren(false, true, false).forEach((tween) => {
    const targets = tween.targets();
    if (tween.startTime() < from || targets.includes(pan) || !targets.every((t) => t instanceof Node && el.contains(t) && !t.closest?.(ACTION))) return;
    tween.startTime(tween.startTime() - LEAD_IN_S);
  });
}
