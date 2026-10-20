# Round 5 · Re-judge 1: Motion and Experience

**Overall: 7 / 10** (was 5 / 10 in `judge-motion.md`).

The site now moves like the brief asks. Each scene plays as one timed cut, lands composed in about a second and then stays still. The decode glyphs, star rain, letter-roll, heading drift and the splash-on-every-page are gone. The quiet SFX set matches §8, and the field changes read as chapters rather than strobes. It is calm, premium and clearly one film across five pages.

It is not yet an 8, for three reasons:
- **Smoothness is unproven on the target device.** The lab cut frame rate misses budget on 4 of 5 pages, and one cut has a 307 ms long task at 4x CPU.
- **The travelling globe overlaps text in the middle of cuts.** It also *appears* to stay behind text in the landed review shots, but that turned out to be a tooling artefact (see F3).
- **Two signature moments are weaker than their spec.** The Story ring is a sparse dotted C, and the Legal close has no bookend.

## Evidence

- **Review set:** `plan/round5/shots-r5/review-1/`. I read every scene shot at 1440x900 and 390x844 (all 5 pages), every 50% mid-cut frame at both sizes, and these outputs: `perf-gate.txt`, `seek-test*.txt`, `console-check.txt`, `compliance-diff.txt` and `fit-*.txt`.
- **Live checks:** my own headless Chrome (isolated profile) against **dist/ served on :8444**, which is now stopped. Scripts and frames are in the scratchpad at `...\scratchpad\rjm\` (`probe.mjs`, `close.mjs`, `deep.mjs`, `touch.mjs`; frames in `out/`, `out3/`, `out4/`, `out2/`).
- **Live numbers, desktop 1440x900, tier A:**
  - Splash: the hero is painted with the H1 by **1.0 s** (a fresh session). The stop has popped by 2.5 s.
  - Second page in the session (Home → Services by a nav click): `splash-skip`, and content is rising at **150 ms**.
  - One wheel notch moves exactly one scene. At 180 ms the gold stop is swelling into the iris; at 400 ms the new scene is composed except the stop; at 1.3 s it has fully landed.
  - A 6-notch flick moves exactly **1** scene, so the momentum lock works.
  - Walking Home at one notch per 1.3 s reaches the credits in 6 cuts.
  - The End key jumps straight to the credits; Home jumps back.
  - Deep links `#close` on all four pages land clean, with the medallion and no globe residue at 3 s or 7 s.
  - rAF callbacks: 1.3–3.3 s after a cut, 17 (then asleep); Services idle 6.6–9.6 s, **0**; Home hero 6–9 s after load, 80 (the idle rotation stops at about 7.3 s, which is borderline on the 5 s rule but passes).
- **Live numbers, phone 390x844, touch-cut, tier B, 4x CPU:**
  - The hero is composed at 1.2 s and the arc fires.
  - Idle rAF 7–10 s: **0**.
  - Walking with `scrollBy` lands every scene (hero → credits) with the field change.
  - Synthetic touch swipes (CDP `dispatchTouchEvent` and `synthesizeScrollGesture`) did not scroll the page in headless, so **a real swipe was not verified** (see F8).
- **Reduced motion:** flow mode, hero static and composed at 700 ms, no splash animation.

## 1. Scores

| page | R5 original | now | one line |
|---|---|---|---|
| Splash + page changes | 6 | **8** | About 1 s, once per session, match cut into the globe; later pages arrive with no wait. The View Transition circle is configured (`@view-transition`, `cs-header`/`cs-mark`) but not observable headless. |
| Home `index.html` | 5 | **7.5** | 7 scenes, each lands in about 1 s. The stop → iris J-cut, struck searches, metal doors with the ink flood, globe → Canada and the medallion close all work. It loses points for globe/text overlap mid-cut on phones and a 307 ms long task in the lab. |
| Services `services.html` | 4.5 | **6.5** | No more panning or tilt; the fields are chaptered. Still 9 scenes. Three consecutive bone "Ours" scenes (02–04) feel samey. The cut frame rate misses (56.9 fps desktop) and long tasks reach 87 ms. |
| Our Story `story.html` | 7 | **7** | The best composed page. But the logo ring is now a sparse, broken dot circle that does not read as a "C" at a glance, so it is weaker than the old monogram moment. The cut frame rate is 43 fps on desktop and 43.7 on mobile. |
| Partners `partners.html` | 5 | **6.5** | The map hero with the "You" node is strong, and the tier tilt is ≤ 4°. In the 02-03 mid-cut, the Canada map lingers at full brightness across the tier columns. The cut frame rate is **33.6 fps** on desktop (the worst on the site), and LCP on mobile is 2.5 s. |
| Legal `legal.html` | 3.5 | **7** | One bone field, no stars or globe, crossfade cuts, and seek passes on all 84 frames. It is calm as intended. The close is a lone CTA in the bottom-left with no bookend, so the page simply stops. |
| Reduced motion / flow | 6.5 | **7** | Honest, composed and fast. The nav-rescue now guarantees a header if the film fails. The 8 s cliff still exists, but it now has a fallback nav. |
| **Overall** | **5** | **7** | Every critical and high issue in the original verdict is fixed in code and confirmed live. What remains is smoothness on mid-range hardware, plus polish on two signature moments. |

### Status of the original top issues

| # | original | now |
|---|---|---|
| B1 | dead air | **Fixed.** Seek test: 0 failing frames out of 366. Live, the incoming text arrives during the iris. |
| B2 | decode scramble | **Fixed.** `textfx.js` header says it was deleted; no glyph substitution was seen anywhere. |
| B3 | luminance strobe | **Fixed.** Home runs ink · bone · bone · gold · ink · ink · ink; Legal stays on one field. |
| B4 | scrubbed half-states | **Fixed.** Time-based cuts, settled by about 1.0–1.3 s live. |
| B5 | pacing | **Fixed.** One notch moves one scene, and a flick still moves one. |
| B6 | splash on every page | **Fixed.** Once per session (`splash-skip` on page 2). |
| B7 | star rain | **Fixed.** Static stars. |
| B8 | SFX | **Fixed in code.** `sfx.js` has gain 0.12, three voices, silence on coarse pointers, and a footer switch. |
| B9 / B14 | tilt and stacked hover effects | **Fixed.** Only the ≤ 4° tier tilt and the CTA magnet remain. |
| B11 | fallback with no nav | **Mostly fixed.** `.nav-rescue` is injected; the 8 s switch remains. |
| B12 | invisible header mid-iris | **Fixed.** The header holds in every mid-cut frame. |
| B13 | wandering globe | **Improved.** The globe has jobs now, but see F2. |
| B15 | muddy media | **Fixed.** No translucent grey quads in any mid-cut. |

## 2. Findings, ranked by severity

### F1 · high: cut smoothness misses budget on every film page in the lab
- **Numbers** (`perf-gate.txt`; the machine was shared, so these may be pessimistic, but every page misses in the same direction):

  | page | desktop | mobile |
  |---|---|---|
  | Partners | **33.6 fps** | 52.9 |
  | Story | 43.0 | 43.7 |
  | Home | 48.9 (tier C) | **29.3** (touch-cut, tier C) |
  | Services | 56.9 | – |

  The budgets are ≥ 58 desktop and ≥ 55 mobile. Long tasks during cuts at 4x CPU: Home **307 ms**, Partners 100 ms and Services 87 ms, against a budget of ≤ 50 ms.
- **Why it matters:** the audience is on mid-range phones. A 300 ms freeze at the moment of the cut is exactly the "film that makes them wait" the concept forbids, and it would erase most of the gains above.
- **Files:**
  - `site/assets/js/film.js` (what the cut timeline builds and measures at cut start: move any layout reads or text splitting to build time);
  - `site/assets/js/dotglobe.js` and `site/assets/js/dotglobe-draw.js` (the per-point morph and redraw cost during cuts; Home and Partners are the globe/map pages and the worst offenders).
- **Fix:** profile one Home cut at 4x CPU and find the long task. Pre-compute the morph targets at build time. Cap DPR and point count on tier B/C during a cut (520 points per §9.5). Then re-run `tools/perf-gate.mjs` on an idle machine before judging again.

### F2 · high: the globe/map overlaps text during cuts on Home, Services, Story and Partners
- **Evidence:** 50% mid-cut frames, where text is fully readable while the globe passes behind it.
  - `mid-cuts/index/390x844-A/05-06-50.png`: the map label "A Professional Near You" overprints "One Message." on the phone.
  - `index/1440x900-A/05-06-50.png`: the sphere sits behind the close headline.
  - `06-07-50.png` (Home, Partners, Story and Services, both sizes): the map or sphere sits behind the credits' contact and compliance text.
  - `partners/1440x900-A/02-03-50.png`: the full map runs across the Premier tier column.
  - `story/1440x900-A/03-04-50.png`: a ring arc crosses the values rows.
- **Rule broken:** §4.4 rule 3, "the globe beside the text (never behind it)", and the W5 bookend.
- **What live checks showed:** the map/sphere fades and moves only after the new text has landed. This lasts about 0.3–0.6 s, but it is visible on every globe-bearing cut.
- **Files:** `site/assets/js/dotglobe.js` (mode change timing on `cut`), `site/assets/js/globe-fit.js` (anchor per scene).
- **Fix:** start the globe's exit at the beginning of the **out** group (0 → 0.32 s), not with the in group. Under `hidden` and `medallion` modes, finish the fade before the in group starts at 0.30 s. Never draw the map label outside the map's own anchor box.

### F3 · medium: the review shots are wrong on closes because the shoot tool does not wait for the globe
- **Evidence:** the "landed" shots `story/1440x900/05-close.png` and `services/1440x900/08-close.png` show the dotted ring crossing "Tell Me What You Need" and the full Canada map behind "Ask Once. It's Handled." with the arc over the fine-print link. Live, the same scenes reached by walking, by deep link (`#close`) or by the End key are clean at 1.4 s, 3 s and 7 s (`rjm/out3`, `rjm/out4`).
- **Why it matters:** this is not a visitor-facing bug, but it makes the evidence set misleading for every other judge, who will score a collision that is not there. The same applies to seek-test, which passed frames that show text over the globe (F2): its "no dead air" check does not test for overlap.
- **Files:**
  - `tools/shoot.mjs`: after seeking, wait for the globe to sleep (its ticker removed, or a `landed` plus the morph duration) before capturing.
  - `tools/seek-test.mjs`: add an overlap check between the globe canvas's lit bbox and the text boxes of the in group.

### F4 · medium: the Story logo ring does not read as a "C"
- **Evidence:** `story/1440x900/03-logo.png`; live `rjm/out3/story-1-logo.jpg`. The globe collapses into a thin ring of scattered dots with a ragged gap. Next to the solid gold W, it reads as a dust halo rather than the C of the monogram, and the line "C Stands for Cargado." points at nothing legible.
- **Why it matters:** this was the site's one true wow frame in the original judgement (7/10) and the template for W5. It is now the weakest version of itself.
- **Files:** `site/assets/js/dotglobe.js` (`ring` mode target path and point density), `site/assets/js/story.js` (the logo cut).
- **Fix:** after the collapse, cross-fade the dots into the solid 2 px gold C stroke from the splash SVG (the same `stroke-dashoffset` draw, 420 ms). Alternatively, pack the points densely onto the C path with the correct opening.

### F5 · medium: Services is long and its middle is samey
- **The problem:** 9 scenes. Scenes 02 (Insurance), 03 (Strategy) and 04 (What You Get) are three consecutive same-field bone cuts with similar left-heading, right-content compositions. The motion offers nothing new for three steps, which is the "wading" feeling in a smaller dose.
- **Evidence:** `services/1440x900/02–04`, and the 390 equivalents.
- **Files:** `site/services.html` (scene structure), `site/assets/js/services.js` (per-scene cut choreography).
- **Fix:** merge "What You Get" into the Strategy scene as its rows, or give the three "Ours" scenes one shared hairline frame draw (§2 "the hairline frame") so each cut has a visible beat.

### F6 · medium: the Legal close has no bookend
- **Evidence:** `legal/1440x900/07-close.png`: "Still Have a Question? Ask Us." sits bottom-left with an ink CTA, about 60% of the frame is empty bone, and there is no medallion or gold dot. Every other page ends on the W5 medallion.
- **Files:** `site/legal.html`, `site/assets/css/legal.css`.
- **Fix:** add a static `.medallion` (or a small gold dot that pops like the stop) above the close statement, centred like the other closes. Keep it static; no globe on Legal.

### F7 · low: Partners mobile LCP is 2.5 s, and script transfer is over budget on 4 pages
- **Evidence:** `perf-gate.txt`. Mobile script transfer is 77.6–87.4 KB against a 70 KB budget. Legal initial JS is 51 KB against 40 KB, even though Legal has no globe, stars or cursor.
- **Why it matters here:** the Partners hero map paints late, so the first signature frame arrives after the visitor has started reading.
- **Files:** `build.mjs` (chunking of the per-page bundles), `site/assets/js/legal.js` (what Legal imports).

### F8 · low (unverified): phone swipe behaviour
- **What I could and could not check:** headless synthetic touch input did not scroll the page in touch-cut mode, so I could not confirm the "one swipe = one scene" feel. Programmatic scrolling landed every scene correctly, and `film.js` correctly uses native snap with no touch interception on coarse pointers, so this is probably a tooling limit.
- **Needs:** a real mid-range Android and iPhone pass before the next judgement. Check that a swipe gives exactly one scene, that the iris starts at 0.35 intersection, and that nothing jitters at 4x CPU.
- **Files:** `site/assets/js/touch-cut.js` (only if the device test fails).

### F9 · low: the 8 s flow fallback still re-lays the page under the visitor
- **Evidence:** the built head script still switches to `rm` / `film-fallback` at 8 s whenever `film-ready` is missing, whether or not the visitor has scrolled. `.nav-rescue` now guarantees navigation, which removes the worst part of B11.
- **Files:** `site/index.html` (and the same head snippet in the other 4 pages).
- **Fix:** only switch if `scrollY === 0` and there has been no input yet.

## 3. What to keep (do not touch)

1. **The cut engine** (`film.js`, `film-snap.js`): one notch moves one scene, a flick moves one, it settles in about 1 s, and the Home/End/deep-link jumps are clean.
2. **The W1 opening:** about 1 s splash, the match cut into the globe, the H1 word rise, then the stop pop. Once per session.
3. **The full stop → iris J-cut** on Home. It is the best brand-specific motion on the site now.
4. **The W3 metal doors**, with the ink flood on hover/focus and all content visible at rest.
5. **The medallion closes** on Home, Services, Story and Partners. They are clean live.
6. **The calm of Legal**, and the §8 sound set.
