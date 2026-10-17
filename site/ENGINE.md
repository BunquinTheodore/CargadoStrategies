# Cargado Strategies — engine guide for page builders

Everything here is in `site/`. Read `PLAN.md` for content and compliance. This guide covers how to build a page on the shared foundation. Plain HTML, CSS and ES modules; `site/` runs as it is, and `npm run build` (project root) makes the optimised copy in `dist/` for hosting (see README).

Serve `site/` over HTTP and open a page. On Windows, plain `python -m http.server` has a small connection queue and refuses some of the parallel module requests, and the page then drops to flow mode after 8 s. Use a threaded server with a larger queue instead, bound to 127.0.0.1 and opened as `http://127.0.0.1:PORT/`:

```python
# serve.py — run as: python -I serve.py PORT "C:\Cargado Strategies\site"
import functools, http.server, sys

class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True

port, root = int(sys.argv[1]), sys.argv[2]
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=root)
Server(('127.0.0.1', port), handler).serve_forever()
``` The five pages are the reference: every hook below is used on at least one of them (the old `_smoke.html` test page is gone).

---

## 1. Page skeleton (copy this)

```html
<!doctype html>
<html lang="en-CA">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Services · Cargado Strategies</title>
  <meta name="description" content="…unique per page…">
  <meta name="theme-color" content="#0B0B0C">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <script>
    /* Film or flow mode before first paint; falls back to flow if the engine never starts. */
    (function (d) {
      var h = d.documentElement;
      var FALLBACK_MS = 8000;
      var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      /* The visitor's "Pause animation" choice (assets/js/motion-pref.js). */
      if (/[?&]motion=off(&|$)/.test(location.search)) rm = true;
      try { if (localStorage.getItem('cs-motion') === 'off') rm = true; } catch (e) {}
      h.classList.add('js', rm ? 'rm' : 'film');
      /* If the site script never ran (a blocked or failed module), chrome.js drew no header:
         give the page a plain nav so every page stays reachable. */
      var rescueNav = function () {
        if (d.querySelector('.site-header, .nav-rescue')) return;
        var here = location.pathname.split('/').pop() || 'index.html';
        var links = [['index.html', 'Home'], ['services.html', 'Services'], ['story.html', 'Our Story'],
          ['partners.html', 'Become a Partner'], ['legal.html', 'Legal']];
        var nav = d.createElement('nav');
        nav.className = 'nav-rescue';
        nav.setAttribute('aria-label', 'Main');
        nav.innerHTML = links.map(function (l) {
          return '<a href="' + l[0] + '"' + (l[0] === here ? ' aria-current="page"' : '') + '>' + l[1] + '</a>';
        }).join('');
        d.body.insertBefore(nav, d.body.firstChild);
      };
      /* Hidden (background) tabs cannot start the film, so their time does not count. */
      var wait = function () {
        d.addEventListener('visibilitychange', function f() {
          if (d.visibilityState !== 'visible') return;
          d.removeEventListener('visibilitychange', f);
          arm();
        });
      };
      var arm = function () {
        setTimeout(function () {
          if (h.classList.contains('film-ready')) return;
          if (d.visibilityState === 'hidden') return wait();
          h.classList.remove('film'); h.classList.add('rm');
          rescueNav();
        }, FALLBACK_MS);
      };
      if (rm) setTimeout(rescueNav, FALLBACK_MS);
      else if (d.visibilityState === 'hidden') wait();
      else arm();
    })(document);
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <!-- non-blocking fonts: preload + media="print" swap + <noscript> (copy from any page) -->
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&amp;family=Poppins:wght@400;500;600&amp;family=Tinos:wght@400;700&amp;display=swap">
  <link rel="stylesheet" href="…same url…" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="…same url…"></noscript>
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/fx.css">                <!-- Round 3 shared effects -->
  <link rel="stylesheet" href="assets/css/services.css">           <!-- page styles only -->
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
  <link rel="modulepreload" href="assets/js/main.js">
  <link rel="modulepreload" href="assets/js/film.js">
  <link rel="modulepreload" href="assets/js/chrome.js">
  <script type="module" src="assets/js/services.js"></script>
  <style id="splash-css">…splash critical CSS, identical on every page…</style>
</head>
<body data-page="services">                    <!-- home | services | story | partners | legal -->
  <div class="splash" id="splash" aria-hidden="true">…monogram, wordmark, line…</div>
  <div class="stage">
    <div class="fields"></div>
    <canvas id="stars"></canvas>
    <canvas id="gl"></canvas>
    <div class="grain"></div>
    <div class="hud"></div>
    <main class="scenes" id="content">
      <section class="scene" id="intro" data-field="ink" data-dur="5"
               data-iris="70% 40%" data-pose="1.4,0,0,0,0,1" data-title="Services"
               aria-labelledby="intro-title">
        <div class="scene__inner">
          …content…
        </div>
      </section>
      …
      <section class="scene" id="close" data-field="gold" …>
        <div class="scene__inner">
          …closing action…
          <div data-footer></div>          <!-- chrome.js fills in the footer -->
        </div>
      </section>
    </main>
  </div>
  <div class="scroll-spacer"></div>
</body>
</html>
```

- The inline head script must stay, identical on every page. It picks film mode or flow mode before first paint. If the engine has not started after 8 s of the tab being visible, it falls back to the readable flow mode. A page opened in a background tab waits until it is shown before the 8 s start, and a timer that runs out while the tab is hidden waits for the tab to come back, so a background load never lands in flow mode by mistake. If the site script never ran at all (a blocked or failed module), chrome.js drew no header, so the same script adds a plain `nav.nav-rescue` (Home, Services, Our Story, Become a Partner, Legal) at the top of the page after 8 s, in flow mode too; it does nothing when the header exists.
- Do not add the header, the WhatsApp float, the phone bar or the skip link yourself. `chrome.js` injects them.
- The engine creates any stage layer that is missing (`.fields`, `#stars`, `#gl`, `.grain`, `.hud`, `.scroll-spacer`), but keep them in the markup.

## 2. Page module

```js
// assets/js/services.js
import { boot } from './main.js';
import { CATEGORIES } from './config.js';

renderCategories();            // 1. build dynamic DOM FIRST (synchronously)
const { film, chrome } = boot(); // 2. chrome → film → layers → globe

film.on('build', ({ tl, sceneEl, timing }) => { … });   // 3. listeners in the same tick
film.on('deeplink', ({ id, el, scene }) => { … });
```

- Render content that depends on JS **before** `boot()`. The film measures scenes once fonts are ready. If content changes later, the engine rebuilds automatically: a ResizeObserver watches every scene, and `film.refresh()` forces a rebuild.
- `build` listeners run again on every rebuild (resize, content change), so they must be idempotent. Only add tweens to `tl`. Do not keep references to old timelines.

## 3. Scene attributes

| attribute | meaning | default |
|---|---|---|
| `id` | scene id; `#id` links and `page.html#id` deep links go to it | required |
| `data-field` | `ink` \| `gold` \| `bone`, the scene background and colour set | `ink` |
| `data-dur` | length in film seconds (scroll ≈ 0.9 × screen height per second) | `4` |
| `data-iris` | where the iris opens, `"x% y%"`; it runs only when the field changes, otherwise the scene crossfades | `50% 50%` |
| `data-pose` | globe pose `"x,y,z,rx,ry,s"`; rx/ry are radians relative to "Canada faces the camera"; `s=0` hides the globe; omit it to keep the previous pose | first scene: `0,0,0,0,0,1` |
| `data-pose-sm` | pose for narrow screens (stage aspect < 0.9, i.e. phones and portrait tablets) | `data-pose` |
| `data-pose-md` | pose for screens where the columns stack (≤ 1099 px wide, not narrow) | `data-pose` |
| `data-title` | HUD title | first h1/h2/h3 text |
| `aria-labelledby` | point it at the scene heading | recommended |

Globe x is in world units: about ±2.2 reaches the screen edge at 16:9. On narrow screens (aspect < 0.9) the engine multiplies x by 0.3 and scale by 0.78 automatically, and that also applies to `data-pose-sm` (write `3.4` to land at about `1.0`). The globe picks the pose set (`sm` / `md` / default) on every build, and a resize always rebuilds, so pages need no resize code. `globe.js` exports `CAMERA` (`FOV, Z, NARROW_ASPECT, NARROW_X, NARROW_SCALE`), `poseLayout()` and `scenePose(el)` for pages that turn screen boxes into poses (story.js). On phones the globe canvas is drawn at 0.55 opacity; a page can change that with `--gl-opacity-sm` on `body`. Useful poses: hero right `1.4,0,0,0,0,1`; left `-1.7,0.1,0,0.1,-0.5,0.8`; centred behind text `0,0,0,0.3,2,1.2`; hidden `0,0,0,0,0,0`.

## 4. Reveal hooks (inside a scene)

| hook | effect (in) | out |
|---|---|---|
| `data-reveal="lines"` | words get masks and each visual line slides up from `yPercent 110`, staggered. **On h1/h2 this becomes `chars` automatically** (section 11); keep lines with `data-fx="lines"` | lines leave upwards |
| `data-reveal="chars"` | characters rise, fade and turn up out of a rotateX, staggered (textfx.js) | characters leave upwards |
| `data-reveal="fade"` | opacity 0→1, y 24→0 (+ rotateX/translateZ depth on fine pointers). **On `.eyebrow` this becomes a decode automatically** (section 11) | opacity 0, y −24, scale 0.98 (+ depth) |
| `data-decode` | text scrambles through glyphs and locks in left to right; scrambles out at the scene's exit. Works even nested inside another reveal | decode out |
| `data-reveal="stagger"` | the direct children fade and rise with a 0.06 stagger | children out, staggered |
| `data-reveal="scale"` | opacity 0→1, scale 0.96→1 | as fade |
| `data-delay="0.5"` | optional start point, as a share (0–1) of the scene's in-phase | auto: 0.38, +0.08 each |

- Reveals nested inside another reveal are ignored. Put the hook on the outer element.
- The first scene starts fully visible (no in-phase). The last scene has no out-phase.
- `lines` is for headings and short text. Inline children (`<em>`, `<a>`, `.ph`) are kept. `&nbsp;` keeps words together.
- Everything is scrubbed and reversible. Never use timers or `onComplete` for choreography.
- `lines` and `stagger` spread their items by a fixed share of the in-phase, but the spread is capped so the last item lands by the scene's fully-in point (`focusTime`), however many items there are. A decode (eyebrow or `data-decode`) is capped the same way: a late one (the 4th or later reveal in a scene, or a large `data-delay`) runs shorter so it is fully locked in by `focusTime`. Pages no longer need a `data-delay` workaround for that.

## 5. Timeline anatomy and the `build` payload

For each scene: `start → [in-phase: iris/crossfade + container fade + reveals] → focusTime (fully in) → hold (+ pan) → [out-phase] → end`. The next scene starts at `end − 12% of its base duration`.

`film.on('build', payload)` fires per scene with:
`{ tl, sceneEl, sceneStart, index, timing }` where `timing` = `{ id, el, start, end, dur, base, inStart, inDur, inEnd, outStart, outDur, focusTime, irisEnd, activeFrom, panStart, panEnd, pan, field, prevField, iris }` (film seconds).

Example of an extra scrubbed tween:
```js
film.on('build', ({ tl, sceneEl, timing }) => {
  if (sceneEl.id !== 'process') return;
  tl.fromTo(sceneEl.querySelectorAll('.step'), { xPercent: -8, opacity: 0 },
    { xPercent: 0, opacity: 1, stagger: 0.1, duration: timing.inDur * 0.5 }, timing.inStart + timing.inDur * 0.4);
});
```
Rules: use `fromTo` with explicit values. Add `immediateRender: false` on tweens that should not set their start state at build time (out-tweens). Animate only `transform`, `opacity` and `clip-path`.

**The `tl` in a `build` payload is a recorder, not the GSAP timeline** (film-batch.js). It has `fromTo`, `to`, `from` and `set` with GSAP's arguments and returns itself; the calls are replayed onto the real timeline, in order, once every scene has been recorded. So: call only those four methods on it, do not keep the return value as a tween, and do not read tween state at build time. A listener that measures the DOM sees the settled layout (no from-state has been written yet). The `built` / `rebuilt` payloads carry the real timeline. Do not pass `transformOrigin` in a tween when CSS can set it: GSAP then re-reads every target's computed origin, one forced style pass each (fx.css sets `.tx-char`'s). A `transformOrigin` set by a tween stays written on the element, and the hover tilt (CSS `rotate`, interact.js) pivots on it: if a tween sets `transformOrigin` on a tilt card, tween it back to `50% 50%` by the time the card settles (services-fx.js swing).

- **Polygon clip-paths:** do not tween between two `polygon(…)` strings. GSAP 3.12.5 pairs the numbers inside them wrongly (a mid-scrub frame can jump back and forth, and forward and backward scrubs differ). Tween a plain value and redraw the polygon on each update instead, as textfx.js does for the decode and story.js for the monogram sweep: `tl.fromTo(state, { p: 0 }, { p: 1, duration, ease: 'none', onUpdate: () => { el.style.clipPath = polygonAt(state.p); } }, at)`. `inset()` and `circle()` clip-paths tween correctly.
- **SVG children:** GSAP ignores CSS `transform-origin` on SVG elements and measures the origin from the element's own box. Put it in the tween: `{ scale: 0, transformOrigin: '50% 50%' }` (or `svgOrigin: 'x y'` in the SVG's user units).
- **QA, reversibility checks:** GSAP renders a tween's first frame lazily, so a style read straight after `tl.time(t)` can be stale on the very first pass. Run one warm-up pass over the timeline before comparing states, or a one-pass check can falsely report "not reversible".
- **QA, transforms:** after scrubbing back, GSAP leaves `transform: matrix(1, 0, 0, 1, 0, 0)` (or `translate(0px, 0px)`) where the element started with `none`. They are the same state; compare computed matrices, not strings.

## 6. Film API

`boot()` returns `{ film, chrome, globe }`. `film` (the same shape in flow mode):

| member | |
|---|---|
| `film.enabled` | `true` in film mode, `false` in flow mode (reduced motion, libraries missing) |
| `film.ready` | Promise, resolved after the first build |
| `film.on(name, cb)` → unsubscribe; `film.off(name, cb)` | events below |
| `film.goTo(idOrElOrIndex, { immediate, duration })` | scroll (Lenis) to a scene's fully-in point; an element resolves to its scene; flow mode uses `scrollIntoView` |
| `film.scrollToTime(seconds, opts)` | scroll to an exact film time |
| `film.timeOf(id)` | that scene's `timing` object (or null; always null in flow mode) |
| `film.refresh()` | debounced rebuild (call after you change the DOM) |
| `film.stop()` / `film.start()` | pause or resume scrolling (the mobile menu does this) |
| `film.blend()` | `{ from, to, mix }`, the current field transition |
| getters | `time, total, progress, velocity, active, scenes, timeline, timings, lenis` |

Events:

| event | payload | when |
|---|---|---|
| `build` | see §5 | each scene, on every (re)build (film mode only) |
| `built` | `{ tl, timings, total }` | after a full (re)build, before the scroll position is restored |
| `rebuilt` | `{ tl, timings, total }` | after a rebuild (resize, content change) once the scroll position has been restored. The position is restored relative to the active scene: a playhead that was in the scene's hold stays in its hold even when the scene got shorter (a long form replaced by a short success note), instead of resting part-way into the exit. Use it to move the film after a content change, e.g. `film.on('rebuilt', () => film.scrollToTime(t))` |
| `progress` | `{ time, total, progress, velocity, blend }` | every timeline update (film mode only) |
| `scene` | `{ index, id, el, field, title, count }` | the active scene changed (both modes) |
| `field` | `{ field }` | the dominant field changed (also sets `html[data-field]`) |
| `deeplink` | `{ id, el, scene }` | on load with a hash, on same-page `#links`, on back/forward, and when the hash is changed by script or by hand (`hashchange`). `el`/`scene` are null when the id is not in the DOM (e.g. a category slug), so handle it yourself (e.g. `film.goTo('categories')`, then select it) |
| `ready` | `{ enabled }` | after the first build |

Behaviour you get for free:
- Same-page `<a href="#id">` clicks are intercepted (pushState + goTo). Links to other pages with a hash (`services.html#legal`) deep-link on load.
- Only the active scene takes clicks (`.is-active`). Its neighbours (`.is-near`) stay focusable, and so does the nearest scene in each direction that has something focusable (`.is-reachable`), so Tab always reaches the next scene with a link even when the scenes in between have none. The scene that holds focus counts as a centre too, so a quick second Tab does not skip ahead. Tabbing into a scene moves the film there. Controls in all other scenes are parked (`tabindex="-1"`, original value kept in `data-film-tab`) so Tab skips them, but no scene is ever `inert` or `visibility: hidden`: every scene stays in the accessibility tree so a screen reader's browse mode reads the whole page, and focusing anything there moves the film to it. Field layers below a fully opened iris are hidden, and `will-change` is set only while a layer animates.
- Focus moves that start a film scroll survive a rebuild: if content changes at the same moment (and the engine rebuilds and restores the old position), the engine runs the focus scroll again.
- Content taller than the space between header and bottom bar **pans automatically** with scroll (1:1, transform only). Tabbing to a hidden element pans to it. For a long text box that should scroll on its own (legal pages), wrap it in `.scene__scroll` (internal scroll, `data-lenis-prevent` is added). That scene then does not pan.
- The engine wraps the children of `.scene__inner` in `div.scene__pan`. Do not write CSS like `.scene__inner > .grid`. Use `.scene__inner .grid` or classes.
- `html[data-field]` and `html[data-scene]` follow the playhead. The header, HUD, cursor and float colours follow them.

## 7. Flow mode (reduced motion)

Flow mode also runs when the visitor presses **Pause animation** (header from 760 px, phone menu below): `motion-pref.js` stores `cs-motion=off` in localStorage (or `?motion=off` when storage is blocked) and reloads on the current scene; the inline `<head>` script of every page reads the same key before first paint. This is the WCAG 2.2.2 pause control for the stars, grain and globe, and a plain page for anyone who prefers normal document order.

`html.rm` (no `.film`): scenes become normal stacked sections with their field background, the spacer, stars, grain, HUD and cursor are hidden, and the globe renders one static frame behind the first section. Reveal hooks do nothing (content is simply visible). Hash links scroll natively; on load the engine repeats the hash jump once web fonts have swapped in, so the target lands exactly. Every page must read correctly this way. Check it with DevTools → Rendering → `prefers-reduced-motion: reduce`.

## 8. Chrome, WhatsApp, footer

From `chrome.js` (already run by `boot()`):
- Header: monogram + "Cargado Strategies", nav Home / Services / Our Story / Become a Partner (`aria-current` from `body[data-page]`), Facebook (new tab), WhatsApp, the sound toggle and the "Pause Animation" toggle. Under 1024 px it collapses to a "Menu" button (`aria-expanded`, Esc closes, focus is managed).
- The floating WhatsApp button (≥ 760 px) and the sticky phone bar (< 760 px) carry a prefilled message that names the page. To change the phone bar: `chrome.setBar({ label: 'Get my introduction', href })`. Add `newTab: false` for a same-page link (e.g. `href: '#apply'`); `newTab: true` restores the new-tab behaviour.
- `<div data-footer></div>` is filled with the footer (tagline, WhatsApp +1 (204) 869 2508 · Facebook, company links, legal links `legal.html#disclosure|privacy|terms|conduct`, Q&A `legal.html#qa` (the Q&A scene is `#faq`; its eyebrow keeps `id="qa"`), independent-partner + commission notice). There is no Mark 11:24 in the footer. Or import `footer({ page })` to get the HTML string.
- `<div data-placeholder-card data-category="Legal"></div>` becomes the "Partner Spot Available" card (with `data-cursor-label="Join"`), or use `placeholderCard({ category })`. Its title is an h3; under an h3, pass `level: 4` (`placeholderCard({ category, level: 4 })`, or `data-level="4"` on the slot) to keep the heading outline in order.
- `<a data-wa>` gets the page WhatsApp link. `<a data-wa="custom text">` gets a link with that text. Both open in a new tab.
- Exports: `MONOGRAM` (SVG string, uses `currentColor`), `escapeHtml`, `footer`, `placeholderCard`.

`whatsapp.js`: `waLink(text)`, `pageMessage(page)`, `categoryMessage({ category, type, city, page, request })` (`request` replaces "I'd like an introduction." — use it for the founder's own services), `finderRequestMessage({ category, type, place })`, `partnerQuestionMessage()`, `pageLink(page)`. Every message asks for the service and the city/province and says why the city is needed. State "Nothing is sent until you tap send." near the buttons.

`config.js`: `PHONE`, `WHATSAPP_BASE`, `FACEBOOK_URL` (TODO founder; `FACEBOOK_IS_PLACEHOLDER`), `CONTACT_EMAIL` (empty → use `CONTACT_EMAIL_LABEL` "[company email]" and fall back to WhatsApp), `VIDEO` (empty url → "Founder video coming soon"), `NAV`, `PAGE_NAMES`, `LEGAL_LINKS` (legal scene ids), `CATEGORIES` (`slug, name, description, ownership: founder|partner|both, types[{slug,name}]`), `categoryBySlug`, `PARTNERS = []` (approved partners only, schema in the comment). Category slugs: `insurance, business-strategy, outsourcing, manufacturing, legal, mortgage, real-estate, accounting-and-tax, financial-planning`. If a category slug is used as a deep link, do not also use it as a scene id.

## 9. CSS catalogue (`assets/css/base.css`)

**Fields:** `[data-field="ink|gold|bone"]` (and `.on-ink/.on-gold/.on-bone` for a block inside another field) set `--bg --field-bg --fg --fg-muted --accent --line --line-strong --surface --input-bg --btn-bg --btn-fg --chip-on-bg --chip-on-fg --ph-bg --ph-line --focus --error`. Always colour with these variables, never hex values, so the same component works on every field. `--accent` is gold on ink, black on gold and dark gold `#7A5C12` on bone (AA). All pairs pass AA (worst: dark gold on bone 5.1:1, muted on darkest gold 5.3:1).
**Raw tokens:** `--c-black --c-charcoal --c-gold --c-gold-deep --c-gold-field --c-gold-dark --c-champagne --c-ivory --c-ivory-text --c-white`.

**Type:** `h1,h2,h3,.display` = Times New Roman stack (`"Times New Roman", Times, Tinos, serif`), weight 400, **Title Case as written** (no `text-transform`), slightly negative tracking (`--track-display`, `--track-hero`), line-height 1.02–1.1, `text-wrap: balance`. `em` inside a display heading (or `.display-em`) is the italic accent. Sizes `.t-hero .t-d1 .t-d2 .t-d3 .t-d4`. `.t-lead`, `.t-small`, `.t-xs`. `.eyebrow` (Poppins tracked small caps, accent colour; eyebrows, HUD and form labels are the only uppercase text). `.ui` (Poppins), `.num` (Poppins tabular), `.muted`, `.accent`, `.measure` (`--measure`, 62ch). Paragraphs and list items get `text-wrap: pretty` and hanging punctuation; plain `<p>` in a scene keeps a 55–70ch measure. Body text is Manrope; UI (buttons, labels, chips, HUD, numerals) is Poppins. Manrope/Poppins have metric-matched Arial fallbacks (`'Manrope Fallback'`, `'Poppins Fallback'`), so the font swap causes no layout shift. No other fonts; Josefin Sans is gone. Page CSS must not set `font-weight: 300` or `text-transform: uppercase` on display type.

**Layout:** `.grid` (12 columns) + `.span-1…12`, `.start-1…10`, `.md-span-6/12` (760–1099 px), `.sm-span-6` (< 760, where everything else becomes full width), `.align-center/.align-end`. Add `.keep-md` to keep the desktop `span-*`/`start-*` on **landscape** md screens (e.g. 1024×768) instead of stacking; portrait tablets still stack. Use uneven splits (7/5, 6/3/3). `.stack` (+ `.stack-xs/-s/-l/-xl`) for vertical rhythm; each stack sets its own gap, so a nested plain `.stack` is `--space-m` whatever its parent uses. **Careful:** the top margin of a stack child reads `--stack` on the child itself, so a child that is itself a `.stack-*` sits *its own* gap below its sibling, not its parent's (a `.stack-s` inside a `.stack-l` gets 12 px above it, not 32). Every stack child also gets its parent's gap as `--stack-gap`; write `margin-top: var(--stack-gap)` on such a child when it should keep the parent's rhythm. A `.panel-3d`'s offset edge is a box-shadow (`--panel-offset`, 9 px) that takes no layout space, so inside a `.stack` the sibling after a panel automatically adds `--panel-offset` to the parent's gap (zero-specificity, so a page rule wins). `.row` is an inline flex group. `.lead-rule` is the single gold top rule that marks the leading element. `.rule` is an hr. Spacing tokens `--space-2xs…2xl`, `--page-pad`, `--max-w`, `--header-h`, `--bottom-h`. `--banner-h` (default 0) is an optional fixed band under the header (the legal draft banner): film scenes start below it and flow-mode scroll targets clear it. `html` has `scrollbar-gutter: stable`, so the page width does not change when the film's scrollbar appears.

**Components:**
- Buttons: `.btn` + `.btn--primary` (follows the field), `.btn--ghost`, `.btn--link`, `.btn--sm`, `.btn--lg`, `.btn--block`. Add `<span class="btn__arrow" aria-hidden="true">→</span>` for the arrow nudge. Use one primary action per scene.
- Chips: `.chips > label.chip > input[type=radio|checkbox]` (selected state via `:has(:checked)`) or `button.chip[aria-pressed]`.
- Forms: `.form`, `.form-row`, `.label` (also `legend.label`), `.input`, `.select`, `.textarea`, `.check` (checkbox + text), `.hint`, `.error`, `[aria-invalid="true"]`, `.hp` (honeypot wrapper).
- Accordion: `details.acc > summary + .acc__body`. The "+" marker is CSS `content: "+" / ""`, so it stays out of the question's accessible name. Questions have `text-wrap: balance` (no lone last word on phones).
- Lists with dividers (preferred over card grids): `.list-rule`, `.list-num` with `.list-num__n` (01–04 rows: number, text, action), `.ticks` (✓ list), `.ticks--stack`.
- Placeholders and notices: `.ph` for every [bracket] the founder must confirm. A `.ph` may wrap (long brackets must, at 360 px); keep a short one together with `&nbsp;` (`[24&nbsp;hours]`). On gold, `.ph` text uses `--fg` so it stays AA inside its tinted box. `.notice` (left gold rule, small), `.notice--draft` (the "Draft — to be reviewed by a lawyer in Canada before launch" banner). `.partner-card`, `.partner-card--placeholder`, `.partner-card__avatar/__body/__title/__meta`.
- Utilities: `.nowrap-md` (keeps a short phrase on one line from 760 px; not the same as the grid `.keep-md`), `.visually-hidden`, `.center`, `.mt-0`, `.hide-sm`, `.show-sm`, `.icon` (20 px svg).
- Stage/engine classes (do not restyle): `.stage .fields .field .scenes .scene .scene__inner .scene__pan .scene__scroll .scroll-spacer .hud .grain .cursor-ring .rv-mask .rv-word`, the Round 3 classes listed in §11, html states `.film .film-ready .rm .nav-open .no-webgl .globe-lite .splash-js .splash-done .lenis*`.

## 10. Conventions

- Animate only `transform`, `opacity` and `clip-path`. Everything scroll-linked goes on the master timeline (`build` event). The only exceptions are hover micro-transitions on transform/opacity.
- Never invent partners, people, photos, reviews, ratings, counts or licence numbers. Use `.ph` brackets (`[n] introductions`) and "Partner spot available" cards. Do not use a "verified" badge.
- Show the commission + independent-partner notice wherever partners, finder results or the inquiry form appear. The founder's own businesses are labelled as hers, with `[company name] · [licence #] · [regulator]` placeholders. Strategy: "strategy and coaching only — not licensed accounting, tax or investment advice."
- Ask for city or area and say why. WhatsApp copy: "Nothing is sent until you tap send."
- Mark 11:24 appears as a quiet reference on the story page only, never quoted.
- Tap targets are ≥ 44 px. Everything must work from 360 px wide. Content that is too tall pans automatically, but design scenes to fit at 390×844 where possible.
- Page CSS goes in `assets/css/<page>.css` and page JS in `assets/js/<page>.js` (+ helpers such as `finder.js`, `forms.js`). Keep functions small, use named constants, and leave no `console.log`.
- QA every page at 1440×900 and 390×844: console clean, scrub forward and back, deep links, Tab through every scene, reduced motion.

## Scroll cost (film-map.js)

Scroll distance no longer follows film seconds. Each scene gets a fixed budget, the approach used in the Portfolio film:

- **Transition** (old scene out, next in): `MOTION_PX` = 640px, about 6 wheel notches.
- **Settled frame**: `HOLD_PX` = 180px. Scenes with inputs, or marked `data-rest`, get `REST_HOLD_PX` = 340px. The opening scene always uses the short hold.
- **Overflowing content** pans 1:1 with the scroll.
- `data-weight="1.5"` on a scene scales its budget (0.5–2).

While a frame is held, `.scene__inner` drifts up 22px, so every notch moves something. A scene that pans drifts 11px in the still stretch before its pan and 11px in the one after it (the pan itself stays 1:1), so no part of its hold is dead scroll either.

`film-alive.js` adds cursor parallax on the active scene's `[data-reveal]` pieces through the CSS `translate` property, so it never fights GSAP transforms. `layers.js` adds a scroll cue on the opening frame (bottom centre; below 760 px it sits in the right-hand gutter so it never crosses full-width hero copy; a page may move it with a page-scoped `.scroll-cue` rule, as legal.css does) and makes stars move away from the cursor. Neither runs in flow (reduced-motion) mode or on touch.

---

## 11. Round 3 hooks (type, sound, text fx, cursor physics, 3D, splash, performance)

Everything here is shared and automatic: pages get it without edits. Opt out per element where noted.

### Modules (assets/js)

| module | what it does | started by |
|---|---|---|
| `text-case.js` | `titleCase(text)`: Title Case for any heading, title, button label or nav item written by JS. Minor words (a, an, the, and, but, or, for, of, on, in, to, by, at, as, per, via …) stay lower case unless first, last or after a colon or dash; words with capitals, digits or brackets (WhatsApp, Q&A, `[n]`) are kept as written. Hyphenated words are cased part by part ("30-day" → "30-Day"), except inside a [bracket]. chrome.js uses it for nav, footer and legal links. **Page generators (finder, category headings, results) should wrap their headings in `titleCase()`.** | import |
| `sfx.js` | Web Audio sound effects (no files), see *Sound* | `boot()` |
| `textfx.js` | character reveals, eyebrow decode, hover letter-roll; `readableText(el)` | reveals: film-reveals.js; roll: `boot()` |
| `interact.js` | magnetic pull, 3D tilt + depth + sheen; exports `TILT` (the auto-tilt selector) | `boot()` |
| `cursor.js` | the morphing cursor ring (moved out of layers.js) | `boot()` |
| `splash.js` | dismisses the inline splash | `boot()` |
| `perf.js` | `lowPower()`, `saveData()`, `finePointer()`, `onIdle(cb)`, `createLoop(frame)`: an rAF loop that parks when the tab is hidden or `frame(now, dt)` returns false; `loop.wake()` restarts it; `yieldToMain()`, `forEachSliced(items, fn)` (work in slices of `TASK_BUDGET_MS`) | import |
| `film-batch.js` | the build recorder: `createRecorder()`, `replayInto(tl, recorder)`, `replaySliced(tl, recorder)` (see §5) | film.js |
| `globe-fallback.js` | static SVG globe (Save-Data, no WebGL, failed import) that follows the same scrubbed pose | globe.js |

`boot()` now returns `{ film, chrome, globe, sfx }`. The CSS for all of it is in `assets/css/fx.css`, loaded after base.css on every page.

### Type

Display = `"Times New Roman", Times, Tinos, serif`, weight 400, Title Case in the markup (never `text-transform`). Tinos (the metric twin) is in the Google Fonts link at 400/700 and only downloads where Times New Roman is missing. Manrope 400/500/600 and Poppins 400/500/600 load without blocking render and have metric-matched fallbacks. Write every heading, title, button label and nav item in Title Case; eyebrows, the HUD and form labels stay as tracked small uppercase.

### Text effects (film mode only; flow mode and reduced motion show plain text)

| hook | effect | opt out |
|---|---|---|
| h1 / h2 with `data-reveal="lines"` | **auto** → per-character reveal (rise + fade + rotateX on fine pointers, 2D on touch), scrubbed both ways; the stagger is capped so it lands by the fully-in point | `data-fx="lines"` keeps the line reveal; `data-fx="none"` keeps exactly what the markup says |
| `data-reveal="chars"` | the same, on any element | — |
| `.eyebrow` with `data-reveal="fade"` (or no reveal) as a reveal target | **auto** → scrubbed decode/scramble. The state is a pure function of timeline progress, and glyphs are painted over the real letters, so nothing reflows | `data-fx="none"` |
| `data-decode` | decode on any element, even nested inside another reveal | — |
| `.btn`, `.site-nav__link`, `[data-roll]` | hover / focus-visible letter-roll (fine pointers) | `data-roll="none"` (or `data-fx="none"`); the phone bar never rolls |

Elements with a link or control inside are never split. Split text keeps a visually hidden readable copy (`.tx-sr`, `.roll__sr`) next to an `aria-hidden` visual copy (`.tx-vis`, `.roll__vis`), so screen readers and accessible names read normally. **The `textContent` of a split element holds the text twice, so use `readableText(el)` from textfx.js** (film-events `sceneTitle` already does). If page JS rewrites a heading's or button's text later, give it `data-fx="none"` / `data-roll="none"`.
Classes (do not restyle): `.tx-sr .tx-vis .tx-word .tx-char .dc-c .is-g .is-off .roll .roll__vis .roll__sr .roll-w .roll-c`.

### Scene depth

`.scene__inner` has `perspective: 1400px`. On fine pointers, `fade`, `scale` and `stagger` reveals add `rotationX 10° / z −60` on the way in and `rotationX −8° / z −40` on the way out (`transformPerspective` 900). Phones stay 2D.

### Links

Inline text links get a faint resting underline plus an accent line (`::after`, `transform: scaleX`) that draws in from the left on hover or focus-visible and retracts to the right on leave. This applies to class-less `<a>` inside `p, li, dd, dt, td, figcaption, blockquote, .notice, .hint, .acc__body`, every `.site-footer a`, and any `a.link`. The colour is `--link-line` (default `--accent`: gold on ink, dark gold on bone, black on gold). Nav links use the same motion. Opt out: `data-underline="none"`.

### Cursor physics (fine pointer + film mode only; never in flow mode or reduced motion)

| hook | effect |
|---|---|
| `.btn` (not `.btn--block`), `.wa-float`, `.chip`, `.icon-link`, `.motion-toggle`, `.sound-toggle`, `.nav-toggle`, `[data-magnetic]` | **magnetic** pull toward the pointer (max 10 px; chips softer). It is written to `--mag-x/--mag-y`, which feed the CSS `translate` property together with `--lift` (the hover lift), so GSAP's `transform` is never touched. Opt out: `data-magnetic="none"` |
| `[data-tilt]`, `.panel-3d`, `.partner-card`, `.tile`, `.tier`, `.ticket`, `.offer`, `.intro`, `.inquiry-panel`, `.legal-panel`, `.vframe` | **3D tilt** with the CSS `rotate` property (axis + angle; max 7°, wide cards tilt less). The parent gets `perspective: 1000px` (set by interact.js; a page that runs its own scroll-linked 3D on the card or its children should still set the perspective it needs in its own CSS) and a spotlight sheen follows the pointer (`--mx/--my`, `.fx-sheen > .fx-sheen__glow`, opacity only). Tilt pauses while a text field inside has focus. Opt out: `data-tilt="none"` |
| `[data-depth="32"]` inside a tilt card | lifts by `translateZ(32px)` while the card tilts (the card gets `.has-depth`, `transform-style: preserve-3d`). Cards are set up when the browser is idle after the first build (cards rendered later: on first hover), so the parent perspective is the same before and after the first hover |
| `[data-cursor-label="Open"]` | the cursor ring grows and shows that short label (≤ 14 characters; the ring is sized to fit the measured label, but 10 or fewer reads best). The label also shows when it sits on a link or button, or inside one (a card that is one big link); a link or button *inside* a labelled card shows the plain grow |
| text inputs / textareas | the ring becomes an I-beam bar |
| links, buttons, labels, summary, `[data-cursor]` | the ring grows |
| `.chip` | springs on press and pops when selected (`scale`) |
| `.input/.select/.textarea` | focus glow (set, not animated) |
| touch (`hover: none`) | `.btn, .chip, .icon-link, .wa-float`, the toggles and `[data-press]` shrink slightly while pressed |

Classes added by JS (do not restyle): `.fx-tilt .fx-rel .is-tilting .has-depth .is-magnet .fx-sheen .fx-sheen__glow`; ring states `.is-hover .is-text .is-label .cursor-ring__label`.

**GSAP and the CSS `translate` / `rotate` / `scale` properties.** GSAP 3.12 folds these three properties into `transform` and writes them inline as `none` on every element it tweens a transform on. Any CSS rule that uses them on such an element (the `[data-depth]` lift, the magnetic pull and `--lift`, a hover nudge such as `translate: 6px 0`, a `:active` scale) is then silently cancelled.
- interact.js works around this for its own effects: while an element is pulled, tilted or lifted it removes GSAP's inline `none` and puts it back afterwards. Page hover rules get no such help.
- **Rule:** do not put `data-depth`, `data-magnetic`, a hover `translate`/`scale` or a magnetic class on an element that a timeline tween transforms. Wrap it: the wrapper carries the hover property, the inner element carries the scroll tween (home.html `.compare__lift`, `.map__lift`; story.html `.story-mono__layer`). A negative `data-depth` works the same way (it sinks the layer).
- **Depth limits:** under the 1000px tilt perspective, a negative depth deeper than about −20px on a full-size panel shrinks that layer until it hides behind the face (legal's paper stack uses −8/−16). Positive depths of 16–40px read well; layers that sit near a card edge can be pushed outside the hovered box, so keep them shallow (home's situation rows use 16/24).

### 3D panel

`<div class="panel-3d">` is a shared panel with padding, a line border, an offset second edge (`--panel-offset`, 9 px, a box-shadow: see `.stack` in §9) and a gold depth shadow (per-field `--panel-edge`, `--panel-depth`). It tilts automatically; give children `data-depth` to layer them.

### Sound (sfx.js)

- Names for `sfx.play(name)`: `tick` (`{ index }`), `hover`, `click`, `pop`, `whoosh`, `tone` (`{ field }`), `error` (a soft falling two-note for "check your answers"; 300 ms minimum gap), `success`, `splash`. Pages: `import { sfx } from './sfx.js'; sfx.play('success');` on a form success, or `document.dispatchEvent(new CustomEvent('cs:sfx', { detail: 'success' }))`.
- Automatic: a tick per ~100 px of film scroll (pitch rises with the scene index), a whoosh on scene change (film mode), a soft tone when the field changes, a click blip on links and buttons, a pop on chips, checkboxes, radios, `[aria-pressed]`, `summary`, tabs and selects, and a quiet hover tick on interactive elements (fine pointers). Every voice has a minimum gap (tick 40 ms, hover 70 ms …), and everything goes through one master gain (0.25) and a limiter.
- The AudioContext is created on the first pointer, key or touch activation, so there is no autoplay warning. Nothing plays before that, while muted, or without Web Audio.
- Toggle: `[data-sound-toggle]` buttons (in the header from 760 px, in the phone menu below that). `aria-pressed="true"` means sound is on. Muting stores `cs-sound=off` in localStorage; the default is on.

### Splash

Each page carries it inline: `<style id="splash-css">` in the head and `<div class="splash" id="splash" aria-hidden="true">` (monogram, "Cargado Strategies", gold line) first in `<body>`. Keep both identical across pages. splash.js dismisses it once the fonts and the film are ready, no sooner than 0.9 s and no later than 2.2 s after navigation; the first key, wheel, touch or click dismisses it at once. It leaves through an iris that opens from the centre (clip-path), plays the splash chime if audio is already unlocked, and is then removed (`html.splash-done`). Reduced motion / flow mode: a 0.2 s fade. Without the script, the inline CSS fades it out at 2.6 s; with JS off it never shows. It is decorative, holds nothing focusable and never blocks the page underneath.

### Performance

- **Production build** (`npm run build` in the project root, see README): one minified bundle per page from npm (GSAP, ScrollTrigger, Lenis exposed as the same window globals; three.js tree-shaken into a lazy chunk), split shared chunks, minified CSS, self-hosted fonts. The page entry waits for the first paint, then evaluates the libraries and the page code as separate tasks. The source in `site/` still runs unbundled from the CDNs.
- **No long tasks on load.** The first film build runs in slices of under 10 ms (`perf.js` `forEachSliced`, `yieldToMain`): scene measuring and recording one scene per task, then the batched prime and replay (film-batch.js), so the whole film is built without layout thrashing. Rebuilds (resize, content change) stay synchronous.
- **Layout lock while loading:** until the first build reaches it, every scene after the first has `content-visibility: hidden` (base.css, `html.film:not(.film-ready) .scene:not(:first-child):not(.is-laid-out)`), so the first paint lays out the opening scene only and the build lays out one scene per task. The build adds `.is-laid-out` per scene, and `.film-ready` ends the lock, so every scene is in the accessibility tree again once the film runs (during the splash only the opening scene is). Chrome logs a verbose "Rendering was performed in a subtree hidden by content-visibility" while the build measures; it is expected.
- `boot()` starts chrome, the film and the globe's pose hooks at once; the layers, sound, cursor physics, letter-roll and splash (`initExtras`) start one task later. A page with heavy pre-boot rendering may `await yieldToMain()` between its render and `boot()` (home.js does; page modules may use top-level `await`). Content that sits above the fold should be in the HTML, not injected by script, or it shifts the layout after first paint: the build writes the home intro chips (`home-needs.js`) into the HTML for that reason.
- three.js (`three.module.min.js`) is imported after the film's first build, on idle, and starts in staged tasks (import, renderer, geometry, `compileAsync` shaders, first frame). Low-power devices (`saveData`, `deviceMemory ≤ 2`, `hardwareConcurrency ≤ 2`, or a coarse pointer on a screen ≤ 900 px) get 520 globe points, DPR 1 and no antialiasing, plus 110 stars at DPR 1. Save-Data, missing WebGL or a failed import get the SVG globe (`html.globe-lite`, plus `.no-webgl` when WebGL is missing).
- Every rAF loop of ours (stars, cursor ring, alive drift, globe) sleeps in hidden tabs and parks when idle. Stars drop to a ~16 fps twinkle when nothing moves and stop on bone fields. The globe renders every frame only while its pose or colours change (30 fps idle sway) and stops while hidden (`s = 0`). The cursor and alive loops stop once they have caught up. Tilt and magnetic run once per frame per pointer move, with no loop.
- Fonts never block render. CLS on load is 0 (checked with a layout-shift observer).

### Known DevTools note

Chrome's Issues panel reports "Interactive element inside of a `<summary>`" whenever script sets `tabindex` on a `<summary>` (the film parks far-scene controls this way). It is a false positive, not an error, and it predates Round 3.
