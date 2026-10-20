/**
 * H4 · Founder (W3): the three doors. On phones they are an exclusive
 * accordion (one open); every cut into the scene deals them in (y ±48 px,
 * rotationY ±12°, perspective 1100, 70 ms apart, landing flat; phones rise in y).
 */

import { Section } from '../../../core/Section.js';
import { PHONE_QUERY, isPhone, qsa } from '../_shared.js';

const DEAL = Object.freeze({
  y: 48,
  rotationY: 12, // DIRECTION W3: at most 12° (the panel fix)
  perspective: 1100,
  duration: 0.6,
  stagger: 0.07,
  after: 0, // seconds after the 'in' label: the first door moves with the title (no bare metal)
});

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

/** W3: the doors are dealt in, alternating up and down, and land flat. */
function dealDoors(tl, el) {
  const doors = qsa(el, '.door');
  if (!doors.length) return;
  const flat = isPhone();
  const from = flat
    ? { opacity: 0, y: DEAL.y }
    : {
      opacity: 0,
      y: (i) => (i % 2 ? DEAL.y : -DEAL.y),
      rotationY: (i) => (i % 2 ? -DEAL.rotationY : DEAL.rotationY),
      transformPerspective: DEAL.perspective,
    };
  const to = flat
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0, rotationY: 0, transformPerspective: DEAL.perspective };
  tl.fromTo(doors, from, {
    ...to, duration: DEAL.duration, ease: 'expo.out', stagger: DEAL.stagger, clearProps: 'transform',
  }, `in+=${DEAL.after}`);
}

export class Founder extends Section {
  static id = 'founder';

  mount() {
    wireDoors(this.el.querySelector('.doors'));
  }

  /** Film 'cut': only the cut that enters this scene. */
  cut(event) {
    if (event.toEl !== this.el) return;
    dealDoors(event.tl, event.toEl);
  }
}
