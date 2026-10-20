/**
 * T4 #values: on phones the three bodies are an exclusive accordion, one body
 * open (01 open in the markup).
 */
import { Section } from '../../../core/Section.js';

const PHONE_QUERY = '(max-width: 759px)';

function wireValues(root) {
  const values = Array.from(root.querySelectorAll('.value'));
  if (!values.length) return;
  const phone = window.matchMedia(PHONE_QUERY);
  const setOpen = (value) => {
    values.forEach((v) => {
      const open = v === value;
      v.classList.toggle('is-open', open);
      v.querySelector('.value__toggle')?.setAttribute('aria-expanded', String(open));
    });
  };
  root.addEventListener('click', (event) => {
    if (!phone.matches) return;
    const value = event.target.closest('.value');
    if (value && !value.classList.contains('is-open')) setOpen(value);
  });
}

export class Values extends Section {
  static id = 'values';

  mount() {
    wireValues(this.el.querySelector('.values__rows'));
  }
}
