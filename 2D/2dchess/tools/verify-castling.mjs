import { createPiece } from '../js/BoardSetup.js';
import { ChessGame } from '../js/ChessGame.js';
import { PieceMovement } from '../js/PieceMovement.js';

function makeGame() {
    const game = {
        boundaryCondition: 'forbidden',
        currentPlayer: 'white',
        board: Array.from({ length: 8 }, () => Array(8).fill(null)),
        getPiece(row, col) {
            return this.board[row]?.[col] || null;
        }
    };
    game.board[7][4] = createPiece('white', 'K');
    game.board[7][0] = createPiece('white', 'R');
    game.board[7][7] = createPiece('white', 'R');
    return game;
}

function castlingMoves(game) {
    return new PieceMovement(game).getLegalMoves(7, 4).filter((move) => move.castling);
}

function hasSide(game, side) {
    return castlingMoves(game).some((move) => move.castling.side === side);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

{
    const game = makeGame();
    assert(hasSide(game, 'kingside'), 'clear kingside castling should be legal');
    assert(hasSide(game, 'queenside'), 'clear queenside castling should be legal');
}

{
    const game = makeGame();
    game.board[7][5] = createPiece('white', 'B');
    assert(!hasSide(game, 'kingside'), 'piece between king and rook should block castling');
}

{
    const game = makeGame();
    game.board[7][4].hasMoved = true;
    assert(castlingMoves(game).length === 0, 'moved king should block all castling');
}

{
    const game = makeGame();
    game.board[7][7].hasMoved = true;
    assert(!hasSide(game, 'kingside'), 'moved target rook should block that castle');
    assert(hasSide(game, 'queenside'), 'unmoved opposite rook should still be eligible');
}

{
    const game = makeGame();
    game.board[5][4] = createPiece('black', 'R');
    assert(castlingMoves(game).length === 0, 'king in check should block castling');
}

{
    const game = makeGame();
    game.board[5][5] = createPiece('black', 'R');
    assert(!hasSide(game, 'kingside'), 'attacked transit square should block kingside castling');
}

{
    const game = makeGame();
    const movement = new PieceMovement(game);
    const legalMoves = movement.getLegalMoves(7, 4);
    const fakeGame = {
        selectedSquare: { r: 7, c: 4 },
        legalMoves,
        currentPlayer: 'white',
        getPiece(row, col) {
            return game.getPiece(row, col);
        }
    };

    const rookClickMove = ChessGame.prototype.getCastlingMoveForRook.call(fakeGame, 7, 7);
    assert(rookClickMove?.castling?.side === 'kingside', 'clicking eligible rook should resolve to castling move');
}

console.log('Castling rule checks passed.');
