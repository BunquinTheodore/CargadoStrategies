# Round 5 re-judge (round 1): Typography

**Overall: 7.5 / 10** (was 6 / 10 in `judge-typography.md`).

The lens and rubric are the same as `judge-typography.md`. Times New Roman is the display face in Title Case, Manrope is the body face and Poppins is the UI face. I judged scale, rhythm, measure, face roles, the floor, placeholders and readability for a 30-45 audience on mid-range phones, against DIRECTION §3/§4.1.

Evidence:
- `plan/round5/shots-r5/review-1/` contains 169 scene PNGs, mid-cut frames, and the fit, console and compliance outputs.
- My own live checks used `dist/` served on :8443, with headless Chrome on an isolated profile. The server has been stopped.
  - **Computed-style scan.** This covers every visible text element on all 5 pages, at 1440x900 and at 390x844 with touch, for 1,374 elements in total. The script is `scratchpad/typo/typescan.mjs` and its output is `scan.json`.
  - **Live close-scene captures.** I captured the close scenes through a deep link and again after sequential ArrowDown cuts, to separate real overlaps from shoot artefacts.

## 1. Scores

| Page | Was | Now | One-line justification |
|---|---|---|---|
| Home (index) | 6 | **8** | This is the strongest page. The hero is 104 px, "One *Message*●" is a 173 px mega moment, the situations are 24-48 px Times italic quotes and the doors are on metal. One accent and at most one stop per heading. The phone version is flatter: 5 of 7 headings sit at 36-44 px. |
| Services | 5 | **7.5** | The rows are clean, "The *30-Day* Cash-Flow Clean-Up" works at 104 px, and the includes list now uses Manrope 600 titles. Placeholders are quiet dotted underlines. On phones, the row titles drop to 26 px Times and the insurance heading runs to 9 words on 3 lines. |
| Story | 6.5 | **7** | "One Place. Not *Five*●" is the best moment on the site. The T1 statement is 11 words on 5 lines at 92 px, the monogram strokes cut through the bio text, and on phones the logo scene has lost its "small line / huge gold word" contrast. |
| Partners | 5.5 | **7.5** | The hero, the rows and the Times prices are all good, and the founding statement on metal is strong. The form section titles (Times, about 36 px) compete with the scene heading. On phones, the FAQ questions are 24 px Times and the hook is 22 px. |
| Legal | 6.5 | **7.5** | The reader is now 18 px at 1.7 line height with Manrope 600 clause titles. The contents rows use 56 px outline numerals and the draft band is 14 px. The document heads lost the giant outline numeral, and the clause numbers are 14 px Poppins. |
| **Overall** | 6 | **7.5** | The system is fixed and disciplined. It is not yet excellent, because the phone scale is timid and a few Times sizes fall below the floor. |

## 2. Before and after on the original defects (measured)

| Original defect | Status | Evidence |
|---|---|---|
| B-1 Small utility text (critical) | **Fixed** | **0 visible text elements below 14 px** in all 10 page × viewport scans (before: 23-33 items at 12 px per page, and 10-11 px on the legal banner). Notes are 16 px (15 px on phones), labels 15 px, eyebrows 14 px at 0.12 em, and the legal draft band 14 px. |
| B-2 Flat scale | **Fixed on desktop** | Display sizes at 1440 cover 56 / 66 / 92-104 / 173 px. The mega size is used twice ("One Message.", "One Place. Not Five.") and the statement size seven times. |
| B-3 Phone hero | **Partly fixed** | The H1 is 44 px against a 17 px lead (2.6:1; before 38 px and 2.2:1). This meets DIRECTION, but it is still the same size as the other phone headings (see F-1). |
| B-4 Three voices | **Fixed** | Poppins appears only in eyebrows, buttons, nav, tags, form labels, switches and the pager. **0 Poppins strings of 8 or more words** on any page, except the legitimate "Step 1 of 3 · Service and City". Styles per scene went from about 9 to a median of 7. |
| B-5 Loud placeholders | **Fixed** | `.ph` is a dotted underline in the current colour. Prices like `[$ per month]` are set in Times at d2. `[signature]` is a small caption. |
| B-6 Visitor voice in UI face | **Fixed** | Situations are Times italic (48 px desktop, 24 px phone). The door questions are Times italic. |
| B-7 Small serif on dark | **Mostly fixed** | Times below 28 px now only appears in the footer brand and tagline, and on phones in 7 places (see F-4). |
| B-8 Long Title Case | **Partly fixed** | Rewrites have landed ("One Place. Not Five.", "Clients Near You, Already Asking."). Story T1 (11 words) and services S2 (9 words) remain. |
| B-9 / B-12 Uppercase tags and labels | **Fixed** | One uppercase string per scene (the eyebrow) on all 36 scenes. Labels and tags are sentence case at 15-16 px. |
| B-10 Grey leads on dark | **Fixed** | The ink lead is Manrope 500 at 20 px in `#F3ECDD`, and notes on ink use `--c-ivory-2nd` (.82). |
| B-11 Word gaps | **Fixed** | Splitting is now by word (`rv-word`). I saw no uneven word spaces at either viewport. |

The accent and stop rules hold everywhere. Every scene heading has exactly 1 accent (`em`), and there are ≤ 1 `.stop` per scene on all 36 scenes.

## 3. Findings, ranked by severity

### F-1 · high · The phone display scale is flat again
At 390 px, the home headings are 44 (hero), 90 (one-message), 36, 36, 36 and 36 px. Services, story, partners and legal are similar: almost everything is 32-44 px, except the two mega scenes. The bookend closes, the brand's W5 moment, are hard-coded at the smallest size:
- `home.css:274` `.closing__title { font-size: 2.25rem }`
- `story.css:164` `2.25rem`
- `services.css:373` `2.5rem`

Each of these leaves about 200-250 px of empty space under the CTA (`index/390x844/06-close.png`, `story/390x844/05-close.png`). DIRECTION §6.4 allows `--fs-d1` on phones, so this is within spec. It still removes the scale change that makes scrolling feel cinematic on the device most of this audience uses.
- **Fix:** set the phone close to `min(var(--fs-statement), 9svh)` (44 px at 390x844, 40 px under the phone-tiny guard) with the token, not a literal.
- **Files:** `site/assets/css/home.css`, `site/assets/css/story.css`, `site/assets/css/services.css`.

### F-2 · medium · The story logo scene lost its "small line / huge word" on phones
On desktop, "W Stands for" (36 px) sits over *Wealth.* (about 60 px). On a phone, both lines are set inline at about 26 px (`story/390x844/03-logo.png`). That was the one moment the original judgement asked to make the pattern for the site.
- **Fix:** on phones, keep the lead line at `--fs-d2` and break the gold word onto its own line at `--fs-statement` (44 px). There is room above and below the mark.
- **File:** `site/assets/css/story.css`.

### F-3 · medium · The monogram strokes cut through the story T1 bio text
In `.top__tportrait`, the W and C strokes of `.tportrait__mark` run behind and through the 24-30 px Times bio placeholder and the `[Signature]` caption, on both desktop and phone (`story/1440x900/01-top.png`, `story/390x844/01-top.png`). Gold hairlines crossing serif glyphs at reading size make the text noisy.
- **Fix:** lower the mark stroke to about .18 alpha on ink behind text, or put a soft ink scrim behind the figcaption.
- **Files:** `site/assets/css/story.css`; for the shared mark opacity, `site/assets/css/visual.css`.

### F-4 · medium · Times is still set below its floor in a few places
DIRECTION §4.1 sets Times at 28 px or more, with quotes allowed down to 24 px on phones.
- **Footer, every page:** the brand is Times at 24 / 20 px and the tagline is Times italic at 18 / 16 / 15 px on ink (`base.css:509`, `:530`, `:548`). These thin hairlines on black are exactly B-7. Either set the tagline in Manrope italic 16 px, or raise it to 24 px Times italic on its own line.
- **Partners, phone:**
  - The FAQ question rows are Times at 24 px. They are questions, not quotes, so the floor is 28.
  - The hook "First 2 partners per service, per city: [founding offer]." is Times italic at 22 px.
- **Services, phone:** the intro row titles ("Insurance", "Nine Kinds of Help, Near You") are Times at 26 px.
- **Files:** `site/assets/css/base.css`, `site/assets/css/partners.css`, `site/assets/css/services.css`.

### F-5 · medium · Two heavy Title Case statements remain
- **Story T1.** "I Started Cargado So Good People Wouldn't Have to Search *Alone*●" is 11 words on 5 lines at 92 px. It is the densest display block on the site, and it sits next to the bio.
- **Services S2.** "If Something Happens to You, Is Your Family *OK*?" is 9 words on 3 lines.

Both are DIRECTION-verbatim, so changing them is a copy decision for the owner. I am logging it rather than calling it a build defect. Options:
- shorten T1 (for example, "So Good People Never Search *Alone*●");
- cap the T1 size at `--fs-d1` on desktop, so 11 words take 4 lines.

**File:** `site/story.html`, after the owner signs off on the copy (raise in `plan/round5/shared-requests.md`).

### F-6 · low · Form section titles compete with the scene heading on partners apply
"Your Business" and "How to Reach You" are Times at about 36 px inside the paper, beside the 56 px H2 "Apply to *Join*●". That gives three Times headings in one scene (`partners/1440x900/05-apply.png`). Original I-5 recommended Manrope 600 at 18-20 px for form section titles; services' "What You Need" has the same issue.
- **Files:** `site/assets/css/partners.css`, `site/assets/css/services.css`.

### F-7 · low · The outline numerals are faint on bone
`--stroke-num: rgba(122,92,18,.45)`, a 1 px stroke at 40-56 px, makes the situations, includes, legal contents and one-message step numerals look washed out (`index/1440x900/02-one-message.png` "1 2 3", `services/1440x900/04-ours-includes.png`). They are decoration, so this is not a contrast failure, but at arm's length they disappear.
- **Fix:** raise bone `--stroke-num` to about .6, or use a 1.25 px stroke at 48 px and above.
- **File:** `site/assets/css/base.css`.

### F-8 · low · The legal document heads lost the editorial numeral
The original judgement's "Good #3" was the giant outline "02" over the Privacy title. It is gone. The document scenes now use a 14 px Poppins "02 / 05 · Privacy" eyebrow plus 14 px Poppins clause numbers. A single `--fs-num` outline numeral beside "Privacy *Policy*" would restore the calm editorial moment without adding clutter.
- **File:** `site/assets/css/legal.css` (plus the markup in `site/legal.html`).

### F-9 · low · The phone hero drops one trust phrase
`.phone-hide` removes "Licence shown where one applies" from the hero trust line at 390 px. It is not on the compliance list, but it is the line that answers "is this legit?" for this audience. If it is hidden only for fit, consider swapping it in for "No obligation" on phones.
- **File:** `site/index.html`.

### F-10 · low · Evidence caveat: the scene shots show overlaps that are not real
`review-1/services/*/08-close.png` shows the finder's Canada map running through "It's *Handled*●", with the arc crossing the link and the medallion covering the "A Professional Near You" label on phone. `story/1440x900/05-close.png` shows the C-ring dust crossing "Tell Me What You Need…".

Live captures of dist did not reproduce either overlap: both close scenes were clean when reached by deep link and when reached by two sequential ArrowDown cuts. The leftover globe state comes from `shoot.mjs` seeking to a medallion scene, not from the site. Other reviewers should not score these shots as defects.
- **Fix:** let the globe/medallion tween settle (or call the dotglobe settle) before capturing medallion scenes.
- **File:** `tools/shoot.mjs`.

## 4. What would make it an 8.5+
1. F-1 and F-2: give the phone at least three scale steps (36 / 44 / 56+). Put the closes at statement size and restore the logo-scene contrast.
2. F-4: remove the last sub-28 px Times (footer tagline, phone FAQ questions, phone row titles).
3. F-3 and F-5: clean up the story T1 composition (the scrim, and a shorter or capped statement).
4. F-7 and F-8: make the numerals visible on bone and give legal back its single editorial numeral.
