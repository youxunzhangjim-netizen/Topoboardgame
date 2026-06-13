export const REVERSI_COLORS = {
    BLACK: 'black',
    WHITE: 'white'
};

export const REVERSI_TOPOLOGIES = {
    OPEN_2D: 'open2d',
    PBC: 'pbc',
    KLEIN: 'klein',
    R3: 'r3',
    T2: 't2',
    SPHERE: 'sphere'
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

function coordinateKey(coord) {
    return coord.join(',');
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

export function createReversiTopology(options = {}) {
    const topology = normalizeReversiTopology(options.topology);
    const size = normalizeReversiSize(options.size, {
        fallback: options.fallbackSize || 8,
        min: options.minSize || 4,
        max: options.maxSize || 30
    });
    const dimension = topology === REVERSI_TOPOLOGIES.R3 ? 3 : 2;
    const width = normalizeReversiSize(options.width ?? size, { fallback: size, min: 4, max: options.maxSize || 30 });
    const height = normalizeReversiSize(options.height ?? size, { fallback: size, min: 4, max: options.maxSize || 30 });
    const depth = dimension === 3
        ? normalizeReversiSize(options.depth ?? size, { fallback: size, min: 4, max: options.maxSize || 30 })
        : 1;

    return {
        topology,
        dimension,
        size,
        width,
        height,
        depth,
        directions: createDirections(dimension),
        totalVertices: width * height * depth,
        key: coordinateKey,
        contains(coord) {
            if (!Array.isArray(coord) || coord.length < dimension) return false;
            if (coord[0] < 0 || coord[0] >= width) return false;
            if (coord[1] < 0 || coord[1] >= height) return false;
            if (dimension === 3 && (coord[2] < 0 || coord[2] >= depth)) return false;
            return true;
        },
        normalize(coord) {
            const [x, y, z = 0] = coord;
            if (topology === REVERSI_TOPOLOGIES.PBC || topology === REVERSI_TOPOLOGIES.T2) {
                return [mod(x, width), mod(y, height)];
            }
            if (topology === REVERSI_TOPOLOGIES.KLEIN) {
                return normalizeKlein(x, y, width, height);
            }
            if (topology === REVERSI_TOPOLOGIES.SPHERE) {
                if (y < 0 || y >= height) return null;
                return [mod(x, width), y];
            }
            if (topology === REVERSI_TOPOLOGIES.R3) {
                if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) return null;
                return [x, y, z];
            }
            if (x < 0 || x >= width || y < 0 || y >= height) return null;
            return [x, y];
        },
        step(coord, direction) {
            const next = coord.map((value, index) => value + (direction[index] || 0));
            return this.normalize(next);
        },
        allCoords() {
            const coords = [];
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
    if (['r3', '3d', 'cube'].includes(text)) return REVERSI_TOPOLOGIES.R3;
    if (['t2', 'torus', 'torus2d'].includes(text)) return REVERSI_TOPOLOGIES.T2;
    if (['s2', 'sphere', 'sphere_latitude_ring'].includes(text)) return REVERSI_TOPOLOGIES.SPHERE;
    return REVERSI_TOPOLOGIES.OPEN_2D;
}

export class ReversiGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.topology = createReversiTopology(options);
        this.board = new Map();
        this.currentPlayer = REVERSI_COLORS.BLACK;
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        this.lastFlipped = [];
        this.placeInitialStones();
    }

    placeInitialStones() {
        const midX = Math.floor(this.topology.width / 2);
        const midY = Math.floor(this.topology.height / 2);
        const lowX = midX - 1;
        const highX = midX;
        const lowY = midY - 1;
        const highY = midY;

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
        for (const direction of this.topology.directions) {
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

        this.set(normalized, { color });
        for (const flip of flips) this.set(flip, { color });
        this.lastFlipped = flips.map((flip) => this.key(flip));
        this.moveHistory.unshift({
            type: 'move',
            number: this.moveHistory.filter((entry) => entry.type === 'move').length + 1,
            color,
            coord: normalized,
            flipped: flips.length
        });
        this.advanceTurn(color);
        return { ok: true, coord: normalized, flipped: flips.length };
    }

    pass() {
        if (this.gameOver) return { ok: false, reason: 'game-over' };
        if (this.legalMoves(this.currentPlayer).length) return { ok: false, reason: 'legal-moves' };
        const color = this.currentPlayer;
        this.moveHistory.unshift({ type: 'pass', color, automatic: false });
        const next = otherReversiColor(color);
        if (!this.legalMoves(next).length) {
            this.finishGame();
        } else {
            this.currentPlayer = next;
        }
        return { ok: true };
    }

    advanceTurn(color) {
        const opponent = otherReversiColor(color);
        if (this.legalMoves(opponent).length) {
            this.currentPlayer = opponent;
            return;
        }
        if (this.legalMoves(color).length) {
            this.currentPlayer = color;
            this.moveHistory.unshift({ type: 'pass', color: opponent, automatic: true });
            return;
        }
        this.finishGame();
    }

    finishGame() {
        const counts = this.counts();
        this.gameOver = true;
        this.winner = counts.black === counts.white
            ? 'draw'
            : counts.black > counts.white ? REVERSI_COLORS.BLACK : REVERSI_COLORS.WHITE;
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
            size: this.topology.size,
            width: this.topology.width,
            height: this.topology.height,
            depth: this.topology.depth,
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner,
            board: [...this.board.entries()],
            moveHistory: this.moveHistory,
            lastFlipped: this.lastFlipped
        };
    }

    importState(state) {
        if (!state) return;
        this.topology = createReversiTopology({
            topology: state.topology,
            size: state.size,
            width: state.width,
            height: state.height,
            depth: state.depth
        });
        this.board = new Map(Array.isArray(state.board) ? state.board : []);
        this.currentPlayer = state.currentPlayer === REVERSI_COLORS.WHITE ? REVERSI_COLORS.WHITE : REVERSI_COLORS.BLACK;
        this.gameOver = Boolean(state.gameOver);
        this.winner = state.winner || null;
        this.moveHistory = Array.isArray(state.moveHistory) ? state.moveHistory : [];
        this.lastFlipped = Array.isArray(state.lastFlipped) ? state.lastFlipped : [];
    }
}
