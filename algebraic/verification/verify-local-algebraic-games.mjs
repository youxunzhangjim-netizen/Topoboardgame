import assert from 'node:assert/strict';
import { CliffordReversiGame } from '../../js/localgames/CliffordReversi.js';
import {
    PHYSICAL_CLIFFORD_ALGEBRA_SET,
    PhysicalCliffordReversiGame
} from '../../js/localgames/PhysicalCliffordReversi.js';
import { AnyonJumpGame } from '../../js/localgames/AnyonJump.js';
import { VirasoroGoGame } from '../../js/localgames/VirasoroGo.js';
import { PhysicalVirasoroReversiGame } from '../../js/localgames/PhysicalVirasoroReversi.js';
import {
    estimateIsingBlockWeights,
    isingOPE
} from '../../js/cft/CFTReversiPhysics.js';
import { createGraphTopology } from '../../js/topology/GraphTopologies.js';
import { nextRequiredUnbraidGenerator } from '../../js/anyon/BraidMemory.js';
import { anyonTypes, createFusionResult } from '../../js/anyon/AnyonAlgebra.js';

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
const r3 = createGraphTopology({ topology: 'r3', width: 5, height: 6, depth: 7 });
assert.equal(r3.dimensions, 3, 'R3 topology is a true three-dimensional graph.');
assert.deepEqual(r3.sizes, [5, 6, 7]);
assert.equal(r3.neighbors([2, 2, 2]).length, 6, 'R3 interior vertices have six axis-neighbors.');
assert.equal(r3.rayDirections().length, 26, 'R3 Reversi exposes all 26 spatial rays.');
assert.equal(r3.normalize([-1, 2, 2]), null, 'R3 uses standard finite boundaries.');

const reversi = new CliffordReversiGame({ topology: { topology: 'torus', width: 8, height: 8 } });
const preview = reversi.previewMove([2, 3], 'black', 'H');
assert.equal(preview.legal, true, 'Black has a standard bracket move.');
assert.equal(preview.flips.length, 1, 'One opponent stone is bracketed.');
assert.equal(preview.flips[0].after.pauliLabel, 'Z', 'H maps flipped X to Z.');
const placed = reversi.place([2, 3], { player: 'black', pauliLabel: 'Y', transform: 'H' });
assert.equal(placed.ok, true, 'Clifford Reversi move succeeds.');
assert.equal(reversi.getStone([3, 3]).color, 'black', 'Bracketed stone flips color.');

assert.deepEqual(isingOPE('sigma', 'sigma'), ['identity', 'epsilon'], 'Ising sigma OPE exposes both channels.');
assert.deepEqual(isingOPE('sigma', 'epsilon'), ['sigma'], 'Sigma times epsilon returns sigma.');
assert.deepEqual(isingOPE('epsilon', 'epsilon'), ['identity'], 'Epsilon pair returns identity.');
const estimatedBlocks = estimateIsingBlockWeights(0.5);
assert.ok(Math.abs(estimatedBlocks.identity + estimatedBlocks.epsilon - 1) < 1e-9, 'Conformal block weights normalize.');

const cftReversi = new PhysicalVirasoroReversiGame({
    topology: { topology: 'flat', width: 8, height: 8 },
    cftReversiInitialState: 'four_sigma_block',
    hiddenChannels: true,
    centralCharge: 0.5,
    maxMode: 2,
    probability: { seed: 'cft-reversi-test', measurementErrorRate: 0 }
});
assert.equal(cftReversi.mode, 'physical_virasoro_reversi');
assert.equal(cftReversi.board.size, 4, 'Four-sigma state replaces the ordinary Reversi opening.');
assert.equal(cftReversi.counts().primaryTypes.sigma, 4);
assert.equal(cftReversi.legalMoves('black', 'sigma').length, 4, 'Four-sigma state provides playable CFT brackets.');
const cftBefore = cftReversi.computeCFTObservables();
assert.ok(cftBefore.fourPointCrossRatio > 0 && cftBefore.fourPointCrossRatio < 1);
assert.equal(cftBefore.estimatorNotice.includes('not exact continuum'), true);
const cftMove = cftReversi.place([2, 3], { player: 'black', primaryType: 'sigma' });
assert.equal(cftMove.ok, true, 'CFT Reversi places a primary on a legal bracket.');
assert.equal(cftMove.event.OPEUpdates.length, 1, 'A bracketed primary creates an OPE update.');
assert.equal(cftReversi.physicsHistory.at(-1).action, 'place');
const stressAction = cftReversi.applyVirasoroAction({
    action: 'L0',
    coord: [2, 3],
    player: cftReversi.currentPlayer
});
assert.equal(stressAction.ok, false, 'A player cannot rescale the opponent domain.');
const focusAction = cftReversi.applyVirasoroAction({
    action: 'L1',
    coord: [4, 4],
    player: cftReversi.currentPlayer
});
assert.equal(focusAction.ok, true, 'L1 focuses graph stress at a selected vertex.');
const cftMeasurement = cftReversi.measureFourPointBlock(
    [...cftReversi.board.entries()]
        .filter(([, stone]) => stone.primaryType === 'sigma')
        .slice(0, 4)
        .map(([key]) => key.split(',').map(Number)),
    cftReversi.currentPlayer
);
assert.equal(cftMeasurement.ok, true, 'Four-point conformal block measurement is available.');
assert.ok(['identity', 'epsilon'].includes(cftMeasurement.measurement.reported));
const cftAnswer = cftReversi.computeCFTReversiAnswer();
assert.ok(['identity', 'epsilon'].includes(cftAnswer.finalDominantOPEChannel));
assert.equal(typeof cftAnswer.finalEntropyEstimate, 'number');
assert.equal(cftReversi.exportState().physicsHistory.length >= 3, true, 'CFT physics history is exported.');

const vacuumCFT = new PhysicalVirasoroReversiGame({
    topology: { topology: 'flat', width: 8, height: 8 },
    cftReversiInitialState: 'vacuum'
});
assert.equal(vacuumCFT.board.size, 0, 'Vacuum state is empty/identity rather than the standard opening.');
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
const r3Reversi = new CliffordReversiGame({
    topology: { topology: 'r3', width: 6, height: 6, depth: 6 }
});
assert.equal(r3Reversi.topology.dimensions, 3);
assert.ok(r3Reversi.legalMoves('black', 'H').length > 0, 'R3 Clifford Reversi has legal opening moves.');

const signedReversi = new CliffordReversiGame({
    topology: { topology: 'torus', width: 8, height: 8 },
    trackPhaseSigns: true
});
const signedPreview = signedReversi.previewMove([5, 3], 'white', 'S');
assert.equal(signedPreview.legal, true, 'White can bracket the initial black Y stone.');
assert.equal(signedPreview.flips[0].after.pauliLabel, 'X', 'S maps Y to X in binary Pauli labels.');
assert.equal(signedPreview.flips[0].after.pauliSign, -1, 'Phase-sign mode records S:Y -> -X.');

const physicalVacuum = new PhysicalCliffordReversiGame({
    topology: { topology: 'flat', width: 8, height: 8 },
    physicalInitialState: 'stabilizer_vacuum',
    probability: { seed: 'physical-vacuum', measurementErrorRate: 0 }
});
assert.equal(physicalVacuum.mode, 'clifford_reversi');
assert.equal(physicalVacuum.algebraSet, PHYSICAL_CLIFFORD_ALGEBRA_SET);
assert.equal(physicalVacuum.board.size, 0, 'Physical stabilizer vacuum does not reuse the four-stone opening.');
assert.equal(physicalVacuum.computePhysicalObservables().pauliCounts.I, 64, 'Empty physical sites count as identity I.');
assert.equal(physicalVacuum.computePhysicalAnswer().stabilizerVacuumRecovered, true);
const magicAncilla = physicalVacuum.prepareAncilla([3, 3], 'magic');
assert.equal(magicAncilla.ok, true, 'Magic ancilla preparation succeeds on an empty physical site.');
assert.equal(physicalVacuum.getStone([3, 3]).isAncilla, true);
assert.equal(physicalVacuum.computePhysicalObservables().nonCliffordResourcesUsed, true);
physicalVacuum.currentPlayer = 'black';
const zAncilla = physicalVacuum.prepareAncilla([4, 3], 'Z1');
assert.equal(zAncilla.ok, true);
physicalVacuum.currentPlayer = 'black';
const entangled = physicalVacuum.entangleAncilla([3, 3], [4, 3], 'CZ');
assert.equal(entangled.ok, true, 'CZ can entangle prepared physical sites when one endpoint is an ancilla.');
physicalVacuum.currentPlayer = 'black';
const measuredAncilla = physicalVacuum.measureAncilla([4, 3], 'Z');
assert.equal(measuredAncilla.ok, true, 'Prepared ancillas support local Pauli measurement.');
assert.ok(physicalVacuum.physicsHistory.length >= 5, 'Physical actions append replayable physics history.');

const readoutErrorGame = new PhysicalCliffordReversiGame({
    topology: { topology: 'flat', width: 4, height: 4 },
    physicalInitialState: 'stabilizer_vacuum',
    probability: { seed: 'forced-readout-error', measurementErrorRate: 1 }
});
readoutErrorGame.prepareAncilla([1, 1], 'Z0', { consumeTurn: false });
const faultyReadout = readoutErrorGame.measureAncilla([1, 1], 'Z', { consumeTurn: false });
assert.equal(faultyReadout.event.measurements[0].trueResult, 'even');
assert.equal(faultyReadout.event.measurements[0].reported, 'odd', 'Readout error changes the report.');
assert.equal(readoutErrorGame.getStone([1, 1]).sign, 1, 'Readout error does not change the true collapsed state.');

const physicalFlip = new PhysicalCliffordReversiGame({
    topology: { topology: 'flat', width: 8, height: 8 },
    physicalInitialState: 'stabilizer_vacuum'
});
physicalFlip.setStone([3, 3], { color: 'white', pauliLabel: 'X', pauliSign: -1, phase: 0 });
physicalFlip.setStone([4, 3], { color: 'black', pauliLabel: 'Z', pauliSign: 1, phase: 0 });
const physicalPreview = physicalFlip.previewMove([2, 3], 'black', 'H');
assert.equal(physicalPreview.legal, true, 'Physical mode keeps topology-aware Reversi bracketing.');
assert.equal(physicalPreview.flips[0].after.pauliSign, 1, 'A physical Reversi flip changes the sector sign.');
assert.equal(physicalPreview.flips[0].after.pauliLabel, 'Z', 'The selected Clifford gate transforms the flipped Pauli.');
assert.equal(physicalPreview.flips[0].after.color, 'black', 'The displayed owner follows the physical sector sign.');

for (const initialState of [
    'sparse_pauli_errors',
    'paired_defects',
    'domain_wall_seed',
    'prepared_clifford_circuit'
]) {
    const seeded = new PhysicalCliffordReversiGame({
        topology: { topology: 'flat', width: 8, height: 8 },
        physicalInitialState: initialState,
        probability: { seed: `physical-${initialState}`, measurementErrorRate: 0 }
    });
    assert.ok(seeded.board.size > 0, `${initialState} creates a non-vacuum physical state.`);
    assert.equal(seeded.exportState().physicalConfig.physicalInitialState, initialState);
}

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

const isingExcitation = new AnyonJumpGame({
    topology: { topology: 'flat', width: 6, height: 6 },
    config: { anyonModel: 'ising', setupMode: 'excitation', excitationEnergy: { black: 12, white: 12 } }
});
const exciteSigma = isingExcitation.exciteAnyon([2, 2], 'sigma', 'black');
assert.equal(exciteSigma.ok, true, 'Ising excitation mode can create sigma.');
assert.equal(isingExcitation.tokens.get(exciteSigma.event.tokenId).anyonType, 'sigma');

const fibonacciExcitation = new AnyonJumpGame({
    topology: { topology: 'flat', width: 6, height: 6 },
    config: { anyonModel: 'fibonacci', setupMode: 'excitation', excitationEnergy: { black: 12, white: 12 } }
});
const exciteTau = fibonacciExcitation.exciteAnyon([2, 2], 'tau', 'black');
assert.equal(exciteTau.ok, true, 'Fibonacci excitation mode can create tau.');
assert.equal(fibonacciExcitation.tokens.get(exciteTau.event.tokenId).anyonType, 'tau');

assert.deepEqual(
    anyonTypes('zn', 5),
    ['1', 'z1', 'z2', 'z3', 'z4'],
    'Z_n exposes every grade, including vacuum and all non-vacuum charges.'
);
const znExcitation = new AnyonJumpGame({
    topology: { topology: 'flat', width: 6, height: 6 },
    config: {
        anyonModel: 'zn',
        phaseModel: 'zn_phase',
        generalAnyonGrade: 5,
        setupMode: 'excitation',
        excitationEnergy: { black: 12, white: 12 }
    }
});
const exciteZ4 = znExcitation.exciteAnyon([2, 2], 'z4', 'black');
assert.equal(exciteZ4.ok, true, 'Z_n excitation mode can create its highest non-vacuum grade.');
assert.equal(znExcitation.tokens.get(exciteZ4.event.tokenId).anyonType, 'z4');
assert.equal(
    createFusionResult('z2', 'z3', { anyonModel: 'zn', generalAnyonGrade: 5 }).resolved,
    '1',
    'Z_n fusion adds grades modulo n and resolves grade zero to vacuum.'
);

const finiteEntanglement = new AnyonJumpGame({
    topology: { topology: 'flat', width: 8, height: 8 },
    config: {
        anyonModel: 'ising',
        braidMemoryMode: 'nonabelian_fusion_channel',
        entanglementRangeMode: 'finite',
        entanglementDistance: 2
    }
});
finiteEntanglement.tokens.clear();
finiteEntanglement.worldlines.clear();
const sigmaA = finiteEntanglement.addToken({ id: 'sigma-a', owner: 'black', coord: [1, 1], anyonType: 'sigma' });
const sigmaB = finiteEntanglement.addToken({ id: 'sigma-b', owner: 'white', coord: [2, 1], anyonType: 'sigma' });
finiteEntanglement.applyBraid(sigmaA, {
    targetId: sigmaB.id,
    reason: 'test_nonabelian_pair',
    sign: 1,
    index: 0,
    path: [[1, 1], [2, 1]]
});
assert.equal(
    sigmaA.hiddenFusionState.currentPossibleOutputs.join(','),
    '1,psi',
    'Sigma pair stores the alternative vacuum or psi fusion channels.'
);
sigmaA.coord = [6, 6];
const decoherence = finiteEntanglement.enforceEntanglementDistance();
assert.equal(decoherence.length, 1, 'Finite entanglement range decoheres a pair beyond the graph-distance limit.');
assert.equal(sigmaA.hiddenFusionState.currentChannel, null, 'Decoherence clears the active hidden fusion channel.');

const infiniteEntanglement = new AnyonJumpGame({
    topology: { topology: 'flat', width: 8, height: 8 },
    config: {
        anyonModel: 'ising',
        braidMemoryMode: 'nonabelian_fusion_channel',
        entanglementRangeMode: 'infinite'
    }
});
infiniteEntanglement.tokens.clear();
infiniteEntanglement.worldlines.clear();
const infiniteA = infiniteEntanglement.addToken({ id: 'infinite-a', owner: 'black', coord: [1, 1], anyonType: 'sigma' });
const infiniteB = infiniteEntanglement.addToken({ id: 'infinite-b', owner: 'white', coord: [2, 1], anyonType: 'sigma' });
infiniteEntanglement.applyBraid(infiniteA, {
    targetId: infiniteB.id,
    reason: 'test_infinite_pair',
    sign: 1,
    index: 0,
    path: [[1, 1], [2, 1]]
});
infiniteA.coord = [6, 6];
assert.equal(infiniteEntanglement.enforceEntanglementDistance().length, 0, 'Infinite entanglement does not decohere by distance.');
assert.ok(infiniteA.hiddenFusionState.currentChannel, 'Infinite-range hidden fusion channel remains active.');

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
