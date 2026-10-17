# Round 4 · Build order and file ownership

The specs are `shared.md` (it wins on conflicts), `engine.md`, and `home.md`, `services.md`, `story.md`, `partners.md` and `legal.md`.

**Precondition:** Round 3 has finished and no other process is editing `site/`. Check this before stage 1.

## Order

```
Stage 1  Removals                          (1 agent, sequential; touches many files, briefly)
Stage 2  Shared + engine                   (3 agents in parallel, disjoint files)
           2a engine     2b shared UI/CSS     2c tools
         → gate G2
Stage 3  Pages                             (5 agents in parallel, disjoint files)
           home   services   story   partners   legal
         → each loops fit-audit until 0, gate G3 per page
Stage 4  Cross-page review                 (read-only reviewers → findings list)
Stage 5  Fix                               (findings routed to the file's owner from the map below)
Stage 6  npm run build → dist, Lighthouse, final fit-audit table (both modes, all 9 viewports)
```

## Ownership map

Paths are relative to `C:\Cargado Strategies\`. **One owner per file per stage.** Agents may read anything.

### Stage 1: Removals agent (engine.md §C, as amended by shared.md §7.7)
The only stage that touches page files and shared files together. It makes **only** the §C edits:
- **JS:** `site/assets/js/layers.js`, `film-alive.js`, `film-events.js` (comment), `chrome.js`, `interact.js`, `textfx.js`, `main.js`, `motion-pref.js`, `film.js` (the motion-pref import and `canRunFilm` only), `sfx.js` (the toggle code only), and `motion-toggle.js` (**delete**).
- **Page JS:** `home.js`, `partners.js` and `services.js`, where it removes the `setBar` / bar code only.
- **CSS:** `site/assets/css/base.css` (§7 HUD, §9 WhatsApp, the motion toggle, the `.phone-bar` references, `.lead-rule` emptied) and `fx.css`.
- **Story:** `site/story.html`, `story.css` and `story.js` (the cue line, the ref rule, `.story-rule` and `ideaTweens`).
- **Partners:** `site/assets/css/partners.css` (the "— " prefixes).
- **Legal:** `site/legal.html`, `legal.css` and `legal-fx.js` (`.legal-rule`; the banner dash per legal.md §3.3).
- **All 5 HTML files:** the `<div class="hud">` and the head-script motion lines.
- **Docs:** `site/ENGINE.md` (§C mentions) and `site/README.md`.
- **Verify:** fit-audit runs and the console is clean on all 5 pages, and `npm run build` passes.

### Stage 2a: Engine agent
- `site/assets/js/film-snap.js` (**new**), plus edits to `film.js`, `film-map.js`, `film-flow.js` and `sfx.js` (`hookFilm`, the `page` voice, `has()`). The work follows engine.md A and B, and shared.md §7: `refreshReach`, `isParked`, the overflow-only rebuild, the field hold, and the key ownership table.
- `site/assets/js/layers.js`: the `initCue` change from engine A8.
- `site/ENGINE.md`: §3, §6, §7, §9, "Scroll and snapping" and §11 (engine.md E). The agent writes **no CSS**: the snap and flow CSS is 2b's.
- **Verify:** the engine.md A13 tests 1–10 in the browser.

### Stage 2b: Shared UI/CSS agent
- **CSS:** `site/assets/css/base.css` (tokens §3, scene box §4.2, flow mode §4.3, the footer §5.4, `.hp`, controls, `close` padding deleted) and `ui.css` (**new**, the component CSS, the floor block last).
- **JS (new):** `site/assets/js/ui-tabs.js`, `ui-pager.js`, `ui-stepper.js`, `ui-dialog.js`, `ui-accordion.js`, `ui-focus.js` and `globe-fit.js` (copied from story.js; story.js is not edited here).
- **JS (edits):** `site/assets/js/chrome.js` (`fillSlots` for every `[data-monogram]`) and `interact.js` (`data-tilt="wide"`).
- **All 5 HTML files:** **only** one `<link rel="stylesheet" href="assets/css/ui.css">` line after `fx.css`.
- **Verify:** a scratch harness page under the agent's scratchpad (not in `site/`) runs each component: tabs in all modes, drill, swipe, both pagers, the stepper in both modes, the dialog, and the accordion.

### Stage 2c: Tools agent
- `tools/fit-audit.mjs` (shared.md §8).
- `tools/fit-states/_harness.md` (**new**) and `tools/fit-states/fixtures/partners-max.json` (**new**, the services §7.7 caps).
- `tools/check-config.mjs` (**new**).
- `build.mjs`: `SHARED_CSS` gets `ui.css`, and the build runs check-config.
- **Verify:** the audit runs on today's pages and `npm run build` passes.

**Gate G2** (before any page starts):
- `film.refreshReach` and `film.isParked` exist in `film.js` and `film-flow.js`.
- Snap passes A13.
- The shared tokens are live, and the baseline fit-audit is re-run and saved as `plan/round4/after-shared-audit.txt`.
- The components pass their harness.
- `npm run build` passes.

### Stage 3: Page agents (in parallel)

| agent | owns (site/…) | also owns |
|---|---|---|
| **home** | `index.html`, `assets/css/home.css`, `assets/js/home.js`, `home-tweens.js`, `home-sfx.js`, `home-map.js`, `home-needs.js`, `home-video.js` | `tools/fit-states/home.mjs` |
| **services** | `services.html`, `assets/css/services.css`, `assets/js/services.js`, `services-categories.js`, `services-data.js`, `services-fx.js`, `services-inquiry.js`, `services-view.js`, `finder.js`, `finder-combobox.js`, `finder-geo.js`, `finder-map.js`, `finder-results.js`, `finder-search.js`, `partner-profile.js`; **`config.js` only for the PARTNERS limits comment** | `tools/fit-states/services.mjs` |
| **story** | `story.html`, `assets/css/story.css`, `assets/js/story.js` (now imports `globe-fit.js`) | `tools/fit-states/story.mjs` |
| **partners** | `partners.html`, `assets/css/partners.css`, `assets/js/partners.js`, `partners-form.js` | `tools/fit-states/partners.mjs` |
| **legal** | `legal.html`, `assets/css/legal.css`, `assets/js/legal.js`, `legal-fx.js` | `tools/fit-states/legal.mjs` |

**Page agents must not edit:**
- `base.css`, `fx.css`, `ui.css`;
- `film*.js`, `sfx.js`, `layers.js`, `main.js`, `chrome.js`, `interact.js`, `textfx.js`, `cursor.js`, `globe*.js`, `splash.js`, `perf.js`, `motion-pref.js`, `text-case.js`, `whatsapp.js`, any `ui-*.js`;
- `config.js` (except services, as above);
- `tools/fit-audit.mjs`, `build.mjs`, `ENGINE.md`, `README.md`.

If a page needs a shared change, it **files a request**: it appends a line to `plan/round4/shared-requests.md` with the page, file, need and a proposed diff, and works around it locally with page-scoped CSS or token overrides that shared.md §3 allows. The shared-stage owner (2b or 2a, resumed between waves) applies accepted requests. Pages never patch shared files themselves.

**Each page's loop (gate G3):** run
`node tools/fit-audit.mjs http://localhost:8000/ <page>.html --vp=1920x1080,1536x864,1440x900,1366x768,1280x720,1024x768,768x1024,390x844,360x740 --states=tools/fit-states/<page>.mjs`, plus `--flow`, plus the page's fixtures (services `--fixture=partners-max`, legal `--ph-repeat=3`), until:
- 0 Y overflow, 0 X overflow, 0 inner scrollers, 0 clipped and 0 small-text, in every run;
- `#credits` has at least 24 px spare and form columns at least 40 px in the all-errors pass;
- the compliance copy diff against the page spec's verbatim list is empty.

### Stage 4: Reviewers (read-only)
Four reviewers work from `git diff`-equivalent snapshots, and each writes findings to `plan/round4/review-<topic>.md`:
1. a11y (tabs, pager, stepper, dialog, focus, live regions, key ownership);
2. compliance copy diff;
3. interaction and SFX hooks and reduced motion;
4. the engine on real devices (the field hold, the trackpad momentum lock).

### Stage 5: Fix
Each finding goes to the owner of its file from the map above. Shared files go back to 2a, 2b or 2c.

### Stage 6: Release check
Owned by the orchestrator:
- `npm run build`;
- Lighthouse on all 5 pages;
- the final fit-audit table (film plus flow, 9 viewports, with states and fixtures), written to `plan/round4/final-audit.txt`.

## Risks to watch
1. **Services was measured with `--fu` and tighter phone spacing.** On the engine tokens its phone budget is about the same (654 against 658 px), but `--space-m/-l` are 4–7 px larger. Fix: scoped token overrides on services' scenes (shared.md §3 allows them). The tightest scenes are inquiry at 360×740 (24 px measured spare) and 768×1024 (16 px).
2. **The text floor rises to 16 px from 760 px on home** (it was measured at 15) **and on legal** (notices were 14). Home's tightest scene is find at 1280×720 (−31). Legal relies on its pager, plus `--ph-repeat=3`.
3. **Stage 1 runs while Round 3 might still be live.** Do not start until Round 3 reports done. Line numbers in engine.md §C are hints; find each edit by its quoted text.
4. The field hold and the momentum lock can only be proven on real iOS and Android devices and on a real trackpad. Emulation is not enough.
5. The `.legal-draft__text` banner stays at 12 px under a floor exemption. The compliance reviewer must accept that.
6. Deleting the Pause toggle leaves star and grain loops with no on-page pause (WCAG 2.2.2). This is a recorded owner decision (engine C3).
7. Phones have no persistent WhatsApp action once the bar is gone (engine C2). The header icon is an open owner question, not built.
8. Shared-request latency: a page blocked on a shared fix must keep working with a scoped override, never by editing shared files.
