/**
 * Device budget and scheduling helpers shared by the engine and the layers.
 *
 * lowPower()        Round 4 name, kept: true on tiers B and C (tier.js). New
 *                   code reads tierConfig() instead.
 * saveData()        the visitor asked to save data.
 * onIdle(cb)        run after first paint, when the main thread is idle.
 * createLoop()      an rAF loop that sleeps while the tab is hidden, when its
 *                   frame function reports nothing left to draw, and (with
 *                   idleMs) a fixed time after its last wake: the 5 s rule.
 * onInputIdle(cb)   cb once no pointer, wheel, key, touch or landing has
 *                   happened for 5 s; re-armed by the next input.
 */
import { getTier } from './tier.js';
import { DUR } from './motion-tokens.js';

const IDLE_TIMEOUT_MS = 2500;
const INPUT_EVENTS = ['pointermove', 'pointerdown', 'wheel', 'keydown', 'touchstart'];

const connection = () => navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;

export function saveData() {
  return !!connection()?.saveData;
}

export function lowPower() {
  return getTier() !== 'A';
}

/**
 * Longest stretch of work before handing the main thread back. A "long task"
 * is 50 ms on the visitor's device, and a mid-range phone runs about 4× slower
 * than a laptop (Lighthouse's mobile model), so slices stay under 10 ms here.
 */
export const TASK_BUDGET_MS = 6;

const yieldChannel = new MessageChannel();
const yieldQueue = [];
yieldChannel.port1.onmessage = () => yieldQueue.shift()?.();

/**
 * Let the browser paint and handle input before the next slice of work: a
 * fresh macrotask through a MessageChannel. (setTimeout chains are clamped to
 * 4 ms after a few levels, and scheduler.yield() inherits the priority of the
 * task that calls it, so work started from an idle callback could wait for
 * idle time that the animation loops never leave.)
 */
export function yieldToMain() {
  return new Promise((resolve) => {
    yieldQueue.push(resolve);
    yieldChannel.port2.postMessage(null);
  });
}

/**
 * Run `fn(item)` over `items` in slices of at most TASK_BUDGET_MS, yielding
 * between slices, so a big job never becomes one long task.
 */
export async function forEachSliced(items, fn, budget = TASK_BUDGET_MS) {
  let sliceStart = performance.now();
  for (let i = 0; i < items.length; i += 1) {
    fn(items[i], i);
    if (performance.now() - sliceStart > budget) {
      await yieldToMain();
      sliceStart = performance.now();
    }
  }
}

/** Fine pointer that can hover (mouse, trackpad): the only place hover physics run. */
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Run `cb` once the page has painted and the main thread is idle (setTimeout fallback). */
export function onIdle(cb, timeout = IDLE_TIMEOUT_MS) {
  const afterPaint = () => requestAnimationFrame(() => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(cb, { timeout });
    else setTimeout(cb, 1);
  });
  if (document.readyState === 'complete') afterPaint();
  else window.addEventListener('load', afterPaint, { once: true });
}

/**
 * rAF loop that never spins without work. `frame(now, dt)` returns true while
 * it still has something to animate; returning false parks the loop until
 * `wake()` is called (pointer move, a cut, a field change …). Hidden tabs park
 * it too and wake it on return. With `idleMs` (use DUR.idleStopMs) the loop
 * also parks itself that long after the last wake(), whatever frame returns.
 */
export function createLoop(frame, { idleMs = 0 } = {}) {
  let id = 0;
  let last = 0;
  let wokeAt = 0;
  const tick = (now) => {
    id = 0;
    if (document.hidden) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    const expired = idleMs > 0 && performance.now() - wokeAt >= idleMs;
    if (frame(now, dt) && !expired) id = requestAnimationFrame(tick);
    else last = 0;
  };
  const wake = () => {
    wokeAt = performance.now();
    if (!id && !document.hidden) id = requestAnimationFrame(tick);
  };
  const sleep = () => {
    if (id) cancelAnimationFrame(id);
    id = 0;
    last = 0;
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) wake();
  });
  return { wake, sleep, get running() { return id !== 0; } };
}

/* ---------- input idle (the 5 s rule, DIRECTION §2) ---------- */

const idleWatchers = new Set();
let lastActivity = performance.now();
let inputHooked = false;

function arm(watcher) {
  if (watcher.timer) return;
  const wait = Math.max(0, watcher.ms - (performance.now() - lastActivity));
  watcher.timer = setTimeout(() => {
    watcher.timer = 0;
    const quiet = performance.now() - lastActivity;
    if (quiet < watcher.ms) arm(watcher); // input arrived meanwhile: wait out the rest
    else if (!watcher.fired) {
      watcher.fired = true;
      watcher.cb();
    }
  }, wait);
}

/** Record activity that is not a DOM input event (the engine calls it on every landing). */
export function noteActivity() {
  lastActivity = performance.now();
  idleWatchers.forEach((watcher) => {
    watcher.fired = false;
    arm(watcher);
  });
}

/** cb() once `ms` passes with no pointer, wheel, key, touch or landing; re-armed by the next one. Returns unsubscribe. */
export function onInputIdle(cb, ms = DUR.idleStopMs) {
  if (!inputHooked) {
    inputHooked = true;
    INPUT_EVENTS.forEach((type) => window.addEventListener(type, noteActivity, { passive: true, capture: true }));
  }
  const watcher = { cb, ms, timer: 0, fired: false };
  idleWatchers.add(watcher);
  arm(watcher);
  return () => {
    clearTimeout(watcher.timer);
    idleWatchers.delete(watcher);
  };
}
