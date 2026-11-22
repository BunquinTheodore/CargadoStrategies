/**
 * Vercel Routing Middleware: serves the lite companion site on its own host.
 *
 * Static files win over vercel.json rewrites, and dist/ has its own index.html, robots.txt and
 * sitemap.xml, so the host rewrites in vercel.json cannot reach those paths. Middleware runs first.
 * It acts only on the lite host and only on the four paths below; every other request (the main
 * site, /api/*, assets) passes straight through untouched.
 *
 * The host and the paths are mirrored in vercel.json and tools/build-lite.mjs (a test checks it).
 */
export const LITE_HOST = 'lite.cargadostrategies.com';

/** Request path on the lite host to the file the lite build wrote under dist/lite/. */
export const LITE_FILES = Object.freeze({
  '/': '/lite/index.html',
  '/book': '/lite/book.html',
  '/robots.txt': '/lite/robots.txt',
  '/sitemap.xml': '/lite/sitemap.xml',
});

export const config = { matcher: ['/', '/book', '/robots.txt', '/sitemap.xml'] };

const hostOf = (request) => (request.headers.get('host') || new URL(request.url).host).toLowerCase();

export default function middleware(request) {
  const { pathname } = new URL(request.url);
  const file = LITE_FILES[pathname];
  if (!file || hostOf(request) !== LITE_HOST) {
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }
  const target = new URL(file, request.url);
  return new Response(null, { headers: { 'x-middleware-rewrite': target.toString() } });
}
