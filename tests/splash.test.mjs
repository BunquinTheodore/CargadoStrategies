import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPLASH_MS, splashWanted, counterAt, counterText, splashNames } from '../site/core/engine/splash.js';
import { SITE_NAME } from '../site/assets/js/config.js';

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const FILM_PAGES = ['index', 'services', 'story', 'partners', 'legal', 'contact'];
const ORIGIN = 'https://cargadostrategies.com';
const BLOCK = /  <!-- splash:[\s\S]*?<!-- \/splash -->\n/;

test('the splash plays only on an open and a refresh, not between the site\'s own pages', () => {
  assert.equal(splashWanted({ type: 'navigate', referrer: '', origin: ORIGIN }), true);
  assert.equal(splashWanted({ type: 'reload', referrer: `${ORIGIN}/services.html`, origin: ORIGIN }), true);
  assert.equal(splashWanted({ type: 'navigate', referrer: 'https://www.google.com/', origin: ORIGIN }), true);
  assert.equal(splashWanted({ type: 'navigate', referrer: `${ORIGIN}/index.html`, origin: ORIGIN }), false);
  assert.equal(splashWanted({ type: 'back_forward', referrer: '', origin: ORIGIN }), false);
  assert.equal(splashWanted({ type: 'navigate', referrer: 'not a url', origin: ORIGIN }), true);
});

test('the intro stays inside 4 s and the aperture comes before the end', () => {
  assert.ok(SPLASH_MS.end <= 4000);
  assert.ok(SPLASH_MS.aperture < SPLASH_MS.end);
  assert.ok(SPLASH_MS.countFrom < SPLASH_MS.countTo);
});

test('the counter runs 00 to 100 and never goes back', () => {
  assert.equal(counterText(counterAt(0)), '00');
  assert.equal(counterText(counterAt(SPLASH_MS.countTo)), '100');
  assert.equal(counterText(7), '07');
  let last = -1;
  for (let ms = 0; ms <= SPLASH_MS.countTo + 100; ms += 25) {
    const n = counterAt(ms);
    assert.ok(n >= last && n <= 100);
    last = n;
  }
});

test('the name card reads config', () => {
  const names = splashNames({ SITE_NAME: 'Cargado Strategies', FOUNDER_NAME: 'Lee', FOUNDER_LAST_NAME: 'Holgado', ADDRESS: { city: 'Winnipeg', province: 'MB' } });
  assert.deepEqual(names.lines, ['Cargado', 'Strategies']);
  assert.equal(names.founder, 'Lee Holgado, Founder');
  assert.equal(names.city, 'Winnipeg, MB');
  assert.deepEqual(splashNames({ SITE_NAME: '', FOUNDER_NAME: '', ADDRESS: null }), { lines: [], founder: '', city: '' });
  assert.equal(splashNames().lines.join(' '), SITE_NAME);
});

test('every film shell carries the same splash block, aria-hidden, with nothing focusable', () => {
  const blocks = FILM_PAGES.map((page) => readFileSync(join(SITE, `${page}.html`), 'utf8').match(BLOCK)?.[0]);
  blocks.forEach((block, i) => assert.ok(block, `${FILM_PAGES[i]} has the splash`));
  blocks.forEach((block) => assert.equal(block, blocks[0]));
  const [block] = blocks;
  assert.match(block, /id="splash" aria-hidden="true"/);
  assert.doesNotMatch(block, /<(a|button|input)\b|tabindex/);
  assert.doesNotMatch(block, /sessionStorage/);
  assert.match(block, /back_forward/);
  assert.match(block, /origin===location\.origin/);
});
