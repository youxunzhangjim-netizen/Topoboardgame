import assert from 'node:assert/strict';
import { ReversiGame } from '../../../js/reversi/ReversiGame.js';

const game = new ReversiGame({ topology: 'r4', size: 5, maxSize: 9 });
assert.equal(game.topology.topology, 'r4');
assert.equal(game.topology.dimension, 4);
assert.equal(game.topology.totalVertices, 625);
assert.equal(game.topology.directions.length, 80, '4D Reversi should ray-walk through 3^4 - 1 directions');
assert.equal(game.topology.allCoords().length, 625);
assert.deepEqual(game.topology.normalize([4, 4, 4, 4]), [4, 4, 4, 4]);
assert.equal(game.topology.normalize([5, 4, 4, 4]), null);
assert.deepEqual(game.counts(), { black: 8, white: 8, empty: 609 });
assert.ok(game.legalMoves('black').some((move) => move.coord.length === 4), 'black should have legal 4D moves');

const wBracket = new ReversiGame({ topology: 'r4', size: 4, maxSize: 9 });
wBracket.board.clear();
wBracket.currentPlayer = 'black';
wBracket.set([1, 1, 1, 0], { color: 'black' });
wBracket.set([1, 1, 1, 1], { color: 'white' });
const flips = wBracket.previewMove([1, 1, 1, 2], 'black');
assert.deepEqual(flips, [[1, 1, 1, 1]], '4D ray-walking should bracket along the w-axis');
const result = wBracket.play([1, 1, 1, 2], 'black');
assert.equal(result.ok, true);
assert.equal(result.flipped, 1);
assert.equal(wBracket.get([1, 1, 1, 1]).color, 'black');

console.log('4D Reversi verification passed.');
