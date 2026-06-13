import assert from 'node:assert/strict';
import {
    KLEIN_BOARD_HEIGHT,
    KLEIN_BOARD_WIDTH,
    KLEIN_CENTRAL_FILES,
    KLEIN_KING_ROW_TYPES,
    createKleinInitialPieces,
    createKleinWhiteInitialPieces,
    kleinIsPromotionSquare,
    kleinPromotionZoneFor,
    normalizeKlein
} from '../js/KleinBottleConfig.js';

const key = ({ x, y }) => `${x},${y}`;
const pieceKey = ({ color, type, x, y }) => `${color}:${type}:${x},${y}`;

assert.equal(KLEIN_BOARD_WIDTH, 12, 'Klein width should be 12');
assert.equal(KLEIN_BOARD_HEIGHT, 16, 'Klein height should be 16');

assert.deepEqual(
    pick(normalizeKlein(12, 3)),
    { x: 0, y: 3 },
    'horizontal wrap should be normal'
);
assert.deepEqual(
    pick(normalizeKlein(-1, 3)),
    { x: 11, y: 3 },
    'negative horizontal wrap should be normal'
);
assert.deepEqual(
    pick(normalizeKlein(2, 16)),
    { x: 9, y: 0 },
    'crossing the top should flip x and enter the bottom'
);
assert.deepEqual(
    pick(normalizeKlein(2, -1)),
    { x: 9, y: 15 },
    'crossing the bottom should flip x and enter the top'
);
assert.deepEqual(
    pick(normalizeKlein(2 + KLEIN_BOARD_WIDTH * 3, 16 * 3 + 5)),
    { x: 9, y: 5 },
    'large positive offsets should preserve odd vertical flip parity'
);
assert.deepEqual(
    pick(normalizeKlein(-14, -33)),
    { x: 1, y: 15 },
    'large negative offsets should normalize with repeated flips'
);
assert.deepEqual(
    pick(normalizeKlein(4, 32)),
    { x: 4, y: 0 },
    'two vertical crossings should not flip x'
);

const white = createKleinWhiteInitialPieces();
const whiteMap = new Map(white.map((piece) => [key(piece), piece]));
for (let x = 1; x <= 10; x++) {
    assert.equal(whiteMap.get(`${x},2`)?.type, 'P', `white pawn at (${x},2)`);
    assert.equal(whiteMap.get(`${x},4`)?.type, 'P', `white pawn at (${x},4)`);
}
assert.equal(whiteMap.get('1,3')?.type, 'P', 'white side pawn at (1,3)');
assert.equal(whiteMap.get('10,3')?.type, 'P', 'white side pawn at (10,3)');
for (const [index, x] of KLEIN_CENTRAL_FILES.entries()) {
    assert.equal(
        whiteMap.get(`${x},3`)?.type,
        KLEIN_KING_ROW_TYPES[index],
        `white king-row type at (${x},3)`
    );
}
assert.equal(whiteMap.has('0,3'), false, 'x=0 should be empty in the white setup');
assert.equal(whiteMap.has('11,3'), false, 'x=11 should be empty in the white setup');

const allPieces = createKleinInitialPieces();
const black = allPieces.filter((piece) => piece.color === 'black');
const blackKeys = new Set(black.map(pieceKey));
assert.equal(black.length, white.length, 'black should be generated from every white piece');

for (const piece of white) {
    const mirror = normalizeKlein(piece.x, piece.y + KLEIN_BOARD_HEIGHT / 2);
    assert.ok(
        blackKeys.has(pieceKey({ color: 'black', type: piece.type, x: mirror.x, y: mirror.y })),
        `missing black half-translation for ${piece.type} at (${piece.x},${piece.y})`
    );
}

assert.deepEqual(
    kleinPromotionZoneFor('white').map(key).sort(),
    KLEIN_CENTRAL_FILES.map((x) => `${x},11`).sort(),
    'white promotes only on black original central king row'
);
assert.deepEqual(
    kleinPromotionZoneFor('black').map(key).sort(),
    KLEIN_CENTRAL_FILES.map((x) => `${x},3`).sort(),
    'black promotes only on white original central king row'
);
for (const x of [0, 1, 10, 11]) {
    assert.equal(kleinIsPromotionSquare('white', x, 11), false, `white should not promote at side file x=${x}`);
    assert.equal(kleinIsPromotionSquare('black', x, 3), false, `black should not promote at side file x=${x}`);
}
assert.equal(kleinIsPromotionSquare('white', 2, 12), false, 'white should not promote by crossing a seam');
assert.equal(kleinIsPromotionSquare('black', 2, 2), false, 'black should not promote by crossing a seam');

assert.deepEqual(
    pick(normalizeKlein(0 - 1, 10 + 1)),
    { x: 11, y: 11 },
    'white pawn left diagonal should normalize horizontally'
);
assert.deepEqual(
    pick(normalizeKlein(11 + 1, 10 - 1)),
    { x: 0, y: 9 },
    'black pawn right diagonal should normalize horizontally'
);

function rayTargets(x, y, dx, dy) {
    const targets = [];
    const seen = new Set();
    for (let step = 1; step <= KLEIN_BOARD_WIDTH * KLEIN_BOARD_HEIGHT; step++) {
        const target = normalizeKlein(x + dx * step, y + dy * step);
        const targetKey = key(target);
        if (seen.has(targetKey)) break;
        seen.add(targetKey);
        targets.push(target);
    }
    return targets;
}

const vertical = rayTargets(2, 15, 0, 1);
assert.deepEqual(pick(vertical[0]), { x: 9, y: 0 }, 'vertical ray should flip x over the seam');
assert.ok(vertical.length <= KLEIN_BOARD_WIDTH * KLEIN_BOARD_HEIGHT, 'ray should be safety bounded');
assert.equal(new Set(vertical.map(key)).size, vertical.length, 'ray targets should be unique before cycle stop');

function pick(coord) {
    return { x: coord.x, y: coord.y };
}

console.log('Klein bottle chess verification passed.');
