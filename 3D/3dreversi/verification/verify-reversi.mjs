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

const t2 = new ReversiGame({ topology: 't2', size: 8 });
assert.deepEqual(t2.topology.step([0, 0], [-1, 0]), [7, 0]);
assert.deepEqual(t2.topology.step([0, 0], [0, -1]), [0, 7]);

const sphere = new ReversiGame({ topology: 'sphere', size: 8 });
assert.deepEqual(sphere.topology.step([0, 3], [-1, 0]), [7, 3]);
assert.equal(sphere.topology.step([0, 0], [0, -1]), null);

console.log('3D Reversi verification passed.');
