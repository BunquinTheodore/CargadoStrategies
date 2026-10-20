/**
 * Motion tokens: the GSAP mirror of base.css --dur-* and --ease-* (DIRECTION
 * §3, §4.4). Change a value here and in base.css together. The cut timeline
 * (cut.js), the iris (iris.js) and the in group (film-reveals.js) read these;
 * page choreography should too, so every page moves on the same clock.
 */

/** Durations in seconds (GSAP); the one `…Ms` key is milliseconds. */
export const DUR = Object.freeze({
  out: 0.32, iris: 0.62, same: 0.40, in: 0.65, stop: 0.24, hover: 0.2, door: 0.35,
  frame: 0.6, vt: 0.45, fadeRm: 0.2, fadeC: 0.25, eyebrow: 0.45, idleStopMs: 5000,
});

/** Keyed by cut step (§4.4 table), not by curve name: the out step uses power2.in, the in step expo.out. */
export const EASE = Object.freeze({
  stepOut: 'power2.in', iris: 'expo.inOut', same: 'power2.inOut', stepIn: 'expo.out',
  stop: 'back.out(3)', hover: 'power3.out', morph: 'power3.inOut',
});

/** The CSS curves by their base.css names, for WAAPI (splash, View Transitions). */
export const CSS_EASE = Object.freeze({
  ease: 'cubic-bezier(.2,.7,.1,1)', out: 'cubic-bezier(.16,1,.3,1)',
  in: 'cubic-bezier(.55,0,1,.45)', inout: 'cubic-bezier(.87,0,.13,1)',
});

/** Cut label times (s) and constants: lockAt is the share of `total` after which one step may queue. */
export const CUT = Object.freeze({
  out: 0, iris: 0.10, in: 0.30, settled: 0.95, total: 0.95, lockAt: 0.7,
  outY: 40, wordStagger: 0.07, itemStagger: 0.06, frameAt: 0.4,
});
