import { createBoardSpec, exportBoardSpec } from '../../js/shared/BoardSpec.js';
import {
    downloadBoardSpecJson,
    importBoardSpecJson,
    setCurrentBoardSpec,
    validateImportedBoardSpec
} from '../../js/shared/BoardSpecIO.js';

const STORAGE_KEY = 'topological-boardgame:language';

const TEXT = {
    en: {
        home: 'Labs Home',
        experimentBuilder: 'Experiment Builder',
        topologyComparison: 'Topology Comparison',
        validationSuite: 'Validation & Reproducibility',
        pageTitle: 'Research Board Builder',
        subtitle: 'Prepare and validate BoardSpec objects for future research boards. External scientific tool bridges are placeholders only.',
        safeBridge: 'Safe Bridge',
        statusTitle: 'BoardSpec JSON workspace',
        statusText: 'Imported boards are Research/Debug only by default. They are not allowed in online ranked or public rooms, and Labs should not run on them until validation passes.',
        exportBoardSpec: 'Export BoardSpec',
        importBoardSpec: 'Import BoardSpec',
        validateBoard: 'Validate Board',
        boardValid: 'Board valid',
        boardInvalid: 'Board invalid',
        source: 'Source',
        manualPreset: 'Manual preset source',
        internalPresets: 'Existing internal board presets',
        preset: 'Preset',
        cifImport: 'CIF import',
        poscarImport: 'POSCAR import',
        xyzImport: 'XYZ import',
        materialsProject: 'Materials Project',
        optimade: 'OPTIMADE',
        nomad: 'NOMAD',
        gmshMesh: 'Gmsh mesh',
        ovitoExport: 'OVITO export',
        futureSuffix: '(Future)',
        futureSupport: 'Coming Later',
        space: 'Space',
        lattice: 'Lattice / Tiling',
        domain: 'Domain / Shape',
        boundary: 'Boundary / Gluing',
        defects: 'Defects',
        defectsPlaceholder: 'Defect editing is reserved for future research workflows.',
        compile: 'Compile',
        export: 'Export',
        exportHelp: 'Only BoardSpec JSON export is enabled in this Steam-safe step.',
        id: 'ID',
        dimension: 'Dimension',
        playableKind: 'Playable kind',
        sites: 'Sites',
        edges: 'Edges',
        status: 'Status',
        policy: 'Policy',
        importedPolicy: 'Imported boards require Research mode and validation before Lab use.',
        language: 'Language'
    },
    zh: {
        home: 'Labs 首頁',
        experimentBuilder: '實驗建構器',
        topologyComparison: '拓撲比較',
        validationSuite: '驗證與可重現性',
        pageTitle: '研究棋盤建構器',
        subtitle: '準備並驗證未來研究棋盤使用的 BoardSpec 物件。外部科學工具橋接目前只保留為佔位。',
        safeBridge: '安全橋接',
        statusTitle: 'BoardSpec JSON 工作區',
        statusText: '匯入棋盤預設只限研究／除錯使用，不允許進入線上排名或公開房間；驗證通過以前也不應執行 Labs。',
        exportBoardSpec: '匯出 BoardSpec',
        importBoardSpec: '匯入 BoardSpec',
        validateBoard: '驗證棋盤',
        boardValid: '棋盤有效',
        boardInvalid: '棋盤無效',
        source: '來源',
        manualPreset: '手動預設來源',
        internalPresets: '既有內部棋盤預設',
        preset: '預設',
        cifImport: 'CIF 匯入',
        poscarImport: 'POSCAR 匯入',
        xyzImport: 'XYZ 匯入',
        materialsProject: 'Materials Project',
        optimade: 'OPTIMADE',
        nomad: 'NOMAD',
        gmshMesh: 'Gmsh mesh',
        ovitoExport: 'OVITO 匯出',
        futureSuffix: '（未來支援）',
        futureSupport: '未來支援',
        space: '空間',
        lattice: '晶格 / 鋪砌',
        domain: '區域 / 形狀',
        boundary: '邊界 / 黏合',
        defects: '缺陷',
        defectsPlaceholder: '缺陷編輯保留給未來研究流程。',
        compile: '編譯',
        export: '匯出',
        exportHelp: '此 Steam-safe 步驟只啟用 BoardSpec JSON 匯出。',
        id: 'ID',
        dimension: '維度',
        playableKind: '可下子單位',
        sites: '格點',
        edges: '邊',
        status: '狀態',
        policy: '政策',
        importedPolicy: '匯入棋盤需要研究模式，且通過驗證後才可供 Lab 使用。',
        language: '語言'
    }
};

const PRESETS = [
    {
        id: 'preset.r2-square-vertex',
        labelEn: 'R2 Square Vertex Graph',
        labelZh: 'R2 方格頂點圖',
        spec: {
            id: 'board.r2-square-vertex-2x2',
            nameEn: 'R2 Square Vertex Graph',
            nameZh: 'R2 方格頂點圖',
            dimension: 2,
            playableKind: 'vertex',
            space: { id: 'r2', nameEn: 'Euclidean Plane R2', nameZh: '歐氏平面 R2' },
            lattice: { id: 'square', nameEn: 'Square Lattice', nameZh: '方格晶格' },
            boundary: { id: 'hard', nameEn: 'Hard Boundary', nameZh: '硬邊界' },
            sites: [
                { id: 'v:0:0', coord: { x: 0, y: 0 }, draw: { x: 0, y: 0 } },
                { id: 'v:1:0', coord: { x: 1, y: 0 }, draw: { x: 1, y: 0 } },
                { id: 'v:0:1', coord: { x: 0, y: 1 }, draw: { x: 0, y: 1 } },
                { id: 'v:1:1', coord: { x: 1, y: 1 }, draw: { x: 1, y: 1 } }
            ],
            edges: [
                { source: 'v:0:0', target: 'v:1:0', dir: 'x' },
                { source: 'v:0:1', target: 'v:1:1', dir: 'x' },
                { source: 'v:0:0', target: 'v:0:1', dir: 'y' },
                { source: 'v:1:0', target: 'v:1:1', dir: 'y' }
            ],
            directions: ['x', 'y'],
            metadata: { source: 'internal_preset', access: 'research_debug' }
        }
    },
    {
        id: 'preset.t2-cycle',
        labelEn: 'T2 Periodic Cycle Toy',
        labelZh: 'T2 週期環玩具圖',
        spec: {
            id: 'board.t2-periodic-cycle-toy',
            nameEn: 'T2 Periodic Cycle Toy',
            nameZh: 'T2 週期環玩具圖',
            dimension: 2,
            playableKind: 'vertex',
            space: { id: 't2', nameEn: 'Torus T2', nameZh: '環面 T2' },
            lattice: { id: 'cycle', nameEn: 'Cycle Graph', nameZh: '環圖' },
            boundary: { id: 'periodic', nameEn: 'Periodic Gluing', nameZh: '週期黏合', gluing: { x: 'periodic', y: 'periodic' } },
            sites: [
                { id: 'c:0', coord: { i: 0 } },
                { id: 'c:1', coord: { i: 1 } },
                { id: 'c:2', coord: { i: 2 } },
                { id: 'c:3', coord: { i: 3 } }
            ],
            edges: [
                { source: 'c:0', target: 'c:1', seam: false },
                { source: 'c:1', target: 'c:2', seam: false },
                { source: 'c:2', target: 'c:3', seam: false },
                { source: 'c:3', target: 'c:0', seam: true }
            ],
            directions: ['cycle'],
            metadata: { source: 'internal_preset', access: 'research_debug' }
        }
    },
    {
        id: 'preset.r3-cube',
        labelEn: 'R3 Cube Vertex Graph',
        labelZh: 'R3 立方頂點圖',
        spec: {
            id: 'board.r3-cube-vertex',
            nameEn: 'R3 Cube Vertex Graph',
            nameZh: 'R3 立方頂點圖',
            dimension: 3,
            playableKind: 'vertex',
            space: { id: 'r3', nameEn: 'Euclidean 3-Space R3', nameZh: '歐氏三維空間 R3' },
            lattice: { id: 'simple_cubic', nameEn: 'Simple Cubic', nameZh: '簡立方晶格' },
            boundary: { id: 'hard', nameEn: 'Hard Boundary', nameZh: '硬邊界' },
            sites: [
                { id: 'v:0:0:0', coord: { x: 0, y: 0, z: 0 }, position3D: { x: 0, y: 0, z: 0 } },
                { id: 'v:1:0:0', coord: { x: 1, y: 0, z: 0 }, position3D: { x: 1, y: 0, z: 0 } },
                { id: 'v:0:1:0', coord: { x: 0, y: 1, z: 0 }, position3D: { x: 0, y: 1, z: 0 } },
                { id: 'v:1:1:0', coord: { x: 1, y: 1, z: 0 }, position3D: { x: 1, y: 1, z: 0 } },
                { id: 'v:0:0:1', coord: { x: 0, y: 0, z: 1 }, position3D: { x: 0, y: 0, z: 1 } },
                { id: 'v:1:0:1', coord: { x: 1, y: 0, z: 1 }, position3D: { x: 1, y: 0, z: 1 } },
                { id: 'v:0:1:1', coord: { x: 0, y: 1, z: 1 }, position3D: { x: 0, y: 1, z: 1 } },
                { id: 'v:1:1:1', coord: { x: 1, y: 1, z: 1 }, position3D: { x: 1, y: 1, z: 1 } }
            ],
            edges: [
                ['v:0:0:0', 'v:1:0:0'], ['v:0:1:0', 'v:1:1:0'], ['v:0:0:1', 'v:1:0:1'], ['v:0:1:1', 'v:1:1:1'],
                ['v:0:0:0', 'v:0:1:0'], ['v:1:0:0', 'v:1:1:0'], ['v:0:0:1', 'v:0:1:1'], ['v:1:0:1', 'v:1:1:1'],
                ['v:0:0:0', 'v:0:0:1'], ['v:1:0:0', 'v:1:0:1'], ['v:0:1:0', 'v:0:1:1'], ['v:1:1:0', 'v:1:1:1']
            ],
            directions: ['x', 'y', 'z'],
            metadata: { source: 'internal_preset', access: 'research_debug' }
        }
    }
];

const els = {
    preset: document.querySelector('#boardPresetSelect'),
    preview: document.querySelector('#boardSpecPreview'),
    status: document.querySelector('#validationStatus'),
    exportButton: document.querySelector('#exportBoardSpecButton'),
    importInput: document.querySelector('#importBoardSpecInput'),
    validateButton: document.querySelector('#validateBoardButton'),
    spaceSummary: document.querySelector('#spaceSummary'),
    latticeSummary: document.querySelector('#latticeSummary'),
    domainSummary: document.querySelector('#domainSummary'),
    boundarySummary: document.querySelector('#boundarySummary'),
    compileSummary: document.querySelector('#compileSummary'),
    languageButton: document.querySelector('#labsLanguageButton'),
    languageMenu: document.querySelector('#labsLanguageMenu')
};

let language = currentLanguage();
let currentBoardSpec = null;
let currentValidation = null;

function normalizeLanguage(value) {
    const next = String(value || '').toLowerCase();
    return next === 'zh' || next === 'zh-hant' || next === 'zh_tw' ? 'zh' : 'en';
}

function currentLanguage() {
    const params = new URLSearchParams(location.search);
    if (params.get('lang')) return normalizeLanguage(params.get('lang'));
    try { return normalizeLanguage(localStorage.getItem(STORAGE_KEY) || navigator.language); } catch { return 'en'; }
}

function t(key) {
    return TEXT[language][key] || TEXT.en[key] || key;
}

function textOf(value) {
    if (!value) return '-';
    return language === 'zh' ? value.nameZh || value.nameEn || value.id : value.nameEn || value.id;
}

function row(term, value) {
    return `<div><dt>${term}</dt><dd>${value}</dd></div>`;
}

function fillMetadata(target, rows) {
    if (!target) return;
    target.innerHTML = rows.join('');
}

function validateCurrentBoard() {
    currentValidation = validateImportedBoardSpec(currentBoardSpec, { maxSites: 20000, maxEdges: 100000 });
    updateStatus();
    return currentValidation;
}

function updateStatus() {
    if (!els.status || !currentValidation) return;
    els.status.textContent = currentValidation.ok ? t('boardValid') : t('boardInvalid');
    els.status.dataset.state = currentValidation.ok ? 'valid' : 'invalid';
}

function renderBoard(boardSpec) {
    currentBoardSpec = setCurrentBoardSpec(createBoardSpec(boardSpec));
    validateCurrentBoard();
    fillMetadata(els.spaceSummary, [
        row(t('id'), currentBoardSpec.space.id),
        row(t('space'), textOf(currentBoardSpec.space)),
        row(t('dimension'), currentBoardSpec.dimension)
    ]);
    fillMetadata(els.latticeSummary, [
        row(t('id'), currentBoardSpec.lattice.id),
        row(t('lattice'), textOf(currentBoardSpec.lattice)),
        row(t('playableKind'), currentBoardSpec.playableKind)
    ]);
    fillMetadata(els.domainSummary, [
        row(t('sites'), currentBoardSpec.sites.length),
        row(t('edges'), currentBoardSpec.edges.length),
        row(t('policy'), t('importedPolicy'))
    ]);
    fillMetadata(els.boundarySummary, [
        row(t('id'), currentBoardSpec.boundary.id),
        row(t('boundary'), textOf(currentBoardSpec.boundary)),
        row(t('status'), currentValidation.ok ? t('boardValid') : t('boardInvalid'))
    ]);
    if (els.compileSummary) {
        const errors = currentValidation.errors?.length ? currentValidation.errors.join(' ') : t('boardValid');
        els.compileSummary.textContent = errors;
    }
    if (els.preview) els.preview.value = exportBoardSpec(currentBoardSpec);
}

function applyLanguage(nextLanguage) {
    language = normalizeLanguage(nextLanguage);
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-labs-lang]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.labsLang === language));
    });
    document.querySelectorAll('[data-labs-language-current]').forEach((node) => {
        node.textContent = language === 'zh' ? '中' : 'En';
    });
    document.querySelectorAll('[data-labs-language-label]').forEach((node) => {
        node.textContent = t('language');
    });
    if (els.languageButton) {
        const title = language === 'zh' ? '切換語言' : 'Change language';
        els.languageButton.setAttribute('aria-label', title);
        els.languageButton.setAttribute('title', title);
    }
    for (const [index, preset] of PRESETS.entries()) {
        const option = els.preset?.options[index];
        if (option) option.textContent = language === 'zh' ? preset.labelZh : preset.labelEn;
    }
    if (currentBoardSpec) renderBoard(currentBoardSpec);
}

function initPresets() {
    els.preset.replaceChildren();
    for (const preset of PRESETS) {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = language === 'zh' ? preset.labelZh : preset.labelEn;
        els.preset.append(option);
    }
    renderBoard(PRESETS[0].spec);
}

function selectedPreset() {
    return PRESETS.find((preset) => preset.id === els.preset.value) || PRESETS[0];
}

function closeLanguageMenu() {
    if (!els.languageMenu || !els.languageButton) return;
    els.languageMenu.hidden = true;
    els.languageButton.setAttribute('aria-expanded', 'false');
}

els.preset?.addEventListener('change', () => renderBoard(selectedPreset().spec));
els.validateButton?.addEventListener('click', () => validateCurrentBoard());
els.exportButton?.addEventListener('click', () => {
    validateCurrentBoard();
    if (currentValidation.ok) downloadBoardSpecJson(currentBoardSpec);
});
els.importInput?.addEventListener('change', async () => {
    const file = els.importInput.files?.[0];
    if (!file) return;
    try {
        const { boardSpec } = await importBoardSpecJson(file);
        renderBoard(boardSpec);
    } catch (error) {
        if (els.status) {
            els.status.textContent = `${t('boardInvalid')}: ${error?.message || error}`;
            els.status.dataset.state = 'invalid';
        }
    } finally {
        els.importInput.value = '';
    }
});

els.languageButton?.addEventListener('click', () => {
    const nextOpen = els.languageMenu.hidden;
    els.languageMenu.hidden = !nextOpen;
    els.languageButton.setAttribute('aria-expanded', String(nextOpen));
});

document.addEventListener('click', (event) => {
    if (els.languageMenu?.hidden || event.target.closest('[data-labs-language]')) return;
    closeLanguageMenu();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLanguageMenu();
});

document.querySelectorAll('[data-labs-lang]').forEach((button) => {
    button.addEventListener('click', () => {
        const next = normalizeLanguage(button.dataset.labsLang);
        try { localStorage.setItem(STORAGE_KEY, next); } catch {}
        applyLanguage(next);
        closeLanguageMenu();
    });
});

initPresets();
applyLanguage(language);
