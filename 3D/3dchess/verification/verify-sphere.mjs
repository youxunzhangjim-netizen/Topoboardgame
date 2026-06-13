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

assert.equal(SPHERE_BOARD_WIDTH, 16, 'sphere width should be 16 longitudes');
assert.equal(SPHERE_BOARD_HEIGHT, 16, 'sphere height should be 16 latitude rows');

for (let x = 0; x < SPHERE_BOARD_WIDTH; x++) {
    assert.equal(sphereIsPlayable(x, 0), false, `north polar cap should be non-playable at x=${x}`);
    assert.equal(sphereIsPlayable(x, 15), false, `south polar cap should be non-playable at x=${x}`);
    assert.equal(sphereIsPlayable(x, 1), true, `row y=1 should be playable at x=${x}`);
    assert.equal(sphereIsPlayable(x, 14), true, `row y=14 should be playable at x=${x}`);
}

const white = createSphereWhiteInitialPieces();
const whiteMap = new Map(white.map((piece) => [key(piece), piece]));
const centralFiles = sphereCentralFiles();

for (const [index, x] of centralFiles.entries()) {
    assert.equal(whiteMap.get(key({ x, y: 3 }))?.type, SPHERE_KING_ROW_TYPES[index], `white king-row type at x=${x}`);
    assert.equal(whiteMap.get(key({ x, y: 2 }))?.type, 'P', `white pawn at (${x},2)`);
    assert.equal(whiteMap.get(key({ x, y: 4 }))?.type, 'P', `white pawn at (${x},4)`);
}
assert.equal(whiteMap.get('3,3')?.type, 'P', 'white side-support pawn at (3,3)');
assert.equal(whiteMap.get('12,3')?.type, 'P', 'white side-support pawn at (12,3)');
assert.equal(whiteMap.get('3,2')?.type, 'P', 'white upper-left corner-support pawn at (3,2)');
assert.equal(whiteMap.get('12,2')?.type, 'P', 'white upper-right corner-support pawn at (12,2)');
assert.equal(whiteMap.get('3,4')?.type, 'P', 'white lower-left corner-support pawn at (3,4)');
assert.equal(whiteMap.get('12,4')?.type, 'P', 'white lower-right corner-support pawn at (12,4)');
assert.equal(whiteMap.has('0,3'), false, 'x=0 should be empty in white setup');
assert.equal(whiteMap.has('15,3'), false, 'x=15 should be empty in white setup');

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
assert.deepEqual([...blackZone].sort(), centralFiles.map((x) => `${x},3`).sort(), 'black promotion zone should be white central king row');
assert.deepEqual([...whiteZone].sort(), centralFiles.map((x) => key(mirrorSphere(x, 3))).sort(), 'white promotion zone should be mirrored black central king row');
assert.equal(sphereIsPromotionSquare('black', 3, 3), false, 'black should not promote on white side-support file');
assert.equal(sphereIsPromotionSquare('black', 12, 3), false, 'black should not promote on white side-support file');
assert.equal(sphereIsPromotionSquare('white', 4, 12), false, 'white should not promote on black side-support file');
assert.equal(sphereIsPromotionSquare('white', 11, 12), false, 'white should not promote on black side-support file');
assert.equal(sphereIsPromotionSquare('white', 0, 15), false, 'polar rows should not promote');

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
assert.equal(wrappedHorizontal[0].x, 0, 'horizontal ray should wrap from x=15 to x=0');
assert.equal(wrappedHorizontal[0].y, 5, 'horizontal wrap should keep the same latitude row');
const northCrossing = sphereResolveTarget(6, 0);
assert.deepEqual(
    { x: northCrossing.x, y: northCrossing.y },
    { x: 14, y: 1 },
    'north-pole crossing should emerge on the antipodal longitude'
);
const southCrossing = sphereResolveTarget(6, 15);
assert.deepEqual(
    { x: southCrossing.x, y: southCrossing.y },
    { x: 14, y: 14 },
    'south-pole crossing should emerge on the antipodal longitude'
);
assert.equal(northCrossing.crossedPole, true, 'north-pole target should report a pole crossing');
assert.equal(southCrossing.crossedPole, true, 'south-pole target should report a pole crossing');

console.log('Sphere chess verification passed.');
