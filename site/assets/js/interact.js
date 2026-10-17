/**
 * Cursor physics (Round 3): magnetic controls and 3D tilt cards.
 *
 * Magnetic: buttons, chips, icon buttons, the WhatsApp float and anything with
 * [data-magnetic] lean toward the pointer. Written to --mag-x/--mag-y, which
 * base.css feeds into the CSS `translate` property, so it adds to (never
 * fights) GSAP's `transform`.
 *
 * Tilt: [data-tilt] and the card classes in TILT turn toward the pointer with
 * the CSS `rotate` property (axis + angle) under a perspective set on their
 * parent; [data-depth="px"] children lift by translateZ while tilting, and a
 * spotlight sheen follows the pointer through --mx/--my.
 *
 * GSAP 3.12 folds the CSS translate/rotate/scale properties into `transform`
 * and writes them inline as `none` on every element it tweens. That reset would
 * cancel the pull and the lift on a scroll-animated element, so it is lifted
 * while the effect runs and put back afterwards (see liftReset). Wrapping such
 * an element is still the cleaner choice (ENGINE.md §11).
 *
 * Fine pointers in film mode only. Touch gets pressed-state feedback in CSS;
 * reduced motion and the "Pause animation" flow mode get neither.
 */
import { finePointer, onIdle } from './perf.js';

const MAGNETIC = '[data-magnetic], .btn, .wa-float, .chip, .icon-link, .motion-toggle, .sound-toggle, .nav-toggle';
const MAGNETIC_SKIP = '[data-magnetic="none"], .btn--block, .phone-bar *';
const MAG_STRENGTH = 0.28; // share of the pointer's offset from the centre
const MAG_MAX_PX = 10;
const CHIP_STRENGTH = 0.18;
export const TILT = '[data-tilt], .panel-3d, .partner-card, .tile, .tier, .ticket, .offer, .intro, .inquiry-panel, .legal-panel, .vframe';
const TILT_SKIP = '[data-tilt="none"]';
const TILT_MAX_DEG = 7;
const TILT_MIN_DEG = 1.2;
const TILT_REF_PX = 360; // cards this wide get the full angle; wider ones tilt less
const PERSPECTIVE_PX = 1000;
const DEFAULT_DEPTH_PX = 24;
const TYPING = 'input:not([type="checkbox"]):not([type="radio"]), select, textarea';
const GSAP_RESET = 'none'; // what GSAP writes inline on translate/rotate/scale of an element it transforms
const MAGNET_PROPS = ['translate', 'scale'];
const DEPTH_PROPS = ['translate'];
const TILT_PROPS = ['rotate'];

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ---------- GSAP's inline reset ---------- */

/** Remove GSAP's inline `none` from these properties while an effect needs them (cheap when absent). */
function liftReset(el, props) {
  props.forEach((prop) => {
    if (el.style[prop] !== GSAP_RESET) return;
    el.style.removeProperty(prop);
    if (!el._fxReset) el._fxReset = new Set();
    el._fxReset.add(prop);
  });
}

/** Put GSAP's reset back once the effect is over, so its view of the element never changes. */
function restoreReset(el) {
  if (!el._fxReset?.size) return;
  el._fxReset.forEach((prop) => { el.style[prop] = GSAP_RESET; });
  el._fxReset.clear();
}

/* ---------- magnetic ---------- */

function magnetize(el, x, y) {
  liftReset(el, MAGNET_PROPS);
  const r = el.getBoundingClientRect();
  const k = el.matches('.chip') ? CHIP_STRENGTH : MAG_STRENGTH;
  const dx = clamp((x - (r.left + r.width / 2)) * k, -MAG_MAX_PX, MAG_MAX_PX);
  const dy = clamp((y - (r.top + r.height / 2)) * k, -MAG_MAX_PX, MAG_MAX_PX);
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

/* ---------- tilt ---------- */

function addSheen(el) {
  const sheen = document.createElement('span');
  sheen.className = 'fx-sheen';
  sheen.setAttribute('aria-hidden', 'true');
  sheen.innerHTML = '<span class="fx-sheen__glow"></span>';
  el.appendChild(sheen);
}

/** Once per card: classes, parent perspective, sheen layer, depth children. */
function setupTilt(el) {
  if (el._tilt) return;
  el._tilt = true;
  el.classList.add('fx-tilt');
  if (getComputedStyle(el).position === 'static') el.classList.add('fx-rel');
  const parent = el.parentElement;
  if (parent && getComputedStyle(parent).perspective === 'none') parent.style.perspective = `${PERSPECTIVE_PX}px`;
  el._depthLayers = Array.from(el.querySelectorAll('[data-depth]'));
  el._depthLayers.forEach((d) => d.style.setProperty('--depth', `${parseFloat(d.dataset.depth) || DEFAULT_DEPTH_PX}px`));
  el.classList.toggle('has-depth', el._depthLayers.length > 0);
  addSheen(el);
}

/**
 * Set every card up when the browser is idle, not on its first hover: the
 * parent perspective then shapes the scroll reveals the same way from the start.
 * Cards rendered later are set up on their first hover.
 */
function prepareTilts() {
  document.querySelectorAll(TILT).forEach((el) => {
    if (!el.matches(TILT_SKIP)) setupTilt(el);
  });
}

function tilt(el, x, y) {
  setupTilt(el);
  liftReset(el, TILT_PROPS);
  el._depthLayers.forEach((d) => liftReset(d, DEPTH_PROPS));
  const r = el.getBoundingClientRect();
  const nx = clamp((x - r.left) / r.width, 0, 1);
  const ny = clamp((y - r.top) / r.height, 0, 1);
  const max = clamp(TILT_MAX_DEG * (TILT_REF_PX / Math.max(1, r.width)), TILT_MIN_DEG, TILT_MAX_DEG);
  const typing = !!el.querySelector(`:is(${TYPING}):focus`);
  const ax = typing ? 0 : (0.5 - ny) * 2 * max; // rotateX: top edge toward the viewer when the pointer is high
  const ay = typing ? 0 : (nx - 0.5) * 2 * max;
  const angle = Math.hypot(ax, ay);
  el.style.rotate = angle > 0.01 ? `${ax.toFixed(3)} ${ay.toFixed(3)} 0 ${angle.toFixed(2)}deg` : '';
  el.style.setProperty('--mx', `${(nx * 100).toFixed(1)}%`);
  el.style.setProperty('--my', `${(ny * 100).toFixed(1)}%`);
  el.classList.add('is-tilting');
}

function releaseTilt(el) {
  if (!el) return;
  el.style.rotate = '';
  el.classList.remove('is-tilting');
  restoreReset(el);
  el._depthLayers?.forEach(restoreReset);
}

/* ---------- entry ---------- */

function pick(target, selector, skip) {
  const el = target?.closest?.(selector);
  return el && !el.matches(skip) ? el : null;
}

export function initInteract({ film }) {
  if (!film.enabled || !finePointer()) return;
  const live = { magnet: null, card: null };
  let pending = null;
  let frame = 0;

  function update() {
    frame = 0;
    if (!pending) return;
    const { target, x, y } = pending;
    const magnet = pick(target, MAGNETIC, MAGNETIC_SKIP);
    const card = pick(target, TILT, TILT_SKIP);
    if (magnet !== live.magnet) releaseMagnet(live.magnet);
    if (card !== live.card) releaseTilt(live.card);
    Object.assign(live, { magnet, card });
    if (magnet) magnetize(magnet, x, y);
    if (card) tilt(card, x, y);
  }

  function releaseAll() {
    pending = null;
    releaseMagnet(live.magnet);
    releaseTilt(live.card);
    Object.assign(live, { magnet: null, card: null });
  }

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    pending = { target: e.target, x: e.clientX, y: e.clientY };
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', releaseAll);
  window.addEventListener('blur', releaseAll);
  film.on('scene', releaseAll);
  film.ready.then(() => onIdle(prepareTilts));
}
