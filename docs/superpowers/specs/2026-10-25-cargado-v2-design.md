# Cargado Strategies site, version 2: design

Date: 2026-10-25. Owner answers collected in chat on this date. This document is the single description to plan and build from. Where it says **(builder's call)** the builder decides; where it says **(my call)** the agent writing this chose it and the owner can still overrule.

## 1. Intent

The owner wants the site to feel more personal and trustworthy, less "AI generated", while keeping the scroll-film flow that already works. At the same time the business has grown: Cargado Strategies now does more of its own work (web design, graphics, virtual assistance, software, export and import, contracting), wants visitors to book a short free consultation straight into the owner's Google Calendar, and wants accounts with a points programme, a partner dashboard and an admin dashboard. Everything ships together in one release (the owner asked for "everything at once").

Success looks like: a visitor on a mid-range phone can see every service around the Cargado mark, tap one to read about it, and book a 5-10 minute Google Meet consultation in a few taps without logging in; a signed-in client sees points go up automatically; an approved partner sees their referrals; the owner manages it all from an admin dashboard. Until the owner supplies Google and Firebase credentials, everything still builds, passes the gates and degrades gracefully (see §9).

## 2. Goals

1. Add seven services that Cargado Strategies delivers itself.
2. Add a Contact page (in the nav) with booking and the contact details.
3. Booking against Google Calendar, weekdays and weekends 3:30 pm to 9:00 pm Central.
4. A touch of deep navy in backgrounds, for trust, without changing the flow.
5. A "services orbit": the animated Cargado mark in the centre, the main service groups in circles around it, hover previews, click to detail. First scene of Services, and also on Home.
6. The real logo mark in the header (navbar) only.
7. Login and sign-up (email/password and Google), a client dashboard with points, a partner dashboard, an admin dashboard. Firebase, prepared but not yet connected.
8. All site copy in the third person, naming "Cargado Strategies" (not "Lee", not "we").

## 3. Non-goals

- No prices anywhere for the new services: visitors book first and get a price in the meeting (owner).
- No paid booking, no deposits, no Zoom API integration (see §6.4).
- No redesign of the scroll-film engine, scene order logic or page flow. The background changes; the flow stays (owner).
- No invented content: no fake testimonials, stats, partners, photos or service details. Unknown facts stay `<span class="ph">[bracket]</span>` per the existing rule.
- Points cannot yet be spent (owner: balance and history only for now).

## 4. Anti-goals (would be a failure even if it "works")

- Blue that reads as a colour scheme change: blue buttons, blue text, blue links, or anything that makes the site look like the reference photo's stock template. Navy is a background atmosphere only.
- A site that looks more generic: stock-photo skylines, silhouettes of men in suits, icon grids. The reference photo is used for its navy mood only.
- Booking that silently loses a request when Google is not connected yet.
- Secrets in the public repo (the repo is public).
- Phone performance regressions from pulling Firebase into every page.

## 5. Constraints (from the repo; still binding unless changed below)

- Static site in `site/`, built by `build.mjs` to `dist/`, deployed on Vercel from `main`. Serverless functions live in `api/` (today only `api/inquiry.js`, which sends mail via Resend's REST API with `fetch`).
- Scroll film: one scroll = one scene, every scene fits one screen at all 9 contract viewports in cut, touch and flow (`tools/fit-audit.mjs`). Budgets per scene: ≤ 60 words, ≤ 12 elements, ≤ 3 groups. 14 px text floor, 44 px tap targets, works from 360 px.
- Display type Times New Roman stack in Title Case written in markup; Manrope body; Poppins labels.
- Animate only transform, opacity, clip-path. No `console.log`. Plain ES modules, small functions, named constants, match surrounding style.
- No new npm dependencies (my call to keep: Firebase client loads from the official ES module CDN on the pages that need it; server code uses Node built-ins and REST APIs, as `api/inquiry.js` already does).
- Owner content only in `site/assets/js/config.js`.
- Gates in `CLAUDE.md` ("Gates before calling work done") still apply, with the changes in §10.

### Rule changes the owner approved today (update CLAUDE.md, AGENTS.md, memory)

- **Colour:** "black and gold, plus a deep navy used only in backgrounds (never buttons, text, links or icons)". Replace "no blue anywhere" everywhere it appears, including the grep gate.
- **Compliance copy:** the owner approved rewriting the locked notices, legal text and FAQ answers into the third person. The compliance baseline is regenerated from the new copy, and the gate keeps protecting the new wording word for word afterwards. The Legal page still needs a Canadian lawyer's review before launch (existing note, now more important).
- **Nav:** gains "Contact". Login/account entry is added to the header (see §8.1).

## 6. The parts

### 6.1 New services

All seven are delivered by Cargado Strategies itself (category `ownership: 'founder'` in config), shown under "Ours", never as partner categories:

| Main group | Items |
|---|---|
| Web Design | (single service) |
| Graphics | (single service; separate from Virtual Assistant, per owner) |
| Virtual Assistant | (single service) |
| Software Development | (single service) |
| Export and Import | (single service) |
| Contractor | Homecare Cleaning Services, Roofing, Cleaning, Gardening (four items, owner chose this flat list) |

- No prices. Each has a short description that is a `[bracket]` placeholder until the owner sends real text (never invent). A one-line hover preview per group is also a bracket placeholder unless the description already exists. **(my call:** existing groups keep their current copy.)
- Each new service needs a detail destination (see §6.3), a config entry, a slug that does not equal any scene id, `FOUNDER_OFFERS` / `FOUNDER_LINES` entries as the services CLAUDE.md requires, and appearance in the inquiry form's category select and the WhatsApp request lines.
- Their call to action is "Book a Free Consultation" (to Contact with the service preselected), plus the existing WhatsApp sheet.

### 6.1b Insurance inquiries go to the policy review site

- Owner (2026-10-25): an insurance inquiry redirects to the founder's policy review site, `https://policyreview.leeholgado.com/`.
- Store it once in config as `INSURANCE_INQUIRY_URL` (never hardcoded in sections). **(my call)** Store the clean link: drop `fbclid` (a Facebook click ID from the owner's own click) and `sessionId` (one browser session's ID, which would make every visitor share it). Ship the plain base URL; `trigger_link=wJ4vozXpWo653Q0725iN` can be appended in config if the owner confirms it is their attribution code.
- Where it applies: the Insurance circle in the orbit, the "Ask About Insurance" CTA on `ours-insurance`, choosing "Insurance" in the inquiry form, and insurance in the categories dialog. Each opens the link in a new tab (`target="_blank" rel="noopener"`), with a visible "opens the policy review site" hint so the visitor is not surprised. The free consultation booking and WhatsApp stay available as alternatives.
- If `INSURANCE_INQUIRY_URL` is empty, those CTAs fall back to today's behaviour.

### 6.2 Navy background

- Add tokens to `site/core/design/base.css` (e.g. `--navy-deep`, `--navy-glow`), used only inside the `ink` field background: a deep navy wash or radial glow behind the existing black, like the reference photo's mood. Bone and gold fields are unchanged.
- No navy on any foreground element. Contrast ratios for gold and bone text on the new background must stay at or above today's.
- Same on every page that uses ink fields, including the new pages. Legal stays calm (it is bone).
- **(builder's call):** exact hue and gradient shape; keep it subtle enough that the site still reads "black and gold".

### 6.3 Services orbit

- A new scene: the Cargado mark (the C and W draw from the Story page's `logo` scene, `sections/story/logo/Logo.js` and its SVG) in a central circle, with the **main groups** in circles around it, after the owner's sketch (centre circle, about nine to ten circles around it).
- Main groups (my call, from the owner's "only the main groups"): Insurance, Business Strategy, Outsourcing, Web Design, Graphics, Virtual Assistant, Software Development, Export and Import, Contractor, and one "Partner Network" circle for the six partner categories. Ten circles.
- **Hover** (pointer devices) or **focus** shows a preview card: name and the one-line description. **Click/tap** goes to that group's detail. On touch, first tap previews and a second tap (or the preview's link) goes; **(builder's call)** the exact touch pattern, as long as it is obvious and 44 px safe.
- Placement: the **first scene of `services.html`** (it replaces the role of today's S1 `intro`, which listed the services as rows), and **also a scene on Home** (my call: right after the hero).
- The centre animation is a reuse, not a copy: move the C/W mark draw into a shared module under `site/core/` so Story, Services and Home all use one implementation. Story's behaviour must stay identical (seek-test clean).
- Detail destinations: existing groups go where they go today (the `ours-*` scenes, the finder). New groups get detail scenes on `services.html` with deep links (`services.html#web-design` etc.). **(builder's call)** whether the four Contractor items share one scene or a paged/accordion scene; they must each fit one screen.
- Phone (360 to 759 px): ten circles round a centre will not fit legibly as a ring; **(builder's call)** a smaller ring, an arc, or a grid that keeps the "centre and satellites" idea, provided every tap target is ≥ 44 px and every label ≥ 14 px.

### 6.4 Contact page and booking

- New page `contact.html` in the nav ("Contact"), built as a scroll-film page like the others (shell, sections, `pages/contact.js|css`, added to `PAGES` in `build.mjs` and `tools/lib/cdp.mjs`). Scenes **(my call)**: booking, then direct contact (WhatsApp, email, address, Facebook, read from config), then credits.
- **What is booked:** one kind of meeting only, a free consultation, 10 minutes long (owner said 5-10; my call: book 10-minute slots).
- **Availability:** every day of the week, 3:30 pm to 9:00 pm in `America/Winnipeg` time, so the last slot starts at 8:50 pm. Shown to the visitor in Central time, labelled as such. Slots that are busy in the owner's Google Calendar (free/busy) or already in the past are not offered.
- **Visitor flow:** pick a date, pick a time, enter name, email, phone (optional), the service it is about (optional, preselected when arriving from a service), a short note, consent checkbox. No login required. If a signed-in client books, the booking is linked to their account (for points).
- **Meeting link:** Google Meet, created automatically with the calendar event (my call: Zoom needs a separate paid API integration; Meet comes free with Google Calendar).
- **Confirmation:** both the visitor and the owner get an email (via the existing Resend setup) with date, time in Central, and the Meet link. The calendar event also invites the visitor.
- **Server:** two Vercel functions: `api/slots` (free slots for a date range) and `api/book` (re-checks the slot is free, creates the event with a Meet link, sends both emails, records the booking for points when Firebase is connected). Google access uses an OAuth refresh token for the owner's own Google account (works with a personal Gmail and with Meet), stored only in Vercel environment variables.
- **Abuse protection:** server-side validation, a honeypot field, and a simple per-IP rate limit **(builder's call on mechanism)**; also reject bookings more than N days ahead **(my call: 60 days)**.
- **Before Google is connected:** the date and time picker still shows the 3:30-9:00 pm slots (computed locally), and submitting sends the request to the owner by email through the existing inquiry path with the chosen time, telling the visitor the time will be confirmed by email. Nothing is lost.

### 6.5 Logo in the header

- Use the owner's logo mark (the C, W, "24" and arrow, from the attached image) in the header only. Footer, splash and favicon stay as they are.
- The owner asked us to crop it ourselves: crop the mark from the supplied image (no wordmark), remove the black background to transparency, export a crisp PNG at 2x and 3x header height (and WebP), with `alt="Cargado Strategies"`. Keep the text "Cargado Strategies" beside it if the header currently shows the name **(builder's call)**.
- The owner's image is at `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\f226b957-7fce-4c1a-8257-ead8d59eee4b\images\5.png`; copy it into the repo under `site/assets/img/` as the source before processing.

### 6.7 Founder photos

The owner supplied three real photos of the founder, Lee Holgado (2026-10-25). The site already has hidden founder-photo slots driven by `FOUNDER_PHOTO` in config (Home hero and founder scenes, Services `ours-insurance`, Story `top` and `close`); filling them is what the slots were built for, not invented content.

Source files (copy into `site/assets/img/founder/` and generate WebP/AVIF at the sizes the slots need; keep originals out of `dist/` if large):
- `…\images\7.png`: seated on a leather chair, grey studio, with the logo, "Lee Holgado, Founder" and the tagline "Connected with Purpose, United in Service." baked into the image (a finished poster).
- `…\images\8.png`: standing, arms crossed, navy suit, pale blue backdrop.
- `…\images\9.png`: standing, arms crossed, cream suit, pale blue backdrop.
(Folder: `C:\Users\THEODO~1\AppData\Local\Temp\claude\C--Cargado-Strategies\f226b957-7fce-4c1a-8257-ead8d59eee4b\images\`.)

Placement (my call; each photo appears where its mood fits, and no scene shows the same photo twice in a row while scrolling a page):

| Photo | Where | Why |
|---|---|---|
| Navy suit (8) | Services `ours-insurance` portrait (the large `figure.portrait`), and the small round avatars on Home (hero lead, founder doors) | Navy reads "trust", matching the new navy backgrounds; insurance is where trust matters most |
| Cream suit (9) | Story `top` portrait (the large figure), and the Story `close` avatar | The story is personal and warm; cream sits well on the narrative page |
| Seated poster (7) | Contact page, the booking scene: "who you will meet" beside the booking picker | It is a finished brand poster with its own logo and tagline, so it is shown whole, framed, never cropped through the text and never next to another logo |

- Config: replace the single `FOUNDER_PHOTO` string with named photos (e.g. `FOUNDER_PHOTOS = { navy, cream, poster }`), keeping `FOUNDER_PHOTO` working as the default so `[data-when="FOUNDER_PHOTO"]` slots and `check-config` stay valid; each slot names which photo it wants **(builder's call on the mechanism)**.
- Presentation: the pale blue/grey studio backdrops must not look pasted onto the black and navy fields. Frame each portrait (an arch or rounded rectangle with a thin gold hairline, a soft inner vignette into the field colour) **(builder's call on the exact frame)**. Never recolour, retouch, stretch or crop through the face; avatars crop to head and shoulders.
- Alt text: "Lee Holgado, founder of Cargado Strategies" on large portraits; small avatars stay `aria-hidden` as today.
- The tagline "Connected with Purpose, United in Service." is the owner's own words and may also be used as a line of copy **(builder's call where; at most once per page)**.
- Performance: portraits are lazy except an above-the-fold one, sized with `width`/`height` to avoid layout shift, and within the page's image budget.

### 6.8 Legal, privacy and disclosure updates (owner, 2026-10-25)

- The builder drafts new and changed clauses so the Legal page matches what the site now does: accounts (Firebase Auth, including Google sign-in), Firestore storage of profiles, bookings, points, referrals and partner applications; Google Calendar and Google Meet for bookings; Resend for confirmation emails; sign-in state kept on the device by Firebase; points terms (earned 5 per qualifying event, no cash value, spending not yet offered); the wider list of services Cargado Strategies provides directly; the partner approval process. Remove the stale "sound and motion choices" sentence (those switches no longer exist).
- Add consent lines for booking and sign-up, linking to the Privacy Policy.
- Every new or changed legal sentence carries a marker in the code (e.g. `data-draft="pending-lawyer-review"` plus an HTML comment), invisible to visitors, and a list of them goes in `site/sections/legal/CLAUDE.md`. The owner has a Canadian lawyer review them before launch.
- The regenerated compliance baseline includes these drafts, so later edits are caught.

### 6.6 Third-person copy

- Every visible sentence that says "we", "us", "our", "I", "my" or names the founder as the doer is rewritten to the third person naming "Cargado Strategies" (e.g. "We connect you with…" becomes "Cargado Strategies connects you with…"). This includes the notices, legal text, FAQ answers, buttons and form messages, WhatsApp prefilled messages, emails sent by `api/`, `<title>`/meta descriptions, and the 404 page.
- Do not change meaning, `[bracket]` placeholders, or facts, except where §6.8 says the facts change. Watch scene word budgets (≤ 60): "Cargado Strategies" is longer than "we".
- The Services legend becomes (owner, 2026-10-25): "**Ours** means Cargado Strategies provides it directly. **Partners** are independent local professionals." It lives on the orbit scene and replaces the old `intro` legend in the baseline.
- The Story page is about the founder; it keeps her name where it is biographical (her story, her name in the portrait), but narration is third person.
- Regenerate `plan/round5/compliance-baseline.json` from the rewritten copy, with a short note in the file explaining the 2026-10-25 owner-approved rewrite.

## 7. Engine and performance boundaries

- New scenes follow the scene contract (attributes, budgets, field rhythm, gold at most once per page; Contact and the dashboards get no gold field unless the builder needs one).
- Firebase and the dashboards must not add weight to the existing film pages' initial load. Only the header's account button appears on film pages; it loads auth state lazily after idle.

## 8. Accounts, points and dashboards (Firebase)

### 8.1 Pages and entry

- An account button in the header ("Log In" / the user's first name when signed in). **(builder's call)** exact placement within the centred nav.
- New pages, which are ordinary app pages, **not** scroll films (they need scrolling lists and forms; they are exempt from the one-screen rule and fit-audit, but keep the brand type, colours, 14 px floor and 44 px targets): `account.html` (log in, sign up, reset password), `dashboard.html` (client), `partner.html`... **(builder's call on names, but avoid clashing with `partners.html`)**, `admin.html`.
- Sign-in: email and password, and "Continue with Google".

### 8.2 Roles

- `client`: everyone who signs up.
- `partner`: a professional applies (the existing partner application on `partners.html`, now also stored), the owner approves in the admin dashboard, and only then does their account get the partner role.
- `admin`: the owner. Set once by hand (instructions in the setup doc).
- Roles enforced by Firestore security rules and server checks, never by the page alone.

### 8.3 Dashboards

- **Client:** points balance, a history of how each point was earned, their bookings (upcoming and past), their referral link, profile (name, email, phone).
- **Partner:** profile (editable, the owner reviews public changes), referrals sent to them (from Cargado Strategies), and earnings. Earnings show only what the owner records in admin; nothing is computed or invented.
- **Admin (owner):** partner applications (approve or decline), all bookings, clients and their points (with manual adjustments logged), marking "service acquired" for a client, assigning a referral to a partner, recording a partner's earnings.

### 8.4 Points

- **5 points per qualifying event, every kind** (owner: "5 per anything"). Automatic, never typed in by the client. Qualifying events (my call, from the owner's "points for acquiring services" and "automatic"):
  1. A consultation the signed-in client booked is completed (the meeting's end time has passed and the owner has not marked it a no-show/cancelled).
  2. The owner marks a service as acquired by the client in admin; the 5 points are then added automatically.
  3. A friend signs up with the client's referral link and completes their first consultation.
- Each event awards once (idempotent: a point record keyed by event id).
- Spending points: **not decided by the owner yet** (see open questions). Until then the dashboard shows the balance and history only.

### 8.5 Data (Firestore, builder refines)

`users/{uid}` (role, name, email, phone, points, referralCode, referredBy), `users/{uid}/points/{eventId}`, `bookings/{id}`, `partnerApplications/{id}`, `partners/{uid}` (profile, status), `referrals/{id}` (partner, client, status), `earnings/{id}`.

### 8.6 Before Firebase is connected

Update 2026-10-25: the owner supplied the Firebase web config (project `cargadostrategies-b7dfd`), so the header shows "Log In"; the plan covers the half-set-up state (providers or Firestore not enabled yet). Firebase Analytics is not used, to keep the Privacy Policy's "no analytics" promise.


- The config holds a `FIREBASE` block with empty values. While empty: the header's account button is hidden; the account pages show a calm "Accounts are coming soon" state; booking still works (§6.4); nothing throws, and console-check stays at 0 errors and 0 warnings.

## 9. What the owner must provide (write this as `docs/setup-google-calendar.md` and `docs/setup-firebase.md`)

**Google Calendar:** a Google account whose calendar holds the bookings; a Google Cloud project with the Google Calendar API enabled; an OAuth consent screen and an OAuth client; a one-time authorisation to get a refresh token (a small local script in `tools/` does this); the calendar ID; then Vercel env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`). Optional: `BOOKING_NOTIFY_EMAIL` (defaults to the inquiry recipient).

**Firebase:** a Firebase project; Authentication with Email/Password and Google enabled and the site domains authorised; Firestore; the web app config pasted into `config.js` (these values are public by design); a service account key as a Vercel env var for the `api/` functions; deploying the provided `firestore.rules`; making the owner's account admin once (script provided).

**Resend:** already working; a verified Cargado sending domain is optional (today it sends from `noreply@gnlab.studio`).

## 10. Verification

- Existing gates (build, compliance with the regenerated baseline, console-check on every page touched, fit-audit film/flow/touch for every film page touched, seek-test for motion changes on Story, Services and Home).
- **Golden-diff (gate 2) no longer applies**: this is not a pure refactor. Record that in the verification notes.
- Grep gate changes from "no blue" to "navy only in background tokens".
- New: unit tests for the slot calculation (time zone, daylight saving changeover, the 8:50 pm last slot, past slots, busy overlaps), for the points rules (5 each, idempotent), and for the booking function's validation; tests for the Firestore rules with the emulator are documented as a step for when Firebase exists.
- Booking end to end can only be tested after credentials exist; until then, test the fallback path.

## 10b. Calls made after the builder check (my calls)

- **Partner application to account:** applying needs no login. The application stores the applicant's email. On approval, admin sends an invitation email to sign up with that address; the partner role is granted when an account with that **verified** email exists (at approval if it already exists, otherwise on first sign-in). A different email gets no role; the owner can re-send the invite to another address from admin.
- **Booking states:** `confirmed`, `cancelled` (by the owner in admin, or detected when the visitor declines the calendar invite or the event is deleted), `no-show` (owner marks), `completed` (end time passed and still confirmed). Points only on `completed`.
- **Booking limits:** no slot starts less than 2 hours from now; slots are back to back with no gap; one active future booking per email address at a time.

## 11. Left to the builder

Exact navy values; the orbit's phone layout and touch pattern; scene breakdown for the Contractor items; dashboard layouts; file and page names not fixed above; rate-limit mechanism; how the shared C/W mark module is factored.

## 12. Owner decisions recorded 2026-10-25

- Legal: builder drafts, marked pending lawyer review (§6.8).
- Partner approval does not publish publicly; `PARTNERS` in `config.js` stays hand-edited, and the film pages never load Firebase.
- "Ours" legend as in §6.6.
- Points: balance and history only until the owner decides rewards.
- Insurance link: not yet answered whether `trigger_link` is the owner's code; **(my call)** ship the plain `https://policyreview.leeholgado.com/`, a one-line config change to add it later.
