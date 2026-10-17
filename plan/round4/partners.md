# Round 4 · partners.html: one screen per scene

> **Merge amendments (2026-10-17, `shared.md` wins over this file where they differ)**
> - **Tokens:** `shared.md` §3 (engine `--u`, as voted). The pan padding is smaller than what was measured, so the budget is larger.
> - **§3.0 text floor:**
>   - The base block now lives at the end of **ui.css** (`shared.md` §5.3: `var(--fs-note)`, which is 15 px on phones and 16 px from 760 px).
>   - partners.css keeps only its page block (`.apply-form .check`, `.tier__list`, …) as its **last** block, using `var(--fs-note)`.
> - **§3.10 credits:**
>   - The id is **`#credits`** (D6), with the `shared.md` §5.4 markup: add `.scene__pan` and the `globe-anchor--credits` anchor, and drop `data-pose-sm`.
>   - partners.js registers `createPoseFitter({ onlyAnchored: true })` from `globe-fit.js`.
>   - The gate stands.
> - **§4:**
>   - "Snap is suspended while focus is in a tablist" is replaced by the key ownership table in `shared.md` §7.2. Tabs own the arrows, Home and End, and PageUp/PageDown still step scenes.
>   - The `[data-swipe-x]` rule, the overflow-only `watchContentSize` (measured with **`offsetHeight`**, not the rect) and the field hold are engine work (`shared.md` §7.3–7.5), built by stage 2a.
>   - `focusNow` becomes `focusInScene` from `ui-focus.js`.
> - **§5.1 tabs:**
>   - Call `createTabs(root, { activeWhen: root.dataset.tabs, label: root.dataset.tabsLabel, fixedHeight: true, swipe: true, film, onChange, onModeChange })`.
>   - The swipe handler is in the module (`swipe: true`), not in partners.js.
>   - The `.switch` / `.switch__btn` skin is in ui.css.
> - **§5.2 stepper:**
>   - Use `ui-stepper.js` `createStepper(form, { pageWhen: '(min-width: 760px)', validateUnit, onStep, onSubmit, film, sound })` (`shared.md` §6.3). There is **no `partners-stepper.js`**.
>   - The class names are the merged set: `.stepper__status/__count/__bar/__fill/__steps/__step/__title/__nav/__alt/__index/__errors`, plus `--step-progress`.
>   - `.apply-errors` becomes the module's `.stepper__errors[role="alert"]`. It may keep `apply-errors` as an extra class for its look.
> - **§7 SHARED proposals:** all are accepted in `shared.md`. D14 settles the stepper class question.
> - **Files this page may edit** are in `build-order.md`.

Status: design spec, ready to build after Round 3 lands. The brief and the acceptance test are in `PLAN.md` § "Round 4: one screen per section". This is the third revision: it applies the text floor to every compliance text, splits the phone "Agree and Send" step, fixes four engine interactions (rebuild on step and tab changes, swipes on the tab cards, flow-mode focus, `refreshReach`) and gates the credits scene. The answers to both critiques are in §8.

Measured 2026-10-17. "Before" is `tools/fit-audit.mjs` at all 9 viewports. "After" is a CDP prototype that injects this spec's CSS and markup moves into the live page before the film builds, with the engine.md D2 tokens and the Round 4 removals simulated, and **the text floor on** (§3.0). Every scene, every tab and every stepper unit fits at all 9 viewports in film mode and in flow mode, in the default state and with every field showing its error.

**Prototype (re-runnable).** Folder `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\r4d\`. Run every command from inside that folder (the runner reads `proto.css` and `proto-dom.js` from the current directory):
- `proto.css`: the base CSS of the previous revision plus the D2 tokens;
- `final.css`: this revision's deltas (text floor, step titles, step 8, phone `next` without the button, phone tiers without the eyebrow, short-desktop hero cap, tiers and form rows, the error status at the floor). Always pass it as `EXTRA`. `final-flow.css` is the same plus the engine.md B2 flow box;
- `proto-dom.js`: the markup moves, including the `h3` step titles and the step 7 / step 8 split;
- `proto.mjs`: the runner. It waits for `html.film-ready` and `.scene__pan` before probing (see "How to read" below). Switches: `--vp=WxH,…`, `EXTRA=<css>`, `FLOW=1` (loads `?motion=off`), `PROBE=<file>`, `HASH=<id>` (deep link);
- `err2.js`: the all-errors probe with this spec's RULES messages; `err-status.js`: the same plus the status row height (one line, 22–26 px); `floor-probe.js`: lists every visible sentence under the floor; `tap-probe.js`: phone tap targets;
- `results\det-*.txt`: the raw runs quoted in §1.2.

Commands: `EXTRA=final.css node proto.mjs` · `EXTRA=final.css PROBE=err2.js node proto.mjs` · `EXTRA=final.css PROBE=floor-probe.js node proto.mjs` · `FLOW=1 EXTRA=final-flow.css PROBE=err2.js node proto.mjs`.

**How to read the prototype numbers.** The probe measures a scene as the extent of the pan's top-level children plus the pan padding (`scrollHeight` reports the box when content is shorter).
- The ~40 px "run-to-run variation" of the previous revision has a simple cause, now verified: when the probe ran before the film had built, the page had no `.scene__pan` yet, so it measured without the film's pan padding (`--scene-pad-top` + `--scene-pad-bottom`, 39.6 px at 720 tall). Those were not film numbers. They match flow mode, which has no `.scene__pan`. The runner now waits for `film-ready`, and two full runs give the same numbers at every viewport from 1440×900 down.
- Neutralising every transform inside the pans changed nothing, so entrance transforms are not part of the numbers.
- The first viewport of a run (1920×1080, sometimes 1536×864) can report the box equal to the content while the stage is still sizing. For those rows §1.2 keeps the highest content seen across the runs, against the D2 box.
- **Every number in §1.2 is film mode with the pan padding, the highest seen.** The prototype is evidence for the design, not the acceptance test. Sign-off is fit-audit with hidden states (§7, SHARED fit-audit).

**Rules this spec follows**
- **Tokens.** The shared tokens come from `plan/round4/engine.md` §D2: `--u: min(1vw, 1.5svh)`, the fluid `--fs-*` and `--space-*`, `--header-h: clamp(56px, 7svh, 76px)`, `--bottom-h: env(safe-area-inset-bottom)`, `--scene-pad-top` and `--scene-pad-bottom`. This page adds no second unit. Where it needs a page-level cap, it writes the cap against `svh`.
- **Text floor** (services.md SHARED-11, legal.md). No body sentence, list item, hint, error, compliance text or consent text renders under **15 px on phones** or under **16 px from 760 px**. It is applied in CSS (§3.0) and every number below is measured with it. Pill and tab labels follow the phone floor (15 px). Exempt labels: eyebrows, the "1 / 4" counter, the tier prices, the ticket label "Spots Open" and button text (on phones button text is 15 px anyway).
- **Fit headroom.**
  - The `apply` form column keeps **at least 40 px** spare in the all-errors pass at every viewport, because user input and the errors can add lines that no probe predicts.
  - Every other block (every other scene, every tab, the static `apply` aside) keeps **at least 24 px** spare, for font-rendering differences and longer text once the placeholders are filled.
- Lines starting with **SHARED:** are proposals for the merger. Most of them endorse a proposal already made in services.md, legal.md or story.md, so the names line up. story.md SHARED-D (the canonical `ui-tabs` API) overrides this page's earlier tabs wording, and this revision follows it.
- **Removals assumed done:** the HUD, the floating WhatsApp button, the phone bar, the sound and pause toggles, and the "— " prefixes on `.tier__list` and `.ask__list` (engine.md C4). `.lead-rule` is also gone.

Scene order after this round (10 scenes, was 8):

| # | id | field | dur | iris | move |
|---|---|---|---|---|---|
| 1 | `hero` | ink | 5 | (n/a) | fluid scale, hero h1 cap (tighter on short desktops), phone button row |
| 2 | `how` | bone | 5 | 76% 50% | fluid scale only |
| 3 | `arrangement` | gold | 5 | 22% 52% | fluid scale; **phone: responsive tabs** (01 / 02 / 03) |
| 4 | `tiers` | ink | 5 | 82% 26% | `.keep-md` (5/7 at 1024×768); **phone: responsive tabs** (Community / Growth / Premier), no eyebrow |
| 5 | `founding` | gold | 5 | 18% 80% | fluid scale; `.nowrap-md` removed from the reveal heading |
| 6 | `ask` | ink | 5 | 76% 50% | fluid scale (dash prefix gone) |
| 7 | `next` **new** | bone | 4 | 78% 30% | **split**: the "What happens next" aside of `#apply` becomes its own scene; phones drop its button |
| 8 | `apply` | bone | 6 | (crossfade from `next`) | **stepper**: 8 steps on phones, 4 two-step pages from 760 px |
| 9 | `close` | ink | 4 | 50% 92% | CTA only; the footer leaves |
| 10 | `credits` **new, SHARED** | ink | 4 | (crossfade) | compact one-screen footer (services.md SHARED-5); **sign-off gate in §3.10** |

---

## 1. Measurements

### 1.1 Before (fit-audit, today: header 76/64, `--bottom-h` 72/76)

Overflow is in px (content − box); `0` means the scene fits. X overflow was 0 everywhere except one: `apply` was +1 px at 1024×768.

| scene | 1920×1080 | 1536×864 | 1440×900 | 1366×768 | 1280×720 | 1024×768 | 768×1024 | 390×844 | 360×740 |
|---|---|---|---|---|---|---|---|---|---|
| hero | 0 | +53 | 0 | +114 | +145 | +40 | 0 | 0 | +142 |
| how | 0 | 0 | 0 | +18 | +62 | 0 | 0 | 0 | +41 |
| arrangement | 0 | 0 | 0 | +10 | +51 | +9 | 0 | +305 | +460 |
| tiers | 0 | 0 | 0 | 0 | +33 | +248 | +3 | +400 | +549 |
| founding | 0 | 0 | 0 | +28 | +69 | 0 | 0 | 0 | +65 |
| ask | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | +69 |
| apply | +1163 | +1378 | +1339 | +1488 | +1560 | +1922 | +1715 | +2661 | +2806 |
| close (+footer) | 0 | +137 | +96 | +207 | +239 | +97 | 0 | +438 | +533 |

Why each scene overflows:
- **hero:** the h1 is `--fs-hero` (81.6 px at 1280×720, 4 lines, 333 px tall). On phones the two `btn--lg` buttons stack (124 px).
- **how, founding, ask:** fixed 20/32/72 px gaps and vw-only type on short screens.
- **arrangement (phone):** three stacked cards (608 px) plus the notice.
- **tiers:** at 1024×768 `md-span-12` stacks the heading column above the three tier panels (868 px). On phones the three panels are 685 px.
- **apply:** a 14-field form (2091 px desktop, 3365 px phone) plus the aside.
- **close:** the CTA plus the 4-column footer, with `.close` `padding-top: 9vh`.

### 1.2 After (prototype, film mode, text floor on: content / box)

Boxes (D2 `--scene-h`): 1004 · 804 · 837 · 712 · 664 · 712 · 952 · 781 · 684.

| scene | 1920×1080 | 1536×864 | 1440×900 | 1366×768 | 1280×720 | 1024×768 | 768×1024 | 390×844 | 360×740 |
|---|---|---|---|---|---|---|---|---|---|
| hero | 739 | 705 | 725 | 659 | 634 | 625 | 670 | 643 | 646 |
| how | 616 | 627 | 640 | 590 | 572 | 534 | 574 | 613 | 584 |
| arrangement (each tab on phones) | 586 | 595 | 606 | 591 | 569 | 613 | 697 | 579–605 | 613–639 |
| tiers (each tab on phones) | 650 | 618 | 627 | 555 | 550 | 671 | 919 | 562–586 | 631–654 |
| founding | 628 | 627 | 641 | 589 | 570 | 576 | 605 | 599 | 570 |
| ask | 521 | 539 | 553 | 501 | 481 | 493 | 536 | 587 | 608 |
| next | 443 | 479 | 488 | 478 | 491 | 553 | 691 | 631 | 642 |
| apply, worst unit | 846 | 703 | 710 | 607 | 600 | 683 (aside) | 748 | 635 | 604 |
| apply, all errors, worst unit | 915 | 675 | 728 | 624 | 616 | 683 (aside) | 748 | 656 | 632 |
| **apply form column, errors headroom** | 89 | 129 | 109 | 88 | **48** | **47** | 204 | 125 | **52** |
| close | 395 | 382 | 390 | 360 | 285 | 288 | 296 | 401 | 388 |
| credits | gate | gate | gate | gate | gate | gate | gate | gate | gate |

- **apply units.** Phones: 8 steps; from 760 px: 4 pages. The worst unit with errors is page 3 at 1280×720 (616), page 2 at 1024×768 (form column 665, measured with the aside removed) and step 1 at 360×740 (632). Step 7 ("Your Agreement") with both consent errors is 492/684 and step 8 ("Send Your Application", both full notices) is 606/684 with the status line showing.
- **At 1024×768** the static aside (eyebrow, step index, both notices) is the tallest block at 683/712 (29 px spare, it does not grow). The form column with every error is 665/712 (47 px).
- **Tightest blocks (≥ 24 px rule):** the aside at 1024×768 (29), the hero at 1280×720 (30), tiers tab 1 at 360×740 (30), tiers at 768×1024 (33), the hero at 360×740 (38), tiers at 1024×768 (41), `next` at 360×740 (42).
- **Flow mode** (`FLOW=1`, engine.md B2 box: `100svh` minus the header): flow mode has no `.scene__pan`, so there is no pan padding and every scene is about 40 px lower than in film mode. All units have 0 overflow. Worst `apply` units with errors: 680 · 675 · 679 · 582 · 576 · 640 · 692 · 610 · 591.
- **Text floor check** (`floor-probe.js`, every scene, every unit unhidden, every error shown): the only text under the floor is the ticket label "Spots Open" (12 px, an exempt UI label).
- **Credits:** not measured here (§3.10).

---

## 2. Bands used below

| band | condition | layout source |
|---|---|---|
| **wide** | ≥ 1280 wide and ≥ 720 tall | desktop grid (`span-*`) |
| **laptop-short** | 1024–1440 wide, 640–800 tall | the same grid. `.keep-md` keeps the splits at 1024×768. D2's `@media (min-width:760px) and (max-height:760px)` short guard shrinks `--space-xl`. This page's own short-desktop rules use `(min-width: 760px) and (max-height: 800px)` |
| **portrait tablet** | 760–1099 wide and portrait | `md-span-12` stacks, as today (768×1024 has 896 px of budget) |
| **phone** | ≤ 759 wide (contract: 360–430) | single column, responsive tabs on, stepper in single-step mode |

Type in every scene uses the D2 tokens. For reference:

| token | formula (engine.md D2) | 1920×1080 | 1280×720 | 1024×768 | 390×844 |
|---|---|---|---|---|---|
| `--fs-hero` | `clamp(2.25rem, 1.1rem + 5·--u, 7.75rem)` | 99 | 72 | 69 | 37 |
| `--fs-d1` | `clamp(2rem, 1.2rem + 3.9·--u, 5.25rem)` | 82 | 61 | 59 | 34 |
| `--fs-d2` | `clamp(1.75rem, 1.1rem + 2.6·--u, 3.75rem)` | 60 | 46 | 44 | 28 |
| `--fs-d3` | `clamp(1.375rem, 1rem + 1.3·--u, 2.125rem)` | 34 | 30 | 29 | 22 |
| `--fs-d4` | `clamp(1.125rem, 0.95rem + 0.45·--u, 1.375rem)` | 22 | 20 | 20 | 18 |
| `--fs-lead` | `clamp(1rem, 0.94rem + 0.35·--u, 1.25rem)` | 20 | 18.8 | 18.6 | 16 |
| `--space-m` / `-l` / `-xl` | svh-based | 20/32/54 | 16/23/29* | 17/25/31* | 19/27/20 |

\* With the short guard (`max-height: 760px`). Body and inputs stay at 16 px, so iOS never zooms. `--fs-small` (14 px) is used on this page only for exempt labels; every sentence follows the floor in §3.0.

---

## 3. Scene by scene

### 3.0 Text floor (all scenes, SHARED)

Today `.hint` and `.error` are 13 px, `.ticks` is 14 px and `.t-small` (`.hero-honest`, `.founding__why`) is `--fs-small` (14 px), and `.notice` is below 15 px on phones. They carry compliance copy (CR02, CR04, CR10, both notices, the commission notes). The floor goes into **base.css**, after the rules it overrides (`.hint`, `.error`, `.ticks` and `.notice` are single-class selectors, so source order decides):

```css
/* base.css, end of the forms / notices block: text floor (SHARED, services.md SHARED-11) */
@media (max-width: 759px) {
  .notice, .hint, .t-small, .error, .ticks { font-size: 0.9375rem; line-height: 1.45; }
}
@media (min-width: 760px) {
  .notice, .hint, .t-small, .error, .ticks { font-size: 1rem; }
}
```
On this page, also:
```css
.apply-form .check { font-size: 1rem; line-height: 1.5; }                 /* consent text, 16 px from 760 px */
@media (max-width: 759px) { .apply-form .check { font-size: 0.9375rem; } }
@media (min-width: 760px) { .tier__list { font-size: 1rem; line-height: 1.45; } }   /* was --fs-small */
```
- `.ticks` keeps its weight and family; only the size and line height change (its `font:` shorthand set 0.875rem/1.4).
- Delete the page-level overrides that would undercut the floor: `.apply-form .hint` keeps only its `max-width`; the old phone `.tier__list` / `.tiers-intro` 0.8125rem rules go (§3.4).
- Merger note: services.css `.inq-form .notice { font-size: 0.75rem }`, legal.css `.legal-contents .notice { font-size: 0.75rem }` and home.css `.intro .hint { font-size: 0.8125rem }` beat this floor by specificity. Their own specs must delete them.

### 3.1 `hero` (ink): fluid scale + h1 cap + phone button row

**Move:** fluid scale, plus re-layout of the buttons on phones.

**Layout**
- **wide:** unchanged. `.grid.align-center` with `span-7` copy on the left and the globe on the right (pose unchanged). The stack order stays eyebrow, h1, lead, ticks, buttons, honest line.
- **laptop-short (≤ 800 tall):** the same, with the h1 capped at `7.6svh`: 55 px at 1280×720 and 58 px at 1366×768 and 1024×768, still 4 lines from the `&nbsp;` groups. With the 16 px ticks and honest line it measures 634/664 at 1280×720 (it was 658/664 with the floor and the old `8.4svh` cap). At 1024×768 the copy is `md-span-12`, as today (625/712).
- **phone:** one column. The two buttons share **one row** (`.hero__actions`: no wrap, each `flex: 1 1 auto`, 48 px tall, `padding-inline: 1em`, 15 px label). This saves 76 px. The eyebrow tracking drops to `0.14em` so it breaks less. The h1 is `--fs-hero` (36–37 px). The ticks and the honest line (CR04) are 15 px (§3.0). 646/684 at 360×740.

**Type:** h1 `font-size: min(var(--fs-hero), 8.4svh)` on tall screens (91 @1920×1080, 73 @1536×864, 76 @1440×900) and `min(var(--fs-hero), 7.6svh)` from 760 px wide when the screen is at most 800 tall. Phones keep `--fs-hero`. The lead is `--fs-lead`. Spacing uses the shared `.stack` (`--space-m`).

**Markup**
```html
<!-- before -->
<div class="row" data-reveal="fade">
<!-- after -->
<div class="row hero__actions" data-reveal="fade">
```

**CSS (partners.css, Hero)**
```css
.pt-hero { max-width: 17ch; font-size: min(var(--fs-hero), 8.4svh); }
@media (min-width: 760px) and (max-height: 800px) {
  .pt-hero { font-size: min(var(--fs-hero), 7.6svh); }
}
@media (max-width: 759px) {
  #hero .eyebrow { letter-spacing: 0.14em; }
  .hero__actions { flex-wrap: nowrap; gap: var(--space-xs); }
  .hero__actions .btn { flex: 1 1 auto; min-height: 48px; padding: 0.7em 1em; font-size: 0.9375rem; }
}
```

**JS:** none. Reveals, textfx char split on the h1, magnetic buttons and letter-roll are unchanged.

### 3.2 `how` (bone): fluid scale only

**Move:** fluid scale. The `.list-rule > li` padding is `--space-m`, which is now fluid, and h2 is `--fs-d2`.

**Layout:** unchanged at every band (`span-7 start-6`, globe on the left). Phone: one column. 534–640 px against 664–1004 px; 584/684 at 360×740.

**Markup:** none. **CSS:** none beyond the tokens. **JS:** unchanged (`howTweens` guide draw, the `.how__list` depth stage).

### 3.3 `arrangement` (gold): fluid scale + phone tabs

**Move:**
- wide/laptop: fluid scale (the three cards in a row are 569–613 px);
- phone: **responsive tabs**, one card at a time;
- portrait tablet: cards in a row as today (697/952).

**Layout, phone:**

| row | content | budget at 360×740 |
|---|---|---|
| 1 | eyebrow + h2 "Pay on Clients, Not on Clicks." | about 90 |
| 2 | tab list, 3 equal tabs `01` `02` `03` (44 px, pill style as `.chip`, 15 px label) | 44 |
| 3 | the selected card (`panel-3d`); the panels are stacked, so the box is the tallest card | 181–232 |
| 4 | the commission `.notice` (verbatim, always visible, 15 px) | about 160 |
| 5 | "See the Membership Tiers →" | 44 |

The horizontal `.flow__line` and `.flow__dot`s are hidden on phones, because the tab list is the step indicator. Measured 579–605/781 and 613–639/684.

Card 03 holds the compliance sentence "If they become your client, you pay [the agreed commission]. If they don't, you owe nothing." On phones it sits behind tab 03 (tabs open on 01). This is accepted and listed in §6: the commission `.notice` stays visible beside the tabs, and its wording does not change.

**Markup (after).** The panels become `div`s with list roles, as story.md SHARED-D requires (`role="tabpanel"` is not allowed on `<li>`). `ui-tabs` swaps the roles in tabs mode.
```html
<div class="flow tabs" data-tabs="(max-width: 759px)" data-tabs-label="How it works, step by step">
  <span class="flow__line" aria-hidden="true"></span>
  <div class="tabs__list switch">
    <button class="tabs__tab switch__btn" type="button" id="flow-tab-1" aria-controls="flow-step-1">01<span class="visually-hidden"> Someone Asks</span></button>
    <button class="tabs__tab switch__btn" type="button" id="flow-tab-2" aria-controls="flow-step-2">02<span class="visually-hidden"> We Introduce</span></button>
    <button class="tabs__tab switch__btn" type="button" id="flow-tab-3" aria-controls="flow-step-3">03<span class="visually-hidden"> You Pay on Success</span></button>
  </div>
  <div class="flow__steps" role="list" data-tabs-panels data-reveal="stagger" data-swipe-x>
    <div class="flow__step tabs__panel" role="listitem" id="flow-step-1"> …unchanged card… </div>
    <div class="flow__step tabs__panel" role="listitem" id="flow-step-2"> … </div>
    <div class="flow__step tabs__panel" role="listitem" id="flow-step-3"> … </div>
  </div>
</div>
```
- The tab list sits **inside** `.flow`, above the panels. It is static HTML, so nothing is injected after the build. `ui-tabs` adds `role="tablist"`, `role="tab"`, `aria-selected`, the label and the tab stops only in tabs mode, and sets `.is-tabbed` on the root.
- `.flow__steps` and `.flow__step` keep their classes, so the existing CSS and the depth stage still match (`ol`/`li` selectors in partners.css, if any, become class selectors).

**CSS**
```css
.switch { display: none; }
@media (max-width: 759px) {
  .is-tabbed > .switch { display: flex; gap: var(--space-xs); margin-bottom: var(--space-s); }
  .switch__btn { flex: 1; min-height: 44px; padding: 0 12px; border: 1px solid var(--line-strong); border-radius: 999px;
                 background: none; color: var(--fg); font: 500 0.9375rem/1 var(--font-ui); letter-spacing: 0.04em; }
  .switch__btn[aria-selected="true"] { background: var(--chip-on-bg); border-color: var(--chip-on-bg); color: var(--chip-on-fg); }
  [data-swipe-x] { touch-action: pan-y pinch-zoom; }
  #arrangement .flow__line, #arrangement .flow__dot { display: none; }
  #arrangement .flow__step { padding: 0; }
}
```
- `touch-action: pan-y pinch-zoom` keeps native vertical scrolling in flow mode and pinch-zoom everywhere, and stops the browser from claiming horizontal pans, so the swipe handler gets every pointer event. (In film mode `body` is `pan-x pinch-zoom`, so the effective value over the cards is `pinch-zoom`; snap handles vertical gestures there, §4.)
- The stacked-panel CSS (`.tabs--fixed`) is the shared base.css block from story.md SHARED-D.
- Replace the existing `@media (max-width:759px)` vertical-rail block in partners.css (`.flow__line { left:7px … }`, `.flow__step { padding: 0 0 0 var(--space-l) }`, `.flow__dot { top… }`).

**JS:**
- `arrangementTweens`: return early when the line is not rendered: `if (!line.getClientRects().length) return;`. The dots tween is skipped with it.
- The `.flow` depth stage (`rotationX`) is unchanged, because it only runs on fine pointers.
- Tabs: §5.1, with `fixedHeight: true`, so a tab change never changes the scene's height.

### 3.4 `tiers` (ink): keep-md + phone tabs

**Move:**
- wide: fluid scale (`span-5` / `span-7 start-6`, three tier rows), 550–650 px;
- laptop-short: `.keep-md` on both columns, so 1024×768 keeps the 5/7 split, and the tiers use the compact padding below (671/712; 712/712 without it, once the tier list is 16 px);
- portrait tablet: stacked as today (919/952);
- phone: **responsive tabs** Community / Growth / Premier, one `.tier` at a time.

**Layout, phone:**
- the eyebrow "Membership tiers" is hidden: the h2 "Community, Growth, Premier." and the three tab labels say the same thing;
- h2;
- intro paragraph (`.tiers-intro`, compliance copy) at 15 px / 1.5;
- the membership `.notice` (verbatim, 15 px);
- the tab list (15 px labels);
- the selected `.tier` (panels stacked, so the box is the tallest tier): head (name + price on one row), list at 15 px / 1.5, "Apply for …".

The heading stack uses `--space-s`, the tier padding is `--space-s --space-m` and the tier list has a 2 px gap. Measured 562–586/781 and 631–654/684 (30 px spare; it was 670/684 with the floor and the eyebrow).

**Markup**
```html
<!-- before -->
<div class="span-5 md-span-12 stack">
  … <p class="muted" data-reveal="fade">Community is free. …</p> …
</div>
<ul class="span-7 start-6 md-span-12 tiers" data-reveal="stagger">
  <li class="tier" data-cursor-label="Apply"> …
<!-- after -->
<div class="span-5 keep-md md-span-12 stack tiers-head">
  … <p class="muted tiers-intro" data-reveal="fade">Community is free. …</p> …
</div>
<div class="span-7 start-6 keep-md md-span-12 tiers-wrap tabs" data-tabs="(max-width: 759px)" data-tabs-label="Membership tiers">
  <div class="tabs__list switch">
    <button class="tabs__tab switch__btn" type="button" id="tier-tab-community" aria-controls="tier-community">Community</button>
    <button class="tabs__tab switch__btn" type="button" id="tier-tab-growth" aria-controls="tier-growth">Growth</button>
    <button class="tabs__tab switch__btn" type="button" id="tier-tab-premier" aria-controls="tier-premier">Premier</button>
  </div>
  <div class="tiers" role="list" data-tabs-panels data-reveal="stagger" data-swipe-x>
    <div class="tier tabs__panel" role="listitem" id="tier-community" data-cursor-label="Apply"> …unchanged… </div>
    <div class="tier tabs__panel" role="listitem" id="tier-growth" … > … </div>
    <div class="tier tabs__panel" role="listitem" id="tier-premier" … > … </div>
  </div>
</div>
```
`.tiers` and `.tier` keep their classes, so `DEPTH_STAGES.tiers` (target `.tiers`), `wireTierCards()` and the `a[data-tier]` preselect work unchanged. Any `ul.tiers` / `.tiers > li` selector becomes `.tiers > .tier`.

**CSS**
```css
.tiers > .tier { padding: var(--space-m) var(--space-l); }              /* was --space-m --space-l, now fluid */
/* removals (engine.md C4): delete .tier__list > li::before and the hanging indent */
@media (min-width: 760px) and (max-height: 800px) {
  .tiers > .tier { padding: var(--space-s) var(--space-m); }
  .tier__list { gap: 2px; }
}
@media (max-width: 759px) {
  #tiers .tiers-head > .eyebrow { display: none; }
  .tiers-head { --stack: var(--space-s); }
  #tiers .tiers-intro { font-size: 0.9375rem; line-height: 1.5; }
  .tiers > .tier { padding: var(--space-s) var(--space-m); row-gap: 4px; }
  .tier__list { font-size: 0.9375rem; line-height: 1.5; gap: 2px; }
}
```
The tiers h2 keeps `id="tiers-title"`, and the section keeps `aria-labelledby="tiers-title"`, so hiding the eyebrow loses no name.

**JS:** tabs (§5.1). The whole-card click (`wireTierCards`) still works on the visible card. interact.js sets up hidden cards on first hover (ENGINE §11), so no extra call is needed.

### 3.5 `founding` (gold): fluid scale

**Move:** fluid scale. h2 `.t-d1` = `--fs-d1` (61 px at 1280×720, 34 px at 390). Layout unchanged at every band. `.founding__why` (the cap sentence, `.t-small`) is now 15/16 px (§3.0). Measured 570–641 px desktop and 570–599 px phone.

**Markup:** remove `.nowrap-md` from inside the `data-reveal="lines"` heading (legal.md SHARED: `.nowrap-md` in reveal headings is the source of X overflow).
```html
<!-- before -->
<h2 id="founding-title" class="t-d1 founding__title" data-reveal="lines"><span class="nowrap-md">The First <span class="ph">[2]</span> Partners</span> per&nbsp;Service, per&nbsp;City.</h2>
<!-- after -->
<h2 id="founding-title" class="t-d1 founding__title" data-reveal="lines">The&nbsp;First <span class="ph">[2]</span>&nbsp;Partners per&nbsp;Service, per&nbsp;City.</h2>
```
**CSS:** none (`.founding__title { max-width: 19ch }` stays). **JS:** `foundingTweens` and the ticket depth stage are unchanged.

### 3.6 `ask` (ink): fluid scale

**Move:** fluid scale. Layout unchanged. "We review and approve each application. A listing goes live only after approval." stays here, and **is not** repeated in `next`.

**CSS (removals, engine.md C4):** delete `.ask__list > li::before`, and change `.ask__list > li { padding-left: 2.25rem }` to `padding-left: 0`. Delete the phone `padding-left: 1.75rem` too. The inline "Partner Code of Conduct" link gets the same phone tap padding as the consent links (§3.8; it measures 189×22 at 390×844 without it). Measured 481–553 px desktop and 587–608 px phone.

### 3.7 `next` (bone, NEW): "What Happens After You Apply"

**Move:** **split**. The `#apply` aside held the "What happens next" list and the two compliance notices (605 px tall at 1280×720 on top of the form). They become their own scene, so `apply` keeps only the form.

**Attributes**
```html
<section class="scene" id="next" data-field="bone" data-dur="4" data-iris="78% 30%"
         data-pose="-2.6,0,0,0.05,-1.15,0" data-pose-md="-2.6,0,0,0.05,-1.15,0" data-pose-sm="-3.33,0,0,0.05,-1.15,0"
         data-title="What Happens Next" aria-labelledby="next-title">
```
- The field is bone, so it irises in from ink `ask` and crossfades into bone `apply`, and the application reads as one chapter.
- The pose hides the globe (`s=0`), which is where `apply` already is.
- `data-dur` is 4, the same as `close`.

**Layout**
- **wide / laptop-short** (`.keep-md`):
  - left `span-5`: eyebrow "What happens next", h2 "What Happens After You Apply." and the one primary action, "Start the Application →" (`#apply`);
  - right `span-7`: the numbered list `ol.list-rule.list-num.next__list` (4 rows, 16 px), then `.next__notes`, which holds the two notices side by side (`1fr 1fr`, 16 px).
  - Measured 443–553 px.
- **portrait tablet:** stacked (691/952).
- **phone:** one column.
  - The eyebrow is hidden (the h2 says the same words).
  - **The "Start the Application" button is hidden** (`.next__cta`): the next swipe or key already goes to `apply`, and with the 15 px notices the scene was 721/684 with it.
  - The list rows use `--space-xs` padding.
  - The two notices share one left rule: the `.next__notes` block gets the border, and the inner `.notice` padding and border go to 0.
  - Measured 631/781 and 642/684.

**Markup (new scene, inserted after `#ask`)**
```html
<section class="scene" id="next" … (attributes above)>
  <div class="scene__inner">
    <div class="grid">
      <div class="span-5 keep-md md-span-12 stack">
        <p class="eyebrow next__eyebrow" data-reveal="fade">What happens next</p>
        <h2 id="next-title" data-reveal="lines">What Happens After You&nbsp;Apply.</h2>
        <div class="row next__cta" data-reveal="fade">
          <a class="btn btn--primary" href="#apply">Start the Application <span class="btn__arrow" aria-hidden="true">→</span></a>
        </div>
      </div>
      <div class="span-7 keep-md md-span-12 stack stack-l">
        <ol class="list-rule list-num next__list" data-reveal="stagger">
          <li><span class="list-num__n">01</span><span>You send the application. Nothing is sent until you tap send.</span></li>
          <li><span class="list-num__n">02</span><span>We review your licence details <span class="ph">[process to be confirmed]</span> and contact your references.</span></li>
          <li><span class="list-num__n">03</span><span>We reply within <span class="ph">[5 business days]</span>.</span></li>
          <li><span class="list-num__n">04</span><span>If approved, your listing goes live.</span></li>
        </ol>
        <div class="next__notes" data-reveal="fade">
          <p class="notice"><strong>Commission.</strong> Cargado Strategies may receive a commission when an introduction becomes your client. Terms are agreed in writing before your listing goes live. <span class="ph">[Commission terms to be confirmed by&nbsp;counsel]</span></p>
          <p class="notice"><strong>Independent partners.</strong> Partners are independent businesses, each responsible for their own licence and advice. Approval is not an endorsement.</p>
        </div>
      </div>
    </div>
  </div>
</section>
```
The visible h2 "What Happens After You Apply." is the aside's former `aria-label` ("What happens after you apply"), so no copy is new.

**CSS**
```css
.next__list > li { grid-template-columns: 2.5rem 1fr; gap: var(--space-s); font-size: 1rem; }  /* moved from #apply .list-num > li; 16 px floor */
.next__notes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-m) var(--gap-col); }
@media (max-width: 759px) {
  #next .next__eyebrow, #next .next__cta { display: none; }   /* display:none also takes the link out of the Tab order */
  #next .next__list > li { padding-block: var(--space-xs); }
  .next__notes { grid-template-columns: minmax(0, 1fr); gap: var(--space-xs);
                 padding: var(--space-xs) 0 var(--space-xs) 14px; border-left: 2px solid var(--accent); }
  .next__notes .notice { padding: 0; border: 0; }
}
```

**JS:** optionally add `DEPTH_STAGES.next = { target: '.next__list', enter: { rotationY: 14 }, drift: { rotationY: -4 }, ownPerspective: true }`. Nothing else is needed. The numbers do not decode, which matches the old aside.

### 3.8 `apply` (bone): stepper

**Move:** **stepper.** The form is now 8 short steps inside one scene:
- phones show one step at a time;
- from 760 px, the steps are paired into 4 pages that show two steps side by side;
- the right column (`span-4`, wide and laptop only) holds the step index and both compliance notices.

**Steps and pages**

| step | title (`h3` inside the legend) | content | page (≥ 760) |
|---|---|---|---|
| 1 | Your Business | the "All fields are required unless marked optional." hint; business, entity (+hint), contact | 1 |
| 2 | How to Reach You | email, phone (+hint), tier (optional) | 1 |
| 3 | Your Service | category, types chips (`#pa-types`) | 2 |
| 4 | Your Licence | licence, issuer, licence hint (+ph) | 2 |
| 5 | Where You Work | city, province, area hint | 3 (full width, fields in 2 columns) |
| 6 | About You | references (+hint), about (+hint) | 3 (full width, fields in 2 columns) |
| 7 | Your Agreement | conduct, consent, honeypot | 4 (left) |
| 8 | Send Your Application | send hint; on phones and portrait tablets also both notices in full (`.apply-step__terms`); no fields | 4 (right) |

Page names used by the aside index: 1 "Your Business", 2 "Service and Licence", 3 "Area and About You", 4 "Agree and Send".

Step 8 is not a `fieldset` (it has no controls). It is `<div class="apply-step apply-step--send" role="group" aria-labelledby="apply-step-8-title">`.

**Layout**
- **wide / laptop-short:**
  - `.apply__main` is `span-8 keep-md`. Its order is the `.apply__head` (eyebrow "Application" + h2), the status row (a 2 px progress bar with the counter "1 / 4", and the one-line error status), the page's steps in a `1fr 1fr` grid, the nav row (Back | Next, or Back | **Send My Application on WhatsApp →** on the last page), then the email row (last page only, shown only once an email address is configured).
  - `aside.apply__aside` is `span-4 keep-md`, and holds a `panel-3d` with the eyebrow "Your application", the step index (4 buttons, 16 px) and the two notices, verbatim, at 16 px.
  - Steps 5 and 6 span both columns, with their own fields in 2 columns. Steps 7 and 8 sit side by side.
  - **Short desktop screens (≥ 760 wide, ≤ 800 tall):** the head eyebrow "Application" is hidden (the h2 says the same), the head margin is `--space-xs`, the h2 is capped at `min(var(--fs-d2), 6svh)`, the form gap is `--space-xs`, the step padding is `--space-s --space-m`, and the `.form-row` gap (label, field, hint or error) is 4 px instead of 6. With these, page 3 at 1280×720 with every error is 616/664 (it was 667/664 page 1 with the floor and the previous CSS).
- **portrait tablet (760–1099, portrait):** the same 4 pages and 2 columns. The aside is hidden, and step 8 shows both notices in full (748/952).
- **phone:**
  - one step per page (8);
  - the head eyebrow is hidden, and the head margin is `--space-s`;
  - the steps have no panel chrome (no border or padding);
  - the aside is hidden;
  - step 7 holds only the two checkboxes (492/684 with both errors);
  - step 8 holds the send hint (15 px, verbatim), then **both full notices**, the same text as the desktop aside, then the nav: 593/684, 606/684 with the error status showing;
  - nav is Back (ghost) | Next (primary, visible text "Next" with a visually hidden ": <next step name>"), or Back | Send on step 8, on one row with no wrap. The Send label is "Send on WhatsApp →" visibly (one line), with " My Application" in a phone-only visually hidden span, so the accessible name is "Send My Application on WhatsApp" everywhere;
  - consent text 15 px / 1.5, hints and errors 15 px / 1.45;
  - measured 449–635/781 and 393–604/684, and up to 656/781 and 632/684 with every error.

**Inputs:**
- `.input` and `.select` are 44 px tall (`padding: 9px 12px`) at every size;
- textareas: `resize: none`, so a user resize can never push the scene over. Desktop `min-height: clamp(52px, 7.5svh, 110px)` (54 px, two lines, at 1280×720). **Phones** `min-height: clamp(72px, 12svh, 120px)`: about 89 px (three to four lines) at 360×740. Step 6 fits at 604/684 (626/684 with errors);
- body text and inputs stay 16 px (no iOS zoom).

**Errors (per step)**
- Next validates only the fields of the visible step or page.
- Each invalid field shows its inline `.error`, and its own `.hint` is hidden while it is invalid. The error messages carry the hint's meaning (below).
- The error summary box is replaced by a **one-line status** in the status row: `#apply-errors` reads "2 answers need a second look." and stays `role="alert"`.
- Focus moves to the first invalid field.
- The list of links is dropped: with at most 6 fields on screen, every error is visible next to its field.

RULES message changes (partners-form.js). None of these is compliance copy:
- `entity`: "Enter the legal entity name, even if it is the same as your business name." (was "Enter the legal entity name. If it is the same as your business name, enter that again."; one line shorter in a half column, same meaning as the hidden hint "As registered. Repeat the business name if it's the same.")
- `references`: "Add at least one professional reference: a name and how to reach them. We contact them only to review your application." (carries the hidden hint)
- `about`: "Tell us about your work in two or three sentences (30 characters or more): what you do, who you help, your languages." (carries the hidden hint; the number comes from `MIN_ABOUT`)
- `conduct`: "Tick to agree to the Partner Code of Conduct." (was "Tick the box to agree to the Partner Code of Conduct. We only accept partners who follow it.")
- `consent`: "Tick so we can use these details to review it." (was "Tick the box so we can use these details to review your application.")
- `phone` already restates its hint.

**Markup (after: the whole scene body)**
```html
<section class="scene" id="apply" data-field="bone" data-dur="6" data-iris="22% 50%"
         data-pose="-2.6,0,0,0.05,-1.2,0" data-pose-md="-2.6,0,0,0.05,-1.2,0" data-pose-sm="-3.33,0,0,0.05,-1.2,0"
         data-title="Apply" aria-labelledby="apply-title">
  <div class="scene__inner">
    <div class="grid">
      <div class="span-8 keep-md md-span-12 apply__main">
        <div class="apply__head stack stack-xs">
          <p class="eyebrow" data-reveal="fade">Application</p>
          <h2 id="apply-title" data-reveal="lines">Apply to Join the Partner&nbsp;Network.</h2>
        </div>

        <form class="form apply-form" id="apply-form" novalidate aria-labelledby="apply-title" data-reveal="fade">
          <div class="stepper__status">
            <p class="stepper__count num" aria-hidden="true" data-fx="none"><span data-step-now>1</span> / <span data-step-total>4</span></p>
            <span class="stepper__bar" aria-hidden="true"><span class="stepper__fill"></span></span>
            <div class="apply-errors" id="apply-errors" role="alert" tabindex="-1" hidden></div>
          </div>
          <p class="visually-hidden" id="apply-live" aria-live="polite" aria-atomic="true"></p>

          <div class="stepper__steps">
            <fieldset class="apply-step" data-step="1" data-page="1" data-tilt>
              <legend class="apply-step__legend"><h3 class="apply-step__title" id="apply-step-1-title" tabindex="-1" data-depth="18">Your Business<span class="visually-hidden" data-step-of></span></h3></legend>
              <p class="hint apply-form__req">All fields are required unless marked optional.</p>
              <div class="apply-form__grid">
                <!-- form-row #pa-business, form-row #pa-entity (+ #pa-entity-hint), form-row #pa-contact: unchanged -->
              </div>
            </fieldset>
            <fieldset class="apply-step" data-step="2" data-page="1" data-tilt hidden>
              <legend class="apply-step__legend"><h3 class="apply-step__title" id="apply-step-2-title" tabindex="-1" data-depth="18">How to Reach You<span class="visually-hidden" data-step-of></span></h3></legend>
              <div class="apply-form__grid"><!-- #pa-email, #pa-phone (+hint), #pa-tier rows: unchanged --></div>
            </fieldset>
            <fieldset class="apply-step" data-step="3" data-page="2" data-tilt hidden>
              <legend class="apply-step__legend"><h3 class="apply-step__title" id="apply-step-3-title" tabindex="-1" data-depth="18">Your Service<span class="visually-hidden" data-step-of></span></h3></legend>
              <div class="apply-form__grid"><!-- #pa-category row, fieldset#pa-types: unchanged --></div>
            </fieldset>
            <fieldset class="apply-step" data-step="4" data-page="2" data-tilt hidden>
              <legend class="apply-step__legend"><h3 class="apply-step__title" id="apply-step-4-title" tabindex="-1" data-depth="18">Your Licence<span class="visually-hidden" data-step-of></span></h3></legend>
              <div class="apply-form__grid"><!-- #pa-licence row, #pa-issuer row, p#pa-licence-hint: unchanged --></div>
            </fieldset>
            <fieldset class="apply-step apply-step--wide" data-step="5" data-page="3" data-tilt hidden>
              <legend class="apply-step__legend"><h3 class="apply-step__title" id="apply-step-5-title" tabindex="-1" data-depth="18">Where You Work<span class="visually-hidden" data-step-of></span></h3></legend>
              <div class="apply-form__grid"><!-- #pa-city row, #pa-province row, p#pa-area-hint: unchanged --></div>
            </fieldset>
            <fieldset class="apply-step apply-step--wide" data-step="6" data-page="3" data-tilt hidden>
              <legend class="apply-step__legend"><h3 class="apply-step__title" id="apply-step-6-title" tabindex="-1" data-depth="18">About You<span class="visually-hidden" data-step-of></span></h3></legend>
              <div class="apply-form__grid"><!-- #pa-references row (+hint), #pa-about row (+hint): unchanged --></div>
            </fieldset>
            <fieldset class="apply-step" data-step="7" data-page="4" hidden>
              <legend class="apply-step__legend"><h3 class="apply-step__title" id="apply-step-7-title" tabindex="-1">Your Agreement<span class="visually-hidden" data-step-of></span></h3></legend>
              <div class="apply-form__agree"><!-- #pa-conduct and #pa-consent rows: unchanged --></div>
              <div class="hp" aria-hidden="true"><!-- honeypot: unchanged --></div>
            </fieldset>
            <div class="apply-step apply-step--send" data-step="8" data-page="4" role="group" aria-labelledby="apply-step-8-title" hidden>
              <h3 class="apply-step__title" id="apply-step-8-title" tabindex="-1">Send Your Application<span class="visually-hidden" data-step-of></span></h3>
              <p class="hint apply-form__send-hint">Opens WhatsApp with your application written out. Nothing is sent until you tap send. <span data-email-missing>An email option will follow: <span class="ph" data-email-label>[company email]</span>.</span></p>
              <div class="apply-step__terms stack stack-xs">
                <p class="notice"><strong>Commission.</strong> Cargado Strategies may receive a commission when an introduction becomes your client. Terms are agreed in writing before your listing goes live. <span class="ph">[Commission terms to be confirmed by&nbsp;counsel]</span></p>
                <p class="notice"><strong>Independent partners.</strong> Partners are independent businesses, each responsible for their own licence and advice. Approval is not an endorsement.</p>
              </div>
            </div>
          </div>

          <div class="stepper__nav row">
            <button class="btn btn--ghost" type="button" data-step-back hidden>Back</button>
            <button class="btn btn--primary" type="button" data-step-next data-roll="none">Next<span class="visually-hidden" data-next-name>: How to Reach You</span> <span class="btn__arrow" aria-hidden="true">→</span></button>
            <!-- the FIRST submit button in tree order: Enter on the last unit sends by WhatsApp -->
            <button class="btn btn--primary" type="submit" name="via" value="whatsapp" data-step-send data-roll="none" hidden>Send<span class="send__more"> My Application</span> on WhatsApp <span class="btn__arrow" aria-hidden="true">→</span></button>
          </div>
          <!-- after the nav in tree order; shown on the last unit only, and only once an email is configured -->
          <div class="row stepper__alt" data-step-alt hidden>
            <button class="btn btn--ghost" type="submit" name="via" value="email" data-email-only hidden>Send by Email Instead</button>
          </div>
        </form>

        <!-- #apply-success: unchanged -->
      </div>

      <aside class="span-4 keep-md md-span-12 apply__aside" aria-label="Application progress and terms">
        <div class="apply__panel panel-3d stack" data-reveal="fade">
          <p class="eyebrow" data-depth="22">Your application</p>
          <ol class="stepper__index" data-depth="16">
            <li><button type="button" data-goto-page="1" aria-current="step"><span class="num">01</span> Your Business</button></li>
            <li><button type="button" data-goto-page="2" disabled><span class="num">02</span> Service and Licence</button></li>
            <li><button type="button" data-goto-page="3" disabled><span class="num">03</span> Area and About You</button></li>
            <li><button type="button" data-goto-page="4" disabled><span class="num">04</span> Agree and Send</button></li>
          </ol>
          <p class="notice" data-depth="12"><strong>Commission.</strong> Cargado Strategies may receive a commission when an introduction becomes your client. Terms are agreed in writing before your listing goes live. <span class="ph">[Commission terms to be confirmed by&nbsp;counsel]</span></p>
          <p class="notice" data-depth="8"><strong>Independent partners.</strong> Partners are independent businesses, each responsible for their own licence and advice. Approval is not an endorsement.</p>
        </div>
      </aside>
    </div>
  </div>
</section>
```

Notes on the markup:
- **Reveals:** the old `.apply__main[data-reveal="fade"]` would swallow the head's reveals, because nested reveals are ignored. The reveal therefore moves to the `form`; the head keeps the eyebrow decode and the h2 char reveal. `.apply-success` keeps none.
- The old `.apply-form__group` fieldsets, `.apply-form__legend`, the old `.apply-form__send` block and the old `.apply__steps` list are deleted. The list's copy now lives in `#next`.
- `lead-rule` is gone (engine.md C4).
- **Step titles and the step announcement.** Each step's title is an `h3` with `tabindex="-1"` (inside the `legend` for fieldsets; a heading is allowed in a legend). The stepper writes ", step 3 of 8" (phones) or ", part 2 of 4" (from 760 px) into the title's visually hidden `[data-step-of]` span for every step of the visible unit, and clears it on the others. Focus goes to the title, so a screen reader announces a heading whose own name is "Your Service, step 3 of 8". No `aria-describedby` is involved, and the counter itself is `aria-hidden`. The fieldset's group name includes the same words, which is harmless.
- **Submit order.** The WhatsApp submit button (`data-step-send`) is the first submit button in tree order, and the email submit sits after the nav. Implicit submission (Enter in a text field) clicks the form's first submit button even when it is hidden, so this order makes Enter on the last unit send by WhatsApp. On any other unit the submit handler turns it into Next (§5.2).
- **Send label.** `.send__more` is visible from 760 px and visually hidden on phones (CSS below). The text is split across spans, so the button has `data-roll="none"`.
- Fields in `hidden` fieldsets stay in `FormData` (only `disabled` excludes them), so `readValues()` is unchanged.
- **SHARED-6** (services.md): the `.hp` honeypot uses `clip-path: inset(50%)` at `left:0`, never `left:-10000px`. Inside a tilting fieldset, an off-screen offset projects into X overflow.

**CSS (partners.css, Application: replaces the current block)**
```css
.apply__main { min-width: 0; }
.apply__head { margin-bottom: var(--space-m); }
.apply-form { gap: var(--space-s); }
.stepper__status { display: flex; align-items: center; gap: var(--space-s); min-height: 22px; }
.stepper__count { font: 500 var(--fs-xs)/1 var(--font-ui); letter-spacing: 0.14em; color: var(--fg-muted); }
.stepper__bar { flex: 1; height: 2px; background: var(--line); overflow: hidden; }
.stepper__fill { display: block; height: 100%; background: var(--accent); transform-origin: 0 50%;
                 transform: scaleX(var(--step-progress, 0.25)); transition: transform 0.4s var(--ease); }
.stepper__status .apply-errors { flex: none; padding: 0; border: 0; background: none; }
.stepper__status .apply-errors__title { font: 600 1rem/1.3 var(--font-ui); color: var(--error); }   /* one line, 22-26 px row */
@media (max-width: 759px) { .stepper__status .apply-errors__title { font-size: 0.9375rem; } }
.stepper__steps { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gap-col); align-items: start; }
.apply-step { display: grid; gap: var(--space-s); align-content: start; min-width: 0; padding: var(--space-m); border: 1px solid var(--line);
              border-radius: var(--radius); background: var(--surface); box-shadow: 0 26px 50px -34px var(--panel-depth); }
.apply-step--wide { grid-column: 1 / -1; }
.apply-step__legend { float: left; width: 100%; padding: 0; }
.apply-step__title { margin: 0; font: 400 var(--fs-d4)/1.15 var(--font-display); letter-spacing: var(--track-display); }
.apply-step__title:focus { outline: none; }               /* focused only to move screen readers here */
.apply-step .apply-form__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-s); }
@media (min-width: 760px) {
  .apply-step:is([data-step="5"], [data-step="6"]) .apply-form__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: var(--gap-col); }
  .apply-step:is([data-step="5"], [data-step="6"]) .apply-form__grid > .hint { grid-column: 1 / -1; }
}
@media (min-width: 760px) and (max-height: 800px) {
  .apply-step { padding: var(--space-s) var(--space-m); }
  .apply-form { gap: var(--space-xs); }
  .apply-form .form-row { gap: 4px; }
  #apply-title { font-size: min(var(--fs-d2), 6svh); }
  #apply .apply__head { margin-bottom: var(--space-xs); }
}
@media (max-width: 759px), (min-width: 760px) and (max-height: 800px) {
  #apply .apply__head .eyebrow { display: none; }          /* the h2 says "Apply" */
}
@media (max-width: 759px) { #apply .apply__head { margin-bottom: var(--space-s); } }
.apply-form .input, .apply-form .select { min-height: 44px; padding: 9px 12px; }
.apply-form .textarea { min-height: clamp(52px, 7.5svh, 110px); resize: none; }
.apply-form .form-row:has(> [aria-invalid="true"]) > .hint { display: none; }   /* the error restates it */
.apply-form__agree { display: grid; gap: var(--space-s); }
.apply-form__agree a, .apply-success a { color: var(--accent); text-underline-offset: 3px; }
.apply-form__opt { letter-spacing: 0.06em; text-transform: none; color: var(--fg-muted); font-weight: 400; }
.stepper__nav { flex-wrap: nowrap; justify-content: space-between; }
.stepper__nav .btn { min-height: 48px; }
.stepper__nav [data-step-back][hidden] + * { margin-left: auto; }          /* Next stays right on unit 1 */
.stepper__alt { justify-content: flex-end; }
.apply__aside { min-width: 0; }
.apply__panel { padding: var(--space-m); }
.stepper__index { display: grid; }
.stepper__index[hidden] { display: none; }
.stepper__index button { display: flex; gap: var(--space-s); align-items: center; width: 100%; min-height: 44px; padding: 0;
                         border: 0; border-top: 1px solid var(--line); background: none; color: var(--fg);
                         font: 500 1rem/1.2 var(--font-ui); text-align: left; }
.stepper__index button[aria-current="step"] { color: var(--accent); }
.stepper__index button:disabled { color: var(--fg-muted); cursor: default; opacity: 1; }
.apply-step__terms { display: none; }                                       /* the aside shows the notices */
@media (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) {
  .apply__aside { display: none; }
  .apply-step__terms { display: grid; }
}
@media (max-width: 759px) {
  .stepper__steps { grid-template-columns: minmax(0, 1fr); }
  .apply-step { padding: 0; border: 0; background: none; box-shadow: none; }
  .apply__aside { display: none; }
  .apply-step__terms { display: grid; }
  .apply-form .textarea { min-height: clamp(72px, 12svh, 120px); }         /* ~89 px at 360x740 */
  .apply-form__agree { gap: var(--space-xs); }
  .apply-form__agree a, .ask__list a { padding-block: 12px; margin-block: -12px; }  /* >= 44 px tap target, no layout change */
  .stepper__nav .btn--ghost { padding-inline: 1em; }
  .stepper__nav .btn--primary { padding-inline: 1.1em; }
  .send__more { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
                clip-path: inset(50%); white-space: nowrap; border: 0; }   /* = .visually-hidden, phones only */
}
@media (prefers-reduced-motion: reduce) { .stepper__fill { transition: none; } }
html.rm .stepper__fill { transition: none; }
.apply-success { max-width: 44rem; }
#apply-success-title:focus { outline: none; }
```
The consent text, hints, errors and notices take their sizes from §3.0. Measured on phones with this CSS: Back 70×48 and Send one line; the consent links 288×68 ("Partner Code of Conduct", two lines) and 93×45 ("privacy policy"); the textarea about 89 px.

Delete from partners.css:
- `.apply-form__group`, `.apply-form__legend`, `.apply-form__full`, `.apply-form__short`, `.apply-form .check { font-size: 0.9375rem }` (§3.0 replaces it);
- the old `.apply-errors` box styles: keep only `.apply-errors__title`;
- `#apply .list-num > li`, `.apply__panel .list-rule …`;
- the `scroll-margin-top` rule: flow mode is one screen now (SHARED-4), and flow-mode focus never scrolls to an inner element (§4).

The page-local `:root { --pt-edge }` stays for tiers and ticket.

**JS:** see §5.2. **Engine dependencies:** §4 (content-resize rebuild, focus in flow mode, keyboard hold).

### 3.9 `close` (ink): CTA only

**Move:** the footer moves to `#credits` (SHARED). What stays fits easily (285–401 px).

**Markup**
```html
<!-- before -->
<div class="scene__inner">
  <div class="stack stack-xl">
    <div class="close stack stack-l"> …eyebrow, h2, lead, buttons, hint… </div>
    <div data-footer></div>
  </div>
</div>
<!-- after -->
<div class="scene__inner">
  <div class="close stack stack-l"> …unchanged… </div>
</div>
```
**CSS:** delete `html.film .close { padding-top: … }` in base.css (engine.md D3). The title has no `.nowrap-md`, so there is nothing else to change. `close` keeps `data-dur="4"` and `data-iris="50% 92%"`. The close hint ("Opens WhatsApp with your message written…") is a `.hint` and follows §3.0.

### 3.10 `credits` (ink, NEW, SHARED): sign-off gate

**Move:** split. This is the shared final scene from services.md SHARED-5. Use exactly the shared markup, so every page matches:
```html
<section class="scene scene--credits" id="credits" data-field="ink" data-dur="4"
         data-pose="0,0.35,-1,0.25,2.4,0.7" data-pose-sm="0,1.2,-1,0.25,2.4,0.6"
         data-title="Contact and Legal" aria-label="Contact and legal">
  <div class="scene__inner"><div data-footer></div></div>
</section>
```
- **wide / laptop:** brand (span 4) | Contact | Company | Legal, with the notice and © on the bottom row (the base.css §10 rewrite in services.md).
- **phone:** a brand row, link groups as 44 px rows, then the notice (15 px) and ©.

**The gate (acceptance, not optional).**
1. The merger picks **one id and one footer CSS** for every page. This spec proposes `#credits` with services.md SHARED-5 (legal.md names the same scene `#footer`; engine.md follows legal). Whichever id wins, partners.html uses it unchanged.
2. **partners.html is not signed off** until `fit-audit` reports the credits scene at **all 9 viewports with 0 overflow** (Y and X), measured with the footer notice at **15 px on phones** and 16 px from 760 px, and with ≥ 24 px spare.
3. The result row is added to §1.2 by the builder. The prototype's own compact layout measured 550/684 at 360×740 and 570/781 at 390×844, which shows a footer fits; it is not the shared CSS and does not count.

---

## 4. Film integration (all scenes)

- **Snap (engine.md A):** every scene is one stop.
  - `apply` has inputs, so it gets the REST hold automatically.
  - Snap is suspended while focus is in an input, select or textarea, and while focus is in a `[role="tablist"]` (arrows belong to tabs). The tabs call `preventDefault()` on the keys they use, and snap ignores `defaultPrevented` keys (legal.md SHARED film-snap (a)).
  - **Dependency:** Space and Enter on a focused `button` or `a` must activate it, never advance the scene (the Next and Back buttons, tabs, the step index).
- **Swipes on the tab cards (engine dependency, SHARED below).** On phones `.flow__steps` and `.tiers` cover about 180–300 px of the 684 px scene. A vertical swipe that starts on a card must move between scenes like any other. So film-snap ignores a touch gesture **only when it is horizontal-dominant** (|dx| > 1.5·|dy| at the axis decision, engine.md A7). `[data-swipe-x]` is **not** a blanket opt-out: a vertical-dominant gesture that starts inside it previews, commits or settles as usual, so nothing is left half-way. The tabs' own swipe handler acts only on horizontal-dominant gestures (§5.1), so the two never both act on one gesture.
- **Rebuild on content size (engine dependency, SHARED below).** Today `film.js` `watchContentSize()` puts a ResizeObserver on every `.scene__pan` and calls `scheduleRebuild()` (200 ms) on any height change. On this page that would rebuild the whole film on every step or page change and every error display, re-running the build hooks, and a rebuild within `FOCUS_PENDING_MS` (1.5 s) of the legend focus re-runs the focus scroll. The engine change this page relies on:
  - `watchContentSize()` rebuilds only when a scene's **overflow** changes: `over = max(0, pan's border-box height − .scene__inner clientHeight)`; rebuild when `over` differs from the last value **and** either value is above 0 (the scene starts or stops panning, or its pan length changes). A height change while the scene fits (`over` 0 → 0) does nothing, because a fitting scene's timeline does not depend on its content height.
  - Proposed code:
    ```js
    function watchContentSize() {
      const overOf = new WeakMap();
      const overflow = (pan) => Math.max(0, Math.round(pan.getBoundingClientRect().height) - pan.parentElement.clientHeight);
      const observer = new ResizeObserver((entries) => {
        const changed = entries.some(({ target }) => {
          const before = overOf.get(target);
          const now = overflow(target);
          overOf.set(target, now);
          return before !== undefined && before !== now && (before > 0 || now > 0);
        });
        if (changed) scheduleRebuild();
      });
      parts.forEach((p) => { overOf.set(p.pan, overflow(p.pan)); observer.observe(p.pan); });
    }
    ```
  - Tabs pass `fixedHeight: true` (story.md SHARED-D), so a tab change never changes the height in the first place.
  - **If the merger keeps the rebuild on any height change**, this page must plan for it: every step, page or error change uses `focusTo(title, { afterLayout: true })` (it waits for `rebuilt`, then focuses and calls `film.goTo`, which re-snaps per engine.md A8), and the error status is written before the wait. The rebuild then happens once per change and focus lands after it. This is the fallback, not the design.
- **Focus in flow (reduced-motion) mode (partners.js `makeFocusTo`).** Today `focusNow` calls `el.scrollIntoView({ block: 'start' })` whenever the film is off. For a step title that scrolls the page so the title sits under the fixed header, and mandatory scroll-snap then pulls the page back to `#apply`: a visible jump on every Next and Back. New rule: in flow mode, focus with `preventScroll: true`; if the target's scene is not the snapped one, scroll **the scene** into place, never the inner element.
  ```js
  const focusNow = (el) => {
    el.focus({ preventScroll: true });
    if (film.enabled) return;                                   // film mode: the engine brings the scene in (A8)
    const scene = el.closest('section.scene');
    if (scene && Math.abs(scene.getBoundingClientRect().top) > 1) scene.scrollIntoView({ block: 'start' });
  };
  ```
- **Phone keyboard (engine requirement, SHARED keyboard hold).** When a phone keyboard opens on a lower field (step 6 textareas, step 5 city), the browser scrolls the document to reveal the field. On this page document scroll drives the film, and engine.md A9 turns touch snap off while a field has focus "so the keyboard can scroll the page natively". Without a hold, the visitor is carried off `apply` mid-typing and nothing settles back. The engine must:
  - on `focusin` of a text field inside a scene, record that scene's hold scroll position and enter a **field hold**;
  - while the hold is on, revert any document scroll change that no user gesture caused (no wheel, touchmove or key in the last 300 ms): `lenis.scrollTo(holdY, { immediate: true })`, and keep the playhead on the scene;
  - bring the field into view inside the fixed scene instead (the scene fits, so the keyboard only needs the visual viewport to pan; where it does not, `field.scrollIntoView({ block: 'nearest' })` on the field's own row);
  - end the hold on `focusout` to a non-field, then `settle()` to the nearest scene as engine.md A9 already says;
  - a deliberate user swipe during the hold still leaves the scene (the hold only ignores focus-caused scroll).
  - **Test on a real Android (Chrome) and a real iPhone (Safari):** focus every field of steps 5 and 6, type, rotate, and dismiss the keyboard; the film must stay on `apply` and settle on it. Repeat in flow mode (scroll-snap `mandatory` must not jump sections when the keyboard opens).
- **Pan:** no scene pans at the contract sizes, so `applyTweens` (the aside "sticky" counter-move during the pan) is dead and must be **deleted**, with `WIDE_QUERY`.
- **Parking:**
  - Tab buttons, Back/Next/Send, the step index and the fields are static HTML and are parked and unparked like any control.
  - **Tab panels and unselected tabs are not static focusables.** `ui-tabs` writes their tab stops when tabs mode starts and on every selection, possibly while the scene is parked. Every write goes through story.md SHARED-D `setTabStop` / `clearTabStop` (decides by the scene, writes into `data-film-tab` when the scene is parked).
  - After every mode change partners.js calls **`film.refreshReach()`**, which is a **required engine export** (SHARED below), so a control that became focusable while its scene is parked gets parked too. partners.js does not use optional chaining for it; it checks once at start-up and reports a missing export loudly (§5.1).
  - Controls inside `hidden` steps have no client rects, so `hasFocusable` ignores them correctly.
- **Deep links:** `#apply`, from hero, founding, the tiers and close, and from `next` "Start the Application" (wide, laptop and tablet), still `goTo('apply')`. The step state is kept; arriving does not reset it. `#next` and `#credits` work as ordinary scene ids. The tier links still preselect `#pa-tier` (step 2) via `selectTier`. `legal.html#conduct` and `legal.html#privacy` are unchanged. No other page links to a partners.html anchor.
- **Removals in partners.js:**
  - `wirePartnerLinks` stops calling `chrome.setBar` (phone bar gone), and `BAR_LABEL` goes;
  - `applyTweens` and its `SCENE_TWEENS.apply` entry go;
  - `arrangementTweens` gets the early return in §3.3.

---

## 5. Components and JS

### 5.1 Responsive tabs (tiers, arrangement): the SHARED tabs module

Use `ui-tabs.js` `createTabs` exactly as story.md SHARED-D defines it (it overrides services.md SHARED-7, legal.md §5.2 and this page's earlier wording). This page needs:
- **Root:** `.tabs[data-tabs="<media query>"]` with a `.tabs__list` of `.tabs__tab` buttons (each with `aria-controls`) and a panels parent with `data-tabs-panels`, `role="list"`, and `div.tabs__panel[role="listitem"]` children. In tabs mode the module swaps the list roles to `none` / `tabpanel` and restores them on exit (no `data-tabs-list-role` attribute any more).
- **Options:** `activeWhen: root.dataset.tabs`, `label: root.dataset.tabsLabel`, `fixedHeight: true`, `film`, `onChange`, `onModeChange`.
- **Tabs mode:** `.is-tabbed` on the root (the CSS shows `.switch` only then), `role="tablist"` + label on the list, `aria-selected` and a roving tab stop on the tabs, and with `fixedHeight` the panels stacked in one grid cell, the selected one `.is-current`, the others `inert` and `visibility: hidden`. Panel heights never change the scene's height.
- **Static mode (≥ 760 px):** every panel shows; roles, tab stops and `inert` are removed (`clearTabStop`); the tab list is not rendered.
- **Tab stops:** every write through `setTabStop(el, value, film)`, every removal through `clearTabStop(el)`.
- **Keyboard:** ArrowLeft and ArrowRight move between tabs with automatic activation, Home and End go to the ends, and each calls `preventDefault()`. Tab moves into the panel; ArrowUp and ArrowDown are not consumed.
- **Touch:** each panels parent (`.flow__steps`, `.tiers`) has `data-swipe-x` and `touch-action: pan-y pinch-zoom`. A swipe selects the next or previous tab **only** when it is horizontal-dominant: |dx| ≥ 48 and |dx| > 1.5·|dy|. A vertical-dominant gesture there is left to film-snap, which moves between scenes (§4).
- **Live text:** none. The selected tab's name is announced by the tab itself.
- **SFX:** `[role="tab"]` is already in sfx.js `POP_TARGETS`, so a pointer selection pops. For keyboard and swipe changes, `onChange` calls `sound('pop')` when `cause` is not `'pointer'`.
- **Reduced motion and flow mode:** the same behaviour with no transition.
- **interact.js:** the visible `.tier` keeps its tilt and magnetic link. Do not add `data-magnetic` to `.switch__btn`: in a 3-up row it fights the neighbours.

Wire-up in partners.js. The controls are static; the film handle is needed for `setTabStop` and `refreshReach`. `refreshReach` is required, so a missing export is reported, never skipped silently:
```js
import { createTabs } from './ui-tabs.js';
const { film, chrome, sfx } = boot(/* … */);
if (typeof film.refreshReach !== 'function') {
  console.error('[partners] film.refreshReach() is missing: tab and step controls in parked scenes stay reachable by Tab (engine.md, SHARED refreshReach).');
}
const refreshReach = () => film.refreshReach?.();   // the guard above has already reported a gap
document.querySelectorAll('.tabs[data-tabs]').forEach((root) =>
  createTabs(root, {
    activeWhen: root.dataset.tabs,
    label: root.dataset.tabsLabel,
    fixedHeight: true,
    film,
    onChange: ({ cause }) => { if (cause !== 'pointer') sound('pop'); },
    onModeChange: refreshReach,
  }));
```
The build's fit and a11y review must also check that `film.refreshReach` exists in both returns (`film.js` and `film-flow.js`, where it is a no-op because flow mode parks nothing).

### 5.2 Application stepper

Use services.md SHARED-7 `ui-stepper.js` → `createStepper(form, { steps, validate, onStep })` if it lands generic enough. Otherwise put the same logic in a page module, `assets/js/partners-stepper.js`, under 150 lines. It needs:
- **Units:** `mode = matchMedia('(min-width: 760px)').matches ? 'page' : 'step'`.
  - Page mode: unit = `data-page` (1–4), and a page shows every step with that `data-page`.
  - Step mode: unit = `data-step` (1–8).
  - On a media change, map the position: the first step of the current page, or the page of the current step. Re-render without moving focus.
- **Render(unit):**
  - toggle `hidden` on the steps (`.apply-step`);
  - set `--step-progress: unit/total` on `.stepper__fill`;
  - set `[data-step-now]` and `[data-step-total]` (the visible counter, `aria-hidden`);
  - write ", step 3 of 8" (step mode) or ", part 2 of 4" (page mode) into `[data-step-of]` of every visible step title, and clear it on the hidden ones;
  - `[data-step-back].hidden = unit === 1`;
  - `[data-step-next].hidden = last`, `[data-step-send].hidden = !last` and `[data-step-alt].hidden = !last`;
  - set `[data-next-name]` to `": " + name of the next unit` (the next step's title, or the next page's name);
  - in the aside index, set `aria-current="step"` on the current page and `disabled = page > furthestPage` on each button;
  - clear the error status.
- **Announcements:**
  - After Next, Back or an index jump, focus moves to the first visible step title (`h3`, `tabindex="-1"`). The heading's own text carries the count, so the screen reader hears "Your Service, step 3 of 8, heading level 3". **Do not** write `#apply-live` on these changes.
  - `#apply-live` (polite) is written **only** on a mode change (crossing 760 px), where focus does not move: "Now on part 2 of 4: Your Service, Your Licence." or "Now on step 3 of 8: Your Service."
- **Focus:** through `focusTo(title)` (§4: no scroll in flow mode; the engine's focus handling in film mode). After a failed Next, focus the first invalid field instead.
- **Next:**
  - validate only the RULES whose field lives in the visible steps, found with `fieldEl(form, rule.field).closest('[data-step]')`; step 8 has no fields, and step 7's Next validates `conduct` and `consent`;
  - on errors, set the inline errors, write "{n} answer(s) need(s) a second look." into `#apply-errors` (`hidden=false`), play `sound('error')` and focus the first invalid field;
  - when valid, set `furthest = max(furthest, unit + 1)`, render `unit + 1`, play `sound('tick', { index: unit })` and focus the title.
- **Back:** render `unit - 1` and focus its title. There is no validation and no sound beyond the automatic click.
- **Step index (aside):** a click on an enabled button renders that page and focuses its first title. Going forward past `furthest` is impossible, because those buttons are disabled.
- **Submit handler (covers the Enter key).** Implicit submission (Enter in a text input) does **not** arrive with a null `e.submitter`: the browser clicks the form's first submit button in tree order, hidden or not. So the handler decides by unit, never by submitter:
  ```js
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (unit < total) { next(); return; }              // any submit before the last unit is Next
    const via = e.submitter?.value === 'email' ? 'email' : 'whatsapp';
    submitFinal(via);
  });
  ```
  With the markup order in §3.8, Enter on the last unit reaches the WhatsApp button. Textareas keep Enter as a newline (no implicit submission), and checkboxes do not submit.
- **Submit (final unit), `submitFinal(via)`:**
  - run the full `validate(readValues(form))`, as today;
  - if any error belongs to an earlier unit, render the earliest such unit, then focus its first invalid field;
  - otherwise hand off to WhatsApp or email and show success, as today.
  - `renderSummary` (the link list) is replaced by the one-line status; `focusErrorField` goes.
- **Recheck as you type** (`attempted` behaviour): keep it, scoped to the visible fields. When a field becomes valid, clear its error, and with it the error status once the visible set is clean.
- **Success:** success hides the form, as today, **and hides the aside step index** (`.stepper__index.hidden = true`), so no index button can render a page inside the hidden form. The aside keeps its eyebrow and both notices.
- **Edit My Application:** shows the form and the index again, renders unit 1 and focuses the business field (`focusTo(field, { afterLayout: true })`). `furthest` is **kept**: every unit passed validation before the send, and the answers are still filled in, so every index button stays enabled.
- **Tier preselect:** `selectTier()` is unchanged, and the step does not move.
- **Reduced motion and flow mode:** identical logic. The fill has no transition, and there is no step entrance animation.
- **Film mode extra (optional, transform and opacity only):** a step entering after Next gets the class `is-entering` for one frame: `opacity 0 → 1, translate 0 12px → 0` over 0.28s, as a CSS transition, not on the scrubbed timeline. Skip it under `html.rm`.
- **interact.js:** `data-tilt` on steps 1–6 (not on 7, which holds the checkboxes, nor on 8) gives the same tilt-and-depth feel as the old groups. Tilt pauses while a text field inside has focus.
- **textfx:** do not put `data-decode` or `data-roll` on anything whose text the stepper rewrites or splits. The Next and Send buttons have `data-roll="none"`, and `.stepper__count` has `data-fx="none"`.

Changes to partners-form.js, in summary:
- export `validate`, `readValues`, `setFieldError` and the RULES-by-field lookup for the stepper;
- the five message texts in §3.8 (entity, references, about, conduct, consent);
- `renderSummary` becomes `renderStatus(box, errors)`, one line;
- `submit()` becomes `submitFinal(via)` and gains `goToFirstError(errors)`; the `via` value comes from the submit handler above;
- the email button is now outside the steps: `data-email-only` still toggles it, and `[data-step-alt]` only shows on the last unit;
- `initPartnerForm({ form, success, focusTo, sound, stepper })`; success and Edit call `stepper.hideIndex()` / `stepper.showIndex()`.

### 5.3 Nothing else is new

There is no overlay or dialog, no pager and no new scene-specific engine hook on this page. The engine dependencies are the snap rules, the content-resize rule, `refreshReach` and the keyboard hold in §4.

---

## 6. Compliance copy that must survive verbatim

Do not change these words. They may be moved only where §3 says so. Check each one with a text diff after the build. Every item renders at ≥ 15 px on phones and ≥ 16 px from 760 px (§3.0).

1. **hero:**
   - "When people near you ask us for your kind of service, they see the partners closest to them, sorted by distance. Introductions cost nothing up front: you pay a commission only when one becomes your client [terms to be confirmed]."
   - the ticks "Start free on Community [confirm]", "Paid tiers are optional" and "No ads, no cold calls";
   - "We don't promise a number of introductions, clients or results. That depends on what people near you ask for." (CR04)
2. **how:** "Lists are sorted by distance only. No bidding, no paid ranking, and a listing is never a recommendation."
3. **arrangement:**
   - "If they become your client, you pay [the agreed commission]. If they don't, you owe nothing." **Moved behind tab 03 on phones (accepted):** the tabs open on 01, so on phones this sentence shows when 03 is selected. It is in the DOM, in the accessibility tree via the tab panel when selected, and visible on every screen from 760 px. The copy check must not flag it as missing.
   - the notice "Commission terms [to be confirmed by counsel]. Referral fees are restricted for some professions in some provinces, so terms are set for each profession and province before launch. Partners are independent businesses, each responsible for their own licence and advice." This stays visible on phones beside the tabs, and its wording does not change.
4. **tiers:**
   - "Community is free. Growth and Premier are optional paid tiers that add listing and network tools. Every tier is reviewed and approved the same way.";
   - the notice "Membership covers listing and network tools only. It never buys introductions, referrals, a higher place in the list or our endorsement. Lists stay sorted by distance for every tier. [Tier names, fees and features to be confirmed]";
   - every tier bracket: [No fee], [$ per month], [terms], [Longer profile: languages, services, hours], [Network tools, e.g. an introduction log], [More than one service area], [Partner events and co-hosted workshops]. On phones each tier's brackets sit behind its tab (accepted, same as item 3).
5. **founding:**
   - "They get [0% commission on the first client]. After that, standard terms. A founding spot never changes the order of the list: it stays sorted by distance.";
   - "[City] · [service]: [n] of [2] open [live count]";
   - "The cap is real. Lists show only a few people per city, so founding spots are limited to [2] per service, per city."
6. **ask:**
   - "Hold a current licence where one applies. How we confirm it: [process to be confirmed by the founder and counsel].";
   - "Reply to introductions within [1 business day].", "Describe their services honestly." and "Follow the Partner Code of Conduct." (link `legal.html#conduct`);
   - "We review and approve each application. A listing goes live only after approval."
7. **next** (moved from the apply aside):
   - the four steps (01 to 04, with [process to be confirmed] and [5 business days]);
   - **Commission.** "Cargado Strategies may receive a commission when an introduction becomes your client. Terms are agreed in writing before your listing goes live. [Commission terms to be confirmed by counsel]";
   - **Independent partners.** "Partners are independent businesses, each responsible for their own licence and advice. Approval is not an endorsement."
   - These two notices are also repeated verbatim in the `#apply` aside on wide and laptop screens, and in step 8 on phones and portrait tablets.
8. **apply:**
   - "All fields are required unless marked optional.";
   - the licence hint "Required for insurance, legal, mortgage and real estate. We review it before approval [how we confirm it with the issuing body: to be confirmed]." (CR02);
   - the area hint "Lists are sorted by distance, so we use this to show you to people near you." (CR10: it says why);
   - the references hint "One or two names and how to reach them, such as a colleague or a long-standing client. We contact them only to review your application.";
   - the conduct consent "I have read and agree to follow the Partner Code of Conduct, and the details above are true.";
   - the privacy consent "Cargado Strategies may use these details to review my application and contact me about it. See the privacy policy.";
   - "Opens WhatsApp with your application written out. Nothing is sent until you tap send." and "An email option will follow: [company email].";
   - the success copy (both variants) and "Thank You. We Review and Approve Each One.";
   - next to the Send button on every screen there are **both full notices**: in the aside (wide, laptop) or in step 8 (phone, portrait tablet), including "[Commission terms to be confirmed by counsel]" and "Approval is not an endorsement." Nothing is shortened.
9. **close:** "Message us on WhatsApp about tiers, commission terms or spots in your area." and "Opens WhatsApp with your message written. Nothing is sent until you tap send."
10. **credits** (chrome.js footer, unchanged text):
    - the tagline "Connected by Purpose. United in Service.";
    - "WhatsApp +1 (204) 869 2508", "Facebook" and the legal links;
    - "Partners are independent businesses, each responsible for their own licence and advice. Cargado Strategies does not give regulated advice through this website and may receive a commission when a referral becomes a client. [Wording to be confirmed by counsel]" (15 px on phones, §3.10 gate).

Copy that changes, none of it compliance:
- the five RULES messages in §3.8 (entity, references, about, conduct, consent);
- the new visible h2 "What Happens After You Apply." (it was the aside's accessible name);
- the step titles "How to Reach You", "Your Service", "Your Licence", "Your Agreement" and "Send Your Application". The old groups were "Your Business", "Your Service and Licence", "Where You Work" and "About You";
- the aside eyebrow "Your application";
- Back / Next, the hidden ", step n of 8" / ", part n of 4" text, and the mode-change announcement;
- the phone Send label shows "Send on WhatsApp →"; the accessible name stays "Send My Application on WhatsApp".

Copy that is hidden on phones but stays in the DOM (not compliance): the `#tiers` eyebrow "Membership tiers", the `#next` eyebrow and the `#next` "Start the Application" button, the `#apply` eyebrow "Application" (also hidden on short desktops).

---

## 7. SHARED proposals (for the merger)

- **SHARED: adopt engine.md D2/D3 tokens as written.** This page was verified with them: `--u: min(1vw, 1.5svh)`, the fluid `--fs-*` and `--space-*`, the header clamp, `--bottom-h: env(safe-area-inset-bottom)`, the `--scene-pad-*` and the short-screen guard. Do not add a second fit unit (legal.md's `--fit` and services.md's `--fu` should fold into `--u`). For a page-level cap, use `min(var(--fs-*), N svh)` as this page does for the hero and the apply h2.
- **SHARED: text floor in base.css** (endorses services.md SHARED-11 and legal.md). The CSS in §3.0: `.notice, .hint, .t-small, .error, .ticks` at 0.9375rem / 1.45 on phones and 1rem from 760 px, placed after the rules it overrides. Page CSS that sets these classes smaller (`.inq-form .notice`, `.legal-contents .notice`, `.intro .hint`, partners' phone `.tier__list` / `.tiers-intro`) is deleted. Pill and tab labels ≥ 15 px on phones. Exempt: eyebrows, counters, prices, UI labels such as the ticket label. Every page's fit numbers must be measured with the floor on.
- **SHARED: film-snap and `[data-swipe-x]` (rewrite engine.md A7 and legal.md S7).** Replace legal.md S7 "film-snap ignores any gesture that starts inside `[data-swipe-x]`" and add to engine.md A7, after the axis decision:
  > A touch gesture is ignored by snap only when it is horizontal-dominant (|dx| > 1.5·|dy| when |dx| or |dy| first exceeds 10 px), wherever it starts. `[data-swipe-x]` marks a component that handles horizontal swipes itself; it is not an opt-out. A vertical-dominant gesture that starts inside it is a normal snap gesture (preview, then commit or settle). Components put `touch-action: pan-y pinch-zoom` on `[data-swipe-x]` and act only on horizontal-dominant gestures.
- **SHARED: rebuild on content size only when overflow changes (engine.md A8, `film.js` `watchContentSize`).** Code in §4. A fitting scene's height changes (steppers, error lines, tabs without `fixedHeight`, pagers) no longer rebuild the film; a scene that starts, stops or changes panning still does. This removes a 200 ms full rebuild after every step change and every error display on partners, services and home, and the `FOCUS_PENDING_MS` re-scroll that follows it. If the merger rejects it, every stepper must use `focusTo(el, { afterLayout: true })` on unit changes (§4 fallback).
- **SHARED: `film.refreshReach()` is a required engine export** (services.md SHARED-8 proposed it; engine.md does not list it yet). `film.js` returns `refreshReach: updateReach`; `film-flow.js` returns a no-op. Callers (ui-tabs `onModeChange`, pagers, steppers) call it unguarded or check once and log an error, as §5.1 does; optional chaining alone hides a missing export.
- **SHARED: flow-mode focus never scrolls to an inner element.** Any `focusTo`-style helper on any page: in flow mode focus with `preventScroll: true`, and if the target's scene is not snapped, `scene.scrollIntoView({ block: 'start' })` (§4). With one-screen sections and mandatory scroll-snap, scrolling an inner element under the fixed header always causes a jump and a snap-back.
- **SHARED: `#credits` is the shared final scene** (services.md SHARED-5 markup), and `close` keeps only the CTA. The merger picks one id for every page (this spec proposes `credits`; legal.md and engine.md say `footer`). No page is signed off until fit-audit reports that scene at all 9 viewports with 0 overflow and the footer notice at 15 px on phones (§3.10).
- **SHARED: delete `html.film .close { padding-top }`** (engine.md D3, legal.md, services.md: all agree).
- **SHARED: no `.nowrap-md` inside `[data-reveal="lines"]` headings** (legal.md). On this page that means the founding title.
- **SHARED: honeypot without the off-screen offset** (services.md SHARED-6). Needed here because `.hp` now sits inside a stepper fieldset.
- **SHARED: one tabs module = story.md SHARED-D** (`ui-tabs.js`, `createTabs`, `setTabStop`, `clearTabStop`, `fixedHeight`, `.is-tabbed`, automatic list roles). This page adds the pill skin `.switch` / `.switch__btn` for phone segment rows, which could move to base.css as the shared "segmented tabs" look for tiers, values and categories on phones.
- **SHARED: one stepper module** (services.md `ui-stepper.js`), with these requirements from this page:
  - **units that depend on a media query:** pages of grouped steps (`data-page`) from 760 px, single steps (`data-step`) below; a step may be a `fieldset` or a `div[role="group"]` with no fields;
  - per-unit validation callback;
  - **the step announcement is a focused heading:** each step title is an `h3 tabindex="-1"` (inside the legend for fieldsets) whose visually hidden text carries "step n of N" / "part n of N"; focus goes there on every unit change. No `aria-describedby` on a focused legend (a legend has no role, and NVDA and JAWS often skip descriptions on focused non-interactive elements), and **no** live-region write on the same change;
  - a polite live region written only when the unit mode changes without a focus move;
  - a one-line `role="alert"` error status in place of a link summary;
  - **the submit handler treats any submit before the last unit as Next, whatever `e.submitter` is** (implicit submission clicks the first submit button in tree order, even a hidden one); the primary final submit must be the first submit button in tree order;
  - jump to the earliest unit with an error on final submit;
  - an optional index of visited units (`aria-current="step"`, later units disabled), hidden while the form is replaced by a success panel and restored on edit, with `furthest` kept;
  - no `film.refresh()` on unit change (with the content-resize rule above, none happens either).
  - Classes: `.stepper__status/__count/__bar/__fill/__steps/__nav/__alt/__index` (this page) next to services.md's `.stepper__progress/__step`. The merger should pick one set; this page will rename to match.
- **SHARED: film-snap must leave Space and Enter to a focused button or link** (Next, Back, tabs), and must ignore `defaultPrevented` keys (legal.md film-snap (a)).
- **SHARED: keyboard hold (engine, new).** While focus is in a text field inside a scene, the film holds that scene and reverts document scroll that no user gesture caused (focus and on-screen-keyboard scroll); the field is brought into view inside the fixed scene. Full requirement in §4. This adds to engine.md A9, whose "touch off while a field is focused, so the keyboard can scroll the page natively" is exactly what carries the visitor off the form. It applies to every form scene (services inquiry, home intro form). Must be tested on a real Android and a real iPhone.
- **SHARED: textareas never resize inside a fitted scene** (services.md SHARED-9 `.textarea { resize: none; }`), and on phones they are at least three lines tall (`clamp(72px, 12svh, 120px)` here) so they never become a two-line scroll box. This page uses `clamp(52px, 7.5svh, 110px)` (two lines at 720 tall) from 760 px.
- **SHARED: phone tap targets for inline links next to controls.** A link inside a checkbox label gets `padding-block: 12px; margin-block: -12px` on phones (≥ 44 px tall, no layout change), so a slightly-off tap does not toggle the checkbox.
- **SHARED: fit-audit is the acceptance test, and it must test hidden states.**
  - For each `[data-tabs]` root, select every tab in turn. For each stepper, render every unit in both modes (phone steps and desktop pages). Run an "all errors" pass: unhide every `.error` with its RULES text, set `aria-invalid`, and show the error status.
  - **Wait for `html.film-ready` and `.scene__pan` before measuring film mode.** A probe that runs earlier measures the page without the pan padding (about 40 px too low at 720 tall); that, not entrance transforms, was the "run-to-run variation" seen in the prototypes. Then run each viewport twice in film mode plus once in flow mode; a scene passes only if every run is 0 overflow.
  - A form column passes only with at least 40 px spare in the all-errors pass; every other block with at least 24 px.
  - Report any visible sentence under the text floor (15 px phones, 16 px from 760 px), as services.md's probe and `r4d/floor-probe.js` do.
  - Measure content as the pan's child extent plus padding, because `scrollHeight` reports the box when content is shorter.
- **SHARED: `.lead-rule` and the "— " list prefixes are already removed** (engine.md C4). On this page that affects `.apply-form.lead-rule`, `.tier__list > li::before` and `.ask__list > li::before`, plus its padding.

---

## 8. Critique responses

### 8.1 Second critique (this revision)

Each point was checked against the site files (`film.js`, `film-flow.js`, `partners.js`, `partners-form.js`, `base.css`, `partners.css`), the other round 4 specs and fresh prototype runs in `r4d\`. All nine are accepted. Two measurement details in point 1 were different from what the critique reported; they are explained there.

1. **Text floor not applied.** Accepted and verified: `.hint` and `.error` are 0.8125rem, `.ticks` 0.875rem and `.t-small` `--fs-small` in base.css, and the spec's own §1.2 had been measured without the floor. The floor is now CSS in §3.0 (phones 0.9375rem / 1.45, from 760 px 1rem), plus `.tier__list` at 1rem from 760 px (it was 14 px, which the critique did not list). Re-measured with the floor and redesigned:
   - Phone `apply`: step 7 is split into 7 "Your Agreement" (the two checkboxes: 492/684 with both errors) and 8 "Send Your Application" (send hint, both full notices, Send: 606/684 with the status). The send hint stays.
   - Phone `next`: the "Start the Application" button is hidden on phones: 642/684 (the critique's 642 confirmed).
   - Short desktops: the hero h1 cap is `7.6svh` (634/664 at 1280×720). The critique's suggested 48 px textareas are **not** needed and not used: textareas stay at `clamp(52px, 7.5svh, 110px)` (two lines).
   - **Difference 1: the critique's fix figures were not film-mode figures.** "hero 595/664" and "apply with errors 627/664" were measured before the film had built (no `.scene__pan`, so no pan padding; they equal the flow-mode numbers). In film mode the critique's fix set gives hero 634/664 and apply page 1 with errors **667/664, still +3**. So this revision adds more to the short-desktop apply rules: `.form-row` gap 4 px, head margin `--space-xs`, and a shorter `entity` error (one line less in a half column) and `about` error. Result: 1280×720 worst unit with errors 616/664 (48 px), 1024×768 form column 665/712 (47 px), 1366×768 624/712.
   - **Difference 2: the "~40 px variation between film runs" is not noise.** It is the same film-ready race. The runner now waits for `html.film-ready`, and the spec's fit-audit requirement says so (§7). Margins in §1.2 are real film margins.
   - Tiers at 360×740: the eyebrow is hidden on phones (the h2 and the tab labels repeat it): 654/684, 30 px spare (it was 670 with the floor). At 1024×768 the tier list at 16 px made tiers 712/712, so short desktops use the compact tier padding: 671/712.
   - The new headroom rule is stated in the Rules: 40 px for the form column with errors, 24 px for every other block. The static aside at 1024×768 (683/712, 29 px) is held to the 24 px rule because it does not grow.
2. **Step and tab changes do rebuild the film.** Accepted and verified: `watchContentSize()` (film.js ~633) observes every `.scene__pan` and calls `scheduleRebuild()` on any height change. Fixed on two levels: tabs use `fixedHeight: true` (story.md SHARED-D), so a tab change never changes the height, and the engine change in §4 / §7 rebuilds only when a scene's overflow changes. The fallback if the merger rejects the engine change is written down (§4: `focusTo(title, { afterLayout: true })`, re-snap via `goTo`, A8).
3. **Vertical swipes on the tab cards.** Accepted and verified: legal.md S7 says snap ignores *any* gesture that starts inside `[data-swipe-x]`, which contradicted this spec's "horizontal swipes". The rule is now "ignore only horizontal-dominant gestures, wherever they start; `[data-swipe-x]` is not an opt-out", with the replacement wording for engine.md A7 and legal.md S7 in §7. The tabs act only on horizontal-dominant swipes, and `[data-swipe-x]` uses `touch-action: pan-y pinch-zoom` (pinch-zoom stays; flow mode keeps native vertical scrolling).
4. **Flow-mode focus scrolls the page.** Accepted and verified: `makeFocusTo().focusNow` (partners.js ~172) calls `el.scrollIntoView({ block: 'start' })` when the film is off. New `focusNow` in §4: `preventScroll: true`, and only the scene is scrolled, only when it is not the snapped one. Proposed for every page (§7).
5. **Announcement through `aria-describedby` on a legend.** Accepted, first option: each step title is an `h3 tabindex="-1"` inside the legend, with the visually hidden ", step 3 of 8" inside the heading. The counter is `aria-hidden`; the "one announcement" rule stays because the heading carries the count itself.
6. **`film?.refreshReach?.()` can do nothing.** Accepted and verified: `refreshReach` is not in `film.js` or `film-flow.js` and not in engine.md (only services.md SHARED-8 proposes it). It is now a required engine export in both films (§7), and partners.js reports a missing export with `console.error` at start-up (§5.1).
7. **Phone terms note drops a placeholder and a sentence.** Accepted. Step 8 carries both notices in full, the same text as the desktop aside, on phones and portrait tablets. The shortened `.apply-step__terms` sentence pair is gone (§3.8, §6 item 8).
8. **Step index live behind the success panel.** Accepted. Success hides `.stepper__index`; "Edit My Application" shows it again, renders unit 1 and keeps `furthest`, because every unit passed validation before the send (§5.2).
9. **Credits unsigned.** Accepted. §3.10 is now a gate: the merger picks one id and the shared footer CSS, and partners.html is not signed off until fit-audit reports that scene at all 9 viewports with 0 overflow and the footer notice at 15 px on phones.

Also aligned while fixing these: the tabs markup and options now follow story.md SHARED-D (div panels with list roles, `.is-tabbed`, `fixedHeight`, `setTabStop` / `clearTabStop`), which overrides this page's earlier `data-tabs-list-role` attribute.

### 8.2 First critique (previous revision, all accepted)

1. Prototype not re-runnable: now `r4d\` with `EXTRA`, `FLOW`, `PROBE` and `HASH` switches and the raw results.
2. Fit margins smaller than the measuring noise: explained in 8.1 point 1 (film-ready race); the runner and fit-audit wait for `film-ready`.
3. Phone text too small: superseded by the full floor in §3.0.
4. Enter-key logic: the submit handler decides by unit; the WhatsApp button is the first submit button in tree order (§5.2).
5. Tab panels escaping parking: all tab-stop writes go through `setTabStop` / `clearTabStop`, plus `refreshReach` on every mode change (§4, §5.1).
6. Textareas as small scroll boxes: phones `clamp(72px, 12svh, 120px)` (§3.8).
7. Cramped phone Send row: visible "Send on WhatsApp →", phone-only hidden " My Application", `data-roll="none"`.
8. Consent links below 44 px: phone padding rule, also on the `#ask` Code of Conduct link (288×68 and 93×45 at 360×740).
9. Two announcements per step: one, from the focused heading (§5.2).
10. Compliance copy behind tab 03: listed as accepted in §6, notice unchanged and visible.
11. Credits fit not proven: now a sign-off gate (§3.10).
12. Keyboard scrolling the film off the form: keyboard-hold engine requirement and real-device test (§4, §7).
