/**
 * Minimal PNG decoder for the tools' screenshot analysis (seek-test): 8-bit greyscale, RGB,
 * greyscale+alpha or RGBA, not interlaced, which is what Chrome's Page.captureScreenshot
 * writes. Returns { width, height, data } with data as RGBA bytes.
 */
import { inflateSync } from 'node:zlib';

const SIGNATURE = '89504e470d0a1a0a';
const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

export function decodePng(buf) {
  if (buf.subarray(0, 8).toString('hex') !== SIGNATURE) throw new Error('not a PNG');
  let off = 8;
  let width = 0, height = 0, depth = 0, colour = 0, interlace = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4);
      depth = body[8]; colour = body[9]; interlace = body[12];
    } else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const ch = CHANNELS[colour];
  if (depth !== 8 || !ch || interlace) throw new Error(`unsupported PNG (depth ${depth}, colour ${colour}, interlace ${interlace})`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[dst + x - ch] : 0;
      const b = y ? px[dst - stride + x] : 0;
      const c = x >= ch && y ? px[dst - stride + x - ch] : 0;
      const v = raw[src + x];
      px[dst + x] = (filter === 0 ? v : filter === 1 ? v + a : filter === 2 ? v + b
        : filter === 3 ? v + ((a + b) >> 1) : v + paeth(a, b, c)) & 0xff;
    }
  }
  if (ch === 4) return { width, height, data: px };
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += ch) {
    const g = px[j];
    data[i * 4] = ch >= 3 ? px[j] : g;
    data[i * 4 + 1] = ch >= 3 ? px[j + 1] : g;
    data[i * 4 + 2] = ch >= 3 ? px[j + 2] : g;
    data[i * 4 + 3] = ch === 2 ? px[j + 1] : 255;
  }
  return { width, height, data };
}
