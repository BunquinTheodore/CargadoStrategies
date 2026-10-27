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
 *
 * `shape` (transitions.js, the scene's data-transition) draws the paint in another style:
 * 'dot' pops a dot at the centre and swells it (the same circle and scale, so dotglobe's
 * irisClip still matches); 'quad' and 'flood' turn the iris into a full-frame layer
 * (data-state="wipe") clipped to a polygon, with the incoming scene clipped to the same one.
 * `dir` orders the quad cells and aims the flood. The swap path is the same for every shape.
 */
import { DUR, EASE } from './motion-tokens.js';
import { getTier, tierConfig } from './tier.js';
import { circleAt, coverRadius as cover, polygonCss, regionAt } from './transitions.js';

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
const coverRadius = (x, y) => cover(window.innerWidth, window.innerHeight, x, y);

/** Drop the circle clip from a scene (cut.js also calls it at 'settled'). */
export function unclip(el) {
  el?.style.removeProperty('clip-path');
}

function settle(iris, fields, field, clip) {
  if (field) fields.setAttribute('data-field', field);
  iris.setAttribute('data-state', 'idle');
  ['transform', 'opacity', 'will-change', 'z-index', 'clip-path'].forEach((prop) => iris.style.removeProperty(prop));
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

/**
 * True when a same-field cut may play its data-transition reveal (cut.js): not under reduced
 * motion, and not on a measured tier C; a tier-locked page (legal, C by policy) keeps it.
 */
export const shapesAllowed = (tier = getTier()) => !html.classList.contains('rm')
  && (tierConfig(tier).iris !== 'fade' || html.hasAttribute('data-tier-lock'));

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

/** The header swap at 50%, and back on a reversed run. */
function addHalf(tl, field, seconds, getBefore, onHalf) {
  tl.call(() => {
    const before = getBefore();
    const shown = tl.reversed() && before ? before : field;
    html.setAttribute('data-hdr-field', shown);
    onHalf?.({ field: shown });
  }, null, seconds / 2);
}

/** quad / flood: a full-frame layer clipped to the region polygon, the incoming scene to the same one. */
function wipeTimeline(field, shape, { paused, seconds, onHalf, clip, dir }) {
  const { gsap } = window;
  const iris = irisEl();
  const fields = fieldsEl();
  const tl = gsap.timeline({ paused });
  const run = { t: 0 };
  let before = null;
  let box = null;
  const draw = () => {
    const points = regionAt(shape, run.t, { w: window.innerWidth, h: window.innerHeight, dir });
    iris.style.clipPath = polygonCss(points);
    if (!clip) return;
    box ||= clip.getBoundingClientRect();
    clip.style.clipPath = polygonCss(points, -box.left, -box.top);
  };
  tl.call(() => {
    if (tl.reversed()) return;
    before = fields.getAttribute('data-field');
    box = null;
    iris.style.removeProperty('transform');
    iris.setAttribute('data-field', field);
    iris.setAttribute('data-state', 'wipe');
    iris.style.willChange = 'clip-path';
    draw();
  }, null, 0);
  tl.fromTo(run, { t: 0 }, { t: 1, duration: seconds, ease: 'none', immediateRender: false, onUpdate: draw }, 0);
  addHalf(tl, field, seconds, () => before, onHalf);
  tl.call(() => { if (!tl.reversed()) settle(iris, fields, field, clip); }, null, seconds);
  tl.eventCallback('onReverseComplete', () => settle(iris, fields, null, clip));
  return tl;
}

export function irisTo(field, origin = {}, {
  paused = false, duration, tier = getTier(), onHalf, clip = null, from = IRIS_FROM, swapAt = 0, shape = 'iris', dir = 1,
} = {}) {
  if (usesSwap(tier, !!origin.stop)) return swapTimeline(field, { paused, swapAt, onHalf });
  if (shape === 'quad' || shape === 'flood') return wipeTimeline(field, shape, { paused, seconds: duration ?? DUR.iris, onHalf, clip, dir });
  const dot = shape === 'dot' && from <= IRIS_FROM; // touch-cut starts as a disc: a dot run would shrink it first
  const at = shape === 'dot' ? { x: window.innerWidth / 2, y: window.innerHeight / 2 } : origin;
  const { gsap } = window;
  const iris = irisEl();
  const fields = fieldsEl();
  const x = Number.isFinite(at.x) ? at.x : window.innerWidth / 2;
  const y = Number.isFinite(at.y) ? at.y : window.innerHeight / 2;
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
  if (dot) {
    // The dot's radius from transitions.js, as the iris scale (dotglobe reads the scale).
    const run = { t: 0 };
    const size = { w: window.innerWidth, h: window.innerHeight };
    tl.fromTo(run, { t: 0 }, {
      t: 1, duration: seconds, ease: 'none', immediateRender: false,
      onUpdate: () => { gsap.set(iris, { scale: circleAt('dot', run.t, size).r / radius }); drawClip(); },
    }, 0);
  } else {
    tl.fromTo(iris, { scale: from }, {
      scale: 1, duration: seconds, ease: EASE.iris, immediateRender: false, onUpdate: drawClip,
    }, 0);
  }
  addHalf(tl, field, seconds, () => before, onHalf);
  tl.call(() => { if (!tl.reversed()) settle(iris, fields, field, clip); }, null, seconds);
  tl.eventCallback('onReverseComplete', () => settle(iris, fields, null, clip));
  return tl;
}
