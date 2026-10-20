# Round 5 · Gate G3 · Home slice, round 2 · Visual judge

Lens: visual design and wow factor. I used the same rubric and scoring style as `judge-visual.md` and stood in for the client review. Target: DIRECTION §2 (W1 to W5), §4.2 to 4.3 and §7.1. Audience: Canadians aged 30 to 45 on mid-range phones. Brief: wow factor, unforgettable, not clogged, modern. An 8 means award-shortlist quality with zero clutter.
Date: 2026-10-18. This was a read-only review: I changed nothing in `site/` or `dist/`.

**What I looked at**
- The slice-2 set in `plan/round5/shots-r5/slice-2/` (`S2/` below). It covers 7 scenes and 18 mid-cut frames at 1440x900, 1280x720, 390x844 and 360x740, the splash frames, and the W1 realtime and seeked sequences (74 frames at 1440 and 153 at 390).
- **Build freshness.** `dist/` was built at 19:56:30, and no file in `site/` is newer. The copy now shows the owner updates: "Lee", "Replies within 24 hours", "Within 24h" and "Day 3".
- My own live run of that build:
  - Setup: `node serve.mjs dist 8356` and headless Chrome with an isolated profile. The engine reported `data-tier="A"`.
  - Input was a real wheel with no film hook. I shot every scene at rest 2.9 s after each wheel notch, plus frames at 300 ms and 550 ms into every cut.
  - I also recorded a 48-frame screencast burst of the `#founder` → `#find` cut.
  - These frames are in the session scratchpad under `g3s2/out/` (`L/` below).
- DOM geometry probes on the live build at 1440x900 and 390x844: `scrollWidth` against `innerWidth`, the header background, the visible `.ph` list per scene, and the boxes of the ghost numerals, quotes, strikes, monument and credits.

---

## 1. Scores (this lens only)

| scene | desktop 1440 | phone 390 | one line |
|---|---|---|---|
| Splash + W1 | 7.5 | 7 | **Fixed.** The monogram is now about 115 px, and the C ring visibly travels: at 1.22 s it is r≈110 at (808, 455), at 1.33 s r≈310 at (1140, 478), and at 1.53 s it lands as the limb. For one frame there is a double circle (ring r≈310 against limb r≈330, 35 px apart). |
| H1 `#hero` | 8 | 7.5 | **This is now the beautiful first frame.** The globe has a gold limb, a warm halo, fine points, white "people" specks and an arc spanning about 1/3 of the diameter, with glowing end nodes (`L/1440x900/01.png`). The phone globe is a dense, glowing sphere. One caveat: the immediate-seek render (`S2/1440x900/01-hero.png`) is coarse, sparse and has no halo (see V6). |
| H2 `#one-message` | 7 | 6.5 | The diagonal read (strikes top-right, monument bottom-left) is better. But the strikes start 15 px under the header, a 274 px void sits in the middle, the monument's glyphs end at x≈915 of a 1368 box, and the step captions sit 22 px off the bottom edge. On phone, two 177 px voids frame a 60 px monument. |
| H3 `#situations` | 7.5 | 7.5 | Unchanged and still the calmest, most adult frame. |
| H4 `#founder` | 7 | 6.5 | The metal is much finer (polish, not corduroy), only 3 brackets remain, and the doors fill the bottom. But the ghost numerals now **collide with the quotes** ("Where Does **My**" over the 2, "Am I **Doing**" over the 3). The header is a flat band with a hard edge on the brushed field. On phone, 217 px of empty gold sits above the head. |
| H5 `#find` | 6.5 | 7 | The map is handsome at rest. But in realtime the **W4 globe→Canada morph cannot be seen**: the gold field dims to mud brown with no iris, and the map is already fully formed under the dim. The "A Professional Near You" label is gone, and the arc is still about 75 px. |
| H6 `#close` | 8 | 7.5 | **Fixed.** The rows are clean, with no overlap. The medallion bookend and the centred statement are the most "private bank" frame on the site. |
| H7 `#credits` | 6.5 | 6.5 | **Fixed.** The block is centred (content 306 to 639 of 900). It is still just a footer on an empty field. On phone, the "[company email]" icon label wraps to 2 lines and breaks the 4-icon row. |
| **Home overall** | **7** | **7** | **7.0** (slice 1: 6.5; Round 5 baseline: 5.5). |

How I would describe it to the jury: *"The opening now earns its place: the ring becomes the planet, and the planet is beautiful. After that, the middle of the film still has seams."*

"Clogged" is solved:
- one CTA per scene;
- hairlines, not boxes;
- 3 placeholders on H4, none elsewhere except the footer email;
- no strip (`scrollWidth` 1440 = `innerWidth` 1440; `S2/index.md` confirms the last pixel column matches the field at all four viewports).

What keeps it at 7 rather than 8:
1. The second signature moment, W4, is not visible.
2. One new collision: the H4 ghost numerals over the quotes.
3. The header band on gold.
4. H2 still reads as placed rather than composed.
5. The founder portrait is still absent. That is content, not layout, but no layout fix gets to 8 without it.

---

## 2. Closed since slice 1 (verified)

| slice-1 | status | evidence |
|---|---|---|
| V1 right-edge strip | **closed** | live probe `scrollWidth` = `innerWidth` = 1440; `S2/index.md` pixel check at 4 viewports |
| V2 H6 row collision | **closed** | `S2/1440x900/06-close.png`, `L/1440x900/06.png`: titles on one line, meta under them |
| V3 hero object underpowered | **closed in realtime** | `L/1440x900/01.png`, `S2/w1-sequence-1440x900/realtime/f036-03541ms.png` (but see V6) |
| V4 stale build | **closed** | "Lee", "Replies within 24 hours", "Within 24h", "Day 3" are all live |
| V5 match cut pops | **closed** | `S2/w1-…/realtime/f013-01096ms` → `f015-01220ms` → `f017-01328ms` → `f019-01529ms` |
| V6 metal reads as corduroy | **closed** | `S2/1440x900/04-founder.png`: fine brushing, soft highlight bottom-right |
| V8 phone H4 doors in top 70% | **partly** | the doors now run to y≈808; the void moved to the top (217 px), see V7 |
| V10 credits bottom-heavy | **closed** | content 306 to 639 of 900 |
| V11 placeholder density on H4 | **closed** | the live `.ph` list on H4 is `[company name]`, `[#]`, `[regulator]` only |
| V7 cut artefacts | **open, changed** | see V1 and V2 below |
| V9 H2 left-heavy | **partly** | the diagonal is better; the void and edge crowding remain (V4 below) |
| V12 H5 arc small | **open** | arc ≈75 px; the label is now missing (V2) |

---

## 3. Findings (ranked by cost to wow and trust)

| # | severity | finding | evidence | file that must change | fix |
|---|---|---|---|---|---|
| V1 | **high** | **The gold→ink cut (H4→H5) is a mud dissolve, not an iris.** On tier A with a wheel cut there is no circle edge in any frame. The whole gold field dims evenly to a brown (≈#7A6535 at 458 ms), then to brown-black (520 ms), before ink settles. The header flips from gold to ink at about 520 ms while the field is still brown, so it pops. This is the most visible seam left in the film. | `L/burst/b11-342.jpg` (dimming), `b14-458.jpg` (mud, no edge), `b17-520.jpg` (header already ink, field brown); `S2/1440x900/cut-04-05-25.png`; `S2/390x844/cut-04-05-25.png` | `site/assets/js/cut.js` (with `site/assets/js/iris.js` for the circle) | Run the centre-origin ink circle for gold→ink as for the other field changes (circle from the door used, else the centre). Fade the outgoing content to 0 by the `iris` label rather than dimming the field. Switch the header field on the iris's `onHalf`, not at the end of the cut. |
| V2 | **high** | **The W4 signature cannot be seen, and its label is missing.** The map is already fully formed under the dim at 458 to 520 ms, so the 900 ms sphere→Canada morph plays while it is covered. The visitor sees a map appear, not a globe come down to Canada. "A Professional Near You" (`LABEL_NEAR`, `dotglobe.js:90`) is not drawn in any live or slice-2 frame at rest. The arc is still about 75 px (908,673 → 982,693). | `L/1440x900/cut-05-300.png` (map complete at 300 ms), `L/1440x900/05.png`, `S2/1440x900/05-find.png`, `S2/1280x720/05-find.png` | `site/assets/js/dotglobe.js` (`applyMode` / `mapMode`, lines 409-466) | When arriving from hidden behind an iris, show the sphere at full alpha first, then start the morph only after the iris passes ≈60% (`start.at + MAP_HOLD_S` should land on ink, not under the dim), so the 900 ms morph happens in view. Restore the label draw (6 px ink halo). Pick the arc's target node ≥ 200 px away (`NEAR_MIN_KM` on the projected map, not km). |
| V3 | **high** | **The H4 ghost numerals collide with the door quotes** at 1440 and at 1280x720. Ghost boxes span 331-662 and the quotes 594-690, and they overlap horizontally (ghost 1 at 314-504, quote 1 at 101-475). The 14% ink glyphs sit behind "My", "Doing" and "Covered?", which makes the most important copy on the gold field look misprinted, a regression of the B11 kind. | `S2/1440x900/04-founder.png`, `S2/1280x720/04-founder.png` (the "2" under "Where Does My"); probe: `.ghost` [746,331,936,662], `.door__q` [534,594,907,690] | `site/assets/css/home.css` (`.founder__doors .ghost`, line 90) | Anchor the ghost to the top of the door and cap it so its baseline clears the title: `top: 0; font-size: min(var(--fs-ghost), 30svh)`. Or drop it to 8% ink and put it behind the title only, never the quote. The numeral should frame the door, not underline the copy. |
| V4 | medium | **H2 desktop composition is still unplaced.** The strikes start at y=77, 15 px under the header (bottom 62). A 274 px void separates the strikes (bottom 296) from the monument (top 570). The monument's glyphs end at x≈915 of a 1368 box. The step captions end at 878 of 900. At 1280x720 the 2×2 strikes sit right under the header and the captions are 18 px off the bottom. | `S2/1440x900/02-one-message.png`, `S2/1280x720/02-one-message.png`; probe: `.one__strike` [734,77,1272,296], `.one__title` [72,570,1368,709] at 151 px | `site/assets/css/home.css` (`.one__strike`, `.one__title`, lines 50-63 and 164-165) | Give the scene the safe-box top inset that the other scenes use (eyebrow ≥ 120 px at 1440). Raise the monument to the full `--fs-mega` (≈12vw, so it spans cols 1-11) and move it up to close the void. Keep the steps' last baseline ≥ 48 px off the bottom edge. |
| V5 | medium | **The header is a flat band on the gold field.** The header paints `--hdr-bg-solid` `rgba(201,162,74,.96)` (the live probe reads that value, with `backdrop-filter: none`). That leaves a smooth, darker strip with a hard edge at y=62 over the brushed metal. It is most visible in the bone→gold cut, where the field is pale and the header is not. | `S2/1440x900/04-founder.png`, `S2/390x844/04-founder.png`, `L/1440x900/cut-04-300.png` | `site/assets/css/base.css` (gold header tokens, line 194; `.site-header`, lines 430-432) | In film mode nothing scrolls under the header, so on `[data-field="gold"]` make the header transparent, or paint it with the same metal stack (`background-attachment: fixed` against the field). Keep the solid token for flow mode only. |
| V6 | medium | **The immediate-seek globe render is coarse.** When the hero is landed with `goTo(…, {immediate:true})`, the path a deep link, a back navigation or a resize can take, the globe shows larger, sparser dots with no halo and no stars. That is a different and cheaper-looking object than the realtime hero. | `S2/1440x900/01-hero.png` against `L/1440x900/01.png` and `S2/w1-…/realtime/f036-03541ms.png` | `site/assets/js/dotglobe.js` (`snapTo` path, `onBuild` line 485) | Make `snapTo` apply the same point size, alpha, halo sprite and limb values as the settled realtime state. Check by landing `#hero` from a deep link. |
| V7 | medium | **Phone compositions still have dead bands.** On H4 there are 217 px of empty gold between the header and the eyebrow (62 → 279) while the doors run to 808. On H2 two 177 px voids sit above and below the 60 px monument (217 → 394 and 450 → 627). | `S2/390x844/04-founder.png`, `02-one-message.png`; probe at 390 | `site/assets/css/home.css` (phone block, lines 192-226) | H4: start the head at the safe-box top and let the open door take the extra height (`flex: 1` on the open door). H2: tighten into one centred group, with the strikes 32 px above the monument and the steps 48 px below it. |
| V8 | low | **A double circle at the W1 handoff.** For about one frame the splash ring (r≈310, centre 1140,478) and the dotglobe limb (r≈330, centre 1175,480) are both visible. | `S2/w1-sequence-1440x900/realtime/f017-01328ms.png` | `site/assets/js/splash.js` | Tween the ring to the measured anchor centre and radius exactly (read `[data-globe-anchor]` after layout), and fade the ring out on the frame the limb reaches alpha 1. |
| V9 | low | **At 360x740 the hero globe is small and the eyebrow wraps.** The globe is ≈105 px (29vw against the 72vw spec), and "Free Introductions · Across Canada" wraps to 2 lines right under the globe. | `S2/360x740/01-hero.png` | `site/assets/css/home.css` (phone hero) | Let the globe take `min(72vw, 30svh)` and drop the eyebrow tracking a step at ≤ 360 px so it holds one line. |
| V10 | low | **The phone credits icon row breaks.** "[company email]" wraps to 2 lines, so the 4 icon labels no longer share a baseline. The placeholder must stay. | `S2/390x844/07-credits.png` | `site/assets/css/base.css` (credits / `.site-footer__icons`) | Use `white-space: nowrap` with a 2×2 grid at ≤ 400 px, or label the icon "Email" and keep `[company email]` in the link's accessible name and the sheet. |

---

## 4. Gate verdict

**Score: 7 / 10 (desktop 7, phone 7).** That is +0.5 over slice 1 and +1.5 over the Round 5 baseline. The opening (W1 plus H1) is now award-grade on desktop. Keep it exactly as it is and propagate it.

Before rollout copies this pattern to Services and Partners (which inherit dotglobe, iris and the gold field):
1. Fix **V1 and V2** together: the gold→ink iris and a visible globe→Canada morph with its label. W4 is the second of the five signatures, and right now it does not exist on screen.
2. Fix **V3** (the ghosts over the quotes) and **V5** (the header band on gold). Both are cheap and seen at rest.
3. Fix **V4, V6 and V7** next.

**Expected after V1 to V7:** about 7.5 to 7.8. Reaching **8** still needs:
- the founder portrait (`FOUNDER_PHOTO`, the 40 px avatar plus a real face somewhere on Home);
- H2's monument at full mega scale, so the page has one more moment of real scale contrast between the hero and the close.
