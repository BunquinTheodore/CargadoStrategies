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

/** Load config.js and run every check. Returns { errors, partners }. */
export async function checkConfig({ fixture } = {}) {
  const config = await import(`${pathToFileURL(CONFIG).href}?t=${Date.now()}`);
  const errors = [...checkPartners(config.PARTNERS, config.CATEGORIES || []), ...checkRound5(config)];
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
