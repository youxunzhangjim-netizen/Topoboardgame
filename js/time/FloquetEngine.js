import { transformPauliLabel, normalizePauliLabel } from '../algebra/PauliAlgebra.js';
import { applyAnyonAutomorphism, normalizeAnyonType } from '../anyon/AnyonAlgebra.js';
import { coordKey } from '../topology/GraphTopologies.js';

export const TIME_UPDATE_MODES = Object.freeze(['off', 'after_move', 'after_full_round']);
export const FLOQUET_MODES = Object.freeze(['off', 'basic', 'clifford', 'virasoro', 'anyon']);
export const FIELD_KEYS = Object.freeze(['stress', 'potential', 'charge']);

export const DEFAULT_TIME_CONFIG = Object.freeze({
    updateMode: 'off',
    floquetMode: 'off',
    period: 4,
    rechargeRate: 0,
    maxEnergy: 10,
    decayRate: 0.92,
    diffusionRate: 0.15,
    roundEndingPlayer: 'white',
    labelRotation: Object.freeze({ X: 'Y', Y: 'Z', Z: 'X', I: 'I' }),
    hDefectVertices: Object.freeze([]),
    sDefectVertices: Object.freeze([]),
    markedVertices: Object.freeze([]),
    l0Scale: 1.1,
    l1FocusRate: 0.25,
    virasoro_CFT_N2: false,
    anomalyStress: 0.25,
    anomalyPhases: Object.freeze([2]),
    seamAutomorphismVertices: Object.freeze([])
});

function integer(value, fallback, min = 0, max = 1000000) {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function finiteNumber(value, fallback, min = -Infinity, max = Infinity) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function normalizeMode(value, allowed, fallback) {
    const text = String(value || '').toLowerCase();
    return allowed.includes(text) ? text : fallback;
}

function cloneCoord(coord) {
    return Array.isArray(coord) ? [...coord] : String(coord).split(',').map(Number);
}

function keyFor(coordOrKey) {
    return Array.isArray(coordOrKey) ? coordKey(coordOrKey) : String(coordOrKey);
}

function uniqueKeys(items = []) {
    return [...new Set(items.map(keyFor))];
}

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') return { ...value };
    return value;
}

function cloneEvent(event) {
    return cloneValue(event);
}

function entityEntries(source) {
    if (!source) return [];
    if (source instanceof Map) return [...source.entries()].filter(([, entity]) => entity && typeof entity === 'object');
    if (Array.isArray(source)) return source.map((entity, index) => [String(index), entity]).filter(([, entity]) => entity && typeof entity === 'object');
    if (typeof source === 'object') return Object.entries(source).filter(([, entity]) => entity && typeof entity === 'object');
    return [];
}

function hasFieldValue(state) {
    return FIELD_KEYS.some((field) => Math.abs(Number(state?.[field]) || 0) > 1e-12);
}

function addField(target, field, value) {
    target[field] = (Number(target[field]) || 0) + value;
}

function normalizeVertexList(vertices = []) {
    return Array.isArray(vertices) ? vertices.map(keyFor) : [];
}

function coordFromKey(key) {
    return String(key).split(',').map(Number);
}

function entityCoord(key, entity) {
    if (Array.isArray(entity?.coord)) return entity.coord;
    if (Array.isArray(entity?.vertex)) return entity.vertex;
    return coordFromKey(key);
}

function getPauli(entity) {
    return normalizePauliLabel(entity?.pauliLabel ?? entity?.pauli ?? 'I', 'I');
}

function setPauli(entity, label) {
    const normalized = normalizePauliLabel(label, 'I');
    if ('pauliLabel' in entity) entity.pauliLabel = normalized;
    else entity.pauli = normalized;
    return normalized;
}

function setAnyonType(entity, type, model = 'toric_code') {
    const normalized = normalizeAnyonType(type, model);
    entity.anyonType = normalized;
    return normalized;
}

export function normalizeTimeConfig(config = {}) {
    const updateMode = normalizeMode(config.updateMode, TIME_UPDATE_MODES, DEFAULT_TIME_CONFIG.updateMode);
    const floquetMode = normalizeMode(config.floquetMode, FLOQUET_MODES, DEFAULT_TIME_CONFIG.floquetMode);
    const period = integer(config.period ?? config.M, DEFAULT_TIME_CONFIG.period, 1, 128);
    return {
        ...DEFAULT_TIME_CONFIG,
        ...config,
        updateMode,
        floquetMode,
        period,
        rechargeRate: finiteNumber(config.rechargeRate, DEFAULT_TIME_CONFIG.rechargeRate, 0, 1000),
        maxEnergy: finiteNumber(config.maxEnergy, DEFAULT_TIME_CONFIG.maxEnergy, 0, 1000000),
        decayRate: finiteNumber(config.decayRate, DEFAULT_TIME_CONFIG.decayRate, 0, 1),
        diffusionRate: finiteNumber(config.diffusionRate, DEFAULT_TIME_CONFIG.diffusionRate, 0, 1),
        hDefectVertices: normalizeVertexList(config.hDefectVertices),
        sDefectVertices: normalizeVertexList(config.sDefectVertices),
        markedVertices: normalizeVertexList(config.markedVertices),
        anomalyPhases: Array.isArray(config.anomalyPhases)
            ? config.anomalyPhases.map((phase) => integer(phase, 0, 0, period - 1))
            : [...DEFAULT_TIME_CONFIG.anomalyPhases],
        seamAutomorphismVertices: normalizeVertexList(config.seamAutomorphismVertices)
    };
}

export function createGameTime(overrides = {}) {
    const period = integer(overrides.period ?? overrides.M, DEFAULT_TIME_CONFIG.period, 1, 128);
    const tick = integer(overrides.tick, 0, 0);
    return {
        tick,
        round: integer(overrides.round, 0, 0),
        phase: integer(overrides.phase, tick % period, 0, period - 1),
        period,
        updateMode: normalizeMode(overrides.updateMode, TIME_UPDATE_MODES, DEFAULT_TIME_CONFIG.updateMode)
    };
}

export function createVertexFieldState(overrides = {}) {
    return {
        stress: finiteNumber(overrides.stress, 0),
        potential: finiteNumber(overrides.potential, 0),
        charge: finiteNumber(overrides.charge, 0)
    };
}

export function createTemporalEntityState(overrides = {}) {
    return {
        age: integer(overrides.age, 0, 0),
        energy: finiteNumber(overrides.energy, 0, 0),
        phaseLabel: integer(overrides.phaseLabel, 0, 0),
        cooldown: integer(overrides.cooldown, 0, 0)
    };
}

export class FloquetEngine {
    constructor({ topology = null, config = {}, state = null, game = null } = {}) {
        this.topology = topology;
        this.game = game;
        this.config = normalizeTimeConfig(config);
        this.gameTime = createGameTime({
            ...(state?.gameTime || {}),
            period: this.config.period,
            updateMode: this.config.updateMode
        });
        this.vertexFields = new Map();
        this.eventLog = [];
        this.subscribers = new Map();
        if (state?.vertexFields) this.importVertexFields(state.vertexFields);
        if (Array.isArray(state?.eventLog)) this.eventLog = state.eventLog.map(cloneEvent);
    }

    isEnabled() {
        return this.config.updateMode !== 'off' && this.config.floquetMode !== 'off';
    }

    setTopology(topology) {
        this.topology = topology;
    }

    setConfig(config = {}) {
        this.config = normalizeTimeConfig({ ...this.config, ...config });
        this.gameTime.period = this.config.period;
        this.gameTime.updateMode = this.config.updateMode;
        this.gameTime.phase = this.gameTime.tick % this.gameTime.period;
    }

    subscribe(eventType, handler) {
        if (typeof handler !== 'function') return () => {};
        const type = String(eventType || 'event');
        if (!this.subscribers.has(type)) this.subscribers.set(type, new Set());
        this.subscribers.get(type).add(handler);
        return () => this.subscribers.get(type)?.delete(handler);
    }

    emit(eventType, payload = {}) {
        const event = {
            type: eventType,
            tick: this.gameTime.tick,
            round: this.gameTime.round,
            phase: this.gameTime.phase,
            ...payload
        };
        this.eventLog.push(cloneEvent(event));
        for (const handler of this.subscribers.get(eventType) || []) handler(event, this);
        for (const handler of this.subscribers.get('*') || []) handler(event, this);
        return event;
    }

    vertexState(coordOrKey) {
        const key = keyFor(coordOrKey);
        if (!this.vertexFields.has(key)) this.vertexFields.set(key, createVertexFieldState());
        return this.vertexFields.get(key);
    }

    getVertexState(coordOrKey) {
        return this.vertexFields.get(keyFor(coordOrKey)) || null;
    }

    setVertexState(coordOrKey, state = {}) {
        const next = createVertexFieldState({ ...this.getVertexState(coordOrKey), ...state });
        this.vertexFields.set(keyFor(coordOrKey), next);
        return next;
    }

    shouldUpdate(trigger = 'after_move', { player = '', completedRound = false } = {}) {
        if (!this.isEnabled()) return false;
        if (this.config.updateMode === trigger) return true;
        if (this.config.updateMode === 'after_full_round' && trigger === 'after_move') {
            return Boolean(completedRound || player === this.config.roundEndingPlayer);
        }
        return false;
    }

    afterMove(context = {}) {
        const player = context.player || '';
        const completedRound = Boolean(context.completedRound || player === this.config.roundEndingPlayer);
        if (!this.shouldUpdate('after_move', { player, completedRound })) return null;
        return this.applyTimeEvolution({ ...context, trigger: 'after_move', completedRound });
    }

    applyTimeEvolution(context = {}) {
        if (!this.isEnabled()) return { applied: false, reason: 'time-off', gameTime: { ...this.gameTime } };
        const phase = this.gameTime.phase;
        const mode = this.config.floquetMode;
        const event = {
            applied: true,
            trigger: context.trigger || 'manual',
            mode,
            phase,
            before: { ...this.gameTime },
            effects: []
        };

        this.emit('beforeEvolution', { context, mode, phase });
        this.applyGenericEvolution(context, event);
        this.applyFloquetPhase(context, event);
        this.advanceTime(context);
        event.after = { ...this.gameTime };
        this.emit('afterEvolution', event);
        return event;
    }

    applyGenericEvolution(context, event) {
        const entities = [
            ...entityEntries(context.board),
            ...entityEntries(context.tokens),
            ...entityEntries(context.entities)
        ];
        const aged = this.applyEntityAging(entities);
        if (aged) event.effects.push({ kind: 'entity_temporal_update', count: aged });

        if (this.gameTime.phase === 0) {
            const decayed = this.decayFields();
            if (decayed) event.effects.push({ kind: 'field_decay', count: decayed, decayRate: this.config.decayRate });
        }
    }

    applyEntityAging(entries = []) {
        let count = 0;
        for (const [, entity] of entries) {
            if (!entity || typeof entity !== 'object') continue;
            entity.age = integer((entity.age ?? 0) + 1, 1, 0);
            entity.energy = Math.min(this.config.maxEnergy, finiteNumber(entity.energy, 0, 0) + this.config.rechargeRate);
            entity.cooldown = Math.max(0, integer(entity.cooldown, 0, 0) - 1);
            entity.phaseLabel = integer(entity.phaseLabel, 0, 0);
            count += 1;
        }
        return count;
    }

    decayFields() {
        let count = 0;
        for (const [key, state] of this.vertexFields.entries()) {
            for (const field of FIELD_KEYS) state[field] = (Number(state[field]) || 0) * this.config.decayRate;
            if (hasFieldValue(state)) count += 1;
            else this.vertexFields.delete(key);
        }
        return count;
    }

    diffuseFields(fields = FIELD_KEYS) {
        if (!this.topology?.neighbors || this.config.diffusionRate <= 0) return 0;
        const deltas = new Map();
        let touched = 0;

        for (const [key, state] of this.vertexFields.entries()) {
            if (!hasFieldValue(state)) continue;
            const coord = coordFromKey(key);
            const neighbors = this.topology.neighbors(coord);
            if (!neighbors.length) continue;
            touched += 1;
            const sourceDelta = deltas.get(key) || createVertexFieldState();
            for (const field of fields) {
                const value = Number(state[field]) || 0;
                const totalOut = value * this.config.diffusionRate;
                if (Math.abs(totalOut) <= 1e-12) continue;
                sourceDelta[field] -= totalOut;
                const share = totalOut / neighbors.length;
                for (const neighbor of neighbors) {
                    const neighborKey = keyFor(neighbor);
                    const targetDelta = deltas.get(neighborKey) || createVertexFieldState();
                    addField(targetDelta, field, share);
                    deltas.set(neighborKey, targetDelta);
                }
            }
            deltas.set(key, sourceDelta);
        }

        for (const [key, delta] of deltas.entries()) {
            const state = this.vertexState(key);
            for (const field of fields) addField(state, field, delta[field]);
        }
        return touched;
    }

    applyFloquetPhase(context, event) {
        this.emit('phaseStart', { mode: this.config.floquetMode, phase: this.gameTime.phase });
        if (this.config.floquetMode === 'basic') this.applyBasicPhase(context, event);
        if (this.config.floquetMode === 'clifford') this.applyCliffordPhase(context, event);
        if (this.config.floquetMode === 'virasoro') this.applyVirasoroPhase(context, event);
        if (this.config.floquetMode === 'anyon') this.applyAnyonPhase(context, event);
        this.emit('phaseEnd', { mode: this.config.floquetMode, phase: this.gameTime.phase, effects: event.effects });
    }

    applyBasicPhase(context, event) {
        if (this.gameTime.phase === 1) {
            const count = this.diffuseFields(['stress', 'potential', 'charge']);
            event.effects.push({ kind: 'field_diffusion', count });
        }
        if (this.gameTime.phase === 2) {
            const count = this.rotatePhaseLabels(context);
            event.effects.push({ kind: 'phase_label_rotation', count });
        }
        if (this.gameTime.phase === 3) {
            event.effects.push({ kind: 'defect_phase', activated: this.config.markedVertices.length });
        }
    }

    rotatePhaseLabels(context) {
        let count = 0;
        for (const [, entity] of [
            ...entityEntries(context.board),
            ...entityEntries(context.tokens),
            ...entityEntries(context.entities)
        ]) {
            if (!entity || typeof entity !== 'object') continue;
            entity.phaseLabel = (integer(entity.phaseLabel, 0, 0) + 1) % this.config.period;
            if ('pauliLabel' in entity || 'pauli' in entity) {
                const before = getPauli(entity);
                setPauli(entity, this.config.labelRotation?.[before] || before);
            }
            count += 1;
        }
        return count;
    }

    applyCliffordPhase(context, event) {
        if (this.gameTime.phase === 1) {
            const count = this.applyCliffordOnVertices(context, this.config.hDefectVertices, 'H');
            event.effects.push({ kind: 'clifford_H_defects', count });
        }
        if (this.gameTime.phase === 2) {
            const count = this.applyCliffordOnVertices(context, this.config.sDefectVertices, 'S');
            event.effects.push({ kind: 'clifford_S_defects', count });
        }
        if (this.gameTime.phase === 3) {
            const count = this.resetTemporaryAlgebra(context);
            event.effects.push({ kind: 'temporary_algebra_reset', count });
        }
        if (![1, 2, 3].includes(this.gameTime.phase)) {
            const decayed = this.decayFields();
            event.effects.push({ kind: 'field_decay', count: decayed, decayRate: this.config.decayRate });
        }
    }

    applyCliffordOnVertices(context, vertices, generator) {
        const targets = new Set(vertices);
        if (!targets.size) return 0;
        let count = 0;
        for (const [key, entity] of [
            ...entityEntries(context.board),
            ...entityEntries(context.tokens),
            ...entityEntries(context.entities)
        ]) {
            if (!entity || !('pauliLabel' in entity || 'pauli' in entity)) continue;
            const vertexKey = keyFor(entityCoord(key, entity));
            if (!targets.has(vertexKey)) continue;
            const before = getPauli(entity);
            const after = setPauli(entity, transformPauliLabel(before, generator));
            entity.temporaryAlgebra = [...(entity.temporaryAlgebra || []), {
                tick: this.gameTime.tick,
                phase: this.gameTime.phase,
                generator,
                before,
                after
            }];
            count += 1;
        }
        return count;
    }

    resetTemporaryAlgebra(context) {
        let count = 0;
        for (const [, entity] of [
            ...entityEntries(context.board),
            ...entityEntries(context.tokens),
            ...entityEntries(context.entities)
        ]) {
            if (Array.isArray(entity.temporaryAlgebra) && entity.temporaryAlgebra.length) {
                entity.temporaryAlgebra = [];
                count += 1;
            }
        }
        return count;
    }

    applyVirasoroPhase(context, event) {
        if (this.gameTime.phase === 1) {
            const count = this.diffuseFields(['stress']);
            event.effects.push({ kind: 'virasoro_stress_diffusion', count });
        }
        if (this.gameTime.phase === 2) {
            const count = this.scaleMarkedStress();
            event.effects.push({ kind: 'virasoro_L0_scaling', count, scale: this.config.l0Scale });
        }
        if (this.gameTime.phase === 3) {
            const count = this.focusStress();
            event.effects.push({ kind: 'virasoro_L1_focusing', count, focusRate: this.config.l1FocusRate });
        }
        if (this.config.virasoro_CFT_N2 && this.config.anomalyPhases.includes(this.gameTime.phase)) {
            const count = this.applyAnomalyStress();
            event.effects.push({ kind: 'virasoro_L2_anomaly_stress', count, anomalyStress: this.config.anomalyStress });
        }
    }

    scaleMarkedStress() {
        let count = 0;
        for (const key of uniqueKeys(this.config.markedVertices)) {
            const state = this.vertexState(key);
            state.stress *= this.config.l0Scale;
            count += 1;
        }
        return count;
    }

    focusStress() {
        if (!this.topology?.neighbors) return 0;
        const targets = uniqueKeys(this.config.markedVertices);
        let count = 0;
        for (const key of targets) {
            const coord = coordFromKey(key);
            const target = this.vertexState(key);
            for (const neighbor of this.topology.neighbors(coord)) {
                const neighborState = this.getVertexState(neighbor);
                if (!neighborState) continue;
                const amount = (Number(neighborState.stress) || 0) * this.config.l1FocusRate;
                neighborState.stress -= amount;
                target.stress += amount;
            }
            count += 1;
        }
        return count;
    }

    applyAnomalyStress() {
        const targets = uniqueKeys(this.config.markedVertices);
        let count = 0;
        for (const key of targets) {
            this.vertexState(key).stress += this.config.anomalyStress;
            count += 1;
        }
        return count;
    }

    applyAnyonPhase(context, event) {
        if (this.gameTime.phase === 1) {
            const count = context.game?.worldlines?.size || context.worldlines?.size || 0;
            event.effects.push({ kind: 'anyon_braid_history_evaluation', count });
        }
        if (this.gameTime.phase === 2) {
            const count = this.activateFusionSites(context);
            event.effects.push({ kind: 'anyon_fusion_site_activation', count });
        }
        if (this.gameTime.phase === 3) {
            const count = this.moveTwistDefects();
            event.effects.push({ kind: 'anyon_twist_defect_phase', count });
        }
        if (this.gameTime.phase === 4 && this.gameTime.period >= 5) {
            const count = this.applySeamAutomorphisms(context);
            event.effects.push({ kind: 'anyon_seam_automorphism', count });
        }
    }

    activateFusionSites(context) {
        const game = context.game || this.game;
        if (!game?.tokens || !game?.fusionSites || typeof game.resolveFusion !== 'function') return 0;
        let count = 0;
        for (const token of [...game.tokens.values()]) {
            if (!game.tokens.has(token.id)) continue;
            if (!game.fusionSites.has(coordKey(token.coord))) continue;
            const result = game.resolveFusion(token.id);
            if (result) count += 1;
        }
        return count;
    }

    moveTwistDefects() {
        if (typeof this.config.defectMover === 'function') {
            return this.config.defectMover(this) || 0;
        }
        return this.config.markedVertices.length;
    }

    applySeamAutomorphisms(context) {
        const game = context.game || this.game;
        const tokens = context.tokens || game?.tokens;
        if (!tokens) return 0;
        const targets = new Set(this.config.seamAutomorphismVertices);
        if (!targets.size) return 0;
        let count = 0;
        for (const [key, token] of entityEntries(tokens)) {
            if (!('anyonType' in token)) continue;
            const vertexKey = keyFor(entityCoord(key, token));
            if (!targets.has(vertexKey)) continue;
            const before = token.anyonType;
            const after = applyAnyonAutomorphism(before, 'twist', game?.config?.anyonModel || 'toric_code');
            setAnyonType(token, after, game?.config?.anyonModel || 'toric_code');
            token.topologicalSectorHistory = [...(token.topologicalSectorHistory || []), {
                tick: this.gameTime.tick,
                phase: this.gameTime.phase,
                before,
                after
            }];
            count += 1;
        }
        return count;
    }

    advanceTime(context = {}) {
        this.gameTime.tick += 1;
        if (context.completedRound) this.gameTime.round += 1;
        this.gameTime.phase = this.gameTime.tick % this.gameTime.period;
        this.emit('timeAdvanced', { gameTime: { ...this.gameTime } });
    }

    phaseTimeline() {
        return Array.from({ length: this.gameTime.period }, (_, phase) => ({
            phase,
            active: phase === this.gameTime.phase,
            label: this.phaseLabel(phase)
        }));
    }

    phaseLabel(phase = this.gameTime.phase) {
        const labels = ['stabilize', 'diffuse', 'algebra', 'defect'];
        if (this.config.floquetMode === 'anyon' && phase === 4) return 'automorphism';
        return labels[phase] || `phase-${phase}`;
    }

    fieldSnapshot() {
        return [...this.vertexFields.entries()].map(([key, state]) => ({
            key,
            coord: coordFromKey(key),
            ...createVertexFieldState(state)
        }));
    }

    tooltipForEntity(entity = {}) {
        const temporal = createTemporalEntityState(entity);
        return `age ${temporal.age}; energy ${temporal.energy}; phase ${temporal.phaseLabel}; cooldown ${temporal.cooldown}`;
    }

    importVertexFields(fields = []) {
        this.vertexFields = new Map();
        const entries = fields instanceof Map
            ? [...fields.entries()]
            : Array.isArray(fields)
                ? fields.map((item) => [item.key || keyFor(item.coord), item])
                : Object.entries(fields);
        for (const [key, value] of entries) {
            this.vertexFields.set(keyFor(key), createVertexFieldState(value));
        }
    }

    exportState(extra = {}) {
        return {
            ...extra,
            config: { ...this.config },
            gameTime: { ...this.gameTime },
            vertexFields: this.fieldSnapshot(),
            phaseTimeline: this.phaseTimeline(),
            eventLog: this.eventLog.map(cloneEvent)
        };
    }
}

export function createFloquetEngine(options = {}) {
    return new FloquetEngine(options);
}
