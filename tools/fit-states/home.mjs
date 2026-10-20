/**
 * fit-audit states for index.html (contract: tools/fit-states/_harness.md).
 *
 *   node tools/fit-audit.mjs http://localhost:8000/ index.html --states=tools/fit-states/home.mjs
 *
 * The worst cases the automatic variants cannot reach on Home:
 *   - #founder on phones: each door opened in turn (the exclusive accordion; 01 is open at rest);
 *   - #close: the FAQ dialog with each answer open (the longest decides the spare);
 *   - #hero: the WhatsApp sheet at each of its three steps, plus the "call or email" line.
 * Every `run` is serialised into the page, so it uses nothing from this module's scope.
 */

const PHONE = (w) => w < 760;
/** `run` is serialised with toString(), so each one is built with its values written in. */
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const runOf = (body) => new AsyncFunction('{ scene, sleep }', body);

const openDoor = (n) => ({
  scene: 'founder',
  name: `door ${n} open (phone accordion)`,
  vp: PHONE,
  run: runOf(`
    const door = scene.querySelectorAll('.door')[${n - 1}];
    if (!door) return;
    (door.querySelector('.door__toggle') || door).click();
    await sleep(200);`),
});

const faqItem = (n) => ({
  scene: 'close',
  name: `FAQ dialog, answer ${n} open`,
  run: runOf(`
    scene.querySelector('[data-faq-open]')?.click();
    await sleep(500);
    document.querySelectorAll('#faq-dialog details.acc').forEach((d, i) => { d.open = i === ${n - 1}; });
    await sleep(200);`),
});

const sheetStep = (step, name) => ({
  scene: 'hero',
  name: `WhatsApp sheet: ${name}`,
  run: runOf(`
    const step = ${JSON.stringify(step)};
    const trigger = step === 'contact' ? scene.querySelector('[data-wa-sheet="contact"]') : scene.querySelector('.hero__cta');
    trigger?.click();
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
  openDoor(2),
  openDoor(3),
  faqItem(1),
  faqItem(2),
  faqItem(3),
  faqItem(4),
  sheetStep(0, 'step 1, what you need'),
  sheetStep(1, 'step 2, your city'),
  sheetStep(2, 'step 3, open WhatsApp'),
  sheetStep('contact', 'call or email'),
];
