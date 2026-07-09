import { HEX_COLORS, otherHexColor } from './HexGame.js';

const WIN_SCORE = 100000;
const BLOCKED_DISTANCE = 999;

const LEVELS = Object.freeze({
    1: { depth: 0, candidateCap: 18, timeMs: 80 },
    2: { depth: 1, candidateCap: 24, timeMs: 180 },
    3: { depth: 2, candidateCap: 30, timeMs: 420 },
    4: { depth: 3, candidateCap: 36, timeMs: 850 }
});

function now() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
}

function normalizeLevel(level) {
    const parsed = Math.max(1, Math.min(4, Math.floor(Number(level) || 2)));
    return LEVELS[parsed] ? parsed : 2;
}

function keyOf(topology, coordinate) {
    return topology.key(coordinate);
}

function colorAt(board, topology, coordinate) {
    const key = keyOf(topology, coordinate);
    return key ? board.get(key) || null : null;
}

function setColor(board, topology, coordinate, color) {
    const key = keyOf(topology, coordinate);
    if (!key) return null;
    if (color) board.set(key, color);
    else board.delete(key);
    return key;
}

function emptyCoordinates(board, topology, coordinates, color = null) {
    return coordinates.filter((coordinate) =>
        colorAt(board, topology, coordinate) === null &&
        (!color || typeof topology.isOpponentCamp !== 'function' || !topology.isOpponentCamp(coordinate, color)));
}

function hasConnection(board, topology, color) {
    const zone = topology.goalZones[color];
    const queue = [];
    const visited = new Set();
    for (const [key, cellColor] of board) {
        if (cellColor !== color) continue;
        const coordinate = topology.coordinate(key);
        if (!zone.start(coordinate)) continue;
        queue.push(coordinate);
        visited.add(key);
    }
    for (let index = 0; index < queue.length; index += 1) {
        const coordinate = queue[index];
        if (zone.end(coordinate)) return true;
        for (const neighbor of topology.neighbors(coordinate)) {
            const key = keyOf(topology, neighbor);
            if (!key || visited.has(key) || board.get(key) !== color) continue;
            visited.add(key);
            queue.push(neighbor);
        }
    }
    return false;
}

function connectionDistance(board, topology, coordinates, color) {
    const zone = topology.goalZones[color];
    const opponent = otherHexColor(color);
    const distances = new Map();
    const queue = [];
    const push = (coordinate, distance) => {
        const key = keyOf(topology, coordinate);
        if (!key || distance >= (distances.get(key) ?? Infinity)) return;
        distances.set(key, distance);
        queue.push({ coordinate, distance });
    };
    const costOf = (coordinate) => {
        if (typeof topology.isOpponentCamp === 'function' && topology.isOpponentCamp(coordinate, color)) return Infinity;
        const cell = colorAt(board, topology, coordinate);
        if (cell === opponent) return Infinity;
        return cell === color ? 0 : 1;
    };
    for (const coordinate of coordinates) {
        if (!zone.start(coordinate)) continue;
        const cost = costOf(coordinate);
        if (Number.isFinite(cost)) push(coordinate, cost);
    }
    let best = Infinity;
    while (queue.length) {
        queue.sort((a, b) => b.distance - a.distance);
        const { coordinate, distance } = queue.pop();
        const key = keyOf(topology, coordinate);
        if (distance !== distances.get(key)) continue;
        if (distance >= best) continue;
        if (zone.end(coordinate)) {
            best = Math.min(best, distance);
            continue;
        }
        for (const neighbor of topology.neighbors(coordinate)) {
            const cost = costOf(neighbor);
            if (!Number.isFinite(cost)) continue;
            push(neighbor, distance + cost);
        }
    }
    return Number.isFinite(best) ? best : BLOCKED_DISTANCE;
}

function modelCenterScore(topology, coordinate) {
    const position = topology.position?.(coordinate);
    if (!Array.isArray(position)) return 0;
    const distance = Math.hypot(...position.slice(0, 3).map((value) => Number(value) || 0));
    return -distance;
}

function neighborScore(board, topology, coordinate, color) {
    const opponent = otherHexColor(color);
    let own = 0;
    let enemy = 0;
    let empty = 0;
    for (const neighbor of topology.neighbors(coordinate)) {
        const cell = colorAt(board, topology, neighbor);
        if (cell === color) own += 1;
        else if (cell === opponent) enemy += 1;
        else empty += 1;
    }
    return own * 12 + enemy * 5 + empty * 0.4;
}

function commonEmptyConnectorCount(board, topology, first, second, color) {
    const firstNeighbors = new Set(topology.neighbors(first).map((coord) => keyOf(topology, coord)).filter(Boolean));
    let count = 0;
    for (const coord of topology.neighbors(second)) {
        const key = keyOf(topology, coord);
        if (!key || !firstNeighbors.has(key)) continue;
        if (colorAt(board, topology, coord) !== null) continue;
        if (typeof topology.isOpponentCamp === 'function' && topology.isOpponentCamp(coord, color)) continue;
        count += 1;
    }
    return count;
}

function virtualConnectionScore(board, topology, coordinate, color) {
    const opponent = otherHexColor(color);
    const neighbors = topology.neighbors(coordinate);
    const ownNeighbors = neighbors.filter((neighbor) => colorAt(board, topology, neighbor) === color);
    const enemyNeighbors = neighbors.filter((neighbor) => colorAt(board, topology, neighbor) === opponent);
    let score = 0;

    // Hex strategy books call these bridge/virtual-connection priors: a move is stronger
    // when it connects several friendly local regions or leaves a second empty connector.
    for (let i = 0; i < ownNeighbors.length; i += 1) {
        for (let j = i + 1; j < ownNeighbors.length; j += 1) {
            const commonEmpty = commonEmptyConnectorCount(board, topology, ownNeighbors[i], ownNeighbors[j], color);
            score += commonEmpty >= 2 ? 34 : commonEmpty === 1 ? 18 : 8;
        }
    }

    for (const empty of neighbors) {
        if (colorAt(board, topology, empty) !== null) continue;
        if (typeof topology.isOpponentCamp === 'function' && topology.isOpponentCamp(empty, color)) continue;
        let secondRingOwn = 0;
        let secondRingEnemy = 0;
        for (const around of topology.neighbors(empty)) {
            const cell = colorAt(board, topology, around);
            if (cell === color) secondRingOwn += 1;
            else if (cell === opponent) secondRingEnemy += 1;
        }
        if (secondRingOwn >= 2) score += 12;
        if (secondRingOwn >= 1 && secondRingEnemy >= 1) score += 4;
    }

    if (ownNeighbors.length >= 2) score += 22 + ownNeighbors.length * 7;
    if (enemyNeighbors.length >= 2) score += 14 + enemyNeighbors.length * 4;
    return score;
}

function evaluateBoard(board, topology, coordinates, rootColor) {
    if (hasConnection(board, topology, rootColor)) return WIN_SCORE;
    const opponent = otherHexColor(rootColor);
    if (hasConnection(board, topology, opponent)) return -WIN_SCORE;
    const rootDistance = connectionDistance(board, topology, coordinates, rootColor);
    const opponentDistance = connectionDistance(board, topology, coordinates, opponent);
    let stoneScore = 0;
    let centerScore = 0;
    for (const [key, color] of board) {
        const coordinate = topology.coordinate(key);
        const sign = color === rootColor ? 1 : -1;
        stoneScore += sign * 3;
        centerScore += sign * modelCenterScore(topology, coordinate);
    }
    return (opponentDistance - rootDistance) * 115 + stoneScore + centerScore * 2;
}

function winRate(score) {
    return 1 / (1 + Math.exp(-Math.max(-900, Math.min(900, score)) / 220));
}

function scoreMove(board, topology, coordinates, coordinate, color) {
    setColor(board, topology, coordinate, color);
    const ownWin = hasConnection(board, topology, color);
    const ownDistance = connectionDistance(board, topology, coordinates, color);
    const opponentDistance = connectionDistance(board, topology, coordinates, otherHexColor(color));
    const score = (ownWin ? WIN_SCORE / 2 : 0)
        + (opponentDistance - ownDistance) * 120
        + neighborScore(board, topology, coordinate, color)
        + virtualConnectionScore(board, topology, coordinate, color)
        + modelCenterScore(topology, coordinate) * 3;
    setColor(board, topology, coordinate, null);
    return score;
}

function rankedMoves(board, topology, coordinates, color, cap) {
    return emptyCoordinates(board, topology, coordinates, color)
        .map((coordinate) => ({
            coordinate,
            score: scoreMove(board, topology, coordinates, coordinate, color)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, cap)
        .map((entry) => entry.coordinate);
}

function winningMoves(board, topology, coordinates, color) {
    const result = [];
    for (const coordinate of emptyCoordinates(board, topology, coordinates, color)) {
        setColor(board, topology, coordinate, color);
        const won = hasConnection(board, topology, color);
        setColor(board, topology, coordinate, null);
        if (won) result.push(coordinate);
    }
    return result;
}

function search(board, topology, coordinates, currentColor, rootColor, depth, alpha, beta, profile, stats) {
    stats.nodes += 1;
    if (now() - profile.startTime > profile.timeMs) {
        stats.truncated = true;
        return evaluateBoard(board, topology, coordinates, rootColor);
    }
    if (depth <= 0 || hasConnection(board, topology, rootColor) || hasConnection(board, topology, otherHexColor(rootColor))) {
        return evaluateBoard(board, topology, coordinates, rootColor);
    }
    const moves = rankedMoves(board, topology, coordinates, currentColor, profile.candidateCap);
    if (!moves.length) return evaluateBoard(board, topology, coordinates, rootColor);
    const maximizing = currentColor === rootColor;
    let best = maximizing ? -Infinity : Infinity;
    for (const move of moves) {
        setColor(board, topology, move, currentColor);
        const won = hasConnection(board, topology, currentColor);
        const score = won
            ? (currentColor === rootColor ? WIN_SCORE - stats.nodes : -WIN_SCORE + stats.nodes)
            : search(board, topology, coordinates, otherHexColor(currentColor), rootColor, depth - 1, alpha, beta, profile, stats);
        setColor(board, topology, move, null);
        if (maximizing) {
            best = Math.max(best, score);
            alpha = Math.max(alpha, best);
        } else {
            best = Math.min(best, score);
            beta = Math.min(beta, best);
        }
        if (beta <= alpha) break;
    }
    return best;
}

export function chooseHexRobotMove(game, options = {}) {
    if (!game || game.winner) return null;
    const level = normalizeLevel(options.level);
    const profile = { ...LEVELS[level], level, startTime: now() };
    const topology = game.topology;
    const coordinates = topology.coordinates();
    const board = new Map(game.board);
    const color = game.currentColor;
    const opponent = otherHexColor(color);
    const legal = emptyCoordinates(board, topology, coordinates, color);
    const stats = { nodes: 0, truncated: false };
    if (!legal.length) return null;

    const wins = winningMoves(board, topology, coordinates, color);
    if (wins.length) {
        const coordinate = wins
            .map((move) => ({ move, score: scoreMove(board, topology, coordinates, move, color) }))
            .sort((a, b) => b.score - a.score)[0].move;
        return { coordinate, level, score: WIN_SCORE, nodes: stats.nodes, reason: 'win' };
    }
    const opponentWins = winningMoves(board, topology, coordinates, opponent)
        .filter((coordinate) => typeof topology.isOpponentCamp !== 'function' || !topology.isOpponentCamp(coordinate, color));
    if (opponentWins.length) {
        const coordinate = opponentWins
            .map((move) => ({ move, score: scoreMove(board, topology, coordinates, move, color) }))
            .sort((a, b) => b.score - a.score)[0].move;
        return { coordinate, level, score: WIN_SCORE / 2, nodes: stats.nodes, reason: 'block' };
    }

    const candidates = rankedMoves(board, topology, coordinates, color, profile.candidateCap);
    let bestMove = candidates[0] || legal[0];
    let bestScore = -Infinity;
    if (profile.depth <= 0) {
        bestScore = scoreMove(board, topology, coordinates, bestMove, color);
        return { coordinate: bestMove, level, score: bestScore, nodes: stats.nodes, reason: 'heuristic' };
    }

    for (const move of candidates) {
        setColor(board, topology, move, color);
        const won = hasConnection(board, topology, color);
        const score = won
            ? WIN_SCORE
            : search(board, topology, coordinates, opponent, color, profile.depth - 1, -Infinity, Infinity, profile, stats);
        setColor(board, topology, move, null);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        if (stats.truncated) break;
    }

    return {
        coordinate: bestMove,
        level,
        score: bestScore,
        nodes: stats.nodes,
        reason: stats.truncated ? 'search-timeout' : 'search'
    };
}

export function analyzeHexRobotPosition(game, options = {}) {
    if (!game) return null;
    const level = normalizeLevel(options.level);
    const limit = Math.max(1, Math.min(10, Math.floor(Number(options.limit) || 6)));
    const profile = { ...LEVELS[level], level, startTime: now(), timeMs: Math.max(LEVELS[level].timeMs, 260) };
    const topology = game.topology;
    const coordinates = topology.coordinates();
    const board = new Map(game.board);
    const color = game.currentColor;
    const opponent = otherHexColor(color);
    const currentScore = evaluateBoard(board, topology, coordinates, color);
    const stats = { nodes: 0, truncated: false };
    const candidates = rankedMoves(board, topology, coordinates, color, profile.candidateCap);
    const opponentWins = new Set(winningMoves(board, topology, coordinates, opponent)
        .map((coordinate) => keyOf(topology, coordinate)));

    const topMoves = candidates.map((coordinate) => {
        setColor(board, topology, coordinate, color);
        const won = hasConnection(board, topology, color);
        const score = won
            ? WIN_SCORE
            : profile.depth <= 0
                ? evaluateBoard(board, topology, coordinates, color)
                : search(board, topology, coordinates, opponent, color, profile.depth - 1, -Infinity, Infinity, profile, stats);
        setColor(board, topology, coordinate, null);
        const key = keyOf(topology, coordinate);
        return {
            coordinate,
            score,
            winRate: winRate(score),
            reason: won ? 'win' : opponentWins.has(key) ? 'block' : stats.truncated ? 'search-timeout' : 'search'
        };
    })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return {
        player: color,
        level,
        depth: profile.depth,
        currentScore,
        currentWinRate: winRate(currentScore),
        nodes: stats.nodes,
        truncated: stats.truncated,
        topMoves
    };
}

export default chooseHexRobotMove;
