import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Calm motion (client 2026-11-07): one classic cut and one rise entrance on every scene, so the
   markup carries no per-scene transition or entrance and no magnetic pull. */

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const SECTIONS = join(SITE, 'sections');
const FILM_PAGES = ['index', 'services', 'story', 'partners', 'legal', 'contact'];
const BANNED = /data-transition=|data-entrance=|data-magnetic/;
const SCENE_TAG = /<section\s[^>]*class="scene[^"]*"[^>]*>/;

const partials = () => readdirSync(SECTIONS, { recursive: true })
  .filter((f) => f.endsWith('.html'))
  .map((f) => join(SECTIONS, f));

test('no partial or film shell carries a transition, an entrance or a magnetic pull', () => {
  const files = [...partials(), ...FILM_PAGES.map((page) => join(SITE, `${page}.html`))];
  assert.ok(files.length > FILM_PAGES.length);
  files.forEach((file) => assert.doesNotMatch(readFileSync(file, 'utf8'), BANNED, file));
});

test('every film scene still has its reveal groups (the credits have none)', () => {
  FILM_PAGES.forEach((page) => {
    const shell = readFileSync(join(SITE, `${page}.html`), 'utf8');
    const names = [...shell.matchAll(/<!-- @section ([\w-]+\/[\w-]+) -->/g)].map((m) => m[1]);
    assert.ok(names.length, `${page}: no section markers`);
    names.forEach((name) => {
      const file = join(SECTIONS, name, `${name.split('/')[1]}.html`);
      if (!existsSync(file)) return;
      const html = readFileSync(file, 'utf8');
      const tag = html.match(SCENE_TAG)?.[0];
      if (!tag || /scene--credits/.test(tag)) return;
      assert.match(html, /data-group="/, `${page}: ${name} has no data-group`);
    });
  });
});
