/**
 * Stage layers (Round 5, DIRECTION §9.6, C30, C31, W3): stars, grain and the
 * gold field's sheen. All decorative and aria-hidden; visual.css styles them.
 *
 * - Stars (#stars): drawn ONCE on a static canvas, redrawn only when the
 *   viewport size changes. Count and DPR by tier (tierConfig: 180 / 110 / 0).
 *   Ink only (visual.css hides them on other fields). On tier A the first
 *   scene and every #close get a compositor translate drift (≤ 5 s, CSS) on
 *   arrival. A scene with data-stars="dim" (long text: inquiry, apply) dims
 *   them to --stars-op-long. No rAF loop, no pointer push, no twinkle.
 * - Grain (.grain): a static tile (visual.css). It jitters with steps(6) only
 *   while html.is-cutting on tier A, also pure CSS.
 * - Gold sheen: when a cut enters a gold field, one band crosses the metal
 *   (the --sheen-x custom property on .stage, read by the .fields and .iris
 *   pseudo-elements), appended to the cut's timeline, so it moves only during
 *   the scene's entry.
 *
 * initLayers({ film, tier }) runs on idle (main.js), never on legal.
 */
import { tierConfig, onTierChange } from './tier.js';

const STAR_COLORS = ['243, 236, 221', '212, 175, 55']; // warm ivory, gold
const STAR_GOLD_SHARE = 0.22;
const STAR_SEED = 0x51a25;
const STAR_MIN_AREA = 9000; // px² per star at most density: small screens get fewer
const RESIZE_DEBOUNCE_MS = 150;
const SHEEN_AT = 0.3; // s after the iris label: the band crosses while the gold swells
const SHEEN_S = 0.9;
const SHEEN_FROM = '-60%';
const SHEEN_TO = '160%';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The same field every time (screenshots and seek tests compare frames). */
function createStars(count) {
  const rand = mulberry32(STAR_SEED);
  return Array.from({ length: count }, () => ({
    x: rand(),
    y: rand(),
    r: 0.35 + rand() * 0.95,
    a: 0.25 + rand() * 0.6,
    color: STAR_COLORS[rand() < STAR_GOLD_SHARE ? 1 : 0],
  }));
}

function ensure(stage, selector, make) {
  const found = stage.querySelector(selector);
  if (found) return found;
  const el = make();
  el.setAttribute('aria-hidden', 'true');
  const scenes = stage.querySelector('.scenes');
  stage.insertBefore(el, scenes || null);
  return el;
}

function initStars(canvas, cfg) {
  const ctx = canvas.getContext('2d');
  if (!ctx || cfg.stars <= 0) return () => {};
  const view = { w: 0, h: 0, dpr: 0 };

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, cfg.dpr);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (w === view.w && h === view.h && dpr === view.dpr) return;
    Object.assign(view, { w, h, dpr });
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const count = Math.min(cfg.stars, Math.round((w * h) / STAR_MIN_AREA));
    createStars(count).forEach((s) => {
      ctx.fillStyle = `rgba(${s.color}, ${s.a})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  let timer = 0;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(draw, RESIZE_DEBOUNCE_MS);
  };
  draw();
  window.addEventListener('resize', onResize);
  return () => {
    window.removeEventListener('resize', onResize);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}

/** Tier A drift on arrival at the first scene and #close: alternate two keyframe sets, so it restarts without a reflow and never jumps. */
function initDrift(canvas, film) {
  let flip = false;
  return film.on('landed', ({ index, id }) => {
    if (index !== 0 && id !== 'close') return;
    flip = !flip;
    canvas.classList.toggle('drift-a', flip);
    canvas.classList.toggle('drift-b', !flip);
  });
}

function initCutHooks(stage, canvas, film) {
  return film.on('cut', ({ toEl, toField, fieldChange, tl }) => {
    canvas.toggleAttribute('data-dim', toEl?.dataset.stars === 'dim');
    if (toField !== 'gold' || !fieldChange || !tl) return;
    const at = tl.labels && 'iris' in tl.labels ? `iris+=${SHEEN_AT}` : 0;
    tl.fromTo(stage, { '--sheen-x': SHEEN_FROM }, { '--sheen-x': SHEEN_TO, duration: SHEEN_S, ease: 'power2.inOut', immediateRender: false }, at);
  });
}

export function initLayers({ film, tier, stage = document.querySelector('.stage') } = {}) {
  if (!stage || !film) return;
  const stars = ensure(stage, '#stars', () => Object.assign(document.createElement('canvas'), { id: 'stars' }));
  ensure(stage, '.grain', () => Object.assign(document.createElement('div'), { className: 'grain' }));
  if (film.mode === 'flow') return; // flow: CSS hides both; nothing to draw
  const cfg = tierConfig(tier);
  const stopStars = initStars(stars, cfg);
  const offs = [initCutHooks(stage, stars, film)];
  if (cfg.starDrift) offs.push(initDrift(stars, film));
  onTierChange(({ tier: next }) => {
    if (next !== 'C') return;
    stopStars();
    offs.forEach((off) => typeof off === 'function' && off());
    stars.classList.remove('drift-a', 'drift-b');
  });
}
