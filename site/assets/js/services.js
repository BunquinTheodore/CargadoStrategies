/**
 * Services page (services.html): 8 scenes + credits on the Round 5 cut engine
 * (DIRECTION §7.2, S1-S9).
 *
 *   S1 intro (rows into each service) · S2 insurance · S3 the clean-up ·
 *   S4 what you get · S5 outsourcing (the gold field) · S6 the concierge, or
 *   the finder once enough partners exist · S7 the inquiry stepper · S8 close.
 *
 * Order (api.md §2): fill the copy that depends on config first, then boot(),
 * then wire the film in the same tick. The engine plays every reveal from the
 * data-reveal hooks; dotglobe plays the map (S6) and the medallion (S8); sound
 * is automatic (the chapter breath, the click blip, the success chime), plus
 * the error voice on a failed Next. Category slugs deep-link to S6 and open the
 * categories dialog there (data-open, `cs:open`).
 */
import { boot } from './main.js';
import { FINDER_MIN_PARTNERS, FOUNDER_LAST_NAME, FOUNDER_NAME, FOUNDER_PHOTO, FOUNDER_SIGNATURE, PARTNERS, categoryBySlug } from './config.js';
import { buildIntro, waLink } from './whatsapp.js';
import { closeDialog, openDialog } from './ui-dialog.js';
import { initCategories } from './services-categories.js';
import { initInquiry } from './services-inquiry.js';
import { initProfiles } from './partner-profile.js';
import { PAGE, PHONE_QUERY, hasPartners } from './services-data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const FINDER_ON = PARTNERS.length >= FINDER_MIN_PARTNERS;

/* ---------- copy that depends on config (before the engine splits words) ---------- */

function fillCopy() {
  if (FOUNDER_NAME) {
    $$('[data-founder-name]').forEach((el) => {
      el.textContent = FOUNDER_NAME;
      el.classList.remove('ph');
    });
    $$('[data-founder-full]').forEach((el) => {
      el.textContent = [FOUNDER_NAME, FOUNDER_LAST_NAME].filter(Boolean).join(' ');
      el.classList.remove('ph');
    });
  }
  // The founder's portrait (never a stand-in face); the typographic portrait stands in until then.
  if (FOUNDER_PHOTO) {
    $$('[data-founder-photo]').forEach((slot) => {
      const img = new Image();
      img.src = FOUNDER_PHOTO;
      img.alt = '';
      img.decoding = 'async';
      slot.replaceChildren(img);
    });
  }
  // Her signature under the typographic portrait, once the owner supplies one (until then the slot stays hidden).
  if (FOUNDER_SIGNATURE) {
    $$('[data-founder-signature]').forEach((slot) => {
      const img = new Image();
      img.src = FOUNDER_SIGNATURE;
      img.alt = '';
      img.decoding = 'async';
      slot.replaceChildren(img);
    });
  }
}

/** The no-JS hrefs of the sheet triggers: the message the sheet would write. */
function fillWhatsAppLinks(scope = document) {
  $$('a[data-wa-sheet][href^="https://wa.me/"]', scope).forEach((a) => {
    const { need = '', context = PAGE } = a.dataset;
    a.href = waLink(buildIntro({ need, context }));
  });
}

/** S6 shows the concierge (C40) until enough partners exist, then the finder (C41). */
function chooseFinder() {
  const scene = $('#finder');
  scene.classList.toggle('is-finder', FINDER_ON);
  $('#concierge').hidden = FINDER_ON;
  $('#finder-root').hidden = !FINDER_ON;
  // "Sorted by distance only. This list…" stands beside a list; the concierge shows none.
  $$('[data-list-note]', scene).forEach((el) => { el.hidden = !FINDER_ON; });
  // The finder brings its own clickable map; the dot map plays with the concierge only.
  if (FINDER_ON) scene.dataset.globeMode = 'hidden';
}

/* ---------- S5 panels on phones: an exclusive accordion, one open ---------- */

function wirePanels(root) {
  const panels = $$('.panel', root);
  const phone = window.matchMedia(PHONE_QUERY);
  root.addEventListener('click', (event) => {
    const panel = event.target.closest('.panel');
    if (!phone.matches || !panel || panel.classList.contains('is-open')) return;
    panels.forEach((p) => {
      const open = p === panel;
      p.classList.toggle('is-open', open);
      $('.panel__toggle', p)?.setAttribute('aria-expanded', String(open));
    });
  });
}

/* ---------- start ---------- */

fillCopy();
fillWhatsAppLinks();
chooseFinder();
const { film, sfx, sheet } = boot({ page: PAGE });
const sound = (name) => { if (sfx.has(name)) sfx.play(name); };

const categoriesDialog = $('#categories-dialog');
const inquiry = initInquiry({ panel: $('#inquiry-panel'), film, sound });
const categories = initCategories({ dialog: categoriesDialog, onRender: () => fillWhatsAppLinks(categoriesDialog) });
let finder = null;

function openCategories({ slug, trigger } = {}) {
  if (slug) categories.select(slug, { drill: true });
  else categories.showRail();
  if (!categoriesDialog.open) openDialog(categoriesDialog, { trigger, film });
}

/** From a dialog to a scene: close every open dialog first, so the cut is not held. */
function leaveDialogsFor(id) {
  $$('dialog[open]').forEach((d) => closeDialog(d, { returnFocus: false }));
  film.goTo(id, { cause: 'goto' });
}

function inquireAbout(slug) {
  inquiry.setCategory(slug);
  if (FINDER_ON && finder && categoryBySlug(slug) && hasPartners(categoryBySlug(slug))) finder.setCategory(slug);
  leaveDialogsFor('inquiry');
  $('#inquiry .stepper__title')?.focus({ preventScroll: true });
}

// "See All Nine Kinds of Help →", and every deep link that names a category (data-open on #finder).
$('[data-categories-open]').addEventListener('click', (event) => {
  event.preventDefault();
  openCategories({ trigger: event.currentTarget });
});
categoriesDialog.addEventListener('cs:open', (event) => {
  event.preventDefault();
  const key = event.detail?.key;
  openCategories({ slug: categoryBySlug(key) ? key : null });
});
categoriesDialog.addEventListener('click', (event) => {
  const link = event.target.closest('[data-cat-scene]');
  if (!link) return;
  event.preventDefault();
  leaveDialogsFor(link.getAttribute('href').slice(1));
});
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-inquiry-category]:not([data-profile-inquiry])');
  if (link) inquiry.setCategory(link.dataset.inquiryCategory);
});

initProfiles({ dialog: $('#profile-dialog'), film, onInquiry: inquireAbout });
wirePanels($('#ours-outsourcing .panels'));

if (FINDER_ON) {
  import('./finder.js').then(({ initFinder }) => {
    finder = initFinder({
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
    inquiry.prefill({ category: need.value, city: city.value.trim() });
  });
}
