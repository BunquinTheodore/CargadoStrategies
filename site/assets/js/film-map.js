/**
 * Scroll map: turns scroll pixels into film time (and back) with a fixed scroll
 * budget per scene, not per film second (the approach from the Portfolio
 * film). People scroll at a steady pace, so every scene costs about the same
 * number of wheel notches, whatever its duration:
 *
 *   motion  — from one scene's exit to the next scene being fully in (MOTION_PX)
 *   hold    — the settled frame, kept short so scrolling never feels dead;
 *             scenes people fill in (forms, the finder) or mark data-rest hold longer
 *   pan     — overflowing content pans 1:1 with the scroll
 *
 * Segments are piecewise linear and strictly increasing in both pixels and
 * time, so the map inverts cleanly for goTo / deep links.
 */

const MOTION_PX = 640; // one transition: the old scene out, the next one in (~6 wheel notches)
const HOLD_PX = 180; // settled frame before the next transition (~2 notches)
const REST_HOLD_PX = 340; // settled frame on scenes with controls to use (never the opening one)
const END_HOLD_PX = 220; // after the last scene is in
const MIN_WEIGHT = 0.5;
const MAX_WEIGHT = 2;
const REST_SELECTOR = 'input, select, textarea';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function weightOf(el) {
  const w = parseFloat(el.dataset.weight);
  return Number.isFinite(w) ? clamp(w, MIN_WEIGHT, MAX_WEIGHT) : 1;
}

function holdPxOf(el) {
  if (el.hasAttribute('data-rest') || el.querySelector(REST_SELECTOR)) return REST_HOLD_PX;
  return HOLD_PX;
}

/** Settled stretch of one scene: [focusTime → outStart], with the pan inside it. */
function addHold(add, t, isLast) {
  const own = t.index === 0 ? HOLD_PX : holdPxOf(t.el); // the first scroll always moves the film
  const holdPx = isLast ? END_HOLD_PX : own * weightOf(t.el);
  const holdEnd = isLast ? t.end : t.outStart;
  if (!t.pan) {
    add(holdPx, t.focusTime, holdEnd);
    return;
  }
  add(holdPx / 2, t.focusTime, t.panStart);
  add(t.pan, t.panStart, t.panEnd);
  add(holdPx / 2, t.panEnd, holdEnd);
}

/** Build the segment list from the scene timings (see film.js timingFor). */
export function buildScrollMap(timings) {
  const segments = [];
  let total = 0;
  const add = (px, t0, t1) => {
    if (px <= 0.5 || t1 - t0 <= 1e-4) return;
    segments.push({ y0: total, y1: total + px, t0, t1 });
    total += px;
  };
  timings.forEach((t, i) => {
    const isLast = i === timings.length - 1;
    addHold(add, t, isLast);
    if (!isLast) add(MOTION_PX * weightOf(timings[i + 1].el), t.outStart, timings[i + 1].focusTime);
  });
  return { segments, total };
}

/** Scroll px (from the top of the spacer) → film time. */
export function timeAt(map, y) {
  const { segments } = map;
  if (!segments.length) return 0;
  const seg = segments.find((s) => y < s.y1) || segments[segments.length - 1];
  const p = clamp((y - seg.y0) / (seg.y1 - seg.y0), 0, 1);
  return seg.t0 + (seg.t1 - seg.t0) * p;
}

/** Film time → scroll px (from the top of the spacer). */
export function pxAt(map, time) {
  const { segments } = map;
  if (!segments.length) return 0;
  if (time <= segments[0].t0) return 0;
  const seg = segments.find((s) => time <= s.t1) || segments[segments.length - 1];
  const p = clamp((time - seg.t0) / (seg.t1 - seg.t0), 0, 1);
  return seg.y0 + (seg.y1 - seg.y0) * p;
}
