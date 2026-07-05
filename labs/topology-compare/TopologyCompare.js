import {
    LAB_APP_VERSION,
    LAB_SCHEMA_VERSION,
    LAB_SECTIONS,
    MODEL_REGISTRY,
    TOPOLOGY_REGISTRY,
    buildBasicReproducibilityMetadata,
    getLanguage,
    initialConditionOptions,
    isTopologyCompatible,
    labHash,
    modelById,
    stableStringify,
    text,
    topologyById,
    uiText
} from '../experiments/LabExperimentRegistry.js';
import {
    buildRunMatrix,
    downloadText,
    parseList,
    parseScalar,
    toCsv
} from '../experiments/LabBatchCore.js';
import { researchDescription, researchWarning } from '../LabResearchDescriptions.js';
import {
    EVENT_DETECTOR_REGISTRY,
    INITIAL_MAPPING_METHODS,
    buildTopologyComparisonResult,
    computeCycleData,
    computeTopologyInvariants,
    detectorsForModel,
    divergenceRows,
    eventRows,
    invariantRows,
    modelTopologyFeatureSummary,
    topologySiteCount
} from './LabTopologyCompareCore.js';
import { installLabLanguageMenu, syncLabLanguageMenu } from '../experiments/LabLanguageMenu.js';

async function runBatchSequentialLazy(...args) {
    const { runBatchSequential } = await import('../experiments/LabBatchRunner.js');
    return runBatchSequential(...args);
}

const I18N = {
    en: {
        experimentBuilder: 'Experiment Builder',
        validationSuite: 'Validation & Reproducibility',
        phaseDiagrams: 'Phase Diagrams',
        publicationExport: 'Publication & Dataset Export',
        pageTitle: 'Topology Comparison',
        subtitle: 'Same local rule. Different underlying space.',
        modeResearch: 'Research Comparison',
        modeGuided: 'Same Rule, Different Space',
        purposeEyebrow: 'Purpose',
        purposeTitle: 'What changes when topology changes?',
        purposeText: 'Compare discrete topological dynamics across spaces while preserving the model, local rule, fixed parameters, seed plan, initial-condition family, and observable set.',
        guidedDefaults: 'Use guided defaults',
        guidedRun: 'Run guided comparison',
        comparisonMode: 'Comparison mode',
        totalRuns: 'Total runs',
        selectModel: 'Select model',
        selectTopologies: 'Reference and comparison topologies',
        topologyHelp: 'Choose one reference topology and one or more comparison topologies. Incompatible entries are disabled with a reason.',
        mapping: 'Initial condition mapping',
        mappingMethod: 'Mapping method',
        manualMapping: 'Manual mapping table',
        localRule: 'Local rule and fixed parameters',
        ruleHelp: "Same local rule means the same rule function is applied to each topology's local adjacency structure.",
        seedPlan: 'Seed plan',
        singleSeed: 'Single seed',
        seedList: 'Seed list',
        seedRange: 'Seed range',
        seeds: 'Seeds',
        seedEnd: 'Seed end / count',
        observables: 'Observables and detectors',
        observableHelp: 'Select standard model observables and topology-sensitive event detectors. Detector outputs are labeled by exactness and confidence.',
        eventDetectors: 'Topology-sensitive event detectors',
        runComparison: 'Run synchronized comparison',
        generate: 'Generate comparison',
        statusReady: 'Configure the comparison before running.',
        dashboard: 'Comparison dashboard',
        observableComparison: 'Observable comparison',
        differenceView: 'Difference view',
        seamOverlay: 'Seam and cycle overlay',
        invariants: 'Topology invariant table',
        invariant: 'Invariant',
        value: 'Value',
        exactness: 'Exactness',
        method: 'Method',
        eventTimeline: 'Event timeline',
        step: 'Step',
        eventType: 'Event type',
        confidence: 'Confidence',
        divergence: 'Topology-sensitive divergence score',
        divergenceHelp: 'A normalized difference between observable time series under the same model, rule, seed plan, and mapping method. It is exploratory and not a universal physical invariant.',
        reference: 'Reference',
        comparison: 'Comparison',
        observable: 'Observable',
        distanceMethod: 'Distance method',
        exportDataset: 'Export comparison dataset',
        exportNotes: 'Exports include app version, topology hashes, fixed parameters, mapping method, seeds, observables, event detectors, exactness labels, warnings, and reproducibility notes.',
        exportInvariantCsv: 'Export invariants CSV',
        exportEventCsv: 'Export events CSV',
        exportDivergenceCsv: 'Export divergence CSV',
        referenceTopology: 'Reference',
        compareTopology: 'Compare',
        compatible: 'compatible',
        incompatible: 'incompatible',
        reasonIncompatible: 'Current model adapter does not support this topology.',
        requiredTopologyFeatures: 'Required topology features',
        requiredLatticeFeatures: 'Required lattice features',
        topologySensitiveObservables: 'Topology-sensitive observables',
        availableObservables: 'Available observables',
        warningsLimitations: 'Warnings and limitations',
        generated: 'Comparison generated.',
        complete: 'Comparison complete.',
        needTopologies: 'Choose one reference topology and at least one comparison topology.',
        needObservable: 'Choose at least one observable.',
        mappingWarning: 'Exact one-to-one mapping may be impossible across different topologies. The mapping method is stored in the result.',
        resolvedSeeds: 'Resolved seeds',
        fixedParameter: 'Fixed parameter',
        ruleHash: 'Rule hash',
        neighborhood: 'Neighborhood',
        updateSchedule: 'Update schedule',
        workerFailed: 'Worker failed; using fallback.',
        fallback: 'Main thread fallback',
        startLog: 'start',
        finishLog: 'finish',
        failed: 'failed',
        cancelled: 'cancelled',
        noResult: 'Generate and run a comparison to inspect synchronized results.',
        safeDefaultsApplied: 'Guided defaults applied.',
        sites: 'sites',
        hash: 'hash',
        exactnessNote: 'Exactness labels are shown for every invariant or detector output.',
        initialCondition: 'Initial condition',
        model: 'Model',
        topology: 'Topology',
        seedMode: 'Seed mode',
        repeats: 'Repeats per topology',
        steps: 'Steps',
        chartTitle: 'Observable response by topology and seeded run',
        chartYAxis: 'Observable value',
        chartXAxis: 'Topology / seeded run',
        chartReference: 'Reference topology',
        chartComparison: 'Comparison topology'
    },
    zh: {
        experimentBuilder: '實驗建構器',
        validationSuite: '驗證與可重現性',
        phaseDiagrams: '相圖',
        publicationExport: '出版與資料集匯出',
        pageTitle: '拓撲比較',
        subtitle: '相同局部規則。不同底層空間。',
        modeResearch: '研究比較',
        modeGuided: '相同規則，不同空間',
        purposeEyebrow: '目的',
        purposeTitle: '拓撲改變時，什麼會改變？',
        purposeText: '在保留模型、局部規則、固定參數、seed plan、初始條件家族與觀測量集合時，比較離散拓撲動力學在不同空間中的差異。',
        guidedDefaults: '使用引導預設',
        guidedRun: '執行引導比較',
        comparisonMode: '比較模式',
        totalRuns: '總執行數',
        selectModel: '選擇模型',
        selectTopologies: '參考拓撲與比較拓撲',
        topologyHelp: '選一個參考拓撲與一個以上比較拓撲。不相容項目會停用並顯示原因。',
        mapping: '初始條件映射',
        mappingMethod: '映射方法',
        manualMapping: '手動映射表',
        localRule: '局部規則與固定參數',
        ruleHelp: '相同局部規則代表同一個規則函數套用到每個拓撲自己的局部 adjacency structure。',
        seedPlan: '種子計畫',
        singleSeed: '單一 seed',
        seedList: 'seed 列表',
        seedRange: 'seed 範圍',
        seeds: 'Seeds',
        seedEnd: 'Seed 終點 / 數量',
        observables: '觀測量與偵測器',
        observableHelp: '選擇標準模型觀測量與 topology-sensitive event detectors。偵測器輸出會標示 exactness 與 confidence。',
        eventDetectors: 'Topology-sensitive event detectors',
        runComparison: '執行同步比較',
        generate: '產生比較',
        statusReady: '請先設定比較再執行。',
        dashboard: '比較儀表板',
        observableComparison: '觀測量比較',
        differenceView: '差異視圖',
        seamOverlay: '接縫與 cycle overlay',
        invariants: '拓撲 invariant 表',
        invariant: 'Invariant',
        value: '值',
        exactness: 'Exactness',
        method: '方法',
        eventTimeline: '事件時間線',
        step: '步數',
        eventType: '事件類型',
        confidence: '信心',
        divergence: 'Topology-sensitive divergence score',
        divergenceHelp: '在相同模型、規則、seed plan 與映射方法下，比較觀測量時間序列的正規化差異。這是探索性指標，不是 universal physical invariant。',
        reference: '參考',
        comparison: '比較',
        observable: '觀測量',
        distanceMethod: '距離方法',
        exportDataset: '匯出比較資料集',
        exportNotes: '匯出包含 app version、topology hashes、固定參數、映射方法、seeds、觀測量、事件偵測器、exactness labels、警告與可重現說明。',
        exportInvariantCsv: '匯出 invariants CSV',
        exportEventCsv: '匯出 events CSV',
        exportDivergenceCsv: '匯出 divergence CSV',
        referenceTopology: '參考',
        compareTopology: '比較',
        compatible: '相容',
        incompatible: '不相容',
        reasonIncompatible: '目前模型 adapter 不支援此拓撲。',
        requiredTopologyFeatures: '必要拓撲特徵',
        requiredLatticeFeatures: '必要晶格特徵',
        topologySensitiveObservables: 'Topology-sensitive 觀測量',
        availableObservables: '可用觀測量',
        warningsLimitations: '警告與限制',
        generated: '已產生比較。',
        complete: '比較完成。',
        needTopologies: '請選一個參考拓撲與至少一個比較拓撲。',
        needObservable: '請至少選一個觀測量。',
        mappingWarning: '不同拓撲之間可能無法精確一對一映射。結果會儲存映射方法。',
        resolvedSeeds: '已解析 seeds',
        fixedParameter: '固定參數',
        ruleHash: '規則 hash',
        neighborhood: '鄰域',
        updateSchedule: '更新排程',
        workerFailed: 'Worker 失敗，改用備援。',
        fallback: '主執行緒備援',
        startLog: '開始',
        finishLog: '完成',
        failed: '失敗',
        cancelled: '已取消',
        noResult: '請產生並執行比較以檢視同步結果。',
        safeDefaultsApplied: '已套用引導預設。',
        sites: 'sites',
        hash: 'hash',
        exactnessNote: '每個 invariant 或 detector output 都會顯示 exactness label。',
        initialCondition: '初始條件',
        model: '模型',
        topology: '拓撲',
        seedMode: 'Seed 模式',
        repeats: '每拓撲重複次數',
        steps: '步數',
        chartTitle: '依拓撲與定種子執行比較觀測量反應',
        chartYAxis: '觀測量數值',
        chartXAxis: '拓撲 / 定種子執行',
        chartReference: '參考拓撲',
        chartComparison: '比較拓撲'
    }
};

const els = {
    languageSelect: document.querySelector('#languageSelect'),
    researchModeButton: document.querySelector('#researchModeButton'),
    guidedModeButton: document.querySelector('#guidedModeButton'),
    guidedDefaultsButton: document.querySelector('#guidedDefaultsButton'),
    guidedRunButton: document.querySelector('#guidedRunButton'),
    comparisonModeText: document.querySelector('#comparisonModeText'),
    totalRunsText: document.querySelector('#totalRunsText'),
    workerStatus: document.querySelector('#workerStatus'),
    currentRunText: document.querySelector('#currentRunText'),
    modelSelect: document.querySelector('#modelSelect'),
    modelMetadata: document.querySelector('#modelMetadata'),
    modelCards: document.querySelector('#modelCards'),
    topologyCards: document.querySelector('#topologyCards'),
    initialConditionSelect: document.querySelector('#initialConditionSelect'),
    mappingMethodSelect: document.querySelector('#mappingMethodSelect'),
    manualMappingInput: document.querySelector('#manualMappingInput'),
    mappingWarning: document.querySelector('#mappingWarning'),
    parameterList: document.querySelector('#parameterList'),
    ruleMetadata: document.querySelector('#ruleMetadata'),
    seedModeSelect: document.querySelector('#seedModeSelect'),
    seedValueInput: document.querySelector('#seedValueInput'),
    seedEndInput: document.querySelector('#seedEndInput'),
    repeatInput: document.querySelector('#repeatInput'),
    stepsInput: document.querySelector('#stepsInput'),
    resolvedSeedsText: document.querySelector('#resolvedSeedsText'),
    observableList: document.querySelector('#observableList'),
    detectorList: document.querySelector('#detectorList'),
    generateButton: document.querySelector('#generateButton'),
    startButton: document.querySelector('#startButton'),
    pauseButton: document.querySelector('#pauseButton'),
    resumeButton: document.querySelector('#resumeButton'),
    cancelButton: document.querySelector('#cancelButton'),
    comparisonStatus: document.querySelector('#comparisonStatus'),
    runProgress: document.querySelector('#runProgress'),
    runLog: document.querySelector('#runLog'),
    sideBySidePanel: document.querySelector('#sideBySidePanel'),
    observableChart: document.querySelector('#observableChart'),
    differencePanel: document.querySelector('#differencePanel'),
    cyclePanel: document.querySelector('#cyclePanel'),
    invariantTableBody: document.querySelector('#invariantTableBody'),
    eventTableBody: document.querySelector('#eventTableBody'),
    divergenceTableBody: document.querySelector('#divergenceTableBody'),
    exportJsonButton: document.querySelector('#exportJsonButton'),
    exportInvariantCsvButton: document.querySelector('#exportInvariantCsvButton'),
    exportEventCsvButton: document.querySelector('#exportEventCsvButton'),
    exportDivergenceCsvButton: document.querySelector('#exportDivergenceCsvButton'),
    exportManifestButton: document.querySelector('#exportManifestButton'),
    exportPreview: document.querySelector('#exportPreview')
};

let language = getLanguage();
let compareMode = new URLSearchParams(window.location.search).get('mode') === 'guided'
    ? 'guided'
    : (localStorage.getItem('topoboard-labs:topology-compare-mode') || 'research');
let currentComparisonConfig = null;
let currentBatchConfig = null;
let currentComparisonResult = null;
let activeWorker = null;
let fallbackController = null;

function storeValidationCandidate(type, envelope) {
    if (!envelope) return;
    try {
        const payload = {
            type,
            storedAt: new Date().toISOString(),
            sourceRoute: '/labs/topology-compare/',
            envelope
        };
        localStorage.setItem('topoboard-labs:last-validation-object', JSON.stringify(payload));
        localStorage.setItem(`topoboard-labs:last-${type}`, JSON.stringify(payload));
    } catch {
        // Validation can still load pasted/uploaded JSON when browser storage is unavailable.
    }
}

function t(key) {
    return I18N[language]?.[key] || I18N.en[key] || uiText(key, language);
}

function metadataRow(label, value) {
    const item = document.createElement('div');
    item.innerHTML = `<dt>${label}</dt><dd>${value}</dd>`;
    return item;
}

function setLanguage(nextLanguage) {
    language = nextLanguage === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
    localStorage.setItem('topoboard-labs-language', language);
    localStorage.setItem('topological-boardgame:language', language);
    els.languageSelect.value = language;
    syncLabLanguageMenu(language);
    for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
    renderModelSelect();
    renderAll();
    updatePanelCollapseLabels();
}

function setCompareMode(mode) {
    compareMode = mode === 'guided' ? 'guided' : 'research';
    localStorage.setItem('topoboard-labs:topology-compare-mode', compareMode);
    document.body.dataset.compareMode = compareMode;
    els.researchModeButton.setAttribute('aria-pressed', String(compareMode === 'research'));
    els.guidedModeButton.setAttribute('aria-pressed', String(compareMode === 'guided'));
    els.comparisonModeText.textContent = compareMode === 'guided' ? t('modeGuided') : 'multi_seed_statistical';
}

function modelSupportsComparison(model) {
    return (model.compatibleTopologies || []).length >= 2 && model.observables?.length;
}

function selectedModel() {
    return modelById(els.modelSelect.value);
}

function renderModelSelect() {
    const previous = els.modelSelect.value || 'ising_domain_game';
    els.modelSelect.replaceChildren();
    for (const section of LAB_SECTIONS) {
        const group = document.createElement('optgroup');
        group.label = section;
        for (const model of MODEL_REGISTRY.filter((entry) => entry.section === section)) {
            const option = new Option(text(model.name, language), model.id);
            option.disabled = !modelSupportsComparison(model);
            group.append(option);
        }
        if (group.children.length) els.modelSelect.append(group);
    }
    const options = [...els.modelSelect.options];
    els.modelSelect.value = options.some((option) => option.value === previous && !option.disabled)
        ? previous
        : options.find((option) => !option.disabled)?.value || 'ising_domain_game';
}

function renderModelMetadata() {
    const model = selectedModel();
    const features = modelTopologyFeatureSummary(model);
    const research = researchDescription(model.id, language);
    els.modelMetadata.replaceChildren(
        metadataRow(uiText('family', language), `${model.section} / ${model.family}`),
        metadataRow(uiText('validation', language), model.validationLevel),
        metadataRow(research.labels.objective, research.objective),
        metadataRow(research.labels.model, research.model),
        metadataRow(research.labels.dynamics, research.dynamics),
        metadataRow(research.labels.ensemble, research.ensemble),
        metadataRow(research.labels.scope, research.scope),
        metadataRow(t('availableObservables'), String(model.observables.length)),
        metadataRow(uiText('compatibleTopologies', language), model.compatibleTopologies.join(', '))
    );
    els.modelCards.replaceChildren();
    const cards = [
        [t('requiredTopologyFeatures'), features.requiredTopologyFeatures],
        [t('requiredLatticeFeatures'), features.requiredLatticeFeatures],
        [t('topologySensitiveObservables'), features.topologySensitiveObservables.join(', ') || '-'],
        [t('warningsLimitations'), (model.warnings || []).map((warning) => researchWarning(warning, language)).join(' ') || '-']
    ];
    for (const [title, body] of cards) {
        const card = document.createElement('article');
        card.className = 'model-info-card';
        card.innerHTML = `<h3>${title}</h3><p>${body}</p>`;
        els.modelCards.append(card);
    }
}

function selectedReferenceTopologyId() {
    return els.topologyCards.querySelector('input[name="referenceTopology"]:checked')?.value || selectedModel().compatibleTopologies[0];
}

function selectedComparisonTopologyIds() {
    return [...els.topologyCards.querySelectorAll('input[data-compare-topology]:checked')].map((input) => input.value);
}

function renderTopologies() {
    const model = selectedModel();
    const previousReference = selectedReferenceTopologyId();
    const previousComparisons = new Set(selectedComparisonTopologyIds());
    els.topologyCards.replaceChildren();
    for (const topology of TOPOLOGY_REGISTRY) {
        const compatible = isTopologyCompatible(model, topology.id);
        const invariants = computeTopologyInvariants(topology);
        const orientability = invariants.find((entry) => entry.name === 'orientability');
        const euler = invariants.find((entry) => entry.name === 'Euler characteristic');
        const vertices = invariants.find((entry) => entry.name === 'vertices');
        const referenceChecked = compatible && (topology.id === previousReference || (!previousReference && topology.id === model.compatibleTopologies[0]));
        const compareChecked = compatible && (previousComparisons.has(topology.id) || (!previousComparisons.size && ['cylinder', 'torus', 'mobius'].includes(topology.id) && topology.id !== previousReference));
        const card = document.createElement('article');
        card.className = `topology-choice-card${compatible ? '' : ' is-disabled'}`;
        card.innerHTML = `
            <div class="topology-choice-head">
                <strong>${text(topology.name, language)}</strong>
                <label><input type="radio" name="referenceTopology" value="${topology.id}" ${referenceChecked ? 'checked' : ''} ${compatible ? '' : 'disabled'}> ${t('referenceTopology')}</label>
                <label><input type="checkbox" data-compare-topology value="${topology.id}" ${compareChecked ? 'checked' : ''} ${compatible ? '' : 'disabled'}> ${t('compareTopology')}</label>
            </div>
            <p>${topology.dimension}D / ${topology.latticeTypes.join(', ')} / ${topology.boundaryCondition}</p>
            <p>${vertices?.value ?? topologySiteCount(topology)} ${t('sites')} / orientable: ${orientability?.value ?? 'unknown'} / Euler: ${euler?.value ?? 'unknown'}</p>
            <span class="exactness-pill">${orientability?.exactness || 'unknown'}</span>
            <p>${compatible ? t('compatible') : `${t('incompatible')}: ${t('reasonIncompatible')}`}</p>
            <code>${t('hash')}: ${topology.hash}</code>
        `;
        card.querySelectorAll('input').forEach((input) => input.addEventListener('change', () => {
            if (input.name === 'referenceTopology') {
                const compare = card.querySelector('input[data-compare-topology]');
                if (compare?.checked) compare.checked = false;
            }
            updateRunEstimate();
            renderInvariantPreview();
        }));
        els.topologyCards.append(card);
    }
    ensureDistinctReferenceAndComparisons();
}

function ensureDistinctReferenceAndComparisons() {
    const reference = selectedReferenceTopologyId();
    const duplicate = els.topologyCards.querySelector(`input[data-compare-topology][value="${reference}"]`);
    if (duplicate) duplicate.checked = false;
}

function renderInitialConditions() {
    const previous = els.initialConditionSelect.value;
    const options = initialConditionOptions(selectedModel(), language);
    els.initialConditionSelect.replaceChildren(...options.map((option) => new Option(option.label, option.id)));
    els.initialConditionSelect.value = options.some((option) => option.id === previous) ? previous : options[0]?.id || '';
}

function renderMappingMethods() {
    const previous = els.mappingMethodSelect.value || 'seed_preserving_regeneration';
    els.mappingMethodSelect.replaceChildren();
    for (const method of INITIAL_MAPPING_METHODS) {
        els.mappingMethodSelect.append(new Option(text(method.label, language), method.id));
    }
    els.mappingMethodSelect.value = INITIAL_MAPPING_METHODS.some((method) => method.id === previous) ? previous : 'seed_preserving_regeneration';
    updateMappingWarning();
}

function updateMappingWarning() {
    const method = INITIAL_MAPPING_METHODS.find((entry) => entry.id === els.mappingMethodSelect.value);
    els.mappingWarning.textContent = `${text(method?.description, language)} ${t('mappingWarning')}`;
}

function renderParameters() {
    els.parameterList.replaceChildren();
    const model = selectedModel();
    for (const parameter of model.parameters) {
        const row = document.createElement('div');
        row.className = 'sweep-row fixed-parameter-row';
        row.dataset.parameterId = parameter.id;
        row.dataset.parameterKind = parameter.kind || 'number';
        if (parameter.kind === 'boolean') {
            row.innerHTML = `
                <label>${t('fixedParameter')}<input class="parameter-label" value="${parameter.label}" readonly></label>
                <label>${uiText('valueList', language)}<select class="parameter-value"><option value="true">true</option><option value="false">false</option></select></label>
                <span class="help-text">${parameter.id}</span>
            `;
            row.querySelector('.parameter-value').value = String(Boolean(parameter.defaultValue));
        } else if (parameter.kind === 'choice') {
            row.innerHTML = `
                <label>${t('fixedParameter')}<input class="parameter-label" value="${parameter.label}" readonly></label>
                <label>${uiText('valueList', language)}<select class="parameter-value"></select></label>
                <span class="help-text">${parameter.id}</span>
            `;
            const select = row.querySelector('.parameter-value');
            for (const choice of parameter.choices || []) select.append(new Option(choice, choice));
            select.value = parameter.defaultValue;
        } else {
            row.innerHTML = `
                <label>${t('fixedParameter')}<input class="parameter-label" value="${parameter.label}" readonly></label>
                <label>${uiText('valueList', language)}<input class="parameter-value" value="${parameter.defaultValue}" type="number" step="any"></label>
                <span class="help-text">${parameter.units || parameter.id}</span>
            `;
        }
        row.querySelector('.parameter-value')?.addEventListener('input', updateRuleMetadata);
        row.querySelector('.parameter-value')?.addEventListener('change', updateRuleMetadata);
        els.parameterList.append(row);
    }
    updateRuleMetadata();
}

function collectFixedParameters() {
    const parameters = {};
    for (const row of els.parameterList.querySelectorAll('.fixed-parameter-row')) {
        const raw = row.querySelector('.parameter-value')?.value;
        parameters[row.dataset.parameterId] = parseScalar(raw);
    }
    return parameters;
}

function updateRuleMetadata() {
    const model = selectedModel();
    const parameters = collectFixedParameters();
    const rulePayload = { modelId: model.id, family: model.family, parameters };
    els.ruleMetadata.replaceChildren(
        metadataRow(t('localRule'), `${model.family} local rule`),
        metadataRow(t('neighborhood'), 'topology adjacency'),
        metadataRow(t('updateSchedule'), 'adapter-defined synchronous/turn update'),
        metadataRow(t('ruleHash'), labHash(rulePayload, 'rule'))
    );
}

function selectedObservableIds() {
    return [...els.observableList.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
}

function selectedDetectorIds() {
    return [...els.detectorList.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
}

function renderObservablesAndDetectors() {
    const model = selectedModel();
    const previousObservables = new Set(selectedObservableIds());
    const previousDetectors = new Set(selectedDetectorIds());
    els.observableList.replaceChildren();
    for (const observable of model.observables) {
        const card = document.createElement('article');
        card.className = 'observable-card';
        const checked = previousObservables.has(observable.id) || (!previousObservables.size && model.observables.indexOf(observable) < 2);
        card.innerHTML = `
            <label><input type="checkbox" value="${observable.id}" ${checked ? 'checked' : ''}> <span>${observable.name}</span></label>
            <small>${observable.category} / ${observable.estimatorType} / ${observable.validationLevel}</small>
            <small>${language === 'zh' ? observable.physicalMeaning : observable.definition}</small>
        `;
        card.querySelector('input').addEventListener('change', updateRunEstimate);
        els.observableList.append(card);
    }
    els.detectorList.replaceChildren();
    for (const detector of detectorsForModel(model)) {
        const checked = previousDetectors.has(detector.id) || !previousDetectors.size;
        const card = document.createElement('article');
        card.className = 'observable-card';
        card.innerHTML = `
            <label><input type="checkbox" value="${detector.id}" ${checked ? 'checked' : ''}> <span>${text(detector.label, language)}</span></label>
            <small>${detector.eventType} / ${detector.exactness}</small>
            <small>${detector.limitations.join(' ')}</small>
        `;
        els.detectorList.append(card);
    }
}

function resolvedSeeds() {
    const mode = els.seedModeSelect.value;
    if (mode === 'list') {
        const values = parseList(els.seedValueInput.value);
        return values.length ? values : ['topology-seed-1'];
    }
    if (mode === 'range') {
        const start = Number(els.seedValueInput.value) || 1;
        const end = Number(els.seedEndInput.value) || start;
        const seeds = [];
        for (let seed = start; seed <= end; seed += 1) seeds.push(seed);
        return seeds.length ? seeds : [start];
    }
    return [els.seedValueInput.value || 'topology-seed-1'];
}

function updateResolvedSeeds() {
    const seeds = resolvedSeeds();
    els.resolvedSeedsText.textContent = `${t('resolvedSeeds')}: ${seeds.join(', ')}`;
    return seeds;
}

function comparisonTopologyIdsWithReference() {
    const reference = selectedReferenceTopologyId();
    const comparisons = selectedComparisonTopologyIds().filter((id) => id !== reference);
    return [reference, ...comparisons].filter(Boolean);
}

function updateRunEstimate() {
    ensureDistinctReferenceAndComparisons();
    const topologies = comparisonTopologyIdsWithReference().length;
    const total = topologies * updateResolvedSeeds().length * Math.max(1, Number(els.repeatInput.value) || 1);
    els.totalRunsText.textContent = String(total);
}

function renderInvariantPreview() {
    const rows = comparisonTopologyIdsWithReference()
        .flatMap((id) => computeTopologyInvariants(topologyById(id)))
        .filter((entry) => ['orientability', 'boundary components', 'Euler characteristic', 'Betti numbers', 'cycle rank', 'vertices', 'edges'].includes(entry.name));
    renderInvariantRows(rows);
    const cycleEntries = comparisonTopologyIdsWithReference().map((id) => computeCycleData(topologyById(id)));
    renderCyclePanel(cycleEntries);
}

function renderAll() {
    renderModelMetadata();
    renderTopologies();
    renderInitialConditions();
    renderMappingMethods();
    renderParameters();
    renderObservablesAndDetectors();
    currentComparisonConfig = null;
    currentBatchConfig = null;
    currentComparisonResult = null;
    clearResultTables(false);
    renderInvariantPreview();
    updateRunEstimate();
    updateExportPreview();
}

function validateComparison() {
    const reference = selectedReferenceTopologyId();
    const comparisons = selectedComparisonTopologyIds().filter((id) => id !== reference);
    const errors = [];
    if (!reference || comparisons.length < 1) errors.push(t('needTopologies'));
    if (!selectedObservableIds().length) errors.push(t('needObservable'));
    return errors;
}

function seedPlanObject() {
    return {
        mode: 'list',
        seeds: resolvedSeeds(),
        resolvedSeeds: []
    };
}

function generateComparison() {
    const errors = validateComparison();
    if (errors.length) {
        setStatus(errors.join(' '), 'bad');
        return null;
    }
    const model = selectedModel();
    const createdAt = new Date().toISOString();
    const referenceTopologyId = selectedReferenceTopologyId();
    const comparisonTopologyIds = selectedComparisonTopologyIds().filter((id) => id !== referenceTopologyId);
    const allTopologyIds = [referenceTopologyId, ...comparisonTopologyIds];
    const fixedParameters = collectFixedParameters();
    const comparisonMode = resolvedSeeds().length > 1 ? 'multi_seed_statistical' : 'synchronized_single_seed';
    const comparisonIdPayload = {
        modelId: model.id,
        referenceTopologyId,
        comparisonTopologyIds,
        initialConditionId: els.initialConditionSelect.value,
        mappingMethod: els.mappingMethodSelect.value,
        fixedParameters,
        seedPlan: seedPlanObject(),
        steps: Math.max(1, Math.floor(Number(els.stepsInput.value) || 1)),
        selectedObservableIds: selectedObservableIds(),
        selectedEventDetectorIds: selectedDetectorIds(),
        createdAt
    };
    const comparisonConfig = {
        schemaName: 'LabTopologyComparisonConfig',
        schemaVersion: LAB_SCHEMA_VERSION,
        comparisonId: `topologyComparison.${labHash(comparisonIdPayload, 'id').replace(':', '.')}`,
        name: `${text(model.name, language)} same-rule topology comparison`,
        modelId: model.id,
        referenceTopologyId,
        comparisonTopologyIds,
        initialConditionId: els.initialConditionSelect.value,
        initialConditionMappingMethod: els.mappingMethodSelect.value,
        localRuleId: `${model.id}.local-rule`,
        fixedParameters,
        seedPlan: {
            ...seedPlanObject(),
            resolvedSeeds: resolvedSeeds()
        },
        steps: Math.max(1, Math.floor(Number(els.stepsInput.value) || 1)),
        selectedObservableIds: selectedObservableIds(),
        selectedEventDetectorIds: selectedDetectorIds(),
        comparisonMode,
        appVersion: LAB_APP_VERSION,
        createdAt,
        comparisonHash: '',
        metadata: {
            manualMapping: els.manualMappingInput.value || '',
            scientificLanguage: 'finite-size same-rule comparison; exploratory divergence score'
        }
    };
    comparisonConfig.comparisonHash = labHash({ ...comparisonConfig, comparisonHash: '', reproducibilityMetadata: undefined }, 'topology-comparison');
    comparisonConfig.reproducibilityMetadata = buildBasicReproducibilityMetadata({
        schemaName: 'LabTopologyComparisonConfig',
        modelId: model.id,
        modelVersion: `${model.id}@${LAB_APP_VERSION}`,
        rngSeed: comparisonConfig.seedPlan.resolvedSeeds?.[0] ?? null,
        seedPlan: comparisonConfig.seedPlan,
        configHash: comparisonConfig.comparisonHash,
        deterministicReplaySupported: true,
        createdAt
    });
    const parameterSweep = model.parameters.map((parameter) => ({
        parameterId: parameter.id,
        label: parameter.label,
        mode: 'fixed',
        fixedValue: fixedParameters[parameter.id]
    }));
    const matrixResult = buildRunMatrix({
        batchName: comparisonConfig.name,
        selectedModelIds: [model.id],
        selectedTopologyIds: allTopologyIds,
        selectedInitialConditionIds: [comparisonConfig.initialConditionId],
        parameterSweep,
        seedPlan: seedPlanObject(),
        stepPlan: { mode: 'fixed', fixedSteps: comparisonConfig.steps, resolvedStepCounts: [] },
        selectedObservableIds: comparisonConfig.selectedObservableIds,
        repeatCount: Math.max(1, Number(els.repeatInput.value) || 1),
        createdAt
    });
    if (!matrixResult.ok) {
        setStatus(matrixResult.errors.join(' '), 'bad');
        return null;
    }
    currentComparisonConfig = comparisonConfig;
    currentBatchConfig = matrixResult.config;
    currentComparisonResult = null;
    setStatus(`${t('generated')} ${currentBatchConfig.runMatrix.length} ${uiText('runCount', language).toLowerCase()}.`, 'ok');
    updateRunEstimate();
    updateExportPreview();
    return currentBatchConfig;
}

function setStatus(message, kind = '') {
    els.comparisonStatus.textContent = message;
    els.comparisonStatus.className = `status-pill ${kind}`.trim();
}

function setRunButtons(state) {
    const running = state === 'running';
    const paused = state === 'paused';
    els.startButton.disabled = running || paused;
    els.pauseButton.disabled = !running || !activeWorker;
    els.resumeButton.disabled = !paused || !activeWorker;
    els.cancelButton.disabled = !(running || paused);
}

function updateProgress(index, total, run) {
    els.runProgress.max = Math.max(1, total);
    els.runProgress.value = Math.min(total, index);
    els.currentRunText.textContent = run ? `${run.runId} / ${run.topologyId}` : '-';
}

function logRun(message, className = '') {
    const item = document.createElement('li');
    item.textContent = message;
    if (className) item.className = className;
    els.runLog.prepend(item);
}

function makeComparisonResult(runResults, failedRuns, warnings = []) {
    return buildTopologyComparisonResult({
        comparisonConfig: currentComparisonConfig,
        batchConfig: currentBatchConfig,
        runResults,
        failedRuns,
        topologyLookup: topologyById,
        warnings
    });
}

function runWithWorker() {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../experiments/LabBatchWorker.js', import.meta.url), { type: 'module' });
        activeWorker = worker;
        els.workerStatus.textContent = uiText('worker', language);
        worker.addEventListener('message', (event) => {
            const message = event.data || {};
            if (message.type === 'started') {
                logRun(`${t('startLog')} ${message.totalRuns}`);
                updateProgress(0, message.totalRuns);
            }
            if (message.type === 'progress') updateProgress(message.index, message.totalRuns, message.run);
            if (message.type === 'runComplete') {
                updateProgress(message.index + 1, currentBatchConfig.runMatrix.length);
                logRun(`${t('finishLog')} ${message.runId}`);
            }
            if (message.type === 'runFailed') logRun(`${t('failed')} ${message.runId}: ${message.failed.error}`, 'bad');
            if (message.type === 'paused') setRunButtons('paused');
            if (message.type === 'resumed') setRunButtons('running');
            if (message.type === 'cancelled') logRun(t('cancelled'));
            if (message.type === 'complete') {
                worker.terminate();
                activeWorker = null;
                resolve(makeComparisonResult(message.runResults, message.failedRuns, message.cancelled ? [t('cancelled')] : []));
            }
        });
        worker.addEventListener('error', (error) => {
            worker.terminate();
            activeWorker = null;
            reject(error);
        });
        worker.postMessage({ type: 'start', batchConfig: currentBatchConfig });
    });
}

async function runWithFallback() {
    els.workerStatus.textContent = t('fallback');
    const output = await runBatchSequentialLazy(currentBatchConfig, {
        onStart({ totalRuns, controller }) {
            fallbackController = controller;
            logRun(`${t('startLog')} ${totalRuns}`);
            updateProgress(0, totalRuns);
        },
        onProgress({ index, totalRuns, run }) {
            updateProgress(index, totalRuns, run);
        },
        onRunComplete({ index, run }) {
            updateProgress(index + 1, currentBatchConfig.runMatrix.length);
            logRun(`${t('finishLog')} ${run.runId}`);
        },
        onRunFailed({ run, error }) {
            logRun(`${t('failed')} ${run.runId}: ${error?.message || error}`, 'bad');
        }
    });
    fallbackController = null;
    return makeComparisonResult(output.results, output.failedRuns, output.cancelled ? [t('cancelled')] : []);
}

async function startComparison() {
    if (!currentBatchConfig || !currentComparisonConfig) {
        if (!generateComparison()) return;
    }
    currentComparisonResult = null;
    els.runLog.replaceChildren();
    setRunButtons('running');
    clearResultTables(false);
    try {
        currentComparisonResult = window.Worker ? await runWithWorker() : await runWithFallback();
        setStatus(t('complete'), 'ok');
    } catch (error) {
        logRun(`${t('workerFailed')} ${error?.message || error}`, 'bad');
        currentComparisonResult = await runWithFallback();
    } finally {
        setRunButtons('idle');
        renderResult();
        updateExportPreview();
    }
}

function pauseComparison() {
    activeWorker?.postMessage({ type: 'pause' });
    setRunButtons('paused');
}

function resumeComparison() {
    activeWorker?.postMessage({ type: 'resume' });
    setRunButtons('running');
}

function cancelComparison() {
    activeWorker?.postMessage({ type: 'cancel' });
    fallbackController?.cancel();
    setRunButtons('idle');
}

function clearResultTables(clearStatus = true) {
    els.sideBySidePanel.replaceChildren();
    els.observableChart.replaceChildren();
    els.differencePanel.replaceChildren();
    els.eventTableBody.replaceChildren();
    els.divergenceTableBody.replaceChildren();
    if (clearStatus) setStatus(t('statusReady'));
}

function formatValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(4).replace(/\.?0+$/, '');
    if (value === null || value === undefined) return '-';
    return typeof value === 'string' ? value : stableStringify(value);
}

function renderInvariantRows(rows) {
    els.invariantTableBody.replaceChildren();
    for (const entry of rows.slice(0, 180)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.topologyId}</td>
            <td>${entry.name}</td>
            <td>${formatValue(entry.value)}</td>
            <td>${entry.exactness}</td>
            <td>${entry.method}</td>
        `;
        els.invariantTableBody.append(row);
    }
}

function renderCyclePanel(cycleData) {
    els.cyclePanel.replaceChildren();
    for (const entry of cycleData) {
        const p = document.createElement('p');
        p.textContent = `${entry.topologyId}: cycles=${entry.noncontractibleCycles.length}, seams=${entry.seamEdges.length}, twisted=${entry.twistedSeamEdges.length}, exactness=${entry.exactness}`;
        els.cyclePanel.append(p);
    }
}

function renderSideBySide() {
    els.sideBySidePanel.replaceChildren();
    if (!currentComparisonResult) return;
    const observableId = currentComparisonConfig.selectedObservableIds[0];
    const latestByTopology = new Map();
    for (const result of currentComparisonResult.runResults) {
        latestByTopology.set(result.config.topologyId, result);
    }
    for (const topologyId of comparisonTopologyIdsWithReference()) {
        const result = latestByTopology.get(topologyId);
        const topology = topologyById(topologyId);
        const card = document.createElement('article');
        card.className = 'viz-card';
        card.innerHTML = `
            <h3>${text(topology.name, language)}</h3>
            <p>${topology.dimension}D / ${topology.topologyType} / ${topology.boundaryCondition}</p>
            <p>${observableId}: ${formatValue(result?.summary?.observableSummary?.[observableId])}</p>
            <p>${t('hash')}: ${topology.hash}</p>
            <div class="side-card-badge">
                <span class="exactness-pill">${topologyId === currentComparisonConfig.referenceTopologyId ? t('referenceTopology') : t('compareTopology')}</span>
                <span class="exactness-pill">${result?.summary?.status || 'not-run'}</span>
            </div>
        `;
        els.sideBySidePanel.append(card);
    }
}

function renderChart() {
    els.observableChart.replaceChildren();
    if (!currentComparisonResult) return;
    const observableId = currentComparisonConfig.selectedObservableIds[0];
    const displayedResults = currentComparisonResult.runResults.slice(0, 32);
    const values = displayedResults.map((result) => Number(result.summary.observableSummary?.[observableId]) || 0);
    const max = Math.max(1, ...values.map((value) => Math.abs(value)));
    const chart = document.createElement('figure');
    chart.className = 'paper-chart';
    const title = document.createElement('figcaption');
    title.className = 'paper-chart-title';
    title.textContent = `${t('chartTitle')}: ${observableId}`;
    const yAxis = document.createElement('div');
    yAxis.className = 'paper-chart-y-axis';
    yAxis.textContent = `${t('chartYAxis')} (${observableId})`;
    const plot = document.createElement('div');
    plot.className = 'paper-chart-plot';
    plot.dataset.yMax = formatValue(max);
    displayedResults.forEach((result, index) => {
        const value = values[index];
        const bar = document.createElement('span');
        const isReference = result.config.topologyId === currentComparisonConfig.referenceTopologyId;
        bar.className = `paper-chart-bar ${isReference ? 'is-reference' : 'is-comparison'}`;
        bar.style.height = `${Math.max(2, (Math.abs(value) / max) * 100)}%`;
        bar.title = `${result.config.topologyId}; ${observableId}=${formatValue(value)}; seed=${result.config.seed}`;
        const label = document.createElement('span');
        label.textContent = result.config.topologyId;
        bar.append(label);
        plot.append(bar);
    });
    const xAxis = document.createElement('div');
    xAxis.className = 'paper-chart-x-axis';
    xAxis.textContent = t('chartXAxis');
    const legend = document.createElement('div');
    legend.className = 'paper-chart-legend';
    legend.innerHTML = `
        <span><i class="is-reference"></i>${t('chartReference')}</span>
        <span><i class="is-comparison"></i>${t('chartComparison')}</span>
    `;
    chart.append(title, yAxis, plot, xAxis, legend);
    els.observableChart.append(chart);
}

function renderDifferencePanel() {
    els.differencePanel.replaceChildren();
    if (!currentComparisonResult) return;
    for (const score of currentComparisonResult.divergenceScores.slice(0, 12)) {
        const p = document.createElement('p');
        p.textContent = `${score.referenceTopologyId} -> ${score.comparisonTopologyId}: ${score.observableId} ${formatValue(score.value)} (${score.distanceMethod})`;
        els.differencePanel.append(p);
    }
}

function renderEventsAndDivergence() {
    els.eventTableBody.replaceChildren();
    els.divergenceTableBody.replaceChildren();
    if (!currentComparisonResult) return;
    for (const event of currentComparisonResult.topologySensitiveEvents.slice(0, 120)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${event.step}</td>
            <td>${event.topologyId}</td>
            <td>${event.eventType}</td>
            <td>${formatValue(event.confidence)}</td>
            <td>${event.exactness}</td>
        `;
        els.eventTableBody.append(row);
    }
    for (const score of currentComparisonResult.divergenceScores.slice(0, 120)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${score.referenceTopologyId}</td>
            <td>${score.comparisonTopologyId}</td>
            <td>${score.observableId}</td>
            <td>${score.distanceMethod}</td>
            <td>${formatValue(score.value)}</td>
            <td>${formatValue(score.confidence)}</td>
        `;
        els.divergenceTableBody.append(row);
    }
}

function renderResult() {
    if (!currentComparisonResult) {
        clearResultTables();
        return;
    }
    renderInvariantRows(currentComparisonResult.topologyInvariants);
    renderCyclePanel(currentComparisonResult.cycleData);
    renderSideBySide();
    renderChart();
    renderDifferencePanel();
    renderEventsAndDivergence();
}

function exportEnvelope() {
    if (!currentComparisonConfig) return null;
    return {
        comparisonConfig: currentComparisonConfig,
        batchConfig: currentBatchConfig,
        comparisonResult: currentComparisonResult,
        experimentConfigs: currentBatchConfig?.runMatrix?.map((run) => run.experimentConfig) || []
    };
}

function updateExportPreview() {
    const envelope = exportEnvelope();
    storeValidationCandidate('topology-comparison', envelope);
    els.exportPreview.value = envelope ? JSON.stringify(envelope, null, 2).slice(0, 22000) : t('noResult');
}

function exportJson() {
    const envelope = exportEnvelope();
    if (!envelope) return;
    downloadText('topoboard-labs-topology-comparison.json', JSON.stringify(envelope, null, 2), 'application/json');
}

function exportInvariantCsv() {
    if (!currentComparisonResult) return;
    downloadText('topology-invariants.csv', toCsv(invariantRows(currentComparisonResult), ['topologyId', 'name', 'value', 'category', 'exactness', 'method', 'topologyHash']), 'text/csv');
}

function exportEventCsv() {
    if (!currentComparisonResult) return;
    downloadText('topology-sensitive-events.csv', toCsv(eventRows(currentComparisonResult), ['eventId', 'eventType', 'step', 'topologyId', 'confidence', 'exactness', 'relatedObservableIds']), 'text/csv');
}

function exportDivergenceCsv() {
    if (!currentComparisonResult) return;
    downloadText('topology-divergence-scores.csv', toCsv(divergenceRows(currentComparisonResult), ['scoreId', 'referenceTopologyId', 'comparisonTopologyId', 'observableId', 'distanceMethod', 'normalizationMethod', 'seedAggregationMethod', 'value', 'confidence']), 'text/csv');
}

function exportManifest() {
    if (!currentComparisonResult) return;
    downloadText('topology-comparison-manifest.json', JSON.stringify(currentComparisonResult.exportManifest, null, 2), 'application/json');
}

function applyGuidedDefaults() {
    els.modelSelect.value = 'ising_domain_game';
    renderAll();
    const reference = els.topologyCards.querySelector('input[name="referenceTopology"][value="torus"]');
    if (reference) reference.checked = true;
    for (const input of els.topologyCards.querySelectorAll('input[data-compare-topology]')) {
        input.checked = ['mobius', 'cylinder'].includes(input.value);
    }
    els.initialConditionSelect.value = 'domain_wall_seed';
    els.mappingMethodSelect.value = 'seed_preserving_regeneration';
    els.seedModeSelect.value = 'single';
    els.seedValueInput.value = 'same-rule-space-seed';
    els.repeatInput.value = '1';
    els.stepsInput.value = '12';
    for (const input of els.observableList.querySelectorAll('input[type="checkbox"]')) input.checked = input.value.includes('domain-wall') || input.value.includes('magnetization');
    if (!selectedObservableIds().length) els.observableList.querySelector('input[type="checkbox"]')?.click();
    updateMappingWarning();
    updateRunEstimate();
    renderInvariantPreview();
    setStatus(t('safeDefaultsApplied'), 'ok');
}

function panelStorageKey(panel, index) {
    const titleId = panel.querySelector('.panel-heading h2')?.id || `topology-panel-${index}`;
    return `topoboard-labs:topology-panel:${titleId}`;
}

function updatePanelCollapseLabels() {
    for (const button of document.querySelectorAll('.panel-collapse-button')) {
        const panel = button.closest('.panel');
        const expanded = !panel?.classList.contains('is-collapsed');
        const label = uiText(expanded ? 'collapse' : 'expand', language);
        button.textContent = label;
        button.setAttribute('aria-expanded', String(expanded));
        button.setAttribute('title', label);
    }
}

function installPanelCollapsers() {
    document.querySelectorAll('.panel').forEach((panel, index) => {
        const heading = panel.querySelector('.panel-heading');
        if (!heading || heading.querySelector('.panel-collapse-button')) return;
        const key = panelStorageKey(panel, index);
        if (localStorage.getItem(key) === 'collapsed') panel.classList.add('is-collapsed');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'panel-collapse-button';
        button.addEventListener('click', () => {
            panel.classList.toggle('is-collapsed');
            localStorage.setItem(key, panel.classList.contains('is-collapsed') ? 'collapsed' : 'expanded');
            updatePanelCollapseLabels();
        });
        heading.append(button);
    });
    updatePanelCollapseLabels();
}

function bindEvents() {
    els.languageSelect.addEventListener('change', () => setLanguage(els.languageSelect.value));
    installLabLanguageMenu({ select: els.languageSelect, setLanguage });
    els.researchModeButton.addEventListener('click', () => setCompareMode('research'));
    els.guidedModeButton.addEventListener('click', () => setCompareMode('guided'));
    els.guidedDefaultsButton.addEventListener('click', applyGuidedDefaults);
    els.guidedRunButton.addEventListener('click', async () => {
        setCompareMode('guided');
        applyGuidedDefaults();
        generateComparison();
        await startComparison();
    });
    els.modelSelect.addEventListener('change', renderAll);
    els.mappingMethodSelect.addEventListener('change', updateMappingWarning);
    for (const input of [els.seedModeSelect, els.seedValueInput, els.seedEndInput, els.repeatInput, els.stepsInput]) {
        input.addEventListener('input', updateRunEstimate);
        input.addEventListener('change', updateRunEstimate);
    }
    els.generateButton.addEventListener('click', generateComparison);
    els.startButton.addEventListener('click', startComparison);
    els.pauseButton.addEventListener('click', pauseComparison);
    els.resumeButton.addEventListener('click', resumeComparison);
    els.cancelButton.addEventListener('click', cancelComparison);
    els.exportJsonButton.addEventListener('click', exportJson);
    els.exportInvariantCsvButton.addEventListener('click', exportInvariantCsv);
    els.exportEventCsvButton.addEventListener('click', exportEventCsv);
    els.exportDivergenceCsvButton.addEventListener('click', exportDivergenceCsv);
    els.exportManifestButton.addEventListener('click', exportManifest);
}

function initializeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const model = params.get('model');
    if (model && MODEL_REGISTRY.some((entry) => entry.id === model && modelSupportsComparison(entry))) els.modelSelect.value = model;
    if (params.get('mode') === 'guided') compareMode = 'guided';
}

renderModelSelect();
initializeFromUrl();
installPanelCollapsers();
bindEvents();
setLanguage(language);
setCompareMode(compareMode);
if (compareMode === 'guided') applyGuidedDefaults();
updateProgress(0, 0);
