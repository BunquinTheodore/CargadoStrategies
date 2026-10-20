/**
 * build-splits (DIRECTION §4.1, api.md §6): writes the word masks into built HTML, so the
 * page never splits headings at runtime. For every element with data-reveal="words" (or its
 * aliases "lines" and "chars", which play as words) that is not already split, each word of
 * each text node becomes
 *   <span class="rv-mask"><span class="rv-word">word</span></span>
 * and the element gets data-split="1". Whitespace between words is kept as is, nested inline
 * markup (em, a, .ph, .stop, .visually-hidden) is kept, and only ordinary whitespace breaks
 * words (&nbsp; keeps two words together): exactly what site/assets/js/film-split.js does in
 * the browser, so the dev server (runtime split) and dist (build split) render the same.
 *
 *   node tools/build-splits.mjs [dir=dist]     (build.mjs calls splitHtml() itself)
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OPEN = /<([a-z][a-z0-9]*)\b([^>]*\sdata-reveal="(?:words|lines|chars)"[^>]*)>/gi;
const WHITESPACE = /([ \t\n\r]+)/;
const TAG = /(<!--[\s\S]*?-->|<[^>]+>)/;

/** Index just past the tag that closes the `name` element whose content starts at `from`. */
function closeOf(html, name, from) {
  const re = new RegExp(`<(/?)${name}\\b[^>]*>`, 'gi');
  re.lastIndex = from;
  let depth = 1;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return { start: m.index, end: m.index + m[0].length };
  }
  throw new Error(`unclosed <${name}> with data-reveal at ${from}`);
}

const wrapWords = (text) => text.split(WHITESPACE).map((part) => (
  !part || WHITESPACE.test(part) ? part : `<span class="rv-mask"><span class="rv-word">${part}</span></span>`
)).join('');

/** Split the inner HTML of one element: text tokens only, tags untouched. */
const splitInner = (inner) => inner.split(TAG).map((tok, k) => (k % 2 || !tok.trim() ? tok : wrapWords(tok))).join('');

/** The id of the section.scene that contains offset `at`, or ''. */
function sceneAt(html, at) {
  const before = html.slice(0, at);
  const k = before.lastIndexOf('<section');
  if (k < 0) return '';
  return before.slice(k).match(/^<section\b[^>]*\bid="([^"]+)"/)?.[1] || '';
}

/**
 * Pre-split every data-reveal="words|lines|chars" element in `html`.
 * Returns { html, count, warnings } (a warning when a scene has more than one split heading,
 * DIRECTION §4.1: only one display heading per scene is split).
 */
export function splitHtml(html) {
  let out = html;
  let count = 0;
  const perScene = new Map();
  OPEN.lastIndex = 0;
  for (let m = OPEN.exec(out); m; m = OPEN.exec(out)) {
    const [whole, name, attrs] = m;
    if (/\sdata-split=/.test(attrs)) continue;
    const contentStart = m.index + whole.length;
    const { start: closeStart } = closeOf(out, name, contentStart);
    const opened = `<${name}${attrs} data-split="1">`;
    const inner = splitInner(out.slice(contentStart, closeStart));
    out = `${out.slice(0, m.index)}${opened}${inner}${out.slice(closeStart)}`;
    OPEN.lastIndex = m.index + opened.length + inner.length;
    count += 1;
    const id = sceneAt(out, m.index);
    perScene.set(id, (perScene.get(id) || 0) + 1);
  }
  const warnings = [...perScene].filter(([id, n]) => id && n > 1).map(([id, n]) => `#${id} has ${n} split headings (DIRECTION §4.1: one per scene)`);
  return { html: out, count, warnings };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = resolve(dirname(fileURLToPath(import.meta.url)), '..', process.argv[2] || 'dist');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.html'));
  for (const f of files) {
    const { html, count, warnings } = splitHtml(await readFile(join(dir, f), 'utf8'));
    await writeFile(join(dir, f), html);
    process.stdout.write(`${f}: ${count} split${warnings.length ? `; ${warnings.join('; ')}` : ''}\n`);
  }
}
