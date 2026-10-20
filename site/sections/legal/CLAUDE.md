# Legal (`legal.html`): sections/legal

Entry `pages/legal.js` (plus `pages/legal-fx.js`, its own chunk), styles `pages/legal.css`, spec `plan/round5/DIRECTION.md` §7.5 (L1-L8; FR16, SRS Appendix B). **Calm on purpose:** tier C locked (`<html data-tier="C" data-tier-lock>`), one bone field, and no splash, globe, stars, grain, cursor or sound. Every word here is compliance copy, and a lawyer in Canada must review it before launch.

## Scenes, in order

| # | id | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| (shell) | `.legal-draft` | band | in `legal.html`, not a section | The persistent C38 draft notice under the header. `pages/legal.js` publishes its height as `--banner-h`. It stays until counsel signs off |
| L1 | `contents` | bone · R | `contents/` | The five documents as index rows, with the draft notice as fine print |
| L2 | `disclosure` | bone · P | `disclosure/` · `Disclosure.js` | Professional disclosure, a paged reader (`LegalDoc`) |
| L3 | `privacy` | bone · P | `privacy/` · `Privacy.js` | Privacy policy, paged (CR06, CR07, CR10) |
| L4 | `terms` | bone · P | `terms/` · `Terms.js` | Terms of use, paged |
| L5 | `conduct` | bone · P | `conduct/` · `Conduct.js` | Partner code of conduct, paged (CR04) |
| L6 | `faq` | bone · R | `faq/` · `Faq.js` | The Q&A. One `ui-tabs` root in drill mode: from 760 px an exclusive accordion paged by height; on phones the list, then one answer ("All Questions", "Next Question") |
| L7 | `close` | bone · M | `close/` | A static medallion, one statement, and the sheet CTA (context "legal") |
| L8 | `credits` | bone · credits | `credits/` | The footer that chrome.js fills, on legal's bone field |

Page-level files: `_page.css` (first), `_documents.css` (rules shared by L2-L5, between contents and faq in cascade order), `_bands.css` (last), `LegalDoc.js` (base class of the documents and Faq: `ui-pager` `createPagedReader`; `rewind(scene)` opens page 1 on a deep link).

## Config and core used

- No config keys directly. The footer and the sheet read config through chrome.js and wa-sheet.js. `pages/legal.js` fills the `main a[data-wa-sheet]` no-JS hrefs.
- Flow: `legal.js` boots, then `import('./legal-fx.js')` → `initLegal(ctx)` → `mountSections([Disclosure, Privacy, Terms, Conduct, Faq], ctx)`. `film.on('deeplink')` waits for it, then `reveal()`: a Q&A answer opens, a clause turns to its page, a document opens on page 1. `legal-fx.js` imports `mountSections` from `core/main.js` on purpose (keeps the chunk count).
- Core: `Section`, `ui-pager`, `ui-tabs`, `film.refreshReach`. main.js skips layers, sfx, cursor and the globe on `page === 'legal'`.
- Deep links: `legal.html#disclosure`, `#privacy`, `#terms`, `#conduct`, `#faq`.

## Known open issues (plan/round5/final-audit.txt)

- Fit flow: #7 `credits` spare 21 < 24 at 360x740. Film and touch are clean.
- Always run with the counsel-length stand-in: `node tools/fit-audit.mjs <url> legal.html --states=tools/fit-states/legal.mjs --ph-repeat=3` (also `--flow` and `--touch`).
- Perf: initial JS gzip 51.3 KB against the legal budget of 40 KB (FAIL). Never add imports to legal's entry path. Keep heavy modules dynamic.
- Owner and lawyer content: `[date]`, privacy officer, retention period, governing `[province]`, cookie and analytics tools, entity names and licence numbers.
