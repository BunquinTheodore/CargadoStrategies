/**
 * The services orbit (spec §6.3): the Cargado logo in a centre circle, one circle per
 * main group round it. Shared by Home and Services (their Orbit.js sections mount it).
 *
 *   createOrbit(root, groups = ORBIT_GROUPS, { onNavigate, film, openLabel })
 *   → { show(slugOrIndex, { touch }), hide(), destroy() }
 *   orbitLogoIn({ tl, toEl })   adds the centre logo's arrival to the cut into the orbit's scene
 *
 * Markup (root = the scene's .orbit box):
 *   .orbit__centre               the header's logo image (.mark > img.mark__logo, owner 2026-10-30)
 *                                and the preview
 *   .orbit__ring                 holds one <a class="orbit__node" href data-slug> per group;
 *                                rendered from `groups` when the markup has none
 *   .orbit__preview              role="tooltip" card (created inside .orbit__centre if missing):
 *                                the group name, its one-line preview and, on touch, an Open link
 *
 * - Pointer hover or keyboard focus shows the preview over the centre (aria-describedby).
 * - Touch: the first tap on a node previews it (the card gains its own Open link); a second
 *   tap on the same node, or the Open link, follows it. Keyboard Enter and mouse click follow.
 * - Every node is its own Tab stop (they are ordinary links; film parking respected). Arrow
 *   keys also move focus round the ring, Home/End jump to the ends, Escape hides the preview.
 * - Following a link: `onNavigate({ group, href, node, event })` runs first; returning true
 *   means it was handled (the default is prevented). Otherwise the link behaves as a link, so a
 *   same-page #hash is cut to by the film's own click handler.
 * - Layout is CSS (core/design/orbit.css): each node carries --i, --n and --a (its angle).
 */
import { ORBIT_GROUPS } from '../../assets/js/config.js';
import { setTabStop } from './ui-tabs.js';

const FULL_TURN_DEG = 360;
const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];
const PREV_KEYS = ['ArrowLeft', 'ArrowUp'];
const TOUCH_TYPES = new Set(['touch', 'pen']);
const OPEN_LABEL = 'Open';
/** The centre logo's arrival on the cut, from the 'in' label (seconds). */
const LOGO_IN = Object.freeze({ scaleFrom: 0.94, duration: 0.6 });

/** On a cut into the orbit's scene, the centre logo fades and settles in. */
export function orbitLogoIn({ tl, toEl }) {
  const logo = toEl?.querySelector('.orbit .mark__logo');
  if (!tl || !logo) return;
  tl.fromTo(logo, { opacity: 0, scale: LOGO_IN.scaleFrom }, { opacity: 1, scale: 1, duration: LOGO_IN.duration, ease: 'expo.out' }, 'in');
}

/** The node index a key moves to round a ring of `count` (wrapping); -1 for any other key. */
export function ringIndex(index, key, count) {
  if (count <= 0) return -1;
  if (NEXT_KEYS.includes(key)) return (index + 1) % count;
  if (PREV_KEYS.includes(key)) return (index - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return -1;
}

/** A node's angle in degrees: the first at the top (0), then clockwise in even steps. */
export const nodeAngle = (index, count) => (count > 0 ? (FULL_TURN_DEG / count) * index : 0);

export const groupBySlug = (groups, slug) => groups.find((g) => g.slug === slug);

let uid = 0;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** One <a class="orbit__node"> for a group (when the scene markup has none). */
function renderNode(group) {
  const node = el('a', 'orbit__node');
  node.href = group.href;
  node.dataset.slug = group.slug;
  node.append(el('span', 'orbit__label', group.name));
  return node;
}

/** The preview card: name, one line, and the touch-only Open link. */
function renderPreview(openLabel) {
  uid += 1;
  const card = el('div', 'orbit__preview');
  card.id = `orbit-preview-${uid}`;
  card.setAttribute('role', 'tooltip');
  card.hidden = true;
  const open = el('a', 'orbit__open', openLabel);
  open.hidden = true;
  card.append(el('p', 'orbit__preview-name'), el('p', 'orbit__preview-text'), open);
  return card;
}

function placeNodes(nodes) {
  nodes.forEach((node, i) => {
    node.style.setProperty('--i', String(i));
    node.style.setProperty('--n', String(nodes.length));
    node.style.setProperty('--a', `${nodeAngle(i, nodes.length)}deg`);
  });
}

export function createOrbit(root, groups = ORBIT_GROUPS, { onNavigate, film, openLabel = OPEN_LABEL } = {}) {
  const ring = root.querySelector('.orbit__ring') || root;
  if (!ring.querySelector('.orbit__node')) ring.append(...groups.map(renderNode));
  const nodes = Array.from(ring.querySelectorAll('.orbit__node'));
  const centre = root.querySelector('.orbit__centre') || root;
  const preview = root.querySelector('.orbit__preview') || centre.appendChild(renderPreview(openLabel));
  if (!preview.id) { uid += 1; preview.id = `orbit-preview-${uid}`; }
  const nameEl = preview.querySelector('.orbit__preview-name');
  const textEl = preview.querySelector('.orbit__preview-text');
  const openEl = preview.querySelector('.orbit__open');
  const state = { shown: -1, armed: -1, pointer: 'mouse' };

  const groupOf = (node) => groupBySlug(groups, node?.dataset.slug);
  const indexOf = (slugOrIndex) => (typeof slugOrIndex === 'number' ? slugOrIndex : nodes.findIndex((n) => n.dataset.slug === slugOrIndex));
  const nodeOf = (event) => event.target.closest?.('.orbit__node');

  function show(slugOrIndex, { touch = false } = {}) {
    const index = indexOf(slugOrIndex);
    const node = nodes[index];
    const group = groupOf(node);
    if (!node || !group) return;
    if (state.shown >= 0 && state.shown !== index) nodes[state.shown].removeAttribute('aria-describedby');
    if (nameEl) nameEl.textContent = group.name;
    if (textEl) textEl.textContent = group.preview || '';
    preview.dataset.slug = node.dataset.slug || '';   // orbit.css draws the group's icon above the name
    if (openEl) {
      openEl.href = node.href;
      openEl.hidden = !touch;
      openEl.setAttribute('aria-label', `${openLabel} ${group.name}`);
    }
    node.setAttribute('aria-describedby', preview.id);
    nodes.forEach((n, i) => n.classList.toggle('is-current', i === index));
    preview.hidden = false;
    root.classList.add('is-previewing');
    root.classList.toggle('is-armed', touch);
    state.shown = index;
    state.armed = touch ? index : -1;
  }

  function hide() {
    if (state.shown < 0) return;
    nodes[state.shown]?.removeAttribute('aria-describedby');
    nodes.forEach((n) => n.classList.remove('is-current'));
    preview.hidden = true;
    root.classList.remove('is-previewing', 'is-armed');
    state.shown = -1;
    state.armed = -1;
  }

  /** Follow a node: the caller's hook first, then the link as a link. */
  function follow(index, event) {
    const node = nodes[index];
    const handled = onNavigate?.({ group: groupOf(node), href: node?.href, node, event }) === true;
    if (handled) event.preventDefault();
  }

  function onPointerDown(event) {
    state.pointer = event.pointerType || 'mouse';
    if (state.armed >= 0 && !root.contains(event.target)) hide();
  }

  function onPointerOver(event) {
    if (TOUCH_TYPES.has(event.pointerType)) return;
    const node = nodeOf(event);
    if (node && nodes.includes(node)) show(nodes.indexOf(node));
  }

  function onPointerOut(event) {
    if (TOUCH_TYPES.has(event.pointerType) || state.armed >= 0) return;
    const to = event.relatedTarget?.closest?.('.orbit__node');
    if (to && nodes.includes(to)) return;
    const focused = nodes.indexOf(document.activeElement);
    if (focused >= 0) show(focused); else hide();
  }

  function onFocusIn(event) {
    const node = nodeOf(event);
    if (!node || !nodes.includes(node)) return;
    const index = nodes.indexOf(node);
    if (state.armed !== index) show(index);
  }

  function onFocusOut(event) {
    if (!root.contains(event.relatedTarget)) hide();
  }

  function onClick(event) {
    if (openEl && event.target.closest?.('.orbit__open')) {
      if (state.armed >= 0) follow(state.armed, event);
      return;
    }
    const node = nodeOf(event);
    if (!node || !nodes.includes(node)) return;
    const index = nodes.indexOf(node);
    const touch = event.detail !== 0 && TOUCH_TYPES.has(state.pointer);
    state.pointer = 'mouse';
    if (touch && state.armed !== index) {
      event.preventDefault();
      show(index, { touch: true });
      return;
    }
    follow(index, event);
  }

  function onKeydown(event) {
    if (event.key === 'Escape' && state.shown >= 0) { hide(); return; }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const at = nodes.indexOf(nodeOf(event));
    if (at < 0) return;
    const to = ringIndex(at, event.key, nodes.length);
    if (to < 0) return;
    event.preventDefault();
    nodes[to].focus({ preventScroll: true });
  }

  placeNodes(nodes);
  nodes.forEach((node) => setTabStop(node, '0', film));
  const listeners = [
    [document, 'pointerdown', onPointerDown, { capture: true, passive: true }],
    [root, 'pointerover', onPointerOver],
    [root, 'pointerout', onPointerOut],
    [root, 'focusin', onFocusIn],
    [root, 'focusout', onFocusOut],
    [root, 'click', onClick],
    [root, 'keydown', onKeydown],
  ];
  listeners.forEach(([target, name, fn, opts]) => target.addEventListener(name, fn, opts));

  return {
    show,
    hide,
    destroy() {
      hide();
      listeners.forEach(([target, name, fn, opts]) => target.removeEventListener(name, fn, opts));
    },
  };
}
