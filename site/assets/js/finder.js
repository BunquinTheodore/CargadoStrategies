/**
 * Partner finder controller (FR25–FR31, NFR12).
 *
 * State: { category, type, place }. The category select and type chips set
 * what is needed; the map and the search box both set the place, so either
 * gives the same results. Results are recomputed on every change.
 */
import { categoryBySlug } from './config.js';
import { escapeHtml } from './chrome.js';
import { createMap } from './finder-map.js';
import { createCombobox } from './finder-combobox.js';
import { resolvePlace } from './finder-search.js';
import { resultsView, partnersFor } from './finder-results.js';
import { hasPartners, OURS, PARTNER_ONLY } from './services-data.js';
import { titleCase } from './text-case.js';
import { shake } from './services-fx.js';

const MSG_EMPTY_QUERY = 'Type a city, province or postal code.';
const MSG_NOT_FOUND = (q) =>
  `We couldn't find “${q}”. Try a nearby city, your province, or the first three characters of your postal code.`;
const MSG_MAP_FAILED = 'The map didn’t load. Use the search box above: it gives the same results.';

function elements(root) {
  const $ = (id) => root.querySelector(`#${id}`);
  return {
    form: $('finder-form'), category: $('finder-category'), types: $('finder-types'),
    typeChips: $('finder-type-chips'), input: $('finder-place'), list: $('finder-suggestions'),
    error: $('finder-place-error'), map: $('finder-map'), chosen: $('finder-chosen'),
    status: $('finder-status'), results: $('finder-results'),
  };
}

const option = (c) => `<option value="${c.slug}">${escapeHtml(c.name)}</option>`;

function categoryOptions() {
  const network = [...OURS.filter(hasPartners), ...PARTNER_ONLY];
  const foundersOnly = OURS.filter((c) => !hasPartners(c));
  return `<option value="">Choose a service</option>
    <optgroup label="Partner network">${network.map(option).join('')}</optgroup>
    <optgroup label="Our founder's own">${foundersOnly.map(option).join('')}</optgroup>`;
}

function typeChipsMarkup(category) {
  const chip = (value, name, checked) =>
    `<label class="chip"><input type="radio" name="finder-type" value="${value}"${checked ? ' checked' : ''}>${escapeHtml(titleCase(name))}</label>`;
  return [chip('', 'All Types', true), ...category.types.map((t) => chip(t.slug, t.name, false))].join('');
}

export function initFinder({ root = document, onChange = () => {}, onPlace = () => {}, onError = () => {} } = {}) {
  const el = elements(root);
  const state = { category: null, type: null, place: null };
  let map = null;

  function render() {
    const view = resultsView(state);
    el.status.innerHTML = view.status;
    el.results.innerHTML = view.html;
    el.chosen.textContent = state.place ? `Chosen: ${state.place.label}` : 'No place chosen yet';
    map?.setPlace(state.place);
    map?.setPartners(state.category ? partnersFor(state.category, state.type) : []);
    onChange({ ...state });
  }

  function setCategory(slug) {
    const category = categoryBySlug(slug) || null;
    state.category = category;
    state.type = null;
    el.category.value = category ? category.slug : '';
    const showTypes = !!category && category.types.length > 0;
    el.types.hidden = !showTypes;
    el.typeChips.innerHTML = showTypes ? typeChipsMarkup(category) : '';
    render();
  }

  function setPlace(place) {
    state.place = place;
    el.error.textContent = '';
    el.input.removeAttribute('aria-invalid');
    if (place) el.input.value = place.label;
    render();
    if (place) onPlace(place);
  }

  /** Same feedback as the inquiry form: focus the field, nudge it, then the page cue. */
  function showError(message) {
    el.error.textContent = message;
    el.input.setAttribute('aria-invalid', 'true');
    if (document.activeElement !== el.input) el.input.focus({ preventScroll: true });
    shake(el.input.closest('.form-row'));
    onError(message);
  }

  function onSubmit(event) {
    event.preventDefault();
    const query = el.input.value.trim();
    if (!query) return showError(MSG_EMPTY_QUERY);
    const place = resolvePlace(query);
    combobox.close();
    return place ? setPlace(place) : showError(MSG_NOT_FOUND(query));
  }

  el.category.innerHTML = categoryOptions();
  el.category.addEventListener('change', () => setCategory(el.category.value));
  el.typeChips.addEventListener('change', (event) => {
    const slug = event.target.value;
    state.type = state.category?.types.find((t) => t.slug === slug) || null;
    render();
  });
  const combobox = createCombobox({ input: el.input, list: el.list, onPick: setPlace });
  el.form.addEventListener('submit', onSubmit);

  const mapReady = createMap({ container: el.map, onPick: setPlace })
    .then((api) => {
      map = api;
      render();
    })
    .catch(() => {
      el.map.classList.add('is-failed');
      el.map.innerHTML = `<p class="map__error" role="alert">${MSG_MAP_FAILED}</p>`;
    });

  render();
  return { setCategory, setPlace, mapReady, get state() { return { ...state }; } };
}
