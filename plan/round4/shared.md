# Round 4 · SHARED: one set of tokens, scene box, components and engine hooks

Status: merge of the design phase (read-only; nothing under `site/` was edited). It was merged on 2026-10-17 from `home.md`, `services.md`, `story.md`, `partners.md`, `legal.md`, `engine.md` and `baseline-audit.txt`.

**This file wins.** Where a page spec's own "SHARED" section or one of its code blocks disagrees with this file, follow this file. Each page spec now opens with a short "Merge amendments" block that lists the renames that apply to it. `engine.md` stays the spec for film-snap, the pan fallback and the removals; §7 below amends it.

Contents:
1. Decisions at a glance (conflict log)
2. Files: where the shared code lives
3. Tokens (`base.css` §1)
4. The scene box, film mode and flow mode (`base.css` §6 and §18)
5. Shared CSS utilities, the text floor and the credits scene
6. Shared JS components (`assets/js/ui-*.js`, `globe-fit.js`)
7. Engine amendments (film.js, film-snap.js, film-flow.js, sfx.js)
8. fit-audit and tools
9. Bands (named media queries)

---

## 1. Decisions at a glance (conflict log)

| # | Topic | Proposals | **Decision** | Why |
|---|---|---|---|---|
| D1 | Fit unit | engine/story/home/partners/legal: `--u: min(1vw, 1.5svh)`. services: `--fu: min(1vw, 1.778svh)` and its own coefficients, plus a phone `svh` type block | **`--u` only, with the engine.md D2 formulas.** `--fu` and legal's `--fit` are not created. services.css writes `var(--u)` wherever it wrote `var(--fu)`. | Four of five pages measured with `--u`. It always gives type that is smaller or equal on landscape, so services can only gain space. One unit. |
| D2 | Scene padding names | engine: `--scene-pad-top/-bottom` on `.scene__pan`. services: `--scene-pad-t/-b` on `.scene__inner` | **Engine names on `.scene__pan`.** The values are the services ones (smaller), see §3. | Engine names are used by four specs. The smaller values only add budget, so no page that was measured with the engine values can overflow because of them. |
| D3 | `--scene-h` meaning | engine: the box (`100svh − top − bottom`). services: the content budget | **`--scene-h` = the box. `--scene-safe-h` = the content budget** (box minus the pan padding). services.md reads `--scene-safe-h` wherever it wrote `--scene-h`. | Engine definition, used by home/legal media caps. |
| D4 | Hold drift | services: cap at the pad. engine: delete | **Deleted** (`addHoldDrift`, `HOLD_DRIFT_PX`). | Snap replaces it, so the cap is moot. |
| D5 | Flow mode box | engine B2: `height: 100svh`, the same absolute `.scene__inner` in both modes. services SHARED-3/4: `min-height` plus padding, extra flow-only fill rules | **engine B2**, plus story SHARED-G (no-JS), plus services' `scrollbar-gutter: stable` and the dialog lock. The fill rules carry **no `html.film` prefix** (one rule serves both modes). | One geometry for both modes. The services flow-only fill rules are then not needed. |
| D6 | Final scene id | `#credits` (services, story, home, partners). `#footer` (legal, engine) | **`#credits`, class `scene--credits`.** legal renames `#footer` / `.scene--footer`. Nothing links to `#footer`. | Majority. One id on every page. |
| D7 | Credits globe | services/partners: fixed `data-pose` + `data-pose-sm`. story/home: an anchor box plus a fitter | **The anchor box plus `globe-fit.js` on every page** (home SHARED-H7). `data-pose` stays as the fallback x/y. There is **no `data-pose-sm`** on credits. | The fixed pose puts the globe behind the link columns (story SHARED-C, measured). |
| D8 | Footer notice size | legal 14 px; home 15 px from 760 px; services/story/partners 15 px on phones and 16 px from 760 px | **`--fs-note`: 15 px on phones, 16 px from 760 px** for every reading or compliance line, the footer notice included. | Three specs agree, partners makes it a sign-off gate, and it is the PLAN floor. home and legal re-measure. |
| D9 | Text floor mechanism | services: long selector lists, last in every file. story: a `--fs-note` token. partners: a short list | **The `--fs-note` token plus one floor block at the end of `ui.css`** (the last shared file). Each page's CSS ends with its own floor block for its page classes, using `var(--fs-note)`. The exempt list is in §5.3. | The token keeps every page on one value. Specificity is still handled by putting the page block last. |
| D10 | Tabs API | services SHARED-7, story SHARED-D (canonical), legal drill mode, partners pill skin, services multi-mode tab sets | **story SHARED-D, extended** with `modes` (services' per-band tab sets), `inactive: 'drill'` (legal), `swipe` (partners/story) and `panelStop` (services: no tab stop on panels). See §6.1. | One module. Every page's needs fit one options object. |
| D11 | `setTabStop` | story: `(el, '0'\|'-1', film)` with a check on the element. legal: `(el, bool, film)` with a check on the scene, writing `''` | **`setTabStop(el, '0'\|'-1', film)`, decided by the scene** (`film.isParked(scene)`), with an explicit `'0'`, never `''`. Also `clearTabStop(el)`. | story's value and legal's scene check. Both fix a real bug. |
| D12 | Pager | services `createPager` (static/fit, focus on the first new item, "1–2 of 5"). legal `createPagedReader` (measured, focus stays, "Page N of M") | **One module, `ui-pager.js`, with two exports and one markup/CSS contract** (§6.2). The focus and status formats are options. | Both are needed. The bar, buttons and live region are the same. |
| D13 | Stepper | services `createStepper(form, {steps, validate, onStep})` with an `aria-live` progress label. partners: units that depend on a media query, a focused heading that carries "step n of N", and no live write on a step change | **partners' a11y model in services' module** (§6.3). services drops `aria-live` from `.stepper__label` and puts the count in the h3. | Focus plus a live region double-announces. partners' rules are stricter and fit both. |
| D14 | Stepper classes | services `.stepper__progress/__label/__step`. partners `.stepper__status/__count/__steps/__index/__alt` | **The merged set in §6.3.** `.stepper__progress` becomes `.stepper__status`. `.stepper__label` is kept as the visible text, `.stepper__count` the numeric variant. `--progress` becomes `--step-progress`. | |
| D15 | Carousel | PLAN lists carousels. No page spec builds one. tiers, values, arrangement and categories use phone tabs with swipe | **No `ui-carousel.js`.** A "carousel" is `createTabs({ swipe: true })` with the `.switch` pill skin (§6.1). | YAGNI. One code path for card rows. |
| D16 | Snap keys on tabs | engine A6: tab/tablist own every key. services/story/legal: they own arrows/Home/End; PageUp/PageDown step scenes | **Key ownership in three classes** (§7.2). | All three page specs agree, and A6 left focus on a tab stuck. |
| D17 | Touch in `[data-swipe-x]` | legal S7: a blanket opt-out. partners: only gestures that are mostly horizontal are ignored | **partners.** `[data-swipe-x]` marks a sideways handler, not an opt-out (§7.3). | A blanket opt-out leaves the film half-way after a vertical swipe on a card. |
| D18 | Rebuild on content size | today: any `.scene__pan` resize. partners: only when the overflow changes | **partners**, measured with `offsetHeight`, **not** `getBoundingClientRect` (§7.4). | The rect includes the film's scale (legal measured it about 16 % short). |
| D19 | Field focus | engine A9: touch snap off while a field is focused. partners: a "field hold" | **The field hold** (§7.5). Touch snap stays on. | Native scroll carried the visitor off the form, and nothing settled back. |
| D20 | `.short-hide` | engine: `@container scene (max-height: 640px)` | **Phones only:** `@media (max-width: 759px) { @container scene (max-height: 640px) {…} }` (legal S13). | The desktop box is 628 px on legal at 1280×720. |
| D21 | Phone-tiny band | home and services propose different values | §3 values (services' header and type, home's "never lower the lead"). | No contract viewport reaches it (all are taller than 700 px). |
| D22 | Component CSS home | services: base.css. legal: a new base.css section | **New `assets/css/ui.css`**, loaded after `fx.css` on every page and added to `build.mjs` `SHARED_CSS`. | base.css is already about 990 lines, over the 800-line soft limit. |
| D23 | Phone WhatsApp header icon (engine C2 recommendation) | engine only | **Not adopted in this round.** It is an open question for the owner. | No page measured it, and the user asked for removals. |
| D24 | Wide credits tagline (home H6) | home only, optional | **Not adopted.** | It was not measured. |
| D25 | Heading fit `.fit-box` (story SHARED-E) | story only, optional | **Not shared.** It stays in story.css. | It is optional and only story needs it. |

---

## 2. Files: where the shared code lives

| file | new? | contains |
|---|---|---|
| `site/assets/css/base.css` | edit | tokens §3; scene box and flow mode §4; the `.site-footer` rewrite (§5.4); `.hp`; `--ctl-h` controls; `.textarea { resize:none }`; delete `html.film .close { padding-top }` |
| `site/assets/css/ui.css` | **new** | `.tabs*`, `.switch*`, `.pager*`, `[data-page-item]`, `.stepper*`, `.dialog*`, `.link-btn`, `.fit-h`, `.fit-media`, `.short-hide`, `.globe-anchor`, the shared text-floor block (**last**) |
| `site/assets/js/film-snap.js` | **new** | engine.md A, amended by §7 |
| `site/assets/js/film.js`, `film-map.js`, `film-flow.js` | edit | engine.md A/B, plus `refreshReach`, `isParked`, the overflow-only rebuild, the field hold |
| `site/assets/js/sfx.js` | edit | engine.md A10, plus the `page` voice and `sfx.has()` (legal S9) |
| `site/assets/js/ui-tabs.js` | **new** | `createTabs`, `setTabStop`, `clearTabStop` (§6.1) |
| `site/assets/js/ui-pager.js` | **new** | `createPager`, `createPagedReader`, `initPagedReaders` (§6.2) |
| `site/assets/js/ui-stepper.js` | **new** | `createStepper` (§6.3) |
| `site/assets/js/ui-dialog.js` | **new** | `openDialog`, `closeDialog` (§6.4) |
| `site/assets/js/ui-accordion.js` | **new** | `exclusiveAccordion(root)` (§6.5) |
| `site/assets/js/ui-focus.js` | **new** | `focusInScene(el, { film, afterLayout })` (§6.6) |
| `site/assets/js/globe-fit.js` | **new** | `placeFromRect`, `createPoseFitter({ onlyAnchored })`, moved out of story.js (§6.7) |
| `site/assets/js/chrome.js` | edit | removals; `fillSlots()` fills every `[data-monogram]` (home H5) |
| `site/assets/js/interact.js` | edit | removals; generic `data-tilt="wide"` (tilts only from 760 px; replaces home's `.intro` special case) |
| `tools/fit-audit.mjs` | edit | §8 |
| `tools/fit-states/_harness.md` | **new** | the states module contract (§8) |
| `tools/check-config.mjs` + `build.mjs` | new + edit | services §7.7 field caps; `build.mjs` runs it and adds `ui.css` to `SHARED_CSS` |

Page JS imports only these exports. Page CSS may **size and skin** the shared classes inside its own scope. It never redefines their mechanics (`display` of `[hidden]` panels, the stacking of `.tabs--fixed`, the `.is-off-page` rule).

---

## 3. Tokens (`base.css` §1, replacing today's fluid values)

```css
:root {
  /* fit unit: 1vw, but never more than 1.5% of the screen height (D1) */
  --u: min(1vw, 1.5svh);

  /* display type: engine.md D2, unchanged */
  --fs-hero: clamp(2.25rem, calc(1.1rem + 5 * var(--u)), 7.75rem);
  --fs-d1:   clamp(2rem,    calc(1.2rem + 3.9 * var(--u)), 5.25rem);
  --fs-d2:   clamp(1.75rem, calc(1.1rem + 2.6 * var(--u)), 3.75rem);
  --fs-d3:   clamp(1.375rem, calc(1rem + 1.3 * var(--u)), 2.125rem);
  --fs-d4:   clamp(1.125rem, calc(0.95rem + 0.45 * var(--u)), 1.375rem);
  --fs-lead: clamp(1rem, calc(0.94rem + 0.35 * var(--u)), 1.25rem);
  /* --fs-body 1rem, --fs-small, --fs-xs unchanged */

  /* text floor (D8, story SHARED-F) */
  --fs-note: 1rem;            /* reading, notices, hints, errors, consent, footer notice: 16 px from 760 px */
  --fs-ui-min: 0.9375rem;     /* button, tab, pager and pill labels: 15 px everywhere */

  /* spacing: engine.md D2, unchanged */
  --space-m:   clamp(12px, 2.2svh, 20px);
  --space-l:   clamp(16px, 3.2svh, 32px);
  --space-xl:  clamp(20px, min(5vw, 5svh), 72px);
  --space-2xl: clamp(28px, min(9vw, 8svh), 140px);
  --gap-row:   clamp(12px, min(3vw, 3svh), 40px);

  /* controls (services SHARED-9) */
  --ctl-h: clamp(44px, 6svh, 48px);

  /* chrome */
  --header-h: clamp(56px, 7svh, 76px);
  --bottom-h: env(safe-area-inset-bottom, 0px);
  /* --banner-h: written on <html> only (legal S1); default 0 */

  /* the scene box, the same in film and flow mode (D2, D3) */
  --scene-top: calc(var(--header-h) + var(--banner-h, 0px));
  --scene-h: calc(100svh - var(--scene-top) - var(--bottom-h));             /* the box */
  --scene-pad-top: clamp(8px, 1.5svh, 24px);
  --scene-pad-bottom: clamp(12px, 2.5svh, 32px);
  --scene-safe-h: calc(var(--scene-h) - var(--scene-pad-top) - var(--scene-pad-bottom)); /* content budget */
  --scene-safe-w: min(var(--max-w), 100vw - 2 * var(--page-pad));

  /* media */
  --media-h: clamp(160px, 40svh, 560px);
  --panel-max-h: var(--scene-safe-h);
}
@media (max-width: 759px) {
  :root { --header-h: clamp(56px, 7.5svh, 64px); --fs-note: 0.9375rem; }
}
/* laptop-short guard (engine D3) */
@media (min-width: 760px) and (max-height: 760px) {
  :root { --space-xl: clamp(16px, 4svh, 40px); --space-2xl: clamp(24px, 6svh, 64px); }
}
/* phone-tiny (D21): no contract viewport reaches it */
@media (max-width: 759px) and (max-height: 700px) {
  :root {
    --header-h: 52px;                          /* the 44 px menu button and 36 px monogram still fit */
    --scene-pad-top: 6px; --scene-pad-bottom: 8px;
    --fs-d1: 1.625rem; --fs-d2: 1.5rem; --fs-d3: 1.25rem; --fs-d4: 1.0625rem;   /* --fs-lead is never lowered */
  }
}
```

The pan padding is the services value (D2). Here is the content budget `--scene-safe-h` it gives, in px. The engine.md D2 value is in brackets.

| 1920×1080 | 1536×864 | 1440×900 | 1366×768 | 1280×720 | 1024×768 | 768×1024 | 390×844 | 360×740 |
|---|---|---|---|---|---|---|---|---|
| 960 (945) | 769 (756) | 801 (788) | 681 (670) | 635 (624) | 681 (670) | 911 (896) | 747 (734) | 654 (643) |

Legal is less by `--banner-h`, which is 36 px from 760 px and 49 px on phones.

**Rules for tokens:**
- `:root`-computed tokens (`--scene-top`, `--scene-h`, `--scene-safe-h`, `--banner-h`) may only be changed on `:root`/`html`. A value set on `body` is invisible to them (legal §3.2).
- Pages **may** re-declare **type and spacing** tokens on their own scope (`#inquiry { --space-m: … }`, `body[data-page="services"] { … }`). This is how services keeps the tighter phone spacing it measured (services.md SHARED-1 phone block → scoped to services). Pages never re-declare `--u`, `--header-h`, `--scene-pad-*` or `--fs-note`.
- For a page-level cap on a heading, use `min(var(--fs-*), N svh)` (partners).

---

## 4. The scene box, film mode and flow mode

### 4.1 Markup contract (every scene, every page)
```html
<section class="scene [scene--fill] " id="…" data-field="ink|gold|bone" …>
  <div class="scene__inner"><div class="scene__pan"> … </div></div>
</section>
```
Write `.scene__pan` in the HTML (legal S2). film.js reuses it, and flow mode gets the same box.

### 4.2 CSS (`base.css` §6, with no `html.film` prefix: both modes)
```css
.scene__inner { position: absolute; top: var(--scene-top); bottom: var(--bottom-h); left: 0; right: 0;
  display: flex; flex-direction: column; padding-inline: var(--page-pad);
  overflow: clip; overflow-clip-margin: 8px; perspective: 1400px; container: scene / size; }
.scene__pan { margin: auto; width: 100%; max-width: var(--max-w);
  padding-block: var(--scene-pad-top) var(--scene-pad-bottom); }

/* scenes whose layout fills the box (finder, categories, inquiry, legal documents, legal Q&A) */
.scene--fill .scene__pan { margin: 0 auto; flex: 1 1 auto; min-height: 0; height: 100%;
  display: flex; flex-direction: column; }
.scene--fill .scene__pan > * { flex: 1 1 auto; min-height: 0; }
/* a page may opt a child out with its own flex value; never with an html.film prefix */

/* snap (engine A7) */
html.film.snap-on { overscroll-behavior: none; }
html.film.snap-on body { touch-action: pan-x pinch-zoom; }

/* delete: html.film .close { padding-top: clamp(24px, 9vh, 110px); } */
```

### 4.3 Flow mode (`base.css` §18) = engine.md B2 + these additions
```css
html:not(.film) { scroll-snap-type: y mandatory; scrollbar-gutter: stable; }
html:not(.film) .scene { position: relative; height: 100vh; height: 100svh; padding: 0;
  scroll-snap-align: start; scroll-snap-stop: always; scroll-margin-top: 0;
  background: var(--field-bg, var(--bg)); color: var(--fg); }
html:not(.film):has(dialog[open]) { overflow: hidden; }                     /* services SHARED-8 */

/* no JS (story SHARED-G): the one mode, with < 560 px, where a scene may be taller than the screen */
html:not(.js) .scene { height: auto; min-height: 100svh; }
html:not(.js) .scene__inner { position: relative; top: auto; bottom: auto;
  padding-top: var(--scene-top); container-type: normal; overflow: visible; }

@media (max-height: 559px) { /* engine B2 fallback block, unchanged */ }
```
Delete what engine.md B2 says to delete (`:first-child` padding, `scroll-margin-top`, the flow `.scene__inner` rule, the `body` bottom padding).

---

## 5. Shared CSS utilities, the text floor and the credits scene (`ui.css` unless noted)

### 5.1 Utilities
```css
.fit-h { max-height: var(--scene-safe-h); }
.fit-media { height: var(--media-h); width: auto; aspect-ratio: var(--ar, 16 / 9); max-width: 100%; }  /* self-sized media only */
@media (max-width: 759px) { @container scene (max-height: 640px) { .short-hide { display: none; } } }  /* decoration only, never compliance copy */
.link-btn { display: inline; min-height: 24px; padding: 0; border: 0; background: none; color: var(--accent);
  font: inherit; font-weight: 600; text-decoration: underline; }
@media (max-width: 759px), (pointer: coarse) { .link-btn { display: inline-flex; align-items: center; min-height: 44px; } }
```
Media sizing rules (home H4) are a pattern, not a class:
- A media box with **absolutely positioned children** (video frames) is width-led: `width: 100%`, an aspect ratio, and the cap `max-width: calc((var(--scene-safe-h) - <caption>) * <ratio>)`.
- `--media-h` caps media only in stacked bands.
- **Self-sized media** (an inline SVG map) may use `max-height: calc(var(--scene-safe-h) - <caption + gap>)`.
- Square marks use `clamp(min, k * var(--u), max)`.
- `calc(100svh - var(--header-h) - var(--bottom-h) - Npx)` is retired everywhere.

In base.css:
```css
.hp { position: absolute !important; left: 0; top: 0; width: 1px; height: 1px; overflow: hidden;
  clip-path: inset(50%); white-space: nowrap; }                              /* services SHARED-6 */
.input, .select, .btn { min-height: var(--ctl-h); }
.textarea { resize: none; }
@media (hover: hover) and (pointer: fine) { .chips--compact .chip { min-height: 36px; } }
.lead-rule { }                                                               /* engine C4: the rule is gone */
```

### 5.2 Heading rule
Do not put `.nowrap-md` inside `[data-reveal="lines"]` headings (legal S10). Use `max-width` in `ch`/`em` plus `text-wrap: balance`.

### 5.3 Text floor (D8, D9)
- **Reading text** (body sentences, list items, notices, hints, errors, consent, meta lines, facts, statuses, the footer notice): `font-size: var(--fs-note)`, which is 15 px on phones and 16 px from 760 px.
- **UI labels** (buttons, tabs, pager buttons, rails, phone pills): at least `var(--fs-ui-min)` (15 px).
- **Exempt** (labels, not sentences; all at least 11 px): uppercase tracked labels (`.eyebrow`, `.label`, `legend.label`, `dt`, `.stepper__label`, `.stepper__count`, rail group labels, `.offer-meta`, `.next-steps__when`), numerals and counters (`.num` counters, `.pager__status`), desktop tag pills (13 px from 760 px), `.site-footer__copy` (©), `.ph` inside a label, `.map__chosen`, `.combo__kind`, `.legal-draft__text` (12 px band label: the copy is verbatim and **flagged for the compliance reviewer**).
- **Shared floor block**: the last block of `ui.css`:
  ```css
  /* Text floor (shared.md §5.3). Keep LAST in ui.css. */
  .notice, .hint, .t-small, .check, .error, .ticks, .cred dd, .site-footer, .site-footer__notice,
  .profile__notice { font-size: var(--fs-note); }
  .notice { line-height: 1.45; }
  .btn--sm, .tabs__tab, .switch__btn, .pager__btn, .tags > li { font-size: var(--fs-ui-min); }
  @media (min-width: 760px) { .tags > li { font-size: 0.8125rem; } }
  .site-footer__copy { font-size: var(--fs-xs); }
  ```
- **Page floor block**: each page CSS ends with `/* Text floor (shared.md §5.3). Keep LAST. */`, which sets `font-size: var(--fs-note)` on every page class that holds reading text, at least as specific as the page rule it overrides. It uses no `!important` and no `@layer`. The rules that undercut the floor go: services `.inq-form .notice`, legal `.legal-contents .notice`, home `.intro .hint`, partners' phone `.tier__list` and `.tiers-intro`.

### 5.4 Credits scene (the final scene on every page) and the compact footer

Markup, the same on every page (only the `data-pose` fallback may differ):
```html
<section class="scene scene--credits" id="credits" data-field="ink" data-dur="4"
         data-pose="0,0.35,-1,0.25,2.4,0.7"
         data-title="Contact and Legal" aria-label="Contact and legal">
  <div class="scene__inner"><div class="scene__pan">
    <div class="globe-anchor globe-anchor--credits" data-globe-anchor aria-hidden="true"></div>
    <div data-footer></div>
  </div></div>
</section>
```
- There is no `data-pose-sm` and no `data-iris`. The field is the same as `close` (ink), so the change is a crossfade.
- Every page registers the fitter: `film.on('build', createPoseFitter({ onlyAnchored: true }))`. Story keeps its full fitter (`createPoseFitter()`).
- The `close` scene keeps only the eyebrow, title, lead, buttons and hint, with `margin-block: auto` from the pan, and has no footer slot.

CSS (base.css §10 rewrite; it merges services SHARED-5, story SHARED-C and legal S8):
```css
.scene--credits .scene__pan { display: flex; flex-direction: column; justify-content: center; gap: var(--space-l); }
.scene--credits .site-footer { border-top: 0; padding-top: 0; }
.site-footer { row-gap: var(--space-l); }
.site-footer__notice { line-height: 1.55; }                      /* size from §5.3 */
/* wide/laptop: brand span-4 | Contact | Company | Legal; notice span-9 + © span-3 on the bottom row */
/* tablet portrait: brand full width, then 3 × span-4 */
@media (max-width: 759px) {
  .site-footer { row-gap: var(--space-s); }
  .site-footer__brand { grid-template-columns: 32px 1fr; column-gap: 10px; align-items: center; }
  .site-footer__brand .monogram { width: 32px; height: 32px; grid-row: span 2; }
  .site-footer__col--contact .site-footer__links { display: flex; flex-wrap: wrap; column-gap: var(--space-m); }
  /* Company and Legal side by side, 44 px link rows */
}
```
`ui.css`:
```css
.globe-anchor--credits { width: min(22svh, 200px); aspect-ratio: 1; margin-inline: auto; flex: none; }
@media (max-width: 759px) { .globe-anchor--credits { display: none; } }
html:not(.film) .globe-anchor--credits { display: none; }
```
**Gate (partners §3.10):** a page is not signed off until fit-audit reports `#credits` at all 9 viewports with 0 overflow and at least 24 px spare, with the floor on.

---

## 6. Shared JS components

Common rules for every component:
- They are plain ES modules with no dependency except `film` (passed in) and `sfx` (optional, passed in).
- Every write of a tab stop goes through `setTabStop` / `clearTabStop` (§6.1).
- After a component injects or reveals controls, or changes mode, it calls the `onModeChange`/`onRender` callback. The page calls `film.refreshReach()` there. Callers check once at start-up that `film.refreshReach` is a function and report it with `console.error` if it is missing; no silent optional chaining.
- Button labels never change at runtime (textfx letter roll). Swap `hidden` buttons instead. Buttons whose text the component writes carry `data-roll="none"`, and counters carry `data-fx="none"`.
- Use `aria-disabled="true"`, never `disabled`, on Previous/Next, so focus never drops.
- Nothing measures with `getBoundingClientRect()` for layout decisions. Use `offsetTop`, `offsetHeight`, `clientHeight` and `scrollHeight` (the film scales scenes).
- Animate only transform and opacity. Do nothing under `html.rm`, reduced motion or flow mode.

### 6.1 `ui-tabs.js` (tabs, segmented switches and "carousels")
```js
export function createTabs(root /* .tabs[data-tabs] */, {
  activeWhen,            // media query string: tabs mode while it matches (story, home, partners, legal)
  modes,                 // OR [{ when: '(max-width: 759px)', tabs: ['search','map','results'] }, { when: '(max-width: 1279px)', tabs: ['map','results'] }]
                         //    first match wins; no match = static mode. Tabs not in the matched set get `hidden`,
                         //    and their panels lose the tabpanel role (services finder).
  label,                 // tablist name; default root.dataset.tabsLabel
  initial = 0,
  fixedHeight = false,   // stack the panels in one grid cell; selection by .is-current + inert (story D). Use it unless the panels sit in a fixed-height fill region.
  inactive = 'all',      // 'all' (static mode shows every panel) | 'drill' (legal Q&A on phones: a question list that opens one answer)
  panelStop = true,      // false: panels get no tab stop (services: panels hold their own controls)
  swipe = false,         // true: the [data-tabs-panels] parent gets data-swipe-x and touch-action: pan-y pinch-zoom; a mostly horizontal swipe (|dx| ≥ 48, |dx| > 1.5·|dy|) selects prev/next
  film,
  onChange,              // ({ index, key, cause }) cause: 'pointer'|'key'|'arrow'|'swipe'|'deeplink'|'mode'|'auto'
  onModeChange,          // ({ tabbed, mode }) after every mode switch, including the first at init (synchronously)
} = {})
// returns { select(keyOrIndex, { cause }), open(key, { cause }), close(), get current() /* key */, get tabbed(), get mode() }
export function setTabStop(el, value /* '0' | '-1' */, film) {}
export function clearTabStop(el) {}
```
- **Key** = the panel id (`aria-controls`). `root.dataset.tab` holds the selected key in tabs mode and is removed otherwise (services 7.3).
- **Markup:**
  ```html
  <div class="tabs" data-tabs="(max-width: 759px)" data-tabs-label="Our Values">
    <div class="tabs__list [switch]">
      <button class="tabs__tab [switch__btn]" type="button" id="x-tab-1" aria-controls="x-1">…</button> …
    </div>
    <div data-tabs-panels role="list">
      <div class="tabs__panel" id="x-1" role="listitem">…</div> …
    </div>
    <!-- drill only: <div data-tabs-bar hidden><button data-tabs-back>All Questions</button><button data-tabs-next>Next Question</button></div> -->
  </div>
  ```
  The roles are automatic: `list`/`listitem` become `none`/`tabpanel` in tabs mode and are restored on exit. Panels are `div`s, never `li`. There is no static `hidden` on `.tabs__list`; it shows only under `.is-tabbed`.
- **Classes the module writes:** `.is-tabbed` (root), `.tabs--fixed` (root, with `fixedHeight`), `.is-current` (panel), `.is-open` (root, drill).
- **Keyboard:** APG automatic activation. ←/→ (and ↑/↓ when `aria-orientation="vertical"`), Home and End each call `preventDefault()`. Space and Enter select. PageUp and PageDown are **not** handled; they reach snap.
- **Tab stops:** the selected tab is `'0'` and the others `'-1'`. A panel is `'0'` when `panelStop`, otherwise it has none. Every write goes through `setTabStop`. On leaving tabs mode, `clearTabStop` runs on every tab and panel.
- **`setTabStop`** (D11):
  ```js
  export function setTabStop(el, value, film) {
    const scene = el.closest('.scene');
    const parked = film?.isParked ? film.isParked(scene) : !!scene?.querySelector('[data-film-tab]');
    if (parked) { el.setAttribute('data-film-tab', value); el.setAttribute('tabindex', '-1'); }
    else { el.removeAttribute('data-film-tab'); el.setAttribute('tabindex', value); }
  }
  export function clearTabStop(el) { el.removeAttribute('tabindex'); el.removeAttribute('data-film-tab'); }
  ```
- **Drill** (legal §5.2): `open(key)` adds `.is-open`, unhides `[data-tabs-bar]`, sets `aria-expanded`, refreshes and resets a `[data-pager]` inside the panel, and focuses the panel's `h3[tabindex="-1"]`. `close()` / Escape / `[data-tabs-back]` return focus to the question. `[data-tabs-next]` opens the next question.
- **SFX:** `[role="tab"]` pops on a pointer click (sfx.js POP_TARGETS). For other causes, the page decides in `onChange` (legal: a tone only for `'key'`; partners: a pop for anything but `'pointer'`). Arrow, deep-link, auto and mode changes stay silent by default.
- **CSS** (`ui.css`):
  ```css
  .tabs__list { display: none; }
  .is-tabbed > .tabs__list { display: flex; gap: 4px; border-bottom: 1px solid var(--line); }
  .tabs__tab { min-height: 44px; padding: 0 var(--space-m); background: none; border: 0; color: var(--fg-muted);
    font: 500 var(--fs-ui-min)/1 var(--font-ui); letter-spacing: 0.04em; box-shadow: inset 0 -2px 0 transparent; }
  .tabs__tab[aria-selected="true"] { color: var(--fg); box-shadow: inset 0 -2px 0 var(--accent); }
  .tabs__count:not(:empty)::before { content: "· "; }
  .tabs__panel[hidden] { display: none !important; }
  .tabs--fixed.is-tabbed [data-tabs-panels] { display: grid; }
  .tabs--fixed.is-tabbed .tabs__panel { grid-area: 1 / 1; }
  .tabs--fixed.is-tabbed .tabs__panel:not(.is-current) { visibility: hidden; }
  /* segmented "pill" skin (partners; phone card rows) */
  .is-tabbed > .switch { display: flex; gap: 8px; border: 0; }
  .switch__btn { flex: 1; min-height: 44px; padding: 0 12px; border: 1px solid var(--line-strong); border-radius: 999px; box-shadow: none; }
  .switch__btn[aria-selected="true"] { background: var(--chip-on-bg); border-color: var(--chip-on-bg); color: var(--chip-on-fg); }
  ```
- **Carousel** (D15): `createTabs(root, { activeWhen: '(max-width: 759px)', fixedHeight: true, swipe: true })` plus `.switch`. Do not put `data-magnetic` on `.switch__btn`.

### 6.2 `ui-pager.js` (paged lists and paged reading)
```js
export function createPager(list, {
  mode = 'static',            // 'static': toggle `hidden` on the list's children | 'fit': render(items) one page, drop the last item while the list overflows (services 7.5)
  maxPerPage = () => Infinity,
  render,                     // fit mode: (items) => void
  noun,                       // visually hidden noun after "Previous"/"Next": "results", "partners", "offer items"
  status = 'range',           // 'range' → "1–2 of 5" | 'page' → "Page 1 of 3"
  focusOnTurn = 'item',       // 'item': focus the first new item's heading or control (preventScroll) | 'none': keep focus on the button
  film, onRender,             // onRender → caller runs film.refreshReach()
} = {}) // → { setItems(items, { silent }), goTo(page, { animate, announce }), refresh(), get page(), get pages(), destroy() }

export function createPagedReader(root /* [data-pager] */, { film, onTurn, when = root.dataset.pagerWhen || 'all' } = {})
// legal §5.1 exactly: measured pages via offsetTop differences, snug pass, verify after show, no pass during a turn,
// sets --page-h on root; → { goTo, reveal(el), refresh(), get page(), get pages(), get active(), destroy() }
export function initPagedReaders(scope = document, opts) // → Map(root → api)
```
- Both write `el.csPager = api` (on the list or the root) for fit-audit (§8).
- **Markup contract** (both):
  ```html
  <nav class="pager" aria-label="More results" data-pager-bar hidden>
    <button class="btn btn--ghost btn--sm pager__btn" type="button" data-dir="-1" data-roll="none">Previous<span class="visually-hidden"> results</span></button>
    <p class="pager__status num" data-fx="none"><span data-pager-current>1</span> of <span data-pager-total>3</span></p>
    <button class="btn btn--ghost btn--sm pager__btn" type="button" data-dir="1" data-roll="none">Next<span class="visually-hidden"> results</span></button>
  </nav>
  <span class="visually-hidden" aria-live="polite" data-pager-live></span>   <!-- never hidden; outside a hidden bar -->
  ```
  legal's `.pager__bar` becomes `nav.pager[data-pager-bar]`. The reader also uses `.pager__window` (the fixed-height viewport, `touch-action: pan-y pinch-zoom`, `data-swipe-x`), `[data-pager-track]` and `[data-page-item]`.
- **Announcements:** the live span is written only on a user turn ("Showing results 3 to 4 of 5" or "Page 2 of 3"). A reset (new search, new category, deep link) updates the visible status silently.
- **Input:** buttons. ←/→ while focus is inside the pager root (`preventDefault`). A mostly horizontal swipe or trackpad wheel on `.pager__window` (reader only). A `focusin` on an off-page item turns to its page.
- **SFX:** a pointer click already blips. Key, swipe and wheel turns play `sfx.play(sfx.has('page') ? 'page' : 'tick')`.
- **CSS** (`ui.css`):
  ```css
  .pager { display: flex; align-items: center; justify-content: space-between; gap: var(--space-s); }
  .pager[hidden] { display: none; }
  .pager .pager__btn { min-height: 44px; }
  .pager__status { font: 500 0.875rem/1.3 var(--font-ui); color: var(--fg-muted); }
  .pager__window { position: relative; overflow: hidden; height: var(--page-h, auto); touch-action: pan-y pinch-zoom; }
  [data-page-item].is-off-page { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  ```

### 6.3 `ui-stepper.js` (forms in steps inside one scene)
```js
export function createStepper(form /* form.stepper */, {
  pageWhen,              // optional media query: while it matches, a unit = all steps sharing data-page (partners ≥ 760 px); otherwise a unit = one data-step
  validateUnit,          // (stepEls) → [{ field, message }] errors for the visible fields only
  onStep,                // ({ unit, total, mode, cause }) page mirrors state (services: data-step on form + section; summary fill)
  onSubmit,              // (via) final submit, after full validation in the page
  focusTo,               // default: focusInScene (§6.6)
  film, sound,           // sound('tick'|'error') optional
  countText,             // ({ unit, total, mode, name }) → visible .stepper__label/.stepper__count text
} = {}) // → { go(unit, { focus = true, cause }), next(), back(), reset(), get unit(), get total(), get mode(), hideIndex(), showIndex() }
```
- **Classes and hooks** (D14):
  - root `form.stepper`;
  - `.stepper__status` (top row, was `.stepper__progress`) holds `.stepper__label` or `.stepper__count` (visible, **`aria-hidden="true"`**, no `aria-live`), `.stepper__bar > .stepper__fill` (`transform: scaleX(var(--step-progress))`) and the one-line error status `.stepper__errors[role="alert"][hidden]`;
  - `.stepper__steps` (optional grid wrapper);
  - `.stepper__step[data-step][data-page?]` (`fieldset`, or `div[role="group"]` for a step with no fields);
  - `.stepper__title` (`h3 tabindex="-1"`, inside the legend for fieldsets) with `<span class="visually-hidden" data-step-of></span>`, into which the module writes ", step 3 of 8" or ", part 2 of 4";
  - `.stepper__nav` with `[data-step-back]`, `[data-step-next]`, `[data-step-send]` (separate buttons toggled with `hidden`), and optional `.stepper__alt[data-step-alt]`;
  - `.stepper__send-hint` and an optional `.stepper__index` (visited units, `aria-current="step"`, later units disabled).
- **Announcements:** every unit change moves focus to the first visible `.stepper__title`, whose text carries the count. **No live-region write on a unit change.** A polite live region (`[data-step-live]`) is written only when the mode changes (crossing `pageWhen`) without a focus move. After a failed Next, focus goes to the first invalid field, the error status shows "{n} answer(s) need(s) a second look.", and `sound('error')` plays.
- **Submit handler:** before the last unit, **any** submit is Next, whatever `e.submitter` is (implicit submission clicks the first submit button in tree order, even a hidden one). On the last unit, `via` is `e.submitter?.value` if it names an alternative channel, otherwise the default. On a final submit with errors, go to the earliest unit that has one.
- No `film.refresh()` on a unit change. The overflow-only rebuild (§7.4) makes height changes free.
- **CSS** (`ui.css`, mechanics only; pages skin and size):
  ```css
  .stepper__status { display: flex; align-items: center; gap: var(--space-s); }
  .stepper__label { font: 500 0.75rem/1.3 var(--font-ui); letter-spacing: 0.14em; text-transform: uppercase; }
  .stepper__bar { flex: 1; display: block; height: 2px; background: var(--line); overflow: hidden; }
  .stepper__fill { display: block; height: 100%; background: var(--accent); transform-origin: 0 50%;
    transform: scaleX(var(--step-progress, 0)); transition: transform .45s var(--ease); }
  .stepper__step { min-height: 0; border: 0; padding: 0; margin: 0; }
  .stepper__step[hidden] { display: none; }
  .stepper__title:focus { outline: none; }
  .stepper__nav { display: flex; justify-content: space-between; gap: var(--space-s); }
  .stepper__nav [data-step-next], .stepper__nav [data-step-send] { margin-left: auto; }
  .stepper__nav .btn { min-height: 48px; }
  html.rm .stepper__fill { transition: none; }
  @media (prefers-reduced-motion: reduce) { .stepper__fill { transition: none; } }
  ```

### 6.4 `ui-dialog.js` (overlays; services profile, available to all)
`openDialog(dialogEl, { trigger, film, onOpen, onClose })` and `closeDialog(dialogEl, { returnFocus = true })` are exactly as in services SHARED-7/8:
- native `showModal()`;
- Escape and the backdrop close it;
- `film.stop()` on open and `film.start()` on close, **before** `onClose`;
- the trigger scene's `data-field` is copied onto the dialog.

There is one `<dialog class="dialog">` per page, placed after the last scene inside `main.scenes`. It is `overflow: visible`, never hidden. The `.dialog*` base CSS goes in `ui.css` (services 7.7, minus the profile rules, which stay in services.css).

### 6.5 `ui-accordion.js`
`exclusiveAccordion(root)` gives every `details.acc` in `root` the same `name` (from `root.dataset.accName`), and adds a JS fallback (close the siblings on `toggle`) where `details[name]` is not supported. Any `details.acc` group inside a scene must use it (home H2). Rules that top-align an accordion's pan carry no `html.film` prefix.

### 6.6 `ui-focus.js`
```js
export function focusInScene(el, { film, afterLayout = false } = {}) {
  // film mode: el.focus({ preventScroll: true }); the engine brings the scene in (engine A8 focus → snap.glideTo)
  // flow mode: el.focus({ preventScroll: true }); if el's scene is not snapped (|top| > 1), scene.scrollIntoView({ block: 'start' })
  // never scrolls an inner element (partners §4); afterLayout waits one rAF (two in Safari) first
}
```

### 6.7 `globe-fit.js`
`placeFromRect()` and `createPoseFitter({ onlyAnchored = false } = {})` move verbatim from story.js (home H7):
- `onlyAnchored: true` fits only the scenes that contain `[data-globe-anchor]`. A hidden anchor gives scale 0 at that scene's `data-pose` x and y.
- story.js imports from here (story owner).

---

## 7. Engine amendments (to engine.md; engine.md otherwise stands)

### 7.1 Public API (A11) additions
```
film.refreshReach()      // re-run updateReach(); REQUIRED export (film-flow: no-op)
film.isParked(el)        // true when el's scene is outside the reach set (film-flow: false)
film.snap                // as engine A11
film.stop() / start()    // existing; used by the menu and ui-dialog
```
The parking attribute `data-film-tab` is part of the engine API (`''` = "had no tabindex").

### 7.2 A6 keyboard: key ownership (D16)
Ignore the key (leave it to the element) when `e.defaultPrevented`, a modifier is held (other than Shift+Space), snap is off or blocked, or the focused element owns it:

| focused element | owns |
|---|---|
| **Text and value editors:** `input` of a text-like type, `textarea`, `select`, `[contenteditable]`, `[role=combobox\|listbox\|slider\|spinbutton\|grid\|tree\|application]`, anything inside `[data-snap-keys="off"]` (the finder map) | **every snap key** |
| **Composite widgets:** `[role=tab]` or inside `[role=tablist]`, `[role=radiogroup\|radio\|menu\|menubar]`, `input[type=radio\|checkbox]`, inside `.pager` or a `[data-pager]` root, inside `.stepper__nav` | ←/→/↑/↓, Home, End. **PageUp and PageDown still step scenes.** |
| **Activators:** `button`, `a[href]`, `summary`, `label`, `[role=button]`, `[role=tab]`, any `input` | **Space** (and Enter, which snap does not use) |

So Space and Shift+Space move scenes only when focus is on `body`, a scene, or non-interactive content.

### 7.3 A7 touch: `[data-swipe-x]` (D17)
Snap ignores a touch gesture only when it is mostly horizontal (|dx| > 1.5·|dy| when |dx| or |dy| first exceeds 10 px), wherever it starts. `[data-swipe-x]` marks a component that handles sideways swipes; it is **not** an opt-out. Components put `touch-action: pan-y pinch-zoom` on it (never `pan-y` alone, which kills pinch-zoom under `body { touch-action: pan-x pinch-zoom }`). The A3 path opt-outs (`[data-lenis-prevent]`, `[data-snap="off"]`, an open dialog) stay.

### 7.4 A8 rebuild: only when the overflow changes (D18)
`watchContentSize()` keeps one `over` value per pan, `over = max(0, pan.offsetHeight − pan.parentElement.clientHeight)`. It rebuilds only when `over` changes and either value is above 0. Use `offsetHeight`, not the rect (the film scales scenes). Steppers, error lines, tabs and pagers in a scene that fits then never rebuild the film.

### 7.5 A9 field hold (D19)
- On `focusin` of a text field inside a scene, record that scene's hold and enter the **field hold**.
- While the hold is on, revert any document scroll that no user gesture caused (no wheel, touchmove or key in the last 300 ms) with `lenis.scrollTo(holdY, { immediate: true, force: true })`. Touch snap **stays on**, so a deliberate swipe still leaves the scene.
- End the hold on `focusout` to a non-field, then `settle()`.
- Keys stay ignored while a field is focused (7.2). The wheel keeps snapping (engine A9 deviation, kept).
- Flow mode has no hold: mandatory snap plus `focusInScene` does the job.
- **This must be tested on a real Android (Chrome) and a real iPhone (Safari).**

### 7.6 A10 SFX
- engine A10 as written.
- Add the `page` voice: `noise(ctx, out, { dur: 0.16, peak: 0.05, attack: 0.02, f0: 1800, f1: 5200 })`, `MIN_GAP_MS.page = 120`.
- Add `sfx.has(name)`.

### 7.7 Removals (engine §C)
They run unchanged, with one exception: the legal draft banner dash uses legal.md §3.3 (the dash is visually hidden, so the text stays verbatim), not engine C4's rewrite.

---

## 8. fit-audit and tools (the acceptance test)

`tools/fit-audit.mjs` gains the following. Everything is merged from services SHARED-12, home H3, partners and legal S6.
1. **It waits for `html.film-ready` and `.scene__pan`** before measuring film mode. Each viewport runs twice in film mode and once with `--flow`. A scene passes only if every run is 0.
2. **Content height** = the pan's child extent plus padding. Y and X overflow are counted on the active scene only. X ignores clipped and `aria-hidden` decoration.
3. **Inner scrollers** are failures: any element in a scene with `overflow: auto|scroll` whose content overflows it.
4. **Clipped check:**
   - **What fails:** an element inside a `.scene__pan` or an open `dialog` with `overflow: hidden|clip` whose `scrollHeight > clientHeight + 1` (or the same for width).
   - **Skipped:**
     - inline and inline-block boxes (`.rv-mask`, letter-roll wrappers);
     - boxes of 2 px or less;
     - a `clip-path` of `inset(50%)` or a `clip` other than `auto`;
     - `.visually-hidden`, `.hp` and `[aria-hidden]` subtrees;
     - `[data-page-item].is-off-page`;
     - `[data-fit-ignore]`;
     - `[data-pager]` windows (the next item covers them).
5. **Pagers:** for every element with `csPager`, visit each page with `goTo(p, { animate: false, announce: false })`. Report `clipped` when any on-page item ends below the window. Return to page 0.
6. **Interactive worst cases:**
   - for every `[data-tabs]` root, select each tab (both modes);
   - for every `details[name]` group, open each item;
   - for every `form.stepper`, render each unit in both modes, plus an **all-errors pass** (unhide every `.error` with its text, set `aria-invalid`, show `.stepper__errors`);
   - report the maximum per scene.
   - **Spare:** form columns need at least 40 px in the all-errors pass, every other block at least 24 px.
7. **Overlap** between consecutive rows of a `.scene--fill` grid.
8. **Text scan:** visible reading text under the floor (§5.3) is a `small-text` failure.
9. **States:** `--states=tools/fit-states/<page>.mjs` exports `[{ scene, name, run }]`. Each `run` is evaluated in the page after the scene is reached, and the scene is measured after each one. The contract is written in `tools/fit-states/_harness.md`.
10. **Fixtures:**
    - `--fixture=partners-max` serves `tools/fit-states/fixtures/partners-max.json` as `PARTNERS` by intercepting `config.js` (CDP `Fetch`). Nothing in `site/` changes.
    - `--ph-repeat=3` repeats every `.ph` text three times (legal S6), to stand in for counsel's longer wording.
11. **Hard rule:** `export function initFilm(` keeps that exact signature (the audit rewrites it in flight).

`tools/check-config.mjs` checks the PARTNERS field caps (services 7.7 table), and `build.mjs` runs it before bundling. `build.mjs` `SHARED_CSS = ['base.css', 'fx.css', 'ui.css']`.

---

## 9. Bands (named media queries; write them as plain media queries)

| name | query | use |
|---|---|---|
| phone | `(max-width: 759px)` | text floor 15 px, phone tabs |
| phone-short | `(max-width: 759px) and (max-height: 760px)` | forms may use `gap: 10px` and 48 px primary buttons |
| phone-tiny | `(max-width: 759px) and (max-height: 700px)` | §3 token block; never lowers the lead, the floor or 44 px targets |
| tablet-portrait | `(min-width: 760px) and (max-width: 1099px) and (max-aspect-ratio: 1/1)` | |
| laptop-short | `(min-width: 760px) and (max-height: 760px)` | §3 guard |
| keep-md | `.keep-md` (existing) | desktop columns at 1024×768 |
| fallback | `(max-height: 559px)` | pan or free scroll; the only allowed overflow |
| container | `@container scene (max-height: …)` | allowed, but a step-down for phones only must also be wrapped in `@media (max-width: 759px)` (D20) |
