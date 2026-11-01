/**
 * The service photos (owner, 2026-11-01): a toned Unsplash photo behind each service scene
 * (img[data-scene-photo], assets/img/services/, credits in its CREDITS.md). Off-screen film
 * scenes are transparent but laid out, so native lazy loading would fetch every photo at
 * once; in the film a scene's photo loads when a landing comes within one scene of it. In
 * flow mode (no film) the browser lazy-loads them as the page scrolls. Decorative only.
 *
 *   initScenePhotos(film) → unsubscribe
 */
const REACH = 1;
const DEFAULT_SIZES = '100vw';

/** Moves the deferred srcset onto the image, once. */
function load(img) {
  if (!img.dataset.srcset) return;
  img.sizes = img.dataset.sizes || DEFAULT_SIZES;
  img.srcset = img.dataset.srcset;
  delete img.dataset.srcset;
}

export function initScenePhotos(film) {
  const photos = Array.from(document.querySelectorAll('img[data-scene-photo]'));
  if (!photos.length) return () => {};
  if (!film?.enabled || typeof film.on !== 'function' || !Array.isArray(film.scenes)) {
    photos.forEach((img) => { img.loading = 'lazy'; load(img); });
    return () => {};
  }
  const near = (index) => photos.forEach((img) => {
    const at = film.scenes.indexOf(img.closest('.scene'));
    if (at >= 0 && Math.abs(at - index) <= REACH) load(img);
  });
  near(film.current ?? film.active ?? 0);
  return film.on('landed', ({ index }) => near(index)) || (() => {});
}
