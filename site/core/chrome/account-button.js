/**
 * Header account button (v2 §8.1, plan Task 10).
 *
 *   initAccountButton();   // → { el, ready }   (chrome.js calls it once)
 *
 * - The markup is in every shell: <a class="site-header__account" href="account.html" hidden data-account>Log In</a>.
 * - FIREBASE empty: the button stays hidden and nothing else happens.
 * - Configured: "Log In" shows at once, without the SDK.
 * - Only when localStorage holds Firebase's auth-persistence key (firebase:authUser:*)
 *   does it import core/account/auth.js after idle, then reads "Dashboard" and links to the
 *   right dashboard (owner, 2026-10-26: no name in the header). Signed-out visitors never load Firebase on film pages.
 * - Any failure (blocked storage, SDK offline, provider not set up) keeps "Log In", silently.
 */
import { isFirebaseConfigured } from '../../assets/js/config.js';

const SESSION_PREFIX = 'firebase:authUser:';
const DEFAULT_DASHBOARD = 'dashboard.html';
const SIGNED_IN_LABEL = 'Dashboard';
const IDLE_TIMEOUT_MS = 2500;   // as perf.js onIdle (not imported: tier.js needs a DOM at import, and node tests load chrome.js)

/** After load and paint, when the main thread is idle. */
function afterIdle(cb) {
  const idle = () => (globalThis.requestIdleCallback ? requestIdleCallback(cb, { timeout: IDLE_TIMEOUT_MS }) : setTimeout(cb, 1));
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}

/** True when Firebase left a signed-in user in storage (never throws). */
export function hasStoredSession(storage) {
  try {
    if (!storage) return false;
    for (let i = 0; i < storage.length; i += 1) {
      if (storage.key(i)?.startsWith(SESSION_PREFIX)) return true;
    }
  } catch {
    /* storage blocked: treat as signed out */
  }
  return false;
}

function localStore() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/* auth.js (and guard.js for routeFor) are Task 12's modules; imported only on demand. */
async function loadAuthModules() {
  const [auth, guard] = await Promise.all([import('../account/auth.js'), import('../account/guard.js')]);
  return { onUser: auth.onUser, routeFor: guard.routeFor };
}

/** A signed-in user: the link reads "Dashboard" and opens the dashboard for their role. */
function showUser(el, user, routeFor) {
  if (!user) return;
  el.replaceChildren(el.ownerDocument.createTextNode(SIGNED_IN_LABEL));
  el.setAttribute('href', (routeFor && routeFor(user.role)) || DEFAULT_DASHBOARD);
}

function upgrade(el, schedule, loadAuth) {
  return new Promise((resolve) => {
    schedule(async () => {
      try {
        const { onUser, routeFor } = await loadAuth();
        let first = true;
        onUser((user) => {
          if (user) showUser(el, user, routeFor);
          if (first) { first = false; resolve(); }
        });
      } catch {
        resolve();   // the SDK could not load: "Log In" stays
      }
    });
  });
}

/** Wire the header's [data-account] link. Options are injectable for tests. */
export function initAccountButton({
  root = document,
  configured = isFirebaseConfigured(),
  storage = localStore(),
  schedule = afterIdle,
  loadAuth = loadAuthModules,
} = {}) {
  const el = root.querySelector('[data-account]');
  if (!el || !configured) return { el, ready: Promise.resolve() };
  el.hidden = false;
  if (!hasStoredSession(storage)) return { el, ready: Promise.resolve() };
  return { el, ready: upgrade(el, schedule, loadAuth) };
}
