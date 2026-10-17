/**
 * "Pause animation" toggle (WCAG 2.2.2 pause/stop/hide, and a plain page for
 * screen-reader and keyboard users who prefer normal document order).
 *
 * chrome.js renders two copies: one in the header (760 px and up) and one in
 * the phone menu. Both are hidden when there is nothing to pause, i.e. when the
 * operating system already asks for reduced motion or the film could not start.
 */
import { motionPaused, applyMotionChoice, takeFocusReturn } from './motion-pref.js';

const TOGGLE = '[data-motion-toggle]';
const LABEL_PAUSED = 'Animation paused. Press to play it again.';
const LABEL_PLAYING = 'Pause the background animation and show a plain page.';

const visible = (el) => el.getClientRects().length > 0;

function render(buttons, paused) {
  buttons.forEach((button) => {
    button.hidden = false;
    button.setAttribute('aria-pressed', String(paused));
    button.title = paused ? LABEL_PAUSED : LABEL_PLAYING;
  });
}

/** Focus the toggle the visitor can see, or the menu button that holds it on phones. */
function returnFocus(header, buttons) {
  const target = buttons.find(visible) || header.querySelector('.nav-toggle');
  target?.focus({ preventScroll: true });
}

/** After the reload: land on the scene the visitor was on, then focus the toggle. */
function resume(header, buttons, film) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((done) => window.addEventListener('load', done, { once: true }));
  Promise.all([film.ready, loaded]).then(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) film.goTo(id, { immediate: true });
    returnFocus(header, buttons);
  });
}

/** Wire the toggles. `film` is the film or flow API from film.js. */
export function initMotionToggle({ header, film }) {
  const buttons = Array.from(document.querySelectorAll(TOGGLE));
  const paused = motionPaused();
  const returning = takeFocusReturn();
  if (!buttons.length || (!film.enabled && !paused)) return;
  render(buttons, paused);
  buttons.forEach((button) => button.addEventListener('click', () => {
    const scene = film.scenes[film.active];
    applyMotionChoice(!paused, { sceneId: scene?.id || '' });
  }));
  if (returning) resume(header, buttons, film);
}
