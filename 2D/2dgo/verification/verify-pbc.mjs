import assert from 'node:assert/strict';
import { COLORS, GoGameLogic, normalizeTopology } from '../js/GoGame.js';

const coordKey = (coord) => coord.join(',');
const neighborKeys = (game, coord) => new Set(game.neighborsFromCoord(coord).map(coordKey));

assert.equal(normalizeTopology('pbc'), 'pbc');
assert.equal(normalizeTopology('pbc-x'), 'pbc');
assert.equal(normalizeTopology('pbcx'), 'pbc');
assert.equal(normalizeTopology('t2'), 'pbc');

const periodic = new GoGameLogic({ size: 9, dimension: 2, topology: 'pbc' });
assert.deepEqual(
    [...neighborKeys(periodic, [0, 0])].sort(),
    ['0,1', '0,8', '1,0', '8,0'],
    'PBC corner should wrap across both x and y seams'
);

for (let y = 0; y < periodic.size; y++) {
    for (let x = 0; x < periodic.size; x++) {
        assert.equal(periodic.neighborsFromCoord([x, y]).length, 4, `PBC degree should be 4 at (${x},${y})`);
    }
}

const seamGroupBoard = new Uint8Array(periodic.total);
for (const coord of [[0, 0], [8, 0], [0, 8]]) {
    seamGroupBoard[periodic.indexFromCoord(coord)] = COLORS.black;
}
const seamGroup = periodic.getGroupAndLiberties(seamGroupBoard, periodic.indexFromCoord([0, 0]));
assert.equal(seamGroup.group.size, 3, 'same-color stones should connect through both PBC seams');

const open = new GoGameLogic({ size: 9, dimension: 2, topology: 'open2d' });
assert.equal(open.neighborsFromCoord([0, 0]).length, 2, 'OBC corner should keep ordinary open edges');

const honeycomb = new GoGameLogic({ size: 9, dimension: 2, topology: 'pbc', lattice: 'honeycomb' });
assert.equal(honeycomb.neighborsFromCoord([4, 4]).length, 3, 'Honeycomb Go vertices should have three graph neighbors');
assert.deepEqual(
    [...neighborKeys(honeycomb, [4, 4])].sort(),
    ['3,4', '4,5', '5,4'],
    'Even honeycomb columns should connect to the next row'
);
assert.ok(
    neighborKeys(honeycomb, [4, 5]).has('4,4'),
    'Honeycomb graph edges are reciprocal.'
);

const triangular = new GoGameLogic({ size: 9, dimension: 2, topology: 'pbc', lattice: 'triangular' });
assert.deepEqual(
    [...neighborKeys(triangular, [0, 0])].sort(),
    ['0,1', '0,8', '1,0', '1,8', '8,0', '8,1'],
    'Triangular PBC wraps all four axial and two diagonal graph edges'
);

const triangularCapture = new GoGameLogic({ size: 9, dimension: 2, topology: 'open2d', lattice: 'triangular' });
const surrounded = [4, 4];
const surrounding = triangularCapture.neighborsFromCoord(surrounded);
triangularCapture.board[triangularCapture.indexFromCoord(surrounded)] = COLORS.black;
for (const coord of surrounding.slice(0, -1)) {
    triangularCapture.board[triangularCapture.indexFromCoord(coord)] = COLORS.white;
}
const beforeCapture = triangularCapture.getGroupAndLiberties(
    triangularCapture.board,
    triangularCapture.indexFromCoord(surrounded)
);
assert.equal(beforeCapture.liberties.size, 1, 'Five occupied triangular neighbors leave one exposed graph liberty');
triangularCapture.currentPlayer = 'white';
const enclosed = triangularCapture.tryPlay(surrounding.at(-1), 'white');
assert.equal(enclosed.ok, true);
assert.equal(enclosed.captured, 1, 'Filling the sixth triangular neighbor captures the enclosed stone');

const noLibertyCapture = new GoGameLogic({ size: 5, dimension: 2, topology: 'open2d' });
const vitalPoint = [2, 2];
for (const coord of [[1, 2], [3, 2], [2, 1], [2, 3]]) {
    noLibertyCapture.board[noLibertyCapture.indexFromCoord(coord)] = COLORS.white;
}
for (const coord of [[0, 2], [1, 1], [1, 3], [4, 2], [3, 1], [3, 3], [2, 0], [2, 4]]) {
    noLibertyCapture.board[noLibertyCapture.indexFromCoord(coord)] = COLORS.black;
}
noLibertyCapture.currentPlayer = 'black';
const legalCaptureAtNoLiberty = noLibertyCapture.tryPlay(vitalPoint, 'black');
assert.equal(legalCaptureAtNoLiberty.ok, true, 'A move with no immediate liberties is legal when it captures adjacent enemy stones.');
assert.equal(legalCaptureAtNoLiberty.captured, 4, 'The no-liberty placement should capture the four adjacent white stones first.');
assert.equal(noLibertyCapture.getGroupAndLiberties(noLibertyCapture.board, noLibertyCapture.indexFromCoord(vitalPoint)).liberties.size, 4, 'The played stone is alive after captures are removed.');

const imported = new GoGameLogic();
imported.importState({ ...periodic.exportState(), topology: 'pbc-x' });
assert.equal(imported.topology, 'pbc', 'legacy pbc-x states should normalize to full PBC');

console.log('2D Go full PBC verification passed.');
