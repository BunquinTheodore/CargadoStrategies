/**
 * The C/W mark draw, shared by Story #logo and the services orbit (Home, Services; spec §6.3).
 * Moved from sections/story/logo/Logo.js without changing a timing: both strokes draw on the
 * cut timeline by label, so the same code runs in cut and touch-cut mode and seeks cleanly.
 *
 * Markup contract (the same `d` as Story; pathLength="100" so 100 = undrawn):
 *   <div class="mark" aria-hidden="true">
 *     <svg class="mark__c" viewBox="0 0 48 48" focusable="false"><path d="{MARK_PATHS.c}" pathLength="100" …/></svg>
 *     <svg class="mark__w" viewBox="0 0 48 48" focusable="false"><path d="{MARK_PATHS.w}" pathLength="100" …/></svg>
 *   </div>
 * Story keeps its own class names (LOGO_PARTS, the default). Pass `parts: MARK_PARTS` for the above.
 */

/** The mark draws while the dots collapse (dotglobe RING_S 1.2 s from 'in'). Seconds after the label. */
export const MARK = Object.freeze({
  cFrom: 0, // the C traces round with the dots, fast at first so the frame is never bare (T5)
  cDuration: 1,
  wFrom: 0.12, // the W draws inside it as the ring forms
  wDuration: 0.7,
  scaleFrom: 0.94,
  scaleDuration: 1,
});
/** No dots to follow: the same draw, ending by 'settled' (cut.js: 0.65 s after 'in'). */
export const MARK_POSTER = Object.freeze({ ...MARK, cDuration: 0.6, wFrom: 0.08, wDuration: 0.5, scaleDuration: 0.6 });

/** The stroke paths, in a 48 × 48 viewBox. */
export const MARK_PATHS = Object.freeze({
  c: 'M37.4 10.6A19 19 0 1 0 37.4 37.4',
  w: 'M13.5 17 19.2 31.5 24 21.5 28.8 31.5 34.5 17',
});

/** Story #logo's selectors (the default) and the shared .mark markup's. */
export const LOGO_PARTS = Object.freeze({ c: '.logo__c path', w: '.logo__w path', mono: '.logo__mono' });
export const MARK_PARTS = Object.freeze({ c: '.mark__c path', w: '.mark__w path', mono: '.mark' });

const DRAWN = 0;
const UNDRAWN = 100; // the paths carry pathLength="100"

/** True while the dot-globe is live (its dots lead the C); otherwise the poster timings apply. */
const globeLive = () => typeof document !== 'undefined' && document.getElementById('globe')?.hidden === false;

/** A position `seconds` after `at`: a label ('in' → 'in+=0.12') or a time in seconds. */
const after = (at, seconds) => (typeof at === 'number' ? at + seconds : `${at}+=${seconds}`);

/**
 * Add the mark draw to a cut timeline. `poster` picks the short timings (omitted: decided by
 * the live globe, as Story always has); `at` is the label or time the draw starts from.
 */
export function drawMark({ tl, toEl, poster = !globeLive(), at = 'in', parts = LOGO_PARTS }) {
  const c = toEl?.querySelector(parts.c);
  const w = toEl?.querySelector(parts.w);
  const mono = toEl?.querySelector(parts.mono);
  if (!tl || !c || !w || !mono) return;
  const mark = poster ? MARK_POSTER : MARK;
  tl.fromTo(mono, { scale: mark.scaleFrom }, { scale: 1, duration: mark.scaleDuration, ease: 'expo.out' }, after(at, mark.cFrom));
  tl.fromTo(c, { strokeDashoffset: UNDRAWN }, {
    strokeDashoffset: DRAWN, duration: mark.cDuration, ease: 'power2.out',
  }, after(at, mark.cFrom));
  tl.fromTo(w, { strokeDashoffset: UNDRAWN }, {
    strokeDashoffset: DRAWN, duration: mark.wDuration, ease: 'power2.out',
  }, after(at, mark.wFrom));
}
