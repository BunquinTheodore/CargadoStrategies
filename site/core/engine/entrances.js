/**
 * Scene entrances (owner, 2026-10-26: "an animation on each part/section as we scroll"): how a
 * scene's in group arrives on its cut-in, picked per scene with data-entrance. Pure (no DOM, no
 * GSAP): film-reveals.js asks for the from/to states, tests/entrances.test.mjs covers them.
 *
 *   rise   (default) words rise from their masks, items rise 24 px and fade in
 *   depth  scale from depth: words and items grow in from 0.85 / 0.92 as they fade in
 *   slide  side slide: words and items slide in from the left
 *   wipe   mask wipe: a clip-path inset opens each word and item from left to right
 *   open   clip reveal: each word and item opens from its centre line
 *
 * Only transform, opacity and clip-path change, and every state is a fromTo pair, so a cut
 * seeked to any point (T5) shows the right frame. The eyebrow, rule, stop and frame keep their
 * own reveal in every entrance (they are the scene's punctuation). The first landing always
 * uses 'rise' (its text was painted by the HTML and only rises, for LCP).
 */

export const ENTRANCES = Object.freeze(['rise', 'depth', 'slide', 'wipe', 'open']);
export const DEFAULT_ENTRANCE = 'rise';

const MASK_OFFSET = 110; // yPercent a word starts below its mask
const RISE_PX = 24;
const SLIDE_WORD = -60; // xPercent
const SLIDE_PX = -40;
const DEPTH_WORD = 0.85;
const DEPTH_ITEM = 0.92;
const CLOSED_LEFT = 'inset(0% 100% 0% 0%)';
const CLOSED_MIDDLE = 'inset(50% 0% 50% 0%)';
const OPEN = 'inset(0% 0% 0% 0%)';

/** A data-entrance value → an entrance name (unknown or absent: the default). */
export function parseEntrance(value) {
  const name = String(value ?? '').trim().toLowerCase();
  return ENTRANCES.includes(name) ? name : DEFAULT_ENTRANCE;
}

/** Words of a [data-reveal="words"] heading: { from, to } (to has no duration or ease). */
export function wordStates(name) {
  switch (parseEntrance(name)) {
    case 'depth': return { from: { yPercent: 30, scale: DEPTH_WORD, opacity: 0 }, to: { yPercent: 0, scale: 1, opacity: 1 } };
    case 'slide': return { from: { yPercent: 0, xPercent: SLIDE_WORD, opacity: 0 }, to: { xPercent: 0, opacity: 1 } };
    case 'wipe': return { from: { yPercent: 0, clipPath: CLOSED_LEFT }, to: { clipPath: OPEN, clearProps: 'clipPath' } };
    case 'open': return { from: { yPercent: 0, clipPath: CLOSED_MIDDLE }, to: { clipPath: OPEN, clearProps: 'clipPath' } };
    default: return { from: { yPercent: MASK_OFFSET }, to: { yPercent: 0 } };
  }
}

/** A fade item or a stagger child: { from, to } (to always lands on opacity 1). */
export function itemStates(name) {
  switch (parseEntrance(name)) {
    case 'depth': return { from: { opacity: 0, scale: DEPTH_ITEM }, to: { opacity: 1, scale: 1 } };
    case 'slide': return { from: { opacity: 0, x: SLIDE_PX }, to: { opacity: 1, x: 0 } };
    case 'wipe': return { from: { opacity: 0, clipPath: CLOSED_LEFT }, to: { opacity: 1, clipPath: OPEN, clearProps: 'clipPath' } };
    case 'open': return { from: { opacity: 0, clipPath: CLOSED_MIDDLE }, to: { opacity: 1, clipPath: OPEN, clearProps: 'clipPath' } };
    default: return { from: { opacity: 0, y: RISE_PX }, to: { opacity: 1, y: 0, scale: 1 } };
  }
}
