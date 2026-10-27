/**
 * Services page constants shared by the finder, the categories dialog and the
 * inquiry form, plus the partner renderers more than one section needs (the
 * "View Profile" trigger and the type names; the profile dialog itself is
 * sections/services/profile-dialog). The founder's own businesses (CR13) each
 * have their own scene (Graphics and Virtual Assistant share #ours-creative).
 */
import { CATEGORIES, INSURANCE_INQUIRY_URL, PARTNERS } from '../../assets/js/config.js';
import { escapeHtml, placeholderCard } from '../../core/chrome/chrome.js';

/** The CTA of the services Cargado Strategies delivers itself (v2 spec §6.1): no prices, a consultation first. */
export const BOOK_CTA = 'Book a Free Consultation';

/** The Contact page's booking scene, with the service preselected. */
export const bookingHref = (slug) => `contact.html?service=${encodeURIComponent(slug)}#book`;

const bookingOffer = (slug, scene, name) => Object.freeze({ scene, name, cta: BOOK_CTA, href: bookingHref(slug) });

/**
 * Category slug → the founder's own offer on this page (names are titles: Title Case).
 * `href` (the v2 services): the CTA books a consultation instead of opening the WhatsApp sheet.
 */
export const FOUNDER_OFFERS = Object.freeze({
  insurance: Object.freeze({ scene: 'ours-insurance', name: 'Family Protection Review', cta: 'Ask About Insurance' }),
  'business-strategy': Object.freeze({ scene: 'ours-strategy', name: 'The 30-Day Cash-Flow Clean-Up', cta: 'Ask About the Clean-Up' }),
  outsourcing: Object.freeze({ scene: 'ours-outsourcing', name: 'Your Back-Office Team', cta: 'Ask About Outsourcing' }),
  'web-design': bookingOffer('web-design', 'ours-web', 'Web Design'),
  graphics: bookingOffer('graphics', 'ours-creative', 'Graphics'),
  'virtual-assistant': bookingOffer('virtual-assistant', 'ours-creative', 'Virtual Assistant'),
  'software-development': bookingOffer('software-development', 'ours-software', 'Software Development'),
  'export-import': bookingOffer('export-import', 'ours-trade', 'Export and Import'),
  contractor: bookingOffer('contractor', 'ours-contractor', 'Contractor Services'),
});

/** Insurance inquiries open the policy review site in a new tab (spec §6.1b), with this hint beside the link. */
export const INSURANCE_HINT = 'Opens the policy review site';

/** The insurance redirect, or null when the URL is empty (the insurance CTAs then keep today's behaviour). */
export const insuranceLink = (url = INSURANCE_INQUIRY_URL) => (url ? { href: url, hint: INSURANCE_HINT } : null);

export const isOurs = (category) => category.ownership === 'founder' || category.ownership === 'both';
export const hasPartners = (category) => category.ownership === 'partner' || category.ownership === 'both';

/** Categories split for rails and selects: ours (founder or both) vs partner network. */
export const OURS = Object.freeze(CATEGORIES.filter(isOurs));
export const PARTNER_ONLY = Object.freeze(CATEGORIES.filter((c) => c.ownership === 'partner'));

/** WhatsApp request line for the founder's own services: ask her, never "find someone" (CR13). */
export const FOUNDER_REQUEST = "I'd like to ask about this service.";

/**
 * The shared "Partner spot available" card (chrome.js) titles itself with an h3.
 * On this page it sits under an h3 (category detail, finder results), so its
 * title steps down to an h4 to keep the heading outline in order.
 */
export const subPlaceholderCard = (category) => placeholderCard({ category, level: 4 });

/** Page key used in WhatsApp messages. */
export const PAGE = 'services';

/** The phone layout of this page (DIRECTION §4.2 band "phone"). */
export const PHONE_QUERY = '(max-width: 759px)';

/** Type names of a partner within its category, e.g. "Family, Real estate". */
export function partnerTypeNames(category, partner) {
  return (partner.types || [])
    .map((slug) => category.types.find((t) => t.slug === slug)?.name)
    .filter(Boolean)
    .join(', ');
}

/** The "View Profile" trigger inside a result or a partner card. */
export function profileTrigger(partner, category) {
  const index = PARTNERS.indexOf(partner);
  return `<button class="link-btn profile__open" type="button" aria-haspopup="dialog" aria-controls="profile-dialog"
    data-partner="${index}" data-category="${escapeHtml(category.slug)}">View Profile<span class="visually-hidden"> of ${escapeHtml(partner.business)}</span></button>`;
}
