/* Image assets (plan Task 3): the files config points at exist, every srcset width
   derivable by name exists, and the logo mark is a transparent PNG at 2x and 3x. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOUNDER_PHOTOS, FOUNDER_PHOTO } from '../site/assets/js/config.js';

const SITE = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'site');
const PHOTO_NAMES = ['navy', 'cream', 'poster'];
const WIDTHS = [480, 800, 1200];
const PNG_COLOR_RGBA = 6;
const MARK_HEIGHTS = { '@2x': 80, '@3x': 120 };

/** PNG header: width, height and colour type from the IHDR chunk. */
function pngInfo(file) {
  const b = readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), colorType: b[25] };
}

test('FOUNDER_PHOTOS point at the 800 px WebP of each photo', () => {
  PHOTO_NAMES.forEach((name) => {
    assert.equal(FOUNDER_PHOTOS[name], `assets/img/founder/${name}-800.webp`);
    assert.ok(existsSync(join(SITE, FOUNDER_PHOTOS[name])), `${name} file exists`);
  });
  assert.equal(FOUNDER_PHOTO, FOUNDER_PHOTOS.navy);
});

test('every srcset width and the JPEG fallback exist for each photo', () => {
  PHOTO_NAMES.forEach((name) => {
    WIDTHS.forEach((w) => assert.ok(existsSync(join(SITE, `assets/img/founder/${name}-${w}.webp`)), `${name}-${w}.webp`));
    assert.ok(existsSync(join(SITE, `assets/img/founder/${name}-800.jpg`)), `${name}-800.jpg`);
    assert.ok(existsSync(join(SITE, `assets/img/founder/${name}-source.png`)), `${name}-source.png`);
  });
});

test('logo mark is RGBA at 2x and 3x header height, with a WebP twin', () => {
  Object.entries(MARK_HEIGHTS).forEach(([suffix, height]) => {
    const info = pngInfo(join(SITE, `assets/img/brand/logo-mark${suffix}.png`));
    assert.equal(info.height, height);
    assert.equal(info.colorType, PNG_COLOR_RGBA);
  });
  assert.ok(existsSync(join(SITE, 'assets/img/brand/logo-mark.webp')));
  assert.ok(existsSync(join(SITE, 'assets/img/brand/logo-mark-source.png')));
});
