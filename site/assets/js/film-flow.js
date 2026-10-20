/**
 * Flow mode: reduced motion (the OS or the footer switch), no GSAP, or the
 * head safety timer fired. Scenes are ordinary 100svh sections in document
 * flow, each painting its own --field-bg, with native mandatory snap (R4 B2).
 * The returned object has the film's shape so page code keeps working: 'cut'
 * and 'build' never fire; 'scene', 'field', 'landed', 'deeplink' and 'ready'
 * do. The in group gets a 200 ms opacity fade when its section is 60% visible,
 * and nothing else moves.
 */
import { fontsReady, sceneTitle, hashTargetOf } from './film-events.js';
import { createLinks, isSheetHash } from './film-links.js';
import { prepareInGroup, flowTargets } from './film-reveals.js';
import { DUR } from './motion-tokens.js';
import { noteActivity } from './perf.js';

const ACTIVE_BAND = '-45% 0px -50% 0px'; // a scene is current while it crosses the upper middle
const FADE_AT = 0.6;
const FADE_MS = DUR.fadeRm * 1000;
const html = document.documentElement;

export function createFlowFilm({ scenes, emitter }) {
  const links = createLinks(scenes);
  const stops = new Map();
  let current = -1;

  function setCurrent(index, cause) {
    if (index === current || index < 0) return;
    const from = current;
    current = index;
    const el = scenes[index];
    const field = el.dataset.field || 'ink';
    const fromField = from >= 0 ? scenes[from].dataset.field || 'ink' : null;
    html.dataset.field = field;
    html.dataset.scene = el.id;
    html.setAttribute('data-hdr-field', field);
    scenes.forEach((s, i) => s.classList.toggle('is-active', i === index));
    emitter.emit('scene', { index, id: el.id, el, field, title: sceneTitle(el), count: scenes.length });
    if (field !== fromField) emitter.emit('field', { field, from: fromField });
    noteActivity();
    emitter.emit('landed', { index, id: el.id, el, field, from, cause, mode: 'flow' });
  }

  const active = new IntersectionObserver((entries) => {
    const hit = entries.filter((e) => e.isIntersecting).pop();
    if (hit) setCurrent(scenes.indexOf(hit.target), 'scroll');
  }, { rootMargin: ACTIVE_BAND });

  /* In-group fade: hidden only once the film knows the section is off screen, so nothing is ever stuck hidden. */
  const faded = new WeakSet();
  const targetsOf = new Map();
  const fader = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!targetsOf.has(entry.target)) targetsOf.set(entry.target, flowTargets(prepareInGroup(entry.target)));
      const targets = targetsOf.get(entry.target);
      if (entry.intersectionRatio >= FADE_AT) {
        if (!faded.has(entry.target)) return;
        faded.delete(entry.target);
        targets.forEach((el) => {
          el.style.opacity = '';
          el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'linear' });
        });
      } else if (!entry.isIntersecting && !faded.has(entry.target)) {
        faded.add(entry.target);
        targets.forEach((el) => { el.style.opacity = '0'; });
      }
    });
  }, { threshold: [0, FADE_AT] });

  function scrollTo(index, cause) {
    if (index < 0) return false;
    scenes[index].scrollIntoView({ block: 'start' });
    setCurrent(index, cause); // fit-audit reads film.current right after goTo
    return true;
  }

  function goTo(target, { cause = 'goto' } = {}) {
    return scrollTo(links.indexOf(target), cause);
  }

  function handleHash(hash) {
    const link = links.parse(hash);
    if (!link) return;
    emitter.emit('deeplink', { id: link.id, alias: link.alias, el: link.el, scene: link.scene, open: link.open });
    link.el.scrollIntoView({ block: 'start' });
    setCurrent(link.index, 'hash');
    links.openFor(link, api);
  }

  function onClick(event) {
    const cutter = event.target.closest?.('[data-cut]');
    if (cutter && !event.defaultPrevented) {
      const want = cutter.dataset.cut;
      const target = want === 'next' ? current + 1 : want === 'prev' ? current - 1 : want;
      if (links.indexOf(target) >= 0) {
        event.preventDefault();
        goTo(target, { cause: 'click' });
      }
      return;
    }
    const hash = hashTargetOf(event);
    if (!hash || isSheetHash(hash) || !links.parse(hash)) return;
    event.preventDefault();
    history.pushState(null, '', hash);
    handleHash(hash);
  }

  function stop(token = 'default') {
    stops.set(token, (stops.get(token) || 0) + 1);
    html.classList.add('film-stopped');
  }

  function start(token = 'default') {
    const n = (stops.get(token) || 0) - 1;
    if (n > 0) stops.set(token, n);
    else stops.delete(token);
    if (!stops.size) html.classList.remove('film-stopped');
  }

  const ready = fontsReady().then(() => {
    scenes.forEach((s) => { active.observe(s); fader.observe(s); });
    // The browser's own #hash jump ran before the web fonts swapped in: land it again.
    const link = links.parse(location.hash);
    if (link) {
      emitter.emit('deeplink', { id: link.id, alias: link.alias, el: link.el, scene: link.scene, open: link.open });
      link.el.scrollIntoView({ block: 'start' });
    }
    setCurrent(link ? link.index : 0, 'load');
    if (link) links.openFor(link, api);
    window.addEventListener('hashchange', () => handleHash(location.hash));
    window.addEventListener('popstate', () => handleHash(location.hash));
    document.addEventListener('click', onClick);
    html.classList.add('film-ready');
    emitter.emit('ready', { mode: 'flow' });
  });

  const noop = () => {};
  const api = {
    mode: 'flow',
    enabled: false,
    ready,
    get scenes() { return scenes; },
    get current() { return Math.max(0, current); },
    get active() { return Math.max(0, current); },
    get currentScene() { return scenes[Math.max(0, current)]; },
    isCutting: false,
    on: emitter.on,
    off: emitter.off,
    cut: (to, opts = {}) => goTo(to, opts),
    next: () => current + 1 < scenes.length && scrollTo(current + 1, 'step'),
    prev: () => current > 0 && scrollTo(current - 1, 'step'),
    goTo,
    seekCut: () => null,
    refreshReach: noop,
    isParked: () => false,
    stop,
    start,
    irisTo: noop,
    refresh: noop,
    lenis: null,
    // Round 4 compatibility, removed in stage 6 (api.md §19).
    snap: { enabled: false, get current() { return Math.max(0, current); }, next: () => api.next(), prev: () => api.prev(), to: (i) => goTo(i), block: stop, unblock: start },
    scrollToTime: noop,
    timeOf: () => null,
    blend: () => {
      const field = scenes[Math.max(0, current)]?.dataset.field || 'ink';
      return { from: field, to: field, mix: 1 };
    },
    time: 0,
    total: 0,
    progress: 0,
    velocity: 0,
    timeline: null,
    timings: [],
  };
  return api;
}
