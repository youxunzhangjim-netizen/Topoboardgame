import assert from 'node:assert/strict';
import { BoardSetup } from '../js/BoardSetup.js';
import {
    createAnalysisState,
    getAllLegalMoves,
    validateMoveStillLegal
} from '../js/robot/ChessRobotAdapter.js';
import { robotPromotionForMove } from '../js/robot/ChessRobotController.js';

const game = {
    board: BoardSetup.createInitialBoard(),
    currentPlayer: 'white',
    boundaryCondition: 'forbidden',
    randomBoundarySeed: '',
    randomBoundaryEntries: () => [],
    enPassantTarget: null,
    halfMoveClock: 0,
    positionHistory: [],
    gameOver: false,
    getPiece(row, col) {
        return this.board[row]?.[col] || null;
    }
};

const state = createAnalysisState(game);
const firstPawnMove = getAllLegalMoves(state, 'white')
    .find((move) => move.piece?.type === 'P' && move.from.r === 6 && move.to.r === 5);
assert.ok(firstPawnMove, 'initial white pawn has a normal one-step move');
assert.equal(firstPawnMove.promotion, null, 'normal pawn move is not a promotion');

const liveMove = validateMoveStillLegal(game, firstPawnMove);
assert.ok(liveMove, 'robot adapter revalidates the normal pawn move');
assert.equal(robotPromotionForMove(liveMove), null, 'robot must not force promotion on non-promotion moves');
assert.equal(robotPromotionForMove({ promotion: 'Q' }), 'Q', 'promotion moves keep their selected piece');

console.log('2D chess robot verification passed.');
