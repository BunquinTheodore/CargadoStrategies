/**
 * Partner approval (spec §10b): the role is granted only to an account whose
 * email is verified and equals the application's invite address, either at
 * approval (the account exists) or later on first sign-in (api/claim-partner.js).
 * Until then the application is 'invited' and the applicant gets an invite email.
 */
import { getDoc, commit, setWrite, runQuery } from './firebase.js';
import { sendMail, escapeHtml } from './mail.js';

const BRAND = 'Cargado Strategies';
const DEFAULT_SITE_URL = 'https://www.cargadostrategies.ca';

/** The site origin for links in emails: SITE_URL, else the request's host. */
export function siteOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const host = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '');
  return host ? `https://${host}` : DEFAULT_SITE_URL;
}

/** Gives `uid` the partner role (an admin keeps admin) and opens partners/{uid}. */
export async function grantPartner(uid, email, applicationId, application) {
  const user = await getDoc(`users/${uid}`);
  const userWrite = user
    ? setWrite(`users/${uid}`, { role: user.role === 'admin' ? 'admin' : 'partner' }, { merge: true })
    : setWrite(`users/${uid}`, { role: 'partner', email, name: application.contact || '', points: 0 }, { exists: false });
  await commit([
    userWrite,
    setWrite(`partners/${uid}`, {
      status: 'active',
      applicationId,
      business: application.business || '',
      contact: application.contact || '',
      email,
      approvedAt: new Date(),
    }, { merge: true }),
    setWrite(`partnerApplications/${applicationId}`, { status: 'approved', partnerUid: uid, approvedAt: new Date() }, { merge: true }),
  ]);
}

/** Marks the application invited (to `email`) and sends the one invitation email. */
export async function invitePartner(applicationId, application, email, origin) {
  await commit([setWrite(`partnerApplications/${applicationId}`, { status: 'invited', inviteEmail: email, invitedAt: new Date() }, { merge: true })]);
  const link = `${origin}/account.html`;
  const name = application.contact || 'there';
  const lines = [
    `Hello ${name},`,
    `${BRAND} has approved your partner application${application.business ? ` for ${application.business}` : ''}.`,
    `To open your partner dashboard, create an account with this email address (${email}) and confirm it: ${link}`,
    'If you already have an account with this address, sign in and confirm your email.',
  ];
  await sendMail({
    to: email,
    subject: `Your ${BRAND} partner account`,
    text: lines.join('\n\n'),
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">${lines.map((line) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`).join('')}</div>`,
  });
}

/** The invited application for this verified email, or null: { id, data }. */
export async function invitedApplicationFor(email) {
  const rows = await runQuery('partnerApplications', [['inviteEmail', '==', email]], { limit: 10 });
  return rows.find((row) => row.data.status === 'invited') || null;
}
