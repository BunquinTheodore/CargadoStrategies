# site/core: shared contracts

Everything here is loaded by every page (legal skips the visual extras). **A change in core/ is a change to all 5 pages.** Run the gates in the root `CLAUDE.md` on every page, not just the one you were looking at. The full API is in `plan/round5/api.md` (old paths) and `site/ENGINE.md` (§6 film API, §8 sound/sheet/chrome, §9 helpers).

## Boot: `main.js`

```js
import { boot } from '../core/main.js';
const ctx = boot({ page });          // → { film, chrome, sfx, tier, globe, sheet }
mountSections([A, B], ctx);          // same tick: the first build waits for fonts, so nothing is missed
```

- Order: splash (a top-level `await import`, only when the page has `#splash`) → `initTier()` → `initChrome({ page })` → `initFilm()` → `sampleTier(film.ready)` → the WhatsApp sheet hub → the globe (a dynamic import; not on legal, only with `#globe`) → on idle: layers, sfx (not legal), interact, cursor (fine pointer, tier ≠ C, not legal) → View Transitions.
- `sfx` is a facade that is usable at once: `play, has, setOn, isOn, setMuted, isMuted, silent, state, context`. `globe` and `sheet` are promises.
- `main.js` re-exports `{ Section, mountSections }`. This keeps `Section.js` inside the engine chunk (`pages/legal-fx.js` imports it from here for that reason). Do not remove the re-export: it would add one modulepreloaded chunk per page.
- The sfx, layers, cursor, interact, dotglobe and wa-sheet are dynamic imports, so the legal bundle never contains them (perf budget: legal initial JS). The splash is a dynamic import too; legal now has `#splash`, so it loads it through main.js (build.mjs still gives only the other film pages the early splash-boot entry).

## Section lifecycle: `Section.js`

```js
export class Hero extends Section {
  static id = 'hero';          // the <section id> it drives (required; must exist on the page)
  mount() {}                   // wire the DOM once, before any scene event
  enter(event) {}              // 'landed' on this scene (or one that holds / sits in this element)
  leave(event) {}              // first 'landed' elsewhere after enter
  cut(event) {}                // OPTIONAL: append to event.tl when a cut enters or leaves this scene
  destroy() {}                 // undo mount(); film listeners are removed by the helper
}
mountSections(classes, ctx, root = document) // → { sections, destroy }
```

- The constructor is `(el, ctx)`. It sets `this.el`, `this.ctx`, `this.film` (= `ctx.film`) and `this.active`. `owns(sceneEl)` is true when the event's scene is the section, contains it or sits inside it.
- `mountSections` instantiates the classes in list order, mounts each, then subscribes `'landed'` (enter/leave) and, **only if the class defines `cut`**, `'cut'`. Listener order sets the order of appended tweens, so **the mount order in `pages/<page>.js` is the original wiring order. Do not reorder it.**
- A missing `#id` throws. A failing `mount()` or `destroy()` is logged and does not stop the others. A dialog section (outside every scene) never enters.
- Page-specific needs go through `ctx` extras (`{ ...boot(), selectTier }`, `{ ...booted, sound, inquireAbout, … }`), never through cross-section imports.

## Engine: `engine/`

**Film** (`film.js`: `initFilm({ root })`, `decideMode()`, `setMode()`, `SHORT_H`). Modes, decided once per load and mirrored on `html[data-mode]`: `cut` (fine pointer, fixed stage), `touch-cut` (coarse pointer, native mandatory snap), `flow` (reduced motion, no GSAP or the head safety timer, via `film-flow.js` with the same API).

- API: `mode, enabled, ready, scenes, current, currentScene, isCutting, cut(to, opts), next(), prev(), goTo(target, { immediate, cause, origin }), on(name, cb) → off, off, refreshReach(), isParked(el), stop(token), start(token), irisTo, refresh(), seekCut(to, p), lenis`.
- Events: `ready {mode}`, `build {sceneEl,index,mode}`, `cut {from,to,dir,tl,cause,origin,fieldChange,fromField,toField,fromEl,toEl,mode,immediate,transition}`, `landed {index,id,el,field,from,cause,mode}`, `field {field,from}`, `scene {index,id,el,field,title,count}`, `deeplink {id,alias,el,scene,open}`, `rebuilt {}`. Flow mode never fires `cut` or `build`.
- Cut timeline labels (`motion-tokens.js` `CUT`): out → iris or hold → in group → stop → `'settled'` at 0.95 s. Append choreography **by label, never by absolute time**, so the same code runs in cut and touch-cut mode and seeks cleanly (seek-test).
- **Transition styles** (owner, 2026-10-26; ENGINE.md §1.1): `data-transition="iris|dot|quad|flood"` on a scene sets how a cut into it (and back out of it) moves; `transitions.js` (pure: selection and the region polygons) picks it, `iris.js` paints a field change in that shape (`quad`/`flood` use `.iris[data-state="wipe"]` with an inline `clip-path: polygon(evenodd, …)`), `cut.js` runs a same-field cut as a clip reveal (incoming inside the region, outgoing outside) and varies the outgoing pan's motion. Same labels and times for every style. A field change into a globe scene keeps a circle. Tier C swaps field changes and keeps the plain same-field hold, except on tier-locked legal. No attribute = the classic cut. Every film page assigns one to every scene after the first, never the same twice in a row (tests/transitions.test.mjs).
- **Entrances** (ENGINE.md §1.2): `data-entrance="rise|depth|slide|wipe|open"` sets how a scene's headline words and fade/stagger items arrive on its cut-in (`entrances.js`, read by `film-reveals.js` `addInGroup({ entrance })`); neighbours differ on every page (tests/entrances.test.mjs). The first landing always rises.
- **Splash** (owner, 2026-10-26; ENGINE.md §9): the Portfolio boot intro, CSS-driven (visual.css §1), 4 s (owner, 2026-10-28: slowed from 2.5 s), on every film page including legal, only on an open or a refresh (owner, 2026-10-28; a same-origin navigation and back/forward skip it). On story and legal the flood is ivory paper, not gold. `splash.js` adds the counter, the config names (`SITE_NAME`, founder, city), the skip on input, `cs:splash-aperture` at 3.55 s and `cs:splash-done` at 4 s; `SPLASH_MS` mirrors the CSS delays (change both). film.js waits for the aperture at most `SPLASH_WAIT_MS` (4.1 s).
- Custom DOM events: `cs:open` (cancelable, on a `data-open` dialog from a deep link), `cs:splash-aperture`, `cs:splash-done`, `cs:wa-opened`, `cs:sound`, `cs:sfx`, `cs:pager`.
- What it writes on `<html>`, the scenes, `.fields` and `.iris`: ENGINE.md §7. The CSS for those classes is in `design/`.
- **Tooling depends on these, so keep them exact:** `export function initFilm(` (tools/lib/cdp.mjs `filmHook` rewrites it in flight for fit-audit, shoot, seek-test and console-check), `film.goTo(i, { immediate: true })`, `film.seekCut`, `html.film-ready`, `el.csPager`.
- Internal modules (import only from film.js): `cut, iris, film-snap, touch-cut, film-reveals, film-split, film-map, film-flow, film-reach, film-links, film-events`. Pure helpers they use (and tests import): `transitions.js`, `entrances.js`.

**Helpers you may import:**

| Module | Exports |
|---|---|
| `tier.js` | `initTier, getTier, tierConfig(tier), onTierChange(cb), sampleTier(after)`. Tiers A/B/C scale the decoration. Legal is locked to C (`data-tier-lock`) |
| `perf.js` | `onIdle, yieldToMain, forEachSliced, finePointer, saveData, lowPower, createLoop(frame, { idleMs }), onInputIdle, noteActivity, TASK_BUDGET_MS` |
| `motion-tokens.js` | `DUR, EASE, CSS_EASE, CUT`: the GSAP mirror of base.css `--dur-*` / `--ease-*`. **Change both together** |
| `motion-pref.js` | `prefersReducedMotion, osReducedMotion, motionPref, setMotionPref, REDUCE_QUERY, MOTION_KEY ('cs-motion')` |
| `iris.js` | `irisFades(tier, origin)` (true when a cut swaps instead of opening a circle; home's J-cut lead uses it), `irisTo`, `unclip` |
| `splash.js` | `initSplash, splashState, anchorBox(el, scene), circleOfBox(box)`, plus the pure `SPLASH_MS, splashWanted, counterAt, counterText, splashNames` |
| `dotglobe.js` | `initDotGlobe({ film, tier })` → `{ mode, setMode(mode, { tl, at }), replayArc, sleep, destroy }`. Scenes drive it declaratively with `data-globe-mode` (sphere, map, ring, medallion, hidden), `data-globe-anchor`, `data-pose`, `data-pose-sm`, `data-globe-arc`, `data-globe-face`. Its data is `assets/data/dotglobe-points.js` (tools/gen-dotglobe.mjs) |
| `globe-fit.js` | `CAMERA, anchorRect, boxFromRect, placeFromRect, createPoseFitter` |
| `layers.js` | `initLayers({ film, tier })`: stars (`#stars`, drawn once), grain, gold sheen. `data-stars="dim"` on a scene |
| `sfx.js` | `initSfx({ film }), sfx, SOUND_KEY`: breath, blip and chime. Silent on coarse pointers. `data-sfx="none"` opts an element out |
| `interact.js` | `initInteract({ film }), setFloodFrom(row, y)`: magnetic hero CTA, row flood, tier tilt |
| `cursor.js` | `initCursor({ film })` |
| `textfx.js`, `film-split.js`, `kerning.js` | word reveals (`data-reveal="words"`, pre-split in dist by tools/build-splits.mjs, which must match `splitWords`), the kern table (`assets/data/kern.json`) |
| `film-events.js` | `createEmitter, fontsReady, sceneTitle, hashTargetOf, idFromHash` |

## UI components: `ui/` (api.md §17)

| Module | API |
|---|---|
| `ui-dialog.js` | `openDialog(dialog, { trigger, film, onOpen, onClose })`, `closeDialog(dialog, { returnFocus })`: native `showModal()`, `film.stop('dialog')`/`start` (start runs before onClose), copies the trigger scene's `data-field` |
| `ui-stepper.js` | `createStepper(form, { pageWhen, validateUnit, onStep, onSubmit, focusTo, film, sound, countText })` → `{ go, next, back, reset, unit, total, mode, hideIndex, showIndex }`. Markup: `[data-step]`, `[data-step-next/back/send/alt]`, `.stepper__errors`, `[data-step-live]` |
| `ui-pager.js` | `createPager(list, opts)`, `createPagedReader(root, { film, onTurn, when })`, `initPagedReaders(scope)`. Both set `el.csPager` (fit-audit reads it). They never use getBoundingClientRect |
| `ui-tabs.js` | `createTabs(root, { activeWhen \| modes, label, initial, fixedHeight, inactive: 'all'\|'drill', panelStop, swipe, film, onChange, onModeChange })` → `{ select, open, close, current, tabbed, mode, destroy }`. `setTabStop`/`clearTabStop` respect parking. Callers run `film.refreshReach()` on a mode change |
| `ui-accordion.js` | `exclusiveAccordion(root)` → `{ destroy }` (details[name]) |
| `ui-focus.js` | `focusInScene(el, { film, afterLayout })`: focus without scrolling an inner box |

## Chrome: `chrome/`

- `chrome.js`: `initChrome({ page })` → `{ onMenuToggle, … }`. It wires the header that is already in the HTML, fills the phone menu (a native dialog) and the `#credits` footer (contact row from config: PHONE, CONTACT_EMAIL, ADDRESS_LINE, FACEBOOK_URL/FACEBOOK_PAGE_NAME, TAGLINE; the Sound and Motion switches when `FOOTER_SWITCHES`), and runs `renderWhen()`: `[data-when="KEY"]` slots show only when that config key is truthy, and `?review=1` adds `html.ph-loud` and shows them all. Exports used by sections: `escapeHtml`, `placeholderCard`, `ICONS`, `MONOGRAM`, `headerHTML`, `footer`, `renderWhen`.
- `whatsapp.js`: the **only** place messages are written. `waLink(text)`, `pageMessage(page)`, `pageLink(page)`, `buildIntro({ need, city, context })`, `categoryMessage(…)`, `finderRequestMessage(…)`, `partnerQuestionMessage()`. Every link goes to `WHATSAPP_BASE` from config (the one number).
- `wa-sheet.js`: `initWaSheet({ film, sfx })` → `{ open({ need, city, context, step, trigger }) }`. The `<dialog id="wa-sheet">` markup is in each page shell. Triggers are `[data-wa-sheet]` (step: need, city, send, contact) plus `data-need`, `data-context`, `data-city`, with a real `wa.me` href for no-JS. `main.js` loads it on the first trigger or on idle.
- The classic head script (the same in all 5 shells) sets the mode classes, `data-mode`, the tier (unless `data-tier-lock`, legal) and the 8 s flow fallback with a rescue nav, all before first paint. Keep it identical across shells. Every film shell has the same `#splash` block after `<body>` (tests/splash.test.mjs), whose one-line inline script sets `html.splash-skip` on a same-origin navigation or back/forward.

## Design: `design/`

- Load order on every page: `base.css` → `fx.css` → `ui.css` → `visual.css` → `pages/<page>.css`. The build bundles base + fx + font faces as the shared CSS. The CSS stdin `resolveDir` is `site/core/design`, so `url(../../assets/img/…)` resolves from here, **in section CSS too**.
- `base.css`: tokens (colour, `--fs-*` with the 14 px floor `--fs-label` and `--fs-note`, `--dur-*`, `--ease-*`, spacing), fields (`ink`/`bone`/`gold` colour roles), the scene box in all three modes, header, menu, footer, buttons, links, forms, the metric-matched font fallbacks.
- `fx.css`: word-reveal masks, row and door hover mechanics, the cursor ring. `ui.css`: shared components (`.row`, `.doors`, strike list, steps strip, `.paper`, `.fineprint`, tabs, pager, stepper, dialog, accordion, `.sheet`), ending with the text-floor block. `visual.css`: splash, globe, stars, grain, metal, medallion.
- New colours or sizes become tokens in base.css. Black and gold, plus a deep navy used only in backgrounds (`--navy-*` tokens in the `ink` field and app-page backgrounds; never buttons, text, links, icons or borders; owner, 2026-10-25).
- App pages (v2: account and dashboards) are not scroll films and are exempt from the film rules; they are the only pages that load Firebase. The nav (chrome.js / `NAV`) gains Contact in v2.

## Do not change without checking every page

- `Section.js` wiring and the mount order; the `main.js` boot order and re-export; the film's event payloads, label names and `initFilm` signature.
- `motion-tokens.js` together with base.css timing tokens; the tier table; `film-split.js` together with `tools/build-splits.mjs`.
- Any rule in `design/*.css`: fit-audit all 5 pages in film, `--flow` and `--touch`.
- `chrome.js` / `whatsapp.js` output: compliance-diff (the footer and the message copy are baseline text).
- The head script and the `<head>` tags of the shells: build.mjs pattern-matches them.
