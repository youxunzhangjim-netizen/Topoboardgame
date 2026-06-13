export const KLEIN_TOPOLOGY = 'klein_bottle';
export const KLEIN_BOARD_WIDTH = 12;
export const KLEIN_BOARD_HEIGHT = 16;
export const KLEIN_WHITE_HOME_ROW = 3;
export const KLEIN_KING_ROW_TYPES = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
export const KLEIN_CENTRAL_FILES = Object.freeze(
    KLEIN_KING_ROW_TYPES.map((_, index) => index + 2)
);
export const KLEIN_HOME_ROWS = Object.freeze({
    white: KLEIN_WHITE_HOME_ROW,
    black: KLEIN_WHITE_HOME_ROW + KLEIN_BOARD_HEIGHT / 2
});
export const KLEIN_PAWN_DIR = Object.freeze({ white: 1, black: -1 });

function modulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

export function normalizeKlein(
    x,
    y,
    width = KLEIN_BOARD_WIDTH,
    height = KLEIN_BOARD_HEIGHT
) {
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
        throw new RangeError('Klein bottle width and height must be positive integers.');
    }

    const verticalCrossings = Math.floor(y / height);
    const normalizedY = modulo(y, height);
    let normalizedX = modulo(x, width);
    if (modulo(verticalCrossings, 2) === 1) {
        normalizedX = width - 1 - normalizedX;
    }

    return {
        x: normalizedX,
        y: normalizedY,
        sheet: 0,
        verticalCrossings,
        flipped: modulo(verticalCrossings, 2) === 1,
        valid: true
    };
}

export function createKleinWhiteInitialPieces() {
    const pieces = [];

    for (const y of [2, 4]) {
        for (let x = 1; x <= 10; x++) {
            pieces.push({ color: 'white', type: 'P', x, y });
        }
    }

    pieces.push({ color: 'white', type: 'P', x: 1, y: KLEIN_WHITE_HOME_ROW });
    pieces.push({ color: 'white', type: 'P', x: 10, y: KLEIN_WHITE_HOME_ROW });
    KLEIN_CENTRAL_FILES.forEach((x, index) => {
        pieces.push({
            color: 'white',
            type: KLEIN_KING_ROW_TYPES[index],
            x,
            y: KLEIN_WHITE_HOME_ROW
        });
    });

    return pieces;
}

export function createKleinInitialPieces(
    width = KLEIN_BOARD_WIDTH,
    height = KLEIN_BOARD_HEIGHT
) {
    const whitePieces = createKleinWhiteInitialPieces();
    const blackPieces = whitePieces.map((piece) => {
        const target = normalizeKlein(piece.x, piece.y + height / 2, width, height);
        return {
            color: 'black',
            type: piece.type,
            x: target.x,
            y: target.y
        };
    });
    return [...whitePieces, ...blackPieces];
}

export function kleinPromotionZoneFor(color) {
    const y = color === 'white' ? KLEIN_HOME_ROWS.black : KLEIN_HOME_ROWS.white;
    return KLEIN_CENTRAL_FILES.map((x) => ({ x, y }));
}

export function kleinIsPromotionSquare(color, x, y) {
    return kleinPromotionZoneFor(color).some((cell) => cell.x === x && cell.y === y);
}
