/**
 * Google Calendar v3 over REST with fetch (no dependency), as the owner's own
 * Google account through an OAuth refresh token (tools/google-auth.mjs makes
 * one; docs/setup-google-calendar.md). Env, read per call:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN  (all three = configured)
 *   GOOGLE_CALENDAR_ID  (optional, default 'primary')
 * Every call throws on a non-2xx answer; callers fall back to email.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const TOKEN_EARLY_MS = 60 * 1000;
const MAX_LISTED_EVENTS = 50;

let cachedToken = null;

export function isGoogleConfigured() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN);
}

const calendarId = () => process.env.GOOGLE_CALENDAR_ID || 'primary';
const calendarPath = () => `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}`;

/** Forgets the cached access token (tests, or after a 401). */
export function resetGoogleToken() {
  cachedToken = null;
}

async function readJson(response, what) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = result.error?.message || result.error_description || result.error || '';
    throw new Error(`Google ${what} ${response.status}: ${typeof reason === 'string' ? reason : ''}`.trim());
  }
  return result;
}

/** A fresh access token, cached in this instance until a minute before it expires. */
export async function getAccessToken() {
  if (!isGoogleConfigured()) throw new Error('Google is not configured');
  const owner = process.env.GOOGLE_REFRESH_TOKEN;
  if (cachedToken && cachedToken.owner === owner && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: owner,
      grant_type: 'refresh_token',
    }).toString(),
  });
  const result = await readJson(response, 'token');
  const lifetimeMs = Number(result.expires_in || 0) * 1000;
  cachedToken = { owner, value: result.access_token, expiresAt: Date.now() + Math.max(0, lifetimeMs - TOKEN_EARLY_MS) };
  return result.access_token;
}

async function calendarFetch(url, what, { method = 'GET', body } = {}) {
  const token = await getAccessToken();
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401) resetGoogleToken();
  return readJson(response, what);
}

/** The busy blocks of the booking calendar between two instants: [{ start, end }]. */
export async function freeBusy(timeMin, timeMax) {
  const result = await calendarFetch(`${CALENDAR_API}/freeBusy`, 'freeBusy', {
    method: 'POST',
    body: { timeMin, timeMax, items: [{ id: calendarId() }] },
  });
  const calendar = result.calendars?.[calendarId()] || Object.values(result.calendars || {})[0];
  if (!calendar || calendar.errors?.length) throw new Error('Google freeBusy: calendar not readable');
  return (calendar.busy || []).map(({ start, end }) => ({ start, end }));
}

const meetLinkOf = (event) => event.hangoutLink
  || event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri
  || null;

/** Creates the event with a Google Meet link and invites the attendee: { id, meetUrl }. */
export async function createEvent({ start, end, summary, description, attendeeEmail }) {
  const query = new URLSearchParams({ conferenceDataVersion: '1', sendUpdates: 'all' });
  const event = await calendarFetch(`${calendarPath()}/events?${query}`, 'events.insert', {
    method: 'POST',
    body: {
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: [{ email: attendeeEmail }],
      conferenceData: {
        createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
      reminders: { useDefault: true },
    },
  });
  return { id: event.id, meetUrl: meetLinkOf(event) };
}

const hasAttendee = (event, email) => (event.attendees || [])
  .some((attendee) => String(attendee.email || '').toLowerCase() === email && attendee.responseStatus !== 'declined');

/** The live events from `fromISO` on that list `email` as an attendee (not cancelled, not declined). */
export async function listEventsByEmail(email, fromISO) {
  const wanted = String(email).trim().toLowerCase();
  const query = new URLSearchParams({
    q: wanted,
    timeMin: fromISO,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(MAX_LISTED_EVENTS),
  });
  const result = await calendarFetch(`${calendarPath()}/events?${query}`, 'events.list');
  return (result.items || []).filter((event) => event.status !== 'cancelled' && hasAttendee(event, wanted));
}
