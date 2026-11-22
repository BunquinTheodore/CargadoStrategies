/**
 * Cargado Strategies Lite (site-lite/, tools/build-lite.mjs): markup rules, config-sourced contact
 * values, the host rewrite config and the serve.mjs --lite routes. The build runs into a temp
 * folder, so these tests never touch dist/.
 */
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLite, liteHost, liteUrl, tokenBlock } from '../tools/build-lite.mjs';
import { ADDRESS_LINE, CONTACT_EMAIL, FACEBOOK_PAGE_NAME, PHONE, TAGLINE } from '../site/assets/js/config.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MAIN_URL = 'https://www.cargadostrategies.com';
const SERVE_PORT = 8697;
const read = (...parts) => readFileSync(join(ROOT, ...parts), 'utf8');

let out;
let css;
let js;
let home;
let book;
const readOut = (file) => readFileSync(join(out, file), 'utf8');

before(async () => {
  out = mkdtempSync(join(tmpdir(), 'lite-build-'));
  const built = await buildLite({ out, siteUrl: MAIN_URL });
  css = readOut(built.css.slice(1));
  js = readOut(built.js.slice(1));
  home = readOut('lite/index.html');
  book = readOut('lite/book.html');
});
after(() => rmSync(out, { recursive: true, force: true }));

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const liteSources = () => [read('site-lite', 'lite.css'), read('site-lite', 'index.html'), read('site-lite', 'book.html')];

test('the build writes both pages, robots.txt, sitemap.xml and the hashed assets', () => {
  assert.deepEqual(readdirSync(join(out, 'lite')).sort(), ['book.html', 'index.html', 'robots.txt', 'sitemap.xml']);
  assert.match(home, /<link rel="stylesheet" href="\/assets\/lite-[A-Z0-9]{8}\.css">/);
  assert.match(book, /<script type="module" src="\/assets\/lite-book-[A-Z0-9]{8}\.js"><\/script>/);
});

test('the home page needs no script; the booking page loads exactly one', () => {
  assert.doesNotMatch(home, /<script/i);
  assert.equal(book.match(/<script/gi).length, 1);
  assert.doesNotMatch(home + book, /\bon(click|load|error)=/i);
});

test('no animation, transition, keyframes or smooth scroll anywhere', () => {
  const all = [css, ...liteSources(), home, book].map(stripComments).join('\n');
  assert.doesNotMatch(all, /@keyframes/);
  assert.doesNotMatch(all, /animation\s*:(?!\s*none\b)/);
  assert.doesNotMatch(all, /transition\s*:(?!\s*none\b)/);
  assert.doesNotMatch(all, /(animation|transition)-(name|duration|property|delay)/);
  assert.doesNotMatch(all, /scroll-behavior\s*:\s*smooth/);
  assert.match(css, /animation:none!important/);
  assert.match(css, /transition:none!important/);
  assert.doesNotMatch(js, /\.animate\(|requestAnimationFrame|scrollIntoView\(\{[^}]*smooth/);
});

test('no console.log, no uppercase transform, no leading dash or rule before a label', () => {
  const sources = [...liteSources(), read('site-lite', 'lite-book.js'), read('site-lite', 'lite-book-core.js'), read('tools', 'build-lite.mjs')];
  sources.forEach((text) => assert.doesNotMatch(text, /console\./));
  assert.doesNotMatch(js, /console\./);
  assert.doesNotMatch(stripComments(css), /text-transform\s*:\s*uppercase/);
  assert.doesNotMatch(home + book, /[—–]/);
  assert.doesNotMatch(home + book, /class="eyebrow">\s*[-—–]/);
});

test('colours come from the base.css tokens: no new hex, no blue, one gold band, navy only as a background', () => {
  const hex = (text) => new Set((text.match(/#[0-9a-f]{6}\b/gi) || []).map((h) => h.toUpperCase()));
  const baseHex = hex(read('site', 'core', 'design', 'base.css'));
  const own = read('site-lite', 'lite.css');
  assert.equal(hex(own).size, 0, 'lite.css holds no hex literal: it uses var(--c-...)');
  assert.ok(hex(css).size > 0);
  [...hex(css)].forEach((h) => assert.ok(baseHex.has(h), `${h} is not a base.css token colour`));
  assert.doesNotMatch(own, /--c-gold(?!-field|-2nd)/, 'gold only through the gold band tokens');
  assert.equal((home.match(/data-field="gold"/g) || []).length, 1);
  assert.doesNotMatch(book, /data-field="gold"/);
  own.split('\n').filter((line) => /--navy/.test(line)).forEach((line) => assert.match(line, /background\s*:/, line));
  assert.doesNotMatch(own, /(?:color|border[a-z-]*|outline[a-z-]*)\s*:[^;]*--navy/);
});

test('no text below 14px', () => {
  const own = stripComments(read('site-lite', 'lite.css'));
  const sizes = [...own.matchAll(/font-size\s*:\s*([\d.]+)(px|rem)/g), ...own.matchAll(/font\s*:\s*[\d\s]*?([\d.]+)(px|rem)\s*\//g)];
  assert.ok(sizes.length > 0);
  sizes.forEach(([, n, unit]) => assert.ok((unit === 'rem' ? Number(n) * 16 : Number(n)) >= 14, `${n}${unit}`));
  assert.match(own, /var\(--fs-label\)/, 'small text uses the 14px label token');
});

test('the token block comes from base.css and carries no motion token or texture url', async () => {
  const block = await tokenBlock();
  assert.match(block, /--navy-deep: #0E172C/);
  assert.match(block, /--c-gold-field/);
  assert.doesNotMatch(block, /--ease|--dur-|url\(/);
});

test('canonical, og:url, robots and sitemap all point at the Lite host', () => {
  const base = liteUrl(MAIN_URL);
  assert.equal(base, `https://${liteHost(MAIN_URL)}`);
  assert.equal(liteHost(MAIN_URL), 'lite.cargadostrategies.com');
  assert.match(home, new RegExp(`<link rel="canonical" href="${base}/">`));
  assert.match(home, new RegExp(`<meta property="og:url" content="${base}/">`));
  assert.match(book, new RegExp(`<link rel="canonical" href="${base}/book">`));
  assert.doesNotMatch(home + book, /rel="canonical" href="https:\/\/www\./);
  assert.match(readOut('lite/robots.txt'), new RegExp(`Sitemap: ${base}/sitemap\\.xml`));
  const sitemap = readOut('lite/sitemap.xml');
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]), [`${base}/`, `${base}/book`]);
  const titles = [home, book].map((h) => h.match(/<title>([^<]+)<\/title>/)[1]);
  assert.notEqual(titles[0], 'Cargado Strategies');
  assert.notEqual(titles[0], titles[1]);
});

test('contact values equal config, and nothing else looks like a number or address', () => {
  assert.ok(home.includes(PHONE.display));
  assert.ok(home.includes(CONTACT_EMAIL));
  assert.ok(home.includes(ADDRESS_LINE));
  assert.ok(home.includes(`href="https://wa.me/${PHONE.whatsapp}"`));
  assert.ok(home.includes(`Facebook: ${FACEBOOK_PAGE_NAME}`));
  assert.doesNotMatch(home, /<a[^>]*>[^<]*Facebook[^<]*<\/a>/, 'the Facebook URL is a placeholder: plain text only');
  [home, book].forEach((html) => {
    assert.deepEqual([...new Set(html.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [])].filter((e) => e !== CONTACT_EMAIL), []);
    assert.deepEqual([...new Set(html.match(/\+?1?\s?\(\d{3}\)\s?\d{3}[\s-]\d{4}/g) || [])].filter((p) => p !== PHONE.display), []);
    assert.doesNotMatch(html, /href="tel:/);
    assert.doesNotMatch(html, /Log In|>Call<|We only message from/);
  });
  assert.ok(home.includes(TAGLINE.split('. ')[0]));
});

test('the page copy is lifted from the site, with no invented partner, stat or quote', () => {
  assert.match(home, /Send one message to Cargado Strategies\. It provides insurance, business strategy, outsourcing and more itself/);
  assert.match(home, /Partner spot available/);
  assert.doesNotMatch(home, /<blockquote|testimonial|★|\brated\b|\d+\+? (clients|years)/i);
  const spans = [...(home + book).matchAll(/<span class="ph">([^<]*)<\/span>/g)].map((m) => m[1]);
  spans.forEach((text) => assert.match(text, /^\[[^\]]+\]$/));
  const mainHome = readFileSync(join(ROOT, 'site', 'sections', 'home', 'hero', 'hero.html'), 'utf8');
  assert.ok(mainHome.includes('Send one message to Cargado Strategies. It provides insurance, business strategy, outsourcing and more itself, and introduces you to a trusted professional close to you for everything else.'));
});

test('links back to the main site and its legal page are absolute; the nav has no Log In', () => {
  [home, book].forEach((html) => {
    assert.match(html, new RegExp(`href="${MAIN_URL}/"`));
    assert.match(html, new RegExp(`href="${MAIN_URL}/legal"`));
    assert.match(html, /<a class="skip" href="#main">/);
    assert.match(html, /<main id="main">/);
  });
  assert.match(home, new RegExp(`href="${MAIN_URL}/partners"`));
  assert.match(home, /<section class="sec sec--band" id="book"[\s\S]*href="\/book"/);
});

test('the consent sentence is the main form\'s, verbatim, with an absolute privacy link and the lawyer marker', () => {
  const main = read('site', 'sections', 'contact', 'book', 'book.html');
  const sentence = (html) => html.match(/<span data-draft="pending-lawyer-review">([\s\S]*?)<\/span>/)[1];
  assert.equal(sentence(book), sentence(main).replace('href="legal.html#privacy"', `href="${MAIN_URL}/legal#privacy"`));
});

test('the booking bundle is small and carries no Firebase config', () => {
  assert.doesNotMatch(js, /firebase|AIza/i);
  assert.ok(js.length < 40 * 1024, `bundle is ${js.length} bytes`);
});

test('vercel.json rewrites only the Lite host, keeps the global headers, and marks /lite/* noindex', () => {
  const config = JSON.parse(read('vercel.json'));
  const host = liteHost(MAIN_URL);
  assert.deepEqual(config.rewrites.map((r) => r.source).sort(), ['/', '/book', '/robots.txt', '/sitemap.xml']);
  config.rewrites.forEach((r) => {
    assert.deepEqual(r.has, [{ type: 'host', value: host }]);
    assert.match(r.destination, /^\/lite(\/(book|robots\.txt|sitemap\.xml))?$/);
  });
  assert.equal(config.rewrites.some((r) => /assets|api/.test(r.source)), false);
  const lite = config.headers.find((h) => h.source === '/lite/(.*)');
  const value = (key) => lite.headers.find((h) => h.key === key).value;
  assert.equal(value('X-Robots-Tag'), 'noindex');
  assert.equal(value('Cache-Control'), 'public, max-age=0, must-revalidate');
  const global = config.headers.find((h) => h.source === '/(.*)');
  assert.deepEqual(global.headers.map((h) => h.key), ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Permissions-Policy']);
  assert.equal(config.cleanUrls, true);
  assert.equal(config.crons.length, 1);
});

test('build.mjs adds exactly one import and one call, and leaves PAGES and SHARED_CSS alone', () => {
  const build = read('build.mjs');
  assert.equal((build.match(/buildLite/g) || []).length, 2);
  assert.doesNotMatch(build.match(/const PAGES = \[[\s\S]*?\n\];/)[0], /lite/i);
  assert.doesNotMatch(build.match(/const SHARED_CSS = .*/)[0], /lite/i);
});

test('serve.mjs --lite answers the Lite routes from the lite folder and nothing else changes', async () => {
  const server = spawn(process.execPath, [join(ROOT, 'serve.mjs'), out, String(SERVE_PORT), '--lite'], { stdio: 'ignore' });
  try {
    const fetchRetry = async (path) => {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        try { return await fetch(`http://127.0.0.1:${SERVE_PORT}${path}`); } catch { await new Promise((r) => setTimeout(r, 100)); }
      }
      throw new Error('serve.mjs did not start');
    };
    assert.match(await (await fetchRetry('/')).text(), /<link rel="canonical" href="https:\/\/lite\./);
    assert.match(await (await fetchRetry('/book')).text(), /id="book-form"/);
    assert.match(await (await fetchRetry('/robots.txt')).text(), /Sitemap: https:\/\/lite\./);
    assert.match(await (await fetchRetry('/sitemap.xml')).text(), /<urlset/);
    assert.equal((await fetchRetry('/lite/book.html')).status, 200);
    assert.equal((await fetchRetry('/contact.html')).status, 404, 'the temp out folder holds no main pages');
  } finally {
    server.kill();
  }
});
