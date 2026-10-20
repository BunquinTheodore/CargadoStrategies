/**
 * Shared headless-Chrome plumbing for the Round 5 tools (fit-audit, shoot, seek-test,
 * console-check, perf-gate, compliance-diff, build-kerning).
 *
 * - launchChrome() starts its own Chrome with an isolated profile and a random debugging
 *   port, so the tools run next to any other browser session (and never touch the
 *   user's dev server or profile). Needs Node 22+ (global WebSocket and fetch).
 * - cdp() is a minimal Chrome DevTools Protocol client: send / on / once.
 * - interceptResponses() rewrites matching responses in flight (CDP Fetch); nothing on
 *   disk changes.
 * - filmHook() rewrites film.js so initFilm()'s result is exposed on window (api.md §18:
 *   `export function initFilm(` keeps exactly that signature).
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const PAGES = ['index.html', 'services.html', 'story.html', 'partners.html', 'legal.html'];
export const VIEWPORTS_ALL = ['1920x1080', '1536x864', '1440x900', '1366x768', '1280x720', '1024x768', '768x1024', '390x844', '360x740'];
export const VIEWPORTS_REVIEW = ['1440x900', '1280x720', '390x844', '360x740'];
export const LOAD_TIMEOUT_MS = 15000;
const START_POLLS = 50;
const START_POLL_MS = 200;
const DEBUG_PORT_MIN = 9300;
const DEBUG_PORT_SPAN = 600;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** `--name` / `--name=value` command-line flags, plus the positional base URL and pages. */
export function parseArgs(argv = process.argv.slice(2)) {
  const flag = (name) => argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  const value = (name, fallback) => {
    const f = flag(name);
    if (!f) return fallback;
    const v = f.split('=').slice(1).join('=');
    return v === '' ? true : v;
  };
  return {
    argv,
    has: (name) => Boolean(flag(name)),
    value,
    base: (argv.find((a) => /^(https?|file):/.test(a)) || 'http://localhost:8000/').replace(/\/?$/, '/'),
    pages: argv.filter((a) => /\.html$/.test(a) && !a.startsWith('--')),
  };
}

/** 'WxH,WxH' or preset names → [[w, h], …]; throws on a bad value. */
export function parseViewports(spec, presets) {
  const list = String(spec).split(',').flatMap((v) => presets[v] || [v]).map((v) => v.split('x').map(Number));
  if (!list.length || list.some(([w, h]) => !(w > 0 && h > 0))) {
    throw new Error(`Bad viewport list "${spec}". Use WxH,WxH or ${Object.keys(presets).join('|')}.`);
  }
  return list;
}

export async function cdp(wsUrl) {
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

const EVALUATE_TIMEOUT_MS = 90000;

/** Evaluate an expression (awaiting promises) and return its JSON value; page exceptions and hangs throw. */
export async function evaluate(send, expression, timeoutMs = EVALUATE_TIMEOUT_MS) {
  let timer;
  const hang = new Promise((res, rej) => { timer = setTimeout(() => rej(new Error(`page evaluation timed out after ${timeoutMs} ms`)), timeoutMs); });
  const { result, exceptionDetails } = await Promise.race([
    send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }), hang,
  ]).finally(() => clearTimeout(timer));
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
}

/**
 * Start headless Chrome on an isolated profile. Returns { api, port, close }.
 * `args` adds Chrome switches (e.g. SwiftShader for WebGL screenshots).
 */
export async function launchChrome({ args = [], prefix = 'cs-tool-' } = {}) {
  const port = DEBUG_PORT_MIN + Math.floor(Math.random() * DEBUG_PORT_SPAN);
  const profile = mkdtempSync(join(tmpdir(), prefix));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', ...args, 'about:blank',
  ], { stdio: 'ignore' });
  // A missing binary (CI hosts such as Vercel have no Chrome) arrives as an 'error' event; without
  // a listener it crashes the process instead of rejecting, so callers could not fall back.
  let spawnError = null;
  chrome.on('error', (e) => { spawnError = e; });
  const close = async () => {
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* profile still locked; harmless */ }
  };
  try {
    let target;
    for (let t = 0; t < START_POLLS && !target; t++) {
      await sleep(START_POLL_MS);
      if (spawnError) throw new Error(`Chrome could not be started (${CHROME}: ${spawnError.code || spawnError.message}; set CHROME_PATH)`);
      target = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json())
        .then((l) => l.find((x) => x.type === 'page')).catch(() => null);
    }
    if (!target) throw new Error(`Chrome did not start (${CHROME}; set CHROME_PATH)`);
    const api = await cdp(target.webSocketDebuggerUrl);
    await api.send('Page.enable');
    await api.send('Runtime.enable');
    await api.send('Network.enable');
    await api.send('Network.setCacheDisabled', { cacheDisabled: true });
    return { api, port, close: async () => { api.close(); await close(); } };
  } catch (e) {
    await close();
    throw e;
  }
}

/**
 * Rewrite responses in flight. rules: [{ pattern: 'glob for Fetch', test: RegExp, rewrite(url, body) → body }].
 * Only text bodies with status 200 are rewritten; everything else continues untouched.
 * stayOn: an origin; top-level navigations anywhere else (a wa.me link, Facebook) are blocked,
 * so a tool's click can never take the page away.
 */
export function interceptResponses(api, rules, { stayOn } = {}) {
  const { send, on } = api;
  on('Fetch.requestPaused', async (p) => {
    try {
      if (p.responseStatusCode === undefined && !p.responseErrorReason) {
        const away = p.resourceType === 'Document' && stayOn && new URL(p.request.url).origin !== stayOn;
        return void (await (away ? send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'BlockedByClient' })
          : send('Fetch.continueRequest', { requestId: p.requestId })));
      }
      const rule = rules.find((r) => r.test.test(p.request.url));
      if (!rule || p.responseStatusCode !== 200) return void (await send('Fetch.continueRequest', { requestId: p.requestId }));
      const { body, base64Encoded } = await send('Fetch.getResponseBody', { requestId: p.requestId });
      const text = base64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;
      const headers = (p.responseHeaders || []).filter((h) => !/^(content-length|content-encoding|etag|last-modified)$/i.test(h.name));
      await send('Fetch.fulfillRequest', {
        requestId: p.requestId, responseCode: 200, responseHeaders: headers,
        body: Buffer.from(rule.rewrite(p.request.url, text), 'utf8').toString('base64'),
      });
    } catch (e) {
      if (process.env.TOOLS_DEBUG) process.stderr.write(`rewrite failed ${p.request.url}: ${e.message}\n`);
      send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    }
  });
  const patterns = rules.map((r) => ({ urlPattern: r.pattern, requestStage: 'Response' }));
  if (stayOn) patterns.push({ urlPattern: '*', resourceType: 'Document', requestStage: 'Request' });
  return send('Fetch.enable', { patterns });
}

/** film.js rewrite rule exposing initFilm()'s result as `window[hook]`. */
export function filmHook(hook) {
  return {
    pattern: '*/film.js*',
    test: /\/film\.js(\?|$)/,
    rewrite: (url, body) => (/export function initFilm\(/.test(body)
      ? `${body.replace(/export function initFilm\(/, 'function __csToolInitFilm(')}
export function initFilm(o) { const f = __csToolInitFilm(o); window.${hook} = f; return f; }\n`
      : body),
  };
}

/**
 * Viewport and input emulation. touch: a coarse primary pointer with no hover (api.md §18),
 * set before navigation so the head script picks touch-cut mode.
 */
export async function setViewport(send, w, h, { touch = false } = {}) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: touch });
  await send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Emulation.setEmitTouchEventsForMouse', { enabled: touch, configuration: touch ? 'mobile' : 'desktop' });
}

/** Emulated media features: reduced motion (flow mode) and the pointer/hover pair (touch). */
export function setMedia(send, { reduce = false, touch = false } = {}) {
  const features = [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }];
  if (touch) {
    features.push({ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' },
      { name: 'any-pointer', value: 'coarse' }, { name: 'any-hover', value: 'none' });
  }
  return send('Emulation.setEmulatedMedia', { features }).catch(() => send('Emulation.setEmulatedMedia', { features: features.slice(0, 1) }));
}

export async function navigate(api, url) {
  const loaded = api.once('Page.loadEventFired', LOAD_TIMEOUT_MS);
  await api.send('Page.navigate', { url });
  return loaded;
}

/**
 * In-page wait for the engine (Round 4 and Round 5 shapes): fonts, the hooked film, its
 * `ready` promise and html.film-ready. Returns { hooked, film, mode, ready, count, waited }.
 */
export const waitReadyExpr = (hook, timeoutMs) => `(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await document.fonts.ready;
  const t0 = performance.now();
  const h = document.documentElement;
  while (!window.${hook} && !h.classList.contains('rm') && !h.classList.contains('film-ready') && performance.now() - t0 < ${timeoutMs}) await sleep(50);
  const f = window.${hook};
  if (f && f.ready) await Promise.race([f.ready, sleep(${timeoutMs})]);
  while (!h.classList.contains('film-ready') && f && f.mode && performance.now() - t0 < ${timeoutMs}) await sleep(50);
  await sleep(200);
  const mode = f && f.mode ? f.mode : (h.dataset.mode || (h.classList.contains('film') ? 'cut' : h.classList.contains('touch-cut') ? 'touch-cut' : 'flow'));
  return { waited: Math.round(performance.now() - t0), hooked: !!f, film: f ? !!f.enabled : mode !== 'flow', mode,
    ready: h.classList.contains('film-ready'), count: document.querySelectorAll('section.scene').length,
    coarse: matchMedia('(pointer: coarse)').matches };
})()`;

/** Index of the current scene for either engine shape. */
export const CURRENT = (hook) => `(window.${hook} ? (window.${hook}.current ?? window.${hook}.active) : -1)`;
