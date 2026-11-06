/**
 * One entrance on every scene (client 2026-11-07: calm). Pure (no DOM, no GSAP): film-reveals.js
 * reads the from/to states, tests/entrances.test.mjs covers them.
 *
 *   words   rise from their masks (yPercent 110 → 0)
 *   items   fade in and rise RISE_PX (fade items and stagger children)
 *
 * Only transform and opacity change, and both are fromTo pairs, so a cut seeked to any point
 * (T5) shows the right frame.
 */

export const RISE_PX = 12;

/** Words of a [data-reveal="words"] heading: { from, to } (to has no duration or ease). */
export const WORD_STATES = Object.freeze({ from: { yPercent: 110 }, to: { yPercent: 0 } });

/** A fade item or a stagger child: { from, to } (to always lands on opacity 1). */
export const ITEM_STATES = Object.freeze({ from: { opacity: 0, y: RISE_PX }, to: { opacity: 1, y: 0, scale: 1 } });
