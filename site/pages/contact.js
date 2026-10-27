/**
 * Contact (contact.html): 2 scenes + credits on the Round 5 cut engine (spec §6.4).
 *
 *   #book   sections/contact/book/Book.js   the free consultation picker beside the founder's poster
 *   #reach  WhatsApp, email, the Facebook page and the address, from config (no Call item)
 *
 * Order (api.md §2): fill the copy that depends on config first, then boot(),
 * then mount the sections in the same tick. `?service=<slug>` preselects the
 * service in the booking form.
 */
import { boot } from '../core/main.js';
import { mountSections } from '../core/Section.js';
import {
  ADDRESS_LINE, CONTACT_EMAIL, CONTACT_EMAIL_LABEL, FACEBOOK_PAGE_NAME, FACEBOOK_URL, FOUNDER_LAST_NAME, FOUNDER_NAME,
  FOUNDER_PHOTOS, PHONE, SITE_NAME,
} from '../assets/js/config.js';
import { escapeHtml } from '../core/chrome/chrome.js';
import { buildIntro, pageLink, waLink } from '../core/chrome/whatsapp.js';
import { Book } from '../sections/contact/book/Book.js';

const PAGE = 'contact';
const SERVICE_PARAM = 'service';
/** The poster's own size (assets/img/founder/poster-*.webp are capped at the 480 px source). */
const POSTER_SIZE = Object.freeze({ width: 480, height: 720 });
const NEW_TAB = 'target="_blank" rel="noopener"';
const NEW_TAB_NOTE = '<span class="visually-hidden"> (opens in a new tab)</span>';

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- copy that depends on config ---------- */

/** #book: the seated poster, shown whole (it carries its own logo and tagline). */
function fillPoster() {
  if (!FOUNDER_PHOTOS.poster) return;
  const fullName = [FOUNDER_NAME, FOUNDER_LAST_NAME].filter(Boolean).join(' ');
  $$('[data-book-poster]').forEach((slot) => {
    const img = new Image(POSTER_SIZE.width, POSTER_SIZE.height);
    img.src = FOUNDER_PHOTOS.poster;
    img.alt = fullName ? `${fullName}, founder of ${SITE_NAME}` : `The founder of ${SITE_NAME}`;
    img.decoding = 'async';
    slot.replaceChildren(img);
    slot.hidden = false;
  });
}

const row = ({ href, attrs = '', title, meta, note = '' }) =>
  `<li><a class="row reach__row" href="${href}" ${attrs}><span class="row__title">${title}</span>`
  + `<span class="row__meta">${meta}</span><span class="row__arrow" aria-hidden="true">→</span>${note}</a></li>`;

/** #reach: the same four ways in as the footer, as rows. */
function fillReach() {
  const email = CONTACT_EMAIL
    ? row({ href: `mailto:${escapeHtml(CONTACT_EMAIL)}`, title: 'Email', meta: escapeHtml(CONTACT_EMAIL) })
    : `<li><p class="row reach__row"><span class="row__title">Email</span><span class="row__meta ph">${escapeHtml(CONTACT_EMAIL_LABEL)}</span></p></li>`;
  const maps = `https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(ADDRESS_LINE)}`;
  const rows = [
    row({ href: pageLink(PAGE), attrs: `${NEW_TAB} data-wa-sheet data-context="${PAGE}"`, title: 'WhatsApp', meta: `<span class="num">${PHONE.display}</span>`, note: NEW_TAB_NOTE }),
    email,
    row({ href: FACEBOOK_URL, attrs: NEW_TAB, title: 'Facebook', meta: escapeHtml(FACEBOOK_PAGE_NAME), note: NEW_TAB_NOTE }),
    row({ href: maps, attrs: NEW_TAB, title: 'Address', meta: escapeHtml(ADDRESS_LINE), note: NEW_TAB_NOTE }),
  ];
  $$('[data-reach-list]').forEach((list) => { list.innerHTML = rows.join(''); });
}

/** The no-JS hrefs of the sheet triggers: the message the sheet would write. */
function fillWhatsAppLinks() {
  $$('a[data-wa-sheet][href^="https://wa.me/"]').forEach((a) => {
    const { need = '', context = PAGE } = a.dataset;
    a.href = waLink(buildIntro({ need, context }));
  });
}

function requestedService() {
  return new URLSearchParams(location.search).get(SERVICE_PARAM) || '';
}

/* ---------- start ---------- */

fillPoster();
fillReach();
fillWhatsAppLinks();
const booted = boot({ page: PAGE });
const { sfx } = booted;
const sound = (name) => { if (sfx.has(name)) sfx.play(name); };
mountSections([Book], { ...booted, sound, service: requestedService() });
