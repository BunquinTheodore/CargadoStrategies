/**
 * L6 #faq: the Q&A (R4 legal §5.2). Each answer is a paged reader on phones
 * (LegalDoc); the Q&A is one ui-tabs.js root in drill mode at every width.
 * From 760 px the questions and answers interleave in CSS, so it reads as an
 * exclusive accordion (a button that expands its labelled region), paged by
 * height (all six on tall screens, 4 or 3 on shorter ones), with the first
 * answer on each page open at rest (no half-empty sheet); a second click
 * closes it and focus stays on the question.
 * On phones it is R4's drill: the list, then one answer in its place with
 * "All Questions" and "Next Question", focus on the answer's heading.
 *
 * Motion is the pager's own 24 px turn (nothing in flow mode). No sound.
 */
import { LegalDoc } from '../LegalDoc.js';
import { createPager } from '../../../core/ui/ui-pager.js';
import { createTabs } from '../../../core/ui/ui-tabs.js';

const WIDE_QUERY = '(min-width: 760px)';
/** Questions per page from 760 px, by viewport height (min height in px → count); first match wins. */
const QUESTIONS_BY_HEIGHT = [[860, 6], [760, 4], [0, 3]];

const questionsPerPage = () => QUESTIONS_BY_HEIGHT.find(([min]) => window.innerHeight >= min)[1];

/** The Q&A: drill semantics everywhere, presented as a paged accordion from 760 px. */
function initQa(root, { film }) {
  const wide = window.matchMedia(WIDE_QUERY);
  const list = root.querySelector('.tabs__list');
  const questions = Array.from(list.querySelectorAll('.tabs__tab'));
  const headings = Array.from(root.querySelectorAll('.qa__title'));
  const refreshReach = () => film.refreshReach();

  // Drill focuses an h3[tabindex="-1"] on open: wanted on phones, not where the question stays in view.
  const setHeadingStops = () => headings.forEach((h) => {
    if (wide.matches) h.removeAttribute('tabindex'); else h.setAttribute('tabindex', '-1');
  });
  setHeadingStops();

  const tabs = createTabs(root, { inactive: 'drill', film, onModeChange: refreshReach });
  const openQuestion = () => questions.find((q) => q.getAttribute('aria-expanded') === 'true');
  /** Wide: when the page shows no answer, open its first question's (on load and after a turn). */
  const openFirstShown = () => {
    if (!wide.matches || openQuestion()) return;
    const first = questions.find((q) => !q.hidden);
    if (first) tabs.open(first.getAttribute('aria-controls'), { cause: 'auto' });
  };

  const pager = createPager(list, {
    mode: 'static',
    maxPerPage: () => (wide.matches ? questionsPerPage() : Infinity),
    noun: 'questions',
    status: 'page',
    focusOnTurn: 'item',
    film,
    onRender: () => {
      if (openQuestion()?.hidden) tabs.close({ cause: 'auto' });
      openFirstShown();
      refreshReach();
    },
  });

  // Accordion toggle (wide): a click on the open question closes it before ui-tabs reopens it.
  list.addEventListener('click', (event) => {
    const question = event.target.closest('.tabs__tab');
    if (!wide.matches || !question || question.getAttribute('aria-expanded') !== 'true') return;
    event.stopPropagation();
    tabs.close({ cause: event.detail === 0 ? 'key' : 'pointer' });
  }, true);

  wide.addEventListener('change', () => {
    setHeadingStops();
    pager.refresh();
  });
  let perPage = questionsPerPage();
  window.addEventListener('resize', () => {
    if (questionsPerPage() === perPage) return;
    perPage = questionsPerPage();
    pager.refresh();
  });

  return {
    /** Open the answer that holds `el` (a #qa-… deep link), on its page of questions. */
    reveal(el) {
      const panel = el.closest('.qa__panel');
      if (!panel) return false;
      const index = questions.findIndex((q) => q.getAttribute('aria-controls') === panel.id);
      if (index < 0) return false;
      if (wide.matches) pager.goTo(Math.floor(index / questionsPerPage()));
      tabs.open(panel.id, { cause: 'deeplink' });
      return true;
    },
  };
}

export class Faq extends LegalDoc {
  static id = 'faq';

  /** The answers' readers first, then the Q&A on top of them. */
  mount() {
    super.mount();
    const root = this.el.querySelector('.qa');
    this.qa = root ? initQa(root, { film: this.film }) : null;
  }

  /** A deep link into an answer opens it → true when it was one. */
  reveal(el) {
    return !!this.qa?.reveal(el);
  }
}
