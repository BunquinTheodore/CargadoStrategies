/**
 * Performance gate (DIRECTION §12, §13 T2): measures the built site and fails when a budget is
 * missed. Run it after `npm run build` (`npm run perf` does both).
 *
 *   node tools/perf-gate.mjs [baseUrl] [page.html ...] [--only=static,lighthouse,lab] [--profiles=mobile,desktop] [--gpu] [--json] [--save=path/base]
 *
 *   baseUrl   default: serves dist/ itself with serve.mjs (Brotli/gzip, real cache headers) on a free port
 *
 * static      from dist/ and tools/.cache/build-meta.json (written by build.mjs): initial JS gzip per
 *             page (entry + modulepreloads) ≤ 70 KB, legal ≤ 40 KB with no dotglobe, layers (stars)
 *             or cursor module, CSS gzip per page ≤ 28 KB, the brushed tile ≤ 6 KB
 * lighthouse  Lighthouse 13.5.0 (npx, the installed Chrome, isolated profile), mobile (Moto G Power,
 *             4x CPU, slow 4G) and desktop (--preset=desktop): Performance ≥ 90 / ≥ 95,
 *             Accessibility 100, Best Practices ≥ 95, SEO ≥ 95, LCP ≤ 2.0 s / 1.0 s, TBT ≤ 150 / 50 ms,
 *             CLS ≤ 0.02, script transfer ≤ 70 / 110 KB, fonts ≤ 5 files, Home transfer ≤ 300 / 380 KB
 * lab         our own CDP session: DOM nodes ≤ 900, composited layers < 30, INP on a sheet chip
 *             ≤ 150 / 100 ms, 3 cuts at 4x CPU (mobile, touch-cut, tier B) or 1x (desktop, tier A)
 *             with no long task > 50 ms and ≥ 55 / 58 fps, 0 rAF callbacks 6 s after the last
 *             landing, splash ≤ 1.1 s (Home, fresh session: splash.js's `cs-splash` measure, the
 *             mark's first frame to done). The tier is pinned per profile.
 *   --gpu     render the lab on the machine's GPU. Without it Chrome uses SwiftShader (software
 *             GL), whose frame rate and long tasks say more about the CPU than the site: those
 *             rows are then reported as "info" and never fail. Run the fps gate with --gpu on an
 *             idle machine.
 * Exit code 1 when any budget fails.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { CHROME, PAGES, parseArgs } from './lib/cdp.mjs';
import { runLab } from './lib/perf-lab.mjs';
import { serveDir } from './lib/serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const META = join(ROOT, 'tools/.cache/build-meta.json');
const LIGHTHOUSE = 'lighthouse@13.5.0';
const KB = 1024;
const HOME = 'index.html';
const LEGAL = 'legal.html';
/** DIRECTION §12, [mobile, desktop]. */
const B = {
  perf: [90, 95], a11y: [100, 100], bp: [95, 95], seo: [95, 95],
  lcp: [2000, 1000], tbt: [150, 50], cls: [0.02, 0.02], inp: [150, 100],
  jsInitialKb: 70, jsLegalKb: 40, cssKb: 28, tileKb: 6, scriptKb: [70, 110], fonts: 5, homeKb: [300, 380],
  dom: 900, layers: 30, longTaskMs: 50, fps: [55, 58], idleRaf: 0, splashMs: 1100,
};

const cli = parseArgs();
const opts = {
  base: cli.argv.some((a) => /^https?:/.test(a)) ? cli.base : null,
  pages: cli.pages.length ? cli.pages : PAGES,
  only: String(cli.value('only', 'static,lighthouse,lab')).split(','),
  profiles: String(cli.value('profiles', 'mobile,desktop')).split(',').filter((p) => p === 'mobile' || p === 'desktop'),
  gpu: cli.has('gpu'),
  json: cli.has('json'),
  save: cli.value('save'),
};
const idx = (profile) => (profile === 'mobile' ? 0 : 1);

/* ---------- static ---------- */

const gzKb = (file) => gzipSync(readFileSync(file), { level: 9 }).length / KB;

function staticChecks(rows) {
  if (!existsSync(META)) return void rows.push({ check: 'build meta', page: '-', value: 'missing', budget: 'run npm run build', fail: true });
  const meta = JSON.parse(readFileSync(META, 'utf8'));
  opts.pages.forEach((page) => {
    const m = meta.pages[page];
    if (!m) return;
    const gone = [m.entry, ...m.preload].filter((f) => !existsSync(join(DIST, f)));
    if (gone.length) return void rows.push({ check: 'build meta', page, value: `stale: ${gone[0]} not in dist`, budget: 'rebuild', fail: true });
    const js = [m.entry, ...m.preload].reduce((n, f) => n + gzKb(join(DIST, f)), 0);
    const jsBudget = page === LEGAL ? B.jsLegalKb : B.jsInitialKb;
    rows.push({ check: 'JS initial gzip', page, value: `${js.toFixed(1)} KB`, budget: `≤ ${jsBudget} KB`, fail: js > jsBudget });
    if (page === LEGAL) {
      const banned = m.inputs.filter((p) => meta.legalExcludes.includes(p.split('/').pop()));
      rows.push({ check: 'legal: no dotglobe/stars/cursor', page, value: banned.join(', ') || 'none', budget: 'none', fail: banned.length > 0 });
    }
    const html = readFileSync(join(DIST, page), 'utf8');
    const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)">/g)].reduce((n, x) => n + gzKb(join(DIST, x[1])), 0);
    rows.push({ check: 'CSS gzip', page, value: `${css.toFixed(1)} KB`, budget: `≤ ${B.cssKb} KB`, fail: css > B.cssKb });
  });
  const imgDir = join(DIST, 'assets/img');
  const tiles = existsSync(imgDir) ? readdirSync(imgDir).filter((f) => /^brushed-256.*\.png$/.test(f)) : [];
  tiles.forEach((f) => {
    const kb = readFileSync(join(imgDir, f)).length / KB;
    rows.push({ check: 'brushed tile', page: f, value: `${kb.toFixed(1)} KB`, budget: `≤ ${B.tileKb} KB`, fail: kb > B.tileKb });
  });
}

/* ---------- lighthouse ---------- */

function lighthouse(url, profile) {
  const dir = mkdtempSync(join(tmpdir(), 'perf-lh-'));
  const out = join(dir, 'report.json');
  const args = [
    '--yes', LIGHTHOUSE, url, '--output=json', `--output-path=${out}`, '--quiet',
    `--chrome-path=${CHROME}`, `--chrome-flags=--headless=new --user-data-dir=${join(dir, 'profile')}`,
    '--only-categories=performance,accessibility,best-practices,seo', ...(profile === 'desktop' ? ['--preset=desktop'] : []),
  ];
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return new Promise((res, rej) => {
    const child = spawn(cmd, args.map((a) => (process.platform === 'win32' ? JSON.stringify(a) : a)), { shell: process.platform === 'win32', stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => {
      try {
        if (!existsSync(out)) throw new Error(`lighthouse exited ${code}: ${err.slice(-400)}`);
        res(JSON.parse(readFileSync(out, 'utf8')));
      } catch (e) { rej(e); } finally { rmSync(dir, { recursive: true, force: true }); }
    });
  });
}

function lighthouseRows(rows, page, profile, lhr) {
  const i = idx(profile);
  const score = (c) => Math.round((lhr.categories[c]?.score ?? 0) * 100);
  const num = (a) => lhr.audits[a]?.numericValue;
  const add = (check, value, budget, fail) => rows.push({ check, page, profile, value, budget, fail });
  add('Lighthouse Performance', score('performance'), `≥ ${B.perf[i]}`, score('performance') < B.perf[i]);
  add('Accessibility', score('accessibility'), `≥ ${B.a11y[i]}`, score('accessibility') < B.a11y[i]);
  add('Best Practices', score('best-practices'), `≥ ${B.bp[i]}`, score('best-practices') < B.bp[i]);
  add('SEO', score('seo'), `≥ ${B.seo[i]}`, score('seo') < B.seo[i]);
  const lcp = num('largest-contentful-paint');
  add('LCP', `${Math.round(lcp)} ms`, `≤ ${B.lcp[i]} ms`, lcp > B.lcp[i]);
  const tbt = num('total-blocking-time');
  add('TBT', `${Math.round(tbt)} ms`, `≤ ${B.tbt[i]} ms`, tbt > B.tbt[i]);
  const cls = num('cumulative-layout-shift');
  add('CLS', cls.toFixed(3), `≤ ${B.cls[i]}`, cls > B.cls[i]);
  const reqs = lhr.audits['network-requests']?.details?.items || [];
  const scriptKb = reqs.filter((r) => r.resourceType === 'Script').reduce((n, r) => n + (r.transferSize || 0), 0) / KB;
  add('script transfer', `${scriptKb.toFixed(1)} KB`, `≤ ${B.scriptKb[i]} KB`, scriptKb > B.scriptKb[i]);
  const fonts = reqs.filter((r) => r.resourceType === 'Font').length;
  add('font files', fonts, `≤ ${B.fonts}`, fonts > B.fonts);
  if (page === HOME) {
    const total = num('total-byte-weight') / KB;
    add('total transfer (Home)', `${total.toFixed(0)} KB`, `≤ ${B.homeKb[i]} KB`, total > B.homeKb[i]);
  }
}

/* ---------- lab ---------- */

function labRows(rows, lab) {
  lab.forEach((r) => {
    const i = idx(r.profile);
    const add = (check, value, budget, fail) => rows.push({ check, page: r.page, profile: r.profile, value, budget, fail });
    add('DOM nodes', r.dom, `≤ ${B.dom}`, r.dom > B.dom);
    rows[rows.length - 1].renderer = r.renderer;
    if (r.layers !== null) add('composited layers', r.layers, `< ${B.layers}`, r.layers >= B.layers);
    if (r.inp !== null) add('INP (sheet chip)', `${r.inp} ms`, `≤ ${B.inp[i]} ms`, r.inp > B.inp[i]);
    else add('INP (sheet chip)', 'not measured (no sheet or chip)', `≤ ${B.inp[i]} ms`, false);
    if (r.cuts.skipped) add('cuts', r.cuts.skipped, '-', false);
    else {
      /* Software GL: the numbers are shown, but only a GPU run (--gpu) can fail them. */
      const info = r.softwareGl ? ' (info: software GL)' : '';
      const gated = (fail) => !r.softwareGl && fail;
      add(`long tasks in ${r.cuts.cuts} cuts (${r.profile === 'mobile' ? '4x CPU' : '1x'})`, `${r.cuts.longest} ms max${info}`, `≤ ${B.longTaskMs} ms`, gated(r.cuts.longest > B.longTaskMs));
      add(`cut frame rate (${r.mode}, tier ${r.tier})`, `${r.cuts.fps} fps${info}`, `≥ ${B.fps[i]} fps`, gated(r.cuts.fps < B.fps[i]) || r.cuts.cuts < 1);
    }
    add('idle rAF callbacks (6-8 s)', r.idleRaf, `= ${B.idleRaf}`, r.idleRaf > B.idleRaf);
    if (r.page === HOME) {
      const shown = r.splashMs !== null;
      add('splash (fresh, first frame → done)', shown ? `${r.splashMs} ms` : 'no cs-splash measure (CSS fallback or skipped)', `≤ ${B.splashMs} ms`, !shown || r.splashMs > B.splashMs);
    }
  });
}

/* ---------- report ---------- */

function report(rows, base) {
  const fails = rows.filter((r) => r.fail);
  const w = (s, n) => String(s).padEnd(n);
  const lines = [`Perf gate  ${new Date().toISOString()}  ${base}`, ''];
  lines.push(`${w('', 5)}${w('check', 40)}${w('page', 22)}${w('profile', 9)}${w('value', 34)}budget`);
  rows.forEach((r) => lines.push(`${r.fail ? 'FAIL ' : 'ok   '}${w(r.check, 40)}${w(r.page, 22)}${w(r.profile || '', 9)}${w(r.value, 34)}${r.budget}`));
  const gl = [...new Set(rows.map((r) => r.renderer).filter(Boolean))];
  if (gl.length) lines.push('', `lab WebGL renderer: ${gl.join('; ')}`);
  lines.push('', fails.length ? `${fails.length} budgets missed.` : 'Every budget holds.');
  return lines.join('\n');
}

async function main() {
  const rows = [];
  if (opts.only.includes('static')) staticChecks(rows);
  const server = opts.base ? null : await serveDir('dist');
  const base = opts.base || server.base;
  try {
    if (opts.only.includes('lighthouse')) {
      for (const page of opts.pages) {
        for (const profile of opts.profiles) {
          try {
            lighthouseRows(rows, page, profile, await lighthouse(base + page, profile));
          } catch (e) {
            rows.push({ check: 'Lighthouse run', page, profile, value: e.message.slice(0, 120), budget: 'runs', fail: true });
          }
          process.stderr.write(`. lighthouse ${page} ${profile}\n`);
        }
      }
    }
    if (opts.only.includes('lab')) labRows(rows, await runLab(base, opts.pages, opts.profiles, { gpu: opts.gpu }));
  } finally {
    server?.close();
  }
  const text = report(rows, base);
  if (opts.save) {
    const file = resolve(ROOT, opts.save);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(`${file}.txt`, `${text}\n`);
    writeFileSync(`${file}.json`, JSON.stringify(rows, null, 1));
  }
  console.log(opts.json ? JSON.stringify(rows, null, 1) : text);
  process.exitCode = rows.some((r) => r.fail) ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exitCode = 2; });
