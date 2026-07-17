import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    REVERSI_COLORS,
    ReversiGame,
    getReversiDirections,
    normalizeKlein,
    stepReversiRay
} from '../../../js/reversi/ReversiGame.js';

const flat = new ReversiGame({ topology: 'open2d', size: 8 });
assert.equal(flat.counts().black, 2);
assert.equal(flat.counts().white, 2);
assert.ok(flat.legalMoves('black').length > 0);
assert.equal(flat.topology.directionsFor([4, 4]).length, 8, 'Standard square Reversi keeps eight directions.');
assert.equal(getReversiDirections(flat.topology, [4, 4]).length, 8, 'Standard square Reversi exposes eight declared rays through the shared helper.');

const customOdd = new ReversiGame({ topology: 'open2d', size: 9 });
assert.equal(customOdd.topology.width, 9);
assert.equal(customOdd.counts().black, 2);
assert.ok(customOdd.legalMoves('black').length > 0);

const pbc = new ReversiGame({ topology: 'pbc', size: 8 });
assert.deepEqual(pbc.topology.step([0, 0], [-1, 0]), [7, 0]);
assert.deepEqual(pbc.topology.step([0, 0], [0, -1]), [0, 7]);

assert.deepEqual(normalizeKlein(2, -1, 8, 8), [5, 7]);
const klein = new ReversiGame({ topology: 'klein', size: 8 });
assert.deepEqual(klein.topology.step([2, 0], [0, -1]), [5, 7]);
assert.equal(stepReversiRay(klein.topology, [2, 0], [1, -1]), null, 'Klein seam does not permit visual diagonal corner crossing.');

const random = new ReversiGame({ topology: 'random', size: 8, randomBoundarySeed: 'fixed-reversi-map' });
const randomAgain = new ReversiGame({ topology: 'random', size: 8, randomBoundarySeed: 'fixed-reversi-map' });
assert.deepEqual(random.topology.step([0, 3], [-1, 0]), randomAgain.topology.step([0, 3], [-1, 0]));
assert.equal(random.topology.randomBoundaryLinks(2).length, 2);

const honeycomb = new ReversiGame({ topology: 'pbc', lattice: 'honeycomb', size: 8 });
assert.equal(honeycomb.topology.lattice, 'honeycomb');
assert.equal(honeycomb.topology.directions.length, 6, 'Hex-cell Reversi has six axial rays from every cell center.');
assert.equal(getReversiDirections(honeycomb.topology, [4, 4]).length, 6, 'Hex-cell Reversi exposes exactly six edge-sharing directions.');
assert.deepEqual(honeycomb.topology.step([4, 4], [0, 1]), [4, 5]);
assert.deepEqual(honeycomb.topology.step([4, 4], [1, -1]), [4, 3]);
assert.deepEqual(stepReversiRay(honeycomb.topology, [0, 4], [-1, 0]), [7, 4], 'Honeycomb periodic seam works only through an explicitly declared axial ray.');
assert.ok(honeycomb.legalMoves('black').length > 0, 'Hex-cell Reversi opening has legal moves.');

const cornerHoneycomb = new ReversiGame({ topology: 'open2d', lattice: 'honeycomb', size: 8 });
cornerHoneycomb.board = new Map();
cornerHoneycomb.currentPlayer = REVERSI_COLORS.BLACK;
cornerHoneycomb.set([5, 5], { color: REVERSI_COLORS.WHITE });
cornerHoneycomb.set([6, 6], { color: REVERSI_COLORS.BLACK });
assert.deepEqual(
    cornerHoneycomb.previewMove([4, 4], REVERSI_COLORS.BLACK),
    [],
    'Visual corner-touching honeycomb diagonal does not flip.'
);
assert.equal(
    stepReversiRay(cornerHoneycomb.topology, [4, 4], [1, 1]),
    null,
    'Non-declared honeycomb corner direction stops immediately.'
);

const validHoneycomb = new ReversiGame({ topology: 'open2d', lattice: 'honeycomb', size: 8 });
validHoneycomb.board = new Map();
validHoneycomb.currentPlayer = REVERSI_COLORS.BLACK;
validHoneycomb.set([5, 4], { color: REVERSI_COLORS.WHITE });
validHoneycomb.set([6, 4], { color: REVERSI_COLORS.BLACK });
assert.deepEqual(
    validHoneycomb.previewMove([4, 4], REVERSI_COLORS.BLACK),
    [[5, 4]],
    'Valid continuous honeycomb edge-sharing ray flips.'
);

const honeycombGraph = {
    lattice: 'honeycomb_graph',
    totalVertices: 4,
    key: (coord) => String(coord),
    contains: (coord) => ['A', 'B', 'C', 'D'].includes(String(coord)),
    adjacency: {
        A: ['B'],
        B: ['A', 'C'],
        C: ['B', 'D'],
        D: ['C']
    },
    directionsFor(coord) {
        return (this.adjacency[String(coord)] || []).map((target) => ({ kind: 'graph-edge', target }));
    },
    step(coord, direction) {
        return this.directionsFor(coord).some((candidate) => candidate.target === direction.target)
            ? direction.target
            : null;
    }
};
assert.equal(stepReversiRay(honeycombGraph, 'A', { kind: 'graph-edge', target: 'B' }), 'B');
assert.equal(stepReversiRay(honeycombGraph, 'A', { kind: 'graph-edge', target: 'C' }), null, 'Honeycomb graph cannot jump through non-neighbor visual crossings.');

const honeycombGraphRay = {
    lattice: 'honeycomb_graph',
    totalVertices: 4,
    key: (coord) => String(coord),
    contains: (coord) => ['A', 'B', 'C', 'D'].includes(String(coord)),
    adjacency: {
        A: ['B'],
        B: ['A', 'C'],
        C: ['B', 'D'],
        D: ['C']
    },
    directionsFor() {
        return [
            { kind: 'graph-ray', name: 'forward' },
            { kind: 'graph-ray', name: 'backward' }
        ];
    },
    step(coord, direction) {
        const nextByDirection = {
            A: { forward: 'B' },
            B: { forward: 'C', backward: 'A' },
            C: { forward: 'D', backward: 'B' },
            D: { backward: 'C' }
        };
        return nextByDirection[String(coord)]?.[direction.name] || null;
    }
};
const graphRayGame = new ReversiGame({ topology: 'open2d', size: 4 });
graphRayGame.topology = honeycombGraphRay;
graphRayGame.board = new Map([
    ['B', { color: REVERSI_COLORS.WHITE }],
    ['C', { color: REVERSI_COLORS.WHITE }],
    ['D', { color: REVERSI_COLORS.BLACK }]
]);
assert.deepEqual(
    graphRayGame.collectRay('A', { kind: 'graph-ray', name: 'forward' }, REVERSI_COLORS.BLACK),
    ['B', 'C'],
    'A valid continuous honeycomb graph ray flips through graph-adjacent sites only.'
);

const brokenHoneycombGraphRay = {
    ...honeycombGraphRay,
    adjacency: {
        A: ['B'],
        B: ['A'],
        C: ['D'],
        D: ['C']
    },
    step(coord, direction) {
        if (String(coord) === 'A' && direction.name === 'forward') return 'C';
        return honeycombGraphRay.step(coord, direction);
    }
};
assert.equal(
    stepReversiRay(brokenHoneycombGraphRay, 'A', { kind: 'graph-ray', name: 'forward' }),
    null,
    'Honeycomb graph ray stops if the declared ray would skip a missing graph edge.'
);

const noMove = new ReversiGame({ topology: 'open2d', size: 4 });
noMove.board = new Map(noMove.topology.allCoords().map((coord) => [noMove.key(coord), { color: 'black' }]));
noMove.board.set(noMove.key([0, 0]), { color: 'white' });
noMove.currentPlayer = 'white';
const passResult = noMove.pass();
assert.equal(passResult.ok, true);
assert.equal(noMove.gameOver, true, 'Reversi ends immediately when the current player has no legal move.');
assert.equal(noMove.winner, 'black');

const source = readFileSync(new URL('../../../js/reversi/ReversiGame.js', import.meta.url), 'utf8');
assert.equal(/Math\.hypot|squaredDistance|visualDistance/i.test(source), false, 'Reversi engine does not use visual distance for honeycomb flip scanning.');

console.log('2D Reversi verification passed.');
