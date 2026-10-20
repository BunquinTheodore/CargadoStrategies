# Round 5 · Gate G3 · Home slice, round 2 · Motion judge

Lens: motion and experience: cuts, the iris, reveals, signature moments W1-W5, input feel, splash pacing, touch and reduced motion. I used the rubric and scoring style of `judge-motion.md`, and I am standing in for the client review.
- **Target:** DIRECTION §2 (W1-W5), §4.4, §7.1 and §9.
- **Audience:** Canadians aged 30-45 on mid-range phones.
- **Brief:** wow factor, unforgettable, not clogged, modern.
- **Scale:** 8 means award-shortlist quality with zero clutter.

Date: 2026-10-18. This was a read-only review: I changed nothing in `site/` or `dist/`.

**What I looked at**
- **The slice-2 set** in `plan/round5/shots-r5/slice-2/` (`R/` below): scenes, 25/50/75% cut frames at 4 viewports, the splash frames, and the W1 realtime and seeked sequences. `dist/` (built 19:56) is newer than every Home source file, so it is current.
- **My own live runs** of the production build (`node serve.mjs dist 8357`, now stopped). I used headless Chrome with an isolated profile, **real CDP input** and no film hook, with four passes:
  - desktop 1440x900 on the natural tier (A at load, sampled down to C after the first cut);
  - desktop with **tier A locked**;
  - phone 390x844 with touch swipes, a coarse pointer and touch-cut, including 2 short aborted swipes (180 px);
  - reduced motion.
  
  I also took one hooked seek pass on tier A at 0.31-0.65 s, the window between the 25% and 50% frames of the shoot.
- **Frames:** the session scratchpad holds these under `g3m2/` (`L/` below):
  - `out-desktop/`, `out-A/`, `out-phone/` and `out-rm/`, each with `results.json`;
  - `seekA/`;
  - contact sheets `d-cut*.jpg`, `A-345.jpg`, `p-*.jpg`, `rm.jpg` and `seekA.jpg`.
- **The motion code:** `cut.js`, `home-tweens.js`, `motion-tokens.js`, `splash.js`, `tier.js`, `dotglobe.js`, and `base.css` §7 and `visual.css` §4 (iris paint).
- **Caveats:** SwiftShader stretches wall-clock time under load, so I use timeline times where I have them and do not use frame times. The touch swipes are synthetic. Both are marked "confirm on device".

---

## 1. Scores (this lens only)

| beat | desktop | phone | one line |
|---|---|---|---|
| Splash + W1 opening | **8** | 7.5 | **Fixed.** The C draws, the W draws, the ring travels and grows into the globe's horizon (`R/w1…1440x900/realtime/f015`→`f019`). The words rise through it (`f020`→`f023`) and the stop pops last (`f024`, 2.06 s). There is no double-take any more. The arc is now a long chord with a travelling head, plays twice and rests (`f027`→`f041`). The splash is ≈ 0.35 s over the ≤ 1.1 s budget. |
| Cut 1 (hero → H2) + W2 | 7 | 6.5 | The order is right now: the lines arrive, are struck (0.72-1.03 s live), and only then "One Message" rises (1.13-1.30 s) and the stop pops (≈ 1.50 s). But the cut takes **1.68 s** (timeline total, `R/…/first-cut-seeked/100` at t = 1680), and the bottom two-thirds of the screen is empty bone for ≈ 450 ms. On the phone the swell starts as a lone dot on an emptied black screen. |
| Cut 2 (H2 → H3) | 6.5 | 7 | A same-field cut. At 0.36-0.41 s "Sounds Like" rises **through** "One Message" and the struck lines, both at about 50% (`L/seekA/seek-12-38`, `-43`). |
| Cut 3 (H3 → H4) + W3 | 6 | 6 | The deal-in is still lovely. **On tier A the gold iris has a hard, lighter rectangle inside it** (`L/out-A/cut-3/009-00923ms.jpg`, `L/seekA/seek-23-36`). The incoming headline "Three Things Lee…" paints on the bone *outside* the disc, over "Sounds Like You?" and the rows (`seek-23-27`, `-31`). Tier C is a pale double exposure (`L/d-cut3.jpg` 344-386 ms). There is still no visible sheen. |
| Cut 4 (H4 → H5) + W4 | 7 (A) / 5.5 (C) | 5.5 | **Tier A now delivers W4**: the ink iris arrives with the sphere already inside it (`L/out-A/cut-4/004-00770ms.jpg`), the points morph into Canada, and the arc and the "A Professional Near You" label land (`011-01753ms.jpg`). Tier C, which is what the phone got, still drains gold to an **empty olive-brown frame** (`L/d-cut4.jpg` 439 ms, `L/p-cut45.jpg` 277-394 ms), then a poster map. |
| Cut 5 (H5 → H6) + W5 | 6 | 6.5 | The dots now gather at the medallion before it fades up (`L/out-A/cut-5/006`, `007`). But the close statement rises **on top of** the still-visible "Need Someone We Don't Do Ourselves?" (`007-00795ms.jpg`). |
| Engine feel (input, settle, idle) | 7.5 | 7 | A 6-notch burst moves exactly 1 scene (both runs). The tier C fling moved 1, but the **tier A fling moved 2** (find → credits). Same-field cuts settle by ≈ 1.0 s. rAF was 97/s at ≈ 8.3 s after navigation and 0 by ≈ 12 s. |
| Touch-cut (phone) | n/a | 7 | **Fixed.** An aborted swipe on the hero snaps back with no iris (`L/out-phone/partial-0`). A 180 px swipe from H2 committed to H3 (native snap) and showed ≈ 100 ms of near-empty bone (`partial-1/018`-`021`). |
| Reduced motion | 5.5 | n/a | Flow mode, no splash animation, 0 rAF. But **every single wheel notch snaps back to `#hero`** (6 of 6), and even the 6-notch burst ended on `#hero`. Only the long fling moved. |
| **Home overall** | **7** | **6.5** | **7.0 / 10** (slice 1 was 6.5; the R5 baseline was 5). |

How I would put it to the jury: *"The opening is now award-grade: the monogram's ring becomes the globe's horizon and the headline rises through it. W2 tells its story in the right order, and on a good device the globe really does come down to Canada. But the cut itself is not clean yet. For about 150 ms of every cut the old and new headlines are on screen together, the gold iris shows a rectangle, and the cheap tier still drains gold to brown."* The wow is now real at the top of the page. **The craft of the cut** is the gap from 7 to 8.

---

## 2. What is good (keep)

1. **W1 is the best 2 seconds on the site.** The draw, the match cut, the aperture becoming the horizon, the word rise, the stop pop and an arc with a travelling head play as one gesture (`R/w1-sequence-1440x900/realtime/f012`→`f041`).
   - The landing no longer re-plays: the stop is never seen and then lost.
   - The arc spans about ⅓ of the diameter, plays twice, then the globe rests.
2. **W2 answers after it asks.** The 'struck' label in `home-tweens.js` holds the monument until the last bar. Phones drop one line and keep the rhythm (`L/p-cut1.jpg`).
3. **W4 on tier A.** The sphere is inside the ink iris, then it morphs and the arc and label land. This is the page's second signature moment, and for the first time it reads.
4. **The tier-A first cut.** The stop still swells into the bone circle with the strikes arriving inside it (`R/…/first-cut-seeked/020`→`040`).
5. **The fixed regressions stay fixed:**
   - the right-edge strip is gone (iris circles reach the edge);
   - an aborted swipe on the phone hero fires no iris;
   - the splash plays once per session (no `#splash` on reload);
   - there is no decode, no streaks, no tilt and no ticks.
6. **The W3 deal-in** (±48 px, ±12° landing flat, 70 ms apart; y only on phones) and the **same-field pace** (settled ≈ 1.0 s).

---

## 3. Findings (ranked by cost to wow and trust)

| # | severity | finding | evidence | file that must change | fix |
|---|---|---|---|---|---|
| N1 | **high** | **Double exposure in every non-crossfade cut.** `OUT_HOLD_S = 0.45` keeps the outgoing pan above 50% opacity until about 0.31 s, but the incoming pan fades in over 0.2 s from 0.30 s and its words rise fast (`expo.out`). For about 0.30-0.45 s, two headlines therefore share the frame in the same layout slot. On iris cuts the entering scene sits *above* `.iris` (`.scene.is-entering { z-index: --z-iris + 1 }`), so the new text also paints on the old field outside the disc. This was the side effect of the slice-1 "no empty field" fix. | `L/seekA/seek-12-38-361ms`, `seek-12-43-409ms` (Sounds Like through One Message); `seek-23-27-351ms`, `seek-23-31-403ms` ("Three Things Lee" and its eyebrow over "Sounds Like You?" on bone); `L/out-A/cut-5/007-00795ms.jpg` (close statement over the find headline) | `site/assets/js/cut.js` | 1. **Same-field cuts:** let the out group reach opacity 0 by 'in' (0.30 s, `power2.in`), and pass the 2% seek-test from the incoming eyebrow and rule, which already start at 'in'. Do not hold the old headline.<br>2. **Iris cuts:** clip the entering scene to the iris circle for the length of the iris (`clip-path: circle(r at x y)` on the entering `.scene`, driven by the same tween as `irisTo`), so new content only ever appears *inside* the new field. Drop the clip at 'settled'. |
| N2 | **high** | **The gold iris shows a rectangle.** In `.iris`, the gradient is `background-size: 100vw 100svh; no-repeat` inside a circle `2 × 100vmax` wide. While the circle is scaled, the gradient is a viewport-sized rectangle floating in flat `--bg` gold. Slice-1 V7a is still open. It is most visible on gold, and it also applies to the ink `--lamp`. | `L/out-A/cut-3/009-00923ms.jpg` (rect 620×387 px at scale ≈ 0.43), `L/seekA/seek-23-31`, `seek-23-36` | `site/assets/css/base.css` §7 (`.iris`; keep visual.css's `--metal-key` layer) | Paint the gradient across the whole circle: `.iris { background-size: 100% 100%; background-position: 0 0; }`, with the gold `::before` tile `inset: 0` (already the case). Alternatively, set `background-color` to the gradient's mid stop and extend the gradient to `calc(2 * var(--iris-r))`. The `.fields` layer takes over at landing, so the small difference at scale 1 is never seen. |
| N3 | **high** | **The tier C crossfade still passes through empty mud.** Gold → ink blends through olive-brown with no content (desktop 333-439 ms; phone 277-394 ms). Bone → gold shows ≈ 100 ms of pale gold with ghosted rows and a ghost "Lee" (`L/d-cut3.jpg` 344-386 ms; phone 296-392 ms). **The phone run landed on tier C**, so this is the path a mid-range phone takes after one janky sample. Slice-1 M1 and visual V7c are only half done. | `L/d-cut4.jpg` row 2, `L/p-cut45.jpg` rows 1 and 3 | `site/assets/js/iris.js` (fade path) with `site/assets/js/cut.js` (`FADE_LEAD_S`) | Do not blend two opaque fields through each other, because a blend of gold and ink is brown. On tier C, either: (a) keep a single DOM circle `transform: scale` iris, which is compositor-only and cheap, with no gradient on tier C (flat `--bg`); or (b) switch `.fields` hard at 'in' − 0.05 s under the out group, while the outgoing content is ≤ 20%, and start the in group at once. Either way, no frame shows an empty field or a mixed colour. |
| N4 | medium-high | **The first cut is too long.** Timeline total is 1.68 s, the live tier-A landing was at about 1.6-1.75 s, and the input stays locked until about 1.18 s (`lockAt` 0.7). The lower two-thirds of the screen is empty bone from ≈ 0.65 s to 1.13 s while the bars wipe. §4.4 says settled ≤ 1.0 s, and W2 says ≤ 1.4 s. This is the most-seen cut on the site. | `R/…/first-cut-seeked/060`-`100` (t = 1008-1680), `L/d-cut1.jpg` | `site/assets/js/home-tweens.js` (`STRIKE`, `ANSWER`) | Overlap the beats: `barAfter` 0.32 → 0.16, `bar` 0.18 → 0.14, `barStagger` 0.07 → 0.05. Start the answer at `struck-=0.12`, and the steps with the answer's second word. Target total ≤ 1.3 s. The monument then starts rising while the last bar wipes, which also fills the empty lower frame. |
| N5 | medium (confirm on device) | **Reduced motion: the wheel cannot leave the hero.** `html.rm` on fine pointers uses `proximity` snap, but with `scroll-snap-stop: always` a 100 px notch, and even a 6-notch burst at 50 ms, settles back on `#hero` (6/6 single notches, `burst: hero → hero`). Only a 30-event fling moved. Slice-1 M10 is unresolved. | `L/out-rm/cut-1…cut-6` (each scrolls ≈ 100 px, back at the top within ≈ 230 ms), `L/out-rm/results.json` | `site/assets/css/base.css` (lines 395-414) | `@media (pointer: fine) { html.rm { scroll-snap-type: none; } html.rm .scene { scroll-snap-stop: normal; } }`. Reduced motion should mean "nothing moves by itself", not "the page resists you". |
| N6 | medium (confirm on a real trackpad) | **A trackpad fling can move two scenes on tier A.** The same 30-event decaying stream moved 1 scene on tier C and 2 on tier A (find → close → credits). The decaying tail outlives 70% of a ≈ 0.95 s cut and queues a second step. | `L/out-A/results.json` (`fling: find → credits`), `L/out-desktop/results.json` (`find → close`) | `site/assets/js/film.js` (wheel intent / momentum lock, R4 A3-A6) | Treat a wheel stream as one gesture until a ≥ 180 ms gap or a rising |delta|. Never queue a step from a decaying tail. Only a fresh gesture after 70% may queue. |
| N7 | medium | **Phone first cut: a lone white dot on an emptied black screen.** The hero content fades at once in touch-cut, and the swell disc then grows from mid-screen. The stop has already scrolled off, so the disc is not on it. For ≈ 200 ms (300-430 ms) the screen is near-black with a small dot, which reads like a loading indicator. | `L/p-cut1.jpg` frames 012-020 | `site/assets/js/touch-cut.js` | Capture the stop's rect on `touchstart` and translate the disc with the section, or start the disc at scale ≈ 0.15 so it reads as the stop growing. Keep the hero pan at ≥ 40% until the disc covers 30% of the screen. |
| N8 | low-medium | **The iris ease still hesitates** (slice-1 M11 carried over). On the tier-A live cut 1 the disc sits at about 60 px from 300 to 450 ms, then floods in ≈ 100 ms. The swell reads as "pause, flash" rather than "pop, swell". | `L/d-cut1.jpg` 006-012 | `site/assets/js/motion-tokens.js` (`EASE.iris`) | `power3.inOut`, or `expo.out` for stop-origin irises. Keep `expo.inOut` for centre-origin irises only. |
| N9 | low | **W5: the map's arc and label are not taken out.** The globe is not on the cut timeline. In a seeked frame at 0.645 s the map, its arc and "A Professional Near You" sit on top of the close's "Questions Everyone Asks First →" link. Realtime looks better, but neither the seek test nor T5 can verify W5. | `L/seekA/seek-45-43-645ms.jpg` | `site/assets/js/dotglobe.js` | Fade the label and arc at the cut's 'out' label (0.2 s), and drive the `medallion` shrink from the cut timeline (`tl.add(...)` in the `cut` listener), so it seeks with everything else. |
| N10 | low | **Idle stop is borderline.** rAF was 97/s at ≈ 8.3 s after navigation. The hero landed at ≈ 2.0 s and the second arc ended at ≈ 4.3 s. rAF was 0 by ≈ 12 s. §2 counts 5 s from the landing or the last input, not from the last arc. | `L/out-desktop/results.json` (`rafPerSecAtLoadPlus6: 97`, `…Plus10: 0`) | `site/assets/js/dotglobe.js` | Start the 5 s idle clock at the landing and finish both arc plays inside it (they do: ≈ 2.3 s). Then stop the ticker. Confirm with `tools/perf-gate.mjs`. |
| N11 | low | **The W3 metal sheen is still not perceptible** in any tier A or tier C frame of cut 3. | `L/A-345.jpg` row 2, `L/d-cut3.jpg` | `site/assets/js/home.js` (founder landing hook) with `site/assets/css/visual.css` | The same fix as slice-1 M13: one 1.2 s sweep on the `founder` `landed` event, with a band of ≈ 18% ivory. |
| N12 | low | **The splash runs ≈ 0.35 s long.** The mark starts at ≈ 0.28 s, then `MATCH_AT_MS` 700 + 380 + 80, so the aperture completes at ≈ 1.45 s against "≤ 1.1 s". | `R/w1-sequence-1440x900/realtime/f002`→`f019` | `site/assets/js/splash.js` | `MATCH_AT_MS` 700 → 560 (start the match cut as the sheen starts), `MATCH_MS` 380 → 340. |

---

## 4. Path to 8 (this lens)

1. **Make every cut clean** (N1, N2, N3). This is now the whole gap. One headline at a time, new content only inside the new field, an iris with no rectangle in it, and no brown frames on the cheap tier. A juror scrubbing the recording frame by frame must never find two statements overlapping.
2. **Tighten the first cut to ≤ 1.3 s** (N4). It is the cut every visitor sees.
3. **Make reduced motion and trackpads behave** (N5, N6) before the client tries it on their own laptop.

Fix N1-N4 and this lens reaches about 8 on desktop. N5-N7 bring the phone and accessibility paths up to the same level.
