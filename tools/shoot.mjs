/**
 * Shoot (Round 5 judging aid): screenshots every scene of every page at a set of viewports.
 *
 *   node tools/shoot.mjs [baseUrl] [page.html ...] [--vp=WxH,WxH] [--out=dir] [--no-extras]
 *
 *   --vp=WxH,...   viewports (default 1440x900,1366x768,390x844; presets desktop|mobile|review;
 *                  review = the 4 DIRECTION §13 T8 viewports 1440x900,1280x720,390x844,360x740)
 *   --touch        emulate a coarse pointer before load (touch-cut mode)
 *   --out=dir      output folder (default plan/round5/shots)
 *   --no-extras    skip the splash frame and the mid-transition frames
 *
 * Output: <out>/<page>/<WxH>/<NN>-<scene id>.png (viewport PNG, scene active, reveals landed),
 *         <out>/<page>/<WxH>/transition-01-02.png (halfway between scene 1 and 2's focus points),
 *         <out>/splash/<WxH>/splash.png (first viewport only, index.html), and <out>/index.md.
 *
 * Activation reuses tools/fit-audit.mjs: film.js is rewritten in flight (CDP Fetch; nothing on
 * disk changes) to expose initFilm()'s result as window.__shootFilm, and each scene is seeked
 * with film.goTo(i, {immediate:true}), i.e. landed with every reveal in place. The transition
 * frame is the Round 5 cut from scene 1 to 2 paused at 50% (film.seekCut), or the Round 4
 * midpoint between the two focus points (film.scrollToTime) on the old engine.
 * After each seek the shot also waits for the globe canvas (#globe) to stop drawing (no draw for
 * GLOBE_QUIET_MS, at most GLOBE_WAIT_MAX_MS: the tier A idle spin draws until it sleeps), so a
 * map morph or ring fade still running is never captured as the landed scene.
 * The splash is waited out (html.splash-done) before shooting scenes. Unlike fit-audit, base.css
 * is NOT rewritten: the shots show the site as a visitor sees it today.
 *
 * Starts its own headless Chrome (isolated profile, random port). Needs Node 22+.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRENT, VIEWPORTS_REVIEW, evaluate, filmHook, interceptResponses, launchChrome, setMedia, setViewport as emulate } from './lib/cdp.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index.html', 'services.html', 'story.html', 'partners.html', 'legal.html'];
const PRESETS = { desktop: ['1440x900', '1366x768'], mobile: ['390x844'], review: VIEWPORTS_REVIEW };
const DEFAULT_VPS = '1440x900,1366x768,390x844';
const LOAD_TIMEOUT_MS = 15000;
const READY_TIMEOUT_MS = 8000;
const SPLASH_TIMEOUT_MS = 6000;
const SPLASH_SHOT_MS = 650; // after navigation: splash fully painted, before its 900 ms minimum
const SETTLE_MS = 1100; // after a seek: CSS transitions on .is-active, char decodes, image decode
const GLOBE_QUIET_MS = 400;
const GLOBE_WAIT_MAX_MS = 2500;
const LOAD_ATTEMPTS = 4;
const RETRY_PAUSE_MS = 1500;
const HOOK_NAME = '__shootFilm';
const HOOK = `window.${HOOK_NAME}`;
const MID_PROGRESS = 0.5;

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const value = (name) => flag(name)?.split('=').slice(1).join('=');
const opts = {
  base: (args.find((a) => /^https?:/.test(a)) || 'http://localhost:8000/').replace(/\/?$/, '/'),
  pages: args.filter((a) => a.endsWith('.html')),
  out: resolve(ROOT, value('out') || 'plan/round5/shots'),
  extras: !flag('no-extras'),
  touch: Boolean(flag('touch')),
};
const vps = (value('vp') || DEFAULT_VPS).split(',').flatMap((v) => PRESETS[v] || [v]).map((v) => v.split('x').map(Number));
if (vps.some(([w, h]) => !(w > 0 && h > 0))) {
  console.error('Bad --vp value. Use WxH,WxH or desktop|mobile|review.');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');
const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'scene';

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

/** Installed before any page script: the time of the globe canvas's last draw (every draw clears first). */
const GLOBE_PROBE = `(() => {
  const clear = CanvasRenderingContext2D.prototype.clearRect;
  window.__globeDrawAt = 0;
  CanvasRenderingContext2D.prototype.clearRect = function (...a) {
    if (this.canvas && this.canvas.id === 'globe') window.__globeDrawAt = performance.now();
    return clear.apply(this, a);
  };
})();`;

const ACTIVATE = (i) => `(async () => {
  const f = ${HOOK};
  if (!f || !f.enabled) {
    document.querySelectorAll('section.scene')[${i}]?.scrollIntoView({ block: 'start' });
  } else {
    f.goTo(${i}, { immediate: true });
  }
  for (let k = 0; k < 3; k++) await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, ${SETTLE_MS}));
  const t0 = performance.now();
  while (performance.now() - window.__globeDrawAt < ${GLOBE_QUIET_MS} && performance.now() - t0 < ${GLOBE_WAIT_MAX_MS}) {
    await new Promise((r) => setTimeout(r, 50));
  }
  return f && f.enabled ? ${CURRENT(HOOK_NAME)} === ${i} : null;
})()`;

/** Round 5: the cut a → b paused at 50%. Round 4: halfway (film time) between the two focus points. */
const MIDWAY = (a, b) => `(async () => {
  const f = ${HOOK};
  if (!f || !f.enabled) return null;
  if (typeof f.seekCut === 'function') {
    f.goTo(${a}, { immediate: true });
    await new Promise((r) => setTimeout(r, 300));
    const tl = f.seekCut(${b}, ${MID_PROGRESS});
    for (let k = 0; k < 3; k++) await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 150));
    return tl ? { time: Math.round(tl.time() * 100) / 100, progress: ${MID_PROGRESS}, finish: true } : null;
  }
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

const setViewport = (send, w, h) => emulate(send, w, h, { touch: opts.touch });

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
      if (mid.finish) await evaluate(send, `${HOOK}.goTo(0, { immediate: true }); true`);
      rows.push({ i: 0.5, id: 'transition', title: `midway scene 1 -> 2 (cut t=${mid.time}s, progress ${mid.progress})`, file, kind: 'transition' });
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
  const { api, close } = await launchChrome({ prefix: 'shoot-', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
    const { send } = api;
    await send('Page.addScriptToEvaluateOnNewDocument', { source: GLOBE_PROBE });
    await interceptResponses(api, [filmHook(HOOK_NAME)]);
    await setMedia(send, { touch: opts.touch });
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
    mkdirSync(opts.out, { recursive: true });
    writeFileSync(join(opts.out, 'index.md'), indexMd(results, splash));
    results.forEach((r) => console.log(`${r.page.padEnd(15)} ${r.viewport.padEnd(10)} ${String(r.rows.filter((x) => x.kind === 'scene').length).padStart(3)} scenes${r.problems.length ? `  ! ${r.problems.join('; ')}` : ''}`));
    process.exitCode = results.some((r) => r.problems.length) ? 1 : 0;
  } finally {
    await close();
  }
}

main().catch((e) => { console.error(e); process.exitCode = 2; });
