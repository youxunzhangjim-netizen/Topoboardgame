import { SeededRandom } from '../probability/SeededRandom.js';
import { coordKey, createGraphTopology, sumHomology } from '../topology/GraphTopologies.js';

export const TWO_PHASE_COMPETITION_GAME_MODE = 'two_phase_competition_game';

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

function phaseForPlayer(player) {
    return player === 'white' ? 'B' : 'A';
}

function colorForPhase(phase) {
    return phase === 'B' ? 'white' : 'black';
}

function mod(value, size) {
    return ((value % size) + size) % size;
}

function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export class TwoPhaseCompetitionGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = TWO_PHASE_COMPETITION_GAME_MODE;
        this.topology = createGraphTopology(options.topology || options);
        this.currentPlayer = options.currentPlayer || 'black';
        this.board = new Map();
        this.history = [];
        this.positionHistory = [];
        this.moveNumber = 0;
        this.nucleationCount = 0;
        this.config = {
            interfaceCost: Number.isFinite(Number(options.twoPhase?.interfaceCost)) ? Number(options.twoPhase.interfaceCost) : 1,
            biasA: Number.isFinite(Number(options.twoPhase?.biasA)) ? Number(options.twoPhase.biasA) : 0,
            biasB: Number.isFinite(Number(options.twoPhase?.biasB)) ? Number(options.twoPhase.biasB) : 0,
            curvaturePenaltyEnabled: Boolean(options.twoPhase?.curvaturePenaltyEnabled),
            curvaturePenalty: Math.max(0, Number(options.twoPhase?.curvaturePenalty) || 0.25),
            noiseEnabled: Boolean(options.twoPhase?.noiseEnabled),
            noiseRate: Math.max(0, Math.min(1, Number(options.twoPhase?.noiseRate) || 0.02)),
            initialState: options.twoPhase?.initialState || 'phase_separated',
            seed: options.twoPhase?.seed || 'two-phase-competition-game'
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

    getPhase(coord) {
        const normalized = this.normalize(coord);
        if (!normalized) return null;
        return this.board.get(coordKey(normalized)) ?? null;
    }

    getStone(coord) {
        const phase = this.getPhase(coord);
        if (!phase) return null;
        return {
            color: colorForPhase(phase),
            phase,
            pauliLabel: phase,
            label: phase === 'A' ? 'phase A' : 'phase B'
        };
    }

    setPhase(coord, phase) {
        const normalized = this.normalize(coord);
        if (!normalized) return false;
        this.board.set(coordKey(normalized), phase === 'B' ? 'B' : 'A');
        return true;
    }

    deletePhase(coord) {
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
        this.nucleationCount = 0;
        const vertices = this.topology.vertices();
        if (initialState === 'random_droplets') return this.seedRandomDroplets(vertices);
        if (initialState === 'single_nucleus') return this.seedSingleNucleus(vertices);
        if (initialState === 'two_nuclei') return this.seedTwoNuclei(vertices);
        if (initialState === 'stripe_domains') return this.seedStripes(vertices);
        if (initialState === 'metastable_empty') return this.ensureSeededGrowthSites();
        return this.seedPhaseSeparated(vertices);
    }

    seedPhaseSeparated(vertices) {
        const [width] = this.topology.sizes;
        const split = Math.floor(width / 2);
        for (const coord of vertices) {
            if (coord[0] === split) continue;
            this.setPhase(coord, coord[0] < split ? 'A' : 'B');
        }
        this.ensureSeededGrowthSites();
    }

    seedRandomDroplets(vertices) {
        for (const coord of vertices) {
            if (this.rng.next() > 0.22) continue;
            this.setPhase(coord, this.rng.next() < 0.5 ? 'A' : 'B');
            this.nucleationCount++;
        }
        this.ensureSeededGrowthSites();
    }

    seedSingleNucleus(vertices) {
        const center = this.topology.sizes.map((size) => Math.floor(size / 2));
        this.setPhase(center, 'A');
        this.nucleationCount = 1;
        this.ensureSeededGrowthSites();
        if (!vertices.some((coord) => this.getPhase(coord) === 'B')) {
            this.setPhase(vertices.at(-1), 'B');
            this.nucleationCount++;
        }
    }

    seedTwoNuclei(vertices) {
        const [width, height] = this.topology.sizes;
        this.setPhase([Math.floor(width / 3), Math.floor(height / 2)], 'A');
        this.setPhase([Math.floor((2 * width) / 3), Math.floor(height / 2)], 'B');
        this.nucleationCount = 2;
        this.ensureSeededGrowthSites();
        if (!vertices.some((coord) => this.getPhase(coord) === 'A')) this.setPhase(vertices[0], 'A');
        if (!vertices.some((coord) => this.getPhase(coord) === 'B')) this.setPhase(vertices.at(-1), 'B');
    }

    seedStripes(vertices) {
        const width = this.topology.sizes[0];
        const stripe = Math.max(1, Math.floor(width / 4));
        for (const coord of vertices) {
            if ((Math.floor(coord[0] / stripe) % 2) === 0) this.setPhase(coord, 'A');
            else this.setPhase(coord, 'B');
        }
        for (let y = 0; y < (this.topology.sizes[1] || width); y += 2) {
            this.deletePhase([mod(Math.floor(width / 2), width), y]);
        }
    }

    ensureSeededGrowthSites() {
        const vertices = this.topology.vertices();
        const [width, height] = this.topology.sizes;
        const center = [Math.floor(width / 2), Math.floor((height || width) / 2)];
        if (!vertices.some((coord) => this.getPhase(coord) === 'A')) {
            this.setPhase(center, 'A');
            this.nucleationCount++;
        }
        if (!vertices.some((coord) => this.getPhase(coord) === 'B')) {
            this.setPhase([mod(center[0] + 1, width), center[1]], 'B');
            this.nucleationCount++;
        }
        const candidates = [
            center,
            [mod(center[0] - 1, width), center[1]],
            [mod(center[0] + 2, width), center[1]]
        ];
        for (const coord of candidates) this.deletePhase(coord);
    }

    edgePairs() {
        const pairs = [];
        const seen = new Set();
        for (const coord of this.topology.vertices()) {
            for (const direction of this.topology.directions()) {
                const step = this.topology.step(coord, direction);
                if (!step) continue;
                const key = [coordKey(coord), coordKey(step.coord)].sort().join('|');
                if (seen.has(key)) continue;
                seen.add(key);
                pairs.push({ from: coord, to: step.coord, edge: step.edge });
            }
        }
        return pairs;
    }

    interfaceEdges(board = this.board) {
        return this.edgePairs().filter(({ from, to }) => {
            const a = board.get(coordKey(from));
            const b = board.get(coordKey(to));
            return a && b && a !== b;
        });
    }

    curvaturePenaltyForBoard(board = this.board) {
        if (!this.config.curvaturePenaltyEnabled) return 0;
        let bends = 0;
        for (const coord of this.topology.vertices()) {
            const phase = board.get(coordKey(coord));
            if (!phase) continue;
            let opposite = 0;
            for (const neighbor of this.topology.neighbors(coord)) {
                const nPhase = board.get(coordKey(neighbor));
                if (nPhase && nPhase !== phase) opposite++;
            }
            if (opposite >= 2) bends += Math.max(0, opposite - 1);
        }
        return this.config.curvaturePenalty * bends;
    }

    energyForBoard(board = this.board) {
        let areaA = 0;
        let areaB = 0;
        for (const phase of board.values()) {
            if (phase === 'A') areaA++;
            else if (phase === 'B') areaB++;
        }
        return this.config.interfaceCost * this.interfaceEdges(board).length
            - this.config.biasA * areaA
            - this.config.biasB * areaB
            + this.curvaturePenaltyForBoard(board);
    }

    applyMutation({ player = this.currentPlayer, action, affectedVertices, mutate, metadata = {} }) {
        const beforeEnergy = this.energyForBoard();
        const trial = new Map(this.board);
        mutate(trial);
        const noise = this.applyNoiseDroplets(trial, affectedVertices);
        const afterEnergy = this.energyForBoard(trial);
        this.board = trial;
        this.moveNumber++;
        const observables = this.computePhysicalObservables({ deltaEnergy: afterEnergy - beforeEnergy });
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            tick: this.moveNumber,
            player,
            type: action,
            action,
            affectedVertices: [...affectedVertices, ...noise.map((entry) => entry.coord)].map((coord) => [...coord]),
            affectedEdges: this.affectedInterfaceEdges(affectedVertices),
            physicalUpdate: {
                beforeEnergy,
                afterEnergy,
                deltaEnergy: afterEnergy - beforeEnergy,
                noise
            },
            observables,
            ...metadata
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.recordPosition(action);
        return { ok: true, event };
    }

    applyNoiseDroplets(board, protectedVertices = []) {
        if (!this.config.noiseEnabled || this.config.noiseRate <= 0) return [];
        const protectedKeys = new Set(protectedVertices.map(coordKey));
        const empties = this.topology.vertices()
            .filter((coord) => !protectedKeys.has(coordKey(coord)) && !board.has(coordKey(coord)));
        const noise = [];
        for (const coord of empties) {
            if (this.rng.next() >= this.config.noiseRate) continue;
            const phase = this.rng.next() < 0.5 ? 'A' : 'B';
            board.set(coordKey(coord), phase);
            this.nucleationCount++;
            noise.push({ type: 'random_droplet', coord: [...coord], phase });
        }
        return noise;
    }

    affectedInterfaceEdges(vertices) {
        const keys = new Set(vertices.map(coordKey));
        return this.edgePairs()
            .filter(({ from, to }) => keys.has(coordKey(from)) || keys.has(coordKey(to)))
            .map(({ from, to, edge }) => ({ from, to, homology: edge.homology, twisted: edge.twisted }));
    }

    nucleate(coord, player = this.currentPlayer) {
        const normalized = this.normalize(coord);
        if (!normalized) return { ok: false, error: 'Choose a valid graph vertex.' };
        if (!this.isEmpty(normalized)) return { ok: false, error: 'Nucleation requires an empty metastable site.' };
        const phase = phaseForPlayer(player);
        this.nucleationCount++;
        return this.applyMutation({
            player,
            action: 'nucleate_phase',
            affectedVertices: [normalized],
            mutate: (board) => board.set(coordKey(normalized), phase),
            metadata: { phase }
        });
    }

    growDomain(coord, player = this.currentPlayer) {
        const normalized = this.normalize(coord);
        if (!normalized) return { ok: false, error: 'Choose a valid graph vertex.' };
        if (!this.isEmpty(normalized)) return { ok: false, error: 'Growth must enter a neighboring empty site.' };
        const phase = phaseForPlayer(player);
        const touchesOwnPhase = this.topology.neighbors(normalized).some((neighbor) => this.getPhase(neighbor) === phase);
        if (!touchesOwnPhase) return { ok: false, error: 'Growth requires a neighboring same-phase domain.' };
        return this.applyMutation({
            player,
            action: 'grow_domain',
            affectedVertices: [normalized],
            mutate: (board) => board.set(coordKey(normalized), phase),
            metadata: { phase }
        });
    }

    deltaEnergyForInterfaceFlip(coord, phase) {
        const normalized = this.normalize(coord);
        if (!normalized || !this.getPhase(normalized)) return Infinity;
        const before = this.energyForBoard();
        const trial = new Map(this.board);
        trial.set(coordKey(normalized), phase);
        return this.energyForBoard(trial) - before;
    }

    flipInterface(coord, player = this.currentPlayer) {
        const normalized = this.normalize(coord);
        if (!normalized) return { ok: false, error: 'Choose a valid graph vertex.' };
        const current = this.getPhase(normalized);
        if (!current) return { ok: false, error: 'Flip requires an occupied interface site.' };
        const phase = phaseForPlayer(player);
        if (current === phase) return { ok: false, error: 'Choose an opposite-phase interface site.' };
        const hasInterface = this.topology.neighbors(normalized).some((neighbor) => {
            const neighborPhase = this.getPhase(neighbor);
            return neighborPhase && neighborPhase !== current;
        });
        if (!hasInterface) return { ok: false, error: 'The selected site is not on an interface.' };
        const deltaEnergy = this.deltaEnergyForInterfaceFlip(normalized, phase);
        if (deltaEnergy > 0) return { ok: false, error: `Energetically forbidden interface flip: deltaE ${deltaEnergy.toFixed(3)}.` };
        return this.applyMutation({
            player,
            action: 'flip_interface',
            affectedVertices: [normalized],
            mutate: (board) => board.set(coordKey(normalized), phase),
            metadata: { beforePhase: current, afterPhase: phase }
        });
    }

    legalMoves(player = this.currentPlayer) {
        const phase = phaseForPlayer(player);
        const moves = [];
        for (const coord of this.topology.vertices()) {
            if (this.isEmpty(coord)) {
                moves.push({ coord, action: 'nucleate_phase', player });
                if (this.topology.neighbors(coord).some((neighbor) => this.getPhase(neighbor) === phase)) {
                    moves.push({ coord, action: 'grow_domain', player });
                }
            } else if (this.getPhase(coord) !== phase && this.deltaEnergyForInterfaceFlip(coord, phase) <= 0) {
                moves.push({ coord, action: 'flip_interface', player });
            }
        }
        return moves;
    }

    pass(player = this.currentPlayer) {
        return this.applyMutation({
            player,
            action: 'pass',
            affectedVertices: [],
            mutate: () => {}
        });
    }

    counts() {
        const counts = { black: 0, white: 0, empty: 0 };
        for (const coord of this.topology.vertices()) {
            const phase = this.getPhase(coord);
            if (!phase) counts.empty++;
            else counts[colorForPhase(phase)]++;
        }
        return counts;
    }

    connectedDomain(coord) {
        const normalized = this.normalize(coord);
        const phase = this.getPhase(normalized);
        if (!normalized || !phase) return [];
        const queue = [normalized];
        const seen = new Set([coordKey(normalized)]);
        const domain = [];
        while (queue.length) {
            const current = queue.shift();
            domain.push(current);
            for (const neighbor of this.topology.neighbors(current)) {
                const key = coordKey(neighbor);
                if (seen.has(key) || this.getPhase(neighbor) !== phase) continue;
                seen.add(key);
                queue.push(neighbor);
            }
        }
        return domain;
    }

    domains() {
        const seen = new Set();
        const domains = [];
        for (const coord of this.topology.vertices()) {
            const key = coordKey(coord);
            const phase = this.getPhase(coord);
            if (!phase || seen.has(key)) continue;
            const vertices = this.connectedDomain(coord);
            for (const vertex of vertices) seen.add(coordKey(vertex));
            domains.push({ phase, color: colorForPhase(phase), size: vertices.length, vertices });
        }
        return domains;
    }

    computePhysicalObservables({ deltaEnergy = 0 } = {}) {
        const vertices = this.topology.vertices();
        const counts = this.counts();
        const total = vertices.length || 1;
        const interfaces = this.interfaceEdges();
        const domainList = this.domains();
        const homology = sumHomology(interfaces.map((entry) => entry.edge));
        const noncontractibleInterfaces = ['torus', 'klein_bottle', 'mobius', 'rp2', 'sphere_latitude'].includes(this.topology.name)
            ? Number(Boolean(homology.x)) + Number(Boolean(homology.y)) + Number(Boolean(homology.z)) + Number(Boolean(homology.w))
            : 0;
        const chronological = [...this.history].reverse();
        const last = chronological.at(-1)?.observables;
        const previous = chronological.at(-2)?.observables;
        const coarseningRate = last && previous
            ? (Number(last.interfaceLength || 0) - Number(previous.interfaceLength || 0))
            : 0;
        const emptyHistory = chronological.filter((entry) => Number.isFinite(entry.observables?.metastableEmptySites));
        const metastableLifetime = emptyHistory.reduce((life, entry) =>
            entry.observables.metastableEmptySites > 0 ? entry.tick : life, 0);
        return {
            tick: this.moveNumber,
            energy: this.energyForBoard(),
            deltaEnergy,
            areaFractionA: counts.black / total,
            areaFractionB: counts.white / total,
            metastableFraction: counts.empty / total,
            areaA: counts.black,
            areaB: counts.white,
            metastableEmptySites: counts.empty,
            interfaceLength: interfaces.length,
            numberOfDomains: domainList.length,
            numberOfPhaseADomains: domainList.filter((domain) => domain.phase === 'A').length,
            numberOfPhaseBDomains: domainList.filter((domain) => domain.phase === 'B').length,
            largestDomain: domainList.length ? Math.max(...domainList.map((domain) => domain.size)) : 0,
            nucleationCount: this.nucleationCount,
            coarseningRate,
            windingInterfaceCount: noncontractibleInterfaces,
            noncontractibleInterfaces,
            twistedSector: ['mobius', 'klein_bottle', 'rp2'].includes(this.topology.name)
                ? (interfaces.filter(({ edge }) => edge.twisted).length % 2 ? 'twisted' : 'untwisted')
                : 'none',
            interfaceHomology: homology,
            metastableLifetime,
            counts
        };
    }

    computePhysicalAnswer(history = this.history) {
        const observables = this.computePhysicalObservables();
        const winnerPhase = observables.areaFractionA === observables.areaFractionB
            ? 'tie'
            : observables.areaFractionA > observables.areaFractionB ? 'phase_A' : 'phase_B';
        const phaseSeparationOccurred = observables.numberOfDomains <= 2
            && observables.interfaceLength > 0
            && observables.metastableFraction < 0.12;
        const topologyStabilizedInterface = observables.noncontractibleInterfaces > 0
            || observables.twistedSector === 'twisted';
        const chronological = [...history].reverse();
        const usable = chronological
            .map((entry) => ({ tick: entry.tick, length: entry.observables?.interfaceLength }))
            .filter((entry) => entry.tick > 0 && entry.length > 0);
        let coarseningExponentEstimate = null;
        if (usable.length >= 4) {
            const xs = usable.map((entry) => Math.log(entry.tick));
            const ys = usable.map((entry) => Math.log(entry.length));
            const xMean = mean(xs);
            const yMean = mean(ys);
            const denom = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
            if (denom > 0) {
                coarseningExponentEstimate = -xs.reduce((sum, x, index) =>
                    sum + (x - xMean) * (ys[index] - yMean), 0) / denom;
            }
        }
        return {
            winnerPhase,
            finalAreaFraction: {
                phaseA: observables.areaFractionA,
                phaseB: observables.areaFractionB,
                metastable: observables.metastableFraction
            },
            phaseSeparationOccurred,
            topologyStabilizedInterface,
            coarseningExponentEstimate,
            finalEnergy: observables.energy,
            interfaceLength: observables.interfaceLength,
            summary: `${winnerPhase} wins by area fraction A=${observables.areaFractionA.toFixed(3)}, B=${observables.areaFractionB.toFixed(3)}; phase separation ${phaseSeparationOccurred ? 'occurred' : 'not complete'}; topology-stabilized interface ${topologyStabilizedInterface ? 'yes' : 'no'}.`
        };
    }

    recordPosition(type) {
        this.positionHistory.push({
            type,
            number: this.moveNumber,
            phases: [...this.board.entries()].map(([key, phase]) => ({ key, coord: key.split(',').map(Number), phase }))
        });
    }

    exportState() {
        return {
            mode: this.mode,
            physicalSystemName: 'Two-phase competition graph substrate',
            blackWhiteMeaning: 'black = phase A; white = phase B; empty = metastable or unconverted region',
            initialStateOptions: ['phase_separated', 'random_droplets', 'single_nucleus', 'two_nuclei', 'stripe_domains', 'metastable_empty'],
            allowedActions: ['nucleate_phase', 'grow_domain', 'flip_interface', 'pass'],
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions,
                lattice: this.topology.lattice
            },
            config: cloneValue(this.config),
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            board: [...this.board.entries()].map(([key, phase]) => ({
                key,
                coord: key.split(',').map(Number),
                phase,
                color: colorForPhase(phase)
            })),
            observables: this.computePhysicalObservables(),
            physicalAnswer: this.computePhysicalAnswer(),
            history: cloneValue(this.history)
        };
    }
}
