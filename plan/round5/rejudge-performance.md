# Round 5 re-judge, round 1: Performance as a user feels it

**Overall: 7 / 10** (baseline 4 / 10). Not yet at the T8 bar of 8.

The rebuild fixed the original failures. three.js is gone, and so are the splash on every page, the 2.7 s of blocking JS and the 95-notch scroll. Lighthouse now scores 93-100 on mobile and 100 on desktop on every page, TBT is 0-42 ms and the DOM is 513-876 nodes. On a laptop the site is fast.

It is not yet excellent on the audience's mid-range phone:
- Cuts on a phone run at 48-57 fps with a real GPU and 29-58 fps with a software GPU, against a 55 fps budget.
- Style recalculation and native paint still dominate each cut.
- The loader that wins the Lighthouse score also stops phones from ever seeing the W1 match cut.
- Partners misses the LCP budget.
- The repo's own gate exits 1, with 18 budgets missed in review-1 and 21 in my rerun.

## Per-page scores

| page | baseline | now | one line |
|---|---|---|---|
| index.html | 4 | **7** | LH 98 / 100, TBT 5 ms, DOM 632, 165 KB total. Phone cuts run 49-52 fps (GPU). The W1 match cut never runs on a phone (CSS fallback 3/3), and the tier sampler downgrades Home to C under load. |
| services.html | 4 | **7** | LH 100 / 100, 875 nodes (budget 900). Phone cuts run 53 fps (GPU) and 29-58 fps (software). Style recalc is about 235 ms per 4 cuts on desktop, and there are mobile long tasks of 87-601 ms. |
| story.html | 6 | **7** | Light (513 nodes): 57 fps on phone and 60 on desktop with the GPU. LCP is 1.96 s, right at the 2.0 s line. On software raster the desktop cut runs 40-43 fps. |
| partners.html | 5 | **6** | The worst cut page: 48 fps phone (GPU), 33-34 fps desktop on software raster in **both** gate runs, and the most style recalc (988 ms over 4 cuts on desktop). **LCP 2.53 s fails** the 2.0 s budget. |
| legal.html | 3 | **7** | LH 100, no globe, stars or cursor, 0 long tasks, 60 fps desktop and 55 fps phone. Initial JS is still **51 KB gzip against the 40 KB budget**, because it ships the full film engine and GSAP. |

## Evidence

- **Review-1 files:** `plan/round5/shots-r5/review-1/` (perf-gate.txt, console-check.txt with 0 issues, compliance-diff.txt with 0 missing, seek-test.txt with no dead air, and screens).
- **My own live checks:** `node serve.mjs dist 8448` (stopped afterwards). Scripts and raw output are in the scratchpad `rejudge/` folder:
  - `perf-gate.mjs --only=lab`;
  - a CDP profiler over 4 PageDown cuts per page, run with SwiftShader and with the hardware GPU (`--enable-gpu --use-angle=d3d11`);
  - a splash timing probe;
  - a slow-4G, 4x CPU filmstrip.
- **Caveat:** the machine was at 100% CPU, with 25 Chrome and 55 node processes from parallel agents. The gate's lab runs headless SwiftShader, so its fps numbers are pessimistic. I therefore report GPU and SwiftShader numbers side by side. Only patterns that held across runs are scored.

| page / profile | gate fps (review-1 / mine), SwiftShader | my GPU fps | GPU janky frames > 25 ms | style recalc, 4 cuts | max long task in cuts, 4x |
|---|---|---|---|---|---|
| index desktop | 48.9 / 56.4 (tier → C) | 58.2 | 2 % | 766 ms | 0 |
| index phone 4x | 29.3 / 40.1 (tier → C) | 52.0 | 3 % | 772 ms | 110-307 ms |
| services desktop | 56.9 / 55.0 | 56.6 | 6 % | 941 ms | 0 |
| services phone 4x | 58.1 / 29.5 | 53.3 | 3 % | 621 ms | 87-601 ms |
| story desktop | 43.0 / 39.8 | 60.0 | 0 % | 161 ms | 0 |
| story phone 4x | 43.7 / 29.3 | 57.0 | 2 % | 593 ms | 0-257 ms |
| partners desktop | **33.6 / 32.4** | 54.7 | 6 % | **988 ms** | 0-95 ms |
| partners phone 4x | 52.9 / 38.9 | **48.1** | 9 % | 728 ms | 100-278 ms |
| legal desktop (C) | 60.2 / 60.2 | n/a | 0 % | 104 ms | 0 |
| legal phone 4x (C) | 59.4 / 50.2 | 54.9 (SwiftShader) | 6 % | 296 ms | 0-75 ms |

The CPU profile of the cuts shows that JS is no longer the problem: about 100-250 ms of script per 4 cuts on desktop. GSAP's ticker is the biggest JS self-time, at 260-620 ms over 4 cuts at 4x. Most cut time is native work: 1.2-2.3 s of "(program)" (paint, raster and composite) plus style recalc. The DOM reads `getClientRects`, `offsetTop` and `rect` still appear inside cuts, at 25-63 ms.

## What is now good (keep)

1. **three.js is gone.** The dotglobe chunk is 15.8 KB gzip and lazy. Initial JS is 51-65 KB gzip per page, against about 200 KB before. Home's total transfer is 165 KB.
2. **Lighthouse:** mobile 93-100, desktop 100, Accessibility 100, Best Practices 100, SEO 100 on all 5 pages. TBT is 0-42 ms, against 950-2,720 ms before. CLS is 0.000-0.018.
3. **The splash plays once per session.** Later pages paint content at about 1.2 s on slow 4G at 4x, with no wall (filmstrip `next-services-*.jpg`).
4. **Every loop sleeps:** 0 rAF callbacks 6-8 s after landing, on every page and profile, in both runs.
5. **DOM and layers:** DOM is 513-876 nodes, against 1.5-2k before. Composited layers are 7-25. INP on desktop is 24-48 ms.
6. **Cuts replaced the scrubbed scroll,** so 7 gestures cross Home instead of about 95.

## Findings, ranked by severity

### H1 · high: the W1 match cut never runs on a phone. Lighthouse wins, the signature moment loses.
- **Files:** `build.mjs` (`scriptLoader`, `pageEntry`) and `site/assets/js/splash.js` (`CSS_FALLBACK_MS`).
- **Evidence:** fresh Home at 390x844, 4x CPU and slow 4G gave a `cs-splash` measure of `null` in 3/3 runs. `initSplash()` arrived after 1.5 s and took the `performance.now() > CSS_FALLBACK_MS` branch. On desktop with no throttling, Home also fell back once (FCP 952 ms). Services desktop played it (1,117 ms).
- **Why:** the loader waits for FCP, then requests about 15 modulepreloads, then `afterFirstPaint`, then vendor, then a task, then the page, then main, then the splash. On a phone that chain alone is longer than 1.5 s, so the visitor gets the plain CSS fade instead of the aperture landing on the globe.
- **Fix:**
  - Make the match cut independent of the bundle. Either inline a tiny WAAPI-only splash script (no GSAP, about 2 KB) before the stylesheet, or move the aperture travel into CSS. The latter needs an inline head script that writes the hero globe circle as custom properties (`--ap-x`, `--ap-y`, `--ap-r`), computed from the anchor's CSS layout.
  - Let dotglobe pick up `cs:splash-aperture` whenever it arrives.

### H2 · high: phone cuts miss the 55 fps budget on Home and Partners, even with a real GPU. Style recalc per cut is too large.
- **Files:** `site/assets/js/film.js` (lines ~258-284 and 322: `html.dataset.scene`, `html.dataset.field`, `data-hdr-field` and `is-cutting` are all written on `<html>` every cut), `site/assets/css/base.css` (`html[data-hdr-field=…]`, `html.film…` selectors), and `site/assets/css/partners.css` / `site/assets/css/services.css` (descendant selectors keyed off root state).
- **Evidence:**
  - Partners phone 48.1 fps with 9 % janky frames, Home 52.0 fps (GPU).
  - Partners desktop 32-34 fps on SwiftShader in both gate runs, while legal on the same machine and harness holds 60 fps.
  - Style recalc of 600-990 ms per 4 cuts on services and partners.
  - Each root attribute or class write invalidates the whole document.
- **Fix:**
  - Batch the root writes into one per cut: set the scene, field and header field together, at the landing.
  - Drop `is-cutting` from `<html>`, or scope it to `.film-stage`.
  - Move field-dependent styling to a custom property on the stage, not to `html[...]` descendant selectors.
  - Set `will-change` only on the in and out groups during the cut (§12 rule).

### H3 · high: the perf gate is red, so T2 fails as specified.
- **File:** `tools/perf-gate.mjs` (no change needed; the budgets are DIRECTION §12).
- **Evidence:** 18 misses in review-1 and 21 in my rerun:
  - splash 1.6-2.5 s against ≤ 1.1 s;
  - cut fps on 8 of 10 page/profile pairs;
  - long tasks during cuts at 4x on 4-5 pages;
  - mobile script transfer 77-87 KB against ≤ 70 KB on 4 pages;
  - legal JS;
  - partners LCP.
- **Note:** some misses are harness artefacts, because SwiftShader and the contended CPU inflate fps and long tasks. The orchestrator should rerun the lab on an idle machine, or add a `--gpu` option, before treating the fps rows as final. Splash, LCP, script transfer and legal JS are not noise.

### M1 · medium: hero text paints, then disappears and re-animates when JS lands.
- **Files:** `site/partners.html`, `site/story.html` and `site/index.html` (hero `h1[data-reveal="words"]` with `data-delay="0"`), plus `site/assets/js/film.js` / `site/assets/js/textfx.js`, wherever the first scene's in-group runs.
- **Evidence:**
  - The later-page filmstrip (services at 4x, slow 4G) shows the hero rows at 800-1200 ms, dimmed and shifting at 1600 ms, and settled at 2000 ms.
  - `[First name]` is swapped for the configured name at runtime, after paint. The text visibly changes.
  - LCP is re-timed by the re-reveal: partners 2.53 s (**fails** the 2.0 s budget) and story 1.96 s.
- **Fix:** on the first scene of a load, never re-hide content that has already painted. Skip the in-group, or run it as a gold sheen only. Bake the `config.js` name into the HTML at build time (`build.mjs`), so nothing swaps after first paint.

### M2 · medium: under load, the tier sampler downgrades Home to C and the signature globe turns into a poster mid-view.
- **Files:** `site/assets/js/tier.js` (`sampleTier` samples 90 frames right after the first landing, "when the page is at its busiest") and `site/assets/js/dotglobe.js` (`toPosters` on tier change, plus the hero arc and splash hand-off running during the sample window).
- **Evidence:** Home went from A to C on desktop and from B to C on phone in every SwiftShader run, including review-1. Story, services and partners never downgraded. On a slow Android, Home is exactly where the visitor would lose the globe.
- **Fix:**
  - Sample after the hero arc has finished, not during it.
  - Downgrade only on sustained p75 over two windows.
  - Crossfade dots to poster rather than swapping them.
  - Make the hero arc itself cheaper on tier B: fewer points while the arc is drawing, and no `drawLabel` per frame.

### M3 · medium: the splash budget is still missed on a fresh session.
- **Files:** `build.mjs` (loader) and `site/assets/js/splash.js`.
- **Evidence:** navigation to `splash-done` takes 1.64-1.76 s on desktop and 2.15-2.57 s on phone, against ≤ 1.1 s. Part of this is H1. The other part is that `splash-done`, which gates `film.ready`, is only set when the late JS runs, even after the CSS fade has finished.
- **Fix:** comes with H1. Also let the CSS fallback's `animationend` add `splash-done`, so the film never waits on a splash that has already left.

### M4 · medium: legal ships the film engine.
- **Files:** `site/legal.html`, `site/assets/js/legal.js` and `build.mjs` (page chunks).
- **Evidence:** 51.0 KB gzip initial JS against ≤ 40 KB (vendor GSAP at 27 KB plus `chunk-WJUUZAAN` at 15 KB). Mobile script transfer is 67.6 KB.
- **Fix:** legal is tier-C locked with crossfades only. Run its cuts on WAAPI or CSS and drop GSAP from the legal bundle, or load the engine only after the first input.

### L1 · low: mobile script transfer is over budget on 4 pages.
- **Files:** `build.mjs` (chunking and the modulepreload list).
- **Evidence:** 77.6-87.4 KB against ≤ 70 KB, on index, services, story and partners.
- **Fix:** lazy-load `wa-sheet` (3.3 KB), `finder` and `canada-map` (15 KB, services), `lenis` (fine pointer only), `sfx` and `interact` on first interaction rather than modulepreloading them.

### L2 · low: the brushed tile is emitted twice.
- **File:** `build.mjs`.
- **Evidence:** `dist/assets/img/brushed-256.png` and `brushed-256-YVL25BPJ.png` are identical.
- **Fix:** emit only the hashed copy.

### L3 · low: DOM reads still run inside cuts.
- **Files:** `site/assets/js/film-reach.js:21` (`getClientRects` per focusable on every cut), `site/assets/js/globe-fit.js` and `site/assets/js/splash.js` `anchorBox` (`offsetTop` walks).
- **Evidence:** 25-63 ms per 4 cuts, against the §12 rule "no DOM reads in cut or progress handlers".
- **Fix:** cache these values on `build` and resize.

## Verdict

From a performance seat, the site went from "splash wall, then stutter" to "instant and light". Desktop is genuinely premium. An 8 needs three things:
1. The signature opening actually plays on a phone (H1).
2. Phone cuts hold ≥ 55 fps on Home and Partners with less root-level style invalidation (H2).
3. The hero does not paint and then re-animate (M1).

These are focused fixes in `build.mjs`, `splash.js`, `film.js` and the hero markup, not a rebuild.
