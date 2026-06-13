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

const random = new ReversiGame({ topology: 'random', size: 8, randomBoundarySeed: 'fixed-reversi-map' });
const randomAgain = new ReversiGame({ topology: 'random', size: 8, randomBoundarySeed: 'fixed-reversi-map' });
assert.deepEqual(random.topology.step([0, 3], [-1, 0]), randomAgain.topology.step([0, 3], [-1, 0]));
assert.equal(random.topology.randomBoundaryLinks(2).length, 2);

const noMove = new ReversiGame({ topology: 'open2d', size: 4 });
noMove.board = new Map(noMove.topology.allCoords().map((coord) => [noMove.key(coord), { color: 'black' }]));
noMove.board.set(noMove.key([0, 0]), { color: 'white' });
noMove.currentPlayer = 'white';
const passResult = noMove.pass();
assert.equal(passResult.ok, true);
assert.equal(noMove.gameOver, true, 'Reversi ends immediately when the current player has no legal move.');
assert.equal(noMove.winner, 'black');

console.log('2D Reversi verification passed.');
