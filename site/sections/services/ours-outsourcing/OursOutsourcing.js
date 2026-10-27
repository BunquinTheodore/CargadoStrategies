/**
 * S5 outsourcing (#ours-outsourcing): one role is open at a time. On phones the four panels are an
 * exclusive accordion; on wider screens every ledger shows and only the open role's one-line benefit
 * does (owner, 2026-10-26: the scene keeps its 60-word budget), opened by pointer, focus or tap.
 */
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
    const open = (panel) => {
      if (!panel || panel.classList.contains('is-open')) return;
      panels.forEach((p) => {
        const isOpen = p === panel;
        p.classList.toggle('is-open', isOpen);
        $('.panel__toggle', p)?.setAttribute('aria-expanded', String(isOpen));
      });
    };
    root.addEventListener('click', (event) => open(event.target.closest('.panel')));
    root.addEventListener('pointerover', (event) => {
      if (event.pointerType === 'mouse' && !phone.matches) open(event.target.closest('.panel'));
    });
    root.addEventListener('focusin', (event) => open(event.target.closest('.panel')));
  }
}
