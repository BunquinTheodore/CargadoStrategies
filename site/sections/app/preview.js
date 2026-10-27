/**
 * Local preview of the dashboards with sample data (owner review only).
 *
 *   isPreview(loc = location) → true only on localhost / 127.0.0.1 with ?preview=1
 *   loadPreview(role)          → the sample data for that role (preview-data.js, imported only here)
 *
 * On any other host this is always false, so the deployed site never skips Firebase
 * and the sample module is never fetched.
 */
const PREVIEW_HOSTS = Object.freeze(['localhost', '127.0.0.1']);
const PREVIEW_PARAM = 'preview';

export function isPreview(loc = globalThis.location) {
  if (!loc || !PREVIEW_HOSTS.includes(String(loc.hostname))) return false;
  try {
    return new URLSearchParams(loc.search || '').get(PREVIEW_PARAM) === '1';
  } catch {
    return false;
  }
}

export async function loadPreview(role) {
  const data = await import('./preview-data.js');
  return data.sampleFor(role, new Date());
}

/** The status line after a "save" in the preview: nothing is sent anywhere. */
export const PREVIEW_SAVED = 'Preview only. Nothing was saved.';
