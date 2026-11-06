/**
 * Splash (client, 2026-11-07: calm): a ~1 s logo and name card on every film page when the site
 * is opened or refreshed.
 *
 * The markup (the #splash block, the same in every film shell) and its CSS (visual.css §1) play
 * the whole card by themselves from the first frame, so a late script never holds the page:
 *
 *      0-240 ms  the card fades in: the Cargado mark (the MARK_PATHS C and W), the name
 *                (SITE_NAME, Times, Title Case, the full stop), the founder and the city; it holds
 *    720-1000    the whole splash fades out evenly and the page shows (the CSS splash-out; the
 *                same end is the fallback without this script)
 *
 * This module adds what CSS cannot: the names from config.js, the skip, and the events. At
 * APERTURE (the fade beginning) it dispatches `cs:splash-aperture` ({ x, y, r }:
 * the hero globe's circle, else a centred one), so the first landing's in group rises as the
 * splash fades and dotglobe draws its limb and fires the hero arc; `cs:splash-done` follows when
 * the splash is gone (also after a skip). done() records the User Timing measure `cs-splash`.
 *
 * - When: only on an open and a refresh (owner, 2026-10-28). Moving between the site's own
 *   pages (a same-origin referrer on a 'navigate') and back/forward skip it: the shell's inline
 *   script mirrors splashWanted() and sets html.splash-skip before first paint (keep the two in sync).
 * - Any input (pointer down, key, wheel, touch) fades it in SKIP_MS and finishes it.
 * - Reduced motion (html.rm or the OS setting): the CSS shows the card still, on the same clock.
 * - It never waits for film.ready or fonts, never traps focus (aria-hidden, nothing focusable),
 *   and uses WAAPI only (no GSAP), so it runs first.
 *
 * Also exports the anchor geometry dotglobe.js shares (anchorBox, circleOfBox), so the aperture
 * and the globe agree to the pixel.
 */
import { SITE_NAME, FOUNDER_NAME, FOUNDER_LAST_NAME, ADDRESS } from '../../assets/js/config.js';
import { MARK_PATHS, MARK_PARTS } from './mark-draw.js';

const MEASURE = 'cs-splash'; // User Timing: the splash's first frame to splash-done (perf-gate reads it)
/** The CSS timeline in ms (visual.css §1 delays; change both together). */
export const SPLASH_MS = Object.freeze({ aperture: 720, end: 1000 });
const SKIP_MS = 150;
const GLOBE_FILL = 0.94; // the globe's radius as a share of its anchor's half-size
const MIN_ANCHOR_PX = 24;
const CENTRE_SHARE = 0.3; // no hero globe: the aperture is a centred circle of this share of the short side
const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

const state = { phase: 'idle', aperture: null };

/** Where the splash is: 'idle' | 'running' | 'skipping' | 'done', plus the aperture circle once sent. */
export function splashState() {
  return { ...state };
}

/**
 * True when this load should play the splash: an open or a refresh. A move between the site's
 * own pages (a same-origin referrer) and back/forward do not. type: the navigation entry's type.
 */
export function splashWanted({ type = 'navigate', referrer = '', origin = '' } = {}) {
  if (type === 'back_forward') return false;
  if (type !== 'navigate' || !referrer) return true;
  try {
    return new URL(referrer).origin !== origin;
  } catch {
    return true;
  }
}

/** The name card's text from config: the site name in two lines, the founder, the city. */
export function splashNames(config = { SITE_NAME, FOUNDER_NAME, FOUNDER_LAST_NAME, ADDRESS }) {
  const words = String(config.SITE_NAME || '').trim().split(/\s+/).filter(Boolean);
  const founder = [config.FOUNDER_NAME, config.FOUNDER_LAST_NAME].filter(Boolean).join(' ');
  const city = [config.ADDRESS?.city, config.ADDRESS?.province].filter(Boolean).join(', ');
  return {
    lines: words.length > 1 ? [words[0], words.slice(1).join(' ')] : words,
    founder: founder ? `${founder}, Founder` : '',
    city,
  };
}

/**
 * Box of `el` relative to its scene, ignoring transforms (the in/out group
 * moves the pan; the anchor's home position is what counts). Viewport px when
 * the scene sits at the top of the viewport, which is where every scene lands.
 */
export function anchorBox(el, scene = el.closest('.scene')) {
  let x = 0;
  let y = 0;
  let node = el;
  while (node && node !== scene) {
    x += node.offsetLeft;
    y += node.offsetTop;
    const parent = node.offsetParent;
    if (!parent || (scene && !scene.contains(parent) && parent !== scene)) {
      const a = el.getBoundingClientRect();
      const s = scene ? scene.getBoundingClientRect() : { left: 0, top: 0 };
      return { x: a.left - s.left, y: a.top - s.top, w: a.width, h: a.height };
    }
    node = parent;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/** The globe circle that fills a box: centred, GLOBE_FILL of the shorter half-side. */
export function circleOfBox({ x, y, w, h }) {
  return { x: x + w / 2, y: y + h / 2, r: (Math.min(w, h) / 2) * GLOBE_FILL };
}

/** The hero globe's circle, or null when the first scene shows no globe. */
function heroCircle() {
  const scene = document.querySelector('.scene');
  const mode = scene?.dataset.globeMode;
  if (!scene || !mode || mode === 'hidden' || mode === 'medallion') return null;
  const anchor = scene.querySelector('[data-globe-anchor]');
  if (!anchor) return null;
  const box = anchorBox(anchor, scene);
  return box.w >= MIN_ANCHOR_PX && box.h >= MIN_ANCHOR_PX ? circleOfBox(box) : null;
}

const centreCircle = () => ({
  x: window.innerWidth / 2, y: window.innerHeight / 2, r: Math.min(window.innerWidth, window.innerHeight) * CENTRE_SHARE,
});

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, Math.max(0, ms)); });
const finished = (anim) => anim.finished.catch(() => {});

/** Names from config into the card, and the mark's paths from MARK_PATHS (one source for the C and W). */
function fill(el) {
  const names = splashNames();
  const set = (key, text) => { const node = el.querySelector(`[data-splash="${key}"]`); if (node && text) node.textContent = text; };
  set('founder', names.founder);
  set('city', names.city);
  const spans = el.querySelectorAll('[data-splash="name"] .splash__line > span');
  names.lines.forEach((line, i) => {
    const span = spans[i];
    if (!span) return;
    const stop = span.querySelector('.splash__stop');
    span.textContent = line;
    if (stop) span.appendChild(stop);
  });
  el.querySelectorAll(MARK_PARTS.c).forEach((path) => path.setAttribute('d', MARK_PATHS.c));
  el.querySelectorAll(MARK_PARTS.w).forEach((path) => path.setAttribute('d', MARK_PATHS.w));
}

function sendAperture() {
  if (state.aperture) return;
  state.aperture = heroCircle() || centreCircle();
  document.dispatchEvent(new CustomEvent('cs:splash-aperture', { detail: { ...state.aperture } }));
}

export function initSplash() {
  const el = document.getElementById('splash');
  const html = document.documentElement;
  // The CSS splash-out run on .splash started on the splash's first frame: its startTime is the clock.
  const clock = el?.getAnimations?.().find((a) => a.animationName === 'splash-out')?.startTime;
  const startedAt = Number.isFinite(clock) ? clock : performance.now();
  const done = () => {
    if (state.phase !== 'done' && state.phase !== 'idle') {
      try { performance.measure(MEASURE, { start: startedAt }); } catch { /* User Timing L3 missing: no measure */ }
    }
    state.phase = 'done';
    el?.remove();
    html.classList.add('splash-done');
    document.dispatchEvent(new CustomEvent('cs:splash-done'));
  };
  const late = performance.now() - startedAt >= SPLASH_MS.end;
  if (!el || html.classList.contains('splash-skip') || late) {
    done();
    return Promise.resolve();
  }
  state.phase = 'running';
  fill(el);
  let skip = null;
  const skipped = new Promise((resolve) => { skip = resolve; });
  const onInput = () => skip();
  SKIP_EVENTS.forEach((name) => window.addEventListener(name, onInput, { once: true, passive: true }));
  const cleanup = () => SKIP_EVENTS.forEach((name) => window.removeEventListener(name, onInput));

  async function fadeAll(ms) {
    if (el.animate) await finished(el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: ms, fill: 'forwards' }));
  }

  async function play() {
    await wait(startedAt + SPLASH_MS.aperture - performance.now());
    if (state.phase !== 'running') return;
    sendAperture();
    await wait(startedAt + SPLASH_MS.end - performance.now());
  }

  const skipping = skipped.then(async () => {
    if (state.phase !== 'running') return;
    state.phase = 'skipping';
    await fadeAll(SKIP_MS);
  });
  return Promise.race([play(), skipping]).then(() => { cleanup(); done(); }, () => { cleanup(); done(); });
}
