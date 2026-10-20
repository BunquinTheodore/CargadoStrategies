/**
 * The in group of a cut (DIRECTION §4.4, §9.1; api.md §6).
 *
 * The Round 4 reveal hooks keep their names and now feed the "in" step of a
 * played cut timeline, in DOM order, a nested hook skipped (the outer one
 * wins):
 *   .eyebrow                  mask slide inside its own box
 *   [data-reveal="words"]     each word rises from its mask ("lines" and "chars" play as words)
 *   .rule                     scaleX from the left
 *   [data-reveal="fade"]      opacity and a 24 px rise (2D only)
 *   [data-reveal="stagger"]   its children as fade, 60 ms apart
 *   [data-reveal="scale"]     opacity and scale 0.96 → 1
 *   .stop                     pops after the last word of its heading (back.out)
 *   [data-frame]              an SVG hairline draws (stroke-dashoffset)
 *   [data-reveal="none"]      excluded: shows with its scene
 * data-delay="s" (0-0.6) moves an item to s seconds after the 'in' label.
 * Every slot is clamped so the group lands by 'settled'. Only transform,
 * opacity, clip-path and stroke-dashoffset are animated, all with fromTo, so
 * a cut seeked to any point (T5) shows the right state.
 */
import { splitWords } from './film-split.js';
import { CUT, DUR, EASE } from './motion-tokens.js';

export const IN_GROUP = '.eyebrow, [data-reveal], .rule, .stop, [data-frame]';
const WORD_KINDS = new Set(['words', 'lines', 'chars']);
const WORD_DUR = 0.5;
const ITEM_DUR = 0.45;
const RULE_DUR = 0.5;
const WORDS_AFTER = 0.08; // the headline starts this long after the 'in' label (the eyebrow leads)
const STOP_AFTER = 0.3; // the stop pops this long after its heading's last word starts (the word has landed)
const MAX_DELAY = 0.6;
const RISE_PX = 24;
const SCALE_FROM = 0.96;
const MASK_OFFSET = 110; // yPercent a word starts below its mask
const EYEBROW_OFFSET = 100;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function kindOf(el) {
  if (el.hasAttribute('data-reveal')) {
    const asked = el.dataset.reveal;
    if (asked === 'none') return 'none';
    if (WORD_KINDS.has(asked)) return 'words';
    return asked === 'stagger' || asked === 'scale' ? asked : 'fade';
  }
  if (el.classList.contains('stop')) return 'stop';
  if (el.hasAttribute('data-frame')) return 'frame';
  return el.classList.contains('rule') ? 'rule' : 'eyebrow';
}

/** A hook inside another hook is skipped, except the stop, which always pops on its own. */
function isOuter(el, sceneEl) {
  const parent = el.parentElement?.closest(IN_GROUP);
  if (!parent || !sceneEl.contains(parent)) return true;
  if (!el.classList.contains('stop')) return false;
  return !el.closest('[data-reveal="none"]');
}

function frameLength(el) {
  try {
    return Math.ceil(el.getTotalLength?.() || 0);
  } catch {
    return 0; // not rendered (display: none): nothing to draw
  }
}

/**
 * Collect and prepare a scene's in group: split headings into words, read
 * frame lengths. Call on every build (layout may have changed).
 */
export function prepareInGroup(sceneEl) {
  return Array.from(sceneEl.querySelectorAll(IN_GROUP))
    .filter((el) => isOuter(el, sceneEl))
    .map((el) => ({ el, kind: kindOf(el) }))
    .filter((item) => item.kind !== 'none')
    .map((item) => {
      if (item.kind === 'words') item.words = splitWords(item.el);
      if (item.kind === 'stagger') item.kids = Array.from(item.el.children);
      if (item.kind === 'frame') item.length = frameLength(item.el);
      if (item.kind === 'stop') item.heading = item.el.parentElement?.closest('[data-reveal]') || null;
      return item;
    });
}

/** The elements flow mode fades in (one per item; a heading fades as a whole). */
export const flowTargets = (items) => items.flatMap((item) => (item.kind === 'stagger' ? item.kids : [item.el]));

/** Stagger that fits `count` starts from `start` before `latest`, never above `step`. */
const fitStagger = (step, count, start, latest) => (count < 2 ? 0 : Math.min(step, Math.max(0, latest - start) / (count - 1)));

/**
 * Append the in group to `tl`, starting at `at` (the 'in' label time) and
 * landing by `settled`. `frameAt` (same-field cuts) is when [data-frame]
 * starts drawing; null draws it with the group. `keepOpacity` (the first
 * landing): "fade" items only rise, so text painted from the HTML is never
 * hidden again. Adds the 'stop' label.
 */
export function addInGroup(tl, items, { at, settled, frameAt = null, keepOpacity = false }) {
  let cursor = at;
  let stopAt = null;
  let wordsEnd = null;
  const lastWord = new Map();
  const latest = (dur) => Math.max(at, settled - dur);
  const slot = (item, natural, dur) => {
    const delay = parseFloat(item.el.dataset.delay);
    const t = Number.isFinite(delay) ? at + clamp(delay, 0, MAX_DELAY) : natural;
    return clamp(t, at, latest(dur));
  };
  const fadeIn = (targets, from, start, extra = {}) => {
    tl.fromTo(targets, from, { opacity: 1, y: 0, scale: 1, duration: ITEM_DUR, ease: EASE.stepIn, ...extra }, start);
  };

  items.forEach((item) => {
    const { el, kind } = item;
    if (kind === 'eyebrow') {
      const start = slot(item, cursor, DUR.eyebrow);
      tl.fromTo(el, { yPercent: EYEBROW_OFFSET, clipPath: 'inset(0% 0% 100% 0%)' },
        { yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.eyebrow, ease: EASE.stepIn, clearProps: 'clipPath' }, start);
      cursor = start + CUT.itemStagger;
    } else if (kind === 'words') {
      if (!item.words.length) return;
      const start = slot(item, Math.max(cursor, at + WORDS_AFTER), WORD_DUR);
      const stagger = fitStagger(CUT.wordStagger, item.words.length, start, latest(WORD_DUR));
      tl.fromTo(item.words, { yPercent: MASK_OFFSET },
        { yPercent: 0, duration: WORD_DUR, ease: EASE.stepIn, stagger }, start);
      const last = start + stagger * (item.words.length - 1);
      lastWord.set(el, last);
      wordsEnd = last + STOP_AFTER;
      cursor = last + CUT.itemStagger;
    } else if (kind === 'rule') {
      const start = slot(item, cursor, RULE_DUR);
      tl.fromTo(el, { scaleX: 0, transformOrigin: '0% 50%' },
        { scaleX: 1, duration: RULE_DUR, ease: EASE.stepIn }, start);
      cursor = start + CUT.itemStagger;
    } else if (kind === 'fade' || kind === 'scale') {
      const start = slot(item, cursor, ITEM_DUR);
      if (kind === 'fade' && keepOpacity) {
        tl.fromTo(el, { y: RISE_PX }, { y: 0, duration: ITEM_DUR, ease: EASE.stepIn }, start);
      } else {
        fadeIn(el, kind === 'fade' ? { opacity: 0, y: RISE_PX } : { opacity: 0, scale: SCALE_FROM }, start);
      }
      cursor = start + CUT.itemStagger;
    } else if (kind === 'stagger') {
      if (!item.kids.length) return;
      const start = slot(item, cursor, ITEM_DUR);
      const stagger = fitStagger(CUT.itemStagger, item.kids.length, start, latest(ITEM_DUR));
      fadeIn(item.kids, { opacity: 0, y: RISE_PX }, start, { stagger });
      cursor = start + stagger * (item.kids.length - 1) + CUT.itemStagger;
    } else if (kind === 'stop') {
      const anchor = lastWord.get(item.heading);
      const start = clamp((anchor ?? cursor - CUT.itemStagger) + STOP_AFTER, at, latest(DUR.stop));
      tl.fromTo(el, { scale: 0, transformOrigin: '50% 50%' },
        { scale: 1, duration: DUR.stop, ease: EASE.stop }, start);
      stopAt ??= start;
    } else if (kind === 'frame' && item.length > 0) {
      const start = clamp(frameAt ?? at, 0, latest(DUR.frame));
      tl.fromTo(el, { strokeDasharray: item.length, strokeDashoffset: item.length },
        { strokeDashoffset: 0, duration: DUR.frame, ease: EASE.same }, start);
    }
  });
  tl.addLabel('stop', stopAt ?? clamp(wordsEnd ?? at, at, latest(DUR.stop)));
}
