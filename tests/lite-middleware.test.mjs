import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import middleware, { LITE_HOST, LITE_FILES, config } from '../middleware.js';

const call = (host, path) => middleware(new Request(`https://${host}${path}`, { headers: { host } }));

test('lite host paths are rewritten to dist/lite files', () => {
  for (const [path, file] of Object.entries(LITE_FILES)) {
    const res = call(LITE_HOST, path);
    assert.equal(res.headers.get('x-middleware-rewrite'), `https://${LITE_HOST}${file}`);
  }
});

test('the main site host passes through untouched', () => {
  for (const path of Object.keys(LITE_FILES)) {
    const res = call('www.cargadostrategies.com', path);
    assert.equal(res.headers.get('x-middleware-next'), '1');
    assert.equal(res.headers.get('x-middleware-rewrite'), null);
  }
});

test('matcher is limited to the four lite paths (never /api or assets)', () => {
  assert.deepEqual(config.matcher, ['/', '/book', '/robots.txt', '/sitemap.xml']);
});

test('host and paths agree with vercel.json', () => {
  const rewrites = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).rewrites;
  for (const r of rewrites) {
    assert.equal(r.has[0].value, LITE_HOST);
    assert.equal(LITE_FILES[r.source], r.destination);
  }
});
