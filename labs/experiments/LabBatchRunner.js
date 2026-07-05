import { CliffordReversiGame } from '../../js/localgames/CliffordReversi.js';
import { CliffordGoGame } from '../../js/localgames/CliffordGo.js';
import { CliffordJumpGame } from '../../js/localgames/CliffordJump.js';
import { PhysicalCliffordReversiGame } from '../../js/localgames/PhysicalCliffordReversi.js';
import { AnyonJumpGame } from '../../js/localgames/AnyonJump.js';
import { AnyonReversiGame } from '../../js/localgames/AnyonReversi.js';
import { VirasoroGoGame } from '../../js/localgames/VirasoroGo.js';
import { PhysicalVirasoroReversiGame } from '../../js/localgames/PhysicalVirasoroReversi.js';
import { IsingDomainGame } from '../../js/localgames/IsingDomainGame.js';
import { TwoPhaseCompetitionGame } from '../../js/localgames/TwoPhaseCompetitionGame.js';
import { PhysicalClusterGoGame } from '../../js/localgames/PhysicalClusterGo.js';
import { PhysicalJumpParticlesGame } from '../../js/localgames/PhysicalJumpParticlesGame.js';
import { SpinIceVertexGame } from '../../js/localgames/SpinIceVertexGame.js';
import { Z2GaugeLoopGame } from '../../js/localgames/Z2GaugeLoopGame.js';
import {
    labHash,
    modelById,
    stableStringify,
    topologyById,
    topologyDimensions
} from './LabExperimentRegistry.js';
import { seededRandom } from './LabBatchCore.js';
import { endTimer, recordMetric, startTimer } from '../../js/shared/PerformanceAudit.js';
import {
    cancelRunningLab,
    resumeLab,
    runLabStepSafely
} from '../../js/labs/SafeLabRunner.js';

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function choose(values, rng) {
    if (!values?.length) return null;
    return values[Math.floor(rng() * values.length)];
}

function firstNumber(...values) {
    for (const value of values) {
        const number = Number(value);
        if (Number.isFinite(number)) return number;
    }
    return 0;
}

function truthy(value) {
    return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

function createOptions(run) {
    const topology = topologyDimensions(run.topologyId);
    const parameters = run.parameters || {};
    const initial = run.initialConditionId;
    const seed = run.seed;
    const anyonModel = parameters.anyonModel === 'zn_phase' ? 'zn' : (parameters.anyonModel || 'toric_code');
    return {
        topology,
        currentPlayer: 'black',
        algebraSet: run.modelId === 'physical_clifford_reversi' ? 'physical' : 'standard',
        defaultFlipTransform: parameters.defaultFlipTransform || 'H',
        trackPhaseSigns: truthy(parameters.trackPhaseSigns),
        physicalInitialState: initial || 'stabilizer_vacuum',
        sparseErrorDensity: firstNumber(parameters.errorDensity, 0.08),
        cftInitialState: initial || 'two_point_insertions',
        cftReversiInitialState: initial || 'domain_wall_seed',
        cftModel: 'ising',
        primaryType: 'sigma',
        hiddenChannels: true,
        centralCharge: firstNumber(parameters.centralCharge, 0.5),
        maxMode: firstNumber(parameters.maxMode, 1),
        temperature: firstNumber(parameters.temperature, 0),
        domainWallThickness: firstNumber(parameters.wallThickness, 1),
        config: {
            anyonModel,
            phaseModel: parameters.anyonModel === 'zn_phase' ? 'zn_phase' : 'off',
            generalAnyonGrade: 5,
            setupMode: initial === 'excitation' ? 'excitation' : 'standard',
            excitationType: anyonModel === 'ising' ? 'sigma' : anyonModel === 'fibonacci' ? 'tau' : 'e',
            excitationEnergy: { black: 12, white: 12 },
            braidMemoryMode: parameters.braidMemoryMode || 'word_exact',
            braidCancellationMode: 'exact_inverse',
            requireReverseInverseOrder: true,
            captureRequiresUnbraid: true,
            entanglementRangeMode: Number(parameters.entanglementDistance) > 0 ? 'finite' : 'infinite',
            entanglementDistance: Math.max(1, Math.floor(firstNumber(parameters.entanglementDistance, 4))),
            anyonGaps: { '1': 0, e: 1, m: 1, psi: 2, sigma: 2, tau: 3 },
            excitationCosts: { '1': 0, e: 1, m: 1, psi: 2, sigma: 2, tau: 3 }
        },
        probability: {
            enabled: false,
            seed,
            noiseRate: firstNumber(parameters.noiseRate, 0),
            measurementErrorRate: firstNumber(parameters.measurementErrorP, 0),
            applyNoise: 'after_move',
            pauliNoiseType: 'depolarizing'
        },
        virasoro: {
            enabled: run.modelId.includes('virasoro'),
            centralCharge: firstNumber(parameters.centralCharge, 0.5),
            maxMode: firstNumber(parameters.maxMode, 1),
            removeUnstable: false
        },
        time: {
            floquetMode: 'off',
            updateMode: 'off',
            period: 4
        },
        ising: {
            J: firstNumber(parameters.couplingJ, parameters.J, 1),
            h: firstNumber(parameters.fieldH, parameters.h, 0),
            temperature: firstNumber(parameters.temperature, 0),
            metropolis: truthy(parameters.metropolis),
            domainFlipEnabled: true,
            bracketFlipEnabled: true,
            wallThickness: Math.max(1, Math.floor(firstNumber(parameters.wallThickness, 1))),
            initialState: initial || 'domain_wall_seed',
            seed
        },
        twoPhase: {
            interfaceCost: firstNumber(parameters.interfaceCost, 1),
            biasA: firstNumber(parameters.biasA, 0),
            biasB: firstNumber(parameters.biasB, 0),
            curvaturePenaltyEnabled: false,
            curvaturePenalty: 0.25,
            noiseEnabled: firstNumber(parameters.noiseRate, 0) > 0,
            noiseRate: firstNumber(parameters.noiseRate, 0.02),
            initialState: initial || 'phase_separated',
            seed
        },
        cluster: {
            initialState: initial || 'sparse_seeds',
            model: parameters.clusterModel || 'two_species_competition',
            diffusionNoiseEnabled: firstNumber(parameters.noiseRate, 0) > 0,
            noiseRate: firstNumber(parameters.noiseRate, 0.02),
            seed
        },
        spinIce: {
            violationEnergy: firstNumber(parameters.violationEnergy, 1),
            stringLength: Math.max(1, Math.floor(firstNumber(parameters.stringLength, 4))),
            initialState: initial || 'ice_rule_vacuum',
            seed
        },
        z2Gauge: {
            pathLength: Math.max(1, Math.floor(firstNumber(parameters.pathLength, 4))),
            edgeErrorRate: firstNumber(parameters.edgeErrorRate, 0.08),
            noisyEdgeFlip: firstNumber(parameters.noiseRate, 0) > 0,
            noiseRate: firstNumber(parameters.noiseRate, 0.02),
            decoderEnabled: true,
            initialState: initial || 'gauge_vacuum',
            seed
        },
        jumpParticles: {
            model: parameters.jumpParticleModel || 'charge_recombination',
            action: parameters.jumpParticleAction || 'auto',
            pathParityEnabled: true
        }
    };
}

export function createGameForRun(run) {
    const options = createOptions(run);
    switch (run.modelId) {
        case 'ising_domain_game':
            return new IsingDomainGame(options);
        case 'two_phase_competition_game':
            return new TwoPhaseCompetitionGame(options);
        case 'physical_cluster_go':
            return new PhysicalClusterGoGame(options);
        case 'physical_jump_particles':
            return new PhysicalJumpParticlesGame(options);
        case 'spin_ice_vertex_game':
            return new SpinIceVertexGame(options);
        case 'z2_gauge_loop_game':
            return new Z2GaugeLoopGame(options);
        case 'physical_clifford_reversi':
            return new PhysicalCliffordReversiGame(options);
        case 'physical_anyon_jump':
            return new AnyonJumpGame(options);
        case 'physical_virasoro_go':
            return new VirasoroGoGame(options);
        case 'physical_virasoro_reversi':
            return new PhysicalVirasoroReversiGame(options);
        case 'clifford_go':
            return new CliffordGoGame(options);
        case 'clifford_jump':
            return new CliffordJumpGame(options);
        case 'anyon_reversi':
            return new AnyonReversiGame(options);
        case 'anyon_jump':
            return new AnyonJumpGame(options);
        case 'clifford_reversi':
        default:
            return new CliffordReversiGame(options);
    }
}

function callWithFallback(methods) {
    for (const method of methods) {
        if (!method.available) continue;
        const result = method.run();
        if (result?.ok !== false) return result;
    }
    return { ok: false, error: 'No compatible existing action found.' };
}

function applyExistingStep(game, run, rng) {
    const modelId = run.modelId;
    if (modelId === 'physical_jump_particles') {
        const sources = game.legalMoves?.() || [];
        const source = choose(sources, rng);
        if (!source) return game.pass?.(game.currentPlayer) || { ok: false, error: 'No particle to move.' };
        const moves = game.legalMoves(source.coord, game.config?.action || 'auto') || [];
        const move = choose(moves, rng);
        if (!move) return game.pass?.(game.currentPlayer) || { ok: false, error: 'No particle move.' };
        if (move.action === 'recombine') return game.recombine(source.coord, move.coord);
        return game.moveParticle(source.coord, move.coord, { action: move.action });
    }
    if (modelId === 'physical_anyon_jump' || modelId === 'anyon_jump' || modelId === 'clifford_jump') {
        const actions = game.legalActions?.(game.currentPlayer) || [];
        const action = choose(actions, rng);
        if (!action) return game.pass?.(game.currentPlayer) || { ok: false, error: 'No anyon action.' };
        return game.applyAction(action);
    }

    const legalMoves = game.legalMoves?.(game.currentPlayer) || game.legalMoves?.() || [];
    const move = choose(legalMoves, rng);
    if (!move) return game.pass?.(game.currentPlayer) || { ok: false, error: 'No legal move.' };
    const coord = move.coord || move;

    if (modelId === 'ising_domain_game') {
        const action = run.parameters?.isingAction || 'place_or_flip';
        return callWithFallback([
            { available: action === 'flip_domain' && game.flipDomain, run: () => game.flipDomain(coord, game.currentPlayer) },
            { available: action === 'bracket_flip' && game.bracketFlip, run: () => game.bracketFlip(coord, game.currentPlayer) },
            { available: game.isEmpty?.(coord) && game.placeSpin, run: () => game.placeSpin(coord, game.currentPlayer) },
            { available: game.flipSpin, run: () => game.flipSpin(coord, game.currentPlayer) },
            { available: game.placeSpin, run: () => game.placeSpin(coord, game.currentPlayer) }
        ]);
    }
    if (modelId === 'two_phase_competition_game') {
        return callWithFallback([
            { available: move.action === 'grow_domain' && game.growDomain, run: () => game.growDomain(coord, game.currentPlayer) },
            { available: move.action === 'flip_interface' && game.flipInterface, run: () => game.flipInterface(coord, game.currentPlayer) },
            { available: game.nucleate, run: () => game.nucleate(coord, game.currentPlayer) },
            { available: game.growDomain, run: () => game.growDomain(coord, game.currentPlayer) },
            { available: game.flipInterface, run: () => game.flipInterface(coord, game.currentPlayer) }
        ]);
    }
    if (modelId === 'physical_cluster_go') {
        return callWithFallback([
            { available: move.action === 'grow_connected_cluster' && game.growCluster, run: () => game.growCluster(coord, game.currentPlayer) },
            { available: game.placeSpecies, run: () => game.placeSpecies(coord, game.currentPlayer) },
            { available: game.growCluster, run: () => game.growCluster(coord, game.currentPlayer) },
            { available: game.applyDiffusionNoise, run: () => game.applyDiffusionNoise(game.currentPlayer) }
        ]);
    }
    if (modelId === 'spin_ice_vertex_game') {
        const action = run.parameters?.spinIceAction || 'flip_arrow';
        return callWithFallback([
            { available: action === 'flip_string' && game.flipString, run: () => game.flipString(coord, game.currentPlayer) },
            { available: action === 'flip_loop' && game.flipLoop, run: () => game.flipLoop(coord, game.currentPlayer) },
            { available: action === 'move_monopole' && game.moveMonopole, run: () => game.moveMonopole(coord, game.currentPlayer) },
            { available: action === 'annihilate_monopole_pair' && game.annihilateMonopoles, run: () => game.annihilateMonopoles(coord, game.currentPlayer) },
            { available: game.flipArrow, run: () => game.flipArrow(coord, game.currentPlayer) }
        ]);
    }
    if (modelId === 'z2_gauge_loop_game') {
        const action = run.parameters?.z2GaugeAction || 'flip_edge';
        return callWithFallback([
            { available: action === 'flip_path' && game.flipGaugePath, run: () => game.flipGaugePath(coord, game.currentPlayer) },
            { available: action === 'flip_loop' && game.flipGaugeLoop, run: () => game.flipGaugeLoop(coord, game.currentPlayer) },
            { available: action === 'measure_star' && game.measureGaugeCheck, run: () => game.measureGaugeCheck(coord, 'star', game.currentPlayer) },
            { available: action === 'measure_flux' && game.measureGaugeCheck, run: () => game.measureGaugeCheck(coord, 'plaquette', game.currentPlayer) },
            { available: game.flipGaugeEdge, run: () => game.flipGaugeEdge(coord, game.currentPlayer) }
        ]);
    }
    if (modelId === 'physical_virasoro_go') {
        return game.tryPlay?.(coord, game.currentPlayer, { primaryType: 'sigma' }) || game.pass?.(game.currentPlayer);
    }
    if (modelId === 'physical_virasoro_reversi') {
        return game.place?.(coord, { player: game.currentPlayer, primaryType: 'sigma' }) || game.pass?.(game.currentPlayer);
    }
    if (modelId === 'physical_clifford_reversi') {
        return game.place?.(coord, { player: game.currentPlayer, pauli: 'X' }) || game.pass?.(game.currentPlayer);
    }
    if (modelId === 'clifford_go') {
        return game.tryPlay?.(coord, game.currentPlayer, { pauli: 'X' }) || game.pass?.(game.currentPlayer);
    }
    if (modelId === 'anyon_reversi') {
        return game.place?.(coord, { player: game.currentPlayer, anyonType: 'e' }) || game.pass?.(game.currentPlayer);
    }
    return game.place?.(coord, { player: game.currentPlayer, pauli: 'X' }) || game.tryPlay?.(coord, game.currentPlayer) || game.pass?.(game.currentPlayer);
}

function rawObservables(game) {
    const exportState = game.exportState?.() || {};
    const counts = game.counts?.() || exportState.counts || {};
    const physical = game.computePhysicalObservables?.() || exportState.physicalObservables || exportState.observables || {};
    const cft = game.computeCFTObservables?.() || exportState.cftObservables || {};
    const braid = game.braidStatistics?.() || exportState.statistics || {};
    return { exportState, counts, physical, cft, braid };
}

function deepFind(source, names) {
    const queue = [source];
    const normalized = names.map((name) => String(name).toLowerCase());
    while (queue.length) {
        const entry = queue.shift();
        if (!entry || typeof entry !== 'object') continue;
        for (const [key, value] of Object.entries(entry)) {
            if (normalized.includes(key.toLowerCase())) return value;
            if (value && typeof value === 'object') queue.push(value);
        }
    }
    return null;
}

function observableValue(observableId, raw) {
    const all = { ...raw.physical, ...raw.cft, ...raw.braid, counts: raw.counts, exportState: raw.exportState };
    const map = {
        'observable.ising.energy': ['energy'],
        'observable.ising.magnetization': ['magnetization'],
        'observable.ising.domain-wall-length': ['domainWallLength', 'wallLength'],
        'observable.ising.domain-count': ['numberOfBlackDomains', 'domainCount'],
        'observable.twophase.energy': ['energy'],
        'observable.twophase.interface-length': ['interfaceLength'],
        'observable.twophase.area-fraction-a': ['areaFractionA'],
        'observable.twophase.domain-count': ['domainCount'],
        'observable.cluster.largest-cluster': ['largestCluster'],
        'observable.cluster.percolation': ['percolationProbability'],
        'observable.cluster.survival': ['survivalProbability'],
        'observable.cluster.wrapping': ['topologyWrappingClusterCount'],
        'observable.particles.count': ['particleCount', 'total'],
        'observable.particles.recombination': ['recombinationCount'],
        'observable.particles.exchange': ['exchangeEvents'],
        'observable.particles.path-length': ['averagePathLength'],
        'observable.spinice.energy': ['energy'],
        'observable.spinice.violations': ['iceRuleViolations'],
        'observable.spinice.monopoles': ['monopoleCount'],
        'observable.spinice.loop-winding': ['loopWinding', 'closedLoopCount'],
        'observable.z2.syndrome-weight': ['syndromeWeight'],
        'observable.z2.logical-sector': ['logicalSector'],
        'observable.z2.wilson-loops': ['wilsonLoops', 'logicalWilsonLoops'],
        'observable.z2.memory': ['memoryAlive', 'memoryStatus'],
        'observable.stabilizer.syndrome-weight': ['syndromeWeight'],
        'observable.stabilizer.logical-sector': ['logicalSector'],
        'observable.stabilizer.global-parity': ['globalParity'],
        'observable.stabilizer.vacuum': ['vacuumRecovered', 'vacuumState'],
        'observable.anyon.total-fusion-charge': ['totalFusionCharge'],
        'observable.anyon.logical-sector': ['logicalSector'],
        'observable.anyon.average-braid-word-length': ['averageLength', 'averageBraidLength'],
        'observable.anyon.unbraid-success-rate': ['unbraidSuccessRate'],
        'observable.cft.primary-counts': ['primaryCounts'],
        'observable.cft.dominant-block': ['dominantBlock'],
        'observable.cft.entropy': ['entropy', 'intervalEntropy'],
        'observable.cft.anomaly-events': ['centralChargeAnomalyEvents', 'anomalyEvents'],
        'observable.pauli.distribution': ['pauliDistribution'],
        'observable.pauli.owner-counts': ['counts'],
        'observable.pauli.conflicts': ['commutationConflicts', 'conflictCount']
    };
    const value = deepFind(all, map[observableId] || [observableId.split('.').at(-1)]);
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === 'object') return cloneValue(value);
    if (value !== null && value !== undefined) return value;
    const fallback = raw.counts?.black !== undefined || raw.counts?.white !== undefined
        ? (Number(raw.counts.black || 0) + Number(raw.counts.white || 0))
        : 0;
    return fallback;
}

function labEventFromHistory(event, index) {
    return {
        id: `event.${index + 1}`,
        step: Number(event.tick ?? event.number ?? index + 1),
        time: Number(event.tick ?? event.number ?? index + 1),
        type: String(event.action || event.type || 'event'),
        source: 'rule',
        affectedSites: event.affectedVertices || event.flipped || event.coords || [],
        affectedEdges: event.affectedEdges || [],
        payload: cloneValue(event),
        eventHash: labHash(event, 'event')
    };
}

export async function runSingleLabExperiment(run) {
    const warnings = [];
    const model = modelById(run.modelId);
    const topology = topologyById(run.topologyId);
    const rng = seededRandom(`${run.seed}:${run.runId}`);
    const game = createGameForRun(run);
    const observableTimeSeries = Object.fromEntries(run.observables.map((id) => [id, []]));
    const snapshots = [];

    const sample = (step) => {
        const raw = rawObservables(game);
        for (const observableId of run.observables) {
            const value = observableValue(observableId, raw);
            observableTimeSeries[observableId].push({
                step,
                time: step,
                value,
                sampleHash: labHash({ runId: run.runId, observableId, step, value }, 'sample')
            });
        }
        return raw;
    };

    let raw = sample(0);
    snapshots.push({
        id: `${run.runId}.snapshot.0`,
        step: 0,
        time: 0,
        stateHash: labHash(raw.exportState, 'state'),
        preview: {
            topology: topology.id,
            counts: raw.counts,
            model: model.id
        },
        snapshotHash: labHash({ runId: run.runId, step: 0, raw: raw.exportState }, 'snapshot')
    });

    let failedStep = null;
    for (let step = 1; step <= run.steps; step += 1) {
        const result = applyExistingStep(game, run, rng);
        if (result?.ok === false) {
            warnings.push(`Step ${step}: ${result.error}`);
            const pass = game.pass?.(game.currentPlayer);
            if (pass?.ok === false) {
                failedStep = step;
                break;
            }
        }
        raw = sample(step);
    }

    raw = rawObservables(game);
    const history = game.history || game.moveHistory || game.physicsHistory || raw.exportState.history || [];
    const finalStep = Number(game.moveNumber ?? raw.exportState.moveNumber ?? run.steps);
    const finalState = {
        topologyId: run.topologyId,
        stateSpaceId: run.experimentConfig.stateSpaceId,
        step: finalStep,
        time: finalStep,
        siteStates: {},
        metadata: {
            exportState: raw.exportState,
            topologyName: topology.name.en,
            modelName: model.name.en
        },
        stateHash: labHash(raw.exportState, 'state')
    };
    snapshots.push({
        id: `${run.runId}.snapshot.final`,
        step: finalStep,
        time: finalStep,
        stateHash: finalState.stateHash,
        preview: {
            topology: topology.id,
            counts: raw.counts,
            observables: raw.physical || raw.cft || raw.braid
        },
        snapshotHash: labHash({ runId: run.runId, step: finalStep, raw: raw.exportState }, 'snapshot')
    });

    const observableSummary = {};
    for (const observableId of run.observables) {
        const series = observableTimeSeries[observableId] || [];
        observableSummary[observableId] = series.at(-1)?.value ?? null;
    }

    const result = {
        config: run.experimentConfig,
        finalState,
        observableTimeSeries,
        eventLog: history.map(labEventFromHistory),
        snapshots,
        summary: {
            status: failedStep ? 'failed' : 'complete',
            finalStep,
            finalTime: finalStep,
            stableConfiguration: !failedStep,
            observableSummary,
            interpretation: `Existing ${model.name.en} adapter run on ${topology.name.en}.`,
            limitations: [...(model.warnings || []), ...warnings]
        },
        warnings,
        resultHash: '',
        metadata: {
            runId: run.runId,
            runHash: run.runHash,
            modelValidationLevel: model.validationLevel,
            resultCreatedBy: 'Topoboard Labs Experiment Builder'
        }
    };
    result.resultHash = labHash(result, 'result');
    return result;
}

export async function runBatchSequential(batchConfig, callbacks = {}) {
    const batchTimer = startTimer(`lab-batch:${batchConfig?.batchId || 'batch'}`);
    resumeLab();
    const results = [];
    const failedRuns = [];
    let cancelled = false;
    const controller = {
        cancel() {
            cancelled = true;
            cancelRunningLab();
        }
    };
    callbacks.onStart?.({ totalRuns: batchConfig.runMatrix.length, controller });
    for (let index = 0; index < batchConfig.runMatrix.length; index += 1) {
        if (cancelled) break;
        const run = batchConfig.runMatrix[index];
        callbacks.onProgress?.({ index, totalRuns: batchConfig.runMatrix.length, run, phase: 'running' });
        const safeResult = await runLabStepSafely(null, () => runSingleLabExperiment(run), {
            ...(batchConfig.safetyOptions || {}),
            labId: run.runId,
            onWarning: (warning) => callbacks.onSafetyWarning?.({ index, run, warning })
        });
        if (safeResult.value) {
            const result = safeResult.value;
            results.push(result);
            callbacks.onRunComplete?.({ index, run, result });
        }
        if (safeResult.failed) {
            const error = safeResult.error;
            failedRuns.push({
                runId: run.runId,
                experimentConfig: run.experimentConfig,
                error: error?.message || String(error),
                warnings: [],
                failedAt: new Date().toISOString(),
                metadata: { stack: error?.stack || '' }
            });
            callbacks.onRunFailed?.({ index, run, error });
        } else if (safeResult.paused) {
            cancelled = true;
            callbacks.onSafetyPause?.({ index, run, result: safeResult.value, messages: safeResult.messages });
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
    callbacks.onComplete?.({ results, failedRuns, cancelled });
    endTimer(batchTimer, { category: 'lab initialization', name: batchConfig?.batchId || 'batch' });
    recordMetric('lab', 'batch-runs', results.length + failedRuns.length, {
        completed: results.length,
        failed: failedRuns.length,
        cancelled
    });
    return { results, failedRuns, cancelled };
}

export function resultFingerprint(result) {
    return stableStringify({
        experimentHash: result.config.experimentHash,
        resultHash: result.resultHash,
        summary: result.summary.observableSummary
    });
}
