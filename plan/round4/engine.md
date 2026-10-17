# Round 4 engine spec: scene snapping, pan fallback, removals, shared fit scale

> **Merge amendments (2026-10-17):** `shared.md` §7 amends this spec: the A6 key ownership table (§7.2), the A7 `[data-swipe-x]` rule (§7.3), the A8 overflow-only rebuild measured with `offsetHeight` (§7.4), the A9 field hold that replaces "touch off while a field is focused" (§7.5), the A10 `page` voice and `sfx.has` (§7.6), and the A11 exports `refreshReach` and `isParked` (§7.1). D2 tokens: the pan padding is now `clamp(8px, 1.5svh, 24px)` / `clamp(12px, 2.5svh, 32px)`, and the phone-tiny band is added (`shared.md` §3). The final scene is `#credits` (not `#footer`). The utilities and component CSS go in the new `ui.css` (`shared.md` §2), and `.short-hide` is phones only (D20).

Status: design (read-only phase). Nothing under `site/` was edited. Round 3 is still editing
files, so the line numbers below are **as read on 2026-10-17** and are only hints. Always find a
change by the quoted code or selector, not by its line number.

Brief and acceptance test: `PLAN.md` › "Round 4: one screen per section". In short:
- every scene fits one screen;
- one gesture moves exactly one scene;
- nothing is ever left half-way;
- `tools/fit-audit.mjs` reports 0 overflow at the 9 contract viewports.

Build order (from PLAN): **C removals → A + B engine → D shared scale → pages**. The removals come
first because they free the bottom reserve (`--bottom-h`) that sections A, B and D assume is gone.

Libraries in use: GSAP 3.12.5, ScrollTrigger, **Lenis 1.1.13**. The Lenis API details below were
checked against `node_modules/lenis/dist/lenis.mjs`.

---

## A. Scene snapping: `site/assets/js/film-snap.js` (new)

### A1. Model

The film keeps scrubbing one master timeline from the scroll position. Nothing changes there: the
ScrollTrigger, film-map and Lenis stay. Snapping only decides **where the scroll is allowed to
come to rest**, and it owns all user scroll input while it is on.

- **Hold points.** There is one rest position per scene: `holdY[i]`, in document scroll px.
- **State machine** (one instance per film):

  | state | meaning | input |
  |---|---|---|
  | `off` | snap disabled (see A9); Lenis free-scrolls as today | passed to Lenis |
  | `rest` | sitting on `holdY[cur]` | a new gesture may start |
  | `preview` | a wheel/touch gesture is under way; the film scrubs toward the neighbour, below the commit threshold | accumulated |
  | `glide` | `lenis.scrollTo(holdY[target], { lock: true })` is running | wheel/touch swallowed; keys may retarget (A6) |
  | `cooldown` | glide finished, but the same wheel/trackpad stream (momentum) is still arriving | swallowed until a gap or a fresh rise (A4) |

- `cur` is the index of the scene being rested on. It is **not** `film.active`: `active` flips
  half-way through a transition. After any foreign scroll (scrollbar, find-in-page, or a page
  calling `scrollToTime`), `cur` is recomputed as the hold point nearest to `window.scrollY`.

### A2. Hold points come from the film-map segments

The work is done in `film.js` (`attach()` and `rebuild()`), because only `film.js` has
`state.map` and `spacer`:

```js
const holdEndOf = (t) => (t.index === state.timings.length - 1 ? t.end : t.outStart); // exists already
function computeHolds() {
  const last = state.timings.length - 1;
  state.holds = state.timings.map((t, i) => {
    if (i === 0) return spacer.offsetTop;                       // opening frame = top (scroll cue logic stays valid)
    if (i === last) return spacer.offsetTop + state.map.total;  // End key / last scene = very end
    return spacer.offsetTop + pxAt(state.map, (t.focusTime + holdEndOf(t)) / 2); // hold midpoint
  }).map(Math.round);
}
```

- Call `computeHolds()` at the end of `attach()`.
- Expose it to film-snap as `holds()`, which returns a copy.

**Snap-mode scroll map.** `film-map.js` changes to `buildScrollMap(timings, { snap })`:

- When `snap` is true, every hold uses `SNAP_HOLD_PX = 40`, and so does the end hold. `data-rest`
  and `REST_HOLD_PX` are ignored, because forms no longer need extra "dead" scroll.
- Why: in snap mode, hold px only set how much of a preview gesture produces no visible motion.
  With 180 px holds, a gesture would scrub 90 px of nothing before the transition moved. With 40
  px, the transition answers the finger or wheel at once.
- The spacing between two hold points is then `span[i] = holdY[i+1] - holdY[i]`, which is about
  40 + 640 × weight ≈ 680 px.
- When `snap` is false (the < 560 px fallback), the map is exactly today's: holds 180/340/220 and
  pan segments.

**Hold drift.** Delete `addHoldDrift()` and `HOLD_DRIFT_PX` from `film.js` (around lines 46 and
269–275, and the call in `recordScene`):

- In snap mode a held frame must sit still at its designed position. Drift of up to 22 px breaks
  the fit budget, and its only purpose was "no scroll is dead", which snapping replaces.
- fit-audit neutralises drift already, so audit results do not change.

### A3. Taking input from Lenis

Lenis 1.1.13 calls `options.virtualScroll(data)` first for every wheel, touchstart, touchmove and
touchend. `data` is `{ deltaX, deltaY, event }`. Returning `false` makes Lenis ignore the event
completely, **and it does not `preventDefault`**. So film-snap must call
`event.preventDefault()` itself whenever it consumes an event. The listeners are registered
`passive:false` on `window` by Lenis, so the call works.

In `film.js` `createLenis()`:

```js
let virtualHook = () => true;                        // until snap is installed: plain Lenis
const lenis = new Lenis({ ...LENIS, virtualScroll: (e) => virtualHook(e) });
lenis.setVirtualHook = (fn) => { virtualHook = fn; };  // or return { lenis, setHook } from createLenis
```

`film-snap` installs `onVirtual(e)`, which returns `true` (let Lenis handle the event) when any of
these hold:

- snap is `off`;
- `event.ctrlKey` (pinch-zoom or browser zoom). Lenis returns early on ctrlKey without
  preventDefault, so zoom keeps working;
- `lenis.isStopped` (menu or dialog open). Lenis then preventDefaults, so the page does not move;
- the composed path contains `[data-lenis-prevent]`, `[data-lenis-prevent-wheel|touch]`,
  `[data-snap="off"]`, or an open `<dialog>`;
- the gesture is horizontal-dominant (`|deltaX| > |deltaY|` on wheel; on touch, the first 10 px
  decide it). Carousels and the finder map keep their sideways gestures;
- multi-touch (`event.touches?.length > 1`). Return `false` without preventDefault, so pinch-zoom
  stays native.

In every other case it consumes the event: it calls `event.preventDefault()`, returns `false`,
and runs the state machine.

**Native scroll that bypasses Lenis** (scrollbar drag, find-in-page, middle-click autoscroll,
`element.focus()` scrolling, screen readers): listen to `lenis.on('scroll')`. When
`lenis.isScrolling === 'native'` and the state is `rest`, debounce `NATIVE_SETTLE_MS = 180` and
then settle to the nearest hold (A5). Skip this if a pointer is still down (track
`pointerdown`/`pointerup` on `window`).

### A4. Wheel: one flick = one scene, with a momentum lock

Wheel deltas arrive already normalised by Lenis to px (line mode × 100/6, page mode × height).

**rest → preview.** The first accepted wheel event sets `dir = sign(dy)` and `acc = 0`.

- If there is no neighbour in `dir` (first or last scene), allow a rubber-band preview of at most
  `EDGE_PX = 24` px, then settle back. The settle plays the soft tick.

**preview.** For each event:

1. If the sign flips: `acc = 0`, `dir = sign(dy)`.
2. `acc += dy`.
3. Preview position: `y = holdY[cur] + dir * min(|acc|, PREVIEW_CAP * span)`, with
   `PREVIEW_CAP = 0.35`. Apply it with `lenis.scrollTo(y, { lerp: 0.18, force: true })`, so the
   film scrubs smoothly toward the neighbour and shows the user something is happening.
4. **Commit** when either of these holds:
   - `|acc| >= ADVANCE_SHARE * span[cur, dir]`, with `ADVANCE_SHARE = 0.18` (the PLAN's 18 %,
     about 120 px at the 680 px span); or
   - the event is a **mouse notch**: `event.deltaMode !== 0`, or (the first event of the gesture
     and `|rawDeltaY| >= NOTCH_PX`, with `NOTCH_PX = 50`).

     A Windows mouse notch is 100 px and Firefox gives 3 lines = 50 px. Without this rule a
     single notch (< 120 px) would bounce back, which feels broken.

   Commit: `glideTo(cur + dir, { cause: 'wheel' })`.
5. Restart the idle timer. When `WHEEL_IDLE_MS = 140` passes with no commit, call `settle()`
   (glide back to `holdY[cur]`).

**glide.** Swallow every wheel event, recording `lastWheelAt` and the last 3 `|dy|` values.

**cooldown** (entered on glide complete, only if a wheel event arrived in the last 140 ms;
otherwise go straight to `rest`). Each wheel event is swallowed, unless it starts a **new
gesture**:

- a **gap**: `now - lastWheelAt >= WHEEL_IDLE_MS`; or
- a **rise**: `|dy| >= RISE_MIN_PX (12)` and `|dy| > RISE_FACTOR (1.6) × mean(last 3 |dy|)`. A
  fresh flick during trackpad inertia shows up as a jump in delta, while momentum only decays.

On a new gesture, go to `rest` and treat the event as the first event of the next gesture. This is
the momentum lock: one trackpad fling (about 1–2 s of decaying deltas) moves exactly one scene,
while two deliberate flicks move two.

### A5. Glide, settle and timing

```js
const GLIDE_S = 1.0;          // one full transition: iris + reveals need ~1 s to read
const GLIDE_MIN_S = 0.45;
const SETTLE_S = 0.42;        // back to the scene you are on
const JUMP_S = (n) => Math.min(1.8, 0.9 + 0.25 * (n - 1)); // goTo across n scenes
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // already in film.js: move to a shared helper

function glideTo(index, { cause, immediate = false, duration } = {}) {
  index = clamp(index, 0, holds.length - 1);
  const from = cur, y = holds[index];
  if (immediate) { lenis.scrollTo(y, { immediate: true, force: true }); ScrollTrigger.update(); cur = index; state = 'rest'; return; }
  const n = Math.abs(index - from);
  const remaining = Math.abs(y - window.scrollY) / Math.max(1, Math.abs(holds[index] - holds[from]) || 1);
  const moving = state === 'preview';                       // already in motion: ease out, no second acceleration
  const seconds = duration ?? (n > 1 ? JUMP_S(n) : Math.max(GLIDE_MIN_S, GLIDE_S * (moving ? clamp(remaining, 0.5, 1) : 1)));
  target = index; state = 'glide';
  emitter.emit('snapstart', { from, to: index, cause });
  lenis.scrollTo(y, {
    duration: seconds, easing: moving ? easeOutCubic : easeInOutCubic, lock: true, force: true,
    onComplete: () => { cur = index; state = recentWheel() ? 'cooldown' : 'rest';
                        emitter.emit('snapend', { index, from, field: scenes[index].dataset.field || 'ink', cause }); },
  });
}
function settle() { glideTo(cur, { cause: 'settle', duration: SETTLE_S }); } // emits snapstart with from === to (SFX: tick, not whoosh)
```

Notes:

- `lock: true` sets `lenis.isLocked` while the glide runs, so Lenis's own handler would also
  refuse input. `force: true` lets a programmatic glide run even while locked. Lenis calls
  `onComplete` once, at the end. If a glide is interrupted, nothing calls `onComplete`.
- **Interruption.** A new `glideTo` started during a glide (keys, goTo, focus) just calls
  `lenis.scrollTo` again; Lenis replaces the animation. The replaced glide's `onComplete` never
  fires, so set `cur` only in the newest one.
- **Lenis smoothing for preview** (`lerp: 0.18`) is used only while previewing. The global
  `LENIS.lerp` (0.085) only matters in `off` mode.

### A6. Keyboard

Add one `keydown` listener on `document` (bubble phase, so page widgets act first).

| key | action |
|---|---|
| ArrowDown, PageDown, Space | `step(+1)` |
| ArrowUp, PageUp, Shift+Space | `step(-1)` |
| Home | `glideTo(0, { cause: 'key' })` |
| End | `glideTo(last, { cause: 'key' })` |

Ignore the key (no preventDefault, native behaviour) when any of these hold:

- `e.defaultPrevented`, `e.ctrlKey || e.metaKey || e.altKey`, or Shift with anything but Space;
- snap is `off` or blocked (A9);
- `e.target` (or `document.activeElement`) **owns the key**:
  - an editable: `input` (every type, including radio and checkbox, whose arrows move the
    selection), `textarea`, `select`, `[contenteditable]`;
  - `[role=combobox|listbox|slider|spinbutton|tablist|tab|radiogroup|radio|menu|menubar|grid|tree|application]`;
  - `[data-snap-keys="off"]` or anything inside one: put this on the finder map's `<svg>`
    (finder-map.js handles arrow keys) and on any carousel or stepper that uses arrows;
  - for Space only: `button`, `summary`, `a[href]`, `label`, `[role=button]`. Space activates
    these and must not be stolen.

When handled: `e.preventDefault()`, and stop the browser's native page scroll.

`step(d)`:

- In `glide`, retarget to `target + d`. Each key press is its own gesture. Ignore `e.repeat`
  during a glide, so holding a key moves at most one scene per glide.
- Otherwise, `glideTo(cur + d)`.
- At the ends, call `settle()`, which plays the edge tick.

Focus is **not** moved. The film's `updateReach()` already keeps the new scene's controls in the
Tab order.

### A7. Touch

These events also come through `virtualScroll`. Lenis multiplies the deltas by `touchMultiplier`
(1.4); read the raw `event.touches[0].clientY` for the threshold maths.

- **touchstart**: record `y0` and `t0`. Not yet a gesture. Do **not** preventDefault, so taps
  still click.
- **touchmove**: once `|dy| > 10` px, decide the axis. If vertical: `state = 'preview'`,
  preventDefault, and follow the finger 1:1 with
  `lenis.scrollTo(holdY[cur] - dyRaw * 1.4, { immediate: true, force: true })`. Clamp the follow
  to `[-0.6, 0.6] × span` toward existing neighbours (EDGE_PX at the ends).
- **touchend**: commit when either of these holds:
  - `travel >= ADVANCE_SHARE × span` (≈ 18 %); or
  - a **flick**: `|dy| >= SWIPE_MIN_PX (24)` and `|velocity| >= FLICK_PX_PER_MS (0.45)`,
    measured over the last 80 ms.

  Commit in the direction of travel with `glideTo(cur ± 1, { cause: 'touch' })`. Otherwise call
  `settle()`.
- During `glide`, preventDefault every touchmove (no native scroll, no URL-bar wobble). A new
  touchstart during a glide does **not** cancel it (one swipe = one scene).
- CSS in `base.css` §6:

  ```css
  html.film.snap-on { overscroll-behavior: none; }
  html.film.snap-on body { touch-action: pan-x pinch-zoom; }
  ```

  Native vertical panning stops, pinch-zoom stays (accessibility), and carousels can still pan
  sideways. Remove the `snap-on` class whenever snap is `off`, so short-landscape phones get
  native touch scrolling back.

### A8. goTo, deep links, nav links, focus, rebuild, scroll cue

- **`film.goTo(target, opts)`** (`film.js` ~555): when snap is on, call
  `snap.glideTo(index, { cause: 'goto', immediate, duration })` instead of
  `scrollToTime(focusTime)`.
  - Multi-scene jumps glide straight through. Input is locked, and SFX are one whoosh in total
    (A10).
  - Before `ready`, keep today's `ready.then(go)`.
- **Deep links** (`handleHash`, `afterLoad → immediate`): they already go through `goTo`, so they
  land exactly on `holdY[i]` with `cur = i`.
  - `popstate` and `hashchange` behave the same.
  - services.js category slugs still call `film.goTo('categories', { immediate })`.
- **Same-page nav links** (`onClick` → `handleHash`): unchanged; they go through goTo.
- **Phone menu.**
  - The menu calls `film.stop()` when it opens. Snap must treat `lenis.isStopped` as blocked:
    keys ignored, wheel/touch handed to Lenis, which swallows them.
  - When a link is clicked, chrome.js closes the menu (`film.start()`) before the document click
    handler runs goTo, so the order is already right.
- **Focus** (`showFocused`, ~586): when snap is on and the scene differs, call
  `snap.glideTo(index, { cause: 'focus', duration: FOCUS_SCROLL_S })`.
  - `revealFocused` (pan to the focused element) only matters in pan fallback; keep it behind
    `t.pan`.
  - `partners.js:184` (`film.goTo(el)` after focus) keeps working.
- **`film.scrollToTime(time, opts)`** stays public for the fallback. In snap mode it is only safe
  for times inside the current hold.
  - `services-view.js` `panTimeFor()` returns `null` when `timing.pan === 0`, so it becomes a
    no-op automatically once scenes fit.
  - After any external `scrollToTime` glide, the native-scroll settle (A3) re-snaps it.
- **Rebuild** (resize, content change; `rebuild()` ~519):
  - when snap is on and the state is `rest`/`cooldown`, replace the anchor restore with
    `computeHolds(); snap.glideTo(snap.current, { immediate: true })`;
  - in `glide`, re-issue `glideTo(target)` with the new holds;
  - keep `anchorAt`/`timeOfAnchor` for snap `off`.
- **Scroll cue** (`layers.js` `initCue`): keep it. Scene 0's hold is `y = 0`, so `progress <
  CUE_UNTIL` is true only at rest on the opening frame, and the cue fades as soon as a preview
  starts.
  - Change `show()` to `progress < CUE_UNTIL && film.active === 0`, so a rebuild cannot flash
    it.
  - Story page: `.story-cue` keeps its "Scroll to Read" text; only the line goes (C5).

### A9. When snap is off or blocked

| condition | effect |
|---|---|
| stage height `< SHORT_H = 560` (landscape phones) | `off`: free Lenis scroll, pan fallback (B1). Re-evaluated in `measure()` on every rebuild. Toggle the `html.snap-on` class. |
| film not built yet (`!state.built`) | `rest`, but every input is swallowed (preventDefault), so a flick during the splash does not move a half-built film |
| `lenis.isStopped` (menu, or a dialog that calls `film.stop()`) | blocked: keys ignored; wheel/touch return `true` (Lenis swallows them) |
| an open modal: `dialog[open]`, `[aria-modal="true"]:not([hidden])`, or `snap.block(token)` held | blocked, as above. Page overlays (partner profile, category detail) call `film.snap.block('profile')` / `unblock('profile')`, or simply `film.stop()`/`start()` as the menu does. Give a scrollable overlay `data-lenis-prevent`. |
| focus is in a text field (`input:not([type=radio],[type=checkbox],[type=button],[type=submit])`, `textarea`, `select`, `[contenteditable]`) | **keys**: always ignored (A6). **touch**: `off` while the field is focused, so the phone keyboard can scroll the page natively. **wheel**: stays on. See the note below. On `focusout` to a non-field, if `scrollY` is not on a hold, `settle()` to the nearest. |
| an open native `<select>` popup | there is no event for it. Covered because keys are ignored while a select is focused, and wheel over the popup goes to the popup, not the page |

**Note on wheel while a field is focused (deliberate deviation).** PLAN says snap is disabled
while focus is in a field. Taken literally, a desktop user who types in a form and then turns the
wheel would free-scroll and stop half-way. That breaks the main rule: nothing is left half-way.
So only keys and touch are disabled; the wheel keeps snapping. Flag this to the reviewer.

### A10. SFX: one whoosh per scene change, not per wheel tick

`sfx.js` `hookFilm()` (~238) changes:

```js
function hookFilm(film) {
  let started = false;
  film.ready?.then(() => { started = true; });
  film.on('snapstart', ({ from, to }) => started && play(from === to ? 'tick' : 'whoosh')); // settle/edge = one soft tick
  film.on('snapend', ({ field, from }) => {                                                  // one tone if the field colour changed
    if (started && field !== film.scenes[from]?.dataset.field) play('tone', { field });
  });
  // Snap off (short-landscape fallback): today's behaviour.
  let lastY = window.scrollY;
  film.on('progress', () => {
    if (film.snap?.enabled) return;
    const y = window.scrollY; if (Math.abs(y - lastY) < SCROLL_TICK_PX) return; lastY = y;
    play('tick', { index: Math.max(0, film.active) });
  });
  film.on('scene', () => started && !film.snap?.enabled && play('whoosh'));
  film.on('field', ({ field }) => started && !film.snap?.enabled && play('tone', { field }));
}
```

- A multi-scene goTo plays one whoosh and at most one tone.
- Wheel ticks and preview scrubs make no sound.
- The `whoosh` MIN_GAP (280 ms) stays as a guard.

### A11. Public API additions (film.js return object; documented in ENGINE.md §6)

```
film.snap = {
  get enabled()          // false when off (short height) or before build
  get current()          // index rested on
  next(), prev(), to(i, { immediate, duration })
  block(token), unblock(token)   // overlays
}
events: 'snapstart' { from, to, cause }  cause ∈ wheel|touch|key|goto|focus|settle|native
        'snapend'   { index, from, field, cause }
```

`createFlowFilm` returns `snap: { enabled: false, current: active, next/prev/to → goTo,
block/unblock: noop }`. Page code can then call `film.snap.next()` (for example, a scroll cue
button) in either mode.

### A12. Module shape

```
film-snap.js  (~230 lines)
  export function createSnap({ lenis, holds, scenes, emitter, isBuilt, shortHeight })
    → { onVirtual(e), onKey(e), glideTo, settle, refresh(), setEnabled(bool), block, unblock, get current, get enabled, state }
```

- `film.js` creates it after `createLenis()`, sets the virtual hook, adds the `keydown` and
  `focusout` listeners, and calls `snap.refresh()` in `attach()`.
- Constants go at the top with comments, in the house style. No `console.*`.
- Wiring in `film.js` is about 40 changed lines. The build (`build.mjs`/esbuild) picks up the new
  import automatically.

### A13. Tests (browser QA, before pages)

1. Wheel (Chrome, Windows mouse): 1 notch → next scene; 5 fast notches → 1 scene; a notch during
   a glide → ignored.
2. Trackpad (emulate by CDP `Input.dispatchMouseEvent` type `mouseWheel` with 60 decaying deltas
   of 40→1 px): exactly 1 scene. Two bursts with a rise between them: 2 scenes.
3. A 30 px trackpad nudge, then stop → settles back after about 140 ms, with one tick.
4. Keys: each of the 7 keys. Space on a focused button activates it and does not snap. Arrows in
   the chips' radio group change the chip.
5. Touch (CDP `Input.dispatchTouchEvent`):
   - 15 % drag → back;
   - 25 % drag → next;
   - a 40 px fast flick → next;
   - horizontal swipe on a carousel → no snap;
   - pinch → zooms.
6. Deep link `services.html#legal`, `story.html#values`, back/forward: `scrollY === holdY[i]`
   exactly.
7. Phone menu open: no movement. Close → nav link → glides.
8. Resize 1366×768 → 800×500 (< 560 → free scroll + pan) → back (snap returns, rests on the
   nearest hold).
9. SFX: one whoosh per scene; goTo across 4 scenes → one whoosh.
10. fit-audit still hooks: `export function initFilm(` must keep exactly that signature (the
    audit rewrites it in flight).

---

## B. Pan becomes a fallback; flow mode uses CSS scroll-snap

### B1. film.js

- `const SHORT_H = 560;` (shared with film-snap and documented as the fallback threshold).
- `measurePan(part, allowPan)` (~173):

  ```js
  function measurePan(part, allowPan) {
    const overflow = Math.round(part.pan.offsetHeight - part.inner.clientHeight);
    // Report overflow for QA (fit-audit and DevTools can read it); never pan unless allowed.
    if (overflow > PAN_TOLERANCE_PX) part.el.dataset.overflow = String(overflow);
    else delete part.el.dataset.overflow;
    if (!allowPan || part.hasScrollBox) return 0;
    return overflow > PAN_TOLERANCE_PX ? overflow : 0;
  }
  ```

- `measurePansSliced()` and `measure()` compute `allowPan = stage.clientHeight < SHORT_H` once
  per build, store it as `state.snap = !allowPan`, and pass `{ snap: state.snap }` to
  `buildScrollMap`.
- In snap mode content that does not fit is clipped by `.scene__inner { overflow: clip }`. That
  is a visible defect, and fit-audit catches it.
- `timingFor` is unchanged: `pan = 0` gives `panStart === panEnd` and no pan segment.
- `addPan` and `revealFocused` are unchanged; they only act when `t.pan > 0`.
- `film-map.js`:
  - the header comment changes: "pan: only below 560 px stage height (fallback)";
  - `addHold`'s pan branch is unchanged;
  - add the `{ snap }` option (A2).
- `.scene__scroll` and `hasScrollBox` stay until the legal page spec replaces its scroll boxes
  with paging. Then delete:
  - the `.scene__scroll` rules in base.css (~331–339 and 927);
  - `hasScrollBox` and the `data-lenis-prevent` tagging in `prepareScene`;
  - `legal-fx.js` `tickOnScroll` and `labelWhenScrollable`.

### B2. Flow / reduced-motion mode

The same scene box is used in both modes, so one fit design serves both. Change these rules in
base.css §6 and §18:

```css
/* §6: the scene box rules lose their html.film prefix (both modes share the geometry) */
.scene__inner { position: absolute; top: var(--scene-top); bottom: var(--bottom-h); left: 0; right: 0;
  display: flex; flex-direction: column; padding-inline: var(--page-pad); overflow: clip; overflow-clip-margin: 8px;
  perspective: 1400px; container: scene / size; }
.scene__pan { margin: auto; width: 100%; max-width: var(--max-w);
  padding-block: var(--scene-pad-top) var(--scene-pad-bottom); }

/* §18 flow mode */
html:not(.film) { scroll-snap-type: y mandatory; }
html:not(.film) .scene {
  position: relative; height: 100vh; height: 100svh;      /* exactly one screen */
  padding: 0;                                              /* was padding-block: var(--space-2xl) */
  scroll-snap-align: start; scroll-snap-stop: always;
  background: var(--field-bg, var(--bg)); color: var(--fg);
}
/* delete: html:not(.film) .scene:first-child { padding-top … }   (the box already starts under the header) */
/* delete: scroll-margin-top on .scene (the scene starts at 0; the header overlays its top band, which is padding) */
/* delete: html:not(.film) .scene__inner { position: relative; … max-width … } (replaced by the shared rule) */
/* delete: html:not(.film) body { padding-bottom: var(--bottom-h) } (phone bar gone) */

@media (max-height: 559px) {            /* the documented fallback in both modes */
  html:not(.film) { scroll-snap-type: y proximity; }
  html:not(.film) .scene { height: auto; min-height: 100svh; }
  html:not(.film) .scene__inner { position: relative; top: auto; bottom: auto;
    padding-top: var(--scene-top); container-type: normal; overflow: visible; }
  html.film .scene__inner { container-type: normal; }   /* pan needs content-sized height */
}
```

- `film-flow.js` `goTo` keeps `scrollIntoView({ block: 'start' })`. Snap mandatory lands it
  exactly.
- Keyboard: the browser's own PageDown, Space and arrows snap scene by scene under mandatory
  snapping. Nothing else is needed.
- Reduced motion: `scroll-behavior: auto` is already forced (§19), so snaps are instant.
- Story page: `story.css` flow rules (~186–197) hide globe boxes. With fixed-height scenes they
  still fit, but page specs must re-check them with `fit-audit --flow`.
- **Size containment caution.** `container: scene / size` needs a definite height. It has one in
  both modes at ≥ 560 px (absolute top/bottom inside a 100svh scene), and it is switched off
  below 560 px. Page CSS may then use `cqh` and `@container scene (max-height: 620px) { … }` to
  step down layouts by the *real* box height, with the header already subtracted.

---

## C. Removals: every file and line

Line numbers are as read on 2026-10-17 and may move; find each change by the quoted text.

### C1. HUD (`01 / 08 · Title · 00:00`, its bar and corners)

| file | change |
|---|---|
| `assets/js/layers.js` | Delete `pad2`, `timecode`, `HUD_HTML`, `initHud()` (~192–228), and the call `initHud(stage, film);` (~256). Header comment line 2: "star field, film grain and scroll cue". |
| `assets/js/film-alive.js` | Delete `HUD_DRIFT_PX` (~13), `const hud = stage.querySelector('.hud');` (~49) and `if (hud) write(hud, …)` (~58). Header comment: drop "and the HUD leans a little". |
| `assets/js/film-events.js` | Comment only: `sceneTitle` "for the HUD" → "for the scene event". The function stays (the `scene` event payload uses it). |
| `assets/css/base.css` | Delete §7 `.hud…` rules (~385–409, including `.hud__sep` and `.hud__time::before`). Line ~907: remove `html:not(.film) .hud,` from the flow-mode hide list. |
| `index.html` ~94, `legal.html` ~99, `services.html` ~93, `story.html` ~93, `partners.html` ~93 | Delete `<div class="hud"></div>`. |
| `ENGINE.md` | §1 skeleton: remove `<div class="hud"></div>` (~86) and `.hud` from the "engine creates missing layers" line (~111). §3 `data-title`: "HUD title" → "scene title (scene event)". §6/§7 (~224, ~230): drop HUD mentions. §9 class list (~263): drop `.hud`. |

### C2. Floating WhatsApp button and phone bottom bar

| file | change |
|---|---|
| `assets/js/chrome.js` | Header comment (1–8): drop "floating WhatsApp button (desktop/tablet), sticky phone action bar (<760px)". Delete `floatHTML`, `barHTML` (~133–143) and `mount('div', 'wa-float-wrap', …)` / `const bar = mount('div', 'phone-bar', …)` (~259–260). Delete `setBar()` from the returned API (~265–278) and its JSDoc (~249: "Returns { onMenuToggle, closeMenu, header }"). `BEHIND_MENU` (~95) → `'.skip, .stage, .site-header > .brand, .site-header > .site-header__actions'`. Keep `ARROW` (placeholderCard uses it) and `mount()` (skip link and header). |
| `assets/js/home.js` | ~96: delete `chrome.setBar({ label: 'Get My Introduction', href });`. If `wireIntroForm(chrome)` no longer needs `chrome`, drop the parameter and update its caller. |
| `assets/js/partners.js` | Delete `BAR_LABEL` (~15) and `chrome.setBar({ label: BAR_LABEL, href });` (~26). Drop the `chrome` parameter of `wirePartnerLinks` if unused, and update its caller. |
| `assets/js/services.js` | Delete `BAR_DEFAULT` (~30), `chromeApi` (~32, ~79), `categoryLink`, `FOUNDER_BARS`, `barFor`, `updateBar` (~91–119), the calls `updateBar();` (~60, ~128), `onChange: () => updateBar(),` (~66; drop the option or make it `() => {}` if `initFinder` requires it) and `film.on('scene', ({ id }) => updateBar(id));` (~157). Imports: drop `finderRequestMessage`, `pageLink` (whatsapp.js) and `FOUNDER_REQUEST` (services-data.js) if no other use remains, and `titleCase` if `barFor` was its only user. Fix the comment at ~60. `{ film, chrome } = boot(…)` → `{ film } = boot(…)`. |
| `assets/js/interact.js` | ~25: `const MAGNETIC = '[data-magnetic], .btn, .chip, .icon-link, .nav-toggle';` ~26: `const MAGNETIC_SKIP = '[data-magnetic="none"], .btn--block';` Comment ~21: "the 'Pause animation' flow mode" → "the flow mode". |
| `assets/js/textfx.js` | ~304 and ~309: drop the `.phone-bar` guards (`prepareRoll(el)` unconditionally / `if (el) prepareRoll(el)`). |
| `assets/css/base.css` | ~96: `[data-field="ink"], .field--ink, .on-ink, .phone-bar {` → drop `, .phone-bar`. Delete §9 (~610–648: `.wa-float`, `.phone-bar`, media query, `html.nav-open …`), ~720 `.phone-bar .btn--primary …`, ~900 `.phone-bar :focus-visible …`, ~940 `html:not(.film) body { padding-bottom: var(--bottom-h); }`. Header comment section list: "9 whatsapp" → renumber or rename "9 (removed)". `--bottom-h`: see D. |
| `assets/css/fx.css` | ~104: drop `.wa-float`, `.motion-toggle`, `.sound-toggle` from the selector list. ~114–115: drop `.wa-float:active`, `.sound-toggle:active`, `.motion-toggle:active`. ~252: `.chip, .btn { translate: none !important; }`. |
| `ENGINE.md` | ~110 "Do not add the header, the WhatsApp float, the phone bar…" → "the header or the skip link". §8 (~236): delete the float/phone-bar/`setBar` paragraph. §11 magnetic table (~340) and touch row (~348): drop `.wa-float` and the toggles. §11 letter-roll row (~323): drop "the phone bar". |
| `README.md` | Check for the phone bar and float wording; none found except the motion lines in C3. |

**Recommendation for the chrome/page specs.** On phones (< 760 px), `.site-header__actions` is
`display:none` (base.css ~605). With the phone bar gone, phones have **no persistent WhatsApp
action**. Show a compact icon-only WhatsApp button in the phone header: `.site-header__actions {
display:flex }` with only the `btn--sm` link, its label made visually-hidden, and a 44 px
target. It fits the 56–64 px header.

### C3. "Pause animation" toggle (motion) and sound toggle

| file | change |
|---|---|
| `assets/js/chrome.js` | Header comment (~7–8): drop the sound/pause sentence. Delete `ICON_SOUND` (~38–44), `motionToggleHTML` (~57–61), `soundToggleHTML` (~63–67), `<div class="site-nav__toggles">…</div>` (~80), and `${soundToggleHTML('bar')}` / `${motionToggleHTML('bar')}` (~87–88). `BEHIND_MENU`: done in C2. |
| `assets/js/motion-toggle.js` | **Delete the file.** |
| `assets/js/main.js` | Delete `import { initMotionToggle } …` (~23) and `initMotionToggle({ header: chrome.header, film });` (~37). The comment block (~14–16) is fine. Add a one-time cleanup in `boot()`: `try { localStorage.removeItem('cs-motion'); localStorage.removeItem('cs-sound'); } catch { /* storage blocked */ }`. Without it, visitors who once paused or muted would be stuck in flow mode or silence with no toggle left. |
| `assets/js/motion-pref.js` | Rewrite to OS-only, as PLAN asks ("keep motion-pref.js reading the OS preference"): `export const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'; export function prefersReducedMotion() { return window.matchMedia?.(REDUCE_QUERY).matches ?? false; }`. Delete the storage, the URL `?motion=off`, `applyMotionChoice` and `takeFocusReturn`. |
| `assets/js/film.js` | ~19–20 comment: drop "the visitor's 'Pause animation' choice (motion-pref.js)". ~27: `import { prefersReducedMotion, REDUCE_QUERY } from './motion-pref.js';` and drop the local `REDUCE_QUERY` (~60). ~104–107 `canRunFilm`: `return !prefersReducedMotion() && !!(window.gsap && window.ScrollTrigger && window.Lenis);` |
| `assets/js/sfx.js` | Header comment (~10–12): drop the toggle sentence. Delete `STORAGE_KEY`, `MUTED_VALUE`, `TOGGLE`, `LABEL_ON`, `LABEL_OFF`, `readMuted`, `writeMuted`, `renderToggles`, `initToggles` and the `initToggles()` call. `state.muted: false`. `setMuted(m)` stays as an in-memory API (no storage). `soundForClick`: delete the `TOGGLE` line. A10 changes `hookFilm`. |
| `assets/css/base.css` | Delete ~541–565 (`.motion-toggle…` including both media queries). |
| `assets/css/fx.css` | Delete ~197–218 (`.sound-toggle…`, `.site-nav__toggles`, both media queries). Selector lists: done in C2. |
| `index.html` ~15–17, `legal.html` ~15–17, `services.html` ~14–16, `story.html` ~14–16, `partners.html` ~14–16 (inline head script) | Delete the comment `/* The visitor's "Pause animation" choice … */`, the `?motion=off` regex line and the `cs-motion` try line. Keep the `prefers-reduced-motion` check. |
| `ENGINE.md` | §1 skeleton head script (~36–40): same deletion. §7 (~226–230): delete the "Pause animation" paragraph; flow mode = OS reduced motion or missing libraries. §11 Sound (~361–366): "SFX are always on (no toggle); `sfx.setMuted()` exists for code only, not persisted". |
| `README.md` ~22 | "add `?motion=off` … press **Pause animation**" → "turn on 'reduce motion' in the operating system (or emulate it in DevTools › Rendering)". ~133: "with motion on and with reduced motion emulated". |

**WCAG 2.2.2 note for the reviewer.** The pause toggle met "Pause, Stop, Hide" for the star
twinkle and the grain loop, which run for more than 5 s. Removing it was the owner's
instruction. The mitigations are:
- reduced motion (OS) still gives flow mode with no stars and no grain;
- the stars' idle twinkle is slow;
- `.grain` is already static on phones.

The proposal: also stop the grain animation (`animation: none`) when the scene is at rest for 5 s.
It is optional and outside the engine.

### C4. Decorative dashes and lines before text

In-word hyphens ("30-day", "Cash-Flow") and file-header comment dashes stay.

| file | element | change |
|---|---|---|
| `assets/css/base.css` ~405 | `.hud__sep` | removed with the HUD (C1) |
| `story.html` ~109 | `<span class="story-cue__line"></span>` before "Scroll to Read" | delete the span |
| `assets/css/story.css` ~61 | `.story-cue__line {…}` | delete; `.story-cue` `gap: 12px` becomes harmless |
| `story.html` ~192 | `<span class="story-ref__rule" aria-hidden="true"></span>Mark 11:24` | delete the span |
| `assets/css/story.css` ~140 | `.story-ref__rule {…}` | delete; `.story-ref` `gap` harmless |
| `assets/css/partners.css` ~110 | `.tier__list > li::before { content: "\2014"; … }` ("— " list prefix) | delete the rule and the hanging indent `padding-left: 1.1em; text-indent: -1.1em` (~109) |
| `assets/css/partners.css` ~147–152 | `.ask__list > li::before { content: "\2014"; position:absolute; … }` | delete; also remove the `padding-left` on `.ask__list > li` that made room for it (check the rule just above) |
| `assets/css/base.css` ~281 | `.lead-rule { border-top: 2px solid var(--accent); padding-top: var(--space-m); }`: a gold rule above eyebrows and blocks | make it `.lead-rule { }` (or delete the class from the markup). Used at `index.html` ~112 (intro form), `partners.html` ~311 (apply form), `story.html` ~206 (mission paragraph) and `services-categories.js` ~83 (`cat-detail__ours`). It also frees about 22 px per use. |
| `story.html` ~122 + `story.css` ~65 + `story.js` ~148–151 | `.story-rule` (120 px gold line under the "Where It Began" heading) | delete the div and the CSS. In story.js delete `ideaTweens` and its `film.on('build', …)` registration. Otherwise `tl.fromTo(null)` makes GSAP warn "target not found". |
| `legal.html` ~138, 168, 202, 233, 266 + `legal.css` ~148–154 + `legal-fx.js` ~31–38 | `.legal-rule` (64 px line before the "Draft · Updated [date]" meta) | delete the 5 spans and the CSS. `legal-fx.js` `addRuleDraw` already returns when it finds no rule (`if (!rule) return;`), but delete it and its registration for cleanliness. |
| `legal.html` ~91 | `<span class="legal-draft__tag">Draft</span> — to be reviewed…` (an em dash used as a separator before text) | → `<span class="legal-draft__tag">Draft</span> To be reviewed by a lawyer in Canada before launch`. The tag already separates it visually. Confirm in the legal page spec. |
| JS-generated strings | none found: no `"— "` or `&mdash;` prefixes in `assets/js` strings | nothing to do |

**Keep** these. They are structural graphics, not dashes before text:

- `.process__line` (home timeline connector);
- `.flow__line` (partners timeline);
- `.offer__rule` (the card's top accent);
- `.splash__line` (progress bar);
- `.scroll-cue` (vertical cue, not before text);
- link and nav underlines (`::after`);
- `.notice` `border-left`: the compliance callout marker. Removing it would weaken the notice.
- `.ticks > li::before` ✓ (a check mark, not a dash).

The page specs may still drop `.offer__rule` for space.

---

## D. Shared fluid scale in `base.css` (tokens)

### D1. Principle

- **Type** scales on a fit unit, `--u = min(1vw, 1.5svh)`, so it shrinks on short laptop screens
  (16:9 at 1366×768 and 1280×720), not only on narrow ones.
  - The 1.5 ratio means anything wider than 3:2 is height-bound.
  - Phones and portrait tablets stay width-bound, which gives today's sizes.
- **Vertical spacing** scales on `svh`.
- **Horizontal spacing** stays on `vw`.
- No fixed px heights for content.

### D2. Tokens (replace the ones in §1 `:root`)

```css
:root {
  /* fit unit: 1vw, but never more than 1.5% of the screen height */
  --u: min(1vw, 1.5svh);

  /* display type (same formulas as today with vw → --u; floors slightly lower for phones) */
  --fs-hero: clamp(2.25rem, calc(1.1rem + 5 * var(--u)), 7.75rem);
  --fs-d1:   clamp(2rem,    calc(1.2rem + 3.9 * var(--u)), 5.25rem);
  --fs-d2:   clamp(1.75rem, calc(1.1rem + 2.6 * var(--u)), 3.75rem);
  --fs-d3:   clamp(1.375rem, calc(1rem + 1.3 * var(--u)), 2.125rem);
  --fs-d4:   clamp(1.125rem, calc(0.95rem + 0.45 * var(--u)), 1.375rem);
  --fs-lead: clamp(1rem, calc(0.94rem + 0.35 * var(--u)), 1.25rem);
  /* --fs-body 1rem, --fs-small, --fs-xs unchanged (inputs must stay ≥ 16px: no iOS zoom) */

  /* spacing: small steps fixed, large steps height-aware */
  --space-m:   clamp(12px, 2.2svh, 20px);
  --space-l:   clamp(16px, 3.2svh, 32px);
  --space-xl:  clamp(20px, min(5vw, 5svh), 72px);
  --space-2xl: clamp(28px, min(9vw, 8svh), 140px);
  --gap-row:   clamp(12px, min(3vw, 3svh), 40px);
  /* --space-2xs/xs/s, --gap-col, --page-pad, --max-w unchanged */

  /* chrome */
  --header-h: clamp(56px, 7svh, 76px);
  --bottom-h: env(safe-area-inset-bottom, 0px);   /* was 72px: HUD/float reserve, gone */

  /* the scene box (identical in film and flow mode) */
  --scene-top: calc(var(--header-h) + var(--banner-h, 0px));
  --scene-h: calc(100svh - var(--scene-top) - var(--bottom-h));
  --scene-pad-top: clamp(8px, 2.5svh, 32px);
  --scene-pad-bottom: clamp(12px, 3svh, 40px);
  --scene-safe-h: calc(var(--scene-h) - var(--scene-pad-top) - var(--scene-pad-bottom)); /* content budget */
  --scene-safe-w: min(var(--max-w), 100vw - 2 * var(--page-pad));

  /* media and 3D panels: size by the budget, never a fixed height */
  --media-h: clamp(160px, 40svh, 560px);       /* video frame, portrait, map */
  --panel-max-h: var(--scene-safe-h);
}
@media (max-width: 759px) {
  :root { --header-h: clamp(56px, 7.5svh, 64px); }   /* --bottom-h phone override deleted (phone bar gone) */
}
```

Values at the 9 contract viewports, computed with the formulas above (px):

| viewport | --u | header | box (= scene-h) | pad t/b | **budget** | hero (today) | d1 (today) | d2 (today) | space-l / xl / 2xl |
|---|---|---|---|---|---|---|---|---|---|
| 1920×1080 | 16.2 | 76 | 1004 | 27/32 | **945** | 99 (114) | 82 (84) | 60 (60) | 32 / 54 / 86 |
| 1536×864 | 13.0 | 60 | 804 | 22/26 | **756** | 82 (94) | 70 (81) | 51 (59) | 28 / 43 / 69 |
| 1440×900 | 13.5 | 63 | 837 | 23/27 | **788** | 85 (90) | 72 (77) | 53 (57) | 29 / 45 / 72 |
| 1366×768 | 11.5 | 56 | 712 | 19/23 | **670** | 75 (86) | 64 (74) | 48 (55) | 25 / 38 / 61 |
| 1280×720 | 10.8 | 56 | 664 | 18/22 | **624** | 72 (82) | 61 (71) | 46 (52) | 23 / 36 / 58 |
| 1024×768 | 10.2 | 56 | 712 | 19/23 | **670** | 69 (69) | 59 (61) | 44 (46) | 25 / 38 / 61 |
| 768×1024 | 7.7 | 72 | 952 | 26/31 | **896** | 56 (56) | 49 (51) | 38 (39) | 32 / 38 / 69 |
| 390×844 | 3.9 | 63 | 781 | 21/25 | **734** | 37 (40) | 34 (38) | 28 (30) | 27 / 20 / 35 |
| 360×740 | 3.6 | 56 | 684 | 19/22 | **643** | 36 (40) | 33 (38) | 28 (30) | 24 / 20 / 32 |

Compared with today's box (header 76 / 64 and `--bottom-h` 72 / 76), the scene box gains:

| viewport | today | proposed | gain |
|---|---|---|---|
| 1366×768 | 620 | 712 | +92 px |
| 1280×720 | 572 | 664 | +92 px |
| 390×844 | 704 | 781 | +77 px |

fit-audit already measures with `--bottom-h: 0`, so its current boxes are 692 / 644 / 780. The
legal page is less by `--banner-h`.

The header at 56 px still fits:
- the 36 px monogram;
- the 40 px `btn--sm`;
- the 44 px nav-toggle target.

### D3. Rules that use the tokens (base.css §6 and §18, see also B2)

- `.scene__inner`: `top: var(--scene-top); bottom: var(--bottom-h);` (today these are written
  out by hand). Add `container: scene / size` (≥ 560 px tall only).
- `.scene__pan`: `padding-block: var(--scene-pad-top) var(--scene-pad-bottom);` instead of
  `var(--space-s)`.
- Delete `html.film .close { padding-top: clamp(24px, 9vh, 110px); }` (~864). The scene pad
  replaces it, and that rule alone costs up to 110 px.
- Delete `--scroll-max` / `.scene__scroll` max-height (~332) once legal is paged (B1).
- `.site-header { height: var(--header-h); }` is unchanged and now fluid. The phone menu padding
  already uses `--header-h`.
- Utilities for the page specs:

  ```css
  .fit-h  { max-height: var(--scene-safe-h); }            /* a block that must never exceed the budget */
  .fit-media { height: var(--media-h); width: auto; aspect-ratio: var(--ar, 16 / 9); max-width: 100%; }
  @container scene (max-height: 640px) { .short-hide { display: none; } }   /* secondary decoration only, never compliance copy */
  ```

- Short-screen guard for desktop widths, so 1280×720 can drop one more step without page CSS:

  ```css
  @media (min-width: 760px) and (max-height: 760px) {
    :root { --space-xl: clamp(16px, 4svh, 40px); --space-2xl: clamp(24px, 6svh, 64px); }
  }
  ```

### D4. Fallback (< 560 px tall)

- No height-bound promises: `--u` already floors through the clamps.
- Scenes may exceed the box. Film mode pans (B1) and flow mode uses `min-height` with proximity
  snapping (B2). This is documented in ENGINE.md as the only allowed overflow.
- fit-audit `--fallback` notes it rather than failing it.

---

## E. ENGINE.md changes (summary)

- **§1 skeleton:**
  - head script without the pause/motion lines;
  - no `.hud` div;
  - the "engine creates layers" list drops `.hud`.
- **§3:** `data-weight` now scales the transition span (still valid). `data-rest` is ignored in
  snap mode.
- **§6 Film API:**
  - `film.snap` (A11);
  - the events `snapstart` and `snapend`;
  - `goTo` lands on hold points;
  - `scrollToTime` is for the fallback only.
- **§7 Flow mode:**
  - OS reduced motion or missing libraries only;
  - CSS scroll-snap;
  - each scene exactly 100svh;
  - the same scene box.
- **§8 Chrome:**
  - header + menu + footer only;
  - no float, phone bar or `setBar`;
  - the phone-header WhatsApp icon, if adopted (C2).
- **§9 CSS catalogue:**
  - the new tokens (D2);
  - `.fit-h`, `.fit-media`, `.short-hide`, the `scene` container;
  - remove `.hud`, `.wa-float`, `.phone-bar`, `.motion-toggle`, `.sound-toggle`.
- **"Scroll cost (film-map.js)"** is rewritten as **"Scroll and snapping"**:
  - the hold points;
  - the thresholds: 18 % advance, 50 px notch, 140 ms idle, momentum rise 1.6×;
  - glide 1.0 s, settle 0.42 s, jump 0.9–1.8 s;
  - the < 560 px fallback with pan;
  - `data-snap="off"` and `data-snap-keys="off"`.
- **§11:**
  - the magnetic and touch tables without the float and toggles;
  - Sound: always on; whoosh per snap.
