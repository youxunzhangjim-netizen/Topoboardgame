import { fusionOutputs, normalizeAnyonType } from '../anyon/AnyonAlgebra.js';
import {
    hiddenFusionMeasurementForTokens,
    revealHiddenFusionChannels
} from '../anyon/NonabelianFusionMemory.js';
import {
    normalizePauliLabel,
    pairToPauli,
    pauliToPair
} from '../algebra/PauliAlgebra.js';
import { coordKey } from '../topology/GraphTopologies.js';
import { SeededRandom } from './SeededRandom.js';

export const NOISE_MODES = Object.freeze([
    'off',
    'pauli',
    'anyon_pair_creation',
    'measurement_error',
    'field_noise',
    'custom'
]);

export const APPLY_NOISE_TIMES = Object.freeze([
    'after_move',
    'after_full_round',
    'after_floquet_cycle'
]);

export const PAULI_NOISE_TYPES = Object.freeze([
    'bitFlipNoise',
    'phaseFlipNoise',
    'depolarizingNoise',
    'erasureNoise'
]);

export const DEFAULT_PROBABILITY_CONFIG = Object.freeze({
    enabled: false,
    seed: 'topological-boardgame-seed',
    noiseMode: 'off',
    noiseRate: 0.05,
    measurementErrorRate: 0.02,
    applyNoise: 'after_move',
    pauliNoiseType: 'depolarizingNoise',
    anyonPairTypes: Object.freeze(['e', 'm']),
    enableAnyonLabelFlips: false,
    measurementErrorMode: 'wrong_result'
});

function clampProbability(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.min(1, parsed));
}

export function normalizeProbabilityConfig(config = {}) {
    const noiseMode = NOISE_MODES.includes(config.noiseMode) ? config.noiseMode : DEFAULT_PROBABILITY_CONFIG.noiseMode;
    const applyNoise = APPLY_NOISE_TIMES.includes(config.applyNoise) ? config.applyNoise : DEFAULT_PROBABILITY_CONFIG.applyNoise;
    const pauliNoiseType = PAULI_NOISE_TYPES.includes(config.pauliNoiseType)
        ? config.pauliNoiseType
        : DEFAULT_PROBABILITY_CONFIG.pauliNoiseType;
    return {
        ...DEFAULT_PROBABILITY_CONFIG,
        ...config,
        enabled: Boolean(config.enabled ?? noiseMode !== 'off'),
        noiseMode,
        applyNoise,
        pauliNoiseType,
        noiseRate: clampProbability(config.noiseRate, DEFAULT_PROBABILITY_CONFIG.noiseRate),
        measurementErrorRate: clampProbability(config.measurementErrorRate, DEFAULT_PROBABILITY_CONFIG.measurementErrorRate),
        anyonPairTypes: Array.isArray(config.anyonPairTypes) && config.anyonPairTypes.length
            ? [...config.anyonPairTypes]
            : [...DEFAULT_PROBABILITY_CONFIG.anyonPairTypes],
        enableAnyonLabelFlips: Boolean(config.enableAnyonLabelFlips)
    };
}

function cloneCoord(coord) {
    return Array.isArray(coord) ? [...coord] : coord;
}

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') return { ...value };
    return value;
}

function tokenKey(key, entity) {
    return entity?.id || entity?.key || key;
}

function tokenVertex(token) {
    return token?.vertex ?? token?.coord ?? null;
}

function displayedPauliLabel(entity) {
    if (!entity) return 'I';
    if (entity.revealed === false && entity.hiddenState?.pauliLabel) return normalizePauliLabel(entity.hiddenState.pauliLabel, 'I');
    return normalizePauliLabel(entity.pauliLabel || entity.pauli || 'I', 'I');
}

function xorPauli(label, error) {
    const pair = pauliToPair(label);
    if (error === 'X') pair.x ^= 1;
    if (error === 'Z') pair.z ^= 1;
    if (error === 'Y') {
        pair.x ^= 1;
        pair.z ^= 1;
    }
    return pairToPauli(pair);
}

function applyPauliError(entity, noiseType, chooser = 0) {
    const before = displayedPauliLabel(entity);
    if (noiseType === 'erasureNoise') {
        entity.hiddenState = { ...(entity.hiddenState || {}), pauliLabel: before };
        entity.pauliLabel = 'unknown';
        entity.revealed = false;
        return { before, after: 'unknown', error: 'erasure' };
    }
    const error = noiseType === 'bitFlipNoise'
        ? 'X'
        : noiseType === 'phaseFlipNoise'
            ? 'Z'
            : ['X', 'Y', 'Z'][Math.min(2, Math.floor(Math.max(0, Math.min(0.999999, chooser)) * 3))];
    const after = xorPauli(before, error);
    entity.pauliLabel = after;
    entity.revealed = true;
    return { before, after, error };
}

export function createTokenObservationState(overrides = {}) {
    return {
        hiddenState: overrides.hiddenState || null,
        revealed: overrides.revealed ?? true,
        stability: Number.isFinite(Number(overrides.stability)) ? Number(overrides.stability) : 1,
        measurementHistory: Array.isArray(overrides.measurementHistory) ? [...overrides.measurementHistory] : [],
        noiseHistory: Array.isArray(overrides.noiseHistory) ? [...overrides.noiseHistory] : []
    };
}

export function createVertexNoiseState(overrides = {}) {
    return {
        noiseLevel: Number.isFinite(Number(overrides.noiseLevel)) ? Number(overrides.noiseLevel) : 0,
        stress: Number.isFinite(Number(overrides.stress)) ? Number(overrides.stress) : 0,
        hiddenDefect: Boolean(overrides.hiddenDefect),
        measured: Boolean(overrides.measured)
    };
}

export class ProbabilityEngine {
    constructor(config = {}) {
        this.config = normalizeProbabilityConfig(config);
        this.rng = new SeededRandom(this.config.seed);
        this.tick = 0;
        this.randomEvents = [];
        this.measurements = [];
        this.vertexStates = new Map();
    }

    isEnabled() {
        return this.config.enabled && this.config.noiseMode !== 'off';
    }

    setConfig(config = {}) {
        const previousSeed = this.config.seed;
        this.config = normalizeProbabilityConfig({ ...this.config, ...config });
        if (this.config.seed !== previousSeed) this.rng = new SeededRandom(this.config.seed);
    }

    nextTick(tick = null) {
        this.tick = Number.isFinite(Number(tick)) ? Number(tick) : this.tick + 1;
        return this.tick;
    }

    probability(value = this.config.noiseRate) {
        return clampProbability(value, this.config.noiseRate);
    }

    randomEvent({ tick = this.tick, player = 'system', type, affectedVertices = [], affectedTokens = [], probability = 1, outcome = {}, sample = null } = {}) {
        const event = {
            tick,
            player,
            type,
            affectedVertices: affectedVertices.map(cloneCoord),
            affectedTokens: [...affectedTokens],
            probability: this.probability(probability),
            sample,
            outcome: cloneValue(outcome)
        };
        this.randomEvents.push(event);
        return event;
    }

    roll({ tick = this.tick, player = 'system', type, affectedVertices = [], affectedTokens = [], probability = this.config.noiseRate, outcome = null } = {}) {
        const p = this.probability(probability);
        const sample = this.rng.next();
        const triggered = sample < p;
        const chooser = p > 0 ? Math.max(0, Math.min(0.999999, sample / p)) : 0;
        const resolvedOutcome = typeof outcome === 'function'
            ? outcome({ triggered, sample, rng: this.rng, probability: p, chooser })
            : { triggered, ...(outcome || {}) };
        return this.randomEvent({
            tick,
            player,
            type,
            affectedVertices,
            affectedTokens,
            probability: p,
            sample,
            outcome: { triggered, ...resolvedOutcome }
        });
    }

    vertexState(coordOrKey) {
        const key = Array.isArray(coordOrKey) ? coordKey(coordOrKey) : String(coordOrKey);
        if (!this.vertexStates.has(key)) this.vertexStates.set(key, createVertexNoiseState());
        return this.vertexStates.get(key);
    }

    getVertexState(coordOrKey) {
        const key = Array.isArray(coordOrKey) ? coordKey(coordOrKey) : String(coordOrKey);
        return this.vertexStates.get(key) || null;
    }

    markMeasuredVertices(vertices = []) {
        for (const coord of vertices) this.vertexState(coord).measured = true;
    }

    shouldApplyNoise(trigger, currentPlayer) {
        if (!this.isEnabled()) return false;
        if (this.config.applyNoise === trigger) return true;
        if (this.config.applyNoise === 'after_full_round' && trigger === 'after_move' && currentPlayer === 'black') return true;
        return false;
    }

    applyFieldNoise(topology, { player = 'system', tick = this.nextTick() } = {}) {
        if (!topology?.vertices) return [];
        const events = [];
        for (const coord of topology.vertices()) {
            const event = this.roll({
                tick,
                player,
                type: 'field_noise',
                affectedVertices: [coord],
                probability: this.config.noiseRate
            });
            if (event.outcome.triggered) {
                const state = this.vertexState(coord);
                state.noiseLevel = Math.min(1, state.noiseLevel + this.config.noiseRate);
                state.stress += 1;
                event.outcome.vertexState = { ...state };
            }
            events.push(event);
        }
        return events;
    }

    applyPauliNoiseToMap(board, { player = 'system', tick = this.nextTick(), topology = null } = {}) {
        if (!board || !(this.config.noiseMode === 'pauli' || this.config.noiseMode === 'custom')) {
            if (this.config.noiseMode === 'field_noise') return this.applyFieldNoise(topology, { player, tick });
            return [];
        }
        const events = [];
        for (const [key, entity] of board.entries()) {
            if (!entity || !('pauliLabel' in entity || 'pauli' in entity || entity.hiddenState?.pauliLabel)) continue;
            const event = this.roll({
                tick,
                player,
                type: `pauli_noise:${this.config.pauliNoiseType}`,
                affectedVertices: [key.split(',').map(Number)],
                affectedTokens: [tokenKey(key, entity)],
                probability: this.config.noiseRate,
                outcome: ({ triggered, chooser }) => {
                    if (!triggered) return { applied: false };
                    const result = applyPauliError(entity, this.config.pauliNoiseType, chooser);
                    const entry = { tick, player, ...result };
                    entity.noiseHistory = [...(entity.noiseHistory || []), entry];
                    return { applied: true, ...result };
                }
            });
            events.push(event);
        }
        return events;
    }

    emptyNeighborPairs(topology, tokenAt) {
        const pairs = [];
        const seen = new Set();
        for (const coord of topology.vertices()) {
            if (tokenAt(coord)) continue;
            for (const neighbor of topology.neighbors(coord)) {
                if (tokenAt(neighbor)) continue;
                const key = [coordKey(coord), coordKey(neighbor)].sort().join('|');
                if (seen.has(key)) continue;
                seen.add(key);
                pairs.push([coord, neighbor]);
            }
        }
        return pairs;
    }

    applyAnyonNoiseToGame(game, { player = 'system', tick = this.nextTick() } = {}) {
        if (!game?.topology || !game?.tokens) return [];
        if (this.config.noiseMode === 'field_noise') return this.applyFieldNoise(game.topology, { player, tick });
        if (!(this.config.noiseMode === 'anyon_pair_creation' || this.config.noiseMode === 'custom')) return [];

        const events = [];
        const pairEvent = this.roll({
            tick,
            player,
            type: 'anyon_pair_creation',
            probability: this.config.noiseRate,
            outcome: ({ triggered, chooser }) => {
                if (!triggered) return { applied: false };
                const pairs = this.emptyNeighborPairs(game.topology, (coord) => game.tokenAt(coord));
                if (!pairs.length) return { applied: false, reason: 'no-empty-neighbor-pair' };
                const pairIndex = Math.min(pairs.length - 1, Math.floor(chooser * pairs.length));
                const typeChooser = (chooser * pairs.length) % 1;
                const typeIndex = Math.min(this.config.anyonPairTypes.length - 1, Math.floor(typeChooser * this.config.anyonPairTypes.length));
                const pair = pairs[pairIndex];
                const type = normalizeAnyonType(this.config.anyonPairTypes[typeIndex] || 'e', game.config?.anyonModel);
                const first = game.addToken({ owner: player, vertex: pair[0], anyonType: type });
                const second = game.addToken({ owner: player, vertex: pair[1], anyonType: type });
                return {
                    applied: true,
                    anyonType: type,
                    createdTokenIds: [first?.id, second?.id].filter(Boolean),
                    vertices: pair.map(cloneCoord)
                };
            }
        });
        if (pairEvent.outcome.vertices) pairEvent.affectedVertices = pairEvent.outcome.vertices;
        if (pairEvent.outcome.createdTokenIds) pairEvent.affectedTokens = pairEvent.outcome.createdTokenIds;
        events.push(pairEvent);

        if (this.config.enableAnyonLabelFlips) {
            for (const token of game.tokens.values()) {
                if (!['e', 'm'].includes(token.anyonType)) continue;
                const event = this.roll({
                    tick,
                    player,
                    type: 'anyon_label_flip:e_m',
                    affectedVertices: [tokenVertex(token)].filter(Boolean),
                    affectedTokens: [token.id],
                    probability: this.config.noiseRate,
                    outcome: ({ triggered }) => {
                        if (!triggered) return { applied: false };
                        const before = token.anyonType;
                        token.anyonType = before === 'e' ? 'm' : 'e';
                        const entry = { tick, player, before, after: token.anyonType };
                        token.noiseHistory = [...(token.noiseHistory || []), entry];
                        return { applied: true, before, after: token.anyonType };
                    }
                });
                events.push(event);
            }
        }
        return events;
    }

    measurePauliParity({ entities = [], vertices = [], player = 'system', tick = this.nextTick() } = {}) {
        const labels = entities.map(({ entity }) => displayedPauliLabel(entity));
        const parity = labels.reduce((total, label) => {
            const pair = pauliToPair(label);
            return {
                x: total.x ^ pair.x,
                z: total.z ^ pair.z
            };
        }, { x: 0, z: 0 });
        const trueResult = (parity.x ^ parity.z) ? 'odd' : 'even';
        const errorEvent = this.roll({
            tick,
            player,
            type: 'measurement_error:pauli_parity',
            affectedVertices: vertices,
            affectedTokens: entities.map(({ key, entity }) => tokenKey(key, entity)),
            probability: this.config.measurementErrorRate
        });
        const reported = errorEvent.outcome.triggered
            ? trueResult === 'even' ? 'odd' : 'even'
            : trueResult;
        const measurement = {
            tick,
            player,
            type: 'pauli_parity',
            target: vertices.map(cloneCoord),
            labels,
            trueResult,
            reported,
            parity,
            error: errorEvent.outcome.triggered
        };
        for (const { entity } of entities) {
            if (!entity) continue;
            if (entity.hiddenState?.pauliLabel) entity.pauliLabel = normalizePauliLabel(entity.hiddenState.pauliLabel, 'I');
            entity.revealed = true;
            entity.measurementHistory = [...(entity.measurementHistory || []), measurement];
        }
        this.markMeasuredVertices(vertices);
        this.measurements.push(measurement);
        return measurement;
    }

    measureAnyonTotalCharge({ tokens = [], player = 'system', model = 'toric_code', tick = this.nextTick() } = {}) {
        const input = tokens.map((token) => normalizeAnyonType(token?.anyonType, model));
        const hiddenChannel = hiddenFusionMeasurementForTokens(tokens, model);
        let possible = hiddenChannel?.possibleOutputs || (input.length ? [input[0]] : ['1']);
        if (!hiddenChannel) {
            for (const type of input.slice(1)) {
                possible = possible.flatMap((current) => fusionOutputs(current, type, model));
            }
        }
        possible = [...new Set(possible.length ? possible : ['1'])];
        let trueResult = hiddenChannel?.trueResult || possible[0];
        if (!hiddenChannel && possible.length > 1) {
            const sample = this.rng.next();
            const selectedIndex = Math.min(possible.length - 1, Math.floor(sample * possible.length));
            trueResult = possible[selectedIndex];
            this.randomEvent({
                tick,
                player,
                type: 'fusion_channel_sample',
                affectedVertices: tokens.map(tokenVertex).filter(Boolean),
                affectedTokens: tokens.map((token) => token.id).filter(Boolean),
                probability: 1,
                sample,
                outcome: {
                    selected: trueResult,
                    possibleOutputs: possible
                }
            });
        }
        const errorEvent = this.roll({
            tick,
            player,
            type: 'measurement_error:anyon_charge',
            affectedVertices: tokens.map(tokenVertex).filter(Boolean),
            affectedTokens: tokens.map((token) => token.id).filter(Boolean),
            probability: this.config.measurementErrorRate
        });
        const alternatives = possible.filter((type) => type !== trueResult);
        const errorChooser = this.config.measurementErrorRate > 0
            ? Math.max(0, Math.min(0.999999, errorEvent.sample / this.config.measurementErrorRate))
            : 0;
        const reported = errorEvent.outcome.triggered && alternatives.length
            ? alternatives[Math.min(alternatives.length - 1, Math.floor(errorChooser * alternatives.length))]
            : trueResult;
        const measurement = {
            tick,
            player,
            type: 'anyon_total_charge',
            input,
            possibleOutputs: possible,
            trueResult,
            reported,
            error: errorEvent.outcome.triggered,
            hiddenFusionChannel: Boolean(hiddenChannel),
            targetTokenIds: tokens.map((token) => token.id).filter(Boolean)
        };
        revealHiddenFusionChannels(tokens, measurement);
        for (const token of tokens) {
            if (!token) continue;
            token.revealed = true;
            if (!token.measurementHistory?.includes(measurement)) {
                token.measurementHistory = [...(token.measurementHistory || []), measurement];
            }
        }
        this.markMeasuredVertices(tokens.map(tokenVertex).filter(Boolean));
        this.measurements.push(measurement);
        return measurement;
    }

    detectDefect({ vertices = [], player = 'system', tick = this.nextTick() } = {}) {
        const hasDefect = vertices.some((coord) => this.vertexState(coord).hiddenDefect);
        const errorEvent = this.roll({
            tick,
            player,
            type: 'measurement_error:defect_detection',
            affectedVertices: vertices,
            probability: this.config.measurementErrorRate
        });
        const reported = errorEvent.outcome.triggered ? !hasDefect : hasDefect;
        const measurement = {
            tick,
            player,
            type: 'defect_detection',
            target: vertices.map(cloneCoord),
            trueResult: hasDefect,
            reported,
            error: errorEvent.outcome.triggered
        };
        this.markMeasuredVertices(vertices);
        this.measurements.push(measurement);
        return measurement;
    }

    summaryStatistics(extra = {}) {
        const appliedNoise = this.randomEvents.filter((event) => event.outcome?.applied || event.outcome?.triggered);
        const measurementErrors = this.measurements.filter((measurement) => measurement.error);
        const fusionOutcomes = extra.fusionOutcomes || [];
        const vacuumFusions = fusionOutcomes.filter((fusion) => fusion.vacuum || fusion.resolved === '1').length;
        return {
            numberOfMeasurements: this.measurements.length,
            numberOfErrors: measurementErrors.length,
            numberOfNoiseEvents: appliedNoise.length,
            survivalTime: this.tick,
            captureCount: Number(extra.captureCount) || 0,
            fusionSuccessRate: fusionOutcomes.length ? vacuumFusions / fusionOutcomes.length : 0
        };
    }

    exportState(extraSummary = {}) {
        return {
            config: { ...this.config },
            rng: this.rng.exportState(),
            tick: this.tick,
            randomEvents: this.randomEvents.map(cloneValue),
            measurements: this.measurements.map(cloneValue),
            vertexStates: [...this.vertexStates.entries()].map(([key, state]) => ({ key, coord: key.split(',').map(Number), ...state })),
            summaryStatistics: this.summaryStatistics(extraSummary)
        };
    }

    importState(state = {}) {
        this.config = normalizeProbabilityConfig(state.config || this.config);
        this.rng = new SeededRandom(this.config.seed);
        if (state.rng) this.rng.importState(state.rng);
        this.tick = Number(state.tick) || 0;
        this.randomEvents = Array.isArray(state.randomEvents) ? state.randomEvents.map(cloneValue) : [];
        this.measurements = Array.isArray(state.measurements) ? state.measurements.map(cloneValue) : [];
        this.vertexStates = new Map((state.vertexStates || []).map((entry) => [entry.key, createVertexNoiseState(entry)]));
    }
}
