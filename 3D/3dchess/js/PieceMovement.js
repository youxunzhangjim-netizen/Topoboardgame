export class PieceMovement {
    constructor(game) {
        this.game = game;
    }

    getLegalMoves(x, y) {
        return this.game.getLegalMoves(x, y);
    }
}
