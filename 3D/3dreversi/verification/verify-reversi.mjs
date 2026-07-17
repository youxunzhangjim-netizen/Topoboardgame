import assert from 'node:assert/strict';
import { REVERSI_COLORS, ReversiGame, getReversiDirections, stepReversiRay } from '../../../js/reversi/ReversiGame.js';

const r3 = new ReversiGame({ topology: 'r3', size: 8 });
assert.equal(r3.topology.dimension, 3);
assert.equal(r3.counts().black, 4);
assert.equal(r3.counts().white, 4);
assert.ok(r3.legalMoves('black').length > 0);

const customOdd = new ReversiGame({ topology: 'r3', size: 9 });
assert.equal(customOdd.topology.depth, 9);
assert.equal(customOdd.counts().black, 4);
assert.ok(customOdd.legalMoves('black').length > 0);

const bcc = new ReversiGame({ topology: 'r3', lattice: 'bcc', size: 8 });
assert.equal(bcc.topology.lattice, 'bcc');
assert.equal(bcc.topology.directionsFor([3, 3, 3]).length, 8);
assert.ok(bcc.topology.directionsFor([3, 3, 3]).every((direction) => direction.every((value) => Math.abs(value) === 1)));
assert.ok(bcc.legalMoves('black').length > 0, 'BCC R3 Reversi has legal opening moves.');

const fcc = new ReversiGame({ topology: 'r3', lattice: 'fcc', size: 8 });
assert.equal(fcc.topology.lattice, 'fcc');
assert.equal(fcc.topology.directionsFor([3, 3, 3]).length, 12);
assert.ok(fcc.topology.directionsFor([3, 3, 3]).every((direction) => direction.filter(Boolean).length === 2));
assert.ok(fcc.legalMoves('black').length > 0, 'FCC R3 Reversi has legal opening moves.');

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

const t2Honeycomb = new ReversiGame({ topology: 't2', lattice: 'honeycomb', size: 8 });
assert.equal(getReversiDirections(t2Honeycomb.topology, [4, 4]).length, 6, 'T2 honeycomb Reversi has six declared edge-sharing rays.');
assert.equal(stepReversiRay(t2Honeycomb.topology, [4, 4], [1, 1]), null, 'T2 honeycomb corner-looking direction is not legal.');
assert.deepEqual(stepReversiRay(t2Honeycomb.topology, [0, 4], [-1, 0]), [7, 4], 'T2 honeycomb seam works only through an explicitly declared axial ray.');
t2Honeycomb.board = new Map();
t2Honeycomb.currentPlayer = REVERSI_COLORS.BLACK;
t2Honeycomb.set([5, 5], { color: REVERSI_COLORS.WHITE });
t2Honeycomb.set([6, 6], { color: REVERSI_COLORS.BLACK });
assert.deepEqual(t2Honeycomb.previewMove([4, 4], REVERSI_COLORS.BLACK), [], 'T2 honeycomb visual diagonal/corner line does not flip.');
t2Honeycomb.board = new Map();
t2Honeycomb.set([5, 4], { color: REVERSI_COLORS.WHITE });
t2Honeycomb.set([6, 4], { color: REVERSI_COLORS.BLACK });
assert.deepEqual(t2Honeycomb.previewMove([4, 4], REVERSI_COLORS.BLACK), [[5, 4]], 'T2 honeycomb valid edge-sharing ray flips.');

const cylinderHoneycomb = new ReversiGame({ topology: 'cylinder', lattice: 'honeycomb', size: 8 });
assert.equal(getReversiDirections(cylinderHoneycomb.topology, [4, 4]).length, 6, 'Cylinder honeycomb Reversi has six declared edge-sharing rays.');
assert.equal(stepReversiRay(cylinderHoneycomb.topology, [4, 4], [1, 1]), null, 'Cylinder honeycomb corner-looking direction is not legal.');
assert.deepEqual(stepReversiRay(cylinderHoneycomb.topology, [0, 4], [-1, 0]), [7, 4], 'Cylinder honeycomb wrapped seam is a declared edge-sharing ray.');

const sphere = new ReversiGame({ topology: 'sphere', size: 8 });
assert.deepEqual(sphere.topology.step([0, 3], [-1, 0]), [7, 3]);
assert.deepEqual(sphere.topology.step([0, 0], [0, -1]), [0, -1]);

console.log('3D Reversi verification passed.');
