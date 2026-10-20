/**
 * The concierge (DIRECTION C40): Services #finder while
 * PARTNERS.length < FINDER_MIN_PARTNERS. A category select plus a city input
 * that open the WhatsApp sheet (C22) with both prefilled.
 *
 *   const { destroy } = initConcierge(document.querySelector('form.concierge'), { sheet: boot().sheet });
 *
 * Markup (the services page owns it):
 *   <form class="concierge"> <select name="need"> <input name="city" autocomplete="address-level2">
 *     <button type="submit" class="btn btn--primary">Get My Introduction →</button> </form>
 * An empty select is filled from CATEGORIES (plus a "Choose a service" prompt).
 * `sheet` is the sheet API or the Promise main.js returns for it.
 * Submit goes to the sheet's "Open WhatsApp" step, or to step 1 when no service is chosen.
 */
import { CATEGORIES, PARTNERS, FINDER_MIN_PARTNERS } from './config.js';
import { titleCase } from './text-case.js';

const CONTEXT = 'services';
const PROMPT = 'Choose a service';

/** True while the concierge stands in for the finder. */
export const conciergeActive = () => PARTNERS.length < FINDER_MIN_PARTNERS;

function fillOptions(select) {
  if (!select || select.options.length) return;
  select.add(new Option(PROMPT, ''));
  CATEGORIES.forEach(({ slug, name }) => select.add(new Option(titleCase(name), slug)));
}

export function initConcierge(root, { sheet } = {}) {
  if (!root) return { destroy() {} };
  const { need, city } = root.elements;
  fillOptions(need);

  const onSubmit = async (event) => {
    event.preventDefault();
    const trigger = event.submitter || root.querySelector('[type="submit"]');
    const chosen = need?.value || '';
    const api = await sheet;
    api?.open({ need: chosen, city: city?.value.trim() || '', context: CONTEXT, step: chosen ? 'send' : 'need', trigger });
  };
  root.addEventListener('submit', onSubmit);
  return { destroy: () => root.removeEventListener('submit', onSubmit) };
}
