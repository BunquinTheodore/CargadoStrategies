/**
 * Services page constants shared by the finder, the categories rail and the
 * inquiry form. The founder's own businesses (CR13) each have their own scene.
 */
import { CATEGORIES } from './config.js';
import { placeholderCard } from './chrome.js';

/** Category slug → the founder's own offer on this page (names are titles: Title Case). */
export const FOUNDER_OFFERS = Object.freeze({
  insurance: Object.freeze({ scene: 'ours-insurance', name: 'The Family Protection Review' }),
  'business-strategy': Object.freeze({ scene: 'ours-strategy', name: 'The 30-Day Cash-Flow Clean-Up' }),
  outsourcing: Object.freeze({ scene: 'ours-outsourcing', name: 'Your Back-Office Team' }),
});

export const isOurs = (category) => category.ownership === 'founder' || category.ownership === 'both';
export const hasPartners = (category) => category.ownership === 'partner' || category.ownership === 'both';

/** Categories split for rails and selects: ours (founder or both) vs partner network. */
export const OURS = Object.freeze(CATEGORIES.filter(isOurs));
export const PARTNER_ONLY = Object.freeze(CATEGORIES.filter((c) => c.ownership === 'partner'));

/** WhatsApp request line for the founder's own services: ask her, never "find someone" (CR13). */
export const FOUNDER_REQUEST = "I'd like to ask about this service.";

/**
 * The shared "Partner spot available" card (chrome.js) titles itself with an h3.
 * On this page it sits under an h3 (category card, finder results), so its
 * title steps down to an h4 to keep the heading outline in order.
 */
export const subPlaceholderCard = (category) => placeholderCard({ category, level: 4 });

/** Page key used in WhatsApp messages. */
export const PAGE = 'services';
