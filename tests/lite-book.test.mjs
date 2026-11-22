/**
 * The Lite booking client keeps the main site's contract: the same payload, the same endpoints
 * and timeouts, the same field ids, and none of the film engine (no stepper, no sound, no idToken).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHONE, WHATSAPP_BASE } from '../site/assets/js/config.js';
import { buildBookingPayload, resultMessage } from '../site/sections/contact/book/booking-ui.js';
import {
  BOOK_TIMEOUT_MS, BOOK_URL, SLOTS_TIMEOUT_MS, SLOTS_URL,
  bookingPayload, safeMeetUrl, serviceOptionsHtml, slotOptionsHtml, statusHtml, successHtml, valuesFromForm,
} from '../site-lite/lite-book-core.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = (...parts) => readFileSync(join(ROOT, ...parts), 'utf8');

const FORM = Object.freeze({
  start: '2026-10-27T20:30:00.000Z', name: '  Ana Cruz ', email: ' ana@example.com ', phone: '',
  service: 'web-design', note: '  A new site  ', website: '',
});

test('the payload equals buildBookingPayload for the same values, with the service as its Title Case name', () => {
  const expected = buildBookingPayload({ ...FORM, service: 'Web Design', consent: true });
  assert.deepEqual(bookingPayload(FORM, true), expected);
  assert.deepEqual(bookingPayload(FORM, true), {
    start: '2026-10-27T20:30:00.000Z', name: 'Ana Cruz', email: 'ana@example.com',
    service: 'Web Design', note: 'A new site', consent: true,
  });
});

test('the honeypot field "website" maps to hp, and a filled-in form never sends an idToken', () => {
  const payload = bookingPayload({ ...FORM, website: ' http://spam.example ' }, true);
  assert.equal(payload.hp, 'http://spam.example');
  assert.equal('website' in payload, false);
  assert.equal('idToken' in payload, false);
  assert.equal('hp' in bookingPayload(FORM, true), false);
});

test('consent is a boolean and an unknown service slug is left out', () => {
  assert.equal(bookingPayload(FORM, false).consent, false);
  assert.equal(valuesFromForm({ service: 'no-such-service' }, 'on').service, '');
  assert.equal('service' in bookingPayload({ ...FORM, service: 'no-such-service' }, true), false);
});

test('endpoints and timeouts match the main form', () => {
  const main = read('site', 'sections', 'contact', 'book', 'book-form.js');
  const num = (name) => Number(main.match(new RegExp(`const ${name} = (\\d+)`))[1]);
  const str = (name) => main.match(new RegExp(`const ${name} = '([^']+)'`))[1];
  assert.equal(SLOTS_URL, str('SLOTS_URL'));
  assert.equal(BOOK_URL, str('BOOK_URL'));
  assert.equal(SLOTS_TIMEOUT_MS, num('SLOTS_TIMEOUT_MS'));
  assert.equal(BOOK_TIMEOUT_MS, num('BOOK_TIMEOUT_MS'));
  assert.deepEqual([SLOTS_URL, BOOK_URL, SLOTS_TIMEOUT_MS, BOOK_TIMEOUT_MS], ['/api/slots', '/api/book', 6000, 20000]);
});

test('lite-book.js reuses the pure modules and none of the film engine', () => {
  const source = (read('site-lite', 'lite-book.js') + read('site-lite', 'lite-book-core.js')).replace(/\/\*[\s\S]*?\*\//g, '');
  ['slots.js', 'booking-ui.js', 'book-calendar.js'].forEach((name) => assert.ok(source.includes(name), name));
  ['Book.js', 'book-form.js', 'ui-stepper.js', 'whatsapp.js', 'chrome.js', 'Section.js', 'sfx'].forEach((name) => assert.ok(!source.includes(name), name));
  assert.doesNotMatch(source, /sound|idToken|localStorage|console\./);
  assert.match(source, /apiAvailable\(location\)/);
  assert.match(source, /aria-busy/);
});

test('every form id and error id of the main form exists on the Lite form', () => {
  const ids = (html) => new Set([...html.matchAll(/\bid="(book-[\w-]+)"/g)].map((m) => m[1]));
  const main = ids(read('site', 'sections', 'contact', 'book', 'book.html'));
  const lite = ids(read('site-lite', 'book.html'));
  ['book-start', 'book-name', 'book-email', 'book-phone', 'book-service', 'book-note', 'book-consent', 'book-website',
    'book-start-error', 'book-name-error', 'book-email-error', 'book-phone-error', 'book-consent-error', 'book-form', 'book-success', 'book-start-day',
  ].forEach((id) => {
    assert.ok(main.has(id), `main has ${id}`);
    assert.ok(lite.has(id), `lite has ${id}`);
  });
  const html = read('site-lite', 'book.html');
  ['data-calendar', 'data-days', 'data-days-prev', 'data-days-next', 'data-days-month'].forEach((hook) => assert.ok(html.includes(hook), hook));
  assert.match(html, /name="website"/);
  assert.match(html, /role="status" aria-live="polite"/);
});

test('result messages are the main site\'s: pending, booked, slot taken, already booked, invalid, rate limited, network', () => {
  const start = '2026-10-27T20:30:00.000Z';
  assert.equal(resultMessage({ status: 200, body: { ok: true, pending: true } }, start).title, 'Request Received');
  assert.equal(resultMessage({ status: 200, body: { ok: true, meetUrl: 'https://meet.google.com/abc' } }, start).title, 'You Are Booked');
  assert.equal(resultMessage({ status: 409, body: { error: 'slot_taken' } }, start).step, 'time');
  assert.equal(resultMessage({ status: 409, body: { error: 'already_booked' } }, start).kind, 'already_booked');
  assert.deepEqual(resultMessage({ status: 400, body: { error: 'invalid', fields: ['email'] } }, start).fields, ['email']);
  assert.equal(resultMessage({ status: 429, body: { error: 'rate_limited' } }, start).whatsapp, true);
  assert.equal(resultMessage(null, start).kind, 'error');
});

test('the success view links only an https Meet URL; the status view builds WhatsApp from config', () => {
  assert.equal(safeMeetUrl('https://meet.google.com/abc-defg'), 'https://meet.google.com/abc-defg');
  assert.equal(safeMeetUrl('javascript:alert(1)'), '');
  assert.equal(safeMeetUrl('http://meet.example/x'), '');
  const booked = successHtml(resultMessage({ status: 200, body: { ok: true, meetUrl: 'https://meet.google.com/abc' } }, '2026-10-27T20:30:00.000Z'));
  assert.match(booked, /You Are Booked/);
  assert.match(booked, /href="https:\/\/meet\.google\.com\/abc"/);
  assert.doesNotMatch(successHtml({ title: 'x', text: 'y', meetUrl: 'javascript:alert(1)' }), /<a /);
  const limited = statusHtml(resultMessage({ status: 429, body: { error: 'rate_limited' } }));
  assert.ok(limited.includes(`href="${WHATSAPP_BASE}"`));
  assert.ok(WHATSAPP_BASE.endsWith(PHONE.whatsapp));
  assert.doesNotMatch(statusHtml(resultMessage({ status: 409, body: { error: 'slot_taken' } })), /<a /);
});

test('option markup escapes and groups', () => {
  assert.match(serviceOptionsHtml(), /<optgroup label="Cargado Strategies">[\s\S]*<optgroup label="Partner Introductions">/);
  assert.match(serviceOptionsHtml(), /<option value="web-design">Web Design<\/option>/);
  assert.match(slotOptionsHtml([]), /No times left on this day/);
  assert.match(slotOptionsHtml([{ start: '2026-10-27T20:30:00.000Z', label: '3:30 PM' }]), /<option value="2026-10-27T20:30:00.000Z">3:30 PM<\/option>/);
  assert.match(slotOptionsHtml([{ start: 'x"y', label: '<b>' }]), /value="x&quot;y">&lt;b&gt;/);
});
