/**
 * Home page (index.html): 6 scenes + credits on the Round 5 cut engine
 * (DIRECTION §7.1, H1-H7).
 *
 * Order (api.md §2): fill the copy that depends on config first, then boot(),
 * then register the film listeners in the same tick. Choreography is appended
 * to each cut timeline (home-tweens.js); sound is all automatic (sfx.js: the
 * chapter breath, the click blip, the success chime), so Home adds none.
 */
import { boot } from './main.js';
import { FOUNDER_LAST_NAME, FOUNDER_NAME, FOUNDER_PHOTO, FOUNDER_SIGNATURE, HERO_VARIANT } from './config.js';
import { buildIntro, waLink } from './whatsapp.js';
import { openDialog } from './ui-dialog.js';
import { addCutTweens } from './home-tweens.js';

const PAGE = 'home';
const TRIAD_TITLE = 'Protect. Plan. <em>Delegate</em><span class="visually-hidden">.</span><span class="stop" aria-hidden="true"></span>';
const PHONE_QUERY = '(max-width: 759px)';
const SHEEN_CLASS = 'is-sheen';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- copy that depends on config (before the engine splits words) ---------- */

/**
 * The name goes into the first build-time word mask (dist pre-splits "[First name]" into two
 * .rv-mask > .rv-word spans), so it rises with the rest of the heading; the second mask and the
 * space between them go. Unsplit spans (source, fade reveals) just take the text.
 */
function writeFounderName(el) {
  const [first, ...rest] = $$('.rv-word', el);
  if (first) {
    first.textContent = FOUNDER_NAME;
    rest.forEach((word) => (word.closest('.rv-mask') || word).remove());
    Array.from(el.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) node.remove();
    });
  } else {
    el.textContent = FOUNDER_NAME;
  }
  el.classList.remove('ph');
}

function fillCopy() {
  if (HERO_VARIANT === 'triad') {
    const title = $('[data-hero-title]');
    if (title) title.innerHTML = TRIAD_TITLE;
  }
  if (FOUNDER_NAME) $$('[data-founder-name]').forEach(writeFounderName);
  // The founder's face beside her name ([data-when="FOUNDER_PHOTO"] slots); never a stand-in face.
  if (FOUNDER_PHOTO) {
    $$('[data-founder-photo]').forEach((slot) => {
      const img = new Image();
      img.src = FOUNDER_PHOTO;
      img.alt = '';
      img.decoding = 'async';
      slot.replaceChildren(img);
    });
  }
  // Her own signature mark stands in only while there is no photo (the owner's file, never drawn).
  $$('[data-founder-signature]').forEach((slot) => {
    if (!FOUNDER_SIGNATURE || FOUNDER_PHOTO) return void slot.remove();
    const img = new Image();
    img.src = FOUNDER_SIGNATURE;
    img.alt = `${FOUNDER_NAME} ${FOUNDER_LAST_NAME}'s signature`;
    img.decoding = 'async';
    slot.replaceChildren(img);
  });
}

/** The no-JS hrefs of the sheet triggers: the message the sheet would write. */
function fillWhatsAppLinks() {
  $$('a[data-wa-sheet][href^="https://wa.me/"]').forEach((a) => {
    const { need = '', context = PAGE } = a.dataset;
    a.href = waLink(buildIntro({ need, context }));
  });
}

/* ---------- W3 doors on phones: an exclusive accordion, one open ---------- */

function wireDoors(root) {
  const doors = $$('.door', root);
  if (!doors.length) return;
  const phone = window.matchMedia(PHONE_QUERY);
  const setOpen = (door) => {
    doors.forEach((d) => {
      const open = d === door;
      d.classList.toggle('is-open', open);
      $('.door__toggle', d)?.setAttribute('aria-expanded', String(open));
    });
  };
  root.addEventListener('click', (event) => {
    if (!phone.matches) return;
    const door = event.target.closest('.door');
    if (!door || door.classList.contains('is-open') || event.target.closest('a')) return;
    setOpen(door);
  });
}

/* ---------- FAQ dialog (H6): #faq deep links open it through data-open ----------
   The answers are one exclusive group through the native details[name="faq"]
   (no script: the dialog sits outside every scene, so ui-accordion.js is not needed). */

function wireFaq(film) {
  const dialog = document.getElementById('faq-dialog');
  if (!dialog) return;
  $$('[data-faq-open]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openDialog(dialog, { trigger: link, film });
    });
  });
}

/* ---------- W1: the hero CTA sheen, once, on the first landing ---------- */

function sheenOnce(film) {
  const cta = $('#hero .hero__cta');
  if (!cta || film.mode === 'flow') return;
  const off = film.on('landed', ({ id, cause }) => {
    off();
    if (id !== 'hero' || cause !== 'load') return;
    cta.classList.add(SHEEN_CLASS);
    cta.addEventListener('animationend', () => cta.classList.remove(SHEEN_CLASS), { once: true });
  });
}

/* ---------- start ---------- */

fillCopy();
fillWhatsAppLinks();
const { film } = boot({ page: PAGE });

film.on('cut', addCutTweens);
sheenOnce(film);
wireDoors($('#founder .doors'));
wireFaq(film);
