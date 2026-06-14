import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AnyonJumpGame } from '../js/localgames/AnyonJump.js';
import { CliffordReversiGame } from '../js/localgames/CliffordReversi.js';
import { nextRequiredUnbraidGenerator } from '../js/anyon/BraidMemory.js';
import {
    calculateToricCodeMemoryUnbraidAnswer,
    computeToricCodeMemoryUnbraidObservables,
    runToricMemoryExperiment,
    ToricCodeMemoryUnbraidProblem,
    TORIC_CODE_MEMORY_UNBRAID_ID,
    topologyOptionsForToricCodeMemoryUnbraid
} from '../js/physics/ToricCodeMemoryUnbraidProblem.js';
import { AnyonGameEngine } from '../js/anyon/AnyonEngine.js';
import { createGraphTopology } from '../js/topology/GraphTopologies.js';
import {
    calculateIsingDomainWallTopologyAnswer,
    computeIsingDomainWallObservables,
    ISING_DOMAIN_WALL_TOPOLOGY_ID,
    topologyOptionsForIsingDomainWallTopology
} from '../js/physics/IsingDomainWallTopologyProblem.js';
import {
    createPhysicalProblem,
    normalizePhysicalProblemId
} from '../js/physics/PhysicalProblems.js';

const topologyOptions = topologyOptionsForToricCodeMemoryUnbraid({
    topology: 'RP2',
    boardSize: 6
});
assert.equal(topologyOptions.topology, 'rp2', 'Physical problem normalizes RP2 topology for graph topology.');
assert.equal(topologyOptions.width, 6);
assert.equal(topologyOptions.height, 6);

const toricProblemSource = fs.readFileSync(
    new URL('../js/physics/ToricCodeMemoryUnbraidProblem.js', import.meta.url),
    'utf8'
);
assert.doesNotMatch(
    toricProblemSource,
    /token\??\.coord|addToken\s*\(\s*\{[^}]*\bcoord\s*:/s,
    'The toric-code physical problem must remain vertex-native.'
);

const initialized = new AnyonJumpGame({
    physicalProblem: {
        id: TORIC_CODE_MEMORY_UNBRAID_ID,
        topology: 'torus',
        boardSize: 6,
        numPairsE: 1,
        numPairsM: 1
    }
});
const initializedExport = initialized.exportState().physicalProblem;
assert.equal(initializedExport.problemId, TORIC_CODE_MEMORY_UNBRAID_ID);
assert.equal(initializedExport.initialObservables.numE, 2, 'One local e pair creates two e anyons.');
assert.equal(initializedExport.initialObservables.numM, 2, 'One local m pair creates two m anyons.');
assert.equal(initializedExport.initialObservables.totalFusionCharge, '1', 'Initial local pairs have total vacuum charge.');
assert.equal(initializedExport.initialObservables.topologicalMemoryAlive, true, 'Local pairs initialize a live QEC memory experiment.');
assert.equal(initializedExport.config.boardSize, 6);
assert.ok(initializedExport.physicalQuestion.length >= 3);
assert.ok(initializedExport.initialState.tokens.every((token) => Array.isArray(token.vertex)), 'Initial export uses token vertices.');

const coreGame = new AnyonGameEngine({
    topology: createGraphTopology({ topology: 'torus', width: 6, height: 6 })
});
const coreProblem = new ToricCodeMemoryUnbraidProblem({
    topology: 'torus',
    boardSize: 6,
    numPairsE: 1,
    numPairsM: 1,
    pairSeparation: 2
});
coreProblem.setupInitialState(coreGame);
coreProblem.start(coreGame);
assert.equal(coreGame.tokens.size, 4, 'Vertex-native AnyonGameEngine receives two local pairs.');
assert.ok([...coreGame.tokens.values()].every((token) => Array.isArray(token.vertex) && token.coord == null));
const coreVertices = [...coreGame.tokens.values()].map((token) => token.vertex.join(','));
assert.equal(new Set(coreVertices).size, coreVertices.length, 'Pair initialization avoids occupied vertices.');
assert.equal(coreProblem.initialObservables.tick, 0, 'Core engine uses game.turn as the physical tick.');

const logicalGame = new AnyonGameEngine({
    topology: createGraphTopology({ topology: 'torus', width: 6, height: 6 })
});
logicalGame.addToken({ id: 'logical-e', owner: 'black', vertex: [5, 3], anyonType: 'e' });
const logicalProblem = new ToricCodeMemoryUnbraidProblem({ createPairsLocally: false });
logicalProblem.start(logicalGame);
assert.equal(logicalGame.moveToken('logical-e', [0, 3], { player: 'black' }).ok, true);
const logicalEntry = logicalProblem.record(logicalGame, 'seam_move');
assert.equal(logicalEntry.observables.windingX, 1, 'Core engine preserves raw seam edges for winding.');
assert.equal(logicalEntry.observables.logicalSector, '(1,0)');
assert.equal(logicalEntry.observables.logicalErrorOccurred, true);
assert.equal(logicalEntry.observables.topologicalMemoryAlive, false);

const game = new AnyonJumpGame({
    topology: { topology: 'torus', width: 4, height: 4 },
    config: { braidMemoryMode: 'word_exact', braidEffect: 'add_braid_token' },
    physicalProblem: {
        id: TORIC_CODE_MEMORY_UNBRAID_ID,
        createPairsLocally: false
    }
});
game.tokens.clear();
game.worldlines.clear();
game.addToken({ id: 'b1', owner: 'black', coord: [0, 0], anyonType: 'e' });
game.addToken({ id: 'w1', owner: 'white', coord: [1, 0], anyonType: 'm' });
game.currentPlayer = 'black';
game.physicalProblem.start(game);

const jump = game.move('b1', [2, 0]);
assert.equal(jump.ok, true, 'Jump over m anyon succeeds.');
let exportAfterBraid = game.exportState().physicalProblem;
assert.equal(exportAfterBraid.finalObservables.braidParityTotal, 0, 'Word-exact mode stores braid word rather than parity.');
assert.equal(exportAfterBraid.finalObservables.maxBraidWordLength, 1);
assert.equal(exportAfterBraid.finalObservables.numberOfBraidedTokens, 1);
assert.equal(exportAfterBraid.finalObservables.topologicalMemoryAlive, true);
assert.equal(exportAfterBraid.eventCounts.braidEvents, 1);

const nextInverse = nextRequiredUnbraidGenerator(game.tokens.get('b1').braidWord);
game.currentPlayer = 'black';
const unbraid = game.attemptUnbraid('b1', 'w1', {
    player: 'black',
    sign: nextInverse.sign,
    index: nextInverse.index
});
assert.equal(unbraid.ok, true, 'Exact inverse unbraid action succeeds.');
const finalExport = game.exportState().physicalProblem;
assert.equal(finalExport.finalObservables.maxBraidWordLength, 0, 'Successful unbraid clears braid word.');
assert.equal(finalExport.finalObservables.topologicalMemoryAlive, true, 'Non-vacuum toric excitations keep the memory experiment active.');
assert.equal(finalExport.eventCounts.successfulUnbraids, 1);
assert.equal(finalExport.eventCounts.failedUnbraids, 0);
assert.equal(finalExport.answer.exactUnbraidSuccessRate, 1);
assert.equal(finalExport.answer.finalAnswerLabel, 'memory_survived');
assert.match(finalExport.answer.summary, /toric-code memory/);
assert.ok(finalExport.fullHistory.length >= 3, 'Problem records initial, braid, and unbraid observations.');

const observables = computeToricCodeMemoryUnbraidObservables(game);
assert.equal(observables.totalFusionCharge, 'psi', 'Remaining e and m fuse to psi total charge.');
assert.equal(observables.returnedToVacuum, false);

const answer = calculateToricCodeMemoryUnbraidAnswer({
    initialObservables: finalExport.initialObservables,
    finalObservables: finalExport.finalObservables,
    history: finalExport.fullHistory,
    eventCounts: finalExport.eventCounts
});
assert.equal(answer.logicalErrorOccurred, false);
assert.equal(answer.finalTotalCharge, 'psi');

const experiment = runToricMemoryExperiment({
    topologyList: ['torus', 'klein_bottle'],
    numTrials: 2,
    maxTurns: 5,
    noiseRate: 0.05,
    measurementErrorRate: 0.02,
    policy: 'random',
    seed: 'qec-experiment-test'
});
assert.equal(experiment.trials.length, 4);
assert.equal(typeof experiment.aggregate.averageMemoryLifetime, 'number');
assert.equal(typeof experiment.aggregate.vacuumRecoveryRate, 'number');
assert.equal(typeof experiment.aggregate.logicalErrorRate, 'number');
assert.ok(Object.keys(experiment.aggregate.finalChargeDistribution).length > 0);
assert.ok(Object.keys(experiment.aggregate.finalLogicalSectorDistribution).length > 0);

assert.equal(normalizePhysicalProblemId(ISING_DOMAIN_WALL_TOPOLOGY_ID), ISING_DOMAIN_WALL_TOPOLOGY_ID);
assert.equal(createPhysicalProblem({ id: ISING_DOMAIN_WALL_TOPOLOGY_ID }).id, ISING_DOMAIN_WALL_TOPOLOGY_ID);

const isingTopologyOptions = topologyOptionsForIsingDomainWallTopology({
    topology: 'sphere',
    boardSize: 7
});
assert.equal(isingTopologyOptions.topology, 'sphere_latitude', 'S2 topology is normalized to the latitude-ring graph.');
assert.equal(isingTopologyOptions.width, 7);
assert.equal(isingTopologyOptions.height, 7);

const checkerboardIsing = new CliffordReversiGame({
    physicalProblem: {
        id: ISING_DOMAIN_WALL_TOPOLOGY_ID,
        topology: 'torus',
        boardSize: 4,
        initialState: 'checkerboard',
        J: 1
    }
});
const checkerExport = checkerboardIsing.exportState().physicalProblem;
assert.equal(checkerExport.problemId, ISING_DOMAIN_WALL_TOPOLOGY_ID);
assert.equal(checkerExport.config.topology, 'torus');
assert.equal(checkerExport.initialObservables.numberOfSpins, 16);
assert.equal(checkerExport.initialObservables.numberOfEdges, 32, '4x4 torus has 32 undirected axis edges.');
assert.equal(checkerExport.initialObservables.domainWallLength, 32, 'Checkerboard on a torus makes every edge a domain wall.');
assert.equal(checkerExport.initialObservables.domainWallDensity, 1);
assert.equal(checkerExport.initialObservables.energy, 32);
assert.equal(checkerExport.initialObservables.magnetization, 0);
assert.equal(checkerExport.answer.topologyEffectLabel, 'disordered');

const isingMoveGame = new CliffordReversiGame({
    topology: { topology: 'torus', width: 8, height: 8 },
    physicalProblem: {
        id: ISING_DOMAIN_WALL_TOPOLOGY_ID,
        topology: 'torus',
        boardSize: 8,
        initialState: 'infer_current',
        J: 1
    }
});
const legalIsingMove = isingMoveGame.legalMoves()[0];
assert.ok(legalIsingMove, 'Default Clifford Reversi setup should have a legal Ising-Reversi move.');
const isingMove = isingMoveGame.place(legalIsingMove.coord);
assert.equal(isingMove.ok, true, 'Ising-Reversi physical problem should not block normal Reversi moves by default.');
assert.equal(typeof isingMove.event.physicalProblem.deltaEnergy, 'number');
const isingMoveExport = isingMoveGame.exportState().physicalProblem;
assert.equal(isingMoveExport.fullHistory.length >= 2, true, 'Ising problem records initial and move observations.');
assert.equal(typeof isingMoveExport.finalObservables.energy, 'number');
assert.ok(isingMoveExport.answer.summary.includes('Ising-Reversi game'));

const directObservables = computeIsingDomainWallObservables(checkerboardIsing, checkerExport.config);
assert.equal(directObservables.domainWallLength, 32);
const directAnswer = calculateIsingDomainWallTopologyAnswer({
    config: checkerExport.config,
    initialObservables: checkerExport.initialObservables,
    finalObservables: directObservables,
    history: checkerExport.fullHistory
});
assert.equal(directAnswer.disorderedStateReached, true);

console.log('Physical problem verification passed.');
