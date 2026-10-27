/**
 * Services page (services.html): 13 scenes + credits on the Round 5 cut engine
 * (DIRECTION §7.2, S1-S9; v2 spec §6.1-§6.3).
 *
 *   S1 the services orbit (v2) · S2 insurance · S3 the clean-up ·
 *   S4 what you get · S5 outsourcing (the gold field) · S5a-S5e the services
 *   Cargado Strategies delivers itself (web, creative, software, contractor,
 *   trade; each books a free consultation) · S6 the concierge, or
 *   the finder once enough partners exist · S7 the inquiry stepper · S8 close.
 *
 * Order (api.md §2): fill the copy that depends on config first, then boot(),
 * then mount the sections (sections/services/) in the same tick. The engine
 * plays every reveal from the data-reveal hooks; dotglobe plays the map (S6)
 * and the medallion (S8); sound is automatic (the chapter breath, the click
 * blip, the success chime), plus the error voice on a failed Next. Category
 * slugs deep-link to S6 and open the categories dialog there (data-open,
 * `cs:open`).
 */
import { boot } from '../core/main.js';
import { mountSections } from '../core/Section.js';
import {
  FOUNDER_LAST_NAME, FOUNDER_NAME, FOUNDER_PHOTO, FOUNDER_PHOTOS, FOUNDER_SIGNATURE, SITE_NAME, categoryBySlug,
} from '../assets/js/config.js';
import { buildIntro, waLink } from '../core/chrome/whatsapp.js';
import { closeDialog } from '../core/ui/ui-dialog.js';
import { PAGE, insuranceLink } from '../sections/services/services-data.js';
import { Inquiry } from '../sections/services/inquiry/Inquiry.js';
import { CategoriesDialog } from '../sections/services/categories-dialog/CategoriesDialog.js';
import { ProfileDialog } from '../sections/services/profile-dialog/ProfileDialog.js';
import { OursOutsourcing } from '../sections/services/ours-outsourcing/OursOutsourcing.js';
import { Finder } from '../sections/services/finder/Finder.js';
import { Orbit } from '../sections/services/orbit/Orbit.js';
import { OWN_3D_SECTIONS } from '../sections/services/own-3d.js';

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
/** The founder photos' intrinsic size (tools/gen-images.mjs keeps the source aspect), against layout shift. */
const PHOTO_SIZE = Object.freeze({ width: 480, height: 687 });
const PORTRAIT_ALT = `${[FOUNDER_NAME, FOUNDER_LAST_NAME].filter(Boolean).join(' ')}, founder of ${SITE_NAME}`;
const isBracket = (text) => /^\[.*\]$/.test(text.trim());

/* ---------- copy that depends on config (before the engine splits words) ---------- */

function fillCopy() {
  if (FOUNDER_NAME) {
    $$('[data-founder-name]').forEach((el) => {
      el.textContent = FOUNDER_NAME;
      el.classList.remove('ph');
    });
    $$('[data-founder-full]').forEach((el) => {
      el.textContent = [FOUNDER_NAME, FOUNDER_LAST_NAME].filter(Boolean).join(' ');
      el.classList.remove('ph');
    });
  }
  // The founder's portrait (never a stand-in face); the typographic portrait stands in until then.
  $$('[data-founder-photo]').forEach(fillPhoto);
  // Her signature under the typographic portrait, once the owner supplies one (until then the slot stays hidden).
  if (FOUNDER_SIGNATURE) {
    $$('[data-founder-signature]').forEach((slot) => {
      const img = new Image();
      img.src = FOUNDER_SIGNATURE;
      img.alt = '';
      img.decoding = 'async';
      slot.replaceChildren(img);
    });
  }
}

/**
 * One founder photo slot: the photo it names (data-founder-photo="navy", v2 §6.7), else the default.
 * The large ours-insurance portrait is below the fold, so it loads lazily.
 */
function fillPhoto(slot) {
  const src = FOUNDER_PHOTOS[slot.dataset.founderPhoto] || FOUNDER_PHOTO;
  if (!src) return;
  const img = new Image(PHOTO_SIZE.width, PHOTO_SIZE.height);
  img.src = src;
  img.alt = PORTRAIT_ALT;
  img.decoding = 'async';
  img.loading = 'lazy';
  slot.replaceChildren(img);
}

/** The v2 service scenes read their one-line description from config; a [bracket] stays a placeholder. */
function fillDescriptions() {
  $$('[data-category-desc]').forEach((el) => {
    const text = categoryBySlug(el.dataset.categoryDesc)?.description || '';
    if (!text || isBracket(text)) return;
    el.textContent = text;
  });
}

/**
 * "Ask About Insurance" opens the policy review site in a new tab (v2 §6.1b), with its hint shown.
 * With no URL in config the CTA keeps the WhatsApp sheet and the hint stays hidden.
 */
function wireInsurance() {
  const link = insuranceLink();
  if (!link) return;
  $$('a[data-insurance-cta]').forEach((a) => {
    a.removeAttribute('data-wa-sheet');
    a.href = link.href;
    a.target = '_blank';
    a.rel = 'noopener';
  });
  $$('[data-insurance-hint]').forEach((el) => {
    el.textContent = link.hint;
    el.hidden = false;
  });
}

/** The no-JS hrefs of the sheet triggers: the message the sheet would write. */
function fillWhatsAppLinks(scope = document) {
  $$('a[data-wa-sheet][href^="https://wa.me/"]', scope).forEach((a) => {
    const { need = '', context = PAGE } = a.dataset;
    a.href = waLink(buildIntro({ need, context }));
  });
}

/* ---------- start ---------- */

fillCopy();
fillDescriptions();
wireInsurance();
fillWhatsAppLinks();
Finder.choose();
const booted = boot({ page: PAGE });
const { film, sfx } = booted;
const sound = (name) => { if (sfx.has(name)) sfx.play(name); };

/** From a dialog to a scene: close every open dialog first, so the cut is not held. */
function leaveDialogsFor(id) {
  $$('dialog[open]').forEach((d) => closeDialog(d, { returnFocus: false }));
  film.goTo(id, { cause: 'goto' });
}

/** A partner profile's inquiry button: the category goes to S7 (and to the finder), then the cut. */
function inquireAbout(slug) {
  inquiry.setCategory(slug);
  finder.setCategory(slug);
  leaveDialogsFor('inquiry');
  inquiry.focusTitle();
}

// Mount order is the original wiring order (listeners on the same node keep their order); the v2 orbit,
// then the own-scene 3D motifs (own-3d.js: three.js loads only near those scenes), last.
const { sections: [inquiry, , , , finder] } = mountSections([Inquiry, CategoriesDialog, ProfileDialog, OursOutsourcing, Finder, Orbit, ...OWN_3D_SECTIONS], {
  ...booted,
  sound,
  fillWhatsAppLinks,
  leaveDialogsFor,
  inquireAbout,
  prefillInquiry: (values) => inquiry.prefill(values),
});
