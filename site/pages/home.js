/**
 * Home page (index.html): 6 scenes + credits on the Round 5 cut engine
 * (DIRECTION §7.1, H1-H7). Each scene's behaviour is its section class
 * (sections/home/<name>/<Name>.js); the credits have none.
 *
 * Order (api.md §2): fill the copy that depends on config first, then boot(),
 * then mount the sections (their film listeners) in the same tick. Sound is
 * all automatic (sfx.js: the chapter breath, the click blip, the success
 * chime), so Home adds none.
 */
import { boot } from '../core/main.js';
import { mountSections } from '../core/Section.js';
import { FOUNDER_LAST_NAME, FOUNDER_NAME, FOUNDER_PHOTO, FOUNDER_SIGNATURE, HERO_VARIANT } from '../assets/js/config.js';
import { buildIntro, waLink } from '../core/chrome/whatsapp.js';
import { Hero } from '../sections/home/hero/Hero.js';
import { OneMessage } from '../sections/home/one-message/OneMessage.js';
import { Situations } from '../sections/home/situations/Situations.js';
import { Founder } from '../sections/home/founder/Founder.js';
import { Find } from '../sections/home/find/Find.js';
import { Close } from '../sections/home/close/Close.js';

const PAGE = 'home';
const TRIAD_TITLE = 'Protect. Plan. <em>Delegate</em><span class="visually-hidden">.</span><span class="stop" aria-hidden="true"></span>';

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

/** Hero title variant and the founder's name, photo and signature (hero and founder scenes). */
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

/* ---------- start ---------- */

fillCopy();
fillWhatsAppLinks();
const ctx = boot({ page: PAGE });
mountSections([Hero, OneMessage, Situations, Founder, Find, Close], ctx);
