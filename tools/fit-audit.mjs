/**
 * Fit audit (DIRECTION §13 T1, R4 shared.md §8): loads each page in headless Chrome at a set
 * of viewports and reports, per scene, whether it fits one screen and keeps the Round 5 budgets.
 *
 *   node tools/fit-audit.mjs [baseUrl] [page.html ...] [options]
 *
 *   --vp=all|desktop|mobile|short|review|WxH,WxH   viewports (default: all = the 9 of the contract)
 *   --flow             reduced-motion flow mode (sections must fit 100svh)
 *   --touch            a coarse pointer with no hover, emulated before load: touch-cut mode
 *   --states=file.mjs  scripted states per scene (contract: tools/fit-states/_harness.md)
 *   --fixture=name     serve tools/fit-states/fixtures/<name>.json (or a path) as config.js PARTNERS
 *   --ph-repeat=n      repeat every .ph text n times (legal S6: counsel-length stand-in)
 *   --runs=n           runs per viewport; a scene passes only if every run passes (default 2, flow 1)
 *   --no-variants      skip the automatic worst cases (tabs, details, pagers, stepper units, errors)
 *   --no-r5            skip the R5 budgets (words, elements, groups, whitespace, longword, page checks)
 *   --json | --save=path/base | --why | --fallback | --now | --no-activate | --raw   (as in Round 4)
 *
 * Failures (each counts):
 *   Y / X / header / scroll    R4 §8.1-8.3 (active scene; X ignores clipped and aria-hidden decoration)
 *   clipped                    an overflow hidden|clip box cutting its own content (R4 §8.4), or a
 *                              pager page whose items end below the window (R4 §8.5)
 *   small-text                 visible text < 14 px anywhere, or reading text < --fs-note (DIRECTION §3)
 *   overlap                    consecutive rows of a .scene--fill grid overlap (R4 §8.7)
 *   spare                      #credits < 24 px, a form scene < 40 px in its all-errors pass, an open
 *                              dialog or sheet < 24 px
 *   words > 60, elements > 12, groups > 3, whitespace < 18%, longword, markup (no data-archetype /
 *   data-group)               per scene, base state (DIRECTION §4.2, §13); credits exempt
 *   archetype-repeat, gold-fields > 1 (story, legal: > 0), irises > 3       per page
 *
 * Activation: film.js is rewritten in flight (CDP Fetch; nothing on disk changes) to expose
 * initFilm()'s result as window.__fitAuditFilm. The audit waits for html.film-ready, seeks each
 * scene with film.goTo(i, { immediate: true }) and checks film.current (Round 4: film.active).
 * base.css is rewritten with :root{--bottom-h:0px} (the Round 4 box) unless --now.
 *
 * Starts its own Chrome (isolated profile, random debug port). Needs Node 22+.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  PAGES, VIEWPORTS_ALL, VIEWPORTS_REVIEW, CURRENT, evaluate, filmHook, interceptResponses, launchChrome,
  navigate, parseArgs, parseViewports, setMedia, setViewport, sleep, waitReadyExpr,
} from './lib/cdp.mjs';
import { measureBox, pageFacts } from './lib/fit-probe.mjs';
import { applyVariant, listVariants, pagerClip, phRepeat, undoVariants } from './lib/fit-variants.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PRESETS = {
  all: VIEWPORTS_ALL,
  desktop: ['1920x1080', '1536x864', '1440x900', '1366x768', '1280x720', '1024x768'],
  mobile: ['768x1024', '390x844', '360x740'],
  short: ['844x390', '740x360'],
  review: VIEWPORTS_REVIEW,
};
const HOOK = '__fitAuditFilm';
const FALLBACK_MAX_H = 560; // shorter viewports may pan (documented Round 4 fallback)
const READY_TIMEOUT_MS = 8000;
const ACTIVATE_SETTLE_MS = 450; // after a seek: CSS transitions keyed on .is-active
const VARIANT_SETTLE_MS = 250;
const STATE_SETTLE_MS = 400;
const RAW_SETTLE_MS = 2500;
const LOAD_ATTEMPTS = 4;
const RETRY_PAUSE_MS = 1500;
const TOLERANCE_PX = 1;
const SPARE = { credits: 24, form: 40, dialog: 24 }; // DIRECTION §13 T1 "Spare"
const BUDGET = { words: 60, elements: 12, groups: 3, goldFields: 1, irises: 3 }; // DIRECTION §4.2, §4.3
const NO_GOLD_PAGES = new Set(['story.html', 'legal.html']); // DIRECTION §4.3: Legal and Story have none
const ARCHETYPE_EXEMPT_PAGES = new Set(['legal.html']); // DIRECTION §4.2 rule 1

const cli = parseArgs();
const opts = {
  base: cli.base,
  pages: cli.pages,
  json: cli.has('json'),
  save: cli.value('save'),
  why: cli.has('why'),
  fallback: cli.has('fallback'),
  flow: cli.has('flow'),
  touch: cli.has('touch') && !cli.has('flow'),
  now: cli.has('now'),
  raw: cli.has('raw'),
  r5: !cli.has('no-r5'),
  variants: !cli.has('no-variants'),
  states: cli.value('states'),
  fixture: cli.value('fixture'),
  phRepeat: Number(cli.value('ph-repeat', 0)) || 0,
};
opts.activate = !cli.has('no-activate') && !opts.raw && !opts.flow;
opts.runs = Math.max(1, Number(cli.value('runs', opts.flow || opts.raw ? 1 : 2)) || 1);
const modeWanted = opts.flow ? 'flow' : opts.touch ? 'touch-cut' : 'cut';
let vps;
try {
  vps = parseViewports(cli.value('vp', 'all'), PRESETS);
} catch (e) {
  console.error(e.message);
  process.exit(2);
}

/* ---------- inputs: states module, fixture ---------- */

const fnSource = (fn) => {
  const src = String(fn).trim();
  return /^(async\s+)?run\s*\(/.test(src) ? src.replace(/^(async\s+)?run/, (m, a) => `${a || ''}function run`) : src;
};

async function loadStates(spec) {
  if (!spec) return [];
  const file = resolve(ROOT, spec);
  const mod = await import(pathToFileURL(file).href);
  const list = mod.default || mod.states || [];
  if (!Array.isArray(list)) throw new Error(`${spec}: export default an array of { scene, name, run }`);
  return list.map((s, k) => {
    if (s.scene === undefined || typeof s.run !== 'function') throw new Error(`${spec}: state ${k} needs scene and run()`);
    return { ...s, name: s.name || `state ${k + 1}`, src: fnSource(s.run) };
  });
}

function loadFixture(spec) {
  if (!spec) return null;
  const file = /[\\/]|\.json$/.test(spec) ? (isAbsolute(spec) ? spec : resolve(ROOT, spec)) : join(ROOT, 'tools/fit-states/fixtures', `${spec}.json`);
  if (!existsSync(file)) throw new Error(`fixture not found: ${file}`);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const partners = Array.isArray(data) ? data : data.partners;
  if (!Array.isArray(partners)) throw new Error(`${file}: expected an array (or { partners: [] })`);
  return { file, partners };
}

const stateApplies = (s, w, h) => {
  if (s.modes && !s.modes.includes(modeWanted)) return false;
  if (typeof s.vp === 'function') return Boolean(s.vp(w, h));
  if (Array.isArray(s.vp)) return s.vp.includes(`${w}x${h}`);
  return true;
};

/* ---------- in-page expressions ---------- */

/** The pre-Round-4 probe, kept for --raw comparisons. */
function rawProbe() {
  return [...document.querySelectorAll('section.scene')].map((scene, i) => {
    const inner = scene.querySelector('.scene__inner') || scene;
    const pan = inner.querySelector(':scope > .scene__pan') || inner;
    const box = inner.clientHeight || window.innerHeight;
    const content = Math.max(pan.scrollHeight, pan.offsetHeight);
    let widest = 0;
    scene.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.right - window.innerWidth > widest) widest = r.right - window.innerWidth;
    });
    return { kind: 'scene', i, id: scene.id || '', title: scene.dataset.title || '', box, content,
      overflowY: Math.max(0, Math.round(content - box)), overflowX: Math.max(0, Math.round(widest)),
      headerOverlap: 0, innerScroll: [], clipped: [], overlap: [], smallText: [], spare: 0 };
  });
}

const ACTIVATE = (i) => `(async () => {
  const f = window.${HOOK};
  const s = document.querySelectorAll('section.scene')[${i}];
  if (f && f.enabled && ${opts.activate}) f.goTo(${i}, { immediate: true });
  if (!f || !f.enabled || f.mode === 'touch-cut' || ${opts.touch}) s?.scrollIntoView({ block: 'start', behavior: 'instant' });
  for (let k = 0; k < 3; k++) await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, ${ACTIVATE_SETTLE_MS}));
  return f && f.enabled && ${opts.activate} ? ${CURRENT(HOOK)} === ${i} : false;
})()`;

const SETTLE = (ms) => `(async () => { for (let k = 0; k < 2; k++) await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, ${ms})); return true; })()`;

const RUN_STATE = (i, src) => `(async () => {
  const film = window.${HOOK};
  const scene = document.querySelectorAll('section.scene')[${i}];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await (${src})({ film, scene, index: ${i}, sleep });
  return true;
})()`;

const PH_REPEAT_INIT = (n) => `document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') (${phRepeat})(${n});
});`;

const measureExpr = (target, cfg) => `(${measureBox})(${JSON.stringify(target)}, ${JSON.stringify(cfg)})`;
const dialogCount = `document.querySelectorAll('dialog[open]').length`;

/* ---------- measuring ---------- */

const worse = (a, b, key, pick = Math.max) => (b[key] === undefined ? a[key] : pick(a[key], b[key]));
const union = (a = [], b = []) => {
  const map = new Map();
  [...a, ...b].forEach((x) => {
    const k = `${x.axis || ''}|${x.el}`;
    if (!map.has(k) || map.get(k).px < x.px) map.set(k, x);
  });
  return [...map.values()];
};
const tag = (list, name) => (name ? list.map((x) => ({ ...x, at: x.at || name })) : list);

/** Fold measurement m (taken in state `name`) into the scene's running worst case. */
function merge(acc, m, name) {
  if (!acc) {
    return { ...m, innerScroll: tag(m.innerScroll, name), clipped: tag(m.clipped, name), smallText: tag(m.smallText, name),
      overlap: tag(m.overlap, name), at: {}, dialogs: [], spareErrors: null, pagerClip: 0 };
  }
  const out = { ...acc };
  ['overflowY', 'overflowX', 'headerOverlap'].forEach((k) => {
    if (m[k] > acc[k]) { out[k] = m[k]; out.at = { ...out.at, [k]: name }; }
  });
  if (m.overflowX > acc.overflowX) out.sideX = m.sideX;
  out.spare = worse(acc, m, 'spare', Math.min);
  out.box = acc.box;
  out.content = worse(acc, m, 'content');
  out.innerScroll = union(acc.innerScroll, tag(m.innerScroll, name));
  out.clipped = union(acc.clipped, tag(m.clipped, name));
  out.smallText = union(acc.smallText, tag(m.smallText, name)).slice(0, 8);
  out.overlap = union(acc.overlap, tag(m.overlap, name));
  return out;
}

async function measureDialogs(send, name) {
  const n = await evaluate(send, dialogCount);
  const list = [];
  for (let d = 0; d < n; d++) {
    const m = await evaluate(send, measureExpr({ kind: 'dialog', i: d }, { mode: modeWanted, why: opts.why }));
    if (!m.missing) list.push({ ...m, at: name });
  }
  return list;
}

async function loadPage(api, page, fixtureState) {
  const { send } = api;
  await navigate(api, opts.base + page);
  let state = await evaluate(send, waitReadyExpr(HOOK, READY_TIMEOUT_MS));
  // A simple dev server can refuse some module requests; reload until the engine is up.
  for (let attempt = 1; attempt < LOAD_ATTEMPTS && !opts.flow && !state.film; attempt++) {
    await sleep(RETRY_PAUSE_MS);
    await navigate(api, opts.base + page);
    state = { ...(await evaluate(send, waitReadyExpr(HOOK, READY_TIMEOUT_MS))), attempts: attempt + 1 };
  }
  if (opts.phRepeat) {
    await evaluate(send, `(${phRepeat})(${opts.phRepeat}); window.${HOOK}?.refresh?.(); true`);
    await evaluate(send, SETTLE(VARIANT_SETTLE_MS));
  }
  state.fixtureServed = fixtureState ? fixtureState.served : undefined;
  return state;
}

async function measureScene(api, i, cfgBase) {
  const { send } = api;
  const activated = await evaluate(send, ACTIVATE(i));
  const cfg = { ...cfgBase, activated };
  let acc = merge(null, await evaluate(send, measureExpr({ kind: 'scene', i }, cfg)), '');
  acc.activated = activated;
  if (!opts.variants) return acc;
  const variants = await evaluate(send, `(${listVariants})(${i})`);
  for (const v of variants) {
    await evaluate(send, `(${applyVariant})(${i}, ${JSON.stringify(v)}); true`);
    await evaluate(send, SETTLE(VARIANT_SETTLE_MS));
    const m = await evaluate(send, measureExpr({ kind: 'scene', i }, { ...cfg, r5: false }));
    acc = merge(acc, m, v.name);
    if (v.kind === 'step' && v.errors && m.hasForm) acc.spareErrors = Math.min(acc.spareErrors ?? Infinity, m.spare);
    if (v.kind === 'pager') {
      const px = await evaluate(send, `(${pagerClip})(${i})`);
      if (px > acc.pagerClip) { acc.pagerClip = px; acc.at = { ...acc.at, pager: v.name }; }
    }
    if (await evaluate(send, dialogCount)) acc.dialogs.push(...await measureDialogs(send, v.name));
    await evaluate(send, `(${undoVariants})(); true`);
  }
  if (variants.length) await evaluate(send, SETTLE(VARIANT_SETTLE_MS));
  acc.variants = variants.length;
  return acc;
}

async function auditPage(api, page, w, h, states, fixtureState) {
  const { send } = api;
  await setViewport(send, w, h, { touch: opts.touch });
  const state = await loadPage(api, page, fixtureState);
  if (opts.raw) {
    await sleep(RAW_SETTLE_MS);
    return { mode: 'raw', state, scenes: await evaluate(send, `(${rawProbe})()`) };
  }
  const facts = await evaluate(send, `(${pageFacts})()`);
  const cfgBase = { mode: opts.flow || state.mode === 'flow' ? 'flow' : state.mode === 'touch-cut' ? 'touch-cut' : 'cut', now: opts.now, why: opts.why, r5: opts.r5 };
  const scenes = [];
  let dirty = false;
  for (let i = 0; i < state.count; i++) {
    const own = states.filter((s) => (s.scene === i || s.scene === facts.scenes[i]?.id || `#${facts.scenes[i]?.id}` === s.scene) && stateApplies(s, w, h));
    let acc = await measureScene(api, i, cfgBase);
    for (const s of own) {
      if (dirty) await loadPage(api, page, fixtureState);
      await evaluate(send, ACTIVATE(i));
      await evaluate(send, RUN_STATE(i, s.src));
      await evaluate(send, SETTLE(STATE_SETTLE_MS));
      const m = await evaluate(send, measureExpr({ kind: 'scene', i }, { ...cfgBase, activated: acc.activated, r5: false }));
      acc = merge(acc, m, s.name);
      if (s.errors && m.hasForm) acc.spareErrors = Math.min(acc.spareErrors ?? Infinity, m.spare);
      if (await evaluate(send, dialogCount)) acc.dialogs.push(...await measureDialogs(send, s.name));
      dirty = true;
    }
    if (dirty && i + 1 < state.count) { await loadPage(api, page, fixtureState); dirty = false; }
    acc.states = own.length;
    scenes.push(acc);
  }
  const mode = opts.flow ? 'flow' : `${state.mode}${state.film && opts.activate ? ', activated' : ', neutralised'}`;
  return { mode, state, facts, scenes };
}

/* ---------- judging and report ---------- */

function judge(s, h) {
  const reasons = [];
  let fail = false;
  const add = (text, isFail = true) => { reasons.push(text); fail = fail || isFail; };
  const at = (k) => (s.at?.[k] ? ` (${s.at[k]})` : '');
  const panAllowed = opts.fallback && h < FALLBACK_MAX_H;
  if (s.overflowY > TOLERANCE_PX) add(panAllowed ? `(Y +${s.overflowY} pans: fallback)` : `Y +${s.overflowY}${at('overflowY')}`, !panAllowed);
  if (s.headerOverlap > TOLERANCE_PX) add(`header +${s.headerOverlap}${at('headerOverlap')}`);
  if (s.overflowX > TOLERANCE_PX) add(`X +${s.overflowX}${s.sideX === 'left' ? ' left' : ''}${at('overflowX')}`);
  (s.innerScroll || []).forEach((x) => add(`scroll-${x.axis} +${x.px} ${x.el}${x.at ? ` (${x.at})` : ''}`));
  (s.clipped || []).forEach((x) => add(`clipped-${x.axis} +${x.px} ${x.el}${x.at ? ` (${x.at})` : ''}`));
  if (s.pagerClip > TOLERANCE_PX) add(`clipped-pager +${s.pagerClip}${at('pager')}`);
  (s.smallText || []).forEach((x) => add(`small-text ${x.px}px < ${x.floor} ${x.el}${x.at ? ` (${x.at})` : ''}`));
  (s.overlap || []).forEach((x) => add(`overlap +${x.px} ${x.el}${x.at ? ` (${x.at})` : ''}`));
  const credits = s.id === 'credits' || s.r5?.archetype === 'credits';
  if (credits && s.spare < SPARE.credits) add(`spare ${s.spare} < ${SPARE.credits} (#credits)`);
  if (s.spareErrors !== null && s.spareErrors !== undefined && s.spareErrors < SPARE.form) add(`spare ${s.spareErrors} < ${SPARE.form} (form, all-errors)`);
  (s.dialogs || []).forEach((d) => {
    const name = `dialog${d.id ? `#${d.id}` : ` ${d.i}`} (${d.at})`;
    if (d.spare < SPARE.dialog) add(`spare ${d.spare} < ${SPARE.dialog} ${name}`);
    if (d.overflowY > TOLERANCE_PX) add(`Y +${d.overflowY} ${name}`);
    if (d.overflowX > TOLERANCE_PX) add(`X +${d.overflowX} ${name}`);
    d.innerScroll.forEach((x) => add(`scroll-${x.axis} +${x.px} ${x.el} in ${name}`));
    d.clipped.forEach((x) => add(`clipped-${x.axis} +${x.px} ${x.el} in ${name}`));
    d.smallText.forEach((x) => add(`small-text ${x.px}px < ${x.floor} ${x.el} in ${name}`));
  });
  const r = s.r5;
  if (r && !r.archetype) add('markup: no data-archetype');
  if (r && !r.exempt) {
    if (!r.groups) add('markup: no data-group');
    if (r.words > BUDGET.words) add(`words ${r.words} > ${BUDGET.words}`);
    if (r.elements > BUDGET.elements) add(`elements ${r.elements} > ${BUDGET.elements}`);
    if (r.groups > BUDGET.groups) add(`groups ${r.groups} > ${BUDGET.groups}`);
    if (r.groups && r.empty < r.whiteMin) add(`whitespace ${Math.round(r.empty * 100)}% < ${Math.round(r.whiteMin * 100)}%`);
    r.longword.forEach((x) => add(`longword "${x.word}" ${x.px}px > ${x.max}`));
  }
  return { fail, reasons };
}

/** Page-level R5 checks from the scene sequence (viewport independent). */
function pageChecks(page, facts) {
  if (!opts.r5 || !facts) return [];
  const out = [];
  const list = facts.scenes;
  if (!ARCHETYPE_EXEMPT_PAGES.has(page)) {
    list.forEach((s, k) => {
      if (k && s.archetype && s.archetype === list[k - 1].archetype && !/^(credits|stage)$/.test(s.archetype)) {
        out.push(`archetype-repeat #${list[k - 1].id} and #${s.id} are both ${s.archetype}`);
      }
    });
  }
  const gold = list.filter((s) => s.field === 'gold').length;
  const goldMax = NO_GOLD_PAGES.has(page) ? 0 : BUDGET.goldFields;
  if (gold > goldMax) out.push(`gold-fields ${gold} > ${goldMax}`);
  const irises = list.filter((s, k) => k && s.field && list[k - 1].field && s.field !== list[k - 1].field).length;
  if (irises > BUDGET.irises) out.push(`irises ${irises} > ${BUDGET.irises} (${list.map((s) => s.field || '?').join(' ')})`);
  return out;
}

/** Fold several runs of one page × viewport into one (worst of each scene). */
function foldRuns(runs) {
  const [first, ...rest] = runs;
  const scenes = first.scenes.map((s, i) => rest.reduce((acc, r) => {
    const m = r.scenes[i];
    if (!m) return acc;
    const out = merge(acc, m, '');
    out.at = { ...acc.at, ...Object.fromEntries(Object.entries(m.at || {}).filter(([k]) => m[k] > acc[k])) };
    out.dialogs = [...acc.dialogs, ...(m.dialogs || [])];
    out.spareErrors = m.spareErrors === null ? acc.spareErrors : Math.min(acc.spareErrors ?? Infinity, m.spareErrors);
    out.pagerClip = Math.max(acc.pagerClip || 0, m.pagerClip || 0);
    out.r5 = acc.r5;
    return out;
  }, s));
  return { ...first, scenes, runs: runs.length };
}

function textReport(report) {
  const lines = [];
  const vpNames = [...new Set(report.map((r) => r.viewport))];
  const pageNames = [...new Set(report.map((r) => r.page))];
  let bad = 0;
  const cell = new Map();
  const pageLevel = new Map();
  report.forEach((r) => {
    const h = Number(r.viewport.split('x')[1]);
    r.failing = r.scenes.map((s) => ({ s, ...judge(s, h) })).filter((x) => x.fail || x.reasons.length);
    const n = r.failing.filter((x) => x.fail).length;
    bad += n;
    cell.set(`${r.page}|${r.viewport}`, n ? `${n}/${r.scenes.length}` : 'ok');
    if (!pageLevel.has(r.page)) pageLevel.set(r.page, pageChecks(r.page, r.facts));
  });
  pageLevel.forEach((list) => { bad += list.length; });
  const first = report[0] || {};
  lines.push(`Fit audit  ${new Date().toISOString()}  ${opts.base}  mode: ${first.mode || '-'}${opts.now ? ", today's box" : ', Round 4 box'}`
    + `${opts.fallback ? ', fallback <560 tall' : ''}${opts.states ? `, states ${opts.states}` : ''}${opts.fixture ? `, fixture ${opts.fixture}` : ''}`
    + `${opts.phRepeat ? `, ph x${opts.phRepeat}` : ''}${opts.r5 ? '' : ', no R5 checks'}, runs ${opts.runs}`);
  if (opts.touch && report.some((r) => r.state?.mode !== 'touch-cut')) lines.push('NOTE: --touch asked for touch-cut, but the engine reported another mode (the Round 4 engine has none).');
  if (opts.fixture && report.some((r) => r.state?.fixtureServed === false)) lines.push('NOTE: the fixture was not served (config.js was never requested unbundled: run on site/, not dist/).');
  lines.push('Cells: failing scenes / scenes.\n');
  const w0 = Math.max(4, ...pageNames.map((p) => p.length)) + 2;
  lines.push(['page'.padEnd(w0), ...vpNames.map((v) => v.padStart(10))].join(''));
  pageNames.forEach((p) => lines.push([p.padEnd(w0), ...vpNames.map((v) => (cell.get(`${p}|${v}`) || '-').padStart(10))].join('')));
  lines.push('');
  pageLevel.forEach((list, page) => {
    if (list.length) lines.push(`FAIL ${page} (page): ${list.join('; ')}`);
  });
  report.forEach(({ page, viewport, scenes, failing, mode }) => {
    const n = failing.filter((x) => x.fail).length;
    lines.push(`${n ? 'FAIL' : 'ok  '} ${page} @ ${viewport}: ${scenes.length} scenes${n ? `, ${n} fail` : ', all fit'}${mode && !/activated|raw/.test(mode) ? ` [${mode}]` : ''}`);
    failing.forEach(({ s, fail, reasons }) => {
      const r5 = s.r5 ? ` [${s.r5.archetype || '-'} w${s.r5.words} e${s.r5.elements} g${s.r5.groups} empty ${Math.round(s.r5.empty * 100)}%]` : '';
      lines.push(`  ${fail ? '-' : ' '} #${s.i} ${s.id || s.title}: ${reasons.join(', ')} (content ${s.content} / box ${s.box}, spare ${s.spare})${r5}`);
      if (s.why) Object.entries(s.why).forEach(([k, list]) => list.forEach((x) => lines.push(`        why ${k} +${x.px}: ${x.el}`)));
    });
  });
  lines.push(bad ? `\n${bad} failures (scene/viewport combinations plus page checks).` : '\nEvery scene fits at every viewport, and every budget holds.');
  return { text: lines.join('\n'), bad };
}

async function main() {
  const states = await loadStates(opts.states);
  const fixture = loadFixture(opts.fixture);
  const { api, close } = await launchChrome({ prefix: 'fit-audit-' });
  try {
    const { send } = api;
    const fixtureState = fixture ? { served: false } : null;
    const rules = [filmHook(HOOK)];
    if (!opts.now) rules.push({ pattern: '*/base.css*', test: /\/base\.css(\?|$)/, rewrite: (u, b) => `${b}\n:root{--bottom-h:0px !important}\n` });
    if (fixture) {
      rules.push({
        pattern: '*/assets/js/config.js*', test: /\/config\.js(\?|$)/,
        rewrite: (u, body) => {
          const next = body.replace(/export const PARTNERS\s*=\s*Object\.freeze\(\[[\s\S]*?\]\);/, `export const PARTNERS = Object.freeze(${JSON.stringify(fixture.partners)});`);
          fixtureState.served = next !== body;
          return next;
        },
      });
    }
    if (!opts.raw) await interceptResponses(api, rules);
    if (opts.phRepeat) await send('Page.addScriptToEvaluateOnNewDocument', { source: PH_REPEAT_INIT(opts.phRepeat) });
    if (process.env.FIT_DEBUG) {
      api.on('Runtime.exceptionThrown', (e) => process.stderr.write(`page exception: ${e.exceptionDetails?.exception?.description?.slice(0, 300)}\n`));
    }
    await setMedia(send, { reduce: opts.flow, touch: opts.touch });
    const report = [];
    for (const page of opts.pages.length ? opts.pages : PAGES) {
      for (const [w, h] of vps) {
        const runs = [];
        for (let k = 0; k < opts.runs; k++) runs.push(await auditPage(api, page, w, h, states, fixtureState));
        report.push({ page, viewport: `${w}x${h}`, ...foldRuns(runs) });
        if (!opts.json) process.stderr.write(`. ${page} @ ${w}x${h}\n`);
      }
    }
    const { text, bad } = textReport(report);
    const json = JSON.stringify(report.map(({ failing, ...r }) => r), null, 1);
    if (opts.save) {
      const base = resolve(ROOT, opts.save);
      mkdirSync(dirname(base), { recursive: true });
      writeFileSync(`${base}.txt`, `${text}\n`);
      writeFileSync(`${base}.json`, json);
    }
    console.log(opts.json ? json : text);
    process.exitCode = bad ? 1 : 0;
  } finally {
    await close();
  }
}

main().catch((e) => { console.error(e); process.exitCode = 2; });
