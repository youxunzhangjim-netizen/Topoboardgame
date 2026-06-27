import {
    BENCHMARK_REGISTRY,
    LAB_APP_VERSION,
    LAB_SCHEMA_VERSION,
    buildReproducibilityBundle,
    buildValidationReport,
    bundleToJson,
    createSampleExperiment,
    downloadText,
    hashAuditForObject,
    loadStoredValidationCandidates,
    normalizeLoadedObject,
    observableConsistencyChecks,
    replayFromConfigSeed,
    replayFromEventLog,
    reproducibilityMetadataForLoaded,
    targetId,
    toCsv,
    topologyValidationChecks,
    validationLevelCards
} from './LabValidationCore.js';
import { getLanguage, modelById, stableStringify, text, uiText } from '../experiments/LabExperimentRegistry.js';

const I18N = {
    en: {
        home: 'Labs Home',
        experimentBuilder: 'Experiment Builder',
        phaseDiagrams: 'Phase Diagrams',
        topologyComparison: 'Topology Comparison',
        pageTitle: 'Validation & Reproducibility',
        subtitle: 'Check, replay, benchmark, and verify Topoboard Labs experiments.',
        language: 'Language',
        guidedMode: 'Can I Replay This?',
        researchMode: 'Research Audit',
        purposeEyebrow: 'Purpose',
        purposeTitle: 'Trust the experiment without overclaiming it',
        purposeText: 'Audit stored configs, seeds, hashes, event logs, topology invariants, observable consistency, benchmark scope, and export manifests.',
        loadSample: 'Load sample',
        quickReplay: 'Check replay',
        runAll: 'Run validation suite',
        loadedType: 'Loaded type',
        replayStatus: 'Replay status',
        benchmarkStatus: 'Benchmarks',
        reportStatus: 'Report',
        guidedAnswerTitle: 'Can I replay this?',
        guidedAnswerEmpty: 'Load an experiment, then run the replay check.',
        loadExperiment: 'Load Experiment',
        loadCurrent: 'Load current active',
        loadStored: 'Load browser stored',
        uploadJson: 'Upload JSON',
        shareLink: 'Shareable experiment link or encoded JSON',
        loadLink: 'Load link',
        loadPaste: 'Load pasted JSON',
        inspectConfig: 'Inspect Config',
        reproSummary: 'Reproducibility Summary',
        replayPanel: 'Replay Panel',
        replayConfig: 'Replay from config + seed',
        replayEvent: 'Replay from event log',
        strictReplay: 'Strict replay',
        compareOriginal: 'Compare with original',
        benchmarks: 'Benchmark Panel',
        engine: 'engine',
        topology: 'topology',
        model: 'model',
        observable: 'observable',
        export: 'export',
        replay: 'replay',
        benchmark: 'Benchmark',
        category: 'Category',
        status: 'Status',
        method: 'Method',
        limitations: 'Limitations',
        observableChecks: 'Observable Consistency Panel',
        topologyChecks: 'Topology Invariant Check Panel',
        hashAudit: 'Hash Audit Panel',
        validationReport: 'Validation Report Panel',
        exportBundle: 'Export Reproducibility Bundle',
        bundleHelp: 'The bundle includes config, result when available, topology metadata, observables, event logs, RNG metadata, benchmarks, validation report, manifest, and README. It is JSON in this browser build.',
        exportReport: 'Export report JSON',
        exportBundleJson: 'Export bundle JSON',
        copyBundle: 'Copy bundle',
        seedSaved: 'Seed saved',
        topologySaved: 'Topology saved',
        ruleSaved: 'Rule saved',
        resultReplayable: 'Replayable',
        replayMatched: 'Replay matched',
        yes: 'Yes',
        no: 'No',
        partial: 'Partial',
        noStored: 'No browser-stored Labs export was found.',
        loaded: 'Loaded',
        noReport: 'No report yet.',
        noResult: 'No result loaded.',
        noWarnings: 'No warnings in current report.',
        exactReplay: 'Your experiment can be replayed exactly from stored event/final-state hashes.',
        partialReplay: 'This experiment is only partially replayable because some required replay data is missing or a fresh dynamics runner was not invoked here.',
        notReplay: 'This experiment is not replayable from the loaded data yet.',
        copied: 'Copied.',
        loadFailed: 'Could not load JSON.',
        hashFields: 'Included fields'
    },
    zh: {
        home: 'Labs 首頁',
        experimentBuilder: '實驗建構器',
        phaseDiagrams: '相圖',
        topologyComparison: '拓撲比較',
        pageTitle: '驗證與可重現性',
        subtitle: '檢查、重播、基準測試並驗證 Topoboard Labs 實驗。',
        language: '語言',
        guidedMode: '這能重播嗎？',
        researchMode: '研究稽核',
        purposeEyebrow: '目的',
        purposeTitle: '信任實驗，但不過度宣稱',
        purposeText: '稽核設定、種子、雜湊、事件紀錄、拓撲不變量、可觀測量一致性、基準測試範圍與匯出 manifest。',
        loadSample: '載入範例',
        quickReplay: '檢查重播',
        runAll: '執行驗證套件',
        loadedType: '載入類型',
        replayStatus: '重播狀態',
        benchmarkStatus: '基準測試',
        reportStatus: '報告',
        guidedAnswerTitle: '這能重播嗎？',
        guidedAnswerEmpty: '先載入實驗，再執行重播檢查。',
        loadExperiment: '載入實驗',
        loadCurrent: '載入目前項目',
        loadStored: '載入瀏覽器儲存項目',
        uploadJson: '上傳 JSON',
        shareLink: '分享連結或編碼 JSON',
        loadLink: '載入連結',
        loadPaste: '載入貼上的 JSON',
        inspectConfig: '檢查設定',
        reproSummary: '可重現性摘要',
        replayPanel: '重播面板',
        replayConfig: '用設定與種子重播',
        replayEvent: '用事件紀錄重播',
        strictReplay: '嚴格重播',
        compareOriginal: '與原結果比較',
        benchmarks: '基準測試面板',
        engine: '引擎',
        topology: '拓撲',
        model: '模型',
        observable: '可觀測量',
        export: '匯出',
        replay: '重播',
        benchmark: '基準測試',
        category: '類別',
        status: '狀態',
        method: '方法',
        limitations: '限制',
        observableChecks: '可觀測量一致性面板',
        topologyChecks: '拓撲不變量檢查面板',
        hashAudit: '雜湊稽核面板',
        validationReport: '驗證報告面板',
        exportBundle: '匯出可重現性 Bundle',
        bundleHelp: 'Bundle 包含設定、可用結果、拓撲資料、可觀測量、事件紀錄、RNG 資料、基準測試、驗證報告、manifest 與 README。此瀏覽器版本以 JSON 匯出。',
        exportReport: '匯出報告 JSON',
        exportBundleJson: '匯出 Bundle JSON',
        copyBundle: '複製 Bundle',
        seedSaved: '種子已儲存',
        topologySaved: '拓撲已儲存',
        ruleSaved: '規則已儲存',
        resultReplayable: '可重播',
        replayMatched: '重播相符',
        yes: '是',
        no: '否',
        partial: '部分',
        noStored: '找不到瀏覽器儲存的 Labs 匯出。',
        loaded: '已載入',
        noReport: '尚無報告。',
        noResult: '尚未載入結果。',
        noWarnings: '目前報告沒有警告。',
        exactReplay: '此實驗可由儲存的事件與終態雜湊精確重播。',
        partialReplay: '此實驗只能部分重播，因為缺少部分重播資料，或此頁尚未執行新的動力學 runner。',
        notReplay: '以目前載入資料尚不能重播此實驗。',
        copied: '已複製。',
        loadFailed: '無法載入 JSON。',
        hashFields: '納入欄位'
    }
};

const els = {
    languageSelect: document.querySelector('#languageSelect'),
    guidedModeButton: document.querySelector('#guidedModeButton'),
    researchModeButton: document.querySelector('#researchModeButton'),
    loadSampleButton: document.querySelector('#loadSampleButton'),
    quickReplayButton: document.querySelector('#quickReplayButton'),
    runAllButton: document.querySelector('#runAllButton'),
    loadedTypeText: document.querySelector('#loadedTypeText'),
    replayStatusText: document.querySelector('#replayStatusText'),
    benchmarkStatusText: document.querySelector('#benchmarkStatusText'),
    reportStatusText: document.querySelector('#reportStatusText'),
    guidedAnswerText: document.querySelector('#guidedAnswerText'),
    guidedChecklist: document.querySelector('#guidedChecklist'),
    loadCurrentButton: document.querySelector('#loadCurrentButton'),
    loadStoredButton: document.querySelector('#loadStoredButton'),
    fileInput: document.querySelector('#fileInput'),
    linkInput: document.querySelector('#linkInput'),
    pasteInput: document.querySelector('#pasteInput'),
    loadLinkButton: document.querySelector('#loadLinkButton'),
    loadPasteButton: document.querySelector('#loadPasteButton'),
    storedList: document.querySelector('#storedList'),
    inspectGrid: document.querySelector('#inspectGrid'),
    validationLevelCards: document.querySelector('#validationLevelCards'),
    reproGrid: document.querySelector('#reproGrid'),
    warningList: document.querySelector('#warningList'),
    replayConfigButton: document.querySelector('#replayConfigButton'),
    replayEventButton: document.querySelector('#replayEventButton'),
    strictReplayButton: document.querySelector('#strictReplayButton'),
    compareReplayButton: document.querySelector('#compareReplayButton'),
    replayResultPanel: document.querySelector('#replayResultPanel'),
    benchmarkBody: document.querySelector('#benchmarkBody'),
    observableChecks: document.querySelector('#observableChecks'),
    topologyChecks: document.querySelector('#topologyChecks'),
    hashAuditGrid: document.querySelector('#hashAuditGrid'),
    reportPanel: document.querySelector('#reportPanel'),
    exportReportButton: document.querySelector('#exportReportButton'),
    exportBundleButton: document.querySelector('#exportBundleButton'),
    copyBundleButton: document.querySelector('#copyBundleButton'),
    bundlePreview: document.querySelector('#bundlePreview')
};

let language = getLanguage();
let validationMode = new URLSearchParams(window.location.search).get('mode') === 'guided'
    ? 'guided'
    : (localStorage.getItem('topoboard-labs:validation-mode') || 'research');
let loaded = createSampleExperiment();
let currentReplay = null;
let currentReport = null;
let currentBundle = null;

function t(key) {
    return I18N[language]?.[key] || I18N.en[key] || uiText(key, language) || key;
}

function setLanguage(nextLanguage) {
    language = nextLanguage === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
    localStorage.setItem('topoboard-labs-language', language);
    localStorage.setItem('topological-boardgame:language', language);
    els.languageSelect.value = language;
    for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
    renderAll();
}

function setValidationMode(mode) {
    validationMode = mode === 'guided' ? 'guided' : 'research';
    document.body.dataset.validationMode = validationMode;
    els.guidedModeButton.setAttribute('aria-pressed', validationMode === 'guided' ? 'true' : 'false');
    els.researchModeButton.setAttribute('aria-pressed', validationMode === 'research' ? 'true' : 'false');
    localStorage.setItem('topoboard-labs:validation-mode', validationMode);
}

function metadataRow(label, value) {
    const item = document.createElement('div');
    item.innerHTML = `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(formatValue(value))}</dd>`;
    return item;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function formatValue(value) {
    if (value === undefined || value === null || value === '') return '-';
    if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return stableStringify(value).slice(0, 140);
    return String(value);
}

function badge(status) {
    return `<span class="status-badge ${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

function targetModelName() {
    const id = loaded.modelIds[0];
    return id ? text(modelById(id).name, language) : '-';
}

function renderInspect() {
    els.loadedTypeText.textContent = loaded.objectType;
    els.inspectGrid.replaceChildren(
        metadataRow(t('loadedType'), loaded.objectType),
        metadataRow('targetId', targetId(loaded)),
        metadataRow('model', targetModelName()),
        metadataRow('modelId', loaded.modelIds.join(', ') || '-'),
        metadataRow('topologyId', loaded.topologyIds.join(', ') || '-'),
        metadataRow('localRuleId', loaded.config?.localRuleId || loaded.config?.localRuleId || loaded.config?.metadata?.localRuleId || '-'),
        metadataRow('seedPlan', loaded.seedPlan || loaded.config?.seed || '-'),
        metadataRow('steps', loaded.stepCount ?? '-'),
        metadataRow('observables', loaded.observableIds.join(', ') || '-'),
        metadataRow('appVersion', loaded.config?.appVersion || loaded.result?.appVersion || LAB_APP_VERSION),
        metadataRow('schema', `${loaded.config?.schemaName || 'legacy'} @ ${loaded.config?.schemaVersion || 'unknown'}`)
    );

    els.validationLevelCards.replaceChildren();
    for (const card of validationLevelCards(loaded)) {
        const node = document.createElement('article');
        node.className = 'validation-card';
        node.innerHTML = `
            <h3>${escapeHtml(card.modelName)}</h3>
            <p>${badge(card.validationLevel)}</p>
            <p>${escapeHtml(card.why)}</p>
            <small>${escapeHtml(card.benchmarkStatus)} · ${escapeHtml(card.reproducibilityStatus)}</small>
        `;
        els.validationLevelCards.append(node);
    }
}

function renderReproSummary() {
    const metadata = reproducibilityMetadataForLoaded(loaded);
    els.reproGrid.replaceChildren(
        metadataRow('schemaVersion', metadata.schemaVersion),
        metadataRow('appVersion', metadata.appVersion),
        metadataRow('modelVersion', metadata.modelVersion),
        metadataRow('engineVersion', metadata.engineVersion),
        metadataRow('topologyRegistryVersion', metadata.topologyRegistryVersion),
        metadataRow('observableRegistryVersion', metadata.observableRegistryVersion),
        metadataRow('ruleRegistryVersion', metadata.ruleRegistryVersion),
        metadataRow('rngAlgorithm', metadata.rngAlgorithm),
        metadataRow('rngSeed', metadata.rngSeed),
        metadataRow('configHash', metadata.configHash),
        metadataRow('stateHashInitial', metadata.stateHashInitial),
        metadataRow('stateHashFinal', metadata.stateHashFinal),
        metadataRow('eventLogHash', metadata.eventLogHash),
        metadataRow('resultHash', metadata.resultHash),
        metadataRow('exportManifestHash', metadata.exportManifestHash),
        metadataRow('deterministicReplaySupported', metadata.deterministicReplaySupported ? t('yes') : t('no'))
    );
    renderWarnings(metadata.warnings.map((message) => ({ severity: 'warning', message, recommendation: 'Re-export with complete metadata.', canProceed: true })));
}

function renderWarnings(warnings = []) {
    els.warningList.replaceChildren();
    if (!warnings.length) {
        const item = document.createElement('p');
        item.textContent = t('noWarnings');
        els.warningList.append(item);
        return;
    }
    for (const entry of warnings.slice(0, 18)) {
        const item = document.createElement('div');
        item.className = entry.severity || 'warning';
        item.innerHTML = `<strong>${escapeHtml(entry.severity || 'warning')}</strong><p>${escapeHtml(entry.message || entry)}</p><small>${escapeHtml(entry.recommendation || '')}</small>`;
        els.warningList.append(item);
    }
}

function renderReplay() {
    const replay = currentReplay || replayFromConfigSeed(loaded);
    els.replayStatusText.textContent = replay.status;
    els.replayResultPanel.innerHTML = `
        <h3>${escapeHtml(replay.mode)} ${badge(replay.status)}</h3>
        <p>${escapeHtml(replay.comparison.details.join(' '))}</p>
        <small>${escapeHtml(replay.limitations.join(' '))}</small>
    `;
    renderGuided(replay);
}

function renderGuided(replay = currentReplay) {
    const metadata = reproducibilityMetadataForLoaded(loaded);
    const hasSeed = Boolean(metadata.rngSeed || metadata.seedPlan);
    const hasTopology = Boolean(loaded.topologyIds.length);
    const hasRule = Boolean(loaded.config?.localRuleId || loaded.config?.fixedParameters || loaded.config?.parameters);
    const isReplayable = replay?.status === 'exact_match' || replay?.status === 'partially_reproducible';
    const matched = replay?.status === 'exact_match';
    const textValue = matched
        ? t('exactReplay')
        : isReplayable
            ? t('partialReplay')
            : t('notReplay');
    els.guidedAnswerText.textContent = textValue;
    const items = [
        [t('seedSaved'), hasSeed, hasSeed ? t('yes') : t('no')],
        [t('topologySaved'), hasTopology, hasTopology ? t('yes') : t('no')],
        [t('ruleSaved'), hasRule, hasRule ? t('yes') : t('no')],
        [t('resultReplayable'), isReplayable, matched ? t('yes') : isReplayable ? t('partial') : t('no')],
        [t('replayMatched'), matched, matched ? t('yes') : t('no')]
    ];
    els.guidedChecklist.replaceChildren();
    for (const [label, ok, value] of items) {
        const node = document.createElement('article');
        node.className = `check-item ${ok ? 'pass' : 'warn'}`;
        node.innerHTML = `<strong>${escapeHtml(label)}</strong><small>${escapeHtml(value)}</small>`;
        els.guidedChecklist.append(node);
    }
}

function selectedBenchmarkCategories() {
    return [...document.querySelectorAll('.benchmark-filter-grid input:checked')].map((input) => input.value);
}

function renderBenchmarks() {
    const categories = new Set(selectedBenchmarkCategories());
    const report = currentReport || buildValidationReport(loaded, currentReplay);
    const rows = report.benchmarkResults.filter((entry) => {
        const source = BENCHMARK_REGISTRY.find((benchmark) => benchmark.benchmarkId === entry.benchmarkId);
        return categories.has(source?.category || 'engine');
    });
    const passed = rows.filter((entry) => entry.status === 'passed').length;
    els.benchmarkStatusText.textContent = `${passed}/${rows.length}`;
    els.benchmarkBody.replaceChildren();
    for (const entry of rows) {
        const source = BENCHMARK_REGISTRY.find((benchmark) => benchmark.benchmarkId === entry.benchmarkId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(source?.name || entry.benchmarkId)}</td>
            <td>${escapeHtml(source?.category || '')}</td>
            <td>${badge(entry.status)}</td>
            <td>${escapeHtml(source?.method || entry.message)}</td>
            <td>${escapeHtml(entry.limitations.join(' '))}</td>
        `;
        els.benchmarkBody.append(row);
    }
}

function renderObservableChecks() {
    const checks = currentReport?.observableChecks || observableConsistencyChecks(loaded);
    els.observableChecks.replaceChildren();
    if (!checks.length) {
        els.observableChecks.append(cardNode('observable', t('noResult'), 'No observable list was found in the loaded object.', 'unknown'));
        return;
    }
    for (const check of checks) {
        els.observableChecks.append(cardNode(check.observableId, check.definition, `${check.computeMethod} · ${check.units}`, check.benchmarkStatus, check.limitations.join(' ')));
    }
}

function renderTopologyChecks() {
    const checks = currentReport?.topologyChecks || topologyValidationChecks(loaded);
    els.topologyChecks.replaceChildren();
    if (!checks.length) {
        els.topologyChecks.append(cardNode('topology', 'No topology list was found.', 'Load a config with topology metadata.', 'unknown'));
        return;
    }
    for (const check of checks) {
        const warningCount = check.consistencyWarnings.length;
        const invariantCount = check.computedInvariants.length;
        els.topologyChecks.append(cardNode(
            check.topologyId,
            `${invariantCount} invariants · ${warningCount} warning(s)`,
            `cycle/seam exactness: ${check.cycleAndSeamMetadata.exactness}`,
            warningCount ? 'warning' : 'passed',
            check.cycleAndSeamMetadata.limitations?.join(' ') || ''
        ));
    }
}

function cardNode(title, body, detail, status = 'unknown', footer = '') {
    const node = document.createElement('article');
    node.className = 'validation-card';
    node.innerHTML = `
        <h3>${escapeHtml(title)}</h3>
        <p>${badge(status)}</p>
        <p>${escapeHtml(body)}</p>
        <small>${escapeHtml(detail || '')}</small>
        ${footer ? `<small>${escapeHtml(footer)}</small>` : ''}
    `;
    return node;
}

function renderHashAudit() {
    const audits = currentReport?.hashAudit || [
        hashAuditForObject(loaded.objectType, loaded.object, 'loaded-object', targetId(loaded)),
        ...(loaded.config ? [hashAuditForObject('config', loaded.config, 'config', targetId(loaded))] : []),
        ...(loaded.result ? [hashAuditForObject('result', loaded.result, 'result', targetId(loaded))] : []),
        ...(loaded.manifest ? [hashAuditForObject('manifest', loaded.manifest, 'manifest', targetId(loaded))] : [])
    ];
    els.hashAuditGrid.replaceChildren();
    for (const audit of audits) {
        const node = document.createElement('article');
        node.className = 'hash-card';
        node.innerHTML = `
            <h3>${escapeHtml(audit.objectType)}</h3>
            <p><strong>${escapeHtml(audit.hashValue)}</strong></p>
            <p>${escapeHtml(audit.hashAlgorithm)} · ${escapeHtml(audit.hashVersion)}</p>
            <small>${audit.fieldsExcluded.length} excluded field(s)</small>
            <div class="hash-fields"><strong>${escapeHtml(t('hashFields'))}</strong><br>${escapeHtml(audit.fieldsIncluded.slice(0, 60).join(', '))}</div>
        `;
        els.hashAuditGrid.append(node);
    }
}

function renderReport() {
    if (!currentReport) currentReport = buildValidationReport(loaded, currentReplay);
    const report = currentReport;
    const failures = report.failures.length;
    const warnings = report.warnings.length;
    els.reportStatusText.textContent = report.reproducibilityStatus;
    els.reportPanel.innerHTML = `
        <div class="report-summary-grid">
            <article class="check-item ${failures ? 'fail' : 'pass'}"><strong>${escapeHtml(report.reproducibilityStatus)}</strong><small>reproducibility</small></article>
            <article class="check-item ${report.replayStatus === 'exact_match' ? 'pass' : 'warn'}"><strong>${escapeHtml(report.replayStatus)}</strong><small>replay</small></article>
            <article class="check-item ${failures ? 'fail' : 'pass'}"><strong>${failures}</strong><small>failures</small></article>
            <article class="check-item ${warnings ? 'warn' : 'pass'}"><strong>${warnings}</strong><small>warnings</small></article>
        </div>
        <p><strong>reportHash</strong>: ${escapeHtml(report.reportHash)}</p>
        <p>${escapeHtml(report.recommendations.join(' '))}</p>
        <p><strong>Checked:</strong> ${escapeHtml(report.summary?.checked?.join(', ') || '')}</p>
    `;
    renderWarnings(report.warnings);
    currentBundle = buildReproducibilityBundle(loaded, report);
    els.bundlePreview.value = JSON.stringify(currentBundle.manifest, null, 2);
}

function renderStoredList() {
    const candidates = loadStoredValidationCandidates();
    els.storedList.replaceChildren();
    if (!candidates.length) {
        const node = document.createElement('p');
        node.textContent = t('noStored');
        els.storedList.append(node);
        return;
    }
    for (const candidate of candidates) {
        const node = document.createElement('button');
        node.type = 'button';
        node.className = 'stored-item';
        node.innerHTML = `<strong>${escapeHtml(candidate.objectType)}</strong><small>${escapeHtml(candidate.key)} · ${escapeHtml(candidate.storedAt || '')}</small>`;
        node.addEventListener('click', () => loadObject(candidate.wrapper || candidate.object, candidate.key));
        els.storedList.append(node);
    }
}

function renderAll() {
    renderInspect();
    renderReproSummary();
    renderReplay();
    renderBenchmarks();
    renderObservableChecks();
    renderTopologyChecks();
    renderHashAudit();
    renderReport();
    renderStoredList();
}

function loadObject(object, source = 'manual') {
    loaded = normalizeLoadedObject(object, source);
    currentReplay = null;
    currentReport = null;
    currentBundle = null;
    renderAll();
}

function loadCurrent() {
    const candidates = loadStoredValidationCandidates();
    const first = candidates.find((candidate) => candidate.object && candidate.objectType !== 'unreadable');
    if (first) loadObject(first.wrapper || first.object, first.key);
}

function parseJsonText(textValue) {
    const trimmed = String(textValue || '').trim();
    if (!trimmed) throw new Error('empty');
    if (trimmed.startsWith('http')) {
        const url = new URL(trimmed);
        const data = url.searchParams.get('data');
        if (!data) throw new Error('missing data parameter');
        return parseJsonText(data);
    }
    try {
        return JSON.parse(trimmed);
    } catch {
        const decoded = decodeURIComponent(trimmed);
        try {
            return JSON.parse(decoded);
        } catch {
            return JSON.parse(atob(decoded));
        }
    }
}

async function loadFile(file) {
    if (!file) return;
    const textValue = await file.text();
    loadObject(parseJsonText(textValue), file.name);
}

function runReplay(mode = 'config') {
    if (mode === 'event') currentReplay = replayFromEventLog(loaded, false);
    else if (mode === 'strict') currentReplay = replayFromEventLog(loaded, true);
    else currentReplay = replayFromConfigSeed(loaded);
    currentReport = buildValidationReport(loaded, currentReplay);
    currentBundle = buildReproducibilityBundle(loaded, currentReport);
    renderAll();
}

function runSuite() {
    currentReplay ||= replayFromConfigSeed(loaded);
    currentReport = buildValidationReport(loaded, currentReplay);
    currentBundle = buildReproducibilityBundle(loaded, currentReport);
    renderAll();
}

function exportReport() {
    if (!currentReport) runSuite();
    downloadText('topoboard-labs-validation-report.json', JSON.stringify(currentReport, null, 2), 'application/json');
}

function exportBundle() {
    if (!currentBundle) runSuite();
    downloadText('topoboard-reproducibility-bundle.json', bundleToJson(currentBundle), 'application/json');
}

async function copyBundle() {
    if (!currentBundle) runSuite();
    const textValue = bundleToJson(currentBundle);
    await navigator.clipboard?.writeText(textValue);
    els.bundlePreview.value = textValue.slice(0, 24000);
}

function install() {
    setValidationMode(validationMode);
    setLanguage(language);
    els.languageSelect.addEventListener('change', () => setLanguage(els.languageSelect.value));
    els.guidedModeButton.addEventListener('click', () => setValidationMode('guided'));
    els.researchModeButton.addEventListener('click', () => setValidationMode('research'));
    els.loadSampleButton.addEventListener('click', () => loadObject(createSampleExperiment().object, 'sample'));
    els.quickReplayButton.addEventListener('click', () => runReplay('config'));
    els.runAllButton.addEventListener('click', runSuite);
    els.loadCurrentButton.addEventListener('click', loadCurrent);
    els.loadStoredButton.addEventListener('click', renderStoredList);
    els.fileInput.addEventListener('change', () => loadFile(els.fileInput.files?.[0]).catch(() => alert(t('loadFailed'))));
    els.loadPasteButton.addEventListener('click', () => {
        try {
            loadObject(parseJsonText(els.pasteInput.value), 'pasted-json');
        } catch {
            alert(t('loadFailed'));
        }
    });
    els.loadLinkButton.addEventListener('click', () => {
        try {
            loadObject(parseJsonText(els.linkInput.value), 'share-link');
        } catch {
            alert(t('loadFailed'));
        }
    });
    els.replayConfigButton.addEventListener('click', () => runReplay('config'));
    els.replayEventButton.addEventListener('click', () => runReplay('event'));
    els.strictReplayButton.addEventListener('click', () => runReplay('strict'));
    els.compareReplayButton.addEventListener('click', () => runReplay('config'));
    els.exportReportButton.addEventListener('click', exportReport);
    els.exportBundleButton.addEventListener('click', exportBundle);
    els.copyBundleButton.addEventListener('click', copyBundle);
    for (const input of document.querySelectorAll('.benchmark-filter-grid input')) {
        input.addEventListener('change', renderBenchmarks);
    }
    const queryData = new URLSearchParams(window.location.search).get('data');
    if (queryData) {
        try {
            loadObject(parseJsonText(queryData), 'query-data');
        } catch {
            renderAll();
        }
    } else {
        renderAll();
    }
}

install();
