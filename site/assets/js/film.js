/**
 * The film: scroll scrubs one master GSAP timeline instead of moving the page.
 *
 * Contract (see ENGINE.md):
 *   .stage > .fields, canvases, .scenes > section.scene[data-field][data-dur][data-iris][data-pose][data-title]
 *   .scroll-spacer after the stage drives progress.
 *
 * Usage: const film = initFilm({ root: document });
 *        film.on('build', ({ tl, sceneEl, sceneStart, timing }) => …)
 *
 * Keyboard reach: the active scene, its neighbours and the nearest scene in
 * each direction that has something focusable keep their controls in the Tab
 * order, so Tab can always move on even past scenes with no links. The scene
 * holding focus counts as a centre too, so a fast second Tab never runs out of
 * road. Controls in far scenes are only "parked" (tabindex -1): every scene
 * stays in the accessibility tree, so a screen reader's browse mode can read
 * the whole page, and focusing anything there moves the film to it.
 *
 * Reduced motion, the visitor's "Pause animation" choice (motion-pref.js) or
 * missing libraries → flow mode (film-flow.js), same API.
 */
import { createEmitter, fontsReady, sceneTitle, hashTargetOf, idFromHash } from './film-events.js';
import { createFlowFilm } from './film-flow.js';
import { revealTargets, prepareReveals, revealIn, revealOut } from './film-reveals.js';
import { createRecorder, replayInto, replaySliced } from './film-batch.js';
import { yieldToMain } from './perf.js';
import { motionPaused } from './motion-pref.js';
import { buildScrollMap, timeAt, pxAt } from './film-map.js';

const DEFAULT_DUR = 4; // seconds of film per scene unless data-dur says otherwise
const OVERLAP = 0.12; // share of a scene's duration shared with the next scene
const IN_FRAC = 0.32; // share of a scene used to bring it in
const OUT_FRAC = 0.2; // share of a scene used to take it out
const IRIS_FRAC = 0.8; // share of the in-phase the iris / crossfade takes
const SCENE_FADE_AT = 0.3; // container fade-in starts at this share of the in-phase
const SCENE_FADE_FRAC = 0.2; // container fade length, share of in/out phase
const REVEAL_START = 0.38; // first reveal starts at this share of the in-phase
const REVEAL_STEP = 0.08; // each following reveal starts this much later
const REVEAL_LAST = 0.62; // latest automatic reveal start
const REVEAL_DUR = 0.42; // reveal tween length, share of the in-phase
const OUT_STEP = 0.05; // out-phase offset between reveal elements
const OUT_STEP_MAX = 0.3;
const OUT_REVEAL_DUR = 0.55; // share of the out-phase
const FOCUS_AT = 1.12; // "fully in" point, share of the in-phase after inStart
const PX_PER_SECOND_FACTOR = 0.9; // film seconds a pan takes = pan px / (factor × stage height); scroll cost is film-map.js
const HOLD_DRIFT_PX = 22; // a settled frame keeps drifting up a little, so no scroll is dead
const IRIS_END_PCT = 150;
const PAN_TOLERANCE_PX = 4;
const REBUILD_DELAY_MS = 200;
const GOTO_MIN_S = 0.6;
const GOTO_MAX_S = 2.4;
const GOTO_SCREENS_PER_S = 5;
const FOCUS_SCROLL_S = 0.5;
const FOCUS_PENDING_MS = 1500; // a rebuild this soon after focusin re-runs the focus scroll it cancelled
const PAN_FOCUS_TOP = 0.3;
const PAN_PAUSE = 0.3; // share of the free hold time spent before panning starts
const LENIS = { lerp: 0.085, wheelMultiplier: 1, touchMultiplier: 1.4 }; // Portfolio tuning: even, quick, no drag
const LAID_OUT_CLASS = 'is-laid-out'; // first build: scene measured, see base.css
const PANNED_CLASS = 'is-panned'; // .scene__inner of a scene taller than the screen: fades at its edges (base.css)
const FALLBACK_CLASS = 'film-fallback'; // set by the inline head script's safety timer: flow mode took over
const ABORTED = Symbol('film build aborted');
const DEFAULT_IRIS = '50% 50%';
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';
const PARKED = 'data-film-tab'; // original tabindex of a control parked out of the Tab order ('' = none)

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** True when the scene holds at least one element Tab can land on (rendered, not disabled, tabindex ≥ 0 or parked). */
function hasFocusable(scene) {
  return Array.from(scene.querySelectorAll(FOCUSABLE)).some(
    (el) => (el.hasAttribute(PARKED) || el.tabIndex >= 0) && !el.disabled && el.getClientRects().length > 0,
  );
}

/** Take a far scene's controls out of the Tab order, remembering each one's own tabindex. */
function parkControls(scene) {
  scene.querySelectorAll(FOCUSABLE).forEach((el) => {
    if (el.hasAttribute(PARKED) || el.tabIndex < 0) return;
    el.setAttribute(PARKED, el.getAttribute('tabindex') ?? '');
    el.setAttribute('tabindex', '-1');
  });
}

/** Put parked controls back with the tabindex they had. */
function unparkControls(scene) {
  scene.querySelectorAll(`[${PARKED}]`).forEach((el) => {
    const original = el.getAttribute(PARKED);
    el.removeAttribute(PARKED);
    if (original === '') el.removeAttribute('tabindex');
    else el.setAttribute('tabindex', original);
  });
}

export function initFilm({ root = document } = {}) {
  const html = document.documentElement;
  const stage = root.querySelector('.stage');
  const scenes = Array.from(root.querySelectorAll('.scene'));
  const emitter = createEmitter();
  window.matchMedia(REDUCE_QUERY).addEventListener?.('change', () => location.reload());
  if (scenes.length) html.dataset.field = scenes[0].dataset.field || 'ink';
  if (!stage || !scenes.length || !canRunFilm()) return createFlowFilm({ root: html, scenes, emitter });
  return createFilm({ html, stage, scenes, emitter });
}

function canRunFilm() {
  const reduce = window.matchMedia(REDUCE_QUERY).matches;
  return !reduce && !motionPaused() && !!(window.gsap && window.ScrollTrigger && window.Lenis);
}

/** Resolve after window load plus two frames (ScrollTrigger and native scroll settle). */
function afterLoad() {
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
  const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  return loaded.then(frame).then(frame);
}

/* ---------- DOM preparation ---------- */

function ensureSpacer() {
  let spacer = document.querySelector('.scroll-spacer');
  if (!spacer) {
    spacer = document.createElement('div');
    spacer.className = 'scroll-spacer';
    document.body.appendChild(spacer);
  }
  spacer.setAttribute('aria-hidden', 'true');
  return spacer;
}

function createFieldLayers(stage, scenes) {
  let holder = stage.querySelector('.fields');
  if (!holder) {
    holder = document.createElement('div');
    holder.className = 'fields';
    stage.prepend(holder);
  }
  holder.setAttribute('aria-hidden', 'true');
  holder.replaceChildren();
  return scenes.map((scene, i) => {
    const layer = document.createElement('div');
    const field = scene.dataset.field || 'ink';
    const prev = i > 0 ? scenes[i - 1].dataset.field || 'ink' : null;
    layer.className = `field field--${field}${i === 0 ? ' is-base' : ''}${prev === field ? ' is-fade' : ''}`;
    holder.appendChild(layer);
    return layer;
  });
}

/** Ensure .scene__inner and wrap its children in .scene__pan (moved by the pan tween). */
function prepareScene(el) {
  let inner = el.querySelector(':scope > .scene__inner');
  if (!inner) {
    inner = document.createElement('div');
    inner.className = 'scene__inner';
    inner.append(...el.childNodes);
    el.appendChild(inner);
  }
  let pan = inner.querySelector(':scope > .scene__pan');
  if (!pan) {
    pan = document.createElement('div');
    pan.className = 'scene__pan';
    pan.append(...inner.childNodes);
    inner.appendChild(pan);
  }
  const scrollBoxes = el.querySelectorAll('.scene__scroll');
  scrollBoxes.forEach((box) => box.setAttribute('data-lenis-prevent', ''));
  return { el, inner, pan, hasScrollBox: scrollBoxes.length > 0 };
}

/* ---------- timing ---------- */

const overflowOf = ({ pan, inner }) => pan.offsetHeight - inner.clientHeight;

/** Extra height PANNED_CLASS gives the pan: the edge fade, top and bottom (base.css --pan-fade). */
const panPadding = ({ inner }) => 2 * (parseFloat(getComputedStyle(inner).getPropertyValue('--pan-fade')) || 0);

/**
 * How far a tall scene pans. A panned scene's edges fade (PANNED_CLASS, which
 * also pads the pan by the fade height), so text that pans under the header
 * melts away instead of being cut mid-glyph. The padding is left out when
 * deciding whether the scene pans at all, so the class never flip-flops; the
 * scene is laid out a second time only when the class changes.
 */
function measurePan(part) {
  const { inner } = part;
  const wasPanned = inner.classList.contains(PANNED_CLASS);
  const overflow = overflowOf(part);
  const natural = wasPanned ? overflow - panPadding(part) : overflow;
  const panned = !part.hasScrollBox && natural > PAN_TOLERANCE_PX;
  if (panned === wasPanned) return panned ? overflow : 0;
  inner.classList.toggle(PANNED_CLASS, panned);
  return panned ? overflowOf(part) : 0;
}

function timingFor(part, i, count, start, pxPerSecond, scenes, pan = measurePan(part)) {
  const el = part.el;
  const base = parseFloat(el.dataset.dur) || DEFAULT_DUR;
  const dur = base + pan / pxPerSecond;
  const inDur = i === 0 ? 0 : base * IN_FRAC;
  const outDur = i === count - 1 ? 0 : base * OUT_FRAC;
  const end = start + dur;
  const focusTime = i === 0 ? 0 : Math.min(start + inDur * FOCUS_AT, end - outDur);
  // Overflowing content pans 1:1 with scroll, after a short pause to read the top.
  const panLength = pan / pxPerSecond;
  const panStart = focusTime + Math.max(0, end - outDur - focusTime - panLength) * PAN_PAUSE;
  return {
    index: i, id: el.id, el, base, start, dur, end, inDur, outDur,
    inStart: start, inEnd: start + inDur, outStart: end - outDur,
    irisEnd: start + inDur * IRIS_FRAC,
    activeFrom: i === 0 ? 0 : start + inDur * 0.5,
    focusTime, panStart, panEnd: panStart + panLength, pan,
    field: el.dataset.field || 'ink',
    prevField: i > 0 ? scenes[i - 1].dataset.field || 'ink' : null,
    iris: el.dataset.iris || DEFAULT_IRIS,
  };
}

/** `pans`: overflow heights already measured (sliced first build); measured here otherwise. */
function computeTimings(parts, pxPerSecond, scenes, pans = []) {
  let start = 0;
  return parts.map((part, i) => {
    const t = timingFor(part, i, parts.length, start, pxPerSecond, scenes, pans[i]);
    start = t.end - t.base * OVERLAP;
    return t;
  });
}

/* ---------- timeline builders ---------- */

/**
 * Open this scene's field layer (iris, or a crossfade between equal fields).
 * will-change is set only while it animates, and the layer below is hidden
 * once fully covered. Zero-length sets on a scrubbed timeline revert when
 * scrubbing back, so both stay reversible.
 */
function addField(tl, t, layer, below) {
  if (t.index === 0) return;
  const dur = t.inDur * IRIS_FRAC;
  const fade = t.field === t.prevField;
  tl.set(layer, { willChange: fade ? 'opacity' : 'clip-path' }, t.inStart);
  if (fade) {
    tl.fromTo(layer, { opacity: 0 }, { opacity: 1, duration: dur, ease: 'none' }, t.inStart);
  } else {
    tl.fromTo(
      layer,
      { clipPath: `circle(0% at ${t.iris})` },
      { clipPath: `circle(${IRIS_END_PCT}% at ${t.iris})`, duration: dur, ease: 'power2.inOut' },
      t.inStart,
    );
  }
  tl.set(layer, { willChange: 'auto' }, t.irisEnd);
  tl.set(below, { visibility: 'hidden' }, t.irisEnd);
}

function addSceneFade(tl, t) {
  if (t.inDur) {
    const at = t.inStart + t.inDur * SCENE_FADE_AT;
    tl.fromTo(t.el, { opacity: 0 }, { opacity: 1, duration: t.inDur * SCENE_FADE_FRAC, ease: 'none' }, at);
  }
  if (t.outDur) {
    const dur = t.outDur * SCENE_FADE_FRAC;
    tl.fromTo(t.el, { opacity: 1 }, { opacity: 0, duration: dur, ease: 'none', immediateRender: false }, t.end - dur);
  }
}

function revealDelay(el, k) {
  const custom = parseFloat(el.dataset.delay);
  return Number.isFinite(custom) ? clamp(custom, 0, 1) : Math.min(REVEAL_START + k * REVEAL_STEP, REVEAL_LAST);
}

function addReveals(tl, t, reveals) {
  reveals.forEach((item, k) => {
    if (t.inDur) {
      const at = t.inStart + t.inDur * revealDelay(item.el, k);
      revealIn(tl, item, { at, dur: t.inDur * REVEAL_DUR, phase: t.inDur, end: t.focusTime });
    }
    if (t.outDur) {
      const at = t.outStart + t.outDur * Math.min(k * OUT_STEP, OUT_STEP_MAX);
      revealOut(tl, item, { at, dur: t.outDur * OUT_REVEAL_DUR, phase: t.outDur });
    }
  });
}

/**
 * Settled frames drift a few px while held, so the hold's scroll still shows
 * movement. A panning scene drifts in the still stretches on either side of
 * its pan (half each), so the pan itself stays 1:1 with the scroll.
 */
function addHoldDrift(tl, t, inner, isLast) {
  const holdEnd = isLast ? t.end : t.outStart;
  const stretches = t.pan
    ? [[t.focusTime, t.panStart, 0, -HOLD_DRIFT_PX / 2], [t.panEnd, holdEnd, -HOLD_DRIFT_PX / 2, -HOLD_DRIFT_PX]]
    : [[t.focusTime, holdEnd, 0, -HOLD_DRIFT_PX]];
  stretches.forEach(([from, to, y0, y1]) => {
    const duration = to - from;
    if (duration <= 0) return;
    tl.fromTo(inner, { y: y0 }, { y: y1, duration, ease: 'none', immediateRender: false }, from);
  });
}

function addPan(tl, t, pan) {
  if (!t.pan) return;
  const duration = Math.max(0.001, t.panEnd - t.panStart);
  tl.fromTo(pan, { y: 0 }, { y: -t.pan, duration, ease: 'none', immediateRender: false }, t.panStart);
}

/* ---------- the film ---------- */

function createLenis() {
  const { gsap, ScrollTrigger, Lenis } = window;
  // Phones: 2D transforms only. 3D ones give every moving piece its own layer
  // and iPhone Safari can run out of memory (lesson from the Portfolio film).
  if (window.matchMedia('(pointer: coarse)').matches) gsap.config({ force3D: false });
  const lenis = new Lenis(LENIS);
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  const dispose = () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
  return { lenis, dispose };
}

function createFilm({ html, stage, scenes, emitter }) {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  html.classList.add('film');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const spacer = ensureSpacer();
  const layers = createFieldLayers(stage, scenes);
  const parts = scenes.map(prepareScene);
  const { lenis, dispose: disposeLenis } = createLenis();
  const state = {
    tl: null, st: null, map: { segments: [], total: 0 }, timings: [], total: 1, active: -1, field: null,
    blend: null, pxPerSecond: 1, width: 0, height: 0, built: false, pendingFocus: null,
  };
  let flow = null; // flow mode, once the safety timer has taken over (fallBackToFlow)
  const fellBack = () => html.classList.contains(FALLBACK_CLASS);

  /* --- state from time --- */

  function activeIndexAt(time) {
    for (let i = state.timings.length - 1; i > 0; i -= 1) {
      if (time >= state.timings[i].activeFrom) return i;
    }
    return 0;
  }

  function blendAt(time) {
    for (let i = state.timings.length - 1; i > 0; i -= 1) {
      const t = state.timings[i];
      if (time >= t.inStart) {
        const mix = clamp((time - t.inStart) / Math.max(0.001, t.irisEnd - t.inStart), 0, 1);
        return { from: t.prevField, to: t.field, mix };
      }
    }
    const first = state.timings[0]?.field || 'ink';
    return { from: first, to: first, mix: 1 };
  }

  const sceneIndexOf = (node) => {
    const scene = node?.closest?.('.scene');
    return scene ? scenes.indexOf(scene) : -1;
  };

  function nearestFocusable(from, step) {
    for (let i = from + step; i >= 0 && i < scenes.length; i += step) {
      if (hasFocusable(scenes[i])) return i;
    }
    return -1;
  }

  /** Scenes Tab may reach from `center`: itself, its neighbours and the nearest focusable scene each way. */
  const reachFrom = (center) => [center - 1, center, center + 1, nearestFocusable(center, -1), nearestFocusable(center, 1)];

  /** Controls in every other scene are parked, so Tab skips invisible scenes; their content stays readable. */
  function updateReach() {
    const centers = [state.active, sceneIndexOf(document.activeElement)].filter((i) => i >= 0);
    const open = new Set(centers.flatMap(reachFrom));
    scenes.forEach((el, i) => {
      if (open.has(i)) unparkControls(el);
      else parkControls(el);
      el.classList.toggle('is-reachable', open.has(i));
    });
  }

  function setActive(index) {
    state.active = index;
    scenes.forEach((el, i) => {
      const distance = Math.abs(i - index);
      el.classList.toggle('is-active', distance === 0);
      el.classList.toggle('is-near', distance === 1);
    });
    updateReach();
    const el = scenes[index];
    html.dataset.scene = el.id;
    emitter.emit('scene', {
      index, id: el.id, el, field: el.dataset.field || 'ink', title: sceneTitle(el), count: scenes.length,
    });
  }

  function onUpdate() {
    const time = state.tl.time();
    const index = activeIndexAt(time);
    if (index !== state.active) setActive(index);
    const blend = blendAt(time);
    const field = blend.mix >= 0.5 ? blend.to : blend.from;
    state.blend = blend;
    if (field !== state.field) {
      state.field = field;
      html.dataset.field = field;
      emitter.emit('field', { field });
    }
    emitter.emit('progress', {
      time, total: state.total, progress: time / state.total, velocity: lenis.velocity, blend,
    });
  }

  /* --- build / teardown --- */

  /** One scene's tweens, from the engine and the page 'build' listeners, into the recorder. */
  function recordScene(tl, t, i, reveals) {
    addField(tl, t, layers[i], layers[i - 1]);
    addSceneFade(tl, t);
    addReveals(tl, t, reveals);
    addPan(tl, t, parts[i].pan);
    addHoldDrift(tl, t, parts[i].inner, i === state.timings.length - 1);
    emitter.emit('build', { tl, sceneEl: t.el, sceneStart: t.start, index: i, timing: t });
  }

  /** Every builder writes into a recorder; film-batch.js primes and replays it (no layout thrash). */
  function recordTimeline() {
    const tl = createRecorder();
    const reveals = state.timings.map((t) => prepareReveals(revealTargets(t.el)));
    state.timings.forEach((t, i) => recordScene(tl, t, i, reveals[i]));
    tl.set({}, {}, state.total);
    return tl;
  }

  /** Hand the main thread back between slices; stop if the head script's safety timer gave up on the film. */
  async function nextSlice() {
    await yieldToMain();
    if (fellBack()) throw ABORTED;
  }

  /**
   * First build, step 1, one scene per task: split its text, then read its
   * lines and its overflow from that single layout (one layout per scene).
   */
  async function prepareScenesSliced() {
    const pans = [];
    const reveals = [];
    for (const part of parts) {
      reveals.push(prepareReveals(revealTargets(part.el)));
      pans.push(measurePan(part));
      await nextSlice();
    }
    return { pans, reveals };
  }

  /**
   * Step 2, two short tasks per scene: record its tweens, then lift the base.css
   * layout lock (LAID_OUT_CLASS) so the next frame paints this scene on its own.
   */
  async function recordTimelineSliced(reveals) {
    const tl = createRecorder();
    for (let i = 0; i < state.timings.length; i += 1) {
      const t = state.timings[i];
      recordScene(tl, t, i, reveals[i]);
      await nextSlice();
      t.el.classList.add(LAID_OUT_CLASS);
      await nextSlice();
    }
    tl.set({}, {}, state.total);
    return tl;
  }

  /**
   * Scrubbed with no extra lag (Lenis already smooths): scroll px → film time
   * through the scroll map, so each scene costs the same few notches.
   */
  function createTrigger(tl) {
    const apply = (self) => tl.time(timeAt(state.map, self.scroll() - self.start));
    return ScrollTrigger.create({
      trigger: spacer, start: 'top top', end: 'bottom bottom', onUpdate: apply, onRefresh: apply,
    });
  }

  function teardown() {
    state.st?.kill();
    state.st = null;
    if (state.tl) {
      state.tl.eventCallback('onUpdate', null);
      state.tl.revert();
      state.tl.kill();
      state.tl = null;
    }
  }

  function measure(pans) {
    state.width = window.innerWidth;
    state.height = stage.clientHeight;
    state.pxPerSecond = Math.max(1, state.height * PX_PER_SECOND_FACTOR);
    state.timings = computeTimings(parts, state.pxPerSecond, scenes, pans);
    state.total = state.timings[state.timings.length - 1].end;
  }

  function attach(tl) {
    state.tl = tl;
    state.map = buildScrollMap(state.timings);
    spacer.style.height = `${Math.ceil(state.map.total + state.height)}px`;
    lenis.resize();
    state.st = createTrigger(state.tl);
    state.st.refresh();
    state.tl.eventCallback('onUpdate', onUpdate);
    emitter.emit('built', { tl: state.tl, timings: state.timings, total: state.total });
  }

  /** Rebuilds (resize, content change): synchronous, so the playhead can be restored at once. */
  function build() {
    measure();
    attach(replayInto(gsap.timeline({ paused: true }), recordTimeline()));
  }

  /** First build on load: the same work in short slices, so loading has no long task. */
  async function buildSliced() {
    const { pans, reveals } = await prepareScenesSliced();
    measure(pans);
    const recorder = await recordTimelineSliced(reveals);
    const tl = gsap.timeline({ paused: true });
    await replaySliced(tl, recorder);
    if (fellBack()) {
      tl.revert(); // the replay rendered start states (scenes at opacity 0): undo them
      tl.kill();
      throw ABORTED;
    }
    attach(tl);
  }

  /* --- where the playhead sits, kept across a rebuild --- */

  const holdEndOf = (t) => (t.index === state.timings.length - 1 ? t.end : t.outStart);

  /** The playhead as a phase of the active scene (in, hold, out) plus the offset into it. */
  function anchorAt(time) {
    const index = activeIndexAt(time);
    const t = state.timings[index];
    if (!t) return { index: -1, time };
    if (time < t.focusTime) return { index, time, phase: 'in', offset: time - t.start };
    if (time <= holdEndOf(t)) return { index, time, phase: 'hold', offset: time - t.focusTime };
    return { index, time, phase: 'out', offset: time - holdEndOf(t) };
  }

  /**
   * The same place on the new timings. A scene whose content shrank (a long
   * form replaced by its success note) keeps a held playhead inside its hold,
   * instead of resting part-way into its exit with text scrambling out.
   */
  function timeOfAnchor(anchor) {
    const t = state.timings[anchor.index];
    if (!t) return anchor.time;
    const holdEnd = holdEndOf(t);
    if (anchor.phase === 'in') return clamp(t.start + anchor.offset, t.start, t.focusTime);
    if (anchor.phase === 'hold') return clamp(t.focusTime + anchor.offset, t.focusTime, holdEnd);
    return clamp(holdEnd + anchor.offset, holdEnd, t.end);
  }

  function rebuild() {
    const anchor = state.tl ? anchorAt(state.tl.time()) : { index: -1, time: 0 };
    teardown();
    build();
    scrollToTime(timeOfAnchor(anchor), { immediate: true });
    onUpdate();
    resumeFocus();
    emitter.emit('rebuilt', { tl: state.tl, timings: state.timings, total: state.total });
  }

  /* --- navigation --- */

  /** Own mapping (not st.start/end): ScrollTrigger may defer its measurements during a resize. */
  function scrollYForTime(time) {
    return spacer.offsetTop + pxAt(state.map, clamp(time, 0, state.total));
  }

  function scrollToTime(time, { immediate = false, duration } = {}) {
    if (!state.st) return;
    const y = scrollYForTime(time);
    if (immediate) {
      lenis.scrollTo(y, { immediate: true, force: true });
      ScrollTrigger.update();
      return;
    }
    const distance = Math.abs(y - window.scrollY);
    const seconds = duration ?? clamp(distance / (state.height * GOTO_SCREENS_PER_S), GOTO_MIN_S, GOTO_MAX_S);
    lenis.scrollTo(y, { duration: seconds, easing: easeInOutCubic, force: true });
  }

  function indexOfTarget(target) {
    if (typeof target === 'number') return target >= 0 && target < scenes.length ? target : -1;
    const el = typeof target === 'string' ? document.getElementById(target.replace(/^#/, '')) : target;
    return sceneIndexOf(el);
  }

  function goTo(target, { immediate = false, duration } = {}) {
    const index = indexOfTarget(target);
    if (index < 0) return false;
    const go = () => scrollToTime(state.timings[index].focusTime, { immediate, duration });
    if (state.built) go();
    else ready.then(go);
    return true;
  }

  function handleHash(hash, options = {}) {
    const id = idFromHash(hash);
    if (!id) return;
    const el = document.getElementById(id);
    const scene = el?.closest('.scene') || null;
    if (scene) goTo(scene, options);
    emitter.emit('deeplink', { id, el, scene });
  }

  /** Keep a focused element visible: other scene → go there; panned scene → pan to it. */
  function revealFocused(target, index) {
    const t = state.timings[index];
    if (!t.pan) return;
    const { inner, pan } = parts[index];
    const box = inner.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    if (rect.top >= box.top && rect.bottom <= box.bottom) return;
    const natural = rect.top - box.top - gsap.getProperty(pan, 'y');
    const want = clamp(natural - box.height * PAN_FOCUS_TOP, 0, t.pan);
    scrollToTime(t.panStart + (want / t.pan) * (t.panEnd - t.panStart), { duration: FOCUS_SCROLL_S });
  }

  function showFocused(target, index) {
    if (index !== state.active) scrollToTime(state.timings[index].focusTime, { duration: FOCUS_SCROLL_S });
    else revealFocused(target, index);
  }

  function onFocusIn(event) {
    if (!state.built) return;
    const index = sceneIndexOf(event.target);
    if (index < 0) return;
    updateReach();
    state.pendingFocus = { target: event.target, at: performance.now() };
    showFocused(event.target, index);
  }

  /** A rebuild restores the old scroll position, cancelling a focus scroll still under way: run it again. */
  function resumeFocus() {
    const pending = state.pendingFocus;
    state.pendingFocus = null;
    if (!pending || performance.now() - pending.at > FOCUS_PENDING_MS) return;
    if (document.activeElement !== pending.target) return;
    const index = sceneIndexOf(pending.target);
    if (index >= 0) showFocused(pending.target, index);
  }

  function onClick(event) {
    const hash = hashTargetOf(event);
    if (!hash) return;
    const el = document.getElementById(idFromHash(hash));
    if (el && !el.closest('.scene')) return; // not ours (e.g. skip link target)
    event.preventDefault();
    history.pushState(null, '', hash);
    handleHash(hash);
  }

  /* --- resize --- */

  let rebuildTimer = 0;
  const scheduleRebuild = () => {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => state.built && rebuild(), REBUILD_DELAY_MS);
  };

  function onResize() {
    const changed = window.innerWidth !== state.width || stage.clientHeight !== state.height;
    if (changed) scheduleRebuild();
  }

  function watchContentSize() {
    const heights = new WeakMap();
    const observer = new ResizeObserver((entries) => {
      const changed = entries.some((entry) => {
        const h = Math.round(entry.contentRect.height);
        const before = heights.get(entry.target);
        heights.set(entry.target, h);
        return before !== undefined && before !== h;
      });
      if (changed) scheduleRebuild();
    });
    parts.forEach((p) => observer.observe(p.pan));
  }

  /* --- start --- */

  const listeners = [
    [document, 'focusin', onFocusIn], [document, 'click', onClick],
    [window, 'popstate', onPopState], [window, 'hashchange', onHashChange], [window, 'resize', onResize],
  ];

  /**
   * The head script's safety timer switched the page to flow mode while the
   * film was still starting (a slow device): undo the film and hand over to
   * flow mode, instead of finishing a film the CSS no longer shows.
   */
  function fallBackToFlow() {
    teardown();
    disposeLenis();
    spacer.style.height = '';
    listeners.forEach(([target, type, fn]) => target.removeEventListener(type, fn));
    parts.forEach((part) => part.inner.classList.remove(PANNED_CLASS));
    flow = createFlowFilm({ root: html, scenes, emitter });
    return flow.ready;
  }

  const ready = fontsReady().then(() => {
    if (fellBack()) throw ABORTED;
    html.classList.remove('rm');
    html.classList.add('film');
    return buildSliced();
  }).then(start, (error) => {
    if (error !== ABORTED) throw error;
    return fallBackToFlow();
  });

  function start() {
    state.built = true;
    onResize(); // the window may have changed size while the first build ran
    onUpdate();
    html.classList.add('film-ready');
    // Wait for load: the browser's own fragment scroll (to a fixed element) would undo the jump.
    afterLoad().then(() => handleHash(location.hash, { immediate: true }));
    watchContentSize();
    emitter.emit('ready', { enabled: true });
  }

  // Back/forward fires popstate and then (if the fragment changed) hashchange: handle the hash once.
  let poppedHash = null;
  function onPopState() {
    poppedHash = location.hash;
    handleHash(location.hash);
  }
  function onHashChange() {
    const handled = poppedHash === location.hash;
    poppedHash = null;
    if (!handled) handleHash(location.hash);
  }

  listeners.forEach(([target, type, fn]) => target.addEventListener(type, fn));

  return {
    get enabled() { return !flow; },
    ready,
    on: emitter.on,
    off: emitter.off,
    goTo: (target, options) => (flow ? flow.goTo(target) : goTo(target, options)),
    scrollToTime,
    refresh: scheduleRebuild,
    stop: () => lenis.stop(),
    start: () => lenis.start(),
    blend: () => state.blend || blendAt(0),
    timeOf: (target) => state.timings[indexOfTarget(target)] || null,
    get scenes() { return scenes; },
    get active() { return state.active; },
    get time() { return state.tl ? state.tl.time() : 0; },
    get total() { return state.total; },
    get progress() { return state.tl ? state.tl.time() / state.total : 0; },
    get velocity() { return lenis.velocity; },
    get timeline() { return state.tl; },
    get timings() { return state.timings.slice(); },
    lenis,
  };
}
