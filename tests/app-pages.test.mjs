/* App pages (plan Task 12): every shell assembles, is noindex, has the "coming soon"
   card and a main block, unique ids, labelled inputs, and no film machinery. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readAssembled, SITE_DIR } from '../tools/lib/assemble.mjs';
import { APP_PAGES } from '../tools/lib/cdp.mjs';

const pages = APP_PAGES.map((file) => [file, readAssembled(join(SITE_DIR, file))]);

test('each app page is noindex, has the coming-soon card, one main block and the shared header', () => {
  for (const [file, html] of pages) {
    assert.match(html, /<meta name="robots" content="noindex">/, file);
    assert.match(html, /data-app-soon hidden/, file);
    assert.match(html, /Accounts Are Coming Soon/, file);
    assert.match(html, /data-app-main/, file);
    assert.match(html, /class="app-header"/, file);
    assert.match(html, /href="contact.html"/, file);
    assert.doesNotMatch(html, /<!-- @section/, file);
    assert.doesNotMatch(html, /class="scene|id="splash"|gsap/, file);
  }
});

test('ids are unique and every input, select and textarea has a label', () => {
  for (const [file, html] of pages) {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${file}: duplicate id`);
    for (const m of html.matchAll(/<(input|select|textarea)\b[^>]*\bid="([^"]+)"/g)) {
      assert.match(html, new RegExp(`<label[^>]*for="${m[2]}"`), `${file}: #${m[2]} has no label`);
    }
  }
});

test('the account page links Terms and Privacy and offers Google, sign-up and reset', () => {
  const html = pages.find(([file]) => file === 'account.html')[1];
  assert.match(html, /href="legal.html#privacy"/);
  assert.match(html, /href="legal.html#terms"/);
  assert.match(html, /Continue With Google/);
  ['login', 'signup', 'reset'].forEach((form) => assert.match(html, new RegExp(`data-auth-form="${form}"`)));
});

test('app sources never log to the console', () => {
  const dirs = [join(SITE_DIR, 'core', 'account'), join(SITE_DIR, 'sections', 'app')];
  const files = dirs.flatMap((dir) => readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.js')).map((f) => join(dir, f)));
  files.push(...APP_PAGES.map((p) => join(SITE_DIR, 'pages', p.replace('.html', '.js'))));
  for (const file of files) assert.doesNotMatch(readFileSync(file, 'utf8'), /\bconsole\.\w+\(/, file);
});
