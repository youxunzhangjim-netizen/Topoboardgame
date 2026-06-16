import { createPiece, PIECE_GLYPHS, PROMOTION_TYPES } from '../BoardSetup.js';
import { PieceMovement } from '../PieceMovement.js';

const SIZE = 8;

export function opponentOf(color) {
    return color === 'white' ? 'black' : 'white';
}

export function clonePiece(piece) {
    if (!piece) return null;
    return createPiece(piece.color, piece.type, Boolean(piece.hasMoved));
}

export function cloneBoard(board) {
    return board.map((row) => row.map((piece) => clonePiece(piece)));
}

export function createAnalysisState(game) {
    return normalizeState({
        board: cloneBoard(game.board),
        currentPlayer: game.currentPlayer,
        boundaryCondition: game.boundaryCondition,
        randomBoundarySeed: game.randomBoundarySeed || '',
        randomBoundaryEntries: typeof game.randomBoundaryEntries === 'function' ? game.randomBoundaryEntries() : [],
        enPassantTarget: game.enPassantTarget ? { ...game.enPassantTarget } : null,
        halfMoveClock: Number(game.halfMoveClock) || 0,
        positionHistory: Array.isArray(game.positionHistory) ? [...game.positionHistory] : [],
        gameOver: Boolean(game.gameOver),
        winner: null,
        draw: false
    });
}

export function normalizeState(state) {
    const randomBoundaryMap = state.randomBoundaryMap instanceof Map
        ? new Map(state.randomBoundaryMap)
        : new Map(Array.isArray(state.randomBoundaryEntries) ? state.randomBoundaryEntries : []);

    return {
        board: cloneBoard(state.board || Array.from({ length: SIZE }, () => Array(SIZE).fill(null))),
        currentPlayer: state.currentPlayer === 'black' ? 'black' : 'white',
        boundaryCondition: ['forbidden', 'open', 'reflection', 'periodic', 'random'].includes(state.boundaryCondition)
            ? state.boundaryCondition
            : 'forbidden',
        randomBoundarySeed: String(state.randomBoundarySeed || ''),
        randomBoundaryMap,
        enPassantTarget: state.enPassantTarget ? { ...state.enPassantTarget } : null,
        halfMoveClock: Number(state.halfMoveClock) || 0,
        positionHistory: Array.isArray(state.positionHistory) ? [...state.positionHistory] : [],
        gameOver: Boolean(state.gameOver),
        winner: state.winner || null,
        draw: Boolean(state.draw)
    };
}

export function cloneState(state) {
    return normalizeState(state);
}

export function makeMovementHost(state, forcedPlayer = state.currentPlayer) {
    return {
        board: state.board,
        currentPlayer: forcedPlayer,
        boundaryCondition: state.boundaryCondition,
        randomBoundaryMap: state.randomBoundaryMap,
        enPassantTarget: state.enPassantTarget,
        getPiece(row, col) {
            return this.board[row]?.[col] || null;
        }
    };
}

export function getPiece(state, row, col) {
    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return null;
    return state.board[row]?.[col] || null;
}

export function getLegalMovesForPiece(state, row, col, player = state.currentPlayer) {
    const piece = getPiece(state, row, col);
    if (!piece || piece.color !== player) return [];
    const host = makeMovementHost(state, player);
    return new PieceMovement(host).getLegalMoves(row, col).map((legal) => decorateMove(state, row, col, legal));
}

export function getAllLegalMoves(state, player = state.currentPlayer) {
    const moves = [];
    for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
            const piece = getPiece(state, r, c);
            if (!piece || piece.color !== player) continue;
            moves.push(...getLegalMovesForPiece(state, r, c, player));
        }
    }
    return moves;
}

export function decorateMove(state, fromRow, fromCol, legal) {
    const piece = getPiece(state, fromRow, fromCol);
    const capturedPiece = legal.enPassant && legal.capturePos
        ? getPiece(state, legal.capturePos.r, legal.capturePos.c)
        : getPiece(state, legal.r, legal.c);
    const promotion = piece?.type === 'P' && isPromotionSquare(piece.color, legal.r)
        ? 'Q'
        : null;
    const move = {
        id: moveId({ r: fromRow, c: fromCol }, { r: legal.r, c: legal.c }, promotion, Boolean(legal.suicide)),
        from: { r: fromRow, c: fromCol },
        to: { r: legal.r, c: legal.c },
        piece: piece ? { color: piece.color, type: piece.type } : null,
        capturedPiece: capturedPiece ? { color: capturedPiece.color, type: capturedPiece.type } : null,
        capture: Boolean(legal.capture || capturedPiece),
        suicide: Boolean(legal.suicide),
        enPassant: Boolean(legal.enPassant),
        capturePos: legal.capturePos ? { ...legal.capturePos } : null,
        pawnDoubleJump: Boolean(legal.pawnDoubleJump),
        castling: legal.castling ? structuredClone(legal.castling) : null,
        promotion,
        label: moveLabel(state, { r: fromRow, c: fromCol }, { r: legal.r, c: legal.c }, piece, capturedPiece, legal, promotion)
    };
    return move;
}

export function applyMoveToState(state, move) {
    const next = cloneState(state);
    if (next.gameOver || next.currentPlayer !== move?.piece?.color) return next;

    const from = move.from;
    const to = move.to;
    const piece = getPiece(next, from.r, from.c);
    if (!piece || piece.color !== next.currentPlayer) return next;

    if (move.suicide) {
        next.board[from.r][from.c] = null;
        piece.hasMoved = true;
        next.halfMoveClock = 0;
        next.enPassantTarget = null;
        const opponent = opponentOf(piece.color);
        if (piece.type === 'K') {
            next.gameOver = true;
            next.winner = opponent;
            next.draw = false;
        } else {
            next.currentPlayer = opponent;
        }
        return finalizeState(next);
    }

    const captured = getPiece(next, to.r, to.c);
    const enPassantCaptured = move.enPassant && move.capturePos
        ? getPiece(next, move.capturePos.r, move.capturePos.c)
        : null;

    next.board[from.r][from.c] = null;
    next.board[to.r][to.c] = piece;
    piece.hasMoved = true;

    if (move.enPassant && move.capturePos) {
        next.board[move.capturePos.r][move.capturePos.c] = null;
    }

    if (move.castling) {
        const rook = getPiece(next, move.castling.rookPos.r, move.castling.rookPos.c);
        next.board[move.castling.rookPos.r][move.castling.rookPos.c] = null;
        next.board[move.castling.newRookPos.r][move.castling.newRookPos.c] = rook;
        if (rook) rook.hasMoved = true;
    }

    const promotion = move.promotion || null;
    if (promotion && PROMOTION_TYPES.includes(promotion)) {
        piece.type = promotion;
        piece.display = PIECE_GLYPHS[piece.color][promotion];
    }

    const actualCaptured = captured || enPassantCaptured;
    next.halfMoveClock = actualCaptured || move.piece?.type === 'P' ? 0 : next.halfMoveClock + 1;
    next.enPassantTarget = move.pawnDoubleJump ? { row: to.r, col: to.c } : null;
    next.currentPlayer = opponentOf(next.currentPlayer);

    return finalizeState(next);
}

export function finalizeState(state) {
    if (state.gameOver) return state;

    const whiteKing = findKing(state, 'white');
    const blackKing = findKing(state, 'black');
    if (!whiteKing || !blackKing) {
        state.gameOver = true;
        state.winner = whiteKing ? 'white' : blackKing ? 'black' : null;
        state.draw = !state.winner;
        return state;
    }

    if (state.halfMoveClock >= 100) {
        state.gameOver = true;
        state.winner = null;
        state.draw = true;
        return state;
    }

    const player = state.currentPlayer;
    const legal = getAllLegalMoves(state, player);
    if (legal.length === 0) {
        state.gameOver = true;
        state.winner = isInCheck(state, player) ? opponentOf(player) : null;
        state.draw = !state.winner;
    }
    return state;
}

export function isInCheck(state, color) {
    const king = findKing(state, color);
    if (!king) return true;
    const host = makeMovementHost(state, color);
    return new PieceMovement(host).isSquareAttacked(king.r, king.c, opponentOf(color));
}

export function findKing(state, color) {
    for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
            const piece = getPiece(state, r, c);
            if (piece?.color === color && piece.type === 'K') return { r, c, piece };
        }
    }
    return null;
}

export function squareAttackedBy(state, row, col, byColor) {
    const host = makeMovementHost(state, byColor);
    return new PieceMovement(host).isSquareAttacked(row, col, byColor);
}

export function getPseudoMovesForPiece(state, row, col, forAttack = false) {
    const piece = getPiece(state, row, col);
    if (!piece) return [];
    const host = makeMovementHost(state, piece.color);
    return new PieceMovement(host).getPseudoMoves(row, col, { forAttack });
}

export function formatCoord({ r, c }) {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
        const edge = r < 0 ? 'top edge' : r >= SIZE ? 'bottom edge' : c < 0 ? 'left edge' : 'right edge';
        return edge;
    }
    return `${String.fromCharCode(97 + c)}${8 - r}`;
}

export function moveId(from, to, promotion = null, suicide = false) {
    return `${from.r},${from.c}->${to.r},${to.c}${promotion ? `=${promotion}` : ''}${suicide ? ':suicide' : ''}`;
}

export function moveLabel(state, from, to, piece, capturedPiece, legal, promotion = null) {
    const icon = piece ? PIECE_GLYPHS[piece.color][piece.type] : '';
    const capture = capturedPiece ? ` x${capturedPiece.type}` : '';
    const suffix = legal.suicide ? ' exits board' : promotion ? `=${promotion}` : legal.castling ? ` castle ${legal.castling.side}` : '';
    return `${icon} ${formatCoord(from)} → ${formatCoord(to)}${capture}${suffix}`.trim();
}

export function isPromotionSquare(color, row) {
    return (color === 'white' && row === 0) || (color === 'black' && row === SIZE - 1);
}

export function validateMoveStillLegal(game, move) {
    if (!move) return null;
    const state = createAnalysisState(game);
    const legal = getAllLegalMoves(state, state.currentPlayer);
    return legal.find((candidate) => candidate.id === move.id) || null;
}
