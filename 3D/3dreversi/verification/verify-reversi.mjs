import assert from 'node:assert/strict';
import { ReversiGame } from '../../../js/reversi/ReversiGame.js';

const r3 = new ReversiGame({ topology: 'r3', size: 8 });
assert.equal(r3.topology.dimension, 3);
assert.equal(r3.counts().black, 4);
assert.equal(r3.counts().white, 4);
assert.ok(r3.legalMoves('black').length > 0);

const customOdd = new ReversiGame({ topology: 'r3', size: 9 });
assert.equal(customOdd.topology.depth, 9);
assert.equal(customOdd.counts().black, 4);
assert.ok(customOdd.legalMoves('black').length > 0);

const hcp = new ReversiGame({ topology: 'r3', lattice: 'hcp', size: 8 });
assert.equal(hcp.topology.lattice, 'hcp');
assert.equal(hcp.topology.dimension, 3);
assert.equal(hcp.topology.directionsFor([3, 3, 3]).length, 12);
assert.ok(hcp.topology.step([3, 3, 3], [1, 0, 0]), 'HCP in-layer neighbor exists.');
assert.ok(hcp.topology.step([3, 3, 3], [0, 0, 1]), 'HCP adjacent-layer neighbor exists.');
assert.ok(hcp.legalMoves('black').length > 0, 'HCP R3 Reversi has legal opening moves.');

const t3 = new ReversiGame({ topology: 't3', size: 8 });
assert.equal(t3.topology.dimension, 3);
assert.deepEqual(t3.topology.step([0, 3, 3], [-1, 0, 0]), [7, 3, 3]);
assert.deepEqual(t3.topology.step([3, 0, 3], [0, -1, 0]), [3, 7, 3]);
assert.deepEqual(t3.topology.step([3, 3, 0], [0, 0, -1]), [3, 3, 7]);
assert.ok(t3.legalMoves('black').length > 0);

const r3RandomA = new ReversiGame({ topology: 'r3_random', size: 8, randomBoundarySeed: 'verify-r3-rbc' });
const r3RandomB = new ReversiGame({ topology: '3d_rbc', size: 8, randomBoundarySeed: 'verify-r3-rbc' });
assert.equal(r3RandomA.topology.dimension, 3);
const randomExitA = r3RandomA.topology.step([0, 3, 3], [-1, 0, 0]);
const randomExitB = r3RandomB.topology.step([0, 3, 3], [-1, 0, 0]);
assert.ok(Array.isArray(randomExitA) && randomExitA.length === 3);
assert.deepEqual(randomExitA, randomExitB);
assert.ok(r3RandomA.legalMoves('black').length > 0);

const t2 = new ReversiGame({ topology: 't2', size: 8 });
assert.deepEqual(t2.topology.step([0, 0], [-1, 0]), [7, 0]);
assert.deepEqual(t2.topology.step([0, 0], [0, -1]), [0, 7]);

const sphere = new ReversiGame({ topology: 'sphere', size: 8 });
assert.deepEqual(sphere.topology.step([0, 3], [-1, 0]), [7, 3]);
assert.equal(sphere.topology.step([0, 0], [0, -1]), null);

console.log('3D Reversi verification passed.');
