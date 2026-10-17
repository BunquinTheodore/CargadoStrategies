/**
 * Shoot (Round 5 judging aid): screenshots every scene of every page at a set of viewports.
 *
 *   node tools/shoot.mjs [baseUrl] [page.html ...] [--vp=WxH,WxH] [--out=dir] [--no-extras]
 *
 *   --vp=WxH,...   viewports (default 1440x900,1366x768,390x844; presets desktop|mobile too)
 *   --out=dir      output folder (default plan/round5/shots)
 *   --no-extras    skip the splash frame and the mid-transition frames
 *
 * Output: <out>/<page>/<WxH>/<NN>-<scene id>.png (viewport PNG, scene active, reveals landed),
 *         <out>/<page>/<WxH>/transition-01-02.png (halfway between scene 1 and 2's focus points),
 *         <out>/splash/<WxH>/splash.png (first viewport only, index.html), and <out>/index.md.
 *
 * Activation reuses tools/fit-audit.mjs: film.js is rewritten in flight (CDP Fetch; nothing on
 * disk changes) to expose initFilm()'s result as window.__shootFilm, and each scene is seeked
 * with film.goTo(i, {immediate:true}), i.e. to its focus point where every reveal has landed.
 * The splash is waited out (html.splash-done) before shooting scenes. Unlike fit-audit, base.css
 * is NOT rewritten: the shots show the site as a visitor sees it today.
 *
 * Starts its own headless Chrome (isolated profile, random port). Needs Node 22+.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGES = ['index.html', 'services.html', 'story.html', 'partners.html', 'legal.html'];
const PRESETS = { desktop: ['1440x900', '1366x768'], mobile: ['390x844'] };
const DEFAULT_VPS = '1440x900,1366x768,390x844';
const LOAD_TIMEOUT_MS = 15000;
const READY_TIMEOUT_MS = 8000;
const SPLASH_TIMEOUT_MS = 6000;
const SPLASH_SHOT_MS = 650; // after navigation: splash fully painted, before its 900 ms minimum
const SETTLE_MS = 1100; // after a seek: CSS transitions on .is-active, char decodes, image decode
const LOAD_ATTEMPTS = 4;
const RETRY_PAUSE_MS = 1500;
const HOOK = 'window.__shootFilm';

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const value = (name) => flag(name)?.split('=').slice(1).join('=');
const opts = {
  base: (args.find((a) => /^https?:/.test(a)) || 'http://localhost:8000/').replace(/\/?$/, '/'),
  pages: args.filter((a) => a.endsWith('.html')),
  out: resolve(ROOT, value('out') || 'plan/round5/shots'),
  extras: !flag('no-extras'),
};
const vps = (value('vp') || DEFAULT_VPS).split(',').flatMap((v) => PRESETS[v] || [v]).map((v) => v.split('x').map(Number));
if (vps.some(([w, h]) => !(w > 0 && h > 0))) {
  console.error('Bad --vp value. Use WxH,WxH or desktop|mobile.');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');
const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'scene';

/* ---------- CDP plumbing (same as fit-audit.mjs) ---------- */

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(msg.error.message)); else res(msg.result);
    } else if (msg.method) {
      (listeners.get(msg.method) || []).slice().forEach((fn) => fn(msg.params));
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const n = ++id;
    pending.set(n, { res, rej });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const on = (method, fn) => {
    listeners.set(method, [...(listeners.get(method) || []), fn]);
    return () => listeners.set(method, (listeners.get(method) || []).filter((f) => f !== fn));
  };
  const once = (method, timeout) => new Promise((res) => {
    const timer = setTimeout(() => { off(); res(null); }, timeout);
    const off = on(method, (p) => { clearTimeout(timer); off(); res(p); });
  });
  return { send, on, once, close: () => ws.close() };
}

const evaluate = async (send, expression) => {
  const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
};

function interceptFilm(send, on) {
  on('Fetch.requestPaused', async (p) => {
    try {
      if (p.responseStatusCode !== 200) return void (await send('Fetch.continueRequest', { requestId: p.requestId }));
      const { body, base64Encoded } = await send('Fetch.getResponseBody', { requestId: p.requestId });
      let text = base64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;
      if (/export function initFilm\(/.test(text)) {
        text = `${text.replace(/export function initFilm\(/, 'function __shootInitFilm(')}
export function initFilm(o) { const f = __shootInitFilm(o); ${HOOK} = f; return f; }\n`;
      }
      const headers = (p.responseHeaders || []).filter((h) => !/^(content-length|content-encoding|etag|last-modified)$/i.test(h.name));
      await send('Fetch.fulfillRequest', {
        requestId: p.requestId, responseCode: 200, responseHeaders: headers,
        body: Buffer.from(text, 'utf8').toString('base64'),
      });
    } catch {
      send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    }
  });
  return send('Fetch.enable', { patterns: [{ urlPattern: '*/assets/js/film.js*', requestStage: 'Response' }] });
}

/* ---------- in-page expressions ---------- */

const WAIT_READY = `(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await document.fonts.ready;
  const t0 = performance.now();
  while (!${HOOK} && performance.now() - t0 < ${READY_TIMEOUT_MS}) await sleep(50);
  const f = ${HOOK};
  if (f && f.enabled) await Promise.race([f.ready, sleep(${READY_TIMEOUT_MS})]);
  const t1 = performance.now();
  while ((document.getElementById('splash') || !document.documentElement.classList.contains('splash-done'))
    && performance.now() - t1 < ${SPLASH_TIMEOUT_MS}) await sleep(50);
  const splashGone = !document.getElementById('splash');
  document.getElementById('splash')?.remove();
  await sleep(300);
  return { film: !!(f && f.enabled), splashGone,
    scenes: [...document.querySelectorAll('section.scene')].map((s, i) => ({ i, id: s.id || '',
      title: s.dataset.title || s.querySelector('h1,h2')?.textContent.trim().replace(/\\s+/g, ' ').slice(0, 60) || '' })) };
})()`;

const ACTIVATE = (i) => `(async () => {
  const f = ${HOOK};
  if (!f || !f.enabled) {
    document.querySelectorAll('section.scene')[${i}]?.scrollIntoView({ block: 'start' });
  } else {
    f.goTo(${i}, { immediate: true });
  }
  for (let k = 0; k < 3; k++) await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, ${SETTLE_MS}));
  return f && f.enabled ? f.active === ${i} : null;
})()`;

/** Halfway (film time) between scene a's and scene b's focus points. */
const MIDWAY = (a, b) => `(async () => {
  const f = ${HOOK};
  if (!f || !f.enabled) return null;
  const t = f.timings;
  if (!t[${b}]) return null;
  f.goTo(${a}, { immediate: true });
  await new Promise((r) => setTimeout(r, 300));
  // Middle of the hand-over: from scene a's hold end (outStart) to scene b's focus point.
  const from = t[${a}].outStart ?? t[${a}].focusTime;
  const time = (from + t[${b}].focusTime) / 2;
  f.scrollToTime(time, { immediate: true });
  for (let k = 0; k < 3; k++) await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, 250));
  return { time: Math.round(time * 100) / 100, progress: Math.round(f.progress * 1000) / 1000 };
})()`;

/* ---------- shooting ---------- */

const DEBUG = Boolean(process.env.SHOOT_DEBUG);
const T0 = Date.now();
const log = (m) => DEBUG && process.stderr.write(`  [${((Date.now() - T0) / 1000).toFixed(1)}s] ${m}
`);

async function shot(send, file) {
  log(`shot ${file}`);
  mkdirSync(dirname(file), { recursive: true });
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(file, Buffer.from(data, 'base64'));
  return file;
}

async function setViewport(send, w, h) {
  const mobile = w < 800;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
}

async function navigate({ send, once }, page) {
  const loaded = once('Page.loadEventFired', LOAD_TIMEOUT_MS);
  await send('Page.navigate', { url: opts.base + page });
  await loaded;
}

async function shootSplash(api, w, h) {
  await setViewport(api.send, w, h);
  const t0 = Date.now();
  await api.send('Page.navigate', { url: `${opts.base}index.html` });
  await sleep(Math.max(0, SPLASH_SHOT_MS - (Date.now() - t0)));
  const present = await evaluate(api.send, `!!document.getElementById('splash')`).catch(() => false);
  const file = await shot(api.send, join(opts.out, 'splash', `${w}x${h}`, 'splash.png'));
  await api.once('Page.loadEventFired', LOAD_TIMEOUT_MS);
  return { file, present };
}

async function shootPage(api, page, w, h) {
  const { send } = api;
  await setViewport(send, w, h);
  await navigate(api, page);
  log(`loaded ${page}`);
  let state = await evaluate(send, WAIT_READY);
  log(`ready film=${state.film}`);
  let attempts = 1;
  for (; attempts < LOAD_ATTEMPTS && !state.film; attempts++) {
    await sleep(RETRY_PAUSE_MS);
    await navigate(api, page);
    state = await evaluate(send, WAIT_READY);
  }
  const dir = join(opts.out, page.replace(/\.html$/, ''), `${w}x${h}`);
  rmSync(dir, { recursive: true, force: true });
  const rows = [];
  const problems = [];
  if (!state.film) problems.push(`film not up after ${attempts} loads (shot without activation)`);
  if (!state.splashGone) problems.push('splash still present after wait; removed by hand');
  for (const s of state.scenes) {
    const active = await evaluate(send, ACTIVATE(s.i));
    if (active === false) problems.push(`scene ${s.i} (${s.id}) did not become active`);
    const file = await shot(send, join(dir, `${pad(s.i + 1)}-${slug(s.id || s.title)}.png`));
    rows.push({ ...s, file, kind: 'scene', active });
  }
  if (opts.extras && state.film && state.scenes.length > 1) {
    const mid = await evaluate(send, MIDWAY(0, 1));
    if (mid) {
      const file = await shot(send, join(dir, 'transition-01-02.png'));
      rows.push({ i: 0.5, id: 'transition', title: `midway scene 1 -> 2 (film t=${mid.time}s, progress ${mid.progress})`, file, kind: 'transition' });
    } else problems.push('mid-transition frame not captured');
  }
  return { page, viewport: `${w}x${h}`, attempts, film: state.film, rows, problems };
}

function indexMd(results, splash) {
  const rel = (f) => relative(opts.out, f).replace(/\\/g, '/');
  const L = [];
  L.push('# Round 5 shots', '');
  L.push(`Generated ${new Date().toISOString()} by \`node tools/shoot.mjs\` from ${opts.base}.`);
  L.push('Each scene PNG is the viewport with that scene active (film seeked to its focus point, reveals landed).', '');
  L.push('## Counts', '', '| page | viewport | scenes | transition | problems |', '|---|---|---|---|---|');
  results.forEach((r) => L.push(`| ${r.page} | ${r.viewport} | ${r.rows.filter((x) => x.kind === 'scene').length} | ${r.rows.some((x) => x.kind === 'transition') ? 'yes' : 'no'} | ${r.problems.join('; ') || '-'} |`));
  if (splash) L.push('', '## Splash', '', `- [${rel(splash.file)}](${rel(splash.file)})${splash.present ? '' : ' (splash element already gone when shot)'}`);
  results.forEach((r) => {
    L.push('', `## ${r.page} @ ${r.viewport}`, '', '| # | file | scene id | data-title |', '|---|---|---|---|');
    r.rows.forEach((x) => L.push(`| ${x.kind === 'scene' ? x.i + 1 : '~'} | [${rel(x.file)}](${rel(x.file)}) | ${x.id || '-'} | ${(x.title || '').replace(/\|/g, '/')} |`));
  });
  return `${L.join('\n')}\n`;
}

async function main() {
  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = mkdtempSync(join(tmpdir(), 'shoot-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    '--enable-unsafe-swiftshader', '--use-angle=swiftshader', 'about:blank',
  ], { stdio: 'ignore' });
  try {
    let target;
    for (let t = 0; t < 50 && !target; t++) {
      await sleep(200);
      target = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).then((l) => l.find((x) => x.type === 'page')).catch(() => null);
    }
    if (!target) throw new Error('Chrome did not start');
    const api = await cdp(target.webSocketDebuggerUrl);
    const { send } = api;
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await interceptFilm(send, api.on);
    let splash = null;
    if (opts.extras) {
      const [w, h] = vps[0];
      splash = await shootSplash(api, w, h);
      process.stderr.write(`. splash @ ${w}x${h}${splash.present ? '' : ' (splash gone)'}\n`);
    }
    const results = [];
    for (const page of opts.pages.length ? opts.pages : PAGES) {
      for (const [w, h] of vps) {
        const r = await shootPage(api, page, w, h);
        results.push(r);
        process.stderr.write(`. ${page} @ ${w}x${h}: ${r.rows.length} shots${r.problems.length ? ` [${r.problems.join('; ')}]` : ''}\n`);
      }
    }
    api.close();
    mkdirSync(opts.out, { recursive: true });
    writeFileSync(join(opts.out, 'index.md'), indexMd(results, splash));
    results.forEach((r) => console.log(`${r.page.padEnd(15)} ${r.viewport.padEnd(10)} ${String(r.rows.filter((x) => x.kind === 'scene').length).padStart(3)} scenes${r.problems.length ? `  ! ${r.problems.join('; ')}` : ''}`));
    process.exitCode = results.some((r) => r.problems.length) ? 1 : 0;
  } finally {
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* profile still locked */ }
  }
}

main().catch((e) => { console.error(e); process.exitCode = 2; });
