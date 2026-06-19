import {
    algebraicPressureForIndex,
    normalizePauliLabel,
    setPauliLabel
} from '../../../js/algebra/PauliAlgebra.js';
import { SeededRandom } from '../../../js/probability/SeededRandom.js';
import {
    advanceIndexedPieceAges,
    clockProgress,
    createAgeArray,
    normalizePieceTimeConfig
} from '../../../js/time/PieceAgeClock.js';

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

export function normalizeTopology(topology) {
    const value = String(topology || '').toLowerCase();
    if (['cylinder', 'cyl', 'pbcx', 'pbc-x', 'x-periodic', 'periodic-x'].includes(value)) return 'cylinder';
    if (['pbc', 't2', 'torus', 'periodic', 'periodic2d'].includes(value)) return 'pbc';
    if (['klein', 'kleingo', 'klein_bottle', 'klein-bottle'].includes(value)) return 'klein';
    if (['random', 'random_boundary', 'random-boundary', 'randomboundary'].includes(value)) return 'random';
    if (['polar', 'polar_center', 'polar-center', 'radial', 'radial_center'].includes(value)) return 'polar';
    return 'open2d';
}

function wrap(value, size) {
    return ((value % size) + size) % size;
}

function normalizeLattice(lattice) {
    const value = String(lattice || '').toLowerCase();
    if (value === 'honeycomb' || value === 'triangular') return value;
    return 'square';
}

const SQUARE_DIRECTIONS = Object.freeze([
    Object.freeze([1, 0]),
    Object.freeze([-1, 0]),
    Object.freeze([0, 1]),
    Object.freeze([0, -1])
]);

const TRIANGULAR_DIRECTIONS = Object.freeze([
    ...SQUARE_DIRECTIONS,
    Object.freeze([1, -1]),
    Object.freeze([-1, 1])
]);

function randomSeed() {
    return `go-random-boundary:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function boundaryTargets(size) {
    const targets = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (x === 0 || y === 0 || x === size - 1 || y === size - 1) targets.push([x, y]);
        }
    }
    return targets;
}

function randomExitKey(coord, axis, delta) {
    return `${coord[0]},${coord[1]}:${axis}:${Math.sign(delta)}`;
}

function randomDirectionKey(coord, direction) {
    const [dx = 0, dy = 0] = direction;
    if (dx !== 0 && dy === 0) return randomExitKey(coord, 0, dx);
    if (dy !== 0 && dx === 0) return randomExitKey(coord, 1, dy);
    return `${coord[0]},${coord[1]}:d:${Math.sign(dx)},${Math.sign(dy)}`;
}

function latticeDirections(lattice, coord) {
    if (lattice === 'triangular') return TRIANGULAR_DIRECTIONS;
    if (lattice === 'honeycomb') {
        return [[1, 0], [-1, 0], [0, (coord[0] + coord[1]) % 2 === 0 ? 1 : -1]];
    }
    return SQUARE_DIRECTIONS;
}

function createRandomBoundaryMap(size, seed = randomSeed(), lattice = 'square') {
    const rng = new SeededRandom(seed);
    const targets = boundaryTargets(size);
    const entries = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            for (const direction of latticeDirections(lattice, [x, y])) {
                const raw = [x + direction[0], y + direction[1]];
                if (raw[0] >= 0 && raw[0] < size && raw[1] >= 0 && raw[1] < size) continue;
                let target = targets[rng.integer(targets.length)] || [x, y];
                if (targets.length > 1 && target[0] === x && target[1] === y) {
                    target = targets[(targets.findIndex(([tx, ty]) => tx === target[0] && ty === target[1]) + 1) % targets.length];
                }
                entries.push([randomDirectionKey([x, y], direction), target]);
            }
        }
    }
    return entries;
}

function polarTotal(size) {
    return 1 + Math.max(0, size - 1) * size;
}

function polarKey(coord) {
    return `${coord[0]},${coord[1] || 0}`;
}

export class GoGameLogic {
    constructor(options = {}) {
        this.reset(options);
    }

    reset({ size = 9, dimension = 2, topology = 'open2d', lattice = 'square', komi = 7.5, randomBoundarySeed = '', randomBoundaryMap = null, pieceTime = null, pieceAges = null } = {}) {
        this.size = Number(size) || 9;
        this.dimension = Number(dimension) || 2;
        this.topology = normalizeTopology(topology);
        this.lattice = this.dimension === 2 ? normalizeLattice(lattice) : 'square';
        this.komi = Number.isFinite(Number(komi)) ? Number(komi) : 7.5;
        this.randomBoundarySeed = this.topology === 'random' ? (randomBoundarySeed || randomSeed()) : '';
        this.randomBoundaryMap = this.topology === 'random'
            ? new Map(Array.isArray(randomBoundaryMap) ? randomBoundaryMap : createRandomBoundaryMap(this.size, this.randomBoundarySeed, this.lattice))
            : new Map();
        this.total = this.topology === 'polar' && this.dimension === 2
            ? polarTotal(this.size)
            : this.size ** this.dimension;
        this.board = new Uint8Array(this.total);
        this.pauliLabels = Array(this.total).fill('I');
        this.pieceTime = normalizePieceTimeConfig(pieceTime);
        this.pieceAges = createAgeArray(this.total, pieceAges);
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

    setPieceTimeConfig(config = {}) {
        this.pieceTime = normalizePieceTimeConfig(config);
        if (!this.pieceAges || this.pieceAges.length !== this.total) this.pieceAges = createAgeArray(this.total);
    }

    pieceAgeAt(index) {
        return this.pieceAges?.[Number(index)] || 0;
    }

    pieceClockProgressAt(index) {
        return clockProgress(this.pieceAgeAt(index), this.pieceTime?.lifespan);
    }

    applyPieceTime(protectedIndexes = []) {
        return advanceIndexedPieceAges({
            board: this.board,
            labels: this.pauliLabels,
            ages: this.pieceAges,
            config: this.pieceTime,
            protectedIndexes
        });
    }

    coordKey(coord) {
        return this.topology === 'polar' && this.dimension === 2 ? polarKey(coord) : coord.join(',');
    }

    indexFromCoord(coord) {
        if (!this.containsCoord(coord)) return -1;
        if (this.topology === 'polar' && this.dimension === 2) {
            if (coord[0] === 0) return 0;
            return 1 + (coord[0] - 1) * this.size + wrap(coord[1] || 0, this.size);
        }
        if (this.dimension === 3) {
            return coord[0] + this.size * (coord[1] + this.size * coord[2]);
        }
        return coord[0] + this.size * coord[1];
    }

    coordFromIndex(index) {
        const value = Number(index);
        if (this.dimension === 3) {
            const z = Math.floor(value / (this.size * this.size));
            const rem = value - z * this.size * this.size;
            const y = Math.floor(rem / this.size);
            const x = rem - y * this.size;
            return [x, y, z];
        }
        if (this.topology === 'polar') {
            if (value <= 0) return [0, 0];
            const ring = Math.floor((value - 1) / this.size) + 1;
            const sector = (value - 1) % this.size;
            return [ring, sector];
        }
        const y = Math.floor(value / this.size);
        const x = value - y * this.size;
        return [x, y];
    }

    containsCoord(coord) {
        if (!Array.isArray(coord) || coord.length !== this.dimension) return false;
        if (this.topology === 'polar' && this.dimension === 2) {
            const ring = coord[0];
            const sector = coord[1] || 0;
            return Number.isInteger(ring)
                && Number.isInteger(sector)
                && ring >= 0
                && ring < this.size
                && (ring === 0 ? sector === 0 : sector >= 0 && sector < this.size);
        }
        return coord.every((value) => Number.isInteger(value) && value >= 0 && value < this.size);
    }

    isWrapAxis(axis) {
        if (this.topology === 'pbc') return axis === 0 || axis === 1;
        if (this.topology === 'cylinder') return axis === 0;
        return false;
    }

    stepCoord(coord, axis, delta) {
        const direction = Array(this.dimension).fill(0);
        direction[axis] = delta;
        return this.stepDirection(coord, direction);
    }

    stepDirection(coord, direction) {
        if (this.topology === 'polar' && this.dimension === 2) {
            if (!this.containsCoord(coord)) return null;
            const ring = coord[0];
            const sector = coord[1] || 0;
            const dr = direction[0] || 0;
            const ds = direction[1] || 0;
            if (ring === 0) {
                if (dr <= 0) return null;
                return [1, wrap(ds, this.size)];
            }
            const nextRing = ring + dr;
            if (nextRing < 0 || nextRing >= this.size) return null;
            if (nextRing === 0) return [0, 0];
            return [nextRing, wrap(sector + ds, this.size)];
        }
        if (this.topology === 'random' && this.dimension === 2) {
            const next = [coord[0] + (direction[0] || 0), coord[1] + (direction[1] || 0)];
            if (this.containsCoord(next)) return next;
            const target = this.randomBoundaryMap.get(randomDirectionKey(coord, direction));
            return target ? [...target] : null;
        }
        if (this.topology === 'klein' && this.dimension === 2) {
            let nextX = coord[0] + (direction[0] || 0);
            let nextY = coord[1] + (direction[1] || 0);
            if (nextY < 0 || nextY >= this.size) {
                nextX = this.size - 1 - nextX;
                nextY = wrap(nextY, this.size);
            }
            return [wrap(nextX, this.size), nextY];
        }
        const next = coord.map((value, axis) => value + (direction[axis] || 0));
        for (let axis = 0; axis < this.dimension; axis++) {
            if (next[axis] >= 0 && next[axis] < this.size) continue;
            if (!this.isWrapAxis(axis)) return null;
            next[axis] = wrap(next[axis], this.size);
        }
        return next;
    }

    neighborsFromCoord(coord) {
        const neighbors = [];
        if (this.topology === 'polar' && this.dimension === 2) {
            if (!this.containsCoord(coord)) return [];
            if (coord[0] === 0) {
                for (let sector = 0; sector < this.size; sector += 1) neighbors.push([1, sector]);
            } else {
                for (const direction of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
                    const next = this.stepDirection(coord, direction);
                    if (next) neighbors.push(next);
                }
            }
            return [...new Map(neighbors.map((neighbor) => [this.coordKey(neighbor), neighbor])).values()];
        }
        if (this.dimension === 2) {
            for (const direction of latticeDirections(this.lattice, coord)) {
                const next = this.stepDirection(coord, direction);
                if (next) neighbors.push(next);
            }
            return [...new Map(neighbors.map((neighbor) => [this.coordKey(neighbor), neighbor])).values()];
        }
        for (let axis = 0; axis < this.dimension; axis++) {
            for (const delta of [-1, 1]) {
                const next = this.stepCoord(coord, axis, delta);
                if (next) neighbors.push(next);
            }
        }
        return [...new Map(neighbors.map((neighbor) => [this.coordKey(neighbor), neighbor])).values()];
    }

    neighborsFromIndex(index) {
        return this.neighborsFromCoord(this.coordFromIndex(index))
            .map((coord) => this.indexFromCoord(coord))
            .filter((value) => value >= 0);
    }

    randomBoundaryLinks(limit = 28) {
        if (this.topology !== 'random') return [];
        return [...this.randomBoundaryMap.entries()].slice(0, limit).map(([key, target]) => {
            const [coordText] = key.split(':');
            return {
                from: coordText.split(',').map(Number),
                to: [...target]
            };
        });
    }

    allCoords() {
        if (this.topology === 'polar' && this.dimension === 2) {
            const coords = [[0, 0]];
            for (let ring = 1; ring < this.size; ring += 1) {
                for (let sector = 0; sector < this.size; sector += 1) coords.push([ring, sector]);
            }
            return coords;
        }
        const coords = [];
        if (this.dimension === 3) {
            for (let z = 0; z < this.size; z += 1) {
                for (let y = 0; y < this.size; y += 1) {
                    for (let x = 0; x < this.size; x += 1) coords.push([x, y, z]);
                }
            }
            return coords;
        }
        for (let y = 0; y < this.size; y += 1) {
            for (let x = 0; x < this.size; x += 1) coords.push([x, y]);
        }
        return coords;
    }

    serializeBoard(board = this.board) {
        return Array.from(board).join('');
    }

    getGroupAndLiberties(board, startIndex) {
        const color = board[startIndex];
        const group = new Set();
        const liberties = new Set();
        const stack = [startIndex];
        group.add(startIndex);

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
        if (this.scoringPending) return { ok: false, error: 'Counting is pending. Resume by starting a new game.' };
        if (color !== this.currentPlayer) return { ok: false, error: `It is ${this.currentPlayer}'s turn.` };
        if (!this.containsCoord(coord)) return { ok: false, error: 'Point is outside the board.' };

        const index = this.indexFromCoord(coord);
        const virtualEmptyIndexes = new Set((options.virtualEmptyIndexes || []).map(Number));
        if (this.board[index] !== COLORS.empty && !virtualEmptyIndexes.has(index)) return { ok: false, error: 'That point is occupied.' };

        const ownValue = colorToValue(color);
        const enemyValue = colorToValue(otherColor(color));
        const nextBoard = new Uint8Array(this.board);
        const nextLabels = [...this.pauliLabels];
        const nextAges = createAgeArray(nextBoard.length, this.pieceAges);
        for (const virtualIndex of virtualEmptyIndexes) {
            if (!Number.isInteger(virtualIndex) || virtualIndex < 0 || virtualIndex >= nextBoard.length) continue;
            nextBoard[virtualIndex] = COLORS.empty;
            nextLabels[virtualIndex] = 'I';
            nextAges[virtualIndex] = 0;
        }
        nextBoard[index] = ownValue;
        nextLabels[index] = normalizePauliLabel(options.pauli || options.pauliLabel || 'I');
        nextAges[index] = 0;

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
                    nextAges[stone] = 0;
                    captured++;
                }
            }
        }

        const own = this.getGroupAndLiberties(nextBoard, index);
        if (own.liberties.size === 0) {
            return { ok: false, error: 'Suicide is not allowed.' };
        }

        const timeResult = advanceIndexedPieceAges({
            board: nextBoard,
            labels: nextLabels,
            ages: nextAges,
            config: this.pieceTime,
            protectedIndexes: [index]
        });
        const serialized = this.serializeBoard(nextBoard);
        if (this.positionSet.has(serialized)) {
            return { ok: false, error: 'Superko: this board position already occurred.' };
        }

        this.board = nextBoard;
        this.pauliLabels = nextLabels;
        this.pieceAges = nextAges;
        this.captures[color] += captured;
        this.passCount = 0;
        this.countAgreements = { black: false, white: false };
        this.moveNumber++;
        this.moveHistory.unshift({
            type: 'play',
            color,
            coord: [...coord],
            captured,
            expired: timeResult.expired.map((stone) => this.coordFromIndex(stone)),
            number: this.moveNumber
        });
        this.positionHistory.push(serialized);
        this.positionSet.add(serialized);
        this.currentPlayer = otherColor(color);
        return { ok: true, captured, expired: timeResult.expired.length };
    }

    setPauliAt(coord, label) {
        const index = Array.isArray(coord) ? this.indexFromCoord(coord) : Number(coord);
        if (index < 0 || index >= this.pauliLabels.length || this.board[index] === COLORS.empty) {
            return { ok: false, error: 'Choose an occupied point.' };
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
        const timeResult = this.applyPieceTime();
        this.moveHistory.unshift({ type: 'pass', color, number: this.moveNumber, expired: timeResult.expired.map((stone) => this.coordFromIndex(stone)) });
        if (timeResult.expired.length) {
            const serialized = this.serializeBoard(this.board);
            this.positionHistory.push(serialized);
            this.positionSet.add(serialized);
        }
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

    computeAreaScore() {
        const score = {
            black: 0,
            white: this.komi,
            neutral: 0,
            komi: this.komi,
            scoring: 'graph-area',
            territoryRule: 'Empty regions are counted as territory only when every bordering stone on the selected board graph belongs to one player; otherwise the region is neutral.'
        };
        const visited = new Set();

        for (let index = 0; index < this.board.length; index++) {
            const value = this.board[index];
            if (value === COLORS.black) score.black++;
            if (value === COLORS.white) score.white++;
            if (value !== COLORS.empty || visited.has(index)) continue;

            const region = [];
            const borderColors = new Set();
            const borderStoneIndexes = { black: new Set(), white: new Set() };
            const stack = [index];
            visited.add(index);

            while (stack.length) {
                const current = stack.pop();
                region.push(current);
                for (const next of this.neighborsFromIndex(current)) {
                    const neighborValue = this.board[next];
                    if (neighborValue === COLORS.empty) {
                        if (!visited.has(next)) {
                            visited.add(next);
                            stack.push(next);
                        }
                    } else {
                        const color = valueToColor(neighborValue);
                        borderColors.add(color);
                        borderStoneIndexes[color]?.add(next);
                    }
                }
            }

            if (borderColors.size === 1) {
                const owner = [...borderColors][0];
                const polarCenterOnly = this.topology === 'polar'
                    && this.dimension === 2
                    && [...(borderStoneIndexes[owner] || [])].every((stoneIndex) => this.coordFromIndex(stoneIndex)[0] === 0);
                if (polarCenterOnly) score.neutral += region.length;
                else score[owner] += region.length;
            } else {
                score.neutral += region.length;
            }
        }

        score.black = Number(score.black.toFixed(1));
        score.white = Number(score.white.toFixed(1));
        score.neutral = Number(score.neutral.toFixed(1));
        score.margin = Number(Math.abs(score.black - score.white).toFixed(1));
        return score;
    }

    exportState() {
        return {
            version: 1,
            size: this.size,
            dimension: this.dimension,
            topology: this.topology,
            lattice: this.lattice,
            randomBoundarySeed: this.randomBoundarySeed,
            randomBoundaryMap: [...this.randomBoundaryMap.entries()],
            komi: this.komi,
            board: Array.from(this.board),
            pauliLabels: [...this.pauliLabels],
            pieceTime: { ...this.pieceTime },
            pieceAges: Array.from(this.pieceAges || []),
            cliffordGoEnabled: this.cliffordGoEnabled,
            currentPlayer: this.currentPlayer,
            captures: { ...this.captures },
            passCount: this.passCount,
            scoringPending: this.scoringPending,
            countAgreements: { ...this.countAgreements },
            gameOver: this.gameOver,
            winner: this.winner,
            score: this.score ? { ...this.score } : null,
            moveNumber: this.moveNumber,
            moveHistory: this.moveHistory.map((item) => ({ ...item, coord: item.coord ? [...item.coord] : undefined })),
            positionHistory: [...this.positionHistory]
        };
    }

    importState(state) {
        if (!state || typeof state !== 'object') return;
        this.size = Number(state.size) || 9;
        this.dimension = Number(state.dimension) || 2;
        this.topology = normalizeTopology(state.topology);
        this.lattice = this.dimension === 2 ? normalizeLattice(state.lattice) : 'square';
        this.randomBoundarySeed = this.topology === 'random' ? (state.randomBoundarySeed || randomSeed()) : '';
        this.randomBoundaryMap = this.topology === 'random'
            ? new Map(Array.isArray(state.randomBoundaryMap) ? state.randomBoundaryMap : createRandomBoundaryMap(this.size, this.randomBoundarySeed, this.lattice))
            : new Map();
        this.komi = Number.isFinite(Number(state.komi)) ? Number(state.komi) : 7.5;
        this.total = this.size ** this.dimension;
        this.board = new Uint8Array(this.total);
        this.pauliLabels = Array(this.total).fill('I');
        this.pieceTime = normalizePieceTimeConfig(state.pieceTime);
        this.pieceAges = createAgeArray(this.total, state.pieceAges);
        if (Array.isArray(state.board)) {
            for (let i = 0; i < Math.min(this.board.length, state.board.length); i++) {
                const value = Number(state.board[i]);
                this.board[i] = value === COLORS.white ? COLORS.white : value === COLORS.black ? COLORS.black : COLORS.empty;
            }
        }
        if (Array.isArray(state.pauliLabels)) {
            for (let i = 0; i < Math.min(this.pauliLabels.length, state.pauliLabels.length); i++) {
                this.pauliLabels[i] = normalizePauliLabel(state.pauliLabels[i]);
                if (this.board[i] === COLORS.empty) this.pauliLabels[i] = 'I';
            }
        }
        this.cliffordGoEnabled = Boolean(state.cliffordGoEnabled);
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
        this.winner = state.winner || '';
        this.score = state.score ? { ...state.score } : null;
        this.moveNumber = Number(state.moveNumber) || 0;
        this.moveHistory = Array.isArray(state.moveHistory) ? state.moveHistory.map((item) => ({ ...item })) : [];
        this.positionHistory = Array.isArray(state.positionHistory) && state.positionHistory.length
            ? [...state.positionHistory]
            : [this.serializeBoard(this.board)];
        this.positionSet = new Set(this.positionHistory);
    }
}
