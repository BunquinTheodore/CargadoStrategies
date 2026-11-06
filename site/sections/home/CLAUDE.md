# Home (`index.html`): sections/home

Entry `pages/home.js`, styles `pages/home.css`, spec `plan/round5/DIRECTION.md` §7.1 (H1-H7). Seven scenes plus credits, and one dialog (v2 added the services orbit, spec §6.3). The page has the splash (`#splash` in the shell) and the globe.

## Scenes, in order

| # | id (aliases) | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| H1 | `hero` | ink · O · W1 | `hero/` (no class) | The promise on the left and the globe (`data-globe-mode="sphere"`) on the right. The title variant comes from `HERO_VARIANT`. Hidden proof slots for `STATS` and `RATING`. No founder photo here (owner, 2026-10-25: removed from the lead). The CTA opens the WhatsApp sheet, and a second link opens its contact view. No class: `Hero.js`, the CTA sheen and the magnetic pull were removed (client request, 2026-11-07: calm motion) |
| H1b | `orbit` | ink · stage | `orbit/` · `Orbit.js` | The Cargado mark in a centre circle with the ten `ORBIT_GROUPS` round it (static `.orbit__node` links, so it works without JS; a test keeps them equal to config). `core/ui/ui-orbit.js` adds previews (hover/focus; touch: first tap previews, second tap or Open follows), arrow keys and Escape. The centre logo sits still (the `orbitLogoIn` logo-in and the orbit spin were removed, 2026-11-07); the class hides the preview on leave. Head on the left, ring on the right; tablet portrait stacks; phones get the mark band over two columns of pills (`core/design/orbit.css`). Budget: 11 framed/interactive elements (10 nodes + the centre), so no CTA here |
| H2 | `one-message` (compare, how-it-works, video) | bone · M · W2 | `one-message/` · `OneMessage.js` | Four searches rest struck through (static `is-struck`), and "One Message" rises with the in group. `cut()` is only the J-cut lead (`leadInGroup`). The strike sequence and the answer replay were removed (client request, 2026-11-07, reversing the owner's 2026-10-26 slow strike bars) |
| H3 | `situations` (services) | bone · R | `situations/` · `Situations.js` | Four quote rows into the services. The class is a J-cut lead (`_shared.js` `leadInGroup`) |
| H4 | `founder` | gold (metal) · D · W3 | `founder/` · `Founder.js` | Three doors. The founder name and signature slots (no photo: owner, 2026-10-25) and the `QUOTES` slot. The doors arrive with the in group (the deal and the hover widen were removed, 2026-11-07). On phones they are an exclusive accordion |
| H5 | `find` | ink · O · W4 | `find/` · `Find.js` | The globe comes down to a map of Canada (`data-globe-mode="map"`). J-cut lead |
| H6 | `close` (story, partners, faq) | ink · M · W5 | `close/` · `Close.js` | The medallion bookend and the sheet CTA. `data-open="faq-dialog:faq"`: `#faq` opens the FAQ dialog |
| H7 | `credits` | ink · credits | `credits/` (no class) | The footer that chrome.js fills (contact, links, fine print, switches) |
| | `faq-dialog` | dialog | `faq-dialog/` (wired by `Close.js`) | FAQ answers, verbatim compliance copy. One answer open at a time via native `details[name="faq"]` |

Page-level files: `_page.css` (the shared scene frame, first in cascade order), `_bands.css` (laptop-short, tablet and phone bands that mix every scene, last), `_shared.js` (`PHONE_QUERY`, `isPhone`, `qsa`, `leadLabel`, `leadInGroup`: the J-cut lead appended by label).

## Config and core used

- `pages/home.js` (before boot): `HERO_VARIANT` ('triad' swaps the hero title), `FOUNDER_NAME` (written into the first pre-split word mask of `[data-founder-name]`), `FOUNDER_LAST_NAME`, `FOUNDER_PHOTOS` (each `[data-founder-photo="navy"]` slot names its photo; `FOUNDER_PHOTO` is the fallback), `FOUNDER_SIGNATURE`. Avatars are `aria-hidden` with `alt=""`, `width`/`height` set, lazy outside `#hero`, cropped to head and shoulders by `visual.css` `.avatar img`. It also fills the no-JS `wa.me` hrefs through `whatsapp.js` `buildIntro`/`waLink`.
- `[data-when]` slots (chrome.js): `STATS`, `RATING`, `QUOTES`, `FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`. They stay hidden while config is null or empty, and `?review=1` shows them.
- Core: `Section`, `ui-dialog` (`openDialog`), `iris.irisFades` (via `_shared.js`), and dotglobe through `data-globe-mode` / `data-pose`. Mount order: `Orbit, OneMessage, Situations, Founder, Find, Close`. `pages/home.css` imports `core/design/orbit.css` right before `orbit/orbit.css`. Config: `ORBIT_GROUPS` (hrefs point at `services.html#…`).

## Known open issues (plan/round5/final-audit.txt)

- Fit (T1): clean in film, flow and touch at all 9 viewports before v2. The v2 `#orbit` scene has not been fit-audited yet (gate agent); tune `--orbit-size` / `--orbit-node` / `--orbit-core-h` in `orbit/orbit.css` if a short viewport fails. Keep it clean: `node tools/fit-audit.mjs <url> index.html --states=tools/fit-states/home.mjs` (also `--flow` and `--touch`).
- Seek (T5): 1 known failing frame, tier A at 390x844, cut #4→#5 (0-based: find → close; #5→#6 now that `#orbit` sits second) at 50%: "One Message." is drawn over the globe. This is the baseline. Add no new ones.
- Perf budgets (T2): mobile script transfer 80.3 KB (budget 70). The splash budget is 1300 ms (the 1 s card plus timer slack under CPU throttling); the old 1339 ms (mobile) and 1620 ms (desktop) were measured on the scan splash, so re-measure the ~1 s card (2026-11-07). Lighthouse itself scores 99/100.
- Owner content still missing: proof numbers, rating, client quotes, signature, video (README "What the founder must supply").
