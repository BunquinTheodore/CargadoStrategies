/**
 * account.html: an app page (v2 §8), not a scroll film: no boot(), engine or splash.
 * The page logic is in sections/app/account/account-page.js; Firebase loads only when needed.
 */
import { initAccount } from '../sections/app/account/account-page.js';
import { showFailure } from '../sections/app/_shared.js';

Promise.resolve().then(initAccount).catch(showFailure);
