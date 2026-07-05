import assert from 'node:assert/strict';
import {
    createHoneycombCylinderGraph,
    createHoneycombTorusGraph
} from '../../../js/shared/HoneycombGraphBoards.js';
import { createKleinBottleVertexGraph } from '../../../js/shared/KleinVertexGraphBoard.js';
import {
    assertBoardValid,
    validateVertexGraphBoard
} from '../../../js/shared/VertexGraphBoardValidator.js';
import {
    getGraphNeighbors,
    getPlayableSites,
    getSiteDrawPosition,
    hitTestPlayableSite
} from '../../../js/shared/VertexPlayableBoardAdapter.js';
import {
    COLORS,
    CYLINDER_GO_TOPOLOGY,
    GoGameLogic,
    HONEYCOMB_LATTICE
} from '../js/GoGame.js';
import { KLEIN_BOTTLE_TOPOLOGY } from '../js/KleinBottleTopology.js';

for (const [width, height] of [[2, 2], [3, 3], [4, 3], [6, 4]]) {
    const graph = createHoneycombTorusGraph(width, height);
    const result = assertBoardValid(graph, {
        expectedSiteCount: 2 * width * height,
        expectedEdgeCount: 3 * width * height,
        expectedDegree: 3,
        bipartite: true,
        connected: true
    });
    assert.equal(result.stats.minDegree, 3);
    assert.equal(result.stats.maxDegree, 3);
    assert.equal(new Set(graph.sites.map((site) => site.id)).size, graph.sites.length);
    for (const edge of graph.edges) {
        const source = graph.siteById.get(edge.source);
        const target = graph.siteById.get(edge.target);
        assert.notEqual(source.coord.sub, target.coord.sub, 'Every honeycomb edge must join A to B.');
    }
    const first = graph.sites[0];
    assert.equal(getPlayableSites(graph).length, graph.sites.length);
    assert.deepEqual(getSiteDrawPosition(graph, first.id), first.draw);
    assert.equal(getGraphNeighbors(graph, first.id).length, 3);
    assert.equal(
        hitTestPlayableSite(graph, first.draw.x, first.draw.y, 0.42)?.siteId,
        first.id,
        'Hit testing must return the nearest stable site id.'
    );
    assert.equal(
        hitTestPlayableSite(graph, first.draw.x + 100, first.draw.y + 100, 0.42),
        null,
        'Hit testing must reject points outside the site radius.'
    );
}

for (const [width, height] of [[3, 3], [4, 4], [6, 4]]) {
    const cylinder = createHoneycombCylinderGraph(width, height);
    assertBoardValid(cylinder, {
        expectedSiteCount: 2 * width * height,
        expectedEdgeCount: 3 * width * height - width,
        allowedDegreeRange: [2, 3],
        bipartite: true,
        connected: true
    });
    for (const site of cylinder.sites) {
        const degree = cylinder.adjacency.get(site.id).size;
        const hardBoundary = (site.coord.sub === 'A' && site.coord.v === 0)
            || (site.coord.sub === 'B' && site.coord.v === height - 1);
        assert.equal(degree, hardBoundary ? 2 : 3, `Cylinder degree at ${site.id}.`);
    }
}

const torusGame = new GoGameLogic({
    width: 4,
    height: 3,
    size: 4,
    dimension: 2,
    topology: 't2',
    lattice: HONEYCOMB_LATTICE
});
assert.equal(torusGame.total, 24, 'Go must allocate one board entry per honeycomb vertex.');
assert.equal(torusGame.vertexGraph.playableKind, 'vertex');
for (const coord of torusGame.playableCoords()) {
    assert.equal(torusGame.neighborsFromCoord(coord).length, 3, `Torus honeycomb degree at ${coord}.`);
}

const target = [0, 0, 0];
const targetIndex = torusGame.indexFromCoord(target);
torusGame.board[targetIndex] = COLORS.white;
const neighbors = torusGame.neighborsFromCoord(target);
for (const neighbor of neighbors.slice(0, -1)) {
    torusGame.board[torusGame.indexFromCoord(neighbor)] = COLORS.black;
}
torusGame.currentPlayer = 'black';
const capture = torusGame.tryPlay(neighbors.at(-1), 'black');
assert.equal(capture.ok, true);
assert.equal(capture.captured, 1, 'Capture must follow honeycomb graph liberties.');
assert.equal(torusGame.siteState.get(torusGame.siteIdFromCoord(neighbors.at(-1))), COLORS.black);
const restoredTorus = new GoGameLogic();
restoredTorus.importState(torusGame.exportState());
assert.deepEqual(
    [...restoredTorus.siteState.entries()],
    [...torusGame.siteState.entries()],
    'Export/import must preserve stones by stable site id.'
);

const cylinderGame = new GoGameLogic({
    width: 5,
    height: 4,
    size: 5,
    dimension: 2,
    topology: CYLINDER_GO_TOPOLOGY,
    lattice: HONEYCOMB_LATTICE
});
assert.equal(cylinderGame.total, 40);
assert.ok(cylinderGame.playableCoords().every((coord) => {
    const degree = cylinderGame.neighborsFromCoord(coord).length;
    return degree >= 2 && degree <= 3;
}));

const kleinGraph = createKleinBottleVertexGraph(9, 7);
const kleinResult = validateVertexGraphBoard(kleinGraph, {
    expectedSiteCount: 63,
    expectedEdgeCount: 126,
    expectedDegree: 4,
    connected: true
});
assert.equal(kleinResult.ok, true, kleinResult.errors.join('\n'));

const kleinGame = new GoGameLogic({
    width: 9,
    height: 7,
    size: 9,
    dimension: 2,
    topology: KLEIN_BOTTLE_TOPOLOGY,
    lattice: 'square'
});
assert.equal(kleinGame.total, 63);
assert.ok(kleinGame.playableCoords().every((coord) => kleinGame.neighborsFromCoord(coord).length === 4));

console.log('Vertex graph validator and Go surface graph verification passed.');
