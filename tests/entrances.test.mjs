import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENTRANCES, DEFAULT_ENTRANCE, parseEntrance, wordStates, itemStates } from '../site/core/engine/entrances.js';

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const ALLOWED = new Set(['x', 'y', 'xPercent', 'yPercent', 'scale', 'scaleX', 'scaleY', 'opacity', 'clipPath', 'clearProps']);

test('parseEntrance falls back to rise', () => {
  assert.equal(DEFAULT_ENTRANCE, 'rise');
  assert.equal(parseEntrance(' Wipe '), 'wipe');
  assert.equal(parseEntrance('spin'), 'rise');
  assert.equal(parseEntrance(undefined), 'rise');
});

test('every entrance moves only transform, opacity and clip-path, and lands visible', () => {
  ENTRANCES.forEach((name) => {
    [wordStates(name), itemStates(name)].forEach(({ from, to }) => {
      [...Object.keys(from), ...Object.keys(to)].forEach((key) => assert.ok(ALLOWED.has(key), `${name}: ${key}`));
      if ('opacity' in from) assert.equal(to.opacity, 1, `${name} ends opaque`);
      if ('clipPath' in from) assert.equal(to.clipPath, 'inset(0% 0% 0% 0%)', `${name} ends open`);
    });
    assert.equal(itemStates(name).to.opacity, 1);
  });
});

test('the entrances differ from each other', () => {
  const seen = new Set(ENTRANCES.map((name) => JSON.stringify(wordStates(name).from)));
  assert.equal(seen.size, ENTRANCES.length);
});

test('neighbouring scenes on every film page enter differently', () => {
  ['index', 'services', 'story', 'partners', 'legal', 'contact'].forEach((page) => {
    const shell = readFileSync(join(SITE, `${page}.html`), 'utf8');
    const names = [...shell.matchAll(/<!-- @section ([\w-]+\/[\w-]+) -->/g)].map((m) => m[1]);
    const looks = names.map((name) => {
      const file = join(SITE, 'sections', name, `${name.split('/')[1]}.html`);
      return existsSync(file) ? readFileSync(file, 'utf8').match(/<section\s[^>]*class="scene[^"]*"[^>]*>/)?.[0] : null;
    }).filter(Boolean).map((tag) => tag.match(/data-entrance="([^"]*)"/)?.[1]);
    assert.ok(looks.every((v) => ENTRANCES.includes(v)), `${page}: ${looks.join(',')}`);
    for (let i = 1; i < looks.length; i += 1) assert.notEqual(looks[i], looks[i - 1], `${page} scene ${i}`);
  });
});
