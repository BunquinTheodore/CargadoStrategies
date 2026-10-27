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
/** The Facebook / Messenger page name (owner, 2026-10-18). The page URL is still to confirm. */
export const FACEBOOK_PAGE_NAME = 'CarGado Wealth Strategies';

/** Business address (owner, 2026-10-18), shown in the footer and menu contact list. */
export const ADDRESS = Object.freeze({
  street: '1210 Chamberlain Ave',
  city: 'Winnipeg',
  province: 'MB',
  postal: 'R2X 1E7',
  country: 'Canada',
});
export const ADDRESS_LINE = `${ADDRESS.street}, ${ADDRESS.city}, ${ADDRESS.province} ${ADDRESS.postal}`;

/** Business email (owner, 2026-10-25; Namecheap forwards it to the owner's inbox). Empty = forms fall back to WhatsApp and pages show the label below. */
export const CONTACT_EMAIL = 'info@cargadostrategies.com';
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

/**
 * Round 5 switches and proof slots. Every proof key below drives the
 * [data-when="KEY"] slots (DIRECTION C19): a slot renders only while its value
 * is truthy (or in review mode, ?review=1). Empty means "not real yet": use
 * null / '' / false, never [] or {} (those are truthy). Never invent values.
 */

/** Home hero headline: 'network' ("The Right Professional, Near You.") or 'triad' ("Protect. Plan. Delegate."). */
export const HERO_VARIANT = 'network';

/** TODO(founder): the founder's first and last name. Empty = the [First name] / [Last name] placeholders. */
export const FOUNDER_NAME = 'Lee';
export const FOUNDER_LAST_NAME = 'Holgado';
export const FOUNDER_NAME_LABEL = FOUNDER_NAME || '[First name]';

/**
 * The founder's real photos (owner, 2026-10-25), one per mood (spec §6.7): navy suit
 * (Home avatars, Services ours-insurance), cream suit (Story), seated poster (Contact).
 * Paths are filled by tools/gen-images.mjs (plan Task 3); '' = that slot stays hidden.
 * Never a stock or generated stand-in face.
 */
export const FOUNDER_PHOTOS = Object.freeze({
  navy: 'assets/img/founder/navy-800.webp',
  cream: 'assets/img/founder/cream-800.webp',
  poster: 'assets/img/founder/poster-800.webp',
});

/** The default portrait for [data-when="FOUNDER_PHOTO"] slots. Empty = the typographic portrait only. */
export const FOUNDER_PHOTO = FOUNDER_PHOTOS.navy;

/**
 * TODO(founder): Lee's own signature mark (an SVG url she supplies), the H4
 * fallback while FOUNDER_PHOTO is empty. Never a drawn or font-made imitation.
 * Empty = hidden ([data-when="FOUNDER_SIGNATURE"]).
 */
export const FOUNDER_SIGNATURE = '';

/** The Services finder shows once this many approved partners exist; below it, the concierge (C40). */
export const FINDER_MIN_PARTNERS = 3;

/** The footer and menu "Sound" and "Motion" switches (C37). */
export const FOOTER_SWITCHES = false;

/**
 * TODO(founder): real proof numbers only, e.g.
 * [{ value: '120', label: 'Introductions made' }, …]. null = hidden.
 */
export const STATS = null;

/** TODO(founder): the real Facebook rating, e.g. { value: '4.9', count: 37, url: '…' }. null = hidden. */
export const RATING = null;

/** TODO(founder): real client quotes with permission, e.g. [{ text: '…', name: 'First name, City' }]. null = hidden. */
export const QUOTES = null;

/** TODO(founder): true once founding partner spots are live and the "[n] of [2] open" count is real. */
export const FOUNDING_LIVE = false;

/** The founder video url (from VIDEO above). Empty = no "Watch 1 Min" link and no video dialog. */
export const VIDEO_URL = VIDEO.url;

/** Main navigation, in order, in Title Case. `key` matches <body data-page="…">. */
export const NAV = Object.freeze([
  { key: 'home', label: 'Home', href: 'index.html' },
  { key: 'services', label: 'Services', href: 'services.html' },
  { key: 'story', label: 'Story', href: 'story.html' },
  { key: 'partners', label: 'Become a Partner', href: 'partners.html' },
]);

/** Human page names used in WhatsApp messages and the HUD. */
export const PAGE_NAMES = Object.freeze({
  home: 'Home',
  services: 'Services',
  story: 'Story',
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
    slug: 'web-design',
    name: 'Web Design',
    description: 'Websites designed, built and kept up to date by Cargado Strategies, made to work well on any phone.',
    ownership: 'founder',
    types: [],
  },
  {
    slug: 'graphics',
    name: 'Graphics',
    description: 'Logos, social media posts, flyers and print designs made by Cargado Strategies.',
    ownership: 'founder',
    types: [],
  },
  {
    slug: 'virtual-assistant',
    name: 'Virtual Assistant',
    description: 'A virtual assistant from Cargado Strategies for email, scheduling, data entry and everyday admin.',
    ownership: 'founder',
    types: [],
  },
  {
    slug: 'software-development',
    name: 'Software Development',
    description: 'Custom apps, online tools and automations built by Cargado Strategies for your business.',
    ownership: 'founder',
    types: [],
  },
  {
    slug: 'export-import',
    name: 'Export and Import',
    description: 'Help finding suppliers and coordinating shipping and paperwork for goods moving into and out of Canada.',
    ownership: 'founder',
    types: [],
  },
  {
    slug: 'contractor',
    name: 'Contractor',
    description: 'Home and property work arranged by Cargado Strategies: homecare cleaning, roofing, cleaning and gardening.',
    ownership: 'founder',
    types: [],
    items: Object.freeze(['Homecare Cleaning Services', 'Roofing', 'Cleaning', 'Gardening']),
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
 * Insurance inquiries open the founder's policy review site in a new tab (owner, 2026-10-25).
 * The clean link only (no fbclid / sessionId). Empty = insurance CTAs keep the WhatsApp sheet.
 */
export const INSURANCE_INQUIRY_URL = 'https://policyreview.leeholgado.com/';

/** One orbit circle per main group; the preview is the category's own one-line description. */
const orbitGroup = (slug, name, href) => Object.freeze({ slug, name, href, preview: categoryBySlug(slug).description });

/**
 * The services orbit (Home + Services, spec §6.3): the main groups round the mark, in order.
 * Existing groups go to their scenes; the new ones deep-link by category slug (a scene alias).
 */
export const ORBIT_GROUPS = Object.freeze([
  orbitGroup('insurance', 'Insurance', 'services.html#ours-insurance'),
  orbitGroup('business-strategy', 'Business Strategy', 'services.html#ours-strategy'),
  orbitGroup('outsourcing', 'Outsourcing', 'services.html#ours-outsourcing'),
  orbitGroup('web-design', 'Web Design', 'services.html#web-design'),
  orbitGroup('graphics', 'Graphics', 'services.html#graphics'),
  orbitGroup('virtual-assistant', 'Virtual Assistant', 'services.html#virtual-assistant'),
  orbitGroup('software-development', 'Software Development', 'services.html#software-development'),
  orbitGroup('export-import', 'Export and Import', 'services.html#export-import'),
  orbitGroup('contractor', 'Contractor', 'services.html#contractor'),
  Object.freeze({
    slug: 'partner-network',
    name: 'Partner Network',
    href: 'services.html#finder',
    preview: 'Independent local professionals, listed by distance only.',
  }),
]);

/** The orbit legend (owner wording, 2026-10-25). The scene wraps "Ours" and "Partners" in <strong>. */
export const ORBIT_LEGEND = 'Ours means Cargado Strategies provides it directly. Partners are independent local professionals.';

/**
 * Free consultation booking (spec §6.4). Minutes are local Winnipeg time from midnight:
 * 930 = 3:30 pm (first slot), 1260 = 9:00 pm (end, so the last slot starts 8:50 pm).
 */
export const BOOKING = Object.freeze({
  timeZone: 'America/Winnipeg',
  startMinutes: 930,
  endMinutes: 1260,
  slotMinutes: 10,
  leadHours: 2,
  horizonDays: 60,
  meetingLabel: 'Free Consultation',
  durationLabel: '10 minutes',
});

/**
 * Firebase web config (owner, 2026-10-25). Public by design: access is guarded by
 * firestore.rules, and server secrets live only in Vercel env vars. No measurementId:
 * the site never loads Analytics. Blank the values to show "Accounts are coming soon".
 */
export const FIREBASE = Object.freeze({
  apiKey: 'AIzaSyCqK6UhrFt5dZdvn1aRyWpixmc26NsuS00',
  authDomain: 'cargadostrategies-b7dfd.firebaseapp.com',
  projectId: 'cargadostrategies-b7dfd',
  storageBucket: 'cargadostrategies-b7dfd.firebasestorage.app',
  messagingSenderId: '161389811113',
  appId: '1:161389811113:web:3fbba4e20c37fc05b9e0b8',
});

const FIREBASE_REQUIRED = ['apiKey', 'authDomain', 'projectId', 'appId'];

/** True when the Firebase keys accounts need are all filled in. */
export const isFirebaseConfigured = (firebase = FIREBASE) =>
  FIREBASE_REQUIRED.every((key) => typeof firebase?.[key] === 'string' && firebase[key].trim() !== '');

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
