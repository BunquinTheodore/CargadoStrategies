/**
 * Production build: site/ (readable source, runs unbundled from CDNs) → dist/
 * (what you upload).
 *
 *   npm run build                         # SITE_URL defaults to the placeholder below
 *   SITE_URL=https://example.ca npm run build
 *
 * What it does
 * - Checks first: tools/check-config.mjs (PARTNERS caps, Round 5 keys) stops the
 *   build on any error; tools/build-kerning.mjs refreshes assets/data/kern.json
 *   when the display text changed.
 * - JS: one tiny minified ESM entry per page that waits for the first paint,
 *   then loads the shared vendor chunk (GSAP from npm, exposed as window.gsap;
 *   ScrollTrigger and Lenis too, but only while some source still reads
 *   window.ScrollTrigger: the Round 4 engine) and the page chunk; code splitting
 *   keeps the engine in a shared chunk cached across pages. The Round 5 engine's
 *   `import(LENIS_URL)` (the jsDelivr Lenis URL) becomes a lazy local chunk.
 *   three.js is gone (DIRECTION §10: dotglobe.js replaces it); any other
 *   external dynamic import fails the build.
 * - CSS: one file per page (SHARED_CSS + self-hosted @font-face + the page's
 *   own stylesheet), so first paint waits on a single stylesheet request.
 * - Fonts: DIRECTION §12: Manrope 400/500/600, Poppins 500/600, Tinos 400 and
 *   400 italic (only where Times New Roman is missing); woff2, latin + latin-ext
 *   by unicode-range, font-display: swap; the critical face is preloaded.
 * - HTML: CDN + Google Fonts tags replaced with the built files; a tiny inline
 *   loader adds the page entry and a modulepreload for every chunk it needs
 *   (plus the splash chunk on #splash pages) after the first contentful paint,
 *   scenes pre-wrapped in .scene__pan, word
 *   masks written by tools/build-splits.mjs (DIRECTION §4.1),
 *   canonical / Open Graph / Twitter meta, inline script and style minified,
 *   comments stripped. Plus robots.txt, sitemap.xml, favicon, _headers and
 *   assets/data/*.json (kern.json).
 * - Report: sizes, and tools/.cache/build-meta.json (per page: the entry, its
 *   preloaded chunks and the source modules in them) for tools/perf-gate.mjs,
 *   which enforces the §12 budgets (the legal page loads no dotglobe, layers
 *   or cursor). build.mjs only warns about them.
 */
import { build, transform } from 'esbuild';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkConfig } from './tools/check-config.mjs';
import { buildKerning } from './tools/build-kerning.mjs';
import { splitHtml } from './tools/build-splits.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'site');
const OUT = join(ROOT, 'dist');
const ASSETS = 'assets';
const NODE_MODULES = join(ROOT, 'node_modules');
const META_FILE = join(ROOT, 'tools', '.cache', 'build-meta.json');

/** TODO founder: the live domain. [Placeholder until the domain is confirmed.] */
const DEFAULT_SITE_URL = 'https://www.cargadostrategies.ca';
const SITE_URL = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
const SITE_NAME = 'Cargado Strategies';
const LOCALE = 'en_CA';
const TARGET = ['es2022', 'chrome90', 'firefox90', 'safari15']; // page modules use top-level await

/** Page file → entry module and page stylesheet (in site/assets). */
const PAGES = [
  { html: 'index.html', js: 'home.js', css: 'home.css', priority: '1.0' },
  { html: 'services.html', js: 'services.js', css: 'services.css', priority: '0.9' },
  { html: 'partners.html', js: 'partners.js', css: 'partners.css', priority: '0.8' },
  { html: 'story.html', js: 'story.js', css: 'story.css', priority: '0.7' },
  { html: 'legal.html', js: 'legal.js', css: 'legal.css', priority: '0.4' },
];
const SHARED_CSS = ['base.css', 'fx.css', 'ui.css', 'visual.css'];
/** Source modules the legal page must never load (DIRECTION §12: no dotglobe, stars or cursor). */
const LEGAL_EXCLUDES = ['dotglobe.js', 'dotglobe-draw.js', 'dotglobe-points.js', 'layers.js', 'cursor.js'];
const LEGAL_PAGE = 'legal.html';
/** main.js imports this module only on pages with #splash; there the build also starts it from the head (splashBoot). */
const SPLASH_MODULE = 'splash.js';
const SPLASH_BOOT = 'splash-boot';
const SPLASH_MARK = /\bid="splash"/;
/** Images referenced from CSS (the brushed metal tile, posters) are hashed into assets/img/. */
const IMAGE_LOADERS = { '.png': 'file', '.svg': 'file', '.webp': 'file', '.avif': 'file', '.jpg': 'file' };
/** The jsDelivr URL film-snap.js imports Lenis from (api.md §16); bundled as a lazy local chunk. */
const LENIS_URL = /^https:\/\/cdn\.jsdelivr\.net\/npm\/lenis@[\d.]+\/dist\/lenis\.mjs$/;

/** Self-hosted fonts (DIRECTION §12). `preload` marks the face the first screen needs. */
const FONTS = [
  { family: 'Manrope', pkg: 'manrope', weights: [400, 500, 600], styles: ['normal'], preload: [400] },
  { family: 'Poppins', pkg: 'poppins', weights: [500, 600], styles: ['normal'], preload: [] },
  { family: 'Tinos', pkg: 'tinos', weights: [400], styles: ['normal', 'italic'], preload: [] }, // only where Times New Roman is missing
];
const FONT_SUBSETS = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
};

/** Tags in the source <head> that the build replaces. */
const STRIP_HEAD = [
  /\s*<link rel="preconnect" href="https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)"[^>]*>/g,
  /\s*<link rel="preload" as="style" href="https:\/\/fonts\.googleapis\.com[^>]*>/g,
  /\s*<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*><\/noscript>/g,
  /\s*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/g,
  /\s*<link rel="stylesheet" href="assets\/css\/[^"]+\.css">/g,
  /\s*<script defer src="https:\/\/cdn\.jsdelivr\.net[^>]*><\/script>/g,
  /\s*<link rel="modulepreload" href="assets\/js\/[^"]+">/g,
  /\s*<script type="module" src="assets\/js\/[^"]+"><\/script>/g,
];

/* ---------- JavaScript ---------- */

/**
 * Runs before the page module: the source reads these libraries from window.
 * Round 5 reads only window.gsap; the Round 4 engine (window.ScrollTrigger)
 * also gets ScrollTrigger and Lenis, so the build works on either engine.
 */
const vendorGlobals = (legacy) => (legacy ? `
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
gsap.registerPlugin(ScrollTrigger);
Object.assign(window, { gsap, ScrollTrigger, Lenis });
` : `
import { gsap } from 'gsap';
Object.assign(window, { gsap });
`);

/** True while some source module still reads the ScrollTrigger global (comments ignored). */
async function usesScrollTrigger() {
  const dir = join(SRC, ASSETS, 'js');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.js'));
  const sources = await Promise.all(files.map((f) => readFile(join(dir, f), 'utf8')));
  return sources.some((s) => /\bScrollTrigger\b/.test(s.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')));
}

const pageEntryName = (page) => basename(page.js, '.js');

/**
 * The page entry waits for the first paint (the HTML, the splash and the hero
 * show at once), then evaluates the libraries and the page code in separate
 * tasks, so neither delays the first paint nor joins the other in one long
 * task. Both are modulepreloaded, so the wait costs no download time. Hidden
 * tabs never paint, hence the timer.
 */
const pageEntry = (file) => `
const PAINT_WAIT_MAX_MS = 600;
const afterFirstPaint = () => new Promise((resolve) => {
  requestAnimationFrame(() => setTimeout(resolve, 0));
  setTimeout(resolve, PAINT_WAIT_MAX_MS);
});
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));
afterFirstPaint()
  .then(() => import('virtual:vendor'))
  .then(nextTask)
  .then(() => import(${JSON.stringify(file)}));
`;

/**
 * The splash's own entry, an async module in the head of #splash pages: it starts
 * the splash as soon as the #splash markup is parsed (a following sibling exists),
 * not at DOMContentLoaded (3.7-6.5 s on a throttled phone load) nor after the page
 * entry's first-paint wait and bundle, so the W1 match cut starts before
 * splash.js's CSS_FALLBACK_MS on slow phones. main.js imports the same chunk later
 * and its initSplash() call returns this run (see splashOnce).
 */
const splashBootEntry = (file) => `import { initSplash } from ${JSON.stringify(file)};
const parsed = () => document.readyState !== 'loading' || !!document.getElementById('splash')?.nextElementSibling;
if (parsed()) initSplash();
else {
  const watch = new MutationObserver(() => { if (parsed()) { watch.disconnect(); initSplash(); } });
  watch.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => { watch.disconnect(); initSplash(); }, { once: true });
}
`;

/** splash.js source → initSplash() runs once; later calls return the first run's promise. */
function splashOnce(source, path) {
  const head = 'export function initSplash() {';
  if (!source.includes(head)) throw new Error(`${relative(ROOT, path)}: no "${head}" to make idempotent`);
  return source.replace(head, 'let splashRun = null;\nexport function initSplash() {\n  splashRun ||= initSplashOnce();\n  return splashRun;\n}\nfunction initSplashOnce() {');
}

/**
 * Build-only rewrites:
 * - `virtual:page/<name>` entries wait for the first paint, then import the
 *   vendor globals and then the page module (see pageEntry).
 * - `import(CONST)` where CONST is a relative path string becomes a literal
 *   import, so esbuild bundles and splits it (finder map geometry); the Lenis
 *   CDN URL resolves to the npm copy and splits the same way.
 */
function sitePlugin({ legacyVendor }) {
  return {
    name: 'cargado-site',
    setup(b) {
      b.onResolve({ filter: /^https:\/\/cdn\.jsdelivr\.net\/npm\/lenis@/ }, (args) => {
        if (!LENIS_URL.test(args.path)) throw new Error(`unexpected Lenis URL ${args.path}`);
        return { path: join(NODE_MODULES, 'lenis', 'dist', 'lenis.mjs') };
      });
      b.onResolve({ filter: /^virtual:vendor$/ }, () => ({ path: 'vendor', namespace: 'vendor' }));
      b.onResolve({ filter: /^virtual:/ }, (args) => ({ path: args.path, namespace: 'virtual' }));
      b.onLoad({ filter: /.*/, namespace: 'vendor' }, () => ({ contents: vendorGlobals(legacyVendor), resolveDir: ROOT, loader: 'js' }));
      b.onLoad({ filter: new RegExp(`^virtual:${SPLASH_BOOT}$`), namespace: 'virtual' }, () => {
        const file = join(SRC, ASSETS, 'js', SPLASH_MODULE).replace(/\\/g, '/');
        return { contents: splashBootEntry(file), resolveDir: ROOT, loader: 'js' };
      });
      b.onLoad({ filter: /^virtual:page\//, namespace: 'virtual' }, (args) => {
        const file = join(SRC, ASSETS, 'js', `${args.path.split('/')[1]}.js`).replace(/\\/g, '/');
        return { contents: pageEntry(file), resolveDir: ROOT, loader: 'js' };
      });
      b.onLoad({ filter: /site[\\/]assets[\\/]js[\\/].+\.js$/ }, async (args) => {
        const source = await readFile(args.path, 'utf8');
        const once = basename(args.path) === SPLASH_MODULE ? splashOnce(source, args.path) : source;
        return { contents: rewriteDynamicImports(once, args.path), loader: 'js' };
      });
    },
  };
}

function rewriteDynamicImports(source, path) {
  return source.replace(/import\(\s*([A-Z_][A-Z0-9_]*)\s*\)/g, (match, ident) => {
    const decl = source.match(new RegExp(`const ${ident}\\s*=\\s*'([^']+)'`));
    if (!decl) throw new Error(`${relative(ROOT, path)}: cannot resolve ${match}`);
    const target = decl[1];
    if (LENIS_URL.test(target)) return `import(${JSON.stringify(target)})`;
    if (target.startsWith('.')) return `import(${JSON.stringify(target)})`;
    throw new Error(`${relative(ROOT, path)}: external dynamic import ${target}`);
  });
}

async function buildJs() {
  const legacyVendor = await usesScrollTrigger();
  const result = await build({
    entryPoints: {
      ...Object.fromEntries(PAGES.map((p) => [pageEntryName(p), `virtual:page/${pageEntryName(p)}`])),
      [SPLASH_BOOT]: `virtual:${SPLASH_BOOT}`,
    },
    outdir: join(OUT, ASSETS),
    bundle: true,
    splitting: true,
    format: 'esm',
    minify: true,
    target: TARGET,
    legalComments: 'none',
    entryNames: '[name]-[hash]',
    chunkNames: 'chunks/[name]-[hash]',
    metafile: true,
    nodePaths: [NODE_MODULES],
    plugins: [sitePlugin({ legacyVendor })],
    logLevel: 'warning',
  });
  return result.metafile;
}

/** Entry file plus every chunk it imports statically (transitively): the modulepreload list. */
function staticGraph(metafile, outPath) {
  const seen = new Set();
  const visit = (path) => {
    if (seen.has(path)) return;
    seen.add(path);
    (metafile.outputs[path]?.imports || []).filter((i) => i.kind === 'import-statement').forEach((i) => visit(i.path));
  };
  visit(outPath);
  return [...seen];
}

/** The entry's own dynamic imports (libraries + page code) with their static graphs. */
function preloadList(metafile, entryPath) {
  const direct = (metafile.outputs[entryPath]?.imports || [])
    .filter((i) => i.kind === 'dynamic-import')
    .map((i) => i.path);
  const all = [entryPath, ...direct].flatMap((path) => staticGraph(metafile, path));
  return [...new Set(all)].filter((path) => path !== entryPath);
}

/** Output path of the chunk built for a source module (a dynamic import's target). */
const chunkFor = (metafile, file) => Object.entries(metafile.outputs)
  .find(([, o]) => o.entryPoint?.replace(/\\/g, '/').endsWith(`site/${ASSETS}/js/${file}`))?.[0];

/** Pages whose source HTML has #splash (main.js awaits import('./splash.js') there); never legal. */
async function splashPages() {
  const sources = await Promise.all(PAGES.map((p) => readFile(join(SRC, p.html), 'utf8')));
  return new Set(PAGES.filter((p, i) => p.html !== LEGAL_PAGE && SPLASH_MARK.test(sources[i])).map((p) => p.html));
}

/**
 * Per page: the entry output path, the chunks to modulepreload and, on #splash
 * pages, the splash boot entry with its static graph (the splash chunk), which
 * the head loads at once (splashTags) instead of after the first paint.
 */
function pageFiles(metafile, splash) {
  const outputs = Object.entries(metafile.outputs);
  const entryOf = (name) => outputs.find(([, o]) => o.entryPoint?.endsWith(`virtual:${name}`))?.[0];
  const boot = entryOf(SPLASH_BOOT);
  if (splash.size && !(boot && chunkFor(metafile, SPLASH_MODULE))) throw new Error(`no output chunk for ${SPLASH_MODULE}`);
  const bootGraph = boot ? staticGraph(metafile, boot) : [];
  return Object.fromEntries(PAGES.map((page) => {
    const path = entryOf(`page/${pageEntryName(page)}`);
    const early = splash.has(page.html) ? bootGraph : [];
    const preload = preloadList(metafile, path).filter((p) => !early.includes(p));
    return [page.html, { path, preload, early }];
  }));
}

const jsOutputs = (pageMap) => Object.fromEntries(Object.entries(pageMap).map(([html, { path, preload, early }]) => (
  [html, { entry: toUrl(path), preload: preload.map(toUrl), early: early.map(toUrl) }]
)));

const toUrl = (outPath) => relative(OUT, resolve(ROOT, outPath)).replace(/\\/g, '/');

/* ---------- CSS ---------- */

/** Every face the build ships: { family, pkg, style, w, range, file }. */
const fontFiles = () => FONTS.flatMap(({ family, pkg, weights, styles }) => weights.flatMap((w) => styles.flatMap((style) => (
  Object.entries(FONT_SUBSETS).map(([subset, range]) => ({ family, pkg, style, w, range, file: `${pkg}-${subset}-${w}-${style}.woff2` }))
))));

function fontFaces() {
  return fontFiles().map(({ family, style, w, range, file }) => `@font-face{font-family:'${family}';font-style:${style};font-weight:${w};font-display:swap;src:url(fonts/${file}) format('woff2');unicode-range:${range}}`).join('\n');
}

async function copyFonts() {
  const dir = join(OUT, ASSETS, 'fonts');
  await mkdir(dir, { recursive: true });
  await Promise.all(fontFiles().map(({ pkg, file }) => cp(join(NODE_MODULES, '@fontsource', pkg, 'files', file), join(dir, file))));
}

const preloadFonts = () => FONTS.flatMap(({ pkg, preload }) => preload.map((w) => `${ASSETS}/fonts/${pkg}-latin-${w}-normal.woff2`));

/** SHARED_CSS files that exist (a missing one is reported: stage 2 adds ui.css and visual.css). */
function sharedCss() {
  const present = SHARED_CSS.filter((f) => existsSync(join(SRC, ASSETS, 'css', f)));
  const missing = SHARED_CSS.filter((f) => !present.includes(f));
  if (missing.length) process.stdout.write(`warning: shared CSS not found, skipped: ${missing.join(', ')}\n`);
  return present;
}

async function cssBundle(name, files, prefix = '') {
  const parts = await Promise.all(files.map((f) => readFile(join(SRC, ASSETS, 'css', f), 'utf8')));
  const result = await build({
    stdin: { contents: `${prefix}\n${parts.join('\n')}`, loader: 'css', resolveDir: join(SRC, ASSETS, 'css') },
    outdir: join(OUT, ASSETS),
    entryNames: `${name}-[hash]`,
    bundle: true,
    minify: true,
    target: TARGET,
    external: ['fonts/*'],
    loader: IMAGE_LOADERS,
    assetNames: 'img/[name]-[hash]',
    metafile: true,
    write: true,
    logLevel: 'warning',
  });
  return toUrl(Object.keys(result.metafile.outputs).find((p) => p.endsWith('.css')));
}

/**
 * One render-blocking stylesheet per page (shared + page): a second stylesheet
 * round trip cost ~330 ms of mobile LCP. Built in sequence, since every bundle
 * writes the same hashed images into assets/img/.
 */
async function buildCss() {
  const shared = sharedCss();
  const faces = fontFaces();
  const pages = {};
  for (const p of PAGES) pages[p.html] = await cssBundle(basename(p.css, '.css'), [...shared, p.css], faces);
  return { pages };
}

/* ---------- HTML ---------- */

const pageUrl = (html) => (html === 'index.html' ? `${SITE_URL}/` : `${SITE_URL}/${html}`);
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function seoTags(html, page) {
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] || SITE_NAME);
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '');
  if (!description) throw new Error(`${page.html}: missing meta description`);
  const url = pageUrl(page.html);
  return [
    `<link rel="canonical" href="${attr(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:locale" content="${LOCALE}">`,
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(description)}">`,
    `<meta property="og:url" content="${attr(url)}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${attr(title)}">`,
    `<meta name="twitter:description" content="${attr(description)}">`,
  ];
}

/** Fallback for the script loader when no first-contentful-paint entry arrives (hidden tab, no Paint Timing). */
const SCRIPT_WAIT_MAX_MS = 1200;

/**
 * Inline loader that adds the modulepreloads and the page entry once the page has
 * painted text (Paint Timing 'first-contentful-paint'), or after SCRIPT_WAIT_MAX_MS.
 * Scripts requested before first paint share the slow-4G link with the stylesheet
 * and put ~55 KB of JS on the first-paint path (Lighthouse mobile FCP 2.0-2.2 s with
 * them, 1.36 s without); the splash draw is CSS, so nothing on screen waits for them.
 * It sits after the stylesheet: the stylesheet holds @view-transition, and a page
 * whose head runs a script before it fires pagereveal before the opt-in is known,
 * which aborts every cross-document View Transition (InvalidStateError).
 */
function scriptLoader(js) {
  const tags = [...js.preload.map((href) => ['link', 'modulepreload', href]), ['script', 'module', js.entry]];
  return `<script>(function(d){var t=${JSON.stringify(tags)},done=0,go=function(){if(done)return;done=1;t.forEach(function(x){var e=d.createElement(x[0]);if(x[0]==='link'){e.rel=x[1];e.href=x[2]}else{e.type=x[1];e.src=x[2]}d.head.appendChild(e)})};`
    + `try{new PerformanceObserver(function(l,o){if(l.getEntriesByName('first-contentful-paint').length){o.disconnect();go()}}).observe({type:'paint',buffered:true})}catch(e){}`
    + `setTimeout(go,${SCRIPT_WAIT_MAX_MS})})(document)</script>`;
}

/** #splash pages: the splash boot entry (async: runs once #splash is parsed) and its chunks. */
function splashTags(js) {
  if (!js.early.length) return [];
  const [boot, ...chunks] = js.early;
  return [...chunks.map((href) => `<link rel="modulepreload" href="${href}">`), `<script type="module" async src="${boot}"></script>`];
}

function assetTags(js, css) {
  return [
    ...preloadFonts().map((href) => `<link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin>`),
    `<link rel="stylesheet" href="${css}">`,
    ...splashTags(js),
    scriptLoader(js),
  ];
}

const SCENE_INNER_OPEN = /<div class="scene__inner"[^>]*>/g;
const FIRST_ELEMENT = /^\s*<[a-z][\w-]*\b[^>]*>/i;
const HAS_PAN = /\bclass="(?:[^"]*\s)?scene__pan(?:\s[^"]*)?"/;
const DIV_TAG = /<div\b[^>]*>|<\/div>/g;

/** Index of the </div> that closes the div whose opening tag ends at `from`. */
function closingDivAt(html, from) {
  DIV_TAG.lastIndex = from;
  let depth = 1;
  for (let m = DIV_TAG.exec(html); m; m = DIV_TAG.exec(html)) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return m.index;
  }
  throw new Error('unbalanced <div> inside .scene__inner');
}

/**
 * Wrap each scene's content in the .scene__pan div the film engine would
 * otherwise add at start-up (film.js prepareScene skips existing ones), so the
 * browser does not rebuild the opening scene's layout right after first paint.
 * Flow mode has no styles for it, so it is a plain wrapper there. A scene
 * whose source already starts with its own .scene__pan is left as it is.
 */
function wrapScenePans(html) {
  const opens = [...html.matchAll(SCENE_INNER_OPEN)].map((m) => m.index + m[0].length)
    .filter((start) => !HAS_PAN.test(html.slice(start).match(FIRST_ELEMENT)?.[0] || ''));
  const edits = opens.map((start) => ({ start, end: closingDivAt(html, start) }));
  return edits.reverse().reduce((acc, { start, end }) => (
    `${acc.slice(0, start)}<div class="scene__pan">${acc.slice(start, end)}</div>${acc.slice(end)}`
  ), html);
}

function transformHtml(source, page, js, css) {
  let html = wrapScenePans(STRIP_HEAD.reduce((acc, re) => acc.replace(re, ''), source));
  const leftovers = html.match(/https:\/\/(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)|assets\/(css|js)\//g);
  if (leftovers) throw new Error(`${page.html}: unreplaced source references: ${[...new Set(leftovers)].join(', ')}`);
  html = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '').replace(/\n\s*\n+/g, '\n');
  if (!/name="theme-color"/.test(html)) html = html.replace('</title>', '</title>\n  <meta name="theme-color" content="#0B0B0C">');
  const indent = (tags) => tags.map((t) => `  ${t}`).join('\n');
  /* SEO tags after the icon; assets last, so the inline mode script and the
     splash CSS are parsed before any stylesheet can block them. */
  return html
    .replace(/(<link rel="icon"[^>]*>)/, `$1\n${indent(seoTags(html, page))}`)
    .replace('</head>', `${indent(assetTags(js, css))}\n</head>`);
}

const INLINE_BLOCK = /<(script|style)((?:\s+[a-z-]+(?:="[^"]*")?)*)>([\s\S]*?)<\/\1>/g;

/** Minify inline classic <script> and <style> blocks (drops their comments too). */
async function minifyInline(html) {
  const blocks = [...html.matchAll(INLINE_BLOCK)]
    .filter(([, tag, attrs, body]) => body.trim() && !(tag === 'script' && /\b(src|type)=/.test(attrs)));
  const minified = await Promise.all(blocks.map(([, tag, , body]) => transform(body, { loader: tag === 'style' ? 'css' : 'js', minify: true, target: TARGET })));
  return blocks.reduce((acc, [whole, tag, attrs], i) => acc.replace(whole, () => `<${tag}${attrs}>${minified[i].code.trim()}</${tag}>`), html);
}

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * Bake config FOUNDER_NAME / FOUNDER_LAST_NAME into the founder placeholders, so the
 * word masks are built from the real name and the pages' runtime swap changes no
 * painted text after first paint. Source keeps its [First name] placeholders.
 */
async function founderBaker() {
  const { FOUNDER_NAME = '', FOUNDER_LAST_NAME = '' } = await import(pathToFileURL(join(SRC, ASSETS, 'js', 'config.js')).href);
  if (!FOUNDER_NAME) return (html) => html;
  const first = escapeHtml(FOUNDER_NAME);
  const full = escapeHtml([FOUNDER_NAME, FOUNDER_LAST_NAME].filter(Boolean).join(' '));
  return (html) => html
    .replace(/<span class="ph" data-founder-name>\[First [Nn]ame\]<\/span>/g, `<span data-founder-name>${first}</span>`)
    .replace(/<span class="ph" data-founder-full>\[First [Nn]ame\] \[Last [Nn]ame\]<\/span>/g, `<span data-founder-full>${full}</span>`)
    .replace(/<span data-sheet-founder><span class="ph">\[First [Nn]ame\]<\/span><\/span>/g, `<span data-sheet-founder>${first}</span>`);
}

async function buildHtml(jsMap, css) {
  const bakeFounder = await founderBaker();
  await Promise.all(PAGES.map(async (page) => {
    const source = bakeFounder(await minifyInline(await readFile(join(SRC, page.html), 'utf8')));
    const built = transformHtml(source, page, jsMap[page.html], css.pages[page.html]);
    const { html, warnings } = splitHtml(built);
    warnings.forEach((w) => process.stdout.write(`warning: ${page.html} ${w}\n`));
    await writeFile(join(OUT, page.html), html);
  }));
}

/* ---------- static extras ---------- */

async function writeExtras() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.map((p) => `  <url><loc>${pageUrl(p.html)}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`);
  await writeFile(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  await writeFile(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  await cp(join(SRC, 'favicon.svg'), join(OUT, 'favicon.svg'));
  await writeFile(join(OUT, '_headers'), HOST_HEADERS);
  const imgDir = join(SRC, ASSETS, 'img');
  if (existsSync(imgDir)) await cp(imgDir, join(OUT, ASSETS, 'img'), { recursive: true }); // HTML and JS references (sprite, posters)
  const dataDir = join(SRC, ASSETS, 'data');
  const json = existsSync(dataDir) ? (await readdir(dataDir)).filter((f) => f.endsWith('.json')) : [];
  if (json.length) await mkdir(join(OUT, ASSETS, 'data'), { recursive: true });
  await Promise.all(json.map((f) => cp(join(dataDir, f), join(OUT, ASSETS, 'data', f))));
}

/** Netlify / Cloudflare Pages header rules (other hosts: see README). */
const HOST_HEADERS = `/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*.html
  Cache-Control: no-cache
/
  Cache-Control: no-cache
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`;

/* ---------- report ---------- */

/**
 * Per page: the entry, the chunks it preloads (what the page loads up front) and the
 * source modules inside them; written for tools/perf-gate.mjs. Warns when the legal
 * page would load a module DIRECTION §12 keeps off it.
 */
async function writeBuildMeta(metafile, pageMap) {
  const srcRel = (p) => relative(join(SRC, ASSETS, 'js'), resolve(ROOT, p)).replace(/\\/g, '/');
  const pages = Object.fromEntries(PAGES.map((page) => {
    const { path, preload, early } = pageMap[page.html];
    const files = [path, ...preload, ...early];
    const inputs = [...new Set(files.flatMap((f) => Object.keys(metafile.outputs[f]?.inputs || {})))]
      .filter((p) => p.includes('site')).map(srcRel).sort();
    return [page.html, { entry: toUrl(path), preload: files.slice(1).map(toUrl), inputs }];
  }));
  const banned = pages[LEGAL_PAGE].inputs.filter((p) => LEGAL_EXCLUDES.includes(basename(p)));
  if (banned.length) process.stdout.write(`warning: ${LEGAL_PAGE} preloads ${banned.join(', ')} (DIRECTION §12: none of dotglobe, stars or cursor; perf-gate fails this)\n`);
  await mkdir(dirname(META_FILE), { recursive: true });
  await writeFile(META_FILE, `${JSON.stringify({ generated: new Date().toISOString(), legalExcludes: LEGAL_EXCLUDES, pages }, null, 1)}\n`);
}

async function sizeReport() {
  const { brotliCompressSync } = await import('node:zlib');
  const walk = async (dir) => (await readdir(dir, { withFileTypes: true })).flatMap((d) => (d.isDirectory() ? [] : [join(dir, d.name)]));
  const files = [...await walk(OUT), ...await walk(join(OUT, ASSETS)), ...await walk(join(OUT, ASSETS, 'chunks'))];
  const rows = await Promise.all(files.filter((f) => /\.(html|js|css)$/.test(f)).map(async (f) => {
    const buf = await readFile(f);
    return `${relative(OUT, f).padEnd(48)} ${(buf.length / 1024).toFixed(1).padStart(7)} kB  br ${(brotliCompressSync(buf).length / 1024).toFixed(1).padStart(6)} kB`;
  }));
  process.stdout.write(`${rows.sort().join('\n')}\n`);
}

/**
 * Empty dist/ but keep the folder itself: on Windows a shell or local server
 * whose working directory is dist/ locks the folder (EBUSY on rmdir), while
 * its contents can still be replaced.
 */
async function cleanOut() {
  await mkdir(OUT, { recursive: true });
  const entries = await readdir(OUT);
  await Promise.all(entries.map((name) => rm(join(OUT, name), { recursive: true, force: true })));
}

async function main() {
  if (!process.env.SITE_URL) process.stdout.write(`SITE_URL not set: canonical, Open Graph and sitemap use the placeholder ${DEFAULT_SITE_URL}\n`);
  const config = await checkConfig();
  if (config.errors.length) throw new Error(`check-config failed:\n${config.errors.map((e) => `  - ${e}`).join('\n')}`);
  const kern = await buildKerning();
  if (kern.warning) process.stdout.write(`warning: ${kern.warning}\n`);
  await cleanOut();
  await mkdir(join(OUT, ASSETS), { recursive: true });
  const [metafile, css] = await Promise.all([buildJs(), buildCss(), copyFonts()]);
  const pageMap = pageFiles(metafile, await splashPages());
  await buildHtml(jsOutputs(pageMap), css);
  await writeExtras();
  await writeBuildMeta(metafile, pageMap);
  await sizeReport();
  process.stdout.write(`Built ${PAGES.length} pages into ${relative(ROOT, OUT)}/\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
