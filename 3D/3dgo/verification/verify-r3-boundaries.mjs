import assert from 'node:assert/strict';
import {
    BCC_LATTICE,
    COLORS,
    FCC_LATTICE,
    GoGameLogic,
    HCP_LATTICE,
    R3_RANDOM_TOPOLOGY,
    R3_STANDARD_TOPOLOGY,
    SIMPLE_CUBIC_LATTICE,
    T3_PBC_TOPOLOGY
} from '../js/GoGame.js';

const simpleCubic = new GoGameLogic({
    size: 9,
    dimension: 3,
    topology: R3_STANDARD_TOPOLOGY,
    lattice: SIMPLE_CUBIC_LATTICE
});
assert.equal(simpleCubic.neighborsFromCoord([4, 4, 4]).length, 6, 'Simple cubic has six nearest neighbors.');

const bcc = new GoGameLogic({
    size: 9,
    dimension: 3,
    topology: R3_STANDARD_TOPOLOGY,
    lattice: BCC_LATTICE
});
assert.equal(bcc.containsCoord([4, 4, 4]), true);
assert.equal(bcc.containsCoord([4, 4, 5]), false, 'BCC hides coordinates outside the corner/body-center sublattices.');
assert.equal(bcc.neighborsFromCoord([4, 4, 4]).length, 8, 'BCC has eight body-diagonal nearest neighbors.');

const fcc = new GoGameLogic({
    size: 9,
    dimension: 3,
    topology: R3_STANDARD_TOPOLOGY,
    lattice: FCC_LATTICE
});
assert.equal(fcc.containsCoord([4, 4, 4]), true);
assert.equal(fcc.containsCoord([4, 4, 5]), false, 'FCC hides odd-parity coordinates.');
assert.equal(fcc.neighborsFromCoord([4, 4, 4]).length, 12, 'FCC has twelve face-diagonal nearest neighbors.');

const hcp = new GoGameLogic({
    size: 9,
    dimension: 3,
    topology: R3_STANDARD_TOPOLOGY,
    lattice: HCP_LATTICE
});
assert.equal(hcp.neighborsFromCoord([4, 4, 4]).length, 12, 'HCP has six in-plane and six adjacent-layer nearest neighbors.');

const t3 = new GoGameLogic({ size: 9, dimension: 3, topology: T3_PBC_TOPOLOGY });
assert.deepEqual(t3.stepCoord([0, 4, 4], 0, -1), [8, 4, 4], 'T3 wraps the x axis.');
assert.deepEqual(t3.stepCoord([4, 0, 4], 1, -1), [4, 8, 4], 'T3 wraps the y axis.');
assert.deepEqual(t3.stepCoord([4, 4, 0], 2, -1), [4, 4, 8], 'T3 wraps the z axis.');
assert.equal(t3.neighborsFromCoord([4, 4, 4]).length, 6, 'Interior T3 points have six axis-neighbors.');

const first = new GoGameLogic({ size: 9, dimension: 3, topology: R3_RANDOM_TOPOLOGY, randomBoundarySeed: 'verify-3d-rbc' });
const second = new GoGameLogic({ size: 9, dimension: 3, topology: R3_RANDOM_TOPOLOGY, randomBoundarySeed: 'verify-3d-rbc' });
assert.notEqual(first.stepCoord([0, 4, 4], 0, -1), null, '3D RBC maps an off-cube exit back to a board point.');
assert.deepEqual(
    first.stepCoord([0, 4, 4], 0, -1),
    second.stepCoord([0, 4, 4], 0, -1),
    '3D RBC maps are deterministic for the same seed.'
);
assert.equal(first.neighborsFromCoord([0, 4, 4]).length, 6, '3D RBC edge points still expose six graph-neighbor directions.');

const noLibertyCapture = new GoGameLogic({
    size: 5,
    dimension: 3,
    topology: R3_STANDARD_TOPOLOGY,
    lattice: SIMPLE_CUBIC_LATTICE
});
const vitalPoint = [2, 2, 2];
const enemyShell = noLibertyCapture.neighborsFromCoord(vitalPoint);
for (const coord of enemyShell) {
    noLibertyCapture.board[noLibertyCapture.indexFromCoord(coord)] = COLORS.white;
}
for (const enemy of enemyShell) {
    for (const coord of noLibertyCapture.neighborsFromCoord(enemy)) {
        if (coord.join(',') !== vitalPoint.join(',')) {
            noLibertyCapture.board[noLibertyCapture.indexFromCoord(coord)] = COLORS.black;
        }
    }
}
noLibertyCapture.currentPlayer = 'black';
const legalCaptureAtNoLiberty = noLibertyCapture.tryPlay(vitalPoint, 'black');
assert.equal(legalCaptureAtNoLiberty.ok, true, 'A 3D move with no immediate liberties is legal when it captures adjacent enemy stones.');
assert.equal(legalCaptureAtNoLiberty.captured, 6, 'The 3D no-liberty placement should capture the six adjacent white stones first.');
assert.equal(noLibertyCapture.getGroupAndLiberties(noLibertyCapture.board, noLibertyCapture.indexFromCoord(vitalPoint)).liberties.size, 6, 'The 3D played stone is alive after captures are removed.');

const restored = new GoGameLogic();
restored.importState(fcc.exportState());
assert.equal(restored.lattice, FCC_LATTICE, '3D lattice survives state export/import.');
assert.equal(restored.playableCoords().length, fcc.playableCoords().length);

console.log('3D Go R3 boundary checks passed.');
