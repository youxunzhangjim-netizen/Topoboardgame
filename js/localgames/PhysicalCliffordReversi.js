import {
    anticommute,
    normalizePauliLabel,
    normalizePauliSign,
    transformSignedPauli
} from '../algebra/PauliAlgebra.js';
import { coordKey } from '../topology/GraphTopologies.js';
import { CliffordReversiGame } from './CliffordReversi.js';

export const PHYSICAL_CLIFFORD_REVERSI_MODE = 'physical_clifford_reversi';

export const PHYSICAL_INITIAL_STATES = Object.freeze([
    'stabilizer_vacuum',
    'sparse_pauli_errors',
    'paired_defects',
    'domain_wall_seed',
    'prepared_clifford_circuit'
]);

export const ANCILLA_BASES = Object.freeze(['Z0', 'Z1', 'Xplus', 'Xminus', 'magic']);
export const PHYSICAL_MEASUREMENTS = Object.freeze([
    'local_pauli',
    'connected_domain_parity',
    'bracketed_line_parity',
    'stabilizer_check'
]);

const PAULI_MULTIPLICATION = Object.freeze({
    'I|I': ['I', 0], 'I|X': ['X', 0], 'I|Y': ['Y', 0], 'I|Z': ['Z', 0],
    'X|I': ['X', 0], 'X|X': ['I', 0], 'X|Y': ['Z', 1], 'X|Z': ['Y', 3],
    'Y|I': ['Y', 0], 'Y|X': ['Z', 3], 'Y|Y': ['I', 0], 'Y|Z': ['X', 1],
    'Z|I': ['Z', 0], 'Z|X': ['Y', 1], 'Z|Y': ['X', 3], 'Z|Z': ['I', 0]
});

function otherPlayer(player) {
    return player === 'black' ? 'white' : 'black';
}

function normalizePhase(phase = 0) {
    return ((Math.floor(Number(phase) || 0) % 4) + 4) % 4;
}

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function canonicalCoefficient(sign = 1, phase = 0) {
    const exponent = normalizePhase(phase + (normalizePauliSign(sign) < 0 ? 2 : 0));
    return ['+', '+i', '-', '-i'][exponent];
}

function physicalLabel(stone) {
    if (!stone) return 'I';
    if (stone.isAncilla) {
        const labels = { Z0: 'A_Z0', Z1: 'A_Z1', Xplus: 'A_X+', Xminus: 'A_X-', magic: 'A_magic' };
        return labels[stone.ancillaBasis] || 'A';
    }
    return `${canonicalCoefficient(stone.pauliSign, stone.phase)}${stone.pauliLabel}`;
}

function syncPhysicalAliases(stone) {
    if (!stone) return stone;
    stone.pauliSign = normalizePauliSign(stone.pauliSign ?? stone.sign);
    stone.sign = stone.pauliSign;
    stone.phase = normalizePhase(stone.phase);
    stone.color = stone.pauliSign > 0 ? 'black' : 'white';
    stone.owner = stone.color;
    return stone;
}

function multiplyPaulis(first, second) {
    const left = normalizePauliLabel(first.pauliLabel, 'I');
    const right = normalizePauliLabel(second.pauliLabel, 'I');
    const [pauliLabel, phaseDelta] = PAULI_MULTIPLICATION[`${left}|${right}`] || ['I', 0];
    return {
        pauliLabel,
        pauliSign: normalizePauliSign((first.pauliSign ?? 1) * (second.pauliSign ?? 1)),
        phase: normalizePhase((first.phase ?? 0) + (second.phase ?? 0) + phaseDelta)
    };
}

function transformPhysicalPauli(stone, gate = 'identity') {
    const normalizedGate = String(gate || 'identity');
    if (normalizedGate === 'Sdg') {
        const label = normalizePauliLabel(stone.pauliLabel, 'I');
        return {
            ...stone,
            pauliLabel: label === 'X' ? 'Y' : label === 'Y' ? 'X' : label,
            pauliSign: normalizePauliSign(stone.pauliSign),
            phase: normalizePhase(stone.phase + (label === 'X' ? 2 : 0))
        };
    }
    if (normalizedGate === 'Z') {
        const label = normalizePauliLabel(stone.pauliLabel, 'I');
        return {
            ...stone,
            pauliSign: normalizePauliSign(stone.pauliSign),
            phase: normalizePhase(stone.phase + (['X', 'Y'].includes(label) ? 2 : 0))
        };
    }
    const transformed = transformSignedPauli(stone, normalizedGate, true);
    const signChanged = transformed.pauliSign !== normalizePauliSign(stone.pauliSign);
    return {
        ...stone,
        pauliLabel: transformed.pauliLabel,
        pauliSign: normalizePauliSign(stone.pauliSign),
        phase: normalizePhase(stone.phase + (signChanged ? 2 : 0))
    };
}

function ancillaState(basis) {
    const states = {
        Z0: { pauliLabel: 'Z', pauliSign: 1, phase: 0 },
        Z1: { pauliLabel: 'Z', pauliSign: -1, phase: 0 },
        Xplus: { pauliLabel: 'X', pauliSign: 1, phase: 0 },
        Xminus: { pauliLabel: 'X', pauliSign: -1, phase: 0 },
        magic: { pauliLabel: 'Y', pauliSign: 1, phase: 1, nonStabilizerApprox: true }
    };
    return {
        ...(states[basis] || states.Z0),
        color: (states[basis] || states.Z0).pauliSign > 0 ? 'black' : 'white',
        isAncilla: true,
        ancillaBasis: ANCILLA_BASES.includes(basis) ? basis : 'Z0'
    };
}

export class PhysicalCliffordReversiGame extends CliffordReversiGame {
    reset(options = {}) {
        super.reset({ ...options, physicalProblem: null, physicalProblemId: null, problemId: null });
        this.mode = PHYSICAL_CLIFFORD_REVERSI_MODE;
        this.physicalConfig = {
            physicalInitialState: PHYSICAL_INITIAL_STATES.includes(options.physicalInitialState)
                ? options.physicalInitialState
                : 'stabilizer_vacuum',
            sparseErrorDensity: Math.max(0.01, Math.min(0.5, Number(options.sparseErrorDensity) || 0.08)),
            pairedDefectCount: Math.max(1, Math.min(16, Math.floor(Number(options.pairedDefectCount) || 3)))
        };
        this.board.clear();
        this.history = [];
        this.positionHistory = [];
        this.physicsHistory = [];
        this.circuitHistory = [];
        this.measurementErrors = 0;
        this.nonCliffordResourcesUsed = false;
        this.stabilizerChecks = new Map(this.topology.vertices().map((coord) => [coordKey(coord), 1]));
        this.moveNumber = 0;
        this.currentPlayer = options.currentPlayer || 'black';
        this.setupPhysicalInitialState(this.physicalConfig.physicalInitialState);
        this.recordPosition('physical_setup');
        this.appendPhysicsHistory({
            player: 'system',
            action: 'initial_state',
            affectedVertices: [...this.board.keys()].map((key) => key.split(',').map(Number)),
            metadata: { physicalInitialState: this.physicalConfig.physicalInitialState }
        });
    }

    setStone(coord, stone) {
        const owner = stone.owner || stone.color;
        const sign = normalizePauliSign(
            stone.sign
            ?? stone.pauliSign
            ?? (owner === 'white' ? -1 : 1)
        );
        const stored = super.setStone(coord, {
            ...stone,
            color: sign > 0 ? 'black' : 'white',
            pauliSign: sign
        });
        const normalized = this.topology.normalize(coord);
        if (stored && normalized) syncPhysicalAliases(this.board.get(coordKey(normalized)));
        return stored;
    }

    getStone(coord) {
        const stone = super.getStone(coord);
        return stone ? syncPhysicalAliases(stone) : null;
    }

    setupPhysicalInitialState(initialState) {
        if (initialState === 'sparse_pauli_errors') this.setupSparsePauliErrors();
        if (initialState === 'paired_defects') this.setupPairedDefects();
        if (initialState === 'domain_wall_seed') this.setupDomainWallSeed();
        if (initialState === 'prepared_clifford_circuit') this.setupPreparedCircuit();
    }

    activeSliceVertices() {
        const centers = this.topology.sizes.map((size) => Math.floor(size / 2));
        return this.topology.vertices().filter((coord) =>
            coord.slice(2).every((value, axis) => value === centers[axis + 2]));
    }

    setupSparsePauliErrors() {
        const labels = ['X', 'Y', 'Z'];
        const candidates = this.activeSliceVertices();
        for (const coord of candidates) {
            if (this.probability.rng.next() >= this.physicalConfig.sparseErrorDensity) continue;
            const pauliLabel = labels[Math.floor(this.probability.rng.next() * labels.length)];
            const pauliSign = this.probability.rng.next() < 0.5 ? 1 : -1;
            this.setStone(coord, {
                color: pauliSign > 0 ? 'black' : 'white',
                pauliLabel,
                pauliSign,
                phase: 0,
                lastUpdate: { action: 'sparse_error_seed', tick: 0 }
            });
        }
        if (this.board.size === 0 && candidates.length) {
            this.setStone(candidates[Math.floor(candidates.length / 2)], {
                color: 'black',
                pauliLabel: 'X',
                pauliSign: 1,
                phase: 0,
                lastUpdate: { action: 'sparse_error_seed', tick: 0 }
            });
        }
    }

    setupPairedDefects() {
        const used = new Set();
        const labels = ['X', 'Y', 'Z'];
        const candidates = this.activeSliceVertices();
        let created = 0;
        for (const coord of candidates) {
            if (created >= this.physicalConfig.pairedDefectCount) break;
            const key = coordKey(coord);
            if (used.has(key)) continue;
            const neighbor = this.topology.neighbors(coord).find((entry) => !used.has(coordKey(entry)));
            if (!neighbor) continue;
            const label = labels[created % labels.length];
            this.setStone(coord, {
                color: 'black',
                pauliLabel: label,
                pauliSign: 1,
                phase: 0,
                lastUpdate: { action: 'paired_defect_seed', pair: created, tick: 0 }
            });
            this.setStone(neighbor, {
                color: 'white',
                pauliLabel: label,
                pauliSign: -1,
                phase: 0,
                lastUpdate: { action: 'paired_defect_seed', pair: created, tick: 0 }
            });
            used.add(key);
            used.add(coordKey(neighbor));
            created++;
        }
    }

    setupDomainWallSeed() {
        const middle = Math.floor(this.topology.sizes[0] / 2);
        for (const coord of this.activeSliceVertices()) {
            if (coord[0] === middle) continue;
            const positive = coord[0] < middle;
            this.setStone(coord, {
                color: positive ? 'black' : 'white',
                pauliLabel: coord[1] % 2 ? 'Z' : 'X',
                pauliSign: positive ? 1 : -1,
                phase: 0,
                lastUpdate: { action: 'domain_wall_seed', tick: 0 }
            });
        }
    }

    setupPreparedCircuit() {
        const vertices = this.activeSliceVertices();
        const centerIndex = Math.floor(vertices.length / 2);
        const selected = [0, 1, 2, 3].map((offset) => vertices[(centerIndex + offset) % vertices.length]).filter(Boolean);
        if (selected[0]) this.prepareAncilla(selected[0], 'Z0', { player: 'black', consumeTurn: false, record: false });
        if (selected[1]) this.prepareAncilla(selected[1], 'Xplus', { player: 'white', consumeTurn: false, record: false });
        if (selected[2]) this.prepareAncilla(selected[2], 'magic', { player: 'black', consumeTurn: false, record: false });
        if (selected[3]) this.setStone(selected[3], {
            color: 'white',
            pauliLabel: 'Y',
            pauliSign: -1,
            phase: 1,
            lastUpdate: { action: 'prepared_error', tick: 0 }
        });
        if (selected[0]) this.applySingleQubitGate(selected[0], 'H', { player: 'system', consumeTurn: false, record: false });
        if (selected[1]) this.applySingleQubitGate(selected[1], 'S', { player: 'system', consumeTurn: false, record: false });
        if (selected[0] && selected[1]) {
            this.entangleAncilla(selected[0], selected[1], 'CNOT', { player: 'system', consumeTurn: false, record: false });
        }
        if (selected[1] && selected[2]) {
            this.entangleAncilla(selected[1], selected[2], 'CZ', { player: 'system', consumeTurn: false, record: false });
        }
        if (selected[0]) this.measureAncilla(selected[0], 'Z', { player: 'system', consumeTurn: false, record: false });
        this.circuitHistory.push({
            tick: 0,
            gates: ['prepare Z0', 'prepare X+', 'prepare magic', 'H', 'S', 'CNOT', 'CZ', 'measure Z']
        });
    }

    previewMove(coord, player = this.currentPlayer, transform = this.defaultFlipTransform) {
        const base = super.previewMove(coord, player, transform);
        if (!base.legal) return base;
        const flips = base.flips.map((flip) => {
            let after = {
                ...flip.before,
                color: player,
                pauliSign: -normalizePauliSign(flip.before.pauliSign),
                phase: normalizePhase(flip.before.phase),
                lastUpdate: { action: 'reversi_flip', tick: this.moveNumber + 1 }
            };
            after = transformPhysicalPauli(after, transform);
            for (const edge of flip.transportEdges || []) {
                after = transformPhysicalPauli(after, edge.transport || 'identity');
            }
            return { ...flip, after: syncPhysicalAliases(after) };
        });
        return { ...base, flips };
    }

    place(coord, options = {}) {
        const result = super.place(coord, {
            ...options,
            pauliSign: options.pauliSign ?? (this.currentPlayer === 'black' ? 1 : -1)
        });
        if (!result.ok) return result;
        const key = coordKey(result.event.coord);
        const placed = this.board.get(key);
        if (placed) {
            placed.phase = normalizePhase(options.phase);
            placed.pauliSign = normalizePauliSign(options.pauliSign ?? (result.event.player === 'black' ? 1 : -1));
            placed.lastUpdate = { action: 'reversi_place', tick: this.moveNumber };
            syncPhysicalAliases(placed);
        }
        for (const flip of result.event.flipped) {
            syncPhysicalAliases(this.board.get(coordKey(flip.coord)));
        }
        result.event.mode = this.mode;
        result.event.phase = placed?.phase || 0;
        this.appendPhysicsHistory({
            player: result.event.player,
            action: 'reversi_place',
            affectedVertices: [result.event.coord, ...result.event.flipped.map((flip) => flip.coord)],
            gates: [result.event.transform],
            phaseChanges: result.event.flipped.map((flip) => ({
                coord: flip.coord,
                before: flip.before.phase || 0,
                after: flip.after.phase || 0
            })),
            metadata: { eventNumber: result.event.number }
        });
        return result;
    }

    pass(player = this.currentPlayer) {
        const result = super.pass(player);
        result.event.mode = this.mode;
        this.appendPhysicsHistory({
            player,
            action: 'pass',
            metadata: { eventNumber: result.event.number }
        });
        return result;
    }

    finishPhysicalAction({
        player = this.currentPlayer,
        action,
        affectedVertices = [],
        gates = [],
        phaseChanges = [],
        ancillaOperations = [],
        measurements = [],
        metadata = {},
        consumeTurn = true,
        record = true
    }) {
        if (consumeTurn) {
            this.moveNumber++;
            this.currentPlayer = otherPlayer(player);
        }
        const event = {
            mode: this.mode,
            type: action,
            number: this.moveNumber,
            player,
            affectedVertices: affectedVertices.map((coord) => [...coord]),
            gates: [...gates],
            phaseChanges: cloneValue(phaseChanges),
            ancillaOperations: cloneValue(ancillaOperations),
            measurements: cloneValue(measurements),
            metadata: cloneValue(metadata)
        };
        if (consumeTurn) {
            event.noise = this.maybeApplyNoise('after_move', player);
            event.time = this.maybeApplyTime('after_move', player);
        }
        if (record) {
            this.history.unshift(event);
            this.appendPhysicsHistory({
                player,
                action,
                affectedVertices,
                gates,
                phaseChanges,
                ancillaOperations,
                measurements,
                metadata
            });
            this.recordPosition(action);
        }
        return { ok: true, event };
    }

    prepareAncilla(vertex, basis = 'Z0', options = {}) {
        const normalized = this.topology.normalize(vertex);
        if (!normalized) return { ok: false, error: 'Choose a valid board vertex.' };
        if (!this.isEmpty(normalized)) return { ok: false, error: 'Ancillas require an empty vertex.' };
        const player = options.player || this.currentPlayer;
        const state = ancillaState(basis);
        state.lastUpdate = { action: 'prepare_ancilla', tick: this.moveNumber + (options.consumeTurn === false ? 0 : 1) };
        this.setStone(normalized, state);
        if (basis === 'magic') this.nonCliffordResourcesUsed = true;
        return this.finishPhysicalAction({
            player,
            action: 'prepare_ancilla',
            affectedVertices: [normalized],
            ancillaOperations: [{ operation: 'prepare', basis }],
            metadata: { basis, nonStabilizerApprox: basis === 'magic' },
            consumeTurn: options.consumeTurn !== false,
            record: options.record !== false
        });
    }

    applySingleQubitGate(vertex, gate, options = {}) {
        const normalized = this.topology.normalize(vertex);
        const key = normalized ? coordKey(normalized) : '';
        const stone = key ? this.board.get(key) : null;
        if (!stone) return { ok: false, error: 'Choose an occupied physical site.' };
        const before = { ...stone };
        const after = transformPhysicalPauli(stone, gate);
        after.lastUpdate = { action: 'single_qubit_gate', gate, tick: this.moveNumber + (options.consumeTurn === false ? 0 : 1) };
        this.board.set(key, syncPhysicalAliases(after));
        return this.finishPhysicalAction({
            player: options.player || this.currentPlayer,
            action: 'single_qubit_gate',
            affectedVertices: [normalized],
            gates: [gate],
            phaseChanges: [{ coord: normalized, before: before.phase, after: after.phase }],
            metadata: { before: physicalLabel(before), after: physicalLabel(after) },
            consumeTurn: options.consumeTurn !== false,
            record: options.record !== false
        });
    }

    phaseAction(vertex, gate = 'S', options = {}) {
        if (gate === 'phase_kick') {
            const normalized = this.topology.normalize(vertex);
            const key = normalized ? coordKey(normalized) : '';
            const stone = key ? this.board.get(key) : null;
            if (!stone) return { ok: false, error: 'Choose an occupied physical site.' };
            const theta = Number(options.theta);
            const quarterTurns = Number.isFinite(theta) ? theta / (Math.PI / 2) : 0;
            const beforePhase = stone.phase;
            stone.phase = normalizePhase(stone.phase + Math.round(quarterTurns));
            stone.nonStabilizerApprox = Math.abs(quarterTurns - Math.round(quarterTurns)) > 1e-9;
            stone.lastUpdate = { action: 'phase_kick', theta, tick: this.moveNumber + 1 };
            if (stone.nonStabilizerApprox) this.nonCliffordResourcesUsed = true;
            return this.finishPhysicalAction({
                player: options.player || this.currentPlayer,
                action: 'phase_kick',
                affectedVertices: [normalized],
                gates: [`phase_kick(${theta})`],
                phaseChanges: [{ coord: normalized, before: beforePhase, after: stone.phase }],
                metadata: { theta, nonStabilizerApprox: stone.nonStabilizerApprox }
            });
        }
        return this.applySingleQubitGate(vertex, gate, options);
    }

    entangleAncilla(controlVertex, targetVertex, gate = 'CNOT', options = {}) {
        const control = this.topology.normalize(controlVertex);
        const target = this.topology.normalize(targetVertex);
        const controlStone = control ? this.board.get(coordKey(control)) : null;
        const targetStone = target ? this.board.get(coordKey(target)) : null;
        if (!controlStone || !targetStone) return { ok: false, error: 'Control and target must both be occupied.' };
        if (!controlStone.isAncilla && !targetStone.isAncilla) {
            return { ok: false, error: 'At least one endpoint must be an ancilla.' };
        }
        if (!['CNOT', 'CZ'].includes(gate)) return { ok: false, error: 'Choose CNOT or CZ.' };
        const beforeControl = { ...controlStone };
        const beforeTarget = { ...targetStone };
        let controlFactor = { pauliLabel: 'I', pauliSign: 1, phase: 0 };
        let targetFactor = { pauliLabel: 'I', pauliSign: 1, phase: 0 };
        if (gate === 'CNOT') {
            if (['Z', 'Y'].includes(targetStone.pauliLabel)) controlFactor.pauliLabel = 'Z';
            if (['X', 'Y'].includes(controlStone.pauliLabel)) targetFactor.pauliLabel = 'X';
        } else {
            if (['X', 'Y'].includes(targetStone.pauliLabel)) controlFactor.pauliLabel = 'Z';
            if (['X', 'Y'].includes(controlStone.pauliLabel)) targetFactor.pauliLabel = 'Z';
        }
        Object.assign(controlStone, multiplyPaulis(controlStone, controlFactor), {
            lastUpdate: { action: 'entangle_ancilla', gate, role: 'control', tick: this.moveNumber + 1 }
        });
        Object.assign(targetStone, multiplyPaulis(targetStone, targetFactor), {
            lastUpdate: { action: 'entangle_ancilla', gate, role: 'target', tick: this.moveNumber + 1 }
        });
        syncPhysicalAliases(controlStone);
        syncPhysicalAliases(targetStone);
        return this.finishPhysicalAction({
            player: options.player || this.currentPlayer,
            action: 'entangle_ancilla',
            affectedVertices: [control, target],
            gates: [gate],
            phaseChanges: [
                { coord: control, before: beforeControl.phase, after: controlStone.phase },
                { coord: target, before: beforeTarget.phase, after: targetStone.phase }
            ],
            ancillaOperations: [{ operation: 'entangle', gate, control, target }],
            consumeTurn: options.consumeTurn !== false,
            record: options.record !== false
        });
    }

    measurementTargets(vertex, type = 'local_pauli') {
        const normalized = this.topology.normalize(vertex);
        if (!normalized) return [];
        if (type === 'connected_domain_parity') return this.connectedGroup(normalized).map((entry) => entry.coord);
        if (type === 'bracketed_line_parity') {
            const preview = this.previewMove(normalized, this.currentPlayer, this.defaultFlipTransform);
            return [...new Map(preview.flips.map((flip) => [flip.key, flip.coord])).values()];
        }
        if (type === 'stabilizer_check') {
            return [normalized, ...this.topology.neighbors(normalized)]
                .filter((coord) => this.board.has(coordKey(coord)));
        }
        return this.board.has(coordKey(normalized)) ? [normalized] : [];
    }

    measurePhysical(vertex, type = 'local_pauli', basis = 'Z', options = {}) {
        const targets = this.measurementTargets(vertex, type);
        if (!targets.length) return { ok: false, error: 'Choose a physical site or measurable domain.' };
        const player = options.player || this.currentPlayer;
        const normalizedBasis = normalizePauliLabel(basis, 'Z');
        const entities = targets.map((coord) => ({
            key: coordKey(coord),
            entity: this.board.get(coordKey(coord))
        })).filter((entry) => entry.entity);
        const tick = this.probability.nextTick();
        let trueEigenvalue = 1;
        let uncertainCount = 0;
        for (const { entity } of entities) {
            const label = normalizePauliLabel(entity.pauliLabel, 'I');
            const coefficient = normalizePhase(entity.phase + (normalizePauliSign(entity.pauliSign) < 0 ? 2 : 0));
            if (label === 'I') continue;
            if (label === normalizedBasis && coefficient % 2 === 0) {
                trueEigenvalue *= coefficient === 0 ? 1 : -1;
                continue;
            }
            uncertainCount++;
        }
        let sampleEvent = null;
        if (uncertainCount) {
            sampleEvent = this.probability.roll({
                tick,
                player,
                type: `measurement_sample:${type}:${normalizedBasis}`,
                affectedVertices: targets,
                affectedTokens: entities.map((entry) => entry.key),
                probability: 0.5
            });
            trueEigenvalue *= sampleEvent.outcome.triggered ? -1 : 1;
        }
        const trueResult = trueEigenvalue > 0 ? 'even' : 'odd';
        const errorEvent = this.probability.roll({
            tick,
            player,
            type: `measurement_error:${type}:${normalizedBasis}`,
            affectedVertices: targets,
            affectedTokens: entities.map((entry) => entry.key),
            probability: this.probability.config.measurementErrorRate
        });
        const reported = errorEvent.outcome.triggered
            ? trueResult === 'even' ? 'odd' : 'even'
            : trueResult;
        const measurement = {
            tick,
            player,
            type,
            basis: normalizedBasis,
            target: targets.map((coord) => [...coord]),
            labels: entities.map(({ entity }) => entity.pauliLabel),
            uncertainCount,
            sample: sampleEvent?.sample ?? null,
            trueEigenvalue,
            trueResult,
            reported,
            error: errorEvent.outcome.triggered
        };
        if (measurement.error) this.measurementErrors++;
        const collapseSign = measurement.trueResult === 'even' ? 1 : -1;
        const first = entities[0]?.entity;
        if (first) {
            first.pauliLabel = normalizedBasis;
            first.pauliSign = collapseSign;
            first.phase = 0;
            first.lastUpdate = { action: 'measurement_collapse', type, basis, tick: this.moveNumber + 1 };
            syncPhysicalAliases(first);
        }
        for (const { entity } of entities) {
            entity.revealed = true;
            entity.measurementHistory = [...(entity.measurementHistory || []), measurement];
        }
        this.probability.markMeasuredVertices(targets);
        this.probability.measurements.push(measurement);
        return this.finishPhysicalAction({
            player,
            action: 'measurement',
            affectedVertices: targets,
            measurements: [measurement],
            metadata: { type, basis, collapseSign },
            consumeTurn: options.consumeTurn !== false,
            record: options.record !== false
        });
    }

    measureAncilla(vertex, basis = 'Z', options = {}) {
        const normalized = this.topology.normalize(vertex);
        const stone = normalized ? this.board.get(coordKey(normalized)) : null;
        if (!stone?.isAncilla) return { ok: false, error: 'Choose an ancilla to measure.' };
        return this.measurePhysical(normalized, 'local_pauli', basis, options);
    }

    discardAncilla(vertex, options = {}) {
        const normalized = this.topology.normalize(vertex);
        const key = normalized ? coordKey(normalized) : '';
        const stone = key ? this.board.get(key) : null;
        if (!stone?.isAncilla) return { ok: false, error: 'Choose an ancilla to discard.' };
        this.board.delete(key);
        return this.finishPhysicalAction({
            player: options.player || this.currentPlayer,
            action: 'discard_ancilla',
            affectedVertices: [normalized],
            ancillaOperations: [{ operation: 'discard', basis: stone.ancillaBasis }],
            consumeTurn: options.consumeTurn !== false,
            record: options.record !== false
        });
    }

    computePhysicalObservables() {
        const counts = { I: 0, X: 0, Y: 0, Z: 0 };
        const signs = { positive: 0, negative: 0 };
        const phases = { 0: 0, 1: 0, 2: 0, 3: 0 };
        let ancillas = 0;
        let parityX = 0;
        let parityZ = 0;
        let paritySign = 0;
        let parityPhase = 0;
        for (const coord of this.topology.vertices()) {
            const stone = this.board.get(coordKey(coord));
            const label = stone?.pauliLabel || 'I';
            counts[label] = (counts[label] || 0) + 1;
            if (!stone) continue;
            const sign = normalizePauliSign(stone.pauliSign);
            signs[sign > 0 ? 'positive' : 'negative']++;
            phases[normalizePhase(stone.phase)]++;
            if (stone.isAncilla) ancillas++;
            if (['X', 'Y'].includes(label)) parityX ^= 1;
            if (['Z', 'Y'].includes(label)) parityZ ^= 1;
            if (sign < 0) paritySign ^= 1;
            parityPhase = normalizePhase(parityPhase + normalizePhase(stone.phase));
        }

        let domainWallLength = 0;
        let commutationConflictCount = 0;
        let stabilizerViolations = 0;
        const seenEdges = new Set();
        const winding = { x: 0, y: 0, z: 0, w: 0 };
        for (const coord of this.topology.vertices()) {
            const key = coordKey(coord);
            const stone = this.board.get(key);
            let checkSign = stone ? normalizePauliSign(stone.pauliSign) : 1;
            for (const direction of this.topology.directions()) {
                const step = this.topology.step(coord, direction);
                if (!step) continue;
                const neighborKey = coordKey(step.coord);
                const edgeKey = [key, neighborKey].sort().join('|');
                const neighbor = this.board.get(neighborKey);
                if (neighbor) checkSign *= normalizePauliSign(neighbor.pauliSign);
                if (seenEdges.has(edgeKey)) continue;
                seenEdges.add(edgeKey);
                if (stone && neighbor && normalizePauliSign(stone.pauliSign) !== normalizePauliSign(neighbor.pauliSign)) {
                    domainWallLength++;
                    const crossing = this.topology.homologyCycleCrossing(step.edge);
                    for (const axis of Object.keys(winding)) winding[axis] += Number(crossing?.[axis] || 0);
                }
                if (stone && neighbor && anticommute(stone.pauliLabel, neighbor.pauliLabel)) {
                    commutationConflictCount++;
                }
            }
            if (checkSign !== (this.stabilizerChecks.get(key) || 1)) stabilizerViolations++;
        }
        const logicalSector = Object.fromEntries(
            Object.entries(winding).map(([axis, value]) => [axis, ((value % 2) + 2) % 2])
        );
        return {
            pauliCounts: counts,
            signDistribution: signs,
            phaseDistribution: phases,
            numberOfAncillas: ancillas,
            domainWallLength,
            stabilizerViolations,
            globalPauliParity: {
                x: parityX,
                z: parityZ,
                sign: paritySign ? -1 : 1,
                phase: parityPhase,
                label: parityX ? (parityZ ? 'Y' : 'X') : (parityZ ? 'Z' : 'I')
            },
            commutationConflictCount,
            logicalSector,
            nonCliffordResourcesUsed: this.nonCliffordResourcesUsed
        };
    }

    appendPhysicsHistory({
        player,
        action,
        affectedVertices = [],
        gates = [],
        phaseChanges = [],
        ancillaOperations = [],
        measurements = [],
        metadata = {}
    }) {
        const entry = {
            tick: this.moveNumber,
            player,
            action,
            affectedVertices: affectedVertices.map((coord) => [...coord]),
            gates: [...gates],
            phaseChanges: cloneValue(phaseChanges),
            ancillaOperations: cloneValue(ancillaOperations),
            measurements: cloneValue(measurements),
            metadata: cloneValue(metadata),
            observables: this.computePhysicalObservables()
        };
        this.physicsHistory.push(entry);
        return entry;
    }

    computePhysicalAnswer() {
        const observables = this.computePhysicalObservables();
        const vacuumRecovered = observables.pauliCounts.I === this.topology.vertices().length
            && observables.numberOfAncillas === 0
            && observables.stabilizerViolations === 0;
        return {
            finalSector: observables.logicalSector,
            stabilizerVacuumRecovered: vacuumRecovered,
            finalPauliDistribution: observables.pauliCounts,
            finalPhaseDistribution: observables.phaseDistribution,
            finalSignDistribution: observables.signDistribution,
            domainWallLength: observables.domainWallLength,
            measurementErrors: this.measurementErrors,
            nonCliffordResourcesUsed: observables.nonCliffordResourcesUsed,
            summary: `Final sector ${JSON.stringify(observables.logicalSector)}; ${vacuumRecovered ? 'stabilizer vacuum recovered' : 'stabilizer vacuum not recovered'}; domain-wall length ${observables.domainWallLength}; ${this.measurementErrors} measurement error${this.measurementErrors === 1 ? '' : 's'}; non-Clifford resources ${observables.nonCliffordResourcesUsed ? 'used' : 'not used'}.`
        };
    }

    physicalLabel(stone) {
        return physicalLabel(stone);
    }

    exportState() {
        const base = super.exportState();
        return {
            ...base,
            board: base.board.map((stone) => ({
                ...stone,
                owner: stone.color,
                sign: normalizePauliSign(stone.pauliSign)
            })),
            mode: this.mode,
            physicalConfig: cloneValue(this.physicalConfig),
            stabilizerChecks: [...this.stabilizerChecks.entries()].map(([key, sign]) => ({
                key,
                coord: key.split(',').map(Number),
                sign
            })),
            circuitHistory: cloneValue(this.circuitHistory),
            physicsHistory: cloneValue(this.physicsHistory),
            physicalObservables: this.computePhysicalObservables(),
            physicalAnswer: this.computePhysicalAnswer()
        };
    }
}

export function createPhysicalCliffordReversi(options = {}) {
    return new PhysicalCliffordReversiGame(options);
}
