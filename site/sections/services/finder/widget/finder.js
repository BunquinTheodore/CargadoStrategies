/**
 * Partner finder controller (FR25–FR31, NFR12; R4 services.md §7, DIRECTION C41).
 * Shown once PARTNERS.length >= FINDER_MIN_PARTNERS; the concierge stands in until then.
 *
 * State: { category, type, place }. The category and type selects set what is
 * needed; the map and the search box both set the place, so either gives the
 * same results. Results are recomputed on every change and paged by what fits
 * (ui-pager.js fit mode: every slot is placed whole). Phones get Search · Map ·
 * Results tabs, 760–1279 px gets Map · Results beside the always-visible form,
 * and wide screens show all three (ui-tabs.js modes).
 *
 * Every status goes to the visible #finder-status and to #finder-live, which
 * sits outside every tab panel so it is announced on any tab.
 */
import { categoryBySlug } from '../../../../assets/js/config.js';
import { escapeHtml } from '../../../../core/chrome/chrome.js';
import { createMap } from './finder-map.js';
import { createCombobox } from './finder-combobox.js';
import { resolvePlace } from './finder-search.js';
import { resultsView, partnersFor } from './finder-results.js';
import { createTabs } from '../../../../core/ui/ui-tabs.js';
import { createPager } from '../../../../core/ui/ui-pager.js';
import { hasPartners, OURS, PARTNER_ONLY } from '../../services-data.js';
import { titleCase } from '../../../../core/lib/text-case.js';

const MSG_EMPTY_QUERY = 'Type a city, province or postal code.';
const MSG_NOT_FOUND = (q) =>
  `No match for “${q}”. Try a nearby city, your province, or the first three characters of your postal code.`;
const MSG_MAP_FAILED = 'The map didn’t load. Use the search box: it gives the same results.';
const TAB_MODES = Object.freeze([
  { when: '(max-width: 759px)', tabs: ['fp-search', 'fp-map', 'fp-results'] },
  { when: '(max-width: 1279px), (max-height: 760px)', tabs: ['fp-map', 'fp-results'] },
]);
const PER_PAGE = 3;
const LIVE_DELAY_MS = 60;

function elements(root) {
  const $ = (id) => root.querySelector(`#${id}`);
  return {
    form: $('finder-form'), category: $('finder-category'), typeRow: $('finder-types'), type: $('finder-type'),
    input: $('finder-place'), list: $('finder-suggestions'), error: $('finder-place-error'), map: $('finder-map'),
    chosen: $('finder-chosen'), status: $('finder-status'), live: $('finder-live'), results: $('finder-results'),
    count: $('finder-count'), resultsTitle: $('results-title'), panelResults: $('fp-results'),
  };
}

const option = (value, label) => `<option value="${value}">${escapeHtml(titleCase(label))}</option>`;

function categoryOptions() {
  const network = [...OURS.filter(hasPartners), ...PARTNER_ONLY];
  const foundersOnly = OURS.filter((c) => !hasPartners(c));
  return `<option value="">Choose a service</option>
    <optgroup label="Partner network">${network.map((c) => option(c.slug, c.name)).join('')}</optgroup>
    <optgroup label="Cargado Strategies' own">${foundersOnly.map((c) => option(c.slug, c.name)).join('')}</optgroup>`;
}

export function initFinder({ root, film, onPlace = () => {}, onError = () => {}, onRender = () => {} }) {
  const el = elements(root);
  const state = { category: null, type: null, place: null };
  let map = null;
  let liveTimer = 0;

  // The pager first: createTabs() selects its first tab at once, and that onChange refreshes the pager.
  const pager = createPager(el.results, {
    mode: 'fit',
    maxPerPage: () => PER_PAGE,
    render: (slots) => { el.results.innerHTML = slots.join(''); },
    noun: 'results',
    film,
    onRender: () => onRender(),
  });
  const tabs = createTabs(root, {
    modes: TAB_MODES,
    label: 'Partner finder',
    panelStop: false,
    film,
    onChange: () => { pager.refresh(); onRender(); },
    onModeChange: () => onRender(),
  });

  /** Announce on any tab: clear, then write on the next tick so a repeat is read again. `html` is escaped. */
  function say(html) {
    el.status.innerHTML = html;
    const text = el.status.textContent;
    clearTimeout(liveTimer);
    el.live.textContent = '';
    liveTimer = setTimeout(() => { el.live.textContent = text; }, LIVE_DELAY_MS);
  }

  function render() {
    const view = resultsView(state);
    say(view.status);
    pager.setItems(view.slots);
    el.count.textContent = view.slots.length ? String(view.slots.length) : '';
    el.chosen.textContent = state.place ? `Chosen: ${state.place.label}` : 'No place chosen yet';
    map?.setPlace(state.place);
    map?.setPartners(state.category ? partnersFor(state.category, state.type) : []);
  }

  function setCategory(slug) {
    const category = categoryBySlug(slug) || null;
    state.category = category;
    state.type = null;
    el.category.value = category ? category.slug : '';
    const types = category?.types || [];
    el.typeRow.hidden = !types.length;
    el.type.innerHTML = types.length ? [option('', 'All types'), ...types.map((t) => option(t.slug, t.name))].join('') : '';
    render();
  }

  /** A place from the map or the search: show the results (tabs), focus their heading if focus would drop. */
  function setPlace(place, { from = 'search' } = {}) {
    state.place = place;
    el.error.textContent = '';
    el.input.removeAttribute('aria-invalid');
    if (place) el.input.value = place.label;
    render();
    if (!place) return;
    if (tabs.tabbed && tabs.current !== 'fp-results') {
      const holder = document.activeElement?.closest('.tabs__panel');
      tabs.select('fp-results', { cause: 'auto' });
      if (holder && holder.hidden) el.resultsTitle.focus({ preventScroll: true });
    } else if (from === 'map') el.resultsTitle.focus({ preventScroll: true });
    onPlace(place);
  }

  function showError(message) {
    el.error.textContent = message;
    el.input.setAttribute('aria-invalid', 'true');
    if (document.activeElement !== el.input) el.input.focus({ preventScroll: true });
    onError(message);
  }

  const combobox = createCombobox({ input: el.input, list: el.list, onPick: (place) => setPlace(place) });

  el.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = el.input.value.trim();
    if (!query) return showError(MSG_EMPTY_QUERY);
    const place = resolvePlace(query);
    combobox.close();
    return place ? setPlace(place) : showError(MSG_NOT_FOUND(query));
  });
  el.category.innerHTML = categoryOptions();
  el.category.addEventListener('change', () => setCategory(el.category.value));
  el.type.addEventListener('change', () => {
    state.type = state.category?.types.find((t) => t.slug === el.type.value) || null;
    render();
  });
  window.addEventListener('resize', () => pager.refresh());

  const mapReady = createMap({ container: el.map, onPick: (place) => setPlace(place, { from: 'map' }) })
    .then((api) => {
      map = api;
      render();
    })
    .catch(() => {
      el.map.classList.add('is-failed');
      el.map.innerHTML = `<p class="map__error" role="alert">${MSG_MAP_FAILED}</p>`;
    });

  render();
  return { setCategory, setPlace, mapReady, tabs, refresh: () => pager.refresh(), get state() { return { ...state }; } };
}
