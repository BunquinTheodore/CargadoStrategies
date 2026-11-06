import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RISE_PX, WORD_STATES, ITEM_STATES } from '../site/core/engine/entrances.js';

const ALLOWED = new Set(['x', 'y', 'xPercent', 'yPercent', 'scale', 'opacity']);

test('the one entrance moves only transform and opacity', () => {
  [WORD_STATES, ITEM_STATES].forEach(({ from, to }) => {
    [...Object.keys(from), ...Object.keys(to)].forEach((key) => assert.ok(ALLOWED.has(key), key));
  });
});

test('the one entrance lands visible and in place', () => {
  [WORD_STATES, ITEM_STATES].forEach(({ to }) => {
    if ('opacity' in to) assert.equal(to.opacity, 1);
    if ('yPercent' in to) assert.equal(to.yPercent, 0);
    if ('y' in to) assert.equal(to.y, 0);
  });
  assert.equal(WORD_STATES.from.yPercent, 110);
  assert.deepEqual(ITEM_STATES.from, { opacity: 0, y: RISE_PX });
  assert.equal(RISE_PX, 12);
});
