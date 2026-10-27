/**
 * H2 · One message (W2), appended to the cut that enters it: four searches
 * arrive 80 ms apart from the 'iris' label (a J-cut; 'in' on a swap), a bar
 * wipes each one and the line dims; then, from just before the 'struck'
 * label, "One Message" rises, its stop pops and the steps settle with its
 * second word. The slower bars (owner, 2026-10-26) end the cut at about 2 s. fromTo with explicit end states
 * (immediate landings jump straight to the end); transform, opacity and two
 * registered custom properties only. Nothing loops.
 */

import { Section } from '../../../core/Section.js';
import { DEFAULT_ENTRANCE, itemStates, parseEntrance, wordStates } from '../../../core/engine/entrances.js';
import { isPhone, leadLabel, qsa } from '../_shared.js';

const STRIKE = Object.freeze({
  arrive: 0.35, // each line rises into place
  arriveStagger: 0.08,
  rise: 18, // px
  bar: 0.5, // each bar wipes from the left (slowed, owner 2026-10-26: was 0.14)
  barStagger: 0.2, // was 0.05
  barAfter: 0.16, // the first bar starts this long after the first line arrives
});
/** The answer after the problem: "One Message", its stop and the steps overlap the last bar. */
const ANSWER = Object.freeze({
  lead: 0.12, // the first word starts this long before 'struck' (the last bar is mostly drawn)
  wordDuration: 0.5,
  wordStagger: 0.07,
  stopAfter: 0.25, // after the last word starts (the stop lands by in + 1.0 s)
  stopDuration: 0.24,
  stepsAfter: 0.07, // after the first word: the steps start with the second
  stepDuration: 0.45,
  stepStagger: 0.06,
});

/** Lines that phones drop (.phone-hide) are left out, so the stagger has no gap. No layout reads. */
const shown = (els) => (isPhone() ? els.filter((el) => !el.classList.contains('phone-hide')) : els);

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
 * The replay uses the scene's entrance states (entrances.js): the killed engine fromTo has
 * already rendered its 'from' (a slide's xPercent and opacity), so the end state must undo it.
 */
function landAnswer(tl, el, entrance) {
  const words = qsa(el, '.one__title .rv-word');
  const stop = el.querySelector('.one__title .stop');
  const steps = qsa(el, '.one__steps > li');
  [words, stop ? [stop] : [], steps].forEach((targets) => {
    if (targets.length) tl.getTweensOf(targets).forEach((tween) => tween.kill());
  });
  const word = wordStates(entrance);
  const item = itemStates(entrance);
  const lastWord = ANSWER.wordStagger * Math.max(words.length - 1, 0);
  tl.addLabel('answer', `struck-=${ANSWER.lead}`);
  if (words.length) {
    tl.fromTo(words, { ...word.from }, {
      ...word.to, duration: ANSWER.wordDuration, ease: 'expo.out', stagger: ANSWER.wordStagger,
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
    tl.fromTo(steps, { ...item.from }, {
      ...item.to, duration: ANSWER.stepDuration, ease: 'expo.out', stagger: ANSWER.stepStagger,
    }, `answer+=${ANSWER.stepsAfter}`);
  }
}

export class OneMessage extends Section {
  static id = 'one-message';

  /** Film 'cut': only the cut that enters this scene. */
  cut(event) {
    const { tl, toEl, fromEl, dir } = event;
    if (toEl !== this.el) return;
    strikeSearches(tl, toEl, dir, leadLabel(tl, toEl, event));
    // the first landing always rises, as the engine's in group (cut.js keepOpacity)
    const entrance = fromEl ? parseEntrance(toEl.dataset.entrance) : DEFAULT_ENTRANCE;
    if (tl.labels.struck !== undefined) landAnswer(tl, toEl, entrance);
  }
}
