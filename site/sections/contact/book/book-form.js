/**
 * The booking stepper (spec §6.4) on the #book paper: ui-stepper.js with
 *   1 Day (a month calendar, Winnipeg dates) · 2 Time (Central Time) · 3 Your Details.
 * From 760 px wide step 3 is one page; phones take it in two shorter steps, so no
 * step outgrows the screen. Pure helpers live in booking-ui.js.
 *
 * Slots are computed locally first (core/lib/slots.js, the same rules as api/),
 * then refreshed from GET /api/slots when the visitor reaches the time step, so a
 * slot busy in the owner's calendar disappears. Without api/ (a local static
 * preview, or a failed request) the local slots stay and the form still works.
 * POST /api/book answers are turned into messages by resultMessage().
 * Required fields use aria-required, not `required`: validation is ours.
 */
import { BOOKING, CATEGORIES, categoryBySlug } from '../../../assets/js/config.js';
import { escapeHtml } from '../../../core/chrome/chrome.js';
import { pageLink } from '../../../core/chrome/whatsapp.js';
import { titleCase } from '../../../core/lib/text-case.js';
import { bookableDays, openSlots } from '../../../core/lib/slots.js';
import { createStepper } from '../../../core/ui/ui-stepper.js';
import { apiAvailable, buildBookingPayload, dayChip, formatSlotLabel, resultMessage, validateBooking } from './booking-ui.js';
import { createCalendar } from './book-calendar.js';

const PAGE = 'contact';
const PAGE_QUERY = '(min-width: 760px)';
const SLOTS_URL = '/api/slots';
const BOOK_URL = '/api/book';
const SLOTS_TIMEOUT_MS = 6000;
const BOOK_TIMEOUT_MS = 20000;
const STEP_TITLE = (unit, total, name) => `Step ${unit + 1} of ${total} · ${name}`;
const STEP_UNIT = { date: 0, time: 1, details: 2 };
const NEW_TAB = 'target="_blank" rel="noopener"';

/** fetch with a timeout → { status, body } or null (no answer, or not JSON). Never logs. */
async function requestJson(url, options, timeoutMs) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: abort.signal });
    const body = await response.json().catch(() => null);
    return body ? { status: response.status, body } : null;
  } catch {
    return null; // offline, blocked or timed out: the caller falls back
  } finally {
    clearTimeout(timer);
  }
}

function serviceOptions() {
  const opt = (c) => `<option value="${c.slug}">${escapeHtml(titleCase(c.name))}</option>`;
  const ours = CATEGORIES.filter((c) => c.ownership !== 'partner');
  const partners = CATEGORIES.filter((c) => c.ownership === 'partner');
  return `<option value="">Choose a service</option>
    <optgroup label="Cargado Strategies">${ours.map(opt).join('')}</optgroup>
    <optgroup label="Partner Introductions">${partners.map(opt).join('')}</optgroup>`;
}

function slotOptions(slots) {
  if (!slots.length) return '<option value="">No times left on this day</option>';
  return `<option value="">Choose a time</option>${slots.map((s) => `<option value="${s.start}">${escapeHtml(s.label)}</option>`).join('')}`;
}

const safeMeetUrl = (url) => (/^https:\/\/[^\s"'<>]+$/.test(url) ? url : '');

function successMarkup(result) {
  const meet = safeMeetUrl(result.meetUrl);
  const link = meet
    ? `<a class="btn btn--primary" href="${escapeHtml(meet)}" ${NEW_TAB}>Open Google Meet <span class="btn__arrow" aria-hidden="true">→</span><span class="visually-hidden"> (opens in a new tab)</span></a>`
    : '';
  return `
  <h2 class="book-success__title">${escapeHtml(result.title)}</h2>
  <p class="book-success__text">${escapeHtml(result.text)}</p>
  ${link}`;
}

function statusMarkup(result) {
  const wa = result.whatsapp
    ? ` <a class="link" href="${pageLink(PAGE)}" ${NEW_TAB} data-wa-sheet data-context="${PAGE}">Message on WhatsApp</a>`
    : '';
  return `${escapeHtml(result.text)}${wa}`;
}

/**
 * Wire the booking form in `panel` (#book-panel). `service` preselects a category slug.
 * Returns { stepper, setService(slug) }.
 */
export function initBooking({ panel, film, sound, service = '', now = () => new Date() }) {
  const form = panel.querySelector('#book-form');
  const success = panel.querySelector('#book-success');
  const scene = panel.closest('.scene');
  const ui = {
    day: form.querySelector('[data-book-day]'),
    status: form.querySelector('[data-book-status]'),
    send: form.querySelector('[data-step-send]'),
  };
  const useApi = apiAvailable(location);
  const st = { days: bookableDays(now(), BOOKING), date: '', slots: [], loaded: '', sending: false };

  form.elements.service.innerHTML = serviceOptions();

  const localSlots = (date) => openSlots(date, { now: now() }, BOOKING);

  function setStatus(result) {
    ui.status.innerHTML = result ? statusMarkup(result) : '';
  }

  function renderSlots(keep = form.elements.start.value) {
    form.elements.start.innerHTML = slotOptions(st.slots);
    if (st.slots.some((s) => s.start === keep)) form.elements.start.value = keep;
    ui.day.textContent = st.date ? dayChip(st.date).full : '';
  }

  function chooseDay(date) {
    if (date === st.date) return;
    st.date = date;
    st.slots = localSlots(date);
    st.loaded = '';
    renderSlots('');
  }

  /** The owner's live free/busy for the chosen day (once per day); local slots stay on failure. */
  async function refreshSlots({ force = false } = {}) {
    if (!useApi || !st.date || (st.loaded === st.date && !force)) return;
    const date = st.date;
    const result = await requestJson(`${SLOTS_URL}?date=${encodeURIComponent(date)}`, { headers: { Accept: 'application/json' } }, SLOTS_TIMEOUT_MS);
    if (date !== st.date || !result?.body?.ok || !Array.isArray(result.body.slots)) return;
    const kept = form.elements.start.value;
    st.slots = result.body.slots;
    st.loaded = date;
    renderSlots(kept);
    if (kept && form.elements.start.value !== kept) setStatus({ text: 'That time is no longer free. Please choose another one.' });
  }

  function firstOpenDay() {
    return st.days.find((d) => localSlots(d).length > 0) || st.days[0];
  }

  function readForm() {
    const data = Object.fromEntries(new FormData(form).entries());
    const category = categoryBySlug(data.service || '');
    return { ...data, consent: form.elements.consent.checked, service: category ? titleCase(category.name) : '' };
  }

  function showErrors(errors) {
    form.querySelectorAll('.error').forEach((p) => { p.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    errors.forEach(({ id, message }) => {
      const error = form.querySelector(`#book-${id}-error`);
      if (error) error.textContent = message;
      form.querySelector(`#book-${id}`)?.setAttribute('aria-invalid', 'true');
    });
  }

  /** The errors of the visible unit only (the stepper asks per unit). */
  function validateUnit(stepEls) {
    const ids = new Set(stepEls.flatMap((s) => Array.from(s.querySelectorAll('[id^="book-"]')).map((el) => el.id.slice(5))));
    if (stepEls.some((s) => s.dataset.step === 'date') && !st.date) return [{ field: calendar.focusCell(), message: 'Choose a day.' }];
    const errors = validateBooking(readForm()).filter((err) => ids.has(err.id));
    showErrors(errors);
    return errors.map((err) => ({ field: form.querySelector(`#book-${err.id}`), message: err.message }));
  }

  function showSuccess(result) {
    success.innerHTML = successMarkup(result);
    form.hidden = true;
    success.hidden = false;
    success.focus({ preventScroll: true });
    sound?.('chime');
  }

  function showFailure(result) {
    setStatus(result);
    if (result.fields.length) {
      showErrors(result.fields.map((id) => ({ id, message: 'Please check this answer.' })));
    }
    if (result.step) stepper.go(STEP_UNIT[result.step] ?? stepper.unit, { focus: false });
    if (result.reloadSlots) refreshSlots({ force: true });
    sound?.('error');
  }

  async function submit() {
    if (st.sending) return;
    const values = readForm();
    const payload = buildBookingPayload(values);
    setStatus(null);
    if (!useApi) { showFailure(resultMessage(null)); return; }
    st.sending = true;
    ui.send.setAttribute('aria-busy', 'true');
    ui.send.disabled = true;
    const response = await requestJson(BOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    }, BOOK_TIMEOUT_MS);
    st.sending = false;
    ui.send.removeAttribute('aria-busy');
    ui.send.disabled = false;
    const result = resultMessage(response, payload.start);
    if (result.done) showSuccess(result);
    else showFailure(result);
  }

  const stepper = createStepper(form, {
    pageWhen: PAGE_QUERY,
    validateUnit,
    film,
    sound,
    countText: ({ unit, total, name }) => STEP_TITLE(unit, total, name),
    onStep: ({ unit, mode }) => {
      scene.dataset.step = String(unit + 1);
      form.dataset.mode = mode;
      if (unit === STEP_UNIT.time) refreshSlots();
    },
    onSubmit: submit,
  });

  const calendar = createCalendar(form.querySelector('[data-calendar]'), {
    days: st.days,
    isOpen: (date) => localSlots(date).length > 0,
    onChoose: (date) => { chooseDay(date); setStatus(null); },
  });
  chooseDay(firstOpenDay());
  calendar.select(st.date);
  scene.dataset.step = '1';
  form.dataset.mode = stepper.mode;

  function setService(slug) {
    if (slug && form.elements.service.querySelector(`option[value="${CSS.escape(slug)}"]`)) form.elements.service.value = slug;
  }
  setService(service);

  return { stepper, setService };
}
