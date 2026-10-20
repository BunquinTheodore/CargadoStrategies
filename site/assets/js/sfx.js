/**
 * Sound effects, synthesized with the Web Audio API (no audio files). DIRECTION §8.
 *
 *   import { sfx } from './sfx.js';
 *   sfx.play('chime');                   // voices: breath, blip, chime (see VOICES)
 *   document.dispatchEvent(new CustomEvent('cs:sfx', { detail: 'chime' }));  // same, without the import
 *
 * Three quiet voices only: breath on a field change (an iris), blip on a click
 * of a button, row or chip, and chime on success (the WhatsApp sheet opens
 * WhatsApp, or a form submits). Round 4 names still work: 'success' is the
 * chime, 'click' and 'pop' are the blip; every other old name ('tick', 'hover',
 * 'whoosh', 'tone', 'splash', 'page', 'error') is silent, and sfx.has() says so.
 *
 * Rules:
 * - one master gain (0.12) and a limiter; every voice has a minimum gap;
 * - the context is created on the first click only (pointer, tap or keyboard
 *   activation), never on scroll, wheel or keydown alone;
 * - silent on coarse pointers (no context is ever created there);
 * - under reduced motion (html.rm) only the chime plays;
 * - the footer "Sound" switch (C37, chrome.js) persists localStorage['cs-sound']
 *   as 'on' | 'off'. Off means nothing plays. The switch tells this module with
 *   the document event `cs:sound` ({ detail: { on } }) or by calling sfx.setOn();
 *   another tab's change arrives through the `storage` event.
 * If Web Audio is missing or fails, every call is a silent no-op.
 */

export const SOUND_KEY = 'cs-sound';
const SOUND_OFF = 'off';
const SOUND_ON = 'on';

const MASTER_GAIN = 0.12;
const LIMITER = { threshold: -8, knee: 6, ratio: 16, attack: 0.003, release: 0.12 };
const MIN_GAP_MS = { breath: 900, blip: 60, chime: 600 };
const ALIASES = { success: 'chime', click: 'blip', pop: 'blip' };
const REDUCED_OK = new Set(['chime']); // the only voice that plays under reduced motion
const SILENT = 0.0001;
const BREATH = { from: 110, to: 98, attack: 0.35, release: 0.9, peak: 0.04 };
const BLIP = { freq: 1200, dur: 0.04, peak: 0.06 };
const CHIME_NOTES = [[783.99, 0], [1174.66, 0.12]]; // G5 then D6: a two-note gold chime
const CHIME = { dur: 0.9, peak: 0.08, overtone: 2.01, overtonePeak: 0.018 };
/** Clicks that blip: buttons, rows and chips. Plain text links stay silent. */
const BLIP_TARGETS = 'button, .btn, .row, .chip, [role="button"], [role="tab"], summary, select';
const COARSE_QUERY = '(pointer: coarse)';
const FINE_QUERY = '(hover: hover) and (pointer: fine)';

const state = { ctx: null, master: null, on: true, silent: false, last: new Map(), resuming: null, started: false };

/* ---------- switch (C37) ---------- */

function readStoredOn() {
  try {
    return localStorage.getItem(SOUND_KEY) !== SOUND_OFF;
  } catch {
    return true; // storage blocked: the default, sound on
  }
}

/** The footer switch: on = true plays, false silences everything. Persisted. */
function setOn(on) {
  state.on = !!on;
  try {
    localStorage.setItem(SOUND_KEY, state.on ? SOUND_ON : SOUND_OFF);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
}

function listenForSwitch() {
  document.addEventListener('cs:sound', (event) => { state.on = event.detail?.on !== false; });
  window.addEventListener('storage', (event) => {
    if (event.key === SOUND_KEY || event.key === null) state.on = readStoredOn();
  });
}

/* ---------- context ---------- */

const coarsePointer = () => !!window.matchMedia
  && window.matchMedia(COARSE_QUERY).matches && !window.matchMedia(FINE_QUERY).matches;

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
  Object.assign(state, { ctx, master });
  return ctx;
}

function unlock() {
  try {
    const ctx = state.ctx || createContext();
    if (ctx && ctx.state !== 'running') state.resuming = ctx.resume().catch(() => {});
  } catch {
    /* no audio on this device: every play stays a no-op */
  }
}

/** The first click (any activation that fires `click`) creates the context. */
function listenForUnlock() {
  const handler = () => {
    document.removeEventListener('click', handler, true);
    unlock();
  };
  document.addEventListener('click', handler, { capture: true, passive: true });
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
  if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
  osc.connect(envelope(ctx, out, { start, attack, dur, peak }));
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

const VOICES = {
  breath: (ctx, out) => tone(ctx, out, {
    freq: BREATH.from, freqEnd: BREATH.to, dur: BREATH.attack + BREATH.release, peak: BREATH.peak, attack: BREATH.attack,
  }),
  blip: (ctx, out) => tone(ctx, out, { freq: BLIP.freq, dur: BLIP.dur, peak: BLIP.peak, attack: 0.003 }),
  chime: (ctx, out) => CHIME_NOTES.forEach(([freq, at]) => {
    const start = ctx.currentTime + at;
    tone(ctx, out, { freq, start, dur: CHIME.dur, peak: CHIME.peak, attack: 0.01 });
    tone(ctx, out, { freq: freq * CHIME.overtone, start, dur: CHIME.dur * 0.6, peak: CHIME.overtonePeak, attack: 0.01 });
  }),
};

const voiceName = (name) => ALIASES[name] || name;
const has = (name) => Object.hasOwn(VOICES, voiceName(name));
const reducedMotion = () => document.documentElement.classList.contains('rm');

/** True when nothing can play right now: checked first by every hook, before any other work. */
const quiet = () => state.silent || !state.on || !state.ctx;

function throttled(name) {
  const now = performance.now();
  if (now - (state.last.get(name) || 0) < MIN_GAP_MS[name]) return true;
  state.last.set(name, now);
  return false;
}

/** Play a named sound. Silent when off, on coarse pointers, before the first click, or without Web Audio. */
function play(name) {
  if (quiet()) return;
  const voiceKey = voiceName(name);
  const voice = VOICES[voiceKey];
  if (!voice || (reducedMotion() && !REDUCED_OK.has(voiceKey)) || throttled(voiceKey)) return;
  const { ctx, master } = state;
  const run = () => {
    try {
      if (ctx.state === 'running') voice(ctx, master);
    } catch {
      /* a failed voice is never worth an error */
    }
  };
  if (ctx.state === 'running') run();
  else state.resuming?.then(run);
}

/* ---------- hooks ---------- */

/** A click on a chip's label is followed by a click on its input: let the input make the sound. */
const forwardsToInput = (target) => !target.matches('input')
  && !!target.closest('label.chip')?.querySelector('input');

function hookPointer() {
  document.addEventListener('click', (event) => {
    if (quiet()) return;
    const { target } = event;
    if (!target.closest || forwardsToInput(target)) return;
    const el = target.closest(`${BLIP_TARGETS}, input[type="radio"], input[type="checkbox"]`);
    if (!el || el.closest('[data-sfx="none"]')) return;
    play('blip');
  });
}

/** breath on a field change. Returns at once when nothing can play; never reads layout or scrollY. */
function hookFilm(film) {
  if (typeof film.on !== 'function') return;
  film.on('cut', (cut) => {
    if (quiet()) return;
    if (cut.fieldChange && cut.from >= 0 && !cut.immediate) play('breath');
  });
}

/** Wire the switch, unlock, and the film / pointer hooks. Safe to call once per page. */
export function initSfx({ film } = {}) {
  if (state.started) return;
  state.started = true;
  state.on = readStoredOn();
  listenForSwitch();
  document.addEventListener('cs:sfx', (event) => play(String(event.detail || '')));
  document.addEventListener('cs:wa-opened', () => play('chime'));
  state.silent = coarsePointer();
  if (state.silent) return;
  listenForUnlock();
  hookPointer();
  if (film) hookFilm(film);
}

export const sfx = Object.freeze({
  play,
  has,
  setOn,
  isOn: () => state.on,
  /** Round 4 API, kept: an in-memory mute for code (not persisted). */
  setMuted: (muted) => { state.on = !muted; },
  isMuted: () => !state.on,
  get silent() { return state.silent; },
  get state() { return state.ctx ? state.ctx.state : 'none'; },
  get context() { return state.ctx; },
});
