/**
 * Legal page: 3D scene choreography and panel feedback (Round 3).
 *
 * Scrubbed on the film timeline (build listeners, reversible, transform/opacity only):
 *  - addRuleDraw      the gold heading rule draws in, retracts on the way out;
 *  - addNumeralDepth  the ghost chapter numeral swings in from depth behind the heading;
 *  - addSheetFan      the two paper sheets behind each document fan out, collapse on exit;
 *  - addItemCascade   clauses / questions rise in one after another, in perspective;
 *  - addIndexFold     the contents cards fold back in depth as the opening scene leaves.
 *
 * Interaction (film mode): a soft tick while a document scrolls, a field tone when an
 * answer opens, and a "Scroll" cursor label on documents that scroll inside their box.
 */
import { sfx } from './sfx.js';

const RULE = { at: 0.5, dur: 0.45, outDur: 0.5 }; // shares of the in/out phase
const NUMERAL = { at: 0.2, dur: 0.6, outDur: 0.55, z: -320, turn: 38, outZ: 140, outTurn: 16, perspective: 700 };
const SHEETS = { at: 0.55, dur: 0.4, outDur: 0.4 };
const CASCADE = { at: 0.48, dur: 0.3, stagger: 0.05, rise: 18, turn: -14, perspective: 800 };
const FOLD = { dur: 0.5, stagger: 0.06, turn: 55, z: -90 };
const PANEL_TICK_PX = 110; // one tick per this much scroll inside a document
const OVERFLOW_SLACK_PX = 8; // a face this much taller than its box counts as scrollable
const SCROLL_LABEL = 'Scroll';

const depthOn = () => window.matchMedia('(pointer: fine)').matches;
const cssPx = (el, name) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

/* ---------- scrubbed scene tweens ---------- */

export function addRuleDraw({ tl, sceneEl, timing }) {
  const rule = sceneEl.querySelector('.legal-rule');
  if (!rule) return;
  if (timing.inDur) {
    tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: timing.inDur * RULE.dur, ease: 'power2.out' },
      timing.inStart + timing.inDur * RULE.at);
  }
  if (timing.outDur) {
    tl.fromTo(rule, { scaleX: 1 }, { scaleX: 0, duration: timing.outDur * RULE.outDur, ease: 'power2.in', immediateRender: false },
      timing.outStart);
  }
}

export function addNumeralDepth({ tl, sceneEl, timing }) {
  const numeral = sceneEl.querySelector('.legal-num');
  if (!numeral || !timing.inDur) return;
  const dir = sceneEl.querySelector('.legal-grid--mirror') ? -1 : 1;
  const turn = depthOn() ? NUMERAL.turn * dir : 0;
  tl.fromTo(numeral,
    { opacity: 0, z: NUMERAL.z, rotationY: turn, transformPerspective: NUMERAL.perspective },
    { opacity: 1, z: 0, rotationY: 0, duration: timing.inDur * NUMERAL.dur, ease: 'power3.out' },
    timing.inStart + timing.inDur * NUMERAL.at);
  if (timing.outDur) {
    tl.fromTo(numeral, { opacity: 1, z: 0, rotationY: 0 },
      { opacity: 0, z: NUMERAL.outZ, rotationY: depthOn() ? -NUMERAL.outTurn * dir : 0,
        duration: timing.outDur * NUMERAL.outDur, ease: 'power2.in', immediateRender: false },
      timing.outStart);
  }
}

function sheetRest(sheet, level) {
  const off = cssPx(sheet, '--sheet-off') * level;
  return { x: off, y: off, rotation: cssPx(sheet, '--sheet-turn') * level };
}

export function addSheetFan({ tl, sceneEl, timing }) {
  const sheets = Array.from(sceneEl.querySelectorAll('.legal-sheet'));
  if (!sheets.length || !timing.inDur) return;
  const flat = { x: 0, y: 0, rotation: 0 };
  sheets.forEach((sheet) => {
    const rest = sheetRest(sheet, sheet.classList.contains('legal-sheet--2') ? 2 : 1);
    tl.fromTo(sheet, flat, { ...rest, duration: timing.inDur * SHEETS.dur, ease: 'power2.out' },
      timing.inStart + timing.inDur * SHEETS.at);
    if (timing.outDur) {
      tl.fromTo(sheet, rest, { ...flat, duration: timing.outDur * SHEETS.outDur, ease: 'power2.in', immediateRender: false },
        timing.outStart);
    }
  });
}

export function addItemCascade({ tl, sceneEl, timing }) {
  const face = sceneEl.querySelector('.legal-panel__face');
  const items = face ? face.querySelectorAll(':scope > ol > li, :scope > details') : [];
  if (!items.length || !timing.inDur) return;
  const at = timing.inStart + timing.inDur * CASCADE.at;
  const dur = timing.inDur * CASCADE.dur;
  const room = Math.max(0, timing.focusTime - at - dur);
  const stagger = items.length > 1 ? Math.min(timing.inDur * CASCADE.stagger, room / (items.length - 1)) : 0;
  const turn = depthOn() ? CASCADE.turn : 0;
  tl.fromTo(items,
    { opacity: 0, y: CASCADE.rise, rotationX: turn, transformPerspective: CASCADE.perspective, transformOrigin: '50% 0%' },
    { opacity: 1, y: 0, rotationX: 0, duration: dur, stagger, ease: 'power2.out' },
    at);
}

export function addIndexFold({ tl, sceneEl, timing }) {
  const cards = sceneEl.querySelectorAll('.toc__link');
  if (!cards.length || !timing.outDur || !depthOn()) return;
  tl.fromTo(cards, { rotationX: 0, z: 0 },
    { rotationX: FOLD.turn, z: FOLD.z, transformOrigin: '50% 100%', duration: timing.outDur * FOLD.dur,
      stagger: timing.outDur * FOLD.stagger, ease: 'power2.in', immediateRender: false },
    timing.outStart);
}

/* ---------- interaction ---------- */

const sceneIndex = (el) => Array.from(document.querySelectorAll('.scene')).indexOf(el.closest('.scene'));

/** A soft tick per stretch of scrolling inside a document (the film's own tick stops there). */
function tickOnScroll(face) {
  let last = face.scrollTop;
  let travel = 0;
  face.addEventListener('scroll', () => {
    travel += Math.abs(face.scrollTop - last);
    last = face.scrollTop;
    if (travel < PANEL_TICK_PX) return;
    travel = 0;
    sfx.play('tick', { index: sceneIndex(face) });
  }, { passive: true });
}

/** "Scroll" cursor label on documents taller than their box (the wheel scrolls them, not the film). */
function labelWhenScrollable(face) {
  const update = () => {
    if (face.scrollHeight - face.clientHeight > OVERFLOW_SLACK_PX) face.dataset.cursorLabel = SCROLL_LABEL;
    else delete face.dataset.cursorLabel;
  };
  update();
  const observer = new ResizeObserver(update);
  [face, ...face.children].forEach((el) => observer.observe(el)); // children: an answer opening grows the content
}

/** A field-coloured tone when an answer opens (the summary's own click pop plays too). */
function toneOnOpen(details) {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    sfx.play('tone', { field: details.closest('[data-field]')?.dataset.field });
  });
}

export function initPanelFeedback({ film }) {
  document.querySelectorAll('.legal-panel__face--faq details').forEach(toneOnOpen);
  if (!film.enabled) return;
  document.querySelectorAll('.legal-panel__face').forEach((face) => {
    tickOnScroll(face);
    labelWhenScrollable(face);
  });
}
