# Services (`services.html`): sections/services

Entry `pages/services.js`, styles `pages/services.css`, spec `plan/round5/DIRECTION.md` §7.2 (S1-S9). Thirteen scenes plus credits, and two dialogs (v2, 2026-10-25: the orbit replaced `intro`, and five scenes for the services Cargado Strategies delivers itself follow outsourcing; spec `docs/superpowers/specs/2026-10-25-cargado-v2-design.md` §6.1-§6.3). Has the globe (S6 map, S8 medallion). The only page with partner data.

## Scenes, in order

| # | id (aliases) | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| S1 | `orbit` | ink · stage | `orbit/` · `Orbit.js` | The services orbit (`core/ui/ui-orbit.js`, `core/design/orbit.css`): the header logo image in the centre (`orbitLogoIn`, owner 2026-10-30) with the ten `ORBIT_GROUPS` round it as same-page #links, hover/focus/tap previews. The page's h1 and the "Ours / Partners" legend (`ORBIT_LEGEND` wording) |
| S2 | `ours-insurance` (insurance) | bone · O | `ours-insurance/` | The typographic portrait (founder full name, photo and signature slots), her question, the sheet CTA and the contact link. Licence `[brackets]` |
| S3 | `ours-strategy` (business-strategy, strategy) | bone · M | `ours-strategy/` | The business-strategy offer as a mega monument. `[$x]` price brackets |
| S4 | `ours-includes` | bone · R | `ours-includes/` | "What You Get": five rows, each with the pain it fixes |
| S5 | `ours-outsourcing` (outsourcing) | gold (metal) · D | `ours-outsourcing/` · `OursOutsourcing.js` | Four role panels, the page's one gold field. On phones they are an exclusive accordion. `REVIEW_NOTES` slots |
| S5a | `ours-web` (web-design) | ink · M | `ours-web/` | Web Design as a monument: `[bracket]` description from config, the no-prices line, "Book a Free Consultation" (`contact.html?service=web-design#book`) and the sheet link |
| S5b | `ours-creative` (graphics, virtual-assistant) | bone · D | `ours-creative/` | Graphics and Virtual Assistant as two panels; one CTA to `contact.html#book` (no preselect: two services) |
| S5c | `ours-software` (software-development) | ink · M | `ours-software/` | As S5a |
| S5d | `ours-contractor` (contractor) | bone · R | `ours-contractor/` | The description and the four config `items` as rows (keep them equal to config; a test checks) |
| S5e | `ours-trade` (export-import) | ink · M | `ours-trade/` | As S5a |
| S6 | `finder` (categories + every partner category slug) | ink · O → map · W4 | `finder/` · `Finder.js` | The concierge (`concierge.js`) while `PARTNERS.length < FINDER_MIN_PARTNERS`, otherwise the finder (`widget/finder*.js`: map of Canada, city/postal combobox, results sorted by distance only, pager). `Finder.choose()` runs before boot. `data-open="categories-dialog:*"` |
| S7 | `inquiry` | ink · P | `inquiry/` · `Inquiry.js` | A 3-step stepper on paper (`services-inquiry.js`, `ui-stepper`). `a[data-inquiry-category]` links preselect the category. `data-stars="dim"` |
| S8 | `close` | ink · M · W5 | `close/` | The medallion bookend and the sheet CTA |
| S9 | `credits` | ink · credits | `credits/` | The footer that chrome.js fills |
| | `categories-dialog` | dialog | `categories-dialog/` · `CategoriesDialog.js` | The rail of fifteen categories and one category's detail (`services-categories.js`, `ui-pager`, `ui-tabs`). From 760 px wide the rail runs across the top (Ours in three columns, Partners in two) over a two-column detail (the category and its action · the partners and notices); phones drill rail → category, and Insurance with listed partners splits into Ours · Partners tabs. Opened by "See All Nine Kinds of Help" and by category deep links (`cs:open`) |
| | `profile-dialog` | dialog | `profile-dialog/` · `ProfileDialog.js` | One partner profile filled from `PARTNERS` (`partner-profile.js`). Its inquiry button calls `ctx.inquireAbout(slug)` |

Page-level files: `_page.css` (first), `_own.css` (the shared S5a-S5e template, before their scene CSS), `_bands.css` (last), `services-data.js` (shared by the sections: `OURS`, `PARTNER_ONLY`, `FOUNDER_OFFERS` (an `href` = the CTA books a consultation), `BOOK_CTA`, `bookingHref`, `INSURANCE_HINT`, `insuranceLink`, `FOUNDER_REQUEST`, `isOurs`, `hasPartners`, `subPlaceholderCard`, `partnerTypeNames`, `profileTrigger`, `PAGE`, `PHONE_QUERY`). Sections import only from here and core, never from each other's folders.

The S5a-S5e 3D motifs (owner, 2026-10-25; the owner allowed the `three` npm package, pinned in package.json):
- `own-3d.js`: `Own3D extends Section` and `OWN_3D_SECTIONS` (one subclass per own scene, appended last to `mountSections`). It only decides when to load: a cut toward the scene, a landing on a neighbour, or a landing on it; tier C and Save-Data never load anything.
- `own-3d-config.js` (pure): `OWN_3D_SCENES` (scene id → motifs), `renderMode` (`off` tier C / Save-Data, `still` reduced motion, `demand` tier B: frames only while a finger drags, `live` tier A), `pixelRatio` (≤ `DPR_CAP` 1.5 and the tier's dpr), `viewFits`.
- `own-3d-stage.js` (the lazy chunk, `import()` only): imports three from the jsDelivr URL in dev; `build.mjs` (`THREE_URL`) maps that URL to `node_modules/three`. One `WebGLRenderer` and one canvas for the page, moved into the landing scene's `[data-own-3d]` box; each `[data-own-3d-view]` slot is a scissored viewport. The loop is `perf.createLoop` (parks after the 5 s input-idle rule, on a hidden tab, and on `leave`); the pointer is read on the scene element (the box has no pointer events).
- `own-3d-motifs.js`: the builders (`browser` web, `morph` graphics, `tiles` virtual assistant, `lattice` software, `house` contractor, `globe` trade), in the field's `--accent` only. `THREE_NEEDS` lists the three exports they use; the stage must import each (a test checks).
- Markup: each own scene starts its inner with `<div class="own__3d" data-own-3d data-fit-ignore aria-hidden="true">`; the slots sit in it (`--m` monuments, `--r` contractor) or, in `ours-creative`, in each panel (`--part`, aria-hidden and data-fit-ignore). CSS in `_own.css`; phones keep only the `--m` band (faint, top 24 %).
- Tests: `tests/own-3d.test.mjs` (modes, slots per scene, every motif builds in both golds against the npm three, the pinned version, no static three in the page chunk).

## Config and core used

- Config: `CATEGORIES`, `categoryBySlug`, `PARTNERS`, `FINDER_MIN_PARTNERS`, `CONTACT_EMAIL`, `SITE_NAME`, `FOUNDER_NAME`, `FOUNDER_LAST_NAME`, `FOUNDER_PHOTO`, `FOUNDER_PHOTOS` (`ours-insurance` names `data-founder-photo="navy"`), `FOUNDER_SIGNATURE`, `ORBIT_GROUPS`, `INSURANCE_INQUIRY_URL`. Data: `assets/data/cities.js` and `canada-map.js`.
- Insurance (v2 §6.1b): with `INSURANCE_INQUIRY_URL` set, "Ask About Insurance" (`[data-insurance-cta]`, wired in `pages/services.js`), the categories-dialog insurance CTA and the inquiry form (Insurance chosen → "Continue on the policy review site") open it in a new tab with the hint "Opens the policy review site". Empty = the old WhatsApp sheet behaviour.
- `[data-category-desc="slug"]` (S5a-S5e) is filled from the category description unless it is still a `[bracket]`.
- `[data-when]`: `FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`, `REVIEW_NOTES`.
- Core: `Section`, `ui-dialog`, `ui-stepper`, `ui-pager`, `ui-tabs`, `chrome.escapeHtml`/`placeholderCard`, `whatsapp.waLink`/`categoryMessage`/`buildIntro`, `lib/text-case.titleCase`.
- `ctx` extras from `pages/services.js`: `sound`, `fillWhatsAppLinks`, `leaveDialogsFor(id)`, `inquireAbout(slug)`, `prefillInquiry(values)`. Mount order: `Inquiry, CategoriesDialog, ProfileDialog, OursOutsourcing, Finder, Orbit, ...OWN_3D_SECTIONS` (the original wiring order, then the orbit, then the 3D motifs).
- A category slug must never equal a scene id here (README "How to add a category"). A founder-owned category also needs entries in `FOUNDER_OFFERS` (services-data.js) and `FOUNDER_LINES` (services-categories.js).

## Known open issues (plan/round5/final-audit.txt)

- Fit (2026-10-27): all 27 mode/viewport combinations fit with `--fixture=partners-max`. Two approved exceptions remain and are expected in the output: the 13 px `.orbit__label` (owner, 2026-10-26) and 7 field changes on the page (owner, 2026-10-27: the offer scenes alternate light and dark so each reads as its own chapter; fit-audit's `IRIS_MAX` allows 7 here).
- Run: `node tools/fit-audit.mjs <site-url> services.html --states=tools/fit-states/services.mjs --fixture=partners-max`.
- Perf: initial JS 78.7 KB gzip against the raised 80 KB budget (owner, 2026-10-27), the tightest page.
- console-check cannot open `profile-dialog` (no trigger while `PARTNERS` is empty), nor `categories-dialog` in cut mode.
- 3D motifs (2026-10-25): the stage chunk is about 543 kB minified (115 kB br), loaded only near S5a-S5e and only when the scene shows a motif at that size (phones skip contractor and creative).
- Copy left for the third-person pass (plan Task 13): the dialog lead "three businesses" (a compliance sentence) is out of date; "Book a Free 15-Min Call" on `ours-insurance`.
- Owner content still missing: the one-line descriptions of the six v2 services, insurance company and licence, prices, guarantee wording, roles (`[brackets]`).
