import { HEX_COLORS, otherHexColor } from './HexGame.js';

const WIN_SCORE = 100000;
const BLOCKED_DISTANCE = 999;
const DISTANCE_EPSILON = 1e-9;

const LEVELS = Object.freeze({
    1: { depth: 0, candidateCap: 18, timeMs: 80 },
    2: { depth: 1, candidateCap: 24, timeMs: 180 },
    3: { depth: 2, candidateCap: 30, timeMs: 420 },
    4: { depth: 3, candidateCap: 36, timeMs: 850 }
});

const HEX_RESEARCH_PRIORS = Object.freeze({
    openingCenter: 42,
    openingConnectionPressure: 72,
    shortestCorridor: 46,
    nearShortestCorridor: 24,
    opponentCut: 58,
    bridgePair: 38,
    virtualConnector: 18,
    componentMerge: 32,
    goalTouch: 12,
    overfilledCampPenalty: -26,
    isolatedEdgePenalty: -18
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

function cellCost(board, topology, coordinate, color) {
    if (typeof topology.isOpponentCamp === 'function' && topology.isOpponentCamp(coordinate, color)) return Infinity;
    const cell = colorAt(board, topology, coordinate);
    if (cell === otherHexColor(color)) return Infinity;
    return cell === color ? 0 : 1;
}

function weightedGoalSearch(board, topology, coordinates, color, sourcePredicate, targetPredicate = null) {
    const distances = new Map();
    const queue = [];
    const push = (coordinate, distance) => {
        const key = keyOf(topology, coordinate);
        if (!key || distance + DISTANCE_EPSILON >= (distances.get(key) ?? Infinity)) return;
        distances.set(key, distance);
        queue.push({ coordinate, distance });
    };

    for (const coordinate of coordinates) {
        if (!sourcePredicate(coordinate)) continue;
        const cost = cellCost(board, topology, coordinate, color);
        if (Number.isFinite(cost)) push(coordinate, cost);
    }

    let best = Infinity;
    while (queue.length) {
        queue.sort((a, b) => b.distance - a.distance);
        const { coordinate, distance } = queue.pop();
        const key = keyOf(topology, coordinate);
        if (Math.abs(distance - (distances.get(key) ?? Infinity)) > DISTANCE_EPSILON) continue;
        if (targetPredicate && distance >= best) continue;
        if (targetPredicate?.(coordinate)) {
            best = Math.min(best, distance);
            continue;
        }
        for (const neighbor of topology.neighbors(coordinate)) {
            const cost = cellCost(board, topology, neighbor, color);
            if (!Number.isFinite(cost)) continue;
            push(neighbor, distance + cost);
        }
    }

    return { distances, best: Number.isFinite(best) ? best : BLOCKED_DISTANCE };
}

function connectionProfile(board, topology, coordinates, color) {
    const zone = topology.goalZones[color];
    const fromStart = weightedGoalSearch(board, topology, coordinates, color, zone.start, zone.end);
    const fromEnd = weightedGoalSearch(board, topology, coordinates, color, zone.end, zone.start);
    return {
        start: fromStart.distances,
        end: fromEnd.distances,
        best: fromStart.best
    };
}

function connectionDistance(board, topology, coordinates, color) {
    return connectionProfile(board, topology, coordinates, color).best;
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

function boardPhase(board, coordinates) {
    const occupied = board.size;
    const total = Math.max(1, coordinates.length);
    if (occupied <= Math.max(2, Math.floor(total * 0.04))) return 'opening';
    if (occupied >= Math.floor(total * 0.72)) return 'endgame';
    return 'middlegame';
}

function profileCellSlack(profile, topology, coordinate, cost) {
    const key = keyOf(topology, coordinate);
    if (!key) return Infinity;
    const start = profile.start.get(key);
    const end = profile.end.get(key);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return Infinity;
    return start + end - cost - profile.best;
}

function corridorMembershipScore(profile, topology, coordinate, cost, own = true) {
    const slack = profileCellSlack(profile, topology, coordinate, cost);
    if (!Number.isFinite(slack)) return 0;
    if (slack <= 0) return own ? HEX_RESEARCH_PRIORS.shortestCorridor : HEX_RESEARCH_PRIORS.opponentCut;
    if (slack <= 1) return own ? HEX_RESEARCH_PRIORS.nearShortestCorridor : HEX_RESEARCH_PRIORS.opponentCut * 0.55;
    if (slack <= 2) return own ? 10 : 14;
    return 0;
}

function frontConnectionScore(board, topology, coordinate, color, profile) {
    const key = keyOf(topology, coordinate);
    if (!key) return 0;
    const neighbors = topology.neighbors(coordinate);
    let bestStart = Infinity;
    let bestEnd = Infinity;
    let ownCount = 0;
    let emptyOnPath = 0;
    for (const neighbor of neighbors) {
        const neighborKey = keyOf(topology, neighbor);
        if (!neighborKey) continue;
        bestStart = Math.min(bestStart, profile.start.get(neighborKey) ?? Infinity);
        bestEnd = Math.min(bestEnd, profile.end.get(neighborKey) ?? Infinity);
        if (colorAt(board, topology, neighbor) === color) ownCount += 1;
        else if (colorAt(board, topology, neighbor) === null) {
            const slack = profileCellSlack(profile, topology, neighbor, 1);
            if (Number.isFinite(slack) && slack <= 1) emptyOnPath += 1;
        }
    }
    let score = 0;
    if (Number.isFinite(bestStart) && Number.isFinite(bestEnd)) {
        score += Math.max(0, HEX_RESEARCH_PRIORS.openingConnectionPressure - (bestStart + bestEnd) * 9);
    }
    if (ownCount >= 2) score += HEX_RESEARCH_PRIORS.componentMerge + ownCount * 6;
    if (emptyOnPath >= 2) score += HEX_RESEARCH_PRIORS.virtualConnector;
    return score;
}

function connectedOwnComponentCount(board, topology, seeds, color) {
    const seenSeeds = new Set();
    let components = 0;
    for (const seed of seeds) {
        const seedKey = keyOf(topology, seed);
        if (!seedKey || seenSeeds.has(seedKey) || colorAt(board, topology, seed) !== color) continue;
        components += 1;
        const queue = [seed];
        seenSeeds.add(seedKey);
        for (let index = 0; index < queue.length; index += 1) {
            for (const neighbor of topology.neighbors(queue[index])) {
                const neighborKey = keyOf(topology, neighbor);
                if (!neighborKey || seenSeeds.has(neighborKey) || colorAt(board, topology, neighbor) !== color) continue;
                seenSeeds.add(neighborKey);
                queue.push(neighbor);
            }
        }
    }
    return components;
}

function componentMergeScore(board, topology, coordinate, color) {
    const ownNeighbors = topology.neighbors(coordinate)
        .filter((neighbor) => colorAt(board, topology, neighbor) === color);
    const components = connectedOwnComponentCount(board, topology, ownNeighbors, color);
    return components >= 2 ? HEX_RESEARCH_PRIORS.componentMerge * (components - 1) : 0;
}

function goalContactScore(topology, coordinate, color) {
    const zone = topology.goalZones[color];
    let score = 0;
    if (zone.start(coordinate)) score += HEX_RESEARCH_PRIORS.goalTouch;
    if (zone.end(coordinate)) score += HEX_RESEARCH_PRIORS.goalTouch;
    return score;
}

function openingShapeScore(board, topology, coordinates, coordinate, color, profile) {
    if (boardPhase(board, coordinates) !== 'opening') return 0;
    const center = modelCenterScore(topology, coordinate) * 2.2;
    const path = corridorMembershipScore(profile, topology, coordinate, cellCost(board, topology, coordinate, color), true);
    const touch = goalContactScore(topology, coordinate, color);
    const edgePenalty = touch && board.size <= 2 ? HEX_RESEARCH_PRIORS.isolatedEdgePenalty : 0;
    return HEX_RESEARCH_PRIORS.openingCenter + center + path * 0.75 + edgePenalty;
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
            score += commonEmpty >= 2 ? HEX_RESEARCH_PRIORS.bridgePair : commonEmpty === 1 ? 18 : 8;
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

function researchKnowledgeScore(board, topology, coordinates, coordinate, color, context = null) {
    const opponent = otherHexColor(color);
    const profiles = context || {};
    const ownBefore = profiles.ownProfile || connectionProfile(board, topology, coordinates, color);
    const opponentBefore = profiles.opponentProfile || connectionProfile(board, topology, coordinates, opponent);
    const emptyCost = cellCost(board, topology, coordinate, color);
    if (!Number.isFinite(emptyCost)) return -WIN_SCORE;

    const ownCorridor = corridorMembershipScore(ownBefore, topology, coordinate, emptyCost, true);
    const opponentCut = corridorMembershipScore(opponentBefore, topology, coordinate, cellCost(board, topology, coordinate, opponent), false);
    const frontScore = frontConnectionScore(board, topology, coordinate, color, ownBefore);
    const mergeScore = componentMergeScore(board, topology, coordinate, color);
    const openingScore = openingShapeScore(board, topology, coordinates, coordinate, color, ownBefore);
    const goalScore = goalContactScore(topology, coordinate, color);

    let ownImprovement = 0;
    let opponentDamage = 0;
    const useAfterProfiles = coordinates.length <= 900 || board.size <= 24;
    if (useAfterProfiles) {
        setColor(board, topology, coordinate, color);
        const ownAfter = connectionProfile(board, topology, coordinates, color);
        const opponentAfter = connectionProfile(board, topology, coordinates, opponent);
        setColor(board, topology, coordinate, null);
        ownImprovement = Math.max(-8, Math.min(8, ownBefore.best - ownAfter.best));
        opponentDamage = Math.max(-8, Math.min(8, opponentAfter.best - opponentBefore.best));
    }
    const campPenalty = typeof topology.isOpponentCamp === 'function' && topology.isOpponentCamp(coordinate, opponent)
        ? HEX_RESEARCH_PRIORS.overfilledCampPenalty
        : 0;

    return ownImprovement * 150
        + opponentDamage * 118
        + ownCorridor
        + opponentCut
        + frontScore
        + mergeScore
        + openingScore
        + goalScore
        + campPenalty;
}

function evaluateBoard(board, topology, coordinates, rootColor) {
    if (hasConnection(board, topology, rootColor)) return WIN_SCORE;
    const opponent = otherHexColor(rootColor);
    if (hasConnection(board, topology, opponent)) return -WIN_SCORE;
    const rootProfile = connectionProfile(board, topology, coordinates, rootColor);
    const opponentProfile = connectionProfile(board, topology, coordinates, opponent);
    const rootDistance = rootProfile.best;
    const opponentDistance = opponentProfile.best;
    let stoneScore = 0;
    let centerScore = 0;
    let pathScore = 0;
    for (const [key, color] of board) {
        const coordinate = topology.coordinate(key);
        const sign = color === rootColor ? 1 : -1;
        stoneScore += sign * 3;
        centerScore += sign * modelCenterScore(topology, coordinate);
        const profile = color === rootColor ? rootProfile : opponentProfile;
        pathScore += sign * corridorMembershipScore(profile, topology, coordinate, 0, true) * 0.35;
    }
    return (opponentDistance - rootDistance) * 125 + stoneScore + centerScore * 2 + pathScore;
}

function winRate(score) {
    return 1 / (1 + Math.exp(-Math.max(-900, Math.min(900, score)) / 220));
}

function createScoreContext(board, topology, coordinates, color) {
    const opponent = otherHexColor(color);
    return {
        ownProfile: connectionProfile(board, topology, coordinates, color),
        opponentProfile: connectionProfile(board, topology, coordinates, opponent)
    };
}

function scoreMove(board, topology, coordinates, coordinate, color, context = null) {
    const researchScore = researchKnowledgeScore(board, topology, coordinates, coordinate, color, context);
    setColor(board, topology, coordinate, color);
    const ownWin = hasConnection(board, topology, color);
    const ownDistance = connectionDistance(board, topology, coordinates, color);
    const opponentDistance = connectionDistance(board, topology, coordinates, otherHexColor(color));
    const score = (ownWin ? WIN_SCORE / 2 : 0)
        + (opponentDistance - ownDistance) * 120
        + researchScore
        + neighborScore(board, topology, coordinate, color)
        + virtualConnectionScore(board, topology, coordinate, color)
        + modelCenterScore(topology, coordinate) * 3;
    setColor(board, topology, coordinate, null);
    return score;
}

function rankedMoves(board, topology, coordinates, color, cap) {
    const context = createScoreContext(board, topology, coordinates, color);
    return emptyCoordinates(board, topology, coordinates, color)
        .map((coordinate) => ({
            coordinate,
            score: scoreMove(board, topology, coordinates, coordinate, color, context)
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
