# Round 5 re-judge: layout and clutter (round 1)

**Overall: 7 / 10** (was 5 / 10 in `judge-layout.md`).

Lens and stance are the same as `judge-layout.md`: grid, whitespace, density, hierarchy, ideas per screen, text against visuals, template consistency, and mobile. The audience is Canadians aged 30–45 on mid-range phones. The target is DIRECTION.md (§4.2 archetypes and budgets, §6 chrome, §7 page specs). A score of 8 means genuinely excellent.

## Evidence

- `plan/round5/shots-r5/review-1/`: 169 scene PNGs at 1440x900, 1280x720, 390x844 and 360x740, plus mid-cuts, the fit, perf, console and compliance outputs.
  - fit-audit (film, flow and touch) is ok at all 9 viewports, with every budget holding.
  - console-check is clean on 30 runs.
  - compliance-diff reports 0 missing.
- **Live checks on dist, served on :8442 (server stopped afterwards).** I used my own CDP script with an isolated Chrome profile:
  - I walked services 1→8 and story 1→5 with real ArrowDown key presses.
  - I made hash jumps `services#finder→#close` and `story#logo→#close`.
  - I opened the WhatsApp sheet (C22) at 390x844 with touch and at 1440x900.
  - The script and frames are in `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\rejudge\`.
- I did not judge motion. I looked at stills and mid-cut stills only.

## Scores

| page | R5 orig | now | one line |
|---|---|---|---|
| Home | 5 | **7.5** | The chrome is cleared, there are 7 scenes, the archetypes rotate (O·M·R·D·O·M), and the hero is one idea with one CTA. Founder doors and the find map are genuine compositions. The deductions are for small phone headlines (`Sounds Like You?` at about 32 px) and top-heavy phone scenes with 15–18% dead space at the bottom. |
| Services | 4 | **6.5** | Clipping and box-in-box are gone, and the finder, inquiry and close scenes are clean. However, `#ours-strategy` leaves its right 55% blank, the typographic portrait collides with its own monogram, and the outsourcing doors put the CTA top-right with four bracket placeholders as the loudest type on the page. |
| Our Story | 6.5 | **7** | The logo scene survives intact. The close medallion and `One Place. Not Five.` are strong. The deduction is for `#top`, where the right-hand portrait is a placeholder sentence in Times running over the W strokes. |
| Partners | 4.5 | **6.5** | The hero map, the rows and the close are good. `#founding` is a statement set at about 90 px with the right half of the gold field empty: the half-empty screen from B10 is back, just in gold. The apply step 1 shows 5 fields in two groups on desktop and "Step 1 of 8" on phone. |
| Legal | 5.5 | **7** | Calm and correct. The draft band is now a slim pill band, and the contents rows and paged reader fit. The Q&A pager shows 3 items, which leaves about 45% of a 1440x900 screen empty. |
| **Overall** | **5** | **7** | The site is no longer clogged: every original critical item (B1–B4) is fixed and verified. It is not yet unforgettable. Three of the five pages still have a scene that reads as unfinished (half-empty M scenes, colliding portraits, placeholder-led doors), and phone compositions are correct but not yet composed. |

### How the original defects stand

| # (judge-layout.md) | status |
|---|---|
| B1 chrome (5 layers, 15 marks) | **Fixed.** Desktop: logo, 3 nav links and 1 WhatsApp button. Phone: monogram, WhatsApp icon and Menu. No HUD, corners or float. |
| B2 overflow at 1440x900 | **Fixed.** fit-audit is ok at 9 viewports. The tightest are services `#ours-outsourcing` and partners `#tiers` at 1280x720, with about 20 px to spare. |
| B3 hero with 20 elements | **Fixed.** 6 elements. The form moved to C22, and the sheet fits with no inner scroll (604 px at 390x844, 524 px at 1440x900). |
| B4 mobile = stacked desktop | **Mostly fixed.** Nothing is cut under a bar, and the globe or map is a top band on hero and find. What remains is listed in finding 5. |
| B5 one template | **Fixed.** M, O, R, D and P archetypes rotate, and no two neighbouring scenes match. |
| B6 home repetition (12 scenes) | **Fixed.** 6 scenes plus credits. |
| B7 globe as filler | **Fixed** in real use: the globe has a job or is hidden. See finding 10, a tooling artifact. |
| B8 boxes in boxes | **Fixed.** Hairlines carry the structure, and only P scenes are framed. |
| B9 loud placeholders | **Partly fixed.** C18 dotted underlines are applied, but outsourcing and tiers set placeholders at d2 size as the headline of each panel. |
| B10 half-empty screens | **Regressed in a new form.** See finding 1. |
| B11 flat hierarchy | **Mostly fixed.** There is a clear mega, d1, body and fineprint ladder. |
| B12 long forms | **Fixed** for services. Partners is noted in finding 6. |
| B13 legal top stack | **Fixed.** |
| B14 alignment nits | Mostly fixed. New small nits are in finding 9. |

## Findings, ranked by severity

### High

1. **Monument scenes set at statement size leave half the screen dead.**
   - Where:
     - services `#ours-strategy`: the statement at about 95 px sits in cols 1–6, and the right 55% of the bone field is empty (`shots-r5/review-1/services/1440x900/03-ours-strategy.png`);
     - partners `#founding`: the 2-line statement ends at x≈920, with nothing to the right on the gold field (`partners/1440x900/04-founding.png`);
     - legal `#close` does the same, which is acceptable there because the page is calm on purpose.
   - Why it matters: §4.2 M means "one statement at mega size". Story `#beginning` shows the difference: at mega size the same layout reads as poster, not as gap.
   - Fix: set these statements at `--fs-mega`, spanning cols 1–12 and bottom-left anchored. Alternatively, give `#founding` its object: the medallion, or the `[n] of 2 open` numeral as a ghost outline at 46svh on the right.
   - Files: `site/assets/css/services.css`, `site/assets/css/partners.css` (and `site/services.html` / `site/partners.html` if the class needs to change from `.t-statement` to `.t-mega`).

2. **The typographic portrait (C33) collides with its own monogram.**
   - What happens: "Lee Holgado" in Times italic and the `[signature]` line sit directly on the W strokes. On story `#top`, a three-line placeholder sentence in Times at about 30 px runs through both W diagonals and the C ring (`story/1440x900/01-top.png`, `services/1440x900/02-ours-insurance.png`, `services/390x844/02-ours-insurance.png`).
   - Why it matters: it reads as a rendering error, not as a finished look, and this is the one "person you can name" moment the brief asks for.
   - Fix:
     - drop the monogram to the 40% stroke behind the name, or offset the name below the ring's centre line;
     - set the quote at `--fs-quote` outside the ring;
     - never put the multi-line placeholder sentence inside the ring.
   - Files: `site/assets/css/visual.css` (`.tportrait`), `site/assets/css/story.css`.

3. **The outsourcing doors break the anchor rule and lead with placeholders.**
   - What happens:
     - the price, the CTA and the fine print float top-right above the panels, which violates the §4.2 rule that the action sits bottom-left of the content column;
     - the four panel titles are `[Bookkeeping]` and the like at d2 size, so the first thing a visitor reads is brackets;
     - the panels run to the bottom edge, with 20 px left at 1280x720 (`services/1440x900/05-ours-outsourcing.png`, `services/1280x720/05-ours-outsourcing.png`).
   - Fix:
     - move price, CTA and fine print to an action row under the panels (or under the head, left-aligned);
     - cap the panel height so at least 48 px of field shows below them;
     - drop the placeholder titles to Manrope 600 at 20 px until real names exist.
   - Files: `site/services.html`, `site/assets/css/services.css`.

### Medium

4. **Partners tiers have the same placeholder-led hierarchy.** `[No fee]` and `[$ per month]` at d2 are the largest type in each panel, and the bullet lines are 15 px. The ghost numerals at 6% are fine. Make the tier name the d2 and the price a Times 28 px line under it. Files: `site/partners.html`, `site/assets/css/partners.css`.

5. **Phone compositions are correct but not composed.**
   - Headlines are small: `Sounds Like You?` is about 32 px at 390 (`index/390x844/03-situations.png`), and the hero H1 is about 38 px against the 44 px spec.
   - Content clusters in the top 80%, leaving 100–150 px of empty field at the bottom on index 02, 03, 04, 06, partners 03 and 06, and legal 03.
   - At 360x740 the hero globe shrinks to about 120 px (`index/360x740/01-hero.png`), so the first frame is text-only.
   - Fix:
     - use the §7.1 phone sizes (H1 44 px, d1 headings ≥ 36 px);
     - bottom-anchor the action group in the thumb zone (`justify-content: space-between` on the phone content column);
     - give the 360 hero globe a floor of 30svh.
   - Files: `site/assets/css/home.css`, `site/assets/css/base.css` (shared phone column rule), `site/assets/css/partners.css`.

6. **The partner application is too long per step and in total.**
   - Desktop step 1 shows 5 fields across two groups, "Your Business" and "How to Reach You", which breaks the §4.2 P rule of ≤ 4 fields per step (`partners/1440x900/05-apply.png`).
   - Phone shows "Step 1 of 8" (`partners/390x844/05-apply.png`). Eight steps signals a long form to a busy professional.
   - Fix: regroup into the 4 steps the spec names, with ≤ 4 fields each, and show "Step 1 of 4" on every width. On phones, page within a step rather than counting half-steps as steps.
   - Files: `site/partners.html`, `site/assets/js/partners-form.js`.

7. **The services finder select is truncated on phone.** At 390 the select reads "Choose a ser▾" (`services/390x844/06-finder.png`). Stack the two fields on phones, or shorten the placeholder to "Service". File: `site/assets/css/services.css`.

8. **The legal Q&A pager underfills.** 3 items per page with one open leaves about 400 px of empty bone at 1440x900 (`legal/1440x900/06-faq.png`). Let the pager's `pageWhen` fit 4–6 items on wide screens. Files: `site/assets/js/legal.js` / `site/assets/css/legal.css`.

### Low

9. **Small alignment nits.**
   - The ghost numeral "3" on the home doors crosses the right gutter: x≈1375 against 1368 at 1440, and 1220 against 1216 at 1280.
   - The home `#one-message` eyebrow is orphaned top-left while the strike list sits in the right half, leaving the top-left quadrant blank. Put the eyebrow over the strike column, or move the strikes to cols 1–6 as the spec says.
   - The home `#close` R rows sit about 30 px under the CTA row while 100 px of field is spare below. Add space above the hairline.
   - Desktop credits float with about 220 px of empty field above and below. Bottom-anchor the block.
   - Files: `site/assets/css/home.css`, `site/assets/css/base.css`.

10. **Map labels and captions collide.**
    - "A Professional Near You" overlaps the map edge at the arc end (`index/1440x900/05-find.png`).
    - On phone, "Illustration only." sits at the top of the header band, and the arc label sits about 20 px above the eyebrow (`index/390x844/05-find.png`).
    - Files: `site/assets/js/dotglobe-draw.js` (label placement), `site/assets/css/home.css`.

11. **The review evidence shows a stale globe that real users never see.**
    - In the shoot set, services `#close` shows the full Canada map behind "Ask Once. It's Handled." and story `#close` shows the logo ring through the statement (`services/1440x900/08-close.png`, `services/390x844/08-close.png`, `story/1440x900/05-close.png`).
    - Live on dist, both closes are clean, whether reached by key walk or by hash jump.
    - Cause: the `goTo(i, {immediate:true})` path through a `hidden` scene into `medallion` keeps the previous map or ring state drawn. It only misleads reviewers today, but any future immediate jump (restore, history) would hit it.
    - Fix: reset morph and ring and set alpha to 0 on an immediate `hidden` placement.
    - File: `site/assets/js/dotglobe.js`.

## What would take this to 8

- Fix findings 1–3, so that no scene reads as unfinished.
- Make the phone pass in finding 5, so phone scenes are composed with the action in the thumb zone and headlines at the spec sizes.
- Then the remaining gap is wow, which belongs to the motion judge. In stills, the home founder doors, the find map, the story logo and every close medallion are now genuine, memorable frames. Services and partners need one frame each at that level.
