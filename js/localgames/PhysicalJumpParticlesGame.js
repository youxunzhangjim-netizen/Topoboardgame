import { coordKey, createGraphTopology, sumHomology } from '../topology/GraphTopologies.js';

export const PHYSICAL_JUMP_PARTICLES_MODE = 'physical_jump_particles';

const MODEL_OPTIONS = Object.freeze([
    'charge_recombination',
    'spin_exchange',
    'anyon_worldline'
]);

const ACTION_OPTIONS = Object.freeze([
    'auto',
    'hop',
    'jump',
    'chain_jump',
    'recombine',
    'measure_path_parity'
]);

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function otherPlayer(player) {
    return player === 'black' ? 'white' : 'black';
}

function colorToSpecies(color, model) {
    if (model === 'spin_exchange') return color === 'white' ? 'spin_down' : 'spin_up';
    if (model === 'anyon_worldline') return color === 'white' ? 'negative_charge' : 'positive_charge';
    return color === 'white' ? 'antiparticle' : 'particle';
}

function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export class PhysicalJumpParticlesGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = PHYSICAL_JUMP_PARTICLES_MODE;
        this.topology = createGraphTopology(options.topology || options);
        const jump = options.jumpParticles || {};
        this.config = {
            model: MODEL_OPTIONS.includes(jump.model) ? jump.model : 'charge_recombination',
            action: ACTION_OPTIONS.includes(jump.action) ? jump.action : 'auto',
            pathParityEnabled: jump.pathParityEnabled !== false
        };
        this.currentPlayer = options.currentPlayer || 'black';
        this.board = new Map();
        this.history = [];
        this.physicsHistory = [];
        this.positionHistory = [];
        this.positionSet = new Set();
        this.moveNumber = 0;
        this.recombinationCount = 0;
        this.exchangeEvents = 0;
        this.energyRecovered = 0;
        this.pathLengths = [];
        this.survivalStartCount = 0;
        this.setupInitialState();
        this.survivalStartCount = this.board.size;
        this.recordPosition('setup');
        this.initialObservables = this.computePhysicalObservables();
    }

    normalize(coord) {
        return this.topology.normalize(coord);
    }

    key(coord) {
        const normalized = this.normalize(coord);
        return normalized ? coordKey(normalized) : '';
    }

    coordFromKey(key) {
        return key.split(',').map(Number);
    }

    getParticle(coord, board = this.board) {
        const key = this.key(coord);
        return key ? board.get(key) || null : null;
    }

    getStone(coord) {
        const particle = this.getParticle(coord);
        if (!particle) return null;
        return {
            color: particle.color,
            pauliLabel: particle.species,
            label: particle.species,
            pathLength: particle.pathLength,
            parity: particle.pathParity
        };
    }

    isEmpty(coord) {
        const key = this.key(coord);
        return Boolean(key) && !this.board.has(key);
    }

    setParticle(coord, color, extra = {}) {
        const normalized = this.normalize(coord);
        if (!normalized) return false;
        this.board.set(coordKey(normalized), {
            color,
            species: colorToSpecies(color, this.config.model),
            pathLength: 0,
            pathParity: 0,
            worldline: [normalized],
            ...extra
        });
        return true;
    }

    setupInitialState() {
        const vertices = this.topology.vertices();
        const sizes = this.topology.sizes;
        const center = sizes.map((size) => Math.floor(size / 2));
        const seeds = [
            center.map((value, axis) => axis === 0 ? Math.max(0, value - 2) : value),
            center.map((value, axis) => axis === 0 ? Math.min((sizes[0] || 1) - 1, value + 2) : value),
            center.map((value, axis) => axis === 1 ? Math.max(0, value - 2) : value),
            center.map((value, axis) => axis === 1 ? Math.min((sizes[1] || sizes[0] || 1) - 1, value + 2) : value)
        ];
        this.setParticle(seeds[0] || vertices[0], 'black');
        this.setParticle(seeds[1] || vertices.at(-1), 'white');
        this.setParticle(seeds[2] || vertices[1] || vertices[0], 'black');
        this.setParticle(seeds[3] || vertices.at(-2) || vertices.at(-1), 'white');
    }

    neighbors(coord) {
        return this.topology.neighbors(coord).map((item) => item.coord || item);
    }

    adjacent(a, b) {
        const target = this.key(b);
        return this.neighbors(a).some((coord) => this.key(coord) === target);
    }

    jumpLandingInfo(from, to) {
        if (!this.isEmpty(to)) return null;
        const target = this.key(to);
        for (const mid of this.neighbors(from)) {
            if (!this.getParticle(mid)) continue;
            for (const landing of this.neighbors(mid)) {
                if (this.key(landing) === target && this.key(landing) !== this.key(from)) {
                    return { over: mid, path: [this.normalize(from), mid, this.normalize(to)] };
                }
            }
        }
        return null;
    }

    chainJumpPath(from, to) {
        const startKey = this.key(from);
        const targetKey = this.key(to);
        if (!targetKey || !this.isEmpty(to)) return null;
        const queue = [{ coord: this.normalize(from), path: [this.normalize(from)], over: [] }];
        const seen = new Set([startKey]);
        while (queue.length) {
            const current = queue.shift();
            for (const mid of this.neighbors(current.coord)) {
                if (!this.getParticle(mid)) continue;
                for (const landing of this.neighbors(mid)) {
                    const landingKey = this.key(landing);
                    if (!landingKey || landingKey === this.key(current.coord) || seen.has(landingKey)) continue;
                    if (!this.isEmpty(landing) && landingKey !== targetKey) continue;
                    const next = {
                        coord: landing,
                        path: [...current.path, mid, landing],
                        over: [...current.over, mid]
                    };
                    if (landingKey === targetKey) return next;
                    seen.add(landingKey);
                    queue.push(next);
                }
            }
        }
        return null;
    }

    legalMoves(from = null, action = this.config.action) {
        if (!from) {
            return [...this.board.entries()]
                .filter(([, particle]) => particle.color === this.currentPlayer)
                .map(([key]) => ({ coord: this.coordFromKey(key), action: 'select_particle' }));
        }
        const moves = [];
        const normalized = this.normalize(from);
        if (!normalized) return moves;
        for (const coord of this.topology.vertices()) {
            if (this.key(coord) === this.key(normalized)) continue;
            if (this.getParticle(coord)) {
                const particle = this.getParticle(coord);
                if (particle.color !== this.currentPlayer && this.adjacent(normalized, coord)
                    && (action === 'auto' || action === 'recombine')) {
                    moves.push({ coord, action: 'recombine' });
                }
                continue;
            }
            if ((action === 'auto' || action === 'hop') && this.adjacent(normalized, coord)) {
                moves.push({ coord, action: 'hop' });
            }
            if ((action === 'auto' || action === 'jump') && this.jumpLandingInfo(normalized, coord)) {
                moves.push({ coord, action: 'jump' });
            }
            if ((action === 'auto' || action === 'chain_jump') && this.chainJumpPath(normalized, coord)) {
                moves.push({ coord, action: 'chain_jump' });
            }
        }
        return moves;
    }

    moveParticle(from, to, options = {}) {
        const action = options.action || this.config.action;
        const fromKey = this.key(from);
        const toKey = this.key(to);
        const particle = this.board.get(fromKey);
        if (!particle || particle.color !== this.currentPlayer) return { ok: false, error: 'Select one of your particles first.' };
        if (!toKey || !this.isEmpty(to)) return { ok: false, error: 'Choose an empty landing vertex.' };

        let kind = '';
        let path = [this.normalize(from), this.normalize(to)];
        let jumped = [];
        if ((action === 'auto' || action === 'hop') && this.adjacent(from, to)) {
            kind = 'hop';
        } else if ((action === 'auto' || action === 'jump') && this.jumpLandingInfo(from, to)) {
            const info = this.jumpLandingInfo(from, to);
            kind = 'jump';
            path = info.path;
            jumped = [info.over];
        } else if ((action === 'auto' || action === 'chain_jump') && this.chainJumpPath(from, to)) {
            const info = this.chainJumpPath(from, to);
            kind = 'chain_jump';
            path = info.path;
            jumped = info.over;
        } else {
            return { ok: false, error: 'That is not a legal hop, jump, or chain jump.' };
        }

        this.board.delete(fromKey);
        const homology = sumHomology(path.slice(1).map((coord, index) =>
            this.topology.step(path[index], coord.map((value, axis) => value - path[index][axis]))?.edge || null
        ));
        const length = Math.max(1, path.length - 1);
        const nextParticle = {
            ...particle,
            pathLength: (particle.pathLength || 0) + length,
            pathParity: ((particle.pathParity || 0) + (kind === 'jump' || kind === 'chain_jump' ? 1 : 0)) % 2,
            worldline: [...(particle.worldline || []), this.normalize(to)]
        };
        this.board.set(toKey, nextParticle);
        this.pathLengths.push(length);
        if (this.config.model === 'spin_exchange' && jumped.length) this.exchangeEvents += jumped.length;
        if (this.config.model === 'anyon_worldline' && jumped.length) this.exchangeEvents += jumped.length;
        this.moveNumber += 1;
        const event = {
            type: 'move',
            action: kind,
            number: this.moveNumber,
            player: this.currentPlayer,
            from: this.normalize(from),
            to: this.normalize(to),
            path,
            jumped,
            affectedVertices: path,
            physicalUpdate: {
                pathLength: length,
                exchangeEvents: jumped.length,
                braidParity: nextParticle.pathParity,
                homology
            },
            observables: this.computePhysicalObservables()
        };
        this.history.unshift(event);
        this.recordPosition(kind);
        this.currentPlayer = otherPlayer(this.currentPlayer);
        return { ok: true, event };
    }

    recombine(from, target) {
        const fromKey = this.key(from);
        const targetKey = this.key(target);
        const particle = this.board.get(fromKey);
        const other = this.board.get(targetKey);
        if (!particle || particle.color !== this.currentPlayer) return { ok: false, error: 'Select one of your particles first.' };
        if (!other || other.color === particle.color) return { ok: false, error: 'Recombination needs an opposite particle.' };
        if (!this.adjacent(from, target)) return { ok: false, error: 'Opposite particles must be adjacent to recombine.' };
        this.board.delete(fromKey);
        this.board.delete(targetKey);
        this.recombinationCount += 1;
        this.energyRecovered += this.config.model === 'charge_recombination' ? 2 : 1;
        this.moveNumber += 1;
        const event = {
            type: 'recombine',
            action: 'recombine',
            number: this.moveNumber,
            player: this.currentPlayer,
            from: this.normalize(from),
            to: this.normalize(target),
            affectedVertices: [this.normalize(from), this.normalize(target)],
            physicalUpdate: {
                recombined: true,
                energyRecovered: this.energyRecovered,
                removedParticles: 2
            },
            observables: this.computePhysicalObservables()
        };
        this.history.unshift(event);
        this.recordPosition('recombine');
        this.currentPlayer = otherPlayer(this.currentPlayer);
        return { ok: true, event };
    }

    measurePathParity(coord, player = this.currentPlayer) {
        const particle = this.getParticle(coord);
        if (!particle) return { ok: false, error: 'Choose a particle to measure path parity.' };
        this.moveNumber += 1;
        const measurement = {
            type: 'path_parity',
            value: particle.pathParity || 0,
            reported: particle.pathParity ? 'odd' : 'even',
            vertices: [this.normalize(coord)]
        };
        const event = {
            type: 'measurement',
            action: 'measure_path_parity',
            number: this.moveNumber,
            player,
            coord: this.normalize(coord),
            measurement,
            affectedVertices: [this.normalize(coord)],
            physicalUpdate: { measurement },
            observables: this.computePhysicalObservables()
        };
        this.history.unshift(event);
        return { ok: true, event, measurement };
    }

    recordPosition() {
        const snapshot = this.serializeBoard();
        this.positionHistory.push(snapshot);
        this.positionSet.add(snapshot);
    }

    serializeBoard() {
        return [...this.board.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, particle]) => `${key}:${particle.color}:${particle.pathParity}:${particle.pathLength}`)
            .join('|');
    }

    counts() {
        const black = [...this.board.values()].filter((particle) => particle.color === 'black').length;
        const white = [...this.board.values()].filter((particle) => particle.color === 'white').length;
        return {
            black,
            white,
            empty: Math.max(0, this.topology.vertices().length - this.board.size)
        };
    }

    computePhysicalObservables() {
        const particles = [...this.board.values()];
        const pathLengths = particles.map((particle) => Number(particle.pathLength) || 0);
        const nontrivialParity = particles.filter((particle) => particle.pathParity).length;
        const particleCount = particles.length;
        return {
            particleCount,
            blackParticles: particles.filter((particle) => particle.color === 'black').length,
            whiteParticles: particles.filter((particle) => particle.color === 'white').length,
            recombinationCount: this.recombinationCount,
            pathLengthDistribution: pathLengths,
            averagePathLength: mean(pathLengths),
            exchangeEvents: this.exchangeEvents,
            braidExchangeParity: this.config.pathParityEnabled ? nontrivialParity % 2 : null,
            nontrivialPathParityCount: nontrivialParity,
            energyRecoveredFromRecombination: this.energyRecovered,
            survivalTime: this.moveNumber,
            survivalFraction: this.survivalStartCount ? particleCount / this.survivalStartCount : 1,
            model: this.config.model
        };
    }

    computePhysicalAnswer(history = this.history) {
        const observables = this.computePhysicalObservables();
        const finalParticleNumber = observables.particleCount;
        const initial = Math.max(1, this.survivalStartCount);
        const recombinationEfficiency = Math.min(1, (this.recombinationCount * 2) / initial);
        const averagePathComplexity = observables.averagePathLength;
        const neutral = observables.blackParticles === observables.whiteParticles;
        const vacuum = finalParticleNumber === 0;
        return {
            finalParticleNumber,
            recombinationEfficiency,
            averagePathComplexity,
            reachedVacuumOrNeutralState: vacuum || neutral,
            finalState: vacuum ? 'vacuum' : neutral ? 'neutral' : 'charged_residue',
            historyLength: history.length
        };
    }

    exportState() {
        return {
            mode: this.mode,
            topology: cloneValue({
                name: this.topology.name,
                sizes: this.topology.sizes,
                lattice: this.topology.lattice
            }),
            config: cloneValue(this.config),
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            board: [...this.board.entries()].map(([key, particle]) => ({
                key,
                coord: this.coordFromKey(key),
                ...cloneValue(particle)
            })),
            history: cloneValue(this.history),
            physicsHistory: cloneValue(this.physicsHistory),
            observables: this.computePhysicalObservables(),
            physicalAnswer: this.computePhysicalAnswer(),
            positionHistory: cloneValue(this.positionHistory)
        };
    }
}
