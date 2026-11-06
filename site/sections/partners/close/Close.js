/**
 * P6 · Close (partners.html): the four question rows open #partner-faq
 * (sections/partners/partner-faq) on their answer, and lead the close in on the cut.
 */
import { Section } from '../../../core/Section.js';
import { openDialog } from '../../../core/ui/ui-dialog.js';

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * P6: the question rows lead the close in, from the 'iris' label rather than 'in', so the 25%
 * frame of a cut into #close already shows them (slice lesson 5; the small medallion carries
 * less of the frame than Home's). The engine's own row tweens (the one rise) are moved, not
 * replaced, so the motion is the engine's and only its start changes.
 */
const EARLY_AFTER = 0.04; // seconds after the 'iris' label

function leadRows(tl, el) {
  const rows = $$('.close__rows > li', el);
  if (!rows.length || tl.labels.iris === undefined) return;
  const at = Math.max(tl.labels.iris + EARLY_AFTER, 0);
  tl.getTweensOf(rows).forEach((tween) => tween.startTime(at));
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

  cut({ toEl, tl }) {
    if (toEl === this.el) leadRows(tl, toEl);
  }
}
