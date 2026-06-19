export const SPHERE_BOARD_WIDTH = 16;
export const SPHERE_BOARD_HEIGHT = 16;
export const SPHERE_PLAYABLE_MIN_Y = 1;
export const SPHERE_PLAYABLE_MAX_Y = SPHERE_BOARD_HEIGHT - 2;
export const SPHERE_KING_ROW_TYPES = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
export const SPHERE_WHITE_HOME_ROW = 3;
export const SPHERE_HOME_ROWS = Object.freeze({
    white: SPHERE_WHITE_HOME_ROW,
    black: SPHERE_BOARD_HEIGHT - 1 - SPHERE_WHITE_HOME_ROW
});
export const SPHERE_PAWN_DIR = Object.freeze({ white: 1, black: -1 });

export function sphereWrapX(x, width = SPHERE_BOARD_WIDTH) {
    return ((x % width) + width) % width;
}

export function mirrorSphere(x, y, width = SPHERE_BOARD_WIDTH, height = SPHERE_BOARD_HEIGHT) {
    return {
        x: sphereWrapX(x + width / 2, width),
        y: height - 1 - y
    };
}

export function sphereCentralStartX(width = SPHERE_BOARD_WIDTH) {
    const start = Math.floor((width - SPHERE_KING_ROW_TYPES.length) / 2);
    if (start < 1) {
        throw new Error(`Cylinder board width ${width} is too small for central pieces plus support pawns`);
    }
    return start;
}

export function sphereCentralFiles(width = SPHERE_BOARD_WIDTH) {
    const start = sphereCentralStartX(width);
    return SPHERE_KING_ROW_TYPES.map((_, index) => start + index);
}

export function sphereSideSupportFiles(width = SPHERE_BOARD_WIDTH) {
    const central = sphereCentralFiles(width);
    return [central[0] - 1, central[central.length - 1] + 1];
}

export function sphereIsPlayable(x, y, width = SPHERE_BOARD_WIDTH, height = SPHERE_BOARD_HEIGHT) {
    return Number.isInteger(x)
        && Number.isInteger(y)
        && x >= 0
        && x < width
        && y >= SPHERE_PLAYABLE_MIN_Y
        && y <= height - 2;
}

export function sphereResolveTarget(x, y, width = SPHERE_BOARD_WIDTH, height = SPHERE_BOARD_HEIGHT) {
    const nx = sphereWrapX(x, width);
    return {
        x: nx,
        y,
        sheet: 0,
        poleCrossings: 0,
        crossedPole: false,
        valid: sphereIsPlayable(nx, y, width, height)
    };
}

export function createSphereWhiteInitialPieces(width = SPHERE_BOARD_WIDTH) {
    const pieces = [];
    const homeRow = SPHERE_WHITE_HOME_ROW;
    const centralFiles = sphereCentralFiles(width);

    for (const y of [homeRow - 1, homeRow + 1]) {
        for (const x of centralFiles) {
            pieces.push({ color: 'white', type: 'P', x, y });
        }
    }

    for (const x of sphereSideSupportFiles(width)) {
        pieces.push({ color: 'white', type: 'P', x, y: homeRow });
        pieces.push({ color: 'white', type: 'P', x, y: homeRow - 1 });
        pieces.push({ color: 'white', type: 'P', x, y: homeRow + 1 });
    }

    centralFiles.forEach((x, index) => {
        pieces.push({ color: 'white', type: SPHERE_KING_ROW_TYPES[index], x, y: homeRow });
    });

    return pieces;
}

export function createSphereInitialPieces(width = SPHERE_BOARD_WIDTH, height = SPHERE_BOARD_HEIGHT) {
    const whitePieces = createSphereWhiteInitialPieces(width);
    const blackPieces = whitePieces.map((piece) => {
        const mirror = mirrorSphere(piece.x, piece.y, width, height);
        return { color: 'black', type: piece.type, x: mirror.x, y: mirror.y };
    });
    return [...whitePieces, ...blackPieces];
}

export function spherePromotionZoneFor(color, width = SPHERE_BOARD_WIDTH, height = SPHERE_BOARD_HEIGHT) {
    const whiteKingRow = sphereCentralFiles(width).map((x) => ({ x, y: SPHERE_WHITE_HOME_ROW }));
    if (color === 'black') return whiteKingRow;
    return whiteKingRow.map(({ x, y }) => mirrorSphere(x, y, width, height));
}

export function sphereIsPromotionSquare(color, x, y, width = SPHERE_BOARD_WIDTH, height = SPHERE_BOARD_HEIGHT) {
    const nx = sphereWrapX(x, width);
    return spherePromotionZoneFor(color, width, height).some((cell) => cell.x === nx && cell.y === y);
}
