/**
 * S1 #orbit (v2 spec §6.3): the services orbit, the first scene of Services. The ring is
 * core/ui/ui-orbit.js (hover/focus preview, touch tap-to-preview, arrow keys); its nodes are
 * same-page #links, so the film's own click handler cuts to each detail scene. The cut into the
 * scene brings in the centre logo, the header's logo image (owner, 2026-10-30), with the
 * shared orbitLogoIn.
 */
import { Section } from '../../../core/Section.js';
import { ORBIT_GROUPS } from '../../../assets/js/config.js';
import { createOrbit, orbitLogoIn } from '../../../core/ui/ui-orbit.js';

export class Orbit extends Section {
  static id = 'orbit';

  mount() {
    this.orbit = createOrbit(this.el.querySelector('.orbit'), ORBIT_GROUPS, { film: this.film });
  }

  /** Only the cut into #orbit brings the logo in. */
  cut(event) {
    if (event.toEl?.id === Orbit.id) orbitLogoIn(event);
  }

  leave() {
    this.orbit?.hide();
  }

  destroy() {
    this.orbit?.destroy();
  }
}
