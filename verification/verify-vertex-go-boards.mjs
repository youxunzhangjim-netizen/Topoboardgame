import assert from 'node:assert/strict';
import {
    createHoneycombCylinderGraph,
    createHoneycombTorusGraph
} from '../js/shared/HoneycombGraphBoards.js';
import {
    createKleinBottleVertexGraph,
    normalizeKleinBottleSquare
} from '../js/shared/KleinVertexGraphBoard.js';
import {
    undirectedEdgeKey,
    validateVertexGraphBoard
} from '../js/shared/VertexGraphBoardValidator.js';
import {
    COLORS,
    CYLINDER_GO_TOPOLOGY,
    GoGameLogic,
    HONEYCOMB_LATTICE
} from '../3D/3dgo/js/GoGame.js';
import { KLEIN_BOTTLE_TOPOLOGY } from '../3D/3dgo/js/KleinBottleTopology.js';
import {
    getDrawPosition,
    getNeighborsForGame,
    getPlayableUnits,
    hitTestPlayableUnit,
    isPlayableUnitOccupied,
    placePieceOnPlayableUnit
} from '../js/shared/PlayableSiteAdapter.js';

function assertCommonGraph(board, validationOptions) {
    const result = validateVertexGraphBoard(board, { connected: true, ...validationOptions });
    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.equal(result.stats.connectedComponents, 1);

    const ids = new Set(board.sites.map((site) => site.id));
    const edges = new Set();
    for (const edge of board.edges) {
        assert.notEqual(edge.source, edge.target, `Self-loop at ${edge.source}.`);
        assert.ok(ids.has(edge.source), `Missing edge source ${edge.source}.`);
        assert.ok(ids.has(edge.target), `Missing edge target ${edge.target}.`);
        const key = undirectedEdgeKey(edge.source, edge.target);
        assert.equal(edges.has(key), false, `Duplicate edge ${key}.`);
        edges.add(key);
    }
    for (const [id, neighbors] of board.adjacency) {
        for (const neighbor of neighbors) assert.ok(ids.has(neighbor), `Unknown neighbor ${neighbor} at ${id}.`);
    }

    const units = getPlayableUnits(board);
    const first = units[0];
    assert.equal(units.length, board.sites.length, 'Playable adapter must expose every graph vertex.');
    assert.deepEqual(getNeighborsForGame(board, first.id).sort(), [...board.adjacency.get(first.id)].sort());
    const draw = getDrawPosition(board, first.id);
    assert.ok(draw && Number.isFinite(draw.x) && Number.isFinite(draw.y), 'Playable unit must expose a draw position.');
    const hit = hitTestPlayableUnit(board, draw.x, draw.y, { threshold: board.hitRadius });
    assert.equal(hit?.unitId, first.id, 'Hit testing must select the exact nearest graph vertex.');
    const state = { stones: new Map() };
    assert.equal(placePieceOnPlayableUnit(state, first.id, 'black').ok, true);
    assert.equal(isPlayableUnitOccupied(state, first.id), true);
    assert.equal(placePieceOnPlayableUnit(state, first.id, 'white').ok, false);
}

function assertGoBehavior(game) {
    const site = game.vertexGraph.sites.find((candidate) => game.neighborsFromSiteId(candidate.id).length > 0);
    assert.ok(site, 'Board must expose a playable graph site.');
    const neighbors = game.neighborsFromSiteId(site.id);
    const firstMove = game.tryPlaySite(site.id, 'black');
    assert.equal(firstMove.ok, true, `Black placement failed at ${site.id}.`);
    const occupied = game.tryPlaySite(site.id, 'white');
    assert.equal(occupied.ok, false, 'A second stone on the same site must be rejected.');
    assert.match(occupied.error, /occupied/i);

    const index = game.indexFromCoord(site.gameCoord);
    const group = game.getGroupAndLiberties(game.board, index);
    assert.equal(group.liberties.size, neighbors.length, 'Liberties must equal empty graph neighbors.');
    const synchronized = new GoGameLogic();
    synchronized.importState(game.exportState());
    assert.deepEqual(
        [...synchronized.siteState.entries()],
        [...game.siteState.entries()],
        'Online-compatible export/import must preserve stable site-id state.'
    );

    const captureGame = new GoGameLogic({
        width: game.width,
        height: game.height,
        size: game.size,
        dimension: 2,
        topology: game.topology,
        lattice: game.lattice,
        komi: 0
    });
    const target = captureGame.vertexGraph.sites.find((candidate) =>
        captureGame.neighborsFromSiteId(candidate.id).length >= 2);
    const targetIndex = captureGame.indexFromCoord(target.gameCoord);
    captureGame.board[targetIndex] = COLORS.white;
    const captureNeighbors = captureGame.neighborsFromSiteId(target.id);
    for (const neighborId of captureNeighbors.slice(0, -1)) {
        const coord = captureGame.coordFromSiteId(neighborId);
        captureGame.board[captureGame.indexFromCoord(coord)] = COLORS.black;
    }
    captureGame.currentPlayer = 'black';
    captureGame.positionHistory = [captureGame.serializeBoard(captureGame.board)];
    captureGame.positionSet = new Set(captureGame.positionHistory);
    const capture = captureGame.tryPlaySite(captureNeighbors.at(-1), 'black');
    assert.equal(capture.ok, true, `Capture placement failed at ${captureNeighbors.at(-1)}.`);
    assert.equal(capture.captured, 1, 'Capture must use graph adjacency and liberties.');

    game.reset({
        width: game.width,
        height: game.height,
        size: game.size,
        dimension: 2,
        topology: game.topology,
        lattice: game.lattice
    });
    assert.equal(game.siteState.size, 0, 'New game must clear graph-board stones.');
    assert.equal(game.moveNumber, 0, 'New game must reset the move counter.');
}

for (const [width, height] of [[3, 3], [4, 3]]) {
    const board = createHoneycombTorusGraph(width, height);
    assertCommonGraph(board, {
        expectedSiteCount: 2 * width * height,
        expectedEdgeCount: 3 * width * height,
        expectedDegree: 3,
        bipartite: true
    });
    for (const edge of board.edges) {
        assert.notEqual(
            board.siteById.get(edge.source).coord.sub,
            board.siteById.get(edge.target).coord.sub,
            'Honeycomb torus edges must connect A to B.'
        );
    }
    assertGoBehavior(new GoGameLogic({
        width,
        height,
        size: width,
        dimension: 2,
        topology: 't2',
        lattice: HONEYCOMB_LATTICE
    }));
}

{
    const width = 4;
    const height = 4;
    const board = createHoneycombCylinderGraph(width, height);
    assertCommonGraph(board, {
        expectedSiteCount: 2 * width * height,
        expectedEdgeCount: 3 * width * height - width,
        allowedDegreeRange: [2, 3],
        bipartite: true
    });
    for (const edge of board.edges) {
        assert.notEqual(
            board.siteById.get(edge.source).coord.sub,
            board.siteById.get(edge.target).coord.sub,
            'Honeycomb cylinder edges must connect A to B.'
        );
    }
    assertGoBehavior(new GoGameLogic({
        width,
        height,
        size: width,
        dimension: 2,
        topology: CYLINDER_GO_TOPOLOGY,
        lattice: HONEYCOMB_LATTICE
    }));
}

for (const [width, height] of [[5, 5], [6, 4]]) {
    const board = createKleinBottleVertexGraph(width, height);
    assertCommonGraph(board, {
        expectedSiteCount: width * height,
        expectedEdgeCount: 2 * width * height,
        expectedDegree: 4
    });
    assert.deepEqual(
        normalizeKleinBottleSquare({ x: 1, y: height }, width, height),
        { x: width - 2, y: 0 },
        'Crossing the y boundary must flip x.'
    );
    assertGoBehavior(new GoGameLogic({
        width,
        height,
        size: width,
        dimension: 2,
        topology: KLEIN_BOTTLE_TOPOLOGY,
        lattice: 'square'
    }));
}

console.log('Steam vertex Go board verification passed.');
