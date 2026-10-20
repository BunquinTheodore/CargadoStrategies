/**
 * fit-audit states for story.html (contract: tools/fit-states/_harness.md).
 *
 *   node tools/fit-audit.mjs http://localhost:8000/ story.html --states=tools/fit-states/story.mjs
 *
 * The worst cases the automatic variants cannot reach on Story:
 *   - #values on phones: each value body opened in turn (the exclusive accordion; 01 is open at rest);
 *   - #close: the WhatsApp sheet at each of its three steps, plus the "call or email" line.
 * Every `run` is serialised into the page, so it uses nothing from this module's scope.
 */

const PHONE = (w) => w < 760;
/** `run` is serialised with toString(), so each one is built with its values written in. */
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const runOf = (body) => new AsyncFunction('{ scene, sleep }', body);

const openValue = (n) => ({
  scene: 'values',
  name: `value ${n} open (phone accordion)`,
  vp: PHONE,
  run: runOf(`
    const value = scene.querySelectorAll('.value')[${n - 1}];
    if (!value) return;
    (value.querySelector('.value__toggle') || value).click();
    await sleep(200);`),
});

const sheetStep = (step, name) => ({
  scene: 'close',
  name: `WhatsApp sheet: ${name}`,
  run: runOf(`
    const step = ${JSON.stringify(step)};
    const trigger = scene.querySelector('[data-wa-sheet]');
    if (!trigger) return;
    if (step === 'contact') trigger.setAttribute('data-wa-sheet', 'contact');
    trigger.click();
    for (let i = 0; i < 30 && !document.getElementById('wa-sheet')?.open; i++) await sleep(100);
    const form = document.querySelector('#wa-sheet form.stepper');
    if (step !== 'contact' && step > 0 && form?.csStepper) {
      const chip = form.querySelector('[data-sheet-needs] input');
      if (chip) { chip.checked = true; chip.dispatchEvent(new Event('change', { bubbles: true })); }
      const city = form.querySelector('input[name="city"]');
      if (city) { city.value = 'Winnipeg'; city.dispatchEvent(new Event('input', { bubbles: true })); }
      form.csStepper.go(step, { focus: false, cause: 'auto' });
    }
    await sleep(400);`),
});

export default [
  openValue(2),
  openValue(3),
  sheetStep(0, 'step 1, what you need'),
  sheetStep(1, 'step 2, your city'),
  sheetStep(2, 'step 3, open WhatsApp'),
  sheetStep('contact', 'call or email'),
];
