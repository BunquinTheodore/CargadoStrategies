/**
 * Services page (services.html): 8 scenes + credits on the Round 5 cut engine
 * (DIRECTION §7.2, S1-S9).
 *
 *   S1 intro (rows into each service) · S2 insurance · S3 the clean-up ·
 *   S4 what you get · S5 outsourcing (the gold field) · S6 the concierge, or
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
import { FOUNDER_LAST_NAME, FOUNDER_NAME, FOUNDER_PHOTO, FOUNDER_SIGNATURE } from '../assets/js/config.js';
import { buildIntro, waLink } from '../core/chrome/whatsapp.js';
import { closeDialog } from '../core/ui/ui-dialog.js';
import { PAGE } from '../sections/services/services-data.js';
import { Inquiry } from '../sections/services/inquiry/Inquiry.js';
import { CategoriesDialog } from '../sections/services/categories-dialog/CategoriesDialog.js';
import { ProfileDialog } from '../sections/services/profile-dialog/ProfileDialog.js';
import { OursOutsourcing } from '../sections/services/ours-outsourcing/OursOutsourcing.js';
import { Finder } from '../sections/services/finder/Finder.js';

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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
  if (FOUNDER_PHOTO) {
    $$('[data-founder-photo]').forEach((slot) => {
      const img = new Image();
      img.src = FOUNDER_PHOTO;
      img.alt = '';
      img.decoding = 'async';
      slot.replaceChildren(img);
    });
  }
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

/** The no-JS hrefs of the sheet triggers: the message the sheet would write. */
function fillWhatsAppLinks(scope = document) {
  $$('a[data-wa-sheet][href^="https://wa.me/"]', scope).forEach((a) => {
    const { need = '', context = PAGE } = a.dataset;
    a.href = waLink(buildIntro({ need, context }));
  });
}

/* ---------- start ---------- */

fillCopy();
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

// Mount order is the original wiring order (listeners on the same node keep their order).
const { sections: [inquiry, , , , finder] } = mountSections([Inquiry, CategoriesDialog, ProfileDialog, OursOutsourcing, Finder], {
  ...booted,
  sound,
  fillWhatsAppLinks,
  leaveDialogsFor,
  inquireAbout,
  prefillInquiry: (values) => inquiry.prefill(values),
});
