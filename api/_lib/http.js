/**
 * Small HTTP helpers shared by the api/ functions: a JSON reply, a guarded JSON
 * body parse, the query string, the client IP and a best-effort rate limit.
 * Files under api/_lib/ are not routes (Vercel skips names starting with "_").
 */

const DEFAULT_MAX_BODY_BYTES = 20 * 1024;

export const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function reply(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

/** Answers 405 unless the request uses `method`; true when it did answer. */
export function rejectMethod(req, res, method) {
  if (req.method === method) return false;
  res.setHeader('Allow', method);
  reply(res, 405, { ok: false, error: 'method_not_allowed' });
  return true;
}

/** The parsed JSON body, or null when it is missing, not a JSON object or too large. */
export function readBody(req, maxBytes = DEFAULT_MAX_BODY_BYTES) {
  if (Number(req.headers?.['content-length'] || 0) > maxBytes) return null;
  let body = req.body;
  try {
    if (typeof body === 'string' || Buffer.isBuffer(body)) body = JSON.parse(String(body));
    if (!isPlainObject(body) || Buffer.byteLength(JSON.stringify(body)) > maxBytes) return null;
  } catch {
    return null;
  }
  return body;
}

/** One query parameter as a string ('' when absent): Vercel's req.query, else the URL. */
export function queryParam(req, name) {
  const fromQuery = req.query?.[name];
  if (fromQuery !== undefined) return String(Array.isArray(fromQuery) ? fromQuery[0] : fromQuery);
  const url = new URL(req.url || '/', 'http://localhost');
  return url.searchParams.get(name) ?? '';
}

/** The client IP: the first X-Forwarded-For hop (set by Vercel), else the socket. */
export function clientIp(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.headers?.['x-real-ip'] || '') || req.socket?.remoteAddress || 'unknown';
}

/*
 * Rate limit: a sliding window of request times per bucket and IP, in memory.
 * Best-effort only: each warm function instance keeps its own counts and a cold
 * start forgets them, which is enough to stop one script hammering an endpoint.
 */
const hits = new Map();
const MAX_TRACKED_KEYS = 5000;

function prune(now, windowMs) {
  if (hits.size < MAX_TRACKED_KEYS) return;
  for (const [key, times] of hits) {
    if (!times.length || now - times[times.length - 1] > windowMs) hits.delete(key);
  }
}

/** Records a request; true when this IP made more than `limit` requests in `windowMs`. */
export function isRateLimited(bucket, ip, { limit, windowMs }) {
  const now = Date.now();
  prune(now, windowMs);
  const key = `${bucket}|${ip}`;
  const recent = (hits.get(key) || []).filter((time) => now - time < windowMs);
  const limited = recent.length >= limit;
  hits.set(key, limited ? recent : [...recent, now]);
  return limited;
}

/** Clears every count (tests). */
export function resetRateLimits() {
  hits.clear();
}
