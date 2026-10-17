/**
 * Central inquiry form (FR07) with its confirmation state (FR08).
 *
 * There is no backend yet: a valid inquiry is handed off to WhatsApp (or to
 * email once CONTACT_EMAIL exists and the visitor prefers email), written out
 * in full so nothing is sent until the visitor taps send. Includes city or
 * area with the reason (CR10), consent (CR06), the commission notice (CR17)
 * and a honeypot field for spam (silently "succeeds" without a hand-off).
 * Round 3: the form sits in a 3D panel (tilt + depth layers), an invalid
 * submit nudges the first bad field and plays a low cue, success plays the
 * success chime and the confirmation turns in (CSS, film mode only).
 * Required fields use aria-required, not `required`: with native `required`
 * Chrome exposes the empty select and the consent box as "invalid" before
 * the visitor has touched them (validation here is ours, on submit).
 */
import { CONTACT_EMAIL, SITE_NAME } from './config.js';
import { escapeHtml } from './chrome.js';
import { waLink } from './whatsapp.js';
import { OURS, PARTNER_ONLY } from './services-data.js';
import { cue, shake } from './services-fx.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_DIGITS_MIN = 7;
const DESCRIPTION_MAX = 600;
const CONTACT_METHODS = Object.freeze([
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
]);
const ARROW = '<span class="btn__arrow" aria-hidden="true">→</span>';

const field = ({ id, label, input, hint = '', span = '' }) => `
  <div class="form-row ${span}">
    <label class="label" for="inq-${id}">${label}</label>
    ${input}
    ${hint ? `<p class="hint" id="inq-${id}-hint">${hint}</p>` : ''}
    <p class="error" id="inq-${id}-error"></p>
  </div>`;

const describedBy = (id, hint) => `aria-describedby="${hint ? `inq-${id}-hint ` : ''}inq-${id}-error"`;

function categorySelect() {
  const opt = (c) => `<option value="${c.slug}">${escapeHtml(c.name)}</option>`;
  return `<select class="select" id="inq-category" name="category" aria-required="true" ${describedBy('category')}>
    <option value="">Choose a service</option>
    <optgroup label="Ours">${OURS.map(opt).join('')}</optgroup>
    <optgroup label="Partners">${PARTNER_ONLY.map(opt).join('')}</optgroup>
    <option value="not-sure">Not sure yet</option>
  </select>`;
}

function contactChips() {
  return CONTACT_METHODS.map((m, i) =>
    `<label class="chip"><input type="radio" name="contact" value="${m.value}"${i === 0 ? ' checked' : ''}>${m.label}</label>`).join('');
}

function formMarkup() {
  return `
  <form class="form inq-form" id="inquiry-form" novalidate aria-labelledby="inq-title">
    <div class="inq-grid" data-depth="12">
      ${field({ id: 'name', label: 'Your name', input: `<input class="input" id="inq-name" name="name" autocomplete="name" aria-required="true" ${describedBy('name')}>` })}
      ${field({ id: 'email', label: 'Email', input: `<input class="input" id="inq-email" name="email" type="email" autocomplete="email" ${describedBy('email')}>` })}
      ${field({ id: 'phone', label: 'Phone or WhatsApp number', input: `<input class="input" id="inq-phone" name="phone" type="tel" autocomplete="tel" ${describedBy('phone')}>` })}
      ${field({ id: 'category', label: 'What do you need?', input: categorySelect() })}
      ${field({ id: 'city', label: 'City or area', hint: 'So we can introduce you to someone close to you.', input: `<input class="input" id="inq-city" name="city" autocomplete="address-level2" placeholder="e.g. Winnipeg, MB" aria-required="true" ${describedBy('city', true)}>` })}
      <fieldset class="form-row">
        <legend class="label">Best way to reach you</legend>
        <div class="chips chips--compact">${contactChips()}</div>
      </fieldset>
      ${field({ id: 'description', span: 'inq-grid__full', label: 'In a few words, what do you need?', hint: `Short is fine (up to ${DESCRIPTION_MAX} characters). Please leave out account numbers and health details.`, input: `<textarea class="textarea" id="inq-description" name="description" rows="3" maxlength="${DESCRIPTION_MAX}" ${describedBy('description', true)}></textarea>` })}
    </div>
    <div class="hp" aria-hidden="true"><label for="inq-website">Leave this field empty</label><input id="inq-website" name="website" tabindex="-1" autocomplete="off"></div>
    <div class="form-row" data-depth="8">
      <label class="check"><input type="checkbox" id="inq-consent" name="consent" aria-required="true" aria-describedby="inq-consent-error">
        <span>I agree that ${SITE_NAME} may use these details to answer my inquiry and share them with the partner I am introduced to. See the <a href="legal.html#privacy">privacy policy</a>.</span></label>
      <p class="error" id="inq-consent-error"></p>
    </div>
    <p class="notice">Partners are independent businesses. ${SITE_NAME} may receive a commission if you become a partner's client. You never pay us for an introduction. <span class="ph">[Wording to be confirmed by counsel]</span></p>
    <div class="stack stack-xs" data-depth="30">
      <button class="btn btn--primary btn--lg" type="submit">Send My Inquiry ${ARROW}</button>
      <p class="hint">Opens WhatsApp with your inquiry written. Nothing is sent until you tap send.</p>
    </div>
  </form>
  <div class="inq-success" id="inquiry-success" tabindex="-1" hidden></div>`;
}

function readForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return { ...data, consent: form.elements.consent.checked, name: (data.name || '').trim(), city: (data.city || '').trim() };
}

/** Returns [{ id, message }] for every invalid field, in form order. */
export function validateInquiry(d) {
  const errors = [];
  const digits = (d.phone || '').replace(/\D/g, '');
  if (!d.name) errors.push({ id: 'name', message: 'Please add your name.' });
  if (d.email && !EMAIL_PATTERN.test(d.email)) errors.push({ id: 'email', message: 'This email doesn’t look complete.' });
  else if (!d.email && !digits) errors.push({ id: 'email', message: 'Add an email or a phone number so we can reply.' });
  else if (d.contact === 'email' && !d.email) errors.push({ id: 'email', message: 'Add your email, or choose another way to reach you.' });
  if (d.phone && digits.length < PHONE_DIGITS_MIN) errors.push({ id: 'phone', message: 'This number looks too short.' });
  else if (d.contact !== 'email' && !digits && d.email) errors.push({ id: 'phone', message: 'Add a number, or choose email as the way to reach you.' });
  if (!d.category) errors.push({ id: 'category', message: 'Choose a service, or “Not sure yet”.' });
  if (!d.city) errors.push({ id: 'city', message: 'Add your city or area so we can find someone close to you.' });
  if (!d.consent) errors.push({ id: 'consent', message: 'Please tick the box so we can use your details to reply.' });
  return errors;
}

function showErrors(form, errors) {
  form.querySelectorAll('.error').forEach((p) => { p.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  errors.forEach(({ id, message }) => {
    form.querySelector(`#inq-${id}-error`).textContent = message;
    form.querySelector(`#inq-${id}`).setAttribute('aria-invalid', 'true');
  });
  if (!errors.length) return;
  const first = form.querySelector(`#inq-${errors[0].id}`);
  first.focus();
  shake(first.closest('.form-row'));
  cue('error');
}

function categoryName(form, slug) {
  const opt = form.elements.category.querySelector(`option[value="${slug}"]`);
  return opt ? opt.textContent : slug;
}

function inquiryText(d, form) {
  const method = CONTACT_METHODS.find((m) => m.value === d.contact)?.label || 'WhatsApp';
  return [
    `Hi ${SITE_NAME},`,
    "I'm sending an inquiry from the Services page of your website.",
    `Name: ${d.name}`,
    d.email ? `Email: ${d.email}` : '',
    d.phone ? `Phone or WhatsApp: ${d.phone}` : '',
    `What I need help with: ${categoryName(form, d.category)}`,
    `My city or area (so you can introduce me to someone close to me): ${d.city}`,
    d.description ? `In a few words: ${d.description.trim()}` : '',
    `Please contact me by: ${method}`,
    'I agree that you may use these details to answer my inquiry and share them with the partner you introduce me to.',
  ].filter(Boolean).join('\n');
}

function handoff(d, form) {
  const text = inquiryText(d, form);
  if (d.contact === 'email' && CONTACT_EMAIL) {
    const subject = encodeURIComponent(`Inquiry: ${categoryName(form, d.category)} · ${d.city}`);
    return { href: `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(text)}`, app: 'your email app' };
  }
  return { href: waLink(text), app: 'WhatsApp' };
}

function successMarkup(name, link) {
  const retry = link
    ? `<p class="t-small">Didn't open? <a href="${link.href}" target="_blank" rel="noopener">Open ${link.app} with your inquiry</a>.</p>`
    : '';
  const opened = link ? `${link.app === 'WhatsApp' ? 'WhatsApp' : 'Your email app'} opened with your inquiry written. Nothing is sent until you tap send there.` : 'We have your inquiry.';
  return `
  <p class="eyebrow">Inquiry ready</p>
  <h3 class="t-d2" id="inq-success-title">Thank You, ${escapeHtml(name)}.</h3>
  <p class="t-lead">${opened}</p>
  ${retry}
  <ol class="next-steps__list next-steps__list--compact" aria-label="What happens next">
    <li><span class="next-steps__when num">Within <span class="ph">[24h]</span></span><span>We introduce you to the right person</span></li>
    <li><span class="next-steps__when num">Day <span class="ph">[3]</span></span><span>We check in to see it went well</span></li>
  </ol>
  <button class="btn btn--ghost" type="button" data-inq-reset>Start a New Inquiry</button>`;
}

/** Render the form into `panel`. Returns { setCategory(slug) }. */
export function initInquiry({ panel }) {
  panel.innerHTML = formMarkup();
  const form = panel.querySelector('#inquiry-form');
  const success = panel.querySelector('#inquiry-success');

  function showSuccess(name, link) {
    success.innerHTML = successMarkup(name, link);
    form.hidden = true;
    success.hidden = false;
    success.focus({ preventScroll: true });
    if (link) cue('success');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = readForm(form);
    if (data.website) return showSuccess(data.name || 'you', null); // honeypot: no hand-off
    const errors = validateInquiry(data);
    showErrors(form, errors);
    if (errors.length) return undefined;
    const link = handoff(data, form);
    window.open(link.href, '_blank', 'noopener');
    return showSuccess(data.name, link);
  });

  success.addEventListener('click', (event) => {
    if (!event.target.closest('[data-inq-reset]')) return;
    form.reset();
    success.hidden = true;
    form.hidden = false;
    form.elements.name.focus({ preventScroll: true });
  });

  return {
    setCategory(slug) {
      if (form.elements.category.querySelector(`option[value="${slug}"]`)) form.elements.category.value = slug;
    },
  };
}
