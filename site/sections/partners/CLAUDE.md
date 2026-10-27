# For Professionals (`partners.html`): sections/partners

Entry `pages/partners.js`, styles `pages/partners.css`, spec `plan/round5/DIRECTION.md` §7.4 (P1-P7). Six scenes plus credits, and two dialogs. Has the globe (P1 map with a node joining as "You", P6 medallion).

## Scenes, in order

| # | id (aliases) | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| P1 | `hero` | ink · O · W4 reversed | `hero/` | The offer on the left and Canada on the right. A node joins, labelled "You" (`data-globe-mode="map" data-globe-arc="join"`) |
| P2 | `how` (arrangement) | ink · R | `how/` | Three hairline rows. The referral-arrangement notice is the one fine print (compliance) |
| P3 | `tiers` | ink · D | `tiers/` · `Tiers.js` | Community, Growth and Premier panels: pick a tier, then one "Apply to Join" carries it through `ctx.selectTier(tier)`. The panels are dealt in on the cut. Phones get tabs with swipe (`ui-tabs`). "Compare All" opens `#tiers-dialog`. `?tier=growth` preselects |
| P4 | `founding` | gold (metal) · M | `founding/` | The founding-partner offer: one statement and its terms. `FOUNDING_LIVE` slot (the live count) |
| P5 | `apply` (ask) | bone · P | `apply/` · `Apply.js` | The application stepper (`partners-form.js`: 4 steps of at most 4 fields; phones page through each step) leads to WhatsApp or email. The success chime. The category options come from config |
| P6 | `close` (questions) | ink · R + medallion | `close/` · `Close.js` | The small medallion and four question rows that open `#partner-faq` on their answer (`data-open="partner-faq:questions"`). `a[data-wa-partner]` |
| P7 | `credits` | ink · credits | `credits/` | The footer that chrome.js fills |
| | `tiers-dialog` | dialog | `tiers-dialog/` | Every tier side by side with the membership terms (verbatim compliance) |
| | `partner-faq` | dialog | `partner-faq/` | Questions before you apply, one open at a time (`details[name]`) |

Page-level files: `_page.css` (first), `_page-bands.css` (last).

## Config and core used

- Config (via `partners-form.js`): `CATEGORIES`, `categoryBySlug`, `CONTACT_EMAIL`, `CONTACT_EMAIL_LABEL`, `SITE_NAME`. `[data-when]`: `FOUNDING_LIVE`.
- `pages/partners.js`: `ensurePans()` (wraps `.scene__pan` for flow mode on the source), `renderCategoryOptions(#apply-form category)`, `wirePartnerLinks()` (`partnerQuestionMessage`), then boot, then `mountSections([Tiers, Close, Apply], { ...ctx, selectTier })`. Tiers never imports Apply.
- Core: `Section`, `ui-tabs`, `ui-dialog`, `ui-stepper`, `ui-focus`, `chrome.escapeHtml`, `whatsapp.waLink`, `film.refreshReach` (an error is logged if it is missing). `interact.js` tilts `.tier` panels on desktop.

## Known open issues (plan/round5/final-audit.txt)

- Fit: clean in film, touch and flow at all 9 viewports (2026-10-26). The old baseline items (#4 `apply` spare at 1366x768, #3 `founding` Y +24 in touch on phones) no longer fail. Short phones (≤ 760 tall) tighten the apply paper in `_page-bands.css` so the licence step with every error keeps ≥ 40 px in flow at 360x740.
- Run: `node tools/fit-audit.mjs <url> partners.html --states=tools/fit-states/partners.mjs`.
- Perf: mobile script transfer 85.2 KB (budget 70).
- console-check cannot open `tiers-dialog` or `partner-faq` in cut mode (no visible trigger).
- Owner content: tier fees, commission, founding terms and spots, response times, how licences are checked (`[brackets]`).
