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
const DEFAULT_NODE_LIMIT = 55000;
const TIME_BY_DEPTH_MS = { 1: 80, 2: 180, 3: 420, 4: 850 };
const ANALYSIS_TIME_BY_DEPTH_MS = { 1: 150, 2: 420, 3: 900, 4: 1600 };
const ROOT_CAP_BY_DEPTH = { 1: 80, 2: 48, 3: 30, 4: 22 };
const NODE_CAP_BY_PLY = { 1: 120, 2: 64, 3: 38, 4: 26 };

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
    const maxDepth = clampDepth(depth);
    const legal = orderMoves(getAllLegalMoves(state, player), state, player).slice(0, ROOT_CAP_BY_DEPTH[maxDepth] || 30);
    const currentScore = evaluateState(state, player);
    if (!legal.length) return { move: null, score: currentScore, scoreText: formatScore(currentScore), winRate: scoreToWinRate(currentScore), depth: 0, nodes: 0, truncated: false, completedDepth: 0 };

    const context = makeSearchContext(maxDepth, DEFAULT_NODE_LIMIT + maxDepth * 22000, TIME_BY_DEPTH_MS[maxDepth] || 420);
    let best = { move: legal[0], score: -INF };
    let completedDepth = 0;

    for (let d = 1; d <= maxDepth; d += 1) {
        context.iterationDepth = d;
        const result = negamax(state, d, -INF, INF, player, context, 0, best.move);
        if (result.move && !context.hardTruncated) {
            best = result;
            completedDepth = d;
        } else if (!best.move && result.move) {
            best = result;
        }
        if (context.timeUp() || context.nodes >= context.nodeLimit) break;
    }

    if (!Number.isFinite(best.score) || best.score <= -INF / 2) {
        best = onePlyFallback(state, player, legal);
    }

    return {
        move: best.move,
        score: best.score,
        scoreText: formatScore(best.score),
        winRate: scoreToWinRate(best.score),
        depth: maxDepth,
        completedDepth,
        nodes: context.nodes,
        truncated: context.truncated || completedDepth < maxDepth
    };
}

export function analyzePosition(game, depth = 2) {
    return analyzePositionFromState(createAnalysisState(game), depth);
}

export function analyzePositionFromState(inputState, depth = 2) {
    const state = normalizeState(inputState);
    const player = state.currentPlayer;
    const maxDepth = clampDepth(depth);
    const allMoves = orderMoves(getAllLegalMoves(state, player), state, player);
    const context = makeSearchContext(maxDepth, Math.max(DEFAULT_NODE_LIMIT, allMoves.length * 4500), ANALYSIS_TIME_BY_DEPTH_MS[maxDepth] || 900);
    const currentScore = evaluateState(state, player);
    const results = [];
    const rootCap = Math.min(allMoves.length, Math.max(12, ROOT_CAP_BY_DEPTH[maxDepth] || 24));
    const moves = allMoves.slice(0, rootCap);

    for (const move of moves) {
        if (context.timeUp() || context.nodes >= context.nodeLimit) {
            context.truncated = true;
            break;
        }
        const next = applyMoveToState(state, move);
        const searched = negamax(next, Math.max(0, maxDepth - 1), -INF, INF, opponentOf(player), context, 1, null);
        const score = -searched.score;
        results.push({
            move,
            score,
            scoreText: formatScore(score),
            winRate: scoreToWinRate(score),
            reasons: explainMove(state, next, move, player, score)
        });
    }

    // Keep an explicitly bad-move list even when deep analysis is capped: use one-ply score
    // for remaining moves so the panel still warns against obvious blunders.
    if (results.length < allMoves.length && !context.timeUp()) {
        for (const move of allMoves.slice(results.length, Math.min(allMoves.length, results.length + 30))) {
            const next = applyMoveToState(state, move);
            const score = evaluateState(next, player);
            results.push({
                move,
                score,
                scoreText: formatScore(score),
                winRate: scoreToWinRate(score),
                reasons: explainMove(state, next, move, player, score)
            });
        }
    }

    results.sort((a, b) => b.score - a.score);

    return {
        player,
        boundaryCondition: state.boundaryCondition,
        depth: maxDepth,
        nodes: context.nodes,
        truncated: context.truncated,
        currentScore,
        currentScoreText: formatScore(currentScore),
        currentWinRate: scoreToWinRate(currentScore),
        topMoves: results.slice(0, 5),
        badMoves: results.slice(-5).reverse(),
        pieceValues: evaluatePieces(state, player).slice(0, 10)
    };
}

function makeSearchContext(depth, nodeLimit = DEFAULT_NODE_LIMIT, timeMs = TIME_BY_DEPTH_MS[depth] || 420) {
    const start = now();
    return {
        nodes: 0,
        nodeLimit: Math.max(6000, nodeLimit),
        start,
        deadline: start + Math.max(40, timeMs),
        truncated: false,
        hardTruncated: false,
        tt: new Map(),
        history: new Map(),
        killers: Array.from({ length: 16 }, () => []) ,
        iterationDepth: depth,
        timeUp() {
            return now() >= this.deadline;
        }
    };
}

function negamax(state, depth, alpha, beta, player, context, ply = 0, preferredMove = null) {
    context.nodes += 1;
    if ((context.nodes & 127) === 0 && (context.nodes >= context.nodeLimit || context.timeUp())) {
        context.truncated = true;
        context.hardTruncated = true;
        return { score: evaluateState(state, player), move: null };
    }

    if (state.gameOver) return { score: evaluateState(state, player), move: null };
    if (depth <= 0) return { score: quiescence(state, alpha, beta, player, context, 0), move: null };

    const hash = hashState(state, player);
    const cached = context.tt.get(hash);
    if (cached && cached.depth >= depth) {
        if (cached.flag === 'exact') return { score: cached.score, move: cached.move };
        if (cached.flag === 'lower' && cached.score >= beta) return { score: cached.score, move: cached.move };
        if (cached.flag === 'upper' && cached.score <= alpha) return { score: cached.score, move: cached.move };
    }

    let moves = getAllLegalMoves(state, player);
    if (!moves.length) {
        const score = isInCheck(state, player) ? -900000 + ply : evaluateState(state, player);
        return { score, move: null };
    }
    moves = orderMoves(moves, state, player, context, ply, cached?.move || preferredMove);
    const cap = NODE_CAP_BY_PLY[Math.min(depth, 4)] || 30;
    if (moves.length > cap) moves = moves.slice(0, cap);

    const originalAlpha = alpha;
    let bestScore = -INF;
    let bestMove = moves[0] || null;

    for (const move of moves) {
        const next = applyMoveToState(state, move);
        const result = negamax(next, depth - 1, -beta, -alpha, opponentOf(player), context, ply + 1, null);
        const score = -result.score;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        if (score > alpha) alpha = score;
        if (alpha >= beta) {
            rememberCutoff(context, ply, move, depth);
            break;
        }
        if (context.hardTruncated) break;
    }

    let flag = 'exact';
    if (bestScore <= originalAlpha) flag = 'upper';
    else if (bestScore >= beta) flag = 'lower';
    context.tt.set(hash, { depth, score: bestScore, move: bestMove, flag });
    return { score: bestScore, move: bestMove };
}

function quiescence(state, alpha, beta, player, context, ply) {
    context.nodes += 1;
    const standPat = evaluateState(state, player);
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;
    if (ply >= 2 || context.nodes >= context.nodeLimit || context.timeUp()) return alpha;

    const tactical = orderMoves(getAllLegalMoves(state, player), state, player, context, ply, null)
        .filter((move) => move.capture || move.promotion)
        .slice(0, 14);

    for (const move of tactical) {
        const next = applyMoveToState(state, move);
        const score = -quiescence(next, -beta, -alpha, opponentOf(player), context, ply + 1);
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
    }
    return alpha;
}

export function orderMoves(moves, state, player, context = null, ply = 0, preferredMove = null) {
    return moves.slice().sort((a, b) => moveOrderingScore(b, state, player, context, ply, preferredMove) - moveOrderingScore(a, state, player, context, ply, preferredMove));
}

function moveOrderingScore(move, state, player, context = null, ply = 0, preferredMove = null) {
    let score = 0;
    if (preferredMove && sameMove(move, preferredMove)) score += 1000000;
    if (move.capture && move.capturedPiece) {
        score += 10000 + 10 * (PIECE_VALUES[move.capturedPiece.type] || 0) - (PIECE_VALUES[move.piece?.type] || 0);
    }
    if (move.promotion) score += 9000 + (PIECE_VALUES[move.promotion] || 0);
    if (move.castling) score += 2600;
    if (move.piece?.type === 'P' && [3, 4].includes(move.from?.c) && Math.abs((move.to?.r ?? 0) - (move.from?.r ?? 0)) >= 1) score += 240;
    if (['B', 'N'].includes(move.piece?.type) && isHomeMinor(move)) score += 520;
    if (move.piece?.type === 'Q' && isEarlyPosition(state) && !move.capture) score -= 360;
    if (move.suicide) score += move.piece?.type === 'K' ? -100000 : -450;
    if (context) {
        const key = moveKey(move);
        score += context.history.get(key) || 0;
        if ((context.killers[ply] || []).some((killer) => sameMove(killer, move))) score += 1800;
    }
    return score;
}

function isHomeMinor(move) {
    if (!move?.from || !move?.piece) return false;
    const homeRank = move.piece.color === 'white' ? 7 : 0;
    return move.from.r === homeRank && [1, 2, 5, 6].includes(move.from.c);
}

function isEarlyPosition(state) {
    let pieces = 0;
    for (const row of state.board || []) {
        for (const piece of row) if (piece) pieces += 1;
    }
    return pieces >= 26;
}

function rememberCutoff(context, ply, move, depth) {
    if (!context || move.capture) return;
    const list = context.killers[ply] || (context.killers[ply] = []);
    if (!list.some((item) => sameMove(item, move))) list.unshift(move);
    if (list.length > 2) list.pop();
    const key = moveKey(move);
    context.history.set(key, (context.history.get(key) || 0) + depth * depth);
}

function onePlyFallback(state, player, legal) {
    let best = { move: legal[0] || null, score: -INF };
    for (const move of legal) {
        const next = applyMoveToState(state, move);
        const score = evaluateState(next, player);
        if (score > best.score) best = { move, score };
    }
    return best;
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
    if (before.boundaryCondition === 'random') reasons.push('uses the actual 2D RBC legal-move graph rather than normal geometry');
    if (reasons.length === 0) reasons.push(score >= 0 ? 'improves the searched position score' : 'looks worse after search');
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

function hashState(state, player) {
    const cells = [];
    for (const row of state.board) {
        for (const piece of row) cells.push(piece ? `${piece.color[0]}${piece.type}${piece.hasMoved ? 1 : 0}` : '..');
    }
    return `${cells.join('')}:${state.currentPlayer}:${player}:${state.boundaryCondition}:${state.enPassantTarget?.row ?? '-'}:${state.enPassantTarget?.col ?? '-'}`;
}

function moveKey(move) {
    return `${move.from?.r},${move.from?.c}->${move.to?.r},${move.to?.c}${move.promotion || ''}`;
}

function sameMove(a, b) {
    if (!a || !b) return false;
    return a.from?.r === b.from?.r && a.from?.c === b.from?.c && a.to?.r === b.to?.r && a.to?.c === b.to?.c && (a.promotion || '') === (b.promotion || '');
}

function now() {
    return globalThis.performance?.now?.() ?? Date.now();
}

function clampDepth(value) {
    return Math.max(1, Math.min(4, Math.floor(Number(value) || 2)));
}
