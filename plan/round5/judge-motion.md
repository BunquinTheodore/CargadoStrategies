# Round 5 · Judge: Motion and Experience

Lens: how scrolling feels, transitions between scenes (iris, fields), reveal animations, text effects, hover and cursor, SFX, splash timing and pacing. Does it feel cinematic and smooth, or gimmicky and slow? I also checked the reduced-motion and flow experience.
Judged as an Awwwards juror and as a conversion-focused UX lead, for a 30–45 audience: busy adults on laptops and phones, deciding whether to trust someone with their mortgage, insurance or business.

## Evidence

- **Code read:** `film.js`, `film-map.js`, `film-reveals.js`, `film-alive.js`, `film-flow.js`, `textfx.js`, `interact.js`, `cursor.js`, `sfx.js`, `layers.js` (stars) and `splash.js`.
- **Screenshots:** `plan/round5/shots/` (index, story and splash at 1440x900; the rest of the capture run had not finished).
- **My own CDP capture:** real `mouseWheel` input, 100 px per notch with 110 ms between notches, which is how a person flicks a mouse wheel. A JPEG was taken every 2nd notch. The output is in `plan/round5/motion-frames/`:
  - `index-1440-frames/`, `story-1440-frames/`, `services-1440-frames/`, `partners-1440-frames/`, `legal-1440-frames/` and `index-390-frames/`: frames named `NNN-<scene>.jpg`, where NNN is the wheel-notch number;
  - `index-1440-midstop/` and `services-1440-midstop/`: these runs hit the flow fallback, see B11;
  - `results-*.json`: the notch counts.
- **Probe script:** `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\motion-probe.mjs`.
- **Caveat:** headless Chrome ran on SwiftShader, and the dev server was under load from the parallel capture run. The frame-time numbers are therefore not meaningful and are not used. Notch counts and visual states are reliable.

### Measured pacing (wheel notches to reach each scene, 1440x900)

| page | notches between scene changes | full page | notes |
|---|---|---|---|
| index | 6, 9, 7, 9, 8 … | ≈ 95 (12 scenes × ~8) | about 3–4 of every 8 notches show an almost empty colour field |
| services | 6, 8, 9, 8, 10, 9 | ≈ 60+ | finder, categories and inquiry pan their content |
| story | 6, 9, 7, 9, 8, 8 | 54 | the best-paced page |
| partners | 6, 8, 9, 8, 8, 8, then **23** in `apply` | 77 | the form pans for 23 notches |
| legal | 6, 9, 12, 10, 9, 8 | 64 | long text pans under a "rain" of star streaks |
| index @ 390x844 | hero 11, video 8 | – | the hero form pans on the phone |

On today's build one scene costs about **800 px of wheel**, which is about 8 notches (MOTION_PX 640 + HOLD_PX 180 in `film-map.js`). Round 4's "one scroll = one scene" fixes the count. It does **not** fix what is inside a transition (see B1 and B2).

---

## 1. Scores (this lens only)

| page | score | one-line justification |
|---|---|---|
| Splash (all pages) | 6 / 10 | The gold monogram and iris exit are elegant (`shots/splash/1440x900/splash.png`). It replays on **every** page load, costing about 1.9–3.2 s each time. |
| Home `index.html` | 5 / 10 | Real cinematic bones (iris fields, character reveals, the globe). But every transition has 3–4 notches of empty colour, the eyebrows scramble into `$%#` glyphs, and 12 scenes take about 95 notches. |
| Services `services.html` | 4.5 / 10 | Headings slide under the header while scenes pan (`services-1440-frames/047-categories.jpg`, `057-inquiry.jpg`). Forms and panels tilt in 3D. Long rest stops. |
| Our Story `story.html` | 7 / 10 | The "W Stands for Wealth / C Stands for Cargado" logo scene is the one true wow moment on the site (`story/1440x900/04-logo.png`). Pacing is still slow, and the decode noise is still there. |
| Partners `partners.html` | 5 / 10 | The hero is calm and strong. Tier cards arrive tilted and skewed (`partners-1440-frames/027-tiers.jpg`), and the apply form pans for 23 notches. |
| Legal `legal.html` | 3.5 / 10 | The page that needs to be calmest is the busiest: star "rain" streaks behind long reading text, decode on every heading, and panning text (`legal-1440-frames/021-privacy.jpg`). |
| Reduced motion / flow | 6.5 / 10 | Honest and readable: stacked sections, no splash animation, final states shown. But it is visually flat (no globe and no field colour drama), and a slow load drops visitors into it after 8 s. |
| **Overall** | **5 / 10** | The engine is technically excellent (scrubbed, reversible, transform/opacity/clip-path only, loops that sleep). The *direction* is the weakness: too many effects at once, nothing ever "lands" with confidence, and the pacing feels like wading. |

---

## 2. WHAT IS GOOD (keep)

1. **The story logo scene** (story, `#logo`). The globe sits inside the C·W monogram while "W Stands for Wealth." and "C Stands for Cargado." arrive from opposite corners. It is the only moment where motion *means* something: the network (globe) becomes the brand (monogram).
   - Files: `shots/story/1440x900/04-logo.png`, `motion-frames/story-1440-frames/023-logo.jpg`, `027-logo.jpg`.
   - Keep it and make it the model for the whole site (see I3).
2. **The iris field change itself.** A gold or ivory circle swelling over black is a strong, on-brand "film cut". It works best when the origin is off-centre and the circle is big and fast.
   - Files: `index-1440-frames/005-hero.jpg` (ink→bone), `013-video.jpg` (bone→gold), `029-compare.jpg` (bone→ink).
   - Keep the iris for *chapter* changes (see B3).
3. **The splash design.** The monogram, a Times wordmark and a hairline gold progress line on near-black. It is quiet and premium, it is in the HTML so it paints instantly (FCP was 244–768 ms when the server was not overloaded), and it never traps focus (`shots/splash/1440x900/splash.png`). Keep the look; change how often it plays (B6).
4. **Character rise on display headings, when it is short.** Times New Roman letters rising out of a mask read as "editorial" and premium (`index-1440-frames/031-how-it-works.jpg`, "After You Send It" mid-rise). Keep it for H1s only.
5. **Engine discipline.**
   - Everything is fromTo and reversible, so deep links and back-scrolling always land in the right state (`film-reveals.js`).
   - Only transform, opacity and clip-path are animated.
   - The rAF loops sleep when idle (`film-alive.js`, `cursor.js`, `layers.js`).
   - Phones drop the rotateX depth (`depthOn()` in `film-reveals.js`).
   - This is better engineering than most Awwwards sites. Keep it.
6. **Cursor ring and magnetic CTAs.** Done properly: the native cursor stays visible, the ring is decorative and only used with fine pointers, and the pull is capped at 10 px (`interact.js` MAG_MAX_PX). Over the primary gold CTA it adds a tactile "this is the button" feel.
7. **The globe as a persistent character.** It drifts between poses so the page feels like one continuous shot (`index-1440-frames/005-hero.jpg` → `015-situations.jpg`), and the gold arcs leaving it are lovely.
8. **Reduced motion is respected.** `film-flow.js` gives real stacked sections, the splash fades in 220 ms, and tilt, magnetic pull, drift and cursor effects are all off. That is the correct behaviour for older or vestibular-sensitive visitors.
9. **Phone pacing on the hero** (`index-390-frames/001-hero.jpg`). It is 2D, readable, and the gold CTA is always in reach. The motion does not fight the thumb.

---

## 3. WHAT IS BAD

Severity: critical = loses visitors or trust; high = clearly hurts the wow or the 30–45 user; medium = noticeable polish defect; low = nit.

| # | Defect | Where / evidence | Why it hurts | Severity |
|---|---|---|---|---|
| B1 | **Dead air in every transition.** The old content leaves, then the iris fills the screen with an *empty* colour field for 3–4 notches, and only then does the new content arrive. The fade starts at 30 % of the in-phase and reveals at 38–62 % (`film.js` SCENE_FADE_AT / REVEAL_START). | `index-1440-frames/013-video.jpg` (a blank gold disc with one stray `#`), `029-compare.jpg` (empty ivory and a black disc), `005-hero.jpg` | This is about 40 % of the scroll on home. To a 30–45 visitor, a blank screen means "did it break? is it loading?". Cinematic cuts *overlap* (J-cuts); this reads like a slideshow with gaps. | **critical** |
| B2 | **Decode scramble turns labels into `$ + * # > & = ? § < %` garbage**, on every eyebrow, both in *and* out. | `index-1440-frames/003-hero.jpg` ("/$ +*#>&=? §<NADA"), `015-situations.jpg` ("START WITH YOUR SIT/$+*#>"), `story-1440-frames/019-founder.jpg` ("#>&=ER"), `027-logo.jpg`, `services-1440-frames/011-ours-insurance.jpg` ("$+* #>&=?§ANCE"), `partners-1440-frames/027-tiers.jpg` | On a money and insurance site, `$` and `%` flickering in a label looks like a pricing glitch or corrupted data. It is a developer-portfolio trope (it came from the Portfolio's decode.js) and does not fit a trust brand. Older readers try to read it and fail. | **high** |
| B3 | **Luminance strobe.** On home the fields go ink → bone → gold → bone → ink → bone → gold …, so nearly every scroll flips the whole screen between near-black and near-white. | `shots/index/1440x900/01…06` in sequence; `index-1440-frames/005`, `013`, `029` | It is tiring on a laptop at night and reads as "every section is a different website". Premium sites hold a key light for a whole chapter. The iris also loses its impact when it fires 11 times. | **high** |
| B4 | **Scrubbed reveals never "land" on their own.** Every element's state is tied to the scroll position, so a visitor who stops mid-gesture is left with half-faded text, letters halfway through rotateX, and tilted panels. | `index-1440-frames/031-how-it-works.jpg` ("Send It" letters tumbling, steps at 40 % opacity), `services-1440-frames/011-ours-insurance.jpg` (greyed CTA button mid-fade), `partners-1440-frames/027-tiers.jpg` (skewed tier cards) | Half-states look broken in a screenshot and make text hard to read. Round 4 snap will settle the *scroll*, but with scrubbed tweens the glide itself will still show slow-motion half-states. | **high** |
| B5 | **Pacing: about 8 notches per scene and about 95 to the end of home**; partners `apply` takes 23 notches. The hold is only 180 px, so the out-animation (decode-out, chars leaving) starts about 2 notches after a scene lands. | `results-frames.json` / `results-count.json`; `story-1440-frames/027-logo.jpg` (the logo scene already decoding out) | The visitor works hard to arrive and is immediately pushed on. Round 4 fixes the count, but home still has 12 stops. | high (fixed in part by R4) |
| B6 | **The splash plays on every page load.** MIN 900 ms + 260 ms line fill + 760 ms iris means at least about 1.9 s, up to about 3.2 s at MAX_MS, before the hero on *every* navigation (`splash.js`). No sessionStorage skip exists. | All 5 pages have `id="splash"` | It is charming once and a toll after that. A visitor comparing Services → Partners → Story pays it 4 times, and for 30–45 users "slow" quickly becomes "not serious". | **high** |
| B7 | **Star velocity streaks look like rain.** STAR_STREAK_PER_VELOCITY 1.6, max 90 px. On ink fields every scroll draws dozens of vertical gold and white dashes across the content. | `legal-1440-frames/021-privacy.jpg` (heavy), `services-1440-frames/037-finder.jpg`, `partners-1440-frames/027-tiers.jpg`, `index-1440-frames/031-how-it-works.jpg`, `index-390-frames/007-hero.jpg` | It reads as weather, a glitch or a screen defect, not "speed". Behind legal and finder text it makes reading harder. | **high** |
| B8 | **SFX on by default, with no off switch after Round 4.** One tick per 100 px of scroll (about 8 per transition), plus a whoosh and a two-note tone per scene, hover ticks on every control, and click blips (`sfx.js`). Round 4 removes the speaker toggle. | `sfx.js` hookFilm / hookPointer | Many 30–45 visitors browse at work, on a train or at night next to a partner. Unexpected sound on a financial site feels like a game. With no mute, the only escape is closing the tab. | **high** (the R4 decision stands; tame it, see I6) |
| B9 | **3D tilt and sheen on forms and long panels**: `.intro` (hero form), `.inquiry-panel`, `.legal-panel`, `.offer`, `.tier`. The tilt only stops while a text field has focus. | `interact.js` TILT list; hero form in `shots/index/1440x900/01-hero.png`; `services-1440-frames/057-inquiry.jpg` | A surface that moves under the pointer while you aim at a chip or checkbox breaks Fitts's law and feels unstable. Older users read the motion as "I did something wrong". Tilt belongs on small, glanceable cards, not on forms or legal text. | medium |
| B10 | **Headings pan under the fixed header** in scenes taller than the screen. | `services-1440-frames/047-categories.jpg` ("Our Partners'." cut, ghost line above), `057-inquiry.jpg` ("Tell Us What" clipped), `legal-1440-frames/021-privacy.jpg` | It looks unfinished and the context is lost. Round 4 decided no pan and fit-to-screen, so this goes away if the fit contract is met. | medium (R4) |
| B11 | **Fragile start-up: one failed module means no film *and* no header.** Under load, one 404 or refused module (`home-tweens.js` refused in my run) made the head-script safety timer switch to flow mode after 8 s. `chrome.js` never ran, so there was **no header or nav at all** (`STATE header:false`). | `motion-frames/index-1440-midstop/stop-*.jpg`, `services-1440-midstop/` | A visitor on a weak connection watches a static hero for 8 s, then the layout jumps into a different mode with no navigation. The production esbuild bundle (one file per page) lowers the risk, but the 8 s cliff is still there. | medium |
| B12 | **Header goes invisible mid-iris.** The header colour follows the field blend, so halfway through an iris the nav links are ivory-on-ivory or black-on-black, and the wordmark splits colour. | `index-1440-frames/005-hero.jpg` (nav faded to almost nothing, "Cargado Strate|gies" split) | The nav vanishes exactly while the visitor is moving, which is when they might decide to jump. | medium |
| B13 | **The globe wanders, gets cropped and collides** with corners, the WhatsApp float and content. It is cut off at the left in situations, at the bottom in how-it-works, and behind the float in compare and video. | `shots/index/1440x900/03-situations.png`, `04-compare.png`, `05-how-it-works.png`, `02-video.png` | A hero object that sits half off-screen in random corners reads as leftover decoration, not a protagonist. It never *does* anything on home. | medium |
| B14 | **Too many stacked micro-effects.** Cursor ring morph, magnetic pull, tilt, sheen, "alive" heading drift, letter-roll on every button and nav link, hover tick SFX, star push-away, grain. They all happen at once on one hover. | `interact.js`, `cursor.js`, `film-alive.js`, `textfx.js` initRoll | Each is tasteful alone; together they are noise, and that is exactly the "clogged" feeling the user describes. Letter-roll on nav also makes the label briefly unreadable at the moment of choosing. | medium |
| B15 | **Mid-transition 3D on media.** During the out-phase the video frame becomes a grey, see-through, skewed quad (rotateX + z + opacity). | `index-1440-frames/005-hero.jpg` (grey trapezoid) | At 50 % opacity over ivory, the near-black video frame turns muddy grey. It looks like a rendering bug, not depth. | medium |
| B16 | **HUD timecode `00:15`** and the scene counter suggest a video player the visitor cannot control. | every 1440 shot | It means nothing to this audience. Already removed in R4. | low (R4) |
| B17 | **Full-screen clip-path circles are repainted every frame.** A circular clip-path on a full-viewport layer is not compositor-only in Chrome. Stacked on the stars canvas, three.js, grain and hundreds of char spans, it is the likely source of jank on 4–6 year old laptops. | `film.js` iris; `layers.js` | The juror's "4x CPU throttle" test. This was not measurable here (SwiftShader), so it is flagged for the perf pass. | low–medium |

---

## 4. WHAT NEEDS IMPROVEMENT (ranked by impact)

The direction in one line: **"fewer, bigger, landed".** Make one signature transition per chapter, have every scene arrive fully composed in under a second, and make the globe the storyteller. Remove the noise. This matches the research juror note (`research-awards.md` §0): for this audience the wow is *calm confidence*. That means directed transitions, a beautiful first frame and type they never squint at.

### I1. Make transitions *play*, not *scrub*, now that one scroll = one scene (fixes B1, B4, B5). Impact: very high.
Round 4's `film-snap.js` already turns a gesture into "go to scene N". Build on that: when the snap fires, play a **time-based** transition of about 0.9–1.1 s (a GSAP timeline at `timeScale` 1, not scrubbed), and lock input until about 70 % of it has played.

Choreograph it as an overlap (a J-cut), never as a gap:

| t | what happens |
|---|---|
| 0 → 0.35 s | Outgoing content moves out as **one group**: y −40 px, opacity → 0, `power2.in`. No per-letter exit. |
| 0.10 → 0.75 s | The iris opens (`expo.inOut`). |
| 0.30 → 0.95 s | Incoming content arrives *during* the iris, not after it: eyebrow → H1 words → body → CTA, staggered 60 ms, `power3.out`. |
| 1.0 s | Fully composed. Nothing moves after that except the slow globe. |

- The rule: **no frame of the transition may show an empty field**. Test it by seeking to 25 %, 50 % and 75 % and taking screenshots.
- Keep scrubbing only where it is the point: inside the story logo scene, and the globe pose (it can stay scroll-scrubbed for physical inertia).
- Back-scrolling plays the same timeline reversed.
- **Reduced motion:** a 200 ms crossfade.

### I2. Kill the decode scramble; replace it with a clean editorial label reveal (fixes B2). Impact: high.
- Eyebrows: a mask-slide (the label rises 100 % out of an `overflow:hidden` line in 450 ms), *or* a tracking-in (letter-spacing 0.4em → 0.18em with opacity 0 → 1).
- No glyph substitution anywhere. Delete `prepareDecode`/`decodeIn`/`decodeOut` from autoKind's defaults, or keep the code but stop applying it automatically.
- If a "data" flourish is wanted, use it once: the hero stats counting up from 0 when real numbers exist (not `[n]`).

### I3. Give the site a narrative object: turn the globe into the "connection" that the story is about (fixes B13, raises the wow). Impact: high.
Use the story logo scene as the template, because there the globe *becomes* the brand. On home, give the globe a job in each chapter:

| scene | what the globe does |
|---|---|
| Hero | It is big, right-hand side, and rotating slowly. A gold arc travels from a pulsing "you" dot to a partner dot every 4–5 s: the promise ("from one message"), shown. |
| How it works | The camera dollies in. Step 1 lights the "you" dot, step 2 draws the arc to the partner, step 3 sends a small return pulse ("we check in"). The three steps are literally animated on the globe in sync with the copy. |
| Finder (services) | The globe un-wraps or flattens into the Canada map, or the camera settles over Canada and hands off to the SVG map. |
| Story logo | Unchanged. |
| Credits / close | It shrinks into the header monogram, so the page ends on the brand. |

- Fixed anchor rule: the globe always sits in a defined slot per layout (right half on desktop, a top band on phone). It is never cropped by more than 15 %, and never under the CTA. Round 4 shared.md already brings in `globe-fit.js`, so use it on every scene, not only on credits.
- Add inertia: lerp the rotation toward the target with k ≈ 0.08 (Lusion and Oryzo). It makes scrolling feel *physical*, and that is the "experience they won't forget".

### I4. Chapters, not strobes: limit field changes (fixes B3). Impact: high.
- Re-map home's fields into 3 chapters:
  - **ink** for hero, video and how-it-works ("the promise");
  - **bone** for situations, compare and founder ("is this for me?");
  - **gold** used once, as the climax: the partner/CTA scene or the close.
- Use the **iris only between chapters** (2–3 times per page), with a large, fast, off-centre origin that follows the content (for example from the CTA the visitor just passed).
- Inside a chapter, move content only on a constant background (I1). This also means the header stops flipping colour every scroll.
- Apply the same idea to services, partners and legal. Legal should be **one field**, ink or bone, and never change.

### I5. Splash once per session; seamless gold page transitions after that (fixes B6). Impact: high.
- First visit in the session: the current splash, but MIN_MS 600 and an iris of 600 ms.
- Every later page in the same session: no splash. Use a **cross-document View Transition** instead: `@view-transition { navigation: auto; }`, with the header and monogram given `view-transition-name` so they stay put, and a 450 ms gold-edged iris from the clicked nav link's position.
- This is free progressive enhancement in Chrome, Edge and Safari 18.2+. Browsers without it just navigate normally.
- This one change makes the five pages feel like one film, and it is the cheapest wow on the list.

### I6. Re-tune SFX for a no-toggle world (fixes B8). Impact: high.
Round 4 keeps SFX on and removes the toggle, so the sounds must be ones nobody would want to mute:

- **Remove** the scroll tick (one per 100 px) and the hover tick entirely.
- **Keep**:
  - one soft scene "breath" per *snap*: a low sine at about 0.04 peak with a long attack, instead of the whoosh **and** the two-note tone;
  - the click blip at a lower level (peak 0.13 → about 0.06);
  - the success chime on form submit.
- **Splash chime:** only on the first page of the session, and only if audio was already unlocked (it usually is not, so in practice it is silent).
- **Volume:** master gain 0.25 → 0.15.
- **Accessibility:** honour `prefers-reduced-motion` as "reduced audio" too, which means everything is silent except success.
- If the owner later reopens D23-style questions, recommend restoring a quiet speaker icon in the footer, not the header.

### I7. Remove the "rain": calm the star field (fixes B7). Impact: medium-high.
- Cap the streaks at 8 px (STAR_STREAK_MAX 90 → 8, PER_VELOCITY 1.6 → 0.15), or remove them and use a gentle parallax speed-up instead.
- Halve the star count on scenes with long text (legal, finder, inquiry), or fade the stars to 0.25 there.
- Keep the cursor push-away: it is subtle and delightful.

### I8. One hover language, applied by importance (fixes B9, B14). Impact: medium.

| element | hover treatment |
|---|---|
| Primary gold CTA | Magnetic pull (keep) + a slow gold sheen sweep across the button (keep) + cursor ring grow. |
| Text links and nav | The underline draw only, as already planned in Round 3. **Remove the letter-roll** from nav and secondary buttons, so labels never become unreadable at the moment of choice. Keep the letter-roll on the single hero CTA if wanted. |
| Small cards (situations rows, tier cards, partner cards) | Tilt of 4° or less, with the sheen. |
| Forms, inquiry panel, legal panel, offer blocks, the hero `.intro` | **No tilt.** Use a static lift (shadow + 1 px gold border brighten) instead. |

- Remove `film-alive.js` heading drift. It moves text the visitor is reading.

### I9. Never let media pass through muddy states (fixes B15, B12). Impact: medium.
- Media (video frame, map, photos) leaves with a clip-path wipe (inset 0 → inset 0 0 100% 0) instead of an opacity + rotateX fade, so it never turns translucent grey.
- The header switches colour **once, at the iris midpoint** (`gsap.set` at 50 %), not as a blend. Alternatively give the header a subtle backdrop (rgba black 0.35 + blur 8 px on ink chapters, ivory 0.6 on bone) so the nav is legible over any mix.

### I10. Signature moments: two or three, not twenty (raises the wow). Impact: medium.
Pick a few remembered beats and stage them properly, held 1.5–2 s with nothing else moving:

- **Home hero first frame.** After the splash iris, the H1 words rise (by word, not letter) while the globe fades up behind with one arc firing. The form slides in last.
- **"One message instead of five searches" (compare).** Five search-bar ghosts collapse into one WhatsApp bubble, a 1 s morph. It is the brand promise as a visual, and older visitors "get it" instantly.
- **Story logo.** Keep it as is (already the best).
- **Close.** The globe shrinks into the monogram, and the final line "One Message. The Right Person. Close to You." sets in word by word.

These are directed (they say something), which is what juries and 30–45 clients both reward.

### I11. Make the fallback graceful, not a cliff (fixes B11). Impact: medium.
- Render the header and nav in static HTML, or load `chrome.js` as its own tiny non-module script, so navigation never depends on the film's module graph.
- Lower the flow fallback to about 4 s, but only switch if the visitor has *not* scrolled yet. If they have, stay in whatever mode they are in. Never re-layout under the visitor's eyes.
- Flow mode should still get the field colours and a static globe poster image, so it looks designed, not broken.

### I12. Reduced motion: keep it as is, add polish. Impact: low.
- Crossfades of 200 ms or less between snapped sections are allowed (WCAG allows non-vestibular fades).
- Show a static globe poster in the hero so the reduced-motion first frame is as beautiful as the film's.

---

## Top 8 issues (summary)

1. **B1 (critical): dead air.** Every transition shows 3–4 notches of empty colour field. Fix it with timed, overlapping transitions (I1).
2. **B2 (high): decode scramble.** It shows `$%#&` glyphs in labels on a finance site. Replace it with a mask-slide or tracking-in (I2).
3. **B3 (high): luminance strobe.** The ink, bone and gold fields flip almost every scroll. Group them into 3 chapters and use the iris only between chapters (I4).
4. **B4 (high): scrubbed reveals never land.** Half-faded, half-rotated text sits on screen whenever the visitor pauses. Play transitions on a clock after snap (I1).
5. **B6 (high): splash on every page.** It costs about 1.9–3.2 s per navigation. Show it once per session, then use cross-document View Transitions (I5).
6. **B8 (high): sound with no mute.** After R4 there are scroll ticks, hover ticks, a whoosh and a tone, on by default. Cut it to one soft snap breath, a click and success (I6).
7. **B7 (high): star "rain".** Velocity streaks of up to 90 px run behind legal and finder text. Cap them at 8 px or remove them (I7).
8. **B13 + B14 (medium, but this is the wow gap): a wandering, decorative globe and stacked micro-effects.** Make the globe the narrative "connection" object (I3) and set one hover language by importance (I8).
