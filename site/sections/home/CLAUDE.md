# Home (`index.html`): sections/home

Entry `pages/home.js`, styles `pages/home.css`, spec `plan/round5/DIRECTION.md` §7.1 (H1-H7). Six scenes plus credits, and one dialog. The page has the splash (`#splash` in the shell) and the globe.

## Scenes, in order

| # | id (aliases) | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| H1 | `hero` | ink · O · W1 | `hero/` · `Hero.js` | The promise on the left and the globe (`data-globe-mode="sphere"`) on the right. The title variant comes from `HERO_VARIANT`. Hidden proof slots for `STATS`, `RATING` and `FOUNDER_PHOTO`. The CTA opens the WhatsApp sheet, and a second link opens its contact view. The class adds the CTA sheen once, on the first landing |
| H2 | `one-message` (compare, how-it-works, video) | bone · M · W2 | `one-message/` · `OneMessage.js` | Four searches arrive and are struck, then "One Message" rises (a `cut()` append by label from `'iris'`/`'struck'`, ending within 1.3 s) |
| H3 | `situations` (services) | bone · R | `situations/` · `Situations.js` | Four quote rows into the services. The class is a J-cut lead (`_shared.js` `leadInGroup`) |
| H4 | `founder` | gold (metal) · D · W3 | `founder/` · `Founder.js` | Three doors. The founder name, photo and signature slots and the `QUOTES` slot. Each cut deals the doors in. On phones they are an exclusive accordion |
| H5 | `find` | ink · O · W4 | `find/` · `Find.js` | The globe comes down to a map of Canada (`data-globe-mode="map"`). J-cut lead |
| H6 | `close` (story, partners, faq) | ink · M · W5 | `close/` · `Close.js` | The medallion bookend and the sheet CTA. `data-open="faq-dialog:faq"`: `#faq` opens the FAQ dialog |
| H7 | `credits` | ink · credits | `credits/` (no class) | The footer that chrome.js fills (contact, links, fine print, switches) |
| | `faq-dialog` | dialog | `faq-dialog/` (wired by `Close.js`) | FAQ answers, verbatim compliance copy. One answer open at a time via native `details[name="faq"]` |

Page-level files: `_page.css` (the shared scene frame, first in cascade order), `_bands.css` (laptop-short, tablet and phone bands that mix every scene, last), `_shared.js` (`PHONE_QUERY`, `isPhone`, `qsa`, `leadLabel`, `leadInGroup`: the J-cut lead appended by label).

## Config and core used

- `pages/home.js` (before boot): `HERO_VARIANT` ('triad' swaps the hero title), `FOUNDER_NAME` (written into the first pre-split word mask of `[data-founder-name]`), `FOUNDER_LAST_NAME`, `FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`. It also fills the no-JS `wa.me` hrefs through `whatsapp.js` `buildIntro`/`waLink`.
- `[data-when]` slots (chrome.js): `STATS`, `RATING`, `QUOTES`, `FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`. They stay hidden while config is null or empty, and `?review=1` shows them.
- Core: `Section`, `ui-dialog` (`openDialog`), `iris.irisFades` (via `_shared.js`), and dotglobe through `data-globe-mode` / `data-pose`. Mount order: `Hero, OneMessage, Situations, Founder, Find, Close`.

## Known open issues (plan/round5/final-audit.txt)

- Fit (T1): clean in film, flow and touch at all 9 viewports. Keep it that way: `node tools/fit-audit.mjs <url> index.html --states=tools/fit-states/home.mjs` (also `--flow` and `--touch`).
- Seek (T5): 1 known failing frame, tier A at 390x844, cut #4→#5 (0-based: find → close) at 50%: "One Message." is drawn over the globe. This is the baseline. Add no new ones.
- Perf budgets (T2): mobile script transfer 80.3 KB (budget 70). The splash takes 1339 ms on mobile and 1620 ms on desktop (budget 1100). Lighthouse itself scores 99/100.
- Owner content still missing: proof numbers, rating, client quotes, founder photo, signature, video (README "What the founder must supply").
