/**
 * The cut timeline (DIRECTION §4.4, api.md §4.2), internal to the engine.
 *
 *   'out'      0      the outgoing .scene__pan leaves as one group (y −40 · dir in 0.32 s)
 *   'iris'     0.10   the iris opens the next field (field change) or the field holds
 *   'in'       0.30   the incoming pan shows (0.08 s fade from 0.25) and its in group plays (film-reveals.js)
 *   'stop'            the full stop pops after its heading's last word
 *   'settled'  0.95   end of the engine part: the input lock and the queued step key off it
 *
 * Two headlines never share a slot. On a same-field cut the out group's
 * opacity is gone by 'in' (power2.in), before the incoming words rise. On a
 * circle cut it lasts until 0.45 s (J-cut, so a seek frame is never empty)
 * and the incoming scene is clipped to the circle: new content shows only
 * inside the new field, and the circle (above the outgoing scene) covers the
 * old. A scene without a headline (a mark, a seal) may opt in to the same
 * 0.45 s hold on a same-field cut with `data-out-hold`. On a swap (tier C,
 * reduced motion) 'iris' and 'in' both sit at 0.12 s: the out group is gone by then, the field switches hard (no blend of
 * two opaque fields) and the in group starts on the new field at once, so no
 * seek frame falls in an empty gap; 'settled' stays at 0.95.
 *
 * Touch-cut builds the same labels with 'out', 'iris' and 'in' at 0: the
 * iris has already run at 35% visibility (touch-cut.js) and the outgoing
 * section is scrolling away, so it only fades. The first landing on load
 * uses the same compact layout (there is nothing to take out). The timeline
 * is returned paused; the engine hands it to the 'cut' listeners first, then
 * plays it.
 */
import { CUT, DUR, EASE } from './motion-tokens.js';
import { irisTo, irisFades, unclip } from './iris.js';
import { addInGroup } from './film-reveals.js';

const PAN_IN_S = 0.08; // the incoming pan's own short fade; the in group carries the entrance
const PAN_LEAD_S = 0.05; // the pan fade starts this long before 'in', so the in group plays at full opacity
const TOUCH_OUT_S = 0.2;
const OUT_HOLD_S = 0.45; // a circle cut's out group (or a [data-out-hold] scene's) lasts past 'in' (J-cut)
const SWAP_IN_S = 0.12; // a swap cut's 'iris' and 'in': the out group is gone, the field switches and the in group starts at once

/**
 * from / to: { el, pan, items } (from is null on the first landing).
 * origin: { x, y } viewport px. withIris: nest the iris (cut mode on a field
 * change; touch-cut only for programmatic cuts). onHalf: called when the
 * header field changes (50% of the circle, or the swap).
 */
export function buildCut({ from, to, dir = 1, origin, fieldChange, withIris = fieldChange, toField, tier, mode, onHalf }) {
  const { gsap } = window;
  const touch = mode === 'touch-cut';
  const compact = touch || !from; // touch-cut and the first landing: nothing to swap, the in group starts at once
  const swap = withIris && irisFades(tier, origin);
  const circle = withIris && !swap;
  const at = compact ? { out: 0, iris: 0, in: 0 }
    : swap ? { out: CUT.out, iris: SWAP_IN_S, in: SWAP_IN_S }
      : { out: CUT.out, iris: CUT.iris, in: CUT.in };
  const settled = compact ? CUT.settled - CUT.in : CUT.settled;
  const tl = gsap.timeline({ paused: true });
  tl.addLabel('out', at.out).addLabel('iris', at.iris).addLabel('in', at.in);
  const swapAt = at.in;
  if (from?.pan) {
    // No computed-style read in a cut: y comes from GSAP's transform cache
    // (film.js sets every pan once at start), opacity from the inline style GSAP writes.
    const y = Number(gsap.getProperty(from.pan, 'y')) || 0;
    const inline = parseFloat(from.pan.style.opacity);
    const opacity = Number.isFinite(inline) ? inline : 1;
    if (touch) {
      tl.fromTo(from.pan, { opacity }, { opacity: 0, duration: TOUCH_OUT_S, ease: 'none' }, 'out');
    } else {
      const hold = circle || (!fieldChange && from.el?.hasAttribute('data-out-hold'));
      const gone = hold ? OUT_HOLD_S : swap ? swapAt : at.in;
      tl.fromTo(from.pan, { y }, { y: y - CUT.outY * dir, duration: DUR.out, ease: EASE.stepOut }, 'out');
      tl.fromTo(from.pan, { opacity }, { opacity: 0, duration: gone - at.out, ease: EASE.stepOut }, 'out');
    }
  }
  if (withIris) {
    const iris = irisTo(toField, origin, { paused: true, tier, onHalf, clip: circle ? to.el : null });
    tl.add(iris.paused(false), swap ? swapAt : 'iris');
  }
  const panAt = swap ? swapAt : Math.max(0, at.in - PAN_LEAD_S); // never on the old field of a swap
  // The first landing keeps the HTML's opacity on the pan and its fades (they only rise), so the
  // hero text painted at first paint stays painted (LCP, §6.1 HTML-first).
  const first = !from;
  const panFrom = first ? { y: 0 } : { opacity: 0, y: 0 };
  tl.fromTo(to.pan, panFrom, { ...(first ? {} : { opacity: 1 }), y: 0, duration: PAN_IN_S, ease: 'none' }, panAt);
  addInGroup(tl, to.items, { at: at.in, settled, frameAt: fieldChange || compact ? null : CUT.frameAt * CUT.total, keepOpacity: first });
  tl.addLabel('settled', settled);
  if (circle) tl.call(() => unclip(to.el), null, settled); // the iris drops it on complete; this covers a skipped iris
  tl.to({}, { duration: 0 }, settled); // the engine part always lasts until 'settled'
  return tl;
}
