/**
 * The Services own-scene motifs (S5a-S5e, owner 2026-10-25): which three.js
 * motif fills each scene's empty half, and how much rendering a device gets.
 * Pure data and functions (no DOM, no three), shared by own-3d.js (the scene
 * classes in the page chunk) and own-3d-stage.js (the lazy WebGL stage), and
 * read by tests/own-3d.test.mjs.
 *
 * Each scene names its motifs in its markup: `[data-own-3d]` is the canvas box
 * (decorative, aria-hidden, data-fit-ignore) and every `[data-own-3d-view="…"]`
 * slot inside the scene is one viewport of the shared renderer, placed by CSS
 * (_own.css) where the scene has room.
 */

/** Scene id → the motifs its slots name, in markup order. */
export const OWN_3D_SCENES = Object.freeze({
  'ours-consultation': Object.freeze(['tiles']),
  'ours-web': Object.freeze(['browser']),
  'ours-creative': Object.freeze(['morph']),
  'ours-software': Object.freeze(['lattice']),
  'ours-contractor': Object.freeze(['house']),
  'ours-health': Object.freeze(['care']),
  'ours-trade': Object.freeze(['globe']),
});

export const OWN_3D_IDS = Object.freeze(Object.keys(OWN_3D_SCENES));

/** Highest canvas pixel ratio on any device (the tier may ask for less). */
export const DPR_CAP = 1.5;

/**
 * How a device renders the motifs:
 *   'off'    Save-Data or tier C: three never loads, the box stays empty
 *   'still'  every other device: one frame on landing, no pointer response (client 2026-11-07,
 *            calm: the continuous motion of owner 2026-10-25 is gone; tier B keeps a pixel ratio of 1).
 *            Reduced motion is still too, so the `reduced` flag callers pass no longer changes the mode.
 */
export function renderMode({ tier = 'A', saveData = false } = {}) {
  if (saveData || tier === 'C') return 'off';
  return 'still';
}

/** The renderer's pixel ratio: the device's, never above the tier's or DPR_CAP. */
export function pixelRatio(deviceDpr = 1, tierDpr = DPR_CAP) {
  const device = Number.isFinite(deviceDpr) && deviceDpr > 0 ? deviceDpr : 1;
  return Math.min(device, tierDpr, DPR_CAP);
}

/** A slot this small (CSS px²) is hidden or squeezed: it gets no viewport. */
export const MIN_VIEW_AREA = 2400;

/** True when a slot rect ({ width, height }) is big enough to render into. */
export const viewFits = (rect) => !!rect && rect.width * rect.height >= MIN_VIEW_AREA;
