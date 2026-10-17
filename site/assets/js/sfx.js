/**
 * Sound effects, synthesized with the Web Audio API (no audio files).
 *
 *   import { sfx } from './sfx.js';
 *   sfx.play('success');                 // names: see VOICES below
 *   document.dispatchEvent(new CustomEvent('cs:sfx', { detail: 'success' }));  // same, without the import
 *
 * Everything goes through one master gain and a limiter, every voice has a
 * minimum gap so sounds never stack into noise, and nothing plays while muted.
 * Browsers only allow audio after a gesture: the context is created on the
 * first pointer, key or touch activation. The speaker toggles ([data-sound-toggle],
 * rendered by chrome.js) store the choice in localStorage (default: on).
 * If Web Audio is missing or fails, every call is a silent no-op.
 */

const STORAGE_KEY = 'cs-sound';
const MUTED_VALUE = 'off';
const MASTER_GAIN = 0.25;
const LIMITER = { threshold: -8, knee: 6, ratio: 16, attack: 0.003, release: 0.12 };
const SCROLL_TICK_PX = 100; // one tick per this much scroll through the film
const MIN_GAP_MS = { tick: 40, hover: 70, click: 40, pop: 60, whoosh: 280, tone: 320, error: 300, success: 500, splash: 1500 };
const FIELD_ROOT_HZ = { ink: 220, gold: 293.66, bone: 329.63 }; // A3, D4, E4
const ERROR_NOTES = [[349.23, 0], [261.63, 0.11]]; // F4 then C4: a soft fall, "look again"
const NOISE_SECONDS = 1;
const SILENT = 0.0001;
const TOGGLE = '[data-sound-toggle]';
const INTERACTIVE = 'a[href], button, summary, label.chip, .chip, [role="button"], [role="tab"], input[type="checkbox"], input[type="radio"], select';
const POP_TARGETS = 'input[type="checkbox"], input[type="radio"], [aria-pressed], summary, [role="tab"], select';
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'keydown', 'touchend', 'click'];
const LABEL_ON = 'Sound effects on. Press to mute.';
const LABEL_OFF = 'Sound effects muted. Press to turn them on.';

const state = { ctx: null, master: null, noise: null, muted: readMuted(), last: new Map(), resuming: null };

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === MUTED_VALUE;
  } catch {
    return false;
  }
}

function writeMuted(muted) {
  try {
    if (muted) localStorage.setItem(STORAGE_KEY, MUTED_VALUE);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
}

/* ---------- context ---------- */

function noiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * NOISE_SECONDS), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 1;
  for (let i = 0; i < data.length; i += 1) {
    seed = (seed * 16807) % 2147483647; // deterministic white noise
    data[i] = (seed / 2147483647) * 2 - 1;
  }
  return buffer;
}

function createContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const limiter = ctx.createDynamicsCompressor();
  Object.entries(LIMITER).forEach(([key, value]) => { limiter[key].value = value; });
  const master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(limiter);
  limiter.connect(ctx.destination);
  Object.assign(state, { ctx, master, noise: noiseBuffer(ctx) });
  return ctx;
}

/** A gesture may start audio only while user activation is live (avoids the autoplay warning). */
const activationLive = () => !navigator.userActivation || navigator.userActivation.isActive;

function unlock() {
  if (!activationLive()) return false;
  try {
    const ctx = state.ctx || createContext();
    if (!ctx) return true; // no Web Audio: stop listening
    if (ctx.state !== 'running') state.resuming = ctx.resume().catch(() => {});
    return true;
  } catch {
    return true;
  }
}

function listenForUnlock() {
  const handler = () => {
    if (!unlock()) return;
    UNLOCK_EVENTS.forEach((name) => document.removeEventListener(name, handler, true));
  };
  UNLOCK_EVENTS.forEach((name) => document.addEventListener(name, handler, { capture: true, passive: true }));
}

/* ---------- voices ---------- */

function envelope(ctx, out, { start, attack, dur, peak }) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SILENT, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(SILENT, start + dur);
  gain.connect(out);
  return gain;
}

function tone(ctx, out, { type = 'sine', freq, freqEnd = freq, start = ctx.currentTime, dur, peak, attack = 0.004 }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur * 0.8);
  osc.connect(envelope(ctx, out, { start, attack, dur, peak }));
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function noise(ctx, out, { start = ctx.currentTime, dur, peak, attack, f0, f1, q = 0.9 }) {
  const src = ctx.createBufferSource();
  src.buffer = state.noise;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = q;
  filter.frequency.setValueAtTime(f0, start);
  filter.frequency.exponentialRampToValueAtTime(f1, start + dur);
  src.connect(filter);
  filter.connect(envelope(ctx, out, { start, attack, dur, peak }));
  src.start(start);
  src.stop(start + dur + 0.02);
}

const VOICES = {
  tick: (ctx, out, { index = 0 } = {}) => tone(ctx, out, { freq: 1800 + index * 55, dur: 0.035, peak: 0.05 }),
  hover: (ctx, out) => tone(ctx, out, { freq: 2600, dur: 0.028, peak: 0.022 }),
  click: (ctx, out) => tone(ctx, out, { type: 'triangle', freq: 880, freqEnd: 520, dur: 0.075, peak: 0.13 }),
  pop: (ctx, out) => tone(ctx, out, { freq: 420, freqEnd: 980, dur: 0.09, peak: 0.12 }),
  whoosh: (ctx, out) => noise(ctx, out, { dur: 0.55, peak: 0.14, attack: 0.18, f0: 320, f1: 2400 }),
  tone: (ctx, out, { field = 'ink' } = {}) => {
    const root = FIELD_ROOT_HZ[field] || FIELD_ROOT_HZ.ink;
    tone(ctx, out, { freq: root, dur: 0.95, peak: 0.07, attack: 0.08 });
    tone(ctx, out, { freq: root * 1.5, dur: 0.8, peak: 0.035, attack: 0.1 });
  },
  error: (ctx, out) => ERROR_NOTES.forEach(([freq, at]) => {
    tone(ctx, out, { type: 'triangle', freq, freqEnd: freq * 0.97, start: ctx.currentTime + at, dur: 0.16, peak: 0.07, attack: 0.008 });
  }),
  success: (ctx, out) => [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    tone(ctx, out, { freq, start: ctx.currentTime + i * 0.085, dur: 0.5, peak: 0.08 });
  }),
  splash: (ctx, out) => {
    const t = ctx.currentTime;
    [[392, 0], [587.33, 0.16]].forEach(([freq, at]) => {
      tone(ctx, out, { freq, start: t + at, dur: 1.5, peak: 0.09, attack: 0.01 });
      tone(ctx, out, { freq: freq * 2.01, start: t + at, dur: 0.9, peak: 0.025, attack: 0.01 });
    });
  },
};

function throttled(name) {
  const now = performance.now();
  if (now - (state.last.get(name) || 0) < (MIN_GAP_MS[name] || 0)) return true;
  state.last.set(name, now);
  return false;
}

/** Play a named sound. Silent when muted, before the first gesture, or without Web Audio. */
function play(name, options) {
  const voice = VOICES[name];
  const { ctx } = state;
  if (!voice || state.muted || !ctx || throttled(name)) return;
  const run = () => {
    try {
      if (ctx.state === 'running') voice(ctx, state.master, options);
    } catch {
      /* a failed voice is never worth an error */
    }
  };
  if (ctx.state === 'running') run();
  else state.resuming?.then(run);
}

/* ---------- toggles ---------- */

function renderToggles() {
  document.querySelectorAll(TOGGLE).forEach((button) => {
    button.setAttribute('aria-pressed', String(!state.muted));
    button.title = state.muted ? LABEL_OFF : LABEL_ON;
  });
}

function setMuted(muted) {
  state.muted = !!muted;
  writeMuted(state.muted);
  renderToggles();
}

function initToggles() {
  renderToggles();
  document.addEventListener('click', (event) => {
    if (!event.target.closest?.(TOGGLE)) return;
    setMuted(!state.muted);
    play('pop');
  });
}

/* ---------- hooks ---------- */

/** A click on a chip's label (or its text) is followed by a click on its input: let the input make the sound. */
const forwardsToInput = (target) => !target.matches('input')
  && target.matches('label.chip, label.chip *') && !!target.closest('label').querySelector('input');

function soundForClick(target) {
  if (target.closest(TOGGLE)) return null; // the toggle plays its own pop
  if (forwardsToInput(target)) return null;
  const el = target.closest(INTERACTIVE);
  if (!el) return null;
  return el.matches(POP_TARGETS) || el.closest('.chip') ? 'pop' : 'click';
}

function hookPointer() {
  document.addEventListener('click', (event) => {
    const name = event.target.closest ? soundForClick(event.target) : null;
    if (name) play(name);
  });
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let hovered = null;
  document.addEventListener('pointerover', (event) => {
    const el = event.target.closest?.(INTERACTIVE) || null;
    if (el && el !== hovered) play('hover');
    hovered = el;
  }, { passive: true });
}

function hookFilm(film) {
  let lastY = window.scrollY;
  let started = false;
  film.on('progress', () => {
    const y = window.scrollY;
    if (Math.abs(y - lastY) < SCROLL_TICK_PX) return;
    lastY = y;
    play('tick', { index: Math.max(0, film.active) });
  });
  film.ready?.then(() => { started = true; lastY = window.scrollY; });
  film.on('scene', () => started && film.enabled && play('whoosh'));
  film.on('field', ({ field }) => started && play('tone', { field }));
}

/** Wire unlock, toggles and the film / pointer hooks. Safe to call once per page. */
export function initSfx({ film } = {}) {
  listenForUnlock();
  initToggles();
  hookPointer();
  if (film) hookFilm(film);
  document.addEventListener('cs:sfx', (event) => play(String(event.detail || '')));
}

export const sfx = Object.freeze({
  play,
  setMuted,
  isMuted: () => state.muted,
  get state() { return state.ctx ? state.ctx.state : 'none'; },
  get context() { return state.ctx; },
});
