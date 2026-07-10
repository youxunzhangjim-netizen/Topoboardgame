export const GO_SCORING_RULE_TEXT = 'Area scoring removes agreed/clearly dead stones first. Empty graph regions count as territory only when their live boundary sees one color; mixed or open regions are neutral.';

function uniqueUnits(units = []) {
    return [...new Set(units)];
}

function asSet(values = []) {
    return values instanceof Set ? new Set(values) : new Set(Array.isArray(values) ? values : []);
}

function defaultCloneBoard(board) {
    if (board instanceof Map) return new Map(board);
    if (board instanceof Uint8Array) return new Uint8Array(board);
    if (Array.isArray(board)) return [...board];
    throw new Error('Go scoring requires cloneBoard for this board type.');
}

function normalizeConfig(config = {}) {
    const units = uniqueUnits(config.units || config.playableUnits || []);
    const emptyValue = config.emptyValue ?? 0;
    const valueAt = config.valueAt || ((board, unit) => board[unit]);
    const setValue = config.setValue || ((board, unit, value) => { board[unit] = value; });
    const cloneBoard = config.cloneBoard || defaultCloneBoard;
    const neighborsOf = config.neighborsOf || (() => []);
    const valueToColor = config.valueToColor || ((value) => value === 1 ? 'black' : value === 2 ? 'white' : '');
    const coordOf = config.coordOf || ((unit) => unit);
    return {
        ...config,
        units,
        emptyValue,
        valueAt,
        setValue,
        cloneBoard,
        neighborsOf,
        valueToColor,
        coordOf,
        komi: Number.isFinite(Number(config.komi)) ? Number(config.komi) : 7.5
    };
}

function colorAt(config, board, unit) {
    return config.valueToColor(config.valueAt(board, unit));
}

function isEmpty(config, board, unit) {
    return config.valueAt(board, unit) === config.emptyValue;
}

function emptyRegionInfo(config, board, startUnit, ignoredStones = new Set()) {
    const region = [];
    const borderColors = new Set();
    const borderStoneUnits = { black: new Set(), white: new Set() };
    const visited = new Set([startUnit]);
    const stack = [startUnit];

    while (stack.length) {
        const current = stack.pop();
        region.push(current);
        for (const next of uniqueUnits(config.neighborsOf(current))) {
            if (ignoredStones.has(next)) continue;
            const value = config.valueAt(board, next);
            if (value === config.emptyValue) {
                if (!visited.has(next)) {
                    visited.add(next);
                    stack.push(next);
                }
                continue;
            }
            const color = config.valueToColor(value);
            if (color) {
                borderColors.add(color);
                borderStoneUnits[color]?.add(next);
            }
        }
    }

    return { region, borderColors, borderStoneUnits };
}

function stoneGroups(config, board) {
    const groups = [];
    const visited = new Set();
    for (const unit of config.units) {
        const value = config.valueAt(board, unit);
        if (value === config.emptyValue || visited.has(unit)) continue;
        const color = config.valueToColor(value);
        if (!color) continue;

        const stones = [];
        const stoneSet = new Set([unit]);
        const stack = [unit];
        visited.add(unit);
        while (stack.length) {
            const current = stack.pop();
            stones.push(current);
            for (const next of uniqueUnits(config.neighborsOf(current))) {
                if (visited.has(next) || config.valueAt(board, next) !== value) continue;
                visited.add(next);
                stoneSet.add(next);
                stack.push(next);
            }
        }
        groups.push({ color, value, stones, stoneSet });
    }
    return groups;
}

function collectLibertyRegions(config, board, group, ignoredStones = new Set()) {
    const regions = [];
    const seenLiberties = new Set();
    for (const stone of group.stones) {
        for (const next of uniqueUnits(config.neighborsOf(stone))) {
            if (!isEmpty(config, board, next) || seenLiberties.has(next)) continue;
            const info = emptyRegionInfo(config, board, next, ignoredStones);
            for (const point of info.region) seenLiberties.add(point);
            regions.push(info);
        }
    }
    return regions;
}

function trueEyeCount(config, board, group) {
    const regions = collectLibertyRegions(config, board, group);
    return regions.filter((info) => info.borderColors.size === 1 && info.borderColors.has(group.color)).length;
}

function surroundedByOpponentAfterRemoval(config, board, group) {
    if (typeof config.isBoundaryUnit === 'function' && group.stones.some((stone) => config.isBoundaryUnit(stone))) {
        return false;
    }
    const opponent = group.color === 'black' ? 'white' : 'black';
    const virtualBoard = config.cloneBoard(board);
    for (const stone of group.stones) config.setValue(virtualBoard, stone, config.emptyValue);

    const start = group.stones[0];
    const info = emptyRegionInfo(config, virtualBoard, start);
    return info.borderColors.size === 1 && info.borderColors.has(opponent);
}

export function detectGoDeadStoneCandidates(rawConfig = {}) {
    const config = normalizeConfig(rawConfig);
    const dead = asSet(config.markedDead || config.deadStones);
    const workingBoard = config.cloneBoard(config.board);
    for (const unit of dead) config.setValue(workingBoard, unit, config.emptyValue);

    let changed = true;
    let passes = 0;
    while (changed && passes < 32) {
        changed = false;
        passes += 1;
        for (const group of stoneGroups(config, workingBoard)) {
            if (group.stones.some((stone) => dead.has(stone))) continue;
            if (trueEyeCount(config, workingBoard, group) >= 2) continue;
            if (!surroundedByOpponentAfterRemoval(config, workingBoard, group)) continue;
            for (const stone of group.stones) {
                dead.add(stone);
                config.setValue(workingBoard, stone, config.emptyValue);
                changed = true;
            }
        }
    }

    return dead;
}

export function computeGoAreaScore(rawConfig = {}) {
    const config = normalizeConfig(rawConfig);
    const deadCandidates = detectGoDeadStoneCandidates(config);
    const scoringBoard = config.cloneBoard(config.board);
    for (const unit of deadCandidates) config.setValue(scoringBoard, unit, config.emptyValue);

    const score = {
        black: 0,
        white: config.komi,
        blackStones: 0,
        whiteStones: 0,
        blackTerritory: 0,
        whiteTerritory: 0,
        deadBlack: 0,
        deadWhite: 0,
        neutral: 0,
        komi: config.komi,
        scoring: 'graph-area',
        territoryRule: GO_SCORING_RULE_TEXT,
        territorySites: { black: [], white: [], neutral: [] },
        removedDeadStones: []
    };

    for (const unit of deadCandidates) {
        const color = colorAt(config, config.board, unit);
        if (color === 'black') score.deadBlack += 1;
        if (color === 'white') score.deadWhite += 1;
        if (color) score.removedDeadStones.push({ color, coord: config.coordOf(unit) });
    }

    const visited = new Set();
    for (const unit of config.units) {
        const value = config.valueAt(scoringBoard, unit);
        if (value !== config.emptyValue) {
            const color = config.valueToColor(value);
            if (color === 'black') {
                score.blackStones += 1;
                score.black += 1;
            } else if (color === 'white') {
                score.whiteStones += 1;
                score.white += 1;
            }
            continue;
        }
        if (visited.has(unit)) continue;

        const { region, borderColors, borderStoneUnits } = emptyRegionInfo(config, scoringBoard, unit);
        for (const point of region) visited.add(point);

        if (borderColors.size === 1) {
            const owner = [...borderColors][0];
            const forceNeutral = typeof config.isNeutralTerritory === 'function'
                && config.isNeutralTerritory({ owner, region, borderStoneUnits, board: scoringBoard });
            if (!forceNeutral) {
                score[owner] += region.length;
                score[`${owner}Territory`] += region.length;
                score.territorySites[owner].push(...region.map((point) => config.coordOf(point)));
                continue;
            }
        }

        score.neutral += region.length;
        score.territorySites.neutral.push(...region.map((point) => config.coordOf(point)));
    }

    score.black = Number(score.black.toFixed(1));
    score.white = Number(score.white.toFixed(1));
    score.neutral = Number(score.neutral.toFixed(1));
    score.margin = Number(Math.abs(score.black - score.white).toFixed(1));
    score.deadStones = { black: score.deadBlack, white: score.deadWhite };

    const captures = config.captures || {};
    const blackPrisoners = (Number(captures.black) || 0) + score.deadWhite;
    const whitePrisoners = (Number(captures.white) || 0) + score.deadBlack;
    score.territoryScoring = {
        black: Number((score.blackTerritory + blackPrisoners).toFixed(1)),
        white: Number((score.whiteTerritory + whitePrisoners + config.komi).toFixed(1)),
        blackPrisoners,
        whitePrisoners,
        note: 'Territory-style reference: territory plus prisoners/dead stones; area score remains the game result for this mode.'
    };

    return score;
}
