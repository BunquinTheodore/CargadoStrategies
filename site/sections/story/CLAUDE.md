# Our Story (`story.html`): sections/story

Entry `pages/story.js`, styles `pages/story.css`, spec `plan/round5/DIRECTION.md` §7.3 (T1-T6). Five scenes plus credits. **No gold field on this page** (fit-audit fails gold > 0). The story is a draft: the founder confirms every word before publication (`?review=1` shows the note on `#top`).

## Scenes, in order

| # | id (aliases) | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| T1 | `logo` | ink · stage · W5 | `logo/` · `Logo.js` | The globe collapses into the C ring (`data-globe-mode="ring"`). The class draws the C after the dots and the W inside it, by label on the cut. `data-out-hold` holds the mark on the way out (a J-cut). With no live globe (tier C, flow) the mark draws inside the engine part, by `'settled'` |
| T2 | `top` | ink · O | `top/` | Her sentence on the left and her portrait on the right: the photo `FOUNDER_PHOTOS.cream` (eager, alt "Lee Holgado, founder of Cargado Strategies" from config) in the arch frame of `visual.css` `.portrait` (gold hairline, inner vignette), the typographic portrait only while there is no photo. `REVIEW_NOTES` slots |
| T3 | `beginning` (founder) | bone · M | `beginning/` | "Where It Began": one place, not five. `QUOTES` slot |
| T4 | `values` (network) | ink · R | `values/` · `Values.js` | Three things never traded, with the independence fine print. On phones an exclusive accordion with 01 open |
| T5 | `close` (talk) | ink · M · W5 | `close/` | The medallion bookend. The CTA label becomes "Message {FOUNDER_NAME}" (`[data-cta-label]`). No founder photo (owner, 2026-10-25: removed from the medallion) |
| T6 | `credits` | ink · credits | `credits/` | The footer that chrome.js fills |

Page-level files: `_page.css` (first), `_bands.css` (last).

## The building (`building/`, owner 2026-10-26)

One procedural three.js office building that persists across the scenes and comes apart part by part (the Portfolio pistol concept). It is not a Section: `pages/story.js` calls `mountBuilding(ctx)` after `mountSections` (its #values click handler must run after Values.js).

- `building-plan.js` (pure, tested in `tests/story-building.test.mjs`): `PARTS` foundation, lobby, floor1-3, roof; `SCENE_PLAN` (lift, glow, turn per scene); `LAYOUT` (where it stands per band: `wide`, or `stack` = phones and portrait tablets as in `_bands.css`); `lerpPose` (parts lift top down and settle bottom up, never through each other); `placement`; `renderMode`.
- Plan: `logo` hidden below the frame (the globe ring owns it) · `top` rises in assembled, the foundation glows · `beginning` the roof lifts off, the lobby glows (one front door) · `values` every floor lifts away, and the glow follows the row under the pointer, in focus or open (01 lobby, 02 floor2, 03 roof) · `close`, `credits` it reassembles as it rises out (o = 0) before the medallion. No part labels in the markup (scene budgets).
- `Building.js`: one fromTo on every cut timeline at `'out'`, 0.95 s (it ends at `'settled'`), from the live pose to the target's. It snaps to the landed scene's pose on `'landed'` and on resize. On a field-change cut the canvas takes `.is-over-iris` until landed. Pointer sway on fine pointers, tier A (createLoop, parks after 2.5 s).
- `building-stage.js` (lazy chunk, three from the jsDelivr URL build.mjs maps): loaded on idle after `film.ready`. It draws on demand only, nothing when o = 0 or the tab is hidden. DPR is capped at 1.5 and at the tier's. Tier B drops mullions, back columns, edge lines and antialias. Tier C and Save-Data never load it (and a drop to C disposes it). At most 22 draw calls.
- `building-model.js`: the geometry (boxes merged per material: body, glass, gold, edges), black and gold only, with a blank sign plate.
- `building.css`: the canvas sits after `#globe` in `.stage` (z-globe, under the scenes, `pointer-events: none`, aria-hidden, data-fit-ignore), fixed in touch-cut. Flow (reduced motion): one still frame of the `beginning` pose, inside `#beginning` under its `.scene__inner`.

## Config and core used

- `pages/story.js` (before boot): `FOUNDER_NAME`, `FOUNDER_LAST_NAME` (`[data-founder-full]`, `[data-cta-label]`), `FOUNDER_PHOTOS` (each `[data-founder-photo="cream"]` slot names its photo; `FOUNDER_PHOTO` is the fallback), `FOUNDER_SIGNATURE`. The name fills only plain lines and labels, **never a split heading** (slice lesson 9). It also fills the no-JS `wa.me` hrefs.
- `[data-when]`: `FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`, `QUOTES`, `REVIEW_NOTES`.
- Core: `Section`. dotglobe `ring` / `medallion` modes are declarative. Mount order: `Logo, Values`, then `mountBuilding`.
- Logo story copy: W for Wealth, C for Cargado, Mark 11:24 as a reference only. The founder's own words are still `[brackets]`.

## Known open issues (plan/round5/final-audit.txt)

- Fit: clean in film, flow and touch at all 9 viewports.
- Seek: no failing frames. The `Logo.js` timing comments explain why the mark draws where it does. Keep T5 clean. Transitions (2026-10-26): `values` is `flood` and `close` is `iris`, and the values rows stagger from 0 s: `quad` or `dot` into `values` and `quad` into `close` each failed a seek frame (text straddling the wipe edge, and the tier C swap leaving `values` near empty at 25%).
- Perf: mobile script transfer 79.2 KB (budget 70). The building stage (three) loads on idle: re-run perf-gate.
- The building: `LAYOUT` checked in a browser at 360x740 to 1920x1080 (2026-10-26): it never sits under a heading or a reading line (wide: low in the gap left of the portrait on `#top`, top right above the rows on `#values`; stack: in the copy's free corners, the `beginning` pose also clear in the flow still). Re-check with screenshots if the copy or the bands change.
- Owner content: the founder confirms the draft story, the background and logo wording, and the optional sentence on faith.
