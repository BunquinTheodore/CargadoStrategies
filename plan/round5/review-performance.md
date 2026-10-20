# Review · Performance, round 1

Scope: T2 (`tools/perf-gate.mjs` on `dist`), all 5 pages, mobile and desktop; idle rAF; layers; JS budgets (DIRECTION §12).
Evidence: `plan/round5/shots-r5/review-1/perf-gate.txt` / `.json` (gate run 14:10, 18 budgets missed), plus my own live probes on `dist`
(own server on port 8454, stopped afterwards; isolated headless Chrome profiles; runs on both SwiftShader, which is what the gate uses, and the real GPU).

## What passes (verified)

| budget | result |
|---|---|
| Lighthouse Performance | mobile 93-100, desktop 100 on every page |
| A11y / BP / SEO | 100 / 100 / 100 everywhere |
| TBT, CLS | max 42 ms mobile; CLS ≤ 0.018 |
| INP (sheet chip) | mobile ≤ 112 ms, desktop ≤ 40 ms |
| DOM nodes | 513-876 (services is close to the limit at 875/876 of 900) |
| Composited layers | 7-25 (max: partners desktop 25 of < 30) |
| Idle rAF 6-8 s | 0 on all 10 page × profile runs. My own probe also found 0 running WAAPI/CSS animations at 8 s. Every loop goes to sleep. |
| CSS gzip | 15.5-17.5 KB of 28 |
| Fonts | 5 (legal 4) |
| Brushed tile | 5.5 KB of 6 |
| Home transfer | 165 / 169 KB of 300 / 380 |

## The gate's 18 misses, sorted into real defects and measurement artifacts

### Real defects

1. **Legal JS is 51.0 KB gzip; the budget is ≤ 40 KB.** Over the wire it is 67.6 KB (mobile) and 71.2 KB (desktop).
   The page loads vendor GSAP (27.1 KB) and the whole engine (chunk-WJUUZAAN 14.8 KB + CZ5 4.4 KB + small chunks). The §12 breakdown alone (GSAP ≈ 27 + engine ≈ 14) is already over 40.
   On top of that, `main.js` lazy-loads `sfx.js` (1.9 KB) on legal, although §7.5 says there is **no SFX** on legal. Lenis (3.5 KB) also loads on legal desktop.
   Files: `site/assets/js/main.js` (skip the `loadSfx` start on legal) and `build.mjs`/engine (legal needs either a GSAP-free swap path, since legal is tier C and uses swaps only, or an amended budget from the orchestrator).
2. **Mobile script transfer is over 70 KB on 4 pages:** home 78.7, services 87.4, story 77.6 and partners 83.4 KB.
   The gate's static "JS initial" check (55-65 KB) misses this because it counts only the entry and its preloads. It leaves out the idle-loaded `dotglobe` chunk, which §12 counts inside the 70 KB.
   The live per-request list for each mobile page: vendor 24.4, engine 13.4 + 4.0 + ~6 small, dotglobe **14.0** (§12 allots ≈ 10), wa-sheet 3.1, EL7 2.3, sfx 1.9, interact 1.6, layers 1.4, and the page chunk 2.4-4.7.
   The biggest single overrun is dotglobe plus its points data, at 4 KB over its allotment. Services also preloads `ui-pager`/`ui-stepper` chunks (3.8 + 1.5 KB) up front.
3. **Long tasks during cuts at 4× CPU** (gate: home 307 ms, partners 100, services 87). I reproduced this on the real GPU as well: home 91/60/61 ms and partners 103 ms. So this is main-thread work, not a renderer artifact.
   The CPU profile of 3 cuts on home mobile shows about 230 ms of self time in GSAP CSSPlugin `_parseTransform` / `init` (`getComputedStyle` → forced style recalc).
   That recalc is forced because `film.js setCurrent()` first toggles `is-active` / `is-near` on **every** scene. Then `film-reach.js hasFocusable()` calls `getClientRects()` on every focusable element in up to 5 scenes (≈ 17-26 ms of the profile). Then `cut.js buildCut()` calls `gsap.getProperty(from.pan, 'y' / 'opacity')` and builds `fromTo` tweens on pans that have never been parsed.
   This breaks the §12 rule "No DOM reads happen in cut or progress handlers".
   Files: `site/assets/js/film-reach.js`, `site/assets/js/film.js`, `site/assets/js/cut.js`. Fixes:
   - cache each scene's "has focusable" flag at build and on resize, or defer `reach.update` to `landed` and idle;
   - `gsap.set(part.pan, { y: 0, opacity: … })` once at init, so the CSSPlugin cache exists;
   - track the pan's y and opacity in engine state instead of calling `getProperty` at cut time.
4. **Partners mobile LCP is 2534 ms** (budget ≤ 2000). My Lighthouse reruns gave 2133 ms and 1508 ms, so it fails 2 of 3 runs.
   The LCP element is `p.hero__lead` (`data-reveal="fade" data-delay="0.12"`), with an "element render delay" of 330-1443 ms. The hero lead is not visible at first paint: it waits for the engine's first-landing in-group.
   §6.1 and §12 "HTML-first" want the hero text painted with the HTML. Story mobile is also near the limit (1961 ms).
   Files: `site/assets/js/film-reveals.js` (the first landing should not hide the LCP candidate, or the hero lead should not be hidden before paint) and `site/partners.html`.

### Measurement artifacts in the gate (the gate must change, not the site)

5. **Cut frame rate** (gate: desktop 33.6-56.9 fps, mobile 29-53 fps) and **splash** (gate: 2153 / 1636 ms).
   `tools/lib/perf-lab.mjs` launches Chrome with `--use-angle=swiftshader`, so canvas, clip and raster cost run on the CPU. On the real GPU (AMD Radeon via D3D11) with the same pages and inputs:
   - desktop cuts run at **58-60 fps** (home 60/60/58, partners 60/60/57);
   - the Home splash runs **1067-1100 ms** (8 runs);
   - the tier stays A (desktop) or B (mobile). On SwiftShader, the tier sampler downgrades Home to C, so the gate then measures a different tier.

   The splash check also measures from navigation start. `splash.js` records its own User Timing measure, `cs-splash`, from the mark's first frame, and its header says the gate reads that measure; the gate does not.
   Mobile cut fps at 4× is marginal on the GPU (52-55 fps on home cut 1, which is the cost in item 3), so not all of the fps miss is an artifact.
   File: `tools/lib/perf-lab.mjs`:
   - read `performance.getEntriesByName('cs-splash')`;
   - run without SwiftShader, or report fps as informational when the renderer is SwiftShader;
   - pin the tier (`data-tier-lock`) for the fps runs.
6. The gate's static "JS initial gzip" check passes pages that are really over budget (see item 2), because it leaves out the idle-loaded dotglobe chunk. File: `tools/perf-gate.mjs`: add the dotglobe chunk to the count on pages that have `#globe`.

## Not done
- No full Lighthouse rerun of all 10 combinations (the gate's run is the evidence). I reran partners mobile only (2 runs).
- I did not run a 4× CPU trace on the GPU for services and story.
