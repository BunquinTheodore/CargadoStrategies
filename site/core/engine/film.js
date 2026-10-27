/**
 * The film: a list of discrete scenes, one shown at a time, moved by played
 * cuts (DIRECTION §9; the contract is plan/round5/api.md, the guide ENGINE.md).
 *
 *   const film = initFilm({ root: document });
 *   film.on('cut', ({ toEl, tl, dir }) => { … append choreography to tl at a label … });
 *
 * Modes, decided once per load and mirrored on html[data-mode]:
 *   'cut'        fine pointer: scenes stacked in the fixed .stage; wheel, keys
 *                and focus become cuts (film-snap.js); the document scroll
 *                only holds one slot per scene (film-map.js).
 *   'touch-cut'  coarse pointer: scenes in flow with native mandatory snap;
 *                the field changes at 35% visibility and the in group plays at
 *                60% (touch-cut.js).
 *   'flow'       reduced motion (OS or the footer switch), no GSAP, or the head
 *                safety timer fired: film-flow.js, the same API.
 *
 * A cut (cut.js) is one GSAP timeline: out → iris (field change, iris.js) or
 * the same-field hold → in group (film-reveals.js) → stop → 'settled' at
 * 0.95 s. 'cut' listeners append to it before it plays; 'landed' fires when
 * all of it is done. During a cut, input is ignored until 70%, then one step
 * queues and starts at 'settled'; jumps (Home/End, nav, hash, focus,
 * [data-cut]) interrupt at once. Keyboard reach (film-reach.js) parks the
 * controls of far scenes in cut mode. Each cut's style (iris, dot, quad,
 * flood) comes from the scenes' data-transition (transitions.js), in cut and
 * touch-cut mode alike; the in group's from the entered scene's data-entrance.
 */
import { createEmitter, fontsReady, sceneTitle, hashTargetOf } from './film-events.js';
import { createFlowFilm } from './film-flow.js';
import { prepareInGroup } from './film-reveals.js';
import { buildCut } from './cut.js';
import { transitionFor } from './transitions.js';
import { irisTo, irisFades, fieldsEl, irisEl } from './iris.js';
import { createReach } from './film-reach.js';
import { createLinks, isSheetHash } from './film-links.js';
import { createSnap } from './film-snap.js';
import { createTouchCut } from './touch-cut.js';
import { buildSlots, locate, nearestSlot } from './film-map.js';
import { getTier } from './tier.js';
import { yieldToMain, noteActivity } from './perf.js';
import { prefersReducedMotion } from './motion-pref.js';
import { CUT, DUR } from './motion-tokens.js';

export const SHORT_H = 560; // below this stage height: the pan fallback (cut) or free scroll (touch-cut)
const PAN_TOLERANCE_PX = 4;
const REBUILD_DELAY_MS = 200;
const SPLASH_WAIT_MS = 4100; // the first landing waits for the splash's cue (≈ 3.55 s in), never longer than this
const TOUCH_FADE_S = 0.2; // touch-cut: text leaving the field it was written for
const TOUCH_IRIS_FROM = 0.15; // touch-cut: the swell starts as a disc, never a lone dot
const TOUCH_FADE_AT = 0.45; // share of the touch iris before the old text fades: the disc covers about 30% of the screen by then
const TOUCH_SWAP_AT = 0.16; // tier C touch swap: the old text is under 20% by then
const TOUCH_SHOW_AT = DUR.iris / 2; // touch-cut: a section's text waits until its field's iris is this far (the header swap)
const LAID_OUT_CLASS = 'is-laid-out';
const PANNED_CLASS = 'is-panned';
const FALLBACK_CLASS = 'film-fallback';
const MODE_CLASS = { cut: 'film', 'touch-cut': 'touch-cut', flow: 'rm' };
const JUMP_CAUSES = new Set(['goto', 'hash', 'focus', 'click', 'load']);
const ABORTED = Symbol('film build aborted');
const PERCENT_ORIGIN = /^(-?[\d.]+)%\s+(-?[\d.]+)%$/;

const html = document.documentElement;
const mm = (query) => !!window.matchMedia?.(query).matches;
const coarsePointer = () => mm('(pointer: coarse)') && !mm('(hover: hover) and (pointer: fine)');
const fieldOf = (el) => el?.dataset.field || 'ink';
/** What transitions.js needs from a scene: its data-transition, and whether it shows the dot-globe. */
const lookOf = (el) => (el ? { transition: el.dataset.transition, globe: !!el.dataset.globeMode && el.dataset.globeMode !== 'hidden' } : null);
const centreOf = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Round 4 'build' listeners still append scrubbed tweens: give them a sink until stage 6 (api.md AMENDMENTS). */
const BUILD_SINK = new Proxy({}, { get: (_, key) => (key === 'then' ? undefined : () => BUILD_SINK) });
const TIMING_STUB = Object.freeze({
  start: 0, end: 0, dur: 0, base: 0, inStart: 0, inEnd: 0, inDur: 0, outStart: 0, outDur: 0, irisEnd: 0,
  focusTime: 0, panStart: 0, panEnd: 0, pan: 0, activeFrom: 0,
});

/** The mode the head script would pick, plus the two things only JS knows (GSAP present, fallback fired). */
export function decideMode() {
  if (html.classList.contains(FALLBACK_CLASS) || !window.gsap || prefersReducedMotion()) return 'flow';
  return coarsePointer() ? 'touch-cut' : 'cut';
}

export function setMode(mode) {
  html.classList.remove('film', 'touch-cut', 'rm');
  html.classList.add('js', MODE_CLASS[mode]);
  html.setAttribute('data-mode', mode);
}

export function initFilm({ root = document } = {}) {
  const stage = root.querySelector('.stage');
  const scenes = Array.from(root.querySelectorAll('.scene'));
  const emitter = createEmitter();
  const mode = stage && scenes.length ? decideMode() : 'flow';
  setMode(mode);
  if (scenes.length) html.dataset.field = fieldOf(scenes[0]);
  if (mode === 'flow') return createFlowFilm({ scenes, emitter });
  return createFilm({ stage, scenes, emitter, mode });
}

/** Ensure .scene__inner > .scene__pan (the pan is what a cut moves as one group). */
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
  return { el, inner, pan, items: [], over: 0 };
}

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

/** Resolve after window load plus two frames. */
function afterLoad() {
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
  const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  return loaded.then(frame).then(frame);
}

const splashPending = () => !!document.getElementById('splash') && !html.classList.contains('splash-done');

/**
 * Resolve on the splash's cue for the first landing: the ring hand-off
 * (cs:splash-aperture, so the words rise through the opening) or the splash
 * gone (html.splash-done: skipped, reduced), at most SPLASH_WAIT_MS; at once
 * when there is none.
 */
function splashCue() {
  if (!splashPending()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      observer.disconnect();
      document.removeEventListener('cs:splash-aperture', done);
      clearTimeout(timer);
      resolve();
    };
    const observer = new MutationObserver(() => html.classList.contains('splash-done') && done());
    const timer = setTimeout(done, SPLASH_WAIT_MS);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('cs:splash-aperture', done, { once: true });
  });
}

function createFilm({ stage, scenes, emitter, mode }) {
  const { gsap } = window;
  const touchMode = mode === 'touch-cut';
  if (touchMode) gsap.config({ force3D: false }); // phones: 2D transforms only (iPhone layer memory)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const parts = scenes.map(prepareScene);
  const links = createLinks(scenes);
  const reach = createReach(scenes);
  const spacer = touchMode ? null : ensureSpacer();
  fieldsEl();
  irisEl();
  const state = {
    current: -1, built: false, cutting: null, cut: null, queued: null, field: fieldOf(scenes[0]),
    width: 0, height: 0, snapOff: false, slots: buildSlots(scenes.map(() => 0), 1),
    stops: new Map(), pendingGo: null, touchIris: null,
  };
  let flow = null;
  let snap = null;
  let touch = null;
  let pendingEnter = null; // touch-cut: a 0.6 crossing waiting for its field's iris
  const fellBack = () => html.classList.contains(FALLBACK_CLASS) || html.getAttribute('data-mode') === 'flow';

  // Before the first build only the opening scene shows; every other pan holds its out state.
  // Setting y also parses each pan's transform once, so no cut reads computed style (cut.js).
  const opening = Math.max(0, links.indexOf(location.hash));
  parts.forEach((part, i) => {
    part.el.classList.toggle('is-active', i === opening);
    gsap.set(part.pan, i === opening ? { y: 0 } : { y: 0, opacity: 0 });
  });

  /* --- layout --- */

  const stageHeight = () => (touchMode ? window.innerHeight : stage.clientHeight);

  function measureOverflow(part) {
    const over = Math.max(0, Math.round(part.pan.offsetHeight - part.inner.clientHeight));
    if (over > PAN_TOLERANCE_PX) part.el.dataset.overflow = String(over);
    else delete part.el.dataset.overflow;
    part.over = over;
    return over;
  }

  function measure() {
    state.width = window.innerWidth;
    state.height = stageHeight();
    state.snapOff = state.height < SHORT_H;
    html.classList.toggle('snap-off', state.snapOff);
    parts.forEach(measureOverflow);
    if (touchMode) return;
    const pans = parts.map((p) => (state.snapOff && p.over > PAN_TOLERANCE_PX ? p.over : 0));
    parts.forEach((p, i) => p.inner.classList.toggle(PANNED_CLASS, pans[i] > 0));
    state.slots = buildSlots(pans, state.height);
    spacer.style.height = `${Math.ceil(state.slots.total)}px`;
  }

  const emitBuild = (part, index) => emitter.emit('build', {
    sceneEl: part.el, index, mode, tl: BUILD_SINK, timing: TIMING_STUB, sceneStart: 0,
  });

  /* --- cuts --- */

  const holdY = (i) => (spacer ? spacer.offsetTop : 0) + (state.slots.starts[i] ?? 0);
  const snapOn = () => state.built && !state.snapOff && !flow;
  const isStopped = () => state.stops.size > 0 || !!document.querySelector('dialog[open], [aria-modal="true"]:not([hidden])');

  /**
   * The stop's centre. A swipe (live) uses where the swipe has carried it,
   * kept on screen, so the disc opens on the stop the visitor sees. A
   * programmatic touch cut has already jumped the scroll, so it uses the
   * stop's offset inside its snapped section (where it rests).
   */
  function stopOrigin(stop, sceneEl, live) {
    const at = centreOf(stop);
    if (live) return { x: at.x, y: Math.min(window.innerHeight, Math.max(0, at.y)), stop: true };
    if (!touchMode || state.snapOff) return { ...at, stop: true };
    return { x: at.x, y: at.y - sceneEl.getBoundingClientRect().top, stop: true };
  }

  function resolveOrigin(index, from, { origin, trigger, live = false }) {
    if (origin instanceof Element) return centreOf(origin);
    if (origin && Number.isFinite(origin.x) && Number.isFinite(origin.y)) return { x: origin.x, y: origin.y };
    const centre = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const spec = (scenes[index].dataset.iris || 'trigger').trim();
    if (spec === 'center') return centre;
    if (spec === 'stop') {
      const stop = from >= 0 ? scenes[from].querySelector('.stop') : null;
      return stop ? stopOrigin(stop, scenes[from], live) : centre;
    }
    const pct = spec.match(PERCENT_ORIGIN);
    if (pct) return { x: (parseFloat(pct[1]) / 100) * window.innerWidth, y: (parseFloat(pct[2]) / 100) * window.innerHeight };
    return trigger instanceof Element ? centreOf(trigger) : centre;
  }

  /**
   * Scene classes and keyboard reach (cached flags, no layout read). The root
   * attributes html[data-scene] and html[data-field] restyle the whole
   * document, so they are written once per cut, at the landing (commitRoot).
   */
  function setCurrent(index) {
    state.current = index;
    scenes.forEach((el, i) => {
      el.classList.toggle('is-active', i === index);
      el.classList.toggle('is-near', Math.abs(i - index) === 1);
    });
    const el = scenes[index];
    if (touchMode) reach.release();
    else reach.update(index);
    emitter.emit('scene', { index, id: el.id, el, field: fieldOf(el), title: sceneTitle(el), count: scenes.length });
  }

  /** Field shown without an iris (first landing, touch crossfades end here too). */
  function showField(field, from = state.field) {
    fieldsEl().setAttribute('data-field', field);
    html.setAttribute('data-hdr-field', field);
    state.field = field;
    if (field !== from) emitter.emit('field', { field, from });
  }

  function finishCut() {
    const tl = state.cutting;
    if (!tl) return;
    state.queued = null;
    tl.progress(1); // fires 'landed' synchronously
  }

  function commitRoot(index) {
    const el = scenes[index];
    html.dataset.scene = el.id;
    html.dataset.field = fieldOf(el);
    html.classList.remove('is-cutting');
  }

  function landed(info) {
    const { index, from, cause, link } = info;
    state.cutting = null;
    state.cut = null;
    commitRoot(index);
    scenes.forEach((el, i) => {
      el.classList.remove('is-entering');
      if (i !== index) el.classList.remove('is-leaving');
    });
    scenes[index].classList.remove('is-leaving');
    if (snap && !state.snapOff) snap.hold(index);
    if (snap && state.snapOff) {
      if (locate(state.slots, window.scrollY - holdY(0)).index !== index) snap.hold(index); // a jump: scroll into its slot
      applyPan();
    }
    noteActivity();
    const el = scenes[index];
    emitter.emit('landed', { index, id: el.id, el, field: fieldOf(el), from, cause, mode });
    if (link) links.openFor(link, api);
    const queued = state.queued;
    state.queued = null;
    if (queued && queued.index !== state.current) request(queued.index, { ...queued.opts, jump: true });
  }

  /** At 'settled' a queued step starts: page appends past it are finished first. */
  function onSettled(tl) {
    if (!state.queued || state.cutting !== tl) return;
    Promise.resolve().then(() => { if (state.cutting === tl) tl.progress(1); });
  }

  function play(index, opts = {}) {
    const { cause = 'goto', immediate = false, seek = null, link = null, hold = false } = opts;
    const from = state.current;
    const fromPart = from >= 0 ? parts[from] : null;
    const toPart = parts[index];
    const dir = from < 0 ? 1 : Math.sign(index - from) || 1;
    const toField = fieldOf(toPart.el);
    const fromField = state.field;
    const fieldChange = toField !== fromField;
    const origin = resolveOrigin(index, from, opts);
    const withIris = fieldChange && from >= 0 && (!touchMode || opts.programmatic);
    const transition = from >= 0 ? transitionFor({ from: lookOf(fromPart.el), to: lookOf(toPart.el), dir, fieldChange }) : null;
    pendingEnter?.kill();
    pendingEnter = null;
    if (fieldChange && withIris) state.field = toField;
    // Built before any class changes, so building it never meets invalidated style.
    const tl = buildCut({
      from: fromPart, to: toPart, dir, origin, fieldChange, withIris, toField, tier: getTier(), mode, transition,
      onHalf: ({ field }) => emitter.emit('field', { field, from: fromField }),
    });
    setCurrent(index);
    html.classList.add('is-cutting');
    toPart.el.classList.add('is-entering');
    fromPart?.el.classList.add('is-leaving');
    if (fieldChange && !withIris) showField(toField); // first landing, or a touch section entered before its field turned
    tl.call(() => onSettled(tl), null, 'settled');
    tl.eventCallback('onComplete', () => landed({ index, from, cause, link }));
    state.cutting = tl;
    state.cut = { index, from, cause };
    emitter.emit('cut', {
      from, to: index, dir, tl, cause, origin, fieldChange, fromField, toField,
      fromEl: fromPart?.el || null, toEl: toPart.el, mode, immediate, transition,
    });
    if (immediate) tl.progress(1);
    else if (seek !== null) tl.progress(seek);
    else if (hold) tl.progress(0); // the first landing: start states now, played on the splash's cue
    else tl.play();
    return tl;
  }

  /**
   * Every cut request: resolve, apply the input lock (steps) or interrupt
   * (jumps), then play. Touch-cut programmatic cuts jump the scroll first.
   */
  function request(target, opts = {}) {
    const index = links.indexOf(target);
    if (index < 0) return false;
    if (!state.built) {
      state.pendingGo = [index, opts];
      return true;
    }
    if (flow) return flow.goTo(index);
    const jump = opts.jump ?? JUMP_CAUSES.has(opts.cause || 'goto');
    if (state.cutting) {
      if (!jump) {
        const tl = state.cutting;
        if (tl.time() < CUT.lockAt * CUT.total) return false;
        if (index === state.current) return true;
        state.queued ??= { index, opts };
        return true;
      }
      finishCut();
    }
    if (index === state.current) return true;
    if (touchMode) {
      touch.jumpTo(index);
      return !!play(index, { ...opts, programmatic: true });
    }
    play(index, opts);
    return true;
  }

  const step = (dir, cause) => {
    const base = state.current;
    const index = base + dir;
    if (index < 0 || index >= scenes.length) return false;
    return request(index, { cause, jump: false });
  };

  /* --- the pan fallback (cut mode, stage < 560 px): the scroll pans the current scene --- */

  function applyPan() {
    const { index, offset } = locate(state.slots, Math.max(0, window.scrollY - holdY(0)));
    if (index !== state.current) {
      if (!state.cutting) request(index, { cause: 'wheel', jump: true });
      return;
    }
    if (!state.cutting) gsap.set(parts[index].pan, { y: -offset });
  }

  function onPanScroll() {
    if (state.built && !flow && !touchMode && state.snapOff) applyPan();
  }

  /* --- touch-cut field and in group --- */

  /**
   * A swipe that turns back before the field has turned plays the same iris
   * backwards (and forwards again if it turns once more): one disc, never a
   * second iris over the first, and the old section's text fades back.
   */
  function onTouchField(index) {
    const field = fieldOf(scenes[index]);
    const running = state.touchIris;
    const showOwn = () => {
      if (index !== state.current) return;
      gsap.to(parts[index].pan, { opacity: 1, duration: TOUCH_FADE_S, delay: irisWait(field), overwrite: 'auto' });
    };
    if (running && (field === running.from || field === running.to)) {
      state.field = field;
      fadeOthers(index);
      if (field === running.from) running.tl.reverse();
      else running.tl.play();
      showOwn();
      return;
    }
    if (field === state.field && !running) {
      fadeOthers(index);
      return;
    }
    running?.tl.reversed(false).progress(1); // a third field: the running iris lands first
    const from = running ? running.to : state.field;
    state.field = field;
    const origin = resolveOrigin(index, state.current, { live: true });
    // The old text stays while the disc is small (the disc covers it as it grows); on a swap it fades first.
    fadeOthers(index, irisFades(getTier(), origin) ? 0 : TOUCH_FADE_AT * DUR.iris);
    const dir = Math.sign(index - state.current) || 1;
    const look = { from: lookOf(scenes[state.current]), to: lookOf(scenes[index]), dir, fieldChange: true };
    const tl = irisTo(field, origin, {
      shape: transitionFor(look) || 'iris',
      dir,
      from: TOUCH_IRIS_FROM,
      swapAt: TOUCH_SWAP_AT,
      onHalf: ({ field: shown }) => emitter.emit('field', { field: shown, from: shown === field ? from : field }),
    });
    const done = () => { if (state.touchIris?.tl === tl) state.touchIris = null; };
    tl.eventCallback('onComplete', done);
    const reversed = tl.eventCallback('onReverseComplete');
    tl.eventCallback('onReverseComplete', () => { reversed?.(); done(); });
    state.touchIris = { tl, from, to: field, showAt: irisFades(getTier(), origin) ? TOUCH_SWAP_AT : TOUCH_SHOW_AT };
    showOwn();
  }

  /**
   * Seconds until the running touch iris has turned the screen to `field`
   * (the header swap on a circle, the swap itself on tier C). Text written for
   * that field waits until then, so it never shows over the old field (§9.3).
   * 0 when no iris is heading for `field`.
   */
  function irisWait(field) {
    const running = state.touchIris;
    if (!running) return 0;
    const back = running.tl.reversed();
    if ((back ? running.from : running.to) !== field) return 0;
    const t = running.tl.time();
    return Math.max(0, back ? t - running.showAt : running.showAt - t);
  }

  /** Text that would sit on the wrong field fades out as the field changes. */
  function fadeOthers(owner, delay = 0) {
    parts.forEach((part, i) => {
      if (i === owner || fieldOf(part.el) === fieldOf(scenes[owner])) return;
      gsap.to(part.pan, { opacity: 0, duration: TOUCH_FADE_S, delay, ease: 'none', overwrite: 'auto' });
    });
  }

  /** The 0.6 crossing: the section's cut (its in group) plays once its field is on screen. */
  function onTouchEnter(index) {
    pendingEnter?.kill();
    pendingEnter = null;
    if (index === state.current) return;
    const wait = irisWait(fieldOf(scenes[index]));
    if (wait > 0) {
      pendingEnter = gsap.delayedCall(wait, () => onTouchEnter(index));
      return;
    }
    if (state.cutting) finishCut();
    play(index, { cause: 'touch' });
  }

  /* --- rebuilds: resize, or a scene's overflow changed (R4 shared.md §7.4) --- */

  let rebuildTimer = 0;
  const scheduleRebuild = () => {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => state.built && !flow && rebuild(), REBUILD_DELAY_MS);
  };

  function rebuild() {
    finishCut();
    measure();
    parts.forEach((part, i) => {
      part.items = prepareInGroup(part.el);
      emitBuild(part, i);
    });
    if (!touchMode) {
      reach.refresh();
      snap.hold(state.current); // the slots changed size: rest on the current scene's slot
      if (state.snapOff) applyPan();
    }
    emitter.emit('rebuilt', {});
  }

  /** Touch-cut ignores the URL bar sliding (height only matters when it crosses SHORT_H). */
  function onResize() {
    const height = stageHeight();
    const resized = touchMode ? (height < SHORT_H) !== state.snapOff : height !== state.height;
    if (window.innerWidth !== state.width || resized) scheduleRebuild();
  }

  function watchOverflow() {
    const observer = new ResizeObserver(() => {
      const changed = parts.some((part) => {
        const before = part.over;
        const now = Math.max(0, Math.round(part.pan.offsetHeight - part.inner.clientHeight));
        return now !== before && (now > 0 || before > 0);
      });
      if (changed) scheduleRebuild();
    });
    parts.forEach((part) => observer.observe(part.pan));
  }

  /* --- links, hashes, focus --- */

  function handleHash(hash, opts = {}) {
    const link = links.parse(hash);
    if (!link) return false;
    emitter.emit('deeplink', { id: link.id, alias: link.alias, el: link.el, scene: link.scene, open: link.open });
    if (link.index === state.current && !state.cutting) {
      links.openFor(link, api);
      return true;
    }
    return request(link.index, { cause: 'hash', ...opts, link });
  }

  function onClick(event) {
    const cutter = event.target.closest?.('[data-cut]');
    if (cutter && !event.defaultPrevented) {
      const want = cutter.dataset.cut;
      const target = want === 'next' ? state.current + 1 : want === 'prev' ? state.current - 1 : want;
      if (links.indexOf(target) >= 0) {
        event.preventDefault();
        request(target, { cause: 'click', trigger: cutter });
      }
      return;
    }
    const hash = hashTargetOf(event);
    if (!hash || isSheetHash(hash) || !links.parse(hash)) return; // not ours (skip link, the WhatsApp sheet)
    event.preventDefault();
    history.pushState(null, '', hash);
    handleHash(hash, { trigger: event.target.closest('a') });
  }

  function onFocusIn(event) {
    if (!state.built || touchMode) return;
    const index = links.sceneIndexOf(event.target);
    if (index < 0) return;
    reach.update(state.current);
    if (index !== state.current) request(index, { cause: 'focus' });
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

  /* --- input hold for menus and dialogs (reference-counted by token) --- */

  function stop(token = 'default') {
    state.stops.set(token, (state.stops.get(token) || 0) + 1);
    html.classList.add('film-stopped');
    snap?.stop();
  }

  function start(token = 'default') {
    const n = (state.stops.get(token) || 0) - 1;
    if (n > 0) state.stops.set(token, n);
    else state.stops.delete(token);
    if (state.stops.size) return;
    html.classList.remove('film-stopped');
    snap?.start();
  }

  /* --- start-up --- */

  const listeners = [
    [document, 'focusin', onFocusIn], [document, 'click', onClick], [window, 'popstate', onPopState],
    [window, 'hashchange', onHashChange], [window, 'resize', onResize], [window, 'scroll', onPanScroll],
  ];

  async function buildSliced() {
    for (const part of parts) {
      part.items = prepareInGroup(part.el);
      await yieldToMain();
      if (fellBack()) throw ABORTED;
    }
    measure();
    for (let i = 0; i < parts.length; i += 1) {
      emitBuild(parts[i], i);
      parts[i].el.classList.add(LAID_OUT_CLASS);
      await yieldToMain();
      if (fellBack()) throw ABORTED;
    }
    if (!touchMode) reach.refresh(); // laid out: which scenes hold a rendered control is read once, here
  }

  /**
   * The first landing (cause 'load', from −1): immediate when a hash names
   * the scene; otherwise its start states render at once, under the splash,
   * and it plays on the splash's cue, so the composed hero never shows first
   * and then resets.
   */
  function land() {
    const link = links.parse(location.hash);
    const index = link ? link.index : 0;
    showField(fieldOf(scenes[index]), null);
    state.built = true;
    if (link) emitter.emit('deeplink', { id: link.id, alias: link.alias, el: link.el, scene: link.scene, open: link.open });
    return new Promise((resolve) => {
      const off = emitter.on('landed', () => { off(); resolve(); });
      if (touchMode) {
        if (link) scenes[index].scrollIntoView({ block: 'start', behavior: 'instant' });
        touch.arm(index);
      }
      const hold = !link && splashPending();
      const tl = play(index, { cause: 'load', immediate: !!link, link, hold });
      if (hold) splashCue().then(() => { if (state.cutting === tl && tl.paused()) tl.play(); });
      // The browser's own fragment scroll (to a fixed element) runs at load and would undo the hold.
      if (snap) afterLoad().then(() => !state.snapOff && !state.cutting && snap.hold(state.current));
    });
  }

  /** The head script's safety timer gave up on the film while it was starting: hand over to flow mode. */
  function fallBackToFlow() {
    snap?.destroy();
    touch?.destroy();
    listeners.forEach(([target, type, fn]) => target.removeEventListener(type, fn));
    parts.forEach((part) => gsap.set(part.pan, { clearProps: 'opacity,transform' }));
    if (spacer) spacer.style.height = '';
    setMode('flow');
    flow = createFlowFilm({ scenes, emitter });
    return flow.ready;
  }

  const engine = {
    isOn: snapOn,
    isBuilt: () => state.built,
    isBlocked: isStopped,
    isCutting: () => !!state.cutting,
    step,
    jump: (index, cause) => request(index, { cause, jump: true }),
    current: () => Math.max(0, state.current),
    last: () => scenes.length - 1,
    holdY,
    nearest: (y) => nearestSlot(state.slots, y - holdY(0)),
    stageHeight,
  };
  if (touchMode) touch = createTouchCut(scenes, { onField: onTouchField, onEnter: onTouchEnter });
  else snap = createSnap(engine);
  listeners.forEach(([target, type, fn]) => target.addEventListener(type, fn, type === 'scroll' ? { passive: true } : false));

  const ready = fontsReady()
    .then(() => { if (fellBack()) throw ABORTED; })
    .then(buildSliced)
    .then(() => { if (fellBack()) throw ABORTED; })
    .then(land)
    .then(() => {
      html.classList.add('film-ready');
      onResize(); // the window may have changed size while the first build ran
      watchOverflow();
      emitter.emit('ready', { mode });
      const pending = state.pendingGo;
      state.pendingGo = null;
      if (pending) request(...pending);
    }, (error) => {
      if (error !== ABORTED) throw error;
      return fallBackToFlow();
    });

  const goTo = (target, opts = {}) => request(target, { cause: 'goto', ...opts, jump: true });

  const api = {
    get mode() { return flow ? 'flow' : mode; },
    get enabled() { return !flow; },
    ready,
    get scenes() { return scenes; },
    get current() { return flow ? flow.current : Math.max(0, state.current); },
    get active() { return this.current; },
    get currentScene() { return scenes[this.current]; },
    get isCutting() { return !!state.cutting; },
    on: emitter.on,
    off: emitter.off,
    cut: (to, opts = {}) => (flow ? flow.cut(to, opts) : request(to, { cause: 'goto', ...opts, jump: opts.jump ?? JUMP_CAUSES.has(opts.cause || 'goto') })),
    next: (opts = {}) => (flow ? flow.next(opts) : state.current + 1 < scenes.length && request(state.current + 1, { cause: 'step', ...opts, jump: false })),
    prev: (opts = {}) => (flow ? flow.prev(opts) : state.current > 0 && request(state.current - 1, { cause: 'step', ...opts, jump: false })),
    goTo: (target, opts) => (flow ? flow.goTo(target, opts) : goTo(target, opts)),
    seekCut(to, progress) {
      const index = links.indexOf(to);
      if (flow || !state.built || index < 0 || index === state.current) return null;
      finishCut();
      if (touchMode) touch.jumpTo(index);
      return play(index, { cause: 'goto', seek: Math.min(1, Math.max(0, progress)), programmatic: true });
    },
    refreshReach: () => {
      if (flow || touchMode) return;
      reach.refresh(); // content changed (tabs, pagers): read the focusable flags again
      reach.update(state.current);
    },
    isParked: (el) => (!flow && !touchMode ? reach.isParked(el) : false),
    stop: (token) => (flow ? flow.stop(token) : stop(token)),
    start: (token) => (flow ? flow.start(token) : start(token)),
    irisTo,
    refresh: scheduleRebuild,
    get lenis() { return snap?.lenis ?? null; },
    // Round 4 compatibility, removed in stage 6 (api.md §19).
    snap: {
      get enabled() { return snapOn(); },
      get current() { return Math.max(0, state.current); },
      next: () => api.next(),
      prev: () => api.prev(),
      to: (i, opts) => api.goTo(i, opts),
      block: (token) => api.stop(token),
      unblock: (token) => api.start(token),
    },
    scrollToTime: () => {},
    timeOf: () => null,
    blend: () => ({ from: state.field, to: state.field, mix: 1 }),
    time: 0,
    total: 0,
    progress: 0,
    velocity: 0,
    timeline: null,
    timings: [],
  };
  return api;
}
