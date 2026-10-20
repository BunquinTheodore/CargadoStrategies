/**
 * Cursor ring (C39, DIRECTION §4.4): a 32 px ring that follows the pointer with
 * a 0.15 s ease (the quickTo feel, without a GSAP ticker), grows 1.9× over
 * links, buttons and rows, and shrinks while pressed. Decorative: the native
 * cursor stays. Fine pointer in cut mode, tiers A and B only (main.js never
 * loads it on legal). The loop runs only while the ring is catching up, so it
 * sleeps the moment the pointer stops (0 rAF callbacks at rest) and in hidden tabs.
 */
import { createLoop, finePointer } from './perf.js';

const FOLLOW_S = 0.15;   // the ring is within 5% of the pointer after this long
const TAU = FOLLOW_S / 3; // exponential time constant (e^-3 ≈ 5%)
const SETTLED_PX = 0.15;
const HOVER = 'a[href], button, select, summary, label, [role="button"], [role="tab"], .row, .chip, [data-cursor]';

function makeRing() {
  const ring = document.querySelector('.cursor-ring') || document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  if (!ring.isConnected) document.body.appendChild(ring);
  return ring;
}

const allowed = (film) => {
  const tier = document.documentElement.dataset.tier;
  const cut = typeof film?.mode === 'string' ? film.mode === 'cut' : !!film?.enabled;
  return cut && finePointer() && tier !== 'C';
};

export function initCursor({ film } = {}) {
  if (!allowed(film)) return;
  const ring = makeRing();
  const pos = { x: -100, y: -100, tx: -100, ty: -100 };
  let hover = false;

  const loop = createLoop((now, dt) => {
    const k = 1 - Math.exp(-dt / TAU);
    pos.x += (pos.tx - pos.x) * k;
    pos.y += (pos.ty - pos.y) * k;
    ring.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    return Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > SETTLED_PX;
  });

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
  document.addEventListener('pointerover', (e) => {
    const next = !!e.target?.closest?.(HOVER);
    if (next === hover) return;
    hover = next;
    ring.classList.toggle('is-hover', hover);
  }, { passive: true });
  document.addEventListener('pointerdown', () => ring.classList.add('is-down'), { passive: true });
  document.addEventListener('pointerup', () => ring.classList.remove('is-down'), { passive: true });
}
