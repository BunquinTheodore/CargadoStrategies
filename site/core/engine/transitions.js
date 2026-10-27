/**
 * Scene transitions (owner, 2026-10-26: "different transitions per website", ported from the
 * Portfolio film): which style a cut uses, and the shape its region has at a given progress.
 * Pure (no DOM, no GSAP), so tests/transitions.test.mjs covers it; iris.js draws the field
 * paint of a field change and cut.js the same-field reveal from what it returns.
 *
 *   iris   a circle from the cut's origin (the full stop, the trigger, data-iris)
 *   dot    collapse to the dot: a dot pops at the centre, then swells to cover the frame
 *   quad   four cells grow from the corners, one after another (forward: TL, TR, BL, BR)
 *   flood  a 45° flood from the bottom-left corner (from the top-right going back)
 *
 * A scene picks how it is entered with data-transition="iris|dot|quad|flood". Going back,
 * the cut uses the style of the scene being left, so one boundary always moves the same way.
 * No attribute: the classic cut (an iris on a field change, the plain hold on the same field).
 *
 * Shapes are polygons in viewport px, filled even-odd (several loops in one polygon, joined by
 * connectors that run along the frame edge and back, so they add no area): one clip-path
 * string serves the iris element and the clipped scene. t is the linear 0-1 progress of the
 * tween; each style eases inside, so a GSAP proxy tween with ease 'none' seeks exactly.
 */

export const TRANSITIONS = Object.freeze(['iris', 'dot', 'quad', 'flood']);
const CIRCLES = new Set(['iris', 'dot']);

export const SHAPE = Object.freeze({
  dotPop: 0.18, // share of the run the dot takes to pop to its size
  dotR: 14, // px: the dot's radius once popped
  quadStagger: 0.1, // share of the run between two cells' starts
  circleSides: 64, // a same-field circle is drawn as this many sides (its complement must be a polygon)
});

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const round = (v) => Math.round(v * 10) / 10;

/** Curves (the GSAP names the cut uses elsewhere), on 0-1. */
export const EASE = Object.freeze({
  expoInOut: (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2;
  },
  power3Out: (t) => 1 - (1 - t) ** 3,
  power3InOut: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  backOut: (t, s = 2) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2,
});

export const isCircle = (name) => CIRCLES.has(name);

/** A data-transition value → a style name, or null (absent, empty or unknown). */
export function parseTransition(value) {
  const name = String(value ?? '').trim().toLowerCase();
  return TRANSITIONS.includes(name) ? name : null;
}

/**
 * The style of one cut. from / to: { transition, globe } (globe: the scene shows the dot-globe,
 * which rides above a field paint clipped to a circle only, so a field change into it keeps a
 * circle). dir: +1 forward, −1 back. null means the classic cut.
 */
export function transitionFor({ from = null, to = null, dir = 1, fieldChange = false } = {}) {
  const name = parseTransition((dir < 0 ? from : to)?.transition);
  if (!name) return null;
  if (fieldChange && to?.globe && !isCircle(name)) return 'iris';
  return name;
}

/** Radius that covers a w × h frame from (x, y): the distance to the farthest corner. */
export function coverRadius(w, h, x = w / 2, y = h / 2) {
  return Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y)));
}

/** The circle of an iris or dot run at t: { x, y, r } in px. */
export function circleAt(name, t, { w, h, origin = null }) {
  const p = clamp01(t);
  const centre = { x: w / 2, y: h / 2 };
  const at = name === 'iris' && origin && Number.isFinite(origin.x) && Number.isFinite(origin.y) ? origin : centre;
  const cover = coverRadius(w, h, at.x, at.y);
  if (name !== 'dot') return { x: at.x, y: at.y, r: EASE.expoInOut(p) * cover };
  if (p < SHAPE.dotPop) return { ...at, r: Math.max(0, SHAPE.dotR * EASE.backOut(p / SHAPE.dotPop)) };
  const grow = EASE.expoInOut((p - SHAPE.dotPop) / (1 - SHAPE.dotPop));
  return { ...at, r: SHAPE.dotR + (cover - SHAPE.dotR) * grow };
}

/** The four cells' scales at t, in corner order TL, TR, BR, BL; going back they start in reverse. */
export function quadScales(t, dir = 1) {
  const starts = dir < 0 ? [3, 2, 0, 1] : [0, 1, 3, 2]; // forward: TL, TR, BL, BR (Portfolio's word burst)
  const span = 1 - 3 * SHAPE.quadStagger;
  return starts.map((k) => EASE.power3Out(clamp01((clamp01(t) - k * SHAPE.quadStagger) / span)));
}

/** Four corner cells, each a quarter of the frame at scale 1 (they tile it without overlap). */
export function quadPolygon(w, h, scales) {
  const [tl, tr, br, bl] = scales.map((s) => [(w / 2) * clamp01(s), (h / 2) * clamp01(s)]);
  return [
    [0, 0], [tl[0], 0], [tl[0], tl[1]], [0, tl[1]], [0, 0],
    [w, 0], [w, tr[1]], [w - tr[0], tr[1]], [w - tr[0], 0], [w, 0],
    [w, h], [w - br[0], h], [w - br[0], h - br[1]], [w, h - br[1]], [w, h],
    [0, h], [0, h - bl[1]], [bl[0], h - bl[1]], [bl[0], h], [0, h],
    [w, h], [w, 0], // back along the frame edge: the connectors cancel out
  ];
}

/** The flooded part of the frame at eased share e: a 45° edge from the start corner. */
export function floodPolygon(w, h, e, dir = 1) {
  const start = dir < 0 ? [w, 0] : [0, h];
  const u = dir < 0 ? [-Math.SQRT1_2, Math.SQRT1_2] : [Math.SQRT1_2, -Math.SQRT1_2];
  const reach = clamp01(e) * (w + h) * Math.SQRT1_2;
  const side = ([x, y]) => (x - start[0]) * u[0] + (y - start[1]) * u[1] - reach; // ≤ 0: flooded
  const rect = [[0, 0], [w, 0], [w, h], [0, h]];
  const out = [];
  rect.forEach((p, i) => {
    const q = rect[(i + 1) % rect.length];
    const a = side(p);
    const b = side(q);
    if (a <= 0) out.push(p);
    if ((a < 0 && b > 0) || (a > 0 && b < 0)) {
      const k = a / (a - b);
      out.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]);
    }
  });
  return out.length ? out : [start];
}

/** A circle as a polygon. */
export function circlePolygon({ x, y, r }, sides = SHAPE.circleSides) {
  return Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2;
    return [x + r * Math.cos(a), y + r * Math.sin(a)];
  });
}

/** The region of any style at linear progress t, as polygon points. geom: { w, h, origin, dir }. */
export function regionAt(name, t, { w, h, origin = null, dir = 1 }) {
  if (name === 'quad') return quadPolygon(w, h, quadScales(t, dir));
  if (name === 'flood') return floodPolygon(w, h, EASE.power3InOut(clamp01(t)), dir);
  return circlePolygon(circleAt(name, t, { w, h, origin }));
}

/** Everything in the frame except `points` (even-odd: the frame, then the shape inside it). */
export function complementOf(w, h, points) {
  return [[0, 0], [w, 0], [w, h], [0, h], [0, 0], ...points, points[0] ?? [0, 0], [0, 0]];
}

/** A clip-path value, shifted by (dx, dy) into an element's own box. */
export function polygonCss(points, dx = 0, dy = 0) {
  const list = points.map(([x, y]) => `${round(x + dx)}px ${round(y + dy)}px`).join(', ');
  return `polygon(evenodd, ${list})`;
}

/** Even-odd point-in-polygon (the seek test's reading of a clip-path polygon). */
export function insidePolygon(points, x, y) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
