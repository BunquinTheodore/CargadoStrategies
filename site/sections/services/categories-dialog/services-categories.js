/**
 * The categories dialog (DIRECTION §7.2 S6; R4 services.md §8, FR02–FR05,
 * CR13, CR16, CR17): a rail grouped "Ours" (the founder's own businesses) and
 * "Partners" (independent), and the detail of one category: its description
 * and types, the founder's offer where she has one, the approved partners
 * (paged) or a "Partner spot available" card, one CTA into the WhatsApp sheet,
 * and the partner notice. Every category slug deep-links here
 * (services.html#legal), and picking one keeps the URL shareable.
 *
 * Phones show the rail or the detail (a drill: "All Categories" goes back);
 * wider screens show both side by side.
 */
import { CATEGORIES, FINDER_MIN_PARTNERS, PARTNERS, categoryBySlug } from '../../../assets/js/config.js';
import { escapeHtml } from '../../../core/chrome/chrome.js';
import { waLink, categoryMessage } from '../../../core/chrome/whatsapp.js';
import { createPager } from '../../../core/ui/ui-pager.js';
import { FOUNDER_OFFERS, OURS, PARTNER_ONLY, hasPartners, isOurs, PAGE, PHONE_QUERY, profileTrigger, subPlaceholderCard } from '../services-data.js';
import { titleCase } from '../../../core/lib/text-case.js';

const ARROW = '<span class="btn__arrow" aria-hidden="true">→</span>';
const NEW_TAB = 'target="_blank" rel="noopener"';
const TALL_QUERY = '(min-height: 1000px) and (min-width: 760px)'; // two partners a page only where the dialog has room
const DRILL_CLASS = 'is-detail';
const name = (category) => escapeHtml(titleCase(category.name));
/** Until the finder is live the dialog is the concierge: no partner list, no partner-spot cards (those stay on partners.html). */
const LISTS_ON = PARTNERS.length >= FINDER_MIN_PARTNERS;
/** The S6 fine print (verbatim, moved here): its first two sentences stand only beside a list. */
const LIST_NOTICE = '<strong>Sorted by distance only.</strong> This list is not a recommendation. ';
const PARTNER_NOTICE = 'Partners are independent businesses, each responsible for their own licence and advice. Cargado Strategies may receive a commission if you become their client. You never pay us.';
/** Today's dialog notice, shown while partners are listed here. */
const LISTING_NOTICE = 'Partners are independent businesses, listed by distance only; a listing is not a recommendation. Cargado Strategies may receive a commission if you become their client.';

/** Founder credential line per category. */
const FOUNDER_LINES = Object.freeze({
  insurance: 'Offered by our founder.',
  'business-strategy': 'Offered by our founder · Finance and operations strategy · Strategy and coaching only, not licensed accounting, tax or investment advice.',
  outsourcing: 'Provided by Cargado Strategies itself, not by a partner.',
});

function ownershipLabel(category) {
  if (category.ownership === 'both') return 'Ours + partners';
  return isOurs(category) ? 'Ours · from our founder' : 'Partners · independent businesses';
}

function railItem(category) {
  return `<li><button class="cats__item" type="button" data-slug="${category.slug}" aria-controls="cat-detail" aria-pressed="false">
    <span>${name(category)}</span><span class="cats__go" aria-hidden="true">→</span></button></li>`;
}

function railMarkup() {
  return `
  <p class="cats__group" id="rail-ours">Ours</p>
  <ul class="cats__list" aria-labelledby="rail-ours">${OURS.map(railItem).join('')}</ul>
  <p class="cats__group" id="rail-partners">Partners</p>
  <ul class="cats__list" aria-labelledby="rail-partners">${PARTNER_ONLY.map(railItem).join('')}</ul>`;
}

function partnerCard(partner, category) {
  const e = escapeHtml;
  const text = `${categoryMessage({ category: category.name, page: PAGE })}\nPartner: ${partner.business}`;
  const meta = [partner.name, partner.serviceArea || partner.city].filter(Boolean).map(e).join(' · ');
  return `
  <article class="partner-card cats__partner">
    <div class="partner-card__body">
      <h4 class="partner-card__title">${e(partner.business)}</h4>
      <p class="partner-card__meta">${meta}</p>
      <p class="partner-card__acts"><a class="link" href="${waLink(text)}" ${NEW_TAB}>Introduce Me ${ARROW}<span class="visually-hidden"> to ${e(partner.business)} on WhatsApp (opens in a new tab)</span></a>
        ${profileTrigger(partner, category)}</p>
    </div>
  </article>`;
}

function partnersMarkup(category) {
  return `
  <div class="cats__partners" data-pager-root>
    <div class="cats__cards" data-cat-cards></div>
    <nav class="pager" aria-label="More partners" data-pager-bar hidden>
      <button class="btn btn--ghost btn--sm pager__btn" type="button" data-dir="-1">Previous<span class="visually-hidden"> partners</span></button>
      <p class="pager__status num"><span data-pager-current>1</span> of <span data-pager-total>1</span></p>
      <button class="btn btn--ghost btn--sm pager__btn" type="button" data-dir="1">Next<span class="visually-hidden"> partners</span></button>
    </nav>
    <span class="visually-hidden" aria-live="polite" data-pager-live></span>
  </div>`;
}

function cardsOf(category) {
  const listed = PARTNERS.filter((p) => p.category === category.slug);
  return listed.length ? listed.map((p) => partnerCard(p, category)) : [subPlaceholderCard(category.name)];
}

function founderMarkup(category) {
  const offer = FOUNDER_OFFERS[category.slug];
  if (!offer) return '';
  return `
  <p class="cats__offer"><strong>${escapeHtml(offer.name)}.</strong> ${FOUNDER_LINES[category.slug] || ''}
    <a class="link" href="#${offer.scene}" data-cat-scene>See Her Offer ${ARROW}</a></p>`;
}

function actionMarkup(category) {
  const offer = hasPartners(category) ? null : FOUNDER_OFFERS[category.slug];
  const label = offer ? offer.cta : 'Get My Introduction';
  const context = offer ? 'founder' : 'services';
  const href = waLink(categoryMessage({ category: category.name, page: PAGE }));
  return `<a class="btn btn--primary cats__cta" data-wa-sheet data-need="${category.slug}" data-context="${context}"
    href="${href}" ${NEW_TAB}>${label} ${ARROW}</a>`;
}

function detailMarkup(category) {
  const types = category.types.length
    ? `<ul class="tags cats__tags" aria-label="Types">${category.types.map((t) => `<li>${escapeHtml(titleCase(t.name))}</li>`).join('')}</ul>`
    : '';
  const hidden = LISTS_ON ? '' : ' hidden';
  const notice = hasPartners(category)
    ? `<p class="fineprint cats__notice"><span${hidden}>${LIST_NOTICE}</span>${PARTNER_NOTICE}</p>
       <p class="fineprint cats__notice"${hidden}>${LISTING_NOTICE}</p>`
    : '';
  return `
  <div class="cats__card">
    <p class="eyebrow">${ownershipLabel(category)}</p>
    <h3 class="cats__name" id="cat-detail-title">${name(category)}</h3>
    <p class="cats__desc">${escapeHtml(category.description)}</p>
    ${types}
    ${founderMarkup(category)}
    ${LISTS_ON && hasPartners(category) ? partnersMarkup(category) : ''}
    ${actionMarkup(category)}
    ${notice}
  </div>`;
}

/**
 * Render the rail and the first detail into the dialog. `initial` is a category slug.
 * Returns { select(slug, { updateUrl, drill }), showRail(), current }.
 * `onRender()` runs after every detail render (the page re-wires sheet links there).
 */
export function initCategories({ dialog, initial, onRender = () => {} }) {
  const rail = dialog.querySelector('#cat-rail');
  const detail = dialog.querySelector('#cat-detail');
  const announce = dialog.querySelector('#cat-announce');
  const title = dialog.querySelector('.cats__title');
  const phone = window.matchMedia(PHONE_QUERY);
  const tall = window.matchMedia(TALL_QUERY);
  rail.innerHTML = railMarkup();
  const buttons = Array.from(rail.querySelectorAll('.cats__item'));
  let current = null;
  let pager = null;

  function pageCards(category) {
    pager?.destroy();
    pager = null;
    const list = detail.querySelector('[data-cat-cards]');
    if (!list) return;
    list.innerHTML = cardsOf(category).join('');
    pager = createPager(list, { mode: 'static', maxPerPage: () => (tall.matches ? 2 : 1), noun: 'partners' });
  }

  /** Phones show the rail or one category; on a category the back button takes the title's row. */
  function setDrill(on) {
    dialog.classList.toggle(DRILL_CLASS, on);
    title.classList.toggle('visually-hidden', on && phone.matches);
  }

  function select(slug, { updateUrl = false, drill = true } = {}) {
    const category = categoryBySlug(slug);
    if (!category) return false;
    current = slug;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.slug === slug)));
    detail.innerHTML = detailMarkup(category);
    pageCards(category);
    setDrill(drill);
    if (announce) announce.textContent = `Showing ${titleCase(category.name)}`;
    if (updateUrl) history.replaceState(null, '', `#${slug}`);
    onRender();
    return true;
  }

  function showRail() {
    setDrill(false);
    rail.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
  }

  rail.addEventListener('click', (event) => {
    const button = event.target.closest('.cats__item');
    if (!button) return;
    if (button.dataset.slug !== current || phone.matches) select(button.dataset.slug, { updateUrl: true });
    if (phone.matches) detail.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (event) => {
    if (event.target.closest('[data-cat-back]')) showRail();
  });
  phone.addEventListener('change', () => setDrill(dialog.classList.contains(DRILL_CLASS)));
  tall.addEventListener('change', () => { if (current) pageCards(categoryBySlug(current)); });

  select(categoryBySlug(initial) ? initial : CATEGORIES[0].slug, { drill: false });
  return { select, showRail, get current() { return current; } };
}
