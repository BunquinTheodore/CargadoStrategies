/**
 * Page assembly: a site/*.html page is a thin shell whose sections live in
 * site/sections/<page>/<name>/<name>.html. Each marker
 *
 *   <!-- @section home/hero -->
 *
 * is replaced by the exact bytes of site/sections/home/hero/hero.html (no
 * whitespace added or removed), so an assembled page is byte-identical to the
 * page before the split. Partials may hold markers of their own; a marker that
 * includes itself (directly or through another partial) is an error, as is a
 * missing partial.
 *
 *   import { readAssembled } from './tools/lib/assemble.mjs';
 *   const html = readAssembled(join(SITE, 'index.html'));      // site/ pages only
 *
 * Everything that reads site/*.html from disk goes through here (build.mjs,
 * build-kerning, build-splits, golden-diff); serve.mjs assembles .html
 * responses when it serves site/.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SITE_DIR = join(ROOT, 'site');
export const SECTIONS = 'sections';
/** `<!-- @section page/name -->`; page and name are lowercase words with dashes. */
export const SECTION_MARKER = /<!-- @section ([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*) -->/g;
const MAX_DEPTH = 8;

/** Path of the partial a marker names: site/sections/<page>/<name>/<name>.html. */
export const partialPath = (page, name, siteDir = SITE_DIR) => join(siteDir, SECTIONS, page, name, `${name}.html`);

const shown = (path) => relative(ROOT, path).replace(/\\/g, '/');

/**
 * Expand every section marker in `html`. `label` names the source in errors;
 * `stack` holds the partials being expanded (cycle check).
 */
export function assemble(html, { siteDir = SITE_DIR, label = 'html', stack = [] } = {}) {
  if (stack.length > MAX_DEPTH) throw new Error(`assemble: ${label}: sections nested deeper than ${MAX_DEPTH}`);
  return html.replace(SECTION_MARKER, (marker, page, name) => {
    const path = partialPath(page, name, siteDir);
    if (stack.includes(path)) throw new Error(`assemble: ${label}: ${marker} includes itself (${[...stack, path].map(shown).join(' -> ')})`);
    if (!existsSync(path)) throw new Error(`assemble: ${label}: ${marker} has no partial (missing ${shown(path)})`);
    const body = readFileSync(path, 'utf8');
    return assemble(body, { siteDir, label: shown(path), stack: [...stack, path] });
  });
}

/** Read a page from disk and assemble it; partials resolve from the page's own folder (site/). */
export function readAssembled(file) {
  const path = resolve(file);
  return assemble(readFileSync(path, 'utf8'), { siteDir: dirname(path), label: shown(path) });
}

/** True for the site/ source folder (the only one whose pages hold markers). */
export const isSiteDir = (dir) => resolve(dir) === SITE_DIR;
