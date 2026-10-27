/**
 * Shared fakes for the api/ handler tests: a request, a response that records
 * what the handler wrote, and a stubbed global fetch that answers by URL and
 * records every call (no network).
 */

const GOOGLE_ENV = Object.freeze({
  GOOGLE_CLIENT_ID: 'test-client',
  GOOGLE_CLIENT_SECRET: 'test-secret',
  GOOGLE_REFRESH_TOKEN: 'test-refresh',
  GOOGLE_CALENDAR_ID: 'owner@example.com',
});
const MAIL_ENV = Object.freeze({ RESEND_API_KEY: 're_test' });
const ALL_KEYS = [...Object.keys(GOOGLE_ENV), ...Object.keys(MAIL_ENV), 'BOOKING_NOTIFY_EMAIL', 'RESEND_FROM'];

/** Sets the env for one test: mail always, Google when `google` is true. */
export function setEnv({ google = true, mail = true } = {}) {
  for (const key of ALL_KEYS) delete process.env[key];
  if (mail) Object.assign(process.env, MAIL_ENV);
  if (google) Object.assign(process.env, GOOGLE_ENV);
}

let ipCounter = 0;
/** A fresh client IP, so one test's requests never trip another's rate limit. */
export const freshIp = () => {
  ipCounter += 1;
  return `198.51.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
};

export function fakeReq({ method = 'POST', body, url = '/', query, ip = freshIp() } = {}) {
  return {
    method,
    url,
    query,
    body,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `${ip}, 10.0.0.1` },
    socket: { remoteAddress: '10.0.0.1' },
  };
}

export function fakeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { res.headers[name.toLowerCase()] = value; },
    end(chunk = '') { res.body += chunk; res.ended = true; },
    get json() { return JSON.parse(res.body); },
  };
  return res;
}

const jsonResponse = (status, payload) => new Response(JSON.stringify(payload), {
  status, headers: { 'Content-Type': 'application/json' },
});

/**
 * Replaces global fetch. `routes` maps a name to a handler(url, init) returning
 * [status, payload]; names: token, freeBusy, events (list), insert, resend.
 * Returns { calls, emails, restore }.
 */
export function stubFetch(routes = {}) {
  const original = globalThis.fetch;
  const calls = [];
  const emails = [];
  const defaults = {
    token: () => [200, { access_token: 'ya29.test', expires_in: 3600 }],
    freeBusy: () => [200, { calendars: { [GOOGLE_ENV.GOOGLE_CALENDAR_ID]: { busy: [] } } }],
    events: () => [200, { items: [] }],
    insert: (url, init) => {
      const event = JSON.parse(init.body);
      return [200, { id: 'evt123', hangoutLink: 'https://meet.google.com/abc-defg-hij', start: event.start }];
    },
    resend: () => [200, { id: `mail${emails.length - 1}` }],
  };
  const pick = (url, init) => {
    if (url.startsWith('https://oauth2.googleapis.com/token')) return 'token';
    if (url.includes('/freeBusy')) return 'freeBusy';
    if (url.includes('/events') && (init?.method || 'GET') === 'POST') return 'insert';
    if (url.includes('/events')) return 'events';
    if (url.startsWith('https://api.resend.com/')) return 'resend';
    return null;
  };
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    const name = pick(url, init);
    calls.push({ name, url, init });
    if (!name) throw new Error(`unexpected fetch ${url}`);
    if (name === 'resend') emails.push(JSON.parse(init.body));
    const [status, payload] = (routes[name] || defaults[name])(url, init);
    return jsonResponse(status, payload);
  };
  return { calls, emails, restore: () => { globalThis.fetch = original; } };
}
