/**
 * Splash (Round 3). The markup and its critical CSS are inline in every page,
 * so the CW monogram, wordmark and gold progress line paint before any script
 * runs. This module dismisses it once the fonts and the film are ready, never
 * before MIN_MS or after MAX_MS from navigation start, with an iris that opens
 * from the centre into the hero (a clip-path polygon with a circular hole).
 * Reduced motion / flow mode: a short fade. The first key, wheel, touch or
 * click dismisses it at once. The splash is aria-hidden and holds nothing
 * focusable, so it never traps focus; the page underneath is live the whole
 * time. If this script never runs, the inline CSS fades the splash out by itself.
 */
import { fontsReady } from './film-events.js';
import { sfx } from './sfx.js';

const MIN_MS = 900;
const MAX_MS = 2200;
const IRIS_MS = 760;
const FADE_MS = 220;
const IRIS_POINTS = 40;
const FILL_MS = 260; // progress line completes before the iris opens
const CSS_FALLBACK_MS = 2600; // the inline CSS fades the splash by itself at this point (keep in sync)
const CSS_MARGIN_MS = 150;
const EARLY_EVENTS = ['keydown', 'wheel', 'touchstart', 'pointerdown'];
const IRIS_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

/** clip-path covering the box except a circle of radius r px at the centre (evenodd). */
function irisPath(r) {
  const ring = Array.from({ length: IRIS_POINTS }, (_, i) => {
    const a = (i / IRIS_POINTS) * Math.PI * 2;
    return `calc(50% + ${(Math.cos(a) * r).toFixed(1)}px) calc(50% + ${(Math.sin(a) * r).toFixed(1)}px)`;
  });
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${ring.join(', ')}, ${ring[0]})`;
}

function remove(el) {
  el.remove();
  document.documentElement.classList.add('splash-done');
}

function open(el, reduced) {
  if (!el.animate) return Promise.resolve();
  if (reduced) return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: 'forwards' }).finished;
  const radius = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 4;
  return el.animate(
    [{ clipPath: irisPath(0) }, { clipPath: irisPath(radius) }],
    { duration: IRIS_MS, easing: IRIS_EASE, fill: 'forwards' },
  ).finished;
}

export function initSplash({ film }) {
  const el = document.getElementById('splash');
  if (!el) return Promise.resolve();
  const html = document.documentElement;
  if (performance.now() > CSS_FALLBACK_MS - CSS_MARGIN_MS) {
    remove(el); // late script: the CSS fallback already took it away
    return Promise.resolve();
  }
  html.classList.add('splash-js'); // JS owns the exit now: stops the CSS fallback fade
  const reduced = !film.enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let done = false;
  let early = null;
  const earlyGate = new Promise((resolve) => { early = resolve; });
  EARLY_EVENTS.forEach((name) => window.addEventListener(name, () => early(), { once: true, passive: true }));

  async function dismiss() {
    if (done) return;
    done = true;
    el.classList.add('is-leaving');
    sfx.play('splash');
    if (!reduced) await wait(FILL_MS);
    await open(el, reduced).catch(() => {});
    remove(el);
  }

  const ready = Promise.all([fontsReady(), film.ready]);
  const atLeast = wait(MIN_MS - performance.now());
  const atMost = wait(MAX_MS - performance.now());
  return Promise.race([ready.then(() => atLeast), atMost, earlyGate]).then(dismiss, dismiss);
}
