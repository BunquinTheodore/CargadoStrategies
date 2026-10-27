import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FOUNDER_PHOTOS, ORBIT_GROUPS } from '../site/assets/js/config.js';
import { MARK_PATHS } from '../site/core/engine/mark-draw.js';

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const read = (path) => readFileSync(SITE + path, 'utf8');
const WORD_BUDGET = 60;

const orbitHtml = () => read('sections/home/orbit/orbit.html');
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

test('home orbit partial is one ink stage scene with no trailing newline', () => {
  const html = orbitHtml();
  const open = html.match(/^<section [^>]*>/)?.[0];
  assert.ok(open, 'starts with the <section>');
  assert.equal(attr(open, 'id'), 'orbit');
  assert.equal(attr(open, 'data-field'), 'ink');
  assert.equal(attr(open, 'data-archetype'), 'stage');
  assert.ok(attr(open, 'data-title'));
  assert.ok(html.endsWith('</section>'), 'no trailing newline');
});

test('home orbit renders one static node per ORBIT_GROUPS entry, in order', () => {
  const nodes = [...orbitHtml().matchAll(/<a class="orbit__node" href="([^"]+)" data-slug="([^"]+)"><span class="orbit__label">([^<]+)<\/span><\/a>/g)];
  assert.deepEqual(
    nodes.map(([, href, slug, name]) => ({ href, slug, name })),
    ORBIT_GROUPS.map(({ href, slug, name }) => ({ href, slug, name })),
  );
});

test('home orbit centre carries the shared mark paths', () => {
  const html = orbitHtml();
  assert.match(html, /<div class="orbit__centre"><div class="mark" aria-hidden="true">/);
  for (const [part, d] of Object.entries(MARK_PATHS)) {
    assert.match(html, new RegExp(`<svg class="mark__${part}"[^>]*><path d="${d}" pathLength="100"`));
  }
});

test('home orbit stays within the word and group budgets', () => {
  const html = orbitHtml();
  const text = html.replace(/<span class="visually-hidden">[^<]*<\/span>/g, '').replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter((w) => /\p{L}|\p{N}/u.test(w));
  assert.ok(words.length <= WORD_BUDGET, `${words.length} words`);
  assert.ok((html.match(/data-group="/g) || []).length <= 3);
});

test('the Home shell puts the orbit right after the hero', () => {
  const markers = [...read('index.html').matchAll(/<!-- @section (home\/[\w-]+) -->/g)].map((m) => m[1]);
  assert.equal(markers[markers.indexOf('home/hero') + 1], 'home/orbit');
});

test('home.css imports the shared orbit CSS before the scene CSS and the bands', () => {
  const imports = [...read('pages/home.css').matchAll(/@import "([^"]+)";/g)].map((m) => m[1]);
  const core = imports.indexOf('../core/design/orbit.css');
  const scene = imports.indexOf('../sections/home/orbit/orbit.css');
  assert.ok(core >= 0 && scene > core, 'core orbit.css first');
  assert.ok(scene < imports.indexOf('../sections/home/_bands.css'), 'before the bands');
});

test('every founder photo slot names a photo that exists (cream on the Story portrait only)', () => {
  // Owner, 2026-10-25: no founder photo in the Home hero lead or the Home founder scene.
  for (const path of ['sections/home/hero/hero.html', 'sections/home/founder/founder.html', 'sections/story/close/close.html']) {
    assert.doesNotMatch(read(path), /data-founder-photo/, path);
  }
  const slots = {
    'sections/story/top/top.html': 'cream',
  };
  for (const [path, want] of Object.entries(slots)) {
    const named = [...read(path).matchAll(/data-founder-photo(?:="([^"]*)")?/g)].map((m) => m[1]);
    assert.ok(named.length > 0, `${path} has a slot`);
    named.forEach((name) => assert.equal(name, want, path));
    assert.ok(FOUNDER_PHOTOS[want], `FOUNDER_PHOTOS.${want} is set`);
  }
});
