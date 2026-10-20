/**
 * Compliance diff (DIRECTION §13 T4, §10): every baseline sentence and every [bracket] placeholder
 * must still be on the same page, or at a destination the §10 compliance-moves list names.
 *
 *   node tools/compliance-diff.mjs [baseUrl | --dist] [page.html ...] [--json]
 *
 *   baseUrl   a running site (default http://localhost:8000/); --dist builds nothing but serves
 *             dist/ itself with serve.mjs on a free port (run `npm run build` first)
 *
 * Inputs: plan/round5/compliance-baseline.json (stage 0 snapshot of site/) and
 * plan/round5/compliance-moves.json (§10 list). Each page is rendered in headless Chrome
 * (1440x900, engine ready, plus ?review=1 so hidden proof slots count) and its textContent read,
 * dialogs included, as the baseline was.
 *
 * Every baseline item (notice, hint, offer fine print, legal draft, fine print, FAQ question and
 * answer, keyword sentence) gets one status:
 *   ok        found word for word (whitespace normalised) on its page; a baseline text that the
 *             old letter roll doubled ("Apply for Community Apply for Community →") is compared
 *             with the repeat collapsed
 *   moved     a §10 move lists it, and the move's destination wording is found; a send hint
 *             ending "Nothing is sent until you tap send." is moved while the page holds C22's
 *             sentence (§10 ledger: once per page in C22)
 *   retired   §10 ledger spec-speak that §7 replaces (listed below); reported, not failed
 *   altered   not found, but a sentence on the page shares ≥ 60% of its words: wording changed
 * Owner-filled placeholders (baseline filledPlaceholders, plus [company email] while config.js
 * CONTACT_EMAIL is set) are compared with their value filled in, and count as present brackets.
 *   missing   not found at all
 * Also failed: a baseline [bracket] no longer on its page (except RETIRED_BRACKETS), and the new R5 line
 * "We only message from +1 (204) 869 2508" missing from a page (DIRECTION §6.4).
 * Exit code 1 on any altered, missing, bracket or new-line failure.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, filmHook, interceptResponses, launchChrome, navigate, parseArgs, setMedia, setViewport, sleep, waitReadyExpr } from './lib/cdp.mjs';
import { serveDir } from './lib/serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(ROOT, 'plan/round5/compliance-baseline.json');
const MOVES = join(ROOT, 'plan/round5/compliance-moves.json');
const CONFIG = join(ROOT, 'site/assets/js/config.js');
const HOOK = '__complianceFilm';
const READY_TIMEOUT_MS = 8000;
const SETTLE_MS = 1500;
const ALTERED_OVERLAP = 0.6;
const REQUIRED_NEW = ['We only message from +1 (204) 869 2508'];
/** DIRECTION §10 ledger: spec-speak "replaced by the copy in §7". */
const RETIRED = [
  'The rail does the disclosure', 'Each section says whether', 'named as hers and shown separately',
  'captions included when it arrives', 'Founder Video Coming Soon',
  'Each one says whether', // Home's R4 services-tile line: §7.1 deletes the tile grid it described
  'Behind the Website Is a Network of Independent Partners', // Story #network heading: §10 merges the scene into T4
];
/** Baseline brackets a page drops by a §7 decision (Home §7.1 slice-1 review; Services §7.2 S3-S5). */
const RETIRED_BRACKETS = {
  'index.html': ['[month]', '[$x]', '[to be confirmed]'],
  'services.html': ['[value]', '[Role 1]', '[Role 2]', '[Role 3]', '[Role 4]', '[Founder]'],
};
/** §10 ledger: "Nothing is sent until you tap send." ×12 → once per page in C22 (step 3). */
const SEND_NOTE = 'Nothing is sent until you tap send.';
const C22_SEND = 'Opens WhatsApp with your message written. Nothing is sent until you tap send.';
const REMOVED = /^\(removed\)$/;
const ITEM_KINDS = ['notice', 'hint', 'offerFine', 'legalDraft', 'fineprint'];

const cli = parseArgs();
const opts = { base: cli.base, dist: cli.has('dist'), pages: cli.pages, json: cli.has('json') };

const norm = (s) => String(s).replace(/[ \s]+/g, ' ').trim();
const words = (s) => norm(s).toLowerCase().match(/[\p{L}\p{N}[\]#]+/gu) || [];
/** The baseline was read while the Round 3 letter roll duplicated labels ("Apply Apply"): collapse repeats. */
const collapseRepeats = (s) => {
  let prev;
  let out = s;
  do { prev = out; out = out.replace(/(\S.{5,}?)\s*\1/g, '$1'); } while (out !== prev);
  return out;
};
const sentencesOf = (text) => norm(text).split(/(?<=[.!?])\s+(?=[A-Z[])/);

function overlap(a, b) {
  const wa = words(a);
  const wb = new Set(words(b));
  return wa.length ? wa.filter((w) => wb.has(w)).length / wa.length : 0;
}

/** Baseline items of a page as [{ kind, where, text }]. */
function itemsOf(page) {
  const out = [];
  ITEM_KINDS.forEach((kind) => (page[kind] || []).forEach((x) => out.push({ kind, where: x.where, text: norm(x.text) })));
  (page.details || []).forEach((x) => {
    out.push({ kind: 'faq-q', where: x.where, text: norm(x.question) });
    out.push({ kind: 'faq-a', where: x.where, text: norm(x.answer) });
  });
  (page.sentences || []).forEach((x) => out.push({ kind: 'sentence', where: x.where, text: norm(x.text) }));
  const seen = new Set();
  return out.filter((x) => x.text && !seen.has(`${x.kind}|${x.text}`) && seen.add(`${x.kind}|${x.text}`));
}

/** Owner-filled placeholders as [{ text, value }]; value null when the owner removed it. */
function filledPlaceholders(baseline) {
  const fills = (baseline.filledPlaceholders || []).map((x) => ({ text: norm(x.text), value: REMOVED.test(x.value) ? null : norm(x.value) }));
  const email = readFileSync(CONFIG, 'utf8').match(/export const CONTACT_EMAIL = '([^']*)'/)?.[1] || '';
  return email ? [...fills, { text: '[company email]', value: email }] : fills;
}

/** A baseline text with every owner-filled placeholder replaced by its value (removed ones kept). */
const fillIn = (text, fills) => fills.filter((x) => x.value !== null)
  .reduce((acc, x) => acc.split(x.text).join(x.value), text);

/** The §10 destinations for a baseline text: [{ page, text }] (empty when no move covers it). */
function destinations(moves, pageName, text) {
  const out = [];
  moves.forEach((m) => {
    const olds = [].concat(m.old?.text || []).map(norm);
    if (m.old?.page !== pageName || !olds.some((o) => o === text || o.includes(text))) return;
    [].concat(m.new || []).forEach((n) => {
      const page = n.page === 'all pages' ? pageName : n.page;
      const verbatim = !n.wording || /^verbatim/.test(n.wording);
      if (verbatim) out.push({ page, text });
      else if (text.includes(norm(n.wording)) || olds.some((o) => o.includes(norm(n.wording)))) out.push({ page, text: norm(n.wording) });
    });
  });
  return out;
}

const READ_TEXT = `(() => {
  const dialogs = [...document.querySelectorAll('dialog')].map((d) => d.textContent).join(' ');
  return document.body.textContent + ' ' + dialogs;
})()`;

async function pageText(api, base, page) {
  const texts = [];
  for (const q of ['', '?review=1']) {
    await navigate(api, `${base}${page}${q}`);
    await evaluate(api.send, waitReadyExpr(HOOK, READY_TIMEOUT_MS));
    await sleep(SETTLE_MS);
    texts.push(norm(await evaluate(api.send, READ_TEXT)));
  }
  return texts.join(' ‖ ');
}

function diffPage(name, baseline, moves, texts, fills) {
  const text = texts[name];
  const rows = itemsOf(baseline).map((item) => {
    if (text.includes(item.text)) return { ...item, status: 'ok' };
    const collapsed = collapseRepeats(item.text);
    if (collapsed !== item.text && text.includes(collapsed)) return { ...item, status: 'ok', note: 'letter-roll duplicate collapsed' };
    const filled = fillIn(item.text, fills);
    if (filled !== item.text && text.includes(filled)) return { ...item, status: 'ok', note: 'owner-filled placeholder' };
    const dest = destinations(moves, name, item.text);
    if (dest.length && dest.every((d) => (texts[d.page] || '').includes(d.text))) return { ...item, status: 'moved', to: dest.map((d) => `${d.page}: "${d.text.slice(0, 60)}"`) };
    if (item.text.endsWith(SEND_NOTE) && text.includes(C22_SEND)) return { ...item, status: 'moved', to: [`${name}: C22 "${C22_SEND}"`] };
    if (RETIRED.some((f) => item.text.includes(f))) return { ...item, status: 'retired' };
    const best = sentencesOf(text).map((s) => ({ s, r: overlap(filled, s) })).sort((a, b) => b.r - a.r)[0];
    if (best && best.r >= ALTERED_OVERLAP) return { ...item, status: 'altered', nearest: best.s.slice(0, 200), overlap: Math.round(best.r * 100) / 100 };
    return { ...item, status: 'missing', moveListed: dest.length > 0 };
  });
  const brackets = [...new Set(itemsOf(baseline).flatMap((x) => x.text.match(/\[[^\]]+\]/g) || [])
    .concat((baseline.ph || []).map((x) => norm(x.text)).filter((t) => /^\[[^\]]+\]$/.test(t))))];
  const retired = RETIRED_BRACKETS[name] || [];
  const filledHere = (b) => fills.some((x) => x.text === b && (x.value === null || text.includes(x.value)));
  const lostBrackets = brackets.filter((b) => !text.includes(b) && !retired.includes(b) && !filledHere(b));
  const newMissing = REQUIRED_NEW.filter((t) => !text.includes(t));
  return { page: name, rows, brackets: brackets.length, lostBrackets, newMissing };
}

async function main() {
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const moves = JSON.parse(readFileSync(MOVES, 'utf8')).moves || [];
  const fills = filledPlaceholders(baseline);
  const pages = opts.pages.length ? opts.pages : Object.keys(baseline.pages);
  const server = opts.dist ? await serveDir('dist') : null;
  const base = server ? server.base : opts.base;
  const { api, close } = await launchChrome({ prefix: 'compliance-' });
  try {
    await interceptResponses(api, [filmHook(HOOK)], { stayOn: new URL(base).origin });
    await setViewport(api.send, 1440, 900);
    await setMedia(api.send, {});
    const texts = {};
    // Moves can land on another page, so read every baseline page, not only the ones asked for.
    for (const p of Object.keys(baseline.pages)) {
      texts[p] = await pageText(api, base, p);
      process.stderr.write(`. read ${p}\n`);
    }
    const results = pages.map((p) => diffPage(p, baseline.pages[p], moves, texts, fills));
    let bad = 0;
    results.forEach((r) => { bad += r.rows.filter((x) => /altered|missing/.test(x.status)).length + r.lostBrackets.length + r.newMissing.length; });
    if (opts.json) console.log(JSON.stringify(results, null, 1));
    else {
      const lines = [`Compliance diff  ${new Date().toISOString()}  ${base}  (baseline ${baseline.generated})`, ''];
      results.forEach((r) => {
        const count = (s) => r.rows.filter((x) => x.status === s).length;
        const fails = r.rows.filter((x) => /altered|missing/.test(x.status));
        const n = fails.length + r.lostBrackets.length + r.newMissing.length;
        lines.push(`${n ? 'FAIL' : 'ok  '} ${r.page}: ${count('ok')} ok, ${count('moved')} moved, ${count('retired')} retired, ${count('altered')} altered, ${count('missing')} missing; brackets ${r.brackets - r.lostBrackets.length}/${r.brackets}`);
        fails.forEach((x) => {
          lines.push(`  - ${x.status} ${x.kind} (${x.where}): "${x.text}"${x.moveListed ? ' [a §10 move covers it: destination wording not found]' : ''}`);
          if (x.nearest) lines.push(`      nearest (${Math.round(x.overlap * 100)}% of words): "${x.nearest}"`);
        });
        r.rows.filter((x) => x.status === 'retired').forEach((x) => lines.push(`    retired (§10 spec-speak): "${x.text.slice(0, 90)}"`));
        if (r.lostBrackets.length) lines.push(`  - brackets gone: ${r.lostBrackets.join(' ')}`);
        r.newMissing.forEach((t) => lines.push(`  - new R5 line missing: "${t}"`));
      });
      lines.push('', bad ? `${bad} compliance failures (0 missing and 0 altered required).` : '0 missing, 0 altered: compliance copy intact.');
      console.log(lines.join('\n'));
    }
    process.exitCode = bad ? 1 : 0;
  } finally {
    await close();
    server?.close();
  }
}

main().catch((e) => { console.error(e); process.exitCode = 2; });
