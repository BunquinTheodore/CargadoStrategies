/**
 * Clickable map of Canada for the partner finder (FR25, NFR12).
 *
 * Every province and territory is a focusable button. A pointer click picks
 * the exact point clicked (inverse projection); Enter/Space picks the
 * province's representative point. Both report a "place" through onPick,
 * the same shape the search box produces, so both give the same results.
 * The geometry is loaded with a dynamic import so a failure can be reported.
 */
import { project, unproject } from './finder-geo.js';
import { provinceByCode, provincePlace, mapPlace } from './finder-search.js';
import { escapeHtml } from './chrome.js';

const MAP_MODULE = '../data/canada-map.js';
const MARKER_RING_R = 16;
const MARKER_DOT_R = 6;
const PARTNER_DOT_R = 4;
const PICK_KEYS = new Set(['Enter', ' ']);

function regionMarkup({ code, name, d }) {
  const label = escapeHtml(name);
  return `<path class="map__region" d="${d}" data-code="${code}" tabindex="0" role="button" data-cursor-label="Pick"
    aria-pressed="false" aria-label="${label}"><title>${label}</title></path>`;
}

function svgMarkup({ MAP_WIDTH, MAP_HEIGHT, REGIONS }) {
  return `
  <svg class="map__svg" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" role="group"
       aria-label="Map of Canada. Choose your province or territory.">
    <g class="map__regions">${REGIONS.map(regionMarkup).join('')}</g>
    <g class="map__dots" aria-hidden="true"></g>
    <g class="map__marker" aria-hidden="true" visibility="hidden">
      <circle class="map__marker-ring" r="${MARKER_RING_R}"></circle>
      <circle class="map__marker-dot" r="${MARKER_DOT_R}"></circle>
    </g>
  </svg>`;
}

function svgPointOf(svg, event) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
}

function wireRegions(svg, projection, onPick) {
  svg.addEventListener('click', (event) => {
    const region = event.target.closest('.map__region');
    const point = region && svgPointOf(svg, event);
    if (!point) return;
    const { lat, lon } = unproject(projection, point.x, point.y);
    onPick(mapPlace({ lat, lon, province: region.dataset.code }));
  });
  svg.addEventListener('keydown', (event) => {
    const region = event.target.closest('.map__region');
    if (!region || !PICK_KEYS.has(event.key)) return;
    event.preventDefault();
    onPick(provincePlace(provinceByCode(region.dataset.code)));
  });
}

function partnerDots(projection, partners) {
  return partners
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .map((p) => {
      const { x, y } = project(projection, p.lat, p.lon);
      return `<circle class="map__partner" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${PARTNER_DOT_R}"></circle>`;
    })
    .join('');
}

/**
 * Render the map into `container`. Resolves to { setPlace, setPartners };
 * rejects if the geometry cannot be loaded (the caller shows a message).
 */
export async function createMap({ container, onPick }) {
  const data = await import(MAP_MODULE);
  container.innerHTML = svgMarkup(data);
  container.classList.add('is-ready');
  const svg = container.querySelector('svg');
  const marker = svg.querySelector('.map__marker');
  const dots = svg.querySelector('.map__dots');
  const regions = Array.from(svg.querySelectorAll('.map__region'));
  wireRegions(svg, data.PROJECTION, onPick);

  function setPlace(place) {
    regions.forEach((r) => {
      const on = !!place && r.dataset.code === place.province;
      r.classList.toggle('is-selected', on);
      r.setAttribute('aria-pressed', String(on));
    });
    if (!place) {
      marker.setAttribute('visibility', 'hidden');
      return;
    }
    const { x, y } = project(data.PROJECTION, place.lat, place.lon);
    marker.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    marker.setAttribute('visibility', 'visible');
  }

  function setPartners(partners) {
    dots.innerHTML = partnerDots(data.PROJECTION, partners);
  }

  return { setPlace, setPartners };
}
