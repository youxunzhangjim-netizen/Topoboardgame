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
} from './LabExperimentRegistry.js';
import {
    buildExportManifest,
    buildRunMatrix,
    downloadText,
    escapeCsv,
    parseList,
    parseScalar,
    resultsToSummaryStatistics,
    toCsv
} from './LabBatchCore.js';
import { runBatchSequential } from './LabBatchRunner.js';
import { installLabLanguageMenu, syncLabLanguageMenu } from './LabLanguageMenu.js';
import { researchDescription, researchWarning } from '../LabResearchDescriptions.js';

const els = {
    languageSelect: document.querySelector('#languageSelect'),
    researchBatchMode: document.querySelector('#researchBatchMode'),
    compareTopologiesMode: document.querySelector('#compareTopologiesMode'),
    mobileCompareButton: document.querySelector('#mobileCompareButton'),
    mobileMatrixButton: document.querySelector('#mobileMatrixButton'),
    mobileRunButton: document.querySelector('#mobileRunButton'),
    workflowMap: document.querySelector('#workflowMap'),
    modelSelect: document.querySelector('#modelSelect'),
    modelMetadata: document.querySelector('#modelMetadata'),
    modelWarnings: document.querySelector('#modelWarnings'),
    topologyList: document.querySelector('#topologyList'),
    initialConditionList: document.querySelector('#initialConditionList'),
    compareHelp: document.querySelector('#compareHelp'),
    parameterSweepList: document.querySelector('#parameterSweepList'),
    seedModeSelect: document.querySelector('#seedModeSelect'),
    seedValueInput: document.querySelector('#seedValueInput'),
    seedEndInput: document.querySelector('#seedEndInput'),
    stepModeSelect: document.querySelector('#stepModeSelect'),
    stepValueInput: document.querySelector('#stepValueInput'),
    repeatCountInput: document.querySelector('#repeatCountInput'),
    observableList: document.querySelector('#observableList'),
    batchNameInput: document.querySelector('#batchNameInput'),
    generateMatrixButton: document.querySelector('#generateMatrixButton'),
    matrixStatus: document.querySelector('#matrixStatus'),
    matrixEstimate: document.querySelector('#matrixEstimate'),
    matrixPreviewBody: document.querySelector('#matrixPreviewBody'),
    startBatchButton: document.querySelector('#startBatchButton'),
    pauseBatchButton: document.querySelector('#pauseBatchButton'),
    resumeBatchButton: document.querySelector('#resumeBatchButton'),
    cancelBatchButton: document.querySelector('#cancelBatchButton'),
    runProgress: document.querySelector('#runProgress'),
    workerStatus: document.querySelector('#workerStatus'),
    currentRunText: document.querySelector('#currentRunText'),
    progressText: document.querySelector('#progressText'),
    runLog: document.querySelector('#runLog'),
    comparisonDashboard: document.querySelector('#comparisonDashboard'),
    exportConfigButton: document.querySelector('#exportConfigButton'),
    exportCsvButton: document.querySelector('#exportCsvButton'),
    exportManifestButton: document.querySelector('#exportManifestButton'),
    copyConfigButton: document.querySelector('#copyConfigButton'),
    exportPreview: document.querySelector('#exportPreview')
};

function storeValidationCandidate(type, envelope) {
    if (!envelope) return;
    try {
        const payload = {
            type,
            storedAt: new Date().toISOString(),
            sourceRoute: '/labs/experiments/',
            envelope
        };
        localStorage.setItem('topoboard-labs:last-validation-object', JSON.stringify(payload));
        localStorage.setItem(`topoboard-labs:last-${type}`, JSON.stringify(payload));
    } catch {
        // Browser storage may be unavailable or full; exports still work without it.
    }
}

let language = getLanguage();
let builderMode = new URLSearchParams(window.location.search).get('mode') === 'compare-topologies'
    ? 'compare'
    : 'research';
let currentBatchConfig = null;
let currentBatchResult = null;
let activeWorker = null;
let fallbackController = null;

const workflowKeys = [
    'selectModel',
    'selectTopologies',
    'initialConditions',
    'parameters',
    'seedsSteps',
    'observables',
    'review',
    'runBatch',
    'compareResults',
    'exportDataset'
];

function panelStorageKey(panel, index) {
    const titleId = panel.querySelector('.panel-heading h2')?.id || `panel-${index}`;
    return `topoboard-labs:experiment-panel:${titleId}`;
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

function setLanguage(nextLanguage) {
    language = nextLanguage === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
    localStorage.setItem('topoboard-labs-language', language);
    localStorage.setItem('topological-boardgame:language', language);
    els.languageSelect.value = language;
    syncLabLanguageMenu(language);
    for (const node of document.querySelectorAll('[data-i18n]')) {
        node.textContent = uiText(node.dataset.i18n, language);
    }
    updatePanelCollapseLabels();
    renderWorkflow();
    renderStaticSelectOptions();
    renderModelSelect();
    renderAll();
}

function renderStaticSelectOptions() {
    const seedLabels = {
        en: [
            ['single', 'single seed'],
            ['list', 'list of seeds'],
            ['range', 'seed range'],
            ['generated', 'random generated seeds']
        ],
        zh: [
            ['single', '單一種子'],
            ['list', '種子列表'],
            ['range', '種子範圍'],
            ['generated', '產生種子']
        ]
    };
    const stepLabels = {
        en: [
            ['fixed', 'fixed number'],
            ['list', 'list of step counts'],
            ['checkpoints', 'checkpoints']
        ],
        zh: [
            ['fixed', '固定步數'],
            ['list', '步數列表'],
            ['checkpoints', '檢查點']
        ]
    };
    els.seedModeSelect.replaceChildren(...seedLabels[language].map(([value, label]) => new Option(label, value)));
    els.stepModeSelect.replaceChildren(...stepLabels[language].map(([value, label]) => new Option(label, value)));
}

function renderWorkflow() {
    els.workflowMap.replaceChildren();
    workflowKeys.forEach((key, index) => {
        const step = document.createElement('div');
        step.className = 'workflow-step';
        step.innerHTML = `<strong>${index + 1}</strong><span>${uiText(key, language)}</span>`;
        els.workflowMap.append(step);
    });
}

function renderModelSelect() {
    const selected = els.modelSelect.value || new URLSearchParams(window.location.search).get('model') || 'ising_domain_game';
    els.modelSelect.replaceChildren();
    for (const section of LAB_SECTIONS) {
        const group = document.createElement('optgroup');
        group.label = section;
        for (const model of MODEL_REGISTRY.filter((entry) => entry.section === section)) {
            group.append(new Option(text(model.name, language), model.id));
        }
        if (group.children.length) els.modelSelect.append(group);
    }
    const available = [...els.modelSelect.options].some((option) => option.value === selected);
    els.modelSelect.value = available ? selected : modelById(selected).id;
}

function selectedModel() {
    return modelById(els.modelSelect.value);
}

function selectedTopologyIds() {
    return [...els.topologyList.querySelectorAll('input[type="checkbox"]:checked')]
        .map((input) => input.value);
}

function selectedInitialConditionIds() {
    const selected = [...els.initialConditionList.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')]
        .map((input) => input.value);
    return selected.length ? selected : [selectedModel().initialConditions[0][0]];
}

function selectedObservableIds() {
    const checked = [...els.observableList.querySelectorAll('input[type="checkbox"]:checked')]
        .map((input) => input.value);
    if (builderMode === 'compare') return checked.slice(0, 1);
    return checked;
}

function setBuilderMode(mode) {
    builderMode = mode === 'compare' ? 'compare' : 'research';
    document.body.dataset.builderMode = builderMode;
    els.researchBatchMode.setAttribute('aria-pressed', String(builderMode === 'research'));
    els.compareTopologiesMode.setAttribute('aria-pressed', String(builderMode === 'compare'));
    els.compareHelp.hidden = builderMode !== 'compare';
    els.repeatCountInput.value = builderMode === 'compare' ? '1' : els.repeatCountInput.value;
    els.seedModeSelect.value = 'single';
    renderAll();
}

function metadataRow(label, value) {
    const item = document.createElement('div');
    item.innerHTML = `<dt>${label}</dt><dd>${value}</dd>`;
    return item;
}

function renderModelMetadata() {
    const model = selectedModel();
    const research = researchDescription(model.id, language);
    els.modelMetadata.replaceChildren(
        metadataRow(uiText('family', language), `${model.section} / ${model.family}`),
        metadataRow(uiText('validation', language), model.validationLevel),
        metadataRow(uiText('stateSpace', language), text(model.stateSpace, language)),
        metadataRow(research.labels.objective, research.objective),
        metadataRow(research.labels.model, research.model),
        metadataRow(research.labels.dynamics, research.dynamics),
        metadataRow(research.labels.ensemble, research.ensemble),
        metadataRow(research.labels.method, research.method),
        metadataRow(research.labels.scope, research.scope),
        metadataRow(uiText('modelVersion', language), `${model.id}@${LAB_APP_VERSION}`),
        metadataRow(uiText('compatibleTopologies', language), model.compatibleTopologies.join(', ')),
        metadataRow(uiText('observableRegistry', language), `${model.observables.length} ${uiText('observableRegistryValue', language)}`)
    );
    els.modelWarnings.replaceChildren();
    for (const warning of model.warnings || []) {
        const item = document.createElement('span');
        item.className = 'warning';
        item.textContent = language === 'zh'
            ? `${uiText('notePrefix', language)}：${researchWarning(warning, language)}`
            : warning;
        els.modelWarnings.append(item);
    }
}

function renderTopologies() {
    const model = selectedModel();
    const previouslySelected = new Set(selectedTopologyIds());
    if (!previouslySelected.size) previouslySelected.add('torus');
    const selectedCompatible = [...previouslySelected].some((id) => isTopologyCompatible(model, id));
    if (!selectedCompatible) {
        previouslySelected.clear();
        previouslySelected.add(model.compatibleTopologies.includes('torus') ? 'torus' : model.compatibleTopologies[0]);
    }
    els.topologyList.replaceChildren();
    for (const topology of TOPOLOGY_REGISTRY) {
        const compatible = isTopologyCompatible(model, topology.id);
        const selected = compatible && (previouslySelected.has(topology.id) || (builderMode === 'compare' && ['flat', 'torus'].includes(topology.id)));
        const card = document.createElement('article');
        card.className = `topology-card${compatible ? '' : ' is-disabled'}`;
        const sites = (topology.width || 1) * (topology.height || 1) * (topology.depth || 1) * (topology.w || 1);
        const edges = Math.max(0, sites * topology.dimension * 2);
        card.innerHTML = `
            <label>
                <input type="checkbox" value="${topology.id}" ${selected ? 'checked' : ''} ${compatible ? '' : 'disabled'}>
                <span>${text(topology.name, language)}</span>
            </label>
            <small>${topology.dimension}D / ${topology.latticeTypes.join(', ')} / ${topology.boundaryCondition}</small>
            <small>${sites} sites / ~${edges} edges</small>
            <code>${topology.hash}</code>
            <small>${compatible ? uiText('compatible', language) : `${uiText('incompatible', language)}: ${uiText('batchAdapterNotStandardized', language)}`}</small>
        `;
        card.querySelector('input')?.addEventListener('change', () => {
            if (builderMode === 'compare' && selectedTopologyIds().length < 2) {
                els.matrixStatus.textContent = uiText('compareNeedsTwoTopologies', language);
                els.matrixStatus.className = 'status-pill bad';
            }
        });
        els.topologyList.append(card);
    }
}

function renderInitialConditions() {
    const model = selectedModel();
    const options = initialConditionOptions(model, language);
    const previous = selectedInitialConditionIds()[0];
    const current = options.some((option) => option.id === previous) ? previous : options[0]?.id;
    els.initialConditionList.replaceChildren();
    for (const option of options) {
        const card = document.createElement('article');
        card.className = 'choice-card';
        card.innerHTML = `
            <label>
                <input type="radio" name="initialCondition" value="${option.id}" ${option.id === current ? 'checked' : ''}>
                <span>${option.label}</span>
            </label>
            <small>${uiText('storedInConfig', language)}</small>
        `;
        els.initialConditionList.append(card);
    }
}

function parameterModeOptions() {
    return [
        ['fixed', uiText('fixed', language)],
        ['list', uiText('list', language)],
        ['range', uiText('range', language)],
        ['distribution', uiText('distribution', language)]
    ];
}

function renderParameters() {
    const model = selectedModel();
    els.parameterSweepList.replaceChildren();
    for (const parameter of model.parameters) {
        const row = document.createElement('div');
        row.className = 'sweep-row';
        row.dataset.parameterId = parameter.id;
        row.dataset.parameterLabel = parameter.label;
        row.dataset.parameterKind = parameter.kind || 'number';
        const choiceList = parameter.choices?.join(', ') || '';
        row.innerHTML = `
            <label>
                ${uiText('parameter', language)}
                <input class="parameter-label" value="${parameter.label}" readonly>
            </label>
            <label>
                ${uiText('type', language)}
                <select class="sweep-mode"></select>
            </label>
            <label>
                ${uiText('valueList', language)}
                <input class="sweep-value" value="${parameter.defaultValue}">
            </label>
            <label>
                ${uiText('rangeStartEnd', language)}
                <input class="sweep-range" value="${parameter.min ?? 0},${parameter.max ?? parameter.defaultValue}">
            </label>
            <label>
                ${uiText('stepsCount', language)}
                <input class="sweep-steps" value="${parameter.kind === 'choice' ? choiceList : 4}">
            </label>
        `;
        const modeSelect = row.querySelector('.sweep-mode');
        for (const [value, label] of parameterModeOptions()) modeSelect.append(new Option(label, value));
        if (builderMode === 'compare') modeSelect.value = 'fixed';
        els.parameterSweepList.append(row);
    }
}

function zhObservableDefinition(observable) {
    const category = {
        energy: '能量',
        order_parameter: '序參量',
        topology: '拓撲',
        geometry: '幾何',
        correlation: '關聯',
        entropy: '熵',
        defect: '缺陷',
        braid: 'braid',
        fusion: 'fusion',
        logical: 'logical',
        transport: 'transport',
        count: '計數',
        distribution: '分布',
        diagnostic: '診斷'
    }[observable.category] || observable.category;
    return `${observable.name}：${category}觀測量。${observable.physicalMeaning}`;
}

function renderObservables() {
    const model = selectedModel();
    const selected = new Set(selectedObservableIds());
    const selectedHasCurrentObservable = model.observables.some((observable) => selected.has(observable.id));
    if ((!selected.size || !selectedHasCurrentObservable) && model.observables[0]) {
        selected.clear();
        selected.add(model.observables[0].id);
    }
    els.observableList.replaceChildren();
    for (const observable of model.observables) {
        const checked = selected.has(observable.id);
        const card = document.createElement('article');
        card.className = 'observable-card';
        card.innerHTML = `
            <label>
                <input type="checkbox" value="${observable.id}" ${checked ? 'checked' : ''}>
                <span>${observable.name}</span>
            </label>
            <small><strong>${uiText('definition', language)}:</strong> ${language === 'zh' ? zhObservableDefinition(observable) : observable.definition}</small>
            <small>${observable.category} / ${observable.estimatorType} / ${observable.validationLevel}</small>
            <small><strong>${uiText('cost', language)}:</strong> ${observable.computationalCost}; <strong>${uiText('limitations', language)}:</strong> ${language === 'zh' ? uiText('finiteGraphLimitation', language) : observable.limitations.join(' ')}</small>
        `;
        card.querySelector('input').addEventListener('change', (event) => {
            if (builderMode !== 'compare' || !event.target.checked) return;
            for (const input of els.observableList.querySelectorAll('input[type="checkbox"]')) {
                if (input !== event.target) input.checked = false;
            }
        });
        els.observableList.append(card);
    }
}

function renderAll() {
    renderModelMetadata();
    renderTopologies();
    renderInitialConditions();
    renderParameters();
    renderObservables();
    currentBatchConfig = null;
    currentBatchResult = null;
    renderMatrixPreview(null);
    renderComparison();
    updateExportPreview();
}

function collectParameterSweep() {
    if (builderMode === 'compare') {
        return [...els.parameterSweepList.querySelectorAll('.sweep-row')].map((row) => ({
            parameterId: row.dataset.parameterId,
            label: row.dataset.parameterLabel,
            mode: 'fixed',
            fixedValue: parseScalar(row.querySelector('.sweep-value').value)
        }));
    }
    return [...els.parameterSweepList.querySelectorAll('.sweep-row')].map((row) => {
        const mode = row.querySelector('.sweep-mode').value;
        const value = row.querySelector('.sweep-value').value;
        const [start, end] = parseList(row.querySelector('.sweep-range').value);
        const steps = Number(row.querySelector('.sweep-steps').value) || 1;
        const base = {
            parameterId: row.dataset.parameterId,
            label: row.dataset.parameterLabel,
            mode
        };
        if (mode === 'list') return { ...base, values: parseList(value) };
        if (mode === 'range') {
            return {
                ...base,
                range: {
                    start: Number(start) || 0,
                    end: Number(end) || Number(start) || 0,
                    steps,
                    integer: row.dataset.parameterKind === 'integer'
                }
            };
        }
        if (mode === 'distribution') {
            return {
                ...base,
                distribution: {
                    type: 'uniform',
                    min: Number(start) || 0,
                    max: Number(end) || Number(start) || 1,
                    count: steps
                }
            };
        }
        return { ...base, fixedValue: parseScalar(value) };
    });
}

function collectSeedPlan() {
    const mode = builderMode === 'compare' ? 'single' : els.seedModeSelect.value;
    if (mode === 'list') return { mode, seeds: parseList(els.seedValueInput.value), resolvedSeeds: [] };
    if (mode === 'range') {
        return {
            mode,
            range: {
                start: Number(els.seedValueInput.value) || 1,
                end: Number(els.seedEndInput.value) || Number(els.seedValueInput.value) || 1,
                step: 1
            },
            resolvedSeeds: []
        };
    }
    if (mode === 'generated') {
        return {
            mode,
            generatorSeed: els.seedValueInput.value || 'topoboard-generator',
            generatedCount: Number(els.seedEndInput.value) || 3,
            resolvedSeeds: []
        };
    }
    return { mode: 'single', singleSeed: els.seedValueInput.value || 'topoboard-seed-1', resolvedSeeds: [] };
}

function collectStepPlan() {
    const mode = els.stepModeSelect.value;
    const values = parseList(els.stepValueInput.value).map(Number).filter((value) => Number.isFinite(value));
    if (mode === 'list') return { mode, stepCounts: values, resolvedStepCounts: [] };
    if (mode === 'checkpoints') return { mode, checkpoints: values, resolvedStepCounts: [] };
    return { mode: 'fixed', fixedSteps: Number(els.stepValueInput.value) || 0, resolvedStepCounts: [] };
}

function validateCompareInputs(topologies, observables) {
    if (builderMode !== 'compare') return [];
    const errors = [];
    if (topologies.length < 2) errors.push(uiText('compareNeedsTwoTopologies', language));
    if (observables.length !== 1) errors.push(uiText('compareNeedsOneObservable', language));
    return errors;
}

function generateMatrix() {
    currentBatchConfig = null;
    currentBatchResult = null;
    const model = selectedModel();
    const topologyIds = selectedTopologyIds().filter((id) => isTopologyCompatible(model, id));
    const observableIds = selectedObservableIds();
    const compareErrors = validateCompareInputs(topologyIds, observableIds);
    if (compareErrors.length) {
        renderMatrixError(compareErrors);
        return null;
    }
    const result = buildRunMatrix({
        batchName: els.batchNameInput.value,
        selectedModelIds: [model.id],
        selectedTopologyIds: topologyIds,
        selectedInitialConditionIds: selectedInitialConditionIds().slice(0, 1),
        parameterSweep: collectParameterSweep(),
        seedPlan: collectSeedPlan(),
        stepPlan: collectStepPlan(),
        selectedObservableIds: observableIds,
        repeatCount: builderMode === 'compare' ? 1 : Number(els.repeatCountInput.value) || 1
    });
    if (!result.ok) {
        renderMatrixError(result.errors);
        return null;
    }
    currentBatchConfig = result.config;
    currentBatchResult = null;
    renderMatrixPreview(result.config, result.estimate);
    updateExportPreview();
    return result.config;
}

function renderMatrixError(errors) {
    els.matrixStatus.className = 'status-pill bad';
    els.matrixStatus.textContent = errors.join(' ');
    els.matrixEstimate.replaceChildren();
    els.matrixPreviewBody.replaceChildren();
}

function renderMatrixPreview(config, estimate = config?.metadata?.estimate) {
    els.matrixPreviewBody.replaceChildren();
    els.matrixEstimate.replaceChildren();
    if (!config) {
        els.matrixStatus.className = 'status-pill';
        els.matrixStatus.textContent = uiText('statusReady', language);
        return;
    }
    els.matrixStatus.className = 'status-pill ok';
    els.matrixStatus.textContent = `${config.runMatrix.length} ${uiText('runCount', language).toLowerCase()}; ${uiText('noIncomplete', language)}`;
    const seedCount = config.seedPlan.resolvedSeeds.length;
    const topologyCount = config.selectedTopologyIds.length;
    els.matrixEstimate.replaceChildren(
        metadataRow(uiText('runCount', language), String(config.runMatrix.length)),
        metadataRow(uiText('configurations', language), String(Math.max(1, config.runMatrix.length / Math.max(1, seedCount)))),
        metadataRow(uiText('seeds', language), String(seedCount)),
        metadataRow(uiText('runtime', language), estimate?.estimatedRuntimeCategory || 'small'),
        metadataRow(uiText('memory', language), `${Math.round((estimate?.estimatedMemoryBytes || 0) / 1024)} KB`),
        metadataRow(uiText('topologies', language), String(topologyCount))
    );
    for (const run of config.runMatrix.slice(0, 30)) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${run.runId}</td>
            <td>${text(modelById(run.modelId).name, language)}</td>
            <td>${text(topologyById(run.topologyId).name, language)}</td>
            <td>${run.initialConditionId}</td>
            <td>${stableStringify(run.parameters)}</td>
            <td>${run.seed}</td>
            <td>${run.steps}</td>
            <td>${run.observables.length}</td>
        `;
        els.matrixPreviewBody.append(tr);
    }
}

function logRun(message, className = '') {
    const item = document.createElement('li');
    item.textContent = message;
    if (className) item.className = className;
    els.runLog.prepend(item);
}

function setRunButtons(state) {
    const running = state === 'running';
    const paused = state === 'paused';
    els.startBatchButton.disabled = running || paused;
    els.pauseBatchButton.disabled = !running || !activeWorker;
    els.resumeBatchButton.disabled = !paused || !activeWorker;
    els.cancelBatchButton.disabled = !(running || paused);
}

function updateProgress(index, total, run) {
    els.runProgress.max = Math.max(1, total);
    els.runProgress.value = Math.min(total, index);
    els.progressText.textContent = `${Math.min(total, index)} / ${total}`;
    els.currentRunText.textContent = run ? `${run.runId} / ${run.topologyId}` : '-';
}

function assembleBatchResult(batchConfig, runResults, failedRuns, cancelled = false, startedAt = Date.now()) {
    const warnings = [
        ...(batchConfig.metadata?.estimate?.warnings || []),
        ...(cancelled ? [uiText('batchCancelled', language)] : [])
    ];
    const summaryStatistics = resultsToSummaryStatistics(batchConfig, runResults, failedRuns, startedAt);
    const preliminaryHash = labHash({ batchHash: batchConfig.batchHash, runResults, failedRuns, warnings }, 'batch-result');
    const exportManifest = buildExportManifest(batchConfig, preliminaryHash);
    const result = {
        schemaName: 'LabBatchExperimentResult',
        schemaVersion: LAB_SCHEMA_VERSION,
        batchConfig,
        runResults,
        failedRuns,
        warnings,
        summaryStatistics,
        exportManifest,
        batchResultHash: preliminaryHash,
        metadata: {
            builderMode,
            appVersion: LAB_APP_VERSION
        }
    };
    result.batchResultHash = labHash(result, 'batch-result');
    result.exportManifest.batchResultHash = result.batchResultHash;
    result.reproducibilityMetadata = buildBasicReproducibilityMetadata({
        schemaName: 'LabBatchExperimentResult',
        modelId: batchConfig.selectedModelIds?.[0] || 'unknown',
        rngSeed: batchConfig.seedPlan?.resolvedSeeds?.[0] ?? null,
        seedPlan: batchConfig.seedPlan,
        configHash: batchConfig.batchHash,
        resultHash: result.batchResultHash,
        exportManifestHash: result.exportManifest.manifestHash || '',
        deterministicReplaySupported: true,
        createdAt: batchConfig.createdAt
    });
    return result;
}

function runWithWorker(batchConfig) {
    return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const worker = new Worker(new URL('./LabBatchWorker.js', import.meta.url), { type: 'module' });
        activeWorker = worker;
        els.workerStatus.textContent = uiText('worker', language);
        worker.addEventListener('message', (event) => {
            const message = event.data || {};
            if (message.type === 'started') {
                logRun(`start ${message.totalRuns}`);
                updateProgress(0, message.totalRuns);
            }
            if (message.type === 'progress') {
                updateProgress(message.index, message.totalRuns, message.run);
            }
            if (message.type === 'runComplete') {
                updateProgress(message.index + 1, batchConfig.runMatrix.length);
                logRun(`finish ${message.runId}`);
            }
            if (message.type === 'runFailed') {
                logRun(`failed ${message.runId}: ${message.failed.error}`, 'bad');
            }
            if (message.type === 'paused') setRunButtons('paused');
            if (message.type === 'resumed') setRunButtons('running');
            if (message.type === 'cancelled') logRun('cancelled');
            if (message.type === 'complete') {
                worker.terminate();
                activeWorker = null;
                const batchResult = assembleBatchResult(batchConfig, message.runResults, message.failedRuns, message.cancelled, startedAt);
                resolve(batchResult);
            }
        });
        worker.addEventListener('error', (error) => {
            worker.terminate();
            activeWorker = null;
            reject(error);
        });
        worker.postMessage({ type: 'start', batchConfig });
    });
}

async function runWithFallback(batchConfig) {
    const startedAt = Date.now();
    els.workerStatus.textContent = uiText('fallback', language);
    const output = await runBatchSequential(batchConfig, {
        onStart({ totalRuns, controller }) {
            fallbackController = controller;
            logRun(`start ${totalRuns}`);
            updateProgress(0, totalRuns);
        },
        onProgress({ index, totalRuns, run }) {
            updateProgress(index, totalRuns, run);
        },
        onRunComplete({ index, run }) {
            updateProgress(index + 1, batchConfig.runMatrix.length);
            logRun(`finish ${run.runId}`);
        },
        onRunFailed({ run, error }) {
            logRun(`failed ${run.runId}: ${error?.message || error}`, 'bad');
        }
    });
    fallbackController = null;
    return assembleBatchResult(batchConfig, output.results, output.failedRuns, output.cancelled, startedAt);
}

async function startBatch() {
    const batchConfig = currentBatchConfig || generateMatrix();
    if (!batchConfig) return;
    currentBatchResult = null;
    els.runLog.replaceChildren();
    setRunButtons('running');
    try {
        currentBatchResult = window.Worker
            ? await runWithWorker(batchConfig)
            : await runWithFallback(batchConfig);
        els.matrixStatus.className = 'status-pill ok';
        els.matrixStatus.textContent = uiText('statusComplete', language);
        logRun(`finish batch ${currentBatchResult.runResults.length}/${batchConfig.runMatrix.length}`);
    } catch (error) {
        logRun(`worker failed: ${error?.message || error}; using fallback`, 'bad');
        currentBatchResult = await runWithFallback(batchConfig);
    } finally {
        setRunButtons('idle');
        renderComparison();
        updateExportPreview();
    }
}

function pauseBatch() {
    activeWorker?.postMessage({ type: 'pause' });
    setRunButtons('paused');
}

function resumeBatch() {
    activeWorker?.postMessage({ type: 'resume' });
    setRunButtons('running');
}

function cancelBatch() {
    activeWorker?.postMessage({ type: 'cancel' });
    fallbackController?.cancel();
    setRunButtons('idle');
}

function numericValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === 'object') return Object.keys(value).length;
    const number = Number(value);
    return Number.isFinite(number) ? number : String(value ?? '').length;
}

function formatChartNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '-';
    if (Math.abs(number) >= 1000 || (Math.abs(number) > 0 && Math.abs(number) < 0.001)) return number.toExponential(1);
    return Number(number.toFixed(3)).toString();
}

function svgElement(name, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    return element;
}

function addSvgText(svg, value, x, y, attributes = {}) {
    const textNode = svgElement('text', { x, y, ...attributes });
    textNode.textContent = value;
    svg.append(textNode);
}

function renderMiniChart(values, { kind = 'line', observableId = 'observable' } = {}) {
    const numeric = values.map(numericValue).slice(0, 40);
    const isZh = language === 'zh';
    const distributionLabel = isZh ? '分布' : 'distribution';
    const runSequenceLabel = isZh ? '定種子執行序列' : 'seeded run sequence';
    const figure = document.createElement('figure');
    figure.className = 'paper-svg-chart';
    const svg = svgElement('svg', {
        viewBox: '0 0 640 320',
        role: 'img',
        'aria-label': `${observableId} ${kind === 'histogram' ? distributionLabel : runSequenceLabel}`
    });
    svg.append(svgElement('rect', { x: 0, y: 0, width: 640, height: 320, fill: '#ffffff' }));
    const margin = { left: 76, right: 24, top: 52, bottom: 62 };
    const plotWidth = 640 - margin.left - margin.right;
    const plotHeight = 320 - margin.top - margin.bottom;
    const minValue = numeric.length ? Math.min(0, ...numeric) : 0;
    const maxValue = numeric.length ? Math.max(1, ...numeric) : 1;
    const range = Math.max(1e-9, maxValue - minValue);
    for (let tick = 0; tick <= 4; tick++) {
        const y = margin.top + (plotHeight * tick) / 4;
        svg.append(svgElement('line', {
            x1: margin.left,
            y1: y,
            x2: margin.left + plotWidth,
            y2: y,
            stroke: '#d9e1de',
            'stroke-width': 1
        }));
        addSvgText(svg, formatChartNumber(maxValue - (range * tick) / 4), margin.left - 10, y + 4, {
            fill: '#435851',
            'font-size': 11,
            'text-anchor': 'end'
        });
    }
    svg.append(svgElement('line', {
        x1: margin.left,
        y1: margin.top,
        x2: margin.left,
        y2: margin.top + plotHeight,
        stroke: '#263b34',
        'stroke-width': 2
    }));
    svg.append(svgElement('line', {
        x1: margin.left,
        y1: margin.top + plotHeight,
        x2: margin.left + plotWidth,
        y2: margin.top + plotHeight,
        stroke: '#263b34',
        'stroke-width': 2
    }));
    addSvgText(svg, kind === 'histogram'
        ? `${observableId} ${distributionLabel}`
        : `${observableId} / ${runSequenceLabel}`, 320, 24, {
        fill: '#14201c',
        'font-size': 16,
        'font-weight': 750,
        'text-anchor': 'middle'
    });
    addSvgText(svg, kind === 'histogram'
        ? (isZh ? '觀測量分箱' : 'Observable bin')
        : (isZh ? '執行索引' : 'Run index'), margin.left + plotWidth / 2, 302, {
        fill: '#263b34',
        'font-size': 13,
        'font-weight': 700,
        'text-anchor': 'middle'
    });
    const yLabel = svgElement('text', {
        x: 18,
        y: margin.top + plotHeight / 2,
        fill: '#263b34',
        'font-size': 13,
        'font-weight': 700,
        'text-anchor': 'middle',
        transform: `rotate(-90 18 ${margin.top + plotHeight / 2})`
    });
    yLabel.textContent = kind === 'histogram'
        ? (isZh ? '頻數' : 'Frequency')
        : (isZh ? '觀測量數值' : 'Observable value');
    svg.append(yLabel);
    if (kind === 'histogram') {
        const binCount = Math.min(10, Math.max(4, Math.ceil(Math.sqrt(numeric.length || 1))));
        const counts = Array(binCount).fill(0);
        for (const value of numeric) {
            const index = Math.min(binCount - 1, Math.floor(((value - minValue) / range) * binCount));
            counts[index]++;
        }
        const maxCount = Math.max(1, ...counts);
        counts.forEach((count, index) => {
            const width = plotWidth / binCount;
            const height = (count / maxCount) * plotHeight;
            svg.append(svgElement('rect', {
                x: margin.left + index * width + 2,
                y: margin.top + plotHeight - height,
                width: Math.max(1, width - 4),
                height,
                fill: '#70b7d5',
                stroke: '#245d77'
            }));
        });
    } else if (numeric.length) {
        const points = numeric.map((value, index) => {
            const x = margin.left + (numeric.length === 1 ? plotWidth / 2 : (index / (numeric.length - 1)) * plotWidth);
            const y = margin.top + plotHeight - ((value - minValue) / range) * plotHeight;
            return [x, y];
        });
        svg.append(svgElement('polyline', {
            points: points.map(([x, y]) => `${x},${y}`).join(' '),
            fill: 'none',
            stroke: '#287fa6',
            'stroke-width': 3
        }));
        for (const [x, y] of points) {
            svg.append(svgElement('circle', { cx: x, cy: y, r: 3.5, fill: '#ffffff', stroke: '#287fa6', 'stroke-width': 2 }));
        }
    }
    figure.append(svg);
    const caption = document.createElement('figcaption');
    caption.textContent = kind === 'histogram'
        ? (isZh
            ? `${observableId}：已完成定種子執行的頻數分布。`
            : `${observableId}: frequency across completed seeded runs.`)
        : (isZh
            ? `${observableId}：依完成順序排列的執行；連線僅供描述，不代表連續時間插值。`
            : `${observableId}: ordered completed runs; connect-the-points line is descriptive, not a continuous-time interpolation.`);
    figure.append(caption);
    return figure;
}

function renderComparison() {
    els.comparisonDashboard.replaceChildren();
    if (!currentBatchResult?.runResults?.length) {
        const empty = document.createElement('p');
        empty.className = 'help-text';
        empty.textContent = uiText('comparisonEmpty', language);
        els.comparisonDashboard.append(empty);
        return;
    }
    const results = currentBatchResult.runResults;
    const firstObservable = currentBatchResult.batchConfig.selectedObservableIds[0];
    const values = results.map((result) => result.summary.observableSummary[firstObservable]);
    const grid = document.createElement('div');
    grid.className = 'comparison-grid';
    const cards = [
        ['summary', `${results.length} / ${currentBatchResult.failedRuns.length} ${uiText('completeFailed', language)}`],
        ['lineChart', uiText('lineChartDesc', language)],
        ['histogram', uiText('histogramDesc', language)],
        ['scatter', uiText('scatterDesc', language)],
        ['heatmapTable', uiText('heatmapTableDesc', language)],
        ['finalStateGrid', uiText('finalStateGridDesc', language)]
    ];
    for (const [key, body] of cards) {
        const card = document.createElement('article');
        card.className = 'viz-card';
        card.dataset.visualization = key;
        card.innerHTML = `<h3>${uiText(key, language)}</h3><p>${body}</p>`;
        if (key === 'lineChart') card.append(renderMiniChart(values, { kind: 'line', observableId: firstObservable }));
        if (key === 'histogram') card.append(renderMiniChart(values, { kind: 'histogram', observableId: firstObservable }));
        grid.append(card);
    }
    els.comparisonDashboard.append(grid);

    const table = document.createElement('div');
    table.className = 'table-wrap';
    table.innerHTML = `
        <table>
            <thead><tr><th>runId</th><th>topology</th><th>seed</th><th>${firstObservable}</th><th>resultHash</th></tr></thead>
            <tbody>${results.slice(0, 40).map((result) => `
                <tr>
                    <td>${result.metadata.runId}</td>
                    <td>${result.config.topologyId}</td>
                    <td>${result.config.seed}</td>
                    <td>${escapeCsv(result.summary.observableSummary[firstObservable])}</td>
                    <td>${result.resultHash}</td>
                </tr>
            `).join('')}</tbody>
        </table>
    `;
    els.comparisonDashboard.append(table);
}

function datasetEnvelope() {
    if (!currentBatchConfig) return null;
    const runResults = currentBatchResult?.runResults || [];
    const failedRuns = currentBatchResult?.failedRuns || [];
    const manifest = currentBatchResult?.exportManifest || buildExportManifest(currentBatchConfig);
    return {
        manifest,
        batchConfig: currentBatchConfig,
        experimentConfigs: currentBatchConfig.runMatrix.map((run) => run.experimentConfig),
        results: runResults,
        failedRuns,
        topologyAdjacency: currentBatchConfig.selectedTopologyIds.map((id) => {
            const topology = topologyById(id);
            return {
                id,
                dimension: topology.dimension,
                topologyType: topology.topologyType,
                latticeTypes: topology.latticeTypes,
                boundaryCondition: topology.boundaryCondition,
                topologyHash: topology.hash,
                adjacency: {
                    note: uiText('adjacencyExportNote', language)
                }
            };
        }),
        reproducibilityNotes: manifest.reproducibilityNotes,
        validationWarnings: manifest.validationWarnings
    };
}

function summaryRows() {
    const results = currentBatchResult?.runResults || [];
    const observableIds = currentBatchConfig?.selectedObservableIds || [];
    return results.map((result) => {
        const row = {
            runId: result.metadata.runId,
            model: result.config.modelId,
            topology: result.config.topologyId,
            seed: result.config.seed,
            steps: result.config.steps,
            resultHash: result.resultHash
        };
        for (const observableId of observableIds) row[observableId] = result.summary.observableSummary[observableId];
        return row;
    });
}

function timeSeriesRows() {
    const rows = [];
    for (const result of currentBatchResult?.runResults || []) {
        for (const [observableId, samples] of Object.entries(result.observableTimeSeries || {})) {
            for (const sample of samples) {
                rows.push({
                    runId: result.metadata.runId,
                    topology: result.config.topologyId,
                    seed: result.config.seed,
                    observableId,
                    step: sample.step,
                    time: sample.time,
                    value: sample.value,
                    sampleHash: sample.sampleHash
                });
            }
        }
    }
    return rows;
}

function eventRows() {
    const rows = [];
    for (const result of currentBatchResult?.runResults || []) {
        for (const event of result.eventLog || []) {
            rows.push({
                runId: result.metadata.runId,
                topology: result.config.topologyId,
                step: event.step,
                type: event.type,
                source: event.source,
                eventHash: event.eventHash,
                payload: event.payload
            });
        }
    }
    return rows;
}

function updateExportPreview() {
    const envelope = datasetEnvelope();
    storeValidationCandidate('batch-dataset', envelope);
    els.exportPreview.value = envelope
        ? JSON.stringify(envelope, null, 2).slice(0, 20000)
        : uiText('noIncomplete', language);
}

function exportJson() {
    const envelope = datasetEnvelope();
    if (!envelope) return;
    downloadText('topoboard-labs-dataset.json', JSON.stringify(envelope, null, 2), 'application/json');
}

function exportCsv() {
    if (!currentBatchConfig) return;
    const observableColumns = ['runId', 'topology', 'seed', 'observableId', 'step', 'time', 'value', 'sampleHash'];
    const summaryColumns = ['runId', 'model', 'topology', 'seed', 'steps', 'resultHash', ...currentBatchConfig.selectedObservableIds];
    const eventColumns = ['runId', 'topology', 'step', 'type', 'source', 'eventHash', 'payload'];
    downloadText('observable-time-series.csv', toCsv(timeSeriesRows(), observableColumns), 'text/csv');
    downloadText('summary.csv', toCsv(summaryRows(), summaryColumns), 'text/csv');
    downloadText('event-logs.csv', toCsv(eventRows(), eventColumns), 'text/csv');
}

function exportManifest() {
    const envelope = datasetEnvelope();
    if (!envelope) return;
    downloadText('manifest.json', JSON.stringify(envelope.manifest, null, 2), 'application/json');
}

async function copyConfig() {
    const envelope = datasetEnvelope();
    if (!envelope) return;
    await navigator.clipboard?.writeText(JSON.stringify(envelope.batchConfig, null, 2));
    els.matrixStatus.className = 'status-pill ok';
    els.matrixStatus.textContent = uiText('batchConfigCopied', language);
}

function bindEvents() {
    els.languageSelect.addEventListener('change', () => setLanguage(els.languageSelect.value));
    installLabLanguageMenu({ select: els.languageSelect, setLanguage });
    els.researchBatchMode.addEventListener('click', () => setBuilderMode('research'));
    els.compareTopologiesMode.addEventListener('click', () => setBuilderMode('compare'));
    els.mobileCompareButton.addEventListener('click', () => {
        setBuilderMode('compare');
        document.querySelector('#modelTitle')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    els.mobileMatrixButton.addEventListener('click', () => {
        generateMatrix();
        document.querySelector('#reviewTitle')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    els.mobileRunButton.addEventListener('click', async () => {
        generateMatrix();
        document.querySelector('#runTitle')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        await startBatch();
    });
    els.modelSelect.addEventListener('change', renderAll);
    els.generateMatrixButton.addEventListener('click', generateMatrix);
    els.startBatchButton.addEventListener('click', startBatch);
    els.pauseBatchButton.addEventListener('click', pauseBatch);
    els.resumeBatchButton.addEventListener('click', resumeBatch);
    els.cancelBatchButton.addEventListener('click', cancelBatch);
    els.exportConfigButton.addEventListener('click', exportJson);
    els.exportCsvButton.addEventListener('click', exportCsv);
    els.exportManifestButton.addEventListener('click', exportManifest);
    els.copyConfigButton.addEventListener('click', copyConfig);
}

function initializeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const model = params.get('model');
    if (model) els.modelSelect.value = modelById(model).id;
    if (params.get('mode') === 'compare-topologies') builderMode = 'compare';
}

installPanelCollapsers();
bindEvents();
setLanguage(language);
initializeFromUrl();
setBuilderMode(builderMode);
renderMatrixPreview(null);
updateProgress(0, 0);
