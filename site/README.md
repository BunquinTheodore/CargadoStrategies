# Cargado Strategies website

A static website: plain HTML, CSS and JavaScript modules, with no server code.

- `site/` is the readable source. It runs as it is: the libraries load from public CDNs at fixed versions (GSAP 3.12.5 with ScrollTrigger, Lenis 1.1.13, three.js 0.160.0) and the fonts from Google Fonts.
- `dist/` is the production copy made by `npm run build`: the same site bundled, minified and self-hosted for speed. **Upload `dist/`, not `site/`.**

Fonts: Manrope (body) and Poppins (labels and buttons), with Tinos downloaded only where the system Times New Roman (display type) is missing.

Colour palette: black and gold (ink `#0B0B0C`, gold `#C9A24A` / `#D4AF37`, ivory `#F5F0E6`, dark gold `#7A5C12` for gold text on light backgrounds). All tokens live at the top of `assets/css/base.css`.

---

## Run it locally

The pages use JavaScript modules, so open them through a local web server, not by double-clicking the file.

Source, as written (no install needed):

```bash
python -m http.server 8000 --directory "C:\Cargado Strategies\site"
```

Then open <http://localhost:8000/>. Stop the server with `Ctrl+C`.

---

## Build, serve and deploy

You need [Node.js](https://nodejs.org/) 18 or newer. In `C:\Cargado Strategies` (the folder above `site/`):

```bash
npm install          # once: esbuild, gsap, lenis, three and the font files
npm run build        # site/ → dist/
npm run serve        # dist/ at http://127.0.0.1:8231/ (Brotli/gzip, like a real host)
npm run serve:src    # site/ at http://127.0.0.1:8230/ with the same server
```

Before the build for the live site, set the real domain so the canonical links, Open Graph tags, `sitemap.xml` and `robots.txt` point to it (the default `https://www.cargadostrategies.ca` is a **placeholder** until the domain is confirmed):

```bash
SITE_URL=https://the-real-domain.ca npm run build          # macOS / Linux / Git Bash
$env:SITE_URL="https://the-real-domain.ca"; npm run build  # Windows PowerShell
```

What the build does (`build.mjs`). It empties `dist/` and fills it again; the folder itself is kept, so a local server or terminal that is open inside `dist/` does not stop the build on Windows.

- **JavaScript**: GSAP, ScrollTrigger and Lenis are bundled from npm (same origin, minified) instead of the CDN. Each page gets a tiny entry that waits for the first paint, then loads the libraries and the page code as separate steps; code shared by the pages sits in one cached chunk. three.js is cut down to the parts the globe uses and loads only after the page has settled. Every chunk name carries a content hash.
- **CSS**: one shared minified file (`base.css` + `fx.css` + the font faces) and one per page.
- **Fonts**: self-hosted `woff2` files (Latin and Latin Extended subsets, `font-display: swap`), with the main body face preloaded. The metric-matched fallbacks in `base.css` keep the swap free of layout shift.
- **HTML**: CDN and Google Fonts tags replaced by the built files, `modulepreload` hints, canonical link, Open Graph and Twitter tags, `theme-color`, minified inline script and style, comments removed. The scene wrappers the film engine needs are written into the HTML, so the browser does not rebuild the opening scene after first paint.
- **Extras**: `robots.txt`, `sitemap.xml`, `favicon.svg` and `_headers` (caching rules for Netlify and Cloudflare Pages).

Adding a page: copy the `<head>` of an existing page exactly (the build recognises those tags and replaces them), then add the page to `PAGES` at the top of `build.mjs`. The build stops with a clear message if a page still references a CDN or an unbuilt asset.

### Deploy

Upload the **contents** of `dist/` to any static host (Netlify, Cloudflare Pages, GitHub Pages, an ordinary web host). For the speed the scores below assume, the host must:

1. **Compress** text files with Brotli or gzip (`.html`, `.js`, `.css`, `.svg`, `.xml`, `.txt`). Netlify, Cloudflare Pages and GitHub Pages do this by themselves.
2. **Cache** `assets/` for a year: `Cache-Control: public, max-age=31536000, immutable`. File names change whenever their content does, so this is safe. Fonts keep their names; if you ever replace a font file, give it a new name.
3. **Revalidate** the pages: `Cache-Control: no-cache` for `*.html` and `/`, so visitors always get the newest HTML (which points to the newest assets).

Netlify and Cloudflare Pages read these rules from `dist/_headers`. On Apache, put the same in an `.htaccess` (`mod_expires` / `mod_headers` + `mod_deflate` or `mod_brotli`); on nginx, use `expires`/`add_header` and `gzip_static`/`brotli`.

The source in `site/` still works on any host too, just slower (CDN scripts and Google Fonts, nothing minified).

### Lighthouse scores (lab, 2026-10-17)

Default simulated throttling (the PageSpeed Insights model: mid-range phone, 4× CPU slowdown, slow 4G; desktop preset for desktop), served by `serve.mjs` with Brotli. Accessibility, Best Practices and SEO are **100 on every page and device** in every measurement below.

**Final acceptance** (Lighthouse 13.5.0, 2026-10-17, the current `dist/`, served by `serve.mjs`). Median of three runs on an idle machine (two more runs, made while another Lighthouse job was using the CPU, were discarded because their Total Blocking Time was inflated by the other job, not by the site). Accessibility, Best Practices and SEO are 100 in every run.

| Page | Mobile perf | FCP | LCP | TBT | CLS | Desktop perf | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|---|
| Home | **98** | 1.7 s | 1.7 s | 80 ms | 0.036 | **100** | 0.4 s | 0.4 s | 0 ms | 0.002 |
| Services | **96** | 2.0 s | 2.2 s | 120 ms | 0 | **100** | 0.5 s | 0.5 s | 0 ms | 0 |
| Our Story | **98** | 1.7 s | 1.7 s | 70 ms | 0 | **100** | 0.4 s | 0.4 s | 0 ms | 0 |
| Become a Partner | **99** | 1.5 s | 1.5 s | 90 ms | 0 | **100** | 0.4 s | 0.4 s | 0 ms | 0 |
| Legal | **99** | 1.7 s | 1.8 s | 50 ms | 0.006 | **100** | 0.4 s | 0.4 s | 0 ms | 0.004 |

The small mobile CLS on Home (and up to 0.02 on Legal in some runs) happens behind the splash. On a phone the opening scene is taller than the screen, so the engine pads it for its pan once the film is built, about 0.4 s after first paint. Visitors do not see it, and it stays well inside the "good" band (under 0.1). It goes away once every scene fits one screen (the Round 4 layout work).

**Earlier measurement** (Lighthouse 13.5.0, after the first Round 4 changes, rebuilt). **Source** = `site/` as it is now (CDN libraries, Google Fonts, unbundled, but with the engine fixes below), one run. **Build** = `dist/`, median of three runs. Every page scores 90 or more on both devices.

| Page | Device | Perf source → build | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|---|
| Home | mobile | 87 → **98** | 2.7 → 1.7 s | 3.1 → 1.7 s | 60 → 40 ms | 0 → 0 | 4.1 → 2.8 s |
| Home | desktop | 99 → **100** | 0.3 → 0.4 s | 0.6 → 0.4 s | 0 → 0 ms | 0.038 → 0.002 | 1.1 → 1.0 s |
| Services | mobile | 98 → **98** | 1.1 → 1.7 s | 1.9 → 1.7 s | 80 → 60 ms | 0 → 0 | 3.4 → 2.8 s |
| Services | desktop | 99 → **100** | 0.5 → 0.4 s | 0.5 → 0.4 s | 0 → 0 ms | 0.001 → 0 | 1.2 → 1.0 s |
| Our Story | mobile | 97 → **98** | 1.2 → 1.7 s | 2.5 → 1.7 s | 30 → 80 ms | 0.008 → 0 | 3.2 → 2.7 s |
| Our Story | desktop | 99 → **100** | 0.3 → 0.4 s | 0.8 → 0.4 s | 0 → 0 ms | 0.002 → 0 | 1.1 → 1.0 s |
| Become a Partner | mobile | 86 → **99** | 2.7 → 1.7 s | 3.1 → 1.7 s | 160 → 20 ms | 0 → 0 | 3.9 → 2.8 s |
| Become a Partner | desktop | 99 → **100** | 0.3 → 0.4 s | 0.8 → 0.4 s | 0 → 0 ms | 0.001 → 0 | 1.2 → 1.0 s |
| Legal | mobile | 99 → **98** | 1.1 → 1.7 s | 1.9 → 1.8 s | 50 → 50 ms | 0.012 → 0.006 | 3.1 → 2.8 s |
| Legal | desktop | 99 → **100** | 0.3 → 0.4 s | 0.6 → 0.4 s | 0 → 0 ms | 0.018 → 0.004 | 1.1 → 1.0 s |

**First measurement** (Lighthouse 12.2.1, before any performance work). **Before** = `site/` as it was originally (CDN libraries, Google Fonts, unbundled, no engine fixes). **After** = the first `dist/`, median of three runs on a busy machine (best run in brackets).

| Page | Device | Perf before → after | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|---|
| Home | mobile | 50 → **85** (97) | 3.2 → 1.6 s | 4.1 → 1.8 s | 1,700 → 470 ms | 0 → 0 | 5.3 → 4.4 s |
| Home | desktop | 87 → **99** (100) | 0.4 → 0.4 s | 0.5 → 0.4 s | 280 → 0 ms | 0.001 → 0 | 1.4 → 1.2 s |
| Services | mobile | 61 → **96** (97) | 3.1 → 2.0 s | 3.6 → 2.1 s | 940 → 40 ms | 0 → 0 | 4.7 → 3.8 s |
| Services | desktop | 88 → **100** | 0.3 → 0.5 s | 0.8 → 0.5 s | 260 → 10 ms | 0.001 → 0 | 1.3 → 1.1 s |
| Our Story | mobile | 69 → **91** (96) | 1.2 → 1.6 s | 2.9 → 1.9 s | 1,310 → 320 ms | 0.008 → 0 | 3.5 → 2.9 s |
| Our Story | desktop | 89 → **100** | 0.3 → 0.4 s | 0.9 → 0.4 s | 250 → 0 ms | 0.003 → 0 | 1.3 → 1.0 s |
| Become a Partner | mobile | 55 → **94** (97) | 2.9 → 1.8 s | 3.7 → 2.1 s | 1,500 → 190 ms | 0 → 0 | 5.1 → 3.0 s |
| Become a Partner | desktop | 81 → **100** | 0.3 → 0.4 s | 0.6 → 0.4 s | 400 → 60 ms | 0.027 → 0 | 1.5 → 1.1 s |
| Legal | mobile | 68 → **94** (97) | 1.4 → 1.6 s | 1.7 → 1.6 s | 1,520 → 250 ms | 0.013 → 0.006 | 5.8 → 3.1 s |
| Legal | desktop | 97 → **99** (100) | 0.3 → 0.4 s | 0.8 → 0.5 s | 120 → 0 ms | 0.016 → 0.003 | 1.2 → 1.1 s |

What made the difference (details for developers in `ENGINE.md` §11, *Performance*):

- **No layout thrashing when the film is built.** GSAP read every split character's style right after writing the previous one, forcing hundreds of page layouts (about 2 s of a phone's time on the home page). The film now records every tween, reads all targets in one batch, then creates the tweens (`film-batch.js`).
- **No long tasks.** The first build runs in slices of a few milliseconds, one scene at a time; the page code waits for the first paint; the decorative layers start one step later; the globe loads after the film is ready and compiles its shaders without blocking.
- **Less layout on first paint.** Scenes after the first one are skipped by the browser until the build reaches them (`content-visibility`), so the first paint lays out the opening scene only.
- **Smaller and closer files.** Bundled, minified and Brotli-compressed scripts and styles from the same origin, self-hosted fonts, three.js cut to what the globe uses, and a faster map-of-Canada dot fill.
- **No layout shift.** The home intro choices are in the HTML (written by the build) instead of being added after the first paint.

### Acceptance check (2026-10-17, `dist/`, 1440×900 and 390×844)

Every item passed on all five pages:
- The splash opens with an iris into the hero.
- Display type is Times New Roman in Title Case: no uppercase transform, and no Josefin Sans or blue anywhere.
- Text links draw their underline on hover and keyboard focus.
- Magnetic buttons, 3D tilt with depth layers and the cursor ring work on a mouse. Phones get none of them.
- Text effects (character reveals, eyebrow decode) scrub forward and back to the same state.
- Sound starts only after the first click or key, and the speaker toggle mutes everything (header, or phone menu).
- Scroll budget: about 8 wheel notches per scene on desktop, with no dead scroll. Every 100 px of scroll moves something, including the still parts of scenes that pan.
- Deep links work: `services.html#legal`, `services.html#finder` and `legal.html#privacy`.
- The finder search, the home introduction, the services inquiry and the partner application all validate and open WhatsApp with the message written.
- Reduced motion, and the **Pause Animation** flow mode, show plain stacked sections with no motion.
- The console shows no errors or warnings. The only entry is the known `<summary>` false positive (see `ENGINE.md`, *Known DevTools note*).

To measure again: `npm run serve`, then run Lighthouse or PageSpeed Insights on each page. Scores vary by a few points from run to run, more on a busy computer.

To see the plain, motion-free version of any page, add `?motion=off` to the address, press **Pause animation** in the header, or turn on "reduce motion" in your operating system.

---

## Pages

| File | Page | What is on it |
|---|---|---|
| `index.html` | Home | Introduction form (WhatsApp), founder video, "Sounds like you?", one message vs five searches, how it works, the founder's three businesses, all services, finder preview, logo story teaser, partner call, FAQ |
| `services.html` | Services | The founder's three businesses (insurance, business strategy with the 30-day cash-flow clean-up, outsourcing), the partner finder (map of Canada + city/postal search), every category with its partners, inquiry form |
| `story.html` | Our story | Founder story, logo story (W for Wealth, C for Cargado, Mark 11:24 as a reference), mission and values, the partner network |
| `partners.html` | Become a partner | Offer, how it works, tiers (Community / Growth / Premier), founding-partner offer, what we ask, application form |
| `legal.html` | Legal | Draft banner, professional disclosure, privacy policy, terms of use, partner code of conduct, Q&A |

Useful deep links: `services.html#finder`, `services.html#<category-slug>` (for example `services.html#legal`), `legal.html#disclosure`, `#privacy`, `#terms`, `#conduct`, `#qa`.

Other files: `assets/css/base.css` (shared styles), `assets/css/<page>.css`, `assets/js/config.js` (everything the founder edits), `assets/js/<page>.js` and helpers, `assets/data/` (map of Canada and the city list for the finder). `ENGINE.md` explains the scroll-film engine for developers.

---

## What the founder must supply

Nothing on the site invents people, partners, reviews, numbers or licence numbers. Every fact that still needs confirming is shown on the page as a highlighted `[bracket]`. Search the HTML files for `class="ph"` to find each one, replace the bracket with the real text, and remove the `<span class="ph">…</span>` wrapper.

### 1. Settings in `assets/js/config.js`

| Setting | Now | What to do |
|---|---|---|
| `FACEBOOK_URL` | `https://www.facebook.com/` (placeholder) | Put the Cargado Strategies Facebook page address here, then set `FACEBOOK_IS_PLACEHOLDER = false`. |
| `VIDEO.url` | empty, so the home page shows "Founder video coming soon" | Put the video file address (MP4) here. Also set `VIDEO.captions` (a `.vtt` captions file, needed for accessibility), `VIDEO.poster` (a still image) and `VIDEO.source` (`'founder'` or `'stock'`). The video never plays with sound by itself. |
| `CONTACT_EMAIL` | empty, so forms send through WhatsApp only and pages show "[company email]" | Put the company email here when it exists; the forms then offer email too. |
| `PHONE` | +1 (204) 869 2508 | Change only if the business number changes. Every WhatsApp link uses it. |
| `PARTNERS` | empty, so every category shows "Partner spot available" | Add approved partners (see below). |

### 2. Licence and company details

- **Insurance** (founder's business): `[insurance company]`, `[company name]`, `[licence #]`, `[regulator]` on the home and services pages, and in the legal disclosure.
- **Business strategy** and **outsourcing**: `[company name]`, offer prices `[$x]` / `[$y]`, the guarantee wording, `[Role 1–4]` and `[what this role takes off your plate]`.
- **Legal page**: `[date]` (updated), `[privacy officer name and email]`, `[Retention period.]`, `[province]` (governing law), cookie and analytics tools, entity names and licence numbers. The whole legal page must be reviewed by a lawyer in Canada before launch; the "Draft" banner (`<div class="legal-draft">` near the top of `legal.html`) stays until then.
- **Notices**: every `[Wording to be confirmed by counsel]` beside the commission and independent-partner notices.

### 3. Numbers and promises

- Home proof strip: `[n] introductions made`, `[n] approved partners`, `[n] cities`, `[rating]` on Facebook. Use real figures only, or remove the strip.
- Timing promises: `[24 hours]` / `[24h]` to introduce, day `[3]` follow-up, `[48h]` when no partner is listed.
- Partner page: tier fees `[$ per month]`, `[the agreed commission]`, founding-partner terms, `[n] of [2]` founding spots, `[live count]`, response times `[1 business day]` / `[5 business days]`, how licences are checked.

### 4. Story and founder content

- `[Founder name]`, `[Founder photo]`, `[Signature]`, the founder's own words about her background and about how the logo came about, the optional sentence on faith, and confirmation of the whole draft story.
- Home founder section: two real client quotes (`[Real client quote …]`) with `[name]`, `[service]`, `[city]`, `[month]`. Use real, permitted quotes only, or remove them.

---

## How to add a partner

Only add partners the Cargado team has approved. Open `assets/js/config.js` and add an entry to `PARTNERS`:

```js
export const PARTNERS = Object.freeze([
  {
    id: 'smith-family-law',            // unique, lowercase, no spaces
    business: 'Smith Family Law',      // registered business name
    name: 'Jane Smith',                // contact person
    category: 'legal',                 // a category slug (see the list below)
    types: ['family', 'wills-and-estates'], // type slugs from that category (or [])
    city: 'Winnipeg',
    province: 'MB',
    lat: 49.8951, lon: -97.1384,       // coordinates of the office; they drive the distance sorting
    serviceArea: 'Winnipeg and area',
    credential: 'Licence number',      // required where the service is licensed
    issuingBody: 'Law Society of Manitoba',
    description: 'One or two plain sentences about the practice.',
    languages: ['en', 'fr'],
  },
]);
```

The partner then appears in the finder (sorted by distance, with the distance shown), on the map, and in that category on the Services page. Each category list always shows at least two entries, so "Partner spot available" cards fill the empty slots until two real partners are listed. Coordinates can be looked up on any map site (right-click the office location).

Category slugs: `insurance`, `business-strategy`, `outsourcing`, `manufacturing`, `legal`, `mortgage`, `real-estate`, `accounting-and-tax`, `financial-planning`.

Never add a "verified" badge, a ranking or a recommendation. The finder sorts by distance only.

## How to add a category

Add an entry to `CATEGORIES` in `assets/js/config.js`:

```js
{
  slug: 'immigration-consulting',      // lowercase, hyphens; becomes services.html#immigration-consulting
  name: 'Immigration consulting',
  description: 'One plain sentence about what these partners do.',
  ownership: 'partner',                // 'partner', 'founder' (founder's own business) or 'both'
  types: [type('study-permits', 'Study permits'), type('work-permits', 'Work permits')], // or []
},
```

The new category shows up by itself in the home page service tiles, the finder's "What do you need?" list, the Services category rail, the inquiry form and the partner application form. Its deep link `services.html#<slug>` works straight away. Do not use a slug that is already a scene id on the Services page (`intro`, `finder`, `categories`, `inquiry`, `close`, `ours-insurance`, `ours-strategy`, `ours-outsourcing`).

For a category with `ownership: 'founder'` or `'both'`, also add its offer and credential line to `FOUNDER_OFFERS` in `assets/js/services-data.js` and `FOUNDER_LINES` in `assets/js/services-categories.js` (with `[bracket]` placeholders until the details are confirmed).

The home page "What do you need?" chips are a short, separate list (`NEEDS` in `assets/js/home-needs.js`), so add a chip there only if the new category belongs in the top six.

---

## Before launch

- Replace every `[bracket]` (search for `class="ph"`).
- Set `FACEBOOK_URL`, `VIDEO`, `CONTACT_EMAIL`.
- Have the legal page and every commission notice reviewed by a lawyer in Canada, then remove the Draft banner.
- Check each page on a phone and a desktop, with motion on and with **Pause animation**.
- Set `SITE_URL` to the real domain, run `npm run build`, and upload `dist/` (see *Build, serve and deploy*). After any edit in `site/`, build again before uploading.
