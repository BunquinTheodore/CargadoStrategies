/**
 * Tiny static server that behaves like a real host: Brotli / gzip
 * compression, correct content types and long-lived caching for hashed
 * build files. Used to measure the site the way visitors receive it
 * (python's http.server sends everything uncompressed).
 *
 *   node serve.mjs dist 8231      # the production build
 *   node serve.mjs site 8230      # the readable source
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { brotliCompressSync, gzipSync, constants as zlib } from 'node:zlib';

const HOST = '127.0.0.1';
const DEFAULT_PORT = 8231;
const COMPRESS_MIN_BYTES = 1024;
const ONE_YEAR_S = 31536000;
const HASHED_FILE = /-[A-Z0-9]{8}\.(js|css)$/; // esbuild [name]-[hash] outputs

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.vtt': 'text/vtt; charset=utf-8',
  '.mp4': 'video/mp4',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest', '.vtt']);

const root = resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3]) || DEFAULT_PORT;
const cache = new Map(); // path + encoding → compressed body

function cacheControl(path) {
  if (HASHED_FILE.test(path) || path.includes(`${sep}fonts${sep}`)) return `public, max-age=${ONE_YEAR_S}, immutable`;
  return 'no-cache';
}

function pickEncoding(header = '') {
  if (/\bbr\b/.test(header)) return 'br';
  if (/\bgzip\b/.test(header)) return 'gzip';
  return null;
}

function compress(body, encoding) {
  if (encoding === 'br') return brotliCompressSync(body, { params: { [zlib.BROTLI_PARAM_QUALITY]: 11 } });
  return gzipSync(body, { level: 9 });
}

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^([/\\])+/, '');
  let path = join(root, clean);
  if (path !== root && !path.startsWith(root + sep)) return null; // no path traversal
  const info = await stat(path).catch(() => null);
  if (info?.isDirectory()) path = join(path, 'index.html');
  else if (!info) return null;
  return path;
}

async function respond(req, res) {
  const path = await resolveFile(req.url || '/');
  if (!path) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const ext = extname(path).toLowerCase();
  const raw = await readFile(path);
  const encoding = COMPRESSIBLE.has(ext) && raw.length >= COMPRESS_MIN_BYTES ? pickEncoding(req.headers['accept-encoding']) : null;
  const { mtimeMs } = await stat(path);
  const key = `${path}|${mtimeMs}|${encoding}`;
  const body = encoding ? cache.get(key) || cache.set(key, compress(raw, encoding)).get(key) : raw;
  const headers = {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': cacheControl(path),
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Accept-Encoding',
  };
  if (encoding) headers['Content-Encoding'] = encoding;
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

createServer((req, res) => {
  respond(req, res).catch(() => {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
  });
}).listen(port, HOST, () => {
  process.stdout.write(`Serving ${root} at http://${HOST}:${port}/\n`);
});
