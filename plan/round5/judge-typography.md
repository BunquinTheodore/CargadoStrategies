# Round 5 judge: Typography

Lens: Times New Roman display (Title Case) + Manrope body + Poppins UI. Covers scale, rhythm, line length, paragraph shape, contrast on the ink / gold / bone fields, readability for 30-45 year olds, eyebrow and label styles, and placeholder styling.

Evidence:
- Screenshots in `plan/round5/shots/` (index 01-06, story 01-07 at 1440x900). That run was still going while I worked, so I took my own captures with `tools/shoot.mjs --no-extras` into the session scratchpad:
  - `typo-shots/index/1440x900/07..12-*.png`
  - `typo-shots2/<page>.html/<page>/{1440x900,390x844}/*.png` for services (1440 only, because the phone run crashed when the server refused a connection), partners, legal, story and index.

  File names below are relative to these folders. `D` = 1440x900 and `M` = 390x844.
- A computed-style scan of every text node on all 5 pages at 1440 and 390, using headless Chrome and CDP (`scratchpad/typo/typescan.mjs`, output in `scan.json`).
- `site/assets/css/base.css` §1/§4/§16, `PLAN.md` (Rounds 1-4), `plan/round4/shared.md` §3, and `plan/round5/research-*.md`.

Round 4 is treated as already decided: the HUD, floating WhatsApp, phone bar, sound and pause toggles and lead dashes are going. I do not score their typography, except where the same styles live on elsewhere.

---

## 1. Scores

| Page | Score | One-line justification |
|---|---|---|
| Home (index) | **6 / 10** | The serif hero is handsome and the heading rhythm is consistent. Everything under the headings is small (12 px tracked eyebrows, 13 px notices) and set in three faces at once. The phone hero is only 38 px, so it does not feel like a hero. |
| Services | **5 / 10** | It is the most crowded page typographically. The strategy scene stacks about 9 type styles and 9 bright placeholder chips on one screen. The categories card and the inquiry form read as a form, not as a story. |
| Story | **6.5 / 10** | It has the best typographic moments: "W Stands for **Wealth.**" in large gold serif and the large Title Case claims. These are let down by 15-word Title Case headings, a 12 px draft note and an unpolished founder quote block. |
| Partners | **5.5 / 10** | The four-line hero is strong. Then come small serif card titles (22 px Times on dark), a wall of 12-13 px compliance text, gold-boxed `[$ per month]` prices, and a form styled with 12 px tracked capital labels. |
| Legal | **6.5 / 10** | It is the cleanest reading layout. It has a good numbered clause list and a large outlined "02" numeral, the best numeral treatment on the site. The phone banner and labels drop to 10-11 px Poppins. |
| **Overall** | **6 / 10** | The system is correct (fluid tokens, balance and pretty wrapping, a 62ch measure, AA colours), but it is timid. There is one display size per scene, no contrast of scale, no italic and no editorial moments. Small grey utility text does most of the talking. It reads as a well-made template, not a "wow" brand. |

---

## 2. What is good (keep)

1. **The serif display voice.** Times New Roman in Title Case at large sizes looks classic and premium on all three fields. It fits the "Rolex / private bank" register the research recommends for 30-45 year olds. See `shots/index/1440x900/01-hero.png`, `shots/story/1440x900/01-top.png` and `typo-shots/index/1440x900/12-close.png` ("One Message. The Right Person. Close to You.").
2. **The gold accent word on the logo scene.** "W Stands for / **Wealth.**" and "C Stands for / **Cargado.**" use a small lead line in ivory with the key word large and in gold. This is the one moment on the site with real typographic contrast and hierarchy. See `shots/story/1440x900/04-logo.png` and `typo-shots2/story.html/story/390x844/04-logo.png`. **Make this the pattern for the whole site** (see I-2).
3. **The outlined giant numeral** on the legal reader ("02" in outline gold above "02 / 05 · PRIVACY" and "Privacy Policy"). See `typo-shots2/legal.html/legal/1440x900/03-privacy.png`. It is editorial and calm, and it is the only place where a numeral is used as display type.
4. **Heading shape tooling.** `text-wrap: balance` on headings and `pretty` on paragraphs (base.css lines 193-194) give no orphans in any heading I looked at, on either viewport. The line breaks in "The Right Professional / Near You, / From One Message." look like they were set by hand.
5. **Measure.** `--measure: 62ch` and `.t-lead { max-width: 56ch }` keep body paragraphs at about 55-70 characters on desktop. See the index compare and story values scenes (`shots/story/1440x900/05-values.png`).
6. **Contrast tokens are AA-safe.** Muted ink `#BDB4A3` on `#0B0B0C` is about 10:1. `#4A4438` on ivory and `#2A2416` on gold also pass, and gold-dark `#7A5C12` is used for gold text on bone. No measured text pair fails AA.
7. **CLS-safe font loading.** The metric-matched Manrope and Poppins fallbacks and the Times system stack (Tinos only on Android) are good engineering. Keep them.
8. **Legal phone reading view** (`typo-shots2/legal.html/legal/390x844/03-privacy.png`). It uses a numbered list with a serif clause title over 15-16 px Manrope at a comfortable line height, and it is the most readable phone screen on the site.
9. **Situations list on phone** (`typo-shots2/index.html/index/390x844/03-situations.png`). The quote, small tag line and arrow per row scan quickly. The structure is right, though the face is not (see B-6).

---

## 3. What is bad

Severity is judged for this audience: 30-45 year olds, often reading on a phone at arm's length, many with early presbyopia and many reading English as a second language.

| # | Defect | Where (screenshot) | Why it hurts | Severity |
|---|---|---|---|---|
| B-1 | **Utility text is too small, and there is a lot of it.** The most common style on every page is Poppins **12 px**, tracked 0.14-0.2 em, in uppercase (eyebrows, form labels, stats captions, tags): 23 on Home, 29 on Partners and 33 on Legal at 1440. Notices, hints and compliance text are Manrope **13 px** in muted colour (12 on Home, 18 on Partners). The legal phone banner is **10-11 px**. | `shots/index/1440x900/01-hero.png` (stats captions, form labels), `typo-shots2/partners.html/partners/1440x900/07-apply.png`, `typo-shots2/legal.html/legal/390x844/*` (banner) | Uppercase plus wide tracking at 12 px is the hardest text to read for people over 40, and this text carries the trust and compliance messages. It also looks like fine print, which signals "small print" on a money-and-trust site. | **critical** |
| B-2 | **A flat scale with no wow moment.** Every scene uses the same recipe: a 12 px eyebrow, a 56-88 px serif H1 or H2, a 16-20 px Manrope paragraph and a button. The hero (`--fs-hero` caps at 7.75 rem) never gets past about 89 px at 1440. Nothing is ever really big, and nothing changes in scale between scenes. | All D shots, e.g. `shots/index/1440x900/04-compare.png` vs `05-how-it-works.png` vs `typo-shots/index/1440x900/10-partners.png` | This is the "looks basic" complaint in typographic form. Awwwards-level and luxury references use one huge claim per screen (100-200 px) and vary the scale from scene to scene. | **high** |
| B-3 | **The phone hero is not a hero.** The H1 on the phone is Times **38 px** with a 17 px lead, a ratio of about 2.2 to 1. The hero, the "Sounds Like You?" H2 and the services H2 look alike (`fs-d1` 38 px against `fs-d2` 30-33 px). | `typo-shots2/index.html/index/390x844/01-hero.png`, `03-situations.png`, `07-services.png`; `story/390x844/01-top.png` | Most traffic is phone traffic from shared chat links. The first screen has no typographic punch, and the form steals the eye. | **high** |
| B-4 | **Three voices at once.** On a single scene, Poppins (eyebrow, labels, chips, buttons, tags, the quotes in situations, offer item titles), Manrope (body, notes) and Times (H1, card titles) are all mixed. Poppins appears at 7 sizes, from 1.6 to 27 px. The services strategy scene has about 9 distinct styles: eyebrow, H1, lead, small label caps, label value, button, note, small text with placeholders, and a notice with a bold lead. | `typo-shots2/services.html/services/1440x900/03-ours-strategy.png`, `shots/index/1440x900/06-founder.png` | This is the typographic root of "clogged". The eye cannot find the hierarchy, and the research notes say Poppins should be limited to labels and buttons. | **high** |
| B-5 | **Placeholders shout.** `.ph` is a tinted box with an inset gold underline at full text size. On the strategy scene there are 9 of them (`[value]` ×5, `[company name]`, `[5]`, `[Founder]`, `[4]`, `[2]`, `[month]`, `[we keep working…]`). On partners tiers, `[$ per month]` is the price, and on the hero stats `[n]` ×3 and `[rating]` are shown at 27 px. | `typo-shots2/services.html/services/1440x900/03-ours-strategy.png`, `typo-shots2/partners.html/partners/1440x900/04-tiers.png`, `shots/index/1440x900/01-hero.png`, `shots/story/1440x900/03-founder.png` (`[Signature]` set in large type) | Placeholders must stay (CR rule), but at this weight they become the loudest element on the screen. Every preview the client sees looks broken and unfinished, and the gold boxes compete with the CTAs. | **high** |
| B-6 | **The visitor's voice is set in the UI face.** The situation quotes ("We're buying our first home") are Poppins 24-27 px medium. The founder's quote blocks ("[Real client quote…]") are Manrope in a placeholder box. The serif italic is defined (base.css line 195 `em, .display-em`) but used nowhere. | `shots/index/1440x900/03-situations.png`, `shots/index/1440x900/06-founder.png`, `shots/story/1440x900/03-founder.png` | Human voice in a geometric UI sans reads like a button label, not a person. A large serif italic for quotes is the cheapest premium, editorial "wow" available and is already in the system. | **medium** |
| B-7 | **Small serif on dark.** Times is used at 16-24 px for card titles: partners "Pre-Qualified / Someone Asks / Community" at 22 px, the services "What You Get" H3, legal card titles at 19-21 px, "Get an Introduction" at 22 px, and the phone founder card titles. On ink fields at 1x DPR, its hairlines break up and the text looks thin and grey. | `shots/index/1440x900/01-hero.png` ("Get an Introduction"), `typo-shots2/partners.html/partners/1440x900/03-arrangement.png`, `typo-shots2/legal.html/legal/1440x900/01-contents.png` | The research says Times reads well only at about 28 px and above. Smaller sizes look like a fallback font, not a brand choice. | **medium** |
| B-8 | **Title Case on long sentences.** "People Should Not Have to Search in Five Places to Find Help They Can Trust." (15 words, 3 lines), "Behind the Website Is a Network of Independent Partners.", "Meet People in Your City Who Already Need Your Service." (4 lines at 88 px), and "Be Found by People Near You Who Need Your Service." | `shots/story/1440x900/02-beginning.png`, `06-network.png`, `typo-shots2/partners.html/partners/1440x900/01-hero.png`, `typo-shots/index/1440x900/10-partners.png` | Title Case past about 8 words turns into noise, because every capital is a speed bump, especially for readers of English as a second language. The brand rule stays, so the fix is shorter headings, not sentence case. | **medium** |
| B-9 | **Uppercase tracked tags inside lists.** The situation tags ("MORTGAGE · REAL ESTATE · LAWYER"), the category tags ("PARTNER NETWORK" ×6, "FROM OUR FOUNDER") and the "30 MIN · INSURANCE · LICENCE" meta all use the eyebrow style. A screen ends up with 7-10 tracked uppercase strings. | `typo-shots/index/1440x900/07-services.png`, `shots/index/1440x900/03-situations.png`, `typo-shots2/services.html/services/1440x900/02-ours-insurance.png` | When everything is "label voice", the eyebrow loses its job. It also repeats "PARTNER NETWORK" six times, which is clutter. | **medium** |
| B-10 | **Leads that are too light or too grey.** The close-scene leads ("Tell us what you need and your city…", "Tell us what you need and your city. We ask…") are Manrope 20 px at a low visual weight in muted ivory over the star field. The FAQ answers on bone use the muted colour at 16 px. | `typo-shots/index/1440x900/12-close.png`, `shots/story/1440x900/07-talk.png`, `typo-shots/index/1440x900/11-faq.png` | Light text on dark looks thinner (irradiation). With stars and grain behind it, it shimmers. Older eyes lose it first. | **medium** |
| B-11 | **Word gaps in split headings.** The per-character split and kerning (`textfx.js` and `kerning.js`) leave visibly wide word spaces in some headings, e.g. "W  for Wealth." and "C  for Cargado." on home, and "Find a  Partner" during the reveal. | `typo-shots/index/1440x900/09-story.png` | At display size, an uneven word space is the first thing a typographically literate viewer notices, and it undercuts "premium". | **low** |
| B-12 | **Form labels shout and hints whisper.** Form labels are 12 px uppercase tracked (`BUSINESS NAME`, `LEGAL ENTITY NAME`…). Hints are 13 px muted. The input text is 16-17 px. | `typo-shots2/partners.html/partners/1440x900/07-apply.png`, `typo-shots2/services.html/services/1440x900/07-inquiry.png` | Uppercase labels are slower to read and harder to match with their inputs. This audience fills forms slowly and carefully. | **low** |
| B-13 | **Footer and credits text at 12 px muted**, including the independence and commission notice and the © line. | `typo-shots2/partners.html/partners/1440x900/08-close.png`, `shots/story/1440x900/07-talk.png` | This is compliance copy. Round 4 already sets it at 15-16 px (`--fs-note`), but the current site does not. | **low** (already planned) |

---

## 4. What needs improvement (ranked by impact)

**I-1. Set a floor and cut the small styles to two (fixes B-1, B-12, B-13).**
- Implement Round 4's `--fs-note: 1rem` (15 px on phones, 16 px from 760 px) for **all** notices, hints, consent, footer notices and placeholders inside notes.
- Eyebrows: 12 px with 0.2 em tracking becomes **14 px with 0.12 em tracking**, Poppins 500. On phones use 13 px, never less. The legal draft banner goes to at least 13 px.
- Form labels: change from uppercase tracked to **sentence case, Poppins 500, 15 px, no tracking**.
- Tags inside lists (situations, categories, the offer meta): change from uppercase tracked to **sentence case Manrope 15 px in muted colour**, e.g. "Mortgage, real estate, lawyer".
- Leave exactly **one** uppercase tracked string per scene: the eyebrow.
- Result: two small styles site-wide, `note` (Manrope 15/16) and `label` (Poppins 14/15), instead of the current about 8 variants from 10 to 13 px.

**I-2. A dramatic display scale with a "small line / huge word" pattern (fixes B-2, B-3; this is the wow).**
- Raise the ceiling. `--fs-hero` becomes `clamp(3rem, calc(1rem + 9 * var(--u)), 11rem)`. One scene in three gets a **mega** claim: 2-4 words at 9-12 vw on desktop and 15-17 vw (about 60-66 px) on phones. Examples: "**One Message.**", "**Close to You.**", "**Integrity.**", "**Pay on Clients.**"
- Build it the way the logo scene works:
  - a short serif lead line at `fs-d3` in ivory or black ("W Stands for", "The right professional near you,");
  - then the key phrase at mega size, with **one word in gold** (`--accent`, gold-dark on bone);
  - optionally that word in **italic** (`.display-em`, already defined).
- Phone hero: the H1 goes from 38 px to **about 56-64 px**, set as 2-3 lines of 1-2 words. The intro form moves one swipe down (Round 4 already splits scenes) so the first screen is the claim plus one CTA.
- Alternate scenes between "mega claim, nearly empty screen" and "working scene (list or form) with an `fs-d2` heading". The change of scale between scenes is the rhythm that makes scrolling feel cinematic.

**I-3. Quiet placeholders by default, loud ones on demand (fixes B-5; compliance-safe).**
- Default `.ph`: **no fill**, text in the current colour, `text-decoration: underline dotted 1px` in `--ph-line` at 60 % opacity, `text-underline-offset: 0.2em`. The brackets stay in the text, so nothing is hidden or dropped.
- For the founder's review only, `html.ph-loud` (toggled by `?review=1`) brings back today's tinted box.
- Stats `[n]` and `[rating]`: either hide the stats strip until real numbers exist (it is decoration, not compliance), or set them at body size with a "Coming soon" label instead of 27 px gold boxes.
- `[Signature]`: render it as a hairline signature line with a small `[signature]` caption, not as a 34 px boxed word.
- Prices `[$ per month]`: use Times at `fs-d3` with a dotted underline, so the tier card's typography survives when real prices arrive.

**I-4. Give each face one job and remove Poppins from content (fixes B-4, B-6).**
- **Times**: every heading and number at 28 px and above, every pull quote and every price or big numeral.
- **Manrope**: all reading text, list items and item titles, e.g. "Money Map Session (90 Min)" moves from Poppins to Manrope 600 at 18 px.
- **Poppins**: only the eyebrow, buttons, nav, chips and form labels.
- Situation quotes and client quotes become **Times italic, `fs-d3`/`fs-d2`, curly quotes hung into the margin** (`hanging-punctuation: first` with a negative text-indent fallback). The visitor's own words become the most beautiful text on the page.
- Founder scene: set the founder line as a large italic pull quote (about 40 px desktop, 26 px phone), with name and role below in Poppins 14 px. This is the research's "Screen 5" recommendation.

**I-5. Raise every small serif or switch it to sans (fixes B-7).**
- Rule: **Times only at 26 px and above** (28 px or more on ink fields). Card titles currently at 19-24 px either go up to `fs-d3` (28-34 px) where there is room (tier names, the arrangement steps "Someone Asks / We Introduce / You Pay on Success", legal contents titles) or change to Manrope 600 at 18-20 px (form section titles "Your Business", the finder's "Nearest Partners", the intro-card title "Get an Introduction").
- On ink fields, keep display text at `#F3ECDD` with full opacity. Never dim serif text.

**I-6. Shorten headings to 8 words or fewer and let the scale carry them (fixes B-8; keeps Title Case).**
Suggested rewrites. Copy owners should confirm them, and no compliance meaning changes.
- Story "People Should Not Have to Search in Five Places to Find Help They Can Trust." becomes the eyebrow line "Where it began" plus the mega line "**One Place. Not Five.**"
- Partners hero "Meet People in Your City Who Already Need Your Service." becomes "**Clients Near You, Already Asking.**"
- Story network "Behind the Website Is a Network of Independent Partners." becomes "**A Network of Independent Partners.**"
- Home partners "Be Found by People Near You Who Need Your Service." becomes "**Be Found Close to Home.**"
- Services strategy "The 30-Day Cash-Flow Clean-Up" is good. Keep it, and give it the mega treatment with "30-Day" as the gold word.

**I-7. Strengthen the leads and body on dark (fixes B-10).**
- `--fs-body` goes to 17 px on phones and 18 px from 1024 px. `--fs-lead` goes to `clamp(1.125rem, …, 1.375rem)`. On ink fields, use Manrope **500** (not 400) for lead and body, because light text on black needs the extra weight.
- Muted ivory stays at 4.5:1 or above. Do not use it for leads, only for notes. FAQ answers on bone change from muted to `--fg`.
- Put a soft radial "scrim" (an ink gradient at 40-60 % behind the text column) under any paragraph that sits on the star field, so the text does not shimmer.

**I-8. Big numerals as a system (builds on Good #3).**
- Step numbers in the situations list, the founder list, the arrangement steps, the services categories, the values and the how-it-works markers (`01`-`09`) change from Poppins 12-13 px gold to **Times, outlined or gold, 48-72 px** on desktop and 32-40 px on phones, set to the left of the item as in legal's "02".
- Remove the duplicate tiny numeral, so each row has one numeral and one title.

**I-9. Fix the word spacing in split headings (fixes B-11).**
- In `kerning.js`/`textfx.js`, keep each word as a `white-space: nowrap` inline-block that contains its letters, and keep the **real space character** between word spans at the parent's font size. Do not let a span-wrapped space pick up the letter margin. Check "W for Wealth.", "Find a Partner", "Near You" and "You Pay" at 1440 and 390.

**I-10. One label voice for meta (fixes B-9).**
- Replace "PARTNER NETWORK" ×6 on the categories grid with a single legend ("● Founder's own  ○ Partner network") and a small gold dot per tile.
- "30 MIN · INSURANCE · LICENCE [licence #]" becomes sentence-case Manrope 15 px.

**I-11. A small token change set, ready for the build.**

```css
:root{
  --fs-mega: clamp(3.5rem, calc(1rem + 10 * var(--u)), 12rem); /* one claim per few scenes */
  --fs-hero: clamp(3rem,  calc(1rem + 8 * var(--u)), 9.5rem);
  --fs-quote: clamp(1.625rem, calc(1rem + 2.2 * var(--u)), 3rem); /* Times italic */
  --fs-num:  clamp(2rem, calc(1rem + 3.5 * var(--u)), 4.5rem);    /* Times numerals */
  --fs-body: clamp(1.0625rem, 1rem + .2vw, 1.125rem);              /* 17 -> 18 px */
  --fs-note: 1rem;   /* 15 px under 760 */
  --fs-label: .875rem; /* 14 px eyebrow / button / form label floor */
}
.eyebrow{font-size:var(--fs-label);letter-spacing:.12em}
.field-label{font:500 .9375rem/1.3 var(--font-ui);text-transform:none;letter-spacing:0}
.ph{background:none;box-shadow:none;text-decoration:underline dotted 1px color-mix(in srgb,var(--ph-line) 60%,transparent);text-underline-offset:.2em}
html.ph-loud .ph{background:var(--ph-bg);box-shadow:inset 0 -1px 0 var(--ph-line)}
.quote{font:italic 400 var(--fs-quote)/1.15 var(--font-display);hanging-punctuation:first}
.num-xl{font:400 var(--fs-num)/1 var(--font-display);color:transparent;-webkit-text-stroke:1px var(--accent)}
[data-field="ink"] .t-lead,[data-field="ink"] p{font-weight:500}
```

These fit the Round 4 `--u` fit unit. The mega and hero sizes are bounded by `min(vw, svh)`, so they still fit one screen at 1366x768 and 1280x720.

---

## Top 8 issues (for the orchestrator)

1. **B-1, critical.** Small uppercase tracked utility text everywhere: 12 px Poppins eyebrows, labels and tags, 13 px muted notices and compliance text, and 10-11 px on the legal phone banner. Fix with I-1: `--fs-note` 15/16 px, eyebrow 14 px at 0.12 em, sentence-case labels and tags.
2. **B-2, high.** A flat, timid scale with one recipe per scene and the hero capped at about 89 px, which reads as "basic". Fix with I-2: a `--fs-mega` claim scene every few scenes, using the "small lead line plus huge gold or italic word" pattern from the logo scene.
3. **B-3, high.** The phone hero H1 is 38 px and looks like any H2. Fix by moving to a 56-64 px, 2-3 line claim and pushing the form one scene down.
4. **B-5, high.** Placeholders are the loudest element on the screen (9 on the strategy scene, `[n]` stats at 27 px, `[$ per month]` prices, `[Signature]`). Fix with I-3: dotted underline by default and `?review=1` for the loud view. The brackets stay.
5. **B-4, high.** Three faces and about 9 styles per scene, with Poppins in content. Fix with I-4: Times for headings, numbers and quotes, Manrope for reading text, Poppins only for eyebrows, buttons and labels.
6. **B-6, medium.** Quotes (the situations list, client and founder quotes) are set in Poppins or Manrope, and the italic serif is never used. Fix with I-4: Times italic pull quotes with hanging punctuation, the cheapest editorial wow available.
7. **B-7, medium.** Times at 16-24 px on dark (card titles, "Get an Introduction", legal contents) looks thin and broken. Fix with I-5: Times at 26-28 px or more only, otherwise Manrope 600.
8. **B-8, medium.** Title Case headings of 10-15 words (story "beginning", partners hero, network, home partners). Fix with I-6: headings of 8 words or fewer and the mega scale.
