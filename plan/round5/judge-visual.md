# Round 5 · Judge: visual design and wow factor

Judge lens: an Awwwards jury member plus a conversion-focused UX lead. I asked one question: does the site look premium, memorable and award-worthy, or basic? I looked at colour use (the black and gold balance), imagery, texture, depth, the 3D object, iconography and the splash, and I asked whether there is a signature moment.
Audience: Canadians aged 30 to 45, busy and not design-native, who decide on trust in the first 5 seconds.
Date: 2026-10-17. I only read `site/` and did not change it.

**What I looked at**
- Every scene of every page at 1440x900 and 390x844, plus the splash. I read about 100 frames.
- Shared shots in `plan/round5/shots/` (`S/` below): the splash, index scenes 1 to 6 at 1440, and story at 1440. That run was still going while I worked.
- Shots from a parallel judge's full run of `tools/shoot.mjs`, in the session scratchpad (`L/` below): `...\scratchpad\judge-layout\shots\<page>\<vp>\NN-<scene>.png` and `...\shots2\story\390x844\`.
  - The tool could not start the film on partners and legal at 1440 (its log says "film not up … shot without activation"), so those frames are flow-mode fallbacks.
  - In my own headless Chrome the film starts on both pages and the console is clean. The fallback is a tooling artefact, not a site bug.
  - So I shot partners and legal myself, in film mode, with `...\scratchpad\judge-visual\scenes.mjs` (`J/` below). Files are named `J/partners-1440-NN-<scene>.png`, `J/partners-390-…` and `J/legal-1440-…`.
  - Contact sheets of the phone frames are in `J/m-index-a.png`, `m-services.png`, `m-story.png`, `m-partners.png` and `m-legal.png`.
- Code I read: `PLAN.md` (all rounds), `plan/round4/build-order.md`, the round 5 research files, `site/assets/js/globe.js` and `site/assets/css/base.css`. I also read the `C:\Portfolio` reference (`CONTRACT.md`).
- Round 4 decisions are treated as built: one screen per section, one scroll per section, and no HUD counter, floating WhatsApp, phone bar, sound or pause toggles, or decorative dashes. Where a defect below goes away in Round 4, I say so and do not count it against the redesign.

---

## 1. Scores (this lens only)

| page | desktop 1440 | phone 390 | overall | one-line justification |
|---|---|---|---|---|
| **Splash** | 4.5 | 4.5 | **4.5** | Clean and on brand, but it is a logo, a wordmark and a progress line on a flat black field. It is the most generic frame on the site and hands off to nothing. |
| **Home** (`index.html`) | 5.5 | 5 | **5.5** | The hero type and the dot-matrix Canada map (scene 8) are good. Across 12 scenes, though, the same three colour fields rotate, the globe is wallpaper, and the hero is crowded with chrome and filled gold `[n]` boxes. |
| **Services** | 5 | 5 | **5** | The gold-line province map in the finder (scene 5) is strong. Everything else is lists and forms on flat fields. Two scenes are visibly cut off at the bottom, and the close scene copies Home's. |
| **Our Story** | 6.5 | 6 | **6.5** | It holds the site's only true signature moment: the logo scene, where the C ring wraps a globe that becomes the W. The founder scene around it is an empty frame with a globe in it. |
| **Become a Partner** | 5 | 5 | **5** | The dark tier cards are crisp. The gold scenes read as khaki, the arrangement cards look misregistered, and the application is a wall of boxes. |
| **Legal** | 6 | 5.5 | **6** | The stacked "paper" panels with large outlined numerals are the most crafted and most specific motif on the site, and exactly right for legal. |
| **Site overall** | **5.5** | **5** | **5.5** | Competent and tasteful. It leans premium but stays templated: a 2023 dark-luxury template, not a site anyone remembers. The ingredients for a 9 are already here (the monogram, the globe, the gold, the serif), but they are spread thin and repeated instead of staged. |

How I would describe it to the jury: *"Nice palette, no idea."* Every frame is acceptable and no frame is unforgettable. The client is right when she calls it "basic" and "clogged":
- **Basic** means there is no hero image, no signature motion and no scale contrast.
- **Clogged** means chrome in all four corners, filled placeholder boxes, two to four buttons per scene, and a globe in almost every frame.

---

## 2. What is good (keep)

1. **The logo scene is the signature moment. Make it the centrepiece of the whole site.**
   - Where: Story scene 4, `S/story/1440x900/04-logo.png`, and Home scene 9, `L/index/1440x900/09-story.png`.
   - A thick gold C ring wraps the wireframe globe, the W sits inside it, and "W Stands for *Wealth.*" and "C Stands for *Cargado.*" are set at opposite corners in gold.
   - It is the one frame with a clear focal point, a story and real scale contrast. It also turns the brand mark into meaning.
2. **The dot-matrix Canada map with the Winnipeg ripple rings.**
   - Where: Home scene 8, `L/index/1440x900/08-find.png` and `L/index/390x844/08-find.png`.
   - It is graphic, specific to the business ("near you, across Canada"), readable at a glance, and the best use of gold-on-black data styling on the site. It looks good on phones too.
3. **The gold-line province map in the finder.**
   - Where: Services scene 5, `L/services/1440x900/05-finder.png`.
   - The thin gold province outlines on black look like an engraved plate. It is the most premium illustration on the site.
4. **The legal paper stack and outlined numerals.**
   - Where: `J/legal-1440-03-privacy.png` and `J/legal-1440-06-faq.png`.
   - Offset sheets stacked under the content and large thin-outline numerals ("02", "05") give the page tactility and an editorial feel without decoration for its own sake. Reuse the outlined numeral elsewhere (see §4.4).
5. **Large Times New Roman Title Case headlines on black.**
   - Where: Home hero `S/index/1440x900/01-hero.png`, close `L/index/1440x900/12-close.png`, Story top `S/story/1440x900/01-top.png`, Partners hero `J/partners-1440-01-hero.png`.
   - Ivory serif at 90 to 110 px on near-black with a faint warm radial is the closest the site gets to "private bank". The serif reads mature and trustworthy for 30 to 45 year olds.
6. **Gold used as light, not paint, on ink scenes.** Examples: the gold primary buttons, the gold eyebrows, the thin gold top rule on the hero form card, and the gold timeline dots on Home scene 5 (`S/index/1440x900/05-how-it-works.png`). On black, gold behaves like a luxury accent.
7. **The compare scene's idea.**
   - Where: Home scene 4, `S/index/1440x900/04-compare.png`.
   - The struck-through "On your own" list beside a gold "With Cargado" panel is the clearest value story on the site, told visually.
   - The execution is small. The idea deserves a full-screen moment (§4.6).
8. **Dark tier cards with gold top rules.**
   - Where: Partners scene 4, `J/partners-1440-04-tiers.png`.
   - The hierarchy is crisp: name, price token, features, then a gold text link. This looks like a real product page.
9. **Restraint in the iconography.** There are no clip-art icons, only thin arrows, check marks and the monogram, which keeps the tone adult. Keep this restraint (see §4.10 for the one place icons would earn their keep).
10. **Phones.** Type stays large, there is no horizontal mess, and the logo scene and finder map survive at 390 (`J/m-story.png` frame 4 and `J/m-services.png` frame 5).

---

## 3. What is bad (defects)

Severity is judged for this lens: how much each defect costs the wow factor and trust for the 30 to 45 audience.

| # | defect | where (page · scene · file) | why it hurts | severity |
|---|---|---|---|---|
| B1 | **No signature moment on Home.** The first screen is a headline, a form card and a strip of stats. The memorable visual (the C·W globe) arrives at Home scene 9 of 12 and Story scene 4. | Home 01 `S/index/1440x900/01-hero.png` · Home 09 `L/index/1440x900/09-story.png` | Jurors and visitors decide in the first 3 to 5 seconds. The hero looks like a well-made lead-gen landing page, which is exactly what "basic" means. The signature exists but is buried. | **critical** |
| B2 | **No real imagery anywhere.** There is no photography, no faces and no places. The founder photo is an empty bracketed frame with a globe in it, and the founder video is a black box reading "Founder video coming soon". | Story 03 `S/story/1440x900/03-founder.png` · Home 02 `S/index/1440x900/02-video.png` · Home 06 | For a trust business aimed at 30 to 45 year olds, a human face is the strongest credibility and memory cue (see research-audience §6 and research-premium-finance: Coutts, Wealthsimple). Empty frames read as "unfinished", not "minimal". | **critical** |
| B3 | **The globe is wallpaper.** It appears in roughly 30 of 42 scenes, at random sizes, in corners, cropped by the viewport edge, or faint behind content. It has no job in any scene except the logo scene. | Home 03, 04, 07, 11 (bottom-left or bottom-right crop) · Services 02, 04 · Story 02, 05, 06 · Partners 03, 04, 06 · Legal 03, 06 · phones: `J/m-index-a.png`, `J/m-partners.png` (slivers at the edges) | Repetition kills the signature. By scene 3 it is background noise, and half-cropped in a corner it reads like a layout accident. Compare `C:\Portfolio`, where the 3D object has a job every scene (it moves, explodes and points). | **high** |
| B4 | **The globe's arcs render as a scribble.** The great-circle "arcs" bunch into a tangled gold tail that spills outside the sphere, often off one side or off the canvas. | Home 01 (right edge, x≈1400) · Story 01 · Services 01 · Partners 01, 03, 05 · Legal 01 | This is the one moving 3D detail in the hero, and it looks like a rendering glitch rather than "connections across Canada". Premium 3D is judged on clean silhouettes. | **high** |
| B5 | **Mechanical colour rotation, and the gold field is flat mustard.** Every page cycles ink → bone → gold → ink scene after scene. The gold field (`#C9A24A`, gradient `#B8913A → #D9B862`, `base.css:118-119`) fills about a third of all scenes edge to edge. | Home 03, 07, 10 · Story 03, 06 · Services 04, 07 · Partners 03, 05 | On large areas this gold looks like khaki or mustard cardboard, not metal, and dark grey text on it looks low-energy. Gold stops being precious when it is a wall, and the steady rhythm makes the site feel like a slideshow template. | **high** |
| B6 | **Every scene uses the same layout.** Nearly every scene is "tracked eyebrow, then a serif headline at about 90 px on the left, then a list or card on the right". The headline scale barely changes (about 70 to 110 px), and nothing is full-bleed, centred or monumental except the logo scene. | Home 03–07, 10, 11 · Services 02–07 · Story 02, 05, 06 · Partners 02–06 | Without scale contrast or rhythm there is no drama. This is the main source of the "basic" feel once B1 is fixed. | **high** |
| B7 | **Clogged chrome and shouting placeholders.**<br>• The chrome: four corner brackets, a `01 / 12 · INTRODUCTION · 00:00` counter, nav plus Facebook, a WhatsApp button, sound and pause buttons, and a floating WhatsApp pill. That is 8+ chrome elements on every frame.<br>• The placeholders (`.ph`): filled gold or tan boxes that out-shout the copy. Examples: `[n] [n] [n] [rating]` at about 40 px in the hero, `[Signature]`, `[Role 1]…[Role 4]`, `[2]` in a giant box in a headline. | Every frame, e.g. `S/index/1440x900/01-hero.png` · Partners 05 `J/partners-1440-05-founding.png` · Services 04 `L/services/1440x900/04-ours-outsourcing.png` · Story 03 | Clutter is the client's main complaint ("clogged"). The placeholders draw the eye first and make the site look broken. **Round 4 removes the HUD, the floating WhatsApp and the toggles**, so in Round 4 terms the open problem is the `.ph` styling. The placeholder text must stay (compliance). | **high** (the `.ph` part) |
| B8 | **Content is cut off at the bottom of the screen.** | Services 06 categories (the notice fades out at y≈820) `L/services/1440x900/06-categories.png` · Services 07 inquiry (the line under Send is cut) · Partners 07 apply (the second fieldset and the right rail are cut) `J/partners-1440-07-apply.png` · Home 12 and Services 08 (the footer is clipped mid-line: "Connected by Purpose…" is cut, and Legal and Company links are missing) `L/index/1440x900/12-close.png` | Clipped text looks broken, and the closing footer is the last impression. Round 4's fit contract addresses this, so it is listed only to make sure the visual fix lands. | **high** (closed by R4 if built) |
| B9 | **A 15 px seam on the right edge of every desktop frame.** `scrollbar-gutter: stable` on `html` (`base.css:163`) reserves a gutter that the fixed stage's field never paints. It is visible on bone and gold scenes. | Every 1440 shot: look at x≈1425–1440 in `S/index/1440x900/03-situations.png` and `J/partners-1440-05-founding.png` | A hairline seam on a full-bleed colour field reads as a bug and undercuts "premium" instantly. It is cheap to fix. | **medium** |
| B10 | **The splash is generic and disconnected.** It shows a small monogram, a wordmark and a progress bar, then fades. Nothing carries into the hero. | `S/splash/1440x900/splash.png` | The splash is the one guaranteed moment of full attention, and it is spent on a loading bar. It should start the signature sequence. | **medium-high** |
| B11 | **Offset "shadow plate" double borders on most cards.** | Story 02 `S/story/1440x900/02-beginning.png` · Services 02, 03 promise box · Partners 03, 04, 05, 06 · Story 03 photo frame | Outside Legal (where the stack means paper), the 8 px offset second border looks misregistered, like a print error, and adds to the clutter. | **medium** |
| B12 | **The close scene is copied across pages.** Home close and Services close are almost the same frame, and Legal's close repeats the headline. | `L/index/1440x900/12-close.png` vs `L/services/1440x900/08-close.png` · `J/legal-1440-07-close.png` | Copies cheapen the ending and miss a chance for each page to land its own final image. | **medium** |
| B13 | **Star specks on gold and bone fields.** The star layer and grain stay faintly visible on light fields, as small dots across the gold. | Home 03, 07, 10 · Story 06 · Partners 05 | On light fields the stars read as dust on the screen, not as space. | **low** |
| B14 | **Phone: the globe appears as cut slivers, and the bottom bar is a heavy black band.** The hero form also sits behind the bar (its helper text is cut). | `L/index/390x844/01-hero.png` · `J/m-partners.png` · `J/m-index-a.png` | The 3D object adds nothing at 390 when it shows as an edge sliver. The heavy bar (which Round 4 removes) shrinks the canvas. | **medium** (the bar is gone in R4) |
| B15 | **The Story founder scene is the emptiest premium-looking frame on the site:** a large gold field, an empty frame, a globe, and `[One or two sentences…]` and `[Signature]` in boxes. | `S/story/1440x900/03-founder.png` | This is the emotional peak of the brand story, the founder, and visually it holds nothing. | **high** (it depends on content, but the layout can carry the content gap far better) |

---

## 4. What needs improvement (ranked by impact)

The aim is calm wow: a beautiful first frame, a few directed transitions and type nobody has to squint at, which is what research-awards §0 says juries and 30 to 45 year olds both reward. The palette, typeface rules, compliance copy and Round 4 one-scroll-per-section all stay.

### 4.1 Build ONE signature sequence and open Home with it (fixes B1, B3, B10). Impact: highest.
Turn the logo idea into the opening of the site: **"the gold thread"**. Every step is scrubbed, reversible and settles on one-scroll stops.
1. **Splash, about 1.2 s.**
   - The C of the monogram draws as a gold stroke (`stroke-dashoffset`), then the W strokes draw.
   - A metallic sheen sweeps across the monogram once.
   - The C ring then scales up to become the **iris that opens onto the hero**, so the splash is the first frame of the film instead of a loading screen.
   - Play the full sequence once per session (`sessionStorage`); after that, use a 300 ms fade.
2. **Hero (Home scene 1).**
   - The globe sits at **60 to 70 vh, centred-right**, behind the headline. Make it bigger and brighter than today.
   - The cities across Canada are lit gold nodes. On idle, one clean great-circle arc at a time draws from a node to Winnipeg with a small light pulse travelling along it: "one message reaches the right person near you".
3. **The first scroll from the hero.**
   - The camera dollies in (move the camera, not the object, as in Igloo and Lusion in research-awards #1 and #2).
   - The arcs converge, and the globe compresses into the C ring while the W draws inside it. That is the logo scene, delivered as the payoff of scene 1 to 2.
   - Then the field opens to bone.
4. **Reuse the move as each page's opening.**
   - Story: the same sequence, slower, with the "W Stands for Wealth / C Stands for Cargado" copy.
   - Services: the globe unrolls into the gold-line province map (the finder).
   - Partners: one new node joins the network and lights up ("you").
   - Legal: a still monogram only, which is calm and correct.

### 4.2 Give the globe a job, use it far less, and fix the arcs (fixes B3, B4, B14). Impact: very high.
- **Show it in about 1 scene in 3**, and only where it means something: the hero, the network or "near you" scenes, the logo scene, and the close.
  - Elsewhere, fade it to 0. Do not park it in corners.
  - When it is present, show it at least 50 vh, either centred or deliberately bleeding off one edge by a third. Never as a cropped sliver.
- **Fix the arcs.** Use true great-circle arcs between real city vectors that hug the sphere (lift ≤ 0.12R). Draw each one with a dash animation, at most 3 visible at once.
  - Today's tangle (`globe.js` arc lift and angle factors, around line 150) bunches into a tail off the silhouette.
- **Make it read as gold metal, not grey wire.**
  - Brighten the city nodes, add a soft additive halo sprite behind the sphere (a fake bloom with no post-pass), and raise the inner icosahedron from opacity 0.35 to about 0.5 on ink.
  - Add slow inertia: lerp the rotation toward its target with a 0.06 to 0.08 factor (Lusion).
- **Phone:** show the globe only in the hero, close and logo scenes, centred at 70 vw. Hide it everywhere else.

### 4.3 Rebalance the palette: black is the stage, gold is the light (fixes B5, B13). Impact: very high.
- **Target share per page: ink about 65 to 70%, bone about 20 to 25%, gold field at most 1 scene per page** (2 on Home at most). Stop the fixed ink → bone → gold rotation and pick each field for the content.
- **Gold fields that remain should look metallic, not flat.** Keep the gradient static (a Round 1 rule) but add:
  - a slow diagonal sheen band (a pseudo-element `linear-gradient` with low-opacity white, `transform`-translated on scroll; transform only, so it is cheap);
  - a very fine brushed or anisotropic noise texture, as a static tile;
  - black type at full weight.
  - This is how Cartier and Rolex handle large gold areas: as polished material, not paint.
- **On ink, use gold as light.**
  - A radial gold spotlight (`radial-gradient`, about 8% opacity) behind every main headline (Linear, research-awards #5).
  - 1 px hairlines at gold 18%.
  - A gold glow on the primary button.
- **Show no stars or grain on bone or gold fields** (opacity 0). Stars belong to the night (ink) only.

### 4.4 Make type the wow on every scene that has no picture (fixes B6). Impact: high.
These moves stay within Times New Roman and Title Case.
- **Use real scale contrast.**
  - Give each page 1 or 2 *monument* scenes where a single statement fills the screen at 9 to 12 vw. For example, "One Message Instead of Five Searches.", "Pay on Clients, Not on Clicks." and "Built to Serve People, One Connection at a Time."
  - Pair them with quiet scenes at today's size. Today everything sits at 70 to 110 px.
- **Set one italic gold accent per headline**, using Times New Roman Italic in gold. Examples: "The Right Professional *Near You*", "W Stands for *Wealth.*" (already done in the logo scene, and it is the best type on the site), "Pay on *Clients*, Not on Clicks." This single move makes Times New Roman read as editorial luxury rather than "default font".
- **Track display type tighter**, to −0.015 to −0.02 em at hero sizes, and use optical line breaks (already balanced).
- **Reuse the Legal outlined numeral as the system numeral.** Use large thin-outline "01 02 03" for steps on Home How It Works, Partners How and Arrangement, the Services role lists and the Story values. One motif across pages gives the site an identity.

### 4.5 A real imagery system, ready for the founder's photos (fixes B2, B15). Impact: high, but it needs content.
CR16 forbids inventing people, so there should be no stock faces of fake clients or partners. Plan it like this:
- **The founder portrait is the second hero.** When supplied, show it as a duotone (black to gold), slightly grained, cut out or in a tall 4:5 frame, with the C ring passing behind her shoulder. Use it on Story Founder, Home "Three Things She Does Herself" and the video poster.
  - **Ask the client for this photo now.** It is the single biggest trust and wow upgrade available.
- **Use places, not people.** Night aerials of Canadian cities and prairie roads at dusk (licensed stock is fine because they are places, not endorsements), as full-bleed duotone images at 20 to 30% under the ink field on 2 or 3 scenes (the Home close, Story beginning, and the Partners hero "Meet People in Your City").
- **Until photos arrive, never show an empty frame with a globe in it.**
  - Story Founder becomes a typographic portrait: the monogram large, the founder's name as `[Founder name]` set huge in italic, the bracketed quote as a pull-quote, and `[Signature]` in a script-like italic line.
  - The video placeholder becomes a poster that is the logo scene frame (C ring and globe) with a play glyph, instead of a black box.

### 4.6 Give scenes 4 or 5 archetypes and never repeat one twice in a row (fixes B6, B12). Impact: high.
Define these archetypes and assign them per page:
- **A. Monument:** a centred statement at 9 to 12 vw, nothing else but one link. Use it for the hero tagline, the compare idea and the close.
- **B. Split 7/5:** a headline column plus a list or card. This is today's default; keep it, but use it for at most 40% of scenes.
- **C. Stage:** a big 3D or illustration with a caption. Use it for the logo, the map and the finder.
- **D. Reel:** a horizontal row of 3 or 4 large panels that slide in as one step. Use it for "Sounds Like You?", the tiers and the values.
- **E. Paper:** the legal stack. Use it only for documents and forms.

Then rebuild these scenes with the move that suits them:
- **Home compare (scene 4)** becomes a Monument. The five struck-through searches fall away one by one, and one gold "One WhatsApp Message" line remains at huge size.
- **"Sounds Like You?" (scene 3)** becomes a Reel of four large quote cards. Each quote is set in 40 px serif italic, with a tiny category line under it.
- **Each close scene** gets its own image: Home closes on the monogram (the last frame mirrors the splash), Services on the finder map, Partners on the network node joining, and Legal on a quiet ink frame with no globe.

### 4.7 Declutter and quiet the placeholders (fixes B7, B11). Impact: high.
- **Build Round 4's removals (decided):** the HUD, the floating WhatsApp, the phone bar, and the sound and pause toggles. After that the header is the logo, 4 nav items, Facebook and one WhatsApp button, and the corner brackets go with the HUD.
- **Restyle `.ph` (keep every word, compliance):**
  - Use no fill. Show the brackets in current-colour text at about 70% opacity with a 1 px dotted underline in gold-dark.
  - Set inline placeholders at the same size as their sentence, never larger.
  - Hero stats strip: shrink the `[n]` values to 28 to 32 px in ivory (not gold boxes) so the strip reads as "numbers coming" rather than four alarms. Alternatively, move it under the fold of the hero into the How It Works scene.
- **Allow at most 2 actions per scene** (one primary and one text link). Scenes that carry 3 or 4 buttons today: Services 02 and 03, Story 06, and Partners 01.
- **Remove the offset second border from cards** except in Legal, where the stack means paper. Replace it with one 1 px hairline plus a soft shadow on bone, or a gold top rule on ink.

### 4.8 Brand transitions instead of a generic circle iris. Impact: medium-high.
- **Replace the plain `circle()` iris with the C-ring wipe.** The incoming field is revealed by a thick arc sweeping 300° around the screen centre, like the C of the monogram (`clip-path: path()` or a `conic-gradient` mask; transform and mask only).
- **Use the gold hairline draw only between ink scenes.** A thin gold frame draws around the incoming content box with `stroke-dashoffset` (Vercel Ship, research-awards #7). It replaces the removed decorative dashes with something purposeful.
- Keep durations calm at 600 to 900 ms of scroll-scrubbed travel. Reduced motion falls back to a crossfade.

### 4.9 Polish fixes (fixes B8, B9, B13). Impact: medium, effort: low.
- **The seam:** paint `html` and `body` with the active field colour (set `--bg` on `html` from film.js on scene change), or move the gutter onto the spacer. Either way, no 15 px strip.
- **Clipped scenes:** Round 4's fit contract has to land for Services 06 and 07, Partners 07, and the Home and Services close footers. The footer must show its tagline and all its link columns whole.
- **Stars:** opacity 0 on bone and gold (see 4.3).

### 4.10 Small iconography, in one place only. Impact: low-medium.
- Draw 9 bespoke 1.25 px gold line icons for the service categories (insurance, strategy, outsourcing, manufacturing, legal, mortgage, real estate, accounting, planning). Use them on Home scene 7, the Services rail and the finder select.
- Nothing else on the site needs icons.

### 4.11 Phone-specific. Impact: medium.
- **Hero:** the headline plus one line of copy plus a single "Get My Introduction" button fills the first screen. The two-step chip form becomes the next scene (or opens in place), so it is never half-hidden behind a bar.
- **Globe:** follow 4.2. Show it only centred and large, in 3 scenes.
- **Monument scenes** at 390 use 13 to 15 vw type. They will be the most striking frames on phones.

---

## 5. Reference crib (what to borrow, from the round 5 research)

- **Cartier Watches & Wonders** (Immersive Garden), the closest match: a dark field, gold metal, one object per "room", slow camera. Treat each Round 4 section as a room with one idea and one pose.
- **Apple product pages:** one claim per screen at huge size. This is the Monument archetype and is ideal for 30 to 45 year olds.
- **Igloo Inc and Lusion:** a single hero object the camera travels through, with inertia. Compile shaders behind the splash (`renderer.compile`) so the first scroll does not stutter.
- **Linear:** light as the wow, with spotlights, glowing hairlines and gold-tinted borders. These cost almost nothing on a dark field.
- **`C:\Portfolio`** (the user's own reference, a hyowonbernabe-style film): the 3D object has a narrative job in every scene (it moves, explodes and labels), the colour fields turn mid-scene on purpose, and the type is set at extreme scale. Cargado copied the machinery (stage, stars, grain, iris, HUD) but not the *direction*. The 3D object needs a script.

---

## 6. Top 8 issues (summary for the orchestrator)

1. **B1 · critical.** There is no signature moment on Home. The best idea (the C·W globe) is buried at Home scene 9 and Story scene 4. Fix: §4.1, the splash-to-hero "gold thread" sequence.
2. **B2 / B15 · critical.** There is no imagery: no faces, no places, and the founder frame and video are empty. Fix: §4.5, a duotone founder portrait (ask the client now), place-photography, and a typographic portrait meanwhile.
3. **B3 · high.** The globe is wallpaper in about 30 of 42 scenes, often cropped in corners. Fix: §4.2, show it in 1 scene in 3, large, with a job.
4. **B4 · high.** The globe's arcs render as a tangled scribble that spills off the sphere. Fix: §4.2, clean great-circle arcs with an animated draw and travelling pulses.
5. **B5 · high.** The mechanical ink → bone → gold rotation and flat mustard gold fields cheapen the gold. Fix: §4.3, roughly 70% ink, at most one metallic gold field per page, gold as light.
6. **B6 · high.** Every scene uses the same "eyebrow plus headline left, list right" layout with no scale contrast. Fix: §4.4 and §4.6, Monument, Reel and Stage archetypes, and one gold italic accent per headline.
7. **B7 / B11 · high.** Clutter: chrome on every edge (removed in Round 4), placeholder boxes louder than the copy, offset double-border cards. Fix: §4.7, restyle `.ph` while keeping the text, at most 2 actions per scene, no misregistered plates.
8. **B8 / B9 / B10 · high to medium.** Clipped scenes and footers, a 15 px right-edge seam on every desktop frame, and a generic splash. Fix: §4.9 and §4.1.
