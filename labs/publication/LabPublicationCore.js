import {
    LAB_APP_VERSION,
    LAB_ENGINE_VERSION,
    LAB_HASH_VERSION,
    LAB_SCHEMA_VERSION,
    buildReproducibilityBundle,
    buildValidationReport,
    createSampleExperiment,
    downloadText,
    hashAuditForObject,
    labHash,
    loadStoredValidationCandidates,
    normalizeLoadedObject,
    stableStringify,
    targetId,
    toCsv as baseToCsv,
    warning
} from '../validation/LabValidationCore.js';
import {
    MODEL_REGISTRY,
    TOPOLOGY_REGISTRY,
    buildBasicReproducibilityMetadata,
    modelById,
    topologyById
} from '../experiments/LabExperimentRegistry.js';
import {
    computeCycleData,
    computeTopologyInvariants
} from '../topology-compare/LabTopologyCompareCore.js';

export {
    LAB_APP_VERSION,
    LAB_SCHEMA_VERSION,
    downloadText,
    labHash,
    loadStoredValidationCandidates,
    normalizeLoadedObject,
    stableStringify,
};

export function toCsv(rows, columns = null) {
    const resolvedColumns = columns || Object.keys(rows[0] || {});
    return baseToCsv(rows, resolvedColumns);
}

export const PUBLICATION_STORAGE_KEY = 'topoboard-labs:last-publication-bundle';

export const EXPORT_PURPOSES = [
    { id: 'exploratory_sharing', label: 'Exploratory sharing' },
    { id: 'classroom_demonstration', label: 'Classroom demonstration' },
    { id: 'reproducibility_bundle', label: 'Reproducibility bundle' },
    { id: 'supplementary_material', label: 'Supplementary material' },
    { id: 'dataset_release', label: 'Dataset release' },
    { id: 'benchmark_report', label: 'Benchmark report' },
    { id: 'topology_comparison_report', label: 'Topology comparison report' },
    { id: 'phase_regime_scan_report', label: 'Phase / regime scan report' }
];

export const LICENSE_OPTIONS = [
    { id: 'none', name: 'No license selected', url: '' },
    { id: 'cc-by-4.0', name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
    { id: 'cc-by-sa-4.0', name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    { id: 'cc0-1.0', name: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
    { id: 'mit', name: 'MIT for code-like examples', url: 'https://opensource.org/license/mit/' },
    { id: 'custom', name: 'Custom license text', url: '' }
];

export const FIGURE_TYPES = [
    { id: 'observable_time_series', label: 'Observable time series' },
    { id: 'final_state_snapshot', label: 'Final state snapshot' },
    { id: 'event_timeline', label: 'Topology-sensitive event timeline' },
    { id: 'regime_map', label: 'Regime map' },
    { id: 'topology_comparison', label: 'Observable comparison by topology' }
];

export const TABLE_TYPES = [
    { id: 'experiment_configuration', label: 'Experiment configuration table' },
    { id: 'model_metadata', label: 'Model metadata table' },
    { id: 'observable_definitions', label: 'Observable definition table' },
    { id: 'validation_warnings', label: 'Validation warning table' },
    { id: 'topology_invariants', label: 'Topology invariant table' },
    { id: 'export_manifest', label: 'Export manifest table' }
];

export const ARTIFACT_GROUPS = {
    coreFiles: [
        ['experiment_config_json', 'experiment config JSON'],
        ['experiment_result_json', 'experiment result JSON'],
        ['batch_config_json', 'batch config JSON'],
        ['batch_result_json', 'batch result JSON'],
        ['phase_scan_config_json', 'phase scan config JSON'],
        ['phase_scan_result_json', 'phase scan result JSON'],
        ['topology_comparison_config_json', 'topology comparison config JSON'],
        ['topology_comparison_result_json', 'topology comparison result JSON'],
        ['validation_report_json', 'validation report JSON'],
        ['benchmark_report_json', 'benchmark report JSON']
    ],
    dataFiles: [
        ['observable_time_series_csv', 'observable time series CSV'],
        ['summary_statistics_csv', 'summary statistics CSV'],
        ['event_log_csv', 'event log CSV'],
        ['topology_invariant_table_csv', 'topology invariant table CSV'],
        ['divergence_score_csv', 'divergence score CSV'],
        ['regime_classification_csv', 'regime classification CSV'],
        ['heatmap_matrix_csv', 'heatmap matrix CSV'],
        ['adjacency_data_json', 'adjacency data JSON'],
        ['seam_and_cycle_data_json', 'seam and cycle data JSON'],
        ['state_snapshots_json', 'state snapshots JSON'],
        ['replay_event_log_json', 'replay event log JSON']
    ],
    documentationFiles: [
        ['readme_md', 'README.md'],
        ['methods_summary_md', 'methods summary'],
        ['data_dictionary_json', 'data dictionary'],
        ['model_description_md', 'model description'],
        ['observable_definitions_md', 'observable definitions'],
        ['topology_definitions_md', 'topology definitions'],
        ['validation_limitations_md', 'validation limitations'],
        ['reproducibility_notes_md', 'reproducibility notes'],
        ['benchmark_notes_md', 'benchmark notes'],
        ['warning_summary_md', 'warning summary']
    ],
    citationFiles: [
        ['citation_metadata_json', 'citation metadata JSON'],
        ['bibtex_entry', 'BibTeX entry'],
        ['csl_json', 'CSL JSON'],
        ['suggested_citation_text', 'suggested citation text']
    ],
    visualFiles: [
        ['svg_figures', 'SVG figures'],
        ['figure_metadata_json', 'figure metadata JSON'],
        ['figure_data_csv', 'figure data CSV']
    ],
    auditFiles: [
        ['export_manifest_json', 'export manifest JSON'],
        ['checksum_manifest_json', 'checksum manifest'],
        ['hash_audit_report_json', 'hash audit report'],
        ['schema_version_report_json', 'schema version report'],
        ['provenance_record_json', 'provenance record']
    ]
};

const DEFAULT_ARTIFACTS = {
    exploratory_sharing: {
        coreFiles: ['experiment_config_json', 'experiment_result_json'],
        dataFiles: ['state_snapshots_json'],
        documentationFiles: ['readme_md'],
        citationFiles: ['suggested_citation_text'],
        visualFiles: ['svg_figures', 'figure_metadata_json'],
        auditFiles: ['export_manifest_json']
    },
    classroom_demonstration: {
        coreFiles: ['experiment_config_json', 'experiment_result_json'],
        dataFiles: ['observable_time_series_csv', 'summary_statistics_csv'],
        documentationFiles: ['readme_md', 'model_description_md', 'observable_definitions_md'],
        citationFiles: ['suggested_citation_text'],
        visualFiles: ['svg_figures', 'figure_metadata_json'],
        auditFiles: ['export_manifest_json']
    },
    reproducibility_bundle: {
        coreFiles: ['experiment_config_json', 'experiment_result_json', 'validation_report_json', 'benchmark_report_json'],
        dataFiles: ['observable_time_series_csv', 'event_log_csv', 'replay_event_log_json', 'adjacency_data_json'],
        documentationFiles: ['readme_md', 'methods_summary_md', 'data_dictionary_json', 'reproducibility_notes_md', 'warning_summary_md'],
        citationFiles: ['citation_metadata_json', 'bibtex_entry', 'suggested_citation_text'],
        visualFiles: ['figure_metadata_json', 'figure_data_csv'],
        auditFiles: ['export_manifest_json', 'checksum_manifest_json', 'hash_audit_report_json', 'schema_version_report_json', 'provenance_record_json']
    },
    supplementary_material: {
        coreFiles: ['experiment_config_json', 'experiment_result_json', 'validation_report_json', 'benchmark_report_json'],
        dataFiles: ['observable_time_series_csv', 'summary_statistics_csv', 'event_log_csv', 'topology_invariant_table_csv'],
        documentationFiles: ['readme_md', 'methods_summary_md', 'data_dictionary_json', 'validation_limitations_md', 'benchmark_notes_md'],
        citationFiles: ['citation_metadata_json', 'bibtex_entry', 'csl_json', 'suggested_citation_text'],
        visualFiles: ['svg_figures', 'figure_metadata_json', 'figure_data_csv'],
        auditFiles: ['export_manifest_json', 'checksum_manifest_json', 'hash_audit_report_json', 'schema_version_report_json', 'provenance_record_json']
    },
    dataset_release: {
        coreFiles: ['experiment_config_json', 'experiment_result_json', 'batch_config_json', 'batch_result_json', 'phase_scan_config_json', 'phase_scan_result_json', 'topology_comparison_config_json', 'topology_comparison_result_json', 'validation_report_json', 'benchmark_report_json'],
        dataFiles: ['observable_time_series_csv', 'summary_statistics_csv', 'event_log_csv', 'topology_invariant_table_csv', 'divergence_score_csv', 'regime_classification_csv', 'heatmap_matrix_csv', 'adjacency_data_json', 'seam_and_cycle_data_json', 'state_snapshots_json', 'replay_event_log_json'],
        documentationFiles: ['readme_md', 'methods_summary_md', 'data_dictionary_json', 'model_description_md', 'observable_definitions_md', 'topology_definitions_md', 'validation_limitations_md', 'reproducibility_notes_md', 'benchmark_notes_md', 'warning_summary_md'],
        citationFiles: ['citation_metadata_json', 'bibtex_entry', 'csl_json', 'suggested_citation_text'],
        visualFiles: ['svg_figures', 'figure_metadata_json', 'figure_data_csv'],
        auditFiles: ['export_manifest_json', 'checksum_manifest_json', 'hash_audit_report_json', 'schema_version_report_json', 'provenance_record_json']
    },
    benchmark_report: {
        coreFiles: ['experiment_config_json', 'experiment_result_json', 'validation_report_json', 'benchmark_report_json'],
        dataFiles: ['summary_statistics_csv', 'event_log_csv'],
        documentationFiles: ['readme_md', 'methods_summary_md', 'benchmark_notes_md', 'warning_summary_md'],
        citationFiles: ['citation_metadata_json', 'bibtex_entry', 'suggested_citation_text'],
        visualFiles: ['figure_metadata_json'],
        auditFiles: ['export_manifest_json', 'checksum_manifest_json', 'hash_audit_report_json', 'provenance_record_json']
    },
    topology_comparison_report: {
        coreFiles: ['topology_comparison_config_json', 'topology_comparison_result_json', 'validation_report_json', 'benchmark_report_json'],
        dataFiles: ['topology_invariant_table_csv', 'divergence_score_csv', 'adjacency_data_json', 'seam_and_cycle_data_json', 'observable_time_series_csv'],
        documentationFiles: ['readme_md', 'methods_summary_md', 'data_dictionary_json', 'topology_definitions_md', 'warning_summary_md'],
        citationFiles: ['citation_metadata_json', 'bibtex_entry', 'suggested_citation_text'],
        visualFiles: ['svg_figures', 'figure_metadata_json', 'figure_data_csv'],
        auditFiles: ['export_manifest_json', 'checksum_manifest_json', 'hash_audit_report_json', 'schema_version_report_json', 'provenance_record_json']
    },
    phase_regime_scan_report: {
        coreFiles: ['phase_scan_config_json', 'phase_scan_result_json', 'validation_report_json', 'benchmark_report_json'],
        dataFiles: ['regime_classification_csv', 'heatmap_matrix_csv', 'summary_statistics_csv', 'observable_time_series_csv'],
        documentationFiles: ['readme_md', 'methods_summary_md', 'data_dictionary_json', 'validation_limitations_md', 'warning_summary_md'],
        citationFiles: ['citation_metadata_json', 'bibtex_entry', 'suggested_citation_text'],
        visualFiles: ['svg_figures', 'figure_metadata_json', 'figure_data_csv'],
        auditFiles: ['export_manifest_json', 'checksum_manifest_json', 'hash_audit_report_json', 'schema_version_report_json', 'provenance_record_json']
    }
};

function nowIso() {
    return new Date().toISOString();
}

function pubWarning(warningId, severity, affectedArtifact, message, recommendation, canProceed = true) {
    return { warningId, severity, affectedArtifact, message, recommendation, canProceed };
}

function unique(values) {
    return [...new Set(values.filter((value) => value !== undefined && value !== null && String(value) !== ''))];
}

function safeText(value, fallback = '-') {
    const textValue = value === undefined || value === null || value === '' ? fallback : String(value);
    return textValue;
}

function localizedText(value, fallback = '') {
    if (value && typeof value === 'object') return value.en || value.zh || Object.values(value)[0] || fallback;
    return value === undefined || value === null || value === '' ? fallback : String(value);
}

function jsonBytes(value) {
    return new TextEncoder().encode(typeof value === 'string' ? value : stableStringify(value)).length;
}

function fileEntry(path, mediaType, description, artifactCategory, content) {
    const checksum = labHash(content, 'file');
    return {
        path,
        mediaType,
        description,
        artifactCategory,
        checksum,
        sizeBytes: jsonBytes(content)
    };
}

function formatModelName(modelId) {
    const model = modelById(modelId);
    return localizedText(model.name, modelId);
}

function formatTopologyName(topologyId) {
    const topology = topologyById(topologyId);
    return localizedText(topology.name, topologyId);
}

function sourceHash(loaded) {
    return labHash(loaded.object, 'source-object');
}

function validationLevelFor(loaded) {
    const levels = loaded.modelIds.map((id) => modelById(id).validationLevel || 'toy');
    if (!levels.length) return 'unknown';
    if (levels.includes('toy')) return 'toy';
    if (levels.includes('estimator')) return 'estimator';
    if (levels.includes('benchmarked')) return 'benchmarked';
    return levels[0] || 'unknown';
}

export function defaultArtifactsForPurpose(purpose) {
    const defaults = DEFAULT_ARTIFACTS[purpose] || DEFAULT_ARTIFACTS.exploratory_sharing;
    return Object.fromEntries(Object.entries(ARTIFACT_GROUPS).map(([group]) => [group, [...(defaults[group] || [])]]));
}

export function sourceSummary(loaded, report) {
    const config = loaded.config || {};
    const metadata = buildBasicReproducibilityMetadata(config, { resultHash: loaded.result?.resultHash || loaded.result?.experimentResultHash || '' });
    const modelIds = loaded.modelIds.length ? loaded.modelIds : ['unknown'];
    const topologyIds = loaded.topologyIds;
    const localRuleIds = unique([
        config.localRuleId,
        ...(loaded.configs || []).map((entry) => entry.localRuleId)
    ]);
    const ruleHashes = unique([
        config.ruleHash,
        config.localRuleHash,
        metadata.ruleHash,
        ...(loaded.configs || []).map((entry) => entry.ruleHash || entry.localRuleHash)
    ]);
    const missingMetadata = [];
    if (!loaded.config) missingMetadata.push('config');
    if (!loaded.result) missingMetadata.push('result');
    if (!topologyIds.length) missingMetadata.push('topology ids');
    if (!localRuleIds.length && !ruleHashes.length) missingMetadata.push('local rule id or rule hash');
    if (!loaded.seedPlan) missingMetadata.push('seed plan');
    if (!loaded.observableIds.length) missingMetadata.push('observables');
    if (!report?.reportHash) missingMetadata.push('validation report hash');
    const benchmarkResults = report?.benchmarkResults || [];
    const passedBenchmarks = benchmarkResults.filter((entry) => entry.status === 'passed').length;
    return {
        objectId: targetId(loaded),
        objectType: loaded.objectType,
        modelIds,
        topologyIds,
        topologyHashes: topologyIds.map((id) => topologyById(id).hash || topologyById(id).topologyHash || ''),
        localRuleIds,
        ruleHashes,
        seedPlan: loaded.seedPlan,
        stepCount: loaded.stepCount,
        observableIds: loaded.observableIds,
        resultHash: loaded.result?.resultHash || loaded.result?.experimentResultHash || report?.hashAudit?.find((entry) => entry.objectType === 'result')?.hashValue || '',
        validationLevel: validationLevelFor(loaded),
        validationReportStatus: report?.reproducibilityStatus || 'not loaded',
        reproducibilityStatus: report?.replayStatus || report?.reproducibilityStatus || 'not checked',
        benchmarkStatus: `${passedBenchmarks}/${benchmarkResults.length} passed`,
        warnings: report?.warnings || [],
        missingMetadata
    };
}

export function computePublicationReadiness(loaded, report, selectedArtifacts, citationOptions = {}, licenseOptions = {}) {
    const summary = sourceSummary(loaded, report);
    const warnings = [];
    const hasConfigHash = Boolean(report?.hashAudit?.some((entry) => entry.objectType === 'config' && entry.hashValue));
    const hasResultHash = Boolean(summary.resultHash);
    const hasValidation = Boolean(report?.reportHash);
    const benchmarkResults = report?.benchmarkResults || [];
    const benchmarkFailed = benchmarkResults.some((entry) => entry.status === 'failed');
    const benchmarkPassed = benchmarkResults.some((entry) => entry.status === 'passed') && !benchmarkFailed;
    const metadataComplete = !summary.missingMetadata.length || summary.missingMetadata.every((item) => item === 'result');
    const selected = Object.values(selectedArtifacts || {}).flat();

    if (!hasValidation) warnings.push(pubWarning('publication.missing_validation_report', 'warning', 'validation/validation_report.json', 'Missing validation report.', 'Run or load validation checks before using this as evidence.'));
    if (!summary.topologyHashes.filter(Boolean).length) warnings.push(pubWarning('publication.missing_topology_hash', 'warning', 'topology/topology.json', 'Missing topology hash.', 'Export from a topology-aware Lab workflow.'));
    if (!summary.ruleHashes.filter(Boolean).length) warnings.push(pubWarning('publication.missing_rule_hash', 'warning', 'config/local-rule.json', 'Missing local rule hash.', 'Store local rule metadata before publication use.'));
    if (!summary.seedPlan) warnings.push(pubWarning('publication.missing_seed_plan', 'warning', 'config/experiment_config.json', 'Missing seed plan.', 'Store explicit seeds for deterministic replay.'));
    if (!hasResultHash) warnings.push(pubWarning('publication.missing_result_hash', 'warning', 'results/experiment_result.json', 'Missing result hash.', 'Load a result object if this bundle should support result audit.'));
    if (!selected.includes('data_dictionary_json')) warnings.push(pubWarning('publication.missing_data_dictionary', 'warning', 'docs/data_dictionary.json', 'Data dictionary is not selected.', 'Include a data dictionary for reusable datasets.'));
    if (!selected.includes('provenance_record_json')) warnings.push(pubWarning('publication.missing_provenance', 'warning', 'provenance/provenance.json', 'Provenance record is not selected.', 'Include provenance for reviewable exports.'));
    if (!selected.includes('validation_report_json')) warnings.push(pubWarning('publication.validation_not_exported', 'warning', 'validation/validation_report.json', 'Validation report is not selected for export.', 'Include validation reports for scientific sharing.'));
    if ((licenseOptions.licenseId || 'none') === 'none') warnings.push(pubWarning('publication.missing_license', 'warning', 'citation/citation.json', 'No license selected.', 'Choose a license when you want others to reuse the dataset.'));
    if (!String(citationOptions.creatorsText || '').trim()) warnings.push(pubWarning('publication.missing_creator_metadata', 'warning', 'citation/citation.json', 'Creator metadata is blank.', 'Enter creator names before public release.'));
    if (summary.validationLevel === 'toy') warnings.push(pubWarning('publication.toy_model', 'info', 'README.md', 'At least one model is labelled toy.', 'Use exploratory language unless benchmark coverage supports a stronger claim.'));
    if (benchmarkFailed) warnings.push(pubWarning('publication.benchmark_failed', 'error', 'validation/benchmark_report.json', 'At least one benchmark failed.', 'Inspect benchmark results before claiming support.'));
    if (!benchmarkResults.length) warnings.push(pubWarning('publication.benchmark_not_run', 'warning', 'validation/benchmark_report.json', 'No benchmark checks were found.', 'Run validation suite when benchmark support matters.'));

    const structuralErrors = warnings.filter((entry) => !entry.canProceed || entry.severity === 'critical');
    const reproducible = hasValidation
        && hasConfigHash
        && Boolean(summary.seedPlan)
        && Boolean(summary.topologyIds.length)
        && Boolean(summary.ruleHashes.length || summary.localRuleIds.length)
        && !structuralErrors.length
        && !benchmarkFailed
        && ['reproducible', 'partially_reproducible'].includes(report?.reproducibilityStatus);

    let readinessLevel = 'exploratory';
    if (reproducible) readinessLevel = 'reproducible';
    if (reproducible && benchmarkPassed) readinessLevel = 'benchmark_supported';
    if (
        reproducible
        && benchmarkPassed
        && metadataComplete
        && selected.includes('data_dictionary_json')
        && selected.includes('provenance_record_json')
        && selected.includes('export_manifest_json')
        && selected.includes('validation_report_json')
        && (licenseOptions.licenseId || 'none') !== 'none'
        && String(citationOptions.creatorsText || '').trim()
    ) {
        readinessLevel = 'publication_supporting';
    }

    return {
        readinessLevel,
        warnings: [...warnings, ...(report?.warnings || []).map((entry) => ({
            warningId: entry.warningId || `validation.${labHash(entry.message || entry, 'id')}`,
            severity: entry.severity || 'warning',
            affectedArtifact: entry.affectedObject || 'validation report',
            message: entry.message || String(entry),
            recommendation: entry.recommendation || 'Keep this warning visible in exported artifacts.',
            canProceed: entry.canProceed !== false
        }))],
        summary
    };
}

function observableRows(loaded) {
    const rows = [];
    const appendSeries = (series, runId = '') => {
        if (!series) return;
        if (Array.isArray(series)) {
            for (const sample of series) {
                rows.push({
                    runId,
                    step: sample.step ?? sample.t ?? sample.time ?? '',
                    observableId: sample.observableId ?? sample.id ?? sample.name ?? 'observable',
                    value: sample.value ?? sample.currentValue ?? '',
                    unit: sample.unit ?? sample.units ?? '',
                    estimatorType: sample.estimatorType ?? ''
                });
            }
            return;
        }
        for (const [observableId, values] of Object.entries(series)) {
            if (Array.isArray(values)) {
                values.forEach((value, index) => rows.push({ runId, step: index, observableId, value: typeof value === 'object' ? JSON.stringify(value) : value, unit: '', estimatorType: '' }));
            }
        }
    };
    appendSeries(loaded.result?.observableTimeSeries || loaded.result?.timeSeries || loaded.result?.observables, 'result');
    for (const result of loaded.results || []) appendSeries(result.observableTimeSeries || result.timeSeries || result.observables, result.runId || result.config?.experimentId || '');
    if (!rows.length) {
        for (const observableId of loaded.observableIds) rows.push({ runId: targetId(loaded), step: loaded.stepCount ?? '', observableId, value: '', unit: '', estimatorType: 'not exported' });
    }
    return rows;
}

function summaryRows(loaded) {
    const rows = [];
    const results = loaded.results?.length ? loaded.results : (loaded.result ? [loaded.result] : []);
    for (const result of results) {
        const config = result.config || loaded.config || {};
        const values = result.summary?.finalValues || result.finalObservables || result.summary || {};
        if (values && typeof values === 'object') {
            for (const [key, value] of Object.entries(values)) {
                if (value && typeof value === 'object') continue;
                rows.push({
                    runId: result.runId || config.experimentId || targetId(loaded),
                    modelId: config.modelId || loaded.modelIds[0] || '',
                    topologyId: config.topologyId || loaded.topologyIds[0] || '',
                    observableId: key,
                    finalValue: value
                });
            }
        }
    }
    if (!rows.length) {
        rows.push({
            runId: targetId(loaded),
            modelId: loaded.modelIds.join('|'),
            topologyId: loaded.topologyIds.join('|'),
            observableId: loaded.observableIds.join('|'),
            finalValue: ''
        });
    }
    return rows;
}

function eventRows(loaded) {
    const events = loaded.result?.eventLog || loaded.result?.events || loaded.results?.flatMap((entry) => entry.eventLog || entry.events || []) || [];
    return events.map((event, index) => ({
        eventIndex: index,
        step: event.step ?? event.time ?? '',
        eventType: event.type || event.eventType || '',
        topologyId: event.topologyId || loaded.topologyIds[0] || '',
        message: event.message || event.description || JSON.stringify(event)
    }));
}

function topologyInvariantRows(loaded) {
    return loaded.topologyIds.flatMap((topologyId) => computeTopologyInvariants(topologyById(topologyId)).map((entry) => ({
        topologyId,
        invariant: entry.name,
        value: typeof entry.value === 'object' ? JSON.stringify(entry.value) : entry.value,
        category: entry.category,
        exactness: entry.exactness,
        method: entry.method,
        topologyHash: entry.topologyHash
    })));
}

function divergenceRows(loaded) {
    return (loaded.result?.divergenceScores || loaded.object?.comparisonResult?.divergenceScores || []).map((entry) => ({
        referenceTopologyId: entry.referenceTopologyId || '',
        comparisonTopologyId: entry.comparisonTopologyId || '',
        observableId: entry.observableId || '',
        value: entry.value ?? '',
        exactness: entry.exactness || 'exploratory'
    }));
}

function regimeRows(loaded) {
    const cells = loaded.result?.gridCells || loaded.object?.phaseScanResult?.gridCells || [];
    return cells.map((cell) => ({
        topologyId: cell.topologyId || '',
        xValue: cell.xValue ?? '',
        yValue: cell.yValue ?? '',
        regimeLabel: cell.classification?.regimeLabel || '',
        confidence: cell.classification?.confidence ?? '',
        failedRunCount: cell.classification?.failedRunCount ?? 0
    }));
}

function heatmapRows(loaded) {
    const cells = loaded.result?.gridCells || loaded.object?.phaseScanResult?.gridCells || [];
    return cells.map((cell) => ({
        topologyId: cell.topologyId || '',
        xValue: cell.xValue ?? '',
        yValue: cell.yValue ?? '',
        value: cell.classification?.score ?? cell.summary?.mean ?? ''
    }));
}

function markdownTable(rows) {
    if (!rows.length) return '';
    const columns = Object.keys(rows[0]);
    const escape = (value) => String(value ?? '').replaceAll('|', '\\|');
    return [
        `| ${columns.join(' | ')} |`,
        `| ${columns.map(() => '---').join(' | ')} |`,
        ...rows.map((row) => `| ${columns.map((column) => escape(row[column])).join(' | ')} |`)
    ].join('\n');
}

function sourceObjectFiles(loaded, report, selectedArtifacts = defaultArtifactsForPurpose('exploratory_sharing')) {
    const files = new Map();
    const core = selectedArtifacts.coreFiles || [];
    if (loaded.config) {
        const name = loaded.objectType.includes('Batch') ? 'batch_config.json'
            : loaded.objectType.includes('Phase') ? 'phase_scan_config.json'
                : loaded.objectType.includes('TopologyComparison') ? 'topology_comparison_config.json'
                    : 'experiment_config.json';
        const artifact = name.replace('.json', '_json');
        if (core.includes(artifact)) files.set(`config/${name}`, loaded.config);
    }
    if (loaded.result) {
        const name = loaded.objectType.includes('Batch') ? 'batch_result.json'
            : loaded.objectType.includes('Phase') ? 'phase_scan_result.json'
                : loaded.objectType.includes('TopologyComparison') ? 'topology_comparison_result.json'
                    : 'experiment_result.json';
        const artifact = name.replace('.json', '_json');
        if (core.includes(artifact)) files.set(`results/${name}`, loaded.result);
    }
    if (report) {
        if (core.includes('validation_report_json')) files.set('validation/validation_report.json', report);
        if (core.includes('benchmark_report_json')) files.set('validation/benchmark_report.json', report.benchmarkResults || []);
    }
    return files;
}

export function buildFigureSpecs(loaded, report, options = {}) {
    const figureType = options.figureType || 'observable_time_series';
    const title = options.title || (figureType === 'regime_map' ? 'Regime map' : figureType === 'event_timeline' ? 'Topology-sensitive event timeline' : 'Observable comparison');
    const sourceObjectId = targetId(loaded);
    const captionBase = options.caption || 'Finite-size Topoboard Labs export. Labels describe measured observables and do not imply an exact physical phase transition.';
    const readinessWarning = validationLevelFor(loaded) === 'toy'
        ? [pubWarning('figure.toy_model_caption', 'info', 'figures/figure_001_metadata.json', 'Figure source includes a toy model.', 'Keep exploratory or toy wording in the caption.')]
        : [];
    const payload = {
        figureType,
        title,
        sourceObjectId,
        sourceDataHash: sourceHash(loaded),
        selectedObservables: loaded.observableIds,
        selectedTopologies: loaded.topologyIds
    };
    const spec = {
        figureId: `figure.${labHash(payload, 'id').replace(':', '.')}`,
        figureType,
        title,
        caption: `${captionBase}${report?.reproducibilityStatus === 'insufficient_metadata' ? ' Replay metadata is incomplete.' : ''}`,
        sourceObjectId,
        sourceDataPath: figureType.includes('regime') ? 'data/regime_classification.csv' : 'data/observable_time_series.csv',
        selectedObservables: loaded.observableIds,
        selectedTopologies: loaded.topologyIds,
        selectedSeeds: unique([loaded.seedPlan, ...(loaded.configs || []).map((entry) => entry.seed)]).map(String),
        axisLabels: { x: 'step / parameter index', y: 'observable value' },
        units: Object.fromEntries(loaded.observableIds.map((id) => [id, 'model units'])),
        renderingOptions: { exportFormat: options.figureFormat || 'svg', cautiousLabels: true },
        warnings: readinessWarning,
        figureHash: ''
    };
    spec.figureHash = labHash({ ...spec, figureHash: '' }, 'figure');
    return [spec];
}

export function buildTableSpecs(loaded, report, options = {}) {
    const tableType = options.tableType || 'experiment_configuration';
    const columnsByType = {
        experiment_configuration: ['field', 'value'],
        model_metadata: ['modelId', 'family', 'validationLevel'],
        observable_definitions: ['observableId', 'name', 'category', 'definition'],
        validation_warnings: ['warningId', 'severity', 'message', 'recommendation'],
        topology_invariants: ['topologyId', 'invariant', 'value', 'exactness'],
        export_manifest: ['path', 'checksum', 'description']
    };
    const payload = { tableType, sourceObjectId: targetId(loaded), selectedColumns: columnsByType[tableType] || ['field', 'value'] };
    const spec = {
        tableId: `table.${labHash(payload, 'id').replace(':', '.')}`,
        tableType,
        title: options.title || TABLE_TYPES.find((entry) => entry.id === tableType)?.label || 'Export table',
        sourceObjectId: targetId(loaded),
        selectedColumns: columnsByType[tableType] || ['field', 'value'],
        units: {},
        definitions: Object.fromEntries((columnsByType[tableType] || []).map((column) => [column, `Exported ${column} field.`])),
        aggregationMethod: tableType.includes('summary') ? 'finite-size descriptive summary' : 'none',
        warnings: report?.warnings?.slice(0, 6).map((entry) => pubWarning(entry.warningId, entry.severity || 'warning', 'tables/table_001.csv', entry.message, entry.recommendation || 'Keep warning visible.')) || [],
        tableHash: ''
    };
    tableSpecHash(tableSpecFix(spec));
    return [spec];
}

function tableSpecFix(spec) {
    spec.tableHash = labHash({ ...spec, tableHash: '' }, 'table');
    return spec;
}

function tableSpecHash(spec) {
    return spec.tableHash;
}

export function rowsForTable(tableType, loaded, report, manifest = null) {
    if (tableType === 'model_metadata') {
        return loaded.modelIds.map((modelId) => {
            const model = modelById(modelId);
            return { modelId, family: model.family, validationLevel: model.validationLevel };
        });
    }
    if (tableType === 'observable_definitions') {
        return loaded.modelIds.flatMap((modelId) => {
            const model = modelById(modelId);
            return (model.observables || []).filter((entry) => !loaded.observableIds.length || loaded.observableIds.includes(entry.id)).map((entry) => ({
                observableId: entry.id,
                name: localizedText(entry.name, entry.id),
                category: entry.category || '',
                definition: localizedText(entry.definition || entry.description, '')
            }));
        });
    }
    if (tableType === 'validation_warnings') {
        return (report?.warnings || []).map((entry) => ({
            warningId: entry.warningId,
            severity: entry.severity,
            message: entry.message,
            recommendation: entry.recommendation
        }));
    }
    if (tableType === 'topology_invariants') return topologyInvariantRows(loaded);
    if (tableType === 'export_manifest' && manifest) {
        return manifest.includedFiles.map((file) => ({ path: file.path, checksum: file.checksum, description: file.description }));
    }
    const config = loaded.config || {};
    return [
        { field: 'objectType', value: loaded.objectType },
        { field: 'modelIds', value: loaded.modelIds.join(', ') },
        { field: 'topologyIds', value: loaded.topologyIds.join(', ') },
        { field: 'localRuleId', value: config.localRuleId || '' },
        { field: 'seedPlan', value: JSON.stringify(loaded.seedPlan || config.seed || '') },
        { field: 'stepCount', value: loaded.stepCount || config.steps || '' },
        { field: 'observableIds', value: loaded.observableIds.join(', ') }
    ];
}

export function buildDataDictionary(loaded, generatedFiles, warnings) {
    const files = generatedFiles.map((file) => ({
        path: file.path,
        mediaType: file.mediaType,
        description: file.description,
        fields: fieldsForPath(file.path),
        checksum: file.checksum
    }));
    const fields = files.flatMap((file) => file.fields.map((fieldName) => ({
        fieldName,
        filePath: file.path,
        dataType: inferFieldType(fieldName),
        definition: fieldDefinition(fieldName),
        unit: fieldName.toLowerCase().includes('hash') ? 'hash string' : '',
        missingValue: 'Empty string or null indicates unavailable metadata.',
        warnings: fieldName.toLowerCase().includes('estimated') ? ['Estimator fields are finite-size or registry-derived unless exactness says otherwise.'] : []
    })));
    const topologyDefinitions = loaded.topologyIds.map((id) => {
        const topology = topologyById(id);
        return { topologyId: id, name: localizedText(topology.name, id), topologyType: topology.topologyType, boundaryCondition: topology.boundaryCondition, hash: topology.hash };
    });
    const modelDefinitions = loaded.modelIds.map((id) => {
        const model = modelById(id);
        return { modelId: id, name: localizedText(model.name, id), family: model.family, validationLevel: model.validationLevel };
    });
    const observableDefinitions = loaded.modelIds.flatMap((id) => modelById(id).observables || []);
    const dictionary = {
        dictionaryId: `dictionary.${labHash({ target: targetId(loaded), files: files.map((file) => file.path) }, 'id').replace(':', '.')}`,
        datasetId: targetId(loaded),
        generatedAt: nowIso(),
        schemaVersion: LAB_SCHEMA_VERSION,
        files,
        fields,
        observableDefinitions,
        topologyDefinitions,
        modelDefinitions,
        units: Object.fromEntries(loaded.observableIds.map((id) => [id, 'model units'])),
        categoricalValues: {
            readinessLevel: ['exploratory', 'reproducible', 'benchmark_supported', 'publication_supporting'],
            validationLevel: ['toy', 'estimator', 'benchmarked', 'research_grade'],
            warningSeverity: ['info', 'warning', 'error', 'critical']
        },
        missingValueConventions: ['Empty string means not exported.', 'null means structurally absent.', 'unknown means the source object did not declare the field.'],
        warningDefinitions: warnings,
        limitations: [
            'Finite-size discrete outputs are not continuum proofs.',
            'Registry topology invariants may be declared or estimated.',
            'Toy and estimator labels must remain visible in downstream documents.'
        ],
        dictionaryHash: ''
    };
    dictionary.dictionaryHash = labHash({ ...dictionary, dictionaryHash: '' }, 'data-dictionary');
    return dictionary;
}

function fieldsForPath(path) {
    if (path.endsWith('.csv')) {
        if (path.includes('observable')) return ['runId', 'step', 'observableId', 'value', 'unit', 'estimatorType'];
        if (path.includes('summary')) return ['runId', 'modelId', 'topologyId', 'observableId', 'finalValue'];
        if (path.includes('event')) return ['eventIndex', 'step', 'eventType', 'topologyId', 'message'];
        if (path.includes('topology')) return ['topologyId', 'invariant', 'value', 'category', 'exactness', 'method', 'topologyHash'];
        if (path.includes('divergence')) return ['referenceTopologyId', 'comparisonTopologyId', 'observableId', 'value', 'exactness'];
        if (path.includes('regime') || path.includes('heatmap')) return ['topologyId', 'xValue', 'yValue', 'regimeLabel', 'confidence'];
    }
    if (path.endsWith('.json')) return ['schemaName', 'schemaVersion', 'id', 'hash', 'warnings'];
    if (path.endsWith('.md')) return ['markdown'];
    return ['content'];
}

function inferFieldType(fieldName) {
    if (/count|step|index|size|bytes/i.test(fieldName)) return 'integer';
    if (/value|confidence|score/i.test(fieldName)) return 'number or string';
    if (/hash|id|name|type|label|path|message/i.test(fieldName)) return 'string';
    return 'JSON value';
}

function fieldDefinition(fieldName) {
    const words = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
    return `The exported ${words} value.`;
}

export function buildMethodsSummary(loaded, report) {
    const modelNames = loaded.modelIds.map(formatModelName).join(', ') || 'unknown model';
    const topologyNames = loaded.topologyIds.map(formatTopologyName).join(', ') || 'unknown topology';
    const config = loaded.config || {};
    const validationLevel = validationLevelFor(loaded);
    const limitations = [
        'This is a finite-size discrete model export.',
        'Regime labels, if present, are threshold-based classifications of measured observables.',
        'The export does not claim a continuum limit, exact physical simulation, or peer-reviewed result.',
        ...((report?.warnings || []).slice(0, 5).map((entry) => entry.message))
    ];
    const editableMarkdown = [
        '# Methods Summary',
        '',
        `Model: ${modelNames}.`,
        `Validation level: ${validationLevel}.`,
        `State space: ${config.stateSpaceId || 'declared by the selected model adapter when available'}.`,
        `Topology: ${topologyNames}.`,
        `Local rule: ${config.localRuleId || 'declared by the selected model adapter when available'}.`,
        `Initial condition: ${config.initialConditionId || config.initialCondition || 'not declared'}.`,
        `Seed plan: ${JSON.stringify(loaded.seedPlan || config.seed || 'not declared')}.`,
        `Time evolution: ${loaded.stepCount ?? config.steps ?? 'not declared'} discrete steps where available.`,
        `Observables: ${loaded.observableIds.join(', ') || 'not declared'}.`,
        `Replay method: ${report?.replayStatus || 'not verified in this export page'}.`,
        `Benchmark status: ${(report?.benchmarkResults || []).filter((entry) => entry.status === 'passed').length}/${(report?.benchmarkResults || []).length} checks passed.`,
        '',
        'Cautious interpretation:',
        'This dataset was generated using a finite-size discrete model on declared Topoboard topology metadata. Reported regime labels are threshold-based classifications of measured observables, not proofs of thermodynamic phase transitions.',
        '',
        'Limitations:',
        ...limitations.map((item) => `- ${item}`)
    ].join('\n');
    const summary = {
        summaryId: `methods.${labHash({ target: targetId(loaded), reportHash: report?.reportHash }, 'id').replace(':', '.')}`,
        sourceObjectId: targetId(loaded),
        generatedAt: nowIso(),
        modelSummary: modelNames,
        topologySummary: topologyNames,
        ruleSummary: config.localRuleId || 'not declared',
        observableSummary: loaded.observableIds.join(', ') || 'not declared',
        experimentSummary: `${loaded.objectType}, steps ${loaded.stepCount ?? 'unknown'}, seed ${JSON.stringify(loaded.seedPlan || 'unknown')}`,
        validationSummary: `${report?.reproducibilityStatus || 'not checked'}; ${(report?.benchmarkResults || []).filter((entry) => entry.status === 'passed').length}/${(report?.benchmarkResults || []).length} benchmarks passed`,
        limitations,
        editableMarkdown,
        summaryHash: ''
    };
    summary.summaryHash = labHash({ ...summary, summaryHash: '' }, 'methods-summary');
    return summary;
}

export function buildLicenseMetadata(options = {}) {
    const selected = LICENSE_OPTIONS.find((entry) => entry.id === options.licenseId) || LICENSE_OPTIONS[0];
    const warnings = [];
    if (selected.id === 'none') warnings.push(pubWarning('license.none_selected', 'warning', 'citation/citation.json', 'No license selected.', 'Datasets without a license may be harder for others to reuse.'));
    if (selected.id === 'custom' && !String(options.customLicenseText || '').trim()) warnings.push(pubWarning('license.custom_blank', 'warning', 'citation/citation.json', 'Custom license selected but text is blank.', 'Enter the custom license text before sharing.'));
    return {
        licenseId: selected.id,
        licenseName: selected.name,
        licenseUrl: selected.url,
        licenseText: selected.id === 'custom' ? String(options.customLicenseText || '') : '',
        selectedByUser: selected.id !== 'none',
        warnings
    };
}

function parseCreators(textValue) {
    return String(textValue || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
}

export function buildCitationMetadata(loaded, report, packageHash, options = {}, licenseMetadata = buildLicenseMetadata()) {
    const modelPart = loaded.modelIds.map(formatModelName).join(', ') || 'Topoboard Labs model';
    const topologyPart = loaded.topologyIds.map(formatTopologyName).join(', ') || 'declared topology';
    const title = String(options.title || '').trim() || `Topoboard Labs dataset: ${modelPart} on ${topologyPart}, ${loaded.objectType}`;
    const creators = parseCreators(options.creatorsText);
    const keywords = unique(String(options.keywords || 'Topoboard Labs, topology, discrete dynamics').split(',').map((entry) => entry.trim()));
    const citationId = `citation.${labHash({ title, target: targetId(loaded), packageHash }, 'id').replace(':', '.')}`;
    const creatorText = creators.length ? creators.map((entry) => entry.name).join(' and ') : '[creators to be added]';
    const escapedTitle = title.replace(/[{}]/g, '');
    const bibKey = `topoboard_${labHash({ title, packageHash }, 'bib').replace(/[^a-z0-9]/gi, '').slice(0, 10)}`;
    const exportedAt = nowIso();
    const citation = {
        citationId,
        title,
        creators,
        projectName: 'Topoboard Labs',
        version: LAB_APP_VERSION,
        createdAt: loaded.config?.createdAt || loaded.object?.createdAt || exportedAt,
        exportedAt,
        objectType: loaded.objectType,
        modelIds: loaded.modelIds,
        topologyIds: loaded.topologyIds,
        experimentHash: loaded.config?.experimentHash || loaded.config?.batchHash || loaded.config?.phaseScanHash || loaded.config?.comparisonHash || '',
        resultHash: loaded.result?.resultHash || loaded.result?.experimentResultHash || '',
        validationReportHash: report?.reportHash || '',
        bundleHash: packageHash,
        repositoryUrl: String(options.repositoryUrl || 'https://github.com/youxunzhangjim-netizen/Topoboardgame'),
        projectUrl: String(options.projectUrl || 'https://youxunzhangjim-netizen.github.io/Topoboardgame/'),
        license: licenseMetadata.licenseName,
        keywords,
        abstract: 'Structured Topoboard Labs export bundle for finite-size discrete topological dynamics experiments. The bundle includes cautious validation and reproducibility metadata where available.',
        suggestedCitationText: `${creatorText}. ${title}. Topoboard Labs export bundle, version ${LAB_APP_VERSION}, exported ${exportedAt}.`,
        bibtex: [
            `@dataset{${bibKey},`,
            `  title = {${escapedTitle}},`,
            `  author = {${creatorText}},`,
            `  year = {${new Date(exportedAt).getUTCFullYear()}},`,
            `  version = {${LAB_APP_VERSION}},`,
            `  url = {${String(options.projectUrl || 'https://youxunzhangjim-netizen.github.io/Topoboardgame/')}}`,
            '}'
        ].join('\n'),
        cslJson: {
            type: 'dataset',
            id: citationId,
            title,
            author: creators.map((entry) => ({ literal: entry.name })),
            issued: { 'date-parts': [[new Date(exportedAt).getUTCFullYear()]] },
            URL: String(options.projectUrl || '')
        }
    };
    return citation;
}

export function buildProvenanceRecord(loaded, report, generatedFiles, options = {}) {
    const sourceId = targetId(loaded);
    const transformations = generatedFiles.map((file) => ({
        transformationId: `transform.${labHash({ sourceId, path: file.path }, 'id').replace(':', '.')}`,
        inputIds: [sourceId],
        outputIds: [file.path],
        method: methodForPath(file.path),
        parameters: { exportPurpose: options.exportPurpose || 'exploratory_sharing' },
        warnings: [],
        inputHashes: { [sourceId]: sourceHash(loaded) },
        outputHashes: { [file.path]: file.checksum }
    }));
    const record = {
        provenanceId: `provenance.${labHash({ sourceId, files: generatedFiles.map((file) => file.path) }, 'id').replace(':', '.')}`,
        sourceObjects: [sourceId],
        sourceHashes: { [sourceId]: sourceHash(loaded) },
        transformations,
        generatedArtifacts: generatedFiles.map((file) => file.path),
        softwareVersions: {
            appVersion: LAB_APP_VERSION,
            engineVersion: LAB_ENGINE_VERSION,
            hashVersion: LAB_HASH_VERSION
        },
        schemaVersions: { labs: LAB_SCHEMA_VERSION },
        rngMetadata: { seedPlan: loaded.seedPlan || null, deterministicReplay: report?.replayStatus || 'not checked' },
        validationReports: report?.reportHash ? [report.reportHash] : [],
        benchmarkReports: (report?.benchmarkResults || []).map((entry) => entry.resultHash).filter(Boolean),
        exportSettings: options,
        createdAt: nowIso(),
        provenanceHash: ''
    };
    record.provenanceHash = labHash({ ...record, provenanceHash: '' }, 'provenance');
    return record;
}

function methodForPath(path) {
    if (path.endsWith('.csv')) return 'source JSON flattened to CSV table';
    if (path.includes('figure')) return 'source data summarized into cautious figure metadata';
    if (path.includes('README')) return 'metadata rendered into editable Markdown';
    if (path.includes('citation')) return 'citation form fields rendered into citation metadata';
    if (path.includes('manifest')) return 'generated files checksummed into export manifest';
    return 'source object copied or summarized';
}

export function buildReadme(loaded, report, readiness, methodsSummary, citationMetadata, licenseMetadata, generatedFiles) {
    const lines = [
        '# Topoboard Labs Export Bundle',
        '',
        '## Summary',
        '',
        `Source object: ${targetId(loaded)} (${loaded.objectType})`,
        `Readiness level: ${readiness.readinessLevel}`,
        `Model(s): ${loaded.modelIds.map(formatModelName).join(', ') || 'unknown'}`,
        `Topology/topologies: ${loaded.topologyIds.map(formatTopologyName).join(', ') || 'unknown'}`,
        '',
        '## Included Files',
        '',
        ...generatedFiles.map((file) => `- ${file.path} - ${file.description}`),
        '',
        '## Reproducibility',
        '',
        `Validation status: ${report?.reproducibilityStatus || 'not checked'}`,
        `Replay status: ${report?.replayStatus || 'not checked'}`,
        `Seed plan: ${JSON.stringify(loaded.seedPlan || 'not declared')}`,
        '',
        '## Model and Topology',
        '',
        methodsSummary.modelSummary,
        methodsSummary.topologySummary,
        '',
        '## Observables',
        '',
        loaded.observableIds.length ? loaded.observableIds.map((id) => `- ${id}`).join('\n') : 'No observable list was declared in the source object.',
        '',
        '## Validation and Benchmarks',
        '',
        `${(report?.benchmarkResults || []).filter((entry) => entry.status === 'passed').length}/${(report?.benchmarkResults || []).length} benchmark checks passed.`,
        '',
        '## Known Limitations',
        '',
        ...methodsSummary.limitations.map((item) => `- ${item}`),
        '',
        '## Citation',
        '',
        citationMetadata.suggestedCitationText,
        '',
        '## License',
        '',
        `${licenseMetadata.licenseName}. This interface does not provide legal advice.`,
        '',
        '## Contact / Author Placeholder',
        '',
        'Add contact or author metadata before public release.'
    ];
    return lines.join('\n');
}

function svgFigure(spec, readinessLevel) {
    const title = escapeXml(spec.title);
    const caption = escapeXml(spec.caption);
    const badge = escapeXml(readinessLevel);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${title}">
  <rect width="960" height="540" fill="#101216"/>
  <text x="48" y="70" fill="#f2f6f4" font-size="34" font-family="Arial, sans-serif" font-weight="700">${title}</text>
  <text x="48" y="108" fill="#f4b860" font-size="18" font-family="Arial, sans-serif">Topoboard Labs finite-size export - ${badge}</text>
  <polyline fill="none" stroke="#49c7b8" stroke-width="5" points="80,380 220,300 360,326 500,220 640,246 780,150 880,190"/>
  <line x1="80" y1="410" x2="880" y2="410" stroke="#aeb8b4" stroke-width="2"/>
  <line x1="80" y1="410" x2="80" y2="130" stroke="#aeb8b4" stroke-width="2"/>
  <text x="80" y="468" fill="#aeb8b4" font-size="16" font-family="Arial, sans-serif">${caption}</text>
</svg>`;
}

function escapeXml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]));
}

function dataDictionaryMarkdown(dictionary) {
    return [
        '# Data Dictionary',
        '',
        '## Files',
        '',
        markdownTable(dictionary.files.map((file) => ({
            path: file.path,
            mediaType: file.mediaType,
            description: file.description,
            checksum: file.checksum
        }))),
        '',
        '## Fields',
        '',
        markdownTable(dictionary.fields.map((field) => ({
            fieldName: field.fieldName,
            filePath: field.filePath,
            dataType: field.dataType,
            definition: field.definition
        })))
    ].join('\n');
}

export function buildPublicationPackage({
    loaded,
    purpose = 'exploratory_sharing',
    selectedArtifacts = defaultArtifactsForPurpose(purpose),
    figureOptions = {},
    tableOptions = {},
    citationOptions = {},
    licenseOptions = {},
    guided = false
}) {
    const report = buildValidationReport(loaded);
    const licenseMetadata = buildLicenseMetadata(licenseOptions);
    const readiness = computePublicationReadiness(loaded, report, selectedArtifacts, citationOptions, licenseOptions);
    const figureSpecs = buildFigureSpecs(loaded, report, figureOptions);
    const tableSpecs = buildTableSpecs(loaded, report, tableOptions);
    const sourceFiles = sourceObjectFiles(loaded, report, selectedArtifacts);
    const fileContents = new Map();

    for (const [path, value] of sourceFiles.entries()) fileContents.set(path, stableStringify(value));

    const observableCsv = toCsv(observableRows(loaded));
    const summaryCsv = toCsv(summaryRows(loaded));
    const eventCsv = toCsv(eventRows(loaded));
    const topologyCsv = toCsv(topologyInvariantRows(loaded));
    const divergenceCsv = toCsv(divergenceRows(loaded));
    const regimeCsv = toCsv(regimeRows(loaded));
    const heatmapCsv = toCsv(heatmapRows(loaded));
    const topologyData = loaded.topologyIds.map((id) => topologyById(id));
    const cyclesAndSeams = loaded.topologyIds.map((id) => computeCycleData(topologyById(id)));
    const snapshots = loaded.result?.snapshots || loaded.result?.stateSnapshots || [];

    if (selectedArtifacts.dataFiles?.includes('observable_time_series_csv')) fileContents.set('data/observable_time_series.csv', observableCsv);
    if (selectedArtifacts.dataFiles?.includes('summary_statistics_csv')) fileContents.set('data/summary_statistics.csv', summaryCsv);
    if (selectedArtifacts.dataFiles?.includes('event_log_csv')) fileContents.set('data/event_log.csv', eventCsv);
    if (selectedArtifacts.dataFiles?.includes('topology_invariant_table_csv')) fileContents.set('data/topology_invariants.csv', topologyCsv);
    if (selectedArtifacts.dataFiles?.includes('divergence_score_csv')) fileContents.set('data/divergence_scores.csv', divergenceCsv);
    if (selectedArtifacts.dataFiles?.includes('regime_classification_csv')) fileContents.set('data/regime_classification.csv', regimeCsv);
    if (selectedArtifacts.dataFiles?.includes('heatmap_matrix_csv')) fileContents.set('data/heatmap_matrix.csv', heatmapCsv);
    if (selectedArtifacts.dataFiles?.includes('adjacency_data_json')) fileContents.set('topology/adjacency.json', stableStringify(topologyData.map((topology) => ({ topologyId: topology.id, topologyHash: topology.hash, note: 'Registry-derived adjacency metadata where full adjacency is unavailable.' }))));
    if (selectedArtifacts.dataFiles?.includes('seam_and_cycle_data_json')) fileContents.set('topology/cycles_and_seams.json', stableStringify(cyclesAndSeams));
    if (selectedArtifacts.dataFiles?.includes('state_snapshots_json')) fileContents.set('results/state_snapshots.json', stableStringify(snapshots));
    if (selectedArtifacts.dataFiles?.includes('replay_event_log_json')) fileContents.set('results/replay_event_log.json', stableStringify(loaded.result?.eventLog || []));
    if (topologyData.length) fileContents.set('topology/topology.json', stableStringify(topologyData));

    if (selectedArtifacts.visualFiles?.includes('figure_metadata_json')) fileContents.set('figures/figure_001_metadata.json', stableStringify(figureSpecs[0]));
    if (selectedArtifacts.visualFiles?.includes('figure_data_csv')) fileContents.set('figures/figure_001_data.csv', observableCsv);
    if (selectedArtifacts.visualFiles?.includes('svg_figures')) fileContents.set('figures/figure_001.svg', svgFigure(figureSpecs[0], readiness.readinessLevel));

    const generatedFilesInitial = [...fileContents.entries()].map(([path, content]) => fileEntry(path, mediaTypeForPath(path), descriptionForPath(path), artifactCategoryForPath(path), content));
    const methodsSummary = buildMethodsSummary(loaded, report);
    const packageHashSeed = labHash({ target: targetId(loaded), purpose, sourceHash: sourceHash(loaded), generatedFiles: generatedFilesInitial.map((file) => file.checksum) }, 'publication-package');
    const citationMetadata = buildCitationMetadata(loaded, report, packageHashSeed, citationOptions, licenseMetadata);

    if (selectedArtifacts.documentationFiles?.includes('methods_summary_md')) fileContents.set('docs/methods_summary.md', methodsSummary.editableMarkdown);
    if (selectedArtifacts.documentationFiles?.includes('model_description_md')) fileContents.set('docs/model_description.md', loaded.modelIds.map((id) => `${id}: ${formatModelName(id)} (${modelById(id).family})`).join('\n'));
    if (selectedArtifacts.documentationFiles?.includes('observable_definitions_md')) fileContents.set('docs/observable_definitions.md', markdownTable(rowsForTable('observable_definitions', loaded, report)));
    if (selectedArtifacts.documentationFiles?.includes('topology_definitions_md')) fileContents.set('docs/topology_definitions.md', markdownTable(topologyInvariantRows(loaded)));
    if (selectedArtifacts.documentationFiles?.includes('validation_limitations_md')) fileContents.set('docs/limitations.md', methodsSummary.limitations.map((item) => `- ${item}`).join('\n'));
    if (selectedArtifacts.documentationFiles?.includes('reproducibility_notes_md')) fileContents.set('docs/reproducibility_notes.md', buildReproducibilityBundle(loaded, report).readme);
    if (selectedArtifacts.documentationFiles?.includes('benchmark_notes_md')) fileContents.set('docs/benchmark_notes.md', markdownTable((report.benchmarkResults || []).map((entry) => ({ benchmarkId: entry.benchmarkId, status: entry.status, summary: entry.summary || '' }))));
    if (selectedArtifacts.documentationFiles?.includes('warning_summary_md')) fileContents.set('docs/warning_summary.md', readiness.warnings.map((entry) => `- [${entry.severity}] ${entry.message} Recommendation: ${entry.recommendation}`).join('\n'));
    if (selectedArtifacts.citationFiles?.includes('citation_metadata_json')) fileContents.set('citation/citation.json', stableStringify(citationMetadata));
    if (selectedArtifacts.citationFiles?.includes('bibtex_entry')) fileContents.set('citation/citation.bib', citationMetadata.bibtex);
    if (selectedArtifacts.citationFiles?.includes('csl_json')) fileContents.set('citation/csl.json', stableStringify(citationMetadata.cslJson || {}));
    if (selectedArtifacts.citationFiles?.includes('suggested_citation_text')) fileContents.set('citation/suggested_citation.txt', citationMetadata.suggestedCitationText);

    let generatedFiles = [...fileContents.entries()].map(([path, content]) => fileEntry(path, mediaTypeForPath(path), descriptionForPath(path), artifactCategoryForPath(path), content));
    const dataDictionary = buildDataDictionary(loaded, generatedFiles, readiness.warnings);
    if (selectedArtifacts.documentationFiles?.includes('data_dictionary_json')) {
        fileContents.set('docs/data_dictionary.json', stableStringify(dataDictionary));
        fileContents.set('docs/data_dictionary.md', dataDictionaryMarkdown(dataDictionary));
    }
    if (selectedArtifacts.documentationFiles?.includes('readme_md')) {
        fileContents.set('README.md', buildReadme(loaded, report, readiness, methodsSummary, citationMetadata, licenseMetadata, generatedFiles));
    }

    generatedFiles = [...fileContents.entries()].map(([path, content]) => fileEntry(path, mediaTypeForPath(path), descriptionForPath(path), artifactCategoryForPath(path), content));
    const provenanceRecord = buildProvenanceRecord(loaded, report, generatedFiles, { exportPurpose: purpose, guided });
    const checksums = Object.fromEntries(generatedFiles.map((file) => [file.path, file.checksum]));
    const hashAudit = [
        hashAuditForObject(loaded.objectType, loaded.object, 'source', targetId(loaded)),
        ...(loaded.config ? [hashAuditForObject('config', loaded.config, 'config', targetId(loaded))] : []),
        ...(loaded.result ? [hashAuditForObject('result', loaded.result, 'result', targetId(loaded))] : [])
    ];
    const manifest = buildManifest({
        loaded,
        purpose,
        generatedFiles,
        readiness,
        figureSpecs,
        tableSpecs,
        dataDictionary,
        methodsSummary,
        citationMetadata,
        provenanceRecord,
        report,
        packageHashSeed
    });

    if (selectedArtifacts.auditFiles?.includes('provenance_record_json')) fileContents.set('provenance/provenance.json', stableStringify(provenanceRecord));
    if (selectedArtifacts.auditFiles?.includes('checksum_manifest_json')) fileContents.set('provenance/checksums.json', stableStringify(checksums));
    if (selectedArtifacts.auditFiles?.includes('hash_audit_report_json')) fileContents.set('validation/hash_audit.json', stableStringify(hashAudit));
    if (selectedArtifacts.auditFiles?.includes('schema_version_report_json')) fileContents.set('provenance/schema_versions.json', stableStringify({ appVersion: LAB_APP_VERSION, schemaVersion: LAB_SCHEMA_VERSION, engineVersion: LAB_ENGINE_VERSION, hashVersion: LAB_HASH_VERSION }));
    if (selectedArtifacts.auditFiles?.includes('export_manifest_json')) fileContents.set('manifest.json', stableStringify(manifest));

    generatedFiles = [...fileContents.entries()].map(([path, content]) => fileEntry(path, mediaTypeForPath(path), descriptionForPath(path), artifactCategoryForPath(path), content));
    const finalManifest = { ...manifest, includedFiles: generatedFiles, fileChecksums: Object.fromEntries(generatedFiles.map((file) => [file.path, file.checksum])) };
    finalManifest.manifestHash = labHash({ ...finalManifest, manifestHash: '' }, 'publication-manifest');
    if (fileContents.has('manifest.json')) fileContents.set('manifest.json', stableStringify(finalManifest));
    generatedFiles = [...fileContents.entries()].map(([path, content]) => fileEntry(path, mediaTypeForPath(path), descriptionForPath(path), artifactCategoryForPath(path), content));

    const packageConfig = {
        packageId: `package.${packageHashSeed.replace(':', '.')}`,
        packageName: `Topoboard export ${targetId(loaded)}`,
        exportPurpose: purpose,
        sourceObjectIds: [targetId(loaded)],
        selectedArtifacts,
        figureSpecs,
        tableSpecs,
        documentationOptions: { guided },
        citationOptions,
        licenseOptions,
        readinessChecks: { readinessLevel: readiness.readinessLevel, warningCount: readiness.warnings.length },
        appVersion: LAB_APP_VERSION,
        schemaVersion: LAB_SCHEMA_VERSION,
        createdAt: nowIso(),
        packageHash: packageHashSeed
    };
    const result = {
        packageConfig,
        generatedFiles,
        fileContents: Object.fromEntries(fileContents.entries()),
        figures: figureSpecs,
        tables: tableSpecs,
        dataDictionary,
        methodsSummary,
        citationMetadata,
        licenseMetadata,
        provenanceRecord,
        exportManifest: finalManifest,
        warnings: [...readiness.warnings, ...licenseMetadata.warnings, ...figureSpecs.flatMap((entry) => entry.warnings), ...tableSpecs.flatMap((entry) => entry.warnings)],
        readinessLevel: readiness.readinessLevel,
        packageResultHash: ''
    };
    result.packageResultHash = labHash({ ...result, packageResultHash: '' }, 'publication-result');
    return result;
}

function buildManifest({ loaded, purpose, generatedFiles, readiness, figureSpecs, tableSpecs, dataDictionary, methodsSummary, citationMetadata, provenanceRecord, report, packageHashSeed }) {
    const manifest = {
        manifestId: `manifest.${labHash({ target: targetId(loaded), packageHashSeed }, 'id').replace(':', '.')}`,
        bundleId: `bundle.${packageHashSeed.replace(':', '.')}`,
        bundleName: `Topoboard Labs export - ${targetId(loaded)}`,
        exportPurpose: purpose,
        createdAt: nowIso(),
        appVersion: LAB_APP_VERSION,
        schemaVersion: LAB_SCHEMA_VERSION,
        includedFiles: generatedFiles,
        fileChecksums: Object.fromEntries(generatedFiles.map((file) => [file.path, file.checksum])),
        sourceObjectHashes: { [targetId(loaded)]: sourceHash(loaded) },
        configHashes: [loaded.config?.experimentHash || loaded.config?.batchHash || loaded.config?.phaseScanHash || loaded.config?.comparisonHash || ''].filter(Boolean),
        resultHashes: [loaded.result?.resultHash || loaded.result?.experimentResultHash || ''].filter(Boolean),
        validationReportHashes: [report?.reportHash || ''].filter(Boolean),
        benchmarkReportHashes: (report?.benchmarkResults || []).map((entry) => entry.resultHash).filter(Boolean),
        figureHashes: figureSpecs.map((entry) => entry.figureHash),
        tableHashes: tableSpecs.map((entry) => entry.tableHash),
        dataDictionaryHash: dataDictionary.dictionaryHash,
        methodsSummaryHash: methodsSummary.summaryHash,
        citationMetadataHash: labHash(citationMetadata, 'citation'),
        provenanceHash: provenanceRecord.provenanceHash,
        warnings: readiness.warnings,
        readinessLevel: readiness.readinessLevel,
        manifestHash: ''
    };
    manifest.manifestHash = labHash({ ...manifest, manifestHash: '' }, 'publication-manifest');
    return manifest;
}

function mediaTypeForPath(path) {
    if (path.endsWith('.json')) return 'application/json';
    if (path.endsWith('.csv')) return 'text/csv';
    if (path.endsWith('.md')) return 'text/markdown';
    if (path.endsWith('.bib')) return 'application/x-bibtex';
    if (path.endsWith('.svg')) return 'image/svg+xml';
    if (path.endsWith('.txt')) return 'text/plain';
    return 'application/octet-stream';
}

function artifactCategoryForPath(path) {
    if (path.startsWith('config/')) return 'core';
    if (path.startsWith('results/')) return 'core';
    if (path.startsWith('data/')) return 'data';
    if (path.startsWith('topology/')) return 'topology';
    if (path.startsWith('docs/')) return 'documentation';
    if (path.startsWith('citation/')) return 'citation';
    if (path.startsWith('figures/')) return 'visual';
    if (path.startsWith('validation/')) return 'validation';
    if (path.startsWith('provenance/')) return 'audit';
    return 'bundle';
}

function descriptionForPath(path) {
    if (path.includes('config')) return 'Versioned experiment configuration.';
    if (path.includes('result')) return 'Experiment or dataset result object.';
    if (path.includes('observable')) return 'Observable data with finite-size labels.';
    if (path.includes('summary')) return 'Summary statistics table.';
    if (path.includes('event')) return 'Event log table.';
    if (path.includes('topology')) return 'Topology metadata and invariant data.';
    if (path.includes('citation')) return 'Citation metadata.';
    if (path.includes('provenance')) return 'Provenance record.';
    if (path.includes('manifest')) return 'Export manifest.';
    if (path.includes('README')) return 'Human-readable bundle guide.';
    return 'Generated publication bundle artifact.';
}

export function createDefaultPublicationSource() {
    return normalizeLoadedObject(createSampleExperiment(), 'sample');
}

export function parseSharedInput(value) {
    const raw = String(value || '').trim();
    if (!raw) throw new Error('No JSON or share link was provided.');
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        const url = new URL(raw);
        const data = url.searchParams.get('data') || url.searchParams.get('bundle') || '';
        if (!data) throw new Error('The link does not contain a data parameter.');
        try {
            return JSON.parse(decodeURIComponent(data));
        } catch {
            return JSON.parse(atob(data));
        }
    }
    return JSON.parse(raw);
}

export function bundleToDownloadJson(bundle) {
    return JSON.stringify({
        schemaName: 'LabPublicationPackageResult',
        schemaVersion: LAB_SCHEMA_VERSION,
        note: 'Browser export: folder structure is represented by fileContents object keys. Nothing was uploaded.',
        ...bundle
    }, null, 2);
}

export function csvForCurrentTable(bundle) {
    const table = bundle.tables[0];
    const loaded = normalizeLoadedObject(bundle.fileContents['config/experiment_config.json'] ? JSON.parse(bundle.fileContents['config/experiment_config.json']) : bundle.packageConfig, 'bundle-table');
    return toCsv(rowsForTable(table.tableType, loaded, null, bundle.exportManifest));
}
