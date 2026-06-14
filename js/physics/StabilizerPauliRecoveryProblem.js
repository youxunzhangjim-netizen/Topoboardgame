import { SeededRandom } from '../probability/SeededRandom.js';

export const STABILIZER_PAULI_RECOVERY_ID = 'stabilizer_pauli_recovery';

export const STABILIZER_PAULI_RECOVERY_COMPATIBLE_MODES = Object.freeze([
    'physical_clifford_reversi'
]);

const DEFAULT_CONFIG = Object.freeze({
    id: STABILIZER_PAULI_RECOVERY_ID,
    errorDensity: 0.08,
    measurementErrorRate: 0.02,
    enableTopologyLogicalChecks: true,
    enableAncillaActions: true,
    enableNonCliffordPhaseKick: false,
    maxTurns: 100
});

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function boundedNumber(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function boundedInteger(value, fallback, min, max) {
    return Math.floor(boundedNumber(value, fallback, min, max));
}

export function normalizeStabilizerPauliRecoveryConfig(config = {}) {
    return {
        ...DEFAULT_CONFIG,
        ...config,
        id: STABILIZER_PAULI_RECOVERY_ID,
        errorDensity: boundedNumber(config.errorDensity, DEFAULT_CONFIG.errorDensity, 0, 1),
        measurementErrorRate: boundedNumber(
            config.measurementErrorRate,
            DEFAULT_CONFIG.measurementErrorRate,
            0,
            1
        ),
        enableTopologyLogicalChecks: Boolean(
            config.enableTopologyLogicalChecks ?? DEFAULT_CONFIG.enableTopologyLogicalChecks
        ),
        enableAncillaActions: Boolean(config.enableAncillaActions ?? DEFAULT_CONFIG.enableAncillaActions),
        enableNonCliffordPhaseKick: Boolean(
            config.enableNonCliffordPhaseKick ?? DEFAULT_CONFIG.enableNonCliffordPhaseKick
        ),
        maxTurns: boundedInteger(config.maxTurns, DEFAULT_CONFIG.maxTurns, 1, 10000)
    };
}

function observablesFor(game) {
    return game?.computePhysicalObservables?.() || {};
}

function isVacuum(observables) {
    return Boolean(observables.vacuumRecovered
        ?? (
            observables.pauliCounts?.I > 0
            && Object.entries(observables.pauliCounts || {})
                .filter(([label]) => label !== 'I')
                .every(([, count]) => count === 0)
            && (observables.numberOfAncillas || 0) === 0
            && (observables.syndromeWeight || 0) === 0
        ));
}

function historyObservables(game, initialObservables) {
    const history = (game?.physicsHistory || []).map((entry) => ({
        tick: entry.tick,
        player: entry.player,
        action: entry.action,
        affectedVertices: cloneValue(entry.affectedVertices || []),
        gates: cloneValue(entry.gates || []),
        phaseChanges: cloneValue(entry.phaseChanges || []),
        ancillaOperations: cloneValue(entry.ancillaOperations || []),
        measurements: cloneValue(entry.measurements || []),
        metadata: cloneValue(entry.metadata || {}),
        observables: cloneValue(entry.observables || {})
    }));
    if (!history.length) {
        history.push({
            tick: Number(game?.moveNumber || 0),
            player: 'system',
            action: 'initial_state',
            observables: cloneValue(initialObservables)
        });
    }
    return history;
}

function firstRecoveryTick(history, initialWasVacuum) {
    if (initialWasVacuum) return 0;
    const recovered = history.find((entry) => isVacuum(entry.observables));
    return recovered?.tick ?? null;
}

function ancillaUsageCount(history, circuitHistory = []) {
    const historyCount = history.reduce((count, entry) =>
        count + (entry.ancillaOperations || []).filter((operation) =>
            ['prepare', 'entangle', 'discard'].includes(operation.operation)).length, 0);
    const circuitCount = circuitHistory.reduce((count, entry) =>
        count + (entry.gates || []).filter((gate) =>
            /prepare|CNOT|CZ|discard/i.test(String(gate))).length, 0);
    return historyCount + circuitCount;
}

export function computeStabilizerRecoveryAnswer({
    initialObservables = {},
    finalObservables = {},
    physicsHistory = [],
    measurementHistory = [],
    circuitHistory = []
} = {}) {
    const stabilizerVacuumRecovered = isVacuum(initialObservables)
        || physicsHistory.some((entry) => isVacuum(entry.observables))
        || isVacuum(finalObservables);
    const recoveryTime = firstRecoveryTick(physicsHistory, isVacuum(initialObservables));
    const logicalErrorOccurred = Boolean(finalObservables.logicalErrorOccurred);
    const measurementErrorCount = measurementHistory.filter((measurement) => measurement.error).length;
    const answer = {
        stabilizerVacuumRecovered,
        recoveryTime,
        finalSyndromeWeight: finalObservables.syndromeWeight || 0,
        finalLogicalSector: cloneValue(finalObservables.logicalSector || {}),
        logicalErrorOccurred,
        measurementErrorCount,
        ancillaUsageCount: ancillaUsageCount(physicsHistory, circuitHistory),
        nonCliffordResourcesUsed: Boolean(finalObservables.nonCliffordResourcesUsed),
        finalPauliDistribution: cloneValue(finalObservables.pauliCounts || {}),
        finalPhaseDistribution: cloneValue(finalObservables.phaseDistribution || {}),
        circuitDepth: circuitHistory.length
    };
    answer.summary = `The stabilizer vacuum was ${stabilizerVacuumRecovered ? 'recovered' : 'not recovered'}`
        + `${recoveryTime == null ? '' : ` at tick ${recoveryTime}`}. Final syndrome weight ${answer.finalSyndromeWeight};`
        + ` logical sector ${JSON.stringify(answer.finalLogicalSector)};`
        + ` ${logicalErrorOccurred ? 'a logical error occurred' : 'no logical error was detected'};`
        + ` ${measurementErrorCount} measurement error${measurementErrorCount === 1 ? '' : 's'} and`
        + ` ${answer.ancillaUsageCount} ancilla operation${answer.ancillaUsageCount === 1 ? '' : 's'}.`;
    return answer;
}

export class StabilizerPauliRecoveryProblem {
    constructor(config = {}) {
        this.id = STABILIZER_PAULI_RECOVERY_ID;
        this.config = normalizeStabilizerPauliRecoveryConfig(config);
        this.initialObservables = null;
        this.initialLogicalSector = null;
    }

    start(game) {
        this.initialObservables = cloneValue(observablesFor(game));
        this.initialLogicalSector = cloneValue(this.initialObservables.logicalSector || {});
        game.initialPhysicalLogicalSector = cloneValue(this.initialLogicalSector);
    }

    record() {
        return null;
    }

    export(game) {
        const finalObservables = cloneValue(observablesFor(game));
        const initialObservables = this.initialObservables || cloneValue(finalObservables);
        const physicsHistory = historyObservables(game, initialObservables);
        const measurementHistory = cloneValue(
            game?.probability?.measurements
            || physicsHistory.flatMap((entry) => entry.measurements || [])
        );
        const circuitHistory = cloneValue(game?.circuitHistory || []);
        const finalAnswer = computeStabilizerRecoveryAnswer({
            initialObservables,
            finalObservables,
            physicsHistory,
            measurementHistory,
            circuitHistory
        });
        return {
            problemId: this.id,
            config: cloneValue(this.config),
            compatibleGameModes: [...STABILIZER_PAULI_RECOVERY_COMPATIBLE_MODES],
            physicalQuestion: 'Can local Clifford/Reversi updates, ancilla operations, and measurements recover the stabilizer vacuum from Pauli errors, or does the state enter a nontrivial logical/topological sector?',
            initialObservables,
            physicsHistory,
            fullPhysicsHistory: physicsHistory,
            circuitHistory,
            measurementHistory,
            finalObservables,
            answer: finalAnswer,
            finalAnswer
        };
    }
}

function hashSeed(seed) {
    let state = 2166136261;
    for (const char of String(seed)) {
        state ^= char.charCodeAt(0);
        state = Math.imul(state, 16777619);
    }
    return state >>> 0;
}

function average(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

async function applyExperimentPolicy(game, policy, rng) {
    if (typeof policy === 'function') return Boolean(await policy({ game, rng }));
    const occupied = [...game.board.keys()].map((key) => key.split(',').map(Number));
    if (!occupied.length) return false;
    const target = occupied[rng.integer(occupied.length)];
    const stone = game.getStone(target);
    if (stone?.isAncilla && policy === 'ancilla_first') {
        return game.discardAncilla(target).ok;
    }
    const basis = ['X', 'Z'][rng.integer(2)];
    return game.measurePhysical(target, 'stabilizer_check', basis).ok;
}

export async function runStabilizerRecoveryExperiment({
    topologyList = ['flat', 'torus'],
    numTrials = 10,
    maxTurns = 100,
    errorDensity = 0.08,
    measurementErrorRate = 0.02,
    policy = 'measure_syndrome',
    seed = 'stabilizer-recovery-experiment'
} = {}) {
    const { PhysicalCliffordReversiGame } = await import('../localgames/PhysicalCliffordReversi.js');
    const trials = [];
    for (const topologySpec of topologyList) {
        const topology = typeof topologySpec === 'string'
            ? { topology: topologySpec, width: 8, height: 8 }
            : { ...topologySpec };
        for (let trial = 0; trial < numTrials; trial++) {
            const trialSeed = `${seed}:${JSON.stringify(topologySpec)}:${trial}`;
            const rng = new SeededRandom(hashSeed(trialSeed));
            const game = new PhysicalCliffordReversiGame({
                topology,
                physicalInitialState: 'sparse_pauli_errors',
                sparseErrorDensity: errorDensity,
                probability: { seed: trialSeed, measurementErrorRate },
                physicalProblem: {
                    id: STABILIZER_PAULI_RECOVERY_ID,
                    errorDensity,
                    measurementErrorRate,
                    maxTurns
                }
            });
            for (let turn = 0; turn < maxTurns; turn++) {
                if (game.computePhysicalObservables().vacuumRecovered) break;
                if (!await applyExperimentPolicy(game, policy, rng)) break;
            }
            const exported = game.physicalProblem.export(game);
            trials.push({
                topology: game.topology.name,
                trial,
                seed: trialSeed,
                ...exported
            });
        }
    }
    const byTopology = {};
    for (const trial of trials) {
        const bucket = byTopology[trial.topology] ||= [];
        bucket.push(trial);
    }
    const topologyRanking = Object.entries(byTopology)
        .map(([topology, entries]) => ({
            topology,
            recoveryRate: entries.filter((entry) => entry.finalAnswer.stabilizerVacuumRecovered).length / entries.length
        }))
        .sort((left, right) => right.recoveryRate - left.recoveryRate);
    const recovered = trials.filter((trial) => trial.finalAnswer.stabilizerVacuumRecovered);
    return {
        config: {
            topologyList: cloneValue(topologyList),
            numTrials,
            maxTurns,
            errorDensity,
            measurementErrorRate,
            policy: typeof policy === 'function' ? 'custom_function' : policy,
            seed
        },
        aggregate: {
            vacuumRecoveryRate: trials.length ? recovered.length / trials.length : 0,
            averageRecoveryTime: average(recovered.map((trial) => trial.finalAnswer.recoveryTime || 0)),
            logicalErrorRate: trials.length
                ? trials.filter((trial) => trial.finalAnswer.logicalErrorOccurred).length / trials.length
                : 0,
            averageFinalSyndromeWeight: average(
                trials.map((trial) => trial.finalAnswer.finalSyndromeWeight)
            ),
            measurementErrorCount: trials.reduce(
                (sum, trial) => sum + trial.finalAnswer.measurementErrorCount,
                0
            ),
            ancillaUsageCount: trials.reduce(
                (sum, trial) => sum + trial.finalAnswer.ancillaUsageCount,
                0
            ),
            nonCliffordUsageRate: trials.length
                ? trials.filter((trial) => trial.finalAnswer.nonCliffordResourcesUsed).length / trials.length
                : 0,
            topologyRanking
        },
        trials
    };
}

export function createStabilizerPauliRecoveryProblem(config = {}) {
    return new StabilizerPauliRecoveryProblem(config);
}
