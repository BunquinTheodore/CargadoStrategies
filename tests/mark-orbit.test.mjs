import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MARK_PATHS, MARK_PARTS } from '../site/core/engine/mark-draw.js';
import { ringIndex, nodeAngle, groupBySlug } from '../site/core/ui/ui-orbit.js';
import { ORBIT_GROUPS } from '../site/assets/js/config.js';

test('mark parts and paths', () => {
  assert.deepEqual({ ...MARK_PARTS }, { c: '.mark__c path', w: '.mark__w path', mono: '.mark' });
  assert.ok(Object.isFrozen(MARK_PATHS) && Object.isFrozen(MARK_PARTS));
  assert.equal(MARK_PATHS.c, 'M37.4 10.6A19 19 0 1 0 37.4 37.4');
  assert.equal(MARK_PATHS.w, 'M13.5 17 19.2 31.5 24 21.5 28.8 31.5 34.5 17');
});

test('ringIndex moves round the ring and wraps', () => {
  assert.equal(ringIndex(0, 'ArrowRight', 10), 1);
  assert.equal(ringIndex(0, 'ArrowDown', 10), 1);
  assert.equal(ringIndex(9, 'ArrowRight', 10), 0);
  assert.equal(ringIndex(0, 'ArrowLeft', 10), 9);
  assert.equal(ringIndex(3, 'ArrowUp', 10), 2);
  assert.equal(ringIndex(5, 'Home', 10), 0);
  assert.equal(ringIndex(5, 'End', 10), 9);
  assert.equal(ringIndex(5, 'Enter', 10), -1);
  assert.equal(ringIndex(0, 'ArrowRight', 0), -1);
});

test('nodeAngle starts at the top and goes clockwise in even steps', () => {
  assert.equal(nodeAngle(0, 10), 0);
  assert.equal(nodeAngle(1, 10), 36);
  assert.equal(nodeAngle(5, 10), 180);
  assert.equal(nodeAngle(0, 0), 0);
});

test('groupBySlug finds an orbit group', () => {
  assert.equal(groupBySlug(ORBIT_GROUPS, 'contractor').name, 'Contractor');
  assert.equal(groupBySlug(ORBIT_GROUPS, 'nope'), undefined);
});
