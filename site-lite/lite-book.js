/**
 * Cargado Strategies Lite: the booking form on one scrolling page (no stepper, no film engine,
 * no sound). It calls the same /api/slots and /api/book as the main site's contact page and
 * reuses its pure modules: slots.js, booking-ui.js and book-calendar.js. Slots are computed
 * locally first, then refreshed from GET /api/slots once per chosen day (6 s timeout; the
 * local slots stay on failure). POST /api/book has a 20 s timeout and no idToken.
 * A local preview (127.0.0.1) skips /api/* unless the URL carries ?api=1, as the main site does.
 */
import { BOOKING } from '../site/assets/js/config.js';
import { bookableDays, openSlots } from '../site/core/lib/slots.js';
import { apiAvailable, dayChip, resultMessage, validateBooking } from '../site/sections/contact/book/booking-ui.js';
import { createCalendar } from '../site/sections/contact/book/book-calendar.js';
import {
  BOOK_TIMEOUT_MS, BOOK_URL, SLOTS_TIMEOUT_MS, SLOTS_URL,
  bookingPayload, requestJson, serviceOptionsHtml, slotOptionsHtml, statusHtml, successHtml, valuesFromForm,
} from './lite-book-core.js';

const SLOT_CHANGED = 'That time is no longer free. Please choose another one.';
const CHOOSE_DAY = 'Choose a day.';
const CHECK_ANSWER = 'Please check this answer.';

function initLiteBooking(form, success) {
  const ui = {
    day: form.querySelector('[data-book-day]'),
    status: form.querySelector('[data-book-status]'),
    send: form.querySelector('[data-book-send]'),
    start: form.elements.start,
  };
  const useApi = apiAvailable(location);
  const st = { days: bookableDays(new Date(), BOOKING), date: '', slots: [], loaded: '', sending: false };
  const localSlots = (date) => openSlots(date, { now: new Date() }, BOOKING);
  const readValues = () => valuesFromForm(Object.fromEntries(new FormData(form).entries()), form.elements.consent.checked);

  form.elements.service.innerHTML = serviceOptionsHtml();

  const setStatus = (result) => { ui.status.innerHTML = result ? statusHtml(result) : ''; };

  function renderSlots(keep = ui.start.value) {
    ui.start.innerHTML = slotOptionsHtml(st.slots);
    if (st.slots.some((s) => s.start === keep)) ui.start.value = keep;
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
    const kept = ui.start.value;
    st.slots = result.body.slots;
    st.loaded = date;
    renderSlots(kept);
    if (kept && ui.start.value !== kept) setStatus({ text: SLOT_CHANGED });
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

  function showSuccess(result) {
    success.innerHTML = successHtml(result);
    form.hidden = true;
    success.hidden = false;
    success.focus({ preventScroll: false });
  }

  function showFailure(result) {
    setStatus(result);
    if (result.fields.length) showErrors(result.fields.map((id) => ({ id, message: CHECK_ANSWER })));
    if (result.reloadSlots) refreshSlots({ force: true });
    const target = result.step === 'time' ? ui.start : form.querySelector('[aria-invalid="true"]');
    target?.focus();
  }

  function invalid() {
    if (!st.date) {
      setStatus({ text: CHOOSE_DAY });
      calendar.focusCell()?.focus();
      return true;
    }
    const errors = validateBooking(readValues());
    showErrors(errors);
    if (errors.length) form.querySelector(`#book-${errors[0].id}`)?.focus();
    return errors.length > 0;
  }

  async function submit() {
    if (st.sending || invalid()) return;
    const payload = bookingPayload(Object.fromEntries(new FormData(form).entries()), form.elements.consent.checked);
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

  const calendar = createCalendar(form.querySelector('[data-calendar]'), {
    days: st.days,
    isOpen: (date) => localSlots(date).length > 0,
    onChoose: (date) => { chooseDay(date); setStatus(null); refreshSlots(); },
  });
  chooseDay(st.days.find((d) => localSlots(d).length > 0) || st.days[0]);
  calendar.select(st.date);
  refreshSlots();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit();
  });
}

const form = document.querySelector('#book-form');
const success = document.querySelector('#book-success');
if (form && success) initLiteBooking(form, success);
