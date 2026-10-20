/**
 * Device tiers (DIRECTION §3): html[data-tier] = 'A' | 'B' | 'C'.
 *
 * The inline head script writes the first guess before first paint (Save-Data
 * or ≤ 2 GB → C, coarse pointer → B, else A); legal.html locks C with
 * data-tier-lock. initTier() reads it (or writes it when the head script did
 * not run), and sampleTier(film.ready) watches two windows of 90 frames once,
 * 1.5 s after the first landing: a p75 frame time above 22 ms in both
 * downgrades to C. A tier only ever goes
 * down, at most once per load. Reduced motion (html.rm) sits on top of any
 * tier and never changes data-tier.
 */

const TIERS = ['A', 'B', 'C'];
const LOW_MEMORY_GB = 2;
const SAMPLE_FRAMES = 90;
const SLOW_P75_MS = 22;
const SAMPLE_WINDOWS = 2; // every window must be slow: one busy moment never downgrades
const SAMPLE_DELAY_MS = 1500; // after the first landing: the hero arc (≈ 0.9 s) and the splash hand-off are over
const HIDDEN_GAP_MS = 250; // a frame gap this long means the tab was hidden or throttled: not a slow device
const LOCK_ATTR = 'data-tier-lock';

const CONFIG = Object.freeze({
  A: Object.freeze({
    globe: 'dots', globePoints: 900, dpr: 1.5, halo: true, idleSpin: true, stars: 180, starDrift: true,
    grain: 'tile', grainJitter: true, iris: 'circle', headerBlur: true,
  }),
  B: Object.freeze({
    globe: 'dots', globePoints: 520, dpr: 1, halo: false, idleSpin: false, stars: 110, starDrift: false,
    grain: 'tile', grainJitter: false, iris: 'circle', headerBlur: false,
  }),
  C: Object.freeze({
    globe: 'poster', globePoints: 0, dpr: 1, halo: false, idleSpin: false, stars: 0, starDrift: false,
    grain: 'none', grainJitter: false, iris: 'fade', headerBlur: false,
  }),
});

const html = document.documentElement;
const listeners = new Set();
let current = null;
let changed = false;
let sampling = false;

const mm = (query) => !!window.matchMedia?.(query).matches;
const coarsePointer = () => mm('(pointer: coarse)') && !mm('(hover: hover) and (pointer: fine)');

/** The head script's rule, for pages where it did not run. */
function guessTier() {
  const connection = navigator.connection;
  const memory = navigator.deviceMemory;
  if (connection?.saveData || (Number.isFinite(memory) && memory <= LOW_MEMORY_GB)) return 'C';
  return coarsePointer() ? 'B' : 'A';
}

/** Read the tier the head script wrote (writing it when missing or invalid). */
export function initTier() {
  if (current) return current;
  const written = html.getAttribute('data-tier');
  current = TIERS.includes(written) ? written : html.hasAttribute(LOCK_ATTR) ? 'C' : guessTier();
  html.setAttribute('data-tier', current);
  return current;
}

export function getTier() {
  return current || initTier();
}

/** The DIRECTION §3 row for a tier (frozen). */
export function tierConfig(tier = getTier()) {
  return CONFIG[tier] || CONFIG.C;
}

/** cb({ tier, from }) when the frame sample downgrades the tier (at most once per load). Returns unsubscribe. */
export function onTierChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setTier(tier) {
  const from = getTier();
  if (tier === from || changed) return;
  changed = true;
  current = tier;
  html.setAttribute('data-tier', tier);
  listeners.forEach((cb) => {
    try {
      cb({ tier, from });
    } catch (err) {
      setTimeout(() => { throw err; }); // one failing listener never stops the others
    }
  });
}

const p75 = (values) => {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.75)] ?? 0;
};

/**
 * Once, SAMPLE_DELAY_MS after `after` resolves (the film's first landing, so
 * the hero arc and the splash hand-off are not measured), sample
 * SAMPLE_WINDOWS windows of SAMPLE_FRAMES frames; downgrade to C only when
 * the p75 frame time is above SLOW_P75_MS in every window (a sustained slow
 * device, not one busy second). Hidden or locked pages are not sampled.
 */
export function sampleTier(after = Promise.resolve()) {
  if (sampling) return;
  sampling = true;
  const skip = () => getTier() === 'C' || html.hasAttribute(LOCK_ATTR) || document.hidden;
  Promise.resolve(after).then(() => setTimeout(() => {
    if (skip()) return;
    let gaps = [];
    let windows = 0;
    let last = 0;
    const frame = (now) => {
      if (document.hidden) return; // stop for good: a hidden tab says nothing about the device
      if (last && now - last < HIDDEN_GAP_MS) gaps.push(now - last);
      last = now;
      if (gaps.length < SAMPLE_FRAMES) {
        requestAnimationFrame(frame);
        return;
      }
      if (p75(gaps) <= SLOW_P75_MS) return; // a fast window: the tier stays
      windows += 1;
      gaps = [];
      if (windows >= SAMPLE_WINDOWS) setTier('C');
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, SAMPLE_DELAY_MS), () => {}); // a failed film start is reported by the film itself
}
