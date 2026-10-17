/**
 * Network globe (three.js 0.160.0): a sphere of points, Canadian city nodes in
 * gold, a few great-circle arcs between them and a thin inner icosahedron.
 *
 * Each scene declares data-pose="x,y,z,rx,ry,s"; poses are tweened on the
 * film's master timeline (scrubbed, reversible). Optional per-layout poses:
 * data-pose-sm (narrow screens, aspect < 0.9) and data-pose-md (stacked
 * columns, ≤ 1099 px wide); each falls back to data-pose. They are read on
 * every (re)build, and a resize always rebuilds. Colours follow the field
 * blend reported by the film. Flow mode renders one static frame.
 *
 * Performance (Round 3): three.js is imported only after the film's first
 * build, when the browser is idle, and starts in short staged tasks.
 * Low-power devices (perf.js) get fewer points, DPR 1 and no antialiasing;
 * Save-Data, missing WebGL or a failed import get the static SVG globe
 * (globe-fallback.js). The render loop sleeps in hidden tabs and while
 * the globe is hidden, renders every frame while the pose or colours change,
 * and drops to IDLE_FPS for the gentle idle sway.
 */
import { lowPower, saveData, onIdle, createLoop, yieldToMain } from './perf.js';
import { startFallback } from './globe-fallback.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const DPR_MAX = 1.75;
const DPR_LOW = 1;
const POINT_COUNT = 1100;
const POINT_COUNT_LOW = 520;
const IDLE_FRAME_MS = 1000 / 30; // idle sway frame interval
const ARC_SEGMENTS = 56;
const ARC_LIFT = 0.18;
const ICO_RADIUS = 0.62;
const CENTER = { lat: 56, lon: -96 }; // roughly the middle of Canada faces the camera
const HUB = 'Winnipeg';
const STACKED_QUERY = '(max-width: 1099px)'; // base.css md grid: columns stack
const IDLE_SWAY = 0.035;
const IDLE_SPEED = 0.00025;
const POSE_KEYS = ['x', 'y', 'z', 'rx', 'ry', 's'];
const DEFAULT_POSE = { x: 0, y: 0, z: 0, rx: 0, ry: 0, s: 1 };

/**
 * Camera and narrow-screen factors. On narrow screens (aspect < NARROW_ASPECT)
 * every pose, data-pose-sm included, is applied with x × NARROW_X and
 * scale × NARROW_SCALE. Pages that turn screen boxes into poses import this.
 */
export const CAMERA = Object.freeze({ FOV: 30, Z: 7, NARROW_ASPECT: 0.9, NARROW_X: 0.3, NARROW_SCALE: 0.78 });

/** Real city coordinates (decorative network nodes, not partners). */
const CITIES = [
  ['Vancouver', 49.28, -123.12], ['Victoria', 48.43, -123.37], ['Calgary', 51.05, -114.07],
  ['Edmonton', 53.55, -113.49], ['Saskatoon', 52.13, -106.67], ['Regina', 50.45, -104.61],
  ['Winnipeg', 49.9, -97.14], ['Thunder Bay', 48.38, -89.25], ['Toronto', 43.65, -79.38],
  ['Ottawa', 45.42, -75.7], ['Montreal', 45.5, -73.57], ['Quebec City', 46.81, -71.21],
  ['Moncton', 46.09, -64.78], ['Halifax', 44.65, -63.58], ['Charlottetown', 46.24, -63.13],
  ["St. John's", 47.56, -52.71], ['Whitehorse', 60.72, -135.06], ['Yellowknife', 62.45, -114.37],
  ['Iqaluit', 63.75, -68.52],
];
const ARC_TARGETS = ['Vancouver', 'Calgary', 'Toronto', 'Montreal', 'Halifax', 'Yellowknife', "St. John's"];

/** Colours per field: [points, nodes, arcs, icosahedron]. */
const PALETTE = {
  ink: ['#F3ECDD', '#D4AF37', '#D4AF37', '#B8913A'],
  gold: ['#0B0B0C', '#0B0B0C', '#1A1A1C', '#1A1A1C'],
  bone: ['#7A5C12', '#B8913A', '#7A5C12', '#B8913A'],
};

export function parsePose(value) {
  if (!value) return null;
  const nums = value.split(',').map((n) => parseFloat(n));
  if (nums.length !== POSE_KEYS.length || nums.some((n) => !Number.isFinite(n))) return null;
  return Object.fromEntries(POSE_KEYS.map((k, i) => [k, nums[i]]));
}

/** Which pose set fits the screen: 'sm' (narrow), 'md' (stacked columns) or 'lg'. */
export function poseLayout(stage = document.querySelector('.stage')) {
  const width = stage?.clientWidth || window.innerWidth;
  const height = stage?.clientHeight || window.innerHeight;
  if (width / Math.max(1, height) < CAMERA.NARROW_ASPECT) return 'sm';
  return window.matchMedia(STACKED_QUERY).matches ? 'md' : 'lg';
}

/** A scene's pose for `layout`: data-pose-sm / data-pose-md when set, else data-pose (null when none). */
export function scenePose(sceneEl, layout = poseLayout()) {
  const d = sceneEl?.dataset || {};
  const value = (layout === 'sm' && d.poseSm) || (layout === 'md' && d.poseMd) || d.pose;
  return parsePose(value);
}

function webglAvailable() {
  try {
    const probe = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (probe.getContext('webgl2') || probe.getContext('webgl')));
  } catch {
    return false;
  }
}

function ensureCanvas(stage) {
  let canvas = document.getElementById('gl');
  if (!canvas && stage) {
    canvas = document.createElement('canvas');
    canvas.id = 'gl';
    stage.appendChild(canvas);
  }
  canvas?.setAttribute('aria-hidden', 'true');
  return canvas;
}

/* ---------- geometry ---------- */

function latLonToVec(THREE, lat, lon, r = 1) {
  const phi = THREE.MathUtils.degToRad(lat);
  const lambda = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(r * Math.cos(phi) * Math.sin(lambda), r * Math.sin(phi), r * Math.cos(phi) * Math.cos(lambda));
}

function dotTexture(THREE) {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function fibonacciSphere(THREE, count) {
  const positions = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    positions.set([Math.cos(theta) * radius, y, Math.sin(theta) * radius], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

function arcGeometry(THREE, a, b) {
  const points = [];
  const angle = a.angleTo(b);
  for (let i = 0; i <= ARC_SEGMENTS; i += 1) {
    const t = i / ARC_SEGMENTS;
    const v = a.clone().lerp(b, t).normalize();
    points.push(v.multiplyScalar(1 + Math.sin(Math.PI * t) * ARC_LIFT * (0.4 + angle)));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function buildGlobe(THREE) {
  const sprite = dotTexture(THREE);
  const mat = (color, size, opacity) => new THREE.PointsMaterial({
    color, size, map: sprite, transparent: true, opacity, depthWrite: false, sizeAttenuation: true,
  });
  const points = new THREE.Points(fibonacciSphere(THREE, lowPower() ? POINT_COUNT_LOW : POINT_COUNT), mat('#F3ECDD', 0.022, 0.7));
  const cityVecs = Object.fromEntries(CITIES.map(([name, lat, lon]) => [name, latLonToVec(THREE, lat, lon, 1.004)]));
  const nodeGeo = new THREE.BufferGeometry().setFromPoints(Object.values(cityVecs));
  const nodes = new THREE.Points(nodeGeo, mat('#D4AF37', 0.075, 1));
  const arcMat = new THREE.LineBasicMaterial({ color: '#D4AF37', transparent: true, opacity: 0.85 });
  const arcs = ARC_TARGETS.map((name) => new THREE.Line(arcGeometry(THREE, cityVecs[HUB], cityVecs[name]), arcMat));
  const icoGeo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(ICO_RADIUS, 1));
  const ico = new THREE.LineSegments(icoGeo, new THREE.LineBasicMaterial({ color: '#B8913A', transparent: true, opacity: 0.35 }));

  const spin = new THREE.Group();
  spin.rotation.y = -THREE.MathUtils.degToRad(CENTER.lon);
  spin.add(points, nodes, ...arcs);
  const tilt = new THREE.Group();
  tilt.rotation.x = THREE.MathUtils.degToRad(CENTER.lat);
  tilt.add(spin);
  const root = new THREE.Group();
  root.add(tilt, ico);
  return { root, materials: [points.material, nodes.material, arcMat, ico.material] };
}

/* ---------- colours ---------- */

function makeColorMixer(THREE, materials) {
  const cache = {};
  const colorsFor = (field) => {
    if (!cache[field]) cache[field] = (PALETTE[field] || PALETTE.ink).map((hex) => new THREE.Color(hex));
    return cache[field];
  };
  return (blend) => {
    const from = colorsFor(blend.from);
    const to = colorsFor(blend.to);
    materials.forEach((m, i) => m.color.copy(from[i]).lerp(to[i], blend.mix));
  };
}

/* ---------- poses on the timeline ---------- */

function registerPoses(film, pose) {
  film.on('built', ({ tl, timings }) => {
    const layout = poseLayout();
    let prev = scenePose(timings[0]?.el, layout) || { ...DEFAULT_POSE };
    Object.assign(pose, prev);
    timings.slice(1).forEach((t) => {
      const next = scenePose(t.el, layout);
      if (!next) return;
      tl.fromTo(pose, { ...prev }, { ...next, duration: t.inDur, ease: 'power2.inOut', immediateRender: false }, t.inStart);
      prev = next;
    });
  });
}

function applyPose(root, pose, aspect, now) {
  const narrow = aspect < CAMERA.NARROW_ASPECT;
  const k = narrow ? CAMERA.NARROW_SCALE : 1;
  root.position.set(pose.x * (narrow ? CAMERA.NARROW_X : 1), pose.y, pose.z);
  root.rotation.set(pose.rx, pose.ry + Math.sin(now * IDLE_SPEED) * IDLE_SWAY, 0);
  root.scale.setScalar(Math.max(0.0001, pose.s * k));
  root.visible = pose.s > 0.001;
}

/* ---------- entry ---------- */

/** Cheap signature of everything a frame depends on except the idle sway. */
function frameKey(pose, blend, aspect) {
  return `${pose.x},${pose.y},${pose.z},${pose.rx},${pose.ry},${pose.s},${blend.from},${blend.to},${blend.mix},${aspect}`;
}

function createRenderer(THREE, canvas) {
  const low = lowPower();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? DPR_LOW : DPR_MAX));
  return renderer;
}

/**
 * Staged so no step is a long task: module evaluation, renderer and geometry,
 * then shader compilation (compileAsync uses KHR_parallel_shader_compile where
 * the GPU driver offers it), each in its own task, before the first frame.
 */
async function startGlobe({ film, canvas, pose }) {
  const THREE = await import(THREE_URL);
  await yieldToMain();
  const renderer = createRenderer(THREE, canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA.FOV, 1, 0.1, 50);
  camera.position.z = CAMERA.Z;
  await yieldToMain();
  const { root, materials } = buildGlobe(THREE);
  scene.add(root);
  const mixColors = makeColorMixer(THREE, materials);
  await yieldToMain();
  await renderer.compileAsync(scene, camera);
  await yieldToMain();
  let lastKey = '';
  let lastRender = 0;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    lastKey = '';
  }

  function render(now) {
    applyPose(root, pose, camera.aspect, now);
    mixColors(film.blend());
    renderer.render(scene, camera);
    lastRender = now;
  }

  resize();
  if (!film.enabled) {
    window.addEventListener('resize', () => { resize(); render(0); });
    Object.assign(pose, { x: 0, y: 0 }); // flow mode: centred in its own box in the first section
    film.on('field', () => render(0));
    render(0);
    return;
  }
  const loop = createLoop((now) => {
    const key = frameKey(pose, film.blend(), camera.aspect);
    const changed = key !== lastKey;
    if (changed || now - lastRender >= IDLE_FRAME_MS) render(now);
    lastKey = key;
    return pose.s > 0.001 || changed;
  });
  window.addEventListener('resize', () => { resize(); loop.wake(); });
  film.on('progress', loop.wake);
  loop.wake();
}

/**
 * Start the globe. Never throws. Poses are registered at once (the film may
 * build before three.js arrives); three.js itself loads on idle after first
 * paint. Save-Data, no WebGL or a failed import → the static SVG globe, and
 * html gets .globe-lite (plus .no-webgl when WebGL itself is missing).
 */
export function initGlobe({ film, stage = document.querySelector('.stage') } = {}) {
  const canvas = ensureCanvas(stage);
  if (!canvas) return Promise.resolve(false);
  const pose = { ...(scenePose(film.scenes[0]) || DEFAULT_POSE) };
  if (film.enabled) registerPoses(film, pose);
  else film.scenes[0]?.prepend(canvas); // flow mode: static globe behind the opening section
  const html = document.documentElement;
  const fallback = (noWebgl) => {
    html.classList.add('globe-lite');
    if (noWebgl) html.classList.add('no-webgl');
    startFallback({ film, canvas, pose, camera: CAMERA });
    return false;
  };
  if (saveData()) return Promise.resolve(fallback(false));
  /* After the film's first build (the page comes first), when the browser is idle. */
  return new Promise((resolve) => film.ready.finally(() => onIdle(() => {
    if (!webglAvailable()) {
      resolve(fallback(true));
      return;
    }
    startGlobe({ film, canvas, pose }).then(() => resolve(true), () => resolve(fallback(true)));
  })));
}
