# Round 5 · Gate G3 · Home slice · Visual judge

Lens: visual design and wow factor (same rubric and scoring style as `judge-visual.md`), standing in for the client review. Target: DIRECTION §2 (W1-W5), §4.2-4.3 and §7.1. Audience: Canadians 30-45 on mid-range phones. Brief: wow factor, unforgettable, not clogged, modern. An 8 means award-shortlist quality with zero clutter.
Date: 2026-10-18. Read-only: I changed nothing in `site/` or `dist/`.

**What I looked at**
- The slice-1 set in `plan/round5/shots-r5/slice-1/` (`R/` below): 7 scenes and 18 mid-cut frames at 1440x900, 1280x720, 390x844 and 360x740, the splash frames, and the W1 realtime and seeked sequences.
- My own live run of the production build (`node serve.mjs dist 8351`, headless Chrome with an isolated profile, real wheel input, no film hook). I shot every scene at 1440x900 and 390x844, a frame 380 ms into every cut, and a 14-frame burst of the `#founder` → `#find` cut. The frames are in the session scratchpad under `g3/` (`L/` below).
- DOM probes on the live build: the visible `.ph` list per scene, overflow, the right-edge strip, and the `#close` row boxes.

**Build freshness (read this first).** `dist/` (built 16:30) is older than `site/index.html` (16:31) and was built while `config.FOUNDER_NAME` was still `""`. So the live build and every slice-1 shot still show `[First name]`, `[24 hours]`, `[24h]`, `[3]` and `[2]`. The source already has the owner updates ("Lee", "24 hours", "Within 24h", "Day 3", "2 spots open"). I judged the composition on the build and the copy on the source. **G3 must be re-shot on a fresh `npm run build`.**

---

## 1. Scores (this lens only)

| scene | desktop 1440 | phone 390 | one line |
|---|---|---|---|
| Splash + W1 | 6 | 6 | Elegant line draw, but the monogram is tiny (≈55 px), and the match cut pops rather than travels: the ring is still r≈50 px at screen centre at 1.0 s, and the globe limb appears at x≈1130 a frame later. |
| H1 `#hero` | 6.5 | 7 | Strong serif and a clean gold "Near You●". At rest, though, the desktop globe is a dim dust cloud with no limb and an arc about 90 px long, so the object never reads as the hero. The phone globe is denser, brighter and better. |
| H2 `#one-message` | 7.5 | 6.5 | The best idea on the page, and it lands: struck italics, then a big "One *Message*●". On desktop the upper-right ≈45% is empty and the monument stops at col 8. On phone the monument is small and a ≈300 px void sits in the middle. |
| H3 `#situations` | 7.5 | 7 | Editorial hairline quote rows, calm and adult. This is the cleanest frame of the slice. |
| H4 `#founder` | 6.5 | 5.5 | The doors, the ghost numerals and the metal field are a real step up from mustard. But the brushed tile reads as coarse horizontal streaks (corduroy, not polish), there is a dead band between the head and the doors, and up to 9 bracket placeholders sit in one frame. On phone the stacked doors fill only the top 70% and leave a gold void below. |
| H5 `#find` | 7 | 7.5 | The globe-to-Canada morph works live and the map is specific and handsome. The arc is small, and the gold→ink iris shows dark globe dots on the gold field during the cut. |
| H6 `#close` | 6 | 7 | The medallion bookend is a genuine signature, and the centred monument is the most "private bank" frame on the site. **But the "For Professionals" row has its title colliding with "[to be confirmed]"** (a visible text overlap at 1440). |
| H7 `#credits` | 5 | 6.5 | Tidy, but the top 45% of the desktop frame is empty ink, so the last impression looks bottom-heavy and unfinished. |
| **Home overall** | **6.5** | **6.5** | **6.5** (Round 5 baseline 5.5). |

How I would describe it to the jury: *"Now it has an idea, and the type is the hero. The object and the finish are not there yet."* "Clogged" is mostly fixed: one CTA per scene, hairlines instead of boxes, and no chrome litter. The site has stopped being basic in its structure. What keeps it at 6.5 rather than 8:
- the opening object is underpowered;
- there are three or four visible craft bugs: the strip, the overlap, the cut artefacts and the pop in the match cut;
- the gold metal does not yet read as metal.

---

## 2. What is good (keep)

1. **W2 "Four Searches, Struck" → "One *Message*●"** (`R/1440x900/02-one-message.png`). The idea is now a full-screen moment, as `judge-visual` §4.6 asked. The gold-dark wipes are crisp, and the italic accent with the gold stop is the brand's typographic signature.
2. **The full stop as a system.** "Near You●", "One Message●", "Herself●" and "Close to You●" all repeat it. It reads as a deliberate brand device, not decoration.
3. **The H3 quote rows** (`R/1440x900/03-situations.png`). Outline numerals, Times italic quotes, Poppins tags and arrows, with no boxes. This is the "rules and space do the work" target exactly.
4. **The H6 medallion** (`L/1440x900/06.png`). The embossed C·W disc on ink is the first object on the site that feels like a crafted luxury artefact, and it mirrors the splash as intended.
5. **The H5 dot map with the live sphere→Canada morph** (`L/burst/b03`, `b05`). The morph is legible in realtime, and "Illustration only." is quiet.
6. **The palette discipline.** Fields run ink, bone, bone, gold, ink, ink, ink. There is one gold field, and gold appears as light on ink (buttons, accents, hairlines). There are no stars on bone or gold. No blue anywhere.
7. **De-clutter.** The header has 4 marks plus the logo, every scene has one primary CTA, the `.ph` style has no fill, and the HUD, corners and floating buttons are gone. The probes found no overflow outside the intentional globe and map bleeds.
8. **The phone hero** (`L/390x844/01.png`). The globe band, the 3-line H1, the lead, a thumb-zone CTA and the link make the strongest phone frame on the site.

---

## 3. Findings (ranked by cost to wow and trust)

| # | severity | finding | evidence | file that must change | fix |
|---|---|---|---|---|---|
| V1 | **high** | **A 15 px ink strip down the right edge** of every bone and gold scene at every viewport. It also cuts the hero globe's bleed and the gold iris. `html { scrollbar-gutter: stable; background: #0B0B0C }` reserves a gutter, and the fixed `.fields` and `.scenes` measure 1425 px against a 1440 px viewport. On a full-bleed field this reads as a bug in the first two seconds. | `R/1440x900/02-one-message.png`, `04-founder.png`, `390x844/03-situations.png`; live probe: `.fields` 1425 px, `innerWidth` 1440 | `site/assets/css/base.css` (line 200) | Drop `scrollbar-gutter` in film/cut mode (`html.film { scrollbar-gutter: auto }`), or size `.fields` and `.scenes` to `100vw` / `inset: 0`, or paint `html` with the active field. |
| V2 | **high** | **H6 row text collision.** In the "For Professionals" row the title wraps to two lines inside a 160 px column, and "Professionals" runs under the meta "[to be confirmed]", which starts at x=940. | `L/1440x900/06.png`, `R/1440x900/06-close.png`; probe: `.row__title` 751-911, `.row__meta` 940-1278 | `site/assets/css/home.css` (`.closing__rows`, lines 110-112) | On wide, set the title on one line (`white-space: nowrap`) at a smaller `--fs-d3`/quote size and stack the meta under the title (like H3 on laptop-short), or give the title column `max-content`. |
| V3 | **high** | **The hero object is underpowered at rest (desktop).** After the splash the limb circle shows for about 300 ms, then the globe settles into a dim, sub-2 px dust haze. The arc is about 90 px, and the "you" node does not read. The first frame is still "headline left, faint object right". It should be the beautiful first frame §1 promises. | `L/1440x900/01.png` vs `R/w1-sequence-1440x900/realtime/f028-01243ms.png` (limb visible) and `f046-03546ms.png` (haze) | `site/assets/js/dotglobe.js` | Keep the limb as a hairline at ≈25% gold in sphere mode. Raise the point size and alpha on wide (the phone values already look right). Brighten the halo sprite. Make the "you" node and partner node about 2× with a soft glow, and lengthen the arc to span ≥ 1/3 of the diameter. |
| V4 | **high** | **Stale build: number brackets and the founder placeholder are still live.** `[First name]` ×3, `[24 hours]`, `[24h]`, `[3]` and `[2]` show in every slice-1 and live frame. They contradict the owner update and make the hero and the doors look unfinished. | `dist/assets/chunks/chunk-HK5G3GB4.js` has `FOUNDER_NAME=""`; the source `config.js` has `'Lee'` | `dist/` (orchestrator: `npm run build`), then re-shoot G3 | Rebuild and re-shoot. No source change is needed. |
| V5 | medium-high | **The W1 match cut pops instead of travelling.** The splash ring stays small (r≈50 px) at the screen centre (≈745, 452) through 1.0 s. The globe limb then appears at its own centre (≈1130, 480; r≈330) without the ring visibly scaling and translating there. The signature "ring becomes the horizon" is not perceivable at 1440. The monogram itself is ≈55 px, small for the one moment of full attention. | `R/w1-sequence-1440x900/realtime/f025-01002ms.png` → `f028-01243ms.png`; `R/1440x900/00-splash-450ms.png` | `site/assets/js/splash.js` (with `site/assets/css/visual.css` for the monogram size) | Animate the ring's `transform` from the screen centre to the globe anchor's centre and radius over 380 ms (read `[data-globe-anchor]` geometry first). Hand off on the same frame dotglobe draws its limb. Raise the splash monogram to about 96-120 px on wide. |
| V6 | medium-high | **The gold metal reads as corduroy, not polish.** The brushed tile is a coarse horizontal streak pattern at 256 px, visible as banding across the whole field and the medallion. Combined with the flat gradient it still drifts toward veneer. | `R/1440x900/04-founder.png`, `L/1440x900/04.png`; at 390 it looks finer and better | `site/assets/css/visual.css` (§4 metal field, lines 90-112) | Halve the tile scale (128 px) or regenerate it finer (`tools/gen-brushed.mjs`), drop `--metal-tile-op` to ≈0.035 on wide, and add a very soft static radial highlight (top-left, 10-12% ivory) so it reads as a lit surface. |
| V7 | medium | **Cut artefacts break the film illusion.** (a) **A box inside the iris:** every iris circle shows a lighter rectangle of the incoming scene's content box or key light, inset ≈150 px. (b) **The globe is drawn on the wrong field:** in gold→ink, the dotglobe draws dark points over the gold field outside the iris before the iris covers them. (c) The seeked gold→ink frame at 25% dims the whole gold field to mud brown. | (a) `L/1440x900/03-cut.png`, `L/burst/b01-468.jpg`; (b) `L/burst/b01-468.jpg`; (c) `R/1440x900/cut-04-05-25.png` | (a) `site/assets/css/base.css` (`.iris` and the field and key-light layers); (b) `site/assets/js/dotglobe.js`; (c) `site/assets/js/cut.js` | (a) Paint the iris with the next field's full background stack (gradient + key light) or keep the key light above the iris only after the cut. (b) Keep the globe at opacity 0 until the iris passes 60%, or clip it to the iris circle. (c) Fade the outgoing content, not the field. |
| V8 | medium | **Phone compositions leave dead voids.** On H4 the three doors fill y 200-580 of 844, leaving a ≈260 px empty gold band (the spec says each door is about 26% of the scene). On H2 a ≈300 px void separates the monument from the steps, and the monument is about 48 px rather than the 56 px spec. On H3 a ≈230 px gap sits above "See All Services". | `R/390x844/04-founder.png`, `02-one-message.png`, `03-situations.png` | `site/assets/css/home.css` (phone block) | H4: `flex: 1` on the doors so they share the height, with the open door taller. H2: centre the strikes and monument block vertically and raise the monument to 56-60 px. H3: let the rows take `--row-pitch` 72 px and sit the link right under the last row. |
| V9 | medium | **Desktop monument compositions are left-heavy.** On H2 the strikes and "One Message" both hang on cols 1-8, leaving the upper-right ≈45% empty. On H4 an ≈150 px dead band separates the head and the doors. Whitespace is good, but this reads as unplaced rather than composed. | `R/1440x900/02-one-message.png`, `04-founder.png` | `site/assets/css/home.css` | H2: push "One *Message*●" to the full `--fs-mega` (≈12vw) so it spans cols 1-11, or right-align the strike block to cols 7-12 for a diagonal read. H4: let the doors start under the head (the doors ≥ 58% of the safe height already allows it) and drop the empty band. |
| V10 | medium | **Desktop credits are bottom-heavy.** The top 45% of the frame is empty ink, so the visit ends on a void above the footer. | `R/1440x900/07-credits.png`, `L/1440x900/07.png` | `site/assets/css/base.css` (credits layout, 2b) | Vertically centre the credits block in the safe box, or place the small medallion or monogram (the splash mirror) in the upper band. |
| V11 | low-medium | **Placeholder density on H4.** Even after the rebuild, six brackets remain in one frame (`[company name]` ×2, `[#]`, `[regulator]`, `[month]`, `[$x]`). With dotted underlines on gold they still read as "unfinished" at a glance. The words must stay (compliance). | `L/1440x900/04.png` | `site/assets/css/base.css` (`.ph` on the gold field) | On `[data-field=gold]`, use `--ph-line` at ink 35% and set `.ph` at the fine-print weight, so the brackets recede into the fine line rather than sparkle. |
| V12 | low | **The H5 arc and label are small.** The "A Professional Near You" arc spans about 70 px and the label overlaps map dots. | `L/1440x900/05.png` | `site/assets/js/dotglobe.js` | Draw the arc to a node ≥ 200 px away, and give the label a 6 px ink halo (`shadowBlur` in ink) so it clears the dots. |

---

## 4. Gate verdict

**Score: 6.5 / 10 (desktop 6.5, phone 6.5).** That is +1 over the Round 5 baseline (5.5). The direction is right and should be kept. Do not open stage 4 rollout on this lens until these land:
1. **V1** (the strip), **V2** (the overlap) and **V4** (rebuild). They are cheap, and visible in the first seconds or on the last frame.
2. **V3 and V5** (the opening object and the match cut). Together they are the difference between "nice type" and "unforgettable first frame". Story and Partners inherit dotglobe and splash, so fixing them now pays three times.
3. **V6 and V7** before the gold and iris pattern is copied to Services and Partners.

**Expected after V1-V8:** about 7.5. Reaching 8 needs the founder portrait (`FOUNDER_PHOTO`) and a desktop hero object with real presence. No layout change alone gets there.
