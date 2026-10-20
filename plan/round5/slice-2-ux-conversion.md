# Gate G3 · Home slice 2 · UX and conversion judge

Lens: the same as `judge-ux-conversion.md`. Can a Canadian aged 30 to 45, on a mid-range phone, tell **what Cargado is within 5 seconds, who it is for, and what to do next**? The brief asks for a wow, nothing clogged, and a modern feel. The target is DIRECTION §7.1. An 8 means award-shortlist quality with zero clutter.

**Evidence**
- `R` = `plan/round5/shots-r5/slice-2/` (shared run, production build). It covers all 4 viewports, the cuts and the W1 sequence.
- `L` = my live checks against `dist/` (built 19:56, newer than every Home source file).
  - Served with `node serve.mjs dist 8358` and driven by headless Chrome on an isolated profile.
  - Viewports: 1440x900, 1280x720, 390x844 (touch) and 360x740 (touch).
  - Each scene was reached by deep link and measured, and 7 flows were clicked through.
  - Frames and `report.json` are in `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\g3ux2\out\`.
  - The phone word counts are valid. On desktop my visibility filter counted all stacked scenes at once (about 278 words), so the desktop numbers are not used.
  - Splash timing was not measured reliably in this probe; see the 2e note in `shared-requests.md`.

---

## 1. Score

| Page | Score | One-line justification |
|---|---|---|
| Home (`index.html`) | **7.0 / 10** (was 6.5) | Every High finding from slice 1 is fixed: no collision, a fresh dist that says "Lee", a real Call/Email view, door-aware sheet titles and no leaked choices. The page is clear, calm and converts on every scene. It is not award-grade yet. There is still no face. The two "wow" objects (the hero globe and the Canada map) read as loose dot clouds. The hero lead is still 47 words. Several desktop compositions have a dead band or a collision. |

**Not a pass (needs ≥ 8).** Findings 1 to 4 below stand between this page and an 8.

---

## 2. Fixed since slice 1 (verified live)

1. **Close rows.** "terms [to be confirmed]" is gone, and "For Professionals" sits on one line at 1440 and 1280 (`L/1280x720-close.png`, `R/1440x900/06-close.png`).
2. **Stale build.** Dist renders "Lee" in all 3 places. There are no bracketed numbers ("Replies within 24 hours", "Within 24h", "Day 3").
3. **"Or Call / Email Us" opens a contact view.**
   - It is titled "Call or Email Us", with a full-width gold "Call +1 (204) 869 2508", then "Email [company email]", then "Prefer WhatsApp? →".
   - Sheet height is 249 to 294 px. No WhatsApp step and no unfilled message preview.
   - Verified at all 4 viewports.
4. **Door CTAs.** Door 02 opens "Ask About the Clean-Up" at step 2 with a removable "Business Strategy ×" chip and a "From Lee" tag. The next open from `#find` starts clean at step 1 with nothing pressed (`find-after-door: pressed []`).
5. **Door clutter.** "2 spots open in [month]" and "from [$x]/hr" are gone. Door 02 now shares the baseline with doors 01 and 03 (`L/1440x900-founder.png`).
6. **Ink stripe.** The 15 px ink stripe on the right edge is gone (R/index.md observation, confirmed in L).
7. **Phone dead bands.**
   - H2: 4% empty below the text (was about 35%), with a ~56 to 64 px monument.
   - H4: 4% empty below, and the open door's CTA lands at y ≈ 552 of 844.
   - H3 still has 17% empty below (finding 6).
8. **Strike bars.** They now cross the words through the x-height on phones and read as crossed out (`R/390x844/02-one-message.png`).
9. **Credits.** The desktop footer is now vertically centred (`L/1440x900-credits.png`).
10. **Unchanged good parts.**
    - 3 CTA verbs.
    - 0 targets under 44 px in any phone scene.
    - No horizontal scroll at 390 or 360.
    - The FAQ opens from `#faq` with 4 exclusive items.
    - The hero CTA is in the thumb zone at 390 (y ≈ 638 to 690).

---

## 3. Findings (ranked; each names the file that must change)

| # | Severity | Finding | Evidence | Fix | File |
|---|---|---|---|---|---|
| 1 | **High** | **There is still no human face.** The hero and the founder scene both say "Lee" but show nobody. For insurance and money introductions, a face beside the name is the strongest trust signal this audience gets (judge-ux-conversion B3), and it is the single biggest gap to an 8. Both slots are built and hidden (`FOUNDER_PHOTO = ''`). | `site/assets/js/config.js:63`; `R/390x844/01-hero.png`, `R/1440x900/04-founder.png` | The owner supplies a real portrait and 2d sets `FOUNDER_PHOTO`. Never use a stand-in face. If the photo cannot arrive before launch, give the founder head a signed line instead (Lee's signature as an SVG from the owner), so H4 carries a human mark. | owner → `site/assets/js/config.js` |
| 2 | **High** | **The wow objects do not read as what they are.** At rest, the hero globe is about 300 sparse, large dots with no landmass, so it reads as a "dotted ball", not Earth (`R/1440x900/01-hero.png`). The `#find` map is a loose cloud whose Canada outline is only guessable on phones (`R/390x844/05-find.png`). The W4 arc label "A Professional Near You" (`dotglobe.js` `LABEL_NEAR`) did not appear in any at-rest frame (R or L, 4 viewports). The brief's "unforgettable" rests on these two frames. | `R/1440x900/01-hero.png`, `R/1440x900/05-find.png`, `L/390x844-touch-find.png` | (a) Globe: use denser, smaller land dots (≈ 2 to 3× the count at half the radius), with ocean dots dropped or at ≤ 15% alpha, so continents read at 1440 and at 72vw on phones. (b) Map: use the same density treatment and a crisp coastline, so Canada is recognisable without the caption. (c) Hold the arc label at rest after W4, and render it in at-rest/seeked states too. | `site/assets/js/dotglobe.js`, `site/assets/js/dotglobe-draw.js` (+ data via `tools/gen-dotglobe.mjs`) (2c) |
| 3 | **Medium-High** | **The hero lead is still too long for a 5-second read.** It has 47 visible words on phones against the ≤ 40 target, and the lead alone is one 33-word sentence over 6 lines at 390 (y 476 to 620). The promise is clear in the H1, but the lead makes a mid-range-phone reader work before the button. | L probe `hero w 47` (390 and 360); `L/390x844-touch-hero.png` | Approve the slice-1 proposal in §7.1: "Send one message to Lee. She handles insurance, strategy and outsourcing herself, and introduces you to someone trusted, close to you, for everything else." (27 words). This needs an orchestrator OK because it is spec copy. | `plan/round5/DIRECTION.md` §7.1 → `site/index.html` |
| 4 | **Medium** | **The ghost numerals collide with the door quotes on desktop.** At 1440, "2" sits under "My" of "Where Does My" and "3" under "Doing". At 1280, "3" runs through "Everything". The italic quote is the line that sells each door, so it should never share ink with a 300 px glyph. This is the page's strongest frame, and it looks accidental here. | `R/1440x900/04-founder.png`, `R/1280x720/04-founder.png` | Keep the ghost numeral in the door's top band, above the title row: cap its block to the space above `.door__title` (e.g. `bottom: calc(100% - var(--door-title-top))`), or drop its alpha to ≤ 0.12 and put it behind a `mix-blend-mode: multiply` layer so the quote stays crisp. The first is preferred. | `site/assets/css/home.css` (`.founder__doors .ghost`) |
| 5 | **Medium** | **Desktop H2 has a dead band and is jammed against the header.** At 1440, the strikes sit top-right (y 85 to 290) and the monument bottom-left (y 585 to 720), with about 295 px (33%) of empty bone between them. At 1280x720, "How It Works" is 20 px under the header (y 76 vs header bottom 56) and the 2×2 strikes start at y 105. The scene feels unbalanced rather than composed. | `R/1440x900/02-one-message.png`, `L/1280x720-one-message.png` | Start the scene's content at the standard safe top (header + `--space-l`). On wide screens, vertically centre the strikes in the band above the monument (or bottom-anchor them to sit about `--space-xl` above it), so the gap is at most about 15%. | `site/assets/css/home.css` (`#one-message` wide and laptop-short) |
| 6 | **Medium-Low** | **The phone tails are uneven.** H3 has 17% empty below the "See All Services" link (y 703 of 844), and H6 has 16% (y 710). The H3 quotes wrap to 2 or 3 lines at about 14ch because the numeral, tags and arrow columns squeeze the quote. The H4 head starts at y 278, leaving a gold band of about 25% at the top. | L probe `situations empty 17%`, `close empty 16%`; `L/390x844-touch-situations.png`, `-founder.png` | H3: hang the tags under the quote and let the quote span the arrow column (quote max 2 lines), then let the rows take `clamp(72px, 12svh, 104px)` so the group fills to about the 85% line. H6: either grow the rows to 64 px or bottom-anchor the group. H4: allow the closed doors `min-height: 16svh`. | `site/assets/css/home.css` (phone block) |
| 7 | **Low** | **The sheet title row breaks on desktop when a need is preselected.** On the door flow at 1440 and 1280, "Ask About the Clean-Up · Business Strategy × · From Lee" fills the row and "Close" drops alone onto a second line on the right. It looks broken in the first frame after a door click. | `L/1440x900-flow-door2.png` | Put the chip and the "From" tag on their own row under the title (the phone `order: 3` rule from the 2d request), so Close stays on the title row at every width. | `site/assets/css/ui.css` §13 (2b; already requested in `shared-requests.md`) |
| 8 | **Low** | **The desktop footer "Call" row shows no number.** WhatsApp shows "+1 (204) 869 2508", but the Call row reads just "Call". A desktop visitor who wants to phone has to hover the link or open the sheet to see the number. | `L/1440x900-credits.png` | Label it "Call +1 (204) 869 2508" on desktop (the phone icon row can keep "Call"). | `site/assets/js/chrome.js` (credits contact row; 2b) |
| 9 | **Note** | **Visible owner placeholders on the busiest scene.** Door 01 shows "[company name] · licence [#] · [regulator]", and the footer and sheet show "[company email]". They are correct to keep (compliance), but each one costs trust in a client review. | L probe brackets | Owner to-do: the insurance carrier, licence number and regulator, plus the company email. No design change. | owner → `site/assets/js/config.js` / `site/index.html` |

---

## 4. Measurements (live, dist, phones)

| Scene | Words 390 / 360 | Fine print | Controls | Targets < 44 px | Empty below text (390) |
|---|---|---|---|---|---|
| hero | 47 / 47 | 12 | 2 | 0 | 5% |
| one-message | 34 / 34 | 0 | 0 | 0 | 4% |
| situations | 53 / 53 | 0 | 5 | 0 | 17% |
| founder | 44 / 44 | 7 | 4 | 0 | 4% (top band about 25%) |
| find | 33 / 33 | 27 | 2 | 0 | 5% |
| close | 30 / 30 | 0 | 4 | 0 | 16% |
| credits | 28 / 28 | 52 | 12 | 0 | 12% |

**Flows (all 4 viewports, 7 of 7 correct):**
- hero CTA → step 1;
- Call/Email → contact view;
- header WhatsApp → step 1;
- door 02 → "Ask About the Clean-Up", step 2, need preselected;
- `#find` after a door → step 1 with nothing pressed;
- `#faq` → dialog with 4 items.

Text under 15 px appears only in eyebrows and the © line. No horizontal scroll at any width.

## 5. Path to 8

1. The face (1).
2. A globe and map that read as Earth and Canada, with the arc label held (2).
3. The shorter lead (3).
4. The desktop founder and H2 compositions (4, 5).

With those done, Home is clear in 5 seconds, human, uncluttered and visibly crafted, which is an 8 on this lens. Findings 6 to 8 are polish that moves it toward 8.5.
