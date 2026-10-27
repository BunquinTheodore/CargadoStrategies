import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, FOUNDER_PHOTOS, INSURANCE_INQUIRY_URL, ORBIT_GROUPS, ORBIT_LEGEND, categoryBySlug } from '../site/assets/js/config.js';
import { MARK_PATHS } from '../site/core/engine/mark-draw.js';
import { readAssembled } from '../tools/lib/assemble.mjs';
import {
  BOOK_CTA, FOUNDER_OFFERS, INSURANCE_HINT, bookingHref, insuranceLink, isOurs,
} from '../site/sections/services/services-data.js';
import { FOUNDER_LINES } from '../site/sections/services/categories-dialog/services-categories.js';
import { insuranceRedirect } from '../site/sections/services/inquiry/services-inquiry.js';

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const read = (path) => readFileSync(SITE + path, 'utf8');
const WORD_BUDGET = 60;
const GROUP_BUDGET = 3;

/** The founder's own new services, one scene each (Graphics and Virtual Assistant share one). */
const OWN_SCENES = [
  { id: 'ours-web', aliases: ['web-design'], field: 'ink', archetype: 'M' },
  { id: 'ours-creative', aliases: ['graphics', 'virtual-assistant'], field: 'bone', archetype: 'D' },
  { id: 'ours-software', aliases: ['software-development'], field: 'ink', archetype: 'M' },
  { id: 'ours-contractor', aliases: ['contractor'], field: 'bone', archetype: 'R' },
  { id: 'ours-trade', aliases: ['export-import'], field: 'ink', archetype: 'M' },
];
const NEW_SLUGS = OWN_SCENES.flatMap((s) => s.aliases);

const partial = (name) => read(`sections/services/${name}/${name}.html`);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const openTag = (html) => html.match(/^<section [^>]*>/)?.[0];
const markers = () => [...read('services.html').matchAll(/<!-- @section (services\/[\w-]+) -->/g)].map((m) => m[1]);
const visibleWords = (html) => html
  .replace(/<span class="visually-hidden">[^<]*<\/span>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .split(/\s+/)
  .filter((w) => /\p{L}|\p{N}/u.test(w));
const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Every film scene of the assembled page, in order: { id, aliases, field, archetype }. */
function scenes() {
  const html = readAssembled(`${SITE}services.html`);
  return [...html.matchAll(/<section class="scene[^"]*"[^>]*>/g)].map(([tag]) => ({
    id: attr(tag, 'id'),
    aliases: (attr(tag, 'data-alias') || '').split(/\s+/).filter(Boolean),
    field: attr(tag, 'data-field'),
    archetype: attr(tag, 'data-archetype'),
  }));
}

test('the orbit replaces the intro as the first scene; the new scenes follow outsourcing', () => {
  const list = markers();
  assert.equal(list[0], 'services/orbit');
  assert.ok(!list.includes('services/intro'));
  assert.ok(!existsSync(`${SITE}sections/services/intro`), 'intro/ is deleted');
  const at = list.indexOf('services/ours-outsourcing');
  assert.deepEqual(list.slice(at + 1, at + 1 + OWN_SCENES.length), OWN_SCENES.map((s) => `services/${s.id}`));
  assert.equal(list[at + 1 + OWN_SCENES.length], 'services/finder');
});

test('each new scene partial is one scene with its id, field, archetype and aliases, no trailing newline', () => {
  for (const want of [{ id: 'orbit', aliases: [], field: 'ink', archetype: 'stage' }, ...OWN_SCENES]) {
    const html = partial(want.id);
    const open = openTag(html);
    assert.ok(open, `${want.id} starts with <section>`);
    assert.equal(attr(open, 'id'), want.id);
    assert.equal(attr(open, 'data-field'), want.field, want.id);
    assert.equal(attr(open, 'data-archetype'), want.archetype, want.id);
    assert.deepEqual((attr(open, 'data-alias') || '').split(/\s+/).filter(Boolean), want.aliases, want.id);
    assert.ok(attr(open, 'data-title'), `${want.id} has a data-title`);
    assert.ok(html.endsWith('</section>'), `${want.id}: no trailing newline`);
  }
});

test('the new scenes keep the word and group budgets', () => {
  for (const id of ['orbit', ...OWN_SCENES.map((s) => s.id)]) {
    const html = partial(id);
    assert.ok(visibleWords(html).length <= WORD_BUDGET, `${id}: ${visibleWords(html).length} words`);
    assert.ok((html.match(/data-group="/g) || []).length <= GROUP_BUDGET, `${id}: groups`);
  }
});

test('no scene id equals a category slug, and every new slug resolves to a scene alias', () => {
  const list = scenes();
  const ids = new Set(list.map((s) => s.id));
  CATEGORIES.forEach((c) => assert.ok(!ids.has(c.slug), `scene id ${c.slug}`));
  const aliases = new Set(list.flatMap((s) => s.aliases));
  NEW_SLUGS.forEach((slug) => assert.ok(aliases.has(slug), `alias ${slug}`));
});

test('every orbit group link lands on a services scene (id or alias)', () => {
  const targets = new Set(scenes().flatMap((s) => [s.id, ...s.aliases]));
  ORBIT_GROUPS.forEach(({ href }) => {
    const [page, hash] = href.split('#');
    assert.equal(page, 'services.html');
    assert.ok(targets.has(hash), href);
  });
});

test('the page rhythm: no neighbouring archetype repeats, gold once, ink at least half', () => {
  const list = scenes();
  list.forEach((s, i) => {
    if (i && !/^(stage|credits)$/.test(s.archetype)) assert.notEqual(s.archetype, list[i - 1].archetype, `#${list[i - 1].id} / #${s.id}`);
  });
  assert.equal(list.filter((s) => s.field === 'gold').length, 1);
  assert.ok(list.filter((s) => s.field === 'ink').length * 2 >= list.length);
});

test('the services orbit: one static node per group in order, the mark, the owner legend', () => {
  const html = partial('orbit');
  const nodes = [...html.matchAll(/<a class="orbit__node" href="([^"]+)" data-slug="([^"]+)"><span class="orbit__label">([^<]+)<\/span><\/a>/g)];
  assert.deepEqual(nodes.map(([, , slug, name]) => ({ slug, name })), ORBIT_GROUPS.map(({ slug, name }) => ({ slug, name })));
  const targets = new Set(scenes().flatMap((s) => [s.id, ...s.aliases]));
  nodes.forEach(([, href]) => assert.ok(href.startsWith('#') && targets.has(href.slice(1)), href));
  assert.match(html, /<div class="orbit__centre"><div class="mark" aria-hidden="true">/);
  for (const [part, d] of Object.entries(MARK_PATHS)) {
    assert.match(html, new RegExp(`<svg class="mark__${part}"[^>]*><path d="${d}" pathLength="100"`));
  }
  const legend = html.match(/<p class="[^"]*sorbit__legend[^"]*"[^>]*>([\s\S]*?)<\/p>/)?.[1];
  assert.equal(plain(legend || ''), ORBIT_LEGEND);
});

test('services.css imports the shared orbit CSS before the orbit scene, and every new scene before the bands', () => {
  const imports = [...read('pages/services.css').matchAll(/@import "([^"]+)";/g)].map((m) => m[1]);
  const core = imports.indexOf('../core/design/orbit.css');
  const orbit = imports.indexOf('../sections/services/orbit/orbit.css');
  const bands = imports.indexOf('../sections/services/_bands.css');
  assert.ok(core >= 0 && orbit > core, 'core orbit.css first');
  assert.ok(!imports.some((p) => p.includes('/intro/')));
  OWN_SCENES.forEach(({ id }) => {
    const at = imports.indexOf(`../sections/services/${id}/${id}.css`);
    assert.ok(at > orbit && at < bands, id);
  });
  imports.forEach((p) => assert.ok(existsSync(`${SITE}pages/${p}`), p));
});

test('every founder-owned category has an offer and a credential line; new ones book a consultation', () => {
  const ours = CATEGORIES.filter((c) => c.ownership === 'founder' || c.ownership === 'both');
  assert.ok(ours.every(isOurs));
  const ids = new Set(scenes().map((s) => s.id));
  ours.forEach(({ slug }) => {
    const offer = FOUNDER_OFFERS[slug];
    assert.ok(offer, `FOUNDER_OFFERS.${slug}`);
    assert.ok(ids.has(offer.scene), `${slug} → #${offer.scene}`);
    assert.ok(FOUNDER_LINES[slug], `FOUNDER_LINES.${slug}`);
  });
  NEW_SLUGS.forEach((slug) => {
    assert.equal(FOUNDER_OFFERS[slug].cta, BOOK_CTA);
    assert.equal(FOUNDER_OFFERS[slug].href, bookingHref(slug));
  });
  assert.equal(BOOK_CTA, 'Book a Free Consultation');
  assert.equal(bookingHref('web-design'), 'contact.html?service=web-design#book');
});

test('the new scenes book a consultation: the CTA links to Contact, the description comes from config', () => {
  OWN_SCENES.forEach(({ id, aliases }) => {
    const html = partial(id);
    const ctas = [...html.matchAll(/<a class="btn btn--primary" href="([^"]+)"[^>]*>([^<]+)</g)];
    assert.equal(ctas.length, 1, `${id}: one primary CTA`);
    assert.equal(ctas[0][2].trim(), BOOK_CTA, id);
    assert.ok(ctas[0][1].startsWith('contact.html') && ctas[0][1].endsWith('#book'), id);
    if (aliases.length === 1) assert.equal(ctas[0][1], bookingHref(aliases[0]), id);
    aliases.forEach((slug) => {
      const desc = html.match(new RegExp(`data-category-desc="${slug}"[^>]*>([\\s\\S]*?)</p>`))?.[1];
      assert.equal(plain(desc || ''), categoryBySlug(slug).description, `${id}: ${slug} description`);
    });
    assert.ok(!/wa\.me\/\d/.test(html), `${id}: no hardcoded phone`);
  });
});

test('the contractor scene lists its four items from config', () => {
  const html = partial('ours-contractor');
  const items = [...html.matchAll(/<span class="[^"]*own__item[^"]*">([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(items, [...categoryBySlug('contractor').items]);
});

test('insurance: the policy review link with its hint, and the old behaviour when the URL is empty', () => {
  assert.equal(INSURANCE_HINT, 'Opens the policy review site');
  assert.deepEqual(insuranceLink(INSURANCE_INQUIRY_URL), { href: INSURANCE_INQUIRY_URL, hint: INSURANCE_HINT });
  assert.equal(insuranceLink(''), null);
  const html = partial('ours-insurance');
  assert.match(html, /data-insurance-cta[^>]*>Ask About Insurance/);
  assert.doesNotMatch(html, /data-insurance-hint/);   // owner, 2026-10-25: no hint under it on this scene
  assert.match(html, /href="contact\.html\?service=insurance#book">Book a Free Consultation</);
  assert.match(html, /data-founder-photo="navy"/);
  assert.ok(FOUNDER_PHOTOS.navy);
});

test('the inquiry form offers the policy review site only when insurance is chosen', () => {
  assert.equal(insuranceRedirect('insurance', INSURANCE_INQUIRY_URL)?.href, INSURANCE_INQUIRY_URL);
  assert.match(insuranceRedirect('insurance', INSURANCE_INQUIRY_URL).text, /^Continue on the policy review site/);
  assert.equal(insuranceRedirect('legal', INSURANCE_INQUIRY_URL), null);
  assert.equal(insuranceRedirect('insurance', ''), null);
});
