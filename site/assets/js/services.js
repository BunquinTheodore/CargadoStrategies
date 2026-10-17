/**
 * Services page (PLAN §3, wireframes 3b · 4b · 5c; FR02–FR08, FR22, FR25–FR31).
 *
 * Scenes: intro + jump rail → the founder's insurance, business strategy and
 * outsourcing → partner finder → categories (rail + detail) → inquiry → close.
 * Category slugs are deep links (services.html#legal): they are not scene
 * ids, so the page selects the category and moves the film to the
 * categories scene itself.
 */
import { boot } from './main.js';
import { SITE_NAME, categoryBySlug } from './config.js';
import { waLink, categoryMessage, finderRequestMessage, pageLink } from './whatsapp.js';
import { idFromHash } from './film-events.js';
import { initFinder } from './finder.js';
import { initCategories } from './services-categories.js';
import { initInquiry } from './services-inquiry.js';
import { PAGE, hasPartners, FOUNDER_REQUEST } from './services-data.js';
import { createViewHelper } from './services-view.js';
import { addDepthTweens, cue } from './services-fx.js';
import { titleCase } from './text-case.js';

const FIT_CALL_TEXT = [
  `Hi ${SITE_NAME},`,
  "I'm on the Services page of your website.",
  "I'd like to book a 15-minute fit call for the 30-day cash-flow clean-up.",
  'My business: …',
  'My city and province (so we can plan the call in your time zone): …',
].join('\n');

const BAR_DEFAULT = Object.freeze({ label: 'Message Us on WhatsApp', href: pageLink(PAGE) });
const INITIAL_HASH = idFromHash(location.hash);
let chromeApi = null; // set after boot(); the finder reports changes before that
let bringIntoView = () => {}; // set after boot(); needs the film

/* ---------- 1. Build the page content before the film measures it ---------- */

function wireWhatsAppButtons() {
  document.querySelectorAll('a[data-wa-category]').forEach((a) => {
    const category = categoryBySlug(a.dataset.waCategory);
    a.href = waLink(categoryMessage({ category: category?.name, page: PAGE }));
    a.target = '_blank';
    a.rel = 'noopener';
  });
  document.querySelectorAll('a[data-wa-fitcall]').forEach((a) => {
    a.href = waLink(FIT_CALL_TEXT);
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

const startSlug = categoryBySlug(INITIAL_HASH) ? INITIAL_HASH : null;
wireWhatsAppButtons();
const categories = initCategories({
  rail: document.getElementById('cat-rail'),
  detail: document.getElementById('cat-detail'),
  announce: document.getElementById('cat-announce'),
  initial: startSlug,
  onPick: (slug, { changed }) => {
    if (changed) cue('switch');
    updateBar(); // the phone bar names the category now shown
    bringIntoView(document.getElementById('cat-detail'));
  },
});
const finder = initFinder({
  root: document.getElementById('finder'),
  onChange: () => updateBar(),
  onPlace: () => {
    cue('result');
    bringIntoView(document.getElementById('results-title'));
  },
  onError: () => cue('error'),
});
const inquiry = initInquiry({ panel: document.getElementById('inquiry-panel') });
if (startSlug) preselect(startSlug);

/* ---------- 2. Boot chrome → film → layers → globe ---------- */

const { film, chrome } = boot({ page: PAGE });
chromeApi = chrome;
bringIntoView = createViewHelper(film);

/* ---------- 3. Film listeners (same tick) ---------- */

function preselect(slug) {
  const category = categoryBySlug(slug);
  if (!category) return;
  if (hasPartners(category) && finder.state.category?.slug !== slug) finder.setCategory(slug);
  inquiry.setCategory(slug);
}

/** Founder scenes: the phone bar asks about that offer. */
const categoryLink = (slug) => waLink(categoryMessage({ category: categoryBySlug(slug)?.name, page: PAGE }));
const FOUNDER_BARS = Object.freeze({
  'ours-insurance': { label: 'Ask About Insurance', href: categoryLink('insurance') },
  'ours-strategy': { label: 'Book a 15-Min Fit Call', href: waLink(FIT_CALL_TEXT) },
  'ours-outsourcing': { label: 'Ask About Outsourcing', href: categoryLink('outsourcing') },
});

function barFor(sceneId) {
  if (FOUNDER_BARS[sceneId]) return FOUNDER_BARS[sceneId];
  if (sceneId === 'finder') {
    const { category, type, place } = finder.state;
    if (category && !hasPartners(category)) {
      const text = categoryMessage({ category: category.name, city: place?.label, page: PAGE, request: FOUNDER_REQUEST });
      return { label: 'Ask Our Founder', href: waLink(text) };
    }
    const text = finderRequestMessage({ category: category?.name, type: type?.name, place: place?.label });
    return { label: 'Ask Us to Find Someone', href: waLink(text) };
  }
  if (sceneId === 'categories' && categories.current) {
    const category = categoryBySlug(categories.current);
    return { label: titleCase(`Ask about ${category.name}`), href: waLink(categoryMessage({ category: category.name, page: PAGE })) };
  }
  return BAR_DEFAULT;
}

function updateBar(sceneId = document.documentElement.dataset.scene) {
  chromeApi?.setBar(barFor(sceneId));
}

let firstDeepLink = true;
function onDeepLink({ id, el }) {
  const immediate = firstDeepLink && id === INITIAL_HASH;
  firstDeepLink = false;
  if (el || !categoryBySlug(id)) return;
  categories.select(id);
  preselect(id);
  updateBar();
  film.goTo('categories', { immediate });
}

function onPrefillClick(event) {
  const link = event.target.closest('[data-inquiry-category], [data-finder-category]');
  if (!link) return;
  if (link.dataset.inquiryCategory) inquiry.setCategory(link.dataset.inquiryCategory);
  if (link.dataset.finderCategory) finder.setCategory(link.dataset.finderCategory);
}

/** Extra scrubbed tweens: the map wipes in left to right (depth: services-fx.js). */
function addSceneTweens({ tl, sceneEl, timing }) {
  const at = (share) => timing.inStart + timing.inDur * share;
  if (sceneEl.id === 'finder') {
    tl.fromTo(sceneEl.querySelector('#finder-map'),
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: timing.inDur * 0.6, ease: 'power2.inOut' }, at(0.3));
  }
}

/** A partner profile unfolding gets a soft whoosh (toggle does not bubble, so listen in capture). */
function onDetailsToggle(event) {
  if (event.target.matches?.('details.profile') && event.target.open) cue('open');
}

film.on('build', addSceneTweens);
film.on('build', addDepthTweens);
film.on('deeplink', onDeepLink);
film.on('scene', ({ id }) => updateBar(id));
document.addEventListener('click', onPrefillClick);
document.addEventListener('toggle', onDetailsToggle, true);
