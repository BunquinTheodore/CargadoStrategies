# Round 5 · Gate G3 · Home slice · Motion judge

Lens: motion and experience: cuts, the iris, reveals, signature moments W1-W5, input feel, splash pacing, touch and reduced motion. I used the same rubric and scoring style as `judge-motion.md`, and I am standing in for the client review.
- **Target:** DIRECTION §2 (W1-W5), §4.4, §7.1 and §9.
- **Audience:** Canadians aged 30-45 on mid-range phones.
- **Brief:** wow factor, unforgettable, not clogged, modern.
- **Scale:** 8 means award-shortlist quality with zero clutter.

Date: 2026-10-18. This was a read-only review: I changed nothing in `site/` or `dist/`.

**What I looked at**
- **The slice-1 set** in `plan/round5/shots-r5/slice-1/` (`R/` below): scenes and 25/50/75% cut frames at 4 viewports, the splash frames, and the W1 realtime and 10%-step seeked sequences.
- **My own live runs** of the production build: `node serve.mjs dist 8352`, headless Chrome with an isolated profile, **real CDP input** and no film hook. I used wheel notches of 100 px, a 6-notch burst at 50 ms, and a 30-event trackpad-style fling. On the phone I used touch swipes at 390x844 with a coarse pointer. Reduced motion was the third pass. The screencast frames carry ms since input. They are in the session scratchpad under `g3m/` (`L/` below):
  - `out-desktop/<step>/`, `out-phone/<step>/`, `out-rm/`;
  - contact sheets `sheet-d-*.jpg` and `sheet-p-*.jpg`;
  - `results.json` per run.
- **The motion code:** `cut.js`, `iris.js`, `film-reveals.js`, `home-tweens.js`, `home.js`, `splash.js`, `touch-cut.js`, `tier.js`, `motion-tokens.js` and `base.css` §7-9.
- **Caveats:**
  - Headless runs on SwiftShader, so frame times are not used.
  - The desktop tier varied between runs: A on an idle machine, C (the fade iris and the globe poster) under load. **I judged both**, because tier C is what a mid-range device gets after one janky sample.
  - The touch swipes are synthetic, so the phone findings carry a "confirm on device" note.
  - `dist/` predates the owner copy update, so the brackets on screen are not counted here (see `slice-1-visual.md` V4).

---

## 1. Scores (this lens only)

| beat | desktop | phone | one line |
|---|---|---|---|
| Splash + W1 opening | 6 | 6 | The monogram draw is elegant, it plays once per session (verified: no `#splash` on reload) and lasts ≈1.2 s. But the hero is already composed under the fading splash, then the landing **re-plays** it (the stop is visible at 1.24 s, gone at 1.63 s, then pops), and the globe's limb dissolves into haze with a ~15-90 px arc stub. The "first full stop" is a double-take, not a landing. |
| Cut 1 (hero → H2) + W2 | 7 | 6.5 | On tier A this is a true J-cut: the stop swells into a bone circle and the strikes arrive during the iris (`R/w1…/first-cut-seeked/040`). But the story is told backwards: **"One Message●" lands (553-823 ms) before a single search is struck (823-1111 ms).** |
| Cut 2 (H2 → H3) | 7.5 | 7 | A same-field cut, calm and quick. The rows rise with a 60 ms stagger and settle by ≈1.0 s. It is the best-paced cut on the page. |
| Cut 3 (H3 → H4) + W3 | 6.5 | 6 | The doors are dealt in nicely (alternating y and rotationY, landing flat, ≈1.1 s). The metal sheen was not perceptible in any realtime frame. On tier C the "iris" is a full-screen gold wash over the outgoing rows. |
| Cut 4 (H4 → H5) + W4 | 6 | 6.5 | The gold drains to mud (284 ms), then a near-empty dark frame (435 ms), then the map is **already flat** by 505 ms. The sphere never appears, so "the globe comes down to Canada" is not readable on desktop. On phone the map assembles and the label "A Professional Near You" arrives by ≈2 s. That is better, but slow. |
| Cut 5 (H5 → H6) + W5 | 6 | 7 | Desktop: an almost empty ink frame with a ghost medallion (532 ms), then the words set and the stop pops. There is no visible "globe shrinks into the medallion". The phone shows the shrink over the map and is clearly better. |
| Engine feel (input, settle, idle) | 8 | 7 | A 6-notch burst moves **exactly 1 scene**, a trackpad fling moves exactly 1, back-cuts mirror, and every cut is static by 1.0-1.3 s. rAF is **0/s at load+10 s**. There is no decode, no streaks, no tilt and no scroll ticks. The R5 cut engine is a real step up. |
| Touch-cut (phone) | n/a | 5.5 | A partial or aborted swipe fires the iris at the 0.35 crossing, then the snap returns: you get a gold iris, then **two fully empty bone frames (980 and 1096 ms)**, then the old scene again. The stop-swell disc starts over the lead text and globe, not on the stop. |
| Reduced motion | 6.5 | n/a | Flow mode, no splash animation, 0 rAF. One wheel notch scrolled 100 px and then **snapped back to the hero** (twice). Under mandatory snap a single notch does not move a scene. |
| **Home overall** | **6.5** | **6** | **6.5 / 10.** The R5 baseline for this lens was 5. |

How I would put it to the jury: *"The engine is right: one gesture, one composed scene, nothing moving while you read. But the four signature moments don't land yet: the opening double-takes, W2 answers before it asks, the globe never visibly becomes Canada, and the cheaper tier turns every chapter change into a dirty crossfade."* Clutter is solved. **The wow is not there yet.** That is the gap from 6.5 to 8.

---

## 2. What is good (keep)

1. **Discrete played cuts with an honest input lock.** The burst and fling tests both give one scene. Back-cuts mirror y. Every cut is composed and static within about 1.0-1.3 s:
   - the last frame changes at 1.11 s (cut 1), 1.29 s (cut 3, doors), 1.06 s (cut 4) and 0.99 s (cut 5);
   - this is the R4/R5 contract, delivered.
2. **The tier-A first cut.** The gold stop swells into a bone circle from its own centre, and the strikes are already arriving inside it (`R/w1-sequence-1440x900/first-cut-seeked/030` → `060`). This is the best single motion idea on the site. Protect it.
3. **The deleted noise stays deleted.** There is no decode scramble, no star streaks, no tilt on forms or doors, and no scroll or hover ticks. Text never moves while it is being read.
4. **Splash discipline.** The splash plays once per session, lasts ≈1.2 s on wide, and the hero is painted underneath. The match-cut ring does travel to the globe's centre and radius (`R/…/realtime/f025` → `f028`).
5. **W3 deal-in.** Alternating ±48 px and ±12° rotationY, 70 ms apart and landing flat, reads as "three doors being laid on the table". On phones it rises in y only, which is correct.
6. **Autonomous motion sleeps.** rAF is 0/s at +10 s on desktop, phone and reduced motion, and the stars do not drift on bone or gold.
7. **The phone W4 and W5.** The map assembles with its label, and the medallion visibly grows over the map before the words set (`L/sheet-p-B.jpg`, rows 2-3).

---

## 3. Findings (ranked by cost to wow and trust)

| # | severity | finding | evidence | file that must change | fix |
|---|---|---|---|---|---|
| M1 | **high** | **The fade-iris path (tier C, and any device that downgrades) is muddy.** The hero has no out group (by spec, "the iris from the stop is the cut"), so when the iris is a full-screen **fade** overlay the whole hero sits at full opacity under a 50% bone veil. Gold→ink dims the metal to brown with the doors still legible. Tier C also loses the stop-swell signature entirely. This is the path a mid-range phone takes after one janky 90-frame sample. | `L/out-desktop/cut-1/008-00342ms.jpg` (washed hero), `L/sheet-d-cut-4.jpg` 284 ms, `R/1440x900/cut-01-02-25.png`, `cut-03-04-25.png`, `cut-04-05-25.png` | `site/assets/js/cut.js` (with `site/assets/js/iris.js`) | When the iris is `fade`, always play the out group (the hero too), and start the fade at the `in` label, not at `iris`, so old and new content never share a frame. Better still: crossfade the `.fields` layer **under** the scenes instead of an overlay above them. On tier C, keep a cheap version of the stop swell (a single scaled DOM circle is compositor-only and affordable on tier C). |
| M2 | **high** | **The W1 hero landing is a double-take.** The hero is fully composed while the splash background fades (1.0-1.24 s, stop visible). Then the first landing builds its fromTo tweens, so the stop vanishes (1.63 s) and pops again, and the lead and rule jump back and re-rise. The visitor sees the page, then sees it "reset". The promised "words rise, the stop pops last" moment is never seen cleanly. | `R/w1-sequence-1440x900/realtime/f025-01002ms`, `f028-01243ms` (stop present), `f029-01625ms` (stop gone, lead offset) | `site/assets/js/film.js` (the opening landing; uses `film-reveals.js`) | Render the opening scene's in-group **from-states at build** (before the splash lifts): build the landing timeline paused and call `tl.progress(0)` with immediate render, or add `html.film:not(.film-ready) #hero [data-reveal] .word, #hero .stop { … }` start states in CSS. Then start the landing on `cs:splash-aperture` (the ring hand-off), not on `splash-done`, so the words rise *through* the aperture. |
| M3 | **high** | **W2 tells the story backwards.** The monument "One *Message*●" rises at 553 ms and its stop pops at 823 ms. The first strike bar only starts at about 823 ms, and the last ends at 1111 ms. The punchline lands before the problem is crossed out, so the "struck, then answered" beat (§W2 1-2) is lost. | `L/sheet-d-cut-1.jpg` (553/666/823 ms: monument complete, nothing struck; 883-1111 ms strikes) | `site/assets/js/home-tweens.js` | Add a `struck` label after the last bar (`in+=0.32+0.18+3×0.07 ≈ in+0.71`) and move the monument's words and its stop to that label. The engine places them by default, so take them over in the `'one-message'` choreography (or give the monument `data-delay`, which caps at 0.6 s, in `site/index.html`). The total stays ≤ 1.4 s. |
| M4 | **high** (confirm on device) | **Touch-cut fires the field change on a swipe that does not complete.** The 0.35 threshold opens the gold iris, the mandatory snap returns to `#situations`, and a second (bone) iris plays back. The result is two full-screen luminance flips and **two fully empty bone frames** (980 and 1096 ms) before the old scene reappears. 2 of 7 synthetic swipes did this. A real partial thumb flick does the same. | `L/out-phone/cut-3/` and `L/sheet-p-A.jpg` row 3 (512 ms lone gold disc on an empty bone screen; 898 ms bone circle over gold; 980/1096 ms empty) | `site/assets/js/touch-cut.js` | Commit the field change only when the scroll settles on the new section (`scrollend`, or the 0.6 ENTER_AT crossing with no reversal), or make the iris reversible: if the owner flips back within the iris, reverse the same timeline instead of starting a second one. Never leave content at opacity 0 over a settled field. |
| M5 | medium-high | **The hero globe never performs.** On tier A, after the ring hand-off the limb disappears and the globe is a dim haze. The "you → partner" arc is a ~15-90 px stub that is visible for a moment and reads as a glitch, not "one message reaches someone near you, twice" (§W1 2.5). The tier C poster, with bigger dots and the limb, actually reads better (`L/sheet-d-cut-1.jpg` 16 ms). | `R/…/realtime/f032-01993ms`, `f038-02713ms` (arc stub), `R/1440x900/01-hero.png` | `site/assets/js/dotglobe.js` | Keep the limb as a hairline. Make the arc span ≥ ⅓ of the diameter, drawing over ≈ 900 ms with a travelling head and the 2× "you" and partner node glow (see `slice-1-visual.md` V3). Fire the first play on the aperture hand-off, so the ring → horizon → arc reads as one gesture. |
| M6 | medium | **W4 has no sphere stage on desktop.** The globe is hidden on the gold scene, the iris washes to dark, and by 505 ms the points are already in the map layout. The morph from sphere to Canada, the page's second signature, is not perceptible. The phone does better but needs ≈2 s before the label lands. | `L/sheet-d-cut-4.jpg` (435 ms empty dark, 505 ms flat map), `L/sheet-p-B.jpg` row 2 | `site/assets/js/dotglobe.js` | On entry to `map` mode from `hidden`, first show the sphere for ≈150 ms after the iris midpoint (facing North America), then morph over 900 ms. Start the arc at 70% of the morph, not after it, so the whole beat lands in ≤ 1.5 s. |
| M7 | medium | **W5 desktop: the medallion fades in from an empty frame** (532 ms: a ghost disc on ink, no content) instead of the map or globe shrinking into it. That is also ~150 ms of near dead air in a same-field cut. | `L/sheet-d-cut-5.jpg` (532 ms) vs the phone, `L/sheet-p-B.jpg` row 3 (669 ms shrink visible) | `site/assets/js/dotglobe.js` (`medallion` mode from `map`) | Run the `map → medallion` shrink on desktop as on the phone: the points collapse into the `.medallion` rect over 600 ms, starting at the `iris` label. Start the statement's first word at 0.30 s, so no frame is empty. |
| M8 | medium | **Phone stop-swell origin.** In touch-cut the swell disc appears over the lead paragraph (319 ms) and then over the globe band (458 ms), not on the "Near You●" stop. The origin is read after the section has scrolled, so the signature reads as a random white blob. | `L/sheet-p-A.jpg` row 1 (319, 458 ms) | `site/assets/js/touch-cut.js` (origin hand-off to `site/assets/js/film.js`) | Capture the stop's rect on `touchstart` or at the 0.1 crossing and pass that as the origin, or translate the disc with the section until 0.35. |
| M9 | medium | **The ink strip on the right edge clips every iris** (15 px). Each circle visibly hits a dark wall on bone and gold. | `R/w1…/first-cut-seeked/040`, `L/sheet-d-cut-3.jpg` | `site/assets/css/base.css` | The same fix as `slice-1-visual.md` V1: size `.fields`, `.scenes` and `.iris` to the full viewport, or paint `html` with the active field. |
| M10 | medium (confirm on device) | **Reduced motion: one wheel notch snaps back.** `html.rm { scroll-snap-type: y mandatory }` with a 100 px notch scrolled and then returned to `#hero` within 250 ms, twice. A keyboard or trackpad user who prefers less motion gets a page that "won't scroll" unless they flick hard. | `L/out-rm/cut-1/` (74 ms scrolled, 249 ms back at top); `results.json` scene stays `hero` | `site/assets/css/base.css` (line 392) | On fine pointers under `.rm`, use `proximity` (the 408 rule already exists for one case) or no snap. Keep mandatory snap for touch only. |
| M11 | low-medium | **The iris ease hesitates.** `expo.inOut` over 0.62 s leaves the disc almost static for its first ~30%. On cut 1 there are ~150 ms where the hero has dimmed nearly to black and a small disc just sits (`first-cut-seeked/030`). It reads as a hitch before the swell. | `R/w1-sequence-1440x900/first-cut-seeked/020` → `030` → `040` | `site/assets/js/motion-tokens.js` (`EASE.iris`, mirrored in `base.css`) | Use `power3.inOut` or `expo.out` for the stop swell (it already has momentum from the pop), and keep `expo.inOut` only for centre-origin irises. |
| M12 | low | **Idle stop timing is borderline.** rAF was still 59/s at load+6.3 s, roughly 4.7 s after the hero landed. It stops by +10 s. T6 asks for 0 at 6 s after the last input, so it needs a precise trace. | `L/out-desktop/results.json` (`rafPerSecAtLoadPlus6: 59`, `…Plus10: 0`) | `site/assets/js/dotglobe.js` (and `site/assets/js/layers.js` for the star drift) | Measure the 5 s from the landing *or* the last arc, whichever is later, and stop the ticker on the dot. Confirm with `tools/perf-gate.mjs`. |
| M13 | low | **The W3 metal sheen is not visible** in any realtime frame of cut 3 (380-1290 ms). The "metal, not mustard" entry beat is missing, and the field reads as static brushed texture. | `L/sheet-d-cut-3.jpg` | `site/assets/js/home.js` (founder landing hook) with `site/assets/css/visual.css` | Trigger the one sheen sweep (1.2 s) on the `founder` `landed` event, the same way `sheenOnce` does for the hero CTA. Check that the band has enough contrast (≈ 18% ivory) to read on the brushed tile. |

---

## 4. Path to 8 (this lens)

1. **Make the four signature moments land:**
   - W1 without the double-take (M2), with a globe that performs (M5);
   - W2 in the right order (M3);
   - W4 with a visible sphere → Canada (M6);
   - W5 with the shrink on desktop (M7).
   These are the "unforgettable" part of the brief. Today only the tier-A first cut delivers.
2. **Make the cheap path look designed** (M1), because the target audience is on mid-range phones, which is exactly where tier B or C applies.
3. **Make touch-cut robust to half-swipes** (M4, M8) before any client sees it on a phone.

Fix M1-M4 and this lens moves to about 7.5. Fixing M5-M7 is what reaches 8.
