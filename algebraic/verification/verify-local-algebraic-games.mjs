import assert from 'node:assert/strict';
import { CliffordReversiGame } from '../../js/localgames/CliffordReversi.js';
import { AnyonJumpGame } from '../../js/localgames/AnyonJump.js';
import { VirasoroGoGame } from '../../js/localgames/VirasoroGo.js';
import { createGraphTopology } from '../../js/topology/GraphTopologies.js';
import { nextRequiredUnbraidGenerator } from '../../js/anyon/BraidMemory.js';

const klein = createGraphTopology({ topology: 'klein_bottle', width: 6, height: 6 });
assert.deepEqual(klein.normalize([2, 6]), [3, 0], 'Klein vertical crossing flips x.');
const seamStep = klein.step([2, 5], [0, 1]);
assert.equal(seamStep.edge.transport, 'H', 'Klein seam carries Clifford H.');
assert.equal(klein.seamTransform(seamStep.edge), 'twist', 'Klein seam carries anyon twist automorphism.');
const randomBoundary = createGraphTopology({
    topology: 'random_boundary',
    width: 6,
    height: 6,
    randomBoundarySeed: 'algebraic-random-boundary-test'
});
const randomExitA = randomBoundary.step([0, 0], [-1, 0]);
const randomExitB = randomBoundary.step([0, 0], [-1, 0]);
assert.equal(randomBoundary.name, 'random_boundary');
assert.ok(randomExitA?.coord, 'Random boundary maps an off-board exit back to a boundary vertex.');
assert.deepEqual(randomExitA.coord, randomExitB.coord, 'Random boundary map is static within a game.');
assert.ok(randomBoundary.randomBoundaryLinks(4).length > 0, 'Random boundary exposes mapping links.');
const honeycomb = createGraphTopology({ topology: 'flat', lattice: 'honeycomb', width: 6, height: 6 });
assert.equal(honeycomb.lattice, 'honeycomb');
assert.equal(honeycomb.neighbors([2, 2]).length, 3, 'Honeycomb interior vertex has three graph neighbors.');
assert.deepEqual(honeycomb.rayDirections(), [[1, 0], [-1, 0], [0, 1]], 'Honeycomb rays use only graph-edge directions.');
assert.ok(honeycomb.neighbors([2, 3]).some((coord) => coord.join(',') === '2,2'), 'Honeycomb graph edges are reciprocal.');
const hexCells = createGraphTopology({ topology: 'flat', lattice: 'hex_cells', width: 6, height: 6 });
assert.equal(hexCells.neighbors([2, 2]).length, 6, 'Hex-cell centers have six axial neighbors.');
assert.equal(hexCells.rayDirections().length, 6, 'Hex-cell Reversi exposes six axial rays.');
const triangular = createGraphTopology({ topology: 'torus', lattice: 'triangular', width: 6, height: 6 });
assert.equal(triangular.lattice, 'triangular');
assert.equal(triangular.neighbors([2, 2]).length, 6, 'Triangular interior vertex has six graph neighbors.');
assert.deepEqual(
    triangular.step([0, 0], [1, -1]).coord,
    [1, 5],
    'Triangular diagonal edges wrap through the torus boundary.'
);
const triangularRandom = createGraphTopology({
    topology: 'random_boundary',
    lattice: 'triangular',
    width: 6,
    height: 6,
    randomBoundarySeed: 'triangular-random-boundary'
});
assert.ok(triangularRandom.step([2, 0], [1, -1])?.coord, 'Triangular RBC maps exposed diagonal edges.');

const reversi = new CliffordReversiGame({ topology: { topology: 'torus', width: 8, height: 8 } });
const preview = reversi.previewMove([2, 3], 'black', 'H');
assert.equal(preview.legal, true, 'Black has a standard bracket move.');
assert.equal(preview.flips.length, 1, 'One opponent stone is bracketed.');
assert.equal(preview.flips[0].after.pauliLabel, 'Z', 'H maps flipped X to Z.');
const placed = reversi.place([2, 3], { player: 'black', pauliLabel: 'Y', transform: 'H' });
assert.equal(placed.ok, true, 'Clifford Reversi move succeeds.');
assert.equal(reversi.getStone([3, 3]).color, 'black', 'Bracketed stone flips color.');
const hexReversi = new CliffordReversiGame({
    topology: { topology: 'flat', lattice: 'hex_cells', width: 8, height: 8 }
});
assert.equal(hexReversi.topology.rayDirections().length, 6, 'Clifford Reversi uses six rays between hex-cell centers.');
assert.ok(hexReversi.legalMoves('black', 'H').length > 0, 'Hex-cell Clifford Reversi opening has legal moves.');
const randomReversi = new CliffordReversiGame({
    topology: {
        topology: 'random_boundary',
        width: 8,
        height: 8,
        randomBoundarySeed: 'random-reversi'
    }
});
assert.equal(randomReversi.topology.name, 'random_boundary', 'Clifford Reversi supports random boundary topology.');
assert.ok(randomReversi.legalMoves('black', 'H').length > 0, 'Random-boundary Clifford Reversi has legal opening moves.');

const signedReversi = new CliffordReversiGame({
    topology: { topology: 'torus', width: 8, height: 8 },
    trackPhaseSigns: true
});
const signedPreview = signedReversi.previewMove([5, 3], 'white', 'S');
assert.equal(signedPreview.legal, true, 'White can bracket the initial black Y stone.');
assert.equal(signedPreview.flips[0].after.pauliLabel, 'X', 'S maps Y to X in binary Pauli labels.');
assert.equal(signedPreview.flips[0].after.pauliSign, -1, 'Phase-sign mode records S:Y -> -X.');

const jump = new AnyonJumpGame({ topology: { topology: 'torus', width: 4, height: 4 } });
jump.tokens.clear();
jump.worldlines.clear();
jump.addToken({ id: 'b1', owner: 'black', coord: [0, 0], anyonType: 'e' });
jump.addToken({ id: 'w1', owner: 'white', coord: [1, 0], anyonType: 'm' });
const jumpResult = jump.move('b1', [2, 0]);
assert.equal(jumpResult.ok, true, 'Anyon jump over adjacent token succeeds.');
assert.equal(jump.braidTokens.black, 1, 'Jumping e over m adds one braid token.');
assert.equal(jump.exportState().history[0].winding.x, 0, 'Local non-wrapping jump has zero x winding.');
const randomJump = new AnyonJumpGame({
    topology: {
        topology: 'random_boundary',
        width: 6,
        height: 6,
        randomBoundarySeed: 'random-anyon'
    }
});
assert.equal(randomJump.topology.name, 'random_boundary', 'Anyon Jump supports random boundary topology.');
assert.ok(randomJump.legalActions('black').length > 0, 'Random-boundary Anyon Jump exposes legal actions.');
const excitation = new AnyonJumpGame({
    topology: { topology: 'flat', lattice: 'honeycomb', width: 6, height: 6 },
    config: {
        setupMode: 'excitation',
        excitationEnergy: { black: 6, white: 6 },
        anyonGaps: { e: 2, m: 2, psi: 4 },
        excitationCosts: { e: 2, m: 2, psi: 4 },
        dropLossRate: 0.25
    }
});
assert.equal(excitation.tokens.size, 0, 'Excitation mode starts without fixed anyons.');
const exciteE = excitation.exciteAnyon([2, 2], 'e', 'black');
assert.equal(exciteE.ok, true, 'Black can excite an e anyon.');
assert.equal(excitation.energy.black, 4, 'Exciting e costs its toric-code gap energy.');
excitation.currentPlayer = 'black';
const dropE = excitation.dropAnyon(exciteE.event.tokenId, 'black');
assert.equal(dropE.ok, true, 'Dropping an anyon recovers energy.');
assert.equal(excitation.energy.black, 5.5, 'Drop recovery applies the configured loss rate.');

const triangularGo = new VirasoroGoGame({
    topology: { topology: 'flat', lattice: 'triangular', width: 7, height: 7 }
});
const enclosedStone = [3, 3];
const triangularLiberties = triangularGo.topology.neighbors(enclosedStone);
triangularGo.go.board.set(triangularGo.go.key(enclosedStone), 1);
for (const coord of triangularLiberties.slice(0, -1)) {
    triangularGo.go.board.set(triangularGo.go.key(coord), 2);
}
assert.equal(
    triangularGo.go.getGroupAndLiberties(triangularGo.go.board, triangularGo.go.key(enclosedStone)).liberties.size,
    1,
    'Algebraic triangular Go retains the final exposed liberty.'
);
triangularGo.currentPlayer = 'white';
const triangularCapture = triangularGo.tryPlay(triangularLiberties.at(-1), 'white');
assert.equal(triangularCapture.ok, true);
assert.equal(triangularCapture.captured, 1, 'Algebraic triangular Go captures after all six graph liberties are enclosed.');

const exact = new AnyonJumpGame({
    topology: { topology: 'torus', width: 4, height: 4 },
    config: { braidMemoryMode: 'word_exact' }
});
exact.tokens.clear();
exact.worldlines.clear();
exact.addToken({ id: 'b1', owner: 'black', coord: [0, 0], anyonType: 'e' });
exact.addToken({ id: 'w1', owner: 'white', coord: [1, 0], anyonType: 'm' });
const exactJump = exact.move('b1', [2, 0]);
assert.equal(exactJump.ok, true, 'Word-exact jump succeeds.');
assert.equal(exact.braidTokens.black, 1, 'Word-exact braid increments the visible braid counter.');
const nextInverse = nextRequiredUnbraidGenerator(exact.tokens.get('b1').braidWord);
exact.currentPlayer = 'black';
const unbraid = exact.attemptUnbraid('b1', 'w1', {
    player: 'black',
    sign: nextInverse.sign,
    index: nextInverse.index
});
assert.equal(unbraid.ok, true, 'Explicit inverse unbraid action succeeds.');
assert.equal(unbraid.event.unbraid.successfulPartialUnbraid, true, 'Word-exact inverse cancels the latest braid generator.');
assert.equal(exact.tokens.get('b1').braidWord.length, 0, 'Full unbraid leaves the braid word trivial.');
assert.equal(exact.braidTokens.black, 0, 'Successful unbraid decrements the visible braid counter.');

const twist = new AnyonJumpGame({ topology: { topology: 'klein_bottle', width: 4, height: 4 } });
twist.tokens.clear();
twist.worldlines.clear();
twist.addToken({ id: 'k1', owner: 'black', coord: [1, 3], anyonType: 'e' });
const twistMove = twist.move('k1', [2, 0]);
assert.equal(twistMove.ok, true, 'Klein seam hop succeeds.');
assert.equal(twist.tokens.get('k1').anyonType, 'm', 'Klein twist seam maps e to m.');

const go = new VirasoroGoGame({
    topology: { topology: 'flat', width: 5, height: 5 },
    virasoro: { enabled: true, centralCharge: 1, maxMode: 1 }
});
const randomGo = new VirasoroGoGame({
    topology: {
        topology: 'random_boundary',
        width: 5,
        height: 5,
        randomBoundarySeed: 'random-virasoro'
    },
    virasoro: { enabled: true }
});
assert.equal(randomGo.topology.name, 'random_boundary', 'Virasoro Go supports random boundary topology.');
assert.ok(randomGo.legalMoves().length > 0, 'Random-boundary Virasoro Go exposes legal graph-Go moves.');
assert.equal(go.tryPlay([1, 1], 'black').ok, true, 'Graph Go black move succeeds.');
assert.equal(go.tryPlay([0, 1], 'white').ok, true, 'Graph Go white reply succeeds.');
assert.equal(go.tryPlay([2, 1], 'black').ok, true, 'Graph Go keeps normal play sequence.');
go.currentPlayer = 'black';
const l0 = go.applyVirasoroAction({ action: 'L0', coord: [1, 1], player: 'black' });
assert.equal(l0.ok, true, 'Virasoro L0 action succeeds on a friendly group.');
assert.ok(l0.event.affected.length > 0, 'L0 adds stress to liberties.');
const stressedLiberty = l0.event.affected.find((entry) => entry.after > entry.before);
assert.equal(go.stressAt(stressedLiberty.coord).owner, 'black', 'Virasoro stress records the controlling player.');
go.currentPlayer = 'white';
const whiteGroup = go.groupInfoAt([0, 1]);
for (const liberty of whiteGroup.liberties) {
    go.virasoro.setStress(liberty, 3, 'black');
}
const instability = go.virasoro.evaluateInstability();
assert.ok(instability.unstableGroups.some((group) => group.color === 'white'), 'Enemy stress pressure can mark a group unstable.');

console.log('Algebraic local game verification passed.');
