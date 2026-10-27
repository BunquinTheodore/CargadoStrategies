# Cargado Strategies website

A one-screen-per-scroll "film" website for **Cargado Strategies** (Lee Holgado, Winnipeg, Manitoba). Cargado Strategies provides insurance, business strategy, outsourcing, web design, graphics, virtual assistance, software development, export and import, and contractor work itself, and introduces visitors to independent local professionals for everything else.

- **Live:** https://cargadostrategies.vercel.app (Vercel project `cargadostrategies`, auto-deploys from `main`)
- **Repo:** https://github.com/BunquinTheodore/CargadoStrategies (public, so never commit secrets)
- **Film pages:** Home (`index.html`), Services, Story, For Professionals (`partners.html`), Contact (booking a free consultation), Legal
- **App pages** (v2, ordinary scrolling pages, the only ones that load Firebase): `account.html` (log in, sign up, reset), `dashboard.html` (client: points, bookings, referral link), `partner-dashboard.html`, `admin.html`. They are `noindex` and not in the sitemap.

## Quick start

```bash
npm ci            # install (Node 24.x)
npm run dev       # http://localhost:8000, assembles the section files live
npm run build     # production build into dist/
npm run serve     # preview dist/ on http://localhost:8231
npm test          # unit tests (node:test): slots, booking API, points, admin, pages
```

Run the tests with `npm test` (or `node --test "tests/**/*.test.mjs"`). On Node 24, `node --test tests/` treats the folder as one file and fails with `MODULE_NOT_FOUND`.

Open `site/` only through `npm run dev`. A plain static server would show raw `<!-- @section -->` markers instead of the page.

## How the code is organised

```
site/
  index.html … contact.html thin film-page shells: <head>, header, one marker per section
  account.html … admin.html app-page shells (accounts and dashboards, not scroll films)
  core/                     shared by every page (one change = all 6 film pages)
    engine/                 the scroll "film" (cuts, iris, touch, splash, dot globe, sound, mark-draw)
    ui/                     dialog, stepper, pager, tabs, accordion, focus, orbit helpers
    chrome/                 header (with the account button), menu, footer, WhatsApp links and sheet
    design/                 tokens and shared CSS (base, ui, fx, visual, orbit, app)
    account/                Firebase loader (SDK 10.12.2 from gstatic, lazy), auth, role guard, view models
    lib/                    small helpers (text-case, fit-rule, send-inquiry, slots)
    Section.js              base class every section extends: mount / enter / leave / cut
  sections/<page>/<name>/   one folder per section: <name>.html, <name>.css, <Name>.js
  sections/app/             the app pages' partials and page logic
  pages/<page>.js|.css      page entries: boot the engine, mount the page's Section classes
  assets/js/config.js       ALL owner content: name, phone, email, address, partners, booking, Firebase web config
api/inquiry.js              Vercel function: emails every form/request to the owner (Resend)
api/slots.js, api/book.js   booking: open slots (Google free/busy) and a booking (Calendar + Meet, email fallback)
api/partner-apply.js        stores a partner application (Firestore) and emails it
api/admin/[action].js       admin actions (approve partner, points, referrals, booking status)
api/cron/complete-bookings  daily cron (vercel.json): completes past bookings and awards points once
api/_lib/                   shared server code: mail, http, google, firebase, store, points
build.mjs                   esbuild build: assembles sections, bundles JS/CSS, self-hosts fonts
serve.mjs                   local static server (assembles sections when serving site/)
tests/                      node:test unit tests (npm test)
docs/                       owner setup guides (Google Calendar, Firebase) and the v2 spec and plan
tools/                      audits: fit, console, compliance, seek, perf, screenshots
plan/                       design history (round 4/5 specs, judgements, final audit, v2 verify)
```

Start every coding session by reading `CLAUDE.md` at the root, then `site/core/CLAUDE.md` and the `site/sections/<page>/CLAUDE.md` for the page you are changing. Those files hold the rules, the folder ownership and the known issues.

## Design rules

- **Colours:** black and gold, plus a deep navy only in backgrounds (the `--navy-*` tokens of the ink field and the app pages). Never navy or blue on text, buttons, links, icons or borders.
- **Type:** headings in Times New Roman (Title Case in the markup), body in Manrope, UI labels in Poppins, the header nav in Manrope semibold all caps. Nothing visible is set smaller than 14 px.
- **One scroll = one section,** and every section fits one screen at every size, in cut, touch and reduced-motion (flow) modes.
- **Buttons** are round, solid-gold glass (dark glass on the gold section).
- **Facts:** never invent partners, stats, testimonials, licence numbers or photos.

## Email delivery (Resend)

Every Services inquiry, partner application and WhatsApp-sheet request also POSTs to `/api/inquiry`. That function emails the details to **malee.holgado@mygreatway.ca** through Resend. WhatsApp still opens for the visitor exactly as before.

- **Sender:** `noreply@gnlab.studio` (a domain already verified on the Resend account). Set `RESEND_FROM` in Vercel to switch once a Cargado domain is verified.
- **Secrets:**
  - The key lives only in the Vercel env var **`RESEND_API_KEY`** (Production, Preview and Development) and in the local `.env.local`, which git ignores.
  - Never paste the key into code or docs.
  - To rotate it: create a new key in Resend, run `vercel env rm RESEND_API_KEY` and `vercel env add RESEND_API_KEY`, then redeploy.
- **Live test:**
  ```bash
  curl -s -X POST https://cargadostrategies.vercel.app/api/inquiry -H "Content-Type: application/json" \
    -d '{"kind":"inquiry","page":"services","fields":{"Name":"[TEST]","Email":"you@example.com","Message":"test"}}'
  ```
- **Protection:** input validation, HTML escaping, a size limit and a honeypot field. `/api/book` also has a best-effort in-memory rate limit per instance; add a Vercel firewall rule if spam appears.

## Booking (Contact page, Google Calendar)

`contact.html` books a free 10-minute consultation on Google Meet: every day, first start 3:30 pm, last start 8:50 pm, Winnipeg time (labelled "Central Time" whatever the visitor's zone), at least 2 hours ahead, up to 60 days ahead, one upcoming booking per email (`BOOKING` in `config.js`, slot logic in `site/core/lib/slots.js`).

- **Google connected:** `/api/slots` reads the calendar's free/busy, and `/api/book` creates the event with a Meet link and emails both sides. A slot taken in the meantime answers 409 and the page reloads the times.
- **Google not connected or failing:** the request is never lost. The owner gets an email with the chosen time and the visitor is told it will be confirmed by email.
- **Local preview:** on `127.0.0.1` / `localhost` the page does not call `/api/*`; add `?api=1` under `vercel dev`.
- **Setup:** [`docs/setup-google-calendar.md`](docs/setup-google-calendar.md) (one-time OAuth with `tools/google-auth.mjs`, then the Vercel env vars).

## Accounts, dashboards and points (Firebase)

Firebase Auth (email/password and Google) and Firestore run the app pages. The web config in `config.js` is public by design; access is enforced by `firestore.rules` and the `api/` functions. Firebase Analytics is never loaded.

- **Points:** 5 per qualifying event (a completed booked consultation, a service acquired, a referred friend's first consultation), awarded once per event id, so a cron or retry that runs twice awards nothing extra. Points cannot be spent yet.
- **Before setup is finished** the site still works: sign-in shows "Sign-in is being set up. Please try again soon.", admin actions answer 503 `not_configured`, partner applications are still emailed. With `FIREBASE` empty every app page shows "Accounts are coming soon".
- **Setup:** [`docs/setup-firebase.md`](docs/setup-firebase.md) (providers, Firestore, rules, the service account, the first admin with `tools/make-admin.mjs`).

## Environment variables (Vercel and `.env.local` only, never in the repo)

| Variable | Used by | Notes |
|---|---|---|
| `RESEND_API_KEY`, `RESEND_FROM` | every email | see *Email delivery* |
| `BOOKING_NOTIFY_EMAIL` | `/api/book` | owner copy of bookings; defaults to the inquiry recipient |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` | `/api/slots`, `/api/book` | missing = email fallback |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | admin, cron, partner applications, booking records | missing = 503 `not_configured` on admin actions |
| `CRON_SECRET` | `/api/cron/complete-bookings` | Vercel sends it to the daily cron |
| `SITE_URL` | build and emails | the canonical domain |

## Deploying

Push to `main`; Vercel builds with `npm run build` and serves `dist/` plus `api/` (see `vercel.json`). It needs no other settings.

When the real domain is ready:

1. Add it in Vercel → Domains.
2. Set `SITE_URL=https://your-domain` in Vercel env.
3. Redeploy, so canonical links, Open Graph tags and the sitemap use it.

## Checks before calling a change done

```bash
npm run build                                                  # must exit 0 with no warnings
npm test                                                       # all unit tests pass
node tools/console-check.mjs http://localhost:8000/            # 0 errors, all film and app pages and modes
node tools/compliance-diff.mjs --dist                          # 0 missing / 0 altered
node tools/fit-audit.mjs http://localhost:8000/ <page>.html    # also --touch and --flow
node tools/shoot.mjs http://localhost:8000/ <page>.html --vp=1440x900,390x844 --out=plan/restructure/shots-x
```

This laptop is short on memory, so run one headless-browser tool at a time. The latest full gate run is in `plan/v2/verify.md`.

Owner-approved text removals are recorded in `plan/round5/compliance-baseline.json` (`filledPlaceholders`). Update it whenever copy is removed on purpose.

## Owner decisions (2026-10-20), do not undo

- **Removed notices and switches:**
  - no footer fine print and no "We only message from" line;
  - several partner, commission and coaching notices removed;
  - no Sound/Motion switches (the site always runs with full motion and sound).
- **Legal page:** final, with no visible draft markers (the v2 clauses carry an invisible `data-draft="pending-lawyer-review"` marker until a lawyer approves them). Its privacy contact, Lee Holgado at the email above, is written into `sections/legal/privacy/privacy.html`.
- **Nav:** centred, with Home, Services, Story, For Professionals, Contact (v2), plus the Log In / account button.
- **Footer:** shows WhatsApp, the email, the Facebook page name and the address, with © under the brand.
- **Story page:** opens with the logo story (W = Wealth, C = Cargado, Mark 11:24, KJV).
- **Splash:** about 1.9 s.
- **Headings:** a `.rule[data-rule-fit]` underline runs to the end of its heading.

## Still needed from the owner

The full numbered list is in `Downloads/Cargado-Info-Needed.txt`. The main items:

- **Membership prices:** the real ones. `$49` (Growth) and `$99` (Premier) are stand-ins.
- **Facebook link:** the page URL (`FACEBOOK_URL` in `config.js`).
- **Signature:** Lee's signature (`FOUNDER_SIGNATURE`). The photos are in (`FOUNDER_PHOTOS`, v2).
- **Domain:** the live domain (`SITE_URL`) and, optionally, a Cargado sender domain in Resend.
- **v2 setup:** Google Calendar and Firebase (the two guides in `docs/`), and the one-line descriptions of the six new services (`[One-line description]` in `CATEGORIES`).
- **Legal drafts:** the clauses marked `data-draft="pending-lawyer-review"` need a Canadian lawyer's review (`site/sections/legal/CLAUDE.md`).
- **Remaining brackets:** a few remain on the Partners application form (licence-check method, commission terms) and in Services (insurance licence, prices).
