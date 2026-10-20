# Services (`services.html`): sections/services

Entry `pages/services.js`, styles `pages/services.css`, spec `plan/round5/DIRECTION.md` §7.2 (S1-S9). Eight scenes plus credits, and two dialogs. Has the globe (S6 map, S8 medallion). The only page with partner data.

## Scenes, in order

| # | id (aliases) | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| S1 | `intro` | ink · R | `intro/` | Her three services and the partner network, one row each, linking into the scenes |
| S2 | `ours-insurance` (insurance) | bone · O | `ours-insurance/` | The typographic portrait (founder full name, photo and signature slots), her question, the sheet CTA and the contact link. Licence `[brackets]` |
| S3 | `ours-strategy` (business-strategy, strategy) | bone · M | `ours-strategy/` | The business-strategy offer as a mega monument. `[$x]` price brackets |
| S4 | `ours-includes` | bone · R | `ours-includes/` | "What You Get": five rows, each with the pain it fixes |
| S5 | `ours-outsourcing` (outsourcing) | gold (metal) · D | `ours-outsourcing/` · `OursOutsourcing.js` | Four role panels, the page's one gold field. On phones they are an exclusive accordion. `REVIEW_NOTES` slots |
| S6 | `finder` (categories + every partner category slug) | ink · O → map · W4 | `finder/` · `Finder.js` | The concierge (`concierge.js`) while `PARTNERS.length < FINDER_MIN_PARTNERS`, otherwise the finder (`widget/finder*.js`: map of Canada, city/postal combobox, results sorted by distance only, pager). `Finder.choose()` runs before boot. `data-open="categories-dialog:*"` |
| S7 | `inquiry` | ink · P | `inquiry/` · `Inquiry.js` | A 3-step stepper on paper (`services-inquiry.js`, `ui-stepper`). `a[data-inquiry-category]` links preselect the category. `data-stars="dim"` |
| S8 | `close` | ink · M · W5 | `close/` | The medallion bookend and the sheet CTA |
| S9 | `credits` | ink · credits | `credits/` | The footer that chrome.js fills |
| | `categories-dialog` | dialog | `categories-dialog/` · `CategoriesDialog.js` | The rail of nine categories and one category's detail (`services-categories.js`, `ui-pager`). Opened by "See All Nine Kinds of Help" and by category deep links (`cs:open`) |
| | `profile-dialog` | dialog | `profile-dialog/` · `ProfileDialog.js` | One partner profile filled from `PARTNERS` (`partner-profile.js`). Its inquiry button calls `ctx.inquireAbout(slug)` |

Page-level files: `_page.css` (first), `_bands.css` (last), `services-data.js` (shared by the sections: `OURS`, `PARTNER_ONLY`, `FOUNDER_OFFERS`, `FOUNDER_REQUEST`, `isOurs`, `hasPartners`, `subPlaceholderCard`, `partnerTypeNames`, `profileTrigger`, `PAGE`, `PHONE_QUERY`). Sections import only from here and core, never from each other's folders.

## Config and core used

- Config: `CATEGORIES`, `categoryBySlug`, `PARTNERS`, `FINDER_MIN_PARTNERS`, `CONTACT_EMAIL`, `SITE_NAME`, `FOUNDER_NAME`, `FOUNDER_LAST_NAME`, `FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`. Data: `assets/data/cities.js` and `canada-map.js`.
- `[data-when]`: `FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`, `REVIEW_NOTES`.
- Core: `Section`, `ui-dialog`, `ui-stepper`, `ui-pager`, `ui-tabs`, `chrome.escapeHtml`/`placeholderCard`, `whatsapp.waLink`/`categoryMessage`/`buildIntro`, `lib/text-case.titleCase`.
- `ctx` extras from `pages/services.js`: `sound`, `fillWhatsAppLinks`, `leaveDialogsFor(id)`, `inquireAbout(slug)`, `prefillInquiry(values)`. Mount order: `Inquiry, CategoriesDialog, ProfileDialog, OursOutsourcing, Finder` (the original wiring order).
- A category slug must never equal a scene id here (README "How to add a category"). A founder-owned category also needs entries in `FOUNDER_OFFERS` (services-data.js) and `FOUNDER_LINES` (services-categories.js).

## Known open issues (plan/round5/final-audit.txt)

- Fit flow: #6 `inquiry` all-errors unit 3/3 overflows Y +25 / +161 / +623 at 1366, 1280 and 1024.
- Fit film with `--fixture=partners-max` (run on site/, not dist): #5 `finder`, where `#categories-dialog` overflows Y +11..+110 with spare < 24 at 8 of 9 viewports.
- Run: `node tools/fit-audit.mjs <site-url> services.html --states=tools/fit-states/services.mjs --fixture=partners-max`.
- Perf: mobile script transfer 89.2 KB (budget 70).
- console-check cannot open `profile-dialog` (no trigger while `PARTNERS` is empty), nor `categories-dialog` in cut mode.
- Owner content still missing: insurance company and licence, prices, guarantee wording, roles (`[brackets]`).
