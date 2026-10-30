/**
 * H1b · Orbit (v2 spec §6.3): the Cargado logo in the centre, the ten service groups round it.
 * core/ui/ui-orbit.js wires the ring (previews, touch, keys); the static node links in the
 * markup work without it. The centre is the header's logo image (owner, 2026-10-30), which
 * fades and settles in on the cut into this scene.
 */
import { Section } from '../../../core/Section.js';
import { createOrbit } from '../../../core/ui/ui-orbit.js';
import { ORBIT_GROUPS } from '../../../assets/js/config.js';

/** The logo's arrival on the cut, in seconds after the 'in' label. */
const LOGO_IN = Object.freeze({ scaleFrom: 0.94, duration: 0.6 });

export class Orbit extends Section {
  static id = 'orbit';

  mount() {
    const root = this.el.querySelector('.orbit');
    this.orbit = root ? createOrbit(root, ORBIT_GROUPS, { film: this.film }) : null;
  }

  /** Only the cut into #orbit brings the logo in. */
  cut({ tl, toEl }) {
    const logo = toEl?.id === Orbit.id ? toEl.querySelector('.mark__logo') : null;
    if (!tl || !logo) return;
    tl.fromTo(logo, { opacity: 0, scale: LOGO_IN.scaleFrom }, { opacity: 1, scale: 1, duration: LOGO_IN.duration, ease: 'expo.out' }, 'in');
  }

  leave() {
    this.orbit?.hide();
  }

  destroy() {
    this.orbit?.destroy();
  }
}
