/* The dashboard shell: KPI figures and chart series (model.js), the chart geometry
   (sections/app/chart.js), the local preview gate (sections/app/preview.js) and the
   assembled shells (sidebar nav, data hooks, tables). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  adminStats, clientStats, dashboardModel, nextBooking, partnerModel, partnerStats, partnerStatus, pointsSeries,
} from '../site/core/account/model.js';
import { CHART_BOX, lineGeometry } from '../site/sections/app/chart.js';
import { isPreview } from '../site/sections/app/preview.js';
import { sampleFor } from '../site/sections/app/preview-data.js';
import { readAssembled, SITE_DIR } from '../tools/lib/assemble.mjs';

const NOW = new Date('2026-10-27T18:00:00.000Z');

/* ---------- client figures ---------- */

test('clientStats counts upcoming (not cancelled), completed and referral points from the model', () => {
  const points = [
    { id: 'a', points: 5, kind: 'booking', at: '2026-09-01T10:00:00Z' },
    { id: 'b', points: 5, kind: 'referral', at: '2026-09-10T10:00:00Z' },
    { id: 'c', points: 5, kind: 'referral', at: '2026-10-10T10:00:00Z' },
    { id: 'd', points: -5, kind: 'referral', reason: 'Reversed', at: '2026-10-11T10:00:00Z' },
  ];
  const bookings = [
    { id: 'u1', start: '2026-11-02T20:00:00Z', status: 'cancelled' },
    { id: 'u2', start: '2026-11-03T20:00:00Z', status: 'confirmed', meetUrl: 'https://meet.example/x' },
    { id: 'u3', start: '2026-11-04T20:00:00Z', status: 'pending' },
    { id: 'p1', start: '2026-10-01T20:00:00Z', status: 'completed' },
    { id: 'p2', start: '2026-10-02T20:00:00Z', status: 'no-show' },
  ];
  const model = dashboardModel({ uid: 'u' }, points, bookings, NOW);
  assert.deepEqual(clientStats(model), { balance: 10, upcoming: 2, completed: 1, referred: 2 });
  assert.equal(nextBooking(model).id, 'u2');
});

test('clientStats and nextBooking are zero and null for an empty account', () => {
  const model = dashboardModel({ uid: 'u' }, [], [], NOW);
  assert.deepEqual(clientStats(model), { balance: 0, upcoming: 0, completed: 0, referred: 0 });
  assert.equal(nextBooking(model), null);
});

test('pointsSeries is the running balance oldest first, skipping undated events', () => {
  const model = dashboardModel({ uid: 'u' }, [
    { id: 'b', points: 5, at: '2026-10-05T00:00:00Z' },
    { id: 'a', points: 5, at: '2026-09-05T00:00:00Z' },
    { id: 'c', points: -2, at: '2026-10-20T00:00:00Z' },
    { id: 'x', points: 5 },
  ], [], NOW);
  assert.deepEqual(pointsSeries(model.history).map((s) => s.total), [5, 10, 8]);
  assert.deepEqual(pointsSeries([]), []);
  assert.equal(pointsSeries([{ points: 5, at: 1 }]).length, 1);
});

/* ---------- partner figures ---------- */

test('partnerStats counts the referrals and carries no money figures', () => {
  const stats = partnerStats(partnerModel([{ id: 'r1' }, { id: 'r2' }]));
  assert.deepEqual(stats, { referrals: 2 });
});

test('partnerStatus reads the stored status and flags edits under review', () => {
  assert.deepEqual(partnerStatus({ status: 'approved' }), { label: 'Approved', pending: false });
  assert.deepEqual(partnerStatus({ status: 'approved', pendingProfile: { business: 'B' } }), { label: 'Approved', pending: true });
  assert.deepEqual(partnerStatus({}), { label: 'Pending', pending: false });
  assert.deepEqual(partnerStatus(undefined), { label: 'Pending', pending: false });
});

/* ---------- admin figures ---------- */

test('adminStats counts pending applications, live upcoming bookings, clients and partners', () => {
  const stats = adminStats({
    applications: [{ id: 'a' }, { id: 'b', status: 'pending' }, { id: 'c', status: 'approved' }],
    bookings: [
      { id: '1', start: '2026-11-01T20:00:00Z', status: 'confirmed' },
      { id: '2', start: '2026-11-02T20:00:00Z', status: 'cancelled' },
      { id: '3', start: '2026-10-01T20:00:00Z', status: 'completed' },
      { id: '4', start: 'nope' },
    ],
    users: [{ id: 'u1' }, { id: 'u2', role: 'client' }, { id: 'u3', role: 'partner' }, { id: 'u4', role: 'admin' }],
  }, NOW);
  assert.deepEqual(stats, { pendingApplications: 2, upcomingBookings: 1, clients: 2, partners: 1 });
  assert.deepEqual(adminStats(undefined, NOW), { pendingApplications: 0, upcomingBookings: 0, clients: 0, partners: 0 });
});

/* ---------- chart geometry ---------- */

test('lineGeometry: no values is null, one value is a flat line, many span the box', () => {
  assert.equal(lineGeometry([]), null);
  const one = lineGeometry([5]);
  assert.equal(one.points.length, 1);
  assert.match(one.line, /^M\S+ \S+ L\S+ \S+$/);
  const many = lineGeometry([0, 5, 10]);
  assert.equal(many.points[0].x, CHART_BOX.pad);
  assert.equal(many.points.at(-1).x, CHART_BOX.width - CHART_BOX.pad);
  assert.equal(many.points.at(-1).y, CHART_BOX.pad);                   // the max sits on the top edge
  assert.equal(many.points[0].y, CHART_BOX.height - CHART_BOX.pad);     // zero sits on the base
  assert.match(many.area, /Z$/);
  assert.ok(lineGeometry([3, 3]).points.every((p) => Number.isFinite(p.y)));   // flat series: no divide by zero
});

/* ---------- the local preview gate ---------- */

test('the preview runs only on localhost or 127.0.0.1 with ?preview=1', () => {
  assert.equal(isPreview({ hostname: 'localhost', search: '?preview=1' }), true);
  assert.equal(isPreview({ hostname: '127.0.0.1', search: '?a=b&preview=1' }), true);
  assert.equal(isPreview({ hostname: 'localhost', search: '' }), false);
  assert.equal(isPreview({ hostname: 'localhost', search: '?preview=0' }), false);
  assert.equal(isPreview({ hostname: '127.0.0.1', search: '?preview=true' }), false);
});

test('the preview gate rejects every other hostname', () => {
  ['cargadostrategies.com', 'www.cargadostrategies.com', 'cargado.vercel.app', 'localhost.evil.com', 'evil.com',
    '127.0.0.2', '0.0.0.0', '192.168.1.5', '[::1]', 'LOCALHOST.example', ''].forEach((hostname) => {
    assert.equal(isPreview({ hostname, search: '?preview=1' }), false, hostname);
  });
  assert.equal(isPreview(undefined), false);
  assert.equal(isPreview(null), false);
});

test('the sample data is clearly fake and only loaded through a dynamic import', () => {
  const client = sampleFor('client', NOW);
  assert.equal(client.user.name, 'Sample Client');
  assert.ok(client.bookings.some((b) => Date.parse(b.start) > NOW.getTime()));
  assert.ok(sampleFor('admin', NOW).lists.users.every((u) => /^Sample/.test(u.name) && u.email.endsWith('@example.com')));
  assert.ok(sampleFor('partner', NOW).referrals.length > 0);
  assert.equal('earnings' in sampleFor('partner', NOW), false);
  const app = join(SITE_DIR, 'sections', 'app');
  assert.match(readFileSync(join(app, 'preview.js'), 'utf8'), /await import\('\.\/preview-data\.js'\)/);
  ['dashboard/dashboard-page.js', 'partner/partner-page.js', 'admin/admin-page.js', '_shared.js', 'dash.js'].forEach((file) => {
    assert.doesNotMatch(readFileSync(join(app, file), 'utf8'), /preview-data/, file);
  });
});

/* ---------- assembled shells ---------- */

const DASH_PAGES = Object.freeze({
  'dashboard.html': { links: ['overview', 'points', 'bookings', 'referral', 'profile'], hooks: ['data-dash-balance', 'data-dash-history', 'data-dash-upcoming', 'data-dash-past', 'data-dash-next', 'data-dash-chart', 'data-dash-profile', 'data-dash-ref-book', 'data-dash-ref-signup', 'data-dash-code'] },
  'partner-dashboard.html': { links: ['overview', 'referrals', 'profile'], hooks: ['data-partner-referrals', 'data-partner-profile', 'data-partner-pending'] },
  'admin.html': { links: ['overview', 'applications', 'bookings', 'clients', 'record'], hooks: ['data-admin-applications', 'data-admin-bookings', 'data-admin-users', 'data-admin-status', 'data-admin-form="assign-referral"'] },
});

test('each dashboard has the sidebar shell, a nav link per panel, Log Out, the preview badge and its data hooks', () => {
  for (const [file, { links, hooks }] of Object.entries(DASH_PAGES)) {
    const html = readAssembled(join(SITE_DIR, file));
    assert.match(html, /class="dash[^"]*" data-app-main hidden/, file);
    assert.match(html, /<aside class="dash-side"/, file);
    assert.match(html, /<nav class="dash-nav" aria-label="Dashboard sections">/, file);
    assert.match(html, /data-sign-out/, file);
    assert.match(html, /data-preview-badge hidden>Preview · sample data</, file);
    links.forEach((id) => {
      assert.match(html, new RegExp(`href="#${id}"`), `${file}: link #${id}`);
      assert.match(html, new RegExp(`\\sid="${id}"`), `${file}: panel #${id}`);
    });
    hooks.forEach((hook) => assert.ok(html.includes(hook), `${file}: ${hook}`));
    assert.match(html, /class="dash-table"/, file);
  }
});

test('the copy that was on the dashboards is still there word for word (the earnings note is gone)', () => {
  const read = (file) => readAssembled(join(SITE_DIR, file));
  assert.ok(read('dashboard.html').includes('Points are added automatically. They cannot be spent yet.'));
  assert.ok(read('dashboard.html').includes('The email is the log-in and cannot be changed here.'));
  assert.ok(!read('partner-dashboard.html').includes('Only amounts Cargado Strategies has recorded are shown.'));   // earnings removed (owner, 2026-10-27)
  assert.ok(read('partner-dashboard.html').includes('Changes are sent to Cargado Strategies for review. Nothing is shown publicly until it is approved.'));
  assert.ok(read('partner-dashboard.html').includes('Changes waiting for review.'));
  assert.ok(read('admin.html').includes('Points (use a minus sign to remove)'));
});
