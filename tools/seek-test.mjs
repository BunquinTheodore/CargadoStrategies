/**
 * Seek test (DIRECTION §13 T5, "no dead air"): pauses every cut at 25%, 50% and 75%, takes a
 * screenshot and checks it.
 *
 *   node tools/seek-test.mjs [baseUrl] [page.html ...] [--vp=1440x900,390x844] [--tiers=A,C] [--out=dir] [--all] [--json]
 *
 * Tiers: under load tier.js's frame sample can drop a page to tier C (or the head script's
 * safety timer to film-fallback), which changes the cut path, so each pass pins the tier: the
 * page HTML is rewritten to <html data-tier="X" data-tier-lock> (default passes A, then C;
 * --tiers=auto leaves the page's own guess and sampling alone). A page whose source already
 * locks its tier (legal: C) keeps it and runs only in that tier's pass. Every result line names
 * the tier the page was in when its frames were taken.
 *
 * For every neighbour pair (a, b), forward and back: film.goTo(a, { immediate: true }), then
 * tl = film.seekCut(b, p) (api.md §3, §18), two frames, screenshot, then tl.progress(1).
 * A frame fails when:
 *   empty field   under 2% of the scene box (header bottom to viewport bottom) is anything but
 *                 field, and visible text runs (the ones the next check judges) cover under 2%
 *                 of it too (thin or dim type under the iris reads as field pixel by pixel).
 *                 The 2% is set for 1440x900 and shrinks with larger boxes (same type size,
 *                 more field): floor = 2% × min(1, 1440·900 / (w·h)), 1.25% at 1920x1080. The field expected at each pixel follows the iris: inside the circle (or the polygon of a quad or flood wipe, transitions.js)
 *                 the incoming field, outside it the field on .fields (a crossfade accepts
 *                 either). Ink = dark, bone = #F5F0E6 ± 22, gold = the metal ramp.
 *   wrong field   a visible text run (effective opacity ≥ 0.6, in any scene) whose colour has
 *                 under 3:1 contrast against the dominant pixel colour behind it: text drawn on
 *                 the wrong field (ivory on bone, ink on ink). Text that is not painted is
 *                 skipped: outside a scene's inline clip-path circle or polygon, or in the
 *                 outgoing scene (.is-leaving) under the iris disc.
 *   text over globe  a visible text run of the incoming scene (not .is-leaving) with at least
 *                 GLOBE_OVERLAP of its box over lit pixels of the globe canvas (#globe, read
 *                 back with getImageData): the dotted sphere, ring or map drawn behind type.
 * Failing frames are saved as PNG under --out (default plan/round5/seek-test); --all saves every
 * frame. Runs in cut mode (fine pointer); touch-cut plays only the in group, so it is not seeked.
 * Exit code 1 when any frame fails, 2 when the engine has no seekCut.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, evaluate, filmHook, interceptResponses, launchChrome, navigate, parseArgs, parseViewports, setMedia, setViewport, waitReadyExpr } from './lib/cdp.mjs';
import { decodePng } from './lib/png.mjs';
import { insidePolygon } from '../site/core/engine/transitions.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOOK = '__seekFilm';
const PROGRESS = [0.25, 0.5, 0.75];
const MIN_CONTENT = 0.02; // DIRECTION §13 T5, at the reference viewport below
const FLOOR_REF_AREA = 1440 * 900;
const TIERS = ['A', 'B', 'C'];
const MIN_TEXT_CONTRAST = 3;
const MIN_TEXT_OPACITY = 0.6; // text still fading out or in is judged by the empty-field check, not this one
const SAMPLE_STEP = 2; // every 2nd pixel in x and y
const GLOBE_OVERLAP = 0.12; // share of a text box over lit globe pixels
const GLOBE_LIT_ALPHA = 64; // canvas alpha (0-255) that counts as drawn
const READY_TIMEOUT_MS = 8000;
const SETTLE_MS = 120;
const BONE = [245, 240, 230];
const BONE_TOLERANCE = 22;
const INK_MAX = 52; // brightest channel of the ink field (lamp, key light, grain)

const cli = parseArgs();
const opts = {
  base: cli.base,
  pages: cli.pages.length ? cli.pages : PAGES,
  out: resolve(ROOT, cli.value('out', 'plan/round5/seek-test')),
  all: cli.has('all'),
  json: cli.has('json'),
};
const vps = parseViewports(cli.value('vp', '1440x900,390x844'), {});
const tierSpec = String(cli.value('tiers', 'A,C')).toUpperCase();
const tierPasses = tierSpec === 'AUTO' ? [null] : tierSpec.split(',').filter((t) => TIERS.includes(t));
if (!tierPasses.length) throw new Error(`Bad --tiers "${tierSpec}". Use a list of A, B, C, or auto.`);
/** The tier the current pass pins (null: the page's own). Read by the HTML rewrite rule. */
let pinTier = null;

/** Document rewrite: <html … data-tier="X" data-tier-lock>, unless the source locks its own tier. */
const tierPin = {
  pattern: '*.html*',
  test: /\.html(\?|$)/,
  rewrite: (url, body) => (!pinTier ? body : body.replace(/<html\b([^>]*)>/, (tag, attrs) => (/\bdata-tier-lock\b/.test(attrs) ? tag
    : `<html${attrs.replace(/\s+data-tier="[^"]*"/, '')} data-tier="${pinTier}" data-tier-lock>`))),
};
/** The empty-field floor for a viewport: MIN_CONTENT at 1440x900, smaller on larger boxes. */
const minContentFor = (w, h) => MIN_CONTENT * Math.min(1, FLOOR_REF_AREA / (w * h));

/* ---------- in page ---------- */

function frameInfo(minOpacity, globeOverlap, litAlpha) {
  const h = document.documentElement;
  const header = document.querySelector('.site-header');
  const headerBottom = header && getComputedStyle(header).display !== 'none' ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const fields = document.querySelector('.fields');
  const iris = document.querySelector('.iris');
  /* An inline clip-path polygon(evenodd?, Xpx Ypx, …) (transitions.js) as points, or null. */
  const polyOf = (value) => {
    const m = (value || '').match(/^polygon\(\s*(?:(?:evenodd|nonzero)\s*,\s*)?(.*)\)$/);
    return m ? m[1].split(',').map((pair) => pair.trim().split(/\s+/).map((v) => parseFloat(v))) : null;
  };
  const inPoly = (pts, x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  let irisInfo = null;
  if (iris) {
    const cs = getComputedStyle(iris);
    const r = iris.getBoundingClientRect();
    if (cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 2 && parseFloat(cs.opacity) > 0.02) {
      const wipe = iris.dataset.state === 'wipe'; // quad / flood: the region is the iris's inline polygon
      irisInfo = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, r: r.width / 2, field: iris.dataset.field || '',
        fade: !wipe && (iris.dataset.state === 'fade' || cs.borderRadius === '0px'), poly: wipe ? polyOf(iris.style.clipPath) : null };
    }
  }
  const opacityOf = (el) => {
    let o = 1;
    for (let e = el; e && e !== h; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
    return o;
  };
  /* The part of rect r that every clipping ancestor leaves visible (overflow, clip-path inset()). */
  const visiblePart = (el, r) => {
    let [l, t, rr, b] = [r.left, r.top, r.right, r.bottom];
    const len = (x, size) => (x.endsWith('%') ? (parseFloat(x) / 100) * size : parseFloat(x) || 0);
    for (let e = el; e && e !== h; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const inset = cs.clipPath.match(/^inset\(([^)]*)\)/);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible' && !inset) continue;
      const box = e.getBoundingClientRect();
      let [cl, ct, cr, cb] = [box.left, box.top, box.right, box.bottom];
      if (inset) {
        const v = inset[1].split(/\s+round\s+/)[0].trim().split(/\s+/);
        ct += len(v[0], box.height); cr -= len(v[1] ?? v[0], box.width);
        cb -= len(v[2] ?? v[0], box.height); cl += len(v[3] ?? v[1] ?? v[0], box.width);
      }
      if (cs.overflowX !== 'visible' || inset) { l = Math.max(l, cl); rr = Math.min(rr, cr); }
      if (cs.overflowY !== 'visible' || inset) { t = Math.max(t, ct); b = Math.min(b, cb); }
    }
    const keep = rr - l > 2 && b - t > 2 && (rr - l) * (b - t) >= 0.5 * r.width * r.height;
    return keep ? { left: l, top: t, right: rr, bottom: b, width: rr - l, height: b - t } : null;
  };
  /* False when an ancestor's inline clip-path circle(<r>px at <x>px <y>px) (iris.js) or polygon (transitions.js) leaves point (x, y) unpainted. */
  const inCircleClips = (el, x, y) => {
    for (let e = el; e && e !== h; e = e.parentElement) {
      const poly = polyOf(e.style?.clipPath);
      if (poly) {
        const box = e.getBoundingClientRect();
        if (!inPoly(poly, x - box.left, y - box.top)) return false;
        continue;
      }
      const m = (e.style?.clipPath || '').match(/^circle\(\s*([\d.]+)px\s+at\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s*\)$/);
      if (!m) continue;
      const box = e.getBoundingClientRect();
      const [r, cx, cy] = m.slice(1).map(Number);
      if ((x - box.left - cx) ** 2 + (y - box.top - cy) ** 2 > r ** 2) return false;
    }
    return true;
  };
  /* True when (x, y) of an outgoing scene lies under the iris disc, which stacks above it. */
  const underIris = (scene, x, y) => !!irisInfo && !irisInfo.fade && scene.classList.contains('is-leaving')
    && (irisInfo.poly ? inPoly(irisInfo.poly, x, y) : (x - irisInfo.cx) ** 2 + (y - irisInfo.cy) ** 2 <= irisInfo.r ** 2);
  const texts = [];
  document.querySelectorAll('section.scene').forEach((scene) => {
    const walker = document.createTreeWalker(scene, NodeFilter.SHOW_TEXT);
    while (walker.nextNode() && texts.length < 240) {
      const node = walker.currentNode;
      const el = node.parentElement;
      if (!node.textContent.trim() || !el || el.closest('[aria-hidden="true"], .visually-hidden')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || cs.display === 'none' || opacityOf(el) < minOpacity) continue;
      const fill = (cs.webkitTextFillColor || cs.color).match(/[\d.]+/g) || [];
      if (fill.length === 4 && Number(fill[3]) < 0.5) continue; // outline numerals: transparent fill
      const range = document.createRange();
      range.selectNodeContents(node);
      const painted = (r) => {
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        return inCircleClips(el, x, y) && !underIris(scene, x, y);
      };
      const rects = [...range.getClientRects()].map((r) => visiblePart(el, r)).filter((r) => r && r.height >= 8 && r.width >= 6 && r.bottom > headerBottom && r.top < innerHeight && r.right > 0 && r.left < innerWidth && painted(r))
        .slice(0, 3).map((r) => [Math.max(0, r.left), Math.max(headerBottom, r.top), Math.min(innerWidth, r.right), Math.min(innerHeight, r.bottom)]);
      const rgb = (cs.color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      if (rects.length && rgb.length === 3) texts.push({ el: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : ''} "${node.textContent.trim().slice(0, 24)}"`, rgb, rects, leaving: scene.classList.contains('is-leaving') });
    }
  });
  /* Incoming text over lit pixels of the globe canvas. */
  const overGlobe = [];
  const canvas = document.getElementById('globe');
  const ccs = canvas && getComputedStyle(canvas);
  if (canvas && canvas.width && ccs.display !== 'none' && ccs.visibility !== 'hidden' && opacityOf(canvas) > 0.05) {
    const box = canvas.getBoundingClientRect();
    const kx = canvas.width / box.width, ky = canvas.height / box.height;
    let px = null;
    try { px = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data; } catch { /* not a 2D canvas: no check */ }
    if (px) {
      texts.filter((t) => !t.leaving).forEach((t) => {
        let n = 0, lit = 0;
        t.rects.forEach(([l, tp, r, b]) => {
          for (let y = tp; y < b; y += 3) {
            for (let x = l; x < r; x += 3) {
              const cx = Math.floor((x - box.left) * kx), cy = Math.floor((y - box.top) * ky);
              n += 1;
              if (cx >= 0 && cy >= 0 && cx < canvas.width && cy < canvas.height && px[(cy * canvas.width + cx) * 4 + 3] >= litAlpha) lit += 1;
            }
          }
        });
        if (n && lit / n >= globeOverlap && !overGlobe.some((o) => o.el === t.el)) overGlobe.push({ el: t.el, share: Math.round((lit / n) * 100) / 100 });
      });
    }
  }
  return { headerBottom, base: fields?.dataset.field || h.dataset.field || '', iris: irisInfo, texts, overGlobe, tier: h.dataset.tier || '' };
}

const SEEK = (a, b, p) => `(async () => {
  const f = window.${HOOK};
  f.goTo(${a}, { immediate: true });
  await new Promise((r) => setTimeout(r, ${SETTLE_MS}));
  const tl = f.seekCut(${b}, ${p});
  window.__seekTl = tl;
  for (let k = 0; k < 2; k++) await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, ${SETTLE_MS}));
  return { ok: !!tl, info: (${frameInfo})(${MIN_TEXT_OPACITY}, ${GLOBE_OVERLAP}, ${GLOBE_LIT_ALPHA}) };
})()`;
const FINISH = `(async () => { window.__seekTl?.progress(1); window.__seekTl = null; await new Promise((r) => setTimeout(r, 60)); return true; })()`;

/* ---------- pixel analysis ---------- */

const isField = (r, g, b, field) => {
  if (field === 'ink') return Math.max(r, g, b) <= INK_MAX;
  if (field === 'bone') return Math.abs(r - BONE[0]) <= BONE_TOLERANCE && Math.abs(g - BONE[1]) <= BONE_TOLERANCE && Math.abs(b - BONE[2]) <= BONE_TOLERANCE;
  if (field === 'gold') return r >= 150 && r > g && g > b && g >= 110 && b <= 170 && r - b >= 60;
  return false;
};

const luminance = ([r, g, b]) => {
  const c = [r, g, b].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

function analyse(png, info) {
  const { width, height, data } = png;
  const top = Math.ceil(info.headerBottom);
  const fieldsAt = (x, y) => {
    const ir = info.iris;
    if (!ir || !ir.field) return [info.base];
    if (ir.fade) return [info.base, ir.field];
    if (ir.poly) return insidePolygon(ir.poly, x, y) ? [ir.field] : [info.base];
    return (x - ir.cx) ** 2 + (y - ir.cy) ** 2 <= ir.r ** 2 ? [ir.field] : [info.base];
  };
  let total = 0, content = 0;
  for (let y = top; y < height; y += SAMPLE_STEP) {
    for (let x = 0; x < width; x += SAMPLE_STEP) {
      const i = (y * width + x) * 4;
      total += 1;
      if (!fieldsAt(x, y).some((f) => isField(data[i], data[i + 1], data[i + 2], f))) content += 1;
    }
  }
  const wrong = [];
  info.texts.forEach((t) => t.rects.forEach(([l, tp, r, b]) => {
    const buckets = new Map();
    for (let y = Math.floor(tp); y < Math.min(height, Math.ceil(b)); y++) {
      for (let x = Math.floor(l); x < Math.min(width, Math.ceil(r)); x++) {
        const i = (y * width + x) * 4;
        const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
        const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
        e.n += 1; e.r += data[i]; e.g += data[i + 1]; e.b += data[i + 2];
        buckets.set(key, e);
      }
    }
    const top1 = [...buckets.values()].sort((m, n) => n.n - m.n)[0];
    if (!top1) return;
    const bg = [top1.r / top1.n, top1.g / top1.n, top1.b / top1.n];
    const ratio = contrast(t.rgb, bg);
    if (ratio < MIN_TEXT_CONTRAST && !wrong.some((w) => w.el === t.el)) wrong.push({ el: t.el, ratio: Math.round(ratio * 100) / 100 });
  }));
  const boxArea = width * Math.max(1, height - top);
  const textArea = info.texts.reduce((n, t) => n + t.rects.reduce((m, [l, tp, r, b]) => m + Math.max(0, r - l) * Math.max(0, b - tp), 0), 0);
  return { content: total ? content / total : 0, text: Math.min(1, textArea / boxArea), wrong };
}

/* ---------- run ---------- */

const TIER_EXPR = `({ tier: document.documentElement.dataset.tier || '', locked: document.documentElement.hasAttribute('data-tier-lock') })`;

async function seekPage(api, page, w, h) {
  const { send } = api;
  await setViewport(send, w, h);
  await navigate(api, opts.base + page);
  const state = await evaluate(send, waitReadyExpr(HOOK, READY_TIMEOUT_MS));
  const hasSeek = await evaluate(send, `typeof window.${HOOK}?.seekCut === 'function'`);
  const { tier, locked } = await evaluate(send, TIER_EXPR);
  const base = { page, viewport: `${w}x${h}`, pass: pinTier || 'auto', tier };
  if (pinTier && tier !== pinTier) return { ...base, lockedOut: locked, skipped: `tier ${tier}${locked ? ' (locked by the page)' : ''}, not ${pinTier}`, frames: [] };
  if (!state.film || state.mode !== 'cut' || !hasSeek) return { ...base, skipped: `engine not seekable (mode ${state.mode}, seekCut ${hasSeek})`, frames: [] };
  const minContent = minContentFor(w, h);
  const frames = [];
  const pairs = [];
  for (let a = 0; a + 1 < state.count; a++) pairs.push([a, a + 1], [a + 1, a]);
  for (const [a, b] of pairs) {
    for (const p of PROGRESS) {
      const { ok, info } = await evaluate(send, SEEK(a, b, p));
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      await evaluate(send, FINISH);
      const png = Buffer.from(data, 'base64');
      const res = ok ? analyse(decodePng(png), info) : { content: 0, text: 0, wrong: [] };
      const reasons = [];
      if (!ok) reasons.push('seekCut returned null');
      if (ok && info.tier !== tier) reasons.push(`tier changed ${tier} -> ${info.tier}`);
      if (ok && res.content < minContent && res.text < minContent) {
        reasons.push(`empty field (${(res.content * 100).toFixed(1)}% content, ${(res.text * 100).toFixed(1)}% text, floor ${(minContent * 100).toFixed(2)}%)`);
      }
      res.wrong.forEach((x) => reasons.push(`wrong field: ${x.el} (contrast ${x.ratio})`));
      if (ok) info.overGlobe.forEach((x) => reasons.push(`text over globe: ${x.el} (${Math.round(x.share * 100)}% of its box)`));
      const name = `${String(a + 1).padStart(2, '0')}-${String(b + 1).padStart(2, '0')}-${Math.round(p * 100)}.png`;
      let file = null;
      if (reasons.length || opts.all) {
        file = join(opts.out, page.replace(/\.html$/, ''), `${w}x${h}${pinTier ? `-${pinTier}` : ''}`, name);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, png);
      }
      frames.push({ from: a, to: b, p, content: Math.round(res.content * 1000) / 1000, text: Math.round(res.text * 1000) / 1000, tier: info.tier, fields: `${info.base}${info.iris?.field ? `>${info.iris.field}` : ''}`, reasons, file });
    }
  }
  return { ...base, frames };
}

async function main() {
  const { api, close } = await launchChrome({ prefix: 'seek-', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  try {
    await interceptResponses(api, [filmHook(HOOK), tierPin]);
    await setMedia(api.send, {});
    const results = [];
    for (const pass of tierPasses) {
      pinTier = pass;
      for (const page of opts.pages) {
        for (const [w, h] of vps) {
          const r = await seekPage(api, page, w, h);
          process.stderr.write(`. [${r.pass}] ${page} @ ${w}x${h}: ${r.skipped || `tier ${r.tier}, ${r.frames.length} frames, ${r.frames.filter((f) => f.reasons.length).length} fail`}\n`);
          if (!r.lockedOut) results.push(r); // a page that locks another tier runs in that tier's pass
        }
      }
    }
    const bad = results.reduce((n, r) => n + r.frames.filter((f) => f.reasons.length).length, 0);
    const skipped = results.filter((r) => r.skipped).length;
    if (opts.json) console.log(JSON.stringify(results, null, 1));
    else {
      const lines = [`Seek test  ${new Date().toISOString()}  ${opts.base}  (frames at ${PROGRESS.join(', ')} of every cut, both directions; tiers ${tierPasses.map((t) => t || 'auto').join(', ')})`, ''];
      results.forEach((r) => {
        if (r.skipped) return void lines.push(`SKIP [${r.pass}] ${r.page} @ ${r.viewport}: ${r.skipped}`);
        const fails = r.frames.filter((f) => f.reasons.length);
        lines.push(`${fails.length ? 'FAIL' : 'ok  '} [${r.pass}] ${r.page} @ ${r.viewport} (tier ${r.tier}): ${r.frames.length} frames${fails.length ? `, ${fails.length} fail` : ''}`);
        fails.forEach((f) => lines.push(`  - #${f.from}->#${f.to} @${f.p} [${f.fields}]: ${f.reasons.join('; ')}${f.file ? `  (${f.file})` : ''}`));
      });
      lines.push('', bad ? `${bad} frames fail.` : skipped ? 'No failing frames, but some pages were skipped.' : 'No dead air: every frame passes.');
      console.log(lines.join('\n'));
    }
    process.exitCode = bad ? 1 : skipped ? 2 : 0;
  } finally {
    await close();
  }
}

main().catch((e) => { console.error(e); process.exitCode = 2; });
