/**
 * Cursor ring (decorative; the native cursor stays visible). It eases to the
 * pointer and morphs with what is under it:
 *   links, buttons, chips  → grows (.is-hover)
 *   text inputs, textareas → an I-beam bar (.is-text)
 *   [data-cursor-label]    → a larger ring with that short label (.is-label), sized
 *                            to fit it; also when the label is on (or inside) a link
 *                            or button
 * The loop only runs while the ring is still catching up, and sleeps in hidden
 * tabs. Fine pointers in film mode only.
 */
import { createLoop, finePointer } from './perf.js';

const FOLLOW_PER_S = 22; // exponential follow rate; higher is snappier
const SETTLED_PX = 0.15;
const LINK = 'a, button, select, summary, label, [role="button"], [data-cursor]';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="color"]):not([type="file"]), textarea, [contenteditable="true"], [contenteditable=""]';
const LABEL = '[data-cursor-label]';
const MAX_LABEL_CHARS = 14;
const RING_PX = 36;          // .cursor-ring width in base.css
const LABEL_SCALE = 2.5;     // the smallest label ring (fx.css default)
const LABEL_PAD_PX = 12;     // clear space between the label and the ring on each side

function makeRing() {
  const ring = document.querySelector('.cursor-ring') || document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<span class="cursor-ring__label"></span>';
  if (!ring.isConnected) document.body.appendChild(ring);
  return ring;
}

/** The ring scale that fits a label with clear space on both sides (measured once per text). */
const labelScales = new Map();
function scaleFor(labelEl, text) {
  if (!labelScales.has(text)) {
    const fit = (labelEl.offsetWidth + LABEL_PAD_PX * 2) / RING_PX;
    labelScales.set(text, Math.max(LABEL_SCALE, fit));
  }
  return labelScales.get(text);
}

const labelMode = (el) => ({ mode: 'is-label', label: el.dataset.cursorLabel.slice(0, MAX_LABEL_CHARS) });

/**
 * The morph for whatever the pointer is over. Text fields win. A label wins
 * when it sits on the link itself or inside it (a card that is one big link);
 * a link inside a labelled card shows the plain grow instead.
 */
function modeFor(target) {
  if (!target?.closest) return { mode: '' };
  if (target.closest(TEXT)) return { mode: 'is-text' };
  const card = target.closest(LABEL);
  const link = target.closest(LINK);
  if (card && (!link || link.contains(card))) return labelMode(card);
  if (link) return { mode: 'is-hover' };
  return { mode: '' };
}

export function initCursor({ film }) {
  if (!film.enabled || !finePointer()) return;
  const ring = makeRing();
  const label = ring.querySelector('.cursor-ring__label');
  const pos = { x: -100, y: -100, tx: -100, ty: -100 };
  let mode = '';

  const loop = createLoop((now, dt) => {
    const k = 1 - Math.exp(-dt * FOLLOW_PER_S);
    pos.x += (pos.tx - pos.x) * k;
    pos.y += (pos.ty - pos.y) * k;
    ring.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    return Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > SETTLED_PX;
  });

  function setMode(next) {
    if (next.mode === mode && next.mode !== 'is-label') return;
    ring.classList.remove('is-hover', 'is-text', 'is-label');
    if (next.mode) ring.classList.add(next.mode);
    if (next.mode === 'is-label') {
      label.textContent = next.label;
      ring.style.setProperty('--ring-label-scale', scaleFor(label, next.label).toFixed(3));
    }
    mode = next.mode;
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    pos.tx = e.clientX;
    pos.ty = e.clientY;
    if (!ring.classList.contains('is-visible')) {
      pos.x = pos.tx;
      pos.y = pos.ty;
      ring.classList.add('is-visible');
    }
    loop.wake();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => ring.classList.remove('is-visible'));
  document.addEventListener('pointerover', (e) => setMode(modeFor(e.target)), { passive: true });
  document.addEventListener('pointerdown', () => ring.classList.add('is-down'), { passive: true });
  document.addEventListener('pointerup', () => ring.classList.remove('is-down'), { passive: true });
}
