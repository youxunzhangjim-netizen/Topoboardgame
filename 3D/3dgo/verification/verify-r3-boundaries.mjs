import assert from 'node:assert/strict';
import {
    GoGameLogic,
    R3_RANDOM_TOPOLOGY,
    T3_PBC_TOPOLOGY
} from '../js/GoGame.js';

const t3 = new GoGameLogic({ size: 9, dimension: 3, topology: T3_PBC_TOPOLOGY });
assert.deepEqual(t3.stepCoord([0, 4, 4], 0, -1), [8, 4, 4], 'T3 wraps the x axis.');
assert.deepEqual(t3.stepCoord([4, 0, 4], 1, -1), [4, 8, 4], 'T3 wraps the y axis.');
assert.deepEqual(t3.stepCoord([4, 4, 0], 2, -1), [4, 4, 8], 'T3 wraps the z axis.');
assert.equal(t3.neighborsFromCoord([4, 4, 4]).length, 6, 'Interior T3 points have six axis-neighbors.');

const first = new GoGameLogic({ size: 9, dimension: 3, topology: R3_RANDOM_TOPOLOGY, randomBoundarySeed: 'verify-3d-rbc' });
const second = new GoGameLogic({ size: 9, dimension: 3, topology: R3_RANDOM_TOPOLOGY, randomBoundarySeed: 'verify-3d-rbc' });
assert.notEqual(first.stepCoord([0, 4, 4], 0, -1), null, '3D RBC maps an off-cube exit back to a board point.');
assert.deepEqual(
    first.stepCoord([0, 4, 4], 0, -1),
    second.stepCoord([0, 4, 4], 0, -1),
    '3D RBC maps are deterministic for the same seed.'
);
assert.equal(first.neighborsFromCoord([0, 4, 4]).length, 6, '3D RBC edge points still expose six graph-neighbor directions.');

console.log('3D Go R3 boundary checks passed.');
