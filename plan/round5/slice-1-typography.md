# Gate G3 · Home slice · Typography judge

Lens: the `judge-typography.md` rubric, with DIRECTION §3 (tokens), §4.1 (type rules) and §7.1 (Home) as the target. The audience is Canadians aged 30-45 on mid-range phones. The brief is wow factor, unforgettable, not clogged and modern. A score of 8 means award-shortlist quality with zero clutter.

Evidence:
- Screenshots in `plan/round5/shots-r5/slice-1/` at 1440x900, 1280x720, 390x844 and 360x740 (scenes at rest).
- A live computed-style scan of every visible text node in each Home scene at the same 4 viewports. I served `dist` on port 8354 and used headless Chrome with an isolated profile. The scripts are in the session scratchpad `typo/scan.mjs` and `typo/probe.mjs`.
- Live geometry probes of the close rows, the founder headline, the door titles and the step labels.

**Build note:** `dist/index.html` (16:30:06) is older than `site/index.html` and `site/assets/js/config.js` (16:31). In `dist`, the owner updates are not live yet. It still shows `[First name]`, `[24h]`, `[3]`, `[2] spots` and `[24 hours]`. The source already has "Lee", "Within 24h", "Day 3", "2 spots" and "24&nbsp;hours". I scored the build and say below which findings a rebuild clears.

---

## Score: **7 / 10** (gate needs ≥ 8; not passed yet)

This is a large step up from Round 4's 6/10. The system is now right, and most of what keeps the page from an 8 is execution: one visible collision, one clipped glyph and a handful of second-voice details. I expect it to reach 8 or 8.5 once the four items in "Must fix for 8" are done and the site is rebuilt.

| Rubric area | Verdict | Measured |
|---|---|---|
| Scale contrast (B-2) | **Fixed.** Mega, statement and d1 are clearly separate steps, and "One *Message*●" at 151 px is a real poster moment. | Hero H1 103.75 px @1440 (spec 104), 86 px @1280, 44 px phone (spec 44). Mega 151 / 115 / 56 px. Close statement 94.5 px (the `10.5svh` cap). |
| Phone hero (B-3) | **Fixed.** 44 px over 3 lines, with the form gone, so the claim plus one CTA owns the first screen. | H1 44 px, lead 17 px Manrope 500. Ratio 2.6:1 (was 2.2). |
| Small-text floor (B-1, B-13) | **Fixed.** Nothing renders below 14 px at any viewport. Fine print is 16 px (15 on phones). | The smallest style is 14 px Poppins (eyebrow, "Illustration only.", ©, switches). |
| Faces have one job each (B-4) | **Mostly fixed.** Times is used for display and quotes, Manrope for reading text and Poppins for the UI. | Poppins appears in content in only two places: the situation tags (allowed as "tags" in §4.1) and the step labels (not allowed; F3). |
| The human voice in Times italic (B-6) | **Fixed, and it is the best thing on the page.** The situation rows and door questions are lovely. | Quotes 43.5 px @1440 and 24 px on phones (that 24 px phone floor is met). |
| Placeholders (B-5) | **Fixed in style.** The dotted quiet `.ph` reads as intentional. | The issue now is content inside placeholders, which a rebuild fixes (F2). |
| Title Case length (B-8) | **Fixed.** Every Home heading is 7 words or fewer. | |
| Full stop and accent | Once per scene, carried by the italic accent word. It works as a signature. | It appears on Hero, H2, H4 and H6. H3 and H5 are questions with no stop, which is correct. |
| Execution defects | **Not yet award quality.** See F1-F4. | |

---

## Ranked findings

Every finding names the repo-relative file that must change. Ownership comes from `build-order.md`: stage 3 (Home) owns `site/index.html` scene content, `home.css` and `home.js`. Stage 2 owns `base.css`, `fx.css`, `ui.css` and the shared footer nodes.

### Must fix for 8

**F1 · High · The "For Professionals" row title collides with its meta text on desktop.** File: `site/assets/css/home.css` (§7 `.closing__rows`).
- At 1440x900, `.row__title` gets a 160 px column. "Professionals" in Times 40 px is about 210 px wide, so it runs over the meta text "Be found close to home · terms [to be confirmed]". The probe measured title box x 751-911 against meta x 940, with the glyphs overflowing into the meta.
- At 1280x720, both titles break ("Our / Story", "For / Professionals"), and the overlap is worse (`1280x720/06-close.png`).
- `[to be confirmed]` also splits across 2 lines.
- These are the last rows on the page before the footer, and a typographic crash there is the first thing a reviewer will screenshot.
- **Fix:** give the closing rows their own columns, `grid-template-columns: max-content minmax(0,1fr) auto`, with the title `white-space: nowrap`. Or stack the meta under the title on desktop too, since the phone layout already does that and looks better. Add `.row__meta .ph { white-space: nowrap; }`.

**F2 · High · The italic "f" in "*Herself*" is clipped, and the placeholder breaks the founder headline.** Files: `site/assets/css/fx.css` (line 12, `.rv-mask, .w`) and a **rebuild** of `dist`.
- `.w { overflow: clip }` has no inline overhang allowance, so the Times italic "f" loses its right terminal. It reads "Herselſ" at every viewport (`1440x900/04-founder.png`, `390x844/04-founder.png`, `360x740/04-founder.png`).
- The same mask will clip any italic accent that ends in f, j or y.
- **Fix:** add `padding-inline: .06em .14em; margin-inline: -.06em -.14em;` to `.w` (mirroring the existing `.08em` block padding), or use `overflow-clip-margin: .15em`.
- The current `dist` also sets "Three Things [First / name] Does Herself." with the bracket broken across lines. The source fills "Lee" at runtime, which gives a clean 2-line "Three Things Lee / Does *Herself*●". Rebuild, then re-shoot.

**F3 · Medium · There is a second uppercase tracked voice in H2.** File: `site/assets/css/ui.css` (§6 `.steps__when`).
- "NOW / WITHIN 24H / DAY 3" use the eyebrow style (Poppins 14 px, uppercase, 0.12 em, accent colour) on the same scene as the "HOW IT WORKS" eyebrow. §4.1 says the only uppercase tracked string on a scene is the eyebrow.
- It also produces "WITHIN 24H", with "h" forced to uppercase, once the brackets are gone.
- **Fix:** sentence case Manrope 600 at `--fs-note` in `--accent`, no tracking, for example "Now", "Within 24h", "Day 3". The `.ph` exemption line under it can then go.

**F4 · Medium · The mega descender hits the steps hairline at 1280x720.** File: `site/assets/css/home.css` (§3, `.one__title` / `#one-message .scene__pan`).
- The "g" of "*Message*" sits on the steps strip's top rule (`1280x720/02-one-message.png`, both at y ≈ 608). At 1440 it clears by about 18 px.
- **Fix:** add `margin-bottom: .18em` (descender room) to `.one__title`, or cap it at `min(var(--fs-mega), 15svh)` in the laptop-short band.

### Should fix (each one moves the page toward 8.5)

**F5 · Medium · The door titles do not line up across the three doors.** File: `site/assets/css/home.css` (§5 doors).
- Because each door's content is bottom-aligned, "Plan." sits 70 px higher than "Protect." and "Delegate." (title tops at 562 / 492 / 562 @1440, and 437 / 366 / 437 @1280). The eye reads that as an accident, not as a rhythm.
- **Fix:** use a subgrid (`grid-template-rows: subgrid` over title / quote / offer / fine / CTA), or top-align the title and quote and bottom-align only the fine print and CTA. Either way, the three titles share one baseline.

**F6 · Medium · Each door has two numerals.** File: `site/index.html` (the `.door__n` spans in `#founder`) with `site/assets/css/home.css` line 78.
- A Poppins 14 px tracked "01" sits next to "Protect." while a 414 px ghost "1" sits behind it. The Round 4 typography report (I-8) asked for "one numeral per row".
- **Fix:** the ghost numeral carries the number. Delete `.door__n` and keep "01" only as visually hidden text if screen readers need it.

**F7 · Medium · The phone H2 has a dead band between the monument and the steps.** File: `site/assets/css/home.css` (§3 phone band).
- At 390x844, "One *Message*●" sits right under the strikes (y ≈ 280), and the steps are pinned to the bottom (y ≈ 630), which leaves about 330 px of empty bone in the middle (`390x844/02-one-message.png`).
- §7.1 asks for "the monument at 56 px" on phones, and the size is right (56 px measured), but the composition puts the monument in the middle of nothing.
- **Fix:** pin the monument with `margin-top: auto` directly above the steps, as desktop already does, so the strikes sit top and the statement plus its steps sit bottom. On phones the monument could also go to 64 px (8 letters fit at 390).

**F8 · Low-medium · Small serif in the credits.** Files: `site/assets/css/base.css` (footer and credits) and the shared footer nodes in `site/index.html` (stage 2b).
- The wordmark is Times 24 px (20 on phones). The tagline "Connected by Purpose. United in Service." is Times **italic 18 px** (16 on phones) on ink.
- §4.1 says Times ≥ 28 px (quotes ≥ 24 on phones). At 16-18 px italic on black, Times hairlines break up, which is the B-7 problem again.
- **Fix:** tagline at `--fs-quote` (24 px phone floor), or Manrope 500 at `--fs-note`. Wordmark at `--fs-d2`, or keep it as the logo lockup only.

**F9 · Low · The situation quote rows wrap unevenly at 1440.** File: `site/assets/css/home.css` (§4 `.sit__rows`).
- Rows 01, 02 and 04 set on one line, but 03 breaks as "If something happens to / me, is my family OK?". It splits "to / me" and makes one row 50% taller (`1440x900/03-situations.png`).
- At 1280, the tags-under-quote layout fits all four rows on one line each, and it looks better.
- **Fix:** narrow the tag column (`minmax(0, 22ch)`), or use the 1280 stacked meta from 1280 up to about 1500. If a wrap is unavoidable, a `<wbr>`/nbsp in "to&nbsp;me" makes the break "happens / to me".

**F10 · Low · The phone eyebrow wraps with a hanging middot.** File: `site/index.html` (hero eyebrow).
- "FREE INTRODUCTIONS · / ACROSS CANADA" at 390 and 360. The "·" ends line 1.
- **Fix:** wrap each half in a `white-space: nowrap` span, or put the middot in `.short-hide` and set the phone version as two clean lines.

**F11 · Low · A stray arc-label fragment appears behind the medallion at 360x740.** File: `site/assets/js/home.js` (H6 medallion choreography), or `dotglobe.js` if the label belongs to the globe stage.
- On `#close`, the map and its label "…nal Near You" are still drawn behind the medallion (`360x740/06-close.png`). Stray clipped words are a typographic blemish on the final monument.
- **Fix:** hide the arc label when the globe leaves `#find`.

**F12 · Low · The outline numerals on bone are close to invisible.** File: `site/assets/css/base.css` (`--stroke-num` on `[data-field="bone"]`).
- The row numerals (26-32 px) and step numerals (26-75 px) use a 1 px stroke at `rgba(122,92,18,.45)`. At 26-32 px on phones they read as smudges ("01" in `390x844/03-situations.png`).
- They are `aria-hidden` decoration, so this is not an AA failure, but at this size they add noise rather than structure.
- **Fix:** raise the bone `--stroke-num` to `.65`, or use 1.25 px below 40 px.

---

## Keep (do not lose these while fixing)
1. "One *Message*●" at mega size over four struck italic searches. This is the page's unforgettable frame.
2. The situation rows: Times italic quotes, curly quotes, sentence-case tags and hairlines. This is what makes the page premium.
3. The hero 3-line statement with the gold italic "*Near You*●" and a 4-line lead at 40ch.
4. The close monument "One Message. The Right Person. Close to *You*●" under the medallion.
5. The 14 px floor and the 16 px fine print, with every compliance line readable at arm's length.
6. Fine print kept to one line or block per scene. H5's notice is 4 lines at 16 px, which is long but verbatim (compliance move 1), so it is acceptable.

## Path to ≥ 8
1. Rebuild `dist`, which clears the bracket breaks and the `[24h]` / `[3]` / `[24 hours]` leftovers.
2. Fix F1 (close-row collision), F2 (italic clipping), F3 (second uppercase voice) and F4 (descender collision).
3. Re-shoot the four review viewports.
4. F5-F7 are what lift the page from "correct" to "composed". I would score 8.5 with them in.
