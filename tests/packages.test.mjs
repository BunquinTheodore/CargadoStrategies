/**
 * Packages (owner, 2026-11-01): three per own service in config, a "See Packages" button on
 * each own scene, and the dialog cards (placeholders marked, owner copy escaped). Outsourcing
 * is merged into Virtual Assistant (its back-office scene).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, ORBIT_GROUPS, PACKAGES, categoryBySlug } from '../site/assets/js/config.js';
import { readAssembled } from '../tools/lib/assemble.mjs';
import { FOUNDER_OFFERS } from '../site/sections/services/services-data.js';

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const TIERS = 3;
const NO_PACKAGES = new Set(['insurance']);   // policies are quoted per person
const ownSlugs = () => CATEGORIES.filter((c) => c.ownership === 'founder' || c.ownership === 'both').map((c) => c.slug);

test('every own service but insurance has three complete packages', () => {
  const want = ownSlugs().filter((slug) => !NO_PACKAGES.has(slug)).sort();
  assert.deepEqual(Object.keys(PACKAGES).sort(), want);
  Object.entries(PACKAGES).forEach(([slug, packs]) => {
    assert.equal(packs.length, TIERS, slug);
    packs.forEach((p) => {
      ['name', 'price', 'bonus', 'free'].forEach((k) => assert.ok(typeof p[k] === 'string' && p[k].trim(), `${slug}.${k}`));
      assert.ok(p.includes.length > 0 && p.includes.every((line) => typeof line === 'string' && line.trim()), `${slug}.includes`);
    });
  });
});

test('every See Packages button names a configured service, and each package service has one', () => {
  const html = readAssembled(`${SITE}services.html`);
  const slugs = [...html.matchAll(/data-packages="([\w-]+)"/g)].map((m) => m[1]);
  slugs.forEach((slug) => assert.ok(PACKAGES[slug], slug));
  Object.keys(PACKAGES).forEach((slug) => assert.ok(slugs.includes(slug), `button for ${slug}`));
  assert.doesNotMatch(html, /No prices online/);
  assert.match(html, /<dialog class="dialog packages-dialog" id="packages-dialog"/);
});

test('outsourcing is merged into Virtual Assistant', () => {
  assert.equal(categoryBySlug('outsourcing'), undefined);
  assert.ok(!ORBIT_GROUPS.some((g) => g.slug === 'outsourcing'));
  assert.equal(FOUNDER_OFFERS['virtual-assistant'].scene, 'ours-outsourcing');
  const scene = readFileSync(`${SITE}sections/services/ours-outsourcing/ours-outsourcing.html`, 'utf8');
  assert.match(scene, /data-alias="virtual-assistant outsourcing"/);
  assert.match(scene, /<p class="eyebrow">Ours · Virtual Assistant<\/p>/);
});

test('package cards mark placeholders and escape owner copy', async () => {
  globalThis.document ||= undefined;
  const { packageCard } = await import('../site/sections/services/packages-dialog/PackagesDialog.js');
  const card = packageCard({ name: 'Standard', price: '[$x]', includes: ['<b>Two</b> posts'], bonus: '[Bonus]', free: 'A free review' }, 'graphics', 2);
  assert.match(card, /<span class="ph">\[\$x\]<\/span>/);
  assert.match(card, /&lt;b&gt;Two&lt;\/b&gt; posts/);
  assert.match(card, /<dd>A free review<\/dd>/);
  assert.match(card, /href="contact\.html\?service=graphics#book"/);
});

test('every service photo the scenes defer to exists, with its Unsplash credits', () => {
  const html = readAssembled(`${SITE}services.html`);
  const files = [...html.matchAll(/data-srcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((part) => part.trim().split(/\s+/)[0]));
  assert.ok(files.length >= 20, `${files.length} photo files`);
  files.forEach((file) => assert.ok(existsSync(`${SITE}${file}`), file));
  assert.ok(existsSync(`${SITE}assets/img/services/CREDITS.md`));
});
