/**
 * Line splitter for [data-reveal="lines"] (no paid plugin).
 *
 * Every word is wrapped in a mask (overflow hidden) so it can slide up from
 * below its own baseline. Words are then grouped into visual lines by their
 * vertical position so a line moves as one unit. Nested inline elements
 * (links, <em>, .ph tokens) are preserved because only text nodes are wrapped.
 */

const SPLIT_FLAG = 'split';
const LINE_TOLERANCE_PX = 2;
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
    if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
  }
  return nodes;
}

/** Wrap words once; safe to call repeatedly. */
export function splitWords(el) {
  if (el.dataset[SPLIT_FLAG]) return;
  textNodesOf(el).forEach(splitTextNode);
  el.dataset[SPLIT_FLAG] = '1';
}

/**
 * Group the element's words into lines (arrays of .rv-word elements) using
 * their current layout. Call after fonts have loaded and on every rebuild.
 */
export function groupLines(el) {
  const lines = [];
  let lastTop = -Infinity;
  el.querySelectorAll('.rv-mask').forEach((mask) => {
    const top = mask.getBoundingClientRect().top;
    if (top > lastTop + LINE_TOLERANCE_PX) {
      lines.push([]);
      lastTop = top;
    }
    lines[lines.length - 1].push(mask.firstElementChild);
  });
  return lines;
}
