/**
 * Our story (story.html).
 *
 * 1. Globe poses from layout: every scene marks an empty box with
 *    [data-globe-anchor]; on each (re)build the box's on-screen rect becomes
 *    that scene's data-pose, so the globe always sits in reserved space and
 *    never covers text, at any viewport. Rotation comes from data-globe="rx,ry".
 *    A scene without a visible anchor (or one that starts below the fold, where
 *    the canvas would clip the globe) shrinks the globe away in place. When a
 *    scene is taller than the screen and pans, the globe canvas pans with it
 *    (transform only) and glides back while the next scene's pose takes over.
 * 2. Extra scrubbed tweens on the master timeline: hero drift, the founder
 *    frame, and the C·W monogram (the C sweeps open, the W rises).
 * 3. Round 3 depth (fine pointers only; phones stay 2D like the engine):
 *    the portrait stage swings in on rotateY with its plates stacked behind
 *    it, the monogram assembles from a C set back and a W lifted forward,
 *    and the values list turns in like a page in perspective.
 * 4. Sound: a pop when the monogram locks (scrolling forward) and a quiet
 *    hover tick on the tilt cards. Muting and audio unlock are sfx.js's job.
 * Everything is fromTo on transform/opacity/clip-path, so it is reversible.
 */
import { boot } from './main.js';
import { CAMERA } from './globe.js';
import { finePointer } from './perf.js';

const { NARROW_ASPECT, NARROW_X, NARROW_SCALE } = CAMERA;
const HALF_HEIGHT_WORLD = Math.tan(((CAMERA.FOV / 2) * Math.PI) / 180) * CAMERA.Z;
const GLOBE_RADIUS = 1.08; // sphere radius 1 plus the lift of the arcs
const MIN_ANCHOR_PX = 24;
const FOLD_TOLERANCE_PX = 8;
const POSE_DECIMALS = 3;
const POSE_SCALE_INDEX = 5; // s in "x,y,z,rx,ry,s"

/* Monogram choreography. Angles in degrees, screen space (y down). */
const SWEEP_START_DEG = -38; // just past the C's upper tip
const SWEEP_DEG = 284; // round the back of the C to its lower tip
const SWEEP_POINTS = 18;
const SWEEP_RADIUS_PCT = 72; // covers the whole square box
const SWEEP_AT = 0.25; // share of the in-phase before the C starts drawing
const SWEEP_LEN = 0.7;

/* Round 3 depth, in degrees and px. */
const PORTRAIT_IN = Object.freeze({ rotationY: 22, rotationX: 6 });
const PORTRAIT_OUT_DEG = -14;
const MONO_TURN_DEG = -32;
const MONO_W_Z = 140; // the W starts this far in front of the C
const MONO_C_Z = -90;
const LIST_IN_DEG = -16;
const LIST_OUT_DEG = 10;
const LIST_PERSPECTIVE = 1400;
const CARD_SOUND = '.story-portrait__stage, .story-mono, .story-value, .story-idea__card';

const stage = document.querySelector('.stage');
const depthOn = () => window.matchMedia('(pointer: fine)').matches;

/** Film time at which the C·W monogram is complete; a pop plays when the playhead crosses it going forward. */
const monoLock = { at: Infinity, last: 0 };

/* ---------- 1 · globe poses from anchors ---------- */

function parseRotation(value) {
  const [rx = 0, ry = 0] = String(value || '').split(',').map(Number);
  return { rx: Number.isFinite(rx) ? rx : 0, ry: Number.isFinite(ry) ? ry : 0 };
}

/** Screen rect → globe position/scale in pose units (undoing the engine's narrow-screen factors). */
function placeFromRect(rect) {
  if (rect.width < MIN_ANCHOR_PX || rect.height < MIN_ANCHOR_PX) return null;
  const width = stage.clientWidth || window.innerWidth;
  const height = stage.clientHeight || window.innerHeight;
  const unit = (2 * HALF_HEIGHT_WORLD) / height;
  const narrow = width / height < NARROW_ASPECT;
  const cx = rect.left + rect.width / 2 - width / 2;
  const cy = rect.top + rect.height / 2 - height / 2;
  const radiusPx = Math.min(rect.width, rect.height) / 2;
  // Below the fold the canvas would cut the globe off (it only pans up into view).
  if (cy + radiusPx > height / 2 + FOLD_TOLERANCE_PX) return null;
  const radius = radiusPx * unit;
  return {
    x: (cx * unit) / (narrow ? NARROW_X : 1),
    y: -cy * unit,
    s: radius / GLOBE_RADIUS / (narrow ? NARROW_SCALE : 1),
  };
}

const formatPose = ({ x, y, rx, ry, s }) =>
  [x, y, 0, rx, ry, s].map((n) => Number(n.toFixed(POSE_DECIMALS))).join(',');

function createPoseFitter() {
  let last = { x: 0, y: 0 };
  return function fitPose({ sceneEl, index }) {
    if (index === 0) last = { x: 0, y: 0 };
    const anchor = sceneEl.querySelector('[data-globe-anchor]');
    // Measured before any pan: followPans() moves the globe with the content.
    const place = anchor ? placeFromRect(anchor.getBoundingClientRect()) : null;
    const pose = { ...(place || { x: last.x, y: last.y, s: 0 }), ...parseRotation(sceneEl.dataset.globe) };
    sceneEl.dataset.pose = formatPose(pose);
    last = pose;
  };
}

const showsGlobe = (sceneEl) => Number(String(sceneEl.dataset.pose || '').split(',')[POSE_SCALE_INDEX]) > 0;

/** Screen y above which a scene's panned content is cut off (its box top minus the clip margin). */
function contentTop(sceneEl) {
  const inner = sceneEl.querySelector('.scene__inner');
  if (!inner) return 0;
  const margin = parseFloat(getComputedStyle(inner).overflowClipMargin) || 0;
  return Math.max(0, inner.getBoundingClientRect().top - margin);
}

/** Canvas state for a pan offset: moved up, and cut at the scene's top edge like the content. */
const panState = (offset, clipTop) => ({ y: -offset, clipPath: `inset(${clipTop + offset}px 0px 0px 0px)` });

/**
 * A panning scene slides its content up 1:1 with scroll; slide the globe canvas
 * with it so the globe stays in its reserved box (clipped under the header, as
 * the content is), then bring the canvas home during the next scene's in-phase
 * while the engine tweens to the next pose.
 */
function followPans({ tl, timings }) {
  const canvas = document.getElementById('gl');
  if (!canvas) return;
  timings.forEach((t, i) => {
    if (!t.pan || !showsGlobe(t.el)) return;
    const clipTop = contentTop(t.el);
    const panDur = Math.max(0.001, t.panEnd - t.panStart);
    tl.fromTo(canvas, panState(0, clipTop),
      { ...panState(t.pan, clipTop), duration: panDur, ease: 'none', immediateRender: false }, t.panStart);
    const next = timings[i + 1];
    if (!next) return;
    tl.fromTo(canvas, panState(t.pan, clipTop),
      { ...panState(0, 0), duration: Math.max(0.001, next.inDur), ease: 'power2.inOut', immediateRender: false },
      next.inStart);
  });
}

/* ---------- 2 · scene tweens ---------- */

function heroTweens({ tl, sceneEl, timing: t }) {
  const copy = sceneEl.querySelector('.story-hero__copy');
  const cue = sceneEl.querySelector('.story-cue');
  const hold = Math.max(0.001, t.outStart - t.start);
  tl.fromTo(copy, { y: 0 }, { y: -32, duration: hold, ease: 'none', immediateRender: false }, t.start);
  if (cue) tl.fromTo(cue, { opacity: 1 }, { opacity: 0, duration: hold * 0.35, ease: 'none', immediateRender: false }, t.start);
}

function ideaTweens({ tl, sceneEl, timing: t }) {
  const rule = sceneEl.querySelector('.story-rule');
  tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: t.inDur * 0.5, ease: 'power2.out' }, t.inStart + t.inDur * 0.6);
}

function founderTweens({ tl, sceneEl, timing: t }) {
  const frame = sceneEl.querySelector('.story-portrait__frame');
  const caption = sceneEl.querySelector('.story-portrait__caption');
  tl.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: t.inDur * 0.55, ease: 'power3.inOut' }, t.inStart + t.inDur * 0.3);
  tl.fromTo(caption, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: t.inDur * 0.3, ease: 'power2.out' }, t.inStart + t.inDur * 0.7);
  tl.fromTo(frame, { clipPath: 'inset(0% 0% 0% 0%)' },
    { clipPath: 'inset(0% 0% 100% 0%)', duration: t.outDur * 0.6, ease: 'power2.in', immediateRender: false }, t.outStart);
  portraitDepth({ tl, sceneEl, timing: t });
}

/** The stacked plates behind the portrait fade in after the frame; the stage swings in and out in depth. */
function portraitDepth({ tl, sceneEl, timing: t }) {
  const stageEl = sceneEl.querySelector('.story-portrait__stage');
  const plates = sceneEl.querySelectorAll('.story-portrait__plate');
  tl.fromTo(plates, { opacity: 0 },
    { opacity: 1, duration: t.inDur * 0.3, ease: 'power1.out', stagger: t.inDur * 0.08 }, t.inStart + t.inDur * 0.6);
  tl.fromTo(plates, { opacity: 1 },
    { opacity: 0, duration: t.outDur * 0.4, ease: 'power1.in', immediateRender: false }, t.outStart);
  if (!stageEl || !depthOn()) return;
  tl.fromTo(stageEl, { ...PORTRAIT_IN },
    { rotationY: 0, rotationX: 0, duration: t.inDur * 0.75, ease: 'power2.out' }, t.inStart + t.inDur * 0.25);
  tl.fromTo(stageEl, { rotationY: 0 },
    { rotationY: PORTRAIT_OUT_DEG, duration: t.outDur * 0.7, ease: 'power2.in', immediateRender: false }, t.outStart);
}

/** Pie-shaped polygon that opens clockwise-backwards around the C, `progress` 0 → 1. */
function sweepPolygon(progress) {
  const points = ['50% 50%'];
  for (let i = 0; i <= SWEEP_POINTS; i += 1) {
    const rad = ((SWEEP_START_DEG - SWEEP_DEG * progress * (i / SWEEP_POINTS)) * Math.PI) / 180;
    const x = 50 + SWEEP_RADIUS_PCT * Math.cos(rad);
    const y = 50 + SWEEP_RADIUS_PCT * Math.sin(rad);
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  return `polygon(${points.join(', ')})`;
}

/**
 * The C is drawn round by a proxy tween: its progress `p` is redrawn into the
 * clip-path on every update, so the shape is a pure function of film time.
 * (GSAP's own string interpolation mis-pairs the numbers of these polygons,
 * which made the arc jump about mid-sweep and differ by scroll direction.)
 */
function addSweep(tl, el, at, duration) {
  const sweep = { p: 0 };
  const draw = () => { el.style.clipPath = sweepPolygon(sweep.p); };
  tl.fromTo(sweep, { p: 0 }, { p: 1, duration, ease: 'none', onUpdate: draw }, at);
  draw();
}

function logoTweens({ tl, sceneEl, timing: t }) {
  const mono = sceneEl.querySelector('.story-mono');
  const inner = sceneEl.querySelector('.story-mono__inner');
  const c = sceneEl.querySelector('.story-mono__c');
  const w = sceneEl.querySelector('.story-mono__w');
  addSweep(tl, c, t.inStart + t.inDur * SWEEP_AT, t.inDur * SWEEP_LEN);
  tl.fromTo(w, { clipPath: 'inset(100% 0% 0% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: t.inDur * 0.45, ease: 'power3.out' }, t.inStart + t.inDur * 0.6);
  tl.fromTo(mono, { scale: 0.92 }, { scale: 1, duration: Math.max(0.001, t.outStart - t.inStart), ease: 'none' }, t.inStart);
  tl.fromTo(inner, { opacity: 1, scale: 1 },
    { opacity: 0, scale: 1.12, duration: t.outDur * 0.7, ease: 'power2.in', immediateRender: false }, t.outStart);
  monogramDepth({ tl, inner, c, w, timing: t });
  monoLock.at = t.inStart + t.inDur * (SWEEP_AT + SWEEP_LEN);
}

/** The monogram assembles in depth: it turns to face the viewer while the W settles onto the C. */
function monogramDepth({ tl, inner, c, w, timing: t }) {
  if (!depthOn()) return;
  const at = t.inStart + t.inDur * 0.2;
  const dur = t.inDur * 0.8;
  tl.fromTo(inner, { rotationY: MONO_TURN_DEG }, { rotationY: 0, duration: dur, ease: 'power2.out' }, at);
  tl.fromTo(c, { z: MONO_C_Z }, { z: 0, duration: dur, ease: 'power2.out' }, at);
  tl.fromTo(w, { z: MONO_W_Z }, { z: 0, duration: dur, ease: 'power3.out' }, at);
}

/** The values list turns in from the right edge like a page, then tips away. */
function valuesTweens({ tl, sceneEl, timing: t }) {
  const list = sceneEl.querySelector('.story-values__list');
  if (!list || !depthOn()) return;
  const origin = { transformPerspective: LIST_PERSPECTIVE, transformOrigin: '100% 50%' };
  tl.fromTo(list, { rotationY: LIST_IN_DEG, ...origin },
    { rotationY: 0, ...origin, duration: t.inDur * 0.85, ease: 'power2.out' }, t.inStart);
  tl.fromTo(list, { rotationY: 0, ...origin },
    { rotationY: LIST_OUT_DEG, ...origin, duration: t.outDur * 0.8, ease: 'power2.in', immediateRender: false }, t.outStart);
}

const SCENE_TWEENS = {
  top: heroTweens, beginning: ideaTweens, founder: founderTweens, logo: logoTweens, values: valuesTweens,
};

function addSceneTweens(payload) {
  SCENE_TWEENS[payload.sceneEl.id]?.(payload);
}

/* ---------- 3 · sound ---------- */

function playLock(sfx, { time }) {
  if (monoLock.last < monoLock.at && time >= monoLock.at) sfx.play('pop');
  monoLock.last = time;
}

/** A quiet hover tick when the mouse enters one of the page's tilt cards. */
function wireCardSounds(film, sfx) {
  if (!film.enabled || !finePointer()) return;
  document.querySelectorAll(CARD_SOUND).forEach((card) => {
    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') sfx.play('hover');
    });
  });
}

/* ---------- boot ---------- */

const { film, sfx } = boot();
film.on('build', createPoseFitter());
film.on('build', addSceneTweens);
film.on('built', followPans);
film.on('progress', (payload) => playLock(sfx, payload));
wireCardSounds(film, sfx);
