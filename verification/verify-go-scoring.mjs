import assert from 'node:assert/strict';

import { GoGameLogic as Go2D, COLORS as COLORS_2D } from '../2D/2dgo/js/GoGame.js';
import { GoGameLogic as Go3D, COLORS as COLORS_3D } from '../3D/3dgo/js/GoGame.js';
import { Flat4DGoGame, COLORS as COLORS_4D } from '../4D/4dgo/js/Flat4DGo.js';

function fill(logic, color, coords) {
    for (const coord of coords) {
        const index = logic.indexFromCoord(coord);
        assert.ok(index >= 0, `invalid coord ${coord}`);
        logic.board[index] = color;
    }
}

function ring2D(size) {
    const stones = [];
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            if (x === 0 || y === 0 || x === size - 1 || y === size - 1) stones.push([x, y]);
        }
    }
    return stones;
}

function verifyDeadStoneInsideTerritory() {
    const game = new Go2D({ size: 5, topology: 'open2d', lattice: 'square', komi: 0 });
    fill(game, COLORS_2D.black, ring2D(5));
    fill(game, COLORS_2D.white, [[2, 2]]);

    const score = game.computeAreaScore();
    assert.equal(score.deadWhite, 1, 'white stone inside black enclosure must be removed as dead');
    assert.equal(score.blackTerritory, 9, 'black should receive the whole enclosed empty region after dead removal');
    assert.equal(score.whiteStones, 0, 'dead white stone must not count as a live area stone');
    assert.equal(score.black, 25, 'black area should be stones plus territory');
    assert.deepEqual(score.removedDeadStones, [{ color: 'white', coord: [2, 2] }], 'removed stone should be exposed for scoring overlays');
    assert.ok(score.territorySites.black.some((coord) => coord.join(',') === '2,2'), 'removed dead stone site should be painted as black territory');
}

function verifyTwoEyeGroupSurvives() {
    const game = new Go2D({ size: 7, topology: 'open2d', lattice: 'square', komi: 0 });
    fill(game, COLORS_2D.black, ring2D(7));
    fill(game, COLORS_2D.white, [
        [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [1, 2], [3, 2], [5, 2],
        [1, 3], [2, 3], [3, 3], [4, 3], [5, 3]
    ]);

    const score = game.computeAreaScore();
    assert.equal(score.deadWhite, 0, 'a connected group with two true eyes must not be auto-removed');
    assert.equal(score.whiteStones, 13, 'live white group should count as live area stones');
}

function verifyMixedBorderNeutral() {
    const game = new Go2D({ size: 5, topology: 'open2d', lattice: 'square', komi: 0 });
    fill(game, COLORS_2D.black, [[0, 1], [0, 2], [0, 3]]);
    fill(game, COLORS_2D.white, [[4, 1], [4, 2], [4, 3]]);

    const score = game.computeAreaScore();
    assert.ok(score.neutral > 0, 'mixed-border empty regions should stay neutral');
    assert.equal(score.blackTerritory, 0, 'mixed-border region must not become black territory');
    assert.equal(score.whiteTerritory, 0, 'mixed-border region must not become white territory');
}

function verify3DGraphDeadStone() {
    const game = new Go3D({ size: 3, dimension: 3, topology: 'r3', lattice: 'sc', komi: 0 });
    fill(game, COLORS_3D.white, [[1, 1, 1]]);
    fill(game, COLORS_3D.black, [
        [0, 1, 1], [2, 1, 1],
        [1, 0, 1], [1, 2, 1],
        [1, 1, 0], [1, 1, 2]
    ]);

    const score = game.computeAreaScore();
    assert.equal(score.deadWhite, 1, '3D scoring must use graph neighbors to remove enclosed dead stones');
    assert.equal(score.whiteStones, 0, '3D dead white stone must not count as live');
}

function verify4DGraphDeadStone() {
    const game = new Flat4DGoGame({ nx: 3, ny: 3, nz: 3, nw: 3, komi: 0 });
    fill(game, COLORS_4D.white, [[1, 1, 1, 1]]);
    fill(game, COLORS_4D.black, [
        [0, 1, 1, 1], [2, 1, 1, 1],
        [1, 0, 1, 1], [1, 2, 1, 1],
        [1, 1, 0, 1], [1, 1, 2, 1],
        [1, 1, 1, 0], [1, 1, 1, 2]
    ]);

    const score = game.computeAreaScore();
    assert.equal(score.deadWhite, 1, '4D scoring must use all axis-neighbor liberties');
    assert.equal(score.whiteStones, 0, '4D dead white stone must not count as live');
}

verifyDeadStoneInsideTerritory();
verifyTwoEyeGroupSurvives();
verifyMixedBorderNeutral();
verify3DGraphDeadStone();
verify4DGraphDeadStone();

console.log('Go scoring verification passed.');
