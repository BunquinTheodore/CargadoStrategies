/**
 * partner-dashboard.html: the partner dashboard (v2 §8.3): KPI tiles, referrals from
 * Cargado Strategies and the profile (edits wait for the owner's review). No money is shown
 * (owner, 2026-10-27: the earnings tile, chart and list were removed).
 * On localhost with ?preview=1 it renders sample data instead (preview.js).
 */
import { requireRole } from '../../../core/account/guard.js';
import { friendlyError } from '../../../core/account/auth.js';
import { myPartnerProfile, myReferrals, savePartnerProfile } from '../../../core/account/db.js';
import { partnerModel, partnerStats, partnerStatus } from '../../../core/account/model.js';
import { $, busy, fillList, formValues, h, setStatus, showMain, startApp } from '../_shared.js';
import { kpi, markPreview, wireShell } from '../dash.js';
import { isPreview, loadPreview, PREVIEW_SAVED } from '../preview.js';

const PROFILE_FIELDS = Object.freeze(['business', 'name', 'phone', 'serviceArea', 'description']);
const SENT = 'Sent. Cargado Strategies reviews changes before anything is shown publicly.';

const td = (label, ...children) => h('td', { 'data-label': label }, ...children);

const referralItem = (r) => h('tr', {},
  td('Client', h('span', { className: 'dash-cell-main', text: r.clientName || 'Client' })),
  td('Date', r.when || ''),
  td('Note', r.note || ''),
  td('Status', r.status ? h('span', { className: 'dash-pill', text: r.status }) : ''));

function wireProfile(form, uid, stored, { save, sentText }) {
  /* partners/{uid} holds the approved business and contact; pendingProfile the edits under review. */
  const current = { business: stored.business, name: stored.contact, ...(stored.pendingProfile || {}) };
  PROFILE_FIELDS.forEach((name) => { form.elements[name].value = current[name] || ''; });
  $('[data-partner-pending]').hidden = !stored.pendingProfile;
  const line = $('[data-status]', form);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = formValues(form);
    await busy(form, async () => {
      try {
        await save(uid, Object.fromEntries(PROFILE_FIELDS.map((k) => [k, values[k] || ''])));
        $('[data-partner-pending]').hidden = false;
        setStatus(line, sentText, 'ok');
      } catch (error) {
        setStatus(line, friendlyError(error), 'error');
      }
    });
  });
}

function show(user, stored, referrals, { preview = false } = {}) {
  const model = partnerModel(referrals);
  const stats = partnerStats(model);
  $('[data-dash-first]').textContent = (user.name || '').split(/\s+/)[0] || 'Partner';
  kpi('referrals', stats.referrals);
  kpi('status', partnerStatus(stored).label);
  fillList($('[data-partner-referrals]'), $('[data-partner-referrals-empty]'), model.referrals, referralItem);
  wireProfile($('[data-partner-profile]'), user.uid, stored, preview
    ? { save: async () => {}, sentText: PREVIEW_SAVED }
    : { save: savePartnerProfile, sentText: SENT });
  showMain(user);
  wireShell();
  if (preview) markPreview();
}

export async function initPartner() {
  if (isPreview()) {
    const sample = await loadPreview('partner');
    show(sample.user, sample.stored, sample.referrals, { preview: true });
    return;
  }
  if (!startApp()) return;
  const { user } = await requireRole('partner');
  const [stored, referrals] = await Promise.all([myPartnerProfile(user.uid), myReferrals(user.uid)]);
  show(user, stored, referrals);
}
