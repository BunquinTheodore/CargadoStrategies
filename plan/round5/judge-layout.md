# Round 5 judge: layout and clutter

Lens: how each scene is composed. That covers the grid, whitespace, density, hierarchy and alignment, the number of ideas per screen, the balance of text against visuals, whether scene templates are consistent across pages, and the mobile layout.
Juror stance: an Awwwards jury member combined with a conversion-focused UX lead, judging for a 30–45 audience that arrives with a job to do (see `research-audience.md`).

## Evidence

- `plan/round5/shots/` (the shared run) contains index 01–06 at 1440x900, all 7 story scenes at 1440x900, and the splash. That run stopped after the splash and produced nothing more.
- I shot the rest myself with `tools/shoot.mjs` (same activation, read-only) into my scratch folder:
  `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\judge-layout\shots\` (index, services and legal at 1440x900 and 390x844; partners at both sizes) and `...\judge-layout\shots2\story\390x844\`.
  Below, `S:` stands for that `...\judge-layout\shots` folder.
- **Partners caveat:** on partners.html the film never came up after 4 loads, and a second run hit "target navigated" errors. The page was probably being edited at the time. The partners shots therefore show flow mode: no header chrome and a band of the neighbouring section at the top. I judged composition only, not chrome.
- I did not shoot 1366x768 myself (the second run crashed). My notes on short laptops are inferred from 1440x900, where scenes already reach the bottom edge.
- Round 4 is treated as decided: one screen per section, one gesture per section, and removal of the HUD, the floating WhatsApp button, the phone bar, the sound and pause toggles and the decorative dashes. I still count these elements as clutter, because they are on screen today. The recommendations assume they go.

---

## 1. Scores (layout and clutter lens)

| page | score | one-line justification |
|---|---|---|
| Home (index.html) | **5 / 10** | Clean left-headline/right-block grid and strong serif headlines. But it has 12 scenes, the hero carries about 20 elements, "one message" is said four times, and the close overflows at 1440x900. |
| Services (services.html) | **4 / 10** | The densest page. Strategy, categories and inquiry each hold a page of content, and categories and inquiry are clipped at 1440x900. Boxes inside boxes, with three to four compliance blocks per screen. |
| Our Story (story.html) | **6.5 / 10** | The best page. The logo scene (04) is the only true composition on the site. It loses points for the stacked type sizes and off-grid card in "beginning", the empty founder frame, and the repeated left/right template. |
| Become a Partner (partners.html) | **4.5 / 10** | The hero headline runs four lines with half the screen empty. Three boxed tiers are stacked, and two scenes (how, ask) leave the left half blank. The application is a multi-panel document, not a screen. |
| Legal (legal.html) | **5.5 / 10** | The contents index and the "giant numeral plus document card" reader are tidy and fit the content. The draft banner, header and chrome crowd the top 120 px, and long text is clipped. |
| **Overall** | **5 / 10** | It is competent, accessible and on-brand, but every scene is the same eyebrow + headline + stuff template, packed to the edges, with one wireframe globe as the only visual. It reads as "basic" because nothing changes scale or rhythm, and "clogged" because every screen tries to say everything. |

---

## 2. What is good (keep)

1. **Serif display headlines with real presence.** Times New Roman in Title Case at 80–110 px on black or bone reads as expensive and calm. Examples: index 01 "The Right Professional Near You, From One Message." (`shots/index/1440x900/01-hero.png`), story 01 (`shots/story/1440x900/01-top.png`), and the close (`S:/index/1440x900/12-close.png`). Keep the face. Use it bigger and less often.
2. **The story logo scene is the north star.** Story 04 (`shots/story/1440x900/04-logo.png`, mobile `shots2/story/390x844/04-logo.png`) has one centred object, two counter-weighted statements ("W Stands for Wealth." top-left, "C Stands for Cargado." bottom-right), a diagonal tension and lots of black. It is the only scene that looks designed rather than laid out, and it survives on mobile. Every page needs one moment like it.
3. **Field rhythm.** The ink → bone → gold alternation (index 01→02→03→04) gives a cinematic change of light without photography. Keep it, but give each field change a different composition (see §4.3).
4. **Divided lists instead of card grids** where they are used well: index 03 situations (`shots/index/1440x900/03-situations.png`), index 07 services 3x3 (`S:/index/1440x900/07-services.png`), story 05 values (`shots/story/1440x900/05-values.png`), and the legal contents index (`S:/legal/390x844/01-contents.png`). Hairlines, numerals, an arrow and generous rows make for good scanning.
5. **Index 05 "How It Works" timeline** (`shots/index/1440x900/05-how-it-works.png`): three dots on one rule, with Now / Within [24h] / Day [3]. It is the clearest three-idea composition on the site and reads instantly for this audience.
6. **Index 08 dot-matrix map of Canada** (`S:/index/1440x900/08-find.png`): a genuine visual with a signal ring on Winnipeg. It is the second-best visual moment and should be promoted.
7. **Legal reader pattern**: the giant outlined numeral "02", the title, and the document card on the left (`S:/legal/1440x900/03-privacy.png`). This is good wayfinding for long text.
8. **Grid discipline on desktop**: a consistent 56 px side gutter, a shared left text edge at x=56, and the right column starting at about x=615 on every 7/5 scene. Alignment is tidy. The problem is sameness, not misalignment.
9. **Splash** (`shots/splash/1440x900/splash.png`): the monogram, the wordmark and a hairline progress line. It is restrained and on-brand.

---

## 3. What is bad

Severity: critical = blocks the user's goal or breaks the one-screen promise; high = a main cause of "basic/clogged"; medium = it noticeably hurts polish; low = a nit.

| # | defect | where (screenshot) | why it hurts the 30–45 audience or the wow | sev |
|---|---|---|---|---|
| B1 | **Chrome frames every screen with 5 competing layers**: a header with 8 controls (logo, 4 nav items, Facebook, WhatsApp button, sound, pause), the HUD "01 / 12 — INTRODUCTION · 00:00", 4 corner brackets, a floating WhatsApp pill, and a progress bar. Two WhatsApp buttons are visible at once. | every desktop shot, e.g. `shots/index/1440x900/01-hero.png`, `S:/services/1440x900/03-ours-strategy.png` | About 15 permanent UI marks before any content appears. The eye has no quiet frame, and the timecode means nothing to a buyer. This is the single largest source of "clogged". (Removal is decided in R4 and not yet built.) | critical |
| B2 | **Scenes over capacity, clipped at 1440x900.** The categories detail panel is cut mid-notice. The inquiry "Send My Inquiry" button is half-faded and the note below it is lost. The home close footer is cut ("Connected by Purpose…" clipped, legal links cut). | `S:/services/1440x900/06-categories.png`, `S:/services/1440x900/07-inquiry.png`, `S:/index/1440x900/12-close.png`, `S:/services/1440x900/08-close.png` | Compliance copy and the primary action sit under a fade. On a 1366x768 laptop, common in this age group's offices, this gets worse. | critical |
| B3 | **The home hero holds about 20 elements**: eyebrow, 3-line H1, a 3-line lead with a placeholder, 3 ticks, a form card (title, 2 step labels, 6 chips, input, hint, CTA, note) and a 4-stat proof strip of `[n]` boxes. There are two competing focal points, the headline and the form, plus a third, the gold-boxed stats. | `shots/index/1440x900/01-hero.png`; mobile `S:/index/390x844/01-hero.png` (form cut by the bottom bar, CTA not visible) | First screen, first impression. A 40-year-old on a phone sees a form before they understand the offer, and the CTA is below the fold on the one screen that must fit. | critical |
| B4 | **Mobile = desktop content stacked into one 844 px screen.** Text runs to the bottom edge and is cut under the bar on index 01, 06, services 03, 06, 07, story 05 and legal 03. The globe is pushed off-screen or reduced to a corner smudge on most scenes, so mobile is all text. | `S:/index/390x844/06-founder.png`, `S:/services/390x844/03-ours-strategy.png`, `S:/services/390x844/07-inquiry.png`, `shots2/story/390x844/05-values.png`, `S:/legal/390x844/03-privacy.png` | Most visits come from a shared link on a phone. Mobile is where they will meet the brand, and it is a scrolling document with no visual and no wow. | critical |
| B5 | **One template everywhere.** About 30 of the site's 42 scenes are "small tracked eyebrow, 2–3 line serif headline at top-left, list/box/card in the right 5 columns". Examples: index 02, 03, 04, 06, 07, 10, 11; services 02, 03, 05, 06, 07; story 02, 05, 06; partners 02, 04, 06. | compare `shots/index/1440x900/03-situations.png`, `04-compare.png`, `S:/index/1440x900/11-faq.png` | Without a change of scale, alignment or density, scenes blur together, and no scene is memorable. That sameness is exactly why the site feels "basic". | high |
| B6 | **The home page repeats itself across 12 scenes.** "One message" appears in hero, compare, how-it-works and close. "Find a partner" appears in hero, find and close. Services appear in situations, the services grid and founder. The close uses the same copy as the services close. | index 01, 04, 05, 12; `S:/services/1440x900/08-close.png` | Twelve gestures to reach the end. With R4's one-gesture-per-scene rule, repetition costs real effort and makes the site feel long. | high |
| B7 | **The globe is used as filler, not as the hero.** It is parked half-cropped in corners (index 03, 07 and 11 bottom-left), under the hero form (index 01), inside a "[Founder photo]" frame (story 03) and peeking at the bottom edge (index 04, 05). It is the only visual on 5 pages, and it appears at roughly the same size and pose most of the time. | `shots/index/1440x900/03-situations.png`, `S:/index/1440x900/07-services.png`, `S:/index/1440x900/11-faq.png`, `shots/story/1440x900/03-founder.png` | A recurring object that does not move with intent reads as a screensaver. There is no human face anywhere, and trust for this audience comes from a person. | high |
| B8 | **Boxes inside boxes and "card stack" offset borders.** Many panels have a second offset border behind them (story 02, services 02, 05, 06, 07, partners 04, 05, legal 03), on top of gold left-rule notice blocks and dashed placeholder boxes. Services 03 has 6 framed or ruled regions on one screen. | `shots/story/1440x900/02-beginning.png`, `S:/services/1440x900/02-ours-insurance.png`, `S:/services/1440x900/03-ours-strategy.png`, `S:/partners/1440x900/04-tiers.png` | Each frame is another edge to parse. It looks like a 2015 template, the opposite of premium. Premium finance (Coutts, Pictet, Aesop) uses hairlines and space. | high |
| B9 | **Placeholders are the loudest elements on several screens.** Gold-boxed `[n]` stats, `[Signature]` at display size, `[value]` chips in a column, `[Role 1]…[Role 4]` rows and `[2]` boxed inside the H1. | `shots/index/1440x900/01-hero.png` (proof strip), `shots/story/1440x900/03-founder.png`, `S:/services/1440x900/04-ours-outsourcing.png`, `S:/partners/1440x900/05-founding.png` | Reviewers (the founder, the client) judge the design through these boxes. A highlighted bracket pulls the eye harder than the headline. | medium |
| B10 | **Half-empty, unbalanced screens.** Partners "how" and "ask" leave the left 40% totally empty. Partners founding and hero leave the right half empty. The FAQ has a 250 px empty band at the top and the globe as a corner sticker. | `S:/partners/1440x900/02-how.png`, `06-ask.png`, `05-founding.png`, `S:/index/1440x900/11-faq.png` | This empty space is not intentional. It reads as "something failed to load", not as luxury. | medium |
| B11 | **Flat hierarchy across scales.** Six text sizes sit within a few lines (e.g. story 02: eyebrow → 20 px lead → 80 px H2 → rule → eyebrow → 22 px card text). H2s on content scenes are nearly hero-sized, so nothing feels like the climax. Compliance notes at 12–13 px grey on gold have weak contrast (index 10 membership note, services 07 notice). | `shots/story/1440x900/02-beginning.png`, `S:/index/1440x900/10-partners.png`, `S:/services/1440x900/07-inquiry.png` | Readers in their 40s struggle with small grey-on-gold text. The page lacks a big–small rhythm that signals "this is the important bit". | medium |
| B12 | **Long forms shown as a full form.** The services inquiry (7 fields, chips, consent, notice and CTA) and the partner application (multiple framed sections, plus a side panel with 4 steps and 2 notices) are shown in full. | `S:/services/1440x900/07-inquiry.png`, `S:/partners/1440x900/07-apply.png` | A wall of empty inputs is the most intimidating screen a 30–45 visitor can meet. They cannot fit one screen. (Steppers are planned in R4.) | medium |
| B13 | **Legal top stack**: header, then a dashed DRAFT banner, then the eyebrow. The banner sits 12 px under the header with its own dashed frame. | `S:/legal/1440x900/03-privacy.png`, `S:/legal/390x844/01-contents.png` | Three horizontal bands before content start. It looks unfinished. | low |
| B14 | **Small alignment nits**: the index 06 sub-copy floats mid-right with no anchor to either column; the index 05 CTA "Send Your Message on WhatsApp →" floats far right on the headline's baseline; the story 02 card is indented to an arbitrary x=280. | `shots/index/1440x900/06-founder.png`, `05-how-it-works.png`, `shots/story/1440x900/02-beginning.png` | Each nit is small, but together they weaken the grid that is otherwise the site's strength. | low |

---

## 4. What needs improvement (ranked by impact)

### 4.1 Clear the frame (do Round 4's removals first, then go further) [impact: highest]
- Build the R4 removals: HUD, corners, timecode, floating WhatsApp, phone bar, sound and pause toggles.
- The header becomes logo · 4 nav items · **one** gold "WhatsApp Us" button. Move Facebook to the footer.
- On mobile: logo · one small gold WhatsApp icon-button · Menu. This answers R4 open question C2 (phones otherwise have no persistent contact).
- Target: no more than 6 chrome marks on any screen (today there are about 15).

### 4.2 A hard content budget per scene, enforced by tooling [impact: highest]
Each scene gets:
- 1 eyebrow (optional);
- 1 headline of 8 words or fewer;
- body copy of 35 words or fewer;
- 1 visual;
- 1 primary CTA plus at most 1 text link;
- 1 compliance footnote line (14 px minimum, may link to a disclosure dialog for the full text). No compliance text is deleted: the long versions move into a "Disclosure" dialog or the legal page, and the scene keeps the required short sentence. Shortening is allowed only where the meaning is unchanged, as R4 already allows.

Add a word-count and element-count check to `fit-audit.mjs`, failing above 60 visible words or above 12 interactive or framed elements per scene. "Clogged" then becomes a test, not an opinion.

### 4.3 Four scene templates, rotated so no two neighbours match [impact: high, cures "basic"]
Borrow the Portfolio's lesson (`C:\Portfolio`: one idea per shot, display type at poster scale) and the jury research (one huge claim per screen):

| template | composition | use for |
|---|---|---|
| **A · Statement** | One headline at 9–12vw (140–180 px desktop, 56–64 px phone), centred or bottom-left, with nothing else except a single link. Full field colour. | the openers of each page, the transitions between chapters, the close |
| **B · Object split 50/50** | The globe, map, monogram or portrait fills one half and bleeds off the edge. Text sits in the other half, bottom-anchored. | hero, find, story founder, partners hero |
| **C · Index rows** | Full-width numbered rows (60–80 px row height, serif 40 px titles, arrow at the far right). The headline sits above as a small label. | situations, services, values, legal contents, tiers |
| **D · Three panels** | Three tall columns side by side with hairline separators, each with a numeral, a title, one line and one link. Phone: a swipeable row with dots. | how it works, founder's three offers, partner "how it works" |

Rule: alternate templates **and** fields. A scene-template map per page goes in the next plan.

### 4.4 Cut the home page from 12 scenes to 7 [impact: high]
1. **Hero (B, ink):** the H1 and one line, [Get My Introduction] and "How it works ↓". The globe fills the right half. The proof strip shrinks to one quiet line ("[n] partners · [n] cities · replies in [24h]"). **The intro form leaves the hero** and becomes a 3-step sheet/dialog opened by the CTA (need → city → open WhatsApp), keeping the "we ask for your city because…" and "nothing is sent until you tap send" lines.
2. **How it works (D, bone):** merge "compare" into it. Panel 1 "You send one message" with the strike-through list as a hover/second line, then panels 2 and 3 as today.
3. **Sounds like you (C, gold):** the 4 situations as big rows plus a fifth row, "See all 9 services →".
4. **From our founder (D, ink):** the three offers as three tall panels, each with a title, one line, the required label line and "Ask →". The quotes go to a later testimonial scene once real.
5. **Find near you (B, ink → map):** the dot map takes over the screen. This is where the globe dollies into Canada (the signature move, §4.6).
6. **Two doors (split 50/50, bone | gold):** "Our Story: W for Wealth" on the left and "For Professionals" on the right, each with one CTA. This replaces two scenes.
7. **Close (A, ink):** "One Message. The Right Person. Close to You." at poster scale, the CTA, and a compact 1-line footer. The FAQ moves to legal Q&A plus a "Questions?" link, or becomes a dialog.

The video scene (02) returns only when the real video exists. Until then it is an empty dark rectangle plus "coming soon", which reads as unfinished.

### 4.5 Give the site a second visual: the founder [impact: high]
- One duotone (black and gold) founder portrait. Use it at full height in story 03, small in home scene 4, and in the services offers.
- Until a photo exists, use the large C·W monogram (as in story 04), **not** the globe inside a photo frame.
- Trust for this audience comes from a face (see `research-premium-finance.md`, Bessemer/Policygenius).

### 4.6 Make the globe direct the film, never decorate it [impact: high, the wow]
- Every scene declares a deliberate camera: huge and bleeding (hero), dolly in until Canada fills the screen and morphs to the dot map (find), shrink into the C of the monogram (story logo, already half there), pull back to a constellation (partners/close).
- Ban the "parked in the corner at 30% opacity" pose (index 03, 07, 11). If a scene has no role for it, hide it.
- On phone, it sits in the top 40% of the hero and the find scenes and is hidden elsewhere.

### 4.7 Strip the boxes [impact: medium-high]
- Remove all offset "card stack" second borders and drop shadows on bone.
- Panels become hairline gold rules plus space.
- Allow at most one framed element per screen (the form or the document card, nothing else).
- Notices: keep the gold left rule, but only one per screen.
- Placeholders: in the staging build, style brackets as a dotted underline in the text colour rather than filled gold boxes. Keep a `?ph=loud` toggle for the founder's review pass.

### 4.8 Sharpen the type scale to a big–small rhythm [impact: medium]
- Use four steps only:
  - Statement: 9–12vw;
  - Headline: 56–72 px desktop / 36–40 px phone;
  - Body: 18 px desktop / 17 px phone, Manrope 400;
  - Label: Poppins 13–14 px.
- Card titles use Times only at 28 px or above, otherwise Poppins 600.
- Content-scene H2s step **down** from today so the statement scenes feel like climaxes.
- Compliance and helper text: 14 px minimum. On gold, use the black text colour at full strength, never 70% grey.

### 4.9 Split or page anything that cannot fit [impact: medium; R4 already plans most of it]
- Services strategy becomes "The Offer" (B) plus "What You Get" (C rows, with `[value]` pricing moved to a single total line).
- Categories becomes the C index (9 rows), with detail opening as an in-scene panel or dialog.
- The inquiry and the partner application become 3–4 step steppers, one question group per screen.
- Partner tiers become a D three-panel layout (a swipe row on phone).
- The legal reader gets its R4 pager (the text never scrolls inside a box).

### 4.10 Design mobile as its own composition, not a stacked desktop [impact: high for reach, ranked here because it depends on 4.2–4.9]
Rules per phone scene:
- the headline in the top third;
- a visual or white field in the middle;
- the CTA in the thumb zone;
- 25 words of body at most.

No scene's content may reach the bottom 80 px. Today index 01 hides its CTA, and services 03, 06, 07 and story 05 lose copy under the bar.

### 4.11 Fix the empty halves and the nits [impact: low-medium]
- Partners "how" and "ask": put the globe/constellation or the founding-spots counter in the empty left half, or switch to template D.
- Partners "founding": template A, with "The First [2] Partners per Service, per City." at poster scale and the cap note as one line.
- Index 06: anchor the sub-copy under the headline.
- Index 05: put the CTA under the timeline, left-aligned.
- Story 02: the card aligns to the 7-column grid line (x=56 or the column 5 start), not x=280.
- Legal: merge the DRAFT banner into the header bar as a small gold pill, with no dashed frame.

### 4.12 One signature moment per page (the "won't forget" factor) [impact: high per cost; detail for the motion judge]

| page | signature moment |
|---|---|
| Home | the globe dives into Canada and becomes the dot map |
| Story | the monogram assembles (exists; make it the page's climax) |
| Services | the three founder offers as three tall gold panels that open like doors |
| Partners | the map lights a city's founding spots ("2 of 2 open") |
| Legal | none (calm on purpose) |

Use one signature moment per page and nothing else animated while text is being read.

---

## Top 8 issues (summary)

1. **B1 · critical:** five chrome layers (header with 8 controls, HUD/timecode, corners, floating WhatsApp, progress bar) frame every screen. They are the biggest cause of "clogged".
2. **B2 · critical:** scenes overflow at 1440x900 (services categories and inquiry, home and services close footers), clipping CTAs and compliance copy.
3. **B3 · critical:** the home hero holds about 20 elements and three focal points. On phone, the CTA is hidden below the bar.
4. **B4 · critical:** mobile is desktop stacked into 844 px. Copy is cut on 7+ scenes, and the globe and all visuals vanish.
5. **B5 · high:** one eyebrow + headline + right-block template on about 30 of 42 scenes, so nothing is memorable ("basic").
6. **B6 · high:** home has 12 scenes with "one message", "find a partner" and the services list repeated 3–4 times. It should be 7.
7. **B7 · high:** the globe is the only visual and is used as corner filler. There is no human face anywhere.
8. **B8 · high:** boxes inside boxes with offset "card stack" borders, multiple notice blocks and loud placeholder chips make screens busy and dated.
