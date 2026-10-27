/**
 * P6 · Close (partners.html): the four question rows open #partner-faq
 * (sections/partners/partner-faq) on their answer, and lead the close in on the cut.
 */
import { Section } from '../../../core/Section.js';
import { openDialog } from '../../../core/ui/ui-dialog.js';
import { itemStates, parseEntrance } from '../../../core/engine/entrances.js';

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * P6: the question rows lead the close in, from the 'iris' label rather than 'in', so the 25%
 * frame of a cut into #close already shows them (slice lesson 5; the small medallion carries
 * less of the frame than Home's). The engine's own row tweens are replaced, not doubled, with
 * the scene's own entrance states, so a non-rise entrance (depth: scale) still lands at rest.
 */
const EARLY_ROWS = Object.freeze({ after: 0.04, duration: 0.45, stagger: 0.06, rise: 24 });

function leadRows(tl, el, dir) {
  const rows = $$('.close__rows > li', el);
  if (!rows.length || tl.labels.iris === undefined) return;
  tl.getTweensOf(rows).forEach((tween) => tween.kill());
  const item = itemStates(parseEntrance(el.dataset.entrance));
  tl.fromTo(rows, { ...item.from, opacity: 0, y: EARLY_ROWS.rise * dir }, {
    ...item.to, opacity: 1, y: 0, duration: EARLY_ROWS.duration, ease: 'expo.out', stagger: EARLY_ROWS.stagger,
  }, `iris+=${EARLY_ROWS.after}`);
}

/* ---------- the P6 questions dialog ---------- */

function wireQuestions(film) {
  const faq = document.getElementById('partner-faq');
  const answers = $$('details.acc', faq);
  $$('[data-faq]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const n = Number(btn.dataset.faq) - 1;
      answers.forEach((d, i) => { d.open = i === n; });
      openDialog(faq, { trigger: btn, film });
    });
  });
}

export class Close extends Section {
  static id = 'close';

  mount() {
    wireQuestions(this.film);
  }

  cut({ toEl, tl, dir = 1 }) {
    if (toEl === this.el) leadRows(tl, toEl, dir);
  }
}
