# Round 4 · `index.html` (Home): one screen per scene

> **Merge amendments (2026-10-17, `shared.md` wins over this file where they differ)**
> - **Tokens** are `shared.md` §3. The pan padding is smaller than the engine.md D2 values this page was measured with (the budget is 11–15 px larger), so nothing here gets tighter. Do not re-declare `--u`, `--header-h` or `--scene-pad-*`.
> - **Text floor** (SHARED-H8 overridden):
>   - Every compliance and reading line is `var(--fs-note)`, which is **16 px from 760 px** (not 15) and 15 px on phones. Re-measure `find` at 1280×720 (−31 measured at 15 px).
>   - The floor block for `.notice/.hint/.ticks/.t-small` is in `ui.css`. home.css ends with its own floor block for `.offer__fine`, `.map__cap`, `.vframe__cap` and `.vframe__soon-text`.
>   - Delete `.intro .hint { font-size: 0.8125rem }`.
> - **§3.14 credits:**
>   - Use the `shared.md` §5.4 markup exactly: `.scene__pan` in the HTML, `<div class="globe-anchor globe-anchor--credits" data-globe-anchor aria-hidden="true">`, and no `data-pose-sm`.
>   - The footer and anchor CSS live in base.css and ui.css. Remove any copy of them from home.css.
>   - SHARED-H6 (the wide tagline) is **not adopted**.
> - **§3.7 founder tabs:** use `createTabs(root, { activeWhen: '(max-width: 759px)', fixedHeight: true, film, onModeChange: () => film.refreshReach() })` from `ui-tabs.js` (`shared.md` §6.1). The underline skin is in ui.css.
> - **§3.12 FAQ:** use `exclusiveAccordion(root)` from `ui-accordion.js` (`shared.md` §6.5) instead of a local `exclusiveFaq()`.
> - **§4 interact.js:** home does **not** edit interact.js. Put `data-tilt="wide"` on `.intro` (stage 2b adds the generic behaviour).
> - **§4 monogram:** chrome.js `fillSlots()` now fills every `[data-monogram]` (stage 2b). Drop home.js's own fill.
> - **Globe fitter:** `import { createPoseFitter } from './globe-fit.js'`, then register `film.on('build', createPoseFitter({ onlyAnchored: true }))`.
> - Rules that top-align a pan (§3.12, `scene--fill-stacked`) carry **no `html.film` prefix** (`shared.md` §4.2).
> - **Files this page may edit** are in `build-order.md` (home row). base.css, ui.css, film*.js and the other shared files are off limits. Shared needs go to `plan/round4/shared-requests.md`.

Brief and acceptance test: `PLAN.md` → "Round 4: one screen per section". Every scene must report **0 Y and 0 X overflow** in `tools/fit-audit.mjs` at the nine contract viewports, in film mode and in flow mode (reduced motion). Scrolling only moves between scenes.

This spec builds on the other Round 4 specs and uses their names. It does not invent parallel ones.
- `plan/round4/engine.md` §B2 (one scene box for film and flow), §C (removals, including `.lead-rule`), §D2 tokens (`--u`, the fluid `--fs-*` and `--space-*`, `--header-h`, `--bottom-h`, `--scene-pad-top`, `--scene-pad-bottom`, `--scene-safe-h`, `--media-h`, the short-screen guard).
- `services.md` SHARED-3 (`.scene--fill`), SHARED-5 (the `close` / `credits` split and the compact footer), SHARED-7 (`ui-tabs.js`, `.tabs*` classes and their underline style), SHARED-8 (`film.refreshReach()`, snap rules), SHARED-9 (coarse pointers keep 44 px), SHARED-11 (phone text floor).
- `story.md` SHARED-C (credits: globe by anchor, no lone footer line, phone footer compaction) and SHARED-D (`setTabStop()` / `clearTabStop()`, `.is-tabbed`).
- `legal.md` §9: no `.nowrap-md` inside reveal headings.

New shared proposals from this page are marked **SHARED-H…** in §5. Everything else in this file is page-local.

Assumed done before this page is built: the Round 4 removals (HUD, `.wa-float-wrap`, `.phone-bar`, sound and pause toggles, decorative dashes and `.lead-rule`), the engine tokens, and film-snap.

**Evidence.** Every "after" number below was measured in headless Chrome against the live page at `http://localhost:8000`, with this spec's CSS and markup moves injected (nothing under `site/` was edited). The prototype is in `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\r4home-rev\`:
- `tokens.css`: the engine.md D2 tokens and the removals;
- `spec.css`: this spec's CSS, verbatim, plus the shared rules it depends on (SHARED-7 tab style, SHARED-11 floor with the Home additions, SHARED-5/SHARED-C footer, the credits anchor);
- `sim.css`: simulates the home.css deletions this spec orders (`.intro .hint` 13 px, the `.offer__title--sm` cascade);
- `tiny.css`: the phone-tiny band (§2), the only rules used for 375×667;
- `b2.css`: the engine.md B2 flow box;
- `proto.js`: the markup moves (§3);
- `fit.mjs` (overflow per scene, worst of every FAQ item open in turn and every founder tab in turn; `FLOW=1` for flow mode; `A11Y=1` for font sizes, tap targets, video and map sizes) and `geo.mjs` (element geometry inside one scene).

Nothing in the prototype is outside this spec: no undocumented token, gap or font override.

---

## 0. Summary

| # | scene | field | move | after, film (worst slack in px; negative = room left) |
|---|---|---|---|---|
| 1 | `hero` | ink | **re-layout**. The proof strip moves out. Phone: the form loses its card. The lead loses one redundant sentence. | 1280×720 −160 · 360×740 −22 · 375×667 −37 |
| 2 | `proof` **NEW** | ink | **split (new scene)**: proof strip + the two client quotes (from `founder`). **Launch rule** in §3.2. | 1280×720 −329 · 360×740 −215 |
| 3 | `video` | bone | fluid scale; the frame is width-led and capped by the budget | 1280×720 −193 · 360×740 −109 |
| 4 | `situations` | gold | fluid scale | 1280×720 −297 · 360×740 −128 |
| 5 | `compare` | bone | fluid scale + phone density | 1280×720 −342 · 360×740 −152 |
| 6 | `how-it-works` | ink | fluid scale | 1280×720 −278 · 360×740 −111 |
| 7 | `founder` | bone | quotes move to `proof`. **Tabs on phone** (`ui-tabs.js`, shared underline style). | 1280×640 −118 · 360×740 −28 · 375×667 −46 |
| 8 | `services` | gold | fluid scale + phone tile re-layout | 768×1024 −230 · 360×740 −101 |
| 9 | `find` | ink | **re-layout**: the map takes the leftover height in stacked bands; the intro paragraph becomes one sentence | 1280×720 −31 · stacked: 0 by construction, map 235×204 at 360×740 |
| 10 | `story` | bone | fluid scale (monogram sized on `--u`) | 1280×720 −323 · 360×740 −206 |
| 11 | `partners` | gold | fluid scale (title on `--u`) | 1280×640 −97 · 360×740 −63 |
| 12 | `faq` | bone | **exclusive accordion** (`<details name>`), top-aligned in both modes | worst item open: 1280×720 −303 · 360×740 −120 |
| 13 | `close` | ink | footer moves out; `.nowrap-md` dropped | 1280×720 −253 · 360×740 −255 |
| 14 | `credits` **NEW** | ink | **split (new scene)**: compact footer (SHARED-5), globe by anchor (SHARED-C) | 1280×720 −204 · 360×740 −98 |

There are 12 scenes today and 14 after (13 before launch if `proof` is withheld, §3.2). The new component is responsive tabs (`ui-tabs.js`, services SHARED-7) on the founder offers, phone only. No stepper, no pager and no dialog are needed on Home.

### 0.1 Full "after" tables

Film mode (`fit.mjs`, worst state per scene; `/xN` = X figure, see the note):

| viewport | hero | proof | video | situ. | compare | how | founder | services | find | story | partners | faq | close | credits |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1920×1080 | −446 | −532 | −450 x | −582 | −588 x | −517 x | −426 x | −546 | −255 | −522 | −472 | −619 | −497 | −469 |
| 1536×864 | −272 | −427 | −255 x | −402 | −441 x | −369 x | −274 x | −365 | −66 | −399 | −310 | −432 | −351 | −297 |
| 1440×900 | −297 | −450 | −290 x | −427 | −464 x | −392 x | −297 x | −388 | −100 | −415 | −335 | −462 | −374 | −318 |
| 1366×768 | −199 | −363 | −203 x | −332 | −376 x | −305 x | −210 x | −321 | −31 | −350 | −218 | −347 | −287 | −236 |
| 1280×720 | −160 | −329 | −193 x | −297 | −342 x | −278 x | −175 x | −295 | −31 | −323 | −159 | −303 | −253 | −204 |
| 1024×768 | −193 | −352 | −337 | −181 | −255 x | −312 x | −184 x | −378 | −175 | −359 | −246 | −169 | −303 | −236 |
| 768×1024 | −249 | −554 | −240 | −393 | −411 | −517 | −211 | −230 | 0 | −425 | −453 | −396 x | −555 | −278 |
| 390×844 | −94 | −295 | −174 | −212 | −238 | −193 | −108 | −205 | 0 | −315 | −204 | −231 x | −340 | −181 |
| 360×740 | −22 | −215 | −109 | −128 | −152 | −111 | −28 | −101 | 0 | −206 | −63 | −120 x | −255 | −98 |
| 1280×640 * | −96 | −271 | −115 x | −235 | −283 x | −221 x | −118 x | −233 | −31 | −272 | −97 | −229 | −195 | −150 |
| 375×667 * | −37 | −180 | −99 | −105 | −105 | −68 | −46 | −69 | 0 | −215 | −64 | −95 x | −214 | −59 |

\* not in the contract. 375×667 uses the phone-tiny band (§2), and nothing else.

Flow mode (`FLOW=1`, engine B2 box): every scene fits at every viewport, within 2 px of the film figure except where the flow box gives more room (hero 1920×1080 −384, video 1280×720 −216, partners 360×740 −95, founder 375×667 −62). The tightest flow scenes are hero 360×740 −22 and founder 360×740 −29.

Note on the X figures: the video, compare, how-it-works and founder X figures (9–64 px) are the pre-reveal 3D from-states of non-active scenes, as in §1. The faq `/x9–10` appears with item 3 or 4 open and is the same on today's unmodified page (measured: `+10` with item 3 open, no element box crosses the pan edge). The hardened audit (story SHARED-A) decides; if it still reports it at the hold, add `.acc__body { overflow-x: clip; }`.

---

## 1. Current overflow (fit-audit, before removals; box = stage − 76 header − 72 bottom)

Y overflow in px. "x" marks an X figure the hardened audit must ignore (see the notes).

| viewport | hero | video | situations | compare | how | founder | services | find | story | partners | faq | close |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1920×1080 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1536×864 | 0 x | 0 x | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **+221** x |
| 1440×900 | 0 x | 0 x | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **+176** x |
| 1366×768 | 0 x | 0 x | 0 | 0 | 0 | **+50** | 0 | 0 | 0 | 0 | 0 | **+284** x |
| 1280×720 | **+42** x | 0 x | 0 | 0 | 0 | **+87** | 0 | 0 | 0 | 0 | 0 | **+313** x |
| 1024×768 | **+5** x | 0 x | 0 | 0 x | 0 | **+8** | 0 | 0 | 0 | 0 | 0 | **+224** x |
| 768×1024 | 0 x | 0 x | 0 | 0 | 0 | 0 | 0 | **+135** | 0 | 0 | 0 | **+25** x |
| 390×844 | **+393** x | 0 x | 0 | 0 | 0 | **+459** | **+3** | **+93** | 0 | 0 x | 0 | **+477** x |
| 360×740 | **+539** x | 0 x | 0 | **+121** x | **+31** | **+590** | **+124** | **+217** | 0 | **+28** x | 0 | **+572** x |

Notes:
- 1920×1080 ran in flow mode: the film never reached `.film-ready` in headless Chrome (story.md SHARED-A).
- FAQ was measured with only item 1 open. With every item open it overflows on phones (+92 at 360×740). §3.12 fixes it for good.
- **Every X figure is a false positive.** Each culprit was classified:
  - `hero span.nobr` (+129 to +441) and `close span.nowrap-md` (+7 to +342) sit inside the visually hidden `.tx-sr` copy of a split heading (aria-hidden or clipped).
  - `video .vframe*` (+16 to +214) carries the pre-reveal 3D from-state (`rotationY −18`, `scale 1.18`) of a non-active scene.
  - In screenshots at the hold, no Home scene overflows X.
  - The close fix below still drops `.nowrap-md`, as legal.md asks.

Space after the removals, with the engine.md D2 tokens: the content budget (`--scene-safe-h`) is

| 1920×1080 | 1536×864 | 1440×900 | 1366×768 | 1280×720 | 1024×768 | 768×1024 | 390×844 | 360×740 |
|---|---|---|---|---|---|---|---|---|
| 945 | 756 | 788 | 670 | 624 | 670 | 896 | 734 | 643 |

---

## 2. Bands

| band | media query (used below) | notes |
|---|---|---|
| **wide** | base rules (≥ 1100 px wide, landscape) | 12-column grid, uneven splits as today |
| **laptop-short** | `@media (min-width: 1024px) and (max-height: 800px)` | engine.md's guard `(min-width: 760px) and (max-height: 760px)` already shrinks `--space-xl`. Home adds no rule of its own here. |
| **tablet portrait** (768×1024) | existing `(min-width: 760px) and (max-width: 1099px)` with `.md-span-12` stacking; `(max-width: 1099px) and (max-aspect-ratio: 1/1)` = **stacked bands** (tablet portrait + phones) | |
| **phone** | `@media (max-width: 759px)` | every phone ≤ 430 px wide |
| **phone-short** | `@media (max-width: 759px) and (max-height: 760px)` | 360×740 and shorter |
| **phone-tiny** | `@media (max-width: 759px) and (max-height: 700px)` | 375×667 (iPhone SE). Not in the contract. Below 560 px tall: the engine's pan fallback. |

Type comes only from the shared tokens. Home overrides a token only in the phone-tiny band (below), and every override is written with `var(--u)`, `svh` or `rem`, never `vw`. Token values at the contract sizes are in engine.md §D2 (for example, d1 is 61 px at 1280×720 and 33 px at 360×740).

**Phone-tiny band: the complete rule set** (`tiny.css`; it is all that 375×667 needs, and it is proposed for base.css as SHARED-H1):
```css
@media (max-width: 759px) and (max-height: 700px) {
  :root { --scene-pad-top: 6px; --scene-pad-bottom: 8px; --fs-d1: 1.75rem; --fs-d2: 1.5rem; }
  .hero__title { font-size: 1.75rem; }
  .hero__copy.stack { --stack: 6px; }
  .intro { gap: 8px; }
  #founder .stack-l { --stack: 12px; }
  .offer { gap: 8px; }
}
```
- `--fs-lead` is not touched, and no text goes under the 15 px phone floor.
- Every tap target stays at 44 px: chips, tabs and the WhatsApp button keep their phone sizes (services SHARED-9).
- Measured at 375×667: hero −37, founder −46; every other scene −59 or better (table 0.1).

---

## 3. Scenes

### 3.1 `hero` (ink): re-layout

**Move:** re-layout. `.proof` leaves this scene for the new `proof` scene (§3.2).
- Wide and laptop-short: the 7/5 promise | form split stays, vertically centred.
- Phone: the form drops its card chrome (no panel, padding, border or shadow) and has **no top rule**. The chips sit in a 3 × 2 grid.

**Removed decoration (engine.md §C, line 572).** `.lead-rule` comes off the form (`index.html` ~112). The `.intro` card's own `border-top: 2px solid var(--accent)` (home.css ~30) draws the same gold rule above the form, so it goes too: on wide screens the card keeps its 1 px `--line` border on all four sides.

**Wide / laptop-short** (1280×720 −160)
- Grid: unchanged, `.span-7` copy | `.span-5` `.intro`. `.hero__title` keeps `font-size: min(var(--fs-hero), 11cqi)` (≈ 72 px at 1280×720, three lines).
- `.intro`:
  - `gap: clamp(10px, 1.4 * var(--u), 20px)`;
  - `padding: var(--space-l) var(--space-l) var(--space-m)`;
  - delete `border-top: 2px solid var(--accent)` (the `border: 1px solid var(--line)` line stays).
- The two hints and the ticks are 15 px from 760 px (SHARED-H8).

**Tablet portrait:** stacked as today (`md-span-12`). 768×1024 −249.

**Phone** (360×740 −22; 375×667 −37 with the phone-tiny band)
- The stack keeps today's order: eyebrow / h1 / lead / ticks / form.
- `.hero__title`:
  - `font-size: min(var(--fs-hero), 10cqi)` (33 px at 360);
  - three lines: "The Right Professional / Near You, / From One Message."
- `.hero__copy.stack { --stack: 10px }`.
- `.hero .eyebrow { letter-spacing: 0.14em }`, so "Free introductions · across Canada" stays on one line (today it takes two).
- `.hero__copy .t-lead { font-size: 0.9375rem; line-height: 1.5 }`.
- `.hero .ticks { gap: 4px 14px }`. No font-size rule: the ticks take the 15 px floor (SHARED-11).
- `.intro`:
  - `padding: 0; background: none; border: 0; box-shadow: none; gap: 12px;`
  - `.intro__title` becomes visually hidden; it stays the form's accessible name through `aria-labelledby`. Write the `.visually-hidden` declarations inside the `@media` rule. Do not add the class, because it would also hide the title on wide screens.
- `.intro__chips { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }`
  - `.intro__chips .chip { justify-content: center; padding: 0 6px; }`
  - Chips stay 44 px tall.
- `.intro .hint { line-height: 1.4 }`. No font-size rule: the hints take the 15 px floor.
- `.intro__go { min-height: 52px; padding: 0.7em 1em; font-size: 0.9375rem }`. The label "Get My Introduction on WhatsApp →" fits on one line at 296 px.
- Phone-short: `.intro { gap: 10px } .intro__go { min-height: 48px }`.
- Phone-tiny: see §2.

**Markup** (index.html)
```html
<!-- before -->
<p class="t-lead" data-reveal="fade">Tell us what you need and your city. We introduce you to a professional close to you, usually within <span class="ph">[24&nbsp;hours]</span>. The introduction costs you nothing.</p>
…
<form class="span-5 md-span-12 keep-md intro lead-rule" id="intro-form" …>
…
          </div>   <!-- /.grid.hero -->

          <ul class="proof" data-reveal="stagger" aria-label="Cargado in numbers (to be confirmed)"> … </ul>
        </div>     <!-- /.scene__inner -->

<!-- after -->
<p class="t-lead" data-reveal="fade">Tell us what you need and your city. We introduce you to a professional close to you, usually within <span class="ph">[24&nbsp;hours]</span>.</p>
…
<form class="span-5 md-span-12 keep-md intro" id="intro-form" …>
…
          </div>   <!-- /.grid.hero -->
        </div>     <!-- /.scene__inner   (the <ul class="proof"> is moved, unchanged, to #proof) -->
```
- **Copy shortening:** "The introduction costs you nothing." goes. The meaning stays on the screen in the tick "No fee to you", and it is repeated word for word in the close lead and the meta description. The sentence is removed at every size; there is no option to keep it (with the floor on, 360×740 has 22 px of slack without it).

**CSS** (home.css, "Hero" section): add the rules above under `@media (max-width: 759px)` and phone-short. Delete:
- the old phone rule `.intro { padding: var(--space-m); }`;
- `.intro .hint { font-size: 0.8125rem; }` (home.css ~35). It out-specifies the shared floor (`.hint`), so it must go, not be overridden.
- No Home rule may set a font-size on `.hint`, `.ticks`, `.notice`, `.offer__fine` or `.map__cap` below 0.9375rem at any width.

**JS:**
- `wireIntroForm()` must stop calling `chrome.setBar(…)`, because the phone bar has been removed. Delete the line. Keep `targets` and the `#how-go` / `#close-go` sync.
- Tilt: see §4 (`.intro` does not tilt at ≤ 759 px wide).
- Everything else is unchanged: the hero drift tween, chip sfx and magnetic pull.

**Compliance copy (verbatim, 15 px at every width):**
- "We ask for your city only so we can introduce you to someone close to you."
- "Opens WhatsApp with your message written. Nothing is sent until you tap send."
- The ticks "No fee to you", "No obligation", "Licence shown where one applies".
- `[24 hours]`.

---

### 3.2 `proof` (ink): NEW scene, split

**Why:**
- On phones the hero cannot hold copy + form + proof (+393 / +539).
- The founder scene cannot hold offers + quotes (+459 / +590).
- The proof strip and the two client quotes are one idea, "proof", so they become one scene right after the promise.

**Launch rule (required).** Today every value in this scene is a CR16 placeholder (`[n]` ×3, `★ [rating]`, two placeholder quotes). A whole scene of placeholders must not go live.
- **Build and preview:** `#proof` is built as below, with every placeholder visible. PLAN.md forbids dropping placeholders during the build, and the scene is where they live.
- **Public launch:** ship `#proof` only when real figures and at least one real, consented client quote exist. If they do not exist at launch, withhold the whole section (delete it from `index.html`; the film builds from the DOM, so no engine change is needed). Hero and founder fit without it, because neither depends on it (table 0.1). The withheld markup stays in the repo history and in this spec.
- This is a content decision for the founder. Record it in the launch checklist next to the CR16 items.

**Attributes**
```html
<section class="scene proof-scene" id="proof" data-field="ink" data-dur="4" data-iris="50% 50%"
         data-pose="2.95,-1.25,-0.5,0.2,-0.4,0.8" data-pose-sm="3.45,-1.55,-0.5,0.2,-0.4,0.85"
         data-title="Cargado So Far" aria-labelledby="proof-title">
```
- The field is ink, the same as `hero`, so the engine crossfades. There is no iris; `data-iris` is a placeholder.
- The pose sits halfway between hero (`1.66,0.05,…,1.5`) and video (`3.45,-1.7,…,0.95`): the globe sinks to the lower right while it travels to the video's pose.

**Markup** (new; only the heading copy is new, the rest moves unchanged)
```html
<div class="scene__inner">
  <div class="proof-grid stack stack-l">
    <div class="stack proof-grid__head">
      <p class="eyebrow" data-reveal="fade">Cargado so far</p>
      <h2 id="proof-title" class="t-d1" data-reveal="lines">In Numbers, and in Their Own&nbsp;Words.</h2>
    </div>
    <ul class="proof" data-reveal="stagger" aria-label="Cargado in numbers (to be confirmed)">
      … the four <li> exactly as in today's hero …
    </ul>
    <div class="grid quotes quotes--proof" data-reveal="fade">
      … the two <figure class="span-6 md-span-6 quote" data-tilt> exactly as in today's #founder …
    </div>
  </div>
</div>
```
- **Heading copy: not approved.** The eyebrow "Cargado so far" and the h2 "In Numbers, and in Their Own Words." are proposals for the founder to approve before launch. They make no claim.

**CSS** (home.css, new "Proof" section; all sizes)
```css
.proof-scene .proof { grid-template-columns: 1fr 1fr; margin-top: 0; border-top: 0; }   /* no rule above the strip */
.proof-scene .proof > li:nth-child(3) { padding-left: 0; border-left: 0; }
.proof-scene .proof > li:nth-child(n+3) { border-top: 1px solid var(--line); }        /* divider between the two rows */
.proof-scene .proof__n { font: 400 var(--fs-d2)/1 var(--font-display); color: var(--accent); }
.quotes--proof { padding-top: 0; }
.quotes--proof blockquote { font: italic 400 var(--fs-d4)/1.3 var(--font-display); }
@media (min-width: 760px) {
  .proof-grid { display: grid; grid-template-columns: 5fr 7fr; gap: var(--gap-row) var(--gap-col); align-items: center; }
  .proof-scene .proof > li { padding-block: var(--space-m); }
  .quotes--proof { grid-column: 1 / -1; }
}
```
- Lines in this scene are **only the dividers between stat cells**: today's `li + li` left border (vertical, between columns) and the `nth-child(n+3)` top border (horizontal, between rows). There is no rule above the strip and no drawn rule.
- `.proof__n` is `--fs-d2` (46 px at 1280×720, 28 px at 360×740) at every size, not `--fs-d1`, while the values are placeholders. When real figures land, the founder may raise it to `--fs-d1` on ≥ 760 px; re-run fit-audit if so.
- Wide/tablet: head left, the 2 × 2 strip right, the quotes in a row of two underneath. Phone: one column, head / strip 2 × 2 / quotes stacked.

**Measured:** 1280×720 −329, 768×1024 −554, 360×740 −215.

**Hooks**
- Reveals:
  - eyebrow → automatic decode;
  - h2 `lines` → automatic chars;
  - `.proof` stagger (unchanged);
  - `.quotes` fade (unchanged; the reveal sits on the wrapper, never on a `[data-tilt]` figure).
- No home-tweens builder. (The previous draft's optional `.proof__rule` draw is dropped: it was a decorative rule.)
- The scene has no controls. The film's reach logic lets Tab skip from hero to video (unchanged behaviour).
- Deep link `index.html#proof` works by default. Nothing else on the site links to it.

**Compliance:**
- `aria-label="Cargado in numbers (to be confirmed)"`;
- `[n]` ×3 and `★ [rating]` "on Facebook";
- `“[Real client quote about the outcome]”`, `“[Real client quote about the speed]”`, and `[name] · [city] · [service]` ×2.
- These are CR16 placeholders: never fill them with invented content.

---

### 3.3 `video` (bone): fluid scale, width-led frame

- **Move:** fluid scale (the tokens), and a frame that can never outgrow the budget.
- **Today:** fits everywhere (X false positives only).
- **After:** 1280×720 −193, 360×740 −109. The frame keeps today's size at every contract viewport: 751×436 at 1280×720, 905×523 at 1920×1080, 707×397 at 768×1024, 328×185 at 360×740.
- Wide, laptop-short and tablet: unchanged 5/7. Phone: unchanged order (copy, then frame).

**CSS** (home.css, "Video frame"; `.vframe__clip` keeps its `aspect-ratio: 16 / 9`)
```css
.vframe__clip { width: 100%; max-width: calc((var(--scene-safe-h) - 3rem) * 16 / 9); margin-inline: auto; }
@media (max-width: 1099px) and (max-aspect-ratio: 1/1) {          /* stacked bands only */
  .vframe__clip { max-width: min(100%, calc(var(--media-h) * 16 / 9)); }
}
.vframe__cap { text-transform: none; letter-spacing: 0.02em; line-height: 1.4; }   /* 15 px: SHARED-H8 / SHARED-11 */
```
- **Why width-led:** `.vframe__clip`'s only children (`.vframe__media`, `.vframe__ui`) are absolutely positioned. With `width: auto` the grid item shrinks to 0 wide and the aspect ratio makes it 0 tall: the video disappears. Never give it `width: auto` or a `max-height`.
- The height cap is written as a width cap: the frame's height is at most the budget minus 3rem for the caption. `--media-h` (40svh) applies only in the stacked bands, where copy sits above the frame; on wide screens it would shrink the frame (436 → 288 px tall at 1280×720).

**Hooks:**
- The `video()` tweens stay.
- `film.on('scene')` still pauses the player.
- The play button sfx stays.

**Compliance** (text written by home-video.js; keep it):
- "Founder video coming soon";
- "One minute · captions included when it arrives";
- "Licensed stock footage for now".
- `.vframe__cap` is 15 px at every width (sentence case, so it stays two lines at most). `.vframe__soon-text` is 15 px on phones (SHARED-11) and stays a 13 px tracked status label on wider screens; it sits inside the absolutely positioned frame, so its size never changes the scene height.

---

### 3.4 `situations` (gold): fluid scale

- **Move:** fluid scale.
- **After:** 1280×720 −297, 360×740 −128.
- No structural changes.

**Hooks:** `data-tilt` rows, `[data-depth]` on `.situation__n` / `.situation__arrow`, and the `situations()` tweens are all unchanged.

---

### 3.5 `compare` (bone): fluid scale + phone density

- **Move:** fluid scale, plus phone density.
- **Today:** +121 at 360×740.
- **After:** 1280×720 −342, 360×740 −152.
- Wide: unchanged 5/7.
- Phone:
  - `.compare__side { padding: var(--space-s) var(--space-m); gap: var(--space-s) }`;
  - `.compare__list { gap: 6px }`;
  - `.compare__own .compare__list > li, .compare__us .ticks { font-size: 0.9375rem }`.
- The h2 keeps its `.nobr` "Instead of" span. It is not a `.nowrap-md`, and its hidden copy is ignored by the hardened audit.

**Compliance:** "Licence shown where one applies"; "We follow up on day [3]".

---

### 3.6 `how-it-works` (ink): fluid scale

- **Move:** fluid scale.
- **Today:** +31 at 360×740.
- **After:** 1280×720 −278, 360×740 −111.
- Phone: unchanged (`.process__steps` one column).
- The `.stack-xl` gap now follows the fluid `--space-xl`.

**Hooks:** the `process()` tweens (line `scaleX`, dot clip-path) are unchanged.

---

### 3.7 `founder` (bone): quotes out; tabs on phone

**Move:**
- The quotes move to `proof` (§3.2). That alone fixes 1366×768 and 1280×720.
- Phone: the three offers become **responsive tabs** in the **shared underline style** (services SHARED-7): one offer at a time. Wide and tablet: all three show, as today, with no tab row.

**Wide / laptop-short** (1280×720 −175, 1280×640 −118)
- Grid: unchanged.
  - Heading row: `.span-7` h2 | `.span-5` note.
  - Offers: 6/3/3.
- `.offer__title { font-size: clamp(1.5rem, calc(0.9rem + 2 * var(--u)), 2.75rem) }`. Edit the existing rule (home.css ~203) **in place**, so the later `.offer__title--sm` rules (home.css ~207 and the phone rule ~318) still win for the two small cards.
- `.offer__fine` is 15 px from 760 px (SHARED-H8).

**Tablet portrait:** stacked as today. 768×1024 −211.

**Phone** (360×740 −28 with the lead panel, the tallest; 375×667 −46 with the phone-tiny band)
- Order: eyebrow / h2 / note / **tab row** / the selected offer.
- `#founder .scene__pan { margin-top: 0 }`: top-aligned on phones, so a panel of a different height never moves the tab row under the finger.
- `.offer__title { font-size: var(--fs-d2) }` (inside the phone `@media`, placed before the `.offer__title--sm` phone rule).
- `.offer__fine` and `.offer p` keep the phone floor (15 px). There is no phone-tiny text override.

**Markup**
```html
<!-- before -->
<div class="grid offers" data-reveal="stagger">
  <article class="span-6 md-span-12 keep-md offer offer--lead" data-cursor-label="Founder"> …
  <article class="span-3 md-span-6 keep-md offer" data-cursor-label="Founder"> … Family Protection Review …
  <article class="span-3 md-span-6 keep-md offer" data-cursor-label="Founder"> … Back-Office Team …
</div>
<div class="grid quotes" data-reveal="fade"> … </div>          <!-- moves to #proof -->

<!-- after -->
<div class="tabs offers-tabs" data-tabs-label="Our founder's three services">
  <div class="tabs__list" data-reveal="fade">
    <button class="tabs__tab" type="button" data-tab="offer-cashflow">Cash-Flow</button>
    <button class="tabs__tab" type="button" data-tab="offer-family">Protection</button>
    <button class="tabs__tab" type="button" data-tab="offer-backoffice">Back-Office</button>
  </div>
  <div class="grid offers" data-reveal="stagger">
    <article id="offer-cashflow" class="span-6 md-span-12 keep-md offer offer--lead tabs__panel" data-cursor-label="Founder"> … unchanged …
    <article id="offer-family" class="span-3 md-span-6 keep-md offer tabs__panel" data-cursor-label="Founder"> … unchanged …
    <article id="offer-backoffice" class="span-3 md-span-6 keep-md offer tabs__panel" data-cursor-label="Founder"> … unchanged …
  </div>
</div>
```
- The tab buttons are static HTML without roles. `ui-tabs.js` adds the roles and `.is-tabbed` on the root only in tab mode (story SHARED-D). Without JS, or before init, the row is not shown, so there are no dead buttons.

**CSS** (home.css; the `.tabs__*` base styles are the shared SHARED-7 rules, unchanged: `.tabs__list` with `border-bottom: 1px solid var(--line)`, `.tabs__tab` with a 2 px `--accent` underline on the selected tab)
```css
.offers-tabs .tabs__list { display: none; }
@media (max-width: 759px) {
  .offers-tabs.is-tabbed .tabs__list { display: flex; margin-bottom: var(--space-m); }
  .offers-tabs .tabs__tab { flex: 1 1 0; padding: 0 4px; font-size: 0.9375rem; }   /* three equal tabs in 328 px, 15 px labels */
  .offers-tabs .offers { grid-template-columns: 1fr; }
  .offers-tabs.is-tabbed .offer__rule { display: none; }   /* the tab row's line already sits above the panel */
  html.film .offers-tabs .tabs__panel:not([hidden]) { animation: offer-in 0.35s var(--ease) both; }
}
@keyframes offer-in { from { clip-path: inset(0 0 0 100%); } } /* clip-path only: the stagger reveal owns opacity/transform */
@media (prefers-reduced-motion: reduce) { html.film .offers-tabs .tabs__panel { animation: none; } }
```
- No pills: Home uses the same tabs as services, legal and partners. Home adds only `flex: 1` (equal widths), tighter side padding and the 15 px label.
- In tab mode the lead card's `.offer__rule` is hidden, so the panel does not show a second line right under the tab row's rule. The `founder()` tween on it is harmless while it is hidden, and it draws as today on wide screens.

**JS** (home.js, before `boot()`, after `renderContent()`):
```js
import { createTabs } from './ui-tabs.js';
const offerTabs = createTabs(document.querySelector('.offers-tabs'), {
  activeWhen: '(max-width: 759px)',
  onModeChange: () => film.refreshReach(),
});
```
- **ui-tabs contract** (services.md 7.4 + story.md SHARED-D):
  - In tab mode, the list gets `role="tablist"` + `aria-label` from `data-tabs-label`, and the root gets `.is-tabbed`.
  - Each button gets `role="tab"`, `id`, `aria-controls`, `aria-selected`, and a roving tab stop through `setTabStop()`. That helper writes into `data-film-tab` while the founder scene is parked.
  - Each panel gets `role="tabpanel"` and `aria-labelledby`, and inactive panels get `hidden`.
  - Panels contain links, so they get no `tabindex`.
  - Keys: ←/→ move and activate, Home/End jump. Film-snap ignores arrows while focus is in `[role=tablist]` (SHARED-8). Focus stays on the tab, and the selection is announced natively, so there is no aria-live region.
  - Out of tab mode, the roles, `aria-*`, `hidden` and `.is-tabbed` are removed, and every tab stop ui-tabs wrote is dropped through `clearTabStop()`.
  - The default tab is Cash-Flow (the lead offer).
- **Reveals:**
  - The stagger stays on `.offers`. A hidden panel keeps its scrubbed opacity, so it is correct when shown.
  - The `founder()` tween on `.offer__rule` stays.
  - The decode on "Most asked for" stays.
- **Tilt / magnetic:** `.offer` stays in the interact.js TILT list (tilt runs only on fine pointers). The tabs are `button`s; sfx pops on `[role="tab"]` automatically. They are not `.btn`, so they get no magnetic pull or letter-roll, as for every shared tab row.
- **Deep links:** none target the offers. The `services.html#business-strategy`, `#insurance` and `#outsourcing` links inside the panels are unchanged. `#ask-insurance` / `#ask-outsourcing` are still wired by `wireAskLinks()`, whichever tab shows.
- **Reduced motion / flow:** the same tabs run, with no clip animation. Flow 360×740: −29.

**Compliance (verbatim):**
- "Her own businesses, named as hers and shown separately from the independent partner network."
- "[company name] · business strategy · strategy and coaching only, not licensed accounting, tax or investment advice." (CR12; `.offer__fine`, 15 px at every width)
- "[company name] · licence [#] · [regulator]" (CR01, CR13)
- "Provided by Cargado Strategies itself."
- "[2] spots open in [month]"; "30 min · insurance"; "Outsourcing · from [$x]/hr".

---

### 3.8 `services` (gold): fluid scale + phone tile re-layout

- **Move:** fluid scale; phone re-layout.
- **Today:** 390×844 +3, 360×740 +124.
- **After:** 768×1024 −230, 1280×720 −295, 360×740 −101.

**Wide / laptop-short** (edit the existing base rules in place, so the later landscape-tablet and phone rules still win):
- Unchanged: 4/8, 3 × 3 tiles.
- `.tile { min-height: clamp(96px, 15svh, 132px) }`.
- `.tile__name { font-size: clamp(1.25rem, calc(0.9rem + 0.9 * var(--u)), 1.875rem) }`.

**Tablet portrait:** 2 columns, 5 rows (existing). Add `@media (min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1) { .tile { min-height: 0; padding: var(--space-s) 0 } }`.

**Phone:**
- `.tile__n { display: none }`. The 01–09 ordinal repeats the list order, and the `ul` already conveys it.
- `.tile { min-height: 0; grid-template-areas: "name go" "own own"; padding: 10px 0; gap: 2px 8px }`.
- Keep `.tile__name { font-size: clamp(1.0625rem, 5vw, 1.375rem) }`. No tile name breaks mid-word at 360 px.

**Hooks:** `renderTiles()` is unchanged. The tile depth layers and the `services()` flip-down tween stay.

**Compliance:**
- "Each one says whether it’s our founder’s own business or an independent partner’s." (CR13)
- The ownership labels "From our founder" / "Partner network" / "Founder + partners".

---

### 3.9 `find` (ink): map takes the leftover height

- **Move:** re-layout.
- In the stacked bands the text block takes its natural height and the map takes what remains (services SHARED-3 pattern). The map never drops under 180 px tall.
- **Today:** 768×1024 +135, 390×844 +93, 360×740 +217.
- **After:** wide 1280×720 / 1366×768 / 1280×640 −31 (set by the map cap below). Stacked: 0 by construction, with no overlap. Map size: 360×740 **235×204**, 375×667 218×190, 390×844 358×312, 768×1024 620×538.

**Copy (intro paragraph, every size).** The two-sentence intro is not compliance copy. It becomes one sentence, so the phone map stays a map and not a thumbnail:
```html
<!-- before -->
<p data-reveal="fade">Choose a service, then pick a place on the map of Canada or type your city. The nearest partners appear, closest first, with the distance shown.</p>
<!-- after -->
<p data-reveal="fade">Pick a service and your city to see the nearest partners first.</p>
```
"Closest first" is still said by the notice ("Sorted by distance only") and shown by the finder itself. The founder may reword it; keep it to one line on wide screens and two at 360 px.

**Markup:** add the class only: `<section class="scene scene--fill-stacked" id="find" …>` (or `.scene--fill` + the media query below if SHARED-3 lands under that name).

**CSS** (home.css)
```css
/* every band: never taller than the budget (replaces 100svh − header − bottom − 120px) */
.map__svg { max-height: calc(var(--scene-safe-h) - 4rem); }
.map__cap { text-transform: none; letter-spacing: 0.02em; line-height: 1.4; }   /* 15 px at every width (SHARED-H8 / SHARED-11) */

/* stacked bands (portrait tablet + phones): fill. No html.film prefix: flow mode (engine B2) uses the same box. */
@media (max-width: 1099px) and (max-aspect-ratio: 1/1) {
  #find .scene__pan { height: 100%; margin: 0 auto; }
  #find .grid { height: var(--scene-safe-h); grid-template-rows: auto minmax(0, 1fr); align-items: stretch; }
  #find .map { min-height: 0; grid-template-rows: minmax(0, 1fr) auto; }
  #find .map__lift { min-height: 180px; display: flex; justify-content: center; }
  #find .map__svg { height: 100%; width: auto; max-width: 100%; max-height: none; }
}
```
- Wide is unchanged: 5/7, map right. `- 4rem` leaves the caption and its gap inside the budget with 31 px to spare at 1280×720.
- The caption is set in sentence case so that at 15 px it is two lines at 360 px (four in uppercase tracking).
- **Fit check for this scene:** the grid has a fixed height, so overflow would show as overlap, not as scroll height. The build loop checks that the text column ends above `.map` and that `.map__cap` ends inside `.grid` (`geo.mjs` measures it: at 360×740 the text ends at 392, the map starts at 404, the caption ends at 662 of 662).
- If a later copy change makes the text block taller and the 180 px floor is hit, move the CTA button under the map on phone-short; never shrink the notice.

**Hooks:**
- The `find()` tweens (3D stand-up, clip-path circle from the hub, pins, rings, labels) are unchanged.
- `renderCanadaMap()` is unchanged. Its `viewBox` scales to any height.
- `#find` sets `data-map-hub` before boot, as today.

**Compliance (verbatim, never shortened, 15 px at every width):**
- "Sorted by distance only. Partners are independent, and a listing is not a recommendation. Cargado Strategies may receive a commission when a referral becomes a client. [Wording to be confirmed by counsel]" (FR29–31, CR14, CR17)
- The caption "Map preview · cities shown for illustration, not listed partners".

---

### 3.10 `story` (bone): fluid scale

- **Move:** fluid scale.
- **After:** 1280×720 −323, 360×740 −206.
- `.story-mark__lift { width: clamp(120px, calc(22 * var(--u)), 340px) }`. This replaces the fixed 340; delete the landscape-tablet 240 px rule. It gives 237 px at 1280×720 and 340 at 1920. The phone rule (140 px) stays.
- `.story__title`: keep `min(var(--fs-d1), 5.6vw)` from 760 px.

**Hooks:** the `story()` tweens (monogram turn, clip-path sweep, letters) are unchanged.

**Compliance:** no Mark 11:24 on Home (CR08/15): keep it so.

---

### 3.11 `partners` (gold): fluid scale

- **Move:** fluid scale.
- **Today:** 360×740 +28.
- **After:** 1280×720 −159, 1280×640 −97, 360×740 −63 (with the 15 px compliance text on every width).
- `.partners__title { font-size: clamp(1.75rem, calc(0.9rem + 2.8 * var(--u)), 4rem) }`. This replaces `1.1rem + 3vw`, which made it the tightest scene at 1280×640.
- Wide: the copy stays in 7 columns.

**Compliance (verbatim; the `.ticks` item and the `.t-small` line are 15 px at every width):**
- "Visitors are shown partners by distance, not by who pays. We review and approve every application."
- "Start free on Community; Growth and Premier are optional paid tiers · terms [to be confirmed]"
- "Membership covers listing and network tools only. It does not guarantee introductions, clients or an endorsement." (CR04)

---

### 3.12 `faq` (bone): exclusive accordion, top-aligned

**Move:** re-layout of behaviour, not of content.
- Only one answer can be open, so the scene's worst case is four questions plus the longest answer. It fits in every band, in both modes: 360×740 −120 (flow −122), 1280×720 −303.
- Today several answers can open at once, which overflows phones by +92.

**Markup**
```html
<!-- before -->  <details class="acc" open>   <details class="acc">   …
<!-- after  -->  <details class="acc" name="home-faq" open>   <details class="acc" name="home-faq">   … (all four)
```

**CSS**
```css
/* top-aligned in film AND flow mode: engine B2 gives both modes .scene__pan { margin: auto },
   which would re-centre the list and move the questions above an answer when it opens */
#faq .scene__pan { margin-top: clamp(0px, 6svh, 64px); margin-bottom: auto; }
@media (max-width: 759px) { .acc > summary { min-height: 52px; padding: 12px 0; font-size: 1rem; } }
```

**JS** (home.js; fallback for browsers without `details[name]`, i.e. Firefox < 130, Safari < 17.2)
```js
function exclusiveFaq(root) {
  const items = [...root.querySelectorAll('details.acc[name]')];
  if ('name' in HTMLDetailsElement.prototype) return;           // native exclusive accordion
  items.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) items.forEach((o) => { if (o !== d && o.open) o.open = false; });
  }));
}
```
Call `exclusiveFaq(document.getElementById('faq'))` before `boot()`. (SHARED-H2 proposes moving it to a shared helper.)

**Hooks:**
- The FAQ 3D flip (`acc-flip`) and the summary hover nudge stay.
- `home-sfx.js` `onAnswerOpen` (tone) stays. It fires once per opened item; the auto-closed sibling does not play, because only `open === true` plays. The SFX selector `summary` still matches.
- The film's ResizeObserver rebuilds on toggle (today's behaviour; the hold position is kept).

**Compliance (all four answers verbatim):**
- "Partners may pay us a fee if you become their client. You never pay us for an introduction. [Wording to be confirmed by counsel]"
- "No. You decide what happens next. Partners are independent businesses, and each one is responsible for their own licence and advice."
- "By distance only. We show the nearest partners for the service you need, closest first. No one pays to be listed higher, and a listing is not a recommendation or an endorsement."
- "We use it to answer you and connect you with a suitable partner. We ask for your city so we can find someone close to you. Cargado staff and the partner we connect you with see it, and we do not sell it. Read the privacy policy." (link to `legal.html#privacy`, handled by legal.md)

---

### 3.13 `close` (ink): CTA only

**Move:** split. The footer moves to `credits` (§3.14) and the `.nowrap-md` spans go.
- **Today:** +176 to +572 at every size below 1920.
- **After:** 1280×720 −253, 360×740 −255.

**Markup**
```html
<!-- before -->
<div class="scene__inner">
  <div class="stack stack-xl">
    <div class="close stack stack-l"> …
        <h2 id="close-title" class="t-d1 close__title" data-reveal="lines">One Message. <span class="nowrap-md">The Right Person.</span> <span class="nowrap-md">Close to You.</span></h2>
    … </div>
    <div data-footer></div>
  </div>
</div>
<!-- after -->
<div class="scene__inner">
  <div class="close stack stack-l"> …
      <h2 id="close-title" class="t-d1 close__title" data-reveal="lines">One Message. The Right Person. Close to&nbsp;You.</h2>
  … </div>
</div>
```
- `.close__title { max-width: 14ch; text-wrap: balance }` (SHARED-5) gives three lines on wide screens, the same look as today.
- Delete `html.film .close { padding-top: … }` (engine.md §D3).

**Phone:** `.close .row { flex-direction: column; align-items: stretch }`. The primary button is full width (no `.btn--block`, so it stays magnetic), and the link sits under it.

**Pose:** unchanged (`2.25,0.55,-0.3,0.3,3.6,0.95`). `close` is no longer the last scene, so it now gets an out-phase.

**Hooks:** `#close-go` stays in `wireIntroForm` targets and `home-sfx` `SEND_LINKS`.

**Compliance:** "Opens WhatsApp with your message written. Nothing is sent until you tap send." (15 px at every width)

---

### 3.14 `credits` (ink): NEW scene, the compact footer (= services SHARED-5 + story SHARED-C)

```html
<section class="scene scene--credits" id="credits" data-field="ink" data-dur="4"
         data-pose="2.25,0.55,-0.3,0.25,2.4,0" data-globe="0.25,2.4"
         data-title="Contact and Legal" aria-label="Contact and legal">
  <div class="scene__inner">
    <div class="credits-anchor" data-globe-anchor aria-hidden="true"></div>
    <div data-footer data-reveal="fade"></div>
  </div>
</section>
```
- **Globe by anchor, not by services' fixed pose.** story.md SHARED-C measured that `0,0.35,-1,0.25,2.4,0.7` puts the globe over the Company column at 1366×768 and behind all three link groups at 390×844. Home has no pose fitter today, so it adopts story's fitter through **SHARED-H7** (§5): the empty `.credits-anchor` box above the footer becomes the globe's pose on every build.
  - Measured anchor: 158×158 at 1280×720 (top 120, footer starts at 301), 169 at 1366×768, 200 at 1920×1080 and 768×1024. Its centre is always in the upper half of the screen, so the fitter never rejects it as below the fold.
  - At ≤ 759 px the anchor is `display: none` and the fitter shrinks the globe to scale 0 in place, as on story.
  - There is **no `data-pose-sm`** on this scene. On narrow screens the engine prefers `data-pose-sm`, which would override the fitted pose.
  - The static `data-pose` is the fallback before the fitter runs, or if the merger declines SHARED-H7: close's position at scale 0, so the globe shrinks away and is never behind the links.
- The field is the same as `close`, so the engine crossfades. It is the last scene: no out-phase, `END_HOLD_PX`.
- Home adds `data-reveal="fade"` on the footer slot, so the footer fades in with the film. It holds links, so it is never split.

**CSS** (the shared footer rules, as measured; they belong in base.css §10 under SHARED-5 / SHARED-C, not in home.css. `.credits-anchor` is Home's local name; story uses `.story-anchor--credits` with the same box, and the merger may unify them.)
```css
.credits-anchor { width: min(22svh, 200px); aspect-ratio: 1; margin: 0 auto var(--space-l); }
@media (max-width: 759px) { .credits-anchor { display: none; } }

.scene--credits .site-footer { border-top: 0; padding-top: 0; row-gap: var(--space-m); }   /* SHARED-C §2: no lone line */
.scene--credits .site-footer__notice { grid-column: span 9; }                               /* SHARED-5: notice | © on one row */
.scene--credits .site-footer__copy { grid-column: span 3; justify-self: end; align-self: end; }
@media (max-width: 759px) {                                                                  /* SHARED-5 phone + SHARED-C §3 */
  .site-footer { grid-template-columns: 1fr 1fr; row-gap: var(--space-s); }
  .site-footer__brand { grid-column: 1 / -1; grid-template-columns: auto 1fr; align-items: center; column-gap: 10px; }
  .site-footer__brand .monogram { width: 32px; height: 32px; grid-row: span 2; }
  .site-footer__col { grid-column: auto; }
  .site-footer__col--contact { grid-column: 1 / -1; }
  .site-footer__col--contact .site-footer__links { display: flex; flex-wrap: wrap; column-gap: var(--space-m); }
  .site-footer__links a { display: inline-flex; align-items: center; min-height: 44px; padding: 0; }
  .scene--credits .site-footer__notice, .scene--credits .site-footer__copy { grid-column: 1 / -1; justify-self: start; }
}
```
- Wide: brand (span 3, today's 40 px monogram) | Contact | Company | Legal, then the notice (span 9) and © (span 3) on one row. Phone: the brand row (monogram 32 + name + tagline), the link groups in two columns of **44 px rows** (Contact spans both), the notice at **15 px**, then ©.
- Measured with exactly these rules, the brand block shown and the anchor in place: 1920×1080 −469, 1366×768 −236, 1280×720 −204, 768×1024 −278, 390×844 −181, 360×740 −98, 375×667 −59. (The previous draft's −176 at 360×740 hid the brand block, used 32/40 px links and a 12 px notice.)
- **SHARED-H6** below proposes an optional richer wide layout. Home does not depend on it.

**Compliance (verbatim, from chrome.js):**
- "Partners are independent businesses, each responsible for their own licence and advice. Cargado Strategies does not give regulated advice through this website and may receive a commission when a referral becomes a client. [Wording to be confirmed by counsel]" (15 px at every width: SHARED-H8)
- Tagline "Connected by Purpose. United in Service."
- "WhatsApp +1 (204) 869 2508".
- Facebook (new tab).
- The legal links Disclosure / Privacy / Terms / Partner Code of Conduct, and Q&A.

---

## 4. JS changes on Home (all files)

| file | change |
|---|---|
| `home.js` | Import `createTabs` (ui-tabs.js) and wire the founder tabs before `boot()`, with `onModeChange: () => film.refreshReach()`. Add `exclusiveFaq()` before `boot()`. Remove `chrome.setBar(…)` from `wireIntroForm` (phone bar removed). Change `const mark = $('[data-monogram]')` to fill every `[data-monogram]` (`querySelectorAll`), or use SHARED-H5. Register the credits pose fitter: `film.on('build', createPoseFitter({ onlyAnchored: true }))` (SHARED-H7). |
| `interact.js` | **No tilt on the bare phone form.** In `update()`, pick the tilt card with an extra skip while the window is ≤ 759 px wide: `const narrow = window.matchMedia('(max-width: 759px)');` (module scope) and `const card = pick(target, TILT, narrow.matches ? `${TILT_SKIP}, .intro` : TILT_SKIP);`. `.intro` stays in `TILT`, so the wide card still tilts. (Tilt runs only on fine pointers, so this covers narrow desktop windows; phones never tilt.) |
| `home-tweens.js` | No change: `BUILDERS` keys are ids, and the moved nodes keep their classes. No `proof` builder. |
| `home-sfx.js` | None. `#faq details.acc`, `summary`, the chips, `[role="tab"]`, `SEND_LINKS` (incl. `#close-go`) and the play button all still match. |
| `index.html` | Markup changes as in §3: hero lead and `lead-rule` class, `.proof` moved, new `#proof` (subject to the launch rule), founder tabs wrapper + ids, quotes moved, find intro sentence, `scene--fill-stacked` on `#find`, `name="home-faq"` ×4, close simplified, new `#credits` with its anchor. |
| `home.css` | Rules per scene above. Delete: `.intro`'s `border-top: 2px solid var(--accent)`; the phone `.intro { padding }`; `.intro .hint { font-size: 0.8125rem }`; the fixed `.story-mark__lift` widths (340 / 240); the vw clamps on `.offer__title`, `.partners__title` and the base `.tile__name` (edited in place to `--u`); the `.map__svg` max-height (replaced). The `.quotes` styles stay (now used in `#proof`). |

**Accessibility checks for the build loop:**
- The heading outline stays h1 → h2 per scene. `#proof` gets an h2. The offers stay h3 inside the founder h2. Credits uses `aria-label` (no heading), as SHARED-5 specifies.
- Text floor: on phones no body or compliance text under 15 px (measured: only exempt labels remain — eyebrows, `.label`/`legend`, chips at 14 px, `.proof__l`, `.tile__own`, `.situation__tags`, the quote captions, the footer tagline, link labels and ©). From 760 px, every compliance line on Home is 15 px (`.hint`, `.ticks`, `.notice`, `.offer__fine`, `.map__cap`, `.vframe__cap`, partners' `.t-small`, the footer notice).
- Tab mode: VoiceOver/TalkBack announce "tab, 1 of 3, selected". Hidden panels are absent from the a11y tree.
- Desktop: no tab roles at all.
- Film parking:
  - Tab from `hero` lands on `video`'s controls (`proof` has none). `.is-reachable` already handles a control-less scene.
  - Founder tab buttons parked in a far scene keep their roving value in `data-film-tab` (`setTabStop`).
- Reduced motion: no clip animation on tab switch, no acc-flip and no tilt (all already gated).

---

## 5. SHARED proposals from Home (for the merger)

Endorsed as written by the other specs; Home was measured with them:
- **SHARED:** engine.md §D2 tokens and the `(min-width: 760px) and (max-height: 760px)` guard.
  - Home fits every contract viewport with them; the tightest scenes are hero −22 and founder −28 at 360×740.
  - Unit conflict (story.md): Home's first draft measured both `--u = min(1vw, 1.5svh)` (engine) and `--fu = min(1vw, 1.78svh)` (services) and fitted either way; this revision was measured with the engine `--u` only. **Vote: engine.md `--u`**, because it gives more room on 16:10 and 16:9 laptops, and only one unit may remain.
- **SHARED:** services.md SHARED-3 (`.scene--fill`), SHARED-5 (close/credits split, compact footer), SHARED-7 (`ui-tabs.js` and its underline tab style, used unchanged on Home), SHARED-8 (`film.refreshReach()`, snap ignores arrows in tablists), SHARED-9 (44 px on coarse pointers), SHARED-11 (phone text floor); story.md SHARED-C (globe anchor, no lone footer line, phone compaction) and SHARED-D (`setTabStop`, `clearTabStop`, `.is-tabbed`); engine.md §C (`.lead-rule` gone); legal.md (no `.nowrap-md` in reveal headings).

New from Home:
- **SHARED-H1 · Phone-short and phone-tiny bands.** Document two bands in base.css §5 next to the 760 px breakpoints:
  - phone-short `(max-width: 759px) and (max-height: 760px)`: forms may use `gap: 10px` and 48 px primary buttons;
  - phone-tiny `(max-width: 759px) and (max-height: 700px)`: `--scene-pad-top: 6px; --scene-pad-bottom: 8px; --fs-d1: 1.75rem; --fs-d2: 1.5rem` (§2). It never lowers `--fs-lead` or any text below the floor, and never lowers a tap target below 44 px. The contract viewports never reach this band.
  - CSS custom properties cannot hold media queries, so pages write them as plain media queries; the names are for ENGINE.md only.
- **SHARED-H2 · Exclusive accordions everywhere.** Any `details.acc` group inside a scene gets a shared `name` and the fallback of §3.12, in a small shared helper (`ui-accordion.js` → `exclusiveAccordion(root)`). An accordion whose items can all be open at once cannot be guaranteed to fit. Any rule that top-aligns an accordion's pan must not carry an `html.film` prefix (engine B2 shares the pan box between modes).
- **SHARED-H3 · fit-audit measures interactive worst cases**, on top of story SHARED-A (wait for `film-ready`; ignore `.tx-sr`, `aria-hidden`, clipped and pre-reveal transforms):
  - for each `details[name]` group, open each item in turn;
  - for each `.tabs`, select each tab in turn;
  - report the maximum per scene;
  - for scenes with a fixed-height fill grid (`.scene--fill*`), also report **overlap** between consecutive grid rows, because a fixed-height grid hides overflow from the scroll-height check.
  Without the first item, the FAQ overflow (+92 at 360×740 with every item open) passes today's audit.
- **SHARED-H4 · Media sizing by the budget, never fixed px or `vw` heights.**
  - A media box whose children are absolutely positioned (video frames) is **width-led**: `width: 100%`, an aspect ratio, and a height cap written as a width cap, `max-width: calc((var(--scene-safe-h) - <caption>) * <ratio>)`. Never `width: auto` or `max-height` on it (it collapses to 0 × 0).
  - `--media-h` caps media only in stacked bands, where text sits above the media.
  - Self-sized media (an inline SVG map) may use `max-height: calc(var(--scene-safe-h) - <caption + gap>)`.
  - Square marks use `clamp(min, k * var(--u), max)`.
  - Retire `calc(100svh - var(--header-h) - var(--bottom-h) - Npx)`: Home's `.map__svg` is one.
- **SHARED-H5 · `[data-monogram]` fill helper.** chrome.js exports `MONOGRAM`, and pages fill slots by hand (home fills only the first). `fillSlots()` in chrome.js should also fill every `[data-monogram]`.
- **SHARED-H6 · Wide credits layout, optional.** On wide screens only (≥ 1100 × 720) the credits scene can centre the tagline as display type (`--fs-d1`) above the three link columns, and `footer({ variant: 'credits' })` then hides the brand block's tagline. It is a polish item, not needed for the fit, and it was **not re-measured** with the anchor and the 15 px notice: re-run fit-audit if it is taken.
- **SHARED-H7 · Shared globe pose fitter.** Move `placeFromRect()` and `createPoseFitter()` from story.js into `assets/js/globe-fit.js`, with one option:
  - `createPoseFitter()` (story, unchanged behaviour): every scene is fitted; a scene without a visible anchor shrinks the globe to scale 0 at the previous position.
  - `createPoseFitter({ onlyAnchored: true })` (Home, and services/partners/legal if they adopt the credits anchor): only scenes that contain `[data-globe-anchor]` are fitted. A hidden anchor gives scale 0 at the scene's own `data-pose` x, y. Every other scene keeps its markup pose.
  - Scenes fitted this way carry no `data-pose-sm` (the engine prefers it on narrow screens).
  - This answers story SHARED-C's "pages without a fitter must move the pose or adopt the anchor" for every page with one module.
- **SHARED-H8 · Compliance text floor from 760 px (amends SHARED-5 and legal S8).** SHARED-11 covers phones only, and the shared footer notice is 12 px on desktop (legal S8 proposes 14 px). Proposal for base.css:
  ```css
  @media (min-width: 760px) {
    .notice, .hint, .offer__fine, .site-footer__notice, .ticks, .t-small, .map__cap, .vframe__cap { font-size: 0.9375rem; }
  }
  .map__cap, .vframe__cap { text-transform: none; letter-spacing: 0.02em; line-height: 1.4; }
  ```
  and add `.offer__fine`, `.map__cap`, `.vframe__cap`, `.vframe__soon-text` and `.site-footer__notice` to the SHARED-11 phone list. Home fits at every viewport with it on (tightest desktop scene: find −31 at 1280×720). partners.md proposes 16 px for body text from 760 px; compliance lines on Home are 15 px, and the merger picks one value for both.

---

## 6. Build loop for this page

1. Apply §3 in order: hero/proof, founder, close/credits, faq, find, then the fluid-only scenes.
2. `node tools/fit-audit.mjs http://localhost:8000/ index.html` (all nine viewports) after the shared hardening (story SHARED-A + SHARED-H3). The target is 0 everywhere, with at least 16 px of slack at 360×740 and 1280×720 (table 0.1 has 22 px or more, find excepted: 0 by construction in stacked bands, with the overlap check of §3.9).
3. Check at the hold of each scene, by screenshot:
   - 1440×900, 1280×720, 1024×768, 768×1024, 390×844, 360×740;
   - plus 375×667 and 1280×640 (not in the contract; they also fit);
   - the video frame is visible and 16:9 at every size; the phone map is at least 180 px tall; the credits globe sits above the footer and clear of the links.
4. Run the flow-mode check (reduced motion): each section is exactly one screen, with snap. Open each FAQ item: the questions above it do not move.
5. Run the a11y check: Tab through all scenes, check the founder tabs with the keyboard and a screen reader, confirm the FAQ allows one item open, and check the text floor (no compliance line under 15 px at any width).
6. Diff the compliance copy against §3 (lists marked "verbatim").
7. Before public launch: apply the `#proof` launch rule (§3.2) and get the founder's approval of the new copy (proof heading, find intro sentence).

---

## 7. Critique responses

Each point of the adversarial critique was checked against the files and re-measured with the prototype in `r4home-rev\`. All ten are accepted; none was wrong. Two go further than the critique asked.

1. **Video disappears (critical): accepted.** `.vframe__clip`'s children are absolute, so `width: auto` collapsed it to 0 × 0. §3.3 now uses `width: 100%` with a width-led budget cap and `--media-h` only in stacked bands. Measured: the frame keeps today's size everywhere (751×436 at 1280×720, 328×185 at 360×740); video −193 / −109. SHARED-H4 now states the rule for every page.
2. **Phone text under the floor: accepted.** The `.intro .hint`, `.hero .ticks` and phone-tiny `.offer p` / `.offer__fine` overrides are gone; home.css's own `.intro .hint` 13 px rule is deleted because it out-specifies the shared floor. `.offer__fine`, `.map__cap` (and `.vframe__cap`, `.vframe__soon-text`, which the same probe found at 12–13 px) join the phone floor. Desktop compliance lines are 15 px (SHARED-H8); `find` was re-measured at −31 at 1280×720 (after its map cap changed from `- 3rem` to `- 4rem`, which costs nothing because the wide map is width-limited). Beyond the critique: the hero ticks, `.map__cap`, `.vframe__cap` and partners' `.t-small` (CR04) were also under 15 px on desktop and are now covered.
3. **Evidence did not match the spec: accepted.** The prototype was rebuilt (`spec.css` = this spec's CSS verbatim; nothing undocumented). Credits now uses SHARED-5's 44 px rows, 15 px notice and brand row (−98 at 360×740, not −176). The phone-tiny band is documented in full in §2, without the 14 px lead and without the global `.stack` override; with it 375×667 fits (hero −37, founder −46). The "builder's option" to keep the hero sentence is deleted.
4. **Removed decorative rule restored: accepted.** No top rule on the phone form, `lead-rule` removed from the markup, no `.proof__rule` and no `.proof` top border; only the dividers between stat cells remain. Beyond the critique: the `.intro` card's own `border-top: 2px solid var(--accent)` drew the same gold rule on wide screens and is removed too.
5. **Credits globe behind the links: accepted.** Home uses the `[data-globe-anchor]` box (measured above the footer at every wide size) through a shared fitter (SHARED-H7), with no `data-pose-sm`, and a scale-0 fallback pose. SHARED-C §2 (`border-top: 0; padding-top: 0`) is in §3.14.
6. **Reduced motion loses the FAQ fix: accepted.** Both `#faq` and `#find` pan rules have no `html.film` prefix. Flow mode measured: faq −122 at 360×740, find 0 by construction.
7. **Founder tabs don't match: accepted.** The pills are gone. Home uses the shared SHARED-7 underline tabs unchanged, adding only equal widths and 15 px labels, and hides `.offer__rule` in tab mode so the panel does not show a second line under the tab row.
8. **Phone map a thumbnail: accepted.** The intro paragraph is one sentence (it is not compliance copy), `.map__lift` has a 180 px floor, and the caption is sentence case (two lines at 15 px instead of four). Map at 360×740: 235×204 (was 169×147). The notice is unchanged.
9. **`#proof` only placeholders: accepted.** Launch rule added (§3.2): build and preview with the placeholders, ship publicly only with real figures and a real quote, otherwise withhold the whole section; hero and founder fit without it. `.proof__n` is `--fs-d2`. The heading is marked "not approved". This keeps PLAN.md's "never remove placeholders" for the build, and keeps a placeholder-only scene off the live site.
10. **Bare phone form tilts (low): accepted.** interact.js skips `.intro` while the window is ≤ 759 px wide (§4).
