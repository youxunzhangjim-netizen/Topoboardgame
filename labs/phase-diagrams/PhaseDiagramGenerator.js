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
    text,
    topologyById,
    uiText
} from '../experiments/LabExperimentRegistry.js';
import {
    buildRunMatrix,
    downloadText,
    parseList,
    toCsv
} from '../experiments/LabBatchCore.js';
import {
    axisToSweep,
    buildPhaseScanResult,
    classificationRows,
    phaseGridRows,
    phaseSupportForModel,
    parseAxisValues
} from './LabPhaseCore.js';
import { installLabLanguageMenu, syncLabLanguageMenu } from '../experiments/LabLanguageMenu.js';
import { researchDescription, researchWarning } from '../LabResearchDescriptions.js';

async function runBatchSequentialLazy(...args) {
    const { runBatchSequential } = await import('../experiments/LabBatchRunner.js');
    return runBatchSequential(...args);
}

const PHASE_I18N = {
    en: {
        experimentBuilder: 'Experiment Builder',
        validationSuite: 'Validation & Reproducibility',
        publicationExport: 'Publication & Dataset Export',
        pageTitle: 'Phase Diagram Generator',
        subtitle: 'Generate reproducible regime maps from batch experiments on reusable topologies.',
        modeResearch: 'Research Scan',
        modeGuided: 'Find the Boundary',
        guidedEyebrow: 'Guided',
        guidedTitle: 'Find the Boundary',
        guidedText: 'Choose one model, one topology, two parameters, and one observable. The scan marks transition-like mixed regions without claiming a continuum phase transition.',
        formalModel: 'Formal model',
        formalExpression: 'Expression',
        formalPhaseText: 'A finite scan estimates a regime label from observables over a parameter grid; it does not claim a continuum partition function unless explicitly implemented.',
        guidedDefaults: 'Use safe defaults',
        guidedRun: 'Run small scan',
        mapTerm: 'Map term',
        totalRuns: 'Total runs',
        modelSetup: 'Model',
        topologySet: 'Topology set',
        sweepAxes: 'Sweep axes',
        xAxis: 'X axis',
        yAxis: 'Y axis',
        axisInputType: 'Input type',
        numericRange: 'Numeric range',
        numericList: 'Numeric list',
        logRange: 'Log range',
        integerRange: 'Integer range',
        min: 'Min',
        max: 'Max',
        count: 'Count',
        listValues: 'List values',
        classification: 'Classification',
        classificationObservable: 'Classification observable',
        method: 'Method',
        threshold: 'Threshold',
        binning: 'Binning',
        variance: 'Variance',
        lowerThreshold: 'Lower threshold',
        upperThreshold: 'Upper threshold',
        auxObservables: 'Auxiliary observables',
        runSetup: 'Run setup',
        seedList: 'Seeds',
        simulationSteps: 'Simulation steps',
        generateScan: 'Generate scan',
        statusReady: 'Configure the scan before running.',
        visualizations: 'Visualizations',
        regimeMap: 'Regime map',
        phaseDiagram: 'Phase diagram',
        heatmap: 'Heatmap',
        uncertaintyMap: 'Uncertainty map',
        results: 'Results',
        xValue: 'x',
        yValue: 'y',
        regime: 'regime',
        meanValue: 'mean',
        confidence: 'confidence',
        failedRuns: 'failed',
        exportGridCsv: 'Export grid CSV',
        exportClassCsv: 'Export classifications CSV',
        exportNotes: 'Exports include scan config, batch config, topology hashes, resolved seeds, classifications, warnings, and reproducibility notes.',
        unavailable: 'Unavailable',
        supported: 'Supported',
        unsupportedReason: 'Needs at least two numeric sweep parameters and one observable.',
        compatibleTopology: 'Compatible for this model.',
        incompatibleTopology: 'This topology is not supported by the current model adapter.',
        siteCount: 'sites',
        boundary: 'boundary',
        lattice: 'lattice',
        hash: 'hash',
        axisPreview: 'Values',
        noValues: 'No valid axis values.',
        sameAxisWarning: 'Choose two different sweep parameters.',
        noTopologyWarning: 'Choose at least one compatible topology.',
        noObservableWarning: 'Choose a classification observable.',
        logRangeWarning: 'Log ranges require positive min and max.',
        generated: 'Scan generated.',
        scanComplete: 'Scan complete.',
        fallback: 'Main thread fallback',
        workerFailed: 'Worker failed; using fallback.',
        cancelled: 'cancelled',
        failed: 'failed',
        startLog: 'start',
        finishLog: 'finish',
        selectedCell: 'Selected cell',
        noResult: 'Generate and run a scan to view maps.',
        topologyComparison: 'Topology comparison',
        dominantRegimes: 'Dominant regimes',
        regimeMapOnly: 'Estimator/toy model: shown as a regime map, not a validated physical phase diagram.',
        phaseDiagramAllowed: 'Benchmarked/research-grade model: phase diagram wording is allowed.',
        safeDefaultsApplied: 'Safe defaults applied.',
        initialCondition: 'Initial condition',
        repeats: 'Repeats per cell',
        figureRegimeTitle: 'Finite-size regime classification',
        figureHeatmapTitle: 'Observable response surface',
        figureUncertaintyTitle: 'Classification uncertainty',
        observableValue: 'Observable mean',
        uncertaintyValue: 'Uncertainty (1 - confidence)',
        colorScale: 'Color scale',
        low: 'Low',
        high: 'High',
        topologyLabel: 'Topology',
        finiteGridNote: 'Finite parameter grid; cells summarize repeated seeded runs.',
        figureMethodEyebrow: 'Figure method',
        figureMethodTitle: 'How this scan becomes a figure',
        systemEquation: 'System equation',
        scanParameterMapping: 'Scan-parameter mapping',
        partitionStatus: 'Partition-function status',
        cellSampling: 'Sampling in each cell',
        observableEstimator: 'Observable estimator',
        classificationDerivation: 'Classification derivation',
        figureEncoding: 'Figure encoding',
        scientificLimit: 'Scientific limit'
    },
    zh: {
        experimentBuilder: '實驗建構器',
        validationSuite: '驗證與可重現性',
        publicationExport: '出版與資料集匯出',
        pageTitle: '相圖產生器',
        subtitle: '從可重現批次實驗產生 regime map，並保留可重用拓撲資料。',
        modeResearch: '研究掃描',
        modeGuided: '尋找邊界',
        guidedEyebrow: '引導',
        guidedTitle: '尋找邊界',
        guidedText: '選一個模型、一個拓撲、兩個參數與一個觀測量。掃描會標示類轉換的混合區域，但不宣稱連續相變證明。',
        formalModel: '\u5f62\u5f0f\u6a21\u578b',
        formalExpression: '\u8868\u793a\u5f0f',
        formalPhaseText: '\u6709\u9650\u6383\u63cf\u5f9e\u53c3\u6578\u7db2\u683c\u4e0a\u7684\u89c0\u6e2c\u91cf\u4f30\u8a08\u5340\u57df\u6a19\u7c64\uff1b\u9664\u975e\u660e\u78ba\u5be6\u4f5c\uff0c\u4e0d\u5ba3\u7a31\u8a08\u7b97\u9023\u7e8c\u914d\u5206\u51fd\u6578\u3002',
        guidedDefaults: '使用安全預設',
        guidedRun: '執行小掃描',
        mapTerm: '地圖名稱',
        totalRuns: '總執行數',
        modelSetup: '模型',
        topologySet: '拓撲集合',
        sweepAxes: '掃描軸',
        xAxis: 'X 軸',
        yAxis: 'Y 軸',
        axisInputType: '輸入類型',
        numericRange: '數值範圍',
        numericList: '數值列表',
        logRange: '對數範圍',
        integerRange: '整數範圍',
        min: '最小值',
        max: '最大值',
        count: '數量',
        listValues: '列表數值',
        classification: '分類',
        classificationObservable: '分類觀測量',
        method: '方法',
        threshold: '閾值',
        binning: '分箱',
        variance: '變異數',
        lowerThreshold: '下閾值',
        upperThreshold: '上閾值',
        auxObservables: '輔助觀測量',
        runSetup: '執行設定',
        seedList: '種子',
        simulationSteps: '模擬步數',
        generateScan: '產生掃描',
        statusReady: '請先設定掃描再執行。',
        visualizations: '視覺化',
        regimeMap: 'Regime map',
        phaseDiagram: '相圖',
        heatmap: 'Heatmap',
        uncertaintyMap: '不確定性圖',
        results: '結果',
        xValue: 'x',
        yValue: 'y',
        regime: 'regime',
        meanValue: '平均',
        confidence: '信心',
        failedRuns: '失敗',
        exportGridCsv: '匯出 grid CSV',
        exportClassCsv: '匯出分類 CSV',
        exportNotes: '匯出包含掃描設定、批次設定、拓撲 hashes、已解析種子、分類、警告與可重現說明。',
        unavailable: '不可用',
        supported: '可用',
        unsupportedReason: '需要至少兩個數值掃描參數與一個觀測量。',
        compatibleTopology: '此模型可用此拓撲。',
        incompatibleTopology: '目前模型 adapter 不支援此拓撲。',
        siteCount: 'sites',
        boundary: '邊界',
        lattice: '晶格',
        hash: 'hash',
        axisPreview: '數值',
        noValues: '沒有有效的軸數值。',
        sameAxisWarning: '請選兩個不同的掃描參數。',
        noTopologyWarning: '請至少選一個相容拓撲。',
        noObservableWarning: '請選分類觀測量。',
        logRangeWarning: '對數範圍需要正的最小值與最大值。',
        generated: '已產生掃描。',
        scanComplete: '掃描完成。',
        fallback: '主執行緒備援',
        workerFailed: 'Worker 失敗，改用備援。',
        cancelled: '已取消',
        failed: '失敗',
        startLog: '開始',
        finishLog: '完成',
        selectedCell: '選取格',
        noResult: '請產生並執行掃描以查看地圖。',
        topologyComparison: '拓撲比較',
        dominantRegimes: '主要 regimes',
        regimeMapOnly: 'Estimator/toy 模型：顯示為 regime map，不視為已驗證物理相圖。',
        phaseDiagramAllowed: 'Benchmarked/research-grade 模型：可以使用相圖用語。',
        safeDefaultsApplied: '已套用安全預設。',
        initialCondition: '初始條件',
        repeats: '每格重複次數',
        figureRegimeTitle: '有限尺寸 regime 分類',
        figureHeatmapTitle: '觀測量反應曲面',
        figureUncertaintyTitle: '分類不確定性',
        observableValue: '觀測量平均值',
        uncertaintyValue: '不確定性（1 - 信心值）',
        colorScale: '色階',
        low: '低',
        high: '高',
        topologyLabel: '拓撲',
        finiteGridNote: '有限參數網格；每格彙整重複的定種子執行。',
        figureMethodEyebrow: '圖表方法',
        figureMethodTitle: '此掃描如何轉換成圖表',
        systemEquation: '系統方程',
        scanParameterMapping: '掃描參數映射',
        partitionStatus: '配分函數狀態',
        cellSampling: '每格取樣方式',
        observableEstimator: '觀測量估計器',
        classificationDerivation: '分類推導',
        figureEncoding: '圖表編碼',
        scientificLimit: '科學限制'
    }
};

const els = {
    languageSelect: document.querySelector('#languageSelect'),
    researchModeButton: document.querySelector('#researchModeButton'),
    guidedModeButton: document.querySelector('#guidedModeButton'),
    guidedDefaultsButton: document.querySelector('#guidedDefaultsButton'),
    guidedRunButton: document.querySelector('#guidedRunButton'),
    mapTermValue: document.querySelector('#mapTermValue'),
    totalRunsText: document.querySelector('#totalRunsText'),
    workerStatus: document.querySelector('#workerStatus'),
    currentRunText: document.querySelector('#currentRunText'),
    modelSelect: document.querySelector('#modelSelect'),
    modelMetadata: document.querySelector('#modelMetadata'),
    modelStatus: document.querySelector('#modelStatus'),
    topologyCards: document.querySelector('#topologyCards'),
    xParameterSelect: document.querySelector('#xParameterSelect'),
    yParameterSelect: document.querySelector('#yParameterSelect'),
    xInputType: document.querySelector('#xInputType'),
    yInputType: document.querySelector('#yInputType'),
    xMinInput: document.querySelector('#xMinInput'),
    yMinInput: document.querySelector('#yMinInput'),
    xMaxInput: document.querySelector('#xMaxInput'),
    yMaxInput: document.querySelector('#yMaxInput'),
    xCountInput: document.querySelector('#xCountInput'),
    yCountInput: document.querySelector('#yCountInput'),
    xListInput: document.querySelector('#xListInput'),
    yListInput: document.querySelector('#yListInput'),
    xAxisPreview: document.querySelector('#xAxisPreview'),
    yAxisPreview: document.querySelector('#yAxisPreview'),
    classificationObservableSelect: document.querySelector('#classificationObservableSelect'),
    classificationMethodSelect: document.querySelector('#classificationMethodSelect'),
    lowerThresholdInput: document.querySelector('#lowerThresholdInput'),
    upperThresholdInput: document.querySelector('#upperThresholdInput'),
    auxObservableList: document.querySelector('#auxObservableList'),
    seedListInput: document.querySelector('#seedListInput'),
    repeatsInput: document.querySelector('#repeatsInput'),
    stepsInput: document.querySelector('#stepsInput'),
    initialConditionSelect: document.querySelector('#initialConditionSelect'),
    generateScanButton: document.querySelector('#generateScanButton'),
    startScanButton: document.querySelector('#startScanButton'),
    pauseScanButton: document.querySelector('#pauseScanButton'),
    resumeScanButton: document.querySelector('#resumeScanButton'),
    cancelScanButton: document.querySelector('#cancelScanButton'),
    scanStatus: document.querySelector('#scanStatus'),
    scanProgress: document.querySelector('#scanProgress'),
    runLog: document.querySelector('#runLog'),
    regimeMapTitle: document.querySelector('#regimeMapTitle'),
    regimeCanvas: document.querySelector('#regimeCanvas'),
    heatmapCanvas: document.querySelector('#heatmapCanvas'),
    uncertaintyCanvas: document.querySelector('#uncertaintyCanvas'),
    phaseMethodValidation: document.querySelector('#phaseMethodValidation'),
    phaseMethodEquation: document.querySelector('#phaseMethodEquation'),
    phaseMethodParameters: document.querySelector('#phaseMethodParameters'),
    phaseMethodPartition: document.querySelector('#phaseMethodPartition'),
    phaseMethodSampling: document.querySelector('#phaseMethodSampling'),
    phaseMethodObservable: document.querySelector('#phaseMethodObservable'),
    phaseMethodClassification: document.querySelector('#phaseMethodClassification'),
    phaseMethodEncoding: document.querySelector('#phaseMethodEncoding'),
    phaseMethodLimit: document.querySelector('#phaseMethodLimit'),
    selectedCellPanel: document.querySelector('#selectedCellPanel'),
    topologyComparisonPanel: document.querySelector('#topologyComparisonPanel'),
    phaseTableBody: document.querySelector('#phaseTableBody'),
    exportJsonButton: document.querySelector('#exportJsonButton'),
    exportGridCsvButton: document.querySelector('#exportGridCsvButton'),
    exportClassCsvButton: document.querySelector('#exportClassCsvButton'),
    exportManifestButton: document.querySelector('#exportManifestButton'),
    exportPreview: document.querySelector('#exportPreview')
};

let language = getLanguage();
let phaseMode = localStorage.getItem('topoboard-labs:phase-mode') || 'research';
let currentBatchConfig = null;
let currentPhaseConfig = null;
let currentPhaseResult = null;
let activeWorker = null;
let fallbackController = null;
let selectedCellHash = null;

function storeValidationCandidate(type, envelope) {
    if (!envelope) return;
    try {
        const payload = {
            type,
            storedAt: new Date().toISOString(),
            sourceRoute: '/labs/phase-diagrams/',
            envelope
        };
        localStorage.setItem('topoboard-labs:last-validation-object', JSON.stringify(payload));
        localStorage.setItem(`topoboard-labs:last-${type}`, JSON.stringify(payload));
    } catch {
        // Validation can still load pasted/uploaded JSON when browser storage is unavailable.
    }
}

function t(key) {
    return PHASE_I18N[language]?.[key] || PHASE_I18N.en[key] || uiText(key, language);
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

function setPhaseMode(mode) {
    phaseMode = mode === 'guided' ? 'guided' : 'research';
    localStorage.setItem('topoboard-labs:phase-mode', phaseMode);
    document.body.dataset.phaseMode = phaseMode;
    els.researchModeButton.setAttribute('aria-pressed', String(phaseMode === 'research'));
    els.guidedModeButton.setAttribute('aria-pressed', String(phaseMode === 'guided'));
    if (phaseMode === 'guided') {
        els.xCountInput.value = Math.min(Number(els.xCountInput.value) || 5, 7);
        els.yCountInput.value = Math.min(Number(els.yCountInput.value) || 5, 7);
        els.repeatsInput.value = Math.min(Number(els.repeatsInput.value) || 1, 2);
    }
    updateAxisPreviews();
    updateRunEstimate();
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
            const support = phaseSupportForModel(model);
            const option = new Option(`${text(model.name, language)}${support.ok ? '' : ` (${t('unavailable')})`}`, model.id);
            option.disabled = !support.ok;
            option.title = support.ok ? t('supported') : t('unsupportedReason');
            group.append(option);
        }
        if (group.children.length) els.modelSelect.append(group);
    }
    const options = [...els.modelSelect.options];
    const previousOption = options.find((option) => option.value === previous && !option.disabled);
    els.modelSelect.value = previousOption?.value || options.find((option) => !option.disabled)?.value || 'ising_domain_game';
}

function mapTermForModel(model = selectedModel()) {
    return ['benchmarked', 'research_grade'].includes(model.validationLevel) ? t('phaseDiagram') : t('regimeMap');
}

function renderModelMetadata() {
    const model = selectedModel();
    const support = phaseSupportForModel(model);
    const research = researchDescription(model.id, language);
    els.modelMetadata.replaceChildren(
        metadataRow(research.labels.objective, research.objective),
        metadataRow(research.labels.model, research.model),
        metadataRow(research.labels.dynamics, research.dynamics),
        metadataRow(research.labels.ensemble, research.ensemble),
        metadataRow(research.labels.scope, research.scope)
    );
    els.mapTermValue.textContent = mapTermForModel(model);
    els.regimeMapTitle.textContent = mapTermForModel(model);
    els.modelStatus.replaceChildren();
    const message = document.createElement('span');
    message.className = support.ok ? 'warning ok' : 'warning bad';
    message.textContent = support.ok
        ? (['benchmarked', 'research_grade'].includes(model.validationLevel) ? t('phaseDiagramAllowed') : t('regimeMapOnly'))
        : `${t('unsupportedReason')} ${support.reasons.join(' ')}`;
    els.modelStatus.append(message);
    for (const warning of model.warnings || []) {
        const item = document.createElement('span');
        item.className = 'warning';
        item.textContent = researchWarning(warning, language);
        els.modelStatus.append(item);
    }
}

function selectedTopologyIds() {
    return [...els.topologyCards.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
}

function siteCount(topology) {
    return (topology.width || 1) * (topology.height || 1) * (topology.depth || 1) * (topology.w || 1);
}

function renderTopologies() {
    const model = selectedModel();
    const previous = new Set(selectedTopologyIds());
    if (!previous.size) previous.add(model.compatibleTopologies.includes('torus') ? 'torus' : model.compatibleTopologies[0]);
    els.topologyCards.replaceChildren();
    for (const topology of TOPOLOGY_REGISTRY) {
        const compatible = isTopologyCompatible(model, topology.id);
        const checked = compatible && previous.has(topology.id);
        const card = document.createElement('article');
        card.className = `topology-card${compatible ? '' : ' is-disabled'}`;
        card.innerHTML = `
            <label>
                <input type="checkbox" value="${topology.id}" ${checked ? 'checked' : ''} ${compatible ? '' : 'disabled'}>
                <span>${text(topology.name, language)}</span>
            </label>
            <small>${topology.dimension}D / ${t('lattice')}: ${topology.latticeTypes.join(', ')} / ${t('boundary')}: ${topology.boundaryCondition}</small>
            <small>${siteCount(topology)} ${t('siteCount')} / ${topology.topologyType}</small>
            <small>${compatible ? t('compatibleTopology') : t('incompatibleTopology')}</small>
            <code>${t('hash')}: ${topology.hash}</code>
        `;
        card.querySelector('input')?.addEventListener('change', updateRunEstimate);
        els.topologyCards.append(card);
    }
}

function axisElements(axis) {
    return axis === 'x'
        ? {
            select: els.xParameterSelect,
            inputType: els.xInputType,
            min: els.xMinInput,
            max: els.xMaxInput,
            count: els.xCountInput,
            list: els.xListInput,
            preview: els.xAxisPreview
        }
        : {
            select: els.yParameterSelect,
            inputType: els.yInputType,
            min: els.yMinInput,
            max: els.yMaxInput,
            count: els.yCountInput,
            list: els.yListInput,
            preview: els.yAxisPreview
        };
}

function populateAxisSelect(axis, defaultIndex) {
    const model = selectedModel();
    const support = phaseSupportForModel(model);
    const elements = axisElements(axis);
    const previous = elements.select.value;
    elements.select.replaceChildren();
    for (const parameter of support.sweepableParameters) {
        elements.select.append(new Option(parameter.label, parameter.id));
    }
    const fallback = support.sweepableParameters[Math.min(defaultIndex, support.sweepableParameters.length - 1)];
    elements.select.value = support.sweepableParameters.some((parameter) => parameter.id === previous)
        ? previous
        : fallback?.id || '';
}

function parameterById(parameterId) {
    return selectedModel().parameters.find((parameter) => parameter.id === parameterId);
}

function applyAxisDefaults(axis) {
    const elements = axisElements(axis);
    const parameter = parameterById(elements.select.value);
    if (!parameter) return;
    const min = parameter.min ?? 0;
    const max = parameter.max ?? Math.max(1, Number(parameter.defaultValue) || 1);
    elements.min.value = min;
    elements.max.value = max;
    elements.count.value = parameter.step && Number(parameter.step) >= 1 ? 5 : elements.count.value || 5;
    elements.list.value = `${min}, ${parameter.defaultValue}, ${max}`;
    elements.inputType.value = parameter.step && Number(parameter.step) >= 1 && Number.isInteger(Number(parameter.defaultValue))
        ? 'integer_range'
        : 'numeric_range';
    updateAxisPreview(axis);
}

function collectAxis(axis) {
    const elements = axisElements(axis);
    const parameter = parameterById(elements.select.value);
    const inputType = elements.inputType.value;
    const values = parseAxisValues({
        inputType,
        min: elements.min.value,
        max: elements.max.value,
        count: elements.count.value,
        listValue: elements.list.value,
        integer: inputType === 'integer_range'
    });
    return {
        id: axis,
        label: parameter?.label || axis,
        parameterId: parameter?.id || '',
        inputType,
        values,
        units: parameter?.units || '',
        integer: inputType === 'integer_range',
        warnings: values.length ? [] : [inputType === 'log_range' ? t('logRangeWarning') : t('noValues')]
    };
}

function updateAxisPreview(axis) {
    const axisConfig = collectAxis(axis);
    const preview = axisElements(axis).preview;
    preview.textContent = axisConfig.values.length
        ? `${t('axisPreview')}: ${axisConfig.values.join(', ')}`
        : axisConfig.warnings.join(' ');
    updateRunEstimate();
}

function updateAxisPreviews() {
    updateAxisPreview('x');
    updateAxisPreview('y');
}

function renderAxes() {
    populateAxisSelect('x', 0);
    populateAxisSelect('y', 1);
    applyAxisDefaults('x');
    applyAxisDefaults('y');
}

function renderInitialConditions() {
    const previous = els.initialConditionSelect.value;
    const options = initialConditionOptions(selectedModel(), language);
    els.initialConditionSelect.replaceChildren(...options.map((option) => new Option(option.label, option.id)));
    els.initialConditionSelect.value = options.some((option) => option.id === previous) ? previous : options[0]?.id || '';
}

function selectedAuxObservableIds() {
    return [...els.auxObservableList.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
}

function renderObservables() {
    const model = selectedModel();
    const previousPrimary = els.classificationObservableSelect.value;
    const previousAux = new Set(selectedAuxObservableIds());
    els.classificationObservableSelect.replaceChildren();
    for (const observable of model.observables) {
        els.classificationObservableSelect.append(new Option(observable.name, observable.id));
    }
    els.classificationObservableSelect.value = model.observables.some((observable) => observable.id === previousPrimary)
        ? previousPrimary
        : model.observables[0]?.id || '';
    els.auxObservableList.replaceChildren();
    for (const observable of model.observables) {
        const primary = observable.id === els.classificationObservableSelect.value;
        const card = document.createElement('article');
        card.className = `observable-card${primary ? ' is-disabled' : ''}`;
        card.innerHTML = `
            <label>
                <input type="checkbox" value="${observable.id}" ${previousAux.has(observable.id) ? 'checked' : ''} ${primary ? 'disabled' : ''}>
                <span>${observable.name}</span>
            </label>
            <small>${observable.category} / ${observable.estimatorType} / ${observable.validationLevel}</small>
            <small>${language === 'zh' ? observable.physicalMeaning : observable.definition}</small>
        `;
        els.auxObservableList.append(card);
    }
}

function phaseParameterLabel(label) {
    if (language !== 'zh') return label;
    return {
        'Temperature T': '溫度 T',
        'Coupling J': '耦合 J',
        'Field h': '外場 h',
        'Wall Thickness': 'Domain wall 厚度',
        'Interface Cost': '界面成本',
        'Bias A': 'Bias A',
        'Bias B': 'Bias B',
        'Noise Rate': '噪聲率',
        'Diffusion Noise Rate': 'Diffusion 噪聲率',
        'Violation Energy': '違反能量',
        'String Length': 'String 長度',
        'Path Length': '路徑長度',
        'Edge Error p': '圖邊誤差 p',
        'Measurement Error p': '測量誤差 p',
        'Error Density': '誤差密度'
    }[label] || label;
}

function phasePartitionStatement(modelId, fallback) {
    const isZh = language === 'zh';
    const statements = {
        ising_domain_game: isZh
            ? '形式配分函數為 Z(T,J,h) = sum_{所有 s_i=+/-1} exp[-H(s)/T]，其中 H(s) 如上且 k_B=1。本掃描只評估有限組態 H 與局部更新；不枚舉 Z、不估計自由能 F=-T log Z。'
            : 'The formal partition function is Z(T,J,h) = sum over all s_i=+/-1 of exp[-H(s)/T], with H(s) above and k_B=1. This scan evaluates finite-configuration H and local updates only; it does not enumerate Z or estimate F=-T log Z.',
        two_phase_competition_game: isZh
            ? '若另行定義平衡溫度，可寫形式 Z = sum_{所有 phi_i in {A,B,empty}} exp[-E(phi)/T]。目前演算法沒有此 Gibbs 取樣與 T，因此不計算 Z；掃描的是事件驅動軌跡。'
            : 'If an equilibrium temperature were separately defined, a formal Z = sum over phi_i in {A,B,empty} of exp[-E(phi)/T] could be written. The current algorithm has no such Gibbs sampler or T, so Z is not computed; the scan uses event-driven trajectories.',
        spin_ice_vertex_game: isZh
            ? '簡化缺陷能量可形式寫成 Z(T,Delta) = sum_{所有 arrow 組態} exp[-E(arrows)/T]。目前不執行此總和或 transfer-matrix 計算。'
            : 'For the simplified defect energy, one may formally write Z(T,Delta) = sum over all arrow configurations of exp[-E(arrows)/T]. The current code performs neither this sum nor a transfer-matrix calculation.',
        z2_gauge_loop_game: isZh
            ? '對目前單位權重懲罰可形式寫成 Z(T) = sum_{所有 U_e=+/-1} exp[-E(U)/T]。本工具不計算此 gauge ensemble、路徑積分或自由能。'
            : 'For the current unit-weight penalty one may formally write Z(T) = sum over all U_e=+/-1 of exp[-E(U)/T]. This tool does not compute that gauge ensemble, path integral, or free energy.'
    };
    return statements[modelId] || fallback;
}

function renderPlotMethodology() {
    const model = selectedModel();
    if (!model) return;
    const isZh = language === 'zh';
    const research = researchDescription(model.id, language);
    const xAxis = collectAxis('x');
    const yAxis = collectAxis('y');
    const scanned = new Set([xAxis.parameterId, yAxis.parameterId]);
    const fixedParameters = model.parameters
        .filter((parameter) => !scanned.has(parameter.id))
        .map((parameter) => `${phaseParameterLabel(parameter.label)}=${parameter.defaultValue}`)
        .join(', ') || (isZh ? '無其他已註冊數值參數' : 'no other registered numeric parameters');
    const observable = model.observables.find((entry) => entry.id === els.classificationObservableSelect.value)
        || model.observables[0];
    const seeds = Math.max(1, seedValues().length);
    const repeats = Math.max(1, Math.min(50, Number(els.repeatsInput.value) || 1));
    const steps = Math.max(1, Math.floor(Number(els.stepsInput.value) || 1));
    const samples = seeds * repeats;
    const lower = Number(els.lowerThresholdInput.value);
    const upper = Number(els.upperThresholdInput.value);
    const method = els.classificationMethodSelect.value;
    const parameterText = isZh
        ? `每個網格點設定 ${phaseParameterLabel(xAxis.label)} (${xAxis.parameterId}) 為 X 軸值、${phaseParameterLabel(yAxis.label)} (${yAxis.parameterId}) 為 Y 軸值。其餘參數使用登錄預設：${fixedParameters}。`
        : `At each grid cell, ${xAxis.label} (${xAxis.parameterId}) takes the X-axis value and ${yAxis.label} (${yAxis.parameterId}) takes the Y-axis value. Other registered parameters use defaults: ${fixedParameters}.`;
    const samplingText = isZh
        ? `每格執行 ${seeds} 個明確種子 x ${repeats} 次重複 = ${samples} 個有限樣本；每次執行 ${steps} 個離散步驟。圖格彙整每次執行的最終 observableSummary，不混合不同參數格。`
        : `Each cell runs ${seeds} explicit seed(s) x ${repeats} repeat(s) = ${samples} finite sample(s), each for ${steps} discrete step(s). The cell aggregates each run's final observableSummary without mixing parameter cells.`;
    let classificationText = '';
    if (method === 'variance') {
        classificationText = isZh
            ? `計算樣本平均值 mu 與母體變異數 sigma^2 = mean[(x-mu)^2]。若 sigma^2 > ${upper}，標記 fluctuating，否則標記 stable；信心值為 1/(1+sigma^2)。`
            : `Compute sample mean mu and population variance sigma^2 = mean[(x-mu)^2]. If sigma^2 > ${upper}, label fluctuating; otherwise stable. Confidence is 1/(1+sigma^2).`;
    } else if (method === 'binning') {
        classificationText = isZh
            ? `先計算每格平均值 mu。mu <= ${lower} 使用低值標籤，mu >= ${upper} 使用高值標籤，介於兩者標記 mixed；信心值是 mu 到閾值中點的正規化距離。`
            : `Compute the cell mean mu. Values mu <= ${lower} receive the low label, mu >= ${upper} receive the high label, and intermediate values are mixed; confidence is normalized distance from the threshold midpoint.`;
    } else {
        classificationText = isZh
            ? `Threshold 法以平均值 mu 對 ${lower} / ${upper} 分類低值、mixed、高值。信心值 max(0.05, 1-sqrt(sigma^2)/(|mu|+1))；失敗執行再乘成功樣本比例。`
            : `Threshold classification compares mean mu with ${lower} / ${upper} for low, mixed, and high labels. Confidence is max(0.05, 1-sqrt(sigma^2)/(|mu|+1)); failed runs multiply it by the successful-sample fraction.`;
    }
    if (els.phaseMethodValidation) els.phaseMethodValidation.textContent = model.validationLevel;
    if (els.phaseMethodEquation) els.phaseMethodEquation.textContent = research.model;
    if (els.phaseMethodParameters) els.phaseMethodParameters.textContent = parameterText;
    if (els.phaseMethodPartition) els.phaseMethodPartition.textContent = phasePartitionStatement(model.id, research.ensemble);
    if (els.phaseMethodSampling) els.phaseMethodSampling.textContent = samplingText;
    if (els.phaseMethodObservable) {
        els.phaseMethodObservable.textContent = observable
            ? `${observable.name} [${observable.units || 'dimensionless'}]: ${observable.definition} ${observable.physicalMeaning}`
            : (isZh ? '尚未選擇觀測量。' : 'No observable selected.');
    }
    if (els.phaseMethodClassification) els.phaseMethodClassification.textContent = classificationText;
    if (els.phaseMethodEncoding) {
        els.phaseMethodEncoding.textContent = isZh
            ? 'Regime map 顯示分類標籤；Heatmap 以連續色階顯示每格平均值；Uncertainty map 顯示 1-confidence。三圖使用完全相同的 X/Y 網格與樣本。'
            : 'The regime map encodes categorical labels; the heatmap encodes each cell mean on a continuous color scale; the uncertainty map encodes 1-confidence. All three use the identical X/Y grid and samples.';
    }
    if (els.phaseMethodLimit) {
        els.phaseMethodLimit.textContent = isZh
            ? '這是有限尺寸、有限步數、有限種子的 regime estimator。除非另有明確實作，程式不計算 Z、自由能導數、熱力學極限、臨界指數或有限尺寸 scaling collapse。'
            : 'This is a finite-size, finite-step, finite-seed regime estimator. Unless explicitly implemented, it does not calculate Z, free-energy derivatives, the thermodynamic limit, critical exponents, or a finite-size scaling collapse.';
    }
}

function renderAll() {
    renderModelMetadata();
    renderTopologies();
    renderAxes();
    renderInitialConditions();
    renderObservables();
    currentBatchConfig = null;
    currentPhaseConfig = null;
    currentPhaseResult = null;
    selectedCellHash = null;
    clearResults();
    updateRunEstimate();
}

function seedValues() {
    const parsed = parseList(els.seedListInput.value);
    return parsed.length ? parsed : ['phase-seed-1'];
}

function updateRunEstimate() {
    const xAxis = collectAxis('x');
    const yAxis = collectAxis('y');
    const topologies = Math.max(0, selectedTopologyIds().length);
    const seeds = Math.max(1, seedValues().length);
    const repeats = Math.max(1, Number(els.repeatsInput.value) || 1);
    const total = xAxis.values.length * yAxis.values.length * topologies * seeds * repeats;
    els.totalRunsText.textContent = String(total);
    renderPlotMethodology();
}

function setStatus(message, kind = '') {
    els.scanStatus.textContent = message;
    els.scanStatus.className = `status-pill ${kind}`.trim();
}

function validateScanInputs(xAxis, yAxis, topologyIds, observableId) {
    const errors = [];
    if (!xAxis.values.length) errors.push(xAxis.warnings.join(' ') || t('noValues'));
    if (!yAxis.values.length) errors.push(yAxis.warnings.join(' ') || t('noValues'));
    if (xAxis.parameterId === yAxis.parameterId) errors.push(t('sameAxisWarning'));
    if (!topologyIds.length) errors.push(t('noTopologyWarning'));
    if (!observableId) errors.push(t('noObservableWarning'));
    return errors;
}

function generateScan() {
    const model = selectedModel();
    const support = phaseSupportForModel(model);
    if (!support.ok) {
        setStatus(t('unsupportedReason'), 'bad');
        return null;
    }
    const xAxis = collectAxis('x');
    const yAxis = collectAxis('y');
    const topologyIds = selectedTopologyIds().filter((id) => isTopologyCompatible(model, id));
    const primaryObservable = els.classificationObservableSelect.value;
    const errors = validateScanInputs(xAxis, yAxis, topologyIds, primaryObservable);
    if (errors.length) {
        setStatus(errors.join(' '), 'bad');
        return null;
    }
    const createdAt = new Date().toISOString();
    const auxiliaryObservableIds = selectedAuxObservableIds().filter((id) => id !== primaryObservable);
    const observableIds = [...new Set([primaryObservable, ...auxiliaryObservableIds])];
    const phaseIdPayload = {
        modelId: model.id,
        topologyIds,
        xAxis,
        yAxis,
        seeds: seedValues(),
        repeatsPerCell: Math.max(1, Math.min(50, Number(els.repeatsInput.value) || 1)),
        steps: Math.max(1, Math.floor(Number(els.stepsInput.value) || 1)),
        initialConditionId: els.initialConditionSelect.value,
        primaryObservable,
        auxiliaryObservableIds,
        createdAt
    };
    const phaseConfig = {
        schemaName: 'LabPhaseScanConfig',
        schemaVersion: LAB_SCHEMA_VERSION,
        phaseScanId: `phase.${labHash(phaseIdPayload, 'id').replace(':', '.')}`,
        title: `${text(model.name, language)} ${xAxis.label} / ${yAxis.label}`,
        modelId: model.id,
        topologyIds,
        xAxis,
        yAxis,
        seedPlan: {
            seeds: seedValues(),
            repeatsPerCell: Math.max(1, Math.min(50, Number(els.repeatsInput.value) || 1)),
            deterministic: true
        },
        steps: Math.max(1, Math.floor(Number(els.stepsInput.value) || 1)),
        initialConditionId: els.initialConditionSelect.value,
        classificationObservableId: primaryObservable,
        auxiliaryObservableIds,
        classificationMethod: els.classificationMethodSelect.value,
        classificationParameters: {
            lowerThreshold: Number(els.lowerThresholdInput.value),
            upperThreshold: Number(els.upperThresholdInput.value)
        },
        validationLevel: model.validationLevel,
        visualizationModes: ['regime_map', 'heatmap', 'uncertainty_map', 'topology_comparison', 'observable_curve', 'snapshot_panel'],
        exportOptions: {
            json: true,
            csv: true,
            includeRawRuns: true,
            includeManifest: true,
            includeReproducibilityNotes: true
        },
        appVersion: LAB_APP_VERSION,
        createdAt,
        experimentHash: '',
        metadata: {
            mapTerm: mapTermForModel(model),
            topologySummary: topologyIds.map((id) => {
                const topology = topologyById(id);
                return {
                    id,
                    name: topology.name.en,
                    dimension: topology.dimension,
                    latticeType: topology.latticeTypes.join(','),
                    boundaryCondition: topology.boundaryCondition,
                    siteCount: siteCount(topology),
                    topologyHash: topology.hash
                };
            })
        }
    };
    phaseConfig.experimentHash = labHash({ ...phaseConfig, experimentHash: '', reproducibilityMetadata: undefined }, 'phase-scan');
    phaseConfig.reproducibilityMetadata = buildBasicReproducibilityMetadata({
        schemaName: 'LabPhaseScanConfig',
        modelId: model.id,
        modelVersion: `${model.id}@${LAB_APP_VERSION}`,
        rngSeed: phaseConfig.seedPlan.seeds[0] ?? null,
        seedPlan: phaseConfig.seedPlan,
        configHash: phaseConfig.experimentHash,
        deterministicReplaySupported: true,
        createdAt
    });
    const matrixResult = buildRunMatrix({
        batchName: phaseConfig.title,
        selectedModelIds: [model.id],
        selectedTopologyIds: topologyIds,
        selectedInitialConditionIds: [phaseConfig.initialConditionId],
        parameterSweep: [axisToSweep(xAxis), axisToSweep(yAxis)],
        seedPlan: { mode: 'list', seeds: phaseConfig.seedPlan.seeds, resolvedSeeds: [] },
        stepPlan: { mode: 'fixed', fixedSteps: phaseConfig.steps, resolvedStepCounts: [] },
        selectedObservableIds: observableIds,
        repeatCount: phaseConfig.seedPlan.repeatsPerCell,
        createdAt
    });
    if (!matrixResult.ok) {
        setStatus(matrixResult.errors.join(' '), 'bad');
        return null;
    }
    currentBatchConfig = matrixResult.config;
    currentPhaseConfig = phaseConfig;
    currentPhaseResult = null;
    selectedCellHash = null;
    updateRunEstimate();
    setStatus(`${t('generated')} ${currentBatchConfig.runMatrix.length} ${uiText('runCount', language).toLowerCase()}.`, 'ok');
    updateExportPreview();
    clearResults(false);
    return currentBatchConfig;
}

function setRunButtons(state) {
    const running = state === 'running';
    const paused = state === 'paused';
    els.startScanButton.disabled = running || paused;
    els.pauseScanButton.disabled = !running || !activeWorker;
    els.resumeScanButton.disabled = !paused || !activeWorker;
    els.cancelScanButton.disabled = !(running || paused);
}

function updateProgress(index, total, run) {
    els.scanProgress.max = Math.max(1, total);
    els.scanProgress.value = Math.min(total, index);
    els.currentRunText.textContent = run ? `${run.runId} / ${run.topologyId}` : '-';
}

function logRun(message, className = '') {
    const item = document.createElement('li');
    item.textContent = message;
    if (className) item.className = className;
    els.runLog.prepend(item);
}

function makePhaseResult(runResults, failedRuns, warnings = []) {
    return buildPhaseScanResult({
        phaseConfig: currentPhaseConfig,
        batchConfig: currentBatchConfig,
        runResults,
        failedRuns,
        xParameterId: currentPhaseConfig.xAxis.parameterId,
        yParameterId: currentPhaseConfig.yAxis.parameterId,
        observableIds: [currentPhaseConfig.classificationObservableId, ...currentPhaseConfig.auxiliaryObservableIds],
        classificationMethod: currentPhaseConfig.classificationMethod,
        lower: currentPhaseConfig.classificationParameters.lowerThreshold,
        upper: currentPhaseConfig.classificationParameters.upperThreshold,
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
                resolve(makePhaseResult(message.runResults, message.failedRuns, message.cancelled ? [t('cancelled')] : []));
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
    const safeBatchConfig = {
        ...currentBatchConfig,
        safetyOptions: { ...(currentBatchConfig.safetyOptions || {}), language }
    };
    const output = await runBatchSequentialLazy(safeBatchConfig, {
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
        },
        onSafetyWarning({ warning }) {
            logRun(language === 'zh' ? warning.messageZh : warning.messageEn, 'bad');
        },
        onSafetyPause({ messages }) {
            const message = messages?.at(-1);
            if (message) logRun(language === 'zh' ? message.messageZh : message.messageEn, 'bad');
        }
    });
    fallbackController = null;
    return makePhaseResult(output.results, output.failedRuns, output.cancelled ? [t('cancelled')] : []);
}

async function startScan() {
    if (!currentBatchConfig || !currentPhaseConfig) {
        if (!generateScan()) return;
    }
    setRunButtons('running');
    els.runLog.replaceChildren();
    currentPhaseResult = null;
    clearResults(false);
    try {
        currentPhaseResult = window.Worker ? await runWithWorker() : await runWithFallback();
        setStatus(t('scanComplete'), 'ok');
    } catch (error) {
        logRun(`${t('workerFailed')} ${error?.message || error}`, 'bad');
        currentPhaseResult = await runWithFallback();
    } finally {
        setRunButtons('idle');
        renderResults();
        updateExportPreview();
    }
}

function pauseScan() {
    activeWorker?.postMessage({ type: 'pause' });
    setRunButtons('paused');
}

function resumeScan() {
    activeWorker?.postMessage({ type: 'resume' });
    setRunButtons('running');
}

function cancelScan() {
    activeWorker?.postMessage({ type: 'cancel' });
    fallbackController?.cancel();
    setRunButtons('idle');
}

const regimeColors = {
    stable: '#61d394',
    mixed: '#d7b45d',
    fluctuating: '#a88cf2',
    extinct: '#59616a',
    percolating: '#49c7b8',
    'non-percolating': '#476072',
    'logical-success': '#78d4ff',
    'logical-failure': '#ff746d',
    'memory-alive': '#9be36f',
    'memory-lost': '#c66b6b',
    unknown: '#2d3338'
};

function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(260, rect.width || canvas.width);
    const height = Math.max(220, rect.height || canvas.height);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const context = canvas.getContext('2d');
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { context, width, height };
}

function visibleTopologyId() {
    return currentPhaseConfig?.topologyIds[0];
}

function cellLookupFor(topologyId = visibleTopologyId()) {
    const lookup = new Map();
    for (const cell of currentPhaseResult?.gridCells || []) {
        if (cell.topologyId !== topologyId) continue;
        lookup.set(`${cell.xValue}::${cell.yValue}`, cell);
    }
    return lookup;
}

function normalizedValue(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (number - min) / (max - min)));
}

function colorRamp(tValue) {
    const tSafe = Math.max(0, Math.min(1, tValue));
    const stops = [
        [68, 1, 84],
        [49, 104, 142],
        [53, 183, 121],
        [253, 231, 37]
    ];
    const scaled = tSafe * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.floor(scaled));
    const local = scaled - index;
    const start = stops[index];
    const end = stops[index + 1];
    const r = Math.round(start[0] + (end[0] - start[0]) * local);
    const g = Math.round(start[1] + (end[1] - start[1]) * local);
    const b = Math.round(start[2] + (end[2] - start[2]) * local);
    return `rgb(${r}, ${g}, ${b})`;
}

function phasePlotLayout(width, height) {
    const compact = width < 520;
    const left = compact ? 58 : 76;
    const right = compact ? 68 : 112;
    const top = compact ? 76 : 70;
    const bottom = compact ? 72 : 82;
    return {
        left,
        right,
        top,
        bottom,
        plotWidth: Math.max(80, width - left - right),
        plotHeight: Math.max(80, height - top - bottom)
    };
}

function formatAxisTick(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value);
    if (Math.abs(number) >= 1000 || (Math.abs(number) > 0 && Math.abs(number) < 0.001)) return number.toExponential(1);
    return Number(number.toFixed(3)).toString();
}

function canvasText(context, textValue, x, y, options = {}) {
    context.save();
    context.fillStyle = options.color || '#17221e';
    context.font = `${options.weight || 500} ${options.size || 12}px system-ui`;
    context.textAlign = options.align || 'left';
    context.textBaseline = options.baseline || 'alphabetic';
    if (options.rotate) {
        context.translate(x, y);
        context.rotate(options.rotate);
        context.fillText(String(textValue), 0, 0);
    } else {
        context.fillText(String(textValue), x, y);
    }
    context.restore();
}

function drawContinuousLegend(context, mode, x, y, width, height, min, max) {
    const gradient = context.createLinearGradient(x, y + height, x, y);
    for (let index = 0; index <= 12; index++) {
        const fraction = index / 12;
        gradient.addColorStop(fraction, colorRamp(fraction));
    }
    context.fillStyle = gradient;
    context.fillRect(x, y, width, height);
    context.strokeStyle = '#40534c';
    context.lineWidth = 1;
    context.strokeRect(x, y, width, height);
    const label = mode === 'uncertainty' ? t('uncertaintyValue') : t('observableValue');
    canvasText(context, label, x + width / 2, y - 8, { size: 11, weight: 700, align: 'center' });
    canvasText(context, mode === 'uncertainty' ? '1' : formatAxisTick(max), x + width + 5, y + 4, { size: 10 });
    canvasText(context, mode === 'uncertainty' ? '0' : formatAxisTick(min), x + width + 5, y + height, { size: 10 });
}

function drawRegimeLegend(context, cells, x, y) {
    const labels = [...new Set([...cells.values()].map((cell) => cell.classification.regimeLabel))].slice(0, 8);
    canvasText(context, t('regime'), x, y, { size: 11, weight: 700 });
    labels.forEach((label, index) => {
        const itemY = y + 14 + index * 19;
        context.fillStyle = regimeColors[label] || regimeColors.unknown;
        context.fillRect(x, itemY, 12, 12);
        context.strokeStyle = '#40534c';
        context.strokeRect(x, itemY, 12, 12);
        canvasText(context, label, x + 17, itemY + 10, { size: 10 });
    });
}

function drawPhaseCanvas(canvas, mode) {
    const { context, width, height } = setupCanvas(canvas);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#f8faf9';
    context.fillRect(0, 0, width, height);
    if (!currentPhaseResult) {
        canvasText(context, t('noResult'), 18, 32, { color: '#53635e', size: 13 });
        return;
    }
    const xValues = currentPhaseConfig.xAxis.values;
    const yValues = currentPhaseConfig.yAxis.values;
    const topologyId = visibleTopologyId();
    const cells = cellLookupFor(topologyId);
    const values = [...cells.values()].map((cell) => Number(cell.classification.meanValue)).filter(Number.isFinite);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const layout = phasePlotLayout(width, height);
    const cellWidth = layout.plotWidth / Math.max(1, xValues.length);
    const cellHeight = layout.plotHeight / Math.max(1, yValues.length);
    const figureTitle = mode === 'regime'
        ? t('figureRegimeTitle')
        : mode === 'heatmap'
            ? t('figureHeatmapTitle')
            : t('figureUncertaintyTitle');
    const model = modelById(currentPhaseConfig.modelId);
    canvasText(context, figureTitle, width / 2, 23, { size: 15, weight: 750, align: 'center' });
    canvasText(
        context,
        `${text(model?.name || { en: currentPhaseConfig.modelId }, language)} | ${t('topologyLabel')}: ${text(topologyById(topologyId).name, language)}`,
        width / 2,
        43,
        { color: '#52635d', size: 11, align: 'center' }
    );
    context.strokeStyle = 'rgba(63, 83, 76, 0.18)';
    context.lineWidth = 1;
    for (let index = 0; index <= 4; index++) {
        const y = layout.top + (layout.plotHeight * index) / 4;
        context.beginPath();
        context.moveTo(layout.left, y);
        context.lineTo(layout.left + layout.plotWidth, y);
        context.stroke();
    }
    yValues.forEach((yValue, yIndex) => {
        xValues.forEach((xValue, xIndex) => {
            const cell = cells.get(`${xValue}::${yValue}`);
            const left = layout.left + xIndex * cellWidth;
            const top = layout.top + (yValues.length - 1 - yIndex) * cellHeight;
            let fill = '#172027';
            if (cell) {
                if (mode === 'regime') fill = regimeColors[cell.classification.regimeLabel] || regimeColors.unknown;
                if (mode === 'heatmap') fill = colorRamp(normalizedValue(cell.classification.meanValue, min, max));
                if (mode === 'uncertainty') fill = colorRamp(1 - Number(cell.classification.confidence || 0));
            }
            context.fillStyle = fill;
            context.fillRect(left + 1, top + 1, Math.max(1, cellWidth - 2), Math.max(1, cellHeight - 2));
            if (cell?.cellHash === selectedCellHash) {
                context.strokeStyle = '#ffffff';
                context.lineWidth = 2;
                context.strokeRect(left + 2, top + 2, Math.max(1, cellWidth - 4), Math.max(1, cellHeight - 4));
            }
        });
    });
    context.strokeStyle = '#2d413a';
    context.lineWidth = 1.5;
    context.strokeRect(layout.left, layout.top, layout.plotWidth, layout.plotHeight);
    const xStride = Math.max(1, Math.ceil(xValues.length / 6));
    xValues.forEach((value, index) => {
        if (index % xStride && index !== xValues.length - 1) return;
        canvasText(context, formatAxisTick(value), layout.left + (index + 0.5) * cellWidth, layout.top + layout.plotHeight + 18, {
            color: '#354a42',
            size: 10,
            align: 'center'
        });
    });
    const yStride = Math.max(1, Math.ceil(yValues.length / 6));
    yValues.forEach((value, index) => {
        if (index % yStride && index !== yValues.length - 1) return;
        canvasText(context, formatAxisTick(value), layout.left - 8, layout.top + (yValues.length - index - 0.5) * cellHeight, {
            color: '#354a42',
            size: 10,
            align: 'right',
            baseline: 'middle'
        });
    });
    canvasText(context, currentPhaseConfig.xAxis.label, layout.left + layout.plotWidth / 2, height - 38, {
        size: 12,
        weight: 700,
        align: 'center'
    });
    canvasText(context, currentPhaseConfig.yAxis.label, 19, layout.top + layout.plotHeight / 2, {
        size: 12,
        weight: 700,
        align: 'center',
        rotate: -Math.PI / 2
    });
    if (mode === 'regime') drawRegimeLegend(context, cells, layout.left + layout.plotWidth + 12, layout.top + 4);
    else drawContinuousLegend(context, mode, layout.left + layout.plotWidth + 18, layout.top + 28, 14, Math.min(150, layout.plotHeight - 50), min, max);
    canvasText(context, t('finiteGridNote'), layout.left, height - 10, { color: '#5d6d67', size: 10 });
}

function cellFromCanvasEvent(canvas, event) {
    if (!currentPhaseResult) return null;
    const rect = canvas.getBoundingClientRect();
    const layout = phasePlotLayout(rect.width, rect.height);
    const x = event.clientX - rect.left - layout.left;
    const y = event.clientY - rect.top - layout.top;
    if (x < 0 || y < 0 || x > layout.plotWidth || y > layout.plotHeight) return null;
    const xValues = currentPhaseConfig.xAxis.values;
    const yValues = currentPhaseConfig.yAxis.values;
    const xIndex = Math.max(0, Math.min(xValues.length - 1, Math.floor((x / layout.plotWidth) * xValues.length)));
    const yIndexFromTop = Math.max(0, Math.min(yValues.length - 1, Math.floor((y / layout.plotHeight) * yValues.length)));
    const yIndex = yValues.length - 1 - yIndexFromTop;
    const xValue = xValues[xIndex];
    const yValue = yValues[yIndex];
    return cellLookupFor().get(`${xValue}::${yValue}`) || null;
}

function selectCell(cell) {
    selectedCellHash = cell?.cellHash || null;
    renderSelectedCell(cell);
    renderCanvases();
}

function renderSelectedCell(cell) {
    els.selectedCellPanel.replaceChildren();
    if (!cell) return;
    const card = document.createElement('article');
    card.className = 'phase-cell-card';
    card.innerHTML = `
        <h3>${t('selectedCell')}</h3>
        <p>${t('topology')}: ${cell.topologyId}</p>
        <p>${currentPhaseConfig.xAxis.label}: ${cell.xValue}; ${currentPhaseConfig.yAxis.label}: ${cell.yValue}</p>
        <p>${t('regime')}: ${cell.classification.regimeLabel}</p>
        <p>${t('meanValue')}: ${formatNumber(cell.classification.meanValue)}; ${t('confidence')}: ${formatNumber(cell.classification.confidence)}</p>
        <p>${uiText('warnings', language)}: ${cell.warnings.length ? cell.warnings.slice(0, 2).join(' ') : '-'}</p>
    `;
    els.selectedCellPanel.append(card);
}

function renderCanvases() {
    drawPhaseCanvas(els.regimeCanvas, 'regime');
    drawPhaseCanvas(els.heatmapCanvas, 'heatmap');
    drawPhaseCanvas(els.uncertaintyCanvas, 'uncertainty');
}

function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(4).replace(/\.?0+$/, '') : '-';
}

function renderResults() {
    renderCanvases();
    els.phaseTableBody.replaceChildren();
    if (!currentPhaseResult) return;
    for (const cell of currentPhaseResult.gridCells.slice(0, 160)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cell.topologyId}</td>
            <td>${cell.xValue}</td>
            <td>${cell.yValue}</td>
            <td>${cell.classification.regimeLabel}</td>
            <td>${formatNumber(cell.classification.meanValue)}</td>
            <td>${formatNumber(cell.classification.confidence)}</td>
            <td>${cell.classification.failedRunCount}</td>
        `;
        row.addEventListener('click', () => selectCell(cell));
        els.phaseTableBody.append(row);
    }
    els.topologyComparisonPanel.replaceChildren();
    for (const comparison of currentPhaseResult.topologyComparisons) {
        const card = document.createElement('article');
        card.className = 'viz-card';
        const dominant = Object.entries(comparison.dominantRegimes)
            .filter(([, count]) => count)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([label, count]) => `${label}: ${count}`)
            .join(', ');
        card.innerHTML = `
            <h3>${t('topologyComparison')}: ${comparison.topologyId}</h3>
            <p>${t('hash')}: ${comparison.topologyHash}</p>
            <p>${t('dominantRegimes')}: ${dominant || '-'}</p>
            <p>${uiText('summary', language)}: ${comparison.completedCells} cells / ${comparison.failedCells} ${t('failedRuns')}</p>
        `;
        els.topologyComparisonPanel.append(card);
    }
    if (!selectedCellHash && currentPhaseResult.gridCells[0]) selectCell(currentPhaseResult.gridCells[0]);
}

function clearResults(clearStatus = true) {
    els.phaseTableBody.replaceChildren();
    els.selectedCellPanel.replaceChildren();
    els.topologyComparisonPanel.replaceChildren();
    renderCanvases();
    if (clearStatus) setStatus(t('statusReady'));
    updateExportPreview();
}

function exportEnvelope() {
    if (!currentPhaseConfig) return null;
    return {
        phaseScanConfig: currentPhaseConfig,
        batchConfig: currentBatchConfig,
        phaseScanResult: currentPhaseResult,
        manifest: currentPhaseResult?.manifest || null
    };
}

function updateExportPreview() {
    const envelope = exportEnvelope();
    storeValidationCandidate('phase-scan', envelope);
    els.exportPreview.value = envelope ? JSON.stringify(envelope, null, 2).slice(0, 20000) : t('noResult');
}

function exportJson() {
    const envelope = exportEnvelope();
    if (!envelope) return;
    downloadText('topoboard-labs-phase-scan.json', JSON.stringify(envelope, null, 2), 'application/json');
}

function exportGridCsv() {
    if (!currentPhaseResult) return;
    downloadText('phase-grid.csv', toCsv(phaseGridRows(currentPhaseResult), [
        'topologyId',
        'xValue',
        'yValue',
        'regimeLabel',
        'meanValue',
        'variance',
        'confidence',
        'sampleCount',
        'failedRunCount',
        'cellHash'
    ]), 'text/csv');
}

function exportClassCsv() {
    if (!currentPhaseResult) return;
    downloadText('phase-classifications.csv', toCsv(classificationRows(currentPhaseResult), [
        'id',
        'topologyId',
        'xValue',
        'yValue',
        'observableId',
        'method',
        'regimeLabel',
        'meanValue',
        'variance',
        'confidence',
        'lowerThreshold',
        'upperThreshold',
        'sampleCount',
        'failedRunCount',
        'classificationHash'
    ]), 'text/csv');
}

function exportManifest() {
    if (!currentPhaseResult) return;
    const manifest = { ...currentPhaseResult.manifest, exportedAt: new Date().toISOString() };
    downloadText('phase-manifest.json', JSON.stringify(manifest, null, 2), 'application/json');
}

function applySafeDefaults() {
    renderModelSelect();
    els.modelSelect.value = 'ising_domain_game';
    renderAll();
    const torus = els.topologyCards.querySelector('input[value="torus"]');
    if (torus) {
        for (const input of els.topologyCards.querySelectorAll('input[type="checkbox"]')) input.checked = false;
        torus.checked = true;
    }
    els.xParameterSelect.value = 'temperature';
    applyAxisDefaults('x');
    els.yParameterSelect.value = 'fieldH';
    applyAxisDefaults('y');
    els.xCountInput.value = '5';
    els.yCountInput.value = '5';
    els.seedListInput.value = 'phase-seed-1';
    els.repeatsInput.value = '1';
    els.stepsInput.value = '20';
    els.classificationObservableSelect.value = selectedModel().observables[0]?.id || '';
    renderObservables();
    updateAxisPreviews();
    setStatus(t('safeDefaultsApplied'), 'ok');
}

function panelStorageKey(panel, index) {
    const titleId = panel.querySelector('.panel-heading h2')?.id || `phase-panel-${index}`;
    return `topoboard-labs:phase-panel:${titleId}`;
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
    els.researchModeButton.addEventListener('click', () => setPhaseMode('research'));
    els.guidedModeButton.addEventListener('click', () => setPhaseMode('guided'));
    els.guidedDefaultsButton.addEventListener('click', applySafeDefaults);
    els.guidedRunButton.addEventListener('click', async () => {
        applySafeDefaults();
        generateScan();
        await startScan();
    });
    els.modelSelect.addEventListener('change', renderAll);
    for (const axis of ['x', 'y']) {
        const elements = axisElements(axis);
        elements.select.addEventListener('change', () => applyAxisDefaults(axis));
        for (const input of [elements.inputType, elements.min, elements.max, elements.count, elements.list]) {
            input.addEventListener('input', () => updateAxisPreview(axis));
            input.addEventListener('change', () => updateAxisPreview(axis));
        }
    }
    els.classificationObservableSelect.addEventListener('change', () => {
        renderObservables();
        updateRunEstimate();
    });
    for (const input of [
        els.seedListInput,
        els.repeatsInput,
        els.stepsInput,
        els.lowerThresholdInput,
        els.upperThresholdInput,
        els.classificationMethodSelect,
        els.initialConditionSelect
    ]) {
        input.addEventListener('input', updateRunEstimate);
        input.addEventListener('change', updateRunEstimate);
    }
    els.generateScanButton.addEventListener('click', generateScan);
    els.startScanButton.addEventListener('click', startScan);
    els.pauseScanButton.addEventListener('click', pauseScan);
    els.resumeScanButton.addEventListener('click', resumeScan);
    els.cancelScanButton.addEventListener('click', cancelScan);
    els.exportJsonButton.addEventListener('click', exportJson);
    els.exportGridCsvButton.addEventListener('click', exportGridCsv);
    els.exportClassCsvButton.addEventListener('click', exportClassCsv);
    els.exportManifestButton.addEventListener('click', exportManifest);
    for (const canvas of [els.regimeCanvas, els.heatmapCanvas, els.uncertaintyCanvas]) {
        canvas.addEventListener('click', (event) => selectCell(cellFromCanvasEvent(canvas, event)));
    }
    window.addEventListener('resize', renderCanvases);
}

function initializeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'guided') phaseMode = 'guided';
    const model = params.get('model');
    if (model && MODEL_REGISTRY.some((entry) => entry.id === model && phaseSupportForModel(entry).ok)) els.modelSelect.value = model;
}

renderModelSelect();
initializeFromUrl();
installPanelCollapsers();
bindEvents();
setLanguage(language);
setPhaseMode(phaseMode);
clearResults();
updateProgress(0, 0);
