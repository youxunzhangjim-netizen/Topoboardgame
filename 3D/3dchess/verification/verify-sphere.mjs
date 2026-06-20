import assert from 'node:assert/strict';
import {
    SPHERE_BOARD_HEIGHT,
    SPHERE_BOARD_WIDTH,
    SPHERE_KING_ROW_TYPES,
    createSphereInitialPieces,
    createSphereWhiteInitialPieces,
    mirrorSphere,
    sphereCentralFiles,
    sphereIsPlayable,
    sphereIsPromotionSquare,
    spherePromotionZoneFor,
    sphereResolveTarget
} from '../js/SphereConfig.js';

const key = ({ x, y }) => `${x},${y}`;
const pieceKey = ({ color, type, x, y }) => `${color}:${type}:${x},${y}`;

assert.equal(SPHERE_BOARD_WIDTH, 8, 'cylinder chess should use the standard 8 files');
assert.equal(SPHERE_BOARD_HEIGHT, 8, 'cylinder chess should use the standard 8 ranks');

for (let x = 0; x < SPHERE_BOARD_WIDTH; x++) {
    assert.equal(sphereIsPlayable(x, 0), true, `home rank should be playable at x=${x}`);
    assert.equal(sphereIsPlayable(x, 7), true, `back rank should be playable at x=${x}`);
    assert.equal(sphereIsPlayable(x, -1), false, `top cap should stay open at x=${x}`);
    assert.equal(sphereIsPlayable(x, 8), false, `bottom cap should stay open at x=${x}`);
}

const white = createSphereWhiteInitialPieces();
const whiteMap = new Map(white.map((piece) => [key(piece), piece]));
const centralFiles = sphereCentralFiles();

for (const [index, x] of centralFiles.entries()) {
    assert.equal(whiteMap.get(key({ x, y: 0 }))?.type, SPHERE_KING_ROW_TYPES[index], `white king-row type at x=${x}`);
    assert.equal(whiteMap.get(key({ x, y: 1 }))?.type, 'P', `white pawn at (${x},1)`);
}
assert.equal(white.length, 16, 'white should start with the normal 16 chess pieces');

const allPieces = createSphereInitialPieces();
const black = allPieces.filter((piece) => piece.color === 'black');
const blackKeys = new Set(black.map(pieceKey));
assert.equal(black.length, white.length, 'black should be generated from every white piece');

for (const piece of white) {
    const mirror = mirrorSphere(piece.x, piece.y);
    assert.ok(
        blackKeys.has(pieceKey({ color: 'black', type: piece.type, x: mirror.x, y: mirror.y })),
        `missing black mirror for ${piece.type} at (${piece.x},${piece.y})`
    );
}

const whiteZone = new Set(spherePromotionZoneFor('white').map(key));
const blackZone = new Set(spherePromotionZoneFor('black').map(key));
assert.deepEqual([...blackZone].sort(), centralFiles.map((x) => `${x},0`).sort(), 'black promotion zone should be white back rank');
assert.deepEqual([...whiteZone].sort(), centralFiles.map((x) => key(mirrorSphere(x, 0))).sort(), 'white promotion zone should be black back rank');
assert.equal(sphereIsPromotionSquare('black', 0, 0), true, 'black promotes on the white back rank');
assert.equal(sphereIsPromotionSquare('white', 7, 7), true, 'white promotes on the black back rank');
assert.equal(sphereIsPromotionSquare('white', 0, 8), false, 'open cap beyond the board should not promote');

function rayTargets(x, y, dx, dy) {
    const targets = [];
    let cx = x;
    let cy = y;
    for (let step = 0; step < SPHERE_BOARD_WIDTH * SPHERE_BOARD_HEIGHT * 2; step++) {
        const target = sphereResolveTarget(cx + dx, cy + dy);
        if (!target.valid) break;
        if (target.x === x && target.y === y) break;
        targets.push({ x: target.x, y: target.y });
        cx = target.x;
        cy = target.y;
    }
    return targets;
}

const wrappedHorizontal = rayTargets(15, 5, 1, 0);
assert.equal(wrappedHorizontal[0].x, 0, 'horizontal ray should wrap around the cylinder');
assert.equal(wrappedHorizontal[0].y, 5, 'horizontal wrap should keep the same latitude row');
assert.equal(sphereResolveTarget(6, -1).valid, false, 'moving past the top cap should be illegal');
assert.equal(sphereResolveTarget(6, 8).valid, false, 'moving past the bottom cap should be illegal');

console.log('Cylinder chess verification passed.');
