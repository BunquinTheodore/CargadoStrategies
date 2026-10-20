/**
 * Exclusive accordion (R4 shared.md §6.5, api.md §17.5).
 *
 *   exclusiveAccordion(root)   // → { destroy() }
 *
 * Every details.acc in `root` gets the same `name` (root.dataset.accName, or a
 * generated one), so the browser keeps one open at a time. Where details[name]
 * is not supported, a capture `toggle` listener closes the siblings instead.
 */

let counter = 0;
const nativeExclusive = () => typeof HTMLDetailsElement !== 'undefined' && 'name' in HTMLDetailsElement.prototype;

export function exclusiveAccordion(root) {
  if (!root) return { destroy() {} };
  counter += 1;
  const name = root.dataset.accName || `cs-acc-${counter}`;
  const items = () => Array.from(root.querySelectorAll('details.acc'));
  items().forEach((d) => d.setAttribute('name', name));
  if (nativeExclusive()) return { destroy() {} };

  const onToggle = (event) => {
    const opened = event.target;
    if (!(opened instanceof HTMLDetailsElement) || !opened.open || !opened.matches('details.acc')) return;
    items().forEach((d) => { if (d !== opened && d.open) d.open = false; });
  };
  root.addEventListener('toggle', onToggle, true);
  return { destroy: () => root.removeEventListener('toggle', onToggle, true) };
}
