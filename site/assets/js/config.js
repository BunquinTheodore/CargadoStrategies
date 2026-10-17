/**
 * Site-wide configuration for Cargado Strategies.
 *
 * Everything the founder may need to change lives here. Values that are not
 * confirmed yet are marked TODO(founder) and must stay visibly provisional on
 * the published pages (render them with the .ph placeholder style).
 */

export const SITE_NAME = 'Cargado Strategies';
export const TAGLINE = 'Connected by Purpose. United in Service.';

/** One business number, shared by the website and the Facebook page (FR18, FR20). */
export const PHONE = Object.freeze({
  display: '+1 (204) 869 2508',
  e164: '+12048692508',
  whatsapp: '12048692508',
});

export const WHATSAPP_BASE = `https://wa.me/${PHONE.whatsapp}`;

/**
 * TODO(founder): replace with the Cargado Strategies Facebook page URL.
 * Until then the link opens Facebook's home page; FACEBOOK_IS_PLACEHOLDER lets
 * pages show a [Facebook page link to confirm] note where useful.
 */
export const FACEBOOK_URL = 'https://www.facebook.com/';
export const FACEBOOK_IS_PLACEHOLDER = true;

/**
 * TODO(founder): company email on the Cargado domain (FR34). Leave empty until
 * it exists; forms then fall back to WhatsApp, and pages show the label below.
 */
export const CONTACT_EMAIL = '';
export const CONTACT_EMAIL_LABEL = CONTACT_EMAIL || '[company email]';

/**
 * Home page video (FR24). Empty url = "Founder video coming soon" state.
 * captions: WebVTT file url. poster: image url. source: 'stock' | 'founder'.
 */
export const VIDEO = Object.freeze({
  url: '',
  captions: '',
  poster: '',
  source: 'stock',
});

/** Main navigation, in order, in Title Case. `key` matches <body data-page="…">. */
export const NAV = Object.freeze([
  { key: 'home', label: 'Home', href: 'index.html' },
  { key: 'services', label: 'Services', href: 'services.html' },
  { key: 'story', label: 'Our Story', href: 'story.html' },
  { key: 'partners', label: 'Become a Partner', href: 'partners.html' },
]);

/** Human page names used in WhatsApp messages and the HUD. */
export const PAGE_NAMES = Object.freeze({
  home: 'Home',
  services: 'Services',
  story: 'Our story',
  partners: 'Become a partner',
  legal: 'Legal',
});

/**
 * Legal page sections. The legal page uses these ids as scene ids so that
 * footer links like legal.html#privacy deep-link into the right scene.
 * 'qa' is the exception: the Q&A scene is #faq and its eyebrow carries
 * id="qa", so legal.html#qa still lands in that scene.
 */
export const LEGAL_LINKS = Object.freeze([
  { id: 'disclosure', label: 'Disclosure' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'terms', label: 'Terms' },
  { id: 'conduct', label: 'Partner code of conduct' },
  { id: 'qa', label: 'Q&A' },
]);

const type = (slug, name) => Object.freeze({ slug, name });

/**
 * Partner categories (FR03). Admin can extend this list; every category uses
 * the same finder and the same Services page section.
 *
 * ownership:
 *   'founder' – offered only by the founder's own businesses (CR13)
 *   'partner' – offered only by independent partners
 *   'both'    – the founder's business plus independent partners
 */
export const CATEGORIES = Object.freeze([
  {
    slug: 'insurance',
    name: 'Insurance',
    description:
      'Life, health, home and business cover. The founder is an agent of a separate insurance company, and independent partners can also be listed.',
    ownership: 'both',
    types: [type('life', 'Life'), type('health', 'Health'), type('home', 'Home'), type('business', 'Business')],
  },
  {
    slug: 'business-strategy',
    name: 'Business strategy',
    description:
      'The founder’s own finance and operations strategy service for business owners. Strategy and coaching only, not licensed accounting, tax or investment advice.',
    ownership: 'founder',
    types: [],
  },
  {
    slug: 'outsourcing',
    name: 'Outsourcing',
    description: 'Back-office and support roles supplied by Cargado Strategies itself.',
    ownership: 'founder',
    types: [],
  },
  {
    slug: 'manufacturing',
    name: 'Manufacturing',
    description: 'Independent manufacturers that can make, source or package your product.',
    ownership: 'partner',
    types: [
      type('apparel', 'Apparel'),
      type('food-and-drink', 'Food and drink'),
      type('electronics', 'Electronics'),
      type('packaging', 'Packaging'),
      type('furniture', 'Furniture'),
    ],
  },
  {
    slug: 'legal',
    name: 'Legal',
    description: 'Independent lawyers and legal professionals, listed by distance only. A listing is not a recommendation.',
    ownership: 'partner',
    types: [
      type('real-estate', 'Real estate'),
      type('family', 'Family'),
      type('immigration', 'Immigration'),
      type('business', 'Business'),
      type('wills-and-estates', 'Wills and estates'),
    ],
  },
  {
    slug: 'mortgage',
    name: 'Mortgage',
    description: 'Independent mortgage professionals for buying, renewing or refinancing a home.',
    ownership: 'partner',
    types: [],
  },
  {
    slug: 'real-estate',
    name: 'Real estate',
    description: 'Independent real estate professionals for buying, selling or renting.',
    ownership: 'partner',
    types: [],
  },
  {
    slug: 'accounting-and-tax',
    name: 'Accounting and tax',
    description: 'Independent accountants, bookkeepers and tax preparers for people and businesses.',
    ownership: 'partner',
    types: [],
  },
  {
    slug: 'financial-planning',
    name: 'Financial planning',
    description: 'Independent financial planners for saving, retirement and family plans.',
    ownership: 'partner',
    types: [],
  },
]);

/** Find a category by slug; returns undefined when unknown. */
export const categoryBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug);

/**
 * Approved partners only (FR12, CR16). Never add invented people or firms.
 *
 * When the Cargado team approves a partner, add an entry like:
 * {
 *   id: 'unique-id',
 *   business: 'Registered business name',
 *   name: 'Contact name',
 *   category: 'legal',                 // a CATEGORIES slug
 *   types: ['family', 'real-estate'],  // type slugs of that category
 *   city: 'Winnipeg', province: 'MB',
 *   lat: 49.8951, lon: -97.1384,       // coordinates drive distance sorting
 *   serviceArea: 'Winnipeg and area',
 *   credential: 'Licence or credential number',
 *   issuingBody: 'Regulator or issuing body',
 *   whatsapp: '1204…',                 // optional, digits only
 *   description: 'One or two plain sentences.',
 *   languages: ['en'],
 * }
 * While this list is empty every category shows "Partner spot available" cards.
 */
export const PARTNERS = Object.freeze([]);
