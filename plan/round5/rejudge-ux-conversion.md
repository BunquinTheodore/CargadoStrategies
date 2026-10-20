# Round 5 re-judge, round 1: UX and conversion

**Overall: 6.5 / 10** (it was 4.5 in `judge-ux-conversion.md`)

The lens has not changed. Can a Canadian aged 30–45, reading on a mid-range phone, tell within 5 seconds what Cargado is, who it is for and what to do next? Does the site feel premium and modern without feeling clogged? DIRECTION.md is the target.

The build now passes the 5-second test. The hero lead names Lee and her three services, and it presents the network as "for everything else". There is one CTA verb ("Get My Introduction"), a WhatsApp button in the phone header, Call and Email paths, and hidden proof slots. Home is down to 6 scenes, with one idea per screen. The site is not yet "genuinely excellent" (an 8) for three reasons:
- there is still no face;
- three scenes are dominated by bracket placeholders;
- on the phones this audience uses, the first impression is slow (the splash takes 2.1 s on mobile and the Home cuts run at 29 fps).

## Evidence

- `plan/round5/shots-r5/review-1/`: every scene at 1440x900, 1280x720, 390x844 and 360x740, plus compliance, console, fit and perf outputs.
- My own live run on **dist/** (served on my own port 8445, now stopped) with isolated headless Chrome. Screens and logs are in `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\ux-r1\`. On desktop I walked Home with PageDown. On a 390x844 touch screen I opened the WhatsApp sheet, the Call / Email sheet, the menu and the deep links.
- Live results:
  - Home walks 7 scenes in 6 gestures and lands each one.
  - The hero CTA opens the sheet. Picking a chip moves on to step 2 ("Your City", with the verbatim hint).
  - "Or Call / Email Us" shows `tel:` and `malee.holgado@mygreatway.ca`.
  - The phone menu lists the pages, then WhatsApp / Call / Email / Facebook / address.
  - `services.html#legal` opens the categories dialog on Legal.
  - Console: 0 errors (console-check: 30 runs clean). Compliance: 0 missing, 0 altered, brackets 55/55.

## Per-page scores

| Page | Was | Now | One line |
|---|---|---|---|
| Home | 4.5 | **7.5** | Clear identity, 6 calm scenes, one CTA verb, a thumb-zone CTA and a header WhatsApp button on phones. The struck searches and the metal doors are memorable. No portrait; the splash is slow on phones. |
| Services | 4 | **6.5** | Ours and Partners are separated, the concierge replaces the empty finder, and the inquiry is a 3-step stepper. The outsourcing gold scene is 100% placeholders, the categories dialog still pitches "Partner Spot Available · Apply to Join" to clients, and the finder fine print talks about a list that is not shown. |
| Story | 5 | **6** | The hero is now "I Started Cargado…" with her name, and the close is "Message Lee →". But the largest object in the hero is a bracket placeholder set in display type, and the beginning scene has 3 brackets in 3 lines. |
| Partners | 6 | **7** | Strong single-audience pitch: one verb ("Apply to Join"), honest commission rows, a founding offer on metal, and a FAQ close. Tiers are still placeholders, and the phone application runs to "Step 1 of 8". |
| Legal | 6 | **7** | Calm and findable: an always-visible draft band, the paged reader and drill FAQ, and a single CTA close. The FAQ and close scenes leave about half the screen empty, which is fine for this page. |
| **Overall** | 4.5 | **6.5** | Every critical issue from the original review (B1 identity, B2 dead-end finder, B4 CTA sprawl, B7 length, B8/B9 phone channel, B10 video box) is fixed or contained. The remaining gap to 8 is the face, the placeholder-heavy scenes and phone performance. |

## Original defects: status

| # | Then | Now |
|---|---|---|
| B1 identity split | Critical | **Fixed.** The hero lead: "Send one message to Lee… She handles insurance, business strategy and outsourcing herself, and introduces you…" |
| B2 finder dead end | Critical | **Mostly fixed.** The concierge sits on Home `#find` and Services `#finder`. The **categories dialog still shows "Partner Spot Available · Apply to Join"** (F3). |
| B3 no human | Critical | **Partly fixed.** She is named everywhere, but there is no photo (`FOUNDER_PHOTO = ''`), and the story hero shows a bracket block (F2). |
| B4 CTA sprawl | High | **Fixed.** Clients get "Get My Introduction →", with "Ask About … →" on the founder offers. Partners get "Apply to Join →". |
| B5 placeholder proof | High | **Fixed.** Stats, rating and quotes are hidden by `data-when`. |
| B6 crowded scenes | High | **Fixed.** Strategy is split into 3 scenes, and the forms use steppers. |
| B7 home length | High | **Fixed.** 12 scenes became 6 + credits. |
| B8/B9 WhatsApp only, no phone CTA | High | **Fixed.** Header WhatsApp icon (44 px), `tel:`, email, and the menu contact rows. |
| B10 video box | High | **Fixed.** The box is deleted. |
| B11 audiences mixed | Medium | **Mostly fixed.** Partners appear on Home only as a close row. The client categories dialog still recruits (F3). |
| B12 story has no exits | Medium | **Fixed** at the close ("Message Lee →"). |
| B13 low contrast | Medium | **Fixed** in the shots. Inputs are dark with clear borders, and the fine print is legible. |
| B14 fragile boot | Medium | **Fixed.** 30 console runs clean, and the flow fallback fits. |

## Findings, ranked by severity

### High

**F1 · Phone performance spoils the first impression for the target device.**
- The perf gate on dist shows the splash at **2153 ms on mobile** and 1636 ms on desktop (budget ≤ 1100 ms).
- Home touch-cut runs at **29.3 fps** (tier C, budget ≥ 55), and the Home long task is **307 ms** (budget ≤ 50).
- Story mobile runs at 43.7 fps, and partners desktop at 33.6 fps.
- In my live desktop run, the splash was still the only thing on screen at 400 ms, and load finished at about 5.4 s.

A sceptical visitor on a mid-range Android waits twice as long as the spec allows before seeing any content, and then gets stuttering cuts. That reads as "slow site", not "film".
- **Files:** `site/assets/js/splash.js` (enforce the 1.1 s cap and make it independent of the engine), `site/assets/js/home.js` / `site/assets/js/film.js` (split the 307 ms task and defer globe and stars work until after the first paint).

**F2 · Still no face, and the story hero's largest object is a placeholder.**
- `story.html` T1 sets "[One or two sentences about the founder's background and what led her here.]" in Times at display size inside the C·W ring. At 390x844 it fills the top half of the first screen, above the headline (`story/390x844/01-top.png`).
- The Services insurance portrait shows "Lee Holgado [signature]" (`services/1440x900/02-ours-insurance.png`).

People buy insurance from a person, and this is the warmest page on the site.
- **Fix:** keep the bracket text, but set it at `--fs-note` as a `.ph` line under the name, not at display size. Let the typographic portrait carry only "Lee Holgado" plus a plain role line. Hide `[signature]` behind `data-when="FOUNDER_SIGNATURE"` (config already documents that: "Empty = hidden"). Getting the photo remains the owner's #1 to-do.
- **Files:** `site/story.html`, `site/services.html`, `site/assets/css/story.css`.

### Medium

**F3 · The client-facing categories dialog still recruits partners.**
`services.html#legal` (and every category) shows an empty logo square, then "Partner Spot Available · Legal · no partner listed here yet", then "Apply to Join", above the client CTA (live `d-services-legal.png`). A client who asked for a lawyer is shown a recruitment card.
- **Fix:** while `PARTNERS.length < FINDER_MIN_PARTNERS`, render the detail pane as the concierge ("Tell us your city and we'll introduce you") with only "Get My Introduction →". Keep the partner-spot card for `partners.html` only.
- **File:** `site/assets/js/services-categories.js`.

**F4 · Services outsourcing, the page's only gold "wow" scene, is entirely placeholders.**
It shows `[Bookkeeping]`, `[Inbox and Calendar]`, `[Social Media]` and `[Customer Follow-Up]` at display size, 4× "[what this role takes off your plate]" and "From [$x]/hr" (`services/1440x900/05-ours-outsourcing.png`). The brackets must stay, but at this size they make the showpiece look unfinished.
- **Fix:** put the per-panel description lines and the price behind `data-when` (review mode shows them), so the panels read as four titles plus the CTA. Ask the owner for the four roles.
- **Files:** `site/services.html`, `site/assets/js/services.js`.

**F5 · The header "WhatsApp" button opens a 3-step form, not WhatsApp.**
On a phone, the WhatsApp icon opens "Step 1 of 3 · What You Need" with 10 chips (`m-sheet.png`). A visitor who tapped "WhatsApp" because they just want to chat now needs 3 more taps. The `href` is already a valid `wa.me` link with a generic message.
- **Fix:** add one quiet line on step 1, "Just open WhatsApp →" (the trigger's own `wa.me` href). Keep the chip flow as the default.
- **File:** `site/assets/js/wa-sheet.js`.

**F6 · The partner application on phones is 8 pages** ("Step 1 of 8 · Your Business", `partners/390x844/05-apply.png`). DIRECTION §7.4 groups it into 4 steps. On phones the stepper splits every fieldset into its own unit, so a professional sees "1 of 8" and doubts it is worth it.
- **Fix:** label progress by the 4 logical steps ("Step 1 of 4 · Business, page 1 of 2"), or pair the short fieldsets so there are at most 5 units.
- **File:** `site/assets/js/partners-form.js`.

**F7 · Fine print refers to a list the visitor cannot see.**
- Services `#finder` (concierge mode) says "**Sorted by distance only.** This list is not a recommendation…" under a form, with no list on screen.
- Home `#find` says "Sorted by distance only. … a listing is not a recommendation."

Wording that doesn't match the screen undermines the honesty this audience values. Compliance copy may be **moved**, and the categories dialog already carries the equivalent notice. While the concierge is shown, keep only the commission and independence sentences (verbatim) under the form, and move the "Sorted by distance only. This list…" block into the dialog and the results.
- **Files:** `site/services.html`, `site/index.html` (check with the compliance-diff owner first).

### Low

**F8 · Direct arrival at `services.html#finder` shows the round globe, not the Canada map and arc** (live `d-services-finder.png`). W4 plays only on a sequential cut, so a deep link from a Home situation row misses the signature moment.
- **File:** `site/assets/js/film-map.js` (run the morph on a deep-link landing too).

**F9 · Map and ring leftovers behind `#close` after immediate jumps.**
- In the review shots (`services/*/08-close.png`, `story/*/05-close.png`), the finder's Canada map and the logo's particle ring stay painted behind the close statement and the "Questions? Read the Fine Print" link. At 390, the medallion also clips the "A Professional Near You" label.
- My sequential walk and the `#close` deep links on dist were clean, so this is limited to `goTo(…, {immediate:true})`. The menu and row jumps may use the same path, so verify there.
- **File:** `site/assets/js/film-map.js` (hide the map on immediate seeks away from `#finder`), and the story logo collapse in `site/assets/js/story.js`.

**F10 · The phone finder select is truncated** to "Choose a ser" at 390x844 (`services/390x844/06-finder.png`). Stack the two fields full width under 420 px.
- **File:** `site/assets/css/services.css`.

**F11 · Sound defaults to "On".** On phones, unexpected blips and breaths in a public place are a reason to leave.
- **Fix:** default `cs-sound` to off on coarse pointers (the SFX spec is mostly desktop already).
- **File:** `site/assets/js/sfx.js`.

## What now earns the score (keep)

- The Home 5-second read: the eyebrow, "The Right Professional, *Near You*●", a lead that names Lee and her 3 services, one gold CTA and "Or Call / Email Us". On a phone, everything sits above the thumb zone with a full-width CTA.
- W2 "One *Message*●" with the struck searches. It explains the value with no extra copy.
- The W3 metal doors. On a phone they become an exclusive accordion, with the "Ask About Insurance →" CTA open by default.
- The medallion close on every page gives a consistent, calm ending with one action.
- The WhatsApp sheet:
  - 56 px chips;
  - the verbatim city hint;
  - "Step n of 3";
  - Call and Email reachable from the hero.
- Partners: "Pay on Clients, Not on *Clicks*●", with rows and honest notices, and one verb throughout.
