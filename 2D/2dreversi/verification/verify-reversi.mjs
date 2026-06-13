import assert from 'node:assert/strict';
import { ReversiGame, normalizeKlein } from '../../../js/reversi/ReversiGame.js';

const flat = new ReversiGame({ topology: 'open2d', size: 8 });
assert.equal(flat.counts().black, 2);
assert.equal(flat.counts().white, 2);
assert.ok(flat.legalMoves('black').length > 0);

const customOdd = new ReversiGame({ topology: 'open2d', size: 9 });
assert.equal(customOdd.topology.width, 9);
assert.equal(customOdd.counts().black, 2);
assert.ok(customOdd.legalMoves('black').length > 0);

const pbc = new ReversiGame({ topology: 'pbc', size: 8 });
assert.deepEqual(pbc.topology.step([0, 0], [-1, 0]), [7, 0]);
assert.deepEqual(pbc.topology.step([0, 0], [0, -1]), [0, 7]);

assert.deepEqual(normalizeKlein(2, -1, 8, 8), [5, 7]);
const klein = new ReversiGame({ topology: 'klein', size: 8 });
assert.deepEqual(klein.topology.step([2, 0], [0, -1]), [5, 7]);

console.log('2D Reversi verification passed.');
