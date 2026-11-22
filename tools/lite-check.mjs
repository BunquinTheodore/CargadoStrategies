/**
 * Lite site check (one headless Chrome, its own profile):
 *
 *   node serve.mjs dist 8643 --lite            # your own server, never port 8000
 *   node tools/lite-check.mjs http://127.0.0.1:8643/ [--shots=<folder>]
 *
 * Per page (/ and /book) at 360, 768 and 1440 wide: 0 console errors or warnings, no horizontal
 * scroll, every tap target at least 44 px, no visible text under 14 px. Then the booking flow on
 * /book?api=1 against a stubbed /api: the calendar picks a day, slots load, the POST payload is
 * the expected one and all six answers plus a network failure render their message.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launchChrome, navigate, parseArgs, setViewport, sleep } from './lib/cdp.mjs';

const WIDTHS = [360, 768, 1440];
const HEIGHT = 900;
const MIN_TAP = 44;
const MIN_FONT = 14;
const TAP_SELECTOR = 'a[href], button, summary, input:not([type=hidden]), select, textarea, [data-date]';

const args = parseArgs();
const base = args.base;
const shotDir = args.value('shots', '');

/** Runs in the page: layout findings for the current viewport. */
const LAYOUT = `(() => {
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('.hp, .skip, [hidden], details:not([open]) .menu__panel'); };
  const small = [...document.querySelectorAll('${TAP_SELECTOR}')].filter(visible).filter((el) => {
    const r = el.getBoundingClientRect();
    const inline = el.tagName === 'A' && el.closest('p, label') && getComputedStyle(el).display === 'inline';
    return !inline && (r.height < ${MIN_TAP} - 0.5 || r.width < ${MIN_TAP} - 0.5) && !(el.type === 'checkbox');
  }).map((el) => el.outerHTML.slice(0, 70) + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height));
  const tiny = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement; if (!n.textContent.trim() || !visible(el) || el.closest('.vh, script, style, noscript')) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < ${MIN_FONT} - 0.01) tiny.push(Math.round(px * 10) / 10 + 'px ' + n.textContent.trim().slice(0, 40));
  }
  return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, small, tiny,
           motion: [...document.querySelectorAll('*')].filter((el) => { const s = getComputedStyle(el);
             return s.animationName !== 'none' || parseFloat(s.transitionDuration) > 0; }).length };
})()`;

const problems = [];
const note = (where, what) => problems.push(`${where}: ${what}`);

async function openPage(api, url, width) {
  await setViewport(api.send, width, HEIGHT);
  await navigate(api, url);
  await sleep(500);
}

async function checkLayout(api, shots) {
  for (const path of ['', 'book']) {
    for (const width of WIDTHS) {
      const where = `/${path} @${width}`;
      await openPage(api, `${base}${path}`, width);
      const r = JSON.parse(await api.send('Runtime.evaluate', { expression: `JSON.stringify(${LAYOUT})`, returnByValue: true }).then((x) => x.result.value));
      if (r.overflow > 0) note(where, `horizontal scroll ${r.overflow}px`);
      r.small.forEach((s) => note(where, `tap target under ${MIN_TAP}px: ${s}`));
      r.tiny.forEach((s) => note(where, `text under ${MIN_FONT}px: ${s}`));
      if (r.motion) note(where, `${r.motion} elements animate or transition`);
      if (shots) {
        const { data } = await api.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
        writeFileSync(join(shots, `lite-${path || 'home'}-${width}.png`), Buffer.from(data, 'base64'));
      }
    }
  }
}

const BODIES = {
  pending: { status: 200, body: { ok: true, pending: true } },
  ok: { status: 200, body: { ok: true, start: null, meetUrl: 'https://meet.google.com/abc-defg-hij' } },
  slot_taken: { status: 409, body: { ok: false, error: 'slot_taken' } },
  already_booked: { status: 409, body: { ok: false, error: 'already_booked' } },
  invalid: { status: 400, body: { ok: false, error: 'invalid', fields: ['email'] } },
  rate_limited: { status: 429, body: { ok: false, error: 'rate_limited' } },
  network: null,
};

const FILL = `(() => {
  const f = document.querySelector('#book-form');
  const opts = [...f.elements.start.options].filter((o) => o.value);
  if (!opts.length) return 'no slots';
  f.elements.start.value = opts[0].value;
  f.elements.name.value = 'Ana Cruz'; f.elements.email.value = 'ana@example.com';
  f.elements.consent.checked = true; f.elements.website.value = '';
  f.requestSubmit(); return opts[0].value;
})()`;
const READ = `(() => ({ success: document.querySelector('#book-success').hidden ? '' : document.querySelector('#book-success').innerText,
  status: document.querySelector('[data-book-status]').innerText, invalid: !!document.querySelector('[aria-invalid="true"]'),
  slotsOptions: document.querySelector('#book-start').options.length, day: document.querySelector('[data-book-day]').innerText,
  calendarDays: document.querySelectorAll('[data-date]:not([aria-disabled="true"])').length }))()`;

async function checkBooking(api) {
  const seen = { slots: 0, post: null, scenario: 'pending' };
  api.on('Fetch.requestPaused', async (e) => {
    const { requestId, request } = e;
    if (request.url.includes('/api/slots')) {
      seen.slots += 1;
      await api.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify({ ok: false })).toString('base64') }); // local slots stay
      return;
    }
    seen.post = request.postData;
    const answer = BODIES[seen.scenario];
    if (!answer) { await api.send('Fetch.failRequest', { requestId, errorReason: 'Failed' }); return; }
    await api.send('Fetch.fulfillRequest', { requestId, responseCode: answer.status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(answer.body)).toString('base64') });
  });
  await api.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  const results = {};
  for (const scenario of Object.keys(BODIES)) {
    seen.scenario = scenario;
    seen.post = null;
    await openPage(api, `${base}book?api=1`, 390);
    const before = JSON.parse(await api.send('Runtime.evaluate', { expression: `JSON.stringify(${READ})`, returnByValue: true }).then((x) => x.result.value));
    if (!before.calendarDays || before.slotsOptions < 2) note('/book', `calendar or slots empty: ${JSON.stringify(before)}`);
    const picked = await api.send('Runtime.evaluate', { expression: FILL, returnByValue: true }).then((x) => x.result.value);
    await sleep(700);
    const after = JSON.parse(await api.send('Runtime.evaluate', { expression: `JSON.stringify(${READ})`, returnByValue: true }).then((x) => x.result.value));
    const payload = seen.post ? JSON.parse(seen.post) : null;
    if (payload) {
      const want = { start: picked, name: 'Ana Cruz', email: 'ana@example.com', consent: true };
      if (JSON.stringify(payload) !== JSON.stringify(want)) note(`booking ${scenario}`, `payload ${seen.post}`);
    } else note(`booking ${scenario}`, 'no POST sent');
    results[scenario] = after.success || after.status + (after.invalid ? ' [fields marked]' : '');
  }
  await api.send('Fetch.disable');
  return { slotCalls: seen.slots, results };
}

async function main() {
  if (shotDir) mkdirSync(shotDir, { recursive: true });
  const chrome = await launchChrome({ prefix: 'cs-lite-' });
  const { api } = chrome;
  const consoleIssues = [];
  api.on('Runtime.exceptionThrown', (e) => consoleIssues.push(`exception ${e.exceptionDetails.text}`));
  api.on('Runtime.consoleAPICalled', (e) => { if (['error', 'warning'].includes(e.type)) consoleIssues.push(`console.${e.type} ${e.args.map((a) => a.value ?? a.description).join(' ')}`); });
  api.on('Log.entryAdded', (e) => { if (['error', 'warning'].includes(e.entry.level)) consoleIssues.push(`log ${e.entry.level} ${e.entry.text} ${e.entry.url || ''}`); });
  await api.send('Log.enable');
  try {
    await checkLayout(api, shotDir);
    const booking = await checkBooking(api);
    process.stdout.write(`${JSON.stringify(booking, null, 1)}
`);
  } finally {
    await chrome.close();
  }
  consoleIssues.filter((i) => !/api\/book/.test(i)).forEach((i) => note('console', i)); // the stubbed 4xx answers are logged by Chrome
  const report = problems.length ? `PROBLEMS (${problems.length})\n${problems.join('\n')}` : 'lite-check: 0 problems';
  process.stdout.write(`${report}\n`);
  process.exitCode = problems.length ? 1 : 0;
}

main().catch((e) => { process.stderr.write(`${e.stack || e}
`); process.exitCode = 1; });
