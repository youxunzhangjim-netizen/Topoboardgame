export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 8;
export const MAIN_ROW = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
export const PROMOTION_TYPES = ['Q', 'R', 'B', 'N'];
export const HOME_ROWS = { white: 6, black: 2 };
export const FRONT_PAWN_ROWS = { white: 5, black: 3 };
export const BACK_PAWN_ROWS = { white: 7, black: 1 };
export const PAWN_DIR = { white: -1, black: 1 };

export function createPiece(color, type, hasMoved = false) {
    return {
        color,
        type,
        display: color === 'white' ? type : type.toLowerCase(),
        hasMoved
    };
}

export class BoardSetup {
    static createEmptyBoard() {
        return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
    }

    static createInitialBoard() {
        const board = BoardSetup.createEmptyBoard();

        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[HOME_ROWS.white][x] = createPiece('white', MAIN_ROW[x]);
            board[FRONT_PAWN_ROWS.white][x] = createPiece('white', 'P');
            board[BACK_PAWN_ROWS.white][x] = createPiece('white', 'P');

            board[HOME_ROWS.black][x] = createPiece('black', MAIN_ROW[x]);
            board[FRONT_PAWN_ROWS.black][x] = createPiece('black', 'P');
            board[BACK_PAWN_ROWS.black][x] = createPiece('black', 'P');
        }

        return board;
    }
}
