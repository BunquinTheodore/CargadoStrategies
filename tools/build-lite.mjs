/**
 * Cargado Strategies Lite: the quiet, no-motion companion site (site-lite/ -> dist/lite/).
 *
 *   build.mjs calls  await buildLite({ out, siteUrl, fontFaces, preloadFonts })  after writeExtras().
 *
 * Two pages from templates in site-lite/: index.html (no script) and book.html (the only
 * page that loads the bundle, site-lite/lite-book.js). Every contact value, category and
 * the tagline is read from site/assets/js/config.js, never typed here. The shared header
 * and footer are written once, below. The stylesheet is site-lite/lite.css plus the token
 * block pulled out of site/core/design/base.css, so one source feeds both sites.
 *
 * Rename the subdomain in ONE line: LITE_LABEL. (vercel.json carries the same host literal;
 * tests/lite-build.test.mjs fails when the two disagree.)
 */
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'site');
const LITE_SRC = join(ROOT, 'site-lite');
const NODE_MODULES = join(ROOT, 'node_modules');

/** The subdomain label. `book` is the fallback name if the owner dislikes `lite`. */
export const LITE_LABEL = 'lite';
export const LITE_DIR = 'lite';
const TARGET = ['es2022', 'chrome90', 'firefox90', 'safari15'];
const DEFAULT_SITE_URL = 'https://www.cargadostrategies.com';
const LOCALE = 'en_CA';
/** Token-block lines the lite site must not carry: motion tokens and the url() texture. */
const DROP_TOKEN_LINE = /url\(|--ease|--dur-|--idle-stop/;

const trimUrl = (url) => String(url).replace(/\/+$/, '');
/** https://www.example.com -> example.com */
const apexOf = (siteUrl) => new URL(siteUrl).hostname.replace(/^www\./, '');

export const liteHost = (siteUrl = DEFAULT_SITE_URL) => `${LITE_LABEL}.${apexOf(siteUrl)}`;
export const liteUrl = (siteUrl = DEFAULT_SITE_URL) => trimUrl(process.env.LITE_URL || `https://${liteHost(siteUrl)}`);

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const attr = escapeHtml;

/* ---------- content, all from config.js ---------- */

const loadConfig = () => import(pathToFileURL(join(SRC, 'assets', 'js', 'config.js')).href);

const isOurs = (c) => c.ownership !== 'partner';

function serviceRows(list) {
  return list.map((c) => `
          <li class="row">
            <h4 class="row__name">${escapeHtml(c.name)}</h4>
            <p class="row__text">${escapeHtml(c.description)}</p>
          </li>`).join('');
}

function headerHtml({ cfg, mainUrl, page }) {
  const here = (name) => (page === name ? ' aria-current="page"' : '');
  const links = `
        <a class="nav__link" href="/"${here('home')}>Home</a>
        <a class="nav__link" href="/book"${here('book')}>Book</a>
        <a class="nav__link" href="${attr(mainUrl)}/">Main Site</a>`;
  return `<header class="hdr">
    <div class="wrap hdr__in">
      <a class="hdr__brand" href="/" aria-label="${attr(cfg.SITE_NAME)}, home">${escapeHtml(cfg.SITE_NAME)}</a>
      <nav class="nav nav--wide" aria-label="Main">${links}
      </nav>
      <details class="menu">
        <summary class="menu__btn">Menu</summary>
        <nav class="menu__panel" aria-label="Main, menu">${links}
        </nav>
      </details>
      <a class="btn btn--primary hdr__cta" href="/book">Book</a>
    </div>
  </header>`;
}

function footerHtml({ cfg, mainUrl }) {
  const legal = cfg.LEGAL_LINKS.map((l) => `<li><a class="flink" href="${attr(mainUrl)}/legal#${attr(l.id)}">${escapeHtml(l.label)}</a></li>`).join('\n          ');
  return `<footer class="ftr" data-field="ink">
    <div class="wrap ftr__grid">
      <div class="ftr__brand">
        <p class="ftr__name">${escapeHtml(cfg.SITE_NAME)}</p>
        <p class="ftr__tag">${escapeHtml(cfg.TAGLINE)}</p>
      </div>
      <nav class="ftr__col" aria-label="Footer">
        <h2 class="ftr__h">Pages</h2>
        <ul class="ftr__list">
          <li><a class="flink" href="/">Home</a></li>
          <li><a class="flink" href="/book">Book</a></li>
          <li><a class="flink" href="${attr(mainUrl)}/">Main Site</a></li>
          <li><a class="flink" href="${attr(mainUrl)}/legal">Legal</a></li>
        </ul>
      </nav>
      <div class="ftr__col">
        <h2 class="ftr__h">Contact</h2>
        <ul class="ftr__list">
          <li><a class="flink" href="${attr(cfg.WHATSAPP_BASE)}" rel="noopener">WhatsApp ${escapeHtml(cfg.PHONE.display)}</a></li>
          <li><a class="flink" href="mailto:${attr(cfg.CONTACT_EMAIL)}">${escapeHtml(cfg.CONTACT_EMAIL)}</a></li>
          <li><span class="ftr__line">Facebook: ${escapeHtml(cfg.FACEBOOK_PAGE_NAME)}</span></li>
          <li><span class="ftr__line">${escapeHtml(cfg.ADDRESS_LINE)}</span></li>
        </ul>
      </div>
      <div class="ftr__col">
        <h2 class="ftr__h">Legal</h2>
        <ul class="ftr__list">
          ${legal}
        </ul>
      </div>
    </div>
  </footer>`;
}

/** The hero headline: one block per sentence of the tagline. */
const taglineHtml = (tagline) => tagline.split(/(?<=\.)\s+/).map((s) => `<span class="h1__line">${escapeHtml(s)}</span>`).join('');

function founderPhoto(cfg) {
  const src = cfg.FOUNDER_PHOTOS?.navy;
  if (!src) return '';
  const name = [cfg.FOUNDER_NAME, cfg.FOUNDER_LAST_NAME].filter(Boolean).join(' ');
  return `<img class="founder__img" src="/${attr(src)}" alt="${attr(name)}" width="800" height="1000" loading="lazy" decoding="async">`;
}

/** Values for the {{KEY}} placeholders in the templates (already escaped HTML). */
function tokens({ cfg, siteUrl, liteBase, assets }) {
  const mainUrl = trimUrl(siteUrl);
  const founder = [cfg.FOUNDER_NAME, cfg.FOUNDER_LAST_NAME].filter(Boolean).join(' ');
  return {
    mainUrl,
    values: {
      SITE_NAME: escapeHtml(cfg.SITE_NAME),
      TAGLINE_HTML: taglineHtml(cfg.TAGLINE),
      MAIN_URL: attr(mainUrl),
      LITE_URL: attr(liteBase),
      WHATSAPP_URL: attr(cfg.WHATSAPP_BASE),
      FOUNDER_NAME: escapeHtml(founder),
      FOUNDER_PHOTO: founderPhoto(cfg),
      CITY: escapeHtml(cfg.ADDRESS.city),
      MEETING_LABEL: escapeHtml(cfg.BOOKING.meetingLabel),
      DURATION_LABEL: escapeHtml(cfg.BOOKING.durationLabel),
      ORBIT_LEGEND: escapeHtml(cfg.ORBIT_LEGEND),
      SERVICES_OURS: serviceRows(cfg.CATEGORIES.filter(isOurs)),
      SERVICES_INTROS: serviceRows(cfg.CATEGORIES.filter((c) => !isOurs(c))),
      CSS_HREF: attr(assets.css),
      FONT_PRELOADS: (assets.fonts || []).map((href) => `<link rel="preload" as="font" type="font/woff2" href="/${attr(href)}" crossorigin>`).join('\n  '),
    },
  };
}

function seoHead({ title, description, url }) {
  return `<link rel="canonical" href="${attr(url)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Cargado Strategies">
  <meta property="og:locale" content="${LOCALE}">
  <meta property="og:title" content="${attr(title)}">
  <meta property="og:description" content="${attr(description)}">
  <meta property="og:url" content="${attr(url)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${attr(title)}">
  <meta name="twitter:description" content="${attr(description)}">`;
}

/** Fill one template. An unknown {{KEY}} stops the build, so a typo never ships. */
function fill(template, values, name) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`site-lite/${name}: unknown placeholder {{${key}}}`);
    return values[key];
  });
}

/* ---------- CSS ---------- */

/** The @font-face fallbacks and the :root token block of base.css (motion tokens and url() dropped). */
export async function tokenBlock() {
  const base = await readFile(join(SRC, 'core', 'design', 'base.css'), 'utf8');
  const start = base.indexOf('@font-face');
  const rootAt = base.indexOf(':root {');
  const end = base.indexOf('\n}\n', rootAt) + 3;
  if (start < 0 || rootAt < 0 || end < 3) throw new Error('base.css: token block not found');
  return base.slice(start, end).split('\n').filter((line) => !DROP_TOKEN_LINE.test(line)).join('\n');
}

const publicPath = (outputs, ext) => `/assets/${Object.keys(outputs).find((p) => p.endsWith(ext)).replace(/\\/g, '/').split('/').pop()}`;

async function buildCss({ out, fontFaces }) {
  const own = await readFile(join(LITE_SRC, 'lite.css'), 'utf8');
  const contents = `${fontFaces}\n${await tokenBlock()}\n${own}`;
  const result = await build({
    stdin: { contents, loader: 'css', resolveDir: LITE_SRC },
    outdir: join(out, 'assets'),
    entryNames: 'lite-[hash]',
    bundle: true,
    minify: true,
    target: TARGET,
    external: ['fonts/*'],
    metafile: true,
    write: true,
    logLevel: 'warning',
  });
  return publicPath(result.metafile.outputs, '.css');
}

/* ---------- JS ---------- */

/**
 * config.js freezes its constants with Object.freeze(), which esbuild cannot prove pure, so
 * unused ones (FIREBASE, PACKAGES, ...) would stay in the bundle. Marking each call pure lets
 * the bundle keep only what the booking form reads; config.js itself is not edited.
 */
const pureConfig = {
  name: 'lite-pure-config',
  setup(b) {
    b.onLoad({ filter: /assets.js.config\.js$/ }, async (args) => ({
      contents: (await readFile(args.path, 'utf8')).replace(/Object\.freeze\(/g, '/* @__PURE__ */ Object.freeze('),
      loader: 'js',
    }));
  },
};

async function buildJs({ out }) {
  const result = await build({
    entryPoints: { 'lite-book': join(LITE_SRC, 'lite-book.js') },
    outdir: join(out, 'assets'),
    bundle: true,
    format: 'esm',
    minify: true,
    target: TARGET,
    legalComments: 'none',
    entryNames: '[name]-[hash]',
    metafile: true,
    nodePaths: [NODE_MODULES],
    plugins: [pureConfig],
    logLevel: 'warning',
  });
  return publicPath(result.metafile.outputs, '.js');
}

/* ---------- pages ---------- */

const PAGES = [
  {
    file: 'index.html', page: 'home', path: '/',
    title: 'Cargado Strategies, the Simple Version',
    description: 'A quiet, fast version of the Cargado Strategies site: insurance, business strategy and free introductions to partner professionals across Canada, with free consultation booking.',
  },
  {
    file: 'book.html', page: 'book', path: '/book', script: true,
    title: 'Book a Free Consultation · Cargado Strategies',
    description: 'Book a free 10-minute consultation with Cargado Strategies on Google Meet. Pick a day and time in Central Time.',
  },
];

async function writePages({ out, cfg, siteUrl, liteBase, assets }) {
  const { mainUrl, values } = tokens({ cfg, siteUrl, liteBase, assets });
  await mkdir(join(out, LITE_DIR), { recursive: true });
  await Promise.all(PAGES.map(async (p) => {
    const template = await readFile(join(LITE_SRC, p.file), 'utf8');
    const url = `${liteBase}${p.path}`;
    const page = {
      ...values,
      TITLE: escapeHtml(p.title),
      DESCRIPTION: attr(p.description),
      SEO: `<meta name="robots" content="noindex">
  ${seoHead({ title: p.title, description: p.description, url })}`,
      HEADER: headerHtml({ cfg, mainUrl, page: p.page }),
      FOOTER: footerHtml({ cfg, mainUrl }),
      SCRIPT: p.script ? `<script type="module" src="${attr(assets.js)}"></script>` : '',
    };
    await writeFile(join(out, LITE_DIR, p.file), fill(template, page, p.file));
  }));
}

async function writeCrawlerFiles({ out, liteBase }) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.map((p) => `  <url><loc>${liteBase}${p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  await writeFile(join(out, LITE_DIR, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  await writeFile(join(out, LITE_DIR, 'robots.txt'), `User-agent: *\nDisallow: /\n\nSitemap: ${liteBase}/sitemap.xml\n`);
}

/**
 * Build dist/lite/. `fontFaces` is build.mjs's self-hosted @font-face text (the fonts are
 * already in dist/assets/fonts); `preloadFonts` lists the face the first screen needs.
 */
export async function buildLite({ out, siteUrl = DEFAULT_SITE_URL, fontFaces = '', preloadFonts = [] }) {
  const cfg = await loadConfig();
  const liteBase = liteUrl(siteUrl);
  const [css, js] = await Promise.all([buildCss({ out, fontFaces }), buildJs({ out })]);
  await writePages({ out, cfg, siteUrl, liteBase, assets: { css, js, fonts: preloadFonts } });
  await writeCrawlerFiles({ out, liteBase });
  process.stdout.write(`Built lite site (${liteHost(siteUrl)}) into ${LITE_DIR}/\n`);
  return { css, js, liteBase };
}
