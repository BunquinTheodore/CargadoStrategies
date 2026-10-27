/**
 * Partner application (FR10, DIRECTION §7.4 P5): the R4 field list and rules
 * in a ui-stepper (api.md §17.3). Four steps of at most four fields: Business ·
 * Service and Licence · Area and References · Review, Code of Conduct and
 * Send. From 760 px a step is one page; phones page through each step's
 * short parts, and the count still reads "Step n of 4". Category and types come from
 * config, licence rules (CR02), honeypot, the hand-off to WhatsApp (or email
 * once CONTACT_EMAIL exists) and the "we review each one" success state.
 *
 * The visitor sends the prefilled message from their own WhatsApp / email
 * app. Beside it, a copy goes to POST /api/partner-apply, which stores the
 * application for the admin dashboard and emails the owner.
 */
import { CATEGORIES, CONTACT_EMAIL, CONTACT_EMAIL_LABEL, SITE_NAME, categoryBySlug } from '../../../assets/js/config.js';
import { waLink } from '../../../core/chrome/whatsapp.js';
import { escapeHtml } from '../../../core/chrome/chrome.js';
import { createStepper } from '../../../core/ui/ui-stepper.js';
import { focusInScene } from '../../../core/ui/ui-focus.js';

/** Categories where a current licence is required to be listed (CR02). */
const LICENCE_REQUIRED = new Set(['insurance', 'legal', 'mortgage', 'real-estate']);
const OTHER_CATEGORY = { slug: 'other', name: 'Something else (say more under About your work)' };
const TIER_NAMES = { community: 'Community', growth: 'Growth', premier: 'Premier' };
const MIN_PHONE_DIGITS = 10;
const MIN_REFERENCES = 10;
const MIN_ABOUT = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ID_PREFIX = 'pa-';
const PAGE_WHEN = '(min-width: 760px)';
const APPLY_ENDPOINT = '/api/partner-apply';
const MAX_VALUE = 2000;

const filled = (value) => value.length > 0;
const digitCount = (value) => value.replace(/\D/g, '').length;
const needsLicence = (v) => LICENCE_REQUIRED.has(v.category);
const categoryName = (slug) => (slug === OTHER_CATEGORY.slug ? 'Other' : categoryBySlug(slug)?.name || '');

/** Validation rules, in form order. `message` may depend on the values (R4 partners §3.8 wording). */
const RULES = [
  { field: 'business', ok: (v) => filled(v.business), message: 'Enter your business name.' },
  { field: 'entity', ok: (v) => filled(v.entity), message: 'Enter the legal entity name, even if it is the same as your business name.' },
  { field: 'contact', ok: (v) => filled(v.contact), message: 'Enter the name of the person Cargado Strategies should contact.' },
  { field: 'phone', ok: (v) => digitCount(v.phone) >= MIN_PHONE_DIGITS, message: `Enter a phone or WhatsApp number with at least ${MIN_PHONE_DIGITS} digits, including the area code.` },
  { field: 'category', ok: (v) => filled(v.category), message: 'Choose the service you offer.' },
  {
    field: 'licence',
    ok: (v) => !needsLicence(v) || filled(v.licence),
    message: (v) => `Enter your licence number. ${categoryName(v.category)} partners must hold a current licence.`,
  },
  {
    field: 'issuer',
    ok: (v) => !(needsLicence(v) || filled(v.licence)) || filled(v.issuer),
    message: 'Enter the body that issued your licence, such as your provincial regulator.',
  },
  { field: 'city', ok: (v) => filled(v.city), message: 'Enter the city or town you work from.' },
  { field: 'province', ok: (v) => filled(v.province), message: 'Choose your province or territory.' },
  { field: 'references', ok: (v) => v.references.length >= MIN_REFERENCES, message: 'Add at least one professional reference: a name and how to reach them. Cargado Strategies contacts them only to review your application.' },
  { field: 'about', ok: (v) => v.about.length >= MIN_ABOUT, message: `Describe your work in two or three sentences (${MIN_ABOUT} characters or more): what you do, who you help, your languages.` },
  { field: 'email', ok: (v) => EMAIL_PATTERN.test(v.email), message: 'Enter an email address like name@example.com.' },
  { field: 'conduct', ok: (v) => v.conduct, message: 'Tick to agree to the Partner Code of Conduct.' },
  { field: 'consent', ok: (v) => v.consent, message: 'Tick so Cargado Strategies can use these details to review it.' },
];

/* ---------- rendering ---------- */

/** Fill the category select from config (founder-only services are not open to partners). */
export function renderCategoryOptions(select) {
  const options = CATEGORIES.filter((c) => c.ownership !== 'founder').concat(OTHER_CATEGORY);
  select.insertAdjacentHTML('beforeend', options
    .map((c) => `<option value="${escapeHtml(c.slug)}">${escapeHtml(c.name)}</option>`).join(''));
}

function renderTypes(form, slug) {
  const group = form.querySelector(`#${ID_PREFIX}types`);
  const types = categoryBySlug(slug)?.types || [];
  group.hidden = types.length === 0;
  group.querySelector(`#${ID_PREFIX}types-chips`).innerHTML = types
    .map((t) => `<label class="chip"><input type="checkbox" name="types" value="${escapeHtml(t.slug)}">${escapeHtml(t.name)}</label>`)
    .join('');
}

function updateLicenceState(form, slug) {
  const required = LICENCE_REQUIRED.has(slug);
  ['licence', 'issuer'].forEach((name) => {
    form.elements[name].required = required;
  });
  form.querySelectorAll('[data-licence-opt]').forEach((el) => {
    el.textContent = required ? '' : '(where one applies)';
  });
}

/* ---------- values + message ---------- */

function readValues(form) {
  const data = new FormData(form);
  const text = (name) => String(data.get(name) || '').trim();
  return {
    business: text('business'), entity: text('entity'), contact: text('contact'),
    email: text('email'), phone: text('phone'), tier: text('tier'),
    category: text('category'), types: data.getAll('types').map(String),
    licence: text('licence'), issuer: text('issuer'),
    city: text('city'), province: text('province'),
    references: text('references'), about: text('about'),
    conduct: data.get('conduct') === 'yes', consent: data.get('consent') === 'yes',
    website: text('website'),
  };
}

function serviceLabel(v) {
  const category = categoryBySlug(v.category);
  const types = v.types.map((slug) => category?.types.find((t) => t.slug === slug)?.name).filter(Boolean);
  return [categoryName(v.category), types.join(', ')].filter(Boolean).join(' · ');
}

function licenceLabel(v) {
  if (!v.licence) return 'No licence applies to my service';
  return v.issuer ? `${v.licence} (issued by ${v.issuer})` : v.licence;
}

/** Plain-text application, used for both WhatsApp and email. */
function applicationText(v) {
  return [
    `Hi ${SITE_NAME},`,
    `I'd like to apply to become a partner (from the Become a partner page).`,
    '',
    `Business name: ${v.business}`,
    `Legal entity: ${v.entity}`,
    `Contact name: ${v.contact}`,
    `Email: ${v.email}`,
    `Phone / WhatsApp: ${v.phone}`,
    `Service: ${serviceLabel(v)}`,
    `Licence or credential: ${licenceLabel(v)}`,
    `Service area (so you can show me to people near me): ${v.city}, ${v.province}`,
    `Tier I'm interested in: ${TIER_NAMES[v.tier] || 'Not sure yet'}`,
    `References: ${v.references}`,
    `About my work: ${v.about}`,
    '',
    'I agree to follow the Partner Code of Conduct, and the details above are true.',
    'I agree that you may use these details to review my application.',
  ].join('\n');
}

/**
 * The stored copy and the owner's email (api/partner-apply.js), sent beside the
 * hand-off. Fire and forget: keepalive lets it finish while WhatsApp opens.
 */
function postApplication(fields) {
  const clean = Object.fromEntries(Object.entries(fields)
    .map(([label, value]) => [label, String(value ?? '').trim().slice(0, MAX_VALUE)])
    .filter(([, value]) => value));
  try {
    fetch(APPLY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: document.body.dataset.page || '', fields: clean }),
      keepalive: true,
    })
      .then((response) => { if (!response.ok) console.error(`partner-apply: ${response.status}`); })
      .catch((error) => console.error('partner-apply failed', error));
  } catch (error) {
    console.error('partner-apply failed', error);
  }
}

function emailCopy(via, v) {
  postApplication({
    'Business name': v.business,
    'Legal entity': v.entity,
    'Contact name': v.contact,
    Email: v.email,
    Phone: v.phone,
    Service: serviceLabel(v),
    Licence: licenceLabel(v),
    City: v.city,
    Province: v.province,
    Tier: TIER_NAMES[v.tier] || 'Not sure yet',
    References: v.references,
    'About their work': v.about,
    'Sent by': via === 'email' && CONTACT_EMAIL ? 'Email' : 'WhatsApp',
    'Code of Conduct': v.conduct ? 'Agreed' : 'Not agreed',
    Consent: v.consent ? 'Yes' : 'No',
  });
}

function handOffLink(via, v) {
  if (via === 'email' && CONTACT_EMAIL) {
    const subject = encodeURIComponent(`Partner application: ${v.business}`);
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(applicationText(v))}`;
  }
  return waLink(applicationText(v));
}

/* ---------- errors ---------- */

const fieldEl = (form, name) => form.querySelector(`#${ID_PREFIX}${name}`);
const errorEl = (form, name) => form.querySelector(`#${ID_PREFIX}${name}-error`);

function validate(values) {
  return RULES.filter((rule) => !rule.ok(values)).map((rule) => ({
    field: rule.field,
    message: typeof rule.message === 'function' ? rule.message(values) : rule.message,
  }));
}

function setFieldError(form, field, message) {
  const input = fieldEl(form, field);
  const error = errorEl(form, field);
  if (!input || !error) return;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  error.textContent = message || '';
  error.hidden = !message;
}

/** The rules whose field sits inside the given step elements (the visible unit). */
const rulesIn = (form, stepEls) => RULES.filter(({ field }) => {
  const el = fieldEl(form, field);
  return el && stepEls.some((step) => step.contains(el));
});

/* ---------- progress: always counted in the four logical steps ---------- */

/**
 * The visible count, the bar and each title's hidden ", step n of 4". In 'page' mode a unit is a
 * whole step; in 'step' mode (phones) a unit is one part of a step, so it adds "1 of 2".
 */
function progressOf(form, unit, mode) {
  const parts = Array.from(form.querySelectorAll('.stepper__steps > [data-step]'));
  const pages = [...new Set(parts.map((s) => s.dataset.page))];
  const first = mode === 'page' ? parts.find((s) => s.dataset.page === pages[unit]) : parts[unit];
  const page = first?.dataset.page;
  const siblings = parts.filter((s) => s.dataset.page === page);
  const part = siblings.indexOf(first);
  return {
    step: pages.indexOf(page) + 1,
    steps: pages.length,
    name: first?.dataset.pageName || '',
    part: mode === 'page' || siblings.length < 2 ? '' : `${part + 1} of ${siblings.length}`,
    done: (pages.indexOf(page) + (mode === 'page' ? 1 : (part + 1) / siblings.length)) / pages.length,
  };
}

const countLabel = (p) => [`Step ${p.step} of ${p.steps}`, p.name, p.part].filter(Boolean).join(' · ');

function syncStepOf(form, { unit, mode }) {
  const p = progressOf(form, unit, mode);
  const text = `, step ${p.step} of ${p.steps}${p.part ? `, part ${p.part}` : ''}`;
  form.style.setProperty('--step-progress', String(p.done));
  form.querySelectorAll('.stepper__steps > [data-step]:not([hidden]) [data-step-of]').forEach((span) => {
    span.textContent = text;
  });
}

/* ---------- controller ---------- */

/**
 * Wire the form as a stepper. `film` is the engine (focus moves through
 * focusInScene), `sfx` the boot() facade: the success chime is the only
 * voice the form plays (DIRECTION §8; the click blip is automatic).
 */
export function initPartnerForm({ form, success, film, sfx }) {
  let attempted = false;
  const focusTo = (el, opts = {}) => focusInScene(el, { film, ...opts });
  // Explicit aria-invalid="false" until a Next: Chrome otherwise reports the
  // empty required selects and checkboxes as "invalid" before anyone answers.
  RULES.forEach(({ field }) => setFieldError(form, field, ''));

  /** Errors of one unit: shown inline, returned for the stepper's status line and focus. */
  const validateUnit = (stepEls) => {
    attempted = true;
    const rules = rulesIn(form, stepEls);
    const errors = validate(readValues(form)).filter((e) => rules.some((r) => r.field === e.field));
    rules.forEach(({ field }) => setFieldError(form, field, errors.find((e) => e.field === field)?.message));
    return errors.map((e) => ({ ...e, field: fieldEl(form, e.field) }));
  };

  const stepper = createStepper(form, {
    pageWhen: PAGE_WHEN,
    validateUnit,
    film,
    focusTo,
    countText: ({ unit, mode }) => countLabel(progressOf(form, unit, mode)),
    onStep: (state) => syncStepOf(form, state),
    onSubmit: (via) => submit({ form, success, via: via === 'email' ? 'email' : 'whatsapp', stepper, focusTo, sfx }),
  });

  syncStepOf(form, stepper);

  // Recheck as you type, once a Next has been tried: a field that becomes valid drops its error.
  const recheck = (name) => {
    if (!attempted || !name) return;
    const errors = validate(readValues(form));
    const related = name === 'licence' || name === 'category' ? [name, 'licence', 'issuer'] : [name];
    related.forEach((field) => {
      if (errorEl(form, field)?.hidden && !errors.some((e) => e.field === field)) return;
      setFieldError(form, field, errors.find((e) => e.field === field)?.message);
    });
  };

  form.elements.category.addEventListener('change', (e) => {
    renderTypes(form, e.target.value);
    updateLicenceState(form, e.target.value);
  });
  form.addEventListener('change', (e) => recheck(e.target.name));
  form.addEventListener('input', (e) => recheck(e.target.name));
  success.querySelector('#apply-edit').addEventListener('click', () => {
    toggleSuccess(form, success, false);
    stepper.showIndex();
    stepper.go(0, { focus: false, cause: 'edit' });
    focusTo(fieldEl(form, 'business'), { afterLayout: true });
  });
  setupEmailOption(form);
  return stepper;
}

function submit({ form, success, via, stepper, focusTo, sfx }) {
  const values = readValues(form);
  if (values.website) {
    // Honeypot filled: almost certainly a bot. Pretend it worked, open nothing.
    showSuccess({ form, success, via, href: '', stepper, focusTo });
    return;
  }
  const href = handOffLink(via, values);
  emailCopy(via, values);
  if (href.startsWith('mailto:')) window.location.href = href;
  else window.open(href, '_blank', 'noopener');
  sfx?.play('success');
  showSuccess({ form, success, via, href, stepper, focusTo });
}

function showSuccess({ form, success, via, href, stepper, focusTo }) {
  const email = via === 'email' && CONTACT_EMAIL;
  success.querySelector('[data-success-text]').textContent = email
    ? 'Your email app has opened with your application written out. Nothing is sent until you press send.'
    : 'WhatsApp has opened in a new tab with your application written out. Nothing is sent until you tap send.';
  const retry = success.querySelector('[data-success-retry]');
  retry.hidden = !href;
  if (href) success.querySelector('#apply-success-link').href = href;
  stepper.hideIndex();
  toggleSuccess(form, success, true);
  focusTo(success.querySelector('#apply-success-title'), { afterLayout: true });
}

function toggleSuccess(form, success, done) {
  form.hidden = done;
  success.hidden = !done;
}

function setupEmailOption(form) {
  const hasEmail = Boolean(CONTACT_EMAIL);
  form.querySelectorAll('[data-email-only]').forEach((el) => { el.hidden = !hasEmail; });
  form.querySelectorAll('[data-email-missing]').forEach((el) => { el.hidden = hasEmail; });
  form.querySelectorAll('[data-email-label]').forEach((el) => { el.textContent = CONTACT_EMAIL_LABEL; });
}

/** Preselect a tier (P3's choice, or ?tier=). Returns true when the choice changed. */
export function selectTier(form, tier) {
  const select = form?.elements.tier;
  if (!select || !(tier in TIER_NAMES) || select.value === tier) return false;
  select.value = tier;
  return true;
}
