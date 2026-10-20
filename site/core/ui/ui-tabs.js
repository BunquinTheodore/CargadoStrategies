/**
 * Responsive tabs, segmented switches and "carousels" (R4 shared.md §6.1,
 * api.md §17.1). One module, one options object:
 *
 *   createTabs(root, { activeWhen | modes, label, initial, fixedHeight, inactive,
 *                      panelStop, swipe, film, onChange, onModeChange })
 *   → { select(keyOrIndex, { cause }), open(key, { cause }), close(), current, tabbed, mode, destroy() }
 *
 * - Tabs mode (APG tabs, automatic activation) while `activeWhen` matches, or
 *   while the first matching `modes[i].when` does (its `tabs` list names the
 *   panels in play; the others lose their tab and show as plain content).
 * - Static mode: every panel shows, the tab list is not rendered (CSS shows it
 *   only under .is-tabbed), roles and tab stops are removed.
 * - Drill mode (`inactive: 'drill'`, legal Q&A on phones): the tab buttons are
 *   a list of questions; open(key) shows one answer, close() returns to the list.
 * - Key = the panel id (aria-controls). root.dataset.tab holds it in tabs mode.
 * - Every tab-stop write goes through setTabStop / clearTabStop, which respect
 *   the film's parking of the scene.
 * - onModeChange fires synchronously at init too; callers run film.refreshReach().
 */

const SWIPE_MIN_PX = 48;
const SWIPE_RATIO = 1.5;
const ROLE_SAVE = 'csRole';

/** Set an element's tab stop ('0' or '-1'), respecting the film's parking of its scene. */
export function setTabStop(el, value, film) {
  const scene = el.closest('.scene');
  const parked = film?.isParked ? film.isParked(scene) : !!scene?.querySelector('[data-film-tab]');
  if (parked) { el.setAttribute('data-film-tab', value); el.setAttribute('tabindex', '-1'); }
  else { el.removeAttribute('data-film-tab'); el.setAttribute('tabindex', value); }
}

/** Drop an element's tab stop entirely, parked or not. */
export function clearTabStop(el) {
  el.removeAttribute('tabindex');
  el.removeAttribute('data-film-tab');
}

let uid = 0;
const ensureId = (el, prefix) => {
  if (!el.id) { uid += 1; el.id = `${prefix}-${uid}`; }
  return el.id;
};

function swapRole(el, role) {
  if (!el) return;
  if (!(ROLE_SAVE in el.dataset)) el.dataset[ROLE_SAVE] = el.getAttribute('role') || '';
  el.setAttribute('role', role);
}
function restoreRole(el) {
  if (!el || !(ROLE_SAVE in el.dataset)) return;
  const saved = el.dataset[ROLE_SAVE];
  if (saved) el.setAttribute('role', saved); else el.removeAttribute('role');
  delete el.dataset[ROLE_SAVE];
}

export function createTabs(root, {
  activeWhen = root?.dataset.tabs,
  modes,
  label = root?.dataset.tabsLabel,
  initial = 0,
  fixedHeight = false,
  inactive = 'all',
  panelStop = true,
  swipe = false,
  film,
  onChange,
  onModeChange,
} = {}) {
  const list = root.querySelector('.tabs__list');
  const tabs = Array.from(list?.querySelectorAll('.tabs__tab') || []);
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
  const panelsParent = root.querySelector('[data-tabs-panels]') || panels[0]?.parentElement;
  const bar = root.querySelector('[data-tabs-bar]');
  const keys = panels.map((p, i) => p?.id || ensureId(tabs[i], 'tab'));
  const queries = (modes?.length ? modes : activeWhen ? [{ when: activeWhen }] : [])
    .map((m) => ({ ...m, mql: window.matchMedia(m.when) }));
  const state = { mode: '', inSet: [], current: null, openKey: null };

  const indexOf = (keyOrIndex) => (typeof keyOrIndex === 'number' ? keyOrIndex : keys.indexOf(String(keyOrIndex).replace(/^#/, '')));
  const verticalKeys = () => list?.getAttribute('aria-orientation') === 'vertical';

  function resolveMode() {
    const match = queries.find((q) => q.mql.matches);
    if (match) {
      const set = match.tabs ? keys.map((k, i) => (match.tabs.includes(k) ? i : -1)).filter((i) => i >= 0) : keys.map((_, i) => i);
      return { mode: match.when, set };
    }
    return { mode: inactive === 'drill' ? 'drill' : 'static', set: [] };
  }

  /* ---------- static / drill / tabs rendering ---------- */

  function clearAll() {
    root.classList.remove('is-tabbed', 'tabs--fixed', 'is-drill', 'is-open');
    delete root.dataset.tab;
    if (list) {
      restoreRole(list);
      list.removeAttribute('aria-label');
    }
    restoreRole(panelsParent);
    tabs.forEach((tab) => {
      tab.hidden = false;
      ['role', 'aria-selected', 'aria-expanded'].forEach((a) => tab.removeAttribute(a));
      clearTabStop(tab);
    });
    panels.forEach((panel) => {
      if (!panel) return;
      panel.hidden = false;
      panel.inert = false;
      panel.classList.remove('is-current');
      panel.removeAttribute('aria-labelledby');
      restoreRole(panel);
      clearTabStop(panel);
    });
    if (bar) bar.hidden = true;
    if (panelsParent && swipe) panelsParent.removeAttribute('data-swipe-x');
  }

  function renderTabs(set) {
    root.classList.add('is-tabbed');
    if (fixedHeight) root.classList.add('tabs--fixed');
    if (list) {
      swapRole(list, 'tablist');
      if (label) list.setAttribute('aria-label', label);
    }
    if (panelsParent?.getAttribute('role') === 'list') swapRole(panelsParent, 'none');
    if (panelsParent && swipe) panelsParent.setAttribute('data-swipe-x', '');
    tabs.forEach((tab, i) => {
      const inSet = set.includes(i);
      tab.hidden = !inSet;
      const panel = panels[i];
      if (!inSet) return;
      tab.setAttribute('role', 'tab');
      ensureId(tab, 'tab');
      if (panel) {
        swapRole(panel, 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
      }
    });
  }

  function renderDrill() {
    root.classList.add('is-drill');
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-expanded', 'false');
      setTabStop(tab, '0', film);
      const panel = panels[i];
      if (!panel) return;
      panel.hidden = true;
      swapRole(panel, 'region');
      const heading = panel.querySelector('h2, h3, h4');
      if (heading) panel.setAttribute('aria-labelledby', ensureId(heading, 'qa'));
    });
    if (bar) bar.hidden = true;
  }

  function applyMode({ initialCause = 'mode' } = {}) {
    const { mode, set } = resolveMode();
    if (mode === state.mode && set.join() === state.inSet.join()) return false;
    const keep = state.current;
    const keepOpen = state.openKey;
    clearAll();
    state.mode = mode;
    state.inSet = set;
    state.openKey = null;
    if (set.length) {
      renderTabs(set);
      const keepIndex = keys.indexOf(keep);
      const start = set.includes(keepIndex) ? keepIndex : set[Math.min(Math.max(0, initial), set.length - 1)] ?? set[0];
      select(start, { cause: initialCause, focus: false });
    } else if (mode === 'drill') {
      renderDrill();
      if (keepOpen) open(keepOpen, { cause: initialCause, focus: false });
    } else {
      state.current = null;
    }
    return true;
  }

  /* ---------- selection ---------- */

  function select(keyOrIndex, { cause = 'auto', focus = false } = {}) {
    const index = indexOf(keyOrIndex);
    if (index < 0 || index >= tabs.length) return;
    if (state.mode === 'drill') { open(keys[index], { cause, focus }); return; }
    if (!state.inSet.length || !state.inSet.includes(index)) return;
    state.inSet.forEach((i) => {
      const on = i === index;
      const tab = tabs[i];
      const panel = panels[i];
      tab.setAttribute('aria-selected', String(on));
      setTabStop(tab, on ? '0' : '-1', film);
      if (!panel) return;
      panel.classList.toggle('is-current', on);
      if (fixedHeight) { panel.inert = !on; panel.hidden = false; } else panel.hidden = !on;
      if (on && panelStop) setTabStop(panel, '0', film); else clearTabStop(panel);
    });
    state.current = keys[index];
    root.dataset.tab = state.current;
    if (focus) tabs[index].focus({ preventScroll: true });
    onChange?.({ index, key: state.current, cause });
  }

  function open(key, { cause = 'auto', focus = true } = {}) {
    const index = indexOf(key);
    if (index < 0) return;
    if (state.mode !== 'drill') { select(index, { cause }); return; }
    panels.forEach((panel, i) => {
      if (!panel) return;
      const on = i === index;
      panel.hidden = !on;
      panel.classList.toggle('is-current', on);
      tabs[i].setAttribute('aria-expanded', String(on));
    });
    root.classList.add('is-open');
    state.openKey = keys[index];
    state.current = keys[index];
    if (bar) {
      bar.hidden = false;
      const next = bar.querySelector('[data-tabs-next]');
      if (next) next.hidden = index >= tabs.length - 1;
    }
    const pager = panels[index]?.querySelector('[data-pager]')?.csPager;
    if (pager) { pager.refresh(); pager.goTo(0, { animate: false, announce: false }); }
    const heading = panels[index]?.querySelector('h2[tabindex="-1"], h3[tabindex="-1"], h4[tabindex="-1"]');
    if (focus && cause !== 'deeplink' && heading) heading.focus({ preventScroll: true });
    onChange?.({ index, key: state.current, cause });
  }

  function close({ cause = 'auto', focus = true } = {}) {
    if (state.mode !== 'drill' || !state.openKey) return;
    const index = keys.indexOf(state.openKey);
    root.classList.remove('is-open');
    panels.forEach((panel, i) => {
      if (panel) { panel.hidden = true; panel.classList.remove('is-current'); }
      tabs[i].setAttribute('aria-expanded', 'false');
    });
    if (bar) bar.hidden = true;
    state.openKey = null;
    if (focus && tabs[index]) tabs[index].focus({ preventScroll: true });
    onChange?.({ index, key: null, cause });
  }

  /* ---------- input ---------- */

  function onClick(event) {
    const tab = event.target.closest('.tabs__tab');
    if (!tab || !tabs.includes(tab)) return;
    const cause = event.detail === 0 ? 'key' : 'pointer';
    if (state.mode === 'drill') open(keys[tabs.indexOf(tab)], { cause });
    else if (state.inSet.length) select(tabs.indexOf(tab), { cause });
  }

  function onKeydown(event) {
    if (!state.inSet.length || event.altKey || event.ctrlKey || event.metaKey) return;
    const tab = event.target.closest('.tabs__tab');
    if (!tab) return;
    const order = state.inSet;
    const at = order.indexOf(tabs.indexOf(tab));
    if (at < 0) return;
    const vertical = verticalKeys();
    const prevKeys = vertical ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft'];
    const nextKeys = vertical ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight'];
    let to = null;
    if (prevKeys.includes(event.key)) to = order[(at - 1 + order.length) % order.length];
    else if (nextKeys.includes(event.key)) to = order[(at + 1) % order.length];
    else if (event.key === 'Home') to = order[0];
    else if (event.key === 'End') to = order[order.length - 1];
    if (to === null) return;
    event.preventDefault();
    select(to, { cause: 'arrow', focus: true });
  }

  function onPanelKeydown(event) {
    if (state.mode === 'drill' && event.key === 'Escape' && state.openKey) {
      event.preventDefault();
      close({ cause: 'key' });
    }
  }

  function onBarClick(event) {
    if (event.target.closest('[data-tabs-back]')) close({ cause: event.detail === 0 ? 'key' : 'pointer' });
    else if (event.target.closest('[data-tabs-next]') && state.openKey) {
      const next = keys.indexOf(state.openKey) + 1;
      if (next < keys.length) open(keys[next], { cause: event.detail === 0 ? 'key' : 'pointer' });
    }
  }

  const swipeStart = { x: 0, y: 0, id: null };
  function onPointerDown(event) {
    if (event.pointerType === 'mouse' || !state.inSet.length) return;
    Object.assign(swipeStart, { x: event.clientX, y: event.clientY, id: event.pointerId });
  }
  function onPointerUp(event) {
    if (swipeStart.id !== event.pointerId || !state.inSet.length) return;
    swipeStart.id = null;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= SWIPE_RATIO * Math.abs(dy)) return;
    const order = state.inSet;
    const at = order.indexOf(keys.indexOf(state.current));
    const to = order[at + (dx < 0 ? 1 : -1)];
    if (to !== undefined) select(to, { cause: 'swipe' });
  }

  const onMedia = () => { if (applyMode()) onModeChange?.({ tabbed: state.inSet.length > 0, mode: state.mode }); };

  list?.addEventListener('click', onClick);
  list?.addEventListener('keydown', onKeydown);
  root.addEventListener('keydown', onPanelKeydown);
  bar?.addEventListener('click', onBarClick);
  if (swipe && panelsParent) {
    panelsParent.addEventListener('pointerdown', onPointerDown, { passive: true });
    panelsParent.addEventListener('pointerup', onPointerUp, { passive: true });
  }
  queries.forEach((q) => q.mql.addEventListener('change', onMedia));

  applyMode({ initialCause: 'mode' });
  onModeChange?.({ tabbed: state.inSet.length > 0, mode: state.mode });

  const api = {
    select: (keyOrIndex, { cause = 'auto' } = {}) => select(keyOrIndex, { cause }),
    open: (key, { cause = 'auto' } = {}) => open(key, { cause }),
    close: ({ cause = 'auto' } = {}) => close({ cause }),
    get current() { return state.current; },
    get tabbed() { return state.inSet.length > 0; },
    get mode() { return state.mode; },
    destroy() {
      queries.forEach((q) => q.mql.removeEventListener('change', onMedia));
      list?.removeEventListener('click', onClick);
      list?.removeEventListener('keydown', onKeydown);
      root.removeEventListener('keydown', onPanelKeydown);
      bar?.removeEventListener('click', onBarClick);
      panelsParent?.removeEventListener('pointerdown', onPointerDown);
      panelsParent?.removeEventListener('pointerup', onPointerUp);
      clearAll();
      delete root.csTabs;
    },
  };
  root.csTabs = api;   // fit-audit drives the worst cases through it, like el.csPager
  return api;
}
