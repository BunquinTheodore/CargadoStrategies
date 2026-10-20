# Round 5 · Engine API (frozen contract)

Owner: stage 2a (engine). Written at the start of stage 2, before any engine code changes. Stages 2b to 2e and every page agent code against this file.

**Sources:** DIRECTION §3 (tiers), §4.4 (cut table), §6.5 (sheet), §9.1-9.8, R4 `engine.md` A3-A8 and A13, R4 `shared.md` §6-§7. Where this file and those disagree, DIRECTION wins, and this file is corrected through the change rule below.

**Change rule:** after gate G2, a change needs the orchestrator's approval and a note to every active agent. Before G2, 2a may only **add** to this file (a new optional field, a new event), never rename or remove. Anything marked *(internal)* may change without notice; do not import it.

**Conventions:**
- Paths are under `site/assets/js/` unless stated.
- "Index" is a 0-based scene index into `film.scenes`.
- Times are in seconds (GSAP); delays named `…Ms` are milliseconds.
- `{ x, y }` origins are viewport CSS px (`clientX` / `clientY` space).

---

## 1. Modes

`film.mode` is one of three strings. It is decided once per page load (a pointer or preference change takes effect on the next load) and mirrored on `html[data-mode]`.

| mode | when | scenes | input | `html` classes |
|---|---|---|---|---|
| `'cut'` | fine pointer, no reduced motion, `window.gsap` present | stacked in the fixed `.stage`; one shown at a time | wheel, keys and focus become `film.cut` (R4 A3-A6 intent logic, film-snap.js); Lenis (fine pointer only) holds `scrollY` on one `100svh` spacer slot per scene | `js film` |
| `'touch-cut'` | coarse primary pointer (`(pointer: coarse)` and not `(hover: hover) and (pointer: fine)`), no reduced motion, `window.gsap` present | in flow, one `100svh` section each, **transparent**; the fixed `.fields` layer shows the field | native `scroll-snap-type: y mandatory` + `scroll-snap-stop: always`; no Lenis, no wheel or touch interception | `js touch-cut` |
| `'flow'` | no JS, reduced motion (OS **or** `localStorage['cs-motion'] === 'reduced'`), no `window.gsap`, or the head safety timer fired | in flow, each section paints its own `--field-bg` | native mandatory snap (R4 B2, `shared.md` §4.3, unchanged) | `js rm` (no JS: none) |

- `film.enabled` stays as a convenience: `film.mode !== 'flow'`.
- **Short screens** (stage height < 560 px, `SHORT_H`): `html.snap-off` is set. In `cut` mode the R4 pan fallback (`film-map.js`, B1) runs; in `touch-cut` snap is off and free scroll is allowed. Re-evaluated on every rebuild.
- **Legal** runs the engine in its normal mode, but is tier C by design (§10), so every field change is a crossfade.

### 1.1 The head script (2b pastes it in the shared HTML pass)

Replace the first statements of today's inline head script (the `rm` / `h.classList.add(...)` lines) with the block below, and change the safety timer's two class lines as marked. `rescueNav`, `wait`, `arm` and `FALLBACK_MS` stay as they are.

```js
var h = d.documentElement;
var FALLBACK_MS = 8000;
var mm = function (q) { return !!(window.matchMedia && matchMedia(q).matches); };
var pref = null;
try { pref = localStorage.getItem('cs-motion'); } catch (e) { /* storage blocked: OS setting only */ }
var rm = mm('(prefers-reduced-motion: reduce)') || pref === 'reduced';
var coarse = mm('(pointer: coarse)') && !mm('(hover: hover) and (pointer: fine)');
var mode = rm ? 'flow' : coarse ? 'touch-cut' : 'cut';
h.classList.add('js', mode === 'flow' ? 'rm' : mode === 'cut' ? 'film' : 'touch-cut');
h.setAttribute('data-mode', mode);
if (!h.hasAttribute('data-tier-lock')) {
  var c = navigator.connection, mem = navigator.deviceMemory;
  h.setAttribute('data-tier', (c && c.saveData) || (mem && mem <= 2) ? 'C' : coarse ? 'B' : 'A');
}
/* in arm(): the safety timer switches to flow mode */
h.classList.remove('film', 'touch-cut'); h.classList.add('rm'); h.setAttribute('data-mode', 'flow');
```

- `legal.html` writes `<html lang="en-CA" data-tier="C" data-tier-lock>` statically (2b, shared HTML pass).
- The `<script defer>` tags for **ScrollTrigger and Lenis are removed** from every page head (2b). `gsap.min.js` stays.

---

## 2. Bootstrap: `main.js`

```js
import { boot } from './main.js';
const { film, chrome, sfx, tier, globe, sheet } = boot({ page }); // page defaults to body[data-page] || 'home'
film.on('cut', ({ from, to, dir, tl, mode }) => { /* page choreography, §4 */ });
```

**Order inside `boot()`** (synchronous unless noted):
1. `initSplash()` (2c). `splash.js` is the **first import** of `main.js`, so its module body may start drawing at once. Never awaited; it never waits for `film.ready` or fonts. Skipped on legal (no `#splash` node).
2. `initTier()` (tier.js) → `tier` (`'A' | 'B' | 'C'`).
3. `initChrome({ page })` (2b) → `chrome` (`{ header, onMenuToggle(cb), closeMenu() }`, as today).
4. `initFilm({ root: document })` → `film`. `chrome.onMenuToggle((open) => open ? film.stop('menu') : film.start('menu'))`.
5. The sheet trigger hub (§13): one delegated `click` listener; `wa-sheet.js` is imported on the first trigger click or on idle, whichever comes first. `sheet` is a **Promise** of the sheet API.
6. `globe`: a **Promise**. When the page has `<canvas id="globe">` and the page is not legal, `import('./dotglobe.js')` starts at once (not on idle, so the splash match cut can land on it) and resolves to `initDotGlobe({ film, tier })`. Otherwise it resolves to `null`.
7. On idle (`perf.onIdle`): `initLayers({ film, tier })` (2c; not on legal), `initSfx({ film })` (2d), `initInteract({ film })` (2b), `initCursor({ film })` (2b; fine pointer, tier A or B, not on legal). Each is a dynamic `import()`, so the legal bundle never contains dotglobe, layers (stars) or cursor.
8. View Transition handlers (§15).

`boot()` returns synchronously. **Register `film.on(...)` listeners synchronously after `boot()`**: the first build waits for fonts, so nothing is missed. Heavy page code (finder, steppers) should load per scene on idle (`perf.onIdle` + dynamic `import()`), per DIRECTION §12.

`export function initFilm(` keeps exactly that signature (fit-audit rewrites it in flight).

---

## 3. The film object

Returned by `initFilm()` in every mode (flow mode returns the same shape; behaviour per mode is noted).

| member | signature | notes |
|---|---|---|
| `mode` | `'cut' \| 'touch-cut' \| 'flow'` | §1 |
| `enabled` | `boolean` | `mode !== 'flow'` |
| `ready` | `Promise<void>` | resolves after the first build and the first landing; `html.film-ready` is set at the same moment, in **every** mode |
| `scenes` | `HTMLElement[]` | the `section.scene` elements, in order |
| `current` | `number` | index of the current scene. Changes **at the start** of a cut (to the target), so `next()` during a cut counts from the target |
| `currentScene` | `HTMLElement` | `scenes[current]` |
| `isCutting` | `boolean` | true from cut start until `landed` |
| `cut(to, opts?)` | `(to: number \| string \| Element, { cause?, origin?, immediate? }) → boolean` | plays one cut timeline from `current` to `to` (§4). `to` may be an index, an id (with or without `#`), an alias (§5.2) or an element inside a scene. Returns `false` when `to` does not resolve or when the input lock drops the request; `true` when it plays or is queued. A cut to the current scene plays nothing and returns `true` (a hash to it still fires `deeplink` and `data-open`) |
| `next(opts?)` / `prev(opts?)` | `→ boolean` | `cut(current ± 1, { cause: 'step', ...opts })`; at the ends returns `false` (no rubber band) |
| `goTo(target, opts?)` | `(target, { immediate?, cause?, origin? }) → boolean` | a **jump**: `cut(target, { cause: 'goto', ...opts })`. It interrupts a running cut at once (`tl.progress(1)`, then the new cut). `immediate: true` lands with no animation (deep links on load, fit-audit). Before `ready` it is queued and runs after the first build |
| `on(name, cb)` | `→ () => void` (unsubscribe) | §4 events |
| `off(name, cb)` | | |
| `refreshReach()` | `() → void` | re-runs the Tab-reach update (R4 §7.1). **Required**; flow and touch-cut: no-op (AMENDMENTS 15) |
| `isParked(el)` | `(el: Element) → boolean` | true when `el`'s scene is outside the reach set (R4 §7.1). Flow and touch-cut: `false` (AMENDMENTS 15) |
| `stop(token?)` / `start(token?)` | `(token = 'default') → void` | input hold for menus and dialogs. Reference-counted by token: input resumes when no token is held. Sets `html.film-stopped` while any token is held. `cut`: Lenis stops, keys and wheel are ignored. `touch-cut`: 2b's CSS sets `overflow: hidden` on `html.film-stopped`. Flow: only the class |
| `irisTo(field, origin?)` | same as `iris.js` (§9) | convenience re-export |
| `refresh()` | `() → void` | schedules a rebuild (layout fitters re-run, `build` fires). Rarely needed: R4 §7.4 overflow-only rebuild runs by itself |
| `lenis` | `Lenis \| null` | `cut` mode on fine pointers only; `null` elsewhere and before it loads. Do not drive it |
| `seekCut(to, progress)` | `(to, p: 0..1) → gsap.core.Timeline \| null` | **test hook (T5 seek-test).** Builds the cut from `current` to `to`, pauses it at `p`, and returns it. `tl.progress(1)` (or any `cut`/`goTo`) finishes it and fires `landed` |
| `active` | alias of `current` | compat (Round 4 code) |

**Input lock** (DIRECTION §9.1): during a cut, wheel, key and swipe input is ignored until the cut's engine part reaches 70% (`CUT.lockAt × CUT.total`, see §11); after that, one step is queued and starts when the engine part ends (the `settled` label), finishing anything a page appended beyond it with `tl.progress(1)`. `goTo`, Home, End and nav jumps never wait.

**Keyboard and gestures** (cut mode): R4 `engine.md` A3-A6 and `shared.md` §7.2 key ownership, unchanged, but each intent calls `film.cut`. The wheel flick and momentum lock (A4) give one cut per flick. The field hold (R4 §7.5) stays on fine pointers.

**Focus:** focusing an element in another scene cuts to that scene (`cause: 'focus'`). Use `ui-focus.js` `focusInScene` in components.

---

## 4. Events

| event | payload | fires |
|---|---|---|
| `'ready'` | `{ mode }` | once, with `film.ready` |
| `'build'` | `{ sceneEl, index, mode }` | once per scene after layout, on the first build and after every rebuild (resize, overflow change). **Layout fitters only** (`globe-fit.js` `createPoseFitter`). No tweens here: there is no master timeline any more |
| `'cut'` | `CutEvent` (below) | synchronously when a cut timeline is created, **before it plays**. Page and visual choreography appends to `tl` here |
| `'landed'` | `{ index, id, el, field, from, cause, mode }` | when the whole cut timeline completes (page appends included), after an `immediate` landing, and once on load for the first scene (`cause: 'load'`, `from: -1`) |
| `'field'` | `{ field, from }` | at 50% of the iris (or crossfade), when the visible field changes; at the same moment `html[data-hdr-field]` changes |
| `'scene'` | `{ index, id, el, field, title, count }` | at cut start (when `current` changes). Kept for Round 4 code |
| `'deeplink'` | `{ id, alias, el, scene, open }` | after a hash resolves (load, `hashchange`, `popstate`, same-page hash link). `alias` is the hash when it matched a `data-alias`, else `null`; `open` is `{ dialog, key }` or `null` (§5.2) |
| `'rebuilt'` | `{}` | after a rebuild. Kept for Round 4 code |

### 4.1 `CutEvent`

```js
{
  from, to,            // indices; from === -1 for the first landing on load
  dir,                 // +1 forward, -1 backward (jumps use the sign of to - from)
  tl,                  // gsap.core.Timeline, paused until every listener has returned
  cause,               // 'wheel'|'key'|'touch'|'step'|'goto'|'hash'|'focus'|'click'|'load'
  origin,              // { x, y } of the iris (resolved, §5.1); present on same-field cuts too
  fieldChange,         // true when the fields differ (the iris plays; DIRECTION allows ≤ 3 per page)
  fromField, toField,  // 'ink'|'bone'|'gold'
  fromEl, toEl,        // the two section elements
  mode,                // 'cut' or 'touch-cut' (cut never fires in flow)
  immediate,           // true: tl is set to progress(1) right after the listeners, so use fromTo with explicit end states
}
```

### 4.2 Timeline labels (the §4.4 table; values from `motion-tokens.js`)

| label | time | engine content |
|---|---|---|
| `'out'` | 0 | the outgoing `.scene__pan` leaves as one group: `y: -40 * dir`, `opacity → 0`, 0.32 s, `power2.in` |
| `'iris'` | 0.10 | the iris (field change: 0.62 s, `expo.inOut`) **or** the same-field hold (0.40 s; the `[data-frame]` hairline draws if there is one, starting at 40% of the cut) |
| `'in'` | 0.30 | the in group (§6): eyebrow, headline words, rule, body and rows, CTA; `expo.out` |
| `'stop'` | after the last word of the stop's heading | the `.stop` pops: `scale 0 → 1`, 0.24 s, `back.out(3)` |
| `'settled'` | 0.95 | end of the engine part; the input lock and the queued step key off it |

- In **touch-cut** mode the `'cut'` event fires when the incoming section crosses **0.6** visibility (an IntersectionObserver); the iris has already fired at **0.35** through `irisTo`. Its `tl` holds only the in group, and every label exists but `'out'`, `'iris'` and `'in'` all sit at 0. Position page tweens **by label**, never by absolute time, and the same listener works in both modes.
- Backward cuts mirror y. Read `dir`.
- `tl` plays at `timeScale(1)`. Page appends may run past `'settled'` (W2 ≤ 1.4 s, W4 morph 0.9 s + arc 0.6 s); `landed` waits for them.
- Under tier C the iris is a 250 ms crossfade, but the labels keep their times.

### 4.3 Rules for `'cut'` listeners
1. Filter on `toEl` (or `to`) and return early for other scenes.
2. Animate `transform` and `opacity` only (`clip-path: inset()` for media wipes). No layout reads (`getBoundingClientRect`, `offsetTop`, `scrollY`) inside the listener or in tween callbacks; measure in `'build'` and cache.
3. Use `tl.fromTo(...)` with explicit start and end values, at a label plus an offset: `tl.fromTo(el, { y: 48 * dir }, { y: 0, duration: 0.5 }, 'in+=0.1')`.
4. Do not call `tl.play()`, `tl.pause()`, `tl.kill()` or `tl.timeScale()`.
5. Never append anything that loops or repeats: autonomous motion stops within 5 s (DIRECTION §2).

```js
film.on('cut', ({ toEl, tl, dir }) => {
  if (toEl.id !== 'founder') return;
  tl.fromTo(doors, { y: (i) => (i % 2 ? 48 : -48), rotationY: (i) => (i % 2 ? -12 : 12), opacity: 0 },
    { y: 0, rotationY: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'expo.out', transformPerspective: 1100 }, 'in');
});
```

---

## 5. Scene markup the engine reads

R4 `shared.md` §4.1 markup, unchanged: `.stage > .fields, .iris, canvases, .scenes > section.scene > .scene__inner > .scene__pan`. The engine creates `.scene__inner` / `.scene__pan` if they are missing, and creates the `.scroll-spacer` (cut mode).

| attribute (on `section.scene`) | values | read by |
|---|---|---|
| `id` | unique | engine (deep links, `html[data-scene]`) |
| `data-field` | `ink \| bone \| gold` | engine (iris, `.fields`), 2b CSS |
| `data-iris` | `stop \| center \| trigger \| "<x>% <y>%"` | engine: the iris origin when this scene is entered (§5.1) |
| `data-alias` | space-separated hash names | engine (§5.2) |
| `data-open` | space-separated `dialogId:key` pairs | engine (§5.2) |
| `data-title` | text | `'scene'` event title (optional) |
| `data-globe-mode` | `sphere \| map \| ring \| medallion \| hidden` (default `hidden`) | dotglobe (2c) |
| `data-globe-arc` | `pulse \| near \| join \| none` (default: `pulse` for a sphere on the first scene, `near` for a map, else `none`; Partners `#hero` uses `join`) | dotglobe (2c) |
| `data-globe-label` | text (default "A Professional Near You", or "You" with `data-globe-arc="join"`) | dotglobe (2c): the arc's label |
| `data-globe-face` | `"lat,lon"` (default: Canada for a map, the hero view for a sphere) | dotglobe (2c): the sphere view |
| `data-out-hold` | boolean | engine: on a same-field cut (cut mode) this scene's out group keeps its opacity until 0.45 s, as on a circle cut. Only for a scene without a headline (Story `#logo`), so two headlines never share a slot (AMENDMENTS 20) |
| `data-stars` | `dim` | layers.js (2c): dims the stars to `--stars-op-long` behind long text (inquiry, apply) |
| `data-archetype` | `M \| O \| R \| D \| P \| stage \| credits` | fit-audit (2e), CSS |
| `data-dur`, `data-pose`, `data-pose-sm` | — | **ignored by the engine** in Round 5 (`data-pose` is still written and read by `globe-fit.js`) |

Inside scenes:

| hook | meaning |
|---|---|
| `[data-group="head\|body\|action"]` | fit-audit groups (DIRECTION §4.2); the engine does not read it |
| `[data-reveal]`, `.eyebrow`, `.rule`, `.stop`, `[data-frame]` | the in group (§6) |
| `[data-cut="next\|prev\|<id or alias>"]` | a button or link that cuts when activated, with `cause: 'click'` and its own centre as the trigger origin. The hero "Next ↓" is `<button class="next" type="button" data-cut="next">` |
| `a[href="#id"]` (same page) | a jump through the hash handler: `pushState`, then `goTo(id, { cause: 'hash' })`, with the link as the trigger |
| `[data-globe-anchor]` | dotglobe placement box (`globe-fit.js`) |
| `<div class="medallion" aria-hidden="true">` | the medallion contract (§5.3): the disc a `data-globe-mode="medallion"` scene hands the globe to (`.medallion--sm` for Partners `#close`) |
| `[data-swipe-x]`, `[data-snap-keys="off"]`, `[data-snap="off"]`, `[data-lenis-prevent]` | R4 §7.2-7.3 and A3 opt-outs, unchanged |
| `[data-film-tab]` | written by the engine: the parked tabindex (`''` = had none). R4 §7.1 |

### 5.1 Iris origin
For the cut into a scene, the first that applies:
1. `opts.origin` passed to `cut` / `goTo` (`{ x, y }`, or an `Element`, whose centre is used);
2. the scene's `data-iris`: `stop` = the centre of the outgoing scene's `.stop` (or the centre if it has none); `center` = the viewport centre; `"x% y%"` = viewport percentages (the Round 4 values still work); `trigger` = step 3;
3. the trigger element (the clicked link, row, door CTA or `[data-cut]` button), centre;
4. the viewport centre.

The engine measures the origin once, at cut start, outside any tween.

### 5.2 Aliases and `data-open` (DIRECTION §9.4)
- `data-alias="a b c"` makes `#a`, `#b` and `#c` resolve to the section in `cut`, `goTo`, on load, on `hashchange` and on `popstate`. A real element `id` always wins over an alias.
- `data-open="dialogId:key …"`: after the cut **lands** on that section through a hash, for every pair whose `key` equals the hash (or `key` is `*`, which matches any alias of the section but not its own `id`), the engine dispatches a cancelable `CustomEvent('cs:open', { detail: { key: hash, scene, film } })` on `#dialogId`. If no listener calls `preventDefault()`, the engine opens it with `ui-dialog.js` `openDialog(dialog, { film })`.
- Examples. Home: `<section id="close" data-alias="story partners faq" data-open="faq-dialog:faq">`. Services: `<section id="finder" data-alias="categories insurance business-strategy …" data-open="categories-dialog:*">`, where services.js listens for `cs:open`, calls `preventDefault()` and opens its dialog on `detail.key`.

### 5.3 Medallion contract (dotglobe, 2c)
With `data-globe-mode="medallion"`, dotglobe shrinks the globe into the scene's `<div class="medallion" aria-hidden="true">`, then fades the disc up and glints it once (`--glint`) on the cut timeline. Pages animate the words, never `.medallion`.

---

## 6. `data-reveal` hooks (the in group)

The names are kept from Round 4. They now feed the **in** group of a cut (DIRECTION §9.1), in DOM order, nested reveals skipped (the outer one wins).

| hook | in animation | default slot |
|---|---|---|
| `.eyebrow` (automatic) | mask slide: `yPercent 100 → 0` inside its own box, 0.45 s | `in` |
| `[data-reveal="words"]` (alias `lines`, and `chars`, which plays as `words`) | each word rises from its mask: `yPercent 110 → 0`, 0.07 s stagger | `in+=0.08` |
| `.rule` (automatic) | `scaleX 0 → 1` from the left | after the words |
| `[data-reveal="fade"]` | `opacity 0 → 1`, `y 24 → 0` (2D only; no rotateX) | 0.06 s after the previous item |
| `[data-reveal="stagger"]` | its children as `fade`, 0.06 s apart | as above |
| `[data-reveal="scale"]` | `opacity 0 → 1`, `scale 0.96 → 1` | as above |
| `.stop` (automatic) | `scale 0 → 1`, `back.out(3)` | `stop` label, after the last word of the heading that contains it |
| `[data-frame]` on an SVG `rect` or `path` | `stroke-dashoffset` from its length to 0, 0.6 s | 40% of the cut (same-field) or `in` |
| `[data-reveal="none"]` | excluded: appears with its scene, no animation of its own | — |

- `data-delay="<seconds>"` (0-0.6) overrides an item's slot: seconds after the `in` label.
- Every slot is clamped so the engine part ends by `settled` (0.95 s).
- **Word masks:** `<span class="rv-mask"><span class="rv-word">…</span></span>` around each word, and `data-split="1"` on the split element. `tools/build-splits.mjs` (2e) writes exactly this into dist HTML; in `site/` the runtime splitter (`film-split.js`) does it. Only one `words` heading per scene, split **by word**. (This is the DIRECTION §4.1 `.w` mask; the class names stay as today so existing CSS keeps working.)
- Content of a scene that is not current is held in its out state (inline `opacity: 0` on the pan, in-group items at their from-state). In **touch-cut**, sections start at opacity 0 so text never shows over the wrong field.
- **Flow mode:** no cuts. In-group items get a 200 ms opacity fade when their section is 60% visible; nothing else moves.

---

## 7. What the engine writes

### 7.1 On `<html>`

| class / attribute | meaning |
|---|---|
| `js`, `film`, `touch-cut`, `rm` | the mode (§1); exactly one of `film` / `touch-cut` / `rm` is set |
| `data-mode` | `cut \| touch-cut \| flow` |
| `film-ready` | first build done and the first scene landed (every mode). fit-audit waits for it |
| `film-fallback` | set by the head safety timer when flow mode took over |
| `is-cutting` | from cut start to `landed` (2b: `will-change`; 2c: grain `steps(6)` jitter, tier A) |
| `film-stopped` | `film.stop()` holds at least one token |
| `snap-off` | stage height < 560 px (§1) |
| `data-scene` | id of the current scene (changes at `landed`, AMENDMENTS 21) |
| `data-field` | field of the current scene (changes at `landed`, AMENDMENTS 21). Mid-cut, use the `scene` / `field` events or `.fields[data-field]` |
| `data-hdr-field` | the field the **header** shows: changes once, at 50% of the iris (or crossfade). 2b styles the header from this |
| `data-tier` | `A \| B \| C` (tier.js, §10) |
| `--vt-x`, `--vt-y` | View Transition circle origin in px (§15), only during a transition |

`html.rm` is reduced motion on top of any tier, `html.ph-loud` is review mode (chrome.js) and `html.splash-done` is the splash's (2c). The engine does not write those.

### 7.2 On scenes

| class / attribute | meaning |
|---|---|
| `is-active` | the current scene (from cut start) |
| `is-near` | the neighbours of the current scene |
| `is-reachable` | its controls are in the Tab order (R4 reach set) |
| `is-entering` | the incoming scene, cut start → `landed`. It must stack **above** `.iris` (J-cut: its in group shows during the swell) |
| `is-leaving` | the outgoing scene, cut start → `landed`; stacks below `.iris` |
| `is-panned` | `.scene__inner` of a scene that pans (< 560 px fallback only) |
| `is-laid-out` | first build measured this scene |
| `data-overflow` | px of overflow, for QA (fit-audit, DevTools) |

### 7.3 Elements
- **`.fields`** (`<div class="fields" aria-hidden="true">`, first child of `.stage`, written by 2b in the HTML pass): the engine sets **`data-field`** on it (the field currently on screen; it changes when an iris completes). It replaces Round 4's per-scene `.field` layers: the engine no longer creates child layers.
- **`.iris`** (`<div class="iris" aria-hidden="true">`, one per page inside `.stage`, after `.scenes`): iris.js sets `data-field` (the field it is opening), the custom properties `--iris-x`, `--iris-y` (origin, px) and `--iris-r` (radius that covers the viewport from the origin, px), and animates `transform: scale()` from 0.02 to 1, with `will-change: transform` during the cut only. Afterwards it removes the inline transform and sets `data-state="idle"`. During a crossfade it sets `data-state="fade"` and animates `opacity`.
- **`.scroll-spacer`** (cut mode): `aria-hidden`, height = scene count × stage height.

---

## 8. CSS class list for 2b (the engine writes no CSS)

Everything the engine sets in §7 that needs a rule, and the rule it needs:

| selector | required rule (behaviour; 2b chooses the exact values) |
|---|---|
| `.stage` | fixed, full viewport, `z` stack per DIRECTION §3 `--z-*` tokens (cut mode). In touch-cut it holds only `.fields`, `.iris` and the canvases, fixed behind the scenes |
| `.fields` | fixed, inset 0, `z-index: var(--z-fields)`, `background: var(--field-bg)` for its own `[data-field]` (set the field tokens on `.fields[data-field="…"]`). Gold gets the metal finish (2c's `visual.css` `::before`/`::after`). Hidden in flow mode |
| `.iris` | fixed; a circle of radius `var(--iris-r)` centred on `var(--iris-x) var(--iris-y)` (`left/top` from the vars minus the radius, `width/height: calc(2 * var(--iris-r))`, `border-radius: 50%`), `background: var(--field-bg)` for its own `[data-field]`, `z-index: var(--z-iris)`, `transform: scale(0)` and `pointer-events: none` at rest. `[data-state="fade"]`: full-viewport rectangle (no radius), animated by opacity. `[data-state="idle"]`: `visibility: hidden`. Hidden in flow mode |
| `html.film .scene` | stacked in `.scenes`, `position: absolute; inset: 0`, transparent (the field is `.fields`); a scene that is not `.is-active`, `.is-entering` or `.is-leaving` gets `opacity: 0; pointer-events: none` (**not** `visibility: hidden` or `display: none`: browse-mode readers still reach it) |
| `.scene.is-entering` | `z-index` above `--z-iris` (for example `calc(var(--z-iris) + 1)`) |
| `.scene.is-leaving` | below `--z-iris` |
| `html.touch-cut` | `scroll-snap-type: y mandatory` on the root; `html.touch-cut .scene { position: relative; height: 100svh; scroll-snap-align: start; scroll-snap-stop: always; background: transparent }` (overrides the R4 flow rule `html:not(.film) .scene { background: var(--field-bg) }`) |
| `html.touch-cut.snap-off` | `scroll-snap-type: none`; scenes `height: auto; min-height: 100svh` (the R4 < 560 px fallback block) |
| `html.film-stopped` | `overflow: hidden` on the root in touch-cut and flow (cut mode needs nothing) |
| `html.rm .fields, html.rm .iris` | `display: none` (sections paint their own `--field-bg`, R4 §4.3) |
| `.site-header` | colours from `html[data-hdr-field="ink\|bone\|gold"]` (the field tokens under that selector), swapped instantly, never blended |
| `.rv-mask` / `.rv-word` | `.rv-mask { display: inline-block; overflow: clip; vertical-align: top; padding-bottom: .08em; margin-bottom: -.08em }`, `.rv-word { display: inline-block }` (today's rules, kept) |
| `.stop` | the gold circle (DIRECTION §4.1), `display: inline-block`, `transform-origin: 50% 50%` |
| `.next` | the labelled chevron button, hero only (C36) |
| `html.is-cutting` | optional: `will-change` on the moving scene layers only while it is set |

---

## 9. `iris.js`

```js
export function irisTo(field, origin = {}, opts = {}) // → gsap.core.Timeline
//   field   'ink' | 'bone' | 'gold': the field to open
//   origin  { x, y } viewport px (default: the viewport centre)
//   opts    { paused = false, duration = DUR.iris, tier = getTier(), onHalf }
```
- It opens `field` from `origin`: positions `.iris`, scales it 0.02 → 1 with `expo.inOut`, and at 50% sets `html[data-hdr-field]` and emits the film's `'field'` event (through `onHalf`, which the engine passes). On complete it sets `.fields[data-field] = field` and returns the iris to idle.
- Tier C or `html.rm`: a 250 ms (`html.rm`: 200 ms) opacity crossfade instead of the circle. Tier B uses the circle; if the perf gate measures < 55 fps on the tier B cut, the engine switches tier B to the crossfade (the tier table in tier.js, §10).
- `paused: true` returns the timeline paused, so the engine can nest it in a cut at the `'iris'` label. Pages normally never call it; the engine does on every field change. It is exported for page moments outside a cut (none are planned).

---

## 10. `tier.js`

```js
export function initTier() // → 'A' | 'B' | 'C'; reads html[data-tier] from the head script, writes it if missing, then samples 90 frames once
export function getTier()  // → 'A' | 'B' | 'C'
export function onTierChange(cb) // cb({ tier, from }) → unsubscribe; fires at most once per load
export function tierConfig(tier = getTier()) // → the DIRECTION §3 row, frozen:
// { globe: 'dots'|'poster', globePoints: 900|520|0, dpr: 1.5|1|1, halo: bool, idleSpin: bool,
//   stars: 180|110|0, starDrift: bool, grain: 'tile'|'none', grainJitter: bool,
//   iris: 'circle'|'fade', headerBlur: bool }
```

| tier | who | `tierConfig` |
|---|---|---|
| **A** | fine pointer, `deviceMemory` > 2 or unknown, no Save-Data | `globe: 'dots', globePoints: 900, dpr: 1.5, halo: true, idleSpin: true, stars: 180, starDrift: true, grain: 'tile', grainJitter: true, iris: 'circle', headerBlur: true` |
| **B** | coarse pointer (phone or tablet), not C | `globe: 'dots', globePoints: 520, dpr: 1, halo: false, idleSpin: false, stars: 110, starDrift: false, grain: 'tile', grainJitter: false, iris: 'circle', headerBlur: false` |
| **C** | Save-Data, `deviceMemory` ≤ 2, p75 frame time > 22 ms over the first 90 frames, or `html[data-tier-lock]` (legal) | `globe: 'poster', globePoints: 0, dpr: 1, halo: false, idleSpin: false, stars: 0, starDrift: false, grain: 'none', grainJitter: false, iris: 'fade', headerBlur: false` |

- The 90-frame sample runs once after `film.ready` and only ever **downgrades** (A or B → C). It then writes `html[data-tier]` and fires `onTierChange`. dotglobe and layers must follow it (switch to posters, drop stars).
- `html.rm` sits on top of any tier (posters, crossfades, no drift); it does not change `data-tier`.

---

## 11. `motion-tokens.js` and `motion-pref.js`

```js
// motion-tokens.js: the GSAP mirror of base.css --dur-* / --ease-* (DIRECTION §3, §4.4)
export const DUR = Object.freeze({ out: 0.32, iris: 0.62, same: 0.40, in: 0.65, stop: 0.24, hover: 0.2, door: 0.35,
  frame: 0.6, vt: 0.45, fadeRm: 0.2, fadeC: 0.25, eyebrow: 0.45, idleStopMs: 5000 });
// Keyed by cut step (§4.4 table), not by curve name: the out step uses power2.in, the in step expo.out.
export const EASE = Object.freeze({ stepOut: 'power2.in', iris: 'expo.inOut', same: 'power2.inOut', stepIn: 'expo.out',
  stop: 'back.out(3)', hover: 'power3.out', morph: 'power3.inOut' });
// The CSS curves by their base.css names, for WAAPI (splash, View Transitions).
export const CSS_EASE = Object.freeze({ ease: 'cubic-bezier(.2,.7,.1,1)', out: 'cubic-bezier(.16,1,.3,1)',
  in: 'cubic-bezier(.55,0,1,.45)', inout: 'cubic-bezier(.87,0,.13,1)' });
// Cut label times (s) and constants.
export const CUT = Object.freeze({ out: 0, iris: 0.10, in: 0.30, settled: 0.95, total: 0.95, lockAt: 0.7,
  outY: 40, wordStagger: 0.07, itemStagger: 0.06, frameAt: 0.4 });
```

```js
// motion-pref.js
export const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
export const MOTION_KEY = 'cs-motion';            // localStorage: 'full' | 'reduced'
export function osReducedMotion()   // → boolean, the OS setting only
export function motionPref()        // → 'full' | 'reduced' | null (stored choice; null when unset or storage is blocked)
export function prefersReducedMotion() // → boolean: OS setting OR motionPref() === 'reduced'
export function setMotionPref(value)   // 'full' | 'reduced': stores it, then reloads keeping location.hash (C37 switch)
```
- The C37 "Motion: Full / Reduced" switch (chrome.js, 2b) calls `setMotionPref` and reads `motionPref()` / `prefersReducedMotion()` for its `aria-pressed` state. "Full" stored while the OS asks for reduced motion is honoured: the stored choice wins over the OS when it is set.

---

## 12. `perf.js`

Kept exports, unchanged signatures: `saveData()`, `lowPower()`, `TASK_BUDGET_MS`, `yieldToMain()`, `forEachSliced(items, fn, budget)`, `finePointer()`, `onIdle(cb, timeout)`, `createLoop(frame)`.
- `lowPower()` now returns `getTier() !== 'A'` (kept so Round 4 callers keep working; new code reads `tierConfig()`).
- **New:** `createLoop(frame, { idleMs })`. With `idleMs` (use `DUR.idleStopMs`), the loop parks itself `idleMs` after the last `wake()`, whatever `frame` returns. The returned object gains `sleep()`. dotglobe, layers and cursor use it for the 5 s rule.
- **New:** `onInputIdle(cb, ms = DUR.idleStopMs)` → unsubscribe: calls `cb` once `ms` passes with no pointer, wheel, key, touch or `landed`; re-arms on the next input.

---

## 13. Sheet and concierge entry points (2d implements; the engine and pages trigger)

**Triggers (declarative, every page):** any `a` or `button` with `data-wa-sheet` opens the WhatsApp sheet (C22). Links keep a real `href` to `wa.me/12048692508?text=…` so they work with no JS.

| attribute | values |
|---|---|
| `data-wa-sheet` | empty (step 1), or a step name: `need`, `city`, `send`, `contact` (the "Rather call or email?" line, e.g. the hero's "Or Call / Email Us") |
| `data-need` | a `CATEGORIES` slug from config.js (`insurance`, `business-strategy`, `outsourcing`, `legal`, `mortgage`, `real-estate`, `accounting-and-tax`, `financial-planning`, …) or `not-sure` |
| `data-context` | `home \| founder \| network \| services \| story \| partners \| legal` |
| `data-city` | optional prefill |

A same-page link to `#wa-sheet` (optionally `#wa-sheet?contact`) does the same. The engine's hash handler ignores `#wa-sheet…`, since it is not in a scene.

```js
// wa-sheet.js (2d). main.js imports it lazily and calls initWaSheet once.
export function initWaSheet({ film, sfx, dialog = document.getElementById('wa-sheet') } = {})
// → { open({ need, city, context, step, trigger } = {}), close({ returnFocus = true } = {}), get isOpen() }
```
- `open()` uses `ui-dialog.js` `openDialog`, so `film.stop()` / `start()` happen there.
- The chosen city goes to `sessionStorage['cs-city']` (it feeds the W4 arc in dotglobe). On "Open WhatsApp" it dispatches `document` `CustomEvent('cs:wa-opened', { detail: { need, city, context } })`; sfx plays the chime on it.
- Pages that need the API: `const sheet = await boot().sheet;`.

```js
// concierge.js (2d): Services #finder while PARTNERS.length < FINDER_MIN_PARTNERS (C40)
export function initConcierge(root /* form.concierge */, { sheet }) // → { destroy() }
// markup: <form class="concierge"> <select name="need"> (CATEGORIES slugs) <input name="city" autocomplete="address-level2">
//         <button type="submit" class="btn btn--primary">Get My Introduction →</button> </form>
// submit: preventDefault, then sheet.open({ need, city, context: 'services', step: 'send', trigger: submitter })
```

---

## 14. Modules `main.js` calls (owners code to these signatures)

| module (owner) | export main.js calls | notes |
|---|---|---|
| `splash.js` (2c) | `initSplash() → Promise<void>` (resolves when the splash is gone) | no `film` argument: it never waits for the film. Once per session (`sessionStorage['cs-splash']`). The match cut to the globe horizon is coordinated between splash.js and dotglobe.js by 2c (suggested: `document` event `cs:splash-aperture` with `{ x, y, r }`); the engine does not mediate. Also exports `anchorBox(el, scene)` (an element's box relative to its scene, transforms ignored) and `circleOfBox(box)` (the shared globe circle that fills a box), and `splashState()` |
| `chrome.js` (2b) | `initChrome({ page }) → { header, onMenuToggle(cb), closeMenu() }` | unchanged |
| `dotglobe.js` (2c) | `initDotGlobe({ film, tier }) → DotGlobe` | below |
| `layers.js` (2c) | `initLayers({ film, tier })` | stars and grain; tier rules from `tierConfig()` |
| `sfx.js` (2d) | `initSfx({ film })`, plus the `sfx` export | its `hookFilm` listens to `'cut'` (`fieldChange` → breath) and returns at once when locked, muted or silent; it never reads layout or `scrollY` |
| `interact.js` (2b) | `initInteract({ film })` | magnetic hero CTA, arrow nudge, row flood |
| `cursor.js` (2b) | `initCursor({ film })` | fine pointer only |
| `wa-sheet.js` (2d) | `initWaSheet({ film, sfx })` | §13 |

**`DotGlobe`** (2c owns the implementation; this is the agreed surface):
```js
initDotGlobe({ film, tier }) // tier: 'A'|'B'|'C' (C → posters: globe-poster.svg / canada-poster.svg)
// → { get mode(), setMode(mode, { tl, at } = {}), replayArc(), sleep(), destroy() }
// mode: 'sphere' | 'map' | 'ring' | 'medallion' | 'hidden'
```
- It registers its own `film.on('cut')` listener and reads the incoming scene's `data-globe-mode`. It appends its morph to `tl` (sphere → map 0.9 s `power3.inOut`, the arc, ring, medallion), so the seek test sees it. It places itself by `[data-globe-anchor]` through `globe-fit.js` on `'build'`.
- `setMode(mode, { tl, at })` lets a page put a mode change into a cut timeline at a label. With no `tl`, it plays at once.
- `replayArc()`: the hero's "pointer over the globe replays the arc once".
- Render on demand, one `gsap.ticker` callback removed while asleep, asleep 5 s after the last input or landing (`perf.onInputIdle`), paused on `visibilitychange`, and it follows `onTierChange`.
- It is never imported on legal.

---

## 15. View Transitions (main.js, DIRECTION §9.7, W6)

- Same-origin cross-page link clicks (capture phase) write `sessionStorage['cs-vt'] = JSON.stringify({ x, y, w, h })`: the link's centre in px and the viewport size at click time.
- `pageswap` (main.js) and `pagereveal` (the classic head script, AMENDMENTS 21) read it. When it is present and `html.rm` is **not** set, they set `--vt-x` / `--vt-y` on `<html>` (scaled to the new viewport) and leave the transition running; 2b's `::view-transition-new(root)` keyframes animate `clip-path: circle(0 at var(--vt-x) var(--vt-y)) → circle(150% at …)` over `var(--dur-vt)`. Under `html.rm` they call `event.viewTransition?.skipTransition()`. The key is removed after `pagereveal`.
- Browsers without support navigate normally.
- 2b owns `@view-transition { navigation: auto; }`, `<meta name="view-transition" content="same-origin">`, and `view-transition-name: cs-header` / `cs-mark` on the header and monogram.

---

## 16. Internal modules (2a only; do not import)
- `film.js`: `initFilm`, mode selection, reach, deep links, aliases, rebuilds.
- `cut.js` *(internal)*: `buildCut({ fromEl, toEl, dir, origin, fieldChange, tier, mode }) → tl` with the §4.2 labels.
- `film-snap.js` *(internal)*: the cut-mode input (wheel flick, momentum lock, keys, the field hold, the input lock), calling `film.cut`. Loads Lenis with `import(LENIS_URL)` where `LENIS_URL = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs'`, on fine pointers only; `window.Lenis` is used instead when it exists.
- `touch-cut.js` *(internal)*: the two IntersectionObservers (0.35 field, 0.6 in group) and `scrollIntoView` for programmatic cuts.
- `film-reveals.js`, `film-split.js` *(internal)*: §6.
- `film-map.js` *(internal)*: the < 560 px pan fallback only.
- `film-flow.js` *(internal)*: flow mode, the same object shape.
- `film-events.js`: `createEmitter`, `fontsReady`, `sceneTitle`, `hashTargetOf`, `idFromHash` (stable; other modules may import them).
- `film-batch.js`: retired with the master timeline (deleted in 2a).

---

## 17. Shared components (R4 `shared.md` §6, verbatim; owner 2b)

DIRECTION §11 keeps these APIs and their a11y unchanged; Round 5 changes only skins. The text below is copied from `plan/round4/shared.md` §6 without edits. The CSS blocks are not repeated: they are in R4 §6.1-6.3 and belong to 2b's `ui.css`. The Round 5 deltas follow in §17.8. Section numbers inside the copied text (§6.1, §6.6, §7.4, §8) are R4 `shared.md` numbers.

Common rules for every component:
- They are plain ES modules with no dependency except `film` (passed in) and `sfx` (optional, passed in).
- Every write of a tab stop goes through `setTabStop` / `clearTabStop` (§6.1).
- After a component injects or reveals controls, or changes mode, it calls the `onModeChange`/`onRender` callback. The page calls `film.refreshReach()` there. Callers check once at start-up that `film.refreshReach` is a function and report it with `console.error` if it is missing; no silent optional chaining.
- Button labels never change at runtime (textfx letter roll). Swap `hidden` buttons instead. Buttons whose text the component writes carry `data-roll="none"`, and counters carry `data-fx="none"`.
- Use `aria-disabled="true"`, never `disabled`, on Previous/Next, so focus never drops.
- Nothing measures with `getBoundingClientRect()` for layout decisions. Use `offsetTop`, `offsetHeight`, `clientHeight` and `scrollHeight` (the film scales scenes).
- Animate only transform and opacity. Do nothing under `html.rm`, reduced motion or flow mode.

### 17.1 · `ui-tabs.js` (tabs, segmented switches and "carousels")
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
- **CSS** (`ui.css`): R4 `shared.md` §6.1 CSS block (2b).
- **Carousel** (D15): `createTabs(root, { activeWhen: '(max-width: 759px)', fixedHeight: true, swipe: true })` plus `.switch`. Do not put `data-magnetic` on `.switch__btn`.

### 17.2 · `ui-pager.js` (paged lists and paged reading)
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
- **CSS** (`ui.css`): R4 `shared.md` §6.2 CSS block (2b).

### 17.3 · `ui-stepper.js` (forms in steps inside one scene)
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
- **CSS** (`ui.css`, mechanics only; pages skin and size): R4 `shared.md` §6.3 CSS block (2b).

### 17.4 · `ui-dialog.js` (overlays; services profile, available to all)
`openDialog(dialogEl, { trigger, film, onOpen, onClose })` and `closeDialog(dialogEl, { returnFocus = true })` are exactly as in services SHARED-7/8:
- native `showModal()`;
- Escape and the backdrop close it;
- `film.stop()` on open and `film.start()` on close, **before** `onClose`;
- the trigger scene's `data-field` is copied onto the dialog.

There is one `<dialog class="dialog">` per page, placed after the last scene inside `main.scenes`. It is `overflow: visible`, never hidden. The `.dialog*` base CSS goes in `ui.css` (services 7.7, minus the profile rules, which stay in services.css).

### 17.5 · `ui-accordion.js`
`exclusiveAccordion(root)` gives every `details.acc` in `root` the same `name` (from `root.dataset.accName`), and adds a JS fallback (close the siblings on `toggle`) where `details[name]` is not supported. Any `details.acc` group inside a scene must use it (home H2). Rules that top-align an accordion's pan carry no `html.film` prefix.

### 17.6 · `ui-focus.js`
```js
export function focusInScene(el, { film, afterLayout = false } = {}) {
  // film mode: el.focus({ preventScroll: true }); the engine brings the scene in (engine A8 focus → snap.glideTo)
  // flow mode: el.focus({ preventScroll: true }); if el's scene is not snapped (|top| > 1), scene.scrollIntoView({ block: 'start' })
  // never scrolls an inner element (partners §4); afterLayout waits one rAF (two in Safari) first
}
```

### 17.7 · `globe-fit.js`
`placeFromRect()` and `createPoseFitter({ onlyAnchored = false } = {})` move verbatim from story.js (home H7):
- `onlyAnchored: true` fits only the scenes that contain `[data-globe-anchor]`. A hidden anchor gives scale 0 at that scene's `data-pose` x and y.
- story.js imports from here (story owner).

### 17.8 Round 5 deltas to §6 (DIRECTION §5, §8, §9)
- **`film` methods** the components call (`refreshReach`, `isParked`, `stop`, `start`) are in §3 here. `film.stop()` / `film.start()` take an optional token; `ui-dialog.js` should pass `'dialog'`.
- **Letter roll is deleted** (DIRECTION §4.4). `data-roll="none"` and `data-fx="none"` are harmless and may stay or go; the rule "button labels never change at runtime" still holds.
- **SFX:** the `page` voice is not built (DIRECTION §8). Pager turns are silent: `ui-pager.js` plays nothing for key, swipe or wheel turns (`sfx.has('page')` is false, so do not fall back to `'tick'`). Tabs and steppers play only what DIRECTION §8 allows (blip on click, error on a failed Next if 2d keeps an error voice, chime on success).
- **`ui-dialog.js` skin:** P paper with the hairline frame, ≤ 760 px wide on desktop, a sheet on phones (DIRECTION C26). The `cs:open` deep-link event (§5.2) opens dialogs through `openDialog`.
- **Touch-cut mode** uses the R4 **flow** branches (`focusInScene` flow branch, no field hold, `[data-swipe-x]`). A component asks `film.mode === 'cut'` where it used to ask `html.classList.contains('film')`.
- **`focusInScene` in cut mode:** `el.focus({ preventScroll: true })`; the engine's `focusin` handler cuts to the scene (`cause: 'focus'`). There is no `snap.glideTo` any more.
- **Reduced motion:** components skip their animations under `html.rm` and in flow mode (the R4 rule). Touch-cut is not reduced motion: components animate there exactly as in cut mode.

---

## 18. Test hooks (2e's tools)
- **fit-audit:** waits for `html.film-ready`, then seeks with `film.goTo(i, { immediate: true })` and reads `film.current`. The in group of an immediate landing is at its end state before `goTo` returns, so measuring right after it is safe. `--touch` must emulate a coarse pointer before navigation (CDP `Emulation.setTouchEmulationEnabled` + `setEmitTouchEventsForMouse`, plus `Emulation.setEmulatedMedia` for `pointer`/`hover`), so the head script picks `touch-cut`; check `film.mode === 'touch-cut'`.
- **seek-test (T5):** `const tl = film.seekCut(to, p)` for p = 0.25, 0.5, 0.75 between every neighbour pair, forward and back; screenshot; then `tl.progress(1)`. Equivalent: `film.on('cut', ({ tl }) => tl.pause().progress(p))` before calling `film.cut(to)`.
- **console-check (T3):** `film.next()` / `film.prev()` until `film.current` stops changing, waiting for `'landed'` each time.
- **idle rAF (T6, perf-gate):** after the last `'landed'`, 6 s with no input must show 0 rAF callbacks (engine loops included: the engine runs no rAF between cuts).
- **fit-audit hook:** `export function initFilm(` keeps exactly that signature.

---

## 19. Removed and deprecated (Round 4 → Round 5)

| Round 4 API | Round 5 |
|---|---|
| `film.on('progress')` | **never fires.** Registering is allowed (a no-op) until stage 6 so old page code does not throw; delete those listeners |
| `film.on('built')`, `'snapstart'`, `'snapend'` | never fire; use `'build'`, `'cut'`, `'landed'` |
| `film.scrollToTime`, `film.timeOf` | no-op / `null` until stage 6, then removed. Use `film.goTo` |
| `film.blend()` | returns `{ from: field, to: field, mix: 1 }` for the current field until stage 6, then removed. Use `html[data-field]` or the `'field'` event |
| `film.time`, `film.total`, `film.progress`, `film.velocity`, `film.timeline`, `film.timings` | `0` / `null` / `[]` until stage 6, then removed |
| `film.snap` (`enabled`, `current`, `next`, `prev`, `to`, `block`, `unblock`) | kept as a thin alias until stage 6: `film.snap.block(t)` = `film.stop(t)`, `to(i)` = `goTo(i)`; then removed |
| `film.on('build')` with `tl` / `sceneStart` / `timing` (scrubbed tweens) | `build` carries no timeline. Move choreography to `film.on('cut')` |
| `window.ScrollTrigger` | not loaded anywhere (DIRECTION §9.1) |
| `data-dur`, `data-rest`, hold drift | ignored |
| `motion-pref.js` OS-only reduce | now OS **or** `cs-motion` (§11) |

---

## AMENDMENTS (2a, stage 2, before G2; additions and corrections found while implementing)

Each item adds to the contract above or corrects a contradiction in it; nothing above is renamed or removed. Where an item corrects a line above, this section wins.

1. **Head script, §1.1 (correction).** §11 says a stored choice wins over the OS, but the §1.1 block ORs them, so OS-reduce + stored `'full'` gave flow in CSS and cut in JS. The `rm` line is now:
   `var rm = pref === 'reduced' || pref === 'full' ? pref === 'reduced' : mm('(prefers-reduced-motion: reduce)');`
   The safety timer also keeps adding `film-fallback` (§7.1): `h.classList.remove('film', 'touch-cut'); h.classList.add('rm', 'film-fallback'); h.setAttribute('data-mode', 'flow');`. Filed for 2b in `shared-requests.md`. Until then the engine re-derives the mode and rewrites the classes (`setMode`), so a page with the old line still runs in the right mode after the first script tick.
2. **tier.js, §10 (addition).** `sampleTier(after: Promise)` runs the 90-frame sample once after `after` resolves; `main.js` calls `sampleTier(film.ready)`. `initTier()` is unchanged and samples nothing itself (the film does not exist yet when it runs). Hidden tabs and locked pages are not sampled; frame gaps ≥ 250 ms are ignored.
3. **perf.js, §12 (addition).** `noteActivity()` records a non-DOM activity (the engine calls it on every `'landed'`), re-arming `onInputIdle` watchers. `createLoop(...)` returns `{ wake, sleep, running }`.
4. **`'build'` payload, §4 (addition, until stage 6).** It also carries `tl` (a sink that accepts and discards every call), `timing` (all zeros) and `sceneStart: 0`, so Round 4 page listeners that still append scrubbed tweens do nothing instead of throwing. Do not rely on them in new code.
5. **First landing, §4 `'landed'` (addition).** When the page has `#splash`, the load cut waits for `html.splash-done` (2c sets it when the splash is gone), at most 1.6 s, so the hero's in group plays where it can be seen. With a hash on load the landing is immediate (`cause: 'load'`, `immediate: true`); `'deeplink'` fires first and `data-open` after the landing.
6. **Jumps vs steps, §3 (clarification).** `cause` `goto`, `hash`, `focus`, `click` (`[data-cut]`) and `load` are jumps: they interrupt a running cut at once. `wheel`, `key` (except Home/End), `touch` and `step` (`next`/`prev`) go through the input lock. A queued step plays as a jump when it starts.
7. **iris.js, §9 (clarification).** The engine nests `irisTo(..., { paused: true }).paused(false)` at the `'iris'` label. The engine creates `.fields` and `.iris` when the HTML has not got them yet (2b still writes them in the HTML pass).
8. **Touch-cut, §4.2 (clarification).** Swipe-driven cuts have `cause: 'touch'` and no iris in `tl` (it ran at 35%). Programmatic cuts in touch-cut (`goTo`, `cut`, `next`, hash links) jump the scroll instantly (`behavior: 'instant'`, observer muted for two frames) and nest the iris at `'iris'` (= 0) in `tl`, so `fieldChange` cuts from code include it. When the field changes at 35%, the text of sections on a field with the other text colour fades out (0.2 s); a same-field neighbour fades out at the cut's `'out'`. Touch-cut ignores height-only resizes (the URL bar) unless they cross `SHORT_H`.
9. **Flow mode `'landed'`, §4 (clarification).** It fires whenever the current section changes: `cause: 'scroll'` for the visitor's own scrolling, `'step' | 'goto' | 'hash' | 'click' | 'load'` for code and links. `film.current` changes synchronously on `goTo` / `next` / `prev`.
10. **`main.js`, §2 and §14 (correction).** `sfx.js` is a static import (so `boot()` can return `sfx` synchronously); `initSfx({ film })` still starts on idle. `cursor.js` loads only on a fine pointer, tier A or B, not on legal. A module that fails to load is reported with `console.error` and never stops the others; `globe` then resolves to `null`.
11. **Deep links, §5.2 (clarification).** For an alias hash, `'deeplink'.el` is the section. When `ui-dialog.js` fails to load, the engine reports it and falls back to `dialog.showModal()`.
12. **In group, §6 (clarification).** A `.stop` inside a `[data-reveal]` wrapper (other than `none`) still pops on its own. Content outside the in group appears with the pan's own opacity fade (0.08 s from `'in'` − 0.05 s since requests-1, item 18). The first landing on load uses the compact layout (`'out'`, `'iris'`, `'in'` at 0).
13. **Internal modules, §16 (additions).** `film-reach.js` (keyboard reach), `film-links.js` (targets, aliases, `data-open`; exports `isSheetHash`), `film-map.js` now holds the scroll slots and the pan fallback (`buildSlots`, `locate`, `nearestSlot`). `film.js` also exports `SHORT_H`, `decideMode()` and `setMode()` (engine use only). `film-batch.js` is deleted.
14. **`main.js`, §2 and §14 (correction, G2-1, DIRECTION §12 legal JS budget).** `splash.js` is no longer a static import: `main.js` does `await import('./splash.js')` at its top level, and only when the page has `#splash`, so legal never downloads it. The page module still evaluates after the splash, and `boot()` still calls `initSplash()` first, synchronously. With no `#splash` (or a failed load) `boot()` adds `html.splash-done` itself. `sfx.js` is no longer static either: `boot()` returns a facade with the same surface (`play`, `has`, `setOn`, `isOn`, `setMuted`, `isMuted`, `silent`, `state`, `context`) that forwards to sfx.js once it loads on idle; until then `play()` is a no-op (nothing can sound before the first gesture after `initSfx` anyway), `has()` is `false`, the getters report sfx.js's start state and `setOn` / `setMuted` are applied on load. Page modules should use the `sfx` from `boot()` rather than importing `./sfx.js`, which puts it back into their initial bundle.
15. **`refreshReach()` / `isParked()`, §3 (correction, G2-2).** Both are inert in touch-cut as well as in flow: `refreshReach()` is a no-op and `isParked(el)` returns `false`. In those modes every section is in the document flow and the engine keeps no parked reach set, so nothing is ever parked (`film.js`: `!flow && !touchMode`). Components that rely on parking (`ui-tabs.js`) must treat `false` as "reachable", never as a sign the engine is missing.
16. **Slice-1 motion fixes (M1, M2, M4, M8; 2b and Home seek-test asks).**
    - *Out group:* `y` still leaves in 0.32 s (`power2.in`), but its **opacity lasts 0.45 s** (past `'in'`), so a seek at 25% or 50% of a cut never shows an empty field (J-cut). On the crossfade path the opacity keeps 0.32 s.
    - *Crossfade (tier C, `html.rm`):* it runs **under the scenes** (iris.js sets `.iris` `z-index: var(--z-fields)` inline while it fades) and the engine nests it **0.1 s before `'in'`** (0.20 s), not at `'iris'`, while the out group leaves; the in group reads on the turned field. A tier C cut whose origin is a full stop (`data-iris="stop"`) keeps the circle, the one cheap swell, except on `data-tier-lock` pages (legal) and under `html.rm`. `irisFades(tier, origin)` reports which path a cut takes. Labels keep their times.
    - *First landing (replaces 5):* when the splash is still up, the load cut is built and rendered at `progress(0)` at once (start states under the splash, no double take), and **plays on `cs:splash-aperture`** (or `html.splash-done`, at most 1.6 s). `film.ready` still resolves after `'landed'`.
    - *Touch-cut:* a swipe that turns back before the 35% iris has finished **reverses the same iris** (forward again if it turns once more); the header gets its old field back at 50% and `.fields` is untouched. A third field finishes the running iris first. The stop origin is the stop's **at-rest** position inside its snapped section, not where the swipe has carried it.
17. **Slice-2 motion fixes (V1, N1, N3, N6, N7). Item 16's out group and crossfade bullets are replaced by these.**
    - *Out group opacity:* same-field cuts take it to 0 by `'in'` (0.30 s, `power2.in`); the incoming eyebrow and rule carry the later seek frames. Circle cuts keep item 16's 0.45 s (the circle stacks above the outgoing scene, and the incoming scene is clipped to the circle, so the two never overlap). Swap cuts take it to 0 by 0.25 s.
    - *Circle clip:* on a circle cut the incoming scene gets `clip-path: circle(r at x y)` driven by the iris tween (`irisTo(..., { clip: sceneEl })`), so its content shows only inside the new field; the iris drops it on complete and the cut again at `'settled'` (`unclip(el)`, iris.js). 2b: nothing to add in CSS.
    - *Swap (replaces the crossfade):* tier C (except a full-stop origin on an unlocked page) and `html.rm` no longer blend two opaque fields. `irisTo` returns a timeline that switches `.fields[data-field]` and `html[data-hdr-field]` hard at `swapAt` (default 0) and runs `onHalf` there; the engine nests it at `'in'` − 0.05 s (0.25 s). `.iris` stays idle on this path: `data-state="fade"` and the inline `z-index` are no longer set (the `.iris[data-state="fade"]` rule in base.css is now unused; the slice-1 `shared-requests.md` line about it is moot). `duration` applies to the circle only. `irisFades(tier, origin)` still reports which path a cut takes.
    - *irisTo options (additions):* `clip` (Element), `from` (start scale, default 0.02), `swapAt` (s).
    - *Touch-cut iris:* starts at scale 0.15 (a disc, never a lone dot). A swipe's `data-iris="stop"` origin is the stop where the swipe has carried it, clamped to the viewport (programmatic touch cuts keep the at-rest position, item 16). Text leaving the field stays until 45% of the iris (the disc covers it as it grows), then fades in 0.2 s; on a swap it fades first and the swap lands at 0.16 s.
    - *Wheel gestures (film-snap.js):* a stream ends after a 400 ms gap, or after a 180 ms gap when the next delta grows (a repeated mouse notch counts) and is more than the tail's own rate × gap × 1.2 (a coalesced chunk of the same tail is not). Mid-stream, a new gesture needs both the delta and the delta per ms to rise 1.6× over the last three events. A decaying tail can no longer start a gesture, so it never queues a second step.
18. **Requests-1 (cut.js pan fade; Home and Story T5 asks).** The incoming pan no longer fades over 0.2 s from `'in'`, which multiplied every in-group tween at `'in'` by ≈ 0 at the 25% seek frame. It now fades in **0.08 s from `'in'` − 0.05 s** (0.25 s; at 0 on the compact layout), so it is fully opaque by 0.33 s and the in group (masks, strikes, the mark) carries the entrance. On a swap the pan fade starts with the hard field switch. Labels keep their times.
19. **Requests-1 (cut.js swap layout; tier C seek frames).** On a swap (tier C, `html.rm`) the 25% seek frame (0.24-0.28 s on a 0.95-1.1 s timeline) fell between the out group leaving (0.25 s) and the in group starting (0.30 s), so Home read 0.0% content whenever the frame sampler had dropped the tier to C. A swap cut now places `'iris'` and `'in'` at **0.12 s**: the out group fades to 0 by then (`power2.in`), `.fields` and the header switch there (items 17 and 18), and the pan fade and the in group start on the new field at once. `'out'` stays at 0 and `'settled'` at 0.95 s, so the input lock and the queued step do not move. Circle, same-field and compact cuts keep their times. Page tweens keyed to the `'in'` label move with it.
20. **Requests-2 (cut.js out-group hold; Story `#logo`).** A scene may carry `data-out-hold` (§5): on a same-field cut in cut mode its out group's opacity lasts until 0.45 s (`power2.in`, the circle-cut hold) instead of reaching 0 at `'in'`; `y` still leaves in 0.32 s. Opt-in only, since slice-2 N1 keeps headlines from sharing a slot. Story's `holdMark` / `LEAVING.logo` in story.js can go once `#logo` carries the attribute.
21. **Review-1 (engine perf, touch-cut, LCP, View Transition).** (a) `html[data-scene]` and `html[data-field]` are written once per cut, at `landed`, together with the removal of `is-cutting` (a root `[data-field]` change restyles the whole document; it used to happen inside the cut handler). The `scene` event still fires at cut start; `html[data-hdr-field]` is unchanged (50% of the iris). (b) A cut reads no computed style: every pan gets `{ y: 0 }` (and `opacity: 0` off the opening scene) once at start, cut.js takes y from GSAP's cache and opacity from the pan's inline style, and `setCurrent` toggles scene classes after the timeline is built. (c) film-reach.js caches each scene's has-a-focusable-control flag: read at the end of the first build, on rebuilds and in `refreshReach()` (which tabs and pagers already call on content changes), never in a cut. (d) Touch-cut: a 0.6 crossing whose field's iris is still running waits until that iris reaches its header swap (0.31 s; the swap itself, 0.16 s, on tier C) before its cut plays, and a section fading back in waits the same way, so text never shows over the wrong field. (e) The first landing keeps the HTML's opacity: its pan does not fade in and its `fade` items only rise 24 px (LCP: the hero lead paints from the HTML). Other kinds are unchanged. (f) tier.js samples 1.5 s after the first landing and downgrades only when two consecutive 90-frame windows both have p75 > 22 ms. (g) main.js: no sfx on legal (§7.5); the `pagereveal` half moves to the classic head script (2b, shared-requests); main.js only drops a `cs-vt` nobody consumed.
