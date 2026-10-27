/**
 * The Story building (owner, 2026-10-26), the page-level controller: one 3D
 * building that persists across the Story scenes, posed scene by scene by
 * building-plan.js. It is not a Section (it belongs to no one scene): pages/story.js
 * calls mountBuilding(ctx) after mountSections, and it listens to every cut.
 *
 *   cut       one pose tween on the cut timeline, from where the building is to
 *             the target scene's pose, at 'out' and done by 'settled' (by label,
 *             so cut and touch-cut share it and seek-test can pause it anywhere)
 *   landed    the pose snaps to the landed scene's (also after a resize or a jump)
 *   #values   the row under the pointer, in focus or open lights its part
 *   pointer   a small sway toward the pointer (fine pointers, tier A), parked when still
 *
 * The WebGL stage (building-stage.js, with three) loads on idle after the first
 * landing; tier C and Save-Data never load it. Until it is there the pose is
 * still tracked, so the building appears in the right place. In flow mode
 * (reduced motion) it draws one still frame of the #beginning pose inside that
 * scene and never moves. Frames are drawn on demand only.
 */
import { getTier, onTierChange } from '../../../core/engine/tier.js';
import { createLoop, finePointer, onIdle, onInputIdle, saveData } from '../../../core/engine/perf.js';
import {
  PARTS, STILL_SCENE, bandOf, copyPose, glowOf, isVisible, lerpPose, poseFor, renderMode, rowPick,
} from './building-plan.js';

/** The lazy stage chunk (build.mjs bundles a dynamic import of a relative constant as its own chunk). */
const STAGE_MODULE = './building-stage.js';
/** The pose tween runs from 'out' to 'settled' (motion-tokens CUT.settled), never past the next queued step. */
const POSE_S = 0.95;
const POSE_LABEL = 'out';
/** 'out' to 'settled' on this cut's timeline (shorter in touch-cut, where 'out' is 0); POSE_S if a label is missing. */
const poseSeconds = (tl) => {
  const { out, settled } = tl.labels || {};
  return Number.isFinite(out) && Number.isFinite(settled) && settled > out ? settled - out : POSE_S;
};
const PICK_S = 0.35;
const SWAY_MAX = 0.08;
const SWAY_EASE = 4;
const SWAY_REST = 0.0005;
const SWAY_IDLE_MS = 2500;
const OVER_IRIS = 'is-over-iris';
const FIRST_SCENE = 'logo';

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });
const noPick = () => Object.fromEntries(PARTS.map((p) => [p, 0]));

/** The open #values row (0-based), else 0. */
function openRow(rows) {
  const values = Array.from(rows.querySelectorAll('.value'));
  return Math.max(0, values.findIndex((v) => v.classList.contains('is-open')));
}

/** The row an event happened in (0-based), or -1. */
function rowOf(rows, target) {
  const value = target?.closest?.('.value');
  return value ? Array.from(rows.querySelectorAll('.value')).indexOf(value) : -1;
}

export function mountBuilding(ctx = {}) {
  const { film } = ctx;
  const flow = !film || film.mode === 'flow' || document.documentElement.classList.contains('rm');
  let mode = renderMode({ tier: getTier(), saveData: saveData(), flow });
  if (mode === 'off' || !film) return { destroy() {} };

  const offs = [];
  let band = bandOf(viewport());
  let sceneId = flow ? STILL_SCENE : film.currentScene?.id || FIRST_SCENE;
  let state = poseFor(sceneId, band);
  let pick = noPick();
  let sway = { x: 0, y: 0 };
  let swayTarget = { x: 0, y: 0 };
  let stage = null;
  let overIris = false;
  let cutToken = 0;
  let raf = 0;
  let resizer = null;

  const drawNow = () => stage?.draw(state, glowOf(state, pick), sway);
  const requestDraw = () => {
    if (!stage || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      drawNow();
    });
  };
  const setOverIris = (on) => {
    overIris = on;
    stage?.canvas.classList.toggle(OVER_IRIS, on);
  };

  /* ---------- cuts (cut and touch-cut) ---------- */

  function onCut(event) {
    const to = poseFor(event.toEl?.id, band);
    if (event.from < 0 || !event.tl) {
      state = to;
      requestDraw();
      return;
    }
    const from = copyPose(state);
    const token = ++cutToken;
    const progress = { p: 0 };
    // a field change opens the iris over the stage: lift the building above it (the entering scene stays on top)
    if (event.fieldChange && (isVisible(from) || isVisible(to))) setOverIris(true);
    event.tl.fromTo(progress, { p: 0 }, {
      p: 1, duration: poseSeconds(event.tl), ease: 'none', immediateRender: false,
      onUpdate: () => {
        if (token !== cutToken) return;
        state = lerpPose(from, to, progress.p);
        requestDraw();
      },
    }, POSE_LABEL);
  }

  function onLanded(event) {
    sceneId = event.id || event.el?.id || sceneId;
    band = bandOf(viewport());
    state = poseFor(sceneId, band);
    setOverIris(false);
    requestDraw();
  }

  /* ---------- #values: the row in view lights its part ---------- */

  function wireRows() {
    const rows = document.querySelector('#values .values__rows');
    const gsap = window.gsap;
    if (!rows || !gsap) return;
    let current = openRow(rows);
    pick = { ...noPick(), ...rowPick(current) };
    const choose = (index) => {
      if (index < 0 || index === current) return;
      current = index;
      gsap.to(pick, { ...noPick(), ...rowPick(index), duration: PICK_S, ease: 'power2.out', overwrite: true, onUpdate: requestDraw });
    };
    const handlers = {
      pointerover: (e) => choose(rowOf(rows, e.target)),
      focusin: (e) => choose(rowOf(rows, e.target)),
      pointerleave: () => choose(openRow(rows)),
      click: () => choose(openRow(rows)),   // after Values.js has moved .is-open (it listens first)
    };
    Object.entries(handlers).forEach(([type, fn]) => rows.addEventListener(type, fn, { passive: true }));
    offs.push(() => Object.entries(handlers).forEach(([type, fn]) => rows.removeEventListener(type, fn)));
  }

  /* ---------- the pointer sway (fine pointers, tier A) ---------- */

  function wireSway() {
    if (getTier() !== 'A' || !finePointer()) return;
    const loop = createLoop((now, dt) => {
      const k = Math.min(1, dt * SWAY_EASE);
      sway = { x: sway.x + (swayTarget.x - sway.x) * k, y: sway.y + (swayTarget.y - sway.y) * k };
      drawNow();
      return Math.abs(swayTarget.x - sway.x) + Math.abs(swayTarget.y - sway.y) > SWAY_REST;
    }, { idleMs: SWAY_IDLE_MS });
    const aim = (e) => {
      if (!stage || !isVisible(state)) return;
      swayTarget = { x: ((e.clientX / window.innerWidth) - 0.5) * 2 * SWAY_MAX, y: ((e.clientY / window.innerHeight) - 0.5) * SWAY_MAX };
      loop.wake();
    };
    window.addEventListener('pointermove', aim, { passive: true });
    offs.push(() => {
      window.removeEventListener('pointermove', aim);
      loop.sleep();
    });
  }

  /* ---------- the stage ---------- */

  function place(canvas) {
    if (flow) {
      canvas.classList.add('story-building--still');   // in-scene, under the copy (also when flow comes without html.rm)
      document.getElementById(STILL_SCENE)?.prepend(canvas);
      return canvas.isConnected;
    }
    const globe = document.getElementById('globe');
    const stageEl = document.querySelector('.stage');
    if (globe?.parentElement === stageEl) globe.after(canvas);
    else stageEl?.prepend(canvas);
    return canvas.isConnected;
  }

  function onResize() {
    band = bandOf(viewport());
    if (!film.isCutting) state = poseFor(sceneId, band);
    requestDraw();
  }

  function load() {
    if (mode === 'off') return;
    import(STAGE_MODULE)
      .then(({ createStage }) => {
        if (mode === 'off') return;
        stage = createStage({ tier: getTier() });
        if (!stage) return;
        if (!place(stage.canvas)) {
          stage.dispose();
          stage = null;
          return;
        }
        setOverIris(overIris);
        resizer = new ResizeObserver(onResize);
        resizer.observe(stage.canvas);
        requestDraw();
      })
      .catch((err) => console.error('story building: the 3D stage failed to load', err));
  }

  function switchOff() {
    mode = 'off';
    cutToken += 1;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    resizer?.disconnect();
    stage?.dispose();
    stage = null;
  }

  if (!flow) {
    offs.push(film.on('cut', onCut), film.on('landed', onLanded));
    wireRows();
    wireSway();
  }
  offs.push(onTierChange(({ tier }) => { if (tier === 'C') switchOff(); }));
  Promise.resolve(film.ready).then(() => {
    if (getTier() !== 'B') { onIdle(load); return; }
    // Tier B (mid-range phones): parsing three and compiling its shaders blocks the main thread,
    // so wait for a pause in the visitor's input rather than land it on their first swipe.
    const off = onInputIdle(() => { off(); onIdle(load); });
    offs.push(off);
  }, () => {});

  return {
    destroy() {
      offs.forEach((off) => off?.());
      switchOff();
    },
  };
}
