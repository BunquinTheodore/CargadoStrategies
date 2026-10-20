/**
 * Legal page (legal.html, DIRECTION §7.5 L1-L8; FR16, SRS Appendix B).
 *
 * Calm on purpose: tier C by design (html[data-tier-lock]), one bone field, no
 * splash, globe, stars, grain, cursor ring or sound. The cuts are the engine's
 * own swaps and in-group fades; the page adds no choreography.
 *
 * Page-only behaviour: legal-fx.js, its own chunk started at once, mounts the
 * sections that page the four documents and run the Q&A (sections/legal/).
 * Deep links that land before it has loaded wait for it.
 */
import { boot } from '../core/main.js';
import { buildIntro, waLink } from '../core/chrome/whatsapp.js';

const PAGE = 'legal';

/** The no-JS hrefs of the sheet triggers: the message the sheet would write. */
function fillWhatsAppLinks() {
  document.querySelectorAll('main a[data-wa-sheet][href^="https://wa.me/"]').forEach((a) => {
    const { need = '', context = PAGE } = a.dataset;
    a.href = waLink(buildIntro({ need, context }));
  });
}

fillWhatsAppLinks();
const ctx = boot({ page: PAGE });
const { film } = ctx;

if (typeof film.refreshReach !== 'function') console.error('legal: film.refreshReach is missing (api.md §3)');
const page = import('./legal-fx.js').then(({ initLegal }) => initLegal(ctx));
page.catch((error) => console.error('legal: legal-fx.js failed to load', error));
film.on('deeplink', (link) => { page.then((legal) => legal.reveal(link)).catch(() => {}); });
