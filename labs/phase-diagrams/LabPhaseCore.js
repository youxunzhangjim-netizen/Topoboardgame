import { labHash, stableStringify } from '../experiments/LabExperimentRegistry.js';

export const REGIME_LABELS = [
    'stable',
    'mixed',
    'fluctuating',
    'extinct',
    'percolating',
    'non-percolating',
    'logical-success',
    'logical-failure',
    'memory-alive',
    'memory-lost',
    'unknown'
];

export function isSweepableParameter(parameter) {
    return !['boolean', 'choice'].includes(parameter.kind) && Number.isFinite(Number(parameter.defaultValue));
}

export function phaseSupportForModel(model) {
    const sweepableParameters = model.parameters.filter(isSweepableParameter);
    const reasons = [];
    if (sweepableParameters.length < 2) reasons.push('Needs at least two numeric sweep parameters.');
    if (!model.observables?.length) reasons.push('Needs at least one observable.');
    return {
        ok: reasons.length === 0,
        sweepableParameters,
        reasons
    };
}

export function numericValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (Array.isArray(value)) return value.map(numericValue).reduce((sum, entry) => sum + entry, 0);
    if (value && typeof value === 'object') {
        const entries = Object.values(value).map(numericValue).filter(Number.isFinite);
        return entries.length ? entries.reduce((sum, entry) => sum + entry, 0) / entries.length : NaN;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
}

export function parseAxisValues({ inputType, min, max, count, listValue, integer = false }) {
    const safeCount = Math.max(1, Math.min(80, Math.floor(Number(count) || 1)));
    if (inputType === 'numeric_list') {
        return uniqueNumbers(String(listValue || '')
            .split(',')
            .map((entry) => Number(entry.trim()))
            .filter(Number.isFinite), integer);
    }
    const first = Number(min);
    const last = Number(max);
    if (!Number.isFinite(first) || !Number.isFinite(last)) return [];
    if (safeCount === 1) return uniqueNumbers([first], integer);
    if (inputType === 'log_range') {
        if (first <= 0 || last <= 0) return [];
        const logFirst = Math.log(first);
        const logLast = Math.log(last);
        return uniqueNumbers(Array.from({ length: safeCount }, (_, index) => {
            const t = index / (safeCount - 1);
            return Number(Math.exp(logFirst + (logLast - logFirst) * t).toFixed(8));
        }), integer);
    }
    return uniqueNumbers(Array.from({ length: safeCount }, (_, index) => {
        const t = index / (safeCount - 1);
        return Number((first + (last - first) * t).toFixed(8));
    }), integer || inputType === 'integer_range');
}

function uniqueNumbers(values, integer) {
    return [...new Set(values
        .map((value) => integer ? Math.round(value) : value)
        .filter(Number.isFinite))];
}

export function axisToSweep(axis) {
    if (axis.inputType === 'numeric_range' || axis.inputType === 'integer_range') {
        return {
            parameterId: axis.parameterId,
            label: axis.label,
            mode: 'range',
            range: {
                start: axis.values[0],
                end: axis.values.at(-1),
                steps: axis.values.length,
                integer: axis.integer || axis.inputType === 'integer_range'
            }
        };
    }
    return {
        parameterId: axis.parameterId,
        label: axis.label,
        mode: 'list',
        values: axis.values
    };
}

function stats(values) {
    const numeric = values.map(numericValue).filter(Number.isFinite);
    if (!numeric.length) return { mean: null, variance: null, min: null, max: null, count: 0 };
    const mean = numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
    const variance = numeric.reduce((sum, value) => sum + (value - mean) ** 2, 0) / numeric.length;
    return {
        mean,
        variance,
        min: Math.min(...numeric),
        max: Math.max(...numeric),
        count: numeric.length
    };
}

function labelPairForObservable(observableId, high) {
    const id = String(observableId).toLowerCase();
    if (id.includes('logical') || id.includes('recovery')) return high ? 'logical-success' : 'logical-failure';
    if (id.includes('memory') || id.includes('braid') || id.includes('fusion')) return high ? 'memory-alive' : 'memory-lost';
    if (id.includes('percol') || id.includes('wrapping') || id.includes('cluster')) return high ? 'percolating' : 'non-percolating';
    if (id.includes('population') || id.includes('density') || id.includes('count')) return high ? 'stable' : 'extinct';
    return high ? 'stable' : 'mixed';
}

export function classifyRegime({
    topologyId,
    xValue,
    yValue,
    observableId,
    method,
    values,
    failedRunCount = 0,
    lower = 0.33,
    upper = 0.66,
    limitations = []
}) {
    const measured = stats(values);
    const width = Math.max(1e-9, Math.abs(Number(upper) - Number(lower)));
    let regimeLabel = 'unknown';
    let confidence = 0;
    if (measured.count) {
        const mean = Number(measured.mean);
        const variance = Number(measured.variance || 0);
        if (method === 'variance') {
            regimeLabel = variance > Number(upper || 0.66) ? 'fluctuating' : 'stable';
            confidence = 1 / (1 + variance);
        } else if (method === 'binning') {
            if (mean <= Number(lower)) regimeLabel = labelPairForObservable(observableId, false);
            else if (mean >= Number(upper)) regimeLabel = labelPairForObservable(observableId, true);
            else regimeLabel = 'mixed';
            confidence = Math.min(1, Math.abs(mean - (Number(lower) + Number(upper)) / 2) / width);
        } else {
            regimeLabel = mean >= Number(upper) ? labelPairForObservable(observableId, true)
                : mean <= Number(lower) ? labelPairForObservable(observableId, false)
                    : 'mixed';
            confidence = Math.min(1, Math.max(0.05, 1 - Math.sqrt(variance) / (Math.abs(mean) + 1)));
        }
        if (failedRunCount > 0) confidence = Math.max(0, confidence * (measured.count / (measured.count + failedRunCount)));
    }
    const payload = {
        topologyId,
        xValue,
        yValue,
        observableId,
        method,
        regimeLabel,
        meanValue: measured.mean,
        variance: measured.variance,
        confidence,
        lower,
        upper,
        sampleCount: measured.count,
        failedRunCount,
        limitations
    };
    return {
        id: `regime.${labHash(payload, 'id').replace(':', '.')}`,
        topologyId,
        xValue,
        yValue,
        observableId,
        method,
        regimeLabel,
        meanValue: measured.mean,
        variance: measured.variance,
        confidence,
        thresholds: { lower: Number(lower), upper: Number(upper) },
        sampleCount: measured.count,
        failedRunCount,
        limitations,
        classificationHash: labHash(payload, 'regime')
    };
}

function cellKey(topologyId, xValue, yValue) {
    return `${topologyId}::${stableStringify(xValue)}::${stableStringify(yValue)}`;
}

export function buildPhaseScanResult({
    phaseConfig,
    batchConfig,
    runResults,
    failedRuns,
    xParameterId,
    yParameterId,
    observableIds,
    classificationMethod,
    lower,
    upper,
    topologyLookup,
    warnings = []
}) {
    const cells = new Map();
    const ensureCell = (topologyId, xValue, yValue) => {
        const key = cellKey(topologyId, xValue, yValue);
        if (!cells.has(key)) {
            cells.set(key, {
                topologyId,
                xValue,
                yValue,
                runIds: [],
                valuesByObservable: Object.fromEntries(observableIds.map((id) => [id, []])),
                selectedSnapshotIds: [],
                failedRunCount: 0,
                warnings: []
            });
        }
        return cells.get(key);
    };

    for (const run of batchConfig.runMatrix || []) {
        ensureCell(run.topologyId, Number(run.parameters?.[xParameterId]), Number(run.parameters?.[yParameterId]));
    }
    for (const failed of failedRuns || []) {
        const parameters = failed.experimentConfig?.parameters || {};
        const cell = ensureCell(failed.experimentConfig?.topologyId, Number(parameters[xParameterId]), Number(parameters[yParameterId]));
        cell.failedRunCount += 1;
        cell.warnings.push(failed.error);
    }
    for (const result of runResults || []) {
        const parameters = result.config.parameters || {};
        const cell = ensureCell(result.config.topologyId, Number(parameters[xParameterId]), Number(parameters[yParameterId]));
        cell.runIds.push(result.metadata?.runId || result.config.experimentId);
        for (const observableId of observableIds) {
            cell.valuesByObservable[observableId] ||= [];
            cell.valuesByObservable[observableId].push(result.summary.observableSummary?.[observableId]);
        }
        const snapshotId = result.snapshots?.at(-1)?.id;
        if (snapshotId) cell.selectedSnapshotIds.push(snapshotId);
        cell.warnings.push(...(result.warnings || []));
    }

    const gridCells = [...cells.values()].map((cell) => {
        const observableSummary = {};
        for (const observableId of observableIds) {
            const observableStats = stats(cell.valuesByObservable[observableId] || []);
            observableSummary[observableId] = observableStats.mean;
        }
        const classification = classifyRegime({
            topologyId: cell.topologyId,
            xValue: cell.xValue,
            yValue: cell.yValue,
            observableId: phaseConfig.classificationObservableId,
            method: classificationMethod,
            values: cell.valuesByObservable[phaseConfig.classificationObservableId] || [],
            failedRunCount: cell.failedRunCount,
            lower,
            upper,
            limitations: [
                'Finite-size discrete scan; interpret boundaries as regime estimates.',
                ...(cell.warnings.length ? ['Cell contains run warnings.'] : [])
            ]
        });
        const payload = {
            topologyId: cell.topologyId,
            xValue: cell.xValue,
            yValue: cell.yValue,
            observableSummary,
            classificationHash: classification.classificationHash
        };
        return {
            topologyId: cell.topologyId,
            xValue: cell.xValue,
            yValue: cell.yValue,
            runIds: cell.runIds,
            observableSummary,
            classification,
            selectedSnapshotIds: cell.selectedSnapshotIds.slice(0, 4),
            warnings: [...new Set(cell.warnings)],
            cellHash: labHash(payload, 'phase-cell')
        };
    });

    const classifications = gridCells.map((cell) => cell.classification);
    const topologyComparisons = phaseConfig.topologyIds.map((topologyId) => {
        const topologyCells = gridCells.filter((cell) => cell.topologyId === topologyId);
        const dominantRegimes = Object.fromEntries(REGIME_LABELS.map((label) => [label, 0]));
        for (const cell of topologyCells) dominantRegimes[cell.classification.regimeLabel] += 1;
        const topology = topologyLookup(topologyId);
        return {
            topologyId,
            topologyHash: topology?.hash || topology?.topologyHash || '',
            completedCells: topologyCells.filter((cell) => cell.runIds.length).length,
            failedCells: topologyCells.filter((cell) => cell.classification.failedRunCount > 0).length,
            dominantRegimes,
            boundaryEstimate: {
                parameterPath: topologyCells
                    .filter((cell) => cell.classification.regimeLabel === 'mixed')
                    .map((cell) => ({ x: cell.xValue, y: cell.yValue, confidence: cell.classification.confidence })),
                limitations: ['Boundary estimate uses grid cells labeled mixed; it is not a continuum phase transition proof.']
            }
        };
    });

    const manifest = {
        phaseScanId: phaseConfig.phaseScanId,
        phaseScanHash: phaseConfig.experimentHash,
        batchHash: batchConfig.batchHash,
        appVersion: phaseConfig.appVersion,
        files: [
            { fileName: 'phase-scan-config.json', mediaType: 'application/json', description: 'LabPhaseScanConfig.' },
            { fileName: 'phase-scan-result.json', mediaType: 'application/json', description: 'LabPhaseScanResult with classifications.' },
            { fileName: 'phase-grid.csv', mediaType: 'text/csv', description: 'Cell-level regime map and observable summaries.' },
            { fileName: 'phase-classifications.csv', mediaType: 'text/csv', description: 'Regime labels, confidence, and thresholds.' },
            { fileName: 'phase-manifest.json', mediaType: 'application/json', description: 'Export manifest and reproducibility notes.' }
        ],
        reproducibilityNotes: [
            'The scan stores axis values, topology hashes, resolved seeds, repeat counts, app version, and batch hash.',
            'Replay uses the existing Lab Batch Runner and deterministic seeds from each LabExperimentConfig.'
        ],
        validationWarnings: [
            'Use regime map terminology for toy and estimator models.',
            ...warnings
        ]
    };
    const resultPayload = {
        phaseConfig,
        batchHash: batchConfig.batchHash,
        classifications,
        failedRuns
    };
    return {
        config: phaseConfig,
        batchConfig,
        batchRunMatrix: batchConfig.runMatrix,
        experimentConfigs: batchConfig.runMatrix.map((run) => run.experimentConfig),
        runResults,
        failedRuns,
        gridCells,
        classifications,
        topologyComparisons,
        observableCurves: buildObservableCurves(runResults, observableIds),
        snapshots: runResults.flatMap((result) => result.snapshots || []).slice(0, 80),
        warnings,
        manifest,
        resultHash: labHash(resultPayload, 'phase-result'),
        metadata: {
            phaseMapLanguage: phaseConfig.validationLevel === 'benchmarked' || phaseConfig.validationLevel === 'research_grade'
                ? 'phase diagram'
                : 'regime map'
        }
    };
}

function buildObservableCurves(runResults, observableIds) {
    const curves = {};
    for (const observableId of observableIds) {
        curves[observableId] = [];
        for (const result of runResults || []) {
            const samples = result.observableTimeSeries?.[observableId] || [];
            curves[observableId].push({
                runId: result.metadata?.runId || result.config.experimentId,
                topologyId: result.config.topologyId,
                seed: result.config.seed,
                points: samples.map((sample) => ({ step: sample.step, value: sample.value }))
            });
        }
    }
    return curves;
}

export function phaseGridRows(phaseResult) {
    return (phaseResult?.gridCells || []).map((cell) => ({
        topologyId: cell.topologyId,
        xValue: cell.xValue,
        yValue: cell.yValue,
        regimeLabel: cell.classification.regimeLabel,
        meanValue: cell.classification.meanValue,
        variance: cell.classification.variance,
        confidence: cell.classification.confidence,
        sampleCount: cell.classification.sampleCount,
        failedRunCount: cell.classification.failedRunCount,
        cellHash: cell.cellHash
    }));
}

export function classificationRows(phaseResult) {
    return (phaseResult?.classifications || []).map((classification) => ({
        id: classification.id,
        topologyId: classification.topologyId,
        xValue: classification.xValue,
        yValue: classification.yValue,
        observableId: classification.observableId,
        method: classification.method,
        regimeLabel: classification.regimeLabel,
        meanValue: classification.meanValue,
        variance: classification.variance,
        confidence: classification.confidence,
        lowerThreshold: classification.thresholds?.lower,
        upperThreshold: classification.thresholds?.upper,
        sampleCount: classification.sampleCount,
        failedRunCount: classification.failedRunCount,
        classificationHash: classification.classificationHash
    }));
}
