/**
 * Console check (DIRECTION §13 T3, plus the T9 404 check): 0 errors and 0 warnings on every
 * page, in the cut, touch-cut and flow modes, each with and without ?review=1.
 *
 *   node tools/console-check.mjs [baseUrl] [page.html ...] [--modes=cut,touch,flow] [--no-review] [--json]
 *
 * Per page and mode, through CDP (api.md §18):
 *   1. load, wait for the engine (html.film-ready);
 *   2. cut through every scene forward with film.next() and back with film.prev(), waiting for
 *      'landed' each time (flow: scroll each section into view);
 *   3. open every dialog through its trigger ([data-wa-sheet] for #wa-sheet; otherwise
 *      [aria-controls=id], [data-dialog-open=id] or a[href="#id"]), run any stepper inside it,
 *      then close it with Escape;
 *   4. run every form.stepper on the page: fill the visible fields with neutral test values and
 *      press Next until the last unit (never Send: nothing is submitted, no WhatsApp opens).
 * Collected: console error / warning / assert calls, uncaught exceptions, browser log entries
 * at error or warning level, failed requests and HTTP status >= 400 (a 404 is a T9 failure).
 * Exit code 1 when anything was collected.
 */
import { PAGES, evaluate, filmHook, interceptResponses, launchChrome, navigate, parseArgs, setMedia, setViewport, sleep, waitReadyExpr } from './lib/cdp.mjs';

const HOOK = '__consoleFilm';
const READY_TIMEOUT_MS = 8000;
const LANDED_TIMEOUT_MS = 3000;
const DIALOG_SETTLE_MS = 450;
const FLOW_STEP_MS = 250;
const MAX_STEPS = 12;
const INPUT_TIMEOUT_MS = 2000;
const MODES = {
  cut: { vp: [1440, 900], touch: false, reduce: false },
  touch: { vp: [390, 844], touch: true, reduce: false },
  flow: { vp: [1440, 900], touch: false, reduce: true },
};

const cli = parseArgs();
const opts = {
  base: cli.base,
  pages: cli.pages.length ? cli.pages : PAGES,
  modes: String(cli.value('modes', 'cut,touch,flow')).split(',').filter((m) => MODES[m]),
  review: !cli.has('no-review'),
  json: cli.has('json'),
};

/* ---------- in page ---------- */

const WALK = `(async () => {
  const f = window.${HOOK};
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const scenes = [...document.querySelectorAll('section.scene')];
  if (!f || !f.enabled) {
    for (const s of [...scenes, ...scenes.slice().reverse()]) { s.scrollIntoView({ block: 'start' }); await sleep(${FLOW_STEP_MS}); }
    return { mode: 'flow', visited: scenes.length };
  }
  const landed = (go) => new Promise((res) => {
    const off = f.on('landed', () => { off(); clearTimeout(t); res(true); });
    const t = setTimeout(() => { off(); res(false); }, ${LANDED_TIMEOUT_MS});
    if (!go()) { off(); clearTimeout(t); res(false); }
  });
  const cur = () => f.current ?? f.active;
  let visited = 1, stuck = 0;
  for (let k = 0; k < scenes.length + 2; k++) {
    const before = cur();
    if (!(await landed(() => f.next())) && cur() === before) break;
    visited += 1;
  }
  for (let k = 0; k < scenes.length + 2 && cur() > 0; k++) {
    const before = cur();
    if (!(await landed(() => f.prev())) && cur() === before) { stuck += 1; break; }
  }
  return { mode: f.mode || 'cut', visited, back: cur() === 0, stuck };
})()`;

/** Fill the visible fields of a form with neutral values and press Next until the last unit. */
function runStepper(form, maxSteps) {
  const visible = (el) => el.getClientRects().length > 0 && !el.closest('[hidden]');
  const fill = () => form.querySelectorAll('input, select, textarea').forEach((el) => {
    if (!visible(el) || el.disabled || el.type === 'hidden') return;
    const set = (v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    if (el.tagName === 'SELECT') { if (el.options.length > 1) set(el.options[1].value); }
    else if (el.type === 'checkbox' || el.type === 'radio') { if (!el.checked && !form.querySelector(`input[name="${el.name}"]:checked`)) el.click(); }
    else if (el.type === 'email') set('test@example.com');
    else if (el.type === 'tel') set('2045550123');
    else if (el.type === 'url') set('https://example.com');
    else if (el.type === 'number') set('1');
    else if (!el.value) set(el.name === 'city' || el.autocomplete === 'address-level2' ? 'Winnipeg' : 'Test');
  });
  let steps = 0;
  return (async () => {
    for (; steps < maxSteps; steps++) {
      fill();
      const next = [...form.querySelectorAll('[data-step-next]')].find((b) => visible(b) && b.getAttribute('aria-disabled') !== 'true');
      if (!next) break;
      next.click();
      await new Promise((r) => setTimeout(r, 300));
    }
    return steps;
  })();
}

const STEPPERS = `(async () => {
  const f = window.${HOOK};
  const out = [];
  for (const form of document.querySelectorAll('section.scene form.stepper')) {
    if (f && f.enabled) { f.goTo(form, { immediate: true }); await new Promise((r) => setTimeout(r, 300)); }
    else form.scrollIntoView({ block: 'start' });
    out.push(await (${runStepper})(form, ${MAX_STEPS}));
  }
  return out;
})()`;

const DIALOG_IDS = `[...document.querySelectorAll('dialog[id]')].map((d) => d.id)`;

/** Bring a visible trigger of the dialog on screen; returns its centre for a trusted click. */
const FIND_TRIGGER = (dialogId) => `(async () => {
  const f = window.${HOOK};
  const id = ${JSON.stringify(dialogId)};
  const d = document.getElementById(id);
  const sel = id === 'wa-sheet' ? '[data-wa-sheet]' : \`[aria-controls="\${id}"], [data-dialog-open="\${id}"], a[href="#\${id}"]\`;
  const candidates = [...document.querySelectorAll(sel)].filter((el) => !d.contains(el));
  if (!candidates.length) return { id, why: 'no trigger' };
  for (const el of candidates) {
    if (f && f.enabled && el.closest('section.scene')) { f.goTo(el, { immediate: true }); await new Promise((r) => setTimeout(r, 300)); }
    else el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    if (r.width && r.height && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth) return { id, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { id, why: 'trigger not visible' };
})()`;

const DIALOG_STEPPERS = (dialogId) => `(async () => {
  const d = document.getElementById(${JSON.stringify(dialogId)});
  const steps = [];
  if (d.open) for (const form of d.querySelectorAll('form.stepper')) steps.push(await (${runStepper})(form, ${MAX_STEPS}));
  return { opened: d.open, steps };
})()`;

/* ---------- run ---------- */

/** A trusted click or tap (a real user gesture: unlocks audio like a visitor's would). */
async function click(send, x, y, touch) {
  const events = touch
    ? [['Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }], ['Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }]]
    : ['mousePressed', 'mouseReleased'].map((type) => ['Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }]);
  for (const [method, params] of events) await Promise.race([send(method, params), sleep(INPUT_TIMEOUT_MS)]);
}

async function pressEscape(send) {
  for (const type of ['keyDown', 'keyUp']) await Promise.race([send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }), sleep(INPUT_TIMEOUT_MS)]);
}

async function checkPage(api, page, modeName, review) {
  const { send, on } = api;
  const mode = MODES[modeName];
  const issues = [];
  const notes = [];
  const offs = [
    on('Runtime.consoleAPICalled', (e) => {
      if (/^(error|warning|assert)$/.test(e.type)) issues.push({ kind: `console.${e.type}`, text: e.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300) });
    }),
    on('Runtime.exceptionThrown', (e) => issues.push({ kind: 'exception', text: (e.exceptionDetails?.exception?.description || e.exceptionDetails?.text || '').slice(0, 300) })),
    on('Log.entryAdded', ({ entry }) => {
      if (/^(error|warning)$/.test(entry.level) && entry.source !== 'console-api' && !/ERR_BLOCKED_BY_CLIENT/.test(entry.text)) issues.push({ kind: `log.${entry.level}`, text: `${entry.text.slice(0, 240)}${entry.url ? ` (${entry.url})` : ''}` });
    }),
    on('Network.responseReceived', ({ response }) => {
      if (response.status >= 400) issues.push({ kind: `http ${response.status}`, text: response.url });
    }),
    on('Network.loadingFailed', (e) => {
      if (e.blockedReason || /BLOCKED_BY_CLIENT/.test(e.errorText)) notes.push(`navigation away blocked (${e.type || 'request'})`);
      else if (!e.canceled && !/ERR_ABORTED/.test(e.errorText)) issues.push({ kind: 'request failed', text: `${e.errorText} ${e.type || ''}` });
    }),
  ];
  try {
    await setViewport(send, mode.vp[0], mode.vp[1], { touch: mode.touch });
    await setMedia(send, { reduce: mode.reduce, touch: mode.touch });
    await navigate(api, `${opts.base}${page}${review ? '?review=1' : ''}`);
    const state = await evaluate(send, waitReadyExpr(HOOK, READY_TIMEOUT_MS));
    const walk = await evaluate(send, WALK);
    const dialogs = [];
    for (const id of await evaluate(send, DIALOG_IDS)) {
      let r = await evaluate(send, FIND_TRIGGER(id));
      if (!r.why) {
        await click(send, r.x, r.y, mode.touch);
        await sleep(DIALOG_SETTLE_MS);
        r = { id, ...(await evaluate(send, DIALOG_STEPPERS(id))) };
      }
      if (r.opened) {
        await pressEscape(send);
        await sleep(DIALOG_SETTLE_MS);
        r.closed = !(await evaluate(send, `document.getElementById(${JSON.stringify(id)}).open`));
        if (!r.closed) await evaluate(send, `document.getElementById(${JSON.stringify(id)}).close(); true`);
      }
      dialogs.push(r);
    }
    const steppers = await evaluate(send, STEPPERS);
    await sleep(300);
    return { page, mode: modeName, review, engine: state.mode, walk, dialogs, steppers, issues, notes: [...new Set(notes)] };
  } finally {
    offs.forEach((off) => off());
  }
}

async function main() {
  const { api, close } = await launchChrome({ prefix: 'console-' });
  try {
    await api.send('Log.enable');
    await interceptResponses(api, [filmHook(HOOK)], { stayOn: new URL(opts.base).origin });
    const results = [];
    for (const page of opts.pages) {
      for (const m of opts.modes) {
        for (const review of opts.review ? [false, true] : [false]) {
          const r = await checkPage(api, page, m, review);
          results.push(r);
          process.stderr.write(`. ${page} ${m}${review ? ' review' : ''}: ${r.issues.length} issue(s)\n`);
        }
      }
    }
    const bad = results.reduce((n, r) => n + r.issues.length, 0);
    if (opts.json) console.log(JSON.stringify(results, null, 1));
    else {
      const lines = [`Console check  ${new Date().toISOString()}  ${opts.base}`, ''];
      results.forEach((r) => {
        const dl = r.dialogs.map((d) => `${d.id}${d.opened ? (d.closed ? '' : ' (Escape did not close)') : ` (not opened: ${d.why || '?'})`}`).join(', ');
        lines.push(`${r.issues.length ? 'FAIL' : 'ok  '} ${r.page} ${r.mode}${r.review ? ' ?review=1' : ''} [engine ${r.engine}; scenes ${r.walk.visited}${r.walk.back === false ? ', did not return to 0' : ''}; dialogs ${dl || 'none'}; steppers ${r.steppers.length}]`);
        r.issues.forEach((x) => lines.push(`  - ${x.kind}: ${x.text}`));
        r.notes.forEach((x) => lines.push(`    note: ${x}`));
      });
      lines.push('', bad ? `${bad} console issues.` : 'Clean: 0 errors and 0 warnings everywhere.');
      console.log(lines.join('\n'));
    }
    process.exitCode = bad ? 1 : 0;
  } finally {
    await close();
  }
}

main().catch((e) => { console.error(e); process.exitCode = 2; });
