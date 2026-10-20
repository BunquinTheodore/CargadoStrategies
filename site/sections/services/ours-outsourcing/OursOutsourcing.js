/** S5 outsourcing (#ours-outsourcing): on phones the four panels are an exclusive accordion, one open. */
import { Section } from '../../../core/Section.js';
import { PHONE_QUERY } from '../services-data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export class OursOutsourcing extends Section {
  static id = 'ours-outsourcing';

  mount() {
    const root = $('.panels', this.el);
    const panels = $$('.panel', root);
    const phone = window.matchMedia(PHONE_QUERY);
    root.addEventListener('click', (event) => {
      const panel = event.target.closest('.panel');
      if (!phone.matches || !panel || panel.classList.contains('is-open')) return;
      panels.forEach((p) => {
        const open = p === panel;
        p.classList.toggle('is-open', open);
        $('.panel__toggle', p)?.setAttribute('aria-expanded', String(open));
      });
    });
  }
}
