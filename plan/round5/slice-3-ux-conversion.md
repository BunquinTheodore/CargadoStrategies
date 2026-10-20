# Gate G3 · Home slice 3 · UX and conversion judge

Lens: the same as `judge-ux-conversion.md`. Can a Canadian aged 30 to 45, on a mid-range phone, tell **what Cargado is within 5 seconds, who it is for, and what to do next**? The brief asks for a wow, nothing clogged, and a modern feel. The target is DIRECTION §7.1. An 8 means award-shortlist quality with zero clutter.

**Evidence**
- `R` = `plan/round5/shots-r5/slice-3/` (shared run, production build, 13:41Z). It covers all 4 viewports, the cuts and the W1 sequence.
- `L` = my live checks against `dist/` (built 21:37 local).
  - Served with `node serve.mjs dist 8363` and driven by headless Chrome on an isolated profile (SwiftShader).
  - Viewports: 1440x900, 1280x720 (fine pointer), 390x844 and 360x740 (touch).
  - Each scene was reached by deep link, then measured and captured. 5 flows were clicked at 390 and 1440.
  - Frames and `report.json` are in `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\g3ux3\out\`.
  - My visibility filter under-counts words that are still masked by reveals (for example, hero 26). The hero word count below comes from the source text, which is unchanged since slice 2.
- **Stale build warning.** `site/index.html` (21:40) is newer than `dist/index.html` (21:37). The 21:40 source has the owner's removal of "[company name] · licence [#] · [regulator]" from the Protect door. Dist and every R and L frame still show that line. Judge Home again only after a fresh `npm run build`.

---

## 1. Score

| Page | Score | One-line justification |
|---|---|---|
| Home (`index.html`) | **7.5 / 10** (was 7.0) | The two wow objects now land. The globe reads as Earth over North America. The `#find` map is a crisp dotted Canada with a coastline and a held "A Professional Near You" arc, which is the most memorable frame on the site. The ghost numerals and the H2 composition are fixed. The page is still not human: there is no face and no signature. The hero lead is still 33 words. On the main phone size, the map label collides with the eyebrow, and the desktop door columns sit at three different insets. |

**Not a pass (needs ≥ 8).** Findings 1 to 4 below stand between this page and an 8.

---

## 2. Fixed since slice 2 (verified)

1. **Globe reads as Earth.**
   - Land-only dots, with North America and the arc legible at 1440 (`R/1440x900/01-hero.png`).
   - On phones, the 72vw globe reads as a lit continent (`R/390x844/01-hero.png`).
2. **Map reads as Canada.**
   - Dense dots inside a traced coastline. The arc runs from the Prairies to Toronto, and the label holds at rest at all 4 viewports (`R/*/05-find.png`, `L/*-find.png`).
   - This is the strongest frame on Home.
3. **Ghost numerals.** They stand above the title row at the right of each door. No glyph shares ink with a quote at 1440 or 1280 (`R/1440x900/04-founder.png`, `R/1280x720/04-founder.png`).
4. **H2 desktop.** The strikes, the monument and the steps now form one group with no 33% dead band. At 1280 the content starts at y ≈ 188, well clear of the header.
5. **Real contact details.**
   - The Call/Email view shows "Call +1 (204) 869 2508" and "Email malee.holgado@mygreatway.ca". Sheet height is 275 px at 390 and 311 px at 1440.
   - The footer shows the Winnipeg address. No "[company email]" anywhere.
6. **Unchanged good parts (all re-verified, L).**
   - **Hero CTA:** in the thumb zone at y 638 to 690 (390) and 541 to 593 (360).
   - **Door 02:** opens "Ask About the Clean-Up" at step 2 with `business-strategy` preselected and "From Lee".
   - **`#find` after a door:** opens at step 1 with nothing pressed.
   - **`#faq`:** opens `faq-dialog` with 4 items.
   - **Phone hygiene:** 0 targets under 44 px in any phone scene, and no horizontal scroll at any width.

---

## 3. Findings (ranked; each names the file that must change)

| # | Severity | Finding | Evidence | Fix | File |
|---|---|---|---|---|---|
| 1 | **High** | **There is still no human face (or signature).** The hero and H4 say "Lee" three times but show nobody. For insurance and money introductions, a face beside the name is the strongest trust signal for this audience. Both photo slots and the signature slot are built and empty. | `site/assets/js/config.js:77` `FOUNDER_PHOTO = ''`, `:84` `FOUNDER_SIGNATURE = ''`; `R/390x844/01-hero.png`, `R/*/04-founder.png` | The owner supplies a real portrait (or, as a fallback, Lee's own signature as SVG), and 2d sets the key. Never use a stand-in face. This is blocking for launch (O1). | owner → `site/assets/js/config.js` |
| 2 | **Medium-High** | **The hero lead is still too long for a 5-second read.** The lead is 33 words (≈ 47 visible words in the hero against the ≤ 40 target), over 6 lines at 390 (y ≈ 480 to 620) and 360. The H1 is clear, but the lead is the longest block on the page, and it sits between the promise and the button. | `R/390x844/01-hero.png`, `R/360x740/01-hero.png`; DIRECTION §7.1 H1 unchanged | Approve the 27-word lead already proposed in `shared-requests.md`: "Send one message to [First name]. She handles insurance, strategy and outsourcing herself, and introduces you to someone trusted, close to you, for everything else." Then edit §7.1 and the `.hero__lead` text. This is spec copy, so it needs an orchestrator OK. | `plan/round5/DIRECTION.md` §7.1 → `site/index.html` |
| 3 | **Medium** | **The map label collides with the eyebrow on 390x844.** "A Professional Near You" is drawn at y ≈ 366 to 382, and "ACROSS CANADA" starts at y ≈ 383. The two lines touch and read as one 2-line caption, on the scene that carries the network promise. At 360 the gap is about 25 px, and desktop is clean. | `R/390x844/05-find.png`, `L/390x844-find.png` | Keep ≥ `--space-m` between the map band and the copy on phones. Either place the label above or right of the target node when the node sits in the bottom 15% of the anchor, or cap the phone map anchor so its bottom edge clears the eyebrow by ≥ 24 px. | `site/assets/js/dotglobe.js` (label placement, 2c) or `site/assets/css/home.css` (`#find` phone map band) |
| 4 | **Medium** | **The desktop door columns sit at three different insets.** At 1440, the content of door 01 starts 72 px inside its column, door 02 29 px and door 03 56 px. At 1280 it is 50, 26 and 50 px. The three titles, quotes and CTAs do not share a left edge relative to their dividers, so the page's strongest offer frame looks loose. Likely cause: `ui.css` `.door { justify-content: flex-end }` becomes inline-axis `end` packing once home.css turns the door into a grid, so each door's single auto column is pushed right by its own content width. | `R/1440x900/04-founder.png`, `R/1280x720/04-founder.png` | In the ≥ 760 block, add `.founder__doors .door { justify-content: stretch; grid-template-columns: minmax(0, 1fr); }`. Every door's text then starts at its padding edge. | `site/assets/css/home.css` (§5, ≥ 760 block) |
| 5 | **Medium** (process) | **Dist is behind the source.** The owner removed the Protect door's credential placeholders, and the source has the change (21:40). Dist (21:37) and all slice-3 frames still show "[company name] · licence [#] · [regulator]". A client review of this build would see bracket placeholders that the owner has already retired. | `dist/index.html:155`; `site/index.html` founder block | Run `npm run build` and re-shoot before the next gate. No source change is needed. | orchestrator → `dist/` (via `build.mjs`) |
| 6 | **Medium-Low** | **The phone footer squeezes the address into one icon column.** The address is a 5th item in a 4-column icon grid, so "1210 Chamberlain Ave, Winnipeg, MB R2X 1E7" wraps to 5 centred lines in about 80 px. At 360 it takes 5 lines (y 185 to 290). It looks broken on the last frame of the page. | `R/390x844/07-credits.png`, `L/360x740-credits.png` | On phones, let the address item span the row and sit left-aligned on 1 to 2 lines, for example `.site-footer__icons > li:last-child { grid-column: 1 / -1; } … { flex-direction: row; justify-content: flex-start; text-align: left; }`. This also helps the 360 spare reported for `#credits` in shared-requests. | `site/assets/css/base.css` (footer, phone block; 2b) |
| 7 | **Low** | **Uneven phone tails remain.** Empty space below the last element at 390: H2 13%, H3 15%, H4 12%, H6 15% (at 360: 10%, 8%, 9%, 12%). This is better than slice 2 (H3 was 17%), but each bone scene still ends with a pale band, and H3's quotes still wrap to 2 to 3 lines at about 14ch beside the numeral column. | L probe `emptyBelow`; `R/390x844/02..06` | H3: let the quote span the arrow column (2 lines max) and grow the rows toward `clamp(72px, 12svh, 104px)`. H2/H6: bottom-anchor the group or add one `--space-m` step between blocks, so each scene ends at about the 90% line. | `site/assets/css/home.css` (phone block) |
| 8 | **Low** | **The desktop H4 has a gold band at the top.** At 1440, the head starts at y ≈ 255 (header bottom 62), which leaves about 190 px (21%) of bare metal above "From Lee Herself". At 1280 the band is about 145 px. | `R/1440x900/04-founder.png` | Raise the doors' share (`.founder__doors` 62% → about 68%), or start the head at the safe top + `--space-l`, so the band is ≤ 12%. | `site/assets/css/home.css` (§5) |
| 9 | **Low** | **The hero globe at 360x740 is a token.** The globe shrinks to about 90 px and touches the 2-line eyebrow ("Free Introductions · / Across Canada"). The wow frame disappears on the smallest common phone. | `R/360x740/01-hero.png` | At ≤ 760 px tall, keep the globe ≥ 26svh by giving it the eyebrow's line (shorten the eyebrow to "Free · Across Canada" with `.short-hide`), or trim the lead (finding 2), which frees about 50 px. | `site/assets/css/home.css` (phone short block) |
| 10 | **Low** | **The desktop footer "Call" and "Email" rows show no number or address**, while WhatsApp shows its number. This is carried over from slice 2 (finding 8). | `L/1440x900-credits.png` | On desktop, label the rows "Call +1 (204) 869 2508" and "Email malee.holgado@mygreatway.ca" from config. | `site/assets/js/chrome.js` (`contactItems`; 2b) |
| 11 | **Note** | **The "From Lee" tag sits on Outsourcing only, and the label wraps.** Step 1 of the sheet tags Outsourcing "From Lee", but H4 says Lee does insurance and strategy herself too. At 390 the tag wraps the chip to "Outsourcing / From Lee". This is spec-correct (§6.5) but reads inconsistently with "Three Things Lee Does Herself". | `L/390x844-flow-hero-cta.png`; `site/assets/js/wa-sheet.js:42-45` | Orchestrator decision: tag all three of Lee's own services (and amend §6.5), or drop the tag in step 1. | `plan/round5/DIRECTION.md` §6.5 → `site/assets/js/wa-sheet.js` (2d) |

---

## 4. Measurements (live, dist)

| Scene | Controls (390) | Targets < 44 px | Primary CTA y (390) | Empty below (390 / 360) | Empty below (1440 / 1280) |
|---|---|---|---|---|---|
| hero | 2 | 0 | 638-690 | 5% / 5% | 3% / 3% |
| one-message | 0 | 0 | none | 13% / 10% | 11% / 17% |
| situations | 5 | 0 | none (rows) | 15% / 8% | 12% / 12% |
| founder | 4 | 0 | 459-511 (door 01 open) | 12% / 9% | 5% / 5% |
| find | 2 | 0 | 621-673 | 3% / 3% | 4% / 4% |
| close | 4 | 0 | 442-494 | 15% / 12% | 9% / 9% |
| credits | 14 | 0 | none | 6% / 3% | 27% / 21% (centred) |

**Other checks**
- **Flows:** 5 of 5 correct at both 390 and 1440.
  - Hero CTA opens step 1, and Call/Email opens the contact view.
  - Door 02 opens step 2 with the need preselected, and `#find` opens step 1 clean.
  - `#faq` opens the dialog with 4 items.
- **Horizontal scroll:** none at any viewport.
- **Hero words:** about 47 visible (source text).

## 5. Path to 8

1. The face, or at least Lee's signature (1).
2. The 27-word lead (2).
3. Clear the 390 map label (3) and align the door columns (4).
4. Rebuild dist so the retired placeholders disappear (5).

With those done, Home is clear in 5 seconds, human, uncluttered and visibly crafted, which is an 8 on this lens. Findings 6 to 10 move it toward 8.5.
