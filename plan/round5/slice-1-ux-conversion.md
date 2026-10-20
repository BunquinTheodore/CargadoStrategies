# Gate G3 · Home slice · UX and conversion judge

Lens: the same as `judge-ux-conversion.md`. Can a Canadian aged 30 to 45, on a mid-range phone, tell **what Cargado is within 5 seconds, who it is for, and what to do next**? Does the page feel like a wow, not clogged, and modern? The target is DIRECTION §7.1. An 8 means award-shortlist quality with zero clutter.

**Evidence**
- `R` = `plan/round5/shots-r5/slice-1/` (shared run, 08:37, from the production build), covering all 4 viewports, the cuts and the W1 sequence.
- `L` = my live checks, all on port 8353 with headless Chrome on an isolated profile.
  - **Dist** (`dist/`, built 16:30) at 1440x900, 1280x720, 390x844 (touch) and 360x740 (touch).
  - **Source** (`site/`, newer than dist) at 1440x900 and 390x844 (touch).
  - For each scene I measured words, fine print, controls, targets under 44 px, text under 15 px and visible `[brackets]`.
  - I also clicked through 6 flows: hero CTA, "Or Call / Email Us", header WhatsApp, door 02 CTA, `#find` CTA and the FAQ link.
  - Frames are in `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\g3ux-live\` (dist) and `…\scratchpad\g3ux-site\` (source).

**Re-check (17:55).** No file in `site/`, `dist/` or `tools/` has changed since this report was first written (16:51). I served dist on 8353 again and re-ran the probe at 1440x900 and 390x844 (touch); frames are in `…\scratchpad\g3ux-recheck\`. Every finding below still holds:
- `[First name]` appears 3 times, alongside `[24 hours]`, `[24h]` and `[3]` (finding 2).
- "Or Call / Email Us" still opens the sheet at "Step 3 of 3 · Open WhatsApp" (finding 3).
- "terms [to be confirmed]" is still in the close rows (finding 1).
- The stage is 1425 px wide in a 1440 px viewport while `clientWidth` reads 1440 (finding 8). The fixed `inset: 0` stage loses the reserved gutter, so `scrollbar-gutter: stable` is the likely cause. Verify by toggling it.
- The founder scene now has 60 words plus 29 fine-print words at 1440 (finding 7).
- Splash-done was measured at 1248 ms (1440) and 1530 ms (390 touch).

The score is unchanged.

---

## 1. Score

| Page | Score | One-line justification |
|---|---|---|
| Home (`index.html`) | **6.5 / 10** (was 4.5) | It is now a 6-scene film. It has one clear promise, a named founder (in source), three CTA verbs and a persistent WhatsApp button on phones, so it passes the 5-second test. It is not award-grade yet. The last conversion screen has a visible text collision, the "Call / Email" path dumps people into a WhatsApp step, phone scenes 2 to 4 leave 30 to 40% of the screen empty, there is still no face, and the shipped `dist/` still shows `[First name]` and bracketed numbers. |

**Not a pass (needs ≥ 8).** Findings 1 to 5 are what stand between this page and an 8. None of them needs a new design direction.

---

## 2. What is good (keep)

1. **The 5-second test passes.**
   - "The Right Professional, *Near You*●" is on screen within about 1.25 s of navigation (splash-done measured at 1229 to 1315 ms on dist, across all 4 viewports).
   - The lead names a person: "Send one message to Lee…" (source).
   - The brief's identity split (B1) is resolved: she does three things herself and introduces everyone else.
2. **The length is right.** 12 scenes became 6 plus credits. The video, compare, tile grid, partner pitch and FAQ scenes are gone, and the FAQ is now a dialog (L: it opens from the close link, with 4 exclusive items, verbatim).
3. **The CTA vocabulary is fixed.** Only 4 distinct button labels appear in `main` (L): "Get My Introduction" and "Ask About Insurance / the Clean-Up / Outsourcing". Every scene has at most one filled button, apart from the three doors.
4. **Thumb-reachable contact on phones.** The header shows a 44 px gold WhatsApp icon and "Menu" (`R/390x844/01-hero.png`). The hero CTA is full-width in the bottom quarter. The probe found no target under 44 px in any scene at 360 or 390.
5. **The sheet does what it promises.** A door CTA skips to step 2 with the need preselected (L, `door2-cta`: `pressed: business-strategy`, "From Lee" tag). Step 3 carries "Nothing is sent until you tap send." verbatim and a "Rather call or email?" line.
6. **The founder doors are the right idea, and the strongest frame on the page** (`R/1440x900/04-founder.png`). "Protect. / Plan. / Delegate." with the visitor's question in italics is easy to scan and reads as premium.
7. **The close scene earns its place.** The medallion, the three-line statement and one CTA make a calm, expensive ending (`L/g3ux-site/1440x900-06.png`), apart from the rows under it (finding 1).

---

## 3. Findings (ranked; each names the file that must change)

| # | Severity | Finding | Evidence | Fix | File |
|---|---|---|---|---|---|
| 1 | **High** | **A text collision on the last conversion screen.** In the close rows, "For Professionals" wraps to 2 lines and overlaps the meta "terms [to be confirmed]" at 1440x900 and 1280x720. The row also carries extra copy that is not in §7.1 (the spec has only "Be found close to home →"). | `R/1440x900/06-close.png`, `R/1280x720/06-close.png`, `L/g3ux-site/1440x900-06.png` | Remove "· terms [to be confirmed]" from the row. Give `.closing__rows .row__title` `white-space: nowrap` (or a title column of at least 15ch), with the meta in its own grid column, so the two never share space. | `site/index.html` (copy), `site/assets/css/home.css` (`.closing__rows`) |
| 2 | **High** | **The shipped build is stale.** `dist/index.html` (16:30) predates `config.js` and `index.html` (16:31). Live dist renders `[First name]` ×3, "Replies within [24 hours]", "Within [24h]" and "Day [3]". Source renders "Lee", "24 hours", "24h" and "Day 3". A client review on dist would show the old placeholders the owner asked to remove. | L: dist probe `founderName: ["[First name]"…]`, brackets `[24 hours]`, `[24h]`, `[3]`; source probe `["Lee","Lee","Lee"]`, no number brackets | Run `npm run build` before G3 is re-shot, then re-shoot slice-1 from the new dist. | `dist/` (orchestrator rebuild; no source change) |
| 3 | **High** | **"Or Call / Email Us" leads to a WhatsApp screen.** The link opens the sheet at step 3 "Open WhatsApp". The visitor sees the gold "Open WhatsApp →" button, an unfilled message ("What I need help with: …") and, at the very bottom, a small inline "+1 (204) 869 2508 · [company email]". The visitor who said "not WhatsApp" gets WhatsApp as the primary action. This is the roughly half of 35 to 54 year olds who do not use WhatsApp (research-audience §7). | L flow `call-email` at all 4 viewports; `L/g3ux-site/390x844-touch-flow-call-email.png` | `data-wa-sheet="contact"` should open a **contact view**: a full-width "Call +1 (204) 869 2508" button (`tel:`), then Email (or `[company email]`), then a quiet "Prefer WhatsApp? →" link that enters step 1. No unfilled message preview. | `site/assets/js/wa-sheet.js` (+ its skin in `site/assets/css/ui.css` §13) |
| 4 | **Medium-High** | **Phone scenes 2 to 4 are top-heavy, with 30 to 40% of the screen empty.** This reads as unfinished, not as deliberate whitespace, and it leaves the thumb zone empty. H2 has a ~300 px dead band between "One Message●" and the steps. H3's rows end at about 65% of the height and "See All Services" floats at the bottom. H4's three doors end at about 68%, against §W3's "each about 26% of the scene". "One Message" is about 44 px on phones; §7.1 asks for 56 px. | `L/g3ux-site/390x844-touch-02.png`, `-03.png`, `-04.png`; `R/360x740/04-founder.png` | H2: set the monument at 56 px and centre the strike + monument group in the space above the steps (or bottom-anchor the group onto the steps). H3: distribute the rows over the safe height (pitch 72 px plus `justify-content: space-between` within a cap), with the link directly under the last row. H4: make the stacked doors grow (`flex: 1`) so all three share the height and the open door's CTA lands in the lower third. | `site/assets/css/home.css` (phone block) |
| 5 | **Medium-High** | **There is still no human face.** The hero (the most valuable trust slot) and the founder scene name Lee but show no portrait. `FOUNDER_PHOTO = ''`, and the 40 px avatar slot is hidden. For insurance and money advice, a face plus a name is the strongest trust signal for this audience (judge-ux-conversion B3). | `config.js:63`; `R/1440x900/01-hero.png`, `04-founder.png` | Raise the photo to the top owner to-do. When it arrives, show the avatar slot (`data-when="FOUNDER_PHOTO"`) at 56 to 64 px beside the hero lead's "Lee", not only on H4. Do not invent a placeholder face. | owner (photo) → `site/assets/js/config.js` (2d, `FOUNDER_PHOTO`), `site/index.html` (hero avatar slot) |
| 6 | **Medium** | **The door CTAs open a sheet that ignores what was asked.** "Ask About the Clean-Up →" opens a sheet titled "GET MY INTRODUCTION" with no mention of the Clean-Up. Choice state also leaks: after a door, the `#find` "Get My Introduction" opens step 1 with Business Strategy still selected. | L flows `door2-cta` (`pressed: business-strategy`, header "Get My Introduction") then `find-cta` (`pressed: business-strategy` at step 1) | When the sheet has `data-need`, title it "Ask About [need label]" and show the chosen need as a removable chip on step 2. Reset the selection on every open that has no `data-need`. | `site/assets/js/wa-sheet.js` |
| 7 | **Medium** | **Door clutter and an unverifiable scarcity line.** Door 02 adds "· 2 spots open in [month]" and door 03 adds "· from [$x]/hr". Neither is in §7.1. Each adds a line and a bracket to the busiest scene (58 visible words plus 29 fine-print words at 1440, the most on the page). Door 02 then sits about 70 px higher than doors 01 and 03, so "Protect. / Plan. / Delegate." step down unevenly. | L probe `founder w 58 fine 29`; `L/g3ux-site/1440x900-04.png` | Remove both additions (they belong on Services). Align the doors on a shared baseline: give the door body a subgrid or fixed rows (title / quote / offer / fine / CTA), so the titles line up across all three. | `site/index.html` (door copy), `site/assets/css/home.css` (`.door` layout) |
| 8 | **Medium** | **A 15 px ink stripe runs down the right edge on desktop.** It shows on every bone and gold scene (`.stage` is 1425 px wide in a 1440 px viewport). `html { scrollbar-gutter: stable }` reserves a gutter in film mode, where the document never scrolls, and the gutter paints the ink `html` background. With classic Windows scrollbars, which most Canadian desktop users have, it reads as a rendering bug. | L: `stage 1425 / inner 1440`, `1265 / 1280`; `R/1440x900/02-one-message.png`, `03-situations.png`, `04-founder.png` | Scope the gutter to flow mode only (`html:not(.film):not(.touch-cut) { scrollbar-gutter: stable }`), or paint `html` with the current field colour. | `site/assets/css/base.css` (line 200; 2b) |
| 9 | **Low-Medium** | **The hero copy runs long for a 5-second read.** There are 48 visible words, against the ≤ 40 design target. The lead is one 33-word sentence. At 390 it fills 6 lines and pushes the CTA to the bottom edge of the thumb zone (y ≈ 663 of 844). | L probe `hero w 47–49` | Propose a split for DIRECTION §7.1: "Send one message to Lee. She handles insurance, strategy and outsourcing herself, and introduces you to someone trusted, close to you, for everything else." (27 words). This needs an orchestrator OK because the lead is spec copy. | `plan/round5/DIRECTION.md` §7.1 → `site/index.html` |
| 10 | **Low** | **W2's strike bars read as underlines.** The bar sits at the baseline through the descenders (1440) instead of through the x-height. A visitor sees "underlined grey phrases", not "crossed out". The struck-searches story is the second impression, so the gesture has to read. | `R/1440x900/02-one-message.png`, `R/390x844/02-one-message.png` | Move the bar to about 0.45em above the baseline (x-height centre) with a 2 to 3 px thickness. | `site/assets/css/home.css` (strike bar workaround; or `site/assets/css/fx.css` §4, 2b) |
| 11 | **Low** | **The desktop credits are 40% empty above the footer.** The credits globe anchor shows nothing (`R/1440x900/07-credits.png`), so the footer sits in the lower half under a blank band. | `R/1440x900/07-credits.png` | Either render the R4 credits globe there, or top-align the footer content with the standard spare gate. | `site/assets/js/dotglobe.js` / `site/assets/css/base.css` credits rules (2b/2c) |
| 12 | **Low** | **The hero globe at rest is a faint haze, not an object.** On 1440 source and dist, the sphere's dots are dim and the limb is not drawn, so the first frame is "text on black" and has no wow anchor. The earlier R shot (`R/1440x900/01-hero.png`) shows a crisp limb ring and denser dots, so the at-rest state is inconsistent. | `L/g3ux-site/1440x900-01.png` vs `R/1440x900/01-hero.png` | Keep the limb ring and the front-hemisphere alpha at rest (the match-cut ring's horizon), so the globe reads as a globe. | `site/assets/js/dotglobe.js` (2c) |

---

## 4. Measurements (live)

| Scene | Words (1440 / 390) | Fine print | Controls (1440) | Targets < 44 px | Text < 15 px (≥ 3 words) |
|---|---|---|---|---|---|
| hero | 48 / 47 | 18 / 12 | 3 | 0 | eyebrow only (14 px label) |
| one-message | 37 / 34 | 0 | 0 | 0 | eyebrow only |
| situations | 53 / 53 | 0 | 5 | 0 | eyebrow only |
| founder | 58 / 44 | 29 / 7 | 3 (phone: 3 toggles + 1 CTA) | 0 | none |
| find | 33 / 33 | 33 | 2 | 0 | none |
| close | 35 / 35 | 0 | 4 | 0 | none |
| credits | 32 / 28 | 61 | 12 | 0 | © line (14 px) |

- No horizontal overflow at 390 or 360.
- Flows: 6 of 6 open the right dialog. The door CTA preselects its need. The FAQ opens with 4 items, verbatim.
- Splash-done (dist): 1282, 1244, 1315 and 1229 ms (1440, 1280, 390, 360). This is above the 1.1 s LCP guard, as already flagged in `shared-requests.md` (2e note).

## 5. Path to 8

1. Fix 1, 3, 4 and 7.
2. Rebuild (2).
3. Get the photo (5).
4. Re-shoot slice-1 from the new dist.

With those done, Home would score 8 on this lens: it would be clear in 5 seconds, have a face, offer one action per screen and have no visible defects. The last 0.5 to 1 point is the hero wow (12), shared with the visual and motion judges.
