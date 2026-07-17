import assert from 'node:assert/strict';
import { createLifeEngine, isAlive } from '../life/js/LifeEngine.js';
import {
  LIFE_DEFECT_TYPES,
  addDefect,
  applyDefectLayerToNeighborhood,
  createDefectLayer,
  exportDefectLayer,
  getLocalRuleModifier,
  importDefectLayer
} from '../js/life/research/LifeDefectLayer.js';
import { generateCrackLine, generateInclusion, generateVacancyCluster } from '../js/life/research/LifeDefectGenerators.js';
import { validateDefectLayer } from '../js/life/research/LifeResearchSafety.js';

function siteList(size = [6, 6]) {
  const sites = [];
  for (let y = 0; y < size[1]; y += 1) {
    for (let x = 0; x < size[0]; x += 1) {
      sites.push({ id: `${x},${y}`, coord: [x, y] });
    }
  }
  return sites;
}

function edgeList(size = [6, 6]) {
  const edges = [];
  for (let y = 0; y < size[1]; y += 1) {
    for (let x = 0; x < size[0]; x += 1) {
      if (x + 1 < size[0]) edges.push({ source: `${x},${y}`, target: `${x + 1},${y}` });
      if (y + 1 < size[1]) edges.push({ source: `${x},${y}`, target: `${x},${y + 1}` });
    }
  }
  return edges;
}

const board = { dimension: 2, size: [6, 6], lattice: 'square', sites: siteList(), edges: edgeList() };

const emptyLayer = createDefectLayer({ enabled: true });
assert.equal(emptyLayer.defects.length, 0, 'empty defect layer starts empty');
assert.equal(validateDefectLayer(board, emptyLayer, { mode: 'research' }).ok, true, 'empty layer validates');

const vacancyLayer = createDefectLayer({ enabled: true });
addDefect(vacancyLayer, {
  id: 'vacancy:test',
  type: LIFE_DEFECT_TYPES.VACANCY,
  affectedSites: ['1,1']
});
const vacancyEngine = createLifeEngine({ dimension: 2, size: [6, 6] });
vacancyEngine.setDefectLayer(vacancyLayer);
assert.equal(vacancyEngine.setCell([1, 1], { state: 1, species: 1 }), false, 'vacancy rejects alive placement');
assert.equal(isAlive(vacancyEngine.getCell([1, 1])), false, 'vacancy site stays dead');

const crackLayer = createDefectLayer({ enabled: true });
addDefect(crackLayer, {
  id: 'crack:test',
  type: LIFE_DEFECT_TYPES.CRACK,
  affectedEdges: [{ source: '1,1', target: '2,1' }],
  parameters: { blocked: true }
});
const filteredNeighbors = applyDefectLayerToNeighborhood(board, crackLayer, [1, 1], [[2, 1], [1, 2]]);
assert.deepEqual(filteredNeighbors, [[1, 2]], 'crack blocks neighbor interaction across affected edge');

const pinnedLayer = createDefectLayer({ enabled: true });
addDefect(pinnedLayer, {
  id: 'pin:test',
  type: LIFE_DEFECT_TYPES.PINNED_SITE,
  affectedSites: ['2,2'],
  parameters: { fixedState: 1, species: 2 }
});
const pinnedEngine = createLifeEngine({ dimension: 2, size: [6, 6] });
pinnedEngine.setDefectLayer(pinnedLayer);
pinnedEngine.clear();
pinnedEngine.step();
assert.equal(isAlive(pinnedEngine.getCell([2, 2])), true, 'pinned site remains fixed alive after update');
assert.equal(pinnedEngine.getCell([2, 2]).species, 2, 'pinned site keeps fixed species');

const inclusionLayer = createDefectLayer({ enabled: true });
addDefect(inclusionLayer, generateInclusion({
  sites: board.sites,
  center: [3, 3],
  radius: 1.5,
  ruleModifier: { birthNoise: 0.03 },
  id: 'inclusion:test'
}));
const modifier = getLocalRuleModifier(inclusionLayer, '3,3');
assert.equal(modifier.birthNoise, 0.03, 'inclusion exposes local rule modifier');

const generatedVacancy = generateVacancyCluster({
  sites: board.sites,
  center: [3, 3],
  radius: 2,
  seed: 'vacancy-smoke',
  id: 'vacancy:cluster'
});
assert.ok(generatedVacancy.affectedSites.length > 0, 'vacancy cluster affects sites');

const generatedCrack = generateCrackLine({
  sites: board.sites,
  edges: board.edges,
  start: [1, 1],
  end: [5, 1],
  thickness: 0.6,
  id: 'crack:line'
});
assert.ok(generatedCrack.affectedEdges.length > 0, 'crack line affects edges');

const exported = exportDefectLayer(inclusionLayer);
const imported = importDefectLayer(exported);
assert.equal(imported.defects.length, inclusionLayer.defects.length, 'defect layer export/import preserves defects');
assert.equal(imported.enabled, inclusionLayer.enabled, 'defect layer export/import preserves enabled flag');

assert.throws(() => {
  addDefect(createDefectLayer({ enabled: true }), { id: 'bad:defect', type: 'not_a_defect' });
}, /Unknown Life defect type/, 'invalid defect is rejected cleanly');

const unsafeLayer = createDefectLayer({ enabled: true });
addDefect(unsafeLayer, {
  id: 'screw:developing',
  type: LIFE_DEFECT_TYPES.SCREW_DISLOCATION_3D,
  affectedSites: ['1,1'],
  enabled: true
});
const unsafeResult = validateDefectLayer({ ...board, dimension: 3, size: [6, 6, 6] }, unsafeLayer, { mode: 'research' });
assert.equal(unsafeResult.ok, false, 'developing 3D screw dislocation is rejected safely');

console.log('Life research defect verification passed.');
