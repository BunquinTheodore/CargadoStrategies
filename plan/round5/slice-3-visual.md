# Round 5 · Gate G3 · Home slice, round 3 · Visual judge

Lens: visual design and wow factor. I used the same rubric and scoring style as `judge-visual.md` and stood in for the client review. Target: DIRECTION §2 (W1 to W5), §4.2 to 4.4 and §7.1. Audience: Canadians aged 30 to 45 on mid-range phones. Brief: wow factor, unforgettable, not clogged, modern. An 8 means award-shortlist quality with zero clutter.
Date: 2026-10-18. This was a read-only review: I changed nothing in `site/` or `dist/`.

**What I looked at**
- The slice-3 set in `plan/round5/shots-r5/slice-3/` (`S3/` below): 7 scenes and 18 mid-cut frames at 1440x900, 1280x720, 390x844 and 360x740, the splash frames, and the W1 realtime sequence (33 frames at 1440).
- **Build freshness.** `dist/index.html` was built at 21:37:41. `site/index.html` changed at 21:40:15, after the build, and the slice-3 shots were taken from the older build. The change matters: the source has dropped the Protect door's `[company name] · licence [#] · [regulator]` line (OWNER INFO, removed everywhere), but dist and every `S3/` frame still show it. See V1.
- My own live run of that dist:
  - Setup: `node serve.mjs dist 8361` and headless Chrome with an isolated profile and SwiftShader.
  - Input:
    - a real wheel at 1440x900 and touch swipes at 390x844, with no film hook;
    - a 28-frame screencast of the `#founder` → `#find` cut;
    - DOM geometry probes at 1440x900, 390x844 and 360x740, which used the film hook for `goTo` only.
  - Files are in the session scratchpad under `g3s3/` (`L/` below): `out/1440x900/`, `out/390x844/`, `out/burst3/`, and `p1440.json`, `p390.json`, `p360.json`.

---

## 1. Scores (this lens only)

| scene | desktop 1440 | phone 390 | one line |
|---|---|---|---|
| Splash + W1 | 7.5 | 7 | Unchanged and still right. The ring travels and lands on the limb (`S3/w1-…/realtime/f014` → `f016`), and the stop pops last. |
| H1 `#hero` | 8 | 7.5 | Still the beautiful first frame. **The immediate-seek globe now matches realtime** (`S3/1440x900/01-hero.png`: halo, limb, fine points), so slice-2 V6 is closed. At 360 the globe is still only 114 px tall and the eyebrow wraps (V7). |
| H2 `#one-message` | 7.5 | 7.5 | **Much better.** It is one centred group: strikes 186-406, monument 433-625 at 172.8 px with glyphs to x=1037, and steps 686-799 with a 101 px foot. On phone the monument is 2 lines at 89.7 px, the first real scale moment there. What remains is an empty upper-left quadrant beside the lone eyebrow. |
| H3 `#situations` | 7.5 | 7.5 | Unchanged. It is the calmest, most adult frame. |
| H4 `#founder` | 7 | 6.5 | **The ghosts are fixed:** they stand on each title's floor at the right and never touch a quote. The desktop header is now transparent on the metal. But the removed credential line is still on screen (stale dist). There are 224 px of empty gold above the head while the doors run to y=878 (22 px off the bottom). The three doors' text starts at uneven insets (72 / 30 / 57 px). On phone the header is still a flat gold band. |
| H5 `#find` | 7 | 6 | At rest it is handsome: the land-only Canada map, the arc now ≈220 px, and the "A Professional Near You" label is back. In motion, **W4 still does not exist**, and the cut has ~230 ms of empty ink (V2). On phone the label collides with the eyebrow (V3). |
| H6 `#close` | 8 | 7.5 | Unchanged and still the most "private bank" frame. The medallion bookend works. |
| H7 `#credits` | 6.5 | 5.5 | Desktop is fine but plain. **On phone the new address renders as a fifth "icon" cell** 88 px wide and 110 px tall, a 5-line centred stack under the icon row (V4). |
| **Home overall** | **7.5** | **7** | **7.3** (slice 2: 7.0; slice 1: 6.5; Round 5 baseline: 5.5). |

How I would describe it to the jury: *"A confident opening and a confident ending. The middle is now composed at rest, but two of the cuts still go dark or flat, and the globe's big move happens off-camera."*

"Clogged" stays solved:
- one CTA per scene;
- hairlines instead of boxes;
- no strip (`scrollWidth` = `innerWidth` at all three probed widths);
- the only visible `.ph` on Home is the stale H4 line.

What keeps it below 8:
1. The second signature, W4, is still invisible in motion.
2. Two cuts have dead-air frames: an empty gold field, and an empty ink field.
3. No human face. This is content, already escalated as O1 (`shared-requests.md`, BLOCKING FOR LAUNCH).
4. Three phone-level breakages: the H5 label, the credits address, and the 360 hero globe.

---

## 2. Closed since slice 2 (verified)

| slice-2 | status | evidence |
|---|---|---|
| V1 gold→ink mud dissolve | **closed as mud, open as dead air** | there is no brown frame any more (`L/burst3/b05-364` is gold with the content fading, `b07-392` is ink). It is now a hard swap to an **empty** ink field, see V2 |
| V2 W4 invisible / label missing / arc small | **partly** | the label is back (`p1440.json` find label at [1004,789,1171,803]) and the arc is ≈220 px (981,693 → 1181,782). The morph is still unseen (V2) |
| V3 ghosts over quotes | **closed** | `S3/1440x900/04-founder.png`; ghost 1 at [389,446,488,606] ends above quote 1 at y=618 |
| V4 H2 unplaced | **closed** | `p1440.json` one: strike 186-406, title glyphs 62-1037 × 433-625, steps foot at 799 |
| V5 header band on gold | **closed on desktop, open on phone** | live `hdrBg` at 1440 is `rgba(0,0,0,0)`; at 390 it is `rgba(201,162,74,.96)` |
| V6 coarse immediate-seek globe | **closed** | `S3/1440x900/01-hero.png` against `L/out/1440x900/01.png` |
| V7 phone dead bands | **mostly closed** | H2 phone is one group (200-742); the H4 phone head is at 144 |
| V8 W1 double circle | **closed** | `S3/w1-…/realtime/f015-01237ms`, `f016-01264ms`: a single ring on the limb |
| V9 360 hero globe small, eyebrow wraps | **open** | `p360.json`: anchor 67-181 (114 px, ≈32vw), eyebrow 181-217 (2 lines) |
| V10 credits email label wraps | **closed, replaced by V4** | "Email" is one line, but the address added since breaks the row |

---

## 3. Findings (ranked by cost to wow and trust)

| # | severity | finding | evidence | file that must change | fix |
|---|---|---|---|---|---|
| V1 | **high** | **Stale dist shows copy the owner removed.** The Protect door still prints `[company name] · licence [#] · [regulator]` in dist and in every S3 and live frame, at all four viewports. The source already dropped it (`site/index.html`, 21:40, after the 21:37 build). The owner said never to show it, and it is the only placeholder clutter left on Home. | `S3/1440x900/04-founder.png`, `S3/390x844/04-founder.png`; `grep` finds it in `dist/index.html:155`, not in `site/index.html`; live `.ph` probe on H4 = `[company name]`, `[#]`, `[regulator]` | `dist/index.html` (rebuild with `npm run build`; no source change) | Rebuild, then re-shoot H4. Gate G3 should not sign off a frame set taken from a build older than its source. |
| V2 | **high** | **W4 still happens off-camera, and the gold→ink cut has dead air.** Live wheel at 1440: at 364 ms the gold is still there with the content fading. From 392 ms to 620 ms the frame is **empty ink**: mean luma 15.9, with only the header and the key-light gradient. At 583 ms a faint, already-flat map ghost appears, and at 705 ms the map is complete. The sphere→Canada morph is never seen. The visitor gets "black, then a map", not "the globe comes down to Canada". There is also no iris edge: it is a hard swap. This breaks §4.4 rule 2 (J-cut, never dead air) and leaves the second signature unseen. | `L/out/burst3/b05-364.jpg`, `b07-392.jpg`, `b08-583.jpg`, `b09-620.jpg`, `b11-705.jpg`; `L/out/1440x900/cut-05-300.png` (map already complete at 300 ms) | `site/assets/js/dotglobe.js` (map-mode entry: start the morph from a visible sphere after the swap), `site/assets/js/cut.js` (gold→ink: land the incoming head at `'in'`, not after the field) | On entry to `#find`, draw the sphere at full alpha on the first ink frame (≤ 0.40 s), then run the 900 ms morph in view, then the arc. Bring the `#find` eyebrow and headline in at `'in'` so no frame between the swap and the map is empty. If the iris is dropped for gold→ink on purpose, record that in `api.md`. Even so, the morph must be the content of the cut. |
| V3 | **high** | **The empty gold frame in the bone→gold cut.** The seeked 25% frame of cut 3→4 is a bare brushed-gold field with only the header: luma σ 7.6 at 1440 and 6.2 at 390, against 24.6 to 36.7 at 50%. The slice-3 index passed it because its "near-blank" threshold (σ ≥ 4) counts the brushing as content. Live, `L/out/1440x900/cut-04-300.png` shows the H4 head just arriving, so the dead window is short but real. | `S3/1440x900/cut-03-04-25.png`, `S3/390x844/cut-03-04-25.png` | `site/assets/js/home-tweens.js` (H4 entry timing; the head should be on screen by 0.30 s) | Start the eyebrow and title mask-rise at `'in'` (0.30 s) and deal the doors from 0.36 s, so the 25% frame (≈285 ms) already carries the head. Also ask 2e to raise the near-blank check to compare against the scene's own field texture (e.g. σ of the frame minus σ of an empty field ≥ 6). |
| V4 | **high** (phone) | **The credits address breaks the phone icon row.** The address `li` becomes a fifth grid cell: [20,207,108,317] at 390 and [20,181,100,291] at 360. It is a 5-line centred stack ("1210 / Chamberlain / Ave, / Winnipeg, / MB R2X 1E7") under four neat icons. This is the last frame of the page on the target device, and it looks broken. | `S3/390x844/07-credits.png`, `S3/360x740/07-credits.png`; `p390.json` credits | `site/assets/css/base.css` (phone `.site-footer__icons`, lines 531-535) | At < 760 px, give the address item `grid-column: 1 / -1` with a row layout (icon left, text one line at `--fs-note`, left-aligned), or move the address into the fine-print block as plain text. The four contact icons keep their row. Recheck the `#credits` ≥ 24 px spare at 360x740 (shared-requests: it was already 23 < 24). |
| V5 | medium | **H5 phone: the map label collides with the eyebrow, and the scene is dense.** "A Professional Near You" sits at [75,367,242,381] and "ACROSS CANADA" at [20,380,163,398]: 1 px of vertical overlap across 88 px, right on the coastline. Below them sit a 2-line head, a 4-line body, a CTA and a 5-line fine print. The phone H5 is the busiest frame on Home. | `S3/390x844/05-find.png`; `p390.json` find | `site/assets/css/visual.css` (`.globe-poster__label`, lines 111-123), `site/assets/css/home.css` (phone `#find`: anchor height and eyebrow offset) | Put the label above or inside the map for phones (`is-left` flips upward when the node is in the lower 25% of the anchor), or keep ≥ 16 px between the anchor's bottom and the eyebrow. Shorten the body to 3 lines at 390 by letting the map band take 34svh, not 36svh. |
| V6 | medium | **The H4 desktop composition is bottom-heavy and its door text is misaligned.** 224 px of empty metal sit between the header and the eyebrow (62 → 286), while the doors end at y=878 (22 px from the edge) and the CTAs at 852. The door text starts at x=144, 534 and 993: insets of 72, 30 and 57 px inside three equal 432 px doors. So the three columns do not share a rhythm, and door 1 does not align with the head at x=72. | `S3/1440x900/04-founder.png`, `S3/1280x720/04-founder.png`; `p1440.json` founder.doors | `site/assets/css/home.css` (`.founder__doors`, lines 88-115) | Use one inline padding for every door (e.g. `padding-inline: var(--space-m)`, with door 1 at 0 so its text sits on the x=72 column line). Lift the group so the CTA baseline is ≥ 48 px off the bottom and the head starts at about 180 px. |
| V7 | low | **At 360x740 the hero globe is small and the eyebrow wraps.** The globe anchor is 114 px (≈32vw against the 72vw spec), and "Free Introductions · Across Canada" takes 2 lines (181-217). Carried over from slice-2 V9. | `S3/360x740/01-hero.png`; `p360.json` hero | `site/assets/css/home.css` (phone hero block) | Size the anchor at `min(72vw, 30svh)` and tighten the eyebrow tracking one step at ≤ 360 px so it holds one line. |
| V8 | low | **The phone header is still a flat gold band on H4.** The live `hdrBg` at 390 is `rgba(201,162,74,.96)` over the brushed field, while desktop is transparent. | `S3/390x844/04-founder.png`; `L/out/390x844` probe | `site/assets/css/base.css` (gold header token for touch / phone film mode, around line 194) | Apply the same transparent-on-gold rule in touch-cut mode: nothing scrolls under the header there either. |
| V9 | low | **The hero arc says "across", not "near".** At rest, the hero arc runs from the Pacific coast to Ontario (≈260 px across the continent), while H5's arc is the "near you" one. It is a small mismatch with the headline "Near You". | `S3/1440x900/01-hero.png` | `site/assets/js/dotglobe.js` (hero arc node pick) | Pick a hero partner node within ~600 km of the "you" node so the first arc already tells "close to you". |

---

## 4. Gate verdict

**Score: 7.3 / 10 (desktop 7.5, phone 7).** That is +0.3 over slice 2 and +1.8 over the Round 5 baseline.

At rest, Home is now composed in every scene on desktop:
- the H2 monument has real scale;
- the doors no longer misprint;
- the close bookends the splash.

The remaining gap is motion craft and phone finish, not art direction.

**Before rollout copies Home's patterns to Services and Partners:**
1. **V1.** Rebuild dist and re-shoot. This is trivial, but G3 cannot pass on a stale frame set.
2. **V2 and V3.** No dead-air frames, and a W4 morph that plays on screen. Services `#finder` and Partners `#hero` reuse W4 and the gold→ink cut, so fix them here once.
3. **V4 and V5.** The phone credits row and the H5 label. Both are on the target device, at rest, and cheap to fix.

**Expected after V1 to V6:** about 7.7 to 7.8. Reaching **8** still needs the founder portrait (O1: the 40 px avatars plus a real face somewhere on Home). No layout fix substitutes for it with this audience.
