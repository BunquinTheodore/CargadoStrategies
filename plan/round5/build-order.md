# Round 5 · Build order and file ownership

The spec is `plan/round5/DIRECTION.md`. It wins on conflicts, and its §11 says which Round 4 sections (`plan/round4/shared.md`, `engine.md`, the page specs) still apply unchanged. This file replaces `plan/round4/build-order.md`.

Paths are relative to `C:\Cargado Strategies\`. **One owner per file per stage.** Any agent may read anything. The dev server at `http://localhost:8000` is never stopped.

## Order

```
Stage 0  Preflight                          (orchestrator, sequential)
Stage 1  Removals                           (1 agent; R4 engine §C + R5 deletions)
Stage 2  Foundation                         (5 agents in parallel, disjoint files)
           2a engine   2b design system + shared UI + shared HTML pass   2c visuals   2d sound/WhatsApp/config   2e tools
         → gate G2
Stage 3  Home vertical slice                (home agent alone) → gate G3 (slice re-judge)
Stage 4  Rollout                            (4 page agents in parallel; home keeps polishing its own files)
           services   story   partners   legal   (+ home)
         → each loops fit-audit until 0, gate G4 per page
Stage 5  Review                             (read-only: 8 lens re-judges + 4 specialist reviewers → findings)
Stage 6  Fix                                (findings routed by the ownership map; ≤ 2 review/fix loops)
Stage 7  Release                            (orchestrator: build, T1–T9, docs, git commit + push)
```

---

## Stage 0 · Preflight (orchestrator)
1. **Confirm nothing else is editing `site/`.** The modification times of `site/**` must stay unchanged for 2 minutes, and no other agent or session may report it as active. If something is editing it, wait. Never start stage 1 over live edits.
2. **Git:**
   - run `git status` in `C:\Cargado Strategies`;
   - commit any finished pre-existing work as its own commit only if the user's earlier rounds left it uncommitted (`chore: snapshot before round 5`);
   - create the branch `round5-full-stop`.
3. **Baselines,** written into `plan/round5/`:
   - `baseline-r5-fit.txt`: fit-audit at the 9 viewports, film and flow;
   - `baseline-r5-lighthouse.json`: mobile and desktop, all 5 pages, on a fresh `npm run build`;
   - `compliance-baseline.json`: every `.notice`, `.hint`, `.offer__fine`, `.legal-draft*`, `.fineprint`, `details` answer and `.ph` text per page, plus every sentence containing "commission", "independent", "coaching only", "not a recommendation", "tap send", "Provided by Cargado", "We only message from", "Mark 11:24", "Draft" or "Connected by Purpose". Write it with a throwaway script in the orchestrator's scratchpad.
4. **Write `plan/round5/compliance-moves.json`** from DIRECTION §10, the compliance-moves list.

## Stage 1 · Removals agent
This is the only stage that touches page files and shared files together. It makes **only** these edits:
- **R4 `engine.md` §C1-C4, as amended by R4 `shared.md` §7.7:**
  - the HUD;
  - the floating WhatsApp button and the phone bar;
  - the motion and sound toggles;
  - decorative dashes and rules before text;
  - the legal draft dash, which becomes visually hidden (R4 legal §3.3).

  The exact file list is R4 build-order Stage 1, unchanged.
- **The R5 deletions:**
  - delete `site/assets/js/film-alive.js` and `motion-toggle.js`, and their imports (`main.js`, `layers.js`);
  - in `textfx.js`, delete the decode scramble, the letter-roll and the per-character split paths, keeping word reveals;
  - in `interact.js`, delete `[data-tilt]` everywhere except `.tier`, `[data-depth]` parallax and the spotlight glow;
  - in `cursor.js`, delete the cursor label bubbles (the ring stays);
  - in `layers.js`, delete star streaks and the velocity coupling (the rest is rewritten by 2a and 2c);
  - delete `home-video.js`, `home-needs.js` and `home-map.js`, and their imports in `home.js` (leave the scenes; stage 3 rebuilds them);
  - in **every HTML file**, remove the `data-decode`, `data-roll`, `data-tilt` (except tiers), `data-depth` and `data-cursor-label` attributes.
- **It does NOT delete** `globe.js`, `globe-fallback.js` or three.js: 2c retires them once `dotglobe.js` is wired.
- **Docs:** `site/ENGINE.md` and `site/README.md`, to remove the mentions only.
- **Verify:** all 5 pages load with a clean console, fit-audit runs (overflow is allowed at this stage), and `npm run build` passes.

---

## Stage 2 · Foundation (5 agents in parallel)

### 2a · Engine agent (DIRECTION §9, R4 engine A3-A6 and A8, R4 shared §7.1-7.4)
- **Owns:**
  - `site/assets/js/film.js`, `film-snap.js` (**new**, R4 engine A as amended by §9.2), `film-map.js` (only the < 560 px fallback), `film-flow.js`, `film-batch.js`, `film-events.js`, `film-reveals.js` and `film-split.js` (word reveals feed the cut's in-group);
  - `cut.js` (**new**: the timeline builder for out → iris or same-field → in → stop);
  - `iris.js` (**new**, C4);
  - `tier.js` (**new**: the `html[data-tier]` table in DIRECTION §3);
  - `touch-cut.js` (**new**, §9.3);
  - `motion-tokens.js` (**new**: the GSAP mirror of the `--dur-*` and `--ease-*` tokens);
  - `motion-pref.js` (reads the OS setting **and** `localStorage['cs-motion']`);
  - `main.js` (bootstrap order: splash → tier → chrome → engine → page module on idle, then View Transitions §9.7; imports `dotglobe.js` from 2c by its agreed export `initDotGlobe({ film, tier })`);
  - `perf.js`;
  - `site/ENGINE.md` (the §9.8 API).
- **API published for the others,** frozen at the start of stage 2 in `plan/round5/api.md`, which 2a writes first, within its first step:
  - `film.cut`, `next`, `prev`, `goTo`, `current`, `mode`;
  - `on('cut' | 'landed' | 'build')`;
  - `refreshReach`, `isParked`, `stop`, `start`;
  - `irisTo(field, { x, y })`;
  - `getTier()`;
  - the `data-alias` and `data-open` attributes;
  - the `data-reveal` hooks.
- **Removes:** the ScrollTrigger imports everywhere it owns. Lenis is loaded dynamically on fine pointers only.
- **Writes no CSS.** The engine CSS (the `touch-cut` sections, the `.fields` layer, the `.iris` style) is 2b's, through the class list in `api.md`.
- **Verify:**
  - R4 engine A13 tests 1-10 (desktop), using a scratch harness under the agent's scratchpad;
  - T5 seek-test on that harness;
  - touch-cut on emulated 390×844 (one swipe = one scene).

### 2b · Design system + shared UI agent (DIRECTION §3-§6, R4 shared §4-§6)
- **CSS:**
  - `site/assets/css/base.css`: the §3 tokens and field roles, the §4 rules, the scene box and flow mode from R4 §4, the `touch-cut` and `.fields` and `.iris` styles, the header and backdrop, the menu, the footer and credits, buttons, links, forms, `.ph`, `ph-loud`, `.stop`, `.eyebrow`, `.rule`, the type classes and `@view-transition`;
  - `fx.css`: reduced to the reveal masks and the row and door hover mechanics; the offset plates are deleted;
  - `ui.css` (**new**): the R4 component CSS, plus `.row`, `.row--quote`, `.doors/.door`, `.strike`, `.steps`, `.paper` and its hairline frame, `.fineprint`, `.sheet`, `.switches`, `[data-when]`, and **the text-floor block last** (the 14 px hard floor).
- **JS:**
  - `ui-tabs.js`, `ui-pager.js`, `ui-stepper.js`, `ui-dialog.js`, `ui-accordion.js`, `ui-focus.js` (all **new**, R4 §6 APIs exactly);
  - `globe-fit.js` (**new**: copied from story.js, which is not edited here);
  - `chrome.js` (header, phone header with the WhatsApp icon, menu, credits footer, switches C37, `fillSlots` for `[data-monogram]`, `[data-when]` rendering, `?review=1` → `html.ph-loud`);
  - `cursor.js` (the R5 ring);
  - `interact.js` (magnetic hero CTA only, the arrow nudge, the row flood helpers);
  - `textfx.js` (word reveals only, link underline);
  - `kerning.js` (applies `assets/data/kern.json` only);
  - `text-case.js`.
- **The shared HTML pass**, done once at the end of stage 2 and owned by 2b for all 5 HTML files. It touches **only** these:
  - the `<head>` links (`ui.css`, `visual.css`, the view-transition meta);
  - the splash markup (from 2c's snippet `plan/round5/snippets/splash.html`);
  - the `.fields` and `.iris` nodes;
  - `<canvas id="globe">` replacing the old `#gl`;
  - the empty `<dialog id="wa-sheet">` slot;
  - the header and footer slots.

  It does not touch scene content.
- **Verify:** a scratch harness page (in the agent's scratchpad, not in `site/`) runs every component in all three modes (film, touch-cut, flow) and on all three fields; it checks contrast with axe.

### 2c · Visuals agent (DIRECTION W1, W4, W5, §9.5-9.6, C29-C34)
- **Owns:**
  - `site/assets/js/dotglobe.js` (**new**: exports `initDotGlobe({ film, tier })`, with modes sphere, map, ring, medallion and hidden);
  - `site/assets/data/dotglobe-points.js` (**new**, generated);
  - `tools/gen-dotglobe.mjs` (**new**);
  - `site/assets/js/splash.js` (the match cut, once per session, the 150 ms skip);
  - `site/assets/js/layers.js` (stars drawn once, the compositor drift, the static grain);
  - `site/assets/css/visual.css` (**new**: the splash, `.medallion`, `.tportrait`, `.portrait`, the metal field `::before/::after`, the grain and star layers);
  - `site/assets/img/brushed-256.png`, `icons.svg`, `globe-poster.svg`, `canada-poster.svg` and `medallion.svg` (all **new**);
  - `tools/gen-brushed.mjs` (**new**);
  - `plan/round5/snippets/splash.html` (**new**).
- **Retires** (at the end of the stage, after 2a's `main.js` imports dotglobe): delete `site/assets/js/globe.js` and `globe-fallback.js`, and remove `three` from the bundle entry points.
  - `package.json`: remove the `three` devDependency, coordinated with 2e, who owns `package.json` and `build.mjs`. 2c files the request in `plan/round5/shared-requests.md` and 2e applies it.
- **Verify:**
  - a harness with sphere → map morph, arcs, ring and medallion, at tiers A, B and C;
  - 0 rAF callbacks 6 s after the last input;
  - a screenshot set for the review in `plan/round5/shots-r5/visuals/`.

### 2d · Sound, WhatsApp and config agent (DIRECTION §6.5, §8, C22, C40)
- **Owns:**
  - `site/assets/js/sfx.js` (3 voices, gain 0.12, unlock on click, silent on coarse pointers, the switch, the `hookFilm` early return);
  - `whatsapp.js` (adds `buildIntro`);
  - `wa-sheet.js` (**new**: the 3-step sheet using `ui-stepper.js` from 2b, the success line and the city to `sessionStorage`);
  - `concierge.js` (**new**, C40);
  - `config.js` (adds `HERO_VARIANT`, `FOUNDER_NAME`, `FOUNDER_PHOTO`, `FINDER_MIN_PARTNERS: 3`, `FOOTER_SWITCHES: true`, `STATS`, `RATING`, `QUOTES`, `FOUNDING_LIVE`, `CONTACT_EMAIL` and `VIDEO_URL`, each with a comment; existing keys are unchanged);
  - `plan/round5/snippets/wa-sheet.html` (**new**: the sheet markup that page agents paste into their `<dialog id="wa-sheet">`).
- **Waits for:** 2b's `ui-stepper.js` export (the R4 API, so it can code against the spec straight away).
- **Verify:** a harness with the sheet at 360×740 and 1440×900 (no inner scroll), the wa.me URL encoding, and the sound off, on and coarse states.

### 2e · Tools agent (DIRECTION §12-§13)
- **Owns:**
  - `tools/fit-audit.mjs`: the R4 §8 items, plus the R5 checks (`words`, `elements`, `groups`, `whitespace`, `archetype-repeat`, `longword`, `gold-fields`, `irises`), the `--touch` mode and `cut` mode readiness (wait for `html.film-ready`, `film.current`);
  - `tools/fit-states/_harness.md` and `tools/fit-states/fixtures/partners-max.json` (**new**);
  - `tools/perf-gate.mjs` (**new**: Lighthouse through the installed Chrome, the budgets table, a 4× CPU cut trace, the idle-rAF check);
  - `tools/compliance-diff.mjs` (**new**: reads `compliance-baseline.json` and `compliance-moves.json`);
  - `tools/seek-test.mjs` (**new**);
  - `tools/console-check.mjs` (**new**);
  - `tools/check-config.mjs` (**new**, R4);
  - `tools/build-splits.mjs` and `tools/build-kerning.mjs` (**new**);
  - `build.mjs` (`SHARED_CSS = ['base.css','fx.css','ui.css','visual.css']`; runs check-config, splits and kerning; drops three; per-page bundles; the legal bundle excludes dotglobe, stars and cursor);
  - `package.json` and `package-lock.json` (remove three; keep the gsap and lenis pins).
  - `tools/shoot.mjs` (existing; adds the 4 review viewports).
- **Verify:** every tool runs against today's pages and reports; `npm run build` passes.

### Gate G2 (before any page starts)
- `plan/round5/api.md` exists and matches the code.
- R4 A13 passes on the engine harness. Touch-cut works at 390×844 emulated.
- The tokens are live in `base.css`. The components pass their harness in all 3 modes.
- dotglobe sleeps within 6 s, and the legal bundle has no dotglobe.
- All the tools run, and `npm run build` passes.
- Re-run fit-audit and save it as `plan/round5/after-foundation-fit.txt`. Overflow on pages is still expected.

---

## Stage 3 · Home vertical slice (home agent alone)
- **Owns:**
  - `site/index.html` (scene content only, not the 2b shared nodes),
  - `site/assets/css/home.css`,
  - `site/assets/js/home.js`, `home-tweens.js` (the W2 strike, W3 door deal-in, H6 medallion choreography, through `film.on('cut')`) and `home-sfx.js` (deleted if empty),
  - `tools/fit-states/home.mjs`.
- **Builds:** DIRECTION §7.1, H1-H7, including the FAQ dialog and the `data-alias` list.
- **Loop:** T1 (home: film, flow and touch, 9 viewports), T3, T4 (home), T5 (home) and T2 (home, on a fresh build), until each passes.
- **Gate G3 (the slice review, standing in for the client review, owner question O6).** Four read-only judges re-score **Home only** with the `judge-visual`, `judge-motion`, `judge-ux-conversion` and `judge-typography` rubrics, using screenshots at 1440×900, 1280×720, 390×844 and 360×740 plus a recording.
  - **Each must score ≥ 8.**
  - Findings go back to the home agent, or to the stage 2 owner for shared files, who are resumed for this.
  - There are at most 2 loops. After that, record the gaps in `plan/round5/slice-review.md` and proceed.
  - Lessons that change shared rules are written into `plan/round5/slice-lessons.md`. Stage 4 agents read it first.

## Stage 4 · Rollout (in parallel)

| agent | owns (site/…) | also owns |
|---|---|---|
| **services** | `services.html` (scene content), `assets/css/services.css`, `assets/js/services.js`, `services-categories.js` (now the categories dialog), `services-data.js`, `services-fx.js`, `services-inquiry.js`, `services-view.js`, `finder.js`, `finder-combobox.js`, `finder-geo.js`, `finder-map.js`, `finder-results.js`, `finder-search.js`, `partner-profile.js` | `tools/fit-states/services.mjs` |
| **story** | `story.html` (scene content), `assets/css/story.css`, `assets/js/story.js` (imports `globe-fit.js`; the logo scene is played through `film.on('cut')` and dotglobe `ring` mode) | `tools/fit-states/story.mjs` |
| **partners** | `partners.html` (scene content), `assets/css/partners.css`, `assets/js/partners.js`, `partners-form.js` | `tools/fit-states/partners.mjs` |
| **legal** | `legal.html` (scene content and the draft band), `assets/css/legal.css`, `assets/js/legal.js`, `legal-fx.js` | `tools/fit-states/legal.mjs` |
| **home** (continues) | the stage 3 files | the stage 3 file |

**Page agents must not edit:**
- `base.css`, `fx.css`, `ui.css`, `visual.css`;
- `film*.js`, `cut.js`, `iris.js`, `tier.js`, `touch-cut.js`, `motion-*.js`, `main.js`, `perf.js`, `sfx.js`, `layers.js`, `chrome.js`, `cursor.js`, `interact.js`, `textfx.js`, `kerning.js`, `text-case.js`, `whatsapp.js`, `wa-sheet.js`, `concierge.js`, `dotglobe.js`, `splash.js`, `globe-fit.js` and every `ui-*.js`;
- `config.js` (only 2d edits it, on request);
- `tools/*` other than their own `fit-states/<page>.mjs`, plus `build.mjs`, `package.json`, `ENGINE.md` and `README.md`;
- the 2b shared nodes in the HTML (head links, splash, `.fields`, `.iris`, `#globe`, the header and footer slots).

**Shared requests:** append a line to `plan/round5/shared-requests.md` (page · file · need · proposed diff). Work around it meanwhile with page-scoped CSS or token overrides (R4 `shared.md` §3 rules). The stage 2 owner (2a to 2e) is resumed between waves to apply accepted requests. Pages never patch shared files.

**Gate G4, per page:**
- T1 with 0 failures in every run (film, `--flow`, `--touch`, the 9 viewports, states and fixtures: services `--fixture=partners-max`, legal `--ph-repeat=3`);
- `#credits` spare ≥ 24 px; form columns ≥ 40 px in the all-errors pass;
- T3 with 0 console errors;
- T4 with 0 missing and 0 altered;
- T5 passes;
- T2 for the page passes on a fresh build.

---

## Stage 5 · Review (read-only; findings only)
**Eight lens judges** re-score the whole site on `dist` with the rubrics in `plan/round5/judge-*.md` (DIRECTION T8):
- content;
- layout;
- mobile-a11y;
- motion;
- performance;
- typography;
- ux-conversion;
- visual.

Each writes `plan/round5/rejudge-<lens>.md`, with the overall score first and then findings ranked by severity, each naming its file.

**Four specialist reviewers** write `plan/round5/review-<topic>.md`:
1. **compliance:** T4 output, plus a manual read of every fine-print line against DIRECTION §10;
2. **a11y:** dialogs, the sheet, steppers, the menu, focus, live regions, key ownership, reduced motion and the switches;
3. **engine and devices:** T5 and T7, cut input lock, trackpad flings, touch-cut on real or emulated iOS and Android, the field hold;
4. **performance:** T2, plus the idle-rAF trace and layer counts.

## Stage 6 · Fix
- Each finding goes to the owner of its file from the maps above. Shared files go back to 2a, 2b, 2c, 2d or 2e.
- Fixes re-run the owner's gate (G2 checks for shared files, G4 for pages).
- **Loop:** stage 5 runs again for any lens below 8 or any failing T-test. There are at most 2 loops. Gaps that remain are listed for the user in the release summary, not hidden.

## Stage 7 · Release (orchestrator)
1. Run `npm run build`, then T1-T9 on `dist`. Write the result table into `plan/round5/final-audit.txt`: film, flow and touch modes across the 9 viewports, Lighthouse per page and device, and the lens scores.
2. Append a "Round 5: Full Stop." section to `PLAN.md` (a summary of DIRECTION plus links). Update `site/README.md` (2b's file; the orchestrator may edit it in this stage, since no agent is active).
3. Retire the RETIRED token aliases (DIRECTION §3) if a grep shows no remaining uses.
4. **Git** (the user asked for it):
   - `git add -A`, excluding `dist/` and `node_modules/` per `.gitignore`;
   - commit with the message `feat: round 5 "Full Stop." redesign: cut engine, dot-globe, de-cluttered scenes, design system v2`, ending with the attribution lines from the session's system reminder;
   - push the branch with `-u`;
   - then open or merge as the user directs. If no remote is configured, report that and stop, without inventing one.

---

## Risks to watch
1. **The engine rewrite** (2a) gates everything. `plan/round5/api.md` is frozen first, so 2b to 2e and the page agents code against it in parallel. Changes to `api.md` after G2 need the orchestrator's approval and a note to every active agent.
2. **Touch-cut** (native snap, transparent sections and a fixed `.fields` layer) is new. It must pass T7 on the best device emulation available, and the limits must be recorded.
3. **Fit with monument type** at 1280×720 and 360×740: use the per-scene caps in DIRECTION §7, `.short-hide` on decoration only, and never shrink the floor.
4. **The HTML ownership split:** 2b owns the shared nodes and pages own scene content inside the same files. Stage 2's HTML pass happens **before** stage 3, and stage 4 never touches those nodes.
5. **Removing three.js** changes `package.json` and `build.mjs` (2e). Any page still importing `globe.js` after stage 2 fails the build. That is intended, and it is fixed by the page owner.
6. **Compliance:** any wording change outside the DIRECTION §10 move list is a T4 failure, even when it reads better.
7. **Another process may still edit `site/`.** Stage 0 waits until it is quiet, and no stage starts over live edits.
