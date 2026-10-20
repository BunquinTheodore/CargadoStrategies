/**
 * Cut-mode input (DIRECTION §9.2; R4 engine.md A3-A6 and A9, shared.md
 * §7.2-7.5), internal to the engine. Intent detection is Round 4's; the output
 * is now a played cut instead of a Lenis glide:
 *
 *   wheel   one flick = one cut. A commit (accumulated 120 px, or a mouse
 *           notch) asks the engine for one step and then swallows the rest of
 *           that stream (trackpad momentum) until a new gesture shows up: a
 *           gap of 180 ms that does not resume the decay, a gap of 400 ms, or
 *           a rise in delta over the last events. A decaying tail never
 *           starts a gesture, so it can never queue a second step; the
 *           engine's input lock decides whether a fresh step is dropped or
 *           queued (after 70% of the cut).
 *   keys    ArrowDown/PageDown/Space +1, ArrowUp/PageUp/Shift+Space −1,
 *           Home/End jump; ignored when the focused element owns the key.
 *   touch   (touchscreen laptops in cut mode) an 18% drag or a flick.
 *   scroll  the document scroll is only a position holder (one stage-height
 *           slot per scene). A scroll nobody asked for (scrollbar drag,
 *           find-in-page, a screen reader) settles on the nearest scene; while
 *           a text field holds focus (the field hold), or the film is
 *           stopped, an unasked scroll is reverted instead.
 * Lenis (fine pointers only) is loaded lazily as the position holder; it is
 * never given input (virtualScroll returns false), so it never animates and
 * needs no frame loop.
 */
export const LENIS_URL = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs';

const ADVANCE_PX = 120; // accumulated wheel travel that commits a cut (R4: 18% of a 680 px span)
const NOTCH_PX = 50; // first event of a gesture this large is a mouse notch (Windows 100 px, Firefox 3 lines = 50 px)
const WHEEL_IDLE_MS = 140; // no wheel for this long: an uncommitted nudge is forgotten
const WHEEL_GAP_MS = 180; // a gap this long ends the stream, unless the next event is still decaying
const WHEEL_BREAK_MS = 400; // a gap this long always ends it (a tail never pauses this long)
const RISE_MIN_PX = 12;
const RISE_FACTOR = 1.6; // a fresh flick during momentum shows up as a jump in delta
const RISE_WINDOW = 3;
const COALESCE_SLACK = 1.2; // a chunk up to this much over the tail's rate × gap is still the tail
const MIN_GAP_MS = 8; // floor for the wheel rate (120 Hz trackpads report every 8 ms)
const LINE_PX = 100 / 6; // Lenis's line-mode delta
const TOUCH_AXIS_PX = 10;
const TOUCH_X_RATIO = 1.5; // shared.md §7.3: a mostly horizontal swipe is not ours
const TOUCH_ADVANCE = 0.18; // share of the stage height that commits a drag
const SWIPE_MIN_PX = 24;
const FLICK_PX_PER_MS = 0.45;
const FLICK_WINDOW_MS = 80;
const USER_INPUT_MS = 300; // a scroll this soon after wheel, key or touch input was asked for
const NATIVE_SETTLE_MS = 180;
const OPT_OUT = '[data-lenis-prevent], [data-lenis-prevent-wheel], [data-lenis-prevent-touch], [data-snap="off"], dialog[open]';
const NOT_TEXT = new Set(['radio', 'checkbox', 'button', 'submit', 'reset', 'image', 'file', 'color']);
const EDITOR_ROLES = '[role="combobox"], [role="listbox"], [role="slider"], [role="spinbutton"], [role="grid"], [role="tree"], [role="application"]';
const COMPOSITE = '[role="tab"], [role="tablist"], [role="radiogroup"], [role="radio"], [role="menu"], [role="menubar"], .pager, [data-pager], .stepper__nav';
const ACTIVATORS = 'button, a[href], summary, label, [role="button"], [role="tab"], input';
const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);

const sign = (v) => (v < 0 ? -1 : 1);
const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);

/** A text field: the field hold and every snap key belong to it. */
export function isTextField(el) {
  if (!(el instanceof Element)) return false;
  if (el.matches('textarea, select, [contenteditable=""], [contenteditable="true"]')) return true;
  return el.matches('input') && !NOT_TEXT.has((el.getAttribute('type') || 'text').toLowerCase());
}

/** shared.md §7.2: true when the focused element keeps this key for itself. */
function ownsKey(el, key) {
  if (!(el instanceof Element) || el === document.body) return false;
  if (isTextField(el) || el.closest(`${EDITOR_ROLES}, [data-snap-keys="off"]`)) return true;
  const composite = el.closest(COMPOSITE) || el.matches('input[type="radio"], input[type="checkbox"]');
  if (composite && ARROWS.has(key)) return true;
  return key === ' ' && el.matches(ACTIVATORS);
}

/** The step a key asks for: +1, −1, 'first', 'last', or 0 (not ours). */
function keyIntent(e) {
  if (e.key === ' ') return e.shiftKey ? -1 : 1;
  if (e.shiftKey) return 0;
  switch (e.key) {
    case 'ArrowDown': case 'PageDown': return 1;
    case 'ArrowUp': case 'PageUp': return -1;
    case 'Home': return 'first';
    case 'End': return 'last';
    default: return 0;
  }
}

function canScroll(el, dy) {
  if (el.scrollHeight <= el.clientHeight + 1) return false;
  const { overflowY } = getComputedStyle(el);
  if (overflowY !== 'auto' && overflowY !== 'scroll') return false;
  return dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
}

/**
 * An opted-out region under the event: 'native' when something in it can
 * still scroll that way (leave the event alone), 'swallow' when it cannot
 * (stop the scroll chaining to the page), null when the event is ours.
 */
function optOut(event, dy) {
  const path = event.composedPath ? event.composedPath() : [];
  const at = path.findIndex((node) => node instanceof Element && node.matches(OPT_OUT));
  if (at < 0) return null;
  const inside = path.slice(0, at + 1).filter((node) => node instanceof Element);
  return inside.some((el) => canScroll(el, dy)) ? 'native' : 'swallow';
}

const normalise = (e) => {
  const k = e.deltaMode === 1 ? LINE_PX : e.deltaMode === 2 ? window.innerHeight : 1;
  return { dx: e.deltaX * k, dy: e.deltaY * k };
};

function loadLenis() {
  if (window.Lenis) return Promise.resolve(window.Lenis);
  return import(LENIS_URL).then((m) => m.default || m.Lenis);
}

/**
 * engine: { isOn(), isBuilt(), isBlocked(), isCutting(), step(dir, cause), jump(index, cause),
 *           current(), last(), holdY(index), nearest(y), stageHeight() }
 */
export function createSnap(engine) {
  const wheel = { acc: 0, first: true, locked: false, lastAt: 0, lastSize: 0, lastRate: 0, recent: [], idle: 0 };
  const touch = { y0: 0, x0: 0, axis: null, samples: [] };
  let lenis = null;
  let lastInputAt = 0;
  let expectedY = null;
  let pointerDown = false;
  let fieldHold = false;
  let settleTimer = 0;
  let disposed = false;

  const noteInput = () => { lastInputAt = performance.now(); };
  const userAsked = () => performance.now() - lastInputAt < USER_INPUT_MS;

  /** Put the document scroll on a scene's slot without the scroll handler treating it as foreign. */
  function hold(index) {
    const y = Math.round(engine.holdY(index));
    expectedY = y;
    if (lenis) {
      lenis.resize(); // its scroll limit is measured asynchronously: refresh it before a rebuild's first hold
      lenis.scrollTo(y, { immediate: true, force: true });
    }
    if (Math.abs(window.scrollY - y) >= 1) window.scrollTo(0, y);
  }

  /* --- wheel --- */

  function startGesture() {
    wheel.acc = 0;
    wheel.first = true;
    wheel.locked = false;
  }

  function commitWheel(dir) {
    engine.step(dir, 'wheel');
    wheel.acc = 0;
    wheel.locked = true; // the rest of this stream is momentum, dropped or not
  }

  /**
   * After a pause: a new gesture only when the delta grows (a repeated mouse
   * notch counts) and is more than the tail's own rate would have carried
   * over the gap (a coalesced chunk of the same tail is not).
   */
  function resumes(size, gap) {
    const grows = size > wheel.lastSize || (size >= NOTCH_PX && size === wheel.lastSize);
    const carried = Number.isFinite(wheel.lastRate) ? wheel.lastRate * gap * COALESCE_SLACK : 0;
    return grows && size > carried;
  }

  /**
   * Mid-stream: a fresh flick raises both the delta and the delta per ms.
   * A coalesced chunk (a busy main thread) raises only the delta; an uneven
   * event cadence (jank) raises only the rate. A decaying tail raises neither.
   */
  function surges(size, rate) {
    if (size < RISE_MIN_PX || !wheel.recent.length) return false;
    const sizes = mean(wheel.recent.map((r) => r.size));
    const rates = mean(wheel.recent.map((r) => r.rate));
    return size > wheel.lastSize && size > RISE_FACTOR * sizes && rate > RISE_FACTOR * rates;
  }

  function onWheel(e) {
    if (!engine.isOn() || e.ctrlKey) return; // snap off: native scroll; ctrl: browser zoom
    const { dx, dy } = normalise(e);
    if (!engine.isBuilt()) { e.preventDefault(); return; } // a flick during the splash moves nothing
    const out = optOut(e, dy);
    if (out === 'native') return;
    if (out === 'swallow' || Math.abs(dx) > Math.abs(dy)) {
      if (out === 'swallow') e.preventDefault();
      return; // sideways gestures belong to carousels and the finder map
    }
    e.preventDefault();
    noteInput();
    if (engine.isBlocked() || dy === 0) return;
    const now = e.timeStamp || performance.now();
    const size = Math.abs(dy);
    const gap = now - wheel.lastAt;
    const rate = size / Math.max(gap, MIN_GAP_MS);
    const fresh = gap >= WHEEL_BREAK_MS || (gap >= WHEEL_GAP_MS ? resumes(size, gap) : surges(size, rate));
    const paused = gap >= WHEEL_GAP_MS; // the first event after a pause has no meaningful rate
    wheel.lastAt = now;
    wheel.lastSize = size;
    wheel.lastRate = paused ? Infinity : rate;
    wheel.recent = paused ? [] : [...wheel.recent.slice(1 - RISE_WINDOW), { size, rate }];
    if (fresh) startGesture();
    if (wheel.locked) return;
    if (wheel.acc && sign(wheel.acc) !== sign(dy)) wheel.acc = 0;
    wheel.acc += dy;
    const notch = e.deltaMode !== 0 || (wheel.first && size >= NOTCH_PX);
    wheel.first = false;
    clearTimeout(wheel.idle);
    wheel.idle = setTimeout(() => { wheel.acc = 0; }, WHEEL_IDLE_MS); // a nudge that never committed: nothing moved, nothing to undo
    if (notch || Math.abs(wheel.acc) >= ADVANCE_PX) commitWheel(sign(wheel.acc));
  }

  /* --- keys --- */

  function onKey(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!engine.isOn() || engine.isBlocked()) return;
    const intent = keyIntent(e);
    if (!intent) return;
    const focused = document.activeElement;
    if (ownsKey(e.target, e.key) || ownsKey(focused, e.key)) return;
    e.preventDefault();
    noteInput();
    if (!engine.isBuilt() || (e.repeat && engine.isCutting())) return; // holding a key moves at most one scene per cut
    if (intent === 'first') engine.jump(0, 'key');
    else if (intent === 'last') engine.jump(engine.last(), 'key');
    else engine.step(intent, 'key');
  }

  /* --- touch (touchscreen laptops; phones and tablets run touch-cut) --- */

  function onTouchStart(e) {
    if (!engine.isOn() || e.touches.length > 1) { touch.axis = 'none'; return; }
    const t = e.touches[0];
    touch.y0 = t.clientY;
    touch.x0 = t.clientX;
    touch.axis = null;
    touch.samples = [{ y: t.clientY, at: e.timeStamp }];
  }

  function onTouchMove(e) {
    if (touch.axis === 'none' || e.touches.length > 1) return; // pinch-zoom stays native
    const t = e.touches[0];
    const dx = t.clientX - touch.x0;
    const dy = t.clientY - touch.y0;
    if (!touch.axis && (Math.abs(dx) > TOUCH_AXIS_PX || Math.abs(dy) > TOUCH_AXIS_PX)) {
      const sideways = Math.abs(dx) > TOUCH_X_RATIO * Math.abs(dy);
      touch.axis = sideways || optOut(e, -dy) ? 'none' : 'y';
    }
    if (touch.axis !== 'y') return;
    e.preventDefault();
    noteInput();
    touch.samples = [...touch.samples.filter((s) => e.timeStamp - s.at <= FLICK_WINDOW_MS), { y: t.clientY, at: e.timeStamp }];
  }

  function onTouchEnd() {
    if (touch.axis !== 'y') return;
    touch.axis = null;
    if (!engine.isBuilt() || engine.isBlocked()) return;
    const last = touch.samples[touch.samples.length - 1];
    const travel = last.y - touch.y0;
    const first = touch.samples[0];
    const velocity = Math.abs(last.y - first.y) / Math.max(1, last.at - first.at);
    const flick = Math.abs(travel) >= SWIPE_MIN_PX && velocity >= FLICK_PX_PER_MS;
    if (flick || Math.abs(travel) >= TOUCH_ADVANCE * engine.stageHeight()) engine.step(travel < 0 ? 1 : -1, 'touch');
  }

  /* --- the document scroll (position holder) --- */

  function settleNative() {
    settleTimer = 0;
    if (pointerDown || !engine.isOn()) return;
    const index = engine.nearest(window.scrollY);
    if (index !== engine.current()) engine.jump(index, 'goto');
    else hold(index);
  }

  function onScroll() {
    if (!engine.isOn() || !engine.isBuilt()) return;
    const y = window.scrollY;
    if (expectedY !== null && Math.abs(y - expectedY) < 1) return;
    expectedY = null;
    if ((fieldHold || engine.isBlocked()) && !pointerDown && !userAsked()) {
      hold(engine.current()); // a focus or keyboard scroll in a form, or a page behind a dialog: put it back
      return;
    }
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settleNative, NATIVE_SETTLE_MS);
  }

  const onPointerDown = () => { pointerDown = true; };
  const onPointerUp = () => {
    if (!pointerDown) return;
    pointerDown = false;
    if (Math.abs(window.scrollY - engine.holdY(engine.current())) >= 1) settleNative(); // scrollbar drag released
  };
  const onFocusIn = (e) => { fieldHold = isTextField(e.target) && !!e.target.closest('.scene'); };
  const onFocusOut = (e) => {
    if (isTextField(e.relatedTarget)) return;
    fieldHold = false;
    if (engine.isOn() && engine.isBuilt()) hold(engine.current());
  };

  const listeners = [
    [window, 'wheel', onWheel, { passive: false }],
    [document, 'keydown', onKey, false],
    [window, 'touchstart', onTouchStart, { passive: true }],
    [window, 'touchmove', onTouchMove, { passive: false }],
    [window, 'touchend', onTouchEnd, { passive: true }],
    [window, 'scroll', onScroll, { passive: true }],
    [window, 'pointerdown', onPointerDown, { passive: true }],
    [window, 'pointerup', onPointerUp, { passive: true }],
    [window, 'pointercancel', onPointerUp, { passive: true }],
    [document, 'focusin', onFocusIn, false],
    [document, 'focusout', onFocusOut, false],
  ];
  listeners.forEach(([target, type, fn, opts]) => target.addEventListener(type, fn, opts));

  if (window.matchMedia('(pointer: fine)').matches) {
    loadLenis().then((Lenis) => {
      if (disposed || !Lenis) return;
      lenis = new Lenis({ virtualScroll: () => false, smoothWheel: false });
      if (engine.isBuilt() && engine.isOn()) hold(engine.current());
    }, (err) => {
      console.error('film: Lenis failed to load; the native scroll position is used instead', err);
    });
  }

  function destroy() {
    disposed = true;
    clearTimeout(settleTimer);
    clearTimeout(wheel.idle);
    listeners.forEach(([target, type, fn, opts]) => target.removeEventListener(type, fn, opts));
    lenis?.destroy();
    lenis = null;
  }

  return {
    hold,
    destroy,
    stop: () => lenis?.stop(),
    start: () => lenis?.start(),
    get lenis() { return lenis; },
  };
}
