/**
 * Production build: site/ (readable source, runs unbundled from CDNs) → dist/
 * (what you upload).
 *
 *   npm run build                         # SITE_URL defaults to the placeholder below
 *   SITE_URL=https://example.ca npm run build
 *
 * What it does
 * - JS: one tiny minified ESM entry per page that waits for the first paint,
 *   then loads the shared vendor chunk (GSAP, ScrollTrigger and Lenis from npm,
 *   exposed as the window globals the source expects) and the page chunk;
 *   code splitting keeps the engine in a shared chunk cached across pages.
 *   three.js is tree-shaken to the classes globe.js uses and lives in its own
 *   chunk, imported lazily after the film's first build.
 * - CSS: one shared file (base + fx + self-hosted @font-face) and one per page.
 * - Fonts: Manrope / Poppins / Tinos woff2 (latin + latin-ext, unicode-range),
 *   font-display: swap; the critical face is preloaded.
 * - HTML: CDN + Google Fonts tags replaced with the built files, modulepreload
 *   for every chunk the entry needs, scenes pre-wrapped in .scene__pan, the
 *   home intro chips pre-rendered,
 *   canonical / Open Graph / Twitter meta, inline script and style minified,
 *   comments stripped. Plus robots.txt, sitemap.xml, favicon and _headers.
 */
import { build, transform } from 'esbuild';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'site');
const OUT = join(ROOT, 'dist');
const ASSETS = 'assets';
const NODE_MODULES = join(ROOT, 'node_modules');

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
const SHARED_CSS = ['base.css', 'fx.css'];

/** Self-hosted fonts. `preload` marks the face the first screen needs. */
const FONTS = [
  { family: 'Manrope', pkg: 'manrope', weights: [400, 500, 600], preload: [400] },
  { family: 'Poppins', pkg: 'poppins', weights: [400, 500, 600], preload: [] },
  { family: 'Tinos', pkg: 'tinos', weights: [400, 700], preload: [] }, // only where Times New Roman is missing
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

/** Runs before the page module: the source reads these libraries from window. */
const VENDOR_GLOBALS = `
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
gsap.registerPlugin(ScrollTrigger);
Object.assign(window, { gsap, ScrollTrigger, Lenis });
`;

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
 * Build-only rewrites:
 * - `virtual:page/<name>` entries wait for the first paint, then import the
 *   vendor globals and then the page module (see pageEntry).
 * - `import(CONST)` where CONST is a relative path string becomes a literal
 *   import, so esbuild bundles and splits it (finder map geometry).
 * - The three.js CDN import becomes a tree-shaken npm chunk that exports only
 *   the THREE.* names globe.js uses.
 */
function sitePlugin() {
  return {
    name: 'cargado-site',
    setup(b) {
      b.onResolve({ filter: /^virtual:three\// }, (args) => ({ path: 'three', namespace: 'three-lib', pluginData: args.path.split('/')[1].split(',') }));
      b.onResolve({ filter: /^virtual:vendor$/ }, () => ({ path: 'vendor', namespace: 'vendor' }));
      b.onResolve({ filter: /^virtual:/ }, (args) => ({ path: args.path, namespace: 'virtual' }));
      b.onLoad({ filter: /.*/, namespace: 'vendor' }, () => ({ contents: VENDOR_GLOBALS, resolveDir: ROOT, loader: 'js' }));
      b.onLoad({ filter: /^virtual:page\//, namespace: 'virtual' }, (args) => {
        const file = join(SRC, ASSETS, 'js', `${args.path.split('/')[1]}.js`).replace(/\\/g, '/');
        return { contents: pageEntry(file), resolveDir: ROOT, loader: 'js' };
      });
      b.onLoad({ filter: /.*/, namespace: 'three-lib' }, (args) => ({
        contents: `export { ${args.pluginData.join(', ')} } from 'three';\n`, resolveDir: ROOT, loader: 'js',
      }));
      b.onLoad({ filter: /site[\\/]assets[\\/]js[\\/].+\.js$/ }, async (args) => {
        const source = await readFile(args.path, 'utf8');
        return { contents: rewriteDynamicImports(source, args.path), loader: 'js' };
      });
    },
  };
}

function rewriteDynamicImports(source, path) {
  return source.replace(/import\(\s*([A-Z_][A-Z0-9_]*)\s*\)/g, (match, ident) => {
    const decl = source.match(new RegExp(`const ${ident}\\s*=\\s*'([^']+)'`));
    if (!decl) throw new Error(`${relative(ROOT, path)}: cannot resolve ${match}`);
    const target = decl[1];
    if (/three(@[\d.]+)?\/build\/three\.module/.test(target)) return `import(${JSON.stringify(threeVirtual(source))})`;
    if (target.startsWith('.')) return `import(${JSON.stringify(target)})`;
    throw new Error(`${relative(ROOT, path)}: external dynamic import ${target}`);
  });
}

/** `virtual:three/A,B,C` with every THREE.<Name> the module uses. */
function threeVirtual(source) {
  const names = [...new Set([...source.matchAll(/THREE\.([A-Za-z][A-Za-z0-9]*)/g)].map((m) => m[1]))].sort();
  return `virtual:three/${names.join(',')}`;
}

async function buildJs() {
  const result = await build({
    entryPoints: Object.fromEntries(PAGES.map((p) => [pageEntryName(p), `virtual:page/${pageEntryName(p)}`])),
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
    plugins: [sitePlugin()],
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

function jsOutputs(metafile) {
  const outputs = Object.entries(metafile.outputs);
  return Object.fromEntries(PAGES.map((page) => {
    const [path] = outputs.find(([, o]) => o.entryPoint?.endsWith(`virtual:page/${pageEntryName(page)}`));
    return [page.html, { entry: toUrl(path), preload: preloadList(metafile, path).map(toUrl) }];
  }));
}

const toUrl = (outPath) => relative(OUT, resolve(ROOT, outPath)).replace(/\\/g, '/');

/* ---------- CSS ---------- */

function fontFaces() {
  return FONTS.flatMap(({ family, pkg, weights }) => weights.flatMap((w) => Object.entries(FONT_SUBSETS).map(([subset, range]) => `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${pkg}-${subset}-${w}-normal.woff2) format('woff2');unicode-range:${range}}`))).join('\n');
}

async function copyFonts() {
  const dir = join(OUT, ASSETS, 'fonts');
  await mkdir(dir, { recursive: true });
  const jobs = FONTS.flatMap(({ pkg, weights }) => weights.flatMap((w) => Object.keys(FONT_SUBSETS).map((subset) => {
    const file = `${pkg}-${subset}-${w}-normal.woff2`;
    return cp(join(NODE_MODULES, '@fontsource', pkg, 'files', file), join(dir, file));
  })));
  await Promise.all(jobs);
}

const preloadFonts = () => FONTS.flatMap(({ pkg, preload }) => preload.map((w) => `${ASSETS}/fonts/${pkg}-latin-${w}-normal.woff2`));

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
    metafile: true,
    write: true,
    logLevel: 'warning',
  });
  return toUrl(Object.keys(result.metafile.outputs).find((p) => p.endsWith('.css')));
}

async function buildCss() {
  const shared = await cssBundle('shared', SHARED_CSS, fontFaces());
  const pages = await Promise.all(PAGES.map(async (p) => [p.html, await cssBundle(basename(p.css, '.css'), [p.css])]));
  return { shared, pages: Object.fromEntries(pages) };
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

function assetTags(js, css) {
  return [
    ...preloadFonts().map((href) => `<link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin>`),
    `<link rel="stylesheet" href="${css.shared}">`,
    `<link rel="stylesheet" href="${css.page}">`,
    ...js.preload.map((href) => `<link rel="modulepreload" href="${href}">`),
    `<script type="module" src="${js.entry}"></script>`,
  ];
}

const SCENE_INNER_OPEN = /<div class="scene__inner"[^>]*>/g;
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
 * Flow mode has no styles for it, so it is a plain wrapper there.
 */
function wrapScenePans(html) {
  const opens = [...html.matchAll(SCENE_INNER_OPEN)].map((m) => m.index + m[0].length);
  const edits = opens.map((start) => ({ start, end: closingDivAt(html, start) }));
  return edits.reverse().reduce((acc, { start, end }) => (
    `${acc.slice(0, start)}<div class="scene__pan">${acc.slice(start, end)}</div>${acc.slice(end)}`
  ), html);
}

/**
 * Content the page script would otherwise inject after the first paint (and
 * so push the form down): the home intro chips, from the same module home.js uses.
 */
async function prerender(html) {
  const { needsMarkup } = await import(pathToFileURL(join(SRC, ASSETS, 'js', 'home-needs.js')).href);
  return html.replace(/(<div class="[^"]*" id="intro-needs">)(<\/div>)/, (m, open, close) => `${open}${needsMarkup()}${close}`);
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

async function buildHtml(jsMap, css) {
  await Promise.all(PAGES.map(async (page) => {
    const source = await prerender(await minifyInline(await readFile(join(SRC, page.html), 'utf8')));
    const html = transformHtml(source, page, jsMap[page.html], { shared: css.shared, page: css.pages[page.html] });
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
  await cleanOut();
  await mkdir(join(OUT, ASSETS), { recursive: true });
  const [metafile, css] = await Promise.all([buildJs(), buildCss(), copyFonts()]);
  await buildHtml(jsOutputs(metafile), css);
  await writeExtras();
  await sizeReport();
  process.stdout.write(`Built ${PAGES.length} pages into ${relative(ROOT, OUT)}/\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
