import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'life/index.html',
  'life/world.html',
  'life/life.css',
  'life/life-data.js',
  'life/life-worlds.js',
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
  'Classic Life',
  'Life on a Torus',
  'Life on a Möbius Strip',
  'Life on a Sphere',
  '3D Voxel Life',
  'Noisy Life',
  'Age-Structured Life',
  'Species War',
  'Ecosystem Balance',
  'Research Sandbox'
];

for (const title of expectedModes) {
  if (!data.includes(`title: "${title}"`)) {
    console.error(`[missing mode] ${title}`);
    ok = false;
  } else {
    console.log(`[mode] ${title}`);
  }
}

const world = fs.readFileSync(path.join(root, 'life/world.html'), 'utf8');
for (const marker of [
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

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const marker of [
  'Life &amp; Evolution Worlds',
  './life/',
  'id="life-evolution-worlds"',
  'data-i18n="life.longDesc"'
]) {
  if (!index.includes(marker)) {
    console.error(`[homepage missing] ${marker}`);
    ok = false;
  } else {
    console.log(`[homepage] ${marker}`);
  }
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

const engine3d = createLifeEngine({
  dimension: 3,
  size: [5, 5, 5],
  boundary: 'torus',
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
