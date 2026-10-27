/**
 * fit-audit states for services.html (contract: tools/fit-states/_harness.md).
 *
 *   node tools/fit-audit.mjs http://localhost:8000/ services.html --states=tools/fit-states/services.mjs --fixture=partners-max
 *
 * The worst cases the automatic variants cannot reach on Services:
 *   - #orbit: the preview card of the longest group (Insurance) by focus, and armed by a touch tap
 *     (the card gains its Open link);
 *   - #ours-outsourcing on phones: each panel opened in turn (the exclusive accordion; 1 is open at rest);
 *   - #finder: the categories dialog on the rail and on every category, every page of its partners;
 *   - #finder with the fixture (the finder is live): each category with "Winnipeg" chosen, the
 *     profile dialog of a maxed partner;
 *   - #finder without it: the concierge opening the WhatsApp sheet;
 *   - #inquiry: Insurance chosen, so the policy review link shows under the select.
 * The stepper units and their all-errors pass are automatic (form.csStepper).
 * Every `run` is serialised into the page, so it uses nothing from this module's scope.
 */

const PHONE = (w) => w < 760;
const CATEGORIES = ['insurance', 'business-strategy', 'outsourcing', 'web-design', 'graphics', 'virtual-assistant',
  'software-development', 'export-import', 'contractor', 'manufacturing', 'legal', 'mortgage',
  'real-estate', 'accounting-and-tax', 'financial-planning'];
/** `run` is serialised with toString(), so each one is built with its values written in. */
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const runOf = (body) => new AsyncFunction('{ scene, sleep }', body);

const openPanel = (n) => ({
  scene: 'ours-outsourcing',
  name: `panel ${n} open (phone accordion)`,
  vp: PHONE,
  run: runOf(`
    const panel = scene.querySelectorAll('.panel')[${n - 1}];
    (panel?.querySelector('.panel__toggle') || panel)?.click();
    await sleep(200);`),
});

const OPEN_CATEGORIES = `
    scene.querySelector('[data-categories-open]')?.click();
    for (let i = 0; i < 20 && !document.getElementById('categories-dialog')?.open; i++) await sleep(100);`;

const categoryState = (slug, page = 0) => ({
  scene: 'finder',
  name: `categories dialog: ${slug}${page ? `, partners page ${page + 1}` : ''}`,
  run: runOf(`${OPEN_CATEGORIES}
    document.querySelector('#cat-rail [data-slug="${slug}"]')?.click();
    await sleep(200);
    const list = document.querySelector('#cat-detail [data-cat-cards]');
    if (${page} && list?.csPager) list.csPager.goTo(Math.min(${page}, list.csPager.pages - 1));
    await sleep(200);`),
});

const finderState = (slug) => ({
  scene: 'finder',
  name: `finder: ${slug} + Winnipeg (fixture)`,
  run: runOf(`
    const root = document.getElementById('finder-root');
    if (!root || root.hidden) return;
    for (let i = 0; i < 30 && !root.querySelector('#finder-category option[value="${slug}"]'); i++) await sleep(100);
    const select = root.querySelector('#finder-category');
    select.value = '${slug}';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const input = root.querySelector('#finder-place');
    input.value = 'Winnipeg';
    // A cancelable submit event, never requestSubmit(): if the finder's handler is not wired yet,
    // nothing navigates (a real submit would reload the page and end the audit).
    root.querySelector('#finder-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await sleep(300);`),
});

const ORBIT_NODE = `scene.querySelector('.orbit__node[data-slug="insurance"]')`;

const orbitStates = [
  {
    scene: 'orbit',
    name: 'orbit preview: insurance (focus)',
    run: runOf(`
      ${ORBIT_NODE}?.focus();
      await sleep(300);`),
  },
  {
    scene: 'orbit',
    name: 'orbit preview: insurance armed by a touch tap (Open link)',
    run: runOf(`
      const node = ${ORBIT_NODE};
      if (!node) return;
      node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
      node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
      await sleep(300);`),
  },
];

export default [
  ...orbitStates,
  openPanel(2),
  openPanel(3),
  openPanel(4),
  {
    scene: 'finder',
    name: 'categories dialog: the rail',
    run: runOf(OPEN_CATEGORIES),
  },
  ...CATEGORIES.map((slug) => categoryState(slug)),
  categoryState('insurance', 1),
  categoryState('legal', 1),
  {
    scene: 'finder',
    name: 'categories dialog: insurance, Partners tab (phones)',
    vp: PHONE,
    run: runOf(`${OPEN_CATEGORIES}
      document.querySelector('#cat-rail [data-slug="insurance"]')?.click();
      await sleep(200);
      document.querySelector('#cat-detail [data-cat-card]')?.csTabs?.select('cat-listing');
      await sleep(200);`),
  },
  ...['insurance', 'legal', 'business-strategy', 'mortgage'].map(finderState),
  {
    scene: 'finder',
    name: 'profile dialog of a maxed partner (fixture)',
    run: runOf(`${OPEN_CATEGORIES}
      document.querySelector('#cat-rail [data-slug="insurance"]')?.click();
      await sleep(200);
      document.querySelector('#cat-detail .profile__open')?.click();
      await sleep(400);`),
  },
  {
    scene: 'inquiry',
    name: 'inquiry: insurance chosen (policy review link)',
    run: runOf(`
      const select = document.getElementById('inq-category');
      for (let i = 0; i < 30 && !select?.querySelector('option[value="insurance"]'); i++) await sleep(100);
      if (!select) return;
      select.value = 'insurance';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(200);`),
  },
  {
    scene: 'finder',
    name: 'concierge → WhatsApp sheet, send step',
    run: runOf(`
      const form = document.getElementById('concierge');
      if (!form || form.hidden) return;
      for (let i = 0; i < 30 && form.elements.need.options.length < 2; i++) await sleep(100);
      form.elements.need.value = 'legal';
      form.elements.city.value = 'Winnipeg';
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: form.querySelector('[type="submit"]') }));
      for (let i = 0; i < 30 && !document.getElementById('wa-sheet')?.open; i++) await sleep(100);
      await sleep(400);`),
  },
];
