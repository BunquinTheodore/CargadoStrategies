/**
 * The Story building's geometry (building-plan.js PARTS): a procedural low-poly
 * office building, no model files. Each part is one group of at most four
 * draws, its boxes merged by material:
 *   body   black stone and slabs        glass  dark curtain walls
 *   gold   frames, mullions, trims      edges  gold hairlines on the body (tier A only)
 * Six parts, ≤ 24 draw calls in all. The three namespace comes in as `T`
 * (the stage passes the CDN copy, tests the npm copy, narrowed to THREE_NEEDS),
 * so this module never imports three itself.
 */
import { BUILDING_HEIGHT, PARTS, PART_SPANS } from './building-plan.js';

/** The three classes this module builds with (a test keeps the list honest). */
export const THREE_NEEDS = Object.freeze([
  'BoxGeometry', 'BufferGeometry', 'Color', 'EdgesGeometry', 'Float32BufferAttribute', 'Group',
  'LineBasicMaterial', 'LineSegments', 'Mesh', 'MeshStandardMaterial', 'Vector3',
]);

/** Colours: black and gold only (the gold is base.css --c-gold). */
export const COLORS = Object.freeze({ body: 0x111113, glass: 0x0b0b0c, gold: 0xd4af37 });

/** Footprint (model units): the tower's width (x) and depth (z). */
const W = 2.3;
const D = 1.5;
const SLAB = 0.1;
const MULLION = 0.03;
const MULLIONS_FRONT = 6;
const MULLIONS_SIDE = 4;
const EDGE_ANGLE = 30;
const LINE_OPACITY = 0.55;

const box = (w, h, d, x, y, z) => ({ w, h, d, x, y, z });

/* ---------- part plans: boxes per material, in assembled coordinates ---------- */

function foundation() {
  const [y0, y1] = PART_SPANS.foundation;
  const h = y1 - y0;
  return {
    body: [box(W + 0.9, h, D + 0.9, 0, y0 + h / 2, 0), box(1.0, 0.1, 0.3, 0, 0.05, D / 2 + 0.6)],
    glass: [],
    gold: [box(W + 0.92, 0.03, D + 0.92, 0, y1 - 0.015, 0)],
  };
}

function lobby(detail) {
  const [y0, y1] = PART_SPANS.lobby;
  const h = y1 - y0;
  const front = D / 2 + 0.05;
  const columnXs = [-1.15, -0.55, 0.55, 1.15];
  const column = (x, z) => box(0.08, h, 0.08, x, y0 + h / 2, z);
  // tier B keeps the front row only
  const columns = columnXs.flatMap((x) => (detail === 'high' ? [column(x, front), column(x, -front)] : [column(x, front)]));
  const doorH = 0.75;
  const glassFront = (D - 0.3) / 2 - 0.04;   // the door frames sit on the lobby glass
  const door = [-0.36, 0, 0.36].map((x) => box(0.04, doorH, 0.03, x, y0 + doorH / 2, glassFront))
    .concat([box(0.76, 0.04, 0.03, 0, y0 + doorH, glassFront)]);
  return {
    body: [box(W - 0.1, 0.06, D - 0.1, 0, y1 - 0.03, 0)],
    glass: [box(W - 0.2, h - 0.06, D - 0.3, 0, y0 + (h - 0.06) / 2, -0.04)],
    gold: [...columns, ...door, box(1.0, 0.04, 0.4, 0, y0 + doorH + 0.14, D / 2 + 0.12)],
  };
}

function floor(name, detail) {
  const [y0, y1] = PART_SPANS[name];
  const wallH = y1 - y0 - SLAB;
  const wallY = y0 + SLAB + wallH / 2;
  const gold = [box(W + 0.22, 0.025, D + 0.22, 0, y0 + SLAB, 0)];
  if (detail === 'high') {
    for (let i = 0; i < MULLIONS_FRONT; i += 1) {
      const x = -W / 2 + (i * W) / (MULLIONS_FRONT - 1);
      gold.push(box(MULLION, wallH, MULLION, x, wallY, D / 2 + 0.01), box(MULLION, wallH, MULLION, x, wallY, -D / 2 - 0.01));
    }
    for (let i = 1; i < MULLIONS_SIDE - 1; i += 1) {
      const z = -D / 2 + (i * D) / (MULLIONS_SIDE - 1);
      gold.push(box(MULLION, wallH, MULLION, W / 2 + 0.01, wallY, z), box(MULLION, wallH, MULLION, -W / 2 - 0.01, wallY, z));
    }
  }
  return {
    body: [box(W + 0.2, SLAB, D + 0.2, 0, y0 + SLAB / 2, 0)],
    glass: [box(W, wallH, D, 0, wallY, 0)],
    gold,
  };
}

function roof(detail) {
  const [y0] = PART_SPANS.roof;
  const slab = 0.12;
  const top = BUILDING_HEIGHT;
  const spireH = top - (y0 + slab);
  const gold = [box(W + 0.32, 0.05, D + 0.32, 0, y0 + slab + 0.025, 0), box(0.05, spireH, 0.05, 0.75, y0 + slab + spireH / 2, -0.3)];
  if (detail === 'high') gold.push(box(1.4, 0.03, 0.04, 0, y0 + slab + 0.4, D / 2 - 0.05), box(1.4, 0.03, 0.04, 0, y0 + slab + 0.12, D / 2 - 0.05));
  return {
    body: [
      box(W + 0.3, slab, D + 0.3, 0, y0 + slab / 2, 0),
      box(0.9, 0.35, 0.7, -0.35, y0 + slab + 0.175, -0.2),           // rooftop plant room
      box(1.36, 0.26, 0.04, 0, y0 + slab + 0.26, D / 2 - 0.08),     // the sign plate (left blank: no words are invented)
    ],
    glass: [],
    gold,
  };
}

/** part → { body, glass, gold } box lists for a detail level ('high' | 'low'). */
export function partPlans(detail = 'high') {
  return {
    foundation: foundation(),
    lobby: lobby(detail),
    floor1: floor('floor1', detail),
    floor2: floor('floor2', detail),
    floor3: floor('floor3', detail),
    roof: roof(detail),
  };
}

/* ---------- three ---------- */

/** One BufferGeometry from many boxes (position + normal; no uvs, nothing is textured). */
export function mergeBoxes(T, boxes) {
  const positions = [];
  const normals = [];
  boxes.forEach(({ w, h, d, x, y, z }) => {
    const g = new T.BoxGeometry(w, h, d).toNonIndexed();
    g.translate(x, y, z);
    positions.push(...g.getAttribute('position').array);
    normals.push(...g.getAttribute('normal').array);
    g.dispose();
  });
  const merged = new T.BufferGeometry();
  merged.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  merged.computeBoundingBox();
  return merged;
}

/** One part's materials (its own copies, so its gold call-out lights only it). */
function partMaterials(T) {
  const gold = new T.Color(COLORS.gold);
  return {
    body: new T.MeshStandardMaterial({ color: COLORS.body, metalness: 0.35, roughness: 0.55 }),
    glass: new T.MeshStandardMaterial({ color: COLORS.glass, metalness: 0.92, roughness: 0.14, emissive: gold, emissiveIntensity: 0 }),
    gold: new T.MeshStandardMaterial({ color: COLORS.gold, metalness: 1, roughness: 0.32, emissive: gold, emissiveIntensity: 0 }),
    edges: new T.LineBasicMaterial({ color: COLORS.gold, transparent: true, opacity: LINE_OPACITY, depthWrite: false }),
  };
}

/** How much each material lights up at glow 1. */
export const GLOW_GAIN = Object.freeze({ gold: 0.55, glass: 0.18 });

/**
 * The building → { root, content, parts, draws, dispose }. `root` is moved,
 * turned and scaled by the stage; `content` puts the assembled centre at the
 * root's origin; each part's `group` lifts along its EXPLODE offset.
 */
export function buildBuilding(T, { detail = 'high' } = {}) {
  const root = new T.Group();
  const content = new T.Group();
  content.position.y = -BUILDING_HEIGHT / 2;
  root.add(content);
  const plans = partPlans(detail);
  const parts = {};
  let draws = 0;
  PARTS.forEach((name) => {
    const group = new T.Group();
    group.name = name;
    const mats = partMaterials(T);
    ['body', 'glass', 'gold'].forEach((key) => {
      if (!plans[name][key].length) return;
      const geometry = mergeBoxes(T, plans[name][key]);
      group.add(new T.Mesh(geometry, mats[key]));
      draws += 1;
      if (key === 'body' && detail === 'high') {
        group.add(new T.LineSegments(new T.EdgesGeometry(geometry, EDGE_ANGLE), mats.edges));
        draws += 1;
      }
    });
    content.add(group);
    parts[name] = { group, mats };
  });
  const dispose = () => root.traverse((obj) => {
    obj.geometry?.dispose();
    [].concat(obj.material || []).forEach((m) => m.dispose());
  });
  return { root, content, parts, draws, dispose };
}
