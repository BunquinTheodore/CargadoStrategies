/**
 * Golden diff for the restructure (a pure refactor: nothing a visitor gets may change).
 * Compares against the pre-refactor reference in plan/restructure/golden/:
 *
 *   site  every assembled site/<page>.html (tools/lib/assemble.mjs) against golden/<page>.html,
 *         after reducing each local <script src> / <link href> to its file name (the modules
 *         and stylesheets moved, their names did not);
 *   dist  every file of dist/ against golden/dist/, after replacing esbuild's [hash] in file
 *         names and references with '#' and the sitemap <lastmod> date. Several outputs that
 *         share a normalised name (chunk-#.js) are compared as a set.
 *
 *   node tools/lib/golden-diff.mjs [--only=site,dist] [--golden=DIR] [--site=DIR] [--dist=DIR] [--quiet]
 *
 * Run `npm run build` first for the dist part. Exit code 1 on any difference.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAssembled } from './assemble.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.svg', '']);
const CONTEXT = 70;

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const opts = {
  only: arg('only', 'site,dist').split(','),
  golden: resolve(ROOT, arg('golden', 'plan/restructure/golden')),
  site: resolve(ROOT, arg('site', 'site')),
  dist: resolve(ROOT, arg('dist', 'dist')),
  quiet: process.argv.includes('--quiet'),
};

/* ---------- normalisers ---------- */

/** Local script/stylesheet/modulepreload references → their file name. */
const normaliseSite = (html) => html.replace(
  /\b(href|src)="(?![a-z]+:|\/\/|#)(?:[^"]*\/)?([^"/]+\.(?:js|css))"/g,
  (m, attr, file) => `${attr}="${file}"`,
);

const HASH = /([\w.-]+?)-[A-Z0-9]{8}\.(js|css|png|svg|webp|avif|jpg|woff2)\b/g;
/** esbuild [hash]es → '#', sitemap dates → a fixed date. */
const normaliseDist = (text) => text
  .replace(HASH, '$1-#.$2')
  .replace(/<lastmod>\d{4}-\d\d-\d\d<\/lastmod>/g, '<lastmod>DATE</lastmod>');

/* ---------- compare ---------- */

/** First difference as a short "golden … / actual …" excerpt. */
function firstDiff(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - CONTEXT);
  const cut = (s) => JSON.stringify(s.slice(from, i + CONTEXT));
  return `at char ${i}\n      golden: ${cut(a)}\n      actual: ${cut(b)}`;
}

function walk(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (
    d.isDirectory() ? walk(join(dir, d.name), base) : [relative(base, join(dir, d.name)).replace(/\\/g, '/')]
  ));
}

function readNormalised(file) {
  const buf = readFileSync(file);
  return TEXT.has(extname(file).toLowerCase()) ? normaliseDist(buf.toString('utf8')) : buf.toString('base64');
}

/** normalised path → sorted normalised contents. */
function tree(dir) {
  const map = new Map();
  walk(dir).forEach((path) => {
    const key = normaliseDist(path);
    map.set(key, [...(map.get(key) || []), readNormalised(join(dir, path))].sort());
  });
  return map;
}

function compareSite(problems) {
  const pages = readdirSync(opts.golden).filter((f) => f.endsWith('.html'));
  pages.forEach((page) => {
    const file = join(opts.site, page);
    if (!existsSync(file)) return void problems.push(`site/${page}: missing`);
    const golden = normaliseSite(readFileSync(join(opts.golden, page), 'utf8'));
    const actual = normaliseSite(readAssembled(file));
    if (golden !== actual) problems.push(`site/${page}: differs ${firstDiff(golden, actual)}`);
  });
  return pages.length;
}

function compareDist(problems) {
  const goldenDist = join(opts.golden, 'dist');
  if (!existsSync(opts.dist)) return void problems.push('dist: missing (run npm run build)');
  const golden = tree(goldenDist);
  const actual = tree(opts.dist);
  golden.forEach((contents, key) => {
    const got = actual.get(key);
    if (!got) return void problems.push(`dist/${key}: missing`);
    if (got.length !== contents.length) return void problems.push(`dist/${key}: ${got.length} files, golden has ${contents.length}`);
    const k = contents.findIndex((c, i) => c !== got[i]);
    if (k >= 0) problems.push(`dist/${key}: differs${contents.length > 1 ? ` (${contents.length} files share this name)` : ''} ${firstDiff(contents[k], got[k])}`);
  });
  actual.forEach((_, key) => { if (!golden.has(key)) problems.push(`dist/${key}: not in golden`); });
  return golden.size;
}

const problems = [];
const counts = [];
if (opts.only.includes('site')) counts.push(`${compareSite(problems)} site pages`);
if (opts.only.includes('dist')) counts.push(`${compareDist(problems) ?? 0} dist names`);
if (problems.length) {
  process.stdout.write(`golden-diff: ${problems.length} difference(s)\n${problems.map((p) => `  - ${p}`).join('\n')}\n`);
  process.exitCode = 1;
} else if (!opts.quiet) {
  process.stdout.write(`golden-diff: identical (${counts.join(', ')})\n`);
}
