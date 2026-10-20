/**
 * Partner profile (FR06, SRS screen 4; R4 services.md §7.7): one dialog per
 * page, opened from a "View Profile" button in a finder result or a category
 * card. It shows everything an approved PARTNERS entry holds (business,
 * service and types, service area, languages, licence and issuing body), the
 * independent-partner and commission notice first (CR02, CR17), then the
 * description and the inquiry link. The card around the trigger keeps the
 * WhatsApp "Introduce Me" button, whose message names the partner (FR18).
 * The trigger and the type names (profileTrigger, partnerTypeNames) live in
 * ../services-data.js, since the finder and the categories dialog render them too.
 *
 * Only ever rendered from config.js PARTNERS, which holds approved partners
 * only. No profile is shown for "Partner spot available" placeholders.
 */
import { PARTNERS, categoryBySlug } from '../../../assets/js/config.js';
import { escapeHtml } from '../../../core/chrome/chrome.js';
import { closeDialog, openDialog } from '../../../core/ui/ui-dialog.js';
import { partnerTypeNames } from '../services-data.js';

const ARROW = '<span class="btn__arrow" aria-hidden="true">→</span>';
const LANGUAGE_NAMES = Object.freeze({ en: 'English', fr: 'French' });
const languageName = (code) => LANGUAGE_NAMES[code] || String(code).toUpperCase();

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
