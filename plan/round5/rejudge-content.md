# Round 5 re-judge: content and copy (review 1)

## Overall: 6.5 / 10 (up from 5 / 10)

The site now has a voice and a person. Lee Holgado is named in the hero, on the founder doors, on Services and on Story. The Home film tells one idea per screen. The CTA verbs are down to three. The spec-speak is retired and the compliance notices read as fine print instead of warnings. On Home, the content is close to excellent.

The score stays below 7 for three reasons:
- **Instruction placeholders are still the largest type in three key frames:** the Story `#top` portrait, the Services outsourcing panels and the Partners tier prices. A reader sees an unfinished template exactly where the brand should feel most personal or most concrete.
- **Services lost its best conversion copy** (the "Fixes:" pain lines) and now asks for the same two fields twice in back-to-back scenes.
- **Two close scenes show leftover map or ring art over the closing statement** (Services, Story).

| Page | Then | Now | One line |
|---|---|---|---|
| Home (`index.html`) | 5 | **7.5** | Now 6 scenes plus credits, each with one new idea. Lee is named in the first lead. The best lines survived verbatim ("Sounds Like *You*?", the struck searches, "Three Things Lee Does *Herself*."). No fake proof on screen. |
| Services (`services.html`) | 5 | **6** | Headlines are much better ("Her Work, and the People She *Trusts*.", "Ask Once. It's *Handled*."). Still held back by the outsourcing scene (8 placeholder tokens, 4 at d2 size), the bare "What You Get" list, the duplicated service/city form, and the map overlapping the close. |
| Our Story (`story.html`) | 3 | **5.5** | A real arc now exists: the "I Started Cargado…" statement, "One Place. Not *Five*.", values as beliefs, and "Tell Me What You Need. I'll Find Someone *Good*." But the narrative is only 2 sentences long. The biggest supporting text on the page is still "[One or two sentences about the founder's background…]", set in display type. |
| Partners (`partners.html`) | 7 | **7** | Cleaner hero and merged notices. "Pay on Clients, Not on *Clicks*." still lands. The tier prices "[No fee]" and "[$ per month]" are the loudest type in their scene. "[founding offer]" in the hero contradicts the plain 0% offer two scenes later. |
| Legal (`legal.html`) | 6.5 | **7.5** | "The Fine Print, in *Plain English*." The full draft band is always visible, the paged Q&A is calm, and the close is warm. One em dash remains. |

## Evidence

- **Shots:** `plan/round5/shots-r5/review-1/<page>/<vp>/NN-<id>.png` (169 PNGs; 1440x900 and 390x844 read for every page). Mid-cut frames and `index.md`.
- **Compliance:** `compliance-diff.txt` shows 0 missing, 0 altered, all brackets present (index 8/8, services 10/10, story 6/6, partners 21/21, legal 10/10). Four spec-speak lines were retired, as §10 allows.
- **Console:** `console-check.txt` is clean, with 0 errors in 30 runs.
- **Fit:** `fit-film`, `fit-flow` and `fit-touch` are all OK. Every scene fits at 9 viewports.
- **Live check (mine):** I served `dist/` on :8447 with `node serve.mjs dist 8447`, fetched the 5 pages, then stopped the server (port confirmed closed). I counted visible text after removing scripts, styles and comments:

| page | `.ph` tokens in HTML | words (incl. hidden dialogs and steppers) | "Nothing is sent…" | "may receive a commission" | "Get My Introduction" |
|---|---|---|---|---|---|
| index | 17 | 660 | 1 | 1 | 4 |
| services | 19 | 742 | 2 | 2 | 3 |
| story | 17 | 374 | 1 | 2 | 2 |
| partners | 33 | 1184 | 4 (3 in hidden or success states) | 1 | 1 |
| legal | 19 | 1257 | 1 | 2 | 2 |

**Repetition, then and now:**
- "Nothing is sent until you tap send" went from 12× across the site to 9× in the HTML. Only about 1 per page is visible at a time; the rest sit in hidden stepper and success states.
- The commission notice went from 7× to 8× in the HTML. At most 1 is visible per scene, except Story `#values` (see F6).
- "One Message. The Right Person. Close to You." now appears only on Home `#close`.
- The Now / 24h / Day 3 strip now appears only on Home H2.

**Placeholders:** 105 `.ph` tokens remain in the HTML (was 112). Most of them are now hidden C19 slots or quiet dotted underlines. Hero stats, the rating and testimonials do not render. This is the single biggest win.

## What was fixed (against `judge-content.md`)

| Old | Status |
|---|---|
| B1 Story has no story | **Partly fixed.** There is a founder-voice draft with facts in brackets, and the meta note moved to an HTML comment and review mode. The T1 portrait quote is still an instruction placeholder (F1). |
| B2 Loud placeholder chips, "[n]" stats as first proof | **Fixed** for the hero, testimonials and founding count (C19 slots), and `.ph` is now a quiet dotted underline. **Still open** where placeholders are the headline-scale content (F1, F2, F4). |
| B3 Repetition and clog | **Fixed** on Home (12 → 6 scenes) and the slogan. **New** form duplication on Services (F3). |
| B4 Spec-speak | **Fixed.** One residue remains: "This is our founder's own business…" (F8). |
| B5 Empty video scene | **Fixed** (deleted). |
| B6 Boxed compliance callouts | **Fixed.** Each notice is now one `.fineprint` line at the bottom of its scene. |
| B7 Founder never named | **Fixed.** "Lee" appears in the hero lead, the door eyebrow and headline, the S2–S5 eyebrows, and Story T1 and T5. |
| B8 Overloaded scenes | **Fixed.** Every scene stays within budget (fit-audit). |
| B9 Generic headlines | **Fixed.** Every R6 proposal shipped. |
| B10 Values as disclosures | **Mostly fixed.** The value is now the headline and the disclosure is the body, but the commission still appears twice on the screen (F6). |
| B11 CTA sprawl | **Fixed.** The verbs are Get My Introduction, Ask About …, Apply to Join, and Message Lee on Story. |
| B13 Casing and dashes | "ok?" became "OK?". **One em dash remains** in the legal Q&A (F9). |
| B15 Two slogans | **Fixed.** The tagline appears in the footer only. |

## Findings, ranked by severity

### F1 · high · Story `#top`: an instruction placeholder is the largest supporting text on the brand's emotional page
`story/1440x900/01-top.png` and `story/390x844/01-top.png`: "[One or two sentences about the founder's background and what led her here.]" is set at `--fs-quote` or larger over the outline C·W, on 3 lines, and the strokes cross the words. On the phone it is the first thing in view, above the statement.

The problem is not the placeholder itself. It is an **instruction** ("One or two sentences about…"), not a draft with bracketed facts, so it breaks the T1 rule ("Brackets wrap only the facts she must confirm") and C33 ("a one-line pull quote… a finished look, not a fallback"). The name also appears twice in one frame ("Lee Holgado" in the portrait and "Lee Holgado, founder" under the statement), and "[Signature]" sits under a name that is already a signature.

**Fix (`site/story.html`, line 131):** put this quote behind `data-when="REVIEW_NOTES"` (as `logo__faith` already is), or replace it with a one-line drafted pull quote in her voice with bracketed facts. That second option needs a §7.3 wording sign-off, because the bracket text changes; log it in `shared-requests.md` for the orchestrator. In the portrait, drop the duplicated name line or the `[Signature]` caption.

### F2 · high · Services `#ours-outsourcing`: 4 bracketed role names at d2 size plus 4 instruction lines; the scene reads as a template
`services/1440x900/05-ours-outsourcing.png`: the four panels show "[Bookkeeping]", "[Inbox and Calendar]", "[Social Media]" and "[Customer Follow-Up]" as large Times titles, each over "[what this role takes off your plate]". With "From [$x]/hr" above, that is 9 bracket tokens. This is the one gold "metal" scene on the page, so the eye goes straight to it.

**Fix (`site/services.html`):** show the role names in plain styling (the brackets stay in the `.ph` source for review mode), or keep the brackets but drop the 4 identical instruction lines from view outside review mode (`data-when="REVIEW_NOTES"`). Long term, propose drafted one-line jobs per role to the owner, for example "[Books reconciled every month]". Either path changes what bracket text shows, so log it in `shared-requests.md`.

### F3 · high · Services asks for "service + city" twice in a row
S6 `#finder` (`06-finder.png`) is a "What do you need? / Your city → Get My Introduction" form. The next scene, S7 `#inquiry` (`07-inquiry.png`), opens with "Step 1 of 3 · What do you need? / City or area". A 30–45-year-old scanning the page sees the same question twice and wonders which one counts. This is the one place the film still feels "clogged".

**Fix (`site/services.html` and `site/assets/js/services-inquiry.js`):**
1. Hand S6's values into S7 (prefill, and start S7 at step 2 when both are set).
2. Make S6's button read as a jump to the next step, not a second send. Keeping "Get My Introduction" is fine, as long as it advances to `#inquiry` prefilled instead of opening C22.

If the spec owner wants both forms, at least retitle S7 step 1 "Anything to Add?" when it arrives prefilled. This needs a §7.2 note in DIRECTION.

### F4 · medium · Partners: tier prices and the hero founding hook are placeholders at display size, and the hero contradicts P4
- `partners/1440x900/03-tiers.png`: "[No fee]", "[$ per month]" and "[$ per month]" are the biggest type in each panel, and Growth and Premier have 2 bracketed bullets each.
- `01-hero.png`: "First 2 partners per service, per city: [founding offer]." sits in Times italic. P4 then states the offer plainly: "They get 0% commission on the first client." The hero is hiding something the page already says.

**Fix (`site/partners.html`):**
- The hero hook bracket is an owner fact. Raise it in `shared-requests.md` and DIRECTION §14 with the proposal "[founding offer]" → "0% commission on your first client". Numbers are allowed unbracketed per the 2026-10-18 owner update, but the bracket can only go with owner or DIRECTION sign-off.
- For the tiers, set the price `.ph` at body size under the tier name rather than at d2, so the tier name carries the panel.

### F5 · medium · Services `#ours-includes` lost the best conversion copy on the site
`services/1440x900/04-ours-includes.png` now lists 5 bare titles ("Money Map Session (90 Min)", "Operations Walkthrough"…). The round-5 judge singled out the pain each one fixes ("Fixes: 'I'm the bottleneck for everything'") as the reason this offer persuades. Without those lines, the right two-thirds of every row is empty hairline.

**Fix (`site/services.html`):** restore today's verbatim "Fixes: …" line as the right-hand row meta on wide and laptop layouts (about 6 words × 5 rows = 30 words, still inside the 60-word budget), and hide it on phones under `.short-hide`. This is existing copy, so nothing is invented.

### F6 · medium · Story `#values`: the commission is said twice on one screen, and value 03's body does not match its title
`story/1440x900/04-values.png`:
- Row 02's body ("We say how we are paid. Cargado Strategies may receive a commission when an introduction becomes a client…") sits directly above the fine print ("…Cargado Strategies may receive a commission when a referral becomes a client."). Money is mentioned twice on the page meant to be about belief.
- Row 03, "Grow Slowly, with Care", has the body "The Cargado team reviews and approves every partner before they are listed." That is a vetting claim, not slow growth.

**Fix (`site/story.html`):**
- Row 02 must stay (it is the §7.3 verbatim body). Trim the T4 fine print to the independence sentence only, if §10 allows; otherwise accept the repeat and note it as an owner question.
- Give row 03 a body that matches its title, for example "[n] partners per service, per city, and each one is checked before they're listed." This is a new line and needs DIRECTION wording, so log it in `shared-requests.md`.

### F7 · medium · Leftover art over the close statement (Services, Story)
- `services/1440x900/08-close.png`: the Canada map from `#finder` stays behind "Ask Once. It's *Handled*." The dot field runs through "Handled", and the arc and node sit on the "Questions? Read the Fine Print" link.
- `services/390x844/08-close.png`: the medallion covers the "A Profession…" map label and truncates it.
- `story/1440x900/05-close.png`: the dotted C ring from `#logo` runs through "Tell", "Need" and "Someone".

W5 says the globe *shrinks into* the medallion. Here it stays put. This is a copy-legibility problem as well as a motion one.

**Fix:** `site/assets/js/services.js` (close-scene globe anchor: collapse it into the medallion or hide the map) and `site/assets/js/story.js` (finish the ring collapse before the statement sets). The globe API is in `site/assets/js/dotglobe.js`.

### F8 · low · Services S2: "This is our founder's own business…" now that she is named
`services/1440x900/02-ours-insurance.png`, fine print: "This is our founder's own business. It is separate from the network of independent partners." It is marked `data-compliance`, so it is verbatim-protected. But next to "From Lee · Insurance" and the "Lee Holgado" portrait, "our founder" reads as legal-team voice. It is the last trace of B4.

**Fix (`site/services.html`, line 167):** owner or §10 wording request in `shared-requests.md` to change it to "This is Lee's own business, separate from the network of independent partners." Until then, leave it as is.

### F9 · low · Legal Q&A still uses an em dash in protected copy
`site/legal.html`, line 370: "Her strategy service is strategy and coaching only — not licensed accounting, tax or investment advice." The fixed-constraint wording is "strategy and coaching only, not licensed…" with a comma, so the comma is both the canonical text and dash-free. (The line 99 dash is inside `.visually-hidden`, as R4 allows.)

**Fix (`site/legal.html`):** change " — " to ", " so the line matches the canonical constraint.

### F10 · low · Small consistency slips
- "[signature]" (`services.html` line 147) vs "[Signature]" (`story.html` line 132): pick one casing.
- Home H5 "Need Someone We Don't Do *Ourselves*?" leads with what Cargado doesn't do. It is fine, but it is the weakest headline left on Home. A contrast line in the house style, such as "Everyone Else, *Near You*?", would fit the rhythm better. This is optional and needs a DIRECTION wording change.
- Home H4, desktop (`index/1440x900/04-founder.png`): door 01 has no fine-print line, so its CTA sits higher than doors 02 and 03 and the bottom rail is uneven. Bottom-align the CTAs (`site/assets/css/home.css`).

## What is now genuinely strong (keep, verbatim)
- Home hero lead: "Send one message to Lee at Cargado Strategies. She handles insurance, business strategy and outsourcing herself, and introduces you to a trusted professional close to you for everything else." It is clear, personal and complete.
- W2 struck searches → "One *Message*." This is the best content moment on the site.
- "Three Things Lee Does *Herself*." with Protect. / Plan. / Delegate. and the visitor's own question on each door.
- "Her Work, and the People She *Trusts*." and "Ask Once. It's *Handled*."
- "What I Will Never Trade for a *Referral*." and "Tell Me What You Need. I'll Find Someone *Good*." with "Message Lee →".
- "The Fine Print, in *Plain English*." The always-visible draft band works.

## Left undone
This was a read-only review. I edited no source files, made no git changes, and did not touch port 8000. F1, F2, F4, F6 and F8 change bracket or compliance wording, so they need orchestrator or owner sign-off through `plan/round5/shared-requests.md` before an owner edits them.
