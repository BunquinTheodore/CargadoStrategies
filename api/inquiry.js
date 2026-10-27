/**
 * POST /api/inquiry: emails every request sent from the site to the owner.
 * A Vercel Node function (root api/ deploys beside the static dist/ output).
 *
 *   body: { kind: 'inquiry'|'application'|'introduction'|'contact', page, fields: { Label: 'value', … }, hp? }
 *   →     200 { ok: true, id } · 4xx/5xx { ok: false, error }
 *
 * The site still hands every request to WhatsApp or email as before; this is a
 * copy for the owner's inbox, sent with api/_lib/mail.js (Resend REST; the
 * RESEND_API_KEY env var, never logged or returned; RESEND_FROM may override the sender).
 */
import { reply, readBody, isPlainObject } from './_lib/http.js';
import { sendMail, isMailConfigured, OWNER_EMAIL, EMAIL_PATTERN, escapeHtml, oneLine } from './_lib/mail.js';

const MAX_FIELDS = 40;
const MAX_VALUE = 2000;
const MAX_LABEL = 80;
const MAX_PAGE = 120;
const SUBJECTS = Object.freeze({
  inquiry: 'New website inquiry',
  application: 'New partner application',
  introduction: 'New introduction request',
  contact: 'New WhatsApp chat from the website',
});

/** An error message for a bad payload, or '' when it is valid. */
function invalid(body) {
  if (!Object.hasOwn(SUBJECTS, body.kind)) return 'Unknown kind.';
  if (body.page !== undefined && (typeof body.page !== 'string' || body.page.length > MAX_PAGE)) return 'Invalid page.';
  if (!isPlainObject(body.fields)) return 'Fields must be an object.';
  const entries = Object.entries(body.fields);
  if (entries.length === 0 || entries.length > MAX_FIELDS) return 'Wrong number of fields.';
  const bad = entries.some(([label, value]) => label.length > MAX_LABEL || typeof value !== 'string' || value.length > MAX_VALUE);
  return bad ? 'Each field must be a short text value.' : '';
}

const isBot = (body) => Boolean(String(body.fields.website || '').trim() || String(body.hp || '').trim());

function subjectOf({ kind, page, fields }) {
  const about = fields['Business name'] || fields.Service || page || 'Website';
  return oneLine(`${SUBJECTS[kind]} — ${about}`).slice(0, 150);
}

function htmlOf({ kind, page, fields }) {
  const rows = Object.entries(fields)
    .filter(([label, value]) => label !== 'website' && value.trim())
    .map(([label, value]) => `<tr><th align="left" valign="top" style="padding:6px 16px 6px 0;white-space:nowrap">${escapeHtml(label)}</th>`
      + `<td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`)
    .join('');
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
<h2 style="font-size:18px;margin:0 0 12px">${escapeHtml(SUBJECTS[kind])}</h2>
<p style="margin:0 0 16px;color:#555">Sent from the ${escapeHtml(page || 'website')} page of the Cargado Strategies website.</p>
<table cellspacing="0" cellpadding="0">${rows}</table>
</div>`;
}

function textOf({ kind, page, fields }) {
  const lines = Object.entries(fields).filter(([label, value]) => label !== 'website' && value.trim())
    .map(([label, value]) => `${label}: ${value}`);
  return [SUBJECTS[kind], `Page: ${page || 'website'}`, '', ...lines].join('\n');
}

async function sendEmail(body) {
  const email = String(body.fields.Email || '').trim();
  const { id } = await sendMail({
    to: OWNER_EMAIL,
    subject: subjectOf(body),
    html: htmlOf(body),
    text: textOf(body),
    replyTo: EMAIL_PATTERN.test(email) ? email : undefined,
  });
  return id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { ok: false, error: 'Method not allowed.' });
  }
  const body = readBody(req);
  if (!body) return reply(res, 400, { ok: false, error: 'Send a JSON body of at most 20 KB.' });
  const problem = invalid(body);
  if (problem) return reply(res, 400, { ok: false, error: problem });
  if (isBot(body)) return reply(res, 200, { ok: true, id: null });

  if (!isMailConfigured()) {
    console.error('inquiry: RESEND_API_KEY is not set');
    return reply(res, 500, { ok: false, error: 'Email is not configured.' });
  }
  try {
    const id = await sendEmail(body);
    return reply(res, 200, { ok: true, id });
  } catch (error) {
    console.error('inquiry: send failed', error.message);
    return reply(res, 502, { ok: false, error: 'The email could not be sent.' });
  }
}
