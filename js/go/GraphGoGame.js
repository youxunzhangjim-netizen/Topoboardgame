import {
    coordKey,
    createGraphTopology,
    coordsEqual
} from '../topology/GraphTopologies.js';

export const GO_COLORS = Object.freeze({
    empty: 0,
    black: 1,
    white: 2
});

export function otherGoColor(color) {
    return color === 'black' ? 'white' : 'black';
}

export function goColorToValue(color) {
    return color === 'white' ? GO_COLORS.white : GO_COLORS.black;
}

export function goValueToColor(value) {
    if (value === GO_COLORS.black) return 'black';
    if (value === GO_COLORS.white) return 'white';
    return '';
}

function cloneCoord(coord) {
    return [...coord];
}

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function mapValue(board, key) {
    return board.get(key) || GO_COLORS.empty;
}

function setMapValue(board, key, value) {
    if (value === GO_COLORS.empty) board.delete(key);
    else board.set(key, value);
}

export class GraphGoGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.topology = createGraphTopology(options.topology || options);
        this.vertices = this.topology.vertices().map(cloneCoord);
        this.vertexKeys = this.vertices.map(coordKey);
        this.vertexByKey = new Map(this.vertices.map((coord) => [coordKey(coord), coord]));
        this.komi = Number.isFinite(Number(options.komi)) ? Number(options.komi) : 7.5;
        this.board = new Map();
        this.currentPlayer = options.currentPlayer || 'black';
        this.captures = { black: 0, white: 0 };
        this.passCount = 0;
        this.scoringPending = false;
        this.countAgreements = { black: false, white: false };
        this.gameOver = false;
        this.winner = '';
        this.score = null;
        this.moveNumber = 0;
        this.moveHistory = [];
        const setupPosition = this.serializeBoard(this.board);
        this.positionHistory = [setupPosition];
        this.positionSet = new Set(this.positionHistory);
    }

    normalize(coord) {
        return this.topology.normalize(coord);
    }

    key(coord) {
        const normalized = this.normalize(coord);
        return normalized ? coordKey(normalized) : '';
    }

    coordFromKey(key) {
        return this.vertexByKey.get(key) || key.split(',').map(Number);
    }

    containsCoord(coord) {
        return Boolean(this.normalize(coord));
    }

    valueAtKey(key, board = this.board) {
        return mapValue(board, key);
    }

    valueAt(coord, board = this.board) {
        const key = this.key(coord);
        return key ? this.valueAtKey(key, board) : GO_COLORS.empty;
    }

    colorAt(coord, board = this.board) {
        return goValueToColor(this.valueAt(coord, board));
    }

    setValueAtKey(board, key, value) {
        setMapValue(board, key, value);
    }

    neighborsFromCoord(coord) {
        const normalized = this.normalize(coord);
        return normalized ? this.topology.neighbors(normalized) : [];
    }

    neighborsFromKey(key) {
        return this.neighborsFromCoord(this.coordFromKey(key)).map(coordKey);
    }

    serializeBoard(board = this.board) {
        return this.vertexKeys.map((key) => String(this.valueAtKey(key, board))).join('');
    }

    getGroupAndLiberties(board, startKey) {
        const color = this.valueAtKey(startKey, board);
        if (color === GO_COLORS.empty) return { color, group: new Set(), liberties: new Set() };

        const group = new Set([startKey]);
        const liberties = new Set();
        const stack = [startKey];

        while (stack.length) {
            const key = stack.pop();
            for (const next of this.neighborsFromKey(key)) {
                const value = this.valueAtKey(next, board);
                if (value === GO_COLORS.empty) {
                    liberties.add(next);
                } else if (value === color && !group.has(next)) {
                    group.add(next);
                    stack.push(next);
                }
            }
        }

        return { color, group, liberties };
    }

    connectedGroups(board = this.board) {
        const visited = new Set();
        const groups = [];
        for (const key of this.vertexKeys) {
            const colorValue = this.valueAtKey(key, board);
            if (colorValue === GO_COLORS.empty || visited.has(key)) continue;
            const group = this.getGroupAndLiberties(board, key);
            for (const stone of group.group) visited.add(stone);
            groups.push({
                color: goValueToColor(colorValue),
                colorValue,
                group: group.group,
                liberties: group.liberties
            });
        }
        return groups;
    }

    groupInfoAt(coord, board = this.board) {
        const key = this.key(coord);
        if (!key || this.valueAtKey(key, board) === GO_COLORS.empty) return null;
        const group = this.getGroupAndLiberties(board, key);
        return {
            key,
            coord: this.coordFromKey(key),
            color: goValueToColor(group.color),
            colorValue: group.color,
            group: group.group,
            liberties: group.liberties,
            h: group.group.size / 2
        };
    }

    previewPlay(coord, color = this.currentPlayer) {
        if (this.gameOver) return { ok: false, error: 'Game is already over.' };
        if (this.scoringPending) return { ok: false, error: 'Counting is pending.' };
        if (color !== this.currentPlayer) return { ok: false, error: `It is ${this.currentPlayer}'s turn.` };
        const normalized = this.normalize(coord);
        if (!normalized) return { ok: false, error: 'Point is outside the board graph.' };
        const key = coordKey(normalized);
        if (this.valueAtKey(key) !== GO_COLORS.empty) return { ok: false, error: 'That point is occupied.' };

        const ownValue = goColorToValue(color);
        const enemyValue = goColorToValue(otherGoColor(color));
        const nextBoard = new Map(this.board);
        this.setValueAtKey(nextBoard, key, ownValue);

        let captured = 0;
        const capturedStones = [];
        const checkedEnemyGroups = new Set();
        for (const neighbor of this.neighborsFromKey(key)) {
            if (this.valueAtKey(neighbor, nextBoard) !== enemyValue || checkedEnemyGroups.has(neighbor)) continue;
            const enemy = this.getGroupAndLiberties(nextBoard, neighbor);
            for (const stone of enemy.group) checkedEnemyGroups.add(stone);
            if (enemy.liberties.size === 0) {
                for (const stone of enemy.group) {
                    this.setValueAtKey(nextBoard, stone, GO_COLORS.empty);
                    capturedStones.push(stone);
                    captured++;
                }
            }
        }

        const own = this.getGroupAndLiberties(nextBoard, key);
        if (own.liberties.size === 0) {
            return { ok: false, error: 'Suicide is not allowed.' };
        }

        const serialized = this.serializeBoard(nextBoard);
        if (this.positionSet.has(serialized)) {
            return { ok: false, error: 'Superko: this board position already occurred.' };
        }

        return {
            ok: true,
            key,
            normalized,
            board: nextBoard,
            captured,
            capturedStones,
            serialized
        };
    }

    legalMoves(color = this.currentPlayer) {
        return this.vertexKeys
            .filter((key) => this.valueAtKey(key) === GO_COLORS.empty)
            .map((key) => this.coordFromKey(key))
            .filter((coord) => this.previewPlay(coord, color).ok);
    }

    tryPlay(coord, color = this.currentPlayer) {
        const preview = this.previewPlay(coord, color);
        if (!preview.ok) return preview;

        this.board = preview.board;
        this.captures[color] += preview.captured;
        this.passCount = 0;
        this.countAgreements = { black: false, white: false };
        this.moveNumber++;
        const event = {
            type: 'play',
            color,
            coord: preview.normalized,
            captured: preview.captured,
            capturedStones: preview.capturedStones.map((stone) => this.coordFromKey(stone)),
            number: this.moveNumber
        };
        this.moveHistory.unshift(event);
        this.positionHistory.push(preview.serialized);
        this.positionSet.add(preview.serialized);
        this.currentPlayer = otherGoColor(color);
        return { ok: true, event, captured: preview.captured };
    }

    pass(color = this.currentPlayer) {
        if (this.gameOver) return { ok: false, error: 'Game is already over.' };
        if (this.scoringPending) return { ok: false, error: 'Counting is already pending.' };
        if (color !== this.currentPlayer) return { ok: false, error: `It is ${this.currentPlayer}'s turn.` };

        this.passCount++;
        this.moveNumber++;
        const event = { type: 'pass', color, number: this.moveNumber };
        this.moveHistory.unshift(event);
        this.currentPlayer = otherGoColor(color);
        if (this.passCount >= 2) {
            this.scoringPending = true;
            this.countAgreements = { black: false, white: false };
        }
        return { ok: true, event };
    }

    agreeToCount(color = this.currentPlayer) {
        if (!this.scoringPending) return { ok: false, error: 'Counting starts after two consecutive passes.' };
        if (!['black', 'white'].includes(color)) return { ok: false, error: 'Unknown player.' };
        this.countAgreements[color] = true;
        if (this.countAgreements.black && this.countAgreements.white) {
            this.score = this.computeAreaScore();
            this.winner = this.score.black > this.score.white ? 'black' : this.score.white > this.score.black ? 'white' : 'draw';
            this.gameOver = true;
            this.moveHistory.unshift({ type: 'score', score: this.score, winner: this.winner, number: this.moveNumber });
        }
        return { ok: true, score: this.score, winner: this.winner };
    }

    applyVirtualRemoval(groupKeys, color) {
        let removed = 0;
        for (const key of groupKeys) {
            if (this.valueAtKey(key) === goColorToValue(color)) {
                this.setValueAtKey(this.board, key, GO_COLORS.empty);
                removed++;
            }
        }
        if (removed) {
            const serialized = this.serializeBoard(this.board);
            this.positionHistory.push(serialized);
            this.positionSet.add(serialized);
        }
        return removed;
    }

    endTurnWithEvent(event, color = this.currentPlayer) {
        this.passCount = 0;
        this.countAgreements = { black: false, white: false };
        this.moveNumber++;
        const entry = { ...event, number: this.moveNumber, color };
        this.moveHistory.unshift(entry);
        this.currentPlayer = otherGoColor(color);
        return entry;
    }

    counts() {
        let black = 0;
        let white = 0;
        for (const value of this.board.values()) {
            if (value === GO_COLORS.black) black++;
            if (value === GO_COLORS.white) white++;
        }
        return { black, white };
    }

    computeAreaScore() {
        const score = { black: 0, white: this.komi, neutral: 0, komi: this.komi };
        const visited = new Set();

        for (const key of this.vertexKeys) {
            const value = this.valueAtKey(key);
            if (value === GO_COLORS.black) score.black++;
            if (value === GO_COLORS.white) score.white++;
            if (value !== GO_COLORS.empty || visited.has(key)) continue;

            const region = [];
            const borderColors = new Set();
            const stack = [key];
            visited.add(key);

            while (stack.length) {
                const current = stack.pop();
                region.push(current);
                for (const next of this.neighborsFromKey(current)) {
                    const neighborValue = this.valueAtKey(next);
                    if (neighborValue === GO_COLORS.empty) {
                        if (!visited.has(next)) {
                            visited.add(next);
                            stack.push(next);
                        }
                    } else {
                        borderColors.add(goValueToColor(neighborValue));
                    }
                }
            }

            if (borderColors.size === 1) score[[...borderColors][0]] += region.length;
            else score.neutral += region.length;
        }

        score.black = Number(score.black.toFixed(1));
        score.white = Number(score.white.toFixed(1));
        score.neutral = Number(score.neutral.toFixed(1));
        score.margin = Number(Math.abs(score.black - score.white).toFixed(1));
        return score;
    }

    exportState() {
        return {
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions
            },
            komi: this.komi,
            board: this.vertexKeys.map((key) => this.valueAtKey(key)),
            vertices: this.vertices.map(cloneCoord),
            currentPlayer: this.currentPlayer,
            captures: { ...this.captures },
            passCount: this.passCount,
            scoringPending: this.scoringPending,
            countAgreements: { ...this.countAgreements },
            gameOver: this.gameOver,
            winner: this.winner,
            score: this.score ? { ...this.score } : null,
            moveNumber: this.moveNumber,
            moveHistory: this.moveHistory.map(cloneValue),
            positionHistory: [...this.positionHistory]
        };
    }
}

export function sameGoCoord(a, b) {
    return coordsEqual(a, b);
}
