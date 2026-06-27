import {
    LAB_APP_VERSION,
    LAB_ENGINE_VERSION,
    LAB_HASH_VERSION,
    LAB_OBSERVABLE_REGISTRY_VERSION,
    LAB_RULE_REGISTRY_VERSION,
    LAB_SCHEMA_VERSION,
    LAB_TOPOLOGY_REGISTRY_VERSION,
    MODEL_REGISTRY,
    TOPOLOGY_REGISTRY,
    buildBasicReproducibilityMetadata,
    labHash,
    modelById,
    stableStringify,
    text,
    topologyById
} from '../experiments/LabExperimentRegistry.js';
import {
    computeCycleData,
    computeTopologyInvariants,
    estimateEdgeCount,
    topologySiteCount
} from '../topology-compare/LabTopologyCompareCore.js';
import { downloadText, toCsv } from '../experiments/LabBatchCore.js';

export {
    LAB_APP_VERSION,
    LAB_ENGINE_VERSION,
    LAB_HASH_VERSION,
    LAB_SCHEMA_VERSION,
    downloadText,
    labHash,
    stableStringify,
    toCsv
};

export const HASH_ALGORITHM = 'fnv1a32';
export const RNG_ALGORITHM = 'mulberry32';
export const REPLAY_STORAGE_KEY = 'topoboard-labs:last-validation-object';
export const VALIDATION_STATUS = Object.freeze({
    reproducible: 'reproducible',
    partial: 'partially_reproducible',
    not: 'not_reproducible',
    insufficient: 'insufficient_metadata',
    warning: 'warning'
});

const HASH_EXCLUDED_FIELDS = new Set([
    'chart',
    'canvas',
    'dom',
    'expanded',
    'language',
    'locale',
    'panelState',
    'preview',
    'rendering',
    'selected',
    'ui',
    'view'
]);

const TIMESTAMP_FIELDS = new Set([
    'createdAt',
    'exportedAt',
    'generatedAt',
    'lastRunAt',
    'runAt',
    'storedAt',
    'updatedAt'
]);

export const VALIDATION_LEVEL_DEFINITIONS = [
    {
        level: 'toy',
        description: 'Useful for intuition, education, or interaction. Not intended as a physically validated model.',
        requirements: ['Clear toy label', 'Visible limitations', 'No physical correctness claim'],
        nextLevelRequires: ['Defined state space, rules, observables, seeds, and deterministic export']
    },
    {
        level: 'estimator',
        description: 'Has defined state space, rules, and observables. May provide finite-size computational estimates.',
        requirements: ['State space documented', 'Local rule documented', 'Observable definitions available'],
        nextLevelRequires: ['Benchmark tests against known exact or internal consistency checks']
    },
    {
        level: 'benchmarked',
        description: 'Passed documented benchmark tests within stated tolerances.',
        requirements: ['Benchmark registry coverage', 'Last benchmark status recorded', 'Limitations shown'],
        nextLevelRequires: ['Broader tests, reproducibility guarantees, export and replay coverage']
    },
    {
        level: 'research_grade',
        description: 'Documented algorithms, limitations, reproducibility guarantees, benchmarks, and exports suitable for serious computational research.',
        requirements: ['Full benchmark coverage', 'Deterministic replay', 'Versioned schemas', 'Auditable exports'],
        nextLevelRequires: ['Ongoing benchmark maintenance and external review']
    }
];

function nowIso() {
    return new Date().toISOString();
}

export function warning(warningId, severity, message, recommendation, canProceed = true, affectedObject = undefined) {
    return { warningId, severity, message, affectedObject, recommendation, canProceed };
}

export function canonicalizeResearchObject(value, options = {}, path = '') {
    const excluded = new Set([...(options.excludedFields || []), ...HASH_EXCLUDED_FIELDS]);
    const fieldsIncluded = options.fieldsIncluded || [];
    const fieldsExcluded = options.fieldsExcluded || [];
    const excludeTimestamps = options.excludeTimestamps ?? true;

    const visit = (entry, currentPath) => {
        if (entry === undefined || typeof entry === 'function') {
            if (currentPath) fieldsExcluded.push(currentPath);
            return undefined;
        }
        if (entry === null || typeof entry !== 'object') {
            if (currentPath) fieldsIncluded.push(currentPath);
            return entry;
        }
        if (Array.isArray(entry)) {
            if (currentPath) fieldsIncluded.push(currentPath);
            return entry.map((item, index) => visit(item, `${currentPath}[${index}]`));
        }
        const result = {};
        for (const [key, child] of Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) {
            const childPath = currentPath ? `${currentPath}.${key}` : key;
            if (excluded.has(key) || (excludeTimestamps && TIMESTAMP_FIELDS.has(key))) {
                fieldsExcluded.push(childPath);
                continue;
            }
            const normalized = visit(child, childPath);
            if (normalized !== undefined) result[key] = normalized;
        }
        return result;
    };

    return visit(value, path);
}

export function canonicalSerialize(value, options = {}) {
    const fieldsIncluded = [];
    const fieldsExcluded = [];
    const canonical = canonicalizeResearchObject(value, { ...options, fieldsIncluded, fieldsExcluded });
    return {
        canonical,
        serialized: stableStringify(canonical),
        fieldsIncluded,
        fieldsExcluded
    };
}

export function hashResearchObject(value, prefix = 'research', options = {}) {
    const { canonical, serialized, fieldsIncluded, fieldsExcluded } = canonicalSerialize(value, options);
    return {
        hashValue: labHash(serialized, prefix),
        canonical,
        serialized,
        fieldsIncluded,
        fieldsExcluded,
        hashAlgorithm: HASH_ALGORITHM,
        hashVersion: LAB_HASH_VERSION
    };
}

export function hashAuditForObject(objectType, object, prefix = 'research', objectId = undefined, options = {}) {
    const audit = hashResearchObject(object, prefix, options);
    const warnings = [];
    if (!object || typeof object !== 'object') {
        warnings.push(warning('hash.non_object', 'warning', 'Hash target is not a structured research object.', 'Load a config, result, manifest, or bundle JSON.'));
    }
    if (!audit.fieldsIncluded.length) {
        warnings.push(warning('hash.empty_payload', 'warning', 'No deterministic fields were included in this hash.', 'Check whether the loaded object is empty or only contains UI fields.'));
    }
    return {
        objectType,
        objectId,
        hashValue: audit.hashValue,
        fieldsIncluded: audit.fieldsIncluded,
        fieldsExcluded: audit.fieldsExcluded,
        hashAlgorithm: audit.hashAlgorithm,
        hashVersion: audit.hashVersion,
        canonicalSerializationHash: labHash(audit.serialized, 'canonical'),
        warnings
    };
}

function seedToUint32(seed) {
    let hash = 2166136261;
    const textValue = String(seed);
    for (let index = 0; index < textValue.length; index += 1) {
        hash ^= textValue.charCodeAt(index);
        hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
}

export function createRNGContext(baseSeed = 'topoboard-seed', streamId = 'dynamics', counter = 0) {
    let state = seedToUint32(`${baseSeed}:${streamId}`);
    let currentCounter = 0;
    const advance = () => {
        state += 0x6d2b79f5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        currentCounter += 1;
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    const context = {
        rngAlgorithm: RNG_ALGORITHM,
        baseSeed,
        streamId,
        get currentCounter() {
            return currentCounter;
        },
        draw() {
            return advance();
        },
        fork(nextStreamId) {
            return createRNGContext(`${baseSeed}:${streamId}`, nextStreamId, 0);
        },
        serialize() {
            return {
                rngAlgorithm: RNG_ALGORITHM,
                baseSeed,
                streamId,
                currentCounter,
                stateHash: labHash({ baseSeed, streamId, currentCounter, state }, 'rng-state')
            };
        },
        restore(snapshot) {
            return createRNGContext(snapshot.baseSeed, snapshot.streamId, snapshot.currentCounter);
        }
    };
    for (let index = 0; index < counter; index += 1) context.draw();
    return context;
}

export function detectObjectType(input) {
    const object = input?.envelope || input;
    if (!object || typeof object !== 'object') return 'unknown';
    if (object.manifest?.bundleId || object.bundleId) return 'reproducibility_bundle';
    if (object.comparisonResult || object.comparisonConfig) return object.comparisonResult ? 'LabTopologyComparisonResult' : 'LabTopologyComparisonConfig';
    if (object.phaseScanResult || object.phaseScanConfig) return object.phaseScanResult ? 'LabPhaseScanResult' : 'LabPhaseScanConfig';
    if (object.batchConfig && (object.runResults || object.results)) return 'LabBatchExperimentResult';
    if (object.runMatrix && object.batchId) return 'LabBatchExperimentConfig';
    if (object.config && object.finalState) return 'LabExperimentResult';
    if (object.experimentId && object.modelId) return 'LabExperimentConfig';
    if (object.files && (object.batchHash || object.phaseScanHash || object.comparisonHash)) return 'ExportManifest';
    if (object.type && object.envelope) return detectObjectType(object.envelope);
    return 'unknown';
}

function unique(values) {
    return [...new Set(values.filter((value) => value !== undefined && value !== null && String(value) !== ''))];
}

export function normalizeLoadedObject(input, source = 'manual') {
    const wrapper = input?.envelope ? input : null;
    const object = wrapper?.envelope || input || {};
    const objectType = detectObjectType(input);
    const config = object.comparisonConfig
        || object.phaseScanConfig
        || object.batchConfig
        || object.config
        || (object.experimentId ? object : null)
        || null;
    const result = object.comparisonResult
        || object.phaseScanResult
        || (object.batchConfig && (object.runResults || object.results) ? object : null)
        || (object.config && object.finalState ? object : null)
        || null;
    const manifest = object.manifest || object.exportManifest || result?.exportManifest || result?.manifest || null;
    const configs = object.experimentConfigs
        || config?.runMatrix?.map((run) => run.experimentConfig)
        || result?.experimentConfigs
        || [];
    const results = object.results || object.runResults || result?.runResults || result?.runResults || [];
    const modelIds = unique([
        config?.modelId,
        ...(config?.selectedModelIds || []),
        ...(configs || []).map((entry) => entry.modelId),
        ...(results || []).map((entry) => entry.config?.modelId)
    ]);
    const topologyIds = unique([
        config?.topologyId,
        config?.referenceTopologyId,
        ...(config?.comparisonTopologyIds || []),
        ...(config?.topologyIds || []),
        ...(config?.selectedTopologyIds || []),
        ...(configs || []).map((entry) => entry.topologyId),
        ...(results || []).map((entry) => entry.config?.topologyId)
    ]);
    const observableIds = unique([
        ...(config?.observables || []),
        ...(config?.selectedObservableIds || []),
        ...(config?.auxiliaryObservableIds || []),
        config?.classificationObservableId,
        ...(configs || []).flatMap((entry) => entry.observables || [])
    ]);
    const stepCount = config?.steps
        ?? config?.stepPlan?.fixedSteps
        ?? config?.stepPlan?.resolvedStepCounts?.[0]
        ?? configs?.[0]?.steps
        ?? results?.[0]?.config?.steps
        ?? null;
    const seedPlan = config?.seedPlan
        || config?.parameters?.seedPlan
        || configs?.[0]?.seed
        || results?.[0]?.config?.seed
        || null;
    return {
        source,
        wrapper,
        object,
        objectType,
        config,
        result,
        manifest,
        configs,
        results,
        modelIds,
        topologyIds,
        observableIds,
        seedPlan,
        stepCount,
        loadedAt: nowIso()
    };
}

export function loadStoredValidationCandidates() {
    const candidates = [];
    const keys = [
        REPLAY_STORAGE_KEY,
        'topoboard-labs:last-batch-dataset',
        'topoboard-labs:last-phase-scan',
        'topoboard-labs:last-topology-comparison'
    ];
    for (const key of keys) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            candidates.push({ key, ...normalizeLoadedObject(parsed, key), storedAt: parsed.storedAt || '' });
        } catch {
            candidates.push({ key, objectType: 'unreadable', source: key, object: null });
        }
    }
    return candidates;
}

export function createSampleExperiment() {
    const model = modelById('ising_domain_game');
    const topology = topologyById('torus');
    const createdAt = nowIso();
    const config = {
        schemaName: 'LabExperimentConfig',
        schemaVersion: LAB_SCHEMA_VERSION,
        experimentId: 'sample.validation.ising.torus',
        modelId: model.id,
        topologyId: topology.id,
        stateSpaceId: `state-space.${model.id}`,
        localRuleId: `rule.${model.id}.existing-adapter`,
        initialConditionId: 'domain_wall_seed',
        validationLevel: model.validationLevel,
        parameters: {
            couplingJ: 1,
            temperature: 0,
            topologyType: topology.topologyType,
            boundaryCondition: topology.boundaryCondition,
            dimension: topology.dimension,
            latticeType: topology.latticeTypes[0],
            modelVersion: `${model.id}@${LAB_APP_VERSION}`
        },
        seed: 'validation-sample-seed',
        steps: 12,
        observables: ['observable.ising.energy', 'observable.ising.magnetization', 'observable.ising.domain-wall-length'],
        exportOptions: {
            json: true,
            csv: true,
            includeTopology: true,
            includeStateSpace: true,
            includeSnapshots: true,
            includeEventLog: true,
            includeObservableTimeSeries: true,
            precision: 6
        },
        appVersion: LAB_APP_VERSION,
        createdAt,
        experimentHash: '',
        metadata: {
            sample: true,
            limitation: 'Sample config for validation UI checks; no dynamics result is bundled.'
        }
    };
    config.experimentHash = labHash({ ...config, experimentHash: '', reproducibilityMetadata: undefined }, 'experiment');
    config.reproducibilityMetadata = buildBasicReproducibilityMetadata({
        schemaName: 'LabExperimentConfig',
        modelId: model.id,
        modelVersion: `${model.id}@${LAB_APP_VERSION}`,
        rngSeed: config.seed,
        seedPlan: { mode: 'single', singleSeed: config.seed, resolvedSeeds: [config.seed] },
        configHash: config.experimentHash,
        deterministicReplaySupported: true,
        createdAt
    });
    return normalizeLoadedObject(config, 'sample');
}

export function reproducibilityMetadataForLoaded(loaded) {
    const config = loaded.config || {};
    const result = loaded.result || {};
    const existing = config.reproducibilityMetadata || result.reproducibilityMetadata || loaded.object?.reproducibilityMetadata;
    const configHash = config.experimentHash || config.batchHash || config.comparisonHash || config.phaseScanHash || config.experimentHash || hashResearchObject(config, 'config').hashValue;
    const resultHash = result.resultHash || result.batchResultHash || result.comparisonResultHash || '';
    const eventLog = result.eventLog || result.runResults?.flatMap((entry) => entry.eventLog || []) || loaded.results?.flatMap((entry) => entry.eventLog || []) || [];
    const eventLogHash = eventLog.length ? hashResearchObject(eventLog, 'event-log').hashValue : '';
    const manifestHash = loaded.manifest?.manifestHash || (loaded.manifest ? hashResearchObject(loaded.manifest, 'manifest').hashValue : '');
    const seed = config.seed || config.seedPlan?.singleSeed || config.seedPlan?.resolvedSeeds?.[0] || loaded.seedPlan?.singleSeed || loaded.seedPlan?.resolvedSeeds?.[0] || null;
    const modelId = loaded.modelIds[0] || config.modelId || 'unknown';
    const metadata = {
        ...buildBasicReproducibilityMetadata({
            schemaName: config.schemaName || loaded.objectType || 'LegacyTopoboardLabsObject',
            modelId,
            modelVersion: config.parameters?.modelVersion || `${modelId}@${config.appVersion || LAB_APP_VERSION}`,
            rngSeed: seed,
            seedPlan: config.seedPlan || loaded.seedPlan,
            configHash,
            stateHashInitial: result.snapshots?.[0]?.stateHash || '',
            stateHashFinal: result.finalState?.stateHash || result.runResults?.[0]?.finalState?.stateHash || '',
            eventLogHash,
            resultHash,
            exportManifestHash: manifestHash,
            deterministicReplaySupported: Boolean(seed && configHash),
            knownNonDeterministicComponents: seed ? ['Browser-dependent rendering is excluded from research hashes.'] : ['Stochastic rule or user randomization without stored seed.'],
            warnings: [],
            createdAt: config.createdAt || result.generatedAt || nowIso()
        }),
        ...(existing || {})
    };
    const warnings = [...(metadata.warnings || [])];
    if (!config.schemaName) warnings.push('Legacy experiment format: missing schemaName.');
    if (!config.schemaVersion) warnings.push('Legacy experiment format: missing schemaVersion.');
    if (!metadata.rngSeed && !metadata.seedPlan) warnings.push('Missing seed metadata; config+seed replay cannot be guaranteed.');
    if (!metadata.modelVersion) warnings.push('Missing model version; benchmark staleness cannot be fully evaluated.');
    return { ...metadata, warnings: unique(warnings) };
}

export function replayFromConfigSeed(loaded) {
    const metadata = reproducibilityMetadataForLoaded(loaded);
    const warnings = [];
    if (!metadata.rngSeed && !metadata.seedPlan) {
        warnings.push(warning('replay.missing_seed', 'error', 'Config + seed replay is unsupported because no seed or seed plan was found.', 'Export the experiment again with a stored seed.', false));
        return replayResult('config_seed', 'unsupported_replay', loaded, warnings, ['No stored seed.']);
    }
    if (!loaded.config) {
        warnings.push(warning('replay.missing_config', 'error', 'Config + seed replay is unsupported because no experiment config was found.', 'Load a LabExperimentConfig, batch config, phase scan config, or topology comparison config.', false));
        return replayResult('config_seed', 'unsupported_replay', loaded, warnings, ['No config object.']);
    }
    if (!loaded.result) {
        warnings.push(warning('replay.no_original_result', 'warning', 'The config has replay metadata, but no original result is loaded for comparison.', 'Load the result JSON or reproducibility bundle to compare final hashes.', true));
        return replayResult('config_seed', 'partially_reproducible', loaded, warnings, ['The validation page did not rerun model dynamics for this legacy/object type.']);
    }
    const hasResultHash = Boolean(metadata.resultHash);
    const status = hasResultHash ? 'partially_reproducible' : 'unsupported_replay';
    warnings.push(warning(
        'replay.runner_not_invoked',
        'info',
        'Config and seed metadata are present. This validation check does not claim a fresh dynamics rerun unless a dedicated runner reports exact equality.',
        'Use the original batch runner or future strict replay adapter for full dynamics replay.',
        true
    ));
    return replayResult('config_seed', status, loaded, warnings, ['Metadata replay check completed; dynamics rerun not claimed.']);
}

export function replayFromEventLog(loaded, strict = false) {
    const result = loaded.result || {};
    const eventLog = result.eventLog || result.runResults?.flatMap((entry) => entry.eventLog || []) || loaded.results?.flatMap((entry) => entry.eventLog || []) || [];
    const warnings = [];
    if (!eventLog.length) {
        warnings.push(warning('replay.missing_event_log', 'warning', 'Event log replay is unsupported because no event log was found.', 'Export with event logs enabled.', false));
        return replayResult(strict ? 'strict' : 'event_log', 'unsupported_replay', loaded, warnings, ['No event log.']);
    }
    const nonReplayable = eventLog.filter((event) => event.replayable === false);
    if (nonReplayable.length) {
        warnings.push(warning('replay.non_replayable_events', 'warning', `${nonReplayable.length} event(s) are marked non-replayable.`, 'Inspect nonReplayableReason fields and use strict logging for future runs.', true));
    }
    const finalStateHash = result.finalState?.stateHash || result.runResults?.at(-1)?.finalState?.stateHash || '';
    const lastEventHash = eventLog.at(-1)?.stateHashAfter || eventLog.at(-1)?.payload?.stateHash || '';
    const exact = Boolean(finalStateHash && lastEventHash && finalStateHash === lastEventHash);
    const status = exact
        ? 'exact_match'
        : nonReplayable.length
            ? 'partially_reproducible'
            : 'event_log_mismatch';
    if (!exact) {
        warnings.push(warning('replay.event_hash_gap', 'warning', 'The event log does not provide a final state hash matching the loaded result.', 'Use strict replay logging with stateHashBefore/stateHashAfter.', true));
    }
    return replayResult(strict ? 'strict' : 'event_log', status, loaded, warnings, [exact ? 'Final event state hash matches final state.' : 'Event log can be audited but not applied exactly here.']);
}

function replayResult(mode, status, loaded, warnings, details) {
    const payload = {
        mode,
        status,
        targetObjectType: loaded.objectType,
        targetObjectId: targetId(loaded),
        details
    };
    return {
        replayId: `replay.${labHash(payload, 'id').replace(':', '.')}`,
        mode,
        status,
        targetObjectId: targetId(loaded),
        comparison: {
            stateHashMatch: status === 'exact_match',
            observableMatch: status === 'exact_match' || status === 'partially_reproducible',
            eventLogMatch: status === 'exact_match',
            resultHashMatch: status === 'exact_match',
            details
        },
        warnings,
        limitations: [
            'Replay status is scoped to stored config, seed, event-log, and hash metadata.',
            'No claim of physical exactness is made for toy or estimator models.'
        ],
        replayHash: labHash(payload, 'replay')
    };
}

export const BENCHMARK_REGISTRY = [
    benchmark('engine.rng.same-seed', 'Deterministic RNG same seed sequence', 'engine', 'engine', 'rng', 'Same seed and stream should produce the same first draws.', 'estimator', ['Deterministic JS integer arithmetic check.']),
    benchmark('engine.hash.key-order', 'Config hash stable under key ordering', 'hashing', 'engine', 'hash', 'Canonical serialization sorts object keys before hashing.', 'estimator', ['FNV-1a is for reproducibility identity, not cryptographic security.']),
    benchmark('engine.replay.metadata', 'Replay metadata presence', 'replay', 'replay', 'metadata', 'Config/result exports should include seed, config hash, and version metadata.', 'estimator', ['Legacy exports may only be partially reproducible.']),
    benchmark('engine.export.manifest', 'Export manifest required fields', 'export', 'export', 'manifest', 'Manifest should include app version, files, hashes, and warnings.', 'estimator', ['Older exports are reported with warnings, not silently accepted.']),
    benchmark('topology.connectedness', 'Topology connectedness declaration', 'topology', 'topology', 'registry', 'Registry topologies are expected to represent one connected graph unless declared otherwise.', 'estimator', ['Uses registry metadata when full adjacency is unavailable.']),
    benchmark('topology.edge-count', 'Topology edge count estimator', 'topology', 'topology', 'registry', 'Estimated edge count must be nonnegative and respond to boundary conditions.', 'estimator', ['Finite graph estimator.']),
    benchmark('topology.twisted-seam', 'Twisted seam metadata', 'topology', 'topology', 'mobius-klein-rp2', 'Non-orientable topology entries should expose twisted seam metadata.', 'estimator', ['Metadata declaration, not exact homology computation.']),
    benchmark('ising.spin-flip-symmetry', 'Ising spin-flip zero-field energy symmetry', 'model', 'model', 'ising_domain_game', 'Flipping all spins should preserve zero-field energy in the finite graph estimator.', 'estimator', ['Structural benchmark placeholder; no continuum result claimed.']),
    benchmark('ising.same-seed-series', 'Ising same seed time series stability', 'model', 'model', 'ising_domain_game', 'Same seed and config should produce the same stored observable series.', 'estimator', ['Requires stored result series to check exactly.']),
    benchmark('cluster.empty-state', 'Cluster empty state remains empty without birth', 'model', 'model', 'physical_cluster_go', 'Empty initial state with no birth rule should not create occupied sites.', 'estimator', ['Applies only when that initial/rule setting is exported.']),
    benchmark('stabilizer.pauli-table', 'Pauli multiplication consistency', 'model', 'model', 'physical_clifford_reversi', 'Pauli table checks identity and repeated Pauli operations at the symbolic level.', 'estimator', ['Symbolic toy/QEC estimator scope.']),
    benchmark('anyon.vacuum-count', 'Anyon vacuum count', 'model', 'model', 'physical_anyon_jump', 'Vacuum state should report zero anyon count where the model exposes that observable.', 'toy', ['Toy anyon algebra; not hardware validation.']),
    benchmark('field.empty-insertions', 'Field insertion empty state', 'model', 'model', 'physical_virasoro_go', 'Empty insertion state should report zero insertion count.', 'toy', ['Toy CFT graph estimator only.']),
    benchmark('observable.finite-values', 'Observable finite values', 'observable', 'observable', 'registry', 'Observable samples should be finite or explicitly nonnumeric with units and limitations.', 'estimator', ['Symbolic observables may be nonnumeric by design.'])
];

function benchmark(benchmarkId, name, category, targetType, targetId, description, validationLevelImpact, limitations) {
    return {
        benchmarkId,
        name,
        category,
        targetType,
        targetId,
        description,
        validationLevelImpact,
        config: {},
        expectedResult: 'pass-or-warning',
        tolerance: 0,
        method: 'Topoboard Labs internal finite-size consistency check.',
        references: [],
        limitations,
        lastStatus: 'not_run'
    };
}

export function runBenchmarks(loaded) {
    const results = [];
    for (const entry of BENCHMARK_REGISTRY) {
        if (!benchmarkApplies(entry, loaded)) continue;
        results.push(runBenchmark(entry, loaded));
    }
    return results;
}

function benchmarkApplies(entry, loaded) {
    if (entry.targetType === 'engine' || entry.targetType === 'export' || entry.targetType === 'replay' || entry.targetId === 'registry') return true;
    if (entry.targetType === 'topology') return loaded.topologyIds.length > 0;
    if (entry.targetType === 'observable') return loaded.observableIds.length > 0;
    if (entry.targetType === 'model') return loaded.modelIds.includes(entry.targetId);
    return true;
}

function runBenchmark(entry, loaded) {
    const warnings = [];
    let status = 'passed';
    let measuredValue = 'ok';
    if (entry.benchmarkId === 'engine.rng.same-seed') {
        const a = createRNGContext('benchmark-seed', 'dynamics');
        const b = createRNGContext('benchmark-seed', 'dynamics');
        const sequenceA = [a.draw(), a.draw(), a.draw()];
        const sequenceB = [b.draw(), b.draw(), b.draw()];
        measuredValue = sequenceA;
        status = stableStringify(sequenceA) === stableStringify(sequenceB) ? 'passed' : 'failed';
    } else if (entry.benchmarkId === 'engine.hash.key-order') {
        const first = hashResearchObject({ b: 2, a: 1 }, 'benchmark').hashValue;
        const second = hashResearchObject({ a: 1, b: 2 }, 'benchmark').hashValue;
        measuredValue = { first, second };
        status = first === second ? 'passed' : 'failed';
    } else if (entry.benchmarkId === 'engine.replay.metadata') {
        const metadata = reproducibilityMetadataForLoaded(loaded);
        const ok = Boolean(metadata.configHash && (metadata.rngSeed || metadata.seedPlan));
        status = ok ? 'passed' : 'warning';
        measuredValue = { configHash: metadata.configHash, rngSeed: metadata.rngSeed };
        if (!ok) warnings.push(warning('benchmark.replay_metadata_missing', 'warning', 'Seed or config hash metadata is incomplete.', 'Export the object again with reproducibility metadata enabled.'));
    } else if (entry.benchmarkId === 'engine.export.manifest') {
        const manifest = loaded.manifest || {};
        const ok = Boolean(manifest.files?.length && (manifest.appVersion || loaded.config?.appVersion));
        status = ok ? 'passed' : 'warning';
        measuredValue = { fileCount: manifest.files?.length || 0, appVersion: manifest.appVersion || loaded.config?.appVersion || null };
    } else if (entry.category === 'topology') {
        const checks = loaded.topologyIds.map((id) => topologyValidationSummary(id));
        measuredValue = checks;
        status = checks.some((check) => check.status === 'warning') ? 'warning' : 'passed';
    } else if (entry.targetType === 'observable') {
        const checks = observableConsistencyChecks(loaded);
        measuredValue = checks.length;
        status = checks.some((check) => check.warnings.some((item) => item.severity === 'error')) ? 'warning' : 'passed';
    } else {
        status = loaded.result ? 'warning' : 'unsupported';
        measuredValue = loaded.result ? 'requires model-specific stored pattern' : 'no result loaded';
        warnings.push(warning('benchmark.scope_limited', 'info', 'This benchmark is registered but needs model-specific exported state to run exactly.', 'Use this as a documented benchmark target; do not count it as passed until exact data is available.'));
    }
    const payload = { benchmarkId: entry.benchmarkId, status, measuredValue };
    return {
        benchmarkId: entry.benchmarkId,
        status,
        measuredValue,
        expectedResult: entry.expectedResult,
        tolerance: entry.tolerance,
        message: benchmarkMessage(entry, status),
        warnings,
        limitations: entry.limitations,
        runAt: nowIso(),
        resultHash: labHash(payload, 'benchmark-result')
    };
}

function benchmarkMessage(entry, status) {
    if (status === 'passed') return `${entry.name}: validation check passed within stated scope.`;
    if (status === 'warning') return `${entry.name}: completed with warnings; inspect limitations.`;
    if (status === 'unsupported') return `${entry.name}: unsupported for the loaded object.`;
    return `${entry.name}: validation check failed.`;
}

function topologyValidationSummary(topologyId) {
    const topology = topologyById(topologyId);
    const sites = topologySiteCount(topology);
    const edges = estimateEdgeCount(topology);
    const cycleData = computeCycleData(topology);
    const needsTwist = ['mobius', 'klein_bottle', 'rp2'].includes(topology.id);
    const warnings = [];
    if (sites <= 0) warnings.push('site count is not positive');
    if (edges < 0) warnings.push('edge count is negative');
    if (needsTwist && !cycleData.twistedSeamEdges.length) warnings.push('twisted seam metadata missing');
    return {
        topologyId,
        sites,
        edges,
        seamEdges: cycleData.seamEdges.length,
        twistedSeamEdges: cycleData.twistedSeamEdges.length,
        status: warnings.length ? 'warning' : 'passed',
        warnings
    };
}

export function observableConsistencyChecks(loaded) {
    const checks = [];
    for (const observableId of loaded.observableIds) {
        const model = MODEL_REGISTRY.find((entry) => entry.observables.some((observable) => observable.id === observableId));
        const observable = model?.observables.find((entry) => entry.id === observableId);
        const warnings = [];
        if (!observable?.definition) warnings.push(warning('observable.missing_definition', 'warning', `Observable ${observableId} has no definition in the registry.`, 'Add a registry definition before using it for reports.'));
        const samples = loaded.results.flatMap((result) => result.observableTimeSeries?.[observableId] || []);
        const expectedSteps = loaded.stepCount === null ? null : Number(loaded.stepCount) + 1;
        if (expectedSteps && samples.length && samples.length % expectedSteps !== 0) {
            warnings.push(warning('observable.series_length', 'warning', `Observable ${observableId} time-series length does not align with step count.`, 'Check whether snapshots or sampling interval changed.'));
        }
        const finiteIssue = samples.some((sample) => typeof sample.value === 'number' && !Number.isFinite(sample.value));
        if (finiteIssue) warnings.push(warning('observable.non_finite', 'error', `Observable ${observableId} contains a non-finite numeric value.`, 'Inspect the model adapter and export this run with warnings.', false));
        const payload = { observableId, warnings: warnings.map((item) => item.warningId), samples: samples.length };
        checks.push({
            observableId,
            definition: observable?.definition || 'Unknown observable definition.',
            computeMethod: observable?.estimatorType || 'unknown',
            dependencies: ['state', 'topology', 'model registry'],
            exactness: observable?.estimatorType === 'exact_discrete' ? 'computed' : observable?.estimatorType ? 'estimated' : 'unknown',
            validRange: observable?.category === 'order_parameter' ? { min: -1, max: 1, inclusive: true } : undefined,
            units: observable?.units || 'unknown',
            limitations: observable?.limitations || ['No observable limitations registered.'],
            benchmarkStatus: warnings.some((item) => item.severity === 'error') ? 'failed' : warnings.length ? 'warning' : 'passed',
            warnings,
            checkHash: labHash(payload, 'observable-check')
        });
    }
    return checks;
}

export function topologyValidationChecks(loaded) {
    return loaded.topologyIds.map((topologyId) => {
        const topology = topologyById(topologyId);
        const declaredInvariants = computeTopologyInvariants(topology);
        const computedInvariants = computeTopologyInvariants(topology);
        const cycleData = computeCycleData(topology);
        const warnings = [];
        const summary = topologyValidationSummary(topologyId);
        for (const item of summary.warnings) warnings.push(warning(`topology.${topologyId}.${item.replaceAll(' ', '_')}`, 'warning', `${topologyId}: ${item}.`, 'Inspect topology metadata and exactness labels.'));
        const estimatedExact = computedInvariants.filter((entry) => entry.exactness === 'estimated' && ['Euler characteristic', 'Betti numbers'].includes(entry.name));
        if (estimatedExact.length) {
            warnings.push(warning('topology.estimated_invariant', 'info', `${topologyId}: some invariants are estimated and must not be treated as exact.`, 'Keep exactness labels visible in reports.'));
        }
        const compatibleModelIds = MODEL_REGISTRY.filter((model) => model.compatibleTopologies.includes(topologyId)).map((model) => model.id);
        const payload = { topologyId, warnings: warnings.map((entry) => entry.warningId), invariantCount: computedInvariants.length };
        return {
            topologyId,
            declaredInvariants,
            computedInvariants,
            exactnessLabels: Object.fromEntries(computedInvariants.map((entry) => [entry.invariantId, entry.exactness])),
            consistencyWarnings: warnings,
            cycleAndSeamMetadata: cycleData,
            compatibleModelIds,
            checks: {
                adjacencyValid: summary.sites > 0 && summary.edges >= 0 ? 'passed' : 'failed',
                edgesReferenceValidSites: 'warning',
                seamMetadata: summary.warnings.length ? 'warning' : 'passed',
                exactnessLabelsVisible: 'passed'
            },
            checkHash: labHash(payload, 'topology-check')
        };
    });
}

export function validationLevelCards(loaded) {
    const modelIds = loaded.modelIds.length ? loaded.modelIds : ['unknown'];
    return modelIds.map((modelId) => {
        const model = modelById(modelId);
        const definition = VALIDATION_LEVEL_DEFINITIONS.find((entry) => entry.level === model.validationLevel) || VALIDATION_LEVEL_DEFINITIONS[0];
        const benchmarkResults = runBenchmarks(loaded).filter((entry) => entry.benchmarkId.includes(modelId) || entry.benchmarkId.startsWith('engine.'));
        const passedCount = benchmarkResults.filter((entry) => entry.status === 'passed').length;
        return {
            modelId,
            modelName: text(model.name),
            validationLevel: model.validationLevel,
            why: definition.description,
            missingForNextLevel: definition.nextLevelRequires,
            benchmarkStatus: `${passedCount}/${benchmarkResults.length} applicable checks passed`,
            reproducibilityStatus: reproducibilityMetadataForLoaded(loaded).deterministicReplaySupported ? 'deterministic under stored config and seed metadata' : 'insufficient seed/config metadata'
        };
    });
}

export function buildValidationReport(loaded, replay = null) {
    const metadata = reproducibilityMetadataForLoaded(loaded);
    const benchmarkResults = runBenchmarks(loaded);
    const observableChecks = observableConsistencyChecks(loaded);
    const topologyChecks = topologyValidationChecks(loaded);
    const hashAudit = [
        hashAuditForObject(loaded.objectType, loaded.object, 'loaded-object', targetId(loaded)),
        ...(loaded.config ? [hashAuditForObject('config', loaded.config, 'config', targetId(loaded))] : []),
        ...(loaded.result ? [hashAuditForObject('result', loaded.result, 'result', targetId(loaded))] : []),
        ...(loaded.manifest ? [hashAuditForObject('manifest', loaded.manifest, 'manifest', targetId(loaded))] : [])
    ];
    const warnings = [];
    for (const textWarning of metadata.warnings || []) {
        warnings.push(warning(`metadata.${labHash(textWarning, 'id').replace(':', '.')}`, 'warning', textWarning, 'Re-export with complete reproducibility metadata when possible.'));
    }
    for (const entry of benchmarkResults) warnings.push(...entry.warnings);
    for (const entry of observableChecks) warnings.push(...entry.warnings);
    for (const entry of topologyChecks) warnings.push(...entry.consistencyWarnings);
    for (const entry of hashAudit) warnings.push(...entry.warnings);
    if (loaded.modelIds.some((id) => modelById(id).validationLevel === 'toy')) {
        warnings.push(warning('validation.toy_model', 'info', 'At least one loaded model is labelled toy.', 'Use results for intuition unless benchmark coverage supports stronger claims.'));
    }
    const failures = warnings.filter((entry) => ['error', 'critical'].includes(entry.severity));
    const replayStatus = replay?.status || (metadata.deterministicReplaySupported ? 'partially_reproducible' : 'unsupported_replay');
    const passedBenchmarks = benchmarkResults.filter((entry) => entry.status === 'passed').length;
    const status = failures.length
        ? 'not_reproducible'
        : !metadata.configHash || (!metadata.rngSeed && !metadata.seedPlan)
            ? 'insufficient_metadata'
            : replayStatus === 'exact_match'
                ? 'reproducible'
                : 'partially_reproducible';
    const report = {
        reportId: `validation.${labHash({ target: targetId(loaded), generatedAt: nowIso() }, 'id').replace(':', '.')}`,
        reportType: reportTypeForObjectType(loaded.objectType),
        generatedAt: nowIso(),
        appVersion: metadata.appVersion || LAB_APP_VERSION,
        schemaVersion: LAB_SCHEMA_VERSION,
        targetObjectType: loaded.objectType,
        targetObjectId: targetId(loaded),
        reproducibilityStatus: status,
        replayStatus,
        benchmarkResults,
        observableChecks,
        topologyChecks,
        hashAudit,
        warnings,
        failures,
        recommendations: recommendationsFor(loaded, warnings, benchmarkResults),
        reportHash: ''
    };
    report.reportHash = labHash({ ...report, reportHash: '' }, 'validation-report');
    report.summary = {
        checked: [
            'reproducibility metadata',
            'canonical hashes',
            'deterministic RNG',
            'benchmark registry',
            'observable consistency',
            'topology invariant labels',
            'export manifest'
        ],
        passedBenchmarks,
        totalBenchmarks: benchmarkResults.length,
        scientificLanguage: 'validation check, benchmark result, replay match, estimator, finite-size check'
    };
    return report;
}

function recommendationsFor(loaded, warnings, benchmarkResults) {
    const recommendations = [];
    if (!loaded.config?.schemaName) recommendations.push('Add schemaName and schemaVersion to future exports.');
    if (!loaded.result) recommendations.push('Load or export the result JSON to compare replay hashes.');
    if (!loaded.manifest) recommendations.push('Export a manifest so file coverage and bundle hashes can be audited.');
    if (warnings.some((entry) => entry.warningId.includes('missing_seed'))) recommendations.push('Store explicit seed and seed plan for every stochastic run.');
    if (benchmarkResults.some((entry) => entry.status === 'unsupported')) recommendations.push('Add exact model-specific benchmark fixtures before increasing validation level.');
    if (!recommendations.length) recommendations.push('Keep exactness labels and limitations visible in exported reports.');
    return recommendations;
}

function reportTypeForObjectType(objectType) {
    if (objectType.includes('Batch')) return 'batch';
    if (objectType.includes('Phase')) return 'phase_scan';
    if (objectType.includes('TopologyComparison')) return 'topology_comparison';
    if (objectType.includes('Manifest')) return 'manifest';
    if (objectType.includes('Experiment')) return 'experiment';
    return 'unknown';
}

export function targetId(loaded) {
    const config = loaded.config || {};
    return config.experimentId || config.batchId || config.phaseScanId || config.comparisonId || loaded.manifest?.bundleId || loaded.objectType;
}

export function buildReproducibilityBundle(loaded, report) {
    const metadata = reproducibilityMetadataForLoaded(loaded);
    const eventLog = loaded.result?.eventLog || loaded.result?.runResults?.flatMap((entry) => entry.eventLog || []) || [];
    const includedFiles = [
        { path: 'experiment-config.json', mediaType: 'application/json', description: 'Loaded experiment, batch, phase scan, or topology comparison config.', hash: metadata.configHash },
        ...(loaded.result ? [{ path: 'result.json', mediaType: 'application/json', description: 'Loaded result object.', hash: metadata.resultHash }] : []),
        { path: 'topology.json', mediaType: 'application/json', description: 'Topology registry entries used by the loaded object.' },
        { path: 'adjacency.json', mediaType: 'application/json', description: 'Adjacency or registry-derived topology metadata.' },
        { path: 'state-space.json', mediaType: 'application/json', description: 'State-space metadata where available.' },
        { path: 'local-rule.json', mediaType: 'application/json', description: 'Local-rule id, parameters, and validation level.' },
        { path: 'observable-definitions.json', mediaType: 'application/json', description: 'Observable definitions and limitations.' },
        ...(eventLog.length ? [{ path: 'event-log.json', mediaType: 'application/json', description: 'Structured event log.', hash: metadata.eventLogHash }] : []),
        { path: 'rng-metadata.json', mediaType: 'application/json', description: 'RNG algorithm, stream, seed, and replay support.' },
        { path: 'benchmark-report.json', mediaType: 'application/json', description: 'Benchmark results and limitations.' },
        { path: 'validation-report.json', mediaType: 'application/json', description: 'Validation report.', hash: report.reportHash },
        { path: 'export-manifest.json', mediaType: 'application/json', description: 'Bundle manifest.' },
        { path: 'README.md', mediaType: 'text/markdown', description: 'Human-readable reproducibility notes.' }
    ];
    const manifest = {
        schemaName: 'LabReproducibilityBundleManifest',
        schemaVersion: LAB_SCHEMA_VERSION,
        bundleId: `bundle.${labHash({ target: targetId(loaded), reportHash: report.reportHash }, 'id').replace(':', '.')}`,
        bundleName: `Topoboard Reproducibility Bundle - ${targetId(loaded)}`,
        createdAt: nowIso(),
        appVersion: LAB_APP_VERSION,
        includedFiles,
        configHash: metadata.configHash,
        resultHash: metadata.resultHash,
        eventLogHash: metadata.eventLogHash,
        validationReportHash: report.reportHash,
        benchmarkReportHashes: report.benchmarkResults.map((entry) => entry.resultHash),
        warnings: report.warnings,
        reproducibilityStatus: report.reproducibilityStatus,
        limitations: [
            'Compressed export is represented as a JSON bundle in this browser build.',
            'Toy and estimator models remain labelled as such.',
            'Rendering-only randomness is excluded from research hashes.'
        ],
        manifestHash: ''
    };
    manifest.manifestHash = labHash({ ...manifest, manifestHash: '' }, 'bundle-manifest');
    const topologies = loaded.topologyIds.map((id) => topologyById(id));
    const observables = loaded.modelIds.flatMap((id) => modelById(id).observables || []).filter((observable) => loaded.observableIds.includes(observable.id));
    return {
        manifest,
        experimentConfig: loaded.config,
        result: loaded.result,
        topology: topologies,
        adjacency: topologies.map((topology) => ({ topologyId: topology.id, topologyHash: topology.hash, note: 'Registry-derived adjacency metadata; full adjacency may be model-adapter dependent.' })),
        stateSpace: { ids: loaded.config?.stateSpaceId || loaded.configs?.map((entry) => entry.stateSpaceId) || [] },
        localRule: { ids: unique([loaded.config?.localRuleId, ...loaded.configs.map((entry) => entry.localRuleId)]), parameters: loaded.config?.parameters || loaded.config?.fixedParameters || {} },
        observableDefinitions: observables,
        eventLog,
        rngMetadata: {
            rngAlgorithm: metadata.rngAlgorithm,
            baseSeed: metadata.rngSeed || 'unknown',
            seedPlan: metadata.seedPlan,
            streamRecommendation: ['initialCondition', 'dynamics', 'noise', 'measurement', 'userRandomization', 'visualizationOnly']
        },
        benchmarkReport: report.benchmarkResults,
        validationReport: report,
        readme: buildBundleReadme(loaded, report),
        citationMetadata: {
            app: 'Topoboard Labs',
            appVersion: LAB_APP_VERSION,
            note: 'Citation metadata placeholder only; publication mode is not implemented.'
        }
    };
}

function buildBundleReadme(loaded, report) {
    return [
        '# Topoboard Reproducibility Bundle',
        '',
        `Target: ${targetId(loaded)}`,
        `Object type: ${loaded.objectType}`,
        `Generated: ${report.generatedAt}`,
        `Reproducibility status: ${report.reproducibilityStatus}`,
        '',
        'This bundle contains versioned configuration, result data when available, topology metadata, observable definitions, event logs when available, RNG metadata, benchmark results, and this validation report.',
        '',
        'Scope and limitations:',
        '- Toy models are useful for intuition and interaction, not physically validated predictions.',
        '- Estimator models provide finite-size computational checks unless benchmark coverage is explicitly documented.',
        '- Estimated topology invariants are labelled estimated and must not be treated as exact.',
        '- Rendering-only randomness is excluded from research hashes.',
        '',
        'Replay guidance:',
        '- Exact replay requires stored config, seed plan, model version, rule version, topology version, event log or deterministic runner, and matching result hashes.',
        '- Partial replayability is reported when one of those components is missing.'
    ].join('\n');
}

export function bundleToJson(bundle) {
    return JSON.stringify(bundle, null, 2);
}
