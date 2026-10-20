/**
 * Forms in steps inside one scene (R4 shared.md §6.3, api.md §17.3; partners §5.2).
 *
 *   createStepper(form, { pageWhen, validateUnit, onStep, onSubmit, focusTo, film, sound, countText })
 *   → { go(unit, { focus, cause }), next(), back(), reset(), unit, total, mode, hideIndex(), showIndex() }
 *
 * Units are 0-based. A unit is one [data-step], or, while `pageWhen` matches,
 * every step that shares a data-page (mode 'page'; otherwise mode 'step').
 *
 * Announcements: every unit change moves focus to the first visible
 * .stepper__title, whose hidden [data-step-of] span carries ", step 3 of 8" or
 * ", part 2 of 4". No live-region write on a unit change; [data-step-live] is
 * written only when the mode changes without a focus move. A failed Next
 * focuses the first invalid field, shows "{n} answer(s) need(s) a second
 * look." in .stepper__errors and plays sound('error').
 *
 * Submit: before the last unit any submit is Next (implicit submission clicks
 * the first submit button even when it is hidden). On the last unit every unit
 * is validated; the earliest unit with an error is shown, otherwise
 * onSubmit(via) runs with via = the submitter's value, or 'default'.
 */
import { focusInScene } from './ui-focus.js';

const ERROR_TEXT = (n) => (n === 1 ? '1 answer needs a second look.' : `${n} answers need a second look.`);

const titleText = (el) => {
  if (!el) return '';
  const copy = el.cloneNode(true);
  copy.querySelectorAll('[data-step-of], .visually-hidden').forEach((n) => n.remove());
  return copy.textContent.trim().replace(/\s+/g, ' ');
};

function fieldEl(form, field) {
  if (!field) return null;
  if (field instanceof Element) return field;
  const named = form.elements[field];
  if (named instanceof RadioNodeList) return named[0] || null;
  return named || form.querySelector(`#${CSS.escape(field)}`);
}

export function createStepper(form, {
  pageWhen,
  validateUnit = () => [],
  onStep,
  onSubmit,
  focusTo,
  film,
  sound,
  countText,
} = {}) {
  const steps = Array.from(form.querySelectorAll('[data-step]'));
  const scope = form.closest('.scene') || form.parentElement || form;
  const q = (sel) => form.querySelector(sel);
  const ui = {
    back: q('[data-step-back]'),
    next: q('[data-step-next]'),
    send: q('[data-step-send]'),
    alt: q('[data-step-alt]'),
    errors: q('.stepper__errors'),
    live: q('[data-step-live]'),
    label: q('.stepper__label, .stepper__count'),
    now: q('[data-step-now]'),
    totalEl: q('[data-step-total]'),
    nextName: q('[data-next-name]'),
    sendHint: q('.stepper__send-hint'),
  };
  const indexes = () => Array.from(scope.querySelectorAll('.stepper__index'));
  const mql = pageWhen ? window.matchMedia(pageWhen) : null;
  const st = { unit: 0, furthest: 0, mode: mql?.matches ? 'page' : 'step', units: [] };
  const focus = focusTo || ((el) => focusInScene(el, { film }));

  function buildUnits() {
    if (st.mode !== 'page') return steps.map((s) => [s]);
    const groups = new Map();
    steps.forEach((s) => {
      const key = s.dataset.page || s.dataset.step;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    });
    return Array.from(groups.values());
  }
  st.units = buildUnits();

  const total = () => st.units.length;
  const isLast = () => st.unit >= total() - 1;
  const titlesOf = (unit) => (st.units[unit] || []).map((s) => s.querySelector('.stepper__title')).filter(Boolean);
  const nameOf = (unit) => {
    const first = st.units[unit]?.[0];
    if (!first) return '';
    if (st.mode === 'page') return first.dataset.pageName || first.dataset.page || titleText(titlesOf(unit)[0]);
    return first.dataset.stepName || first.dataset.step || titleText(titlesOf(unit)[0]);
  };
  const unitOf = (el) => st.units.findIndex((group) => group.some((s) => s.contains(el)));

  function clearErrors() {
    if (!ui.errors) return;
    ui.errors.hidden = true;
    ui.errors.textContent = '';
  }

  function render(unit) {
    st.unit = Math.max(0, Math.min(total() - 1, unit));
    const shown = new Set(st.units[st.unit]);
    const n = total();
    const count = st.mode === 'page' ? `, part ${st.unit + 1} of ${n}` : `, step ${st.unit + 1} of ${n}`;
    steps.forEach((s) => {
      const on = shown.has(s);
      s.hidden = !on;
      s.querySelectorAll('[data-step-of]').forEach((span) => { span.textContent = on ? count : ''; });
    });
    form.style.setProperty('--step-progress', String((st.unit + 1) / n));
    if (ui.now) ui.now.textContent = String(st.unit + 1);
    if (ui.totalEl) ui.totalEl.textContent = String(n);
    if (ui.label && countText) ui.label.textContent = countText({ unit: st.unit, total: n, mode: st.mode, name: nameOf(st.unit) });
    else if (ui.label && !ui.now) ui.label.textContent = `${st.unit + 1} / ${n}`;
    if (ui.back) ui.back.hidden = st.unit === 0;
    if (ui.next) ui.next.hidden = isLast();
    if (ui.send) ui.send.hidden = !isLast();
    if (ui.alt) ui.alt.hidden = !isLast();
    if (ui.sendHint) ui.sendHint.hidden = !isLast();
    if (ui.nextName) ui.nextName.textContent = isLast() ? '' : `: ${titleText(titlesOf(st.unit + 1)[0]) || nameOf(st.unit + 1)}`;
    indexes().forEach((index) => {
      index.querySelectorAll('[data-goto-page], [data-goto-unit]').forEach((btn, i) => {
        btn.toggleAttribute('aria-current', false);
        if (i === st.unit) btn.setAttribute('aria-current', 'step');
        btn.disabled = i > st.furthest;
      });
    });
    clearErrors();
  }

  function go(unit, { focus: move = true, cause = 'api' } = {}) {
    render(unit);
    onStep?.({ unit: st.unit, total: total(), mode: st.mode, cause });
    if (move) {
      const title = titlesOf(st.unit)[0];
      if (title) focus(title);
    }
  }

  function showErrors(errors) {
    const first = fieldEl(form, errors[0]?.field);
    if (ui.errors) {
      ui.errors.textContent = ERROR_TEXT(errors.length);
      ui.errors.hidden = false;
    }
    sound?.('error');
    if (first) focus(first);
  }

  function next({ cause = 'next' } = {}) {
    const errors = validateUnit(st.units[st.unit]) || [];
    if (errors.length) { showErrors(errors); return false; }
    if (isLast()) return true;
    st.furthest = Math.max(st.furthest, st.unit + 1);
    go(st.unit + 1, { cause });
    return true;
  }

  function back({ cause = 'back' } = {}) {
    if (st.unit === 0) return;
    go(st.unit - 1, { cause });
  }

  function onSubmitEvent(event) {
    event.preventDefault();
    if (!isLast()) { next({ cause: 'submit' }); return; }
    for (let u = 0; u < total(); u += 1) {
      const errors = validateUnit(st.units[u]) || [];
      if (errors.length) {
        if (u !== st.unit) go(u, { focus: false, cause: 'error' });
        showErrors(errors);
        return;
      }
    }
    const via = event.submitter?.value || 'default';
    onSubmit?.(via);
  }

  function onModeChange() {
    const mode = mql?.matches ? 'page' : 'step';
    if (mode === st.mode) return;
    const firstStep = st.units[st.unit]?.[0];
    const furthestStep = st.units[st.furthest]?.[0];
    st.mode = mode;
    st.units = buildUnits();
    const unit = Math.max(0, unitOf(firstStep));
    st.furthest = Math.max(unit, unitOf(furthestStep));
    render(unit);
    onStep?.({ unit: st.unit, total: total(), mode: st.mode, cause: 'mode' });
    if (ui.live) {
      const names = titlesOf(st.unit).map(titleText).join(', ');
      ui.live.textContent = mode === 'page'
        ? `Now on part ${st.unit + 1} of ${total()}: ${names}.`
        : `Now on step ${st.unit + 1} of ${total()}: ${names}.`;
    }
  }

  form.addEventListener('submit', onSubmitEvent);
  ui.back?.addEventListener('click', () => back());
  if (ui.next && ui.next.type !== 'submit') ui.next.addEventListener('click', () => next());
  scope.addEventListener('click', (event) => {
    const btn = event.target.closest('.stepper__index [data-goto-page], .stepper__index [data-goto-unit]');
    if (!btn || btn.disabled) return;
    const i = Array.from(btn.closest('.stepper__index').querySelectorAll('[data-goto-page], [data-goto-unit]')).indexOf(btn);
    if (i >= 0 && i <= st.furthest) go(i, { cause: 'index' });
  });
  mql?.addEventListener('change', onModeChange);

  render(0);

  const api = {
    go,
    next: () => next(),
    back: () => back(),
    reset() { st.furthest = 0; go(0, { focus: false, cause: 'reset' }); },
    get unit() { return st.unit; },
    get total() { return total(); },
    get mode() { return st.mode; },
    hideIndex() { indexes().forEach((el) => { el.hidden = true; }); },
    showIndex() { indexes().forEach((el) => { el.hidden = false; }); },
  };
  form.csStepper = api;   // fit-audit drives the worst cases through it, like el.csPager
  return api;
}
