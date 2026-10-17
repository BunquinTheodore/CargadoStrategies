# Round 4 · story.html: one screen per scene

> **Merge amendments (2026-10-17, `shared.md` wins over this file where they differ)**
> - **SHARED-B accepted** (`shared.md` §3, D1). The pan padding is the smaller services value, so the budget is 11–15 px larger than table 0.2 assumes. Nothing gets tighter.
> - **SHARED-C accepted** as `shared.md` §5.4.
>   - The anchor element is `<div class="globe-anchor globe-anchor--credits story-anchor story-anchor--credits" data-globe-anchor aria-hidden="true">`. The shared class carries the size and the phone and flow hiding, so story.css keeps no copy.
>   - `.scene__pan` is written in the markup.
> - **SHARED-D accepted as the canonical API**, extended in `shared.md` §6.1 (`modes`, `swipe`, `panelStop`, `inactive: 'drill'`; `select()` takes a key or an index; `onChange` gets `{ index, key, cause }`). Story's values call is unchanged.
> - **SHARED-E** (the heading fit) stays in story.css.
> - **SHARED-F accepted** as `--fs-note` in base.css plus the floor block in ui.css. The story.css fallback is not needed.
> - **SHARED-G** is accepted (`shared.md` §4.3). **SHARED-H** is accepted (`shared.md` §7.2).
> - **story.js:** delete the local `placeFromRect` and `createPoseFitter`, and import them from `globe-fit.js` (stage 2b copied them unchanged).
> - **Files this page may edit** are in `build-order.md`.

Status: design spec (read-only phase), revision 3, after the second adversarial critique (see "Critique responses" at the end).
**For the merger:** SHARED-D (the `ui-tabs` API) and SHARED-H (keys on a focused tab) **override** the differing versions in services.md SHARED-7/SHARED-8, home.md, partners.md §5 and legal.md §5.2 and engine.md §A6. Those specs were not edited in this phase.
Brief and acceptance test: `PLAN.md` § "Round 4: one screen per section".
Shared tokens and engine behaviour come from `plan/round4/engine.md` (§B2 flow, §C removals, §D tokens). The close/credits split
and the UI components come from `plan/round4/services.md` (SHARED-5, SHARED-7, SHARED-8). This spec reuses those
names. It does not invent parallel ones. Everything marked **SHARED-x** is a proposal for the merger; everything else is page-local.

Scenes after this round (8; was 7):

| # | id | field | data-dur | change | toolkit move |
|---|----|-------|----------|--------|--------------|
| 1 | `top` | ink | 5 | tokens only; cue line removed; draft note at the text floor | fluid scale |
| 2 | `beginning` | bone | 5 | card moves beside the heading under the globe | re-layout |
| 3 | `founder` | gold | 5 | text column split in two; portrait `span-5`, stage sized by height; tablet and phone: portrait beside the title, copy below | re-layout |
| 4 | `logo` | ink | 6 | tokens only; rule before "Mark 11:24" removed | fluid scale |
| 5 | `values` | bone | 6 | larger globe box on big screens, tighter rows, mission rule removed; phone: values become tabs | fluid scale + tabs (phone) |
| 6 | `network` | gold | 5 | tokens only; notice at the text floor | fluid scale |
| 7 | `talk` | ink | **4** (was 5) | footer leaves; the `.stack` wrapper goes | split |
| 8 | `credits` **new, SHARED-5** | ink | 4 | the site footer, one screen, globe in its own anchor above it | split (new scene) |

**Text floor (applies to every scene, SHARED-F):** reading text is never smaller than **15 px on phones (≤ 759 px wide) and 16 px from 760 px**. Only UI labels may be smaller: eyebrows, `.num` / `.list-num__n`, `.story-ref` ("Mark 11:24"), the cue, button labels (`.btn`, 15 px Poppins), and the `©` line.

---

## 0. Measurements

### 0.1 Today (hardened fit-audit, Round 4 box)

Source: `plan/round4/baseline-audit.txt` (`node tools/fit-audit.mjs http://localhost:8000/ story.html`, film mode, activated, Round 4 box). The audit now waits for the film and reaches it at 1920×1080 and 1536×864 too; the old caveat about the film falling back to flow mode at 1920×1080 no longer applies. X overflow is measured on the active scene only, so the reveal transforms no longer produce false X figures.

| scene | 1920×1080 | 1536×864 | 1440×900 | 1366×768 | 1280×720 | 1024×768 | 768×1024 | 390×844 | 360×740 |
|---|---|---|---|---|---|---|---|---|---|
| beginning | 0 | 0 | 0 | 0 | **+24** | 0 | 0 | 0 | **+22** |
| values | 0 | 0 | 0 | 0 | **+8** | 0 | 0 | **+92** | **+196** |
| talk (+ footer) | 0 | **+56** | **+15** | **+129** | **+166** | **+99** | **+78** | **+380** | **+475** |
| top, founder, logo, network | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Cause per row: `beginning` stacks the card under the heading; `values` stacks three ≈ 140 px rows on phones (and a 200 px globe box on desktop); `talk` carries the whole site footer. `founder` fits today only because the bio is a short placeholder (§0.3).

### 0.2 After this spec (measured)

Method: a copy of `site` in scratch with this spec applied exactly (markup, story.css, the engine.md §D2/§D3 tokens and §B2 flow rules, the Round 4 removals, the new `credits` scene with its anchor, the SHARED-F text floor, and the final tab CSS from §6: stacked panels, 3 px selected underline, `font:` shorthand), served on its own port and audited with `tools/fit-audit.mjs` at all nine viewports. Revision 2 copy: `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\r4story2\` (`patch.py`, `add.css`). Revision 3 copy on top of it: `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\r4story3\` (`v\` = the site, `a.json` film, `f.json` flow, `tab.cjs` table, `m.mjs` / `m2.mjs` probes, screenshots `s-*.png`). The phone values row is measured in tabs mode with all three panels stacked in one cell (§6).

Film mode, content height (`.scene__pan` incl. padding) against the box:

| scene | 1920×1080 | 1536×864 | 1440×900 | 1366×768 | 1280×720 | 1024×768 | 768×1024 | 390×844 | 360×740 |
|---|---|---|---|---|---|---|---|---|---|
| box | 1004 | 804 | 837 | 712 | 664 | 712 | 952 | 781 | 684 |
| top | 619 | 587 | 608 | 524 | 492 | 524 | 616 | 578 | 361 |
| beginning | 651 | 562 | 579 | 517 | 524 | 573 | 583 | 579 | 577 |
| founder | 629 | 581 | 603 | 522 | 492 | 522 | 726 | 428 | 426 |
| logo | 732 | 624 | 647 | 563 | 532 | 502 | 476 | 497 | 493 |
| values | 686 | 586 | 605 | 563 | 539 | 603 | 623 | 541 (tabs) | 579 (tabs) |
| network | 599 | 540 | 554 | 509 | 518 | 575 | 683 | 582 | 575 |
| talk (no footer) | 454 | 412 | 421 | 390 | 378 | 404 | 484 | 431 | 418 |
| credits | 614 | 579 | 593 | 544 | 526 | 544 | 745 | 576 | 574 |

- **0 overflow** in Y, X, header overlap and inner scroll for all 8 scenes at all 9 viewports.
- Tightest cells (spare px): values 360×740 (105), beginning 360×740 (107), values 1024×768 (109), network 360×740 (109), credits 360×740 (110). Credits at 1280×720 now has 138 spare (was 161) after the anchor's bottom margin.
- **Flow mode** (`--flow`, engine §B2): 0 overflow on all 8 scenes at all 9 viewports.
- **Values tabs do not move the scene:** with the panels stacked (§6) the scene is 579 px at 360×740 and 541 px at 390×844 whichever tab is selected, and the heading top stays at y 159 / 239. So `watchContentSize()` sees no height change and the film never rebuilds on a tab change.
- **Text floor:** a per-scene scan of computed font sizes at 1366×768, 1024×768, 768×1024, 390×844 and 360×740 finds nothing under 15/16 px except the allowed UI labels (eyebrows, `.list-num__n`, "Mark 11:24", `.btn` labels at 15 px on the 768 px tablet, `©`) and `.visually-hidden` spans.
- **Phone tap targets:** none under 44 px. The value tabs are 66 px tall (two-line labels) and about 119 px wide at 390 px.
- **Visual check (screenshots `s-*.png`):**
  - Founder: at 1366×768 the stage ends at x 556 and the text starts at x 689 (133 px, one grid column; was 230). At 1280×720 the gap is 124 px, at 1920×1080 144 px, at 1024×768 100 px. The plates hug the frame.
  - Founder at 768×1024: portrait 337 × 421 beside the title, copy below at full width; 726 / 952 (was 388, about 560 px empty).
  - Credits: the globe's bottom edge sits 24–32 px above the first footer text (the eyebrows) at every desktop size (was about 13 px); on phones no globe shows.
  - Values on phones: the selected tab carries a 3 px gold underline (`scaleX(1)`) as well as the darker text; the others have none.

Why the split is needed even with the new tokens: `talk` + footer is about 390 + 330 + 32 gap > 712 at 1366×768, and about 1000 px on phones.

### 0.3 Copy budgets (the placeholders will be replaced by real copy; these lengths keep the fit)

| placeholder | budget | why |
|---|---|---|
| founder bio `[One or two sentences …]` | ≤ 260 characters | phone: 6 lines at 16 px in the full-width copy row |
| logo story `[How the logo came about …]` | ≤ 220 characters | centred under the monogram, 3 lines wide / 5 lines phone, at 16/15 px |
| faith line `[Optional … one sentence on faith.]` | ≤ 120 characters | 1–2 lines in the values left column, at 16/15 px |
| signature | an image ≤ `clamp(40px, 7svh, 72px)` tall, or a one-line name | `.story-signoff__sig` |
| founder photo | 4:5 portrait (square crop on phones) | sized by the stage height (§4) |

Anything longer must be shortened by the founder, or that scene re-measured.

---

## 1. SHARED proposals (for the merger)

**SHARED-A · fit-audit hardening.** Done: the audit now waits for `html.film-ready`, reaches the film at 1920×1080 and 1536×864, and measures X on the active scene only. Keep it that way; no further change is needed for story.

**SHARED-B · Endorse engine.md §D2 tokens as they are** (`--u: min(1vw, 1.5svh)`, the fluid `--fs-*` and `--space-*`, `--header-h: clamp(56px, 7svh, 76px)`, `--bottom-h: env(safe-area-inset-bottom, 0px)`, `--scene-pad-top/bottom`, `--media-h`, and the short-screen guard `@media (min-width: 760px) and (max-height: 760px)`). They were verified against story.html at all nine viewports (table 0.2).
- **Conflict to resolve:** services.md SHARED-1 proposes a different unit, `--fu: min(1vw, 1.778svh)`, with other coefficients plus a phone svh block. There must be one unit. Story.css uses only the shared `--fs-*` tokens, never the unit directly, so story is fine with either, as long as the phone `--fs-d2` is ≤ 31 px and the phone `--fs-lead` is ≤ 17 px.
- Delete `html.film .close { padding-top: clamp(24px, 9vh, 110px) }`, as engine.md §D3 says. Story's `talk` relies on that.
- Remove `.lead-rule`'s gold rule (engine.md §C). On story it sits above the mission paragraph (§6).

**SHARED-C · Credits scene (= services.md SHARED-5), with three changes from story:**
1. **Globe by anchor, not by a fixed pose.** Story.js fits every pose from a `[data-globe-anchor]` box, and services' fixed pose `0,0.35,-1,…,0.7` would put the globe behind the footer links (at 1366×768 a ≈ 135 px radius centred near (683, 321), over the Company column at y 290–430; at 390×844 a ≈ 116 px radius behind all three link groups). So the credits scene carries its own anchor box above the footer: `<div class="story-anchor story-anchor--credits" data-globe-anchor aria-hidden="true"></div>`, `width: min(22svh, 200px)`, square, centred, hidden at ≤ 759 px wide (the fitter then scales the globe to 0) and in flow mode. No `data-pose-fixed` attribute and no `createPoseFitter` change. Pages without a fitter (services, home) keep services' `data-pose` **plus** its `data-pose-sm`; they should move the desktop pose clear of their link columns too, or adopt the same anchor.
2. **No lone line.** The footer's `border-top` becomes a line above content on a mostly empty screen, which this round removes:
   ```css
   .scene--credits .site-footer { border-top: 0; padding-top: 0; }
   ```
3. **Phone footer compaction** (base.css §10), needed for 360×740 to keep its margin when the footer notice grows after counsel's wording:
   ```css
   @media (max-width: 759px) {
     .site-footer { row-gap: var(--space-s); }
     .site-footer__brand { grid-template-columns: auto 1fr; align-items: center; column-gap: 10px; }
     .site-footer__brand .monogram { width: 32px; height: 32px; grid-row: span 2; }
     .site-footer__col--contact .site-footer__links { display: flex; flex-wrap: wrap; column-gap: var(--space-m); }
   }
   ```
   This matches services.md SHARED-5 "Phone: brand row …", so the two can merge into one rule set.

**SHARED-D · `ui-tabs.js`: the canonical API (overrides services.md SHARED-7, home.md, partners.md §5 and legal.md §5.2 for the merger).** The specs drifted: home.md calls an `onModeChange?.()` *method* and puts a static `hidden` on `.tabs__list`; partners.md uses a `data-tabs-list-role="none"` attribute and a setter that writes `''`; legal.md passes `film`, adds a `drill` mode and also writes `''`; story's earlier draft used `onMode`. There is one module and one signature:

```js
// assets/js/ui-tabs.js
export function createTabs(root /* .tabs[data-tabs] */, {
  activeWhen,              // media query string; tabs mode while it matches (story: '(max-width: 759px)')
  label,                   // tablist accessible name; defaults to root.dataset.tabsLabel
  initial = 0,             // index selected when tabs mode starts
  fixedHeight = false,     // "fixed-height panels": stack every panel in one grid cell (below)
  film,                    // optional film handle, passed on to setTabStop's parking check
  inactive = 'all',        // legal.md only: 'drill'. Every other page: 'all'.
  onChange,                // ({ index, id, cause }) after a selection; cause: 'pointer'|'key'|'arrow'|'deeplink'|'mode'
  onModeChange,            // ({ tabbed }) after every mode switch, INCLUDING the first activation at init
} = {}) // returns { select(index, { cause }), get current(), get tabbed() }  (legal's drill mode adds open/close)

export function setTabStop(el, value /* '0' | '-1' */, film) { … }   // below
export function clearTabStop(el) { … }                             // below
```
- **Callback:** `onModeChange` is an option, never a method. It fires synchronously inside `createTabs` for the initial mode too, so a page that calls `createTabs` before `boot()` (story §6, home.md) has its mode in place before the film's first measurement. Callers run `film?.refreshReach?.()` there (services SHARED-8).
- **Mode class:** `ui-tabs` sets `.is-tabbed` on the root while tabs mode is on and removes it otherwise. CSS shows the tab row only under `.is-tabbed`, so without JS (or before init) no dead buttons render. No static `hidden` on `.tabs__list` (home.md); the `.is-tabbed` CSS does that job.
- **Tablist name:** `label` (default: the root's `data-tabs-label`) goes on `.tabs__list` as `aria-label` only while it has `role="tablist"`, and is removed otherwise (a plain `div` must not be named).
- **List roles:** automatic, no attribute. If the panels' common parent has `role="list"` and the panels `role="listitem"`, tabs mode swaps them to `role="none"` / `role="tabpanel"`, and leaving tabs mode restores `list` / `listitem`. Panels must be `div`s, because `role="tabpanel"` is not allowed on `<li>`. Pages with `ol`/`li` panels (partners.md) change them to `div role="list"` / `div role="listitem"`, as story does (§6). This replaces partners' `data-tabs-list-role`.
- **Fixed-height panels (`fixedHeight: true`).** A tab change must never change the scene's height. `film.js` `watchContentSize()` observes every scene's `.scene__pan` height and rebuilds the whole film on any change, and `.scene__pan` is centred with `margin: auto`. So a panel swap that changes the height moves the heading and rebuilds the film (measured on story at 360×740 with `hidden` panels: 579 / 554 / 555 px, a 12 px heading jump per tab). With `fixedHeight`:
  - `ui-tabs` adds `.tabs--fixed` to the root in tabs mode. It never sets `hidden` on a panel. It gives the selected panel `.is-current` and puts `inert` on every other panel. Leaving tabs mode removes `.tabs--fixed`, `.is-current` and `inert`.
  - Shared CSS (base.css, next to services' `.tabs*` rules) stacks the panels, so their parent always has the tallest panel's height:
    ```css
    .tabs--fixed.is-tabbed [data-tabs-panels] { display: grid; }
    .tabs--fixed.is-tabbed .tabs__panel { grid-area: 1 / 1; }
    .tabs--fixed.is-tabbed .tabs__panel:not(.is-current) { visibility: hidden; }  /* out of the a11y tree and the Tab order; inert also blocks pointer and find-in-page */
    ```
    The panels' parent carries `data-tabs-panels`. In this mode an unselected panel is never `display: none` or `hidden`, and no reveal may write `visibility` on a panel (GSAP `autoAlpha` would undo the hiding; no reveal does today).
  - Services, home and partners hit the same rebuild with their phone tabs. They should pass `fixedHeight: true` unless their panels already sit in a fixed-height box (legal's page window, services' `.scene--fill` regions).
- **Tab stops:** the selected tab gets `'0'` and the others `'-1'` (roving). The selected panel gets `'0'` (a `div` with no focusable content) and the others `'-1'`. Every write goes through `setTabStop`, every removal through `clearTabStop`.
- **Parking-aware helpers.** `film.js` parks a far scene's controls by moving their `tabindex` into `data-film-tab` (`''` = "had no tabindex") and restores it on unpark. `parkControls()` skips elements whose `tabIndex < 0`, so an unselected tab (−1) or a desktop-mode panel `div` is never parked, and a check on the element alone misses them (legal.md S4 is right about this). So the helper decides by the **scene**, and always writes an explicit value:
  ```js
  /** Set an element's tab stop ('0' or '-1'), respecting the film's parking of its scene. */
  export function setTabStop(el, value, film) {
    const scene = el.closest('.scene');
    const parked = film?.isParked ? film.isParked(scene)               // engine API proposed in legal.md §5.2 / S4
                 : !!scene?.querySelector('[data-film-tab]');       // fallback: the scene has parked controls
    if (parked) { el.setAttribute('data-film-tab', value); el.setAttribute('tabindex', '-1'); }
    else { el.removeAttribute('data-film-tab'); el.setAttribute('tabindex', value); }
  }
  /** Drop an element's tab stop entirely, parked or not, so unparking cannot bring a stale one back. */
  export function clearTabStop(el) {
    el.removeAttribute('tabindex');
    el.removeAttribute('data-film-tab');
  }
  ```
  - `'0'`, never `''`: unparking `''` means "remove tabindex", which drops a panel `div`'s tab stop. partners.md §5.1 and legal.md §5.2 write `''` and change to `'0'`. For a `button` the two are equivalent, so legal loses nothing.
  - `clearTabStop` runs on every tab and panel when tabs mode ends. Without it: phone, selected panel `tabindex="0"` → the scene goes far and the film parks it (`data-film-tab="0"`, `tabindex="-1"`) → the viewport widens past 760 px and `ui-tabs` removes `tabindex` → `data-film-tab` stays → on unpark the plain desktop item gets `tabindex="0"`, a useless tab stop.
  - After every mode change the caller runs `film.refreshReach()` (in `onModeChange`), so controls are re-parked or un-parked to match the scene's reach.
- **Keyboard (APG tabs, automatic activation):** ←/→ move and select (wrapping), Home/End go to the first/last tab, each with `preventDefault()`. Space and Enter on a tab select it (`cause: 'key'`). Focus stays on the tab. `ui-tabs` does not handle PageUp/PageDown; they reach snap (SHARED-H).

**SHARED-H · Keys on a focused tab (amends engine.md §A6; agrees with services.md SHARED-8).** Today §A6 ignores **every** key while focus is on `[role=tab]` or `[role=tablist]`, while services SHARED-8 lets PageUp/PageDown through. One rule for all pages:
- In §A6's "owns the key" list, take `tablist` and `tab` out of the role list and add a row: *`[role=tab]` or inside `[role=tablist]`: owns ←/→/↑/↓, Home, End, Space and Enter.* PageUp, PageDown (and Shift+Space is not relevant, since Space is owned) pass through to `step(±1)`.
- So on a phone, with focus on a value tab: arrows and Home/End change the tab, Space/Enter select it, **PageDown/PageUp change scene**. With focus on the panel (`tabindex="0"`, no tab role) every snap key works as usual.
- The merger writes the same row into engine.md §A6; this spec could not edit engine.md in the design phase.

**SHARED-E · Heading fit pattern.**
- `story.css` sizes headings with a container query: `.story-fit-box` / `.story-fit` / `--fit-em`. The heading font-size is `min(tier size, 100cqi / longest-phrase-em)`, and the sense units (`.story-phrase`) never break inside.
- This is why story's headings never overflow X at any width. Other pages could adopt it as `.fit-box` / `.fit` in base.css. Optional, not needed for Round 4.

**SHARED-F · Text floor token (base.css).** Add one token and use it for the shared small-text components:
```css
:root { --fs-note: 1rem; }                                   /* 16 px from 760 px */
@media (max-width: 759px) { :root { --fs-note: 0.9375rem; } } /* 15 px on phones */
.notice, .hint, .site-footer, .site-footer__notice { font-size: var(--fs-note); }
/* .site-footer__copy keeps var(--fs-xs) (© is a UI label); footer eyebrows keep theirs */
```
`.site-footer` covers the footer links and the tagline. Story's own small text uses the token too (each scene below). Measured on story only; other pages must re-run their audit with it. **Fallback if the merger declines:** story.css scopes the same rules as `.scene .notice, .scene .hint, .scene--credits .site-footer, .scene--credits .site-footer__notice { font-size: … }` with literal 1rem / 0.9375rem.

**SHARED-G · No-JS flow mode (engine.md §B2).** Without JS, `html` has neither `.js` nor `.film`, so §B2 gives every scene `height: 100svh` with a clipping absolute `.scene__inner`. Content that only fits because JS pages it (story's values tabs, services' steppers) is then cut, including compliance text. Add:
```css
html:not(.js) .scene { height: auto; min-height: 100svh; }
html:not(.js) .scene__inner { position: relative; top: auto; bottom: auto;
  padding-top: var(--scene-top); container-type: normal; overflow: visible; }
```
(The `.scene__inner` half is required: with an absolute inner, an auto-height scene collapses to 0.) No-JS is the one mode where a scene may be taller than the screen, like the < 560 px fallback; document it in ENGINE.md.

---

## 2. Scene 1 · `top` (ink): fluid scale

- **Overflow now:** none.
- **Move:** fluid scale only. After: 361–619 px in a box of 684–1004 px.
- **All bands:** layout unchanged (copy `span-8` | globe anchor `span-4`). `t-hero` follows `--fs-hero`. `#top-title` keeps `--fit-em: 8.6`.
- **Phone:** unchanged (the anchor goes on top at 22svh, and is hidden at ≤ 740 px tall).
- **Markup:** remove the decorative line in the cue (Round 4 removal):
  ```html
  <!-- before -->
  <p class="story-cue ui" aria-hidden="true"><span class="story-cue__line"></span>Scroll to Read</p>
  <!-- after -->
  <p class="story-cue ui" aria-hidden="true">Scroll to Read</p>
  ```
- **CSS:**
  - Delete `.story-cue__line { … }`.
  - In `.story-cue`, drop `gap: 12px`, and change `margin-top: var(--space-l)` → `margin-top: var(--space-m)`.
  - Text floor: `.story-draft { font-size: var(--fs-note); }` (was `t-xs`, 12 px). The cue stays a small UI label.
- **JS:** `heroTweens` keeps fading `.story-cue` (still present).
- **Compliance copy:** `[Draft story. The founder confirms every word before publication.]` (verbatim, `.ph`).

## 3. Scene 2 · `beginning` (bone): re-layout

**Overflow now:** +24 (1280×720), +22 (360×740). The cause is the stack: heading block (≈ 400 px), then the card centred *below* it (≈ 230 px), plus a globe column.

**Move:** re-layout into two columns. The card moves to the right, under a smaller globe box.

| band | layout |
|---|---|
| wide ≥ 1280 and h ≥ 720 | `grid` 12 columns, `align-center`. Left `span-7`: eyebrow, lead, h2 (`t-d1` via `.story-fit`, `--fit-em 11.7` → 3 lines), rule. Right `span-5` `.story-idea__aside`: a flex column, centred vertically. Globe anchor on top, right-aligned, `width: min(100%, 28svh)`, square. Below it, the card at full aside width. |
| laptop-short (1024–1440 wide, 640–800 tall) | the same. `keep-md` keeps the two columns at 1024×768. The heading drops to ≈ 47 px through `.story-fit`. Measured 517–573 / 664–712. |
| tablet portrait 760–1099, aspect < 1 | stacked: `md-span-12` on both columns. The anchor is hidden (the card takes the width, `max-width: 60ch`). |
| phone ≤ 759 | stacked: eyebrow, lead, h2 (`--fs-d1`, wraps between `.story-sub` units), rule, card. The anchor is hidden (as today). Measured 577 / 684 at 360×740. |

Card type: `.story-idea__body` → `font-size: var(--fs-lead)` (unchanged token, now fluid). Card padding is `.panel-3d` `var(--space-l)` / phone `var(--space-m)` (fluid via tokens).

Markup, before:
```html
<div class="grid story-idea__grid">
  <div class="span-8 stack stack-l story-idea__quote story-fit-box"> …eyebrow, lead, h2, rule… </div>
  <div class="span-6 start-3 panel-3d story-idea__card" data-reveal="fade" data-cursor-label="The Idea"> … </div>
  <div class="span-4 start-9 story-anchor story-anchor--idea" data-globe-anchor aria-hidden="true"></div>
</div>
```
After:
```html
<div class="grid align-center story-idea__grid">
  <div class="span-7 md-span-12 keep-md stack stack-l story-idea__quote story-fit-box"> …unchanged… </div>
  <div class="span-5 md-span-12 keep-md story-idea__aside">
    <div class="story-anchor story-anchor--idea" data-globe-anchor aria-hidden="true"></div>
    <div class="panel-3d story-idea__card" data-reveal="fade" data-cursor-label="The Idea"> …unchanged… </div>
  </div>
</div>
```

CSS (story.css §2, replacing the `.story-idea__quote` / `.story-idea__card` grid-row rules and `.story-anchor--idea`):
```css
.story-idea__aside { display: flex; flex-direction: column; justify-content: center; gap: var(--space-l); }
.story-anchor--idea { align-self: flex-end; width: min(100%, 28svh); aspect-ratio: 1; }
.story-idea__card { display: grid; gap: var(--space-s); }            /* grid-row rule deleted */
@media (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) {
  .story-anchor--idea { display: none; }
  .story-idea__card { max-width: 60ch; }
}
/* phone: .story-anchor--idea stays display:none (existing rule); delete `.story-idea__quote, .story-idea__card { grid-row: auto }` */
```

Notes:
- `.story-rule` (the 120 px line *under* the heading) is not a "line before text", so it stays.
- The `ideaTweens` scaleX draw stays.
- **JS:** none new. The pose fitter finds the anchor by `[data-globe-anchor]` inside the scene, so the moved box works as it is.
- **Hooks:** `data-reveal="fade"` on the card, `.panel-3d` tilt + `data-depth` children, and `data-cursor-label` are all unchanged. The `CARD_SOUND` hover tick still matches `.story-idea__card`.
- **Compliance copy:** "Cargado Strategies began with a simple idea.", the h2 "People Should Not Have to Search in Five Places to Find Help They Can Trust.", and the card text with `[Founder name]` (verbatim).

## 4. Scene 3 · `founder` (gold): re-layout

- **Overflow now:** none, but it will overflow at 360×740 once the real bio replaces the placeholder (§0.3).
- **Move:** re-layout. The text block is split into a head (eyebrow + title) and a copy (bio + sign-off). The portrait is sized by height on its **stage**, so the stacked plates (`inset: 0` on `.story-portrait__stage`) keep hugging the frame. The portrait column is `span-5` and the stage sits at its inner (right) edge, so only one grid column separates the portrait from the text.

| band | layout |
|---|---|
| wide / laptop-short | portrait `span-5`, rows 1–2, `justify-items: end`. Head `span-6 start-7`, row 1, `align-self: end`. Copy `span-6 start-7`, row 2, `align-self: start`. Stage `width: min(100%, calc(min(56svh, 520px) * 0.8))`, frame 4:5 at full stage width. `keep-md` keeps it at 1024×768. Stage-to-text gap: 144 px (1920×1080), 133 (1366×768), 124 (1280×720), 100 (1024×768); the back plate's 24 px offset leaves 86–134 px of clear space. Measured 629 / 1004 (1920×1080), 522 / 712 (1366×768), 492 / 664 (1280×720), 522 / 712 (1024×768). |
| tablet portrait (760–1099 wide, aspect ≤ 1) | the phone arrangement at tablet scale: two equal columns, `align-items: end`. Portrait (4:5, stage `min(100%, calc(44svh * 0.8))`, left-aligned) in column 1, head in column 2 on the same row, copy across both columns below, `max-width: 40em`. At 768×1024: portrait 337 × 421, scene 726 / 952 (was 388, with about 560 px empty). |
| phone | 2-column grid `5fr 7fr`, `align-items: end`. Portrait (square frame, stage at full column width) in column 1, head in column 2 (same row), copy across both columns below. Plates offset 6/12 px. Measured 426 / 684 at 360×740. |

Why `span-5` and not head/copy at `span-7 start-6`: both close the gap by one column, but `span-7` would stretch the bio to about 80 characters a line at 1366 px. With `span-5` the text column keeps its 6-column measure.

Markup, before:
```html
<div class="grid align-center">
  <figure class="span-4 story-portrait"> … </figure>
  <div class="span-6 start-7 stack stack-l">
    <p class="eyebrow" data-reveal="fade">The Founder</p>
    <h2 id="founder-title" data-reveal="lines">In Her Own Words.</h2>
    <p class="t-lead" data-reveal="fade">…</p>
    <div class="story-signoff" data-reveal="fade">…</div>
  </div>
</div>
```
After:
```html
<div class="grid align-center story-founder__grid">
  <figure class="span-5 keep-md story-portrait"> …unchanged… </figure>                  <!-- span-4 → span-5 -->
  <div class="span-6 start-7 keep-md stack story-founder__head">
    <p class="eyebrow" data-reveal="fade">The Founder</p>
    <h2 id="founder-title" data-reveal="lines">In Her Own Words.</h2>
  </div>
  <div class="span-6 start-7 keep-md stack stack-l story-founder__copy">
    <p class="t-lead" data-reveal="fade">…unchanged…</p>
    <div class="story-signoff" data-reveal="fade">
      <p class="story-signoff__sig"><span class="ph">[Signature]</span></p>
      <p class="ui story-signoff__role"><span class="ph">[Founder name]</span> · Founder, Cargado Strategies</p>   <!-- t-small → story-signoff__role -->
    </div>
  </div>
</div>
```

CSS (story.css §3):
```css
.story-founder__grid { row-gap: var(--space-l); }
.story-portrait { grid-row: 1 / span 2; justify-items: end; }
.story-portrait__stage { width: min(100%, calc(min(56svh, 520px) * 0.8)); }   /* size the stage, so the plates follow */
.story-portrait__frame { width: 100%; max-height: none; }                     /* was max-height: 62svh, which broke 4:5 */
.story-founder__head { grid-row: 1; align-self: end; }
.story-founder__copy { grid-row: 2; align-self: start; }
.story-signoff__sig { font-size: var(--fs-d3); }                               /* unchanged token, now fluid */
.story-signoff__role, .story-portrait__caption { font-size: var(--fs-note); } /* text floor (were 14 / 12 px) */
@media (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) {   /* tablet portrait */
  .story-founder__grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: var(--space-l); align-items: end; }
  .story-founder__grid > .story-portrait { grid-column: 1; grid-row: 1; justify-items: start; }
  .story-portrait__stage { width: min(100%, calc(44svh * 0.8)); }
  .story-founder__grid > .story-founder__head { grid-column: 2; grid-row: 1; }
  .story-founder__grid > .story-founder__copy { grid-column: 1 / -1; grid-row: 2; max-width: 40em; }
}
@media (max-width: 759px) {
  .story-founder__grid { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); column-gap: var(--space-m); row-gap: var(--space-m); align-items: end; }
  .story-founder__grid > .story-portrait { grid-column: 1; grid-row: 1; width: 100%; justify-items: stretch; }
  .story-portrait__stage { width: 100%; }
  .story-founder__grid > .story-founder__head { grid-column: 2; grid-row: 1; }
  .story-founder__grid > .story-founder__copy { grid-column: 1 / -1; grid-row: 2; }
  .story-portrait__plate--mid { transform: translate3d(6px, 6px, 0); }
  .story-portrait__plate--back { transform: translate3d(12px, 12px, 0); }
}
/* delete: phone `.story-portrait { width: min(52vw, 210px); }` and the phone 8/16 px plate offsets */
```
The caption keeps `class="t-xs story-portrait__caption"` in markup; the rule above overrides the size.

- **JS:** none. `founderTweens` targets `.story-portrait__frame`, `.story-portrait__caption` and the plates, all unchanged. The portrait anchor stays inside the frame. `CARD_SOUND` still matches `.story-portrait__stage`.
- **Compliance copy:** `[Founder photo]`, `[One or two sentences about the founder's background and what led her here.]`, `[Signature]`, `[Founder name] · Founder, Cargado Strategies` (verbatim).

## 5. Scene 4 · `logo` (ink): fluid scale

- **Overflow now:** none.
- **Move:** fluid scale only. Measured 476–732 px.
- **All bands:** layout unchanged (W line | monogram | C line; phone: one column). `--mono: min(54svh, 36vw, 560px)` (tablet `min(46svh, 40vw, 440px)`, phone `min(72vw, 40svh)`) stays. It is already height-aware.
- **Markup:** remove the decorative rule before the reference (Round 4 removal):
  ```html
  <!-- before -->
  <p class="story-ref ui"><span class="story-ref__rule" aria-hidden="true"></span>Mark 11:24</p>
  <!-- after -->
  <p class="story-ref ui">Mark 11:24</p>
  ```
- **CSS:**
  - Delete `.story-ref__rule`, and drop `gap: 10px` and `display: inline-flex` from `.story-ref`.
  - Text floor: `.story-logo__notes .t-small { font-size: var(--fs-note); }` (the logo-story placeholder, was 14 px). "Mark 11:24" stays a small UI label.
- **Short-screen guard:** inside `@media (min-width: 760px) and (max-height: 700px)`, set `.story-logo { --mono: min(48svh, 34vw, 560px); }` as margin for the real logo-story copy.
- **JS:** `logoTweens` and `monogramDepth` are unchanged. The `pop` SFX at the lock is unchanged.
- **Compliance copy:** "W Stands for Wealth.", "C Stands for Cargado.", `[How the logo came about, in the founder's words.]`, and **"Mark 11:24" as a reference only: never quote the verse** (CR08, CR15).

## 6. Scene 5 · `values` (bone): fluid scale + phone tabs

**Overflow now:** +8 (1280×720), +92 (390×844), +196 (360×740).
- **Desktop cause:** the left column stacks a 200 px globe box and a ruled mission paragraph under the heading.
- **Phone cause:** three value rows of about 140 px each, under a 380 px heading block.

| band | layout and move |
|---|---|
| wide / laptop-short | unchanged split (left `span-5`, list `span-6 start-7`), plus `keep-md`. Globe box `width: min(220px, 50%, 20svh)` (≈ 216 px at 1920×1080, 154 px at 1366×768). The mission paragraph loses its `.lead-rule` gold rule. List rows `padding-block: var(--space-m)` (fluid). `h3` stays `--fs-d3`. Measured 539–686 / 664–1004. |
| tablet portrait | stacked (623 / 952). |
| phone | **tabs**: a segmented tab row "01 Integrity · 02 Service · 03 Responsible Growth" above **one** value panel. In tabs mode the panel's number and `h3` are not shown visually (the tab already says them; the `h3` stays for screen readers, hidden by CSS). The three panels are stacked in one grid cell (`fixedHeight`, SHARED-D), so the list is always as tall as the tallest panel and a tab change moves nothing. Integrity is selected by default, so the commission disclosure is what shows first. Measured 579 / 684 at 360×740 and 541 / 781 at 390×844, the same for all three tabs. |

Showing all three values on the phone would need ≈ 790 px (box 684–781), and the copy cannot be shortened because Integrity carries the commission disclosure. A split scene would leave "Mission" with no list. Tabs keep it to one screen and lose no words.

Markup, before:
```html
<p class="lead-rule" data-reveal="fade">Our mission is …</p>
<p class="t-xs muted" data-reveal="fade"><span class="ph">[Optional, in the founder's words: one sentence on faith.]</span></p>
…
<ol class="span-6 start-7 list-rule list-num story-values__list" data-reveal="stagger">
  <li class="story-value" data-tilt data-cursor-label="Value 01"> … <h3>Integrity</h3> … </li>
  …
</ol>
```
After:
```html
<p data-reveal="fade">Our mission is …unchanged…</p>                                   <!-- .lead-rule removed (engine §C) -->
<p class="muted story-values__faith" data-reveal="fade"><span class="ph">[Optional, in the founder's words: one sentence on faith.]</span></p>
…
<div class="span-6 start-7 keep-md tabs story-values__tabs" data-tabs="(max-width: 759px)" data-tabs-label="Our Values">
  <div class="tabs__list story-values__tablist">
    <button class="tabs__tab" type="button" id="value-tab-1" aria-controls="value-1"><span class="num" aria-hidden="true">01</span> Integrity</button>
    <button class="tabs__tab" type="button" id="value-tab-2" aria-controls="value-2"><span class="num" aria-hidden="true">02</span> Service</button>
    <button class="tabs__tab" type="button" id="value-tab-3" aria-controls="value-3"><span class="num" aria-hidden="true">03</span> Responsible Growth</button>
  </div>
  <div class="list-rule list-num story-values__list" role="list" data-tabs-panels data-reveal="stagger">
    <div class="story-value tabs__panel" role="listitem" id="value-1" data-tilt data-cursor-label="Value 01"> …children unchanged… </div>
    <div class="story-value tabs__panel" role="listitem" id="value-2" data-tilt data-cursor-label="Value 02"> …children unchanged… </div>
    <div class="story-value tabs__panel" role="listitem" id="value-3" data-tilt data-cursor-label="Value 03"> …children unchanged… </div>
  </div>
</div>
```
- `ol`/`li` become `div role="list"` / `div role="listitem"` because `role="tabpanel"` is not allowed on `<li>` (and a `role="none"` list owning tab panels does not conform). `ui-tabs` swaps the roles per mode (SHARED-D). The tablist has no static `aria-label`; `ui-tabs` adds it from `data-tabs-label` only in tabs mode. `data-tabs-panels` marks the panels' parent for the fixed-height stacking.
- base.css's `.list-rule > li` / `.list-num > li` rules no longer match `div` items, so story.css carries the equivalent rules (below).
- `valuesTweens` tweens `sceneEl.querySelector('.story-values__list')` as a whole, and the `stagger` reveal in `film-reveals.js` uses `el.children`. Neither depends on `li`, so both keep working on the `div` items unchanged.

CSS (story.css §5; every `.story-values__list > li` selector becomes `.story-values__list > .story-value`):
```css
.story-anchor--values { width: min(220px, 50%, 20svh); aspect-ratio: 1; }
.story-values__list > .story-value {                       /* replaces base .list-rule > li / .list-num > li for div items */
  display: grid; grid-template-columns: 3.5rem 1fr auto; gap: var(--space-m); align-items: baseline;
  padding-block: var(--space-m); border-top: 1px solid var(--line);
}
.story-values__list > .story-value:last-child { border-bottom: 1px solid var(--line); }
.story-values__faith { font-size: var(--fs-note); }        /* text floor (was t-xs, 12 px) */
.story-values__tablist { display: none; }                  /* shown only while ui-tabs is active */
@media (max-width: 759px) {
  .story-values__list h3 { font-size: var(--fs-d4); }                                          /* existing */
  .story-values__list > .story-value { grid-template-columns: 2.25rem 1fr; gap: var(--space-s); } /* existing */
  .story-values .story-fit-box { --stack: var(--space-m); }
}
/* tabs mode: .is-tabbed and .tabs--fixed are set by ui-tabs (SHARED-D), so no-JS never shows the tab row.
   The fixed-height stacking itself is the shared rule set in SHARED-D (base.css). If the merger declines
   the shared rules, story.css carries these three lines instead:
   .story-values__tabs.is-tabbed .story-values__list { display: grid; }
   .story-values__tabs.is-tabbed .story-value { grid-area: 1 / 1; }
   .story-values__tabs.is-tabbed .story-value:not(.is-current) { visibility: hidden; }            */
.story-values__tabs.is-tabbed .story-values__tablist {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: var(--space-s); border-bottom: 1px solid var(--line);
}
.story-values__tabs.is-tabbed .tabs__tab {
  position: relative; display: grid; align-content: center; gap: 2px;
  min-height: 52px; padding: 6px 4px 8px; background: none; border: 0;
  color: var(--fg-muted); font: 500 var(--fs-note)/1.2 var(--font-ui); text-align: left;   /* 15 px, was 13 */
}
.story-values__tabs.is-tabbed .tabs__tab .num { color: var(--accent); font-size: var(--fs-xs); letter-spacing: 0.1em; }
.story-values__tabs.is-tabbed .tabs__tab[aria-selected="true"] { color: var(--fg); }
.story-values__tabs.is-tabbed .tabs__tab::after {          /* selected marker: a 3 px gold underline, so selection is not shown by colour alone */
  content: ""; position: absolute; left: 0; right: 8px; bottom: -1px; height: 3px;
  background: var(--accent); transform: scaleX(0); transform-origin: 0 50%; transition: transform 0.3s var(--ease);
}
.story-values__tabs.is-tabbed .tabs__tab[aria-selected="true"]::after { transform: scaleX(1); }
.story-values__tabs.is-tabbed .story-value { grid-template-columns: 1fr; border-top: 0; border-bottom: 0; }
.story-values__tabs.is-tabbed .list-num__n { display: none; }                 /* the tab already shows the number */
.story-values__tabs.is-tabbed .story-value h3 {            /* visually hidden in CSS, not JS: no timing dependency */
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.story-values__tabs.is-tabbed .story-value.is-current > .stack { animation: value-in 0.32s var(--ease) both; }  /* opacity only */
@keyframes value-in { from { opacity: 0; } }
```
(Tabs mode only ever runs at ≤ 759 px, so the `.is-tabbed` rules need no media query. Measured in the r4story3 copy: the selected tab's underline is `scaleX(1)`, 3 px, the others `scaleX(0)`.)

JS (story.js, new section "4 · values tabs"). It runs **before** `boot()`, so `.is-tabbed`, `.tabs--fixed` and the hidden `h3` are in place before the film's first `buildSliced()` measurement. The film and sfx handles do not exist yet, so the callbacks read them late:
```js
import { createTabs } from './ui-tabs.js';

/* ---------- 4 · values tabs (phone) ---------- */
let film = null;
let sfx = null;
function initValueTabs() {
  const root = document.querySelector('.story-values__tabs');
  if (!root) return;
  createTabs(root, {
    activeWhen: root.dataset.tabs,       // '(max-width: 759px)'
    initial: 0,                          // Integrity: the commission line shows first
    fixedHeight: true,                   // panels stacked: a tab change never resizes the scene (SHARED-D)
    get film() { return film; },         // for setTabStop's parking check once the film exists
    onChange: ({ cause }) => { if (cause === 'arrow' || cause === 'key') sfx?.play('tick'); },
    onModeChange: () => film?.refreshReach?.(),   // fires at init too; film is still null then, and the first build parks correctly
  });
}

/* ---------- boot ---------- */
initValueTabs();
({ film, sfx } = boot());
film.on('build', createPoseFitter());
// …rest unchanged
```
(`label` is omitted because it defaults to `data-tabs-label="Our Values"`. If `ui-tabs` reads `film` once instead of through the getter, pass nothing and let `setTabStop` use its scene fallback; the result is the same for story, where no tab is selected while the values scene is parked.)

`ui-tabs` behaviour required here (the SHARED-D API, APG tabs, automatic activation):
- **Tabs mode (≤ 759 px):**
  - Root gets `.is-tabbed` and `.tabs--fixed`. `.tabs__list` gets `role="tablist"` and `aria-label="Our Values"`. Each `.tabs__tab` gets `role="tab"`, `aria-selected` and a roving tab stop through `setTabStop` (`aria-controls` is in the markup).
  - The list wrapper's `role="list"` becomes `role="none"`. Each `.tabs__panel`'s `role="listitem"` becomes `role="tabpanel"`, with `aria-labelledby` (its tab). The selected panel gets `.is-current` and tab stop `'0'`; the others get `inert` and tab stop `'-1'` (all through `setTabStop`). **No panel ever gets `hidden`**; CSS hides the unselected ones with `visibility: hidden` in the shared grid cell.
- **No-tabs mode (≥ 760 px) and no JS:** no `.is-tabbed`, so the tab row is `display: none` and every panel shows as a normal list row. On leaving tabs mode `ui-tabs` removes `.is-tabbed`, `.tabs--fixed`, `.is-current`, `inert`, `aria-label`, `aria-selected` and `aria-labelledby`, restores `list` / `listitem`, and calls `clearTabStop` on every tab and panel (SHARED-D). `onModeChange` then runs `film.refreshReach()`.
- **Keyboard (SHARED-H):**
  - With focus on a tab, the tabs own ←/→ (move and select, wrapping), Home/End (first/last tab), and Space/Enter (select). Focus stays on the tab.
  - **PageDown/PageUp change scene** even with focus on a tab, because §A6 as amended by SHARED-H lets them through.
  - With focus on the panel (`tabindex="0"`), every snap key (arrows, PageUp/PageDown, Space) changes scene as usual.
- **No `aria-live`:** the tab's focus announces the change. The panel is named by its tab ("Integrity"; the `.num` is `aria-hidden`), and its `h3` is still read.
- **Reduced motion / flow mode:** the same tabs. `value-in` is neutralised by base.css §19. The section is still one 100svh screen (flow audit 0 overflow).
- **No JS:** all three values show, the tab row stays hidden, and SHARED-G lets the scene grow, so no compliance text is clipped.
- **Hooks:**
  - `data-reveal="stagger"` stays on the list wrapper. The reveal writes opacity and transforms, never `visibility`, so it does not fight the stacking. Unselected panels keep their scrubbed opacity, so a tab shown later is in the right state.
  - The scene height is the same for every tab (the tallest panel, Integrity), so `watchContentSize()` never fires on a tab change and the film never rebuilds.
  - `data-tilt` on the items is inert on phones (coarse pointer), and is unchanged on desktop. `CARD_SOUND` matches `.story-value` (class kept).
  - Tab clicks already pop through the global sfx `role=tab` click listener; `tick` exists for keys.
  - The far-scene parking is handled by SHARED-D (`setTabStop`, `clearTabStop`, `refreshReach` in `onModeChange`).
  - Deep link: `story.html#values` lands with Integrity selected. There is no per-tab hash.

**Compliance copy (verbatim; on the phone each value is in its own tab panel, never shortened):**
- "Guided by Integrity, Service and Responsible Growth."
- "Our mission is to bring trusted businesses together, so that anyone can start with one conversation and reach the right person close to them."
- `[Optional, in the founder's words: one sentence on faith.]`
- Integrity: "We say how we are paid. Cargado Strategies may receive a commission when an introduction becomes a client, and we tell you up front."
- Service: "People before transactions. An introduction costs you nothing, and you decide what happens next."
- Responsible Growth: "We grow the network with care. The Cargado team reviews and approves every partner before they are listed."

## 7. Scene 6 · `network` (gold): fluid scale

- **Overflow now:** none.
- **Move:** fluid scale only. Measured 509–683 px.
- **All bands:**
  - Layout unchanged: globe anchor `span-5` | copy `span-6 start-7`, plus `keep-md` on both.
  - `.story-anchor--network` changes to `height: min(56svh, 540px)` (was 62svh, which made the row taller than the copy on 1280×720).
  - Phone: the anchor is hidden (as today).
- **Text floor:** the commission notice `.notice` goes from 13 px to `var(--fs-note)` (SHARED-F, or the story-scoped fallback).
- **Short-screen guard:** in `@media (max-width: 759px) and (max-height: 760px)`, change `.story-network__actions` to `flex-direction: column; align-items: flex-start; gap: var(--space-xs)`. This keeps the two links on 44 px rows without wrapping awkwardly.
- **JS:** none.
- **Compliance copy (verbatim):** "They share the same standards. They are honest, they are accountable and they put people before transactions." and the notice "**Independent partners.** Partners are independent businesses, each responsible for their own licence and advice. Cargado Strategies may receive a commission when a referral becomes a client. `[Wording to be confirmed by counsel]`".

## 8. Scene 7 · `talk` (ink): split, CTA only

- **Overflow now:** +15 to +475 at every viewport except 1920×1080.
- **Move:** split. The footer leaves for `credits` (SHARED-C / services SHARED-5). `data-dur` 5 → 4.

| band | layout |
|---|---|
| wide / laptop-short | `span-7` close (eyebrow, `t-d1` title, lead, buttons, hint) | `span-4 start-9` globe anchor, vertically centred. `keep-md`. Measured 378–454. |
| tablet portrait | stacked; anchor hidden in portrait md (add `.story-anchor--talk` to the portrait rule from §3). |
| phone | stacked; anchor hidden (existing). Buttons: WhatsApp `btn--lg` full row, "See Our Services" link below. |

Markup, before:
```html
<div class="scene__inner">
  <div class="stack stack-l">
    <div class="grid align-center"> …close… …anchor… </div>
    <div data-footer></div>
  </div>
</div>
```
After:
```html
<div class="scene__inner">
  <div class="grid align-center">
    <div class="span-7 keep-md close stack stack-l"> …unchanged… </div>
    <div class="span-4 start-9 keep-md story-anchor story-anchor--talk" data-globe-anchor aria-hidden="true"></div>
  </div>
</div>
```

- **CSS:** none page-level (the `.close` padding goes in SHARED-B). The `.hint` goes from 13 px to `var(--fs-note)` (SHARED-F).
- **Compliance copy (verbatim):** "Tell us what you need and your city. We ask for your city only so we can introduce you to someone close to you." (CR10), and "Opens WhatsApp with your message written. Nothing is sent until you tap send." The `a[data-wa]` WhatsApp link (prefilled by chrome.js `pageLink('story')`).

## 9. Scene 8 · `credits` (ink, NEW): the footer as one screen

- **Move:** split into a new scene, the same footer as every page (services SHARED-5), with story's globe anchor (SHARED-C).
- **Attributes:**
  - `data-field="ink"`: the same as `talk`, so it crossfades with no iris and `data-iris` is not needed.
  - `data-dur="4"` and `data-title="Contact and Legal"` (the same as services).
  - `data-globe="0.25,2.4"` for story's rotation format.
  - **No `data-pose` and no `data-pose-fixed`:** story.js's existing `createPoseFitter` writes the pose from the anchor box. Where the anchor is hidden (phones, flow mode) the fitter scales the globe to 0, so it never sits behind the links.

```html
<!-- 8 · Credits: contact, links and notices (shared footer) -->
<section class="scene scene--credits" id="credits" data-field="ink" data-dur="4"
         data-globe="0.25,2.4" data-title="Contact and Legal" aria-label="Contact and legal">
  <div class="scene__inner">
    <div class="story-anchor story-anchor--credits" data-globe-anchor aria-hidden="true"></div>
    <div data-footer></div>
  </div>
</section>
```

CSS (story.css, new §8):
```css
.story-anchor--credits { width: min(22svh, 200px); aspect-ratio: 1; margin-inline: auto; margin-bottom: var(--space-l); }  /* clear air above the footer eyebrows */
.scene--credits .site-footer { border-top: 0; padding-top: 0; }   /* no lone line above the footer (SHARED-C) */
@media (max-width: 759px) { .story-anchor--credits { display: none; } }
html:not(.film) .story-anchor--credits { display: none; }          /* add to the existing flow-mode anchor list */
```

| band | layout |
|---|---|
| wide / laptop-short | the globe anchor centred in the top band, then services SHARED-5 compact grid: brand (span 4) | Contact | Company | Legal, then the notice (span 9) + © (span 3) on one row. Measured 526–614 (box 664–1004). The anchor's `margin-bottom: var(--space-l)` puts the globe's bottom edge 24–32 px above the first footer text (the "Contact / Company / Legal" eyebrows) at every desktop size; without it the gap was about 13 px at 1024×768 and 1366×768, with the gold trails nearly touching "COMPANY". |
| tablet portrait | the same, columns per base.css. 745 / 952 (32 px gap under the globe). |
| phone | no globe. Brand row (monogram 32 + name, tagline below), Contact links inline, Company | Legal as two columns of 44 px rows, then the notice, then ©. Footer links, tagline and notice at 15 px. Measured 576 / 781 and 574 / 684 (with the SHARED-C phone compaction). |

### 9.1 Changes to story.js

None for credits. `createPoseFitter` stays as it is: it finds `.story-anchor--credits` like every other anchor. (The earlier `data-pose-fixed` branch is dropped.)

### 9.2 Behaviour, hooks and copy

- **Accessibility:** the `<footer>` inside is `contentinfo` (as today). The section is labelled "Contact and legal". The anchor is `aria-hidden`.
- **Focus:**
  - The film parks the footer links when the scene is far away, which is unchanged.
  - The `talk` → `credits` neighbour relation means Tab from the WhatsApp CTA reaches the footer links. This is engine behaviour and needs no code.
- **Deep link:** `story.html#credits`. No page in the site links to `story.html#…` today. The skip link still targets the active scene.
- **Reveals:** none are needed. Optionally add `data-reveal="stagger"` on the footer's `.site-footer` via chrome.js (shared decision).
- **Text floor:** footer links, tagline and notice at `var(--fs-note)` (SHARED-F); footer eyebrows and `©` stay small UI labels.
- **Compliance copy (verbatim, from chrome.js):**
  - "Partners are independent businesses, each responsible for their own licence and advice. Cargado Strategies does not give regulated advice through this website and may receive a commission when a referral becomes a client. `[Wording to be confirmed by counsel]`"
  - the tagline "Connected by Purpose. United in Service.";
  - WhatsApp +1 (204) 869 2508 (new tab);
  - Facebook (new tab, "(opens in a new tab)");
  - the legal links Disclosure / Privacy / Terms / Partner Code of Conduct and Q&A;
  - © year Cargado Strategies.

---

## 10. Page-wide changes

- **story.css top comment:** the scene list becomes "hero · where it began · founder · logo · values · network · talk · credits".
- **story.js boot order:** `initValueTabs()` (§6) runs first, then `({ film, sfx } = boot())`; `film` and `sfx` become module-level `let`s so the tab callbacks can read them later.
- **story.js followPans:**
  - Keep it. It is the documented fallback below 560 px tall, where scenes may still pan.
  - Its doc comment changes to "fallback only".
- **Flow mode (reduced motion):**
  - Engine §B2 (`height: 100svh`, scroll-snap) applies; measured 0 overflow on all 8 scenes at all 9 viewports.
  - Story's flow rules that hide the globe boxes stay, and gain `.story-anchor--credits`. With them hidden, the beginning aside holds only the card (it fits).
- **No JS:** SHARED-G (`html:not(.js) .scene` grows); the values tab row stays hidden and all three values show.
- **Text floor (all scenes):** `--fs-note` (SHARED-F) on `.story-draft`, `.story-portrait__caption`, `.story-signoff__role`, `.story-logo__notes .t-small`, `.story-values__faith`, the values tab labels, `.notice`, `.hint`, and the footer links, tagline and notice. Allowed small UI labels: eyebrows, `.num`, `.list-num__n`, `.story-cue`, `.story-ref`, `©`.
- **Round 4 removals that touch this page:**
  - `.story-cue__line` and `.story-ref__rule` (markup + CSS, §2 and §5);
  - the `.lead-rule` gold rule above the mission paragraph (engine.md §C; the class is removed from the markup in §6);
  - the footer `border-top` on the credits scene (§9);
  - `<div class="hud"></div>` in story.html (engine removal);
  - the head script's `cs-motion` localStorage line (engine.md §E).
- **Kept on purpose:** `.story-rule` under the beginning heading, the `.story-signoff` top border (a divider between bio and sign-off, not a lead dash), and the values tab-row baseline. The merger may drop the sign-off border if it reads as a "line before text"; it changes no measurement that matters.
- **Not changed:**
  - fields, irises, every scrubbed tween (`heroTweens`, `ideaTweens`, `founderTweens`, `portraitDepth`, `logoTweens`, `monogramDepth`, `valuesTweens`);
  - the `pop` at the monogram lock and the card hover ticks;
  - the `.story-fit` heading system;
  - the black/gold palette (no blue) and Times New Roman Title Case headings, Manrope body, Poppins UI.
- **Acceptance:**
  - `node tools/fit-audit.mjs http://localhost:8000/ story.html` reports 0 overflow (Y, X, header, inner scroll) on all 8 scenes at all 9 viewports, in film mode and with `--flow`.
  - No reading text under 15 px (phone) / 16 px (≥ 760 px); no phone tap target under 44 px.
  - Visual check at 1366×768 and 390×844: the globe sits in its anchors (beginning aside, values left column, network left, talk right, credits above the footer on desktop, none on phone credits), and the founder plates hug the frame.
  - Values on a phone: three tabs, Integrity first, roles valid (`tablist`/`tab`/`tabpanel` in tabs mode, `list`/`listitem` otherwise), and no `tabindex`, `data-film-tab`, `inert` or `.is-current` left on any tab or panel after widening to ≥ 760 px.
  - Values tab stability: selecting each tab in turn leaves `.scene__pan`'s height and the heading's top unchanged (579 px and y 159 at 360×740), and no film rebuild runs. The selected tab shows its 3 px underline.
  - The `h3`s in tabs mode are hidden by CSS on first paint (no JS toggle); `initValueTabs()` runs before `boot()`.
  - Keys at 360×740 with focus on a tab: ←/→, Home/End and Space change the tab; PageDown changes scene (SHARED-H).
  - Founder: stage-to-text gap ≤ 1 column (≈ 100–145 px) on desktop; at 768×1024 the portrait sits beside the title and the scene uses ≥ 70 % of the box.

---

## Critique responses

### Second critique (7 defects + 1 minor), revision 3

Every point was checked against the files and re-measured on a fresh copy with revision 3 applied (`C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\r4story3\`, port 8248, stopped afterwards). Result: 0 overflow on all 8 scenes at all 9 viewports in film and `--flow` mode (table 0.2). All seven are accepted.

1. **A tab change moves the scene and rebuilds the film:** confirmed in `film.js` `watchContentSize()` (a `ResizeObserver` on every `.scene__pan`, any height change → `scheduleRebuild()`). Fixed with `fixedHeight` panels (SHARED-D, §6): stacked in one grid cell, unselected ones `visibility: hidden` + `inert`, never `hidden`. Measured 579 px at 360×740 and 541 px at 390×844 for all three tabs, heading top fixed. Added to `ui-tabs` as a shared option, because services, home and partners would hit the same rebuild.
2. **Three `ui-tabs` APIs:** confirmed, and legal.md §5.2 is a fourth one (`film` option, `drill` mode, a per-scene `setTabStop` that writes `''`). SHARED-D now names one canonical API and says it overrides the others. One correction to the critique's suggested shape: `setTabStop` keeps legal.md's **per-scene** parked check, because `parkControls()` skips `tabIndex < 0` elements, so the earlier per-element check (this spec's own revision 2) missed unselected tabs and desktop-mode panel `div`s. It takes `'0' | '-1'` (never `''`) and an optional `film`. Legal's `drill` mode, `film` option and `cause` values are kept as compatible extensions. `initValueTabs` matches the API.
3. **Keyboard claim contradicts engine.md §A6:** confirmed. §A6 ignores every key on `[role=tab|tablist]`, while services SHARED-8 lets PageUp/PageDown through. Chose the second fix, SHARED-H: a tab owns the arrows, Home/End, Space and Enter, and PageUp/PageDown pass through to snap. §6 and SHARED-H state the same rule. engine.md could not be edited in this phase, so the merger writes the row into §A6.
4. **`h3` hiding depends on JS timing:** confirmed. Now hidden by CSS (`.story-values__tabs.is-tabbed .story-value h3`, the `.visually-hidden` declarations), and the JS toggle is gone. `initValueTabs()` runs before `boot()`, so `.is-tabbed` and `.tabs--fixed` exist before the first `buildSliced()`. The film and sfx handles are read late, because `boot()` creates them.
5. **Founder sparse on a tablet:** confirmed (388 / 952). Instead of either suggestion, the tablet band uses the phone arrangement at tablet scale: two equal columns, portrait (stage `min(100%, 44svh × 0.8)`, 337 × 421 at 768×1024) beside the title, and the copy below. 726 / 952 now. This keeps one arrangement for every narrow screen and still leaves 226 px spare for the real bio.
6. **Portrait not near the text on desktop:** confirmed (230 px at 1366×768). The portrait is now `span-5` with the stage at its right edge, and the text stays `span-6 start-7` so the bio keeps a readable line length. The gap is now 133 px at 1366×768, 124 at 1280×720 (492 / 664, unchanged), 144 at 1920×1080 and 100 at 1024×768. The founder at 1024×768 rises from 461 to 522 / 712 because the wider column lets the height-capped stage reach full size.
7. **Credits globe nearly touches the footer:** confirmed (about 13 px). Added `margin-bottom: var(--space-l)` to the anchor. The gap is now 25 px at 1366×768 and 1024×768, 24 at 1280×720 and 32 at 1920×1080. Credits is now 544 / 712 at 1366×768.
- **Minor, tab CSS not in the emulation:** confirmed. The r4story3 copy carries the final tab CSS (the `font:` shorthand at `--fs-note`, the `::after` marker, and stacked panels). The underline is now 3 px (was 2) so it reads clearly at phone size. Measured: selected `scaleX(1)`, others `scaleX(0)`, plus the darker text; screenshot `s-390x844-values.png`. The tabs are 66 px tall. The `value-in` fade keys off `.is-current` now, since `[hidden]` is no longer used.
- **Text-floor rescan note:** at 768×1024 the scan flags the network and talk `.btn` labels at 15 px. These are button labels (UI, Poppins), so the allowed-label list now names `.btn` explicitly; no reading text is under the floor.

### First critique (9 defects), revision 2

All nine defects were checked against the site files and re-measured on a fresh copy with the revised spec applied (`…\scratchpad\r4story2\`). All are accepted. Notes where the critique was incomplete or needed a correction:

1. **Founder plates / small portrait:** confirmed. The plates are `inset: 0` on `.story-portrait__stage`, so shrinking only the frame detached them. Fixed by sizing the stage (§4). Measured 492 / 664 at 1280×720 (the critique's 486 rises by 6 px with the larger sign-off text) and 629 / 1004 at 1920×1080.
2. **Text floor:** confirmed (`.notice` and `.hint` are 0.8125rem; `t-xs` 12 px; `t-small` and `.site-footer` 14 px). Two corrections: the 15/16 px floor is not written in `PLAN.md`'s Round 4 section, so this spec states it at the top and proposes it as SHARED-F. And the critique's measured variant raised only part of the list on desktop (not `.hint`, the faith line, the sign-off role line or the photo caption) and not the footer links on phones. This revision raises all of them, and the audit still shows 0 overflow everywhere (tightest values 360×740, 579 / 684, lower than the critique's 599 because the tabs panel no longer repeats its number and heading).
3. **Credits globe behind the links:** accepted, preferred fix (anchor box, no `data-pose-fixed`, no fitter change). Note: the "minimum" fix (`data-pose-sm`) would not have worked on story alone, because the existing fitter overwrites `data-pose` on every scene that is not fixed. The footer `border-top` is removed.
4. **Invalid ARIA:** accepted. Side effect the critique did not mention: base.css's `.list-rule > li` and `.list-num > li` no longer match `div` items, so story.css now carries the equivalent row rules (§6).
5. **Tab row without JS / no-JS clipping:** accepted. Correction: `html:not(.js) .scene { height: auto; min-height: 100svh }` alone is not enough, because §B2 makes `.scene__inner` absolute; an auto-height scene would collapse. SHARED-G also makes the inner relative.
6. **Stray `data-film-tab`:** confirmed against `film.js` `parkControls` / `unparkControls`. Added `clearTabStop`, and the helper writes `'0'`, not `''` (revision 3 also makes the parked check per scene, see above).
7. **Values globe box:** accepted, `min(220px, 50%, 20svh)`. Measured 686 / 1004 at 1920×1080 and 563 / 712 at 1366×768.
8. **Panel repeats its tab:** accepted. `.list-num__n` and the `h3` are hidden in tabs mode (revision 3: the `h3` by CSS, not JS), so desktop keeps both.
9. **Spec text gaps:** §0.1 now uses the hardened baseline audit (the film is reached at 1920×1080); §0.2 is re-measured from this spec's own markup at all nine viewports, film and flow; §10 lists the `.lead-rule` removal.
