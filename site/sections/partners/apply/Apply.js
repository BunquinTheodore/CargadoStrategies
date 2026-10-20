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

/** The bottom of a step's last visible child (grid rows stretch the fieldsets to one height). */
function contentBottom(step) {
  const kids = [...step.children].filter((el) => el.offsetParent !== null);
  return kids.length ? Math.max(...kids.map((el) => el.getBoundingClientRect().bottom)) : step.getBoundingClientRect().bottom;
}

/**
 * Next (and Send) sit right under the right-hand column, not under the taller left one (owner,
 * 2026-10-20): on a two-column page the buttons are raised by the columns' height difference.
 * Back keeps its place under the left column.
 */
function raiseNext(form) {
  const steps = $('.stepper__steps', form);
  const cols = getComputedStyle(steps).gridTemplateColumns.split(' ').length;
  const shown = [...steps.querySelectorAll(':scope > [data-step]:not([hidden])')];
  const [left, right] = shown;
  let raise = 0;
  if (cols === 2 && shown.length === 2 && right.offsetLeft > left.offsetLeft) {
    raise = Math.max(0, contentBottom(left) - contentBottom(right));
  }
  form.style.setProperty('--next-raise', `${-Math.round(raise)}px`);
}

export class Apply extends Section {
  static id = 'apply';

  mount() {
    const { film, ctx: { sfx } } = this;
    const form = document.getElementById('apply-form');
    initPartnerForm({ form, success: document.getElementById('apply-success'), film, sfx });
    const fit = () => raiseNext(form);
    this.observers = [new ResizeObserver(fit), new MutationObserver(fit)];
    this.observers[0].observe($('.stepper__steps', form));
    this.observers[1].observe($('.stepper__steps', form), { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    document.fonts?.ready.then(fit);
  }

  enter() {
    raiseNext(document.getElementById('apply-form'));
  }

  destroy() {
    this.observers?.forEach((o) => o.disconnect());
  }

  cut({ toEl, tl }) {
    if (toEl === this.el) leadPaper(tl, toEl);
  }
}
