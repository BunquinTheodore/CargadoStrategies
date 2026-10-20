/**
 * H1 · Hero (W1). The engine plays the words and the stop, dotglobe the globe;
 * the section adds only the CTA sheen, once, on the first landing.
 */

import { Section } from '../../../core/Section.js';

const SHEEN_CLASS = 'is-sheen';

export class Hero extends Section {
  static id = 'hero';

  /** W1: the sheen plays only when the first landing of the visit is this scene, on load. */
  mount() {
    const cta = this.el.querySelector('.hero__cta');
    const { film } = this;
    if (!cta || film.mode === 'flow') return;
    const off = film.on('landed', ({ id, cause }) => {
      off();
      if (id !== 'hero' || cause !== 'load') return;
      cta.classList.add(SHEEN_CLASS);
      cta.addEventListener('animationend', () => cta.classList.remove(SHEEN_CLASS), { once: true });
    });
  }
}
