import {
    normalizePauliSign,
    normalizePauliLabel,
    transformSignedPauli,
    transformPauliLabel,
    transportLabelAcrossEdges,
    transportSignedPauliAcrossEdges
} from '../algebra/PauliAlgebra.js';
import {
    coordKey,
    createGraphTopology,
    sumHomology
} from '../topology/GraphTopologies.js';
import { ProbabilityEngine } from '../probability/ProbabilityEngine.js';
import { FloquetEngine } from '../time/FloquetEngine.js';
import {
    createPhysicalProblem,
    topologyOptionsForPhysicalProblem
} from '../physics/PhysicalProblems.js';

export const CLIFFORD_REVERSI_MODE = 'clifford_reversi';

const PLAYERS = Object.freeze(['black', 'white']);
const DEFAULT_LABELS = Object.freeze(['X', 'Y', 'Z']);

function otherPlayer(player) {
    return player === 'black' ? 'white' : 'black';
}

function cloneStone(stone) {
    return stone ? {
        color: stone.color,
        pauliLabel: stone.pauliLabel,
        pauliSign: normalizePauliSign(stone.pauliSign ?? stone.sign ?? 1),
        phase: ((Number(stone.phase ?? stone.phaseLabel) || 0) % 4 + 4) % 4,
        isAncilla: Boolean(stone.isAncilla),
        ancillaBasis: stone.ancillaBasis || null,
        nonStabilizerApprox: Boolean(stone.nonStabilizerApprox),
        lastUpdate: stone.lastUpdate ? { ...stone.lastUpdate } : null,
        hiddenState: stone.hiddenState ? { ...stone.hiddenState } : null,
        revealed: stone.revealed ?? true,
        stability: stone.stability ?? 1,
        age: Number.isFinite(Number(stone.age)) ? Number(stone.age) : 0,
        energy: Number.isFinite(Number(stone.energy)) ? Number(stone.energy) : 0,
        phaseLabel: Number.isFinite(Number(stone.phaseLabel)) ? Number(stone.phaseLabel) : 0,
        cooldown: Number.isFinite(Number(stone.cooldown)) ? Number(stone.cooldown) : 0,
        temporaryAlgebra: Array.isArray(stone.temporaryAlgebra) ? [...stone.temporaryAlgebra] : [],
        measurementHistory: Array.isArray(stone.measurementHistory) ? [...stone.measurementHistory] : [],
        noiseHistory: Array.isArray(stone.noiseHistory) ? [...stone.noiseHistory] : []
    } : null;
}

export class CliffordReversiGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = CLIFFORD_REVERSI_MODE;
        const physicalProblemSource = options.physicalProblem || options.physicalProblemId || options.problemId || null;
        const physicalProblemConfig = options.physicalProblemConfig || {};
        const problemTopology = topologyOptionsForPhysicalProblem(physicalProblemSource, physicalProblemConfig);
        this.physicalProblem = createPhysicalProblem(physicalProblemSource, physicalProblemConfig);
        this.topology = createGraphTopology(problemTopology || options.topology || options);
        this.currentPlayer = options.currentPlayer || 'black';
        this.defaultFlipTransform = options.defaultFlipTransform || 'H';
        this.trackPhaseSigns = Boolean(options.trackPhaseSigns ?? options.config?.trackPhaseSigns);
        this.board = new Map();
        this.moveNumber = 0;
        this.history = [];
        this.positionHistory = [];
        this.probability = new ProbabilityEngine(options.probability || {});
        this.time = new FloquetEngine({
            topology: this.topology,
            config: options.time || options.floquet || {},
            game: this
        });
        this.setupInitialPosition();
        this.physicalProblem?.setupInitialState?.(this);
        this.recordPosition('setup');
        this.physicalProblem?.start?.(this);
    }

    setupInitialPosition() {
        const sizes = this.topology.sizes;
        if (this.topology.dimensions === 3) {
            const x = Math.max(1, Math.floor(sizes[0] / 2) - 1);
            const y = Math.max(1, Math.floor(sizes[1] / 2) - 1);
            const z = Math.floor(sizes[2] / 2);
            this.setStone([x, y, z], { color: 'white', pauliLabel: 'X' });
            this.setStone([x + 1, y + 1, z], { color: 'white', pauliLabel: 'Z' });
            this.setStone([x + 1, y, z], { color: 'black', pauliLabel: 'Y' });
            this.setStone([x, y + 1, z], { color: 'black', pauliLabel: 'X' });
            return;
        }
        if (this.topology.dimensions === 4) {
            const x = Math.max(1, Math.floor(sizes[0] / 2) - 1);
            const y = Math.max(1, Math.floor(sizes[1] / 2) - 1);
            const z = Math.floor(sizes[2] / 2);
            const w = Math.floor(sizes[3] / 2);
            this.setStone([x, y, z, w], { color: 'white', pauliLabel: 'X' });
            this.setStone([x + 1, y + 1, z, w], { color: 'white', pauliLabel: 'Z' });
            this.setStone([x + 1, y, z, w], { color: 'black', pauliLabel: 'Y' });
            this.setStone([x, y + 1, z, w], { color: 'black', pauliLabel: 'X' });
            return;
        }
        const x = Math.max(1, Math.floor(sizes[0] / 2) - 1);
        const y = Math.max(1, Math.floor(sizes[1] / 2) - 1);
        this.setStone([x, y], { color: 'white', pauliLabel: 'X' });
        this.setStone([x + 1, y + 1], { color: 'white', pauliLabel: 'Z' });
        this.setStone([x + 1, y], { color: 'black', pauliLabel: 'Y' });
        this.setStone([x, y + 1], { color: 'black', pauliLabel: 'X' });
    }

    getStone(coord) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return null;
        return cloneStone(this.board.get(coordKey(normalized)));
    }

    setStone(coord, stone) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return false;
        const label = normalizePauliLabel(stone.pauliLabel || stone.pauli || DEFAULT_LABELS[this.board.size % DEFAULT_LABELS.length], 'X');
        this.board.set(coordKey(normalized), {
            color: stone.color,
            pauliLabel: label,
            pauliSign: normalizePauliSign(stone.pauliSign ?? stone.sign ?? 1),
            phase: ((Number(stone.phase ?? stone.phaseLabel) || 0) % 4 + 4) % 4,
            isAncilla: Boolean(stone.isAncilla),
            ancillaBasis: stone.ancillaBasis || null,
            nonStabilizerApprox: Boolean(stone.nonStabilizerApprox),
            lastUpdate: stone.lastUpdate ? { ...stone.lastUpdate } : null,
            hiddenState: stone.hiddenState || null,
            revealed: stone.revealed ?? true,
            stability: Number.isFinite(Number(stone.stability)) ? Number(stone.stability) : 1,
            age: Number.isFinite(Number(stone.age)) ? Number(stone.age) : 0,
            energy: Number.isFinite(Number(stone.energy)) ? Number(stone.energy) : 0,
            phaseLabel: Number.isFinite(Number(stone.phaseLabel)) ? Number(stone.phaseLabel) : 0,
            cooldown: Number.isFinite(Number(stone.cooldown)) ? Number(stone.cooldown) : 0,
            temporaryAlgebra: Array.isArray(stone.temporaryAlgebra) ? [...stone.temporaryAlgebra] : [],
            measurementHistory: Array.isArray(stone.measurementHistory) ? [...stone.measurementHistory] : [],
            noiseHistory: Array.isArray(stone.noiseHistory) ? [...stone.noiseHistory] : []
        });
        return true;
    }

    isEmpty(coord) {
        const normalized = this.topology.normalize(coord);
        return Boolean(normalized) && !this.board.has(coordKey(normalized));
    }

    collectRay(coord, direction, player) {
        const opponent = otherPlayer(player);
        const chain = [];
        const edges = [];
        const seen = new Set([coordKey(coord)]);
        let cursor = coord;

        for (let step = 0; step < this.topology.maxRaySteps; step++) {
            const next = this.topology.step(cursor, direction);
            if (!next) break;
            const nextKey = coordKey(next.coord);
            if (seen.has(nextKey)) break;
            seen.add(nextKey);
            edges.push(next.edge);

            const stone = this.board.get(nextKey);
            if (!stone) break;
            if (stone.color === opponent) {
                chain.push({
                    coord: next.coord,
                    key: nextKey,
                    stone: cloneStone(stone),
                    edges: [...edges]
                });
                cursor = next.coord;
                continue;
            }
            if (stone.color === player && chain.length) {
                return { bracketed: true, chain, edges: [...edges] };
            }
            break;
        }

        return { bracketed: false, chain: [], edges };
    }

    previewMove(coord, player = this.currentPlayer, transform = this.defaultFlipTransform) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return { legal: false, reason: 'outside', flips: [] };
        if (!this.isEmpty(normalized)) return { legal: false, reason: 'occupied', flips: [] };

        const rays = [];
        const flips = [];
        for (const direction of this.topology.rayDirections()) {
            const ray = this.collectRay(normalized, direction, player);
            if (!ray.bracketed) continue;
            rays.push({ direction, chain: ray.chain.map((item) => item.coord), edges: ray.edges });
            for (const item of ray.chain) {
                const signedAfter = this.trackPhaseSigns
                    ? transportSignedPauliAcrossEdges(
                        transformSignedPauli(item.stone, transform, true),
                        item.edges,
                        true
                    )
                    : {
                        pauliLabel: transportLabelAcrossEdges(
                            transformPauliLabel(item.stone.pauliLabel, transform),
                            item.edges
                        ),
                        pauliSign: normalizePauliSign(item.stone.pauliSign ?? 1)
                    };
                flips.push({
                    coord: item.coord,
                    key: item.key,
                    before: item.stone,
                    after: {
                        color: player,
                        pauliLabel: signedAfter.pauliLabel,
                        pauliSign: signedAfter.pauliSign
                    },
                    transportEdges: item.edges
                });
            }
        }

        const unique = new Map();
        for (const flip of flips) unique.set(flip.key, flip);
        return {
            legal: unique.size > 0,
            coord: normalized,
            player,
            transform,
            rays,
            flips: [...unique.values()]
        };
    }

    legalMoves(player = this.currentPlayer, transform = this.defaultFlipTransform) {
        return this.topology.vertices()
            .map((coord) => this.previewMove(coord, player, transform))
            .filter((preview) => preview.legal);
    }

    place(coord, options = {}) {
        const player = options.player || this.currentPlayer;
        const transform = options.transform || this.defaultFlipTransform;
        const pauliLabel = normalizePauliLabel(options.pauliLabel || options.pauli || DEFAULT_LABELS[this.moveNumber % DEFAULT_LABELS.length], 'X');
        const preview = this.previewMove(coord, player, transform);
        if (!preview.legal) return { ok: false, error: 'Place a stone where it brackets at least one opponent chain.', preview };

        const physicalBefore = this.physicalProblem?.beforeMove?.(this);
        this.setStone(preview.coord, { color: player, pauliLabel, pauliSign: options.pauliSign ?? 1 });
        for (const flip of preview.flips) this.board.set(flip.key, flip.after);

        const edges = preview.rays.flatMap((ray) => ray.edges);
        const sector = sumHomology(edges);
        this.moveNumber++;
        const event = {
            mode: this.mode,
            type: 'place',
            number: this.moveNumber,
            player,
            coord: preview.coord,
            pauliLabel,
            transform,
            flipped: preview.flips.map((flip) => ({
                coord: flip.coord,
                before: flip.before,
                after: flip.after
            })),
            winding: sector,
            seamTransports: edges
                .filter((edge) => edge.transport && edge.transport !== 'identity')
                .map((edge) => ({ from: edge.from, to: edge.to, transport: edge.transport }))
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
        }
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        event.noise = this.maybeApplyNoise('after_move', player);
        event.time = this.maybeApplyTime('after_move', player);
        this.recordPosition(event.time?.applied ? 'time' : 'move');
        return { ok: true, event };
    }

    pass(player = this.currentPlayer) {
        this.moveNumber++;
        const event = { mode: this.mode, type: 'pass', number: this.moveNumber, player };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        event.noise = this.maybeApplyNoise('after_move', player);
        event.time = this.maybeApplyTime('after_move', player);
        this.physicalProblem?.record?.(this, { type: 'pass', event });
        this.recordPosition(event.time?.applied ? 'time' : 'pass');
        return { ok: true, event };
    }

    maybeApplyNoise(trigger, player = this.currentPlayer) {
        if (!this.probability?.shouldApplyNoise(trigger, this.currentPlayer)) return [];
        return this.applyNoiseCycle({ player, tick: this.moveNumber, trigger });
    }

    applyNoiseCycle({ player = this.currentPlayer, tick = null, trigger = 'manual' } = {}) {
        if (!this.probability?.isEnabled()) return [];
        const resolvedTick = tick == null ? this.probability.nextTick() : this.probability.nextTick(tick);
        const events = this.probability.applyPauliNoiseToMap(this.board, {
            player,
            tick: resolvedTick,
            topology: this.topology
        });
        if (events.length && trigger === 'manual') {
            this.history.unshift({
                mode: this.mode,
                type: 'noise',
                number: this.moveNumber,
                player,
                noiseEvents: events.length
            });
        }
        if (events.length) this.physicalProblem?.record?.(this, { type: 'noise', event: { player, trigger, noiseEvents: events.length } });
        this.recordPosition('noise');
        return events;
    }

    maybeApplyTime(trigger, player = this.currentPlayer) {
        const completedRound = player === 'white';
        if (!this.time?.shouldUpdate(trigger, { player, completedRound })) return null;
        return this.time.applyTimeEvolution({
            trigger,
            player,
            completedRound,
            board: this.board,
            game: this
        });
    }

    connectedGroup(coord) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return [];
        const startKey = coordKey(normalized);
        const start = this.board.get(startKey);
        if (!start) return [];
        const group = [];
        const queue = [normalized];
        const seen = new Set([startKey]);
        while (queue.length) {
            const current = queue.shift();
            const currentKey = coordKey(current);
            group.push({ coord: current, key: currentKey, entity: this.board.get(currentKey) });
            for (const neighbor of this.topology.neighbors(current)) {
                const key = coordKey(neighbor);
                if (seen.has(key)) continue;
                const stone = this.board.get(key);
                if (!stone || stone.color !== start.color) continue;
                seen.add(key);
                queue.push(neighbor);
            }
        }
        return group;
    }

    measurePauliParity(coord, player = this.currentPlayer) {
        const group = this.connectedGroup(coord);
        if (!group.length) return { ok: false, error: 'Measure a connected Pauli group by targeting a stone.' };
        const measurement = this.probability.measurePauliParity({
            entities: group.map(({ key, entity }) => ({ key, entity })),
            vertices: group.map(({ coord: vertex }) => vertex),
            player,
            tick: this.probability.nextTick()
        });
        this.history.unshift({
            mode: this.mode,
            type: 'measurement',
            number: this.moveNumber,
            player,
            measurement
        });
        this.physicalProblem?.record?.(this, { type: 'measurement', event: { player, measurement } });
        return { ok: true, measurement };
    }

    counts() {
        const result = { black: 0, white: 0, labels: { X: 0, Y: 0, Z: 0 } };
        for (const stone of this.board.values()) {
            result[stone.color] = (result[stone.color] || 0) + 1;
            result.labels[stone.pauliLabel] = (result.labels[stone.pauliLabel] || 0) + 1;
        }
        return result;
    }

    recordPosition(type) {
        this.positionHistory.push({
            type,
            number: this.moveNumber,
            stones: [...this.board.entries()].map(([key, stone]) => ({ key, ...stone }))
        });
    }

    exportState() {
        return {
            mode: this.mode,
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions
            },
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            board: [...this.board.entries()].map(([key, stone]) => ({ key, coord: key.split(',').map(Number), ...stone })),
            counts: this.counts(),
            history: this.history,
            positionHistory: this.positionHistory,
            probability: this.probability.exportState(),
            time: this.time.exportState(),
            physicalProblem: this.physicalProblem?.export?.(this) || null
        };
    }
}

export function createCliffordReversi(options = {}) {
    return new CliffordReversiGame(options);
}
