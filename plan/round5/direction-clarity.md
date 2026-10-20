# Round 5 · Direction "Clarity": Still Gold

Angle: calm premium clarity. Think of an Aesop shop or a private bank's reception room. Generous whitespace, hierarchy you never have to work out, fewer effects done perfectly, and maximum readability and trust for 30 to 45 year olds. The wow comes from polish and composition, not spectacle.

Inputs: all of `plan/round5/judge-*.md` and `research-*.md`, the shots in `plan/round5/shots/` (hero, situations and story logo at 1440 viewed directly), `PLAN.md` rounds 1 to 4, `plan/round4/shared.md` §3 tokens and `build-order.md`.
Constraints kept:
- black and gold only, no blue;
- display face Times New Roman in Title Case, body Manrope, UI Poppins;
- every compliance sentence and `[bracket]` placeholder survives;
- Round 4 as decided: one scene per screen at 1920x1080 down to 360x740, one gesture moves one scene, and the HUD, floating WhatsApp, phone bar, sound and pause toggles and decorative dashes are all removed;
- Lighthouse performance of 90 or more on mobile.

---

## 1. Concept

**Still Gold.** Every scene is a quiet room: one black lacquer wall, one warm lamp, one sentence set beautifully, and one thing to do. Gold is never paint. It is the light in the room: the lamp glow behind a headline, a 1 px hairline, one italic word, and the button you should press. Bone (ivory) scenes are the paper on the desk: flat, typographic and shadowless, in the Aesop manner. Motion has a single job, which is to bring the next room in, composed, in under a second, and then stand still while you read. The memorable part is not a trick. It is how the C of the monogram draws the light on, how a dot globe turns and settles into a map of Canada, how one huge sentence lands with nothing else around it, and how every page ends on its own last frame. A 40-year-old should never squint, never wait and never wonder what to press, and should still close the tab thinking "that was beautiful".

Three words to test every decision: **Still. Warm. Exact.**

---

## 2. Signature moments (four, and nothing else is loud)

### W1 · "The Lamp": the splash becomes the first frame (Home, first visit per session)
- **0 to 450 ms:** a black screen. A 1.5 px gold stroke draws the C of the monogram clockwise (`stroke-dashoffset`, `cubic-bezier(.65,0,.35,1)`) at 18vmin, centred.
- **300 to 650 ms:** the W strokes draw inside the C, offset by 150 ms.
- **650 to 1,000 ms:** the monogram glides (transform only) to its exact spot in the header logo and scales down to 36 px. At the same time a warm radial "lamp" (`#1A1712` to transparent, opacity 0 to 1) comes up behind where the H1 sits. The hero H1 words rise from their masks (word by word, 50 ms stagger, 500 ms each, `power3.out`).
- **1,000 ms:** done. The page is interactive from first paint, because the HTML hero is under the splash and the splash never waits on `film.ready`.
- **Later visits in the session:** no splash (`sessionStorage`). Cross-document View Transitions (`@view-transition { navigation: auto }`) keep the header and monogram fixed (`view-transition-name: brand`) while the page body crossfades in 300 ms. Browsers without support navigate normally.
- **Reduced motion:** the monogram and hero appear with a 150 ms fade.
- It fixes visual B1 and B10, motion B6, performance B1 and mobile-a11y B10.

### W2 · "The Monument": one sentence, enormous, alone (one per page)
- A single Title Case statement of at most 6 words at `--fs-monument` (176 px at 1440x900 and 56 px at 390 wide), centred optically (slightly above centre). It has one italic gold word and nothing else on screen except one quiet text link at the bottom.
- **Entrance:** the words rise from masks (500 ms, 60 ms stagger). The italic gold word arrives last. After it lands, a single slow light sweep crosses it: a `background-clip: text` gradient moves once over 1.4 s, and its `background-position` is the only animated property.
- **Examples:**
  - Home: "One Message, Not *Five Searches*." Five faint ghost words ("Google", "Reviews", "Referrals", "Cold Calls", "Guesswork") sit in a line under it. Each one gets a 1 px gold strike that draws through it, then all five fade to 20% (a 900 ms total sequence). This is the compare scene in its final form.
  - Services: "Her Work, and the *People She Trusts*."
  - Story: "Built to Serve, *One Connection at a Time*."
  - Partners: "Pay on *Clients*, Not on Clicks."
- It fixes visual B6, layout B5, typography B-2 and B-3, and the "basic" complaint.

### W3 · "Across Canada": the globe settles into the map (Home scene 3, opening of Services finder)
- The globe is rebuilt as roughly 1,400 gold dots on a sphere: a 2D canvas, orthographic projection, no three.js (§6).
- In the hero it sits at 64vh on the right, turning one revolution every 90 s. Every 6 s one great-circle arc draws from a lit city to Winnipeg, at most one arc at a time, with a lift of 0.1R or less and a small light pulse travelling along it.
- **Arriving at "Near You" (a 1.1 s timed sequence after the snap):**
  - the globe turns to face Canada (an eased rotation);
  - the dots outside Canada fade to 0;
  - the Canadian dots ease from their projected sphere positions to their positions on the flat dot-matrix map, which is the same dot set, so there is no swap;
  - Winnipeg pulses with two ripple rings.
- Going back plays it in reverse.
- **Phones:** the same sequence at 70vw in the top band, or a pre-rendered 12-frame AVIF strip on low-tier devices.
- It fixes visual B3 and B4, layout B7, and motion B13 (the globe now has a job, in at most 3 scenes per page).

### W4 · "The Mark": the logo scene as each story's climax (Story scene 4, Home "Two Doors")
- Keep today's composition, the best frame on the site: the C ring wraps the dot globe, the W draws inside it, "W Stands for *Wealth.*" sits top-left and "C Stands for *Cargado.*" bottom-right.
- **Polish:**
  - the C ring draws with a stroke (700 ms);
  - the globe's dots contract into the ring's interior (600 ms);
  - the W strokes draw (500 ms);
  - the two statements set in last.
- This is the only scene where scroll scrubs, and only for the globe's slow rotation.
- Mark 11:24 stays as a quiet text reference with no rule before it.

### Endings, not copies
Each page's last scene gets its own final image:
- Home: on the one gold field, the monogram is embossed in black at 30vh beside the closing line. The last frame rhymes with the splash.
- Services: the gold-line province map, faint.
- Story: the founder's signature line.
- Partners: a single new gold dot joining the network constellation.
- Legal: a plain bone sheet.

It fixes visual B12.

---

## 3. Design system v2

### 3.1 Type scale (four steps that matter, plus labels)
Fit unit as in Round 4 shared.md: `--u: min(1vw, 1.5svh)`. Values computed at 1440x900 (`u`=13.5), 1366x768 (`u`=11.5) and 390x844 (`u`=3.9).

```css
:root {
  --u: min(1vw, 1.5svh);
  /* Monument: one per page, at most 6 words */
  --fs-monument: clamp(3.5rem, calc(12.5 * var(--u)), 11rem);       /* 169 · 144 · 56 px */
  /* Display: H1 / H2, at most 8 words, 1 or 2 lines */
  --fs-display:  clamp(2.5rem, calc(0.5rem + 5.6 * var(--u)), 6rem);  /* 84 · 72 · 40 px */
  /* Title: Times only at 28 px or more (card titles, numerals, pull quotes) */
  --fs-title:    clamp(1.75rem, calc(1rem + 1.4 * var(--u)), 2.75rem);/* 35 · 32 · 28 px */
  --fs-quote:    clamp(1.75rem, calc(0.8rem + 2.2 * var(--u)), 3.25rem); /* Times italic */
  /* Reading */
  --fs-lead:     clamp(1.125rem, calc(1rem + 0.3 * var(--u)), 1.375rem); /* 22 · 21 · 18 px */
  --fs-body:     clamp(1.0625rem, calc(1rem + 0.1 * var(--u)), 1.125rem);/* 18 · 17.8 · 17 px */
  --fs-note:     1rem;            /* notices, hints, consent, footer compliance: 16 px; 15 px on phones */
  /* UI (Poppins only) */
  --fs-ui:       1rem;            /* buttons, nav, tabs */
  --fs-label:    0.9375rem;       /* form labels, sentence case, 500, no tracking */
  --fs-eyebrow:  0.875rem;        /* 14 px, 500, uppercase, tracking .12em: the ONLY uppercase style */
}
@media (max-width: 759px) { :root { --fs-note: .9375rem; --fs-eyebrow: .8125rem; } }
```

**Rules:**
- **Line-height and tracking:**
  - Monument: line-height 0.92, tracking −0.02em.
  - Display: line-height 1.02, tracking −0.015em.
  - Title and quote: line-height 1.15.
  - Body: line-height 1.6, with a measure of 60ch (68ch at most).
  - `text-wrap: balance` on headings and `pretty` on paragraphs.
- **One italic gold word per headline:** Times italic, gold on ink, gold-dark on bone. Never two.
- **Who uses which face:**
  - Times: monuments, headlines, titles of 28 px or more, numerals, pull quotes.
  - Manrope: everything you read.
  - Poppins: eyebrows, buttons, labels, nav and nothing else, so situation quotes and offer item titles move to Times or Manrope.
- **Text floor:** nothing visible is under 14 px (the legal draft pill is 14 px). No tracked uppercase except the eyebrow. Tags and meta use sentence case.
- **Numerals:**
  - Outlined Times numerals (1 px gold stroke, transparent fill) are the system numeral for every sequence: steps, offers, tiers, values and legal sections.
  - They are 1.6 to 2.2 times the size of the title they number.
  - Inside Index rows they shrink to 26 to 28 px, so the row stays 80 to 96 px tall and 4 to 5 rows fit 1366x768.
- **Words, not letters:** headings split into words at build time, and there are no character splits or decode scrambles anywhere.

### 3.2 Spacing rhythm
An 8 px base, viewport-aware. The rule is **tight inside a group, wide between groups, wider still at the scene edge.**
```css
--s1: 8px;
--s2: clamp(12px, 1.6svh, 16px);   /* inside a group: eyebrow→headline, label→input */
--s3: clamp(16px, 2.4svh, 24px);   /* headline→lead, row padding */
--s4: clamp(24px, 4svh, 40px);     /* lead→action */
--s5: clamp(32px, 6svh, 72px);     /* between groups */
--s6: clamp(40px, 10svh, 128px);   /* scene top and bottom breathing */
```
- Every scene leaves at least 18% of its area empty (the whitespace budget).
- At most 3 groups per scene: the head (eyebrow, headline, lead), the body (rows, panels, a visual or a form step), and the action (one button, plus one optional text link and one fineprint line).
- The scene box, `--scene-safe-h` and the header subtraction are exactly Round 4 shared.md §3–4. This direction only re-declares type and spacing tokens, which is allowed.

### 3.3 Grid and the five archetypes
- 12 columns, max width 1320 px, side gutter `clamp(20px, 5vw, 72px)` and column gap `clamp(16px, 2vw, 32px)`. Shared left text edge on every scene.
- **Archetypes.** Never use the same one twice in a row, and limit Split to 40% of a page.

| | archetype | composition | phone |
|---|---|---|---|
| **M** | Monument | One statement centred, at most 6 words, plus one text link at the bottom edge. Nothing else. | 56 px statement in the upper-middle and the link in the thumb zone |
| **S** | Split 5 / 1 / 6 | The text column on cols 1–5, bottom-anchored at 62% height; a gap column; the visual on cols 7–12, which may bleed off the right edge by a third | The visual is a top band (38svh), the text sits below and the CTA is at the bottom |
| **I** | Index | A small headline over full-width hairline rows (80–96 px tall, a 28–32 px Times title, a one-line meta at the right, an arrow). 4–6 rows. | Rows of 64–72 px with the meta under the title, 4–5 rows maximum, then a pager |
| **T** | Triptych | Three tall panels with 1 px hairlines between them, each holding an outlined numeral, a title, one line and one link | A swipe row (one panel at 86vw, dots and buttons) using `ui-tabs.js` |
| **P** | Paper | A single centred column of 560–680 px (forms, legal text) on bone, the only place a framed surface is allowed | Full width; steppers hold 3–4 fields per step |

### 3.4 Colour roles and gold rules
| role | value | use |
|---|---|---|
| ink | `#0B0B0C` | the stage; about 65 to 70% of scenes |
| lamp | radial `#1A1712` → transparent, 70vmax | one per ink scene, centred behind the headline; static |
| charcoal | `#141416` | panel surfaces on ink (Triptych, sheets, dialogs) |
| ivory text | `#F3ECDD` | text on ink; secondary text 82% (never lower), which keeps ≥ 9:1 |
| bone | `#F5F0E6` | paper scenes, flat; about 25 to 30% of scenes |
| black text | `#0B0B0C` | text on bone and gold; secondary `#3B362C` (≥ 9:1) |
| gold | `#D4AF37` | light on ink |
| gold-dark | `#7A5C12` | gold text on bone (≥ 5.5:1) |
| gold field | static `#B8913A → #D9B862` at 115°, plus a brushed texture | **at most one scene per page** |

**Gold rules:**
1. Gold covers at most about 6% of any ink or bone screen. The primary button counts.
2. Gold is allowed for: the eyebrow, the one italic word, the primary button, 1 px hairlines (gold at 22% alpha on ink, `#B8913A` at 40% on bone), outlined numerals, the focus ring, the globe and map dots, and the monogram.
3. Gold is never used for body text, placeholder fills, box backgrounds or icons beside body copy.
4. The gold field is a material, not a wall:
   - a static 115° gradient;
   - a 128 px brushed-metal noise tile at 6%;
   - a single slow sheen band that moves only during the scene entrance (one 1.6 s translate, then still);
   - full-black type, with at most one button, which is black with gold text.
5. No stars and no grain on bone or gold.
6. Fields change only between chapters (2 to 4 changes per page), and the header colour flips once, at the midpoint of the field crossfade.

### 3.5 Surfaces and texture
- **Ink:**
  - the lamp radial;
  - a static star field drawn once to a canvas (at most 140 stars, 0.35 to 1 px, warm white and gold at 10 to 55%), with no streaks;
  - a gentle drift only on the hero and close scenes, on desktop;
  - a static grain tile at 4% opacity with no blend mode and no animation.
- **Bone:** flat ivory with no shadow, no gradient and no texture. Hierarchy comes from hairlines and space.
- **Panels:** charcoal plus a 1 px hairline. Corner radius 2 px everywhere (buttons, inputs, panels, dialogs). Offset "shadow plate" borders are deleted everywhere except legal, where the paper stack means paper (and even there, one offset sheet instead of two).
- **Framing:** at most one framed element per screen.

### 3.6 Imagery (no photos yet)
1. **The engraved-gold illustration family**, the only illustration style. Every visual is one of four drawings, all built from 1 px gold lines and gold dots:
   - the dot globe;
   - the dot-matrix map of Canada;
   - the gold-line province map;
   - the C·W monogram.
   Nothing is added beyond these four.
2. **The founder slot (ask the client for the photo now; it is the biggest trust upgrade):**
   - designed for a 4:5 portrait at 48 to 60svh;
   - duotone (black to `#D4AF37` highlights) at 0.92 contrast, cut against ink, with the C ring passing behind one shoulder;
   - **until it exists, a typographic portrait:**
     - the monogram as an 18vh outline;
     - `[Founder name]` set at `--fs-display` in Times italic;
     - her one-line quote at `--fs-quote`;
     - `[Signature]` as a quiet italic line;
     - never an empty frame, and never the globe inside a frame.
3. **Places, not people (optional, later):** licensed duotone night aerials of Canadian cities at 18% under the ink on at most two scenes (the Home close and the Partners hero). They are AVIF, at most 90 KB each, and lazy.
4. **No stock faces, testimonials, badges or "verified" marks** (CR02, CR16).

### 3.7 Iconography
- Nine bespoke category icons for insurance, strategy, outsourcing, manufacturing, legal, mortgage, real estate, accounting and planning. They are drawn on a 24 px grid with a 1.25 px stroke and round joins, in gold on ink and gold-dark on bone.
- They are used only in the Services categories Index, the finder select and the hero sheet's step 1.
- **Utility glyphs:** arrow, check, WhatsApp, phone, mail, close, chevron. Nothing else, and never an icon beside a headline.

### 3.8 Buttons, links and forms
- **Primary button:**
  - Poppins 600 at 16 px, Title Case;
  - 56 px tall on desktop and 52 px on phones, with 28 px horizontal padding and a 2 px radius;
  - on ink: a gold fill with black text; on bone: a black fill with ivory text and a gold arrow; on gold: a black fill with gold text;
  - on hover and focus the fill lightens 6%, the arrow nudges 4 px over 200 ms, and a 1 px inner highlight appears;
  - no magnetic pull, letter-roll or tilt, except that the single hero CTA keeps a 6 px magnetic pull on desktop.
- **One primary per scene.** At most one text link beside it.
- **CTA vocabulary (fixes UX B4 and content B11):**
  - clients: "Get My Introduction" (with the WhatsApp glyph);
  - founder offers: "Book a Free 15-Min Call";
  - partners: "Apply to Join";
  - the secondary is always a text link: "Or Call / Email Us" or "Send an Inquiry".
- **Text links:** in the text colour, with a 1 px underline at 35% that draws to 100% (`scaleX` from the left, 250 ms) on hover and focus. The target area is 44 px or more (padding-block).
- **Index rows:** the whole row is the link. On hover a 4% ivory or black flood fades in, the arrow nudges 6 px and the title shifts 8 px right (transform). On touch, a pressed state.
- **Forms:**
  - labels sit above the field in Manrope 600 at 15 px, sentence case;
  - inputs are 56 px tall with 18 px text and a 1 px border (ivory at 45% on ink, `#8A7A5A` on bone); filled inputs on bone are `#FFFDF8`;
  - focus is a 2 px gold ring with a 2 px offset;
  - errors are text plus an icon, shown on blur;
  - `autocomplete` and `type` are set;
  - steppers show "Step 1 of 3" and use `aria-live`, focus moves to the step heading, and values are kept on Back;
  - after a WhatsApp hand-off the scene shows: "WhatsApp opened in a new tab. Didn't open? Call [number] or email [address]."
- **Placeholders (`.ph`):**
  - no fill;
  - the text colour at full strength with a 1 px dotted underline in gold (on ink) or gold-dark (on bone);
  - the same size as the surrounding sentence, never larger.
  - Proof-only blocks (stats, rating, testimonials, live counters) render only when `config.js` has a value, and show a qualitative trust line otherwise.
  - `?review=1` restores the loud highlight and shows every hidden proof slot for the founder's review.
  - Brackets inside facts and compliance text are always visible.

### 3.9 Motion principles and timings
**"Arrive, then be still."**
- **Transitions are time-based, not scrubbed.** When `film-snap.js` settles a gesture it plays the transition on a clock, and input is locked until 70% of it has played:

| t (ms) | what |
|---|---|
| 0–250 | The outgoing content leaves as one group (y −24 px, opacity 0, `power2.in`) |
| 150–550 | Fields crossfade if the chapter changes (opacity only; the iris is retired) |
| 250–850 | The incoming content: eyebrow, then headline words (mask rise, 50 ms stagger), then lead, then action (`cubic-bezier(.2,.7,.1,1)`) |
| ≤ 900 | Fully composed. No frame ever shows an empty field |

- **Nothing moves while text is readable.** The exceptions are the hero globe's slow turn, which sits beside the text and never behind it, and the one-off light sweep on a monument word. `film-alive` heading drift is deleted.
- **Scrub only where it is the point:** the W4 logo rotation.
- **Easing family:** in `power2.in`, out `cubic-bezier(.2,.7,.1,1)`, and moves `cubic-bezier(.65,0,.35,1)`. Durations run from 200 ms (hover) to 1,100 ms (W3), and nothing is longer.
- **Interaction motion:**
  - kept: a subtle cursor ring (no morph labels) and a slow spotlight that follows the cursor behind headlines (at most 8% gold, `lerp` 0.08);
  - tilt only on small cards (2° or less), never on forms, panels or legal text;
  - removed: letter-roll, decode, star push-away streaks and stacked hover effects.
- **Reduced motion:** 150 ms crossfades, everything in its final state, the globe as a static poster, and native CSS scroll-snap.

### 3.10 Sound
Round 4 keeps SFX on with no header toggle, so the sounds must be ones nobody would want to mute. Only three remain:
- a soft low "breath" on each scene settle (a sine at 140 Hz with a 220 ms attack, peak 0.035);
- a click (peak 0.05);
- a two-note success chime when a form completes.

They follow these rules:
- master gain 0.12;
- no scroll ticks, hover ticks or splash chime;
- audio unlocks only on a click or tap, never on scroll;
- silent on coarse pointers (touch) and when `prefers-reduced-motion` is set;
- the `sfx.js` progress hook reads nothing per frame (it fixes perf B4).

**Owner question:** a quiet "Sound off" text link in the footer, not the header (see Risks).

---

## 4. Chrome (shared by every page)
- **Desktop header (about 72 px):**
  - CW monogram plus the "Cargado Strategies" wordmark;
  - the nav: Services · Our Story · For Professionals (quieter, 70%);
  - one gold "WhatsApp Us" button.
  - Facebook moves to the footer. That leaves 5 chrome marks in total (fixes layout B1 and UX B15).
- **Phone header (56–64 px):** monogram · a 44 px gold WhatsApp icon button · "Menu". The menu lists the pages plus WhatsApp, `tel:`, email and Facebook. This answers Round 4 Risk 7 and fixes UX B9 and mobile-a11y B3 without bringing back a floating button.
- **Position cue (desktop only, optional):** a column of 5–7 small 6 px dots, 32 px from the right edge, at 40% ivory. The current dot is gold. Each dot is a labelled link with `aria-current`. There are no numbers and no dashes (audience rule 14).
- **The header backdrop** on ink is `rgba(11,11,12,.55)` with an 8 px blur, and on bone it is `rgba(245,240,230,.7)`, so the nav is always legible (fixes motion B12).
- **The legal draft banner** becomes a 14 px gold-dark pill inside the header bar, "Draft: to be reviewed by a lawyer in Canada before launch" (fixes layout B13 and content B13).
- **Compact footer** (the bottom band of every close scene; one screen together with the close):
  - one row of links: Services · Our Story · For Professionals · Legal · Facebook;
  - one contact row: WhatsApp · `tel:` · email · [City], Canada · "We only message from this number";
  - one compliance line at 15–16 px: the commission and independence notice plus "strategy and coaching only, not licensed accounting, tax or investment advice";
  - one © line.
- **Tagline:** "Connected by Purpose. United in Service." appears in the footer only. "One Message. The Right Person. Close to You." closes Home only (fixes content B15).

---

## 5. Scene by scene

Legend:
- archetype: M (monument), S (split), I (index), T (triptych), P (paper);
- field: ink, bone, gold;
- the globe appears only where it is marked ◎;
- fineprint means one sentence at `--fs-note`, at the bottom edge of the scene, never directly under the button, with a "Details" link to `legal.html#disclosure` where that applies.

### 5.1 Home: 12 scenes become 7, in 3 chapters (ink → bone → gold)

**1 · Hero** (S, ink, ◎ large)
```
┌──────────────────────────────────────────────────────────────┐
│ ◯W Cargado Strategies     Services  Our Story  For Pros [WA] │
│                                                    · ·  ·    │
│  FREE INTRODUCTIONS · ACROSS CANADA          ·  ◎◎◎◎◎◎◎◎  ·   │
│  The Right Professional,                    ◎◎◎◎◎◎◎◎◎◎◎◎     │
│  Near *You*.                               ◎◎◎◎◎◎◎╭──╮◎◎     │
│  Insurance, strategy and outsourcing from  ◎◎◎◎◎◎◎◎◎◎◎◎ (bleeds│
│  [Founder name] herself, and free          ◎◎◎◎◎◎◎◎◎◎◎   right)│
│  introductions near you for everything else.  ◎◎◎◎◎◎◎◎       │
│  [ Get My Introduction → ]   Or call / email us             │
│  No fee to you · No obligation · Licence shown where one applies │
└──────────────────────────────────────────────────────────────┘
```
- **About 38 words.** The CTA opens a bottom sheet (`ui-dialog.js`) with 3 steps:
  1. "What do you need?": the four situations as large rows plus the six service chips, with icons;
  2. "Your city", with "We ask for your city only so we can introduce you to someone close to you.";
  3. a summary, "Open WhatsApp", and "Nothing is sent until you tap send."
- The proof strip is hidden until it has real values (review mode shows `[n]`).
- **Phone:** the globe as a 38svh top band at 70vw, the H1 at 44 px, the CTA full width in the thumb zone.
- **"Watch 1 min"** is a text link that appears only once a video URL exists. The video scene is deleted.

**2 · One Message** (M, ink, no globe)
```
│                                                              │
│            One Message, Not *Five Searches*.                 │
│     G̶o̶o̶g̶l̶e̶  R̶e̶v̶i̶e̶w̶s̶  R̶e̶f̶e̶r̶r̶a̶l̶s̶  C̶o̶l̶d̶ ̶C̶a̶l̶l̶s̶  G̶u̶e̶s̶s̶w̶o̶r̶k̶ (20%)    │
│                                                              │
│                  See How It Works ↓                          │
```
- This is the old compare scene (W2). The struck-through list is now just 5 words. The link advances to the next scene.

**3 · How It Works, Near You** (S, ink, ◎ becomes the Canada map: W3)
```
│  HOW IT WORKS                       · · ·:·:·:·:· ·          │
│  Someone Good, *Near You*.          ·:·:·:·:·:·:·:·:·  ◉ Wpg │
│  ⓞ1 Now: you send one message      ·:·:·:·:·:·:·:·:·:·       │
│  ⓞ2 Within [24h]: we introduce      ·:·:·:·:·:·:·:·:·        │
│  ⓞ3 Day [3]: we check in            ·:·:·:·:                 │
│  [ Get My Introduction → ]                                   │
│  fineprint: Illustration only · partners are independent ·   │
│  Cargado Strategies may receive a commission. Details        │
```
- This merges the old how-it-works and find scenes. It is the only place on Home where the three steps appear (fixes content B3).
- While `PARTNERS` is empty, the secondary link reads "Tell Us What You Need" (the concierge) instead of the finder link (fixes UX B2).
- **Phone:** the map is a top band; the three steps are three 56 px rows.

**4 · From [First name], Herself** (T, bone, chapter change: a field crossfade)
```
│  FROM OUR FOUNDER                                             │
│  Three Things [First name] Does *Herself*.                    │
│ ┊ ⓞ1                 ┊ ⓞ2                 ┊ ⓞ3                 ┊│
│ ┊ Family Protection  ┊ 30-Day Cash-Flow   ┊ Back-Office         ┊│
│ ┊ Review             ┊ Clean-Up           ┊ Team                ┊│
│ ┊ one line           ┊ one line           ┊ one line            ┊│
│ ┊ [company] · licence┊ strategy and       ┊ [company]           ┊│
│ ┊ [n] · [regulator]  ┊ coaching only…     ┊                     ┊│
│ ┊ Book a Free 15-Min →┊ Book a Free 15-Min →┊ Book a Free 15-Min →┊│
```
- Each panel keeps its required label line (CR01, CR12, CR13).
- **Hover or focus:** a soft gold lamp rises inside the panel (opacity of a pre-blurred radial) and the link arrow nudges. There is no width change.
- The quotes are removed until real testimonials exist.
- **Phone:** a swipe row with dots and Prev/Next buttons.

**5 · Two Doors** (S 6/6, bone)
```
│  OUR STORY                    ┃  FOR PROFESSIONALS          │
│  ◯W (outline, 20vh)           ┃  Be Found by People         │
│  W for *Wealth*.              ┃  *Near You*.                │
│  C for Cargado.               ┃  No referral promises. You  │
│  Read Her Story →             ┃  pay on clients, not clicks.│
│                               ┃  For Professionals →        │
```
- This replaces the old story-teaser and partner-cta scenes, and keeps the partner pitch out of the client flow (fixes UX B11).

**6 · Questions** (I, bone)
```
│  The Questions Everyone *Asks First*.                         │
│ ───────────────────────────────────────────────────────────── │
│  Why is it free?                                          ＋  │
│  Do I have to hire them?                                  ＋  │
│  How do you choose who to show me?                        ＋  │
│  What happens to my information?                          ＋  │
```
- An accordion with one item open at a time. The longest answer is capped so that one open item still fits 360x740.

**7 · Close** (M with a footer band, the one gold field)
```
│  ┌─ gold material ─────────────────────────────────────────┐  │
│  │ One Message. The Right Person.              ◯W (black   │  │
│  │ *Close to You.*                              emboss 30vh)│  │
│  │ [ Get My Introduction → ]   Or call / email us          │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ink band: links · contact row · compliance line · ©          │
```

**Deleted or merged on Home:**
- video → the hero link;
- situations → the hero sheet, step 1;
- compare → scene 2;
- find → scene 3;
- services grid → the header plus Services;
- story teaser and partners → scene 5;
- the two FAQ scenes → scene 6.

### 5.2 Services: 8 scenes, 4 field changes
Chapters: Intro (ink) → Her Work (bone) → The Network (ink) → Ask (bone) → close (ink).

| # | scene | arch · field | content (each fits one screen) |
|---|---|---|---|
| 1 | Intro | M · ink | "Her Work, and the *People She Trusts*." Two text links: "Her Three Services ↓" and "Find Someone Near You ↓". The old 6-door jump rail is deleted. |
| 2 | Insurance | S · bone | Left: the eyebrow "Ours · Insurance", the H2 "Is Your Family *Covered*?", and a 2-line promise. Right: an Aesop label card (1 px gold-dark hairline, no shadow) holding "Family Protection Review · 30 min", 3 included lines, "Offered through [company name] · licence [n] · [regulator]", and **Book a Free 15-Min Call**. One fineprint line. |
| 3 | Cash-Flow Clean-Up | S · bone | The offer only: "The 30-Day Cash-Flow *Clean-Up*.", a 2-line promise, "[2] spots in [month]", the CTA, and the fineprint "strategy and coaching only, not licensed accounting, tax or investment advice." |
| 4 | What You Get | I · bone | 5 rows, one per deliverable, each with an outlined numeral and a one-line "Fixes:". The `[value]` column is hidden until real prices exist (review mode shows it). The promise is one line at the bottom. This splits the old 170-word scene (fixes UX B6 and content B8). |
| 5 | Outsourcing | S · bone | "A Back-Office Team, *Without Hiring*." Four rows of draft roles in brackets ("[Bookkeeping]", "[Inbox and calendar]", "[Social media]", "[Customer follow-up]"), the CTA and a label line. |
| 6 | Finder | S · ink, ◎ → province map (W3 variant) | Left: "Find Someone *Near You*.", the category select (with icons), the city box with its "why" line, and the "Sorted by distance only, not a recommendation" fineprint. Right: the gold-line province map (the existing best illustration). Results are paged 3 at a time ("Next 3"), and phones get Map / Results tabs. While `PARTNERS` is empty, the result card reads "Partner Spot Available" plus a concierge "Ask Us to Find Someone" CTA, so the copy and compliance stay. |
| 7 | Categories | I · ink | "Nine Kinds of Help. *One Way to Ask.*" 9 rows of 64–72 px (icon, name, Ours or Partner network in sentence case, arrow). Each row opens a fitted dialog with the description, types and partners or placeholder cards (fixes layout B2 and mobile-a11y B1). |
| 8 | Inquiry | P · bone | A stepper in 3 steps: (1) service and city, (2) name and contact, (3) message, consent, honeypot, and the commission notice as fineprint, then Send. Now / [24h] / Day [3] shows once, as a small line under the step header. Success state FR08. |
| 9 | Close | ink | "Still Unsure? *Ask a Person.*", the CTA and the compact footer. |

Services has 9 stops because it is the reference page. Each one is one idea.

### 5.3 Our Story: 7 scenes become 6

**1 · Top** (M, ink)
```
│        Built to Serve, *One Connection at a Time*.           │
│                     Read Her Story ↓                         │
```
- "Scroll to Read" is deleted. The draft note moves to review mode or an HTML comment, since it is not compliance copy.

**2 · Where It Began** (S, bone)
```
│  WHERE IT BEGAN                  │  In [year], a friend in [city]   │
│  Nobody Should Search            │  spent three weeks calling ...   │
│  *Alone*.                        │  (≤ 60 words, bracketed facts)   │
```
- The founder's draft voice follows content R1, with brackets on facts only. The card offset at x=280 is deleted.

**3 · In Her Own Words** (S, bone; the portrait slot)
```
│  ┌ 4:5 duotone portrait ┐   "[One-line quote in her words.]"  │
│  │ (or typographic      │    — set in Times italic, --fs-quote │
│  │  portrait: ◯W + name)│   [Founder name] · Founder           │
│  └──────────────────────┘   [Signature]     Message [Name] →   │
```

**4 · The Mark** (W4, ink, ◎ inside the C). "[How the logo came about, in the founder's words.]" and Mark 11:24 as quiet text.

**5 · What I Believe** (T, ink)
```
│ ┊ ⓞ1 People Before     ┊ ⓞ2 Say How You     ┊ ⓞ3 Grow Slowly,   ┊│
│ ┊ Transactions         ┊ Are *Paid*         ┊ With Care         ┊│
│ ┊ one line             ┊ the commission     ┊ one line          ┊│
│ ┊                      ┊ sentence (verbatim)┊                   ┊│
│  fineprint: partners are independent businesses… (from old network scene)   │
```
- This merges the old values and network scenes. The independence notice is kept verbatim as fineprint (fixes content B10).

**6 · Talk** (ink close). "Tell Me What You Need. *I'll Find Someone Good.*", the CTA, a small portrait avatar or the monogram beside the button, the footer, and the signature line as the final image.

### 5.4 Become a Partner: 8 scenes become 6

| # | scene | arch · field | content |
|---|---|---|---|
| 1 | Hero | S · ink, ◎ as a constellation | "Be Found by People *Near You*." A 2-line sub naming who it is for. The founding offer as a single line, "First [2] partners per service, per city: [founding terms]". **Apply to Join**. The globe sits on the right as a sparse constellation; on load one new dot joins and lights up. |
| 2 | How It Works | T · bone | "Pay on *Clients*, Not on Clicks." Three panels: Someone Asks → Same-Day Hand-Off → You Pay on Clients. The arrangement copy and "no promise of referrals, outcomes or endorsement" (CR04) sit as fineprint. This merges the old how and arrangement scenes and fixes the empty halves (layout B10). |
| 3 | Tiers | T · ink | Community / Growth / Premier as three hairline columns (no boxes or plates). `[$ per month]` is set at body size in quiet `.ph`. One **Apply to Join**, and each column pre-selects its tier through a link. On phones, a swipe row. |
| 4 | Founding | M · gold (this page's one gold field) | "The First [2] Partners Per Service, *Per City*." The cap note is one line. The live counter is shown only when real. |
| 5 | Apply | P · bone | A stepper in 3 steps: Business → Licence and Area → About and Consent. "What we ask" (licence, quick replies, code of conduct) becomes the intro of step 1. The two notices are merged into one fineprint. "Rather talk? Message us on WhatsApp" sits above the form. Each step holds 4 fields or fewer. |
| 6 | Close | ink | "Questions Before You *Apply*?", Ask About Partnering, and the footer. The final frame is one constellation dot. |

### 5.5 Legal: one field, no show
- Every scene is bone (the close too). There is no globe, no stars, no splash (the session flag is irrelevant here) and no field changes. Scenes change by crossfade only. The paper stack is kept, with a single offset sheet.
- The scenes stay as today, which suits the pager:
  1. contents (an Index of 6 rows, "The Fine Print, *in Plain English*.");
  2. Professional disclosure;
  3. Privacy;
  4. Terms;
  5. Partner code of conduct;
  6. Q&A (accordion);
  7. close.
- **Each document scene** has a giant outlined numeral, the title, and a paper sheet at a 68ch measure, set at 18 px and line-height 1.7. Long text pages with `ui-pager.js` ("Page 1 of 3", Prev/Next) and never scrolls inside a box.
- **Draft banner:** it moves to the header pill. Every word is kept and the em dash is removed.

---

## 6. Performance plan (target: Lighthouse mobile ≥ 90, TBT ≤ 200 ms, LCP ≤ 2.0 s, CLS ≤ 0.05)

1. **Splash:** once per session, 1.0 s or less, and it never waits on `film.ready`. The hero HTML is the LCP element (fixes perf B1).
2. **No three.js:**
   - The globe becomes `dots-globe.js`, about 5 KB gz on a 2D canvas: an orthographic projection of about 1,400 precomputed dots (a JSON of about 9 KB, inlined), with one arc path and a single shadow-free stroke style. The W3 morph uses the same dot array (lerp sphere xy to map xy).
   - It renders only while it is moving. It sleeps when idle, when the tab is hidden and when off-scene, through IntersectionObserver.
   - Low-tier devices (`deviceMemory ≤ 4`, `hardwareConcurrency ≤ 4`, Save-Data or coarse pointer at 2x DPR or more on a slow connection) get a static AVIF poster plus a 12-frame AVIF strip for W3.
   - This saves about 120 KB gz and the WebGL compile (fixes perf B5).
3. **Layers:**
   - the grain is a static 4% tile, with no blend mode or animation;
   - the stars are drawn once to a canvas and redrawn only on resize; the hero and close drift by translating the canvas element (compositor-only);
   - the full-screen `clip-path` iris is retired and fields crossfade on opacity;
   - the splash C-ring is an SVG stroke in a small box (fixes perf B3).
4. **Text:**
   - word splits are done at build time in `build.mjs`, so there are no runtime character splits;
   - `kerning.js` is deleted;
   - `will-change` is applied only during a transition;
   - the target DOM is 900 nodes or fewer on Home (fixes perf B6).
5. **Libraries:**
   - GSAP core is kept for the timed transitions;
   - ScrollTrigger runs only where a scrub remains (the Story logo scene) and is dynamically imported there;
   - Lenis is desktop fine-pointer only;
   - touch uses native `scroll-snap-type: y mandatory` with `scroll-snap-stop: always`, which gives one swipe per scene with no JS glide (fixes mobile-a11y B2 and audience rule 12).
   - The JS budget is 70 KB gz per page or less.
6. **SFX:** no per-frame reads, and the hook is attached only after audio unlocks (fixes perf B4).
7. **Fonts:**
   - Times New Roman is a system font, with Tinos loaded only when Times is missing;
   - Manrope 400/600 and Poppins 500/600, latin-subset WOFF2 (about 60 KB total), with `font-display: swap` and size-adjusted fallbacks.
8. **Boot hardening:**
   - the header and nav are static HTML;
   - the flow fallback renders the same composition;
   - the fallback switches mode only if the visitor has not yet scrolled (fixes motion B11 and UX B14).
9. **Legal:** no globe module, no stars and no splash, so the page carries about 40% fewer bytes.
10. **Deploy:** only `dist/` is deployed, with Brotli and the bfcache unblocked on services.

**Verification:** Lighthouse mobile on all 5 pages; a 4x CPU scroll trace with 55 fps or more and fewer than 5% of frames over 25 ms; fit-audit at all 9 viewports in both modes; and a seek test at 25%, 50% and 75% of every transition that never shows an empty field.

---

## 7. De-clutter: delete, merge, quiet
**Delete:**
- Round 4's removals;
- the corner brackets;
- the decode scramble;
- letter-roll;
- `film-alive` drift;
- star streaks;
- the grain blend and animation;
- the circle iris between scenes;
- offset plates outside legal;
- the Home video scene;
- "Scroll to Read";
- spec-speak lines (content R5);
- "Write Your One Message" and the other duplicate CTAs;
- the services jump rail;
- the globe as a corner sticker (it now appears in at most 3 scenes per page: Home 1 and 3, Services 6, Story 4, Partners 1);
- tilt on forms and panels;
- scroll and hover sound ticks.

**Merge:**
- Home 12 → 7;
- Story 7 → 6;
- Partners 8 → 6;
- the duplicate notices into one fineprint per scene;
- "Nothing is sent until you tap send" once per page, under the WhatsApp action (12 → 5);
- Now / [24h] / Day [3] once per page.

**Quiet:**
- `.ph` placeholders;
- the proof slots;
- notices as fineprint (15–16 px, no box, no bold lead);
- the Partner link in the nav;
- Poppins limited to UI.

**Never removed:** the commission and independence notices, "strategy and coaching only", the city-why lines, "not a recommendation, sorted by distance", "Partner Spot Available", the founder-business labels and the `[company / licence / regulator]` brackets, the CR04 partner disclaimer, the legal draft notice and the Mark 11:24 reference. Each is moved or restyled, and the meaning stays unchanged. A compliance diff gate runs against the Round 4 verbatim lists.

---

## 8. Judge findings traceability (every critical and high)
| finding | fix in this direction |
|---|---|
| visual B1, layout B3, typography B-3, mobile-a11y B3 (no signature; crowded hero; phone CTA below the fold) | W1, Home 1 (38 words, one CTA, sheet), phone hero composition |
| visual B2/B15, UX B3, content B1/B7 (no face, no story, unnamed founder) | §3.6 portrait slot plus typographic portrait, Story 2–3 draft voice, `[First name]` headlines, photo request |
| visual B3/B4, layout B7 (globe as wallpaper, arc scribble) | W3, 3 scenes per page maximum, a clean dot globe with one arc |
| visual B5, motion B3 (strobe, mustard gold) | §3.4 chapters, one gold material field per page |
| visual B6, layout B5, typography B-2 (one template, flat scale) | §3.1 monument scale, §3.3 five archetypes with a no-repeat rule |
| visual B7, layout B1/B8/B9, typography B-5, content B2, UX B5 (chrome, boxes, loud placeholders) | §4 chrome, §3.5 no plates, §3.8 `.ph` and proof policy |
| visual B8, layout B2/B4, mobile-a11y B1 (clipped scenes) | the Round 4 fit contract, word budgets (≤ 40 phone / ≤ 60 desktop), dialogs, pagers, steppers |
| layout B6, UX B7, content B3, motion B5, perf B7 (too long, repetitive) | Home 7, Story 6, Partners 6, once-per-page rules |
| content B4/B5/B6 (spec-speak, video box, callout notices) | §7 delete, fineprint pattern |
| UX B1/B2 (identity split, finder dead end) | the hero sub names the founder's three plus introductions; the concierge state while `PARTNERS` is empty |
| UX B4, content B11 (CTA sprawl) | §3.8 vocabulary, one primary per scene |
| UX B8/B9 (WhatsApp only, no phone CTA) | the phone header WA icon, `tel:` and email in the hero, close and footer |
| motion B1/B4 (dead air, half-states) | §3.9 timed transitions that overlap and never show an empty field |
| motion B2 (decode) | deleted |
| motion B6, perf B1, mobile-a11y B10 (splash every load) | W1 once per session plus View Transitions |
| motion B7 (rain) | static stars, no streaks |
| motion B8, mobile-a11y B6 (SFX) | §3.10, three sounds, silent on touch and under reduced motion |
| perf B2/B3/B4/B5/B6 (main thread, jank, SFX layout, three.js, splits) | §6 items 2–6 |
| typography B-1/B-4, mobile-a11y B4 (small text, three voices) | the §3.1 floor and face roles |
| mobile-a11y B2/B5 (phone scrolljack, long forms) | native snap on touch, steppers of 4 fields or fewer |

---

## 9. Risks
1. **"Calm" can slide back into "basic".** The wow depends on execution: monument scale, perfect spacing, and W1 and W3 being silky. Mitigation: build W1, W2 and W3 first as a vertical slice on Home and review it with the client before rolling it out.
2. **This reverses parts of the user's Round 3 requests** (decode, letter-roll, broad cursor reactions, SFX on scroll). The judges' evidence supports it, but the user asked for them. Keep a reduced cursor ring and spotlight plus the hero magnetic CTA, and state the trade-off plainly when presenting.
3. **The founder photo and name are missing.** The typographic portrait carries the gap, but the trust ceiling stays low until the photo exists. This is the #1 client ask.
4. **The globe rewrite (removing three.js)** is new code. The W3 morph and the arcs must look as good as the WebGL version. The fallback is an AVIF poster plus a frame strip.
5. **Round 4 engine fit.** Time-based transitions replace the scrubbed scene timeline. `film-snap.js` must own "go to N and play", and ScrollTrigger survives only for the logo scrub. This needs to be reconciled with engine.md before the build.
6. **Native snap on touch versus JS snap on desktop** gives two code paths. Test real iOS and Android devices (Round 4 Risk 4 stands).
7. **The proof-slot policy** hides `[n]` stats and testimonials outside review mode. Confirm with the owner that this does not breach "placeholders stay visible". Compliance brackets themselves always stay visible.
8. **Owner decisions needed:**
   - a footer "Sound off" text link;
   - a footer "Reduce motion" switch (audience rules 9 and 6; WCAG 2.2.2, because the pause toggle is gone);
   - the phone header WhatsApp icon;
   - hiding the finder or switching to concierge while `PARTNERS` is empty.
9. **The gold field may still read as mustard on cheap displays.** Proof it on a real phone and limit it to the two Monument scenes that use it.
10. **View Transitions** do nothing in Firefox, which is acceptable as progressive enhancement. Make sure the cross-document view transition never delays navigation.
