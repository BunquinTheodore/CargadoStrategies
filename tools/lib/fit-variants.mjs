/**
 * In-page "interactive worst case" helpers for tools/fit-audit.mjs (R4 shared.md §8.5-8.6).
 * Each export is self-contained (serialised into the page with `${fn}`).
 *
 * listVariants(i)        the states to visit in scene i: every tab of every tabbed [data-tabs],
 *                        every item of every details[name] group, every page of every pager
 *                        (el.csPager), every unit of every form.stepper plus its all-errors pass.
 * applyVariant(i, v)     puts scene i in state v; every change is recorded for undo.
 * undoVariants()         restores everything applyVariant changed (reverse order).
 * pagerClip(i)           for the pagers of scene i, px by which an on-page item ends below its window.
 * phRepeat(n)            repeats every .ph text n times (legal S6, the counsel-length stand-in).
 */

export function listVariants(i) {
  const scene = document.querySelectorAll('section.scene')[i];
  if (!scene) return [];
  const shown = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible';
  const out = [];
  scene.querySelectorAll('[data-tabs]').forEach((root, r) => {
    if (!root.classList.contains('is-tabbed')) return;
    const tabs = [...root.querySelectorAll('[role="tab"]')].filter((t) => !t.hidden && shown(t));
    tabs.forEach((t, k) => out.push({ kind: 'tab', root: r, index: k, name: `tab ${t.textContent.trim().replace(/\s+/g, ' ').slice(0, 24)}` }));
  });
  const groups = new Map();
  scene.querySelectorAll('details[name]').forEach((d, k) => {
    if (!shown(d)) return;
    if (!groups.has(d.name)) groups.set(d.name, []);
    groups.get(d.name).push(k);
  });
  groups.forEach((list, name) => list.forEach((k, n) => out.push({ kind: 'details', index: k, name: `details ${name} #${n + 1}` })));
  [...scene.querySelectorAll('*')].filter((el) => el.csPager).forEach((el, r) => {
    const pages = Number(el.csPager.pages) || 1;
    for (let p = 1; p < pages; p++) out.push({ kind: 'pager', root: r, page: p, name: `pager ${r + 1} page ${p + 1}/${pages}` });
  });
  scene.querySelectorAll('form.stepper').forEach((form, f) => {
    const api = form.csStepper;
    const total = api ? Number(api.total) : form.querySelectorAll('.stepper__step').length;
    for (let u = 0; u < total; u++) {
      out.push({ kind: 'step', form: f, unit: u, errors: false, name: `form ${f + 1} unit ${u + 1}/${total}` });
      out.push({ kind: 'step', form: f, unit: u, errors: true, name: `form ${f + 1} unit ${u + 1}/${total} all-errors` });
    }
  });
  return out;
}

export function applyVariant(i, v) {
  const scene = document.querySelectorAll('section.scene')[i];
  const undo = (window.__fitUndo = window.__fitUndo || []);
  const setAttr = (el, name, value) => {
    const had = el.hasAttribute(name), old = el.getAttribute(name);
    undo.push(() => (had ? el.setAttribute(name, old) : el.removeAttribute(name)));
    if (value === null) el.removeAttribute(name); else el.setAttribute(name, value);
  };
  const setText = (el, text) => {
    const old = el.textContent;
    undo.push(() => { el.textContent = old; });
    el.textContent = text;
  };
  if (v.kind === 'tab') {
    const root = [...scene.querySelectorAll('[data-tabs]')].filter((r) => r.classList.contains('is-tabbed'))[v.root];
    const tabs = [...root.querySelectorAll('[role="tab"]')].filter((t) => !t.hidden);
    const before = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const pick = (k) => (root.csTabs?.select ? root.csTabs.select(k, { cause: 'auto' }) : tabs[k]?.click());
    undo.push(() => pick(Math.max(0, before)));
    pick(v.index);
  } else if (v.kind === 'details') {
    const all = [...scene.querySelectorAll('details[name]')];
    const target = all[v.index];
    all.filter((d) => d.name === target.name).forEach((d) => {
      const was = d.open;
      undo.push(() => { d.open = was; });
      d.open = d === target;
    });
  } else if (v.kind === 'pager') {
    const el = [...scene.querySelectorAll('*')].filter((x) => x.csPager)[v.root];
    undo.push(() => el.csPager.goTo(0, { animate: false, announce: false }));
    el.csPager.goTo(v.page, { animate: false, announce: false });
  } else if (v.kind === 'step') {
    const form = scene.querySelectorAll('form.stepper')[v.form];
    const api = form.csStepper;
    if (api) {
      const before = Number(api.unit) || 0;
      undo.push(() => api.go(before, { focus: false, cause: 'auto' }));
      api.go(v.unit, { focus: false, cause: 'auto' });
    } else {
      form.querySelectorAll('.stepper__step').forEach((s, k) => setAttr(s, 'hidden', k === v.unit ? null : ''));
    }
    if (v.errors) {
      const MESSAGE = 'Please check this answer: it needs a second look before you continue.';
      form.querySelectorAll('.error, [data-error]').forEach((e) => {
        setAttr(e, 'hidden', null);
        if (!e.textContent.trim()) setText(e, MESSAGE);
      });
      form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach((f) => setAttr(f, 'aria-invalid', 'true'));
      form.querySelectorAll('.stepper__errors').forEach((e) => {
        setAttr(e, 'hidden', null);
        if (!e.textContent.trim()) setText(e, '3 answers need a second look.');
      });
    }
  }
}

export function undoVariants() {
  const undo = window.__fitUndo || [];
  while (undo.length) {
    try { undo.pop()(); } catch { /* the element went away with a re-render */ }
  }
}

export function pagerClip(i) {
  const scene = document.querySelectorAll('section.scene')[i];
  let worst = 0;
  [...scene.querySelectorAll('*')].filter((el) => el.csPager).forEach((root) => {
    const win = root.querySelector('.pager__window') || root;
    const bottom = win.getBoundingClientRect().bottom;
    const items = root.querySelectorAll('[data-page-item]').length
      ? [...root.querySelectorAll('[data-page-item]:not(.is-off-page)')]
      : [...root.children].filter((c) => !c.hidden && c.getClientRects().length);
    items.forEach((it) => { worst = Math.max(worst, it.getBoundingClientRect().bottom - bottom); });
  });
  return Math.round(worst);
}

export function phRepeat(n) {
  document.querySelectorAll('.ph:not([data-ph-x])').forEach((el) => {
    if (el.children.length) return; // only plain-text placeholders; nested markup is left alone
    el.textContent = Array.from({ length: n }, () => el.textContent.trim()).join(' ');
    el.setAttribute('data-ph-x', String(n));
  });
}
