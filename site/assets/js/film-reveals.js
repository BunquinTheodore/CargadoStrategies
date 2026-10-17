/**
 * Reveal hooks: [data-reveal="lines|chars|fade|stagger|scale"] and [data-decode].
 *
 * Each builder adds scrubbed, reversible tweens to the master timeline. All
 * tweens are fromTo with explicit values so seeking in any direction (deep
 * links, rebuilds, scrubbing backwards) always lands on the right state.
 * Only transform and opacity are animated. Staggers are capped so the last
 * line or child still lands by the scene's fully-in point (`end`).
 *
 * Round 3: textfx.autoKind upgrades the defaults (eyebrows decode, h1/h2
 * reveal by character), and fade/scale/stagger gain a little depth
 * (rotateX + translateZ) on fine pointers. Phones stay 2D (film.js).
 */
import { splitWords, groupLines } from './film-split.js';
import { autoKind, prepareChars, prepareDecode, charsIn, charsOut, decodeIn, decodeOut } from './textfx.js';

const RISE_PX = 24;
const OUT_RISE_PX = -24;
const SCALE_FROM = 0.96;
const SCALE_OUT = 0.98;
const MASK_OFFSET = 110; // yPercent a word starts below its mask
const LINE_STAGGER = 0.07; // share of the in-phase between lines
const CHILD_STAGGER = 0.06; // share of the in-phase between stagger children
const OUT_STAGGER = 0.03;
const DEPTH = Object.freeze({ turn: 10, z: -60, outTurn: -8, outZ: -40, perspective: 900 });

const IN_EASE = 'power3.out';
const OUT_EASE = 'power2.in';

export const REVEAL_SELECTOR = '[data-reveal]';
const DECODE_SELECTOR = '[data-decode]';

const depthOn = () => window.matchMedia('(pointer: fine)').matches;

/** Depth added to a from-state (in) or to-state (out); empty on coarse pointers. */
function depth(phase) {
  if (!depthOn()) return {};
  return phase === 'in'
    ? { rotationX: DEPTH.turn, z: DEPTH.z, transformPerspective: DEPTH.perspective }
    : { rotationX: DEPTH.outTurn, z: DEPTH.outZ, transformPerspective: DEPTH.perspective };
}
const flat = () => (depthOn() ? { rotationX: 0, z: 0 } : {});

/**
 * Reveal elements of a scene, skipping those nested inside another reveal.
 * [data-decode] elements are kept even when nested: decoding changes glyphs,
 * not transforms, so it never fights the parent's reveal.
 */
export function revealTargets(sceneEl) {
  return Array.from(sceneEl.querySelectorAll(`${REVEAL_SELECTOR}, ${DECODE_SELECTOR}`)).filter(
    (el) => el.matches(DECODE_SELECTOR) || !el.parentElement.closest(REVEAL_SELECTOR),
  );
}

/**
 * Prepare the DOM (word masks, character splits, decode cells) and measure
 * lines, without layout thrashing: every split (write) runs first, then every
 * line measurement (read), so the browser lays out once, not once per element.
 */
export function prepareReveals(elements) {
  const items = elements.map((el) => {
    const kind = autoKind(el);
    if (kind === 'chars') return { el, kind, chars: prepareChars(el) };
    if (kind === 'decode') return { el, kind, decode: prepareDecode(el) };
    if (kind === 'lines') splitWords(el);
    return { el, kind };
  });
  items.forEach((item) => {
    if (item.kind === 'lines') item.lines = groupLines(item.el);
  });
  return items;
}

function addLinesIn(tl, lines, { at, dur, stagger }) {
  lines.forEach((words, i) => {
    tl.fromTo(words, { yPercent: MASK_OFFSET }, { yPercent: 0, duration: dur, ease: IN_EASE }, at + i * stagger);
  });
}

const inStates = {
  fade: () => [{ opacity: 0, y: RISE_PX, ...depth('in') }, { opacity: 1, y: 0, ...flat() }],
  scale: () => [{ opacity: 0, scale: SCALE_FROM, ...depth('in') }, { opacity: 1, scale: 1, ...flat() }],
};

/** Per-item stagger, shrunk when needed so `count` items starting at `at` all finish by `end`. */
function cappedStagger(step, count, { at, dur, end }) {
  if (count < 2 || !Number.isFinite(end)) return step;
  return Math.min(step, Math.max(0, end - at - dur) / (count - 1));
}

/**
 * Scrubbed in-animation. `at`, `dur` and `end` (latest finish, the fully-in
 * point) are timeline seconds; `phase` is the scene in-phase length.
 */
export function revealIn(tl, item, { at, dur, phase, end }) {
  const { el, kind } = item;
  if (kind === 'chars') return charsIn(tl, item.chars, { at, dur, phase, end });
  if (kind === 'decode') return decodeIn(tl, item.decode, { at, phase, end });
  if (kind === 'lines') {
    const stagger = cappedStagger(phase * LINE_STAGGER, item.lines.length, { at, dur, end });
    addLinesIn(tl, item.lines, { at, dur, stagger });
    return undefined;
  }
  if (kind === 'stagger') {
    const kids = Array.from(el.children);
    const stagger = cappedStagger(phase * CHILD_STAGGER, kids.length, { at, dur, end });
    tl.fromTo(kids, { opacity: 0, y: RISE_PX, ...depth('in') },
      { opacity: 1, y: 0, ...flat(), duration: dur, ease: IN_EASE, stagger }, at);
    return undefined;
  }
  const [from, to] = (inStates[kind] || inStates.fade)();
  tl.fromTo(el, from, { ...to, duration: dur, ease: IN_EASE }, at);
  return undefined;
}

/** Scrubbed out-animation: fade, rise and tip back out; lines leave upwards. */
export function revealOut(tl, item, { at, dur, phase }) {
  const { el, kind } = item;
  const common = { duration: dur, ease: OUT_EASE, immediateRender: false };
  if (kind === 'chars') return charsOut(tl, item.chars, { at, dur, phase });
  if (kind === 'decode') return decodeOut(tl, item.decode, { at, phase });
  if (kind === 'lines') {
    item.lines.forEach((words, i) => {
      tl.fromTo(words, { yPercent: 0 }, { yPercent: -MASK_OFFSET, ...common }, at + i * phase * OUT_STAGGER);
    });
    return undefined;
  }
  if (kind === 'stagger') {
    const kids = Array.from(el.children);
    tl.fromTo(kids, { opacity: 1, y: 0, ...flat() },
      { opacity: 0, y: OUT_RISE_PX, ...depth('out'), stagger: phase * OUT_STAGGER, ...common }, at);
    return undefined;
  }
  tl.fromTo(el, { opacity: 1, y: 0, scale: 1, ...flat() },
    { opacity: 0, y: OUT_RISE_PX, scale: SCALE_OUT, ...depth('out'), ...common }, at);
  return undefined;
}
