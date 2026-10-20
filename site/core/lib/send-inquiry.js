/**
 * A copy of every request for the owner's inbox: POST /api/inquiry (api/inquiry.js
 * emails it). Fire and forget, beside the WhatsApp or email hand-off, never
 * instead of it: `keepalive` lets the request finish while WhatsApp opens in a
 * new tab, and a failure is only logged.
 *
 *   sendInquiry('inquiry', { Name: 'Ana', City: 'Winnipeg' });
 *
 * kind: 'inquiry' | 'application' | 'introduction' | 'contact'. Fields are
 * plain labels to text; empty values are left out.
 */
const ENDPOINT = '/api/inquiry';
const MAX_VALUE = 2000;

function cleanFields(fields) {
  return Object.fromEntries(Object.entries(fields)
    .map(([label, value]) => [label, String(value ?? '').trim().slice(0, MAX_VALUE)])
    .filter(([, value]) => value));
}

export function sendInquiry(kind, fields, page = document.body.dataset.page || '') {
  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, page, fields: cleanFields(fields) }),
      keepalive: true,
    })
      .then((response) => { if (!response.ok) console.error(`sendInquiry: ${response.status}`); })
      .catch((error) => console.error('sendInquiry failed', error));
  } catch (error) {
    console.error('sendInquiry failed', error);
  }
}
