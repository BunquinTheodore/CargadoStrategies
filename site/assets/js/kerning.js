/**
 * Kerning for split text.
 *
 * Letters split into inline-block spans (textfx.js heading characters) can
 * each move on their own, but the browser then shapes
 * every letter alone and the font's kerning pairs are lost: "You" opens into
 * "Y ou". kernWords() puts the kerning back as a margin on each letter after
 * the first in a word: the font's own kern for that pair, measured once on a
 * canvas and stored in em, so it holds at every font size and needs no
 * re-measure on resize.
 */

const MEASURE_PX = 100; // canvas font size; kerns are stored as a share of it (em)
const MIN_KERN_EM = 0.002; // ignore rounding noise
const kernCache = new Map();
let canvasContext;

function context() {
  if (canvasContext === undefined) {
    canvasContext = document.createElement('canvas').getContext('2d');
    if (canvasContext && 'fontKerning' in canvasContext) canvasContext.fontKerning = 'normal';
  }
  return canvasContext;
}

function fontOf(el) {
  const style = getComputedStyle(el);
  return {
    font: `${style.fontStyle} ${style.fontWeight} ${MEASURE_PX}px ${style.fontFamily}`,
    upper: style.textTransform === 'uppercase',
    lower: style.textTransform === 'lowercase',
  };
}

function cased(text, { upper, lower }) {
  if (upper) return text.toUpperCase();
  return lower ? text.toLowerCase() : text;
}

/** Canvas width of `text` in `font` (ctx.font already set), cached. */
function widthOf(ctx, font, text) {
  const key = `${font}|${text}`;
  if (!kernCache.has(key)) kernCache.set(key, ctx.measureText(text).width);
  return kernCache.get(key);
}

/** The kern between two letters in `font`, in em (negative = tighter). */
function kernEm(ctx, font, pair) {
  const [a, b] = Array.from(pair);
  return (widthOf(ctx, font, pair) - widthOf(ctx, font, a) - widthOf(ctx, font, b)) / MEASURE_PX;
}

/** The margin each letter after the first needs, as [span, value] pairs (reads only). */
function kernsOf(ctx, word, face) {
  const letters = Array.from(word.children);
  const kerns = [];
  ctx.font = face.font;
  for (let i = 1; i < letters.length; i += 1) {
    const kern = kernEm(ctx, face.font, cased(letters[i - 1].textContent + letters[i].textContent, face));
    if (Math.abs(kern) >= MIN_KERN_EM) kerns.push([letters[i], `${kern.toFixed(4)}em`]);
  }
  return kerns;
}

/**
 * Restore the font's kerning inside each word of single-letter spans. Run it
 * once the web fonts have loaded (a fallback face would give other pairs).
 * All styles are read first and all margins written after, so a batch of
 * words costs one style recalculation, not one per word.
 */
export function kernWords(words) {
  const ctx = context();
  if (!ctx) return;
  const list = Array.from(words).filter((word) => word.children.length > 1);
  const byParent = new Map(); // words share their parent's font: one style read per parent
  const faces = list.map((word) => {
    const key = word.parentElement || word;
    if (!byParent.has(key)) byParent.set(key, fontOf(word));
    return byParent.get(key);
  });
  const kerns = list.flatMap((word, i) => kernsOf(ctx, word, faces[i]));
  kerns.forEach(([letter, margin]) => { letter.style.marginLeft = margin; });
}
