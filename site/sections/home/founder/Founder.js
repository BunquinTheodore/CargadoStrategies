/**
 * H4 · Founder (W3): the three doors. On phones they are an exclusive
 * accordion (one open). They arrive with the scene's pan (no deal:
 * client 2026-11-07, calm).
 */

import { Section } from '../../../core/Section.js';
import { PHONE_QUERY, qsa } from '../_shared.js';

/* ---------- W3 doors on phones: an exclusive accordion, one open ---------- */

function wireDoors(root) {
  const doors = qsa(root, '.door');
  if (!doors.length) return;
  const phone = window.matchMedia(PHONE_QUERY);
  const setOpen = (door) => {
    doors.forEach((d) => {
      const open = d === door;
      d.classList.toggle('is-open', open);
      d.querySelector('.door__toggle')?.setAttribute('aria-expanded', String(open));
    });
  };
  root.addEventListener('click', (event) => {
    if (!phone.matches) return;
    const door = event.target.closest('.door');
    if (!door || door.classList.contains('is-open') || event.target.closest('a')) return;
    setOpen(door);
  });
}

export class Founder extends Section {
  static id = 'founder';

  mount() {
    wireDoors(this.el.querySelector('.doors'));
  }
}
