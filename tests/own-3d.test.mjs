import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { DPR_CAP, OWN_3D_IDS, OWN_3D_SCENES, pixelRatio, renderMode, viewFits } from '../site/sections/services/own-3d-config.js';
import { MOTIFS, THREE_NEEDS, makeKit } from '../site/sections/services/own-3d-motifs.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SITE = `${ROOT}site/`;
const read = (path) => readFileSync(SITE + path, 'utf8');
const partial = (id) => read(`sections/services/${id}/${id}.html`);
const GOLD = { ink: '#D4AF37', bone: '#7A5C12' };
const FRAMES = 90;
const DT = 1 / 60;

/** The npm three, narrowed to THREE_NEEDS: a motif reaching for anything else fails here, not in a browser. */
const T = new Proxy(Object.fromEntries(THREE_NEEDS.map((name) => [name, THREE[name]])), {
  get(target, key) {
    if (typeof key === 'string' && !(key in target)) throw new Error(`motif uses THREE.${key}, not in THREE_NEEDS`);
    return target[key];
  },
});

test('the render mode follows tier, Save-Data and reduced motion', () => {
  assert.equal(renderMode({ tier: 'A' }), 'live');
  assert.equal(renderMode({ tier: 'B' }), 'live');   // continuous on every capable device (owner, 2026-10-25)
  assert.equal(renderMode({ tier: 'C' }), 'off');
  assert.equal(renderMode({ tier: 'A', saveData: true }), 'off');
  assert.equal(renderMode({ tier: 'A', reduced: true }), 'still');
  assert.equal(renderMode({ tier: 'C', reduced: true }), 'off');
});

test('the pixel ratio never passes the tier or the 1.5 cap', () => {
  assert.equal(DPR_CAP, 1.5);
  assert.equal(pixelRatio(3, 1.5), 1.5);
  assert.equal(pixelRatio(3, 1), 1);
  assert.equal(pixelRatio(1, 1.5), 1);
  assert.equal(pixelRatio(Number.NaN, 1.5), 1);
  assert.equal(pixelRatio(2), 1.5);
});

test('a hidden or squeezed slot gets no viewport', () => {
  assert.equal(viewFits({ width: 0, height: 0 }), false);
  assert.equal(viewFits({ width: 300, height: 4 }), false);
  assert.equal(viewFits({ width: 300, height: 200 }), true);
  assert.equal(viewFits(null), false);
});

test('every own scene of the page has a motif config, and only those', () => {
  const markers = [...read('services.html').matchAll(/<!-- @section services\/(ours-[\w-]+) -->/g)].map((m) => m[1]);
  const own = markers.filter((id) => partial(id).includes('class="own__'));
  assert.deepEqual([...own].sort(), [...OWN_3D_IDS].sort());
});

test('every own scene has one decorative 3D box and its motif slots, in config order', () => {
  OWN_3D_IDS.forEach((id) => {
    const html = partial(id);
    const boxes = html.match(/<div class="own__3d"[^>]*>/g) || [];
    assert.equal(boxes.length, 1, `${id}: one box`);
    assert.match(boxes[0], /\sdata-own-3d[\s>]/, `${id}: data-own-3d`);
    assert.match(boxes[0], /\sdata-fit-ignore[\s>]/, `${id}: data-fit-ignore`);
    assert.match(boxes[0], /\saria-hidden="true"/, `${id}: aria-hidden`);
    const slots = [...html.matchAll(/<span class="own__3d-slot[^"]*"[^>]*data-own-3d-view="([\w-]+)"[^>]*><\/span>/g)];
    assert.deepEqual(slots.map((m) => m[1]), [...OWN_3D_SCENES[id]], `${id}: motifs`);
    const inside = html.match(/<div class="own__3d"[^>]*>(.*?)<\/div>/)[1];
    slots.filter(([tag]) => !inside.includes(tag)).forEach(([tag]) => {
      assert.match(tag, /aria-hidden="true"/, `${id}: a slot outside the box is hidden`);
      assert.match(tag, /data-fit-ignore/, `${id}: a slot outside the box is fit-ignored`);
    });
  });
});

test('every configured motif exists', () => {
  Object.values(OWN_3D_SCENES).flat().forEach((name) => assert.equal(typeof MOTIFS[name], 'function', name));
});

/** Every material of a motif, and every baked vertex colour, is the kit's gold (shaded, never another hue). */
function assertGold(root, kit, name) {
  const gold = kit.color;
  root.traverse((obj) => {
    [].concat(obj.material || []).forEach((m) => {
      if (m.vertexColors) return;
      if (m.colorWrite === false) return; // the globe's depth-only occluder
      assert.equal(m.color.getHex(), gold.getHex(), `${name}: ${m.type} colour`);
    });
    const colors = obj.geometry?.getAttribute?.('color');
    if (!colors) return;
    for (let i = 0; i < colors.count; i += 1) {
      const shade = colors.getX(i) / gold.r;
      assert.ok(Math.abs(colors.getY(i) - gold.g * shade) < 1e-4 && Math.abs(colors.getZ(i) - gold.b * shade) < 1e-4, `${name}: vertex colour ${i}`);
    }
  });
}

function assertFinite(root, name) {
  root.traverse((obj) => {
    const pos = obj.geometry?.getAttribute?.('position');
    if (pos) assert.ok(Array.from(pos.array).every(Number.isFinite), `${name}: finite positions`);
    ['x', 'y', 'z'].forEach((axis) => assert.ok(Number.isFinite(obj.rotation[axis]), `${name}: finite rotation`));
  });
}

test('every motif builds from THREE_NEEDS in both golds and animates with and without a pointer', () => {
  Object.entries(MOTIFS).forEach(([name, build]) => {
    Object.entries(GOLD).forEach(([field, accent]) => {
      const kit = makeKit(T, { accent, strength: field === 'bone' ? 1.15 : 0.85 });
      const motif = build(T, kit);
      assert.ok(motif.root instanceof THREE.Object3D, `${name}: root`);
      assert.ok(motif.radius > 0 && motif.radius < 3, `${name}: radius`);
      for (let i = 0; i < FRAMES; i += 1) {
        const k = i / FRAMES;
        motif.update(i * DT, DT, { x: Math.sin(k * 6), y: Math.cos(k * 6), near: k });
      }
      motif.update(FRAMES * DT, 0, { x: 0, y: 0, near: 0 });
      assertFinite(motif.root, name);
      assertGold(motif.root, kit, `${name} (${field})`);
    });
  });
});

test('the stage imports three from the pinned version and every part the motifs need', () => {
  const stage = read('sections/services/own-3d-stage.js');
  const pkg = JSON.parse(readFileSync(`${ROOT}package.json`, 'utf8'));
  const pinned = pkg.devDependencies?.three || pkg.dependencies?.three;
  assert.match(pinned, /^\d+\.\d+\.\d+$/, 'three is pinned to an exact version');
  const imported = stage.match(/import \{([^}]+)\} from 'https:\/\/cdn\.jsdelivr\.net\/npm\/three@([\d.]+)\/build\/three\.module\.js'/);
  assert.ok(imported, 'one named import from the jsDelivr three URL');
  assert.equal(imported[2], pinned, 'the dev URL and package.json name the same version');
  const names = imported[1].split(',').map((s) => s.trim()).filter(Boolean);
  THREE_NEEDS.forEach((name) => assert.ok(names.includes(name), `stage imports ${name}`));
});

test('three loads lazily: only the stage chunk names it, the page code imports the stage with import()', () => {
  ['pages/services.js', 'sections/services/own-3d.js', 'sections/services/own-3d-config.js', 'sections/services/own-3d-motifs.js']
    .forEach((path) => assert.ok(!/three@|from 'three'/.test(read(path)), `${path}: no static three`));
  const own = read('sections/services/own-3d.js');
  assert.match(own, /const STAGE_MODULE = '\.\/own-3d-stage\.js';/);
  assert.match(own, /import\(STAGE_MODULE\)/);
  assert.match(read('pages/services.js'), /mountSections\(\[Inquiry, CategoriesDialog, ProfileDialog, OursOutsourcing, Finder, Orbit, \.\.\.OWN_3D_SECTIONS\]/);
});

test('the 3D files log nothing', () => {
  ['own-3d.js', 'own-3d-config.js', 'own-3d-motifs.js', 'own-3d-stage.js']
    .forEach((file) => assert.ok(!/console\.log/.test(read(`sections/services/${file}`)), file));
});
