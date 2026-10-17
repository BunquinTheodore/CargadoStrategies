/**
 * Batched timeline building (performance).
 *
 * GSAP reads an element's computed transform (and, with no inline value, its
 * computed opacity) the first time a tween touches it, then writes the tween's
 * from-state. Built one tween after another, every read lands right after the
 * previous write and forces a fresh style and layout pass: hundreds of them
 * for the split headings, the biggest cost of loading a page.
 *
 * So the film builds in three steps:
 *   1. record   every builder (engine and page 'build' listeners) writes into
 *               a recorder with the same fromTo / to / from / set API;
 *   2. prime    all recorded targets are read in one batch (one layout), which
 *               fills GSAP's transform cache, and opacity is copied inline;
 *   3. replay   the calls go to the real timeline in their original order, and
 *               GSAP now works from its cache without touching layout.
 *
 * Builders that measure the DOM (story.js pose fitter) now measure before any
 * from-state is written, i.e. the settled layout they are meant to see.
 */

import { forEachSliced } from './perf.js';

const TIMELINE_METHODS = ['fromTo', 'to', 'from', 'set'];
const TRANSFORM_KEYS = new Set([
  'x', 'y', 'z', 'xPercent', 'yPercent', 'scale', 'scaleX', 'scaleY', 'rotation', 'rotate',
  'rotationX', 'rotationY', 'rotationZ', 'skewX', 'skewY', 'transform', 'transformPerspective',
]);
const FADE_KEYS = new Set(['opacity', 'autoAlpha']);

/** A stand-in timeline that only records calls. */
export function createRecorder() {
  const calls = [];
  const recorder = { calls };
  TIMELINE_METHODS.forEach((method) => {
    recorder[method] = (...args) => {
      calls.push([method, args]);
      return recorder;
    };
  });
  return recorder;
}

const varsOf = (method, args) => (method === 'fromTo' ? [args[1], args[2]] : [args[1]]);

function targetsOf(calls) {
  const transforms = new Set();
  const fades = new Set();
  calls.forEach(([method, args]) => {
    const keys = varsOf(method, args).flatMap((vars) => Object.keys(vars || {}));
    const moves = keys.some((k) => TRANSFORM_KEYS.has(k));
    const fadesIt = keys.some((k) => FADE_KEYS.has(k));
    if (!moves && !fadesIt) return;
    window.gsap.utils.toArray(args[0]).forEach((el) => {
      if (!(el instanceof Element)) return;
      if (moves) transforms.add(el);
      if (fadesIt) fades.add(el);
    });
  });
  return { transforms: [...transforms], fades: [...fades] };
}

const readOpacity = (el) => (el.style.opacity ? null : getComputedStyle(el).opacity);

function writeOpacities(fades, opacities) {
  fades.forEach((el, i) => {
    if (opacities[i] !== null) el.style.opacity = opacities[i];
  });
}

/** Read everything first (one layout), then write the inline opacities. */
function prime({ transforms, fades }) {
  const { gsap } = window;
  transforms.forEach((el) => gsap.getProperty(el, 'x'));
  writeOpacities(fades, fades.map(readOpacity));
}

const replayCall = (tl) => ([method, args]) => tl[method](...args);

/** Prime the recorded targets, then replay the calls onto `tl` in order. */
export function replayInto(tl, recorder) {
  prime(targetsOf(recorder.calls));
  recorder.calls.forEach(replayCall(tl));
  return tl;
}

/**
 * The same, in short slices with yields in between (first build on page load),
 * so no slice becomes a long task. The reads stay together before any write,
 * so layout is still computed once. Fills `tl`; resolves when it is complete.
 */
export async function replaySliced(tl, recorder) {
  const { transforms, fades } = targetsOf(recorder.calls);
  const { gsap } = window;
  await forEachSliced(transforms, (el) => gsap.getProperty(el, 'x'));
  const opacities = [];
  await forEachSliced(fades, (el, i) => { opacities[i] = readOpacity(el); });
  writeOpacities(fades, opacities);
  await forEachSliced(recorder.calls, replayCall(tl));
  /* Resolves to nothing on purpose: a GSAP timeline is a thenable, and
     resolving with it would wait for the (paused) timeline to complete. */
}
