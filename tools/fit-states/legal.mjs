/**
 * fit-audit states for legal.html (contract: tools/fit-states/_harness.md).
 *
 *   node tools/fit-audit.mjs http://localhost:8000/ legal.html --states=tools/fit-states/legal.mjs --ph-repeat=3
 *
 * The automatic variants already turn every page of every document reader and of the Q&A
 * question pager. The worst cases they cannot reach on Legal:
 *   - #faq: each answer open (from 760 px on its page of questions, 3-6 by height, under its question;
 *     on phones in drill mode, in place of the list), and on phones the answer's last page;
 *   - #close: the WhatsApp sheet at each of its three steps, plus the "call or email" line.
 * Every `run` is serialised into the page, so it uses nothing from this module's scope.
 */

const PHONE = (w) => w < 760;
const QUESTIONS = 6;
/** `run` is serialised with toString(), so each one is built with its values written in. */
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const runOf = (body) => new AsyncFunction('{ scene, sleep }', body);

const answer = (n, { lastPage = false } = {}) => ({
  scene: 'faq',
  name: `Q&A answer ${n} open${lastPage ? ', last page' : ''}`,
  vp: lastPage ? PHONE : undefined,
  run: runOf(`
    const root = scene.querySelector('.qa');
    const question = root?.querySelectorAll('.tabs__tab')[${n - 1}];
    if (!root?.csTabs || !question) return;
    const list = root.querySelector('.tabs__list');
    const pager = list.csPager;
    if (pager && innerWidth >= 760) {
      for (let p = 0; p < pager.pages && question.hidden; p++) pager.goTo(p);
    }
    root.csTabs.open(question.getAttribute('aria-controls'), { cause: 'auto' });
    await sleep(300);
    const reader = document.getElementById(question.getAttribute('aria-controls'))?.querySelector('[data-pager]')?.csPager;
    if (${lastPage} && reader) reader.goTo(reader.pages - 1, { animate: false, announce: false });
    await sleep(200);`),
});

const sheetStep = (step, name) => ({
  scene: 'close',
  name: `WhatsApp sheet: ${name}`,
  run: runOf(`
    const step = ${JSON.stringify(step)};
    const cta = scene.querySelector('[data-wa-sheet]');
    if (step === 'contact') cta?.setAttribute('data-wa-sheet', 'contact');
    cta?.click();
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
  ...Array.from({ length: QUESTIONS }, (_, i) => answer(i + 1)),
  ...Array.from({ length: QUESTIONS }, (_, i) => answer(i + 1, { lastPage: true })),
  sheetStep(0, 'step 1, what you need'),
  sheetStep(1, 'step 2, your city'),
  sheetStep(2, 'step 3, open WhatsApp'),
  sheetStep('contact', 'call or email'),
];
