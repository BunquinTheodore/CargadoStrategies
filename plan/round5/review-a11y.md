# Round 5 · Specialist review: a11y (round 1)

Read-only. Live checks ran on `dist` (built 21:14) through my own `node serve.mjs dist 8452` and an isolated headless Chrome (CDP, axe-core 4.10.2 injected). The server and Chrome were stopped afterwards. The dev server on port 8000 was not touched. Evidence also comes from `plan/round5/shots-r5/review-1/`, where console-check, fit-film, fit-flow and fit-touch are all at 0.

Score: n/a (specialist reviewer). There are **3 real defects**, all minor. Everything else in scope passed.

## Defects (verified)

| # | sev | file to change | defect | evidence | fix |
|---|---|---|---|---|---|
| A1 | medium | `site/legal.html` (legal agent; the draft band) | axe `region` violation (T6 requires 0). The `.legal-draft` band sits outside every landmark. `role="note"` is not a landmark. | axe on legal.html in cut, touch-cut and flow: 1 violation each, `.legal-draft :: Some page content is not contained by landmarks`. The other 4 pages have 0. | Change `<div class="legal-draft" role="note" aria-label="Draft notice">` to `<aside class="legal-draft" aria-label="Draft notice">`, which is a complementary landmark. The wording stays unchanged. |
| A2 | low | `site/assets/css/ui.css` (2b; sheet §13) | In the WhatsApp sheet, the phone link's tap area is mostly covered by the email link. Both are inline `.link`s with 12 px padding-block. When the line wraps, the email's padding box sits over the lower part of the phone link. | At 360×740 and 390×844 (step 3 "Rather call or email?", and the success line after "Open WhatsApp"), `elementFromPoint` returns the email link at 10/30/50/70/90% of the phone link's height for 3 of 5 points. Phone link box 667–712, email 689–734 (overlap 23 px). The phone number's own effective target is about 22 px, against T6's ≥ 44 px. | `.sheet__contact .link, .sheet__done .link { display: inline-block; }`, so each line box grows to the 44 px hit area and nothing overlaps. Sheet spare is ≥ 99 px per 2d, so it still fits at 360×740. |
| A3 | low | `site/assets/css/base.css` (2b; header) | On phones the header brand link (monogram only, `.brand__word` hidden) is 36×44, under the 44 px target rule. The same `.brand` inside the menu bar is also 36×44. | The target scan at 360×740 touch-cut on all 5 pages (every scene) found `Cargado Strategies, home 36x44` as the only undersized target. The menu scan found the same. | In the phone block next to `.brand__word { display: none; }`, add `.brand { min-width: var(--tap-min); justify-content: center; }`. |

## What passed (with numbers)

- **axe-core.** 15 runs (5 pages × cut / touch-cut / flow) gave 0 violations except A1. Every dialog and sheet scanned while open had 0 violations:
  - menu;
  - `wa-sheet` at steps 1 and 3, desktop and phone;
  - the sheet opened from all 38 in-scene triggers, on ink, bone and gold fields;
  - `faq-dialog`, `categories-dialog`, `tiers-dialog`, `partner-faq`, each at 1440×900 and 360×740.

  The only flow-mode `color-contrast` "incompletes" were:
  - gradient or overlap backgrounds axe can't resolve;
  - the `aria-hidden` outline numerals;
  - the struck searches.

  The struck searches sit at 50% `--fg` on bone, which computes to 3.57:1 at ≥ 24 px quote size. That is large text, so ≥ 3:1 passes, and this is documented in fx.css §4.
- **14 px floor.** No visible text under 14 px:
  - on any page's landing scene in all 3 modes;
  - inside any open dialog, sheet or menu.

  fit-audit small-text is 0 in the review-1 runs.
- **Dialogs (ui-dialog.js).** `showModal` traps focus. Tab cycles only inside the dialog (plus the browser UI). Escape closes it. Focus returns to the exact trigger in 8/8 dialog cases and in 38/38 sheet triggers across 5 pages × 2 viewports. (Two founder doors on phones were clicked while their accordion panel was collapsed; that is a probe artefact.) No dialog has an inner scroll at 360×740.
- **WhatsApp sheet.**
  - On open, focus goes to the step h3. The h3 reads "What Do You Need?, step 1 of 3", and the counter is `aria-hidden`.
  - Arrow keys only select a chip. Enter advances to "Your City, step 2 of 3", then to "Open WhatsApp, step 3 of 3", and the visible count follows.
  - On step 3 the Tab order is Back → Open WhatsApp (with a "(opens in a new tab)" note) → phone → email.
  - The success line is `role="status"`.
  - The sheet opened from inside the menu returns focus to the Menu button.
  - Every sheet target is ≥ 44 px tall, except the overlap in A2.
- **Menu (chrome.js).**
  - Enter opens the menu, and `aria-expanded` goes true.
  - The Tab order is brand → Close → 5 page rows → contact (5) → 4 switches.
  - Escape closes it and focus returns to the Menu button.
  - PageDown, End and Space while it is open leave the scene unchanged (hero → hero).
  - After closing, PageDown cuts to `one-message`.
- **Key ownership.**
  - With the sheet open, PageDown does not cut (hero stays).
  - With focus in a partners apply input, PageDown, End and Space do not cut (apply stays).
- **Focus walk.** 70 Tabs per page:
  - cut 1440×900, flow 1440×900, touch-cut 390×844 and flow 360×740;
  - 0 focus targets under the header (header bottom 63 px, or 56 px on phones);
  - 0 off-screen, 0 in an inactive scene in cut and touch-cut, and 0 without a 2 px outline.

  The 4 flow-mode "inactive" hits on story were `is-active` not being kept in flow mode. They were on screen and below the header, so not a defect.
- **Footer switches.**
  - `aria-pressed` starts at Sound On=true and Motion Full=true.
  - Clicking "Reduced" reloads with `html.rm`, `localStorage['cs-motion']='reduced'`, Motion Reduced=true, the splash `display:none` and 0 running animations after load.
  - OS `prefers-reduced-motion` gives `html.rm` (flow) on all 5 pages.
- **Reduced motion CSS.** Every keyframe is guarded by `html.rm` or `prefers-reduced-motion`: sheet-in, the splash, next-breathe, cta-sheen, map-ping and vt-iris.
- **Live regions.** These are present and outside hidden containers:
  - the pager (`data-pager-live`);
  - the finder (`#finder-live`);
  - categories (`#cat-announce`);
  - the partners stepper (`data-step-live`);
  - the stepper errors (`role="alert"`).

## Not covered / limits
- Real screen readers (NVDA or VoiceOver) were not run. Announcements are inferred from the DOM and the accessibility names.
- The touch-cut checks used emulated touch at 390×844 and 360×740, not a real iOS or Android device.
