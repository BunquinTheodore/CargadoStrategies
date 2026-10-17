# Round 5 research: fast WebGL / GSAP / Lenis on mid-range phones and older laptops

Scope: how award-level scroll-film sites (GSAP ScrollTrigger + Lenis + three.js) stay fast on mid-range Android and 5-8 year old laptops, followed by an audit of this site's JS, CSS and build with the concrete risks ranked.

Read-only audit of `site/` and `dist/` (built 2026-10-17 22:51, in sync with `site/assets/js/film.js`). Live tracing was not possible because the shared DevTools browser profile was locked by another process. Every finding below comes from reading the code and measuring the built bundle sizes. Section 5 lists the trace checks that should confirm them.

Audience note: visitors aged 30 to 40 mostly browse on a 2-4 year old mid-range Android or iPhone, or on a work or home laptop with integrated graphics. "Fast" for them means the first screen is readable in under 2 s, scrolling never stutters, and taps respond instantly. They will not wait through an intro.

---

## 1. What the fast award sites do (research summary)

Sources and patterns: web.dev (LCP, INP, CLS, "Optimize long tasks", `content-visibility`), three.js manual ("Rendering on demand", "Responsive design", disposal), GSAP docs (ScrollTrigger `scrub`, `ticker.lagSmoothing`, `gsap.matchMedia`), Lenis README (touch: native scroll by default), Chrome rendering docs (compositor-only properties, layer explosion, `will-change` cost). Techniques shared by fast Awwwards / FWA sites such as Lusion, Active Theory, Locomotive and Studio Freight / darkroom.engineering, the authors of Lenis:

| # | Technique | What they do |
|---|-----------|--------------|
| 1 | Content first, WebGL second | HTML hero paints immediately. WebGL is decoration that fades in after LCP, through a dynamic `import()` on idle or on first interaction. No splash that blocks reading. |
| 2 | Adaptive DPR | Start at `min(devicePixelRatio, 1.5)` (1 on phones). Measure frame time over the first ~60 frames. Drop DPR in steps (1.5 to 1.25 to 1) when p75 frame time is above ~20 ms, and raise it again only when the device is clearly idle. Tools: drei `PerformanceMonitor`, `AdaptiveDpr`, detect-gpu tiers. |
| 3 | Frame budget | 16.7 ms total. Keep JS per frame under ~4 ms on desktop and ~6 ms on mid Android, and leave the rest to style, layout, paint and composite. One rAF owner (the GSAP ticker) drives Lenis, ScrollTrigger and WebGL together, so nothing runs twice per frame. |
| 4 | Render on demand | Render only when something changed: scroll, pose or pointer. Idle ambient motion runs at 20-30 fps or is baked into a shader `uTime`. If ambient motion has to stay, it runs in the vertex shader so the CPU only uploads one uniform. |
| 5 | Offscreen pause | Pause on `visibilitychange`, and use IntersectionObserver or the scene state to stop the loop when the canvas is hidden or has opacity 0. |
| 6 | Small engine | Use OGL (~25 KB gz) or raw WebGL for point clouds and lines. Keep three.js for real scenes with GLTF, lights and post-processing. three.js tree-shaking barely works because `WebGLRenderer` pulls in most of the library (~120 KB gz). |
| 7 | Geometry and textures | Use instanced or `Points` buffers, under ~5k vertices for decoration, KTX2/Basis textures for photos, and procedural point sprites in the fragment shader (`gl_PointCoord`) instead of a texture. |
| 8 | `will-change` hygiene | Set it just before an animation and remove it afterwards. Never put it permanently on hundreds of split words or characters (layer explosion: GPU memory, slower compositing, checkerboarding on Android). |
| 9 | No layout thrash | Batch reads, then writes. Cache rects on `pointerenter`, and refresh them on scroll or resize instead of on every move. Use `gsap.quickSetter` / `quickTo` for pointer-driven values. |
| 10 | Fonts | Self-hosted woff2, `unicode-range` subsets, preload 1-2 faces, metric-matched fallbacks (`size-adjust`, `ascent-override`) so the swap causes no CLS. |
| 11 | No CLS from intros | Preloaders are overlays (fixed, `inset:0`), so they cause no CLS. They still delay perceived LCP and hurt bounce rate. Best practice in 2025-26: show the intro only on the first visit per session, under 1 s, and dismiss it on any input. |
| 12 | INP with pointer effects | Pointer handlers only store coordinates (passive). All work happens in one rAF. Hover physics run only on `(hover:hover) and (pointer:fine)`. Click handlers never trigger synchronous rebuilds. |
| 13 | Blend modes and filters | Avoid `mix-blend-mode`, `backdrop-filter` and `filter: blur` on full-screen layers above WebGL. Grain is pre-rendered (a PNG tile) at low opacity, or added in the WebGL fragment shader. |
| 14 | Touch scrolling | Lenis on touch keeps native scroll (`syncTouch: false`, the 1.x default). Smooth wheel on desktop only. |
| 15 | Device tiers | Tier by `deviceMemory`, `hardwareConcurrency`, a GPU renderer string (WEBGL_debug_renderer_info) and measured FPS. The low tier keeps the motion design but drops particles, blur and DPR. |

---

## 2. What this site already does well (keep it)

- `perf.js`: `createLoop` parks every rAF loop when idle or hidden. `yieldToMain` uses MessageChannel, and `forEachSliced` keeps tasks under 6 ms. This is better than most award sites.
- `film.js` first build is sliced (one scene per task), uses `content-visibility: hidden` on unbuilt scenes, records and replays the timeline (`film-batch.js`) to avoid layout thrash, and has a single rAF owner (`gsap.ticker` drives Lenis, `lagSmoothing(0)`).
- `globe.js`: three.js loads after `film.ready` and on idle, staged across tasks. `compileAsync` (parallel shader compile), `powerPreference: 'low-power'`, DPR capped at 1.75 (1 on low-power devices), and a render-only-when-the-frame-key-changes loop. Save-Data and missing WebGL fall back to the SVG globe.
- `layers.js` stars: DPR capped, star count by area, a 16 fps idle twinkle, and parking when the field hides them.
- `interact.js`: pointermove only stores values, with one rAF per frame. Physics are limited to fine pointers.
- `build.mjs`: esbuild bundle and split, a shared vendor chunk, hashed immutable assets (`_headers`), self-hosted fonts with `unicode-range` and one preloaded face, a modulepreload list per page, and an entry that waits for first paint.
- The splash is a fixed overlay (no CLS), inline-CSS painted, has a CSS self-fallback at 2.6 s, and is dismissed by any input.

---

## 3. Ranked risks and fixes

Severity: **H** = visible jank or slow load on the target devices. **M** = measurable cost on older hardware. **L** = polish.

### 1. (H) The splash holds every visitor for 0.9 to 2.2 s
`splash.js` MIN_MS 900 / MAX_MS 2200 (plus `FILL_MS` 260 and `IRIS_MS` 760 before the hero is fully clear). The real hero is ready well before that on a desktop. A 35-year-old on a phone sees a logo for ~2-3 s on every page load, including page-to-page navigation, before any content. This is the biggest perceived-speed cost on the site.
**Fix:** show the splash only on the first page view per session (a `sessionStorage` flag set by the inline head script, which then adds `html.no-splash` before first paint). Cut MIN_MS to ~400 and the iris to ~500 ms. Other pages and repeat visits get a 200 ms fade. Keep dismiss-on-input.

### 2. (H) The full-screen grain layer uses `mix-blend-mode: overlay` and is animated forever on desktop
`base.css:385-404`: `.grain` is `inset: -50%` (a 2x by 2x viewport layer, 4x the pixels), `mix-blend-mode: overlay`, an SVG `feTurbulence` background, and `animation: grain 0.9s steps(6) infinite` above 759 px. A blend mode over the WebGL canvas and the star canvas forces the compositor to read back and blend every frame the layer below changes, and the infinite animation means the page never goes idle. On integrated GPUs (older Intel UHD, 1080p-4K screens) this is a constant GPU tax and a common source of scroll stutter. The feTurbulence SVG is also rasterised on the main thread at decode.
**Fix:** pre-render a 256 px greyscale noise PNG/WebP (~6 KB) and drop the blend mode (plain `opacity: .05`, or `mix-blend-mode` only on html.tier-high). Set `inset: -10%` at most. Animate by stepping `background-position` at 4-6 steps/s only while the film is moving (toggle a class from the film `progress` event and remove it after 400 ms), or simply keep it static. Off on lowPower.

### 3. (H) three.js costs 120 KB gz / 473 KB raw for a points-and-lines globe
`dist/assets/chunks/three-*.js` = 473,196 B (119,846 B gzip), the largest asset on the site, bigger than GSAP, ScrollTrigger and Lenis together (vendor 47.7 KB gz). Tree-shaking does not help (WebGLRenderer pulls in the library). On a mid Android, parsing and compiling ~470 KB of JS costs ~250-500 ms of main thread, which lands after `film.ready`, exactly when the visitor starts to scroll. `compileAsync` plus staged init helps, but the parse is one long task.
**Fix (best):** rewrite the globe in raw WebGL2 or OGL (~6-25 KB): one `gl.POINTS` draw with the Fibonacci sphere (round sprites from `gl_PointCoord`, no `CanvasTexture`), one `gl.LINES` draw for arcs and icosahedron edges, and uniforms for pose, colour mix and `uTime`. The idle sway moves into the vertex shader, so the CPU only uploads uniforms. Same visuals at ~5% of the bytes.
**Fix (cheap, interim):** keep three.js but load it on the first scroll or pointer intent (or `requestIdleCallback` with a 4 s timeout) rather than straight after `film.ready`. Skip it entirely on lowPower (use the SVG fallback).

### 4. (H) `lowPower()` misses most modern phones
`perf.js` SMALL_SCREEN_PX = 900 checks the longest `screen` side. Common Androids report 412x915 (Pixel 7/8, Galaxy S2x Ultra, A5x), and iPhone Pro Max reports 430x932. All of them are over 900, so they get DPR 1.75 WebGL with antialias, 1100 points, star DPR 2 and 280 stars. Also, `deviceMemory` is capped at 8 and absent on Safari, so it rarely catches mid-range devices.
**Fix:** treat any `(pointer: coarse)` device whose shortest side is ≤ 600 px as a phone and give it the light tier: WebGL DPR ≤ 1.25 (1 if `hardwareConcurrency` ≤ 6), no antialias, 520 points, star DPR 1, ≤ 110 stars. Add a measured tier: over the first 90 rendered frames of the film, if p75 frame time is above 22 ms, step the globe DPR down (1.5 to 1.25 to 1), halve the stars and stop the grain. Write the tier to `html.dataset.tier` so CSS can drop effects too.

### 5. (H) The globe loop renders at 30 fps forever while the globe is on screen
`globe.js` startGlobe: `return pose.s > 0.001 || changed;`. While the globe is visible (most scenes), the idle sway re-renders the whole full-viewport WebGL canvas 30 times a second even when nothing moves. That means continuous GPU work and battery drain, and the phone heats up and throttles. A visitor who stops to read a scene still pays for a 30 fps draw.
**Fix:** move the sway into the shader (see #3) or cut the idle rate to ~15 fps and stop it entirely after ~6 s without input (wake on scroll or pointer). With Round 4's one-scroll-per-section model, the globe only needs full-rate frames during the ~0.7-1 s section transition.

### 6. (M-H) Permanent `will-change: transform` on every split word, plus 3D character splits
`base.css:228`: `.rv-word { will-change: transform; }` is never removed. The home page splits ~59 line-reveal words. `textfx` splits every h1/h2 into characters (~380 `.tx-char` on index, ~270-320 on the other pages) that animate with `rotationX` and `transformPerspective` on fine pointers, with `backface-visibility: hidden`. Hundreds of promoted layers cost GPU memory (each layer is a texture) and compositing time. On Android this can cause checkerboarding or a dropped tab, and on desktop it slows every frame of the scrub.
**Fix:** remove the static `will-change`. Let GSAP promote only during the tween (`force3D: 'auto'`, which is the default), or set `will-change` from the timeline at `inStart` and clear it at `end`, as `addField` already does for layers. Animate per-line or per-word, not per-character, on coarse pointers and lowPower. Keep the per-character reveal for the one hero heading per scene only, and use words for h2.

### 7. (M) Synchronous full rebuild on ResizeObserver / resize
`film.js` `watchContentSize` → `scheduleRebuild` (200 ms) → `rebuild()`, which reverts and re-records the whole timeline in one task (the code comment says "synchronous"). This fires for late font swaps, images that size in, accordion content and any pan height change. On a mid phone a full rebuild of 8-12 scenes can be a 100-300 ms long task. If it lands while the visitor taps, INP is above 200 ms and there is a visible frame hitch.
**Fix:** ignore ResizeObserver changes under ~4 px and during active scrolling (Lenis `isScrolling`). Make rebuilds after the first one use `buildSliced` too, keeping the playhead anchor. Wait for `document.fonts.ready` before the first measure (this already happens) and set `size-adjust` fallbacks so the swap does not change heights.

### 8. (M) Star canvas cost per active frame
`layers.js drawStars`: up to 280 `arc` + `fill` calls per frame, a new `rgba()` string per star per frame (GC churn), and `pushStar` math per star at full rate on every pointer move (`ACTIVE_FOR_MS`). Full-viewport 2D canvas clears at DPR 2 on a 4K laptop = 8.3 MP of clear and fill per frame.
**Fix:** pre-render two sprite bitmaps (ivory and gold dot, a few radii) and `drawImage` them with `globalAlpha` set per star. Bucket alpha into ~8 levels to avoid string building. Cap star DPR at 1.5. Better still, draw the stars as a second `gl.POINTS` buffer in the globe's WebGL context (one canvas, one composite layer). Skip the cursor push on lowPower.

### 9. (M) The scene iris and splash animate `clip-path` on full-screen layers
`film.js addField` animates `clip-path: circle()` scrubbed. `splash.js` animates a 40-point evenodd polygon with WAAPI. Chrome now composites some clip-path animations, but scrubbed GSAP inline styles are always main thread, and every frame repaints the clip mask over the full viewport. On older laptops the iris transitions are where jank appears first.
**Fix:** keep the iris (it is the signature), but make the layer it reveals cheap: a flat colour field, with no blend layer above it. Or swap to a `transform: scale()` of a circular mask element (a compositor-only path). For the splash, use a radial-gradient `mask-image` on a pre-promoted layer, or a plain opacity and scale exit.

### 10. (M) Several independent pointermove consumers on desktop
`cursor.js`, `interact.js`, `film-alive.js`, `layers.js` (stars) and `textfx` / `sfx` / `cursor` `pointerover` delegates each attach their own listener. Several of them wake their own rAF loop, so one mouse move can schedule 4 rAF callbacks and 4 style writes. `interact.js` calls `getBoundingClientRect()` on the magnet and the card every frame after GSAP and the alive loop have written styles, which forces a synchronous style and layout recalc (layout thrash). `prepareTilts` interleaves `getComputedStyle` reads with class and perspective writes for every card, so it recalculates style once per card.
**Fix:** one pointer module stores `{x, y, target}`, and its one rAF fans out to the cursor, alive, interact and stars. Cache card and magnet rects on `pointerenter` and refresh them on film `progress` or resize. In `prepareTilts`, do all reads first, then all writes. Use `gsap.quickSetter` for the cursor transform. Round 4 removes the HUD drift, so drop that branch.

### 11. (M) Fonts in dev and in prod
Dev `site/*.html` loads three Google families with 8 weights through an async stylesheet. Fine for development. Prod self-hosts 16 woff2 files and preloads Manrope 400 only. Android has no Times New Roman, so Tinos 400 and 700 download for every display heading and swap late (Tinos is metric-compatible, so the swap causes no CLS, but the headings flash).
**Fix:** check whether Poppins 600 and Manrope 600 are both needed (one UI weight family, ideally variable Manrope only, saves 3-5 requests). Preload Tinos 400 only on Android/Linux UA hints, or just preload it (~20 KB) since headings are the LCP element on most scenes. Confirm the fallbacks have `size-adjust` / `ascent-override` set for Manrope and Poppins (base.css says metric-matched fallbacks exist; keep them).

### 12. (M) Main-thread work right after load, as visitors start scrolling
After `film.ready`, `onIdle` runs `prepareTilts` (DOM writes plus sheen spans for every card), `initRoll` (splits every button and nav label into letters), three.js import and compile, and SFX listeners. Each is idle-gated, but they all queue in the first ~2 s. On a 4x-throttled CPU they overlap the visitor's first swipe.
**Fix:** run roll and tilt prep lazily per scene (on `scene` enter for `is-active` and `is-near`) instead of for the whole document. Load three.js last, on first-scroll intent. Split SFX synthesis (noise buffer creation) to first unlock only (it already waits for a gesture; keep it that way).

### 13. (L-M) GPU memory and compositing from `perspective` on many parents
`interact.js setupTilt` sets `perspective: 1000px` on the parent of every tilt card, and `scene__inner` has `perspective: 1400px`. Each `perspective` plus 3D-transformed children forms a 3D rendering context. Combined with #6, layer counts climb.
**Fix:** use `transform: perspective(…) rotate…` on the card itself (no parent perspective), or set perspective only on the active scene.

### 14. (L) Globe hygiene
- Use `frameKey` (string concatenation every frame) only for change detection. Compare numbers with an epsilon instead, to avoid the per-frame string allocation.
- `alpha: true` plus a transparent clear over the star canvas. When stars move into the same WebGL context (#8), use `alpha: false` with the field colour as the clear colour, which is cheaper to composite. The field colour changes are then a uniform.
- On mobile `#gl` sits at `opacity: 0.55`. A full-screen layer with fractional opacity costs an extra composite. Bake the opacity into material colours instead.
- On narrow screens, size the canvas to the globe's box (not the whole viewport) when it sits in a corner. That means fewer pixels shaded.
- Handle `webglcontextlost`: today a lost context (common on Android when the tab is backgrounded) leaves a blank canvas. Listen, call `preventDefault`, and rebuild on `webglcontextrestored` or fall back to SVG.

### 15. (L) Lenis and ScrollTrigger settings
- `LENIS.touchMultiplier: 1.4` has no effect while `syncTouch` is off (Lenis 1.1 keeps native touch scrolling), which is correct. Keep `syncTouch` off on Android; synced touch smoothing is the most common cause of "laggy" mobile award sites.
- With Round 4 (one scroll = one section), stop scrubbing at 1:1 and play each transition as a time-based tween (~0.8-1.0 s) triggered by one wheel, key or swipe gesture (Observer plugin or Lenis `virtual-scroll` events). Between transitions nothing animates, so every loop parks (stars, globe, grain). This is the single biggest structural perf win the Round 4 design gives for free, and it is easier on older visitors (no half-states).
- Keep `ScrollTrigger.config({ ignoreMobileResize: true })` style protection. The stage already uses `100svh`, so URL-bar moves do not rebuild. Keep it that way, and do not switch to `dvh`.

### 16. (L) SFX
Synthesized Web Audio is cheap. Round 4 removes the sound toggle, so decide on the default. If sound stays on by default with no toggle, creating an `AudioContext` on first click costs ~5-20 ms on Android at that click (an INP hit) and surprises visitors. Recommendation: default off and no context at all (remove the module from the bundle), or create the context on idle after the first gesture rather than inside the click handler.

---

## 4. Recommended order for Round 5 build

1. Session-gated, shorter splash (#1). Grain without blend mode, static by default (#2). Phone tier fix plus measured adaptive DPR (#4).
2. Globe render-on-demand with shader sway, and the idle stop (#5). Then the OGL / raw-WebGL rewrite, which also hosts the stars (#3, #8, #14).
3. `will-change` cleanup and per-word splits on coarse pointers (#6). Sliced or filtered rebuilds (#7).
4. Single pointer hub, cached rects, batched tilt prep (#10, #12, #13).
5. Round 4 snap model as time-based transitions (#15), so everything parks between sections.

Expected outcome on a Moto G Power / Galaxy A54 class phone: LCP from ~3 s (splash-gated) to ~1.2-1.6 s, JS transfer from ~200 KB gz to ~90 KB gz without three.js, steady 60 fps between sections, and zero GPU work while reading.

## 5. Verification checklist (run once the browser is free)

- Lighthouse mobile (Moto G Power emulation, 4x CPU, Slow 4G) on `dist/` index and services: LCP < 2.5 s, TBT < 200 ms, CLS < 0.05.
- DevTools Performance trace: scroll through 3 scenes at 4x CPU. Look for long tasks after `film.ready` (three.js parse), "Recalculate Style" spikes on pointermove, and GPU raster time with and without `.grain`.
- Layers panel: count composited layers on the home hero (target < 30). Console: `document.querySelectorAll('.rv-word,.tx-char').length`.
- `chrome://gpu` on an Intel UHD laptop: frame rate with the grain on and off.
- INP: tap chips and nav while a rebuild is pending (resize the window, then tap within 200 ms).
- Real-device check: a 412x915 Android confirms `lowPower()` is true after fix #4 (`html[data-tier]`).
