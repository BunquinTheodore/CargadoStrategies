/**
 * admin.html: the owner's dashboard (v2 §8.3, §10b). Lists come straight from
 * Firestore (admin read access from firestore.rules); every change goes through
 * /api/admin/<action>, which checks the admin role on the server and logs it.
 *
 * Applications: approve / decline. Bookings: set the status. Clients: role and
 * points. Forms: adjust points (with a reason), mark a service acquired, assign a
 * referral to a partner. The KPI tiles count the
 * lists (model.js adminStats). On localhost with ?preview=1 it renders sample data
 * and no action is sent (preview.js).
 */
import { CATEGORIES } from '../../../assets/js/config.js';
import { requireRole } from '../../../core/account/guard.js';
import { adminAction, adminMessage } from '../../../core/account/admin-api.js';
import { adminLists } from '../../../core/account/db.js';
import { adminStats, formatDay, formatWhen } from '../../../core/account/model.js';
import { BOOKING_STATUSES } from '../../../core/account/schema.js';
import { $, $$, busy, fillList, formValues, h, setStatus, showMain, startApp } from '../_shared.js';
import { kpi, markPreview, wireShell } from '../dash.js';
import { isPreview, loadPreview, PREVIEW_SAVED } from '../preview.js';

const SERVICES = CATEGORIES.filter((c) => c.ownership !== 'partner').map((c) => ({ value: c.slug, label: c.name }));
const READ_FAILED = 'Some lists could not load. Firestore or its rules may not be set up yet.';
const pending = (status) => !status || status === 'pending';
const personLabel = (u) => [u.name, u.email].filter(Boolean).join(' · ') || u.id;

/** Run an admin action from a control; report on `line`; reload the lists after a success. */
async function sendAction(action, body, line, reload) {
  setStatus(line, 'Saving…');
  const result = await adminAction(action, body);
  setStatus(line, adminMessage(result), result.ok ? 'ok' : 'error');
  if (result.ok) await reload();
  return result.ok;
}

/** The preview sends nothing: every action only says so. */
async function previewAction(action, body, line) {
  setStatus(line, PREVIEW_SAVED, 'ok');
  return false;
}

const td = (label, ...children) => h('td', { 'data-label': label }, ...children);
const pill = (text) => h('span', { className: 'dash-pill', 'data-tone': text, text });

function applicationItem(app, ctx) {
  const act = (action) => () => ctx.run(action, { applicationId: app.id }, ctx.line, ctx.reload);
  return h('tr', {},
    td('Applicant', h('span', { className: 'dash-cell-main', text: [app.business, app.contact].filter(Boolean).join(' · ') || app.email })),
    td('Email', app.email || ''),
    td('Received', formatDay(app.createdAt)),
    td('Status', pill(app.status || 'pending')),
    h('td', { className: 'is-action' }, pending(app.status) ? h('span', { className: 'dash-actions' },
      h('button', { type: 'button', className: 'btn btn--primary btn--sm', onclick: act('approve-partner'), text: 'Approve' }),
      h('button', { type: 'button', className: 'btn btn--ghost btn--sm', onclick: act('decline-partner'), text: 'Decline' })) : null));
}

function bookingItem(booking, ctx) {
  const select = h('select', { className: 'select', 'aria-label': `Status of the booking on ${formatWhen(booking.start)}` },
    BOOKING_STATUSES.map((s) => h('option', { value: s, text: s, selected: s === (booking.status || 'confirmed') })));
  const save = () => ctx.run('set-booking-status', { bookingId: booking.id, status: select.value }, ctx.line, ctx.reload);
  return h('tr', {},
    td('When', h('span', { className: 'dash-cell-main', text: formatWhen(booking.start) || booking.start || '' })),
    td('Client', [booking.name, booking.email].filter(Boolean).join(' · ')),
    td('Service', booking.service || ''),
    h('td', { 'data-label': 'Status', className: 'is-action' },
      h('span', { className: 'dash-actions' }, select, h('button', { type: 'button', className: 'btn btn--ghost btn--sm', onclick: save, text: 'Save' }))));
}

const userItem = (u) => h('tr', {},
  td('Account', h('span', { className: 'dash-cell-main', text: personLabel(u) })),
  td('Role', pill(u.role || 'client')),
  td('Code', u.referralCode ? h('span', { className: 'num', text: u.referralCode }) : ''),
  h('td', { 'data-label': 'Points', className: 'is-num num', text: `${Number(u.points) || 0} pts` }));

const option = (value, label) => h('option', { value, text: label });

function fillSelects(users) {
  const sets = {
    clients: users.filter((u) => (u.role || 'client') === 'client').map((u) => ({ value: u.id, label: personLabel(u) })),
    partners: users.filter((u) => u.role === 'partner').map((u) => ({ value: u.id, label: personLabel(u) })),
    services: SERVICES,
  };
  $$('select[data-options]').forEach((select) => {
    const items = sets[select.dataset.options] || [];
    select.replaceChildren(option('', items.length ? 'Choose…' : 'None yet'), ...items.map((i) => option(i.value, i.label)));
  });
}

/** Form values → the action's body (numbers as numbers); '' when a required field is empty. */
function bodyOf(form) {
  const values = formValues(form);
  const missing = $$('[required]', form).find((el) => !values[el.name]);
  $$('[required]', form).forEach((el) => el.setAttribute('aria-invalid', String(!values[el.name])));
  if (missing) return null;
  ['points', 'amount'].forEach((key) => { if (key in values) values[key] = Number(values[key]); });
  if (form.dataset.adminForm === 'assign-referral') {
    const client = $('select[name="clientUid"] option:checked', form);
    values.clientName = client ? client.textContent.split(' · ')[0] : '';
  }
  return values;
}

function wireForms(ctx) {
  $$('[data-admin-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const line = $('[data-status]', form);
    const body = bodyOf(form);
    if (!body || (form.dataset.adminForm === 'adjust-points' && !Number.isInteger(body.points))) {
      setStatus(line, 'Please fill in every field.', 'error');
      return;
    }
    await busy(form, async () => { if (await ctx.run(form.dataset.adminForm, body, line, ctx.reload)) form.reset(); });
  }));
}

function renderLists(lists, ctx) {
  const { applications, bookings, users } = lists;
  Object.entries(adminStats(lists)).forEach(([name, value]) => kpi(name, value));
  fillList($('[data-admin-applications]'), $('[data-admin-applications-empty]'), applications, (a) => applicationItem(a, ctx));
  fillList($('[data-admin-bookings]'), $('[data-admin-bookings-empty]'), bookings, (b) => bookingItem(b, ctx));
  fillList($('[data-admin-users]'), $('[data-admin-users-empty]'), users, userItem);
  fillSelects(users);
  if (applications.error || bookings.error || users.error) setStatus(ctx.line, READ_FAILED, 'error');
}

function show(user, ctx, preview) {
  wireForms(ctx);
  showMain(user);
  wireShell();
  if (preview) markPreview();
}

export async function initAdmin() {
  const ctx = { line: $('[data-admin-status]'), run: sendAction, reload: null };
  if (isPreview()) {
    const sample = await loadPreview('admin');
    ctx.run = previewAction;
    ctx.reload = async () => renderLists(sample.lists, ctx);
    await ctx.reload();
    show(sample.user, ctx, true);
    return;
  }
  if (!startApp()) return;
  const { user } = await requireRole('admin');
  ctx.reload = async () => renderLists(await adminLists(), ctx);
  await ctx.reload();
  show(user, ctx, false);
}
