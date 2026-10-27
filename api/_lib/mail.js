/**
 * Email through the Resend REST API with fetch (no dependency). The key is the
 * RESEND_API_KEY env var (Vercel, .env.local) and is never logged or returned.
 * RESEND_FROM may override the sender. Env is read per call.
 *
 *   await sendMail({ to: 'a@b.ca', subject, html, text, replyTo })  → { id }
 */

const RESEND_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Cargado Strategies <noreply@gnlab.studio>';

/** The owner's inbox: every inquiry and booking notice goes here. */
export const OWNER_EMAIL = 'malee.holgado@mygreatway.ca';
export const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
export const oneLine = (value) => String(value).replace(/[\r\n\t]+/g, ' ').trim();

export const isMailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/** Sends one email; throws when the key is missing or Resend refuses it. */
export async function sendMail({ to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const message = {
    from: process.env.RESEND_FROM || DEFAULT_FROM,
    to: Array.isArray(to) ? to : [to],
    subject: oneLine(subject).slice(0, 150),
    html,
    text,
    ...(replyTo && EMAIL_PATTERN.test(replyTo) ? { reply_to: replyTo } : {}),
  };
  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Resend ${response.status}: ${result.name || ''} ${result.message || ''}`.trim());
  return { id: result.id };
}
