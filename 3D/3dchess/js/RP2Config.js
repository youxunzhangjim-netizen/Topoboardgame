export const RP2_BOARD_WIDTH = 12;
export const RP2_BOARD_HEIGHT = 14;
export const RP2_KING_ROW_TYPES = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
export const RP2_WHITE_HOME_ROW = 3;
export const RP2_HOME_ROWS = Object.freeze({
    white: RP2_WHITE_HOME_ROW,
    black: RP2_BOARD_HEIGHT - 1 - RP2_WHITE_HOME_ROW
});
export const RP2_PAWN_DIR = Object.freeze({ white: 1, black: -1 });

export function rp2CentralStartX(width = RP2_BOARD_WIDTH) {
    const start = Math.floor((width - RP2_KING_ROW_TYPES.length) / 2);
    if (start < 1) {
        throw new Error(`RP2 board width ${width} is too small for central pieces plus support pawns`);
    }
    return start;
}

export function rp2CentralFiles(width = RP2_BOARD_WIDTH) {
    const start = rp2CentralStartX(width);
    return RP2_KING_ROW_TYPES.map((_, index) => start + index);
}

export function rp2SideSupportFiles(width = RP2_BOARD_WIDTH) {
    const central = rp2CentralFiles(width);
    return [central[0] - 1, central[central.length - 1] + 1];
}

export function rp2PawnFiles(width = RP2_BOARD_WIDTH) {
    const [first, last] = rp2SideSupportFiles(width);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

export function rp2Antipode(x, y, width = RP2_BOARD_WIDTH, height = RP2_BOARD_HEIGHT) {
    return {
        x: width - 1 - x,
        y: height - 1 - y
    };
}
