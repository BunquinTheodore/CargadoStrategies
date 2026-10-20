/**
 * Our Story (story.html): 5 scenes + credits on the Round 5 cut engine
 * (DIRECTION §7.3, T1-T6). The scenes' behaviour lives in their sections:
 *
 *   #logo    sections/story/logo/Logo.js      W5: the mark draws as the globe becomes its ring
 *   #values  sections/story/values/Values.js  on phones an exclusive accordion (01 open)
 *
 * Order (api.md §2): fill the copy that depends on config first, then boot(),
 * then mount the sections (they register their film listeners) in the same
 * tick. The founder's name only fills plain lines and labels, never a split
 * heading (slice lesson 9).
 *
 * The words, the stop, the medallion and the chapter breath are the engine's,
 * dotglobe's and sfx.js's; this page adds no voices of its own.
 */
import { boot } from '../core/main.js';
import { mountSections } from '../core/Section.js';
import { FOUNDER_LAST_NAME, FOUNDER_NAME, FOUNDER_PHOTO, FOUNDER_SIGNATURE } from '../assets/js/config.js';
import { buildIntro, waLink } from '../core/chrome/whatsapp.js';
import { Logo } from '../sections/story/logo/Logo.js';
import { Values } from '../sections/story/values/Values.js';

const PAGE = 'story';

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- copy that depends on config (#top, #close) ---------- */

function slotImage(src, alt) {
  const img = new Image();
  img.src = src;
  img.alt = alt;
  img.decoding = 'async';
  return img;
}

function fillCopy() {
  const fullName = [FOUNDER_NAME, FOUNDER_LAST_NAME].filter(Boolean).join(' ');
  if (fullName) {
    $$('[data-founder-full]').forEach((el) => {
      el.textContent = fullName;
      el.classList.remove('ph');
    });
  }
  // T5: "Get My Introduction" becomes "Message [First name]" once the name is known.
  if (FOUNDER_NAME) $$('[data-cta-label]').forEach((el) => { el.textContent = `Message ${FOUNDER_NAME}`; });
  // Her face ([data-when="FOUNDER_PHOTO"] slots) and her signature: the owner's files, never a stand-in.
  if (FOUNDER_PHOTO) {
    $$('[data-founder-photo]').forEach((slot) => {
      slot.replaceChildren(slotImage(FOUNDER_PHOTO, slot.matches('figure') ? fullName : ''));
    });
  }
  if (FOUNDER_SIGNATURE) {
    $$('[data-founder-signature]').forEach((slot) => {
      slot.replaceChildren(slotImage(FOUNDER_SIGNATURE, `${fullName}'s signature`));
    });
  }
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
mountSections([Logo, Values], boot({ page: PAGE }));
