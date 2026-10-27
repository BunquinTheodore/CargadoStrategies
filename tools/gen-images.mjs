/**
 * Header logo mark and founder photos (v2 plan Task 3, spec §6.5 and §6.7).
 *
 *   node tools/gen-images.mjs [--from=<folder with the owner's 5.png 7.png 8.png 9.png>]
 *
 * --from copies the owner's originals into the repo as the sources first:
 *   5.png → assets/img/brand/logo-mark-source.png
 *   8.png, 9.png, 7.png → assets/img/founder/{navy,cream,poster}-source.png
 * Without it the committed sources are used, so re-running needs nothing outside the repo.
 *
 * Logo: crops the mark only (C, W, 24 and arrow; no wordmark), keys the black background
 * to alpha by brightness with a soft edge, un-mixes the edge colour from the background
 * (no dark fringe), trims, and writes logo-mark@2x.png / @3x.png (2x and 3x of
 * MARK_CSS_HEIGHT) plus logo-mark.webp (3x).
 * Photos: whole frame, aspect kept, never cropped; {name}-{480,800,1200}.webp and
 * {name}-800.jpg. Widths are capped at the source width (never upscaled), so a small
 * original gives the same pixels under every name and srcsets stay valid.
 *
 * Keying runs in Node (tools/lib/png.mjs); resizing and WebP/JPEG/PNG encoding run in
 * headless Chrome's canvas (tools/lib/cdp.mjs), so there are no new dependencies.
 * Deterministic for a given Chrome version. build.mjs leaves *-source.png out of dist/.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { evaluate, launchChrome, parseArgs } from './lib/cdp.mjs';
import { decodePng } from './lib/png.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = join(ROOT, 'site', 'assets', 'img');
const BRAND = join(IMG, 'brand');
const FOUNDER = join(IMG, 'founder');

const OWNER_FILES = { logo: '5.png', navy: '8.png', cream: '9.png', poster: '7.png' };
const PHOTO_NAMES = ['navy', 'cream', 'poster'];
const PHOTO_WIDTHS = [480, 800, 1200];
const JPEG_WIDTH = 800;
const WEBP_QUALITY = 0.86;
const JPEG_QUALITY = 0.86;

/** The mark sits in this box of the owner's 1092 × 1092 logo; the wordmark starts below y 740. */
const MARK_CROP = { x: 290, y: 220, w: 520, h: 490 };
/** Header mark height in CSS px (Task 10 sizes .brand__mark to it); files are 2x and 3x. */
const MARK_CSS_HEIGHT = 40;
const MARK_SCALES = [2, 3];
/** Brightest channel at or below KEY_LO is background, at or above KEY_HI is solid gold. */
const KEY_LO = 50;
const KEY_HI = 140;
/** The near-black backdrop behind the mark, removed from edge pixels when un-mixing. */
const KEY_BG = [28, 26, 22];
const TRIM_ALPHA = 6;
const TRIM_PAD = 2;

/* ---------- PNG encoding (RGBA, filter 0) for the keyed mark handed to Chrome ---------- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

function encodePng({ width, height, data }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) data.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- Logo keying (Node) ---------- */

const smoothstep = (lo, hi, v) => {
  const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

/** One pixel: alpha from its brightest channel; colour un-mixed from KEY_BG so edges stay gold. */
function keyPixel(r, g, b) {
  const a = smoothstep(KEY_LO, KEY_HI, Math.max(r, g, b));
  if (a === 0) return [0, 0, 0, 0];
  const unmix = (c, bg) => Math.round(Math.min(255, Math.max(0, (c - (1 - a) * bg) / a)));
  return [unmix(r, KEY_BG[0]), unmix(g, KEY_BG[1]), unmix(b, KEY_BG[2]), Math.round(a * 255)];
}

function cropAndKey(src, box) {
  const data = Buffer.alloc(box.w * box.h * 4);
  for (let y = 0; y < box.h; y += 1) {
    for (let x = 0; x < box.w; x += 1) {
      const i = ((box.y + y) * src.width + box.x + x) * 4;
      data.set(keyPixel(src.data[i], src.data[i + 1], src.data[i + 2]), (y * box.w + x) * 4);
    }
  }
  return { width: box.w, height: box.h, data };
}

/** Bounding box of pixels with alpha above TRIM_ALPHA, padded by TRIM_PAD. */
function trimBox(img) {
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      if (img.data[(y * img.width + x) * 4 + 3] <= TRIM_ALPHA) continue;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  if (x1 < 0) throw new Error('logo key left nothing: check MARK_CROP and KEY_LO/KEY_HI');
  const x = Math.max(0, x0 - TRIM_PAD), y = Math.max(0, y0 - TRIM_PAD);
  return { x, y, w: Math.min(img.width, x1 + TRIM_PAD + 1) - x, h: Math.min(img.height, y1 + TRIM_PAD + 1) - y };
}

/** Plain RGBA crop (no keying). */
function cropRgba(img, box) {
  const data = Buffer.alloc(box.w * box.h * 4);
  for (let y = 0; y < box.h; y += 1) {
    const start = ((box.y + y) * img.width + box.x) * 4;
    img.data.copy(data, y * box.w * 4, start, start + box.w * 4);
  }
  return { width: box.w, height: box.h, data };
}

function keyedMark(logoPng) {
  const keyed = cropAndKey(decodePng(logoPng), MARK_CROP);
  return encodePng(cropRgba(keyed, trimBox(keyed)));
}

/* ---------- Chrome canvas: resize and encode ---------- */

/**
 * Runs in the page: decode a data URL, scale to (w, h) by halving steps (sharper than one big
 * jump), and return data URLs for each requested { type, quality }.
 */
const PAGE_RESIZE = `async (src, w, h, outputs) => {
  const img = await createImageBitmap(await (await fetch(src)).blob());
  let canvas = new OffscreenCanvas(img.width, img.height);
  canvas.getContext('2d').drawImage(img, 0, 0);
  while (canvas.width / 2 >= w && canvas.height / 2 >= h) {
    const half = new OffscreenCanvas(Math.round(canvas.width / 2), Math.round(canvas.height / 2));
    const ctx = half.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, half.width, half.height);
    canvas = half;
  }
  const out = new OffscreenCanvas(w, h);
  const ctx = out.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, w, h);
  const read = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  const urls = [];
  for (const o of outputs) urls.push(await read(await out.convertToBlob(o)));
  return urls;
}`;

async function resize(send, png, w, h, outputs) {
  const src = `data:image/png;base64,${png.toString('base64')}`;
  const urls = await evaluate(send, `(${PAGE_RESIZE})(${JSON.stringify(src)}, ${w}, ${h}, ${JSON.stringify(outputs)})`);
  return urls.map((u) => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'));
}

const pngSize = (buf) => ({ width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) });

async function writeMark(send) {
  const mark = keyedMark(readFileSync(join(BRAND, 'logo-mark-source.png')));
  const { width, height } = pngSize(mark);
  for (const scale of MARK_SCALES) {
    const h = MARK_CSS_HEIGHT * scale;
    const w = Math.round((width * h) / height);
    const isLargest = scale === Math.max(...MARK_SCALES);
    const outputs = [{ type: 'image/png' }, ...(isLargest ? [{ type: 'image/webp', quality: WEBP_QUALITY }] : [])];
    const [png, webp] = await resize(send, mark, w, h, outputs);
    writeFileSync(join(BRAND, `logo-mark@${scale}x.png`), png);
    if (webp) writeFileSync(join(BRAND, 'logo-mark.webp'), webp);
  }
}

async function writePhoto(send, name) {
  const src = readFileSync(join(FOUNDER, `${name}-source.png`));
  const { width, height } = pngSize(src);
  for (const target of PHOTO_WIDTHS) {
    const w = Math.min(target, width);
    const h = Math.round((height * w) / width);
    const outputs = [{ type: 'image/webp', quality: WEBP_QUALITY }, ...(target === JPEG_WIDTH ? [{ type: 'image/jpeg', quality: JPEG_QUALITY }] : [])];
    const [webp, jpg] = await resize(send, src, w, h, outputs);
    writeFileSync(join(FOUNDER, `${name}-${target}.webp`), webp);
    if (jpg) writeFileSync(join(FOUNDER, `${name}-${target}.jpg`), jpg);
  }
}

function copyOwnerFiles(from) {
  copyFileSync(join(from, OWNER_FILES.logo), join(BRAND, 'logo-mark-source.png'));
  PHOTO_NAMES.forEach((name) => copyFileSync(join(from, OWNER_FILES[name]), join(FOUNDER, `${name}-source.png`)));
}

async function main() {
  const from = parseArgs().value('from', '');
  mkdirSync(BRAND, { recursive: true });
  mkdirSync(FOUNDER, { recursive: true });
  if (typeof from === 'string' && from) copyOwnerFiles(from);
  const chrome = await launchChrome({ prefix: 'cs-gen-images-' });
  try {
    await writeMark(chrome.api.send);
    for (const name of PHOTO_NAMES) await writePhoto(chrome.api.send, name);
  } finally {
    await chrome.close();
  }
  process.stdout.write('gen-images: wrote assets/img/brand/logo-mark@{2,3}x.png, logo-mark.webp and assets/img/founder/*\n');
}

main().catch((e) => { process.stderr.write(`gen-images: ${e.message}\n`); process.exit(1); });
