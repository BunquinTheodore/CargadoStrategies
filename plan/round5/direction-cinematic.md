# Round 5 · Direction A: Cinematic Luxury, "The Gold Hour"

Status: proposal (art direction), read-only on `site/`. Written 2026-10-18 from every `plan/round5/research-*.md` and `judge-*.md`, the shots in `plan/round5/shots/`, `PLAN.md` (Rounds 1 to 4), and `plan/round4/shared.md` + `build-order.md`.

Fixed inputs that this direction does not reopen:
- **Brand.** Black and gold, no blue. Display is Times New Roman (Tinos only where it is missing) in Title Case. Body is Manrope and UI is Poppins.
- **Compliance.** Commission and independence notices, "strategy and coaching only", every `[bracket]` placeholder, the legal draft banner, and Mark 11:24 as a reference only. These may be moved or restyled, and shortened only where the meaning is unchanged. They are never dropped.
- **Round 4 contract.** Every scene fits one screen from 1920x1080 down to 360x740, one gesture moves one scene, and the removals are treated as done: no HUD/counter/corners, no floating WhatsApp, no phone bar, no sound or pause toggles, no decorative dashes before text. `--u: min(1vw, 1.5svh)` stays the single fit unit (shared.md D1).
- **Speed.** Lighthouse performance of 90 or more on mobile, on every page.

---

## 1. Concept

**"The Gold Hour": a short night film, lit by one gold light, with one actor.**

The site plays like the title sequence of a quiet, expensive film. The stage is black most of the time, like a cinema before the picture. Gold is never paint. It is *light*: a key light behind a headline, a hairline that catches it, an arc of light travelling across a globe, a metallic plate at the climax. Every screen is one *shot* with one idea, framed like a film still and set in very large Times New Roman: a single claim, a single object or a single choice. The site has one actor, **the network globe**, and it has a script. It opens as the C of the monogram, carries one message across Canada, dives into the map, folds back into the C·W mark, and ends the film where the splash began. Scenes no longer scrub half-way. The visitor gives one gesture, the film *cuts* (overlapping, never through an empty frame), the shot lands fully composed in under a second, and then **nothing moves while they read**. The wow comes from scale, light and four or five directed moments, not from many effects. That is the calm confidence a 30 to 45 year old remembers (research-awards §0) and a jury rewards (art direction + directed motion + performance).

Reference crib, through this lens: Cartier Watches & Wonders (dark rooms, gold metal, one object per room), Apple product pages (one huge claim per screen), Linear (light as the decoration), Igloo and Lusion (the camera travels, the object has inertia), Coutts and Rothschild (portrait, hairlines, space), and `C:\Portfolio` (a 3D object with a job in every shot, poster-scale type, the iris from a meaningful origin).

---

## 2. The five signature moments

Everything else on the site is quiet so that these five land. Each one is held for 1.5 to 2 s with nothing else moving, and each has a reduced-motion still that tells the same story.

### W1. "Ignition": the splash *is* the opening title (Home, first visit per session)
- **0 to 450 ms:** black frame, faint warm radial. The **C** of the monogram draws as a 2 px gold stroke (`stroke-dashoffset`, `power2.inOut`), starting at the top terminal and sweeping 300°.
- **350 to 750 ms:** the **W** draws inside it in two strokes. The wordmark "Cargado Strategies" rises under it in a word mask (Times at `--fs-d3`, letter-spacing 0.02em).
- **750 to 900 ms:** one specular sheen passes diagonally across the monogram: a 30° white-to-transparent gradient band, `translateX` only.
- **900 to 1200 ms:** the C ring scales up (transform) to about 3x the viewport and becomes the **aperture**: its inside reveals the hero, which is already painted underneath. This is a *match cut*: the globe in the hero sits exactly where the ring's centre was, so the ring seems to become the globe's horizon.
- Total ≤ 1.2 s. It is skippable (any input finishes it in 150 ms). It runs once per session (`sessionStorage`). Every later page load uses a 450 ms cross-document View Transition with the header monogram kept still (`view-transition-name: brand`), and a gold-edged iris opens from the clicked nav link.
- Reduced motion: the monogram is shown complete and fades out in 200 ms.
- Sound: a single soft chime at 900 ms, only if audio is already unlocked (it usually is not, so it is normally silent).

### W2. "One Message": the arc (Home hero, landed state)
- The globe is large (70 svh tall), right-of-centre, bleeding off the right edge by about a third. It is warm gold points on black with a soft additive halo (a pre-blurred sprite, no bloom pass).
- When the hero lands, a gold "you" node pulses once (scale 1 → 1.6 → 1, 600 ms). A single clean great-circle arc (lift ≤ 0.12R, hugging the sphere) **draws** from it to a partner node in 900 ms, and a small light bead travels along it and blooms on arrival.
- It plays **twice** (within 5 s, so it meets WCAG 2.2.2 now that the pause toggle is gone) and then rests. It re-plays once on pointer movement over the globe, never on a timer.
- Today's tangled arc tail (judge-visual B4) is replaced: at most 3 arcs ever exist, and all of them are true great-circle segments between real city vectors.

### W3. "The Strike": one message instead of five searches (Home scene 2)
- The shot lands with five search phrases stacked in ivory serif at `--fs-d2`: "Five Searches", "Ten Tabs", "Cold Calls", "Guesswork", "Waiting". A gold bar (1/12 of the line height, `scaleX` 0 → 1, transform-origin left) strikes each one in turn, every 90 ms. Each struck line drops to 30% opacity.
- Then **"One Message."** lands at `--fs-mega` (word mask rise, 500 ms), with "One" in gold italic. The three steps (Now · Within [24h] · Day [3]) fade up underneath as one quiet row.
- Total 1.6 s, played once per arrival and reversed on back-navigation. This is the Home's "Monument". It merges the old *compare* and *how it works* scenes.
- Reduced motion: the struck state and the monument are shown at once.

### W4. "The Dive": the globe becomes Canada (Home scene 5; a shorter version opens the Services finder)
- This is the signature 3D moment. On arrival, the camera **dollies in** (1.4 s, `cubic-bezier(.65,0,.35,1)`) while the globe rotates to face North America.
- The point cloud **morphs** from sphere positions to a flat projected map of Canada: a second position attribute, interpolated in the vertex shader by `uMorph` 0 → 1. The points settle on the dot-matrix map of Canada that judges rated as the second-best visual on the site.
- The Winnipeg node rings out (two ripple circles), then nine thin gold leader lines draw out to the nine category labels (desktop) or the screen fades to the 3x3 category grid (phone).
- The morph is the same draw call as the globe, so it costs nothing extra. On the Services finder, the dot map hands off to the existing engraved SVG province map with a 300 ms crossfade, because that map is the interactive one.
- Reduced motion and low tier: a static map poster (SVG) and no camera move.

### W5. "The Mark": the network folds into C·W (Story scene 4, full version; Home scene 6, 1.2 s version; every page's close mirrors it)
- The globe pulls back and **compresses** into the thick gold C ring (points migrate onto a 300° torus arc: a third position attribute, the same morph). The W draws through the sphere's wireframe in two strokes.
- "W Stands for / *Wealth.*" arrives top-left and "C Stands for / *Cargado.*" bottom-right, each as a small serif lead line plus a huge gold italic word. This is the best type on the site today, and it becomes the type pattern for the whole site (§3.1).
- On the **close** of each page, the same mark is shown still and small, embossed on the gold climax field, so the film ends where W1 began.

> Not signature moments, but the glue: (a) chapter cuts with the C-ring iris (§3.9), (b) cross-page View Transitions, (c) the gold hairline that draws around the one framed element of a scene. None of them is held or repeated as a "moment".

---

## 3. Design system v2

### 3.1 Type

**Faces and jobs (one job each):**
- **Times New Roman** (stack `"Times New Roman", Times, Tinos, serif`): headlines, monuments, pull quotes, prices, big numerals. **Only at 28 px or above** (on ink, 30 px or above). Title Case always. Italic is allowed for **one gold accent word or phrase per headline**, never more.
- **Manrope:** all reading text, list item titles (600), notices. Weight 500 on ink (light text on black needs it), 400 on bone and gold.
- **Poppins:** eyebrow, buttons, nav, chips, form labels. Nothing else.

**Scale (tokens; `--u: min(1vw, 1.5svh)` from shared.md; values in brackets are px at 1920x1080 / 1440x900 / 1366x768 / 390x844):**

```css
:root{
  --u: min(1vw, 1.5svh);                                   /* unchanged (R4 D1) */

  --fs-mega:  clamp(3.5rem,  calc(1rem + 9.5 * var(--u)), 11.5rem); /* 170/144/125/56 · ≤ 4 words, 1–2 lines */
  --fs-hero:  clamp(3rem,    calc(1rem + 6.4 * var(--u)), 8.5rem);  /* 120/102/90/48  · page H1 */
  --fs-d1:    clamp(2.25rem, calc(1rem + 4.0 * var(--u)), 5.5rem);  /*  81/70/62/36  · scene headline */
  --fs-d2:    clamp(1.875rem,calc(0.9rem + 2.4 * var(--u)), 3.5rem);/*  53/47/42/30  · working-scene headline */
  --fs-d3:    clamp(1.75rem, calc(1rem + 1.2 * var(--u)), 2.25rem); /*  36/32/30/28  · card title, tier name, price */
  --fs-quote: clamp(1.75rem, calc(1rem + 2.2 * var(--u)), 3rem);    /*  48/46/41/28  · Times italic pull quote */
  --fs-num:   clamp(2.5rem,  calc(1rem + 4.0 * var(--u)), 5.5rem);  /*  81/70/62/40  · outline numerals */
  --fs-lead:  clamp(1.125rem,calc(1rem + 0.35 * var(--u)), 1.375rem);/* 22/21/20/18 */
  --fs-body:  1.0625rem;                                  /* 17 px; 18 px from 1024 px */
  --fs-note:  1rem;                                       /* 16 px; 15 px under 760 px (R4 D8) */
  --fs-label: 0.875rem;                                   /* 14 px eyebrow; 13 px floor on phones */
  --fs-ui:    0.9375rem;                                  /* 15 px buttons, chips, form labels (R4 --fs-ui-min) */

  --lh-mega: .92; --lh-hero: .98; --lh-d: 1.04; --lh-quote: 1.15; --lh-body: 1.6;
  --tr-display: -0.018em;   /* mega and hero; -0.01em on d1; 0 on d2 and below */
  --tr-label: 0.12em;       /* eyebrow only; never wider */
}
@media (min-width:1024px){ :root{ --fs-body: 1.125rem; } }
@media (max-width:759px){
  :root{
    --fs-mega: clamp(3rem, 15vw, 4.25rem);   /* 54–59 px; longest mega word must be ≤ 9 letters */
    --fs-hero: clamp(2.75rem, 14vw, 4rem);   /* 50–55 px; "Professional," fits 320 px at 14vw */
    --fs-label: 0.8125rem;
  }
}
```

**Rules:**
- **Scale contrast is the rhythm.** On each page, about one scene in three is a *Monument* (`--fs-mega`, at most 4 words). Working scenes use `--fs-d2`. Nothing in between competes. H2s on content scenes step **down** from today's 70 to 90 px so the monuments feel like climaxes.
- **The "small line / huge word" pattern** (from the logo scene): a serif lead line at `--fs-d3` in ivory or ink, then the key phrase at mega or hero size with the accent word in gold italic (`--accent`; gold-dark `#7A5C12` on bone; ink on gold).
- **Headlines are 8 words or fewer.** Title Case past 8 words turns into noise (typography B-8). Proposed rewrites are in §4 (the copy owner confirms; no compliance meaning changes).
- **Eyebrow:** Poppins 500, 14 px, tracking 0.12em, uppercase. It is the **only** uppercase tracked string in a scene. List tags, form labels and meta lines become sentence-case Manrope 15 px.
- **Numerals:** Times, outlined (`-webkit-text-stroke: 1px var(--accent)`, transparent fill) at `--fs-num` for every step and index (how-it-works, values, roles, what-you-get, legal contents). One numeral per row, never a second tiny one.
- **Quotes:** situation quotes, founder quote, partner hooks are Times italic `--fs-quote` with hanging punctuation (`hanging-punctuation: first`, negative `text-indent` fallback).
- **Splitting:** headings split **by word only**, and the split is done at **build time** (spans in the HTML) instead of `kerning.js` + per-character runtime splitting. Each word is `white-space: nowrap` with a real space between words, which fixes the "W  for Wealth." gaps (typography B-11) and about 1 s of phone CPU (performance B6).
- `text-wrap: balance` on headings and `pretty` on paragraphs stay. Measure stays at 56 to 62 ch.

### 3.2 Spacing rhythm

R4 tokens stay (`--space-m`, `-l`, `-xl`, `-2xl`, `--gap-row`, `--scene-pad-*`, `--scene-safe-h`). Two rules are added:
- **Tight inside, wide between.** Inside a group (eyebrow → headline → lead) gaps are `--space-m` or smaller. Between groups (head → content → action) gaps are `--space-xl`. A monument's only neighbour is `--space-2xl` of black.
- **Anchors, not centres.** Text blocks anchor to the **lower-left third** of the scene box (film "title safe"): `align-self: end` with `padding-bottom: var(--space-2xl)`. The eye learns one position per archetype. Only Monuments and the Mark are centred.

New tokens:
```css
:root{
  --beat-pad: clamp(24px, 10svh, 160px);           /* black above/below a monument */
  --frame-inset: clamp(16px, min(3vw, 3svh), 48px); /* the hairline frame around the one framed element */
}
```

### 3.3 Grid and scene archetypes

- 12 columns, `--max-w: 1320px`, gutters `--page-pad: clamp(20px, 5vw, 72px)`, column gap `clamp(16px, 2vw, 32px)`.
- Phones: 4 columns with a 20 px gutter (16 px at 360).
- **Five archetypes.** Every scene is exactly one of them, and **no two neighbours share one** (except Paper inside Legal).

| code | archetype | composition (desktop) | phone |
|---|---|---|---|
| **M** | **Monument** | One claim at `--fs-mega`, centred or lower-left, plus one link or one quiet row. ≥ 60% of the screen is black or field. | Claim in the middle third, link in the thumb zone. |
| **S** | **Stage** | The actor (globe, map, mark, portrait) owns 7 columns and bleeds off one edge by about a third. Text owns 5 columns, bottom-anchored. | Actor in the top 40%, centred at 70 vw; text below; CTA in the bottom 25%. |
| **D** | **Doors** | 3 (or 4) tall panels side by side, split by gold hairlines. Each holds one numeral, one title, one line and one arrow. The hovered or focused door widens (flex 1 → 1.35, transform-free via `flex-grow` on a 250 ms transition; it is the one sanctioned layout transition, on a few elements). | A tab row with swipe (shared.md `createTabs({swipe:true})`), one door per page, dots below. |
| **I** | **Index** | Full-width hairline rows: outline numeral · Times or Manrope title · one meta line · arrow. Row height 64–88 px. On hover the row floods with gold at 8% and the arrow nudges 6 px. | The same rows at 56 px, paged by `createPager` when more than 5. |
| **P** | **Paper** | One centred column, 560–720 px wide, on bone. It is the only archetype with a framed surface: a single sheet with a gold hairline that draws on arrival. Forms (as steppers) and legal reading live here. | Full width, sheet border removed, hairline kept at top. |

The old "eyebrow + headline left, list or card right" template (judge-layout B5: about 30 of 42 scenes) survives only as **S** without the actor, and never on more than 40% of a page's scenes.

### 3.4 Colour roles and gold usage rules

Tokens stay (PLAN §1): black `#0B0B0C`, charcoal `#1A1A1C`, gold `#D4AF37`, gold-deep `#B8913A`, gold-dark `#7A5C12`, champagne `#E9DCB8`, ivory `#F5F0E6`, ink text `#F3ECDD`. New role tokens:

```css
:root{
  --key-light: radial-gradient(60% 50% at var(--kx,30%) var(--ky,60%), rgb(212 175 55 / .09), transparent 70%);
  --hair: rgb(212 175 55 / .22);          /* 1 px rules on ink */
  --hair-bone: rgb(11 11 12 / .14);       /* 1 px rules on bone */
  --glow: 0 0 0 1px rgb(212 175 55 / .35), 0 8px 32px -8px rgb(212 175 55 / .35); /* primary button only, static */
  --ink-muted: #C9BFAD;                   /* ≥ 9:1 on black; notes only, never leads */
  --bone-muted: #4A4438;                  /* ≥ 8:1 on ivory */
  --on-gold: #0B0B0C;                     /* full strength; never 55–70% grey on gold */
}
```

**Field budget per page (chapters, not strobes; fixes motion B3 and visual B5):**
- **Ink about 65–70%** of scenes: the stage.
- **Bone about 20–30%:** the "daylight" chapter (founder, offers, forms, legal).
- **Gold field: once per page** (twice at most on Home), always as the **climax** (the close on most pages, the founding offer on Partners). Never edge-to-edge flat mustard: see §3.5.
- Fields change **only between chapters** (2 or 3 times per page), and that is the only time the iris fires. Inside a chapter the field holds and only content cuts.

**Gold usage rules (gold is light, not paint):**
1. On ink, gold may cover **≤ 8% of the screen area**, excluding the actor. Typical: one primary button, one accent word, hairlines and numerals.
2. **One gold accent word per headline.** Gold never sets body text, notes or labels longer than the eyebrow.
3. On bone, gold text is always gold-dark `#7A5C12`; gold-on-bone is used for hairlines and numerals only.
4. On a gold field, everything is ink at full strength. No gold-on-gold, no muted greys.
5. Only one gold *glow* per screen: the primary button's static `--glow`.
6. The key light (`--key-light`) sits behind every scene's main headline on ink, positioned per scene via `--kx/--ky`. It is static (no animated `filter` or shadow).

### 3.5 Surfaces and textures
- **Ink:** `#0B0B0C` + the warm radial `#1A1712` (today) + the per-scene key light. Optional fog: the globe is drawn with exponential fog so its far side falls into black (one uniform, zero bytes).
- **Bone:** `#F5F0E6` with a static paper-fibre noise tile (256 px PNG, 4% opacity, normal blend). No stars, no grain motion.
- **Gold (the climax plate):** the static gradient `#B8913A → #D9B862` (PLAN rule) + a static **brushed** anisotropic noise tile (horizontal streaks, 256x64 px, 6%) + **one sheen pass** on arrival (a 25° low-opacity white band translated across once in 1.1 s, transform only) + a centre-weighted vignette so the edges go deeper bronze. Ink type at full weight. Tested side by side with today's flat field before sign-off.
- **Stars:** ink scenes only (opacity 0 on bone and gold, visual B13). No velocity streaks over 8 px (motion B7). Count halved on scenes with long text. They move only during transitions and with the cursor push (desktop); they sleep while the visitor reads.
- **Grain:** a static noise PNG at 0.05–0.07 opacity, **no blend mode and no animation** on phones and the low tier. On desktop tier A, a `steps(6)` jitter of a tile no larger than the viewport is allowed. Today's `inset:-50%` overlay layer goes (performance B3).
- **Frames:** no offset "shadow plate" second borders anywhere except the Legal paper stack (visual B11, layout B8). At most **one framed element per screen**: the form sheet, the offer label card or the legal document. Its frame is a 1 px gold hairline that **draws** (SVG `stroke-dashoffset`, 600 ms) when the shot lands.
- **Header:** transparent over ink with a soft top scrim (black 45% → 0, 120 px); over bone it gets an ivory 70% backdrop with `backdrop-filter: blur(8px)` (desktop tier A only, solid ivory elsewhere). Its colour swaps once at the iris midpoint, never blended (motion I9).

### 3.6 Imagery and illustration (no photos yet)
The rule from CR16: **no invented people, partners, reviews or places presented as real endorsements.** The image system is therefore built in three layers, and the site looks finished with only the first.

1. **Gold line engraving (available now; the house illustration style).** Everything drawn is 1–1.5 px gold line on black (or gold-dark on bone), like an engraved banknote plate: the globe, the dot map, the engraved province map, the C·W mark, the strike bars, the 9 category icons, and an engraved **maple-leaf-free** Canada outline. Never filled shapes, never gradients inside drawings.
2. **Typographic portrait (until the founder's photo exists).** An empty frame with a globe in it is never shown again (visual B15, content B1). The founder slot is set as type: `[Founder name]` at `--fs-hero` in italic, the pull quote at `--fs-quote`, a hairline signature line with a small `[Signature]` caption, and the C ring passing behind the name at 30% opacity.
3. **Founder portrait (ask the client now; biggest trust and wow gain).** Brief for the shoot: a 4:5 vertical, black backdrop, a warm gold rim light from camera left, chest up, looking slightly off-camera, wearing dark solids. Treatment: duotone black → champagne done **at build time** (no CSS filter at run time), fine grain baked in, the C ring drawn as an SVG arc passing *behind* the shoulder (a cut-out mask layer). Used on Home 4 and Story 2, and as a 40 px avatar beside the "Message [Name]" button on the closes.
4. **Places (optional, later).** Licensed night aerials of Canadian cities or prairie roads at dusk, duotone, at 20–30% under the ink field on at most 2 scenes site-wide (Partners hero, Story where-it-began). They are places, not endorsements, so they are allowed. They are lazy-loaded, AVIF, ≤ 90 KB each.
5. **Video (FR24).** No scene is spent on an absence. When the founder video exists, it opens as a dialog from a "Watch 1 Min" text link in the Home hero; its poster is a W5 still. No autoplay with sound, and captions stay.

### 3.7 Iconography
- **9 category icons** (insurance, business strategy, outsourcing, mortgage, real estate, lawyer, tax/accounting, financial planning, manufacturing or the final category list from `config.js`), drawn on a 24 px grid with a 1.25 px gold stroke, round caps, no fills. They are used on Home 5, the Services categories index and the finder select.
- **6 UI glyphs:** arrow, check, WhatsApp, phone, mail, close. Same stroke.
- Nothing else gets an icon. No clip art, no emoji, no badges ("verified" stays banned, CR02).

### 3.8 Buttons, links, forms
**CTA vocabulary (one set site-wide; fixes UX B4):**
| role | label | look |
|---|---|---|
| Network intro (Home only) | **Get My Introduction** | primary gold |
| General contact | **Message Us on WhatsApp** (later "Message [Name]") | primary gold |
| Founder offers | **Ask About This on WhatsApp** (prefilled with the offer name) | primary gold |
| Form | **Send an Inquiry** | text link → stepper |
| Partners | **Apply to Join** (tier preselected via the link) | primary gold |
| Navigation inside a scene | "How It Works", "Read Our Story", "See All Services" | text link with arrow |

- **One primary per scene, plus at most one text link** (visual 4.7, UX 4.3). A WhatsApp primary always carries one 15/16 px line under it: "Opens WhatsApp with your message written. Nothing is sent until you tap send." (the compliance sentence lives here, once per scene that opens WhatsApp, instead of 12 scattered copies).
- **Primary button:** gold `#D4AF37` fill, ink text, Poppins 500 `--fs-ui` Title Case, height `--ctl-h` (48–52 px), radius 2 px (sharp, not pill), static `--glow`. Hover: one sheen sweep (700 ms) and a magnetic pull capped at 6 px (desktop fine pointer only). Pressed: scale .98. On a gold field it inverts to ink with gold text.
- **Text link:** ivory or ink, with the Round 3 underline that scales in from left to right (300 ms). Arrow nudges 4 px. **No letter-roll** anywhere except the hero primary (motion I8).
- **Chips:** 44 px tall, 1 px hairline, sentence case Poppins 15 px; selected = gold fill.
- **Forms:** labels **above** fields in sentence case, Poppins 500 15 px, no tracking; inputs 52 px tall with 18 px Manrope text; on ink a charcoal `#1A1A1C` fill with a 1 px `--hair` border, on bone a white fill with a 1 px ink 30% border (≥ 3:1, WCAG 1.4.11). Focus: 2 px gold ring at 2 px offset (gold-dark on bone). Errors: text + icon under the field, on blur only. **No tilt on any form or panel** (motion I8). Long forms are steppers of ≤ 4 fields per step with "Step 1 of 3 · About You" in the step heading (shared.md §6.3 a11y model). Each stepper keeps an always-visible "Rather talk? Message us on WhatsApp" text link.
- **Placeholders (`.ph`), quiet by default; every word kept:** no fill; current text colour; `text-decoration: underline dotted 1px` in gold (gold-dark on bone) at 70%; same size as the surrounding sentence, never larger. `?review=1` (or `html.ph-loud`) restores today's tinted boxes for the founder's review pass. `[n]` stats sit at body size in a single quiet line, never as 27–40 px gold boxes in the hero. `[Signature]` is a hairline line with a caption, not display type. `[$ per month]` prices are Times `--fs-d3` with the dotted underline, so the tier card survives when real prices arrive.

### 3.9 Motion principles and timings
**The principle: "Cut. Land. Hold."** Round 4's snap decides *which* scene. Once it fires, the transition is **played on a clock** (not scrubbed by scroll position), it overlaps (a J-cut, never an empty frame), and the shot lands fully composed. After that **no text moves** until the next gesture (audience rule 11).

| event | duration | choreography | ease |
|---|---|---|---|
| **Cut** (same field) | 700 ms | 0–250 ms outgoing content leaves as one group (y −24 px, opacity 0). 180–700 ms incoming: eyebrow → headline words (50 ms stagger, mask rise) → body → CTA. | out `power2.in`, in `power3.out` |
| **Chapter cut** (field change) | 950 ms | 0–300 ms out as one group. 100–750 ms the C-ring iris (below). 300–950 ms incoming arrives *during* the iris. The header swaps colour at 50%. | iris `expo.inOut` |
| Input lock | until 70% of the transition | then a new gesture can queue the next cut | |
| **Actor pose** (globe) | 1.2–1.4 s | camera dolly/orbit to the scene's pose; rotation lerps with k = 0.08 (inertia) | `cubic-bezier(.65,0,.35,1)` |
| Monument land | 500 ms | words rise from masks; the accent word lands last, +80 ms | `power3.out` |
| Hairline frame draw | 600 ms | starts at 40% of the cut | `power2.inOut` |
| Hover (rows, doors) | 200–250 ms | colour flood + arrow nudge | `power2.out` |
| Button sheen | 700 ms | once per hover | linear |
| Splash (W1) | ≤ 1.2 s | first page of the session only | |
| Page change | 450 ms | cross-document View Transition, brand stays put | |
| Reduced motion | 200 ms | crossfade only; actor static; no splash animation; native scroll-snap | linear |

- **The C-ring iris** replaces the plain circle: the incoming field is revealed by a thick ring that sweeps 300° from the scene's meaningful origin (the CTA just pressed, the monogram, the globe pin, the full stop of the headline; `data-iris`). Built as a scaled pre-rendered disc and a rotating conic mask on one layer, transform and mask only, alive only for the 950 ms of the cut.
- **Deleted motion:** the decode/scramble on eyebrows (motion B2), per-letter exits, letter-roll on nav and secondary buttons, `film-alive.js` heading drift, 3D tilt on panels and forms, scrubbed half-states (motion B4), star velocity streaks, and the infinite grain animation on phones.
- **Kept, toned down:** tilt ≤ 4° on small cards (tier cards, doors) on fine pointers only; cursor ring (decorative, hidden on touch); stars pushed by the pointer within 140 px.
- **Back navigation** plays the same timeline reversed. Deep links land on the composed state with no transition.

### 3.10 Sound
Round 4 keeps SFX on and removes the toggle, so the palette must be one nobody wants to mute (motion I6):
- **Kept:** one soft "breath" per snap (a low sine at ~0.04 peak with a 120 ms attack, pitched a fifth lower on chapter cuts); a click blip at 0.06; a two-note success chime on form submit; the W1 chime only if already unlocked.
- **Removed:** the scroll tick, hover ticks, the whoosh *and* tone pair per scene.
- Master gain 0.25 → 0.15. `prefers-reduced-motion` is treated as "reduced audio": everything silent except the success chime.
- The `sfx.js` progress hook must not read `window.scrollY` (performance B4); it listens to the snap's "cut" event instead.
- **Owner question (not built here):** a quiet "Sound off" text control in the footer and in the phone menu (not the header), persisted in `localStorage`. Two judges rate the lack of a mute as high; this is the lightest answer that keeps R4's header clean.

### 3.11 Chrome (after the R4 removals)
- **Desktop header:** monogram + wordmark · Home, Services, Our Story, Become a Partner · Facebook icon (FR17) · one **WhatsApp** primary. That is 6 marks.
- **Phone header:** monogram · a 44 px gold WhatsApp icon button · "Menu". This answers R4 open question D23/C2: it lives in the header, so it is not the removed floating button or phone bar. The menu lists the pages plus WhatsApp, call and email (UX B8/B9).
- **Position cue (audience rule 14):** a hero-only "Next" text button (with a 1 px travelling dot, the Portfolio's `#cue`), plus, on desktop only, a column of 5–7 small chapter dots at the right edge (names on hover and focus, `aria-current`, clickable). Dots are not a counter or a dash, but they are still chrome: the owner may veto them, in which case only the hero "Next" stays.

---

## 4. Scene by scene

Legend: field · archetype (§3.3) · actor pose. Sketches are desktop 16:9; phone notes follow. "→ overlay" marks content moved into a dialog, stepper, pager or tabs (R4 toolkit).

### 4.1 Home (`index.html`): 12 scenes → 7

Chapters: **I. The Promise** (ink: 1–2) · **II. The People** (bone: 3–4) · **III. The Network** (ink: 5–6) · **Climax** (gold: 7). Three iris cuts in total.

**H1 · Hero "The Right Professional, Near You."** · ink · S · globe large right, W2
```
┌──────────────────────────────────────────────────────────────┐
│ (W) Cargado Strategies      Home Services Story Partner  f [WhatsApp]
│                                                    .  ·  ·  ·  .
│                                               ·  ·  ·  ·  ·  ·  ·│
│ FREE INTRODUCTIONS · ACROSS CANADA         ·  ·  you●~~~~~●  ·  ·│
│ The Right Professional,                     ·  ·  ·  ·  ·  ·  · │
│ Near You.  (gold italic)                      ·  ·  ·  ·  ·  ·   │
│ Insurance, strategy and outsourcing from our founder, and free   │
│ introductions to independent professionals across Canada.        │
│ [ Get My Introduction → ]   How It Works ↓                       │
│ Opens WhatsApp with your message written. Nothing is sent…       │
└──────────────────────────────────────────────────────────────┘
```
- On screen: eyebrow, H1 (6 words), one 25-word lead, one primary, one text link, one compliance line. **About 7 elements instead of about 20** (layout B3).
- → overlay: **the intro form** (need chips → city → Open WhatsApp) becomes a 2-step **sheet** (`ui-dialog`), opened by the primary. It keeps "1 · What do you need?", "2 · Your city", "We ask for your city only so we can introduce you to someone close to you", and the send note.
- Moved: the ticks (no fee · no obligation · licence shown where one applies) become the sheet's header line. The `[n]` proof strip moves to H2 as one quiet line.
- Phone: globe in the top 38%, centred at 70 vw; H1 at `--fs-hero` (50–55 px) in 3 lines; lead cut to 1 line; primary full width in the thumb zone; "How It Works" above it as a text link. The CTA is always on the first screen (layout B3, mobile B3).

**H2 · "One Message." (W3)** · ink · M · globe recedes to a faint horizon at the bottom edge
```
┌──────────────────────────────────────────────────────────────┐
│        F̶i̶v̶e̶ ̶S̶e̶a̶r̶c̶h̶e̶s̶   T̶e̶n̶ ̶T̶a̶b̶s̶   C̶o̶l̶d̶ ̶C̶a̶l̶l̶s̶   G̶u̶e̶s̶s̶w̶o̶r̶k̶       │
│                                                              │
│                 One Message.   (mega, "One" gold italic)     │
│                                                              │
│   ① Now · you send it   ② Within [24h] · we introduce   ③ Day [3] · we check in │
│   [n] introductions · [n] partners · [n] cities · ★ [rating] on Facebook │
└──────────────────────────────────────────────────────────────┘
```
- Merges *compare* + *how it works* (the 3 steps no longer repeat across 4 places; content B3).
- Phone: struck phrases in a 2x2 block, the monument in 2 lines, the steps as 3 short rows with outline numerals.

**H3 · "Sounds Like You?"** · bone · I (rows of quotes)
```
┌──────────────────────────────────────────────────────────────┐
│ START WITH YOUR SITUATION                                    │
│ Sounds Like You?                                             │
│ ──────────────────────────────────────────────────────────── │
│ 01  “We're buying our first home.”     Mortgage, real estate, lawyer   → │
│ 02  “My business is busy but money is tight.”  Strategy, tax          → │
│ 03  “If something happens to me, is my family OK?”  Insurance, wills  → │
│ 04  “I'm doing everything myself.”     Outsourcing                     → │
│                                              See All Services →│
└──────────────────────────────────────────────────────────────┘
```
- The visitor's own words become Times italic `--fs-quote`, the most beautiful text on the page (typography B-6). Tags are sentence-case Manrope.
- Phone: 4 rows at 56–64 px with the quote at 24–26 px (Times italic is ≥ 24 px only here, as a quote, checked for legibility on bone).

**H4 · "From Our Founder"** · bone · D (portrait + three doors)
```
┌──────────────────────────────────────────────────────────────┐
│ ┌───────────┐ │ 01            │ 02             │ 03            │
│ │ portrait  │ │ Insurance     │ The 30-Day     │ A Back-Office │
│ │ or [Found-│ │               │ Cash-Flow      │ Team          │
│ │ er name]  │ │ one line      │ Clean-Up       │ one line      │
│ │ C ring    │ │ Her own · lic │ Strategy and   │ Her own       │
│ └───────────┘ │ [licence #]   │ coaching only  │               │
│ “[One line…]” │ Ask →         │ Ask →          │ Ask →         │
└──────────────────────────────────────────────────────────────┘
```
- Headline (eyebrow level): "From Our Founder, [Founder name]" — fixes "Three Things She Does Herself." having no antecedent (content B7).
- Each door keeps its required label line ("Her own business", company/licence/regulator `[brackets]`, "strategy and coaching only" on the strategy door). Doors link to `services.html#ours-*`.
- → overlay: the "[Real client quote…]" testimonials are removed from this screen until real; they move into Story 2's quote slot (they stay in the DOM there as placeholders).
- Phone: portrait or typographic portrait as a 30% band at the top, the three doors as swipe tabs.

**H5 · "Across Canada" (W4, The Dive)** · ink · S · globe → dot map
```
┌──────────────────────────────────────────────────────────────┐
│ ACROSS CANADA                     · · · · · · · · · ·        │
│ Someone Good,                   · · · · · · · · · · · · ·    │
│ Close to You.                  · · · · · · ◎ · · · · · ·     │
│ ⌂ Mortgage  ⚖ Lawyer  ⌂ Real estate     · · · · · · · ·      │
│ ☂ Insurance  ✓ Tax   ▤ Outsourcing   …  (9, each → services.html#slug) │
│ [ Tell Us What You Need → ]                                  │
│ Partners are independent businesses. Cargado may receive a commission. │
└──────────────────────────────────────────────────────────────┘
```
- The 9 category icons keep FR05 deep links (`services.html#legal` etc.). This replaces the old 9-tile services grid, the finder teaser and the partner-network scene.
- While `PARTNERS = []` the CTA is the **concierge** request (UX B2): it opens the same intro sheet with the need preselected. When partners exist, a config flag switches it to "Find a Partner Near You →".
- Phone: map in the top 40%, a 3x3 icon grid (each ≥ 44 px), CTA, one notice line.

**H6 · "The Mark" (W5, short)** · ink · S/M · globe → C·W
```
┌──────────────────────────────────────────────────────────────┐
│   W Stands for                                               │
│   Wealth.            ╭──────╮                                 │
│                      │  W   │  (globe folded into the C ring) │
│                      ╰──────                                  │
│                                           C Stands for       │
│                                           Cargado.           │
│        Read Our Story →          For Professionals: Become a Partner → │
└──────────────────────────────────────────────────────────────┘
```
- Two text links, no primary (story + partners doors merged; replaces old H9 + H10).

**H7 · Close (credits)** · **gold climax** · M + compact footer · mark embossed small
```
┌──────────────────────────────────────────────────────────────┐
│                        (W)  ← ink emboss, mirrors the splash │
│         One Message. The Right Person. Close to You.         │
│      [ Message Us on WhatsApp ]   Straight Answers (FAQ) →   │
│ ──────────────────────────────────────────────────────────── │
│ Services   Company        Contact                 Follow     │
│ …          Story·Partner  +1 (204) 869 2508·email  Facebook  │
│ Partners are independent… commission… · Legal · © [Year]     │
└──────────────────────────────────────────────────────────────┘
```
- → overlay: the **FAQ** becomes a "Straight Answers" dialog (all four Q&As verbatim), and stays in full on Legal Q&A.
- Footer copy at `--fs-note` (16/15 px), ink on gold at full strength. `tel:` and email added (email is a `[bracket]` until supplied).

**Removed from Home:** video (until it exists; then a hero link + dialog), compare (merged into H2), how-it-works (H2), services grid (H5), finder teaser (H5), story teaser + partner CTA (H6), FAQ (dialog). Twelve gestures become seven.

### 4.2 Services (`services.html`): 8 scenes → 9 (two splits, nothing clipped)

Chapters: **I** ink (1) · **II "Her Own Three"** bone (2–5) · **III "The Network"** ink (6–8) · **Climax** gold (9).

**S1 · "What Do You Need Help With?"** · ink · I
```
│ SERVICES                                                     │
│ What Do You Need                                             │
│ Help With?                                                   │
│ 01  Insurance                    Our founder's own business  → │
│ 02  Business strategy            Our founder's own business  → │
│ 03  Outsourcing                  Our founder's own business  → │
│ 04  Everything else (9 services) Independent partners        → │
│ Ours are run by our founder. Partners are independent businesses. │
```
- The leaked spec sentence "Each section says whether it's ours or a partner's" becomes the plain last line above (content B4). The R4 jump rail is these four rows.

**S2 · Insurance** · bone · S (offer label card as the actor)
```
│ INSURANCE · OUR FOUNDER'S OWN       ┌─ hairline draws ──────┐ │
│ Is Your Family                      │ [Product / review]    │ │
│ Covered?                            │ Included: 3 lines ✓   │ │
│ 2-sentence promise                  │ Licence [licence #]   │ │
│                                     │ [regulator]           │ │
│                                     │ [ Ask About This → ]  │ │
```
- Max 2 actions (judge-visual 4.7: today 3–4).

**S3 · Strategy: "The 30-Day Cash-Flow Clean-Up"** · bone · M
```
│                   BUSINESS STRATEGY · OUR FOUNDER'S OWN      │
│              The 30-Day (gold italic)                        │
│              Cash-Flow Clean-Up.                             │
│      [Founder] takes [4] new businesses a month · [2] spots in [month] │
│           [ Ask About This on WhatsApp ]                     │
│   Strategy and coaching only, not licensed accounting, tax or investment advice. │
```
**S4 · Strategy: "What You Get"** · bone · I
```
│ What You Get                                                 │
│ 01  [deliverable]                                            │
│ 02  [deliverable]        (5 rows, outline numerals, no [value] column) │
│ …                                                            │
│ [we keep working…] promise line · Send an Inquiry →          │
```
- Splits the old 170-word strategy scene (content, layout 4.9).

**S5 · Outsourcing "A Back-Office Team"** · bone · S
- Headline left; the four `[Role 1…4] · [what this role takes off your plate]` as Index rows right; one primary. Phone: rows paged 2 + 2.

**S6 · Finder "Close to You" (W4 short)** · ink · S · globe → engraved province map
```
│ FIND A PARTNER                       ╱‾‾╲__╱‾‾‾╲___          │
│ Close to You.                       │  engraved province map │
│ [Category ▾] [City or postal code ]  ╲___╱‾‾╲__╱             │
│ Results (3 that fit) · Next 3 →                              │
│ Sorted by distance only. Not a recommendation. Independent… commission. │
```
- While `PARTNERS = []`: a concierge state ("No partner listed near you yet. Tell us the service and your city and we'll find someone." + Send an Inquiry). Placeholder cards "Partner spot available" stay as required by CR16 where results would be.
- → overlay: partner profile = dialog; phone: Map | Results tabs (R4).

**S7 · Categories** · ink · I + in-scene detail panel
- 9 rows with icons; selecting one opens an in-scene panel (desktop right half, phone dialog) with description, types, partner list or placeholder cards, and the notice. `#slug` deep links open it.

**S8 · Inquiry** · ink · P (stepper on a dark sheet)
```
│                  Send an Inquiry                             │
│        ┌──────────── Step 1 of 3 · What You Need ───────────┐ │
│        │ Service ▾        City                              │ │
│        │ [ Back ]                       [ Next → ]          │ │
│        └────────────────────────────────────────────────────┘ │
│   Rather talk? Message us on WhatsApp · commission notice    │
```
- Steps: need + city → details → name, contact, consent (+ honeypot). Success state (FR08) in the sheet.

**S9 · Close** · gold climax · M + footer · the province map engraved in ink at 12%.

### 4.3 Our Story (`story.html`): 7 scenes → 7 (re-cut around the founder)

Chapters: **I** ink (1) · **II "Her"** bone (2–3) · **III "The Mark"** ink (4–6) · **Climax** gold (7).

**T1 · Title** · ink · M · globe distant, centred behind
```
│                         OUR STORY                            │
│                  Built to Serve,                             │
│              One Connection at a Time.  ("One Connection" gold italic) │
│                         Next ↓                               │
```
- The draft note moves to `?review=1` *and* stays in the DOM as a `.ph` line at the bottom (placeholders must survive). Removes "Scroll to Read".

**T2 · The Founder** · bone · S (portrait actor)
```
│ ┌──────────────┐   [Founder name]   (hero italic)            │
│ │  duotone 4:5 │   “[One or two sentences about the founder's │
│ │  portrait or │    background…]”   (quote, Times italic)    │
│ │  type portrait   ─────────────  [Signature]                │
│ └──────────────┘   Message [Name] →                          │
```
**T3 · "One Place. Not Five."** · bone · M
- Mega line + a 2-line placeholder paragraph ("[How it began…]"). Replaces the 15-word heading "People Should Not Have to Search in Five Places…" (copy owner confirms).

**T4 · The Mark (W5, full)** · ink · S/M
- The full fold of globe → C ring → W; "W Stands for *Wealth.*" / "C Stands for *Cargado.*"; "[How the logo came about, in the founder's words.]" as a quiet line; "Mark 11:24" as a small reference label with **no** rule before it (R4).

**T5 · Values** · ink · D
```
│ │ 01             │ 02             │ 03                     │ │
│ │ Integrity.     │ Service.       │ Responsible Growth.    │ │
│ │ one line       │ one line       │ one line               │ │
```
- Phone: swipe tabs. "[Optional… one sentence on faith.]" stays as a placeholder line under the values.

**T6 · "A Network of Independent Partners."** · ink · S · globe pulls back to a constellation
- Independence + commission notice in context (one line). Text link "Tell Us What You Need" (concierge, replaces "Find a Partner Near You").

**T7 · "Let's Talk." Close** · gold climax · M + footer · avatar beside "Message Us on WhatsApp".

### 4.4 Become a Partner (`partners.html`): 8 scenes → 6

Chapters: **I** ink (1) · **II** bone (2) · **III** ink (3) · **Climax** gold (4) · **IV** bone (5) · ink credits (6).

**P1 · Hero** · ink · S · globe, one new node lights up ("you") and links to 3 neighbours
```
│ FOR PROFESSIONALS                        · · ·  ·  ·         │
│ Clients Near You,                       · · ✦ new node · ·   │
│ Already Asking.  (gold italic)            · · · · · ·        │
│ one line: who it's for                                       │
│ [ Apply to Join → ]   How You Pay ↓                          │
```
**P2 · "Pay on Clients, Not on Clicks."** · bone · D
```
│ Pay on Clients, Not on Clicks.  ("Clients" gold-dark italic) │
│ │ 01 Someone Asks  │ 02 We Introduce  │ 03 You Pay on Success │ │
│ No promise of referrals, outcomes or endorsement. Commission notice. │
```
- Merges *how* + *arrangement* (layout B10 empty halves gone).

**P3 · Tiers** · ink · D (three cards, ≤ 4° tilt on fine pointers)
- Community / Growth / Premier, names at `--fs-d3`, `[$ per month]` in Times with dotted underline, ≤ 4 lines each, **one** "Apply to Join" under the set (tier chosen in step 1 of the stepper). Phone: swipe tabs.

**P4 · Founding Offer** · **gold climax** · M
```
│                    FOUNDING PARTNERS                         │
│           The First [2] Partners                             │
│           per Service, per City.                             │
│   [City] · [service]: [n] of [2] open [live count]           │
│   We ask: a licence · quick replies · our code of conduct    │
```
- Merges *founding* + *what we ask* (ask becomes one line here and the stepper's step-1 intro).

**P5 · Apply** · bone · P (stepper)
- Step 1 Business (name, entity, category, tier) → Step 2 Licence & Area (licence #, issuing body, service area) → Step 3 References & Consent (references, Code of Conduct checkbox). ≤ 4 fields per step. Partners' existing "WhatsApp opened…" confirmation is kept.

**P6 · Close** · ink · M + footer · the new node from P1 joins the network (W5 still at the end).

### 4.5 Legal (`legal.html`): 7 scenes, "quiet mode"

Legal is the calm page by design (motion, performance judges): **one field (bone) throughout, no iris, no globe, no WebGL loaded, no stars, no splash, no SFX except clicks.** It still obeys R4 (one screen per scene, one gesture = one scene, R4 paged reader).

**L1 · Contents** · bone · I
```
│ [DRAFT · To be reviewed by a lawyer in Canada before launch] (gold pill in the header bar) │
│ Legal                                                        │
│ 01  Professional Disclosure        5 clauses →               │
│ 02  Privacy Policy                 [n] clauses →             │
│ 03  Terms of Use                   …                         │
│ 04  Partner Code of Conduct        …                         │
│ 05  Questions and Answers          …                         │
```
- The draft banner merges into the header as a gold-dark pill, ≥ 13 px (it was 10–12 px; it is compliance, so it is raised, not shrunk).

**L2–L6 · Reader pages** · bone · P (the paper stack is kept: it is the one place the offset sheet means paper)
```
│  02 (outline)   Privacy Policy                               │
│  ┌──────────────────────────────────────────┐                │
│  │ clause title (Manrope 600 20)            │╲               │
│  │ body 18/1.7, 62ch …                       │ ╲ sheets      │
│  │ Page 1 of 3 · ← Previous   Next →         │                │
│  └──────────────────────────────────────────┘                │
```
- `createPagedReader` from R4. Q&A (L6) holds the full FAQ (same copy as the Home dialog, one title).

**L7 · Close** · bone · compact footer with the WhatsApp CTA.

---

## 5. What to delete or merge (de-clutter list)

**Delete (decided in R4, confirmed here):** HUD counter and corners, floating WhatsApp, phone bar, sound and pause toggles, decorative dashes.

**Delete (new in this direction):**
1. The decode/scramble effect, letter-roll on nav/secondary buttons, `film-alive.js` heading drift, per-character splitting and `kerning.js` at run time.
2. 3D tilt on forms, panels, the hero intro card and offer blocks.
3. Offset double "shadow plate" borders (except Legal), boxed notice callouts under every CTA, nested frames.
4. The globe in "parked" corner poses (Home 03, 07, 11; Services 02, 04; Story 02, 05; Partners 03, 04, 06; Legal all). The globe appears in **≤ 1 scene in 3**, on phones only in hero, network, mark and close.
5. The Home video scene (until the video exists), the Home FAQ scene (→ dialog), and the duplicate close copy (each close gets its own image).
6. Gold-boxed `.ph` styling by default (→ dotted underline; `?review=1` restores it). The `[n]` stat strip in the hero (→ one quiet line in H2).
7. Star velocity streaks; stars and grain on bone/gold fields; the animated full-screen blended grain on phones.
8. Repeated boilerplate: "Nothing is sent until you tap send" appears once per scene that opens WhatsApp (not 12 times); commission notice once per scene that shows partner info, plus the footer; the 3-step strip once (Home H2) plus inside the steppers' final step.
9. Internal language in public copy: "The rail does the disclosure…", "named as hers and shown separately…", "One minute · captions included when it arrives" (meaning kept, wording rewritten as plain promises).

**Merge:**
| from | into |
|---|---|
| Home compare + how-it-works | H2 "One Message." |
| Home situations | H3 (kept, restyled) |
| Home founder + services grid | H4 doors + H5 category icons |
| Home find + partners (network) | H5 The Dive |
| Home story teaser + partner CTA | H6 The Mark |
| Services strategy (170 words) | S3 offer + S4 what you get (split) |
| Story beginning + network | T3 + T6 (re-cut, shorter headings) |
| Partners how + arrangement | P2 |
| Partners founding + ask | P4 |

Scene count: **Home 12 → 7, Services 8 → 9, Story 7 → 7, Partners 8 → 6, Legal 7 → 7.** Total gestures across the site: 42 → 36, and Home (the page most people see) almost halves.

---

## 6. Performance plan (target: Lighthouse mobile ≥ 90 on every page)

**Budgets per page (mobile, Moto G Power / Slow 4G profile):** LCP ≤ 1.8 s · TBT ≤ 150 ms · CLS ≤ 0.02 · INP ≤ 150 ms · JS ≤ 90 KB gz (Legal ≤ 35 KB) · DOM ≤ 900 nodes · composited layers < 30 · 55–60 fps during cuts at 4x CPU · zero GPU work while a scene holds.

1. **Splash off the critical path.** W1 is inline SVG + CSS, plays once per session, ≤ 1.2 s, and the hero is painted underneath it (LCP is the hero H1, which is HTML text in a system font). Later pages: View Transitions (zero JS). (performance B1, motion B6)
2. **Replace three.js with a raw WebGL2 globe module (~8–12 KB gz).** One `POINTS` draw (Fibonacci sphere, round sprites from `gl_PointCoord`), one `LINES` draw (arcs + icosahedron edges), three position attributes (sphere, Canada map, C-ring) blended by `uMorph`/`uMark` uniforms, idle sway in the vertex shader, fog in the fragment shader. Removes 120 KB gz and the 250–500 ms parse task (performance B5, fast-webgl #3). Interim fallback if the rewrite slips: keep three.js but load it on first gesture or `requestIdleCallback` (4 s timeout), never on phones' first view.
3. **Render on demand.** The globe and stars render only during cuts and actor poses (about 1–1.4 s per gesture) and for W2's two pulses. They stop 6 s after the last input and wake on input. One rAF loop for everything (`gsap.ticker`).
4. **Device tiers** (`html[data-tier]`, fast-webgl #4): any `(pointer: coarse)` device whose shortest side is ≤ 600 px is tier B (WebGL DPR ≤ 1.25, no antialias, 520 points, ≤ 110 stars at DPR 1, static grain). Tier C (Save-Data, `deviceMemory` ≤ 2, or p75 frame time > 22 ms over the first 90 frames) gets SVG posters for the actor, no stars, no grain. Legal is tier C by design.
5. **Cheap transitions.** The C-ring iris is a pre-rendered disc scaled with `transform` plus one rotating mask, alive for 950 ms only. No full-screen `clip-path: circle()` layers stacked per scene. `will-change` is set just before a cut and removed after.
6. **Text.** Word spans are generated at build time (esbuild step), so there is no run-time splitting or kerning. Max ~300 animated spans per page.
7. **Touch scrolling.** On coarse pointers, scenes are native `scroll-snap-type: y mandatory` + `scroll-snap-stop: always` (one swipe = one scene, audience rule 12, mobile B2), with the cut choreography triggered on `scrollend`/IntersectionObserver. Lenis runs only on fine pointers. This is an amendment to engine.md A7 (to be agreed by the engine owner; the R4 behaviour contract is unchanged).
8. **SFX:** no layout reads in the hook (performance B4); the AudioContext is created on first unlock only.
9. **Images (when supplied):** AVIF 4:5 portrait at 480/800/1200 w, ≤ 80 KB at 800 w, duotone baked at build, `fetchpriority="high"` only on the Story founder scene, lazy elsewhere. Place photos ≤ 90 KB, lazy.
10. **Fonts:** Times is a system face (zero bytes). Manrope 400/500/600 and Poppins 500 only, Latin subset, `font-display: swap` with the existing metric-matched fallbacks; preload Manrope 400 only.
11. **Verification gate (Stage 6):** `npm run build`, Lighthouse mobile + desktop on all 5 `dist/` pages, a 4x-CPU trace of three cuts per page (no long task > 50 ms after load), `fit-audit` at all 9 viewports in film + flow with 0 overflow, and the screenshot test "no frame of a cut shows an empty field" (seek 25/50/75%).

---

## 7. Fixes for every critical and high judge finding

| judge · finding | how this direction fixes it |
|---|---|
| visual B1 (crit) no signature moment on Home | W1 Ignition → W2 arc in the first 2 s; W3–W5 on Home |
| visual B2/B15, content B1/B7, UX B3 (crit) no imagery, no face, no story | §3.6 typographic portrait now, duotone portrait brief, founder named in H4/T2, no empty frames |
| visual B3/B4, layout B7 (high) globe as wallpaper, arc scribble | globe ≤ 1 scene in 3 with a script (§2), clean great-circle arcs, ≤ 3 arcs |
| visual B5, motion B3 (high) colour strobe, flat mustard | chapters (2–3 iris cuts per page), ink 65–70%, one metallic gold climax (§3.4–3.5) |
| visual B6, layout B5, typography B-2 (high) one template, flat scale | five archetypes, no neighbours alike, `--fs-mega` monuments (§3.1, §3.3) |
| visual B7, layout B1/B8/B9, typography B-5, content B2, UX B5 (crit/high) clutter, loud placeholders | R4 removals, ≤ 6 chrome marks, quiet `.ph` with every word kept, one framed element per screen |
| visual B8, layout B2, mobile B1 (crit/high) clipped content and controls | fewer elements per scene, steppers, pagers, dialogs; fit-audit gate unchanged |
| layout B3, mobile B3 (crit/high) 20-element hero, CTA below fold on phone | H1 hero at ~7 elements; intro form → sheet; CTA in the phone thumb zone |
| layout B4, mobile B2 (crit) phone = stacked desktop, 12–13 screens | phone compositions per archetype; Home 7 scenes; native snap on touch |
| layout B6, content B3, perf B7, motion B5 (high) repetition, too many stops | Home 12 → 7, boilerplate once per relevant scene, merges in §5 |
| typography B-1, mobile B4 (crit/high) 10–13 px text | floor: note 15/16, label 14 (13 on phones), body 17/18, labels sentence case |
| typography B-3 (high) weak phone hero | phone `--fs-hero` 50–55 px, 3 short lines |
| typography B-4 (high) three faces mixed | one job per face (§3.1) |
| motion B1/B4 (crit/high) dead air, half-states | played J-cuts after snap; "no empty frame" test; nothing moves during holds |
| motion B2 (high) `$%#` decode | deleted; word-mask reveals |
| motion B6, perf B1 (crit/high) splash every load | once per session, ≤ 1.2 s, View Transitions after |
| motion B7 (high) star rain | streaks ≤ 8 px, stars on ink only, sleep while reading |
| motion B8, mobile B6 (high) SFX without mute | ticks and hovers removed, gain 0.15, reduced-motion = silent, footer "Sound off" as owner option |
| perf B2/B3/B5/B6 (crit/high) main thread, jank, three.js, splitting | raw WebGL2, render on demand, tiers, no blended grain, build-time splits |
| perf B4 (high) SFX forced layout | hook listens to snap events, no `scrollY` read |
| content B4 (high) internal notes in copy | rewritten as plain promises (§5.9) |
| content B5, UX B10 (high) empty video scene | removed until the video exists; then a hero link + dialog |
| content B6 (high) callouts dominate | notices become one 15/16 px line in context, not boxes |
| UX B1 (crit) identity split | hero lead names both halves; H4 founder doors; network framed as "and for everything else" |
| UX B2 (crit) finder dead end | concierge state while `PARTNERS = []`, switched by a config flag |
| UX B4 (high) ~30 CTA labels | one vocabulary (§3.8) |
| UX B8/B9 (high) phones lose persistent contact | header WhatsApp icon on phones; `tel:` + email in menu, closes and footer |
| mobile B5 (high) huge forms | steppers ≤ 4 fields per step |

---

## 8. Risks

1. **Content dependency.** The biggest trust and wow gain (the founder portrait and name) needs the client. The typographic portrait must look intentional on its own, and it is designed first, not as a fallback afterthought.
2. **The WebGL rewrite** is the largest engineering item (the morph to map and to C-ring depend on it). Mitigation: build the morph attributes in a scratch harness first; keep the three.js interim path behind a flag until parity screenshots match.
3. **Played cuts change the R4 engine.** `film-snap.js` must emit "cut to N" events and own a clock-based timeline; scrubbed page tweens (`film.on('build')`) must be ported. Reversibility is kept by playing the timeline backwards. Needs an engine.md amendment and re-test of A13.
4. **Native snap on touch** differs from the R4 Lenis glide (the field hold, the momentum lock). It is simpler and more robust, but it is a decision change for the engine owner and needs real-device checks on iOS and Android.
5. **Mega type and long words.** "Professional," limits the phone hero to 14 vw; any monument word longer than 9 letters must drop to `--fs-hero` on phones. fit-audit plus a "longest word" check per monument at 360x740 and 1280x720.
6. **The gold climax may still read as mustard** on poor panels. The brushed texture, vignette and sheen must be A/B'd against the flat field on a mid-range phone and an office monitor before sign-off.
7. **Scene re-cut invalidates R4 page specs.** home/story/partners specs and their `tools/fit-states/*.mjs` must be rewritten for the new scene lists; the shared tokens and components are reused unchanged.
8. **WCAG 2.2.2 without a pause control.** Every autonomous animation (W2 arc, globe idle, stars, grain) must stop within 5 s; this is a hard test, not a guideline.
9. **Placeholder honesty vs calm.** Quiet `.ph` must still be visibly a placeholder (dotted underline + brackets). The compliance reviewer signs off on the quiet style; `?review=1` remains for the founder.
10. **Owner decisions this direction depends on:** the phone header WhatsApp icon (D23), a footer "Sound off" control, the concierge state while there are no partners, the desktop chapter dots, and the copy rewrites in §4 (all marked for confirmation; none changes compliance meaning).
