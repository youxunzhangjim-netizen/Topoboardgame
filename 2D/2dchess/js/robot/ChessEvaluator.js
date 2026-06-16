import {
    findKing,
    getAllLegalMoves,
    getLegalMovesForPiece,
    getPiece,
    getPseudoMovesForPiece,
    opponentOf,
    squareAttackedBy
} from './ChessRobotAdapter.js';

const SIZE = 8;

export const PIECE_VALUES = {
    K: 20000,
    Q: 900,
    R: 500,
    B: 330,
    N: 320,
    P: 100
};

const CENTER_BONUS = [
    [0, 1, 2, 3, 3, 2, 1, 0],
    [1, 3, 4, 5, 5, 4, 3, 1],
    [2, 4, 6, 8, 8, 6, 4, 2],
    [3, 5, 8, 10, 10, 8, 5, 3],
    [3, 5, 8, 10, 10, 8, 5, 3],
    [2, 4, 6, 8, 8, 6, 4, 2],
    [1, 3, 4, 5, 5, 4, 3, 1],
    [0, 1, 2, 3, 3, 2, 1, 0]
];

export function evaluateState(state, player) {
    const opponent = opponentOf(player);

    if (state.gameOver) {
        if (state.draw || !state.winner) return 0;
        return state.winner === player ? 1000000 : -1000000;
    }

    return (
        materialScore(state, player) - materialScore(state, opponent)
        + mobilityScore(state, player) - mobilityScore(state, opponent)
        + kingSafetyScore(state, player) - kingSafetyScore(state, opponent)
        + attackDefenseScore(state, player) - attackDefenseScore(state, opponent)
        + pawnStructureScore(state, player) - pawnStructureScore(state, opponent)
        + topologyScore(state, player) - topologyScore(state, opponent)
    );
}

export function materialScore(state, player) {
    let score = 0;
    forEachPiece(state, (piece, r, c) => {
        if (piece.color !== player) return;
        score += PIECE_VALUES[piece.type] || 0;
        score += pieceSquareBonus(state, piece, r, c);
        score += dynamicPieceBonus(state, piece, r, c);
    });
    return score;
}

export function mobilityScore(state, player) {
    const moves = getAllLegalMoves(state, player);
    let captureBonus = 0;
    for (const move of moves) {
        if (move.capture && move.capturedPiece) captureBonus += Math.min(120, (PIECE_VALUES[move.capturedPiece.type] || 0) / 12);
        if (move.suicide && move.piece?.type !== 'K') captureBonus -= 25;
    }
    return 4 * moves.length + captureBonus;
}

export function kingSafetyScore(state, player) {
    const king = findKing(state, player);
    if (!king) return -100000;

    const enemy = opponentOf(player);
    let attackedRing = 0;
    let defendedRing = 0;
    let escapeSquares = 0;

    for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
            if (dr === 0 && dc === 0) continue;
            const r = king.r + dr;
            const c = king.c + dc;
            if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) continue;
            if (squareAttackedBy(state, r, c, enemy)) attackedRing += 1;
            if (squareAttackedBy(state, r, c, player)) defendedRing += 1;
        }
    }

    const kingMoves = getLegalMovesForPiece(state, king.r, king.c, player);
    escapeSquares = kingMoves.filter((move) => !move.suicide).length;

    let score = -70 * attackedRing + 18 * defendedRing + 25 * escapeSquares;
    if (squareAttackedBy(state, king.r, king.c, enemy)) score -= 180;

    if (state.boundaryCondition === 'periodic') {
        score -= 22 * enemyLongRangeMobilityNearKing(state, player, king);
    }

    if (state.boundaryCondition === 'open') {
        score -= Math.max(0, 2 - distanceToBoundary(king.r, king.c)) * 90;
    }

    return score;
}

export function attackDefenseScore(state, player) {
    let score = 0;
    forEachPiece(state, (piece, r, c) => {
        if (piece.color !== player) return;
        const pseudo = getPseudoMovesForPiece(state, r, c, true);
        for (const move of pseudo) {
            const target = getPiece(state, move.r, move.c);
            if (!target) continue;
            const value = PIECE_VALUES[target.type] || 0;
            if (target.color !== player) score += 0.10 * value;
            else score += 0.04 * value;
        }
    });
    return score;
}

export function pawnStructureScore(state, player) {
    let score = 0;
    forEachPiece(state, (piece, r, c) => {
        if (piece.color !== player || piece.type !== 'P') return;
        const progress = piece.color === 'white' ? 6 - r : r - 1;
        score += 9 * progress;
        if (isIsolatedPawn(state, player, c)) score -= 18;
        if (isPassedPawn(state, piece, r, c)) score += 45 + 10 * progress;
    });
    return score;
}

export function topologyScore(state, player) {
    switch (state.boundaryCondition) {
        case 'periodic':
            return periodicScore(state, player);
        case 'reflection':
            return reflectionScore(state, player);
        case 'open':
            return openBoundaryScore(state, player);
        case 'random':
            return randomBoundaryScore(state, player);
        default:
            return standardSpaceScore(state, player);
    }
}

export function evaluatePieces(state, player) {
    const pieces = [];
    forEachPiece(state, (piece, r, c) => {
        if (piece.color !== player) return;
        const mobility = getLegalMovesForPiece(state, r, c, player).length;
        const baseValue = PIECE_VALUES[piece.type] || 0;
        const dynamic = baseValue + pieceSquareBonus(state, piece, r, c) + dynamicPieceBonus(state, piece, r, c) + 4 * mobility;
        pieces.push({
            piece: piece.type,
            square: `${String.fromCharCode(97 + c)}${8 - r}`,
            baseValue,
            dynamicValue: Math.round(dynamic),
            mobility,
            reason: pieceReason(state, piece, r, c, mobility)
        });
    });
    return pieces.sort((a, b) => b.dynamicValue - a.dynamicValue);
}

export function scoreToWinRate(score) {
    if (score >= 100000) return 0.999;
    if (score <= -100000) return 0.001;
    return 1 / (1 + Math.exp(-score / 420));
}

export function formatScore(score) {
    if (score >= 900000) return '+M';
    if (score <= -900000) return '-M';
    const pawns = score / 100;
    return `${pawns >= 0 ? '+' : ''}${pawns.toFixed(2)}`;
}

export function dynamicPieceBonus(state, piece, r, c) {
    let bonus = 0;
    const mobility = getLegalMovesForPiece(state, r, c, piece.color).length;

    if (piece.type !== 'K') bonus += 2 * mobility;

    if (state.boundaryCondition === 'periodic') {
        if (['R', 'B', 'Q'].includes(piece.type)) bonus += 5 * mobility;
        if (piece.type === 'R' || piece.type === 'Q') bonus += controlsBothHorizontalSides(state, piece, r, c) ? 70 : 0;
        if (piece.type === 'B' || piece.type === 'Q') bonus += controlsLongDiagonalCycle(state, piece, r, c) ? 45 : 0;
    }

    if (state.boundaryCondition === 'reflection') {
        if (piece.type === 'R') {
            // In this reflection rule, rooks do not gain extra reflected movement.
            // Treat them as slightly weaker than in standard chess, especially
            // near the reflecting edge where their straight-line scope is less useful.
            bonus -= nearVerticalMirror(c) ? 65 : 28;
            bonus -= Math.min(36, 3 * mobility);
        } else if (piece.type === 'B' || piece.type === 'Q') {
            bonus += nearVerticalMirror(c) ? 24 : 0;
            bonus += reflectedAttackCount(state, piece, r, c) * 14;
        }
    }

    if (state.boundaryCondition === 'open') {
        const d = distanceToBoundary(r, c);
        if (piece.type === 'K') bonus -= Math.max(0, 2 - d) * 85;
        else bonus -= Math.max(0, 1 - d) * 16;
    }

    if (state.boundaryCondition === 'random') {
        bonus += 3 * mobility;
    }

    return bonus;
}

function standardSpaceScore(state, player) {
    let score = 0;
    forEachPiece(state, (piece, r, c) => {
        if (piece.color !== player) return;
        score += CENTER_BONUS[r][c] * (piece.type === 'P' ? 2 : 4);
    });
    return score;
}

function periodicScore(state, player) {
    let score = 0;
    forEachPiece(state, (piece, r, c) => {
        if (piece.color !== player) return;
        if (['R', 'B', 'Q'].includes(piece.type)) {
            score += 4 * getLegalMovesForPiece(state, r, c, player).length;
        }
        if ((piece.type === 'R' || piece.type === 'Q') && controlsBothHorizontalSides(state, piece, r, c)) score += 90;
    });
    return score;
}

function reflectionScore(state, player) {
    let score = 0;
    forEachPiece(state, (piece, r, c) => {
        if (piece.color !== player) return;
        const mobility = getLegalMovesForPiece(state, r, c, player).filter((move) => !move.suicide).length;
        if (piece.type === 'R') {
            // Rooks receive no artificial reflected-line bonus in this mode.
            // They are weaker when the reflection boundary folds their straight-line plan.
            score -= 10 + Math.min(55, 4 * mobility);
            if (nearVerticalMirror(c)) score -= 35;
            return;
        }
        if (piece.type === 'B' || piece.type === 'Q') {
            score += reflectedAttackCount(state, piece, r, c) * 18;
            if (nearVerticalMirror(c)) score += 8;
        }
        if (piece.type === 'K' && nearVerticalMirror(c)) score -= 20;
    });
    return score;
}

function openBoundaryScore(state, player) {
    let score = 0;
    forEachPiece(state, (piece, r, c) => {
        if (piece.color !== player) return;
        const d = distanceToBoundary(r, c);
        if (piece.type === 'K') score += 40 * d;
        else score -= Math.max(0, 1 - d) * 15;
    });
    return score;
}

function randomBoundaryScore(state, player) {
    const moves = getAllLegalMoves(state, player);
    const captures = moves.filter((move) => move.capture).length;
    const suicides = moves.filter((move) => move.suicide).length;
    return 5 * moves.length + 18 * captures - 20 * suicides;
}

function pieceSquareBonus(state, piece, r, c) {
    if (piece.type === 'K') return 0;
    if (state.boundaryCondition !== 'forbidden') return 0.5 * CENTER_BONUS[r][c];
    return CENTER_BONUS[r][c] * (piece.type === 'P' ? 1.5 : 3);
}

function isIsolatedPawn(state, player, col) {
    for (const dc of [-1, 1]) {
        const file = col + dc;
        if (file < 0 || file >= SIZE) continue;
        for (let r = 0; r < SIZE; r += 1) {
            const piece = getPiece(state, r, file);
            if (piece?.color === player && piece.type === 'P') return false;
        }
    }
    return true;
}

function isPassedPawn(state, pawn, r, c) {
    const enemy = opponentOf(pawn.color);
    const dir = pawn.color === 'white' ? -1 : 1;
    for (let row = r + dir; row >= 0 && row < SIZE; row += dir) {
        for (const dc of [-1, 0, 1]) {
            const col = c + dc;
            if (col < 0 || col >= SIZE) continue;
            const piece = getPiece(state, row, col);
            if (piece?.color === enemy && piece.type === 'P') return false;
        }
    }
    return true;
}

function controlsBothHorizontalSides(state, piece, r, c) {
    const moves = getLegalMovesForPiece(state, r, c, piece.color).filter((move) => !move.suicide);
    return moves.some((move) => move.to.c === 0) && moves.some((move) => move.to.c === SIZE - 1);
}

function controlsLongDiagonalCycle(state, piece, r, c) {
    const moves = getLegalMovesForPiece(state, r, c, piece.color).filter((move) => !move.suicide);
    return moves.some((move) => Math.abs(move.to.c - c) >= 4 && Math.abs(move.to.r - r) >= 2);
}

function reflectedAttackCount(state, piece, r, c) {
    // Rooks are intentionally excluded: under the current reflection rule they
    // do not gain new reflected moves, so counting mirror-side rook moves as
    // extra pressure would overvalue them.
    if (!['B', 'Q'].includes(piece.type)) return 0;
    return getLegalMovesForPiece(state, r, c, piece.color)
        .filter((move) => !move.suicide && (nearVerticalMirror(move.to.c) || Math.abs(move.to.c - c) >= 4))
        .length;
}

function nearVerticalMirror(c) {
    return c <= 1 || c >= SIZE - 2;
}

function distanceToBoundary(r, c) {
    return Math.min(r, c, SIZE - 1 - r, SIZE - 1 - c);
}

function enemyLongRangeMobilityNearKing(state, player, king) {
    const enemy = opponentOf(player);
    let count = 0;
    forEachPiece(state, (piece, r, c) => {
        if (piece.color !== enemy || !['R', 'B', 'Q'].includes(piece.type)) return;
        const moves = getLegalMovesForPiece(state, r, c, enemy);
        count += moves.filter((move) => Math.abs(move.to.r - king.r) <= 1 && Math.abs(move.to.c - king.c) <= 2).length;
    });
    return count;
}

function pieceReason(state, piece, r, c, mobility) {
    if (state.boundaryCondition === 'periodic' && ['R', 'B', 'Q'].includes(piece.type)) {
        return 'long-range mobility and wrapping-side pressure matter strongly here';
    }
    if (state.boundaryCondition === 'reflection' && piece.type === 'R') {
        return 'rook has no extra reflected move here, so it is evaluated as weaker and mostly by actual mobility';
    }
    if (state.boundaryCondition === 'reflection' && ['B', 'Q'].includes(piece.type)) {
        return 'reflection-side geometry may help diagonal or queen pressure, but rooks are not boosted';
    }
    if (state.boundaryCondition === 'open' && distanceToBoundary(r, c) <= 1) {
        return piece.type === 'K' ? 'king is close to an open edge and is strategically risky' : 'piece is near an open edge and may be forced out';
    }
    if (state.boundaryCondition === 'random') {
        return '2D RBC value follows actual legal mobility/capture access';
    }
    return `${mobility} legal move${mobility === 1 ? '' : 's'} plus base material value`;
}

function forEachPiece(state, callback) {
    for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
            const piece = getPiece(state, r, c);
            if (piece) callback(piece, r, c);
        }
    }
}
