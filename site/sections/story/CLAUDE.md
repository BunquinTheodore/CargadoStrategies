# Our Story (`story.html`): sections/story

Entry `pages/story.js`, styles `pages/story.css`, spec `plan/round5/DIRECTION.md` §7.3 (T1-T6). Five scenes plus credits. **No gold field on this page** (fit-audit fails gold > 0). The story is a draft: the founder confirms every word before publication (`?review=1` shows the note on `#top`).

## Scenes, in order

| # | id (aliases) | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| T1 | `top` | ink · O | `top/` | Her sentence on the left and her typographic portrait on the right (full name, photo and signature slots). `REVIEW_NOTES` slots |
| T2 | `beginning` (founder) | bone · M | `beginning/` | "Where It Began": one place, not five. `QUOTES` slot |
| T3 | `logo` | ink · stage · W5 | `logo/` · `Logo.js` | The globe collapses into the C ring (`data-globe-mode="ring"`). The class draws the C after the dots and the W inside it, by label on the cut. `data-out-hold` holds the mark on the way out (a J-cut). With no live globe (tier C, flow) the mark draws inside the engine part, by `'settled'` |
| T4 | `values` (network) | ink · R | `values/` · `Values.js` | Three things never traded, with the independence fine print. On phones an exclusive accordion with 01 open |
| T5 | `close` (talk) | ink · M · W5 | `close/` | The medallion bookend. The CTA label becomes "Message {FOUNDER_NAME}" (`[data-cta-label]`). Founder photo slot |
| T6 | `credits` | ink · credits | `credits/` | The footer that chrome.js fills |

Page-level files: `_page.css` (first), `_bands.css` (last).

## Config and core used

- `pages/story.js` (before boot): `FOUNDER_NAME`, `FOUNDER_LAST_NAME` (`[data-founder-full]`, `[data-cta-label]`), `FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`. The name fills only plain lines and labels, **never a split heading** (slice lesson 9). It also fills the no-JS `wa.me` hrefs.
- `[data-when]`: `FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`, `QUOTES`, `REVIEW_NOTES`.
- Core: `Section`. dotglobe `ring` / `medallion` modes are declarative. Mount order: `Logo, Values`.
- Logo story copy: W for Wealth, C for Cargado, Mark 11:24 as a reference only. The founder's own words are still `[brackets]`.

## Known open issues (plan/round5/final-audit.txt)

- Fit: clean in film, flow and touch at all 9 viewports.
- Seek: no failing frames. The `Logo.js` timing comments explain why the mark draws where it does. Keep T5 clean.
- Perf: mobile script transfer 79.2 KB (budget 70).
- Owner content: the founder confirms the draft story, the background and logo wording, and the optional sentence on faith.
