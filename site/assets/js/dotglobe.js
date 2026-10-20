/**
 * Dot-globe (Round 5, DIRECTION §9.5, W1, W4, W5, C29): the one travelling
 * character. A 2D canvas, no three.js.
 *
 *   const globe = initDotGlobe({ film, tier });
 *   globe.mode; globe.setMode('map', { tl, at: 'in' }); globe.replayArc(); globe.sleep(); globe.destroy();
 *
 * Each scene picks a mode with data-globe-mode (default hidden) and places the
 * globe with its [data-globe-anchor] box (measured on the film's 'build'):
 * - sphere     the Earth's land as small gold dots (no ocean dots; about
 *              half on tier B), orthographic, point size and alpha by depth
 *              (and by radius on wide screens), a hairline limb, one halo
 *              sprite (tier A). 900 of the land points (520 on tier B) are
 *              the travellers that morph. Optional
 *              data-globe-face="lat,lon". The first scene's arc (or
 *              data-globe-arc="pulse") spans at least a third of the
 *              diameter and fires from a pulsing "you" node twice (900 ms
 *              each, a travelling head), first on the splash ring's hand-off,
 *              then rests; pointer movement over the globe replays it once
 *              (tier A).
 * - map        the globe faces Canada and every traveller morphs to its place
 *              on a flat dot map (per-point lerp plus a camera dolly, 900 ms)
 *              while the rest of the land fades; the map develops into an
 *              even dot grid inside a crisp coastline. From hidden, the
 *              sphere shows whole first; behind an iris the morph starts
 *              150 ms after the iris is 60% open, so it plays in view. At 70%
 *              of the morph one arc draws from the visitor's city
 *              (sessionStorage['cs-city'], else Winnipeg) to the nearest node
 *              at least a quarter of the map's width away, labelled "A
 *              Professional Near You" (300 ms) on an ink halo, and holds.
 *              data-globe-arc="join" (Partners): a new node joins and is
 *              labelled "You". data-globe-label overrides the label text.
 * - ring       the points collapse onto the C ring of the monogram (1.2 s),
 *              the ring inscribed in the anchor box (Story #logo).
 * - medallion  the globe (or map) shrinks into the scene's .medallion over
 *              600 ms from the cut's start and hands over to it: the disc fades up and glints once (--glint). Pages
 *              animate the words, not the .medallion element.
 * - hidden     shrinks and fades with the out group, then nothing is drawn.
 *
 * Every mode change is appended to the cut's timeline (film.on('cut')), so the
 * seek test and immediate landings see it. Rendering is on demand: one
 * gsap.ticker callback while something changes, removed when nothing moves,
 * and asleep 5 s after the last input or landing (the tier A idle rotation
 * stops too). Paused while the tab is hidden. Tier C, reduced motion and flow
 * mode get the SVG posters inside the anchors instead (the map posters with
 * their label as text beside the node; ring has none, the page's mark is its
 * end state); onTierChange follows. A splash hand-off on a first scene with no
 * globe draws nothing.
 * Arriving behind an iris, the canvas rides above it, clipped to its circle,
 * so the globe never draws on the outgoing field. The drawing itself is in
 * dotglobe-draw.js. Never imported on legal.
 */
import { getTier, tierConfig, onTierChange } from './tier.js';
import { DUR, EASE } from './motion-tokens.js';
import { anchorBox, circleOfBox, splashState } from './splash.js';
import { MAP_W, MAP_H, NODES, PROJ, POSTER_NEAR } from '../data/dotglobe-points.js';
import { createRenderer, rotator, toRad } from './dotglobe-draw.js';

const CITIES_MODULE = '../data/cities.js';
const CITY_KEY = 'cs-city';
const DEFAULT_CITY = 'Winnipeg';
const MODES = ['sphere', 'map', 'ring', 'medallion', 'hidden'];
const POSTERS = { sphere: 'assets/img/globe-poster.svg', map: 'assets/img/canada-poster.svg', join: 'assets/img/canada-join-poster.svg' };
const FACE_CANADA = Object.freeze({ lat: 58, lon: -94 }); // the morph faces this (keep in sync with tools/gen-dotglobe.mjs)
const HERO_FACE = Object.freeze({ lat: 44, lon: -92 }); // default sphere view (keep in sync with tools/gen-dotglobe.mjs)
const MIN_ANCHOR_PX = 24;
const POSTER_LABEL_LEFT_U = 0.55; // a poster label beside a node right of this (map uv) ends at the node, so it stays on the map

/* Motion (s unless named …MS). */
const ROT_K = 0.07; // rotation lerp per 60 fps frame
const ROT_EPS = 0.01; // degrees: close enough to stop
const SPIN_DEG_PER_S = 6; // 1 rev / 60 s, tier A, ≤ 5 s after the last input
const TILT_DEG = 7; // pointer tilt over the globe, tier A
const GLIDE_S = 0.85;
const APPEAR_S = 0.5;
const APPEAR_MAP_S = 0.2; // W4: the sphere shows at once, facing North America, before it morphs
const MAP_HOLD_S = 0.15; // …for this long after the iris has mostly opened (V2: the morph plays on ink, in view)
const IRIS_MID = 0.5; // share of the iris: the colour change midpoint (the field event)
const IRIS_OPEN = 0.6; // share of the iris after which the map morph may start
const MORPH_S = 0.9;
const MAP_ARC_AT = 0.7; // the map arc starts at this share of the morph, so W4 lands in ≈ 1.5 s
const MAP_ARC_S = 0.3;
const ARC_S = 0.6;
const PULSE_ARC_S = 0.9; // the hero arc draws over this, with a travelling head
const RING_S = 1.2;
const MEDAL_S = 0.6;
const GLINT_S = 0.6;
const LABEL_S = 0.3;
const PULSE_HOLD_S = 0.25;
const PULSE_FADE_S = 0.35;
const PULSE_TIMES = 2;
const SHRINK_EASE = 'power2.inOut'; // W5: the map or globe visibly travels into the medallion from the cut's start
const SHRINK_R_EASE = 'power3.out'; // …and is small early, so it never sits large behind the incoming words
const OUT_FADE_S = 0.28; // §4.4 rule 3: a leaving globe is gone before the in group starts (0.30 s)
const GLIDE_DIP = 0.2; // alpha while the globe glides between scenes, past the outgoing and incoming text
const GLIDE_DIP_S = 0.2;
const GLIDE_DIP_MIN = 0.5; // dip only when the centre moves more than this share of the radius
const LIMB_S = 0.6;
const IDLE_MS = DUR.idleStopMs;
const QUIET_FRAMES = 2;

/* Drawing and geometry (the renderer's own constants are in dotglobe-draw.js). */
const MAP_ARC_MIN_SHARE = 0.26; // the map arc's chord spans at least this share of the map width (≈ 200 px on desktop; keep in sync with tools/gen-dotglobe.mjs)
const HERO_ARC_MIN_SHARE = 0.34; // the hero arc's screen chord spans at least this share of the diameter
const HERO_ARC_FRONT_Z = 0.25; // both ends well on the visible face
const LABEL_NEAR = 'A Professional Near You';
const LABEL_JOIN = 'You';

const normal = (s) => String(s || '').split(',')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/* ---------- geography ---------- */

const xyzOf = (lat, lon) => [Math.cos(toRad(lat)) * Math.sin(toRad(lon)), Math.sin(toRad(lat)), Math.cos(toRad(lat)) * Math.cos(toRad(lon))];

function uvOf(lat, lon) {
  const rho = PROJ.F / Math.tan(Math.PI / 4 + toRad(lat) / 2) ** PROJ.n;
  const theta = PROJ.n * toRad(lon - PROJ.lon0);
  const x = rho * Math.sin(theta);
  const y = PROJ.rho0 - rho * Math.cos(theta);
  return [((x - PROJ.minx) * PROJ.k + PROJ.pad) / MAP_W, ((PROJ.maxy - y) * PROJ.k + PROJ.pad) / MAP_H];
}

const placeOf = (name, lat, lon) => ({ name, lat, lon, xyz: xyzOf(lat, lon), uv: uvOf(lat, lon) });
const NODE_PLACES = NODES.map((n) => ({ name: n.name, lat: n.lat, lon: n.lon, xyz: xyzOf(n.lat, n.lon), uv: [n.u, n.v] }));

function km(a, b) {
  const h = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The map arc's far end: the nearest node whose chord on the map spans at least MAP_ARC_MIN_SHARE of its width. */
function mapArcTarget(from) {
  const chord = (n) => Math.hypot((n.uv[0] - from.uv[0]) * MAP_W, (n.uv[1] - from.uv[1]) * MAP_H);
  return NODE_PLACES.filter((n) => chord(n) >= MAP_ARC_MIN_SHARE * MAP_W).sort((a, b) => km(from, a) - km(from, b))[0] || NODE_PLACES[0];
}

/* ---------- scene placement (measured on 'build', never inside a cut) ---------- */

function sceneMode(sceneEl) {
  const mode = sceneEl?.dataset.globeMode;
  return MODES.includes(mode) ? mode : 'hidden';
}

function parseFace(value) {
  const [lat, lon] = String(value || '').split(',').map(Number);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

function measure(sceneEl, index) {
  const mode = sceneMode(sceneEl);
  const anchor = sceneEl.querySelector('[data-globe-anchor]');
  const box = anchor ? anchorBox(anchor, sceneEl) : null;
  const medallion = sceneEl.querySelector('.medallion');
  const medBox = medallion ? anchorBox(medallion, sceneEl) : null;
  const usable = (b) => b && b.w >= MIN_ANCHOR_PX && b.h >= MIN_ANCHOR_PX;
  const target = mode === 'medallion' ? medBox : box;
  const shown = mode !== 'hidden' && usable(target);
  const d = sceneEl.dataset;
  const defaultArc = { sphere: index === 0 ? 'pulse' : 'none', map: 'near' }[mode] || 'none';
  return {
    mode: shown ? mode : 'hidden',
    circle: shown ? (mode === 'medallion' ? { x: medBox.x + medBox.w / 2, y: medBox.y + medBox.h / 2, r: Math.min(medBox.w, medBox.h) / 2 } : circleOfBox(box)) : null,
    box: shown && mode === 'map' ? fitMap(box) : null,
    arc: d.globeArc || defaultArc,
    label: d.globeLabel || (d.globeArc === 'join' ? LABEL_JOIN : LABEL_NEAR),
    face: parseFace(d.globeFace) || (mode === 'map' ? FACE_CANADA : HERO_FACE),
    medallion: mode === 'medallion' ? medallion : null,
  };
}

/** The map's MAP_W × MAP_H frame, contain-fitted and centred in the anchor box. */
function fitMap(box) {
  const k = Math.min(box.w / MAP_W, box.h / MAP_H);
  const w = MAP_W * k;
  const h = MAP_H * k;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

/* ---------- posters (tier C, reduced motion, flow mode) ---------- */

/**
 * A map poster sits in a frame of the map's own aspect, so its label can be
 * placed beside its node in real text: the poster arc's target (POSTER_NEAR),
 * or the visitor default for "join".
 */
function posterFrame(img, sceneEl, join) {
  const node = NODE_PLACES.find((n) => n.name === (join ? DEFAULT_CITY : POSTER_NEAR)) || NODE_PLACES[0];
  const frame = document.createElement('div');
  frame.className = 'globe-poster-frame';
  frame.style.setProperty('--u', node.uv[0].toFixed(4));
  frame.style.setProperty('--v', node.uv[1].toFixed(4));
  const label = document.createElement('span');
  label.className = node.uv[0] > POSTER_LABEL_LEFT_U ? 'globe-poster__label is-left' : 'globe-poster__label';
  label.textContent = sceneEl.dataset.globeLabel || (join ? LABEL_JOIN : LABEL_NEAR);
  frame.append(img, label);
  return frame;
}

function showPosters(film) {
  film.scenes.forEach((sceneEl) => {
    const mode = sceneMode(sceneEl);
    const join = mode === 'map' && sceneEl.dataset.globeArc === 'join';
    const src = POSTERS[join ? 'join' : mode];
    const anchor = sceneEl.querySelector('[data-globe-anchor]');
    if (!src || !anchor || anchor.querySelector('.globe-poster')) return;
    const img = document.createElement('img');
    img.className = 'globe-poster';
    img.src = src;
    img.alt = '';
    img.decoding = 'async';
    img.setAttribute('aria-hidden', 'true');
    if (mode !== 'map') {
      anchor.appendChild(img);
      return;
    }
    anchor.classList.add('has-poster-frame');
    anchor.appendChild(posterFrame(img, sceneEl, join));
  });
}

/* ---------- entry ---------- */

function ensureCanvas() {
  let canvas = document.getElementById('globe');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'globe';
    canvas.setAttribute('aria-hidden', 'true');
    (document.querySelector('.stage') || document.body).appendChild(canvas);
  }
  return canvas;
}

const usePosters = (film, tier) => film.mode === 'flow' || tier === 'C' || !window.gsap
  || document.documentElement.classList.contains('rm');

const POSTER_API = (film) => ({
  get mode() { return sceneMode(film.currentScene || film.scenes[film.current]); },
  setMode() {}, replayArc() {}, sleep() {}, destroy() {},
});

export function initDotGlobe({ film, tier = getTier() } = {}) {
  const canvas = ensureCanvas();
  if (usePosters(film, tier)) {
    canvas.hidden = true;
    showPosters(film);
    return POSTER_API(film);
  }
  return createGlobe({ film, tier, canvas });
}

function createGlobe({ film, tier, canvas }) {
  const gsap = window.gsap;
  const cfg = tierConfig(tier);
  const html = document.documentElement;
  const renderer = createRenderer(canvas, cfg, NODE_PLACES);
  const S = { cx: 0, cy: 0, r: 0, alpha: 0, morph: 0, ring: 0, medal: 0, arc: 0, arcAlpha: 0, label: 0, pulse: 0, join: 0, limb: 0, mx: 0, my: 0, mw: 0, mh: 0, gw: 0 };
  const rot = { ...HERO_FACE };
  const rotTarget = { ...HERO_FACE };
  const tilt = { lat: 0, lon: 0 };
  const extras = { arc: { from: null, to: null, label: '' }, join: { place: null, label: LABEL_JOIN } };
  const places = [];
  const offs = [];
  let mode = 'hidden';
  let field = html.dataset.hdrField || html.dataset.field || 'ink';
  let visitor = NODE_PLACES.find((n) => n.name === DEFAULT_CITY);
  let ticking = false;
  let dirty = false;
  let quiet = 0;
  let last = 0;
  let lastInput = performance.now();
  let pulseTl = null;
  let pulseRested = false;
  let inside = false;
  let destroyed = false;
  let overIris = false;
  let awaitingSplash = false;

  /* ----- the loop ----- */

  function frame() {
    const now = performance.now();
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    let moving = false;
    const k = 1 - (1 - ROT_K) ** (dt * 60);
    ['lat', 'lon'].forEach((key) => {
      const goal = rotTarget[key] + tilt[key];
      const d = goal - rot[key];
      if (Math.abs(d) > ROT_EPS) { rot[key] += d * k; moving = true; } else rot[key] = goal;
    });
    if (spinning(now)) {
      rotTarget.lon -= SPIN_DEG_PER_S * dt; // the view and its goal turn together: no lag left when the spin stops
      rot.lon -= SPIN_DEG_PER_S * dt;
      moving = true;
    }
    if (moving || dirty || overIris) renderer.draw(S, rot, extras, field, irisClip());
    quiet = moving || dirty || overIris ? 0 : quiet + 1;
    dirty = false;
    if (quiet >= QUIET_FRAMES) stopTicker(); // a frame or two of grace keeps tween-driven redraws from re-adding the callback every frame
  }

  const spinning = (now) => cfg.idleSpin && mode === 'sphere' && S.alpha > 0.01 && now - lastInput < IDLE_MS;

  function startTicker() {
    if (ticking || destroyed || document.hidden) return;
    ticking = true;
    quiet = 0;
    last = 0;
    gsap.ticker.add(frame);
  }

  function stopTicker() {
    if (!ticking) return;
    ticking = false;
    gsap.ticker.remove(frame);
  }

  function invalidate() {
    dirty = true;
    startTicker();
  }

  /* ----- the iris: while it opens into a globe scene, the canvas sits above it, clipped to its circle ----- */

  function irisClip() {
    if (!overIris) return null;
    const el = document.querySelector('.iris');
    if (!el || el.dataset.state !== 'circle') return null;
    const px = (name) => parseFloat(el.style.getPropertyValue(name)) || 0;
    return { x: px('--iris-x'), y: px('--iris-y'), r: px('--iris-r') * (Number(gsap.getProperty(el, 'scale')) || 0) };
  }

  function setOverIris(on) {
    overIris = on;
    canvas.classList.toggle('is-over-iris', on);
    invalidate();
  }

  /* ----- placement ----- */

  /** The canvas's own CSS box: the viewport in every mode (in touch-cut the stage is as tall as the page). */
  function resize() {
    renderer.resize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);
  }

  function placeAt(index) {
    if (!places[index] && film.scenes[index]) places[index] = measure(film.scenes[index], index);
    return places[index] || { mode: 'hidden', circle: null, box: null, arc: 'none', face: HERO_FACE };
  }

  /**
   * Jump straight to a scene's end state (rebuilds, landings that had no cut).
   * `start`: the state before the scene's own cut instead (first paint): a map,
   * ring or medallion scene shows the sphere, so the load cut can play its morph.
   */
  function snapTo(index, { start = false } = {}) {
    const p = placeAt(index);
    const end = !start;
    mode = start && p.mode !== 'hidden' && p.mode !== 'medallion' ? 'sphere' : p.mode;
    if (p.circle) Object.assign(S, { cx: p.circle.x, cy: p.circle.y, r: p.mode === 'medallion' ? p.circle.r * 0.9 : p.circle.r });
    if (p.box) Object.assign(S, { mx: p.box.x, my: p.box.y, mw: p.box.w, mh: p.box.h, gw: p.box.w });
    Object.assign(S, { alpha: p.mode === 'hidden' || p.mode === 'medallion' ? 0 : 1, morph: end && p.mode === 'map' ? 1 : 0,
      ring: end && p.mode === 'ring' ? 1 : 0, medal: end && p.mode === 'medallion' ? 1 : 0, pulse: 0, limb: 0 });
    const shown = end && p.mode === 'map';
    setArcEnds(p);
    Object.assign(S, { arc: shown && p.arc === 'near' ? 1 : 0, arcAlpha: shown && p.arc === 'near' ? 1 : 0,
      label: shown ? 1 : 0, join: shown && p.arc === 'join' ? 1 : 0 });
    Object.assign(rotTarget, p.face);
    Object.assign(rot, p.face);
    invalidate();
  }

  /* ----- arcs ----- */

  /** Endpoints only: the visitor's city to the nearest node (map), a far one (hero pulse), or the joining node. */
  function setArcEnds(p) {
    extras.arc = { from: null, to: null, label: '' };
    extras.join = { place: null, label: p.label };
    if (p.arc === 'near') extras.arc = { from: visitor, to: mapArcTarget(visitor), label: p.label };
    else if (p.arc === 'pulse') extras.arc = { ...heroArcEnds(p.face), label: '' };
    else if (p.arc === 'join') extras.join = { place: visitor, label: p.label };
  }

  /**
   * The hero arc must read at a glance: its screen chord spans at least
   * HERO_ARC_MIN_SHARE of the diameter, both ends on the visible face. The
   * visitor's city to the nearest node that far, else the widest visible pair
   * of nodes, west to east.
   */
  function heroArcEnds(face) {
    const rotate = rotator(face);
    const seen = (place) => { const [X, Y, Z] = rotate(...place.xyz); return { place, X, Y, Z }; };
    const span = (a, b) => Math.hypot(a.X - b.X, a.Y - b.Y) / 2;
    const front = NODE_PLACES.map(seen).filter((q) => q.Z >= HERO_ARC_FRONT_Z);
    const you = seen(visitor);
    if (you.Z >= HERO_ARC_FRONT_Z) {
      const far = front.filter((q) => span(you, q) >= HERO_ARC_MIN_SHARE).sort((a, b) => span(you, a) - span(you, b))[0];
      if (far) return { from: visitor, to: far.place };
    }
    let best = null;
    front.forEach((a) => front.forEach((b) => { if (a.X < b.X && (!best || span(a, b) > best.s)) best = { s: span(a, b), a, b }; }));
    return best ? { from: best.a.place, to: best.b.place } : { from: visitor, to: mapArcTarget(visitor) };
  }

  function stopPulse() {
    pulseTl?.kill();
    pulseTl = null;
  }

  /** The hero arc: draws from the pulsing "you" node with a travelling head, holds, fades and draws again (PULSE_TIMES in all), then rests drawn. */
  function playPulse(times = PULSE_TIMES) {
    const p = placeAt(film.current);
    if (mode !== 'sphere' || p.arc !== 'pulse' || pulseTl) return;
    setArcEnds(p);
    pulseTl = gsap.timeline({ onUpdate: invalidate, onComplete: () => { pulseTl = null; pulseRested = true; } });
    for (let i = 0; i < times; i += 1) {
      if (i > 0) pulseTl.to(S, { arcAlpha: 0, duration: PULSE_FADE_S, ease: 'power1.in' }, `+=${PULSE_HOLD_S}`);
      pulseTl.fromTo(S, { arc: 0, arcAlpha: 1, pulse: 0 }, { arc: 1, pulse: 1, duration: PULSE_ARC_S, ease: 'power1.inOut' });
    }
  }

  /** W1: the first play fires on the splash ring's hand-off (or when the splash is skipped or gone). */
  function releasePulse() {
    if (!awaitingSplash) return;
    awaitingSplash = false;
    playPulse();
  }

  const splashPending = () => {
    const s = splashState();
    return (s.phase === 'running' || s.phase === 'skipping') && !s.aperture;
  };

  /* ----- modes on a timeline ----- */

  /** A position on `tl`: the label plus an offset when the label exists, else the offset alone. */
  const pos = (tl, label, offset = 0) => (tl.labels && label in tl.labels ? `${label}+=${offset}` : offset);

  function tween(tl, to, duration, ease, at) {
    const from = Object.fromEntries(Object.keys(to).map((key) => [key, S[key]]));
    tl.fromTo(S, from, { ...to, duration, ease, onUpdate: invalidate, immediateRender: false }, at);
  }

  /**
   * cut: { iris, toField }; iris: an iris opens the next field on this cut.
   * Arriving from hidden behind an iris, the globe draws above the iris,
   * clipped to its circle, from the colour change midpoint, so it never
   * shows on the outgoing field.
   */
  function applyMode(p, tl, cut = {}) {
    const prev = mode;
    const wasShown = S.alpha > 0.01 && prev !== 'hidden';
    mode = p.mode;
    stopPulse();
    if (S.arcAlpha > 0 || S.label > 0 || S.join > 0) tween(tl, { arcAlpha: 0, label: 0, join: 0, pulse: 0 }, OUT_FADE_S * 0.6, EASE.stepOut, pos(tl, 'out'));
    if (p.mode === 'hidden') {
      if (S.alpha > 0.01) tween(tl, { alpha: 0, r: S.r * 0.9 }, OUT_FADE_S, EASE.stepOut, pos(tl, 'out'));
      return;
    }
    Object.assign(rotTarget, p.face);
    const c = p.circle;
    const r = p.mode === 'medallion' ? c.r * 0.9 : c.r;
    const iris = !wasShown && cut.iris;
    const start = iris ? { label: 'iris', at: DUR.iris * IRIS_MID } : { label: 'in', at: 0 };
    if (iris) {
      tl.call(() => { field = cut.toField || field; setOverIris(true); }, null, pos(tl, 'iris'));
      tl.call(() => setOverIris(false), null, pos(tl, 'iris', DUR.iris));
    }
    if (!wasShown) {
      /* Arrive in place: a sphere fades up at the target (a medallion close starts a little larger). */
      const startR = p.mode === 'medallion' ? c.r * 1.8 : c.r * 0.92;
      const appear = p.mode === 'map' ? APPEAR_MAP_S : APPEAR_S;
      Object.assign(S, { cx: c.x, cy: c.y, r: startR, morph: 0, ring: 0, medal: 0, alpha: 0 });
      Object.assign(rot, p.face);
      tween(tl, { alpha: 1 }, appear, EASE.stepIn, pos(tl, start.label, start.at));
      if (p.mode !== 'medallion') tween(tl, { r }, appear, EASE.stepIn, pos(tl, start.label, start.at));
    } else if (p.mode === 'medallion') {
      tween(tl, { cx: c.x, cy: c.y, alpha: 1 }, MEDAL_S, SHRINK_EASE, pos(tl, 'out'));
      tween(tl, { r }, MEDAL_S, SHRINK_R_EASE, pos(tl, 'out'));
    } else {
      /* §4.4 rule 3: the glide starts with the out group, and dips while it crosses the words. */
      tween(tl, { cx: c.x, cy: c.y, r }, GLIDE_S, EASE.morph, pos(tl, 'out'));
      if (Math.hypot(c.x - S.cx, c.y - S.cy) > S.r * GLIDE_DIP_MIN) {
        tl.fromTo(S, { alpha: S.alpha }, { alpha: GLIDE_DIP, duration: GLIDE_DIP_S, ease: EASE.stepOut, onUpdate: invalidate, immediateRender: false }, pos(tl, 'out'));
        tl.fromTo(S, { alpha: GLIDE_DIP }, { alpha: 1, duration: GLIDE_S - GLIDE_DIP_S, ease: 'power2.in', onUpdate: invalidate, immediateRender: false }, pos(tl, 'out', GLIDE_DIP_S));
      } else tween(tl, { alpha: 1 }, GLIDE_S, EASE.morph, pos(tl, 'out'));
    }
    const medalLabel = wasShown ? 'out' : 'in';
    /* W4: from hidden, the sphere shows whole first; behind an iris the morph waits until the iris is mostly open. */
    const morphAt = (iris ? DUR.iris * IRIS_OPEN : start.at) + MAP_HOLD_S;
    if (p.mode === 'map') mapMode(p, tl, wasShown ? { label: 'in', at: 0 } : { label: start.label, at: morphAt });
    else if (p.mode === 'medallion') tween(tl, { morph: 0 }, MEDAL_S, SHRINK_EASE, pos(tl, medalLabel));
    else tween(tl, { morph: 0 }, MORPH_S, EASE.morph, pos(tl, 'in'));
    tween(tl, { ring: p.mode === 'ring' ? 1 : 0 }, RING_S, EASE.morph, pos(tl, 'in'));
    if (p.mode === 'medallion') medallionMode(p, tl, medalLabel);
    else if (S.medal > 0) tween(tl, { medal: 0 }, MEDAL_S, EASE.morph, pos(tl, 'in'));
  }

  /** morph: { label, at }, where the morph starts; the arc starts at MAP_ARC_AT of it. */
  function mapMode(p, tl, morph) {
    const b = p.box;
    const at = (offset) => pos(tl, morph.label, morph.at + offset);
    const arcAt = MORPH_S * MAP_ARC_AT;
    S.gw = b.w; // the grid follows the target width, built on 'build', not every step of the glide
    if (S.morph < 0.01) Object.assign(S, { mx: b.x, my: b.y, mw: b.w, mh: b.h });
    else tween(tl, { mx: b.x, my: b.y, mw: b.w, mh: b.h }, GLIDE_S, EASE.morph, pos(tl, 'out'));
    tween(tl, { morph: 1 }, MORPH_S, EASE.morph, at(0));
    tl.call(() => setArcEnds(p), null, at(arcAt));
    if (p.arc === 'near') {
      tl.fromTo(S, { arc: 0, arcAlpha: 1, pulse: 0 }, { arc: 1, pulse: 1, duration: MAP_ARC_S, ease: 'power2.inOut', onUpdate: invalidate, immediateRender: false }, at(arcAt));
      tl.fromTo(S, { label: 0 }, { label: 1, duration: LABEL_S, ease: 'power1.out', onUpdate: invalidate, immediateRender: false }, at(arcAt + MAP_ARC_S * 0.5));
    } else if (p.arc === 'join') {
      tl.fromTo(S, { join: 0, pulse: 0 }, { join: 1, pulse: 1, duration: ARC_S, ease: 'back.out(2)', onUpdate: invalidate, immediateRender: false }, at(arcAt));
      tl.fromTo(S, { label: 0 }, { label: 1, duration: LABEL_S, ease: 'power1.out', onUpdate: invalidate, immediateRender: false }, at(arcAt + ARC_S * 0.5));
    }
  }

  /** The globe (or map) shrinks into the disc over MEDAL_S from `label`; the disc fades up at 70% and glints. */
  function medallionMode(p, tl, label) {
    tween(tl, { medal: 1 }, MEDAL_S, SHRINK_EASE, pos(tl, label));
    const el = p.medallion;
    if (!el) return;
    tl.fromTo(el, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out', immediateRender: false }, pos(tl, label, MEDAL_S * 0.7));
    tl.fromTo(el, { '--glint': '-120%' }, { '--glint': '120%', duration: GLINT_S, ease: 'power2.inOut', immediateRender: false }, pos(tl, label, MEDAL_S));
  }

  /* ----- film events ----- */

  let cutTo = -1;
  let landedOnce = false;

  function onBuild({ sceneEl, index }) {
    if (index === 0) resize();
    places[index] = measure(sceneEl, index);
    if (places[index].box) renderer.prepare(places[index].box.w);
    if (index === film.current && !film.isCutting) snapTo(index, { start: !landedOnce }); // before the load cut: its start state
  }

  function onCut({ to, tl, from, fieldChange, toField }) {
    cutTo = to;
    lastInput = performance.now();
    const fields = document.querySelector('.fields');
    const iris = Boolean(fieldChange && from >= 0 && fields && fields.dataset.field !== toField);
    applyMode(placeAt(to), tl, { iris, toField });
  }

  function onLanded({ index }) {
    landedOnce = true;
    lastInput = performance.now();
    if (overIris) setOverIris(false);
    if (cutTo !== index) snapTo(index);
    cutTo = -1;
    pulseRested = false;
    awaitingSplash = splashPending();
    if (!awaitingSplash) playPulse();
    invalidate();
  }

  /* ----- input: the 5 s rule, the tier A tilt and the hero arc replay ----- */

  function poke() {
    lastInput = performance.now();
    if (spinning(lastInput)) startTicker();
  }

  function onPointer(e) {
    poke();
    if (!cfg.idleSpin || mode !== 'sphere' || S.alpha < 0.01) return;
    const dx = (e.clientX - S.cx) / S.r;
    const dy = (e.clientY - S.cy) / S.r;
    const now = dx * dx + dy * dy < 1;
    tilt.lon = now ? dx * TILT_DEG : 0;
    tilt.lat = now ? -dy * TILT_DEG : 0;
    if (now && !inside && pulseRested) {
      pulseRested = false;
      playPulse(1);
    }
    inside = now;
    startTicker();
  }

  /** The splash ring lands on the globe's horizon: draw the limb on this very frame, then fire the hero arc. */
  function onAperture({ x, y, r }) {
    /* A first scene without a globe (Story #top, Services #intro): the ring's centre circle is not ours to fill. */
    if (mode === 'hidden' || mode === 'medallion' || placeAt(film.current).mode === 'hidden') {
      releasePulse();
      return;
    }
    if (S.r < 0.5) Object.assign(S, { cx: x, cy: y, r, alpha: 1 });
    gsap.fromTo(S, { limb: 1 }, { limb: 0, duration: LIMB_S, ease: 'power2.out', onUpdate: invalidate });
    renderer.draw(S, rot, extras, field, null);
    releasePulse();
  }

  async function resolveCity(name) {
    const key = normal(name);
    if (!key) return;
    const node = NODE_PLACES.find((n) => normal(n.name) === key);
    if (node) { visitor = node; return; }
    try {
      const { CITIES } = await import(CITIES_MODULE);
      const city = CITIES.find((c) => normal(c.name) === key || c.alt.includes(key));
      if (city) visitor = placeOf(city.name, city.lat, city.lon);
    } catch (error) {
      console.error('dotglobe: could not load cities.js', error);
    }
  }

  function readCity() {
    try { return sessionStorage.getItem(CITY_KEY); } catch { return null; }
  }

  const listen = (target, name, fn, opts) => {
    target.addEventListener(name, fn, opts);
    offs.push(() => target.removeEventListener(name, fn, opts));
  };
  const onFilm = (name, fn) => {
    const off = film.on(name, fn);
    offs.push(typeof off === 'function' ? off : () => film.off?.(name, fn));
  };

  function toPosters() {
    api.destroy();
    canvas.hidden = true;
    showPosters(film);
  }

  const api = {
    get mode() { return mode; },
    setMode(next, { tl, at = 'in' } = {}) {
      if (!MODES.includes(next)) return;
      const p = { ...placeAt(film.current), mode: next };
      if (next !== 'hidden' && !p.circle) return;
      if (next === 'map' && !p.box) return;
      const sub = gsap.timeline({ paused: !!tl }); // no engine labels inside: every step starts at the sub-timeline's 0
      applyMode(p, sub);
      if (tl) tl.add(sub.paused(false), at);
    },
    replayArc() {
      pulseRested = false;
      stopPulse();
      playPulse(1);
    },
    sleep() {
      stopPulse();
      lastInput = 0;
      stopTicker();
    },
    destroy() {
      destroyed = true;
      stopPulse();
      stopTicker();
      canvas.classList.remove('is-over-iris');
      offs.splice(0).forEach((off) => off());
      renderer.clear();
    },
  };

  resize();
  snapTo(film.current || 0, { start: true });
  onFilm('build', onBuild);
  onFilm('cut', onCut);
  onFilm('landed', onLanded);
  onFilm('field', ({ field: next }) => { field = next; invalidate(); });
  listen(window, 'resize', () => { resize(); invalidate(); });
  listen(window, 'pointermove', onPointer, { passive: true });
  ['wheel', 'keydown', 'pointerdown', 'touchstart'].forEach((name) => listen(window, name, poke, { passive: true }));
  listen(document, 'visibilitychange', () => { if (document.hidden) stopTicker(); else invalidate(); });
  listen(document, 'cs:splash-aperture', (e) => onAperture(e.detail));
  listen(document, 'cs:splash-done', releasePulse);
  listen(document, 'cs:wa-opened', (e) => resolveCity(e.detail?.city));
  const aperture = splashState().aperture;
  if (aperture) onAperture(aperture);
  resolveCity(readCity());
  offs.push(onTierChange(({ tier: next }) => { if (next === 'C') toPosters(); }) || (() => {}));
  return api;
}
