/**
 * Focus helper (R4 shared.md §6.6, api.md §17.6).
 *
 *   focusInScene(el, { film, afterLayout })
 *
 * Cut mode: focus without scrolling; the engine's focusin handler cuts to the
 * element's scene (cause 'focus'). Touch-cut and flow mode: focus without
 * scrolling, then scroll the element's *scene* into place if it is not the
 * snapped one. Never scrolls an inner element (partners §4). `afterLayout`
 * waits one frame (two in Safari) so freshly shown content has a box.
 * Returns a promise that resolves once focus has moved.
 */

const SNAP_TOLERANCE_PX = 1;
const isSafari = () => /^((?!chrome|chromium|android).)*safari/i.test(navigator.userAgent);
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/** True when the film plays cuts in a fixed stage (no document scroll to fix). */
function isCutMode(film) {
  if (film && typeof film.mode === 'string') return film.mode === 'cut';
  return document.documentElement.classList.contains('film');
}

function focusNow(el, film) {
  el.focus({ preventScroll: true });
  if (isCutMode(film)) return;
  const scene = el.closest('section.scene');
  if (!scene) return;
  if (Math.abs(scene.getBoundingClientRect().top) > SNAP_TOLERANCE_PX) scene.scrollIntoView({ block: 'start' });
}

export async function focusInScene(el, { film, afterLayout = false } = {}) {
  if (!el || typeof el.focus !== 'function') return;
  if (afterLayout) {
    await nextFrame();
    if (isSafari()) await nextFrame();
  }
  if (!el.isConnected) return;
  focusNow(el, film);
}
