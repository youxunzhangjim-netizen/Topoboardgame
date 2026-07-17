import assert from 'node:assert/strict';
import { createLifeEngine, isAlive } from '../life/js/LifeEngine.js';
import {
  generateLifeInitialPattern,
  getLifeInitialPattern
} from '../js/life/presets/LifeInitialPatternLibrary.js';
import {
  computeDomainComponents,
  computeLifeObservables,
  exportLifeResearchCSV,
  exportLifeResearchJSON
} from '../js/life/research/LifeResearchObservables.js';
import { createDefectLayer, addDefect, LIFE_DEFECT_TYPES } from '../js/life/research/LifeDefectLayer.js';
import { validateInitialPatternRequest } from '../js/life/research/LifeResearchSafety.js';

const board2d = { dimension: 2, size: [28, 28], lattice: 'square', neighborhoodType: 'moore' };
const board3d = { dimension: 3, size: [12, 12, 8], lattice: 'sc', neighborhoodType: 'moore' };

function signature(result) {
  return JSON.stringify((result.cells || []).map((cell) => ({
    p: cell.position,
    s: cell.state,
    species: cell.species
  })));
}

function applyPatternToEngine(patternId, board, params = {}) {
  const engine = createLifeEngine({ dimension: board.dimension, size: board.size, lattice: board.lattice });
  const result = generateLifeInitialPattern(patternId, { board, params: { seed: 'verify-seed', ...params } });
  engine.clear();
  for (const entry of result.cells || []) {
    engine.setCell(entry.position, {
      state: entry.state ?? 1,
      species: entry.species || 1,
      age: entry.age || 1,
      energy: entry.energy ?? 1,
      health: entry.health ?? 1
    });
  }
  if (result.defectLayer) engine.setDefectLayer(result.defectLayer);
  return { engine, result };
}

const randomA = generateLifeInitialPattern('random_uniform', {
  board: board2d,
  params: { seed: 'same-seed', density: 0.2 }
});
const randomB = generateLifeInitialPattern('random_uniform', {
  board: board2d,
  params: { seed: 'same-seed', density: 0.2 }
});
assert.equal(signature(randomA), signature(randomB), 'random_uniform is reproducible with the same seed');

const { engine: dropletEngine } = applyPatternToEngine('circular_droplet_2d', board2d, { radius: 5 });
const dropletComponents = computeDomainComponents(dropletEngine, dropletEngine);
assert.equal(dropletComponents.length, 1, 'droplet creates one connected region on square board');
assert.ok(dropletComponents[0].size > 10, 'droplet has a non-trivial area');

const { engine: domainWallEngine } = applyPatternToEngine('straight_domain_wall', board2d, { width: 2 });
const domainWallObservables = computeLifeObservables(domainWallEngine, domainWallEngine, null);
assert.ok(domainWallObservables.interface_length > 0, 'domain wall creates an interface');
assert.ok(Object.keys(domainWallObservables.species_fraction).length >= 2, 'domain wall creates two species/phase regions');

const roughA = generateLifeInitialPattern('rough_domain_wall', {
  board: board2d,
  params: { seed: 'rough-seed', boundaryRoughness: 0.8 }
});
const roughB = generateLifeInitialPattern('rough_domain_wall', {
  board: board2d,
  params: { seed: 'rough-seed', boundaryRoughness: 0.8 }
});
assert.equal(signature(roughA), signature(roughB), 'rough domain wall is deterministic with seed');

const stripes = generateLifeInitialPattern('vertical_stripes', {
  board: board2d,
  params: { width: 4, species: 2, seed: 'stripe-seed' }
});
const stripeSpecies = new Set(stripes.cells.map((cell) => cell.species));
assert.ok(stripeSpecies.has(1) && stripeSpecies.has(2), 'stripe pattern creates alternating bands');

const ring = generateLifeInitialPattern('ring_front', {
  board: board2d,
  params: { radius: 8, width: 2, seed: 'ring-seed' }
});
assert.ok(ring.cells.length > 0, 'ring front creates active annular sites');
assert.ok(!ring.cells.some((cell) => cell.position[0] === 14 && cell.position[1] === 14), 'ring front leaves center mostly empty');

const vacancyInitial = generateLifeInitialPattern('vacancy_cluster_initial', {
  board: board2d,
  params: { seed: 'vacancy-initial', radius: 3 }
});
assert.ok(vacancyInitial.defectLayer?.defects?.length > 0, 'vacancy cluster initial creates a defect layer');

const dislocation = generateLifeInitialPattern('dislocation_dipole_2d', {
  board: board2d,
  params: { seed: 'dislocation-seed', radius: 3 }
});
assert.ok(
  dislocation.defectLayer?.defects?.length > 0 || dislocation.metadata?.warnings?.length,
  'dislocation dipole creates a valid defect or warning'
);

const unsupported = validateInitialPatternRequest(board2d, getLifeInitialPattern('spherical_droplet_3d'), { mode: 'research' });
assert.equal(unsupported.ok, false, 'unsupported pattern-board combination returns clear error');
assert.equal(unsupported.errors[0].key, 'unsupportedPattern', 'unsupported pattern reports unsupportedPattern key');

const normalEngine = createLifeEngine({ dimension: 2, size: [12, 12] });
normalEngine.randomSeed({ density: 0.25, speciesCount: 2 });
assert.ok(normalEngine.cells.some(isAlive), 'normal random initialization still works');

const { engine: clusterEngine } = applyPatternToEngine('random_clustered', board2d, { density: 0.2 });
const clusterObservables = computeLifeObservables(clusterEngine, clusterEngine, null);
assert.equal(typeof clusterObservables.cluster_count, 'number', 'cluster_count returns a valid number');

const defectLayer = createDefectLayer({ enabled: true });
addDefect(defectLayer, {
  id: 'crack:observable',
  type: LIFE_DEFECT_TYPES.CRACK,
  affectedEdges: [
    { source: '1,1', target: '2,1' },
    { source: '2,1', target: '3,1' }
  ],
  parameters: { blocked: true }
});
addDefect(defectLayer, {
  id: 'vacancy:observable',
  type: LIFE_DEFECT_TYPES.VACANCY,
  affectedSites: ['4,4']
});
const defectObservables = computeLifeObservables(domainWallEngine, domainWallEngine, defectLayer);
assert.equal(defectObservables.defect_count, 2, 'defect_count matches defect layer');
assert.equal(defectObservables.crack_length, 2, 'crack_length matches crack defect');
assert.ok(defectObservables.interface_length >= domainWallObservables.interface_length, 'interface length remains valid for domain wall');

const csv = exportLifeResearchCSV([{ generation: 1, ...defectObservables }]);
const json = exportLifeResearchJSON([{ generation: 1, ...defectObservables }]);
assert.ok(csv.includes('generation,alive_fraction'), 'CSV export returns header');
assert.equal(json.schema, 'topoboard.lifeResearchObservables.v0', 'JSON export returns research observable schema');

const sphere = generateLifeInitialPattern('spherical_droplet_3d', {
  board: board3d,
  params: { seed: 'sphere-seed', radius: 3 }
});
assert.ok(sphere.cells.length > 0, '3D spherical droplet works on 3D board');

console.log('Life initial pattern and observable verification passed.');
