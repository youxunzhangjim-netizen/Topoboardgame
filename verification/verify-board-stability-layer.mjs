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

console.log('Board stability layer verification passed.');
