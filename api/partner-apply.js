/**
 * POST /api/partner-apply: a partner application from partners.html. It is
 * stored for the admin dashboard (partnerApplications/{id}, status 'pending')
 * when Firebase is configured, and always emailed to the owner (as
 * api/inquiry.js did before). Applying needs no login (spec §10b).
 *
 *   body: { page?, fields: { 'Business name', 'Contact name', Email, … }, hp? }
 *   → 200 { ok: true, id, stored } · 400 invalid · 429 rate_limited · 502 not_sent
 */
import { reply, rejectMethod, readBody, isPlainObject, clientIp, isRateLimited } from './_lib/http.js';
import { sendMail, isMailConfigured, OWNER_EMAIL, EMAIL_PATTERN, escapeHtml, oneLine } from './_lib/mail.js';
import { isFirebaseServerConfigured, commit, setWrite } from './_lib/firebase.js';
import { newId } from './_lib/store.js';

const RATE = Object.freeze({ limit: 5, windowMs: 10 * 60 * 1000 });
const MAX_FIELDS = 40;
const MAX_VALUE = 2000;
const MAX_LABEL = 80;
const HONEYPOT = 'website';
const SUBJECT = 'New partner application';

const fieldText = (fields, label) => String(fields[label] || '').trim();

/** The bad parts of the payload ([] when valid). */
function problems(body) {
  if (!isPlainObject(body.fields)) return ['fields'];
  const entries = Object.entries(body.fields);
  if (entries.length === 0 || entries.length > MAX_FIELDS) return ['fields'];
  if (entries.some(([label, value]) => label.length > MAX_LABEL || typeof value !== 'string' || value.length > MAX_VALUE)) return ['fields'];
  return [
    !fieldText(body.fields, 'Business name') && 'Business name',
    !EMAIL_PATTERN.test(fieldText(body.fields, 'Email')) && 'Email',
  ].filter(Boolean);
}

const rowsOf = (fields) => Object.entries(fields).filter(([label, value]) => label !== HONEYPOT && value.trim());

function ownerMail(fields, page, email) {
  const rows = rowsOf(fields);
  const cells = rows.map(([label, value]) => `<tr><th align="left" valign="top" style="padding:6px 16px 6px 0;white-space:nowrap">${escapeHtml(label)}</th>`
    + `<td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join('');
  return {
    to: OWNER_EMAIL,
    subject: oneLine(`${SUBJECT} — ${fieldText(fields, 'Business name')}`),
    replyTo: email,
    text: [SUBJECT, `Page: ${page || 'partners'}`, '', ...rows.map(([label, value]) => `${label}: ${value}`)].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111"><h2 style="font-size:18px;margin:0 0 12px">${SUBJECT}</h2>`
      + `<p style="margin:0 0 16px;color:#555">Sent from the ${escapeHtml(page || 'partners')} page of the Cargado Strategies website. It is also in the admin dashboard.</p>`
      + `<table cellspacing="0" cellpadding="0">${cells}</table></div>`,
  };
}

/** Stores the application; → its id, or null when Firebase is off or the write failed. */
async function store(fields, page, email) {
  if (!isFirebaseServerConfigured()) return null;
  const id = newId();
  try {
    await commit([setWrite(`partnerApplications/${id}`, {
      email,
      inviteEmail: email,
      business: fieldText(fields, 'Business name'),
      contact: fieldText(fields, 'Contact name'),
      fields: Object.fromEntries(rowsOf(fields)),
      page: oneLine(String(page || '')).slice(0, 120),
      status: 'pending',
      createdAt: new Date(),
    }, { exists: false })]);
    return id;
  } catch (error) {
    console.error('partner-apply: store failed', error.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return;
  if (isRateLimited('partner-apply', clientIp(req), RATE)) return reply(res, 429, { ok: false, error: 'rate_limited' });
  const body = readBody(req);
  if (!body) return reply(res, 400, { ok: false, error: 'invalid', fields: [] });
  const bad = problems(body);
  if (bad.length) return reply(res, 400, { ok: false, error: 'invalid', fields: bad });
  if (fieldText(body.fields, HONEYPOT) || String(body.hp || '').trim()) return reply(res, 200, { ok: true, id: null, stored: false });

  const email = fieldText(body.fields, 'Email').toLowerCase();
  const id = await store(body.fields, body.page, email);
  let mailed = false;
  if (isMailConfigured()) {
    try {
      await sendMail(ownerMail(body.fields, body.page, email));
      mailed = true;
    } catch (error) {
      console.error('partner-apply: email failed', error.message);
    }
  } else {
    console.error('partner-apply: RESEND_API_KEY is not set');
  }
  if (!id && !mailed) return reply(res, 502, { ok: false, error: 'not_sent' });
  return reply(res, 200, { ok: true, id, stored: Boolean(id) });
}
