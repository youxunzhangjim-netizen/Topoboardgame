import assert from 'node:assert/strict';
import {
    BOARD_SPEC_SCHEMA,
    createBoardSpec,
    exportBoardSpec,
    getNeighbors,
    importBoardSpec
} from '../js/shared/BoardSpec.js';
import { validateBoardSpec } from '../js/shared/BoardSpecValidator.js';

function squareBoardSpec() {
    return createBoardSpec({
        id: 'verify.square.2x2',
        nameEn: 'Verification Square',
        nameZh: '驗證方格',
        dimension: 2,
        playableKind: 'vertex',
        space: { id: 'r2', nameEn: 'Euclidean Plane R2', nameZh: '歐氏平面 R2' },
        lattice: { id: 'square', nameEn: 'Square Lattice', nameZh: '方格晶格' },
        boundary: { id: 'hard', nameEn: 'Hard Boundary', nameZh: '硬邊界' },
        sites: [
            { id: '0,0', coord: { x: 0, y: 0 }, draw: { x: 0, y: 0 } },
            { id: '1,0', coord: { x: 1, y: 0 }, draw: { x: 1, y: 0 } },
            { id: '0,1', coord: { x: 0, y: 1 }, draw: { x: 0, y: 1 } },
            { id: '1,1', coord: { x: 1, y: 1 }, draw: { x: 1, y: 1 } }
        ],
        edges: [
            { source: '0,0', target: '1,0', dir: 'x' },
            { source: '0,1', target: '1,1', dir: 'x' },
            { source: '0,0', target: '0,1', dir: 'y' },
            { source: '1,0', target: '1,1', dir: 'y' }
        ],
        directions: ['x', 'y'],
        targetZones: { left: ['0,0', '0,1'], right: ['1,0', '1,1'] }
    });
}

function torusBoardSpec() {
    return createBoardSpec({
        id: 'verify.torus.cycle',
        nameEn: 'Verification Torus Cycle',
        nameZh: '驗證環面週期圖',
        dimension: 2,
        playableKind: 'vertex',
        space: { id: 't2', nameEn: 'Torus T2', nameZh: '環面 T2' },
        lattice: { id: 'square', nameEn: 'Square Lattice', nameZh: '方格晶格' },
        boundary: {
            id: 'periodic',
            nameEn: 'Periodic Gluing',
            nameZh: '週期黏合',
            gluing: { x: 'periodic', y: 'periodic' }
        },
        sites: [
            { id: 'a', coord: { x: 0, y: 0 } },
            { id: 'b', coord: { x: 1, y: 0 } },
            { id: 'c', coord: { x: 1, y: 1 } },
            { id: 'd', coord: { x: 0, y: 1 } }
        ],
        edges: [
            { source: 'a', target: 'b', dir: 'x' },
            { source: 'b', target: 'c', dir: 'y' },
            { source: 'c', target: 'd', dir: 'x' },
            { source: 'd', target: 'a', dir: 'y' }
        ],
        directions: ['x', 'y']
    });
}

const square = squareBoardSpec();
assert.equal(square.schema, BOARD_SPEC_SCHEMA);
assert.equal(validateBoardSpec(square, {
    expectedSiteCount: 4,
    expectedEdgeCount: 4,
    degreeRange: [2, 2],
    directionsRequired: true,
    targetZonesRequired: true,
    drawPositionsRequired: true
}).ok, true);
assert.deepEqual(getNeighbors(square, '0,0').sort(), ['0,1', '1,0']);

const torus = torusBoardSpec();
assert.equal(validateBoardSpec(torus, {
    expectedSiteCount: 4,
    expectedEdgeCount: 4,
    degreeRange: [2, 2],
    directionsRequired: true
}).ok, true);

const duplicateEdge = createBoardSpec({
    ...square,
    id: 'verify.square.duplicate-edge',
    edges: [...square.edges, { source: '1,0', target: '0,0' }]
});
const duplicateResult = validateBoardSpec(duplicateEdge);
assert.equal(duplicateResult.ok, false);
assert.ok(duplicateResult.errors.some((error) => /Duplicate undirected edge/i.test(error)));

const missingEndpoint = createBoardSpec({
    ...square,
    id: 'verify.square.missing-endpoint',
    edges: [...square.edges, { source: '0,0', target: 'missing' }]
});
const missingResult = validateBoardSpec(missingEndpoint);
assert.equal(missingResult.ok, false);
assert.ok(missingResult.errors.some((error) => /missing target/i.test(error)));

const roundTrip = importBoardSpec(exportBoardSpec(torus));
assert.equal(roundTrip.id, torus.id);
assert.equal(roundTrip.sites.length, torus.sites.length);
assert.equal(roundTrip.edges.length, torus.edges.length);
assert.equal(validateBoardSpec(roundTrip).ok, true);

console.log('BoardSpec infrastructure verification passed.');
