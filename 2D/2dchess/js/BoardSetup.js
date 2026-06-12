export const BOARD_THEMES = [
    { light: '#f1f5f9', dark: '#334155' },
    { light: '#e9d8d0', dark: '#5b4b43' },
    { light: '#dde7e3', dark: '#35524a' },
    { light: '#d9e2ec', dark: '#334155' }
];

export const PIECE_TYPES = ['K', 'Q', 'R', 'B', 'N', 'P'];
export const PROMOTION_TYPES = ['Q', 'R', 'B', 'N'];
export const MAIN_ROW = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

export const PIECE_GLYPHS = {
    white: {
        K: '\u2654',
        Q: '\u2655',
        R: '\u2656',
        B: '\u2657',
        N: '\u2658',
        P: '\u2659'
    },
    black: {
        K: '\u265A',
        Q: '\u265B',
        R: '\u265C',
        B: '\u265D',
        N: '\u265E',
        P: '\u265F'
    }
};

export function createPiece(color, type, hasMoved = false) {
    return {
        color,
        type,
        display: PIECE_GLYPHS[color][type],
        hasMoved
    };
}

export class BoardSetup {
    static createInitialBoard() {
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));

        for (let col = 0; col < 8; col++) {
            board[0][col] = createPiece('black', MAIN_ROW[col]);
            board[1][col] = createPiece('black', 'P');
            board[6][col] = createPiece('white', 'P');
            board[7][col] = createPiece('white', MAIN_ROW[col]);
        }

        return board;
    }
}
