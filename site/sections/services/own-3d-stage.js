/**
 * The shared WebGL stage of the Services own-scene motifs (lazy chunk; only
 * own-3d.js imports it, on demand). One three.js renderer and one canvas for
 * the whole page: show() moves the canvas into the landing scene's
 * `[data-own-3d]` box, and every `[data-own-3d-view]` slot in that scene
 * becomes one scissored viewport with its own camera and motif
 * (own-3d-motifs.js). Motifs are built once per scene and kept.
 *
 * Rendering (own-3d-config.js renderMode):
 *   live    an rAF loop (perf.createLoop) that runs continuously while the scene
 *           is current (owner, 2026-10-25) and parks whenever the tab is hidden
 *   demand  one frame on landing, then frames only while a finger drags (unused)
 *   still   one frame on landing (reduced motion)
 * hide() parks it the moment another scene lands.
 *
 * Dev (site/) loads three from jsDelivr; build.mjs maps the same URL to the
 * pinned npm copy (package.json), bundled into this chunk.
 */
import {
  BoxGeometry, BufferGeometry, Color, ConeGeometry, DoubleSide, EdgesGeometry, Float32BufferAttribute, Group,
  IcosahedronGeometry, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, PerspectiveCamera, Points,
  PointsMaterial, Quaternion, Scene, Vector3, WebGLRenderer,
} from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';
import { createLoop } from '../../core/engine/perf.js';
import { tierConfig } from '../../core/engine/tier.js';
import { pixelRatio, viewFits } from './own-3d-config.js';
import { MOTIFS, makeKit } from './own-3d-motifs.js';

/** The parts the motifs build with (own-3d-motifs.js THREE_NEEDS; a test keeps the two equal). */
const T = Object.freeze({
  BoxGeometry, BufferGeometry, Color, ConeGeometry, DoubleSide, EdgesGeometry, Float32BufferAttribute, Group,
  IcosahedronGeometry, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, Points, PointsMaterial, Quaternion, Vector3,
});

const FOV_DEG = 30;
const FRAME_MARGIN = 1.08;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 100;
/** The pointer eases toward its target at this rate (per second). */
const POINTER_EASE = 6;
/** Pointer distance (in view half-sizes from the centre) where `near` reaches 0. */
const NEAR_REACH = 1.8;
/** Demand mode: frames keep coming this long after the last touch move. */
const DEMAND_IDLE_MS = 1200;
/** Line opacity by field: the bone field's darker gold needs more ink to read. */
const FIELD_STRENGTH = Object.freeze({ ink: 0.85, bone: 1.15 });
const LIVE_CLASS = 'is-live';
const POINTER_EVENTS = ['pointermove', 'pointerdown'];

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const lerp = (a, b, k) => a + (b - a) * k;

/** A WebGL2 context for the renderer, or null (three needs WebGL2; no context = no motifs). */
function makeContext(canvas, antialias) {
  try {
    return canvas.getContext('webgl2', { alpha: true, antialias, depth: true, stencil: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
}

function disposeTree(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    [].concat(obj.material || []).forEach((m) => m.dispose());
  });
}

/** One viewport per slot of a scene, its motif built in the scene's gold. */
function buildViews(sceneEl) {
  const accent = getComputedStyle(sceneEl).getPropertyValue('--accent').trim();
  const kit = makeKit(T, { accent, strength: FIELD_STRENGTH[sceneEl.dataset.field] || 1 });
  return Array.from(sceneEl.querySelectorAll('[data-own-3d-view]')).flatMap((slot) => {
    const build = MOTIFS[slot.getAttribute('data-own-3d-view')];
    if (!build) return [];
    const motif = build(T, kit);
    const scene = new Scene();
    scene.add(motif.root);
    const camera = new PerspectiveCamera(FOV_DEG, 1, CAMERA_NEAR, CAMERA_FAR);
    return [{ slot, motif, scene, camera, rect: null, target: { x: 0, y: 0, near: 0 }, p: { x: 0, y: 0, near: 0 } }];
  });
}

/** The camera distance that frames a motif of `radius` in a view of `aspect`. */
function frameCamera(camera, radius, aspect) {
  camera.aspect = aspect;
  const distance = (radius * FRAME_MARGIN) / Math.tan((FOV_DEG / 2) * (Math.PI / 180)) / Math.min(1, aspect);
  camera.position.set(0, 0, distance);
  camera.updateProjectionMatrix();
}

/** → the stage, or null when this device has no WebGL2. */
export function createStage({ mode, tier }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'own__3d-canvas';
  const context = makeContext(canvas, tier === 'A');
  if (!context) return null;
  const renderer = new WebGLRenderer({ canvas, context, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(pixelRatio(window.devicePixelRatio, tierConfig(tier).dpr));
  renderer.autoClear = false;

  const cache = new Map(); // scene element → its views
  let owner = null;
  let box = null;
  let views = [];
  let size = { width: 0, height: 0 };
  let time = 0;
  let disposed = false;

  function layout() {
    if (!box) return;
    const width = box.clientWidth, height = box.clientHeight;
    if (width !== size.width || height !== size.height) {
      size = { width, height };
      renderer.setSize(width, height, false);
    }
    const origin = box.getBoundingClientRect();
    views.forEach((view) => {
      const r = view.slot.getBoundingClientRect();
      view.rect = viewFits(r) ? { left: r.left - origin.left, top: r.top - origin.top, width: r.width, height: r.height } : null;
      view.centre = { x: r.left + r.width / 2, y: r.top + r.height / 2, hx: r.width / 2 || 1, hy: r.height / 2 || 1 };
      if (view.rect) frameCamera(view.camera, view.motif.radius, r.width / r.height);
    });
  }

  function render() {
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    views.forEach(({ rect, scene, camera }) => {
      if (!rect) return;
      const bottom = size.height - rect.top - rect.height;
      renderer.setViewport(rect.left, bottom, rect.width, rect.height);
      renderer.setScissor(rect.left, bottom, rect.width, rect.height);
      renderer.render(scene, camera);
    });
  }

  function step(dt) {
    time += dt;
    const ease = clamp(dt * POINTER_EASE, 0, 1);
    views.forEach((view) => {
      if (!view.rect) return;
      const { p, target } = view;
      p.x = lerp(p.x, target.x, ease);
      p.y = lerp(p.y, target.y, ease);
      p.near = lerp(p.near, target.near, ease);
      view.motif.update(time, dt, p);
    });
    render();
  }

  const loop = createLoop((now, dt) => {
    if (!owner || disposed) return false;
    if (!views.some((view) => view.rect)) { render(); return false; }   // nothing fits: clear once, park
    step(dt);
    return mode !== 'still';
  }, { idleMs: mode === 'live' ? 0 : DEMAND_IDLE_MS });   // live: no idle parking (owner, 2026-10-25)

  /** The pointer over the scene, relative to each view's centre (y up). */
  function aim(event) {
    views.forEach(({ centre, target }) => {
      if (!centre) return;
      const dx = (event.clientX - centre.x) / centre.hx;
      const dy = (event.clientY - centre.y) / centre.hy;
      target.x = clamp(dx, -1, 1);
      target.y = clamp(-dy, -1, 1);
      target.near = clamp((NEAR_REACH - Math.hypot(dx, dy)) / (NEAR_REACH - 1), 0, 1);
    });
    loop.wake();
  }

  function release() {
    views.forEach(({ target }) => Object.assign(target, { x: 0, y: 0, near: 0 }));
    loop.wake();
  }

  const resizer = new ResizeObserver(() => {
    if (!owner) return;
    layout();
    if (!loop.running) step(0);
  });

  function bindPointer(on) {
    if (!owner || mode === 'still') return;
    const method = on ? 'addEventListener' : 'removeEventListener';
    POINTER_EVENTS.forEach((type) => owner[method](type, aim, { passive: true }));
    owner[method]('pointerleave', release, { passive: true });
  }

  function hide(sceneEl) {
    if (!owner || owner !== sceneEl) return;
    loop.sleep();
    bindPointer(false);
    resizer.disconnect();
    box?.classList.remove(LIVE_CLASS);
    owner = null;
  }

  function show(sceneEl, target) {
    if (disposed || owner === sceneEl) return;
    if (owner) hide(owner);
    owner = sceneEl;
    box = target;
    box.append(canvas);
    if (!cache.has(sceneEl)) cache.set(sceneEl, buildViews(sceneEl));
    views = cache.get(sceneEl);
    layout();
    resizer.observe(box);
    bindPointer(true);
    step(1 / 60);
    box.classList.add(LIVE_CLASS);
    if (mode === 'live') loop.wake();
  }

  function dispose() {
    if (disposed) return;
    if (owner) hide(owner);
    disposed = true;
    cache.forEach((list) => list.forEach(({ scene }) => disposeTree(scene)));
    cache.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  return { show, hide, dispose };
}
