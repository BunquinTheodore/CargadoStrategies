import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MARK, MARK_POSTER, MARK_PATHS, LOGO_PARTS, MARK_PARTS, drawMark } from '../site/core/engine/mark-draw.js';
import { ringIndex, nodeAngle, groupBySlug } from '../site/core/ui/ui-orbit.js';
import { ORBIT_GROUPS } from '../site/assets/js/config.js';

/** A timeline stub that records every fromTo call. */
function fakeTimeline() {
  const calls = [];
  return { calls, fromTo: (target, from, to, at) => { calls.push({ target, from, to, at }); } };
}

/** A scene stub: querySelector answers from a selector → element map. */
function fakeScene(map) {
  return { querySelector: (sel) => map[sel] ?? null };
}

const storyScene = () => fakeScene({ '.logo__c path': 'C', '.logo__w path': 'W', '.logo__mono': 'MONO' });

test('MARK timings are unchanged from Logo.js', () => {
  assert.deepEqual({ ...MARK }, { cFrom: 0, cDuration: 1, wFrom: 0.12, wDuration: 0.7, scaleFrom: 0.94, scaleDuration: 1 });
  assert.deepEqual({ ...MARK_POSTER }, { cFrom: 0, cDuration: 0.6, wFrom: 0.08, wDuration: 0.5, scaleFrom: 0.94, scaleDuration: 0.6 });
  assert.ok(Object.isFrozen(MARK) && Object.isFrozen(MARK_POSTER));
});

test('drawMark with the Story defaults emits the same three tweens as before', () => {
  const tl = fakeTimeline();
  drawMark({ tl, toEl: storyScene(), poster: false });
  assert.deepEqual(tl.calls, [
    { target: 'MONO', from: { scale: 0.94 }, to: { scale: 1, duration: 1, ease: 'expo.out' }, at: 'in+=0' },
    { target: 'C', from: { strokeDashoffset: 100 }, to: { strokeDashoffset: 0, duration: 1, ease: 'power2.out' }, at: 'in+=0' },
    { target: 'W', from: { strokeDashoffset: 100 }, to: { strokeDashoffset: 0, duration: 0.7, ease: 'power2.out' }, at: 'in+=0.12' },
  ]);
});

test('drawMark poster timings and a numeric position', () => {
  const tl = fakeTimeline();
  drawMark({ tl, toEl: storyScene(), poster: true, at: 2 });
  assert.deepEqual(tl.calls.map((c) => [c.at, c.to.duration]), [[2, 0.6], [2, 0.6], [2.08, 0.5]]);
});

test('drawMark accepts a label other than in, and the shared mark selectors', () => {
  const tl = fakeTimeline();
  const toEl = fakeScene({ '.mark__c path': 'C', '.mark__w path': 'W', '.mark': 'MONO' });
  drawMark({ tl, toEl, poster: true, at: 'settled', parts: MARK_PARTS });
  assert.deepEqual(tl.calls.map((c) => c.at), ['settled+=0', 'settled+=0', 'settled+=0.08']);
});

test('drawMark does nothing when a part is missing', () => {
  const tl = fakeTimeline();
  drawMark({ tl, toEl: fakeScene({ '.logo__c path': 'C' }), poster: false });
  drawMark({ tl, toEl: null, poster: false });
  assert.equal(tl.calls.length, 0);
});

test('mark parts and paths', () => {
  assert.deepEqual({ ...LOGO_PARTS }, { c: '.logo__c path', w: '.logo__w path', mono: '.logo__mono' });
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
