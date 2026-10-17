/**
 * Bring an element of the active scene into view after the visitor acts
 * (picks a category on a stacked layout, picks a place in the finder).
 *
 * Film mode: a scene taller than the screen pans with scroll, so we scroll
 * the film to the pan position that shows the element near the top. The
 * change of content usually makes the engine rebuild (debounced ~200 ms),
 * and a rebuild restores the old scroll position, so we wait for it first.
 * Focus stays where it is (on the control the visitor used).
 * Flow mode (reduced motion): plain, instant scrollIntoView.
 */
const TOP_GAP_PX = 24; // space left above the element once it is in view
const REBUILD_WAIT_MS = 400; // longer than the engine's rebuild debounce
const SCROLL_S = 0.6;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function isVisibleIn(rect, box) {
  return rect.top >= box.top && rect.bottom <= box.bottom;
}

/** Film time at which `target` sits TOP_GAP_PX below the top of its scene, or null. */
function panTimeFor(film, target) {
  const timing = film.timeOf(target);
  if (!timing || !timing.pan || !timing.el.classList.contains('is-active')) return null;
  const inner = timing.el.querySelector('.scene__inner');
  const pan = timing.el.querySelector('.scene__pan');
  const box = inner.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  if (isVisibleIn(rect, box)) return null;
  const natural = rect.top - box.top - window.gsap.getProperty(pan, 'y');
  const want = clamp(natural - TOP_GAP_PX, 0, timing.pan);
  return timing.panStart + (want / timing.pan) * (timing.panEnd - timing.panStart);
}

/** Run `fn` once the rebuild caused by a content change has finished (or none came). */
function afterRebuild(film, fn) {
  let done = false;
  let off = () => {};
  const finish = () => {
    if (done) return;
    done = true;
    off();
    fn();
  };
  // 'rebuilt' fires after the engine has restored the scroll position.
  off = film.on('rebuilt', finish);
  setTimeout(finish, REBUILD_WAIT_MS);
}

/** Returns bringIntoView(target) bound to `film`. */
export function createViewHelper(film) {
  return function bringIntoView(target) {
    if (!target) return;
    if (!film.enabled) {
      // 'center' keeps it clear of the fixed header and the phone bar.
      target.scrollIntoView({ block: 'center' });
      return;
    }
    afterRebuild(film, () => {
      const time = panTimeFor(film, target);
      if (time !== null) film.scrollToTime(time, { duration: SCROLL_S });
    });
  };
}
