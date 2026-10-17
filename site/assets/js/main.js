/**
 * Page bootstrap. Each page's module does:
 *
 *   import { boot } from './main.js';
 *   const { film, chrome } = boot();
 *   film.on('build', ({ tl, sceneEl, timing }) => { … extra scrubbed tweens … });
 *
 * Order matters: chrome first (fills [data-footer] etc. so the film measures
 * final content), then the film, then the layers and globe that listen to it.
 * Register film listeners synchronously after boot(); the first build waits
 * for web fonts, so listeners added in the same tick never miss it.
 *
 * Round 3 adds sound (sfx.js), the hover letter-roll (textfx.js), cursor
 * physics (interact.js), the morphing cursor ring (cursor.js) and the splash
 * exit (splash.js). Character reveals and eyebrow decodes run inside the
 * film's reveal hooks (film-reveals.js). The globe loads on idle (globe.js).
 * Performance: those extras start one task after chrome + film (initExtras).
 */
import { initChrome } from './chrome.js';
import { initFilm } from './film.js';
import { initLayers } from './layers.js';
import { initGlobe } from './globe.js';
import { initMotionToggle } from './motion-toggle.js';
import { initAlive } from './film-alive.js';
import { initSfx, sfx } from './sfx.js';
import { initRoll } from './textfx.js';
import { initInteract } from './interact.js';
import { initCursor } from './cursor.js';
import { initSplash } from './splash.js';
import { onIdle, finePointer } from './perf.js';

/** Decorative layers and interaction physics: started one task after the film. */
function initExtras({ film, chrome }) {
  initLayers({ film });
  initAlive({ film });
  initMotionToggle({ header: chrome.header, film });
  initSfx({ film });
  if (film.enabled && finePointer()) initRoll({ idle: onIdle });
  initInteract({ film });
  initCursor({ film });
  initSplash({ film });
}

export function boot({ page = document.body.dataset.page || 'home' } = {}) {
  const chrome = initChrome({ page });
  const film = initFilm({ root: document });
  const globe = initGlobe({ film });
  /* Its own task, so page load has no single long task. The film's first build
     waits for web fonts and runs in slices, so nothing is missed. */
  setTimeout(() => initExtras({ film, chrome }), 0);
  chrome.onMenuToggle((open) => (open ? film.stop() : film.start()));
  return { film, chrome, globe, sfx };
}
