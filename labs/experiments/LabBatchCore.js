import {
    LAB_APP_VERSION,
    LAB_SCHEMA_VERSION,
    buildBasicReproducibilityMetadata,
    costRank,
    labHash,
    modelById,
    stableStringify,
    topologyById
} from './LabExperimentRegistry.js';

export function parseScalar(value) {
    const trimmed = String(value ?? '').trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (trimmed !== '' && Number.isFinite(Number(trimmed))) return Number(trimmed);
    return trimmed;
}

export function parseList(value) {
    return String(value ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map(parseScalar);
}

function rangeValues({ start, end, steps, integer = false }) {
    const safeSteps = Math.max(1, Math.floor(Number(steps) || 1));
    const first = Number(start) || 0;
    const last = Number(end) || first;
    if (safeSteps === 1) return [integer ? Math.round(first) : first];
    const values = [];
    for (let index = 0; index < safeSteps; index += 1) {
        const t = index / (safeSteps - 1);
        const value = first + (last - first) * t;
        values.push(integer ? Math.round(value) : Number(value.toFixed(8)));
    }
    return [...new Set(values)];
}

export function seededRandom(seed) {
    let hash = 2166136261;
    const text = String(seed);
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619) >>> 0;
    }
    return () => {
        hash += 0x6d2b79f5;
        let value = hash;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function distributionValues(distribution = {}, seed = 'batch-distribution') {
    const count = Math.max(1, Math.min(1000, Math.floor(Number(distribution.count) || 1)));
    const rng = seededRandom(seed);
    const values = [];
    for (let index = 0; index < count; index += 1) {
        if (distribution.type === 'choice') {
            const choices = distribution.choices?.length ? distribution.choices : [null];
            values.push(choices[Math.floor(rng() * choices.length)]);
            continue;
        }
        if (distribution.type === 'normal') {
            const u1 = Math.max(1e-9, rng());
            const u2 = rng();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            values.push(Number(((Number(distribution.mean) || 0) + z * (Number(distribution.standardDeviation) || 1)).toFixed(8)));
            continue;
        }
        const min = Number(distribution.min) || 0;
        const max = Number(distribution.max) || min + 1;
        const raw = distribution.type === 'log_uniform'
            ? Math.exp(Math.log(Math.max(1e-9, min)) + rng() * (Math.log(Math.max(1e-9, max)) - Math.log(Math.max(1e-9, min))))
            : min + rng() * (max - min);
        values.push(distribution.type === 'integer_uniform' ? Math.round(raw) : Number(raw.toFixed(8)));
    }
    return values;
}

export function expandSweep(sweep, seed = 'batch') {
    if (sweep.mode === 'list') return sweep.values || [];
    if (sweep.mode === 'range') return rangeValues(sweep.range || {});
    if (sweep.mode === 'distribution') return distributionValues(sweep.distribution || {}, `${seed}:${sweep.parameterId}`);
    return [sweep.fixedValue];
}

function cartesian(entries) {
    return entries.reduce((rows, [key, values]) => {
        const next = [];
        for (const row of rows) {
            for (const value of values) next.push({ ...row, [key]: value });
        }
        return next;
    }, [{}]);
}

export function resolveSeedPlan(seedPlan) {
    if (seedPlan.mode === 'list') return (seedPlan.seeds || []).filter((seed) => String(seed).trim() !== '');
    if (seedPlan.mode === 'range') {
        const start = Number(seedPlan.range?.start) || 1;
        const end = Number(seedPlan.range?.end) || start;
        const step = Math.max(1, Math.floor(Number(seedPlan.range?.step) || 1));
        const seeds = [];
        for (let seed = start; seed <= end; seed += step) seeds.push(seed);
        return seeds;
    }
    if (seedPlan.mode === 'generated') {
        const count = Math.max(1, Math.min(1000, Math.floor(Number(seedPlan.generatedCount) || 1)));
        const rng = seededRandom(seedPlan.generatorSeed || 'topoboard-generated-seeds');
        return Array.from({ length: count }, (_, index) => `generated-${index + 1}-${Math.floor(rng() * 1_000_000_000)}`);
    }
    return [seedPlan.singleSeed ?? 'topoboard-seed-1'];
}

export function resolveStepPlan(stepPlan) {
    if (stepPlan.mode === 'list') return (stepPlan.stepCounts || []).map(Number).filter((steps) => steps >= 0);
    if (stepPlan.mode === 'checkpoints') return (stepPlan.checkpoints || []).map(Number).filter((steps) => steps >= 0);
    return [Math.max(0, Math.floor(Number(stepPlan.fixedSteps) || 0))];
}

export function estimateBatch(runCount, observables = [], maxSteps = 0) {
    const observableCost = observables.reduce((sum, observable) => sum + costRank(observable.computationalCost), 0);
    const estimatedMemoryBytes = Math.max(1, runCount) * Math.max(1, observables.length) * Math.max(1, maxSteps + 1) * 96;
    const work = runCount * Math.max(1, maxSteps) * Math.max(1, observableCost);
    const estimatedRuntimeCategory = work > 200000
        ? 'very_large'
        : work > 50000
            ? 'large'
            : work > 8000
                ? 'medium'
                : 'small';
    const warnings = [];
    if (estimatedRuntimeCategory === 'large' || estimatedRuntimeCategory === 'very_large') {
        warnings.push('Large matrix: consider reducing topology count, sweep steps, repeats, or observable count.');
    }
    return { estimatedMemoryBytes, estimatedRuntimeCategory, warnings };
}

export function createExperimentConfig({
    batchId,
    model,
    topologyId,
    initialConditionId,
    parameters,
    seed,
    steps,
    observables,
    matrixIndex,
    repeatIndex,
    createdAt
}) {
    const topology = topologyById(topologyId);
    const experimentId = `${batchId}.run-${String(matrixIndex + 1).padStart(4, '0')}.repeat-${repeatIndex + 1}`;
    const config = {
        schemaName: 'LabExperimentConfig',
        schemaVersion: LAB_SCHEMA_VERSION,
        experimentId,
        modelId: model.id,
        topologyId,
        stateSpaceId: `state-space.${model.id}`,
        localRuleId: `rule.${model.id}.existing-adapter`,
        initialConditionId,
        validationLevel: model.validationLevel,
        parameters: {
            ...parameters,
            topologyType: topology.topologyType,
            boundaryCondition: topology.boundaryCondition,
            dimension: topology.dimension,
            latticeType: topology.latticeTypes[0],
            modelVersion: `${model.id}@${LAB_APP_VERSION}`
        },
        seed,
        steps,
        observables,
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
            section: model.section,
            family: model.family,
            batchId,
            matrixIndex,
            repeatIndex
        }
    };
    config.experimentHash = labHash({ ...config, experimentHash: '', reproducibilityMetadata: undefined }, 'experiment');
    config.reproducibilityMetadata = buildBasicReproducibilityMetadata({
        schemaName: 'LabExperimentConfig',
        modelId: model.id,
        modelVersion: `${model.id}@${LAB_APP_VERSION}`,
        rngSeed: seed,
        seedPlan: { mode: 'single', singleSeed: seed, resolvedSeeds: [seed] },
        configHash: config.experimentHash,
        deterministicReplaySupported: true,
        createdAt
    });
    return config;
}

export function buildRunMatrix({
    batchName,
    selectedModelIds,
    selectedTopologyIds,
    selectedInitialConditionIds,
    parameterSweep,
    seedPlan,
    stepPlan,
    selectedObservableIds,
    repeatCount,
    createdAt = new Date().toISOString()
}) {
    const errors = [];
    if (!selectedModelIds.length) errors.push('Select at least one model.');
    if (!selectedTopologyIds.length) errors.push('Select at least one compatible topology.');
    if (!selectedInitialConditionIds.length) errors.push('Select at least one initial condition.');
    if (!selectedObservableIds.length) errors.push('Select at least one observable.');

    const seeds = resolveSeedPlan(seedPlan);
    const stepCounts = resolveStepPlan(stepPlan);
    if (!seeds.length) errors.push('Every batch needs explicit stored seeds.');
    if (!stepCounts.length) errors.push('Choose at least one step count.');
    if (errors.length) return { ok: false, errors, config: null };

    const batchIdPayload = {
        batchName,
        selectedModelIds,
        selectedTopologyIds,
        selectedInitialConditionIds,
        parameterSweep,
        seedPlan,
        stepPlan,
        selectedObservableIds,
        repeatCount,
        createdAt
    };
    const batchId = `batch.${labHash(batchIdPayload, 'id').replace(':', '.')}`;
    const sweepEntries = parameterSweep.map((sweep) => [sweep.parameterId, expandSweep(sweep, batchId)]);
    const parameterRows = sweepEntries.length ? cartesian(sweepEntries) : [{}];
    const repeatTotal = Math.max(1, Math.min(1000, Math.floor(Number(repeatCount) || 1)));
    const runMatrix = [];
    let matrixIndex = 0;

    for (const modelId of selectedModelIds) {
        const model = modelById(modelId);
        for (const topologyId of selectedTopologyIds) {
            for (const initialConditionId of selectedInitialConditionIds) {
                for (const parameters of parameterRows) {
                    for (const seed of seeds) {
                        for (const steps of stepCounts) {
                            for (let repeatIndex = 0; repeatIndex < repeatTotal; repeatIndex += 1) {
                                const repeatedSeed = repeatTotal === 1 ? seed : `${seed}:repeat-${repeatIndex + 1}`;
                                const experimentConfig = createExperimentConfig({
                                    batchId,
                                    model,
                                    topologyId,
                                    initialConditionId,
                                    parameters,
                                    seed: repeatedSeed,
                                    steps,
                                    observables: selectedObservableIds,
                                    matrixIndex,
                                    repeatIndex,
                                    createdAt
                                });
                                const run = {
                                    runId: `${batchId}.run.${String(matrixIndex + 1).padStart(5, '0')}`,
                                    experimentConfig,
                                    modelId: model.id,
                                    topologyId,
                                    initialConditionId,
                                    parameters,
                                    seed: repeatedSeed,
                                    steps,
                                    observables: selectedObservableIds,
                                    repeatIndex,
                                    matrixIndex,
                                    status: 'queued',
                                    runHash: ''
                                };
                                run.runHash = labHash(run, 'run');
                                runMatrix.push(run);
                                matrixIndex += 1;
                            }
                        }
                    }
                }
            }
        }
    }

    const selectedModel = modelById(selectedModelIds[0]);
    const selectedObservables = selectedModel.observables.filter((observable) => selectedObservableIds.includes(observable.id));
    const estimate = estimateBatch(runMatrix.length, selectedObservables, Math.max(...stepCounts));
    const config = {
        schemaName: 'LabBatchExperimentConfig',
        schemaVersion: LAB_SCHEMA_VERSION,
        batchId,
        batchName: batchName || 'Topoboard Labs batch',
        selectedModelIds,
        selectedTopologyIds,
        selectedInitialConditionIds,
        parameterSweep,
        seedPlan: { ...seedPlan, resolvedSeeds: seeds },
        stepPlan: { ...stepPlan, resolvedStepCounts: stepCounts },
        selectedObservableIds,
        repeatCount: repeatTotal,
        runMatrix,
        appVersion: LAB_APP_VERSION,
        createdAt,
        batchHash: '',
        validationLevel: selectedModel.validationLevel,
        exportOptions: {
            formats: ['json', 'csv'],
            includeEventLogs: true,
            includeTopologyAdjacency: true
        },
        metadata: {
            estimate,
            reproducibilityNotes: [
                'Seeds are resolved before running and stored in each LabExperimentConfig.',
                'Runs use existing Topoboard Labs model adapters; no hidden seed randomization is applied.'
            ]
        }
    };
    config.batchHash = labHash({ ...config, batchHash: '', reproducibilityMetadata: undefined }, 'batch');
    config.reproducibilityMetadata = buildBasicReproducibilityMetadata({
        schemaName: 'LabBatchExperimentConfig',
        modelId: selectedModel.id,
        modelVersion: `${selectedModel.id}@${LAB_APP_VERSION}`,
        rngSeed: seeds[0] ?? null,
        seedPlan: config.seedPlan,
        configHash: config.batchHash,
        deterministicReplaySupported: true,
        createdAt
    });
    return { ok: true, errors: [], config, estimate };
}

export function resultsToSummaryStatistics(batchConfig, runResults, failedRuns, startedAt = Date.now()) {
    const observableSummary = {};
    const topologySummary = {};
    const parameterSummary = {};
    const seedVariability = {};

    for (const result of runResults) {
        const topologyId = result.config.topologyId;
        topologySummary[topologyId] ||= { completedRuns: 0, finalSteps: [] };
        topologySummary[topologyId].completedRuns += 1;
        topologySummary[topologyId].finalSteps.push(result.summary.finalStep);
        for (const [observableId, value] of Object.entries(result.summary.observableSummary || {})) {
            observableSummary[observableId] ||= { values: [], byTopology: {} };
            observableSummary[observableId].values.push(value);
            observableSummary[observableId].byTopology[topologyId] ||= [];
            observableSummary[observableId].byTopology[topologyId].push(value);
            const seedKey = String(result.config.seed);
            seedVariability[observableId] ||= {};
            seedVariability[observableId][seedKey] ||= [];
            seedVariability[observableId][seedKey].push(value);
        }
        for (const [parameterId, parameterValue] of Object.entries(result.config.parameters || {})) {
            parameterSummary[parameterId] ||= {};
            const key = stableStringify(parameterValue);
            parameterSummary[parameterId][key] = (parameterSummary[parameterId][key] || 0) + 1;
        }
    }

    return {
        totalRuns: batchConfig.runMatrix.length,
        completedRuns: runResults.length,
        failedRuns: failedRuns.length,
        cancelledRuns: batchConfig.runMatrix.length - runResults.length - failedRuns.length,
        observableSummary,
        topologySummary,
        parameterSummary,
        seedVariability,
        runtimeMs: Date.now() - startedAt
    };
}

export function buildExportManifest(batchConfig, batchResultHash = '') {
    const exportedAt = new Date().toISOString();
    const manifest = {
        schemaName: 'LabBatchExportManifest',
        schemaVersion: LAB_SCHEMA_VERSION,
        batchId: batchConfig.batchId,
        batchHash: batchConfig.batchHash,
        batchResultHash,
        appVersion: batchConfig.appVersion,
        createdAt: batchConfig.createdAt,
        exportedAt,
        files: [
            { fileName: 'batch-config.json', mediaType: 'application/json', description: 'LabBatchExperimentConfig.' },
            { fileName: 'experiment-configs.json', mediaType: 'application/json', description: 'Expanded LabExperimentConfig objects.' },
            { fileName: 'results.json', mediaType: 'application/json', description: 'LabExperimentResult records.' },
            { fileName: 'observable-time-series.csv', mediaType: 'text/csv', description: 'Selected observable samples by run and step.' },
            { fileName: 'summary.csv', mediaType: 'text/csv', description: 'Final per-run summary values.' },
            { fileName: 'event-logs.csv', mediaType: 'text/csv', description: 'Event log rows.' },
            { fileName: 'topology-adjacency.json', mediaType: 'application/json', description: 'Topology metadata and adjacency/export approximations.' }
        ],
        formats: ['json', 'csv'],
        reproducibilityNotes: batchConfig.metadata?.reproducibilityNotes || [],
        validationWarnings: batchConfig.metadata?.estimate?.warnings || []
    };
    manifest.manifestHash = labHash({ ...manifest, manifestHash: '' }, 'manifest');
    return manifest;
}

export function escapeCsv(value) {
    const text = typeof value === 'string' ? value : stableStringify(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows, columns) {
    return [
        columns.join(','),
        ...rows.map((row) => columns.map((column) => escapeCsv(row[column] ?? '')).join(','))
    ].join('\n');
}

export function downloadText(filename, text, mediaType = 'text/plain') {
    const blob = new Blob([text], { type: mediaType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}
