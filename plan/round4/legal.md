# Round 4 · legal.html: one screen per scene

> **Merge amendments (2026-10-17, `shared.md` wins over this file where they differ)**
> - **Scene 7 is `#credits`, not `#footer`** (D6).
>   - Use the `shared.md` §5.4 markup: `class="scene scene--credits"`, `data-dur="4"`, the `globe-anchor--credits` anchor, `aria-label="Contact and legal"` and `data-title="Contact and Legal"`. There is no `data-iris` and no `data-pose-sm`.
>   - Every `.scene--footer` rule below reads `.scene--credits`.
>   - The footer CSS lives in base.css and ui.css (stage 2b).
>   - legal.js registers `createPoseFitter({ onlyAnchored: true })` from `globe-fit.js`.
> - **Font floors (§3.1):**
>   - Compliance notices and the footer notice are `var(--fs-note)`: **16 px from 760 px and 15 px on phones** (not 14 px or 0.875rem; D8).
>   - The draft banner `.legal-draft__text` keeps 12 px under a listed exemption, which is flagged for the compliance reviewer.
>   - Re-run the fit with `--ph-repeat=3`.
> - **§5.1 pager:**
>   - `createPagedReader` is in `ui-pager.js` exactly as specified here.
>   - The bar is **`nav.pager[data-pager-bar]`** (was `.pager__bar`), with the live span `[data-pager-live]` and the counters `[data-pager-current]` / `[data-pager-total]`. The base CSS is in ui.css; legal.css only sizes it.
> - **§5.2 tabs:**
>   - Call `createTabs(root, { activeWhen: '(min-width: 760px)', inactive: 'drill', film, onChange, onModeChange })`.
>   - `setTabStop(el, '0' | '-1', film)` takes **a string value, not a boolean, and never writes `''`** (D11). The check by scene stays, through `film.isParked`.
>   - `select()` and `open()` take the panel id (the key).
> - **S1, S2, S3, S5, S9, S10, S11, S12 and S13** are accepted in `shared.md`.
> - **S6** is in `shared.md` §8, with `--ph-repeat=3` as the fixture flag (it was `--fixture=ph3`).
> - **S7** is replaced by `shared.md` §7.3: `[data-swipe-x]` is not an opt-out, and only mostly horizontal gestures are ignored.
> - **S8** is merged into §5.4.
> - **`.scene--fill`** (base.css) replaces `.legal-doc .scene__pan`.
> - **Files this page may edit** are in `build-order.md`.

Layout spec for `site/legal.html`, `assets/css/legal.css`, `assets/js/legal.js` and `assets/js/legal-fx.js`. It also extends two shared components that services.md proposes (SHARED-7): `ui-pager.js` and `ui-tabs.js`.

- **Brief:** PLAN.md "Round 4: one screen per section".
- **Acceptance test:** all of the following at all nine viewports.
  - `node tools/fit-audit.mjs http://localhost:8000/ legal.html` reports 0 overflow (Y and X) and no inner scroll containers.
  - The same with `--flow`.
  - The new pager check (§9, S6) reports 0 clipped pager pages (documents and phone Q&A answers).
  - All of the above again with the placeholder fixture `--fixture=ph3` (§9, S6), which triples every `.ph` placeholder.

The rule for this page: **long text is paged inside its scene. Nothing scrolls inside a box, and no text is ever clipped.** Footer links still deep-link to scenes (`legal.html#privacy` and the others).

**Tokens.** All shared tokens come from engine.md D2 and are not redefined here: `--u`, `--fs-*`, `--space-*`, `--header-h`, `--bottom-h`, `--scene-top`, `--scene-h`, `--scene-pad-top`, `--scene-pad-bottom` and `--scene-safe-h`. This page only adds page-local tokens built on `--u` (§3).

Lines marked **SHARED:** are proposals for the merger, for base.css, the engine, the shared components or the tools. They are collected in §9.

---

## 0. Measurements

### 0.1 Before Round 4 (2026-10-17, current site)

The current geometry on every viewport:
- `--header-h` 76 px (phones 64 px);
- banner `--draft-h` 43 px (phones 49 px);
- `--bottom-h` 72 px (phones 76 px);
- `.scene__pan` padding-block 12 px.

fit-audit, scene box overflow in px:

| scene | 1920×1080 | 1536×864 | 1440×900 | 1366×768 | 1280×720 | 1024×768 | 768×1024 | 390×844 | 360×740 |
|---|---|---|---|---|---|---|---|---|---|
| #0 contents | 0 | 0 | 0 | 0 | **+21** | **+32** | 0 | 0 | **+90** |
| #1 disclosure | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| #2 privacy | **+18** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| #3 terms | 0 | **+10** | **+10** | **+10** | **+10** | **+10** | **+12** | 0 | 0 |
| #4 conduct | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| #5 faq | 0 | **+10** | **+10** | **+10** | **+10** | **+10** | **+12** | 0 | 0 |
| #6 close | 0 | **+295 / X+23** | **+250 / X+7** | **+358 / X+27** | **+387 / X+49** | **+297 / X+114** | **+96 / X+179** | **+552 / X+312** | **+648 / X+342** |

There is also hidden overflow that the audit does not see. This table gives content height minus box height, in px, for the inner `.scene__scroll` boxes:

| document | 1920 | 1536 | 1440 | 1366 | 1280 | 1024 | 768p | 390 | 360 |
|---|---|---|---|---|---|---|---|---|---|
| disclosure | 0 | 0 | 0 | 67 | 170 | 231 | 138 | 375 | 581 |
| privacy | 175 | 391 | 355 | 487 | 535 | 541 | 448 | 621 | 751 |
| terms | 0 | 140 | 104 | 236 | 284 | 317 | 197 | 388 | 518 |
| conduct | 0 | 0 | 0 | 60 | 105 | 97 | 0 | 141 | 270 |
| faq, one answer open | 290 | 324 | 318 | 342 | 351 | 438 | 304 | 385 | 413 |

Causes:
- **Documents.** The face is a `.scene__scroll` with `overflow-y:auto` and `tabindex=0`.
  - Terms and Q&A overflow by +10 px because `.legal-panel` has `margin-bottom: 2×--sheet-off` on top of a row that is already 100% tall.
- **Q&A.** Opening a `<details>` answer grows the box by 3 to 6 lines.
- **Contents.**
  - The fixed 64 px `--space-xl` gap.
  - At 1024, a 3+2 card grid.
  - On phones, the 5 TOC rows plus the notice.
- **Close.**
  - The full chrome footer sits under the CTA in one scene: 324 px on desktop, 637 px on phones.
  - The X overflow comes from `.nowrap-md` spans in the split-line title.

### 0.2 After this spec (measured prototype)

The measurements below come from a scratch build of this spec at commit time:
- **Site copy:** `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\rv-legal2\site`
- **Probe:** `…\rv-legal2\check3.mjs`

The build uses the engine.md D2 tokens, the banner subtracted from the scene box (§3.2), and the paginator of §5.1.

How "clipped" is measured: every pager page is turned, and the probe records max(`offsetTop + offsetHeight` of the on-page items) − `window.clientHeight`. It was **0 for every page of every document at every viewport**.

Scene box (`.scene__inner` clientHeight, header and banner already subtracted) and content height, in px. "pages" is pages × items. "s" means snug (§5.1).

| viewport | box | contents | disclosure | privacy | terms | conduct | Q&A face | close | footer |
|---|---|---|---|---|---|---|---|---|---|
| 1920×1080 | 968 | 598 | 1 | 1 s | 1 | 1 | 553 | 535 | 331 |
| 1536×864 | 768 | 526 | 1 | 2 (4+4) | 1 | 1 | 534 | 408 | 327 |
| 1440×900 | 801 | 536 | 1 | 2 (4+4) | 1 | 1 | 537 | 416 | 322 |
| 1366×768 | 676 | 496 | 1 | 2 (4+4) | 1 s | 1 | 529 | 385 | 317 |
| 1280×720 | 628 | 474 | 1 | 2 (4+4) | 1 s | 1 | 529 | 373 | 312 |
| 1024×768 | 676 | 507 | 1 | 2 (4+4) | 1 s | 1 | 528 | 373 | 297 |
| 768×1024 | 916 | 594 | 1 | 1 s ¹ | 1 | 1 | 538 | 370 | 398 |
| 390×844 | 731 | 616 | 2 (2+3) | 2 (4+4) | 2 (3+3) | 1 ² | 564 fixed ³ | 399 | 535 |
| 360×740 | 634 | 614 | 2 ² | 3 s (3+3+2) | 2 s (3+3) | 2 (3+3) | 477 fixed ³ | 413 | 549 |

¹ Only with the Privacy aside hidden at tablet-portrait (§4). With the aside shown the head is 130 px and Privacy needs 2 pages (snug total 707 px against a 687 px window). With it hidden: 707 / 707, one snug page.
² With the phone column widening of §4 (`--face-pad: 12px`, 1.625rem clause numbers). Before it: disclosure at 360 was 3 pages (2+2+1, a 140 px one-clause last page) and conduct at 390 was 2.
³ The phone Q&A face fills the scene and is the same height for the list and an open answer (§4 scene 5).

Notes on the table:
- **Contents** is `.scene__pan` scrollHeight, padding included, against the box.
- **Document faces:**
  - Desktop faces are 419–825 px tall in boxes of 628–968 px. Every document that pages is balanced, so no page is a short leftover.
  - Body text measured 16.0–16.4 px on desktop and 15 px on phones.
- **Q&A, phone:** the face is fixed by the scene, 477 px at 360×740 and 564 px at 390×844, in both the list state (questions 299–307 px tall inside it) and the open state (one answer with its bar; the tallest current answer needs 447 px at 360×740). Answers longer than the face page (§4 scene 5).
- **Phone text column** at 360 is 240 px, and 270 px at 390 (§4 phone CSS).
- Footnotes ¹–³ were measured after the second review with the probes in `…\scratchpad\rv-legal3\`.
- **Compliance text** as measured:
  - the banner is 12 px;
  - the Contents notice is 14 px on desktop and 15 px on phones;
  - the footer notice is 14 px.
- **Prototype gap:** it still had the `.legal-rule` spans that engine.md C4 deletes, so the real build gains about 8–14 px per document head.

---

## 1. Space budget (engine.md D2, minus the legal banner)

The banner is 36 px on desktop (one line of 12 px type, padding and a 6 px gap) and 49 px on phones (two lines).

Content budget = `--scene-safe-h` − banner = box − `--scene-pad-top` − `--scene-pad-bottom`.

| viewport | header | banner | box | pad t/b | **content budget** |
|---|---|---|---|---|---|
| 1920×1080 | 76 | 36 | 968 | 27/32 | **909** |
| 1536×864 | 60 | 36 | 768 | 22/26 | **720** |
| 1440×900 | 63 | 36 | 801 | 23/27 | **751** |
| 1366×768 | 56 | 36 | 676 | 19/23 | **634** |
| 1280×720 | 56 | 36 | 628 | 18/22 | **588** |
| 1024×768 | 56 | 36 | 676 | 19/23 | **634** |
| 768×1024 | 72 | 36 | 916 | 26/31 | **859** |
| 390×844 | 63 | 49 | 731 | 21/25 | **685** |
| 360×740 | 56 | 49 | 634 | 19/22 | **593** |

---

## 2. Bands

- **wide:** at least 1280 wide and at least 720 tall.
- **laptop-short:** 1024–1440 wide and 640–800 tall. It overlaps wide at 1280–1440. `--u` (height-bound wider than 3:2) handles both, so no separate media query is needed except where noted.
- **tablet-portrait:** 760–1099 wide in portrait (768×1024). It uses the stacked layout with desktop type sizes.
- **phone:** at most 759 wide in CSS. The tuning targets are 360–430.
- **short-landscape (under 560 tall):** the documented fallback (engine.md D4). engine.md B2 switches the scene box to `container-type: normal` with a content-sized `position: relative` inner box, so `height: 100%` on the pan and on the measuring pager has no definite height to resolve against. The reader therefore always measures one page: each document shows whole, with no pager bar, and the engine pans the scene. This is allowed by the documented fallback.

Media queries used in legal.css:
```css
@media (min-width: 1100px)                                                     /* wide + laptop: side-by-side documents */
@media (min-width: 760px) and (max-width: 1279px) and (min-aspect-ratio: 1/1)  /* 1024–1279 landscape: panel span-8 */
@media (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1)  /* 768×1024: stacked */
@media (max-width: 759px)                                                      /* phone: stacked, compact head */
@media (max-width: 759px) and (max-height: 760px)                              /* short phone (360×740 and similar) */
```
No `@container scene (max-height: …)` query is used on this page. Desktop scene boxes go as low as 628 px (1280×720), so any height-only container query in the 620–660 px range would also match desktops.

---

## 3. Page-level tokens and the banner

### 3.1 Tokens (legal.css; all built on engine.md `--u`)

`--u` = `min(1vw, 1.5svh)` from engine.md D2. Its values: 1920 → 16.2, 1536 → 13.0, 1440 → 13.5, 1366 → 11.5, 1280 → 10.8, 1024 → 10.2, 768 → 7.7, 390 → 3.9, 360 → 3.6.

```css
body[data-page="legal"] {
  --draft-gap: 6px;                                                         /* was 8px */
  --legal-measure: 64ch;
  --sheet-off: clamp(6px, 0.65 * var(--u), 10px);
  --sheet-turn: 0.7deg;
  --face-pad: clamp(16px, 2.2 * var(--u), 36px);                           /* 1920: 36 · 1280: 24 · phone: 16 */
  --legal-title: clamp(1.75rem, 0.75rem + 2.8 * var(--u), 3.25rem);       /* 1920: 52 · 1366: 44 · 1280: 42 · 1024: 41 · phone: 28 */
  --legal-num: clamp(3.5rem, 1rem + 6.4 * var(--u), 8rem);                 /* 1920: 120 · 1280: 85 · hidden <760 */
  --clause-fs: 0.9375rem;                                                   /* phone: 15px */
  --clause-lh: 1.6;
  --clause-title-fs: clamp(1.125rem, 0.9rem + 0.42 * var(--u), 1.375rem);
  --clause-pad-base: clamp(10px, 1.4 * var(--u), 20px);                     /* li padding-block, was 20px fixed */
  --clause-pad: var(--clause-pad-base);
  --toc-name: clamp(1.125rem, 0.8rem + 0.65 * var(--u), 1.5rem);
  --qa-q-fs: clamp(1rem, 0.8rem + 0.48 * var(--u), 1.3125rem);
  --qa-title-fs: clamp(1.25rem, 0.9rem + 0.7 * var(--u), 1.75rem);
  --pager-h: 48px;                                                          /* bar height incl. its top rule */
}
@media (min-width: 760px) {
  body[data-page="legal"] { --clause-fs: clamp(1rem, 0.875rem + 0.15 * var(--u), 1.0625rem); }  /* never below 16px on desktop: 1920 16.4 · others 16.0 */
}
```

**Font floors.** Nothing on this page may go below these sizes, in any mode, snug included:
- body and answers: 16 px at 760 and wider, 15 px on phones;
- compliance notices: 14 px, and 15 px for the Contents notice on phones;
- the banner and UI labels: 12 px.

Delete these from legal.css:
- `--fade-h`;
- `.legal-panel__face::after` (the sticky scroll fade) and `html:not(.film) .legal-panel__face::after`;
- `.legal-doc .scene__scroll .ph`. It becomes `.legal-panel__face .ph { white-space: normal; }`.

### 3.2 Banner height must reach the engine's `:root` tokens

engine.md D2 declares `--scene-top: calc(var(--header-h) + var(--banner-h, 0px))` on `:root`. Today `--banner-h` is set on `body`, and legal.js writes `--draft-h` on `body`. A custom property resolves where it is declared, so `:root` would never see the banner. Scenes would then start under it: the prototype showed this, with boxes 36–49 px too tall.

The fix:
- In `legal.js` `trackBannerHeight()`, write `document.documentElement.style.setProperty('--banner-h', `${height}px`)`. Keep writing `--draft-h` on `body` as well, for `scroll-margin` in legal.css.
- In legal.css, delete `--banner-h: var(--draft-h);` from the `body[data-page="legal"]` block.
- **CSS default, so the boxes are right before legal.js runs.** Any layout or film-map pass before `trackBannerHeight()` would otherwise use `--banner-h: 0` and make scene boxes 36–49 px too tall. Add to legal.css:
  ```css
  :root:has(body[data-page="legal"]) { --banner-h: 36px; }
  @media (max-width: 759px) { :root:has(body[data-page="legal"]) { --banner-h: 49px; } }
  ```
  The inline style that legal.js writes on `<html>` wins over these and corrects any difference.
- **SHARED (S1):** every page with a fixed band writes `--banner-h` on `<html>`.

### 3.3 Draft banner (persistent, compliance)

The banner gets slimmer by padding, never by type size. The text stays verbatim.

```css
.legal-draft__text { padding: 5px 12px; font: 500 0.75rem/1.3 var(--font-ui); letter-spacing: 0.1em; }   /* 12px; ≈30 + 6 gap = 36 */
.legal-draft__tag  { padding: 1px 7px; }
@media (max-width: 759px) { .legal-draft__text { padding: 5px 10px; letter-spacing: 0.04em; } }          /* still 12px; two lines ≈ 49 */
```

Delete the old phone rule `.legal-draft__text { … font-size: 0.625rem … }` (legal.css ~328).

Markup: the em dash after the gold "Draft" chip reads as a decorative dash before text, which the Round 4 removals ban. engine.md C4 leaves the treatment to this spec. The dash stays in the accessible and copied text but is hidden visually, so the compliance string stays verbatim:
```html
<!-- before --><p class="legal-draft__text"><span class="legal-draft__tag">Draft</span> — to be reviewed by a lawyer in Canada before launch</p>
<!-- after  --><p class="legal-draft__text"><span class="legal-draft__tag">Draft</span><span class="visually-hidden"> — </span>to be reviewed by a lawyer in Canada before launch</p>
```
This replaces engine.md C4's "Draft To be reviewed…", which would change the copy. If the compliance owner wants the dash visible, revert only this line.

---

## 4. Scene by scene

### All scenes: write `.scene__pan` in the HTML

Every `.scene__inner` on this page wraps its content in an explicit `<div class="scene__pan">…</div>`.
- `film.js` `prepareScene()` reuses an existing `:scope > .scene__pan`, so film mode is unchanged.
- Flow mode (`film-flow.js`) never creates one. With the pan in the markup, the engine.md B2 rule `.scene__pan { margin: auto; padding-block: var(--scene-pad-top) var(--scene-pad-bottom) }` and this page's `.scene__pan` rules apply in both modes.
- **SHARED (S2):** ENGINE.md §1 recommends writing `.scene__pan` in the markup on every page.

### Remove `.legal-rule` (engine.md C4)

Delete the five `<span class="legal-rule" aria-hidden="true"></span>`, the `.legal-rule` CSS, and `legal-fx.js` `addRuleDraw` with its `film.on('build', …)` registration. The markup samples below no longer contain it.

---

### Scene 0 · `#contents` (hero + index)

**Move: fluid scale + re-layout.** Existing attributes are unchanged: `data-field="ink" data-dur="5"`, and the poses stay as they are.

**Wide and laptop (760 wide and up, landscape):**
- The hero stays in 7/12 columns, with a row of five 3D index cards under it.
- `h1.t-hero` uses the engine `--fs-hero`: ≈99 px at 1920 and ≈72 px at 1280×720.
- The hero block keeps its stack: eyebrow → h1 → lead → notice → meta.
- `.toc { margin-top: var(--space-xl) }` uses the engine `--space-xl`, which is about 29 px at 1280×720 after the D3 short-screen guard.
- Measured: 474 px in a 628 box at 1280×720, and 507 in 676 at 1024×768.

```css
.toc__list { grid-template-columns: repeat(5, minmax(0, 1fr)); }   /* five in a row down to 900px wide (fixes 1024×768) */
@media (max-width: 899px) and (min-width: 760px) { .toc__list { grid-template-columns: repeat(3, minmax(0, 1fr)); } }   /* was max-width 1099 */
@media (min-width: 760px) {
  .toc__name { font-size: var(--toc-name); }
  .toc__link { padding: clamp(12px, 1.6 * var(--u), 20px) var(--space-s) var(--space-s); }
}
.legal-contents .notice { font-size: 0.875rem; }   /* compliance: was 0.8125rem (13px) */
```
Scroll-cue gutter rules: change `@media (min-width: 1100px)` to `(min-width: 900px)` (five cards). The 3-card rule applies only at 760–899.

**Tablet-portrait (768×1024):** three cards, then two. Measured 594 in 916.

**Phone:** a compact stack, with the index as divider rows. Measured 614 in 634 at 360×740 (it was +90 over) and 616 in 731 at 390×844.
```css
@media (max-width: 759px) {
  .legal-contents .stack { --stack: var(--space-s); }                          /* was 20px */
  .legal-contents .t-lead { font-size: 0.9375rem; line-height: 1.5; }
  .legal-contents .notice { font-size: 0.9375rem; line-height: 1.5; padding-block: 6px; }   /* compliance: 15px on phones */
  .toc { margin-top: var(--space-m); }                                          /* was 32px */
  .toc__list { grid-template-columns: minmax(0, 1fr); }
  .toc__link { min-height: 44px; padding: 0 var(--space-2xs); align-items: center; }
  .toc__name { font-size: 1.0625rem; }
}
/* Short phones only (360×740 and similar): the eyebrow repeats the TOC, so it steps out. Never the notice.
   A media query, not a container query: a height-only @container rule would also match the 628 px desktop box at 1280×720. */
@media (max-width: 759px) and (max-height: 760px) { .legal-contents .stack > .eyebrow { display: none; } }
```

Markup: unchanged apart from `.scene__pan`. Every word stays: the eyebrow, the h1, the lead, the "Draft for review." notice and "Updated [date]". The eyebrow is shown on every viewport except phones 760 px tall or less, where it is `display: none` (it stays in the source).

Slack: at 360×740 Contents is 614 / 634, only 20 px. The placeholder fixture (§9 S6) must still pass here. If it fails, first lower `.toc { margin-top }` on short phones to `var(--space-s)`; never shrink the notice.

Hooks: unchanged.
- The cards keep `data-tilt`, `data-depth`, `data-cursor-label="Read"` and `addIndexFold`.
- The hero items keep `data-reveal`, and the TOC keeps its stagger.

---

### Document scenes 1–4: `#disclosure`, `#privacy`, `#terms`, `#conduct`

**Move: re-layout + paged reader.** No new scenes are added.
- Each document keeps its heading column (ghost numeral, eyebrow, title, meta, aside) and its 3D paper stack.
- The face is no longer an inner-scrolling box. It becomes a **fixed-height page window** with a pager bar.
- **Fit first, page second.** A document that nearly fits is set snug (§5.1) rather than split.
- The film and the engine never pan these scenes.

#### Layout per band

**Wide and laptop (1100 and up):** a 12-column grid with one row the height of the scene (`grid-template-rows: minmax(0,1fr)`, as now).

| scene | head | panel | mirror |
|---|---|---|---|
| disclosure | `span-4` | `span-7 start-6` | no |
| privacy | `span-4 start-9` | `span-7 start-1` | yes |
| terms | `span-4` | `span-7 start-6` | no |
| conduct | `span-4 start-9` | `span-7 start-1` | **yes**; it was a stacked layout (see below) |

From 760 to 1279 wide in landscape, the panel widens to `span-8`, starting at column 5 (column 1 when mirrored), with the head at `span-4`. This keeps the text column at 500 px or wider:
```css
@media (min-width: 760px) and (max-width: 1279px) and (min-aspect-ratio: 1/1) {
  .legal-grid > .legal-panel { grid-column: 5 / span 8; }
  .legal-grid--mirror > .legal-panel { grid-column: 1 / span 8; }
  .legal-grid--mirror > .legal-head { grid-column: 9 / span 4; }
}
```
- `.legal-head`: `align-self: start` (`legal-head--end` on terms stays `end`), with `gap: clamp(8px, 1.2 * var(--u), 12px)`.
- `.legal-title { font-size: var(--legal-title); max-width: 12ch; }`
- `.legal-num { font-size: var(--legal-num); }`
- `.legal-panel { align-self: center; max-height: 100%; margin-bottom: 0 }`.
  - The old +10 px came from `margin-bottom: 2×sheet-off`.
  - Room for the fanned sheets now comes from padding inside the cell: `padding: 0 calc(var(--sheet-off) * 2) calc(var(--sheet-off) * 2) 0; box-sizing: border-box`.
- `.legal-panel__face` is a flex column with `max-height: 100%`. The window (`height: var(--page-h)`) sits on top and the pager bar below it. The face no longer has `overflow` or `tabindex`.

**Tablet-portrait (760–1099, portrait):** stacked.
- The head row is full width, the numeral is hidden and the title is 2 lines (`max-width: none`).
- The panel is full width (`width: calc(100% - 2*var(--sheet-off))`) and fills the rest of the column.
- The Privacy aside ("Privacy contact: …") is hidden here, as on phones; the same contact stays in clause 06. With it shown, the Privacy head is 130 px tall and the document needs 2 pages (snug 707 px in a 687 px window). With it hidden: one snug page, 707 / 707.
- Measured: privacy fits on one snug page, and the others take one page.

```css
@media (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) {
  .legal-doc .legal-grid { display: flex; flex-direction: column; gap: var(--space-m); }
  .legal-doc .legal-head { flex: none; align-self: stretch; }
  .legal-doc .legal-panel { flex: 0 1 auto; min-height: 0; align-self: stretch; max-width: none; }
  .legal-num { display: none; }
  .legal-title { max-width: none; }
  #privacy .legal-aside { display: none; }                                  /* the contact stays in clause 06 */
}
```

**Phone (759 and under):** stacked, with a compact head.
```css
@media (max-width: 759px) {
  body[data-page="legal"] { --face-pad: 12px; }                            /* was 16px: wider text column */
  .legal-num { display: none; }
  .legal-head { gap: 6px; }
  .legal-title { font-size: clamp(1.625rem, 7.2vw, 2rem); max-width: none; line-height: 1.08; }
  .legal-aside { display: none; }                                           /* privacy: the same contact stays in clause 06 */
  .legal-doc#conduct .legal-aside { display: block; font-size: 0.875rem; }  /* conduct: keep "Every partner agrees…" */
  .clauses > li { grid-template-columns: 1.625rem minmax(0,1fr); }          /* was 2rem */
}
```
The text column is 240 px at 360 and 270 px at 390 (it was 226 px, about 30 characters per line).

Measured pages:
- 360×740: disclosure 2, privacy 3 (snug), terms 2 (snug), conduct 2.
- 390×844: disclosure 2, privacy 2, terms 2, conduct 1.
- Privacy and terms counts were measured before the column widening; it can only lower them. The fit loop (§10) re-measures all of them.

#### Conduct moves into the shared document layout

Before: `legal-grid--stacked`, a `span-8` head over a `span-12` two-column panel, with the "Become a Partner" link inside the scrolling face.

After: a mirrored document like Privacy.
- The five scenes now alternate L R L R, and the Q&A goes L.
- The list is a single column, so the paginator stays linear.
- The action moves into the head, so it can never be paged away.

```html
<div class="scene__inner"><div class="scene__pan">
  <div class="grid legal-grid legal-grid--mirror">
    <header class="span-4 start-9 legal-head">
      <span class="legal-num" aria-hidden="true">04</span>
      <p class="eyebrow" data-reveal="fade"><span class="num">04</span> / 05 · Partner Conduct</p>
      <h2 id="conduct-title" class="legal-title" data-reveal="lines">Partner Code of Conduct</h2>
      <p class="legal-meta" data-reveal="fade">Draft · Updated <span class="ph">[date]</span></p>
      <p class="legal-aside" data-reveal="fade">Every partner agrees to these commitments when they apply.</p>
      <p class="legal-head__action" data-reveal="fade"><a class="btn btn--link" href="partners.html">Become a Partner <span class="btn__arrow" aria-hidden="true">→</span></a></p>
    </header>
    <div class="span-7 start-1 legal-panel" data-reveal="fade" data-left="2"> … pager face with the 6 commitments (single column) … </div>
  </div>
</div></div>
```
Delete these from legal.css: `.legal-grid--stacked` (all rules), `.legal-panel--wide`, `.clauses--two`, `.legal-panel__face--wide` and `.legal-panel__action`. Add `.legal-head__action { margin-top: var(--space-xs); }`.

#### Document markup (disclosure shown; the other three have the same shape)

Before (abridged):
```html
<div class="span-7 start-6 legal-panel" data-reveal="fade">
  <span class="legal-sheet legal-sheet--2" …></span><span class="legal-sheet legal-sheet--1" …></span>
  <div class="scene__scroll legal-panel__face" tabindex="0" role="region" aria-label="Professional disclosure text">
    <ol class="clauses"><li><p>…</p></li> …</ol>
  </div>
</div>
```
After:
```html
<div class="span-7 start-6 legal-panel" data-reveal="fade" data-left="2">
  <span class="legal-sheet legal-sheet--2" aria-hidden="true"><span class="legal-sheet__paper" data-depth="-16"></span></span>
  <span class="legal-sheet legal-sheet--1" aria-hidden="true"><span class="legal-sheet__paper" data-depth="-8"></span></span>
  <div class="legal-panel__face pager" role="region" aria-label="Professional disclosure text" data-pager>
    <div class="pager__window" id="disclosure-pages" data-swipe-x>
      <ol class="clauses pager__track" data-pager-track>
        <li data-n="01" data-page-item><p>Cargado Strategies connects visitors …</p></li>
        <li data-n="02" data-page-item><p>…</p></li>
        <!-- … verbatim clause text, unchanged … -->
      </ol>
    </div>
    <div class="pager__bar" data-pager-bar hidden>
      <button class="pager__btn pager__btn--prev" type="button" data-pager-prev aria-controls="disclosure-pages" aria-disabled="true" data-magnetic>
        <span class="pager__arrow" aria-hidden="true">←</span><span class="pager__label">Previous<span class="visually-hidden"> page</span></span>
      </button>
      <p class="pager__status"><span class="visually-hidden">Page </span><span class="num" data-pager-current>1</span><span aria-hidden="true"> / </span><span class="visually-hidden"> of </span><span class="num" data-pager-total>1</span></p>
      <button class="pager__btn pager__btn--next" type="button" data-pager-next aria-controls="disclosure-pages" data-magnetic>
        <span class="pager__label">Next<span class="visually-hidden"> page</span></span><span class="pager__arrow" aria-hidden="true">→</span>
      </button>
    </div>
    <p class="visually-hidden" aria-live="polite" aria-atomic="true" data-pager-live></p>
  </div>
</div>
```
- The live region is a **direct child of the face** (the `[data-pager]` root), outside `.pager__bar`. The bar is hidden and unhidden on every measuring pass, and a live region inside it would leave the accessibility tree around each announcement, so NVDA or VoiceOver could drop "Page 2 of 3". The live region is never `hidden`.
- The window carries no `data-cursor-label`: the custom cursor runs only on fine pointers (cursor.js `initCursor` returns early otherwise), so a touch-only "Swipe" label would never render. The visible pager bar is the affordance.
- The window ids are `disclosure-pages`, `privacy-pages`, `terms-pages` and `conduct-pages`.
- Each `li` gets `data-n="01"…` in the HTML. Clause numbers no longer come from a CSS counter, because off-page items leave normal flow and a counter would restart on page 2.
- Privacy and terms keep `<h3 class="clause__title">` inside each li.

#### Document CSS (replaces the section 5 "film mode" rules and the section 6 "Clauses" sizes)

```css
/* The document fills its grid cell; the face is a page window + bar. Works in film AND flow (the pan is in the markup). */
.legal-doc .scene__pan { height: 100%; display: flex; flex-direction: column; }
.legal-doc .legal-grid { flex: 1; min-height: 0; grid-template-rows: minmax(0, 1fr); }
.legal-panel { display: flex; flex-direction: column; min-height: 0; max-height: 100%; align-self: center; box-sizing: border-box;
               padding: 0 calc(var(--sheet-off) * 2) calc(var(--sheet-off) * 2) 0; margin: 0; }
.legal-sheet { inset: 0 calc(var(--sheet-off) * 2) calc(var(--sheet-off) * 2) 0; }         /* sheets sit under the face, not under the padding */
.legal-panel__face { display: flex; flex-direction: column; min-height: 0; max-height: 100%;
                     padding: var(--space-xs) var(--face-pad) 0; }
.pager__window { position: relative; flex: none; height: var(--page-h, auto); overflow: clip; overflow-clip-margin: 6px;
                 touch-action: pan-y pinch-zoom; }   /* pinch-zoom must survive: under the film, body's `pan-x pinch-zoom` (engine.md A7)
                                                        intersects to `pinch-zoom`; horizontal pointer events still reach the swipe handler */
.pager.is-measuring { height: 100%; }
.pager.is-measuring .pager__window { flex: 1 1 auto; height: auto; min-height: 0; }
.pager__track { transform-origin: 0 50%; }
[data-page-item].is-off-page {                                                               /* off-page: kept for screen readers, never painted */
  position: absolute !important; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.clauses > li.is-page-first { border-top: 0; }
.clauses > li { padding: var(--clause-pad) 0; font-size: var(--clause-fs); line-height: var(--clause-lh);
                grid-template-columns: 2.5rem minmax(0, 1fr); }
.clauses > li::before { content: attr(data-n); }                                             /* was counter(clause) */
.clause__title { font-size: var(--clause-title-fs); }
/* Snug: tighter rhythm, same type size (never below the §3.1 floors). Set by the pager only when it saves a page. */
.pager.is-snug { --clause-pad: max(8px, calc(var(--clause-pad-base) * 0.6)); --clause-lh: 1.5; }

.pager__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-s);
              min-height: var(--pager-h); border-top: 1px solid var(--line); }
.pager__bar[hidden] { display: none; }
.pager__btn { display: inline-flex; align-items: center; gap: 0.5em; min-height: 44px; min-width: 44px; padding: 0 var(--space-xs);
              background: none; border: 0;
              font: 500 var(--fs-xs)/1 var(--font-ui); letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
.pager__btn[aria-disabled="true"] { color: var(--fg-muted); opacity: 0.45; cursor: default; }
.pager__status { font: 500 var(--fs-xs)/1 var(--font-ui); letter-spacing: 0.14em; color: var(--fg-muted); font-variant-numeric: tabular-nums; }
@media (max-width: 759px) { .pager__btn { letter-spacing: 0.08em; } }

/* The paper stack thins as you read: one sheet per page still to come (max 2). */
.legal-sheet__paper { transition: opacity 0.35s var(--ease); }
.legal-panel[data-left="1"] .legal-sheet--2 .legal-sheet__paper,
.legal-panel[data-left="0"] .legal-sheet .legal-sheet__paper { opacity: 0.18; }

@media print { [data-page-item].is-off-page { position: static !important; width: auto; height: auto; clip-path: none; white-space: normal; }
               .pager__window { height: auto; } .pager__bar { display: none; } }
html:not(.js) .pager__window { height: auto; }   /* no JS: whole document; outside the fit contract */
```
`data-left` sets how many sheets show. With 1 page, both sheets show at normal opacity (`data-left` = 2). Otherwise the pager sets it to `min(2, pages − 1 − current)`.

---

### Scene 5 · `#faq` (Q&A)

**Move: re-layout + responsive tabs.** No new scene is added.
- **760 and wider:** ARIA tabs (master–detail). The 3D flip runs when you switch answers.
- **Phones:** a question list. Choosing a question opens its answer **in place of the list**, with an "All Questions" and a "Next Question" control (PLAN toolkit item 5, disclosure as an in-scene panel).
- On every size, every question is visible as text before you choose one.
- The scene becomes non-mirrored, with the head on the left, so the five scenes alternate L R L R L.

#### Layout per band

- **Wide and laptop (1100 and up, and 1024×768):**
  - The head is `span-4` (start 1, `legal-head` without `--end`).
  - The panel is `span-7 start-6`, or `5 / span 8` from 760 to 1279 in landscape.
  - Face grid: `grid-template-columns: minmax(13rem, 5fr) minmax(0, 7fr); column-gap: var(--face-pad);`
  - Left: a vertical tablist of 6 rows with dividers. Each row is at least 48 px tall, with the number in accent and the question in display type at `--qa-q-fs`.
  - Right: the stacked answer panels. They all share one grid cell, so the cell is as tall as the tallest answer and the face never changes height.
  - Measured face: 528–553 px in boxes of 628–968.
- **Tablet-portrait:** the face is one column, with the full-text vertical tablist above the panel. Measured 538 in 916.
- **Phone (drill mode):** the grid becomes a flex column and the panel takes the rest of the scene below the head (`flex: 1 1 0; min-height: 0`), so the face has one fixed height in both states: 477 px at 360×740 and 564 px at 390×844. Opening an answer never changes its size, and the paper sheets never jump.
  - *List state:* six full-text question rows, each at least 48 px, at 1.0625rem display type, 299–307 px tall at the top of the face.
  - *Open state:* a 44 px bar ("← All Questions" on the left, "Next Question →" on the right), then the answer panel with its `h3` question at 1.125rem and the answer at `--clause-fs` (15 px) / 1.6. With the current text the tallest answer (05, "Does Cargado Give Advice?") needs 447 px at 360×740.
  - **Long answers page.** The `[Wording to be set by counsel.]` placeholders will be replaced by real commission wording, which is likely longer. Each answer's paragraphs are therefore `[data-page-item]`s in a paged reader (§5.1) that is active in drill mode. If an answer outgrows the space under its `h3`, it gets a pager bar and pages like a document. It never overflows.
  - There is no "tight" type step. Answers never shrink.

#### Markup

Before: `<div class="scene__scroll legal-panel__face legal-panel__face--faq" tabindex="0" role="region" …>`, holding 6 `<details class="acc">`.

After. The head changes too: `start-9` and `--end` are removed, and the grid is no longer mirrored. Classes carry both the shared `tabs__*` names (services SHARED-7) and the page's `qa__*` names. **The static HTML has no tab roles; `ui-tabs.js` adds them in tab mode only** (as home.md and services.md specify).
```html
<div class="scene__inner"><div class="scene__pan">
  <div class="grid legal-grid">
    <header class="span-4 legal-head">
      <span class="legal-num" aria-hidden="true">05</span>
      <p class="eyebrow" id="qa" data-reveal="fade"><span class="num">05</span> / 05 · Q&amp;A</p>
      <h2 id="faq-title" class="legal-title" data-reveal="lines">Straight Answers.</h2>
      <p class="legal-meta" data-reveal="fade">Draft · Updated <span class="ph">[date]</span></p>
    </header>
    <div class="span-7 start-6 legal-panel legal-panel--faq" data-reveal="fade">
      <span class="legal-sheet legal-sheet--2" aria-hidden="true"><span class="legal-sheet__paper" data-depth="-16"></span></span>
      <span class="legal-sheet legal-sheet--1" aria-hidden="true"><span class="legal-sheet__paper" data-depth="-8"></span></span>
      <div class="legal-panel__face qa tabs" role="region" aria-label="Questions and answers" data-tabs>
        <div class="tabs__list qa__tabs" aria-label="Questions">
          <button class="tabs__tab qa__tab" type="button" id="qa-tab-free" aria-controls="qa-free" data-cursor-label="Read">
            <span class="qa__n" aria-hidden="true">01</span><span class="qa__q">Why Is It Free for Me?</span></button>
          <button class="tabs__tab qa__tab" type="button" id="qa-tab-hire" aria-controls="qa-hire" data-cursor-label="Read">
            <span class="qa__n" aria-hidden="true">02</span><span class="qa__q">Do I Have to Hire Them?</span></button>
          <!-- 03 qa-listed "How Are Partners Listed?" · 04 qa-info "What Happens to My Information?"
               05 qa-advice "Does Cargado Give Advice?" · 06 qa-join "How Do I Become a Partner?" -->
        </div>
        <div class="qa__bar" data-tabs-bar hidden>
          <button class="qa__back" type="button" data-tabs-back><span aria-hidden="true">←</span> All Questions</button>
          <button class="qa__next" type="button" data-tabs-next>Next Question <span aria-hidden="true">→</span></button>
        </div>
        <div class="qa__panels">
          <section class="tabs__panel qa__panel is-current" id="qa-free" aria-labelledby="qa-free-title">
            <h3 class="qa__title" id="qa-free-title" tabindex="-1">Why Is It Free for Me?</h3>
            <div class="qa__body pager" data-pager data-pager-when="(max-width: 759px)">
              <div class="pager__window" id="qa-free-pages" data-swipe-x>
                <div class="qa__track pager__track" data-pager-track>
                  <p data-page-item>Partners may pay us a fee if you become their client. You never pay us for an introduction.</p>
                  <p data-page-item>Because Cargado Strategies may receive a commission, we say so on partner profiles, finder results and the inquiry form. <span class="ph">[Wording to be set by counsel.]</span></p>
                </div>
              </div>
              <div class="pager__bar" data-pager-bar hidden> … same prev / status / next as the documents, aria-controls="qa-free-pages" … </div>
              <p class="visually-hidden" aria-live="polite" aria-atomic="true" data-pager-live></p>
            </div>
          </section>
          <!-- five more panels, answer paragraphs moved verbatim from each .acc__body, one [data-page-item] per <p>
               (a list inside an answer is one item); ids qa-hire, qa-listed, qa-info, qa-advice, qa-join;
               h3 ids <id>-title; windows <id>-pages -->
        </div>
      </div>
    </div>
  </div>
</div></div>
```
Panel ids such as `#qa-advice` can be deep-linked (§6). `#qa` stays on the eyebrow because the footer links to it.

#### CSS

```css
.qa { display: grid; grid-template-columns: minmax(13rem, 5fr) minmax(0, 7fr); column-gap: var(--face-pad);
      padding-block: var(--space-xs) var(--face-pad); }
.qa__tabs { display: grid; align-content: start; }
.qa__tab { display: grid; grid-template-columns: 2.25rem minmax(0,1fr); align-items: baseline; gap: var(--space-xs);
           min-height: 48px; padding: var(--space-s) var(--space-xs); border: 0; border-top: 1px solid var(--line); background: none;
           text-align: left; font: 400 var(--qa-q-fs)/1.25 var(--font-display); color: var(--fg-muted); cursor: pointer; }
.qa__tab:first-child { border-top: 0; }
.qa__n { font: 500 0.8125rem/1 var(--font-ui); letter-spacing: 0.1em; color: var(--accent); font-variant-numeric: tabular-nums; }
/* Selected tab: a solid 2px accent rule on its leading edge + full-strength text.
   --accent is #7A5C12 on the bone field (≈6:1 against the face) and #0B0B0C on gold; it is never a translucent tint. */
.qa__tab[aria-selected="true"] { color: var(--fg); box-shadow: inset 2px 0 0 var(--accent); }
.qa__tab[aria-selected="true"] .qa__q { text-decoration: underline; text-decoration-color: var(--accent);
                                        text-decoration-thickness: 1px; text-underline-offset: 0.25em; }
.qa__panels { display: grid; perspective: 900px; }
.qa__panel { grid-area: 1 / 1; display: grid; align-content: start; gap: var(--space-s);
             font-size: var(--clause-fs); line-height: 1.6; transform-origin: 50% 0; }
.qa__panel:not(.is-current) { visibility: hidden; }          /* keeps the cell as tall as the tallest answer; out of the a11y tree and Tab order */
.qa__panel a { color: var(--accent); font-weight: 600; }
.qa__title { font: 400 var(--qa-title-fs)/1.2 var(--font-display); letter-spacing: var(--track-display); }
.qa__title:focus { outline: none; }                          /* programmatic focus target only (drill mode) */
.qa__bar[hidden] { display: none; }
.qa__back, .qa__next { display: inline-flex; align-items: center; gap: 0.5em; min-height: 44px; padding: 0; background: none; border: 0;
                       font: 500 var(--fs-xs)/1 var(--font-ui); letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); }
@media (prefers-reduced-motion: no-preference) {
  html.film .qa__panel.is-entering { animation: qa-flip 0.6s cubic-bezier(0.2, 0.75, 0.2, 1) both; }   /* was acc-flip */
}
@keyframes qa-flip { from { opacity: 0; transform: rotateX(-78deg) translateZ(-24px); } to { opacity: 1; transform: none; } }

@media (max-width: 1099px) and (max-aspect-ratio: 1/1), (max-width: 759px) {
  .qa { grid-template-columns: minmax(0, 1fr); row-gap: var(--space-s); }
}
.qa__track { display: grid; gap: var(--space-s); }            /* answer paragraphs; off-page items are absolute, so they take no gap */
@media (max-width: 759px) {                                  /* drill mode */
  /* The face fills the scene below the head and keeps one height in both states (477 px at 360×740, 564 at 390×844).
     --space-s, not --space-m: with --space-m the scene measured 636 px in a 634 px box at 360×740. */
  #faq .legal-grid { display: flex; flex-direction: column; gap: var(--space-s); }
  #faq .legal-panel--faq { flex: 1 1 0; min-height: 0; }
  .qa { flex: 1 1 auto; min-height: 0; align-content: start; grid-template-rows: auto minmax(0, 1fr); padding-block: var(--space-xs); }
  .qa.is-open { align-content: stretch; }
  /* definite heights all the way down, so the answer's paged reader can measure its window */
  .qa.is-open .qa__panels { min-height: 0; grid-template-rows: minmax(0, 1fr); }
  .qa__panel { grid-template-rows: auto minmax(0, 1fr); min-height: 0; }
  .qa__body { display: flex; flex-direction: column; min-height: 0; }
  .qa__tab { grid-template-columns: 2rem minmax(0,1fr); align-items: center; padding: 6px 0; font-size: 1.0625rem; }
  .qa__tab[aria-selected="true"] { box-shadow: none; }       /* no selection state in a list */
  .qa__tab[aria-selected="true"] .qa__q { text-decoration: none; }
  .qa:not(.is-open) .qa__panels { display: none; }
  .qa.is-open .qa__tabs { display: none; }
  .qa.is-open .qa__bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); }
  .qa__title { font-size: 1.125rem; }
}
@media (min-width: 760px) { .qa__bar { display: none !important; } }
html:not(.js) .qa { grid-template-columns: 1fr; }           /* no JS: the questions stack, then every answer in one column */
html:not(.js) .qa__tabs { display: none; }
html:not(.js) .qa__panel { grid-area: auto; visibility: visible; }
```
Answer pagers in tab mode (760 and wider): `data-pager-when` does not match, so the reader is dormant. It removes `.is-off-page`, keeps the bar hidden and clears `--page-h`, and the answers show whole in the shared tallest-answer cell (528–553 px faces in boxes of 628 px or more). The placeholder fixture (§9 S6) guards this. If a desktop viewport fails it once counsel's wording lands, change `data-pager-when` to `all` and give the tab-mode face a bounded height (`.legal-panel--faq { align-self: stretch } .qa__panels { grid-template-rows: minmax(0,1fr); min-height: 0 }`), so the answers page there too.
Delete the old `.legal-panel__face--faq …` rules, `acc-flip`, the FAQ `.acc` overrides and `.qa.is-tight` (it no longer exists). The base `.acc` stays in base.css for other pages.

---

### Scene 6 · `#close` (CTA)

**Move: split into a new scene + fluid scale.** The CTA keeps this scene, and the footer moves to a new scene, `#footer` (below). The close title loses `.nowrap-md`, which causes every X overflow.
```html
<!-- before -->
<h2 id="close-title" class="t-d1 close__title" data-reveal="lines">One Message. <span class="nowrap-md">The Right Person.</span> <span class="nowrap-md">Close to You.</span></h2>
…
<div data-footer></div>
<!-- after (inside .scene__inner > .scene__pan) -->
<h2 id="close-title" class="t-d1 close__title" data-reveal="lines">One Message. The Right Person. Close to You.</h2>
…   (the eyebrow, lead, WhatsApp button, "Back to Contents" link and hint stay verbatim; the <div data-footer> moves out)
```
```css
.legal-close .close__title { max-width: 10.5em; text-wrap: balance; }   /* 3 lines: "One Message. / The Right Person. / Close to You." */
.legal-close .stack-xl { --stack: 0; }
```
engine.md D3 already deletes `html.film .close { padding-top: clamp(24px, 9vh, 110px) }`, and `.scene__pan { margin: auto }` centres the CTA vertically.

Measured: 373 px in 628 at 1280×720, 413 in 634 at 360×740, and no X overflow.

Hooks are unchanged: `data-wa` (chrome fillSlots), the magnetic `.btn`, `data-reveal` and the SFX click.

### NEW Scene 7 · `#credits` (compact one-screen footer; was `#footer`, renamed by shared.md D6)

**Move: split into a new scene.** It follows `#close`.
```html
<!-- 8 · Footer (split from the close scene, Round 4) -->
<section class="scene scene--credits" id="credits" data-field="ink" data-dur="4"   <!-- shared.md §5.4: no data-iris, no data-pose-sm, add the globe anchor -->
         data-pose="1.7,0.9,0,0.3,3.3,0.5" data-pose-sm="1.56,1.3,0,0.3,3.3,0"
         data-title="Contact and Links" aria-label="Contact and links">
  <div class="scene__inner"><div class="scene__pan">
    <div data-footer></div>
  </div></div>
</section>
```
- `data-field="ink"` is the same as `#close`, so there is no colour change, and the iris opens from the bottom edge like a curtain.
- `data-dur="3"` is shorter than the close's 4. The pose continues the globe's y-rotation (2.9 → 3.3) and drifts it down and smaller.

Footer layout. This is **SHARED (S8)**: the chrome.js `footer()` markup is unchanged, and only base.css §10 changes. services.md SHARED-5 and story.md propose the same split; merge the rule sets.
- **Wide and laptop:** `.site-footer` is centred in the scene.
  - Brand `span-4`, then contact, company and legal at `span-2`/`span-3`/`span-3`.
  - Then the notice at full width, then the copyright.
  - Measured 297–331 px.
- **Tablet-portrait:** the brand at full width, then three columns of `span-4`. Measured 398 in 916.
- **Phone:**
  - The brand row is inline: a 32 px monogram, then the name and tagline on two lines.
  - The contact links sit inline in one row, each 44 px tall.
  - Company and Legal sit side by side (`span-6` each), with 44 px links.
  - Then the notice at 0.875rem/1.55, then the copyright.
  - Measured 549 in 634 at 360×740. It was 637 inside the close scene.

```css
/* SHARED (base.css §10) */
.scene--footer .scene__pan { display: flex; flex-direction: column; justify-content: center; }   /* both modes: the pan is in the markup */
.site-footer { row-gap: var(--space-l); padding-top: var(--space-l); }
.site-footer__notice { font-size: 0.875rem; line-height: 1.55; }   /* compliance: was --fs-xs (12px) */
@media (max-width: 759px) {
  .site-footer { row-gap: var(--space-m); }
  .site-footer__brand { grid-template-columns: 32px 1fr; column-gap: var(--space-s); align-items: center; }
  .site-footer__brand .monogram { width: 32px; height: 32px; grid-row: span 2; }
  .site-footer__col--contact .site-footer__links { display: flex; gap: var(--space-m); }
}
```

---

## 5. Components and JS

### 5.1 Paged reader: `assets/js/ui-pager.js` → `createPagedReader` (SHARED-ready)

services.md SHARED-7 proposes `ui-pager.js` with `createPager(list, { perPage })` for a fixed number of results per page. This page needs a **measured** pager, so the same module also exports `createPagedReader`. Both use the `.pager__bar` / `.pager__btn` / `.pager__status` CSS (S5).

API:
```js
export function createPagedReader(root /* [data-pager] */, { film, onTurn, when = root.dataset.pagerWhen || 'all' } = {})
// returns { goTo(page, { announce = true, animate = true, cause } = {}), reveal(el), refresh(), get page(), get pages(), get active(), destroy() }
// `when` is a media query. While it does not match, the reader is dormant: no .is-off-page, bar hidden, --page-h removed.
// The legal documents use 'all'; the Q&A answers use '(max-width: 759px)' (drill mode).
export function initPagedReaders(scope = document, opts) // inits every [data-pager] in scope, returns Map(root → api)
// root.csPager = api   (read by tools/fit-audit.mjs, S6)
```

**Measuring rule. Never use `getBoundingClientRect()` for pagination.** The film scales scenes and `addItemCascade` transforms the clauses. Rect heights include those transforms and read about 16% short. In the first version of this spec that cut 67–133 px of clauses off page 1, and fit-audit could not see it.
- Use layout values that ignore transforms: `offsetTop`, `offsetHeight` and `clientHeight`.
- Measure item heights as **offsetTop differences**, so the sum telescopes to the track's exact height and integer rounding never accumulates:

```js
const heights = () => items.map((el, i) =>
  (i + 1 < items.length ? items[i + 1].offsetTop : track.offsetHeight) - el.offsetTop);   // window is position:relative; track starts at 0
const TOL = 1;                                                       // px tolerance on every comparison
const greedy = (h, limit) => { const out = []; let a = 0, acc = 0;
  h.forEach((v, i) => { if (acc + v > limit + TOL && i > a) { out.push([a, i]); a = i; acc = 0; } acc += v; });
  out.push([a, h.length]); return out; };

function plan(snug) {                                                // one measuring pass
  root.classList.toggle('is-snug', snug);
  bar.hidden = true;
  const full = win.clientHeight;                                     // window at max size (is-measuring), no bar
  const h = heights(), total = sum(h);
  if (total <= full + TOL) return { snug, h, breaks: [[0, h.length]] };   // fits on one page
  bar.hidden = false;
  const limit = win.clientHeight;                                    // window shrank by the bar
  const pages = greedy(h, limit).length;
  let lo = Math.max(...h), hi = limit;                               // balance: smallest limit with the same page count
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (greedy(h, mid).length <= pages) hi = mid; else lo = mid; }
  return { snug, h, breaks: greedy(h, hi) };
}

function paginate() {
  if (!active || !root.getClientRects().length) return;           // dormant, or not rendered (e.g. a closed Q&A answer): skip
  root.classList.add('is-measuring');                              // no tween is killed here: offset* values ignore transforms
  items.forEach((el) => el.classList.remove('is-off-page', 'is-page-first'));
  let r = plan(false);
  if (r.breaks.length > 1) {                                         // fit first, page second
    const s = plan(true);
    r = s.breaks.length < r.breaks.length ? s : plan(false);         // keep snug only if it saves a page
  }
  breaks = r.breaks;
  const pageH = Math.ceil(Math.max(...breaks.map(([a, b]) => sum(r.h, a, b)))) + 1;
  root.style.setProperty('--page-h', `${pageH}px`);
  root.classList.remove('is-measuring');
  signature = `${win.clientWidth}|${r.snug}|${r.h.join(',')}`;
  show(Math.min(current, breaks.length - 1), { animate: false, announce: false });
}
```

**Verify after every `show()`.** Check the on-page items: max(`offsetTop + offsetHeight`) must be at most `win.clientHeight + 1`.
- If it is larger, run `paginate()` again (through the same scheduler, so during a turn it waits for the turn to finish). That covers fonts or content that changed since the last pass.
- If it is still larger after 2 retries, take the overflow off the limit and paginate once more.
- Never leave a clipped page.

**When to paginate.** Every trigger is rAF-debounced. A pass whose measured signature equals the previous one only re-runs `show(current)`.
1. On init, after `document.fonts.ready`.
2. On `document.fonts` `loadingdone`.
3. On `film.on('built')` and `film.on('rebuilt')`. These are the whole-film events (film.js 473, 526), not the per-scene `build`.
4. From a ResizeObserver on the panel (`root.closest('.legal-panel')`), on the root itself (so a Q&A answer that becomes visible is measured) **and on every `[data-page-item]`**, so late reflow of one clause is caught.
   - Turning a page resizes the items (off-page items become 1×1). That triggers one cheap pass whose signature matches, so it ends.
   - Entries whose target is `.is-off-page` are ignored.
5. On the `when` media query's `change` (activate or go dormant).

**No pass during a turn.** A `turning` flag is set when a turn's timeline starts and cleared in its `onComplete` (or immediately for an instant turn). While it is set, every trigger above only sets `pending = true`. When the turn completes, one pass runs if `pending` is set; its signature normally matches, so it only re-runs `show(current)`. This is what keeps `show(next)` inside the timeline, which resizes the items and fires the ResizeObserver, from cutting the 0.42 s turn-in short. `paginate()` never calls `gsap.killTweensOf(track)` and never clears the track's props: `offsetTop` and `offsetHeight` ignore transforms, so measuring is safe while the track is mid-tween.

**Snug.** The `.is-snug` class (§4 CSS) tightens `--clause-pad` to 60% of its base (minimum 8 px) and line-height to 1.5. Type size is unchanged. It is used only when it lowers the page count.
- It turns 1280×720 terms from 2 pages of 330 px (a 389 px face in a 628 box) into 1 page of 545.
- The same happens at 1366×768 and 1024×768 terms, 1920×1080 and 768×1024 privacy, and the phone privacy and terms.

`show(p)`:
- adds `.is-off-page` to the items outside `breaks[p]` and `.is-page-first` to the first item on the page;
- updates `[data-pager-current]` and `[data-pager-total]`;
- sets `aria-disabled` on prev and next (never `disabled`, so focus never drops);
- sets the panel's `data-left = String(breaks.length === 1 ? 2 : Math.min(2, breaks.length - 1 - p))`;
- writes `Page p+1 of N` into `[data-pager-live]` only when `announce` is set (the live region is a direct child of root, outside the bar, and is never hidden);
- dispatches `cs:pager` `{ page, pages }` on root;
- runs the verification step above.

**Short-landscape (under 560 tall).** The window has no definite height there (§2), so the reader measures one page, hides the bar, and the engine pans the scene. This is the documented fallback.

**Oversized item** (at 560 tall and up): an item taller than the window cannot be split, so it would clip. With the current text this never happens (the tallest clause is well under every window). The placeholder fixture (§9 S6) catches it if counsel's wording makes one item too tall; the fix is then to split that clause or answer into paragraphs, each its own `[data-page-item]`.

**Turning animation** (film mode, motion allowed). It is not scroll-linked, so it is a plain GSAP tween on the **track** (`[data-pager-track]`). It never touches the li elements, which the scrubbed `addItemCascade` owns.
```js
const dir = next > current ? 1 : -1;
turning = true;
turnTl?.progress(1);                                                 // a turn started mid-turn finishes the old one first
turnTl = gsap.timeline({ onComplete: () => { turning = false; if (pending) { pending = false; schedulePaginate(); } } })
  .to(track, { opacity: 0, x: -24 * dir, rotationY: 10 * dir, transformPerspective: 900, duration: 0.18, ease: 'power2.in' })
  .add(() => show(next))
  .fromTo(track, { opacity: 0, x: 24 * dir, rotationY: -10 * dir }, { opacity: 1, x: 0, rotationY: 0, duration: 0.42, ease: 'power3.out' })
  .add(() => gsap.set(track, { clearProps: 'transform,opacity' }));
```
In reduced motion, flow mode or `html.rm`, `show(next)` runs with no tween (and `turning` is never left set). Measuring may run while the track is transformed, because it reads only transform-free layout values; nothing in `paginate()` touches the turn's tweens.

Input:
- **Buttons:** prev and next. Clicking an aria-disabled button does nothing.
- **Keyboard:** while focus is inside root, ArrowLeft and ArrowRight turn pages and call `preventDefault()`. engine.md A6 already ignores `defaultPrevented` keys. ArrowUp, ArrowDown, PageUp, PageDown and Space are not consumed, so they keep moving between scenes. (Inside the Q&A tabs, PageUp/PageDown also need the A6 amendment in S12.)
- **Touch:** on `.pager__window`, a pointerdown → pointerup with |dx| ≥ 48 and |dx| > 1.5·|dy| turns the page. engine.md A7 already ignores horizontal-dominant gestures, and the window carries `data-swipe-x` (S7) for an explicit opt-out.
- **Trackpad horizontal wheel:** on the window, `|deltaX| > |deltaY|` with |deltaX| > 30 turns once, with a 450 ms lock. `preventDefault()` runs only in that case. The vertical wheel is never consumed.
- **Focus:** a `focusin` on an element inside an `.is-off-page` item calls `goTo(pageOf(item), { animate: false })`, so the focused element is visible. This covers a keyboard Tab into a link and a screen reader moving to it.
- **No focus moves on a turn.** Focus stays on the pressed button (the carousel pattern), and the live region announces "Page 2 of 3".

Screen readers:
- Off-page items are visually hidden but stay in the accessibility tree, so reading continues through the whole document without paging.
- The face keeps `role="region"` and its `aria-label`, and it loses `tabindex="0"`.

Film hooks:
- Pager buttons are ordinary `<button>`s, so `film.js` parks and unparks them. The pager never writes `tabindex`.
- `.pager__btn` carries `data-magnetic`. `.legal-panel` stays in the interact.js `TILT` list.
- No `data-cursor-label` on the window or the buttons. The cursor ring exists only on fine pointers, where the buttons are the way to turn; on touch the visible pager bar is the affordance.
- **SFX:**
  - A pointer click already plays the click blip (sfx hookPointer), so the pager adds nothing for `cause: 'pointer'`.
  - Keyboard, swipe and wheel turns play the page voice, with an explicit fallback: `sfx.play(sfx.has?.('page') ? 'page' : 'tick', { index: page })`.
  - `sfx.play` silently ignores unknown voices, so the fallback must be explicit (S9).
- **Deep links:**
  - `film.on('deeplink', ({ el, scene }) => …)`: if `el` is inside a pager item, call `api.reveal(el)` to turn to its page.
  - If `el` is the scene itself or its heading (footer links such as `legal.html#privacy`, or the TOC cards), call `goTo(0, { animate: false, announce: false })`, so a link always opens a document on page 1.
  - Flow mode emits the same `deeplink` event.
- A page change never changes the scene's height, because the window is fixed at `--page-h`. The film never rebuilds on a turn.

### 5.2 Tabs: `assets/js/ui-tabs.js` → `createTabs` (services SHARED-7), with a `drill` mode

```js
export function createTabs(root /* [data-tabs] */, {
  activeWhen = '(min-width: 760px)',   // tab mode when this matches
  inactive = 'all',                    // services/story/home: 'all' (every panel shows). Legal: 'drill'.
  film, onChange,
} = {}) // returns { select(id, { cause }), open(id, { cause }), close(), get current(), get mode() }
```

**Tab mode (760 and wider).** This is the WAI-ARIA APG tabs pattern.
- JS adds `role="tablist"` (with `aria-orientation="vertical"`), `role="tab"` with `aria-selected`, and `role="tabpanel"`.
- **Roving tab stop:** the selected tab is 0 and the others are −1. Activation is automatic (selection follows focus).
- Arrow Up/Left go to the previous tab and Arrow Down/Right to the next. Home and End go to the first and last tab. Each calls `preventDefault()`.
- `select(id)`:
  - sets `aria-selected` and `.is-current`;
  - adds `.is-entering` to the new panel for 600 ms (none in reduced motion);
  - calls `onChange({ id, cause })`.
- Inactive panels have `visibility:hidden`, which takes them out of the accessibility tree and the Tab order.

**Drill mode (`inactive: 'drill'`, under 760).** This is a list of questions, each opening an in-scene answer.
- JS removes the tab roles, `aria-selected` and `aria-orientation`. The question buttons keep `aria-controls` and get `aria-expanded="false"`. Every question button is a normal tab stop.
- Panels get `role="region"` (labelled by their `h3`).
- `open(id)`:
  - adds `.is-open` on root and `.is-current` on the panel, and unhides `[data-tabs-bar]`;
  - sets `aria-expanded="true"` on that question;
  - calls `panel.querySelector('[data-pager]')?.csPager?.refresh()` and `goTo(0, { animate: false, announce: false })`, so the answer is measured now that it is rendered and always opens on its first page;
  - moves focus to the panel's `h3` (`tabindex="-1"`), which announces the question;
  - hides "Next Question" on the last panel.
- Inside an open answer, ArrowLeft/ArrowRight turn the answer's pages (the reader's own handler); Escape still closes.
- "All Questions" (`[data-tabs-back]`) and Escape inside the open panel call `close()`. This removes `.is-open`, hides the bar and returns focus to the question button.
- "Next Question" calls `open(nextId)`.
- The face height never changes (§4 CSS), so the film never rebuilds.

**Mode changes** (matchMedia `change`):
- Re-apply the roles and keep the current panel.
- Drill mode starts closed unless a deep link opened a panel.
- Call `film.refreshReach?.()` (services SHARED-8), so new or changed tab stops are parked correctly.

**Film parking: a per-scene check.** This corrects the per-element `setTabStop` in story.md SHARED-D (S4).
- `film.js` `parkControls()` skips elements whose `tabIndex < 0`, so an unselected tab (−1) never gets `data-film-tab`. A per-element `hasAttribute('data-film-tab')` check therefore misses it.
- Example: a tab selected while its scene is parked. A `#qa-advice` deep link emits `deeplink` before the scene unparks. The new tab would get a live `tabindex=0` in a far scene.
- Decide by the **scene**:

```js
export function setTabStop(el, on, film) {
  const scene = el.closest('.scene');
  const parked = film?.isParked ? film.isParked(scene)                      // S4: film API
               : !!scene?.querySelector('[data-film-tab]');              // fallback: any parked control in the scene
  if (parked) { el.setAttribute('data-film-tab', on ? '' : '-1'); el.setAttribute('tabindex', '-1'); }
  else { el.removeAttribute('data-film-tab'); el.setAttribute('tabindex', on ? '0' : '-1'); }
}
```
In a parked scene, the new tab gets `data-film-tab=""` and keeps `tabindex=-1`, and the old tab gets `data-film-tab="-1"`. `unparkControls()` then restores 0 and −1 exactly. In drill mode, `setTabStop(btn, true)` runs for every question.

**SFX (tone only on a deliberate choice).**
- `onChange` and `open` receive `cause`: `'pointer' | 'key' | 'arrow' | 'deeplink' | 'mode'`.
- legal.js plays `sfx.play('tone', { field })` only for `'pointer'` and `'key'`. `'key'` means Enter or Space on a tab or question, which re-plays the tone even on the selected tab.
- Arrow-key selection, deep links and mode changes are silent. Arrowing through all six tabs no longer fires a tone at each step.

**Deep links:** on `deeplink`, if `el` is a panel or inside one, call `select(panel.id, { cause: 'deeplink' })` in tab mode or `open(panel.id, { cause: 'deeplink' })` in drill mode. Drill mode moves no focus on a deep link.

**No JS:** every question and answer shows in one column (CSS above). The page is then outside the fit contract.

### 5.3 Changes to `legal.js` and `legal-fx.js`

`legal.js`:
```js
import { initPagedReaders } from './ui-pager.js';
import { createTabs } from './ui-tabs.js';
import { sfx } from './sfx.js';
…
const { film } = boot();
[addNumeralDepth, addSheetFan, addItemCascade, addIndexFold].forEach((t) => film.on('build', t));   // addRuleDraw deleted (engine C4)
initPagedReaders(document, { film });   // the 4 documents (when 'all') and the 6 Q&A answers (data-pager-when, drill mode only)
document.querySelectorAll('[data-tabs]').forEach((el) => createTabs(el, {
  inactive: 'drill', film,
  onChange: ({ cause }) => {
    if (cause === 'pointer' || cause === 'key') sfx.play('tone', { field: el.closest('[data-field]')?.dataset.field });
  },
}));
initPanelFeedback({ film });
// trackBannerHeight(): also writes --banner-h on <html> (§3.2)
// delete dropPanelTabStops(): faces no longer carry tabindex
```
`legal-fx.js`:
- `addItemCascade`: the item selector becomes `face.querySelectorAll('.clauses > li, .qa__tab')`. It was `:scope > ol > li, :scope > details`.
  - Off-page items are 1×1 and clipped, so tweening them is harmless.
  - The pager measures with transform-free values (§5.1), so the cascade's transforms cannot distort pagination.
- `addSheetFan`: unchanged. It animates `.legal-sheet` transforms, while the pager only changes the opacity of `.legal-sheet__paper`.
- `addRuleDraw`: delete it (engine C4).
- `initPanelFeedback`:
  - delete `tickOnScroll`, `labelWhenScrollable`, `PANEL_TICK_PX`, `OVERFLOW_SLACK_PX` and `SCROLL_LABEL`;
  - delete `toneOnOpen`, whose tone moves to the tabs `onChange` above (deliberate choices only).
- The header comment changes to say "page turn" in place of "a soft tick while a document scrolls".

---

## 6. Deep links and navigation (must keep working)

| link | target | behaviour |
|---|---|---|
| footer `legal.html#disclosure` · `#privacy` · `#terms` · `#conduct` | scene id | goTo the scene; the pager resets to page 1 |
| footer `legal.html#qa` | eyebrow `#qa` in `#faq` | goTo `#faq` (the closest scene); tabs keep their selection; drill mode stays on the list |
| TOC cards `#disclosure` … `#faq` | scene id | as above |
| FAQ answer links `#privacy`, `#conduct`, `partners.html` | scene / page | unchanged |
| close "Back to Contents" `#contents` | scene | unchanged |
| NEW optional `legal.html#qa-advice` (any panel id) | panel | goTo `#faq`, then `select('qa-advice')` (tab mode) or `open('qa-advice')` (drill mode); parking-safe (§5.2) |

---

## 7. Compliance copy that must survive verbatim

Diff these before and after. They may move but must not be reworded, and none may be set below the §3.1 floors.
1. **Banner:** "Draft — to be reviewed by a lawyer in Canada before launch".
   - The text node is verbatim; the dash is only visually hidden (§3.3).
   - 12 px on every viewport.
2. **Contents notice:** "**Draft for review.** These pages are written to read as formal legal documents, but they are drafts and not legal advice. A lawyer in Canada must review and adjust every page, including the province and the privacy contact in [brackets], before the website goes live."
   - 14 px on desktop, 15 px on phones.
   - Also "Updated [date]".
3. **Every clause**, word for word, including each `.ph` placeholder: disclosure (5 clauses), privacy (8 sections with titles), terms (6 sections with titles) and conduct (6 commitments). The placeholders:
   - [Confirm entity names and licence numbers.] · [Wording to be set by counsel.] ×2
   - [privacy officer name and email] ×2 · [Retention period.] · [List the tools once chosen.]
   - [Counsel to adjust.] · [province] · [number]
4. **Document heads:**
   - Each document's "Draft · Updated [date]".
   - Privacy: "Privacy contact: [privacy officer name and email]". It is hidden on phones and at tablet-portrait (760–1099 portrait), where the same contact stays in clause 06. It shows on every landscape viewport of 760 and wider.
   - Conduct: "Every partner agrees to these commitments when they apply." (now visible on phones too) and the "Become a Partner" link.
5. **All six Q&A answers verbatim**, at the same size as body text (no tight step). Especially:
   - "A listing is not an endorsement or a recommendation"
   - "Cargado Strategies may receive a commission … [Wording to be set by counsel.]"
   - "[company name] · [licence #] · [regulator]"
   - "strategy and coaching only — not licensed accounting, tax or investment advice"
   - "Membership buys a listing and network tools only. It does not promise referrals or outcomes."
6. **Close:** "Opens WhatsApp with your message written. Nothing is sent until you tap send."
7. **Footer notice (chrome.js), 14 px:** "Partners are independent businesses, each responsible for their own licence and advice. Cargado Strategies does not give regulated advice through this website and may receive a commission when a referral becomes a client. [Wording to be confirmed by counsel]".
   - Also the tagline "Connected by Purpose. United in Service." and the WhatsApp +1 (204) 869 2508 and Facebook links.

Nothing on this page is shortened. Every fit comes from:
- spacing and the fluid scale;
- re-layout;
- snug paging;
- the tabs and drill list;
- the footer split.

The only purely decorative element hidden for space is the Contents eyebrow, and only on phones 760 px tall or less (`@media (max-width: 759px) and (max-height: 760px)`). It repeats the index and is not compliance copy. Every desktop and tablet viewport shows it, including 1280×720. The Privacy aside is hidden on phones and tablet-portrait only because its text stays on the page in clause 06.

---

## 8. Reduced motion / flow mode

- Scenes are one screen tall (engine.md B2), and the `.scene__pan` in the markup gives flow mode the same padding and flex column as film mode (§4).
- The same pager and tabs run:
  - pages change instantly;
  - there is no flip;
  - the sheets stay flat (`--sheet-turn: 0deg`, as now).
- Delete the flow-only overrides in legal.css §9 that assumed tall stacked documents: `html:not(.film) .legal-panel__face { padding-bottom }` and `html:not(.film) .legal-head--end { align-self: start }`.
- `html:not(.film) body[data-page="legal"] .scene [id] { scroll-margin-top … }` stays.
- Check with `fit-audit --flow` at all nine viewports, including the pager check (S6).

---

## 9. SHARED proposals (for the merger)

All tokens come from engine.md D2. This spec proposes none of its own.

- **SHARED S1: the banner contract.** A page with a fixed band under the header writes `--banner-h` on `<html>`, not on `body`. engine.md D2 resolves `--scene-top` on `:root`, where a body-level value is invisible (§3.2).
- **SHARED S2: `.scene__pan` in the markup.** ENGINE.md §1 recommends writing `<div class="scene__pan">` inside every `.scene__inner`. `film.js` reuses it, and flow mode then gets the same pan box, padding and page rules as film mode.
- **SHARED S3: `.scene--fill`.** This is a modifier for scenes whose content fills the box (the legal documents and the Q&A; services and the finder): `.scene--fill .scene__pan { height: 100%; display: flex; flex-direction: column; }`. If it lands, legal uses it on the 4 document scenes and `#faq`, and it replaces `.legal-doc .scene__pan`.
- **SHARED S4: parking-aware tab stops by scene.**
  - Add `film.isParked(el)` to film.js. It returns true when `el`'s scene is outside the reach set (`!scene.classList.contains('is-reachable')` once built). `createFlowFilm` returns false.
  - Replace story.md SHARED-D `setTabStop` with the per-scene version in §5.2. The per-element version misses tabs at −1, because `parkControls` skips them.
- **SHARED S5: components.**
  - `ui-pager.js` exports `createPager` (services, fixed per-page) and `createPagedReader` (legal, measured).
  - `ui-tabs.js` `createTabs` gains `inactive: 'all' | 'drill'`, plus `open`/`close`, `cause` in `onChange`, and the `[data-tabs-bar]`, `[data-tabs-back]` and `[data-tabs-next]` hooks.
  - The base CSS goes in a new base.css section, "Pager and tabs": the `.pager__bar`, `.pager__btn` and `.pager__status` rules and `[data-page-item].is-off-page`. Page CSS only sizes them.
- **SHARED S6: fit-audit sees clipped pager content.** In `tools/fit-audit.mjs`, after load:
  - For every `[data-pager]` with `root.csPager`, call `goTo(p, { animate: false, announce: false })` for each page. Report `clipped = max(offsetTop + offsetHeight of on-page items) − window.clientHeight` when it is above 1 px. Then return to page 0.
  - Generally, flag any non-`aria-hidden` element inside a scene whose computed `overflow` is `clip` or `hidden` and whose `scrollHeight > clientHeight + 1`. **Skip** (these are correct by design):
    - elements whose box is 2 px or less in either direction (`.visually-hidden`, base.css §17: the pager's "Page" / " of " / " page" spans, the live regions, the banner dash);
    - elements with a computed `clip` other than `auto` or a `clip-path` other than `none`;
    - `[data-page-item].is-off-page` (1×1, `overflow: hidden`);
    - `.rv-mask` line masks (base.css §4, `overflow: hidden` with a deliberate 0.12em bleed);
    - anything carrying `data-fit-ignore` or inside a `[data-pager]` window (the pager check above covers those).
  - **Placeholder fixture** (`--fixture=ph3`): before measuring, replace the text of every `.ph` with the same text repeated three times. Every viewport must still report 0 overflow, 0 inner scroll boxes and 0 clipped pager pages (documents and Q&A answers). This stands in for counsel's final wording, which is likely longer than the placeholders.
  - These count as failures, in both film and `--flow` runs, with and without the fixture.
- **SHARED S7: `data-swipe-x`.** film-snap (engine.md A7) ignores any gesture that starts inside `[data-swipe-x]`, as well as horizontal-dominant ones. Keys: engine.md A6 already ignores `defaultPrevented` keys. A pager window that sets its own `touch-action` must include `pinch-zoom` (`pan-y pinch-zoom`), because the browser keeps only what both the window and A7's `body { touch-action: pan-x pinch-zoom }` allow; `pan-y` alone resolves to `none` and kills pinch-zoom over the text.
- **SHARED S8: footer as its own final scene** on every page, with the compact footer CSS in §4 scene 7, including `.site-footer__notice` at 0.875rem. This merges with services.md SHARED-5.
- **SHARED S9: SFX.**
  - Add a `page` voice: `page: (ctx, out) => noise(ctx, out, { dur: 0.16, peak: 0.05, attack: 0.02, f0: 1800, f1: 5200 })` with `MIN_GAP_MS.page = 120`.
  - Add `sfx.has(name)` (`name in VOICES`). Callers that want a fallback must check it, because `play()` ignores unknown names silently.
- **SHARED S10: no `.nowrap-md` inside `[data-reveal="lines"]` headings.** It is the source of every close-scene X overflow (+7 to +342 px). Use `max-width` in em plus `text-wrap: balance`.
- **SHARED S11: retire `.scene__scroll`** (engine.md B1). Legal stops using it, so once every page has migrated, the base rules, `hasScrollBox` and `data-lenis-prevent` tagging can be deleted.
- **SHARED S12: amend engine.md A6 so tabs own only their own keys.** Today A6 treats `[role=tab|tablist]` as owning every key, so with focus on a Q&A tab (desktop tab mode) PageUp/PageDown are ignored by snap and fall through to native scrolling, which can leave the film part-way between scenes. Change: `role=tab` and `role=tablist` own **only** ArrowUp/Down/Left/Right, Home and End. PageUp, PageDown and Shift+Space still step scenes. Space on a tab is already owned by the `button` rule. The same split applies to any widget in the list whose APG pattern does not use PageUp/PageDown (radiogroup, radio, menu, menubar); listbox, grid and tree keep owning them.
- **SHARED S13: no height-only `@container scene` queries in the 620–660 px range for phone-only layout.** Desktop scene boxes reach 628 px (1280×720). A phone-only step-down must be scoped by width (`@media (max-width: 759px) and (max-height: …)`, or a container query wrapped in `@media (max-width: 759px)`). engine.md's `.short-hide` at `max-height: 640px` should be reviewed for the same reason.

---

## 10. Build order for legal (after the engine and shared tokens land)

1. **legal.html markup:**
   - `.scene__pan` in every scene;
   - the documents to the pager markup, with `data-n` on each li;
   - the conduct re-layout;
   - the Q&A list/tabs, with no static roles;
   - the close title;
   - the new `#footer` scene;
   - the banner dash;
   - delete the `.legal-rule` spans.
2. **legal.css:**
   - the tokens (§3.1);
   - delete the scroll, fade, stacked, rule, `is-tight` and old banner-shrink rules;
   - the banner, notices, document, pager, Q&A and footer rules per band.
3. **JS:**
   - `ui-pager.js` `createPagedReader` and `ui-tabs.js` drill mode;
   - `setTabStop` per scene;
   - the legal.js and legal-fx.js edits;
   - `--banner-h` on `<html>`.
4. **Fit loop:** loop `node tools/fit-audit.mjs http://localhost:8000/ legal.html` and `… --flow`, each also with `--fixture=ph3`, until every viewport reads 0, with no inner scrollers and no clipped pager pages (S6). Then check:
   - **Pagination:** turn every page at 1366×768 and 360×740, both after a cold load and after a resize. Nothing is clipped (the probe in §0.2).
   - **Turn animation:** in film mode with motion allowed, a turn runs its full 0.18 s out + 0.42 s in (record `track` opacity over 600 ms; it must pass through intermediate values after `show(next)`), and no `paginate()` pass runs until it completes.
   - **Pinch-zoom:** on a touch device (or CDP touch emulation), the computed `touch-action` of `.pager__window` is `pan-y pinch-zoom` and a pinch over the text zooms in both modes.
   - **Contents eyebrow:** visible at 1280×720 and every desktop/tablet viewport; hidden only at 360×740 and other phones 760 px tall or less.
   - **Phone Q&A:** the face height is identical in the list and open states at 360×740 (477) and 390×844 (564); with `--fixture=ph3`, the longest answer pages instead of overflowing.
   - **Live region:** with NVDA or VoiceOver, every turn announces "Page N of M", including the first turn after a cold load.
   - **PageUp/PageDown** with focus on a Q&A tab step scenes (S12).
   - **Tab order:**
     - pager buttons are parked off-scene;
     - Tab into an off-page link turns the page;
     - `#qa-advice` from another page leaves no stray tab stop in the far scenes.
   - **Screen readers:** VoiceOver/NVDA read every clause, and drill mode announces the question on open and returns focus on "All Questions".
   - **Arrow keys** inside the tabs and the pager do not move the scene. Arrowing through the tabs plays no tone.
   - **Deep links** `#privacy` and `#qa` work from another page's footer.
   - **Reduced motion.**
   - **Compliance diff** (§7), including the font floors.

---

## Critique responses (review 1)

Each point of the adversarial review was checked against the files and the measurements. Where the review's numbers differ from the final ones, the reason is given.

1. **CRITICAL: transformed measurement clips text.** Accepted. The cause is confirmed: rect heights include the scene scale and the cascade transforms.
   - §5.1 now measures with `offsetTop` differences, compares with a 1 px tolerance and sets `pageH = ceil(max) + 1`.
   - It re-paginates on fonts `loadingdone`, on `built`/`rebuilt` and from a ResizeObserver on the items.
   - It verifies after every `show()`.
   - S6 adds the fit-audit pager check.
   - Measured: 0 px clipped on every page at all 9 viewports.
2. **HIGH: phone tabs under 44 px, and hidden questions.** Accepted, using the review's second option: a question list that opens each answer in place, with "All Questions" and "Next Question".
   - The first option (a 3×2 grid plus a Next button) was prototyped. With the banner correctly subtracted (see point 4), it came out **15 px over** at 360×740: a 542 px face needed against 527 px available.
   - Its tabs still hid the question text.
   - The drill list shows every question as a 48 px row, 270 px wide. Its open state is 450 px against about 490 available.
3. **HIGH: desktop body under 16 px.** Accepted. `--clause-fs` at 760 and wider is `clamp(1rem, 0.875rem + 0.15*var(--u), 1.0625rem)`. It measured 16.0–16.4 px everywhere, and the pager absorbed the extra height.
4. **HIGH: compliance text shrunk.** Accepted.
   - The banner is 12 px everywhere.
   - The Contents notice is 14 px on desktop and 15 px on phones.
   - The footer notice is 14 px.
   - `.qa.is-tight` is deleted.
   - Correction to the review's spare-height figures: they came from a prototype where the banner never reached `--scene-top`. The engine's `:root` token cannot see a body-level `--banner-h` (now fixed in §3.2 and S1), so its boxes were 36–49 px too tall. With the banner subtracted, the 360×740 Contents is 614 / 634, not 562 / 684. To keep 15 px for the notice, the decorative Contents eyebrow steps out on short phone boxes. No compliance copy is touched.
5. **MEDIUM: tokens conflict with engine.md.** Accepted. `--fit` and every shared token definition are gone, and the page tokens are rebuilt on `--u`. §1 now uses the engine's header, `--bottom-h`, pads and budget.
6. **MEDIUM: tabs parking.** Accepted. Confirmed in film.js: `parkControls` returns early when `el.tabIndex < 0`, and `handleHash` emits `deeplink` right after `goTo`, before `updateReach` unparks. §5.2 decides parking by scene (S4), and story.md SHARED-D's helper has the same bug.
7. **MEDIUM: weak selected-tab state.** Accepted. The selected tab gets a solid 2 px `--accent` inset rule, `--fg` text and an accent underline on the question. The `--surface` background is dropped. The accent is #7A5C12 on bone (the Q&A field) and #0B0B0C on gold. Phones use the drill list, which has no selected state to show.
8. **MEDIUM: splitting over a few pixels.** Accepted and generalised. Snug is tried whenever paging is needed and is kept only if it saves a page. The review's `total ≤ full × 1.1` threshold was not enough: with the banner subtracted, 1280×720 terms is 634 against 563 (×1.13).
   - Snug is 60% clause padding (minimum 8 px) and line-height 1.5, with type unchanged.
   - Terms at 1280×720, 1366×768 and 1024×768 are now 1 page.
   - Privacy pages that remain are balanced 4+4.
9. **LOW: no `.scene__pan` in flow mode.** Accepted, using the review's second option: `.scene__pan` is written in the HTML of every scene (S2), so the rules apply in both modes. Confirmed that `prepareScene` reuses an existing pan.
10. **LOW: no-JS Q&A in two columns.** Accepted: `html:not(.js) .qa { grid-template-columns: 1fr; }`.
11. **LOW: SFX hooks.** Accepted. The tone plays only for the `'pointer'` and `'key'` (Enter/Space) causes, so arrow selection is silent. The pager's `page` → `tick` fallback is explicit through `sfx.has` (S9). Confirmed that `sfx.play` returns silently for an unknown voice.

**Found during revision, not in the review:**
- **The banner never reached the engine's `--scene-top`.** This is §3.2 / S1.
- **engine.md C4 deletes `.legal-rule`.** The old spec still drew it, and it is now removed throughout.
- **services.md SHARED-7 already names `ui-pager.js` and `ui-tabs.js`.** The old `pager.js` and `tabs.js` are folded into those modules (S5), so the site does not ship two pager or tab implementations.

## Critique responses (review 2)

All thirteen points were checked against the files (base.css, cursor.js, engine.md A6/A7/B2) and the reviewer's probes in `…\scratchpad\rv-legal3\`. All are accepted; none was wrong.

1. **HIGH: Contents eyebrow vanished at 1280×720.** Confirmed: the desktop box there is 628 px, under the 660 px container threshold. The `@container` rule is deleted; only `@media (max-width: 759px) and (max-height: 760px)` remains (§2, §4 scene 0, §7). S13 records the general lesson.
2. **HIGH: pinch-zoom lost over the text.** Confirmed: `pan-y` ∩ A7's `pan-x pinch-zoom` is `none`. `.pager__window` is now `touch-action: pan-y pinch-zoom` (§4 CSS, S7, §10 check).
3. **MEDIUM: S6 clip check flagged correct markup.** Confirmed `.visually-hidden` (base.css §17, `overflow: hidden`, 1×1), `.is-off-page` and `.rv-mask` (base.css §4) would all match. S6 now skips boxes of 2 px or less, `clip`/`clip-path` elements, `.is-off-page`, `.rv-mask`, `data-fit-ignore` and pager windows.
4. **MEDIUM: turn animation cancelled itself.** Confirmed: `show(next)` resizes items, the ResizeObserver runs `paginate()`, which killed the track tweens. `paginate()` no longer kills or clears tweens, and a `turning` flag defers every trigger until the timeline completes, then runs one pass (§5.1). Both of the reviewer's options are used.
5. **MEDIUM: 768×1024 Privacy needed 2 pages.** Confirmed (130 px head with the aside; 707 snug against 687). `#privacy .legal-aside` is hidden at tablet-portrait, giving 707 / 707 on one snug page. §0.2 footnote ¹, §4 tablet note and §7 item 4 are updated.
6. **MEDIUM: no fallback for longer counsel wording.** Accepted. Each Q&A answer's paragraphs are `[data-page-item]`s in a paged reader that is active in drill mode (`data-pager-when`, §4 scene 5, §5.1, §5.2 `open()` refreshes it). The `--fixture=ph3` placeholder fixture (S6) is now part of the acceptance test, and §4 scene 0 gives the Contents fallback step if its 20 px of slack is not enough. Tab mode stays unpaged, with a stated switch if the fixture fails there.
7. **MEDIUM: announcements could be lost.** Confirmed: the live region sat inside the bar that each pass hides. It is now a direct child of the `[data-pager]` root and never hidden (§4 markup, §5.1 `show`).
8. **MEDIUM: PageUp/PageDown stuck on a Q&A tab.** Confirmed in engine.md A6 (the role list owns every key). New SHARED S12: tab and tablist own only arrows and Home/End.
9. **LOW: phone column too narrow.** Accepted as verified: `--face-pad: 12px` and 1.625rem clause numbers on phones. Columns are 240 px at 360 and 270 px at 390; disclosure at 360 goes 3 → 2 pages and conduct at 390 goes 2 → 1 (§0.2 footnote ², §4 phone CSS).
10. **LOW: phone Q&A face changed height.** Accepted as tested: `#faq .legal-grid` becomes a flex column with `gap: var(--space-s)` and the panel is `flex: 1 1 0; min-height: 0`. The face is 477 px (360×740) and 564 px (390×844) in both states (§4 scene 5 CSS, §0.2 footnote ³).
11. **LOW: "Swipe" cursor label never rendered.** Confirmed: cursor.js `initCursor` returns early unless `finePointer()`. The attribute is removed from the markup and §5.1.
12. **LOW: boxes too tall before legal.js runs.** Accepted: `:root:has(body[data-page="legal"]) { --banner-h: 36px }`, 49 px under 760 (§3.2). The JS inline value still wins.
13. **LOW: short-landscape description wrong.** Confirmed against engine.md B2 (`container-type: normal`, `position: relative`, content-sized inner box). §2 and §5.1 now say the reader measures one page and the scene pans.
