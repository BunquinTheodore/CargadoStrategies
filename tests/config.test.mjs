/**
 * Config contract for v2 (plan Task 1): the six founder services, the orbit groups,
 * the insurance redirect, booking hours and the Firebase web config.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as config from '../site/assets/js/config.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SECTIONS = join(ROOT, 'site/sections');
const NEW_SLUGS = ['web-design', 'graphics', 'virtual-assistant', 'software-development', 'export-import', 'contractor'];

/** Every scene folder name under site/sections/<page>/<scene>/. */
function sceneFolderNames() {
  return readdirSync(SECTIONS, { withFileTypes: true })
    .filter((page) => page.isDirectory())
    .flatMap((page) => readdirSync(join(SECTIONS, page.name), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name));
}

const newCategories = () => NEW_SLUGS.map((slug) => config.categoryBySlug(slug));

test('the six new services are founder-owned categories', () => {
  newCategories().forEach((cat, k) => {
    assert.ok(cat, `missing category ${NEW_SLUGS[k]}`);
    assert.equal(cat.ownership, 'founder', `${cat.slug} ownership`);
  });
});

test('contractor lists its four items', () => {
  assert.deepEqual(config.categoryBySlug('contractor').items, ['Homecare Cleaning Services', 'Roofing', 'Cleaning', 'Gardening']);
});

test('no category slug equals a scene folder name', () => {
  const scenes = new Set(sceneFolderNames());
  config.CATEGORIES.forEach((c) => assert.ok(!scenes.has(c.slug), `slug ${c.slug} equals a scene id`));
});

test('no new category carries a price field', () => {
  newCategories().forEach((cat) => {
    Object.keys(cat).forEach((key) => assert.doesNotMatch(key, /price/i, `${cat.slug}.${key}`));
  });
});

test('orbit has ten groups in order, partner network goes to the finder', () => {
  const { ORBIT_GROUPS } = config;
  assert.equal(ORBIT_GROUPS.length, 10);
  assert.ok(Object.isFrozen(ORBIT_GROUPS));
  assert.deepEqual(ORBIT_GROUPS.map((g) => g.slug), [
    'insurance', 'business-strategy', 'outsourcing', ...NEW_SLUGS, 'partner-network',
  ]);
  ORBIT_GROUPS.forEach((g) => ['slug', 'name', 'href', 'preview'].forEach((k) => assert.equal(typeof g[k], 'string', `${g.slug}.${k}`)));
  assert.equal(ORBIT_GROUPS.at(-1).href, 'services.html#finder');
});

test('insurance inquiry url is the clean policy review link', () => {
  assert.equal(config.INSURANCE_INQUIRY_URL, 'https://policyreview.leeholgado.com/');
});

test('booking runs 15:30 to 21:00 Winnipeg in 10 minute slots', () => {
  const { BOOKING } = config;
  assert.equal(BOOKING.startMinutes, 930);
  assert.equal(BOOKING.endMinutes, 1260);
  assert.equal(BOOKING.timeZone, 'America/Winnipeg');
  assert.equal(BOOKING.slotMinutes, 10);
  assert.equal(BOOKING.leadHours, 2);
  assert.equal(BOOKING.horizonDays, 60);
});

test('founder photos keep FOUNDER_PHOTO as the navy default', () => {
  assert.deepEqual(Object.keys(config.FOUNDER_PHOTOS).sort(), ['cream', 'navy', 'poster']);
  assert.equal(config.FOUNDER_PHOTO, config.FOUNDER_PHOTOS.navy);
});

test('firebase web config is present, without analytics', () => {
  assert.equal(config.isFirebaseConfigured(), true);
  assert.equal('measurementId' in config.FIREBASE, false);
});

test('orbit legend is the owner wording', () => {
  assert.equal(config.ORBIT_LEGEND, 'Ours means Cargado Strategies provides it directly. Partners are independent local professionals.');
});
