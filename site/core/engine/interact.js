/**
 * Pointer physics, Round 5 (DIRECTION §4.4): only three survive.
 *
 * 1. Magnetic pull on the hero CTA only ([data-magnetic], ≤ 6 px). Written to
 *    --mag-x/--mag-y, which fx.css feeds into the CSS `translate` property, so
 *    it adds to (never fights) GSAP's `transform`.
 * 2. Row flood helpers: a row floods from the edge the pointer came in by
 *    (--flood-from on the row; fx.css §2 does the flood itself).
 * 3. The Partners tier panels (.tier) tilt toward the pointer, ≤ 4°, desktop.
 * The arrow nudge is pure CSS (base.css .btn__arrow, fx.css .row__arrow).
 *
 * GSAP 3.12 writes `translate`/`rotate` inline as `none` on every element it
 * tweens; that reset is lifted while an effect runs and put back afterwards.
 * Rects are read on pointerenter and cached per element until the next cut or
 * resize (one pointer hub, cached rects: DIRECTION §12). Fine pointers in cut
 * mode only; touch gets pressed states in CSS; flow mode and html.rm get none.
 */
import { finePointer } from './perf.js';

const MAGNETIC = '[data-magnetic]';
const MAGNETIC_SKIP = '[data-magnetic="none"]';
const MAG_STRENGTH = 0.2; // share of the pointer's offset from the centre
const MAG_MAX_PX = 6;
const ROW = '.row:is(a, button)';
const TILT = '.tier';
const TILT_SKIP = '[data-tilt="none"]';
const TILT_MAX_DEG = 4;
const TILT_MIN_DEG = 1.2;
const TILT_REF_PX = 360; // panels this wide get the full angle; wider ones tilt less
const PERSPECTIVE_PX = 1000;
const WIDE_QUERY = '(min-width: 760px)';
const TYPING = 'input:not([type="checkbox"]):not([type="radio"]), select, textarea';
const GSAP_RESET = 'none';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ---------- GSAP's inline reset ---------- */

function liftReset(el, prop) {
  if (el.style[prop] !== GSAP_RESET) return;
  el.style.removeProperty(prop);
  (el.csFxReset ||= new Set()).add(prop);
}
function restoreReset(el) {
  if (!el.csFxReset?.size) return;
  el.csFxReset.forEach((prop) => { el.style[prop] = GSAP_RESET; });
  el.csFxReset.clear();
}

/* ---------- 1 · magnetic ---------- */

function magnetize(el, x, y, r) {
  liftReset(el, 'translate');
  const dx = clamp((x - (r.left + r.width / 2)) * MAG_STRENGTH, -MAG_MAX_PX, MAG_MAX_PX);
  const dy = clamp((y - (r.top + r.height / 2)) * MAG_STRENGTH, -MAG_MAX_PX, MAG_MAX_PX);
  el.style.setProperty('--mag-x', `${dx.toFixed(1)}px`);
  el.style.setProperty('--mag-y', `${dy.toFixed(1)}px`);
  el.classList.add('is-magnet');
}
function releaseMagnet(el) {
  if (!el) return;
  el.style.removeProperty('--mag-x');
  el.style.removeProperty('--mag-y');
  el.classList.remove('is-magnet');
  restoreReset(el);
}

/* ---------- 2 · row flood ---------- */

/** Flood from the edge nearest to where the pointer entered: top or bottom. */
export function setFloodFrom(row, clientY) {
  const r = row.getBoundingClientRect();
  row.style.setProperty('--flood-from', clientY - r.top < r.height / 2 ? '50% 0%' : '50% 100%');
}

/* ---------- 3 · tier tilt ---------- */

function setupTilt(el) {
  if (el.csTilt) return;
  el.csTilt = true;
  el.classList.add('fx-tilt');
  if (getComputedStyle(el).position === 'static') el.classList.add('fx-rel');
  const parent = el.parentElement;
  if (parent && getComputedStyle(parent).perspective === 'none') parent.style.perspective = `${PERSPECTIVE_PX}px`;
}
function tilt(el, x, y, r) {
  setupTilt(el);
  liftReset(el, 'rotate');
  const nx = clamp((x - r.left) / r.width, 0, 1);
  const ny = clamp((y - r.top) / r.height, 0, 1);
  const max = clamp(TILT_MAX_DEG * (TILT_REF_PX / Math.max(1, r.width)), TILT_MIN_DEG, TILT_MAX_DEG);
  const typing = !!el.querySelector(`:is(${TYPING}):focus`);
  const ax = typing ? 0 : (0.5 - ny) * 2 * max;
  const ay = typing ? 0 : (nx - 0.5) * 2 * max;
  const angle = Math.hypot(ax, ay);
  el.style.rotate = angle > 0.01 ? `${ax.toFixed(3)} ${ay.toFixed(3)} 0 ${angle.toFixed(2)}deg` : '';
  el.classList.add('is-tilting');
}
function releaseTilt(el) {
  if (!el) return;
  el.style.rotate = '';
  el.classList.remove('is-tilting');
  restoreReset(el);
}

/* ---------- entry ---------- */

function pick(target, selector, skip) {
  const el = target?.closest?.(selector);
  return el && !(skip && el.matches(skip)) ? el : null;
}

const motionAllowed = (film) => {
  const h = document.documentElement;
  const cut = typeof film?.mode === 'string' ? film.mode === 'cut' : !!film?.enabled;
  return cut && finePointer() && !h.classList.contains('rm');
};

export function initInteract({ film } = {}) {
  if (!motionAllowed(film)) return;
  const wide = window.matchMedia(WIDE_QUERY);
  const live = { magnet: null, card: null };
  let cache = new WeakMap();
  const rect = (el) => {
    if (!cache.has(el)) cache.set(el, el.getBoundingClientRect());
    return cache.get(el);
  };
  let pending = null;
  let frame = 0;

  function update() {
    frame = 0;
    if (!pending) return;
    const { target, x, y } = pending;
    const magnet = pick(target, MAGNETIC, MAGNETIC_SKIP);
    const card = wide.matches ? pick(target, TILT, TILT_SKIP) : null;
    if (magnet !== live.magnet) releaseMagnet(live.magnet);
    if (card !== live.card) releaseTilt(live.card);
    Object.assign(live, { magnet, card });
    if (magnet) magnetize(magnet, x, y, rect(magnet));
    if (card) tilt(card, x, y, rect(card));
  }

  function releaseAll() {
    pending = null;
    releaseMagnet(live.magnet);
    releaseTilt(live.card);
    Object.assign(live, { magnet: null, card: null });
    cache = new WeakMap();
  }

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (!live.magnet && !live.card && !e.target?.closest?.(`${MAGNETIC}, ${TILT}`)) return;
    pending = { target: e.target, x: e.clientX, y: e.clientY };
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const row = e.target?.closest?.(ROW);
    if (row && !row.contains(e.relatedTarget)) setFloodFrom(row, e.clientY);
    if (live.magnet || live.card) {
      pending = { target: e.target, x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(update);
    }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', releaseAll);
  window.addEventListener('blur', releaseAll);
  window.addEventListener('resize', releaseAll, { passive: true });
  if (typeof film.on === 'function') film.on('cut', releaseAll);
}
