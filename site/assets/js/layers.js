/**
 * Persistent stage layers: star field, film grain, HUD and scroll cue.
 * All are decorative (aria-hidden) and switched off in flow / reduced-motion mode.
 * The cursor ring lives in cursor.js.
 *
 * Stars adapt to the device: fewer of them and DPR 1 on low-power devices
 * (perf.js), and the loop sleeps in hidden tabs, on fields where the stars are
 * invisible, and drops to a slow twinkle rate while nothing moves.
 */
import { createLoop, finePointer, lowPower } from './perf.js';

const STAR_AREA_PER_STAR = 5200; // px² of viewport per star
const STAR_MAX = 280;
const STAR_MAX_LOW = 110;
const STAR_PARALLAX_SCREENS = 2.4; // how far the nearest stars travel over the whole film
const STAR_STREAK_PER_VELOCITY = 1.6;
const STAR_STREAK_MAX = 90;
const STAR_DPR_MAX = 2;
const STAR_DPR_LOW = 1;
const STAR_RECOUNT_SHARE = 0.25; // add or drop stars only when the count changes by more than this share
const STAR_COLORS = ['243, 236, 221', '212, 175, 55']; // warm ivory, gold
const STAR_GOLD_SHARE = 0.22;
const STAR_OPACITY = { ink: 1, gold: 0.4, bone: 0.08 };
const STAR_VISIBLE_MIN = 0.01;
const IDLE_FRAME_MS = 60; // twinkle-only frame interval while nothing moves (~16 fps)
const ACTIVE_FOR_MS = 400; // full frame rate this long after the last scroll or pointer move
const PUSH_RADIUS = 140; // px around the cursor that pushes stars away (Portfolio star field)
const PUSH_FORCE = 0.5;
const PUSH_RETURN = 0.04; // share of the push a star gives back each frame
const CUE_UNTIL = 0.012; // scroll cue shows until this share of the film has played

const lerp = (a, b, t) => a + (b - a) * t;

function ensure(parent, selector, create) {
  const found = parent.querySelector(selector);
  if (found) return found;
  const el = create();
  parent.appendChild(el);
  return el;
}

function makeEl(tag, className, html = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.innerHTML = html;
  el.setAttribute('aria-hidden', 'true');
  return el;
}

/* ---------- stars ---------- */

function createStars(count) {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: 0.25 + Math.random() * 0.75,
    r: 0.4 + Math.random() * 1.1,
    phase: Math.random() * Math.PI * 2,
    color: STAR_COLORS[Math.random() < STAR_GOLD_SHARE ? 1 : 0],
    ox: 0,
    oy: 0,
  }));
}

function fieldOpacity(blend) {
  if (!blend) return STAR_OPACITY.ink;
  const from = STAR_OPACITY[blend.from] ?? 1;
  const to = STAR_OPACITY[blend.to] ?? 1;
  return lerp(from, to, blend.mix);
}

/** Stars near the cursor drift away from it, then settle back. */
function pushStar(s, x, y, pointer) {
  if (pointer) {
    const dx = x + s.ox - pointer.x;
    const dy = y + s.oy - pointer.y;
    const d = Math.hypot(dx, dy);
    if (d > 0 && d < PUSH_RADIUS) {
      const f = ((PUSH_RADIUS - d) / PUSH_RADIUS) ** 2 * PUSH_FORCE;
      s.ox += (dx / d) * f;
      s.oy += (dy / d) * f;
      return;
    }
  }
  s.ox -= s.ox * PUSH_RETURN;
  s.oy -= s.oy * PUSH_RETURN;
}

function drawStars(ctx, stars, { w, h, progress, velocity, now, pointer }) {
  ctx.clearRect(0, 0, w, h);
  const travel = progress * STAR_PARALLAX_SCREENS * h;
  const streak = Math.max(-STAR_STREAK_MAX, Math.min(STAR_STREAK_MAX, velocity * STAR_STREAK_PER_VELOCITY));
  stars.forEach((s) => {
    const baseX = s.x * w;
    const baseY = (((s.y * h - travel * s.z) % h) + h) % h;
    pushStar(s, baseX, baseY, pointer);
    const x = baseX + s.ox;
    const y = baseY + s.oy;
    const twinkle = 0.65 + 0.35 * Math.sin(now * 0.0012 + s.phase);
    const alpha = twinkle * (0.35 + 0.65 * s.z);
    const len = streak * s.z;
    if (Math.abs(len) > 1.5) {
      ctx.strokeStyle = `rgba(${s.color}, ${alpha * 0.8})`;
      ctx.lineWidth = s.r;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + len);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = `rgba(${s.color}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, s.r * s.z + 0.3, 0, Math.PI * 2);
    ctx.fill();
  });
}

const starCount = (w, h) => Math.min(lowPower() ? STAR_MAX_LOW : STAR_MAX, Math.round((w * h) / STAR_AREA_PER_STAR));

/**
 * Keep the stars (positions are 0–1, so they survive any size); add or drop
 * some only when the count really changes. Phones fire resize when the URL bar
 * moves, and a fresh random field would visibly jump mid-scroll.
 */
function fitStars(stars, count) {
  if (Math.abs(count - stars.length) <= stars.length * STAR_RECOUNT_SHARE) return stars;
  return count < stars.length ? stars.slice(0, count) : stars.concat(createStars(count - stars.length));
}

function initStars(canvas, film) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const view = { w: 0, h: 0, dpr: 0, progress: 0, velocity: 0, blend: null, pointer: null };
  let stars = [];
  let activeUntil = 0;
  let lastDraw = 0;
  let shownOpacity = -1;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower() ? STAR_DPR_LOW : STAR_DPR_MAX);
    const w = window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (w === view.w && h === view.h && dpr === view.dpr) return;
    Object.assign(view, { w, h, dpr });
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = fitStars(stars, starCount(w, h));
    lastDraw = 0;
  }

  /** Draw at full rate while things move, at a slow twinkle rate otherwise; park when invisible. */
  const loop = createLoop((now) => {
    const opacity = fieldOpacity(view.blend);
    if (Math.abs(opacity - shownOpacity) > 0.001) {
      canvas.style.opacity = opacity.toFixed(3);
      shownOpacity = opacity;
    }
    if (opacity <= STAR_VISIBLE_MIN) return false;
    if (now < activeUntil || now - lastDraw >= IDLE_FRAME_MS) {
      drawStars(ctx, stars, { ...view, velocity: film.velocity || 0, now });
      lastDraw = now;
    }
    return true;
  });
  const wake = () => {
    activeUntil = performance.now() + ACTIVE_FOR_MS;
    loop.wake();
  };

  if (finePointer()) {
    window.addEventListener('pointermove', (e) => {
      view.pointer = { x: e.clientX, y: e.clientY };
      wake();
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { view.pointer = null; });
  }
  film.on('progress', ({ progress, blend }) => {
    view.progress = progress;
    view.blend = blend;
    wake();
  });

  resize();
  window.addEventListener('resize', () => {
    resize();
    wake();
  });
  wake();
}

/* ---------- HUD ---------- */

const pad2 = (n) => String(n).padStart(2, '0');
const timecode = (seconds) => `${pad2(Math.floor(seconds / 60))}:${pad2(Math.floor(seconds % 60))}`;

const HUD_HTML = `
  <span class="hud__corner hud__corner--tl"></span><span class="hud__corner hud__corner--tr"></span>
  <span class="hud__corner hud__corner--bl"></span><span class="hud__corner hud__corner--br"></span>
  <div class="hud__readout">
    <span class="hud__index">01 / 01</span><span class="hud__sep"></span>
    <span class="hud__title"></span><span class="hud__time">00:00</span>
  </div>
  <div class="hud__bar"><span class="hud__fill"></span></div>`;

function initHud(stage, film) {
  const hud = ensure(stage, '.hud', () => makeEl('div', 'hud'));
  hud.setAttribute('aria-hidden', 'true');
  if (!hud.querySelector('.hud__readout')) hud.innerHTML = HUD_HTML;
  const index = hud.querySelector('.hud__index');
  const title = hud.querySelector('.hud__title');
  const time = hud.querySelector('.hud__time');
  const fill = hud.querySelector('.hud__fill');
  let lastSecond = -1;

  film.on('scene', (s) => {
    index.textContent = `${pad2(s.index + 1)} / ${pad2(s.count)}`;
    title.textContent = s.title;
  });
  film.on('progress', ({ time: t, progress }) => {
    const second = Math.floor(t);
    if (second !== lastSecond) {
      lastSecond = second;
      time.textContent = timecode(t);
    }
    fill.style.transform = `scaleX(${progress.toFixed(4)})`;
  });
}

/* ---------- scroll cue ---------- */

/** Bottom-centre line with a falling dot on the opening frame (Portfolio #cue); gone once the film moves. */
function initCue(stage, film) {
  if (document.querySelector('.story-cue')) return; // the page draws its own
  const cue = ensure(stage, '.scroll-cue', () => makeEl('div', 'scroll-cue'));
  cue.setAttribute('aria-hidden', 'true');
  const show = (progress) => cue.classList.toggle('is-on', progress < CUE_UNTIL);
  film.on('progress', ({ progress }) => show(progress));
  film.ready?.then(() => show(film.progress));
}

/* ---------- entry ---------- */

/** Create missing layer elements and start them. Flow mode: nothing animates. */
export function initLayers({ film, stage = document.querySelector('.stage') } = {}) {
  if (!stage) return;
  const stars = ensure(stage, '#stars', () => {
    const c = makeEl('canvas', '');
    c.id = 'stars';
    return c;
  });
  stars.setAttribute('aria-hidden', 'true');
  ensure(stage, '.grain', () => makeEl('div', 'grain'));
  if (!film.enabled) return;
  initStars(stars, film);
  initHud(stage, film);
  initCue(stage, film);
}
