/**
 * The Story building's WebGL stage (lazy chunk; only Building.js imports it,
 * on idle). One renderer and one canvas for the whole page; it draws a frame
 * only when the controller asks (a cut's pose tween, a #values row pick, the
 * pointer sway, a resize), so a still scene, a hidden tab or a scene without
 * the building costs nothing. A pose with o = 0 hides the canvas and skips the
 * draw.
 *
 * Dev (site/) loads three from jsDelivr; build.mjs maps the same URL to the
 * pinned npm copy (package.json), bundled into this chunk.
 */
import {
  ACESFilmicToneMapping, AmbientLight, BackSide, BoxGeometry, BufferGeometry, Color, DirectionalLight, DoubleSide,
  EdgesGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, PMREMGenerator, PerspectiveCamera, PlaneGeometry, Scene, Vector3, WebGLRenderer,
} from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';
import { tierConfig } from '../../../core/engine/tier.js';
import { EXPLODE, PARTS, isVisible, pixelRatio, placement, quality } from './building-plan.js';
import { GLOW_GAIN, buildBuilding } from './building-model.js';

/** The parts the model builds with (building-model.js THREE_NEEDS; a test keeps the two equal). */
const T = Object.freeze({
  BoxGeometry, BufferGeometry, Color, EdgesGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments,
  Mesh, MeshStandardMaterial, Vector3,
});

const CAMERA = Object.freeze({ fovDeg: 24, distance: 20, near: 1, far: 60 });
const EXPOSURE = 1.1;
const ENV_BLUR = 0.04;
const WARM = 0xfff3dc;
const GOLD = 0xd4af37;
const CANVAS_CLASS = 'story-building';

/** A WebGL2 context for the renderer, or null (three needs WebGL2; no context = no building). */
function makeContext(canvas, antialias) {
  try {
    return canvas.getContext('webgl2', { alpha: true, antialias, depth: true, stencil: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
}

/** A tiny studio for the metal to reflect: a dark room, a warm softbox above, gold strips at the sides. */
function makeEnvironment(renderer) {
  const room = new Scene();
  room.add(new Mesh(new BoxGeometry(40, 40, 40), new MeshBasicMaterial({ color: 0x08080a, side: BackSide })));
  const panel = (w, h, pos, color, strength) => {
    const mesh = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(strength), side: DoubleSide }));
    mesh.position.set(...pos);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
  };
  panel(22, 5, [0, 14, 6], WARM, 4);       // the top softbox
  panel(3, 14, [-14, 2, 5], WARM, 2.2);    // a left strip
  panel(3, 12, [13, 0, -8], GOLD, 2.6);    // the gold rim strip
  panel(18, 2, [0, -10, 4], WARM, 0.5);    // the floor bounce
  const pmrem = new PMREMGenerator(renderer);
  const texture = pmrem.fromScene(room, ENV_BLUR).texture;
  pmrem.dispose();
  room.traverse((obj) => {
    obj.geometry?.dispose();
    obj.material?.dispose();
  });
  return texture;
}

function makeLights(scene) {
  const key = new DirectionalLight(WARM, 1.6);
  key.position.set(-5, 8, 8);
  const rim = new DirectionalLight(GOLD, 1.1);
  rim.position.set(6, 3, -6);
  scene.add(key, rim, new AmbientLight(0xffffff, 0.14));
}

/** → the stage, or null when this device has no WebGL2. */
export function createStage({ tier }) {
  const canvas = document.createElement('canvas');
  canvas.className = CANVAS_CLASS;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('data-fit-ignore', '');
  const context = makeContext(canvas, tier === 'A');
  if (!context) return null;
  const renderer = new WebGLRenderer({ canvas, context, alpha: true });
  // The shaders are three's own; skip the info-log read, which on Windows (ANGLE / D3D)
  // echoes harmless precision notes (X4122) as console warnings and costs a sync GPU read.
  renderer.debug.checkShaderErrors = false;
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.setPixelRatio(pixelRatio(window.devicePixelRatio, tierConfig(tier).dpr));

  const scene = new Scene();
  scene.environment = makeEnvironment(renderer);
  makeLights(scene);
  const camera = new PerspectiveCamera(CAMERA.fovDeg, 1, CAMERA.near, CAMERA.far);
  camera.position.set(0, 0, CAMERA.distance);
  const building = buildBuilding(T, { detail: quality(tier) });
  scene.add(building.root);

  let size = { width: 0, height: 0 };
  let disposed = false;

  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height || (width === size.width && height === size.height)) return;
    size = { width, height };
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function pose(state, glow, sway) {
    const { px, py, s } = placement(state, { aspect: camera.aspect, ...CAMERA });
    const { root } = building;
    root.position.set(px, py, 0);
    root.rotation.set(state.rx + sway.y, state.ry + sway.x, 0);
    root.scale.setScalar(s);
    PARTS.forEach((name) => {
      const { group, mats } = building.parts[name];
      const lift = state.lift[name];
      const [ex, ey, ez] = EXPLODE[name];
      group.position.set(ex * lift, ey * lift, ez * lift);
      mats.gold.emissiveIntensity = GLOW_GAIN.gold * glow[name];
      mats.glass.emissiveIntensity = GLOW_GAIN.glass * glow[name];
    });
  }

  /** Draw one frame of `state` (a building-plan.js pose) with `glow` (part → 0..1) and `sway` ({ x, y } radians). */
  function draw(state, glow, sway = { x: 0, y: 0 }) {
    if (disposed) return;
    if (!isVisible(state)) {
      canvas.style.visibility = 'hidden';
      return;
    }
    canvas.style.visibility = '';
    canvas.style.opacity = String(Math.min(1, state.o));
    resize();
    if (!size.width) return;
    pose(state, glow, sway);
    renderer.render(scene, camera);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    building.dispose();
    scene.environment?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  // compile the shaders up front, so the first visible frame does not hitch
  renderer.compile(scene, camera);
  return { canvas, draw, resize, dispose, draws: building.draws };
}
