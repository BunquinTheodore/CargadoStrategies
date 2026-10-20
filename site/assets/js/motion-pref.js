/**
 * Motion preference: the operating system setting, overridden by the visitor's
 * own choice from the footer switch (C37), stored in localStorage['cs-motion'].
 * Reduced motion means flow mode: no cuts, crossfades of 200 ms, posters, no
 * drift. The inline head script reads the same key before first paint, so the
 * mode never flips after load.
 */
export const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
export const MOTION_KEY = 'cs-motion'; // 'full' | 'reduced'

const CHOICES = new Set(['full', 'reduced']);

/** True when the operating system asks for reduced motion (the stored choice is ignored). */
export function osReducedMotion() {
  return window.matchMedia?.(REDUCE_QUERY).matches ?? false;
}

/** The stored choice: 'full', 'reduced', or null when unset or storage is blocked. */
export function motionPref() {
  try {
    const value = localStorage.getItem(MOTION_KEY);
    return CHOICES.has(value) ? value : null;
  } catch {
    return null; // private mode or blocked storage: the OS setting decides
  }
}

/** Reduced motion is on: a stored choice wins over the OS setting when it is set. */
export function prefersReducedMotion() {
  const pref = motionPref();
  return pref ? pref === 'reduced' : osReducedMotion();
}

/**
 * Store the visitor's choice and reload (the mode is decided once per load),
 * keeping the hash so they land on the scene they were reading.
 */
export function setMotionPref(value) {
  if (!CHOICES.has(value)) throw new TypeError(`setMotionPref: expected 'full' or 'reduced', got ${value}`);
  try {
    localStorage.setItem(MOTION_KEY, value);
  } catch {
    return false; // storage blocked: the choice cannot persist, so do not reload into the same mode
  }
  location.reload();
  return true;
}
