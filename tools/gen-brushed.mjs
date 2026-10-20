/**
 * Brushed-metal tile for the gold field and the medallion (DIRECTION §3 --metal-tile, W3, C32).
 *
 *   node tools/gen-brushed.mjs
 *
 * Writes site/assets/img/brushed-256.png: a 256 × 256 seamless RGBA tile of
 * fine horizontal streaks, warm highlights and ink lowlights on transparency.
 * The CSS shows it at --metal-tile-op over --metal-grad, with no blend mode.
 * Each row is one value plus a slow wave along x, so the PNG "Sub" filter
 * leaves almost nothing to compress and the file stays well under 6 KB.
 * Deterministic (seeded); re-running gives byte-identical output.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site', 'assets', 'img', 'brushed-256.png');
const SIZE = 256;
const MAX_BYTES = 6 * 1024;
const SEED = 0xb105f00d;
const LEVELS = 16; // alpha steps: fewer steps, smaller file, still smooth at 6% opacity
const HIGHLIGHT = [255, 246, 214];
const LOWLIGHT = [11, 11, 12];
const WAVES = 3; // whole cycles of the slow x wave per tile (keeps the tile seamless)

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Row strengths in -1..1: white noise smoothed over a few rows (circularly, so the tile repeats). */
function rowStrengths(rand) {
  const raw = Array.from({ length: SIZE }, () => rand() * 2 - 1);
  return raw.map((_, y) => {
    const near = [-2, -1, 0, 1, 2].map((d) => raw[(y + d + SIZE) % SIZE] * (d === 0 ? 2 : 1));
    return Math.max(-1, Math.min(1, (near.reduce((a, b) => a + b, 0) / 6) * 1.8));
  });
}

function pixels() {
  const rand = mulberry32(SEED);
  const rows = rowStrengths(rand);
  const phases = rows.map(() => rand() * Math.PI * 2);
  const data = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const wave = 0.75 + 0.25 * Math.sin((x / SIZE) * Math.PI * 2 * WAVES + phases[y]);
      const s = rows[y] * wave;
      const color = s >= 0 ? HIGHLIGHT : LOWLIGHT;
      const alpha = Math.round((Math.round(Math.abs(s) * LEVELS) / LEVELS) * 255);
      data.set([...color, alpha], (y * SIZE + x) * 4);
    }
  }
  return data;
}

/* ---------- minimal PNG encoder ---------- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
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

/** RGBA scanlines with the Sub filter (each byte minus the same channel one pixel left). */
function encodePng(rgba) {
  const stride = SIZE * 4;
  const raw = Buffer.alloc((stride + 1) * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    raw[y * (stride + 1)] = 1;
    for (let i = 0; i < stride; i += 1) {
      const left = i >= 4 ? rgba[y * stride + i - 4] : 0;
      raw[y * (stride + 1) + 1 + i] = (rgba[y * stride + i] - left) & 0xff;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA, no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const png = encodePng(pixels());
if (png.length > MAX_BYTES) {
  process.stderr.write(`brushed-256.png is ${png.length} B, over the ${MAX_BYTES} B budget\n`);
  process.exit(1);
}
writeFileSync(OUT, png);
process.stdout.write(`site/assets/img/brushed-256.png  ${png.length} B\n`);
