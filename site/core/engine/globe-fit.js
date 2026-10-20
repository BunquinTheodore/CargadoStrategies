/**
 * Globe placement from layout (R4 shared.md §6.7, api.md §17.7; moved out of
 * story.js, home H7). Every scene that shows the globe marks an empty box with
 * [data-globe-anchor]; on each 'build' the box becomes that scene's pose, so
 * the globe always sits in reserved space and never covers text.
 *
 *   film.on('build', createPoseFitter({ onlyAnchored: true }));
 *
 * - data-pose ("x,y,z,rx,ry,s", the Round 4 pose units, kept for story.js and
 *   any code that still reads them) and data-globe-box ("cx,cy,r" in viewport
 *   px, for the 2D dot-globe) are written on the scene.
 * - onlyAnchored: true fits only the scenes that contain an anchor. A hidden
 *   anchor (or one below the fold) gives scale 0 at that scene's pose x and y.
 * - Rotation comes from data-globe="rx,ry".
 * - Measured with offset* values relative to the scene, never with
 *   getBoundingClientRect: the cut's transforms on the pan would skew a rect.
 *   Scenes are one viewport tall in every mode, so scene space is screen space.
 */

/** The Round 4 camera, kept so pose units stay compatible (was globe.js CAMERA). */
export const CAMERA = Object.freeze({ FOV: 30, Z: 7, NARROW_ASPECT: 0.9, NARROW_X: 0.3, NARROW_SCALE: 0.78 });
const HALF_HEIGHT_WORLD = Math.tan(((CAMERA.FOV / 2) * Math.PI) / 180) * CAMERA.Z;
const GLOBE_RADIUS = 1.08; // sphere radius 1 plus the lift of the arcs
const MIN_ANCHOR_PX = 24;
const FOLD_TOLERANCE_PX = 8;
const POSE_DECIMALS = 3;
const BOX_DECIMALS = 1;

function parseRotation(value) {
  const [rx = 0, ry = 0] = String(value || '').split(',').map(Number);
  return { rx: Number.isFinite(rx) ? rx : 0, ry: Number.isFinite(ry) ? ry : 0 };
}

/** The anchor's layout box relative to its scene (transform-free), or null when it is not rendered. */
export function anchorRect(anchor, sceneEl = anchor?.closest('.scene')) {
  if (!anchor || !sceneEl || !anchor.offsetParent && getComputedStyle(anchor).position !== 'fixed') return null;
  let left = 0;
  let top = 0;
  let el = anchor;
  while (el && el !== sceneEl) {
    left += el.offsetLeft;
    top += el.offsetTop;
    const parent = el.offsetParent;
    if (!parent || parent === document.body) break;
    if (!sceneEl.contains(parent)) { left -= sceneEl.offsetLeft; top -= sceneEl.offsetTop; break; }
    el = parent;
  }
  return { left, top, width: anchor.offsetWidth, height: anchor.offsetHeight };
}

/** A screen-space rect → the globe's centre and radius in px, or null below the fold or when too small. */
export function boxFromRect(rect, viewport = { width: window.innerWidth, height: window.innerHeight }) {
  if (!rect || rect.width < MIN_ANCHOR_PX || rect.height < MIN_ANCHOR_PX) return null;
  const r = Math.min(rect.width, rect.height) / 2;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  if (cy + r > viewport.height + FOLD_TOLERANCE_PX) return null;
  return { cx, cy, r };
}

/** Screen rect → globe position and scale in pose units (undoing the narrow-screen factors). */
export function placeFromRect(rect, viewport = { width: window.innerWidth, height: window.innerHeight }) {
  const box = boxFromRect(rect, viewport);
  if (!box) return null;
  const { width, height } = viewport;
  const unit = (2 * HALF_HEIGHT_WORLD) / height;
  const narrow = width / height < CAMERA.NARROW_ASPECT;
  return {
    x: ((box.cx - width / 2) * unit) / (narrow ? CAMERA.NARROW_X : 1),
    y: -(box.cy - height / 2) * unit,
    s: (box.r * unit) / GLOBE_RADIUS / (narrow ? CAMERA.NARROW_SCALE : 1),
  };
}

const formatPose = ({ x, y, rx, ry, s }) => [x, y, 0, rx, ry, s].map((n) => Number(n.toFixed(POSE_DECIMALS))).join(',');
const formatBox = ({ cx, cy, r }) => [cx, cy, r].map((n) => Number(n.toFixed(BOX_DECIMALS))).join(',');
const poseXY = (value) => {
  const [x = 0, y = 0] = String(value || '').split(',').map(Number);
  return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
};

export function createPoseFitter({ onlyAnchored = false } = {}) {
  let last = { x: 0, y: 0 };
  return function fitPose({ sceneEl, index }) {
    if (index === 0) last = { x: 0, y: 0 };
    const anchor = sceneEl.querySelector('[data-globe-anchor]');
    if (!anchor && onlyAnchored) return;
    const viewport = { width: sceneEl.clientWidth || window.innerWidth, height: sceneEl.clientHeight || window.innerHeight };
    const rect = anchor ? anchorRect(anchor, sceneEl) : null;
    const box = boxFromRect(rect, viewport);
    const place = placeFromRect(rect, viewport);
    const fallback = onlyAnchored ? poseXY(sceneEl.dataset.pose) : last;
    const pose = { ...(place || { x: fallback.x, y: fallback.y, s: 0 }), ...parseRotation(sceneEl.dataset.globe) };
    sceneEl.dataset.pose = formatPose(pose);
    if (box) sceneEl.dataset.globeBox = formatBox(box);
    else delete sceneEl.dataset.globeBox;
    last = pose;
  };
}
