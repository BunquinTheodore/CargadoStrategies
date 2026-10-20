/**
 * Lab measurements for tools/perf-gate.mjs (DIRECTION §12), through our own headless Chrome:
 * DOM nodes, composited layers, INP on the sheet chip, long tasks and frame rate over 3 cuts at
 * 4x CPU, idle rAF callbacks 6 s after the last landing, and the splash duration.
 *
 * - The tier is pinned per profile (PROFILES[].tier, the document is rewritten to
 *   <html data-tier="X" data-tier-lock>), so a slow first frame sample cannot drop a page to
 *   tier C and change what the cut fps measure. A page that locks its own tier keeps it.
 * - Graphics: by default Chrome renders with SwiftShader (software GL, the same pixels on every
 *   machine); { gpu: true } uses the machine's GPU. Each result names the WebGL renderer, and
 *   perf-gate reports the fps and long-task rows as informational on a software renderer.
 * - The splash is splash.js's User Timing measure `cs-splash` (the mark's first frame → done).
 */
import { evaluate, filmHook, interceptResponses, launchChrome, navigate, setMedia, setViewport, sleep, waitReadyExpr } from './cdp.mjs';

const HOOK = '__perfFilm';
const READY_TIMEOUT_MS = 10000;
const LANDED_TIMEOUT_MS = 4000;
const CUTS = 3;
const IDLE_AFTER_MS = 6000; // DIRECTION §12: every loop asleep 6 s after the last input
const IDLE_WINDOW_MS = 2000;
const LAYER_SETTLE_MS = 1500;
const INPUT_TIMEOUT_MS = 2000;
export const PROFILES = {
  mobile: { vp: [390, 844], touch: true, cpu: 4, tier: 'B' },
  desktop: { vp: [1440, 900], touch: false, cpu: 1, tier: 'A' },
};
const SOFTWARE_GL = /swiftshader|llvmpipe|software|microsoft basic render/i;
const GL_ARGS = {
  software: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
  gpu: ['--enable-gpu', '--ignore-gpu-blocklist'],
};

/** Installed before any page script: counts rAF callbacks and records long tasks and events. */
const PROBE = `(() => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__rafOrig = raf;
  window.__rafCount = 0;
  window.requestAnimationFrame = (cb) => raf((t) => { window.__rafCount += 1; cb(t); });
  window.__longTasks = [];
  window.__events = [];
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__longTasks.push({ start: e.startTime, dur: e.duration }))).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__events.push({ name: e.name, dur: e.duration, start: e.startTime }))).observe({ type: 'event', durationThreshold: 16, buffered: true });
  } catch { /* observer types missing: the fields stay empty */ }
})();`;

/** The tier the current measure pins (PROFILES[].tier). Read by the document rewrite rule. */
let pinTier = null;
const tierPin = {
  pattern: '*.html*',
  test: /\.html(\?|#|$)/,
  rewrite: (url, body) => (!pinTier ? body : body.replace(/<html\b([^>]*)>/, (tag, attrs) => (/\bdata-tier-lock\b/.test(attrs) ? tag
    : `<html${attrs.replace(/\s+data-tier="[^"]*"/, '')} data-tier="${pinTier}" data-tier-lock>`))),
};

const SPLASH_EXPR = `(() => {
  const m = performance.getEntriesByName('cs-splash', 'measure')[0];
  return m ? Math.round(m.duration) : null;
})()`;

const RENDERER_EXPR = `(() => {
  try {
    const g = document.createElement('canvas').getContext('webgl');
    if (!g) return 'no WebGL';
    const ext = g.getExtension('WEBGL_debug_renderer_info');
    return String(ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER));
  } catch { return 'no WebGL'; }
})()`;

/* Cuts are driven by real PageDown key presses (works on site/ and on the bundled dist/ alike);
   a cut is over when html[data-scene] has changed and html.is-cutting is gone. */
const SPLASH_RESET = `try { sessionStorage.removeItem('cs-splash'); } catch { /* storage blocked */ }`;

const CUT_START = `(() => {
  const s = { frames: 0, run: true, t0: performance.now(), long: window.__longTasks.length };
  const tick = () => { s.frames += 1; if (s.run) window.__rafOrig(tick); };
  window.__rafOrig(tick);
  window.__cutStats = s;
  return document.documentElement.dataset.scene || '';
})()`;

const CUT_WAIT = (from) => `(async () => {
  const h = document.documentElement;
  const t0 = performance.now();
  while (performance.now() - t0 < ${LANDED_TIMEOUT_MS}) {
    if ((h.dataset.scene || '') !== ${JSON.stringify(from)} && !h.classList.contains('is-cutting')) return h.dataset.scene || '';
    await new Promise((r) => setTimeout(r, 30));
  }
  return null;
})()`;

const CUT_STOP = `(() => {
  const s = window.__cutStats;
  s.run = false;
  const ms = performance.now() - s.t0;
  const longs = window.__longTasks.slice(s.long).filter((x) => x.start >= s.t0);
  return { ms: Math.round(ms), fps: Math.round((s.frames / ms) * 1000 * 10) / 10,
    longest: Math.round(Math.max(0, ...longs.map((x) => x.dur))), longTasks: longs.length };
})()`;

async function threeCuts(send) {
  let scene = await evaluate(send, CUT_START);
  let done = 0;
  for (let k = 0; k < CUTS; k++) {
    for (const type of ['keyDown', 'keyUp']) await Promise.race([send('Input.dispatchKeyEvent', { type, key: 'PageDown', code: 'PageDown', windowsVirtualKeyCode: 34 }), sleep(INPUT_TIMEOUT_MS)]);
    const next = await evaluate(send, CUT_WAIT(scene));
    if (next === null) break;
    scene = next;
    done += 1;
  }
  return { cuts: done, ...(await evaluate(send, CUT_STOP)) };
}

const IDLE_EXPR = `(async () => {
  await new Promise((r) => setTimeout(r, ${IDLE_AFTER_MS}));
  const a = window.__rafCount;
  await new Promise((r) => setTimeout(r, ${IDLE_WINDOW_MS}));
  return window.__rafCount - a;
})()`;

/** The first sheet trigger fully on screen (the header WhatsApp button on every page). */
const SHEET_TRIGGER = `(() => {
  const onScreen = (r) => r.width && r.height && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
  const t = [...document.querySelectorAll('[data-wa-sheet]')].find((el) => onScreen(el.getBoundingClientRect()));
  if (!t) return null;
  const r = t.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`;

const SHEET_CHIP = `(() => {
  const d = document.getElementById('wa-sheet');
  if (!d || !d.open) return null;
  const chip = [...d.querySelectorAll('[data-need], .chip, button[name="need"], input[name="need"] + label, label.chip')].find((el) => el.getClientRects().length);
  if (!chip) return null;
  window.__events.length = 0;
  const r = chip.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`;

async function tap(send, { x, y }, touch) {
  const events = touch
    ? [['Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }], ['Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }]]
    : ['mousePressed', 'mouseReleased'].map((type) => ['Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }]);
  for (const [method, params] of events) await Promise.race([send(method, params), sleep(INPUT_TIMEOUT_MS)]);
}

async function layerCount(api) {
  let count = null;
  const off = api.on('LayerTree.layerTreeDidChange', (p) => { if (p.layers) count = p.layers.length; });
  await api.send('LayerTree.enable');
  await sleep(LAYER_SETTLE_MS);
  await api.send('LayerTree.disable');
  off();
  return count;
}

/** One page in one profile → the lab numbers. */
async function measure(api, base, page, profile) {
  const { send } = api;
  const p = PROFILES[profile];
  await setViewport(send, p.vp[0], p.vp[1], { touch: p.touch });
  await setMedia(send, { touch: p.touch });
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await send('Storage.clearDataForOrigin', { origin: new URL(base).origin, storageTypes: 'all' }).catch(() => {});
  // A fresh session for the splash (once per session, sessionStorage['cs-splash']); that store is not cleared above.
  const { identifier } = await send('Page.addScriptToEvaluateOnNewDocument', { source: SPLASH_RESET });
  pinTier = p.tier;
  await navigate(api, base + page);
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
  const state = await evaluate(send, waitReadyExpr(HOOK, READY_TIMEOUT_MS));
  const splashMs = await evaluate(send, SPLASH_EXPR);
  const renderer = await evaluate(send, RENDERER_EXPR);
  const dom = await evaluate(send, `document.getElementsByTagName('*').length`);
  const layers = await layerCount(api);
  await send('Emulation.setCPUThrottlingRate', { rate: p.cpu });
  const cuts = state.mode === 'flow' ? { skipped: 'flow mode' } : await threeCuts(send);
  const idleRaf = await evaluate(send, IDLE_EXPR);
  let inp = null;
  const trigger = await evaluate(send, SHEET_TRIGGER);
  if (trigger) {
    await tap(send, trigger, p.touch);
    await sleep(600);
    const chip = await evaluate(send, SHEET_CHIP);
    if (chip) {
      await tap(send, chip, p.touch);
      await sleep(800);
      inp = await evaluate(send, `Math.round(Math.max(0, ...window.__events.filter((e) => /pointer|click|key|touch/.test(e.name)).map((e) => e.dur)))`);
    }
  }
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  return { page, profile, mode: state.mode, tier: await evaluate(send, `document.documentElement.dataset.tier || ''`), dom, layers, cuts, idleRaf, inp, splashMs,
    renderer, softwareGl: SOFTWARE_GL.test(renderer) };
}

/** Run the lab over pages × profiles; { gpu: true } renders on the machine's GPU. */
export async function runLab(base, pages, profiles, { gpu = false } = {}) {
  const { api, close } = await launchChrome({ prefix: 'perf-', args: gpu ? GL_ARGS.gpu : GL_ARGS.software });
  try {
    await api.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
    await interceptResponses(api, [filmHook(HOOK), tierPin], { stayOn: new URL(base).origin });
    const out = [];
    for (const page of pages) {
      for (const profile of profiles) {
        out.push(await measure(api, base, page, profile));
        process.stderr.write(`. lab ${page} ${profile}\n`);
      }
    }
    return out;
  } finally {
    await close();
  }
}
