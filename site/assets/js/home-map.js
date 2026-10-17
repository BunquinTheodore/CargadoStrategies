/**
 * Stylised dot map of Canada for the home page finder teaser.
 *
 * Hand-simplified outlines (lat, lon) are projected with a Lambert conformal
 * conic projection (the familiar shape of Canadian maps), then a regular grid
 * of dots is kept where it falls inside an outline. The dots are one <path> (cheap to render); city
 * markers are separate groups so the page can animate them on the film.
 * Cities are real places used for illustration only, never partners.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
/* Lambert conformal conic, the projection Canadian maps use (Statistics Canada parameters). */
const LCC = { lat1: 49, lat2: 77, lat0: 63.390675, lon0: -91.866667 };
const UNITS_PER_RADIAN = 180 / Math.PI; // keeps projected units close to degrees
const GRID_STEP = 0.95; // projected units between dots
const DOT_SIZE = 0.52;
const PAD = 1.4;
const HUB = 'Winnipeg';
const RING_RADII = [2.2, 4.4, 6.6];
const LABEL_GAP = 1.1;
const LABEL_PLACES = {
  below: { x: 0, y: LABEL_GAP + 1, 'text-anchor': 'middle' },
  'below-start': { x: -0.6, y: LABEL_GAP + 1, 'text-anchor': 'start' }, // west coast: stay inside the frame
  right: { x: LABEL_GAP, y: 0.45, 'text-anchor': 'start' },
};

const MAINLAND = [
  [49.0, -123.1], [49.8, -124.5], [50.9, -127.0], [52.2, -128.3], [54.0, -130.0], [54.7, -130.6],
  [56.0, -130.0], [57.0, -131.8], [58.5, -133.5], [59.5, -135.5], [59.8, -137.5], [60.3, -139.1],
  [60.3, -141.0], [69.6, -141.0], [69.3, -138.0], [68.9, -135.0], [69.5, -132.5], [70.0, -129.0],
  [69.3, -125.0], [68.5, -120.0], [67.8, -115.0], [68.2, -108.5], [67.6, -104.0], [68.0, -98.5],
  [69.0, -95.5], [71.9, -94.5], [69.5, -92.0], [68.3, -89.5], [66.5, -86.5], [65.5, -87.5],
  [64.0, -88.5], [62.0, -92.5], [60.0, -94.6], [58.8, -94.2], [57.0, -92.5], [56.0, -88.0],
  [55.0, -82.3], [52.5, -81.5], [51.3, -79.8], [52.5, -78.6], [54.5, -79.6], [56.5, -76.6],
  [58.5, -78.0], [60.5, -77.6], [62.4, -77.9], [62.5, -73.5], [61.5, -71.5], [60.0, -69.7],
  [58.5, -68.6], [58.8, -66.0], [60.3, -64.6], [58.5, -62.8], [56.0, -61.0], [55.0, -59.5],
  [53.6, -56.0], [52.0, -55.7], [51.4, -57.1], [50.3, -60.0], [50.2, -63.5], [50.0, -66.5],
  [49.2, -67.5], [49.2, -64.4], [48.0, -64.6], [47.0, -65.0], [46.0, -63.8], [45.9, -61.9],
  [46.9, -60.4], [46.0, -59.8], [45.3, -61.0], [44.6, -63.0], [43.6, -65.6], [44.6, -66.0],
  [45.1, -67.1], [45.6, -67.8], [47.1, -67.8], [47.4, -68.3], [47.3, -69.1], [46.4, -70.0],
  [45.3, -70.8], [45.0, -71.5], [45.0, -74.7], [44.2, -76.3], [43.6, -79.4], [43.2, -79.1],
  [42.8, -80.4], [42.3, -82.5], [42.0, -83.0], [43.0, -82.4], [44.0, -81.7], [45.3, -81.6],
  [45.9, -83.5], [46.5, -84.4], [47.0, -84.8], [48.0, -86.4], [48.8, -87.3], [48.4, -89.2],
  [48.0, -89.6], [48.6, -93.0], [49.0, -95.2],
];

const ISLANDS = [
  [[48.3, -123.4], [48.6, -124.4], [49.5, -126.0], [50.5, -128.3], [50.8, -127.5], [50.0, -125.2], [49.0, -123.7]],
  [[47.6, -59.3], [48.5, -59.0], [49.5, -58.2], [51.6, -55.5], [50.0, -55.6], [49.5, -53.6], [48.0, -53.0], [46.6, -52.9], [46.8, -54.0], [47.6, -56.0]],
  [[62.3, -65.0], [63.7, -64.6], [66.6, -61.9], [68.5, -65.0], [70.4, -68.0], [71.6, -72.0], [73.6, -80.0], [73.4, -87.0],
    [71.0, -85.0], [70.0, -80.0], [69.6, -77.0], [68.0, -74.0], [67.0, -75.0], [65.0, -76.5], [64.4, -78.0], [63.6, -76.0],
    [62.4, -72.0], [63.0, -69.0]],
  [[62.0, -83.5], [63.5, -87.0], [65.3, -85.0], [64.5, -81.5]],
  [[69.0, -117.5], [71.0, -118.3], [72.9, -115.0], [73.0, -109.0], [71.0, -104.5], [69.0, -101.5], [68.6, -105.0], [69.2, -110.0]],
  [[71.5, -125.7], [74.5, -124.6], [74.2, -117.5], [71.8, -118.0]],
  [[74.5, -115.0], [76.5, -118.0], [77.5, -110.0], [76.2, -100.0], [75.5, -98.0], [74.5, -104.0]],
  [[74.5, -92.0], [76.3, -91.0], [76.5, -82.0], [74.6, -80.0]],
  [[72.0, -95.0], [73.8, -95.0], [73.9, -90.5], [72.5, -93.5]],
  [[71.5, -99.5], [73.5, -101.0], [73.5, -97.5], [72.0, -97.0]],
  [[78.0, -93.0], [80.5, -95.0], [81.2, -91.0], [79.0, -87.0]],
  [[76.4, -89.5], [78.5, -87.0], [80.5, -90.0], [82.8, -77.0], [82.5, -62.5], [81.0, -64.0], [79.0, -72.0], [77.5, -78.0]],
];

/** Real cities, for illustration only. `label` (where the name sits) marks the ones that get a name. */
const CITIES = [
  { name: 'Vancouver', lat: 49.28, lon: -123.12, label: 'below-start' },
  { name: 'Calgary', lat: 51.05, lon: -114.07 },
  { name: 'Edmonton', lat: 53.55, lon: -113.49 },
  { name: 'Saskatoon', lat: 52.13, lon: -106.67 },
  { name: 'Regina', lat: 50.45, lon: -104.61 },
  { name: 'Winnipeg', lat: 49.9, lon: -97.14, label: 'right' },
  { name: 'Toronto', lat: 43.65, lon: -79.38, label: 'below' },
  { name: 'Ottawa', lat: 45.42, lon: -75.7 },
  { name: 'Montreal', lat: 45.5, lon: -73.57 },
  { name: 'Halifax', lat: 44.65, lon: -63.58, label: 'below' },
  { name: "St. John's", lat: 47.56, lon: -52.71 },
];

const toRad = (deg) => (deg * Math.PI) / 180;
const conicTan = (lat) => Math.tan(Math.PI / 4 + toRad(lat) / 2);

const CONE = (() => {
  const n = Math.log(Math.cos(toRad(LCC.lat1)) / Math.cos(toRad(LCC.lat2)))
    / Math.log(conicTan(LCC.lat2) / conicTan(LCC.lat1));
  const f = (Math.cos(toRad(LCC.lat1)) * conicTan(LCC.lat1) ** n) / n;
  return { n, f, rho0: f / conicTan(LCC.lat0) ** n };
})();

/** [lat, lon] → [x, y] in SVG space (y grows downwards). */
const project = ([lat, lon]) => {
  const rho = CONE.f / conicTan(lat) ** CONE.n;
  const theta = CONE.n * toRad(lon - LCC.lon0);
  return [rho * Math.sin(theta) * UNITS_PER_RADIAN, -(CONE.rho0 - rho * Math.cos(theta)) * UNITS_PER_RADIAN];
};

const round = (n) => Math.round(n * 100) / 100;

/** x positions where the polygon's edges cross the horizontal line at y. */
function rowCrossings(poly, y) {
  const xs = [];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
  }
  return xs;
}

/** Even-odd rule: inside when an odd number of a polygon's crossings lie right of x. */
const insideRow = (x, crossings) => crossings.filter((c) => x < c).length % 2 === 1;

function boundsOf(polys) {
  const pts = polys.flat();
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/** Grid dots inside any polygon. Edge crossings are found once per row (scanline), not per dot. */
function dotPath(polys, b) {
  const parts = [];
  for (let y = b.minY; y <= b.maxY; y += GRID_STEP) {
    const rows = polys.map((poly) => rowCrossings(poly, y)).filter((xs) => xs.length);
    for (let x = b.minX; x <= b.maxX; x += GRID_STEP) {
      if (rows.some((xs) => insideRow(x, xs))) parts.push(`M${round(x)} ${round(y)}h0`);
    }
  }
  return parts.join('');
}

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
  return node;
}

function cityGroup(city) {
  const [x, y] = project([city.lat, city.lon]);
  const g = el('g', { class: `map__city${city.name === HUB ? ' map__city--hub' : ''}`, transform: `translate(${round(x)} ${round(y)})` });
  const pin = el('g', { class: 'map__pin' });
  pin.append(el('circle', { r: city.name === HUB ? 0.75 : 0.5 }));
  g.append(pin);
  if (city.label) {
    const text = el('text', { ...LABEL_PLACES[city.label], class: 'map__label' });
    text.textContent = city.name;
    g.append(text);
  }
  return g;
}

const hubCity = () => CITIES.find((c) => c.name === HUB);

function ringsGroup() {
  const [x, y] = project([hubCity().lat, hubCity().lon]);
  const g = el('g', { class: 'map__rings', transform: `translate(${round(x)} ${round(y)})` });
  RING_RADII.forEach((r) => g.append(el('circle', { class: 'map__ring', r })));
  return g;
}

/**
 * Fill an empty <svg> with the dot map. Returns the hub position as
 * percentages of the drawing ({ x, y }) so the page can aim reveals at it.
 */
export function renderCanadaMap(svg) {
  if (!svg) return null;
  const polys = [MAINLAND, ...ISLANDS].map((poly) => poly.map(project));
  const b = boundsOf(polys);
  const vb = [b.minX - PAD, b.minY - PAD, b.maxX - b.minX + PAD * 2, b.maxY - b.minY + PAD * 2];
  svg.setAttribute('viewBox', vb.map(round).join(' '));
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const dots = el('path', { class: 'map__dots', d: dotPath(polys, b), 'stroke-width': DOT_SIZE });
  const cities = el('g', { class: 'map__cities' });
  CITIES.forEach((c) => cities.append(cityGroup(c)));
  svg.replaceChildren(dots, ringsGroup(), cities);
  const [hx, hy] = project([hubCity().lat, hubCity().lon]);
  return { x: ((hx - vb[0]) / vb[2]) * 100, y: ((hy - vb[1]) / vb[3]) * 100 };
}
