/**
 * fit-audit states for partners.html (contract: tools/fit-states/_harness.md).
 *
 *   node tools/fit-audit.mjs http://localhost:8000/ partners.html --states=tools/fit-states/partners.mjs
 *
 * The worst cases the automatic variants cannot reach on Partners (the tier tabs, the stepper
 * units and their all-errors passes are automatic):
 *   - #tiers: a tier picked (the selected panel's rule), and the "Compare All" dialog;
 *   - #apply: page / step "Your Service" with the longest types list (legal, 5 chips) and every
 *     error showing; the licence step for a category that requires one; the success panel;
 *   - #close: the questions dialog with each answer open (the longest decides the spare);
 *   - #hero: the WhatsApp sheet at each of its three steps, plus the "call or email" line.
 * Every `run` is serialised into the page, so it uses nothing from this module's scope.
 */

/** `run` is serialised with toString(), so each one is built with its values written in. */
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const runOf = (body) => new AsyncFunction('{ scene, sleep }', body);

/** Shared prelude: show every error of the unit holding `step` (the stepper's all-errors look). */
const ALL_ERRORS = `
  const allErrors = (unitEl) => {
    const form = document.getElementById('apply-form');
    const errs = form.querySelector('.stepper__errors');
    if (errs) { errs.hidden = false; errs.textContent = '4 answers need a second look.'; }
    unitEl.querySelectorAll('.error').forEach((e) => {
      e.hidden = false;
      if (!e.textContent.trim()) e.textContent = 'Enter the body that issued your licence, such as your provincial regulator.';
    });
    unitEl.querySelectorAll('input, select, textarea').forEach((f) => f.setAttribute('aria-invalid', 'true'));
  };`;

const goToStep = (step) => `
  const form = document.getElementById('apply-form');
  const steps = [...form.querySelectorAll('[data-step]')];
  const target = form.querySelector('[data-step="${step}"]');
  const api = form.csStepper;
  if (api) {
    for (let u = 0; u < api.total; u += 1) {
      api.go(u, { focus: false, cause: 'auto' });
      if (!target.hidden) break;
    }
  } else {
    steps.forEach((s) => { s.hidden = s !== target; });
  }
  await sleep(200);`;

const pickCategory = (slug) => `
  const select = document.getElementById('pa-category');
  select.value = ${JSON.stringify(slug)};
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(150);`;

const faqItem = (n) => ({
  scene: 'close',
  name: `questions dialog, answer ${n} open`,
  run: runOf(`
    scene.querySelector('[data-faq="${n}"]')?.click();
    await sleep(500);`),
});

const sheetStep = (step, name) => ({
  scene: 'hero',
  name: `WhatsApp sheet: ${name}`,
  run: runOf(`
    const step = ${JSON.stringify(step)};
    const a = document.createElement('a');   // the header no longer has a WhatsApp button (owner, 2026-10-26)
    a.href = step === 'contact' ? '#wa-sheet?contact' : '#wa-sheet';
    a.setAttribute('data-wa-sheet', step === 'contact' ? 'contact' : '');
    a.setAttribute('data-context', 'partners');
    document.body.append(a);
    a.click();
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
  {
    scene: 'tiers',
    name: 'Growth picked',
    run: runOf(`
      const pick = scene.querySelector('.tier__pick[value="growth"]');
      if (pick) { pick.checked = true; pick.dispatchEvent(new Event('change', { bubbles: true })); }
      await sleep(200);`),
  },
  {
    scene: 'tiers',
    name: 'Compare All dialog',
    run: runOf(`
      scene.querySelector('[data-tiers-open]')?.click();
      await sleep(500);`),
  },
  {
    scene: 'apply',
    name: 'Your Service: legal (5 type chips), every error',
    errors: true,
    run: runOf(`${ALL_ERRORS}
      ${pickCategory('legal')}
      ${goToStep(3)}
      const unit = document.querySelector('#apply-form [data-step="3"]').closest('.stepper__steps');
      allErrors(unit);
      await sleep(150);`),
  },
  {
    scene: 'apply',
    name: 'Your Licence: insurance (licence required), every error',
    errors: true,
    run: runOf(`${ALL_ERRORS}
      ${pickCategory('insurance')}
      ${goToStep(4)}
      const unit = document.querySelector('#apply-form [data-step="4"]').closest('.stepper__steps');
      allErrors(unit);
      await sleep(150);`),
  },
  {
    scene: 'apply',
    name: 'success panel',
    run: runOf(`
      const form = document.getElementById('apply-form');
      const success = document.getElementById('apply-success');
      form.hidden = true;
      success.hidden = false;
      await sleep(200);`),
  },
  faqItem(1),
  faqItem(2),
  faqItem(3),
  faqItem(4),
  sheetStep(0, 'step 1, what you need'),
  sheetStep(1, 'step 2, your city'),
  sheetStep(2, 'step 3, open WhatsApp'),
  sheetStep('contact', 'call or email'),
];
