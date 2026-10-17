/**
 * Become a partner (partners.html): partner WhatsApp links, tier
 * preselection, extra scrubbed tweens and the application form
 * (partners-form.js). Globe poses per screen shape (data-pose-md,
 * data-pose-sm) are picked by the shared globe.
 */
import { boot } from './main.js';
import { partnerQuestionMessage, waLink } from './whatsapp.js';
import { initPartnerForm, renderCategoryOptions, selectTier } from './partners-form.js';

const LAYOUT_SETTLE_MS = 450; // fallback when a content change causes no rebuild
const NARROW_QUERY = '(max-width: 759px)';
const WIDE_QUERY = '(min-width: 1100px)'; // two-column application layout
const DEPTH_QUERY = '(pointer: fine)'; // phones and touch screens stay 2D (ENGINE §11)
const BAR_LABEL = 'Ask About Partnering';

/* ---------- links ---------- */

function wirePartnerLinks(chrome) {
  const href = waLink(partnerQuestionMessage());
  document.querySelectorAll('a[data-wa-partner]').forEach((a) => {
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
  });
  chrome.setBar({ label: BAR_LABEL, href });
}

/** "Apply for …" links preselect the tier; a pop confirms a changed choice. */
function wireTierLinks(form, sound) {
  document.querySelectorAll('a[data-tier]').forEach((link) => {
    link.addEventListener('click', () => {
      if (selectTier(form, link.dataset.tier)) sound('pop');
    });
  });
}

/**
 * The whole tier panel picks its tier (pointer convenience; keyboard and
 * screen-reader users keep the real link). Selecting text never navigates.
 */
function wireTierCards() {
  document.querySelectorAll('.tier').forEach((card) => {
    const link = card.querySelector('a[data-tier]');
    if (!link) return;
    card.classList.add('is-pickable');
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button') || String(window.getSelection?.() || '')) return;
      link.click();
    });
  });
}

/* ---------- scrubbed scene tweens (film mode only) ---------- */

/** Drawn lines start part-way through the in-phase and are complete at the fully-in point. */
const DRAW_START = 0.35; // share of the in-phase
const DOT_DUR = 0.25; // share of the draw, per dot
const DOT_STAGGER = 0.36; // share of the draw between dots (3 dots end at 0.97)

function drawWindow(timing) {
  const at = timing.inStart + timing.inDur * DRAW_START;
  return { at, dur: Math.max(0.001, timing.focusTime - at) };
}

function howTweens({ tl, sceneEl, timing }) {
  const guide = sceneEl.querySelector('.how__guide');
  const { at, dur } = drawWindow(timing);
  tl.fromTo(guide, { scaleY: 0 }, { scaleY: 1, duration: dur, ease: 'none' }, at);
}

function arrangementTweens({ tl, sceneEl, timing }) {
  const vertical = window.matchMedia(NARROW_QUERY).matches;
  const line = sceneEl.querySelector('.flow__line');
  const dots = sceneEl.querySelectorAll('.flow__dot');
  const { at, dur } = drawWindow(timing);
  const axis = vertical ? 'scaleY' : 'scaleX';
  tl.fromTo(line, { [axis]: 0 }, { [axis]: 1, duration: dur, ease: 'power1.inOut' }, at);
  tl.fromTo(dots, { scale: 0 }, { scale: 1, duration: dur * DOT_DUR, ease: 'back.out(2)', stagger: dur * DOT_STAGGER }, at);
}

/**
 * The title only rises a little while held: drifting down ate the gap above the
 * lead (14px left at the fully-in point), and a bigger rise would touch the eyebrow.
 */
const TITLE_DRIFT_PX = -10;

function foundingTweens({ tl, sceneEl, timing }) {
  const title = sceneEl.querySelector('.founding__title');
  const ticket = sceneEl.querySelector('.ticket');
  const hold = Math.max(0.001, timing.outStart - timing.focusTime);
  tl.fromTo(title, { y: 0 }, { y: TITLE_DRIFT_PX, duration: hold, ease: 'none' }, timing.focusTime);
  tl.fromTo(ticket, { xPercent: 0 }, { xPercent: 3, duration: hold, ease: 'none', immediateRender: false }, timing.focusTime);
}

/**
 * While the long form pans up, the "what happens next" column counter-moves
 * so it stays in view (a scrubbed "sticky"), until it reaches the form's end.
 */
function applyTweens({ tl, sceneEl, timing }) {
  if (!timing.pan || !window.matchMedia(WIDE_QUERY).matches) return;
  const aside = sceneEl.querySelector('.apply__aside');
  const main = sceneEl.querySelector('.apply__main');
  const stick = Math.min(timing.pan, Math.max(0, main.offsetHeight - aside.offsetHeight));
  if (!stick) return;
  const duration = (timing.panEnd - timing.panStart) * (stick / timing.pan);
  tl.fromTo(aside, { y: 0 }, { y: stick, duration, ease: 'none', immediateRender: false }, timing.panStart);
}

const SCENE_TWEENS = {
  how: howTweens,
  arrangement: arrangementTweens,
  founding: foundingTweens,
  apply: applyTweens,
};

/**
 * 3D staging (fine pointers only): each key scene's layered block swings in
 * from an angle as the scene arrives, then drifts a few degrees while held, so
 * the depth reads even before the pointer tilts a card. `ownPerspective` is
 * false for elements that already carry the reveal's transformPerspective.
 */
const PERSPECTIVE_PX = 1100;
const STAGE_START = 0.3; // share of the in-phase
const DEPTH_STAGES = {
  how: { target: '.how__list', enter: { rotationY: 16 }, drift: { rotationY: -5 }, ownPerspective: true },
  arrangement: { target: '.flow', enter: { rotationX: 26 }, drift: { rotationX: -4 }, ownPerspective: true },
  tiers: { target: '.tiers', enter: { rotationY: -16 }, drift: { rotationY: 5 }, ownPerspective: true },
  founding: { target: '.ticket', enter: { rotationY: -22 }, drift: { rotationY: 9 }, ownPerspective: false },
  ask: { target: '.ask__panel', enter: { rotationX: 18 }, drift: { rotationX: -4 }, ownPerspective: true },
};

const restOf = (state) => Object.fromEntries(Object.keys(state).map((key) => [key, 0]));

function depthStage({ tl, sceneEl, timing }) {
  const stage = DEPTH_STAGES[sceneEl.id];
  const el = stage && sceneEl.querySelector(stage.target);
  if (!el || !window.matchMedia(DEPTH_QUERY).matches) return;
  const lens = stage.ownPerspective ? { transformPerspective: PERSPECTIVE_PX } : {};
  const rest = restOf(stage.enter);
  const at = timing.inStart + timing.inDur * STAGE_START;
  const enterDur = Math.max(0.001, timing.focusTime - at);
  tl.fromTo(el, { ...stage.enter, ...lens }, { ...rest, ...lens, duration: enterDur, ease: 'power2.out' }, at);
  const hold = Math.max(0.001, timing.outStart - timing.focusTime);
  tl.fromTo(el, rest, { ...stage.drift, duration: hold, ease: 'none', immediateRender: false }, timing.focusTime);
}

function addSceneTweens(payload) {
  SCENE_TWEENS[payload.sceneEl.id]?.(payload);
  depthStage(payload);
}

/* ---------- layout changes (errors, success state) ---------- */

/** Run fn once the film has rebuilt after a content change (or after a short fallback). */
function makeAfterLayout(film) {
  return (fn) => {
    let done = false;
    let off = () => {};
    const run = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      off();
      fn();
    };
    if (film.enabled) off = film.on('rebuilt', run);
    const timer = setTimeout(run, film.enabled ? LAYOUT_SETTLE_MS : 0);
  };
}

/**
 * Move focus to el. Film mode: the engine pans or moves the film to the
 * focused element. Flow mode: scroll it below the fixed header.
 */
function makeFocusTo(film) {
  const afterLayoutOf = makeAfterLayout(film);
  const focusNow = (el) => {
    el.focus({ preventScroll: true });
    if (!film.enabled) el.scrollIntoView({ block: 'start' });
  };
  /**
   * After a content change the rebuilt film keeps the old film time, which can
   * now sit past the shorter scene's hold (part-way into its exit: the aside's
   * eyebrow half-scrambled). Every target here (error summary, success title,
   * first field) is at the top of the form, so return to the scene's fully-in point.
   */
  const settleThenFocus = (el) => {
    focusNow(el);
    if (film.enabled) film.goTo(el); // after focus, so it wins over the engine's pan-to-focus scroll
  };
  return (el, { afterLayout = false } = {}) => (afterLayout ? afterLayoutOf(() => settleThenFocus(el)) : focusNow(el));
}

/* ---------- start ---------- */

const form = document.getElementById('apply-form');
const success = document.getElementById('apply-success');

renderCategoryOptions(form.elements.category);

const { film, chrome, sfx } = boot();
const sound = (name, options) => sfx?.play(name, options);
film.on('build', addSceneTweens);

wirePartnerLinks(chrome);
wireTierLinks(form, sound);
wireTierCards();
initPartnerForm({ form, success, focusTo: makeFocusTo(film), sound });
