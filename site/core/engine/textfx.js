/**
 * Text effects, Round 5 (DIRECTION §4.1, §4.4): word reveals only.
 * [data-reveal="words"] (aliases "lines" and "chars") masks each word and lets
 * it rise in the cut's in group (film-split.js splits, film-reveals.js plays).
 * The decode scramble, the hover letter-roll and per-character splits are
 * gone. The text-link underline draw is pure CSS (base.css C21).
 */

/** Plain text of an element, ignoring any aria-hidden visual copy (scene titles etc.). */
export function readableText(el) {
  const copy = el.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
  return copy.textContent.trim().replace(/\s+/g, ' ');
}

const WORD_KINDS = new Set(['words', 'lines', 'chars']);

/** Round 4 contract, kept for film-reveals.js: "chars" plays as "lines". */
export function autoKind(el) {
  const asked = el.dataset.reveal;
  return asked === 'chars' ? 'lines' : asked;
}

/** Round 5 name: 'words' for every word-reveal alias, otherwise the hook as written. */
export function revealKind(el) {
  const asked = el.dataset.reveal;
  return WORD_KINDS.has(asked) ? 'words' : asked;
}
