/**
 * Start the repo's static server (serve.mjs: Brotli/gzip and real cache headers, like a host)
 * on a free port, for tools that measure dist/ by themselves. Never touches other servers.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sleep } from './cdp.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const START_POLLS = 50;
const START_POLL_MS = 100;

const freePort = () => new Promise((res, rej) => {
  const srv = createServer();
  srv.once('error', rej);
  srv.listen(0, '127.0.0.1', () => { const { port } = srv.address(); srv.close(() => res(port)); });
});

/** Serve `dir` (relative to the repo) → { base, close }. `port` is optional (default: a free one). */
export async function serveDir(dir, port) {
  const p = Number(port) || await freePort();
  const child = spawn(process.execPath, [join(ROOT, 'serve.mjs'), join(ROOT, dir), String(p)], { stdio: 'ignore' });
  const base = `http://127.0.0.1:${p}/`;
  for (let k = 0; k < START_POLLS; k++) {
    if (await fetch(base, { method: 'HEAD' }).then((r) => r.ok || r.status === 404).catch(() => false)) {
      return { base, close: () => child.kill() };
    }
    await sleep(START_POLL_MS);
  }
  child.kill();
  throw new Error(`serve.mjs did not start on port ${p}`);
}
