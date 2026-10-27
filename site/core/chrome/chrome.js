/**
 * Site chrome (DIRECTION §6.2-§6.4, C2, C3, C19, C37): skip link, header,
 * phone menu, credits footer, footer switches, proof slots and review mode.
 *
 *   const chrome = initChrome({ page });   // → { header, onMenuToggle(cb), closeMenu() }
 *
 * - The header is in every page's HTML (HTML-first, no layout shift); this
 *   module wires it, and draws it only when a page has none.
 * - Header: the logo mark (v2 §6.5) + wordmark, Home · Services · Story · For
 *   Professionals · Contact, the account button (account-button.js: hidden until
 *   Firebase is configured). No WhatsApp button (owner, 2026-10-26): the sheet
 *   opens from the page CTAs, the menu and the footer. Phones: mark, account, Menu.
 * - Menu: a native <dialog> (focus trapped by showModal, Escape closes): the
 *   pages as rows, then call, email, WhatsApp and Facebook, then the switches.
 * - Footer ([data-footer] in #credits): contact row, link columns, the fine
 *   print (verbatim), the tagline (once per page, here only), switches and ©.
 * - Switches: "Sound: On / Off" (localStorage cs-sound, document `cs:sound`)
 *   and "Motion: Full / Reduced" (setMotionPref reloads, keeping the hash).
 * - [data-monogram] slots get the C·W mark; [data-when="KEY"] renders only when
 *   config[KEY] is set or in review mode (?review=1, which also sets html.ph-loud).
 *
 * Every heading, title, button label and nav item it writes is Title Case.
 */
import * as CONFIG from '../../assets/js/config.js';
import { FACEBOOK_URL, PHONE, TAGLINE, SITE_NAME, CONTACT_EMAIL, CONTACT_EMAIL_LABEL, FOOTER_SWITCHES, FACEBOOK_PAGE_NAME, ADDRESS_LINE } from '../../assets/js/config.js';
import { pageLink, waLink } from './whatsapp.js';
import { titleCase } from '../lib/text-case.js';
import { prefersReducedMotion, setMotionPref } from '../engine/motion-pref.js';
import { initAccountButton } from './account-button.js';

const NEW_TAB = 'target="_blank" rel="noopener"';
const NEW_TAB_NOTE = '<span class="visually-hidden"> (opens in a new tab)</span>';
const SOUND_KEY = 'cs-sound';
const DESKTOP_NAV = '(min-width: 1024px)';
const REVIEW_PARAM = 'review';

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/** C and W monogram. Uses currentColor so it can sit on any field. */
export const MONOGRAM = '<svg class="monogram" viewBox="0 0 48 48" aria-hidden="true" focusable="false">'
  + '<path d="M37.4 10.6A19 19 0 1 0 37.4 37.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/>'
  + '<path d="M13.5 17 19.2 31.5 24 21.5 28.8 31.5 34.5 17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="miter" stroke-linecap="square"/>'
  + '</svg>';

const svg = (body) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
export const ICONS = Object.freeze({
  whatsapp: svg('<path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2Z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/><path d="M9.2 8.2c.3-.6.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .5-.1.6l-.5.6c-.1.2-.1.4 0 .5.6 1 1.4 1.8 2.5 2.4.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5 0 .6-.2 1.3-.8 1.6-.6.4-1.5.5-2.6.1-1.7-.6-3.4-2.1-4.3-3.8-.6-1.1-.7-2.2-.4-3Z" fill="currentColor"/>'),
  phone: svg('<path d="M6.6 3.5h2.6l1.3 4-1.9 1.3a11 11 0 0 0 6.6 6.6l1.3-1.9 4 1.3v2.6a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1Z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>'),
  mail: svg('<rect x="3.5" y="5.5" width="17" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.25"/><path d="m4 6.5 8 6.5 8-6.5" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>'),
  facebook: svg('<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.25"/><path d="M13.2 20.5v-6.7h2.2l.3-2.6h-2.5V9.6c0-.8.2-1.3 1.3-1.3h1.3V6c-.6-.1-1.3-.1-2-.1-2 0-3.3 1.2-3.3 3.4v1.9H8.3v2.6h2.2v6.7" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>'),
  pin: svg('<path d="M12 20.5s-6-5.6-6-10.3a6 6 0 0 1 12 0c0 4.7-6 10.3-6 10.3Z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/><circle cx="12" cy="10.2" r="2.2" fill="none" stroke="currentColor" stroke-width="1.25"/>'),
  close: svg('<path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>'),
});

/** The owner's logo mark (header and menu bar only; the footer and splash keep the monogram). */
const MARK_SRC = 'assets/img/brand/logo-mark';
export const BRAND_MARK = `<img class="brand__mark" src="${MARK_SRC}@2x.png" srcset="${MARK_SRC}@2x.png 2x, ${MARK_SRC}@3x.png 3x" alt="" width="41" height="40">`;
const ACCOUNT_LINK = '<a class="site-header__account" href="account.html" hidden data-account>Log In</a>';

const ARROW = '<span class="btn__arrow" aria-hidden="true">→</span>';

/** Header links after Home (v2: Contact joins the nav). */
export const HEADER_NAV = Object.freeze([
  { key: 'services', label: 'Services', href: 'services.html' },
  { key: 'story', label: 'Story', href: 'story.html' },
  { key: 'partners', label: 'Application', href: 'partners.html' },
  { key: 'contact', label: 'Contact', href: 'contact.html' },
]);
/** Menu and footer pages. */
export const MENU_PAGES = Object.freeze([
  { key: 'home', label: 'Home', href: 'index.html' },
  ...HEADER_NAV,
  { key: 'legal', label: 'Legal', href: 'legal.html' },
]);
const FOOTER_LINKS = Object.freeze([
  ...HEADER_NAV,
  { key: 'legal', label: 'Legal', href: 'legal.html' },
  { key: 'privacy', label: 'Privacy', href: 'legal.html#privacy' },
]);

const current = (key, page) => (key === page ? ' aria-current="page"' : '');
const sheetAttrs = (page) => `data-wa-sheet data-context="${escapeHtml(page)}"`;

/* ---------- header ---------- */

/** The header's inner HTML (also written into each page's HTML, so it paints with the page). */
export function headerHTML(page = 'home') {
  const links = [{ key: 'home', label: 'Home', href: 'index.html' }, ...HEADER_NAV].map(({ key, label, href }) =>
    `<li><a class="site-nav__link" href="${href}"${current(key, page)}>${titleCase(label)}</a></li>`).join('');
  return `
  <a class="brand" href="index.html" aria-label="${SITE_NAME}, home">${BRAND_MARK}<span class="brand__word">${SITE_NAME}</span></a>
  <nav class="site-nav" aria-label="Main"><ul class="site-nav__list">${links}</ul></nav>
  ${ACCOUNT_LINK}
  <button class="nav-toggle" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="menu">
    <span class="nav-toggle__label">Menu</span><span class="nav-toggle__icon" aria-hidden="true"></span>
  </button>`;
}

/* ---------- contact items, switches ---------- */

function contactItems(page) {
  const email = CONTACT_EMAIL
    ? `<a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${ICONS.mail}<span><span class="visually-hidden">Email: </span><span class="site-footer__email">${escapeHtml(CONTACT_EMAIL)}</span></span></a>`
    : `<span>${ICONS.mail}<span><span class="visually-hidden">Email: </span><span class="ph">${escapeHtml(CONTACT_EMAIL_LABEL)}</span></span></span>`;
  return [
    `<a href="${pageLink(page)}" ${NEW_TAB} ${sheetAttrs(page)}>${ICONS.whatsapp}<span>WhatsApp <span class="site-footer__num num">${PHONE.display}</span></span>${NEW_TAB_NOTE}</a>`,
    email,
    `<a href="${FACEBOOK_URL}" ${NEW_TAB}>${ICONS.facebook}<span><span class="visually-hidden">Facebook: </span>${escapeHtml(FACEBOOK_PAGE_NAME)}</span>${NEW_TAB_NOTE}</a>`,
    `<a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(ADDRESS_LINE)}" ${NEW_TAB}>${ICONS.pin}<span>${escapeHtml(ADDRESS_LINE)}</span>${NEW_TAB_NOTE}</a>`,
  ].map((item) => `<li>${item}</li>`).join('');
}

/** "Sound: On / Off" and "Motion: Full / Reduced" (C37). States are filled by syncSwitches(). */
export function switchesHTML() {
  if (FOOTER_SWITCHES === false) return '';
  const btn = (kind, value, name, label) =>
    `<button class="switches__btn" type="button" data-switch="${kind}" data-value="${value}" aria-pressed="false"><span class="visually-hidden">${name} </span>${label}</button>`;
  return `
  <div class="switches" role="group" aria-label="Preferences">
    <p class="switches__row"><span class="switches__name" aria-hidden="true">Sound</span>${btn('sound', 'on', 'Sound', 'On')}<span class="switches__sep" aria-hidden="true">/</span>${btn('sound', 'off', 'Sound', 'Off')}</p>
    <p class="switches__row"><span class="switches__name" aria-hidden="true">Motion</span>${btn('motion', 'full', 'Motion', 'Full')}<span class="switches__sep" aria-hidden="true">/</span>${btn('motion', 'reduced', 'Motion', 'Reduced')}</p>
  </div>`;
}

function soundOn() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true; // storage blocked: sound stays on for this page
  }
}

function setSound(on) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    /* storage blocked: the choice lasts for this page only (sfx hears the event) */
  }
  document.dispatchEvent(new CustomEvent('cs:sound', { detail: { on } }));
}

function syncSwitches(scope = document) {
  const states = { sound: soundOn() ? 'on' : 'off', motion: prefersReducedMotion() ? 'reduced' : 'full' };
  scope.querySelectorAll('.switches__btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(states[b.dataset.switch] === b.dataset.value));
  });
}

function onSwitchClick(event) {
  const btn = event.target.closest('.switches__btn');
  if (!btn || btn.getAttribute('aria-pressed') === 'true') return;
  if (btn.dataset.switch === 'sound') {
    setSound(btn.dataset.value === 'on');
    syncSwitches();
  } else if (btn.dataset.switch === 'motion') {
    if (!setMotionPref(btn.dataset.value)) syncSwitches();
  }
}

/* ---------- menu (C3) ---------- */

function menuHTML(page) {
  const rows = MENU_PAGES.map(({ key, label, href }) =>
    `<li><a class="row row--compact" href="${href}"${current(key, page)}><span class="row__title">${titleCase(label)}</span><span class="row__arrow" aria-hidden="true">→</span></a></li>`).join('');
  return `
  <div class="menu__bar">
    <a class="brand" href="index.html" aria-label="${SITE_NAME}, home">${BRAND_MARK}<span class="brand__word">${SITE_NAME}</span></a>
    <button class="nav-toggle menu__close" type="button" data-menu-close>Close ${ICONS.close}</button>
  </div>
  <div class="menu__body">
    <nav aria-label="Pages"><ul class="rows menu__rows">${rows}</ul></nav>
    <div class="stack">
      <ul class="menu__contact" aria-label="Contact">${contactItems(page)}</ul>
      ${switchesHTML()}
    </div>
  </div>`;
}

function createMenu(header, page, onToggle) {
  const toggle = header.querySelector('.nav-toggle');
  if (!toggle) return { close() {}, isOpen: () => false };
  const menu = document.createElement('dialog');
  menu.className = 'menu';
  menu.id = 'menu';
  menu.dataset.field = 'ink';
  menu.setAttribute('aria-label', 'Menu');
  menu.innerHTML = menuHTML(page);
  document.body.appendChild(menu);
  let restoreFocus = true;

  const set = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('nav-open', open);
    onToggle(open);
  };
  function open() {
    if (menu.open) return;
    restoreFocus = true;
    syncSwitches(menu);
    menu.showModal();
    set(true);
  }
  function close({ focus = true } = {}) {
    if (!menu.open) return;
    restoreFocus = focus;
    menu.close();
  }
  menu.addEventListener('close', () => {
    set(false);
    if (restoreFocus) toggle.focus({ preventScroll: true });
  });
  toggle.addEventListener('click', open);
  menu.addEventListener('click', (e) => {
    if (e.target === menu || e.target.closest('[data-menu-close]')) close();
    else if (e.target.closest('a')) close({ focus: false });   // a page link or the sheet trigger
  });
  menu.addEventListener('click', onSwitchClick);
  window.matchMedia(DESKTOP_NAV).addEventListener('change', (e) => { if (e.matches) close({ focus: false }); });
  return { close: () => close({ focus: false }), isOpen: () => menu.open };
}

/* ---------- footer (credits, §6.4) ---------- */

/** The footer for a page's #credits scene (fills <div data-footer></div>). */
export function footer({ page = document.body.dataset.page || 'home' } = {}) {
  const links = FOOTER_LINKS.map(({ key, label, href }) =>
    `<li><a href="${href}"${key === page ? ' aria-current="page"' : ''}>${titleCase(label)}</a></li>`).join('');
  return `
  <footer class="site-footer">
    <div class="site-footer__brand">
      ${MONOGRAM}
      <p class="site-footer__name">${SITE_NAME}</p>
      <p class="site-footer__tagline">${TAGLINE}</p>
      <p class="site-footer__copy">© ${new Date().getFullYear()} ${SITE_NAME}</p>
    </div>
    <nav class="site-footer__contact" aria-label="Contact"><ul class="site-footer__icons">${contactItems(page)}</ul></nav>
    <nav class="site-footer__nav" aria-label="Footer"><ul class="site-footer__links">${links}</ul></nav>
    ${FOOTER_SWITCHES === false ? '' : `<div class="site-footer__end">${switchesHTML()}</div>`}
  </footer>`;
}

/* ---------- placeholder card ---------- */

const CARD_LEVEL = { min: 2, max: 6, fallback: 3 };
function cardLevel(level) {
  const n = Number.parseInt(level, 10);
  return Number.isFinite(n) ? Math.min(CARD_LEVEL.max, Math.max(CARD_LEVEL.min, n)) : CARD_LEVEL.fallback;
}

/** "Partner Spot Available" card (CR16, FR31). Never shows invented details. */
export function placeholderCard({ category = '', level = CARD_LEVEL.fallback } = {}) {
  const meta = category ? `${escapeHtml(category)} · no partner listed here yet` : 'No partner listed here yet';
  const h = `h${cardLevel(level)}`;
  return `
  <article class="partner-card partner-card--placeholder">
    <div class="partner-card__avatar" aria-hidden="true"></div>
    <div class="partner-card__body">
      <${h} class="partner-card__title">Partner Spot Available</${h}>
      <p class="partner-card__meta">${meta}</p>
      <a class="link" href="partners.html">Join Us ${ARROW}</a>
    </div>
  </article>`;
}

/* ---------- slots ---------- */

const reviewMode = () => new URLSearchParams(location.search).get(REVIEW_PARAM) === '1';
const hasValue = (v) => (Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v);

/** [data-when="KEY"]: shown only when config[KEY] is set, or in review mode. */
export function renderWhen(scope = document, review = reviewMode()) {
  scope.querySelectorAll('[data-when]').forEach((el) => {
    const keys = el.dataset.when.split(/\s+/).filter(Boolean);
    const on = review || keys.every((key) => hasValue(CONFIG[key]));
    el.toggleAttribute('data-when-on', on);
  });
}

function fillSlots(page) {
  document.querySelectorAll('[data-footer]').forEach((el) => { el.innerHTML = footer({ page }); });
  document.querySelectorAll('[data-monogram]:empty').forEach((el) => { el.innerHTML = MONOGRAM; });
  document.querySelectorAll('[data-placeholder-card]').forEach((el) => {
    el.innerHTML = placeholderCard({ category: el.dataset.category || '', level: el.dataset.level });
  });
  document.querySelectorAll('a[data-wa]').forEach((a) => {
    a.href = a.dataset.wa ? waLink(a.dataset.wa) : pageLink(page);
    a.target = '_blank';
    a.rel = 'noopener';
  });
  renderWhen(document);
  syncSwitches(document);
}

/* ---------- skip link ---------- */

function wireSkipLink(link) {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const scene = document.querySelector('.scene.is-active') || document.querySelector('.scene');
    const target = scene?.querySelector('h1, h2') || scene;
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

/* ---------- entry ---------- */

function ensureHeader(page) {
  let header = document.querySelector('header.site-header');
  if (!header) {
    header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = headerHTML(page);
    document.body.prepend(header);
  }
  let skip = document.querySelector('.skip-link');
  if (!skip) {
    skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#content';
    skip.textContent = 'Skip to Content';
    document.body.prepend(skip);
  }
  wireSkipLink(skip);
  mirrorHeaderField(header);
  return header;
}

/* The engine writes the header field on <html data-hdr-field>; the CSS keys on the
   header's own data-hdr so a cut restyles the header only, not the whole document. */
function mirrorHeaderField(header) {
  const html = document.documentElement;
  const sync = () => {
    const field = html.dataset.hdrField;
    if (!field) header.removeAttribute('data-hdr');
    else if (header.dataset.hdr !== field) header.dataset.hdr = field;
  };
  sync();
  new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ['data-hdr-field'] });
}

/**
 * Wire the chrome. Returns { header, onMenuToggle, closeMenu }.
 * `page` defaults to <body data-page>.
 */
export function initChrome({ page = document.body.dataset.page || 'home' } = {}) {
  if (reviewMode()) document.documentElement.classList.add('ph-loud');
  const menuListeners = new Set();
  const header = ensureHeader(page);
  const menu = createMenu(header, page, (open) => menuListeners.forEach((cb) => cb(open)));
  fillSlots(page);
  initAccountButton({ root: header });
  document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) onSwitchClick(e); });
  window.addEventListener('storage', (e) => { if (e.key === SOUND_KEY) syncSwitches(); });

  return {
    header,
    onMenuToggle(cb) {
      menuListeners.add(cb);
      return () => menuListeners.delete(cb);
    },
    closeMenu: menu.close,
  };
}
