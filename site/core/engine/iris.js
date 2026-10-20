/**
 * The iris (DIRECTION §4.4, api.md §9): a DOM circle in the next field's
 * colour scales from 0.02 to 1 from a meaningful origin (the full stop, the
 * clicked CTA, the map pin). Tier C and reduced motion get a swap instead:
 * no blend of two opaque fields (that reads as a mud-brown frame), the
 * .fields layer switches hard while the outgoing text is gone. A tier C cut
 * from a full stop (origin.stop) keeps the circle, the one cheap swell,
 * except on tier-locked pages (legal) and under reduced motion.
 *
 *   irisTo(field, { x, y, stop }, { paused, duration, tier, onHalf, clip, from, swapAt }) → gsap timeline
 *
 * The element is `<div class="iris" aria-hidden="true">` inside .stage (2b
 * writes it and styles it from the variables set here). At 50% (the swap
 * itself on the swap path) the header field changes (html[data-hdr-field])
 * and `onHalf` runs; on complete the .fields layer takes the new field and
 * the iris goes back to idle. `clip` (the incoming scene) is clipped to the
 * circle while it grows, so new content shows only inside the new field.
 * `from` is the starting scale (touch-cut starts larger, so the swell never
 * reads as a dot); `swapAt` delays the swap (touch-cut lets the old text fade
 * first). The timeline is built from fromTo tweens and calls only, so it can
 * be nested in a paused cut timeline and seeked (T5). Reversed (a touch swipe
 * that turned back), it gives the header its old field back at 50% and
 * returns to idle at 0 without touching .fields.
 */
import { DUR, EASE } from './motion-tokens.js';
import { getTier, tierConfig } from './tier.js';

const IRIS_FROM = 0.02;
const SWAP_TAIL_S = 0.05; // the swap timeline's length after the swap, so it has a duration to nest and seek
const html = document.documentElement;

/** The iris and the fields layer, created when the page has not got them yet (2b writes them in the HTML). */
function layer(className) {
  let el = document.querySelector(`.stage > .${className}`) || document.querySelector(`.${className}`);
  if (el) return el;
  const stage = document.querySelector('.stage') || document.body;
  el = document.createElement('div');
  el.className = className;
  el.setAttribute('aria-hidden', 'true');
  if (className === 'fields') stage.prepend(el);
  else stage.appendChild(el);
  return el;
}

export const irisEl = () => layer('iris');
export const fieldsEl = () => layer('fields');

/** Radius that covers the whole viewport from (x, y): the distance to the farthest corner. */
function coverRadius(x, y) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y)));
}

/** Drop the circle clip from a scene (cut.js also calls it at 'settled'). */
export function unclip(el) {
  el?.style.removeProperty('clip-path');
}

function settle(iris, fields, field, clip) {
  if (field) fields.setAttribute('data-field', field);
  iris.setAttribute('data-state', 'idle');
  ['transform', 'opacity', 'will-change', 'z-index'].forEach((prop) => iris.style.removeProperty(prop));
  unclip(clip);
}

/**
 * Swap or circle: reduced motion swaps; tier C (the tier table says fade)
 * swaps unless the origin is a full stop on an unlocked page; A and B circle.
 */
function usesSwap(tier, stop) {
  if (html.classList.contains('rm')) return true;
  if (tierConfig(tier).iris !== 'fade') return false;
  return !stop || html.hasAttribute('data-tier-lock');
}

/** True when irisTo would swap for this tier and origin (cut.js places a swap just before 'in'). */
export const irisFades = (tier = getTier(), origin = {}) => usesSwap(tier, !!origin?.stop);

/** Swap path: one hard switch of .fields and the header at `swapAt`; reversed before it, nothing changed. */
function swapTimeline(field, { paused, swapAt, onHalf }) {
  const { gsap } = window;
  const fields = fieldsEl();
  const tl = gsap.timeline({ paused });
  let before = null;
  tl.call(() => { if (!tl.reversed()) before = fields.getAttribute('data-field'); }, null, 0);
  tl.call(() => {
    const shown = tl.reversed() && before ? before : field;
    fields.setAttribute('data-field', shown);
    html.setAttribute('data-hdr-field', shown);
    onHalf?.({ field: shown });
  }, null, swapAt);
  tl.to({}, { duration: swapAt + SWAP_TAIL_S }, 0);
  return tl;
}

export function irisTo(field, origin = {}, {
  paused = false, duration, tier = getTier(), onHalf, clip = null, from = IRIS_FROM, swapAt = 0,
} = {}) {
  if (usesSwap(tier, !!origin.stop)) return swapTimeline(field, { paused, swapAt, onHalf });
  const { gsap } = window;
  const iris = irisEl();
  const fields = fieldsEl();
  const x = Number.isFinite(origin.x) ? origin.x : window.innerWidth / 2;
  const y = Number.isFinite(origin.y) ? origin.y : window.innerHeight / 2;
  const radius = coverRadius(x, y);
  const seconds = duration ?? DUR.iris;
  const tl = gsap.timeline({ paused });
  let before = null; // the field on screen when the iris started (a reversed iris gives it back)
  let clipAt = null; // the origin in the clipped scene's own box

  const drawClip = () => {
    if (!clip || !clipAt) return;
    const r = radius * Number(gsap.getProperty(iris, 'scale'));
    clip.style.clipPath = `circle(${r.toFixed(1)}px at ${clipAt.x}px ${clipAt.y}px)`;
  };

  // Set at the iris's own start (a call, not at build time), so a cut built
  // ahead of its iris shows no dot before the 'iris' label.
  tl.call(() => {
    if (tl.reversed()) return;
    before = fields.getAttribute('data-field');
    iris.setAttribute('data-field', field);
    iris.setAttribute('data-state', 'circle');
    iris.style.setProperty('--iris-x', `${Math.round(x)}px`);
    iris.style.setProperty('--iris-y', `${Math.round(y)}px`);
    iris.style.setProperty('--iris-r', `${radius}px`);
    iris.style.willChange = 'transform';
    if (clip) {
      const box = clip.getBoundingClientRect();
      clipAt = { x: Math.round(x - box.left), y: Math.round(y - box.top) };
      drawClip();
    }
  }, null, 0);
  tl.fromTo(iris, { scale: from }, {
    scale: 1, duration: seconds, ease: EASE.iris, immediateRender: false, onUpdate: drawClip,
  }, 0);
  tl.call(() => {
    const shown = tl.reversed() && before ? before : field;
    html.setAttribute('data-hdr-field', shown);
    onHalf?.({ field: shown });
  }, null, seconds / 2);
  tl.call(() => { if (!tl.reversed()) settle(iris, fields, field, clip); }, null, seconds);
  tl.eventCallback('onReverseComplete', () => settle(iris, fields, null, clip));
  return tl;
}
