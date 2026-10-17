# Round 5 research: what makes C:\Portfolio feel premium and alive

The user's own reference project, read in full and run locally. It was served on :8411, and 28 frames were captured at 1440x900 and 390x844 with a CDP script modelled on `tools/fit-audit.mjs`; the server was then stopped. The captures are in the scratchpad: `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\pf\shots\`.
The project is a clone of the *style* of hyowonbernabe.me (see `_ref/index.html`, `_ref/site.js`): a 24-shot scroll film on a fixed 1920x1080 stage.

Files read: `index.html` (43 lines), `CONTRACT.md`, `css/style.css` (135), `js/content.js`, `js/main.js` (457), `js/scenes/{util,index,boot,about,arsenal,projects}.js`, `js/gun.js`, `_ref/site.js`, `_ref/shots.json`, `_ref/motion-test/assets/{cuts,decode}.js`, `film.css`.

---

## 1. The one-sentence answer

The Portfolio feels premium because **each screen says one thing, very large, and then moves**. There are 24 shots, but each carries about 5 to 40 visible words, one dominant typographic object, and one motion idea. The whole system has only three colours, two type families and one transition grammar (the iris), so every shot looks like part of the same film. Cargado's home has 12 scenes and about 1,600 words, roughly 130 words a scene, each with eyebrow, H1, sub, ticks, form, chips and proof strip. That is what the user experiences as "clogged".

---

## 2. Composition

| Trait | What the Portfolio does | Where |
|---|---|---|
| Fixed authored canvas | Every scene is drawn in absolute px on a 1920x1080 stage, scaled with `contain` (`fit()` in `js/main.js`). The designer controls every gap, like a poster. | `main.js` `fit()`, `css/style.css` `#stage` |
| One hero object per frame | Name (290px), "ACCESS GRANTED" (236px), "EXPERIENCE" (270px), "LOADED." (230px), "08 AND COUNTING" (136px), "LET'S TALK" (250px). Everything else is small mono metadata. | `boot.js` `nameHtml`, `about.js` `workScene`, `arsenal.js` loaded, `projects.js` blast |
| Extreme scale contrast | Display text runs 136 to 290px; labels run 12 to 22px mono. Almost nothing sits in between, which is what reads as "editorial". | `.mega/.big/.mid` vs `.mono/.eyebrow` in `style.css` |
| Generous fixed margins | Content sits at 90 to 130px from the stage edge (the contract demands ≥ 90). The HUD corners at about 40px frame it. | `CONTRACT.md` quality bar; `#hud` |
| Asymmetric grids, rules not boxes | Hero: name on the left with the title and tagline tucked into the gap beside "VON". Work list: full-width rows separated by hairlines, with a 5-column grid inside each row (`70px 1fr 400px 170px 56px`). | `boot.js` `.nm-row`; `about.js` `.wr` |
| Empty space is a feature | Education uses about 60% of the frame; location leaves the centre empty between the type and the globe; loaded-rest gives the gun the top 60%. | screenshots `d-education`, `d-loaded-rest` |
| Ghost / outline layer for depth | Giant outline numerals (`.ol`, `-webkit-text-stroke`) at 0.14 to 0.22 opacity behind the content ("5" at 1100px in showcase, "01 to 04" in word-burst), plus outline words mixed with solid ones ("AND COUNTING", "TALK", "ONE WEAPON."). | `projects.js` `.pj-ghost`; `boot.js` `burstHtml` |

## 3. Type scale

- Display: Geist 900, uppercase, tracking −0.03 to −0.05em, line-height 0.84 to 0.95. The tight leading makes stacked lines lock together like a logo.
- Labels: Geist Mono 600/700, uppercase, tracking 0.18 to 0.34em, 12 to 22px. Wide tracking at small size gives the "instrument / film slate" texture.
- Body copy is almost absent: one 34px tagline line on the hero and one 34px pitch line per showcase. **No paragraph anywhere is longer than one sentence.**
- Effective steps (stage px): 290 / 250 / 170 / 150 / 104 / 84 / 64 / 46 / 34 / 22 / 20 / 16 / 12. That is about 1.2 to 1.5 jumps at the top and a large gap from 64 down to 34.
- Line reveals: every display line is wrapped in `.mask > span` and animated `yPercent: 110 → 0` with `power4.out`/`expo.out`, staggered 0.08 to 0.14s.

## 4. Spacing rhythm

- A row pitch of 175px on work-rest, 64px on chips and 84px on contact rows; each rhythm is set by the row height, not by padding.
- Repeated anchors: eyebrow at top ≈ 100 to 130, headline right under it, a rule (`scaleX` 0 → 1) separating head from body, content block, then footer meta at about 900 to 940. Almost every scene follows this **eyebrow, headline, rule, content** skeleton, so the eye always knows where to look.
- Tight inside groups and huge between them: the name block lines touch (lh .84), while the gap to the meta is 150px or more.

## 5. Scene choreography (inside a scene)

Each scene is a paused GSAP timeline scrubbed by scroll. Every tween is `from/fromTo`, deterministic and reversible (`CONTRACT.md` "Rules for anim").
The typical beat sheet (seconds within a 2.5 to 4s scene):
1. 0.0 to 0.2: the frame device arrives (rule `scaleX`, bar `scaleY`, brackets scale in from 1.4 to 1.8).
2. 0.1 to 0.5: the eyebrow slides in x −24 to −40 or decodes in.
3. 0.2 to 0.9: the headline lines rise out of masks, staggered.
4. 0.5 to 1.3: secondary content staggers in (rows, chips, list items, x −28 with a 0.07 stagger).
5. Rest frame (holds, `HOLD_PX` 800 to 900px of scroll) where people read or click.
6. Exit: lines drop `yPercent −110`, items fade, then the **iris** (next field's colour) grows from a meaningful point. The point can be the name's full stop, the gun, or the centre (`addIris` in `main.js`, `cuts.js`).

Signature moves worth naming:
- **Full-stop iris**: the period after "JOSHUA." pops in with `back.out(3)` and then swells to flood the frame in ink (`boot.js` `nameAnim`). The punctuation becomes the transition.
- **Decode / scramble**: characters flicker through glyphs and lock left to right, all scrub-safe through a hash rather than random numbers (`util.js` `decode`, the richer `_ref/motion-test/assets/decode.js` with head/tail windows).
- **Counters**: the match %, minutiae, the "08 AND COUNTING" project count and the lat/lon readouts all count through `count()` in `util.js`, deterministic and scrubbed.
- **Quad burst**: four colour cells scale in with words slamming from 1.9x, then all collapse to the centre (`burstAnim`).
- **Collapse to the dot**: the entire previous frame squashes to a line, then to a point, which becomes the next scene's origin (`collapseAnim`). This gives continuity across a cut.
- **Strike-through**: words appear, then a red bar wipes across them (`scaleX`) and they dim, which tells a story with three words (`projects.js` `.pj-strike`).
- **Cards deal in**: project cards arrive one by one, alternating ±170px y with `rotationY ±75` and `transformPerspective 1100`. Certs fan out from the centre to slight rotations (−5/3/−3/5°).

## 6. Transitions between scenes

- **One grammar**: when the field colour changes, a circle in the next colour grows from a chosen origin (`IRIS_SEC 0.55`, `power3.in`) over the end of the outgoing scene. When the colour stays the same, nothing extra happens; the scene's own exit does the work.
- Mid-scene `turn`: a scene can flip field halfway (work: red → ink with text colours flipping via `tl.set` as the circle passes under them).
- `#viewport` background tracks the field 0.25s before the cut so no seam ever flashes.
- The cut is rhythmic: fields alternate ink, red, bone, so every 1 to 2 scrolls the whole screen changes colour. That is the main source of the "alive" feeling with almost no imagery.

## 7. Cursor / hover

- A 32px ring that follows with `gsap.quickTo` (0.15s); it pulses its glow on a 2s loop, scales 1.9x over `a, .chip`, and is hidden on coarse pointers (`main.js` "cursor, pointer").
- Stars are pushed away from the cursor within a 140px radius and ease back (`drawStars`), so the background reacts to the user without any click.
- The gun sways with the smoothed mouse position and a red point light follows the cursor (`render({sway, light})`).
- Hover states are **solid colour swaps**, not shadows. A work row floods red with the text going ink; a contact row floods ink and slides its padding from 24 to 46px; arrows nudge (+6, −6). They are fast (0.2 to 0.25s) and unmistakable.
- Arsenal rest: hovering a gun part or a chip shows a skills panel that follows the pointer, plus a red targeting ring tracked to the 3D part (`setHover`, `placePanel`, `placeRing`). Touch uses tap-to-toggle; keyboard focus on a chip opens the panel.

## 8. 3D

- One procedural three.js object (low-poly pistol from boxes and cylinders, no model files, `gun.js`). It has a gunmetal `MeshStandardMaterial`, bone `EdgesGeometry` outlines at 0.5 opacity, ACES tone mapping, a key light, a red back light, and a red cursor point light.
- It is a **character that travels**. A shared poser (`makePoser` in `util.js`) tweens one pose state across nine scenes: it enters, explodes (with labels tracked by `project()`), pushes in on each part, reassembles and flies off. That continuity is the wow; the model itself is simple.
- It is only visible in the scenes that use it (`gun: bool`), and it is lazy-imported while the boot plays (the boot waits at 97% for it, with a 15s safety timeout).

## 9. Sound

None. The Portfolio has no audio at all; its "alive" feeling comes entirely from motion, colour cuts and cursor response. (Cargado's SFX is its own addition. Keep it subtle; the reference proves sound is not what makes it premium.)

## 10. Pacing and content per screen

- The boot (≈5.4s) autoplays as a preloader, then **lands and rests** on the name (`LANDING ["name", 1.5]`). Scroll is locked until then.
- Scroll distance is about 850 to 1,000px per scene, scaled by duration (clamped 0.8 to 1.7x), with an extra 800 to 900px hold at rest frames. Only 6 of the 24 shots are rest frames (with links or clicks); the rest are "beats" between them.
- Content per screen (approximate visible words): biometric about 25, name about 15, word-burst 4, location about 10, education about 12, work-rest about 30, part close-ups about 12, deployed about 35, showcase about 30, contact about 25. **The ceiling is about 40 words on any screen.**
- Rhythm: big statement beat, then detail rest, then big statement beat. "EXPERIENCE" (one word) precedes the four-row role list; "ARSENAL." precedes the exploded view and the parts; "08 AND COUNTING" is itself the header of the grid.

## 11. Honest weaknesses (do not import these)

- **Phones**: the stage is `contain`-scaled, so at 390x844 the 1920x1080 frame shrinks to about 0.2x. Labels become about 3px and the hero name about 58px in a strip in the middle of a red screen (`m-name-1.5.jpg`). `_ref/site.js` solves this with a per-scene "camera" (`fit.js`); the Portfolio clone does not. Cargado's audience reads on phones, so Cargado must stay responsive (fluid `min(vw,vh)` type, Round 4 toolkit) rather than adopting a fixed stage.
- Text is drawn in absolute px; mono labels at 12 to 18px stage px fall below 10px on a 1366x768 laptop (scale 0.71). For a 30 to 40 audience the label floor must be about 14 to 15 CSS px.
- Very wide letter-spacing on all-caps mono plus red-on-red dim text is low-contrast (`.red .dim` at 55% ink).
- `cursor: none` on the body hides the native cursor; Cargado's plan correctly keeps the native cursor.
- The boot locks scrolling for about 5s. That is fine for a portfolio, but too long for a service business: Cargado's splash must stay ≤ 2.2s, as planned.
- Content is a hidden `#about-text` copy for screen readers; Cargado's real HTML content is better and must stay.

---

## 12. What Cargado should borrow (concrete, with sources)

Ordered by impact on the "basic / clogged" complaint.

1. **A word budget per scene: ≤ 40 visible words, one idea, one action.** The Portfolio's discipline across all 24 shots is the source. Move secondary detail into the Round 4 toolkit (steppers, tabs, dialogs) or onto services/legal. For example, the home hero becomes the H1 plus one line plus one button; the chips, city field and proof strip move to the next scene or a dialog.
2. **Statement beat before every detail rest.** Like "EXPERIENCE", then the role list, or "ARSENAL.", then the parts. Insert short (1 scroll, about 1.5 to 2s), almost wordless beats in Times New Roman at 160 to 260 stage-px equivalent (≈ `clamp(4rem, 12vmin, 13rem)`). Examples: "One Message." then how-it-works; "Across Canada." then the finder/globe; "Her Own Three." then founder services; "Straight Answers." then the FAQ. Beats cost no layout space and add drama between the dense scenes. (`about.js` `workScene`, `arsenal.js` arsenal)
3. **Scale contrast: drop the middle sizes.** Use display at 4 to 13rem, then UI labels (Poppins, 0.8 to 0.95rem tracked caps) and body at 1.0625 to 1.1875rem, with few 1.5 to 2.5rem subheads. Today Cargado has many mid-size headings and cards competing. (`style.css` `.mega/.big/.mid` vs `.mono`)
4. **The eyebrow, headline, rule, content skeleton on every scene,** with the gold rule `scaleX` 0 → 1 between head and body (Round 4 already bans decorative dashes *before text*; a separator rule between blocks is different and is allowed by "rules and dividers instead of boxes" in PLAN §1). Anchor positions stay the same on every scene so the eye learns them. (`boot.js` `.nm-rule`, `about.js` `.ed-rule`, `.tz-rule`)
5. **Punctuation as the transition.** Make the full stop of the hero H1 (or the dot of the CW monogram) pop in and then swell into the gold iris that opens the next scene. This is a one-off signature moment that is very memorable and cheap: one element and two tweens. (`boot.js` `nameAnim`, `.nm-pw .iris`)
6. **Iris from meaningful origins only.** Cargado already has `data-iris`; borrow the rule "the iris grows out of the thing you just looked at": the CTA button, the monogram, the globe pin, the period. Same-field neighbours get no iris, only exits. Also borrow the `#viewport` pre-tint 0.25s before the cut, so no seam ever shows. (`main.js` `addIris`, `show()` `bgField`; `cuts.js` host-anchored iris)
7. **Field rhythm ink, gold, ivory, changing every 1 to 2 scrolls,** with full-bleed colour (not boxed cards on a colour). The home already alternates; keep it strict and make the gold scenes truly full-bleed gold with black type, like the Portfolio's red. (`shots.json` field order)
8. **Rows with hairlines, not cards.** Work-rest and contact rows (`about.js` `.wr`, `projects.js` `.pj-row`) suit Cargado's services list, situations ("Sounds like you?"), FAQ questions and contact methods. Use full-width rows, a big label, small meta on the right and an arrow, with a solid gold flood on hover and the padding sliding 24 → 46px. This removes the card clutter at once.
9. **Outline / ghost type for depth instead of more elements.** Use giant outline numerals (01 to 04 in the process, the founder's three businesses) at about 0.12 to 0.2 opacity behind the content, and outline-plus-solid word pairs ("One Message. *The Right Person.*"). Times New Roman outline at large size looks luxurious in gold stroke. (`projects.js` `.pj-ghost`, `.ol`)
10. **Counters and decode scrubbed by scroll** for proof numbers and eyebrows (`util.js` `count`, `decode`; richer `_ref/motion-test/assets/decode.js`). Keep them deterministic (hash, not `Math.random`). Use them sparingly, on one counter per page, for example "[n] Provinces" or "[n] Categories" (bracket placeholders still apply).
11. **Strike-through storytelling** for the compare scene: "Five Searches", "Cold Calls" and "Guesswork" each get struck by a gold bar, then "One Message." lands. (`projects.js` `.pj-strike`)
12. **Deal-in cards with perspective** for the few true card sets (partner tiers, founder's three services): alternate y ±, `rotationY ±60–75`, `transformPerspective ≈1100`, landing at slight rotations. (`projects.js` `deployed` anim, `credentials` anim)
13. **3D object as a travelling character,** not a decoration. Give the network globe a shared poser like `makePoser` so one pose state is tweened across scenes. It enters on the hero, pins a city on "Across Canada", sits behind the CW monogram on the story teaser, and exits on the close. Use it in only about 4 to 5 scenes per page and hide it elsewhere (`gun:false`). (`util.js` `makePoser`, `arsenal.js` `P.pose`)
14. **Cursor-reactive background.** Stars are pushed by the pointer in a 140px radius and the globe's light or tilt follows the smoothed mouse. This is ambient, subtle and makes the page feel alive without moving content. (`main.js` `drawStars`, `mouse.sx/sy` smoothing `1 - exp(-dt*6)`)
15. **Hover = instant solid colour swap + arrow nudge** (0.2 to 0.25s), clearer for older users than glow, shadow or tilt alone. (`about.js` `.wr:hover`, `projects.js` `.pj-row:hover`)
16. **Rest frames hold** (`HOLD_PX`): this maps directly onto Round 4 snap. Each scene's hold point equals the landed state; transitions are the short scrubbed parts between them.
17. **Landing rest after the splash**: the film lands on a fully composed hero and rests; a single animated scroll cue (`#cue`, a 1px line with a dot travelling down) appears only there. (`main.js` `cueEl`, `style.css` `#cue`)
18. **Grain** as a generated 256px noise data-URL with a `steps(8)` jitter at 0.1 opacity (`main.js` `makeGrain`, `style.css` `#grain`). Cargado already has grain; match this subtlety (0.06 to 0.1) so it reads as film, not dirt.

### Adapt for the 30 to 40 audience (keep it modern, make it easy)
- Keep native scroll semantics and snap (Round 4): one gesture equals one scene. Do not lock the scroll for a boot.
- Floor sizes: body ≥ 17px, UI labels ≥ 14px with at most 0.12em tracking (the Portfolio's 0.22 to 0.34em is too wide for readability), and tap targets ≥ 44px.
- Contrast: no 55% dim text on gold; use `#0B0B0C` at 80% or more on gold and gold-dark `#7A5C12` on ivory.
- One obvious primary action per scene (WhatsApp / "Get My Introduction"), always in the same place within the skeleton.
- Motion: snappy (0.5 to 0.9s per reveal), no gimmicks that hide the content for more than about 0.6s, and reduced motion respected.

## 13. What Cargado must NOT copy

- **Content or brand**: the name, the "Full Stack AI Engineer" copy, projects, certs, the pistol model and all weapon or military language ("ARSENAL", "LOADED", "ammo" pips, "biometric scan", "ACCESS GRANTED", "Magazine full", "blast"). A gun or security theme is wrong for a faith-subtle Canadian referral and insurance brand.
- **The palette**: red `#ff0f0f`, bone `#ededed`, blood `#4a0000`. Cargado stays black and gold (`PLAN.md` palette). Map the roles only: red becomes gold, bone becomes ivory.
- **Fonts and case**: Geist 900 all-caps and Geist Mono. Cargado uses Times New Roman in Title Case for display, Manrope for body and Poppins for UI. Borrow the *contrast* and *tight leading*, not the face or the uppercase.
- **The fixed 1920x1080 contain-scaled stage**: it breaks on phones (§11). Keep Cargado's fluid, responsive scenes.
- **The HUD corners, ammo pips and act label**: Round 4 removed the HUD and decorative dashes; do not reintroduce them in another form. The eyebrow `::before` 56px dash is explicitly banned in Round 4.
- **`cursor: none`**: keep the native cursor (PLAN §1.4).
- **The 5-second locked boot**: keep the splash at ≤ 2.2s.
- **Hidden `#about-text` as the accessible content**: Cargado's visible HTML is the content; keep it.
- **Win/featured seal badges and a phone mock with fake app UI**: these risk looking like invented endorsements or proof (CR02/CR16: no invented reviews, partners or "verified" badges).
- **Compliance**: none of the Portfolio's "punchy one-liner" style may delete Cargado's commission/independence notices, "strategy and coaching only", or `[bracket]` placeholders. Shorten them into one-line notices on the scene, with the full text in legal or a dialog (Round 4 rule: move, never drop).

## 14. Suggested scene skeleton for Cargado (synthesis)

```
[eyebrow: Poppins 14–15px, gold, tracked .12em]          ← may decode in
[Display headline: Times New Roman, Title Case, 1–2 lines, clamp(3.5rem, 11vmin, 12rem), lh .92]
                                                       ← lines rise from masks, .1s stagger
[gold hairline rule, scaleX 0→1]
[ONE of: 1 sentence (≤ 22 words) | 3–5 hairline rows | 3 dealt cards | form step]
[one primary action]           [one quiet secondary link]
                                         (ghost outline numeral / globe behind, low opacity)
exit: lines drop, then iris (next field) grows from the action/period/pin
```
Beat scenes (between dense scenes): only the display line, plus optionally one outline word and the globe's pose change.
