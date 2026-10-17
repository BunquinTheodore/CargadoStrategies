# Round 5 judge: content and copy

Lens: clarity, tone (warm, faith-based founder, professional), length per scene, repetition across pages, Title Case, how placeholders read, where the compliance notices sit, and the story page narrative.
Audience: Canadians aged 30 to 45. They are busy, they scan, they distrust hype and they want a person they can trust.

## Evidence used
- Official shots in `plan/round5/shots`. When this was written the run had only produced `index/1440x900/01–06`, `story/1440x900/01–07` and `splash`.
- I made the missing shots myself with `tools/shoot.mjs --vp=1440x900,390x844 --no-extras`. They are in the scratchpad: `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\judge-content\shots\<page>\<vp>\NN-<id>.png`, with contact sheets `…\judge-content\sheet_<page>_<vp>_N.png`. File names below use the same `<page>/<vp>/NN-<id>.png` scheme.
- Capture caveat: the film was not running for `index/390x844` and `legal/1440x900`, so those were shot in flow layout. They are fine for judging copy but not for judging layout.
- The visible copy of every page was extracted from the HTML. I also counted phrases and the `.ph` placeholder tokens.
- Round 4 is treated as decided: the HUD counter, floating WhatsApp, phone bar, sound and pause toggles and the decorative dashes are going. I do not score them here.

---

## 1. Scores (content and copy lens)

| Page | Score | One-line justification |
|---|---|---|
| Home (`index.html`) | **5 / 10** | Several headlines are excellent ("One Message Instead of Five Searches."). But 12 scenes say the same promise 5 times, the second scene is an empty video box, and 26 placeholders sit in the most visible places, starting with the stat strip. |
| Services (`services.html`) | **5 / 10** | The cash-flow offer is persuasive and specific. Internal design notes have leaked into the copy ("The rail does the disclosure"), the strategy scene has about 170 words, and the outsourcing scene is all placeholders (30 tokens on the page). |
| Our Story (`story.html`) | **3 / 10** | There is no story. Every part that carries the narrative is a placeholder: the founder's words, the logo story, the faith sentence, the photo and the name. The values are disclosures dressed up as values. A visitor learns nothing about who she is. |
| Become a Partner (`partners.html`) | **7 / 10** | The strongest writing on the site, with sharp contrasts ("Pay on Clients, Not on Clicks.", "You Win on Being Close, Not on Bidding."). It is held back by stacked disclaimers and a hero with 6 text blocks before the button. |
| Legal (`legal.html`) | **6.5 / 10** | Plain language, well chunked, and the clause counts help ("5 clauses →"). The draft banner still uses the em dash that Round 4 bans, and the Q&A duplicates the home FAQ under the same title. |
| **Overall** | **5 / 10** | The voice is clear and honest, but it reads as cautious and procedural rather than warm. Repetition and boxed notices make it feel "clogged", and the founder (the brand's reason to exist) has no name, face or voice anywhere. |

---

## 2. What is good (keep)

1. **Headlines built on a contrast or a payoff.** These are the site's best asset; keep them verbatim.
   - "One Message Instead of Five Searches." (`index/1440x900/04-compare.png`)
   - "Pay on Clients, Not on Clicks." (`partners/1440x900/03-arrangement.png`)
   - "You Win on Being Close, Not on Bidding." (`partners/1440x900/02-how.png`)
   - "If Something Happens to You, Is Your Family OK?" (`services/1440x900/02-ours-insurance.png`)
   - "W for Wealth. C for Cargado." (`index/1440x900/09-story.png`)
2. **The situations scene** (`index/1440x900/03-situations.png`). Writing in the visitor's own voice ("My business is busy but money is tight", "I'm doing everything myself") is the most empathetic copy on the site and fits 30–45-year-old parents and owners exactly. Promote it (see §4).
3. **The compare strike-through list** (`index/1440x900/04-compare.png`): "Search five websites / Call six offices / Wait for callbacks / Guess who's legit". It is concrete, slightly wry and shows rather than tells.
4. **The 30-Day Cash-Flow Clean-Up offer stack** (`services/1440x900/03-ours-strategy.png`). Each line pairs a deliverable with the pain it fixes ("Fixes: 'I'm the bottleneck for everything'"), and it ends with a risk-reversal promise. This is real conversion copy.
5. **Microcopy that builds trust and should stay:**
   - "We ask for your city only so we can introduce you to someone close to you." This explains why the city is needed, as CR10 requires.
   - "Nothing is sent until you tap send." Keep it once, beside each WhatsApp button.
   - "No fee to you · No obligation · Licence shown where one applies" (`index/1440x900/01-hero.png`).
6. **Plain-language legal** (`legal/390x844/02-disclosure.png`, `03-privacy.png`), for example "Who Sees It: Cargado staff and the partner we connect you with. We do not sell your information." This is exactly how this audience wants privacy explained.
7. **The faith identity is subtle and correct.** "Mark 11:24" appears as a quiet reference under the monogram (`story/1440x900/04-logo.png`) and the verse is not quoted.
8. **Title Case is applied consistently** to headings, buttons and nav. Eyebrows stay as tracked uppercase UI labels. Ending headlines with a full stop gives a calm, declarative tone that suits the brand.
9. **Partners honesty line**: "We don't promise a number of introductions, clients or results." (`partners/1440x900/01-hero.png`). Professionals trust it, and it covers CR04 in the voice of a human rather than a lawyer.

---

## 3. What is bad

| # | Defect | Where (page / scene / shot) | Why it hurts the 30–45 audience or the wow factor | Severity |
|---|---|---|---|---|
| B1 | **The story page has no story.** Every narrative element is a placeholder: "[One or two sentences about the founder's background…]", "[How the logo came about…]", "[Optional… one sentence on faith.]", "[Signature]", "[Founder name]", "[Founder photo]". Above them sits a meta note: "[Draft story. The founder confirms every word before publication.]" | story / founder, logo, values, top. `story/1440x900/03-founder.png`, `04-logo.png`, `05-values.png`, `01-top.png` | This page should carry the emotion and the faith-based warmth. Today a visitor reads 7 screens and never learns who she is or why she started. Nothing on it is memorable. | **critical** |
| B2 | **Placeholders are the loudest thing on screen.** There are 112 `.ph` tokens across the pages (home 26, services 30, partners 27, legal 20, story 9), each in a gold-highlighted box. Worst cases: the hero stat strip of 4 × "[n]" and "★ [rating]", the founder testimonials "[Real client quote about the outcome]", outsourcing "[Role 1–4] [what this role takes off your plate]", and founding "[City] · [service]: [n] of [2] open [live count]". | `index/1440x900/01-hero.png`, `06-founder.png`; `services/1440x900/04-ours-outsourcing.png`; `partners/1440x900/05-founding.png` | Highlighted brackets look like a broken template. The first proof a visitor sees is four "[n]" stats, which actively undermines trust. A client reviewing the site will see "unfinished", not "premium". | **critical** |
| B3 | **The same promise is repeated until it feels clogged.** Counts across pages: "Nothing is sent until you tap send" 12×; "may receive a commission" 7×; "independent businesses" 7×; "close to you" 8×; "One Message. The Right Person. Close to You." closes 3 pages; the Now / Within [24h] / Day [3] steps appear 4× (home how-it-works, services finder, services inquiry, partners apply). On home, the video, situations, compare, how-it-works and close scenes all restate "one message → nearest professional". | all pages; e.g. `index/1440x900/02-video.png`, `05-how-it-works.png`, `12-close.png`; `services/1440x900/05-finder.png`, `07-inquiry.png` | Repetition is what makes a scroll film feel long and samey ("clogged"). Readers this age scan, and when every screen looks familiar they stop. It also wastes scenes that could carry new proof. | **high** |
| B4 | **Internal design and compliance notes leak into public copy.** Examples: "The rail does the disclosure: Ours is run by our founder, Partners are independent businesses." (services / categories); "Her own businesses, named as hers and shown separately from the independent partner network." (home / founder); "Each section says whether it's ours or a partner's." (services / intro); "One minute · captions included when it arrives" (home / video). | `services/1440x900/06-categories.png`, `index/1440x900/06-founder.png`, `services/1440x900/01-intro.png`, `index/1440x900/02-video.png` | This reads like spec language written to a reviewer, not a customer. It sounds defensive and robotic, the opposite of a warm founder. | **high** |
| B5 | **Scene 2 of home is an empty promise:** "What We Do, in One Minute." next to a black box reading "Founder video coming soon". On the phone it is a plain black rectangle. | `index/1440x900/02-video.png`, `index/390x844/02-video.png` | The second impression is "nothing here yet". It spends a full scroll, the most valuable one after the hero, on an absence. | **high** |
| B6 | **Compliance notices dominate the scenes they sit in.** They use a boxed left-rule callout, often with a bold lead, placed right under the main button: home / find, story / network, services / finder, categories and inquiry, partners / arrangement, tiers and apply (two stacked). On the phone the finder notice takes about 30% of the screen (`index/390x844/08-find.png`). In categories it is cut off at the bottom edge (`services/1440x900/06-categories.png`). | as listed | The notices are needed, but styled as callouts they read as warnings next to every call to action. That adds anxiety at the moment of decision and visual clutter. | **high** |
| B7 | **The founder has no name and no face anywhere.** She is "our founder", "she", "her own businesses", "Three Things She Does Herself.", "[Founder] takes [4] new businesses". | `index/1440x900/06-founder.png`, `services/1440x900/03-ours-strategy.png`, `story/*` | The whole differentiator is a trusted person. Without a name the copy sounds corporate. "She" in a headline with no antecedent is confusing for a first-time visitor. | **high** |
| B8 | **Scenes carry too many words for one screen.** Services / strategy has about 170 words: eyebrow, H2, a 40-word lead, offered through, service, two buttons, helper, scarcity line, notice, a 5-row stack with "Fixes" lines, and the promise. The home hero has 11 text blocks (eyebrow, H1, sub, 3 ticks, form title, 2 labels, helper, button, helper, 4 stats). Partners / tiers has a lead, a bold notice and 3 cards × 3 lines. Partners / apply has a form, a 4-step list and 2 notices. | `services/1440x900/03-ours-strategy.png`, `index/1440x900/01-hero.png`, `partners/1440x900/04-tiers.png`, `partners/1440x900/07-apply.png` | One screen should carry one idea. Dense scenes fight the cinematic format and cancel the wow, and older eyes (40+) tire on 14–15 px secondary text. | **medium** |
| B9 | **Weak or generic headlines** where the rest of the site is sharp: "Everything in One Place." (services intro) and "Every Service, One Place." (home services) say the same thing; "Guided by Integrity, Service and Responsible Growth." is boilerplate; "Behind the Website Is a Network of Independent Partners." is clunky; "Ours, and Our Partners'." is an awkward possessive; "Legal" and "Straight Answers." (used twice). | `services/1440x900/01-intro.png`, `index/1440x900/07-services.png`, `story/1440x900/05-values.png`, `story/1440x900/06-network.png`, `services/1440x900/06-categories.png` | Generic lines blur together and are forgotten. Nothing there is quotable. | **medium** |
| B10 | **The values are disclosures in disguise.** "Integrity: We say how we are paid. Cargado Strategies may receive a commission…" | `story/1440x900/05-values.png` | A value should describe a belief or a behaviour. Leading with commission on the emotional page puts money in the reader's mind first. | **medium** |
| B11 | **CTA wording is inconsistent**, with at least 9 phrasings for the same action: "Get My Introduction on WhatsApp", "Get My Introduction", "Message Us on WhatsApp", "Send Your Message on WhatsApp", "Write Your One Message", "Ask About Insurance on WhatsApp", "Ask About Partnering", "Ask Us to Find Someone", plus a bare "Ask →". | home / founder `Ask →` (`index/1440x900/06-founder.png`), across pages | People this age want to know exactly what a button does. A bare "Ask" is vague, and changing labels make the action feel like several different processes. | **medium** |
| B12 | **"One place for several businesses."** The opening line of what-we-do is unclear: is the visitor a business, or a person looking for one? | `index/1440x900/02-video.png` | It confuses the core value proposition in the scene meant to explain it. | **medium** |
| B13 | **Casing and dash slips:** "is my family ok?" (home situations) vs "Is Your Family OK?" (services); the legal banner "Draft — to be reviewed…" and the legal Q&A "strategy and coaching only — not licensed…" keep em dashes that Round 4 removes. | `index/1440x900/03-situations.png`, `legal/390x844/01-contents.png`, legal.html lines 114 and 327 | These are small, but they make the site feel unproofed. | **low** |
| B14 | **"Map preview · cities shown for illustration, not listed partners"** sits in caps under the home map. | `index/1440x900/08-find.png` | It is necessary honesty but reads as a disclaimer on a hero visual. Shorter and sentence case is enough. | **low** |
| B15 | **The splash and footer lean on the tagline "Connected by Purpose. United in Service."** while the page closers use a different slogan ("One Message. The Right Person. Close to You."). | footer in `index/1440x900/12-close.png`, `partners/1440x900/08-close.png` | Two competing slogans: neither sticks. | **low** |

---

## 4. What needs improvement (ranked by impact)

### R1. Write the founder story now, as a real draft (fixes B1, B7, B10). Impact: highest
The Story page is where the wow should land emotionally. Replace instruction placeholders with **a drafted narrative in her voice**, and use brackets only for the facts she must confirm (name, years, places). A placeholder like "[One or two sentences about…]" tells the client nothing. A draft with bracketed facts gives her something to approve.

Proposed 5-beat arc (5 scenes, one idea each):
1. **Top.** "I Started Cargado Because I Was Tired of Watching Good People Search Alone." Sub: "[Founder first name] [last name], founder." Move the draft note into an HTML comment or the README, not the screen.
2. **The moment.** A concrete scene, for example "In [year], a friend in [city] spent three weeks calling offices to find a mortgage broker who would call her back. I knew [n] good professionals who would have answered that same day." Brackets wrap facts only.
3. **The logo.** "W for Wealth. C for Cargado." The C wraps the W, as a hand around what matters: wealth is something to protect and share, not chase. "[Confirm the logo meaning in her words.]" Mark 11:24 stays as the quiet reference.
4. **What I believe** (values as beliefs):
   - "People before transactions."
   - "Say how you are paid." Keep the commission sentence here as the body text, not as the headline.
   - "Grow slowly, with care."
5. **Invitation.** "Tell Me What You Need. I'll Find Someone Good, Close to You."

Name her everywhere it matters. Change "Three Things She Does Herself." to "Three Things [First name] Does Herself." and "[Founder]" to "[First name]". Keep the token while the name is unconfirmed, but structure the headline around it.

### R2. Turn placeholders from loud chips into quiet draft marks, and stop showing fake proof (B2)
- Restyle `.ph` in the build so the brackets survive as required: a dotted underline in the current text colour and no filled highlight box. The client still sees what to fill, but the page stops looking broken.
- **Hero stat strip:** four "[n]"s are anti-proof. Keep the markup and placeholders, but render the strip only when `config.js` has real numbers (a `data-when="stats"` flag). Until then, show one qualitative line: "Licensed professionals across Canada · Introductions in [24 hours]".
- **Testimonials:** do the same. Hide `[Real client quote…]` blocks until quotes exist rather than showing two empty quote marks on the founder scene.
- **Outsourcing roles:** propose concrete draft roles in brackets: "[Bookkeeping]", "[Inbox and calendar]", "[Social media]", "[Customer follow-up]". Example roles read as content, while "[Role 1]" reads as a hole.

### R3. Cut home from 12 scenes to 7, with one new idea per scene (B3, B5, B8)
Proposed order:
1. **Hero.** Lead with the situation chooser: the four "Sounds Like You?" lines become the hero's chips. The one-message form then sits under the chosen situation. Use the video as a small "Watch 1 min" link once it exists. Merge the current scenes 1, 2 and 3.
2. **How it works.** Merge compare and how-it-works: left, the strike-through list "On your own"; right, the three steps (Now / [24h] / Day [3]). This becomes the only place those three steps appear on home.
3. **From [First name] herself.** The three founder services, with one line and one button each.
4. **Find someone near you.** The map moment, with the notice as fine print.
5. **W for Wealth.** Story teaser, with the monogram as the visual climax.
6. **For professionals.**
7. **Questions + close in one screen.** The FAQ accordion on the left and the final call to action on the right. Use one closing slogan.

Then do the same diet on services: merge "intro" into the first founder scene's eyebrow rail, and give the Now/24h/Day 3 strip once, in inquiry only.

### R4. Make compliance notices "fine print", not callouts (B6, B14). Keep every word
- Use one shared `.fineprint` pattern: 13–14 px, muted, no box, no bold lead, sitting at the **bottom edge of the scene** (above the footer line), never directly under the main button.
- Write it as one sentence with a "Details" link to `legal.html#disclosure`. The meaning must not change; for example the finder notice becomes: "Sorted by distance only, not a recommendation. Partners are independent and responsible for their own licence and advice. Cargado Strategies may receive a commission if you become their client. [Wording to be confirmed by counsel]"
- Use **once per scene at most**. On partners / apply, merge the "Commission." and "Independent partners." notices into one.
- "Nothing is sent until you tap send." goes once per page, right under the primary WhatsApp button, and nowhere else. That takes it from 12 to 5.

### R5. Remove spec-speak from public copy (B4, B12). Find and replace
| Now | Change to |
|---|---|
| "The rail does the disclosure: Ours is run by our founder, Partners are independent businesses." | "**Ours** means [First name] does it herself. **Partners** are independent local professionals." |
| "Her own businesses, named as hers and shown separately from the independent partner network." | "Work she does herself, separate from our partner network." |
| "Each section says whether it's ours or a partner's." | Delete it. The "Ours / Partners" labels already say it. |
| "One place for several businesses. You send one message…" | "Tell us what you need. We find a trusted professional near you, and we check it went well." |
| "One minute · captions included when it arrives" | Delete it (scene removed under R3). |
| "Map preview · cities shown for illustration, not listed partners" | "Illustration only, not live partner locations." (sentence case, smaller) |

### R6. Replace generic headlines with contrast-driven ones, in the voice of the best lines (B9)
| Scene | Now | Proposed |
|---|---|---|
| services / intro | Everything in One Place. | Her Work, and the People She Trusts. |
| home / services | Every Service, One Place. | Nine Kinds of Help. One Way to Ask. |
| services / categories | Ours, and Our Partners'. | Who Does What, Near You. |
| story / values | Guided by Integrity, Service and Responsible Growth. | What I Will Never Trade for a Referral. |
| story / network | Behind the Website Is a Network of Independent Partners. | Real People Behind Every Name. |
| home / faq | Straight Answers. | The Questions Everyone Asks First. (keep "Straight Answers." for legal only) |
| legal / contents | Legal | The Fine Print, in Plain English. |

### R7. Pick one primary CTA verb and one secondary (B11)
- **Primary, everywhere:** "Get My Introduction" with a WhatsApp icon. It says what you get, not which app opens.
- **Service-specific:** "Ask [First name] About [Insurance / the Clean-Up / Outsourcing]". This replaces the bare "Ask →".
- **Partners:** "Apply to Join" (primary) and "Ask About Partnering" (secondary).
- **Retire:** "Write Your One Message", "Send Your Message on WhatsApp" and "Ask Us to Find Someone".

### R8. One slogan, used once per page as a signature (B15)
Keep "Connected by Purpose. United in Service." as the brand signature (splash and footer). Use "One Message. The Right Person. Close to You." **only** as the home closer, and give services, legal and partners their own closing lines, for example legal: "Still Unsure? Ask a Person."

### R9. Per-scene word budget (B8)
- Desktop: at most about 60 words of body per scene, plus the button and fine print. Phone: at most about 40.
- Services / strategy splits as Round 4 already allows: "The Offer" (headline, promise, button) and "What You Get" (the stack).
- Home hero: drop the three ticks there (they move to the merged compare scene) and drop the second helper line.

### R10. Proofread pass (B13)
- "ok?" becomes "OK?" on home.
- Remove the em dashes in the legal banner (use "Draft: to be reviewed by a lawyer in Canada before launch") and in the legal Q&A (use a full stop: "…coaching only. Not licensed accounting, tax or investment advice.").
- Afterwards, run a diff of the compliance copy against the Round 4 verbatim lists.

### Reference patterns (fast, modern, 30–45 friendly)
- **Wealthsimple:** one plain-English sentence per screen; numbers only when real.
- **Lemonade:** founder-voice microcopy and warmth inside legal-adjacent product copy.
- **Apple product pages:** one headline plus one line per scroll stop, which is exactly this site's film format.
- **Mercury and Ramp:** fine print stays small and at the bottom, with confident headlines.
- Apply the NN/g plain-language and scannability rules: front-load the keyword, 16 px+ body text, and 45–70 characters per line.

---

## Top 8 issues (summary)
1. **[critical]** The story page has no story: all narrative is placeholder (`story/1440x900/03-founder.png`, `04-logo.png`).
2. **[critical]** 112 highlighted placeholder chips, including four "[n]" stats as the first proof (`index/1440x900/01-hero.png`, `06-founder.png`).
3. **[high]** The same promise and boilerplate are repeated across 12 home scenes and every page ("Nothing is sent…" 12×, commission 7×, the 3-step strip 4×), which is what makes the site feel clogged.
4. **[high]** Internal spec language in public copy ("The rail does the disclosure…", "named as hers and shown separately…").
5. **[high]** Home scene 2 is an empty "Founder video coming soon" box (`index/1440x900/02-video.png`).
6. **[high]** Compliance callouts sit under every call to action and fill a third of the phone screen (`index/390x844/08-find.png`, `services/1440x900/06-categories.png` clipped).
7. **[high]** The founder is never named or shown; "Three Things She Does Herself." has no antecedent.
8. **[medium]** Scenes are overloaded (services / strategy about 170 words, home hero 11 text blocks), and the CTA wording varies 9 ways.
