/**
 * T3 #logo (W5): the globe collapses into the C ring (dotglobe 'ring' mode);
 * here the drawn C follows the dots round and the W draws inside it. Both are
 * stroke draws on the cut timeline, by label, so the same code runs in cut and
 * touch-cut mode and seeks cleanly. The scene carries data-out-hold, so leaving
 * it on a same-field cut the engine holds the mark until 0.45 s (a J-cut): its
 * thin strokes alone would leave the frame bare (T5). With no live globe
 * (posters: tier C, reduced motion, flow) there are no dots to follow, so the
 * mark draws inside the engine part (by 'settled'): a longer timeline would put
 * the 25% seek frame of the cut in past 'in', after the out group has gone and
 * before the in group shows (T5).
 */
import { Section } from '../../../core/Section.js';

/** The mark draws while the dots collapse (dotglobe RING_S 1.2 s from 'in'). Seconds after 'in'. */
const MARK = Object.freeze({
  cFrom: 0, // the C traces round with the dots, fast at first so the frame is never bare (T5)
  cDuration: 1,
  wFrom: 0.12, // the W draws inside it as the ring forms
  wDuration: 0.7,
  scaleFrom: 0.94,
  scaleDuration: 1,
});
/** No dots to follow: the same draw, ending by 'settled' (cut.js: 0.65 s after 'in'). */
const MARK_POSTER = Object.freeze({ ...MARK, cDuration: 0.6, wFrom: 0.08, wDuration: 0.5, scaleDuration: 0.6 });
const DRAWN = 0;
const UNDRAWN = 100; // the paths carry pathLength="100"

function drawMark({ tl, toEl }) {
  const c = toEl.querySelector('.logo__c path');
  const w = toEl.querySelector('.logo__w path');
  const mono = toEl.querySelector('.logo__mono');
  if (!c || !w || !mono) return;
  const mark = document.getElementById('globe')?.hidden === false ? MARK : MARK_POSTER;
  tl.fromTo(mono, { scale: mark.scaleFrom }, { scale: 1, duration: mark.scaleDuration, ease: 'expo.out' }, `in+=${mark.cFrom}`);
  tl.fromTo(c, { strokeDashoffset: UNDRAWN }, {
    strokeDashoffset: DRAWN, duration: mark.cDuration, ease: 'power2.out',
  }, `in+=${mark.cFrom}`);
  tl.fromTo(w, { strokeDashoffset: UNDRAWN }, {
    strokeDashoffset: DRAWN, duration: mark.wDuration, ease: 'power2.out',
  }, `in+=${mark.wFrom}`);
}

export class Logo extends Section {
  static id = 'logo';

  /** Only the cut into #logo draws the mark. */
  cut(event) {
    if (event.toEl?.id === Logo.id) drawMark(event);
  }
}
