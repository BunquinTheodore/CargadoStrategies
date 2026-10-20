/**
 * A `.rule[data-rule-fit]` runs to the end of the last line of the heading before it, instead of a
 * fixed length (owner, 2026-10-20). Measured with a Range over the heading's text, since CSS cannot
 * size a box to a wrapped line. Re-fits on resize, once fonts load, and when a scene lands (the
 * film lays out a scene for real only once it is on stage).
 */
function lastLineRight(heading) {
  const range = document.createRange();
  range.selectNodeContents(heading);
  const rects = [...range.getClientRects()].filter((r) => r.width > 0);
  if (!rects.length) return null;
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return Math.max(...rects.filter((r) => r.bottom > bottom - r.height / 2).map((r) => r.right));
}

function fit(rule) {
  const heading = rule.previousElementSibling;
  if (!heading) return;
  const right = lastLineRight(heading);
  const width = right === null ? 0 : right - rule.getBoundingClientRect().left;
  if (width > 0) rule.style.width = `${Math.round(width)}px`;
}

/** Fit every `.rule[data-rule-fit]` in `root`. Returns a cleanup function. */
export function fitRules({ film, root = document } = {}) {
  const rules = [...root.querySelectorAll('.rule[data-rule-fit]')];
  if (!rules.length) return () => {};
  const all = () => rules.forEach(fit);
  const observer = new ResizeObserver(all);
  rules.forEach((rule) => rule.previousElementSibling && observer.observe(rule.previousElementSibling));
  document.fonts?.ready.then(all);
  const off = film?.on?.('landed', all);
  return () => { observer.disconnect(); off?.(); };
}
