/**
 * Flow mode: the film switched off (prefers-reduced-motion, missing CDN
 * libraries, or the safety timeout). Scenes are ordinary stacked sections in
 * normal document flow. The returned API matches the film API so page code
 * keeps working: build/progress never fire, scene/field/deeplink still do.
 */
import { fontsReady, sceneTitle, idFromHash } from './film-events.js';

const ACTIVE_BAND = '-45% 0px -50% 0px'; // a scene is "active" when it crosses the upper middle

export function createFlowFilm({ root, scenes, emitter }) {
  root.classList.remove('film');
  root.classList.add('rm');

  let active = -1;
  const state = { active: 0 };

  function setActive(index) {
    if (index === active) return;
    active = index;
    state.active = index;
    const el = scenes[index];
    const field = el.dataset.field || 'ink';
    root.dataset.field = field;
    root.dataset.scene = el.id;
    scenes.forEach((s, i) => s.classList.toggle('is-active', i === index));
    emitter.emit('scene', { index, id: el.id, el, field, title: sceneTitle(el), count: scenes.length });
    emitter.emit('field', { field });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const hit = entries.filter((e) => e.isIntersecting).pop();
      if (hit) setActive(scenes.indexOf(hit.target));
    },
    { rootMargin: ACTIVE_BAND },
  );
  scenes.forEach((s) => observer.observe(s));

  function resolve(target) {
    if (typeof target === 'number') return scenes[target] || null;
    const el = typeof target === 'string' ? document.getElementById(target.replace(/^#/, '')) : target;
    return el || null;
  }

  function goTo(target) {
    const el = resolve(target);
    if (!el) return false;
    el.scrollIntoView({ block: 'start' });
    return true;
  }

  function announceHash() {
    const id = idFromHash(location.hash);
    if (!id) return;
    const el = document.getElementById(id);
    emitter.emit('deeplink', { id, el, scene: el?.closest('.scene') || null });
  }

  const ready = fontsReady().then(() => {
    setActive(Math.max(0, active));
    // The browser's own #hash jump ran before the web fonts swapped in: land it again.
    resolve(idFromHash(location.hash))?.scrollIntoView({ block: 'start' });
    announceHash();
    window.addEventListener('hashchange', announceHash);
    emitter.emit('ready', { enabled: false });
  });

  const noop = () => {};
  return {
    enabled: false,
    ready,
    on: emitter.on,
    off: emitter.off,
    goTo,
    refresh: noop,
    stop: noop,
    start: noop,
    scrollToTime: noop,
    timeOf: () => null,
    blend: () => {
      const field = scenes[state.active]?.dataset.field || 'ink';
      return { from: field, to: field, mix: 1 };
    },
    get scenes() {
      return scenes;
    },
    get active() {
      return state.active;
    },
    time: 0,
    total: 0,
    progress: 0,
    velocity: 0,
    timeline: null,
    lenis: null,
  };
}
