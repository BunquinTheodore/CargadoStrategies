# Gate G3 · Home slice, round 3 · Typography judge

Lens: the `judge-typography.md` rubric, with DIRECTION §4.1 (type rules) and §7.1 (Home) as the target. The audience is Canadians aged 30-45 on mid-range phones. The brief is wow factor, unforgettable, not clogged and modern. A score of 8 means award-shortlist quality with zero clutter.

Evidence:
- Screenshots in `plan/round5/shots-r5/slice-3/`: scenes at rest at 1440x900, 1280x720, 390x844 and 360x740, the mid-cut frames and the splash frames.
- **A live scan of `dist`.** I served `dist` (built 21:37) on port 8364. Headless Chrome with an isolated profile measured the computed style and geometry of every visible text run in each of the 7 scenes, at the same 4 viewports. The film was exposed by the same in-flight chunk rewrite that the shots use. Files: session scratchpad `typo3/scan.mjs` and `typo3/scan.json`.
- **A second scan of the current source.** `site/index.html` changed at 21:40, after the build: the owner removed the Protect door's credential line. So I also served `site` on port 8365 and repeated the scan with screenshots (`typo3/site/s.json`, `typo3/site/s-<vp>-<scene>.png`). Where the two builds differ, the finding says so.

---

## Score: **7.5 / 10** (the gate needs 8 or more, so it does not pass yet)

**What improved.** The four slice-2 "must fix for 8" items are all fixed: N1, N2, N3 and F7. The desktop page is now composed and confident. "One *Message*●" is a poster frame at 173 px. The door titles lead their quotes (40.3 px over 31.4 px at 1440). Every eyebrow clears the header by 54 px or more. The phone monument fills its band as two lines at 90 px (81 px at 360).

**Why it is still not 8.** It is held back by execution details that a shortlist jury notices in the first ten seconds:
- one text collision on the most common phone width (T1);
- three door columns that do not share a left edge (T2);
- a hanging middot on the very first desktop screen (N4, still open);
- a credits block whose address sets as a five- or six-line centred tower on phones (F8, still open).

None of these is a system problem. Five of the eight items below are fixes in `home.css` only.

| Rubric area | Verdict | Measured (1440 / 1280 / 390 / 360) |
|---|---|---|
| Scale contrast | **Strong.** Mega, statement, d1, d2 and quote are five clearly separate steps. | Mega 172.8 / 124 / 89.7 / 81.4. Hero H1 103.8 / 79.2 / 44 / 44. Close statement 94.5 / 79.2 / 36 / 36. d1 65.7 / 55.4 / 36 / 36. |
| Phone hero | **Good.** The claim and one CTA own the first screen. The 6-line lead is still the densest block (N5). | H1 44 px on 3 lines. Lead Manrope 500 at 17 px, 6 lines. |
| Small-text floor | **Passes everywhere.** | The smallest text is 14 px Poppins (eyebrows, the map caption, switches, ©). Fine print is 16 px (15 on phones). |
| One face, one job | **Passes on the scenes.** The credits break it on phones: the icon labels change from Manrope 16 px on desktop to Poppins 14 px on phones. | |
| Human voice in Times italic | **Still the best thing on the page.** | Situation quotes 32 / 29 / 26 / 26 px. Door quotes 31.4 / 28 / 24 / 24 px. |
| One uppercase string per scene | **Passes.** | |
| Times ≥ 28 px (quotes ≥ 24 on phones) | **Passes on the scenes. Fails in the credits** (F8). | Tagline 18 / 16 px italic, wordmark 24 / 20 px. |
| Collisions and alignment | **Not yet award quality.** | T1, T2 and N4 below. |

---

## Ranked findings

Every finding names the repo-relative file that must change. Ownership follows `build-order.md`: stage 3 (Home) owns `site/index.html` scene content and `site/assets/css/home.css`. Stage 2 owns `base.css`, `fx.css`, `ui.css`, `visual.css` and the shared footer, which `chrome.js` writes.

### Must fix for 8

**T1 · High · On phones the map label "A Professional Near You" sits on top of the "ACROSS CANADA" eyebrow.** File: `site/assets/css/home.css` (§9 phone band, `.find__map` / `.find__copy`). A guard is optional in `site/assets/css/visual.css` (the label placement, stage 2c, shared request).
- **390x844, current source:** the label box spans y 364-384 and the eyebrow y 379-399, and both start near x 20-75. The boxes overlap by 5 px, so the label's baseline touches the eyebrow's caps (`typo3/site/s-390x844-4.png`). The dist shot shows the same thing (`shots-r5/slice-3/390x844/05-find.png`).
- **360x740, dist scan:** the label spans y 278-298 and the eyebrow y 287-307, an overlap of 11 px.
- Two Poppins 14 px strings in two colours read as one garbled line. This is the scene that carries the commission notice, so it must look deliberate.
- The cause: on phones the map is limited to `max-height: 36svh`, and the copy starts straight under it. The southern Ontario node (the label's anchor) sits on the map's bottom edge.
- **Fix (home.css):** in the phone band, give the copy a top inset that clears the label, e.g. `.find__copy { padding-top: calc(var(--space-l) + 14px); }`. Or shrink the map to `max-height: 32svh` and keep the copy where it is.
- **Fix (visual.css, optional, shared request):** flip the label above its node when the node is in the bottom 15% of the anchor.

**T2 · Medium-high · The three founder doors do not share a left edge, and door 1 is not on the page's left edge.** File: `site/assets/css/home.css` (§5, `.founder__doors .door`).
- At 1440 every door is 432 px wide with 28.8 px padding. But each door's inner grid column shrinks to fit its content (331 / 373 / 346 px) and is then centred.
- So the text starts **72, 29 and 56 px** in from the left edge of each door: x 144, 534 and 993. The headline "Three Things Lee Does *Herself*●" starts at x 72, so "Protect." visibly sits 72 px to the right of it (`shots-r5/slice-3/1440x900/04-founder.png`, and 1280 likewise: 114 against 64).
- In a three-column editorial layout, unequal gutters read as an accident. They also break the headline-to-first-door alignment that the whole scene hangs on.
- **Fix:** `.founder__doors .door { grid-template-columns: minmax(0, 1fr); justify-content: stretch; }` inside the ≥ 760 px block. Then each door's text starts at the same padding from its rule.
- Optionally, drop door 1's left padding to 0 so "Protect." lines up with the eyebrow and headline at x 72. The rules between doors keep their padding.

**N4 (open since slice 2) · Medium · The hero trust line still hangs a middot at 1440.** Files: `site/assets/css/home.css` (§2, line 33, `.hero__trust { max-width: 52ch; }`) and `site/index.html` (`.hero__trust`).
- At 1440 the line sets on 2 lines. Line 1 ends "…Licence shown where one applies ·" and line 2 is "Replies within 24 hours" (y 769-815). This is on the first screen every desktop visitor sees, right under a 104 px display headline.
- At 1280 it already sits on one line (x 64-715), because the laptop-short band sets `max-width: none` (line 176).
- **Fix:** move `max-width: none` out of the laptop-short band to all widths of 1024 px and up. The copy column is about 790 px wide and the line is about 650 px, so it fits on one line.
- Or set the items as two `white-space: nowrap` pairs joined by a plain space, so any break falls between the pairs. The copy stays verbatim.

### Should fix (each one moves the page toward 8.5)

**F8 (open since slice 1, worse on phones) · Medium · The credits block.** Files: the shared footer from `site/assets/js/chrome.js`, and `site/assets/css/base.css` (credits). Both are stage 2b, so this is a shared request.
- **The address tower:** on phones the address is a centred icon label in Poppins 14/600 that sets on **6 lines** ("1210 / Chamberlain / Ave, / Winnipeg, / MB R2X 1E7", y 231-318 at 390 and y 205-292 at 360). It is the ugliest text block on Home (`shots-r5/slice-3/390x844/07-credits.png`, `360x740/07-credits.png`).
- **Small serif:** the tagline "Connected by Purpose. United in Service." is Times italic at 18 px on desktop and 16 px on phones, at 82% ivory on ink. §4.1 sets Times at 28 px or more, and 24 px or more for quotes on phones. The wordmark is 24 / 20 px.
- **Two faces for one job:** the contact labels are Manrope 16 px on desktop and Poppins 14 px on phones.
- **Fix:**
  - Take the address out of the icon grid on phones and set it as one left-aligned Manrope line at `--fs-note`, with the pin icon inline. For example, `.credits__contact li:last-child { grid-column: 1 / -1; text-align: left; flex-direction: row; }`.
  - Keep the contact labels in Manrope at every width.
  - Set the tagline in Manrope 500 at `--fs-note`, or in Times italic at 24 px or more.

**F9 (open since slice 1) · Medium-low · Situation row 03 still wraps alone at 1440.** File: `site/assets/css/home.css` (§4, `.sit__rows`).
- "If something happens to / me, is my family OK?" sets on 2 lines (y 535-633), so this row is about 60% taller than the other three, which each sit on one line.
- The break also strands "to" away from "me". At 1280, where the tags sit under the quote, all four rows set on one line and the scene looks better (`1280x720/03-situations.png`).
- **Fix:** use the stacked-tags layout up to about 1500 px wide, or narrow the tag column to `minmax(0, 15rem)`.

**T3 · Low-medium · At 360 two situation tags wrap.** File: `site/assets/css/home.css` (§9 phone band, `.sit__rows .row__meta`).
- "Mortgage, real / estate, lawyer" and "Insurance, wills / and estates" break onto 2 lines. Row 01 becomes 5 lines and row 03 becomes 6 (`360x740/03-situations.png`).
- The numeral column (x 36-62) and the arrow column take about 90 px from a 320 px measure.
- **Fix:** below 380 px, let the tags span the numeral column (`grid-column: num / arrow`), or shrink the row numeral to 22 px and pull the title to x 56. At 390 the tags already fit.

**F10 (open since slice 2) · Low · The hero eyebrow still hangs a middot at 360.** File: `site/index.html` (the hero eyebrow), or `site/assets/css/home.css`.
- It reads "FREE INTRODUCTIONS · / ACROSS CANADA" (y 180-218, 2 lines).
- **Fix:** `<span class="nw">Free Introductions</span> · <span class="nw">Across Canada</span>`, or set `letter-spacing: .08em` below 380 px, which fits on one line.

**F12 (open since slice 1) · Low · Outline numerals on bone are still close to invisible.** File: `site/assets/css/base.css` (`[data-field="bone"] --stroke-num`, still `rgba(122,92,18,.45)`; stage 2b, shared request).
- The step numerals "1 2 3" (75 px at 1440, 26 px on phones) and the row numerals "01-04" (32 / 26 px) read as beige smudges, not as a typographic layer (`1440x900/02-one-message.png`, `390x844/03-situations.png`).
- **Fix:** raise the bone stroke to `.65`, or use a 1.25 px stroke below 40 px.

**T4 · Low · On short laptops the close scene is cramped.** File: `site/assets/css/home.css` (§9 laptop-short, `#close`).
- At 1280x720 the medallion (115 px), the 3-line statement (79 px), the CTA pair and the two rows are stacked with gaps of about 16-23 px. The statement's descenders sit 16 px above the button (statement bottom 478, CTA top 494), and the CTA sits 23 px above the rows (`1280x720/06-close.png`).
- The page's final monument should breathe more than any other scene, not less.
- **Fix:** in laptop-short, take the medallion to 12svh and give the statement-to-CTA gap `var(--space-l)`. The frame still fits, because there are about 65 px spare below the rows.

**T5 · Low (current source only) · Door 1 has a hole.** File: `site/assets/css/home.css` (§5 subgrid rows).
- The owner removed the Protect fine print, so in door 1 the offer line (y 702-724) is now followed by about 70 px of empty gold before the CTA (y 796). The CTAs share one baseline, which is right, but door 1 reads as unfinished next to doors 2 and 3 (`typo3/site/s-1440x900-3.png`).
- **Fix:** accept the hole, which keeps the baselines, or move the CTA up into the fine-print row when a door has no `.fineprint`: `.door:not(:has(.fineprint)) .door__more { grid-row: 5; align-self: start; }`. I would keep the shared CTA baseline and accept the hole. This note is here so nobody "fixes" it by misaligning the CTAs.

**N5 (open, copy decision) · Low · The phone hero lead is 6 lines.** File: `site/index.html` (hero lead), with an orchestrator OK and a DIRECTION §7.1 edit. The 27-word lead proposed in `shared-requests.md` takes it to 4 lines. No change is made without that OK.

**T6 · Low · On desktop the map label sits under its node glow.** File: `site/assets/css/visual.css` (the label offset; stage 2c, shared request).
- At 1440, "A Professional Near You" (x 1004-1171, y 786-806) ends under the destination node's glow, and "You" touches the coastline stroke (`1440x900/05-find.png`).
- **Fix:** offset the label 12 px further from its node, on the side away from the arc.

### Verified fixed since slice 2 (do not regress)
- **N1:** at 360 every strike line sets on one line: "Searching “Broker Near Me”" at 25.9 px, x 20-328. Each bar crosses its own line.
- **N2:** the door title leads the quote: 40.3 over 31.4 px at 1440, 35.4 over 28 at 1280, 28 over 24 on phones. The ghost numerals (216 px at 1440) stand beside the titles, and no text sits on top of them.
- **N3:** the eyebrows clear the header. "How It Works" is 122 px below it at 1440 (header 63, eyebrow 185). The hero eyebrow at 1280 is 54 px below it (56 against 110).
- **F7:** the phone monument is "One / *Message*●" at 89.7 px (81.4 at 360), as one centred group with the strikes and steps.
- **F1-F6 and F11** are still fixed.

---

## Keep (do not lose these while fixing)
1. "One *Message*●" at 173 px under four struck italic searches. It is the unforgettable frame on Home.
2. The situation rows: Times italic quotes with curly quotes, sentence-case tags, hairlines and arrows.
3. The hero's 3-line statement with the gold italic "*Near You*●".
4. The close monument "One Message. The Right Person. Close to *You*●" under the medallion, with the two serif rows.
5. The 14 px floor, the 16/15 px fine print, and one uppercase string per scene.
6. The founder scene's hierarchy: a d2 title, then an italic echo, then the Manrope offer, then the fine print, then the CTA, all on shared baselines.
