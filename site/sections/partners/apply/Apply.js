/**
 * P5 · Apply (partners.html): the application stepper (partners-form.js) and, on a swap cut,
 * the paper led in with the head. The form plays the success chime (sfx).
 */
import { Section } from '../../../core/Section.js';
import { initPartnerForm } from './partners-form.js';

const $ = (sel, root = document) => root.querySelector(sel);

/**
 * P5 on a swap (tier C, reduced motion: 'iris' and 'in' share one early time, cut.js): the paper
 * and its frame start at 'in' with the head, so the 25% frame shows more than the eyebrow. The
 * circle cut keeps the head-then-paper order from the markup's data-delay.
 */
function leadPaper(tl, el) {
  const { iris, in: at } = tl.labels;
  if (!(at > 0) || iris !== at) return;
  const paper = $('.apply__paper', el);
  if (!paper) return;
  tl.getTweensOf([paper, $('[data-frame]', paper)].filter(Boolean))
    .forEach((tween) => { if (tween.startTime() > at) tween.startTime(at); });
}

export class Apply extends Section {
  static id = 'apply';

  mount() {
    const { film, ctx: { sfx } } = this;
    initPartnerForm({ form: document.getElementById('apply-form'), success: document.getElementById('apply-success'), film, sfx });
  }

  cut({ toEl, tl }) {
    if (toEl === this.el) leadPaper(tl, toEl);
  }
}
