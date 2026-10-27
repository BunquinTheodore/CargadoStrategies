/**
 * Firebase loader for accounts (v2 §8, plan Task 12).
 *
 *   const fb = await loadFirebase();   // → { app, auth, db, authSdk, storeSdk } | null
 *
 * - Null when config FIREBASE is empty (isFirebaseConfigured): nothing is fetched,
 *   and the app pages show "Accounts are coming soon".
 * - The SDK (10.12.2) comes from the official gstatic ES module CDN, on the first
 *   call only. build.mjs keeps these URLs external. Film pages reach this module
 *   only through the header account button, and only when a session is stored.
 * - Never Analytics: the Privacy Policy promises no analytics.
 * - SDK logging is silenced: failures reach the caller as rejected promises and
 *   the pages show them as friendly messages (auth.js friendlyError).
 * - `config` and `sdk` are injectable for tests; resetFirebase() forgets the instance.
 */
import { FIREBASE, isFirebaseConfigured } from '../../assets/js/config.js';

export const SDK_VERSION = '10.12.2';
const SILENT = 'silent';

/* Literal URLs (one per module) so the bundler leaves each as an external import. */
export const SDK = Object.freeze({
  app: () => import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
  auth: () => import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
  firestore: () => import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
});

let loading = null;

async function start(config, sdk) {
  const [appSdk, authSdk, storeSdk] = await Promise.all([sdk.app(), sdk.auth(), sdk.firestore()]);
  appSdk.setLogLevel?.(SILENT);
  storeSdk.setLogLevel?.(SILENT);
  const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp({ ...config });
  return { app, auth: startAuth(authSdk, app), db: storeSdk.getFirestore(app), authSdk, storeSdk };
}

/**
 * Sessions live in localStorage (firebase:authUser:*), not the SDK's default
 * IndexedDB, so the header button and guard.js can tell "signed in" without the SDK.
 */
function startAuth(authSdk, app) {
  if (!authSdk.initializeAuth) return authSdk.getAuth(app);
  try {
    return authSdk.initializeAuth(app, {
      persistence: [authSdk.browserLocalPersistence, authSdk.browserSessionPersistence],
      popupRedirectResolver: authSdk.browserPopupRedirectResolver,
    });
  } catch {
    return authSdk.getAuth(app);   // already initialised on this page
  }
}

/** The shared Firebase instance, or null when accounts are not configured. A failed load is retried next call. */
export function loadFirebase({ config = FIREBASE, sdk = SDK } = {}) {
  if (!isFirebaseConfigured(config)) return Promise.resolve(null);
  if (!loading) {
    loading = start(config, sdk);
    loading.catch(() => { loading = null; });
  }
  return loading;
}

/** Tests only: forget the shared instance. */
export function resetFirebase() {
  loading = null;
}
