/**
 * partner-dashboard.html: an app page (v2 §8), not a scroll film: no boot(), engine or splash.
 * The page logic is in sections/app/partner/partner-page.js; Firebase loads only when needed.
 */
import { initPartner } from '../sections/app/partner/partner-page.js';
import { showFailure } from '../sections/app/_shared.js';

Promise.resolve().then(initPartner).catch(showFailure);
