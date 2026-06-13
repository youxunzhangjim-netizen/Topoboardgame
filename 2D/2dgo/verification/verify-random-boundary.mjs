import assert from 'node:assert/strict';
import { GoGameLogic, normalizeTopology } from '../js/GoGame.js';

assert.equal(normalizeTopology('random_boundary'), 'random');

const first = new GoGameLogic({ size: 9, topology: 'random', dimension: 2, randomBoundarySeed: 'fixed-go-map' });
const second = new GoGameLogic({ size: 9, topology: 'random', dimension: 2, randomBoundarySeed: 'fixed-go-map' });

assert.equal(first.topology, 'random');
assert.deepEqual(first.stepCoord([0, 4], 0, -1), second.stepCoord([0, 4], 0, -1), 'Same seed gives same left-exit mapping.');
assert.notEqual(first.stepCoord([0, 4], 0, -1), null, 'Random boundary maps an off-board exit back to a board point.');
assert.equal(first.neighborsFromCoord([0, 4]).length, 4, 'Random boundary gives edge points four graph neighbors.');

const exported = first.exportState();
const imported = new GoGameLogic({ size: 9, topology: 'open2d' });
imported.importState(exported);
assert.deepEqual(imported.stepCoord([0, 4], 0, -1), first.stepCoord([0, 4], 0, -1), 'Imported random map stays static.');
assert.deepEqual(imported.randomBoundaryLinks(3), first.randomBoundaryLinks(3), 'Exported random links survive import.');

console.log('2D Go random boundary verification passed.');
