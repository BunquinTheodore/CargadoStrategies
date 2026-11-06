/**
 * H1b · Orbit (v2 spec §6.3): the Cargado logo in the centre, the ten service groups round it.
 * core/ui/ui-orbit.js wires the ring (previews, touch, keys); the static node links in the
 * markup work without it. The centre is the header's logo image (owner, 2026-10-30), which
 * sits still (no logo-in: client 2026-11-07, calm).
 */
import { Section } from '../../../core/Section.js';
import { createOrbit } from '../../../core/ui/ui-orbit.js';
import { ORBIT_GROUPS } from '../../../assets/js/config.js';

export class Orbit extends Section {
  static id = 'orbit';

  mount() {
    const root = this.el.querySelector('.orbit');
    this.orbit = root ? createOrbit(root, ORBIT_GROUPS, { film: this.film }) : null;
  }

  leave() {
    this.orbit?.hide();
  }

  destroy() {
    this.orbit?.destroy();
  }
}
