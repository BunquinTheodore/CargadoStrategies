/**
 * The home page intro form's "What do you need?" choices: data and markup in
 * one DOM-free module, so the page (home.js) and the production build
 * (build.mjs, which writes the chips into dist/index.html so they are there at
 * first paint, with no layout shift) render exactly the same thing.
 *
 * Labels are Title Case; `ask` is the wording used in the WhatsApp message.
 */
export const NEEDS = Object.freeze([
  { value: 'mortgage', label: 'Mortgage', ask: 'Mortgage' },
  { value: 'insurance', label: 'Insurance', ask: 'Insurance' },
  { value: 'legal', label: 'Lawyer', ask: 'A lawyer' },
  { value: 'real-estate', label: 'Real Estate', ask: 'Real estate' },
  { value: 'accounting-and-tax', label: 'Tax', ask: 'Tax' },
  { value: 'not-sure', label: 'Not Sure', ask: "I'm not sure yet, please help me work out who I need" },
]);

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (text) => String(text).replace(/[&<>"']/g, (ch) => ENTITIES[ch]);

/** The chips (radio inputs inside labels) for #intro-needs. */
export function needsMarkup() {
  return NEEDS.map(({ value, label }) => `
    <label class="chip"><input type="radio" name="need" value="${escape(value)}">${escape(label)}</label>`).join('');
}
