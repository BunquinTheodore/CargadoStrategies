/**
 * fit-audit states for contact.html (contract: tools/fit-states/_harness.md).
 *
 *   node tools/fit-audit.mjs http://127.0.0.1:86xx/ contact.html --states=tools/fit-states/contact.mjs
 *
 * The worst cases the automatic variants cannot reach on Contact:
 *   - #book: the calendar's next month (the month arrow);
 *   - #book: the time step with a time chosen and the "no longer free" line;
 *   - #book: the last unit with the longest failure line (and its WhatsApp link);
 *   - #book: the confirmed view with its Meet button, and the pending view.
 * The stepper units and their all-errors pass are automatic (form.csStepper).
 * Every `run` is serialised into the page, so it uses nothing from this module's scope.
 * Nothing is submitted: the result views are written as book-form.js writes them.
 */

const LONG_FAILURE = 'Too many tries in a short time. Please wait a few minutes, or message Cargado Strategies on WhatsApp.'
  + ' <a class="link" href="#wa-sheet">Message on WhatsApp</a>';
const CONFIRMED = `
  <h2 class="book-success__title">You Are Booked</h2>
  <p class="book-success__text">Wednesday, September 30, 12:50 PM Central Time. The Google Meet link is below and in the confirmation email.</p>
  <a class="btn btn--primary" href="#book">Open Google Meet <span class="btn__arrow" aria-hidden="true">→</span></a>`;
const PENDING = `
  <h2 class="book-success__title">Request Received</h2>
  <p class="book-success__text">Cargado Strategies will confirm Wednesday, September 30, 12:50 PM Central Time by email, with the meeting link.</p>`;
/** `run` is serialised with toString(), so each one is built with its values written in. */
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const runOf = (body) => new AsyncFunction('{ scene, sleep }', body);

const GO = (unit) => `
    const form = scene.querySelector('#book-form');
    form.csStepper?.go(Math.min(${unit}, form.csStepper.total - 1), { focus: false, cause: 'auto' });
    await sleep(100);`;

const resultView = (name, html) => ({
  scene: 'book',
  name,
  run: runOf(`
    const success = scene.querySelector('#book-success');
    success.innerHTML = ${JSON.stringify(html)};
    scene.querySelector('#book-form').hidden = true;
    success.hidden = false;
    await sleep(100);`),
});

export default [
  {
    scene: 'book',
    name: 'calendar: the next month',
    run: runOf(`
    scene.querySelector('[data-days-next]')?.click();
    await sleep(100);`),
  },
  {
    scene: 'book',
    name: 'time step: a time chosen, the "no longer free" line',
    run: runOf(`${GO(1)}
    const select = scene.querySelector('#book-start');
    if (select.options.length > 1) select.value = select.options[select.options.length - 1].value;
    scene.querySelector('[data-book-status]').textContent = 'That time is no longer free. Please choose another one.';
    await sleep(100);`),
  },
  {
    scene: 'book',
    name: 'last unit: the longest failure line',
    errors: true,
    run: runOf(`${GO(9)}
    scene.querySelector('[data-book-status]').innerHTML = ${JSON.stringify(LONG_FAILURE)};
    await sleep(100);`),
  },
  resultView('confirmed view with the Meet button', CONFIRMED),
  resultView('pending view', PENDING),
];
