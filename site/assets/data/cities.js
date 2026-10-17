/**
 * Place data for the partner finder search box (FR26, NFR12).
 *
 * Coordinates are city centres (decimal degrees, rounded to 0.01°) and are
 * only used to sort partners by distance. Nothing here is personal data.
 */

/** Provinces and territories: code, name, a representative point used when
 *  the visitor picks the whole province (in the populated south where that
 *  applies), and alternative spellings for search. */
export const PROVINCES = Object.freeze([
  { code: 'AB', name: 'Alberta', lat: 52.28, lon: -113.81, alt: ['alta'] },
  { code: 'BC', name: 'British Columbia', lat: 50.67, lon: -120.33, alt: ['b.c.', 'colombie-britannique'] },
  { code: 'MB', name: 'Manitoba', lat: 50.45, lon: -97.6, alt: ['man'] },
  { code: 'NB', name: 'New Brunswick', lat: 46.5, lon: -66.15, alt: ['nouveau-brunswick'] },
  { code: 'NL', name: 'Newfoundland and Labrador', lat: 48.95, lon: -55.65, alt: ['newfoundland', 'labrador', 'nfld', 'terre-neuve-et-labrador'] },
  { code: 'NS', name: 'Nova Scotia', lat: 45.0, lon: -63.4, alt: ['nouvelle-ecosse', 'nouvelle-écosse'] },
  { code: 'NT', name: 'Northwest Territories', lat: 62.45, lon: -114.37, alt: ['nwt', 'territoires du nord-ouest'] },
  { code: 'NU', name: 'Nunavut', lat: 63.75, lon: -68.52, alt: [] },
  { code: 'ON', name: 'Ontario', lat: 44.3, lon: -79.4, alt: ['ont'] },
  { code: 'PE', name: 'Prince Edward Island', lat: 46.3, lon: -63.25, alt: ['pei', 'p.e.i.', 'ile-du-prince-edouard', 'île-du-prince-édouard'] },
  { code: 'QC', name: 'Quebec', lat: 46.5, lon: -72.5, alt: ['québec', 'que', 'pq'] },
  { code: 'SK', name: 'Saskatchewan', lat: 51.4, lon: -105.5, alt: ['sask'] },
  { code: 'YT', name: 'Yukon', lat: 60.72, lon: -135.06, alt: ['yukon territory'] },
]);

const city = (name, province, lat, lon, alt = []) => Object.freeze({ name, province, lat, lon, alt });

/** Canadian cities and larger towns across every province and territory. */
export const CITIES = Object.freeze([
  // British Columbia
  city('Vancouver', 'BC', 49.28, -123.12),
  city('Surrey', 'BC', 49.19, -122.85),
  city('Burnaby', 'BC', 49.25, -122.98),
  city('Richmond', 'BC', 49.17, -123.14),
  city('Abbotsford', 'BC', 49.05, -122.33),
  city('Victoria', 'BC', 48.43, -123.37),
  city('Nanaimo', 'BC', 49.17, -123.94),
  city('Kelowna', 'BC', 49.89, -119.5),
  city('Kamloops', 'BC', 50.67, -120.33),
  city('Prince George', 'BC', 53.92, -122.75),
  city('Chilliwack', 'BC', 49.16, -121.95),
  // Alberta
  city('Calgary', 'AB', 51.05, -114.07),
  city('Edmonton', 'AB', 53.55, -113.49),
  city('Red Deer', 'AB', 52.27, -113.81),
  city('Lethbridge', 'AB', 49.69, -112.84),
  city('Medicine Hat', 'AB', 50.04, -110.68),
  city('Grande Prairie', 'AB', 55.17, -118.8),
  city('Fort McMurray', 'AB', 56.73, -111.38, ['wood buffalo']),
  city('Airdrie', 'AB', 51.29, -114.01),
  // Saskatchewan
  city('Saskatoon', 'SK', 52.13, -106.67),
  city('Regina', 'SK', 50.45, -104.61),
  city('Prince Albert', 'SK', 53.2, -105.75),
  city('Moose Jaw', 'SK', 50.39, -105.53),
  city('Swift Current', 'SK', 50.29, -107.79),
  // Manitoba
  city('Winnipeg', 'MB', 49.9, -97.14),
  city('Brandon', 'MB', 49.85, -99.95),
  city('Steinbach', 'MB', 49.53, -96.68),
  city('Thompson', 'MB', 55.74, -97.86),
  city('Portage la Prairie', 'MB', 49.97, -98.29),
  city('Winkler', 'MB', 49.18, -97.94),
  city('Selkirk', 'MB', 50.14, -96.88),
  // Ontario
  city('Toronto', 'ON', 43.65, -79.38),
  city('Ottawa', 'ON', 45.42, -75.7),
  city('Mississauga', 'ON', 43.59, -79.64),
  city('Brampton', 'ON', 43.73, -79.76),
  city('Hamilton', 'ON', 43.26, -79.87),
  city('London', 'ON', 42.98, -81.25),
  city('Markham', 'ON', 43.86, -79.34),
  city('Vaughan', 'ON', 43.84, -79.5),
  city('Kitchener', 'ON', 43.45, -80.49),
  city('Waterloo', 'ON', 43.46, -80.52),
  city('Windsor', 'ON', 42.31, -83.04),
  city('Oshawa', 'ON', 43.9, -78.86),
  city('Barrie', 'ON', 44.39, -79.69),
  city('Guelph', 'ON', 43.54, -80.25),
  city('Kingston', 'ON', 44.23, -76.49),
  city('St. Catharines', 'ON', 43.16, -79.24, ['saint catharines', 'st catharines']),
  city('Niagara Falls', 'ON', 43.09, -79.08),
  city('Sudbury', 'ON', 46.49, -80.99, ['greater sudbury']),
  city('Thunder Bay', 'ON', 48.38, -89.25),
  city('Sault Ste. Marie', 'ON', 46.52, -84.33, ['sault ste marie']),
  city('Peterborough', 'ON', 44.3, -78.32),
  city('North Bay', 'ON', 46.31, -79.46),
  city('Timmins', 'ON', 48.48, -81.33),
  // Quebec
  city('Montréal', 'QC', 45.5, -73.57, ['montreal']),
  city('Québec City', 'QC', 46.81, -71.21, ['quebec city', 'québec', 'ville de québec']),
  city('Laval', 'QC', 45.61, -73.71),
  city('Gatineau', 'QC', 45.48, -75.7),
  city('Longueuil', 'QC', 45.53, -73.52),
  city('Sherbrooke', 'QC', 45.4, -71.89),
  city('Trois-Rivières', 'QC', 46.34, -72.54, ['trois-rivieres', 'trois rivieres']),
  city('Saguenay', 'QC', 48.43, -71.07, ['chicoutimi']),
  city('Lévis', 'QC', 46.8, -71.18, ['levis']),
  city('Drummondville', 'QC', 45.88, -72.48),
  city('Rimouski', 'QC', 48.45, -68.52),
  city('Rouyn-Noranda', 'QC', 48.24, -79.02),
  // New Brunswick
  city('Moncton', 'NB', 46.09, -64.78),
  city('Saint John', 'NB', 45.27, -66.06),
  city('Fredericton', 'NB', 45.96, -66.64),
  city('Bathurst', 'NB', 47.62, -65.65),
  city('Edmundston', 'NB', 47.37, -68.33),
  // Nova Scotia
  city('Halifax', 'NS', 44.65, -63.58),
  city('Dartmouth', 'NS', 44.67, -63.57),
  city('Sydney', 'NS', 46.14, -60.19, ['cape breton']),
  city('Truro', 'NS', 45.37, -63.28),
  // Prince Edward Island
  city('Charlottetown', 'PE', 46.24, -63.13),
  city('Summerside', 'PE', 46.39, -63.79),
  // Newfoundland and Labrador
  city("St. John's", 'NL', 47.56, -52.71, ['st johns', 'saint johns']),
  city('Mount Pearl', 'NL', 47.52, -52.81),
  city('Corner Brook', 'NL', 48.95, -57.95),
  city('Gander', 'NL', 48.95, -54.61),
  city('Happy Valley-Goose Bay', 'NL', 53.3, -60.33, ['goose bay']),
  // Territories
  city('Whitehorse', 'YT', 60.72, -135.06),
  city('Dawson City', 'YT', 64.06, -139.43),
  city('Yellowknife', 'NT', 62.45, -114.37),
  city('Inuvik', 'NT', 68.36, -133.72),
  city('Hay River', 'NT', 60.82, -115.8),
  city('Iqaluit', 'NU', 63.75, -68.52),
  city('Rankin Inlet', 'NU', 62.81, -92.09),
  city('Cambridge Bay', 'NU', 69.12, -105.06),
]);

/**
 * First letter of a postal code (the FSA) → province. Postal codes are only
 * matched to a province (or one large city where the letter is city-only), so
 * distances from a postal code are approximate.
 */
export const POSTAL_LETTERS = Object.freeze({
  A: { province: 'NL' },
  B: { province: 'NS' },
  C: { province: 'PE' },
  E: { province: 'NB' },
  G: { province: 'QC' },
  H: { province: 'QC', city: 'Montréal' },
  J: { province: 'QC' },
  K: { province: 'ON' },
  L: { province: 'ON' },
  M: { province: 'ON', city: 'Toronto' },
  N: { province: 'ON' },
  P: { province: 'ON' },
  R: { province: 'MB' },
  S: { province: 'SK' },
  T: { province: 'AB' },
  V: { province: 'BC' },
  X: { province: 'NT' }, // X0A, X0B, X0C are Nunavut (see NUNAVUT_FSAS)
  Y: { province: 'YT' },
});

export const NUNAVUT_FSAS = Object.freeze(['X0A', 'X0B', 'X0C']);
