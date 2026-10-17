/**
 * Device budget and scheduling helpers shared by the stage layers.
 *
 * lowPower()   true on devices that should get the light versions of the
 *              decorative layers: Save-Data, ≤ 2 GB memory, ≤ 2 cores, or a
 *              coarse pointer on a small screen.
 * saveData()   the visitor asked to save data: skip the three.js download.
 * onIdle(cb)   run after first paint, when the main thread is idle.
 * createLoop() an rAF loop that sleeps while the tab is hidden and stops when
 *              its frame function reports there is nothing left to draw.
 */

const LOW_MEMORY_GB = 2;
const LOW_CORES = 2;
const SMALL_SCREEN_PX = 900; // longest side of a phone-sized screen
const IDLE_TIMEOUT_MS = 2500;

const connection = () => navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;

export function saveData() {
  return !!connection()?.saveData;
}

function smallTouchScreen() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return coarse && Math.max(screen.width || 0, screen.height || 0) <= SMALL_SCREEN_PX;
}

let lowPowerCache = null;

export function lowPower() {
  if (lowPowerCache !== null) return lowPowerCache;
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  lowPowerCache = saveData()
    || (Number.isFinite(memory) && memory <= LOW_MEMORY_GB)
    || (Number.isFinite(cores) && cores <= LOW_CORES)
    || smallTouchScreen();
  return lowPowerCache;
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
 * `wake()` is called (pointer move, scroll, field change …). Hidden tabs park
 * it too and wake it on return.
 */
export function createLoop(frame) {
  let id = 0;
  let last = 0;
  const tick = (now) => {
    id = 0;
    if (document.hidden) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    if (frame(now, dt)) id = requestAnimationFrame(tick);
    else last = 0;
  };
  const wake = () => {
    if (!id && !document.hidden) id = requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) wake();
  });
  return { wake, get running() { return id !== 0; } };
}
