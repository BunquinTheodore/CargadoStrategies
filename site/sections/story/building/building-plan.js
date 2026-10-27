/**
 * The Story building (owner, 2026-10-26: "a business building as the 3d and as
 * we scroll, it goes part by part"): one low-poly three.js building that
 * persists across the Story scenes and re-poses on every cut, assembled first,
 * then lifting apart part by part, each scene's copy calling out one part.
 * Pure data and functions (no DOM, no three), shared by Building.js (the page
 * controller), building-model.js and building-stage.js (the lazy WebGL chunk),
 * and read by tests/story-building.test.mjs.
 *
 * A pose is { x, y, h, o, rx, ry, lift, glow, rows }:
 *   x, y   where the assembled building's centre sits, as fractions of the viewport (0..1, y down)
 *   h      the assembled height, as a fraction of the viewport height
 *   o      canvas opacity (0 = nothing to draw: the stage skips the frame)
 *   rx, ry the turn of the whole building (radians)
 *   lift   part → 0..1, how far that part has lifted along its EXPLODE offset
 *   glow   part → 0..1, the gold call-out on that part
 *   rows   0..1, how much the #values rows' pick adds to the glow (1 only on #values)
 */

/** The parts, bottom to top. */
export const PARTS = Object.freeze(['foundation', 'lobby', 'floor1', 'floor2', 'floor3', 'roof']);

/** Each part's assembled height range (model units, y up from the ground). building-model.js builds to these. */
export const PART_SPANS = Object.freeze({
  foundation: Object.freeze([0, 0.3]),
  lobby: Object.freeze([0.3, 1.4]),
  floor1: Object.freeze([1.4, 2.3]),
  floor2: Object.freeze([2.3, 3.2]),
  floor3: Object.freeze([3.2, 4.1]),
  roof: Object.freeze([4.1, 4.95]),
});

/** The assembled building's height (model units): the top of the roof. */
export const BUILDING_HEIGHT = PART_SPANS.roof[1];

/**
 * Exploded-view offsets (model units, [x, y, z]) at lift 1. The y offsets grow
 * bottom to top, so parts that lift in PARTS order never pass through each other.
 */
export const EXPLODE = Object.freeze({
  foundation: Object.freeze([0, -0.25, 0]),
  lobby: Object.freeze([0, 0, 0]),
  floor1: Object.freeze([0.06, 0.45, 0.04]),
  floor2: Object.freeze([-0.06, 0.9, -0.04]),
  floor3: Object.freeze([0.06, 1.35, 0.04]),
  roof: Object.freeze([0, 2.0, 0]),
});

/** The part each #values row calls out (01 people come in at the lobby, 02 the see-through glass floor, 03 the crown it grows to). */
export const ROW_PARTS = Object.freeze(['lobby', 'floor2', 'roof']);

/** The scenes the building is drawn on (the rest pose it out of frame at o = 0). */
export const BUILDING_SCENES = Object.freeze(['top', 'beginning', 'values']);

/** The scene the flow mode (reduced motion) shows its one still frame in. */
export const STILL_SCENE = 'beginning';

const parts = (values = {}) => Object.freeze(Object.fromEntries(PARTS.map((p) => [p, values[p] || 0])));
const ALL_LIFTED = Object.fromEntries(PARTS.map((p) => [p, 1]));

/**
 * The story, scene by scene (band independent): what has lifted, what glows, the turn.
 *   logo       hidden below the frame (the globe owns this scene), assembled
 *   top        rises in assembled; the foundation glows ("Began So Good People …": what she laid)
 *   beginning  the roof lifts off; the lobby glows ("One Place. Not Five": one front door)
 *   values     every floor lifts away, one after another; the glow follows the row in view
 *   close      reassembles as it rises out of the frame, handing over to the medallion
 *   credits    out of frame, assembled
 */
export const SCENE_PLAN = Object.freeze({
  logo: Object.freeze({ lift: parts(), glow: parts(), rows: 0, rx: 0.1, ry: -1.0 }),
  top: Object.freeze({ lift: parts(), glow: parts({ foundation: 1 }), rows: 0, rx: 0.12, ry: -0.55 }),
  beginning: Object.freeze({ lift: parts({ roof: 1 }), glow: parts({ lobby: 1 }), rows: 0, rx: 0.14, ry: -0.3 }),
  values: Object.freeze({ lift: parts(ALL_LIFTED), glow: parts(), rows: 1, rx: 0.2, ry: 0.45 }),
  close: Object.freeze({ lift: parts(), glow: parts(), rows: 0, rx: 0.12, ry: 1.1 }),
  credits: Object.freeze({ lift: parts(), glow: parts(), rows: 0, rx: 0.12, ry: 1.1 }),
});

/**
 * Where the building sits per layout band (see bandOf), scene by scene.
 *   wide   it stands in the empty half: low in the gap between the copy and the portrait, under
 *          the statement's last line (#top),
 *          the right half beside the story (#beginning), top right beside the title and above
 *          the rows, exploded view included (#values)
 *   stack  phones and portrait tablets, at low emphasis, in the copy's free corners: right of the
 *          by-line (#top), right of "One / Place." in film and in the flow still alike (#beginning),
 *          above the title (#values)
 * Never under a heading or a reading line (checked 360x740 to 1920x1080, 2026-10-26). Under the
 * scenes' layer either way (the canvas takes no input).
 */
export const LAYOUT = Object.freeze({
  wide: Object.freeze({
    logo: Object.freeze({ x: 0.6, y: 1.45, h: 0.44, o: 0 }),
    top: Object.freeze({ x: 0.525, y: 0.82, h: 0.16, o: 0.5 }),
    beginning: Object.freeze({ x: 0.81, y: 0.68, h: 0.46, o: 0.9 }),
    values: Object.freeze({ x: 0.84, y: 0.31, h: 0.24, o: 0.55 }),
    close: Object.freeze({ x: 0.84, y: -0.45, h: 0.36, o: 0 }),
    credits: Object.freeze({ x: 0.84, y: -0.45, h: 0.36, o: 0 }),
  }),
  stack: Object.freeze({
    logo: Object.freeze({ x: 0.78, y: 1.4, h: 0.3, o: 0 }),
    top: Object.freeze({ x: 0.8, y: 0.945, h: 0.09, o: 0.3 }),
    beginning: Object.freeze({ x: 0.8, y: 0.225, h: 0.13, o: 0.3 }),
    values: Object.freeze({ x: 0.8, y: 0.18, h: 0.1, o: 0.3 }),
    close: Object.freeze({ x: 0.8, y: -0.4, h: 0.3, o: 0 }),
    credits: Object.freeze({ x: 0.8, y: -0.4, h: 0.3, o: 0 }),
  }),
});

/** Any scene the plan does not name poses like the close: out of frame, assembled. */
const FALLBACK_SCENE = 'close';

/** The phone and portrait-tablet breakpoints of sections/story/_bands.css. */
const PHONE_MAX = 759;
const TABLET_MAX = 1099;

/** 'stack' where _bands.css stacks the scenes (phones, portrait tablets), else 'wide'. */
export function bandOf({ width = 0, height = 0 } = {}) {
  if (width <= PHONE_MAX) return 'stack';
  if (width <= TABLET_MAX && height > 0 && width / height <= 1) return 'stack';
  return 'wide';
}

/** The full pose of a scene in a band (a fresh object the caller may mutate). */
export function poseFor(sceneId, band = 'wide') {
  const id = SCENE_PLAN[sceneId] ? sceneId : FALLBACK_SCENE;
  const plan = SCENE_PLAN[id];
  const layout = (LAYOUT[band] || LAYOUT.wide)[id];
  return { ...layout, rx: plan.rx, ry: plan.ry, lift: { ...plan.lift }, glow: { ...plan.glow }, rows: plan.rows };
}

export function copyPose(pose) {
  return { ...pose, lift: { ...pose.lift }, glow: { ...pose.glow } };
}

/** True when a pose has anything to draw. */
export const isVisible = (pose) => !!pose && pose.o > 0.001;

const clamp01 = (t) => Math.min(1, Math.max(0, t));
/** Exact at both ends (t = 0 is a, t = 1 is b), so a finished tween lands on its pose. */
const lerp = (a, b, t) => (t <= 0 ? a : t >= 1 ? b : a + (b - a) * t);

/** The cut's ease (cubic in-out), shared by the whole building and each part. */
export function easeInOut(t) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2;
}

/** Of a cut's progress, the share one part's move takes; the rest staggers the start of the parts. */
export const PART_WINDOW = 0.5;

/**
 * The order the moving parts go in, part → rank (0 first). Lifting parts go top
 * down (the roof first) and settling parts bottom up (the lowest first), so in
 * every frame a part is never further along its lift than the part above it,
 * and no two parts pass through each other.
 */
export function partRanks(fromLift, toLift) {
  const ranks = {};
  const up = PARTS.filter((p) => toLift[p] > fromLift[p]).reverse();
  const down = PARTS.filter((p) => toLift[p] < fromLift[p]);
  up.forEach((p, i) => { ranks[p] = i; });
  down.forEach((p, i) => { ranks[p] = i; });
  return { ranks, count: Math.max(up.length, down.length) };
}

/** One part's eased progress at cut progress t, given its rank among `count` moving parts. */
export function partProgress(t, rank, count) {
  if (count <= 1) return easeInOut(t);
  const step = (1 - PART_WINDOW) / (count - 1);
  return easeInOut((t - rank * step) / PART_WINDOW);
}

/**
 * The pose a cut shows at progress t (0..1) from pose `a` to pose `b`: the
 * building moves and turns on one ease, its parts lift or settle one after
 * another (partRanks). t = 0 is `a` and t = 1 is `b`, exactly.
 */
export function lerpPose(a, b, t) {
  const k = easeInOut(t);
  const { ranks, count } = partRanks(a.lift, b.lift);
  const lift = {};
  const glow = {};
  PARTS.forEach((p) => {
    const pk = p in ranks ? partProgress(t, ranks[p], count) : k;
    lift[p] = lerp(a.lift[p], b.lift[p], pk);
    glow[p] = lerp(a.glow[p], b.glow[p], k);
  });
  return {
    x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), h: lerp(a.h, b.h, k), o: lerp(a.o, b.o, k),
    rx: lerp(a.rx, b.rx, k), ry: lerp(a.ry, b.ry, k), rows: lerp(a.rows, b.rows, k), lift, glow,
  };
}

/** A part's y offset (model units) at its lift. */
export const liftOffset = (part, lift) => EXPLODE[part][1] * clamp01(lift);

/** The glow each part shows: the scene's call-out, or the #values row pick (part → 0..1) scaled by `rows`. */
export function glowOf(pose, pick = {}) {
  return Object.fromEntries(PARTS.map((p) => [p, Math.max(pose.glow[p] || 0, (pose.rows || 0) * (pick[p] || 0))]));
}

/** The row pick for one #values row index (0-based), part → 1. Out of range = no pick. */
export function rowPick(index) {
  const part = ROW_PARTS[index];
  return part ? { [part]: 1 } : {};
}

/**
 * Where the building's root goes for a pose, in a perspective view of
 * `aspect` (width / height) with vertical field of view `fovDeg` from a camera
 * `distance` away on +z: { px, py, s } (the model's origin is its assembled centre).
 */
export function placement(pose, { aspect = 1, fovDeg = 24, distance = 20 } = {}) {
  const halfH = distance * Math.tan((fovDeg / 2) * (Math.PI / 180));
  return {
    px: (pose.x - 0.5) * 2 * halfH * aspect,
    py: (0.5 - pose.y) * 2 * halfH,
    s: (pose.h * 2 * halfH) / BUILDING_HEIGHT,
  };
}

/** Highest canvas pixel ratio on any device (the tier may ask for less). */
export const DPR_CAP = 1.5;

/** The renderer's pixel ratio: the device's, never above the tier's or DPR_CAP. */
export function pixelRatio(deviceDpr = 1, tierDpr = DPR_CAP) {
  const device = Number.isFinite(deviceDpr) && deviceDpr > 0 ? deviceDpr : 1;
  return Math.min(device, tierDpr, DPR_CAP);
}

/**
 * How a device shows the building:
 *   'off'    Save-Data or tier C: three never loads
 *   'still'  flow mode (reduced motion): one frame of the #beginning pose, in that scene, no motion
 *   'live'   cut and touch-cut on tiers A and B: posed on every cut, frames drawn only while it moves
 */
export function renderMode({ tier = 'A', saveData = false, flow = false } = {}) {
  if (saveData || tier === 'C') return 'off';
  return flow ? 'still' : 'live';
}

/** Mesh detail by tier: tier B (phones) drops the mullions and the edge lines. */
export function quality(tier = 'A') {
  return tier === 'A' ? 'high' : 'low';
}
