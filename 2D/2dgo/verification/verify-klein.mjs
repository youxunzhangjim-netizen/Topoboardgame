import assert from 'node:assert/strict';
import { GoGameLogic, normalizeTopology } from '../js/GoGame.js';

assert.equal(normalizeTopology('kleingo'), 'klein');
assert.equal(normalizeTopology('klein_bottle'), 'klein');

const game = new GoGameLogic({ size: 9, topology: 'klein', dimension: 2 });

assert.deepEqual(game.stepCoord([2, 8], 1, 1), [6, 0], 'Top seam flips x and enters bottom.');
assert.deepEqual(game.stepCoord([2, 0], 1, -1), [6, 8], 'Bottom seam flips x and enters top.');
assert.deepEqual(game.stepCoord([0, 4], 0, -1), [8, 4], 'Left/right seam wraps normally.');
assert.deepEqual(game.stepCoord([8, 4], 0, 1), [0, 4], 'Right/left seam wraps normally.');

for (let y = 0; y < game.size; y++) {
    for (let x = 0; x < game.size; x++) {
        const neighbors = game.neighborsFromCoord([x, y]);
        assert.equal(new Set(neighbors.map((coord) => coord.join(','))).size, neighbors.length, 'Neighbors are unique.');
        assert.equal(neighbors.length, 4, 'Klein bottle has no boundary; each point has degree 4.');
    }
}

const topNeighborIndexes = new Set(game.neighborsFromIndex(game.indexFromCoord([2, 8])));
assert.equal(topNeighborIndexes.has(game.indexFromCoord([6, 0])), true, 'Index neighbors include flipped top seam.');

const play = game.tryPlay([0, 0], 'black');
assert.equal(play.ok, true, 'Klein 2D Go accepts ordinary legal play.');
assert.equal(game.board[game.indexFromCoord([0, 0])], 1, 'Stone lands on requested vertex.');

console.log('2D Go Klein boundary verification passed.');
