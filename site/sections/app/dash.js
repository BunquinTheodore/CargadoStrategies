/**
 * The dashboard shell shared by dashboard.html, partner-dashboard.html and admin.html.
 *
 *   wireDashNav(root)   the section links: smooth jump, aria-current follows the panel in view
 *   wireTabs(root)      [data-dash-tabs]: APG tabs (arrows, Home, End) over [role="tabpanel"]
 *   markPreview()       shows the "Preview · sample data" badge
 *   kpi(name, value)    fills [data-kpi="name"]
 *
 * Plain anchors still work without this module (no JS, or before it runs).
 */
import { $, $$ } from './_shared.js';

/* A panel counts as "in view" once it crosses the upper third of the viewport. */
const VIEW_MARGIN = '-30% 0px -60% 0px';

function setCurrent(links, id) {
  links.forEach((a) => {
    if (a.hash === `#${id}`) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
}

export function wireDashNav(root = document) {
  const links = $$('.dash-nav a[href^="#"]', root);
  const panels = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  if (!panels.length) return;
  setCurrent(links, panels[0].id);
  links.forEach((a) => a.addEventListener('click', () => setCurrent(links, a.hash.slice(1))));
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (hit) setCurrent(links, hit.target.id);
  }, { rootMargin: VIEW_MARGIN });
  panels.forEach((p) => io.observe(p));
}

function selectTab(tabs, tab, focus) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) tab.focus();
}

const TAB_KEYS = Object.freeze({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 });

export function wireTabs(root = document) {
  $$('[data-dash-tabs]', root).forEach((list) => {
    const tabs = $$('[role="tab"]', list);
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectTab(tabs, tab, false));
      tab.addEventListener('keydown', (event) => {
        let next = null;
        if (event.key in TAB_KEYS) next = tabs[(i + TAB_KEYS[event.key] + tabs.length) % tabs.length];
        else if (event.key === 'Home') next = tabs[0];
        else if (event.key === 'End') next = tabs.at(-1);
        if (!next) return;
        event.preventDefault();
        selectTab(tabs, next, true);
      });
    });
  });
}

export function markPreview() {
  const badge = $('[data-preview-badge]');
  if (badge) badge.hidden = false;
  document.documentElement.dataset.preview = '';
}

export function kpi(name, value) {
  const el = $(`[data-kpi="${name}"]`);
  if (el) el.textContent = String(value);
}

/** Every page's shell wiring, once the main block is shown. */
export function wireShell(root = document) {
  wireDashNav(root);
  wireTabs(root);
}
