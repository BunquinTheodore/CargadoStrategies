# Restructure verification (verifier, port 8620) · 2026-10-20

## Requests handled (plan/restructure/requests.md, all marked [x])

- build.mjs `PAGES`: home, services, partners, story, legal now point at `pages/<page>.js`; home, partners, story and legal point at `pages/<page>.css`. Services CSS is still `assets/css/services.css`, because it was never split.
- build.mjs `cssBundle`: new `inlineCss()` replaces each `@import "x";` with the file's contents, resolved from the importing file and recursively, before the files are joined.
- Deleted the services build forwarder `site/assets/js/services.js`.
- Docs: `site/ENGINE.md` (the script tag example, the §5 page module example and the conventions line) and `site/README.md` (the "Other files" line and the services-data / services-categories paths).

## Regression found and fixed

- **Problem:** `core/Section.js` became its own shared chunk, so index, services, partners and story each modulepreloaded one more chunk than golden (dist HTML differed). Legal-fx also lazily fetched that chunk.
- **Fix:**
  - `core/main.js` re-exports `{ Section, mountSections }`.
  - `pages/legal-fx.js` imports `mountSections` from `core/main.js`.
- **Result:**
  - Section.js now sits in the engine chunk: 16 chunks, as in golden.
  - Modulepreload counts match golden (13 / 16 / 15 / 12 / 11), and all dist HTML is identical.
  - Cost: the engine chunk is 1085 B larger (Section.js), with no extra request.

## Results

| Gate | Result | Baseline | Verdict |
|---|---|---|---|
| `npm run build` | exit 0, 5 pages, no warnings | exit 0 | PASS |
| golden-diff site (assembled HTML) vs golden | identical (5 site pages) | identical | PASS |
| golden-diff dist HTML + CSS vs golden | all 5 HTML identical after normalisation; all 5 CSS byte-identical, same hashes | identical | PASS |
| golden-diff dist JS | 8 JS outputs differ (the code moved into classes, so minified names differ); chunk count 16 = golden | n/a (JS not gated) | expected |
| console-check (site/, 5 pages, cut/touch/flow, with and without ?review=1) | Clean: 0 errors, 0 warnings | 0 | PASS |
| console-check (dist/, legal + index) | Clean: 0 errors, 0 warnings | 0 | PASS |
| compliance-diff (site/) | 0 missing, 0 altered | 0 / 0 | PASS |
| seek-test (site/, tiers A and C, 1440x900 and 390x844) | 1 frame fails: index 390x844 A #4->#5 @0.5 text over globe | the same 1 frame | PASS (no new failures) |
| fit-audit film, all 9 vp: index (home states) | 0 failures | 0 | PASS |
| fit-audit film: services | 0 failures | 0 | PASS |
| fit-audit film: story | 0 failures | 0 | PASS |
| fit-audit film: partners | 1 failure: #4 apply @1366x768, spare 37 < 40 (all-errors) | the same 1 | PASS (same) |
| fit-audit film: legal (--ph-repeat=3) | 0 failures | 0 | PASS |
| Imports and references to removed paths | none (every relative import, `@import`, HTML ref and @section marker resolves; esbuild resolves all 5 entries) | n/a | PASS |
| site/assets/js contents | config.js only | config.js stays | PASS |

fit-audit ran against dist/ (served on 8620), as in plan/round5/final-audit.txt. Every other browser tool ran against site/ on 8620. Only one browser tool ran at a time. The server is stopped and no Chrome is left running.

## Still open (not a regression)

- Services CSS is not split: `site/assets/css/services.css` is whole. There is no `sections/services/*.css` and no `pages/services.css`. The build now supports `@import` lists, so a services split can be done the same way as the other pages.

# Fixer pass (port 8630): review findings

## Changes

- **Services CSS split (medium).**
  - `site/assets/css/services.css` has been split into twelve files, each a contiguous line range of the original in its original order:
    - `sections/services/_page.css` (section 1)
    - `intro`, `ours-insurance`, `ours-strategy`, `ours-includes`, `ours-outsourcing`, `finder`, `inquiry` and `close`, each in `<name>/<name>.css`
    - `categories-dialog/categories-dialog.css`, which also keeps the shared `.cats__title, .profile__title` rule
    - `profile-dialog/profile-dialog.css`
    - `sections/services/_bands.css` (section 11)
  - `pages/services.css` is the `@import` list in that order. It keeps the original header comment.
  - `services.html` and the `build.mjs` PAGES entry now point to `pages/services.css`. The old file and the empty `site/assets/css/` folder are removed.
  - **Build fix:** the CSS stdin `resolveDir` was `site/assets/css`, which no longer exists. It is now `site/core/design`, which is also two levels below `site/`, so `../../assets/img/` resolves the same way. The ENGINE.md conventions line is updated.
- **Home FAQ dialog (medium).**
  - The `<dialog id="faq-dialog">` bytes moved to `sections/home/faq-dialog/faq-dialog.html`. The shell keeps its comment and the marker `<!-- @section home/faq-dialog -->`, the same pattern as the partners dialogs.
  - Its four rules (the end of `close/close.css`, directly before `_bands.css`) moved to `faq-dialog/faq-dialog.css`. That file is imported right after `close.css`, so the cascade order is unchanged.
  - `Close.js` still wires the opener.
- **Tiers reaching into Apply (medium).**
  - `Tiers.js` no longer imports `apply/partners-form.js` and no longer queries `#apply-form`. It calls `this.ctx.selectTier(tier)`.
  - `pages/partners.js` imports `selectTier` and passes `selectTier: (tier) => selectTier(applyForm, tier)` in the ctx to `mountSections`. The mount order and call order are the same.
- **Services cross-section imports (medium).**
  - `profileTrigger` and `partnerTypeNames` moved from `profile-dialog/partner-profile.js` to `sections/services/services-data.js`.
  - `services-categories.js`, `finder-results.js` and `partner-profile.js` now import them from there. `partner-profile.js` keeps only `initProfiles` and `profileBody`.
  - No section module imports another section's folder any more (checked with grep).

## Results

| Gate | Result | Verdict |
|---|---|---|
| `npm run build` | exit 0, 5 pages, no warnings | PASS |
| golden-diff site (assembled HTML) | identical (5 site pages) | PASS |
| golden-diff dist HTML + CSS | all identical (services CSS byte-identical after the split) | PASS |
| golden-diff dist JS | the same 8 minified-name JS differences as before; chunk-#.js count 16 = golden; dist/assets/chunks 36 = 36 | expected |
| console-check (site/, 8630, 5 pages, cut/touch/flow, with and without ?review=1) | Clean: 0 errors, 0 warnings | PASS |
| compliance-diff (site/, 8630) | 0 missing, 0 altered | PASS |
| Tier smoke test (partners.html?tier=growth, then click the first tier) | the form's tier = growth, then community; the radio follows | PASS |

Only one browser tool ran at a time. The 8630 server is stopped and no Chrome is left running.
