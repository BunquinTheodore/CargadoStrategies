/**
 * Services page — Round 3 depth and sound (PLAN "Round 3" §3, §5, §6).
 *
 * Depth: extra scrubbed tweens on the master timeline (film mode, fine
 * pointers only; phones stay 2D like the rest of the engine). They animate
 * transform properties the shared reveals never touch on the same element
 * (rotationY on [data-swing], z on list numerals, rotationX on the map), so
 * they compose with the reveals instead of fighting them. All fromTo, so
 * every seek in either direction lands on the right state.
 *
 * Sound: named page cues for meaningful actions, mixed through sfx.js (which
 * already handles mute, unlock and throttling). Chips, selects and summaries
 * pop on their own (sfx.js); these cues mark the outcome of an action.
 */
import { sfx } from './sfx.js';
import { finePointer } from './perf.js';

/* ---------- depth tweens ---------- */

const SWING_DEG = 14; // [data-swing] panels turn in from this rotationY
const SWING_OUT_DEG = -8;
const SWING_PERSPECTIVE = 900; // the same lens the shared reveals use, so both tweens agree
const SWING_HINGE_END = '100% 50%'; // even panels hinge on their right edge, odd ones on their left
const SWING_HINGE_START = '0% 50%';
const CENTRE = '50% 50%';
const NUMERAL_Z = -220; // list numerals fly in from this depth
const NUMERAL_PERSPECTIVE = 700;
const MAP_TILT_DEG = 48; // the map lies back like a table-top, then stands up
const MAP_OUT_DEG = -16;
const MAP_PERSPECTIVE = 1100;
const IN_EASE = 'power3.out';
const OUT_EASE = 'power2.in';
const NUMERALS = '.offer-stack__n, .roles__n, .jump-rail__n';

const share = (timing, phase, k) => timing[`${phase}Start`] + timing[`${phase}Dur`] * k;
const hasOut = (timing) => timing.outDur > 0;

/**
 * Panels marked [data-swing] turn in on Y around their outer edge, and turn away on the way out.
 * The hinge glides back to the centre as the panel settles (no visual jump: the angle is 0
 * there), so the hover tilt (interact.js, CSS `rotate`) pivots on the middle of the panel
 * instead of on the edge GSAP would otherwise leave written inline.
 */
function swingPanels(tl, sceneEl, timing) {
  sceneEl.querySelectorAll('[data-swing]').forEach((el, i) => {
    const hinge = i % 2 ? SWING_HINGE_START : SWING_HINGE_END;
    tl.fromTo(el, { rotationY: SWING_DEG, transformOrigin: hinge, transformPerspective: SWING_PERSPECTIVE },
      { rotationY: 0, transformOrigin: CENTRE, duration: timing.inDur * 0.62, ease: IN_EASE }, share(timing, 'in', 0.3));
    if (!hasOut(timing)) return;
    tl.fromTo(el, { rotationY: 0, transformOrigin: CENTRE },
      { rotationY: SWING_OUT_DEG, transformOrigin: hinge, duration: timing.outDur * 0.8, ease: OUT_EASE, immediateRender: false },
      share(timing, 'out', 0.1));
  });
}

/** Numbered rows: the numerals arrive from deep behind the page, staggered (a perspective list). */
function flyNumerals(tl, sceneEl, timing) {
  const numerals = sceneEl.querySelectorAll(NUMERALS);
  if (!numerals.length || sceneEl.id === 'intro') return; // the opening frame starts settled
  tl.fromTo(numerals, { z: NUMERAL_Z, transformPerspective: NUMERAL_PERSPECTIVE },
    { z: 0, duration: timing.inDur * 0.5, ease: IN_EASE, stagger: timing.inDur * 0.05 }, share(timing, 'in', 0.42));
}

/** The finder map rises from a table-top angle to face the visitor (clicks stay exact once settled). */
function standMap(tl, sceneEl, timing) {
  const map = sceneEl.querySelector('#finder-map');
  if (!map) return;
  tl.fromTo(map, { rotationX: MAP_TILT_DEG, transformPerspective: MAP_PERSPECTIVE, transformOrigin: '50% 100%' },
    { rotationX: 0, duration: timing.inDur * 0.7, ease: IN_EASE }, share(timing, 'in', 0.28));
  if (!hasOut(timing)) return;
  tl.fromTo(map, { rotationX: 0 },
    { rotationX: MAP_OUT_DEG, duration: timing.outDur * 0.8, ease: OUT_EASE, immediateRender: false },
    share(timing, 'out', 0.05));
}

/** film.on('build') listener: 3D layered composition for the key scenes. */
export function addDepthTweens({ tl, sceneEl, timing }) {
  if (!finePointer()) return;
  swingPanels(tl, sceneEl, timing);
  flyNumerals(tl, sceneEl, timing);
  standMap(tl, sceneEl, timing);
}

/* ---------- sound cues ---------- */

const CUE = Object.freeze({
  result: ['tone', { field: 'gold' }], // the finder found a place and sorted the list
  switch: ['tone', { field: 'bone' }], // a new category card turns in
  error: ['error'], // the shared soft falling two-note: something needs fixing
  success: ['success'],
  open: ['whoosh'], // a panel unfolds
});

/** Play a named page cue (silent while muted or before the first gesture). */
export function cue(name) {
  const [voice, options] = CUE[name] || [];
  if (voice) sfx.play(voice, options);
}

/* ---------- shake (an invalid form says so with a small nudge) ---------- */

const SHAKE_CLASS = 'is-shaking';

/** Replay the CSS shake on `el` (transform-only; CSS skips it in flow mode). */
export function shake(el) {
  if (!el) return;
  el.classList.remove(SHAKE_CLASS);
  void el.offsetWidth; // restart the animation
  el.classList.add(SHAKE_CLASS);
  el.addEventListener('animationend', () => el.classList.remove(SHAKE_CLASS), { once: true });
}
