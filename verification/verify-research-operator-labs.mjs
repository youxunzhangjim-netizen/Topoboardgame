import assert from 'node:assert/strict';
import { GraphGoGame } from '../js/go/GraphGoGame.js';
import { ReversiGame } from '../js/reversi/ReversiGame.js';
import { JumpGameState } from '../js/shared/JumpRules.js';
import { createBoardSpec } from '../js/shared/BoardSpec.js';
import {
    addOperatorEdge,
    addOperatorNode,
    createOperatorGraphSpec,
    exportOperatorGraph,
    getOperatorNeighbors,
    importOperatorGraph,
    removeOperatorEdge,
    removeOperatorNode
} from '../js/labs/OperatorGraphSpec.js';
import {
    checkLabBoardCompatibility,
    explainLabBoardMismatch,
    registerLabCompatibility
} from '../js/labs/LabBoardCompatibility.js';
import {
    getResearchInitialSettingsPreset,
    resolveResearchInitialSettings
} from '../js/labs/ResearchInitialSettings.js';

function graphBoard() {
    return createBoardSpec({
        id: 'verify.operator.graph-board',
        nameEn: 'Operator Graph Test Board',
        nameZh: '算子圖測試棋盤',
        dimension: 2,
        playableKind: 'vertex',
        space: { id: 'r2', nameEn: 'Euclidean Plane R2', nameZh: '歐氏平面 R2' },
        lattice: { id: 'square', nameEn: 'Square Lattice', nameZh: '方格晶格' },
        boundary: { id: 'hard', nameEn: 'Hard Boundary', nameZh: '硬邊界' },
        sites: [
            { id: 'a', coord: { x: 0, y: 0 } },
            { id: 'b', coord: { x: 1, y: 0 } }
        ],
        edges: [{ source: 'a', target: 'b' }]
    });
}

function boardWithoutGraphNeighbors() {
    return createBoardSpec({
        ...graphBoard(),
        id: 'verify.operator.no-neighbors',
        edges: []
    });
}

{
    const anyon = getResearchInitialSettingsPreset('anyon_jump');
    assert.deepEqual(anyon.initialOperatorTypes, ['σ', 'ψ', '1']);
    assert.ok(anyon.allowedActions.includes('exchange'));
    assert.ok(anyon.observables.includes('braid word'));

    const majorana = resolveResearchInitialSettings('majorana_modes', { randomSeed: 'verify-seed' });
    assert.equal(majorana.flavors.length, 8);
    assert.ok(majorana.allowedActions.includes('measure_parity'));
    assert.equal(majorana.randomSeed, 'verify-seed');

    const clifford = resolveResearchInitialSettings('clifford_reversi');
    assert.ok(clifford.initialOperatorTypes.includes('CNOT-symbolic'));
    assert.ok(clifford.observables.includes('logical error flag'));

    const cluster = resolveResearchInitialSettings('physical_cluster_go', { stochasticMode: true });
    assert.ok(cluster.initialOperatorTypes.includes('phase A'));
    assert.ok(cluster.allowedActions.includes('relax'));
    assert.equal(cluster.stochasticMode, true);
}

{
    const graph = createOperatorGraphSpec({
        id: 'verify.dynamic-operator-graph',
        nameEn: 'Dynamic Operator Graph',
        nameZh: '動態算子圖',
        baseBoardId: null,
        baseBoardSpecRef: null,
        metadata: { labMode: 'dynamic_operator_graph' }
    });
    addOperatorNode(graph, { id: 'op:a', kind: 'operator', label: 'A', flavor: 'phase A' });
    addOperatorNode(graph, { id: 'op:b', kind: 'operator', label: 'B', flavor: 'phase B' });
    addOperatorEdge(graph, { id: 'edge:a-b', source: 'op:a', target: 'op:b', kind: 'coupling' });
    assert.deepEqual(getOperatorNeighbors(graph, 'op:a'), ['op:b']);
    assert.equal(graph.baseBoardSpecRef, null);

    const roundTrip = importOperatorGraph(exportOperatorGraph(graph));
    assert.equal(roundTrip.nodes.length, 2);
    assert.equal(roundTrip.edges.length, 1);

    assert.equal(removeOperatorEdge(roundTrip, 'edge:a-b'), true);
    assert.equal(roundTrip.edges.length, 0);
    assert.equal(removeOperatorNode(roundTrip, 'op:a'), true);
    assert.equal(roundTrip.nodes.some((node) => node.id === 'op:a'), false);
}

{
    registerLabCompatibility({
        labId: 'verify.fixed-board-substrate',
        allowedDimensions: [2],
        requiredBoardFeatures: ['graphNeighbors'],
        fallbackBoardId: 'board.r2-square-standard'
    });
    assert.equal(checkLabBoardCompatibility('verify.fixed-board-substrate', graphBoard()).ok, true);
    const blocked = checkLabBoardCompatibility('verify.fixed-board-substrate', boardWithoutGraphNeighbors());
    assert.equal(blocked.ok, false);
    const explanation = explainLabBoardMismatch('verify.fixed-board-substrate', boardWithoutGraphNeighbors(), 'en');
    assert.equal(explanation.ok, false);
    assert.match(explanation.messageEn, /valid graph neighbors/i);
}

{
    const go = new GraphGoGame({ topology: 'flat', width: 5, height: 5 });
    const goMove = go.tryPlay([2, 2], 'black');
    assert.equal(goMove.ok, true, goMove.error);
    const occupied = go.tryPlay([2, 2], 'white');
    assert.equal(occupied.ok, false);

    const reversi = new ReversiGame({ topology: 'open', width: 8, height: 8 });
    const reversiMoves = reversi.legalMoves();
    assert.ok(reversiMoves.length > 0);
    const reversiMove = reversi.play(reversiMoves[0].coord);
    assert.equal(reversiMove.ok, true, reversiMove.reason);

    const jump = new JumpGameState({ dimension: 2, size: 6, topology: 'plane' });
    const jumpMoves = jump.allLegalMoves();
    assert.ok(jumpMoves.length > 0);
    const jumpMove = jump.applyMove(jumpMoves[0]);
    assert.equal(jumpMove.ok, true, jumpMove.error);
}

console.log('Research operator Labs verification passed.');
