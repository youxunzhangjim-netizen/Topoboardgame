import { createPiece } from '../js/BoardSetup.js';
import {
    PieceMovement,
    createRandomChessBoundaryState,
    randomChessExitKey
} from '../js/PieceMovement.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function makeGame(entries = []) {
    const game = {
        boundaryCondition: 'random',
        currentPlayer: 'white',
        randomBoundaryMap: new Map(entries),
        board: Array.from({ length: 8 }, () => Array(8).fill(null)),
        enPassantTarget: null,
        getPiece(row, col) {
            return this.board[row]?.[col] || null;
        }
    };
    game.board[7][4] = createPiece('white', 'K');
    game.board[0][4] = createPiece('black', 'K');
    return game;
}

{
    const first = createRandomChessBoundaryState('fixed-seed');
    const second = createRandomChessBoundaryState('fixed-seed');
    assert(JSON.stringify(first.entries) === JSON.stringify(second.entries), 'same seed should create the same random boundary map');
    for (const [key, target] of first.entries) {
        assert(target[0] >= 0 && target[0] < 8 && target[1] >= 0 && target[1] < 8, 'random target must stay on board');
        assert(target[0] === 0 || target[0] === 7 || target[1] === 0 || target[1] === 7, 'random target must be a boundary square');
        const [, direction] = key.split(':');
        assert(direction === '0,-1' || direction === '0,1', '2D Chess RBC should only define left/right exits');
    }
    assert(first.entries.length === 16, '2D Chess RBC should map exactly 8 left exits and 8 right exits');
}

{
    const key = randomChessExitKey(0, 0, 0, -1);
    const game = makeGame([[key, [7, 0]]]);
    game.board[0][0] = createPiece('white', 'R');
    game.board[6][0] = createPiece('black', 'N');
    const moves = new PieceMovement(game).getLegalMoves(0, 0);
    assert(moves.some((move) => move.r === 7 && move.c === 0 && !move.capture), 'rook should enter the mapped left/right random boundary square');
    assert(moves.some((move) => move.r === 6 && move.c === 0 && move.capture), 'rook should continue ray-walking after a left/right random boundary map');
}

{
    const topExitKey = randomChessExitKey(0, 0, -1, 0);
    const game = makeGame([[topExitKey, [7, 7]]]);
    game.board[0][0] = createPiece('white', 'R');
    const moves = new PieceMovement(game).getLegalMoves(0, 0);
    assert(!moves.some((move) => move.r === 7 && move.c === 7), 'top/bottom exits must not use RBC maps in 2D Chess');
}

{
    const key = randomChessExitKey(0, 0, -2, -1);
    const game = makeGame([[key, [7, 7]]]);
    game.board[0][0] = createPiece('white', 'N');
    const moves = new PieceMovement(game).getLegalMoves(0, 0);
    assert(moves.some((move) => move.r === 7 && move.c === 7), 'knight should use the static random boundary map only when the exit includes left/right crossing');
}

{
    const key = randomChessExitKey(0, 0, -1, -1);
    const game = makeGame([[key, [7, 7]]]);
    game.board[0][0] = createPiece('white', 'P');
    game.board[7][7] = createPiece('black', 'N');
    const moves = new PieceMovement(game).getLegalMoves(0, 0);
    assert(moves.some((move) => move.r === 7 && move.c === 7 && move.capture), 'pawn diagonal capture should use the random boundary map only when crossing left/right');
}

console.log('Random-boundary chess checks passed.');
