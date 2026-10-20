# Round 5 re-judge: mobile and accessibility (round 1)

**Overall: 7 / 10** (baseline 5 / 10 in `judge-mobile-a11y.md`). Not yet the ≥ 8 that T8 asks for.

Lens and rubric unchanged from `judge-mobile-a11y.md`: the 390x844 experience, tap targets, text sizes, measured contrast, keyboard and screen reader basics, reduced motion, scroll length, for Canadians 30-45 on mid-range phones. Judge date 2026-10-19.

## Scores

| Page | Was | Now | One line |
|---|---|---|---|
| index.html | 5 | **8** | The phone hero is now a real first screen: headline, one gold "Get My Introduction" button, the trust line, all inside 844 px. 7 screens instead of 12, 0 text under 14 px, 0 targets under 44 px, 0 axe violations. The situations rows and the gold doors accordion are the model for the rest of the site. |
| services.html | 4 | **7** | The biggest gain: 9 screens instead of 13.2, the inquiry is a 5-step stepper that fits on one screen, and nothing is clipped. Still: the finder select is cut to "Choose a ser", the closing medallion collides with the map label, and the inquiry headline is pushed against the header with 40% dead space below. |
| story.html | 6 | **7** | Calm and legible; "One Place. Not Five." is the best phone typography on the site. But the dotted C ring from the logo scene crosses the closing headline, and the top scene sets the founder bio over the monogram line art. |
| partners.html | 4 | **7** | 7 screens instead of 13.1, and the application is an 8-step stepper with 2 fields per step. The founding scene on a phone spreads headline, body and CTA to the top, middle and bottom, so it reads as a broken layout. |
| legal.html | 5 | **7** | The contents rows, the paged clauses (Page 1 of 3) and the Q&A accordion are all good phone patterns. It is the only page with an axe violation, and the close scene is mostly empty. |

## How this was measured

- **Evidence set:** `plan/round5/shots-r5/review-1/` (all 390x844 and 360x740 scenes, transitions, fit film/flow/touch, seek test, console, compliance, perf gate).
- **My own live probe**, read-only, against `dist/` served on port 8446 (my own `serve.mjs`, stopped afterwards), with my own headless Chrome (`tools/lib/cdp.mjs` `launchChrome`, isolated profile). The script and raw output are in the scratchpad: `...\scratchpad\rejudge-ma\probe.mjs` and `probe.json`. For every scene on all 5 pages, in touch-cut mode at 390x844 and 360x740, and in flow (reduced motion) mode at 390x844, it:
  - scrolls the scene into view;
  - lists visible text under 14 px;
  - lists visible interactive targets under 44 px tall;
  - lists text under the header or below the fold.

  It also runs axe-core 4.10.2 on every page (top and end) and on the WhatsApp sheet. It checks reflow at 320 px, a 200% root text size, the sheet at 360x740, and the Sound switch.

### Measured results

| check | baseline | now |
|---|---|---|
| Phone scroll length (390x844) | index 10,167 px (12 screens) · services 11,166 (13.2) · partners 11,020 (13.1) · story 6,752 · legal 6,608 | index **5,916 (7)** · services **7,604 (9)** · partners **5,916 (7)** · story **5,072 (6)** · legal 6,752 (8, paged) |
| Visible text < 14 px, touch-cut 390 and 360 | 1-23 nodes per scene, floor 11 px | **0 on every scene of every page** (flow mode also 0) |
| Interactive targets < 44 px, phone | about 8 distinct (map 12x5, inline links 19-23 px) | **0** in touch-cut and flow, 390 and 360 |
| Clipped or below-fold controls at the focus point | 60+ (inquiry submit, 13 partner fields, footers) | **0** (fit-touch all ok at 9 viewports; my probe found 0 outside the legal pager windows, which are paged by design) |
| axe-core violations | not run | **0** on index, services, story, partners and the sheet; **legal: 1** (`region`, moderate: `.legal-draft` sits outside the landmarks) |
| Lighthouse Accessibility (mobile) | — | 100 on all pages measured |
| Horizontal scroll at 320 px | — | none on all 5 pages |
| WhatsApp sheet at 360x740 | did not exist | fits (top 180, bottom 740, no inner scroll), all chips ≥ 44 px, focus moves to the step title with a hidden "step x of y" |
| Phone SFX | on by default, a tick on scroll | silent on coarse pointers (`sfx.js`), no scroll tick |
| Splash | every page load, up to 2.2 s | once per session (`cs-splash`); the first visit is still 2,153 ms on mobile against a 1,100 ms budget (perf-gate) |
| Console | — | 0 errors and 0 warnings in 30 runs |

## What fixed the baseline defects

- **B1 clipping (critical): fixed.**
- **B2 scrolljack length (critical): fixed.** Native mandatory snap on touch, with 6-9 screens per page.
- **B3 hero CTA below the fold: fixed.**
- **B4 small text: fixed.** 0 nodes under 14 px. Labels are sentence case, and eyebrows are the only tracked caps.
- **B5 long forms: fixed.** Steppers, and the sheet.
- **B6 sound: fixed on phones.**
- **B9 targets: fixed.**
- **B10 splash: mostly fixed.**
- **B14 live regions: partly fixed.** The partners stepper has one live region; the services stepper and the sheet rely on moving focus to the step heading, which is acceptable.
- **B12 small Times: largely fixed.** Item titles are in Manrope.

Still open: **B11** (large text and zoom fallback) and part of **B8** (decoration through reading text).

## Findings, ranked by severity

| # | Sev | Finding | Evidence | File that must change |
|---|---|---|---|---|
| F1 | **High** | **No large-text fallback (B11 still open).** With Android's font-size setting or a 200% root text size, touch-cut keeps fixed `100svh` scenes. Every scene clips (index 13 clipped strings across 7 scenes, services 21, partners 15). In the credits, the contact labels overlap ("WhatsAppCall Emailfacebook") and the fine print runs off the scene. For a 40+ audience this is the most likely real-world failure left. | `...\scratchpad\rejudge-ma\text200-index.png`; `probe.json` `text200` | The inline mode script in the `<head>` of `site/index.html`, `site/services.html`, `site/story.html`, `site/partners.html` and `site/legal.html`: add a rem probe (`parseFloat(getComputedStyle(document.documentElement).fontSize) > 20`, or a 1rem element measured against 16 px) that forces `flow` mode. Mirror it in `site/assets/js/film.js` on resize. |
| F2 | Medium | **The story close headline is crossed by the dotted C ring** left over from the logo scene. The ring runs through "Need. I'll Find Someone Good." at both 390 and 360. This breaks DIRECTION §4.4 rule 3 (objects beside text, never behind). | `story/390x844/05-close.png`, `story/360x740/05-close.png` | `site/assets/js/story.js` (hide or park the ring on `#close` on phones) and/or `site/assets/css/story.css` |
| F3 | Medium | **On the services close, the medallion collides with the map label.** "A Professional Near You" is cut by the medallion at 390, and touches it at 360. The map, medallion and headline compete in one column. | `services/390x844/08-close.png`, `services/360x740/08-close.png` | `site/assets/css/services.css` (phone `#close`: drop the map label or the map on phones, or push the medallion below the map band) |
| F4 | Medium | **The finder service select is truncated** to "Choose a ser" at 390 and 360, because two half-width fields share a row. Older users cannot read the prompt in the one control that matters on this scene. | `services/390x844/06-finder.png`, `services/360x740/06-finder.png` | `site/assets/css/services.css` (stack the service and city fields full width below 480 px, or shorten the placeholder in `site/services.html` to "Service") |
| F5 | Medium | **The partners founding scene falls apart on phones.** `#founding .scene__pan { justify-content: space-between }` puts the headline at the top, the body in the middle of empty gold and the CTA flush at the bottom edge (722 of 740 px). It reads as missing content, not as a monument. | `partners/390x844/04-founding.png`, `partners/360x740/04-founding.png`; `partners.css:233` | `site/assets/css/partners.css` (group the head and body, then keep the CTA in the thumb zone with a fixed gap rather than `space-between`) |
| F6 | Medium | **The services inquiry is top-heavy.** There is no eyebrow, the headline sits about 12 px under the header bar, and the bottom 35-40% of the screen is empty. At 360 the headline wraps to 2 lines tight against the header. | `services/390x844/07-inquiry.png`, `services/360x740/07-inquiry.png` | `site/assets/css/services.css` (phone `#inquiry`: centre the paper vertically or add `padding-top: var(--space-l)` with the eyebrow) |
| F7 | Medium | **Legal fails axe** (`region`): the draft banner `.legal-draft` (`role="note"`) is outside every landmark. DIRECTION T6 requires 0 violations. | `probe.json` `axe["legal.html touch-top"]` | `site/legal.html` (move `.legal-draft` inside `<header>` or `<main>`, or make it `role="region"` with its label) |
| F8 | Low | **Decoration still sits behind reading text** in places. The story top sets the bracketed founder bio over the monogram outline. The services insurance scene sets "Lee Holgado [signature]" over the outline W. Star dots fall inside the services intro rows. Small, but it is the residual "busy" texture the baseline B8 named. | `story/390x844/01-top.png`, `services/390x844/02-ours-insurance.png`, `services/390x844/01-intro.png` | `site/assets/css/story.css`, `site/assets/css/services.css` (drop the outline to ≤ 0.15 opacity or offset it from the text column on phones) |
| F9 | Low | **The Sound switch lies on phones.** The credits show "Sound **On**" (`aria-pressed=true`), while `sfx.js` is silent on coarse pointers. A screen reader user is told sound is on. | `index/390x844/07-credits.png`; `probe.json` `sound` | `site/assets/js/chrome.js` (on coarse pointers, hide the Sound row or show it as Off and disabled, with a note) |
| F10 | Low | **The first-visit splash on mobile is 2,153 ms** against the 1,100 ms LCP guard (perf-gate). Once per session now, but the first impression on a mid-range phone is a wait. | `review-1/index.md` perf misses | `site/assets/js/splash.js` |
| F11 | Low | **The legal close scene is a headline plus a small black button in an empty bone screen** (the button is not full width as on other pages), and the draft banner takes 49 px of every legal screen. | `legal/390x844/07-close.png` | `site/assets/css/legal.css` (full-width CTA on phones, as on the other closes) |
| F12 | Low | **Services "What You Get" has no action** and its outline numerals are very pale on bone. It is 1 of 9 screens with nothing to do. | `services/390x844/04-ours-includes.png` | `site/services.html` (an "Ask About the Clean-Up" link) or merge it with `#ours-strategy` |

## What to keep (do not regress)

- The 0-small-text and 0-small-target result across all 5 pages, in both touch-cut and flow.
- The WhatsApp sheet: it fits at 360x740, uses 56 px chips, moves focus to the step title, and carries the verbatim "Nothing is sent until you tap send" note.
- The index situations rows, the gold doors accordion, the legal contents rows and the legal pager. These are the best phone patterns on the site.
- Silent SFX on touch, the splash once per session, and native snap with no JS glide on touch.
- The compliance fine print is now 15-16 px reading text, not 12-13 px fine print (index find, services finder, partners how, story values).

## To reach 8

Fix F1 (large-text fallback to flow), then F2-F7. All are local CSS or markup changes except F1, which is one head-script check per page plus a resize mirror. With F1-F7 done I would score index 8-9, services 8, story 8, partners 8, legal 8, overall 8.
