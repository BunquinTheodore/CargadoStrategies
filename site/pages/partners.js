/**
 * For Professionals (partners.html): 6 scenes + credits on the Round 5 cut engine
 * (DIRECTION §7.4, P1-P7).
 *
 * Order (api.md §2): fill what depends on config, then boot(), then register
 * the film listeners in the same tick. The globe (P1 "You" joins the map, P6
 * the medallion), the in groups and the stops are the engine's and dotglobe's;
 * the sections add the P3 deal-in, the tier choice and "Compare All"
 * (sections/partners/tiers), the P6 questions (close) and the application
 * stepper (apply). Sound is automatic (sfx.js), apart from the success chime
 * the form plays.
 */
import { boot } from '../core/main.js';
import { mountSections } from '../core/Section.js';
import { partnerQuestionMessage, waLink } from '../core/chrome/whatsapp.js';
import { renderCategoryOptions, selectTier } from '../sections/partners/apply/partners-form.js';
import { Tiers } from '../sections/partners/tiers/Tiers.js';
import { Close } from '../sections/partners/close/Close.js';
import { Apply } from '../sections/partners/apply/Apply.js';

const PAGE = 'partners';
/** Mount order = the original wiring order: tier choice, the two dialogs, then the form. */
const SECTIONS = [Tiers, Close, Apply];

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function wirePartnerLinks() {
  const href = waLink(partnerQuestionMessage());
  $$('a[data-wa-partner]').forEach((a) => { a.href = href; });
}

/**
 * Every scene lays out from its .scene__pan. The build writes it into dist and the engine adds it
 * in cut and touch-cut mode; flow mode on the readable source has none, so add it here first.
 */
function ensurePans() {
  $$('.scene > .scene__inner').forEach((inner) => {
    if (inner.querySelector(':scope > .scene__pan')) return;
    const pan = document.createElement('div');
    pan.className = 'scene__pan';
    pan.append(...inner.childNodes);
    inner.append(pan);
  });
}

/* ---------- start ---------- */

ensurePans();
const applyForm = document.getElementById('apply-form');
renderCategoryOptions(applyForm.elements.category);
wirePartnerLinks();

const ctx = boot({ page: PAGE });
if (typeof ctx.film.refreshReach !== 'function') {
  console.error('[partners] film.refreshReach() is missing: tab and step controls in parked scenes stay reachable by Tab.');
}

// P3 picks the tier in P5's form through the page, so neither section imports the other.
mountSections(SECTIONS, { ...ctx, selectTier: (tier) => selectTier(applyForm, tier) });
