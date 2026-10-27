/**
 * dashboard.html: the client dashboard (v2 §8.3): KPI tiles, the next consultation,
 * points (running balance chart and history), bookings (upcoming and past tabs),
 * the referral links and the profile. Points are read-only here: the server awards
 * them (§8.4). Every figure comes from model.js (clientStats, pointsSeries).
 * On localhost with ?preview=1 it renders sample data instead (preview.js).
 */
import { requireRole } from '../../../core/account/guard.js';
import { saveProfile, friendlyError } from '../../../core/account/auth.js';
import { myPoints, myBookings } from '../../../core/account/db.js';
import { clientStats, dashboardModel, formatDay, nextBooking, pointsSeries, referralLinks } from '../../../core/account/model.js';
import { $, busy, fillList, formValues, h, setStatus, showMain, startApp, wireCopy } from '../_shared.js';
import { kpi, markPreview, wireShell } from '../dash.js';
import { lineChart } from '../chart.js';
import { isPreview, loadPreview, PREVIEW_SAVED } from '../preview.js';

const STATUS_LABELS = Object.freeze({
  confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', 'no-show': 'Missed', pending: 'Time to be confirmed by email',
});
const READ_FAILED = 'Some details could not load yet. Please try again later.';
const BOOK_URL = 'contact.html#book';

const statusPill = (status) => h('span', { className: 'dash-pill', 'data-tone': status, text: STATUS_LABELS[status] || status });
const td = (label, ...children) => h('td', { 'data-label': label }, ...children);
const meetLink = (b) => (b.meetUrl && b.status === 'confirmed'
  ? h('a', { className: 'link', href: b.meetUrl, target: '_blank', rel: 'noopener', text: 'Join Google Meet' })
  : null);

const pointItem = (p) => h('tr', {},
  td('Event', h('span', { className: 'dash-cell-main', text: p.label })),
  td('Date', p.when),
  h('td', { 'data-label': 'Points', className: 'is-num num', text: `${p.points > 0 ? '+' : ''}${p.points}` }));

const bookingItem = (b) => h('tr', {},
  td('When', h('span', { className: 'dash-cell-main', text: b.when })),
  td('Service', b.service || ''),
  td('Status', statusPill(b.status)),
  h('td', { className: 'is-action' }, meetLink(b)));

function nextCard(b) {
  if (!b) {
    return [h('p', { className: 'hint' }, 'No upcoming consultation. ', h('a', { href: BOOK_URL, text: 'Book a free consultation' }), '.')];
  }
  const action = meetLink(b)
    ? h('a', { className: 'btn btn--primary btn--sm', href: b.meetUrl, target: '_blank', rel: 'noopener', text: 'Join Google Meet' })
    : h('a', { className: 'btn btn--ghost btn--sm', href: BOOK_URL, text: 'Book a Consultation' });
  return [
    h('p', { className: 'dash-next__when', text: b.when }),
    h('p', { className: 'dash-next__meta' }, b.service ? h('span', { text: b.service }) : null, statusPill(b.status)),
    h('div', { className: 'dash-next__action' }, action),
  ];
}

function renderChart(box, history) {
  const series = pointsSeries(history);
  box.hidden = series.length === 0;
  if (!series.length) { box.replaceChildren(); return; }
  const totals = series.map((s) => s.total);
  const label = `Points balance over time, from ${totals[0]} to ${totals.at(-1)} points`;
  box.replaceChildren(lineChart(totals, { label, start: formatDay(series[0].at), end: series.length > 1 ? formatDay(series.at(-1).at) : '' }));
}

function render(model) {
  const stats = clientStats(model);
  $('[data-dash-first]').textContent = model.firstName || 'Client';
  $('[data-dash-balance]').textContent = String(stats.balance);
  $('[data-dash-balance-panel]').textContent = String(stats.balance);
  kpi('upcoming', stats.upcoming);
  kpi('completed', stats.completed);
  kpi('referred', stats.referred);
  $('[data-dash-next]').replaceChildren(...nextCard(nextBooking(model)));
  renderChart($('[data-dash-chart]'), model.history);
  fillList($('[data-dash-history]'), $('[data-dash-history-empty]'), model.history, pointItem);
  fillList($('[data-dash-upcoming]'), $('[data-dash-upcoming-empty]'), model.upcoming, bookingItem);
  fillList($('[data-dash-past]'), $('[data-dash-past-empty]'), model.past, bookingItem);
  const links = referralLinks(model.referralCode, location.origin);
  $('[data-dash-code]').textContent = model.referralCode;
  $('[data-dash-ref-book]').value = links?.book || '';
  $('[data-dash-ref-signup]').value = links?.signUp || '';
}

function wireProfile(form, model, { save, savedText }) {
  form.elements.name.value = model.name;
  form.elements.email.value = model.email;
  form.elements.phone.value = model.phone;
  const line = $('[data-status]', form);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { name, phone } = formValues(form);
    form.elements.name.setAttribute('aria-invalid', String(!name));
    if (!name) { setStatus(line, 'Please enter your name.', 'error'); return; }
    await busy(form, async () => {
      try {
        await save({ name, phone });
        setStatus(line, savedText, 'ok');
      } catch (error) {
        setStatus(line, friendlyError(error), 'error');
      }
    });
  });
}

function show(user, points, bookings, { preview = false } = {}) {
  const model = dashboardModel(user, points, bookings);
  render(model);
  wireProfile($('[data-dash-profile]'), model, preview
    ? { save: async () => {}, savedText: PREVIEW_SAVED }
    : { save: saveProfile, savedText: 'Saved.' });
  wireCopy();
  showMain(user);
  wireShell();
  if (preview) markPreview();
}

export async function initDashboard() {
  if (isPreview()) {
    const sample = await loadPreview('client');
    show(sample.user, sample.points, sample.bookings, { preview: true });
    return;
  }
  if (!startApp()) return;
  const { user } = await requireRole('client');
  const [points, bookings] = await Promise.all([myPoints(user.uid), myBookings(user)]);
  show(user, points, bookings);
  if (points.error || bookings.error) setStatus($('[data-status]', $('[data-dash-profile]')), READ_FAILED, 'error');
}
