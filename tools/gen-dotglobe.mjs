/**
 * Dot-globe data and posters (Round 5, DIRECTION §9.5, C29).
 *
 *   node tools/gen-dotglobe.mjs
 *   node tools/gen-dotglobe.mjs --land=<world-atlas land-110m.json>   (prints a new LAND_RLE, writes nothing)
 *
 * Writes
 * - site/assets/data/dotglobe-points.js:
 *   - the land: a Fibonacci lattice of LATTICE points, as a bitset of the ones
 *     on land (LAND_RLE below: a 1° mask of Natural Earth 110 m land, public
 *     domain, from world-atlas@2.0.2), so the globe reads as the Earth;
 *   - 900 travellers: land points facing Canada, each paired with a point of
 *     the Canada map (sampled inside the canada-map.js outline, with a density
 *     bias to the southern population band) for the sphere → map morph. Any
 *     prefix is evenly spread on the map (tier B moves the first 520);
 *   - the coast: the canada-map.js provinces traced as one outline (no
 *     province borders), simplified and packed as zigzag varints;
 *   - 12 city nodes, the map projection and the poster arc's target node.
 * - site/assets/img/globe-poster.svg, canada-poster.svg, canada-join-poster.svg:
 *   the tier C and reduced-motion stand-ins, drawn from the same data and
 *   dressed like the settled canvas (halo, limb, land dots, glowing arc ends).
 *
 * Deterministic (seeded); re-running gives byte-identical output.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'site', 'assets', 'data');
const IMG = join(ROOT, 'site', 'assets', 'img');
const { REGIONS, MAP_WIDTH, MAP_HEIGHT, PROJECTION } = await import(pathToFileURL(join(DATA, 'canada-map.js')).href);
const { CITIES } = await import(pathToFileURL(join(DATA, 'cities.js')).href);

const LATTICE = 10000; // land points are the lattice points on land (about a third)
const COUNT = 900; // travellers
const COUNT_B = 520; // tier B prefix
const MIN_LAT = -62; // Antarctica never faces the camera
const FRONT_Z = 0; // travellers face the camera at FACE
const CANDIDATES = 24000;
const SEED = 0x5ca1ab1e;
const FACE = { lat: 58, lon: -94 }; // the morph faces this point (keep in sync with dotglobe.js)
const HERO_FACE = { lat: 44, lon: -92 }; // globe-poster orientation (keep in sync with dotglobe.js)
const SWAP_PASSES = 600000;
const COAST_TOL = 3; // map units: Douglas-Peucker tolerance of the traced outline
const COAST_MIN_AREA = 250; // map units²: smaller islands are dropped
const COAST_Q = 2; // map units per stored coast step
const COAST_CLOSE = 2; // cells: closing radius that seals the gaps between provinces
const MAP_ARC_MIN_SHARE = 0.26; // the map arc's chord spans at least this share of the map width (keep in sync with dotglobe.js)
const HERO_ARC_MIN_SHARE = 0.34; // the hero arc's chord, share of the diameter (keep in sync with dotglobe.js)
const NODE_NAMES = ['Vancouver', 'Calgary', 'Edmonton', 'Saskatoon', 'Regina', 'Winnipeg',
  'Toronto', 'Ottawa', 'Montréal', 'Québec City', 'Halifax', "St. John's"];
const VISITOR = 'Winnipeg'; // the default visitor city (keep in sync with dotglobe.js)
/** Density weight by latitude: the populated south gets the most dots. */
const densityAt = (lat) => (lat < 52 ? 1 : lat < 60 ? 1 - ((lat - 52) / 8) * 0.55 : 0.45 - Math.min(0.2, (lat - 60) / 60));
const GOLD = '#D4AF37';
const IVORY = '#E9DCB8';
const GLOW = '#F1D27A';
const POSTER_GRID = 10; // map units between the canada poster's dots
const MAP_ARC_BOW = 0.32; // keep in sync with dotglobe-draw.js

/* 1° land mask, 180 rows from 90°N, 360 columns from 180°W. Per row, run
 * lengths alternate sea, land, sea… and sum to 360; 255 means "254 more, same
 * value". Rebuild with --land. */
const LAND_RLE = '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';

/* ---------- seeded random ---------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);

/* ---------- geometry ---------- */

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

function project(lat, lon) {
  const p = PROJECTION;
  const rho = p.F / Math.tan(Math.PI / 4 + toRad(lat) / 2) ** p.n;
  const theta = p.n * toRad(lon - p.lon0);
  const x = rho * Math.sin(theta);
  const y = p.rho0 - rho * Math.cos(theta);
  return { x: (x - p.minx) * p.k + p.pad, y: (p.maxy - y) * p.k + p.pad };
}

function unprojectLat(sx, sy) {
  const p = PROJECTION;
  const x = (sx - p.pad) / p.k + p.minx;
  const y = p.maxy - (sy - p.pad) / p.k;
  const rho = Math.sign(p.n) * Math.hypot(x, p.rho0 - y);
  return toDeg(2 * Math.atan((p.F / rho) ** (1 / p.n)) - Math.PI / 2);
}

/** Fibonacci lattice point i of n (unit xyz, y up). dotglobe-points.js computes the same. */
function fibonacci(i, n = LATTICE) {
  const y = 1 - ((i + 0.5) / n) * 2;
  const r = Math.sqrt(1 - y * y);
  const t = Math.PI * (3 - Math.sqrt(5)) * i;
  return [Math.cos(t) * r, y, Math.sin(t) * r];
}

/** Rotate a world point so `face` is at the front (0, 0, 1). dotglobe-draw.js uses the same order. */
function facing([x, y, z], face) {
  const a = -toRad(face.lon);
  const x1 = x * Math.cos(a) + z * Math.sin(a);
  const z1 = -x * Math.sin(a) + z * Math.cos(a);
  const b = toRad(face.lat);
  return [x1, y * Math.cos(b) - z1 * Math.sin(b), y * Math.sin(b) + z1 * Math.cos(b)];
}

const latLonXyz = (lat, lon) => [Math.cos(toRad(lat)) * Math.sin(toRad(lon)), Math.sin(toRad(lat)), Math.cos(toRad(lat)) * Math.cos(toRad(lon))];

function km(a, b) {
  const h = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ---------- the land ---------- */

/** --land: rasterize a world-atlas land TopoJSON into LAND_RLE (a ray to the north per cell; seam edges skipped). */
function landRle(file) {
  const topo = JSON.parse(readFileSync(file, 'utf8'));
  const { scale, translate } = topo.transform;
  const arcs = topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; });
  });
  const ringOf = (ids) => ids.flatMap((id, k) => { const a = id < 0 ? arcs[~id].slice().reverse() : arcs[id]; return k ? a.slice(1) : a; });
  const edges = [];
  (topo.objects.land.geometries || [topo.objects.land]).forEach((g) => (g.type === 'Polygon' ? [g.arcs] : g.arcs).forEach((poly) => poly.forEach((ids) => {
    const pts = ringOf(ids);
    for (let i = 0; i + 1 < pts.length; i += 1) {
      const [x1, y1] = pts[i];
      let [x2, y2] = pts[i + 1];
      if (Math.abs(x1) > 179.999 && Math.abs(x2) > 179.999) continue;
      if (x2 - x1 > 180) x2 -= 360; else if (x1 - x2 > 180) x2 += 360;
      edges.push([x1, y1, x2, y2]);
    }
  })));
  const out = [];
  for (let r = 0; r < 180; r += 1) {
    const lat = 89.5 - r;
    let v = 0;
    let run = 0;
    const flush = () => { while (run > 254) { out.push(255); run -= 254; } out.push(run); };
    for (let c = 0; c < 360; c += 1) {
      const lon = -179.5 + c;
      let n = 0;
      edges.forEach(([x1, y1, x2, y2]) => {
        for (let k = -1; k <= 1; k += 1) {
          const x = lon + 360 * k;
          if (x < Math.min(x1, x2) || x >= Math.max(x1, x2)) continue;
          if (y1 + ((x - x1) * (y2 - y1)) / (x2 - x1) > lat) n += 1;
        }
      });
      if ((n & 1) !== v) { flush(); run = 0; v = n & 1; }
      run += 1;
    }
    flush();
  }
  return Buffer.from(out).toString('base64');
}

function landMask() {
  const bytes = Buffer.from(LAND_RLE, 'base64');
  const mask = new Uint8Array(360 * 180);
  let k = 0;
  for (let row = 0; row < 180; row += 1) {
    let c = 0;
    let v = 0;
    while (c < 360) {
      const b = bytes[k++];
      const len = b === 255 ? 254 : b;
      mask.fill(v, row * 360 + c, row * 360 + c + len);
      c += len;
      if (b !== 255) v ^= 1;
    }
  }
  return mask;
}

function landIndices() {
  const mask = landMask();
  const land = [];
  for (let i = 0; i < LATTICE; i += 1) {
    const [x, y, z] = fibonacci(i);
    const lat = toDeg(Math.asin(y));
    const lon = toDeg(Math.atan2(x, z));
    const row = Math.min(179, Math.floor(90 - lat));
    const col = Math.floor(lon + 180) % 360;
    if (lat >= MIN_LAT && mask[row * 360 + col]) land.push(i);
  }
  return land;
}

/* ---------- the Canada outline ---------- */

function polygons() {
  return REGIONS.flatMap(({ d }) => d.split('Z').map((sub) => sub.replace('M', '').trim()).filter(Boolean).map((sub) => {
    const n = sub.split(/[\s,]+/).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
    return pts;
  }));
}

/** The union of all provinces on a 1-unit grid (cell centres, even-odd per polygon). */
function raster(polys) {
  const grid = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    const cy = y + 0.5;
    polys.forEach((pts) => {
      const xs = [];
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if ((yi > cy) !== (yj > cy)) xs.push(xi + ((cy - yi) * (xj - xi)) / (yj - yi));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x < Math.min(MAP_WIDTH, xs[k + 1] - 0.5); x += 1) grid[y * MAP_WIDTH + x] = 1;
      }
    });
  }
  return grid;
}

/** Closed outlines of the land cells (cell corners, land on one side), as rings of [x, y]. */
function trace(grid) {
  const at = (x, y) => x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT && grid[y * MAP_WIDTH + x] === 1;
  const key = (x, y) => y * (MAP_WIDTH + 1) + x;
  const out = new Map();
  const add = (x1, y1, x2, y2) => {
    const k = key(x1, y1);
    if (!out.has(k)) out.set(k, []);
    out.get(k).push([x2, y2]);
  };
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      if (!at(x, y)) continue;
      if (!at(x, y - 1)) add(x, y, x + 1, y);
      if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!at(x - 1, y)) add(x, y + 1, x, y);
    }
  }
  const rings = [];
  out.forEach((list, k0) => {
    while (list.length) {
      const ring = [[k0 % (MAP_WIDTH + 1), Math.floor(k0 / (MAP_WIDTH + 1))]];
      let next = list.pop();
      while (next) {
        const [x, y] = next;
        const k = key(x, y);
        if (k === k0) break;
        ring.push([x, y]);
        next = out.get(k)?.pop();
      }
      rings.push(ring);
    }
  });
  return rings;
}

function simplify(pts, tol) {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let worst = -1;
    let worstD = tol;
    for (let i = a + 1; i < b; i += 1) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len;
      if (d > worstD) { worstD = d; worst = i; }
    }
    if (worst > 0) { keep[worst] = 1; stack.push([a, worst], [worst, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const area = (pts) => pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0) / 2;

/** One step of a 4-neighbour dilation (value 1) or erosion (value 0) of the land cells. */
function morph(grid, value) {
  const out = grid.slice();
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const i = y * MAP_WIDTH + x;
      if (grid[i] === value) continue;
      if ((x > 0 && grid[i - 1] === value) || (x + 1 < MAP_WIDTH && grid[i + 1] === value)
        || (y > 0 && grid[i - MAP_WIDTH] === value) || (y + 1 < MAP_HEIGHT && grid[i + MAP_WIDTH] === value)) out[i] = value;
    }
  }
  return out;
}

/**
 * The coast: the union raster closed by COAST_CLOSE cells (the provinces'
 * borders do not quite meet; the slivers between them would trace as holes),
 * traced, outer rings only (clockwise on screen: positive area), each split
 * at its farthest point so both halves simplify, small islands dropped.
 */
function coast() {
  let grid = raster(polygons());
  for (let k = 0; k < COAST_CLOSE; k += 1) grid = morph(grid, 1);
  for (let k = 0; k < COAST_CLOSE; k += 1) grid = morph(grid, 0);
  return trace(grid).filter((ring) => area(ring) >= COAST_MIN_AREA).map((ring) => {
    const far = ring.reduce((best, p, i) => (Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1]) > best.d ? { d: Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1]), i } : best), { d: -1, i: 0 }).i;
    const a = simplify(ring.slice(0, far + 1), COAST_TOL);
    const b = simplify([...ring.slice(far), ring[0]], COAST_TOL);
    return [...a, ...b.slice(1, -1)];
  }).filter((ring) => ring.length >= 4);
}

function varints(rings) {
  const out = [];
  const put = (v) => {
    let z = ((v << 1) ^ (v >> 31)) >>> 0;
    while (z >= 128) { out.push((z & 127) | 128); z >>>= 7; }
    out.push(z);
  };
  put(rings.length);
  rings.forEach((ring) => {
    put(ring.length);
    let x = 0;
    let y = 0;
    ring.forEach(([px, py]) => {
      const qx = Math.round(px / COAST_Q);
      const qy = Math.round(py / COAST_Q);
      put(qx - x);
      put(qy - y);
      x = qx;
      y = qy;
    });
  });
  return Buffer.from(out).toString('base64');
}

/* ---------- travellers ---------- */

/** Greedy farthest-point order of `pts` (distance divided by each point's spacing). */
function farthestOrder(pts, count, dist, spacing = () => 1) {
  const minD = new Float64Array(pts.length).fill(Infinity);
  const order = [];
  let pick = 0;
  for (let k = 0; k < count; k += 1) {
    order.push(pick);
    minD[pick] = -1;
    let best = -1;
    let bestD = -Infinity;
    for (let i = 0; i < pts.length; i += 1) {
      if (minD[i] < 0) continue;
      const d = dist(pts[i], pts[pick]) / spacing(i);
      if (d < minD[i]) minD[i] = d;
      if (minD[i] > bestD) { bestD = minD[i]; best = i; }
    }
    pick = best;
  }
  return order;
}

function sampleMap(polys) {
  const inside = (x, y) => polys.reduce((hit, pts) => {
    let h = hit;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) h = !h;
    }
    return h;
  }, false);
  const cands = [];
  while (cands.length < CANDIDATES) {
    const x = rand() * MAP_WIDTH;
    const y = rand() * MAP_HEIGHT;
    if (!inside(x, y)) continue;
    const w = densityAt(unprojectLat(x, y));
    if (rand() <= w) cands.push([x, y, 1 / Math.sqrt(w)]);
  }
  const order = farthestOrder(cands, COUNT, (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]), (i) => cands[i][2]);
  return order.map((i) => [cands[i][0] / MAP_WIDTH, cands[i][1] / MAP_HEIGHT]);
}

/** Map uv → the disk frame of the morph (contain-fit, y up), so pairs travel short distances. */
function mapFrame([u, v]) {
  const aspect = MAP_HEIGHT / MAP_WIDTH;
  return [(u - 0.5) * 2, -(v - 0.5) * 2 * aspect];
}

/** Pick a source from `pool` for every map point: greedy nearest, then random swaps and replacements. */
function pairPool(targets, pool) {
  const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
  const used = new Uint8Array(pool.length);
  const pick = targets.map((t) => {
    let best = -1;
    let bestD = Infinity;
    pool.forEach((p, j) => { if (!used[j] && d2(t, p.xy) < bestD) { bestD = d2(t, p.xy); best = j; } });
    used[best] = 1;
    return best;
  });
  for (let k = 0; k < SWAP_PASSES; k += 1) {
    const i = Math.floor(rand() * targets.length);
    if (k % 2) {
      const j = Math.floor(rand() * targets.length);
      const now = d2(targets[i], pool[pick[i]].xy) + d2(targets[j], pool[pick[j]].xy);
      if (d2(targets[i], pool[pick[j]].xy) + d2(targets[j], pool[pick[i]].xy) < now) [pick[i], pick[j]] = [pick[j], pick[i]];
    } else {
      const u = Math.floor(rand() * pool.length);
      if (!used[u] && d2(targets[i], pool[u].xy) < d2(targets[i], pool[pick[i]].xy)) { used[pick[i]] = 0; used[u] = 1; pick[i] = u; }
    }
  }
  return pick.map((j) => pool[j].fib);
}

function travellers(map, land) {
  const pool = land.map((fib) => ({ fib, p: facing(fibonacci(fib), FACE) })).filter((q) => q.p[2] > FRONT_Z)
    .map(({ fib, p }) => ({ fib, xy: [p[0], p[1]] }));
  if (pool.length < COUNT) throw new Error(`only ${pool.length} land points face Canada; raise LATTICE`);
  return pairPool(map.map(mapFrame), pool);
}

function encode(map, fibs) {
  const buf = Buffer.alloc(COUNT * 4);
  fibs.forEach((fib, i) => buf.writeUInt16LE(fib, i * 2));
  map.forEach(([u, v], i) => {
    buf.writeUInt8(Math.round(u * 255), COUNT * 2 + i * 2);
    buf.writeUInt8(Math.round(v * 255), COUNT * 2 + i * 2 + 1);
  });
  return buf.toString('base64');
}

function bitset(land) {
  const bits = Buffer.alloc(Math.ceil(LATTICE / 8));
  land.forEach((i) => { bits[i >> 3] |= 1 << (i & 7); });
  return bits.toString('base64');
}

/* ---------- nodes and arcs ---------- */

function nodes() {
  return NODE_NAMES.map((name) => {
    const c = CITIES.find((city) => city.name === name);
    if (!c) throw new Error(`cities.js has no ${name}`);
    const { x, y } = project(c.lat, c.lon);
    return { name, lat: c.lat, lon: c.lon, u: +(x / MAP_WIDTH).toFixed(4), v: +(y / MAP_HEIGHT).toFixed(4) };
  });
}

/** The map arc's far end, as dotglobe.js picks it: the nearest node whose map chord is at least MAP_ARC_MIN_SHARE of the width. */
function mapArcTarget(nodeList, from) {
  const chord = (n) => Math.hypot((n.u - from.u) * MAP_WIDTH, (n.v - from.v) * MAP_HEIGHT);
  return nodeList.filter((n) => chord(n) >= MAP_ARC_MIN_SHARE * MAP_WIDTH).sort((a, b) => km(from, a) - km(from, b))[0];
}

/** The hero arc, as dotglobe.js picks it: the visitor to the nearest node spanning HERO_ARC_MIN_SHARE of the diameter, else the widest visible pair. */
function heroArcEnds(nodeList, from) {
  const seen = (n) => facing(latLonXyz(n.lat, n.lon), HERO_FACE);
  const span = (a, b) => { const [ax, ay] = seen(a); const [bx, by] = seen(b); return Math.hypot(bx - ax, by - ay) / 2; };
  const front = nodeList.filter((n) => seen(n)[2] >= 0.25);
  const far = front.filter((n) => span(from, n) >= HERO_ARC_MIN_SHARE).sort((a, b) => span(from, a) - span(from, b))[0];
  if (front.includes(from) && far) return [from, far];
  let best = null;
  front.forEach((a) => front.forEach((b) => { if (seen(a)[0] < seen(b)[0] && (!best || span(a, b) > best.s)) best = { s: span(a, b), a, b }; }));
  return [best.a, best.b];
}

/* ---------- the data module ---------- */

function dataModule({ packed, bits, coastB64, nodeList, posterNear, landCount }) {
  return `/**
 * Dot-globe data. Generated by tools/gen-dotglobe.mjs; do not edit by hand.
 *
 * SPHERE  Float32Array(${COUNT} × 3)  the travellers' unit xyz (y up): land points facing Canada
 * MAP     Float32Array(${COUNT} × 2)  where each traveller lands on the ${MAP_WIDTH}×${MAP_HEIGHT} canada-map.js frame (uv 0..1, 8-bit: the map grid snaps it)
 *         Index i of SPHERE morphs into index i of MAP; any prefix is evenly spread on the map (tier B: ${COUNT_B}).
 * LAND    Float32Array(n × 3)  the other ${landCount - COUNT} land points of a ${LATTICE}-point Fibonacci lattice;
 *         the first LAND_B_COUNT (every other lattice point) are tier B's
 * COAST   rings of map uv: Canada's outline, one union, no province borders
 * NODES   12 city nodes: name, lat, lon and map uv
 * PROJ    the canada-map.js projection (uv for any city: project, then ÷ MAP_W / MAP_H)
 * POSTER_NEAR  the canada poster's arc target (the visitor default is Winnipeg)
 */
export const MAP_W = ${MAP_WIDTH};
export const MAP_H = ${MAP_HEIGHT};
export const POINT_COUNT = ${COUNT};
export const TIER_B_COUNT = ${COUNT_B};
export const PROJ = Object.freeze(${JSON.stringify(PROJECTION)});
export const NODES = Object.freeze(${JSON.stringify(nodeList)}.map(Object.freeze));
export const POSTER_NEAR = ${JSON.stringify(posterNear)};

const LATTICE = ${LATTICE};
const PACKED = '${packed}';
const LAND_BITS = '${bits}';
const COAST_PACKED = '${coastB64}';

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const bytesOf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

function lattice(i, out, at) {
  const y = 1 - ((i + 0.5) / LATTICE) * 2;
  const r = Math.sqrt(1 - y * y);
  out[at] = Math.cos(GOLDEN * i) * r;
  out[at + 1] = y;
  out[at + 2] = Math.sin(GOLDEN * i) * r;
}

export const SPHERE = new Float32Array(POINT_COUNT * 3);
export const MAP = new Float32Array(POINT_COUNT * 2);
const moving = new Set();
const view = new DataView(bytesOf(PACKED).buffer);
for (let i = 0; i < POINT_COUNT; i += 1) {
  const fib = view.getUint16(i * 2, true);
  moving.add(fib);
  lattice(fib, SPHERE, i * 3);
  MAP[i * 2] = view.getUint8(POINT_COUNT * 2 + i * 2) / 255;
  MAP[i * 2 + 1] = view.getUint8(POINT_COUNT * 2 + i * 2 + 1) / 255;
}

const bits = bytesOf(LAND_BITS);
const even = [];
const odd = [];
for (let i = 0; i < LATTICE; i += 1) if (bits[i >> 3] & (1 << (i & 7)) && !moving.has(i)) (i % 2 ? odd : even).push(i);
export const LAND_B_COUNT = even.length;
export const LAND = new Float32Array((even.length + odd.length) * 3);
even.concat(odd).forEach((fib, k) => lattice(fib, LAND, k * 3));

export const COAST = (() => {
  const b = bytesOf(COAST_PACKED);
  let k = 0;
  const next = () => {
    let v = 0;
    let shift = 0;
    let byte;
    do { byte = b[k++]; v |= (byte & 127) << shift; shift += 7; } while (byte & 128);
    return (v >>> 1) ^ -(v & 1);
  };
  return Object.freeze(Array.from({ length: next() }, () => {
    const ring = new Float32Array(next() * 2);
    let x = 0;
    let y = 0;
    for (let j = 0; j < ring.length; j += 2) {
      x += next();
      y += next();
      ring[j] = (x * ${COAST_Q}) / MAP_W;
      ring[j + 1] = (y * ${COAST_Q}) / MAP_H;
    }
    return ring;
  }));
})();
`;
}

/* ---------- posters ---------- */

const f = (n, d = 3) => +n.toFixed(d);
const fs = (n) => String(f(n)).replace(/^(-?)0\./, '$1.');

/** A glowing end dot, as the canvas draws it (two halo rings under the dot). */
const glowDot = (x, y, r) => `<circle cx="${fs(x)}" cy="${fs(y)}" r="${fs(r * 3.2)}" fill="${GLOW}" opacity=".12"/>`
  + `<circle cx="${fs(x)}" cy="${fs(y)}" r="${fs(r * 1.9)}" fill="${GLOW}" opacity=".28"/><circle cx="${fs(x)}" cy="${fs(y)}" r="${fs(r)}"/>`;

function quadArc(ax, ay, cx, cy, bx, by, width) {
  return `<path d="M${fs(ax)} ${fs(ay)}Q${fs(cx)} ${fs(cy)} ${fs(bx)} ${fs(by)}" fill="none" stroke="${GOLD}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function globePoster(land, nodeList) {
  const groups = [[0.4, 0.0065, 0.45], [0.75, 0.0085, 0.75], [1.01, 0.0105, 1]];
  const paths = groups.map(() => []);
  land.forEach((i) => {
    const [x, y, z] = facing(fibonacci(i), HERO_FACE);
    if (z <= 0.03) return;
    paths[groups.findIndex(([top]) => z < top)].push(`M${fs(x)} ${fs(-y)}h0`);
  });
  const dots = groups.map(([, w, o], g) => `<path d="${paths[g].join('')}" stroke="${GOLD}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`).join('');
  const xy = (n) => { const [x, y, z] = facing(latLonXyz(n.lat, n.lon), HERO_FACE); return [x, -y, z]; };
  const nodeDots = nodeList.map(xy).filter(([, , z]) => z > 0.1).map(([x, y]) => `<circle cx="${fs(x)}" cy="${fs(y)}" r=".009"/>`).join('');
  const [from, to] = heroArcEnds(nodeList, nodeList.find((n) => n.name === VISITOR));
  const [ax, ay] = xy(from);
  const [bx, by] = xy(to);
  const mid = latLonXyz(from.lat, from.lon).map((c, i) => c + latLonXyz(to.lat, to.lon)[i]);
  const len = Math.hypot(...mid);
  const [mx, my] = facing(mid.map((c) => (c / len) * 1.12), HERO_FACE);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1.04 -1.04 2.08 2.08" fill="${GOLD}" aria-hidden="true">`
    + `<defs><radialGradient id="h" r="1.04" cx="0" cy="0" gradientUnits="userSpaceOnUse"><stop offset=".1" stop-color="${GOLD}" stop-opacity=".24"/>`
    + `<stop offset=".6" stop-color="${GOLD}" stop-opacity=".09"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient></defs>`
    + '<circle r="1.04" fill="url(#h)"/>'
    + `<circle r="1" fill="none" stroke="${GOLD}" stroke-opacity=".25" stroke-width=".004"/>`
    + `${dots}<g fill="${IVORY}">${nodeDots}</g>`
    + quadArc(ax, ay, 2 * mx - (ax + bx) / 2, -2 * my - (ay + by) / 2, bx, by, '.006')
    + glowDot(ax, ay, 0.015) + glowDot(bx, by, 0.015) + '</svg>\n';
}

function coastPath(rings) {
  return rings.map((ring) => `M${ring.map(([x, y]) => `${x} ${y}`).join(' ')}Z`).join('');
}

function canadaPoster(rings, nodeList, posterNear, join) {
  const at = (n) => [n.u * MAP_WIDTH, n.v * MAP_HEIGHT];
  const d = coastPath(rings);
  const nodeDots = nodeList.map((n) => { const [x, y] = at(n); return `<circle cx="${f(x, 1)}" cy="${f(y, 1)}" r="4.5"/>`; }).join('');
  const from = nodeList.find((n) => n.name === VISITOR);
  const [ax, ay] = at(from);
  let extra;
  if (join) {
    extra = `<circle cx="${f(ax, 1)}" cy="${f(ay, 1)}" r="16" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity=".5"/>` + glowDot(ax, ay, 7);
  } else {
    const [bx, by] = at(nodeList.find((n) => n.name === posterNear));
    const chord = Math.hypot(bx - ax, by - ay);
    extra = quadArc(ax, ay, (ax + bx) / 2, (ay + by) / 2 - chord * MAP_ARC_BOW * 2, bx, by, '2.5') + glowDot(ax, ay, 6.5) + glowDot(bx, by, 6.5);
  }
  const g = POSTER_GRID;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" fill="${GOLD}" aria-hidden="true">`
    + `<defs><pattern id="d" width="${g}" height="${g}" patternUnits="userSpaceOnUse"><circle cx="${g / 2}" cy="${g / 2}" r="1.9"/></pattern></defs>`
    + `<path d="${d}" fill="url(#d)" fill-rule="evenodd" opacity=".85"/>`
    + `<path d="${d}" fill="none" stroke="${GOLD}" stroke-width="1.1" stroke-linejoin="round" opacity=".55"/>`
    + `<g fill="${IVORY}">${nodeDots}</g>${extra}</svg>\n`;
}

/* ---------- main ---------- */

const landArg = process.argv.find((a) => a.startsWith('--land='));
if (landArg) {
  process.stdout.write(`${landRle(landArg.slice('--land='.length))}\n`);
} else {
  const polys = polygons();
  const land = landIndices();
  const map = sampleMap(polys);
  const fibs = travellers(map, land);
  const rings = coast();
  const nodeList = nodes();
  const posterNear = mapArcTarget(nodeList, nodeList.find((n) => n.name === VISITOR)).name;
  const files = [
    [join(DATA, 'dotglobe-points.js'), dataModule({ packed: encode(map, fibs), bits: bitset(land), coastB64: varints(rings), nodeList, posterNear, landCount: land.length })],
    [join(IMG, 'globe-poster.svg'), globePoster(land, nodeList)],
    [join(IMG, 'canada-poster.svg'), canadaPoster(rings, nodeList, posterNear, false)],
    [join(IMG, 'canada-join-poster.svg'), canadaPoster(rings, nodeList, posterNear, true)],
  ];
  files.forEach(([path, text]) => {
    writeFileSync(path, text);
    process.stdout.write(`${path.slice(ROOT.length + 1)}  ${Buffer.byteLength(text)} B raw, ${gzipSync(text).length} B gzip\n`);
  });
  process.stdout.write(`land ${land.length} (tier B ${land.filter((i) => i % 2 === 0).length}), coast ${rings.length} rings / ${rings.reduce((s, r) => s + r.length, 0)} vertices, poster arc ${VISITOR} → ${posterNear}\n`);
}
