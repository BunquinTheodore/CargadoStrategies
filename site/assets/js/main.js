/**
 * Page bootstrap (api.md §2). Each page's module does:
 *
 *   import { boot } from './main.js';
 *   const { film, chrome, sfx, tier, globe, sheet } = boot();
 *   film.on('cut', ({ toEl, tl, dir }) => { … append choreography at a label … });
 *
 * Order: the splash (a top-level await, only when the page has #splash, so
 * legal never downloads it) → the tier → the chrome (fills the
 * header and footer, so the film measures final content) → the film → the
 * WhatsApp sheet hub and the globe → the extras on idle → the View Transition
 * handlers. Register film listeners synchronously after boot(): the first
 * build waits for web fonts, so nothing is missed.
 *
 * The splash, sound, layers (stars), the cursor and the globe are dynamic
 * imports, so the legal bundle never contains them (DIRECTION §12). `sfx` is a
 * facade that is ready at once and forwards to sfx.js once it loads on idle.
 */
import { initTier, sampleTier } from './tier.js';
import { initChrome } from './chrome.js';
import { initFilm } from './film.js';
import { onIdle, finePointer } from './perf.js';
import { prefersReducedMotion } from './motion-pref.js';

const VT_KEY = 'cs-vt';
const SHEET_TRIGGER = '[data-wa-sheet], a[href^="#wa-sheet"]';
const SHEET_STEP = /^#wa-sheet\?(\w+)/;

const html = document.documentElement;
const fail = (what) => (err) => console.error(`main: ${what} failed to start`, err);

/** Run one optional module's init; a failure is reported and never stops the others. */
function startModule(loader, what, run) {
  return loader().then(run).catch(fail(what));
}

/* ---------- splash (2c) ---------- */

/**
 * Loaded only when the page has #splash (module scripts run after parsing, so
 * it is there), and awaited at the top level, so the page module evaluates
 * after it and boot() starts the splash before the chrome and the film, as a
 * static import would. Legal has no #splash and never downloads it.
 */
const splash = document.getElementById('splash')
  ? await import('./splash.js').catch((err) => { fail('the splash')(err); return null; })
  : null;

/** Run the splash; with no #splash (legal) or a failed load, mark it gone so nothing waits for it. */
function startSplash() {
  if (splash) splash.initSplash();
  else html.classList.add('splash-done'); // a failed load: the CSS fallback fades the splash itself
}

/* ---------- sound facade (2d, api.md §14) ---------- */

let sfxModule = null;
let sfxLoad = null;
const loadSfx = () => {
  sfxLoad ||= import('./sfx.js').then((mod) => { sfxModule = mod; return mod; });
  return sfxLoad;
};
const whenSfx = (fn) => (sfxModule ? fn(sfxModule.sfx) : loadSfx().then((mod) => fn(mod.sfx), fail('sound')));

/**
 * The sfx.js `sfx` API, usable before sfx.js has loaded. Until then nothing can
 * sound anyway (the audio context starts on the first gesture after initSfx),
 * so play() is a no-op and the getters report sfx.js's own start state; the
 * setters are applied once it loads.
 */
const sfx = Object.freeze({
  play: (...args) => sfxModule?.sfx.play(...args),
  has: (name) => sfxModule?.sfx.has(name) ?? false,
  setOn: (on) => whenSfx((real) => real.setOn(on)),
  isOn: () => sfxModule?.sfx.isOn() ?? true,
  setMuted: (muted) => whenSfx((real) => real.setMuted(muted)),
  isMuted: () => sfxModule?.sfx.isMuted() ?? false,
  get silent() { return sfxModule?.sfx.silent ?? false; },
  get state() { return sfxModule?.sfx.state ?? 'none'; },
  get context() { return sfxModule?.sfx.context ?? null; },
});

/* ---------- WhatsApp sheet hub (api.md §13) ---------- */

function sheetHub({ film }) {
  let sheet = null;
  let resolveSheet;
  const promise = new Promise((resolve) => { resolveSheet = resolve; });
  const load = () => {
    if (!sheet) {
      sheet = import('./wa-sheet.js').then(({ initWaSheet }) => initWaSheet({ film, sfx }));
      sheet.then(resolveSheet, fail('the WhatsApp sheet'));
    }
    return sheet;
  };

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const trigger = event.target.closest?.(SHEET_TRIGGER);
    if (!trigger || !document.getElementById('wa-sheet')) return; // no sheet on this page: the wa.me link works as it is
    event.preventDefault();
    const href = trigger.getAttribute('href') || '';
    const step = trigger.dataset.waSheet || href.match(SHEET_STEP)?.[1] || undefined;
    const { need, city, context } = trigger.dataset;
    load().then((api) => api.open({ need, city, context, step, trigger }), () => {
      if (trigger.href && !href.startsWith('#')) location.href = trigger.href; // the sheet never loaded: follow the link
    });
  });
  if (document.getElementById('wa-sheet')) onIdle(load);
  return promise;
}

/* ---------- View Transitions between pages (api.md §15) ---------- */

function viewTransitions() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;
    const r = link.getBoundingClientRect();
    try {
      sessionStorage.setItem(VT_KEY, JSON.stringify({
        x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: window.innerWidth, h: window.innerHeight,
      }));
    } catch {
      // storage blocked: the transition runs from the CSS default origin
    }
  }, true);

  window.addEventListener('pageswap', (event) => {
    if (html.classList.contains('rm') || prefersReducedMotion()) event.viewTransition?.skipTransition();
  });

  // The pagereveal half (read cs-vt, set --vt-x/--vt-y) fires before first
  // render, before this module runs, so it lives in the classic head script
  // (shared-requests, 2b). Here only a value it did not consume is dropped,
  // so a later navigation never opens from a stale origin.
  try {
    sessionStorage.removeItem(VT_KEY);
  } catch {
    // storage blocked: nothing was stored either
  }
}

/* ---------- boot ---------- */

export function boot({ page = document.body.dataset.page || 'home' } = {}) {
  startSplash(); // never awaited: the splash never waits for the film

  const tier = initTier();
  const chrome = initChrome({ page });
  const film = initFilm({ root: document });
  sampleTier(film.ready);
  chrome.onMenuToggle((open) => (open ? film.stop('menu') : film.start('menu')));

  const sheet = sheetHub({ film });
  const legal = page === 'legal';
  const globe = !legal && document.getElementById('globe')
    ? import('./dotglobe.js').then(({ initDotGlobe }) => initDotGlobe({ film, tier }), (err) => {
      fail('the globe')(err);
      return null;
    })
    : Promise.resolve(null);

  onIdle(() => {
    if (!legal) startModule(() => import('./layers.js'), 'layers', ({ initLayers }) => initLayers({ film, tier }));
    if (!legal) startModule(loadSfx, 'sound', ({ initSfx }) => initSfx({ film })); // §7.5: no sound on legal
    startModule(() => import('./interact.js'), 'interact', ({ initInteract }) => initInteract({ film }));
    if (!legal && tier !== 'C' && finePointer()) startModule(() => import('./cursor.js'), 'cursor', ({ initCursor }) => initCursor({ film }));
  });
  viewTransitions();
  return { film, chrome, sfx, tier, globe, sheet };
}
