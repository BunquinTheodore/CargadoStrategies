import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import {
  BUILDING_HEIGHT, BUILDING_SCENES, DPR_CAP, EXPLODE, LAYOUT, PARTS, PART_SPANS, ROW_PARTS, SCENE_PLAN,
  bandOf, copyPose, easeInOut, glowOf, isVisible, lerpPose, liftOffset, partRanks, pixelRatio, placement, poseFor,
  quality, renderMode, rowPick,
} from '../site/sections/story/building/building-plan.js';
import { THREE_NEEDS, buildBuilding, partPlans } from '../site/sections/story/building/building-model.js';

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const read = (path) => readFileSync(SITE + path, 'utf8');
const STORY_SCENES = ['logo', 'top', 'beginning', 'values', 'close', 'credits'];
const STEPS = 40;
const EPS = 1e-9;
/** Draw calls per frame on tier A (mid-range phones get fewer). */
const DRAW_BUDGET = 24;

/** The npm three, narrowed to THREE_NEEDS: the model reaching for anything else fails here, not in a browser. */
const T = new Proxy(Object.fromEntries(THREE_NEEDS.map((name) => [name, THREE[name]])), {
  get(target, key) {
    if (typeof key === 'string' && !(key in target)) throw new Error(`model uses THREE.${key}, not in THREE_NEEDS`);
    return target[key];
  },
});

/** In every frame, each part's bottom stays at or above the top of the part under it. */
function assertNoOverlap(pose, label) {
  for (let i = 1; i < PARTS.length; i += 1) {
    const below = PARTS[i - 1], above = PARTS[i];
    const top = PART_SPANS[below][1] + liftOffset(below, pose.lift[below]);
    const bottom = PART_SPANS[above][0] + liftOffset(above, pose.lift[above]);
    assert.ok(bottom >= top - EPS, `${label}: ${above} passes into ${below}`);
  }
}

test('the plan covers every Story scene, and the building shows only on its scenes', () => {
  assert.deepEqual(Object.keys(SCENE_PLAN), STORY_SCENES);
  ['wide', 'stack'].forEach((band) => {
    assert.deepEqual(Object.keys(LAYOUT[band]), STORY_SCENES);
    STORY_SCENES.forEach((id) => {
      assert.equal(isVisible(poseFor(id, band)), BUILDING_SCENES.includes(id), `${band} ${id}`);
    });
  });
  // every scene id in the plan exists on the page
  const shell = read('story.html');
  STORY_SCENES.forEach((id) => assert.match(shell, new RegExp(`@section story/${id}\\b`)));
});

test('the building comes apart part by part, scene by scene', () => {
  const lifted = (id) => PARTS.filter((p) => poseFor(id).lift[p] === 1);
  assert.deepEqual(lifted('logo'), []);
  assert.deepEqual(lifted('top'), []);                       // assembled on the first building scene
  assert.deepEqual(lifted('beginning'), ['roof']);           // then the roof lifts off
  assert.deepEqual(lifted('values'), PARTS);                 // then every floor
  assert.deepEqual(lifted('close'), []);                     // reassembled as it leaves
  const glowing = (id) => PARTS.filter((p) => poseFor(id).glow[p] === 1);
  assert.deepEqual(glowing('top'), ['foundation']);
  assert.deepEqual(glowing('beginning'), ['lobby']);
  assert.deepEqual(glowing('values'), []);                   // #values lights the row's part instead
  assert.equal(poseFor('values').rows, 1);
  assert.equal(poseFor('top').rows, 0);
});

test('an unknown scene poses like the close, and poseFor never shares state', () => {
  assert.deepEqual(poseFor('nowhere', 'wide'), poseFor('close', 'wide'));
  const a = poseFor('values');
  a.lift.roof = 0;
  a.glow.lobby = 1;
  assert.equal(poseFor('values').lift.roof, 1);
  assert.equal(poseFor('values').glow.lobby, 0);
  const copy = copyPose(a);
  copy.lift.floor1 = 0.5;
  assert.equal(a.lift.floor1, 1);
});

test('the bands follow _bands.css: phones and portrait tablets stack', () => {
  assert.equal(bandOf({ width: 360, height: 740 }), 'stack');
  assert.equal(bandOf({ width: 390, height: 844 }), 'stack');
  assert.equal(bandOf({ width: 759, height: 500 }), 'stack');
  assert.equal(bandOf({ width: 820, height: 1180 }), 'stack');
  assert.equal(bandOf({ width: 1024, height: 768 }), 'wide');
  assert.equal(bandOf({ width: 1366, height: 768 }), 'wide');
  assert.equal(bandOf({ width: 1920, height: 1080 }), 'wide');
  assert.equal(poseFor('top', 'nonsense').x, LAYOUT.wide.top.x);
});

test('on phones the building stays at low emphasis', () => {
  BUILDING_SCENES.forEach((id) => assert.ok(LAYOUT.stack[id].o <= 0.3, `stack ${id}`));
});

test('a pose tween starts and ends exactly on its poses', () => {
  for (let i = 0; i < STORY_SCENES.length - 1; i += 1) {
    const a = poseFor(STORY_SCENES[i]), b = poseFor(STORY_SCENES[i + 1]);
    assert.deepEqual(lerpPose(a, b, 0), a);
    assert.deepEqual(lerpPose(a, b, 1), b);
  }
  assert.deepEqual(lerpPose(poseFor('top'), poseFor('values'), -1), poseFor('top'));
  assert.deepEqual(lerpPose(poseFor('top'), poseFor('values'), 2), poseFor('values'));
});

test('the ease is monotonic from 0 to 1', () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.equal(easeInOut(0.5), 0.5);
  let last = -1;
  for (let i = 0; i <= STEPS; i += 1) {
    const v = easeInOut(i / STEPS);
    assert.ok(v >= last);
    last = v;
  }
});

test('lifting parts go top down, settling parts bottom up', () => {
  const up = partRanks(poseFor('beginning').lift, poseFor('values').lift);
  assert.equal(up.count, 5);
  assert.equal(up.ranks.floor3, 0);
  assert.equal(up.ranks.lobby, 3);
  assert.equal(up.ranks.foundation, 4);
  assert.equal('roof' in up.ranks, false);                   // already lifted: it does not move
  const down = partRanks(poseFor('values').lift, poseFor('close').lift);
  assert.equal(down.ranks.foundation, 0);
  assert.equal(down.ranks.roof, 5);
  // mid-cut, the higher part is further along while lifting, the lower one while settling
  const mid = lerpPose(poseFor('beginning'), poseFor('values'), 0.4);
  assert.ok(mid.lift.floor3 > mid.lift.floor2 && mid.lift.floor2 > mid.lift.floor1);
  const back = lerpPose(poseFor('values'), poseFor('close'), 0.4);
  assert.ok(back.lift.floor1 < back.lift.floor2 && back.lift.floor2 < back.lift.floor3);
});

test('no two parts pass through each other in any frame of any cut', () => {
  STORY_SCENES.forEach((from) => STORY_SCENES.forEach((to) => {
    const a = poseFor(from), b = poseFor(to);
    for (let i = 0; i <= STEPS; i += 1) assertNoOverlap(lerpPose(a, b, i / STEPS), `${from} → ${to} @ ${i}/${STEPS}`);
  }));
});

test('the exploded offsets grow bottom to top', () => {
  for (let i = 1; i < PARTS.length; i += 1) assert.ok(EXPLODE[PARTS[i]][1] > EXPLODE[PARTS[i - 1]][1]);
  for (let i = 1; i < PARTS.length; i += 1) assert.equal(PART_SPANS[PARTS[i]][0], PART_SPANS[PARTS[i - 1]][1]);
  assert.equal(BUILDING_HEIGHT, PART_SPANS.roof[1]);
  assert.deepEqual(PART_SPANS.foundation[0], 0);
});

test('the #values rows light one part each, only on #values', () => {
  assert.equal(ROW_PARTS.length, 3);
  ROW_PARTS.forEach((part) => assert.ok(PARTS.includes(part)));
  assert.deepEqual(rowPick(0), { lobby: 1 });
  assert.deepEqual(rowPick(9), {});
  assert.equal(glowOf(poseFor('values'), rowPick(2)).roof, 1);
  assert.equal(glowOf(poseFor('values'), rowPick(2)).lobby, 0);
  assert.equal(glowOf(poseFor('top'), rowPick(2)).roof, 0);         // rows = 0 off #values
  assert.equal(glowOf(poseFor('top'), rowPick(2)).foundation, 1);
  const html = read('sections/story/values/values.html');
  assert.equal((html.match(/<li class="value/g) || []).length, ROW_PARTS.length);
});

test('placement puts the pose centre where the layout says and scales to its height', () => {
  const view = { aspect: 16 / 9, fovDeg: 24, distance: 20 };
  const halfH = 20 * Math.tan((12 * Math.PI) / 180);
  const centre = placement({ x: 0.5, y: 0.5, h: 0.5 }, view);
  assert.ok(Math.abs(centre.px) < EPS && Math.abs(centre.py) < EPS);
  assert.ok(Math.abs(centre.s * BUILDING_HEIGHT - halfH) < EPS);     // half the view height
  const right = placement({ x: 1, y: 0, h: 1 }, view);
  assert.ok(Math.abs(right.px - halfH * view.aspect) < EPS);
  assert.ok(Math.abs(right.py - halfH) < EPS);
});

test('render mode, detail and pixel ratio follow the tier', () => {
  assert.equal(renderMode({ tier: 'A' }), 'live');
  assert.equal(renderMode({ tier: 'B' }), 'live');
  assert.equal(renderMode({ tier: 'C' }), 'off');
  assert.equal(renderMode({ tier: 'A', saveData: true }), 'off');
  assert.equal(renderMode({ tier: 'A', flow: true }), 'still');
  assert.equal(renderMode({ tier: 'C', flow: true }), 'off');
  assert.equal(quality('A'), 'high');
  assert.equal(quality('B'), 'low');
  assert.equal(DPR_CAP, 1.5);
  assert.equal(pixelRatio(3, 1.5), 1.5);
  assert.equal(pixelRatio(3, 1), 1);
  assert.equal(pixelRatio(Number.NaN, 1.5), 1);
});

test('the model builds every part inside its span, within the draw budget', () => {
  ['high', 'low'].forEach((detail) => {
    const building = buildBuilding(T, { detail });
    assert.deepEqual(Object.keys(building.parts), PARTS);
    building.root.updateMatrixWorld(true);
    assert.ok(building.draws <= DRAW_BUDGET, `${detail}: ${building.draws} draws`);
    PARTS.forEach((name) => {
      const box = new THREE.Box3().setFromObject(building.parts[name].group);
      const [y0, y1] = PART_SPANS[name];
      const shift = building.content.position.y;   // the content group centres the building on its root
      assert.ok(box.min.y >= y0 + shift - 1e-6, `${detail} ${name} below its span`);
      assert.ok(box.max.y <= y1 + shift + 1e-6, `${detail} ${name} above its span`);
    });
    building.dispose();
  });
  // tier B is lighter: fewer boxes, no edge lines
  const count = (plans) => Object.values(plans).reduce((n, p) => n + p.body.length + p.glass.length + p.gold.length, 0);
  assert.ok(count(partPlans('low')) < count(partPlans('high')));
  assert.ok(buildBuilding(T, { detail: 'low' }).draws < buildBuilding(T, { detail: 'high' }).draws);
});

test('the stage imports exactly what the model needs, from the URL build.mjs maps', () => {
  const stage = read('sections/story/building/building-stage.js');
  const block = stage.match(/const T = Object\.freeze\(\{([^}]+)\}\)/)[1];
  const names = block.split(',').map((s) => s.trim()).filter(Boolean).sort();
  assert.deepEqual(names, [...THREE_NEEDS].sort());
  assert.match(stage, /from 'https:\/\/cdn\.jsdelivr\.net\/npm\/three@[\d.]+\/build\/three\.module\.js'/);
  const pinned = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).devDependencies.three;
  assert.match(stage, new RegExp(`three@${pinned.replace(/\./g, '\\.')}/`));
});

test('the building code keeps the page rules', () => {
  const files = ['Building.js', 'building-plan.js', 'building-model.js', 'building-stage.js', 'building.css']
    .map((f) => read(`sections/story/building/${f}`));
  files.forEach((src) => assert.doesNotMatch(src, /console\.log/));
  const css = files[4];
  assert.match(css, /pointer-events:\s*none/);
  assert.doesNotMatch(css, /transition|animation/);
  assert.match(read('pages/story.css'), /building\/building\.css";\n@import "\.\.\/sections\/story\/_bands\.css";/);
  assert.match(read('pages/story.js'), /mountSections\(\[Logo, Values\], ctx\);\nmountBuilding\(ctx\);/);
  // the canvas is decorative
  assert.match(files[3], /'aria-hidden', 'true'/);
});
