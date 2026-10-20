/**
 * Home page choreography appended to the engine's cut timelines (api.md §4.3).
 *
 * `addCutTweens` is the film's 'cut' listener. It filters on the incoming
 * scene, positions every tween by label (never by absolute time, so the same
 * code runs in cut and touch-cut mode), uses fromTo with explicit end states
 * (immediate landings jump straight to the end) and animates transform,
 * opacity and two registered custom properties only. Nothing loops.
 *
 *   #one-message  W2: four searches arrive 80 ms apart from the 'iris' label
 *                 (a J-cut; 'in' on a swap), a bar wipes each one and the
 *                 line dims; then, from just before the 'struck' label, "One
 *                 Message" rises, its stop pops and the steps settle with its
 *                 second word. The cut ends within 1.3 s.
 *   #founder      W3: the doors are dealt in (y ±48 px, rotationY ±12°,
 *                 perspective 1100, 70 ms apart, landing flat); phones rise in y.
 *   #situations,  J-cuts: the engine's in group starts 0.12 s early, with the
 *   #find         pan, inside the opening circle (T5: no bare field at 25%).
 *
 * The hero (W1) and the close (W5) need nothing here: the engine plays the
 * words and the stop, dotglobe plays the globe, the arc and the medallion.
 */

import { irisFades } from './iris.js';

const STRIKE = Object.freeze({
  arrive: 0.35, // each line rises into place
  arriveStagger: 0.08,
  rise: 18, // px
  bar: 0.14, // each bar wipes from the left
  barStagger: 0.05,
  barAfter: 0.16, // the first bar starts this long after the first line arrives
  panIn: 0.08, // the incoming pan's fade, as the engine's (cut.js PAN_IN_S), moved to the lead
});
/** The answer after the problem: "One Message", its stop and the steps overlap the last bar. */
const ANSWER = Object.freeze({
  lead: 0.12, // the first word starts this long before 'struck' (the last bar is mostly drawn)
  wordDuration: 0.5,
  wordStagger: 0.07,
  maskOffset: 110, // yPercent, as the engine's word reveal (film-reveals.js)
  stopAfter: 0.25, // after the last word starts (the stop lands by in + 1.0 s)
  stopDuration: 0.24,
  stepsAfter: 0.07, // after the first word: the steps start with the second
  stepDuration: 0.45,
  stepStagger: 0.06,
  stepRise: 24,
});
const DEAL = Object.freeze({
  y: 48,
  rotationY: 12, // DIRECTION W3: at most 12° (the panel fix)
  perspective: 1100,
  duration: 0.6,
  stagger: 0.07,
  after: 0, // seconds after the 'in' label: the first door moves with the title (no bare metal)
});
const LEAD_IN_S = 0.12; // H3/H5: the in group starts this long before 'in' on a J-cut
const ACTION = '[data-group="action"]'; // keeps its slot: its fine print would straddle the circle's edge
const PHONE_QUERY = '(max-width: 759px)';

const qsa = (root, sel) => Array.from(root.querySelectorAll(sel));
const isPhone = () => window.matchMedia(PHONE_QUERY).matches;
/** Lines that phones drop (.phone-hide) are left out, so the stagger has no gap. No layout reads. */
const shown = (els) => (isPhone() ? els.filter((el) => !el.classList.contains('phone-hide')) : els);

/**
 * W2 is a J-cut: the strikes arrive from the 'iris' label, while the outgoing scene leaves, so
 * no seek frame falls between the two scenes (§10.2, T5). The pan's fade moves with them. A swap
 * (tier C, reduced motion) changes the field just before 'in', so there they keep the 'in' slot.
 */
function leadLabel(tl, el, { fieldChange, origin }) {
  const { iris, in: inAt } = tl.labels;
  if (iris === undefined || inAt === undefined || iris >= inAt || (fieldChange && irisFades(undefined, origin))) return 'in';
  const pan = el.querySelector('.scene__pan');
  if (pan) {
    tl.getTweensOf(pan).forEach((tween) => tween.kill());
    tl.fromTo(pan, { opacity: 0, y: 0 }, { opacity: 1, y: 0, duration: STRIKE.panIn, ease: 'none' }, 'iris');
  }
  return 'iris';
}

/**
 * H3 and H5 as J-cuts too: when the pan leads from 'iris', the engine's in group (all but the
 * action group) moves up by LEAD_IN_S, so the rows and the headline are drawn inside the opening
 * circle (or over the leaving scene on a same-field cut) instead of on a bare field. Swaps keep
 * the engine's slots.
 */
function leadInGroup(tl, el, event) {
  if (leadLabel(tl, el, event) !== 'iris') return;
  const pan = el.querySelector('.scene__pan');
  const from = tl.labels.in - 0.001;
  tl.getChildren(false, true, false).forEach((tween) => {
    const targets = tween.targets();
    if (tween.startTime() < from || targets.includes(pan) || !targets.every((t) => t instanceof Node && el.contains(t) && !t.closest?.(ACTION))) return;
    tween.startTime(tween.startTime() - LEAD_IN_S);
  });
}

/** W2: the struck searches. The bar and the dim are --strike / --strike-dim (fx.css §4). */
function strikeSearches(tl, el, dir, lead) {
  const lines = shown(qsa(el, '.strike > li'));
  if (!lines.length) return;
  tl.fromTo(lines, { opacity: 0, y: STRIKE.rise * dir }, {
    opacity: 1, y: 0, duration: STRIKE.arrive, ease: 'expo.out', stagger: STRIKE.arriveStagger,
  }, lead);
  tl.fromTo(lines, { '--strike': 0, '--strike-dim': 0 }, {
    '--strike': 1, '--strike-dim': 1, duration: STRIKE.bar, ease: 'power2.inOut', stagger: STRIKE.barStagger,
  }, `${lead}+=${STRIKE.barAfter}`);
  const struck = STRIKE.barAfter + STRIKE.barStagger * (lines.length - 1) + STRIKE.bar;
  tl.addLabel('struck', `${lead}+=${struck}`);
}

/**
 * W2 order: the engine lands the monument and the steps with the rest of the in group; here
 * they are taken off the engine's slots and replayed from 'answer', as the last bar finishes,
 * so the answer never lands before the problem is crossed out. 'stop' moves with the stop.
 */
function landAnswer(tl, el) {
  const words = qsa(el, '.one__title .rv-word');
  const stop = el.querySelector('.one__title .stop');
  const steps = qsa(el, '.one__steps > li');
  [words, stop ? [stop] : [], steps].forEach((targets) => {
    if (targets.length) tl.getTweensOf(targets).forEach((tween) => tween.kill());
  });
  const lastWord = ANSWER.wordStagger * Math.max(words.length - 1, 0);
  tl.addLabel('answer', `struck-=${ANSWER.lead}`);
  if (words.length) {
    tl.fromTo(words, { yPercent: ANSWER.maskOffset }, {
      yPercent: 0, duration: ANSWER.wordDuration, ease: 'expo.out', stagger: ANSWER.wordStagger,
    }, 'answer');
  }
  if (stop) {
    const at = `answer+=${lastWord + ANSWER.stopAfter}`;
    tl.fromTo(stop, { scale: 0, transformOrigin: '50% 50%' }, {
      scale: 1, duration: ANSWER.stopDuration, ease: 'back.out(3)',
    }, at);
    tl.addLabel('stop', at);
  }
  if (steps.length) {
    tl.fromTo(steps, { opacity: 0, y: ANSWER.stepRise }, {
      opacity: 1, y: 0, duration: ANSWER.stepDuration, ease: 'expo.out', stagger: ANSWER.stepStagger,
    }, `answer+=${ANSWER.stepsAfter}`);
  }
}

/** W3: the doors are dealt in, alternating up and down, and land flat. */
function dealDoors(tl, el) {
  const doors = qsa(el, '.door');
  if (!doors.length) return;
  const flat = isPhone();
  const from = flat
    ? { opacity: 0, y: DEAL.y }
    : {
      opacity: 0,
      y: (i) => (i % 2 ? DEAL.y : -DEAL.y),
      rotationY: (i) => (i % 2 ? -DEAL.rotationY : DEAL.rotationY),
      transformPerspective: DEAL.perspective,
    };
  const to = flat
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0, rotationY: 0, transformPerspective: DEAL.perspective };
  tl.fromTo(doors, from, {
    ...to, duration: DEAL.duration, ease: 'expo.out', stagger: DEAL.stagger, clearProps: 'transform',
  }, `in+=${DEAL.after}`);
}

const CHOREOGRAPHY = {
  'one-message': (event) => {
    const { tl, toEl, dir } = event;
    strikeSearches(tl, toEl, dir, leadLabel(tl, toEl, event));
    if (tl.labels.struck !== undefined) landAnswer(tl, toEl);
  },
  founder: ({ tl, toEl }) => dealDoors(tl, toEl),
  situations: (event) => leadInGroup(event.tl, event.toEl, event),
  find: (event) => leadInGroup(event.tl, event.toEl, event),
};

/** Film 'cut' listener. */
export function addCutTweens(event) {
  CHOREOGRAPHY[event.toEl?.id]?.(event);
}
