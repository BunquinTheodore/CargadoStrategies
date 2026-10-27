/**
 * dashboard.html: an app page (v2 §8), not a scroll film: no boot(), engine or splash.
 * The page logic is in sections/app/dashboard/dashboard-page.js; Firebase loads only when needed.
 */
import { initDashboard } from '../sections/app/dashboard/dashboard-page.js';
import { showFailure } from '../sections/app/_shared.js';

Promise.resolve().then(initDashboard).catch(showFailure);
