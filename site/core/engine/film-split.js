/**
 * Word splitter for [data-reveal="words"] (alias "lines"; "chars" plays as
 * words). No paid plugin.
 *
 * Every word is wrapped in a mask so it can rise from below its own baseline:
 *   <span class="rv-mask"><span class="rv-word">word</span></span>
 * and the element gets data-split="1". tools/build-splits.mjs (2e) writes the
 * same markup into dist at build time, so there this runs as a no-op. Nested
 * inline elements (links, <em>, .ph tokens) are kept because only text nodes
 * are wrapped. Text inside the full stop (.stop) is never wrapped: the stop
 * pops on its own (film-reveals.js).
 */

const SPLIT_FLAG = 'split';
const NO_SPLIT = '.stop';
/** Break only on ordinary whitespace so &nbsp; keeps words together. */
const WHITESPACE = /([ \t\n\r]+)/;

function wrapWord(word) {
  const mask = document.createElement('span');
  mask.className = 'rv-mask';
  const inner = document.createElement('span');
  inner.className = 'rv-word';
  inner.textContent = word;
  mask.appendChild(inner);
  return mask;
}

function splitTextNode(node) {
  const parts = node.textContent.split(WHITESPACE);
  const frag = document.createDocumentFragment();
  parts.forEach((part) => {
    if (!part) return;
    frag.appendChild(WHITESPACE.test(part) ? document.createTextNode(part) : wrapWord(part));
  });
  node.replaceWith(frag);
}

function textNodesOf(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.textContent.trim() && !node.parentElement.closest(NO_SPLIT)) nodes.push(node);
  }
  return nodes;
}

/** Wrap words once (safe to call again); returns the .rv-word elements in reading order. */
export function splitWords(el) {
  if (!el.dataset[SPLIT_FLAG]) {
    textNodesOf(el).forEach(splitTextNode);
    el.dataset[SPLIT_FLAG] = '1';
  }
  return Array.from(el.querySelectorAll('.rv-word'));
}
