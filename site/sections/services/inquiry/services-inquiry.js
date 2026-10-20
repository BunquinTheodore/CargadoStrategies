/**
 * The inquiry form (DIRECTION §7.2 S7; FR07, FR08; R4 services.md §9): a
 * 3-step stepper (ui-stepper.js) on the scene's paper.
 *   1 Service and City · 2 Your Details · 3 Message and Send
 * From 760 px wide each step is one data-page; phones take the same fields in
 * five shorter steps (R4 partners `pageWhen`), so no step outgrows the screen.
 *
 * There is no backend yet: a valid inquiry is handed off to WhatsApp (or to
 * email once CONTACT_EMAIL exists and the visitor prefers email), written out
 * in full, so nothing is sent until the visitor taps send. City with its
 * reason (CR10), consent (CR06), the commission notice (CR17) and a honeypot
 * (a filled one silently "succeeds" without a hand-off) are kept.
 * Required fields use aria-required, not `required`: validation is ours.
 */
import { CONTACT_EMAIL, SITE_NAME } from '../../../assets/js/config.js';
import { escapeHtml } from '../../../core/chrome/chrome.js';
import { waLink } from '../../../core/chrome/whatsapp.js';
import { createStepper } from '../../../core/ui/ui-stepper.js';
import { OURS, PARTNER_ONLY } from '../services-data.js';
import { titleCase } from '../../../core/lib/text-case.js';
import { sendInquiry } from '../../../core/lib/send-inquiry.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_DIGITS_MIN = 7;
const CONTACT_LABELS = Object.freeze({ whatsapp: 'WhatsApp', phone: 'Phone Call', email: 'Email' });
const STEP_TITLE = (unit, total, name) => `Step ${unit + 1} of ${total} · ${name}`;
const PAGE_QUERY = '(min-width: 760px)';

function categoryOptions() {
  const opt = (c) => `<option value="${c.slug}">${escapeHtml(titleCase(c.name))}</option>`;
  return `<option value="">Choose a service</option>
    <optgroup label="Ours">${OURS.map(opt).join('')}</optgroup>
    <optgroup label="Partners">${PARTNER_ONLY.map(opt).join('')}</optgroup>
    <option value="not-sure">Not sure yet</option>`;
}

function readForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    ...data,
    consent: form.elements.consent.checked,
    name: (data.name || '').trim(),
    city: (data.city || '').trim(),
    description: (data.description || '').trim(),
  };
}

/** Returns [{ id, message }] for every invalid field, in form order. */
export function validateInquiry(d) {
  const errors = [];
  const digits = (d.phone || '').replace(/\D/g, '');
  if (!d.category) errors.push({ id: 'category', message: 'Choose a service, or “Not sure yet”.' });
  if (!d.city) errors.push({ id: 'city', message: 'Add your city or area so we can find someone close to you.' });
  if (!d.name) errors.push({ id: 'name', message: 'Please add your name.' });
  if (d.phone && digits.length < PHONE_DIGITS_MIN) errors.push({ id: 'phone', message: 'This number looks too short.' });
  else if (d.contact !== 'email' && !digits && d.email) errors.push({ id: 'phone', message: 'Add a number, or choose email as the way to reach you.' });
  if (d.email && !EMAIL_PATTERN.test(d.email)) errors.push({ id: 'email', message: 'This email doesn’t look complete.' });
  else if (!d.email && !digits) errors.push({ id: 'email', message: 'Add an email or a phone number so we can reply.' });
  else if (d.contact === 'email' && !d.email) errors.push({ id: 'email', message: 'Add your email, or choose another way to reach you.' });
  if (!d.consent) errors.push({ id: 'consent', message: 'Please tick the box so we can use your details to reply.' });
  return errors;
}

function categoryName(form, slug) {
  const opt = form.elements.category.querySelector(`option[value="${slug}"]`);
  return opt ? opt.textContent : slug;
}

function inquiryText(d, form) {
  return [
    `Hi ${SITE_NAME},`,
    "I'm sending an inquiry from the Services page of your website.",
    `Name: ${d.name}`,
    d.email ? `Email: ${d.email}` : '',
    d.phone ? `Phone or WhatsApp: ${d.phone}` : '',
    `What I need help with: ${categoryName(form, d.category)}`,
    `My city or area (so you can introduce me to someone close to me): ${d.city}`,
    d.description ? `In a few words: ${d.description}` : '',
    `Please contact me by: ${CONTACT_LABELS[d.contact] || CONTACT_LABELS.whatsapp}`,
    'I agree that you may use these details to answer my inquiry and share them with the partner you introduce me to.',
  ].filter(Boolean).join('\n');
}

/** The owner's email copy (api/inquiry.js), sent beside the hand-off. */
function emailCopy(d, form) {
  sendInquiry('inquiry', {
    Name: d.name,
    Email: d.email,
    Phone: d.phone,
    Service: categoryName(form, d.category),
    City: d.city,
    Message: d.description,
    'Preferred contact': CONTACT_LABELS[d.contact] || CONTACT_LABELS.whatsapp,
    Consent: d.consent ? 'Yes' : 'No',
  });
}

function handoff(d, form) {
  const text = inquiryText(d, form);
  if (d.contact === 'email' && CONTACT_EMAIL) {
    const subject = encodeURIComponent(`Inquiry: ${categoryName(form, d.category)} · ${d.city}`);
    return { href: `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(text)}`, app: 'Your email app' };
  }
  return { href: waLink(text), app: 'WhatsApp' };
}

/** FR08: the confirmation, in place of the form. */
function successMarkup(name, link) {
  const opened = link ? `${link.app} opened with your inquiry written. Nothing is sent until you tap send there.` : 'We have your inquiry.';
  const retry = link
    ? `<p class="inq-success__retry">Didn't open? <a class="link" href="${link.href}" target="_blank" rel="noopener">Open it again with your inquiry</a></p>`
    : '';
  return `
  <h3 class="inq-success__title" id="inq-success-title">Thank You, ${escapeHtml(name)}.</h3>
  <p class="inq-success__text">${opened}</p>
  ${retry}
  <button class="btn btn--ghost" type="button" data-inq-reset>Start a New Inquiry</button>`;
}

/**
 * Wire the stepper in `panel` (#inquiry-panel). `sound(name)` plays an sfx voice.
 * Returns { setCategory(slug), prefill({ category, city }), stepper }.
 */
export function initInquiry({ panel, film, sound }) {
  const form = panel.querySelector('#inquiry-form');
  const success = panel.querySelector('#inquiry-success');
  const scene = panel.closest('.scene');
  form.elements.category.innerHTML = categoryOptions();

  function showErrors(errors) {
    form.querySelectorAll('.error').forEach((p) => { p.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    errors.forEach(({ id, message }) => {
      form.querySelector(`#inq-${id}-error`).textContent = message;
      form.querySelector(`#inq-${id}`).setAttribute('aria-invalid', 'true');
    });
  }

  /** The errors of the visible step only (the stepper asks per unit). */
  function validateUnit(stepEls) {
    const ids = new Set(stepEls.flatMap((s) => Array.from(s.querySelectorAll('[id^="inq-"]')).map((el) => el.id.slice(4))));
    const errors = validateInquiry(readForm(form)).filter((err) => ids.has(err.id));
    showErrors(errors);
    return errors.map((err) => ({ field: form.querySelector(`#inq-${err.id}`), message: err.message }));
  }

  function showSuccess(name, link) {
    success.innerHTML = successMarkup(name, link);
    form.hidden = true;
    success.hidden = false;
    success.focus({ preventScroll: true });
  }

  const stepper = createStepper(form, {
    pageWhen: PAGE_QUERY,
    validateUnit,
    film,
    sound,
    countText: ({ unit, total, name }) => STEP_TITLE(unit, total, name),
    onStep: ({ unit, mode }) => {
      scene.dataset.step = String(unit + 1);
      form.dataset.mode = mode;
    },
    onSubmit: () => {
      const data = readForm(form);
      if (data.website) return showSuccess(data.name || 'you', null); // honeypot: no hand-off
      const link = handoff(data, form);
      window.open(link.href, '_blank', 'noopener');
      emailCopy(data, form);
      return showSuccess(data.name, link);
    },
  });
  scene.dataset.step = '1';
  form.dataset.mode = stepper.mode;

  success.addEventListener('click', (event) => {
    if (!event.target.closest('[data-inq-reset]')) return;
    form.reset();
    showErrors([]);
    success.hidden = true;
    form.hidden = false;
    stepper.go(0);
  });

  return {
    stepper,
    setCategory(slug) {
      if (!form.elements.category.querySelector(`option[value="${slug}"]`)) return;
      form.elements.category.value = slug;
      if (stepper.unit !== 0) stepper.go(0, { focus: false });
    },
    /** Service and city given elsewhere (the S6 concierge): with both set, step 1 is done, so open on step 2. */
    prefill({ category = '', city = '' }) {
      if (category && form.elements.category.querySelector(`option[value="${category}"]`)) form.elements.category.value = category;
      if (city) form.elements.city.value = city;
      const done = form.elements.category.value && form.elements.city.value.trim();
      if (done && stepper.unit === 0 && !form.hidden) stepper.go(1, { focus: false });
    },
  };
}
