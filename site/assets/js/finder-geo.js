/**
 * Geometry helpers for the partner finder: great-circle distance and the
 * Lambert conformal conic projection used by assets/data/canada-map.js.
 * Pure functions, no DOM.
 */

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;
const QUARTER_PI = Math.PI / 4;

/** Haversine distance in km between two { lat, lon } points. */
export function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "2.1 km" under 10 km, otherwise whole kilometres with thousands separators. */
export function formatKm(km) {
  const value = km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString('en-CA');
  return `${value} km`;
}

/** lat/lon → SVG map coordinates for the given PROJECTION constants. */
export function project(proj, lat, lon) {
  const rho = proj.F / Math.tan(QUARTER_PI + toRad(lat) / 2) ** proj.n;
  const theta = proj.n * toRad(lon - proj.lon0);
  const x = rho * Math.sin(theta);
  const y = proj.rho0 - rho * Math.cos(theta);
  return { x: (x - proj.minx) * proj.k + proj.pad, y: (proj.maxy - y) * proj.k + proj.pad };
}

/** SVG map coordinates → lat/lon (inverse of project). */
export function unproject(proj, sx, sy) {
  const x = (sx - proj.pad) / proj.k + proj.minx;
  const y = proj.maxy - (sy - proj.pad) / proj.k;
  const dy = proj.rho0 - y;
  const rho = Math.sign(proj.n) * Math.hypot(x, dy);
  const theta = Math.atan2(x, dy);
  const lat = 2 * Math.atan((proj.F / rho) ** (1 / proj.n)) - Math.PI / 2;
  return { lat: toDeg(lat), lon: proj.lon0 + toDeg(theta / proj.n) };
}
