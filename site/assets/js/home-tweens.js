/**
 * Home page choreography added to the film's master timeline.
 *
 * `addSceneTweens` is the `build` listener: it runs for every scene on every
 * (re)build and only adds fromTo tweens to `tl` (idempotent, scrubbed,
 * reversible). Positions are shares of the scene's in-phase or hold.
 * Only transform, opacity and clip-path are animated.
 *
 * Round 3 depth: on fine pointers the key pieces arrive in 3D (the video frame
 * swings in, the situations and service tiles flip down like cards, the
 * timeline and the map stand up from a table, the "With Cargado" panel comes
 * forward, the monogram turns to face the visitor). Phones stay 2D, like the
 * engine's own reveals. Every 3D tween targets an element no engine reveal
 * moves, so no two tweens fight over one transform.
 *
 * Never put [data-depth] on an element tweened here: GSAP writes `translate:
 * none` inline on any element whose transform it animates, which cancels the
 * hover lift. The depth layers sit on wrappers (.compare__lift, .map__lift,
 * .story-mark__lift, .situation__arrow) instead.
 */

const EASE_IN = 'power3.out';
const EASE_SOFT = 'power2.inOut';
const HERO_DRIFT_PX = -48; // the hero copy drifts up slightly while the visitor starts scrolling
const STORY_TURN_DEG = 8;
const MAP_CLIP_END = '78%';
const PERSPECTIVE = { near: 900, mid: 1200, far: 1400 };
const DEPTH = Object.freeze({
  frame: { rotationY: -18, rotationX: 6, z: -120 },
  row: { rotationX: -55, z: -60 },
  panel: { rotationY: -14, z: 140 },
  timeline: { rotationX: 38, z: -80 },
  tile: { rotationX: -70 },
  map: { rotationX: 52 },
  mark: { rotationY: -75 },
});
const FLAT = { rotationX: 0, rotationY: 0, z: 0 };
/* The timeline dot (15px plus its 6px halo) grows from its centre; 100% covers the halo. */
const DOT_CLIP = { from: 'circle(0% at 50% 50%)', to: 'circle(100% at 50% 50%)' };

const qs = (root, sel) => root.querySelector(sel);
const qsa = (root, sel) => Array.from(root.querySelectorAll(sel));
const depthOn = () => window.matchMedia('(pointer: fine)').matches;

/** Timeline position at share `f` of the in-phase. */
const inAt = (t, f) => t.inStart + t.inDur * f;
const inLen = (t, f) => t.inDur * f;
/** The hold: from fully in to the start of the out-phase. */
const holdLen = (t) => Math.max(0.001, t.outStart - t.focusTime);

/**
 * A scrubbed 3D entrance: `from` depth (see DEPTH) to flat, around `origin`.
 * Does nothing on coarse pointers, so phones keep the plain 2D reveals.
 */
function depthIn(tl, targets, { from, origin, perspective = PERSPECTIVE.mid, at, dur, stagger = 0 }) {
  if (!depthOn() || !targets || (Array.isArray(targets) && !targets.length)) return;
  const flat = Object.fromEntries(Object.keys(from).map((key) => [key, FLAT[key]]));
  tl.fromTo(targets,
    { ...from, transformOrigin: origin, transformPerspective: perspective },
    { ...flat, duration: dur, stagger, ease: EASE_IN }, at);
}

function hero(tl, el, t) {
  const copy = qs(el, '.hero__copy');
  if (!copy || !t.outDur) return;
  tl.fromTo(copy, { y: 0 }, { y: HERO_DRIFT_PX, duration: t.outStart, ease: 'none' }, 0);
}

function video(tl, el, t) {
  const clip = qs(el, '.vframe__clip');
  const media = qs(el, '.vframe__media');
  depthIn(tl, qs(el, '.vframe'), { from: DEPTH.frame, origin: '0% 50%', perspective: PERSPECTIVE.far, at: inAt(t, 0.2), dur: inLen(t, 0.75) });
  tl.fromTo(clip, { clipPath: 'inset(14% 12% 14% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: inLen(t, 0.7), ease: EASE_SOFT }, inAt(t, 0.25));
  tl.fromTo(media, { scale: 1.18 }, { scale: 1, duration: inLen(t, 0.8), ease: EASE_IN }, inAt(t, 0.25));
  tl.fromTo(qs(el, '.vframe__ui'), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: inLen(t, 0.35), ease: EASE_IN }, inAt(t, 0.7));
}

function situations(tl, el, t) {
  depthIn(tl, qsa(el, '.situation'), {
    from: DEPTH.row, origin: '50% 0%', perspective: PERSPECTIVE.near, at: inAt(t, 0.35), dur: inLen(t, 0.4), stagger: inLen(t, 0.06),
  });
  tl.fromTo(qsa(el, '.situation__go'), { xPercent: -120, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: inLen(t, 0.35), stagger: inLen(t, 0.06), ease: EASE_IN }, inAt(t, 0.55));
}

function compare(tl, el, t) {
  const us = qs(el, '.compare__us');
  depthIn(tl, us, { from: DEPTH.panel, origin: '0% 50%', at: inAt(t, 0.45), dur: inLen(t, 0.5) });
  tl.fromTo(us, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: inLen(t, 0.5), ease: EASE_SOFT }, inAt(t, 0.45));
  tl.fromTo(qsa(us, 'li'), { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: inLen(t, 0.3), stagger: inLen(t, 0.06), ease: EASE_IN }, inAt(t, 0.6));
  tl.fromTo(qsa(el, '.compare__strike'), { scaleX: 0 }, { scaleX: 1, duration: inLen(t, 0.2), stagger: inLen(t, 0.06), ease: 'power1.inOut' }, inAt(t, 0.6));
}

function process(tl, el, t) {
  depthIn(tl, qs(el, '.process'), { from: DEPTH.timeline, origin: '50% 0%', at: inAt(t, 0.25), dur: inLen(t, 0.7) });
  tl.fromTo(qs(el, '.process__line'), { scaleX: 0 }, { scaleX: 1, duration: inLen(t, 0.7), ease: EASE_SOFT }, inAt(t, 0.4));
  // clip-path, not scale: a GSAP transform tween writes `translate: none` inline, which would
  // cancel the dot's hover depth layer (fx.css lifts [data-depth] with the `translate` property).
  tl.fromTo(qsa(el, '.process__dot'), { clipPath: DOT_CLIP.from }, { clipPath: DOT_CLIP.to, duration: inLen(t, 0.2), stagger: inLen(t, 0.18), ease: 'back.out(2)' }, inAt(t, 0.5));
}

function services(tl, el, t) {
  const tiles = qsa(el, '.tiles > li');
  const turn = depthOn() ? { ...DEPTH.tile, transformOrigin: '50% 0%', transformPerspective: PERSPECTIVE.near } : {};
  const flat = depthOn() ? { rotationX: 0 } : {};
  tl.fromTo(tiles, { opacity: 0, y: 24, ...turn },
    { opacity: 1, y: 0, ...flat, duration: inLen(t, 0.35), stagger: inLen(t, 0.035), ease: EASE_IN }, inAt(t, 0.45));
}

function founder(tl, el, t) {
  tl.fromTo(qs(el, '.offer__rule'), { scaleX: 0 }, { scaleX: 1, duration: inLen(t, 0.5), ease: EASE_SOFT }, inAt(t, 0.55));
}

function find(tl, el, t) {
  const svg = qs(el, '.map__svg');
  if (!svg) return;
  const hub = el.dataset.mapHub || '50% 50%';
  depthIn(tl, svg, { from: DEPTH.map, origin: '50% 100%', perspective: PERSPECTIVE.far, at: inAt(t, 0.25), dur: inLen(t, 0.75) });
  tl.fromTo(svg, { clipPath: `circle(0% at ${hub})` }, { clipPath: `circle(${MAP_CLIP_END} at ${hub})`, duration: inLen(t, 0.8), ease: EASE_SOFT }, inAt(t, 0.3));
  tl.fromTo(qsa(el, '.map__pin'), { scale: 0 }, { scale: 1, duration: inLen(t, 0.2), stagger: inLen(t, 0.025), ease: 'back.out(2.4)' }, inAt(t, 0.6));
  tl.fromTo(qsa(el, '.map__ring'), { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: inLen(t, 0.35), stagger: inLen(t, 0.08), ease: EASE_IN }, inAt(t, 0.55));
  tl.fromTo(qsa(el, '.map__label'), { opacity: 0 }, { opacity: 1, duration: inLen(t, 0.2), ease: 'none' }, inAt(t, 0.85));
}

function story(tl, el, t) {
  const mark = qs(el, '.story-mark__svg');
  depthIn(tl, mark, { from: DEPTH.mark, origin: '50% 50%', at: inAt(t, 0.3), dur: inLen(t, 0.7) });
  tl.fromTo(mark, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: inLen(t, 0.6), ease: EASE_SOFT }, inAt(t, 0.3));
  tl.fromTo(qsa(el, '.story-mark__letters span'), { yPercent: 110 }, { yPercent: 0, duration: inLen(t, 0.4), stagger: inLen(t, 0.08), ease: EASE_IN }, inAt(t, 0.5));
  tl.fromTo(mark, { rotate: -STORY_TURN_DEG }, { rotate: 0, duration: inLen(t, 0.8) + holdLen(t), ease: 'none' }, inAt(t, 0.3));
}

const BUILDERS = { hero, video, situations, compare, 'how-it-works': process, founder, services, find, story };

/** Film `build` listener. */
export function addSceneTweens({ tl, sceneEl, timing }) {
  const builder = BUILDERS[sceneEl.id];
  if (builder) builder(tl, sceneEl, timing);
}
