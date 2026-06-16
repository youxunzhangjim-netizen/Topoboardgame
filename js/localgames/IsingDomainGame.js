import { SeededRandom } from '../probability/SeededRandom.js';
import { coordKey, createGraphTopology, sumHomology } from '../topology/GraphTopologies.js';

export const ISING_DOMAIN_GAME_MODE = 'ising_domain_game';

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

function spinForPlayer(player) {
    return player === 'white' ? -1 : 1;
}

function colorForSpin(spin) {
    return spin < 0 ? 'white' : 'black';
}

function mod(value, size) {
    return ((value % size) + size) % size;
}

function spinLabel(spin) {
    return spin < 0 ? 's=-1' : 's=+1';
}

export class IsingDomainGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = ISING_DOMAIN_GAME_MODE;
        this.topology = createGraphTopology(options.topology || options);
        this.currentPlayer = options.currentPlayer || 'black';
        this.board = new Map();
        this.history = [];
        this.positionHistory = [];
        this.moveNumber = 0;
        this.config = {
            J: Number.isFinite(Number(options.ising?.J)) ? Number(options.ising.J) : 1,
            h: Number.isFinite(Number(options.ising?.h)) ? Number(options.ising.h) : 0,
            temperature: Math.max(0, Number(options.ising?.temperature) || 0),
            metropolis: Boolean(options.ising?.metropolis),
            domainFlipEnabled: Boolean(options.ising?.domainFlipEnabled),
            bracketFlipEnabled: Boolean(options.ising?.bracketFlipEnabled),
            wallThickness: Math.max(1, Math.min(8, Math.floor(Number(options.ising?.wallThickness) || 1))),
            initialState: options.ising?.initialState || 'domain_wall_seed',
            seed: options.ising?.seed || 'ising-domain-game'
        };
        this.rng = new SeededRandom(this.config.seed);
        this.initialObservables = null;
        this.setupInitialState(this.config.initialState);
        this.recordPosition('setup');
        this.initialObservables = this.computePhysicalObservables();
    }

    normalize(coord) {
        return this.topology.normalize(coord);
    }

    getSpin(coord) {
        const normalized = this.normalize(coord);
        if (!normalized) return null;
        return this.board.get(coordKey(normalized)) ?? null;
    }

    getStone(coord) {
        const spin = this.getSpin(coord);
        if (spin == null) return null;
        return {
            color: colorForSpin(spin),
            spin,
            isingSpin: spin,
            pauliLabel: spin > 0 ? '+' : '-',
            label: spinLabel(spin)
        };
    }

    setSpin(coord, spin) {
        const normalized = this.normalize(coord);
        if (!normalized) return false;
        this.board.set(coordKey(normalized), spin < 0 ? -1 : 1);
        return true;
    }

    deleteSpin(coord) {
        const normalized = this.normalize(coord);
        if (!normalized) return false;
        return this.board.delete(coordKey(normalized));
    }

    isEmpty(coord) {
        const normalized = this.normalize(coord);
        return Boolean(normalized) && !this.board.has(coordKey(normalized));
    }

    setupInitialState(initialState) {
        this.board.clear();
        const vertices = this.topology.vertices();
        if (initialState === 'random_spins') return this.seedRandomSpins(vertices, 0.72);
        if (initialState === 'droplet_seed') return this.seedDroplet(vertices);
        if (initialState === 'stripe_seed') return this.seedStripe(vertices);
        if (initialState === 'checkerboard') return this.seedCheckerboard(vertices);
        if (initialState === 'thermal_sample') return this.seedThermalSample(vertices);
        return this.seedDomainWall(vertices);
    }

    seedRandomSpins(vertices, fill = 0.72) {
        for (const coord of vertices) {
            if (this.rng.next() > fill) continue;
            this.setSpin(coord, this.rng.next() < 0.5 ? 1 : -1);
        }
        this.ensureImmediateLegalMoves();
    }

    seedDomainWall(vertices) {
        const [width, height] = this.topology.sizes;
        const split = Math.floor(width / 2);
        const gapStart = Math.max(0, split - Math.floor(this.config.wallThickness / 2));
        const gapEnd = Math.min(width - 1, gapStart + this.config.wallThickness - 1);
        for (const coord of vertices) {
            const x = coord[0];
            if (x >= gapStart && x <= gapEnd) continue;
            this.setSpin(coord, x < split ? 1 : -1);
        }
        const centerY = Math.floor(height / 2);
        this.setSpin([mod(gapStart - 1, width), centerY], 1);
        this.setSpin([mod(gapEnd + 1, width), centerY], -1);
        this.ensureImmediateLegalMoves();
    }

    seedDroplet(vertices) {
        const sizes = this.topology.sizes;
        const center = sizes.map((size) => Math.floor(size / 2));
        const radius = Math.max(1, Math.floor(Math.min(sizes[0], sizes[1] || sizes[0]) / 4));
        for (const coord of vertices) {
            const distance = Math.sqrt(coord.reduce((sum, value, axis) => sum + (value - center[axis]) ** 2, 0));
            if (distance <= radius) this.setSpin(coord, -1);
            else if (this.rng.next() < 0.55) this.setSpin(coord, 1);
        }
        this.ensureImmediateLegalMoves();
    }

    seedStripe(vertices) {
        const thickness = Math.max(1, this.config.wallThickness);
        for (const coord of vertices) {
            if ((Math.floor(coord[0] / thickness) % 2) === 0) this.setSpin(coord, 1);
            else this.setSpin(coord, -1);
        }
        this.openUndecidedSites();
    }

    seedCheckerboard(vertices) {
        for (const coord of vertices) {
            this.setSpin(coord, coord.reduce((sum, value) => sum + value, 0) % 2 === 0 ? 1 : -1);
        }
        this.openUndecidedSites();
    }

    seedThermalSample(vertices) {
        const beta = this.config.temperature > 0 ? 1 / this.config.temperature : 1;
        for (const coord of vertices) {
            const fieldBias = Math.tanh(beta * this.config.h);
            const probabilityUp = Math.max(0.05, Math.min(0.95, 0.5 + 0.5 * fieldBias));
            if (this.rng.next() < 0.82) this.setSpin(coord, this.rng.next() < probabilityUp ? 1 : -1);
        }
        for (let sweep = 0; sweep < 2; sweep++) {
            for (const coord of vertices) {
                if (this.getSpin(coord) == null) continue;
                const delta = this.deltaEnergyForFlip(coord);
                if (delta <= 0 || this.rng.next() < Math.exp(-delta / Math.max(0.001, this.config.temperature || 1))) {
                    this.setSpin(coord, -this.getSpin(coord));
                }
            }
        }
        this.ensureImmediateLegalMoves();
    }

    openUndecidedSites() {
        const vertices = this.topology.vertices();
        const [width, height] = this.topology.sizes;
        const candidates = [
            [Math.floor(width / 2), Math.floor(height / 2)],
            [Math.max(0, Math.floor(width / 2) - 1), Math.floor(height / 2)],
            [Math.floor(width / 2), Math.max(0, Math.floor(height / 2) - 1)]
        ];
        for (const coord of candidates) this.deleteSpin(coord);
        if (![...this.board.values()].includes(1)) this.setSpin(vertices[0], 1);
        if (![...this.board.values()].includes(-1)) this.setSpin(vertices[vertices.length - 1], -1);
    }

    ensureImmediateLegalMoves() {
        this.openUndecidedSites();
        const empties = this.topology.vertices().filter((coord) => this.isEmpty(coord));
        if (empties.length >= 2) return;
        const occupied = this.topology.vertices().filter((coord) => this.getSpin(coord) != null);
        for (const coord of occupied.slice(0, 2 - empties.length)) this.deleteSpin(coord);
    }

    edgePairs() {
        const pairs = [];
        const seen = new Set();
        for (const coord of this.topology.vertices()) {
            for (const direction of this.topology.directions()) {
                const step = this.topology.step(coord, direction);
                if (!step) continue;
                const a = coordKey(coord);
                const b = coordKey(step.coord);
                const key = [a, b].sort().join('|');
                if (seen.has(key)) continue;
                seen.add(key);
                pairs.push({ from: coord, to: step.coord, edge: step.edge });
            }
        }
        return pairs;
    }

    energyForBoard(board = this.board) {
        let interaction = 0;
        for (const { from, to } of this.edgePairs()) {
            const si = board.get(coordKey(from));
            const sj = board.get(coordKey(to));
            if (si == null || sj == null) continue;
            interaction += si * sj;
        }
        let field = 0;
        for (const spin of board.values()) field += spin;
        return -this.config.J * interaction - this.config.h * field;
    }

    deltaEnergyForMutation(mutator) {
        const before = this.energyForBoard();
        const next = new Map(this.board);
        mutator(next);
        return this.energyForBoard(next) - before;
    }

    deltaEnergyForFlip(coord) {
        const normalized = this.normalize(coord);
        if (!normalized || this.getSpin(normalized) == null) return 0;
        return this.deltaEnergyForMutation((next) => {
            const key = coordKey(normalized);
            next.set(key, -next.get(key));
        });
    }

    metropolisAccept(deltaEnergy) {
        if (!this.config.metropolis) {
            return { accepted: true, probability: 1, roll: null };
        }
        if (deltaEnergy <= 0) return { accepted: true, probability: 1, roll: null };
        const temperature = Math.max(0, this.config.temperature);
        const probability = temperature <= 0 ? 0 : Math.exp(-deltaEnergy / temperature);
        const roll = this.rng.next();
        return { accepted: roll < probability, probability, roll };
    }

    applyMutation({ player = this.currentPlayer, action, affectedVertices, mutate, metadata = {} }) {
        const beforeEnergy = this.energyForBoard();
        const trial = new Map(this.board);
        mutate(trial);
        const afterEnergy = this.energyForBoard(trial);
        const deltaEnergy = afterEnergy - beforeEnergy;
        const metropolis = this.metropolisAccept(deltaEnergy);
        if (metropolis.accepted) this.board = trial;
        this.moveNumber++;
        const observables = this.computePhysicalObservables({ deltaEnergy, acceptedMove: metropolis.accepted });
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            tick: this.moveNumber,
            player,
            type: action,
            action,
            affectedVertices: affectedVertices.map((coord) => [...coord]),
            affectedEdges: this.affectedDomainWallEdges(affectedVertices),
            physicalUpdate: {
                beforeEnergy,
                afterEnergy: metropolis.accepted ? afterEnergy : beforeEnergy,
                proposedEnergy: afterEnergy,
                deltaEnergy,
                acceptedMove: metropolis.accepted,
                metropolisProbability: metropolis.probability,
                metropolisRoll: metropolis.roll
            },
            observables,
            ...metadata
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.recordPosition(action);
        return { ok: true, event, accepted: metropolis.accepted };
    }

    affectedDomainWallEdges(vertices) {
        const keys = new Set(vertices.map(coordKey));
        return this.edgePairs()
            .filter(({ from, to }) => keys.has(coordKey(from)) || keys.has(coordKey(to)))
            .map(({ from, to, edge }) => ({ from, to, homology: edge.homology, twisted: edge.twisted }));
    }

    placeSpin(coord, player = this.currentPlayer) {
        const normalized = this.normalize(coord);
        if (!normalized) return { ok: false, error: 'Choose a valid graph vertex.' };
        if (!this.isEmpty(normalized)) return { ok: false, error: 'Place spin only on an empty / undecided site.' };
        const spin = spinForPlayer(player);
        return this.applyMutation({
            player,
            action: 'place_spin',
            affectedVertices: [normalized],
            mutate: (board) => board.set(coordKey(normalized), spin),
            metadata: { spin }
        });
    }

    flipSpin(coord, player = this.currentPlayer) {
        const normalized = this.normalize(coord);
        const current = this.getSpin(normalized);
        if (!normalized || current == null) return { ok: false, error: 'Choose an occupied spin to flip.' };
        return this.applyMutation({
            player,
            action: 'flip_spin',
            affectedVertices: [normalized],
            mutate: (board) => board.set(coordKey(normalized), -current),
            metadata: { beforeSpin: current, afterSpin: -current }
        });
    }

    connectedDomain(coord) {
        const normalized = this.normalize(coord);
        const spin = this.getSpin(normalized);
        if (!normalized || spin == null) return [];
        const queue = [normalized];
        const seen = new Set([coordKey(normalized)]);
        const domain = [];
        while (queue.length) {
            const current = queue.shift();
            domain.push(current);
            for (const neighbor of this.topology.neighbors(current)) {
                const key = coordKey(neighbor);
                if (seen.has(key) || this.getSpin(neighbor) !== spin) continue;
                seen.add(key);
                queue.push(neighbor);
            }
        }
        return domain;
    }

    flipDomain(coord, player = this.currentPlayer) {
        if (!this.config.domainFlipEnabled) return { ok: false, error: 'Connected-domain flips are disabled.' };
        const domain = this.connectedDomain(coord);
        if (!domain.length) return { ok: false, error: 'Choose an occupied spin domain.' };
        return this.applyMutation({
            player,
            action: 'flip_domain',
            affectedVertices: domain,
            mutate: (board) => {
                for (const vertex of domain) {
                    const key = coordKey(vertex);
                    board.set(key, -board.get(key));
                }
            },
            metadata: { domainSize: domain.length }
        });
    }

    bracketPreview(coord, player = this.currentPlayer) {
        const normalized = this.normalize(coord);
        if (!normalized) return { legal: false, flips: [] };
        const playerSpin = spinForPlayer(player);
        const targetSpin = this.getSpin(normalized);
        if (targetSpin == null) return { legal: false, flips: [] };
        const flips = [];
        for (const direction of this.topology.rayDirections()) {
            const chain = [];
            let cursor = normalized;
            const seen = new Set([coordKey(normalized)]);
            for (let stepIndex = 0; stepIndex < this.topology.maxRaySteps; stepIndex++) {
                const step = this.topology.step(cursor, direction);
                if (!step) break;
                const key = coordKey(step.coord);
                if (seen.has(key)) break;
                seen.add(key);
                const spin = this.getSpin(step.coord);
                if (spin == null) break;
                if (spin === -playerSpin) {
                    chain.push(step.coord);
                    cursor = step.coord;
                    continue;
                }
                if (spin === playerSpin && chain.length) flips.push(...chain);
                break;
            }
        }
        const unique = new Map(flips.map((vertex) => [coordKey(vertex), vertex]));
        return { legal: unique.size > 0, flips: [...unique.values()] };
    }

    bracketFlip(coord, player = this.currentPlayer) {
        if (!this.config.bracketFlipEnabled) return { ok: false, error: 'Reversi-like bracket flips are disabled.' };
        const normalized = this.normalize(coord);
        const preview = this.bracketPreview(normalized, player);
        if (!preview.legal) return { ok: false, error: 'Choose a spin that brackets an opposite-spin chain.' };
        const playerSpin = spinForPlayer(player);
        return this.applyMutation({
            player,
            action: 'bracket_flip',
            affectedVertices: [normalized, ...preview.flips],
            mutate: (board) => {
                board.set(coordKey(normalized), playerSpin);
                for (const vertex of preview.flips) board.set(coordKey(vertex), playerSpin);
            },
            metadata: { flipped: preview.flips.map((coord) => [...coord]) }
        });
    }

    legalMoves(player = this.currentPlayer) {
        return this.topology.vertices().filter((coord) => this.isEmpty(coord)).map((coord) => ({ coord, player }));
    }

    pass(player = this.currentPlayer) {
        this.moveNumber++;
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            tick: this.moveNumber,
            player,
            type: 'pass',
            action: 'pass',
            affectedVertices: [],
            affectedEdges: [],
            physicalUpdate: { deltaEnergy: 0, acceptedMove: true },
            observables: this.computePhysicalObservables({ deltaEnergy: 0, acceptedMove: true })
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.recordPosition('pass');
        return { ok: true, event };
    }

    counts() {
        const counts = { black: 0, white: 0, empty: 0 };
        for (const coord of this.topology.vertices()) {
            const spin = this.getSpin(coord);
            if (spin == null) counts.empty++;
            else counts[colorForSpin(spin)]++;
        }
        return counts;
    }

    domains() {
        const seen = new Set();
        const domains = [];
        for (const coord of this.topology.vertices()) {
            const key = coordKey(coord);
            const spin = this.getSpin(coord);
            if (spin == null || seen.has(key)) continue;
            const domain = this.connectedDomain(coord);
            for (const vertex of domain) seen.add(coordKey(vertex));
            domains.push({ spin, color: colorForSpin(spin), size: domain.length, vertices: domain });
        }
        return domains;
    }

    computePhysicalObservables({ deltaEnergy = 0, acceptedMove = null } = {}) {
        const vertices = this.topology.vertices();
        const occupied = vertices.filter((coord) => this.getSpin(coord) != null);
        const pairs = this.edgePairs();
        const wallEdges = [];
        let correlationSum = 0;
        let correlationCount = 0;
        for (const pair of pairs) {
            const si = this.getSpin(pair.from);
            const sj = this.getSpin(pair.to);
            if (si == null || sj == null) continue;
            correlationSum += si * sj;
            correlationCount++;
            if (si !== sj) wallEdges.push(pair);
        }
        const domainList = this.domains();
        const domainCounts = {
            black: domainList.filter((domain) => domain.spin > 0).length,
            white: domainList.filter((domain) => domain.spin < 0).length
        };
        const homology = sumHomology(wallEdges.map((entry) => entry.edge));
        const noncontractibleDomainWallCount = ['torus', 'klein_bottle', 'mobius', 'rp2', 'sphere_latitude'].includes(this.topology.name)
            ? Number(Boolean(homology.x)) + Number(Boolean(homology.y)) + Number(Boolean(homology.z)) + Number(Boolean(homology.w))
            : 0;
        const twistedCrossings = wallEdges.filter(({ edge }) => edge.twisted).length;
        const magnetization = occupied.length
            ? occupied.reduce((sum, coord) => sum + this.getSpin(coord), 0) / occupied.length
            : 0;
        return {
            tick: this.moveNumber,
            energy: this.energyForBoard(),
            deltaEnergy,
            acceptedMove,
            magnetization,
            domainWallLength: wallEdges.length,
            domainWallDensity: pairs.length ? wallEdges.length / pairs.length : 0,
            numberOfBlackDomains: domainCounts.black,
            numberOfWhiteDomains: domainCounts.white,
            largestDomainSize: domainList.length ? Math.max(...domainList.map((domain) => domain.size)) : 0,
            correlationEstimate: correlationCount ? correlationSum / correlationCount : 0,
            noncontractibleDomainWallCount,
            twistedSector: ['mobius', 'klein_bottle', 'rp2'].includes(this.topology.name)
                ? (twistedCrossings % 2 ? 'twisted' : 'untwisted')
                : 'none',
            wallHomology: homology,
            occupiedSites: occupied.length,
            emptySites: vertices.length - occupied.length,
            counts: this.counts()
        };
    }

    relaxationTime() {
        const initial = this.initialObservables?.energy ?? this.history.at(-1)?.observables?.energy ?? 0;
        const final = this.computePhysicalObservables().energy;
        const target = initial + 0.9 * (final - initial);
        const decreasing = final <= initial;
        const chronological = [...this.history].reverse();
        const found = chronological.find((entry) => {
            const energy = entry.observables?.energy;
            return Number.isFinite(energy) && (decreasing ? energy <= target : energy >= target);
        });
        return found?.tick ?? this.moveNumber;
    }

    stableDomainWallLifetime() {
        const chronological = [...this.history].reverse();
        let lifetime = 0;
        for (const entry of chronological) {
            if ((entry.observables?.domainWallLength || 0) > 0) lifetime = entry.tick;
        }
        return lifetime;
    }

    computePhysicalAnswer() {
        const observables = this.computePhysicalObservables();
        const initialEnergy = this.initialObservables?.energy ?? observables.energy;
        const energyDrop = initialEnergy - observables.energy;
        const phase = observables.twistedSector === 'twisted'
            ? 'twisted_sector'
            : observables.noncontractibleDomainWallCount > 0
                ? 'topological_domain_wall'
                : Math.abs(observables.magnetization) > 0.72 && observables.domainWallDensity < 0.18
                    ? 'ordered'
                    : observables.domainWallDensity > 0.42 || Math.abs(observables.correlationEstimate) < 0.22
                        ? 'disordered'
                        : 'metastable';
        return {
            finalPhase: phase,
            relaxationTime: this.relaxationTime(),
            stableDomainWallLifetime: this.stableDomainWallLifetime(),
            energyDrop,
            finalEnergy: observables.energy,
            finalMagnetization: observables.magnetization,
            summary: `Final phase ${phase}; energy ${observables.energy.toFixed(3)} (drop ${energyDrop.toFixed(3)}); magnetization ${observables.magnetization.toFixed(3)}; wall length ${observables.domainWallLength}; relaxation time ${this.relaxationTime()}.`
        };
    }

    recordPosition(type) {
        this.positionHistory.push({
            type,
            number: this.moveNumber,
            spins: [...this.board.entries()].map(([key, spin]) => ({ key, coord: key.split(',').map(Number), spin }))
        });
    }

    exportState() {
        const observables = this.computePhysicalObservables();
        return {
            mode: this.mode,
            physicalSystemName: 'Ising spin-domain graph system',
            blackWhiteMeaning: 'black = spin up s=+1; white = spin down s=-1; empty = unoccupied / undecided site',
            initialStateOptions: ['random_spins', 'domain_wall_seed', 'droplet_seed', 'stripe_seed', 'checkerboard', 'thermal_sample'],
            allowedActions: ['place_spin', 'flip_spin', 'flip_domain', 'bracket_flip', 'pass'],
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions,
                lattice: this.topology.lattice
            },
            config: cloneValue(this.config),
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            board: [...this.board.entries()].map(([key, spin]) => ({
                key,
                coord: key.split(',').map(Number),
                spin,
                color: colorForSpin(spin)
            })),
            counts: this.counts(),
            history: cloneValue(this.history),
            positionHistory: cloneValue(this.positionHistory),
            observables,
            physicalObservables: observables,
            physicalAnswer: this.computePhysicalAnswer()
        };
    }
}

export function createIsingDomainGame(options = {}) {
    return new IsingDomainGame(options);
}
