# Cargado Strategies — website build plan

Sources: `Cargado-Strategies-Proposal-SRS (1).pdf` (SRS Draft 0.4) and `Cargado-Wireframes.html` (wireframe passes 1–5; pass 5 is the latest layout, pass 4 is the offer copy).
Extracted text lives at:
- SRS: `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\srs.txt`
- Wireframes: `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\wire_text.txt`

Output: a static site in `C:\Cargado Strategies\site\` (no build step; plain HTML/CSS/ES modules; libraries from CDN with pinned versions).

---

## 1. Creative direction — "the film"

Every page is a fixed full-screen **stage**. Scrolling scrubs a master GSAP timeline instead of moving the page. A tall empty `.scroll-spacer` drives progress. All content is `position: fixed` inside the stage.

- GSAP 3.12.5 + ScrollTrigger (`scrub: true`) for every scroll-linked animation.
- Lenis 1.1.13 synced to GSAP's ticker:
  `lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);`
- three.js 0.160.0 (ES module) for one persistent 3D object.
- Everything is scrubbed and reversible. No one-shot timers for scene choreography.
- Only `transform`, `opacity`, `clip-path` are animated (60fps).
- `prefers-reduced-motion: reduce` → the film is switched off: `html.rm` class, scenes become ordinary stacked sections in normal document flow, no Lenis, no star motion, 3D object static (or hidden), iris transitions off.

### Palette — BLACK AND GOLD (founder's instruction; overrides the SRS §8 blue palette)

Fields (scene backgrounds) — the prompt's ink / red / bone mapped to black and gold. The field formerly called `royal` is now `gold`; use the field names `ink`, `gold`, `bone` everywhere.

| field  | background | text | notes |
|--------|-----------|------|-------|
| `ink`  | `#0B0B0C` (near-black) with a faint warm radial of `#1A1712` | `#F3ECDD` (warm ivory); accents gold `#D4AF37` | stars most visible (warm white/gold) |
| `gold` | `#C9A24A` (rich metallic gold; may use a subtle gold gradient `#B8913A → #D9B862` built as a static background, never animated) — replaces the prompt's "red" | `#0B0B0C` | buttons invert to black with gold text |
| `bone` | `#F5F0E6` (warm ivory/champagne) | `#0B0B0C`; gold text must use the dark gold `#7A5C12` for AA | stars fade to near 0 |

Tokens: black `#0B0B0C`, charcoal `#1A1A1C`, gold `#D4AF37`, gold-deep `#B8913A`, gold-dark (text on light) `#7A5C12`, champagne `#E9DCB8`, ivory `#F5F0E6`, white `#FFFFFF`. Gold is the accent and the leading-rule colour; no blue anywhere. The globe and monogram are gold on black. All text/background pairs must meet WCAG 2.1 AA (verify gold-on-ivory uses gold-dark).

Between scenes the background changes with an **iris**: the incoming scene's field layer is revealed with `clip-path: circle(r at x y)` expanding from 0% → 150%, scrubbed. Origin per scene via `data-iris="x% y%"` (default `50% 50%`). When two adjacent scenes share a field, use a plain opacity crossfade instead.

### Persistent layers (fixed, react to scroll progress)
1. `#stars` — canvas star particles; parallax by progress, speed rises with scroll velocity (from Lenis), opacity follows the field (high on ink, mid on gold, ~0.08 on bone).
2. `.grain` — film grain overlay (SVG feTurbulence noise as a CSS background, animated by translating a pre-rendered noise tile with `steps()` — transform only), `mix-blend-mode: overlay`, low opacity.
3. HUD — four corner brackets + a thin progress readout (Poppins, tiny caps): scene index `03 / 12`, scene name, and a timecode-style progress `00:42` derived from playhead. HUD colour follows field.
4. Cursor ring — custom ring that lerps to the pointer, grows over interactive elements, hidden on touch devices and in reduced motion. Native cursor stays visible for usability (ring is decorative).
5. `#gl` — three.js canvas: the **network globe** — a sphere of points (partners across Canada) with a few great-circle arcs (connections), plus a thin inner wireframe icosahedron. Brand colours. Each scene declares a pose: `data-pose="x,y,z,rx,ry,s"`; the engine tweens the object between poses on the same scrubbed timeline (plain JS object tweened by GSAP, applied in the render loop). Pixel ratio capped at 1.75; pauses rendering when tab hidden.
6. Header (fixed): CW monogram logo + "cargado strategies", nav (Home, Services, Our story, Become a partner), Facebook link (new tab, `rel="noopener"`), WhatsApp button. Header colour follows field.
7. Floating WhatsApp button on every page (FR18), message names the page. On phones (<760px) a sticky bottom action bar replaces it (wireframe 5d).

### Scene engine contract (`assets/js/film.js`)

Markup:
```html
<div class="stage" aria-hidden="false">
  <div class="fields"></div>            <!-- engine creates one .field layer per scene -->
  <canvas id="stars"></canvas>
  <canvas id="gl"></canvas>
  <div class="grain"></div>
  <div class="hud">…</div>
  <main class="scenes">
    <section class="scene" id="hero" data-field="ink" data-dur="5" data-iris="70% 40%" data-pose="1.4,0,0,0.2,0.6,1" data-title="Introduction">
      <div class="scene__inner"> … content … </div>
    </section>
    …
  </main>
</div>
<div class="scroll-spacer"></div>
```

Animation hooks inside scenes (engine reads them, no per-page choreography code needed for the common case):
- `[data-reveal="lines"]` — heading split into lines (own splitter, no paid plugin); each line wrapped in an `overflow:hidden` mask and slides up from `yPercent:110`; stagger 0.06–0.08.
- `[data-reveal="fade"]` — opacity + y 24px.
- `[data-reveal="stagger"]` — direct children fade/rise with 0.06 stagger.
- `[data-reveal="scale"]` — opacity + scale 0.96 → 1.
- Out: opacity → 0, y −24px, scale 0.98; text lines staggered out.
- Scenes overlap their neighbours by ~12% of duration.
- Pages may register extra scrubbed tweens through `film.on('build', ({tl, sceneStart, sceneEl}) => …)`.

Behaviour:
- Scroll spacer height = total duration × `PX_PER_SECOND` (≈ 0.9 × innerHeight per second; recomputed on resize).
- The scene whose slice contains the playhead gets `.is-active` (`pointer-events:auto`, `visibility:visible`); others are `pointer-events:none` and `inert` when fully hidden so keyboard/screen readers don't land in invisible content.
- `film.goTo(sceneId)` scrolls (Lenis) to the scene's "fully in" point. Nav anchors `#sceneId` and `?#` deep links use it on load (FR05: Home tiles → `services.html#legal` opens the legal category).
- Keyboard: PageDown/Space/arrow keys work via native scroll; `focusin` inside a non-active scene calls `goTo` for that scene.
- Scenes whose content can be taller than the viewport use `.scene__scroll` (internal `overflow:auto`, `data-lenis-prevent`).
- Resize → `ScrollTrigger.refresh()`; mobile uses `100svh`.

### Typography
- **Display**: Josefin Sans **300** ("Joselight"), `text-transform: uppercase`, letter-spacing `0.02–0.06em`, line-height 0.95–1.05, sizes `clamp()` (hero up to ~7.5rem).
- **Body**: Manrope 400/500/600, 1rem–1.125rem, line-height 1.6.
- **UI** (buttons, labels, chips, HUD, eyebrows, numerals, form labels): Poppins 400/500/600; eyebrows/HUD in small caps-tracking uppercase.
- Google Fonts: `Josefin+Sans:wght@300;400`, `Manrope:wght@400;500;600;700`, `Poppins:wght@400;500;600`.

### Design rules from wireframe pass 5
One main action per scene; 12-column grid with uneven splits (7/5, 6/3/3); rules and dividers instead of boxes; big gaps between groups and tight inside; lists with dividers not card grids; one gold top rule marks the leading element.

---

## 2. Content and compliance (must hold on every page)

- WhatsApp: `https://wa.me/12048692508?text=…` (number +1 (204) 869 2508). Prefilled text names the page/category and asks for service + city/province, says why (CR10, FR18–19). "Nothing is sent until you tap send."
- Facebook link in header and footer, new tab (FR17). URL is a placeholder constant in `assets/js/config.js` until the founder supplies it.
- Never invent partners, people, photos, reviews or licence numbers (CR16). Where no partner exists: placeholder card reading **"Partner spot available"** linking to Become a partner. No "verified" badge (CR02).
- Finder results: sorted by distance only, "not a recommendation", partners are independent, Cargado may receive a commission (FR29–31, CR14, CR17).
- Founder's three businesses are labelled as hers, each with company name/licence/regulator placeholders in [brackets] (CR01, CR13). Strategy service: "strategy and coaching only — not licensed accounting, tax or investment advice" (CR12).
- Partner page: no promise of referrals, outcomes or endorsement (CR04). Tiers Community / Growth / Premier (FR11) with bracketed terms.
- Faith identity subtle: Mark 11:24 as a *reference only* on the story page/logo story — do not quote the verse (CR08, CR15).
- Location: ask for city or area and say why (CR10).
- Anything the founder must confirm stays in `[brackets]` styled as a visible placeholder token (`.ph`).
- Tagline: "Connected by Purpose. United in Service."
- Legal pages carry a "Draft — to be reviewed by a lawyer in Canada before launch" banner.

---

## 3. Pages and scenes

### `index.html` — Home (wireframe 5a + 4a, FR01, FR05, FR24)
1. **hero** (ink) — eyebrow "Free introductions · across Canada"; H1 "The right professional near you, from one message."; sub; ticks (no fee to you · no obligation · licence checked); intro form card: "1 · What do you need?" chips (mortgage, insurance, lawyer, real estate, tax, not sure) + "2 · Your city" → "Get my introduction on WhatsApp →". Proof strip: [n] introductions · [n] licensed partners · [n] cities · ★ [rating] on Facebook. Globe right.
2. **film** (ink→bone iris) — "What we do, in one minute": poster + play button; video from config, captions track, no autoplay with sound (FR24); fallback "Founder video coming soon".
3. **situations** (gold) — "Sounds like you?" numbered list 01–04 → services deep links.
4. **compare** (bone) — "One message instead of five searches." on your own vs with Cargado.
5. **process** (ink) — Now / within [24h] / day [3].
6. **founder** (bone) — "From our founder: three things she does herself." 6/3/3.
7. **services** (gold) — 9 category tiles → `services.html#<slug>` (FR05).
8. **finder-teaser** (ink) — map-of-Canada preview, "Find a partner near you →".
9. **story-teaser** (bone) — C·W monogram, "W for Wealth. C for Cargado." → story.
10. **partner-cta** (gold) — for professionals → partners.html.
11. **faq** (bone) — "Straight answers." accordion (why is it free / do I have to hire them / how do you choose who to show me / what happens to my information).
12. **close** (gold→ink) — "One message. The right person. Close to you." + footer.

### `services.html` — Services (3b + 5c + 4b, FR02–FR07, FR22, FR25–FR31)
intro + jump rail → three founder businesses (insurance / business strategy incl. "30-day cash-flow clean-up" offer / outsourcing) → **finder** scene (category + type filter, clickable province map of Canada + city/postal search box, results sorted by distance with distance shown, widen-radius state, placeholder card + WhatsApp request, "what happens next" column, notices) → **categories** scene (rail + detail; each category: description, types, partner list or placeholder cards; deep link by hash) → **inquiry** scene (FR07 form → WhatsApp prefill / mailto, consent box, commission notice, honeypot; success state FR08) → close/footer.

### `story.html` — Our story (3c, FR15, FR23)
hero "Built to serve people, one connection at a time." → founder story (draft with brackets) → logo story (globe morphs/turns to sit behind a large C·W monogram; W = Wealth, C = Cargado, "Mark 11:24" as quiet reference) → mission & values (integrity, service, responsible growth) → network of independent partners → talk to us / footer.

### `partners.html` — Become a partner (4c + 3d, FR10–FR11)
hero offer → what you get (pre-qualified, same-day hand-off, shown by distance) → tiers Community / Growth / Premier → founding partner offer [brackets] → what we ask (licence, quick replies, code of conduct) → application form (business details, category, licence # + issuing body, service area, references, Code of Conduct checkbox) → close/footer.

### `legal.html` — Legal (3e, FR16)
draft banner + contents → Professional disclosure → Privacy policy → Terms of use → Partner code of conduct → Q&A → footer. Long text uses `.scene__scroll`.

---

## 4. Files
```
site/
  index.html services.html story.html partners.html legal.html
  favicon.svg
  assets/css/base.css        tokens, fonts, fields, stage layers, HUD, cursor, header, footer, buttons, forms, reduced-motion flow
  assets/css/<page>.css      page-specific styles only
  assets/js/config.js        phone, FB url, video url, email, categories (+types), placeholders
  assets/js/film.js          engine (Lenis + GSAP + scenes + iris + reveals + active/inert + goTo)
  assets/js/layers.js        stars, grain, HUD, cursor
  assets/js/globe.js         three.js object + poses
  assets/js/chrome.js        header/footer/WhatsApp injection, mobile bar, links
  assets/js/whatsapp.js      message builders
  assets/js/<page>.js        page-specific (finder.js, forms.js, …)
  assets/data/canada-provinces.json   simplified province geometry (or inline SVG)
  assets/data/cities.js      Canadian cities with lat/lon for search + distance
```

## 5. Workflow
1. **Foundation** — engine, layers, globe, chrome, base CSS, config, logo/favicon, a smoke-test page.
2. **Pages** (parallel pipeline) — each page built against the engine, then immediately browser-QA'd (desktop 1440×900 + phone 390×844, console clean, scrub forward/back, reduced motion) and fixed.
3. **Review panel** — compliance vs SRS, accessibility + reduced motion, performance/60fps + code quality, visual consistency across pages.
4. **Fix + final verification.**

---

# Round 3: type, performance, sound, interaction, 3D, splash (2026-10-17)

The user's requests, in order:
1. **Display type → Times New Roman** in place of Josefin Sans Light in all caps. Headings use **Title Case**, with no `text-transform: uppercase`. Font stack: `"Times New Roman", Times, Tinos, serif`. Tinos (metric-compatible, Google Fonts) is only downloaded on devices without Times New Roman, such as Android. Body stays Manrope and UI stays Poppins. Small eyebrow and HUD labels stay as tracked small uppercase UI labels; every heading, title, button label and nav item is Title Case. Load Josefin Sans nowhere.
2. **PageSpeed Insights: good performance on every device** (target Lighthouse Performance ≥ 90 on mobile and desktop, plus good Accessibility, Best Practices and SEO).
   - Production build with esbuild: one minified bundle per page, three.js tree-shaken from npm, minified CSS, into `C:\Cargado Strategies\dist`.
   - Preconnect and preload; `font-display: swap`; no render-blocking scripts.
   - The 3D globe is lazy-loaded after first paint, on idle. Low-power devices get a lighter globe or a static fallback: `saveData`, `deviceMemory` ≤ 2, or `hardwareConcurrency` ≤ 2.
   - Every rAF loop pauses when the tab is hidden or there is nothing to draw. Star count and DPR adapt to the device.
   - No layout shift (CLS ~0): splash and fonts are sized, and fallback fonts are size-adjusted.
   - LCP: the splash and hero text are in the HTML and paint immediately.
3. **SFX** (the user typed "sfc"; read as sound effects) on every scroll, animation and click, synthesized with the Web Audio API (no audio files):
   - a soft tick per scroll step;
   - a whoosh or tone when the scene changes or the background opens to a new colour;
   - click blips;
   - quiet hover ticks;
   - a splash chime.
   Keep it tasteful and quiet, mixed through one master gain. Audio unlocks on the first pointerdown or keydown, as browsers require. A speaker toggle in the header (and the phone menu) is remembered in localStorage. Never play while muted. Throttle the sounds so they never stack into noise.
4. **Text animations**: character and word splits, a scrubbed decode/scramble on eyebrows (as in the Portfolio's decode.js), letter-roll on buttons and nav when hovered, and per-character staggered reveals on headings. All scrubbed and reversible where they are scroll-linked.
5. **Everything reacts to the cursor**:
   - magnetic buttons;
   - 3D tilt on cards and panels, with depth layers;
   - a spotlight glow that follows the cursor;
   - chips that spring;
   - inputs that glow;
   - a cursor ring that morphs (grows over links, becomes a bar over text inputs, shows a label over cards).

   Touch devices get tap feedback instead.
6. **3D elements and interfaces across the whole site**:
   - CSS 3D: perspective stages, panels that tilt in depth, scene in/out with `rotateX`/`translateZ` depth;
   - layered cards with `translateZ` children;
   - a 3D flip on the FAQ;
   - the 3D globe present on every page.

   Animate only transform, opacity and clip-path.
7. **Text and paragraph shape**: `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs, reading measure of 55–70ch, no orphans or widows in headings, consistent leading, rag-friendly widths, Title Case fixed throughout.
8. **Text links**: an animated line underneath on hover and focus, scaling in from left to right with `transform`.
9. **Splash screen** on every load or refresh: CW monogram, progress line and wordmark in black and gold; it opens with an iris reveal into the hero. It is in the HTML, so it paints instantly, and is dismissed when ready (minimum about 0.9s, maximum about 2.2s). With reduced motion it fades quickly. It never traps focus, and the content is still announced.

Reduced motion keeps its meaning: no tilt, magnetic pull, parallax or splash animation. SFX is not motion, but it always respects the mute toggle.

# Round 4: one screen per section, scroll only moves between sections (2026-10-17)

## What the user asked for
"Redesign the layout of each page/section so it exactly and perfectly fits the entire screen, so there is no need to scroll more on one part of it. Only scroll when you want to move to another one."

Plain meaning:
1. **Every scene fits one screen.** No scene may be taller or wider than the viewport. Today the film pans tall scenes (`film.js` pan segments, `film-map.js` pan). After this round the pan must never trigger, and no inner scroll boxes are allowed either (`overflow:auto` lists count as "scrolling more on one part").
2. **One scroll gesture = the next scene.** Scrolling is only for moving between scenes. A wheel flick, swipe, PgDn/arrow key or Space advances exactly one scene and settles on it. A small nudge that stops mid-transition settles back to the nearest scene. Nothing is ever left half-way.

## Same round, already queued (done first, it frees space)
- Remove the HUD (`01 / 08 · Title · 00:00`, its progress bar and corners): `layers.js` initHud + base.css + film-alive HUD drift.
- Remove the floating WhatsApp button (`.wa-float-wrap`) and the phone bottom bar (`.phone-bar`, services.js barFor).
- Remove the sound toggle and the Pause animation toggle from the header. SFX stay on. Reduced motion still follows the OS setting. Keep `motion-pref.js` reading the OS preference.
- Remove every decorative dash or line placed before text: `.hud__sep`, `.story-cue__line`, the rule before "Mark 11:24", eyebrow lead rules, "— " list prefixes. In-word hyphens ("30-day", "Cash-Flow") stay.
- Already done by hand: the services insurance credential box was replaced by its two buttons; "Total value / Your price" was removed; the finder "Want Us to Find Someone" / "No One Close Enough?" box was removed.

## Fit contract (the acceptance test)
`node tools/fit-audit.mjs` must report **0 overflow** (Y and X) for every scene at:
1920x1080, 1536x864, 1440x900, 1366x768, 1280x720, 1024x768, 768x1024, 390x844, 360x740.
- The audit is hardened first, so X overflow ignores clipped and aria-hidden decoration and counts only real visible content. It also flags inner scroll containers.
- Short-landscape phones (height < 560) are the one allowed fallback: there the scene may pan, and that is documented.
- Flow / reduced-motion mode: each section is `min-height:100svh` with `scroll-snap-type: y mandatory`. The same content must fit 100svh.

## Design toolkit (in order of preference)
1. **Viewport-aware sizing.** Use one fluid scale driven by `min(vw, vh)`: display type, spacing and 3D panel sizes shrink on short laptop screens (1366x768, 1280x720) instead of overflowing. Use `svh`/`dvh`, never fixed px heights.
2. **Re-layout.** Two or three columns on wide screens, cards in grids instead of stacks, and less vertical padding inside the scene. The header height is subtracted once.
3. **Split a scene in two** where the content is really two ideas, e.g. strategy "The offer" + "What you get"; the close/footer becomes a compact one-screen footer.
4. **In-scene paging**, never inner scroll:
   - steppers for long forms: the partner application and the services inquiry become 3–4 short steps with Back/Next inside one scene, with validation per step and the WhatsApp summary at the end;
   - tabs or segmented controls (finder on phone: Map | Results);
   - paged lists: finder results show N that fit, with "Next 3";
   - carousels with buttons for card rows (tiers, values, categories on phone).
   - All of it keyboard and screen-reader accessible (aria-live step announcements, focus moved to the step heading).
5. **Disclosure as overlay.** Secondary detail (partner profile, category detail) opens as an in-scene panel or dialog that fits the screen, not as extra height.
- **Never remove compliance copy** (commission/independence notices, "strategy and coaching only", placeholders). It may be shortened only where the meaning is unchanged, and moved but not dropped.

## Scroll behaviour (engine)
- `film-map.js`: pan segments become dead code once everything fits. Keep them as the < 560px-tall fallback only.
- New `film-snap.js`:
  - After input stops (wheel idle ~140ms, touchend, key), Lenis glides to the target scene's hold point.
  - The target is the next/previous scene if the gesture moved more than about 18% of a transition in that direction, otherwise the nearest scene.
  - Wheel and touch deltas larger than a threshold during a hold advance one scene, so one flick = one scene. Momentum is locked so a trackpad fling doesn't skip several scenes.
  - Keys: ArrowDown/PageDown/Space go next; ArrowUp/PageUp/Shift+Space go back; Home/End.
  - It is disabled while focus is in an input/select/textarea, and while a dialog is open.
  - Deep links and goTo still work.
- Reduced motion / flow mode: native CSS scroll-snap, sections exactly one screen.

## Process
- **Design (read-only, can run while Round 3 finishes):** per page, measure (fit-audit) → redesign spec per scene per breakpoint → adversarial critic → final spec in `plan/round4/<page>.md`, plus `plan/round4/engine.md`.
- **Build (after Round 3 completes):**
  1. removals;
  2. engine snap + shared fluid scale in base.css;
  3. pages in parallel, each looping fit-audit until 0;
  4. cross-page review (a11y, compliance copy diff, interaction/SFX hooks still wired, reduced motion);
  5. fix;
  6. `npm run build` → dist, Lighthouse, final fit-audit table.
