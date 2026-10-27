/**
 * The three.js motifs of the Services own scenes (S5a-S5e, owner 2026-10-25):
 * one small Section class per scene, in the page chunk. All the WebGL work
 * (three itself, the shared renderer, the loop, the pointer) lives in
 * own-3d-stage.js, a lazy chunk imported only when one of these scenes is
 * about to show: a cut toward it, a landing on a neighbour, or a landing on
 * it (a deep link). Tier C and Save-Data never load it.
 *
 *   enter  the stage moves its one canvas into this scene's box and plays
 *   leave  the stage parks (only if this scene still holds it)
 */
import { Section } from '../../core/Section.js';
import { getTier, onTierChange } from '../../core/engine/tier.js';
import { saveData } from '../../core/engine/perf.js';
import { OWN_3D_IDS, renderMode } from './own-3d-config.js';

/** The lazy stage chunk (build.mjs bundles a dynamic import of a relative constant as its own chunk). */
const STAGE_MODULE = './own-3d-stage.js';
/** A landing this many scenes away (or closer) starts loading the stage. */
const PREFETCH_REACH = 1;

let stagePromise = null;

/** The shared stage, loaded once (null when WebGL is unavailable). */
function loadStage(mode) {
  stagePromise ||= import(STAGE_MODULE).then(({ createStage }) => createStage({ mode, tier: getTier() }));
  return stagePromise;
}

/** True when at least one of the scene's motif slots is shown (phones hide the busier ones). */
const hasShownSlot = (sceneEl) => Array.from(sceneEl.querySelectorAll('[data-own-3d-view]'))
  .some((slot) => getComputedStyle(slot).display !== 'none');

const currentMode = () => renderMode({
  tier: getTier(),
  saveData: saveData(),
  reduced: document.documentElement.classList.contains('rm'),
});

export class Own3D extends Section {
  mount() {
    this.box = this.el.querySelector('[data-own-3d]');
    this.mode = currentMode();
    if (!this.box || this.mode === 'off') return;
    this.offNear = this.film?.on?.('landed', (event) => this.near(event)) || null;
    this.offTier = onTierChange(({ tier }) => { if (tier === 'C') this.switchOff(); });
  }

  /** A landing next to this scene: fetch the stage before the visitor gets here. */
  near({ index }) {
    const mine = this.film?.scenes?.indexOf(this.el) ?? -1;
    if (mine >= 0 && Math.abs(index - mine) <= PREFETCH_REACH) this.prefetch();
  }

  /** Loads the stage, unless this scene shows no motif at this size (then three never loads for it). */
  prefetch() {
    if (this.mode === 'off' || !hasShownSlot(this.el)) return null;
    return loadStage(this.mode).catch((err) => {
      console.error(`section #${this.constructor.id}: the 3D stage failed to load`, err);
      return null;
    });
  }

  cut({ toEl }) {
    if (this.owns(toEl)) this.prefetch();
  }

  enter() {
    this.prefetch()?.then((stage) => {
      if (stage && this.active && this.mode !== 'off') stage.show(this.el, this.box);
    });
  }

  leave() {
    stagePromise?.then((stage) => stage?.hide(this.el), () => {});
  }

  /** The tier fell to C mid-visit: stop and drop the canvas for good. */
  switchOff() {
    this.mode = 'off';
    stagePromise?.then((stage) => stage?.dispose(), () => {});
  }

  destroy() {
    this.offNear?.();
    this.offTier?.();
    this.leave();
  }
}

/** One Own3D subclass per own scene (static id set), appended after the page's other sections. */
export const OWN_3D_SECTIONS = OWN_3D_IDS.map((id) => class extends Own3D {
  static id = id;
});
