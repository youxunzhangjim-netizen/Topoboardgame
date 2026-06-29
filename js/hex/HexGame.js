import {
    createSpecialBoardTopology,
    isSpecialBoardTopology,
    normalizeSpecialTopology
} from '../topology/SpecialBoardTopologies.js';

export const HEX_COLORS = Object.freeze({
    BLACK: 'black',
    WHITE: 'white'
});

const HEX_COLOR_VALUES = new Set(Object.values(HEX_COLORS));
const SUPPORTED_DIMENSIONS = new Set([2, 3, 4]);
const TOPOLOGY_ALIASES = Object.freeze({
    open: 'open',
    flat: 'open',
    plane: 'open',
    rhombus: 'open',
    r2: 'open',
    r3: 'open',
    r4: 'open',
    cube: 'open',
    hypercube: 'open',
    cylinder: 'cylinder',
    cylindrical: 'cylinder',
    torus: 'torus',
    t2: 'torus',
    t3: 'torus',
    t4: 'torus',
    '4d-torus': 'torus',
    reflective: 'reflective',
    mobius: 'mobius',
    'mobius-strip': 'mobius',
    'möbius': 'mobius',
    klein: 'klein',
    'klein-bottle': 'klein',
    rp2: 'rp2',
    projective: 'rp2',
    'projective-plane': 'rp2',
    random: 'random',
    'random-boundary': 'random',
    rbc: 'random'
});

export function otherHexColor(color) {
    if (color === HEX_COLORS.BLACK) return HEX_COLORS.WHITE;
    if (color === HEX_COLORS.WHITE) return HEX_COLORS.BLACK;
    throw new TypeError(`Unknown Hex color: ${String(color)}`);
}

function normalizeDimension(value) {
    const dimension = Number(value);
    if (!SUPPORTED_DIMENSIONS.has(dimension)) {
        throw new RangeError('Hex dimension must be 2, 3, or 4.');
    }
    return dimension;
}

function normalizeAxisSize(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(2, Math.min(64, Math.floor(parsed)));
}

export function normalizeHexSize(size, dimension = 2) {
    const normalizedDimension = normalizeDimension(dimension);
    const fallback = normalizedDimension === 2 ? 11 : normalizedDimension === 3 ? 7 : 5;

    if (Array.isArray(size)) {
        return Array.from(
            { length: normalizedDimension },
            (_, axis) => normalizeAxisSize(size[axis], fallback)
        );
    }

    if (size && typeof size === 'object') {
        const axisNames = ['x', 'y', 'z', 'w'];
        return axisNames
            .slice(0, normalizedDimension)
            .map((axis) => normalizeAxisSize(size[axis], fallback));
    }

    const uniformSize = normalizeAxisSize(size, fallback);
    return Array(normalizedDimension).fill(uniformSize);
}

export function normalizeHexTopology(topology = 'open', dimension = 2) {
    const normalizedDimension = normalizeDimension(dimension);
    const token = String(topology ?? 'open')
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-');
    const special = normalizeSpecialTopology(token);
    if (special) return special;
    const normalized = TOPOLOGY_ALIASES[token] ?? 'open';

    if (normalizedDimension === 2) {
        return normalized === 'reflective' ? 'open' : normalized;
    }
    return ['open', 'cylinder', 'torus', 'reflective'].includes(normalized)
        ? normalized
        : 'open';
}

export function normalizeHexLattice(lattice = 'hexagonal', dimension = 2) {
    if (normalizeDimension(dimension) !== 2) return 'axis';
    const token = String(lattice || '').trim().toLowerCase();
    if (token === 'square') return 'square';
    if (token === 'honeycomb') return 'honeycomb';
    return 'hexagonal';
}

function modulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

function reflect(value, size) {
    return size - 1 - value;
}

function coordinateKey(coordinate) {
    return coordinate.join(',');
}

function parseCoordinateKey(key, dimension) {
    const coordinate = String(key).split(',').map(Number);
    if (
        coordinate.length !== dimension ||
        coordinate.some((value) => !Number.isInteger(value))
    ) {
        throw new TypeError(`Invalid ${dimension}D Hex coordinate key: ${String(key)}`);
    }
    return coordinate;
}

function coordinatesEqual(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizeCoordinateInput(coordinate, dimension) {
    if (!Array.isArray(coordinate) || coordinate.length !== dimension) return null;
    const normalized = coordinate.map(Number);
    return normalized.every(Number.isInteger) ? normalized : null;
}

function normalize2DCoordinate(coordinate, size, topology, randomBoundary = null) {
    let [x, y] = coordinate;
    const [width, height] = size;

    if (topology === 'open') {
        return x >= 0 && x < width && y >= 0 && y < height ? [x, y] : null;
    }

    if (topology === 'cylinder') {
        return y >= 0 && y < height ? [modulo(x, width), y] : null;
    }

    if (topology === 'torus') {
        return [modulo(x, width), modulo(y, height)];
    }

    if (topology === 'mobius') {
        if (y < 0 || y >= height) return null;
        if (x < 0 || x >= width) {
            const crossings = Math.floor(x / width);
            x = modulo(x, width);
            if (Math.abs(crossings) % 2 === 1) y = reflect(y, height);
        }
        return [x, y];
    }

    if (topology === 'klein') {
        if (y < 0 || y >= height) {
            const crossings = Math.floor(y / height);
            y = modulo(y, height);
            if (Math.abs(crossings) % 2 === 1) x = reflect(x, width);
        }
        return [modulo(x, width), y];
    }

    if (topology === 'rp2') {
        let guard = 0;
        while ((x < 0 || x >= width || y < 0 || y >= height) && guard < 4) {
            if (x < 0 || x >= width) {
                x = modulo(x, width);
                y = reflect(y, height);
            }
            if (y < 0 || y >= height) {
                y = modulo(y, height);
                x = reflect(x, width);
            }
            guard += 1;
        }
        return x >= 0 && x < width && y >= 0 && y < height ? [x, y] : null;
    }

    if (topology === 'random' && randomBoundary) {
        let guard = 0;
        while ((x < 0 || x >= width || y < 0 || y >= height) && guard < 4) {
            if (x < 0) {
                x = width - 1;
                y = randomBoundary.xInverse[modulo(y, height)];
            } else if (x >= width) {
                x = 0;
                y = randomBoundary.xForward[modulo(y, height)];
            }
            if (y < 0) {
                y = height - 1;
                x = randomBoundary.yInverse[modulo(x, width)];
            } else if (y >= height) {
                y = 0;
                x = randomBoundary.yForward[modulo(x, width)];
            }
            guard += 1;
        }
        return x >= 0 && x < width && y >= 0 && y < height ? [x, y] : null;
    }

    return null;
}

function hashSeed(seed) {
    let hash = 2166136261;
    for (const character of String(seed)) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function seededPermutation(length, seed) {
    const values = Array.from({ length }, (_, index) => index);
    let state = hashSeed(seed) || 1;
    const random = () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 0x100000000;
    };
    for (let index = values.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(random() * (index + 1));
        [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
}

function invertPermutation(permutation) {
    const inverse = Array(permutation.length);
    permutation.forEach((value, index) => {
        inverse[value] = index;
    });
    return inverse;
}

function createRandomBoundary(size, seed) {
    const xForward = seededPermutation(size[1], `${seed}:x`);
    const yForward = seededPermutation(size[0], `${seed}:y`);
    return Object.freeze({
        xForward: Object.freeze(xForward),
        xInverse: Object.freeze(invertPermutation(xForward)),
        yForward: Object.freeze(yForward),
        yInverse: Object.freeze(invertPermutation(yForward))
    });
}

function normalizeHigherDimCoordinate(coordinate, size, topology) {
    if (topology === 'torus') {
        return coordinate.map((value, axis) => modulo(value, size[axis]));
    }

    if (topology === 'cylinder') {
        const lastAxis = coordinate.length - 1;
        if (coordinate.some((value, axis) => axis !== lastAxis && (value < 0 || value >= size[axis]))) {
            return null;
        }
        const normalized = [...coordinate];
        normalized[lastAxis] = modulo(normalized[lastAxis], size[lastAxis]);
        return normalized;
    }

    // Nearest-neighbor reflection produces the same simple graph as an open
    // boundary after self-neighbors are removed, while retaining its UI label.
    return coordinate.every((value, axis) => value >= 0 && value < size[axis])
        ? coordinate
        : null;
}

function createGoalDefinition(dimension, size, topology, customGoalZones) {
    if (customGoalZones) {
        const normalizeZone = (zone, label) => {
            if (!zone || typeof zone.start !== 'function' || typeof zone.end !== 'function') {
                throw new TypeError(`${label} goal zone must provide start() and end() predicates.`);
            }
            return Object.freeze({
                type: zone.type || 'marked-zones',
                label: zone.label || label,
                start: zone.start,
                end: zone.end
            });
        };
        return Object.freeze({
            black: normalizeZone(customGoalZones.black, 'black'),
            white: normalizeZone(customGoalZones.white, 'white')
        });
    }

    const xHasPhysicalSides = dimension === 2
        ? topology === 'open'
        : topology !== 'torus';
    const yHasPhysicalSides = dimension === 2
        ? topology === 'open' || topology === 'cylinder' || topology === 'mobius'
        : topology !== 'torus';
    const xEnd = xHasPhysicalSides ? size[0] - 1 : Math.floor(size[0] / 2);
    const yEnd = yHasPhysicalSides ? size[1] - 1 : Math.floor(size[1] / 2);

    return Object.freeze({
        black: Object.freeze({
            type: xHasPhysicalSides ? 'physical-sides' : 'marked-cut-zones',
            label: xHasPhysicalSides ? 'x-low / x-high' : 'x cut-seam zones',
            start: (coordinate) => coordinate[0] === 0,
            end: (coordinate) => coordinate[0] === xEnd
        }),
        white: Object.freeze({
            type: yHasPhysicalSides ? 'physical-sides' : 'marked-cut-zones',
            label: yHasPhysicalSides ? 'y-low / y-high' : 'y cut-seam zones',
            start: (coordinate) => coordinate[1] === 0,
            end: (coordinate) => coordinate[1] === yEnd
        })
    });
}

function enumerateCoordinates(size) {
    const coordinates = [];
    const current = Array(size.length).fill(0);

    const visit = (axis) => {
        if (axis === size.length) {
            coordinates.push([...current]);
            return;
        }
        for (let value = 0; value < size[axis]; value += 1) {
            current[axis] = value;
            visit(axis + 1);
        }
    };

    visit(0);
    return coordinates;
}

export function createHexTopology(options = {}) {
    const dimension = normalizeDimension(options.dimension ?? 2);
    const size = Object.freeze(normalizeHexSize(options.size, dimension));
    const topology = normalizeHexTopology(options.topology, dimension);
    if (isSpecialBoardTopology(topology)) {
        return createSpecialBoardTopology({ ...options, dimension, size, topology });
    }
    const lattice = normalizeHexLattice(options.lattice, dimension);
    const randomBoundarySeed = topology === 'random'
        ? String(options.randomBoundarySeed || `hex-rbc:${size.join('x')}`)
        : '';
    const randomBoundary = topology === 'random'
        ? createRandomBoundary(size, randomBoundarySeed)
        : null;
    const goalZones = createGoalDefinition(dimension, size, topology, options.goalZones);

    const normalize = (coordinate) => {
        const parsed = normalizeCoordinateInput(coordinate, dimension);
        if (!parsed) return null;
        if (dimension === 2) return normalize2DCoordinate(parsed, size, topology, randomBoundary);
        return normalizeHigherDimCoordinate(parsed, size, topology);
    };

    const neighborOffsets = dimension === 2
        ? lattice === 'square'
            ? [[1, 0], [-1, 0], [0, 1], [0, -1]]
            : lattice === 'honeycomb'
                ? null
                : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]
        : Array.from({ length: dimension * 2 }, (_, index) => {
            const offset = Array(dimension).fill(0);
            const axis = Math.floor(index / 2);
            offset[axis] = index % 2 === 0 ? 1 : -1;
            return offset;
        });

    const offsetsFor = (origin) => neighborOffsets || [
        [1, 0],
        [-1, 0],
        [0, (origin[0] + origin[1]) % 2 === 0 ? 1 : -1]
    ];

    const randomAdjacency = topology === 'random'
        ? (() => {
            const adjacency = new Map(enumerateCoordinates(size).map((coordinate) => [coordinateKey(coordinate), new Map()]));
            for (const origin of enumerateCoordinates(size)) {
                const originKey = coordinateKey(origin);
                for (const offset of offsetsFor(origin)) {
                    const candidate = normalize(origin.map((value, axis) => value + offset[axis]));
                    if (!candidate || coordinatesEqual(candidate, origin)) continue;
                    const candidateKey = coordinateKey(candidate);
                    adjacency.get(originKey).set(candidateKey, candidate);
                    adjacency.get(candidateKey).set(originKey, origin);
                }
            }
            return adjacency;
        })()
        : null;

    const neighbors = (coordinate) => {
        const origin = normalize(coordinate);
        if (!origin) return [];
        if (randomAdjacency) {
            return [...(randomAdjacency.get(coordinateKey(origin))?.values() || [])].map((item) => [...item]);
        }
        const seen = new Set();
        const result = [];

        for (const offset of offsetsFor(origin)) {
            const candidate = normalize(origin.map((value, axis) => value + offset[axis]));
            if (!candidate || coordinatesEqual(candidate, origin)) continue;
            const key = coordinateKey(candidate);
            if (seen.has(key)) continue;
            seen.add(key);
            result.push(candidate);
        }
        return result;
    };

    return Object.freeze({
        dimension,
        size,
        topology,
        lattice,
        isWrapped: ['cylinder', 'torus', 'mobius', 'klein', 'rp2', 'random'].includes(topology),
        randomBoundarySeed,
        randomBoundary,
        goalZones,
        normalize,
        neighbors,
        key(coordinate) {
            const normalized = normalize(coordinate);
            return normalized ? coordinateKey(normalized) : null;
        },
        coordinate(key) {
            const parsed = parseCoordinateKey(key, dimension);
            const normalized = normalize(parsed);
            if (!normalized || !coordinatesEqual(parsed, normalized)) {
                throw new RangeError(`Coordinate key is outside this Hex topology: ${String(key)}`);
            }
            return normalized;
        },
        coordinates() {
            return enumerateCoordinates(size);
        }
    });
}

function cloneHistoryEntry(entry) {
    return {
        move: entry.move,
        color: entry.color,
        coordinate: [...entry.coordinate]
    };
}

export class HexGame {
    constructor(options = {}) {
        this.allowPass = options.allowPass === true;
        this.startingColor = HEX_COLOR_VALUES.has(options.startingColor)
            ? options.startingColor
            : HEX_COLORS.BLACK;
        this.topology = createHexTopology(options);
        this.board = new Map();
        this.currentColor = this.startingColor;
        this.winner = null;
        this.moveNumber = 0;
        this.history = [];
    }

    get dimension() {
        return this.topology.dimension;
    }

    get size() {
        return [...this.topology.size];
    }

    get topologyType() {
        return this.topology.topology;
    }

    getCell(coordinate) {
        const key = this.topology.key(coordinate);
        return key ? this.board.get(key) ?? null : null;
    }

    setCell(coordinate, color = null) {
        const normalized = this.topology.normalize(coordinate);
        if (!normalized) return false;
        const key = this.topology.key(normalized);
        if (!key) return false;
        if (color === null || color === undefined) {
            this.board.delete(key);
            return true;
        }
        if (!HEX_COLOR_VALUES.has(color)) return false;
        this.board.set(key, color);
        return true;
    }

    isLegalPlacement(coordinate, color = this.currentColor) {
        if (!HEX_COLOR_VALUES.has(color)) return false;
        if (this.winner || color !== this.currentColor) return false;
        const key = this.topology.key(coordinate);
        return Boolean(key && !this.board.has(key));
    }

    place(coordinate, color = this.currentColor) {
        if (!HEX_COLOR_VALUES.has(color)) {
            return { ok: false, error: 'Unknown Hex color.' };
        }
        if (this.winner) {
            return { ok: false, error: 'The game already has a winner.', winner: this.winner };
        }
        if (color !== this.currentColor) {
            return { ok: false, error: `It is ${this.currentColor}'s turn.` };
        }

        const normalized = this.topology.normalize(coordinate);
        if (!normalized) return { ok: false, error: 'Coordinate is outside the board.' };

        const key = this.topology.key(normalized);
        if (this.board.has(key)) return { ok: false, error: 'Hex placements require an empty cell.' };

        this.board.set(key, color);
        this.moveNumber += 1;
        this.history.push({ move: this.moveNumber, color, coordinate: [...normalized] });

        const won = this.hasConnection(color);
        if (won) {
            this.winner = color;
        } else {
            this.currentColor = otherHexColor(color);
        }

        return {
            ok: true,
            color,
            coordinate: [...normalized],
            moveNumber: this.moveNumber,
            winner: this.winner
        };
    }

    play(coordinate, color = this.currentColor) {
        return this.place(coordinate, color);
    }

    pass() {
        if (!this.allowPass) return { ok: false, error: 'Passing is disabled in Hex.' };
        if (this.winner) return { ok: false, error: 'The game already has a winner.' };
        this.currentColor = otherHexColor(this.currentColor);
        return { ok: true, currentColor: this.currentColor };
    }

    hasConnection(color) {
        if (!HEX_COLOR_VALUES.has(color)) {
            throw new TypeError(`Unknown Hex color: ${String(color)}`);
        }

        const zone = this.topology.goalZones[color];
        const queue = [];
        const visited = new Set();

        for (const [key, cellColor] of this.board) {
            if (cellColor !== color) continue;
            const coordinate = this.topology.coordinate(key);
            if (!zone.start(coordinate)) continue;
            queue.push(coordinate);
            visited.add(key);
        }

        for (let index = 0; index < queue.length; index += 1) {
            const coordinate = queue[index];
            if (zone.end(coordinate)) return true;

            for (const neighbor of this.topology.neighbors(coordinate)) {
                const key = this.topology.key(neighbor);
                if (visited.has(key) || this.board.get(key) !== color) continue;
                visited.add(key);
                queue.push(neighbor);
            }
        }

        return false;
    }

    reset() {
        this.board.clear();
        this.currentColor = this.startingColor;
        this.winner = null;
        this.moveNumber = 0;
        this.history = [];
    }

    exportState() {
        return {
            version: 1,
            game: 'hex',
            dimension: this.dimension,
            size: this.size,
            topology: this.topologyType,
            lattice: this.topology.lattice,
            randomBoundarySeed: this.topology.randomBoundarySeed || '',
            goalZones: {
                black: {
                    type: this.topology.goalZones.black.type,
                    label: this.topology.goalZones.black.label
                },
                white: {
                    type: this.topology.goalZones.white.type,
                    label: this.topology.goalZones.white.label
                }
            },
            allowPass: this.allowPass,
            startingColor: this.startingColor,
            currentColor: this.currentColor,
            winner: this.winner,
            moveNumber: this.moveNumber,
            cells: [...this.board.entries()].map(([key, color]) => ({
                coordinate: this.topology.coordinate(key),
                color
            })),
            history: this.history.map(cloneHistoryEntry)
        };
    }

    importState(state) {
        if (!state || typeof state !== 'object' || state.game !== 'hex') {
            throw new TypeError('Invalid Hex state.');
        }

        const topology = createHexTopology({
            dimension: state.dimension,
            size: state.size,
            topology: state.topology,
            lattice: state.lattice,
            randomBoundarySeed: state.randomBoundarySeed
        });
        const board = new Map();
        for (const cell of state.cells ?? []) {
            if (!HEX_COLOR_VALUES.has(cell?.color)) throw new TypeError('Invalid Hex cell color.');
            const key = topology.key(cell.coordinate);
            if (!key) throw new RangeError('Hex state contains a cell outside the board.');
            if (board.has(key)) throw new TypeError('Hex state contains duplicate cells.');
            board.set(key, cell.color);
        }

        const currentColor = HEX_COLOR_VALUES.has(state.currentColor)
            ? state.currentColor
            : this.startingColor;
        const winner = state.winner == null ? null : state.winner;
        if (winner !== null && !HEX_COLOR_VALUES.has(winner)) {
            throw new TypeError('Invalid Hex winner.');
        }

        this.topology = topology;
        this.allowPass = state.allowPass === true;
        this.startingColor = HEX_COLOR_VALUES.has(state.startingColor)
            ? state.startingColor
            : HEX_COLORS.BLACK;
        this.board = board;
        this.currentColor = currentColor;
        this.moveNumber = Number.isInteger(state.moveNumber)
            ? Math.max(0, state.moveNumber)
            : board.size;
        this.history = Array.isArray(state.history)
            ? state.history.map((entry) => ({
                move: Number(entry.move),
                color: entry.color,
                coordinate: [...entry.coordinate]
            }))
            : [];

        const blackConnected = this.hasConnection(HEX_COLORS.BLACK);
        const whiteConnected = this.hasConnection(HEX_COLORS.WHITE);
        if (blackConnected && whiteConnected) {
            throw new TypeError('Invalid Hex state: both colors cannot be winners.');
        }
        this.winner = blackConnected ? HEX_COLORS.BLACK : whiteConnected ? HEX_COLORS.WHITE : winner;

        if (this.winner && !this.hasConnection(this.winner)) {
            throw new TypeError('Invalid Hex state: winner has no connected path.');
        }

        return this;
    }

    static fromState(state) {
        return new HexGame({
            dimension: state?.dimension,
            size: state?.size,
            topology: state?.topology,
            lattice: state?.lattice,
            randomBoundarySeed: state?.randomBoundarySeed
        }).importState(state);
    }
}

export default HexGame;
