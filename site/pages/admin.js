/**
 * admin.html: an app page (v2 §8), not a scroll film: no boot(), engine or splash.
 * The page logic is in sections/app/admin/admin-page.js; Firebase loads only when needed.
 */
import { initAdmin } from '../sections/app/admin/admin-page.js';
import { showFailure } from '../sections/app/_shared.js';

Promise.resolve().then(initAdmin).catch(showFailure);
