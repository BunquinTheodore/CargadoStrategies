/**
 * WhatsApp click-to-chat message builders (FR18, FR19, CR10, CR11).
 *
 * Every message is written from the visitor's side, names the page or
 * category, asks for the service and the city/province, and says why the
 * city is needed. Nothing is sent until the visitor taps send in WhatsApp.
 */
import { WHATSAPP_BASE, SITE_NAME, PAGE_NAMES } from './config.js';

const GREETING = `Hi ${SITE_NAME},`;
const INTRO_REQUEST = "I'd like an introduction.";
const CITY_REASON = '(so you can introduce me to someone close to me)';
const BLANK = '…';

/** Build a wa.me link with the given prefilled text. */
export function waLink(text) {
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`;
}

const lines = (...parts) => parts.filter(Boolean).join('\n');

const serviceLine = (service) => `What I need help with: ${service || BLANK}`;
const cityLine = (city) => `My city and province ${CITY_REASON}: ${city || BLANK}`;

/** Generic message for a page's WhatsApp buttons. `page` is a PAGE_NAMES key or a label. */
export function pageMessage(page = 'home') {
  const name = PAGE_NAMES[page] || page;
  return lines(
    GREETING,
    `I'm on the ${name} page of your website.`,
    serviceLine(),
    cityLine(),
  );
}

/**
 * Message for a chosen category (and optional type) plus city, e.g. from the
 * home intro form or a category section. `request` replaces the default
 * "I'd like an introduction." (use it for the founder's own services).
 */
export function categoryMessage({ category = '', type = '', city = '', page = '', request = INTRO_REQUEST } = {}) {
  const service = [category, type].filter(Boolean).join(' · ');
  const from = page ? `I'm on the ${PAGE_NAMES[page] || page} page of your website.` : '';
  return lines(
    GREETING,
    from,
    request,
    serviceLine(service),
    cityLine(city),
  );
}

/**
 * Message for the finder when no partner is listed nearby (FR27): asks the
 * team to find someone, with what the visitor already searched for.
 */
export function finderRequestMessage({ category = '', type = '', place = '' } = {}) {
  const service = [category, type].filter(Boolean).join(' · ');
  return lines(
    GREETING,
    `I used the partner finder on the ${PAGE_NAMES.services} page of your website and no one is listed near me yet. Can you find someone?`,
    serviceLine(service),
    cityLine(place),
  );
}

/** Question from a professional on the Become a partner page (the city is asked to talk about partner spots). */
export function partnerQuestionMessage() {
  return lines(
    GREETING,
    `I'm on the ${PAGE_NAMES.partners} page and have a question about joining the partner network.`,
    'My service: …',
    'My city and province (so you can tell me about partner spots near me): …',
  );
}

/** Convenience: full link for a page's floating button / bottom bar. */
export const pageLink = (page) => waLink(pageMessage(page));
