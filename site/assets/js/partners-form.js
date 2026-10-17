/**
 * Partner application form (FR10): category + types from config, licence
 * rules, validation with clear errors, honeypot, hand-off to WhatsApp (or
 * email once CONTACT_EMAIL exists) and the "we review each one" success state.
 * Sounds go through the page's `sound(name, options)` (sfx.play): a pop when the
 * category changes, a soft falling two-note when answers need another look, a chime on success.
 *
 * Nothing is stored or sent by the page itself: the visitor sends the
 * prefilled message from their own WhatsApp / email app.
 */
import { CATEGORIES, CONTACT_EMAIL, CONTACT_EMAIL_LABEL, SITE_NAME, categoryBySlug } from './config.js';
import { waLink } from './whatsapp.js';
import { escapeHtml } from './chrome.js';

/** Categories where a current licence is required to be listed (CR02). */
const LICENCE_REQUIRED = new Set(['insurance', 'legal', 'mortgage', 'real-estate']);
const OTHER_CATEGORY = { slug: 'other', name: 'Something else (tell us under About your work)' };
const TIER_NAMES = { community: 'Community', growth: 'Growth', premier: 'Premier' };
const MIN_PHONE_DIGITS = 10;
const MIN_REFERENCES = 10;
const MIN_ABOUT = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ID_PREFIX = 'pa-';
const ERROR_SOUND = { name: 'error' }; // the shared soft falling two-note: "look again"
const silent = () => {};

const filled = (value) => value.length > 0;
const digitCount = (value) => value.replace(/\D/g, '').length;
const needsLicence = (v) => LICENCE_REQUIRED.has(v.category);
const categoryName = (slug) => (slug === OTHER_CATEGORY.slug ? 'Other' : categoryBySlug(slug)?.name || '');

/** Validation rules, in form order. `message` may depend on the values. */
const RULES = [
  { field: 'business', ok: (v) => filled(v.business), message: 'Enter your business name.' },
  { field: 'entity', ok: (v) => filled(v.entity), message: 'Enter the legal entity name. If it is the same as your business name, enter that again.' },
  { field: 'contact', ok: (v) => filled(v.contact), message: 'Enter the name of the person we should contact.' },
  { field: 'email', ok: (v) => EMAIL_PATTERN.test(v.email), message: 'Enter an email address like name@example.com.' },
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
  { field: 'references', ok: (v) => v.references.length >= MIN_REFERENCES, message: 'Add at least one professional reference: a name and how to reach them.' },
  { field: 'about', ok: (v) => v.about.length >= MIN_ABOUT, message: `Tell us about your work in a sentence or two (at least ${MIN_ABOUT} characters).` },
  { field: 'conduct', ok: (v) => v.conduct, message: 'Tick the box to agree to the Partner Code of Conduct. We only accept partners who follow it.' },
  { field: 'consent', ok: (v) => v.consent, message: 'Tick the box so we can use these details to review your application.' },
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

function renderSummary(box, errors) {
  if (!errors.length) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  const noun = errors.length === 1 ? 'One answer needs' : `${errors.length} answers need`;
  const items = errors
    .map((e) => `<li><a href="#${ID_PREFIX}${e.field}" data-field="${e.field}">${escapeHtml(e.message)}</a></li>`)
    .join('');
  box.innerHTML = `<p class="apply-errors__title" id="apply-errors-title">${noun} a second look:</p>
    <ul class="apply-errors__list">${items}</ul>`;
  box.setAttribute('aria-labelledby', 'apply-errors-title');
  box.hidden = false;
}

/* ---------- controller ---------- */

/**
 * Wire the form. `focusTo(el, { afterLayout })` is supplied by the page: it
 * moves focus (and the film or page) to el, optionally waiting until the
 * layout has settled after a content change (the film rebuilds then).
 * `sound(name, options)` plays feedback (optional).
 */
export function initPartnerForm({ form, success, focusTo, sound = silent }) {
  const summary = form.querySelector('#apply-errors');
  let attempted = false;
  // Explicit aria-invalid="false" until a submit: Chrome otherwise reports the
  // empty required selects and checkboxes as "invalid" before anyone answers.
  RULES.forEach(({ field }) => setFieldError(form, field, ''));

  const showErrors = (errors) => {
    RULES.forEach(({ field }) => setFieldError(form, field, errors.find((e) => e.field === field)?.message));
    renderSummary(summary, errors);
  };

  const recheck = (name) => {
    if (!attempted) return;
    const errors = validate(readValues(form));
    const related = name === 'licence' || name === 'category' ? [name, 'licence', 'issuer'] : [name];
    related.forEach((field) => setFieldError(form, field, errors.find((e) => e.field === field)?.message));
  };

  form.elements.category.addEventListener('change', (e) => {
    renderTypes(form, e.target.value);
    updateLicenceState(form, e.target.value);
    sound('pop');
  });
  form.addEventListener('change', (e) => recheck(e.target.name));
  form.addEventListener('input', (e) => recheck(e.target.name));
  summary.addEventListener('click', (e) => focusErrorField(e, form, focusTo));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    attempted = true;
    submit({ form, success, summary, via: e.submitter?.value || 'whatsapp', showErrors, focusTo, sound });
  });
  success.querySelector('#apply-edit').addEventListener('click', () => {
    toggleSuccess(form, success, false);
    focusTo(fieldEl(form, 'business'), { afterLayout: true });
  });
  setupEmailOption(form);
}

function submit({ form, success, summary, via, showErrors, focusTo, sound }) {
  const values = readValues(form);
  if (values.website) {
    // Honeypot filled: almost certainly a bot. Pretend it worked, open nothing.
    showSuccess({ form, success, via, href: '', focusTo });
    return;
  }
  const errors = validate(values);
  showErrors(errors);
  if (errors.length) {
    sound(ERROR_SOUND.name, ERROR_SOUND.options);
    focusTo(summary, { afterLayout: true });
    return;
  }
  const href = handOffLink(via, values);
  if (href.startsWith('mailto:')) window.location.href = href;
  else window.open(href, '_blank', 'noopener');
  sound('success');
  showSuccess({ form, success, via, href, focusTo });
}

function showSuccess({ form, success, via, href, focusTo }) {
  const email = via === 'email' && CONTACT_EMAIL;
  success.querySelector('[data-success-text]').textContent = email
    ? 'Your email app has opened with your application written out. Nothing is sent until you press send.'
    : 'WhatsApp has opened in a new tab with your application written out. Nothing is sent until you tap send.';
  const retry = success.querySelector('[data-success-retry]');
  retry.hidden = !href;
  if (href) success.querySelector('#apply-success-link').href = href;
  toggleSuccess(form, success, true);
  focusTo(success.querySelector('#apply-success-title'), { afterLayout: true });
}

function toggleSuccess(form, success, done) {
  form.hidden = done;
  success.hidden = !done;
}

function focusErrorField(event, form, focusTo) {
  const link = event.target.closest('a[data-field]');
  if (!link) return;
  event.preventDefault(); // keep the film's hash routing out of it
  const field = fieldEl(form, link.dataset.field);
  if (field) focusTo(field);
}

function setupEmailOption(form) {
  const hasEmail = Boolean(CONTACT_EMAIL);
  form.querySelectorAll('[data-email-only]').forEach((el) => { el.hidden = !hasEmail; });
  form.querySelectorAll('[data-email-missing]').forEach((el) => { el.hidden = hasEmail; });
  form.querySelectorAll('[data-email-label]').forEach((el) => { el.textContent = CONTACT_EMAIL_LABEL; });
}

/** Preselect a tier (from the tier panels' "Apply for …" links). Returns true when the choice changed. */
export function selectTier(form, tier) {
  const select = form.elements.tier;
  if (!(tier in TIER_NAMES) || select.value === tier) return false;
  select.value = tier;
  return true;
}
