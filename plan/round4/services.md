# Round 4 · services.html: one screen per scene

> **Merge amendments (2026-10-17, `shared.md` wins over this file where they differ)**
> - **SHARED-1 → `shared.md` §3.**
>   - Change every `var(--fu)` to `var(--u)` (one unit, D1).
>   - The phone `svh` type and spacing block stays only as a **scoped** override in services.css (`body[data-page="services"]` inside `@media (max-width: 759px)`), and only for `--fs-*`, `--space-*` and `--gap-row`.
>   - The extra-short band is `shared.md`'s phone-tiny band (header 52 px, pads 6/8). Do not redeclare it.
>   - `--ctl-h` is shared.
> - **SHARED-2 → `shared.md` §3/§4.**
>   - The token names are `--scene-pad-top` / `--scene-pad-bottom`, applied as `padding-block` on `.scene__pan` (not on `.scene__inner`).
>   - Where this file says `--scene-h` meaning the content budget, read **`--scene-safe-h`**. `--scene-h` is the box.
>   - Hold drift is deleted (D4).
> - **SHARED-3 → `shared.md` §4.2.** Write the `.scene--fill` rules without an `html.film` prefix. The flow-only fill rules are not needed, because the scene box is the same in both modes.
> - **SHARED-4 → `shared.md` §4.3** (engine B2 `height: 100svh`, plus `scrollbar-gutter`).
> - **SHARED-5 / §11 credits → `shared.md` §5.4.**
>   - Add `.scene__pan` and the `globe-anchor--credits` anchor, and drop `data-pose-sm`.
>   - services.js registers `createPoseFitter({ onlyAnchored: true })` from `globe-fit.js`.
> - **SHARED-6/9/10 → in base.css** (stage 2b).
> - **SHARED-7 components:**
>   - **Tabs** (finder): `createTabs(finderRoot, { modes: [{ when: '(max-width: 759px)', tabs: ['search','map','results'] }, { when: '(max-width: 1279px)', tabs: ['map','results'] }], panelStop: false, film, onChange, onModeChange })`. Panels sit in a `.scene--fill` region, so there is no `fixedHeight`. `root.dataset.tab` is written by the module.
>   - **Pager**: `createPager(list, { mode: 'fit'|'static', maxPerPage, render, noun: 'results'|'partners'|'offer items', status: 'range', focusOnTurn: 'item', film, onRender })`, with the `shared.md` §6.2 markup (`nav.pager[data-pager-bar]`, `[data-pager-live]`).
>   - **Stepper** (inquiry, §9): use `ui-stepper.js` `createStepper` (`shared.md` §6.3).
>     - Rename `.stepper__progress` to **`.stepper__status`**, and `--progress` to **`--step-progress`**.
>     - `#inq-progress` keeps its visible text ("Step 1 of 4 · What You Need") through `countText`, but **loses `aria-live` and gets `aria-hidden="true"`**.
>     - Each `h3.stepper__title` gets `<span class="visually-hidden" data-step-of></span>` for ", step n of 4".
>     - The base stepper CSS of §9.4 that duplicates `ui.css` is deleted from services.css. Keep only sizing and skin.
>   - **Dialog**: `ui-dialog.js` (`shared.md` §6.4). The `.dialog*` base CSS moves to ui.css. The `.profile*` rules stay in services.css.
> - **SHARED-8 → `shared.md` §7** (key ownership table, `refreshReach`, `isParked`, the dialog stops the film).
> - **SHARED-11 → `shared.md` §5.3.**
>   - The base-class floor lives at the end of ui.css.
>   - services.css §14 stays **last** and keeps its page classes, but sets `font-size: var(--fs-note)` (the UI labels `var(--fs-ui-min)`) instead of literal sizes.
> - **SHARED-12 → `shared.md` §8**, run with `--fixture=partners-max --states=tools/fit-states/services.mjs`, and also with `--flow`.
>   - `tools/check-config.mjs` and the `build.mjs` hook are built by stage 2c.
>   - This page may edit `config.js` only for the PARTNERS limits comment.
> - **Risk:** the measured spare was 24 px (inquiry, 360×740) and 16 px (768×1024) on the old tokens. Re-measure first, and tighten with scoped tokens if needed.

Status: design spec, **revision 3** (after the second adversarial critique), ready to build after Round 3 lands. Brief and acceptance test: `PLAN.md` § "Round 4: one screen per section". Every rule an implementer needs is in this file; the critique itself does not have to be read (its points and the answers are listed at the end).

How the numbers were measured (2026-10-17):
- **before**: `tools/fit-audit.mjs` at the 9 PLAN viewports, plus a CDP probe and screenshots (scratchpad `r4svc/`);
- **after (this revision)**: scratchpad `r4svc-rev3/` (`probe.mjs` + `page.js`, aggregated by `agg.mjs` into `final-table.txt`). The probe injects the SHARED tokens and this spec's markup and CSS into the live page and measures every scene and state at **11 viewports** (the 9 PLAN sizes plus 375×667 and 360×640). It applies the text floor (SHARED-11) **as plain CSS placed after the page CSS, with no `!important`**, so the cascade it measures is the cascade this spec writes. It lists any non-label text under 15 px (phones) or 16 px (≥ 760 px), flags any box that clips its own content (the SHARED-12 rule), and measures the entry swing of the two fill-scene panels.
- **Limits of the probe:** it lays each scene out in a fixed box shaped like `.scene__inner` (flow-like, reveals at rest). It does not run film mode (3D tilt and depth, hold drift, the real `.scene__pan`). The numbers below are therefore the **design budget**, not the acceptance result. Acceptance is the extended `fit-audit.mjs` in film mode **and** `--flow` (SHARED-12, §13), which is a build prerequisite.

Scene order after this round (9 film scenes + 1 shared credits scene, was 8):

| # | id | field | dur | change |
|---|----|-------|-----|--------|
| 1 | `intro` | ink | 5 | fluid scale, phone rail re-layout |
| 2 | `ours-insurance` | bone | 5 | fluid scale, phone re-layout, ruled panel on short phones |
| 3 | `ours-strategy` | ink | 5 | **split**: "The Offer" |
| 4 | `ours-strategy-plan` **new** | ink | 5 | **split**: "What You Get" (offer stack + promise); paged list on short phones |
| 5 | `ours-outsourcing` | gold | 5 | re-layout: 2 columns, phone 2×2 roles |
| 6 | `finder` | ink | 7 | re-layout + **responsive tabs** + **fit-paged results** + type select on compact bands + combobox without inner scroll + profile **dialog** + "What happens next" strip as its own grid item |
| 7 | `categories` | bone | 6 | re-layout + **in-scene sheet** (phone) + card **tabs** (phone, tablet portrait, every desktop ≤ 880 px tall) + **fit-paged partners** |
| 8 | `inquiry` | gold | 6 | **4-step stepper** |
| 9 | `close` | ink | 4 | CTA only; footer leaves |
| 10 | `credits` **new, SHARED** | ink | 4 | compact one-screen footer (see SHARED-5) |

---

## 0. Measurements

### 0.1 Before (today)

`box` = what the content may use today = `100svh − --header-h (76 / 64 on phones) − --bottom-h (72 / 76)`. Overflow is `content − box`, in px. 1920×1080 fits everywhere today.

| scene | 1536×864 | 1440×900 | 1366×768 | 1280×720 | 1024×768 | 768×1024 | 390×844 | 360×740 |
|---|---|---|---|---|---|---|---|---|
| intro | 0 | 0 | 0 | 0 | +1 | 0 | 0 | +57 |
| ours-insurance | 0 | 0 | 0 | +16 | +40 | 0 | 0 | +187 |
| ours-strategy | 0 | 0 | +71 | +134 | +525 | +270 | +842 | +967 |
| ours-outsourcing | 0 | 0 | 0 | +32 | 0 | 0 | +161 | +265 |
| finder (empty state) | 0 | 0 | +50 | +73 | +238 | 0 | +590 | +687 |
| categories | +186 | +149 | +337 | +401 | +764 | +357 | +841 | +1016 |
| inquiry | +62 | +26 | +158 | +229 | +508 | +238 | +759 | +928 |
| close | +221 | +176 | +284 | +313 | +224 | +25 | +477 | +572 |

X overflow found:
- `inquiry` +1962 to +2126 px at every desktop size: the honeypot `.hp` (`left:-10000px`) inside the tilting 3D panel; its projected rect lands far right. It is `aria-hidden`, so the hardened audit ignores it, but see SHARED-6.
- `close` +7 to +342 px: `.nowrap-md` spans in the close title are wider than `.close { max-width: 46rem }` (and, mid-reveal, wider than phones).

What drives the worst cases:
- **finder**: the three columns are already about 670 px tall when empty. Picking a category and a place adds up to 5 result rows (~150 px each, more with an open `<details>` profile).
- **categories**: the detail card alone is 925–1054 px tall, next to a 430 px rail.
- **inquiry**: a 7-field form plus consent, notice and submit is 890 px tall in a 7-column panel, and 1020 px on phones.
- **strategy on phone**: two full columns stack (pitch 775 px + offer stack 715 px).
- **close**: CTA (≈480) + the 4-column footer (324 desktop / 637 phone).

### 0.2 Space available after this round
Assumes the queued removals (HUD, floating button, phone bar, toggles) and SHARED-1/2. `H` = content box height (measured).

| viewport | H | note |
|---|---|---|
| 1920×1080 | 961 | |
| 1536×864 | 764 | |
| 1440×900 | 797 | |
| 1366×768 | 679 | |
| 1280×720 | 635 | |
| 1024×768 | 679 | |
| 768×1024 | 907 | |
| 390×844 | 751 | minus safe-area |
| 360×740 | 658 | |
| 375×667 | 603 | extra-short band: header 48, pads 6 / 10 |
| 360×640 | 576 | extra-short band (≈ a 360×740 Android with browser chrome) |

**Design rule:** every scene and every state leaves **at least 16 px spare** at all 11 viewports. For fixed-height (`.scene--fill`) scenes "spare" is the free space inside the flexible region (results list, card columns, stepper step), because the scene box itself is always exactly `H`. A fill scene therefore always reports "need = H" (±1 px of `svh` rounding) in the probe; that is by design, not an overflow.

### 0.3 After (measured spare, px, with every fix in this spec)

Lowest value over all states of the scene: all categories × all tabs, all finder states, steps 1–4 with and without the real error messages, the maxed partner fixture of §7.7, the 16 px desktop floor and the 15 px phone floor.

| scene | 1920×1080 | 1536×864 | 1440×900 | 1366×768 | 1280×720 | 1024×768 | 768×1024 | 390×844 | 360×740 | 375×667 | 360×640 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| intro | 207 | 138 | 165 | 114 | 102 | 105 | 217 | 110 | 70 | 97 | 47 |
| ours-insurance | 192 | 106 | 128 | 84 | 68 | 48 | 154 | 62 | 52 | 35 | 21 |
| ours-strategy (5a) | 275 | 187 | 207 | 138 | 119 | 148 | 107 | 36 | 20 | 43 | 16 |
| ours-strategy-plan (5b) | 230 | 153 | 170 | 121 | 104 | 128 | 130 | 84 | 39 (pages of 3) | 85 (pages of 2) | 61 (pages of 2) |
| ours-outsourcing | 289 | 200 | 221 | 165 | 148 | 179 | 209 | 64 | 32 | 38 | 25 |
| finder (worst panel or page) | 60 | 68 | 79 | 43 | 76 | 70 | 24 | 33 | 36 | 49 | 22 |
| categories (worst card, tab or page) | 146 | 126 | 163 | 88 | 49 | 95 | 229 | 145 | 18 | 53 | 27 |
| inquiry (worst step) | 299 | 106 | 149 | 63 | 30 | 100 | 16 | 57 | 24 | 31 | 18 |
| close | 262 | 187 | 210 | 156 | 140 | 180 | 310 | 179 | 147 | 134 | 121 |
| profile dialog (maxed fixture) | 396 | 224 | 266 | 166 | 125 | 188 | 454 | 236 | 100 | 85 | 36 |

Dialog row: viewport height left beside the dialog panel (desktop), or free space under the last line inside the full-screen dialog (phones).

Finder map size (px, `width×height`): 503×432 · 442×379 · 504×433 · 373×320 · 327×280 · 529×454 (Map tab) · 446×383 (Map tab) · 358×307 · 331×284 · 317×272 · 285×245, in the column order above. (Tablet portrait was 408×350 in revision 2.)

Text: at ≥ 760 px no reading text renders under 16 px; at < 760 px nothing renders under 15 px. The only smaller text left is the label set exempted in SHARED-11. Clipped boxes (SHARED-12 rule): none.

---

## 1. Bands and media queries used in this file

The base CSS is the **wide** band. The other bands override it.

```css
/* wide: ≥1280 wide and >800 tall (1440×900, 1536×864, 1920×1080): the base rules */
/* desktop ≤ 880 tall (1536×864, 1366×768, 1280×720, 1024×768): category card tabs, finder type select, compact finder columns */
@media (min-width: 760px) and (max-height: 880px) { … }
/* laptop-short: ≥760 wide, ≤800 tall (1024×768, 1280×720, 1366×768) */
@media (min-width: 760px) and (max-height: 800px) { … }
/* narrow desktop, landscape (1024×768): keeps the desktop columns, tighter */
@media (min-width: 760px) and (max-width: 1279px) and (min-aspect-ratio: 1/1) { … }
/* tablet portrait (768×1024) */
@media (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) { … }
/* phone (≤430 is the design target; the existing breakpoint is 759) */
@media (max-width: 759px) { … }
/* short phone (360×740 and shorter) */
@media (max-width: 759px) and (max-height: 760px) { … }
/* extra-short phone (375×667, 360×640: the browser viewport of most 360×740 Androids) */
@media (max-width: 759px) and (max-height: 700px) { … }
```
Phones under 560 px tall (landscape) keep the documented pan fallback (PLAN.md).

Column helpers:
- Every column that today carries `md-span-12` and must stay side by side at 1024×768 also gets `keep-md`, the existing base.css helper for landscape md. Tablet portrait still stacks, as `md-span-12` already does.
- **There are no `md-span-4` / `md-span-8` helpers** in base.css (only `md-span-12` and `md-span-6`), and this spec does not add them. Where a split must hold in tablet portrait (categories, §8), the page sets the grid columns in services.css.

---

## 2. SHARED proposals (collect these into base.css / engine / tools)

Each item below is a proposal for a shared file. The page-specific CSS in §3–§11 assumes they exist. Items marked **(prerequisite)** must land before any page work starts.

**SHARED-1 · Fluid fit unit, type/spacing scale and the extra-short band.** One unit that tracks the limiting dimension: on landscape screens it follows height (16:9 equivalence), on portrait it follows width.
```css
:root {
  --fu: min(1vw, 1.778svh);              /* 19.2px @1920×1080 · 13.65 @1366×768 · 12.8 @1280×720 · 10.24 @1024×768 · 7.68 @768×1024 */
  --fs-hero: clamp(2.5rem,   calc(0.75rem + 5   * var(--fu)), 7.75rem);
  --fs-d1:   clamp(2.125rem, calc(0.75rem + 3.6 * var(--fu)), 5.25rem);
  --fs-d2:   clamp(1.75rem,  calc(0.6rem  + 2.5 * var(--fu)), 3.75rem);
  --fs-d3:   clamp(1.375rem, calc(0.75rem + 1.1 * var(--fu)), 2.125rem);
  --fs-d4:   clamp(1.25rem,  calc(0.85rem + 0.55* var(--fu)), 1.75rem);
  --fs-lead: clamp(1rem,     calc(0.8rem  + 0.3 * var(--fu)), 1.25rem);
  --space-m:  clamp(12px, calc(1.3 * var(--fu)), 20px);
  --space-l:  clamp(16px, calc(2   * var(--fu)), 32px);
  --space-xl: clamp(20px, calc(3   * var(--fu)), 72px);
  --gap-row:  clamp(12px, calc(1.8 * var(--fu)), 40px);
  --ctl-h:    clamp(44px, 6svh, 48px);     /* inputs, selects, buttons: never under 44 */
}
@media (max-width: 759px) {               /* phones: height-aware, because --fu is width-bound there */
  :root {
    --fs-hero: clamp(2.25rem,  5.4svh, 3rem);
    --fs-d1:   clamp(1.875rem, 4.6svh, 2.5rem);
    --fs-d2:   clamp(1.625rem, 3.7svh, 2.125rem);
    --fs-d3:   clamp(1.25rem,  2.9svh, 1.625rem);
    --fs-d4:   clamp(1.125rem, 2.5svh, 1.375rem);
    --fs-lead: clamp(0.9375rem, 2svh, 1.0625rem);
    --space-m: clamp(10px, 1.6svh, 16px);
    --space-l: clamp(12px, 2.2svh, 24px);
    --space-xl: clamp(16px, 3svh, 32px);
    --gap-row: clamp(12px, 2svh, 24px);
  }
}
/* extra-short phones: every page gets the same tighter frame and display ramp */
@media (max-width: 759px) and (max-height: 700px) {
  :root {
    --header-h: 48px;                      /* the 44 px menu button still fits */
    --scene-pad-t: 6px;
    --scene-pad-b: calc(10px + env(safe-area-inset-bottom, 0px));
    --fs-d1: 1.625rem; --fs-d2: 1.5rem; --fs-d3: 1.25rem; --fs-d4: 1.0625rem; --fs-lead: 0.9375rem;
  }
  body { line-height: 1.5; }               /* 1.6 elsewhere; body text stays 15–16 px */
}
```
services.css drops its own `.t-d4` and `.cat-card .t-d3` clamps (§10 of services.css) in favour of these tokens.

**SHARED-2 · Header offset and scene padding.** `--bottom-h` goes once the HUD, floating button and phone bar are removed.
```css
:root {
  --header-h: clamp(56px, 7.5svh, 76px);
  --scene-pad-t: clamp(8px, 1.5svh, 24px);
  --scene-pad-b: calc(clamp(12px, 2.5svh, 32px) + env(safe-area-inset-bottom, 0px));
  --scene-h: calc(100svh - var(--header-h) - var(--banner-h, 0px) - var(--scene-pad-t) - var(--scene-pad-b));
}
@media (max-width: 759px) { :root { --header-h: clamp(52px, 7svh, 64px); } }
/* (the extra-short override of SHARED-1 comes after this block) */
html.film .scene__inner { top: calc(var(--header-h) + var(--banner-h, 0px)); bottom: 0;
  padding: var(--scene-pad-t) var(--page-pad) var(--scene-pad-b); }
html.film .scene__pan { padding-block: 0; }
```
The 22 px "hold drift" of `.scene__inner` (ENGINE.md, scroll cost) must stay inside `--scene-pad-t` plus the 8 px `overflow-clip-margin` of `.scene__inner`: cap it at `min(22px, var(--scene-pad-t) + 8px)` (14 px on extra-short phones), or drop it once snap lands. Otherwise fitted content clips at the top.

**SHARED-3 · `.scene--fill`, in film mode and in flow mode.** For scenes whose layout fills the box (finder, categories, inquiry): the pan takes the full content height, so inner regions can use `minmax(0, 1fr)` rows (or `flex: 1`) and size the map, list pages and panels from the remaining height.
```css
html.film .scene--fill .scene__pan { height: 100%; display: flex; flex-direction: column; margin: 0 auto; }
html.film .scene--fill .scene__pan > * { flex: 1 1 auto; min-height: 0; }

/* flow mode (reduced motion): the same chain, or .finder/.cats/.stepper collapse to their content */
html:not(.film) .scene--fill .scene__inner { height: var(--scene-h); display: flex; flex-direction: column; }
html:not(.film) .scene--fill .scene__pan { height: 100%; display: flex; flex-direction: column; }
html:not(.film) .scene--fill .scene__pan > * { flex: 1 1 auto; min-height: 0; }
```
Without the two flow-mode rules, `.scene__pan` is auto height and not flex in flow mode, so `.finder`, `.cats` and `.stepper` shrink to their content: the map loses its height, the fit pager has no box to measure and the phone sheet has nothing to cover. fit-audit reads `max(scrollHeight, offsetHeight)` of the pan, so content that spills out of a fill scene is still reported; content that overlaps or clips inside one is caught by SHARED-12.

**SHARED-4 · Flow mode (reduced motion) is one screen per section.** The rule must beat base.css:918 (`html:not(.film) .scene:first-child`, which adds the header and `--space-xl` to the first scene), and the top padding must include the banner, because `--scene-h` subtracts it.
```css
html:not(.film) { scroll-snap-type: y mandatory; scrollbar-gutter: stable; }
html:not(.film) .scene,
html:not(.film) .scene:first-child {
  min-height: 100svh;
  padding-block: calc(var(--header-h) + var(--banner-h, 0px) + var(--scene-pad-t)) var(--scene-pad-b);
  scroll-snap-align: start; scroll-margin-top: 0;
}
```
This replaces both `padding-block: var(--space-2xl)` (base.css:913) and the `:first-child` padding-top (base.css:918). Each section's content box is then exactly `--scene-h`, the same as in film mode.

**SHARED-5 · Close and credits split.** Today the close scene overflows on every page: the CTA plus the 4-column footer. Proposal:
- `close` keeps only eyebrow, title, lead, buttons and hint. Drop the `.nowrap-md` spans. Use `.close__title { max-width: 14ch; text-wrap: balance; }` instead.
- New last scene, the same on every page (the film's end credits):
  ```html
  <section class="scene scene--credits" id="credits" data-field="ink" data-dur="4"
           data-pose="0,0.35,-1,0.25,2.4,0.7" data-pose-sm="0,1.2,-1,0.25,2.4,0.6" data-title="Contact and Legal" aria-label="Contact and legal">
    <div class="scene__inner"><div data-footer></div></div>
  </section>
  ```
  The same field as `close` (ink), so it crossfades with no iris. The pose sits the globe low and small behind the brand.
- The footer becomes a compact one-screen grid. Wide: brand (span 4, monogram 56 px, name, tagline) | Contact | Company | Legal, with the notice and © on one bottom row (notice span 9, © span 3, right-aligned). Phone: brand row (monogram 32 + name + tagline on one line); the three link groups as a 2-column grid of 44 px rows (Contact spans 2); then the notice (15 px, SHARED-11), then ©. Phone budget at 360×740: 44 + 16 + 5×44 + 16 + notice 5×22 + 8 + 18 ≈ 432 of 658; at 360×640 ≈ 432 of 576.
- The footer notice is verbatim (see §12).
- `close` on services: `data-dur` 5 → 4.

**SHARED-6 · Honeypot without an off-screen offset.** The off-screen offset is what produces the inquiry X overflow (projected through the 3D panel).
```css
.hp { position: absolute !important; left: 0; top: 0; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
```

**SHARED-7 · Shared UI components** (one module each, in `assets/js/`, reused by partners.html for its application stepper and tier carousel):
- `ui-tabs.js` → `createTabs(root, { activeWhen: mediaQuery, panels, onChange })`: responsive tabs. In "tabs" mode they follow the WAI-ARIA APG tabs pattern. Otherwise every panel shows and the tab roles are removed. Tabs that are not part of the current mode (e.g. the finder's Search tab outside phone mode) get `hidden`, and their panel loses `role="tabpanel"` and `aria-labelledby` while that mode lasts.
  - **`data-tab` on the root.** In tab mode the module writes the selected tab's key (`search`, `map`, `results`, `about`, `ours`, `partners`) to `root.dataset.tab`; in no-tab mode it removes the attribute. Page CSS uses it to show things that sit outside the panels (the finder's "What happens next" strip, §7.3).
  - **Roving tabindex and film parking.** film.js parks controls of inactive scenes by saving their `tabindex` in `data-film-tab` and setting `-1`. ui-tabs must never write a stale value behind film's back: it writes the roving stop through one helper, `setTabStop(tab, isStop)`. If the tab carries `data-film-tab` (parked), the helper writes `'0'` or `'-1'` into `data-film-tab` and leaves `tabindex` at -1. Otherwise it sets `tabindex`. `unparkControls` then restores the correct roving value. (SHARED-8 documents the attribute name as part of the engine API.)
- `ui-pager.js` → `createPager(list, { mode, maxPerPage: () => n, label, render? })`: a paged list with Previous/Next, a status line, and focus on the first new item.
  - **`mode: 'static'`** (5b): the pager toggles `hidden` on the list's existing children; the page size is exactly `maxPerPage()`.
  - **`mode: 'fit'`** (finder results, category partners): `render(items)` writes one page of HTML. After each render the pager checks the list box (`list.scrollHeight > list.clientHeight + 1`, the list being the `flex: 1; min-height: 0` region) and, while it overflows and the page holds more than one item, removes the last item and re-renders. So a page holds **as many items as really fit, up to `maxPerPage()`**, whatever the text length. The pager keeps a stack of page start indexes so Previous returns to the same page. On resize or tab-mode change it re-paginates from the first item of the current page. A single item always fits: the field caps of §7.7 guarantee it (measured, §0.3).
  - The pager is hidden when everything fits on one page. The end buttons get `aria-disabled="true"` and stay focusable.
  - **Labels never change at runtime.** The buttons read "Previous" and "Next" with a visually hidden noun ("results", "partners", "offer items"); the count lives only in `.pager__status` ("1–2 of 5"). textfx's letter roll wraps a `.btn` label once (`prepareRoll`, `data-rolled`), so a label that changed after the first hover would leave stale visible and spoken text. As a guard, pager buttons also carry `data-roll="none"`.
  - `.pager__status` is a plain `<p>` (no `aria-live`). The pager announces only when the visitor pages: it writes "Showing partners 3 to 4 of 5" into a visually hidden `aria-live="polite"` span that it owns (inside the pager, which is visible whenever paging is possible). A reset (new search, new category) updates the visible status silently.
- `ui-stepper.js` → `createStepper(form, { steps, validate, onStep })`: steps with per-step validation and focus on the step heading. `onStep(n)` lets the page mirror the step (see §9.5).
- `ui-dialog.js` → `openDialog(dialogEl, { trigger, onOpen, onClose })` and `closeDialog(dialogEl, { returnFocus = true })`: native `<dialog>` with `showModal()`. It closes on Escape and on the backdrop. By default it returns focus to the trigger; `returnFocus: false` leaves focus to the caller (§7.7, "Send an Inquiry"). On open it calls `film?.stop()` and on close `film?.start()` (SHARED-8), **before** any `onClose` callback runs, so a callback may call `film.goTo()`.

Markup and CSS class names: `.tabs`, `.tabs__list`, `.tabs__tab`, `.tabs__panel`; `.pager`, `.pager__status`, `.pager__btn`; `.stepper`, `.stepper__progress`, `.stepper__bar`, `.stepper__step`, `.stepper__nav`; `.dialog`; `.link-btn`. (The phone category sheet is page-specific: `.cat-sheet`, §8.)
```css
.pager { display: flex; align-items: center; justify-content: space-between; gap: var(--space-s); }
.pager .pager__btn { min-height: 44px; }      /* (0,2,0): beats .btn--sm (base.css:716) in any file order */
.pager__status { font: 500 0.875rem/1.3 var(--font-ui); color: var(--fg-muted); }
.tabs__list { display: flex; gap: 4px; border-bottom: 1px solid var(--line); }
.tabs__tab { min-height: 44px; padding: 0 var(--space-m); background: none; border: 0; color: var(--fg-muted);
  font: 500 0.9375rem/1 var(--font-ui); letter-spacing: 0.04em; box-shadow: inset 0 -2px 0 transparent; }
.tabs__tab[aria-selected="true"] { color: var(--fg); box-shadow: inset 0 -2px 0 var(--accent); }
.tabs__count:not(:empty)::before { content: "· "; }
.tabs__panel[hidden] { display: none !important; }
/* a text button inside a sentence */
.link-btn { display: inline; min-height: 24px; padding: 0; border: 0; background: none; color: var(--accent);
  font: inherit; font-weight: 600; text-decoration: underline; }
@media (max-width: 759px), (pointer: coarse) { .link-btn { display: inline-flex; align-items: center; min-height: 44px; } }
```

**SHARED-8 · Engine hooks needed by these components** (for `plan/round4/engine.md`):
- `film.refreshReach()` (re-run `updateReach()`): call it after a component injects or reveals controls in a scene, so new controls in a parked scene are parked too.
- The parking attribute `data-film-tab` is part of the engine API (SHARED-7, roving tabindex).
- **A modal stops the page.** While a `dialog[open]` exists: snap is suspended, and `ui-dialog.js` has called `film.stop()` (film.js:690, `lenis.stop()`), so wheel and touch input over the dialog or its backdrop no longer moves the film. `film.start()` runs on close. In flow mode the document itself must not scroll behind the modal:
  ```css
  html:not(.film):has(dialog[open]) { overflow: hidden; }   /* scrollbar-gutter: stable (SHARED-4) prevents a layout jump */
  ```
- **Keys and focused controls.** Snap must not steal a key that the focused element uses:
  - Arrow keys, Home and End are ignored by snap while focus is inside `[role="tablist"]`, `.pager`, `.stepper__nav`, or any `input`, `select`, `textarea` or `[contenteditable]`.
  - **Space and Enter are ignored by snap whenever `document.activeElement` is a `button`, `a[href]`, `summary`, `[role="tab"]`, `[role="button"]` or any `input`, `select` or `textarea`.** Space activates a focused button or link (tabs, pager, Next/Back, Edit, rail buttons, dialog triggers, "Introduce Me"), so it must do that and nothing else. Space (and Shift+Space) moves scenes only when focus is on `body`, a scene, or non-interactive content.
  - PageUp/PageDown still move scenes from any focused control except text fields (`input` other than checkbox/radio, `textarea`, `[contenteditable]`) and `select`.
- An open phone sheet (`.cat-sheet.is-open`) does not block snap. Moving to another scene leaves it open, and coming back shows it as left.

**SHARED-9 · Control density on short screens.**
```css
.input, .select, .btn { min-height: var(--ctl-h); }
.textarea { resize: none; }   /* a user-resized textarea could push a fitted scene over */
@media (hover: hover) and (pointer: fine) { .chips--compact .chip { min-height: 36px; } }   /* coarse pointers keep 44 */
```

**SHARED-10 · `.keep-md`** (already in base.css) is the standard way to keep desktop columns at 1024×768. Pages add it to every split that must not stack in landscape.

**SHARED-11 · Text floor: 15 px on phones, 16 px from 760 px.** (The same floor as story.md SHARED-F, partners.md and legal.md.)
- **Reading text** (body sentences, list items, notices, hints, errors, consent, meta lines, facts, statuses): **≥ 15 px below 760 px, ≥ 16 px from 760 px.**
- **UI labels** (button labels, tab labels, pager buttons, rail and jump-rail labels, phone tag pills): **≥ 15 px everywhere.**
- **Exempt** (labels, not sentences; unchanged, all ≥ 11 px): uppercase tracked labels (`.eyebrow`, `.offer-meta`, `dt`, `.next-steps__when`, `.stepper__label`, `.label`/`legend.label`, `.cat-rail__group`, `.jump-rail__group`, `.cat-rail__tag`), numerals (`.jump-rail__n`, `.offer-stack__n`, `.offer-stack__value`, `.roles__n`, `.result__km`), desktop tag pills (`.tags > li`, 13 px from 760 px), `.pager__status`, `.map__chosen`, `.combo__kind`, `.ph` placeholders inside a label.

**Where the rule lives (the cascade matters).** services.css loads after base.css, and several services.css rules set small sizes with the same or higher specificity (`.offer-stack__fix` services.css:75, `.roles__what` :93 as a `font` shorthand, `.result__meta, .result__cred` :203, `.results__notice` :210, `.inq-form .notice` :295 at (0,2,0), `.profile__body` :327, `.profile__notice` :332). A floor in base.css alone loses to all of them. So:
1. **base.css** gets the floor for its own classes, as its last block:
   ```css
   @media (max-width: 759px) { .notice, .hint, .t-small, .check, .error, .ticks, .cred dd, .btn--sm, .tabs__tab, .tags > li { font-size: 0.9375rem; } .notice { line-height: 1.45; } }
   @media (min-width: 760px) { .notice, .hint, .t-small, .check, .error, .ticks, .cred dd { font-size: 1rem; } .btn--sm, .tabs__tab { font-size: 0.9375rem; } }
   ```
2. **services.css** ends with its own floor block, **§14 Text floor, which must stay the last block of the file.** It repeats the base classes (so no services.css rule above it can undercut them) and adds every page class. Each selector is at least as specific as the rule it overrides (`.inq-form .notice` is written out). No `!important`, no `@layer`:
   ```css
   /* 14. Text floor (SHARED-11). Keep this block LAST in services.css. */
   @media (max-width: 759px) {
     .notice, .hint, .t-small, .check, .error, .ticks, .cred dd,
     .results__status, .results__ours, .results__ask, .result__meta, .result__cred, .partner-card__meta,
     .roles__what, .offer-stack__fix, .next-strip__list > li, .next-steps__list > li, .cat-rail__item, .jump-rail__label,
     .profile__body, .profile__notice, .profile__desc, .profile__facts dd, .map__caption .t-xs,
     .results__notice, .inq-form .notice, .cat-card__brief, .btn--sm, .inq-summary__edit, .tabs__tab, .tags > li { font-size: 0.9375rem; }
     .notice { line-height: 1.45; }
   }
   @media (min-width: 760px) {
     .notice, .hint, .t-small, .check, .error, .ticks, .cred dd,
     .results__status, .results__ours, .results__ask, .results__ask-title, .result__meta, .result__cred, .partner-card__meta,
     .roles__what, .offer-stack__fix, .next-strip__list > li, .next-steps__list > li,
     .profile__body, .profile__notice, .profile__desc, .profile__facts dd, .map__caption .t-xs,
     .results__notice, .inq-form .notice, .cat-card__brief, .inq-summary { font-size: 1rem; }
     .btn--sm, .inq-summary__edit, .tabs__tab { font-size: 0.9375rem; }
   }
   ```
   No rule in §3–§11 below sets a font size on any of these classes (the revision-2 `.next-strip__list > li { font-size: 0.8125rem }` is gone).
3. The text scan of SHARED-12 enforces it.

The probe applied exactly these two blocks after the page CSS, without `!important`, and every budget in §0.3 includes them.

**SHARED-12 · fit-audit: state scripting, a "clipped" check, film and flow (prerequisite).** Today `tools/fit-audit.mjs` has only `--flow` and `--fallback`; it cannot open a tab, page a list or show an error, and the audit clips every box by its non-visible-overflow ancestors, so a too-small `overflow: hidden|clip` box hides its own overflow and still passes. Before any Round 4 page work, extend it:
1. **`--states=<module>`**: a module (e.g. `tools/fit-states/services.mjs`) exports `[{ scene, name, run }]`, where `run` is a function source evaluated in the page (`Runtime.evaluate`, `awaitPromise`) after load and after the scene is reached (`film.goTo(scene)` and wait for the hold, or `scrollIntoView` in flow mode). The audit measures the scene after each `run`. The services states are listed in §13.
2. **`--fixture=<file>`**: the audit intercepts `assets/js/config.js` (CDP `Fetch.requestPaused`) and serves it with `PARTNERS` replaced by the fixture file's array (`tools/fit-states/fixtures/partners-max.json`, §7.7). Nothing in `site/` changes and the fixture is never served to visitors (CR16).
3. **Clipped check** (always on): any element inside a `.scene__pan` or an open `dialog` whose computed `overflow-x` or `overflow-y` is `hidden` or `clip` and whose `scrollHeight > clientHeight + 1` (or `scrollWidth > clientWidth + 1`) is a failure of kind `clipped`. Skipped: `display: inline | inline-block` boxes (the `.rv-mask` line masks and textfx letter-roll wrappers), anything inside `.visually-hidden`, `.hp`, `aria-hidden` subtrees, and **any box of 1×1 px or less whose `clip-path` is `inset(50%)` or whose `clip` is `rect(0 0 0 0)`** (the generic visually-hidden pattern, written inline or by another class).
4. **Text scan** (always on): reading text under 15 px (< 760 px wide) or 16 px (≥ 760 px), minus the SHARED-11 exempt classes, is a failure of kind `small-text`.
5. **Both modes**: the services acceptance runs the audit twice, in film mode (default: real 3D tilt and depth, hold drift, `.scene__pan`) and with `--flow`.

This spec removes the two clips that would hide a wrong budget (`.results__list { overflow: clip }` and `.dialog { overflow: hidden }`), and it toggles the real `.visually-hidden` class (never inline clip CSS) wherever it hides a heading, so nothing on this page relies on clipping.

---

## 3. Scene 1 · `intro` (ink)

Overflow before: 1024×768 +1, 360×740 +57. **Move: fluid scale + re-layout of the rail on phones.** No scene split.

**Wide:** unchanged structure. `h1.t-hero` uses `--fs-hero`. The rail keeps 6 columns, with `margin-top: var(--space-xl)` (fluid).

**Laptop-short:** the same. At 1024×768 the rail has 3 columns × 2 rows (existing rule). Rail item padding becomes `var(--space-s)`.

**Phone:** the rail is a 2-column grid of compact rows. Each item becomes a 2-line block, `[01] Insurance` with the group label above it, at min-height 52 px (48 px on extra-short phones). The label is 15 px (SHARED-11).
```css
@media (max-width: 759px) {
  .jump-rail { margin-top: var(--space-l); }
  .jump-rail__item { grid-template-columns: auto 1fr; padding-block: 8px; min-height: 52px; row-gap: 0; }
  .jump-rail__n { grid-row: 1 / span 2; align-self: center; }
  .ticks { gap: 4px var(--space-s); }
}
@media (max-width: 759px) and (max-height: 700px) { .jump-rail__item { min-height: 48px; padding-block: 4px; } }
```
Measured spare: 102 at 1280×720, 70 at 360×740, 47 at 360×640.

Markup: none. JS: none. `data-reveal`, tilt and depth stay as they are.

---

## 4. Scene 2 · `ours-insurance` (bone)

Overflow before: 1280×720 +16, 1024×768 +40, 360×740 +187. **Move: fluid scale + re-layout** (the hint moves into the panel, phone buttons stack, and on extra-short phones the panel becomes a ruled section).

**Wide / laptop-short:** keep `span-7 start-6`, plus `keep-md` so 1024×768 does not change. The h2 uses `--fs-d2`. The panel padding is `var(--space-l)`, or `var(--space-m)` when `max-height: 800px`.

**Phone:** buttons stack and fill the width. The hint sits under the buttons inside the panel, which saves one stack gap. The column's outer stack uses `--space-s` (`--space-xs` on short phones).

**Extra-short phone:** the two buttons sit side by side (each `flex: 1`; a label may wrap to two lines inside its button), the panel loses its card chrome and becomes a section ruled top and bottom (full text width, `padding: var(--space-s) 0`), its inner stacks use `--space-xs`, and the review paragraph is 15 px.
```html
<!-- before: the hint sits in the trailing .stack.stack-s next to the notice -->
<div class="row" data-reveal="fade" data-depth="12"> …two buttons… </div>
</div>
<div class="stack stack-s" data-reveal="fade">
  <p class="hint">Opens WhatsApp with your message written. Nothing is sent until you tap send.</p>
  <p class="notice">This is our founder's own business. …</p>
</div>
<!-- after (the column div also gets class "ins-col" and keep-md) -->
<div class="stack stack-xs" data-reveal="fade" data-depth="12">
  <div class="row row--stack-sm"> …two buttons, unchanged… </div>
  <p class="hint">Opens WhatsApp with your message written. Nothing is sent until you tap send.</p>
</div>
</div>
<p class="notice" data-reveal="fade">This is our founder's own business. It is separate from the network of independent partners.</p>
```
```css
@media (max-width: 759px) {
  .row--stack-sm { flex-direction: column; align-items: stretch; gap: var(--space-xs); }   /* SHARED utility, base.css §5 */
  .svc-panel { padding: var(--space-m); gap: var(--space-s); }
  .ins-col { --stack: var(--space-s); }
}
@media (max-width: 759px) and (max-height: 760px) { .ins-col { --stack: var(--space-xs); } }
@media (max-width: 759px) and (max-height: 700px) {
  .ins-col .row--stack-sm { flex-direction: row; }
  .ins-col .row--stack-sm > .btn { flex: 1 1 0; padding-inline: 10px; }
  .svc-panel.panel-3d { padding: var(--space-s) 0; background: none; box-shadow: none; border-width: 1px 0; border-radius: 0; gap: var(--space-xs); }
  .svc-panel .stack-s { --stack: var(--space-xs); }
  .ins-col .measure { font-size: 0.9375rem; }
}
@media (min-width: 760px) and (max-height: 800px) { .svc-panel.panel-3d { padding: var(--space-m); } }
```
Measured spare: 68 at 1280×720, 48 at 1024×768, 52 at 360×740, 35 at 375×667, 21 at 360×640.

Compliance copy here is verbatim (§12).

---

## 5. Scenes 3 + 4 · `ours-strategy` split into "The Offer" + "What You Get" (ink)

Overflow before: 1366 +71, 1280 +134, 1024 +525, 768×1024 +270, 390 +842, 360 +967. **Move: split into a new scene.** The content is two ideas: the pitch (who it's for, the price frame, the CTA, the scarcity line and the compliance notice) and the stack (what you get, plus the promise).

### 5a. `ours-strategy` · "The Offer" (keeps its id: the jump rail, FOUNDER_OFFERS and deep links point here)
```html
<section class="scene" id="ours-strategy" data-field="ink" data-dur="5" data-iris="18% 50%"
         data-pose="2.4,1.2,-2,0.4,1.2,0" data-title="Business Strategy · Ours" aria-labelledby="strat-title">
  <div class="scene__inner"><div class="grid strat">
    <div class="span-7 keep-md md-span-12 stack stack-l">
      <div class="stack stack-s">
        <p class="eyebrow" data-reveal="fade">From our founder<span class="hide-sm"> · Finance and operations strategy</span></p>
        <h2 id="strat-title" class="t-d1" data-reveal="lines">The 30-Day Cash-Flow Clean&#8209;Up</h2>
      </div>
      <p class="t-lead" data-reveal="fade">…unchanged…</p>
      <div class="stack stack-s strat__cta" data-reveal="fade">
        <div class="row row--stack-sm">…Book a 15-Min Fit Call · Send an Inquiry… (unchanged)</div>
        <p class="hint">Opens WhatsApp. Nothing is sent until you tap send.</p>
      </div>
    </div>
    <aside class="span-4 start-9 keep-md md-span-12 stack stack-l strat__facts" aria-label="About this offer">
      <dl class="cred cred--stack" data-reveal="stagger">…Offered through / Service (unchanged)…</dl>
      <p class="t-small muted" data-reveal="fade">…[Founder] takes [4] … [2] spots open for [month]. (unchanged)</p>
      <p class="notice" data-reveal="fade"><strong>Strategy and coaching only.</strong> Not licensed accounting, tax or investment advice.</p>
      <a class="btn btn--link strat__next" href="#ours-strategy-plan">See What You Get <span class="btn__arrow" aria-hidden="true">→</span></a>
    </aside>
  </div></div>
</section>
```
- **Wide:** two columns, 7 | 4 (start 9), `align-items: end` so the facts column sits on the baseline of the CTA. The title becomes `t-d1`.
- **Laptop-short:** the same. At 1024×768 the columns are 7 | 5 (`.strat__facts { grid-column: 8 / -1 }` at `max-width: 1279px`).
- **Tablet portrait:** stacks (`md-span-12`). Spare 107.
- **Phone:** stacks; `.cred--stack` becomes 2 columns; the buttons stack. On **every** phone:
  - "See What You Get" is hidden (the next scene is one gesture away);
  - the facts column and the left column use `--space-m` between items (there is no `.stack-m` class in base.css, so this is a `--stack` override);
  - the grid row gap is `--space-m` and the CTA stack is `--space-xs`;
  - the eyebrow drops " · Finance and operations strategy" (`.hide-sm`). The same words are on screen in the `Service: Finance and operations strategy` credential, so the meaning is unchanged; listed in §12.
- **Extra-short phone:** the two buttons sit side by side and every gap in the scene is `--space-xs`.
```css
.cred--stack { grid-template-columns: 1fr; }
@media (min-width: 760px) and (max-width: 1279px) { .grid > .strat__facts.keep-md { grid-column: 8 / -1; } }
@media (max-width: 759px) {
  .cred--stack { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .strat { row-gap: var(--space-m); }
  .strat .stack-l, .strat__facts { --stack: var(--space-m); }
  .strat__cta { --stack: var(--space-xs); }
  .strat__next { display: none; }
}
@media (max-width: 759px) and (max-height: 700px) {
  .strat { row-gap: var(--space-xs); }
  .strat .stack-l, .strat__facts { --stack: var(--space-xs); }
  .strat .row--stack-sm { flex-direction: row; }
  .strat .row--stack-sm > .btn { flex: 1 1 0; padding-inline: 10px; }
}
```
Measured spare: 119 at 1280×720, 36 at 390×844, 20 at 360×740, 43 at 375×667, 16 at 360×640.

### 5b. NEW `ours-strategy-plan` · "What You Get"
```html
<section class="scene" id="ours-strategy-plan" data-field="ink" data-dur="5" data-iris="50% 50%"
         data-pose="2.4,1.2,-2,0.4,1.6,0" data-title="What You Get · Ours" aria-labelledby="plan-title">
  <div class="scene__inner"><div class="grid plan">
    <div class="span-12 stack stack-xs plan__head">
      <p class="eyebrow" data-reveal="fade">The 30-Day Cash-Flow Clean-Up</p>
      <h2 id="plan-title" data-reveal="lines">What You Get</h2>
    </div>
    <ol class="offer-stack span-7 keep-md md-span-12" id="offer-stack" data-reveal="stagger">…5 items, unchanged…</ol>
    <nav class="pager span-12 plan__pager" id="offer-pager" aria-label="More of the offer" hidden> … (ui-pager.js, static mode) </nav>
    <div class="span-5 start-8 keep-md md-span-12 stack stack-l plan__side">
      <div class="offer-promise panel-3d" data-reveal="fade">…unchanged (eyebrow "Our promise" data-decode)…</div>
      <div class="stack stack-xs plan__cta" data-reveal="fade">
        <a class="btn btn--primary" data-wa-fitcall href="#">Book a 15-Min Fit Call <span class="btn__arrow" aria-hidden="true">→</span></a>
        <p class="hint">Opens WhatsApp. Nothing is sent until you tap send.</p>
      </div>
    </div>
  </div></div>
</section>
```
- The old `h3.t-d4 "What You Get" data-reveal="chars"` becomes this scene's `h2`. The eyebrow names the offer, so the scene reads on its own. The "Strategy and coaching only" notice stays on 5a, where it was; this scene adds no new claim.
- Same field as 5a, so it crossfades (no iris). The pose keeps the globe hidden (`s=0`). The ry changes, so the next iris has somewhere to go.
- **Wide:** list 7 | side 5. `.offer-stack > li` padding is `clamp(8px, 1.2svh, 14px) 0`.
- **Tablet portrait:** stacks. Spare 130.
- **Phone:**
  - rows become `grid-template-columns: 1.5rem minmax(0, 1fr) auto` (the value stays on the title line), padding-block 6 px;
  - the promise padding tightens to `--space-s --space-m`;
  - **the CTA and hint are hidden** (`.plan__cta`). 5a, one gesture back, has the same "Book a 15-Min Fit Call" button and the same hint, so the action is not lost (listed in §12).
- **The list is paged on short phones** (toolkit §4, paged lists): **3 per page** at ≤ 760 px tall (items 1–3, then 4 + bonus), **2 per page** at ≤ 700 px tall (1–2, 3–4, bonus). Rows are 63–107 px (the "Fixes" line and the title wrap beside `[value]`) and the promise is 152 px, so all five need 693 px of 658 at 360×740. Measured: 39 spare at 360×740 (pages of 3), 85 at 375×667 and 61 at 360×640 (pages of 2). At 390×844 all five fit with 84 spare, so no pager.
```css
.offer-stack > li { padding: clamp(8px, 1.2svh, 14px) 0; }
.offer-stack { --per-page: 99; }
@media (max-width: 759px) {
  .offer-stack > li { grid-template-columns: 1.5rem minmax(0, 1fr) auto; gap: 2px var(--space-s); padding-block: 6px; }
  .offer-stack__value { grid-column: auto; }
  .offer-promise.panel-3d { padding: var(--space-s) var(--space-m); }
  .plan { row-gap: var(--space-m); }
  .plan__cta { display: none; }
}
@media (max-width: 759px) and (max-height: 760px) { .offer-stack { --per-page: 3; } }
@media (max-width: 759px) and (max-height: 700px) { .offer-stack { --per-page: 2; } }
```
**JS** (`services.js`): `createPager(document.getElementById('offer-stack'), { mode: 'static', maxPerPage: cssPerPage, label: 'offer items' })`, with the nav `#offer-pager`. Buttons read "Previous" / "Next" (static labels, SHARED-7), status "1–3 of 5". The numerals stay in the markup (`1`…`4`, `+`), so the order reads correctly on every page. `wireWhatsAppButtons()` already wires every `a[data-wa-fitcall]`. `services-fx.js` `flyNumerals()` targets `.offer-stack__n`, which now lives in 5b; a hidden `<li>` is simply not seen. Remove `FOUNDER_BARS['ours-strategy']` with the phone bar (Round 4 removal). `film.refreshReach()` after each page change.

---

## 6. Scene 5 · `ours-outsourcing` (gold)

Overflow before: 1280 +32, 390 +161, 360 +265. **Move: re-layout** (2 columns on desktop, a 2×2 grid of roles on phones).

```html
<!-- before: one span-6 column holds everything -->
<div class="span-6 md-span-12 stack stack-l"> head · lead · meta · ul.roles · CTA </div>
<!-- after -->
<div class="span-6 keep-md md-span-12 stack stack-l"> head · lead · meta · CTA (unchanged) </div>
<ul class="roles span-6 keep-md md-span-12" data-reveal="stagger" aria-label="Roles we supply"> …4 li unchanged… </ul>
```
- **Wide / laptop-short:** `.grid { align-items: center }` for this scene; copy left 6, roles right 6.
- **Tablet portrait:** stacks.
- **Phone:** `ul.roles` becomes a 2×2 grid of cells (number, role and "what" stacked). The buttons stack. `.roles__what` is 15 px (SHARED-11 §14).
- **Extra-short phone:** buttons side by side, role cells padding 6 px, the scene's row gap and stacks `--space-m`.
```css
.outs { align-items: center; }      /* the scene's .grid gets class "outs" */
@media (max-width: 759px) {
  .roles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: var(--space-s); }
  .roles > li { grid-template-columns: 1fr; gap: 2px; padding-block: 8px; }
  .roles > li:nth-last-child(-n + 2) { border-bottom: 1px solid var(--line); }
  .roles__what { grid-column: auto; }
}
@media (max-width: 759px) and (max-height: 700px) {
  .outs { row-gap: var(--space-m); } .outs .stack-l { --stack: var(--space-m); }
  .roles > li { padding-block: 6px; }
  .outs .row--stack-sm { flex-direction: row; } .outs .row--stack-sm > .btn { flex: 1 1 0; padding-inline: 10px; }
}
```
DOM order: the CTA block (buttons + hint) stays inside the copy column, before `ul.roles`. The phone order is then head → lead → meta → CTA → roles, which keeps the main action in the first two-thirds of the screen. Measured spare: 148 at 1280×720, 64 at 390×844, 32 at 360×740, 25 at 360×640.

Compliance: the hint "Provided by Cargado Strategies itself, not by a partner. Nothing is sent until you tap send." is verbatim and stays directly under the buttons.

---

## 7. Scene 6 · `finder` (ink) · the biggest change

Overflow before: 1366 +50, 1280 +73, 1024 +238, 390 +590, 360 +687 with **no results showing**. With results, every size overflows.

**Moves: re-layout + `.scene--fill` + responsive tabs + fit-paged results (every block is a slot) + type filter as a select on compact bands + no inner scroll in the combobox + profile as a dialog + "What happens next" as a compact strip that is its own grid item.**

### 7.1 Layout per band

| band | structure | results `maxPerPage` |
|---|---|---|
| wide, > 880 tall (1440×900, 1920×1080) | head row (title left, instructions right) / 3 columns 3fr · 5fr · 4fr: **controls** (form only) · **map** with the **strip under it** · **results** (paged list + notice). No tabs. Type filter as chips. | 3 |
| desktop ≥ 1280, ≤ 880 tall (1536×864, 1366×768, 1280×720) | same areas, columns 2.6fr · 4.4fr · 5fr (the wider results column holds a maxed row and the 16 px notice); type filter is a select | 2 |
| narrow landscape 760–1279 (1024×768) | head row / 2 columns: **controls** (form, then the strip under it) · **tabs "Map · Results"** (one panel visible); type select | 2 |
| tablet portrait (768×1024) | head row / form in **3 columns** (category · type · place) / **tabs "Map · Results"** filling the rest; the strip shows **under the map, on the Map tab only**; type select | 2 |
| phone | head / **tabs "Search · Map · Results"** filling the rest; the strip shows **with the Search tab**; type select | 2 |
| extra-short phone | as phone, but the strip shows **with the Map tab**, and the head is visually hidden on the Map and Results tabs | 2 |

`maxPerPage` is the upper bound; the fit pager (SHARED-7) shows fewer when they do not fit. Measured pages: real slots (founder block, ask block, placeholder) 1–2 per page everywhere; the maxed 5-partner fixture 3 per page at 1920×1080, 2 at 1536×864, 1440×900 and 768×1024, 1 elsewhere.

### 7.2 Markup (before → after)

Before: `div.finder__head`, `div.finder__controls > form`, `figure.finder__map`, `div.finder__side > section.results + section.next-steps`.

After:
```html
<section class="scene scene--fill" id="finder" data-field="ink" data-dur="7" data-iris="72% 48%"
         data-pose="0.35,-0.2,-3,0.6,0.2,0" data-title="Partner Finder" aria-labelledby="finder-title">
  <div class="scene__inner">
    <div class="finder" id="finder-root">                     <!-- ui-tabs writes data-tab="search|map|results" here in tab mode -->
      <header class="finder__head">
        <div class="stack stack-xs">
          <p class="eyebrow" data-reveal="fade">Partner finder</p>
          <h2 id="finder-title" data-reveal="lines">Find a Partner Near&nbsp;You.</h2>
        </div>
        <p class="t-small muted finder__how" data-reveal="fade">Choose what you need, then click a place on the map or search a city, province or postal code.</p>
      </header>

      <div class="tabs__list finder__tabs" role="tablist" aria-label="Partner finder" data-reveal="fade">
        <button class="tabs__tab" role="tab" id="ft-search"  aria-controls="fp-search"  aria-selected="true"  type="button" data-tab-only="phone">Search</button>
        <button class="tabs__tab" role="tab" id="ft-map"     aria-controls="fp-map"     aria-selected="false" type="button">Map</button>
        <button class="tabs__tab" role="tab" id="ft-results" aria-controls="fp-results" aria-selected="false" type="button">Results <span class="tabs__count num" id="finder-count" aria-hidden="true"></span></button>
      </div>
      <!-- the live region sits OUTSIDE every tab panel, so it is never inside a hidden panel -->
      <p class="visually-hidden" id="finder-live" role="status" aria-live="polite"></p>

      <div class="tabs__panel finder__controls" id="fp-search" role="tabpanel" aria-labelledby="ft-search" data-reveal="fade">
        <form class="form finder__form panel-3d" id="finder-form" novalidate>
          …category select (unchanged)…
          <fieldset class="form-row" id="finder-types" hidden>
            <legend class="label" id="finder-types-legend">Type</legend>
            <div class="chips chips--compact finder__type-chips" id="finder-type-chips"></div>
            <select class="select finder__type-select" id="finder-type-select" aria-labelledby="finder-types-legend"></select>
          </fieldset>
          …place combobox + error + hint (unchanged ids)…
        </form>
      </div>

      <figure class="tabs__panel finder__map" id="fp-map" role="tabpanel" aria-labelledby="ft-map" data-reveal="scale">
        <div class="map-box">
          <div class="map" id="finder-map" aria-describedby="finder-map-help" data-cursor-label="Pick">…</div>
        </div>
        <figcaption class="map__caption"> …#finder-chosen · #finder-map-help (unchanged)… </figcaption>
      </figure>

      <section class="next-strip" aria-labelledby="next-title" data-reveal="fade">
        <div class="next-strip__head">
          <h3 class="eyebrow" id="next-title" data-decode data-delay="0.2">What happens next</h3>
          <ul class="ticks"><li>Free</li><li>No obligation</li></ul>
        </div>
        <ol class="next-strip__list">
          <li><span class="next-steps__when num">Now</span><span>WhatsApp opens with your message ready</span></li>
          <li><span class="next-steps__when num">Within <span class="ph">[24h]</span></span><span>We introduce you both</span></li>
          <li><span class="next-steps__when num">Day <span class="ph">[3]</span></span><span>We check in to see it went well</span></li>
        </ol>
      </section>

      <section class="tabs__panel results" id="fp-results" role="tabpanel" aria-labelledby="ft-results results-title" data-reveal="fade">
        <h3 class="t-d4 results__title" id="results-title" tabindex="-1">Nearest Partners</h3>
        <p class="results__status" id="finder-status"></p>                <!-- visible copy, no role -->
        <div class="results__list" id="finder-results"></div>              <!-- one page of slots -->
        <nav class="pager" id="finder-pager" aria-label="More results" hidden> … (ui-pager.js, fit mode) </nav>
        <p class="notice results__notice"> …verbatim… </p>
      </section>
    </div>
  </div>
</section>
```
- The old `.grid.finder` with `span-*` classes becomes a named-area grid (CSS below), because the areas change per band.
- **Status announcements.** `finder.js` writes each status twice: the visible `#finder-status` (plain text in the Results panel) and the visually hidden `#finder-live` (`role="status"`), which sits directly under the tablist, outside every panel. The Results panel is `hidden` on the phone Search and Map tabs and on the tablet Map tab, and a live region inside a hidden panel is not announced; `#finder-live` always is. To make every change audible, clear `#finder-live` and set the new text on the next frame.
- **The strip is outside the panels.** It belongs to no tab. CSS places it per band and shows it only with the tab named in 7.1, using `.finder[data-tab]` (SHARED-7). When it is hidden it is `display: none`, so it leaves the accessibility tree like a hidden panel.
- In wide mode `ui-tabs.js` removes `role="tab"`, `role="tabpanel"` and `aria-*` from the tabs and panels, and the tablist is `display:none`.
- `data-tab-only="phone"`: the Search tab exists only in phone mode. In "Map · Results" mode the Search tab gets `hidden`, its panel is always shown, and **`#fp-search` loses `role="tabpanel"` and `aria-labelledby`** (they would point at a hidden tab).
- `#finder-place-hint` (verbatim) stays under the input, and `aria-describedby` is unchanged.
- `.map-box` is the size container that lets the map keep its aspect ratio in any box (7.3).

### 7.3 CSS
The current services.css has `.finder { align-items: start; }` and `.results { align-content: start; }`. Both must go (or be overridden as below): with `start`, the panels shrink to their content and the list gets no height.
```css
.finder { display: grid; height: 100%; min-height: 0; align-items: stretch; column-gap: var(--gap-col); row-gap: var(--space-m);
  grid-template-columns: 3fr 5fr 4fr; grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-areas: "head head head" "controls map results" "controls strip results"; }
.finder__head { grid-area: head; display: flex; align-items: end; justify-content: space-between; gap: var(--space-l); }
.finder__how { max-width: 40ch; text-align: right; }
.finder__tabs { display: none; grid-area: tabs; }
.finder__controls { grid-area: controls; display: flex; flex-direction: column; gap: var(--space-m); min-height: 0; }
.finder__map { grid-area: map; min-height: 0; min-width: 0; margin: 0; display: grid;
  grid-template-rows: minmax(0, 1fr) auto; grid-template-columns: minmax(0, 1fr); gap: var(--space-xs); }
.map-box { container-type: size; min-height: 0; display: grid; place-items: center; }
.map-box .map { width: min(100cqw, 100cqh * 1000 / 858); height: auto; aspect-ratio: 1000 / 858; }  /* fits the box, keeps the ratio */
/* results: a flex column, so a visually hidden title or a hidden pager never shifts which row is flexible */
.results { grid-area: results; min-height: 0; display: flex; flex-direction: column; gap: var(--space-s); --per-page: 2; }
.results__list { flex: 1 1 auto; min-height: 0; display: grid; align-content: start; gap: var(--space-s); }   /* no overflow clip: SHARED-12 */
.results__list > * { margin: 0; }
.result { padding: var(--space-s) 0; }
.result .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-s); }
/* "What happens next" strip */
.next-strip { grid-area: strip; display: grid; gap: var(--space-xs); align-content: start; }
.next-strip__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--space-xs) var(--space-m); }
.next-strip__list > li { display: grid; grid-template-columns: 7rem 1fr; gap: var(--space-s); align-items: baseline;
  padding: 6px 0; border-top: 1px solid var(--line); }            /* size from §14 (16 px / 15 px) */
.next-strip__list > li:last-child { border-bottom: 1px solid var(--line); }
.finder__form.panel-3d { padding: var(--space-m); }
.finder .form { gap: var(--space-s); }

/* type filter: chips on tall desktops, a select everywhere else */
.finder__type-select { display: none; }
@media (max-width: 759px), (min-width: 760px) and (max-height: 880px), (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) {
  .finder__type-chips { display: none; }
  .finder__type-select { display: block; }
}

@media (min-width: 1280px) and (min-height: 881px) { .results { --per-page: 3; } }
@media (min-width: 1280px) and (max-height: 880px) { .finder { grid-template-columns: 2.6fr 4.4fr 5fr; } }

/* narrow landscape + tablet portrait: Map · Results tabs; the strip sits under the controls */
@media (min-width: 760px) and (max-width: 1279px) {
  .finder { grid-template-columns: 5fr 7fr; grid-template-rows: auto auto minmax(0, 1fr) auto;
    grid-template-areas: "head head" "controls tabs" "controls panel" "strip panel"; }
  .finder__tabs { display: flex; }
  .finder__map, .results { grid-area: panel; }
}
/* tablet portrait: head row, form in 3 columns, strip under the panel and only with the Map tab */
@media (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) {
  .finder { grid-template-columns: 1fr; grid-template-rows: auto auto auto minmax(0, 1fr) auto;
    grid-template-areas: "head" "controls" "tabs" "panel" "strip"; }
  .finder:not([data-tab="map"]) .next-strip { display: none; }
  .finder__form { display: grid; grid-template-columns: 1fr 1fr 1.3fr; column-gap: var(--gap-col); align-items: start; }
  .next-strip__list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: var(--space-m); }
  .next-strip__list > li { grid-template-columns: 1fr; gap: 2px; border-bottom: 1px solid var(--line); }
  .results { gap: var(--space-xs); }
}
/* phone: Search · Map · Results; the strip shows with Search */
@media (max-width: 759px) {
  .finder { grid-template-columns: 1fr; grid-template-rows: auto auto minmax(0, 1fr) auto;
    grid-template-areas: "head" "tabs" "panel" "strip"; row-gap: var(--space-s); }
  .finder__head { flex-direction: column; align-items: start; gap: var(--space-xs); }
  .finder__how { text-align: left; }
  .finder__tabs { display: flex; }
  .finder__controls, .finder__map, .results { grid-area: panel; }
  .finder__form.panel-3d { padding: var(--space-s) var(--space-m); }
  .finder:not([data-tab="search"]) .next-strip { display: none; }
  .next-strip__list > li { grid-template-columns: 5.5rem 1fr; padding: 4px 0; }
}
@media (max-width: 759px) and (max-height: 760px) { .finder__how { display: none; } }  /* the Search tab's labels carry the same instruction */
/* extra-short phone: the strip moves to the Map tab, the head steps aside on Map and Results */
@media (max-width: 759px) and (max-height: 700px) {
  .finder .form { gap: var(--space-xs); }
  .finder__head .eyebrow { display: none; }
  .next-strip__list > li { padding: 2px 0; }
  .finder[data-tab="search"] .next-strip { display: none; }
  .finder[data-tab="map"] .next-strip { display: grid; }
}
```
**JS-toggled visually hidden headings** (never inline clip CSS, so SHARED-12 skips them): `services.js` adds the `.visually-hidden` class to `#results-title` while phone tab mode is active (the Results tab already names the panel; the heading stays the focus target), and to `.finder__head` while the extra-short query matches and `data-tab` is `map` or `results`. Both are removed when the mode ends. The h2 stays in the DOM, so `aria-labelledby="finder-title"` still names the scene.

**Measured** (Insurance, Legal, Business Strategy and the maxed 5-partner fixture of §7.7, each with "Winnipeg" chosen):

| viewport | controls / Search panel spare | map | results: page of real slots (spare) | maxed fixture: per page (spare) | worst single slot |
|---|---|---|---|---|---|
| 1920×1080 | 429 | 503×432 | 2 (279) | 3 (60) | 358 |
| 1536×864 | 339 | 442×379 | 2 (119) | 2 (68) | 197 |
| 1440×900 | 280 | 504×433 | 2 (130) | 2 (79) | 209 |
| 1366×768 | 263 | 373×320 | 2 (43) | 1 (161) | 120 |
| 1280×720 | 223 | 327×280 | Business Strategy 1 (120), others 2 (76) | 1 (122) | 79 |
| 1024×768 | Map tab: 529×454 | — | Business Strategy 1 (116), others 2 (70) | 1 (118) | 77 |
| 768×1024 | Map tab: 446×383 | — | 2 (119) | 2 (24) | 176 |
| 390×844 | 69 | 358×307 | 2 (33) | 1 (77) | 77 |
| 360×740 | 36 | 331×284 | Business Strategy 1 (113), others 2 (47) | 1 (48) | 48 |
| 375×667 | 205 | 317×272 | Business Strategy 1 (114), others 2 (49) | 1 (51) | 51 |
| 360×640 | 178 | 285×245 | Business Strategy 1 (87), others 2 (22) | 1 (24) | 24 |

Why the type select: Legal and Manufacturing have 6 types, so 7 chips (3 rows). The select is one 44–48 px control. The rule covers every category with types in the compact bands, with no per-count logic. Chips stay where they fit (> 880 px tall desktops).

### 7.4 Responsive tabs (`ui-tabs.js`, SHARED-7)
- Mode is decided by `matchMedia`: phone → tabs over `[search, map, results]`; 760–1279 → tabs over `[map, results]` (Search hidden, controls always visible, `#fp-search` without tab roles); ≥1280 → no tabs. Re-evaluate on `change`.
- In tab mode:
  - `role="tablist"`, `role="tab"` with `aria-selected`, `aria-controls` and roving `tabindex` (0 on the selected tab, −1 on the rest; written through `setTabStop`, SHARED-7);
  - `role="tabpanel"` on each panel in the mode, **with no `tabindex`** on any panel: the map panel holds focusable map regions and the others hold controls, so a panel tab stop would only add an extra stop;
  - inactive panels get `hidden`; `#finder-root` gets `data-tab`;
  - keys: ←/→ move and activate (automatic activation; panels are cheap), Home/End.
- In no-tab mode: remove the roles, `aria-selected`, `hidden` and `data-tab`, and the tablist is `display:none`.
- **Auto-switch and focus.** `onPlace` (map click or place search) switches to **Results** in tab mode and announces through `#finder-live`. **Rule: whenever an automatic tab switch hides the panel that holds `document.activeElement`, focus moves to `#results-title`** (`tabindex="-1"`, `focus({ preventScroll: true })`). On phones this covers both a map pick and a place search from the Search tab (without the move, focus drops to `<body>` with the keyboard still open). At 760–1279 a place search leaves focus in the always-visible controls, and a map pick moves it to `#results-title`. On phones, a category change while on Map leaves the tab alone.
- `#finder-count` shows the result count on the Results tab (`aria-hidden`; the live region says it for screen readers).
- Remember the selected tab per mode in memory only (no storage).
- **Hooks:** tabs are `role="tab"`, so sfx already pops on click. `film.refreshReach()` after a mode change and after each tab change. The `data-reveal` attributes sit on the panels themselves: a hidden panel keeps the opacity its reveal set, so showing it later shows the correct scrubbed state. The map's clip-path wipe and `standMap()` tween target `#finder-map`; **gate `standMap()` to non-tab mode** (`!finderTabs.isTabbed()`), because a hidden map has no box.
- Deep link `services.html#finder` → default tab: phone → Search, otherwise → Map.

### 7.5 Paged results: every block is a slot (`ui-pager.js` fit mode, SHARED-7)
- `finder-results.js` `resultsView()` returns **slots** instead of one HTML string: `{ status, slots: [html…] }`. A slot is one of:
  - the founder block (`.results__ours`, "From our founder … not a partner listing");
  - the ask block (`.results__ask`, "Prefer to Ask First?" + button + hint), returned today by `founderAskBlock()` for the founder's own services;
  - one result row (`.result`);
  - one "Partner Spot Available" card (`subPlaceholderCard`).
  The `.partner-list` and `.results__rows` wrappers go: slots are direct children of `#finder-results`. The `.results .partner-card` styles still apply.
- Slot order per state (unchanged meaning, distance ranking untouched):
  | state | slots |
  |---|---|
  | no category | none (status only) |
  | founder-only category (Business Strategy, Outsourcing) | founder block, ask block |
  | partner category, nobody listed (today, `PARTNERS = []`) | founder block (if any, e.g. Insurance), placeholder card |
  | partner category with partners | founder block (if any), result rows sorted by distance (cap `MAX_RESULTS` = 5; without a place, the whole pool, same cap) |
- **The pager runs on every state.** `maxPerPage` comes from CSS (`--per-page`, 7.3), read with `parseInt(getComputedStyle(results).getPropertyValue('--per-page'))` and re-read on resize and on tab-mode change. The fit check then decides the real page size. When all slots fit on one page the pager is hidden.
- **Every slot is at most one page high** (lowest: 24 px spare, the maxed fixture at 360×640 and 768×1024 two-up).
- **Compact result row** (always): head (business name + km) / one meta line (contact name · types · city, province) / one row with **Introduce Me** (`.btn--sm`, 44 px via `.results .btn--sm`) + **View Profile** (`.btn--link`, opens the dialog 7.7). **The credential line moves out of the row into the profile dialog**, where "Licence or credential" and "Issued by" are already listed. Measured: with a 40 + 40-character credential line a single maxed row overflows one page at 1280×720 and on every phone.
- Pager markup:
  ```html
  <nav class="pager" aria-label="More results">
    <button class="btn btn--ghost btn--sm pager__btn" type="button" data-dir="-1" data-roll="none">Previous<span class="visually-hidden"> results</span></button>
    <p class="pager__status num">1–2 of 5</p>
    <button class="btn btn--ghost btn--sm pager__btn" type="button" data-dir="1" data-roll="none">Next<span class="visually-hidden"> results</span></button>
    <span class="visually-hidden" aria-live="polite" data-pager-live></span>
  </nav>
  ```
  Next/Previous focuses the first new slot's heading or first focusable (`.result__name` with `tabindex="-1"`, or the slot's first link/button), with `preventScroll`, and the live span reads "Showing results 3 to 4 of 5". **A new search resets to page 1 silently** (status text updated, live span untouched), so only `#finder-live` speaks after a search.
- Hooks: result rows keep `data-tilt` and `[data-depth]`. Pager buttons are `.btn` (magnetic, click sfx; no letter roll). `cue('result')` stays on `onPlace`; add no cue for paging (the click covers it). `film.refreshReach()` after each page render.

### 7.6 Combobox list without inner scrolling
`.combo__list` drops `max-height: 290px; overflow-y: auto`. `suggestPlaces(raw, limit)` is called with a limit that fits: `5`, or `4` on phones (`matchMedia('(max-width: 759px)')`), `3` on extra-short phones. Each option is 44 px or more. In `open()`, measure the room below the input inside `.scene__inner`. If it is less than the list height, add `.combo__list--up` (`top:auto; bottom: calc(100% + 4px)`) so it never pushes the scene. The list is absolutely positioned and overlays the map or strip, as today.

### 7.7 Partner profile as a dialog (`partner-profile.js` + `ui-dialog.js`)
Before: `<details class="profile"><summary>View Profile…</summary><div class="profile__body">…</div></details>` inside every result and category card.
After: a trigger in the card, and one dialog per page.
```html
<!-- in each result / partner card -->
<button class="btn btn--link profile__open" type="button" aria-haspopup="dialog"
        data-partner="${index in PARTNERS}" data-category="${category.slug}">View Profile<span class="visually-hidden"> of ${business}</span></button>

<!-- once, at the end of <main class="scenes"> (outside every scene, so no scene's opacity hides it) -->
<dialog class="dialog profile-dialog" id="profile-dialog" aria-labelledby="profile-dialog-title">
  <div class="dialog__panel panel-3d">
    <header class="dialog__head">
      <div class="stack stack-xs"><p class="eyebrow">Partner profile</p><h2 class="t-d3" id="profile-dialog-title"></h2></div>
      <button class="dialog__close icon-link" type="button" data-dialog-close aria-label="Close profile">×</button>
    </header>
    <div class="dialog__body profile__body"><!-- profileBody(partner, category) --></div>
  </div>
</dialog>
```
- `profileMarkup()` splits into `profileTrigger(partner, category, index)` and `profileBody(partner, category)`.
- **Body order: notice → facts → description → inquiry link.** The independent-business / commission notice comes first, right under the title, so no description length can push it out of view. Notice text and facts are **unchanged**. The notice is 16 px (15 px on phones) through §14 (`.profile__notice`, `.profile__body`); it was 12 px.
- **Every displayed field is capped by a build check.** `config.js` documents the limits in the PARTNERS comment; `tools/check-config.mjs` (called from `build.mjs`) fails `npm run build` when an entry breaks one:
  | field | shown in | limit |
  |---|---|---|
  | `business` | dialog title, notice, row/card title | ≤ 40 characters |
  | `name` (contact) | row and card meta | ≤ 30 |
  | `city` | row meta | ≤ 24 |
  | `serviceArea` | card meta, dialog "Service area" | ≤ 40 |
  | `credential` | dialog "Licence or credential" | ≤ 40 |
  | `issuingBody` | dialog "Issued by" | ≤ 40 |
  | `types` | row meta, dialog "Service" | ≤ 3 entries |
  | `languages` | dialog "Languages" | ≤ 3 entries |
  | `description` | dialog | ≤ 140 characters ("one or two plain sentences") |
  The fixture `tools/fit-states/fixtures/partners-max.json` holds 5 partners at every limit (40-character business, 30-character name, 24-character city, 40-character area, credential and issuer, 3 types, 3 languages, 140-character description); every number in §0.3 for finder, categories and dialog uses it. It is served only by fit-audit's `--fixture` (SHARED-12) and never committed into `site/` (CR16).
- The description keeps a 3-line clamp as a last safety net (`-webkit-line-clamp: 3`). With the caps it never cuts text (measured: `desc clipped=false` at all 11 sizes), and SHARED-12 would flag it if it did.
- The inquiry link reads "Send an Inquiry →" with `<span class="visually-hidden"> about ${business}</span>` (it was "Send an Inquiry About {business}", which wrapped on phones). Not compliance copy.
```css
.dialog { padding: 0; border: 0; background: transparent; color: var(--fg); overflow: visible;
  width: min(40rem, calc(100vw - 2 * var(--page-pad))); max-width: none; max-height: calc(100svh - 2 * var(--page-pad)); }
.dialog::backdrop { background: rgb(0 0 0 / 0.6); }
.dialog__panel { display: grid; gap: var(--space-m); padding: var(--space-l); background: var(--bg); }
.dialog__head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-s); align-items: start; }
.dialog__close { width: 44px; height: 44px; }
.dialog__body { display: grid; gap: var(--space-s); padding: 0; }
.profile__facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-xs) var(--space-m); margin: 0; }
.profile__facts > div { display: block; }
.profile__desc { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
@media (max-width: 759px) {          /* phones: full-screen dialog, facts as one line each */
  .dialog { width: 100vw; max-width: 100vw; height: 100svh; max-height: 100svh; margin: 0; }
  .dialog__panel { min-height: 100%; align-content: start; padding: var(--space-m); }
  .dialog__head .eyebrow { display: none; }
  .profile__facts { grid-template-columns: 1fr; gap: 2px; }
  .profile__facts dt, .profile__facts dd { display: inline; }
  .profile__facts dt::after { content: " "; }
}
@media (max-width: 759px) and (max-height: 700px) { .dialog__panel { gap: var(--space-s); } .dialog__body { gap: var(--space-xs); } }
```
- `.dialog` is `overflow: visible` (it was `hidden`, which would have hidden a too-long body from both the visitor and fit-audit; SHARED-12).
- Measured with the maxed fixture: panel 595 px tall at 1280×720 (125 px of the viewport left), 684 at 1920×1080; on phones the full-screen dialog has 100 px free under the link at 360×740, 85 at 375×667, 36 at 360×640.
- **Opening:** `openDialog(dialog, { trigger })`: `showModal()` gives the focus trap and inert background; `film.stop()` (SHARED-8) stops wheel and touch scrolling of the film behind it; in flow mode `html:not(.film):has(dialog[open]) { overflow: hidden }` stops the document. Escape and a backdrop click close it; `film.start()` runs on close; focus returns to the trigger. Copy `data-field` from the trigger's scene onto the dialog when it opens, so its colours match.
- **"Send an Inquiry" inside the dialog** must not leave focus in the scene that is about to leave the screen (`updateReach` keeps a scene reachable while `document.activeElement` is in it). The click handler, in this order:
  1. `event.preventDefault()`;
  2. `closeDialog(dialog, { returnFocus: false })` (this also runs `film.start()`);
  3. `inquiry.setCategory(slug)` (selects the category and goes to step 1, §9.5);
  4. `film ? film.goTo('inquiry') : document.getElementById('inquiry').scrollIntoView()`;
  5. `document.getElementById('inq-s1-title').focus({ preventScroll: true })`. film.js's `onFocusIn` then targets the same scene, and `updateReach` now keeps only the inquiry scene reachable.
- Snap is suspended while the dialog is open (SHARED-8). `cue('open')` plays on open (replaces the `toggle` capture listener in `services.js`). Film mode uses the existing `svc-unfold` keyframe on `.dialog__panel`; reduced motion uses none.

### 7.8 services.js / finder.js wiring changes
- `onPlace: () => { cue('result'); finderTabs.showResultsIfTabbed(); }`. `showResultsIfTabbed()` applies the focus rule of 7.4. Drop `bringIntoView(results-title)`; `services-view.js` is used only by the < 560 px-tall pan fallback.
- `finder.js` writes every status to `#finder-status` (visible) and `#finder-live` (announced), 7.2.
- `finder.js` renders both type controls from the same list: the chips (`All` + types) and the select (`All types` + types). Both call the same `setType(slug)`, and each change syncs the other (`select.value`, radio `checked`). Only one is displayed per band (7.3), so only one is in the accessibility tree.
- `services.js` toggles `.visually-hidden` on `#results-title` and `.finder__head` as described in 7.3, on tab-mode and tab changes.
- `updateBar` / `barFor` / `FOUNDER_BARS` / `BAR_DEFAULT` go with the phone bar.

---

## 8. Scene 7 · `categories` (bone)

Overflow before: every size except 1920×1080, by +149 to +1016. The detail card alone is 925–1054 px. **Moves: re-layout (2-column card on tall desktops) + card tabs (phone, tablet portrait, every desktop ≤ 880 px tall) + fit-paged partner list + an in-scene sheet for the card on phones.**

### 8.1 Layout per band
| band | structure |
|---|---|
| wide, > 880 tall (1440×900, 1920×1080) | left 4: head + rail (Ours / Partners, one column, 40 px rows on fine pointers) · right 8: card with **two inner columns**: (description, tags, founder block, actions) \| (partners eyebrow, one page of partners, pager); **the partner notice runs full width under both columns**, inside the card |
| desktop ≤ 880 tall (1536×864, 1366×768, 1280×720, 1024×768) | left 4 · right 8 (`keep-md` at 1024×768); the card uses **tabs**: "Overview · Partners" (Insurance: "Overview · Ours · Partners"); the Partners panel lists up to 2 partners side by side |
| tablet portrait (768×1024) | left 4: head + rail as **one** column · right 8: card with the same tabs, one inner column |
| phone | head · **category grid** (3×3 buttons under "Ours" / "Partners" labels). Picking one opens the card as an **in-scene sheet** over the grid, with "← All Categories" in the card's head row and the same tabs |

Card tabs, per category (tab modes only):
- partner-only categories: **Overview** (description, tags, actions, short notice) · **Partners** (list, pager, full notice);
- Insurance (founder + partners): **Overview** · **Ours** (founder block) · **Partners**;
- founder-only categories (Business Strategy, Outsourcing): no tablist; one panel (description, founder block, actions).

### 8.2 Markup
```html
<section class="scene scene--fill" id="categories" …unchanged attributes…>
  <div class="scene__inner"><div class="grid cats">
    <div class="cats__nav stack stack-m">
      <div class="stack stack-xs"> eyebrow · h2#cat-title · p.t-small.muted (verbatim) </div>
      <nav class="cat-rail" id="cat-rail" aria-label="Service categories" data-reveal="fade"></nav>
    </div>
    <div class="cat-detail" id="cat-detail" data-reveal="fade" data-swing tabindex="-1" aria-labelledby="cat-detail-title">
      <div class="cat-sheet" id="cat-sheet">          <!-- created once, never re-rendered, never a tween target -->
        <!-- detailMarkup() renders .cat-card here on every select() -->
      </div>
    </div>
  </div><p class="visually-hidden" id="cat-announce" aria-live="polite"></p></div>
</section>
```
- The two columns no longer carry `span-*` / `md-span-*` classes; services.css places them (8.3), because `md-span-4` / `md-span-8` do not exist.
- **Why the extra `.cat-sheet` wrapper:** `#cat-detail` keeps `data-reveal="fade"` and `data-swing`, so GSAP writes inline `opacity` and `transform` (y, rotationY, scale) on it, and inline styles beat any class. The open/close state, its opacity and its translate therefore live on `.cat-sheet`, which no film tween targets. `.cat-card` cannot carry the state either: it is re-rendered on every pick and runs the `svc-flip-in` keyframe.

`detailMarkup()` (services-categories.js) becomes:
```html
<div class="cat-card panel-3d">
  <div class="cat-card__top">
    <div class="cat-card__head stack stack-xs" data-depth="40"> eyebrow ownershipLabel · h3#cat-detail-title </div>
    <button class="sheet__back btn btn--link" type="button" data-sheet-close>← All Categories</button>   <!-- phone only (CSS) -->
  </div>
  <div class="tabs__list cat-card__tabs" role="tablist" aria-label="${name} details">            <!-- only when hasPartners -->
    <button role="tab" id="ct-about" aria-controls="cp-about" aria-selected="true" class="tabs__tab" type="button">Overview</button>
    <button role="tab" id="ct-ours" aria-controls="cp-ours" aria-selected="false" class="tabs__tab" type="button">Ours</button>   <!-- only when ownership is "both" -->
    <button role="tab" id="ct-partners" aria-controls="cp-partners" aria-selected="false" class="tabs__tab" type="button">Partners</button>
  </div>
  <div class="cat-card__cols">
    <div class="tabs__panel cat-card__about stack stack-s" id="cp-about" role="tabpanel" aria-labelledby="ct-about">
      p.cat-detail__desc · ul.tags · founderMarkup() (not for "both"; see cp-ours) · actionsMarkup() · p.notice.cat-card__brief
    </div>
    <div class="tabs__panel cat-card__ours" id="cp-ours" role="tabpanel" aria-labelledby="ct-ours">   <!-- only for "both" -->
      founderMarkup()
    </div>
    <div class="tabs__panel cat-card__partners" id="cp-partners" role="tabpanel" aria-labelledby="ct-partners">
      h4.eyebrow (Partners / Also from partners) · div.partner-list (one page) · nav.pager · p.notice.cat-card__notice--tabbed (verbatim)
    </div>
  </div>
  <p class="notice cat-card__notice--wide"> …the same verbatim notice… </p>
</div>
```
- **The back button sits in the card's head row** on phones (top right), not on its own row above the head. Focus still lands on `#cat-detail-title` first when the sheet opens.
- **The full partner notice** (verbatim) is rendered twice, and CSS shows exactly one: `.cat-card__notice--wide` (full width under both columns) on wide screens, `.cat-card__notice--tabbed` (inside the Partners panel, beside the listings) in tab modes. The hidden copy is `display: none`, so it is not in the accessibility tree.
- **Short notice in Overview** (tab modes only, partner categories only): with tabs, the Overview panel shows "Find One Near You" and "Ask on WhatsApp" while the Partners panel (and its notice) is hidden. So Overview gets:
  ```html
  <p class="notice cat-card__brief">Partners are independent businesses, listed by distance only.
    Cargado Strategies may receive a commission if you become their client.
    <span class="ph">[Wording to be confirmed by counsel]</span>
    <button type="button" class="link-btn" data-tab-to="partners">Read the full notice</button></p>
  ```
  The two sentences are taken from the full notice word for word (independence, distance only, commission), and the counsel placeholder is kept, like every other compliance notice on the page. The button selects the Partners tab and moves focus to its notice. The full notice (with "a listing is not a recommendation") stays in the Partners panel. Listed in §12 for counsel. `.link-btn` (SHARED-7) is 24 px inline on fine pointers and a 44 px target on phones and coarse pointers.
- **The Partners `h4` is hidden with the class, not with inline CSS.** In tab modes `services-categories.js` adds `.visually-hidden` to `.cat-card__partners > h4` (the tab already says "Partners") and removes it when tab mode ends; on wide screens it shows as today. SHARED-12 skips `.visually-hidden`, so the heading is never reported as clipped.
- **Partner card** (`partnerCard()`): avatar · title (business) · one meta line (contact name · service area) · one actions row: **Introduce Me →** (`.btn.btn--link`, 44 px from base.css) and **View Profile** (`.btn.btn--link`, opens the dialog). The credential line moves into the profile dialog (as in the finder, 7.5).
- **Placeholders never page.** Placeholder cards fill up to `min(MIN_CARDS, maxPerPage)`, so with nobody listed a phone shows one "Partner Spot Available" card and no pager, and a desktop shows two.
- Founder-only categories render no tablist and no Partners panel, and the About panel spans both columns.

### 8.3 CSS
```css
.cats { height: 100%; grid-template-rows: minmax(0, 1fr); align-items: stretch; }
@media (min-width: 760px) {
  .cats > .cats__nav { grid-column: 1 / span 4; }
  .cats > .cat-detail { grid-column: 5 / -1; }
}
.cats__nav { min-height: 0; }
.cat-rail__item { min-height: 40px; padding-block: 6px; }
@media (min-width: 760px) and (max-height: 800px) and (pointer: fine) { .cat-rail__item { min-height: 36px; padding-block: 4px; } }
@media (pointer: coarse) { .cat-rail__item { min-height: 44px; } }
.cat-sheet { height: 100%; }
.cat-card { height: 100%; display: flex; flex-direction: column; gap: var(--space-m); padding: var(--space-l); }
.cat-card > * { margin: 0; }
.cat-card__top { display: flex; justify-content: space-between; align-items: start; gap: var(--space-s); }
.cat-card__cols { flex: 1 1 auto; min-height: 0; display: grid; grid-template-rows: minmax(0, 1fr);   /* a bounded row, so the fit pager can measure */
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: var(--gap-col); }
.cat-card__partners { display: flex; flex-direction: column; gap: var(--space-s); min-height: 0; --per-page: 2; }
.cat-card__partners .partner-list { flex: 0 1 auto; min-height: 0; }   /* the fit pager measures this box */
.cat-card__tabs, .sheet__back, .cat-card__brief, .cat-card__notice--tabbed { display: none; }
.cat-card__notice--wide { max-width: none; }
.cat-detail .partner-list { grid-template-columns: 1fr; }
.partner-card__actions { display: flex; flex-wrap: wrap; gap: 0 var(--space-m); }
.cat-detail__desc { font-size: var(--fs-lead); }
.cat-card .t-d3 { font-size: var(--fs-d3); }

/* every tab mode: phone, tablet portrait, desktops ≤ 880 tall */
@media (max-width: 759px), (min-width: 760px) and (max-height: 880px), (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) {
  .cat-card__tabs { display: flex; }
  .cat-card__cols { grid-template-columns: 1fr; }
  .cat-card__brief, .cat-card__notice--tabbed { display: block; }
  .cat-card__notice--wide { display: none; }
}
/* desktops ≤ 880 tall: a page of up to 2 side by side */
@media (min-width: 760px) and (max-height: 880px) {
  .cat-card__partners .partner-list { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: var(--gap-col); }
}
/* tablet portrait: the rail is ONE column inside the 4/12 nav (the base ≤1099 rule makes it 2) */
@media (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) {
  .cats__nav .cat-rail { grid-template-columns: 1fr; }
  .cats__nav .cat-rail__group, .cats__nav .cat-rail__list { grid-row: auto; }
  .cats__nav .cat-rail__group:not(:first-child) { margin-top: var(--space-s); }
}
/* phone: grid of categories, card as an in-scene sheet in the same grid cell */
@media (max-width: 759px) {
  .cats { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }
  .cats > .cats__nav, .cats > .cat-detail { grid-area: 1 / 1; }      /* both in one cell: no absolute positioning */
  .cat-detail { pointer-events: none; z-index: 1; }                   /* the closed sheet never blocks the grid */
  .cat-rail { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .cat-rail__group { grid-column: 1 / -1; grid-row: auto; margin: var(--space-xs) 0 0; }
  .cat-rail__list { display: contents; }
  .cat-rail__item { min-height: 48px; padding: 6px 8px; justify-content: center; text-align: center;
    border: 1px solid var(--line-strong); border-radius: var(--radius); line-height: 1.2; }   /* 15 px, SHARED-11 */
  .cat-rail__tag { display: none; }
  .cat-sheet { background: var(--bg); visibility: hidden; opacity: 0; transform: translateY(16px);
    transition: opacity .3s var(--ease), transform .3s var(--ease), visibility 0s linear .3s; }
  .cat-sheet.is-open { visibility: visible; opacity: 1; transform: none; pointer-events: auto; transition-delay: 0s; }
  .sheet__back { display: inline-flex; flex: none; }
  .cat-card.panel-3d { padding: var(--space-m); }
  .cat-card__partners { --per-page: 1; }
}
/* extra-short phone */
@media (max-width: 759px) and (max-height: 700px) {
  .cat-card { gap: var(--space-xs); }
  .cat-card.panel-3d { padding: var(--space-s) var(--space-m); }
  .cat-card__about { --stack: var(--space-xs); }
  .cat-card__partners { gap: var(--space-xs); }
  .cat-card__about .row--stack-sm { flex-direction: row; }
  .cat-card__about .row--stack-sm > .btn { flex: 1 1 0; padding-inline: 10px; }
  .cat-card__about .tags { display: none; }          /* the same types are in the finder's type select and in each profile */
}
html.rm .cat-sheet { transition: none; }
```
Notes:
- The card is a flex column, not a grid with fixed rows: a fixed `auto auto minmax(0,1fr)` template gave the 1fr to the tabs row and let the columns overflow.
- The phone sheet and the grid share one grid cell (`grid-area: 1 / 1`). `position: absolute; inset: 0` is not used: GSAP's transform on `#cat-detail` would make it the containing block anyway.
- `.cat-rail__list { display: contents }` keeps the `<ul aria-labelledby>` semantics in Chromium and Firefox. Safari ≥ 16 also keeps them; verify in QA.

**Entry swing in fill scenes (services-fx.js).** `#cat-detail` and `#inquiry-panel` fill their scene to the box edge, so the `[data-swing]` entry (`rotationY: 14°`, `transformPerspective: 900`, origin on the outer edge) projects the near edge far past the clip of `.scene__inner` (its `overflow-clip-margin` is only 8 px). Measured overhang beyond the clip, top / bottom: **14°: 122 / 111 px at 1920×1080, 64 / 56 at 1280×720, 42 / 31 at 768×1024; capping at 6° still cuts 3–30 px.** So the swing is **scale-compensated**: the start state also sets `scale: k`, with `k = (900 − w · sin 14°) / 900` (`w` = the panel's `offsetWidth`, read when the timeline is built and on rebuild), and the tween ends at `scale: 1`:
```js
const k = (SWING_PERSPECTIVE - el.offsetWidth * Math.sin(SWING_DEG * Math.PI / 180)) / SWING_PERSPECTIVE;
tl.fromTo(el, { rotationY: SWING_DEG, scale: k, transformOrigin: origin, transformPerspective: SWING_PERSPECTIVE },
  { rotationY: 0, scale: 1, duration: timing.inDur * 0.62, ease: IN_EASE }, share(timing, 'in', 0.3));
```
Measured with compensation (k 0.77–0.88): the near edge stays 30–67 px **inside** the clip at every desktop and tablet size; no edge is cut. The swing keeps its 14° turn. The exit (`−8°`) turns the far edge away and needs no compensation. It applies to every `[data-swing]` panel (the insurance panel too; it has room either way). With reduced motion there is no swing.

**Measured** (all 9 categories × every tab; "fixture" = maxed partner cards, §7.7; the fit pager shows 2 per page where 2 fit, else 1):

| viewport | mode | lowest spare | where |
|---|---|---|---|
| 1920×1080 | wide | 146 | Partners column, 2 maxed cards + pager |
| 1536×864 | tabs | 126 | Insurance Overview / Partners with 2 maxed cards |
| 1440×900 | wide | 163 | real cards; 2 maxed cards leave only 3, so the fit pager shows 1 |
| 1366×768 | tabs | 88 | every category (nav column) |
| 1280×720 | tabs | 49 | every category (nav column with 36 px rail rows) |
| 1024×768 | tabs | 95 | Partners with 2 maxed cards |
| 768×1024 | tabs, 1-column rail | 229 | every category |
| 390×844 | sheet | 145 | Overview |
| 360×740 | sheet | 18 | Legal Overview |
| 375×667 | sheet | 53 | Partners, 1 maxed card |
| 360×640 | sheet | 27 | Partners, 1 maxed card |

### 8.4 JS (services-categories.js)
- `select(slug, { flip, open })` renders `.cat-card` into `#cat-sheet`, then creates the card tabs (`createTabs(card, { activeWhen: '(max-width: 759px), (min-width: 760px) and (max-height: 880px), (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1)' })`) and the partner pager (`createPager(list, { mode: 'fit', maxPerPage: css --per-page, render })`). `[data-tab-to="partners"]` selects the Partners tab and focuses its notice (`tabindex="-1"`). On tab-mode change it toggles `.visually-hidden` on the Partners `h4` (8.2).
- **Sheet** (phone only, `matchMedia('(max-width: 759px)')`): a rail click calls `openSheet()`. That adds `.is-open` to `#cat-sheet`, sets `aria-expanded="true"` on the clicked rail button (rail buttons get `aria-expanded="false"` in phone mode, nothing on desktop), makes `.cats__nav` `inert`, focuses `#cat-detail-title` (`tabindex="-1"`, `preventScroll`), and plays `cue('open')`. `closeSheet()` (back button, or Escape while focus is in the sheet) reverses this and returns focus to the rail button. The `cat-announce` live text stays "Showing X".
- Deep link `services.html#legal` on phones: `onDeepLink` → `categories.select(id, { open: true })` before `film.goTo('categories')`, so the visitor lands on the Legal card.
- Leaving phone mode (rotation or resize) closes the sheet and removes `inert`.
- Existing behaviour kept: `history.replaceState` on pick, `cue('switch')` on change, the `svc-flip-in` keyframe on `.cat-card.is-entering` (film mode only), and `data-swing` on `#cat-detail` (`swingPanels()`, now scale-compensated).
- `onPick` no longer calls `bringIntoView` (nothing pans).
- `film.refreshReach()` after each `select()`, tab change, page change, and sheet open/close.

---

## 9. Scene 8 · `inquiry` (gold) · stepper

Overflow before: +26 to +928 at every size except 1920×1080. **Move: stepper** (4 short steps inside the existing 3D panel, `.scene--fill`), with per-step validation and the WhatsApp hand-off at the end.

### 9.1 Steps (field order inside a step follows the visitor's thinking; the hand-off text order in `inquiryText()` does not change)
| step | title (h3, Title Case) | fields |
|---|---|---|
| 1 | What You Need | category (select), city (input + hint "So we can introduce you to someone close to you.") |
| 2 | In a Few Words | description (textarea, `rows=3`, privacy hint), best way to reach you (chips) |
| 3 | Your Details | name, email, phone |
| 4 | Check and Send | short summary (≥ 760 px only), consent checkbox, commission notice, **Send My Inquiry** + hint |

### 9.2 Layout per band
- **Wide / laptop-short:** left 4 `keep-md`: eyebrow, h2, lead, `ol.next-steps__list--compact`. Right 8 `keep-md`: `.inquiry-panel.panel-3d.stepper`, with `.stepper__progress` at the top ("Step 1 of 4 · What You Need", plus a 4-segment bar), the step, and `.stepper__nav` at the bottom (Back left, Next/Send right). The panel takes the full height, so it does not jump between steps. On desktops ≤ 800 px tall the panel padding is `--space-m`.
- **Tablet portrait:** left column on top as a 2-column block (head across, then lead | next steps), panel below. **On steps 2–4 the left "What happens next" list is hidden** (it shows on step 1 and in the success state).
- **Phone:** the head (eyebrow + h2) stays. The lead shows on step 1 only. The left `next-steps` list is hidden under 760 px. **There is no "What happens next" copy inside step 4** (the old `.inq-next`): the success state shows the same three steps after sending, and on ≥ 760 px the left column shows them.
- **Extra-short phone:** the eyebrow ("Send an inquiry") is hidden; the step's `h3` becomes `.visually-hidden` (the visible progress label above it already reads "Step 1 of 4 · What You Need", and the `h3` stays the focus target and the fieldset's name); panel padding `--space-s --space-m`, stepper and step gaps `--space-s`.

### 9.3 Markup
Scene: `<section class="scene scene--fill" id="inquiry" data-step="1" …>`. The left column gets `keep-md` and class `inq-left`, and the lead gets `class="t-lead inq-lead"`. `formMarkup()` becomes:
```html
<form class="form inq-form stepper" id="inquiry-form" novalidate aria-labelledby="inq-title" data-step="1">
  <div class="stepper__progress">
    <p class="stepper__label num" id="inq-progress" aria-live="polite">Step 1 of 4 · What You Need</p>
    <span class="stepper__bar" aria-hidden="true"><span class="stepper__fill"></span></span>
  </div>
  <fieldset class="stepper__step" data-step="1" aria-labelledby="inq-s1-title">
    <h3 class="t-d4 stepper__title" id="inq-s1-title" tabindex="-1">What You Need</h3>
    <div class="inq-grid">${field(category)} ${field(city)}</div>
  </fieldset>
  <fieldset class="stepper__step" data-step="2" aria-labelledby="inq-s2-title" hidden>
    <h3 …id="inq-s2-title">In a Few Words</h3>
    <div class="inq-grid">${field(description, span full)} <fieldset class="form-row inq-grid__full">…contact chips…</fieldset></div>
  </fieldset>
  <fieldset class="stepper__step" data-step="3" aria-labelledby="inq-s3-title" hidden>
    <h3 …>Your Details</h3>
    <div class="inq-grid">${field(name)} ${field(email)} ${field(phone)}</div>
  </fieldset>
  <fieldset class="stepper__step" data-step="4" aria-labelledby="inq-s4-title" hidden>
    <h3 …>Check and Send</h3>
    <dl class="inq-summary hide-sm" id="inq-summary"></dl>       <!-- filled on entering step 4 -->
    <div class="form-row"> …consent checkbox (verbatim)… <p class="error" id="inq-consent-error"></p></div>
    <p class="notice"> …commission notice (verbatim)… </p>
  </fieldset>
  <div class="hp" aria-hidden="true">…honeypot unchanged…</div>
  <div class="stepper__nav">
    <button class="btn btn--ghost" type="button" data-step-back hidden>← Back</button>
    <button class="btn btn--primary" type="submit" data-step-next>Next <span class="btn__arrow" aria-hidden="true">→</span></button>
    <button class="btn btn--primary" type="submit" data-step-send hidden>Send My Inquiry <span class="btn__arrow" aria-hidden="true">→</span></button>
  </div>
  <p class="hint stepper__send-hint" hidden>Opens WhatsApp with your inquiry written. Nothing is sent until you tap send.</p>
</form>
<div class="inq-success" id="inquiry-success" tabindex="-1" hidden></div>
```
Two submit buttons toggled with `hidden` (not one relabelled button), so textfx's letter roll never has to re-wrap a changed label. `.btn--lg` is not used.

**Summary rows and their Edit controls.** `#inq-summary` has **6 rows**: Service, City, Message, Reach by, Name, Contact (email and phone joined with " · "). Each row is `<dt>City</dt><dd>Winnipeg</dd><dd><button type="button" class="inq-summary__edit" data-goto="1" aria-label="Edit city">Edit</button></dd>`.
- **Message is shortened in JS** to its first 60 characters plus "…" (cut at a word boundary), so a 600-character description stays one line. It is never clipped with CSS (SHARED-12); the full text is one "Edit" away.
- The Edit control is **not** a `.btn` (a `.btn` is `--ctl-h`, 44–48 px, and six of them push step 4 over at 1280×720, 1366×768 and 768×1024). It is a text button with `min-height: 24px` (WCAG 2.2 target size, minimum), 15 px label.
- On coarse pointers (touch tablets) the Edit buttons are hidden and the summary is two columns; the visitor uses Back. On phones the whole summary is hidden (`hide-sm`).

### 9.4 CSS
```css
.inquiry-panel.panel-3d { padding: var(--space-l); height: 100%; max-height: 100%; }
.stepper { display: grid; grid-template-rows: auto minmax(0, 1fr) auto auto; gap: var(--space-m); height: 100%; }
.stepper__progress { display: grid; gap: 6px; }
.stepper__label { font: 500 0.75rem/1.3 var(--font-ui); letter-spacing: 0.14em; text-transform: uppercase; }
.stepper__bar { display: block; height: 2px; background: var(--line); }
.stepper__fill { display: block; height: 100%; background: var(--accent); transform-origin: 0 50%;
  transform: scaleX(var(--progress, 0.25)); transition: transform .45s var(--ease); }
.stepper__step { display: grid; align-content: start; gap: var(--space-m); min-height: 0; border: 0; padding: 0; margin: 0; }
.stepper__title:focus { outline: none; }
.stepper__nav { display: flex; justify-content: space-between; gap: var(--space-s); }
.stepper__nav [data-step-next], .stepper__nav [data-step-send] { margin-left: auto; }
.inq-grid .textarea { min-height: clamp(72px, 12svh, 120px); }
.inq-summary { display: grid; grid-template-columns: max-content minmax(0, 1fr) auto; gap: 4px var(--space-m); align-items: baseline; }  /* 16 px via §14 */
.inq-summary dd { margin: 0; }
.inq-summary__edit { min-height: 24px; padding: 0 4px; border: 0; background: none; color: var(--accent);
  font-family: var(--font-ui); font-weight: 500; line-height: 1; text-decoration: underline; }       /* 15 px via §14 */
@media (pointer: coarse) { .inq-summary__edit { display: none; } .inq-summary { grid-template-columns: max-content minmax(0, 1fr); } }
html.film .stepper__step:not([hidden]) { animation: svc-step-in .35s var(--ease) backwards; }
@keyframes svc-step-in { from { opacity: 0; transform: translateX(14px); } }
@media (prefers-reduced-motion: reduce) { .stepper__step, .stepper__fill { animation: none !important; transition: none !important; } }
@media (min-width: 760px) and (max-height: 800px) { .inquiry-panel.panel-3d { padding: var(--space-m); } }
@media (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) {
  .inq-left { display: grid; grid-template-columns: 1fr 1fr; column-gap: var(--gap-col); align-items: start; }
  .inq-left > * { margin: 0; }
  .inq-left > :first-child { grid-column: 1 / -1; margin-bottom: var(--space-s); }
  #inquiry[data-step]:not([data-step="1"]) .inq-left .next-steps__list { display: none; }
}
@media (max-width: 759px) {
  .inquiry-panel.panel-3d { padding: var(--space-m); }
  .inq-grid { grid-template-columns: 1fr; gap: var(--space-s); }
  .stepper__nav .btn { flex: 1 1 auto; }
  .inq-left .next-steps__list { display: none; }
  #inquiry[data-step]:not([data-step="1"]) .inq-lead { display: none; }
}
@media (max-width: 759px) and (max-height: 700px) {
  .inquiry-panel.panel-3d { padding: var(--space-s) var(--space-m); }
  .stepper, .stepper__step { gap: var(--space-s); }
  .inq-left { --stack: var(--space-s); }
  .inq-left .eyebrow { display: none; }
}
```
The step `h3` on extra-short phones gets the `.visually-hidden` class from `services-inquiry.js` (on `matchMedia('(max-width: 759px) and (max-height: 700px)')` change), not inline clip CSS.

**Measured** (steps 1–4, each with and without the real error messages of `validateInquiry`; a realistic summary with a 60-character message and a 32-character email; Edit at 24 px on fine pointers, hidden on coarse):

| viewport | lowest step spare | where |
|---|---|---|
| 1920×1080 | 299 | step 4 + errors |
| 1536×864 | 106 | step 4 + errors |
| 1440×900 | 149 | step 4 + errors |
| 1366×768 | 63 | step 4 + errors |
| 1280×720 | 30 | step 4 + errors |
| 1024×768 | 100 | step 4 + errors |
| 768×1024 | 16 | step 4 + errors (coarse: no Edit) |
| 390×844 | 57 | step 1 + errors |
| 360×740 | 24 | step 1 + errors |
| 375×667 | 31 | step 1 + errors |
| 360×640 | 18 | step 1 + errors |

### 9.5 JS (`services-inquiry.js` on top of `ui-stepper.js`)
- `STEP_FIELDS = { 1: ['category', 'city'], 2: ['description'], 3: ['name', 'email', 'phone'], 4: ['consent'] }`. `validateInquiry(d)` is **unchanged**; the stepper filters its errors to the current step's ids. On the final submit, errors from any step send the visitor to the earliest step that has one.
- **Next** (the form `submit` while `step < 4`, so Enter in a text field advances): validate the step. If there are errors: `showErrors` (existing), focus the first invalid field, `shake()`, `cue('error')`. Otherwise: hide the current fieldset, show the next, **set `data-step` on both the form and `section#inquiry`** (`onStep`), set `--progress` to `step/4`, update `#inq-progress` ("Step 2 of 4 · In a Few Words", aria-live polite), focus the new `.stepper__title` with `preventScroll`. Show Back from step 2. On step 4, hide `[data-step-next]`, show `[data-step-send]` and the send hint.
- **Back:** no validation; same show, mirror and focus logic.
- **Step 4 entry:** fill `#inq-summary` from `readForm()` (6 rows, message shortened as in 9.3). Values are escaped. Edit buttons (`data-goto`) call `goTo(step)` and focus that step's field.
- **Send:** the existing handler: honeypot → silent success; `validateInquiry` over everything; `handoff()`; `window.open`; `showSuccess()`. Unchanged copy and focus. `cue('success')`. The success state keeps its "What happens next" list.
- **Reset** ("Start a New Inquiry"): `form.reset()` → go to step 1 (mirror `data-step="1"`), focus the step 1 title.
- `setCategory(slug)` (from `[data-inquiry-category]` links, deep links and the profile dialog, §7.7) sets the select and **goes to step 1** if the form is past it, so the visitor sees the pre-filled choice.
- The "best way to reach you = email" rule produces its error on the `email` field (step 3). This still works because the contact choice (step 2) comes before step 3.
- **Hooks:** the buttons are `.btn` (magnetic, roll, click sfx). Chips pop by themselves. `film.refreshReach()` after each step change. Hidden fieldsets hold no focusable controls. Snap: Enter and Space on any focused control belong to that control (SHARED-8), so Enter submits the step, never the scene. `data-swing` on the panel (scale-compensated, §8.3) and `data-reveal="fade"` stay on `#inquiry-panel`, never on steps.
- **Deep links:** `#inquiry` → scene. No per-step hash; a refresh restarts at step 1, and the browser keeps field values.
- Flow mode: identical behaviour, no animations (SHARED-3 gives the stepper its height there).

---

## 10. Scene 9 · `close` (ink)

Overflow before: +25 to +572 tall and +7 to +342 wide everywhere except 1920×1080. **Move: split (SHARED-5).** The footer moves to `#credits`, and `.nowrap-md` goes.
```html
<!-- before -->
<h2 id="close-title" class="t-d1 close__title" data-reveal="lines">One Message. <span class="nowrap-md">The Right Person.</span> <span class="nowrap-md">Close to&nbsp;You.</span></h2>
… <div data-footer></div>
<!-- after -->
<h2 id="close-title" class="t-d1 close__title" data-reveal="lines">One Message. The Right Person. Close to&nbsp;You.</h2>
(no footer slot; the outer .stack.stack-xl wrapper goes)
```
- `html.film .close { padding-top: clamp(24px, 9vh, 110px) }` (base.css) becomes `margin-block: auto` (centred in the box).
- Phone: buttons stack (`.row--stack-sm`). Measured spare: 140 at 1280×720, 147 at 360×740, 121 at 360×640.
- `data-dur` 5 → 4.

## 11. Scene 10 · `credits` (ink, new): see SHARED-5. The services footer link "Back to the Finder" stays in `close`.

---

## 12. Compliance copy that must survive verbatim

Insurance (`#ours-insurance`)
- "30 min · Insurance · Licence [licence #]"
- "Our founder is a licensed agent of [insurance company], a separate insurance company. In a 30-minute review she looks at the cover you already have and what your family would need if something happened to you."
- "Opens WhatsApp with your message written. Nothing is sent until you tap send."
- "This is our founder's own business. It is separate from the network of independent partners."

Strategy (`#ours-strategy`, `#ours-strategy-plan`)
- "**Strategy and coaching only.** Not licensed accounting, tax or investment advice." (5a)
- "Offered through [company name]" · "Service: Finance and operations strategy"
- "[Founder] takes [4] new businesses a month so each one gets her full attention. [2] spots open for [month]."
- Lead with "[5] hours a week back"; every "[value]"; the promise "If your plan doesn't give you at least [3] changes you can act on this month, [we keep working with you at no cost / you get a full refund]."
- "Opens WhatsApp. Nothing is sent until you tap send." (5a on every band; 5b on ≥ 760 px)

Outsourcing
- "Cargado Strategies supplies these roles itself, …" (lead) · "Outsourcing · from [$x]/hr" · "[Role n]" / "[what this role takes off your plate]"
- "Provided by Cargado Strategies itself, not by a partner. Nothing is sent until you tap send."

Finder
- Results notice: "**Sorted by distance only.** This list is not a recommendation. Partners are independent businesses, each responsible for their own licence and advice. Cargado Strategies may receive a commission if you become their client. You never pay us. [Wording to be confirmed by counsel]". It is visible in the Results panel on every band, under the list, on every page of the pager, at 16 px (15 px on phones).
- Place hint: "We use your city or area only to sort partners by distance. It isn't stored on this website."
- Map help: "Click your province or territory, or use Tab and Enter. The search box gives the same results."
- All `resultsView` statuses (radius widening, "Showing the nearest across all of Canada", "…is our founder's own service, offered across Canada."), visible in `#finder-status` and announced through `#finder-live`
- Founder block: "Our founder's own business, not a partner listing." · "Prefer to Ask First?" block + "Nothing is sent until you tap send." (each its own slot, never dropped by paging)
- "Partner Spot Available" card (`placeholderCard`) + "no partner listed here yet" + "Become a Partner"
- What happens next: "Now / Within [24h] / Day [3]" lines; ticks "Free", "No obligation"

Profile (dialog)
- "{business} is an independent business, responsible for its own licence and advice. Listed by distance only; a listing is not a recommendation or an endorsement. Cargado Strategies may receive a commission if you become their client. [Wording to be confirmed by counsel]" (first in the body, under the title)
- Facts labels; "Not applicable to this service"

Categories
- "The rail does the disclosure: **Ours** is run by our founder, **Partners** are independent businesses."
- Ownership labels "Ours · from our founder" / "Partners · independent businesses" / "Ours + partners"; rail group labels "Ours" / "Partners"
- `FOUNDER_LINES` (all three, including "Strategy and coaching only, not licensed accounting, tax or investment advice.")
- Detail notice: "Partners are independent businesses, listed by distance only; a listing is not a recommendation. Cargado Strategies may receive a commission if you become their client. [Wording to be confirmed by counsel]"
- Every category description in config.js (the Legal one carries "listed by distance only. A listing is not a recommendation.")

Inquiry
- Consent: "I agree that Cargado Strategies may use these details to answer my inquiry and share them with the partner I am introduced to. See the privacy policy."
- Notice: "Partners are independent businesses. Cargado Strategies may receive a commission if you become a partner's client. You never pay us for an introduction. [Wording to be confirmed by counsel]" (16 px; 15 px on phones; it was 12 px)
- City hint (CR10): "So we can introduce you to someone close to you."
- Description hint: "Short is fine (up to 600 characters). Please leave out account numbers and health details."
- Send hint: "Opens WhatsApp with your inquiry written. Nothing is sent until you tap send."
- Lead "…usually within [24 hours]."; next steps "[24h]", "[3]"; the success state copy; the honeypot.

Close / credits
- "Opens WhatsApp with your message written. Nothing is sent until you tap send."
- Footer notice: "Partners are independent businesses, each responsible for their own licence and advice. Cargado Strategies does not give regulated advice through this website and may receive a commission when a referral becomes a client. [Wording to be confirmed by counsel]"; Facebook (new tab) and WhatsApp links; tagline "Connected by Purpose. United in Service."

**Shortened, moved or added (meaning unchanged; for the compliance diff and counsel):**
1. Strategy: the notice stays in 5a. 5b repeats the CTA and hint on ≥ 760 px only; on phones 5b has no CTA (5a, one gesture back, has the same button and hint).
2. Strategy 5a, phones: the eyebrow drops " · Finance and operations strategy"; the credential "Service: Finance and operations strategy" stays on screen.
3. Strategy 5b, short phones: the list is paged (3 per page at ≤ 760 px tall, 2 per page at ≤ 700 px); every item is reachable with "Next".
4. Categories, wide: the partner notice moves from the bottom of the card to a full-width row directly under the two columns (still inside the card, under the partner list).
5. Categories, tab modes (phone, tablet portrait, desktops ≤ 880 px tall): the full partner notice sits in the Partners tab beside the listings. **New:** the Overview tab carries a short notice under the actions, "Partners are independent businesses, listed by distance only. Cargado Strategies may receive a commission if you become their client. [Wording to be confirmed by counsel]" + "Read the full notice" (opens the Partners tab). Counsel to confirm the short form.
6. Categories, Insurance in tab modes: the founder block moves to its own "Ours" tab (unchanged text).
7. Categories, extra-short phones: the type tags are hidden in the Overview tab (the same types are in the finder's type select and in each partner profile).
8. Finder: "What happens next" becomes a compact strip outside the tab panels: under the map on desktops ≥ 1280 px, under the form at 1024×768, with the Map tab on tablet portrait and extra-short phones, with the Search tab on other phones. The instruction line is hidden only on short phones (< 760 px tall), where the field labels say the same; on extra-short phones the scene head is visually hidden (still read by screen readers) on the Map and Results tabs.
9. Finder results and category partners are paged: the notice stays visible on every page.
10. Finder result rows and category partner cards no longer show the credential line; credential and issuing body stay in the profile dialog ("Licence or credential", "Issued by").
11. Profile dialog: the notice moves to the top of the body; every displayed field is length-capped by a build check (§7.7).
12. Inquiry: "What happens next" no longer appears inside step 4 on phones, nor beside steps 2–4 on tablet portrait; it shows in the success state after sending (and beside the form on ≥ 760 px landscape, and on step 1 in tablet portrait). On extra-short phones the step heading is visually hidden; the visible progress label carries the same words.
13. Footer: in its own scene.
14. Text: every notice, hint and reading line is 16 px from 760 px and 15 px on phones (notices were 12–13 px).

---

## 13. Acceptance for this page

**Prerequisites (before any services work):** SHARED-12 is built (`--states`, `--fixture`, clipped check, text scan) and SHARED-1/2/4 are in base.css.

- `node tools/fit-audit.mjs http://localhost:8000/ services.html --vp=1920x1080,1536x864,1440x900,1366x768,1280x720,1024x768,768x1024,390x844,360x740,375x667,360x640 --states=tools/fit-states/services.mjs --fixture=tools/fit-states/fixtures/partners-max.json` → **0 Y, 0 X, 0 clipped, 0 small-text**, run **twice: in film mode and with `--flow`**. The states module scripts:
  1. finder with Insurance, Legal and Business Strategy, each with "Winnipeg" chosen, each tab active (phone, tablet, 1024), every page of the pager; the same with the fixture (5 maxed partners);
  2. categories with every category selected; in tab modes every tab; the Partners tab with the fixture, every page; on phones the sheet open on each tab;
  3. inquiry at steps 1–4 with every error showing (real messages), on fine and coarse pointers (Edit shown / hidden), with a 600-character description;
  4. 5b on short and extra-short phones, every page;
  5. the profile dialog open on a maxed fixture partner (desktop panel and phone full-screen).
- Every state also leaves ≥ 16 px spare (§0.3). The scratchpad probe `r4svc-rev3/` measures this budget; fit-audit's 0 is the hard gate.
- No element in the page has computed `overflow-y: auto|scroll` (the combo list included), and nothing relies on `overflow: hidden|clip` to fit (no `clip` on `.results__list`, `overflow: visible` on `.dialog`; the description clamp never engages with the caps).
- Text: no reading text under 15 px (phones) or 16 px (≥ 760 px), no label under 15 px, except the SHARED-11 exemptions. The §14 floor block is the last block of services.css.
- Entry swing: during the `#cat-detail` and `#inquiry-panel` entry (film mode), no corner is cut by the `.scene__inner` clip (screenshot at 30 %, 50 % and 70 % of the in-tween at 1280×720 and 1920×1080).
- Tap targets: every control is ≥ 44 px on phones and coarse pointers, including `.link-btn`, `.pager .pager__btn`, "Introduce Me" (`.btn--link`, 44 px) and the sheet back button; ≥ 24 px on fine pointers (Edit, `.link-btn`, 36 px rail rows).
- Tab order: the finder tabs reach the map regions and results in DOM order; no panel is itself a tab stop. Pager and stepper focus as specified. After a phone place search, focus is on "Nearest Partners", not `<body>`. Escape closes the sheet and the dialog. After "Send an Inquiry" in the dialog, focus is on "What You Need" in the inquiry scene and the finder or categories scene is parked.
- Announcements: a search made on the phone Search or Map tab is announced (through `#finder-live`); paging announces "Showing … of …"; a reset is silent.
- Modal: with the dialog open, wheel, trackpad and touch over the dialog or its backdrop do not move the film (film mode) or the document (flow mode).
- Keys: with focus on any tab, pager button, Next/Back, Edit, rail button, "View Profile" or "Introduce Me", Space and Enter activate that control and never move the scene (SHARED-8).
- Reduced motion: every scene still fits 100svh (SHARED-4, including the first scene), and steps, tabs and pager work without animation.

---

## Critique responses

Revision 3 answers the second critique. Each point was checked against the files and re-measured with `r4svc-rev3/` (11 viewports, floor applied without `!important`). The answers to the first critique are folded into the spec above.

1. **Phone floor overridden by services.css: accepted.** Confirmed: services.css loads after base.css and sets `.offer-stack__fix` (:75), `.roles__what` (:93, shorthand), `.result__meta/.result__cred` (:203), `.results__notice` (:210), `.inq-form .notice` (:295, (0,2,0)), `.profile__body` (:327) and `.profile__notice` (:332) smaller; revision 2's own `.next-strip__list > li` did too, and its probe used `!important`. SHARED-11 now has a base.css block plus a **§14 floor block that must stay last in services.css**, with `.inq-form .notice` written out and `.profile__notice`, `.profile__body`, `.results__ask*` added. The probe now applies it as plain CSS after the page CSS; every budget includes it.
2. **Desktop text under 16 px: accepted.** The floor is 16 px from 760 px for reading text (the floor story.md, partners.md and legal.md use), 15 px for labels (buttons, `.btn--sm`, tabs, Edit). Re-budget: the "What happens next" strip left the controls column (under the map at ≥ 1280, its own row at 1024, Map tab on tablet portrait); ≥ 1280 desktops ≤ 880 px tall use columns 2.6 · 4.4 · 5; category tabs run up to `max-height: 880px`; the inquiry panel uses `--space-m` padding at ≤ 800 px tall and tablet portrait hides the left list on steps 2–4. Results: finder 1280×720 shows 2 real slots per page (76 spare) and 1 maxed row (122); 1536×864 Legal with chips is gone (select at ≤ 880); categories 1536×864 126 spare; 1280×720 49. Tablet portrait now shows **2 per page** (real slots 119 spare, maxed rows 24) with a 446×383 map (was 1 per page, 408×350).
3. **Short real phones: accepted.** New extra-short band `(max-width: 759px) and (max-height: 700px)` (SHARED-1): header 48 px, pads 6 / 10, a smaller display ramp, body line-height 1.5; finder strip off the Search tab (to the Map tab) and the head visually hidden on Map/Results; 5b 2 per page; inquiry and insurance tightened (step `h3` visually hidden behind the visible progress label; insurance panel as a ruled section; buttons side by side). 375×667 and 360×640 are in the probe and in the acceptance list; lowest spare 16 (5a at 360×640). 360×740 also re-measured (lowest 18).
4. **Clipped check fails on the Partners `h4`: accepted, both fixes.** The `h4` (and every other heading this spec hides) gets the real `.visually-hidden` class from JS; SHARED-12 also skips 1×1 boxes with `clip-path: inset(50%)` or `clip: rect(0 0 0 0)`. The probe reports no clipped box.
5. **`#finder-status` inside a hidden panel: accepted.** A visually hidden `#finder-live` (`role="status"`) sits under the tablist, outside every panel; the visible status has no role.
6. **Modal does not stop scrolling: accepted.** `ui-dialog.js` calls `film.stop()` / `film.start()` (film.js:690–691), and flow mode gets `html:not(.film):has(dialog[open]) { overflow: hidden }` with `scrollbar-gutter: stable`.
7. **Focus left behind after "Send an Inquiry": accepted.** Close without returning focus, `setCategory`, `goTo('inquiry')`, then focus `#inq-s1-title` with `preventScroll` (§7.7). Confirmed that film.js `updateReach` (:349–350) keys on `document.activeElement`.
8. **Only the description was capped: accepted.** The build check caps every displayed field (§7.7 table) and the fixture maxes every one. Re-measuring with the maxed fixture showed the credential line (40 + 40 characters) alone overflows a single page on phones and at 1280×720, so the credential line leaves result rows and partner cards (it stays in the dialog), and the phone dialog lists facts one per line. Lowest dialog spare: 36 at 360×640.
9. **Pager labels change on a `.btn`: accepted.** Static "Previous" / "Next" labels, the count only in `.pager__status`, and `data-roll="none"` on pager buttons as a guard.
10. **Tap targets: accepted, one part not reproduced.** `.link-btn` is 44 px on phones and coarse pointers; `.pager .pager__btn` (0,2,0) beats `.btn--sm` in any order. "Introduce Me" in the category cards is not a `.btn--sm`: it is `.btn.btn--link` (services-categories.js:61), which base.css:707–708 already makes 44 px; the new card keeps that class, so no extra rule is needed.
11. **Overview notice lost the counsel placeholder: accepted.** `<span class="ph">[Wording to be confirmed by counsel]</span>` is appended (§8.2, §12 item 5).
12. **Flow padding loses to `:first-child`; banner missing: accepted.** SHARED-4 now targets `.scene` and `.scene:first-child` together and adds `--banner-h` to the top padding, so each section's content box equals `--scene-h`.
13. **Fill scenes at the box edge; swing clips: accepted, but the suggested 6° cap is not enough.** Measured overhang at 14°: up to 122 / 111 px; **at 6° it still cuts 3–30 px** (e.g. 16 / 9 at 1366×768). The swing is now scale-compensated (`k = (900 − w·sin14°)/900`), which keeps every edge 30–67 px inside the clip at all desktop and tablet sizes and keeps the 14° turn. The "need 680/679" in the probe is not an overflow: a fill scene is exactly the box by construction (§0.2), and the 1 px is `svh` rounding; the real risk was the transform, now handled.
14. **The gate did not verify the states: accepted.** SHARED-12 makes state scripting (`--states`), fixture injection (`--fixture`, no change to `site/`), the clipped check and a text scan build prerequisites, and §13 runs the audit in film mode and with `--flow`. §0 now states that the probe numbers are the design budget, measured flow-like with reveals at rest, and that fit-audit in both modes is the acceptance result.
