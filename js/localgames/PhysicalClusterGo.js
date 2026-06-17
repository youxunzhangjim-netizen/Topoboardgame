import { SeededRandom } from '../probability/SeededRandom.js';
import { coordKey, createGraphTopology, sumHomology } from '../topology/GraphTopologies.js';

export const PHYSICAL_CLUSTER_GO_MODE = 'physical_cluster_go';

const CLUSTER_INITIAL_STATES = Object.freeze([
    'sparse_seeds',
    'random_density',
    'two_cluster_competition',
    'interface_seed',
    'thermal_cluster_sample'
]);

const CLUSTER_ACTIONS = Object.freeze([
    'place_species',
    'grow_connected_cluster',
    'capture_zero_liberty_cluster',
    'diffusion_noise_step',
    'pass'
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

function speciesForPlayer(player) {
    return player === 'white' ? 'B' : 'A';
}

function playerForSpecies(species) {
    return species === 'B' ? 'white' : 'black';
}

function speciesName(species) {
    return species === 'B' ? 'species B' : 'species A';
}

function mod(value, size) {
    return ((value % size) + size) % size;
}

function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function linearSlope(points) {
    if (points.length < 2) return null;
    const xMean = mean(points.map((point) => point.x));
    const yMean = mean(points.map((point) => point.y));
    const denom = points.reduce((sum, point) => sum + (point.x - xMean) ** 2, 0);
    if (denom <= 0) return null;
    return points.reduce((sum, point) => sum + (point.x - xMean) * (point.y - yMean), 0) / denom;
}

export class PhysicalClusterGoGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = PHYSICAL_CLUSTER_GO_MODE;
        this.topology = createGraphTopology(options.topology || options);
        this.currentPlayer = options.currentPlayer || 'black';
        this.board = new Map();
        this.history = [];
        this.positionHistory = [];
        this.positionSet = new Set();
        this.moveNumber = 0;
        this.captures = { black: 0, white: 0 };
        this.extinctionEvents = [];
        this.captureEvents = [];
        this.config = {
            initialState: CLUSTER_INITIAL_STATES.includes(options.cluster?.initialState)
                ? options.cluster.initialState
                : 'sparse_seeds',
            model: options.cluster?.model || 'two_species_competition',
            diffusionNoiseEnabled: Boolean(options.cluster?.diffusionNoiseEnabled),
            noiseRate: Math.max(0, Math.min(1, Number(options.cluster?.noiseRate) || 0.02)),
            seed: options.cluster?.seed || options.noiseSeed || 'physical-cluster-go'
        };
        this.rng = new SeededRandom(this.config.seed);
        this.initialOccupied = { black: 0, white: 0, total: 0 };
        this.initialObservables = null;
        this.setupInitialState(this.config.initialState);
        this.initialOccupied = {
            black: [...this.board.values()].filter((species) => species === 'A').length,
            white: [...this.board.values()].filter((species) => species === 'B').length,
            total: this.board.size
        };
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

    getSpecies(coord, board = this.board) {
        const key = this.key(coord);
        return key ? board.get(key) || null : null;
    }

    getStone(coord) {
        const species = this.getSpecies(coord);
        if (!species) return null;
        const color = playerForSpecies(species);
        return {
            color,
            species,
            pauliLabel: species,
            label: speciesName(species),
            liberties: this.groupInfoAt(coord)?.liberties.size || 0
        };
    }

    setSpecies(coord, species, board = this.board) {
        const key = this.key(coord);
        if (!key) return false;
        board.set(key, species === 'B' ? 'B' : 'A');
        return true;
    }

    deleteSpecies(coord, board = this.board) {
        const key = this.key(coord);
        return Boolean(key) && board.delete(key);
    }

    isEmpty(coord, board = this.board) {
        const key = this.key(coord);
        return Boolean(key) && !board.has(key);
    }

    setupInitialState(initialState) {
        this.board.clear();
        const vertices = this.topology.vertices();
        if (initialState === 'random_density') this.seedRandomDensity(vertices);
        else if (initialState === 'two_cluster_competition') this.seedTwoClusterCompetition(vertices);
        else if (initialState === 'interface_seed') this.seedInterface(vertices);
        else if (initialState === 'thermal_cluster_sample') this.seedThermalCluster(vertices);
        else this.seedSparseSeeds(vertices);
        this.ensureImmediateLegalMoves();
    }

    seedSparseSeeds(vertices) {
        const sizes = this.topology.sizes;
        const center = sizes.map((size) => Math.floor(size / 2));
        const candidates = [
            center.map((value, axis) => axis === 0 ? Math.max(0, value - 2) : value),
            center.map((value, axis) => axis === 0 ? Math.min((sizes[0] || 1) - 1, value + 2) : value),
            center.map((value, axis) => axis === 1 ? Math.max(0, value - 2) : value),
            center.map((value, axis) => axis === 1 ? Math.min((sizes[1] || sizes[0] || 1) - 1, value + 2) : value)
        ];
        for (const coord of candidates.slice(0, 2)) this.setSpecies(coord, 'A');
        for (const coord of candidates.slice(2)) this.setSpecies(coord, 'B');
        if (!this.board.size && vertices.length) {
            this.setSpecies(vertices[0], 'A');
            this.setSpecies(vertices.at(-1), 'B');
        }
    }

    seedRandomDensity(vertices) {
        for (const coord of vertices) {
            if (this.rng.next() > 0.32) continue;
            this.setSpecies(coord, this.rng.next() < 0.5 ? 'A' : 'B');
        }
    }

    seedTwoClusterCompetition(vertices) {
        const [width, height = width] = this.topology.sizes;
        const left = [Math.floor(width / 3), Math.floor(height / 2)];
        const right = [Math.floor((2 * width) / 3), Math.floor(height / 2)];
        for (const coord of vertices) {
            const leftDistance = Math.abs(coord[0] - left[0]) + Math.abs((coord[1] || 0) - left[1]);
            const rightDistance = Math.abs(coord[0] - right[0]) + Math.abs((coord[1] || 0) - right[1]);
            if (leftDistance <= 1) this.setSpecies(coord, 'A');
            else if (rightDistance <= 1) this.setSpecies(coord, 'B');
        }
    }

    seedInterface(vertices) {
        const [width] = this.topology.sizes;
        const split = Math.floor(width / 2);
        for (const coord of vertices) {
            if (Math.abs(coord[0] - split) <= 1) continue;
            this.setSpecies(coord, coord[0] < split ? 'A' : 'B');
        }
    }

    seedThermalCluster(vertices) {
        for (const coord of vertices) {
            if (this.rng.next() > 0.46) continue;
            const localBias = Math.sin((coord[0] + 1) * 1.7 + ((coord[1] || 0) + 1) * 0.9);
            this.setSpecies(coord, this.rng.next() < 0.5 + 0.18 * Math.sign(localBias) ? 'A' : 'B');
        }
    }

    ensureImmediateLegalMoves() {
        const vertices = this.topology.vertices();
        if (!vertices.length) return;
        if (![...this.board.values()].includes('A')) this.setSpecies(vertices[0], 'A');
        if (![...this.board.values()].includes('B')) this.setSpecies(vertices.at(-1), 'B');
        const emptyCount = vertices.filter((coord) => this.isEmpty(coord)).length;
        if (emptyCount >= 2) return;
        const center = this.topology.sizes.map((size) => Math.floor(size / 2));
        const openings = [
            center,
            center.map((value, axis) => axis === 0 ? mod(value + 1, this.topology.sizes[0]) : value),
            center.map((value, axis) => axis === 1 ? mod(value + 1, this.topology.sizes[1] || this.topology.sizes[0]) : value)
        ];
        for (const coord of openings) {
            this.deleteSpecies(coord);
            if (vertices.filter((vertex) => this.isEmpty(vertex)).length >= 2) break;
        }
    }

    neighborsFromKey(key) {
        return this.topology.neighbors(this.coordFromKey(key)).map(coordKey);
    }

    groupFromKey(board, startKey) {
        const species = board.get(startKey);
        if (!species) return { species: null, group: new Set(), liberties: new Set() };
        const group = new Set([startKey]);
        const liberties = new Set();
        const stack = [startKey];
        while (stack.length) {
            const key = stack.pop();
            for (const next of this.neighborsFromKey(key)) {
                const value = board.get(next);
                if (!value) {
                    liberties.add(next);
                } else if (value === species && !group.has(next)) {
                    group.add(next);
                    stack.push(next);
                }
            }
        }
        return { species, group, liberties };
    }

    groups(board = this.board) {
        const seen = new Set();
        const groups = [];
        for (const [key, species] of board.entries()) {
            if (seen.has(key)) continue;
            const info = this.groupFromKey(board, key);
            for (const stone of info.group) seen.add(stone);
            groups.push({
                species,
                color: playerForSpecies(species),
                size: info.group.size,
                liberties: info.liberties,
                vertices: [...info.group].map((entry) => this.coordFromKey(entry)),
                keys: [...info.group]
            });
        }
        return groups;
    }

    groupInfoAt(coord, board = this.board) {
        const key = this.key(coord);
        if (!key || !board.has(key)) return null;
        const info = this.groupFromKey(board, key);
        return {
            key,
            coord: this.coordFromKey(key),
            species: info.species,
            color: playerForSpecies(info.species),
            group: info.group,
            liberties: info.liberties
        };
    }

    serializeBoard(board = this.board) {
        return this.topology.vertices()
            .map((coord) => board.get(coordKey(coord)) || '.')
            .join('');
    }

    previewPlace(coord, player = this.currentPlayer, { requireGrowth = false } = {}) {
        const normalized = this.normalize(coord);
        if (!normalized) return { ok: false, error: 'Choose a valid graph vertex.' };
        const key = coordKey(normalized);
        if (this.board.has(key)) return { ok: false, error: 'Cluster placement requires an empty site.' };
        const species = speciesForPlayer(player);
        const touchesOwn = this.topology.neighbors(normalized).some((neighbor) => this.getSpecies(neighbor) === species);
        if (requireGrowth && !touchesOwn) {
            return { ok: false, error: 'Growth requires a neighboring same-species cluster.' };
        }

        const nextBoard = new Map(this.board);
        nextBoard.set(key, species);
        const captured = [];
        const checked = new Set();
        for (const neighbor of this.topology.neighbors(normalized)) {
            const neighborKey = coordKey(neighbor);
            const neighborSpecies = nextBoard.get(neighborKey);
            if (!neighborSpecies || neighborSpecies === species || checked.has(neighborKey)) continue;
            const group = this.groupFromKey(nextBoard, neighborKey);
            for (const stone of group.group) checked.add(stone);
            if (group.liberties.size === 0) {
                for (const stone of group.group) {
                    nextBoard.delete(stone);
                    captured.push(stone);
                }
            }
        }

        const own = this.groupFromKey(nextBoard, key);
        if (own.liberties.size === 0) {
            return { ok: false, error: 'Self-extinction is not allowed unless the placement captures first.' };
        }
        const serialized = this.serializeBoard(nextBoard);
        if (this.positionSet.has(serialized)) {
            return { ok: false, error: 'Superko: this cluster state already occurred.' };
        }
        return {
            ok: true,
            normalized,
            key,
            species,
            action: touchesOwn ? 'grow_connected_cluster' : 'place_species',
            board: nextBoard,
            captured,
            capturedStones: captured.map((entry) => this.coordFromKey(entry)),
            serialized
        };
    }

    placeSpecies(coord, player = this.currentPlayer) {
        return this.applyPlacement(this.previewPlace(coord, player), player);
    }

    growCluster(coord, player = this.currentPlayer) {
        return this.applyPlacement(this.previewPlace(coord, player, { requireGrowth: true }), player);
    }

    applyPlacement(preview, player) {
        if (!preview.ok) return preview;
        const noise = this.applyDiffusionNoiseToBoard(preview.board, new Set([preview.key, ...preview.captured]));
        const beforeCounts = this.counts();
        this.board = preview.board;
        this.captures[player] += preview.captured.length;
        this.captureEvents.push({
            tick: this.moveNumber + 1,
            player,
            count: preview.captured.length,
            vertices: preview.capturedStones.map((coord) => [...coord])
        });
        const afterCounts = this.counts();
        const extinct = [];
        for (const color of ['black', 'white']) {
            if (beforeCounts[color] > 0 && afterCounts[color] === 0) {
                const event = { tick: this.moveNumber + 1, extinctSpecies: speciesForPlayer(color), color };
                this.extinctionEvents.push(event);
                extinct.push(event);
            }
        }
        this.moveNumber++;
        const observables = this.computePhysicalObservables();
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            tick: this.moveNumber,
            player,
            type: preview.action,
            action: preview.action,
            coord: [...preview.normalized],
            affectedVertices: [[...preview.normalized], ...preview.capturedStones, ...noise.map((entry) => entry.coord)],
            captured: preview.capturedStones.map((coord) => [...coord]),
            capturedStones: preview.capturedStones.map((coord) => [...coord]),
            physicalUpdate: {
                placedSpecies: preview.species,
                capturedCount: preview.captured.length,
                capturedSpecies: speciesForPlayer(otherPlayer(player)),
                extinctionEvents: extinct,
                noise
            },
            observables
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.recordPosition(preview.action);
        return { ok: true, event, captured: preview.captured.length };
    }

    applyDiffusionNoise(player = this.currentPlayer) {
        const noise = this.applyDiffusionNoiseToBoard(this.board, new Set(), { force: true });
        if (!noise.length) return { ok: false, error: 'Diffusion/noise did not find an available local update.' };
        this.moveNumber++;
        const observables = this.computePhysicalObservables();
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            tick: this.moveNumber,
            player,
            type: 'diffusion_noise_step',
            action: 'diffusion_noise_step',
            affectedVertices: noise.flatMap((entry) => [entry.from, entry.to].filter(Boolean)),
            physicalUpdate: { noise },
            observables
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.recordPosition('diffusion_noise_step');
        return { ok: true, event };
    }

    applyDiffusionNoiseToBoard(board, protectedKeys = new Set(), { force = false } = {}) {
        if ((!force && !this.config.diffusionNoiseEnabled) || this.config.noiseRate <= 0) return [];
        const occupied = [...board.keys()].filter((key) => !protectedKeys.has(key));
        const events = [];
        const maxEvents = force ? Math.max(1, Math.ceil(occupied.length * Math.max(this.config.noiseRate, 0.05))) : occupied.length;
        for (const key of occupied) {
            if (!force && this.rng.next() >= this.config.noiseRate) continue;
            const species = board.get(key);
            const emptyNeighbors = this.neighborsFromKey(key).filter((neighbor) => !board.has(neighbor) && !protectedKeys.has(neighbor));
            if (!emptyNeighbors.length) continue;
            const target = this.rng.choice(emptyNeighbors);
            board.set(target, species);
            events.push({
                type: 'diffusion_growth',
                species,
                from: this.coordFromKey(key),
                to: this.coordFromKey(target),
                coord: this.coordFromKey(target)
            });
            if (events.length >= maxEvents) break;
        }
        if (force && !events.length) {
            const empties = this.topology.vertices().filter((coord) => !board.has(coordKey(coord)));
            if (empties.length) {
                const coord = this.rng.choice(empties);
                const species = this.rng.next() < 0.5 ? 'A' : 'B';
                board.set(coordKey(coord), species);
                events.push({ type: 'random_seed', species, to: [...coord], coord: [...coord] });
            }
        }
        return events;
    }

    legalMoves(player = this.currentPlayer) {
        const moves = [];
        for (const coord of this.topology.vertices()) {
            const preview = this.previewPlace(coord, player);
            if (!preview.ok) continue;
            moves.push({ coord, action: preview.action, player, captured: preview.captured.length });
        }
        return moves;
    }

    pass(player = this.currentPlayer) {
        this.moveNumber++;
        const observables = this.computePhysicalObservables();
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            tick: this.moveNumber,
            player,
            type: 'pass',
            action: 'pass',
            affectedVertices: [],
            physicalUpdate: { noise: [] },
            observables
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.recordPosition('pass');
        return { ok: true, event };
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

    sameSpeciesEdgesForGroup(group) {
        const keys = new Set(group.keys);
        return this.edgePairs()
            .filter(({ from, to }) => keys.has(coordKey(from)) && keys.has(coordKey(to)))
            .map(({ edge }) => edge);
    }

    wrappingGroups(groups = this.groups()) {
        if (!['torus', 'klein_bottle', 'mobius', 'rp2', 'sphere_latitude'].includes(this.topology.name)) return [];
        return groups.filter((group) => {
            const homology = sumHomology(this.sameSpeciesEdgesForGroup(group));
            const spansX = group.vertices.some((coord) => coord[0] === 0)
                && group.vertices.some((coord) => coord[0] === this.topology.sizes[0] - 1);
            const spansY = this.topology.sizes.length > 1
                && group.vertices.some((coord) => coord[1] === 0)
                && group.vertices.some((coord) => coord[1] === this.topology.sizes[1] - 1);
            return Boolean(homology.x || homology.y || homology.z || homology.w || homology.twisted || spansX || spansY);
        });
    }

    counts() {
        const counts = { black: 0, white: 0, empty: 0, speciesA: 0, speciesB: 0 };
        for (const coord of this.topology.vertices()) {
            const species = this.getSpecies(coord);
            if (!species) counts.empty++;
            else if (species === 'B') {
                counts.white++;
                counts.speciesB++;
            } else {
                counts.black++;
                counts.speciesA++;
            }
        }
        return counts;
    }

    computePhysicalObservables() {
        const vertices = this.topology.vertices();
        const total = vertices.length || 1;
        const counts = this.counts();
        const groups = this.groups();
        const distribution = {};
        for (const group of groups) distribution[group.size] = (distribution[group.size] || 0) + 1;
        const largestGroup = groups.reduce((best, group) => group.size > (best?.size || 0) ? group : best, null);
        const interfaces = this.interfaceEdges();
        const wrappingGroups = this.wrappingGroups(groups);
        const chronological = [...this.history].reverse();
        const firstExtinction = this.extinctionEvents[0] || null;
        const captureEvents = Math.max(
            this.captureEvents.filter((event) => event.count > 0).length,
            chronological.filter((entry) => Number(entry.physicalUpdate?.capturedCount || 0) > 0).length
        );
        const survivalProbability = (Number(counts.black > 0) + Number(counts.white > 0)) / 2;
        const occupied = counts.black + counts.white;
        const weightedClusterSize = occupied
            ? groups.reduce((sum, group) => sum + group.size ** 2, 0) / occupied
            : 0;
        const wrappingBySpecies = {
            speciesA: wrappingGroups.filter((group) => group.species === 'A').length,
            speciesB: wrappingGroups.filter((group) => group.species === 'B').length
        };
        const percolationProbability = wrappingGroups.length
            ? 1
            : Math.min(1, (largestGroup?.size || 0) / Math.max(1, total) * 2);
        const wrappingHistory = chronological.filter((entry) =>
            Number(entry.observables?.topologyWrappingClusterCount || 0) > 0).length;
        return {
            tick: this.moveNumber,
            model: this.config.model,
            clusterSizeDistribution: distribution,
            largestCluster: largestGroup?.size || 0,
            largestClusterSpecies: largestGroup?.species || 'none',
            largestClusterColor: largestGroup?.color || 'none',
            percolationProbability,
            captureEvents,
            extinctionEvents: this.extinctionEvents.length,
            interfaceLength: interfaces.length,
            correlationLengthEstimate: Math.sqrt(weightedClusterSize),
            survivalProbability,
            topologyWrappingClusterCount: wrappingGroups.length,
            wrappingBySpecies,
            topologyWrappingProbability: chronological.length
                ? wrappingHistory / chronological.length
                : Number(wrappingGroups.length > 0),
            numberOfClusters: groups.length,
            blackClusterCount: groups.filter((group) => group.species === 'A').length,
            whiteClusterCount: groups.filter((group) => group.species === 'B').length,
            occupiedFraction: occupied / total,
            areaFractionA: counts.black / total,
            areaFractionB: counts.white / total,
            captures: cloneValue(this.captures),
            survivalExtinctionTime: firstExtinction?.tick ?? null,
            counts
        };
    }

    computePhysicalAnswer(history = this.history) {
        const observables = this.computePhysicalObservables();
        const wrapping = observables.wrappingBySpecies;
        const speciesAPercolated = wrapping.speciesA > 0;
        const speciesBPercolated = wrapping.speciesB > 0;
        const whichSpeciesPercolated = speciesAPercolated && speciesBPercolated
            ? 'both'
            : speciesAPercolated ? 'species_A'
            : speciesBPercolated ? 'species_B'
            : observables.largestClusterSpecies === 'A' ? 'species_A_proxy'
            : observables.largestClusterSpecies === 'B' ? 'species_B_proxy'
            : 'none';
        const chronological = [...history].reverse();
        const sizeCounts = Object.entries(observables.clusterSizeDistribution)
            .map(([size, count]) => ({ size: Number(size), count: Number(count) }))
            .filter((entry) => entry.size > 0 && entry.count > 0);
        const clusterSizeExponentEstimate = sizeCounts.length >= 3
            ? -linearSlope(sizeCounts.map((entry) => ({
                x: Math.log(entry.size),
                y: Math.log(entry.count)
            })))
            : null;
        const wrappingTicks = chronological.filter((entry) =>
            Number(entry.observables?.topologyWrappingClusterCount || 0) > 0).length;
        const topologyWrappingProbability = chronological.length
            ? wrappingTicks / chronological.length
            : observables.topologyWrappingProbability;
        return {
            whichSpeciesPercolated,
            survivalExtinctionTime: observables.survivalExtinctionTime,
            clusterSizeExponentEstimate,
            topologyWrappingProbability,
            finalLargestCluster: observables.largestCluster,
            finalSurvivalProbability: observables.survivalProbability,
            finalInterfaceLength: observables.interfaceLength,
            summary: `${whichSpeciesPercolated.replaceAll('_', ' ')}; largest cluster ${observables.largestCluster}; survival ${observables.survivalProbability.toFixed(2)}; wrapping probability ${topologyWrappingProbability.toFixed(2)}.`
        };
    }

    recordPosition(type) {
        const serialized = this.serializeBoard();
        this.positionHistory.push({
            type,
            number: this.moveNumber,
            board: [...this.board.entries()].map(([key, species]) => ({
                key,
                coord: this.coordFromKey(key),
                species,
                color: playerForSpecies(species)
            }))
        });
        this.positionSet.add(serialized);
    }

    exportState() {
        return {
            mode: this.mode,
            physicalSystemName: 'Physical cluster Go competition graph',
            blackWhiteMeaning: 'black = species A / phase A / spin sector A; white = species B / phase B / spin sector B; liberties = local growth or resource sites; capture = local extinction / annihilation / confinement',
            initialStateOptions: [...CLUSTER_INITIAL_STATES],
            allowedActions: [...CLUSTER_ACTIONS],
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions,
                lattice: this.topology.lattice
            },
            config: cloneValue(this.config),
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            captures: cloneValue(this.captures),
            board: [...this.board.entries()].map(([key, species]) => ({
                key,
                coord: this.coordFromKey(key),
                species,
                color: playerForSpecies(species)
            })),
            observables: this.computePhysicalObservables(),
            physicalAnswer: this.computePhysicalAnswer(),
            history: cloneValue(this.history),
            physicsHistory: cloneValue(this.physicsHistory || [])
        };
    }
}
