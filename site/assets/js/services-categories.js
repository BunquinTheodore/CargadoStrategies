/**
 * Categories scene (wireframe 3b, FR02–FR05, CR13, CR16, CR17): a rail grouped
 * "Ours" (the founder's own businesses) vs "Partners" (independent), and a
 * detail panel with the description, types, and approved partners or
 * "Partner spot available" placeholder cards. Selecting a category updates the
 * URL hash (services.html#legal) so each one can be shared. The detail is a
 * 3D card (.panel-3d: tilt + depth layers); a category the visitor picks
 * turns in with a short flip (CSS, transform and opacity only, film mode).
 */
import { CATEGORIES, PARTNERS, categoryBySlug } from './config.js';
import { escapeHtml } from './chrome.js';
import { waLink, categoryMessage } from './whatsapp.js';
import { FOUNDER_OFFERS, OURS, PARTNER_ONLY, hasPartners, isOurs, PAGE, subPlaceholderCard } from './services-data.js';
import { profileMarkup } from './partner-profile.js';
import { titleCase } from './text-case.js';

const MIN_CARDS = 2;
const ARROW = '<span class="btn__arrow" aria-hidden="true">→</span>';
const NEW_TAB = 'target="_blank" rel="noopener"';
const PH = (text) => `<span class="ph">[${text}]</span>`;
const FLIP_CLASS = 'is-entering';
const name = (category) => escapeHtml(titleCase(category.name));

/** Founder credential line per category (placeholders until the founder confirms). */
const FOUNDER_LINES = Object.freeze({
  insurance: `Offered by our founder through ${PH('insurance company')} · Licence ${PH('licence #')} · Regulator ${PH('regulator')}`,
  'business-strategy': `Offered by our founder through ${PH('company name')} · Finance and operations strategy · Strategy and coaching only, not licensed accounting, tax or investment advice.`,
  outsourcing: 'Provided by Cargado Strategies itself, not by a partner.',
});

function ownershipLabel(category) {
  if (category.ownership === 'both') return 'Ours + partners';
  return isOurs(category) ? 'Ours · from our founder' : 'Partners · independent businesses';
}

function railItem(category) {
  const tag = category.ownership === 'both' ? '<span class="cat-rail__tag">+ partners</span>' : '';
  return `<li><button class="cat-rail__item" type="button" data-slug="${category.slug}" aria-controls="cat-detail" data-cursor-label="View">
    <span>${name(category)}</span>${tag}</button></li>`;
}

function railMarkup() {
  return `
  <p class="cat-rail__group" id="rail-ours">Ours</p>
  <ul class="cat-rail__list" aria-labelledby="rail-ours">${OURS.map(railItem).join('')}</ul>
  <p class="cat-rail__group" id="rail-partners">Partners</p>
  <ul class="cat-rail__list" aria-labelledby="rail-partners">${PARTNER_ONLY.map(railItem).join('')}</ul>`;
}

function partnerCard(partner, category) {
  const e = escapeHtml;
  const cred = partner.credential ? `${e(partner.credential)}${partner.issuingBody ? ` · ${e(partner.issuingBody)}` : ''}` : '';
  const text = `${categoryMessage({ category: category.name, page: PAGE })}\nPartner: ${partner.business}`;
  return `
  <article class="partner-card" data-cursor-label="Profile">
    <div class="partner-card__avatar" aria-hidden="true"></div>
    <div class="partner-card__body">
      <h4 class="partner-card__title">${e(partner.business)}</h4>
      <p class="partner-card__meta">${[partner.name, partner.serviceArea || partner.city].filter(Boolean).map(e).join(' · ')}</p>
      ${cred ? `<p class="partner-card__meta">${cred}</p>` : ''}
      <a class="btn btn--link" href="${waLink(text)}" ${NEW_TAB}>Introduce Me ${ARROW}<span class="visually-hidden"> to ${e(partner.business)} on WhatsApp (opens in a new tab)</span></a>
      ${profileMarkup(partner, category)}
    </div>
  </article>`;
}

function partnersMarkup(category) {
  const listed = PARTNERS.filter((p) => p.category === category.slug);
  const cards = listed.map((p) => partnerCard(p, category));
  while (cards.length < MIN_CARDS) cards.push(subPlaceholderCard(category.name));
  const title = category.ownership === 'both' ? 'Also from partners' : 'Partners'; // eyebrow (small caps label)
  return `
  <div class="cat-detail__partners stack stack-s">
    <h4 class="eyebrow">${title}</h4>
    <div class="partner-list">${cards.join('')}</div>
  </div>`;
}

function founderMarkup(category) {
  const offer = FOUNDER_OFFERS[category.slug];
  if (!offer) return '';
  return `
  <div class="cat-detail__ours lead-rule stack stack-xs" data-depth="16">
    <p class="cat-detail__offer"><strong>${escapeHtml(offer.name)}</strong></p>
    <p class="t-small">${FOUNDER_LINES[category.slug] || ''}</p>
    <a class="btn btn--link" href="#${offer.scene}">See Our Founder's Offer ${ARROW}</a>
  </div>`;
}

function actionsMarkup(category) {
  const wa = waLink(categoryMessage({ category: category.name, page: PAGE }));
  const find = hasPartners(category)
    ? `<a class="btn btn--primary" href="#finder" data-finder-category="${category.slug}">Find One Near You ${ARROW}</a>`
    : `<a class="btn btn--primary" href="#inquiry" data-inquiry-category="${category.slug}">Send an Inquiry ${ARROW}</a>`;
  return `
  <div class="row">${find}
    <a class="btn btn--ghost" href="${wa}" ${NEW_TAB}>Ask on WhatsApp<span class="visually-hidden"> (opens in a new tab)</span></a>
  </div>`;
}

function detailMarkup(category, { flip = false } = {}) {
  const types = category.types.length
    ? `<ul class="tags" aria-label="Types" data-depth="24">${category.types.map((t) => `<li>${escapeHtml(titleCase(t.name))}</li>`).join('')}</ul>`
    : '';
  const notice = hasPartners(category)
    ? `<p class="notice">Partners are independent businesses, listed by distance only; a listing is not a recommendation.
        Cargado Strategies may receive a commission if you become their client. ${PH('Wording to be confirmed by counsel')}</p>`
    : '';
  return `
  <div class="cat-card panel-3d${flip ? ` ${FLIP_CLASS}` : ''}">
    <div class="cat-card__head stack stack-xs" data-depth="40">
      <p class="eyebrow">${ownershipLabel(category)}</p>
      <h3 class="t-d3" id="cat-detail-title">${name(category)}</h3>
    </div>
    <p class="cat-detail__desc" data-depth="12">${escapeHtml(category.description)}</p>
    ${types}
    ${founderMarkup(category)}
    ${hasPartners(category) ? partnersMarkup(category) : ''}
    ${actionsMarkup(category)}
    ${notice}
  </div>`;
}

/**
 * Render the rail and the first detail. `initial` is a category slug.
 * `onPick(slug, { changed })` runs when the visitor picks a category in the rail.
 * Returns { select(slug, { updateUrl }) , current }.
 */
export function initCategories({ rail, detail, announce, initial, onPick = () => {} }) {
  rail.innerHTML = railMarkup();
  const buttons = Array.from(rail.querySelectorAll('.cat-rail__item'));
  let current = null;

  function select(slug, { updateUrl = false, flip = false } = {}) {
    const category = categoryBySlug(slug);
    if (!category) return false;
    current = slug;
    buttons.forEach((b) => b.setAttribute('aria-current', String(b.dataset.slug === slug)));
    detail.innerHTML = detailMarkup(category, { flip });
    if (announce) announce.textContent = `Showing ${titleCase(category.name)}`;
    if (updateUrl) history.replaceState(null, '', `#${slug}`);
    return true;
  }

  rail.addEventListener('click', (event) => {
    const button = event.target.closest('.cat-rail__item');
    if (!button) return;
    const changed = button.dataset.slug !== current;
    if (changed) select(button.dataset.slug, { updateUrl: true, flip: true });
    onPick(button.dataset.slug, { changed });
  });

  select(categoryBySlug(initial) ? initial : CATEGORIES[0].slug);
  return { select, get current() { return current; } };
}
