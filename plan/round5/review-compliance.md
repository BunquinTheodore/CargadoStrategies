# Review 1 · Compliance

Reviewer: compliance specialist (read-only). Date: 2026-10-19. Inputs: DIRECTION "Fixed constraints" and §10, `plan/round5/compliance-baseline.json`, `plan/round5/compliance-moves.json`, `plan/round5/shots-r5/review-1/`, and live checks against `dist/` on my own server (port 8451, stopped afterwards).

**Verdict: no compliance defects found.** Score: n/a (-1, non-scoring reviewer).

## 1. T4: tools/compliance-diff.mjs

| run | served from | result |
|---|---|---|
| review-1 evidence (`shots-r5/review-1/compliance-diff.txt`) | :8401 | 0 missing, 0 altered, brackets 55/55 |
| re-run by this reviewer | dist/ on :8451 | 0 missing, 0 altered, brackets 55/55, exit 0 |

Per page (dist): index 23 ok, 2 retired, brackets 8/8 · services 24 ok, 2 moved, 1 retired, 10/10 · story 11 ok, 1 retired, 6/6 · partners 28 ok, 21/21 · legal 31 ok, 10/10. The "We only message from +1 (204) 869 2508" line is present on all 5 pages (footer, `chrome.js`).

The 4 retirements were checked by hand: all four are §10 ledger spec-speak ("The rail does the disclosure…", "Each section/one says whether…", "named as hers and shown separately…", and the Story `#network` heading that §10 merges into T4). None of them is a fixed-constraint line.

What the tool does not check (and so was done by hand below): where a line sits (scene and order), whether it is visible, Mark 11:24 being unquoted, and that the owner-removed placeholders stay removed.

## 2. §10 compliance moves, read line by line in site/ and dist/

| # | move | where it is now | verbatim | visible (360x740 and 1440x900) |
|---|---|---|---|---|
| 1 | Home finder notice → H5 fine print | `index.html` `#find .fineprint` (+ "Details →" link) | yes, including "Sorted by distance only." | yes (shot `index/360x740/05-find.png`) |
| 2 | Story `#network` notice → T4 | `story.html` `.values__fine`, `<strong>` lead kept | yes | yes (shot `story/360x740/04-values.png`) |
| 3 | Partners `#apply` 2 notices → one P5 block | `partners.html` step 8 `.apply__terms`, Commission then Independent partners | yes, in order | in the final stepper step, as moves.json specifies |
| 4 | Partners `#arrangement` → P2 | `partners.html` `.how__fine` | yes, bracket kept | yes (shot `partners/360x740/02-how.png`) |
| 5 | Hero city hint and send note → C22 | every page's sheet, step 3 | yes | in the sheet (opens on a CTA) |
| 6 | Outsourcing hint split | S5 `.fineprint` "Provided by Cargado Strategies itself, not by a partner." + C22 send note | yes | yes |
| 7 | Home founder `.offer__fine` → door fine print | doors 02 and 03 | yes | wide: yes; phone: inside the collapsed door, shown on expand (§7.1 H4 phone spec), door 01 open by default |
| 8 | Legal draft band | `.legal-draft`, dash in `.visually-hidden` | yes ("Draft — to be reviewed by a lawyer in Canada before launch") | yes, fixed under the header |

Other notices kept word for word: Services insurance and strategy notices, S6 finder notice (visible on phone, shot `services/360x740/06-finder.png`), the S7 inquiry notice, the categories dialog notice (`services-categories.js`), Partners tiers notice (tiers dialog), Legal contents "Draft for review" notice, the partner-profile notice, and the footer block on every page.

## 3. Fixed constraints

- "strategy and coaching only, not licensed accounting, tax or investment advice": Home door 02, Services S3 (baseline wording "Strategy and coaching only. Not licensed…"), the footer on every page, Legal FAQ.
- "Nothing is sent until you tap send": present in C22 on all 5 pages, under the S7 and P5 send buttons, plus the baseline Partners success text and FAQ answer (both pre-existing, verbatim).
- "Provided by Cargado Strategies itself": Home door 03 and Services S5.
- "We only message from +1 (204) 869 2508": footer, 5 of 5 pages.
- Mark 11:24: `story.html` `.logo__ref` shows the reference only; no verse text anywhere in site/ (searched "ask in prayer", "believe that you", "whatever you ask": 0 hits); no rule before it.
- Owner-removed lines: "[Wording to be confirmed by counsel]" 0 hits and "[licence / registration]" 0 hits in site/. (Legal's "[Wording to be set by counsel.]" is a different, baseline placeholder: 3 baseline hits, kept.)
- Numbers unbracketed: no visible "[2]", "[3]", "[24h]" etc.; "[n]" (stats, live count) is a word placeholder and stays bracketed. Only a source comment in `config.js:104` still says "[n] of [2]" (not rendered; not a defect).
- No invented partners, stats, testimonials or credentials: proof stats, quotes and the founding live count sit in `data-when` slots with brackets.

## 4. Visibility probe (dist, 360x740 and 1440x900, every `[data-compliance]`, `.fineprint`, `.hint`)

Every compliance line is either visible, or hidden only by a designed container: the C22 sheet steps, form stepper steps, a closed dialog (categories, tiers), the not-yet-live finder (`#finder-root[hidden]` until partners exist; its fine print sits outside it and is visible), or the phone accordions that §7.1 H4 and §7.3 T4 specify (door 02/03 fine print, value 02 body). Story's "[Draft story…]" note is review-mode only, as §7.3 says. Fine print renders at 15 px (phone) and 16 px (desktop). The hero trust line's "Licence shown where one applies" is phone-hidden, which §7.1 allows (it is not compliance copy).

## Findings

None that need a change.
