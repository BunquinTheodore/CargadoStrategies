/**
 * Role routing for the app pages (v2 §8.2, plan Task 12).
 *
 *   routeFor(role)            → 'dashboard.html' | 'partner-dashboard.html' | 'admin.html'
 *   guardDecision(user, role) → { action: 'allow' } | { action: 'login'|'redirect', to }
 *   await requireRole(role)   → the user, or the page is sent to log in / its own dashboard
 *
 * This only steers the visitor. What each role can read and change is enforced by
 * firestore.rules and the api/ checks, never by the page.
 */
import { onUser } from './auth.js';
import { hasStoredSession } from '../chrome/account-button.js';

export const ROLE_ROUTES = Object.freeze({
  client: 'dashboard.html',
  partner: 'partner-dashboard.html',
  admin: 'admin.html',
});
export const LOGIN_PAGE = 'account.html';

const knownRole = (role) => (Object.hasOwn(ROLE_ROUTES, role) ? role : 'client');

export const routeFor = (role) => ROLE_ROUTES[knownRole(role)];

export function guardDecision(user, required) {
  if (!user) return { action: 'login', to: LOGIN_PAGE };
  const role = knownRole(user.role);
  return role === required ? { action: 'allow' } : { action: 'redirect', to: routeFor(role) };
}

/**
 * Replace the page with no View Transition. A guard redirect runs before the page
 * has painted, so Chrome aborts the transition and the next page logs an uncaught
 * InvalidStateError. Skipping it in pageswap leaves nothing to abort.
 */
export function replaceQuietly(url, win = globalThis.window) {
  win.addEventListener('pageswap', (event) => event.viewTransition?.skipTransition(), { once: true });
  win.location.replace(url);
}

function localStore() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Resolve with the user when they hold `role`; otherwise replace the page. Without a
 * stored session it redirects at once, so a signed-out visitor never loads the SDK.
 */
export function requireRole(role, { watch = onUser, go = (url) => replaceQuietly(url), storage = localStore() } = {}) {
  if (!hasStoredSession(storage)) {
    go(LOGIN_PAGE);
    return new Promise(() => {});
  }
  return new Promise((resolve) => {
    let settled = false;
    const stop = watch((user) => {
      const decision = guardDecision(user, role);
      if (decision.action !== 'allow') { go(decision.to); return; }
      if (!settled) { settled = true; resolve({ user, stop }); }
    });
  });
}
