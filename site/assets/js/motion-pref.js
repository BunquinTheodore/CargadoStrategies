/**
 * The visitor's own "pause animation" choice (WCAG 2.2.2). Paused means flow
 * mode: no film, no star field, no grain and a still globe, exactly as with
 * the operating system's reduced-motion setting.
 *
 * Kept in localStorage under STORAGE_KEY. If storage is blocked the choice
 * travels in the URL instead (?motion=off). The inline script in every page's
 * <head> reads both before first paint, so keep the key and value in sync.
 */
const STORAGE_KEY = 'cs-motion';
const PAUSED_VALUE = 'off';
const QUERY_KEY = 'motion';
const FOCUS_KEY = 'cs-motion-focus'; // sessionStorage: put focus back on the toggle after the reload

function readStorage(store, key) {
  try {
    return window[store].getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(store, key, value) {
  try {
    if (value === null) window[store].removeItem(key);
    else window[store].setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

const pausedInUrl = () => new URLSearchParams(location.search).get(QUERY_KEY) === PAUSED_VALUE;

/** True when the visitor has paused the animation on this site. */
export function motionPaused() {
  return pausedInUrl() || readStorage('localStorage', STORAGE_KEY) === PAUSED_VALUE;
}

/** The URL to reload after a change: drops or adds ?motion=off, keeps the #scene. */
function reloadUrl(paused, stored) {
  const url = new URL(location.href);
  if (paused && !stored) url.searchParams.set(QUERY_KEY, PAUSED_VALUE);
  else url.searchParams.delete(QUERY_KEY);
  return url.href;
}

/**
 * Save the choice and reload into the matching mode, landing on `sceneId`.
 * The film and flow layouts differ too much to swap without a reload.
 */
export function applyMotionChoice(paused, { sceneId = '' } = {}) {
  const stored = writeStorage('localStorage', STORAGE_KEY, paused ? PAUSED_VALUE : null);
  writeStorage('sessionStorage', FOCUS_KEY, '1');
  const url = new URL(reloadUrl(paused, stored));
  if (sceneId) url.hash = sceneId;
  location.replace(url.href);
  if (url.pathname !== location.pathname || url.search !== location.search) return; // a full navigation
  // Same document: only the #hash changed. The film's scroll position means nothing in the other
  // mode, so stop the browser restoring it (set after replace(), which starts a fresh history entry).
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  location.reload();
}

/** True once after a toggle-triggered reload (and forgets it). */
export function takeFocusReturn() {
  const pending = readStorage('sessionStorage', FOCUS_KEY) === '1';
  if (pending) writeStorage('sessionStorage', FOCUS_KEY, null);
  return pending;
}
