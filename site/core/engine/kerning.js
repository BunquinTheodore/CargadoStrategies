/**
 * Kerning for split text, from a precomputed table (DIRECTION §4.1).
 *
 * Letters split into inline-block spans lose the font's kerning pairs ("You"
 * opens into "Y ou"). Round 5 splits headings by word, so the browser still
 * kerns inside each word, and this module only matters for markup that splits
 * letters on purpose (a [data-kern] element whose children are one letter each).
 * The pairs are measured at build time by tools/build-kerning.mjs into
 * assets/data/kern.json; nothing is measured at runtime (no canvas, no reads).
 *
 * kern.json (written by tools/build-kerning.mjs):
 *   { "unit": "em", "font": "\"Times New Roman\", Times, Tinos, serif", "weight": 400,
 *     "faces": { "normal": { "Yo": -0.0712, … }, "italic": { … } } }
 * Only the display face (Times, weight 400) is in the table; a face key is the CSS font-style.
 *
 *   await applyKerning(document);   // every [data-kern] in scope
 */

const TABLE_URL = new URL('../../assets/data/kern.json', import.meta.url);
const MIN_KERN_EM = 0.002; // ignore rounding noise
let tablePromise = null;

/** The kern table, fetched once; an empty table when it is missing. */
export function loadKernTable() {
  tablePromise ||= fetch(TABLE_URL)
    .then((res) => (res.ok ? res.json() : { faces: {} }))
    .catch(() => ({ faces: {} }));
  return tablePromise;
}

const DISPLAY_FAMILY = /times|tinos/i;

/** The table's pairs for an element's computed face, or null when it is not the display face. */
export function pairsFor(style, table) {
  if (!DISPLAY_FAMILY.test(style.fontFamily) || Number(style.fontWeight) !== (table?.weight ?? 400)) return null;
  return table?.faces?.[style.fontStyle === 'normal' ? 'normal' : 'italic'] || null;
}

/** Write each letter's left margin from the table. All styles are read before any write. */
export function kernLetters(words, table) {
  const jobs = Array.from(words).filter((w) => w.children.length > 1).map((word) => {
    const style = getComputedStyle(word);
    const pairs = pairsFor(style, table);
    const upper = style.textTransform === 'uppercase';
    return { word, pairs, upper };
  }).filter((job) => job.pairs);
  jobs.forEach(({ word, pairs, upper }) => {
    const letters = Array.from(word.children);
    for (let i = 1; i < letters.length; i += 1) {
      let pair = letters[i - 1].textContent + letters[i].textContent;
      if (upper) pair = pair.toUpperCase();
      const kern = pairs[pair];
      if (Number.isFinite(kern) && Math.abs(kern) >= MIN_KERN_EM) letters[i].style.marginLeft = `${kern}em`;
    }
  });
}

/** Apply the table to every [data-kern] element in `scope`, once fonts have loaded. */
export async function applyKerning(scope = document) {
  const words = scope.querySelectorAll('[data-kern]');
  if (!words.length) return;
  const [table] = await Promise.all([loadKernTable(), document.fonts?.ready]);
  kernLetters(words, table);
}
