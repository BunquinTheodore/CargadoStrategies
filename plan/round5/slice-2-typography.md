# Gate G3 · Home slice, round 2 · Typography judge

Lens: the `judge-typography.md` rubric, with DIRECTION §4.1 (type rules) and §7.1 (Home) as the target. The audience is Canadians aged 30-45 on mid-range phones. The brief is wow factor, unforgettable, not clogged and modern. A score of 8 means award-shortlist quality with zero clutter.

Evidence:
- Screenshots in `plan/round5/shots-r5/slice-2/` (scenes at rest at 1440x900, 1280x720, 390x844 and 360x740, plus mid-cut frames).
- A live computed-style and geometry scan of every visible text node in each Home scene at the same 4 viewports. I served `dist` (built 19:56, newer than every source file it uses) on port 8359 and used headless Chrome with an isolated profile. The film was exposed with the same in-flight chunk rewrite `shoot.mjs` uses. The script and output are in the session scratchpad at `typo2/scan.mjs` and `typo2/scan.json`.

---

## Score: **7.5 / 10** (gate needs ≥ 8; not passed yet)

This is up from 7 in slice 1. Six of the twelve slice-1 findings are cleanly fixed: F1, F2, F3, F4, F5, F6, and F11 as well. The desktop page now reads as composed, not just correct. What keeps it under 8:
- one visible typographic bug on the smallest phone (N1);
- a hierarchy inversion inside the founder doors (N2);
- two monument scenes whose composition still leaves dead bands or tucks text under the header (F7, N3);
- a short list of slice-1 details that are still open (F8, F9, F10 at 360, F12).

None of these is a system problem. All are placement and sizing fixes in `home.css`, plus two small markup edits.

| Rubric area | Verdict | Measured |
|---|---|---|
| Scale contrast | **Strong.** Mega, statement, d1, d2 and quote are distinct steps. "One *Message*●" is a real poster frame. | Hero H1 103.8 px @1440 / 86.2 @1280 / 44 phone. Mega 151 / 115.2 / 60.5 / 55.8. Close statement 94.5 / 36 phone. |
| Phone hero | **Good.** The claim plus one CTA owns the first screen. | H1 44 px over 3 lines, lead 17 px Manrope 500. |
| Small-text floor | **Passes everywhere.** | The smallest text is 14 px Poppins (eyebrows, "Illustration only.", switches, ©). Fine print is 16 px (15 px on phones). |
| One face, one job | **Passes.** Poppins appears only on eyebrows, buttons, tags, nav and switches. | Situation tags are Poppins 16/15 px sentence case, which §4.1 allows. The step labels are now Manrope 600 (F3 fixed). |
| Human voice in Times italic | **The best thing on the page.** | Situation quotes 43.5 px @1440, 34.5 @1280, 24 phone. Door quotes 41.9 / 33.2 / 24. |
| One uppercase string per scene | **Passes.** | Only the eyebrow is uppercase on every scene. |
| Italic clipping | **Fixed.** "*Herself*" keeps its f terminal at every viewport. | `fx.css` `.w` now has a .14em inline overhang. |
| Composition and execution | **Not yet award quality.** | See N1-N5 and the open slice-1 items. |

---

## Ranked findings

Every finding names the repo-relative file that must change. Ownership follows `build-order.md`: stage 3 (Home) owns `site/index.html` scene content, `home.css` and `home.js`. Stage 2 owns `base.css`, `fx.css`, `ui.css` and the shared footer nodes.

### Must fix for 8

**N1 · High · At 360 px the first strike line wraps, so the strike bar runs between the lines and "Near Me”" is left unstruck.** File: `site/assets/css/home.css` (§9 phone band, `.one__strike > li`). The root cause is in `site/assets/css/fx.css` (§4).
- At 360x740, "Searching “Broker Near Me”" at 28 px needs about 333 px but gets 320. It sets on 2 lines (y 102-165).
- The bar is one `li::after` at `top: 54%` of the whole li, so it draws a gold rule in the gap between the two lines, like an underline under "Broker". "Near Me”" stays unstruck (`360x740/02-one-message.png`).
- This is the signature W2 moment, broken on the most common budget-phone width.
- **Fix (home.css, owner stage 3):** in the phone band, add `.one__strike > li { white-space: nowrap; font-size: min(1.75rem, 7.6vw); }`. That gives 27.4 px at 360, and the line fits.
- **Hardening (fx.css, stage 2, shared request):** draw the bar per line, either with `text-decoration: line-through` on the `s` element (with `text-decoration-thickness` and `text-decoration-color: var(--accent)`) or with a `background-image` linear gradient on an inline `s` using `box-decoration-break: clone`. Then a wrap can never break the strike again.

**N2 · High · Inside each founder door the quote is larger than the door title, and the ghost numerals sit behind the quote words.** File: `site/assets/css/home.css` (§5, `.founder__doors .door__q`, `.founder__doors .ghost`).
- At 1440, "Protect." is Times roman at 40.3 px and the quote under it is Times italic at **41.9 px**. At 1280 the two are 35.4 and 33.2 px. That leaves two serif lines of nearly the same size stacked on top of each other, so neither one leads.
- Each door then adds an offer line, fine print and a CTA. That makes five type tiers, which is the most crowded block on the page.
- The 414 px ghost "2" sits right under "My", and "3" sits under "Doing" (`1440x900/04-founder.png`). At 14% ink this still reads, but it is a collision, not a layer.
- **Fix:**
  - Make the title the voice and the quote the echo: `.founder__doors .door__q { font-size: min(var(--fs-d3), 4cqh); }`. That is about 30-32 px at 1440, 2 lines, clearly under the 40 px title.
  - Or keep the quote large and drop the visible title to an eyebrow-size label. Do not keep both at the same size.
  - Shrink the ghost so its glyph lives in the empty band above the titles (380-530 px at 1440): `font-size: min(var(--fs-ghost), 30svh)` with `top: 0`. Text then never sits on top of it.

**N3 · Medium · Two scenes tuck their first line under the header.** Files: `site/assets/css/home.css` (§2 `#hero` laptop-short, §3 `#one-message`). If the shared top padding is the cause, also `site/assets/css/base.css` (`--scene-pad-top`, a shared request).
- **H2 "How It Works":** the eyebrow top sits 13 px under the header at 1440 (header bottom 63, eyebrow at 76). At 1280 it is 10 px (56 against 66), and at 360 it is 10 px. On 1440 the strikes start at y = 77, so the whole top group touches the nav bar. Every other scene leaves at least 76 px at 1440.
- **H1 hero at 1280x720:** the eyebrow sits at y = 66 against a 56 px header, and the H1 starts at 88, so the hero reads as pushed up against the nav (`1280x720/01-hero.png`). §7.1 asks for the copy to be bottom-anchored at 62% of the height. Here it fills the whole height.
- **Fix:**
  - Give `#one-message .scene__pan` a top inset of at least `var(--space-xl)` (about 48 px) under the header.
  - In the laptop-short band, cap `.hero__title` at `11svh` instead of 12.5svh. That frees about 30 px, so the eyebrow clears the header by at least 32 px.
  - In the same band, let the 2-line trust line go to 1 line by widening `.hero__trust` (see N4).

**F7 (open from slice 1) · Medium · On phones, H2 still has two dead bands.** File: `site/assets/css/home.css` (§9 phone band, `.one__title`).
- At 390x844 the strikes end at y 216, the monument is at 388-455 and the steps start at 634. That leaves about 172 px of empty bone above the monument and 179 px below it (`390x844/02-one-message.png`, and likewise at 360).
- The CSS comment says "no dead band", but `margin-block: auto` centres the monument and splits the gap in two.
- At 60 px on one line, "One *Message*●" already uses 337 of 350 px, so it cannot grow on one line.
- **Fix (and the phone's missing wow):** set the monument as 2 lines on phones:
  ```css
  .one__title { font-size: clamp(4.5rem, 23vw, 6rem); line-height: .9; }
  .one__title .w + .w { display: block; }
  ```
  Or put a `<br class="phone-only">` in `site/index.html`. "*Message*●" at about 88 px is about 308 px wide, and it fills the dead band with the page's best word. Keep `margin-top: auto` so the monument sits on the steps.

### Should fix (each one moves the page toward 8.5)

**N4 · Medium-low · A hanging middot in the hero trust line on desktop.** Files: `site/index.html` (`.hero__trust`) and `site/assets/css/home.css` (§2 `.hero__trust`).
- At 1440 and 1280, line 1 ends "…Licence shown where one applies ·" and line 2 is "Replies within 24 hours". A separator that ends a line looks like an error under a display headline.
- **Fix:** in the HTML, set the four items as two `white-space: nowrap` pairs ("No fee to you · No obligation" and "Licence shown where one applies · Replies within 24 hours") and join them with a plain space, so any break falls between the pairs. Or, at 1440, drop the `max-width: 52ch` so the line fits on 1 line (the copy column is about 790 px and the line is about 700 px). Keep the copy verbatim.

**F10 (open at 360) · Low · The hero eyebrow still wraps with a hanging middot at 360.** File: `site/index.html` (hero eyebrow), or `home.css`.
- At 390 it now fits on one line. At 360 it is "FREE INTRODUCTIONS · / ACROSS CANADA" (y 180-218, 2 lines).
- **Fix:** `<span class="nw">Free Introductions</span> · <span class="nw">Across Canada</span>`, or drop the tracking to `.08em` below 380 px, which fits in 320 px.

**F9 (open from slice 1) · Low · Situation row 03 still wraps alone at 1440.** File: `site/assets/css/home.css` (§4 `.sit__rows`).
- Row 03 breaks as "If something happens to / me, is my family OK?" (2 lines, y 535-633). The other three rows set on one line each, so this row is 50% taller and splits "to / me" (`1440x900/03-situations.png`).
- At 1280, the stacked-tags layout fits all four rows on one line each and looks better.
- **Fix:** use the 1280 layout (tags under the quote) up to about 1500 px wide, or narrow the tag column to `minmax(0, 15rem)`. As a last resort, write "to&nbsp;me" in `site/index.html`.

**F8 (open from slice 1) · Low · Small serif in the credits.** Files: `site/assets/css/base.css` (footer and credits) and the shared footer nodes in `site/index.html` (stage 2b; shared request).
- The tagline "Connected by Purpose. United in Service." is Times italic at **18 px** (16 px on phones) at 82% ivory on ink. The wordmark is 24 px (20 px on phones). §4.1 sets Times at 28 px or more, and quotes at 24 px or more on phones.
- On phones, the contact label "[company email]" also wraps to 2 lines under its icon, making it the only 2-line label in the icon row (`390x844/07-credits.png`).
- **Fix:** set the tagline in Manrope 500 at `--fs-note`, or in Times italic at 24 px or more. Give the icon labels `white-space: nowrap`, and let the email cell span 2 columns on phones.

**F12 (open from slice 1) · Low · Outline numerals on bone are still close to invisible.** File: `site/assets/css/base.css` (`--stroke-num` on `[data-field="bone"]`, still `.45`).
- The situation row numerals (32 px at 1440, 26 px on phones) and the step numerals (26 px on phones) read as smudges. See "01"-"04" in `390x844/03-situations.png`.
- **Fix:** raise the bone `--stroke-num` to `.65`, or use a 1.25 px stroke below 40 px.

**N5 · Low · The phone hero lead runs 6 lines.** File: `site/index.html` (hero lead), copy owner's decision.
- At 390 and 360 the lead is 6 lines of 17 px (y 474-624). It is the densest block above the CTA on the first screen.
- The copy is spec text, so this is not a defect. A `.short-hide` on "She handles insurance, business strategy and outsourcing herself, and" would take it to 3 lines on phones only, because the founder scene says the same thing two scenes later. Do this only if the copy owner agrees.

### Verified fixed since slice 1 (do not regress)
- **F1:** the close rows stack the meta under the title. "For Professionals" (x 758-1031) no longer touches its meta, and `[to be confirmed]` is gone from the build.
- **F2:** the italic "f" in *Herself* is intact at 1440, 1280, 390 and 360.
- **F3:** the steps read "Now / Within 24h / Day 3" in Manrope 600, sentence case, accent colour. There is one uppercase string per scene.
- **F4:** the "g" of *Message* clears the steps hairline at 1280 (glyph bottom about 575 px, rule at about 607 px).
- **F5:** the door titles share one baseline (all at y 537 @1440 and 368 @1280).
- **F6:** each door has one numeral (the ghost). `.door__n` is gone.
- **F11:** there is no stray arc label behind the medallion at 360.

---

## Keep (do not lose these while fixing)
1. "One *Message*●" at 151 px over four struck italic searches. It is the unforgettable frame.
2. The situation rows: Times italic quotes with curly quotes, sentence-case tags, hairlines and arrows.
3. The hero's 3-line statement with the gold italic "*Near You*●".
4. The close monument "One Message. The Right Person. Close to *You*●" under the medallion, with the two serif rows below.
5. The 14 px floor, the 16/15 px fine print, and one uppercase string per scene.

## Path to ≥ 8
1. N1 (strike wrap at 360), N2 (door hierarchy and ghost collision), N3 (header crowding) and F7 (2-line phone monument). All four are in `home.css`; N1 also files a shared request for the `fx.css` hardening.
2. Rebuild and re-shoot the four review viewports.
3. With those four in, I would score **8**. Adding N4, F9, F10 at 360 and F12 makes it **8.5**.
