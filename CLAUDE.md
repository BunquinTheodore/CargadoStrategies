# Cargado Strategies site: agent guide

Read this first on every task. Deeper contracts: `site/core/CLAUDE.md` (engine, ui, chrome, design) and `site/sections/<page>/CLAUDE.md` (each page's scenes).

## What this is

- **Business.** Cargado Strategies, a Canadian business run by the founder, Lee Holgado (Winnipeg, MB). Three things: her own insurance and business-strategy/outsourcing work, and free introductions to partner professionals (legal, mortgage, real estate, accounting and tax, financial planning, manufacturing) anywhere in Canada.
- **Audience.** Canadians aged 30-45, mostly on mid-range phones. Mobile performance and readability come first.
- **Site.** A static "scroll film": every page is a list of full-screen scenes, one scroll (wheel, key, swipe) = one cut to the next scene. Plain HTML, CSS and ES modules in `site/`. `npm run build` (esbuild) bundles it into `dist/`, which is what gets uploaded. No server code and no framework.
- **Pages.** `index.html` (Home), `services.html`, `story.html`, `partners.html` (For Professionals), `legal.html`.

## Fixed rules (never break)

- **Colour: black and gold only. No blue anywhere.** Fields are `ink`, `bone` and `gold`, with gold at most once per page (none on story and legal). Tokens live at the top of `site/core/design/base.css`.
- **Type:** display is the Times New Roman stack (Tinos fallback), written in **Title Case in the markup** (never `text-transform`). Body is Manrope and UI labels are Poppins. **14 px floor** for any visible text (`--fs-label`), and reading lines use `--fs-note`.
- **One scroll = one section, and every section fits one screen** at all 9 contract viewports, in cut, touch-cut and flow modes (`tools/fit-audit.mjs`).
- **Compliance copy survives word for word**: notices, hints, fine print, the legal draft notice, FAQ answers, the `[bracket]` placeholders and "We only message from +1 (204) 869 2508". `tools/compliance-diff.mjs` must report **0 missing / 0 altered**. Only the moves listed in `plan/round5/compliance-moves.json` are allowed.
- **Owner content lives in `site/assets/js/config.js`**: founder Lee Holgado, phone **+1 (204) 869 2508 (the only number)**, the email, the Winnipeg address (1210 Chamberlain Ave, R2X 1E7), the Facebook page (the URL is still a placeholder), categories, partners and the proof slots. Do not hardcode these elsewhere; read them from config.
- **Never invent** partners, people, photos, stats, ratings, testimonials, quotes or licence numbers. Unconfirmed facts stay as `<span class="ph">[bracket]</span>`. Proof slots stay hidden through `[data-when="KEY"]` until config fills them. `PARTNERS` is empty, so the site shows "Partner spot available".
- **The repo is public.** `Cargado-Strategies-Proposal-SRS*.pdf` and `Cargado-Wireframes.html` stay gitignored and are never committed or quoted wholesale. The golden copies under `plan/restructure/golden/` and `after-core/` are gitignored too.
- Animate only `transform`, `opacity` and `clip-path`. Tap targets are at least 44 px. Everything works from 360 px wide. No `console.log`. Use small functions and named constants, and match the surrounding style and comment density. Use plain ES modules and add no new dependencies.

## Folder map (who owns what)

```
site/
  index.html services.html story.html partners.html legal.html
      thin shells: <head>, splash, header, the .stage layers, one marker per section
      (<!-- @section <page>/<name> -->), the WhatsApp sheet. page = home|services|story|partners|legal
  core/                 shared by every page. Changing it means checking all 5 pages (see core/CLAUDE.md)
    main.js             boot(): splash, tier, chrome, film, sheet hub, globe, idle extras, View Transitions
    Section.js          base class + mountSections()
    engine/             the scroll-film engine and shared visuals (film*, cut, iris, tier, touch-cut,
                        layers, perf, motion-*, splash, sfx, textfx, kerning, cursor, interact, dotglobe*, globe-fit)
    ui/                 ui-dialog, ui-stepper, ui-pager, ui-tabs, ui-accordion, ui-focus
    chrome/             chrome.js (header, menu, footer, [data-when]), whatsapp.js (every message), wa-sheet.js
    design/             base.css (tokens, fields, type, header, buttons, forms), fx.css, ui.css, visual.css
    lib/text-case.js    titleCase()
  sections/<page>/
    <name>/<name>.html  the exact original markup of one <section> (or <dialog>)
    <name>/<name>.css   rules only that section uses
    <name>/<Name>.js    class extends Section (only if the section has behaviour), plus its helper modules
    _page.css, _bands.css …   page-level rules / breakpoint bands that mix scenes (cascade order)
    _shared.js, services-data.js, LegalDoc.js   page-local helpers shared by that page's sections
    CLAUDE.md           scene list, config keys, open issues for that page
  pages/<page>.js       page entry: fill config copy, boot(), mountSections([...])
  pages/<page>.css      an @import list of the page's section CSS IN ORIGINAL RULE ORDER (never reorder)
  assets/js/config.js   OWNER CONTENT (the only thing the founder edits)
  assets/data/          canada-map, cities, dotglobe-points (generated), kern.json (generated)
  assets/img/           images and posters (some generated by tools/gen-*.mjs)
  ENGINE.md README.md   the engine guide for page builders, and the owner/deploy readme
build.mjs               site/ → dist/ (assembles pages, pre-splits words, bundles, hashes, fonts, sitemap)
serve.mjs               static server with Brotli/gzip. Serving site/, it assembles .html on the fly
tools/                  audits (below). tools/lib/assemble.mjs expands the section markers
plan/                   round4, round5 (spec, audits), restructure (golden reference, verify notes)
```

Note: `css/` and `js/` paths under `site/assets/` (other than `assets/js/config.js`) are gone. Files under `plan/` written before the restructure use the old paths (`assets/js/film.js` = `core/engine/film.js`, `assets/css/home.css` = `pages/home.css` + `sections/home/**`).

## How a section works

1. **Markup.** The shell has `<!-- @section home/hero -->`. `tools/lib/assemble.mjs` replaces it with the exact bytes of `site/sections/home/hero/hero.html`, adding or removing no whitespace. So the indentation inside the partial is the shell's indentation, and the partial has no trailing newline. `serve.mjs site`, `build.mjs`, build-kerning, build-splits and golden-diff all assemble. **Never open a site/*.html file directly in a browser and never serve site/ with python**: you would get the bare markers.
2. **Scene attributes** on the `<section class="scene">`: `id` (the deep link), `data-field` (ink|bone|gold), `data-archetype` (O M R D P stage credits), `data-title`, optional `data-alias`, `data-iris`, `data-globe-mode`, `data-pose`, `data-open`, `data-out-hold`, and `data-group` / `data-reveal` on the children. See `site/ENGINE.md` §4.
3. **CSS.** `<name>.css` is imported by `pages/<page>.css` at the position its rules held in the original file. The cascade order is the import order.
4. **Behaviour.** `<Name>.js`: `class X extends Section { static id = '<section id>'; mount(); enter(e); leave(e); cut(e)?; destroy() }`. `pages/<page>.js` lists it in `mountSections([...], ctx)`, in the same tick as `boot()`. Sections never import another section's folder. Cross-section needs go through `ctx` (for example partners' `ctx.selectTier`, services' `ctx.inquireAbout`).

## Add / edit / remove a section

**Edit copy or markup:** change `sections/<page>/<name>/<name>.html`. Keep compliance sentences and `[brackets]` exact. If a display heading changes, run `node tools/build-kerning.mjs` (the build does this too).

**Add a section:**
1. Create `sections/<page>/<name>/<name>.html` holding one `<section class="scene" id="<name>" data-field … data-archetype … data-title …>`. Follow the indentation of its neighbours, with no trailing newline.
2. Put `<!-- @section <page>/<name> -->` in the shell at its place in `<main class="scenes">`, with a one-line comment above it as the neighbours have.
3. Create `<name>.css` and add an `@import` line to `pages/<page>.css` at the right cascade position (usually before `_bands.css`). Phone and tablet overrides that mix scenes go in the page's bands file.
4. If it has behaviour, write `<Name>.js` extending `Section` and add it to the page's `mountSections` list.
5. Check the archetype and budgets (no more than 60 words, 12 elements and 3 groups, gold once per page) and the field rhythm with its neighbours.
6. Run the gates below, including fit-audit for that page in film, `--flow` and `--touch`.

**Remove a section:** delete the marker, the `@import` line, the class from `mountSections`, then the folder. Grep for its `id` (links, `data-alias`, `data-open`, `href="#id"`, fit-states, compliance baseline). Compliance copy in it must move somewhere allowed, or the owner must approve the removal.

**Add a page:** copy an existing shell's `<head>` exactly (build.mjs recognises those tags), add `pages/<page>.js|css`, and add the page to `PAGES` in `build.mjs` and in `tools/lib/cdp.mjs`.

## Commands

The project root is `C:\Cargado Strategies`. Node 22+ is needed (the tools use global WebSocket and fetch).

| Command | What it does |
|---|---|
| `npm run dev` | `node serve.mjs site 8000`: the **owner's** dev server. **Agents: do not run it, do not use port 8000, and never stop it.** |
| `node serve.mjs site <port>` / `node serve.mjs dist <port>` | your own server on your own port (for example 86xx). Stop it when done |
| `npm run build` | runs check-config, assembles, pre-splits words, bundles `dist/`. `SITE_URL=…` sets the canonical domain |
| `node tools/check-config.mjs [--fixture=partners-max]` | validates config.js (partner caps, slugs, Canadian coords, R5 keys) |
| `node tools/lib/golden-diff.mjs [--only=site,dist]` | pure-refactor gate: assembled site/*.html and dist/ against `plan/restructure/golden/` |
| `node tools/compliance-diff.mjs --dist` (or `<url>`) | compliance gate (T4): every baseline sentence and `[bracket]` is still on its page |
| `node tools/console-check.mjs <url> [page.html]` | T3: 0 errors, warnings and failed requests; cuts every scene, opens dialogs, runs steppers, in cut, touch and flow modes, with and without ?review=1 |
| `node tools/fit-audit.mjs <url> [page] [--flow\|--touch] [--states=tools/fit-states/<page>.mjs] [--vp=…]` | T1: every scene fits one screen plus the R5 budgets (words, elements, groups, whitespace, 14 px, spare). Fixtures: services `--fixture=partners-max`, legal `--ph-repeat=3` |
| `node tools/seek-test.mjs <url-of-site/> [page]` | T5 "no dead air": pauses every cut at 25/50/75%. Run it on **site/** (on dist the hook cannot reach film.js) |
| `node tools/perf-gate.mjs` (`npm run perf`) | T2: Lighthouse and budgets on dist. Heavy: only when the task asks |
| `node tools/shoot.mjs <url> --vp=review` | screenshots of every scene (judging aid). Heavy |
| `node tools/build-kerning.mjs` / `build-splits.mjs` | build helpers (kern.json, word masks). The build calls them |
| `node tools/gen-dotglobe.mjs`, `gen-brushed.mjs` | regenerate globe data and posters, and the metal tile (deterministic) |

**Always pass an explicit base URL on your own port.** The browser tools default to `http://localhost:8000/`, which is the owner's server.

## Gates before calling work done

1. `npm run build` exits 0 with no warnings.
2. **Pure refactor:** `node tools/lib/golden-diff.mjs` shows assembled site HTML identical, and dist HTML and CSS identical. JS minified-name differences are expected.
3. **Compliance:** `node tools/compliance-diff.mjs --dist` gives 0 missing / 0 altered.
4. **Console:** `node tools/console-check.mjs http://127.0.0.1:<port>/ <pages touched>` gives 0 errors and 0 warnings.
5. **Layout or copy changes:** fit-audit for each page touched, in film, `--flow` and `--touch`. Results must be no worse than the baseline in `plan/round5/final-audit.txt`, whose known failures are listed in each page's CLAUDE.md.
6. **Motion changes:** seek-test on site/ for the page, with no new failing frames.
7. Grep check: no `console.log`, no blue, no `text-transform: uppercase` on display type, no new hardcoded phone, email or address.
8. Stop every server you started, and make sure no headless Chrome of yours is left running.

## Windows notes and memory rule

- The shell is Windows. Git Bash and PowerShell are both available. Use absolute paths, since cwd resets between calls. The path contains a space, so quote it.
- **Memory is limited: run at most ONE headless-browser tool at a time** (fit-audit, console-check, compliance-diff, seek-test, shoot, perf-gate and build-kerning each start their own Chrome). Do not run fit-audit or perf-gate unless the task calls for it. Close every Chrome you start (`Get-Process chrome` and check its command line for the tool's isolated profile, never the user's browser).
- Never grep `Cargado-Wireframes.html`, `*.pdf`, `plan/round5/shots*`, or `dist/` or `node_modules/` recursively.
- Never run git unless the user asks. Never stop servers or processes you did not start.

## Pointers

- Spec, the single source of truth: `plan/round5/DIRECTION.md` (§3-§5 design system, §7 pages scene by scene, §10 compliance moves, §13 acceptance T1-T9).
- Public API: `plan/round5/api.md`. Engine guide: `site/ENGINE.md`. Owner and deploy guide: `site/README.md`.
- Latest full audit and open issues: `plan/round5/final-audit.txt`. Restructure verification: `plan/restructure/verify.md`.
- `plan/` documents predate the restructure, so their file paths are the old ones (see the folder map note).
