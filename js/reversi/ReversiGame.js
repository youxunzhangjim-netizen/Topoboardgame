import { SeededRandom } from '../probability/SeededRandom.js';
import { createPhysicalProblem } from '../physics/PhysicalProblems.js';

export const REVERSI_COLORS = {
    BLACK: 'black',
    WHITE: 'white'
};

export const REVERSI_TOPOLOGIES = {
    OPEN_2D: 'open2d',
    PBC: 'pbc',
    KLEIN: 'klein',
    RANDOM: 'random',
    R3: 'r3',
    T3: 't3',
    R3_RANDOM: 'r3_random',
    R4: 'r4',
    T2: 't2',
    SPHERE: 'sphere',
    MOBIUS: 'mobius',
    RP2: 'rp2'
};

export function otherReversiColor(color) {
    return color === REVERSI_COLORS.BLACK ? REVERSI_COLORS.WHITE : REVERSI_COLORS.BLACK;
}

export function normalizeReversiSize(value, options = {}) {
    const {
        fallback = 8,
        min = 4,
        max = 30,
        even = false
    } = options;
    let next = Math.floor(Number(value));
    if (!Number.isFinite(next)) next = fallback;
    next = Math.min(max, Math.max(min, next));
    if (even && next % 2 !== 0) {
        next = next < max ? next + 1 : next - 1;
    }
    return Math.min(max, Math.max(min, next));
}

function mod(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

export function normalizeKlein(x, y, width, height) {
    const wraps = Math.floor(y / height);
    const normalizedY = mod(y, height);
    let normalizedX = x;
    if (Math.abs(wraps) % 2 === 1) {
        normalizedX = width - 1 - normalizedX;
    }
    return [mod(normalizedX, width), normalizedY];
}

export function normalizeMobius(x, y, width, height) {
    if (y < 0 || y >= height) return null;
    const wraps = Math.floor(x / width);
    const normalizedX = mod(x, width);
    const normalizedY = Math.abs(wraps) % 2 === 1 ? height - 1 - y : y;
    return [normalizedX, normalizedY];
}

export function normalizeRP2(x, y, width, height) {
    let nx = x;
    let ny = y;
    let guard = 0;
    const limit = Math.max(16, (width + height) * 8);
    while ((nx < 0 || nx >= width || ny < 0 || ny >= height) && guard < limit) {
        if (nx < 0) {
            nx += width;
            ny = height - 1 - ny;
        } else if (nx >= width) {
            nx -= width;
            ny = height - 1 - ny;
        }
        if (ny < 0) {
            ny += height;
            nx = width - 1 - nx;
        } else if (ny >= height) {
            ny -= height;
            nx = width - 1 - nx;
        }
        guard += 1;
    }
    return [mod(nx, width), mod(ny, height)];
}

function coordinateKey(coord) {
    return coord.join(',');
}

function randomSeed() {
    return `reversi-random-boundary:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function boundaryTargets(width, height) {
    const targets = [];
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1) targets.push([x, y]);
        }
    }
    return targets;
}

function boundaryTargets3D(width, height, depth) {
    const targets = [];
    for (let z = 0; z < depth; z += 1) {
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                if (
                    x === 0 || y === 0 || z === 0 ||
                    x === width - 1 || y === height - 1 || z === depth - 1
                ) {
                    targets.push([x, y, z]);
                }
            }
        }
    }
    return targets;
}

function randomExitKey(coord, direction) {
    return `${coord[0]},${coord[1]}:${Math.sign(direction[0] || 0)},${Math.sign(direction[1] || 0)}`;
}

function randomExitKey3D(coord, direction) {
    return `${coord[0]},${coord[1]},${coord[2] || 0}:${Math.sign(direction[0] || 0)},${Math.sign(direction[1] || 0)},${Math.sign(direction[2] || 0)}`;
}

function createRandomBoundaryMap(width, height, directions, seed = randomSeed(), lattice = 'square') {
    const rng = new SeededRandom(seed);
    const targets = boundaryTargets(width, height);
    const entries = [];
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            for (const direction of directions) {
                const raw = [x + (direction[0] || 0), y + (direction[1] || 0)];
                if (raw[0] >= 0 && raw[0] < width && raw[1] >= 0 && raw[1] < height) continue;
                let target = targets[rng.integer(targets.length)] || [x, y];
                if (targets.length > 1 && target[0] === x && target[1] === y) {
                    target = targets[(targets.findIndex(([tx, ty]) => tx === target[0] && ty === target[1]) + 1) % targets.length];
                }
                entries.push([randomExitKey([x, y], direction), target]);
            }
        }
    }
    return entries;
}

function createRandomBoundaryMap3D(width, height, depth, directions, seed = randomSeed()) {
    const rng = new SeededRandom(seed);
    const targets = boundaryTargets3D(width, height, depth);
    const entries = [];
    for (let z = 0; z < depth; z += 1) {
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                for (const direction of directions) {
                    const raw = [
                        x + (direction[0] || 0),
                        y + (direction[1] || 0),
                        z + (direction[2] || 0)
                    ];
                    if (
                        raw[0] >= 0 && raw[0] < width &&
                        raw[1] >= 0 && raw[1] < height &&
                        raw[2] >= 0 && raw[2] < depth
                    ) {
                        continue;
                    }
                    let target = targets[rng.integer(targets.length)] || [x, y, z];
                    if (targets.length > 1 && target[0] === x && target[1] === y && target[2] === z) {
                        const currentIndex = targets.findIndex(([tx, ty, tz]) => tx === target[0] && ty === target[1] && tz === target[2]);
                        target = targets[(currentIndex + 1) % targets.length];
                    }
                    entries.push([randomExitKey3D([x, y, z], direction), target]);
                }
            }
        }
    }
    return entries;
}

function createDirections(dimension) {
    const directions = [];
    const build = (prefix, depth) => {
        if (depth === dimension) {
            if (prefix.some((value) => value !== 0)) directions.push(prefix);
            return;
        }
        for (const delta of [-1, 0, 1]) build([...prefix, delta], depth + 1);
    };
    build([], 0);
    return directions;
}

const HONEYCOMB_DIRECTIONS = Object.freeze([
    Object.freeze([1, 0]),
    Object.freeze([-1, 0]),
    Object.freeze([0, 1]),
    Object.freeze([0, -1]),
    Object.freeze([1, -1]),
    Object.freeze([-1, 1])
]);

const TRIANGULAR_LAYER_DIRECTIONS = Object.freeze([
    Object.freeze([1, 0, 0]),
    Object.freeze([-1, 0, 0]),
    Object.freeze([0, 1, 0]),
    Object.freeze([0, -1, 0]),
    Object.freeze([1, -1, 0]),
    Object.freeze([-1, 1, 0])
]);

function hcpDirections(coord = [0, 0, 0]) {
    const upward = (coord[2] || 0) % 2 === 0
        ? [[0, 0, 1], [-1, 0, 1], [0, -1, 1]]
        : [[0, 0, 1], [1, 0, 1], [0, 1, 1]];
    const downward = (coord[2] || 0) % 2 === 0
        ? [[0, 0, -1], [-1, 0, -1], [0, -1, -1]]
        : [[0, 0, -1], [1, 0, -1], [0, 1, -1]];
    return [
        ...TRIANGULAR_LAYER_DIRECTIONS.map((direction) => [...direction]),
        ...upward,
        ...downward
    ];
}

function is3DReversiTopology(topology) {
    return topology === REVERSI_TOPOLOGIES.R3 ||
        topology === REVERSI_TOPOLOGIES.T3 ||
        topology === REVERSI_TOPOLOGIES.R3_RANDOM;
}

function is4DReversiTopology(topology) {
    return topology === REVERSI_TOPOLOGIES.R4;
}

export function createReversiTopology(options = {}) {
    const topology = normalizeReversiTopology(options.topology);
    const size = normalizeReversiSize(options.size, {
        fallback: options.fallbackSize || 8,
        min: options.minSize || 4,
        max: options.maxSize || 30
    });
    const dimension = is4DReversiTopology(topology) ? 4 : is3DReversiTopology(topology) ? 3 : 2;
    const requestedLattice = String(options.lattice || '').toLowerCase();
    const lattice = dimension === 2 && requestedLattice === 'honeycomb'
        ? 'honeycomb'
        : dimension === 3 && requestedLattice === 'hcp'
            ? 'hcp'
            : 'square';
    const width = normalizeReversiSize(options.width ?? size, { fallback: size, min: 4, max: options.maxSize || 30 });
    const height = normalizeReversiSize(options.height ?? size, { fallback: size, min: 4, max: options.maxSize || 30 });
    const depth = dimension >= 3
        ? normalizeReversiSize(options.depth ?? size, { fallback: size, min: 4, max: options.maxSize || 30 })
        : 1;
    const wSize = dimension === 4
        ? normalizeReversiSize(options.wSize ?? options.nw ?? size, { fallback: size, min: 4, max: options.maxSize || 30 })
        : 1;
    const directions = lattice === 'honeycomb'
        ? HONEYCOMB_DIRECTIONS.map((direction) => [...direction])
        : lattice === 'hcp'
            ? hcpDirections([0, 0, 0])
        : createDirections(dimension);
    const hasRandomBoundary = topology === REVERSI_TOPOLOGIES.RANDOM || topology === REVERSI_TOPOLOGIES.R3_RANDOM;
    const randomBoundarySeed = hasRandomBoundary ? (options.randomBoundarySeed || randomSeed()) : '';
    const randomBoundaryMap = hasRandomBoundary
        ? new Map(Array.isArray(options.randomBoundaryMap)
            ? options.randomBoundaryMap
            : (topology === REVERSI_TOPOLOGIES.R3_RANDOM
                ? createRandomBoundaryMap3D(width, height, depth, directions, randomBoundarySeed)
                : createRandomBoundaryMap(width, height, directions, randomBoundarySeed, lattice)))
        : new Map();

    return {
        topology,
        lattice,
        dimension,
        size,
        width,
        height,
        depth,
        wSize,
        directions,
        directionsFor(coord) {
            return lattice === 'hcp'
                ? hcpDirections(coord)
                : directions.map((direction) => [...direction]);
        },
        randomBoundarySeed,
        randomBoundaryMap,
        totalVertices: width * height * depth * wSize,
        key: coordinateKey,
        contains(coord) {
            if (!Array.isArray(coord) || coord.length < dimension) return false;
            if (coord[0] < 0 || coord[0] >= width) return false;
            if (coord[1] < 0 || coord[1] >= height) return false;
            if (dimension >= 3 && (coord[2] < 0 || coord[2] >= depth)) return false;
            if (dimension === 4 && (coord[3] < 0 || coord[3] >= wSize)) return false;
            return true;
        },
        normalize(coord) {
            const [x, y, z = 0, w = 0] = coord;
            if (topology === REVERSI_TOPOLOGIES.PBC || topology === REVERSI_TOPOLOGIES.T2) {
                return [mod(x, width), mod(y, height)];
            }
            if (topology === REVERSI_TOPOLOGIES.T3) {
                return [mod(x, width), mod(y, height), mod(z, depth)];
            }
            if (topology === REVERSI_TOPOLOGIES.KLEIN) {
                return normalizeKlein(x, y, width, height);
            }
            if (topology === REVERSI_TOPOLOGIES.MOBIUS) {
                return normalizeMobius(x, y, width, height);
            }
            if (topology === REVERSI_TOPOLOGIES.RP2) {
                return normalizeRP2(x, y, width, height);
            }
            if (topology === REVERSI_TOPOLOGIES.RANDOM) {
                if (x < 0 || x >= width || y < 0 || y >= height) return null;
                return [x, y];
            }
            if (topology === REVERSI_TOPOLOGIES.SPHERE) {
                if (y < 0 || y >= height) return null;
                return [mod(x, width), y];
            }
            if (topology === REVERSI_TOPOLOGIES.R3 || topology === REVERSI_TOPOLOGIES.R3_RANDOM) {
                if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) return null;
                return [x, y, z];
            }
            if (topology === REVERSI_TOPOLOGIES.R4) {
                if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth || w < 0 || w >= wSize) return null;
                return [x, y, z, w];
            }
            if (x < 0 || x >= width || y < 0 || y >= height) return null;
            return [x, y];
        },
        step(coord, direction) {
            const next = coord.map((value, index) => value + (direction[index] || 0));
            if (topology === REVERSI_TOPOLOGIES.RANDOM && dimension === 2) {
                if (next[0] >= 0 && next[0] < width && next[1] >= 0 && next[1] < height) return next;
                const target = randomBoundaryMap.get(randomExitKey(coord, direction));
                return target ? [...target] : null;
            }
            if (topology === REVERSI_TOPOLOGIES.R3_RANDOM && dimension === 3) {
                if (
                    next[0] >= 0 && next[0] < width &&
                    next[1] >= 0 && next[1] < height &&
                    next[2] >= 0 && next[2] < depth
                ) {
                    return next;
                }
                const target = randomBoundaryMap.get(randomExitKey3D(coord, direction));
                return target ? [...target] : null;
            }
            return this.normalize(next);
        },
        randomBoundaryLinks(limit = 28) {
            if (topology !== REVERSI_TOPOLOGIES.RANDOM && topology !== REVERSI_TOPOLOGIES.R3_RANDOM) return [];
            return [...randomBoundaryMap.entries()].slice(0, limit).map(([key, target]) => {
                const [coordText] = key.split(':');
                return {
                    from: coordText.split(',').map(Number),
                    to: [...target]
                };
            });
        },
        allCoords() {
            const coords = [];
            if (dimension === 4) {
                for (let w = 0; w < wSize; w += 1) {
                    for (let z = 0; z < depth; z += 1) {
                        for (let y = 0; y < height; y += 1) {
                            for (let x = 0; x < width; x += 1) coords.push([x, y, z, w]);
                        }
                    }
                }
                return coords;
            }
            if (dimension === 3) {
                for (let z = 0; z < depth; z += 1) {
                    for (let y = 0; y < height; y += 1) {
                        for (let x = 0; x < width; x += 1) coords.push([x, y, z]);
                    }
                }
                return coords;
            }
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) coords.push([x, y]);
            }
            return coords;
        }
    };
}

export function normalizeReversiTopology(value) {
    const text = String(value || '').toLowerCase();
    if (['pbc', 'periodic', 'periodic2d'].includes(text)) return REVERSI_TOPOLOGIES.PBC;
    if (['klein', 'klein_bottle', 'klein-bottle'].includes(text)) return REVERSI_TOPOLOGIES.KLEIN;
    if (['random', 'random_boundary', 'random-boundary', 'randomboundary'].includes(text)) return REVERSI_TOPOLOGIES.RANDOM;
    if (['r3', '3d', 'cube'].includes(text)) return REVERSI_TOPOLOGIES.R3;
    if (['t3', 't3_pbc', 't3-pbc', 'pbc3d', '3d_pbc', '3dpbc'].includes(text)) return REVERSI_TOPOLOGIES.T3;
    if (['r3_random', 'r3-random', 'r3rbc', 'rbc3d', '3d_rbc', '3drbc', 'random3d'].includes(text)) return REVERSI_TOPOLOGIES.R3_RANDOM;
    if (['r4', '4d', 'flat_4d_reversi', 'flat4d', '4d_reversi'].includes(text)) return REVERSI_TOPOLOGIES.R4;
    if (['t2', 'torus', 'torus2d'].includes(text)) return REVERSI_TOPOLOGIES.T2;
    if (['s2', 'sphere', 'sphere_latitude_ring'].includes(text)) return REVERSI_TOPOLOGIES.SPHERE;
    if (['mobius', 'moebius', 'mobius_strip', 'mobius-strip'].includes(text)) return REVERSI_TOPOLOGIES.MOBIUS;
    if (['rp2', 'projective', 'real_projective_plane', 'real-projective-plane'].includes(text)) return REVERSI_TOPOLOGIES.RP2;
    return REVERSI_TOPOLOGIES.OPEN_2D;
}

export class ReversiGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        const physicalProblemSource = options.physicalProblem || options.physicalProblemId || options.problemId || null;
        const physicalProblemConfig = options.physicalProblemConfig || {};
        this.physicalProblem = createPhysicalProblem(physicalProblemSource, physicalProblemConfig);
        this.topology = createReversiTopology(options);
        this.board = new Map();
        this.currentPlayer = REVERSI_COLORS.BLACK;
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        this.lastFlipped = [];
        this.placeInitialStones();
        this.physicalProblem?.setupInitialState?.(this);
        this.physicalProblem?.start?.(this);
    }

    placeInitialStones() {
        const midX = Math.floor(this.topology.width / 2);
        const midY = Math.floor(this.topology.height / 2);
        const lowX = midX - 1;
        const highX = midX;
        const lowY = midY - 1;
        const highY = midY;

        if (this.topology.dimension === 4) {
            const midZ = Math.floor(this.topology.depth / 2);
            const lowZ = midZ - 1;
            const highZ = midZ;
            const midW = Math.floor(this.topology.wSize / 2);
            const lowW = midW - 1;
            const highW = midW;
            for (const w of [lowW, highW]) {
                for (const z of [lowZ, highZ]) {
                    for (const y of [lowY, highY]) {
                        for (const x of [lowX, highX]) {
                            const color = (x + y + z + w) % 2 === 0 ? REVERSI_COLORS.WHITE : REVERSI_COLORS.BLACK;
                            this.set([x, y, z, w], { color });
                        }
                    }
                }
            }
            return;
        }

        if (this.topology.dimension === 3) {
            const midZ = Math.floor(this.topology.depth / 2);
            const lowZ = midZ - 1;
            const highZ = midZ;
            for (const z of [lowZ, highZ]) {
                for (const y of [lowY, highY]) {
                    for (const x of [lowX, highX]) {
                        const color = (x + y + z) % 2 === 0 ? REVERSI_COLORS.WHITE : REVERSI_COLORS.BLACK;
                        this.set([x, y, z], { color });
                    }
                }
            }
            return;
        }

        this.set([lowX, lowY], { color: REVERSI_COLORS.WHITE });
        this.set([highX, highY], { color: REVERSI_COLORS.WHITE });
        this.set([lowX, highY], { color: REVERSI_COLORS.BLACK });
        this.set([highX, lowY], { color: REVERSI_COLORS.BLACK });
    }

    key(coord) {
        return this.topology.key(coord);
    }

    get(coord) {
        return this.board.get(this.key(coord)) || null;
    }

    set(coord, stone) {
        this.board.set(this.key(coord), { ...stone });
    }

    delete(coord) {
        this.board.delete(this.key(coord));
    }

    collectRay(origin, direction, color) {
        const opponent = otherReversiColor(color);
        const captured = [];
        const seen = new Set([this.key(origin)]);
        let current = origin;
        for (let step = 0; step <= this.topology.totalVertices; step += 1) {
            const next = this.topology.step(current, direction);
            if (!next) return [];
            const key = this.key(next);
            if (seen.has(key)) return [];
            seen.add(key);
            const stone = this.get(next);
            if (!stone) return [];
            if (stone.color === opponent) {
                captured.push(next);
                current = next;
                continue;
            }
            if (stone.color === color) return captured.length ? captured : [];
            return [];
        }
        return [];
    }

    previewMove(coord, color = this.currentPlayer) {
        const normalized = this.topology.normalize(coord);
        if (!normalized || this.get(normalized) || this.gameOver) return [];
        const flips = [];
        const seen = new Set();
        for (const direction of this.topology.directionsFor(coord)) {
            for (const capture of this.collectRay(normalized, direction, color)) {
                const key = this.key(capture);
                if (!seen.has(key)) {
                    seen.add(key);
                    flips.push(capture);
                }
            }
        }
        return flips;
    }

    legalMoves(color = this.currentPlayer) {
        const moves = [];
        for (const coord of this.topology.allCoords()) {
            const flips = this.previewMove(coord, color);
            if (flips.length) moves.push({ coord, flips });
        }
        return moves;
    }

    play(coord, color = this.currentPlayer) {
        if (this.gameOver || color !== this.currentPlayer) return { ok: false, reason: 'turn' };
        const normalized = this.topology.normalize(coord);
        const flips = this.previewMove(normalized, color);
        if (!flips.length) return { ok: false, reason: 'illegal' };

        const physicalBefore = this.physicalProblem?.beforeMove?.(this);
        this.set(normalized, { color });
        for (const flip of flips) this.set(flip, { color });
        this.lastFlipped = flips.map((flip) => this.key(flip));
        const event = {
            type: 'move',
            number: this.moveHistory.filter((entry) => entry.type === 'move').length + 1,
            color,
            coord: normalized,
            flipped: flips.length
        };
        const physicalEntry = this.physicalProblem?.afterMove?.(this, { event, beforeState: physicalBefore });
        if (physicalEntry) {
            event.physicalProblem = {
                deltaEnergy: physicalEntry.observables.deltaEnergy,
                acceptedMove: physicalEntry.observables.acceptedMove,
                metropolisProbability: physicalEntry.observables.metropolisProbability,
                domainWallLength: physicalEntry.observables.domainWallLength,
                twistedSector: physicalEntry.observables.twistedSector
            };
            if (physicalEntry.observables.acceptedMove === false) this.lastFlipped = [];
        }
        this.moveHistory.unshift(event);
        this.advanceTurn(color);
        return { ok: true, coord: normalized, flipped: flips.length, physicalProblem: event.physicalProblem || null };
    }

    pass() {
        if (this.gameOver) return { ok: false, reason: 'game-over' };
        if (this.legalMoves(this.currentPlayer).length) return { ok: false, reason: 'legal-moves' };
        const color = this.currentPlayer;
        const event = { type: 'no-move-end', color, automatic: false };
        this.moveHistory.unshift(event);
        this.physicalProblem?.record?.(this, { type: 'pass', event });
        this.finishGame();
        return { ok: true };
    }

    advanceTurn(color) {
        const opponent = otherReversiColor(color);
        if (this.legalMoves(opponent).length) {
            this.currentPlayer = opponent;
            return;
        }
        this.moveHistory.unshift({ type: 'no-move-end', color: opponent, automatic: true });
        this.finishGame();
    }

    finishGame() {
        const counts = this.counts();
        this.gameOver = true;
        this.winner = counts.black === counts.white
            ? 'draw'
            : counts.black > counts.white ? REVERSI_COLORS.BLACK : REVERSI_COLORS.WHITE;
        this.physicalProblem?.record?.(this, { type: 'finish', event: { winner: this.winner, counts } });
    }

    counts() {
        let black = 0;
        let white = 0;
        for (const stone of this.board.values()) {
            if (stone.color === REVERSI_COLORS.BLACK) black += 1;
            if (stone.color === REVERSI_COLORS.WHITE) white += 1;
        }
        return { black, white, empty: this.topology.totalVertices - black - white };
    }

    exportState() {
        return {
            topology: this.topology.topology,
            lattice: this.topology.lattice,
            size: this.topology.size,
            width: this.topology.width,
            height: this.topology.height,
            depth: this.topology.depth,
            wSize: this.topology.wSize,
            randomBoundarySeed: this.topology.randomBoundarySeed,
            randomBoundaryMap: [...this.topology.randomBoundaryMap.entries()],
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner,
            board: [...this.board.entries()],
            moveHistory: this.moveHistory,
            lastFlipped: this.lastFlipped,
            physicalProblem: this.physicalProblem?.export?.(this) || null
        };
    }

    importState(state) {
        if (!state) return;
        this.topology = createReversiTopology({
            topology: state.topology,
            lattice: state.lattice,
            size: state.size,
            width: state.width,
            height: state.height,
            depth: state.depth,
            wSize: state.wSize,
            randomBoundarySeed: state.randomBoundarySeed,
            randomBoundaryMap: state.randomBoundaryMap
        });
        this.board = new Map(Array.isArray(state.board) ? state.board : []);
        this.currentPlayer = state.currentPlayer === REVERSI_COLORS.WHITE ? REVERSI_COLORS.WHITE : REVERSI_COLORS.BLACK;
        this.gameOver = Boolean(state.gameOver);
        this.winner = state.winner || null;
        this.moveHistory = Array.isArray(state.moveHistory) ? state.moveHistory : [];
        this.lastFlipped = Array.isArray(state.lastFlipped) ? state.lastFlipped : [];
    }
}
