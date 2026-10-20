# Round 5 · Gate G3 · Home slice review (summary)

Gate G3 stood in for the client review (owner question O6). Four read-only judges re-scored **Home only** with the `judge-visual`, `judge-motion`, `judge-ux-conversion` and `judge-typography` rubrics, at 1440x900, 1280x720, 390x844 and 360x740, plus recordings. The gate asks for **≥ 8 on every lens**. `build-order.md` allows at most 2 fix loops, then the gaps are recorded here and stage 4 proceeds.

Three rounds ran: slice 1 (the first build), then two fix loops (slice 2 and slice 3). **G3 did not pass.** Home moved from 6.5-7 to 7.3-7.5 on every lens. The loop limit is reached, so the gaps below go forward with the rollout.

Sources: `slice-1-*.md`, `slice-2-*.md`, `slice-3-*.md` (one file per lens per round) and `shared-requests.md`.

---

## 1. Scores

| lens | R5 baseline | slice 1 | slice 2 | **slice 3 (final)** | desktop / phone (slice 3) |
|---|---|---|---|---|---|
| visual | 5.5 | 6.5 | 7.0 | **7.3** | 7.5 / 7 |
| motion | 5 | 6.5 | 7.0 | **7.5** | 7.5 / 7 |
| ux-conversion | 4.5 (R4 page) | 6.5 | 7.0 | **7.5** | single page score |
| typography | 6 (R4) | 7 | 7.5 | **7.5** | single page score |

Every lens names the same pattern: **desktop on tier A is close to shortlist craft; the mid-range phone (tier C, touch-cut), which is the audience device, still gets a lesser film**, and the page has no human face.

---

## 2. What each round fixed

**Slice 1 → 2 (loop 1)**
- The 15 px ink strip on the right edge (`scrollbar-gutter` now applies in flow only).
- The H6 "For Professionals" row collision; the off-spec copy ("terms [to be confirmed]", "2 spots open in [month]", "from [$x]/hr") removed.
- The italic "f" clipping (`.w`/`.rv-mask` inline overhang in `fx.css`).
- A second uppercase voice (`.steps__when` now sentence case Manrope 600).
- W1: no double-take; the splash ring travels and becomes the globe's horizon; the monogram at ≈ 115 px.
- W2 order: struck first, answered second (the `struck` label in `home-tweens.js`).
- The hero globe given presence (limb, halo, a ⅓-diameter arc); the brushed metal made finer.
- "Or Call / Email Us" opens a real contact view; door CTAs title the sheet by need and do not leak the choice.
- Door titles on one baseline (subgrid); one numeral per door; the touch-cut half-swipe no longer fires an iris.

**Slice 2 → 3 (loop 2)**
- Clean cuts on tier A: no double exposure (same-field out group gone by `'in'`), circle cuts clip the entering scene to the iris, no rectangle inside the iris, no gold→ink mud (hard swap on tier C).
- The first cut down from 1.68 s to 1.27 s; trackpad fling moves one scene; reduced motion scrolls freely on fine pointers.
- W5 rides the cut timeline (the map, arc and label leave; the dots gather into the medallion).
- The globe reads as Earth (land-only dots) and the map as Canada (traced coastline, held label).
- H4 ghost numerals off the quotes; door title leads the quote; H2 is one centred group; eyebrows clear the header; the phone monument is 2 lines at ≈ 90 px.
- Real contact details live; the signature fallback slot in H4.

---

## 3. Remaining gaps (from the slice-3 reports)

Severity is the judges'. "Owner" is the file owner under `build-order.md`. Items marked **(rollout)** also affect Services, Story or Partners, because they reuse the engine, dotglobe or the shared footer.

### 3.1 High

| # | gap | lens ids | owner · file |
|---|---|---|---|
| G1 | **No human face or signature on Home.** Both photo slots and the signature slot are built and empty. Every lens says 8 is out of reach without it. BLOCKING FOR LAUNCH (O1). Never a stand-in face. | ux 1, visual §4 | owner → 2d · `site/assets/js/config.js` (`FOUNDER_PHOTO` / `FOUNDER_SIGNATURE`) |
| G2 | **Empty-field frames on the cheap path (rollout).** On tier C and in touch-cut the field swaps at `in − 0.05 s` with the out group gone, and the incoming pan fades from 0 over 0.2 s, so for ≈ 100-250 ms the screen is bare gold or ink (cuts 3 and 4). Breaks §4.4 rule 2. | motion M1, visual V2/V3 | 2a · `cut.js` (swap branch: `at.in = swapAt`, pan at opacity 1), `touch-cut.js` (fire the in group at the 0.35 field change); home · `home-tweens.js` (H4 eyebrow and title at `'in'`, doors from 0.36 s) |
| G3 | **W4 is not seen in motion (rollout: Services `#finder`, Partners `#hero`).** Gold→ink shows "black, then a map"; the sphere→Canada morph plays off-camera. On the phone the tier falls to C after one janky sample, so W4 is a poster pop-in. | motion M4, visual V2 | 2c · `dotglobe.js` (sphere at full alpha on the first ink frame, then the 900 ms morph in view; a cheap 520-point morph on tier C); 2a · `tier.js` (≥ 2 bad samples outside a cut before a downgrade) |
| G4 | **The founder name breaks the H4 word reveal.** `home.js` sets `textContent` on `[data-founder-name]`, which wipes the build-time `.rv-mask/.rv-word` spans, so "Lee" floats in unmasked ahead of "Three Things". | motion M2 | home · `home.js` (write into the first `.rv-word`, drop the second mask) |
| G5 | **The map label collides with the eyebrow on phones** ("A Professional Near You" over "ACROSS CANADA": 5 px overlap at 390, 11 px at 360). | typo T1, ux 3, visual V5, motion M6 | home · `home.css` (phone `#find`: copy top inset, or map `max-height: 32svh`); 2c · `dotglobe.js` / `visual.css` (flip the label above a node in the bottom 15% of the anchor) |
| G6 | **The phone credits address is a 5-6 line centred tower** (a fifth icon cell). Also: tagline Times italic 18/16 px, contact labels switch face on phones, `#credits` spare 23 < 24 at 360x740. (rollout: every page's credits) | visual V4, ux 6, typo F8 | 2b · `base.css` (`.site-footer__icons` phone block), `chrome.js` |
| G7 | **Stale dist at review time.** `site/index.html` (21:40) was newer than `dist/` (21:37), so every slice-3 frame still shows the Protect door's retired `[company name] · licence [#] · [regulator]`. This happened in all three rounds. | visual V1, ux 5 | orchestrator · `npm run build`, then re-shoot |

### 3.2 Medium

| # | gap | lens ids | owner · file |
|---|---|---|---|
| G8 | **The three founder doors start at three insets** (72 / 29 / 56 px at 1440). Cause: `ui.css` `.door { justify-content: flex-end }` packs the single auto column once `home.css` turns the door into a grid. Door 1 also misses the headline's x = 72 column. | typo T2, ux 4, visual V6 | home · `home.css` §5 (`.founder__doors .door { grid-template-columns: minmax(0,1fr); justify-content: stretch; }`) |
| G9 | **The hero lead is 33 words** (≈ 47 visible hero words against ≤ 40; 6 lines at 390). The 27-word lead in `shared-requests.md` waits for an orchestrator OK and a §7.1 edit. | ux 2, typo N5 | orchestrator → `DIRECTION.md` §7.1 → home · `site/index.html` |
| G10 | **Centre irises start as a dot** (≈ 30 px for 150-250 ms on `expo.inOut` from 0.02). Reads as a speck or spinner. (rollout) | motion M3 | 2a · `motion-tokens.js` (`EASE.iris` → `power3.inOut`, start scale ≈ 0.06) |
| G11 | **The hero trust line hangs a middot at 1440** ("…applies ·" / "Replies within 24 hours"). | typo N4 | home · `home.css` (`max-width: none` from 1024 px) or `.nw` pairs in `site/index.html` |
| G12 | **H4 desktop is bottom-heavy**: ≈ 190-224 px of bare metal above the head, doors end 22 px off the bottom. | ux 8, visual V6 | home · `home.css` §5 |
| G13 | **The W3 metal sheen is still not perceptible** in any run (open since slice 1). (rollout: Services S5, Partners P4) | motion M5 | 2c · `visual.css` §4 + home `landed` hook |

### 3.3 Low (polish toward 8.5)

- **Splash ≈ 0.16 s long** (aperture at ≈ 1.26 s vs ≤ 1.1 s): `splash.js` `MATCH_AT_MS` 700 → 560, `MATCH_MS` 380 → 340 (motion M7; 2c).
- **Phone first cut**: the bone disc rides over the scrolling hero copy for ≈ 200 ms (motion M8; 2a `touch-cut.js`).
- **Situation row 03 wraps alone at 1440** (typo F9); **two tags wrap at 360** (typo T3); **phone tails 12-15 % empty** on H2/H3/H4/H6 (ux 7). Home · `home.css`.
- **Hero at 360x740**: globe ≈ 90-114 px and the eyebrow wraps with a hanging middot (typo F10, ux 9, visual V7). Home · `home.css` / `site/index.html`.
- **Close scene cramped at 1280x720** (typo T4). Home · `home.css` laptop-short.
- **Door 1 hole** after the credential line was removed: keep the shared CTA baseline and accept it (typo T5).
- **Bone outline numerals** near invisible (`--stroke-num` .45 → .65; typo F12; 2b `base.css`).
- **Phone header is a flat gold band on H4** (visual V8; 2b `base.css`).
- **Desktop map label under its node glow** (typo T6) and **the hero arc reads "across", not "near"** (visual V9); 2c `dotglobe.js` / `visual.css`.
- **Desktop footer Call/Email rows show no number or address** (ux 10; 2b `chrome.js`).
- **"From Lee" tag only on Outsourcing** in sheet step 1 (ux 11; orchestrator decision on §6.5 → 2d `wa-sheet.js`).

### 3.4 Expected score once fixed

- Motion: G2 + G4 + G10 → desktop 8; G3 brings the phone to ≈ 8.
- Typography: G5 + G8 + G11 + the credits (G6) → 8; the low items → 8.5.
- UX-conversion: G1 + G9 + G5 + G8 + G7 → 8.
- Visual: G7 + G2/G3 + G6 + G5 + G12 → ≈ 7.7-7.8; **8 needs the portrait (G1).**

---

## 4. Keep (all four lenses agree)

1. W1: the ring becomes the globe's horizon, the words rise through the aperture, the stop pops last.
2. "One *Message*●" at mega scale over four struck italic searches (W2), in that order.
3. The H3 quote rows: Times italic, curly quotes, sentence-case tags, hairlines, no boxes.
4. The doors "Protect. / Plan. / Delegate." on fine brushed metal, dealt in (±48 px, ±12°, landing flat).
5. The held "A Professional Near You" map of Canada at rest; the close monument under the medallion.
6. One CTA per scene, one uppercase string per scene, the 14 px floor, 16/15 px fine print, 0 targets under 44 px, no horizontal scroll.
7. One gesture moves one scene (wheel, burst, fling, swipe); rAF is 0 by load + 10 s; the splash plays once per session.
