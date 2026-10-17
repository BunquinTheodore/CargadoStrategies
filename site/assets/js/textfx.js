/**
 * Text effects (Round 3).
 *
 * (a) chars  — headings split into characters that rise, fade and turn up out
 *              of a slight rotateX, staggered and scrubbed on the film timeline.
 * (b) decode — eyebrows scramble through glyphs and lock in left to right (the
 *              Portfolio decode.js idea). The text state is a pure function of
 *              the in/out progress values the timeline sets, so it scrubs both
 *              ways and survives any seek.
 * (c) roll   — hover letter-roll on .btn, nav links and [data-roll]: every
 *              letter rolls up to reveal its copy, staggered.
 *
 * (a) and (b) run through film-reveals.js (see autoKind for the defaults);
 * (c) is started by main.js. Accessibility: split text keeps one readable
 * copy for assistive tech (.tx-sr / .roll__sr, visually hidden) and an
 * aria-hidden visual copy, so accessible names never get spelled out letter by
 * letter. Read such text with readableText(el), not textContent.
 * Opt out on any element with data-fx="none" (or data-roll="none" for the roll).
 */
import { kernWords } from './kerning.js';

const CHAR_RISE = 70; // yPercent a character starts below its place
const CHAR_TURN = -75; // rotateX a character starts at (fine pointers only)
const CHAR_OUT_RISE = -50;
const CHAR_OUT_TURN = 55;
const CHAR_STAGGER = 0.012; // share of the in-phase between characters
const CHAR_SPREAD_MAX = 0.4; // share of the in-phase the whole stagger may take
const CHAR_OUT_SPREAD = 0.25;
const DECODE_GLYPHS = '#%&$?*<>/=+§';
const DECODE_LEAD = 0.28; // share of the progress each character flickers before it locks
const DECODE_TICKS = 36; // glyph changes across a full decode
const DECODE_DUR = 0.55; // share of the in/out phase the decode takes
const DECODE_MIN_DUR = 0.05; // film seconds: the shortest a capped decode-in may get
const ROLL_STEP_MS = 14;
const WHITESPACE = /([ \t\n\r]+)/;
const ROLL_TARGETS = '.btn, .site-nav__link, [data-roll]';
const ROLL_SKIP = '.visually-hidden, .btn__arrow, svg, .ph, .roll, [data-roll="none"]';
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

const depthAllowed = () => window.matchMedia('(pointer: fine)').matches;

/* ---------- shared: readable copy + visual copy ---------- */

function textNodes(root, skip) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (!n.nodeValue.trim() || (skip && n.parentElement.closest(skip))
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

/**
 * Move the element's content into a visually hidden copy for assistive tech
 * and return an aria-hidden clone to animate. Done once per element.
 */
function visualCopy(el) {
  if (el._txVisual) return el._txVisual;
  const readable = document.createElement('span');
  readable.className = 'visually-hidden tx-sr';
  readable.append(...el.childNodes);
  const visual = document.createElement('span');
  visual.className = 'tx-vis';
  visual.setAttribute('aria-hidden', 'true');
  readable.childNodes.forEach((node) => visual.appendChild(node.cloneNode(true)));
  visual.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  el.append(readable, visual);
  el._txVisual = visual;
  return visual;
}

/** Plain text of an element, ignoring the visual copy (HUD titles etc.). */
export function readableText(el) {
  const sr = el.querySelector(':scope > .tx-sr');
  if (sr) return sr.textContent.trim().replace(/\s+/g, ' ');
  const copy = el.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
  return copy.textContent.trim().replace(/\s+/g, ' ');
}

const hasFocusable = (el) => !!el.querySelector(FOCUSABLE);

/* ---------- which effect ---------- */

/**
 * Effect for a reveal element in film mode. Defaults: scene eyebrows decode,
 * h1/h2 line reveals become character reveals. data-fx="none" keeps what the
 * markup asks for; data-fx="lines" keeps a heading on line reveals.
 */
export function autoKind(el) {
  const asked = el.dataset.reveal;
  if (el.dataset.fx === 'none' || hasFocusable(el)) return asked;
  if (el.hasAttribute('data-decode') || (el.matches('.eyebrow') && (asked === 'fade' || !asked))) return 'decode';
  if (asked === 'chars') return 'chars';
  if (asked === 'lines' && el.matches('h1, h2') && el.dataset.fx !== 'lines') return 'chars';
  return asked;
}

/* ---------- (a) characters ---------- */

function charSpan(ch) {
  const span = document.createElement('span');
  span.className = 'tx-char';
  span.textContent = ch;
  return span;
}

function wordSpan(word) {
  const span = document.createElement('span');
  span.className = 'tx-word';
  Array.from(word).forEach((ch) => span.appendChild(charSpan(ch)));
  return span;
}

function splitTextNode(node) {
  const frag = document.createDocumentFragment();
  node.nodeValue.split(WHITESPACE).forEach((part) => {
    if (!part) return;
    frag.appendChild(WHITESPACE.test(part) ? document.createTextNode(part) : wordSpan(part));
  });
  node.replaceWith(frag);
}

/** Split once; returns the character spans in reading order. */
export function prepareChars(el) {
  const visual = visualCopy(el);
  if (!el._txChars) {
    textNodes(visual).forEach(splitTextNode);
    kernWords(visual.querySelectorAll('.tx-word')); // inline-block letters lose the font's kerning
    el._txChars = Array.from(visual.querySelectorAll('.tx-char'));
  }
  return el._txChars;
}

function charStagger(count, { at, dur, phase, end }, spread) {
  if (count < 2) return 0;
  const room = Number.isFinite(end) ? Math.max(0, end - at - dur) : phase;
  return Math.min(phase * CHAR_STAGGER, (phase * spread) / (count - 1), room / (count - 1));
}

export function charsIn(tl, chars, opts) {
  const turn = depthAllowed() ? CHAR_TURN : 0;
  const stagger = charStagger(chars.length, opts, CHAR_SPREAD_MAX);
  tl.fromTo(chars,
    /* The 50% 100% origin comes from fx.css (.tx-char): passing it here made GSAP
       re-read every character's computed origin, one forced style pass each. */
    { opacity: 0, yPercent: CHAR_RISE, rotationX: turn },
    { opacity: 1, yPercent: 0, rotationX: 0, duration: opts.dur, ease: 'power3.out', stagger }, opts.at);
}

export function charsOut(tl, chars, { at, dur, phase }) {
  const turn = depthAllowed() ? CHAR_OUT_TURN : 0;
  const stagger = chars.length > 1 ? (phase * CHAR_OUT_SPREAD) / (chars.length - 1) : 0;
  tl.fromTo(chars, { opacity: 1, yPercent: 0, rotationX: 0 },
    { opacity: 0, yPercent: CHAR_OUT_RISE, rotationX: turn, duration: dur, ease: 'power2.in', stagger, immediateRender: false }, at);
}

/* ---------- (b) decode ---------- */

function decodeCell(ch) {
  const cell = document.createElement('span');
  cell.className = 'dc-c';
  const inner = document.createElement('span');
  inner.textContent = ch;
  cell.appendChild(inner);
  return { el: cell, key: '' };
}

function wrapDecodeNode(node, cells) {
  const frag = document.createDocumentFragment();
  Array.from(node.nodeValue).forEach((ch) => {
    if (/\s/.test(ch)) {
      frag.appendChild(document.createTextNode(ch));
      return;
    }
    const cell = decodeCell(ch);
    cells.push(cell);
    frag.appendChild(cell.el);
  });
  node.replaceWith(frag);
}

/** State of character i of n: 'on' | 'glyph' | 'off', from in-progress p and out-progress q (0–1). */
function cellState(i, n, p, q) {
  const x = n > 1 ? i / (n - 1) : 0;
  if (q > 0) {
    const flip = x * (1 - DECODE_LEAD);
    if (q < flip) return 'on';
    return q < flip + DECODE_LEAD ? 'glyph' : 'off';
  }
  const lock = DECODE_LEAD + x * (1 - DECODE_LEAD);
  if (p >= lock) return 'on';
  return p >= lock - DECODE_LEAD ? 'glyph' : 'off';
}

function drawDecode(item) {
  const { cells, progress } = item;
  const { p, q } = progress;
  const tick = Math.floor((p + q) * DECODE_TICKS);
  cells.forEach((cell, i) => {
    const s = cellState(i, cells.length, p, q);
    const glyph = s === 'glyph' ? DECODE_GLYPHS[(tick + i * 7) % DECODE_GLYPHS.length] : '';
    const key = glyph || s;
    if (cell.key === key) return;
    cell.key = key;
    cell.el.className = `dc-c${s === 'glyph' ? ' is-g' : ''}${s === 'off' ? ' is-off' : ''}`;
    if (glyph) cell.el.dataset.g = glyph;
  });
}

/** Wrap once; returns the decode state ({ cells, progress, draw }). Resting state: fully decoded. */
export function prepareDecode(el) {
  if (!el._txDecode) {
    const cells = [];
    textNodes(visualCopy(el)).forEach((node) => wrapDecodeNode(node, cells));
    const item = { cells, progress: { p: 1, q: 0 } };
    item.draw = () => drawDecode(item);
    el._txDecode = item;
  }
  const item = el._txDecode;
  item.progress.p = 1;
  item.progress.q = 0;
  item.draw();
  return item;
}

/** A late decode (4th+ reveal, or a big data-delay) is shortened, and if need be started earlier, so it locks in by `end` (the fully-in point). */
function decodeSpan({ at, phase, end }) {
  const dur = phase * DECODE_DUR;
  if (!Number.isFinite(end)) return { start: at, dur };
  const start = Math.min(at, end - DECODE_MIN_DUR);
  return { start, dur: Math.max(DECODE_MIN_DUR, Math.min(dur, end - start)) };
}

export function decodeIn(tl, item, opts) {
  const { start, dur } = decodeSpan(opts);
  tl.fromTo(item.progress, { p: 0 }, { p: 1, duration: dur, ease: 'none', onUpdate: item.draw }, start);
}

export function decodeOut(tl, item, { at, phase }) {
  tl.fromTo(item.progress, { q: 0 }, {
    q: 1, duration: phase * DECODE_DUR, ease: 'none', onUpdate: item.draw, immediateRender: false,
  }, at);
}

/* ---------- (c) hover letter-roll ---------- */

function rollWord(word, startIndex) {
  const span = document.createElement('span');
  span.className = 'roll-w';
  Array.from(word).forEach((ch, k) => {
    const c = document.createElement('span');
    c.className = 'roll-c';
    c.style.setProperty('--i', String(startIndex + k));
    c.textContent = ch;
    span.appendChild(c);
  });
  return span;
}

/** One text run → an aria-hidden rolling copy plus the same text, visually hidden, for assistive tech. */
function rollRun(node, startIndex) {
  const run = document.createElement('span'); // one inline run: a flex parent keeps its spaces
  run.className = 'roll';
  const visual = document.createElement('span');
  visual.className = 'roll__vis';
  visual.setAttribute('aria-hidden', 'true');
  const readable = document.createElement('span');
  readable.className = 'visually-hidden roll__sr';
  readable.textContent = node.nodeValue;
  let index = startIndex;
  node.nodeValue.split(WHITESPACE).forEach((part) => {
    if (!part) return;
    if (WHITESPACE.test(part)) {
      visual.appendChild(document.createTextNode(part));
      return;
    }
    visual.appendChild(rollWord(part, index));
    index += part.length;
  });
  run.append(visual, readable);
  node.replaceWith(run);
  return index;
}

/**
 * Wrap the label's text runs. Letters are inline blocks (so they can move), which
 * would spell names out letter by letter, hence the readable copy. Note that the
 * element's textContent now holds the label twice: read labels with readableText().
 */
export function prepareRoll(el) {
  if (el.dataset.rolled || el.matches('[data-roll="none"], [data-fx="none"]')) return;
  el.dataset.rolled = '1';
  let index = 0;
  textNodes(el, ROLL_SKIP).forEach((node) => { index = rollRun(node, index); });
  el.style.setProperty('--roll-step', `${ROLL_STEP_MS}ms`);
}


/**
 * Letter-roll on hover (fine pointers, film mode). Existing labels are wrapped
 * when the browser is idle; labels added later are wrapped on first hover.
 */
export function initRoll({ idle }) {
  const run = () => document.querySelectorAll(ROLL_TARGETS).forEach((el) => {
    if (!el.closest('.phone-bar')) prepareRoll(el);
  });
  idle(run);
  document.addEventListener('pointerover', (event) => {
    const el = event.target.closest?.(ROLL_TARGETS);
    if (el && !el.closest('.phone-bar')) prepareRoll(el);
  }, { passive: true });
}
