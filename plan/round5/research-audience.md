# Round 5 research: designing for the Cargado audience (30–45, modern but clear)

Scope: who the visitors are, what they tolerate, and what the research says about readability, motion, scroll-jacking, mobile habits, trust, click-to-chat, forms and cognitive load. It ends with 20 testable rules for this site.

Constraints honoured: the black and gold palette, Times New Roman Title Case display type, Manrope body and Poppins UI all stay. Compliance copy stays. Round 4 decisions stand: one screen per section, one gesture moves one section, and the HUD counter, floating WhatsApp, phone bar, sound and pause toggles and decorative dashes are removed. Where research points against a Round 4 decision, this document gives a mitigation and does not reverse the decision.

---

## 1. Who the visitor is

- **Age 30–45.** These are Canadian parents, small-business owners and newcomers. Many are Filipino-Canadian and part of a faith-based network. The founder's own network is the first traffic source, so most visits start from a link shared in a chat app or on Facebook, and most will be on a phone.
- **They come with a job to do.** They want to know whether this person can help with insurance, a business plan or outsourcing, whether they can trust them, and how to make contact. NN/g found that people with a goal are the least patient with unusual scrolling: "if I were looking at this as a prospect, I would get severely agitated and just move on" ([NN/g, Scrolljacking 101](https://www.nngroup.com/articles/scrolljacking-101/)).
- **Their eyes are starting to change.** Presbyopia (harder near focus) usually shows up after 40. First symptoms are reported at about 42–44 on average, and some adults notice it before 40 ([EyeWiki, Presbyopia](https://eyewiki.org/Presbyopia); [Wikipedia summary](https://en.wikipedia.org/wiki/Presbyopia)). The upper half of this audience is reading on phones at arm's length, often at night with the screen dimmed. Small grey text on black is the first thing to fail them.
- **Motion sensitivity is common.** A Johns Hopkins analysis of NHANES data found vestibular dysfunction in 35.4% of US adults aged 40+, and 18.5% of people in their 40s ([Agrawal et al. 2009, PubMed 19468085](https://pubmed.ncbi.nlm.nih.gov/19468085)). This was measured with a balance test, not a diagnosis, but it shows that motion-triggered discomfort is not a niche problem for this age group.
- **Language.** Many visitors have English as a second language. NN/g's carousel work notes that fast-moving content hurts "international customers who don't read your language well" (summarised in [Yale Usability, Hero Images/Carousels](https://usability.yale.edu/usability-best-practices/hero-imagescarousels)). Plain words and text that holds still help them most.

**What "modern" means to this group:** confident, calm and expensive-feeling. Large type, generous space, rich materials (the gold), and a few moments of motion that look intentional. Constant movement, novelty controls or a hunt for the contact button will not read as modern to them. The wow should come from **composition and a handful of crafted transitions**, not from many small animations.

---

## 2. Readability

| Topic | What the evidence says | Implication for Cargado |
|---|---|---|
| Contrast | WCAG 2.2 SC 1.4.3 (AA): at least 4.5:1 for body text and 3:1 for large text (24px, or 18.66px bold). SC 1.4.11: at least 3:1 for UI component boundaries and focus indicators ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)). | Ivory `#F3ECDD` on `#0B0B0C` easily passes. Gold `#D4AF37` on black is about 9:1 and passes. On the bone field, gold text must use `#7A5C12` (PLAN already says so). The risk is **dimmed ivory** (opacity 0.5–0.6 for "muted" copy). Keep muted text at 4.5:1 or above, so no lower than about 60% ivory on black. Check every value. |
| Body size | No WCAG minimum size, but SC 1.4.4 Resize Text requires 200% zoom with no loss of content or function. For readers in their 40s, 16px is the floor, and 17–18px reads better on a dark field (light text on dark looks thinner). | Body at least 17px on mobile and 18px on desktop. Captions and legal text no smaller than 14px, and 15px is better. Do not set body text in a weight below 400. Manrope at 300 on black will look grey and fuzzy. |
| Line length | The usual typographic guidance is 45–75 characters, and about 60–66 is ideal. PLAN already uses 55–70ch. | Keep `max-width: 62ch` for paragraphs. On a one-screen layout, use two short columns or a card grid rather than wide lines of text. |
| Line height | WCAG 2.2 SC 1.4.12 Text Spacing: content must survive 1.5 line height, 2× paragraph spacing, 0.12em letter spacing and 0.16em word spacing applied by the user. | Use 1.55–1.65 for body text. **Round 4 conflict:** fitting text tightly into one screen breaks when users apply these text-spacing overrides. Give each scene vertical slack and let the fluid scale shrink display type, not body type. |
| Reflow | SC 1.4.10: no 2-D scrolling at 320 CSS px wide, which is what 400% zoom produces. | When zoomed, the one-screen film has to fall back to flow mode. Treat "zoom ≥ 200% or width ≤ 360" like reduced motion and switch to normal stacked sections. |
| Display face | Times New Roman is a text serif. At large sizes it looks classic, and at small sizes on dark backgrounds its hairlines break up. | Use Times only at 28px and above. Never use it for buttons, labels or anything below 20px. Use Poppins or Manrope there. |
| Title Case | Title Case adds noise when used on long sentences. | Keep Title Case on headings of up to about 8 words (the brand rule). Use sentence case for body, buttons and helper text. If Title Case on buttons is non-negotiable, keep button labels to 1–3 words. |

---

## 3. Motion and vestibular safety

- **WCAG 2.2 SC 2.3.3 Animation from Interactions (AAA)** says motion triggered by interaction, explicitly including parallax and other movement added to scrolling, must be possible to switch off unless it is essential. Sufficient techniques are C39/SCR40 (`prefers-reduced-motion`) and a user-facing setting ([Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)). Scrolling itself is allowed, and the effects layered on top are the problem.
- **SC 2.2.2 Pause, Stop, Hide (A):** anything that moves on its own for more than 5 seconds needs a pause control. That applies to the star field, the grain, an auto-rotating 3D object and auto-advancing carousels. **Round 4 removed the Pause toggle.** That is compliant only if (a) every auto-motion stops under `prefers-reduced-motion`, and (b) no essential content moves on its own. Ambient decoration counts. The safe options are to make the stars and grain near-static (barely perceptible drift, under about 5s of continuous motion before settling), or to provide an accessible motion off switch in the footer or a settings dialog instead of the header. Recommendation: put a "Reduce motion" switch in the footer. It costs no header space and satisfies 2.2.2 and 2.3.3.
- **SC 2.3.1:** nothing may flash more than 3 times a second. Watch the splash and the gold "flare" transitions.
- **What triggers vestibular symptoms most:** large-area movement that does not match the user's input (parallax at different speeds, zooms, spinning or rotation, full-field scaling), plus anything that keeps moving after the hand stops (momentum). Iris reveals that cover the whole screen and scroll-scrubbed 3D rotation are the high-risk items on this site.
- **Practical limits:** transitions 300–700ms with an ease-out. Fade and short translation (≤ 40px) are safe, so scale, zoom and blur should be kept small. No continuous rotation of the 3D object while text is being read. Let it come to rest on each scene's hold point.

---

## 4. Scroll-jacking: the frustrations and how good sites reduce them

NN/g's Scrolljacking 101 study ([link](https://www.nngroup.com/articles/scrolljacking-101/)) found:

1. Most participants were at least mildly disoriented, and some refreshed the page or left.
2. Long scrolljacks were worse, and some people thought the page was broken.
3. They were tolerated when they **progressively revealed useful information**.
4. Changing scroll rate or direction **while people must read text** was the worst combination.
5. People who escaped did so through a **visible sticky navigation**.
6. Mobile is worse, and NN/g recommends avoiding scrolljacking on mobile in most cases.
7. Horizontal motion triggered by a vertical gesture confused people.

Web Designer Depot's summary adds that scrolljacking often breaks with assistive tech and on older hardware, and it penalises people who skim ([How Scrolljacking Breaks UX Fundamentals](https://webdesignerdepot.com/how-scrolljacking-breaks-ux-fundamentals/)). Alvaro Trigo, author of fullPage.js and the canonical "one section per screen" library, describes the same trade-off ([What is scroll hijacking](https://alvarotrigo.com/blog/what-is-scroll-hijacking/)).

**Round 4's "one gesture = one section" is a form of scrolljacking.** It fits the "progressively reveals" case NN/g says is tolerated, but only if these mitigations are built in:

- **Text never moves while it is being read.** Every scene settles completely, and the transition finishes before text is legible. No scrubbed text.
- **Fast and predictable.** One gesture leads to a settled next section in at most about 700ms. The section never skips two, and never goes nowhere on a deliberate flick.
- **A visible way out at all times:** a persistent header with the real page links and a primary CTA ("Book a Call" / "Contact"). NN/g found that visible nav is how users rescue themselves.
- **A progress cue.** The numeric HUD is gone, which is decided. A quiet replacement that is not a dash or counter still helps disorientation: a vertical stack of small dots or section names on the right edge on desktop (clickable, `aria-current`). It doubles as skip-to-section navigation. If even that is unwanted, the header must at least highlight the current page, and the last scene must look clearly like an ending (the footer).
- **A "next" affordance** on the first scene: a labelled "Scroll" or "Next" button that also works as a button, so people who do not know that the page moves on scroll still progress.
- **Keyboard parity:** ArrowDown/PageDown/Space go forward, Up/PageUp/Shift+Space go back, and Home/End go to the ends (already in the Round 4 plan). Tab must move focus into the next scene, and focusing an element in another scene must snap to that scene.
- **Touch devices:** use **native CSS `scroll-snap-type: y mandatory`** rather than JS-driven glides. It gives the same "one screen per swipe" result with the OS's own physics. This follows NN/g's mobile warning without dropping the one-screen design.
- **Respect the escape hatches:** reduced motion, 200% zoom or more, short landscape screens, and screen readers all get plain flow scrolling.
- **Deep links and the Back button work.** Each scene has an id and the URL hash updates with `history.replaceState`, so a link shared in WhatsApp opens on the right section.

---

## 5. Mobile-first habits

- The first visit nearly always comes from a link shared in a chat app or social feed, which opens in an **in-app browser** (Facebook, Messenger, WhatsApp, Instagram). These have extra toolbars and unpredictable `vh`, and they are often slow. Use `svh`/`dvh`, test inside the Facebook in-app browser, and keep the first paint light.
- **Thumb zone:** primary actions go in the lower half of the screen on phones. The top-right corner is the hardest to reach.
- **Targets:** WCAG 2.2 SC 2.5.8 sets a 24×24 CSS px minimum (AA) ([Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)). SC 2.5.5 (AAA) sets 44×44, and Apple's HIG says the same. Use 44×44 for every button and nav link, with 8px or more between targets.
- **Navigation:** NN/g's hamburger study (179 participants) found hidden navigation was used in 27% of desktop cases versus 48–50% for visible navigation, desktop tasks took at least 39% longer, and content discoverability fell by more than 20%. On mobile, if there are 4 or fewer top-level links, show them ([NN/g, Hamburger Menus](https://www.nngroup.com/articles/hamburger-menus/)). Cargado has 4 content pages plus legal, so **show the links on desktop**, and on mobile show at least the CTA plus a clearly labelled "Menu" (word plus icon).
- **Speed is part of the wow.** Core Web Vitals "good" thresholds at the 75th percentile are LCP ≤ 2.5s, INP ≤ 200ms and CLS ≤ 0.1 ([web.dev, Web Vitals](https://web.dev/articles/vitals)). three.js plus GSAP plus Lenis plus fonts plus a splash is heavy for a mid-range Android phone on LTE. Lazy-load three.js after first paint, cap the splash at 1.2s, and never block the LCP text behind it.
- **SC 2.5.7 Dragging Movements (AA, new in 2.2):** any drag (3D orbit, map pan, carousel swipe) needs a single-pointer alternative such as buttons.

---

## 6. Trust and credibility

NN/g's four trust factors still hold in their later studies: **design quality, up-front disclosure, comprehensive and current content, and connection to the rest of the web** ([NN/g, Trustworthiness in Web Design](https://www.nngroup.com/articles/trustworthy-design/)). NN/g also notes that clever or vague navigation labels lower trust because people cannot tell whether what they need exists.

What that means for a referral network selling insurance and business services to families:

- **A face and a name.** The founder's photo, real name and short story, plus licence and registration lines where they apply. Insurance buyers check these. Keep the [placeholder] brackets until real numbers exist, but give them a visible, designed slot.
- **Disclosure up front.** The commission and independence notice is a *trust asset*, not fine print. Show it as a calm, readable statement near the CTA, not as 12px grey text.
- **Plain navigation labels:** "Services", "Our Story", "Become a Partner", "Contact". Avoid clever labels.
- **Proof.** Testimonials with first name, city and the service used (only real ones, never invented). Partner logos or names. Community and church connections, if the founder is happy to show them. The number of families or businesses helped, only when it is real.
- **Contact transparency.** Show a phone number, email, WhatsApp and service area (for example, "Serving Ontario" with the [city]) on every page in the footer. A real business looks reachable.
- **Fit and finish signal competence.** Broken alignment, inconsistent spacing or a janky transition cost more trust with a 40-year-old prospect than a plain but tidy page would.
- **No dark patterns.** No fake countdowns, no "only 2 spots left" unless true, and no pre-ticked consent boxes.

---

## 7. WhatsApp and click-to-chat in Canada

- A Research Co. survey (July 2022) found that **45% of Canadians use WhatsApp: 68% of ages 18–34, 52% of ages 35–54 and 28% of 55+** ([Business in Vancouver, Survey: What's WhatsApp use in Canada](https://biv.com/article/2022/07/survey-whats-whatsapp-use-canada)). Newer figures are behind Statista's paywall ([Statista forecast](https://www.statista.com/forecasts/1146317/whatsapp-users-in-canada/)), and a 2025 compilation puts penetration at about 42% ([Sociallyin](https://sociallyin.com/?p=12769)). So **about half of the core 35–54 group uses WhatsApp, and the other half does not.**
- In the Philippines, Facebook Messenger dominates. Deloitte found that 94% of IM users there used Messenger ([WARC](https://www.warc.com/newsandopinion/news/filipinos-stick-with-sms/en-gb/36263)), and website chat embeds there are about 64% Messenger, 16% WhatsApp and 12% Viber ([wmtips](https://www.wmtips.com/technologies/instant-messaging/country/ph/)). No Filipino-Canadian data was found. This is a proxy only, but it suggests many in the founder's network may prefer **Messenger or Viber**.
- **Recommendation:** WhatsApp is a good primary chat CTA. It must not be the only route. Offer WhatsApp, a phone call (`tel:`), email and the form side by side, and consider Messenger (`m.me/<page>`) when the founder has a Facebook page.
- **Click-to-chat practice:** use `https://wa.me/<number>?text=<prefilled>` with a short, editable pre-filled message that names the service ("Hi, I'm interested in insurance strategy…"). Label the button with what happens: "Chat on WhatsApp". On desktop, WhatsApp opens WhatsApp Web or the desktop app. Say so, or show the number alongside it. Round 4 removed the *floating* button, so place the WhatsApp CTA in the header CTA area on mobile, in each service's closing scene and in the footer.
- **Privacy:** sending the form's summary through WhatsApp hands personal data to Meta. Say this in one line next to the button, and keep the email or form path available for people who would rather not.

---

## 8. Forms (Baymard, NN/g)

- **Field count matters more than step count.** Baymard's 2024 checkout benchmark found an average of 11.3 fields when most sites need only 8 ([Baymard, Checkout Flow Average Form Fields](https://baymard.com/blog/Checkout-flow-average-form-fields)). For an inquiry, the minimum is name, phone or email (one required, user's choice), service of interest, a short message and preferred contact method. Make everything else optional or remove it.
- **Inline validation:** validate when the user leaves a field or finishes typing a full value. **Never validate prematurely**, for example when a field is focused or after the first keystroke. Remove the error as soon as the field is fixed. In Baymard's 2024 study, 31% of sites had no inline validation at all ([Baymard, Inline Form Validation](https://baymard.com/blog/inline-form-validation)).
- **Labels:** always show visible labels above fields, and never rely on placeholder-only labels in forms of 3 or more fields ([Baymard, Mobile Forms: Avoid Inline Labels](https://baymard.com/blog/mobile-forms-avoid-inline-labels)). Placeholders disappear and have poor contrast.
- **Steppers (Round 4):** steps work well when each step is one clear topic. Show "Step 2 of 3" with step names, keep Back available, save what was typed when going back, move focus to the step heading and announce it with `aria-live`. Validate each step before Next.
- **WCAG 2.2 additions:** SC 3.3.7 Redundant Entry (A) means you do not ask for the same information twice across steps. SC 3.3.8 Accessible Authentication (AA) does not apply because there is no login. SC 3.3.1/3.3.3 require errors in text that say how to fix them ("Enter a phone number with area code, e.g. 416 555 0123"). Do not show errors by colour alone, so add an icon plus text.
- **Input types and autocomplete:** `type="tel"` and `type="email"`, plus `autocomplete="name"`, `tel`, `email` and `postal-code` (SC 1.3.5 Identify Input Purpose, AA). Mobile keyboards and autofill save this audience the most effort.
- **Accept any reasonable format.** Do not reject phone numbers containing spaces, dashes or +1. Use a Canadian postal code pattern that tolerates lowercase letters and a missing space.
- **After submit:** show a clear confirmation in the same scene ("Thanks, [Founder] will reply within 1 business day"), with what happens next and an alternative contact.

---

## 9. Cognitive load

- One idea per screen fits Round 4 well. Use it: **one heading, at most about 40–60 words of body text, one primary action and at most one secondary action per scene.**
- **Use progressive disclosure, not compression.** Detail goes in a dialog or panel ("See What's Included"), not in smaller type.
- **Avoid auto-advancing carousels.** NN/g's research showed users missed offers in rotating carousels, even the first slide, and rotation hurts slower readers and people with motor difficulties ([Yale Usability summary](https://usability.yale.edu/usability-best-practices/hero-imagescarousels); [Texas A&M, Avoid Automatic Forwarding Content](https://web.tamu.edu/?p=1845)). Manual carousels with visible "1 of 4", arrows and swipe are acceptable. A grid is better where the content fits.
- **Keep patterns consistent.** The same button styles, the same CTA wording ("Book a Free Call" everywhere, not three variants), and the same position for the primary action on every scene.
- **Recognition over recall.** The service names, prices and steps a user has seen should reappear on the form step where they choose a service. Do not make them remember them.
- **Sound.** SFX stay on by default (Round 4). Unexpected audio is a well-known irritant for people browsing at work or in church or family settings. Keep SFX very quiet. Never play them before the first user gesture (browsers block that anyway). Never use them as the only feedback. Note that SC 1.4.2 Audio Control applies only to audio longer than 3 seconds, so short SFX pass. Still, the footer motion switch could add "Sounds off" at no extra cost.

---

## 10. Checklist: 20 concrete, testable rules for cargadostrategies

Each rule has a pass condition that can be checked with a script, an audit or a quick manual test.

1. **Body text ≥ 17px on phone widths (≤ 480px) and ≥ 18px at ≥ 1024px.** No text node used for reading is below 14px, including legal and compliance copy. *Test: computed `font-size` scan of all visible text at 390 and 1440 widths.*
2. **Contrast of every text node ≥ 4.5:1** (≥ 3:1 for text 24px and up), including dimmed or muted ivory and gold on bone. *Test: axe-core / Lighthouse color-contrast = 0 violations on all 5 pages, plus a manual check of opacity-dimmed text.*
3. **Paragraph measure ≤ 70ch and line-height ≥ 1.5.** *Test: computed `max-width` / `line-height` on all `p`.*
4. **Times New Roman only at ≥ 28px.** Buttons, labels, nav and form text use Poppins or Manrope. *Test: scan computed `font-family` against `font-size`.*
5. **Each scene has one H2 (H1 on the first), body copy ≤ 60 words and ≤ 2 actions.** *Test: word count per `section.scene` excluding compliance notices, which are exempt but must stay visible.*
6. **Text-spacing override survives:** with SC 1.4.12 values injected (line-height 1.5, paragraph spacing 2em, letter 0.12em, word 0.16em), no text is clipped or overlapped in any scene at 1366×768. *Test: inject the bookmarklet CSS and run fit-audit.*
7. **At 200% zoom or a 320px width, the site is in flow mode** with no horizontal scroll and nothing lost. *Test: fit-audit at 320×640 and browser zoom 200% at 1280×720.*
8. **`prefers-reduced-motion: reduce` turns off** stars motion, grain animation, iris, 3D rotation, parallax, magnetic or tilt effects and the snap glide (native scroll-snap only). *Test: emulate in DevTools, record 5s, and verify no transform animations run.*
9. **A user-facing "Reduce Motion" switch exists** (footer). It persists in `localStorage` and does the same as rule 8. Nothing decorative moves on its own for more than 5s while it is on (SC 2.2.2). *Test: toggle, reload, and check no running animations.*
10. **One gesture moves exactly one scene and settles in ≤ 700ms.** It never skips 2 scenes on a trackpad fling and never strands the page between scenes. *Test: scripted wheel bursts (1, 5, 30 events) and swipe; assert the final scene index is ±1 and the settle time.*
11. **No text moves while readable.** Scene text is static from the moment its opacity reaches 1 until the next transition begins. *Test: sample text element transforms during a hold, expecting delta 0.*
12. **Touch devices (pointer: coarse) use native CSS scroll-snap**, not a JS-driven glide. *Test: emulate a mobile device and assert Lenis is not instantiated and `scroll-snap-type` is set.*
13. **A visible header with page links and one primary CTA is on screen in every scene.** Desktop shows all page links. Mobile shows the CTA plus a labelled "Menu". *Test: screenshot each scene at 1440 and 390.*
14. **A progress or position cue exists that is not a counter or dash** (clickable section dots or names with `aria-current`, desktop at least). The first scene has a visible "Next" button that advances. *Test: click the dot and the Next button, check the scene changes and the hash updates.*
15. **Keyboard parity:** Tab reaches every control in visual order. Focusing an element in another scene brings that scene into view. Arrow/Page/Space/Home/End navigate. A visible focus ring with ≥ 3:1 contrast is never hidden under the header (SC 2.4.11). *Test: a keyboard-only pass on all pages.*
16. **Every scene has an id, the URL hash updates on settle, and a cold load of `page.html#scene` opens on that scene.** *Test: open 3 deep links, check the scene and that Back works.*
17. **All interactive targets ≥ 44×44 CSS px with ≥ 8px between them.** Every drag interaction has a button alternative (SC 2.5.7). *Test: bounding box scan of `a, button, input, select, [role=button]`.*
18. **Core Web Vitals on a throttled mobile profile (Moto G Power / Slow 4G in Lighthouse):** LCP ≤ 2.5s, CLS ≤ 0.1 and TBT ≤ 200ms. Splash ≤ 1.2s, and three.js loads after first paint. *Test: Lighthouse mobile run on each page.*
19. **Contact choice:** every page footer and each service's closing scene shows WhatsApp (`wa.me` with a prefilled, service-specific message), phone (`tel:`), email and the form, with a one-line note on what WhatsApp shares. *Test: grep each page for all four, then tap each on a phone.*
20. **Forms:** at most 6 fields in the inquiry and visible labels above every field (no placeholder-only labels). Validation runs on blur or on full value only, never on focus. Errors are text plus an icon with fix instructions. `type` and `autocomplete` are set (name, tel, email, postal-code). Steppers show "Step X of N", keep entered values when going Back, and move focus to the step heading with an `aria-live` announcement. *Test: fill each form with bad then good data by keyboard and screen reader, and check that the errors clear immediately when the data is fixed.*

---

### Sources

- NN/g, [Scrolljacking 101](https://www.nngroup.com/articles/scrolljacking-101/)
- NN/g, [Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/hamburger-menus/)
- NN/g, [Trustworthiness in Web Design: 4 Credibility Factors](https://www.nngroup.com/articles/trustworthy-design/); [E-commerce UX: Trust and Credibility report](https://www.nngroup.com/reports/ecommerce-ux-trust-and-credibility/)
- Baymard, [Checkout Flow Average Form Fields](https://baymard.com/blog/Checkout-flow-average-form-fields); [Inline Form Validation](https://baymard.com/blog/inline-form-validation); [Mobile Forms: Avoid Inline Labels](https://baymard.com/blog/mobile-forms-avoid-inline-labels)
- W3C, [WCAG 2.2](https://www.w3.org/TR/WCAG22/); [Understanding 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html); [Understanding 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- Google web.dev, [Web Vitals](https://web.dev/articles/vitals)
- Agrawal et al. 2009, vestibular dysfunction prevalence, [PubMed 19468085](https://pubmed.ncbi.nlm.nih.gov/19468085)
- [EyeWiki, Presbyopia](https://eyewiki.org/Presbyopia); [Wikipedia, Presbyopia](https://en.wikipedia.org/wiki/Presbyopia)
- Research Co. via [Business in Vancouver (2022)](https://biv.com/article/2022/07/survey-whats-whatsapp-use-canada); [Statista, WhatsApp users in Canada](https://www.statista.com/forecasts/1146317/whatsapp-users-in-canada/); [Sociallyin WhatsApp statistics](https://sociallyin.com/?p=12769)
- [WARC, Filipinos stick with SMS (Deloitte)](https://www.warc.com/newsandopinion/news/filipinos-stick-with-sms/en-gb/36263); [wmtips, IM in the Philippines](https://www.wmtips.com/technologies/instant-messaging/country/ph/)
- [Yale Usability, Hero Images/Carousels](https://usability.yale.edu/usability-best-practices/hero-imagescarousels); [Texas A&M, Avoid Automatic Forwarding Content](https://web.tamu.edu/?p=1845)
- [Web Designer Depot, How Scrolljacking Breaks UX Fundamentals](https://webdesignerdepot.com/how-scrolljacking-breaks-ux-fundamentals/); [Alvaro Trigo, What is scroll hijacking](https://alvarotrigo.com/blog/what-is-scroll-hijacking/)

Caveats: the WhatsApp figures for Canada are from 2022, and the Filipino messaging data is from the Philippines, not Canada. The vestibular prevalence figure is from US data measured with a balance test. Some Baymard figures were read through Baymard's own summaries, not the full paywalled study.
