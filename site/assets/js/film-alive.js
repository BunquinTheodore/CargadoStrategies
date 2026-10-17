/**
 * Alive at rest (from the Portfolio film): while the page sits still, the
 * active scene's revealed pieces drift with the cursor, headings most, and the
 * HUD leans a little. It writes the CSS `translate` property, which adds to the
 * film's own GSAP transforms instead of fighting them. Fine pointers only, and
 * never in flow / reduced-motion mode. The loop sleeps once the drift has
 * caught up with the cursor (and in hidden tabs).
 */
import { createLoop } from './perf.js';

const DRIFT_PX = 12; // drift at depth 1 when the cursor is at the window's edge
const HUD_DRIFT_PX = 6;
const SMOOTHING = 6; // per second; higher follows the cursor faster
const SETTLED = 0.0005; // normalised distance at which the drift counts as caught up
const HEADING = 'h1, h2, .display';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

const depthOf = (el) => (el.matches(HEADING) || el.querySelector(HEADING) ? 1 : 0.5);

/** The scene's revealed pieces with their depth, measured once per scene. */
function layersOf(sceneEl, cache) {
  if (!cache.has(sceneEl)) {
    const items = Array.from(sceneEl.querySelectorAll('[data-reveal]'))
      .filter((el) => !el.parentElement.closest('[data-reveal]'))
      .map((el) => [el, depthOf(el)]);
    cache.set(sceneEl, items);
  }
  return cache.get(sceneEl);
}

function write(el, x, y) {
  const value = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
  if (el._alive !== value) {
    el.style.translate = value;
    el._alive = value;
  }
}

function clear(items) {
  items.forEach(([el]) => {
    el.style.translate = '';
    el._alive = '';
  });
}

export function initAlive({ film, stage = document.querySelector('.stage') } = {}) {
  if (!film.enabled || !stage || !window.matchMedia(FINE_POINTER).matches) return;
  const cache = new Map();
  const hud = stage.querySelector('.hud');
  const mouse = { nx: 0, ny: 0, sx: 0, sy: 0 };
  let current = [];

  const loop = createLoop((now, dt) => {
    const k = 1 - Math.exp(-Math.min(0.05, dt) * SMOOTHING);
    mouse.sx += (mouse.nx - mouse.sx) * k;
    mouse.sy += (mouse.ny - mouse.sy) * k;
    current.forEach(([el, depth]) => write(el, mouse.sx * DRIFT_PX * depth, mouse.sy * DRIFT_PX * depth));
    if (hud) write(hud, mouse.sx * HUD_DRIFT_PX, mouse.sy * HUD_DRIFT_PX);
    return Math.abs(mouse.nx - mouse.sx) + Math.abs(mouse.ny - mouse.sy) > SETTLED;
  });

  window.addEventListener('pointermove', (e) => {
    mouse.nx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ny = (e.clientY / window.innerHeight) * 2 - 1;
    loop.wake();
  }, { passive: true });

  film.on('scene', ({ el }) => {
    clear(current);
    current = layersOf(el, cache);
    loop.wake();
  });
  film.on('rebuilt', () => cache.clear());
}
