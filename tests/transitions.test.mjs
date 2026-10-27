import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TRANSITIONS, SHAPE, parseTransition, transitionFor, circleAt, quadScales, quadPolygon,
  floodPolygon, regionAt, complementOf, polygonCss, insidePolygon, coverRadius,
} from '../site/core/engine/transitions.js';

const W = 1440;
const H = 900;
const SITE = fileURLToPath(new URL('../site/', import.meta.url));

/** Share of a grid of sample points inside the polygon. */
function coverage(points, w = W, h = H, step = 30) {
  let n = 0;
  let inside = 0;
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      n += 1;
      if (insidePolygon(points, x, y)) inside += 1;
    }
  }
  return inside / n;
}

test('parseTransition accepts the four styles only', () => {
  assert.deepEqual(TRANSITIONS, ['iris', 'dot', 'quad', 'flood']);
  assert.equal(parseTransition(' Quad '), 'quad');
  assert.equal(parseTransition('wipe'), null);
  assert.equal(parseTransition(undefined), null);
  assert.equal(parseTransition(''), null);
});

test('transitionFor uses the entered scene forward and the left scene going back', () => {
  const a = { transition: 'quad' };
  const b = { transition: 'flood' };
  assert.equal(transitionFor({ from: a, to: b, dir: 1 }), 'flood');
  assert.equal(transitionFor({ from: b, to: a, dir: -1 }), 'flood');
  assert.equal(transitionFor({ from: a, to: {}, dir: 1 }), null);
});

test('a field change into a globe scene keeps a circle', () => {
  const globe = { transition: 'quad', globe: true };
  assert.equal(transitionFor({ from: {}, to: globe, dir: 1, fieldChange: true }), 'iris');
  assert.equal(transitionFor({ from: {}, to: { ...globe, transition: 'dot' }, dir: 1, fieldChange: true }), 'dot');
  assert.equal(transitionFor({ from: {}, to: globe, dir: 1, fieldChange: false }), 'quad');
});

test('every style starts empty and ends covering the frame', () => {
  TRANSITIONS.forEach((name) => {
    assert.ok(coverage(regionAt(name, 0, { w: W, h: H })) < 0.01, `${name} at 0`);
    assert.ok(coverage(regionAt(name, 1, { w: W, h: H })) > 0.99, `${name} at 1`);
    assert.ok(coverage(regionAt(name, 1, { w: W, h: H, dir: -1 })) > 0.99, `${name} back at 1`);
  });
});

test('coverage never shrinks as a run progresses', () => {
  TRANSITIONS.forEach((name) => {
    let last = 0;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const c = coverage(regionAt(name, t, { w: W, h: H }));
      assert.ok(c >= last - 0.01, `${name} shrank at ${t.toFixed(2)}`);
      last = c;
    }
  });
});

test('the dot pops to its radius first, at the centre', () => {
  const popped = circleAt('dot', SHAPE.dotPop, { w: W, h: H });
  assert.equal(popped.x, W / 2);
  assert.equal(popped.y, H / 2);
  assert.ok(Math.abs(popped.r - SHAPE.dotR) < 0.01);
  assert.equal(circleAt('dot', 1, { w: W, h: H }).r, coverRadius(W, H));
});

test('the iris grows from its origin', () => {
  const c = circleAt('iris', 0.5, { w: W, h: H, origin: { x: 100, y: 800 } });
  assert.deepEqual([c.x, c.y], [100, 800]);
});

test('quad cells start one after another and tile the frame', () => {
  const early = quadScales(SHAPE.quadStagger, 1);
  assert.ok(early[0] > 0 && early[1] === 0, 'forward: top-left leads');
  const back = quadScales(SHAPE.quadStagger, -1);
  assert.ok(back[2] > 0 && back[0] === 0, 'back: bottom-right leads');
  const full = quadPolygon(W, H, [1, 1, 1, 1]);
  assert.ok(insidePolygon(full, W / 2 - 1, H / 2 - 1));
  assert.ok(insidePolygon(full, W / 2 + 1, H / 2 + 1));
});

test('flood runs from the bottom-left forward and the top-right back', () => {
  const fwd = floodPolygon(W, H, 0.3, 1);
  assert.ok(insidePolygon(fwd, 10, H - 10));
  assert.ok(!insidePolygon(fwd, W - 10, 10));
  const back = floodPolygon(W, H, 0.3, -1);
  assert.ok(insidePolygon(back, W - 10, 10));
  assert.ok(!insidePolygon(back, 10, H - 10));
});

test('the complement is the frame minus the region', () => {
  const region = regionAt('quad', 0.5, { w: W, h: H });
  const rest = complementOf(W, H, region);
  for (let y = 15; y < H; y += 60) {
    for (let x = 15; x < W; x += 60) {
      assert.notEqual(insidePolygon(region, x, y), insidePolygon(rest, x, y), `${x},${y}`);
    }
  }
});

test('polygonCss writes an even-odd px polygon, shifted into a box', () => {
  assert.equal(polygonCss([[0, 0], [10.04, 5]], -2, 3), 'polygon(evenodd, -2px 3px, 8px 8px)');
});

test('film pages assign styles so consecutive cuts differ and each page has two or more', () => {
  ['index', 'services', 'story', 'partners', 'legal', 'contact'].forEach((page) => {
    const shell = readFileSync(join(SITE, `${page}.html`), 'utf8');
    const names = [...shell.matchAll(/<!-- @section ([\w-]+\/[\w-]+) -->/g)].map((m) => m[1]);
    const tags = names.map((name) => {
      const file = join(SITE, 'sections', name, `${name.split('/')[1]}.html`);
      return existsSync(file) ? readFileSync(file, 'utf8').match(/<section\s[^>]*class="scene[^"]*"[^>]*>/)?.[0] : null;
    }).filter(Boolean);
    const cuts = tags.slice(1).map((tag) => parseTransition(tag.match(/data-transition="([^"]*)"/)?.[1]));
    assert.ok(cuts.every(Boolean), `${page}: every scene after the first names a style (${cuts.join(',')})`);
    assert.ok(new Set(cuts).size >= 2, `${page}: ${cuts.join(',')}`);
    for (let i = 1; i < cuts.length; i += 1) assert.notEqual(cuts[i], cuts[i - 1], `${page} cut ${i}`);
  });
});
