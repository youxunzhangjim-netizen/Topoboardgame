import {
    SPHERE_GO_TOPOLOGY,
    isSphereNorthPole,
    isSphereSouthPole,
    sphereContainsCoord,
    sphereLatitudeRingNeighbors,
    sphereNorthPoleCoord,
    sphereSouthPoleCoord
} from './SphereGoTopology.js';
import {
    KLEIN_BOTTLE_TOPOLOGY,
    kleinBottleNeighbors,
    kleinContainsCoord
} from './KleinBottleTopology.js';
import {
    MOBIUS_GO_TOPOLOGY,
    RP2_GO_TOPOLOGY,
    mobiusNeighbors,
    mobiusStepCoord,
    nonOrientableContainsCoord,
    rp2Neighbors,
    rp2StepCoord
} from './NonOrientableGoTopology.js';
import {
    algebraicPressureForIndex,
    normalizePauliLabel,
    setPauliLabel
} from '../../../js/algebra/PauliAlgebra.js';
import { SeededRandom } from '../../../js/probability/SeededRandom.js';

export const R3_STANDARD_TOPOLOGY = 'r3';
export const T3_PBC_TOPOLOGY = 't3';
export const R3_RANDOM_TOPOLOGY = 'r3_random';
export const R3_RP3_TOPOLOGY = 'rp3';
export const CYLINDER_GO_TOPOLOGY = 'cylinder';
export const SQUARE_LATTICE = 'square';
export const HONEYCOMB_LATTICE = 'honeycomb';
export const TRIANGULAR_LATTICE = 'triangular';
export const KAGOME_LATTICE = 'kagome';
export const SIMPLE_CUBIC_LATTICE = 'sc';
export const BCC_LATTICE = 'bcc';
export const FCC_LATTICE = 'fcc';
export const HCP_LATTICE = 'hcp';

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

function triangularDirections(coord = [0, 0]) {
    const row = coord[1] || 0;
    return row % 2 === 0
        ? [[-1, 0], [1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]]
        : [[-1, 0], [1, 0], [0, -1], [1, -1], [0, 1], [1, 1]];
}

function honeycombDirections(coord = [0, 0]) {
    const [x = 0, y = 0] = coord;
    const evenRow = y % 2 === 0;
    const evenVertex = (x + y) % 2 === 0;
    if (evenRow) {
        return evenVertex
            ? [[1, 0], [-1, -1], [-1, 1]]
            : [[-1, 0], [0, -1], [0, 1]];
    }
    return evenVertex
        ? [[1, 0], [0, -1], [0, 1]]
        : [[-1, 0], [1, -1], [1, 1]];
}

function kagomeEdgeAllowed(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    if (dy === 0 && Math.abs(dx) === 1) return true;
    if (Math.abs(dy) !== 1) return false;
    const top = a[1] < b[1] ? a : b;
    const bottom = a[1] < b[1] ? b : a;
    const downRightDelta = top[1] % 2 === 0 ? 0 : 1;
    const isDownRight = bottom[0] - top[0] === downRightDelta;
    return isDownRight === ((top[0] + top[1]) % 2 === 0);
}

function kagomeDirections(coord = [0, 0]) {
    return triangularDirections(coord).filter((direction) =>
        kagomeEdgeAllowed(coord, [coord[0] + direction[0], coord[1] + direction[1]]));
}

const SIMPLE_CUBIC_DIRECTIONS = Object.freeze([
    Object.freeze([1, 0, 0]),
    Object.freeze([-1, 0, 0]),
    Object.freeze([0, 1, 0]),
    Object.freeze([0, -1, 0]),
    Object.freeze([0, 0, 1]),
    Object.freeze([0, 0, -1])
]);

const BCC_DIRECTIONS = Object.freeze(
    [-1, 1].flatMap((dx) =>
        [-1, 1].flatMap((dy) =>
            [-1, 1].map((dz) => Object.freeze([dx, dy, dz]))))
);

const FCC_DIRECTIONS = Object.freeze([
    ...[-1, 1].flatMap((a) => [-1, 1].map((b) => Object.freeze([a, b, 0]))),
    ...[-1, 1].flatMap((a) => [-1, 1].map((b) => Object.freeze([a, 0, b]))),
    ...[-1, 1].flatMap((a) => [-1, 1].map((b) => Object.freeze([0, a, b])))
]);

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

function randomSeed() {
    return `go-3d-rbc:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function normalizeLattice(lattice, dimension) {
    const value = String(lattice || '').toLowerCase();
    if (dimension === 3) {
        if ([BCC_LATTICE, FCC_LATTICE, HCP_LATTICE].includes(value)) return value;
        return SIMPLE_CUBIC_LATTICE;
    }
    if ([HONEYCOMB_LATTICE, TRIANGULAR_LATTICE, KAGOME_LATTICE].includes(value)) return value;
    return SQUARE_LATTICE;
}

function hcpDirections(coord) {
    const layerSign = coord[2] % 2 === 0 ? -1 : 1;
    return [
        ...TRIANGULAR_DIRECTIONS.map(([dx, dy]) => [dx, dy, 0]),
        [0, 0, 1],
        [layerSign, 0, 1],
        [0, layerSign, 1],
        [0, 0, -1],
        [layerSign, 0, -1],
        [0, layerSign, -1]
    ];
}

function boundaryTargets3D(size) {
    const targets = [];
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (x === 0 || y === 0 || z === 0 || x === size - 1 || y === size - 1 || z === size - 1) {
                    targets.push([x, y, z]);
                }
            }
        }
    }
    return targets;
}

function randomExitKey3D(coord, axis, delta) {
    return `${coord.join(',')}:${axis}:${Math.sign(delta)}`;
}

function positiveMod(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

function rp3StepCoord3D(coord, direction, size) {
    const next = coord.map((value, axis) => value + (direction[axis] || 0));
    const outsideAxes = next
        .map((value, axis) => (value < 0 || value >= size ? axis : -1))
        .filter((axis) => axis >= 0);
    if (!outsideAxes.length) return next;
    const mapped = [...next];
    for (const boundaryAxis of outsideAxes) {
        mapped[boundaryAxis] = mapped[boundaryAxis] < 0 ? size - 1 : 0;
        for (let axis = 0; axis < 3; axis += 1) {
            if (axis === boundaryAxis) continue;
            mapped[axis] = size - 1 - positiveMod(mapped[axis], size);
        }
    }
    return mapped;
}

function createRandomBoundaryMap3D(size, seed = randomSeed()) {
    const rng = new SeededRandom(seed);
    const targets = boundaryTargets3D(size);
    const entries = [];
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const coord = [x, y, z];
                for (let axis = 0; axis < 3; axis++) {
                    for (const delta of [-1, 1]) {
                        const raw = coord[axis] + delta;
                        if (raw >= 0 && raw < size) continue;
                        let target = targets[rng.integer(targets.length)] || coord;
                        if (targets.length > 1 && target[0] === x && target[1] === y && target[2] === z) {
                            const index = targets.findIndex(([tx, ty, tz]) => tx === target[0] && ty === target[1] && tz === target[2]);
                            target = targets[(index + 1) % targets.length];
                        }
                        entries.push([randomExitKey3D(coord, axis, delta), target]);
                    }
                }
            }
        }
    }
    return entries;
}

export class GoGameLogic {
    constructor(options = {}) {
        this.reset(options);
    }

    reset({ size = 9, width = size, height = size, dimension = 2, topology = 'open2d', lattice = '', komi = 7.5, randomBoundarySeed = '', randomBoundaryMap = null } = {}) {
        this.size = Number(size) || 9;
        this.width = Number(width) || this.size;
        this.height = Number(height) || this.size;
        this.dimension = Number(dimension) || 2;
        this.topology = topology || 'open2d';
        this.lattice = normalizeLattice(lattice, this.dimension);
        this.komi = Number.isFinite(Number(komi)) ? Number(komi) : 7.5;
        this.randomBoundarySeed = this.topology === R3_RANDOM_TOPOLOGY ? (randomBoundarySeed || randomSeed()) : '';
        this.randomBoundaryMap = this.topology === R3_RANDOM_TOPOLOGY
            ? new Map(Array.isArray(randomBoundaryMap) ? randomBoundaryMap : createRandomBoundaryMap3D(this.size, this.randomBoundarySeed))
            : new Map();
        this.total = this.dimension === 3
            ? this.size ** 3
            : this.width * this.height + (this.topology === SPHERE_GO_TOPOLOGY ? 2 : 0);
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

    indexFromCoord(coord) {
        if (!this.containsCoord(coord)) return -1;
        if (this.dimension === 3) {
            return coord[0] + this.size * (coord[1] + this.size * coord[2]);
        }
        if (this.topology === SPHERE_GO_TOPOLOGY) {
            const surfaceTotal = this.width * this.height;
            if (isSphereNorthPole(coord, this.height)) return surfaceTotal;
            if (isSphereSouthPole(coord, this.height)) return surfaceTotal + 1;
        }
        return coord[0] + this.width * coord[1];
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
        if (this.topology === SPHERE_GO_TOPOLOGY) {
            const surfaceTotal = this.width * this.height;
            if (value === surfaceTotal) return sphereNorthPoleCoord();
            if (value === surfaceTotal + 1) return sphereSouthPoleCoord(this.height);
        }
        const y = Math.floor(value / this.width);
        const x = value - y * this.width;
        return [x, y];
    }

    containsCoord(coord) {
        if (this.topology === SPHERE_GO_TOPOLOGY) {
            return sphereContainsCoord(coord, this.width, this.height);
        }
        if (this.topology === KLEIN_BOTTLE_TOPOLOGY) {
            return kleinContainsCoord(coord, this.width, this.height);
        }
        if (this.topology === MOBIUS_GO_TOPOLOGY || this.topology === RP2_GO_TOPOLOGY) {
            return nonOrientableContainsCoord(coord, this.width, this.height);
        }
        const inside = Array.isArray(coord)
            && coord.length === this.dimension
            && coord.every((value, axis) => Number.isInteger(value)
                && value >= 0
                && value < (this.dimension === 3 ? this.size : axis === 0 ? this.width : this.height));
        if (!inside || this.dimension !== 3 || this.topology !== R3_STANDARD_TOPOLOGY) return inside;
        if (this.lattice === BCC_LATTICE) {
            return coord[0] % 2 === coord[1] % 2 && coord[1] % 2 === coord[2] % 2;
        }
        if (this.lattice === FCC_LATTICE) return (coord[0] + coord[1] + coord[2]) % 2 === 0;
        return true;
    }

    playableCoords() {
        const coords = [];
        if (this.dimension === 3) {
            for (let z = 0; z < this.size; z++) {
                for (let y = 0; y < this.size; y++) {
                    for (let x = 0; x < this.size; x++) {
                        const coord = [x, y, z];
                        if (this.containsCoord(coord)) coords.push(coord);
                    }
                }
            }
            return coords;
        }
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) coords.push([x, y]);
        }
        if (this.topology === SPHERE_GO_TOPOLOGY) {
            coords.push(sphereNorthPoleCoord(), sphereSouthPoleCoord(this.height));
        }
        return coords;
    }

    isPlayableIndex(index) {
        return Number.isInteger(index)
            && index >= 0
            && index < this.board.length
            && this.containsCoord(this.coordFromIndex(index));
    }

    isWrapAxis(axis) {
        if (this.topology === 't2') return axis === 0 || axis === 1;
        if (this.topology === T3_PBC_TOPOLOGY) return axis === 0 || axis === 1 || axis === 2;
        if (this.topology === CYLINDER_GO_TOPOLOGY || this.topology === 'pbc-x') return axis === 0;
        return false;
    }

    stepCoord(coord, axis, delta) {
        const direction = Array(this.dimension).fill(0);
        direction[axis] = delta;
        return this.stepDirection(coord, direction);
    }

    stepDirection(coord, direction) {
        const next = coord.map((value, axis) => value + (direction[axis] || 0));
        if (this.topology === MOBIUS_GO_TOPOLOGY && this.dimension === 2) {
            return mobiusStepCoord(coord, direction, this.width, this.height);
        }
        if (this.topology === RP2_GO_TOPOLOGY && this.dimension === 2) {
            return rp2StepCoord(coord, direction, this.width, this.height);
        }
        if (this.topology === R3_RP3_TOPOLOGY && this.dimension === 3) {
            const mapped = rp3StepCoord3D(coord, direction, this.size);
            return this.containsCoord(mapped) ? mapped : null;
        }
        if (this.topology === R3_RANDOM_TOPOLOGY && this.dimension === 3) {
            const changedAxes = direction
                .map((value, axis) => value ? axis : -1)
                .filter((axis) => axis >= 0);
            if (changedAxes.length !== 1) return null;
            const axis = changedAxes[0];
            if (next[axis] >= 0 && next[axis] < this.size) return next;
            const target = this.randomBoundaryMap.get(randomExitKey3D(coord, axis, direction[axis]));
            return target ? [...target] : null;
        }
        for (let axis = 0; axis < this.dimension; axis++) {
            const axisSize = this.dimension === 3 ? this.size : axis === 0 ? this.width : this.height;
            if (next[axis] >= 0 && next[axis] < axisSize) continue;
            if (!this.isWrapAxis(axis)) return null;
            next[axis] = (next[axis] + axisSize) % axisSize;
        }
        return this.containsCoord(next) ? next : null;
    }

    latticeDirections(coord) {
        if (this.dimension === 2) {
            if (this.lattice === TRIANGULAR_LATTICE) return triangularDirections(coord);
            if (this.lattice === HONEYCOMB_LATTICE) return honeycombDirections(coord);
            if (this.lattice === KAGOME_LATTICE) return kagomeDirections(coord);
            return SQUARE_DIRECTIONS;
        }
        if (this.lattice === BCC_LATTICE) return BCC_DIRECTIONS;
        if (this.lattice === FCC_LATTICE) return FCC_DIRECTIONS;
        if (this.lattice === HCP_LATTICE) return hcpDirections(coord);
        return SIMPLE_CUBIC_DIRECTIONS;
    }

    neighborsFromCoord(coord) {
        if (!this.containsCoord(coord)) return [];
        if (this.topology === SPHERE_GO_TOPOLOGY) {
            return sphereLatitudeRingNeighbors(coord, this.width, this.height);
        }
        if (this.topology === KLEIN_BOTTLE_TOPOLOGY) {
            return kleinBottleNeighbors(coord, this.width, this.height);
        }
        if (this.topology === MOBIUS_GO_TOPOLOGY) {
            return mobiusNeighbors(coord, this.width, this.height);
        }
        if (this.topology === RP2_GO_TOPOLOGY) {
            return rp2Neighbors(coord, this.width, this.height);
        }
        return [...new Map(this.latticeDirections(coord)
            .map((direction) => this.stepDirection(coord, direction))
            .filter(Boolean)
            .map((neighbor) => [this.coordKey(neighbor), neighbor])).values()];
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
        for (const virtualIndex of virtualEmptyIndexes) {
            if (!Number.isInteger(virtualIndex) || virtualIndex < 0 || virtualIndex >= nextBoard.length) continue;
            nextBoard[virtualIndex] = COLORS.empty;
            nextLabels[virtualIndex] = 'I';
        }
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
        if (own.liberties.size === 0) {
            return { ok: false, error: 'Suicide is not allowed.' };
        }

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
        this.moveHistory.unshift({
            type: 'play',
            color,
            coord: [...coord],
            captured,
            number: this.moveNumber
        });
        this.positionHistory.push(serialized);
        this.positionSet.add(serialized);
        this.currentPlayer = otherColor(color);
        return { ok: true, captured };
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
        return Array.from({ length: this.board.length }, (_, index) => index)
            .filter((index) => this.isPlayableIndex(index));
    }

    emptyRegionInfo(board, startIndex, ignoredStones = new Set()) {
        const region = [];
        const borderColors = new Set();
        const borderStoneIndexes = { black: new Set(), white: new Set() };
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
                if (color) {
                    borderColors.add(color);
                    borderStoneIndexes[color]?.add(next);
                }
            }
        }

        return { region, borderColors, borderStoneIndexes };
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
            territoryRule: 'Dead-stone candidates fully inside one opponent-owned liberty region are removed first. Empty regions are then territory only when every bordering live stone belongs to one player; otherwise the region is neutral.',
            territorySites: {
                black: [],
                white: [],
                neutral: []
            }
        };
        for (const index of deadCandidates) {
            const color = valueToColor(this.board[index]);
            if (color === 'black') score.deadBlack++;
            if (color === 'white') score.deadWhite++;
        }
        const visited = new Set();

        for (let index = 0; index < this.board.length; index++) {
            if (!this.isPlayableIndex(index)) continue;
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
                score.territorySites[owner].push(...region.map((point) => this.coordFromIndex(point)));
            } else {
                score.neutral += region.length;
                score.territorySites.neutral.push(...region.map((point) => this.coordFromIndex(point)));
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
            version: 1,
            size: this.size,
            width: this.width,
            height: this.height,
            dimension: this.dimension,
            topology: this.topology,
            lattice: this.lattice,
            komi: this.komi,
            randomBoundarySeed: this.randomBoundarySeed,
            randomBoundaryMap: [...this.randomBoundaryMap.entries()],
            board: Array.from(this.board),
            pauliLabels: [...this.pauliLabels],
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
        this.width = Number(state.width) || this.size;
        this.height = Number(state.height) || this.size;
        this.dimension = Number(state.dimension) || 2;
        this.topology = state.topology || 'open2d';
        this.lattice = normalizeLattice(state.lattice, this.dimension);
        this.komi = Number.isFinite(Number(state.komi)) ? Number(state.komi) : 7.5;
        this.randomBoundarySeed = this.topology === R3_RANDOM_TOPOLOGY ? (state.randomBoundarySeed || randomSeed()) : '';
        this.randomBoundaryMap = this.topology === R3_RANDOM_TOPOLOGY
            ? new Map(Array.isArray(state.randomBoundaryMap) ? state.randomBoundaryMap : createRandomBoundaryMap3D(this.size, this.randomBoundarySeed))
            : new Map();
        this.total = this.dimension === 3
            ? this.size ** 3
            : this.width * this.height + (this.topology === SPHERE_GO_TOPOLOGY ? 2 : 0);
        this.board = new Uint8Array(this.total);
        this.pauliLabels = Array(this.total).fill('I');
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
