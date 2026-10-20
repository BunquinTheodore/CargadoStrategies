/**
 * Partner profile (FR06, SRS screen 4; R4 services.md §7.7): one dialog per
 * page, opened from a "View Profile" button in a finder result or a category
 * card. It shows everything an approved PARTNERS entry holds (business,
 * service and types, service area, languages, licence and issuing body), the
 * independent-partner and commission notice first (CR02, CR17), then the
 * description and the inquiry link. The card around the trigger keeps the
 * WhatsApp "Introduce Me" button, whose message names the partner (FR18).
 *
 * Only ever rendered from config.js PARTNERS, which holds approved partners
 * only. No profile is shown for "Partner spot available" placeholders.
 */
import { PARTNERS, categoryBySlug } from './config.js';
import { escapeHtml } from './chrome.js';
import { closeDialog, openDialog } from './ui-dialog.js';

const ARROW = '<span class="btn__arrow" aria-hidden="true">→</span>';
const LANGUAGE_NAMES = Object.freeze({ en: 'English', fr: 'French' });
const languageName = (code) => LANGUAGE_NAMES[code] || String(code).toUpperCase();

/** Type names of a partner within its category, e.g. "Family, Real estate". */
export function partnerTypeNames(category, partner) {
  return (partner.types || [])
    .map((slug) => category.types.find((t) => t.slug === slug)?.name)
    .filter(Boolean)
    .join(', ');
}

function fact(term, value) {
  return value ? `<div><dt>${term}</dt><dd>${escapeHtml(value)}</dd></div>` : '';
}

function factsMarkup(partner, category) {
  const types = partnerTypeNames(category, partner);
  const area = partner.serviceArea || [partner.city, partner.province].filter(Boolean).join(', ');
  return `
    <dl class="profile__facts">
      ${fact('Service', [category.name, types].filter(Boolean).join(' · '))}
      ${fact('Service area', area)}
      ${fact('Languages', (partner.languages || []).map(languageName).join(', '))}
      ${fact('Licence or credential', partner.credential || 'Not applicable to this service')}
      ${fact('Issued by', partner.issuingBody)}
    </dl>`;
}

/** The "View Profile" trigger inside a result or a partner card. */
export function profileTrigger(partner, category) {
  const index = PARTNERS.indexOf(partner);
  return `<button class="link-btn profile__open" type="button" aria-haspopup="dialog" aria-controls="profile-dialog"
    data-partner="${index}" data-category="${escapeHtml(category.slug)}">View Profile<span class="visually-hidden"> of ${escapeHtml(partner.business)}</span></button>`;
}

/** The dialog body: notice → facts → description → inquiry link. */
export function profileBody(partner, category) {
  const e = escapeHtml;
  const business = e(partner.business);
  return `
    <p class="fineprint profile__notice">${business} is an independent business, responsible for its own licence and advice.
      Listed by distance only; a listing is not a recommendation or an endorsement.
      Cargado Strategies may receive a commission if you become their client.</p>
    ${factsMarkup(partner, category)}
    ${partner.description ? `<p class="profile__desc">${e(partner.description)}</p>` : ''}
    <a class="link" href="#inquiry" data-inquiry-category="${e(category.slug)}" data-profile-inquiry>Send an Inquiry ${ARROW}<span class="visually-hidden"> about ${business}</span></a>`;
}

/**
 * Wire every "View Profile" button on the page to `dialog`.
 * `onInquiry(slug)` runs after the dialog closes when the visitor picks "Send an Inquiry".
 */
export function initProfiles({ dialog, film, onInquiry = () => {} }) {
  if (!dialog) return;
  const title = dialog.querySelector('#profile-title');
  const body = dialog.querySelector('[data-profile-body]');

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.profile__open');
    if (!trigger) return;
    const partner = PARTNERS[Number(trigger.dataset.partner)];
    const category = categoryBySlug(trigger.dataset.category);
    if (!partner || !category) return;
    title.textContent = partner.business;
    body.innerHTML = profileBody(partner, category);
    openDialog(dialog, { trigger, film });
  });

  body.addEventListener('click', (event) => {
    const link = event.target.closest('[data-profile-inquiry]');
    if (!link) return;
    event.preventDefault();
    closeDialog(dialog, { returnFocus: false });
    onInquiry(link.dataset.inquiryCategory);
  });
}
