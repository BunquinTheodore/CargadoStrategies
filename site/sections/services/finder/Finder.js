/**
 * S6 (#finder): the concierge (C40, concierge.js) until enough partners exist,
 * then the finder (C41, widget/finder.js). Finder.choose() runs before boot();
 * either module loads on mount, split from the page bundle.
 */
import { Section } from '../../../core/Section.js';
import { FINDER_MIN_PARTNERS, PARTNERS, categoryBySlug } from '../../../assets/js/config.js';
import { hasPartners } from '../services-data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const FINDER_ON = PARTNERS.length >= FINDER_MIN_PARTNERS;

export class Finder extends Section {
  static id = 'finder';

  /** Show the concierge or the finder (before boot(): the engine reads what is hidden). */
  static choose() {
    const scene = $('#finder');
    scene.classList.toggle('is-finder', FINDER_ON);
    $('#concierge').hidden = FINDER_ON;
    $('#finder-root').hidden = !FINDER_ON;
    // "Sorted by distance only. This list…" stands beside a list; the concierge shows none.
    $$('[data-list-note]', scene).forEach((el) => { el.hidden = !FINDER_ON; });
    // With the concierge, "See All Nine Kinds of Help" sits on the CTA's row (owner, 2026-10-20).
    const allHelp = $('.finder__action [data-categories-open]', scene);
    if (!FINDER_ON && allHelp) $('.concierge__row', scene)?.append(allHelp);
    // The finder brings its own clickable map; the dot map plays with the concierge only.
    if (FINDER_ON) scene.dataset.globeMode = 'hidden';
  }

  mount() {
    const { film, sheet, sound } = this.ctx;
    this.finder = null;
    if (FINDER_ON) {
      import('./widget/finder.js').then(({ initFinder }) => {
        this.finder = initFinder({
          root: $('#finder-root'),
          film,
          onError: () => sound('error'),
          onRender: () => film.refreshReach(),
        });
      }).catch((error) => console.error('[services] the finder failed to load', error));
    } else {
      import('./concierge.js').then(({ initConcierge }) => initConcierge($('#concierge'), { sheet }))
        .catch((error) => console.error('[services] the concierge failed to load', error));
      // S6 and S7 never ask twice: what the concierge was told fills the inquiry, which then opens on its next step.
      $('#concierge').addEventListener('change', (event) => {
        const { need, city } = event.currentTarget.elements;
        this.ctx.prefillInquiry({ category: need.value, city: city.value.trim() });
      });
    }
  }

  /** Narrow the finder to a category that has partners (no-op for the concierge). */
  setCategory(slug) {
    if (FINDER_ON && this.finder && categoryBySlug(slug) && hasPartners(categoryBySlug(slug))) this.finder.setCategory(slug);
  }
}
