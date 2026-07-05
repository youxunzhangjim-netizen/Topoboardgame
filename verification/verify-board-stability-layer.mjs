import assert from 'node:assert/strict';
import {
    BOARD_SPEC_SCHEMA,
    boardSpecFromLegacyBoard,
    createBoardSpec,
    exportBoardSpec,
    getNeighbors,
    importBoardSpec
} from '../js/shared/BoardSpec.js';
import { validateBoardSpec } from '../js/shared/BoardSpecValidator.js';
import {
    auditPairChecks,
    clearAuditReport,
    endTimer,
    getAuditReport,
    recordMetric,
    startTimer
} from '../js/shared/PerformanceAudit.js';
import {
    featureStatusSuffix,
    getFeatureStatus,
    isFeatureVisible,
    steamSafeFeatures
} from '../js/shared/FeatureStatusRegistry.js';
import { runChunked, safeGenerateBoard, safeLabStep } from '../js/shared/SafeExecution.js';
import {
    STEAM_BOARD_LIMITS,
    STEAM_LAB_LIMITS,
    STEAM_RENDER_LIMITS,
    assessBoardSafety,
    assessRenderSafety,
    largestSafeUniformSize
} from '../js/shared/SteamSafetyLimits.js';
import { createBuckyballSphereFaceGraph } from '../js/geometry/SphereBoardGeometry.js';
import { createRenderPolicy, measureRender } from '../js/shared/RenderSafety.js';
import HexGame from '../js/hex/HexGame.js';
import {
    getDrawPosition,
    getNeighborsForGame,
    getPlayableUnits,
    hitTestPlayableUnit,
    placePieceOnPlayableUnit
} from '../js/shared/PlayableSiteAdapter.js';

const raw = {
    id: 'test:square',
    nameEn: 'Test Square',
    nameZh: '測試方格',
    dimension: 2,
    playableKind: 'vertex',
    space: { id: 'r2', nameEn: 'Euclidean Plane R²', nameZh: '歐氏平面 R²' },
    lattice: { id: 'square', nameEn: 'Square Lattice', nameZh: '方格晶格' },
    boundary: { id: 'hard', nameEn: 'Hard Boundary', nameZh: '硬邊界' },
    sites: [
        { id: 'a', coord: { x: 0, y: 0 }, draw: { x: 0, y: 0 } },
        { id: 'b', coord: { x: 1, y: 0 }, draw: { x: 1, y: 0 } },
        { id: 'c', coord: { x: 1, y: 1 }, draw: { x: 1, y: 1 } }
    ],
    edges: [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }],
    directions: ['x', 'y'],
    targetZones: { a: ['a'], b: ['c'] }
};

const board = createBoardSpec(raw);
assert.equal(board.schema, BOARD_SPEC_SCHEMA);
assert.deepEqual(getNeighbors(board, 'b').sort(), ['a', 'c']);
const valid = validateBoardSpec(board, {
    renderer: '2d',
    expectedSiteCount: 3,
    expectedEdgeCount: 2,
    degreeRange: [1, 2],
    targetZonesRequired: true,
    directionsRequired: true
});
assert.equal(valid.ok, true, valid.errors.join('\n'));

const roundTrip = importBoardSpec(exportBoardSpec(board));
assert.equal(roundTrip.id, board.id);
assert.equal(roundTrip.sites.length, 3);

const legacy = boardSpecFromLegacyBoard({
    id: 'legacy',
    sites: raw.sites,
    adjacency: new Map([['a', ['b']], ['b', ['a', 'c']], ['c', ['b']]])
}, raw);
assert.equal(legacy.edges.length, 2);
assert.equal(legacy.metadata.legacy, true);

const invalid = createBoardSpec({ ...raw, edges: [...raw.edges, { source: 'a', target: 'missing' }] });
assert.equal(validateBoardSpec(invalid).ok, false);

let fallbackCalls = 0;
const safe = safeGenerateBoard({
    featureId: 'test:invalid',
    generate: () => invalid,
    fallback: () => { fallbackCalls += 1; return board; }
});
assert.equal(safe.ok, false);
assert.equal(safe.usedFallback, true);
assert.equal(fallbackCalls, 1);

assert.equal(getFeatureStatus('board.klein-honeycomb').fallbackId, 'board.klein-square');
assert.equal(isFeatureVisible('board.klein-honeycomb', { steam: true }), false);
assert.equal(featureStatusSuffix('developing', 'zh'), '（開發中）');
assert.ok(steamSafeFeatures().some((entry) => entry.id === 'board.klein-square'));

clearAuditReport();
const timer = startTimer('test-timer');
endTimer(timer, { category: 'render', name: 'test' });
recordMetric('board', 'sites', 3);
const slowRender = startTimer('slow-render');
slowRender.startedAt -= 600;
endTimer(slowRender, { category: 'render', name: 'danger-threshold-check' });
auditPairChecks('large-neighbor-scan', 501);
const auditReport = getAuditReport();
assert.ok(auditReport.metrics.length >= 4);
assert.ok(auditReport.errors.some((item) => item.category === 'render'));
assert.ok(auditReport.warnings.some((item) => item.category === 'complexity'));

const chunked = await runChunked([1, 2, 3, 4, 5], (value) => value * 2, { chunkSize: 2 });
assert.deepEqual(chunked.results, [2, 4, 6, 8, 10]);

const lab = await safeLabStep({ labId: 'lab:test', step: async () => 42, stateVariableCount: 5 });
assert.equal(lab.ok, true);
assert.equal(lab.value, 42);

assert.equal(STEAM_BOARD_LIMITS[2].maxPlayableSites, 10000);
assert.equal(STEAM_BOARD_LIMITS[3].recommendedPlayableSites, 4000);
assert.equal(STEAM_BOARD_LIMITS[4].recommendedVisibleSitesPerSlice, 3000);
assert.equal(STEAM_LAB_LIMITS.simpleMaxStateVariables, 20000);
assert.equal(STEAM_RENDER_LIMITS.maxVisibleEdgesAtFullDetail, 20000);
assert.equal(assessBoardSafety({ dimension: 2, playableSites: 9999, debug: false }).allowed, true);
assert.equal(assessBoardSafety({ dimension: 2, playableSites: 10001, debug: false }).allowed, false);
assert.equal(assessBoardSafety({ dimension: 2, playableSites: 10001, debug: true }).allowed, true);
assert.equal(assessRenderSafety({ durationMs: 501 }).simplify, true);
assert.equal(largestSafeUniformSize(3, 100), 27);

assert.equal(getPlayableUnits(board).length, 3);
assert.deepEqual(getNeighborsForGame(board, 'b').sort(), ['a', 'c']);
assert.equal(hitTestPlayableUnit(board, 1, 0, { threshold: 0.45 }).unitId, 'b');
assert.equal(placePieceOnPlayableUnit({ stones: new Map() }, 'a', 'black').ok, true);

const cellBoard = createBoardSpec({ ...raw, id: 'test:cells', playableKind: 'cell' });
assert.equal(getPlayableUnits(cellBoard).length, 3);
assert.deepEqual(getNeighborsForGame(cellBoard, 'b').sort(), ['a', 'c']);

const edgeBoard = createBoardSpec({ ...raw, id: 'test:edges', playableKind: 'edge' });
const edgeUnits = getPlayableUnits(edgeBoard);
assert.equal(edgeUnits.length, 2);
const firstEdgeId = edgeUnits[0].id || 'edge:a|b';
assert.deepEqual(getDrawPosition(edgeBoard, firstEdgeId), { x: 0.5, y: 0 });
assert.equal(getNeighborsForGame(edgeBoard, firstEdgeId).length, 1);

const buckyballFaces = createBuckyballSphereFaceGraph();
assert.equal(buckyballFaces.faceCount, 32);
assert.equal(
    buckyballFaces.adjacency.reduce((sum, neighbors) => sum + neighbors.length, 0) / 2,
    90,
    'Buckyball face graph must use its 90 shared face edges.'
);
assert.ok(buckyballFaces.adjacency.every((neighbors) => neighbors.length >= 5 && neighbors.length <= 6));
const faceDistance = (from, to) => {
    const queue = [from];
    const distances = new Map([[from, 0]]);
    for (const current of queue) {
        if (current === to) return distances.get(current);
        for (const neighbor of buckyballFaces.adjacency[current]) {
            if (distances.has(neighbor)) continue;
            distances.set(neighbor, distances.get(current) + 1);
            queue.push(neighbor);
        }
    }
    return Infinity;
};
for (const capIndices of [[0, 12, 27, 29], [3, 14, 25, 22]]) {
    for (let a = 0; a < capIndices.length; a += 1) {
        for (let b = a + 1; b < capIndices.length; b += 1) {
            assert.ok(faceDistance(capIndices[a], capIndices[b]) >= 3, 'Buckyball camps must remain separated.');
        }
    }
}

const buckyballHex = new HexGame({
    dimension: 3,
    size: [30, 3, 1],
    topology: 'sphere',
    lattice: 'buckyball'
});
const buckyballCoordinates = buckyballHex.topology.coordinates();
assert.equal(buckyballCoordinates.length, 32);
assert.ok(buckyballCoordinates.every((coord) => {
    const degree = buckyballHex.topology.neighbors(coord).length;
    return degree >= 5 && degree <= 6;
}));

assert.equal(createRenderPolicy({ visibleSites: 5001 }).showLabels, false);
assert.equal(createRenderPolicy({ visibleEdges: 20001 }).showEdges, false);
const measuredRender = measureRender('verification', () => 'ok', { visibleSites: 3, visibleEdges: 2 });
assert.equal(measuredRender.value, 'ok');

console.log('Board stability layer verification passed.');
