/**
 * Our Story (story.html): 5 scenes + credits on the Round 5 cut engine
 * (DIRECTION §7.3, T1-T6). The scenes' behaviour lives in their sections:
 *
 *   #logo    sections/story/logo/Logo.js      W5: the mark draws as the globe becomes its ring
 *   #values  sections/story/values/Values.js  on phones an exclusive accordion (01 open)
 *
 * and, across the scenes, sections/story/building/Building.js: one 3D building
 * that re-poses on every cut and comes apart part by part (building-plan.js).
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
import { FOUNDER_LAST_NAME, FOUNDER_NAME, FOUNDER_PHOTO, FOUNDER_PHOTOS, FOUNDER_SIGNATURE, SITE_NAME } from '../assets/js/config.js';
import { buildIntro, waLink } from '../core/chrome/whatsapp.js';
import { Logo } from '../sections/story/logo/Logo.js';
import { Values } from '../sections/story/values/Values.js';
import { mountBuilding } from '../sections/story/building/Building.js';

const PAGE = 'story';
/** The intrinsic size of the founder photos (tools/gen-images.mjs), so a slot never shifts as it loads. */
const PHOTO_SIZE = Object.freeze({ width: 480, height: 665 });
/** Slots inside the first scene load at once; the rest wait until they are near the view. */
const EAGER_SCENE = 'top';

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- copy that depends on config (#top, #close) ---------- */

function slotImage(src, alt) {
  const img = new Image();
  img.src = src;
  img.alt = alt;
  img.decoding = 'async';
  return img;
}

/** One founder photo slot: the photo it names (data-founder-photo="cream"), else the default. */
function fillPhoto(slot, alt) {
  const src = FOUNDER_PHOTOS[slot.dataset.founderPhoto] || FOUNDER_PHOTO;
  if (!src) return;
  const img = slotImage(src, alt);
  img.width = PHOTO_SIZE.width;
  img.height = PHOTO_SIZE.height;
  if (!slot.closest(`#${EAGER_SCENE}`)) img.loading = 'lazy';
  slot.replaceChildren(img);
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
  // The large portrait (a <figure>) is described; the small avatar beside the CTA stays decorative.
  const portraitAlt = fullName ? `${fullName}, founder of ${SITE_NAME}` : `The founder of ${SITE_NAME}`;
  $$('[data-founder-photo]').forEach((slot) => fillPhoto(slot, slot.matches('figure') ? portraitAlt : ''));
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
const ctx = boot({ page: PAGE });
mountSections([Logo, Values], ctx);
mountBuilding(ctx);   // after the sections: its #values click handler runs after Values.js has moved .is-open
