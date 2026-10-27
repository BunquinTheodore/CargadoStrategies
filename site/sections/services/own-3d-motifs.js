/**
 * The six motifs of the Services own scenes (own-3d-config.js says which scene
 * shows which). Each builder takes the three.js parts it may use (`T`, the
 * THREE_NEEDS subset own-3d-stage.js imports) and a material kit in the
 * scene's gold, and returns
 *
 *   { root, radius, update(t, dt, p) }
 *
 * `root` is the Object3D the stage adds to the view's scene, `radius` the
 * size the camera frames, and update() moves it: `t` seconds of motion, `dt`
 * the frame step, `p` the smoothed pointer { x, y } (-1..1 from the view's
 * centre, y up) and `near` (0..1, how close the pointer is). No DOM here, so
 * tests build every motif against the npm three in node.
 *
 * Gold only: every material takes the kit's accent (the field's --accent),
 * shaded or faded, never another hue.
 */

/** Every three.js export a motif (or makeKit) uses; own-3d-stage.js must import each one. */
export const THREE_NEEDS = Object.freeze([
  'BoxGeometry', 'BufferGeometry', 'Color', 'ConeGeometry', 'DoubleSide', 'EdgesGeometry',
  'Float32BufferAttribute', 'Group', 'IcosahedronGeometry', 'LineBasicMaterial', 'LineSegments',
  'Mesh', 'MeshBasicMaterial', 'Points', 'PointsMaterial', 'Quaternion', 'Vector3',
]);

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => x * x * (3 - 2 * x);

/** A small deterministic random source (the same lattice and sparkles on every load). */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------- geometry helpers: flat [x, y, z, …] arrays of line segments ---------- */

function geometry(T, flat) {
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(flat, 3));
  return g;
}

function seg(out, a, b) {
  out.push(a[0], a[1], a[2] || 0, b[0], b[1], b[2] || 0);
  return out;
}

function rect(out, x0, y0, x1, y1, z = 0) {
  seg(out, [x0, y0, z], [x1, y0, z]);
  seg(out, [x1, y0, z], [x1, y1, z]);
  seg(out, [x1, y1, z], [x0, y1, z]);
  return seg(out, [x0, y1, z], [x0, y0, z]);
}

/** A circle as segments; `at(angle)` maps it into its plane (XY by default). */
function circle(out, r, n, at = (a) => [Math.cos(a) * r, Math.sin(a) * r, 0]) {
  for (let i = 0; i < n; i += 1) seg(out, at((i / n) * TAU), at(((i + 1) / n) * TAU));
  return out;
}

/** Two triangles filling a rectangle in XY. */
function quad(T, x0, y0, x1, y1, z = 0) {
  return geometry(T, [x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z]);
}

const lines = (T, flat, material) => new T.LineSegments(geometry(T, flat), material);

/** Smooth the pointer response: obj.rotation eases toward base + pointer tilt. */
function tilt(obj, p, base, amount, k = 1) {
  obj.rotation.y = lerp(obj.rotation.y, base.y + p.x * amount.y, k);
  obj.rotation.x = lerp(obj.rotation.x, base.x - p.y * amount.x, k);
}

/**
 * Bake flat shading into vertex colours: the kit's gold, darker on faces that
 * turn from a fixed light. Low-poly look with no lights or shaders beyond
 * MeshBasicMaterial.
 */
const LIGHT = Object.freeze([0.45, 0.8, 0.4]);
const AMBIENT = 0.38;
function bakeFlat(T, source, color) {
  const g = source.index ? source.toNonIndexed() : source;
  const pos = g.getAttribute('position').array;
  const colors = new Float32Array(pos.length);
  const len = Math.hypot(...LIGHT);
  for (let i = 0; i < pos.length; i += 9) {
    const ux = pos[i + 3] - pos[i], uy = pos[i + 4] - pos[i + 1], uz = pos[i + 5] - pos[i + 2];
    const vx = pos[i + 6] - pos[i], vy = pos[i + 7] - pos[i + 1], vz = pos[i + 8] - pos[i + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    const lit = Math.abs((nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / (nl * len));
    const shade = AMBIENT + (1 - AMBIENT) * lit;
    for (let v = 0; v < 9; v += 3) {
      colors[i + v] = color.r * shade;
      colors[i + v + 1] = color.g * shade;
      colors[i + v + 2] = color.b * shade;
    }
  }
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  return g;
}

/* ---------- the material kit ---------- */

/** Materials in one gold (`accent`, a CSS colour); `strength` scales every opacity (bone needs more ink). */
export function makeKit(T, { accent, strength = 1 }) {
  const color = new T.Color(accent);
  const fade = (o) => Math.min(1, o * strength);
  return {
    color,
    line: (o) => new T.LineBasicMaterial({ color, transparent: true, opacity: fade(o), depthWrite: false }),
    wire: (o) => new T.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: fade(o), depthWrite: false }),
    fill: (o) => new T.MeshBasicMaterial({ color, transparent: true, opacity: fade(o), depthWrite: false, side: T.DoubleSide }),
    dots: (size, o = 1) => new T.PointsMaterial({ color, size, transparent: o < 1, opacity: fade(o), depthWrite: o >= 1 }),
    faces: (o) => new T.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: fade(o), side: T.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    }),
    occluder: () => new T.MeshBasicMaterial({ colorWrite: false }),
  };
}

/* ---------- web: a floating wireframe browser, a phone beside it, a drifting grid ---------- */

const CARDS = [[-1.3, -0.5], [-0.4, 0.4], [0.5, 1.3]];
const GRID_STEP = 0.6;

function browserFrame() {
  const f = rect([], -1.5, -1, 1.5, 1);
  seg(f, [-1.5, 0.74], [1.5, 0.74]);
  [-1.34, -1.2, -1.06].forEach((x) => circle(f, 0.045, 10, (a) => [x + Math.cos(a) * 0.045, 0.87 + Math.sin(a) * 0.045, 0]));
  return rect(f, -0.8, 0.81, 0.9, 0.93);
}

function browserContent() {
  const c = rect([], -1.3, 0.02, 0.15, 0.58);
  [[1.3, 0.52], [1.1, 0.4], [1.22, 0.28], [0.9, 0.16]].forEach(([x1, y]) => seg(c, [0.4, y], [x1, y]));
  CARDS.forEach(([x0, x1]) => rect(c, x0, -0.85, x1, -0.18));
  return c;
}

function phoneFrame() {
  const f = rect([], -0.32, -0.62, 0.32, 0.62);
  seg(f, [-0.08, 0.54], [0.08, 0.54]);
  rect(f, -0.24, 0.1, 0.24, 0.42);
  [0, -0.12, -0.24].forEach((y) => seg(f, [-0.24, y], [0.16 - y * 0.3, y]));
  return rect(f, -0.24, -0.52, 0.24, -0.34);
}

function floorGrid() {
  const g = [];
  for (let x = -2.4; x <= 2.41; x += GRID_STEP) seg(g, [x, 0, -2.4], [x, 0, 1.2]);
  for (let z = -2.4; z <= 1.21; z += GRID_STEP) seg(g, [-2.4, 0, z], [2.4, 0, z]);
  return g;
}

function browser(T, kit) {
  const root = new T.Group();
  const body = new T.Group();
  root.add(body);
  body.add(lines(T, browserFrame(), kit.line(0.9)));
  const content = new T.Group();
  content.position.z = 0.18;
  content.add(lines(T, browserContent(), kit.line(0.6)));
  content.add(new T.Mesh(quad(T, -1.3, 0.02, 0.15, 0.58), kit.fill(0.1)));
  const cardFills = CARDS.map(([x0, x1]) => {
    const mesh = new T.Mesh(quad(T, x0, -0.85, x1, -0.18), kit.fill(0.12));
    content.add(mesh);
    return mesh.material;
  });
  body.add(content);
  const scanMaterial = kit.line(0.7);
  const scan = lines(T, seg([], [-1.45, 0, 0.1], [1.45, 0, 0.1]), scanMaterial);
  body.add(scan);
  const phone = new T.Group();
  phone.position.set(1.6, -0.45, 0.55);
  phone.add(lines(T, phoneFrame(), kit.line(0.85)));
  phone.add(new T.Mesh(quad(T, -0.32, -0.62, 0.32, 0.62), kit.fill(0.06)));
  root.add(phone);
  const grid = lines(T, floorGrid(), kit.line(0.22));
  grid.position.y = -1.45;
  root.add(grid);
  const scanBase = scanMaterial.opacity;
  const cardBase = cardFills[0].opacity;
  root.rotation.set(0.1, -0.28, 0);
  return {
    root,
    radius: 2.15,
    update(t, dt, p) {
      tilt(root, p, { x: 0.1 + Math.sin(t * 0.27) * 0.04, y: -0.28 + Math.sin(t * 0.35) * 0.12 }, { x: 0.25, y: 0.45 }, clamp01(dt * 4));
      body.position.y = Math.sin(t * 0.9) * 0.05;
      content.position.z = 0.18 + 0.14 * p.near + Math.sin(t * 1.3) * 0.03;
      phone.position.y = -0.45 + Math.sin(t * 1.1 + 1) * 0.08;
      const sweep = (t * 0.32) % 1;
      scan.position.y = 0.7 - sweep * 1.62;
      scanMaterial.opacity = scanBase * Math.sin(sweep * Math.PI);
      cardFills.forEach((m, i) => { m.opacity = cardBase * (0.35 + 0.65 * Math.max(0, Math.sin(t * 1.6 - i * 0.9))); });
      grid.position.z = (t * 0.25) % GRID_STEP;
    },
  };
}

/* ---------- graphics: one shape morphing sphere → cube → diamond → blob, swatches round it ---------- */

const SHAPES = [
  (x, y, z) => 1.15,
  (x, y, z) => 0.9 / Math.max(Math.abs(x), Math.abs(y), Math.abs(z)),
  (x, y, z) => 1.5 / (Math.abs(x) + Math.abs(y) + Math.abs(z)),
  (x, y, z) => 1.05 + 0.2 * Math.sin(3 * x * Math.PI) * Math.cos(3 * y),
];
const MORPH_REST = 0.55; // share of each cycle the shape holds still

function shapeTargets(base) {
  return SHAPES.map((radiusAt) => {
    const out = new Float32Array(base.length);
    for (let i = 0; i < base.length; i += 3) {
      const len = Math.hypot(base[i], base[i + 1], base[i + 2]) || 1;
      const x = base[i] / len, y = base[i + 1] / len, z = base[i + 2] / len;
      const r = radiusAt(x, y, z);
      out[i] = x * r; out[i + 1] = y * r; out[i + 2] = z * r;
    }
    return out;
  });
}

function swatches(T, kit) {
  const ring = new T.Group();
  [0, 1, 2].forEach((i) => {
    const swatch = new T.Group();
    const a = (i / 3) * TAU;
    swatch.position.set(Math.cos(a) * 1.75, Math.sin(a) * 1.75, 0);
    swatch.add(lines(T, rect([], -0.13, -0.13, 0.13, 0.13), kit.line(0.8)));
    swatch.add(new T.Mesh(quad(T, -0.13, -0.13, 0.13, 0.13), kit.fill(0.2 + i * 0.2)));
    ring.add(swatch);
  });
  return ring;
}

function morph(T, kit) {
  const root = new T.Group();
  const spin = new T.Group();
  root.add(spin);
  const geo = new T.IcosahedronGeometry(1, 3);
  const pos = geo.getAttribute('position');
  const targets = shapeTargets(Float32Array.from(pos.array));
  pos.array.set(targets[0]);
  const parts = [new T.Mesh(geo, kit.wire(0.5)), new T.Mesh(geo, kit.fill(0.07)), new T.Points(geo, kit.dots(0.04))];
  parts.forEach((part) => { part.frustumCulled = false; spin.add(part); });
  const ring = swatches(T, kit);
  ring.rotation.x = 1.2;
  root.add(ring);
  let phase = 0;
  return {
    root,
    radius: 2,
    update(t, dt, p) {
      phase += dt * 0.22 * (1 + 1.5 * p.near);
      const from = Math.floor(phase) % SHAPES.length;
      const to = (from + 1) % SHAPES.length;
      const k = smooth(clamp01(((phase % 1) - MORPH_REST) / (1 - MORPH_REST)));
      const a = targets[from], b = targets[to], out = pos.array;
      for (let i = 0; i < out.length; i += 1) out[i] = lerp(a[i], b[i], k);
      pos.needsUpdate = true;
      spin.rotation.y += dt * 0.3;
      spin.rotation.z = Math.sin(t * 0.2) * 0.2;
      ring.rotation.z += dt * 0.25;
      tilt(root, p, { x: 0, y: 0 }, { x: 0.4, y: 0.5 }, clamp01(dt * 4));
    },
  };
}

/* ---------- virtual assistant: calendar, mail and done tiles orbiting a clock ---------- */

const TILE_KINDS = ['calendar', 'mail', 'check'];
const TILE_COUNT = 6;
const ORBIT_R = 1.45;

const TILE_ART = {
  calendar() {
    const c = rect([], -0.25, -0.25, 0.25, 0.25);
    seg(c, [-0.25, 0.12], [0.25, 0.12]);
    [-0.12, 0.12].forEach((x) => seg(c, [x, 0.2], [x, 0.31]));
    [-0.14, 0, 0.14].forEach((x) => [-0.02, -0.15].forEach((y) => rect(c, x - 0.03, y - 0.03, x + 0.03, y + 0.03)));
    return c;
  },
  mail() {
    const c = rect([], -0.27, -0.18, 0.27, 0.18);
    seg(c, [-0.27, 0.18], [0, -0.03]);
    return seg(c, [0, -0.03], [0.27, 0.18]);
  },
  check() {
    const c = rect([], -0.22, -0.22, 0.22, 0.22);
    seg(c, [-0.12, 0], [-0.03, -0.1]);
    return seg(c, [-0.03, -0.1], [0.14, 0.12]);
  },
};

function clock(T, kit) {
  const face = new T.Group();
  const marks = circle([], 0.42, 40);
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * TAU;
    seg(marks, [Math.cos(a) * 0.34, Math.sin(a) * 0.34], [Math.cos(a) * 0.4, Math.sin(a) * 0.4]);
  }
  face.add(lines(T, marks, kit.line(0.85)));
  const hand = (length, opacity) => {
    const h = lines(T, seg([], [0, 0], [0, length]), kit.line(opacity));
    face.add(h);
    return h;
  };
  return { face, hour: hand(0.2, 0.95), minute: hand(0.32, 0.8) };
}

function tiles(T, kit) {
  const root = new T.Group();
  const { face, hour, minute } = clock(T, kit);
  root.add(face);
  const orbit = new T.Group();
  orbit.rotation.x = 1.15;
  orbit.add(lines(T, circle([], ORBIT_R, 64), kit.line(0.3)));
  root.add(orbit);
  const list = Array.from({ length: TILE_COUNT }, (_, i) => {
    const tile = new T.Group();
    const material = kit.line(0.9);
    tile.add(lines(T, TILE_ART[TILE_KINDS[i % TILE_KINDS.length]](), material));
    tile.add(new T.Mesh(quad(T, -0.25, -0.25, 0.25, 0.25), kit.fill(0.06)));
    orbit.add(tile);
    return { tile, material, base: material.opacity };
  });
  const q = new T.Quaternion();
  const world = new T.Vector3();
  let angle = 0;
  return {
    root,
    radius: 1.95,
    update(t, dt, p) {
      angle += dt * 0.35 * (1 + 1.2 * p.near);
      minute.rotation.z = -t * 0.6;
      hour.rotation.z = -t * 0.05;
      tilt(root, p, { x: 0.05, y: 0 }, { x: 0.35, y: 0.45 }, clamp01(dt * 4));
      root.updateMatrixWorld();
      orbit.getWorldQuaternion(q).invert();
      list.forEach(({ tile, material, base }, i) => {
        const a = angle + (i / TILE_COUNT) * TAU;
        tile.position.set(Math.cos(a) * ORBIT_R, Math.sin(a) * ORBIT_R, 0);
        tile.quaternion.copy(q); // always faces the camera
        tile.getWorldPosition(world);
        material.opacity = base * (0.3 + 0.7 * clamp01((world.z + ORBIT_R) / (2 * ORBIT_R)));
      });
    },
  };
}

/* ---------- software: a node lattice with pulses running its edges, a code glyph in front ---------- */

const LATTICE = Object.freeze({ nx: 4, ny: 4, nz: 3, step: 0.75, jitter: 0.12, link: 0.6, pulses: 16 });

function latticeNodes(rand) {
  const { nx, ny, nz, step, jitter } = LATTICE;
  const nodes = [];
  for (let i = 0; i < nx; i += 1) for (let j = 0; j < ny; j += 1) for (let k = 0; k < nz; k += 1) {
    nodes.push([
      (i - (nx - 1) / 2) * step + (rand() - 0.5) * 2 * jitter,
      (j - (ny - 1) / 2) * step + (rand() - 0.5) * 2 * jitter,
      (k - (nz - 1) / 2) * step + (rand() - 0.5) * 2 * jitter,
    ]);
  }
  return nodes;
}

function latticeEdges(rand) {
  const { nx, ny, nz, link } = LATTICE;
  const at = (i, j, k) => (i * ny + j) * nz + k;
  const edges = [];
  for (let i = 0; i < nx; i += 1) for (let j = 0; j < ny; j += 1) for (let k = 0; k < nz; k += 1) {
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(([di, dj, dk]) => {
      if (i + di < nx && j + dj < ny && k + dk < nz && rand() < link) edges.push([at(i, j, k), at(i + di, j + dj, k + dk)]);
    });
  }
  return edges;
}

function codeGlyph() {
  const g = [];
  seg(g, [-0.35, 0.18], [-0.55, 0]); seg(g, [-0.55, 0], [-0.35, -0.18]);
  seg(g, [-0.08, -0.22], [0.08, 0.22]);
  seg(g, [0.35, 0.18], [0.55, 0]); return seg(g, [0.55, 0], [0.35, -0.18]);
}

function lattice(T, kit) {
  const rand = seeded(7);
  const root = new T.Group();
  const net = new T.Group();
  root.add(net);
  const nodes = latticeNodes(rand);
  const edges = latticeEdges(rand);
  const links = nodes.map(() => []);
  edges.forEach(([a, b], e) => { links[a].push(e); links[b].push(e); });
  net.add(new T.Points(geometry(T, nodes.flat()), kit.dots(0.07)));
  net.add(lines(T, edges.flatMap(([a, b]) => [...nodes[a], ...nodes[b]]), kit.line(0.35)));
  const pulseGeo = geometry(T, new Array(LATTICE.pulses * 3).fill(0));
  const pulsePoints = new T.Points(pulseGeo, kit.dots(0.11));
  pulsePoints.frustumCulled = false;
  net.add(pulsePoints);
  const pulses = Array.from({ length: LATTICE.pulses }, (_, i) => {
    const edge = edges[Math.floor(rand() * edges.length)];
    return { from: edge[0], to: edge[1], s: rand(), speed: 0.6 + rand() * 0.6, seed: i };
  });
  const glyph = lines(T, codeGlyph(), kit.line(0.9));
  glyph.position.set(1.05, -1.0, 1.25);
  root.add(glyph);
  const advance = (pulse) => {
    const all = links[pulse.to]; // never empty: it holds the edge the pulse arrived on
    const onward = all.filter((e) => !edges[e].includes(pulse.from));
    const pool = onward.length ? onward : all;
    const [a, b] = edges[pool[Math.floor(rand() * pool.length)]];
    pulse.from = pulse.to;
    pulse.to = a === pulse.to ? b : a;
    pulse.s = 0;
  };
  root.rotation.set(0.35, 0.4, 0);
  return {
    root,
    radius: 2,
    update(t, dt, p) {
      const out = pulseGeo.getAttribute('position');
      pulses.forEach((pulse, i) => {
        pulse.s += dt * pulse.speed * (1 + 2 * p.near);
        if (pulse.s >= 1) advance(pulse);
        const a = nodes[pulse.from], b = nodes[pulse.to], s = Math.min(1, pulse.s);
        out.setXYZ(i, lerp(a[0], b[0], s), lerp(a[1], b[1], s), lerp(a[2], b[2], s));
      });
      out.needsUpdate = true;
      net.rotation.y += dt * 0.12;
      glyph.position.y = -1.0 + Math.sin(t * 1.2) * 0.06;
      tilt(root, p, { x: 0.35, y: 0.4 }, { x: 0.3, y: 0.5 }, clamp01(dt * 4));
    },
  };
}

/* ---------- export and import: a wire globe with shipping arcs out of Canada ---------- */

const GLOBE_R = 1.25;
/** Winnipeg, where the business is (the arcs start there), and five big world ports. */
const HUB = Object.freeze([49.9, -97.1]);
const PORTS = Object.freeze([[31.2, 121.5], [51.9, 4.5], [34.05, -118.24], [-23.96, -46.33], [18.95, 72.84]]);
const ARC_STEPS = 40;

function onSphere(lat, lon, r = GLOBE_R) {
  const la = lat * DEG, lo = lon * DEG;
  return [Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r];
}

function graticule() {
  const g = [];
  [-60, -30, 0, 30, 60].forEach((lat) => circle(g, 0, 64, (a) => onSphere(lat, a / DEG)));
  for (let lon = 0; lon < 360; lon += 30) {
    for (let i = 0; i < 24; i += 1) seg(g, onSphere(-80 + (160 * i) / 24, lon), onSphere(-80 + (160 * (i + 1)) / 24, lon));
  }
  return g;
}

/** Points along the great circle from a to b (unit vectors), lifted off the surface mid-way. */
function arcPoints(from, to) {
  const a = onSphere(...from, 1), b = onSphere(...to, 1);
  const omega = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const lift = 0.12 + 0.3 * (omega / Math.PI);
  return Array.from({ length: ARC_STEPS + 1 }, (_, i) => {
    const s = i / ARC_STEPS;
    const wa = Math.sin((1 - s) * omega) / Math.sin(omega), wb = Math.sin(s * omega) / Math.sin(omega);
    const r = GLOBE_R * (1 + Math.sin(Math.PI * s) * lift);
    return [0, 1, 2].map((c) => (wa * a[c] + wb * b[c]) * r);
  });
}

function globe(T, kit) {
  const root = new T.Group();
  const ball = new T.Group();
  root.add(ball);
  const occluder = new T.Mesh(new T.IcosahedronGeometry(GLOBE_R * 0.985, 3), kit.occluder());
  occluder.renderOrder = -1;
  ball.add(occluder);
  ball.add(lines(T, graticule(), kit.line(0.28)));
  const arcs = PORTS.map((port) => arcPoints(HUB, port));
  ball.add(lines(T, arcs.flatMap((pts) => pts.slice(1).flatMap((pt, i) => [...pts[i], ...pt])), kit.line(0.85)));
  ball.add(new T.Points(geometry(T, [...onSphere(...HUB), ...PORTS.flatMap((port) => onSphere(...port))]), kit.dots(0.09)));
  const shipGeo = geometry(T, new Array(arcs.length * 3).fill(0));
  const ships = new T.Points(shipGeo, kit.dots(0.075));
  ships.frustumCulled = false;
  ball.add(ships);
  const facing = -HUB[1] * DEG; // turns Canada to the camera
  root.rotation.set(0.62, facing, 0);
  return {
    root,
    radius: 1.8,
    update(t, dt, p) {
      const out = shipGeo.getAttribute('position');
      arcs.forEach((pts, i) => {
        const s = (t * 0.16 + i * 0.21) % 1;
        const f = s * ARC_STEPS, at = Math.floor(f), k = f - at;
        const a = pts[at], b = pts[Math.min(ARC_STEPS, at + 1)];
        out.setXYZ(i, lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k));
      });
      out.needsUpdate = true;
      tilt(root, p, { x: 0.62, y: facing + Math.sin(t * 0.12) * 0.5 }, { x: 0.3, y: 0.7 }, clamp01(dt * 3));
    },
  };
}

/* ---------- contractor: a low-poly house, a tapping hammer, a tree, sparkles ---------- */

function roofGeometry(T) {
  const A = [-0.92, 0.12, 0.72], B = [0.92, 0.12, 0.72], C = [0.92, 0.12, -0.72], D = [-0.92, 0.12, -0.72];
  const E = [-0.92, 0.72, 0], F = [0.92, 0.72, 0];
  const tris = [A, B, F, A, F, E, C, D, E, C, E, F, D, A, E, B, C, F];
  return geometry(T, tris.flat());
}

/** A solid with baked shading and its outline, both added to `parent`. */
function solid(T, kit, parent, source, faceOpacity = 0.5) {
  const g = bakeFlat(T, source, kit.color);
  parent.add(new T.Mesh(g, kit.faces(faceOpacity)));
  parent.add(new T.LineSegments(new T.EdgesGeometry(g, 20), kit.line(0.9)));
}

function houseDetails() {
  const z = 0.605;
  const d = rect([], -0.15, -0.85, 0.15, -0.4, z);
  [[-0.6, -0.3], [0.3, 0.6]].forEach(([x0, x1]) => {
    rect(d, x0, -0.35, x1, -0.08, z);
    seg(d, [(x0 + x1) / 2, -0.35, z], [(x0 + x1) / 2, -0.08, z]);
  });
  return d;
}

function groundRing(rand) {
  const g = circle([], 1.45, 48, (a) => [Math.cos(a) * 1.45, 0, Math.sin(a) * 1.45]);
  for (let i = 0; i < 26; i += 1) {
    const a = rand() * TAU, r = 1.0 + rand() * 0.5, h = 0.06 + rand() * 0.1;
    seg(g, [Math.cos(a) * r, 0, Math.sin(a) * r], [Math.cos(a) * r + 0.02, h, Math.sin(a) * r]);
  }
  return g;
}

function hammerGroup(T, kit) {
  const hammer = new T.Group();
  solid(T, kit, hammer, new T.BoxGeometry(0.06, 0.55, 0.06).translate(0, -0.22, 0), 0.6);
  solid(T, kit, hammer, new T.BoxGeometry(0.32, 0.1, 0.11).translate(0.02, 0.06, 0), 0.7);
  hammer.position.set(0.98, 0.95, 0.35);
  return hammer;
}

function house(T, kit) {
  const rand = seeded(11);
  const root = new T.Group();
  const home = new T.Group();
  root.add(home);
  solid(T, kit, home, new T.BoxGeometry(1.6, 1.0, 1.2).translate(0, -0.35, 0), 0.38);
  solid(T, kit, home, roofGeometry(T), 0.6);
  solid(T, kit, home, new T.BoxGeometry(0.18, 0.4, 0.18).translate(0.45, 0.62, -0.25), 0.5);
  home.add(lines(T, houseDetails(), kit.line(0.75)));
  solid(T, kit, home, new T.ConeGeometry(0.3, 0.75, 6).translate(-1.3, -0.15, 0.25), 0.45);
  home.add(lines(T, seg([], [-1.3, -0.85, 0.25], [-1.3, -0.52, 0.25]), kit.line(0.8)));
  const ground = lines(T, groundRing(rand), kit.line(0.35));
  ground.position.y = -0.85;
  home.add(ground);
  const hammer = hammerGroup(T, kit);
  home.add(hammer);
  const sparkleMaterial = kit.dots(0.05, 0.9);
  const sparkles = new T.Points(geometry(T, Array.from({ length: 18 }, () => {
    const a = rand() * TAU, r = 1.1 + rand() * 0.5;
    return [Math.cos(a) * r, -0.6 + rand() * 1.6, Math.sin(a) * r];
  }).flat()), sparkleMaterial);
  root.add(sparkles);
  const sparkleBase = sparkleMaterial.opacity;
  root.rotation.set(0.2, -0.55, 0);
  return {
    root,
    radius: 1.85,
    update(t, dt, p) {
      hammer.rotation.z = 0.25 + 0.7 * Math.abs(Math.sin(t * 1.8)) ** 3;
      sparkles.rotation.y = t * 0.2;
      sparkleMaterial.opacity = sparkleBase * (0.45 + 0.55 * Math.abs(Math.sin(t * 2.3)));
      tilt(root, p, { x: 0.2, y: -0.55 + Math.sin(t * 0.25) * 0.3 }, { x: 0.2, y: 0.6 }, clamp01(dt * 4));
    },
  };
}

/** Motif name (data-own-3d-view) → builder(T, kit). */
export const MOTIFS = Object.freeze({ browser, morph, tiles, lattice, globe, house });
