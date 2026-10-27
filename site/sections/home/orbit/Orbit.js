/**
 * H1b · Orbit (v2 spec §6.3): the Cargado mark in the centre, the ten service groups round it.
 * core/ui/ui-orbit.js wires the ring (previews, touch, keys); the static node links in the
 * markup work without it. The mark draws on the cut into this scene with the shared draw
 * (core/engine/mark-draw.js), on its short poster timings: no globe ring leads it here.
 */
import { Section } from '../../../core/Section.js';
import { createOrbit } from '../../../core/ui/ui-orbit.js';
import { drawMark, MARK_PARTS } from '../../../core/engine/mark-draw.js';
import { ORBIT_GROUPS } from '../../../assets/js/config.js';

export class Orbit extends Section {
  static id = 'orbit';

  mount() {
    const root = this.el.querySelector('.orbit');
    this.orbit = root ? createOrbit(root, ORBIT_GROUPS, { film: this.film }) : null;
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
