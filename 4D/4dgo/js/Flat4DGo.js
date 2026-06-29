import {
    algebraicPressureForIndex,
    normalizePauliLabel,
    setPauliLabel
} from '../../../js/algebra/PauliAlgebra.js';

export const FLAT_4D_GO_TOPOLOGY = 'flat_4d_go';

export const COLORS = {
    empty: 0,
    black: 1,
    white: 2
};

export function otherColor(color) {
    return color === 'black' ? 'white' : 'black';
}

export function colorToValue(color) {
    return color === 'white' ? COLORS.white : COLORS.black;
}

export function valueToColor(value) {
    if (value === COLORS.black) return 'black';
    if (value === COLORS.white) return 'white';
    return '';
}

export function normalizeSizes(options = {}) {
    const size = (value, fallback) => {
        const parsed = Math.floor(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };
    return {
        nx: size(options.nx, 5),
        ny: size(options.ny, 5),
        nz: size(options.nz, 5),
        nw: size(options.nw, 5)
    };
}

export class Flat4DGoGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset({ nx = 5, ny = 5, nz = 5, nw = 5, komi = 7.5 } = {}) {
        this.topology = FLAT_4D_GO_TOPOLOGY;
        this.sizes = normalizeSizes({ nx, ny, nz, nw });
        this.dimension = 4;
        this.komi = Number.isFinite(Number(komi)) ? Number(komi) : 7.5;
        this.total = this.sizes.nx * this.sizes.ny * this.sizes.nz * this.sizes.nw;
        this.board = new Uint8Array(this.total);
        this.pauliLabels = Array(this.total).fill('I');
        this.cliffordGoEnabled = false;
        this.currentPlayer = 'black';
        this.captures = { black: 0, white: 0 };
        this.passCount = 0;
        this.scoringPending = false;
        this.countAgreements = { black: false, white: false };
        this.gameOver = false;
        this.winner = '';
        this.score = null;
        this.moveNumber = 0;
        this.moveHistory = [];
        this.positionHistory = [this.serializeBoard(this.board)];
        this.positionSet = new Set(this.positionHistory);
    }

    coordKey(coord) {
        return coord.join(',');
    }

    containsCoord(coord) {
        return Array.isArray(coord)
            && coord.length === 4
            && coord.every((value) => Number.isInteger(value))
            && coord[0] >= 0 && coord[0] < this.sizes.nx
            && coord[1] >= 0 && coord[1] < this.sizes.ny
            && coord[2] >= 0 && coord[2] < this.sizes.nz
            && coord[3] >= 0 && coord[3] < this.sizes.nw;
    }

    indexFromCoord(coord) {
        if (!this.containsCoord(coord)) return -1;
        const [x, y, z, w] = coord;
        return x + this.sizes.nx * (y + this.sizes.ny * (z + this.sizes.nz * w));
    }

    coordFromIndex(index) {
        let value = Number(index);
        const x = value % this.sizes.nx;
        value = Math.floor(value / this.sizes.nx);
        const y = value % this.sizes.ny;
        value = Math.floor(value / this.sizes.ny);
        const z = value % this.sizes.nz;
        const w = Math.floor(value / this.sizes.nz);
        return [x, y, z, w];
    }

    neighborsFromCoord(coord) {
        if (!this.containsCoord(coord)) return [];
        const neighbors = [];
        for (let axis = 0; axis < 4; axis++) {
            for (const delta of [-1, 1]) {
                const next = [...coord];
                next[axis] += delta;
                if (this.containsCoord(next)) neighbors.push(next);
            }
        }
        return neighbors;
    }

    neighborsFromIndex(index) {
        return this.neighborsFromCoord(this.coordFromIndex(index))
            .map((coord) => this.indexFromCoord(coord))
            .filter((value) => value >= 0);
    }

    serializeBoard(board = this.board) {
        return Array.from(board).join('');
    }

    getGroupAndLiberties(board, startIndex) {
        const color = board[startIndex];
        const group = new Set([startIndex]);
        const liberties = new Set();
        const stack = [startIndex];

        while (stack.length) {
            const index = stack.pop();
            for (const next of this.neighborsFromIndex(index)) {
                const value = board[next];
                if (value === COLORS.empty) {
                    liberties.add(next);
                } else if (value === color && !group.has(next)) {
                    group.add(next);
                    stack.push(next);
                }
            }
        }

        return { group, liberties };
    }

    tryPlay(coord, color = this.currentPlayer, options = {}) {
        if (this.gameOver) return { ok: false, error: 'Game is already over.' };
        if (this.scoringPending) return { ok: false, error: 'Counting is pending. Start a new game to resume.' };
        if (color !== this.currentPlayer) return { ok: false, error: `It is ${this.currentPlayer}'s turn.` };
        if (!this.containsCoord(coord)) return { ok: false, error: 'Point is outside the 4D board.' };

        const index = this.indexFromCoord(coord);
        if (this.board[index] !== COLORS.empty) return { ok: false, error: 'That vertex is occupied.' };

        const ownValue = colorToValue(color);
        const enemyValue = colorToValue(otherColor(color));
        const nextBoard = new Uint8Array(this.board);
        const nextLabels = [...this.pauliLabels];
        nextBoard[index] = ownValue;
        nextLabels[index] = normalizePauliLabel(options.pauli || options.pauliLabel || 'I');

        let captured = 0;
        const checkedEnemyGroups = new Set();
        for (const neighbor of this.neighborsFromIndex(index)) {
            if (nextBoard[neighbor] !== enemyValue || checkedEnemyGroups.has(neighbor)) continue;
            const enemy = this.getGroupAndLiberties(nextBoard, neighbor);
            for (const stone of enemy.group) checkedEnemyGroups.add(stone);
            if (enemy.liberties.size === 0) {
                for (const stone of enemy.group) {
                    nextBoard[stone] = COLORS.empty;
                    nextLabels[stone] = 'I';
                    captured++;
                }
            }
        }

        const own = this.getGroupAndLiberties(nextBoard, index);
        if (own.liberties.size === 0) return { ok: false, error: 'Suicide is not allowed.' };

        const serialized = this.serializeBoard(nextBoard);
        if (this.positionSet.has(serialized)) {
            return { ok: false, error: 'Superko: this board position already occurred.' };
        }

        this.board = nextBoard;
        this.pauliLabels = nextLabels;
        this.captures[color] += captured;
        this.passCount = 0;
        this.countAgreements = { black: false, white: false };
        this.moveNumber++;
        this.moveHistory.unshift({ type: 'play', color, coord: [...coord], captured, number: this.moveNumber });
        this.positionHistory.push(serialized);
        this.positionSet.add(serialized);
        this.currentPlayer = otherColor(color);
        return { ok: true, captured };
    }

    setPauliAt(coord, label) {
        const index = Array.isArray(coord) ? this.indexFromCoord(coord) : Number(coord);
        if (index < 0 || index >= this.pauliLabels.length || this.board[index] === COLORS.empty) {
            return { ok: false, error: 'Choose an occupied vertex.' };
        }
        this.pauliLabels[index] = normalizePauliLabel(label);
        return { ok: true, pauli: this.pauliLabels[index] };
    }

    getPauliAt(coord) {
        const index = Array.isArray(coord) ? this.indexFromCoord(coord) : Number(coord);
        return index >= 0 && index < this.pauliLabels.length ? normalizePauliLabel(this.pauliLabels[index]) : 'I';
    }

    stoneEntityAt(index) {
        const color = valueToColor(this.board[index]);
        if (!color) return null;
        return setPauliLabel({ color }, this.pauliLabels[index] || 'I');
    }

    algebraicPressureAt(coordOrIndex) {
        const index = Array.isArray(coordOrIndex) ? this.indexFromCoord(coordOrIndex) : Number(coordOrIndex);
        if (index < 0 || index >= this.board.length) return 0;
        return algebraicPressureForIndex(index, {
            board: this.board,
            labels: this.pauliLabels,
            neighborsFromIndex: (stoneIndex) => this.neighborsFromIndex(stoneIndex),
            valueToColor
        });
    }

    algebraicPressureMap() {
        return Array.from(this.board, (_, index) => this.algebraicPressureAt(index));
    }

    pass(color = this.currentPlayer) {
        if (this.gameOver) return { ok: false, error: 'Game is already over.' };
        if (this.scoringPending) return { ok: false, error: 'Counting is already pending.' };
        if (color !== this.currentPlayer) return { ok: false, error: `It is ${this.currentPlayer}'s turn.` };

        this.passCount++;
        this.moveNumber++;
        this.moveHistory.unshift({ type: 'pass', color, number: this.moveNumber });
        this.currentPlayer = otherColor(color);
        if (this.passCount >= 2) {
            this.scoringPending = true;
            this.countAgreements = { black: false, white: false };
        }
        return { ok: true };
    }

    agreeToCount(color) {
        if (!this.scoringPending) return { ok: false, error: 'Counting starts after two consecutive passes.' };
        if (!['black', 'white'].includes(color)) return { ok: false, error: 'Unknown player.' };
        this.countAgreements[color] = true;
        if (this.countAgreements.black && this.countAgreements.white) {
            this.score = this.computeAreaScore();
            this.winner = this.score.black > this.score.white ? 'black' : this.score.white > this.score.black ? 'white' : 'draw';
            this.gameOver = true;
            this.moveHistory.unshift({ type: 'score', score: this.score, winner: this.winner, number: this.moveNumber });
        }
        return { ok: true };
    }

    playableIndexes() {
        return Array.from({ length: this.board.length }, (_, index) => index);
    }

    emptyRegionInfo(board, startIndex, ignoredStones = new Set()) {
        const region = [];
        const borderColors = new Set();
        const visited = new Set([startIndex]);
        const stack = [startIndex];

        while (stack.length) {
            const current = stack.pop();
            region.push(current);
            for (const next of this.neighborsFromIndex(current)) {
                const neighborValue = board[next];
                if (neighborValue === COLORS.empty) {
                    if (!visited.has(next)) {
                        visited.add(next);
                        stack.push(next);
                    }
                    continue;
                }
                if (ignoredStones.has(next)) continue;
                const color = valueToColor(neighborValue);
                if (color) borderColors.add(color);
            }
        }

        return { region, borderColors };
    }

    stoneGroups(board = this.board) {
        const groups = [];
        const visited = new Set();
        for (const index of this.playableIndexes()) {
            const value = board[index];
            if (value === COLORS.empty || visited.has(index)) continue;
            const stones = [];
            const stoneSet = new Set([index]);
            const stack = [index];
            visited.add(index);
            while (stack.length) {
                const current = stack.pop();
                stones.push(current);
                for (const next of this.neighborsFromIndex(current)) {
                    if (board[next] === value && !visited.has(next)) {
                        visited.add(next);
                        stoneSet.add(next);
                        stack.push(next);
                    }
                }
            }
            groups.push({ color: valueToColor(value), value, stones, stoneSet });
        }
        return groups;
    }

    detectDeadStoneCandidates(board = this.board) {
        const dead = new Set();
        for (const group of this.stoneGroups(board)) {
            const opponent = otherColor(group.color);
            const libertyRegions = [];
            const seenLiberties = new Set();
            for (const stone of group.stones) {
                for (const next of this.neighborsFromIndex(stone)) {
                    if (board[next] !== COLORS.empty || seenLiberties.has(next)) continue;
                    const info = this.emptyRegionInfo(board, next, group.stoneSet);
                    for (const point of info.region) seenLiberties.add(point);
                    libertyRegions.push(info);
                }
            }
            const enclosedByOpponent = libertyRegions.length === 1
                && libertyRegions.every((info) => info.borderColors.size === 1 && info.borderColors.has(opponent));
            if (enclosedByOpponent) {
                for (const stone of group.stones) dead.add(stone);
            }
        }
        return dead;
    }

    computeAreaScore() {
        const deadCandidates = this.detectDeadStoneCandidates(this.board);
        const scoringBoard = new Uint8Array(this.board);
        for (const index of deadCandidates) scoringBoard[index] = COLORS.empty;
        const score = {
            black: 0,
            white: this.komi,
            blackStones: 0,
            whiteStones: 0,
            blackTerritory: 0,
            whiteTerritory: 0,
            deadBlack: 0,
            deadWhite: 0,
            neutral: 0,
            komi: this.komi,
            scoring: 'graph-area',
            territoryRule: 'Dead-stone candidates fully inside one opponent-owned liberty region are removed first. Empty regions are then territory only when every bordering live stone belongs to one player; otherwise the region is neutral.'
        };
        for (const index of deadCandidates) {
            const color = valueToColor(this.board[index]);
            if (color === 'black') score.deadBlack++;
            if (color === 'white') score.deadWhite++;
        }
        const visited = new Set();

        for (let index = 0; index < this.board.length; index++) {
            const value = scoringBoard[index];
            if (value === COLORS.black) {
                score.blackStones++;
                score.black++;
            }
            if (value === COLORS.white) {
                score.whiteStones++;
                score.white++;
            }
            if (value !== COLORS.empty || visited.has(index)) continue;

            const { region, borderColors } = this.emptyRegionInfo(scoringBoard, index);
            for (const point of region) visited.add(point);

            if (borderColors.size === 1) {
                const owner = [...borderColors][0];
                score[owner] += region.length;
                score[`${owner}Territory`] += region.length;
            } else {
                score.neutral += region.length;
            }
        }

        score.black = Number(score.black.toFixed(1));
        score.white = Number(score.white.toFixed(1));
        score.neutral = Number(score.neutral.toFixed(1));
        score.margin = Number(Math.abs(score.black - score.white).toFixed(1));
        score.deadStones = { black: score.deadBlack, white: score.deadWhite };
        score.removedDeadStones = [...deadCandidates].map((index) => ({
            color: valueToColor(this.board[index]),
            coord: this.coordFromIndex(index)
        }));
        return score;
    }

    exportState() {
        return {
            topology: this.topology,
            sizes: { ...this.sizes },
            komi: this.komi,
            board: Array.from(this.board),
            pauliLabels: [...this.pauliLabels],
            currentPlayer: this.currentPlayer,
            captures: { ...this.captures },
            passCount: this.passCount,
            scoringPending: this.scoringPending,
            countAgreements: { ...this.countAgreements },
            gameOver: this.gameOver,
            winner: this.winner,
            score: this.score ? { ...this.score } : null,
            moveNumber: this.moveNumber,
            moveHistory: this.moveHistory.map((move) => ({ ...move })),
            positionHistory: [...this.positionHistory]
        };
    }

    importState(state = {}) {
        const sizes = normalizeSizes(state.sizes || state);
        this.reset({ ...sizes, komi: state.komi });
        if (Array.isArray(state.board) && state.board.length === this.total) {
            this.board = Uint8Array.from(state.board.map((value) => Number(value) || COLORS.empty));
        }
        this.pauliLabels = Array.isArray(state.pauliLabels) && state.pauliLabels.length === this.total
            ? state.pauliLabels.map(normalizePauliLabel)
            : Array(this.total).fill('I');
        this.currentPlayer = state.currentPlayer === 'white' ? 'white' : 'black';
        this.captures = {
            black: Number(state.captures?.black) || 0,
            white: Number(state.captures?.white) || 0
        };
        this.passCount = Number(state.passCount) || 0;
        this.scoringPending = Boolean(state.scoringPending);
        this.countAgreements = {
            black: Boolean(state.countAgreements?.black),
            white: Boolean(state.countAgreements?.white)
        };
        this.gameOver = Boolean(state.gameOver);
        this.winner = ['black', 'white', 'draw'].includes(state.winner) ? state.winner : '';
        this.score = state.score ? { ...state.score } : null;
        this.moveNumber = Number(state.moveNumber) || 0;
        this.moveHistory = Array.isArray(state.moveHistory) ? state.moveHistory.map((move) => ({ ...move })) : [];
        this.positionHistory = Array.isArray(state.positionHistory) && state.positionHistory.length
            ? [...state.positionHistory]
            : [this.serializeBoard(this.board)];
        this.positionSet = new Set(this.positionHistory);
    }
}
