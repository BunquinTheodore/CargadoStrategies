/**
 * Fit audit (Round 4 acceptance gate): loads each page in headless Chrome at a
 * set of viewports and reports, per scene, whether it fits one screen.
 *
 *   node tools/fit-audit.mjs [baseUrl] [page.html ...] [options]
 *
 *   --vp=all|desktop|mobile|short|WxH,WxH   viewports (default: all = the 9 of the fit contract)
 *   --json             print the JSON report instead of text
 *   --save=path/base   also write path/base.txt and path/base.json
 *   --why              list the elements that cause each overflow
 *   --fallback         viewports under 560px tall may pan: their Y overflow is noted, not failed
 *   --flow             measure the reduced-motion flow mode (sections must fit 100svh)
 *   --now              measure today's box (keep --bottom-h, the HUD/WhatsApp reserve)
 *   --no-activate      do not seek the film to each scene (measure with transforms neutralised)
 *   --raw              the old, pre-Round-4 probe (over-reports X; for comparison only)
 *
 * What a scene must satisfy (each is a failure):
 *   Y       layout content taller than the box from the header's bottom to the viewport
 *           bottom: max(.scene__pan offsetHeight - box, lowest visible content - viewport bottom).
 *   header  visible content above the fixed site header's bottom edge (sits under the header).
 *   X       visible content past the left or right viewport edge.
 *   scroll  an inner scroll container: overflow-y (or -x) auto/scroll with scrollHeight >
 *           clientHeight + 1 (textarea/select excluded).
 *
 * How it measures (default mode):
 *   - Activation. film.js keeps its API private, so this browser's copy of film.js is
 *     rewritten in flight (CDP Fetch; nothing on disk changes) to expose initFilm()'s result
 *     as window.__fitAuditFilm. Each scene is then seeked with film.goTo(i, {immediate:true}):
 *     the master timeline sits at that scene's focus point, where every reveal tween has
 *     landed, so measurements are what a visitor sees once the scene is active. The film's
 *     own inline transforms on .scene / .scene__inner / .scene__pan (pan, hold drift) are
 *     neutralised for the measurement. If the hook fails (flow mode, film.js changed), all
 *     inline transforms in the scenes are neutralised and inline opacities forced to 1.
 *   - Round 4 box. base.css is rewritten in flight with :root{--bottom-h:0px} so the scene
 *     box is header-bottom to viewport-bottom (HUD, WhatsApp float and phone bar are gone in
 *     Round 4). --now keeps today's reserve.
 *   - Visible content only: text (glyph boxes via Range), replaced/interactive elements, and
 *     boxes with a painted background or border. Skipped: aria-hidden subtrees, display:none,
 *     visibility:hidden, effective opacity < 0.02, zero-size boxes. Each box is clipped by
 *     every ancestor below .scene__inner whose overflow is not visible (or contain: paint),
 *     so parked carousel slides, masked char splits and decorative overhang do not count.
 *     .scene__inner itself is not a clip: content it cuts off is exactly the defect.
 *
 * Starts its own Chrome (isolated profile, random debug port), so it can run next to
 * other browser sessions. Needs Node 22+ (global WebSocket).
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGES = ['index.html', 'services.html', 'story.html', 'partners.html', 'legal.html'];
const PRESETS = {
  desktop: ['1920x1080', '1536x864', '1440x900', '1366x768', '1280x720', '1024x768'],
  mobile: ['768x1024', '390x844', '360x740'],
  short: ['844x390', '740x360'],
};
PRESETS.all = [...PRESETS.desktop, ...PRESETS.mobile];
const FALLBACK_MAX_H = 560; // shorter viewports may pan (documented Round 4 fallback)
const LOAD_TIMEOUT_MS = 15000;
const READY_TIMEOUT_MS = 8000;
const ACTIVATE_SETTLE_MS = 450; // after a seek: CSS transitions keyed on .is-active, decode ticks
const RAW_SETTLE_MS = 2500;
const LOAD_ATTEMPTS = 4;
const RETRY_PAUSE_MS = 1500;
const TOLERANCE_PX = 1;

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const value = (name) => flag(name)?.split('=').slice(1).join('=');
const opts = {
  base: (args.find((a) => /^https?:/.test(a)) || 'http://localhost:8000/').replace(/\/?$/, '/'),
  pages: args.filter((a) => a.endsWith('.html')),
  json: Boolean(flag('json')),
  save: value('save'),
  why: Boolean(flag('why')),
  fallback: Boolean(flag('fallback')),
  flow: Boolean(flag('flow')),
  now: Boolean(flag('now')),
  raw: Boolean(flag('raw')),
  activate: !flag('no-activate') && !flag('raw') && !flag('flow'),
};
const vpArg = value('vp') || 'all';
const vps = vpArg.split(',').flatMap((v) => PRESETS[v] || [v]).map((v) => v.split('x').map(Number));
if (vps.some(([w, h]) => !(w > 0 && h > 0))) {
  console.error(`Bad --vp value "${vpArg}". Use all|desktop|mobile|short or WxH,WxH.`);
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- in-page code (serialised into the page; must be self-contained) ---------- */

/** The pre-Round-4 probe, kept verbatim for --raw. */
function rawProbe() {
  const out = [];
  document.querySelectorAll('section.scene').forEach((scene, i) => {
    const inner = scene.querySelector('.scene__inner') || scene;
    const pan = inner.querySelector(':scope > .scene__pan') || inner;
    const box = inner.clientHeight || window.innerHeight;
    const content = Math.max(pan.scrollHeight, pan.offsetHeight);
    let widest = 0;
    scene.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.right - window.innerWidth > widest) widest = r.right - window.innerWidth;
    });
    out.push({
      i, id: scene.id || '', title: scene.dataset.title || scene.querySelector('h1,h2')?.textContent.trim().slice(0, 40) || '',
      box, content, overflowY: Math.max(0, Math.round(content - box)), overflowX: Math.max(0, Math.round(widest)),
      headerOverlap: 0, innerScroll: [],
    });
  });
  return out;
}

/** Measure scene i. cfg: { activated, flow, now, why }. */
function measureScene(i, cfg) {
  const scene = document.querySelectorAll('section.scene')[i];
  const inner = scene.querySelector(':scope > .scene__inner') || scene;
  const pan = inner.querySelector(':scope > .scene__pan') || inner;
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const neutral = document.createElement('style');
  neutral.id = 'fit-audit-neutral';
  const reset = 'transform:none!important;translate:none!important;rotate:none!important;scale:none!important;';
  neutral.textContent = cfg.activated || cfg.flow
    ? `section.scene[style],section.scene>.scene__inner[style],.scene__inner>.scene__pan[style]{${reset}}`
    : `section.scene,section.scene [style*="transform"],section.scene [style*="translate"],section.scene [style*="rotate"],section.scene [style*="scale"]{${reset}}
       section.scene,section.scene [style*="opacity"]{opacity:1!important}`;
  document.head.appendChild(neutral);
  try {
    const desc = (el) => {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
      const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
      return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls}` : ''}${txt ? ` "${txt}"` : ''}`;
    };
    const header = document.querySelector('.site-header');
    const hs = header && getComputedStyle(header);
    const headerBottom = hs && hs.display !== 'none' && hs.visibility !== 'hidden' && hs.position === 'fixed'
      ? Math.max(0, header.getBoundingClientRect().bottom) : 0;

    /* Is the element rendered and not decorative-hidden? Also returns clip rect from ancestors. */
    const clipCache = new Map();
    function clipOf(el) {
      // Intersection of every clipping ancestor's box, from el's parent up to (not incl.) inner.
      if (!el || el === inner || el === scene || !scene.contains(el)) return [-Infinity, -Infinity, Infinity, Infinity];
      if (clipCache.has(el)) return clipCache.get(el);
      const up = clipOf(el.parentElement);
      const cs = getComputedStyle(el);
      let c = up;
      // contain:paint, clip-path and clip also clip (approximated by the border box).
      const paint = /paint|strict|content/.test(cs.contain || '') || cs.clipPath !== 'none' || (cs.clip && cs.clip !== 'auto');
      const clipX = paint || cs.overflowX !== 'visible';
      const clipY = paint || cs.overflowY !== 'visible';
      if (clipX || clipY) {
        const r = el.getBoundingClientRect();
        c = [clipX ? Math.max(up[0], r.left) : up[0], clipY ? Math.max(up[1], r.top) : up[1],
          clipX ? Math.min(up[2], r.right) : up[2], clipY ? Math.min(up[3], r.bottom) : up[3]];
      }
      clipCache.set(el, c);
      return c;
    }
    const opCache = new Map();
    function opacityOf(el) {
      if (!el || el === scene || !scene.contains(el)) return 1;
      if (opCache.has(el)) return opCache.get(el);
      const o = parseFloat(getComputedStyle(el).opacity) * opacityOf(el.parentElement);
      opCache.set(el, o);
      return o;
    }
    const REPLACED = /^(IMG|SVG|VIDEO|CANVAS|IFRAME|INPUT|SELECT|TEXTAREA|BUTTON|PICTURE|OBJECT|EMBED)$/i;
    const painted = (cs) => cs.backgroundImage !== 'none' || !/rgba\(.*,\s*0\)|transparent/.test(cs.backgroundColor)
      || ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs[`border${s}Width`]) > 0 && !/rgba\(.*,\s*0\)|transparent/.test(cs[`border${s}Color`]));

    const items = []; // { l, t, r, b, el }
    // aria-hidden subtrees are skipped whole; an <svg> counts as one box (its children are skipped).
    const walker = document.createTreeWalker(scene, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (el) => (el.getAttribute('aria-hidden') === 'true' || el.parentElement?.closest('svg')
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let el = walker.nextNode(); el; el = walker.nextNode()) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility !== 'visible' || opacityOf(el) < 0.02) continue;
      const rects = [];
      const isReplaced = REPLACED.test(el.tagName) || el.getAttribute('role') === 'img';
      if (isReplaced || painted(cs)) rects.push(el.getBoundingClientRect());
      let textCount = 0;
      for (const node of el.childNodes) {
        if (node.nodeType !== 3 || !node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const glyphs = range.getClientRects();
        rects.push(...glyphs);
        textCount += glyphs.length;
      }
      if (!rects.length) continue;
      const outer = clipOf(el.parentElement); // clips the element's own box
      const own = clipOf(el); // also clips its text (e.g. .visually-hidden: 1px, overflow hidden)
      const boxCount = rects.length - textCount;
      rects.forEach((r, k) => {
        const [cl, ct, cr, cb] = k < boxCount ? outer : own;
        if (r.width < 0.5 || r.height < 0.5) return;
        const l = Math.max(r.left, cl), t = Math.max(r.top, ct), rr = Math.min(r.right, cr), b = Math.min(r.bottom, cb);
        if (rr - l < 0.5 || b - t < 0.5) return; // fully clipped by an ancestor
        items.push({ l, t, r: rr, b, el });
      });
    }

    const availTop = cfg.flow ? 0 : Math.max(headerBottom, inner.getBoundingClientRect().top);
    const availBottom = cfg.flow || !cfg.now ? vh : inner.getBoundingClientRect().bottom;
    const box = Math.round(availBottom - availTop);
    let overflowY;
    let content;
    if (cfg.flow) {
      content = scene.offsetHeight;
      overflowY = content - vh;
    } else {
      content = pan.offsetHeight;
      const panExcess = pan === inner ? inner.scrollHeight - inner.clientHeight : content - inner.clientHeight;
      const lowest = items.reduce((m, it) => Math.max(m, it.b), -Infinity);
      overflowY = Math.max(panExcess, lowest - availBottom);
    }
    const top = items.reduce((m, it) => Math.min(m, it.t), Infinity);
    const headerOverlap = cfg.flow ? 0 : Math.max(0, headerBottom - top);
    const left = items.reduce((m, it) => Math.min(m, it.l), Infinity);
    const right = items.reduce((m, it) => Math.max(m, it.r), -Infinity);
    const overL = Math.max(0, -left), overR = Math.max(0, right - vw);

    const innerScroll = [];
    scene.querySelectorAll('*').forEach((el) => {
      if (/^(TEXTAREA|SELECT)$/.test(el.tagName)) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility !== 'visible') return;
      const sy = /auto|scroll/.test(cs.overflowY) && el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1;
      const sx = /auto|scroll/.test(cs.overflowX) && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1;
      if (sy) innerScroll.push({ axis: 'y', el: desc(el), px: el.scrollHeight - el.clientHeight });
      if (sx) innerScroll.push({ axis: 'x', el: desc(el), px: el.scrollWidth - el.clientWidth });
    });

    const res = {
      i, id: scene.id || '',
      title: scene.dataset.title || scene.querySelector('h1,h2')?.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) || '',
      box, content: Math.round(content),
      overflowY: Math.max(0, Math.round(overflowY)),
      overflowX: Math.round(Math.max(overL, overR)), sideX: overL > overR ? 'left' : 'right',
      headerOverlap: Math.round(headerOverlap),
      innerScroll,
    };
    if (cfg.why) {
      const worst = (score) => items.map((it) => ({ px: Math.round(score(it)), el: desc(it.el) }))
        .filter((x) => x.px > 1).sort((a, b) => b.px - a.px)
        .filter((x, k, arr) => arr.findIndex((y) => y.el === x.el) === k).slice(0, 4);
      res.why = {
        y: worst((it) => it.b - availBottom),
        header: worst((it) => headerBottom - it.t),
        x: worst((it) => Math.max(it.r - vw, -it.l)),
      };
    }
    return res;
  } finally {
    neutral.remove();
  }
}

/* ---------- CDP plumbing ---------- */

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

/** In-flight rewrites (this headless browser only): expose the film, give scenes the Round 4 box. */
const HOOK = 'window.__fitAuditFilm';
function rewrite(url, body) {
  if (/\/film\.js(\?|$)/.test(url)) {
    if (!/export function initFilm\(/.test(body)) return body;
    return `${body.replace(/export function initFilm\(/, 'function __fitAuditInitFilm(')}
export function initFilm(o) { const f = __fitAuditInitFilm(o); ${HOOK} = f; return f; }\n`;
  }
  if (/\/base\.css(\?|$)/.test(url) && !opts.now) return `${body}\n:root{--bottom-h:0px !important}\n`;
  return body;
}

function interceptRewrites(send, on) {
  on('Fetch.requestPaused', async (p) => {
    try {
      if (p.responseStatusCode !== 200) return void (await send('Fetch.continueRequest', { requestId: p.requestId }));
      const { body, base64Encoded } = await send('Fetch.getResponseBody', { requestId: p.requestId });
      const text = base64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;
      const headers = (p.responseHeaders || []).filter((h) => !/^(content-length|content-encoding|etag|last-modified)$/i.test(h.name));
      await send('Fetch.fulfillRequest', {
        requestId: p.requestId, responseCode: 200, responseHeaders: headers,
        body: Buffer.from(rewrite(p.request.url, text), 'utf8').toString('base64'),
      });
    } catch (e) {
      if (process.env.FIT_DEBUG) process.stderr.write(`rewrite failed ${p.request.url}: ${e.message}
`);
      send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    }
  });
  return send('Fetch.enable', { patterns: [
    { urlPattern: '*/assets/js/film.js*', requestStage: 'Response' },
    { urlPattern: '*/assets/css/base.css*', requestStage: 'Response' },
  ] });
}

const WAIT_READY = `(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await document.fonts.ready;
  const t0 = performance.now();
  while (!${HOOK} && performance.now() - t0 < ${READY_TIMEOUT_MS}) await sleep(50);
  const f = ${HOOK};
  if (f && f.enabled) await Promise.race([f.ready, sleep(${READY_TIMEOUT_MS})]);
  await sleep(200);
  return { waited: Math.round(performance.now() - t0), hooked: !!f, film: !!(f && f.enabled), ready: document.documentElement.classList.contains('film-ready'),
    count: document.querySelectorAll('section.scene').length };
})()`;

const ACTIVATE = (i) => `(async () => {
  const f = ${HOOK};
  if (!f || !f.enabled) return false;
  f.goTo(${i}, { immediate: true });
  for (let k = 0; k < 3; k++) await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, ${ACTIVATE_SETTLE_MS}));
  return f.active === ${i};
})()`;

async function auditPage(cdpApi, page, w, h) {
  const { send, once } = cdpApi;
  const mobile = w < 800;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  const load = async () => {
    const loaded = once('Page.loadEventFired', LOAD_TIMEOUT_MS);
    await send('Page.navigate', { url: opts.base + page });
    await loaded;
  };
  await load();
  if (opts.raw) {
    await sleep(RAW_SETTLE_MS);
    return { mode: 'raw', scenes: await evaluate(send, `document.fonts.ready.then(() => (${rawProbe})())`) };
  }
  // A simple dev server can refuse some of the ~40 module requests (ERR_CONNECTION_REFUSED), leaving
  // the page without its film. Reload until the film is up (flow mode has no film to wait for).
  let state = await evaluate(send, WAIT_READY);
  for (let attempt = 1; attempt < LOAD_ATTEMPTS && !opts.flow && !state.film; attempt++) {
    await sleep(RETRY_PAUSE_MS);
    await load();
    state = { ...(await evaluate(send, WAIT_READY)), attempts: attempt + 1 };
  }
  const scenes = [];
  for (let i = 0; i < state.count; i++) {
    const activated = opts.activate && state.film ? await evaluate(send, ACTIVATE(i)) : false;
    const cfg = { activated, flow: opts.flow, now: opts.now, why: opts.why };
    scenes.push({ ...(await evaluate(send, `(${measureScene})(${i}, ${JSON.stringify(cfg)})`)), activated });
  }
  const mode = opts.flow ? 'flow' : state.film && opts.activate ? 'film, activated' : 'film, neutralised';
  return { mode, hooked: state.hooked, state, scenes };
}

/* ---------- report ---------- */

function judge(s, h) {
  const panAllowed = opts.fallback && h < FALLBACK_MAX_H;
  const y = s.overflowY > TOLERANCE_PX && !panAllowed;
  const reasons = [];
  if (y) reasons.push(`Y +${s.overflowY}`);
  else if (s.overflowY > TOLERANCE_PX) reasons.push(`(Y +${s.overflowY} pans: fallback)`);
  if (s.headerOverlap > TOLERANCE_PX) reasons.push(`header +${s.headerOverlap}`);
  if (s.overflowX > TOLERANCE_PX) reasons.push(`X +${s.overflowX}${s.sideX === 'left' ? ' left' : ''}`);
  (s.innerScroll || []).forEach((sc) => reasons.push(`scroll-${sc.axis} +${sc.px} ${sc.el}`));
  const fail = y || s.headerOverlap > TOLERANCE_PX || s.overflowX > TOLERANCE_PX || (s.innerScroll || []).length > 0;
  return { fail, reasons };
}

function textReport(report) {
  const lines = [];
  const vpNames = [...new Set(report.map((r) => r.viewport))];
  const pageNames = [...new Set(report.map((r) => r.page))];
  let bad = 0;
  const cell = new Map();
  report.forEach((r) => {
    const h = Number(r.viewport.split('x')[1]);
    r.failing = r.scenes.map((s) => ({ s, ...judge(s, h) })).filter((x) => x.fail || x.reasons.length);
    const n = r.failing.filter((x) => x.fail).length;
    bad += n;
    cell.set(`${r.page}|${r.viewport}`, n ? `${n}/${r.scenes.length}` : 'ok');
  });
  lines.push(`Fit audit  ${new Date().toISOString()}  ${opts.base}  mode: ${report[0]?.mode || '-'}${opts.now ? ', today\'s box' : ', Round 4 box'}${opts.fallback ? ', fallback <560 tall' : ''}`);
  lines.push('Cells: failing scenes / scenes.\n');
  const w0 = Math.max(4, ...pageNames.map((p) => p.length)) + 2;
  lines.push(['page'.padEnd(w0), ...vpNames.map((v) => v.padStart(10))].join(''));
  pageNames.forEach((p) => lines.push([p.padEnd(w0), ...vpNames.map((v) => (cell.get(`${p}|${v}`) || '-').padStart(10))].join('')));
  lines.push('');
  report.forEach(({ page, viewport, scenes, failing, mode }) => {
    const n = failing.filter((x) => x.fail).length;
    lines.push(`${n ? 'FAIL' : 'ok  '} ${page} @ ${viewport}: ${scenes.length} scenes${n ? `, ${n} fail` : ', all fit'}${mode && !/activated|raw/.test(mode) ? ` [${mode}]` : ''}`);
    failing.forEach(({ s, fail, reasons }) => {
      lines.push(`  ${fail ? '-' : ' '} #${s.i} ${s.id || s.title}: ${reasons.join(', ')} (content ${s.content} / box ${s.box})`);
      if (s.why) {
        Object.entries(s.why).forEach(([k, list]) => list.forEach((x) => lines.push(`        why ${k} +${x.px}: ${x.el}`)));
      }
    });
  });
  lines.push(bad ? `\n${bad} scene/viewport combinations fail.` : '\nEvery scene fits at every viewport.');
  return { text: lines.join('\n'), bad };
}

async function main() {
  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = mkdtempSync(join(tmpdir(), 'fit-audit-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank',
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
    if (!opts.raw) await interceptRewrites(send, api.on);
    if (process.env.FIT_DEBUG) {
      await send('Log.enable');
      api.on('Runtime.exceptionThrown', (e) => process.stderr.write(`page exception: ${e.exceptionDetails?.exception?.description?.slice(0, 300)}
`));
      api.on('Log.entryAdded', (e) => process.stderr.write(`log ${e.entry.level}: ${e.entry.text.slice(0, 200)} ${e.entry.url || ''}
`));
    }
    if (opts.flow) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const report = [];
    for (const page of opts.pages.length ? opts.pages : PAGES) {
      for (const [w, h] of vps) {
        const r = await auditPage(api, page, w, h);
        report.push({ page, viewport: `${w}x${h}`, ...r });
        if (!opts.json) process.stderr.write(`. ${page} @ ${w}x${h}\n`);
      }
    }
    api.close();
    const { text, bad } = textReport(report);
    const json = JSON.stringify(report.map(({ failing, ...r }) => r), null, 1);
    if (opts.save) {
      mkdirSync(dirname(opts.save), { recursive: true });
      writeFileSync(`${opts.save}.txt`, `${text}\n`);
      writeFileSync(`${opts.save}.json`, json);
    }
    console.log(opts.json ? json : text);
    process.exitCode = bad ? 1 : 0;
  } finally {
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* profile still locked; harmless */ }
  }
}

main().catch((e) => { console.error(e); process.exitCode = 2; });
