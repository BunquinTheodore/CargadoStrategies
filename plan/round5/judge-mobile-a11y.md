# Round 5 judge: mobile and accessibility

Lens: the 390x844 experience, tap targets, text sizes, measured contrast, keyboard and screen reader basics, focus states, reduced motion, and the scroll-jacking risk for a 30-45 audience.
Judge: senior jury member and conversion UX lead. Date: 2026-10-17. Site state: Round 3 built, Round 4 not built yet. The Round 4 removals (HUD, floating WhatsApp, phone bar, sound and pause toggles, decorative dashes) are treated as decided.

## How this was measured

- **Screenshots.** The official run (`plan/round5/shots`) had only `index/1440x900` 01-06, `story/1440x900` 01-07 and the splash when this was written, and no 390x844 shots at all. So I shot every scene of every page myself with `tools/shoot.mjs`, using the same script and settings:
  - 390x844: `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\a11y\shots\<page>\390x844\NN-<scene>.png` (42 scenes, all with the film running).
  - 1440x900: the same folder with `\1440x900\`. Index and services did not get the film running in that run (see B7), so for index 1440 I used the official shots.
  - Below, file names are written as `<page>/<vp>/<file>` relative to whichever of those two folders holds the file.
- **Measured audit.** I wrote my own CDP script (based on `tools/shoot.mjs` and `fit-audit.mjs`, with its own headless Chrome on a random port, read-only): `...\scratchpad\a11y\audit.mjs`, raw results in `...\scratchpad\a11y\report.json`. For every scene of every page at 390x844 and 1440x900, it:
  - activates the scene and walks every visible text node;
  - takes the computed font size and the WCAG contrast ratio of the text colour, alpha-blended over the real background chain (falling back to the field `--bg`);
  - measures the bounding box of every interactive element;
  - lists interactive elements that are clipped outside the viewport at the scene's focus point;
  - presses Tab 22 times from the top and records the focused element, whether it is in view and its computed outline;
  - reloads with `prefers-reduced-motion: reduce` and measures the height of each section.

## 1. Scores (this lens)

| Page | Score | One-line justification |
|---|---|---|
| index.html | **5 / 10** | Contrast and focus are excellent. But on a phone it is 12 scenes (10,167 px, 12 screens of swiping), the hero's own submit button sits below the fold, and the founder and close scenes are clipped. |
| services.html | **4 / 10** | The worst on phone. 13.2 screens of scroll. In the inquiry scene the form fields, consent box and submit sit below the fold (8 controls clipped), and categories and strategy are clipped too. Text is 11 px in places, the map has 12x5 px targets, and the globe line art runs through body copy. |
| story.html | **6 / 10** | The calmest and most legible page, and most scenes fit. Values and talk are clipped, and on a phone the founder frame shows the globe inside an empty "[Founder photo]" box. |
| partners.html | **4 / 10** | The application form is 3,457 px tall on a phone (4.1 screens) inside a scroll-jacked film. Tiers and arrangement CTAs are off-screen, and keyboard focus lands on a link that is not in view. |
| legal.html | **5 / 10** | The contents list is a good phone pattern. But the clause cards are clipped inside a fixed frame, legal copy is 12-13 px, the FAQ scene has 314 words, and inline links are 22 px tall. |
| **Overall** | **5 / 10** | The engineering basics are better than most award sites (0 contrast failures, real focus rings, an inert menu, a reduced-motion flow mode). But the phone experience is a desktop film squeezed into 390 px. It is clogged, clipped and long, and for this audience the scrolljack and the 12 px labels are the two things that will lose visitors. |

## 2. What is good (keep)

1. **Contrast is genuinely AA everywhere I could measure.** All 84 scene measurements (42 scenes at 2 viewports) had **0 contrast failures** in the computed scan. Ivory on ink, `#4A4438` on bone, `#2A2416` on gold and gold-dark `#7A5C12` on bone all pass. The palette tokens in `base.css` (fields ink, gold and bone) are correct, and this is the base the wow factor can be built on. Examples: `index/390x844/03-situations.png` and `index/390x844/04-compare.png`.
2. **Focus is visible and follows the film.** Every tab stop had a solid 2 px outline whose colour switches per field: gold on ink, black on gold, `#7A5C12` on bone. Tabbing into a hidden scene activates that scene, and 21 of 22 stops per page were in view and in the active scene. Keep `:focus-visible` and the `focusin → goTo` behaviour.
3. **Screen reader basics are clean.**
   - Every page has one `h1`, a skip link, `main`, `nav`, `header` and `footer` landmarks, and `lang="en-CA"`.
   - There are **0 unnamed buttons or links and 0 unlabelled inputs** across all pages.
   - The letter-roll and decode effects keep an `aria-hidden` visual copy plus a visually hidden readable copy (`textfx.js`), so names are not spelled letter by letter.
   - The `Ask →` links on the index founder scene carry hidden context ("about the family protection review").
4. **The phone menu is done right.** `chrome.js` sets `aria-expanded`, makes everything behind the menu `inert`, closes on Escape and returns focus to the toggle.
5. **Reduced motion has a real meaning.** With `prefers-reduced-motion: reduce` you get the `html.rm` flow mode: normal stacked sections, no Lenis, no star motion, and a static splash. Zoom is not disabled (`viewport` has no `maximum-scale` or `user-scalable`). The safe-area inset is respected.
6. **Most phone controls are big.**
   - Chips are 44 px, inputs 48 px and the primary buttons 48-56 px (`index/390x844/01-hero.png`).
   - Only about 8 distinct under-44 px targets exist at 390 wide.
   - The header on a phone is just the logo and a large "Menu" button. That is the right amount.
7. **Some phone layouts already work and should be the model.**
   - The numbered situations list (`index/390x844/03-situations.png`).
   - The legal contents list with clause counts (`legal/390x844/01-contents.png`).
   - The "how it works" timeline with gold dots (`index/390x844/05-how-it-works.png`).
   - The C·W logo scene (`story/390x844/04-logo.png`): one idea per screen, large type, generous air. That is exactly what the user means by "not clogged".
8. **Trust and privacy notes sit next to the input that needs them.** Examples: "We ask for your city only so we can introduce you…" and "We use your city or area only to sort partners by distance. It isn't stored on this website." (`services/390x844/05-finder.png`). Keep these.

## 3. What is bad

| # | Defect | Where (screenshot) | Why it hurts the 30-45 audience / the wow factor | Severity |
|---|---|---|---|---|
| B1 | **Content and controls are clipped below the fold inside the fixed stage.** At the scene's focus point, interactive elements sit outside the viewport. Measured: index founder (2 Ask links) and close (8 footer links); services categories (5 CTAs), inquiry (6 fields + consent + submit) and close (9); story talk (8); partners arrangement (1), tiers (2), apply (13 fields) and close (8); legal close (10). In a keyboard pass, partners "See the Membership Tiers →" got focus while **not in view**. | `index/390x844/06-founder.png` ("The Family Protection Review" cut under the bar); `services/390x844/03-ours-strategy.png` (copy cut mid-line); `services/390x844/06-categories.png`; `services/390x844/07-inquiry.png`; `story/390x844/05-values.png`; `partners/390x844/03-arrangement.png`; `legal/390x844/03-privacy.png`; 1440: `partners/1440x900/07-apply.png`, `legal/1440x900/03-privacy.png` | On a phone, half-cut content reads as "broken" and "clogged", which is the user's exact complaint. People in their 40s who see a cut-off card do not keep swiping in hope; they leave. A hidden submit button costs leads directly. | **Critical** |
| B2 | **The scrolljack is too long on a phone.** Scroll height: index 10,167 px (12 screens, 12 scenes), services 11,166 px (13.2), partners 11,020 px (13.1), story 6,752 px, legal 6,608 px. One transition is `MOTION_PX = 640` (`film-map.js`). Tall scenes add pan on top. Round 4 plans a JS glide (`film-snap.js`) on all devices, including touch. | All 390x844 shots; `film-map.js:16`; PLAN Round 4 "Scroll behaviour" | NN/g (in `research-audience.md` §4): scrolljacking is worse on mobile, long scrolljacks look broken, and goal-driven users are the least patient. Reaching the FAQ on the home page takes 11 or more deliberate swipes. JS glides on iOS also fight the OS momentum and feel "sticky", which is the opposite of premium. | **Critical** |
| B3 | **On a phone, the hero's primary action is below the fold.** The "Get My Introduction on WhatsApp" submit in the hero form is off-screen. The city hint is half hidden under the bottom bar, and the only visible CTA is the phone bar, which Round 4 removes. | `index/390x844/01-hero.png` | Once the bar goes, the first screen has no action at all. The one conversion the site exists for is not visible on the device most visitors use. | **High** |
| B4 | **Text is too small for 40+ eyes.** Every scene has between 1 and 23 visible text nodes under 14 px. The floor is **11 px**: services jump-rail groups "OURS / FIND / PARTNERS / ASK", strategy `dt` "OFFERED THROUGH" and "SERVICE", and categories. All eyebrows, form labels (`.label`, `legend.label`: 12 px, uppercase, tracked 0.14-0.2em), tile owners, situation tags and process "NOW / WITHIN" are 12 px. Compliance notices, hints and `.offer__fine` are 13 px. Body copy on a phone is 16 px. | `services/390x844/01-intro.png` (rail), `services/390x844/03-ours-strategy.png`, `index/390x844/07-services.png` (tile labels), `index/390x844/06-founder.png` (13 px compliance fine print), `partners/390x844/07-apply.png` (12 px caps labels) | Presbyopia starts around 40. Spaced uppercase at 12 px is the hardest text to read, and here it carries the labels people need: form field names, "FOUNDER + PARTNERS", "WITHIN [24h]". It also makes the site look "basic template". Research rules 1 and 4 call for a 14 px floor and body text of at least 17 px on phones. | **High** |
| B5 | **Long forms sit in one scrolljacked scene.** In flow mode the partner application is 3,457 px at 390 (four screens) and 2,216 px at 1440. The services inquiry is 1,555 px. In film mode, both are panned through by scrolling while the person is typing. | `partners/390x844/07-apply.png`, `services/390x844/07-inquiry.png`, `partners/1440x900/07-apply.png` | Filling in a form while the page moves under your thumb is the worst scrolljack case NN/g found (changing scroll while people read or act). Long single-page forms on phones lose people at about field 5. | **High** |
| B6 | **Sound effects with no off switch (Round 4).** SFX default to on (`sfx.js`: "default: on"). There is a tick every 100 px of scroll, a whoosh per scene and a hover tick. Round 4 removes the speaker toggle, so nothing could mute them except the device volume. | header in `index/1440x900/01-hero.png` (toggle that is about to be removed); `sfx.js` | A screen reader user hears ticks over the speech. Someone browsing at work or on a train gets clicks on every swipe. For a finance and insurance brand, unexpected sound reads as gimmick, not premium. It is the opposite of trust. | **High** |
| B7 | **The film fails to start under load and flips layout mid-visit.** In 3 of my headless runs (index 390x844, plus index and services at 1440 in the second run), the film was not ready within the 8 s `FALLBACK_MS`. The page switched to `rm film-fallback` flow mode. The services finder then showed an empty service select and "Loading the map of Canada…". The machine was busy with other runs, so this is a load-sensitivity finding, not a lab-clean one. | `services/1440x900/05-finder.png` (my scratch run); inline script in `index.html` head | On a mid-range Android phone on LTE (CDN GSAP + Lenis + three + fonts), some visitors will get a different site after 8 s, sometimes mid-gesture. A layout that changes under the thumb destroys confidence. | **Medium** |
| B8 | **Decorative layers run through reading text.** The globe wireframe is drawn behind the outsourcing roles list and the services intro copy on a phone. Star dots show through paragraph text. The grain overlay (`z-index:4`) sits above the text layer (`.scenes` `z-index:3`). | `services/390x844/04-ours-outsourcing.png` (wireframe over "[what this role takes off your plate]"), `services/390x844/01-intro.png` (globe behind the nav grid), `services/390x844/03-ours-strategy.png` (dots inside "hours a week back") | Line art behind body copy adds visual noise exactly where the user says it is "clogged". It also makes Manrope look grainy on cheaper OLEDs. | **Medium** |
| B9 | **Some targets are small.** Finder map regions are 12x5 px (PEI), 28x25 px (New Brunswick) and 29x36 px (Nova Scotia) at 390 (the search box is an alternative). Inline links are 19-23 px tall: "tell us what you need and your city" (index video), "Partner Code of Conduct" (partners ask, 196x23), legal FAQ links (22 px). At 1440 the footer links are 30 px tall (28x30 "Q&A"), the header WhatsApp is 127x40, and the "Ask →" links are tiny. | `index/390x844/02-video.png`, `services/390x844/05-finder.png`, `index/1440x900/06-founder.png` | They miss the 44 px house rule (research rule 17). Older users mis-tap; on desktop, small "Ask →" links next to large headlines look like an afterthought. | **Medium** |
| B10 | **The splash plays on every page load** (0.9-2.2 s, `splash.js` MIN_MS and MAX_MS). Visiting 4 pages costs up to about 9 s of splash. | `splash/1440x900/splash.png` | The first time it is a brand moment; the fourth time it is a wait. Older visitors read repeated delays as "slow website". | **Medium** |
| B11 | **Reduced-motion and zoom escape hatches are incomplete for Round 4.** In flow mode on a phone, sections are 900-3,457 px tall: index hero 1,241, services strategy 1,638, categories 1,637, partners apply 3,457. Round 4 plans `scroll-snap-type: y mandatory` there. Mandatory snap on sections taller than the screen skips content at 200% text size. I found no rule that 200% zoom or a width of 360 px or less forces flow mode. | RM measurements in `report.json` | Larger browser text and zoom are common past 40. A one-screen film that does not fall back to flow at 200% zoom breaks WCAG 1.4.4 and 1.4.10. | **Medium** |
| B12 | **Times New Roman is used small on dark backgrounds**, where its hairlines break up. Examples: "Get an Introduction" (22 px), the legal contents titles (about 18-20 px), the clause titles in the legal cards, and tier titles in the 20s of px. | `index/390x844/01-hero.png`, `legal/390x844/01-contents.png`, `legal/390x844/03-privacy.png` | It looks "default font" rather than "editorial serif". It is the main reason the type reads basic instead of luxurious. | **Medium** |
| B13 | **The story founder frame shows the globe inside an empty photo box.** On a phone, "[Founder photo]" is a framed square with the 3D globe floating in it. | `story/390x844/03-founder.png` | It looks like a broken image or a loading state, on the one scene meant to build personal trust. | **Low** |
| B14 | **No live regions outside services** (index, story, partners and legal: 0 `aria-live`). When Round 4 steppers and validation land, step changes and errors will be silent to screen readers unless they are added. | `report.json` global.liveRegions | Errors that are not announced lead screen reader users to abandon the form. | **Low** (becomes **High** once steppers ship) |
| B15 | **Duplicate CTAs and copy density on a phone.** Index close and services close repeat the same headline, "One Message. The Right Person. Close to You.", on top of a footer that spills off-screen. The scenes carry 57-156 words (legal FAQ 314). | `index/390x844/12-close.png`, `services/390x844/08-close.png` | "Clogged" is partly word count: a phone screen comfortably holds about 40-60 words with a CTA. | **Low** |

## 4. What needs improvement (ranked by impact)

1. **Give phones their own film: native snap, fewer, fuller screens.**
   - On `(pointer: coarse)`, do not use the JS glide. Use native `scroll-snap-type: y mandatory` on sections that fit and `proximity` on any that cannot, with `scroll-snap-stop: always`, so iOS and Android momentum feel native.
   - Drive the field colour change and the reveals with CSS scroll-driven animations (`animation-timeline: view()`), keeping GSAP for desktop.
   - Cap each page at **6-7 screens on phone**. Index goes from 12 to 7 by merging video into hero, compare into how-it-works, and story, partners and FAQ teasers into one "More" screen.
   - Add a labelled **"Next" chevron button** and a column of tappable, labelled **section dots** on the right edge, replacing the HUD. The visitor always knows where they are and that the page continues.
   - Wow comes from each screen being a single bold composition, not from motion fighting the thumb. Fixes B1 and B2.
2. **Redesign the phone hero as the hero moment.**
   - Headline, the three ticks, and one 56 px gold button, "Get My Introduction", inside the first 844 px, with no form on the first screen.
   - The button opens a **full-screen bottom sheet** (a `<dialog>`) in 2 steps: big need chips (56 px), then city. The final step is "Open WhatsApp", with the "Nothing is sent until you tap send" note.
   - The sheet rising over a dimmed, star-lit field is the premium moment (think Apple Card or Revolut onboarding). Fixes B3, and the hero then fits by construction.
3. **Set a type scale for 40+ eyes.**
   - Floor of **14 px** for anything readable, 15 px for compliance notices, **17 px body on phones and 18 px on desktop**.
   - Form labels become 14-15 px Poppins 500 in sentence case (not tracked caps).
   - Eyebrows stay as the only tracked caps, at 13 px with 0.12em tracking.
   - Times New Roman only at 28 px and above; card titles below that switch to Poppins 600.
   - Make the display type bolder in scale: hero 56-64 px on phones, set tight, with one gold word per headline. That is the cheapest wow on a phone. Fixes B4 and B12.
4. **Turn every long form into a stepper inside one screen.**
   - Partner application: 4 steps (Business · Service and licence · Area and references · Review and send).
   - Inquiry: 3 steps.
   - Each step at most 4 fields at 390x844, with 56 px inputs, `autocomplete`, `inputmode` (tel, email, postal), a progress bar, and Back/Next pinned at the bottom of the scene.
   - Announce each step change in a polite `aria-live` region and move focus to the step heading. Validate per step, with errors announced. Fixes B5 and B14.
5. **Keep a way to silence sound.**
   - Default SFX to **off**, and to off always on touch devices.
   - Offer "Sound: Off / On" as one row in the phone menu and the footer. That is not the header toggle Round 4 removes, so the decision stands.
   - Never tick on scroll on touch. Keep the click and success sounds subtle.
   - If the user insists on on-by-default, at least never play scroll ticks while a form field has focus or `prefers-reduced-motion` is set. Fixes B6.
6. **Protect the reading layer.**
   - Move the grain under the text (`.grain` `z-index` below `.scenes`).
   - Add a `--text-safe` mask: stars fade to 0 and the globe opacity drops to 0.15 behind text columns on phones.
   - On a phone, park the globe as a **top-band hero visual** (a pose above the headline) instead of behind paragraphs.
   - Clean text plus one dramatic object reads as more expensive than a busy field. Fixes B8 and B13. On story founder, hide the globe and show a monogram placeholder until the photo arrives.
7. **Make it fast, and feel fast.**
   - Show the splash **once per session** (`sessionStorage`), at no more than 1.2 s.
   - For page-to-page moves, use the **View Transitions API** with a 300-400 ms field-colour iris (with a fallback of none). That is a wow moment that also hides latency.
   - Raise the film fallback window, or better, render flow mode first and promote to film only once ready and only on desktop, so no one sees a layout switch mid-visit.
   - Self-host GSAP and Lenis in the esbuild bundle (already planned) to remove the CDN race. Fixes B7 and B10.
8. **Fit by re-layout, never by shrinking, and keep the escape hatches.**
   - Round 4's fluid `min(vw, vh)` scale must not push phone text under the floor in item 3. When content does not fit at 390x844, split the scene or page it (carousel with buttons, tabs), never shrink.
   - Force flow mode at a width of 360 px or less, a height under 560 px, or browser zoom of 200% or more (`devicePixelRatio`/`visualViewport` check, or a `rem`-to-`px` ratio probe).
   - Use `proximity` snap, not `mandatory`, in flow mode. Fixes B1 and B11.
9. **Raise every target to 44 px.**
   - Inline links inside notices and FAQ answers become `display:inline-block; padding-block:10px`, or turn into a trailing "Read more →" row.
   - Desktop footer links get `min-height:44px`.
   - The "Ask →" links become real secondary buttons ("Ask About This →").
   - On phones, the finder map becomes decorative (`aria-hidden`), and the province picker becomes a 2-column grid of 48 px province buttons or the search box only. Fixes B9.
10. **Cut copy per screen to about 50 words on phones.**
    - One headline, one sentence, one CTA, and one compliance line where it is legally needed. Compliance stays, as a calm 15 px statement card, never as 12 px fine print.
    - The close scene drops the repeated headline on non-home pages and becomes a compact one-screen footer with 48 px link rows.
    - Legal FAQ: show 3 questions and "More questions →". Fixes B15 and supports B1.

## Top 8 issues (for the synthesis)

1. **B1 (critical)**: content and controls are clipped inside the fixed stage on phones. The inquiry submit, 13 partner-form fields and the footer links are unreachable at the focus point, and focus can land off-screen.
2. **B2 (critical)**: the phone scrolljack is 12-13 screens on index, services and partners. Use native scroll-snap on touch and cap at 6-7 screens.
3. **B3 (high)**: the hero's primary action is below the fold on a phone, and only the soon-removed phone bar shows a CTA. Redesign as headline + one CTA + bottom-sheet flow.
4. **B4 (high)**: text floor is 11-12 px (tracked-caps labels and eyebrows), compliance copy is 13 px and body is 16 px. Set a 14 px floor, 17-18 px body, and sentence-case labels.
5. **B5 (high)**: the partner application is 3,457 px and the inquiry 1,555 px in one scrolljacked scene. Use steppers of 4 or fewer fields per screen.
6. **B6 (high)**: SFX are on by default and Round 4 removes the only mute. Default off (always on touch) and add a mute row in the menu and footer.
7. **B7 (medium)**: under load the film misses the 8 s fallback and the page switches to flow mode mid-visit. Render flow first, promote to film only on desktop, and bundle the libraries.
8. **B8 (medium)**: the globe line art, stars and the grain overlay sit over reading text on phones. Mask decoration behind text and park the globe as a hero visual.
