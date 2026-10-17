/**
 * Site chrome: skip link, header + accessible mobile menu, floating WhatsApp
 * button (desktop/tablet), sticky phone action bar (<760px), footer builder
 * and the "Partner Spot Available" placeholder card builder.
 *
 * Every heading, title, button label and nav item it writes is Title Case
 * (titleCase from text-case.js). Round 3 adds the sound toggle
 * ([data-sound-toggle], wired by sfx.js) next to the "Pause animation" toggle.
 */
import { NAV, FACEBOOK_URL, PHONE, TAGLINE, LEGAL_LINKS, SITE_NAME } from './config.js';
import { pageLink, waLink } from './whatsapp.js';
import { titleCase } from './text-case.js';

const NEW_TAB = 'target="_blank" rel="noopener"';

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/** C and W monogram. Uses currentColor so it can sit on any field. */
export const MONOGRAM = `
<svg class="monogram" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
  <path d="M37.4 10.6A19 19 0 1 0 37.4 37.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/>
  <path d="M13.5 17 19.2 31.5 24 21.5 28.8 31.5 34.5 17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="miter" stroke-linecap="square"/>
</svg>`;

const ICON_WA = `
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M9.2 8.2c.3-.6.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .5-.1.6l-.5.6c-.1.2-.1.4 0 .5.6 1 1.4 1.8 2.5 2.4.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5 0 .6-.2 1.3-.8 1.6-.6.4-1.5.5-2.6.1-1.7-.6-3.4-2.1-4.3-3.8-.6-1.1-.7-2.2-.4-3Z" fill="currentColor"/>
</svg>`;

const ICON_FB = `
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <path d="M13.2 20.5v-6.7h2.2l.3-2.6h-2.5V9.6c0-.8.2-1.3 1.3-1.3h1.3V6c-.6-.1-1.3-.1-2-.1-2 0-3.3 1.2-3.3 3.4v1.9H8.3v2.6h2.2v6.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
</svg>`;

/** Speaker with waves (sound on) and with a cross (muted); CSS shows the one that fits aria-pressed. */
const ICON_SOUND = `
<svg class="icon sound-toggle__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
  <path class="sound-toggle__on" d="M15.2 9.2a4 4 0 0 1 0 5.6M17.6 6.8a7.4 7.4 0 0 1 0 10.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path class="sound-toggle__off" d="m15.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

const ARROW = '<span class="btn__arrow" aria-hidden="true">→</span>';

/* ---------- header ---------- */

function navLinks(page) {
  return NAV.map(({ key, label, href }) => {
    const current = key === page ? ' aria-current="page"' : '';
    return `<li><a class="site-nav__link" href="${href}"${current}>${titleCase(label)}</a></li>`;
  }).join('');
}

/** "Pause animation" toggle; motion-toggle.js shows and wires it. `where`: 'bar' (header) or 'menu'. */
function motionToggleHTML(where) {
  return `<button class="motion-toggle motion-toggle--${where}" type="button" aria-pressed="false" data-motion-toggle hidden>
    <span class="motion-toggle__icon" aria-hidden="true"></span><span class="motion-toggle__label">Pause Animation</span></button>`;
}

/** Sound effects on/off; sfx.js keeps aria-pressed (true = sound on) and the stored choice. */
function soundToggleHTML(where) {
  return `<button class="sound-toggle sound-toggle--${where}" type="button" aria-pressed="true" data-sound-toggle>
    ${ICON_SOUND}<span class="sound-toggle__label">Sound Effects</span></button>`;
}

function headerHTML(page) {
  const wa = pageLink(page);
  return `
  <a class="brand" href="index.html" aria-label="${SITE_NAME}, home">
    ${MONOGRAM}<span class="brand__word">${SITE_NAME}</span>
  </a>
  <nav class="site-nav" id="site-nav" aria-label="Main">
    <ul class="site-nav__list">${navLinks(page)}</ul>
    <div class="site-nav__extra">
      <a class="btn btn--primary btn--block" href="${wa}" ${NEW_TAB}>${ICON_WA}<span>Message Us on WhatsApp</span></a>
      <a class="site-nav__fb" href="${FACEBOOK_URL}" ${NEW_TAB}>${ICON_FB}<span>Facebook<span class="visually-hidden"> (opens in a new tab)</span></span></a>
      <div class="site-nav__toggles">${motionToggleHTML('menu')}${soundToggleHTML('menu')}</div>
    </div>
  </nav>
  <div class="site-header__actions">
    <a class="icon-link" href="${FACEBOOK_URL}" ${NEW_TAB} aria-label="${SITE_NAME} on Facebook (opens in a new tab)">${ICON_FB}</a>
    <a class="btn btn--primary btn--sm" href="${wa}" ${NEW_TAB}>${ICON_WA}<span>WhatsApp</span><span class="visually-hidden"> (opens in a new tab)</span></a>
  </div>
  ${soundToggleHTML('bar')}
  ${motionToggleHTML('bar')}
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
    <span class="nav-toggle__label">Menu</span><span class="nav-toggle__icon" aria-hidden="true"></span>
  </button>`;
}

/** Everything the full-screen phone menu covers: made inert while it is open. */
const BEHIND_MENU = '.skip, .stage, .wa-float-wrap, .phone-bar, .site-header > .brand, .site-header > .site-header__actions, .site-header > .motion-toggle, .site-header > .sound-toggle';

function setBehindMenu(inert) {
  document.querySelectorAll(BEHIND_MENU).forEach((el) => { el.inert = inert; });
}

function createMenu(header, onToggle) {
  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('.site-nav');
  const label = toggle.querySelector('.nav-toggle__label');
  let open = false;

  function set(next, { restoreFocus = true } = {}) {
    if (next === open) return;
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Close' : 'Menu';
    nav.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('nav-open', open);
    setBehindMenu(open);
    onToggle(open);
    if (open) nav.querySelector('a')?.focus();
    else if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => set(!open));
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) set(false, { restoreFocus: false });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) set(false);
  });
  window.matchMedia('(min-width: 1024px)').addEventListener?.('change', (e) => {
    if (e.matches) set(false, { restoreFocus: false });
  });
  return { close: () => set(false, { restoreFocus: false }), isOpen: () => open };
}

/* ---------- WhatsApp float + phone bar ---------- */

function floatHTML(page) {
  return `<a class="wa-float" href="${pageLink(page)}" ${NEW_TAB}>
    ${ICON_WA}<span class="wa-float__label">WhatsApp</span><span class="visually-hidden"> us (opens in a new tab)</span></a>`;
}

function barHTML(page) {
  return `<a class="btn btn--primary btn--block phone-bar__action" href="${pageLink(page)}" ${NEW_TAB}>
    ${ICON_WA}<span class="phone-bar__label">Message Us on WhatsApp</span>${ARROW}</a>`;
}

function mount(tag, className, html, where = 'append') {
  const el = document.createElement(tag);
  el.className = className;
  el.innerHTML = html;
  document.body[where](el);
  return el;
}

/* ---------- footer + placeholder card ---------- */

/** Footer HTML for a page's final scene (or use <div data-footer></div>). */
export function footer({ page = document.body.dataset.page || 'home' } = {}) {
  const legal = LEGAL_LINKS.filter((l) => l.id !== 'qa')
    .map((l) => `<li><a href="legal.html#${l.id}">${titleCase(l.label)}</a></li>`).join('');
  return `
  <footer class="site-footer">
    <div class="site-footer__brand">
      ${MONOGRAM}
      <p class="site-footer__name">${SITE_NAME}</p>
      <p class="site-footer__tagline">${TAGLINE}</p>
    </div>
    <div class="site-footer__col site-footer__col--contact">
      <p class="eyebrow">Contact</p>
      <ul class="site-footer__links">
        <li><a href="${pageLink(page)}" ${NEW_TAB}>WhatsApp ${PHONE.display}<span class="visually-hidden"> (opens in a new tab)</span></a></li>
        <li><a href="${FACEBOOK_URL}" ${NEW_TAB}>Facebook<span class="visually-hidden"> (opens in a new tab)</span></a></li>
      </ul>
    </div>
    <div class="site-footer__col">
      <p class="eyebrow">Company</p>
      <ul class="site-footer__links">
        <li><a href="services.html">Services</a></li><li><a href="story.html">Our Story</a></li>
        <li><a href="partners.html">Become a Partner</a></li><li><a href="legal.html#qa">Q&amp;A</a></li>
      </ul>
    </div>
    <div class="site-footer__col">
      <p class="eyebrow">Legal</p>
      <ul class="site-footer__links">${legal}</ul>
    </div>
    <p class="site-footer__notice">Partners are independent businesses, each responsible for their own licence and advice.
      ${SITE_NAME} does not give regulated advice through this website and may receive a commission when a referral becomes a client.
      <span class="ph">[Wording to be confirmed by counsel]</span></p>
    <p class="site-footer__copy">© ${new Date().getFullYear()} ${SITE_NAME}</p>
  </footer>`;
}

const CARD_LEVEL = { min: 2, max: 6, fallback: 3 };

/** A heading level 2–6 for the card title (3 unless the card sits under an h3). */
function cardLevel(level) {
  const n = Number.parseInt(level, 10);
  return Number.isFinite(n) ? Math.min(CARD_LEVEL.max, Math.max(CARD_LEVEL.min, n)) : CARD_LEVEL.fallback;
}

/**
 * "Partner Spot Available" card (CR16, FR31). Never shows invented details.
 * `level` sets the title's heading level (default 3; use 4 under an h3).
 */
export function placeholderCard({ category = '', level = CARD_LEVEL.fallback } = {}) {
  const meta = category ? `${escapeHtml(category)} · no partner listed here yet` : 'No partner listed here yet';
  const h = `h${cardLevel(level)}`;
  return `
  <article class="partner-card partner-card--placeholder" data-cursor-label="Join">
    <div class="partner-card__avatar" aria-hidden="true"></div>
    <div class="partner-card__body">
      <${h} class="partner-card__title">Partner Spot Available</${h}>
      <p class="partner-card__meta">${meta}</p>
      <a class="btn btn--link" href="partners.html">Become a Partner ${ARROW}</a>
    </div>
  </article>`;
}

function fillSlots(page) {
  document.querySelectorAll('[data-footer]').forEach((el) => { el.innerHTML = footer({ page }); });
  document.querySelectorAll('[data-placeholder-card]').forEach((el) => {
    el.innerHTML = placeholderCard({ category: el.dataset.category || '', level: el.dataset.level });
  });
  document.querySelectorAll('a[data-wa]').forEach((a) => {
    a.href = a.dataset.wa ? waLink(a.dataset.wa) : pageLink(page);
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

/* ---------- skip link ---------- */

function skipLinkHTML() {
  return '<a class="skip-link" href="#content">Skip to Content</a>';
}

function wireSkipLink(link) {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const scene = document.querySelector('.scene.is-active') || document.querySelector('.scene');
    const target = scene?.querySelector('h1, h2') || scene;
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus();
  });
}

/* ---------- entry ---------- */

/**
 * Inject the chrome. Returns { setBar, onMenuToggle, closeMenu }.
 * `page` defaults to <body data-page>.
 */
export function initChrome({ page = document.body.dataset.page || 'home' } = {}) {
  const menuListeners = new Set();
  const skip = mount('div', 'skip', skipLinkHTML(), 'prepend');
  wireSkipLink(skip.querySelector('a'));
  const header = mount('header', 'site-header', headerHTML(page));
  skip.after(header);
  const menu = createMenu(header, (open) => menuListeners.forEach((cb) => cb(open)));
  mount('div', 'wa-float-wrap', floatHTML(page));
  const bar = mount('div', 'phone-bar', barHTML(page));
  fillSlots(page);

  return {
    header,
    /**
     * Change the phone bar's action, e.g. setBar({ label: 'Get my introduction', href }).
     * newTab: false for a same-page link (e.g. '#apply'); true (the WhatsApp default) opens a new tab.
     */
    setBar({ label, href, newTab } = {}) {
      const action = bar.querySelector('a');
      if (href) action.href = href;
      if (label) action.querySelector('.phone-bar__label').textContent = label;
      if (newTab === true) Object.assign(action, { target: '_blank', rel: 'noopener' });
      if (newTab === false) {
        action.removeAttribute('target');
        action.removeAttribute('rel');
      }
    },
    onMenuToggle(cb) {
      menuListeners.add(cb);
      return () => menuListeners.delete(cb);
    },
    closeMenu: menu.close,
  };
}
