/**
 * Partner profile (FR06, SRS screen 4): an expandable panel inside a finder
 * result or a category card. It shows everything an approved PARTNERS entry
 * holds (business, service and types, service area, description, languages,
 * licence and issuing body), the independent-partner and commission notices
 * (CR02, CR17) and the inquiry link. The card around it keeps the WhatsApp
 * "Introduce me" button, whose message names the partner (FR18), visible
 * without opening the profile.
 *
 * Only ever rendered from config.js PARTNERS, which holds approved partners
 * only. No profile is shown for "Partner spot available" placeholders.
 */
import { escapeHtml } from './chrome.js';

const ARROW = '<span class="btn__arrow" aria-hidden="true">→</span>';
const LANGUAGE_NAMES = Object.freeze({ en: 'English', fr: 'French' });
const NOTICE_PH = '<span class="ph">[Wording to be confirmed by counsel]</span>';

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

/** The profile panel; its inquiry link preselects the partner's category. */
export function profileMarkup(partner, category) {
  const e = escapeHtml;
  const business = e(partner.business);
  return `
  <details class="profile">
    <summary class="profile__toggle">View Profile<span class="visually-hidden"> of ${business}</span></summary>
    <div class="profile__body stack stack-s">
      ${partner.description ? `<p class="profile__desc">${e(partner.description)}</p>` : ''}
      ${factsMarkup(partner, category)}
      <p class="notice profile__notice">${business} is an independent business, responsible for its own licence and advice.
        Listed by distance only; a listing is not a recommendation or an endorsement.
        Cargado Strategies may receive a commission if you become their client. ${NOTICE_PH}</p>
      <a class="btn btn--link" href="#inquiry" data-inquiry-category="${e(category.slug)}">Send an Inquiry About ${business} ${ARROW}</a>
    </div>
  </details>`;
}
