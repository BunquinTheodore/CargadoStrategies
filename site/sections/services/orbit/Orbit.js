/**
 * S1 #orbit (v2 spec §6.3): the services orbit, the first scene of Services. The ring is
 * core/ui/ui-orbit.js (hover/focus preview, touch tap-to-preview, arrow keys); its nodes are
 * same-page #links, so the film's own click handler cuts to each detail scene. The cut into the
 * scene draws the shared C/W mark (core/engine/mark-draw.js). This is not a ring-mode globe
 * scene, so the mark always takes the poster timings and is drawn by 'settled'.
 */
import { Section } from '../../../core/Section.js';
import { ORBIT_GROUPS } from '../../../assets/js/config.js';
import { createOrbit } from '../../../core/ui/ui-orbit.js';
import { MARK_PARTS, drawMark } from '../../../core/engine/mark-draw.js';

export class Orbit extends Section {
  static id = 'orbit';

  mount() {
    this.orbit = createOrbit(this.el.querySelector('.orbit'), ORBIT_GROUPS, { film: this.film });
  }

  /** Only the cut into #orbit draws the mark. */
  cut(event) {
    if (event.toEl?.id === Orbit.id) drawMark({ ...event, poster: true, parts: MARK_PARTS });
  }

  leave() {
    this.orbit?.hide();
  }

  destroy() {
    this.orbit?.destroy();
  }
}
