/**
 * Legal page (legal.html, DIRECTION §7.5 L1-L8; FR16, SRS Appendix B).
 *
 * Calm on purpose: tier C by design (html[data-tier-lock]), one bone field, no
 * splash, globe, stars, grain, cursor ring or sound. The cuts are the engine's
 * own swaps and in-group fades; the page adds no choreography.
 *
 * Page-only behaviour:
 *  - the draft band reports its height as --banner-h on <html> (R4 legal §3.2),
 *    so every scene box starts below it;
 *  - legal-fx.js, its own chunk started at once, pages the four documents and
 *    runs the Q&A (an exclusive accordion, 3-6 per page by height from 760 px, drill mode on
 *    phones). Deep links that land before it has loaded wait for it.
 */
import { boot } from './main.js';
import { buildIntro, waLink } from './whatsapp.js';

const PAGE = 'legal';

/** Publish the band's height on <html>, where the engine's --scene-top resolves (it wraps on phones). */
function trackBannerHeight(band) {
  if (!band) return;
  const apply = () => document.documentElement.style.setProperty('--banner-h', `${band.offsetHeight}px`);
  apply();
  new ResizeObserver(apply).observe(band);
}

/** The no-JS hrefs of the sheet triggers: the message the sheet would write. */
function fillWhatsAppLinks() {
  document.querySelectorAll('main a[data-wa-sheet][href^="https://wa.me/"]').forEach((a) => {
    const { need = '', context = PAGE } = a.dataset;
    a.href = waLink(buildIntro({ need, context }));
  });
}

trackBannerHeight(document.querySelector('.legal-draft'));
fillWhatsAppLinks();
const { film } = boot({ page: PAGE });

if (typeof film.refreshReach !== 'function') console.error('legal: film.refreshReach is missing (api.md §3)');
const page = import('./legal-fx.js').then(({ initLegal }) => initLegal({ film }));
page.catch((error) => console.error('legal: legal-fx.js failed to load', error));
film.on('deeplink', (link) => { page.then((legal) => legal.reveal(link)).catch(() => {}); });
