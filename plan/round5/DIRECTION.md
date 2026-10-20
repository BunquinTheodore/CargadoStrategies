# Round 5 · DIRECTION (final): "Full Stop."

Status: the single source of truth for the Round 5 build. Written 2026-10-18 from the panel's verdict.
- **Base:** `direction-portfolio-led.md` ("Full Stop."). It won with all three judges (43, 42.5 and 42 points).
- **Grafts:** the best ideas from `direction-clarity.md` ("Still Gold", 42 / 42 / 41) and `direction-cinematic.md` ("The Gold Hour", 38 / 38.5 / 37), plus the fixes the panel asked for.
- **Inputs:** `PLAN.md` (Rounds 1 to 4), `plan/round4/shared.md`, `engine.md` and `build-order.md`, every `plan/round5/judge-*.md` and `research-*.md`, and the three direction files.

**Precedence:**
1. This file wins over the three direction files and over the Round 4 page specs.
2. The Round 4 sections listed in §11 as "applies unchanged" still bind, exactly as written.
3. Where this file says nothing, `direction-portfolio-led.md` applies. If that is silent too, Round 4 `shared.md` applies.

**Fixed constraints (never traded):**
- **Owner updates (2026-10-18):** the founder is **Lee Holgado** (config.js FOUNDER_NAME / FOUNDER_LAST_NAME). Numbers are never bracketed: write 24 hours, 24h, Day 3, 1 business day, 5 business days, 5 hours, 0% commission on the first client as plain text. Word placeholders keep their brackets. The owner removed "[Wording to be confirmed by counsel]" and the footer "[licence / registration]" line everywhere; never add them back.
- **Palette:** black and gold only. There is no blue anywhere.
- **Type:** the display face is Times New Roman (`"Times New Roman", Times, Tinos, serif`) in Title Case and never uppercase. Body text is Manrope and UI text is Poppins.
- **Compliance copy survives word for word:**
  - the commission and independence notices;
  - "strategy and coaching only, not licensed accounting, tax or investment advice";
  - "not a recommendation, sorted by distance";
  - "Nothing is sent until you tap send";
  - "Provided by Cargado Strategies itself";
  - the legal draft notice;
  - "We only message from +1 (204) 869 2508";
  - Mark 11:24 as a reference only, never quoted;
  - every `[bracket]` placeholder.

  Compliance copy may be **moved** or **regrouped**. It may be shortened only where §10 lists the exact new wording.
- **The Round 4 contract:** one scene fits one screen from 1920×1080 down to 360×740, one gesture moves exactly one scene, and the Round 4 removals are done (HUD, counter, timecode, corners, floating WhatsApp, phone bar, header sound and pause toggles, decorative dashes before text).

---

## Contents
1. Concept
2. Signature moments (W1 to W6)
3. Design system v2: tokens (CSS custom properties, exact values)
4. Type, layout, colour and motion rules
5. Component inventory
6. Shared chrome: splash, header, menu, close, credits and footer
7. Page specs, scene by scene: Home · Services · Story · Partners · Legal
8. Sound
9. Engine amendments (cuts, touch, tiers)
10. The de-clutter ledger and compliance moves
11. How Round 5 supersedes or reuses Round 4
12. Performance budget
13. Acceptance tests
14. Owner questions (built with defaults; nothing waits on them)

---

## 1. Concept

**Full Stop.** Every chapter ends on one confident statement in Times New Roman, set at poster scale. Its **gold full stop** is the hinge of the film: it lands, pops, then swells into the iris that opens the next chapter. The rhythm is **statement, then rest**: a monument beat, then one calm working screen. Hairline rows replace boxes. Giant outline numerals replace extra elements. One travelling character, the gold dot-globe, has a job in a few scenes and is hidden everywhere else.

**The promise the punctuation makes:** *ask once, and it's handled.*

**Audience.** A Canadian aged 30 to 45, usually a busy small-business owner or a young family, who is sceptical and reading on a mid-range phone. They should leave with five impressions:
- a beautiful first frame;
- a person they can name;
- type they never squint at;
- a site that moves like a film but never makes them wait;
- an obvious next step.

**Why this beats "basic" and "clogged":**
- **Scale contrast.** Mega against readable, with nothing in between.
- **One idea per screen,** enforced by a word, element and whitespace budget that `fit-audit` checks (§13).
- **Signature moments** that only this brand has: the full stop, the struck searches, the metal doors, and the globe coming down to Canada.

---

## 2. Signature moments (and nothing else competes)

**Rule:** while a signature moment plays, nothing else on screen moves. Once text lands, it stays still. Every autonomous animation stops within **5 s** (WCAG 2.2.2), because the pause toggle is gone.

### W1 · The Opening: match-cut splash → hero → first full stop (Home, once per session)
1. **Splash (≤ 1.1 s; `sessionStorage['cs-splash']`, so it plays on the first page of the session only).** It starts on an ink field with a faint warm radial.
   1. The C ring of the monogram draws as a 2 px gold stroke (`stroke-dashoffset`, 420 ms, `power2.inOut`).
   2. The W strokes draw inside it (260 ms).
   3. One sheen band crosses the monogram (a translated gradient mask, 300 ms).
   4. **Match cut (graft from Cinematic):** the C ring scales up (`transform: scale`, 380 ms, `power3.in`) as an **aperture** whose centre is the hero globe's centre. Its final radius equals the globe's radius, so the ring becomes the globe's horizon: the dotglobe draws its limb circle in the same place on the same frame, and the ring fades out (80 ms).
   5. The hero is painted underneath from the first frame.
   - Any input (pointer, key or wheel) finishes the splash in 150 ms.
   - The splash never waits for `film.ready` or for fonts.
   - Under reduced motion, the monogram shows for at most 300 ms, then fades over 200 ms.
   - On later pages of the session there is no splash; a View Transition plays instead (W6).
2. **Hero landing.**
   1. The H1 words rise from masks (`yPercent 110 → 0`, 700 ms, `expo.out`, 90 ms stagger).
   2. The accent "Near You" is in Times italic gold.
   3. The **full stop is a separate `<span class="stop">`**. It pops last (`scale 0 → 1`, `back.out(3)`, 240 ms).
   4. The lead, CTA and trust line fade up as one group (300 ms).
   5. The globe's single arc fires from a pulsing "you" node to a partner node. **It plays twice and then rests.** It replays once on pointer movement over the globe, never on a timer.
   6. The labelled "Next" chevron breathes for at most 5 s, then holds still.
3. **First scroll.** The gold full stop swells into the iris (a DOM circle with `transform: scale` from the stop's centre) and floods the frame with bone. The struck lines of W2 are already arriving during the swell (a J-cut, never an empty field).

### W2 · Four Searches, Struck (Home `#one-message`)
On bone, four lines in Times italic arrive 80 ms apart: *Searching "Broker Near Me"*, *Calling Five Offices*, *Waiting for Call-Backs*, *Guessing Who to Trust*.
1. A gold-dark bar wipes each line (`scaleX 0 → 1` from the left, 180 ms each, 70 ms apart), and the line dims to 30%.
2. **"One Message●"** lands at mega size (word rise, 600 ms, then the stop pops).
3. The three steps settle in a hairline row.

The whole beat takes **≤ 1.4 s**, then holds. Phones show three struck lines; the "Calling Five Offices" line is dropped (`.short-hide` on phones).

### W3 · Three Doors, in Metal (Home `#founder`; the Services intro rows reuse the hover flood)
The one gold field on Home, finished as **metal, not mustard**:
- a static gradient;
- a brushed-noise tile;
- a sheen band that moves **only** during the scene's entry.

Three tall panels are separated by 1 px ink hairlines. Each has a ghost outline numeral behind it, a one-word title from the triad (**Protect. / Plan. / Delegate.**) and the visitor's question in Times italic.
- **Entry:** the panels are dealt in: y ±48 px alternating, **`rotationY` ±12° at most** (the panel fix; ≤ 15°), `transformPerspective 1100`, 70 ms stagger, landing flat. Under reduced motion they **fade** (no rotation, no y). On phones they rise in y only.
- **At rest, every door already shows** its title, question, offer name, required label line and "Ask About … →" (a Clarity graft: nothing that matters is hover-only).
- **Hover or focus:** the door widens (`flex-grow 1 → 1.5`, 350 ms, `power3.out`, `contain: layout` on the door row only). It floods **ink**, and its type turns ivory. The other two doors stay gold.
- **Phone:** three stacked full-width doors, each about 26% of the scene, with the title, question and offer name visible. A tap expands one door in place (an exclusive accordion) to show its label line and the CTA. Nothing scrolls.

### W4 · The Globe Comes Down to Canada (Home `#find`, Services `#finder`, Partners `#hero` in reverse)
- **The globe:** about 900 gold points, with point size and alpha by depth, a soft halo sprite, and true great-circle arcs (lift ≤ 0.12 R, at most 3 visible).
- **The morph:** on the scene's entry, the globe turns to face North America and every point **morphs** from its sphere position to its place on a flat dot map of Canada (a per-point lerp, 900 ms, `power3.inOut`, on a 2D canvas, with no three.js).
- **The arc:** one arc draws from the visitor's city to a node labelled **"A Professional Near You"**. The city comes from the WhatsApp sheet if the visitor chose one, otherwise Winnipeg.
- **Then the map holds still.**
- **Partners:** the reverse. A new node joins, lights up and is labelled **"You"**.

### W5 · The Bookend (Story `#logo`, and every page's `#close`)
- **Story `#logo` keeps today's composition** (the judges' best frame on the site). The globe collapses into the C ring while the W draws inside it. "W Stands for *Wealth.*" sits on the left and "C Stands for *Cargado.*" on the right.
- **Every `#close`: the medallion** (a graft from Cinematic and Clarity).
  - The close statement sets word by word.
  - The globe (or, on pages without one, a gold dot) shrinks into a **gold metal medallion** (22svh, the metal finish) with the **C·W mark embossed in ink**: an inset ink stroke plus a 1 px highlight edge at `rgba(255,240,200,.35)` offset −1 px.
  - The last frame mirrors the splash, so the visit ends where it began.
  - Gold appears here as an object, not a field, so the "one gold field per page" rule holds.

### W6 · Between pages: View Transitions
- `@view-transition { navigation: auto; }`.
- The header and monogram carry `view-transition-name: cs-header` and `cs-mark`.
- The new page arrives through a 450 ms gold-edged circle (`::view-transition-new(root)` animating `clip-path: circle()`, compositor only), centred on the clicked link. The link writes its centre to `sessionStorage['cs-vt']` before navigation.
- Browsers without support navigate normally; there, the splash-once rule makes it a hard cut.

**Supporting craft details** (not signature moments):
- **The hairline frame:** the one framed element of a scene (P archetype) gets a 1 px gold hairline that **draws** (SVG `stroke-dashoffset`, 600 ms, starting at 40% of the cut). This is a Cinematic graft.
- **The key light:** a static radial behind each ink headline, placed per scene by `--kx/--ky`.

---

## 3. Design system v2: tokens

These replace base.css §1 `:root` and the three `[data-field]` blocks, owned by stage 2b.
- Token names in today's base.css are **kept** where the role is the same, so page CSS keeps working.
- Rows marked **NEW** are added.
- Rows marked **RETIRED** become aliases for one release, and are then deleted in stage 6.

```css
:root {
  /* ---------- colour primitives (unchanged names) ---------- */
  --c-black:        #0B0B0C;
  --c-charcoal:     #1A1A1C;
  --c-charcoal-2:   #141416;                 /* NEW: sheet, dialog and panel surface on ink */
  --c-ink-warm:     #1A1712;
  --c-gold:         #D4AF37;
  --c-gold-deep:    #B8913A;
  --c-gold-field:   #C9A24A;
  --c-gold-light:   #D9B862;
  --c-gold-dark:    #7A5C12;                 /* gold text on bone (≥ 5.5:1) */
  --c-champagne:    #E9DCB8;
  --c-ivory:        #F5F0E6;                 /* bone field */
  --c-ivory-text:   #F3ECDD;
  --c-ivory-2nd:    rgba(243,236,221,.82);   /* NEW: secondary text on ink, never lower (≥ 9:1) */
  --c-ink-2nd:      #3B362C;                 /* NEW: secondary text on bone (≥ 9:1) */
  --c-gold-2nd:     #1F1A0E;                 /* NEW: secondary text on gold (black at full strength, never "dim") */
  --c-white:        #FFFFFF;
  --c-input-bone:   #FFFDF8;                 /* NEW */
  --c-error-ink:    #F2A08F;
  --c-error-bone:   #9E2A14;
  --c-error-gold:   #5A0F06;

  /* ---------- metal (gold field and medallion) NEW ---------- */
  --metal-grad:     linear-gradient(115deg, #B8913A 0%, #C9A24A 46%, #D9B862 100%);
  --metal-tile:     url("../img/brushed-256.png");   /* 256 px brushed-noise tile, generated at build time, ≤ 6 KB */
  --metal-tile-op:  .06;
  --metal-sheen:    linear-gradient(100deg, transparent 35%, rgba(255,246,214,.38) 50%, transparent 65%);
  --emboss-hi:      rgba(255,240,200,.35);
  --emboss-lo:      rgba(11,11,12,.55);

  /* ---------- fonts (unchanged) ---------- */
  --font-display: 'Times New Roman', Times, Tinos, serif;
  --font-body:    'Manrope', 'Manrope Fallback', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-ui:      'Poppins', 'Poppins Fallback', system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* ---------- fit unit (R4, unchanged) ---------- */
  --u: min(1vw, 1.5svh);

  /* ---------- display scale: huge and readable, nothing in between ---------- */
  --fs-mega:      clamp(3.5rem,   calc(1rem + 10  * var(--u)), 12rem);   /* NEW  56 phone · 151 @1440x900 · 124 @1280x720 · 178 @1920 */
  --fs-statement: clamp(2.75rem,  calc(1rem + 6.5 * var(--u)), 8.5rem);  /* NEW  44 · 104 · 86 · 121: hero H1, closes, monuments with > 2 words */
  --fs-d1:        clamp(2.25rem,  calc(.9rem + 3.8 * var(--u)), 5rem);   /* 36 · 66 · 57 · 76: working-scene headline */
  --fs-d2:        clamp(1.75rem,  calc(1rem + 1.8 * var(--u)), 2.75rem); /* 28 · 40 · 35 · 44: row, door and panel titles; Times is never < 28 px */
  --fs-quote:     clamp(1.5rem,   calc(1rem + 2.2 * var(--u)), 3rem);    /* NEW  Times italic: questions, situations, pull quotes (24 px phone floor for quotes) */
  --fs-num:       clamp(2.5rem,   calc(1rem + 4.5 * var(--u)), 5.5rem);  /* NEW  outline step numerals */
  --fs-row-num:   clamp(1.625rem, calc(1rem + 1.2 * var(--u)), 2rem);    /* NEW  outline numerals inside index rows (26-32 px) */
  --fs-ghost:     min(60svh, 42vw);                                       /* NEW  ghost numerals behind doors, 14% */
  --fs-hero:      var(--fs-statement);                                    /* RETIRED alias */
  --fs-d3:        var(--fs-d2);                                           /* RETIRED alias */
  --fs-d4:        clamp(1.125rem, calc(.95rem + .45 * var(--u)), 1.375rem); /* kept for Manrope item titles only */

  /* ---------- text scale ---------- */
  --fs-lead:  clamp(1.125rem, calc(1rem + .3 * var(--u)), 1.375rem);     /* 18-22 */
  --fs-body:  clamp(1.0625rem, calc(1rem + .2vw), 1.125rem);              /* 17 phone, 18 from 1024 */
  --fs-note:  1rem;            /* 16 from 760 px (15 below): every notice, hint, error, consent and fine-print line */
  --fs-label: .875rem;         /* NEW 14: eyebrow, nav, chip and tag. THE HARD FLOOR for any visible text */
  --fs-ui-min: .9375rem;       /* 15: button, tab, pager and form labels */
  --fs-input: 1.125rem;        /* NEW 18: text inside inputs */
  --fs-small: var(--fs-label); /* RETIRED alias (was 14) */
  --fs-xs:    var(--fs-label); /* RETIRED alias (was 12): nothing renders below 14 px */

  /* ---------- leading and tracking NEW ---------- */
  --lh-mega: .92;  --lh-d1: 1;  --lh-d2: 1.08;  --lh-quote: 1.15;  --lh-body: 1.6;  --lh-note: 1.5;
  --track-mega: -.015em;  --track-display: -.012em;  --track-eyebrow: .12em;
  --track-hero: var(--track-mega);   /* RETIRED alias */
  --measure: 62ch;  --measure-legal: 68ch;  /* NEW legal measure */

  /* ---------- spacing (R4 values kept; Round 5 adds the group rhythm) ---------- */
  --space-2xs: 4px;  --space-xs: 8px;  --space-s: 12px;
  --space-m:   clamp(12px, 2.2svh, 20px);
  --space-l:   clamp(16px, 3.2svh, 32px);
  --space-xl:  clamp(20px, min(5vw, 5svh), 72px);        /* between groups */
  --space-2xl: clamp(28px, min(9vw, 8svh), 140px);
  --gap-row:   clamp(12px, min(3vw, 3svh), 40px);
  --gap-col:   clamp(16px, 2vw, 32px);
  --group-gap: var(--space-xl);                          /* NEW: head ↔ body ↔ action */
  --inner-gap: .25em;                                    /* NEW: inside a display group, relative to its font size */
  --row-pitch: clamp(56px, 9svh, 96px);                  /* NEW: index-row height */
  --page-pad:  clamp(20px, 5vw, 96px);                   /* changed: was clamp(16px, 4vw, 56px); 20 px at 360 */
  --max-w:     1360px;                                   /* changed: was 1320 */
  --white-min: .18;                                      /* NEW: whitespace budget (≥ 18% of the scene box empty) */

  /* ---------- controls ---------- */
  --radius:   2px;
  --btn-h:    56px;                                      /* NEW (52 px on phones, below) */
  --ctl-h:    56px;                                      /* changed: inputs 56 px */
  --chip-h:   56px;                                      /* NEW: sheet chips */
  --tap-min:  44px;                                      /* NEW: every target */
  --focus-w:  2px;  --focus-off: 2px;

  /* ---------- chrome (R4 scene box, unchanged) ---------- */
  --header-h: clamp(56px, 7svh, 76px);
  --bottom-h: env(safe-area-inset-bottom, 0px);
  --scene-top: calc(var(--header-h) + var(--banner-h, 0px));
  --scene-h: calc(100svh - var(--scene-top) - var(--bottom-h));
  --scene-pad-top: clamp(8px, 1.5svh, 24px);
  --scene-pad-bottom: clamp(12px, 2.5svh, 32px);
  --scene-safe-h: calc(var(--scene-h) - var(--scene-pad-top) - var(--scene-pad-bottom));
  --scene-safe-w: min(var(--max-w), 100vw - 2 * var(--page-pad));
  --media-h: clamp(160px, 40svh, 560px);
  --panel-max-h: var(--scene-safe-h);
  --hdr-blur: 8px;                                       /* NEW (tier A only) */

  /* ---------- light and texture NEW ---------- */
  --kx: 30%;  --ky: 55%;                                 /* key-light position, set per scene inline */
  --key-light: radial-gradient(60% 50% at var(--kx) var(--ky), rgba(212,175,55,.08), transparent 70%);
  --lamp: radial-gradient(120% 90% at 70% 30%, #1A1712 0%, #0B0B0C 62%);
  --grain-op: .05;                                       /* ink only, no blend mode, under the text */
  --stars-op-ink: 1;  --stars-op-long: .25;              /* behind long text (inquiry, apply) */
  --hair-w: 1px;

  /* ---------- the full stop NEW ---------- */
  --stop-size: .17em;  --stop-lift: .02em;

  /* ---------- z-index NEW ---------- */
  --z-fields: 0; --z-stars: 1; --z-globe: 2; --z-grain: 3; --z-scenes: 4; --z-iris: 6;
  --z-header: 10; --z-menu: 12; --z-dialog: 20; --z-splash: 30; --z-cursor: 40;

  /* ---------- motion NEW (mirrored in assets/js/motion-tokens.js for GSAP) ---------- */
  --ease:          cubic-bezier(.2,.7,.1,1);             /* kept */
  --ease-out:      cubic-bezier(.16,1,.3,1);             /* expo.out */
  --ease-in:       cubic-bezier(.55,0,1,.45);            /* power2.in */
  --ease-inout:    cubic-bezier(.87,0,.13,1);            /* expo.inOut */
  --dur-out:   .32s;   --dur-iris: .62s;   --dur-in: .65s;   --dur-stop: .24s;
  --dur-hover: .2s;    --dur-door: .35s;   --dur-frame: .6s; --dur-vt: .45s;
  --dur-fade-rm: .2s;  --idle-stop: 5s;
}

@media (max-width: 759px) {
  :root { --header-h: clamp(56px, 7.5svh, 64px); --fs-note: .9375rem; --btn-h: 52px; }
}
@media (min-width: 760px) and (max-height: 760px) {          /* laptop-short guard (R4) */
  :root { --space-xl: clamp(16px, 4svh, 40px); --space-2xl: clamp(24px, 6svh, 64px); }
}
@media (max-width: 759px) and (max-height: 700px) {          /* phone-tiny (R4 D21); never lowers lead, floor, 44 px targets */
  :root { --header-h: 52px; --scene-pad-top: 6px; --scene-pad-bottom: 8px;
          --fs-statement: 2.5rem; --fs-mega: 3rem; --fs-d1: 2rem; --fs-d2: 1.625rem; }
}

/* ---------- field roles ---------- */
[data-field="ink"] {
  --bg: #0B0B0C;  --field-bg: var(--key-light), var(--lamp);
  --fg: #F3ECDD;  --fg-muted: var(--c-ivory-2nd);  --accent: #D4AF37;
  --line: rgba(212,175,55,.22);  --line-strong: rgba(243,236,221,.42);  --line-text: rgba(243,236,221,.16);
  --surface: var(--c-charcoal-2);
  --input-bg: #1A1A1C;  --input-line: rgba(243,236,221,.45);  --input-fg: #F3ECDD;
  --btn-bg: #D4AF37;  --btn-fg: #0B0B0C;  --btn-arrow: #0B0B0C;  --btn-hover-bg: #F3ECDD;
  --chip-on-bg: #D4AF37;  --chip-on-fg: #0B0B0C;
  --row-flood: #D4AF37;  --row-flood-fg: #0B0B0C;
  --ph-line: rgba(212,175,55,.6);
  --focus: #F3ECDD;  --error: var(--c-error-ink);
  --hdr-bg: rgba(11,11,12,.55);  --hdr-bg-solid: rgba(11,11,12,.94);  --hdr-fg: #F3ECDD;
  --stroke-num: rgba(212,175,55,.40);  --ghost: rgba(212,175,55,.14);
}
[data-field="bone"] {
  --bg: #F5F0E6;  --field-bg: #F5F0E6;                   /* flat: no gradient, no stars, no grain, no shadow */
  --fg: #0B0B0C;  --fg-muted: var(--c-ink-2nd);  --accent: #7A5C12;
  --line: rgba(11,11,12,.15);  --line-strong: rgba(11,11,12,.42);  --line-text: rgba(11,11,12,.15);
  --surface: #FFFDF8;
  --input-bg: #FFFFFF;  --input-line: rgba(11,11,12,.30);  --input-fg: #0B0B0C;
  --btn-bg: #0B0B0C;  --btn-fg: #F3ECDD;  --btn-arrow: #D4AF37;  --btn-hover-bg: #3B362C;
  --chip-on-bg: #0B0B0C;  --chip-on-fg: #E9DCB8;
  --row-flood: #0B0B0C;  --row-flood-fg: #F3ECDD;
  --ph-line: rgba(122,92,18,.6);
  --focus: #0B0B0C;  --error: var(--c-error-bone);
  --hdr-bg: rgba(245,240,230,.70);  --hdr-bg-solid: rgba(245,240,230,.96);  --hdr-fg: #0B0B0C;
  --stroke-num: rgba(122,92,18,.45);  --ghost: rgba(122,92,18,.12);
}
[data-field="gold"] {
  --bg: #C9A24A;  --field-bg: var(--metal-grad);         /* plus the tile and sheen via .field--gold::before/::after */
  --fg: #0B0B0C;  --fg-muted: var(--c-gold-2nd);  --accent: #0B0B0C;
  --line: rgba(11,11,12,.28);  --line-strong: rgba(11,11,12,.55);  --line-text: rgba(11,11,12,.22);
  --surface: rgba(11,11,12,.06);
  --input-bg: #0B0B0C;  --input-line: rgba(243,236,221,.45);  --input-fg: #F3ECDD;   /* inputs on gold: ink fill */
  --btn-bg: #0B0B0C;  --btn-fg: #D4AF37;  --btn-arrow: #D4AF37;  --btn-hover-bg: #1A1A1C;
  --chip-on-bg: #0B0B0C;  --chip-on-fg: #D4AF37;
  --row-flood: #0B0B0C;  --row-flood-fg: #F3ECDD;
  --ph-line: rgba(11,11,12,.6);
  --focus: #0B0B0C;  --error: var(--c-error-gold);
  --hdr-bg: rgba(184,145,58,.62);  --hdr-bg-solid: rgba(201,162,74,.96);  --hdr-fg: #0B0B0C;
  --stroke-num: rgba(11,11,12,.38);  --ghost: rgba(11,11,12,.14);
}
/* retired field tokens: --ph-bg (tinted .ph boxes are gone; html.ph-loud restores rgba(212,175,55,.16) / rgba(122,92,18,.12)) */
```

**Device tiers** (`html[data-tier]`, written by `tier.js` before first paint and re-evaluated once after 90 frames). This is a Cinematic graft.

| tier | who | globe | stars | grain | iris | header blur |
|---|---|---|---|---|---|---|
| **A** | fine pointer, `deviceMemory` > 2 (or unknown), no Save-Data | 900 points, DPR ≤ 1.5, halo | ≤ 180, static canvas, compositor drift on the hero and close only | static tile | DOM circle | `blur(var(--hdr-blur))` |
| **B** | coarse pointer with the short side ≤ 600 px, or a tablet | 520 points, DPR 1, no halo, no idle rotation | ≤ 110, no drift | static tile | DOM circle (switch to a 250 ms crossfade if the perf gate measures < 55 fps) | none: `--hdr-bg-solid` |
| **C** | Save-Data, `deviceMemory` ≤ 2, p75 frame > 22 ms over the first 90 frames, or legal.html | SVG poster (`globe-poster.svg` / `canada-poster.svg`) | none | none | crossfade 250 ms | none |

Reduced motion (OS setting or the footer switch) sets `html.rm` on top of any tier. It gives crossfades of 200 ms, posters, no splash animation, no deal-in, no drift and no SFX except the success chime.

---

## 4. Type, layout, colour and motion rules

### 4.1 Type
- **One face, one job:**
  - **Times** for every heading, numeral, price, question and pull quote at 28 px or more. The exception is quotes, which may go down to 24 px on phones.
  - **Manrope** for all reading text and item titles: weight 500 on ink, 400 on bone and gold.
  - **Poppins** only for the eyebrow, buttons, nav, chips, tags and form labels.
- **Uppercase:** the only uppercase tracked string on a scene is the **eyebrow** (Poppins 500, 14 px, `--track-eyebrow`, `--accent` colour). Form labels and tags are sentence case at 15 px.
- **One accent per headline:** exactly one word or phrase is set in Times italic, in `--accent` (gold on ink, gold-dark on bone, ink on gold). It usually carries the full stop.
- **The full stop** is `<span class="stop" aria-hidden="true"></span>` placed after the last word. The real "." stays in the text, visually hidden, for screen readers and copy-paste. It is a gold circle of `--stop-size`: gold on ink, gold-dark on bone, ink on gold. It is used **once per scene at most**, on the scene's main statement.
- **Word splitting** happens at build time (`tools/build-splits.mjs` writes `<span class="w">` masks into dist HTML). Source HTML stays clean, and the dev server falls back to the runtime splitter. Only one display heading per scene is split, **by word**, never by character.
- **Kerning** is precomputed at build time (`tools/build-kerning.mjs` → `assets/data/kern.json`). Runtime `kerning.js` only applies the table.
- **Longest-word rule:** a mega word longer than 9 letters drops to `--fs-statement` below 760 px. `fit-audit` checks it.
- **Wrapping:** `text-wrap: balance` on headings and `pretty` on paragraphs. The measure is 62ch (68ch for legal documents).

### 4.2 Layout: archetypes, budgets and groups
The grid has 12 columns, `--max-w` 1360 px and uneven splits (7/5, 6/6, 4/4/4). **Rules and space do the work, not boxes.**

| | archetype | composition | phone |
|---|---|---|---|
| **M** | Monument | one statement at mega or statement size, bottom-left or centred, plus at most one line, one CTA and one link | statement in the upper middle, CTA in the thumb zone |
| **O** | Object split | globe, map, medallion or portrait on one half, bleeding; text on the other half, bottom-anchored at 62% of the height | object as a top band (34-38svh), text below, CTA at the bottom |
| **R** | Index rows | full-width hairline rows: outline numeral · Times d2 title (or a Times-italic quote) · Manrope meta · → | rows of 56-72 px, meta under the title, at most 5 rows, then a pager |
| **D** | Doors / panels | 3 (or 4) tall panels with hairline separators and ghost numerals; one widens on focus | stacked doors with an exclusive accordion, or tabs with swipe (R4 D15) |
| **P** | Paper | the one framed element: a stepper form, a sheet or a legal document; its hairline frame draws on arrival | full width; steppers hold ≤ 4 fields per step |

**Markup:** every scene carries `data-archetype="M|O|R|D|P|stage|credits"`, and its top-level content groups carry `data-group="head|body|action"`. Compliance-only elements carry `data-compliance`.

**Hard rules (checked by `fit-audit` §13):**
1. **No two neighbouring scenes share an archetype.** Legal is exempt, by design.
2. **≤ 3 groups per scene**, marked `data-group="head|body|action"` (credits is exempt).
3. **Whitespace budget:** the union of the group boxes covers ≤ 82% of the scene's safe box. At least 18% stays empty.
4. **Word budget:** ≤ 60 visible words per scene, not counting `.fineprint`, `[data-compliance]` or credits. The design target is ≤ 40.
5. **Element budget:** ≤ 12 interactive or framed elements per scene (credits is exempt).
6. **Action budget:** 1 primary CTA plus at most 1 text link, and at most 1 fine-print line (`.fineprint`) per scene. Credits and legal documents are exempt.
7. **Fixed anchors:** the eyebrow at the top of the content box, then the headline, a gold hairline rule (1 px, `scaleX` draw), the body, and the action at the bottom left of the content column.

**Band names** are the Round 4 `shared.md` §9 bands, unchanged. In this document:
- "wide" means ≥ 1280 px wide and > 760 px tall;
- "laptop-short" means ≥ 760 px wide and ≤ 760 px tall (1366×768, 1280×720, 1024×768);
- "phone" means < 760 px;
- tablet portrait (768×1024) uses the **phone composition with desktop type tokens**, unless a scene says otherwise.

### 4.3 Colour roles
- **Ink is the stage:** 60-70% of the scenes on Home, Story and Partners, and ≥ 50% on Services.
- **Bone is the reading room:** founder offers, stories, forms and legal.
- **Gold is a field at most once per page,** as the climax: Home doors, Services outsourcing, Partners founding. Legal and Story have none.
- **On ink, gold is light, not paint.** It is used only for:
  1. the primary button;
  2. the italic accent;
  3. hairlines at 22%;
  4. outline numerals;
  5. the key light;
  6. the globe, map and medallion;
  7. the focus of row floods.

  Gold covers at most about 6% of an ink or bone screen. It is never used for body text.
- **Chapters, not strobes:** a page has ≤ 3 field changes and the iris fires only on those. The header swaps colour **once**, at 50% of the iris, and never blends.
- **Focus:** a 2 px ring in `--focus` with a 2 px offset, ≥ 3:1 on every field, and never hidden under the header (`scroll-margin` and an inset on the header).

### 4.4 Motion

| step | time | what | ease |
|---|---|---|---|
| out | 0 → 0.32 s | the outgoing content leaves as one group: y −40 px, opacity → 0 (back: y +40) | `power2.in` |
| iris (chapter change only) | 0.10 → 0.72 s | a DOM circle in the next field's colour scales from 0.02 to 1 from a meaningful origin: the stop, the clicked CTA, the map pin or the monogram | `expo.inOut` |
| same-field cut | 0.10 → 0.50 s | the field holds; the P frame draws if there is one | `power2.inOut` |
| in | 0.30 → 0.95 s | eyebrow (mask slide, 450 ms) → headline words (mask rise, 70 ms stagger) → rule `scaleX` → body and rows (60 ms stagger) → CTA | `expo.out` |
| stop | +0 → 0.24 s after the last word | the full stop pops | `back.out(3)` |
| settled | ≤ 1.0 s after input | composed and static | — |
| hover | 200-250 ms | colour swap, arrow nudge +6 px, row flood and padding 24 → 46 px, door widen 350 ms | `power3.out` |
| page change | 450 ms | View Transition circle | `ease-in-out` |
| reduced motion | 200 ms | crossfade only; posters; no splash animation | linear |

1. **Play, don't scrub.** Every transition is a time-based GSAP timeline played at `timeScale 1` (§9). No scroll-scrubbed half-states exist anywhere.
2. **J-cut, never dead air.** No frame shows an empty field. The seek test at 25%, 50% and 75% of every cut proves it (§13).
3. **Nothing moves while it is read.** Exceptions: the globe beside the text (never behind it), which stops within 5 s, and the ambient stars, which are static on tiers B and C and drift for ≤ 5 s on tier A.
4. **Deleted:**
   - decode scramble, letter-roll and per-character splits;
   - `film-alive.js` heading drift and star streaks;
   - tilt on forms, rows, doors and legal (a tilt of ≤ 4° survives on the Partners tier panels, desktop only);
   - the rotateX "muddy" media exits (media leave with an `inset()` clip wipe);
   - the cursor "label" bubbles.
5. **Kept:**
   - the cursor ring: 32 px, `quickTo` 0.15 s, 1.9× over links and rows, fine pointer only, with the native cursor kept;
   - the magnetic pull on the hero CTA only (≤ 6 px);
   - the text-link underline draw;
   - the arrow nudge.

---

## 5. Component inventory

Owners and files are in `build-order.md`. "R4" means the component is specified in Round 4 `shared.md` §6 and is reused unchanged unless noted.

| # | component | class / file | spec |
|---|---|---|---|
| C1 | Splash | `#splash` in each HTML (inline SVG), `splash.js`, `visual.css` | W1. Once per session; any input skips it in 150 ms; the match cut to the globe's horizon; `aria-hidden`; it never traps focus |
| C2 | Header | `.site-header`, `chrome.js`, `base.css` | §6.2 |
| C3 | Phone menu | `.menu` dialog, `chrome.js` | §6.3 |
| C4 | Iris | `.iris` (one fixed div per page), `iris.js` | DOM circle, `transform: scale` only, `will-change` during the cut only; `irisTo(field, {x, y})` |
| C5 | Full stop | `.stop` | §4.1 |
| C6 | Eyebrow | `.eyebrow` | 14 px Poppins 500, uppercase, 0.12em, `--accent`; **no rule or dash before it** |
| C7 | Rule | `.rule` | 1 px `--line`, width 96-160 px, `scaleX` draw from the left |
| C8 | Monument headline | `.t-mega`, `.t-statement` | §3 tokens; `--lh-mega`, `--track-mega` |
| C9 | Outline numeral | `.num-outline` | `-webkit-text-stroke: 1px var(--stroke-num)`, transparent fill, Times |
| C10 | Ghost numeral | `.ghost` | `--fs-ghost`, `--ghost` fill, `aria-hidden`, behind the door content |
| C11 | Index row | `.row` (an `a` or `button`) | ≥ `--row-pitch` tall; hairline top and bottom; numeral · title · meta · →; on hover or focus the background floods `--row-flood` in 220 ms, padding-inline goes 24 → 46 px and the text turns `--row-flood-fg`; the whole row is the target |
| C12 | Quote row | `.row.row--quote` | as C11, but the title is a Times-italic quote at `--fs-quote` and the meta is sentence-case tags |
| C13 | Door | `.doors > .door` | W3; uses `ui-accordion.js` on phones |
| C14 | Strike list | `.strike > li` | W2; the bar is a `::after` element using `scaleX`; the text keeps a real `<s>` for semantics with `aria-hidden` duplicates avoided (one `<s>` per line) |
| C15 | Steps strip | `.steps` | 3 cells: outline numeral · "Now" / "Within 24h" / "Day 3" · one line |
| C16 | Paper | `.paper` | the one framed element; a hairline frame (SVG rect with `stroke-dasharray` = its perimeter) draws in 600 ms; charcoal-2 on ink, `#FFFDF8` on bone |
| C17 | Fine print | `.fineprint` | `--fs-note`, `--fg-muted`, at most 1 per scene, at the bottom of the content column; an optional "Details →" link to `legal.html#…`; **wording verbatim** |
| C18 | Placeholder | `.ph` | no fill; current colour with a 1 px dotted underline in `--ph-line`; **always visible**. `html.ph-loud` (`?review=1`) restores the tinted boxes |
| C19 | Proof slot | `[data-when="KEY"]` | rendered only when `config[KEY]` is truthy, or in review mode. Keys: `STATS`, `RATING`, `QUOTES`, `FOUNDING_LIVE`, `FOUNDER_PHOTO`, `VIDEO_URL`. A qualitative trust line stands in until then |
| C20 | Buttons | `.btn--primary`, `.btn--ghost`, `.btn--sm` | 56 px (52 on phones), 2 px radius, Poppins 600 at 16 px, Title Case, label + "→" (`.btn__arrow`, coloured `--btn-arrow`); hover swaps to `--btn-hover-bg` in 200 ms and nudges the arrow |
| C21 | Text link | `.link` | the text colour, a 1 px underline at 35% that draws to 100% (`scaleX`, 250 ms); hit area ≥ 44 px through padding-block |
| C22 | WhatsApp sheet | `<dialog class="sheet" id="wa-sheet">` (one per page), `wa-sheet.js` | §6.5 |
| C23 | Stepper | `form.stepper`, `ui-stepper.js` | R4 §6.3 unchanged (partners' a11y model); R5 skin: 56 px inputs, 18 px text, labels above in sentence case at 15 px, Back and Next pinned to the bottom of the P box, "Step 2 of 4 · Licence and Area" in the focused h3 |
| C24 | Pager | `ui-pager.js` | R4 §6.2 unchanged |
| C25 | Tabs / switch / swipe | `ui-tabs.js` | R4 §6.1 unchanged |
| C26 | Dialog | `ui-dialog.js` | R4 §6.4 unchanged; skin: P paper, hairline frame, at most 760 px wide on desktop, a sheet on phones |
| C27 | Accordion | `ui-accordion.js` | R4 §6.5 unchanged |
| C28 | Focus helper | `ui-focus.js` | R4 §6.6 unchanged |
| C29 | Dot-globe | `<canvas id="globe" aria-hidden="true">`, `dotglobe.js`, `assets/data/dotglobe-points.js` | §9.5; modes `sphere \| map \| ring \| medallion \| hidden`, placed by `[data-globe-anchor]` boxes (R4 `globe-fit.js` reused) |
| C30 | Stars | `<canvas id="stars">`, `layers.js` | drawn **once** (redrawn only on resize), compositor drift; ink only; tier rules |
| C31 | Grain | `.grain`, `layers.js` | a static 256 px tile at `--grain-op`, no blend mode, under `.scenes`, ink only; it jitters with `steps(6)` during cuts only, tier A only |
| C32 | Medallion | `.medallion` (HTML + CSS), `visual.css` | W5; a 22svh disc in `--metal-grad` plus the tile; the C·W mark as an inline SVG embossed with an ink stroke and a highlight edge; `aria-hidden` |
| C33 | Typographic portrait | `.tportrait` | an outline C·W monogram at 60-70svh (gold stroke at 40%), "[First name] [Last name]" in Times italic at `--fs-d1`, a one-line pull quote at `--fs-quote` and a `[signature]` caption line; a **finished look**, not a fallback |
| C34 | Portrait slot | `.portrait[data-when="FOUNDER_PHOTO"]` | 4:5, duotone baked at build time, AVIF 480/800/1200w, ≤ 80 KB at 800w, `fetchpriority=high` only on Story `#top`; the C ring passes behind one shoulder |
| C35 | Category icons | `assets/img/icons.svg` (a sprite) | 9 categories plus WhatsApp, phone, mail, Facebook, arrow, close, chevron; 24 px grid, 1.25 px stroke, round joins; `--accent` |
| C36 | Next chevron | `.next` | a labelled "Next ↓" button, hero only; it breathes for ≤ 5 s |
| C37 | Footer switches | `.switches` in the credits | "Sound: On / Off" and "Motion: Full / Reduced" as text-button rows (`aria-pressed`), persisted in `localStorage` (`cs-sound`, `cs-motion`); Motion applies `html.rm` and re-initialises the engine through a reload that keeps the hash |
| C38 | Legal draft pill | `.legal-draft` | §7.5; **the full verbatim wording is always visible** at 14 px |
| C39 | Cursor ring | `cursor.js` | §4.4 |
| C40 | Concierge | `.concierge` | a category `select` plus a city input → opens C22 with both prefilled (Services `#finder` before `FINDER_MIN_PARTNERS`) |
| C41 | Finder (gated) | `finder*.js` | R4 services.md finder spec, unchanged; shown when `PARTNERS.length >= FINDER_MIN_PARTNERS` |

**Retired components:** `.hud*`, `.wa-float*`, `.phone-bar`, `.motion-toggle`, `.sound-toggle`, `.compare*`, `.proof` (it becomes C19), `.vframe*`, `.situation` (it becomes C12), `.intro` (it becomes C22), `.panel-3d` offset plates, `.stack` offset gaps, `[data-decode]`, `[data-roll]` letter-roll, `[data-tilt]` (except `.tier`), `[data-depth]` parallax layers, `.lead-rule`, `.story-cue*`, `.legal-rule`, and "— " prefixes.

---

## 6. Shared chrome

### 6.1 Splash: see W1
- The markup is in every HTML file, so it paints instantly. The script is `splash.js` (imported first, before anything else).
- `legal.html` has **no splash**.
- An LCP guard: the splash never covers the hero text for more than 1.1 s, and the hero H1 is in the HTML underneath.

### 6.2 Header (fixed, ≤ 6 marks)
- **Desktop:**
  - the C·W monogram plus the wordmark "Cargado Strategies" (link home, `view-transition-name: cs-mark`);
  - three nav links: **Services · Our Story · For Professionals** (Poppins 500 at 15 px, Title Case, with the underline draw);
  - one gold **"WhatsApp"** button (`.btn--sm`, 44 px, which opens C22).
  - Facebook moves to the menu and footer.
- **Backdrop** (Clarity graft): `background: var(--hdr-bg)` plus `backdrop-filter: blur(var(--hdr-blur))` on tier A; `--hdr-bg-solid` on tiers B and C. The colour swaps once, at 50% of the iris (`data-hdr-field`).
- **Phone:** the monogram (36 px), a 44×44 gold WhatsApp icon button (`aria-label="Message us on WhatsApp"`) and "Menu" (44 px). This resolves R4 C2 and D23 without a floating button or a bar.
- **Legal:** the draft pill (§7.5) sits under the header as a band on all widths (`--banner-h`: 36 px from 760 px, 49 px on phones; R4 legal §3.2).

### 6.3 Menu (phone and tablet)
- A native `<dialog>`: the field ink with ivory text, full screen.
- **Content:**
  1. the pages as R rows (Home, Services, Our Story, For Professionals, Legal);
  2. then Call `tel:+12048692508`, Email `[company email]`, WhatsApp and Facebook;
  3. then the two switches (C37).
- Focus is trapped by `showModal`. Escape closes it.

### 6.4 Close and credits (the last two scenes of every page)
- **`#close`** (ink · M · W5): the page's closing statement at `--fs-statement` on wide and `--fs-d1` on phones, the medallion, and one CTA plus at most one link. The per-page content is in §7.
- **`#credits`** (ink, the same field, so the change is a crossfade): **R4 `shared.md` §5.4 applies unchanged** (markup, globe anchor and fitter, CSS and the ≥ 24 px spare gate). The R5 additions are:
  - a contact row: WhatsApp +1 (204) 869 2508 · Call · Email · Facebook, as 44 px rows with icons;
  - link columns: Services · Our Story · For Professionals · Legal · Privacy;
  - the **fine-print block** at `--fs-note`:
    - the commission and independence notice;
    - "Strategy and coaching only, not licensed accounting, tax or investment advice.";
    - ``;
    - "We only message from +1 (204) 869 2508.";
  - the tagline **"Connected by Purpose. United in Service."** It appears **once per page, here only**;
  - the switches (C37);
  - © `[Year]`.
- **Phone:** the contact row becomes an icon row of four 44 px targets with visible labels underneath. The link columns become a 2-column list.
- The `#credits` globe anchor is hidden on phones (R4).

### 6.5 WhatsApp sheet (C22, replaces the hero form card everywhere)
- A `<dialog>` that rises from the bottom on phones (a sheet, `max-height: 92svh`, fitted with no inner scroll) and sits centred as a P panel of 640 px or less on desktop.
- It is opened by every client CTA, with `data-need` and `data-context` prefilled from the trigger.
- **The steps** (a 3-step `ui-stepper`):
  1. **"What do you need?"**: 56 px chips. Insurance · Business Strategy · Outsourcing (labelled "From [First name]") · Mortgage · Lawyer · Real Estate · Accounting and Tax · Financial Planning · Not Sure. Underneath: "No fee to you · No obligation".
  2. **"Your city"**: an input (`autocomplete="address-level2"`, 56 px, 18 px text) with the hint **"We ask for your city only so we can introduce you to someone close to you."** (verbatim).
  3. **"Open WhatsApp"**: the summary sentence that will be sent. The primary is "Open WhatsApp →" (a link to `wa.me/12048692508?text=…`, a new tab). Under it: **"Opens WhatsApp with your message written. Nothing is sent until you tap send."** (verbatim). Then the secondary line: "Rather call or email? [phone] · [company email]".
- **After it opens:** the success chime, and a status line: **"WhatsApp opened in a new tab. Didn't open? Call [number] or email [address]."** (Clarity graft).
- The chosen city is stored in `sessionStorage['cs-city']` and feeds the W4 arc.
- The message builders are in `whatsapp.js` (unchanged API, plus `buildIntro({need, city, context})`).

---

## 7. Page specs, scene by scene

Notation: `#id` · field · archetype · signature. **Words** counts visible words, not counting fine print. Hash aliases are written as `data-alias="…"` on the section, so old links keep working (§9.4). A globe that is not mentioned is `hidden`.

### 7.1 Home (`index.html`): 12 scenes → 6 + credits
Fields: ink · bone · bone · gold · ink · ink · ink. Irises: hero→bone (from the stop), bone→gold (from the clicked row's position or centre), gold→ink (from the door used, or centre).

#### H1 · `#hero` · ink · O · W1
- **Content:**
  - Eyebrow: "Free Introductions · Across Canada".
  - H1 (`.t-statement`, 3 lines): "The Right Professional, *Near You*●". The accent is on "Near You".
  - Lead: "Send one message to [First name] at Cargado Strategies. She handles insurance, business strategy and outsourcing herself, and introduces you to a trusted professional close to you for everything else."
  - Primary: **"Get My Introduction →"** (opens C22, context "home"). Link: "Or Call / Email Us" (opens the sheet's contact line, `#wa-sheet?contact`).
  - Trust line (`.fineprint` styling, not compliance): "No fee to you · No obligation · Licence shown where one applies · Replies within 24 hours".
  - `.next` "Next ↓".
- **Words:** ~45. **Elements:** 6.
- **A/B:** `config.HERO_VARIANT = 'network'` (the default) or `'triad'`. The triad variant swaps the H1 to "Protect. Plan. *Delegate*●". The lead and everything else stay the same.
- **Proof:** the `[n]` stats and `★ [rating]` move into a `[data-when="STATS"]` / `[data-when="RATING"]` strip under the trust line (hidden until real; visible in review mode).
- **Wide:** text in cols 1-7, bottom-anchored at 62% of the height. Globe anchor in cols 7-12, 78svh, bleeding 12% off the right edge. Key light at `--kx: 28%; --ky: 60%`.
- **Laptop-short:** the same composition; the H1 is capped at `min(var(--fs-statement), 12.5svh)`, the trust line wraps to 2 lines, and the globe is 70svh.
- **Phone:**
  - the globe in the top 34svh (centred, 72vw);
  - the H1 at 44 px on 3 lines;
  - the lead at 17 px;
  - a full-width CTA in the thumb zone (bottom 25%);
  - the link under it;
  - the trust line shortened to 2 lines by `.short-hide` on "Licence shown where one applies";
  - `.next` hidden (the swipe is native).
- **Motion:** W1. No out-animation on the first scroll; the iris from the stop is the cut.
- **Interactions:**
  - the magnetic pull on the CTA (tier A);
  - the CTA sheen once (≤ 900 ms, the first landing only);
  - pointer movement over the globe replays the arc once;
  - "Next" calls `film.next()`.
- **SFX:** none on landing. A click blip on the CTA (desktop).

#### H2 · `#one-message` (`data-alias="compare how-it-works video"`) · bone · M · W2
- **Content:**
  - Eyebrow: "How It Works".
  - The strike list (4 lines, Times italic `--fs-quote`).
  - Monument: "One *Message*●" (`.t-mega`).
  - Steps strip: "Now · You send one message" | "Within 24h · We introduce someone close to you" | "Day 3 · We check in".
- **Words:** ~38. **Elements:** 0 interactive (steps only).
- **Wide:** the strikes in cols 1-6 at the top. The monument spans cols 1-12, bottom-left. The steps strip runs full width under a hairline at the bottom.
- **Laptop-short:** the strike lines go to 2 columns (2×2). The monument is capped at `min(var(--fs-mega), 16svh)`.
- **Phone:** 3 strikes (one is `.short-hide`), the monument at 56 px, and the steps as 3 short rows with outline numerals (56 px pitch).
- **Motion:** W2 (≤ 1.4 s). It is a J-cut: the strikes arrive during the incoming iris.
- **Interactions:** none.
- **SFX:** the chapter "breath" on the iris (desktop only).

#### H3 · `#situations` (`data-alias="services"`) · bone · R
- **Content:**
  - Eyebrow: "Start With Your Situation".
  - Headline (d1): "Sounds Like *You*?" No full stop: it is a question.
  - 4 quote rows (C12):
    - 01 "We're buying our first home." · Mortgage, real estate, lawyer → `services.html#mortgage`
    - 02 "My business is busy but money is tight." · Business strategy, tax → `services.html#business-strategy`
    - 03 "If something happens to me, is my family OK?" · Insurance, wills and estates → `services.html#insurance`
    - 04 "I'm doing everything myself." · Outsourcing → `services.html#outsourcing`
  - Link: "See All Services →".
- **Words:** ~50. **Elements:** 5.
- The FR05 deep links are kept.
- **Wide:** the head in cols 1-4 (top). The rows span cols 1-12 at `--row-pitch`, each with an outline numeral (`--fs-row-num`), the quote, tags on the right and →.
- **Laptop-short:** the rows are at the minimum pitch (64 px) and the tags sit under the quote.
- **Phone:** 4 rows of 64-72 px. The quote is at 24 px, with tags under it at 15 px. The link sits at the bottom.
- **Motion:** a same-field cut (no iris). The rows rise with a 60 ms stagger. The P frame does not apply.
- **Interactions:** the row flood (ink on bone).
- **SFX:** a click blip on a row.

#### H4 · `#founder` · gold (metal) · D · W3
- **Content:**
  - Eyebrow: "From [First Name] Herself".
  - Headline (d1): "Three Things [First name] Does *Herself*●".
  - A small 40 px avatar `[data-when="FOUNDER_PHOTO"]` before the eyebrow.
  - Doors:
    - **01 Protect.** *"Is My Family Covered?"* · Family Protection Review · 30 min · **"Ask About Insurance →"**
    - **02 Plan.** *"Where Does My Money Go?"* · The 30-Day Cash-Flow Clean-Up · fine: "Business strategy · strategy and coaching only, not licensed accounting, tax or investment advice." · **"Ask About the Clean-Up →"**
    - **03 Delegate.** *"Am I Doing Everything Myself?"* · Your Back-Office Team · fine: "Provided by Cargado Strategies itself." · **"Ask About Outsourcing →"**
  - Each door's CTA opens C22 with the need preselected, the context "founder", and a "From [First name]" tag.
- **Words:** ~48 (fine print exempt). **Elements:** 3 CTAs plus 3 doors (focusable as a group) = 6.
- The `[Real client quote…]` testimonials become `[data-when="QUOTES"]` (hidden).
- **Wide:** the head in cols 1-8. Three doors fill the remaining height (≥ 58% of the safe height). Each door has a ghost numeral, the title (d2), the quote, the offer (Manrope 600), the fine print and the CTA, all bottom-aligned.
- **Laptop-short:** the ghost numeral is `min(--fs-ghost, 46svh)`, and the quote clamps to 2 lines.
- **Tablet portrait:** 3 doors side by side (they fit at 768 px with the d2 title at 28 px).
- **Phone:**
  - the head;
  - 3 stacked doors (title + quote + offer visible);
  - tapping one expands it (exclusive) to show the fine print and the CTA;
  - one door is open by default (01).
- **Motion:** the iris bone→gold (origin: the clicked row, else the centre). The metal sheen sweeps once (1.2 s). The doors are dealt in (§W3). The stop pops.
- **Interactions:**
  - hover or focus widens the door and floods it ink;
  - the arrow nudge;
  - no tilt.
- **SFX:** the chapter breath; a click blip on the CTAs.

#### H5 · `#find` · ink · O → full-bleed map · W4
- **Content:**
  - Eyebrow: "Across Canada".
  - Headline (d1): "Need Someone We Don't Do *Ourselves*?"
  - Body: "Lawyer, mortgage, accountant, real estate: tell us the service and your city. We'll introduce you to someone good, close to you."
  - Primary: **"Get My Introduction →"** (C22, context "network").
  - `.fineprint`: "Partners are independent businesses, and a listing is not a recommendation. Cargado Strategies may receive a commission when a referral becomes a client. Details →".
  - A map caption (aria-hidden): "Illustration only."
- **Words:** ~40. **Elements:** 2.
- **Wide:** text in cols 1-5. The globe→map fills cols 5-12 and bleeds to the right and bottom edges. The arc label is "A Professional Near You".
- **Laptop-short:** the map anchor is 64svh, and the fine print is 2 lines.
- **Phone:** the map in the top 36svh, then the text, a full-width CTA and the fine print (3 lines at 15 px).
- **Motion:** the iris gold→ink from the door used. The globe morphs to the map (900 ms), then the arc draws (600 ms) and everything holds.
- **Interactions:** none on the map (decorative). The CTA.
- **SFX:** the chapter breath.

#### H6 · `#close` (`data-alias="story partners faq"`) · ink · M · W5
- **Content:**
  - The medallion (C32), centred above.
  - The statement (word by word): "One Message. The Right Person. Close to *You*●".
  - Primary **"Get My Introduction →"**. Link: **"Questions Everyone Asks First →"** (opens the FAQ dialog).
  - Under a hairline, two R rows: "**Our Story** · W for Wealth, C for Cargado →" and "**For Professionals** · Be found close to home →".
- **Words:** ~32. **Elements:** 4.
- **The FAQ dialog** holds 4 items as an exclusive accordion, with **every answer verbatim** from today's `#faq`: why it's free, do I have to hire them, how do you choose who to show me, and what happens to my information. `#faq` deep links open the dialog.
- **Wide:** a centred monument with the medallion at 22svh and the rows side by side as two 6-column rows.
- **Laptop-short:** the medallion is 16svh and the statement is capped at 11svh.
- **Phone:** the medallion is 14svh, the statement is at 36 px on 3 lines, then the CTA, the link and the 2 rows stacked.
- **Motion:** a same-field cut. The globe shrinks into the medallion (600 ms) and the medallion glints once (the sheen). The words set one by one, then the stop pops.
- **SFX:** none, apart from the click.

#### H7 · `#credits` · ink · §6.4

**Deleted or merged on Home:**
- `#video` (until `VIDEO_URL` exists; then a "Watch 1 Min" link in the hero opens a dialog, with the poster as the medallion frame, captions, and no autoplay with sound);
- `#compare` and `#how-it-works` → H2;
- the services tile grid → H3 plus the header;
- `#story` and `#partners` → the H6 rows;
- `#faq` → a dialog;
- the hero form → C22;
- the proof strip → C19.

### 7.2 Services (`services.html`): 8 → 8 + credits
Fields: ink · bone · bone · bone · gold · ink · ink · ink. Irises: intro→bone, bone→gold, gold→ink.

| # | id (aliases) | field · type | content (verbatim headings) | wide / laptop-short / phone | motion · SFX |
|---|---|---|---|---|---|
| S1 | `#intro` | ink · R | Eyebrow "Services". Headline "Her Work, and the People She *Trusts*●". Rows: 01 Insurance · 02 Business Strategy · 03 Back-Office Team (meta "Ours"), then 04 "Nine Kinds of Help, Near You" (meta "Partners"). Each row calls `film.goTo`. Legend: "**Ours** means [First name] does it herself. **Partners** are independent local professionals." (~45 words) | rows full width at `--row-pitch` / rows at 64 px / 4 rows of 64 px with the meta inline | in: rows stagger · a click blip |
| S2 | `#ours-insurance` (`insurance`) | bone · O | Typographic portrait (C33) or portrait on the left; right: eyebrow "From [First Name] · Insurance", headline "If Something Happens to You, Is Your Family *OK*?", the promise (2 lines), "Family Protection Review · 30 min", primary **"Ask About Insurance →"**, link "Book a Free 15-Min Call". | 5/7 split / portrait 54svh / portrait as a 30svh band on top, then text and CTA | iris from row 01 · breath |
| S3 | `#ours-strategy` (`business-strategy`, `strategy`) | bone · M | Eyebrow "From [First Name] · Business Strategy". Statement "The *30-Day* Cash-Flow Clean-Up". "For business owners who are busy but don't know where the money goes." "2 spots in [month]". Primary **"Ask About the Clean-Up →"**. Fine print (verbatim, today's notice): "**Strategy and coaching only.** Not licensed accounting, tax or investment advice." | monument bottom-left / statement capped at 12svh / statement at 44 px on 4 lines | same-field cut · — |
| S4 | `#ours-includes` (new) | bone · R | Headline "What You *Get*●". 5 rows, outline numerals 01-05, Manrope 600 titles (today's toolkit items, verbatim), and the promise line under them. **No `[value]` column.** | 5 rows / 5 rows at 56 px / 5 rows at 56 px, titles only (details through the pager if a title wraps to 3 lines) | same-field cut · — |
| S5 | `#ours-outsourcing` (`outsourcing`) | gold metal · D (4 panels) | Eyebrow "From [First Name] · Outsourcing". Headline "Your Back-Office *Team*●". Panels: [Bookkeeping] · [Inbox and Calendar] · [Social Media] · [Customer Follow-Up], each with a ghost numeral and one line. "From [$x]/hr". Primary **"Ask About Outsourcing →"**. Fine print: "Provided by Cargado Strategies itself, not by a partner." The "Nothing is sent until you tap send." line moves into C22 | 4 panels / 4 panels, ghost at 40svh / 2×2 grid with the lines hidden, tap to expand (accordion) | iris bone→gold, metal sheen, panels rise (y only) · breath |
| S6 | `#finder` (`categories`, plus all 9 category slugs) | ink · O → map · W4 | **While `PARTNERS.length < FINDER_MIN_PARTNERS`:** the concierge (C40). Headline "Who Does What, *Near You*●". A category select (9) plus "Your city" → **"Get My Introduction →"**. Beside it, the Canada dot map. **Afterwards:** the R4 finder unchanged (phone Map / Results tabs, results pager "Next 3"). Link "See All Nine Kinds of Help →" opens the **categories dialog** (rail + detail, partner list or "Partner spot available" cards, linking to partners.html). Fine print (verbatim): "**Sorted by distance only.** This list is not a recommendation. Partners are independent businesses, each responsible for their own licence and advice. Cargado Strategies may receive a commission if you become their client. You never pay us." | text 5 / map 7 / map 60svh / map as a top band of 32svh, form below | iris gold→ink, morph + arc · breath |
| S7 | `#inquiry` | ink · P | Headline "Tell Us What You *Need*●". A 3-step stepper: (1) service and city; (2) name, phone, email; (3) message, consent and the commission notice (verbatim) → submit to WhatsApp, or mailto when `CONTACT_EMAIL` exists. FR08 success. Honeypot kept. The Now / 24h / Day 3 strip is deleted here | paper 640 px centred-left with the headline beside it / paper fills the height / full-width paper, Back and Next pinned | P frame draws · stars at 25% · error tone on a failed Next |
| S8 | `#close` | ink · M · W5 | Medallion. "Ask Once. It's *Handled*●". Primary **"Get My Introduction →"**, link "Questions? Read the Fine Print →" (`legal.html#faq`) | as H6 | as H6 |
| S9 | `#credits` | ink | §6.4 | | |

Deep links: `services.html#legal` (and every category slug) → cut to `#finder` and open the categories dialog on that category (FR05, R4 services.md deep-link table unchanged).

### 7.3 Story (`story.html`): 7 → 5 + credits
Fields: ink · bone · ink · ink · ink. Irises: top→bone, bone→ink. The draft copy is in the founder's voice. Brackets wrap only the facts she must confirm. The "[Draft story…]" meta note moves into an HTML comment and review mode.

| # | id (aliases) | field · type | content | wide / laptop-short / phone | motion |
|---|---|---|---|---|---|
| T1 | `#top` | ink · O | Eyebrow "Our Story". Statement "I Started Cargado So Good People Wouldn't Have to Search *Alone*●". "[First name] [Last name], founder". Right: portrait (C34) or typographic portrait (C33) | 7/5 / statement capped at 11svh / portrait band 30svh above | W6 arrival; words rise; stop |
| T2 | `#beginning` (`founder`) | bone · M | Eyebrow "Where It Began". Mega "One Place. Not *Five*●". Body (draft): "In [year], a friend in [city] spent three weeks calling offices to find a mortgage broker who would call her back. I knew [n] good professionals who would have answered that same day." A `[data-when="QUOTES"]` quote slot | monument, body in cols 1-6 / mega capped at 15svh / mega at 56 px on 3 lines | iris from the stop · breath |
| T3 | `#logo` | ink · stage · W5 | **Keep today's composition.** "W Stands for *Wealth.*" on the left and "C Stands for *Cargado.*" on the right, with the globe collapsing into the C ring. Add the quiet `.ph` line "[How the logo came about, in the founder's words.]" and "Mark 11:24" as a reference only: no rule before it, never quoted | unchanged / unchanged / stacked: W line, mark (40svh), C line | played, not scrubbed (a 1.2 s collapse); breath |
| T4 | `#values` (`network`) | ink · R | "What I Will Never Trade for a *Referral*●". 01 People Before Transactions · 02 Say How You Are Paid (body: "We say how we are paid. Cargado Strategies may receive a commission when an introduction becomes a client, and we tell you up front.") · 03 Grow Slowly, with Care. Fine print (verbatim, from the old `#network`): "**Independent partners.** Partners are independent businesses, each responsible for their own licence and advice. Cargado Strategies may receive a commission when a referral becomes a client." | rows / rows at 64 px / 3 rows; the body opens by accordion (01 open) | same-field cut; rows stagger |
| T5 | `#close` (`talk`) | ink · M · W5 | Medallion plus a 40 px avatar `[data-when="FOUNDER_PHOTO"]`. "Tell Me What You Need. I'll Find Someone *Good*●". Primary **"Get My Introduction →"** (later "Message [First name] →" when `FOUNDER_NAME` is set), link "For Professionals →" | as H6 | as H6 |
| T6 | `#credits` | ink | §6.4 | | |

### 7.4 Partners (`partners.html`): 8 → 6 + credits
Fields: ink · ink · ink · gold · bone · ink · ink. Irises: tiers→gold, gold→bone, bone→ink.

| # | id (aliases) | field · type | content | wide / laptop-short / phone | motion |
|---|---|---|---|---|---|
| P1 | `#hero` | ink · O · W4 reversed | Eyebrow "For Professionals". Statement "Clients Near You, Already *Asking*●". Lead (verbatim): "When people near you ask us for your kind of service, they see the partners closest to them, sorted by distance. Introductions cost nothing up front: you pay a commission only when one becomes your client [terms to be confirmed]." Hook: "First 2 partners per service, per city: [founding offer]." Primary **"Apply to Join →"** (→ `#apply`) | text 7 / map 5 / map 56svh / map band 30svh | W6, then a node joins and is labelled "You" |
| P2 | `#how` (`arrangement`) | ink · R | "Pay on Clients, Not on *Clicks*●". Rows: 01 Someone Asks · 02 We Introduce (same-day hand-off, shown by distance) · 03 You Pay on Success ("If they become your client, you pay [the agreed commission]. If they don't, you owe nothing."). Fine print (verbatim, both notices merged in order): "**Commission terms [to be confirmed by counsel].** Referral fees are restricted for some professions in some provinces, so terms are set for each profession and province before launch. Partners are independent businesses, each responsible for their own licence and advice." No promise of referrals, outcomes or endorsement (CR04) | rows / rows at 64 px / 3 rows | same-field cut |
| P3 | `#tiers` | ink · D | "Community, Growth, *Premier*●". 3 panels: name, `[$ per month]` in Times d2 with `.ph`, 3 lines each (today's verbatim bullets, cut to the first 3; the rest go to a "Compare All →" dialog), one **"Apply to Join →"** with the tier preselected by `?tier=`. Tilt ≤ 4° on desktop only | 3 panels / 3 panels at 46svh / tabs with swipe (R4 D15) | dealt in (≤ 12°), reduced motion fades |
| P4 | `#founding` | gold metal · M | Statement "The First 2 Partners per Service, per *City*●". "They get 0% commission on the first client. After that, standard terms. A founding spot never changes the order of the list: it stays sorted by distance." (verbatim). `[n] of 2 open` is `[data-when="FOUNDING_LIVE"]` | monument / capped at 12svh / statement at 40 px | iris ink→gold, sheen · breath |
| P5 | `#apply` (`ask`) | bone · P | "Apply to *Join*●". A 4-step stepper (R4 partners.md stepper spec, re-grouped): Business · Service and Licence (licence # + issuing body) · Area and References · Review, Code of Conduct and Send. Step 1's intro: "What we ask: a valid licence, quick replies, our code of conduct." Final-step notices (verbatim, merged into one fine-print block): "**Commission.** Cargado Strategies may receive a commission when an introduction becomes your client. Terms are agreed in writing before your listing goes live. [Commission terms to be confirmed by counsel] **Independent partners.** Partners are independent businesses, each responsible for their own licence and advice. Approval is not an endorsement." | paper 720 px / paper fills the height, 2 steps per page from 760 px (R4 `pageWhen`) / one step per unit | iris gold→bone, P frame · error tone |
| P6 | `#close` | ink · R + medallion | Medallion small, left. "Questions Before You *Apply*?" 4 question rows, each opening an in-scene dialog with its answer (verbatim from today). Primary **"Apply to Join →"**. The line "Message us on WhatsApp about tiers, commission terms or spots in your area." becomes a link | rows 7 / medallion 5 / rows 64 px / medallion hidden, 4 rows | iris bone→ink; rows stagger |
| P7 | `#credits` | ink | §6.4 | | |

### 7.5 Legal (`legal.html`): calm on purpose, 7 + credits
- **One field, bone, for every scene.** There is no splash, globe, stars, grain, cursor ring or SFX, and the dotglobe code is never loaded. The page is tier C by design.
- The engine (cuts, snap, pager) still applies, so the R4 fit contract holds.
- The **R4 `legal.md` paged reader (§5.1), drill Q&A (§5.2), banner height (§3.2) and compliance lists apply unchanged.** The R5 differences are below.
- **Draft notice:** the band under the header (C38) at **14 px**, ink text on `#E9DCB8`.
  - The markup keeps today's text **verbatim**: `<span class="legal-draft__tag">Draft</span><span class="visually-hidden"> — </span>to be reviewed by a lawyer in Canada before launch`. The tag is shown as a pill and the dash is visually hidden (R4 legal §3.3).
  - The full wording is **always visible**, never in a tooltip.
  - The per-document "**Draft for review.** These pages are written…" notice stays first in `#contents`.

| # | id | type | content |
|---|---|---|---|
| L1 | `#contents` | R | "The Fine Print, in *Plain English*●". Rows 01 Professional Disclosure · 02 Privacy · 03 Terms · 04 Partner Code of Conduct · 05 Q&A, each with a large outline numeral; the draft-for-review notice as fine print |
| L2-L5 | `#disclosure` `#privacy` `#terms` `#conduct` | P | the document at a 68ch measure, body 18 px / line-height 1.7, through the R4 paged reader ("Page 2 of 4"); the text never scrolls inside a box; "Draft · Updated [date]" meta |
| L6 | `#faq` | R | "Straight Answers." (the phrase lives only here); an exclusive accordion, 3 per page through the pager; phones use drill mode |
| L7 | `#close` | M | "Still Have a Question? *Ask Us*." Primary **"Get My Introduction →"** (C22 context "legal") |
| L8 | `#credits` | | §6.4 |

**Motion on legal:** 200 ms crossfades between scenes, and page turns slide 24 px with a fade. Nothing else.

---

## 8. Sound (Clarity's quiet set, inside the R4 decision of no header toggles)

- **Three voices only:**
  - **breath:** on chapter changes (irises) only. A sine at 110→98 Hz, attack 0.35 s, release 0.9 s, peak 0.04.
  - **blip:** on a click of a button, row or chip. 1.2 kHz, 40 ms, peak 0.06.
  - **chime:** on success (the sheet opens WhatsApp, or a form submits). A two-note gold chime, peak 0.08.
- **Removed:** the scroll tick, hover ticks, the per-scene whoosh plus tone, the splash chime and the `page` voice. R4 §7.6's `page` voice is not built: pager turns are silent.
- **Master gain 0.12.** `MIN_GAP_MS`: breath 900, blip 60, chime 600.
- **Unlock** only on the first `click` (pointer, tap or keyboard activation). Never on scroll, wheel or keydown alone.
- **Silent on coarse pointers.** Under reduced motion, only the chime plays.
- The footer "Sound" switch (C37) is persisted. When it is off, nothing plays.
- `hookFilm` returns at once when audio is locked, muted or silent, and **never reads layout or `scrollY`** (perf B4).

---

## 9. Engine amendments (cuts, touch, tiers)

These amend R4 `engine.md` and `shared.md` §7. Everything not mentioned here stands (§11).

### 9.1 Cuts, not scrubs (E1)
- The film is a list of discrete scenes. `film.cut(to, { cause, origin })` plays one **cut timeline** built from the table in §4.4:
  - out group;
  - then the iris (when the field changes) or a same-field cut;
  - then the in group;
  - then the stop.

  The total is ≤ 0.95 s.
- **Backward cuts** use the same structure with mirrored y.
- **Jumps** (nav, Home/End, deep links) cut directly from the current scene to the target, with no intermediate scenes.
- **ScrollTrigger is removed** from every bundle. There is no scroll-linked visual anywhere. Story `#logo` is played too.
- **Pages add choreography** through `film.on('cut', ({ from, to, tl, dir }) => …)`, which appends to `tl`. That replaces `film.on('build')` scrubbed tweens. `film.on('build')` stays for layout fitters only (`globe-fit`).
- **The input lock:** new input is ignored until 70% of a cut, then one step is queued. Home, End and nav jumps interrupt at once (`tl.progress(1)`, then a new cut).
- **The data hooks** `data-reveal="fade|stagger|scale|words"` keep their names. They now feed the **in** group of the cut. `lines` is renamed `words`, and `lines` stays as an alias.

### 9.2 Desktop / fine pointer input (E2)
- R4 `engine.md` A3-A6 apply (intent detection, the wheel flick with its momentum lock, keyboard with the §7.2 key-ownership table, the field hold). **The output changes:** an intent calls `film.cut(i)` instead of a Lenis glide.
- Lenis is kept, loaded dynamically on fine pointers only, as the wheel normaliser and position holder. The spacer stays at one `100svh` slot per scene. After each cut the engine sets `lenis.scrollTo(holdY(i), { immediate: true, force: true })`, so the scrollbar, `#hash` and find-in-page stay meaningful. Visuals never read scroll progress.
- The R4 pan fallback (`film-map.js`) remains only for heights below 560 px (B1), unchanged.

### 9.3 Touch / coarse pointer (E3: replaces R4 A7 touch snap and D19 on coarse pointers)
- **`html.touch-cut`:** scenes are in flow (one `100svh` section each). Native `scroll-snap-type: y mandatory` with `scroll-snap-stop: always` makes one swipe one scene. There is no Lenis and no wheel interception.
- **Sections are transparent.** A fixed `.fields` layer behind them shows the current field.
- An IntersectionObserver at **0.35** fires the field change (`irisTo` from the scene's `data-iris` origin, or a crossfade on tier C). At **0.6** it fires the scene's in-group (the same timelines as desktop). Content starts at opacity 0, so text never shows over the wrong field.
- **Focus:** R4 `ui-focus.js` flow branch. A field hold is not needed: mandatory snap plus `focusInScene` (R4 §7.5, flow note).
- **Short landscape** (< 560 px tall): snap is off and free scroll is allowed (the R4 fallback).
- The flow mode with no JS or reduced motion (R4 B2 and `shared.md` §4.3) is unchanged. In it, sections paint their own `--field-bg`.

### 9.4 Aliases and deep links (E4)
- `data-alias="a b c"` on a section makes `#a`, `#b` and `#c` resolve to it, in `goTo`, on load and on `hashchange`.
- `data-open="dialogId:key"` on an alias target opens a dialog after the cut. Examples: `#faq` on Home, and category slugs on Services.
- R4 A8 (goTo, deep links, focus, the overflow-only rebuild of §7.4) is otherwise unchanged.

### 9.5 dotglobe.js (E5)
- **Data:** `tools/gen-dotglobe.mjs` writes `assets/data/dotglobe-points.js`, which holds `Float32Array`s for:
  - 900 Fibonacci-sphere points (unit xyz);
  - 900 Canada-map points (xy in 0..1, sampled inside the `canada-map.js` outline, with a density bias to the southern population band);
  - 12 city nodes from `cities.js`.

  It is about 7 KB gzip. Tier B uses the first 520 points (the ordering is stratified).
- **Drawing:**
  - an orthographic projection with lerped rotation (k ≈ 0.07);
  - each point drawn as a `fillRect`, its size and alpha set by z;
  - one radial halo sprite on tier A;
  - arcs drawn as quadratic great-circle approximations with a dash offset;
  - the morph as a per-point lerp of the projected sphere xy to the map xy, plus a camera dolly.
- **Modes** (`data-globe-mode` on the scene): `sphere`, `map`, `ring` (Story logo: the points collapse onto the C ring path), `medallion` (shrink into the `.medallion` rect) and `hidden`.
- **Placement:** `[data-globe-anchor]` boxes through the R4 `globe-fit.js`.
- **Render on demand:**
  - it draws only during cuts, morphs, arcs, the 2× hero arc, or pointer movement over it (tier A);
  - **all autonomous motion stops within 5 s** of the last input or landing, and the idle rotation (desktop only, 1 rev / 60 s) also stops at 5 s;
  - one `gsap.ticker` callback, removed while it is asleep;
  - paused on `visibilitychange`.
- **DPR:** 1.5 on tier A, 1 on tier B.
- **Fallback:** if it reads flat in review, three.js may come back on tier A only, after the first input (risk R5 below). It is not built by default.

### 9.6 Stars, grain and cursor (E6)
- **Stars:** one canvas drawn once and redrawn only on resize. On tier A the hero and close get a compositor `translate` drift for ≤ 5 s on arrival. There is no cursor push, since it would need redraws.
- **Grain:** §5 C31.
- `film-alive.js` is deleted.

### 9.7 View Transitions (E7)
- Add `<meta name="view-transition" content="same-origin">` and `@view-transition { navigation: auto; }` in base.css.
- The `pageswap` and `pagereveal` handlers in `main.js` read `sessionStorage['cs-vt']` for the circle origin, and are skipped under `html.rm`.

### 9.8 Public API, documented in `site/ENGINE.md` (E8)
- `film.cut`, `film.next`, `film.prev`, `film.goTo(id)` (aliases resolve), `film.current`, `film.on('cut' | 'landed' | 'build')`, `film.refreshReach`, `film.isParked`, `film.stop` / `film.start`, and `film.mode` (`'cut' | 'touch-cut' | 'flow'`).
- `export function initFilm(` keeps that exact signature (fit-audit rewrites it).

---

## 10. De-clutter ledger and compliance moves

| removed / changed | where it goes |
|---|---|
| HUD, counter, timecode, corners, floating WhatsApp, phone bar, header sound and pause toggles, every dash before text | deleted (R4 engine §C, run in stage 1) |
| Home `#video`, "Founder Video Coming Soon" | deleted until `VIDEO_URL` exists, then a hero "Watch 1 Min" dialog |
| Home `#compare`, `#how-it-works`, services grid, `#story`, `#partners`, `#faq` | merged into H2, H3 and H6, plus the FAQ dialog (answers verbatim) |
| The hero form card, chips and city input | C22 sheet (hints verbatim) |
| Proof stats, ★ rating, testimonials, the founding live count | C19 `data-when` slots (visible in review mode) |
| "Nothing is sent until you tap send." ×12 | once per page in C22 (step 3) and once under each form's send button (S7, P5) |
| "One Message. The Right Person. Close to You." ×3 | Home `#close` only |
| Now / 24h / Day 3 ×4 | Home H2 only |
| Boxed `.notice` callouts | one `.fineprint` per scene, wording unchanged; `<strong>` leads kept |
| Spec-speak ("The rail does the disclosure…", "Each section says whether…", "named as hers and shown separately…", "captions included when it arrives") | replaced by the copy in §7 |
| Offset borders, shadows, dashed frames, tinted `.ph` boxes | hairlines; quiet `.ph` (brackets still visible) |
| Decode, letter-roll, heading drift, per-character splits, star streaks, tilt on forms, rows and doors | deleted |
| About 30 CTA labels | **three verbs:** "Get My Introduction" (clients, network) · "Ask About [Insurance / the Clean-Up / Outsourcing]" (founder offers) · "Apply to Join" (partners); plus the header "WhatsApp" |
| Facebook in the header | menu and footer |
| three.js (462 KB raw) | `dotglobe.js` plus data (≈ 10 KB gzip) |
| Story `#network`; Partners `#arrangement`, `#ask`; the Services jump rail and `#categories` scene | merged (§7); `#categories` becomes a dialog |
| Legal dashed DRAFT band | the 14 px band with the full verbatim text |
| The tagline in several places | footer only, once per page |

**Compliance moves (the complete list; nothing else may change wording):**
1. The Home finder notice → H5 `.fineprint` (verbatim).
2. Story `#network` notice → T4 fine print (verbatim).
3. The two Partners `#apply` notices → one P5 block (both verbatim, in order).
4. The Partners `#arrangement` notice → P2 fine print (verbatim).
5. The hero city hint and the send note → C22 (verbatim).
6. Services outsourcing hint "Provided by Cargado Strategies itself, not by a partner. Nothing is sent until you tap send." → split: the first sentence goes to S5 fine print and the second to C22. Both are verbatim.
7. The Home founder `.offer__fine` lines → door fine print (verbatim).
8. Legal draft band: the text is verbatim, the dash is visually hidden (R4).

**Result:** the site goes from 36 content scenes to 32: Home 6, Services 8, Story 5, Partners 6 and Legal 7, each counting its `#close`. Every page adds one `#credits` footer scene on top of that. Home takes 6 gestures to the footer. Visible words per scene drop from about 130 to ≤ 60, with ≤ 40 as the design target.

---

## 11. How Round 5 supersedes or reuses Round 4

**Round 4 is not built yet.** The Round 5 build performs the Round 4 work that still applies, so nothing is built twice.

### Applies unchanged
| Round 4 section | status |
|---|---|
| `engine.md` **§C removals** C1-C4 (with `shared.md` §7.7) | **unchanged**; stage 1 runs it |
| `engine.md` **A3-A6** (input intent, wheel flick and momentum lock, keyboard) | unchanged as input logic; the output becomes `film.cut` (§9.1-9.2) |
| `engine.md` **A8** (goTo, deep links, focus, scroll cue) | unchanged, plus aliases (§9.4) |
| `engine.md` **B1** pan as the < 560 px fallback, **B2** flow and reduced-motion mode, **D4** fallback | unchanged |
| `engine.md` **A13** tests | unchanged for desktop; the touch tests are replaced by §13 T7 |
| `shared.md` **§1** decisions D1-D18, D20-D22, D25 | unchanged |
| `shared.md` **§2** file map | unchanged, plus the new R5 files (build-order.md) |
| `shared.md` **§3** scene-box tokens (`--scene-*`, `--header-h`, `--bottom-h`, `--banner-h`, spacing) and the token rules | unchanged; R5 §3 includes them verbatim |
| `shared.md` **§4** scene box markup and CSS, flow mode | unchanged |
| `shared.md` **§5.1** utilities, **§5.2** heading rule, **§5.4** credits scene and its gate | unchanged (credits gains §6.4 content) |
| `shared.md` **§6** components: `ui-tabs`, `ui-pager`, `ui-stepper`, `ui-dialog`, `ui-accordion`, `ui-focus`, `globe-fit` | unchanged API and a11y; R5 skins only |
| `shared.md` **§7.1-7.4** API, key ownership, `[data-swipe-x]`, the overflow-only rebuild | unchanged |
| `shared.md` **§8** fit-audit items 1-11 | unchanged; R5 adds §13 checks |
| `shared.md` **§9** bands | unchanged |
| `services.md` finder spec (search, map, results pager, partners-max fixture, `check-config` caps), categories rail and detail, inquiry stepper fields and FR08 | unchanged inside the gated finder, the categories dialog and S7 |
| `partners.md` stepper a11y, `pageWhen`, field list and validation | unchanged (P5 re-groups the steps to 4) |
| `legal.md` §3.2 banner height, §3.3 dash, §5.1 paged reader, §5.2 drill Q&A, `--ph-repeat=3` | unchanged |
| The **verbatim compliance lists** in `home.md`, `services.md`, `story.md`, `partners.md` and `legal.md` | unchanged; they feed `tools/compliance-diff.mjs` |

### Replaced
| Round 4 section | replaced by |
|---|---|
| `engine.md` **A1, A2, A5** (the glide model and scrubbed hold points), **A9** field-focus touch rule, **A10** SFX | §9.1 cuts; §9.3 touch-cut; §8 sound |
| `engine.md` **A7** touch snap and `shared.md` **§7.5** field hold **on coarse pointers** | §9.3 (native snap). The field hold stays on fine pointers |
| `engine.md` **D2-D3** display tokens (`--fs-hero` and so on) | §3 v2 type scale |
| `shared.md` **§5.3** text floor (the 11-12 px exemptions) | the hard 14 px floor (`--fs-label`); `--fs-note` 15/16; the legal draft text at 14 px; **no exemptions below 14 px** except © (14 px too) |
| `shared.md` **§7.6** SFX `page` voice | not built (§8) |
| `shared.md` **D23** (the phone WhatsApp icon was not adopted) | adopted: the header icon (§6.2) |
| `engine.md` **C3** (no toggles anywhere) | toggles stay out of the header; the footer and menu get the C37 switches (owner question O3) |
| Every page spec's **scene list, layouts, copy and "SHARED" sections** (`home.md`, `services.md`, `story.md`, `partners.md`, `legal.md`) | §7 of this file |
| `build-order.md` (Round 4) | `plan/round5/build-order.md` |
| PLAN.md Round 1 "everything scrubbed" and the Round 3 decode, letter-roll, per-character splits, tilt everywhere, the globe on every page and the splash on every load | §4.4, §9 and W1 (once per session) |

---

## 12. Performance budget

Measured on `dist` (`npm run build`) by `tools/perf-gate.mjs`, which fails the build when a budget is missed.

| metric | phone (Lighthouse mobile: Moto G Power, 4× CPU, slow 4G) | desktop |
|---|---|---|
| Lighthouse Performance | **≥ 90** on every page | **≥ 95** on every page |
| Accessibility / Best Practices / SEO | 100 / ≥ 95 / ≥ 95 | same |
| LCP | ≤ 2.0 s (Home ≤ 1.8 s target) | ≤ 1.0 s |
| TBT | ≤ 150 ms | ≤ 50 ms |
| CLS | ≤ 0.02 | ≤ 0.02 |
| INP (lab, via a click on the sheet chip) | ≤ 150 ms | ≤ 100 ms |
| JS initial, gzip | ≤ 70 KB (GSAP core ≈ 27, engine ≈ 14, page ≈ 10, dotglobe + data ≈ 10) | ≤ 110 KB (adds Lenis and the cursor) |
| JS, legal, gzip | ≤ 40 KB, with no dotglobe, stars or cursor | ≤ 40 KB |
| CSS, gzip | ≤ 28 KB per page | same |
| Fonts | Manrope 400/500/600 and Poppins 500/600 latin subsets, `font-display: swap`, ≤ 5 files, size-adjusted fallbacks; Tinos 400 and italic only where Times is missing | same |
| Images | none required; the brushed tile ≤ 6 KB; the portrait (when present) ≤ 80 KB at 800w AVIF | same |
| Total transfer, Home | ≤ 300 KB | ≤ 380 KB |
| DOM nodes per page | ≤ 900 | ≤ 900 |
| Composited layers | < 30 | < 30 |
| Long tasks after load | none > 50 ms in a 4× CPU trace of 3 cuts | none > 50 ms |
| Cut frame rate | ≥ 55 fps at 4× CPU (tier B) | ≥ 58 fps |
| Idle CPU | 0 rAF callbacks 6 s after the last input (every loop asleep) | same |
| Splash | ≤ 1.1 s, once per session, skippable in 150 ms | same |

**Rules that keep the budget:**
- HTML-first: the header, nav, hero text, CTA and posters are in the HTML.
- Word splits and kerning are done at build time.
- Page modules load per scene on idle.
- `will-change` is set only during a cut.
- No DOM reads happen in cut or progress handlers.
- One pointer hub with cached rects.
- No `mix-blend-mode`.
- No `backdrop-filter` on tiers B and C.

---

## 13. Acceptance tests (every one must pass; stage 7 runs them all)

**T1 · Fit (the R4 contract, extended).**
- **Command:** `node tools/fit-audit.mjs http://localhost:8000/ <page>.html --vp=1920x1080,1536x864,1440x900,1366x768,1280x720,1024x768,768x1024,390x844,360x740 --states=tools/fit-states/<page>.mjs`, plus `--flow`, plus `--touch` (new: emulates a coarse pointer, `touch-cut` mode), plus the fixtures (services `--fixture=partners-max`, legal `--ph-repeat=3`).
- **Pass:** **0** in every run for Y overflow, X overflow, inner scrollers, clipped and small-text (< 14 px anywhere; reading text < `--fs-note`).
- **The R5 additions** (new failures):
  - `words` > 60 per scene (fine print and `[data-compliance]` excluded);
  - `elements` > 12;
  - `groups` > 3;
  - `whitespace` < 18% (the union of `[data-group]` boxes against the safe box);
  - `archetype-repeat` (two neighbours with the same `data-archetype`, legal excluded);
  - `longword` (a mega word over 9 letters below 760 px not stepped down);
  - `gold-fields` > 1 per page;
  - `irises` > 3 per page.
- **Spare:** `#credits` ≥ 24 px, form columns ≥ 40 px in the all-errors pass, and sheets and dialogs ≥ 24 px at 360×740.

**T2 · Performance.** `node tools/perf-gate.mjs` on `dist`. Every budget in §12 passes on all 5 pages. Lighthouse Performance is ≥ 90 on mobile and ≥ 95 on desktop.

**T3 · Console.** 0 errors and 0 warnings on all 5 pages in the film, touch-cut and flow modes, and with `?review=1`. Checked through CDP: load, cut through every scene forward and back, open every dialog and sheet, and run every stepper.

**T4 · Compliance diff.** `node tools/compliance-diff.mjs` compares `plan/round5/compliance-baseline.json` (snapshotted in stage 0 from the current `site/`) against the built pages.
- Every baseline sentence and every `[bracket]` must be present on the same page, or at a destination listed in §10.
- Moves need `plan/round5/compliance-moves.json` (the §10 list).
- **0 missing and 0 altered.**

**T5 · Seek test (no dead air).** `node tools/seek-test.mjs` pauses every cut at 25%, 50% and 75% and takes screenshots. A frame fails if the scene box has under 2% non-field pixels (an "empty field"), or if text sits on the wrong field.

**T6 · Motion and a11y.**
- Every autonomous animation stops ≤ 5 s after the last input: a CDP trace shows 0 rAF callbacks at 6 s.
- `prefers-reduced-motion` and the footer switch both give crossfades only, with no splash animation, deal-in or drift.
- Keyboard: every scene is reachable with PageDown and Space, and Tab never lands in a hidden scene.
- axe: 0 violations.
- Focus is never hidden under the header.
- Every target is ≥ 44 px.
- Contrast is ≥ 4.5:1 for text and ≥ 3:1 for UI on every field.

**T7 · Devices.**
- **iOS Safari and Android Chrome**, real or the best emulation available, with the limits recorded: one swipe = one scene, no momentum skips, the sheet keyboard does not push a scene off, and the field never shows behind the wrong text.
- **A trackpad fling on desktop:** exactly one scene per flick (R4 A13).

**T8 · Re-judge.** Eight read-only judges re-score the built `dist`, using the same rubrics as `plan/round5/judge-*.md`: content, layout, mobile-a11y, motion, performance, typography, ux-conversion and visual.
- They look at screenshots at 1440×900, 1280×720, 390×844 and 360×740, a screen recording of Home, and the T1-T7 reports.
- **Every lens must score ≥ 8 / 10 overall.** The baseline was 4-6.
- A lens below 8 sends its top findings to stage 6 fixes. There are at most 2 loops; after that the orchestrator reports the remaining gaps to the user.

**T9 · Build.** `npm run build` passes, including `check-config`. `dist` serves at `npm run serve` with no 404s (checked by a CDP network log).

---

## 14. Owner questions (built with these defaults; nothing waits)

| # | question | built default |
|---|---|---|
| O1 | Founder's name, portrait and story facts | `[First name]`, `[Last name]` and the typographic portrait; `FOUNDER_PHOTO` empty |
| O2 | Hero headline | `HERO_VARIANT: 'network'` ("The Right Professional, Near You."); the triad is one config switch away |
| O3 | Footer "Sound" and "Motion" switches (they reopen R4 C3, outside the header) | **built and visible** (`FOOTER_SWITCHES: true`); this is the WCAG 2.2.2 answer |
| O4 | Hide fake-proof slots until they are real (`data-when`) | **on**; review mode `?review=1` shows them; compliance and identity brackets stay visible always |
| O5 | Gate the finder until partners exist | `FINDER_MIN_PARTNERS: 3`; the concierge until then |
| O6 | Client review of the Home vertical slice | the internal slice gate (build-order stage 3) stands in; send the client the slice and the final build after the push |
| O7 | dotglobe fidelity versus three.js | dotglobe ships; three.js on tier A after first input only if the review says it reads flat |

**Risks:**
- R1: content dependency (O1).
- R2: the engine rewrite (§9) is the largest item; it must pass the R4 A13 tests plus T5 and T7.
- R3: fit at 360×740 and 1280×720 with monument type (use the statement size on closes, `.short-hide`, and the caps given per scene).
- R4: a sticky input lock (queue one step; Home, End and nav are instant).
- R5: dotglobe looking flat (halo and depth sizing; O7).
- R6: Firefox has no View Transitions (it gets a plain navigation).
- R7: Tinos Italic on Android adds about 20 KB (400 italic only).
