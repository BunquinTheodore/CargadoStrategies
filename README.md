# Cargado Strategies website

A one-screen-per-scroll "film" website for **Cargado Strategies** (Lee Holgado, Winnipeg, Manitoba). Lee handles insurance, business strategy and outsourcing herself, and introduces visitors to independent local professionals for everything else.

- **Live:** https://cargadostrategies.vercel.app (Vercel project `cargadostrategies`, auto-deploys from `main`)
- **Repo:** https://github.com/BunquinTheodore/CargadoStrategies (public, so never commit secrets)
- **Pages:** Home (`index.html`), Services, Story, For Professionals (`partners.html`), Legal

## Quick start

```bash
npm ci            # install (Node 24.x)
npm run dev       # http://localhost:8000, assembles the section files live
npm run build     # production build into dist/
npm run serve     # preview dist/ on http://localhost:8231
```

Open `site/` only through `npm run dev`. A plain static server would show raw `<!-- @section -->` markers instead of the page.

## How the code is organised

```
site/
  index.html … legal.html   thin page shells: <head>, header, one marker per section
  core/                     shared by every page (one change = all 5 pages)
    engine/                 the scroll "film" (cuts, iris, touch, splash, dot globe, sound)
    ui/                     dialog, stepper, pager, tabs, accordion, focus helpers
    chrome/                 header, menu, footer, WhatsApp links and sheet
    design/                 tokens and shared CSS (base, ui, fx, visual)
    lib/                    small helpers (text-case, fit-rule, send-inquiry)
    Section.js              base class every section extends: mount / enter / leave / cut
  sections/<page>/<name>/   one folder per section: <name>.html, <name>.css, <Name>.js
  pages/<page>.js|.css      page entries: boot the engine, mount the page's Section classes
  assets/js/config.js       ALL owner content: name, phone, email, address, partners, prices slots
api/inquiry.js              Vercel function: emails every form/request to the owner (Resend)
build.mjs                   esbuild build: assembles sections, bundles JS/CSS, self-hosts fonts
serve.mjs                   local static server (assembles sections when serving site/)
tools/                      audits: fit, console, compliance, seek, perf, screenshots
plan/                       design history (round 4/5 specs, judgements, final audit)
```

Start every coding session by reading `CLAUDE.md` at the root, then `site/core/CLAUDE.md` and the `site/sections/<page>/CLAUDE.md` for the page you are changing. Those files hold the rules, the folder ownership and the known issues.

## Design rules

- **Colours:** black and gold only, never blue.
- **Type:** headings in Times New Roman (Title Case in the markup), body in Manrope, UI labels in Poppins, the header nav in Josefin Sans Bold all caps. Nothing visible is set smaller than 14 px.
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
- **Protection:** input validation, HTML escaping, a size limit and a honeypot field. There is no rate limit yet; add a Vercel firewall rule if spam appears.

## Deploying

Push to `main`; Vercel builds with `npm run build` and serves `dist/` plus `api/` (see `vercel.json`). It needs no other settings.

When the real domain is ready:

1. Add it in Vercel → Domains.
2. Set `SITE_URL=https://your-domain` in Vercel env.
3. Redeploy, so canonical links, Open Graph tags and the sitemap use it.

## Checks before calling a change done

```bash
npm run build                                                  # must exit 0 with no warnings
node tools/console-check.mjs http://localhost:8000/            # 0 errors, all pages and modes
node tools/compliance-diff.mjs http://localhost:8000/          # 0 missing / 0 altered
node tools/fit-audit.mjs http://localhost:8000/ <page>.html    # also --touch and --flow
node tools/shoot.mjs http://localhost:8000/ <page>.html --vp=1440x900,390x844 --out=plan/restructure/shots-x
```

This laptop is short on memory, so run one headless-browser tool at a time.

Owner-approved text removals are recorded in `plan/round5/compliance-baseline.json` (`filledPlaceholders`). Update it whenever copy is removed on purpose.

## Owner decisions (2026-10-20), do not undo

- **Removed notices and switches:**
  - no footer fine print and no "We only message from" line;
  - several partner, commission and coaching notices removed;
  - no Sound/Motion switches (the site always runs with full motion and sound).
- **Legal page:** final, with no draft markers. Its privacy contact, Lee Holgado at the email above, is written into `sections/legal/privacy/privacy.html`.
- **Nav:** centred, with Home, Services, Story, For Professionals.
- **Footer:** shows WhatsApp, the email, the Facebook page name and the address, with © under the brand.
- **Story page:** opens with the logo story (W = Wealth, C = Cargado, Mark 11:24, KJV).
- **Splash:** about 1.9 s.
- **Headings:** a `.rule[data-rule-fit]` underline runs to the end of its heading.

## Still needed from the owner

The full numbered list is in `Downloads/Cargado-Info-Needed.txt`. The main items:

- **Membership prices:** the real ones. `$49` (Growth) and `$99` (Premier) are stand-ins.
- **Facebook link:** the page URL (`FACEBOOK_URL` in `config.js`).
- **Photos:** Lee's photo and signature (`FOUNDER_PHOTO`, `FOUNDER_SIGNATURE`).
- **Domain:** the live domain (`SITE_URL`) and, optionally, a Cargado sender domain in Resend.
- **Remaining brackets:** a few remain on the Partners application form (licence-check method, commission terms) and in Services (insurance licence, prices).
