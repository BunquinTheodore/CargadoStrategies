/**
 * check-config (R4 services.md §7.7, DIRECTION §5 C19 / §14): validates site/assets/js/config.js
 * before a build. build.mjs runs it first and stops on any error.
 *
 *   node tools/check-config.mjs [--fixture=partners-max]   (also checks a fit-audit fixture)
 *
 * PARTNERS: every displayed field is capped (the services §7.7 table), ids are unique, the
 * category is a partner-capable CATEGORIES slug, types belong to that category, coordinates
 * are in Canada and the province is a Canadian code.
 * Round 5 keys (when present): HERO_VARIANT is 'network' | 'triad', FINDER_MIN_PARTNERS is a
 * positive integer, FOOTER_SWITCHES is boolean, and proof keys (STATS, RATING, QUOTES,
 * FOUNDING_LIVE, FOUNDER_PHOTO, VIDEO_URL) are never an empty array or object, which would be
 * truthy and render a [data-when] slot with nothing real in it.
 * v2 keys (when present): CATEGORIES shape (unique slugs, ownership, items, no price fields),
 * ORBIT_GROUPS, BOOKING hours, INSURANCE_INQUIRY_URL, FOUNDER_PHOTOS and FIREBASE (no Analytics).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = join(ROOT, 'site/assets/js/config.js');

/** services.md §7.7: characters for strings, entries for lists. */
export const PARTNER_CAPS = Object.freeze({
  business: 40, name: 30, city: 24, serviceArea: 40, credential: 40, issuingBody: 40, description: 140,
  types: 3, languages: 3,
});
const REQUIRED = ['id', 'business', 'name', 'category', 'city', 'province', 'lat', 'lon'];
const PROVINCES = new Set(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']);
const CANADA = { latMin: 41.6, latMax: 83.2, lonMin: -141.1, lonMax: -52.6 };
const HERO_VARIANTS = new Set(['network', 'triad']);
const PROOF_KEYS = ['STATS', 'RATING', 'QUOTES', 'FOUNDING_LIVE', 'FOUNDER_PHOTO', 'VIDEO_URL'];

/** Validate a partner list against the categories. Returns error strings. */
export function checkPartners(partners, categories, label = 'PARTNERS') {
  const errors = [];
  if (!Array.isArray(partners)) return [`${label} must be an array`];
  const ids = new Set();
  partners.forEach((p, k) => {
    const at = `${label}[${k}]${p && p.id ? ` (${p.id})` : ''}`;
    if (!p || typeof p !== 'object') return void errors.push(`${at}: not an object`);
    REQUIRED.forEach((f) => { if (p[f] === undefined || p[f] === '') errors.push(`${at}: missing ${f}`); });
    if (ids.has(p.id)) errors.push(`${at}: duplicate id`);
    ids.add(p.id);
    Object.entries(PARTNER_CAPS).forEach(([field, cap]) => {
      const v = p[field];
      if (v === undefined || v === null) return;
      const n = Array.isArray(v) ? v.length : String(v).length;
      if (n > cap) errors.push(`${at}: ${field} is ${n} ${Array.isArray(v) ? 'entries' : 'characters'}, cap ${cap}`);
    });
    const cat = categories.find((c) => c.slug === p.category);
    if (!cat) errors.push(`${at}: unknown category "${p.category}"`);
    else if (cat.ownership === 'founder') errors.push(`${at}: category "${p.category}" is founder-only`);
    else {
      const slugs = new Set((cat.types || []).map((t) => t.slug));
      (p.types || []).forEach((t) => { if (!slugs.has(t)) errors.push(`${at}: type "${t}" is not a ${p.category} type`); });
    }
    if (p.province && !PROVINCES.has(p.province)) errors.push(`${at}: province "${p.province}" is not a Canadian code`);
    const inCanada = p.lat >= CANADA.latMin && p.lat <= CANADA.latMax && p.lon >= CANADA.lonMin && p.lon <= CANADA.lonMax;
    if (typeof p.lat !== 'number' || typeof p.lon !== 'number' || !inCanada) errors.push(`${at}: lat/lon ${p.lat},${p.lon} not in Canada`);
    if (p.whatsapp !== undefined && !/^\d{10,15}$/.test(String(p.whatsapp))) errors.push(`${at}: whatsapp must be 10-15 digits`);
  });
  return errors;
}

/** Validate the Round 5 keys that exist. Returns error strings. */
export function checkRound5(config) {
  const errors = [];
  if ('HERO_VARIANT' in config && !HERO_VARIANTS.has(config.HERO_VARIANT)) errors.push(`HERO_VARIANT "${config.HERO_VARIANT}" is not ${[...HERO_VARIANTS].join(' | ')}`);
  if ('FINDER_MIN_PARTNERS' in config && !(Number.isInteger(config.FINDER_MIN_PARTNERS) && config.FINDER_MIN_PARTNERS > 0)) errors.push('FINDER_MIN_PARTNERS must be a positive integer');
  if ('FOOTER_SWITCHES' in config && typeof config.FOOTER_SWITCHES !== 'boolean') errors.push('FOOTER_SWITCHES must be true or false');
  PROOF_KEYS.filter((k) => k in config).forEach((k) => {
    const v = config[k];
    const emptyBox = v && typeof v === 'object' && (Array.isArray(v) ? v.length === 0 : Object.keys(v).length === 0);
    if (emptyBox) errors.push(`${k} is an empty ${Array.isArray(v) ? 'array' : 'object'}: truthy, so its [data-when] slot would render; use null, '' or false`);
  });
  return errors;
}

const OWNERSHIPS = new Set(['founder', 'partner', 'both']);
const ORBIT_KEYS = ['slug', 'name', 'href', 'preview'];
const PHOTO_KEYS = ['navy', 'cream', 'poster'];
const MINUTES_PER_DAY = 1440;

/** CATEGORIES: unique slugs, known ownership, optional items as strings, no prices online. */
function checkCategories(categories) {
  const errors = [];
  const slugs = new Set();
  categories.forEach((c, k) => {
    const at = `CATEGORIES[${k}]${c?.slug ? ` (${c.slug})` : ''}`;
    if (slugs.has(c.slug)) errors.push(`${at}: duplicate slug`);
    slugs.add(c.slug);
    if (!OWNERSHIPS.has(c.ownership)) errors.push(`${at}: ownership "${c.ownership}" is not ${[...OWNERSHIPS].join(' | ')}`);
    if ('items' in c && !(Array.isArray(c.items) && c.items.every((i) => typeof i === 'string' && i))) errors.push(`${at}: items must be a list of names`);
    Object.keys(c).filter((key) => /price/i.test(key)).forEach((key) => errors.push(`${at}: "${key}": no prices online`));
  });
  return errors;
}

/** v2 keys (when present): orbit groups, booking hours, insurance link, photos, Firebase. */
export function checkV2(config) {
  const errors = [];
  if (Array.isArray(config.CATEGORIES)) errors.push(...checkCategories(config.CATEGORIES));
  if ('ORBIT_GROUPS' in config) {
    const groups = config.ORBIT_GROUPS;
    if (!Array.isArray(groups) || !groups.length) errors.push('ORBIT_GROUPS must be a non-empty list');
    else groups.forEach((g, k) => ORBIT_KEYS.forEach((key) => {
      if (typeof g?.[key] !== 'string' || !g[key]) errors.push(`ORBIT_GROUPS[${k}]: missing ${key}`);
    }));
  }
  if ('BOOKING' in config) {
    const b = config.BOOKING || {};
    const ints = ['startMinutes', 'endMinutes', 'slotMinutes', 'leadHours', 'horizonDays'];
    ints.filter((key) => !(Number.isInteger(b[key]) && b[key] >= 0)).forEach((key) => errors.push(`BOOKING.${key} must be a whole number`));
    if (!(b.startMinutes < b.endMinutes && b.endMinutes <= MINUTES_PER_DAY)) errors.push('BOOKING: startMinutes must be before endMinutes, within one day');
    if (!(b.slotMinutes > 0) || (b.endMinutes - b.startMinutes) % b.slotMinutes) errors.push('BOOKING: the day must split into whole slots');
    if (typeof b.timeZone !== 'string' || !b.timeZone) errors.push('BOOKING.timeZone is missing');
  }
  const url = config.INSURANCE_INQUIRY_URL;
  if (url && !/^https:\/\/[^\s?#]+\/?$/.test(url)) errors.push('INSURANCE_INQUIRY_URL must be a plain https link (no query string) or empty');
  if ('FOUNDER_PHOTOS' in config) {
    PHOTO_KEYS.filter((key) => typeof config.FOUNDER_PHOTOS?.[key] !== 'string').forEach((key) => errors.push(`FOUNDER_PHOTOS.${key} must be a path or ''`));
  }
  if (config.FIREBASE && 'measurementId' in config.FIREBASE) errors.push('FIREBASE.measurementId: the site never loads Analytics; remove it');
  return errors;
}

/** Load config.js and run every check. Returns { errors, partners }. */
export async function checkConfig({ fixture } = {}) {
  const config = await import(`${pathToFileURL(CONFIG).href}?t=${Date.now()}`);
  const errors = [...checkPartners(config.PARTNERS, config.CATEGORIES || []), ...checkRound5(config), ...checkV2(config)];
  if (fixture) {
    const file = /[\\/]|\.json$/.test(fixture) ? resolve(ROOT, fixture) : join(ROOT, 'tools/fit-states/fixtures', `${fixture}.json`);
    if (!existsSync(file)) errors.push(`fixture not found: ${file}`);
    else {
      const data = JSON.parse(readFileSync(file, 'utf8'));
      errors.push(...checkPartners(Array.isArray(data) ? data : data.partners, config.CATEGORIES || [], `fixture ${fixture}`));
    }
  }
  return { errors, partners: (config.PARTNERS || []).length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fx = process.argv.find((a) => a.startsWith('--fixture='))?.split('=')[1];
  checkConfig({ fixture: fx }).then(({ errors, partners }) => {
    if (errors.length) {
      process.stderr.write(`check-config: ${errors.length} problem(s) in site/assets/js/config.js\n${errors.map((e) => `  - ${e}`).join('\n')}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write(`check-config: ok (${partners} partners${fx ? `, fixture ${fx} ok` : ''})\n`);
    }
  }).catch((e) => { process.stderr.write(`check-config: ${e.stack || e}\n`); process.exitCode = 2; });
}
