import assert from 'node:assert/strict';
import { COLORS, FLAT_4D_GO_TOPOLOGY, Flat4DGoGame } from '../js/Flat4DGo.js';

const key = (coord) => coord.join(',');

const game = new Flat4DGoGame();
assert.equal(game.topology, FLAT_4D_GO_TOPOLOGY);
assert.deepEqual(game.sizes, { nx: 5, ny: 5, nz: 5, nw: 5 });
assert.equal(game.total, 625, 'default 5^4 board should have 625 playable vertices');
assert.deepEqual(game.coordFromIndex(game.indexFromCoord([4, 4, 4, 4])), [4, 4, 4, 4]);

const interior = game.neighborsFromCoord([2, 2, 2, 2]).map(key).sort();
assert.equal(interior.length, 8, 'interior point should have degree 8');
assert.deepEqual(interior, [
    '1,2,2,2',
    '2,1,2,2',
    '2,2,1,2',
    '2,2,2,1',
    '2,2,2,3',
    '2,2,3,2',
    '2,3,2,2',
    '3,2,2,2'
].sort());
assert.equal(game.neighborsFromCoord([0, 0, 0, 0]).length, 4, 'corner point should only include inside neighbors');
assert.equal(game.neighborsFromCoord([2, 2, 2, 2]).some((coord) => key(coord) === '3,3,2,2'), false, 'diagonal liberties are not allowed');

const configurable = new Flat4DGoGame({ nx: 3, ny: 4, nz: 2, nw: 6 });
assert.equal(configurable.total, 144, 'sizes should be independently configurable');
assert.deepEqual(configurable.coordFromIndex(configurable.indexFromCoord([2, 3, 1, 5])), [2, 3, 1, 5]);

const capture = new Flat4DGoGame({ nx: 3, ny: 3, nz: 3, nw: 3, komi: 0 });
capture.board[capture.indexFromCoord([1, 1, 1, 1])] = COLORS.white;
for (const coord of [[0, 1, 1, 1], [2, 1, 1, 1], [1, 0, 1, 1], [1, 2, 1, 1], [1, 1, 0, 1], [1, 1, 2, 1], [1, 1, 1, 0]]) {
    capture.board[capture.indexFromCoord(coord)] = COLORS.black;
}
capture.currentPlayer = 'black';
const captureResult = capture.tryPlay([1, 1, 1, 2], 'black');
assert.equal(captureResult.ok, true, 'axis-neighbor capture should be legal');
assert.equal(captureResult.captured, 1, 'single surrounded 4D stone should be captured');
assert.equal(capture.board[capture.indexFromCoord([1, 1, 1, 1])], COLORS.empty);

const threeDimensionalShell = new Flat4DGoGame({ nx: 3, ny: 3, nz: 3, nw: 3, komi: 0 });
threeDimensionalShell.board[threeDimensionalShell.indexFromCoord([1, 1, 1, 1])] = COLORS.white;
for (const coord of [[0, 1, 1, 1], [2, 1, 1, 1], [1, 0, 1, 1], [1, 2, 1, 1], [1, 1, 0, 1], [1, 1, 2, 1]]) {
    threeDimensionalShell.board[threeDimensionalShell.indexFromCoord(coord)] = COLORS.black;
}
const shellGroup = threeDimensionalShell.getGroupAndLiberties(
    threeDimensionalShell.board,
    threeDimensionalShell.indexFromCoord([1, 1, 1, 1])
);
assert.deepEqual(
    [...shellGroup.liberties].map((index) => key(threeDimensionalShell.coordFromIndex(index))).sort(),
    ['1,1,1,0', '1,1,1,2'],
    'enclosing only the 3D six-face shell must leave the two w-direction 4D liberties open'
);

const suicide = new Flat4DGoGame({ nx: 3, ny: 3, nz: 3, nw: 3, komi: 0 });
for (const coord of [[0, 1, 1, 1], [2, 1, 1, 1], [1, 0, 1, 1], [1, 2, 1, 1], [1, 1, 0, 1], [1, 1, 2, 1], [1, 1, 1, 0], [1, 1, 1, 2]]) {
    suicide.board[suicide.indexFromCoord(coord)] = COLORS.black;
}
suicide.currentPlayer = 'white';
assert.equal(suicide.tryPlay([1, 1, 1, 1], 'white').ok, false, 'suicide should be rejected using 4D graph liberties');

const territory = new Flat4DGoGame({ nx: 2, ny: 2, nz: 2, nw: 2, komi: 0 });
territory.board.fill(COLORS.black);
territory.board[territory.indexFromCoord([0, 0, 0, 0])] = COLORS.empty;
assert.equal(territory.computeAreaScore().black, 16, 'territory should count empty graph regions');

console.log('Flat 4D Go verification passed.');
