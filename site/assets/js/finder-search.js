/**
 * Place search for the partner finder (FR26, NFR12): cities, provinces and
 * territories, and postal codes (first three characters). Every result is a
 * "place" — the same shape the map produces — so the search box and the map
 * give the same results.
 *
 * place = { kind: 'city'|'province'|'postal'|'map', label, lat, lon, province, approximate }
 */
import { CITIES, PROVINCES, POSTAL_LETTERS, NUNAVUT_FSAS } from '../data/cities.js';
import { distanceKm } from './finder-geo.js';

const MAX_SUGGESTIONS = 6;
const NEAR_CITY_KM = 120;
const FSA_PATTERN = /^([ABCEGHJ-NPRSTVXY])(\d)([A-Z])(\d[A-Z]\d)?$/;
const SCORE = Object.freeze({ exact: 3, prefix: 2, contains: 1, none: 0 });

/** Lower case, no accents, no dots or apostrophes, single spaces. */
export const normalize = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const provinceByCode = (code) => PROVINCES.find((p) => p.code === code);

const cityPlace = (c) => ({
  kind: 'city', label: `${c.name}, ${c.province}`, lat: c.lat, lon: c.lon, province: c.province, approximate: false,
});

export const provincePlace = (p) => ({
  kind: 'province', label: p.name, lat: p.lat, lon: p.lon, province: p.code, approximate: true,
});

function postalPlace(raw) {
  const match = raw.toUpperCase().replace(/\s+/g, '').match(FSA_PATTERN);
  if (!match) return null;
  const fsa = match[1] + match[2] + match[3];
  const rule = POSTAL_LETTERS[match[1]];
  const code = NUNAVUT_FSAS.includes(fsa) ? 'NU' : rule.province;
  const city = rule.city ? CITIES.find((c) => c.name === rule.city) : null;
  const base = city ? cityPlace(city) : provincePlace(provinceByCode(code));
  const where = city ? `${city.name}, ${code}` : provinceByCode(code).name;
  return { ...base, kind: 'postal', label: `Postal code ${fsa} · ${where}`, approximate: true };
}

function scoreNames(names, text) {
  const keys = names.map(normalize);
  if (keys.includes(text)) return SCORE.exact;
  if (keys.some((k) => k.startsWith(text))) return SCORE.prefix;
  if (text.length > 2 && keys.some((k) => k.includes(text))) return SCORE.contains;
  return SCORE.none;
}

function provinceMatches(code, filter) {
  if (!filter) return true;
  const p = provinceByCode(code);
  return scoreNames([p.code, p.name, ...p.alt], filter) >= SCORE.prefix;
}

function rank(text, provinceFilter) {
  const provinces = provinceFilter
    ? []
    : PROVINCES.map((p) => ({ place: provincePlace(p), score: scoreNames([p.name, p.code, ...p.alt], text) }));
  const cities = CITIES.filter((c) => provinceMatches(c.province, provinceFilter))
    .map((c) => ({ place: cityPlace(c), score: scoreNames([c.name, ...c.alt], text) }));
  return [...provinces, ...cities]
    .filter((r) => r.score > SCORE.none)
    .sort((a, b) => b.score - a.score || a.place.label.localeCompare(b.place.label));
}

/** "Winnipeg, MB" or "Winnipeg MB" → { text: 'winnipeg', province: 'mb' }. */
function splitQuery(raw) {
  const [place, province = ''] = normalize(raw).split(',');
  return { text: place.trim(), province: province.trim() };
}

/** Up to `limit` places matching what the visitor typed. */
export function suggestPlaces(raw, limit = MAX_SUGGESTIONS) {
  if (!raw || !raw.trim()) return [];
  const postal = postalPlace(raw);
  if (postal) return [postal];
  const { text, province } = splitQuery(raw);
  if (!text) return [];
  let ranked = rank(text, province);
  const words = text.split(' ');
  if (!ranked.length && !province && words.length > 1) {
    ranked = rank(words.slice(0, -1).join(' '), words[words.length - 1]);
  }
  return ranked.slice(0, limit).map((r) => r.place);
}

/** The single best place for a typed query, or null. */
export const resolvePlace = (raw) => suggestPlaces(raw, 1)[0] || null;

/** A readable label for a point clicked on the map. */
export function mapPlace({ lat, lon, province }) {
  const p = provinceByCode(province);
  const nearest = CITIES.filter((c) => c.province === province)
    .map((c) => ({ c, km: distanceKm({ lat, lon }, c) }))
    .sort((a, b) => a.km - b.km)[0];
  const label = nearest && nearest.km <= NEAR_CITY_KM
    ? `${nearest.c.name} area, ${province}`
    : `${p ? p.name : 'Canada'} (point on the map)`;
  return { kind: 'map', label, lat, lon, province, approximate: false };
}

/** Short description of a suggestion's kind for the list. */
export function kindLabel(place) {
  if (place.kind === 'province') return 'Whole province or territory';
  if (place.kind === 'postal') return 'Postal code, approximate';
  return 'City';
}
