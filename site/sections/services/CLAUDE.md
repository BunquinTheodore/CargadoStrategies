# Services (`services.html`): sections/services

Entry `pages/services.js`, styles `pages/services.css`, spec `plan/round5/DIRECTION.md` §7.2 (S1-S9). Thirteen scenes plus credits, and two dialogs (v2, 2026-10-25: the orbit replaced `intro`, and five scenes for the services Cargado Strategies delivers itself follow outsourcing; spec `docs/superpowers/specs/2026-10-25-cargado-v2-design.md` §6.1-§6.3). Has the globe (S6 map, S8 medallion). The only page with partner data.

## Scenes, in order

| # | id (aliases) | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| S1 | `orbit` | ink · stage | `orbit/` · `Orbit.js` | The services orbit (`core/ui/ui-orbit.js`, `core/design/orbit.css`): the header logo image in the centre (owner 2026-10-30; it sits still, the `orbitLogoIn` logo-in was removed 2026-11-07; the nodes keep the 90 s orbit spin, owner 2026-11-07) with the eleven `ORBIT_GROUPS` round it as same-page #links, hover/focus/tap previews. The page's h1 and the "Ours / Partners" legend (`ORBIT_LEGEND` wording) |
| S2 | `ours-insurance` (insurance) | bone · O | `ours-insurance/` | The typographic portrait (founder full name, photo and signature slots), her question, the sheet CTA and the contact link. Licence `[brackets]` |
| S3 | `ours-strategy` (business-strategy, strategy) | bone · M | `ours-strategy/` | The business-strategy offer as a mega monument. `[$x]` price brackets |
| S4 | `ours-includes` | bone · R | `ours-includes/` | "What You Get": five rows, each with the pain it fixes |
| S4a | `ours-consultation` (business-consultation) | bone · M | `ours-consultation/` | Business Consultation (owner, 2026-11-01) as a monument, beside Business Strategy: the description from config, the no-prices line, "Book a Free Consultation" (`contact.html?service=business-consultation#book`) and the sheet link. Motif `tiles` |
| S5 | `ours-outsourcing` (virtual-assistant, outsourcing) | gold (metal) · D | `ours-outsourcing/` · `OursOutsourcing.js` | Virtual Assistant (owner, 2026-11-01: Outsourcing merged into it; the `outsourcing` category is gone, its hash still lands here): "Your Back-Office Team", four role panels, the page's one gold field. On phones they are an exclusive accordion. `REVIEW_NOTES` slots |
| S5a | `ours-web` (web-design) | ink · M | `ours-web/` | Web Design as a monument: `[bracket]` description from config, the no-prices line, "Book a Free Consultation" (`contact.html?service=web-design#book`) and the sheet link |
| S5b | `ours-creative` (graphics) | bone · R | `ours-creative/` | Graphics only (owner, 2026-11-01): the description and the four config `items` as rows, motif `morph` |
| S5c | `ours-software` (software-development) | ink · M | `ours-software/` | As S5a |
| S5d | `ours-contractor` (contractor) | bone · R | `ours-contractor/` | "Residential and Commercial Services" (owner, 2026-11-01): the description and the ten config `items` as two columns of five rows (keep them equal to config; a test checks) |
| S5d2 | `ours-health` (health-care) | ink · O | `ours-health/` | Health Care Services (owner, 2026-11-01): the `care` motif (a turning cross and a heartbeat) on the right half (`--o` slot; a top band on phones), the name, description from config, the no-prices line and "Book a Free Consultation" on the left. O, not M, because both neighbours of the only free slot are M/R and the archetype must not repeat |
| S5e | `ours-trade` (export-import) | ink · M | `ours-trade/` | As S5a |
| S6 | `finder` (categories + every partner category slug) | ink · O → map · W4 | `finder/` · `Finder.js` | The concierge (`concierge.js`) while `PARTNERS.length < FINDER_MIN_PARTNERS`, otherwise the finder (`widget/finder*.js`: map of Canada, city/postal combobox, results sorted by distance only, pager). `Finder.choose()` runs before boot. `data-open="categories-dialog:*"` |
| S7 | `inquiry` | ink · P | `inquiry/` · `Inquiry.js` | A 3-step stepper on paper (`services-inquiry.js`, `ui-stepper`). `a[data-inquiry-category]` links preselect the category. `data-stars="dim"` |
| S8 | `close` | ink · M · W5 | `close/` | The medallion bookend and the sheet CTA |
| S9 | `credits` | ink · credits | `credits/` | The footer that chrome.js fills |
| | `categories-dialog` | dialog | `categories-dialog/` · `CategoriesDialog.js` | The rail of sixteen categories and one category's detail (`services-categories.js`, `ui-pager`, `ui-tabs`). From 760 px wide the rail runs across the top (Ours in three columns, Partners in two) over a two-column detail (the category and its action · the partners and notices); phones drill rail → category, and Insurance with listed partners splits into Ours · Partners tabs. Opened by "See All Nine Kinds of Help" and by category deep links (`cs:open`) |
| | `packages-dialog` | dialog | `packages-dialog/` · `PackagesDialog.js` | Three packages per own service from config `PACKAGES` (name, price, includes, bonus, free; [brackets] until the owner fills them; insurance has none). Opened by any `[data-packages="slug"]` button ("See Packages", in every own scene's action row; it replaced the "No prices online" line, owner 2026-11-01) |
| | `profile-dialog` | dialog | `profile-dialog/` · `ProfileDialog.js` | One partner profile filled from `PARTNERS` (`partner-profile.js`). Its inquiry button calls `ctx.inquireAbout(slug)` |

Page-level files: `_page.css` (first), `_own.css` (the shared S5a-S5e template, before their scene CSS), `_bands.css` (last), `services-data.js` (shared by the sections: `OURS`, `PARTNER_ONLY`, `FOUNDER_OFFERS` (an `href` = the CTA books a consultation), `BOOK_CTA`, `bookingHref`, `INSURANCE_HINT`, `insuranceLink`, `FOUNDER_REQUEST`, `isOurs`, `hasPartners`, `subPlaceholderCard`, `partnerTypeNames`, `profileTrigger`, `PAGE`, `PHONE_QUERY`). Sections import only from here and core, never from each other's folders.

The S5a-S5e 3D motifs (three.js, owner 2026-10-25) were removed (owner, 2026-11-07: still after the calm pass, so they no longer earned their place). Each own scene shows its greyscale service photo instead (`scene-photo`, `_own.css`, raised to `--photo-o` .55 ink / .42 bone / .36 gold, fading toward the copy). Do not re-add the motifs; three.js stays only for the Story building.

## Config and core used

- Config: `CATEGORIES`, `categoryBySlug`, `PARTNERS`, `FINDER_MIN_PARTNERS`, `CONTACT_EMAIL`, `SITE_NAME`, `FOUNDER_NAME`, `FOUNDER_LAST_NAME`, `FOUNDER_PHOTO`, `FOUNDER_PHOTOS` (`ours-insurance` names `data-founder-photo="navy"`), `FOUNDER_SIGNATURE`, `ORBIT_GROUPS`, `INSURANCE_INQUIRY_URL`. Data: `assets/data/cities.js` and `canada-map.js`.
- Insurance (v2 §6.1b): with `INSURANCE_INQUIRY_URL` set, "Ask About Insurance" (`[data-insurance-cta]`, wired in `pages/services.js`), the categories-dialog insurance CTA and the inquiry form (Insurance chosen → "Continue on the policy review site") open it in a new tab with the hint "Opens the policy review site". Empty = the old WhatsApp sheet behaviour.
- `[data-category-desc="slug"]` (S5a-S5e) is filled from the category description unless it is still a `[bracket]`.
- `[data-when]`: `FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`, `REVIEW_NOTES`.
- Core: `Section`, `ui-dialog`, `ui-stepper`, `ui-pager`, `ui-tabs`, `chrome.escapeHtml`/`placeholderCard`, `whatsapp.waLink`/`categoryMessage`/`buildIntro`, `lib/text-case.titleCase`.
- `ctx` extras from `pages/services.js`: `sound`, `fillWhatsAppLinks`, `leaveDialogsFor(id)`, `inquireAbout(slug)`, `prefillInquiry(values)`. Mount order: `Inquiry, CategoriesDialog, ProfileDialog, OursOutsourcing, Finder, Orbit, PackagesDialog` (the original wiring order, then the orbit and the packages dialog).
- A category slug must never equal a scene id here (README "How to add a category"). A founder-owned category also needs entries in `FOUNDER_OFFERS` (services-data.js) and `FOUNDER_LINES` (services-categories.js).

## Known open issues (plan/round5/final-audit.txt)

- Fit (2026-11-07, re-run after the calm-motion pass and the 2026-11-01 services): all 27 mode/viewport combinations fit; the short-phone bands in `orbit/`, `_own.css`, `ours-contractor/` and `ours-outsourcing/`, and the four-column own list in the categories dialog on short wide screens, hold the air and the spare. Earlier (2026-10-27): all 27 fit with `--fixture=partners-max`. Two approved exceptions remain and are expected in the output: the 13 px `.orbit__label` (owner, 2026-10-26) and 7 field changes on the page (owner, 2026-10-27: the offer scenes alternate light and dark so each reads as its own chapter; fit-audit's `IRIS_MAX` allows 7 here).
- Run: `node tools/fit-audit.mjs <site-url> services.html --states=tools/fit-states/services.mjs --fixture=partners-max`.
- Perf: initial JS 78.7 KB gzip against the raised 80 KB budget (owner, 2026-10-27), the tightest page.
- console-check cannot open `profile-dialog` (no trigger while `PARTNERS` is empty), nor `categories-dialog` in cut mode.
- Copy left for the third-person pass (plan Task 13): the dialog lead "three businesses" (a compliance sentence) is out of date; "Book a Free 15-Min Call" on `ours-insurance`.
- Owner content still missing: the one-line descriptions of the six v2 services, insurance company and licence, prices, guarantee wording, roles (`[brackets]`).
