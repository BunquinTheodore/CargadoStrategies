/**
 * The Lite booking form's pure parts: request helper, option and result markup, and the
 * form values to POST /api/book payload step. No DOM access, so tests/lite-book.test.mjs
 * runs it in Node. Validation, labels, the payload and every result message come from
 * the main site's booking-ui.js unchanged.
 */
import { CATEGORIES, WHATSAPP_BASE, categoryBySlug } from '../site/assets/js/config.js';
import { titleCase } from '../site/core/lib/text-case.js';
import { buildBookingPayload } from '../site/sections/contact/book/booking-ui.js';

export const SLOTS_URL = '/api/slots';
export const BOOK_URL = '/api/book';
export const SLOTS_TIMEOUT_MS = 6000;
export const BOOK_TIMEOUT_MS = 20000;

const NEW_TAB = 'target="_blank" rel="noopener"';
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (c) => ESCAPES[c]);

/** fetch with a timeout: { status, body } or null (no answer, or not JSON). Never logs. */
export async function requestJson(url, options, timeoutMs) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: abort.signal });
    const body = await response.json().catch(() => null);
    return body ? { status: response.status, body } : null;
  } catch {
    return null; // offline, blocked or timed out: the caller falls back
  } finally {
    clearTimeout(timer);
  }
}

export function serviceOptionsHtml(categories = CATEGORIES) {
  const option = (c) => `<option value="${escapeHtml(c.slug)}">${escapeHtml(titleCase(c.name))}</option>`;
  const ours = categories.filter((c) => c.ownership !== 'partner');
  const partners = categories.filter((c) => c.ownership === 'partner');
  return `<option value="">Choose a service</option>
    <optgroup label="Cargado Strategies">${ours.map(option).join('')}</optgroup>
    <optgroup label="Partner Introductions">${partners.map(option).join('')}</optgroup>`;
}

export function slotOptionsHtml(slots) {
  if (!slots.length) return '<option value="">No times left on this day</option>';
  return `<option value="">Choose a time</option>${slots.map((s) => `<option value="${escapeHtml(s.start)}">${escapeHtml(s.label)}</option>`).join('')}`;
}

export const safeMeetUrl = (url) => (/^https:\/\/[^\s"'<>]+$/.test(url) ? url : '');

export function successHtml(result) {
  const meet = safeMeetUrl(result.meetUrl);
  const link = meet
    ? `<a class="btn btn--primary" href="${escapeHtml(meet)}" ${NEW_TAB}>Open Google Meet<span class="vh"> (opens in a new tab)</span></a>`
    : '';
  return `
  <h2 class="h3 book-success__title">${escapeHtml(result.title)}</h2>
  <p class="book-success__text">${escapeHtml(result.text)}</p>
  ${link}`;
}

/** The status line: the message, plus a WhatsApp link (built from config) when the answer asks for one. */
export function statusHtml(result, whatsappUrl = WHATSAPP_BASE) {
  const wa = result.whatsapp ? ` <a class="link" href="${escapeHtml(whatsappUrl)}" ${NEW_TAB}>Message on WhatsApp</a>` : '';
  return `${escapeHtml(result.text)}${wa}`;
}

/** The form's named values, as booking-ui.js expects them (service is the Title Case name, not the slug). */
export function valuesFromForm(data, consent) {
  const category = categoryBySlug(data.service || '');
  return { ...data, consent: Boolean(consent), service: category ? titleCase(category.name) : '' };
}

/** The POST /api/book body for the form's fields. The `website` honeypot maps to `hp`; there is no idToken. */
export const bookingPayload = (data, consent) => buildBookingPayload(valuesFromForm(data, consent));
