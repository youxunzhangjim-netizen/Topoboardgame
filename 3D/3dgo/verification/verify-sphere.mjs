import assert from 'node:assert/strict';
import { COLORS, GoGameLogic } from '../js/GoGame.js';
import {
    SPHERE_GO_TOPOLOGY,
    sphereLatitudeRingNeighbors,
    sphereNorthPoleCoord,
    sphereSouthPoleCoord,
    sphereVertexPosition
} from '../js/SphereGoTopology.js';

const key = (coord) => coord.join(',');
const neighbors = (coord, width = 19, height = 19) =>
    new Set(sphereLatitudeRingNeighbors(coord, width, height).map(key));

const sphere = new GoGameLogic({
    topology: SPHERE_GO_TOPOLOGY,
    dimension: 2,
    size: 19,
    width: 19,
    height: 19
});

assert.equal(sphere.total, 363, '19 x 19 sphere should have latitude rings plus two playable pole vertices');
assert.equal(sphere.board.length, 363, 'sphere board storage should match its graph vertices');
assert.deepEqual(
    [...neighbors([0, 0])].sort(),
    ['0,-1', '0,1', '1,0', '18,0'],
    'north-most latitude ring should connect to horizontal wrap and north pole'
);
assert.deepEqual(
    [...neighbors([0, 18])].sort(),
    ['0,17', '0,19', '1,18', '18,18'],
    'south-most latitude ring should connect to horizontal wrap and south pole'
);
assert.equal(neighbors([7, 9]).size, 4, 'middle latitude vertices should have degree 4');
assert.equal(neighbors(sphereNorthPoleCoord()).size, 19, 'north pole should connect to every first-ring longitude');
assert.equal(neighbors(sphereSouthPoleCoord(19)).size, 19, 'south pole should connect to every last-ring longitude');
assert.equal(sphere.indexFromCoord(sphereNorthPoleCoord()), 361, 'north pole should be addressable in board storage');
assert.equal(sphere.indexFromCoord(sphereSouthPoleCoord(19)), 362, 'south pole should be addressable in board storage');
assert.deepEqual(sphere.coordFromIndex(361), sphereNorthPoleCoord(), 'north pole should round-trip from storage index');
assert.deepEqual(sphere.coordFromIndex(362), sphereSouthPoleCoord(19), 'south pole should round-trip from storage index');

const configurable = new GoGameLogic({
    topology: SPHERE_GO_TOPOLOGY,
    dimension: 2,
    size: 9,
    width: 9,
    height: 13
});
assert.equal(configurable.total, 119, 'sphere width and height should be independently configurable plus poles');
assert.deepEqual(configurable.coordFromIndex(116), [8, 12], 'rectangular sphere index conversion should use width');
assert.deepEqual(configurable.coordFromIndex(118), sphereSouthPoleCoord(13), 'rectangular sphere should include south pole');

const capture = new GoGameLogic({
    topology: SPHERE_GO_TOPOLOGY,
    dimension: 2,
    size: 19,
    width: 19,
    height: 19
});
capture.board[capture.indexFromCoord([0, 0])] = COLORS.white;
capture.board[capture.indexFromCoord([18, 0])] = COLORS.black;
capture.board[capture.indexFromCoord([1, 0])] = COLORS.black;
capture.board[capture.indexFromCoord(sphereNorthPoleCoord())] = COLORS.black;
capture.currentPlayer = 'black';
const captureResult = capture.tryPlay([0, 1], 'black');
assert.equal(captureResult.ok, true, 'graph capture move should be legal');
assert.equal(captureResult.captured, 1, 'top-ring stone should be captured after the pole liberty is also filled');
assert.equal(capture.board[capture.indexFromCoord([0, 0])], COLORS.empty, 'captured stone should be removed');

const suicide = new GoGameLogic({
    topology: SPHERE_GO_TOPOLOGY,
    dimension: 2,
    size: 19,
    width: 19,
    height: 19
});
for (const coord of [[18, 0], [1, 0], [0, 1], sphereNorthPoleCoord()]) {
    suicide.board[suicide.indexFromCoord(coord)] = COLORS.black;
}
suicide.currentPlayer = 'white';
assert.equal(suicide.tryPlay([0, 0], 'white').ok, false, 'sphere graph should reject suicide');

const territory = new GoGameLogic({
    topology: SPHERE_GO_TOPOLOGY,
    dimension: 2,
    size: 9,
    width: 9,
    height: 9,
    komi: 0
});
territory.board.fill(COLORS.black);
territory.board[territory.indexFromCoord([0, 0])] = COLORS.empty;
const score = territory.computeAreaScore();
assert.equal(score.black, 83, 'graph territory should count enclosed empty components without boundary bonuses');

const south = sphereVertexPosition([0, 0], 19, 19);
const north = sphereVertexPosition([0, 18], 19, 19);
assert.ok(south.y > 0 && south.y < 3.45, 'first latitude ring should be near but not at a pole');
assert.ok(north.y < 0 && north.y > -3.45, 'last latitude ring should be near but not at a pole');
assert.equal(sphereVertexPosition(sphereNorthPoleCoord(), 19, 19).y, 3.45, 'north pole should render at the sphere top');
assert.equal(sphereVertexPosition(sphereSouthPoleCoord(19), 19, 19).y, -3.45, 'south pole should render at the sphere bottom');

console.log('S2 latitude-ring Go topology verification passed.');
