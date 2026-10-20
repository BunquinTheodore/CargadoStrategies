import { readableText } from './textfx.js';

/**
 * Tiny event emitter shared by the film and its flow-mode fallback.
 * A failing listener never stops the others; its error is rethrown
 * asynchronously so it still shows up in the console.
 */
export function createEmitter() {
  const listeners = new Map();

  function on(name, cb) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(cb);
    return () => off(name, cb);
  }

  function off(name, cb) {
    listeners.get(name)?.delete(cb);
  }

  function emit(name, payload) {
    listeners.get(name)?.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        setTimeout(() => {
          throw err;
        });
      }
    });
  }

  return { on, off, emit };
}

/** Resolve once web fonts are ready (never rejects; caps the wait). */
export function fontsReady(maxWaitMs = 3000) {
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const timeout = new Promise((resolve) => setTimeout(resolve, maxWaitMs));
  return Promise.race([fonts, timeout]).then(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
  );
}

/** Scene title for the scene event: data-title, else the first heading's text. */
export function sceneTitle(sceneEl) {
  if (sceneEl.dataset.title) return sceneEl.dataset.title;
  const heading = sceneEl.querySelector('h1, h2, h3');
  return heading ? readableText(heading) : sceneEl.id; // split headings keep a readable copy
}

/** Same-document hash target of a link click, or null. */
export function hashTargetOf(event) {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = event.target.closest?.('a[href]');
  if (!link || link.target === '_blank' || link.hasAttribute('download')) return null;
  const url = new URL(link.href, location.href);
  const samePage = url.origin === location.origin && url.pathname === location.pathname;
  return samePage && url.hash.length > 1 ? url.hash : null;
}

/** Decode "#id" safely. */
export function idFromHash(hash) {
  try {
    return decodeURIComponent((hash || '').replace(/^#/, ''));
  } catch {
    return '';
  }
}
