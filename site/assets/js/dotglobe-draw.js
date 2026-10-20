/**
 * Dot-globe renderer (Round 5, DIRECTION §9.5): the 2D canvas drawing behind
 * dotglobe.js. Pure drawing, no timing: dotglobe.js owns the state S and the
 * timelines, and calls draw() when something changed.
 *
 *   const r = createRenderer(canvas, tierConfig(tier), nodePlaces);
 *   r.resize(w, h); r.prepare(mapWidth); r.draw(S, rot, extras, field, clip); r.clear();
 *
 * The sphere is the Earth's land as small dots (no ocean dots), sized and lit
 * by depth, with a hairline limb and one halo sprite (tier A). The travellers
 * (land points facing Canada) morph onto the map; the other land points fade
 * as they go, and the map develops into an even dot grid inside a crisp
 * coastline, which the travellers land on. Points are batched by alpha (one
 * path per bucket). The arc ends get a soft glow and a travelling head while
 * the arc draws; the label sits on an ink plate. In ring mode a solid C
 * stroke with a soft halo develops under the points, so the ring carries the
 * same weight as the page's W. While the globe is in transition (morph, ring,
 * medallion, fading) every other land point is skipped, and the map grid is
 * built ahead of the cut (prepare), never inside one.
 */
import { SPHERE, MAP, POINT_COUNT, TIER_B_COUNT, LAND, LAND_B_COUNT, COAST, MAP_W, MAP_H } from '../data/dotglobe-points.js';

export const toRad = (d) => (d * Math.PI) / 180;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = (t) => Math.max(0, Math.min(1, t));
export const smooth = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };

const DOLLY = 0.45; // the sphere grows this much as it becomes the map
const ARC_LIFT = 0.12; // great-circle arc lift, share of R (≤ 0.12)
const MAP_ARC_BOW = 0.32; // map arc bow, share of the chord (keep in sync with tools/gen-dotglobe.mjs)
const RING_SHARE = 19 / 24; // the C ring radius inside its 48-unit mark box
const RING_FROM_DEG = 45; // the C runs clockwise from 45° to 315° (screen angles), gap on the right
const RING_SPAN_DEG = 270;
const HALO_SCALE = 1.6;
const HALO_ALPHA = 0.8;
const RIM_ALPHA = 0.25; // the sphere's hairline limb at rest
const POINT_REF_R = 150; // px: the globe radius where the base point sizes read right
const POINT_MAX_K = 1.3; // wide screens grow the points up to this much (sqrt of the radius ratio)
const POINT_MIN_K = 0.7; // …and a small globe shrinks them down to this much, so the land stays legible
const DOT_FRONT = 1.3; // px added to the point size at the front (z = 1)
const DOT_BASE = 1; // px at the limb
const ALPHA_BUCKETS = 12;
const RING_STROKE = 3; // px: the solid C under the ring points
const RING_HALO = 10; // px: its soft halo
const RING_HALO_ALPHA = 0.16;
const RING_DOT = 2.4; // px: the points packed on the C
const LABEL_PLATE_PAD = 6; // px around the label text on its ink plate
const LABEL_PLATE_ALPHA = 0.82;
const GRID_PX = 7; // px between map grid dots, at any map size
const GRID_MIN_STEP = 4; // map units
const MAP_DOT = 2.1;
const MAP_ALPHA = 0.85;
const COAST_ALPHA = 0.55;
const NODE_R = 2.6;
const NODE_R_MAP = 3.6;
const END_R = 5; // the arc's "you" and partner nodes (about 2× a node)
const HEAD_R = 3;
const GLOW = [[3.2, 0.12], [1.9, 0.28]]; // [radius ×, alpha] halo rings under a glowing dot
const PULSE_R = 28;
const LABEL_FONT = '500 14px Poppins, "Poppins Fallback", system-ui, sans-serif';
const LABEL_GAP = 10;
const LABEL_DROP = 14; // px from the node to the label's middle, under it (above it when the map ends first)
const LABEL_HALF = 7;
const LABEL_HALO = 6; // px: the ink outline under the label
const PALETTE = {
  ink: { dot: '#D4AF37', node: '#E9DCB8', text: '#F3ECDD', glow: '#F1D27A', halo: '#0B0B0C' },
  bone: { dot: '#7A5C12', node: '#3B362C', text: '#0B0B0C', glow: '#7A5C12', halo: '#F5F0E6' },
  gold: { dot: '#0B0B0C', node: '#0B0B0C', text: '#0B0B0C', glow: '#0B0B0C', halo: '#D4AF37' },
};

/** World xyz → rotated (X, Y, Z), Z toward the viewer. */
export function rotator(rot) {
  const a = -toRad(rot.lon);
  const b = toRad(rot.lat);
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const cb = Math.cos(b);
  const sb = Math.sin(b);
  return (x, y, z) => {
    const x1 = x * ca + z * sa;
    const z1 = -x * sa + z * ca;
    return [x1, y * cb - z1 * sb, y * sb + z1 * cb];
  };
}

function haloSprite() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, size * 0.16, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(212,175,55,0.32)');
  grad.addColorStop(0.55, 'rgba(212,175,55,0.1)');
  grad.addColorStop(1, 'rgba(212,175,55,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/** Per-point ring slots: spread along the C with a little radial jitter (deterministic). */
function ringSlots(count) {
  const angle = new Float32Array(count);
  const radius = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const t = (i * 0.6180339887) % 1;
    const hash = (Math.sin(i * 12.9898) * 43758.5453) % 1; // a stable pseudo-random jitter, uncorrelated with t
    angle[i] = toRad(RING_FROM_DEG + RING_SPAN_DEG * t);
    radius[i] = 1 + (Math.abs(hash) - 0.5) * 0.025;
  }
  return { angle, radius };
}

/**
 * The map grid for one step (map units): the cell centres inside the coast
 * (scanline, even-odd), each traveller's landing cell, and the free cells.
 */
function buildGrid(step, count) {
  const xs = [];
  const cells = new Set();
  for (let gy = 0; (gy + 0.5) * step < MAP_H; gy += 1) {
    const v = ((gy + 0.5) * step) / MAP_H;
    xs.length = 0;
    COAST.forEach((ring) => {
      for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
        const vi = ring[i + 1];
        const vj = ring[j + 1];
        if ((vi > v) !== (vj > v)) xs.push((ring[i] + ((v - vi) * (ring[j] - ring[i])) / (vj - vi)) * MAP_W);
      }
    });
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let gx = Math.ceil(xs[k] / step - 0.5); (gx + 0.5) * step < xs[k + 1]; gx += 1) cells.add(gy * 4096 + gx);
    }
  }
  const land = new Float32Array(count * 2);
  for (let i = 0; i < count; i += 1) {
    const gx = Math.floor((MAP[i * 2] * MAP_W) / step);
    const gy = Math.floor((MAP[i * 2 + 1] * MAP_H) / step);
    land[i * 2] = ((gx + 0.5) * step) / MAP_W;
    land[i * 2 + 1] = ((gy + 0.5) * step) / MAP_H;
    cells.delete(gy * 4096 + gx);
  }
  const fill = new Float32Array(cells.size * 2);
  let n = 0;
  cells.forEach((key) => {
    fill[n] = (((key % 4096) + 0.5) * step) / MAP_W;
    fill[n + 1] = ((Math.floor(key / 4096) + 0.5) * step) / MAP_H;
    n += 2;
  });
  return { land, fill };
}

/** nodes: the city node places ({ xyz, uv }) drawn as small dots. */
export function createRenderer(canvas, cfg, nodes) {
  const ctx = canvas.getContext('2d');
  const count = cfg.globePoints < POINT_COUNT ? TIER_B_COUNT : POINT_COUNT;
  const landCount = count < POINT_COUNT ? LAND_B_COUNT : LAND.length / 3;
  const ring = ringSlots(count);
  const halo = cfg.halo ? haloSprite() : null;
  const view = { w: 0, h: 0, dpr: 1 };
  const total = count + landCount;
  const bucketXYR = Array.from({ length: ALPHA_BUCKETS }, () => new Float32Array(total * 3));
  const bucketLen = new Int32Array(ALPHA_BUCKETS);
  const grids = new Map();

  function resize(w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, cfg.dpr);
    if (w === view.w && h === view.h && dpr === view.dpr) return;
    Object.assign(view, { w, h, dpr });
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  /** The grid for the map's drawn width: GRID_PX between dots whatever the size (built once per step). */
  function gridOf(mw) {
    const step = Math.max(GRID_MIN_STEP, Math.round((GRID_PX * MAP_W) / Math.max(1, mw)));
    if (!grids.has(step)) grids.set(step, buildGrid(step, count));
    return grids.get(step);
  }

  function frameOf(S, rot) {
    const rotate = rotator(rot);
    const k = S.r * (1 + DOLLY * S.morph);
    const sphereXY = (p) => { const [X, Y, Z] = rotate(p[0], p[1], p[2]); return [S.cx + X * k, S.cy - Y * k, Z]; };
    const mapXY = (uv) => [S.mx + uv[0] * S.mw, S.my + uv[1] * S.mh];
    const at = (place) => {
      const [sx, sy, z] = sphereXY(place.xyz);
      if (S.morph <= 0) return [sx, sy, z];
      const [mx, my] = mapXY(place.uv);
      return [lerp(sx, mx, S.morph), lerp(sy, my, S.morph), lerp(z, 1, S.morph)];
    };
    return { rotate, k, sphereXY, mapXY, at };
  }

  function bucket(x, y, size, a) {
    if (a <= 0.004) return;
    const b = Math.min(ALPHA_BUCKETS - 1, Math.floor(a * ALPHA_BUCKETS));
    const n = bucketLen[b] * 3;
    if (n + 3 > bucketXYR[b].length) { // the map grid can outnumber the points: grow once
      const grown = new Float32Array(bucketXYR[b].length * 2);
      grown.set(bucketXYR[b]);
      bucketXYR[b] = grown;
    }
    bucketXYR[b][n] = x;
    bucketXYR[b][n + 1] = y;
    bucketXYR[b][n + 2] = size;
    bucketLen[b] += 1;
  }

  /** Size and alpha of a sphere point by depth: small, lit at the front, gone just past the limb. */
  const depthSize = (Z, grow) => (DOT_BASE + DOT_FRONT * Math.max(0, Z)) * grow;
  const depthAlpha = (Z) => (Z >= 0 ? 0.35 + 0.65 * Z : Math.max(0, 0.1 + 0.5 * Z));

  function fillBuckets(fade) {
    for (let b = 0; b < ALPHA_BUCKETS; b += 1) {
      if (!bucketLen[b]) continue;
      const list = bucketXYR[b];
      ctx.globalAlpha = ((b + 0.5) / ALPHA_BUCKETS) * fade;
      ctx.beginPath();
      for (let j = 0; j < bucketLen[b] * 3; j += 3) {
        const s = list[j + 2];
        ctx.rect(list[j] - s / 2, list[j + 1] - s / 2, s, s);
      }
      ctx.fill();
    }
  }

  function drawPoints(S, f, pal) {
    const fade = S.alpha * (1 - smooth(0.75, 1, S.medal));
    const grow = Math.min(POINT_MAX_K, Math.max(POINT_MIN_K, Math.sqrt(S.r / POINT_REF_R)));
    const grid = S.morph > 0 ? gridOf(S.gw || S.mw) : null;
    bucketLen.fill(0);
    for (let i = 0; i < count; i += 1) {
      const [X, Y, Z] = f.rotate(SPHERE[i * 3], SPHERE[i * 3 + 1], SPHERE[i * 3 + 2]);
      let x = S.cx + X * f.k;
      let y = S.cy - Y * f.k;
      let size = depthSize(Z, grow);
      let a = depthAlpha(Z);
      if (grid) {
        x = lerp(x, S.mx + grid.land[i * 2] * S.mw, S.morph);
        y = lerp(y, S.my + grid.land[i * 2 + 1] * S.mh, S.morph);
        size = lerp(size, MAP_DOT, S.morph);
        a = lerp(a, MAP_ALPHA, S.morph);
      }
      if (S.ring > 0) {
        const rr = S.r * RING_SHARE * ring.radius[i];
        x = lerp(x, S.cx + Math.cos(ring.angle[i]) * rr, S.ring);
        y = lerp(y, S.cy + Math.sin(ring.angle[i]) * rr, S.ring);
        size = lerp(size, RING_DOT, S.ring);
        a = lerp(a, 1, S.ring);
      }
      bucket(x, y, size, a);
    }
    const stay = (1 - smooth(0, 0.5, S.morph)) * (1 - smooth(0, 0.5, S.ring));
    const stride = S.morph > 0 || S.ring > 0 || S.medal > 0 || S.alpha < 1 ? 2 : 1; // in transition: half the land, which is fading anyway
    if (stay > 0.01) {
      for (let i = 0; i < landCount; i += stride) {
        const [X, Y, Z] = f.rotate(LAND[i * 3], LAND[i * 3 + 1], LAND[i * 3 + 2]);
        if (Z < -0.2) continue;
        bucket(S.cx + X * f.k, S.cy - Y * f.k, depthSize(Z, grow), depthAlpha(Z) * stay);
      }
    }
    const develop = grid ? smooth(0.55, 1, S.morph) * (1 - S.ring) : 0;
    if (develop > 0.01) {
      for (let i = 0; i < grid.fill.length; i += 2) bucket(S.mx + grid.fill[i] * S.mw, S.my + grid.fill[i + 1] * S.mh, MAP_DOT, MAP_ALPHA * develop);
    }
    ctx.fillStyle = pal.dot;
    fillBuckets(fade);
  }

  /** Canada's outline, drawn as the map settles: smoothed through the midpoints (no saw teeth). */
  function drawCoast(S, pal) {
    const alpha = COAST_ALPHA * smooth(0.5, 1, S.morph) * S.alpha * (1 - S.ring) * (1 - smooth(0.5, 1, S.medal));
    if (alpha <= 0.01) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = pal.dot;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const px = (uv, i) => S.mx + uv[i % uv.length] * S.mw;
    const py = (uv, i) => S.my + uv[(i + 1) % uv.length] * S.mh;
    COAST.forEach((uv) => {
      const n = uv.length;
      ctx.moveTo((px(uv, 0) + px(uv, 2)) / 2, (py(uv, 0) + py(uv, 2)) / 2);
      for (let i = 2; i <= n; i += 2) ctx.quadraticCurveTo(px(uv, i), py(uv, i), (px(uv, i) + px(uv, i + 2)) / 2, (py(uv, i) + py(uv, i + 2)) / 2);
      ctx.closePath();
    });
    ctx.stroke();
  }

  /** Ring mode: the solid C (gap on the right) with a soft halo, developing as the points arrive. */
  function drawRing(S, pal) {
    const alpha = S.alpha * smooth(0.45, 1, S.ring) * (1 - S.medal);
    if (alpha <= 0.01) return;
    const r = S.r * RING_SHARE;
    const a0 = toRad(RING_FROM_DEG);
    const a1 = toRad(RING_FROM_DEG + RING_SPAN_DEG);
    ctx.strokeStyle = pal.dot;
    ctx.lineCap = 'butt';
    [[RING_HALO, RING_HALO_ALPHA], [RING_STROKE, 1]].forEach(([width, k]) => {
      ctx.globalAlpha = alpha * k;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(S.cx, S.cy, r, a0, a1);
      ctx.stroke();
    });
  }

  function dot(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /** A dot with a soft halo under it (the arc ends and the travelling head). */
  function glowDot(x, y, r, alpha, pal) {
    ctx.fillStyle = pal.glow;
    GLOW.forEach(([k, a]) => { ctx.globalAlpha = alpha * a; dot(x, y, r * k); });
    ctx.fillStyle = pal.dot;
    ctx.globalAlpha = alpha;
    dot(x, y, r);
  }

  function drawNodes(S, f, pal) {
    const show = S.alpha * (1 - S.ring) * (1 - S.medal);
    if (show <= 0.01) return;
    ctx.fillStyle = pal.node;
    nodes.forEach((n) => {
      const [x, y, z] = f.at(n);
      ctx.globalAlpha = show * smooth(-0.05, 0.25, z);
      dot(x, y, lerp(NODE_R, NODE_R_MAP, S.morph));
    });
  }

  /** The arc as a quadratic: great-circle midpoint lifted on the sphere, a bowed chord on the map. */
  function arcCurve(S, f, a, b) {
    const [ax, ay, az] = f.at(a);
    const [bx, by, bz] = f.at(b);
    const m = [a.xyz[0] + b.xyz[0], a.xyz[1] + b.xyz[1], a.xyz[2] + b.xyz[2]];
    const len = Math.hypot(m[0], m[1], m[2]) || 1;
    const [mx, my] = f.sphereXY(m.map((c) => (c / len) * (1 + ARC_LIFT)));
    let cx = 2 * mx - (ax + bx) / 2;
    let cy = 2 * my - (ay + by) / 2;
    if (S.morph > 0) {
      const [pax, pay] = f.mapXY(a.uv);
      const [pbx, pby] = f.mapXY(b.uv);
      const chord = Math.hypot(pbx - pax, pby - pay);
      cx = lerp(cx, (pax + pbx) / 2, S.morph);
      cy = lerp(cy, (pay + pby) / 2 - chord * MAP_ARC_BOW * 2, S.morph);
    }
    return { ax, ay, cx, cy, bx, by, z: Math.min(az, bz) };
  }

  function pulseRing(x, y, r0, S, vis) {
    if (!(S.pulse > 0 && S.pulse < 1)) return;
    ctx.globalAlpha = vis * (1 - S.pulse);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(x, y, r0 + PULSE_R * S.pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawArc(S, f, arc, pal) {
    if (!arc.from || !arc.to || S.arcAlpha <= 0.01) return;
    const c = arcCurve(S, f, arc.from, arc.to);
    const vis = S.alpha * S.arcAlpha * (1 - S.ring) * (1 - S.medal) * smooth(-0.1, 0.2, c.z);
    if (vis <= 0.01) return;
    ctx.strokeStyle = pal.dot;
    pulseRing(c.ax, c.ay, END_R, S, vis);
    glowDot(c.ax, c.ay, END_R, vis, pal);
    if (S.arc > 0) {
      const t = S.arc;
      /* de Casteljau: the first t of the curve is itself a quadratic. */
      const q1x = lerp(c.ax, c.cx, t);
      const q1y = lerp(c.ay, c.cy, t);
      const ex = lerp(q1x, lerp(c.cx, c.bx, t), t);
      const ey = lerp(q1y, lerp(c.cy, c.by, t), t);
      ctx.globalAlpha = vis;
      ctx.lineWidth = lerp(2, 1.75, S.morph);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(c.ax, c.ay);
      ctx.quadraticCurveTo(q1x, q1y, ex, ey);
      ctx.stroke();
      if (t < 1) glowDot(ex, ey, HEAD_R, vis * (1 - smooth(0.9, 1, t)), pal);
      glowDot(c.bx, c.by, END_R * lerp(1, 0.9, S.morph), vis * smooth(0.85, 1, t), pal);
    }
    if (S.label > 0 && arc.label) drawLabel(arc.label, c.bx, c.by, vis * S.label, pal, c.bx < c.ax, S.my + S.mh, mapBounds(S));
  }

  function drawJoin(S, f, join, pal) {
    if (!join.place || S.join <= 0) return;
    const [x, y] = f.at(join.place);
    const vis = S.alpha * (1 - S.ring) * (1 - S.medal);
    ctx.strokeStyle = pal.dot;
    glowDot(x, y, END_R * Math.max(0, S.join), vis * clamp01(S.join), pal);
    pulseRing(x, y, NODE_R_MAP, S, vis);
    if (S.label > 0) drawLabel(join.label, x, y, vis * S.label, pal, false, S.my + S.mh, mapBounds(S));
  }

  const mapBounds = (S) => (S.morph > 0.5 && S.mw > 0 ? { x: S.mx, w: S.mw } : null);

  /**
   * The label sits just under its node (the map arc bows upward, so it never
   * crosses the text) unless the map ends first (`bottom`), on the side away
   * from the arc (`leftward`), kept inside the canvas, on an ink halo.
   */
  function drawLabel(text, x, y, alpha, pal, leftward = false, bottom = view.h, bounds = null) {
    ctx.font = LABEL_FONT;
    ctx.textBaseline = 'middle';
    const width = ctx.measureText(text).width;
    const fitsRight = x + LABEL_GAP + width <= view.w - LABEL_GAP;
    const fitsLeft = x - LABEL_GAP - width >= LABEL_GAP;
    const right = leftward ? !fitsLeft : fitsRight;
    let left = right ? x + LABEL_GAP : x - LABEL_GAP - width;
    if (bounds) left = Math.max(bounds.x, Math.min(bounds.x + bounds.w - width, left)); // the label stays in the globe's anchor box
    const ty = y + LABEL_DROP + LABEL_HALF <= bottom ? y + LABEL_DROP : y - LABEL_DROP;
    const pad = LABEL_PLATE_PAD;
    ctx.textAlign = 'left';
    ctx.globalAlpha = alpha * LABEL_PLATE_ALPHA;
    ctx.fillStyle = pal.halo;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(left - pad, ty - LABEL_HALF - pad, width + pad * 2, LABEL_HALF * 2 + pad * 2, LABEL_HALF + pad);
    else ctx.rect(left - pad, ty - LABEL_HALF - pad, width + pad * 2, LABEL_HALF * 2 + pad * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.lineJoin = 'round';
    ctx.lineWidth = LABEL_HALO;
    ctx.strokeStyle = pal.halo;
    ctx.strokeText(text, left, ty);
    ctx.fillStyle = pal.text;
    ctx.fillText(text, left, ty);
  }

  function drawLimb(S, pal, sphereShare) {
    const rim = RIM_ALPHA * sphereShare;
    const alpha = Math.max(S.limb, rim) * S.alpha;
    if (alpha <= 0.01) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = pal.dot;
    ctx.lineWidth = S.limb > rim ? lerp(1, 2, S.limb) : 1;
    ctx.beginPath();
    ctx.arc(S.cx, S.cy, S.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** clip: { x, y, r } viewport circle (the iris while it opens), or null. */
  function draw(S, rot, extras, field, clip = null) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (S.alpha <= 0.001 || S.r < 0.5) return;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    if (clip) {
      if (clip.r < 1) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(clip.x, clip.y, clip.r, 0, Math.PI * 2);
      ctx.clip();
    }
    const pal = PALETTE[field] || PALETTE.ink;
    const f = frameOf(S, rot);
    const sphereShare = (1 - S.morph) * (1 - S.ring) * (1 - S.medal);
    if (halo && sphereShare > 0.01) {
      ctx.globalAlpha = HALO_ALPHA * S.alpha * sphereShare;
      const size = S.r * 2 * HALO_SCALE;
      ctx.drawImage(halo, S.cx - size / 2, S.cy - size / 2, size, size);
    }
    drawRing(S, pal);
    drawPoints(S, f, pal);
    drawCoast(S, pal);
    drawLimb(S, pal, sphereShare);
    drawNodes(S, f, pal);
    drawArc(S, f, extras.arc, pal);
    drawJoin(S, f, extras.join, pal);
    if (clip) ctx.restore();
    ctx.globalAlpha = 1;
  }

  const clear = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  /** Build the map grid for a map drawn `mw` px wide now (on 'build'), so no cut pays for it. */
  const prepare = (mw) => { if (mw > 0) gridOf(mw); };
  return { resize, draw, clear, prepare };
}
