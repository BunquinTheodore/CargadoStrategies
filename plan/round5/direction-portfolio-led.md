# Round 5 · Direction: Portfolio-led ("Full Stop.")

Angle: build directly on what makes `C:\Portfolio` feel premium and alive (research-portfolio.md, `js/main.js`, `js/scenes/*`, `css/style.css`), adapted to a founder-led Canadian referral business, keeping Cargado's film engine (GSAP + Lenis, fixed stage, `section.scene`, fields, iris, stars, grain, splash, SFX).

Inputs read: PLAN.md (Rounds 1-4), plan/round4/shared.md and build-order.md, all of plan/round5 (research-audience, -awards, -fast-webgl, -portfolio, -premium-finance; judge-content, -layout, -mobile-a11y, -motion, -performance, -typography, -ux-conversion, -visual), screenshots in plan/round5/shots (index, story, splash), and the Portfolio captures in the scratchpad `pf/shots`.

Fixed constraints honoured throughout:
- Black and gold only, no blue. Times New Roman display in Title Case, Manrope body, Poppins UI.
- Every compliance sentence survives: the commission and independence notices, "strategy and coaching only, not licensed accounting, tax or investment advice", "not a recommendation, sorted by distance", "nothing is sent until you tap send", the draft legal banner, and every `[bracket]` in the markup. Copy is moved or shortened only where the meaning is unchanged.
- The Round 4 contract: every scene fits one screen from 1920x1080 down to 360x740, one gesture moves one scene, and the removals are done (HUD, counter and timecode, corner brackets, floating WhatsApp, phone bar, header sound and pause toggles, decorative dashes before text).

---

## 1. Concept

### Name: **Full Stop.**

### The idea
The Portfolio is premium because each screen says one thing, very large, and then moves. Its best moment is punctuation: the full stop after the name pops in, swells, and floods the frame to become the next scene. "Full Stop." turns that into Cargado's whole grammar. Every chapter of every page ends on one confident statement in Times New Roman set at poster scale. Its gold full stop is the hinge of the film: it lands, then grows into the iris that opens the next chapter. The rhythm is **statement, then rest**: a near-wordless monument beat followed by one calm working screen, with hairline rows instead of boxes and giant outline numerals instead of more elements. One travelling character, the gold dot-globe, has a job in four scenes per page and is hidden everywhere else. The visitor is 30 to 40, busy and sceptical. What they should take away is calm confidence: a beautiful first frame, a person they can name, type they never squint at, and a site that moves like a film but never makes them wait. The full stop is also the promise: *ask once, and it's handled.*

What we take from the Portfolio: the word budget, extreme scale contrast, the eyebrow → headline → rule → content skeleton, the full-stop iris, hairline rows that flood on hover, outline ghost numerals, the strike-through story, dealt-in cards, the 3D object as a travelling character, a compositor-cheap DOM iris, and the landing rest after the splash.

What we leave behind: the contain-scaled 1920x1080 stage (it breaks on phones), all-caps mono labels at 0.3em tracking, the HUD and ammo pips, `cursor: none`, the 5 s locked boot, decode scramble, the red palette, and all weapon language.

---

## 2. Signature "wow" moments (five, and nothing else competes)

There is one rule: while a signature moment plays, nothing else on screen moves. Between them, text sits still once it lands.

### W1 · The Opening: monogram → hero → the first full stop (home, once per session)
- **Splash (≤ 1.1 s total; skipped after the first page of the session through a `sessionStorage` flag).** It starts on an ink field.
  - The C ring of the monogram draws as a 2 px gold stroke (`stroke-dashoffset`, 420 ms, `power2.inOut`).
  - The W strokes draw inside it (260 ms).
  - One metallic sheen band crosses the monogram (a translated linear-gradient mask, 300 ms).
  - Then the C ring itself scales up as the iris (a DOM circle with `transform: scale`, 0.02 → 1, 380 ms, `power3.in`) to reveal the hero. The splash is the first frame of the film, not a loading screen. It never waits for `film.ready`.
- **Hero landing.**
  - "Protect." "Plan." "Delegate." rise one word at a time from masks (`yPercent 110 → 0`, 0.7 s, `expo.out`, 90 ms stagger).
  - "Delegate." is in Times italic gold. Its full stop is a separate gold dot `<span class="stop">` that pops last (`scale 0 → 1`, `back.out(3)`, 240 ms).
  - The lead line, CTA and trust line fade up as one group (300 ms).
  - The globe fades in on the right (opacity 0 → 1, 600 ms), and one clean gold arc fires from a pulsing "you" node to a partner node.
  - Then the screen rests. A single labelled "Next" chevron button breathes under the CTA (opacity pulse, hero only).
- **First scroll.** The gold dot after "Delegate." swells into the iris. It is the same DOM circle trick, so it costs the compositor almost nothing. It floods the frame with the bone field of scene 2, and the struck searches are already arriving *during* the swell (a J-cut, never an empty field).

### W2 · Five Searches, Struck (home scene 2)
Borrowed from the Portfolio's `.pj-strike`. On a bone field, four short lines in Times italic arrive one per 80 ms: *"Searching 'Broker Near Me'"*, *"Calling Five Offices"*, *"Waiting for Call-Backs"*, *"Guessing Who to Trust"*. Then:
- a gold-dark bar wipes across each line (`scaleX 0 → 1` from the left, 180 ms each, 70 ms apart), and the line dims to 30%;
- **"One Message."** lands at mega size underneath (word rise, 600 ms), with its full stop popping;
- the three steps (Now · Within [24h] · Day [3]) settle in a hairline row below.

The whole beat is 1.4 s and then holds. It tells the business model in four struck phrases and two words, which older visitors grasp instantly.

### W3 · Three Doors (home scene 3; services intro reuses the move)
The one gold field on home, finished as metal: a static gradient, a fine brushed-noise tile, and a sheen band that moves only during the transition. Three tall panels are separated by 1 px ink hairlines. Each has a giant outline Times numeral (01, 02, 03) at 14% behind it and a question in Times italic: *"Is My Family Covered?"*, *"Where Does My Money Go?"*, *"Am I Doing Everything Myself?"*.
- **Entry:** the panels are dealt in, as in the Portfolio's `deployed` animation: y ±60 px alternating, `rotationY ±55°`, `transformPerspective 1100`, 70 ms stagger, landing flat. They never land rotated, because rotated text is hard to read for this audience.
- **Hover or focus:** the chosen door widens (`flex-grow 1 → 1.7`, 350 ms, `power3.out`) and floods **ink** with ivory type. This is the Portfolio's solid colour swap, inverted for gold. The offer name and its one line rise, and "Ask About This →" appears. The other two doors keep their gold.
- **Phone:** three full-width stacked doors (each about 30% of the screen). A tap floods the door ink and expands it in place with an exclusive accordion. Nothing scrolls.

### W4 · The Globe Comes Down to Canada (home scene 4, services network scene, partners hero)
The globe is a field of gold points with true great-circle arcs: lift ≤ 0.12R, at most three visible, each drawn with a dash. On the chapter's first scroll, the camera dollies in. The globe turns to face North America, and every point **morphs** from its sphere projection to its place on a flat dot map of Canada. The morph is a per-point lerp over 900 ms, drawn on a 2D canvas, with no three.js and no shader (see §7).
- One arc draws from the visitor's city to a node labelled "A Professional Near You". The city is known if they chose one in the hero sheet; otherwise the arc starts from Winnipeg.
- The map then holds still while they read.
- On partners, the same map runs in reverse: a new node joins and lights up with the label "You".

### W5 · The Bookend: the C Ring Returns (story logo scene and every close)
- **Story logo scene (keep it; the judges rate it the best frame on the site):** the globe collapses into the C ring while the W draws inside it. "W Stands for *Wealth.*" arrives on the left and "C Stands for *Cargado.*" on the right.
- **Every page's close:** the final statement sets word by word. The globe (or, where there is none, a gold dot) shrinks into the header monogram, and the header monogram glints once. The last frame mirrors the splash, so the visit ends where it began.
- **Between pages:** cross-document View Transitions (`@view-transition { navigation: auto; }`). The header and monogram carry a `view-transition-name`. The new page arrives through a 450 ms gold-edged circle from the clicked link's position. Browsers without support navigate normally.

---

## 3. Design system v2

### 3.1 Type scale
The Round 4 unit is kept: `--u: min(1vw, 1.5svh)`, so every size is a `clamp()` driven by `min(vw, vh)` and shrinks on short laptops instead of overflowing. The scale has only two families of size, **huge and readable**, and almost nothing in between (the Portfolio's scale contrast).

```css
:root{
  --u: min(1vw, 1.5svh);                                              /* unchanged from R4 */
  /* display: Times New Roman, Title Case, weight 400 */
  --fs-mega:      clamp(3.5rem,  calc(1rem + 10  * var(--u)), 12rem);  /* 56 phone · 151 @1440x900 · 178 @1920x1080 · 124 @1280x720 */
  --fs-statement: clamp(2.75rem, calc(1rem + 6.5 * var(--u)), 8.5rem); /* 44 · 104 · 121 */
  --fs-d1:        clamp(2.25rem, calc(.9rem + 3.8 * var(--u)), 5rem);  /* 36 · 66 · 76 : working-scene headline */
  --fs-d2:        clamp(1.75rem, calc(1rem + 1.8 * var(--u)), 2.75rem);/* 28 · 40 · 44 : row and panel titles (Times never < 28px) */
  --fs-quote:     clamp(1.625rem,calc(1rem + 2.2 * var(--u)), 3rem);   /* Times italic: questions, pull quotes */
  --fs-num:       clamp(2.5rem,  calc(1rem + 4.5 * var(--u)), 5.5rem); /* outline step numerals */
  --fs-ghost:     min(60svh, 42vw);                                     /* ghost numerals behind panels, 14% opacity */
  /* text: Manrope / Poppins */
  --fs-lead:  clamp(1.125rem, calc(1rem + .3 * var(--u)), 1.375rem);    /* 18-22 */
  --fs-body:  clamp(1.0625rem, calc(1rem + .2vw), 1.125rem);            /* 17 phone, 18 from 1024 */
  --fs-note:  1rem;            /* 16 from 760px, 15 below (R4 token): every notice, hint, error, consent line */
  --fs-label: .875rem;         /* 14: eyebrow, button, nav, chip, form label. Hard floor for any text. */
}
```
- **Leading:** mega and statement 0.92, d1 1.0, d2 1.08, quote 1.15, body 1.6, notes 1.5. Tracking on display is −0.015em at mega. It is never uppercase.
- **One face, one job:**
  - **Times** for every heading, numeral, price, question and pull quote at 28 px or more.
  - **Manrope** for all reading text and item titles, 500 weight on ink and 400 on bone.
  - **Poppins** only for eyebrows, buttons, nav, chips and form labels.
- **The only uppercase tracked string on a scene is the eyebrow:** Poppins 500, 14 px, 0.12em tracking (13 px on phones is not allowed; 14 is the floor). Form labels and tags are sentence case at 15 px.
- **One accent per headline:** exactly one word is set in Times italic gold (gold-dark on bone). It is usually the word that carries the full stop.
- **Word budget per scene:** a headline of 8 words or fewer, body of 35 words or fewer (about 40 visible words in total, as in the Portfolio), 1 primary action plus at most 1 text link, at most 1 fine-print line and at most 1 framed element. `tools/fit-audit.mjs` gains a check that fails a scene above 60 visible words (compliance lines exempt) or above 12 interactive or framed elements.

### 3.2 Spacing rhythm
- The base step is 8 px. The R4 tokens `--space-m/-l/-xl/-2xl` and `--gap-row` stay.
- **Tight inside, huge between** (the Portfolio's name block): inside a group the gap is `0.25em` of the display size, and between groups it is `--space-xl` (20 to 72 px).
- **Fixed anchors on every scene,** so the eye learns where to look:
  - the eyebrow sits at the top of the content box;
  - the headline sits directly under it;
  - a gold hairline rule (1 px, `scaleX 0 → 1` from the left) separates the head from the body;
  - then the content, then the action, always bottom-left of the content column.
- **Row pitch** for index rows: `clamp(56px, 9svh, 96px)`. The row height sets the rhythm, not the padding.
- **Margins:** `--page-pad: clamp(20px, 5vw, 96px)`. At 1920 this is the Portfolio's ≥ 90 px frame margin; at 360 it is 20 px.

### 3.3 Grid and the five archetypes
The grid is 12 columns, `--max-w: 1360px`, with uneven splits (7/5, 6/6, 4/4/4). Rules and space do the work, not boxes. Every scene uses one of five archetypes, and **no two neighbours share one**:

| | archetype | composition | Portfolio source |
|---|---|---|---|
| **M** | Monument | one statement at mega or statement size, bottom-left or centred, plus at most a line and one link | `workScene` "EXPERIENCE", "LET'S TALK" |
| **O** | Object split | the globe, map, monogram or portrait fills one half and bleeds; text sits in the other half, bottom-anchored | location scene, `d-location` |
| **R** | Index rows | full-width hairline rows: outline numeral · Times d2 title · Manrope meta · arrow | `.wr` work rows, `.pj-row` |
| **D** | Doors / panels | three tall panels with hairline separators and ghost numerals; one widens on focus | `deployed`, `credentials` |
| **P** | Paper | the one framed element: a stepper form, a dialog or a legal document | none; Cargado's own |

```
M  ┌──────────────────────────────────────────┐   O  ┌───────────────────┬──────────────────┐
   │ EYEBROW                                  │      │ EYEBROW           │      .·:·.       │
   │                                          │      │ Headline d1       │   .·:  ·  :·.    │
   │ One                                      │      │ ─────────         │  :·  GLOBE  ·:   │
   │ Message●                                 │      │ body ≤ 35 words   │   ·:.  ·  .:·    │
   │ ───────                                  │      │ [Primary] link    │      ·:·:·    ⟶ bleeds
   │ line · [Primary]                         │      └───────────────────┴──────────────────┘
   └──────────────────────────────────────────┘
R  ┌──────────────────────────────────────────┐   D  ┌─────────────┬─────────────┬───────────┐
   │ EYEBROW            Headline d1           │      │ 01 (ghost)  │ 02          │ 03        │
   │ ─────────────────────────────────────────│      │ "Question?" │ "Question?" │ "Q?"      │
   │ ⓪1  Row Title          meta        →     │      │             │ ▓▓ widened  │           │
   │ ─────────────────────────────────────────│      │ Ask →       │ ▓▓ ink flood│ Ask →     │
   │ ⓪2  Row Title          meta        →     │      └─────────────┴─────────────┴───────────┘
   └──────────────────────────────────────────┘
```

### 3.4 Colour roles and gold rules
- **Ink `#0B0B0C` is the stage.** It covers 60 to 70% of the scenes on home, story and partners, and at least 50% on services. Text is ivory `#F3ECDD` (Manrope 500). Muted ivory is used only for notes, and must be ≥ 4.5:1.
- **Bone `#F5F0E6` is the reading room** for founder offers, stories and forms. Text is `#0B0B0C`; gold text uses gold-dark `#7A5C12`. Hairlines are ink at 15%. There are no stars, no grain and no shadows on bone.
- **Gold field: at most one scene per page,** and it is the climax (home: the doors; services: outsourcing; partners: founding). It must look like **metal, not mustard**:
  - the static gradient `#B8913A → #D9B862`;
  - a 256 px brushed-noise tile at 6%;
  - a sheen band that moves only during that scene's entry;
  - black type at full strength (never 55% "dim");
  - inputs on gold get an ink fill with ivory text.
- **Gold is light, not paint.** On ink it is used only as:
  1. one primary button per screen (gold fill, ink text);
  2. one italic accent word per headline;
  3. hairlines at 18 to 30%;
  4. outline numerals (`-webkit-text-stroke: 1px`) at 14 to 40%;
  5. an 8% radial spotlight behind the headline;
  6. the globe and monogram.
  
  Gold is never used for body text on bone.
- **Chapters, not strobes.** A page has 2 or 3 field changes at most, and the iris fires only on those. Inside a chapter, the content performs the cut (a J-cut) on a constant field, and the header never flips colour mid-iris: it switches once, at 50%.
- **Focus:** a 2 px ring in the field's text colour plus a 2 px offset, ≥ 3:1 on every field and never hidden under the header.

### 3.5 Surfaces and textures
- **No boxes.** Remove every offset "card stack" border, drop shadow and dashed frame. A screen may hold **one** framed element (P). Everything else is hairlines plus space.
- **Grain:** the Portfolio's generated 256 px noise tile, static, at 0.06 opacity, on ink only, with **no `mix-blend-mode`** and placed *under* the text layer. It jitters (`steps(6)`) only on desktop and only during transitions.
- **Stars:** ink scenes only. There are no velocity streaks (the cap is 8 px, or none). The Portfolio's cursor push in a 140 px radius stays on fine pointers. Stars fade to 25% behind long text (inquiry, legal).
- **Gold spotlight:** a pseudo-element `radial-gradient(closest-side, rgba(212,175,55,.08), transparent)` behind each headline. It is static and costs nothing.
- **Placeholders:** `.ph` has no fill. It is the current text colour with a 1 px dotted underline in gold-dark at 60% and the same size as the surrounding text. Every bracket stays in the markup and stays visible where it is identity or compliance (company name, licence, regulator, [24h], [First name]). **Fake-proof slots** (stats, the ★ rating, testimonials, live founding counts) carry `data-when="<config key>"` and render only when the config value is filled, or in review mode (`?review=1` → `html.ph-loud` brings back today's tinted boxes so the founder can see what to supply). This needs the owner's approval; see §8.

### 3.6 Imagery and illustration (there are no photos yet)
- **Illustration language: gold points and lines.** The dot-globe, the Canada dot map, the arcs, the C·W monogram and the outline numerals are the only "pictures", so the site has one coherent visual system rather than stock photography.
- **The founder portrait slot is designed now.** It is a 4:5 duotone (ink → gold) with grain, and the C ring passes behind her shoulder. It is used on story scene 1, home scene 3 (a small avatar beside "Three Things [First name] Does Herself."), and the close (an avatar beside the CTA). It renders only when `config.FOUNDER_PHOTO` exists.
- **Until then: a typographic portrait,** never an empty frame and never the globe inside a photo frame. The C·W monogram is set at 70svh in an outline gold stroke, with the founder's name set in Times italic `[First name] [Last name]` beside it. A pull quote in Times italic and a hairline signature line with a small `[signature]` caption complete it.
- **Video:** the scene is removed until a real video exists. It then returns as a "Watch 1 Min" text link in the hero that opens a dialog. Its poster is the logo frame.
- **Ask the founder for a portrait and her name now.** They are the single largest trust and wow upgrade available.
- **Later, optional:** licensed duotone night aerials of Canadian cities (places, not people, so nothing is endorsed or invented), at 20% under the ink field on two close scenes.

### 3.7 Iconography
- Nine bespoke 1.25 px gold line icons for the categories (insurance, strategy, outsourcing, legal, mortgage, real estate, accounting/tax, planning, not sure), plus WhatsApp, phone, mail, Facebook and the arrow. Nothing else gets an icon.
- **Arrows are the "→" glyph** in the text face, and nudge +6 px on hover (the Portfolio's arrow nudge).

### 3.8 Buttons, links and forms
- **Primary button:**
  - gold fill, ink text, Poppins 600 at 16 px, 52 px tall (44 px minimum), 2 px radius, label plus "→";
  - hover: a solid swap to ivory fill with ink text and the arrow nudges, in 200 ms;
  - the hero CTA alone gets the magnetic pull (≤ 6 px) and a one-time gold sheen;
  - on gold fields the button inverts to ink fill with gold text.
- **One CTA vocabulary, everywhere:**
  - "Message Us on WhatsApp" for clients (it opens the WhatsApp sheet with the page's context prefilled);
  - "Ask About [Insurance / the Clean-Up / Outsourcing] →" for the founder's offers;
  - "Apply to Join" for partners.
  
  Retire "Write Your One Message", "Send Your Message on WhatsApp", "Find One Near You", "Check My Area and Apply", the "Apply for [Tier]" labels and "Back to …".
- **Text link:** ink or ivory text with a 1 px underline that draws left to right (`scaleX`) on hover and focus. There is no letter-roll anywhere.
- **Index rows (R):** on hover or focus, a solid gold flood (ink text), and the padding slides 24 → 46 px (220 ms). On bone the flood is ink with ivory text. The whole row is the link and is at least 56 px tall.
- **WhatsApp sheet (replaces the hero form):** a `<dialog>` that rises from the bottom on phones and sits centred as a P panel on desktop.
  - Step 1: "What do you need?" as 56 px chips (the founder's three, plus mortgage, lawyer, real estate, tax, not sure).
  - Step 2: "Your city", with "We ask for your city only so we can introduce you to someone close to you."
  - Step 3: "Open WhatsApp", with "Opens WhatsApp with your message written. Nothing is sent until you tap send."
  - A secondary line reads "Rather call or email? [phone] · [company email]".
  - After it opens: "WhatsApp opened in a new tab. Didn't open? Call [number] or email [address]."
- **Forms (inquiry, partner application):** steppers with at most 4 fields per step.
  - Labels sit above the fields (Poppins 500, 15 px, sentence case), and inputs are 56 px tall with 18 px text.
  - On ink and gold, inputs are charcoal `#1A1A1C` with a 1 px ivory 40% border; on bone, white with a 1 px ink 30% border. The boundary is ≥ 3:1.
  - The focus border is 2 px gold.
  - Errors are text plus an icon under the field, validated on blur.
  - The stepper shows "Step 2 of 4 · Licence and Area" in the focused h3. Back and Next are pinned to the bottom of the scene. The R4 `ui-stepper.js` a11y model applies.
- **No tilt on forms, panels or legal.** Tilt ≤ 4° is allowed on small glanceable items only (tier panels on desktop).

### 3.9 Motion principles and timings
1. **Play, don't scrub.** A snap gesture triggers a **time-based** transition (a GSAP timeline played at `timeScale 1`), never a scrubbed half-state. Back plays it reversed. Input is locked until 70% of the transition and then queued (one step).
2. **J-cut, never dead air.** No frame of any transition may show an empty field. Test it by seeking to 25%, 50% and 75% and taking screenshots.
3. **Fewer, bigger, landed.** Words rise, not letters. Nothing moves while it is being read, except the globe's slow rotation (one revolution per 60 s) and the ambient stars.

| step | time | what | ease |
|---|---|---|---|
| out | 0 → 0.32 s | the outgoing content leaves **as one group**: y −40 px, opacity → 0 | `power2.in` |
| iris (chapter change only) | 0.10 → 0.72 s | a DOM circle in the next field's colour scales 0.02 → 1 from a meaningful origin: the full stop, the CTA just used, the map pin or the monogram | `expo.inOut` |
| same-field cut | 0.10 → 0.50 s | the field holds; at most a gold hairline frame draws around the incoming content box (desktop) | `power2.inOut` |
| in | 0.30 → 0.95 s | eyebrow (mask slide, 450 ms) → headline words (mask rise, 70 ms stagger) → rule `scaleX` → body/rows (60 ms stagger) → CTA | `power3.out` / `expo.out` |
| full stop | +0 → 0.24 s after the last word | the gold dot pops | `back.out(3)` |
| settled | ≤ 1.0 s | fully composed and static | none |
| hover | 200 to 250 ms | colour swaps, arrow nudge, door widen 350 ms | `power3.out` |
| page change | 450 ms | View Transition circle from the clicked link | `ease-in-out` |
| reduced motion | 200 ms | crossfade only; native snap; static globe poster; no splash animation (the monogram is shown for 300 ms at most) | linear |

- **Deleted:** decode scramble (glyph substitution), letter-roll on nav and buttons, `film-alive.js` heading drift, per-character splits, star streaks, tilt on forms and long panels, and the rotateX/opacity "muddy" media exits (media now leaves with an `inset()` clip wipe).
- **Kept from Round 3, retuned:** the cursor ring (32 px, `quickTo` 0.15 s, grows 1.9x over links and rows, hidden on touch; the native cursor stays), magnetic pull on the hero CTA only, and the text-link underline draw.

### 3.10 Sound
The Round 4 decision stands (no header toggles). The sounds are re-tuned so that nobody would want to mute them:
- **Removed:** the scroll tick, the hover ticks, and the whoosh plus two-note tone per scene.
- **Kept:**
  - one soft low "breath" on **chapter changes only** (a sine with a long attack, peak 0.04);
  - the click blip at peak 0.06;
  - the success chime on form submit and when WhatsApp opens;
  - the splash chime, only on the first page of the session and only if audio is already unlocked.
- **Master gain** 0.15.
- **Touch devices and `prefers-reduced-motion`:** silent except the success chime.
- **Owner question:** a one-word "Sound: On / Off" text row in the footer and the phone menu (not a header toggle). The mobile and motion judges both rate this high.
- `hookFilm` returns early when audio is locked or muted, and never reads `scrollY` (this fixes perf B4).

---

## 4. Chrome (every page)

- **Desktop header (fixed, at most 6 marks):**
  - the C·W monogram plus the wordmark (links home);
  - three nav links: Services · Our Story · For Professionals;
  - one gold "WhatsApp" button.
  
  Facebook moves to the footer. On legal, the draft notice becomes a small gold-outline pill in the header ("Draft · lawyer review pending", 14 px) instead of a dashed band.
- **Phone header:** the monogram, a 44 x 44 gold WhatsApp icon button, and "Menu". This resolves the R4 open question C2/D23 without bringing back a floating button or a bottom bar. The menu lists the pages, Call, Email, WhatsApp, Facebook and the sound row.
- **Hero-only "Next ↓" chevron button** (labelled; keyboard and pointer), which is the Portfolio's landing cue. There is no counter, timecode, corner bracket or dash.
- **Compact close (the R4 `#credits` scene):** the page's closing statement, the CTA, contact rows (WhatsApp · Call · Email · Facebook) and the footer. The footer has link columns, a fine-print block at 15/16 px (the commission and independence notice, "strategy and coaching only", [licence / registration], "We only message from +1 (204) 869 2508"), the legal links, and the tagline "Connected by Purpose. United in Service.", **once per page, in the footer only**.

---

## 5. Scene by scene

Notation: `field · archetype · signature`. The globe is shown only where noted; elsewhere its opacity is 0. ● marks the gold full stop.

### 5.1 Home: 12 scenes → 6
Fields: ink · bone · gold · ink · ink · ink (3 irises: hero→bone, bone→gold, gold→ink).

**1 · hero** · ink · O · W1
```
┌─────────────────────────────────────────────────────────────┐
│ ⓒ Cargado Strategies     Services  Our Story  For Pros [WA] │
│                                                    .·:·.     │
│ INSURANCE · STRATEGY · OUTSOURCING            .·:  ·  :·.   │
│ Protect.                                     :· GLOBE w/ ·: │
│ Plan.                                        ·:. one arc .:· │
│ Delegate●  (italic gold)                        ·:·:·:·  ⟶  │
│ ──────────                                                   │
│ From [First name] herself. For anything else, we introduce   │
│ you to a trusted professional near you, free.                │
│ [Message Us on WhatsApp →]   Rather call or email?           │
│ Licensed where it matters · Replies within [24 hours]  ↓Next │
└─────────────────────────────────────────────────────────────┘
phone: the globe in the top 38% (centred, 70vw) · the triad at 56px · the lead · a full-width CTA in the thumb zone
```
- About 32 words; 7 elements (it was about 20).
- **Moved out of the hero:** the chips and city field go into the WhatsApp sheet. The 4 stat boxes become `data-when` (hidden until real) plus one non-numeric trust line. The ticks merge into the trust line ("No fee to you · No obligation" is in the sheet's step 1).

**2 · one-message** · bone · M · W2. This merges *video*, *compare* and *how-it-works*.
```
┌─────────────────────────────────────────────────────────────┐
│ HOW IT WORKS                                                 │
│ ̶S̶e̶a̶r̶c̶h̶i̶n̶g̶ ̶'̶B̶r̶o̶k̶e̶r̶ ̶N̶e̶a̶r̶ ̶M̶e̶'̶      (Times italic, 30%)    │
│ ̶C̶a̶l̶l̶i̶n̶g̶ ̶F̶i̶v̶e̶ ̶O̶f̶f̶i̶c̶e̶s̶                                          │
│ ̶W̶a̶i̶t̶i̶n̶g̶ ̶f̶o̶r̶ ̶C̶a̶l̶l̶-̶B̶a̶c̶k̶s̶                                       │
│ ̶G̶u̶e̶s̶s̶i̶n̶g̶ ̶W̶h̶o̶ ̶t̶o̶ ̶T̶r̶u̶s̶t̶                                        │
│ One Message●                                    (mega)       │
│ ─────────────────────────────────────────────────────────── │
│ Now · You send it │ Within [24h] · We introduce │ Day [3] · We check in │
└─────────────────────────────────────────────────────────────┘
```
- This is the only place on home where the three steps appear. The phone shows 3 struck lines.

**3 · doors** · gold (metal) · D · W3. "Three Things [First name] Does Herself."
```
┌─────────────────────────────────────────────────────────────┐
│ FROM [FIRST NAME] HERSELF   Three Things [First name] Does Herself. │
│ ┌──────────────┬──────────────────────┬──────────────┐      │
│ │ 01 (ghost)   │ 02  ▓▓▓▓ ink flood ▓▓▓│ 03           │      │
│ │ "Is My Family│ "Where Does My Money │ "Am I Doing  │      │
│ │  Covered?"   │  Go?"  30-Day Cash-  │  Everything  │      │
│ │ Family       │  Flow Clean-Up       │  Myself?"    │      │
│ │ Protection   │  strategy & coaching │ Back-Office  │      │
│ │ Review ·30min│  only, not licensed… │ Team         │      │
│ │ Ask About →  │  Ask About the Clean-Up →│ Ask About →│      │
│ └──────────────┴──────────────────────┴──────────────┘      │
│ [company name] · licence [#] · [regulator]   (fine print, 1 line) │
└─────────────────────────────────────────────────────────────┘
```
- Each door's required label line (insurance: company, licence and regulator placeholders; strategy: "strategy and coaching only, not licensed accounting, tax or investment advice"; outsourcing: "Provided by Cargado Strategies itself") shows inside the widened door. On phones, the expanded door shows it.
- The placeholder testimonials are `data-when="quotes"`.

**4 · network** · ink · O → full-bleed map · W4. "Need Someone We Don't Do Ourselves?"
```
┌─────────────────────────────────────────────────────────────┐
│ ACROSS CANADA                       ·  ·· ·:·::·:·.          │
│ Need Someone We Don't             ·:·:·:·::·:·::·:·:·.       │
│ Do Ourselves?                  ·:·:·:CANADA DOT MAP·:·:·     │
│ ──────────                      ·:·:·:·:·:·:●─arc─◉ A Professional│
│ Lawyer, mortgage, accountant: tell us the service and   Near You │
│ your city. We'll find someone good, close to you.            │
│ [Message Us on WhatsApp →]                                   │
│ Partners are independent businesses. Not a recommendation. Cargado │
│ Strategies may receive a commission. Details →   Illustration only. │
└─────────────────────────────────────────────────────────────┘
```
- A **concierge, not a dead end** (fixes ux B2). The live finder lives on services and is gated by config.

**5 · two-doors** · ink · split 6/6 (a variant of D)
```
┌──────────────────────────────┬──────────────────────────────┐
│        ◯ C·W monogram        │ FOR PROFESSIONALS            │
│   W for Wealth●              │ Be Found Close to Home●      │
│   C for Cargado.             │ Pay on clients, not on clicks.│
│   Our Story →                │ Apply to Join →              │
└──────────────────────────────┴──────────────────────────────┘
phone: two stacked halves, each 50% of the scene
```

**6 · close** (`#credits`) · ink · M · W5
```
┌─────────────────────────────────────────────────────────────┐
│ One Message.                                                 │
│ The Right Person.                                            │
│ Close to You●                 (statement size, word by word) │
│ [Message Us on WhatsApp →]   Questions Everyone Asks First → │
│ ─ WhatsApp +1 (204) 869 2508 ──── Call ──── Email ──── Facebook ─ │
│ Services · Our Story · For Professionals · Legal · Privacy   │
│ fine print block (15/16px) · Connected by Purpose. United in Service. │
└─────────────────────────────────────────────────────────────┘
```
- The FAQ (why is it free / do I have to hire them / how do you choose / what happens to my information) moves to a dialog opened by "Questions Everyone Asks First →", with every answer verbatim. It stays in full on legal Q&A.

**Deleted or merged on home:** video (until a real video exists), situations (its four lines become the doors' questions plus the network concierge), compare (into 2), how-it-works (into 2), services tile grid (into the doors, the network scene and the header), story teaser and partners (into 5), and FAQ (into a dialog).

### 5.2 Services: 8 → 8, re-laid and de-cluttered
Fields: ink · bone · bone · bone · gold · ink · ink · ink (3 irises).

| # | scene | field · type | on screen (≤ 40 words + one fine-print line) | moved to stepper / pager / overlay |
|---|---|---|---|---|
| 1 | **intro** "Her Work, and the People She Trusts." | ink · R | Rows: 01 Insurance · 02 Business Strategy · 03 Back-Office Team (meta "Ours"), then 04 "Nine Kinds of Help, Near You" (meta "Partners"). Each row `goTo`s its scene. A legend reads "**Ours** means [First name] does it herself. **Partners** are independent local professionals." | the old jump-rail and the spec-speak line are deleted |
| 2 | **insurance** "If Something Happens to You, Is Your Family *OK*?" | bone · O (portrait or monogram left, text right) | the 2-line promise; "Family Protection Review · 30 min"; CTA "Ask About Insurance →"; text link "Book a Free 15-Min Call" | the label line [company name] · licence [#] · [regulator] as fine print |
| 3 | **strategy** "The *30-Day* Cash-Flow Clean-Up" | bone · M (statement size) | "For business owners who are busy but don't know where the money goes."; "[2] spots in [month]"; CTA "Ask About the Clean-Up →" | fine print: "Strategy and coaching only, not licensed accounting, tax or investment advice." |
| 4 | **includes** "What You Get" | bone · R | 5 rows with outline numerals 01 to 05 and Manrope 600 titles; the promise line under them. There is **no `[value]` column** | split from 3 (R4 toolkit item 3) |
| 5 | **outsourcing** "Your Back-Office *Team*." | gold metal · R | the draft roles [Bookkeeping] · [Inbox and Calendar] · [Social Media] · [Customer Follow-Up] as rows; "from [$x]/hr"; CTA "Ask About Outsourcing →" | "Provided by Cargado Strategies itself." as fine print |
| 6 | **network** "Who Does What, *Near You*." | ink · O → map · W4 | **While `PARTNERS.length < FINDER_MIN_PARTNERS`:** the concierge (category select + city → the WhatsApp sheet) beside the Canada dot map. **Afterwards:** the R4 finder. Phones get Map / Results tabs, and results come through a pager ("Next 3"). | The 9 categories open as an in-scene **dialog** (rail + detail; partner list or "Partner Spot Available" cards). Deep links `services.html#legal` open this scene with the dialog on that category (FR05). Fine print: the full finder notice in one sentence plus "Details →". |
| 7 | **inquiry** "Tell Us What You *Need*." | ink · P | a **3-step stepper**: (1) service and city; (2) name, phone, email; (3) message, consent and the commission notice → submit to WhatsApp, or mailto when `CONTACT_EMAIL` exists. The success state is FR08. | the Now / [24h] / Day [3] strip is deleted here (it lives once, on home); the honeypot is kept |
| 8 | **close** "Ask Once. It's *Handled*." | ink · M · W5 | the compact close as on home | each page uses its own closing line; the tagline appears in the footer only |

### 5.3 Story: 7 → 5
Fields: ink · bone · ink · ink · ink (2 irises). The draft copy is in the founder's voice; brackets wrap only the facts she must confirm. The "[Draft story…]" meta note moves to review mode or an HTML comment.

**1 · top** · ink · O (portrait or typographic portrait)
```
┌─────────────────────────────────────────────────────────────┐
│ OUR STORY                       ╭───────────╮                │
│ "I Started Cargado So Good      │  C·W ring │ outline, 70svh │
│ People Wouldn't Have to         │  (or 4:5  │                │
│ Search *Alone*●"                │  duotone  │                │
│ ──────────                      │  portrait)│                │
│ [First name] [Last name], founder╰───────────╯               │
└─────────────────────────────────────────────────────────────┘
```

**2 · beginning** · bone · M. The eyebrow "Where It Began", then mega "One Place. Not *Five*●", then 2 or 3 drafted sentences: "In [year], a friend in [city] spent three weeks calling offices to find a mortgage broker who would call her back. I knew [n] good professionals who would have answered that same day." This is the content judge's R1 beat 2.

**3 · logo** · ink · stage · W5. Keep the current composition (the judges' best frame). Add "[How the logo came about, in the founder's words.]" as a quiet `.ph` line, plus "Mark 11:24" as a reference only, with no rule before it (R4) and the verse never quoted.

**4 · values** · ink · R. "What I Will Never Trade for a *Referral*."
- 01 People Before Transactions.
- 02 Say How You Are Paid: the commission sentence is the body text here.
- 03 Grow Slowly, with Care.

The old *network* scene's independence notice joins row 02 as fine print ("Partners are independent businesses…"). The old network scene is merged into this one.

**5 · talk** (`#credits`) · ink · M + portrait avatar. "Tell Me What You Need. I'll Find Someone *Good*●" Then the CTA "Message Us on WhatsApp", the contact rows and the footer. "Find a Partner Near You" is replaced by the concierge CTA.

### 5.4 Partners: 8 → 6
Fields: ink · ink · ink · gold · bone · ink (3 irises: ink→gold for the climax, gold→bone, bone→ink).

| # | scene | field · type | on screen | moved |
|---|---|---|---|---|
| 1 | **hero** "Clients Near You, Already *Asking*." | ink · O · W4 reversed (a node joins: "You") | "First [2] partners per service, per city: [founding offer]."; CTA "Apply to Join" | the founding hook leads |
| 2 | **how** "Pay on Clients, Not on *Clicks*." | ink · D (3 panels: Someone Asks · We Introduce · You Pay on Success) | one line per panel | merges how and arrangement. **The commission and independence notice sits here** as fine print at 15/16 px, with no promise of referrals, outcomes or endorsement (CR04) |
| 3 | **tiers** "Community, Growth, *Premier*." | ink · D, dealt in; tilt ≤ 4° on desktop only | the name, `[$ per month]` in Times d2 with the dotted .ph, and 3 lines each; one "Apply to Join" (the tier is preselected by the link) | phones get tabs with swipe (R4 D15) |
| 4 | **founding** "The First [2] Partners per Service, per *City*●" | gold metal · M | the cap note in one line; the `[n] of [2] open [live count]` counter is `data-when` | — |
| 5 | **apply** "Apply to *Join*." | bone · P | a **4-step stepper**: Business · Service and Licence (licence # + issuing body) · Area and References · Review, Code of Conduct and Send. Step 1's intro carries "What we ask: a valid licence, quick replies, our code of conduct." | the old "ask" scene merges into step 1; the two stacked notices merge into one |
| 6 | **close** "Questions Before You *Apply*?" | ink · R + compact footer | 4 partner question rows; each opens an in-scene dialog with the answer | — |

### 5.5 Legal: calm on purpose, 7 scenes on the R4 pager
- **One field, bone, for every scene.** There is no globe, no stars, no grain, no SFX and no splash, and three.js and the globe code are never loaded. The rest of the engine (snap, pager) still applies, so the R4 fit contract holds.
- **contents:** "The Fine Print, in *Plain English*." as R rows (01 Professional Disclosure · 02 Privacy · 03 Terms · 04 Partner Code of Conduct · 05 Q&A), each with a large outline numeral, which is the system numeral.
- **disclosure · privacy · terms · conduct:** a P document at a 68ch measure, body 18 px / line-height 1.7, through the R4 paged reader ("Page 2 of 4"). The text never scrolls inside a box.
- **Q&A:** "Straight Answers." (the phrase is kept only here). R rows with an exclusive accordion; 3 per page via the pager.
- **close:** "Still Have a Question? *Ask Us*." plus the footer.
- The draft banner becomes the header pill (§4); "Draft — to be reviewed by a lawyer in Canada before launch" stays verbatim in the pill's tooltip and as the first line of each document.

---

## 6. Delete or merge to de-clutter

| remove | where it goes |
|---|---|
| HUD, counter, timecode, corners, floating WhatsApp, phone bar, header sound and pause toggles, every dash before text | deleted (R4) |
| Home video scene, "Founder Video Coming Soon" | deleted until the video exists, then a hero "Watch 1 Min" dialog |
| Home situations, compare, how-it-works, services grid, story teaser, partners pitch, FAQ (7 scenes) | merged into scenes 2 to 5 plus a FAQ dialog |
| The hero form card, chips and city input | the WhatsApp sheet |
| The hero stats strip, ★ rating, testimonials, founding live count | `data-when` slots shown only in review mode until real |
| "Nothing is sent until you tap send" ×12 | once per page, in the WhatsApp sheet and under the primary button of forms |
| "One Message. The Right Person. Close to You." ×3 | home close only |
| The Now / [24h] / Day [3] steps ×4 | home scene 2 only |
| Boxed compliance callouts with bold leads | one `.fineprint` line per scene at 15/16 px, bottom of the content column, plus "Details →" to legal; wording unchanged |
| Spec-speak ("The rail does the disclosure…", "Each section says whether…", "named as hers and shown separately…", "captions included when it arrives") | replaced by the content judge's R5 copy |
| Offset second borders, shadows, dashed frames, tinted `.ph` boxes | hairlines; quiet `.ph` |
| Decode scramble, letter-roll, heading drift, per-character splits, star streaks, tilt on forms | deleted |
| About 30 CTA labels | 3 verbs (§3.8) |
| Facebook in the header | footer and menu |
| three.js | a 2D canvas dot-globe (§7) |
| Story network scene; partners arrangement and ask scenes; services jump-rail | merged (§5) |
| The legal dashed DRAFT band | the header pill |

**Result:** 36 scenes become 32 across the site. Home goes from 12 to 6 (about 6 gestures to the end), and visible words per scene drop from about 130 to 40 or fewer.

---

## 7. Performance plan (target: Lighthouse mobile ≥ 90 on every page)

1. **Splash once per session,** ≤ 1.1 s, and never gated on `film.ready` or fonts (Times New Roman is a system font; Tinos and Tinos Italic load with `font-display: swap` only where Times is missing). Later pages use View Transitions with zero JS.
2. **Retire three.js** (462 KB raw, about 120 KB gzip, 57% of the bytes). Replace it with `dotglobe.js` (about 6 to 8 KB):
   - a 2D canvas of about 900 precomputed gold points (sphere positions and Canada-map positions in one Float32Array, shipped as a 7 KB binary or JSON);
   - an orthographic projection with lerped rotation (k ≈ 0.07);
   - arcs drawn as quadratic paths with a dash offset;
   - the globe-to-map morph is a per-point lerp.
   
   It renders only while moving (a transition, the hero's arc, or its 60 s rotation on desktop fine pointers). Otherwise it draws one frame and stops. On phones the rotation is off and it draws on scene entry only. Stars share the **same canvas and the same rAF** (one loop, paused on `visibilitychange` and when off-field). DPR is capped at 1.5 desktop / 1 phone. The reduced-motion and Save-Data path is a static SVG poster.
3. **Iris as a DOM circle scaled with `transform`** (the Portfolio's `addIris`), not a full-screen `clip-path` repaint. On coarse pointers it can become a 250 ms opacity crossfade. This fixes the 31 to 34 fps scroll on phones (perf B3).
4. **Grain:** a static tile, no blend mode, ink only, under the text, and no animation on coarse pointers.
5. **Touch uses native snap.** On `(pointer: coarse)`, use flow mode with `scroll-snap-type: y mandatory` plus `scroll-snap-stop: always` (one swipe = one scene, which keeps the R4 contract), with no Lenis and no ScrollTrigger. Scene entries fire the same **time-based** in-timelines from an IntersectionObserver at 60% visibility. Fine pointers keep Lenis plus `film-snap.js`. This is an engine amendment to R4 (engine.md, shared D19); it was proposed by the mobile and audience research.
6. **Text:** only one display heading per scene is split, **by word**. The kerning table is precomputed at build time (removes about 1 s of phone CPU from `kerning.js`). Splitting runs sliced after the hero is interactive. Targets: DOM ≤ 1,000 nodes per page, Style & Layout ≤ 1 s.
7. **JS budget:** ≤ 90 KB gzip initial on phones and ≤ 150 KB on desktop. GSAP core loads everywhere (time-based transitions). ScrollTrigger and Lenis are dynamically imported on fine pointers only. Page modules are split per scene and loaded on idle.
8. **Scroll path hygiene:** no DOM reads inside `film.on('progress')`. The SFX early return. A single pointer hub with cached rects. `will-change` only during a transition, removed afterwards.
9. **HTML-first:** the header, nav, hero text, CTA and the static globe poster are in the HTML (LCP is the hero triad). The flow fallback renders immediately and is promoted to film only when ready and before the first scroll. No re-layout ever happens under the visitor's eyes (motion B11).
10. **Legal** ships with no film-visual runtime, at ≤ 60 KB, with LCP ≤ 0.5 s.
11. **Gate:** `tools/perf-gate.mjs` after `npm run build` checks Lighthouse mobile ≥ 90, TBT ≤ 200 ms, CLS ≤ 0.05, LCP ≤ 2.0 s, mobile scroll ≥ 55 fps at 4x CPU, JS within budget, and fails the build otherwise. Run `fit-audit` (9 viewports, film plus flow) with the new word and element check alongside it.

---

## 8. Judge findings: every critical and high item, and where it is fixed

| finding | fix in this direction |
|---|---|
| content B1 story has no story (crit) · visual B15 · ux B3 no human (crit) · content B7 no name | §5.3 drafted narrative with bracketed facts; [First name] in headlines; portrait slot plus typographic portrait (§3.6) |
| content B2 / typo B-5 / ux B5 / layout B9 placeholders shout (crit) | quiet `.ph`; `data-when` proof slots; review mode (§3.5) |
| content B3 repetition · layout B6 · ux B7 home too long | home 12 → 6; one slogan, steps and send-note per page (§6) |
| content B4 spec-speak | §6 rewrites |
| content B5 / ux B10 video void | the scene is removed |
| content B6 notices dominate | the `.fineprint` pattern (§6), 15/16 px, one per scene |
| layout B1 / visual B7 chrome (crit) | R4 removals plus a ≤ 6-mark header (§4) |
| layout B2 / mobile B1 / visual B8 clipped (crit) | word and element budget, archetypes, steppers, dialogs, and the fit-audit gate |
| layout B3 hero 20 elements (crit) · mobile B3 CTA below the fold | hero with 7 elements; form → sheet; CTA in the thumb zone (§5.1) |
| layout B4 mobile = stacked desktop (crit) | phone compositions per scene: headline in the top third, the object in the middle, the CTA in the thumb zone; the globe only in hero, network and close |
| layout B5 / visual B6 one template | five archetypes, never twice in a row (§3.3) |
| layout B7 / visual B3 globe as filler · visual B4 arcs scribble | four jobs only (W1, W4, W5), never parked; true great circles, ≤ 3 arcs (§2, §7) |
| layout B8 boxes in boxes | no boxes; one framed element (§3.5) |
| mobile B2 phone scrolljack (crit) · perf B7 | 6-scene home; native snap on touch (§7.5) |
| mobile B4 / typo B-1 small text (crit) | the 14 px floor; 15/16 notes; 17/18 body; sentence-case labels (§3.1) |
| mobile B5 long forms | steppers of ≤ 4 fields (§3.8) |
| mobile B6 / motion B8 SFX with no off | tamed SFX; silent on touch; footer row (owner) (§3.10) |
| motion B1 dead air (crit) · B4 half-states | play-not-scrub J-cut transitions (§3.9) |
| motion B2 decode garbage | deleted |
| motion B3 luminance strobe · visual B5 mustard gold | chapters with ≤ 3 irises; one metallic gold scene (§3.4) |
| motion B6 / perf B1 splash on every load (crit) | once per session, ≤ 1.1 s, View Transitions |
| motion B7 star rain | streaks removed |
| perf B2 main thread (crit) · B6 char splitting | no three.js, word splits, build-time kerning, sliced init |
| perf B3 stutter · B4 SFX layout read · B5 three.js | DOM iris, static grain, one canvas, SFX early return, dotglobe.js |
| typo B-2 flat scale · B-3 phone hero · B-4 three voices | mega and statement scale, a 56 px phone hero, one job per face |
| ux B1 identity split (crit) | the founder-led triad hero; the network as "for everything else" |
| ux B2 finder dead end (crit) | the concierge until `FINDER_MIN_PARTNERS`; the finder code kept and gated |
| ux B4 CTA sprawl | three verbs |
| ux B6 crowded scenes | splits (strategy / includes), dialogs, steppers |
| ux B8 WhatsApp the only channel · B9 no phone CTA | `tel:`, email and a mailto inquiry path; the header WhatsApp icon on phones |
| visual B1 no signature on home (crit) · B2 no imagery (crit) | W1 to W5; gold point-and-line illustration system; portrait slot |

---

## 9. Risks

1. **Content dependency.** The founder's name, portrait and story facts drive the hero, the story and the doors. Without them the typographic fallbacks carry the design, but the "human" fix is half-done. Ask for them now. All identity copy (the "Protect. Plan. Delegate." triad, the drafted story) needs her approval.
2. **Hiding fake-proof slots is a policy change.** The PLAN says brackets stay visible. This direction keeps them in the markup and in review mode, and keeps every compliance and identity bracket visible always, but the owner must approve `data-when` for the stats, rating, quotes and counts.
3. **Engine amendment.** Native CSS snap on touch, and time-based transitions instead of scrubbed ones, rework `film.js` and `film-snap.js` and partly supersede engine.md (A9, D19). It is the largest build item and must pass the R4 A13 tests plus a real-device check (iOS Safari momentum, a trackpad fling).
4. **Gating the finder** hides an SRS feature (FR25 to FR31) until partners exist. It is config-driven and reversible, but needs the owner's sign-off.
5. **dotglobe.js fidelity.** A 2D canvas globe must still look like gold metal (a halo sprite, point size by depth). If it reads flat, the fallback is three.js loaded only on fine-pointer desktop after the first input.
6. **The footer sound row** reopens a Round 4 decision (it is not in the header, but it is a toggle). If refused, the tamed SFX must still be silent on touch and under reduced motion.
7. **Fit at 360x740 and 1280x720 with mega type.** The close and network scenes are tight (a monument plus contact rows plus a footer). Mitigations: the statement size, not mega, on closes; `.short-hide` on secondary lines; contact rows as an icon row on phones. Verify with fit-audit at all 9 viewports.
8. **Input lock** for 70% of a 0.9 s transition may feel sticky to fast scrollers. Queue one step, and let Home/End and the nav jump instantly.
9. **View Transitions** are absent in Firefox. That is acceptable (a plain navigation), but there the splash-once rule makes page 2 onward a hard cut.
10. **Times New Roman Italic on Android** needs Tinos Italic (about 20 KB extra). Keep it to the 400 italic weight only.
