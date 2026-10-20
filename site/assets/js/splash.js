/**
 * Splash (Round 5, DIRECTION W1, C1): the match cut into the hero globe.
 *
 * The markup (plan/round5/snippets/splash.html) and its CSS (visual.css) paint
 * with the HTML, and the CSS alone draws the monogram: the C ring (420 ms),
 * then the W (260 ms), then one sheen band. This module only adds the match
 * cut: at MATCH_AT_MS the C ring becomes an aperture that slides and grows
 * until it sits exactly on the hero globe's horizon (the globe's anchor
 * circle, the same circle dotglobe.js draws), while the ink backdrop falls
 * away and the hero shows through. The globe circle is read before the ring
 * moves. It then dispatches `cs:splash-aperture` ({ x, y, r }) on document,
 * so dotglobe draws its limb on the same frame and fires the hero arc, and
 * the ring fades out (80 ms). `cs:splash-done` follows when the splash is
 * gone (also after a skip). Total ≤ 1.1 s from the mark's first frame (500 +
 * 340 + 60 = 900 ms), and CAP_MS enforces it: whatever is still running then
 * fades in SKIP_MS. A script that arrives too late for the match cut fades the
 * splash at once. done() records the User Timing measure `cs-splash`.
 *
 * - Once per session (sessionStorage['cs-splash']); the snippet's inline
 *   script hides the splash before first paint on later pages.
 * - Any input (pointer down, key, wheel, touch) finishes it in 150 ms.
 * - Reduced motion (html.rm or the OS setting): the monogram shows for at
 *   most 300 ms, then fades over 200 ms.
 * - It never waits for film.ready or fonts, never traps focus (aria-hidden,
 *   nothing focusable), and uses WAAPI only (no GSAP), so it runs first.
 * - If this script is late, the CSS fallback (1.0 s) has already faded it:
 *   remove it at once. The snippet's inline listener sets html.splash-done on
 *   that fade's animationend, so nothing waits on a splash that is gone.
 *
 * Also exports the anchor geometry dotglobe.js shares (anchorBox, circleOfBox),
 * so the aperture and the globe agree to the pixel.
 */

const SESSION_KEY = 'cs-splash';
const MEASURE = 'cs-splash'; // User Timing: the mark's first frame to splash-done (perf-gate reads it)
const MATCH_AT_MS = 500; // after the mark starts: the C (0-380), W (240-480) and sheen (220-580) are CSS
const MATCH_MS = 340;
const RING_FADE_MS = 60;
const CAP_MS = 1000; // W1: the splash is done by 1.1 s from its first frame, whatever happens (+ SKIP_MS fade)
const LATE_MS = 120; // a script arriving this long after MATCH_AT_MS skips the match cut
const W_FADE_MS = 160;
const SKIP_MS = 150;
const RM_HOLD_MS = 300;
const RM_FADE_MS = 200;
const CSS_FALLBACK_MS = 1000; // visual.css fades the splash by itself from here (keep in sync)
const MARK = Object.freeze({ cx: 24, cy: 24, r: 19, size: 48 }); // the C ring inside the 48-unit mark
const GLOBE_FILL = 0.94; // the globe's radius as a share of its anchor's half-size
const MIN_ANCHOR_PX = 24;
const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
const EASE_IN = 'cubic-bezier(.55,0,1,.45)';
const EASE_TRAVEL = 'cubic-bezier(.55,0,.25,1)'; // the ring visibly leaves the centre and settles onto the horizon (a pure ease-in read as a pop)
const SVG_NS = 'http://www.w3.org/2000/svg';

const state = { phase: 'idle', aperture: null };

/** Where the splash is: 'idle' | 'running' | 'done', plus the aperture circle once the match cut landed. */
export function splashState() {
  return { ...state };
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

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, Math.max(0, ms)); });
const finished = (anim) => anim.finished.catch(() => {});

function seen() {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return true;
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* storage blocked: play it, it is short */
  }
  return false;
}

/**
 * The C ring as a circle in a full-viewport SVG, in screen px. Its centre and
 * radius animate (CSS cx / cy / r), not a transform, so the stroke stays 2 px
 * and the pathLength-based gap stays on the right at every size.
 */
function makeAperture(from) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'splash__aperture');
  svg.setAttribute('focusable', 'false');
  const ring = document.createElementNS(SVG_NS, 'circle');
  ring.setAttribute('cx', String(from.x));
  ring.setAttribute('cy', String(from.y));
  ring.setAttribute('r', String(from.r));
  ring.setAttribute('pathLength', '100');
  svg.appendChild(ring);
  return { svg, ring };
}

/** Mark's C ring in viewport px. */
function markCircle(mark) {
  const box = mark.getBoundingClientRect();
  const k = box.width / MARK.size;
  return { x: box.left + MARK.cx * k, y: box.top + MARK.cy * k, r: MARK.r * k };
}

export function initSplash() {
  const el = document.getElementById('splash');
  const html = document.documentElement;
  let startedAt = null;
  const done = () => {
    if (startedAt !== null && state.phase !== 'done') {
      try { performance.measure(MEASURE, { start: startedAt }); } catch { /* User Timing L3 missing: no measure */ }
    }
    state.phase = 'done';
    el?.remove();
    html.classList.add('splash-done');
    document.dispatchEvent(new CustomEvent('cs:splash-done'));
  };
  const mark = el?.querySelector('.splash__mark');
  // The C's CSS draw is the clock (the mask's paths come first and never animate); pending → now.
  const clock = mark?.querySelector('.splash__c')?.getAnimations?.()[0]?.startTime;
  const elapsed = performance.now() - (clock ?? performance.now());
  if (!el || seen() || html.classList.contains('splash-skip') || elapsed >= CSS_FALLBACK_MS || (clock == null && performance.now() > CSS_FALLBACK_MS)) {
    done();
    return Promise.resolve();
  }
  html.classList.add('splash-js'); // JS owns the exit now: stops the CSS fallback fade
  state.phase = 'running';
  const reduced = html.classList.contains('rm') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  startedAt = clock ?? performance.now();
  let skip = null;
  const skipped = new Promise((resolve) => { skip = resolve; });
  const onInput = () => skip();
  SKIP_EVENTS.forEach((name) => window.addEventListener(name, onInput, { once: true, passive: true }));
  const cleanup = () => SKIP_EVENTS.forEach((name) => window.removeEventListener(name, onInput));

  async function fadeAll(ms) {
    if (el.animate) await finished(el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: ms, fill: 'forwards' }));
  }

  async function play() {
    if (reduced) {
      await wait(startedAt + RM_HOLD_MS - performance.now());
      await fadeAll(RM_FADE_MS);
      return;
    }
    if (performance.now() - startedAt > MATCH_AT_MS + LATE_MS) { // too late to cut and still make the cap
      await fadeAll(SKIP_MS);
      return;
    }
    await wait(startedAt + MATCH_AT_MS - performance.now());
    if (state.phase !== 'running' || !mark || !el.animate) return;
    await matchCut();
  }

  async function matchCut() {
    const to = heroCircle() || { x: window.innerWidth / 2, y: window.innerHeight / 2, r: Math.min(window.innerWidth, window.innerHeight) * 0.3 };
    const from = markCircle(mark);
    const { svg, ring } = makeAperture(from);
    el.appendChild(svg);
    const frames = [
      { cx: `${from.x}px`, cy: `${from.y}px`, r: `${from.r}px` },
      { cx: `${to.x}px`, cy: `${to.y}px`, r: `${to.r}px` },
    ];
    mark.querySelector('.splash__c')?.setAttribute('visibility', 'hidden'); // the aperture takes the C's place on this frame
    const grow = ring.animate(frames, { duration: MATCH_MS, easing: EASE_TRAVEL, fill: 'forwards' });
    el.querySelector('.splash__bg')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MATCH_MS, easing: EASE_IN, fill: 'forwards' });
    mark.animate([{ opacity: 1 }, { opacity: 0 }], { duration: W_FADE_MS, fill: 'forwards' }); // the W and the sheen
    await finished(grow);
    if (state.phase !== 'running') return;
    state.aperture = { x: to.x, y: to.y, r: to.r };
    document.dispatchEvent(new CustomEvent('cs:splash-aperture', { detail: { ...state.aperture } }));
    await finished(svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: RING_FADE_MS, fill: 'forwards' }));
  }

  wait(startedAt + CAP_MS - performance.now()).then(() => skip()); // after done() this is a no-op
  const skipping = skipped.then(async () => {
    if (state.phase !== 'running') return;
    state.phase = 'skipping';
    await fadeAll(SKIP_MS);
  });
  return Promise.race([play(), skipping]).then(() => { cleanup(); done(); }, () => { cleanup(); done(); });
}
