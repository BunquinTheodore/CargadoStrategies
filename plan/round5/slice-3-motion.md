# Round 5 · Gate G3 · Home slice, round 3 · Motion judge

Lens: motion and experience. That covers the cuts, the iris, the reveals, the signature moments W1-W5, how input feels, splash pacing, touch and reduced motion. I used the rubric and scoring style of `judge-motion.md`, and I am standing in for the client review.
- **Target:** DIRECTION §2 (W1-W5), §4.4, §7.1 and §9.
- **Audience:** Canadians aged 30-45 on mid-range phones.
- **Brief:** wow factor, unforgettable, not clogged, modern.
- **Scale:** 8 means award-shortlist quality with zero clutter.

Date: 2026-10-18. This is a read-only review: I changed nothing in `site/` or `dist/`.

**What I looked at**
- **The slice-3 set** in `plan/round5/shots-r5/slice-3/` (`R/` below): scenes, 25/50/75% cut frames at 4 viewports, the splash, and the W1 realtime and seeked sequences.
- **My own live runs** of the production build (`node serve.mjs dist 8362`, now stopped). I used headless Chrome with an isolated profile, real CDP input and no film hook, with four passes:
  - desktop 1440x900 on the natural tier (A at load, sampled down to C after the first cut);
  - desktop with tier A locked;
  - phone 390x844 with touch swipes in touch-cut (B at load, then C);
  - reduced motion.
- **Frames:** in the session scratchpad under `g3m3/` (`L/` below): `out-desktop/`, `out-A/`, `out-phone/` and `out-rm/` (each with `results.json`), and the contact sheets `d-cut1.jpg`, `d-cut34.jpg`, `A-1345.jpg`, `p-1.jpg`, `cuts-1440.jpg`, `cuts-390.jpg` and `w1.jpg`.
- **The code:** `cut.js`, `iris.js`, `home-tweens.js`, `home.js`, `motion-tokens.js`, `touch-cut.js`, `splash.js`, `dotglobe.js`, and `base.css` §7-9 and `visual.css` §4.

**Caveats**
- SwiftShader stretches wall-clock time, so I quote timeline times where I have them. The touch input is synthetic, so confirm those results on a device.
- `site/index.html` (21:40) is newer than `dist/index.html` (21:37). Rebuild before the client sees it.

---

## 1. Scores (this lens only)

| beat | desktop | phone | one line |
|---|---|---|---|
| Splash + W1 opening | 8 | 7.5 | Unchanged and still the best moment on the site. The ring travels and becomes the globe's horizon, the words rise and the stop pops (`R/w1…1440x900/realtime/f014`→`f018`). The aperture completes at ≈ 1.26 s against a budget of ≤ 1.1 s. The monogram reads small (≈ 30 px at 1440). |
| Cut 1 (hero → H2) + W2 | **7.5** | 7 | **N4 fixed.** The cut now runs in 1.27 s on the timeline. Live, "One Message" rises at ≈ 0.85 s and the stop lands at ≈ 1.14 s (`L/d-cut1.jpg`). The strikes arrive inside the bone circle. The disc still sits at about 60-100 px for ≈ 250 ms before it floods (N8 carried over). On the phone the disc now starts large (N7 improved), but it rides over the scrolling hero copy. |
| Cut 2 (H2 → H3) | **8** | 7.5 | **N1 fixed.** No two headlines share a frame. "One Message" is gone before "Sounds Like" rises (`R/1440x900/cut-02-03-25/50`). |
| Cut 3 (H3 → H4) + W3 | 7 (A) / 5.5 (C) | 5.5 | **Tier A:** the gold circle is clean and has no rectangle (**N2 fixed**). New content appears only inside it, because the circle clip works (`L/A-1345.jpg` row 3). **Tier C and phone:** for ≈ 100-150 ms the screen is an **empty gold field** (`R/1440x900/cut-03-04-25.png`, `R/390x844/cut-03-04-25.png`, `L/d-cut34.jpg` 422 ms, `L/p-1.jpg` row 2 at 495 ms). A stray, unmasked **"Lee"** also floats ahead of "Three Things…". |
| Cut 4 (H4 → H5) + W4 | 7 (A) / 5.5 (C) | 5.5 | **Tier A:** the ink circle carries the sphere, and the map morph and arc land. But the circle opens as a ≈ 34 px black dot sitting on the "Plan." door for ≈ 200 ms (`L/A-1345.jpg` row 4). **Tier C and phone:** ≈ 250 ms of near-empty ink (`L/d-cut34.jpg` 372-613 ms), or empty gold on the phone (`L/p-1.jpg` row 3, 414-501 ms). Then the poster map pops in whole. The globe does not visibly come down to Canada. |
| Cut 5 (H5 → H6) + W5 | 7.5 | 7.5 | **N9 fixed.** The globe now rides the cut timeline: the map, arc and label leave, and the dots gather into the medallion (`L/A-1345.jpg` row 5, `R/1440x900/cut-05-06-50`). There is no double exposure. |
| Engine feel (input, settle, idle) | **8** | 7.5 | **N6 fixed.** A trackpad fling now moves 1 scene on tier A and on tier C. A 6-notch burst moves 1 scene. rAF is 0 by load + 10 s in all four runs. The splash does not replay on reload. |
| Touch-cut (phone) | n/a | 7 | One swipe moves one scene (7 of 7). A 180 px flick commits, which is native snap behaviour and acceptable. The tier fell to C after the first cut, so this is the path a mid-range phone takes (see M1 and M4). |
| Reduced motion | **7.5** | n/a | **N5 fixed.** The wheel scrolls freely (burst hero → one-message, fling → situations), with no splash animation and 0 rAF. |
| **Home overall** | **7.5** | **7** | **7.5 / 10** (slice 1: 6.5; slice 2: 7.0; R5 baseline: 5). |

To the jury: *"On a good laptop this is now close to shortlist craft. One statement at a time, an iris that is a clean circle, a full stop that becomes the next chapter, and the globe that ends as the medallion. The mid-range phone, which is the audience, still gets a lesser film. It shows a blank gold or ink screen for a beat between chapters, a name that pops in out of sequence, and a map that fades in rather than comes down."* The gap to 8 is the **tier C and phone path**, not the design.

---

## 2. What is good (keep)

1. **The cut is clean now** on tier A desktop (N1, N2). The entering scene is clipped to the circle, so new content only ever appears inside the new field. Same-field cuts drop the old headline before the new one rises.
2. **W2 is paced.** The strikes, the bars and the answer overlap, the stop lands at ≈ 1.1 s, and the lower frame is no longer empty for half a second.
3. **W5 is directed.** The map leaves with the cut, the dots gather into the medallion and the close statement sets. It is the bookend the direction asked for.
4. **Input is correct.** One gesture moves one scene for wheel, burst, fling and swipe. Reduced motion scrolls freely. The loops sleep by 10 s.
5. **W1** still plays as one gesture. Keep it untouched apart from M7.

---

## 3. Findings (ranked by cost to wow and trust)

| # | severity | finding | evidence | file that must change | fix |
|---|---|---|---|---|---|
| M1 | **high** | **The swap path shows an empty field.** On tier C and in touch-cut, the field switches at `in − 0.05 s` with the out group already gone. The incoming pan then fades from 0 over 0.2 s (`PAN_IN_S`, ease `none`) and its words start under masks, so for ≈ 100-250 ms the screen is bare gold or ink. On the phone the 0.35 field change and the 0.6 in-group trigger leave the same gap during the swipe. This breaks §4.4 rule 2 ("no frame shows an empty field"), and the 25% seek frames catch it. It is the path mid-range phones take. | `R/1440x900/cut-03-04-25.png`, `R/390x844/cut-03-04-25.png`, `L/d-cut34.jpg` (422 ms gold, 372-613 ms ink), `L/p-1.jpg` rows 2-3 | `site/assets/js/cut.js` (swap branch) and `site/assets/js/touch-cut.js` | **Swap:** start the in group *at* the swap (`at.in = swapAt` for swap cuts) and show the incoming pan at opacity 1 at once, so the eyebrow, the rule and the first word are already rising on the frame the field changes. **Touch-cut:** fire the scene's in group with the field change (0.35), not at 0.6, whenever the iris swaps. |
| M2 | **high** | **The founder's name breaks the word reveal.** `home.js` sets `el.textContent = FOUNDER_NAME` on `[data-founder-name]`. That wipes the build-time `.rv-mask/.rv-word` spans inside the H4 headline, so "Lee" has no mask: it fades in with the pan, ahead of "Three Things", floating above the baseline. A ghost "Lee" sits alone on an empty field in tier C frames. | `L/d-cut34.jpg` 469-675 ms, `L/A-1345.jpg` 1077-1212 ms, `L/p-1.jpg` row 2 (495-533 ms) | `site/assets/js/home.js` (founder-name fill, ≈ line 32) | Inside a split heading, write the name into the first `.rv-word` and remove the second mask (`[First` / `name]` → `Lee`). Only fall back to `textContent` where the element holds no `.rv-word`. Alternatively, substitute `FOUNDER_NAME` at build time before `build-splits.mjs` runs. |
| M3 | medium | **Centre irises start as a dot** (slice-2 N8, still open). With `expo.inOut` from scale 0.02, the circle sits as a ≈ 30 px dot for 150-250 ms (on the "Plan." door in cut 4, mid-rows in cut 3) before it floods. It reads like a stray speck or loading spinner, not a chapter cut. | `L/A-1345.jpg` row 4 (239-469 ms), row 3 (448-504 ms); `L/d-cut1.jpg` 308-541 ms | `site/assets/js/motion-tokens.js` (`EASE.iris`) | Use `power3.inOut` for the iris, or `expo.out` for stop-origin and pin-origin irises, and start centre irises at scale ≈ 0.06 so the first visible frame is already a shape. |
| M4 | medium (confirm on device) | **W4 is lost on the phone.** After one janky sample the tier falls to C (both the desktop and phone runs). There, "The Globe Comes Down to Canada" is a hard field swap plus a poster map that pops in whole. The audience device never sees the second signature moment. | `L/out-phone/results.json` (tier B → C after cut 1), `L/p-1.jpg` row 3 | `site/assets/js/tier.js` (with `site/assets/js/dotglobe.js`) | Do not let one cut's frame times decide the tier: require ≥ 2 bad samples outside a cut. On tier C, play a cheap morph anyway: the 520-point subset at DPR 1, a 600 ms morph and no halo. That costs one canvas, and it is the moment the page is about. |
| M5 | low-medium | **The W3 metal sheen is still not perceptible.** It exists only on the iris `::after` during the cut (tier A), and tier C hides it. In no frame of any run does a band visibly cross the gold. | `L/A-1345.jpg` rows 3-4, `R/1440x900/04-founder.png` | `site/assets/css/visual.css` §4 (with the layer that tweens `--sheen-x`) | Run one 1.2 s sweep on `.fields[data-field="gold"]` on the founder `landed` event, with a band of ≈ 18% ivory, on tiers A and B. |
| M6 | low | **On the phone, W4's label touches the eyebrow.** "A Professional Near You" sits directly on "ACROSS CANADA" at rest and mid-cut. | `R/390x844/05-find.png`, `L/p-1.jpg` row 3 | `site/assets/js/dotglobe.js` (label placement) | Keep the label inside the map band: clamp its y to the anchor box minus 24 px, or flip it above the node when it would cross the text column. |
| M7 | low | **The splash runs ≈ 0.16 s long.** The aperture completes at ≈ 1.26 s against "≤ 1.1 s". `MATCH_AT_MS` (700) and `MATCH_MS` (380) are unchanged since slice 2. | `R/w1-sequence-1440x900/realtime/f012`→`f016` | `site/assets/js/splash.js` | `MATCH_AT_MS` 700 → 560 and `MATCH_MS` 380 → 340. |
| M8 | low | **The phone's first cut covers copy mid-read.** In touch-cut the bone disc rides the scrolling hero, over the lead and CTA, for ≈ 200 ms. It is better than slice 2's lone dot, but it still looks like a blob over text. | `L/p-1.jpg` row 1 (198-450 ms) | `site/assets/js/touch-cut.js` | Fade the hero pan to ≤ 20% before the disc passes 25% of the screen, or pin the disc to the stop's captured rect until it reaches 30% scale. |

---

## 4. Path to 8 (this lens)

1. **M1 and M2:** no empty frame and no stray word on the cheap path. A juror or the client on a mid-range phone must never see a blank gold screen or a lone "Lee".
2. **M3:** make every iris read as a cut from its first frame.
3. **M4:** the phone gets W4. Without it, the page has one signature moment on the audience device instead of four.

With M1-M3 fixed, desktop reaches 8. M4 brings the phone to about 8 as well. M5-M8 are polish.
