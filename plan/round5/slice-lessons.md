# Round 5 · Slice lessons (stage 4 reads this first)

Three G3 rounds on Home (`slice-review.md`, `slice-*.md`, `shared-requests.md`) turned up the same mistakes more than once. Each lesson below changes how the other pages are built or checked. Where a lesson names a file you do not own, file a line in `shared-requests.md`; do not edit it.

Pages: **services**, **story**, **partners**, **legal** (and **home**, which keeps polishing). DIRECTION stays the source of truth; these are the rules the slice showed it needs in practice.

---

## A. Process

1. **Judge only a fresh build.** All three G3 rounds found `dist/` older than `site/` (bracket names, retired credential lines, `[24h]`). Before any shoot or review: `npm run build`, then confirm `dist/<page>.html` is newer than every source file the page uses.
2. **Judge the cheap path, not just tier A.** The audience is a mid-range phone. On the slice, one janky sample dropped both desktop and phone to tier C, and every remaining motion gap lives there. Check every page on: tier A desktop, natural tier desktop, 390x844 touch-cut, 360x740, and reduced motion.
3. **Check brushed-gold frames by eye.** `seek-test`'s near-blank check (σ ≥ 4) counts the brushed texture as content, so an empty gold field passes (visual V3). Look at every 25 % frame of a cut into or out of gold.
4. **Known tool false positives (open requests).** Every phone sheet reports `spare 0 < 24` (fit-probe, request line 35); seek-test still judges text outside a circle clip (line 65). Do not "fix" a page for these.

## B. Cut timing (every page with film cuts)

5. **The entering scene must carry the 25 % frame.** Same-field cuts now take the out group to 0 by `'in'` (0.30 s), and tier C / touch-cut swap the field hard with the out group gone. So:
   - the eyebrow and the headline's first word start **at `'in'`** (`data-delay` 0-0.3 on in-group slots, nothing later);
   - page choreography (`film.on('cut')`) must draw ≥ 2 % of the scene by ≈ 0.42 s; long page timelines that hold the headline for a later beat fail (Home W2 needed this, request line 66; legal and partners measured 0.3-1.4 % at @0.5);
   - door / panel deal-ins start ≤ 0.36 s.
6. **Never assume the iris fills the frame.** Engine fixes for the swap path (M1: in group at the swap, pan at full opacity) are open with 2a. Build so the page still shows content from `'in'` whether or not the iris plays.
7. **`#close` statements:** the first word at `'in'`; never animate `.medallion` (dotglobe owns it, request line 51).
8. **No removed sound voices** ('tick', 'hover', 'tone', 'whoosh', 'splash', the progress hook). Use the `sfx` from `boot()`; do not import `sfx.js` (lines 8, 28).

## C. Runtime text and reveals

9. **Never set `textContent` / `innerHTML` on an element inside a split heading.** The build splits headings into `.rv-mask/.rv-word`; overwriting them leaves an unmasked word floating ahead of the reveal (motion M2, the "Lee" ghost). To fill config values (FOUNDER_NAME, FOUNDER_LAST_NAME, city, etc.) inside a revealed heading, write into the existing `.rv-word` and remove spare masks, or substitute before `build-splits.mjs`. Story T1 ("[First name] [Last name], founder") and T5 ("Message [First name] →") are the obvious places.
10. **Founder name, contact details and address come from `config.js` only** (OWNER INFO lines 42, 59). Never hard-code them a second time.

## D. Layout and composition

11. **Multi-column doors and panels share one left edge.** `ui.css` `.door { justify-content: flex-end }` packs a grid door's auto column to the right, so each door's text starts at a different inset (Home: 72 / 29 / 56 px). When a page turns `.door` (or any panel) into a grid, set `grid-template-columns: minmax(0, 1fr); justify-content: stretch;`. Use subgrid rows (title / quote / offer / fine / CTA) so titles and CTAs share baselines; if a door lacks a row, keep the shared CTA baseline and accept the hole. Applies to **Services S5** (4 panels) and **Partners P3** (3 tiers).
12. **Ghost numerals never share ink with copy.** Anchor them to the title's floor at the item's right, cap them (`min(--fs-ghost, 24svh)`, laptop-short `20svh`), hide them on phones, and keep **one numeral per item** (no small "01" beside a ghost "1"). Services S5's spec "ghost at 40svh" collided on Home at that size; cap it.
13. **Eyebrows clear the header.** The first line of every scene sits ≥ header + `--space-xl` (Home: ≥ 54 px at 1280, ≥ 120 px eyebrow top at 1440). Check laptop-short (1280x720), where it failed twice.
14. **No dead bands.** Monument scenes are one composed group, not "top-right strikes, bottom-left monument". Targets the judges used: a gap inside a scene ≤ ≈ 15 % of its height; empty space below the last element ≤ ≈ 10 % on phones; CTA baselines ≥ 48 px off the bottom edge.
15. **Phone monuments go to 2 lines** at `clamp(3.5rem, min(23vw, 11svh), 6rem)` rather than one small line in the middle of nothing (Home H2: 56 px → ≈ 90 px). Applies to Story T2 "One Place. Not *Five*●" and Services S3.
16. **Map bands on phones leave room for the label.** dotglobe draws "A Professional Near You" / "You" just past the anchor's bottom edge when the node sits low. Keep ≥ 24 px between the map anchor's bottom and the next text on phones (Home: map `max-height: 32svh` or a copy top inset). Applies to **Services `#finder`** (map band 32svh) and **Partners `#hero`** (map band 30svh, "You" label).
17. **The gold field is cut-sensitive.** Every gold scene (Services S5, Partners P4) inherits the open gaps: empty gold at the 25 % frame of bone→gold / ink→gold, no visible sheen, and the flat gold header band on phones. Front-load the in group (lesson 5) and do not add effects to compensate.

## E. Typography

18. **No hanging separators.** Any line with " · " between items is set as `white-space: nowrap` pairs (`<span class="nw">A · B</span> <span class="nw">C · D</span>`) or one line at wide widths, so a middot never ends a line (Home hero trust line and eyebrow, open for 3 rounds).
19. **Strike lines stay on one line on phones** (`white-space: nowrap`, `min(1.75rem, 7.2vw)`) until 2b draws the strike per line (request line 60).
20. **The title leads, the quote echoes.** In doors, panels and rows with a title plus a Times italic quote, the quote is ≤ `max(28px, min(.78 × --fs-d2, 4cqh))`, clearly under the title.
21. **One uppercase tracked string per scene** (the eyebrow). Step labels, metas and tags are sentence case; `.steps__when` already is. Times ≥ 28 px, quotes ≥ 24 px on phones; the 14 px floor and 16/15 px fine print hold.
22. **Italic accents ending in f, j or y no longer clip** (`fx.css` overhang). Do not add `overflow: hidden` to headline wrappers.
23. **Long single-line rows:** check 1440 for one row wrapping alone (Home situation row 03) and 360 for tags wrapping; stack metas under titles on desktop when a row would break.

## F. Copy and compliance

24. **Only §7 copy.** Home's additions not in §7.1 ("2 spots open in [month]", "from [$x]/hr", "terms [to be confirmed]") were removed as clutter or unverifiable claims. Put a line only where your page's §7 table puts it.
25. **Owner decisions override the old baseline** (shared-requests OWNER INFO lines 42, 43, 53, 54, 59, 67): no brackets around numbers; "[Wording to be confirmed by counsel]" and the footer "[licence / registration]" are gone everywhere; no "[company name]" for business strategy; the founder credential line "[company name] · licence [#] · [regulator]" is gone everywhere; only +1 (204) 869 2508. Word placeholders ([City], [$x], [First name], etc.) keep their brackets. Never reintroduce a removed line.
26. **No stand-in face, ever.** Photo and signature slots stay `[data-when="FOUNDER_PHOTO"]` / `FOUNDER_SIGNATURE` and render nothing until the owner supplies the file (O1, blocking for launch). Story T1/T5 portraits follow the same rule (typographic portrait C33 meanwhile).
27. **Hero leads ≤ 40 visible words** on the first phone screen is the judges' bar; Home's 33-word lead failed it. If a page's §7 lead pushes the hero past 40 words or 4 phone lines, file a copy request; do not edit spec copy yourself.

## G. Shared nodes (do not touch; known open gaps)

28. **`#credits` is 2b's.** The phone address tower, the small Times tagline, the face switch on contact labels and the 360x740 spare (23 < 24) show on every page until 2b fixes them (G6 in `slice-review.md`, request line 63). Page CSS must not style `#credits`.
29. **Engine / visual gaps that every page inherits** (2a / 2c own them): the empty-field swap path, centre irises starting as a dot, W4 on tier C, the sheen, the splash ≈ 0.16 s long, the hero arc node pick. Report page-specific evidence for them in `shared-requests.md`; do not work around them with page timelines beyond lesson 5.
