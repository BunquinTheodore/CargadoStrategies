# Round 5 judge: Performance as a user feels it

Judge lens: how fast the site *feels* to a 30-45 year old visitor on a mid-range phone or an office laptop. That covers time until they can read and act, smoothness while scrolling, and what each page asks the device to download and run. Brand, copy and layout belong to the other judges. I only cover them where they cost speed.

## How this was measured

All runs used my own headless Chrome (an isolated profile per run, puppeteer-core and lighthouse@12.2.1 via npx). Raw files are in `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\lh\` (8000-*.json and 8412-*.json are Lighthouse, r5*.json are the probes; scripts r5perf.mjs, r5prof.mjs, r5strip.mjs).

- **Lighthouse**: index.html and services.html, mobile and desktop presets, against both the source (`site/` on :8000) and the production build (`dist/`, served with `python -m http.server 8412`).
- **Feel probe** (`r5perf.mjs`): 1440x900 desktop, and 390x844 @3x with 4x CPU throttle for mobile. It records:
  - when the splash element is gone;
  - FCP and LCP;
  - long tasks;
  - requests and bytes by host and type;
  - rAF frame times for 3 s idle;
  - rAF frame times while wheel-scrolling through the whole film.
- **CPU profile of mobile scroll** (`r5prof.mjs`): 30 scroll steps, 4x throttle, sampling profiler.
- **Load filmstrip** (`r5strip.mjs`): dist index, 390x844, 4x CPU, about 1.6 Mbps and 150 ms RTT. Files are `...\scratchpad\lh\strip\dist-index-{800,1600,2400,3200,4500,6000}.png`.
- **Caveat**: the machine was shared with other agents' Chrome instances (about 60 processes), so absolute numbers are noisy. Lighthouse flagged "slower CPU than expected" on 3 mobile runs, and TTFB on localhost came out at 5-7 s in 2 runs, which is contention. I re-ran the noisiest configurations. The patterns below held across reruns; single values did not.
- **Screenshots**: the shared shots run had only produced splash, index (1440x900, scenes 1-6) and story (1440x900) when I judged. I looked at all of them. No 390x844 shots existed yet, so mobile visuals come from my own filmstrip.

### Headline numbers

| | index src | index dist | services src | services dist |
|---|---|---|---|---|
| LH Performance, mobile | 54 | **41** | **41** | 57 |
| LH Performance, desktop | 68 | 93 | 94 | 89 |
| LH mobile FCP / LCP | 2.4 / 3.2 s | 3.6 / 4.0 s | 5.1 / 5.1 s | 3.4 / 3.5 s |
| LH mobile TBT | **2,590 ms** | **2,720 ms** | 950 ms | 1,110 ms |
| LH mobile Speed Index | 6.8 s | **16.3 s** | **19.3 s** | 5.4 s |
| LH mobile main-thread work | 10.9 s | 15.6 s | 6.8 s | 10.8 s |
| LH Accessibility / Best Practices | 100 / 100 | 100 / 100 | 100 / 96 | 100 / 100 |
| Transfer (uncompressed test servers) | 559 KB | 818 KB | 633 KB | 860 KB |

Feel probe on dist (warm second run where noisy):

| page | FCP desk / mob | splash gone desk / mob | scroll fps desk | scroll fps mob (4x CPU) | janky frames mob (>25 ms) | long tasks in first 7 s, mob (max) |
|---|---|---|---|---|---|---|
| index | 0.3 / 0.6-0.8 s | **2.0 / 3.5-3.9 s** | 56-60 | **34** | **47 %** | 25-37 (465 ms) |
| services | 0.45 / 0.8 s | 2.0 / 3.6 s | 56 | **31** | **39 %** | 22 (500 ms) |
| story | 0.4 / 0.35 s | 1.9 / 3.3 s | 60 | 50 | 17 % | 10 (151 ms) |
| partners | 0.3 / 0.56 s | 2.0 / 3.4 s | 59 | 46 | 21 % | 14 (335 ms) |
| legal | 0.6 / 0.58 s | 2.0 / 3.4 s | 57 | 51 | 13 % | 6 (316 ms) |

The idle frame rate is 60 fps everywhere: the loops sleep correctly when nothing moves. Jank only appears while the visitor scrolls, which is exactly when they notice it.

CPU profile of 30 mobile scroll steps (index; services is nearly identical), out of 7.4 s sampled:

| where the time went | ms |
|---|---|
| Native rendering, paint and composite ("(program)") | 4,576 |
| `sfx.js:241`, the `film.on('progress')` handler, which reads `window.scrollY` right after GSAP writes styles (forced synchronous layout) | 762 |
| `layers.js:93`, the star loop (`drawStars` forEach) | 267 |
| GSAP render | about 480 |
| ScrollTrigger | about 150 |
| Lenis | about 125 |
| three.js | about 140 |

---

## 1. Scores (performance lens)

| page | score | one-line justification |
|---|---|---|
| index.html | **4/10** | Desktop is smooth (60 fps scroll, FCP 0.3 s), but phones wait 3.5-3.9 s behind the splash, run 2.7 s of blocking JS (LH mobile 41-54) and scroll at 34 fps with half the frames janky. |
| services.html | **4/10** | Same pattern: LH mobile 41-57, 31 fps mobile scroll, long tasks up to 500-600 ms, plus a 37 KB Canada map and three.js for a page whose job is "pick a service". |
| story.html | **6/10** | The lightest film page (7 scenes, about 900 DOM nodes): 50 fps on mobile, 60 on desktop. It still pays the 2-3.3 s splash and 777 KB, three.js included, for a page of text. |
| partners.html | **5/10** | 46 fps mobile scroll with 21 % jank and a 335 ms long task. That is felt right where the application form needs to feel calm and reliable. |
| legal.html | **3/10** | A legal text page should open instantly. Instead it shows a 2-3.4 s splash, downloads 785 KB with 462 KB of three.js, and runs a starfield, a grain overlay and a WebGL globe. |
| **Overall** | **4/10** | The engineering is careful: build pipeline, idle loading, sliced work, sleeping loops, CLS near 0, a11y 100. But the felt experience on the audience's real device, a mid-range phone, is a splash wall, then a busy main thread, then stutter. The wow currently costs more than it pays back. |

---

## 2. What is good (keep)

1. **The production build is right in shape.** `dist/` is esbuild-bundled. Fonts are self-hosted, preloaded woff2 (Manrope, Tinos). Asset names are hashed. `_headers` sets `max-age=31536000, immutable` on `/assets/*` and `no-cache` on HTML. The dist pages make zero third-party requests: 16 requests in total versus 46-55 for the source pages. On desktop this is where the 89-93 LH scores come from.
2. **Real content paints almost immediately under the splash.** The hero H1 (`H1.t-hero hero__title`) is the LCP element. It is in the HTML and paints at 0.3-0.6 s on desktop and 0.35-0.8 s on mobile, so the HTML-first approach works (see `shots/index/1440x900/01-hero.png`, and `strip/dist-index-3200.png` for mobile).
3. **Layout stability.** CLS is 0-0.06 everywhere (fallback fonts are size-adjusted, and the splash is sized). Nothing jumps under the visitor's thumb.
4. **Idle discipline.** Every decorative loop (stars, globe, cursor, film-alive) goes through `perf.js createLoop` and sleeps when nothing changes. The idle frame rate measured 60 fps with 0 % jank on every page and device. `forEachSliced`/`yieldToMain` and `renderer.compileAsync` keep start-up work in slices. The globe loads on idle.
5. **Desktop scroll is genuinely smooth on the built site**: 56-60 fps through all 12 home scenes and all 8 services scenes, at most 1-3 long tasks. On a laptop the "film" feels like the premium thing it is meant to be (shots `index/1440x900/03-situations.png`, `05-how-it-works.png`, `story/1440x900/06-network.png`).
6. **Accessibility 100 / Best Practices 96-100** on every Lighthouse run. Reduced motion has a real flow mode, the splash never traps focus, and the first key, wheel or tap dismisses the splash early.
7. **No images on the critical path.** Every visual is CSS, SVG, canvas or WebGL. Bytes are almost all JS, which makes this easy to fix: cut the JS and the site becomes very light.

---

## 3. What is bad

| # | defect | where / evidence | why it hurts this audience or the wow | severity |
|---|---|---|---|---|
| B1 | **Splash wall on every page load and every navigation.** The splash waits for `fontsReady()` and `film.ready`, with MIN 900 ms and MAX 2,200 ms, plus a 760 ms iris. No sessionStorage "seen" flag. | Splash gone at 1.9-2.0 s on desktop and **3.3-3.9 s on mobile** on all 5 pages, while FCP is 0.3-0.8 s. So the content is painted and then hidden. `shots/splash/1440x900/splash.png`; mobile `strip/dist-index-2400.png` (still splash) vs `-3200.png` (content). In one cold source run the splash lasted 7.5 s, while CDN scripts loaded. | A 35-45 year old who taps Home, then Services, then Our Story sees the same logo three times and loses about 6-10 s. Past 3 s on mobile, a large share of visitors leave. The first impression is "loading" rather than "wow". | **critical** |
| B2 | **Mobile main thread is saturated during start-up.** | LH mobile TBT 2.6-2.7 s on index (41-54), 0.95-1.1 s on services. In the first 7 s on a 4x phone: 25-37 long tasks on dist index, up to 465 ms; 22 on services, up to 500 ms; one 2.5 s task on the source index. LH "main-thread work" 10.8-15.6 s on dist. | Taps on the hero chips ("Mortgage", "Insurance") or the city field during the first seconds feel ignored. Older visitors read lag as "broken" and tap again. | **critical** |
| B3 | **Scroll stutter on phones on the two money pages.** | 4x CPU, 390x844: index 34 fps with 47 % of frames over 25 ms; services 31 fps with 39 %; partners 46 fps / 21 %; story 50 / 17 %; legal 51 / 13 %. The profile shows 4.6 of 7.4 s in native paint/composite, from: full-screen `clip-path: circle()` iris layers; a `.grain` layer at `inset:-50%` (4x the viewport area) with `mix-blend-mode: overlay` and an infinite `steps()` animation, which forces the whole stage into blended compositing; a 3x-DPR-capped star canvas cleared and redrawn every frame; and the WebGL globe. | The film concept lives or dies on smoothness. On the audience's main device it stutters in exactly the moment that should be the wow (the iris between scenes). Stutter reads as cheap, which is the opposite of the black-and-gold premium promise. | **high** |
| B4 | **Forced synchronous layout in the SFX scroll hook.** `hookFilm` in `sfx.js` (line ~241) reads `window.scrollY` inside `film.on('progress')`, right after GSAP writes transforms, on every progress event, even when audio is locked or muted. The mute check is inside `play()`, after the read. | 762 ms of 7.4 s of mobile scroll CPU, the largest single JS cost. | Pure waste. The visitor hears nothing until audio unlocks, but pays the layout cost on every frame. | **high** |
| B5 | **three.js on every page, for one decorative wireframe globe.** | dist chunk `three-5PWQFWD2.js` is **462 KB raw** (about 120 KB gzip) and 57 % of every page's bytes. The source loads 163 KB gzip from jsDelivr. It loads on legal.html too, and on phones, where `lowPower()` only lowers DPR or antialiasing. Only Save-Data gets the SVG fallback. On mobile the globe is drawn at `opacity:.55` and is mostly off-canvas (`shots/index/1440x900/03-situations.png` shows half a globe at the left edge). | Bytes and GPU time for a background ornament that this audience barely registers. It also competes with the iris and stars for the same frame budget (B3). | **high** |
| B6 | **Start-up layout cost from per-character text splitting.** | LH mobile "Style & Layout" is 3.2 s (src) to 5.1 s (dist) on index. `kerning.js` alone costs 965 ms of bootup: it calls `getComputedStyle` per split element and measures on canvas. DOM is 1,536-1,985 elements on index and 1,818 on services; LH flags `dom-size`. | It feeds B2 directly. Character-split headings add some flourish but cost about 1 s of phone CPU on every page view. | **high** |
| B7 | **Too much scrolling to get anywhere** (today's build). | Home has 12 scenes and about 9,500 px of scroll. `film-map.js` uses `MOTION_PX = 640` (about 6 wheel notches per transition), plus holds. My probe needed about 95 wheel notches and 14-22 s of pure scrolling to reach the footer, and 7.6k px on services. Round 4's snap (one gesture = one scene) is decided but **not built**. | A 40-year-old with an office mouse who wants "contact" spins the wheel 90 times, which feels slow regardless of fps. Round 4 must land, and land smoothly. | **high** (until Round 4 ships) |
| B8 | **The page never "settles".** | LH mobile Speed Index is 16.3 s (dist index) and 19.3 s (src services) against FCP of 3-5 s. The splash iris, character reveals, twinkling stars, the grain `steps()` animation and the globe drift keep pixels changing for many seconds. | Speed Index is how "done" a page looks. Constant motion also pushes slower readers to wait before reading. The calm, confident feeling that suits a 30-45 professional audience never arrives. | **medium** |
| B9 | **The source pages depend on 3 third-party origins.** | `site/*.html` loads gsap, ScrollTrigger, lenis and three from cdn.jsdelivr.net (215 KB), and fonts from fonts.googleapis.com and fonts.gstatic.com (47 KB). The cold run showed a 7.5 s splash and a 2.8 s long task at 550 ms. dist fixes this. | Fine if only `dist/` is ever deployed. Dangerous if anyone uploads `site/`. The README and build-order should state it. | **medium** |
| B10 | **Every page, including legal, carries the whole film runtime.** | legal.html: 785 KB, splash 2.0/3.4 s, 7 scenes, a WebGL globe, stars, grain and SFX. | Visitors read legal, privacy and disclosure text to check trust. Making them sit through a show first erodes that trust. | **medium** |
| B11 | **No compression on the test servers, and nothing in `_headers` guarantees it.** | LH: "text compression, potential savings 535 KB" (dist index), 182 KB (src). | Netlify and Cloudflare compress automatically, but a plain host would not. With Brotli the dist pages drop to roughly 250 KB. | **low** (verify at deploy) |
| B12 | **Back/forward cache blocked on services (dist).** | LH `bf-cache`: 1 failure reason. | Older users press Back a lot. Without bfcache, Back re-runs the splash and the film build (B1 again). | **low-medium** |

---

## 4. What needs improvement, ranked by impact

The user wants a wow factor and says the site looks basic and clogged. From a performance seat, the boldest move is to **put the wow into fewer, GPU-cheap, unforgettable moments, and make everything else instant.** Award-level fast sites (Apple product pages, Stripe, Linear-style marketing pages) feel premium because the first frame is already the design and the motion is buttery. That comes from pre-rendered media, transform/opacity-only motion and one signature effect, not from many live layers at once.

1. **Replace the per-load splash with an "instant hero reveal" (fixes B1, B8, B12).**
   - Show the branded splash **once per session** (sessionStorage flag), and cap it at 900-1,000 ms total including the iris. Never wait on `film.ready`: the film can finish building behind the hero.
   - Turn the splash moment into the hero itself. The H1 is already painted at 0.3-0.8 s. Animate *that* (a gold light sweep across "The Right Professional Near You" using `background-clip:text` and a translated gradient, transform only, about 1.2 s, once). The visitor's first frame is then the message, and the wow is on the content.
   - Use the cross-document **View Transitions API** (`@view-transition { navigation: auto; }` plus `view-transition-name` on the header, logo and H1) for page-to-page navigation. It gives the "film cut" feel between pages with no JS, no splash and graceful fallback.
   - Target: content readable and tappable at ≤ 1.0 s on mobile and ≤ 0.5 s on desktop, on every page after the first.

2. **Cut mobile render cost to a strict budget (fixes B3, B8).** On `(pointer: coarse)` or `lowPower()`:
   - **Grain**: no animated `.grain`. Use a static noise PNG/AVIF tile at `inset:0` with plain `opacity`, no `mix-blend-mode`. Or drop it on phones.
   - **Stars**: canvas DPR 1, at most 60 stars, redraw at most every other frame while scrolling, and freeze when the field is bone or gold, where they are invisible anyway.
   - **Iris**: do not animate `clip-path` on a full-screen layer. Scale a gold or black circle element with `transform: scale()` (compositor only) and swap the field underneath, or crossfade with opacity on phones.
   - **Globe**: see item 3.
   - Target: at least 55 fps and under 5 % frames over 25 ms during mobile scroll at 4x CPU, on every page. Keep the full treatment for desktop, where it already holds 60 fps.

3. **Retire three.js as a dependency (fixes B5, about 57 % of bytes).** Pick one:
   - (a) Pre-render the gold wireframe globe as a short looping, transparent **video or AVIF image sequence** (about 150-300 KB, lazy, `preload="none"`), scrubbed by the film's progress. This is how Apple does "3D" on product pages.
   - (b) Redraw it in **2D canvas or SVG**: about 90 vertices, roughly 4-6 KB of JS, gold strokes, the same poses.
   - (c) If live 3D must stay, load it **only on desktop with a fine pointer, only after first input or when the network scene is active**, and never on legal or partners.
   - Target: initial JS at most 150 KB gzip per page (today about 200+ KB gzip on dist).

4. **Make text effects build-time, not run-time (fixes B6, part of B2).**
   - Split only the one display heading per scene, not eyebrows and body. Let eyebrows "decode" with a CSS mask instead.
   - Precompute the kerning table for Times New Roman and Tinos at build time (`build.mjs` can emit a JSON of pair kerns in em). Remove the run-time `getComputedStyle` and canvas measuring (about 1 s of phone CPU).
   - Run splitting in `forEachSliced` *after* the hero is interactive, scene by scene as each one approaches.
   - Target: DOM ≤ 1,000 nodes on index, Style & Layout ≤ 1 s on LH mobile, TBT ≤ 300 ms (from 2,700).

5. **Remove the scroll-path waste (fixes B4).**
   - In `sfx.js hookFilm`, return early when `state.muted || !state.ctx || state.ctx.state !== 'running'`.
   - Take the scroll position from the film's progress payload or Lenis (`lenis.scroll`) instead of reading `window.scrollY`.
   - Audit every `film.on('progress')` listener for DOM reads; reads belong before GSAP's writes, in one batched read phase.

6. **Ship Round 4's snap so that one scroll equals one scene, and make the snap itself the wow (fixes B7).**
   - Use a confident 650-750 ms transition per gesture, with transform/opacity-only motion and the cheap iris from item 2.
   - Home: 12 scenes at one gesture each is about 12 notches, against about 95 today.
   - Hold the line on scene count. If home still has 12 scenes after Round 4, merge to 7-8. Fewer, stronger scenes are both faster and less "clogged" (the user's own word).

7. **Give each page the runtime it needs (fixes B10).**
   - legal.html becomes a plain, beautifully typeset static document: header, a sticky table of contents, Times New Roman headings, Manrope body. No film, splash, globe, stars or SFX. Target under 60 KB and LCP under 0.5 s on mobile.
   - Partners: keep the film for the pitch scenes, but the application stepper must run with the stage frozen: pause stars, globe and grain while focus is in a form.

8. **Lock the gains with a budget gate in the build.** Add `tools/perf-gate.mjs`, run after `npm run build`:
   - Lighthouse mobile on dist index and services: Performance ≥ 85, TBT ≤ 300 ms, CLS ≤ 0.05;
   - feel probe: splash ≤ 1.0 s, mobile scroll ≥ 55 fps;
   - JS ≤ 150 KB gzip initial per page;
   - fail the build otherwise.

   State in `site/README.md` that **only `dist/` is deployed** (B9). Confirm Brotli/gzip at the host (B11).

9. **Spend the saved budget on a few signature, cheap wow moments** (coordinate with the design judges):
   - the hero gold sweep (item 1);
   - a scroll-scrubbed pre-rendered "CW monogram forged in gold" video on the story/logo scene (`story/1440x900/04-logo.png`), at about 300 KB, lazy;
   - View Transitions between pages;
   - a magnetic, softly glowing primary CTA (transform only).

   Four moments done at 60 fps on a phone will be remembered. Twelve layers at 34 fps will not.

---

## Top 8 issues (for the synthesis)

1. **B1, critical**: splash on every page and navigation hides already-painted content for 2.0 s on desktop and 3.3-3.9 s on mobile (FCP 0.3-0.8 s). Show it once per session, cap it at 1 s, and put the wow on the hero itself, with View Transitions between pages.
2. **B2, critical**: mobile main thread saturated at start-up. LH mobile 41-57, TBT 2.6-2.7 s on index, 25-37 long tasks up to 465-600 ms. Early taps feel dead.
3. **B3, high**: mobile scroll stutter, at 31-34 fps with 39-47 % janky frames on index and services. Causes: full-screen clip-path iris, `mix-blend-mode` grain at 4x the viewport area with an infinite animation, per-frame star canvas, and WebGL.
4. **B5, high**: three.js (462 KB raw, about 120 KB gzip, 57 % of page bytes) loads on every page, phones and legal included, for a decorative globe. Replace it with a pre-rendered video/AVIF or a 2D canvas or SVG version, or load it on desktop only after first input.
5. **B6, high**: run-time per-character splitting and kerning (`kerning.js` about 965 ms; Style & Layout 3-5 s on LH mobile; DOM 1.5-2k nodes). Move kerning to build time and split only display headings, lazily.
6. **B7, high**: about 95 wheel notches and 14-22 s of scrolling to cross the 12-scene home. Ship Round 4's one-gesture-one-scene snap, and consider merging home to 7-8 scenes.
7. **B4, high (cheap fix)**: the `sfx.js` progress hook forces a synchronous layout (`window.scrollY` after GSAP writes) on every scroll frame, even when muted or locked. That is 762 ms of 7.4 s of mobile scroll CPU, the top JS cost.
8. **B10/B8, medium**: legal.html runs the whole film (785 KB, splash, WebGL), and no page ever settles (mobile Speed Index 16-19 s). Make legal a static document, and keep motion to a few signature moments that end.
