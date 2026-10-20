# Round 5 · Re-judge, round 1: visual design and wow factor

**Overall: 7.0 / 10** (up from 5.5). Desktop 7.0, phone 6.5.

Judge lens: the same as `judge-visual.md` (an Awwwards juror plus a conversion UX lead, for Canadians aged 30 to 45 on mid-range phones). I compared against that file's rubric and scores and against DIRECTION.md. 8 means genuinely excellent.
Date: 2026-10-19. This is a read-only review; I changed no site files.

**Evidence**
- `plan/round5/shots-r5/review-1/`: every scene at 1440x900, 1280x720, 390x844 and 360x740, plus mid-cut frames and the splash. I read every 1440 frame, all the 390 frames (as contact sheets) and 18 mid-cuts.
- The automated checks are green: compliance 0 missing and 0 altered, console clean on 30 runs, and fit, flow and touch all ok.
- Live checks on **dist/ served on :8441** (my own server, stopped afterwards; it is not listening any more). I used headless Chrome with an isolated profile and scripts in my scratchpad (`...\scratchpad\rejudge\live.mjs` and `deep.mjs`).
  - I wheeled scene by scene through index, services, story and partners, capturing a frame mid-cut (450 ms in) and one settled frame for every step.
  - I captured the splash at 150, 450, 800 and 1200 ms.
  - I tested the deep links `story.html#close` and `services.html#close`, and a `goTo` from a Services intro row followed by two wheels.
  - Result: 0 page exceptions.

---

## 1. Scores

| page | R5 judge (before) | desktop 1440 | phone 390 | **now** | one line |
|---|---|---|---|---|---|
| Splash | 4.5 | 6.5 | 6.5 | **6.5** | The C draws, the W draws, then it match-cuts to the hero globe. It is quick and on-brand, but the first ~150 ms is a dead black frame and the sheen is barely perceptible. |
| Home | 5.5 | 7.5 | 7 | **7.5** | A real film now: the hero with the globe and the gold stop, "One *Message*." as a true monument with struck lines, metal doors, the globe morphing into the Canada map, and a medallion close. Every scene is different and none is clogged. |
| Services | 5 | 6.5 | 6 | **6.5** | The intro rows, the finder map and the close are strong. The middle is three bone scenes in a row, each a little thin: a typographic portrait whose W collides with the name, a monument with an empty right 55%, and plain rows. The gold panels are all `[bracket]` text. |
| Our Story | 6.5 | 7 | 6.5 | **7** | "One Place. Not *Five*." is the best type on the site. But the top scene's typographic portrait runs the W strokes through a 3-line bracketed quote, and the logo scene's C ring is now a fuzzy particle ring with less weight than the frame the last panel loved. |
| For Professionals | 5 | 6.5 | 6 | **6.5** | The hero with the "You" node is good. The founding gold field is a bare monument, with an empty right half on desktop and a 40% gold void in the middle on phones. The tier cards are calm but the ghost numerals are nearly invisible on ink. |
| Legal | 6 | 7 | 7 | **7** | Correctly calm and very readable: outline numerals on the contents rows and paper frames on the documents. The close is a bare statement with no medallion or dot, so the page ends flat. |
| **Site** | **5.5** | **7.0** | **6.5** | **7.0** | It went from "nice palette, no idea" to a coherent idea, Full Stop, executed with discipline. It is not yet unforgettable: no imagery, four closes that are the same frame, and a thin middle on Services and Partners. |

How I would describe it to the jury now: *"A confident editorial film in black and gold, with two moments you remember (the struck searches and the globe coming down to Canada). It stops short of an 8 because the middle chapters are typography on empty fields and every ending is the same coin."*

### Against the original top 8 (judge-visual §6)

| # | original defect | status |
|---|---|---|
| B1 | no signature moment on Home | **Fixed.** The hero globe and the gold stop, W2's struck lines and W4's map morph each work on their own. |
| B2/B15 | no imagery; empty founder frame | **Partly fixed.** The empty frames are gone (typographic portrait, medallion), but there is still no photograph (content-gated). The typographic portrait has a legibility collision (F2). |
| B3 | the globe as wallpaper | **Fixed.** It appears only in the hero, find/finder, partners hero, logo and close. It is hidden elsewhere and never a cropped sliver. |
| B4 | arcs scribble | **Fixed.** There is one clean arc, which plays and then rests (verified live). |
| B5 | mustard rotation | **Fixed.** Ink dominates, there is one gold field per page, and the gold fields are brushed metal. The sheen is visible in the mid-cuts. |
| B6 | the same layout every scene | **Mostly fixed.** The archetypes alternate, but the M archetype is overused at the closes (F3). |
| B7/B11 | clutter, loud `.ph`, offset plates | **Fixed.** The header has 4 marks, `.ph` uses a dotted underline, and the plates are gone. |
| B8/B9 | clipping and the 15 px seam | **Fixed.** No clipping at any of the 9 viewports, and no seam visible at 1440. |
| B10 | generic splash | **Improved** (F6). |

---

## 2. Findings, ranked by severity

| # | sev | finding | where (evidence) | file(s) that must change | fix |
|---|---|---|---|---|---|
| F1 | **high** | **The middle chapters are thin.** Services S2→S3→S4 is three bone scenes in a row, and each is half-empty. S3 is a monument with the right 55% empty. S4 is five Manrope rows with no accent. Partners P4 "founding" is a bare gold statement with the right half and bottom third empty. On phones it has a ~40% gold void between the statement and the body. These read as "unfinished", not "monument", and they are where a 30 to 45 year old decides whether to keep going. | `services/1440x900/03-ours-strategy.png`, `04-ours-includes.png` · `partners/1440x900/04-founding.png` · `partners/390x844/04-founding.png` | `site/assets/css/services.css`, `site/assets/css/partners.css` (layout); `site/services.html`, `site/partners.html` (markup hooks) | S3: set the statement at `--fs-mega`, or place a giant outline "30" numeral (C9, about 60svh) in the empty right half as the object. S4: add the gold italic accent and the hairline draw, and consider ink to break up the three bones (DIRECTION allows Services ≥ 50% ink). P4: an anchored medallion or a large outline "2" on the right. On phones, group the statement, body and CTA in the lower 60% (no mid void). |
| F2 | **high** | **The typographic portrait (C33) collides with its own text.** The outline W strokes run through "Lee Holgado" (Services S2) and through the 3-line `[One or two sentences…]` quote (Story T1, desktop and phone). It looks like a misregistration, the exact problem B11 removed, and it sits on the founder moment. | `services/1440x900/02-ours-insurance.png` · `story/1440x900/01-top.png` · `story/390x844/01-top.png` | `site/assets/css/visual.css` (`.tportrait`), with page overrides in `site/assets/css/story.css` and `site/assets/css/services.css` | Make the monogram a backdrop: about 12–18% stroke opacity (not 40%), with the text set on a clear band. Or move the C·W left and keep the text outside the W's bounding box. Never let a stroke cross body-size text. |
| F3 | **medium-high** | **Four closes are the same frame**: the medallion centred above a centred 3-line statement, plus a button and a link (Home, Services, Story; Partners is a variant). DIRECTION W5 asks for this, but in practice the bookend loses its effect by the second page. The medallion is also a flat brushed disc with a weak emboss, so it reads as a coin sticker, and no "globe shrinks into medallion" move was perceptible in the live walk (it arrives already composed). | `index/1440x900/06-close.png`, `services/…/08-close.png`, `story/…/05-close.png`; live `svc-07`, `sty-04` | `site/assets/css/visual.css` (`.medallion`), `site/assets/js/dotglobe.js` (medallion mode) | Make the globe→medallion collapse visible (≥ 600 ms, one glint). Strengthen the emboss: a 2 px inset ink stroke, the highlight at .5, and a soft drop shadow on ink. Vary the composition per page: Services keeps the map ghosted at 15%, and Story keeps the C ring orbiting once before it settles. |
| F4 | **medium** | **The Story logo scene lost weight.** The C ring is now a sparse, noisy particle ring and the W is a thin solid stroke, so the two read as different drawing systems. The original "thick gold C ring" was the judges' best frame on the site. | `story/1440x900/03-logo.png`, `story/390x844/03-logo.png` | `site/assets/js/dotglobe.js` / `site/assets/js/dotglobe-draw.js` (ring mode), `site/assets/css/story.css` | In ring mode, raise the point density and size (or draw a solid 3–4 px stroke under the points) so the C matches the W's stroke weight, and add a soft halo. |
| F5 | **medium** | **There is still no imagery.** There is no founder photo and no place photography, so every scene is type on a field. This caps the score at about 7.5 whatever the layout does (the B2 rationale stands). | site-wide | `site/assets/js/config.js` (`FOUNDER_PHOTO`), `site/story.html`, `site/services.html` (C34 slot) | Content: ask the owner for the portrait now. The C34 duotone slot is already specified. |
| F6 | **medium** | **The splash opens on ~150 ms of empty black**, then a small 2 px monogram (about 100 px). The sheen is imperceptible. It is fine, but it is not an opening yet. | live `idx-splash-150/450`; `splash/1440x900/splash.png` | `site/assets/js/splash.js`, `site/assets/css/visual.css` | Paint the warm radial and the start of the C stroke on the first frame (inline in the HTML). Scale the monogram to about 160 px on desktop. Make the sheen a visible gold-white band. |
| F7 | **medium** | **Partners tiers**: the ghost numerals 1/2/3 are at about 6% on ink and almost invisible. The radio circles before the tier names look like form chrome on a showcase scene. | `partners/1440x900/03-tiers.png` | `site/assets/css/partners.css` | Raise `--ghost` on ink to about 12% (or use the outline numeral). Visually hide the radio and show the selected state as a gold top rule. |
| F8 | **medium** | **The map coastline outline is jaggy.** The polygon stroke around the dot fill has saw-tooth edges, most visible on the Arctic islands and Hudson Bay. The "A Professional Near You" label sits on the coastline (desktop) and 30 px above the eyebrow (phone). | `index/1440x900/05-find.png`, `services/1440x900/06-finder.png`, `index/390x844/05-find.png` | `site/assets/js/dotglobe-draw.js` (map outline), `site/assets/js/dotglobe.js` (label placement) | Simplify or smooth the outline path (or drop the stroke and let the dots carry the shape). Offset the label off the land mass and keep ≥ 16 px clear of the text column on phones. |
| F9 | **low-medium** | **Empty paper.** The Services inquiry step 1 (2 fields) sits in a 480 px-tall frame that is about 45% empty, and on phones the lower half of the scene is empty. Partners apply on phones is "Step 1 of 8". | `services/1440x900/07-inquiry.png`, `services/390x844/07-inquiry.png`, `partners/390x844/05-apply.png` | `site/assets/css/services.css`, `site/assets/css/ui.css` (`.paper` / stepper height) | Size the paper to its content (min-height by step, not by scene), or fill step 1 with the 9 category chips instead of a select. |
| F10 | **low-medium** | **Legal close is flat**: a bare statement and a CTA on bone, with no medallion or gold dot (W5 says pages without a globe use a gold dot). The Q&A scene leaves the lower half empty. | `legal/1440x900/07-close.png`, `06-faq.png` | `site/legal.html`, `site/assets/css/legal.css` | Add the static medallion (no motion; tier C is fine) or a large outline monogram to the right. |
| F11 | **low** | **Globe mode is not reconciled on seeked landings.** In the review shots (shoot.mjs seek path on site/), the Services close shows the full Canada map behind "Ask Once. It's Handled." and the Story close shows the C ring through the statement. Live wheel, deep link and `goTo` on dist were all clean, so users are unlikely to see it. But the review evidence is misleading, and any `seekCut` landing hits it. | `services/1440x900/08-close.png`, `story/1440x900/05-close.png`, `services/390x844/08-close.png` vs live `sheet-deep.png` | `site/assets/js/dotglobe.js` (mode set on seek/progress), `site/assets/js/film.js` (`seekCut`) | When `play()` lands with `seek`, set the globe's target mode for the destination scene, as an immediate landing does. |
| F12 | **low** | **The Services finder select truncates on phones**: "Choose a ser". | `services/390x844/06-finder.png` | `site/assets/css/services.css` | Stack the select and city at < 400 px, or shorten the placeholder to "Service". |
| F13 | **low** | **Credits has a large empty band** (the top ~250 px and the bottom ~230 px at 1440), so the footer floats mid-screen. | `index/1440x900/07-credits.png` | `site/assets/css/base.css` (credits) | Bottom-anchor the credits block, or give the tagline display scale at the top. |

---

## 3. What to keep (do not regress)
- **The Home hero.** The 3-line statement with the gold italic "Near You" and the stop, the globe at about 78svh with one arc that rests, and a calm trust line. It is the strongest first frame the site has had.
- **H2 "One *Message*."** The struck italic searches are the brand's most memorable beat, on desktop and on phones.
- **Brushed metal doors (H4).** The gold now reads as material, not mustard, and the sheen is visible in the mid-cuts.
- **The globe → Canada dot map with one arc.** It works on Home, Services and Partners (in reverse, with "You").
- **Header and `.ph` discipline, and hairline rows with outline numerals.** The clutter complaint is resolved.

## 4. Path to 8
1. Fix F1 and F2: the thin middle and the portrait collision.
2. Make the closes a visible move and vary them (F3), and restore the logo scene's weight (F4).
3. Get the founder portrait (F5).

With these, Home reaches about 8 and the site about 7.5–8 without new features.
