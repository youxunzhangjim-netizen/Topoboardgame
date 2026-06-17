import { SeededRandom } from '../probability/SeededRandom.js';
import { coordKey, createGraphTopology, sumHomology } from '../topology/GraphTopologies.js';

export const SPIN_ICE_VERTEX_GAME_MODE = 'spin_ice_vertex_game';

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

function vertexCharge({ incoming, outgoing }) {
    return outgoing - incoming;
}

function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export class SpinIceVertexGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = SPIN_ICE_VERTEX_GAME_MODE;
        this.topology = createGraphTopology(options.topology || options);
        this.currentPlayer = options.currentPlayer || 'black';
        this.history = [];
        this.positionHistory = [];
        this.moveNumber = 0;
        this.config = {
            violationEnergy: Math.max(0, Number(options.spinIce?.violationEnergy) || 1),
            stringLength: Math.max(1, Math.min(64, Math.floor(Number(options.spinIce?.stringLength) || 4))),
            initialState: options.spinIce?.initialState || 'ice_rule_vacuum',
            seed: options.spinIce?.seed || 'spin-ice-vertex-game'
        };
        this.rng = new SeededRandom(this.config.seed);
        this.edges = this.createEdges();
        this.arrows = new Map();
        this.lastString = [];
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
                const key = `${coordKey(first)}|${coordKey(second)}`;
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

    normalizedVertex(coord) {
        return this.topology.normalize(coord);
    }

    arrow(edgeOrKey) {
        const key = typeof edgeOrKey === 'string' ? edgeOrKey : edgeOrKey.key;
        return this.arrows.get(key) ?? 1;
    }

    setArrow(edgeOrKey, value) {
        const key = typeof edgeOrKey === 'string' ? edgeOrKey : edgeOrKey.key;
        this.arrows.set(key, value < 0 ? -1 : 1);
    }

    flipEdge(edgeOrKey, arrows = this.arrows) {
        const key = typeof edgeOrKey === 'string' ? edgeOrKey : edgeOrKey.key;
        arrows.set(key, -(arrows.get(key) ?? 1));
    }

    edgeDirectionAt(edge, coord, arrows = this.arrows) {
        const sign = arrows.get(edge.key) ?? 1;
        const atA = coordKey(edge.a) === coordKey(coord);
        if (atA) return sign > 0 ? 'out' : 'in';
        return sign > 0 ? 'in' : 'out';
    }

    setupInitialState(initialState) {
        this.arrows.clear();
        for (const edge of this.edges) this.setArrow(edge, 1);
        if (initialState === 'random_arrows') return this.seedRandomArrows();
        if (initialState === 'monopole_pair') {
            this.seedIceRuleVacuum();
            return this.createMonopolePair();
        }
        if (initialState === 'loop_excitation') {
            this.seedIceRuleVacuum();
            return this.flipLoopAt(this.topology.vertices()[0], { record: false });
        }
        if (initialState === 'thermal_ice_sample') {
            this.seedRandomArrows();
            return this.relaxTowardIce(3);
        }
        return this.seedIceRuleVacuum();
    }

    seedIceRuleVacuum() {
        for (const edge of this.edges) {
            const sameRow = edge.a[1] === edge.b[1];
            const sameColumn = edge.a[0] === edge.b[0];
            let desiredFromA = true;
            if (sameRow) {
                const y = edge.a[1] || 0;
                const dx = edge.b[0] - edge.a[0];
                const eastFromA = Math.abs(dx) > 1 ? dx < 0 : dx > 0;
                desiredFromA = y % 2 === 0 ? eastFromA : !eastFromA;
            } else if (sameColumn) {
                const x = edge.a[0] || 0;
                const dy = edge.b[1] - edge.a[1];
                const southFromA = Math.abs(dy) > 1 ? dy < 0 : dy > 0;
                desiredFromA = x % 2 === 0 ? southFromA : !southFromA;
            }
            this.setArrow(edge, desiredFromA ? 1 : -1);
        }
    }

    seedRandomArrows() {
        for (const edge of this.edges) this.setArrow(edge, this.rng.next() < 0.5 ? 1 : -1);
    }

    relaxTowardIce(sweeps = 2) {
        for (let sweep = 0; sweep < sweeps; sweep++) {
            for (const edge of this.edges) {
                const before = this.energyForArrows(this.arrows);
                this.flipEdge(edge);
                const after = this.energyForArrows(this.arrows);
                if (after > before && this.rng.next() > 0.08) this.flipEdge(edge);
            }
        }
    }

    createMonopolePair() {
        const edge = this.edges[Math.floor(this.edges.length / 2)] || this.edges[0];
        if (edge) this.flipEdge(edge);
        this.lastString = edge ? [edge.key] : [];
    }

    vertexInfo(coord, arrows = this.arrows) {
        const vertex = this.normalizedVertex(coord);
        if (!vertex) return null;
        let incoming = 0;
        let outgoing = 0;
        const incident = this.incidentEdges(vertex);
        for (const edge of incident) {
            if (this.edgeDirectionAt(edge, vertex, arrows) === 'in') incoming++;
            else outgoing++;
        }
        const preferred = incident.length < 4
            ? true
            : incident.length === 4
            ? incoming === 2 && outgoing === 2
            : Math.abs(incoming - outgoing) <= incident.length % 2;
        return {
            coord: vertex,
            degree: incident.length,
            incoming,
            outgoing,
            charge: vertexCharge({ incoming, outgoing }),
            violation: !preferred,
            incidentEdges: incident
        };
    }

    violations(arrows = this.arrows) {
        return this.topology.vertices()
            .map((coord) => this.vertexInfo(coord, arrows))
            .filter((info) => info?.violation);
    }

    monopoles(arrows = this.arrows) {
        return this.violations(arrows).filter((info) => info.charge !== 0);
    }

    energyForArrows(arrows = this.arrows) {
        return this.config.violationEnergy * this.violations(arrows).reduce((sum, info) =>
            sum + Math.max(1, Math.abs(info.charge) / 2), 0);
    }

    chooseIncidentEdge(coord) {
        const info = this.vertexInfo(coord);
        if (!info?.incidentEdges.length) return null;
        const before = this.energyForArrows();
        let best = info.incidentEdges[0];
        let bestDelta = Infinity;
        for (const edge of info.incidentEdges) {
            const trial = new Map(this.arrows);
            this.flipEdge(edge, trial);
            const delta = this.energyForArrows(trial) - before;
            if (delta < bestDelta) {
                bestDelta = delta;
                best = edge;
            }
        }
        return best;
    }

    stringFrom(coord, length = this.config.stringLength) {
        const start = this.normalizedVertex(coord);
        if (!start) return [];
        const path = [];
        const visited = new Set();
        let cursor = start;
        for (let index = 0; index < length; index++) {
            const candidates = this.incidentEdges(cursor).filter((edge) => !visited.has(edge.key));
            if (!candidates.length) break;
            const edge = candidates[this.rng.integer(candidates.length)] || candidates[0];
            path.push(edge);
            visited.add(edge.key);
            cursor = coordKey(edge.a) === coordKey(cursor) ? edge.b : edge.a;
        }
        return path;
    }

    loopFrom(coord) {
        const start = this.normalizedVertex(coord);
        if (!start || this.topology.dimensions !== 2) return [];
        const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        const vertices = [start];
        let cursor = start;
        for (const direction of dirs) {
            const step = this.topology.step(cursor, direction);
            if (!step) return this.stringFrom(start, 4);
            cursor = step.coord;
            vertices.push(cursor);
        }
        const loop = [];
        for (let index = 0; index < vertices.length - 1; index++) {
            const key = [coordKey(vertices[index]), coordKey(vertices[index + 1])].sort().join('|');
            const edge = this.edgeByKey(key);
            if (edge) loop.push(edge);
        }
        return loop.length >= 3 ? loop : this.stringFrom(start, 4);
    }

    applyEdgeMutation({ player = this.currentPlayer, action, edges, metadata = {} }) {
        const beforeEnergy = this.energyForArrows();
        const beforeViolations = this.violations().length;
        for (const edge of edges) this.flipEdge(edge);
        this.moveNumber++;
        this.lastString = edges.map((edge) => edge.key);
        const observables = this.computePhysicalObservables({ deltaEnergy: this.energyForArrows() - beforeEnergy });
        const affectedVertices = this.verticesTouchedByEdges(edges);
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            tick: this.moveNumber,
            player,
            type: action,
            action,
            affectedVertices,
            affectedEdges: edges.map((edge) => ({
                key: edge.key,
                from: edge.a,
                to: edge.b,
                homology: edge.edge?.homology,
                twisted: edge.edge?.twisted
            })),
            physicalUpdate: {
                beforeEnergy,
                afterEnergy: observables.energy,
                deltaEnergy: observables.energy - beforeEnergy,
                beforeViolations,
                afterViolations: observables.iceRuleViolations
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

    flipArrow(coord, player = this.currentPlayer) {
        const edge = this.chooseIncidentEdge(coord);
        if (!edge) return { ok: false, error: 'Choose a vertex with an incident arrow.' };
        return this.applyEdgeMutation({ player, action: 'flip_arrow', edges: [edge] });
    }

    flipString(coord, player = this.currentPlayer) {
        const edges = this.stringFrom(coord);
        if (!edges.length) return { ok: false, error: 'No connected string starts at this vertex.' };
        return this.applyEdgeMutation({ player, action: 'flip_string', edges, metadata: { stringLength: edges.length } });
    }

    flipLoop(coord, player = this.currentPlayer) {
        const edges = this.loopFrom(coord);
        if (!edges.length) return { ok: false, error: 'No closed or local loop is available here.' };
        return this.applyEdgeMutation({ player, action: 'flip_loop', edges, metadata: { closedLoop: true } });
    }

    moveMonopole(coord, player = this.currentPlayer) {
        const info = this.vertexInfo(coord);
        if (!info?.violation) return { ok: false, error: 'Choose an ice-rule violation / monopole vertex.' };
        return this.flipArrow(coord, player);
    }

    annihilateMonopoles(coord, player = this.currentPlayer) {
        const start = this.vertexInfo(coord);
        const monopoles = this.monopoles();
        if (!start?.violation || monopoles.length < 2) return { ok: false, error: 'Choose a monopole when a pair is present.' };
        const opposite = monopoles
            .filter((info) => coordKey(info.coord) !== coordKey(start.coord) && Math.sign(info.charge) !== Math.sign(start.charge))
            .sort((a, b) => this.graphDistance(start.coord, a.coord) - this.graphDistance(start.coord, b.coord))[0];
        if (!opposite) return { ok: false, error: 'No monopole-antimonopole partner found.' };
        const edges = this.shortestEdgePath(start.coord, opposite.coord);
        if (!edges.length) return { ok: false, error: 'No graph path connects the monopoles.' };
        return this.applyEdgeMutation({
            player,
            action: 'annihilate_monopole_pair',
            edges,
            metadata: { pair: [start.coord, opposite.coord], stringLength: edges.length }
        });
    }

    shortestEdgePath(from, to) {
        const targetKey = coordKey(to);
        const queue = [{ coord: from, path: [] }];
        const seen = new Set([coordKey(from)]);
        while (queue.length) {
            const current = queue.shift();
            if (coordKey(current.coord) === targetKey) return current.path;
            for (const edge of this.incidentEdges(current.coord)) {
                const next = coordKey(edge.a) === coordKey(current.coord) ? edge.b : edge.a;
                const key = coordKey(next);
                if (seen.has(key)) continue;
                seen.add(key);
                queue.push({ coord: next, path: [...current.path, edge] });
            }
        }
        return [];
    }

    graphDistance(from, to) {
        const path = this.shortestEdgePath(from, to);
        return path.length || Infinity;
    }

    legalMoves(player = this.currentPlayer) {
        return this.topology.vertices().map((coord) => ({ coord, player, action: 'spin_ice_action' }));
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
        for (const arrow of this.arrows.values()) {
            if (arrow > 0) counts.black++;
            else counts.white++;
        }
        return counts;
    }

    closedLoopCount() {
        return this.history.filter((event) => event.action === 'flip_loop' || event.closedLoop).length;
    }

    monopoleSeparation() {
        const monopoles = this.monopoles();
        if (monopoles.length < 2) return 0;
        const distances = [];
        for (let i = 0; i < monopoles.length; i++) {
            for (let j = i + 1; j < monopoles.length; j++) {
                if (Math.sign(monopoles[i].charge) === Math.sign(monopoles[j].charge)) continue;
                distances.push(this.graphDistance(monopoles[i].coord, monopoles[j].coord));
            }
        }
        return distances.length ? Math.min(...distances) : 0;
    }

    computePhysicalObservables({ deltaEnergy = 0 } = {}) {
        const violations = this.violations();
        const monopoles = this.monopoles();
        const stringEvents = this.history.filter((event) => event.action === 'flip_string' || event.action === 'annihilate_monopole_pair');
        const stringLengths = stringEvents.map((event) => event.affectedEdges?.length || event.stringLength || 0).filter(Boolean);
        const loopEdges = this.history
            .filter((event) => event.action === 'flip_loop')
            .flatMap((event) => event.affectedEdges || []);
        const loopHomology = sumHomology(loopEdges);
        const windingLoops = Number(Boolean(loopHomology.x)) + Number(Boolean(loopHomology.y)) + Number(Boolean(loopHomology.z)) + Number(Boolean(loopHomology.w));
        return {
            tick: this.moveNumber,
            energy: this.energyForArrows(),
            deltaEnergy,
            iceRuleViolations: violations.length,
            monopoleCount: monopoles.length,
            stringLength: this.lastString.length,
            averageStringLength: mean(stringLengths),
            closedLoopCount: this.closedLoopCount(),
            windingLoops,
            topologicalLoopSector: windingLoops > 0 ? 'winding' : 'trivial',
            monopoleSeparation: this.monopoleSeparation(),
            defectDensity: this.topology.vertices().length ? violations.length / this.topology.vertices().length : 0,
            arrowCounts: this.counts(),
            monopoles: monopoles.map((info) => ({ coord: info.coord, charge: info.charge }))
        };
    }

    monopoleLifetime() {
        let lifetime = 0;
        for (const entry of [...this.history].reverse()) {
            if ((entry.observables?.monopoleCount || 0) > 0) lifetime = entry.tick;
        }
        return lifetime;
    }

    computePhysicalAnswer(history = this.history) {
        const observables = this.computePhysicalObservables();
        return {
            iceRuleVacuumRecovered: observables.iceRuleViolations === 0,
            monopoleLifetime: this.monopoleLifetime(),
            averageStringLength: observables.averageStringLength,
            topologicalLoopSector: observables.topologicalLoopSector,
            finalDefectDensity: observables.defectDensity,
            finalEnergy: observables.energy,
            summary: `Ice-rule vacuum ${observables.iceRuleViolations === 0 ? 'recovered' : 'not recovered'}; monopoles ${observables.monopoleCount}; defect density ${observables.defectDensity.toFixed(3)}; loop sector ${observables.topologicalLoopSector}.`
        };
    }

    getVertexState(coord) {
        return this.vertexInfo(coord);
    }

    getStone(coord) {
        const info = this.vertexInfo(coord);
        if (!info) return null;
        return {
            color: info.charge >= 0 ? 'black' : 'white',
            spinIceVertex: true,
            violation: info.violation,
            charge: info.charge,
            incoming: info.incoming,
            outgoing: info.outgoing,
            label: info.violation ? `M${info.charge > 0 ? '+' : '-'}${Math.abs(info.charge)}` : 'ice'
        };
    }

    recordPosition(type) {
        this.positionHistory.push({
            type,
            number: this.moveNumber,
            arrows: [...this.arrows.entries()].map(([key, arrow]) => ({ key, arrow }))
        });
    }

    exportState() {
        return {
            mode: this.mode,
            physicalSystemName: 'Spin ice / vertex-model graph system',
            blackWhiteMeaning: 'black = arrow along chosen edge orientation; white = arrow opposite chosen edge orientation; board variables live on edges',
            initialStateOptions: ['ice_rule_vacuum', 'random_arrows', 'monopole_pair', 'loop_excitation', 'thermal_ice_sample'],
            allowedActions: ['flip_arrow', 'flip_string', 'flip_loop', 'move_monopole', 'annihilate_monopole_pair', 'pass'],
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
                arrow: this.arrow(edge)
            })),
            observables: this.computePhysicalObservables(),
            physicalAnswer: this.computePhysicalAnswer(),
            history: cloneValue(this.history)
        };
    }
}
