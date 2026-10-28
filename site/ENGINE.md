# Cargado Strategies — engine guide for page builders (Round 5)

Everything here is in `site/`. The frozen contract is `plan/round5/api.md` (read its AMENDMENTS section at the end); the spec is `plan/round5/DIRECTION.md` §4.4 and §9. This guide is the page builder's view of both. Plain HTML, CSS and ES modules; `site/` runs as it is, and `npm run build` (project root) makes the optimised copy in `dist/` (see README).

Serve `site/` over HTTP with a server that handles parallel module requests (`node serve.mjs site 8230`, or the threaded Python server below) and open `http://127.0.0.1:PORT/`. Plain `python -m http.server` on Windows refuses some module requests and the page drops to flow mode after 8 s.

```python
# serve.py — run as: python -I serve.py PORT "C:\Cargado Strategies\site"
import functools, http.server, sys

class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True

port, root = int(sys.argv[1]), sys.argv[2]
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=root)
Server(('127.0.0.1', port), handler).serve_forever()
```

---

## 1. The model: scenes and cuts

A page is a list of discrete scenes, one shown at a time. Moving between them is a **cut**: one GSAP timeline, played (never scrubbed) at `timeScale 1`, built from the DIRECTION §4.4 table:

| label | time | what the engine puts there |
|---|---|---|
| `'out'` | 0 | the outgoing `.scene__pan` leaves as one group: `y −40 × dir` in 0.32 s, `power2.in`. Its opacity reaches 0 by `'in'` on a same-field cut, by 0.45 s on a circle cut (under the circle; the incoming scene is clipped to it) or when the outgoing scene carries `data-out-hold` (a scene with no headline, e.g. Story `#logo`), by 0.12 s on a swap (tier C, where `'iris'` and `'in'` both sit at 0.12 s) |
| `'iris'` | 0.10 | field change: a DOM circle in the next field's colour scales 0.02 → 1 from the origin (0.62 s, `expo.inOut`). Same field: the field holds and a `[data-frame]` hairline draws from 0.38 s |
| `'in'` | 0.30 | the incoming pan shows and its **in group** plays (§4): eyebrow → headline words → rule → body and rows → CTA, `expo.out` |
| `'stop'` | after the heading's last word | the full stop pops: scale 0 → 1, 0.24 s, `back.out(3)` |
| `'settled'` | 0.95 | end of the engine part |

- Backward cuts mirror y. Jumps (nav, Home/End, deep links) cut straight from the current scene to the target, with nothing in between.
- **J-cut:** the incoming scene stacks above the iris (`.is-entering`) and is clipped to the circle (`clip-path: circle()`, driven by the iris, removed at `'settled'`), so its words rise only inside the new field. Two headlines never share a slot, and no frame shows an empty field (T5 seek test).
- **Input lock:** during a cut, wheel, key and swipe input is ignored until 70% of the engine part; after that one step is queued and starts at `'settled'`. Jumps never wait: they finish the running cut (`tl.progress(1)`) and cut at once.
- There is no master timeline, no ScrollTrigger and no scroll-linked visual anywhere. Visuals never read scroll progress.

### 1.1 Transition styles (`data-transition`, transitions.js)

A scene names how it is **entered** with `data-transition`; going back, the cut uses the style of the scene being **left**, so one boundary always moves the same way. The labels and times above never move: every style fills the same slots, so sections append by label as before and seek-test's "no dead air" timing holds.

| style | field change (from `'iris'`, 0.62 s) | same field (a reveal, from `'iris'`, 0.62 s) | outgoing pan (from `'out'`) |
|---|---|---|---|
| `iris` | the circle from the origin (`data-iris`), as before | the incoming scene inside a circle from the origin, the outgoing one outside it | `y −40 × dir` |
| `dot` | collapse to the dot: a 14 px dot pops at the centre (first 18%), then swells to cover | the same dot, as a reveal | squashes to a line (`scaleY 0.2`, `scaleX 0.9`, `power3.in`) |
| `quad` | four cells grow from the corners, 10% of the run apart (forward TL, TR, BL, BR; back reversed) | the same cells, as a reveal | pulls back to `scale 0.94` |
| `flood` | a 45° flood from the bottom-left (top-right going back), `power3.inOut` | the same flood, as a reveal | drifts off the diagonal (`x +24`, `y −24` × dir) |

- No attribute: the classic cut (the circle on a field change, the plain hold on the same field).
- On a field change the iris element paints the shape: a circle (`iris`, `dot`, which keep `--iris-x/y/r` and the scale, so dotglobe's clip still matches) or a full-frame layer `.iris[data-state="wipe"]` with an inline `clip-path: polygon(evenodd, …)` (`quad`, `flood`); the incoming scene is clipped to the same shape (J-cut, the outgoing group holds to 0.45 s). A field change **into a globe scene** (`data-globe-mode` other than `hidden`) always keeps a circle (`quad`/`flood` play as `iris`).
- On the same field nothing is painted: the incoming scene is clipped to the region and the outgoing one to the rest of the frame (`complementOf`), so the two never overlap and the stars and the globe stay in view. The outgoing pan stays opaque until the region covers the frame (0.72 s), then fades in 0.06 s. Both clips are removed at `'settled'`.
- Tier C swaps on a field change as before, and on the same field keeps the plain hold (the outgoing motion still varies by style); a tier-locked page (legal, C by policy) keeps the same-field reveals. Touch-cut paints the field in the style (no scene clips: the sections scroll); flow mode has no transition at all.
- The `'cut'` event carries `transition` (the style, or `null`).

### 1.2 Entrances (`data-entrance`, entrances.js)

A scene names how its **in group** arrives on its cut-in with `data-entrance` (default `rise`). The eyebrow, rule, stop and frame keep their own reveal; the first landing always rises (its text was painted by the HTML).

| entrance | headline words | fade and stagger items |
|---|---|---|
| `rise` | rise from their masks (`yPercent 110 → 0`) | opacity 0 → 1, y 24 → 0 |
| `depth` | grow in from depth (`scale 0.85`, `yPercent 30`, opacity 0) | opacity 0 → 1, scale 0.92 → 1 |
| `slide` | slide in from the left (`xPercent −60`, opacity 0) | opacity 0 → 1, x −40 → 0 |
| `wipe` | a mask wipe left to right (`clip-path: inset(0 100% 0 0)` → 0) | the same wipe with the fade |
| `open` | open from the centre line (`clip-path: inset(50% 0 50% 0)` → 0) | the same with the fade |

Only transform, opacity and clip-path change, with the same slots and durations as `rise`. Every film page assigns both attributes so neighbouring scenes differ (tests/transitions.test.mjs and tests/entrances.test.mjs check the shells).

## 2. Modes

Decided once per load (a pointer or preference change takes effect on the next load), mirrored on `html[data-mode]` and `film.mode`:

| mode | when | how it moves | `html` classes |
|---|---|---|---|
| `cut` | fine pointer, motion on, GSAP present | scenes stacked in the fixed `.stage`; wheel (one flick = one cut, with a momentum lock), keys and focus become cuts; Lenis (lazy, fine pointers only) only holds the document scroll on one stage-height slot per scene, so the scrollbar, `#hash` and find-in-page stay meaningful | `js film` |
| `touch-cut` | coarse primary pointer, motion on | scenes in flow, one `100svh` section each, transparent over the fixed `.fields` layer; native `scroll-snap-type: y mandatory` + `scroll-snap-stop: always` (one swipe = one scene); at 35% visibility the field changes (iris; a swipe that turns back reverses it), at 60% the in group plays | `js touch-cut` |
| `flow` | reduced motion (OS **or** the footer switch), no GSAP, or the head safety timer fired | ordinary sections, each painting its own `--field-bg`, native mandatory snap; the in group fades in (200 ms) at 60% visibility; nothing else moves | `js rm` |

- **Short screens** (stage < 560 px): `html.snap-off`. Cut mode falls back to the Round 4 pan (free scroll pans a tall scene 1:1, leaving its slot cuts to the next); touch-cut drops snap for free scroll.
- **Reduced motion:** `motion-pref.js` reads the OS setting and `localStorage['cs-motion']` (`'full' | 'reduced'`); a stored choice wins over the OS. The C37 footer switch calls `setMotionPref(value)`, which stores it and reloads (keeping the hash).
- **Tiers** (`html[data-tier]`, tier.js, DIRECTION §3): A (fine pointer), B (coarse pointer), C (Save-Data, ≤ 2 GB, a p75 frame > 22 ms over the 90 frames after the first landing, or `data-tier-lock` on legal). Tier C turns every iris into a swap (except a cut from a full stop, `data-iris="stop"`, which keeps the circle swell; never on legal), and so does `html.rm`: no blend of two opaque fields. On a swap `'iris'` and `'in'` both sit at 0.12 s: the out group is gone by then, `.fields` and the header switch hard there, and the in group (and the pan fade) start on the new field at once, so no seek frame falls in an empty gap; `'settled'` stays at 0.95 s. A tier only ever goes down, once per load (`onTierChange`).

## 3. Page skeleton

```html
<!doctype html>
<html lang="en-CA">                              <!-- legal.html: <html lang="en-CA" data-tier="C" data-tier-lock> -->
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Services · Cargado Strategies</title>
  <script>
    /* Mode and tier before first paint; flow mode if the engine never starts. */
    (function (d) {
      var h = d.documentElement;
      var FALLBACK_MS = 8000;
      var mm = function (q) { return !!(window.matchMedia && matchMedia(q).matches); };
      var pref = null;
      try { pref = localStorage.getItem('cs-motion'); } catch (e) { /* storage blocked: OS setting only */ }
      var rm = pref === 'reduced' || pref === 'full' ? pref === 'reduced' : mm('(prefers-reduced-motion: reduce)');
      var coarse = mm('(pointer: coarse)') && !mm('(hover: hover) and (pointer: fine)');
      var mode = rm ? 'flow' : coarse ? 'touch-cut' : 'cut';
      h.classList.add('js', mode === 'flow' ? 'rm' : mode === 'cut' ? 'film' : 'touch-cut');
      h.setAttribute('data-mode', mode);
      if (!h.hasAttribute('data-tier-lock')) {
        var c = navigator.connection, mem = navigator.deviceMemory;
        h.setAttribute('data-tier', (c && c.saveData) || (mem && mem <= 2) ? 'C' : coarse ? 'B' : 'A');
      }
      /* … rescueNav, wait and arm as on every page; the safety timer does:
         h.classList.remove('film', 'touch-cut'); h.classList.add('rm', 'film-fallback'); h.setAttribute('data-mode', 'flow'); */
    })(document);
  </script>
  <!-- fonts, base.css, fx.css, ui.css, visual.css, <page>.css (2b's head links) -->
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>   <!-- no ScrollTrigger, no Lenis tag -->
  <script type="module" src="pages/services.js"></script>
</head>
<body data-page="services">                    <!-- home | services | story | partners | legal -->
  <!-- splash: the boot intro block, the same in every film shell (legal too) -->
  <div class="stage">
    <div class="fields" aria-hidden="true"></div>
    <!-- canvases: <canvas id="globe"> (2c), stars, grain -->
    <main class="scenes" id="content">
      <section class="scene" id="intro" data-field="ink" data-archetype="O" data-iris="trigger" aria-labelledby="intro-title">
        <div class="scene__inner"> …content… </div>
      </section>
      …
      <dialog class="dialog" id="…">…</dialog>   <!-- one per page, after the last scene -->
    </main>
    <div class="iris" aria-hidden="true"></div>
  </div>
</body>
</html>
```

- The inline head script is identical on every page. The engine re-checks the same rules (plus "is GSAP here") and writes the classes again, so the mode never disagrees with the CSS.
- The engine creates `.scene__inner`, `.scene__pan`, `.fields`, `.iris` and (cut mode) `.scroll-spacer` when they are missing, but keep them in the markup.
- Do not write CSS like `.scene__inner > .grid`: the engine wraps the children in `div.scene__pan`. Use `.scene__inner .grid` or classes.

## 4. Scene attributes and in-group hooks

On `section.scene`:

| attribute | values | meaning |
|---|---|---|
| `id` | unique | deep links (`page.html#id`), `html[data-scene]` |
| `data-field` | `ink \| bone \| gold` | the field (iris, `.fields`, the header via `html[data-hdr-field]`) |
| `data-transition` | `iris \| dot \| quad \| flood` | how a cut **into** this scene moves (and a cut back out of it): §1.1. Unset = the classic cut |
| `data-entrance` | `rise \| depth \| slide \| wipe \| open` | how this scene's in group arrives on its cut-in: §1.2. Unset = `rise` |
| `data-iris` | `stop \| center \| trigger \| "x% y%"` | iris origin when this scene is entered: the outgoing scene's `.stop`, the viewport centre, the clicked trigger, or viewport percentages. Unset = the trigger, else the centre. `cut(…, { origin })` overrides it |
| `data-alias` | space-separated names | `#name` resolves to this section (a real `id` always wins) |
| `data-open` | `dialogId:key …` | after a hash lands here, each pair whose key is the hash (`*`: any alias, not the own id) fires a cancelable `cs:open` on `#dialogId`; unless prevented, `ui-dialog.js` opens it |
| `data-title` | text | the `'scene'` event title (else the first heading) |
| `data-globe-mode` | `sphere \| map \| ring \| medallion \| hidden` | read by dotglobe (2c); default `hidden` |
| `data-globe-arc` | `pulse \| near \| join \| none` | dotglobe's arc. Default: `pulse` for a sphere on the first scene, `near` for a map, else `none`. Partners `#hero` uses `join` |
| `data-globe-label` | text | the arc's label (default "A Professional Near You", or "You" with `join`) |
| `data-globe-face` | `"lat,lon"` | the sphere view (default: Canada for a map, the hero view for a sphere) |
| `data-stars` | `dim` | layers.js dims the stars to `--stars-op-long` behind long text (inquiry, apply) |
| `data-archetype` | `M \| O \| R \| D \| P \| stage \| credits` | fit-audit and CSS |
| `data-dur`, `data-pose`, `data-weight`, `data-rest` | — | ignored by the engine (`data-pose` is still `globe-fit.js`'s) |

The **in group** (film-reveals.js), in DOM order; a hook inside another hook is skipped (the outer one wins), except `.stop`:

| hook | in animation | slot |
|---|---|---|
| `.eyebrow` (automatic) | mask slide inside its own box, 0.45 s | `in` |
| `[data-reveal="words"]` (`lines` and `chars` play as words) | each word rises from its mask (`yPercent 110 → 0`), 70 ms apart | `in + 0.08` |
| `.rule` (automatic) | `scaleX 0 → 1` from the left | after the words |
| `[data-reveal="fade"]` | opacity 0 → 1, y 24 → 0 (2D only) | 60 ms after the previous item |
| `[data-reveal="stagger"]` | its children as fade, 60 ms apart | as above |
| `[data-reveal="scale"]` | opacity 0 → 1, scale 0.96 → 1 | as above |
| `.stop` (automatic) | scale 0 → 1, `back.out(3)` | 0.3 s after its heading's last word starts |
| `[data-frame]` on an SVG `rect`/`path` | `stroke-dashoffset` length → 0, 0.6 s | 40% of a same-field cut, else with the group |
| `[data-reveal="none"]` | none: shows with its scene | — |

- `data-delay="s"` (0–0.6) puts an item `s` seconds after `'in'`. Every slot is clamped so the group lands by `'settled'`; long lists get a tighter stagger.
- One `words` heading per scene. Word masks are `<span class="rv-mask"><span class="rv-word">…</span></span>` with `data-split="1"` on the heading; `tools/build-splits.mjs` writes them into dist, `film-split.js` does it at runtime in `site/`. Text inside `.stop` is never split. Inline children (`<em>`, `<a>`, `.ph`) are kept; `&nbsp;` keeps words together.
- Content outside the in group appears with the pan's own 0.08 s fade, from `'in'` − 0.05 s (0.25 s; at 0 on the compact layout).

Inside scenes, the engine also reads:

| hook | meaning |
|---|---|
| `[data-cut="next \| prev \| <id or alias>"]` | a button or link that cuts on click (`cause: 'click'`, its own centre as the trigger origin). The hero "Next ↓" is `<button class="next" type="button" data-cut="next">` |
| `a[href="#id"]` (same page) | `pushState`, then a jump (`cause: 'hash'`) with the link as the trigger. `#wa-sheet…` is never the engine's |
| `[data-snap-keys="off"]` | the element and its children keep every scroll key (the finder map) |
| `[data-swipe-x]` | marks a component with sideways swipes; not an opt-out (`touch-action: pan-y pinch-zoom` on it) |
| `[data-snap="off"]`, `[data-lenis-prevent]` | wheel and touch inside it are left to it while it can still scroll that way, and never chain to the page |
| `[data-film-tab]` | written by the engine: a parked control's original tabindex (`''` = none) |
| `[data-globe-anchor]` | the box dotglobe places itself in (`globe-fit.js`); keep it empty, in reserved space |
| `<div class="medallion" aria-hidden="true">` | **medallion contract**: with `data-globe-mode="medallion"`, dotglobe shrinks the globe into this disc, then fades it up and glints it once (`--glint`) on the cut timeline. Animate the words, never `.medallion` (`.medallion--sm` for Partners `#close`) |

## 5. Page module

```js
// pages/home.js
import { boot } from '../core/main.js';

renderDynamicContent();                                   // 1. dynamic DOM first (synchronously)
const { film, chrome, sfx, tier, globe, sheet } = boot(); // 2. splash → tier → chrome → film → sheet hub, globe → idle extras

film.on('cut', ({ toEl, tl, dir }) => {                   // 3. listeners in the same tick
  if (toEl.id !== 'founder') return;
  tl.fromTo(doors, { y: (i) => (i % 2 ? 48 : -48), opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'expo.out' }, 'in');
});
film.on('build', ({ sceneEl, index }) => { /* layout fitters only: measure and cache */ });
```

- `boot()` returns synchronously: `film`, `chrome` (`{ header, onMenuToggle, closeMenu }`), `sfx` (a facade that forwards to sfx.js once it loads on idle; use it instead of importing `./sfx.js`, which would put sound back into the page's initial bundle), `tier` (`'A' | 'B' | 'C'`), `globe` (a Promise of the dotglobe API, or `null` on legal and pages with no `<canvas id="globe">`) and `sheet` (a Promise of the WhatsApp sheet API).
- Heavy page code (finder, steppers) loads per scene on idle: `perf.onIdle` plus a dynamic `import()`.

**Rules for `'cut'` listeners:**
1. Filter on `toEl` (or `to`) and return early for other scenes.
2. Animate `transform` and `opacity` only (`clip-path: inset()` for media wipes). No layout reads inside the listener or tween callbacks: measure in `'build'` and cache.
3. Use `tl.fromTo(...)` with explicit start and end values at a **label** plus an offset (`'in+=0.1'`), never an absolute time: touch-cut puts `'out'`, `'iris'` and `'in'` at 0, and the same listener works in both modes.
4. Never call `tl.play()`, `pause()`, `kill()` or `timeScale()`. Appends may run past `'settled'` (W2 ≤ 1.4 s); `'landed'` waits for them.
5. Nothing that loops or repeats: autonomous motion stops within 5 s (DIRECTION §2).
6. When `immediate` is true the timeline jumps to its end straight after the listeners: `fromTo` end states make that correct.

## 6. Film API

| member | |
|---|---|
| `mode` | `'cut' \| 'touch-cut' \| 'flow'`; `enabled` = `mode !== 'flow'` |
| `ready` | Promise: first build and first landing done (`html.film-ready` at the same moment, every mode) |
| `scenes`, `current`, `currentScene`, `isCutting` | `current` changes at the **start** of a cut, so `next()` during a cut counts from the target |
| `cut(to, { cause, origin, immediate })` | plays one cut; `to` is an index, an id or alias (with or without `#`) or an element in a scene. Returns `false` when `to` does not resolve or the input lock drops a step; a cut to the current scene plays nothing and returns `true` |
| `next(opts)` / `prev(opts)` | a step (`cause: 'step'`, input lock applies); `false` at the ends |
| `goTo(target, { immediate, cause, origin })` | a jump: interrupts a running cut. `immediate: true` lands at once with the in group at its end state before it returns (deep links, fit-audit). Before `ready` it is queued |
| `on(name, cb)` → unsubscribe; `off(name, cb)` | events below |
| `refreshReach()` | re-run the Tab reach (call it after a component injects or reveals controls); a no-op outside cut mode |
| `isParked(el)` | true when `el`'s scene is outside the reach set (its controls are `tabindex -1`); `false` outside cut mode |
| `stop(token)` / `start(token)` | input hold for menus and dialogs, reference-counted per token (`'menu'`, `'dialog'`). Sets `html.film-stopped`. Cut mode: keys and wheel are ignored, an unasked scroll is put back; touch-cut and flow: 2b's CSS sets `overflow: hidden` |
| `irisTo(field, { x, y })` | `iris.js`, re-exported (pages normally never call it) |
| `refresh()` | schedule a rebuild. Rarely needed: a scene whose overflow changes rebuilds by itself |
| `seekCut(to, p)` | test hook (T5): builds the cut to `to`, paused at progress `p`; `tl.progress(1)` finishes it and fires `'landed'` |
| `lenis` | the Lenis instance in cut mode on fine pointers, else `null`. Do not drive it |

| event | payload | fires |
|---|---|---|
| `'ready'` | `{ mode }` | once, with `film.ready` |
| `'build'` | `{ sceneEl, index, mode }` | per scene after layout, on the first build and every rebuild. Layout fitters only |
| `'cut'` | `{ from, to, dir, tl, cause, origin, fieldChange, fromField, toField, fromEl, toEl, mode, immediate, transition }` | when a cut timeline is created, before it plays (`from === −1` on the first landing; while the splash is up that cut is rendered at its start and plays on `cs:splash-aperture`, at most 2.6 s). `transition`: §1.1. `cause`: `wheel key touch step goto hash focus click load` |
| `'landed'` | `{ index, id, el, field, from, cause, mode }` | when the whole timeline (page appends included) is done; once on load (`cause: 'load'`); in flow mode whenever the current section changes |
| `'field'` | `{ field, from }` | at 50% of the iris or crossfade, with `html[data-hdr-field]` |
| `'scene'` | `{ index, id, el, field, title, count }` | at cut start |
| `'deeplink'` | `{ id, alias, el, scene, open }` | a hash resolved (load, same-page link, `hashchange`, `popstate`); `alias` is the hash when it matched a `data-alias`; `open` is `{ dialog, key }` or `null` |
| `'rebuilt'` | `{}` | after a rebuild |

Behaviour you get for free: same-page `#links` and deep links (aliases too) cut there; back/forward follow; focusing an element in another scene cuts to it (cut mode); only the current scene takes clicks; Tab never lands in a hidden scene (far scenes are parked, but stay in the accessibility tree so browse mode reads the whole page); the phone menu holds input (`film.stop('menu')`).

## 7. What the engine writes, and the CSS it needs (2b owns all CSS)

On `<html>`: the mode classes, `data-mode`, `film-ready`, `film-fallback` (head timer), `is-cutting` (cut start → landed), `film-stopped`, `snap-off`, `data-scene` and `data-field` (at `landed`, with `is-cutting` removed: one root restyle per cut), `data-hdr-field` (at 50% of the iris), `data-tier`, and `--vt-x` / `--vt-y` during a View Transition. On scenes: `is-active`, `is-near`, `is-reachable`, `is-entering` (stack above `.iris`), `is-leaving` (below it), `is-laid-out`, `data-overflow` (px, QA) and `is-panned` on `.scene__inner` (pan fallback). On `.fields`: `data-field` (when an iris completes). On `.iris`: `data-field`, `data-state` (`circle | idle`), `--iris-x`, `--iris-y`, `--iris-r` and an inline `transform: scale()` during the cut only. The rule each one needs is in api.md §8.

## 8. Sound, the WhatsApp sheet, chrome

- **Sound** (sfx.js, 2d; DIRECTION §8): three voices. Breath on a field-change cut, blip on a click of a button / `.btn` / `.row` / `.chip` / tab / `summary`, chime on `cs:wa-opened` or `sfx.play('chime' | 'success')`. Master gain 0.12. Silent on coarse pointers; chime only under `html.rm`. The C37 switch persists `localStorage['cs-sound']` = `'on' | 'off'` and dispatches `cs:sound` `{ on }`. `sfx.has(name)`; old names `'click'` / `'pop'` → blip, `'success'` → chime, every other old name is a silent no-op. `data-sfx="none"` on an element (or an ancestor) opts it out of the click blip.
- **WhatsApp sheet** (wa-sheet.js, 2d): any `a` or `button` with `data-wa-sheet` (empty, or a step: `need`, `city`, `send`, `contact`), plus `data-need`, `data-context`, optional `data-city`, opens the sheet; a same-page `#wa-sheet` or `#wa-sheet?contact` link does too. Keep a real `wa.me` `href` so the link works with no JS. `main.js` loads the sheet on the first trigger or on idle.
- **Chrome** (chrome.js, 2b): header, menu, credits footer, the C37 switches, `[data-monogram]`, `[data-when]`, `?review=1` → `html.ph-loud`. `whatsapp.js` builds every message; `config.js` holds every editable value (2d edits it).

## 9. Helpers for other modules

- `motion-tokens.js`: `DUR`, `EASE` (keyed by cut step), `CSS_EASE` (WAAPI) and `CUT` (label times). The GSAP mirror of base.css `--dur-*` / `--ease-*`: change both together.
- `tier.js`: `initTier()`, `getTier()`, `tierConfig(tier)` (the DIRECTION §3 row: globe, points, DPR, halo, stars, grain, iris, header blur), `onTierChange(cb)`, `sampleTier(film.ready)` (main.js runs it).
- `perf.js`: `onIdle(cb)`, `yieldToMain()`, `forEachSliced(items, fn)`, `finePointer()`, `saveData()`, `lowPower()` (tier ≠ A), `createLoop(frame, { idleMs })` (an rAF loop that parks when hidden, when `frame` returns false, and `idleMs` after its last `wake()`; `sleep()`), `onInputIdle(cb, 5000)` (no pointer, wheel, key, touch or landing for 5 s) and `noteActivity()`.
- `motion-pref.js`: `prefersReducedMotion()`, `osReducedMotion()`, `motionPref()`, `setMotionPref(value)`, `REDUCE_QUERY`, `MOTION_KEY`.
- `film-events.js`: `createEmitter`, `fontsReady`, `sceneTitle`, `hashTargetOf`, `idFromHash`.
- `splash.js` (2c): `anchorBox(el, scene)` (an element's box relative to its scene, transforms ignored), `circleOfBox(box)` (the shared globe circle that fills a box) and `splashState()`. main.js loads the splash only on pages with `#splash`; without one it sets `html.splash-done` itself.
- **The splash** (owner, 2026-10-26: the Portfolio boot intro). The `#splash` block in every film shell plays from its CSS alone (visual.css §1), 4 s (owner, 2026-10-28: slowed 1.6x from 2.5 s): 0-1.44 s the scan (brackets, tick rulers, ridges round the C/W mark, a gold scanline lighting it, Scan 00 → 100 %, Status Scanning → Verified), 1.44-2.08 s Access Granted, 2.08-2.56 s the collapse to a gold dot, 2.72-3.52 s the gold flood and the name (`SITE_NAME`, founder and city from config.js), 3.52-4 s the whole splash fades out evenly (one uniform fade, owner 2026-10-28). splash.js fills the names and the counter, sends `cs:splash-aperture` at 3.55 s (the hero globe's circle, else a centred one; the first landing plays then) and `cs:splash-done` at 4 s. It plays only on an open and a refresh (owner, 2026-10-28); a same-origin `navigate` and back/forward skip it (the shell's inline script, `splashWanted()`). On story and legal the flood is ivory paper instead of gold (no gold field on those pages). Any input fades it in 150 ms; reduced motion shows the name card for 600 ms, then fades it.
- Internal (do not import): `film.js`, `cut.js`, `iris.js` (except via `film.irisTo`), `film-snap.js`, `touch-cut.js`, `film-reveals.js`, `film-split.js`, `film-map.js`, `film-flow.js`, `film-reach.js`, `film-links.js`.

## 10. Between pages: View Transitions

Same-origin cross-page link clicks store the link's centre in `sessionStorage['cs-vt']`; on `pagereveal` the classic head script sets `--vt-x` / `--vt-y` (scaled to the new viewport) and 2b's `::view-transition-new(root)` grows a circle from there over `--dur-vt`. Under `html.rm` both `pageswap` and `pagereveal` skip the transition. Browsers without support navigate normally. `pagereveal` fires before the first render, before any module runs, so that half lives in the head script; main.js keeps the click and `pageswap` halves and drops a `cs-vt` the head script did not consume.

## 11. Conventions

- Animate only `transform`, `opacity` and `clip-path`. Choreography goes in `film.on('cut')` at a label; hover micro-transitions are the only other motion.
- Nothing measures with `getBoundingClientRect()` for layout decisions inside a cut. Components use `offsetTop`, `offsetHeight`, `clientHeight`, `scrollHeight`.
- Never invent partners, people, photos, reviews, ratings, counts or licence numbers. Use `.ph` brackets and "Partner spot available". Compliance copy is verbatim (DIRECTION "Fixed constraints" and §10).
- Display type is the Times New Roman stack in Title Case as written (never `text-transform`); body Manrope; UI Poppins. Black and gold only.
- Tap targets ≥ 44 px; everything works from 360 px wide; every scene fits one screen (`tools/fit-audit.mjs`, also `--flow` and `--touch`).
- Page CSS in `pages/<page>.css` (an @import list of `sections/<page>/…`), page JS in `pages/<page>.js`, section markup and behaviour in `sections/<page>/<name>/`. Small functions, named constants, no `console.log`.
- QA every page in the three modes: cut (1440×900), touch-cut (390×844, coarse pointer) and flow (reduced motion). Console clean, cut through every scene forward and back, deep links, Tab through every scene.

## 12. Round 4 compatibility (removed in stage 6)

`film.on('progress' | 'built' | 'snapstart' | 'snapend')` never fire (registering is harmless). `scrollToTime` is a no-op, `timeOf` returns `null`, `blend()` returns the current field with `mix: 1`, `time`, `total`, `progress`, `velocity` are 0, `timeline` is `null`, `timings` is `[]`. `film.snap` is a thin alias (`block`/`unblock` = `stop`/`start`, `to` = `goTo`). Round 4 `'build'` listeners that append scrubbed tweens get a `tl` that discards every call and a zeroed `timing`, so they do nothing instead of throwing; move that choreography to `film.on('cut')`.

Chrome's Issues panel reports "Interactive element inside of a `<summary>`" when the engine parks a `<summary>` (sets its `tabindex`). It is a false positive.
