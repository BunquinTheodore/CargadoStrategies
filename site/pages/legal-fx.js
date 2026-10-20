/**
 * Legal page sections (sections/legal/), loaded by legal.js as its own chunk:
 * the four documents and the Q&A, each a Section (core/Section.js), mounted in
 * page order, plus the deep links that land inside them.
 */
import { mountSections } from '../core/main.js'; // via main.js: keeps Section.js in the engine chunk (see main.js)
import { Disclosure } from '../sections/legal/disclosure/Disclosure.js';
import { Privacy } from '../sections/legal/privacy/Privacy.js';
import { Terms } from '../sections/legal/terms/Terms.js';
import { Conduct } from '../sections/legal/conduct/Conduct.js';
import { Faq } from '../sections/legal/faq/Faq.js';

/** `ctx` is what boot() returned; the documents mount first, then the Q&A (its readers before its tabs). */
export function initLegal(ctx) {
  const { sections } = mountSections([Disclosure, Privacy, Terms, Conduct, Faq], ctx);
  const faq = sections.find((section) => section instanceof Faq);

  return {
    /** Deep links: an answer opens; a clause turns to its page; a document link opens page 1. */
    reveal({ el, scene }) {
      if (!el) return;
      if (faq.reveal(el)) return;
      const item = el.closest('[data-page-item]');
      const root = (item || el).closest('[data-pager]');
      if (item && root?.csPager) { root.csPager.reveal(el); return; }
      if (scene) sections.forEach((section) => section.rewind(scene));
    },
  };
}
