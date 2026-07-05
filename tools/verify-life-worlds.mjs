import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'life/index.html',
  'life/world.html',
  'life/life.css',
  'life/life-data.js',
  'life/life-sim.js',
  'life/js/LifeEngine.js',
  'life/js/topologies.js',
  'life/js/rules.js',
  'life/js/presets.js',
  'life/js/observables.js',
  'life/js/LifeUI.js',
  'life/js/i18n.js'
];

let ok = true;
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error(`[missing] ${file}`);
    ok = false;
  } else {
    console.log(`[ok] ${file}`);
  }
}

const data = fs.readFileSync(path.join(root, 'life/life-data.js'), 'utf8');
const expectedModes = [
  'Moore Neighborhood Mode',
  'Von Neumann Neighborhood Mode',
  'Lattice Nearest-Neighbor Mode'
];

for (const title of expectedModes) {
  if (!data.includes(`title: '${title}'`) && !data.includes(`title: "${title}"`)) {
    console.error(`[missing mode] ${title}`);
    ok = false;
  } else {
    console.log(`[mode] ${title}`);
  }
}

for (const marker of ['LIFE_MODIFIERS', 'LIFE_GEOMETRIES', 'LIFE_LATTICES', 'r2', 't2', 'mobius', 'klein', 'sphere', 'rp2', 'r3', 't3', 'sc', 'bcc', 'fcc', 'hcp']) {
  if (!data.includes(marker)) {
    console.error(`[life-data missing] ${marker}`);
    ok = false;
  } else {
    console.log(`[life-data] ${marker}`);
  }
}

const world = fs.readFileSync(path.join(root, 'life/world.html'), 'utf8');
for (const marker of [
  'boardGeometrySelect',
  'latticeSelect',
  'viewModeSelect',
  'usageModeSelect',
  'twoPlayerModeSelect',
  'challengeGoalSelect',
  'research-panel',
  'populationPlot',
  'speciesPlot',
  'patternJson',
  'data-life-i18n'
]) {
  if (!world.includes(marker)) {
    console.error(`[world missing] ${marker}`);
    ok = false;
  } else {
    console.log(`[world] ${marker}`);
  }
}

if (!/<option value="moore"[^>]*selected/.test(world)) {
  console.error('[Life default] Moore neighborhood is not selected.');
  ok = false;
} else {
  console.log('[Life default] Moore / Chebyshev radius 1');
}

if (!/id="boardOpacityButton"[^>]*data-life-i18n="boardOpacity70"/.test(world)) {
  console.error('[Life default] Board opacity is not initialized at 70%.');
  ok = false;
} else {
  console.log('[Life default] board opacity 70%');
}

const lifeIndex = fs.readFileSync(path.join(root, 'life/index.html'), 'utf8');
for (const marker of [
  './world.html',
  'location.replace',
  'Open Life World'
]) {
  if (!lifeIndex.includes(marker)) {
    console.error(`[life index redirect missing] ${marker}`);
    ok = false;
  } else {
    console.log(`[life index redirect] ${marker}`);
  }
}

for (const staleMarker of [
  'lifeModeGrid',
  'life-worlds.js',
  'GameControlGuides.js'
]) {
  if (lifeIndex.includes(staleMarker)) {
    console.error(`[life index stale marker] ${staleMarker}`);
    ok = false;
  } else {
    console.log(`[life index cleaned] ${staleMarker}`);
  }
}

const ui = fs.readFileSync(path.join(root, 'life/js/LifeUI.js'), 'utf8');
for (const marker of ['isCameraInteraction', 'handleCanvasWheel', 'drawSurfaceBoundary', 'drawVolumeBoundary', 'projectPoint']) {
  if (!ui.includes(marker)) {
    console.error(`[LifeUI missing interactive marker] ${marker}`);
    ok = false;
  } else {
    console.log(`[LifeUI interactive] ${marker}`);
  }
}

if (!ui.includes('this.boardOpacityIndex = 1;')) {
  console.error('[Life default] LifeUI opacity index must start at 70%.');
  ok = false;
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const marker of [
  'Life &amp; Evolution Worlds',
  './life/',
  'id="life-evolution-worlds"',
  'data-i18n="life.longDesc"',
  'life-neighborhood-options',
  'mode=moore-life',
  'mode=von-neumann-life',
  'mode=lattice-nearest-life'
]) {
  if (!index.includes(marker)) {
    console.error(`[homepage missing] ${marker}`);
    ok = false;
  } else {
    console.log(`[homepage] ${marker}`);
  }
}

if (index.indexOf('id="life-evolution-worlds"') > index.indexOf('</main>')) {
  console.error('[homepage dom placement] Life section is outside <main>.');
  ok = false;
} else {
  console.log('[homepage dom placement] Life section inside main');
}

if (index.indexOf('id="strategy-systems-labs"') > index.indexOf('id="life-evolution-worlds"')) {
  console.error('[homepage order] Life appears before Labs; Life should be lower than Labs.');
  ok = false;
} else {
  console.log('[homepage order] Labs before Life');
}

if (!ok) process.exit(1);
console.log('Life & Evolution Worlds verification passed.');


const { createLifeEngine } = await import('../life/js/LifeEngine.js');
const { getRulePreset } = await import('../life/js/presets.js');

const engine = createLifeEngine({
  dimension: 2,
  size: [8, 8],
  boundary: 'torus',
  neighborhoodType: 'moore',
  rule: getRulePreset('conway')
});

engine.seedPattern([[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]);
const before = engine.getObservables();
engine.step();
const after = engine.getObservables();

if (before.population !== 5 || after.generation !== 1) {
  console.error('[engine smoke] unexpected Conway step result');
  process.exit(1);
}
console.log('[engine smoke] Conway torus step passed');

const triangularEngine = createLifeEngine({
  dimension: 2,
  size: [8, 8],
  boundary: 'mobius',
  lattice: 'triangular',
  neighborhoodType: 'moore',
  rule: getRulePreset('conway')
});
triangularEngine.randomSeed({ density: 0.15 });
triangularEngine.step();
if (triangularEngine.getObservables().generation !== 1) {
  console.error('[engine smoke] triangular Mobius step failed');
  process.exit(1);
}
console.log('[engine smoke] triangular Mobius step passed');

const engine3d = createLifeEngine({
  dimension: 3,
  size: [5, 5, 5],
  boundary: 'torus',
  lattice: 'bcc',
  neighborhoodType: 'von_neumann',
  rule: getRulePreset('life3dSoft')
});
engine3d.randomSeed({ density: 0.1 });
engine3d.step();
if (engine3d.getObservables().generation !== 1) {
  console.error('[engine smoke] 3D step failed');
  process.exit(1);
}
console.log('[engine smoke] 3D voxel step passed');
