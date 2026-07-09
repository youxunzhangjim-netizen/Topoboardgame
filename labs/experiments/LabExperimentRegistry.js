export const LAB_APP_VERSION = '0.1.0';
export const LAB_SCHEMA_VERSION = '1.0.0';
export const LAB_HASH_VERSION = 'topoboard-canonical-v1';
export const LAB_ENGINE_VERSION = 'labs-research-engine-0.1.0';
export const LAB_TOPOLOGY_REGISTRY_VERSION = 'topology-registry-0.1.0';
export const LAB_OBSERVABLE_REGISTRY_VERSION = 'observable-registry-0.1.0';
export const LAB_RULE_REGISTRY_VERSION = 'rule-registry-0.1.0';

export const LAB_SECTIONS = [
    'Spin Systems',
    'Statistical Dynamics',
    'Quantum Information',
    'Topological Matter',
    'Field Theory',
    'Mathematical Structures'
];

export const BUILDER_I18N = {
    en: {
        home: 'Labs Home',
        pageTitle: 'Experiment Builder',
        subtitle: 'Build parameter sweeps and reproducible batch experiments for discrete topological dynamics.',
        modeResearch: 'Research Batch',
        modeCompare: 'Compare Topologies',
        selectModel: 'Model',
        selectTopologies: 'Select Topologies',
        initialConditions: 'State Space / Initial Conditions',
        parameters: 'Local Rule Parameters',
        seedsSteps: 'Seeds and Step Count',
        observables: 'Observables',
        review: 'Review Experiment Matrix',
        runBatch: 'Run Batch',
        compareResults: 'Compare Results',
        exportDataset: 'Export Dataset',
        validation: 'Validation',
        family: 'Family',
        stateSpace: 'State Space',
        warnings: 'Warnings',
        compatible: 'Compatible',
        incompatible: 'Incompatible',
        topologyHash: 'Topology Hash',
        fixed: 'Fixed',
        list: 'List',
        range: 'Range',
        distribution: 'Distribution',
        seedMode: 'Seed Mode',
        steps: 'Steps',
        repeats: 'Repeats',
        generateMatrix: 'Generate Matrix',
        start: 'Start',
        pause: 'Pause',
        resume: 'Resume',
        cancel: 'Cancel',
        exportJson: 'Export JSON',
        exportCsv: 'Export CSV',
        exportManifest: 'Export Manifest',
        copyConfig: 'Copy Config',
        runCount: 'Total Runs',
        runtime: 'Runtime Category',
        memory: 'Estimated Memory',
        currentRun: 'Current Run',
        progress: 'Progress',
        statusReady: 'Configure the experiment matrix before running.',
        statusComplete: 'Batch complete.',
        noIncomplete: 'Incomplete configs are not exported.',
        compareHelp: 'Choose one model, one initial condition, at least two topologies, one observable, and the same seed across all topologies.',
        language: 'Language',
        english: 'English',
        chinese: '中文',
        worker: 'Worker',
        fallback: 'Main thread fallback',
        definition: 'Definition',
        cost: 'Cost',
        limitations: 'Limitations',
        snapshot: 'Snapshot',
        summary: 'Summary',
        lineChart: 'Line chart',
        histogram: 'Histogram',
        scatter: 'Scatter',
        heatmapTable: 'Heatmap-ready table',
        finalStateGrid: 'Final-state grid',
        exportNotes: 'Exports include app version, model version, hashes, timestamps, seeds, warnings, configs, results, event logs, topology adjacency, and reproducibility notes.',
        mobilePlayerTitle: 'Player Quick Compare',
        mobilePlayerText: 'On phones, start with Compare Topologies: choose a model, two boards, one observable, then run the same seed.',
        mobileCompareButton: 'Use Compare',
        mobileMatrixButton: 'Review Matrix',
        mobileRunButton: 'Run',
        formalModel: 'Formal model',
        formalExpression: 'Expression',
        formalExperimentText: 'A batch experiment fixes the discrete topology, state space, local rule, initial condition, seed plan, and observable set before running the estimator.',
        phaseDiagramGenerator: 'Phase Diagram Generator',
        topologyComparison: 'Topology Comparison',
        validationSuite: 'Validation & Reproducibility',
        publicationExport: 'Publication & Dataset Export',
        collapse: 'Collapse',
        expand: 'Expand',
        seedValueLabel: 'Seed / List / Start',
        seedEndLabel: 'End / Count',
        stepValues: 'Step values',
        batchName: 'Batch name',
        runId: 'runId',
        model: 'model',
        topology: 'topology',
        initialCondition: 'initialCondition',
        parameterValues: 'parameters',
        seed: 'seed',
        observableCount: 'observables',
        configurations: 'Configurations',
        seeds: 'Seeds',
        topologies: 'Topologies',
        modelVersion: 'Model version',
        compatibleTopologies: 'Compatible topologies',
        observableRegistry: 'Observable registry',
        observableRegistryValue: 'observables',
        notePrefix: 'Note',
        batchAdapterNotStandardized: 'Batch adapter is not standardized for this topology.',
        compareNeedsTwoTopologies: 'Compare Topologies needs at least two topologies.',
        compareNeedsOneObservable: 'Compare Topologies needs exactly one observable.',
        storedInConfig: 'Stored in every LabExperimentConfig.',
        parameter: 'Parameter',
        type: 'Type',
        valueList: 'Value / List',
        rangeStartEnd: 'Range start,end',
        stepsCount: 'Steps / Count',
        finiteGraphLimitation: 'Finite discrete graph estimator.',
        comparisonEmpty: 'Run a batch to compare summaries, curves, tables, and final snapshots.',
        completeFailed: 'complete / failed',
        lineChartDesc: 'Final observable value per run.',
        histogramDesc: 'Value distribution for seed variability.',
        scatterDesc: 'Parameter/topology scatter-ready data.',
        heatmapTableDesc: 'Topology by parameter table for heatmaps.',
        finalStateGridDesc: 'Final snapshot summaries are stored in result snapshots.',
        adjacencyExportNote: 'Adjacency is produced by the existing model adapter at run time; this export preserves reusable topology metadata and hashes.',
        batchConfigCopied: 'Batch config copied.',
        batchCancelled: 'Batch was cancelled before all queued runs finished.',
        workerFailedFallback: 'Worker failed; using fallback.',
        pending: 'pending'
    },
    zh: {
        home: 'Labs 首頁',
        pageTitle: '實驗建構器',
        subtitle: '建立離散拓撲動力學的參數掃描與可重現批次實驗。',
        modeResearch: '研究批次',
        modeCompare: '比較拓撲',
        selectModel: '模型',
        selectTopologies: '選擇拓撲',
        initialConditions: '狀態空間 / 初始條件',
        parameters: '局部規則參數',
        seedsSteps: '種子與步數',
        observables: '觀測量',
        review: '檢查實驗矩陣',
        runBatch: '執行批次',
        compareResults: '比較結果',
        exportDataset: '匯出資料集',
        validation: '驗證等級',
        family: '系列',
        stateSpace: '狀態空間',
        warnings: '警告',
        compatible: '可用',
        incompatible: '不相容',
        topologyHash: '拓撲雜湊',
        fixed: '固定值',
        list: '列表',
        range: '範圍',
        distribution: '分布',
        seedMode: '種子模式',
        steps: '步數',
        repeats: '重複次數',
        generateMatrix: '產生矩陣',
        start: '開始',
        pause: '暫停',
        resume: '繼續',
        cancel: '取消',
        exportJson: '匯出 JSON',
        exportCsv: '匯出 CSV',
        exportManifest: '匯出 Manifest',
        copyConfig: '複製設定',
        runCount: '總執行數',
        runtime: '執行量級',
        memory: '估計記憶體',
        currentRun: '目前執行',
        progress: '進度',
        statusReady: '先設定實驗矩陣，再開始執行。',
        statusComplete: '批次完成。',
        noIncomplete: '不會匯出不完整設定。',
        compareHelp: '選一個模型、一個初始條件、至少兩個拓撲、一個觀測量，並用同一個種子比較所有拓撲。',
        language: '語言',
        english: 'English',
        chinese: '中文',
        worker: 'Worker',
        fallback: '主執行緒備援',
        definition: '定義',
        cost: '成本',
        limitations: '限制',
        snapshot: '快照',
        summary: '摘要',
        lineChart: '折線圖',
        histogram: '直方圖',
        scatter: '散點圖',
        heatmapTable: 'Heatmap 表格',
        finalStateGrid: '終態格點',
        exportNotes: '匯出資料包含 app 版本、模型版本、雜湊、時間、種子、警告、設定、結果、事件紀錄、拓撲鄰接與可重現說明。',
        mobilePlayerTitle: '手機玩家快速比較',
        mobilePlayerText: '手機上先用「比較拓撲」：選模型、兩個 board、一個觀測量，再用同一個 seed 執行。',
        mobileCompareButton: '使用比較',
        mobileMatrixButton: '檢查矩陣',
        mobileRunButton: '執行',
        formalModel: '\u5f62\u5f0f\u6a21\u578b',
        formalExpression: '\u8868\u793a\u5f0f',
        formalExperimentText: '\u6279\u6b21\u5be6\u9a57\u5728\u57f7\u884c\u4f30\u8a08\u5668\u4e4b\u524d\uff0c\u5148\u56fa\u5b9a\u96e2\u6563\u62d3\u64b2\u3001\u72c0\u614b\u7a7a\u9593\u3001\u5c40\u90e8\u898f\u5247\u3001\u521d\u59cb\u689d\u4ef6\u3001\u7a2e\u5b50\u898f\u5283\u8207\u89c0\u6e2c\u91cf\u96c6\u5408\u3002',
        phaseDiagramGenerator: '相圖產生器',
        topologyComparison: '拓撲比較',
        validationSuite: '驗證與可重現性',
        publicationExport: '出版與資料集匯出',
        collapse: '收合',
        expand: '展開',
        seedValueLabel: '種子 / 列表 / 起點',
        seedEndLabel: '終點 / 數量',
        stepValues: '步數值',
        batchName: '批次名稱',
        runId: 'runId',
        model: '模型',
        topology: '拓撲',
        initialCondition: '初始條件',
        parameterValues: '參數',
        seed: 'seed',
        observableCount: '觀測量數',
        configurations: '設定組合',
        seeds: '種子數',
        topologies: '拓撲數',
        modelVersion: '模型版本',
        compatibleTopologies: '相容拓撲',
        observableRegistry: '觀測量登錄',
        observableRegistryValue: '個觀測量',
        notePrefix: '注意',
        batchAdapterNotStandardized: '此模型目前未標準化此拓撲的批次 adapter。',
        compareNeedsTwoTopologies: 'Compare Topologies 需要至少兩個拓撲。',
        compareNeedsOneObservable: 'Compare Topologies 只能選一個觀測量。',
        storedInConfig: '會寫入每個 LabExperimentConfig。',
        parameter: '參數',
        type: '類型',
        valueList: '數值 / 列表',
        rangeStartEnd: '範圍起點,終點',
        stepsCount: '步階 / 數量',
        finiteGraphLimitation: '有限離散圖估計。',
        comparisonEmpty: '執行批次後會顯示比較摘要、曲線、表格與終態快照。',
        completeFailed: '完成 / 失敗',
        lineChartDesc: '每個 run 的最後觀測值折線近似。',
        histogramDesc: '數值分布，可用於 seed variability。',
        scatterDesc: '參數 / 拓撲對觀測量的散點資料。',
        heatmapTableDesc: '拓撲與參數交叉表，可匯入 heatmap。',
        finalStateGridDesc: '終態快照摘要保存在 result snapshots。',
        adjacencyExportNote: '鄰接資料由既有模型 adapter 在執行時產生；此匯出保留可重用拓撲 metadata 與 hashes。',
        batchConfigCopied: '已複製 batch config。',
        batchCancelled: '批次在所有佇列 run 完成前已取消。',
        workerFailedFallback: 'Worker 失敗，改用主執行緒備援。',
        pending: '等待中'
    }
};

export function getLanguage() {
    const query = new URLSearchParams(window.location.search).get('lang');
    const saved = localStorage.getItem('topological-boardgame:language')
        || localStorage.getItem('topoboardgame-language')
        || localStorage.getItem('topoboard-labs-language');
    const language = query || saved || document.documentElement.lang || navigator.language || 'en';
    return String(language).toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function text(value, language = getLanguage()) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value[language] || value.en || Object.values(value)[0] || '';
    }
    return String(value ?? '');
}

export function uiText(key, language = getLanguage()) {
    return BUILDER_I18N[language]?.[key] || BUILDER_I18N.en[key] || key;
}

export function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    return `{${Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
        .join(',')}}`;
}

export function labHash(value, prefix = 'lab') {
    const textValue = typeof value === 'string' ? value : stableStringify(value);
    let hash = 0x811c9dc5;
    for (let index = 0; index < textValue.length; index += 1) {
        hash ^= textValue.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return `${prefix}:${hash.toString(16).padStart(8, '0')}`;
}

export function platformInfo() {
    const navigatorRef = typeof navigator === 'undefined' ? null : navigator;
    const timezone = typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : undefined;
    return {
        userAgent: navigatorRef?.userAgent || 'unknown',
        language: navigatorRef?.language || 'unknown',
        timezone: timezone || 'unknown',
        hardwareConcurrency: navigatorRef?.hardwareConcurrency || 0,
        platform: navigatorRef?.platform || 'unknown',
        rendererRelevant: false
    };
}

export function buildBasicReproducibilityMetadata({
    schemaName = 'TopoboardLabsObject',
    modelId = 'unknown',
    modelVersion = '',
    rngAlgorithm = 'mulberry32',
    rngSeed = null,
    seedPlan = null,
    configHash = '',
    stateHashInitial = '',
    stateHashFinal = '',
    eventLogHash = '',
    resultHash = '',
    exportManifestHash = '',
    deterministicReplaySupported = true,
    knownNonDeterministicComponents = [],
    warnings = [],
    createdAt = new Date().toISOString()
} = {}) {
    const missingWarnings = [];
    if (!rngSeed && !seedPlan) missingWarnings.push('Missing stored seed or seed plan.');
    if (!modelVersion) missingWarnings.push('Missing model version; using registry app version fallback.');
    if (!configHash) missingWarnings.push('Missing config hash.');
    return {
        schemaName,
        schemaVersion: LAB_SCHEMA_VERSION,
        appVersion: LAB_APP_VERSION,
        modelVersion: modelVersion || `${modelId}@${LAB_APP_VERSION}`,
        engineVersion: LAB_ENGINE_VERSION,
        topologyRegistryVersion: LAB_TOPOLOGY_REGISTRY_VERSION,
        observableRegistryVersion: LAB_OBSERVABLE_REGISTRY_VERSION,
        ruleRegistryVersion: LAB_RULE_REGISTRY_VERSION,
        rngAlgorithm,
        rngSeed,
        seedPlan,
        platformInfo: platformInfo(),
        createdAt,
        configHash,
        stateHashInitial: stateHashInitial || undefined,
        stateHashFinal: stateHashFinal || undefined,
        eventLogHash: eventLogHash || undefined,
        resultHash: resultHash || undefined,
        exportManifestHash: exportManifestHash || undefined,
        deterministicReplaySupported,
        knownNonDeterministicComponents,
        warnings: [...missingWarnings, ...warnings]
    };
}

export const TOPOLOGY_REGISTRY = [
    {
        id: 'flat',
        name: { en: 'Plane', zh: '平面' },
        dimension: 2,
        topologyType: 'open',
        latticeTypes: ['square', 'triangular', 'honeycomb'],
        boundaryCondition: 'open',
        width: 12,
        height: 12
    },
    {
        id: 'cylinder',
        name: { en: 'Cylinder', zh: '圓柱' },
        dimension: 2,
        topologyType: 'cylinder',
        latticeTypes: ['square', 'triangular', 'honeycomb'],
        boundaryCondition: 'periodic/open',
        width: 12,
        height: 12
    },
    {
        id: 'torus',
        name: { en: 'Torus', zh: '環面' },
        dimension: 2,
        topologyType: 'torus',
        latticeTypes: ['square', 'triangular', 'honeycomb'],
        boundaryCondition: 'periodic',
        width: 12,
        height: 12
    },
    {
        id: 'mobius',
        name: { en: 'Mobius Strip', zh: 'Mobius 帶' },
        dimension: 2,
        topologyType: 'mobius',
        latticeTypes: ['square', 'triangular', 'honeycomb'],
        boundaryCondition: 'twisted',
        width: 12,
        height: 12
    },
    {
        id: 'klein_bottle',
        name: { en: 'Klein Bottle', zh: 'Klein 瓶' },
        dimension: 2,
        topologyType: 'klein_bottle',
        latticeTypes: ['square', 'triangular', 'honeycomb'],
        boundaryCondition: 'twisted/periodic',
        width: 12,
        height: 12
    },
    {
        id: 'rp2',
        name: { en: 'RP2', zh: 'RP2' },
        dimension: 2,
        topologyType: 'rp2',
        latticeTypes: ['square', 'triangular', 'honeycomb'],
        boundaryCondition: 'identified/twisted',
        width: 12,
        height: 12
    },
    {
        id: 'sphere_latitude',
        name: { en: 'Sphere', zh: '球面' },
        dimension: 2,
        topologyType: 'sphere',
        latticeTypes: ['square', 'triangular'],
        boundaryCondition: 'closed_manifold',
        width: 12,
        height: 12
    },
    {
        id: 'random_boundary',
        name: { en: 'Random Boundary Graph', zh: '隨機邊界圖' },
        dimension: 2,
        topologyType: 'random_boundary',
        latticeTypes: ['square'],
        boundaryCondition: 'random_boundary',
        width: 12,
        height: 12
    },
    {
        id: 'r3',
        name: { en: '3D Grid', zh: '3D 格點' },
        dimension: 3,
        topologyType: 'open',
        latticeTypes: ['square'],
        boundaryCondition: 'open',
        width: 8,
        height: 8,
        depth: 5
    },
    {
        id: 'flat_4d_grid',
        name: { en: '4D Grid', zh: '4D 格點' },
        dimension: 4,
        topologyType: 'higher_dimensional',
        latticeTypes: ['square'],
        boundaryCondition: 'open',
        width: 5,
        height: 5,
        depth: 4,
        w: 3
    }
].map((topology) => ({
    ...topology,
    hash: labHash({
        id: topology.id,
        dimension: topology.dimension,
        topologyType: topology.topologyType,
        boundaryCondition: topology.boundaryCondition,
        latticeTypes: topology.latticeTypes
    }, 'topology')
}));

function observable(id, name, category, definition, physicalMeaning, options = {}) {
    const normalizedId = String(id).toLowerCase();
    const inferredUnits = normalizedId.includes('fraction') || normalizedId.includes('probability')
        ? 'fraction'
        : normalizedId.includes('length')
            ? 'graph edges / steps'
            : normalizedId.includes('count') || normalizedId.includes('violations') || normalizedId.includes('monopole')
                ? 'count'
                : category === 'energy'
                    ? 'model energy'
                    : category === 'logical' || category === 'fusion'
                        ? 'symbolic sector'
                        : category === 'transport'
                            ? 'graph steps / events'
                            : 'dimensionless';
    return {
        id,
        name,
        category,
        definition,
        physicalMeaning,
        units: options.units || inferredUnits,
        estimatorType: options.estimatorType || 'graph_estimator',
        validationLevel: options.validationLevel || 'estimator',
        computationalCost: options.computationalCost || 'low',
        limitations: options.limitations || ['Discrete finite-graph estimator.'],
        key: options.key || id.split('.').at(-1)
    };
}

const commonTopologies2D = ['flat', 'cylinder', 'torus', 'mobius', 'klein_bottle', 'rp2', 'sphere_latitude', 'random_boundary'];
const commonTopologiesND = [...commonTopologies2D, 'r3', 'flat_4d_grid'];

export const MODEL_REGISTRY = [
    {
        id: 'ising_domain_game',
        name: { en: 'Spin & Phase Domain Experiment', zh: 'Spin / Phase 區域實驗' },
        family: 'Spin Systems',
        section: 'Spin Systems',
        validationLevel: 'estimator',
        stateSpace: { en: 'Local states are empty, spin up s=+1, or spin down s=-1.', zh: '局部狀態為空、spin up s=+1、spin down s=-1。' },
        description: { en: 'Ising-style domains and domain walls on topology-aware graphs.', zh: '在拓撲圖上研究 Ising 式區域與 domain wall。' },
        compatibleTopologies: commonTopologiesND,
        initialConditions: [
            ['random_spins', 'Random spins', '隨機 spin'],
            ['stripe_seed', 'Stripe', '條紋'],
            ['droplet_seed', 'Droplet', '液滴'],
            ['checkerboard', 'Checkerboard', '棋盤'],
            ['domain_wall_seed', 'Domain wall seed', 'Domain wall 種子']
        ],
        parameters: [
            { id: 'temperature', label: 'Temperature T', defaultValue: 0, min: 0, max: 5, step: 0.1, units: 'T' },
            { id: 'couplingJ', label: 'Coupling J', defaultValue: 1, min: -3, max: 3, step: 0.1, units: 'J' },
            { id: 'fieldH', label: 'Field h', defaultValue: 0, min: -3, max: 3, step: 0.1, units: 'h' },
            { id: 'wallThickness', label: 'Wall Thickness', defaultValue: 1, min: 1, max: 8, step: 1 },
            { id: 'metropolis', label: 'Metropolis', defaultValue: false, kind: 'boolean' }
        ],
        observables: [
            observable('observable.ising.energy', 'Energy', 'energy', 'E=-J sum_<ij> s_i s_j - h sum_i s_i.', 'Local interaction energy.'),
            observable('observable.ising.magnetization', 'Magnetization', 'order_parameter', 'Mean spin over occupied sites.', 'Phase ordering signal.'),
            observable('observable.ising.domain-wall-length', 'Domain-wall length', 'geometry', 'Count of neighboring opposite-spin edges.', 'Interface size.'),
            observable('observable.ising.domain-count', 'Domain count', 'distribution', 'Connected spin-domain count.', 'Coarsening summary.')
        ],
        warnings: ['Metropolis results are discrete finite-graph estimates.']
    },
    {
        id: 'two_phase_competition_game',
        name: { en: 'Two-Phase Competition Experiment', zh: 'Two-Phase 競爭實驗' },
        family: 'Phase Competition',
        section: 'Spin Systems',
        validationLevel: 'estimator',
        stateSpace: { en: 'Empty substrate, phase A, and phase B.', zh: '空基底、phase A 與 phase B。' },
        description: { en: 'Two local phases nucleate, grow, and compete through interfaces.', zh: '兩種局部相位透過成核、成長與界面互相競爭。' },
        compatibleTopologies: commonTopologiesND,
        initialConditions: [
            ['phase_separated', 'Phase separated', '相分離'],
            ['random_droplets', 'Random droplets', '隨機液滴'],
            ['single_nucleus', 'Single nucleus', '單一成核'],
            ['two_nuclei', 'Two nuclei', '雙成核'],
            ['stripe_domains', 'Stripe domains', '條紋區域']
        ],
        parameters: [
            { id: 'interfaceCost', label: 'Interface Cost', defaultValue: 1, min: 0, max: 5, step: 0.1 },
            { id: 'biasA', label: 'Bias A', defaultValue: 0, min: -3, max: 3, step: 0.1 },
            { id: 'biasB', label: 'Bias B', defaultValue: 0, min: -3, max: 3, step: 0.1 },
            { id: 'noiseRate', label: 'Noise Rate', defaultValue: 0.02, min: 0, max: 0.2, step: 0.01 }
        ],
        observables: [
            observable('observable.twophase.energy', 'Energy', 'energy', 'Interface and phase-bias energy.', 'Phase competition objective.'),
            observable('observable.twophase.interface-length', 'Interface length', 'geometry', 'Count of unlike neighboring phase edges.', 'Boundary size.'),
            observable('observable.twophase.area-fraction-a', 'Area fraction A', 'order_parameter', 'Fraction occupied by phase A.', 'Winner tendency.'),
            observable('observable.twophase.domain-count', 'Domain count', 'distribution', 'Connected phase-domain count.', 'Coarsening state.')
        ],
        warnings: ['Finite statistical-dynamics estimator; benchmark scaling before quantitative percolation claims.']
    },
    {
        id: 'physical_cluster_go',
        name: { en: 'Physical Cluster Field', zh: 'Physical Cluster 場' },
        family: 'Cluster Growth',
        section: 'Statistical Dynamics',
        validationLevel: 'estimator',
        stateSpace: { en: 'Empty resource sites and two competing cluster labels A/B.', zh: '空資源點與兩種競爭 cluster 標籤 A/B。' },
        description: { en: 'Cluster growth, removal, percolation, and wrapping on graph topologies.', zh: '圖拓撲上的 cluster 成長、移除、percolation 與環繞。' },
        compatibleTopologies: commonTopologiesND,
        initialConditions: [
            ['sparse_seeds', 'Sparse seeds', '稀疏種子'],
            ['random_density', 'Random density', '隨機密度'],
            ['two_cluster_competition', 'Two-cluster competition', '雙 cluster 競爭'],
            ['interface_seed', 'Interface seed', '界面種子']
        ],
        parameters: [
            { id: 'clusterModel', label: 'Cluster Model', defaultValue: 'two_species_competition', kind: 'choice', choices: ['percolation', 'reaction_diffusion', 'two_species_competition', 'spin_domain_growth'] },
            { id: 'noiseRate', label: 'Diffusion Noise Rate', defaultValue: 0.02, min: 0, max: 0.2, step: 0.01 }
        ],
        observables: [
            observable('observable.cluster.largest-cluster', 'Largest cluster', 'distribution', 'Largest connected occupied component.', 'Growth dominance.'),
            observable('observable.cluster.percolation', 'Percolation probability', 'topology', 'Whether a cluster spans or wraps the graph.', 'Connectivity through topology.'),
            observable('observable.cluster.survival', 'Survival probability', 'diagnostic', 'Occupied mass relative to initial occupied mass.', 'Persistence estimate.'),
            observable('observable.cluster.wrapping', 'Wrapping clusters', 'topology', 'Number of topology-wrapping components.', 'Noncontractible connectivity.')
        ],
        warnings: ['Finite graph cluster estimator; benchmark lattice scaling before quantitative percolation claims.']
    },
    {
        id: 'physical_jump_particles',
        name: { en: 'Particle Hopping / Reaction System', zh: '粒子跳躍 / 反應系統' },
        family: 'Random Walk / Transport',
        section: 'Statistical Dynamics',
        validationLevel: 'toy',
        stateSpace: { en: 'Empty sites and two particle species or charge signs.', zh: '空格點與兩種粒子種類或電荷符號。' },
        description: { en: 'Local hopping, exchange scattering, recombination, and path parity.', zh: '局部 hop、exchange scattering、recombination 與路徑 parity。' },
        compatibleTopologies: commonTopologiesND,
        initialConditions: [['default_particles', 'Default particle pairs', '預設粒子對']],
        parameters: [
            { id: 'jumpParticleModel', label: 'Particle Model', defaultValue: 'charge_recombination', kind: 'choice', choices: ['charge_recombination', 'spin_exchange', 'anyon_worldline'] },
            { id: 'jumpParticleAction', label: 'Action Policy', defaultValue: 'auto', kind: 'choice', choices: ['auto', 'hop', 'jump', 'chain_jump', 'recombine'] }
        ],
        observables: [
            observable('observable.particles.count', 'Particle count', 'count', 'Number of remaining particles.', 'Reaction progress.'),
            observable('observable.particles.recombination', 'Recombination count', 'count', 'Number of recombination events.', 'Annihilation / recovery events.'),
            observable('observable.particles.exchange', 'Exchange events', 'transport', 'Number of exchange or scattering events.', 'Worldline complexity.'),
            observable('observable.particles.path-length', 'Average path length', 'transport', 'Mean recorded path length.', 'Transport range.')
        ],
        warnings: ['Toy transport model for topology comparison.']
    },
    {
        id: 'spin_ice_vertex_game',
        name: { en: 'Spin Ice Vertex Experiment', zh: 'Spin Ice Vertex 實驗' },
        family: 'Spin Ice',
        section: 'Spin Systems',
        validationLevel: 'estimator',
        stateSpace: { en: 'Edge arrows with vertex ice-rule constraints.', zh: '邊上的箭頭與 vertex ice-rule 約束。' },
        description: { en: 'Edge-arrow spin ice, monopoles, strings, and loop excitations.', zh: '邊箭頭 Spin Ice、monopole、string 與 loop 激發。' },
        compatibleTopologies: commonTopologies2D,
        initialConditions: [
            ['ice_rule_vacuum', 'Ice-rule vacuum', 'Ice-rule 真空'],
            ['random_arrows', 'Random arrows', '隨機箭頭'],
            ['monopole_pair', 'Monopole pair', 'Monopole 對'],
            ['loop_excitation', 'Loop excitation', 'Loop 激發']
        ],
        parameters: [
            { id: 'violationEnergy', label: 'Violation Energy', defaultValue: 1, min: 0, max: 5, step: 0.1 },
            { id: 'stringLength', label: 'String Length', defaultValue: 4, min: 1, max: 32, step: 1 }
        ],
        observables: [
            observable('observable.spinice.energy', 'Energy', 'energy', 'Ice-rule violation energy.', 'Defect cost.'),
            observable('observable.spinice.violations', 'Ice-rule violations', 'defect', 'Vertices violating local ice rule.', 'Local constraint defects.'),
            observable('observable.spinice.monopoles', 'Monopoles', 'defect', 'Signed monopole defects.', 'Defect population.'),
            observable('observable.spinice.loop-winding', 'Loop winding', 'topology', 'Whether a loop winds nontrivially.', 'Topological excitation.')
        ],
        warnings: ['Edge models are disabled on 3D/4D grid batch runs until edge-orientation exports are standardized there.']
    },
    {
        id: 'z2_gauge_loop_game',
        name: { en: 'Z2 Gauge Loop Experiment', zh: 'Z2 Gauge Loop 實驗' },
        family: 'Lattice Gauge Concepts',
        section: 'Topological Matter',
        validationLevel: 'estimator',
        stateSpace: { en: 'Z2 edge variables Ue=+1 or Ue=-1 with star and plaquette checks.', zh: 'Z2 邊變數 Ue=+1 或 Ue=-1，含 star 與 plaquette 檢查。' },
        description: { en: 'Gauge loops, checks, Wilson loops, and logical sectors.', zh: 'Gauge loop、檢查、Wilson loop 與 logical sector。' },
        compatibleTopologies: commonTopologies2D,
        initialConditions: [
            ['gauge_vacuum', 'Gauge vacuum', 'Gauge 真空'],
            ['random_edge_errors', 'Random edge errors', '隨機邊錯誤'],
            ['paired_charge_defects', 'Paired charge defects', '成對 charge 缺陷'],
            ['paired_flux_defects', 'Paired flux defects', '成對 flux 缺陷'],
            ['logical_loop_error', 'Logical loop error', 'Logical loop 錯誤']
        ],
        parameters: [
            { id: 'pathLength', label: 'Path Length', defaultValue: 4, min: 1, max: 64, step: 1 },
            { id: 'edgeErrorRate', label: 'Edge Error p', defaultValue: 0.08, min: 0, max: 0.3, step: 0.01 },
            { id: 'noiseRate', label: 'Noise Rate', defaultValue: 0.02, min: 0, max: 0.2, step: 0.01 }
        ],
        observables: [
            observable('observable.z2.syndrome-weight', 'Syndrome weight', 'defect', 'Star plus flux violation count.', 'Local error burden.'),
            observable('observable.z2.logical-sector', 'Logical sector', 'logical', 'Wilson-loop logical sector.', 'Topological memory state.'),
            observable('observable.z2.wilson-loops', 'Wilson loops', 'topology', 'Noncontractible loop products.', 'Global gauge invariant.'),
            observable('observable.z2.memory', 'Memory status', 'logical', 'Whether logical memory remains in vacuum sector.', 'Error correction result.')
        ],
        warnings: ['Plaquette estimates depend on the current graph face adapter.']
    },
    {
        id: 'physical_clifford_reversi',
        name: { en: 'Pauli-Frame Recovery Operators', zh: 'Pauli-Frame Recovery Operators' },
        family: 'Stabilizer Codes',
        section: 'Quantum Information',
        validationLevel: 'estimator',
        stateSpace: { en: 'I/X/Y/Z Pauli-frame sites with signs, phases, syndromes, and optional ancillas.', zh: 'I/X/Y/Z Pauli-frame 格點，含符號、相位、syndrome 與可選 ancilla。' },
        description: { en: 'Pauli-frame recovery, syndrome checks, and logical-sector tracking.', zh: 'Pauli-frame recovery、syndrome 檢查與 logical sector 追蹤。' },
        compatibleTopologies: commonTopologiesND,
        initialConditions: [
            ['stabilizer_vacuum', 'Clean code state', '乾淨 code state'],
            ['paired_defects', 'Random Pauli errors', '隨機 Pauli 錯誤'],
            ['domain_wall_seed', 'Syndrome seed', 'Syndrome 種子'],
            ['prepared_circuit', 'Logical error seed', 'Logical error 種子']
        ],
        parameters: [
            { id: 'measurementErrorP', label: 'Measurement Error p', defaultValue: 0.01, min: 0, max: 0.2, step: 0.01 },
            { id: 'errorDensity', label: 'Error Density', defaultValue: 0.08, min: 0, max: 0.4, step: 0.01 },
            { id: 'logicalChecks', label: 'Topology Checks', defaultValue: true, kind: 'boolean' }
        ],
        observables: [
            observable('observable.stabilizer.syndrome-weight', 'Syndrome weight', 'defect', 'Number of violated local checks.', 'Recovery burden.'),
            observable('observable.stabilizer.logical-sector', 'Logical sector', 'logical', 'Logical cycle parity sector.', 'Encoded state.'),
            observable('observable.stabilizer.global-parity', 'Global parity', 'logical', 'Global Pauli parity.', 'Consistency check.'),
            observable('observable.stabilizer.vacuum', 'Vacuum recovery', 'logical', 'Whether the stabilizer vacuum was recovered.', 'Recovery outcome.')
        ],
        warnings: ['Estimator only; not hardware-calibrated QEC.']
    },
    {
        id: 'physical_anyon_jump',
        name: { en: 'Topological Memory Worldlines', zh: 'Topological Memory Worldlines' },
        family: 'Anyons / Braiding',
        section: 'Topological Matter',
        validationLevel: 'toy',
        stateSpace: { en: 'Vacuum plus mobile anyon labels with fusion and braid memory.', zh: '真空與可移動 anyon 標籤，含 fusion 與 braid 記憶。' },
        description: { en: 'Anyon pair creation, braiding, fusion, and memory checks.', zh: 'Anyon 成對產生、braiding、fusion 與 memory 檢查。' },
        compatibleTopologies: commonTopologiesND,
        initialConditions: [
            ['standard', 'Vacuum / pair creation', '真空 / 成對產生'],
            ['excitation', 'Random anyon gas', '隨機 anyon gas'],
            ['toric_memory', 'Braid challenge seed', 'Braid 挑戰種子']
        ],
        parameters: [
            { id: 'anyonModel', label: 'Anyon Model', defaultValue: 'toric_code', kind: 'choice', choices: ['toric_code', 'ising', 'fibonacci', 'zn_phase'] },
            { id: 'braidMemoryMode', label: 'Braid Memory', defaultValue: 'word_exact', kind: 'choice', choices: ['abelian_parity', 'word_exact', 'nonabelian_fusion_channel'] },
            { id: 'entanglementDistance', label: 'Entanglement Distance', defaultValue: 4, min: 1, max: 32, step: 1 }
        ],
        observables: [
            observable('observable.anyon.total-fusion-charge', 'Total fusion charge', 'fusion', 'Fusion product of visible anyon charges.', 'Vacuum recovery signal.'),
            observable('observable.anyon.logical-sector', 'Logical sector', 'logical', 'Winding-sector memory on noncontractible topology.', 'Topological memory.'),
            observable('observable.anyon.average-braid-word-length', 'Average braid word length', 'braid', 'Mean braid word length per token.', 'Braiding complexity.'),
            observable('observable.anyon.unbraid-success-rate', 'Unbraid success rate', 'braid', 'Successful inverse-braid events divided by attempts.', 'Recovery success.')
        ],
        warnings: ['Toy anyon algebra; validation depends on selected algebra.']
    },
    {
        id: 'physical_virasoro_go',
        name: { en: 'CFT Field Insertion Graph', zh: 'CFT Field Insertion Graph' },
        family: 'Discrete Fields',
        section: 'Field Theory',
        validationLevel: 'toy',
        stateSpace: { en: 'Identity background plus primary-field insertions and channel labels.', zh: 'Identity 背景加 primary-field 插入與 channel 標籤。' },
        description: { en: 'Discrete CFT insertion graph with OPE and stress-proxy observables.', zh: '含 OPE 與 stress proxy 觀測量的離散 CFT 插入圖。' },
        compatibleTopologies: commonTopologiesND,
        initialConditions: [
            ['two_point_insertions', 'Primary insertion pair', 'Primary 插入對'],
            ['four_point_block', 'Four-point insertion', '四點插入'],
            ['boundary_cft_seed', 'Interval seed', '區間種子'],
            ['thermal_sparse', 'Sparse thermal sample', '稀疏 thermal 樣本']
        ],
        parameters: [
            { id: 'centralCharge', label: 'Central Charge c', defaultValue: 0.5, min: 0, max: 4, step: 0.1 },
            { id: 'temperature', label: 'Temperature', defaultValue: 0, min: 0, max: 4, step: 0.1 },
            { id: 'maxMode', label: 'Virasoro N', defaultValue: 1, min: 1, max: 2, step: 1 }
        ],
        observables: [
            observable('observable.cft.primary-counts', 'Primary counts', 'count', 'Counts of primary-field labels.', 'Operator content.'),
            observable('observable.cft.dominant-block', 'Dominant block', 'correlation', 'Largest conformal-block estimator.', 'Channel dominance.'),
            observable('observable.cft.entropy', 'Entropy estimate', 'entropy', 'Discrete region entropy proxy.', 'Information estimator.'),
            observable('observable.cft.anomaly-events', 'Anomaly events', 'diagnostic', 'Central-charge anomaly markers.', 'Approximation warning.')
        ],
        warnings: ['Toy graph CFT estimator; not exact continuum CFT.']
    },
    {
        id: 'clifford_reversi',
        name: { en: 'Stabilizer Operator Grid', zh: 'Stabilizer Operator Grid' },
        family: 'Pauli Algebra',
        section: 'Mathematical Structures',
        validationLevel: 'toy',
        stateSpace: { en: 'Empty sites and symbolic Pauli labels I/X/Y/Z.', zh: '空格點與符號 Pauli 標籤 I/X/Y/Z。' },
        description: { en: 'Symbolic Pauli / Clifford operator sandbox on topology-aware graph rays.', zh: '在拓撲圖射線上的符號 Pauli / Clifford operator 沙盒。' },
        compatibleTopologies: commonTopologiesND,
        initialConditions: [['standard_opening', 'Standard operator opening', '標準 operator 開局']],
        parameters: [
            { id: 'defaultFlipTransform', label: 'Clifford Transform', defaultValue: 'H', kind: 'choice', choices: ['H', 'S', 'identity'] },
            { id: 'trackPhaseSigns', label: 'Phase / Sign Display', defaultValue: false, kind: 'boolean' }
        ],
        observables: [
            observable('observable.pauli.distribution', 'Pauli distribution', 'distribution', 'Counts of I/X/Y/Z labels.', 'Operator population.'),
            observable('observable.pauli.owner-counts', 'Owner counts', 'count', 'Black/white sector counts.', 'State occupancy.'),
            observable('observable.pauli.conflicts', 'Commutation conflicts', 'diagnostic', 'Detected anticommutation conflicts.', 'Algebraic tension.')
        ],
        warnings: ['Toy symbolic algebra.']
    }
];

const physicalAliases = {
    physical_clifford_go: 'physical_clifford_reversi',
    physical_clifford_jump: 'physical_clifford_reversi',
    anyon_jump: 'physical_anyon_jump',
    anyon_reversi: 'physical_anyon_jump',
    physical_anyon_reversi: 'physical_anyon_jump',
    physical_virasoro_reversi: 'physical_virasoro_go',
    physical_virasoro_jump: 'physical_virasoro_go',
    clifford_go: 'clifford_reversi',
    clifford_jump: 'clifford_reversi',
    virasoro_jump: 'physical_virasoro_go'
};

export function modelById(id) {
    const resolvedId = physicalAliases[id] || id;
    return MODEL_REGISTRY.find((model) => model.id === resolvedId) || MODEL_REGISTRY[0];
}

export function topologyById(id) {
    return TOPOLOGY_REGISTRY.find((topology) => topology.id === id) || TOPOLOGY_REGISTRY[0];
}

export function isTopologyCompatible(model, topologyId) {
    return model.compatibleTopologies.includes(topologyId);
}

export function topologyDimensions(topologyId) {
    const topology = topologyById(topologyId);
    return {
        topology: topology.id,
        lattice: topology.latticeTypes[0],
        width: topology.width || 12,
        height: topology.height || 12,
        nx: topology.width || 12,
        ny: topology.height || 12,
        nz: topology.depth || 4,
        depth: topology.depth || 4,
        nw: topology.w || 3
    };
}

export function initialConditionOptions(model, language = getLanguage()) {
    return model.initialConditions.map(([id, en, zh]) => ({
        id,
        label: language === 'zh' ? zh : en
    }));
}

export function costRank(cost) {
    return { low: 1, medium: 2, high: 3, very_high: 4 }[cost] || 1;
}
