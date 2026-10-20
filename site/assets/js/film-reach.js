/**
 * Keyboard reach (R4 shared.md §7.1), cut mode only.
 *
 * The current scene, its neighbours and the nearest scene in each direction
 * that has something focusable keep their controls in the Tab order, so Tab
 * can always move on, even past scenes with no links. The scene holding focus
 * counts as a centre too, so a fast second Tab never runs out of road.
 * Controls in far scenes are only "parked" (tabindex -1, the original kept in
 * data-film-tab, '' = it had none): every scene stays in the accessibility
 * tree, so a screen reader's browse mode reads the whole page, and focusing
 * anything there cuts the film to it.
 */

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';
export const PARKED = 'data-film-tab';
const REACHABLE_CLASS = 'is-reachable';

/** True when the scene holds at least one element Tab can land on (rendered, enabled, tabindex ≥ 0 or parked). */
function hasFocusable(scene) {
  return Array.from(scene.querySelectorAll(FOCUSABLE)).some(
    (el) => (el.hasAttribute(PARKED) || el.tabIndex >= 0) && !el.disabled && el.getClientRects().length > 0,
  );
}

/** Take a far scene's controls out of the Tab order, remembering each one's own tabindex. */
function parkControls(scene) {
  scene.querySelectorAll(FOCUSABLE).forEach((el) => {
    if (el.hasAttribute(PARKED) || el.tabIndex < 0) return;
    el.setAttribute(PARKED, el.getAttribute('tabindex') ?? '');
    el.setAttribute('tabindex', '-1');
  });
}

/** Put parked controls back with the tabindex they had. */
function unparkControls(scene) {
  scene.querySelectorAll(`[${PARKED}]`).forEach((el) => {
    const original = el.getAttribute(PARKED);
    el.removeAttribute(PARKED);
    if (original === '') el.removeAttribute('tabindex');
    else el.setAttribute('tabindex', original);
  });
}

export function createReach(scenes) {
  let open = new Set(scenes.map((_, i) => i));
  // Which scenes hold a rendered control: read at build, on rebuilds and on
  // content changes (refresh), never inside a cut (the read needs layout).
  let focusable = scenes.map(() => true);
  const indexOf = (node) => {
    const scene = node?.closest?.('.scene');
    return scene ? scenes.indexOf(scene) : -1;
  };

  function nearestFocusable(from, step) {
    for (let i = from + step; i >= 0 && i < scenes.length; i += step) {
      if (focusable[i]) return i;
    }
    return -1;
  }

  const reachFrom = (center) => [center - 1, center, center + 1, nearestFocusable(center, -1), nearestFocusable(center, 1)];

  /** Re-run the reach set around `current` and the focused element's scene. */
  function update(current) {
    const centers = [current, indexOf(document.activeElement)].filter((i) => i >= 0);
    open = new Set(centers.flatMap(reachFrom));
    scenes.forEach((el, i) => {
      if (open.has(i)) unparkControls(el);
      else parkControls(el);
      el.classList.toggle(REACHABLE_CLASS, open.has(i));
    });
  }

  /** True when el's scene is outside the reach set (its controls are parked). */
  function isParked(el) {
    const i = indexOf(el);
    return i >= 0 && !open.has(i);
  }

  /** Flow and touch-cut: everything is in the Tab order again. */
  function release() {
    open = new Set(scenes.map((_, i) => i));
    scenes.forEach((el) => {
      unparkControls(el);
      el.classList.add(REACHABLE_CLASS);
    });
  }

  /** Read every scene's focusable flag again (a layout read: call it outside cuts). */
  function refresh() {
    focusable = scenes.map(hasFocusable);
  }

  return { update, refresh, isParked, release, indexOf };
}
