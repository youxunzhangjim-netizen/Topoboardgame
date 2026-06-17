import { SeededRandom } from '../probability/SeededRandom.js';
import { coordKey, createGraphTopology, sumHomology } from '../topology/GraphTopologies.js';

export const Z2_GAUGE_LOOP_GAME_MODE = 'z2_gauge_loop_game';

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

function compareCoord(a, b) {
    const ak = coordKey(a);
    const bk = coordKey(b);
    return ak < bk ? -1 : ak > bk ? 1 : 0;
}

function edgeKey(a, b) {
    return [coordKey(a), coordKey(b)].sort().join('|');
}

function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function product(values) {
    return values.reduce((acc, value) => acc * (value < 0 ? -1 : 1), 1);
}

export class Z2GaugeLoopGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = Z2_GAUGE_LOOP_GAME_MODE;
        const topologyOptions = options.topology && typeof options.topology === 'object'
            ? options.topology
            : options;
        this.topology = createGraphTopology(topologyOptions);
        this.currentPlayer = options.currentPlayer || 'black';
        this.history = [];
        this.positionHistory = [];
        this.moveNumber = 0;
        this.config = {
            pathLength: Math.max(1, Math.min(128, Math.floor(Number(options.z2Gauge?.pathLength) || 4))),
            edgeErrorRate: Math.max(0, Math.min(1, Number(options.z2Gauge?.edgeErrorRate) || 0.08)),
            noisyEdgeFlip: Boolean(options.z2Gauge?.noisyEdgeFlip),
            noiseRate: Math.max(0, Math.min(1, Number(options.z2Gauge?.noiseRate) || 0.02)),
            decoderEnabled: Boolean(options.z2Gauge?.decoderEnabled),
            initialState: options.z2Gauge?.initialState || 'gauge_vacuum',
            seed: options.z2Gauge?.seed || 'z2-gauge-loop-game'
        };
        this.rng = new SeededRandom(this.config.seed);
        this.edges = this.createEdges();
        this.plaquettes = this.createPlaquettes();
        this.edgeVariables = new Map();
        this.lastLoop = [];
        this.setupInitialState(this.config.initialState);
        this.recordPosition('setup');
        this.initialObservables = this.computePhysicalObservables();
    }

    createEdges() {
        const edges = [];
        const seen = new Set();
        for (const coord of this.topology.vertices()) {
            for (const direction of this.topology.directions()) {
                const step = this.topology.step(coord, direction);
                if (!step) continue;
                const first = compareCoord(coord, step.coord) <= 0 ? coord : step.coord;
                const second = first === coord ? step.coord : coord;
                const key = edgeKey(first, second);
                if (seen.has(key)) continue;
                seen.add(key);
                edges.push({
                    key,
                    a: [...first],
                    b: [...second],
                    edge: cloneValue(step.edge)
                });
            }
        }
        return edges;
    }

    edgeByKey(key) {
        return this.edges.find((edge) => edge.key === key) || null;
    }

    incidentEdges(coord) {
        const key = coordKey(coord);
        return this.edges.filter((edge) => coordKey(edge.a) === key || coordKey(edge.b) === key);
    }

    createPlaquettes() {
        const axes = Array.from({ length: this.topology.dimensions }, (_, axis) =>
            Array.from({ length: this.topology.dimensions }, (__, index) => index === axis ? 1 : 0));
        const plaquettes = [];
        const seen = new Set();
        for (const origin of this.topology.vertices()) {
            for (let a = 0; a < axes.length; a++) {
                for (let b = a + 1; b < axes.length; b++) {
                    const p1 = this.topology.step(origin, axes[a]);
                    const p2 = this.topology.step(origin, axes[b]);
                    if (!p1 || !p2) continue;
                    const p3 = this.topology.step(p1.coord, axes[b]);
                    const p4 = this.topology.step(p2.coord, axes[a]);
                    if (!p3 || !p4 || coordKey(p3.coord) !== coordKey(p4.coord)) continue;
                    const vertices = [origin, p1.coord, p3.coord, p2.coord];
                    const keys = [
                        edgeKey(vertices[0], vertices[1]),
                        edgeKey(vertices[1], vertices[2]),
                        edgeKey(vertices[2], vertices[3]),
                        edgeKey(vertices[3], vertices[0])
                    ];
                    if (keys.some((key) => !this.edgeByKey(key))) continue;
                    const key = [...keys].sort().join('#');
                    if (seen.has(key)) continue;
                    seen.add(key);
                    plaquettes.push({
                        key,
                        vertices: vertices.map((coord) => [...coord]),
                        edgeKeys: keys,
                        homology: sumHomology(keys.map((edgeId) => this.edgeByKey(edgeId)?.edge))
                    });
                }
            }
        }
        return plaquettes;
    }

    setupInitialState(initialState) {
        this.edgeVariables.clear();
        for (const edge of this.edges) this.edgeVariables.set(edge.key, 1);
        this.lastLoop = [];
        if (initialState === 'random_edge_errors') return this.seedRandomEdgeErrors();
        if (initialState === 'paired_charge_defects') return this.seedPairedChargeDefects();
        if (initialState === 'paired_flux_defects') return this.seedPairedFluxDefects();
        if (initialState === 'logical_loop_error') return this.seedLogicalLoopError();
    }

    seedRandomEdgeErrors() {
        for (const edge of this.edges) {
            if (this.rng.next() < this.config.edgeErrorRate) this.flipEdge(edge);
        }
    }

    seedPairedChargeDefects() {
        const edge = this.edges[Math.floor(this.edges.length / 2)] || this.edges[0];
        if (edge) this.flipEdge(edge);
    }

    seedPairedFluxDefects() {
        const face = this.plaquettes[Math.floor(this.plaquettes.length / 2)] || this.plaquettes[0];
        if (!face) return this.seedPairedChargeDefects();
        const edge = this.edgeByKey(face.edgeKeys[0]);
        if (edge) this.flipEdge(edge);
    }

    seedLogicalLoopError() {
        const loop = this.logicalLoopEdges('x');
        for (const edge of loop) this.flipEdge(edge);
        this.lastLoop = loop.map((edge) => edge.key);
    }

    value(edgeOrKey, variables = this.edgeVariables) {
        const key = typeof edgeOrKey === 'string' ? edgeOrKey : edgeOrKey.key;
        return variables.get(key) ?? 1;
    }

    flipEdge(edgeOrKey, variables = this.edgeVariables) {
        const key = typeof edgeOrKey === 'string' ? edgeOrKey : edgeOrKey.key;
        variables.set(key, -this.value(key, variables));
    }

    starValue(coord, variables = this.edgeVariables) {
        return product(this.incidentEdges(coord).map((edge) => this.value(edge, variables)));
    }

    plaquetteValue(plaquette, variables = this.edgeVariables) {
        return product(plaquette.edgeKeys.map((key) => this.value(key, variables)));
    }

    starViolations(variables = this.edgeVariables) {
        return this.topology.vertices()
            .map((coord) => ({ coord, value: this.starValue(coord, variables) }))
            .filter((entry) => entry.value < 0);
    }

    fluxViolations(variables = this.edgeVariables) {
        return this.plaquettes
            .map((plaquette) => ({ plaquette, value: this.plaquetteValue(plaquette, variables) }))
            .filter((entry) => entry.value < 0);
    }

    chooseIncidentEdge(coord) {
        const vertex = this.topology.normalize(coord);
        if (!vertex) return null;
        return this.incidentEdges(vertex)[0] || null;
    }

    pathFrom(coord, length = this.config.pathLength) {
        const start = this.topology.normalize(coord);
        if (!start) return [];
        const path = [];
        const seen = new Set();
        let cursor = start;
        for (let index = 0; index < length; index++) {
            const candidates = this.incidentEdges(cursor).filter((edge) => !seen.has(edge.key));
            if (!candidates.length) break;
            const edge = candidates[this.rng.integer(candidates.length)] || candidates[0];
            path.push(edge);
            seen.add(edge.key);
            cursor = coordKey(edge.a) === coordKey(cursor) ? edge.b : edge.a;
        }
        return path;
    }

    plaquetteAt(coord) {
        const key = coordKey(this.topology.normalize(coord) || coord);
        return this.plaquettes.find((plaquette) => plaquette.vertices.some((vertex) => coordKey(vertex) === key))
            || this.plaquettes[0]
            || null;
    }

    loopFrom(coord) {
        const plaquette = this.plaquetteAt(coord);
        if (!plaquette) return this.pathFrom(coord, 4);
        return plaquette.edgeKeys.map((key) => this.edgeByKey(key)).filter(Boolean);
    }

    logicalLoopEdges(axis = 'x') {
        if (!['torus', 'klein_bottle', 'mobius', 'rp2'].includes(this.topology.name)) return [];
        const axisIndex = { x: 0, y: 1, z: 2, w: 3 }[axis] ?? 0;
        if (axisIndex >= this.topology.dimensions) return [];
        const sizes = this.topology.sizes;
        const coord = sizes.map((size) => Math.floor(size / 2));
        coord[axisIndex] = 0;
        const direction = sizes.map((_, index) => index === axisIndex ? 1 : 0);
        const loop = [];
        const visited = new Set();
        let cursor = this.topology.normalize(coord);
        for (let stepIndex = 0; cursor && stepIndex < sizes[axisIndex] + 2; stepIndex++) {
            const step = this.topology.step(cursor, direction);
            if (!step) break;
            const key = edgeKey(cursor, step.coord);
            if (visited.has(key)) break;
            const edge = this.edgeByKey(key);
            if (edge) loop.push(edge);
            visited.add(key);
            cursor = step.coord;
            if (coordKey(cursor) === coordKey(coord)) break;
        }
        return loop;
    }

    applyNoise(variables, protectedKeys = new Set()) {
        if (!this.config.noisyEdgeFlip || this.config.noiseRate <= 0) return [];
        const noise = [];
        for (const edge of this.edges) {
            if (protectedKeys.has(edge.key) || this.rng.next() >= this.config.noiseRate) continue;
            this.flipEdge(edge, variables);
            noise.push({ type: 'noisy_edge_flip', edgeKey: edge.key, from: edge.a, to: edge.b });
        }
        return noise;
    }

    applyEdgeMutation({ player = this.currentPlayer, action, edges, metadata = {} }) {
        const before = this.computePhysicalObservables();
        const protectedKeys = new Set(edges.map((edge) => edge.key));
        for (const edge of edges) this.flipEdge(edge);
        const noise = this.applyNoise(this.edgeVariables, protectedKeys);
        this.moveNumber++;
        this.lastLoop = edges.map((edge) => edge.key);
        const observables = this.computePhysicalObservables({ deltaEnergy: this.energy() - before.energy });
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            tick: this.moveNumber,
            player,
            type: action,
            action,
            affectedVertices: this.verticesTouchedByEdges(edges),
            affectedEdges: [...edges, ...noise.map((entry) => this.edgeByKey(entry.edgeKey)).filter(Boolean)].map((edge) => ({
                key: edge.key,
                from: edge.a,
                to: edge.b,
                homology: edge.edge?.homology,
                twisted: edge.edge?.twisted
            })),
            physicalUpdate: {
                beforeEnergy: before.energy,
                afterEnergy: observables.energy,
                deltaEnergy: observables.energy - before.energy,
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

    verticesTouchedByEdges(edges) {
        const unique = new Map();
        for (const edge of edges) {
            unique.set(coordKey(edge.a), [...edge.a]);
            unique.set(coordKey(edge.b), [...edge.b]);
        }
        return [...unique.values()];
    }

    flipGaugeEdge(coord, player = this.currentPlayer) {
        const edge = this.chooseIncidentEdge(coord);
        if (!edge) return { ok: false, error: 'Choose a vertex with an incident gauge edge.' };
        return this.applyEdgeMutation({ player, action: 'flip_edge', edges: [edge] });
    }

    flipGaugeEdgeByKey(edgeKey, player = this.currentPlayer) {
        const edge = this.edgeByKey(edgeKey);
        if (!edge) return { ok: false, error: 'Choose a valid gauge edge.' };
        return this.applyEdgeMutation({ player, action: 'flip_edge', edges: [edge] });
    }

    flipGaugePath(coord, player = this.currentPlayer) {
        const edges = this.pathFrom(coord);
        if (!edges.length) return { ok: false, error: 'No connected edge path starts here.' };
        return this.applyEdgeMutation({ player, action: 'flip_path', edges, metadata: { pathLength: edges.length } });
    }

    flipGaugeLoop(coord, player = this.currentPlayer) {
        const edges = this.loopFrom(coord);
        if (!edges.length) return { ok: false, error: 'No local plaquette or loop starts here.' };
        const homology = sumHomology(edges.map((edge) => edge.edge));
        return this.applyEdgeMutation({
            player,
            action: 'flip_loop',
            edges,
            metadata: {
                loopLength: edges.length,
                noncontractible: Boolean(homology.x || homology.y || homology.z || homology.w),
                winding: homology
            }
        });
    }

    applyGaugeNoise(coord, player = this.currentPlayer) {
        const edge = this.chooseIncidentEdge(coord);
        if (!edge) return { ok: false, error: 'Choose a vertex with an incident gauge edge.' };
        const previous = this.config.noisyEdgeFlip;
        this.config.noisyEdgeFlip = true;
        const result = this.applyEdgeMutation({ player, action: 'noisy_edge_flip', edges: [edge] });
        this.config.noisyEdgeFlip = previous;
        return result;
    }

    applyGaugeNoiseByKey(edgeKey, player = this.currentPlayer) {
        const edge = this.edgeByKey(edgeKey);
        if (!edge) return { ok: false, error: 'Choose a valid gauge edge.' };
        const previous = this.config.noisyEdgeFlip;
        this.config.noisyEdgeFlip = true;
        const result = this.applyEdgeMutation({ player, action: 'noisy_edge_flip', edges: [edge] });
        this.config.noisyEdgeFlip = previous;
        return result;
    }

    measureGaugeCheck(coord, check = 'star', player = this.currentPlayer) {
        const vertex = this.topology.normalize(coord);
        if (!vertex) return { ok: false, error: 'Choose a valid graph vertex.' };
        let value = 1;
        let affectedEdges = [];
        let affectedVertices = [vertex];
        if (check === 'plaquette') {
            const plaquette = this.plaquetteAt(vertex);
            if (!plaquette) return { ok: false, error: 'No plaquette/cycle check is available here.' };
            value = this.plaquetteValue(plaquette);
            affectedEdges = plaquette.edgeKeys.map((key) => this.edgeByKey(key)).filter(Boolean);
            affectedVertices = plaquette.vertices;
        } else {
            value = this.starValue(vertex);
            affectedEdges = this.incidentEdges(vertex);
        }
        this.moveNumber++;
        const observables = this.computePhysicalObservables({ deltaEnergy: 0 });
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            tick: this.moveNumber,
            player,
            type: 'measurement',
            action: `measure_${check}`,
            check,
            reported: value,
            affectedVertices: affectedVertices.map((entry) => [...entry]),
            affectedEdges: affectedEdges.map((edge) => ({
                key: edge.key,
                from: edge.a,
                to: edge.b,
                homology: edge.edge?.homology,
                twisted: edge.edge?.twisted
            })),
            physicalUpdate: { deltaEnergy: 0, measurement: { check, value } },
            observables
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.recordPosition(event.action);
        return { ok: true, event };
    }

    legalMoves(player = this.currentPlayer) {
        return this.topology.vertices().map((coord) => ({ coord, player, action: 'z2_gauge_action' }));
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
            physicalUpdate: { deltaEnergy: 0 },
            observables: this.computePhysicalObservables({ deltaEnergy: 0 })
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.recordPosition('pass');
        return { ok: true, event };
    }

    counts() {
        const counts = { black: 0, white: 0, empty: 0 };
        for (const value of this.edgeVariables.values()) {
            if (value > 0) counts.black++;
            else counts.white++;
        }
        return counts;
    }

    energy() {
        return this.starViolations().length + this.fluxViolations().length;
    }

    logicalWilsonLoops() {
        const loops = {};
        for (const axis of ['x', 'y', 'z', 'w']) {
            const edges = this.logicalLoopEdges(axis);
            if (edges.length) loops[axis] = product(edges.map((edge) => this.value(edge)));
        }
        return loops;
    }

    loopLengthDistribution() {
        const lengths = this.history
            .filter((event) => ['flip_loop', 'flip_path'].includes(event.action))
            .map((event) => event.affectedEdges?.length || event.loopLength || event.pathLength || 0)
            .filter(Boolean);
        const counts = {};
        for (const length of lengths) counts[length] = (counts[length] || 0) + 1;
        return counts;
    }

    computePhysicalObservables({ deltaEnergy = 0 } = {}) {
        const starViolations = this.starViolations();
        const fluxViolations = this.fluxViolations();
        const logicalWilsonLoops = this.logicalWilsonLoops();
        const logicalError = Object.values(logicalWilsonLoops).some((value) => value < 0);
        const syndromeWeight = starViolations.length + fluxViolations.length;
        const loopLengths = Object.entries(this.loopLengthDistribution()).flatMap(([length, count]) =>
            Array.from({ length: count }, () => Number(length)));
        const decoderSuccess = this.config.decoderEnabled ? syndromeWeight === 0 && !logicalError : null;
        return {
            tick: this.moveNumber,
            energy: this.energy(),
            deltaEnergy,
            starViolations: starViolations.length,
            plaquetteFluxViolations: fluxViolations.length,
            syndromeWeight,
            logicalWilsonLoops,
            logicalSector: Object.keys(logicalWilsonLoops).length
                ? Object.entries(logicalWilsonLoops).map(([axis, value]) => `${axis}:${value > 0 ? '+' : '-'}`).join(' ')
                : 'trivial',
            memoryAlive: !logicalError,
            logicalErrorOccurred: logicalError,
            loopLengthDistribution: this.loopLengthDistribution(),
            averageLoopLength: mean(loopLengths),
            decoderSuccess,
            edgeCounts: this.counts(),
            plaquetteCount: this.plaquettes.length
        };
    }

    memoryLifetime() {
        let lifetime = this.moveNumber;
        for (const entry of [...this.history].reverse()) {
            if (entry.observables?.logicalErrorOccurred) return entry.tick;
            lifetime = entry.tick;
        }
        return lifetime;
    }

    computePhysicalAnswer() {
        const observables = this.computePhysicalObservables();
        return {
            gaugeVacuumRecovered: observables.syndromeWeight === 0 && !observables.logicalErrorOccurred,
            finalSyndromeWeight: observables.syndromeWeight,
            logicalErrorOccurred: observables.logicalErrorOccurred,
            memoryLifetime: this.memoryLifetime(),
            WilsonLoopSector: observables.logicalSector,
            summary: `Gauge vacuum ${observables.syndromeWeight === 0 ? 'has no local syndrome' : 'has residual syndrome'}; logical sector ${observables.logicalSector}; logical error ${observables.logicalErrorOccurred ? 'yes' : 'no'}.`
        };
    }

    getVertexState(coord) {
        const vertex = this.topology.normalize(coord);
        if (!vertex) return null;
        return {
            coord: vertex,
            star: this.starValue(vertex),
            incidentEdges: this.incidentEdges(vertex),
            plaquette: this.plaquetteAt(vertex)
        };
    }

    getStone(coord) {
        const state = this.getVertexState(coord);
        if (!state) return null;
        const plaquette = state.plaquette ? this.plaquetteValue(state.plaquette) : 1;
        const violation = state.star < 0 || plaquette < 0;
        return {
            color: violation ? 'white' : 'black',
            z2GaugeVertex: true,
            star: state.star,
            flux: plaquette,
            violation,
            label: `${state.star > 0 ? 'S+' : 'S-'} ${plaquette > 0 ? 'B+' : 'B-'}`
        };
    }

    recordPosition(type) {
        this.positionHistory.push({
            type,
            number: this.moveNumber,
            edges: [...this.edgeVariables.entries()].map(([key, value]) => ({ key, value }))
        });
    }

    exportState() {
        return {
            mode: this.mode,
            physicalSystemName: 'Z2 gauge loop graph system',
            blackWhiteMeaning: 'black edge = U_e=+1; white edge = U_e=-1; vertex charge and plaquette flux are products of adjacent edge variables',
            initialStateOptions: ['gauge_vacuum', 'random_edge_errors', 'paired_charge_defects', 'paired_flux_defects', 'logical_loop_error'],
            allowedActions: ['flip_edge', 'flip_path', 'flip_loop', 'measure_star', 'measure_plaquette', 'noisy_edge_flip', 'pass'],
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions,
                lattice: this.topology.lattice
            },
            config: cloneValue(this.config),
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            edges: this.edges.map((edge) => ({
                key: edge.key,
                from: edge.a,
                to: edge.b,
                U: this.value(edge),
                color: this.value(edge) > 0 ? 'black' : 'white'
            })),
            plaquettes: this.plaquettes.map((plaquette) => ({
                key: plaquette.key,
                vertices: plaquette.vertices,
                flux: this.plaquetteValue(plaquette)
            })),
            observables: this.computePhysicalObservables(),
            physicalAnswer: this.computePhysicalAnswer(),
            history: cloneValue(this.history)
        };
    }
}
