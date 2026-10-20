# Review · engine-devices · round 1

Read-only review of T5 and T7. Scope: the cut input lock, trackpad flings, wheel bursts, keyboard paging, touch-cut on emulated phones (390×844, 360×740), the field hold, deep links and `data-alias`, and View Transitions between pages.
Live checks ran on `dist` (built 2026-10-19 21:14) through my own `node serve.mjs dist 8453`, which I stopped afterwards. I used headless Chrome through `tools/lib/cdp.mjs` with an isolated profile. I edited no source files.

## Verdict

The desktop input engine passes everything I could test. Touch-cut passes "one swipe = one scene". Two real defects fail T7 or W6/E7:

1. **High:** on a live swipe in touch-cut, the next scene's text shows over the wrong field. **T7 fails.**
2. **High:** the cross-document View Transition never runs on `dist`, and every page-to-page navigation logs an uncaught `InvalidStateError`. **W6 fails, and T3 fails across navigations.**

## Passes, with numbers

**Desktop, cut mode, index at 1440×900**

Trackpad flings are synthetic wheel streams: a 4→60 px ramp, then decay ×0.93 every 16 ms, 62 events.

| Input | Result |
|---|---|
| One fling | 0→1 |
| Second fling | 1→2 |
| Hard fling (peak 140, decay 0.96, about 110 events) | 0→1, no momentum skip |
| Mouse notch burst (5×100 px at 40 ms) | 0→1 |
| Notches 3×100 px at 250 ms | 0→2 (the 3rd notch landed after 70% of the cut and queued, as specified) |
| Input lock: PgDn at 0, 300 and 750 ms | PgDn at 300 ms dropped (still cutting); PgDn at 750 ms queued; final scene 2 (expected 2) |
| Space | +1 |
| End | → credits (6) |
| Home, then End 150 ms later | interrupts and lands on 6 |

- **Field and scene:** after each of 8 PgDn landings, `html[data-field]`, `.fields[data-field]` and the scene's `data-field` match: **0 mismatches.**
- **Field hold** (partners `#apply`, `#pa-business` focused, an unasked `scrollTo(+900)`): the scroll is reverted to the slot within 30 ms, and the scene stays `apply`. PgDn inside the field does not cut.
  - Note for tool authors: this needs `Emulation.setFocusEmulationEnabled`. Without it, headless Chrome sends no `focusin`, and the hold looks broken (a false positive I hit first).
- **Deep links** (each a fresh load):

  | Hash | Lands on | Dialog |
  |---|---|---|
  | `#services` | situations | none |
  | `#faq` | close | `faq-dialog` opens |
  | `#partners` | close | none |
  | `#find` | find | none |
  | `#compare` | one-message | none |
  | `#nope` | hero | none |

  A `hashchange` to `#how-it-works` goes to one-message, `#faq` opens the dialog, and `history.back()` goes to one-message.
- **Touch deep links** (390×844): `#faq` lands on close with `top` 0, the field correct and `faq-dialog` open; `#services` and `#how-it-works` are correct; `#credits` loads with `top` 0 on index and services at both sizes.
- **Console:** 0 errors and 0 warnings across all desktop and touch runs on a single page.

**Touch-cut (Input.dispatchTouchEvent swipes; `synthesizeScrollGesture` does not scroll in headless)**

| Flick | 390×844 index | 390×844 partners | 360×740 index | 360×740 partners |
|---|---|---|---|---|
| mid (40% height) | 0→1→…→6, every step +1 | every step +1 | every step +1 | every step +1 |
| long (80% height, fast) | every step +1, **no skips** | every step +1 | every step +1 | every step +1 |
| short (18%) | every step +1 | every step +1 | 2 stalls (no move), 0 skips | 3 stalls, 0 skips |

- After settling, the `.fields` field always equals the scene's field, and no text stays visible over the wrong field.
- **Sheet keyboard:** the WhatsApp sheet opens on one-message. With the layout viewport shrunk to 55% (Android resize-content), the scene stays one-message and `scrollY` stays at 844 (or 740). It restores the same way and closes on Escape with the same scene.
  - Limits: the sheet's first step has no text input, so I could not focus a field. Emulation cannot show the iOS visual-viewport-only keyboard.

**T5:** `shots-r5/review-1/seek-test.txt` shows 0 failing frames across 4 pages × 2 viewports at tier A. That test only seeks *programmatic* cuts, though. It does not cover live touch swipes, which is where defect 1 lives.

## Defects

### 1 · High · Touch-cut: the in group shows text over the wrong field during a live swipe (T7, §9.3)

- **Evidence:** `shots-r5/review-1/engine-devices/strip-index-1.jpg`, `-3.jpg` and `-4.jpg`. Each is 6 frames at about 390, 475, 570, 650, 750 and 1290 ms after a 340 px swipe at 390×844.
  - **hero → one-message:** in frame 2, the bone scene's eyebrow and italic list render on ink, before the bone disc reaches them.
  - **founder → find:** in frames 2-3, the ink scene's white body copy, "Need Someone We…" and a gold CTA render on the gold field. The text is low contrast, and the CTA is gold on gold.
- **Probe:** a probe 250 ms after the swipe finds the new scene's `.scene__pan` at opacity 1.00 while `.fields` still shows the old field. It reproduces on every field-changing swipe on index and partners, at both phone sizes.
- **Cause** (`site/assets/js/film.js`):
  - The 0.35 crossing starts `irisTo()` (`onTouchField`): 0.62 s with `expo.inOut`, so the disc stays small for the first ~250 ms.
  - The 0.6 crossing (`onTouchEnter` → `play(index, { cause: 'touch' })`) builds a touch cut with in = 0 (cut.js `c = m || !t`), so the in group plays at once.
  - `showOwn()` also fades the current pan to 1 over 0.2 s.
  - Nothing waits for the iris to cover the text. A real swipe crosses 0.35 and 0.6 within about 100 ms, so on devices it is worse than in emulation.
- **Fix** (in `film.js`): in touch-cut, when `state.touchIris` is running toward the entered scene's field, hold the in group (and `showOwn`) until the iris reaches its half or `TOUCH_FADE_AT` (via `onHalf`, or by delaying the cut timeline to `running.tl` progress ≥ 0.5). Alternatively, start the in group at the iris's `onHalf`. Then add a live-swipe pass to `tools/seek-test.mjs`, so T5 covers this path.

### 2 · High · View Transitions never run on dist: the new page reveals before its stylesheet (W6 / E7, T3)

- **Evidence:** I logged `pageswap` and `pagereveal` from a pre-document script while clicking the header "Services" link on index at 1440×900.
  - `index swap vt=true`, then `services reveal vt=false @10 ms`, followed by `InvalidStateError: Transition was aborted because of invalid state. ViewTransition opt-in disabled`, uncaught on services.html.
  - The same happens at 390×844.
- **Cause and confirming test:**
  - With a CDP response rewrite that moves `<link rel="stylesheet">` above the inline loader script, I got `services reveal vt=true @122 ms`, `ready ok` and **0 errors**.
  - A control pair of plain pages also transitions fine in the same headless Chrome.
  - So the built head order (`build.mjs` `assetTags`: fonts preload → `scriptLoader` → stylesheet) lets the first render, and with it `pagereveal`, happen before the stylesheet carrying `@view-transition { navigation: auto; }` is discovered.
- **Fix** (`build.mjs`): emit the stylesheet before `scriptLoader(js)`, or add a render-blocking opt-in (`<link rel="expect" href="#main" blocking="render">` or equivalent). Then re-check that `pagereveal` reports `vt=true`.

### 3 · Medium · The `pagereveal` handler is registered too late, so the circle never starts at the clicked link (W6, §9.7)

- **Evidence:** after every navigation (including the fixed-order run above), `sessionStorage['cs-vt']` is still set and `--vt-x` is empty on the new page. The handler removes the key first thing, so it never ran.
- **Cause:** `site/assets/js/main.js` `viewTransitions()` runs inside `boot()`. The build's loader injects the entry module only after `first-contentful-paint`, and `pagereveal` fires before the first render. The circle therefore always opens from 50% 50%, and a stale `cs-vt` from a cancelled navigation is reused later.
- **Fix:** move the `pagereveal` half, which reads `cs-vt` and sets `--vt-x/--vt-y`, into a classic inline head script. Either `build.mjs` injects it next to the mode script, or it goes in the source head of `site/*.html`. Keep the click and `pageswap` halves in `site/assets/js/main.js`.

### 4 · Low · The VT circle has no gold edge (W6)

- W6 says "a 450 ms gold-edged circle". `site/assets/css/base.css` §19 animates only `clip-path: circle()`.
- **Fix:** add a gold ring, for example a radial-gradient mask edge on `::view-transition-new(root)`, or drop "gold-edged" from DIRECTION. It is cosmetic and only matters once defects 2 and 3 are fixed.

## Not defects (checked)

- **Duplicate `view-transition-name: cs-mark`:** both the header and the menu `.brand .monogram` carry it. But a menu link click closes the dialog synchronously (`chrome.js`) before `pageswap` captures, so they never render together.
- **Key auto-repeat** (12 presses at 33 ms) → +2. That is one step plus one queued step after 70%, which is still at most one scene per cut.
- **Short 18% flicks stalling at 360×740:** this is native mandatory snap returning to the nearest section. There were 0 skips.

## Left undone

- No real iOS Safari or Android device was available. Touch results are Chrome emulation (`pointer: coarse`, `hover: none`, touch events); iOS momentum and visual-viewport keyboard behaviour are untested.
- I did not record T7 screen recordings.
