# Round 5 judge: UX and conversion

Lens: can a 30–45 year old visitor tell **what Cargado is within 5 seconds, who it is for, and what to do next** (WhatsApp, inquiry, become a partner)? This review covers navigation, CTAs, the service finder, forms, trust signals, testimonials, founder presence, the flow from page to page, and dead ends.

The current build was judged with Round 4 decisions treated as settled. Those decisions are one screen per section, one scroll per section, and removal of the HUD, the floating WhatsApp button, the phone bar, the sound and pause toggles, and the decorative dashes. Where Round 4 makes a conversion problem worse, this review says so.

**Screenshots.** When I judged, the shared run in `plan/round5/shots` held only `index/1440x900/01–06`, `story/1440x900/01–07` and `splash/`. It was still running and looked stalled. I shot the remaining pages myself with `tools/shoot.mjs` into my scratchpad (absolute paths below). File names follow the same `<page>/<WxH>/<NN>-<scene>.png` pattern, so they match the shared run once it finishes.
- `S1` = `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\b0e5bd65-452e-4583-aae2-00643e5ccc5c\scratchpad\ux-shots\` (index 390x844)
- `S2` = `…\scratchpad\ux-shots2\` (services 1440 + 390; partners, story 390)
- `S3` = `…\scratchpad\ux-shots3\` (partners 1440, legal 1440)
- `R5` = `C:\Cargado Strategies\plan\round5\shots\` (shared run)

---

## 1. Scores (this lens only)

| Page | Score | One-line justification |
|---|---|---|
| Home (`index.html`) | **4.5 / 10** | The headline is clear, but the page sells a referral network that has no partners yet (`PARTNERS = []`). It runs 12 scenes. Clients, partners and the founder's own businesses compete for attention. There is no face, and the proof row reads `[n] [n] [n] [rating]`. |
| Services (`services.html`) | **4 / 10** | The strongest offer (the 30-Day Clean-Up) sits on the most crowded screen on the site. The finder always ends in "Partner Spot Available". The inquiry form is cut off at 1440x900. There are five different CTA verbs on one page. |
| Our Story (`story.html`) | **5 / 10** | The logo scene is the only real "wow" moment on the site. The founder scene has no founder: a wireframe globe sits in a photo frame next to `[Signature]`. There is no CTA until scene 7 of 7. |
| Become a Partner (`partners.html`) | **6 / 10** | It speaks to one audience, the copy is honest and specific ("Pay on Clients, Not on Clicks"), and there is a clear Apply CTA. But it runs 8 scenes, the tiers are all placeholders, and the application form has 4 fieldsets. |
| Legal (`legal.html`) | **6 / 10** | It is not a conversion page and does its job. The contents grid works well. It closes with a WhatsApp CTA. The draft banner is fine before launch. |
| **Overall** | **4.5 / 10** | It looks premium and the copy is careful. But a visitor cannot tell in 5 seconds whether Cargado is a directory, an insurance agent or a business coach. They see no person. They are offered about 30 different CTA labels, and the core "find a partner" promise leads nowhere. |

---

## 2. What is good (keep)

1. **Plain, benefit-first headline copy.** "The Right Professional Near You, From One Message." (`R5/index/1440x900/01-hero.png`) and "One Message Instead of Five Searches." (`04-compare.png`) are short, concrete and free of jargon, which suits this audience.
2. **"Sounds Like You?" situation list** (`R5/index/1440x900/03-situations.png`). These are self-identification prompts in the customer's own words ("My business is busy but money is tight") and each leads straight to a service. It is the best wayfinding pattern on the site. Keep it, and promote it (see 4.2).
3. **Honest friction-reducers next to every WhatsApp button**: "Nothing is sent until you tap send", "We ask for your city only so…", "No fee to you · No obligation". These are exactly the reassurances 30–45 year olds look for before they tap.
4. **Disclosure written as a trust asset, not fine print.** Finder notices, the "Integrity: We say how we are paid" value (`R5/story/1440x900/05-values.png`), and the partner "Pay on Clients, Not on Clicks" (partners scene 3) all read as confident rather than defensive.
5. **The logo scene** (`R5/story/1440x900/04-logo.png`). A large gold C·W with the globe inside, "W Stands for Wealth / C Stands for Cargado.", lots of black space, and two type scales. This is the only screen that already has the wow factor and the calm, expensive feel the research recommends (research-premium-finance §1.10, Rolex: "one huge object and one line of type").
6. **The 3-step "What Happens After You Send It"** (`R5/index/1440x900/05-how-it-works.png`). It is clean, scannable and sets expectations (Now / [24h] / Day [3]).
7. **The intro form's two numbered steps** (`1 · What do you need?` chips, then `2 · Your city`). It is the lowest-effort lead capture on the site, with no typing beyond a city.
8. **The services intro jump grid** (`S2/services/390x844/01-intro.png`). "Ours / Partners / Find / Ask" labels state ownership at a glance. On a phone it is a usable 2×3 menu.
9. **The partners page's single-audience focus** (`S3/partners/1440x900/01-hero.png`). The headline names the payoff ("Meet People in Your City Who Already Need Your Service."), the commission model is stated up front, and the "We don't promise a number of introductions" honesty builds trust with professionals.
10. **The legal contents grid** (`S3/legal/1440x900/01-contents.png`). Five numbered doors with item counts ("8 sections") make long legal text feel short and findable.

---

## 3. What is bad

| # | Defect | Page / scene · screenshot | Why it hurts the 30–45 audience or the wow | Severity |
|---|---|---|---|---|
| B1 | **Identity split: the visitor can't tell what Cargado is.** The home hero sells a referral network ("The right professional near you"). Scene 6 then says "Three Things She Does Herself", and scene 10 pitches partners. Services opens with "Our founder's own three businesses, and a network…". There are three businesses, two audiences, and no single sentence that says "Cargado = X for Y". | Home 01, 06, 10 · `R5/index/1440x900/01-hero.png`, `06-founder.png`; Services 01 · `S2/services/1440x900/01-intro.png` | It fails the 5-second test. A busy parent or owner who can't place the business in one glance leaves. The founder's real, bookable services (insurance review, cash-flow clean-up, outsourcing) are buried in scene 6 of 12. | **Critical** |
| B2 | **The core promise leads to a dead end.** `config.js` has `PARTNERS = Object.freeze([])`, so every finder search, every category detail and every "nearest partners" list ends in "Partner Spot Available · Become a Partner". | Services 05 finder, 06 categories · `S2/services/1440x900/05-finder.png`, `06-categories.png`; Home 08 | A client who did what the hero asked (choose a service, choose a city) gets an empty list and a pitch aimed at professionals. That is the fastest way to lose trust: the site says it can do something, then shows it can't. | **Critical** |
| B3 | **No human anywhere.** The founder is unnamed (`[Founder name]`) and there is no photo on any page. Home scene 6 says "She" with no face. The story "The Founder / In Her Own Words." scene shows a wireframe globe inside a portrait frame with `[Founder photo]`, `[Signature]` and `[One or two sentences…]`. | Home 06 · `R5/index/1440x900/06-founder.png`; Story 03 · `R5/story/1440x900/03-founder.png`, `S2/story/390x844/03-founder.png` | People buy insurance and business coaching from a person. Research (research-audience §6, research-premium-finance §1.8 Bessemer) shows that a real portrait plus a name is the strongest trust signal in this category. An abstract globe reads as "startup with no one behind it". | **Critical** |
| B4 | **CTA sprawl.** There are about 30 distinct button labels across 5 pages: "Get My Introduction on WhatsApp", "Write Your One Message", "Send Your Message on WhatsApp", "Message Us on WhatsApp", "Ask", "Ask About Insurance on WhatsApp", "Ask on WhatsApp", "Ask Us on WhatsApp", "Book a 15-Min Fit Call", "Send an Inquiry", "Find a Partner Near You", "Find One Near You", "Check My Area and Apply", and more. Most scenes have 2–3 actions, and 1440 shots show up to 4 WhatsApp targets at once (header, in-scene, floating, plus a secondary). | All pages; e.g. `S2/services/1440x900/03-ours-strategy.png` (header WhatsApp + Book a Fit Call + Send an Inquiry + floating WhatsApp) | This audience needs one obvious next step. Many equal-weight choices slow decisions (Hick's law). Different verbs for the same action ("Get", "Write", "Send", "Message", "Ask") make people wonder whether they are different things. | **High** |
| B5 | **Placeholder proof sits in the most valuable spots.** The hero proof row reads `[n] introductions · [n] approved partners · [n] cities · ★ [rating]`. Testimonials are `"[Real client quote about the outcome]"`. The founding-partner counter reads `[n] of [2] open [live count]`. | Home 01 · `R5/index/1440x900/01-hero.png`; Home 06 quotes; Partners 05 · `S2/partners/390x844/05-founding.png` | Before launch, the client reviews a site that looks unfinished. After launch, any slot left unfilled looks fake. The design gives these slots maximum visual weight (gold, large numerals), so empty proof does more harm than having no proof. | **High** |
| B6 | **Crowded key scenes**, which is the "clogged" feeling the user describes. The services strategy scene holds an eyebrow, an H2, a 3-line paragraph, 2 meta columns, 2 buttons, a hint, a scarcity line, a compliance note, a "What You Get" list of 5 items each with a `[value]`, and a promise box. That is about 14 text blocks on one screen. Home founder has 3 offers plus 2 quotes plus an intro line. The services inquiry is a 7-field form beside a 3-row timeline, and its submit hint is cut by the bottom fade at 1440x900. | Services 03 · `S2/services/1440x900/03-ours-strategy.png`; Services 07 · `S2/services/1440x900/07-inquiry.png`; Home 06 · `R5/index/1440x900/06-founder.png`, `S1/index/390x844/06-founder.png` (Family Protection Review cut off) | Dense screens with small grey text are where readers over 40 give up (research-audience §2, §9: at most ~40–60 words, one primary action per scene). It also kills the wow, because premium sites pace one idea per screen. | **High** |
| B7 | **The home page is too long for one scene per scroll.** 12 scenes means 11 deliberate gestures to reach the close. Content repeats: "how it works" appears on home 05, services finder and services inquiry. The FAQ appears on home 11 and legal 07. Compare (04) and situations (03) make the same argument. A partner pitch (10) sits inside the client journey. | Home 01–12 | Under Round 4's one-gesture-per-scene, every extra scene is a forced stop. Visitors with a goal get impatient with scroll-jacked length (NN/g, research-audience §4). Most will never reach "Close". | **High** |
| B8 | **WhatsApp is the only working channel.** Every primary CTA, the services inquiry form and the partner application all open `wa.me`. `CONTACT_EMAIL = ''` (shown as `[company email]`), there is no `tel:` link, and there is no Messenger link. | All pages; Services 07; Partners 07 ("An email option will follow") | About half of Canadians aged 35–54 do not use WhatsApp (research-audience §7: 52%). On desktop without WhatsApp Desktop, `wa.me` shows a QR hand-off. A visitor who would rather call or email has no path, so the conversion is lost silently. | **High** |
| B9 | **No persistent CTA on phones once Round 4 lands.** Today the phone bar ("Get My Introduction", "Message Us on WhatsApp") is the only CTA always visible on a phone. Round 4 removes it and the floating button, and the header shows only the logo and "Menu". The hero's own submit button is already below the fold at 390x844. | Home 01 · `S1/index/390x844/01-hero.png` (the button is in the bar; the form's own button is off-screen) | Most traffic arrives on a phone from a Facebook or WhatsApp share. Without a thumb-reachable CTA, the visitor has to open Menu to act. This is the open owner question in build-order.md, Risk 7. | **High** |
| B10 | **The founder video scene is prime space spent on nothing.** Scene 2 of home is a dark box reading "FOUNDER VIDEO COMING SOON". | Home 02 · `R5/index/1440x900/02-video.png`, `S1/index/390x844/02-video.png` | The second impression after the hero is a missing feature. It costs one full gesture and signals that the site is unfinished. | **High** |
| B11 | **Partner content mixed into the client flow, and the reverse.** Home 10 pitches professionals. Every "Partner Spot Available" card in the client finder links to Become a Partner. On a phone, the home partner scene still shows the client bar "Get My Introduction". | Home 10 · `S1/index/390x844/10-partners.png`; Services 06 · `S2/services/1440x900/06-categories.png` | Each audience keeps seeing content for the other, which dilutes both funnels. Clients read "this is a marketplace still recruiting". Partners land on home and must scroll 9 scenes to reach their pitch. | **Medium** |
| B12 | **Story page has no next step until the end.** The hero shows "[Draft story. The founder confirms every word…]" plus "Scroll to Read". Scenes 2–5 have no CTA. Scene 6 offers "Find a Partner Near You" (the dead end in B2) before scene 7 offers WhatsApp. | Story 01–07 · `R5/story/1440x900/01-top.png`, `06-network.png` | The story page is where warm visitors decide to trust. It should end every emotional beat with a soft "Talk to [Name]". Its main secondary CTA points to the empty finder. | **Medium** |
| B13 | **Low contrast on fine print and forms.** FAQ answers are mid-grey on bone (`S1/index/390x844/11-faq.png`). Notices are about 12–13px grey with gold rules. Inquiry inputs are tan-on-gold, with field edges barely visible (`S2/services/1440x900/07-inquiry.png`). Partner tier bullets are small grey on black (`S3/partners/1440x900/04-tiers.png`). | Several | Readers in their early 40s (presbyopia) hit this first. Low-contrast inputs also hide where to tap or type. | **Medium** |
| B14 | **Fragile boot.** In 3 of 5 desktop captures at 1440x900 (index, partners, story), `shoot.mjs` reported "film not up after 4 loads; splash still present". In flow fallback, home rendered with **no header, empty service tiles and an empty map** (`S1/../ux-shots/index/1440x900/07-services.png`, `08-find.png`). Another process may have been editing `site/` at the time, so verify this. | Home 07, 08 (fallback) | If the module fails on a slow in-app browser, the visitor gets an unbranded page with empty sections and no CTA. That means zero conversion and zero trust. | **Medium** (verify) |
| B15 | **Navigation labels and weight.** There is no "Contact" item. "Become a Partner" has the same weight as consumer pages. The header also carries the Facebook icon, sound and pause buttons (the last two are removed in Round 4, which is good). The page that owns the most actions (Services) holds 8 different things. | Header, all pages | Visitors in this age group look for "Contact" by name (NN/g trust factors, research-audience §6). A partner link in primary nav tells clients this is a recruitment site. | **Low** |
| B16 | **Two-step hero form hides a WhatsApp hand-off.** The hero form card is titled "Get an Introduction", yet the button opens WhatsApp in a new tab with no confirmation state on the site. If WhatsApp is not installed, the user lands on a wa.me page and the site gives no feedback. | Home 01 | It is unclear whether "submit" worked. There is no "Didn't open? Call us / email us" fallback on home (partners has one). | **Low** |

---

## 4. What needs improvement (ranked by impact)

### 4.1 Pick one identity and say it in the first 5 seconds (fixes B1, B2, B3)
**Change:** lead with **the founder and her three services**, and present the network as "and for everything else, we introduce you". The network has no partners yet. The founder does have bookable services. Sell what exists.
- **Hero, from** "The Right Professional Near You, From One Message." **to** something like: *"Insurance, Business Strategy and a Back-Office Team, From One Person You Can Talk To."* Sub-line: *"And when you need a lawyer, a mortgage broker or an accountant, we introduce you to someone close to you, free."* Founder name and photo sit beside it.
- **Hero art, from** the abstract globe **to** a **cinematic founder portrait**: a cut-out on black with a warm gold rim light. The globe can sit behind her as a halo, and the C·W monogram can frame it. This is the Bessemer and Rothschild pattern (research-premium-finance §1.7–1.8) and the most trusted hero in the category. Until a photo exists, design the slot as a large framed `[Founder photo]` with the name in display type, not a globe. Raise the photo as the #1 founder to-do.
- **Finder:** while `PARTNERS.length === 0`, **hide the finder and the "Find a Partner" CTAs everywhere**. Replace them with a **concierge request**: "Need a lawyer, mortgage or accountant? Tell us the service and your city, and we'll find someone for you." That is one WhatsApp/inquiry CTA, which is a promise the founder can keep by hand. Turn the finder back on automatically once the config has partners (for example `FINDER_MIN_PARTNERS`).

### 4.2 Cut home from 12 scenes to 6, with one action each (fixes B6, B7, B10, B11)
Under one scene per gesture, every scene must earn its stop. Proposed film:
1. **Hero:** founder portrait, the one-sentence identity, one primary CTA "Message [Name] on WhatsApp", and a secondary "Other ways to reach us" (call / email). Proof row hidden until real (4.5).
2. **"Which One Sounds Like You?"** Promote the situations list into **three large doors**, one per founder business: *"Is my family covered?" → Family Protection Review (30 min)*; *"Where does my money go?" → 30-Day Cash-Flow Clean-Up*; *"I'm doing everything myself" → Back-Office Team*. A fourth slim line reads *"Something else? We'll introduce you."* Each door is a full-height gold/ink panel that expands on hover or tap (the wow, 4.7). One CTA per door.
3. **How It Works**, with compare folded in: three steps, plus one line "Instead of five searches, one message."
4. **The Network:** a globe-to-Canada moment (4.7). "Need someone we don't do ourselves? We introduce you to an independent professional near you." Disclosure line. A small "Are you a professional? Become a partner →" text link (this replaces home scene 10).
5. **Trust:** founder quote and signature, plus testimonials **only when real**. Without them, show the logo meaning (W for Wealth, C for Cargado) as a teaser into the story page.
6. **Close and contact:** one big CTA, plus a contact card (WhatsApp number, phone, email, service area) and the footer. FAQ moves to a "Questions?" dialog button here and stays in full on legal.

**Remove from home:** the video scene (bring it back as part of the hero, a "Watch 1 min" button, only once a video exists), the partner pitch scene, the FAQ scene, the compare scene (merged) and the services tile grid (the doors and the header cover it).

### 4.3 One CTA vocabulary across the site (fixes B4, B16)
- **Primary, clients:** "Message Us on WhatsApp" everywhere (or "Talk to [Name]" once she is named). Same label, same gold button, same position (bottom-left of the content column).
- **Secondary, clients:** "Send an Inquiry" (form), styled as a text link. Never two filled buttons in one scene.
- **Founder offers:** "Book a Free 15-Min Call" for all three (insurance, strategy, outsourcing), so they read as one service with one action.
- **Partners:** "Apply to Join" only. Delete "Apply for Community/Growth/Premier" and "Check My Area and Apply" and pre-select the tier through the link instead.
- At most **one primary action per scene**. Remove "Write Your One Message" (it scrolls back to the hero), "See the Membership Tiers →" / "How You Pay →" (the next scroll does this already), and "Back to …" buttons.
- After the WhatsApp tab opens, show an **on-site confirmation** in the scene: "WhatsApp opened in a new tab. Didn't open? Call [number] or email [address]." Partners already does this, so reuse it on home and services.

### 4.4 Persistent, thumb-reachable contact on phones (fixes B8, B9)
- Answer the open owner question (build-order Risk 7) with **yes**: put a compact gold WhatsApp icon button in the mobile header next to "Menu" (44×44). The header is already persistent, so Round 4's "no floating button" rule still holds.
- Add **`tel:` and email** as real links in the hero secondary link, the close scene and the footer. Ask the founder for the email now (`CONTACT_EMAIL` is empty). Add a Messenger `m.me` link when the Facebook page URL exists, because many in the Filipino-Canadian network prefer Messenger (research-audience §7).
- The inquiry form needs a real **email submission path**, not "An email option will follow".

### 4.5 A placeholder policy for launch (fixes B5)
- Proof stats, rating, testimonials and the founding-spot counter render **only when the config value is filled**. If not, the slot collapses and the layout reflows to a calmer composition. This needs a config flag per block and a CSS `:empty`/`hidden` pattern. Keep bracket placeholders visible in a "review mode" (`?review=1`) so the client still sees what to supply.
- Replace "[n] introductions" with a **non-numeric trust line** until real data exists: "Licensed where it matters · Based in [city], serving Canada · Member of [community]".

### 4.6 Declutter the crowded scenes using Round 4's split and dialog tools (fixes B6, B13)
- **Services strategy:** split into (a) "The 30-Day Cash-Flow Clean-Up": headline, a 2-line promise, "[2] spots in [month]", one CTA, the compliance line; and (b) "What You Get": the 5 items as a large numbered list with the promise below, and **no `[value]` column** until real prices exist.
- **Services inquiry and partner application:** use the planned stepper (3 steps, "Step 1 of 3"). Inputs get a dark fill with a 1px ivory border on gold fields (contrast ≥ 3:1 for boundaries, WCAG 1.4.11).
- **Services page order:** ours ×3 → inquiry → close. Finder and categories are hidden until there are partners (4.1). The 6-door intro grid becomes 3 doors plus "Something Else? →".
- **Notices:** set to a minimum of 15px, ivory at 75% or more on ink, and `#4A3A10` or darker on bone and gold. Keep every compliance sentence, and give it room instead of making it smaller.

### 4.7 Build the wow from 3–4 crafted moments, not many small effects
The audience reads calm, slow and expensive as modern (research-audience §1, research-awards). Spend the motion budget on:
1. **Splash → hero:** the C·W monogram draws its stroke in gold, then the iris opens on the founder portrait. The globe's points gather into a halo behind her. This replaces a generic logo and progress line (`R5/splash/1440x900/splash.png`), and must finish in 1.2s or less.
2. **The three doors:** on hover or tap, one door widens to about 60% of the width with a slow gold field fill. Its question becomes the headline and the CTA rises. The other two dim. This is tactile and clear, and it is the scene people remember.
3. **Globe → Canada:** on the network scene, the globe rotates to face North America, flattens into the dot map of Canada, and one gold arc draws from the visitor's city (when known from the hero) to a point labelled "a professional near you". This shows the promise without a finder.
4. **Logo moment** (keep `R5/story/1440x900/04-logo.png`): reuse a short version as home scene 5.
Everything else stays still while the visitor reads: no scrubbed text and no decode effect on eyebrows. Use 600–900ms ease-out.

### 4.8 Story page: lead with her, and give every beat an exit (fixes B3, B12)
- 7 → 5 scenes: **Portrait + name + one-line why** → where it began → logo → values → talk to her.
- A soft CTA on each scene ("Message [Name] →" as a text link). Remove "Scroll to Read" and the draft banner from the hero (move the draft note to review mode).
- Replace "Find a Partner Near You" on story 06 with "Tell Us What You Need" (concierge).

### 4.9 Partners page: tighten to 6 scenes and lead with the hook
- Hero: lead with the **founding offer** ("First [2] partners per service, per city: [0% commission on the first client]"). It is the most compelling, time-bound reason to act now.
- Merge "How it works" and "Pay on Clients, Not on Clicks" into one 3-step scene. Show tiers as a compact 3-column comparison with one "Apply to Join". Collapse "What we ask" into the application step 1 intro.
- The application uses the 3-step stepper: Business → Licence and Area → About and Consent.

### 4.10 Navigation
- Main nav becomes **Services · Our Story · Contact**, with "For Professionals" as a quieter text link at the right of the header (and in the footer). "Contact" goes to the close or contact scene of the current page.
- On phones, the header shows a logo, a WhatsApp icon and "Menu". The menu lists the pages plus call, email and WhatsApp.

### 4.11 Harden the boot (fixes B14)
- Verify the flow-fallback render once the other process finishes: run `node tools/shoot.mjs http://localhost:8000/ index.html --vp=1440x900` 3 times. The header, tiles, map and needs chips must render **without** the film. If any piece depends on `home.js` running, either render it at build time (the build already pre-renders the needs chips, so extend that to tiles and the header) or make the rescue nav include a WhatsApp CTA.

---

## 5. Top 8 issues (summary)

1. **B1 Critical:** the identity split. Network vs the founder's businesses vs partners, so the 5-second test fails. Lead with the founder and her 3 services, and present the network as an add-on.
2. **B2 Critical:** the finder and category lists always end in "Partner Spot Available" (`PARTNERS = []`), so the hero promise leads to a dead end. Hide the finder until partners exist and use a concierge request instead.
3. **B3 Critical:** no face, no name. The founder scene is a globe in a photo frame. Put a portrait and her name in the hero and on the story page.
4. **B4 High:** about 30 CTA labels and 2–4 competing actions per screen. Use one vocabulary and one primary action per scene.
5. **B6/B7 High:** the screens are clogged and home is 12 scenes long. Cut home to 6, split the strategy scene, step the forms.
6. **B8/B9 High:** WhatsApp is the only channel, and phones lose their only persistent CTA in Round 4. Add a header WhatsApp icon on mobile, plus `tel:` and email, and a real email path for forms.
7. **B5 High:** placeholder proof (`[n]`, `[rating]`, quote placeholders) sits in the hero. Render it only when real, and use a review mode for the client.
8. **B10 High:** home scene 2 is a "Founder video coming soon" box. Remove it until the video exists, and the hero can host a "Watch 1 min" button later.
