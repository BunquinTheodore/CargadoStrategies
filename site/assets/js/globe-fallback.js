/**
 * Static SVG stand-in for the three.js globe: used with Save-Data (no
 * three.js download) and when WebGL is missing or fails. A gold wire sphere
 * with a few city dots, drawn in currentColor so it follows the field accent.
 * In film mode it follows the same scrubbed pose object as the 3D globe
 * (position and scale only, written on film progress, no loop of its own).
 */

const MERIDIANS = [0.25, 0.55, 0.85];
const PARALLELS = [-0.6, -0.25, 0.25, 0.6];
const DOTS = [[-0.42, -0.28], [-0.2, -0.36], [0.05, -0.3], [0.3, -0.18], [0.48, -0.05], [-0.05, -0.12], [0.18, 0.05]];

function svgMarkup() {
  const meridians = MERIDIANS.map((rx) => `<ellipse cx="0" cy="0" rx="${rx}" ry="1"/>`).join('');
  const parallels = PARALLELS.map((y) => {
    const rx = Math.sqrt(1 - y * y);
    return `<ellipse cx="0" cy="${y}" rx="${rx.toFixed(3)}" ry="${(rx * 0.16).toFixed(3)}"/>`;
  }).join('');
  const dots = DOTS.map(([x, y]) => `<circle class="globe-fallback__dot" cx="${x}" cy="${y}" r="0.025"/>`).join('');
  return `<circle cx="0" cy="0" r="1"/><line x1="-1" y1="0" x2="1" y2="0"/>${meridians}${parallels}${dots}`;
}

/** Screen px per world unit for the globe camera (see globe.js CAMERA). */
function pxPerUnit(camera, height) {
  return height / (2 * camera.Z * Math.tan((camera.FOV * Math.PI) / 360));
}

function place(svg, pose, camera, box) {
  const ppu = pxPerUnit(camera, box.height);
  const narrow = box.width / Math.max(1, box.height) < camera.NARROW_ASPECT;
  const depth = camera.Z / Math.max(0.5, camera.Z - pose.z);
  const x = pose.x * (narrow ? camera.NARROW_X : 1) * ppu * depth;
  const y = -pose.y * ppu * depth;
  const s = Math.max(0, pose.s * (narrow ? camera.NARROW_SCALE : 1) * depth);
  const size = 2 * ppu;
  svg.style.width = `${size}px`;
  svg.style.height = `${size}px`;
  svg.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
  svg.style.visibility = s > 0.001 ? '' : 'hidden';
}

/** Mount the fallback next to the (hidden) canvas and keep it on the film's pose. */
export function startFallback({ film, canvas, pose, camera }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'globe-fallback');
  svg.setAttribute('viewBox', '-1.05 -1.05 2.1 2.1');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = svgMarkup();
  canvas.hidden = true;
  canvas.after(svg);
  if (!film.enabled) return svg; // flow mode: CSS places it in the opening section
  const stage = canvas.parentElement;
  const update = () => place(svg, pose, camera, { width: stage.clientWidth, height: stage.clientHeight });
  film.on('progress', update);
  film.ready?.then(update);
  window.addEventListener('resize', update);
  update();
  return svg;
}
