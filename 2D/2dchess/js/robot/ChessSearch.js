import {
    applyMoveToState,
    createAnalysisState,
    getAllLegalMoves,
    getLegalMovesForPiece,
    getPiece,
    isInCheck,
    normalizeState,
    opponentOf,
    validateMoveStillLegal
} from './ChessRobotAdapter.js';
import { evaluatePieces, evaluateState, formatScore, PIECE_VALUES, scoreToWinRate } from './ChessEvaluator.js';

const INF = 1000000000;
const DEFAULT_NODE_LIMIT = 45000;

export function chooseRobotMove(game, depth = 2) {
    const result = chooseRobotMoveFromState(createAnalysisState(game), depth);
    const legalMove = validateMoveStillLegal(game, result.move);
    return {
        ...result,
        move: legalMove
    };
}

export function chooseRobotMoveFromState(inputState, depth = 2) {
    const state = normalizeState(inputState);
    const player = state.currentPlayer;
    const context = makeSearchContext(depth);
    const result = negamax(state, depth, -INF, INF, player, context);
    return {
        ...result,
        depth,
        nodes: context.nodes,
        truncated: context.truncated
    };
}

export function analyzePosition(game, depth = 2) {
    return analyzePositionFromState(createAnalysisState(game), depth);
}

export function analyzePositionFromState(inputState, depth = 2) {
    const state = normalizeState(inputState);
    const player = state.currentPlayer;
    const moves = orderMoves(getAllLegalMoves(state, player), state, player);
    const context = makeSearchContext(depth, Math.max(DEFAULT_NODE_LIMIT, moves.length * 6000));
    const currentScore = evaluateState(state, player);
    const results = [];

    for (const move of moves) {
        if (context.nodes >= context.nodeLimit) {
            context.truncated = true;
            break;
        }
        const next = applyMoveToState(state, move);
        const searched = negamax(next, Math.max(0, depth - 1), -INF, INF, opponentOf(player), context);
        const score = -searched.score;
        results.push({
            move,
            score,
            scoreText: formatScore(score),
            winRate: scoreToWinRate(score),
            reasons: explainMove(state, next, move, player, score)
        });
    }

    results.sort((a, b) => b.score - a.score);

    return {
        player,
        boundaryCondition: state.boundaryCondition,
        depth,
        nodes: context.nodes,
        truncated: context.truncated,
        currentScore,
        currentScoreText: formatScore(currentScore),
        currentWinRate: scoreToWinRate(currentScore),
        topMoves: results.slice(0, 5),
        badMoves: results.slice(-5).reverse(),
        pieceValues: evaluatePieces(state, player).slice(0, 8)
    };
}

function makeSearchContext(depth, nodeLimit = DEFAULT_NODE_LIMIT) {
    return {
        nodes: 0,
        nodeLimit: Math.max(5000, nodeLimit + depth * 15000),
        truncated: false,
        tt: new Map()
    };
}

function negamax(state, depth, alpha, beta, player, context) {
    context.nodes += 1;
    if (context.nodes >= context.nodeLimit) context.truncated = true;

    if (state.gameOver) {
        return { score: evaluateState(state, player), move: null };
    }

    if (depth <= 0 || context.truncated) {
        return { score: quiescence(state, alpha, beta, player, context, 0), move: null };
    }

    const hash = hashState(state, depth, player);
    const cached = context.tt.get(hash);
    if (cached && cached.depth >= depth) return { score: cached.score, move: cached.move };

    const moves = orderMoves(getAllLegalMoves(state, player), state, player);
    if (moves.length === 0) return { score: evaluateState(state, player), move: null };

    let bestScore = -INF;
    let bestMove = moves[0] || null;

    for (const move of moves) {
        const next = applyMoveToState(state, move);
        const result = negamax(next, depth - 1, -beta, -alpha, opponentOf(player), context);
        const score = -result.score;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }

        alpha = Math.max(alpha, score);
        if (alpha >= beta || context.truncated) break;
    }

    context.tt.set(hash, { depth, score: bestScore, move: bestMove });
    return { score: bestScore, move: bestMove };
}

function quiescence(state, alpha, beta, player, context, ply) {
    context.nodes += 1;
    const standPat = evaluateState(state, player);
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;
    if (ply >= 2 || context.nodes >= context.nodeLimit) return alpha;

    const tactical = orderMoves(getAllLegalMoves(state, player), state, player)
        .filter((move) => move.capture || move.promotion || givesCheck(state, move, player));

    for (const move of tactical) {
        const next = applyMoveToState(state, move);
        const score = -quiescence(next, -beta, -alpha, opponentOf(player), context, ply + 1);
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
    }
    return alpha;
}

export function orderMoves(moves, state, player) {
    return moves.slice().sort((a, b) => moveOrderingScore(b, state, player) - moveOrderingScore(a, state, player));
}

function moveOrderingScore(move, state, player) {
    let score = 0;
    if (move.capture && move.capturedPiece) {
        score += 10000 + (PIECE_VALUES[move.capturedPiece.type] || 0) - 0.12 * (PIECE_VALUES[move.piece?.type] || 0);
    }
    if (move.promotion) score += 9000;
    if (move.castling) score += 500;
    if (givesCheck(state, move, player)) score += 2500;
    if (move.suicide) score += move.piece?.type === 'K' ? -100000 : -350;
    return score;
}

function givesCheck(state, move, player) {
    const next = applyMoveToState(state, move);
    return isInCheck(next, opponentOf(player));
}

function explainMove(before, after, move, player, score) {
    const reasons = [];
    if (move.capturedPiece) reasons.push(`captures ${pieceName(move.capturedPiece.type)}`);
    if (move.promotion) reasons.push(`promotes to ${pieceName(move.promotion)}`);
    if (move.castling) reasons.push(`castles ${move.castling.side} to improve king safety`);
    if (move.suicide) reasons.push(move.piece?.type === 'K' ? 'king leaves the board, which loses immediately' : 'sacrifices a piece through the open boundary');
    if (isInCheck(after, opponentOf(player))) reasons.push('gives check');

    const beforeMobility = getAllLegalMoves(before, player).length;
    const afterMobility = getAllLegalMoves(after, player).length;
    if (afterMobility > beforeMobility + 2) reasons.push('increases future mobility');
    if (afterMobility < beforeMobility - 2) reasons.push('reduces future mobility');

    const beforeKingMoves = kingMoveCount(before, player);
    const afterKingMoves = kingMoveCount(after, player);
    if (afterKingMoves > beforeKingMoves) reasons.push('improves king escape options');
    if (afterKingMoves < beforeKingMoves) reasons.push('reduces king escape options');

    if (before.boundaryCondition === 'periodic' && controlsHorizontalSides(after, move, player)) {
        reasons.push('controls both sides of the periodic wrap');
    }
    if (before.boundaryCondition === 'reflection' && move.piece?.type === 'R') {
        reasons.push('rook has no extra reflected move in this mode, so the move is judged mainly by material, safety, and actual mobility');
    }
    if (before.boundaryCondition === 'reflection' && createsReflectionPressure(after, move, player)) {
        reasons.push('creates reflection-boundary pressure without giving rooks an artificial bonus');
    }
    if (before.boundaryCondition === 'open' && move.suicide && move.piece?.type !== 'K') {
        reasons.push('may be useful only if the sacrifice improves king safety or tactic score');
    }
    if (before.boundaryCondition === 'random') {
        reasons.push('uses the actual 2D RBC legal-move graph rather than normal geometry');
    }

    if (reasons.length === 0) {
        reasons.push(score >= 0 ? 'improves the searched position score' : 'looks worse after search');
    }
    return reasons;
}

function kingMoveCount(state, player) {
    for (let r = 0; r < 8; r += 1) {
        for (let c = 0; c < 8; c += 1) {
            const piece = getPiece(state, r, c);
            if (piece?.color === player && piece.type === 'K') return getLegalMovesForPiece(state, r, c, player).length;
        }
    }
    return 0;
}

function controlsHorizontalSides(state, move, player) {
    const piece = getPiece(state, move.to.r, move.to.c);
    if (!piece || piece.color !== player || !['R', 'Q'].includes(piece.type)) return false;
    const moves = getLegalMovesForPiece(state, move.to.r, move.to.c, player);
    return moves.some((candidate) => candidate.to.c === 0) && moves.some((candidate) => candidate.to.c === 7);
}

function createsReflectionPressure(state, move, player) {
    const piece = getPiece(state, move.to.r, move.to.c);
    if (!piece || piece.color !== player || !['B', 'Q'].includes(piece.type)) return false;
    return move.to.c <= 1 || move.to.c >= 6 || getLegalMovesForPiece(state, move.to.r, move.to.c, player).length >= 8;
}

function pieceName(type) {
    return ({ K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' })[type] || type;
}

function hashState(state, depth, player) {
    const cells = [];
    for (const row of state.board) {
        for (const piece of row) cells.push(piece ? `${piece.color[0]}${piece.type}${piece.hasMoved ? 1 : 0}` : '..');
    }
    return `${cells.join('')}:${state.currentPlayer}:${player}:${state.boundaryCondition}:${state.enPassantTarget?.row ?? '-'}:${state.enPassantTarget?.col ?? '-'}:${depth}`;
}
