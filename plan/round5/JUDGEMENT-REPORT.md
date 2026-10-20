# Cargado Strategies Website: Judgement Report

Round 5 · 18 October 2026 · prepared for the owner of Cargado Strategies

What this is: eight independent reviewers ("judges") looked at every screen of the current website (Home, Services, Our Story, Become a Partner and Legal) on a laptop (1440 x 900) and on a phone (390 x 844). Five researchers studied the best fast, modern websites and what 30 to 45 year old visitors need. This report puts all of that in one place: what they judged, what is good, what is bad, what needs to improve, and the redesign we chose.

Ground rules that do not change: the black and gold palette (no blue), Times New Roman headings in Title Case, Manrope body text and Poppins buttons and labels, and every compliance sentence and [bracket] placeholder. The Round 4 decisions (one screen per section, one scroll moves one section, and no counter, floating WhatsApp button, phone bar, sound or pause buttons, or decorative dashes) are treated as already decided.

## 1. Executive summary (plain English)

**The verdict: 5.0 out of 10.** The website is tasteful and carefully built, but it does not yet feel special, and it is crowded. Your instinct was right on both counts.

- **Why it looks "basic".** Almost every screen uses the same recipe: a small label, a heading on the left, a list or a box on the right. The headings never get really big, there is no photo or face anywhere, and the gold globe appears on about 30 of 42 screens, so it stops meaning anything. The one truly memorable moment, the "W Stands for Wealth / C Stands for Cargado" logo scene, is hidden deep in the Our Story page.
- **Why it feels "clogged".** Each screen tries to say everything. The Home page has 12 screens and repeats the same promise five times. A typical screen carries about 130 words, two to four buttons, boxes inside boxes, and around 15 pieces of permanent "chrome" (counter, corner marks, two WhatsApp buttons, sound and pause buttons). Gold-highlighted placeholders such as "[n]" and "[rating]" are the loudest things on the page, so the site looks unfinished.
- **Why a 30 to 45 year old visitor may leave.** In five seconds they cannot tell whether Cargado is a directory, an insurance agent or a business coach. They never see the founder. Small 11 to 13 px grey capital-letter text is hard to read past 40. On a phone, the main button sits below the fold, forms are cut off, and the page takes 12 swipes to finish. The "find a partner" search always ends in "Partner Spot Available", because no partners are listed yet.
- **Why it can feel slow.** A two to four second intro plays on every page load. On a mid-range phone the scrolling stutters (31 to 34 frames per second on Home and Services), and a large 3D library loads on every page, even Legal.

**The good news.** The foundations are strong: colour contrast passes accessibility checks everywhere, keyboard focus works, the code is disciplined, the best headlines are excellent ("One Message Instead of Five Searches.", "Pay on Clients, Not on Clicks."), and the logo scene shows what the whole site could feel like.

**The plan ("Full Stop.").** Fewer, bigger, calmer screens, each with one idea in very large Times New Roman type, ending in a gold full stop that opens the next chapter. Home goes from 12 screens to 6. The founder becomes the face of the brand. The gold globe gets a real job: it comes down to a dot map of Canada to show "someone near you". The intro plays once per visit and lasts about one second. A target of 8 out of 10 or better from every judge, and a Lighthouse phone score of 90 or more, is built into the acceptance tests.

## 2. Scorecard

Scores out of 10, one row per judge (lens), one column per page. "Overall" is each judge's own site-wide score. The page averages and the site score are the plain average of the eight lenses.

| Lens (judge) | Home | Services | Our Story | Partners | Legal | Overall |
|---|---|---|---|---|---|---|
| Visual design and wow factor | 5.5 | 5.0 | 6.5 | 5.0 | 6.0 | 5.5 |
| Layout and clutter | 5.0 | 4.0 | 6.5 | 4.5 | 5.5 | 5.0 |
| Typography | 6.0 | 5.0 | 6.5 | 5.5 | 6.5 | 6.0 |
| Motion and experience | 5.0 | 4.5 | 7.0 | 5.0 | 3.5 | 5.0 |
| Content and copy | 5.0 | 5.0 | 3.0 | 7.0 | 6.5 | 5.0 |
| UX and conversion | 4.5 | 4.0 | 5.0 | 6.0 | 6.0 | 4.5 |
| Mobile and accessibility | 5.0 | 4.0 | 6.0 | 4.0 | 5.0 | 5.0 |
| Performance (as felt) | 4.0 | 4.0 | 6.0 | 5.0 | 3.0 | 4.0 |
| **Page average** | **5.0** | **4.4** | **5.8** | **5.3** | **5.3** | **5.0** |

Two extra scores: the splash (intro) scored 4.5 for visuals and 6 for motion; the reduced-motion version of the site scored 6.5.

**Reading the scorecard.** Our Story is the strongest page visually (it holds the logo scene) but the weakest in content, because every part of the story is still a placeholder. Services is the weakest page overall: it is the most crowded, and its forms and lists are cut off at the bottom of the screen. Performance and conversion are the lowest lenses, which matters most for the phone visitors who arrive from a shared WhatsApp or Facebook link.

## 3. What each judge found

Severity: **Critical** = loses visitors or trust; **High** = clearly hurts the wow factor or the 30 to 45 visitor; **Medium** = noticeable polish problem; **Low** = minor. Findings that several judges raised are merged and listed once, under the lens where they matter most.

### 3.1 Visual design and wow factor (5.5)

What was judged: colour balance, imagery, texture and depth, the 3D globe, icons, the splash, and whether there is a signature moment people remember.

**Good (keep)**
- The Story logo scene: a gold C ring wraps the globe, the W sits inside, "W Stands for *Wealth.*" and "C Stands for *Cargado.*" sit in opposite corners. It is the only frame with a clear focal point and real drama.
- The dot-matrix map of Canada with the Winnipeg ripple (Home scene 8) and the gold-line province map (Services finder): specific to the business and premium.
- The Legal "paper stack" with large outlined numerals: crafted and right for legal.
- Large ivory Times New Roman headlines on near-black: the closest the site gets to "private bank".
- Gold used as light on black (buttons, thin rules, timeline dots), and restraint in icons (no clip-art).

![The logo scene: the one true signature moment today (Story, laptop)](shots/report/04-story-logo-1440.png)

**Bad**

| Problem | Where | Severity |
|---|---|---|
| No signature moment on Home; the memorable C·W globe arrives at scene 9 of 12 | Home hero | Critical |
| No real imagery: no faces, no places; the founder photo is an empty frame with a globe in it | Story founder, Home video | Critical |
| The globe is wallpaper: on about 30 of 42 screens, often half-cropped in a corner | Most scenes | High |
| The globe's arcs render as a tangled gold scribble that spills off the sphere | Every hero | High |
| Large flat gold fields read as mustard or khaki, and every page rotates ink, bone, gold mechanically | About a third of all scenes | High |
| Every scene uses the same layout and the same headline size (70 to 110 px) | About 30 of 42 scenes | High |
| A 15 px unpainted strip on the right edge of every desktop frame | All desktop screens | Medium |
| A generic splash (logo plus loading line) that hands off to nothing | Splash | Medium |
| Offset "shadow plate" double borders look misregistered | Cards on Story, Services, Partners | Medium |
| Stars and grain show as dust on gold and bone fields | Light scenes | Low |

![Home "Sounds Like You?": flat gold field, globe cropped in the corner, chrome on every edge](shots/report/02-home-situations-1440.png)

**Needs improvement**
- Build one signature sequence and open Home with it: the monogram draws in gold, then becomes the globe's horizon (W1 in the direction).
- Show the globe in about one scene in three, large, and only where it means something. Fix the arcs.
- Rebalance colour: black is the stage (60 to 70 percent), gold is the light, and a gold field appears at most once per page, finished as brushed metal rather than flat paint.
- Make type the wow: one or two "monument" screens per page at poster size, with one italic gold word per headline.
- Plan for real imagery: a duotone founder portrait (ask the client for it now); until then a typographic portrait, never an empty frame.

### 3.2 Layout and clutter (5.0)

What was judged: grid, whitespace, density, hierarchy, alignment, ideas per screen, text against visuals, and consistency across pages.

**Good (keep)**
- A consistent grid: 56 px side gutter, a shared left text edge, a tidy 7/5 column split.
- Divided lists instead of card grids (situations, services, values, legal contents).
- The three-dot "How It Works" timeline: the clearest three-idea screen on the site.
- The story logo scene as the north star for composition.

**Bad**

| Problem | Where | Severity |
|---|---|---|
| Five layers of chrome frame every screen (header with 8 controls, counter and timecode, corner marks, floating WhatsApp, progress bar): about 15 permanent marks | Every screen | Critical |
| Scenes overflow the screen at 1440 x 900: buttons and compliance text cut off | Services categories and inquiry, Home and Services close | Critical |
| The Home hero holds about 20 elements and three competing focal points | Home hero | Critical |
| Mobile is the desktop content stacked into one 844 px screen; text runs under the bottom bar | 7+ phone scenes | Critical |
| One template on about 30 of 42 scenes | Site-wide | High |
| Home has 12 scenes and repeats "one message" four times | Home | High |
| Boxes inside boxes, offset borders, several notice blocks per screen | Services, Story, Partners | High |
| Half-empty, unbalanced screens that look like something failed to load | Partners how, ask, founding; Home FAQ | Medium |
| Long forms shown in full (7 fields; a 4-part partner application) | Services inquiry, Partners apply | Medium |

![Home hero: about 20 elements, a form competing with the headline, four gold "[n]" placeholder boxes, and chrome in every corner (counter, corner marks, sound and pause buttons, two WhatsApp buttons)](shots/report/01-home-hero-1440.png)

![Services "30-Day Cash-Flow Clean-Up": about 14 text blocks, 9 placeholders and 4 buttons on one screen](shots/report/06-services-strategy-1440.png)

![Services categories: content cut off at the bottom, spec language in the copy, "Partner Spot Available" dead ends](shots/report/07-services-categories-1440.png)

**Needs improvement**
- Clear the frame: build the Round 4 removals; the header keeps the logo, three links and one WhatsApp button (six marks at most).
- A hard budget per screen, checked automatically: one headline of 8 words or fewer, 60 words at most (target 40), one main button plus one text link, one fine-print line.
- Five scene types (Monument, Object split, Index rows, Doors, Paper), and no two neighbouring screens may use the same one.
- Cut Home from 12 screens to 6.
- Replace boxes with thin gold hairlines and space; allow one framed element per screen.

### 3.3 Typography (6.0)

What was judged: type scale and rhythm, line length, paragraph shape, contrast on each background, readability for 30 to 45 year olds, labels and placeholder styling.

**Good (keep)**
- The serif display voice: Times New Roman in Title Case at large sizes looks classic and premium.
- The logo scene's "small line, huge gold word" pattern; make it the pattern for the whole site.
- The outlined giant numeral on the Legal reader.
- Balanced headline wrapping (no orphans), a 62-character measure, accessible colour tokens and layout-stable font loading.

**Bad**

| Problem | Where | Severity |
|---|---|---|
| Small utility text everywhere: 12 px tracked capitals for labels and eyebrows, 13 px notices, 10 to 11 px on the Legal phone banner | Every page | Critical |
| A flat scale with no big moment; the hero never gets past about 89 px | Every scene | High |
| The phone hero headline is 38 px, so it looks like any other heading | Home phone | High |
| Three typefaces and about 9 styles on one screen; Poppins used for content | Services strategy, Home founder | High |
| Placeholders are the loudest element: gold boxes around [n], [value], [$ per month], [Signature] | Home, Services, Partners, Story | High |
| Customer quotes set in the button font; the elegant serif italic is never used | Situations, founder quotes | Medium |
| Times New Roman used at 16 to 24 px on dark backgrounds, where it looks thin and broken | Card titles, Legal contents | Medium |
| Title Case on 10 to 15 word headlines | Story, Partners hero | Medium |

**Needs improvement**
- A 14 px floor for all visible text; notices 15 to 16 px; body 17 px on phones and 18 px on desktop; sentence-case form labels.
- A dramatic scale: a "mega" size (about 56 px on phones, about 150 px on a laptop) for one claim every few screens.
- Times for headings, numbers and quotes (28 px and above); Manrope for reading; Poppins only for labels and buttons.
- Customer and founder quotes in large Times italic.
- Quiet placeholders: a dotted underline instead of a gold box. The brackets stay visible.

### 3.4 Motion and experience (5.0)

What was judged: how scrolling feels, transitions between scenes, reveal effects, text effects, hover, sound, splash timing and pacing, and the reduced-motion version.

**Good (keep)**
- The logo scene is the only moment where motion means something: the network becomes the brand.
- The iris (a circle of the next colour opening over the screen) is a strong, on-brand film cut when used rarely.
- Engine discipline: everything reversible, only cheap properties animated, loops that sleep when idle.
- A proper cursor ring and magnetic main button; reduced motion is respected.

**Bad**

| Problem | Where | Severity |
|---|---|---|
| Dead air: every transition shows 3 to 4 wheel-notches of an empty colour field | Every transition | Critical |
| The "decode" effect turns labels into $ % # & symbols, which looks like a pricing glitch on a finance site | Every eyebrow | High |
| Luminance strobe: almost every scroll flips the whole screen between near-black and near-white | Home | High |
| Scroll-scrubbed reveals never "land": stop mid-gesture and text is half-faded or tilted | All pages | High |
| About 8 notches per scene, about 95 to finish Home | All pages | High |
| The splash plays on every page load (about 1.9 to 3.2 s each time) | All pages | High |
| Star "rain" streaks behind reading text | Legal, Services finder | High |
| Sound on by default, with no off switch once Round 4 lands | All pages | High |
| 3D tilt on forms and legal panels; too many stacked hover effects | Forms, cards | Medium |

![Dead air: mid-transition, the screen is an empty gold disc with one stray "#" from the decode effect](shots/report/11-motion-deadair-1440.jpg)
**Needs improvement**
- Play transitions on a clock (under one second) after each scroll, overlapping old and new content, so no frame is ever empty.
- Remove the decode scramble, letter-roll, heading drift, star streaks and tilt on forms.
- Group colours into two or three chapters per page; the iris fires only between chapters.
- The splash once per visit (about 1 s), then smooth page-to-page transitions.
- Sound: one soft "breath" on chapter changes, a click, a success chime; silent on phones; an on/off switch in the footer and menu.

### 3.5 Content and copy (5.0)

What was judged: clarity, tone (warm, faith-based founder, professional), length per screen, repetition, Title Case, placeholders, where compliance notices sit, and the story.

**Good (keep)**
- Headlines built on a contrast: "One Message Instead of Five Searches.", "Pay on Clients, Not on Clicks.", "You Win on Being Close, Not on Bidding.", "If Something Happens to You, Is Your Family OK?"
- The "Sounds Like You?" lines written in the visitor's own voice.
- The struck-through "on your own" list, the 30-Day Clean-Up offer stack, and trust microcopy such as "Nothing is sent until you tap send."
- Plain-language legal text; a subtle, correct faith reference (Mark 11:24 as a reference only).

**Bad**

| Problem | Where | Severity |
|---|---|---|
| The story page has no story: every narrative element is a placeholder | Our Story | Critical |
| 112 gold-highlighted placeholder chips across the site, including four "[n]" stats as the very first proof | Home hero, Services, Partners | Critical |
| The same promise repeated until it feels clogged ("Nothing is sent until you tap send" 12 times; the 3-step strip 4 times) | All pages | High |
| Internal design notes leak into public copy ("The rail does the disclosure…") | Services, Home | High |
| Home scene 2 is an empty "Founder video coming soon" box | Home | High |
| Compliance notices styled as warning boxes under every button | Most pages | High |
| The founder has no name or face anywhere ("Three Things She Does Herself.") | Home, Services, Story | High |
| About 9 different wordings for the same button | All pages | Medium |

![Home scene 2: the second impression is an empty video box](shots/report/03-home-video-1440.png)

**Needs improvement**
- Write the founder story now as a real draft in her voice, with brackets only around facts she must confirm.
- Hide fake proof until it is real; quiet the remaining placeholders.
- Say each promise once; move "Nothing is sent until you tap send" next to each WhatsApp send button only.
- Replace spec language with customer language; replace generic headlines with contrast-driven ones.
- Compliance as calm fine print at the bottom of the screen, wording unchanged.

### 3.6 UX and conversion (4.5)

What was judged: can a visitor tell within 5 seconds what Cargado is, who it is for, and what to do next; navigation, buttons, the finder, forms, trust signals and dead ends.

**Good (keep)**
- Plain, benefit-first headlines and the self-identification "Sounds Like You?" list.
- Honest friction-reducers next to every WhatsApp button ("No fee to you · No obligation").
- Disclosure written as a trust asset ("Integrity: We say how we are paid").
- A two-step intro form (choose a need, type a city) and a focused partner page.

**Bad**

| Problem | Where | Severity |
|---|---|---|
| Identity split: referral network, the founder's own three businesses and a partner pitch all compete; the 5-second test fails | Home, Services | Critical |
| The core promise leads to a dead end: every finder search ends in "Partner Spot Available" | Services finder, categories | Critical |
| No human anywhere: the founder scene is a globe inside a photo frame | Home, Story | Critical |
| About 30 different button labels; 2 to 4 competing actions per screen | All pages | High |
| WhatsApp is the only working channel (no phone link, no email) | All pages | High |
| No persistent call to action on phones once Round 4 removes the bottom bar | Phone | High |
| Placeholder proof sits in the most valuable spots | Home hero | High |

![Our Story founder scene: an empty photo frame, a globe and placeholder boxes where the founder should be](shots/report/05-story-founder-1440.png)

**Needs improvement**
- Lead with the founder and her three services; present the network as "and for everything else, we introduce you".
- Hide the finder until partners exist and offer a concierge request instead ("Tell us the service and your city; we'll find someone").
- One button vocabulary: "Get My Introduction", "Ask About [Insurance / the Clean-Up / Outsourcing]", "Apply to Join".
- A WhatsApp icon in the phone header, plus phone and email links, and an on-site confirmation after WhatsApp opens.

### 3.7 Mobile and accessibility (5.0)

What was judged: the 390 x 844 phone experience, tap targets, text sizes, measured contrast, keyboard and screen-reader basics, focus, reduced motion and scroll-jacking.

**Good (keep)**
- 0 contrast failures across 84 measured screens.
- Visible focus rings that follow the film; one H1 per page, landmarks, skip link, no unlabelled buttons or inputs.
- A correct phone menu; a real reduced-motion mode; zoom is not blocked.
- Large chips, inputs and buttons (44 to 56 px).

**Bad**

| Problem | Where | Severity |
|---|---|---|
| Content and controls clipped below the fold inside the fixed screen; keyboard focus can land off-screen | Services inquiry, Partners apply, many closes | Critical |
| The phone scroll-jack is too long: 12 to 13 screens on Home, Services and Partners | Phone | Critical |
| The hero's main button is below the fold on a phone | Home phone | High |
| Text too small for 40+ eyes (11 to 13 px labels and notices) | All pages | High |
| Long forms (3,457 px partner application) inside one scroll-jacked scene | Partners, Services | High |
| Sound with no off switch after Round 4 | All pages | High |
| Decoration (globe lines, stars, grain) running through reading text | Phone | Medium |

![Phone hero: the form's own button is below the fold; only the soon-removed bottom bar shows an action](shots/report/08-home-hero-390.png)

![Phone inquiry: fields, consent and the send button sit below the screen](shots/report/09-services-inquiry-390.png)

**Needs improvement**
- Native snap scrolling on phones (one swipe, one screen) and 6 to 7 screens per page.
- A phone hero with headline and one large button that opens a full-screen WhatsApp sheet.
- Steppers for long forms: four fields or fewer per step, with announced step changes.
- A 14 px text floor and 44 px tap targets everywhere; force the normal stacked layout at 200 percent zoom.

### 3.8 Performance as the visitor feels it (4.0)

What was judged: time until the visitor can read and act, smoothness while scrolling, and what each page downloads and runs, on a mid-range phone and an office laptop.

**Good (keep)**
- The production build is well shaped: bundled, self-hosted fonts, long caching, zero third-party requests.
- The headline paints in 0.3 to 0.8 s; layout never jumps (CLS near 0); Lighthouse accessibility 100.
- Desktop scrolling is smooth (56 to 60 fps); idle loops sleep correctly.

**Bad**

| Problem | Where | Severity |
|---|---|---|
| The splash hides already-painted content for 2 s on desktop and 3.3 to 3.9 s on phones, on every page | All pages | Critical |
| The phone's processor is saturated at start-up (Lighthouse mobile 41 to 57; 2.7 s of blocking time on Home) | Home, Services | Critical |
| Phone scrolling stutters at 31 to 34 fps, with 39 to 47 percent janky frames | Home, Services | High |
| A 462 KB 3D library (57 percent of page weight) loads on every page for one decorative globe | All pages, even Legal | High |
| Per-letter text splitting and run-time kerning cost about 1 s of phone CPU | All pages | High |
| A sound hook forces layout on every scroll frame, even when muted | All pages | High |
| Legal runs the whole film: splash, 3D globe, stars | Legal | Medium |

**Needs improvement**
- Splash once per session, about 1 s; content readable in 1 s on phones after the first page.
- Replace three.js with a light 2D dot-globe (about 10 KB); static grain; stars drawn once.
- Word splits and kerning done at build time; no layout reads in scroll handlers.
- Legal as a calm, static document with no film effects.
- A performance gate in the build: Lighthouse mobile 90+, desktop 95+, 55+ fps on a throttled phone.

## 4. Top 15 fixes, ranked

Ranked by impact on the two complaints ("basic" and "clogged") and on the 30 to 45 visitor, then by how many judges raised it.

| # | Fix | Fixes | Judges | Severity |
|---|---|---|---|---|
| 1 | **One idea per screen.** Cut Home from 12 screens to 6 (Story 7 to 5, Partners 8 to 6). Each screen gets one headline of 8 words or fewer, 60 words at most (target 40), one main button and one text link, checked automatically | Clogged, long, repetitive | Layout, Content, UX, Mobile, Performance | Critical |
| 2 | **Clear the frame.** Build the Round 4 removals; the header keeps the logo, three links and one WhatsApp button; a WhatsApp icon in the phone header | Clogged chrome, two WhatsApp buttons | Layout, Visual, UX | Critical |
| 3 | **Everything fits.** Every screen fits from 1920 x 1080 down to 360 x 740; long forms become steppers; the phone hero shows its button above the fold | Clipped buttons, forms and compliance text | Layout, Mobile, UX, Visual | Critical |
| 4 | **Say who Cargado is in 5 seconds and show the founder.** Lead with the founder and her three services; the network is "for everything else". Typographic portrait now, duotone photo when supplied; a real story draft in her voice | Identity split, no face, empty story | UX, Content, Visual | Critical |
| 5 | **A signature opening.** The monogram draws in gold and match-cuts into the globe; the hero headline lands with a gold full stop that opens the next chapter. Once per session, about 1 s | No wow moment, slow splash | Visual, Motion, Performance | Critical |
| 6 | **Hide fake proof, quiet the placeholders.** Stats, ratings, testimonials and the live counter appear only when real; placeholders become a dotted underline; a review mode (?review=1) shows them to the client | Site looks broken; anti-proof | Content, Typography, UX, Visual | Critical |
| 7 | **Close the dead end.** Hide the partner finder until at least 3 partners exist; offer a concierge request instead | "Partner Spot Available" everywhere | UX | Critical |
| 8 | **Readable type with real scale.** 14 px floor, 17 to 18 px body, sentence-case labels, Times only at 28 px and above, a mega size for one claim every few screens, one italic gold word per headline | Small text, flat scale | Typography, Mobile, Layout | High |
| 9 | **Transitions that play and land.** Timed (under 1 s), overlapping cuts after each scroll; no empty colour field ever on screen | Dead air, half-faded text | Motion | High |
| 10 | **Remove gimmicks.** No decode scramble, letter-roll, heading drift, star "rain", tilt on forms, or default sound; one soft sound set with a footer switch | "$%#" labels, noise, sound with no off switch | Motion, Mobile, Performance | High |
| 11 | **Colour in chapters.** Black is the stage (60 to 70 percent); a gold field once per page as brushed metal; at most 3 colour changes per page | Mustard gold, strobing | Visual, Motion | High |
| 12 | **A globe with a job, and lighter.** Shown in about one screen in three; it comes down to a dot map of Canada with one arc to "A Professional Near You"; a 10 KB 2D dot-globe replaces the 462 KB 3D library | Wallpaper globe, scribbled arcs, heavy pages | Visual, Motion, Performance | High |
| 13 | **Five scene types, no boxes.** Monument, Object split, Index rows, Doors, Paper; never the same type twice in a row; hairlines and space instead of boxes and offset borders | Same template everywhere, boxes inside boxes | Layout, Visual | High |
| 14 | **One button vocabulary and more ways to reach you.** "Get My Introduction", "Ask About …", "Apply to Join"; phone and email links; a confirmation after WhatsApp opens | 30 button labels; WhatsApp-only | UX, Content | High |
| 15 | **Fast on a mid-range phone.** Splash once; static grain; stars drawn once; build-time text splitting; a calm static Legal page; page-to-page View Transitions; a performance gate (Lighthouse mobile 90+) | Stutter, slow start, heavy Legal | Performance, Mobile | High |

## 5. What the research found

### 5.1 The audience (30 to 45, Canadian, often on a phone)

- Most visits start from a link shared in WhatsApp or on Facebook, on a phone. Visitors come with a job to do, and goal-driven visitors are the least patient with unusual scrolling ([NN/g, Scrolljacking 101](https://www.nngroup.com/articles/scrolljacking-101/)).
- Near-focus vision starts to change in the early 40s ([EyeWiki, Presbyopia](https://eyewiki.org/Presbyopia)), so small grey text on black fails first. Body text should be 17 to 18 px and nothing under 14 px.
- Motion sensitivity is common after 40 ([Agrawal et al. 2009](https://pubmed.ncbi.nlm.nih.gov/19468085)): motion must be purposeful, brief and stoppable.
- Only about half (52 percent) of Canadians aged 35 to 54 use WhatsApp ([Research Co. survey via Business in Vancouver](https://biv.com/article/2022/07/survey-whats-whatsapp-use-canada)), so phone and email links are needed beside it. Many in the founder's Filipino-Canadian network may prefer Messenger.
- "Modern" to this group means calm, confident and expensive-feeling: large type, generous space, rich gold, and a few deliberate moments of motion. Not games, not hidden controls.
- Accessibility baseline: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (4.5:1 contrast, reflow at 320 px, animations that stop within 5 s).

### 5.2 Award-winning sites that are also fast

What juries reward in 2026: art direction (every still frame looks intentional), directed motion, and performance on real mid-range devices. A 3D hero is now normal; the differentiators are pacing, type and transitions.

| Site | What makes it memorable | What we take |
|---|---|---|
| [Cartier Watches & Wonders](https://www.cartier.com/watchesandwonders) (Immersive Garden) | Dark field, gold metal, one object per "room", slow camera; same tech stack as Cargado | Each section is a room with one idea and one pose; gold as polished metal |
| [Apple AirPods Pro](https://www.apple.com/airpods-pro/) | One huge claim per screen, calm and cinematic | The Monument screen; the best single reference for this age group |
| [Igloo Inc](https://www.igloo.inc) (Site of the Year 2024) | One hero object the camera travels through; work done behind a short preloader | The globe as one travelling character; no stutter on the first scroll |
| [Lusion](https://lusion.co) / [Oryzo](https://oryzo.ai) | Physical inertia on the hero object | Eased, weighty globe movement |
| [Linear](https://linear.app) | Light as the wow: soft spotlights and glowing hairlines | A gold key light behind headlines; 1 px gold hairlines (almost free) |
| [Stripe](https://stripe.com) | Wow without clutter; one signature visual | One signature moment per page, everything else still |
| [Vercel Ship](https://vercel.com/ship) | Line-draw frames | A gold hairline that draws around the one framed element |
| [Locomotive](https://locomotive.ca) / [Obys](https://obys.agency) | Mask and clip-path wipes between sections | Film-cut transitions instead of "the next block slides up" |
| [Active Theory](https://activetheory.net) | Device tiers that keep phones smooth | Three device tiers (full, lighter, static poster) |
| [Shopify Editions](https://www.shopify.com/editions/spring2026), [By-Kin](https://by-kin.com) | Big headlines revealed word by word | Word-by-word reveals (never letter scrambles) |

Deliberately not recommended for this audience: puzzle navigation, hidden gestures, letter-scramble type and sound by default.

### 5.3 Premium, trust-heavy finance and luxury sites

| Site | Lesson for Cargado |
|---|---|
| [Wealthsimple](https://www.wealthsimple.com/en-ca) | One product per screen, one sentence, one visual; a serif headline reads as modern to Canadians; one big proof number at the end |
| [Policygenius](https://www.policygenius.com) | "A *human* approach": one italic word does the emotional work; commission and independence explained plainly in the FAQ |
| [Ethos](https://www.ethos.com) | Prices framed as "from [$X]"; 3 values, 3 steps, FAQ, one closing button |
| [Lemonade](https://www.lemonade.com) | Value before asking for details; conversational, one question at a time (our WhatsApp sheet) |
| [Rothschild & Co](https://www.rothschildandco.com) | Leads with independence; "three complementary businesses" in three cards, exactly Cargado's shape |
| [Bessemer Trust](https://www.bessemertrust.com) | A real person and a name are the strongest trust signal |
| [Coutts](https://www.coutts.com) and [Pictet](https://www.pictet.com) | Three-word heroes, definition-style headlines, one call to action, regulatory details in the footer |
| [Rolex](https://www.rolex.com) and [Cartier](https://www.cartier.com) | One huge object and one line of type; gold as material |

### 5.4 Your reference: C:\Portfolio

The Portfolio feels premium because each screen says one thing, very large, and then moves. It has 24 shots of about 5 to 40 words each, one dominant object per frame, extreme scale contrast (huge display type, tiny labels, almost nothing in between), rules instead of boxes, giant outline numerals for depth, and one transition grammar: the full stop after the name pops and swells into the iris. Cargado copied the machinery (stage, stars, grain, iris, counter) but not the direction. The redesign borrows the direction: one idea per screen, poster-scale type, outline numerals and the full-stop iris, while leaving out the developer-portfolio effects (letter scramble, counter) that do not suit a trust brand.

## 6. The chosen redesign direction: "Full Stop."

Three directions were written and scored by a panel of three judges. "Full Stop." (portfolio-led) won with all three (43, 42.5 and 42 points), with the best ideas grafted in from "Still Gold" (clarity) and "The Gold Hour" (cinematic).

**The idea in one paragraph.** Every chapter ends on one confident statement in Times New Roman at poster scale. Its gold full stop is the hinge of the film: it lands, pops, then swells into the circle that opens the next chapter. The rhythm is statement, then rest: one monument screen, then one calm working screen. Hairlines replace boxes, giant outline numerals replace extra elements, and the gold dot-globe appears only where it has a job. The promise the punctuation makes: *ask once, and it's handled.*

**Six signature moments (and nothing else competes with them)**
- **W1 · The Opening.** The C of the monogram draws in gold, the W draws inside it, a sheen crosses it, then the C ring becomes the horizon of the hero globe. About 1 s, once per visit; any tap skips it.
- **W2 · Four Searches, Struck.** "Searching 'Broker Near Me'", "Calling Five Offices", "Waiting for Call-Backs", "Guessing Who to Trust" are struck through one by one, and "One Message●" lands huge.
- **W3 · Three Doors, in Metal.** Protect. Plan. Delegate. Three tall brushed-gold panels for the founder's three services; the one you point at widens and turns black.
- **W4 · The Globe Comes Down to Canada.** The globe turns to face North America, its points flow into a dot map of Canada, and one arc draws from your city to "A Professional Near You".
- **W5 · The Bookend.** The Story logo scene is kept; every page closes on a gold medallion embossed with the C·W mark, mirroring the opening.
- **W6 · Between pages.** A 450 ms gold-edged circle transition from the link you clicked, instead of a new splash.

**Design system in brief**
- Type: a mega size (56 px phone, about 150 px laptop), a statement size for heroes and closes, 17 to 18 px body, a 14 px hard floor, one italic gold accent per headline.
- Colour: black 60 to 70 percent; bone (ivory) as the reading room; a gold field at most once per page, as brushed metal; at most 3 colour changes per page.
- Layout: five scene types (Monument, Object split, Index rows, Doors, Paper); at least 18 percent of each screen left empty; at most 60 words.
- Motion: every transition plays in under 1 s and then everything is still; all automatic motion stops within 5 s.
- Sound: a soft breath on chapter changes, a click, a success chime; silent on phones; a footer switch.
- Performance: Lighthouse phone 90+ and desktop 95+ on every page; under 300 KB for Home.

**What changes on each page**

| Page | Today | After the redesign |
|---|---|---|
| Home | 12 screens; form-heavy hero; video placeholder; FAQ, partner pitch and services grid all inside | 6 screens + footer: Hero "The Right Professional, *Near You*." with one button (opens the WhatsApp sheet) · "One Message" struck-searches moment with the 3 steps · "Sounds Like You?" quote rows · Three Doors (Protect / Plan / Delegate) on brushed gold · "Need Someone We Don't Do Ourselves?" with the globe-to-Canada map · Close with the medallion, FAQ in a dialog and links to Story and For Professionals |
| Services | 8 crowded screens; jump rail; finder that always ends in "Partner Spot Available"; inquiry cut off | 8 calmer screens + footer: service rows ("Her Work, and the People She Trusts.") · Insurance (portrait split) · "The *30-Day* Cash-Flow Clean-Up" as a monument · "What You Get" rows without [value] boxes · Back-Office Team as 4 metal panels · concierge request with the Canada map (finder returns when partners exist) · 3-step inquiry · close |
| Our Story | 7 screens, all placeholders, globe in an empty photo frame | 5 screens + footer, drafted in her voice: "I Started Cargado So Good People Wouldn't Have to Search *Alone*." with a typographic portrait · "One Place. Not *Five*." · the logo scene (kept) · "What I Will Never Trade for a *Referral*." values · "Tell Me What You Need. I'll Find Someone *Good*." |
| Become a Partner | 8 screens; 4-line hero; boxed tiers; a 4-part application in one scene | 6 screens + footer: "Clients Near You, Already *Asking*." with a node joining the map as "You" · "Pay on Clients, Not on *Clicks*." rows · 3 tier panels · the founding offer on brushed gold · a 4-step application · questions and close |
| Legal | The full film: splash, globe, star "rain", decode effects | Calm on purpose: one ivory field, no splash, globe, stars or sound; "The Fine Print, in *Plain English*." contents, paged documents at a comfortable 68-character measure, Q&A, close. All draft and compliance wording verbatim |

**Owner questions (built with defaults so nothing waits).** The founder's name, photo and story facts (placeholders and a typographic portrait until supplied); the hero headline (network version by default, the "Protect. Plan. Delegate." version one switch away); footer Sound and Motion switches (on); hiding fake proof until real (on, with ?review=1 to see it); and the finder gate (3 partners).

**How we will know it worked.** Every one of the eight judges re-scores the built site with the same rubric, and every lens must reach 8 out of 10 or better (today: 4 to 6). Automated tests check fit on 9 screen sizes, the word and element budgets, no empty transition frames, every compliance sentence present, 0 console errors, and the performance budget.
