import {
    ARTIFACT_GROUPS,
    EXPORT_PURPOSES,
    FIGURE_TYPES,
    LICENSE_OPTIONS,
    PUBLICATION_STORAGE_KEY,
    TABLE_TYPES,
    buildPublicationPackage,
    bundleToDownloadJson,
    createDefaultPublicationSource,
    defaultArtifactsForPurpose,
    downloadText,
    loadStoredValidationCandidates,
    normalizeLoadedObject,
    parseSharedInput,
    rowsForTable,
    toCsv
} from './LabPublicationCore.js';
import { installLabLanguageMenu, syncLabLanguageMenu } from '../experiments/LabLanguageMenu.js';

const TEXT = {
    en: {
        home: 'Labs Home',
        experimentBuilder: 'Experiment Builder',
        phaseDiagramGenerator: 'Phase Diagram Generator',
        topologyComparison: 'Topology Comparison',
        validationSuite: 'Validation & Reproducibility',
        pageTitle: 'Publication & Dataset Export',
        subtitle: 'Package reproducible Topoboard Labs experiments into shareable research artifacts.',
        language: 'Language',
        shareMode: 'Share My Experiment',
        researchMode: 'Research Bundle',
        purposeEyebrow: 'Export workflow',
        purposeTitle: 'Structured artifacts, cautious labels, reproducible metadata.',
        purposeText: 'Generate configs, results, data tables, documentation, provenance, checksums, citation metadata, and review warnings without uploading anything.',
        formalModel: 'Formal model',
        formalExpression: 'Expression',
        formalPublicationText: 'Publication export packages the experiment, results, checksums, provenance, warnings, and citation metadata into a reviewable bundle.',
        generateBundle: 'Generate Bundle',
        downloadBundle: 'Download Bundle JSON',
        readiness: 'Readiness',
        sourceType: 'Source type',
        fileCount: 'Files',
        warningCount: 'Warnings',
        sourceSelection: 'Source Selection Panel',
        uploadJson: 'Upload JSON',
        pasteJson: 'Paste JSON',
        shareLink: 'Shareable experiment link',
        loadPasted: 'Load pasted / link',
        loadSample: 'Load sample Ising config',
        readinessPanel: 'Publication Readiness Panel',
        artifactSelection: 'Artifact Selection Panel',
        exportPurpose: 'Export purpose',
        figureBuilder: 'Figure Builder Panel',
        figureType: 'Figure type',
        figureFormat: 'Format',
        figureTitleLabel: 'Title',
        figureCaption: 'Caption',
        tableBuilder: 'Table Builder Panel',
        tableType: 'Table type',
        tableFormat: 'Format',
        tableTitleLabel: 'Title',
        documentationPanel: 'Documentation Panel',
        citationPanel: 'Citation Panel',
        citationDatasetTitle: 'Dataset title',
        creators: 'Creators',
        projectUrl: 'Project URL',
        repositoryUrl: 'Repository URL',
        license: 'License',
        keywords: 'Keywords',
        customLicense: 'Custom license text',
        provenancePanel: 'Provenance Panel',
        finalReview: 'Final Review Panel',
        exportPanel: 'Export Panel',
        exportHelp: 'This browser build downloads a structured JSON bundle with folder paths and checksums. Nothing is uploaded.',
        downloadManifest: 'Download Manifest',
        downloadReadme: 'Download README',
        downloadCsv: 'Download Observable CSV',
        copyCitation: 'Copy Citation',
        load: 'Load',
        sample: 'Sample',
        stored: 'Stored',
        noStored: 'No stored Labs exports were found. Use the sample, upload JSON, or paste JSON.',
        selected: 'selected',
        sourceSummary: 'Source summary',
        missingMetadata: 'Missing metadata',
        noWarnings: 'No publication warnings for the current selection.',
        bundleGenerated: 'Bundle generated.',
        copiedCitation: 'Citation copied.',
        invalidInput: 'Could not load JSON: {message}',
        guidedHelp: 'Guided mode exports config, snapshot, observable summary, replay metadata, and a simple README with cautious labels.',
        readmePreview: 'README and methods summary are generated from source metadata. Edit creator and license fields before public release.',
        provenancePreview: 'Provenance records every source object, generated file, transformation method, and checksum.',
        manifestPreview: 'Generate a bundle to preview the manifest.',
        figureCaution: 'Caption uses cautious finite-size language and does not claim a proof or exact phase transition.'
    },
    zh: {
        home: 'Labs 首頁',
        experimentBuilder: '實驗建構器',
        phaseDiagramGenerator: '相圖產生器',
        topologyComparison: '拓撲比較',
        validationSuite: '驗證與可重現性',
        pageTitle: '出版與資料集匯出',
        subtitle: '把可重現的 Topoboard Labs 實驗整理成可分享、可審查、可引用的研究資料。',
        language: '語言',
        shareMode: '分享我的實驗',
        researchMode: '研究 bundle',
        purposeEyebrow: '匯出流程',
        purposeTitle: '結構化檔案、謹慎標籤、可重現中繼資料。',
        purposeText: '產生設定、結果、資料表、文件、來源紀錄、校驗碼、引用資料與警告審查；不會上傳任何資料。',
        formalModel: '\u5f62\u5f0f\u6a21\u578b',
        formalExpression: '\u8868\u793a\u5f0f',
        formalPublicationText: '\u51fa\u7248\u532f\u51fa\u5c07\u5be6\u9a57\u3001\u7d50\u679c\u3001\u6821\u9a57\u78bc\u3001\u4f86\u6e90\u7d00\u9304\u3001\u8b66\u544a\u8207\u5f15\u7528\u8cc7\u6599\u5c01\u88dd\u6210\u53ef\u5be9\u67e5\u7684 bundle\u3002',
        generateBundle: '產生 bundle',
        downloadBundle: '下載 bundle JSON',
        readiness: '準備程度',
        sourceType: '來源類型',
        fileCount: '檔案',
        warningCount: '警告',
        sourceSelection: '來源選擇面板',
        uploadJson: '上傳 JSON',
        pasteJson: '貼上 JSON',
        shareLink: '可分享實驗連結',
        loadPasted: '讀取貼上內容 / 連結',
        loadSample: '讀取 Ising 範例設定',
        readinessPanel: '出版準備程度面板',
        artifactSelection: '檔案項目選擇面板',
        exportPurpose: '匯出目的',
        figureBuilder: '圖表建構面板',
        figureType: '圖表類型',
        figureFormat: '格式',
        figureTitleLabel: '標題',
        figureCaption: '圖說',
        tableBuilder: '表格建構面板',
        tableType: '表格類型',
        tableFormat: '格式',
        tableTitleLabel: '標題',
        documentationPanel: '文件面板',
        citationPanel: '引用面板',
        citationDatasetTitle: '資料集標題',
        creators: '作者 / 建立者',
        projectUrl: '專案網址',
        repositoryUrl: '程式庫網址',
        license: '授權',
        keywords: '關鍵字',
        customLicense: '自訂授權文字',
        provenancePanel: '來源紀錄面板',
        finalReview: '最終審查面板',
        exportPanel: '匯出面板',
        exportHelp: '這個瀏覽器版本會下載含資料夾路徑與校驗碼的結構化 JSON bundle，不會上傳資料。',
        downloadManifest: '下載 manifest',
        downloadReadme: '下載 README',
        downloadCsv: '下載觀測量 CSV',
        copyCitation: '複製引用文字',
        load: '讀取',
        sample: '範例',
        stored: '已儲存',
        noStored: '找不到已儲存的 Labs 匯出。請使用範例、上傳 JSON，或貼上 JSON。',
        selected: '已選',
        sourceSummary: '來源摘要',
        missingMetadata: '缺少中繼資料',
        noWarnings: '目前選擇沒有出版警告。',
        bundleGenerated: 'Bundle 已產生。',
        copiedCitation: '引用文字已複製。',
        invalidInput: '無法讀取 JSON：{message}',
        guidedHelp: '引導模式會匯出設定、快照、觀測量摘要、重播中繼資料與簡短 README，並保留謹慎標籤。',
        readmePreview: 'README 與方法摘要會由來源中繼資料產生。公開前請編輯作者與授權欄位。',
        provenancePreview: '來源紀錄會記錄每個來源物件、產生檔案、轉換方法與校驗碼。',
        manifestPreview: '請先產生 bundle 以預覽 manifest。',
        figureCaution: '圖說使用謹慎的有限尺寸語言，不宣稱證明或精確相變。'
    }
};

const els = {
    languageSelect: document.querySelector('#languageSelect'),
    shareModeButton: document.querySelector('#shareModeButton'),
    researchModeButton: document.querySelector('#researchModeButton'),
    generateBundleButton: document.querySelector('#generateBundleButton'),
    downloadBundleButton: document.querySelector('#downloadBundleButton'),
    summaryReadiness: document.querySelector('#summaryReadiness'),
    summarySourceType: document.querySelector('#summarySourceType'),
    summaryFileCount: document.querySelector('#summaryFileCount'),
    summaryWarningCount: document.querySelector('#summaryWarningCount'),
    storedSourceList: document.querySelector('#storedSourceList'),
    jsonFileInput: document.querySelector('#jsonFileInput'),
    pasteJsonInput: document.querySelector('#pasteJsonInput'),
    linkInput: document.querySelector('#linkInput'),
    loadPastedButton: document.querySelector('#loadPastedButton'),
    loadSampleButton: document.querySelector('#loadSampleButton'),
    sourceMetadata: document.querySelector('#sourceMetadata'),
    readinessCards: document.querySelector('#readinessCards'),
    publicationWarnings: document.querySelector('#publicationWarnings'),
    purposeSelect: document.querySelector('#purposeSelect'),
    artifactGroups: document.querySelector('#artifactGroups'),
    figureTypeSelect: document.querySelector('#figureTypeSelect'),
    figureFormatSelect: document.querySelector('#figureFormatSelect'),
    figureTitleInput: document.querySelector('#figureTitleInput'),
    figureCaptionInput: document.querySelector('#figureCaptionInput'),
    figurePreview: document.querySelector('#figurePreview'),
    tableTypeSelect: document.querySelector('#tableTypeSelect'),
    tableFormatSelect: document.querySelector('#tableFormatSelect'),
    tableTitleInput: document.querySelector('#tableTitleInput'),
    tablePreview: document.querySelector('#tablePreview'),
    documentationPreview: document.querySelector('#documentationPreview'),
    citationTitleInput: document.querySelector('#citationTitleInput'),
    creatorsInput: document.querySelector('#creatorsInput'),
    projectUrlInput: document.querySelector('#projectUrlInput'),
    repositoryUrlInput: document.querySelector('#repositoryUrlInput'),
    licenseSelect: document.querySelector('#licenseSelect'),
    keywordsInput: document.querySelector('#keywordsInput'),
    customLicenseLabel: document.querySelector('#customLicenseLabel'),
    customLicenseInput: document.querySelector('#customLicenseInput'),
    citationPreview: document.querySelector('#citationPreview'),
    provenancePreview: document.querySelector('#provenancePreview'),
    manifestPreview: document.querySelector('#manifestPreview'),
    downloadManifestButton: document.querySelector('#downloadManifestButton'),
    downloadReadmeButton: document.querySelector('#downloadReadmeButton'),
    downloadCsvButton: document.querySelector('#downloadCsvButton'),
    copyCitationButton: document.querySelector('#copyCitationButton'),
    bundleText: document.querySelector('#bundleText')
};

let language = initialLanguage();
let currentLoaded = createDefaultPublicationSource();
let currentBundle = null;
let currentMode = new URLSearchParams(location.search).get('mode') === 'guided'
    ? 'guided'
    : (localStorage.getItem('topoboard-labs:publication-mode') || 'research');

function initialLanguage() {
    const query = new URLSearchParams(location.search).get('lang');
    const saved = localStorage.getItem('topoboard-labs-language') || localStorage.getItem('topological-boardgame:language');
    return String(query || saved || document.documentElement.lang || navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function t(key, params = {}) {
    const value = TEXT[language]?.[key] || TEXT.en[key] || key;
    return String(value).replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function setLanguage(nextLanguage) {
    language = String(nextLanguage || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
    els.languageSelect.value = language;
    syncLabLanguageMenu(language);
    localStorage.setItem('topoboard-labs-language', language);
    localStorage.setItem('topological-boardgame:language', language);
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        node.textContent = t(node.dataset.i18n);
    });
    renderOptions();
    renderAll();
}

function setMode(mode) {
    currentMode = mode === 'guided' ? 'guided' : 'research';
    document.body.dataset.publicationMode = currentMode;
    els.shareModeButton.setAttribute('aria-pressed', currentMode === 'guided' ? 'true' : 'false');
    els.researchModeButton.setAttribute('aria-pressed', currentMode === 'research' ? 'true' : 'false');
    localStorage.setItem('topoboard-labs:publication-mode', currentMode);
    if (currentMode === 'guided') {
        els.purposeSelect.value = 'exploratory_sharing';
        applyDefaultArtifacts();
    }
    generateBundle();
}

function labelForPurpose(id) {
    const entry = EXPORT_PURPOSES.find((item) => item.id === id);
    if (!entry) return id;
    if (language === 'zh') {
        return {
            exploratory_sharing: '探索分享',
            classroom_demonstration: '課堂示範',
            reproducibility_bundle: '可重現 bundle',
            supplementary_material: '補充資料',
            dataset_release: '資料集發布',
            benchmark_report: '基準測試報告',
            topology_comparison_report: '拓撲比較報告',
            phase_regime_scan_report: '相圖 / 區域掃描報告'
        }[id] || entry.label;
    }
    return entry.label;
}

function renderOptions() {
    const purposeValue = els.purposeSelect.value || 'reproducibility_bundle';
    els.purposeSelect.innerHTML = EXPORT_PURPOSES.map((entry) => `<option value="${entry.id}">${escapeHtml(labelForPurpose(entry.id))}</option>`).join('');
    els.purposeSelect.value = EXPORT_PURPOSES.some((entry) => entry.id === purposeValue) ? purposeValue : 'reproducibility_bundle';

    const licenseValue = els.licenseSelect.value || 'none';
    els.licenseSelect.innerHTML = LICENSE_OPTIONS.map((entry) => `<option value="${entry.id}">${escapeHtml(entry.name)}</option>`).join('');
    els.licenseSelect.value = LICENSE_OPTIONS.some((entry) => entry.id === licenseValue) ? licenseValue : 'none';

    const figureValue = els.figureTypeSelect.value || 'observable_time_series';
    els.figureTypeSelect.innerHTML = FIGURE_TYPES.map((entry) => `<option value="${entry.id}">${escapeHtml(entry.label)}</option>`).join('');
    els.figureTypeSelect.value = FIGURE_TYPES.some((entry) => entry.id === figureValue) ? figureValue : 'observable_time_series';

    const tableValue = els.tableTypeSelect.value || 'experiment_configuration';
    els.tableTypeSelect.innerHTML = TABLE_TYPES.map((entry) => `<option value="${entry.id}">${escapeHtml(entry.label)}</option>`).join('');
    els.tableTypeSelect.value = TABLE_TYPES.some((entry) => entry.id === tableValue) ? tableValue : 'experiment_configuration';

    if (!els.figureCaptionInput.value) els.figureCaptionInput.value = t('figureCaution');
    renderArtifactGroups(defaultArtifactsForPurpose(els.purposeSelect.value || 'reproducibility_bundle'));
}

function renderArtifactGroups(selected = selectedArtifactsFromUi()) {
    els.artifactGroups.innerHTML = Object.entries(ARTIFACT_GROUPS).map(([group, items]) => `
        <section class="artifact-group">
            <strong>${escapeHtml(group.replace(/([A-Z])/g, ' $1'))}</strong>
            ${items.map(([id, label]) => {
                const checked = selected[group]?.includes(id) ? 'checked' : '';
                const advanced = group !== 'coreFiles' && group !== 'documentationFiles' ? 'data-advanced-artifact="true"' : '';
                return `<label ${advanced}><input type="checkbox" data-artifact-group="${group}" value="${id}" ${checked}> <span>${escapeHtml(label)}</span></label>`;
            }).join('')}
        </section>
    `).join('');
    els.artifactGroups.querySelectorAll('input').forEach((input) => input.addEventListener('change', generateBundle));
}

function selectedArtifactsFromUi() {
    const selected = Object.fromEntries(Object.keys(ARTIFACT_GROUPS).map((group) => [group, []]));
    els.artifactGroups.querySelectorAll('input[data-artifact-group]:checked').forEach((input) => {
        selected[input.dataset.artifactGroup].push(input.value);
    });
    return selected;
}

function applyDefaultArtifacts() {
    renderArtifactGroups(defaultArtifactsForPurpose(els.purposeSelect.value));
}

function metadataRow(key, value) {
    return `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function renderStoredSources() {
    const candidates = loadStoredValidationCandidates().filter((candidate) => candidate.object);
    const rows = [
        { key: 'sample', source: t('sample'), objectType: 'LabExperimentConfig', object: createDefaultPublicationSource().object },
        ...candidates
    ];
    if (!rows.length) {
        els.storedSourceList.innerHTML = `<p>${escapeHtml(t('noStored'))}</p>`;
        return;
    }
    els.storedSourceList.innerHTML = rows.map((candidate, index) => `
        <article class="publication-card">
            <span>
                <strong>${escapeHtml(candidate.objectType || 'object')}</strong>
                <small>${escapeHtml(candidate.key || candidate.source || '')}</small>
            </span>
            <button type="button" data-source-index="${index}">${escapeHtml(t('load'))}</button>
        </article>
    `).join('');
    els.storedSourceList.querySelectorAll('button[data-source-index]').forEach((button) => {
        button.addEventListener('click', () => {
            const source = rows[Number(button.dataset.sourceIndex)];
            setLoaded(normalizeLoadedObject(source.object, source.key || source.source || 'stored'));
        });
    });
}

function setLoaded(loaded) {
    currentLoaded = loaded;
    const model = currentLoaded.modelIds[0] || 'Topoboard Labs';
    const topology = currentLoaded.topologyIds[0] || 'topology';
    els.citationTitleInput.value = `Topoboard Labs dataset: ${model} on ${topology}, ${currentLoaded.objectType}`;
    generateBundle();
}

function citationOptionsFromUi() {
    return {
        title: els.citationTitleInput.value,
        creatorsText: els.creatorsInput.value,
        projectUrl: els.projectUrlInput.value,
        repositoryUrl: els.repositoryUrlInput.value,
        keywords: els.keywordsInput.value
    };
}

function licenseOptionsFromUi() {
    return {
        licenseId: els.licenseSelect.value,
        customLicenseText: els.customLicenseInput.value
    };
}

function generateBundle() {
    try {
        currentBundle = buildPublicationPackage({
            loaded: currentLoaded,
            purpose: els.purposeSelect.value || (currentMode === 'guided' ? 'exploratory_sharing' : 'reproducibility_bundle'),
            selectedArtifacts: selectedArtifactsFromUi(),
            figureOptions: {
                figureType: els.figureTypeSelect.value,
                figureFormat: els.figureFormatSelect.value,
                title: els.figureTitleInput.value,
                caption: els.figureCaptionInput.value
            },
            tableOptions: {
                tableType: els.tableTypeSelect.value,
                tableFormat: els.tableFormatSelect.value,
                title: els.tableTitleInput.value
            },
            citationOptions: citationOptionsFromUi(),
            licenseOptions: licenseOptionsFromUi(),
            guided: currentMode === 'guided'
        });
        localStorage.setItem(PUBLICATION_STORAGE_KEY, JSON.stringify({
            storedAt: new Date().toISOString(),
            packageResultHash: currentBundle.packageResultHash,
            exportManifest: currentBundle.exportManifest,
            citationMetadata: currentBundle.citationMetadata
        }));
        renderAll();
    } catch (error) {
        els.bundleText.value = t('invalidInput', { message: error?.message || String(error) });
    }
}

function renderAll() {
    if (!currentBundle) return;
    renderSummary();
    renderSourceMetadata();
    renderReadiness();
    renderFigurePreview();
    renderTablePreview();
    renderDocumentationPreview();
    renderCitationPreview();
    renderProvenancePreview();
    renderManifestPreview();
    els.customLicenseLabel.hidden = els.licenseSelect.value !== 'custom';
    els.bundleText.value = bundleToDownloadJson(currentBundle);
}

function renderSummary() {
    els.summaryReadiness.textContent = currentBundle.readinessLevel;
    els.summarySourceType.textContent = currentLoaded.objectType;
    els.summaryFileCount.textContent = String(currentBundle.generatedFiles.length);
    els.summaryWarningCount.textContent = String(currentBundle.warnings.length);
}

function renderSourceMetadata() {
    const summary = currentBundle.exportManifest;
    const selectedCount = Object.values(selectedArtifactsFromUi()).flat().length;
    els.sourceMetadata.innerHTML = [
        metadataRow(t('sourceSummary'), currentLoaded.objectType),
        metadataRow('targetId', currentBundle.packageConfig.sourceObjectIds.join(', ')),
        metadataRow('modelIds', currentLoaded.modelIds.join(', ') || '-'),
        metadataRow('topologyIds', currentLoaded.topologyIds.join(', ') || '-'),
        metadataRow('seedPlan', JSON.stringify(currentLoaded.seedPlan || '-')),
        metadataRow('stepCount', currentLoaded.stepCount ?? '-'),
        metadataRow('observables', currentLoaded.observableIds.join(', ') || '-'),
        metadataRow('bundleHash', currentBundle.packageResultHash),
        metadataRow(t('selected'), `${selectedCount} artifacts`),
        metadataRow('manifestHash', summary.manifestHash)
    ].join('');
}

function readinessCard(title, value, status = 'ok') {
    return `<article class="publication-ready-card" data-status="${status}">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(value)}</small>
    </article>`;
}

function renderReadiness() {
    const manifest = currentBundle.exportManifest;
    const benchmarkCount = manifest.benchmarkReportHashes.length || (currentBundle.fileContents['validation/benchmark_report.json'] ? JSON.parse(currentBundle.fileContents['validation/benchmark_report.json']).length : 0);
    const status = currentBundle.readinessLevel === 'exploratory' ? 'warn' : 'ok';
    els.readinessCards.innerHTML = [
        readinessCard('Readiness', currentBundle.readinessLevel, status),
        readinessCard('Validation', manifest.validationReportHashes.length ? 'included' : 'missing', manifest.validationReportHashes.length ? 'ok' : 'warn'),
        readinessCard('Reproducibility', currentBundle.provenanceRecord.rngMetadata.deterministicReplay || 'not checked', 'ok'),
        readinessCard('Benchmark', `${benchmarkCount} recorded`, benchmarkCount ? 'ok' : 'warn'),
        readinessCard(t('missingMetadata'), currentBundle.warnings.filter((entry) => entry.warningId.includes('missing')).length || 'none', currentBundle.warnings.some((entry) => entry.warningId.includes('missing')) ? 'warn' : 'ok')
    ].join('');
    const warnings = currentBundle.warnings;
    els.publicationWarnings.innerHTML = warnings.length
        ? warnings.map((entry) => `<article class="warning-item ${entry.severity}"><strong>${escapeHtml(entry.severity)}: ${escapeHtml(entry.message)}</strong><p>${escapeHtml(entry.recommendation)}</p></article>`).join('')
        : `<p>${escapeHtml(t('noWarnings'))}</p>`;
}

function renderFigurePreview() {
    const figure = currentBundle.figures[0];
    els.figurePreview.innerHTML = `
        <span class="readiness-badge ${escapeHtml(currentBundle.readinessLevel)}">${escapeHtml(currentBundle.readinessLevel)}</span>
        <strong>${escapeHtml(figure.title)}</strong>
        <p>${escapeHtml(figure.caption)}</p>
        <pre>${escapeHtml(JSON.stringify({
            figureId: figure.figureId,
            sourceDataPath: figure.sourceDataPath,
            figureHash: figure.figureHash,
            warnings: figure.warnings.map((entry) => entry.warningId)
        }, null, 2))}</pre>
    `;
}

function renderTablePreview() {
    const table = currentBundle.tables[0];
    const rows = rowsForTable(table.tableType, currentLoaded, null, currentBundle.exportManifest).slice(0, 8);
    if (!rows.length) {
        els.tablePreview.textContent = 'No table rows for this source.';
        return;
    }
    const columns = Object.keys(rows[0]);
    els.tablePreview.innerHTML = `
        <strong>${escapeHtml(table.title)}</strong>
        <table>
            <thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead>
            <tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
    `;
}

function renderDocumentationPreview() {
    els.documentationPreview.innerHTML = `
        <p>${escapeHtml(t('readmePreview'))}</p>
        <pre>${escapeHtml(currentBundle.methodsSummary.editableMarkdown.slice(0, 1400))}</pre>
    `;
}

function renderCitationPreview() {
    els.citationPreview.innerHTML = `
        <strong>${escapeHtml(currentBundle.citationMetadata.title)}</strong>
        <p>${escapeHtml(currentBundle.citationMetadata.suggestedCitationText)}</p>
        <pre>${escapeHtml(currentBundle.citationMetadata.bibtex)}</pre>
    `;
}

function renderProvenancePreview() {
    els.provenancePreview.innerHTML = `
        <p>${escapeHtml(t('provenancePreview'))}</p>
        <pre>${escapeHtml(JSON.stringify({
            provenanceId: currentBundle.provenanceRecord.provenanceId,
            sourceObjects: currentBundle.provenanceRecord.sourceObjects,
            transformationCount: currentBundle.provenanceRecord.transformations.length,
            provenanceHash: currentBundle.provenanceRecord.provenanceHash
        }, null, 2))}</pre>
    `;
}

function renderManifestPreview() {
    if (!currentBundle) {
        els.manifestPreview.textContent = t('manifestPreview');
        return;
    }
    els.manifestPreview.innerHTML = `
        <span class="readiness-badge ${escapeHtml(currentBundle.readinessLevel)}">${escapeHtml(currentBundle.readinessLevel)}</span>
        <pre>${escapeHtml(JSON.stringify({
            bundleId: currentBundle.exportManifest.bundleId,
            fileCount: currentBundle.exportManifest.includedFiles.length,
            manifestHash: currentBundle.exportManifest.manifestHash,
            warnings: currentBundle.exportManifest.warnings.length
        }, null, 2))}</pre>
    `;
}

function loadPastedOrLink() {
    try {
        const raw = els.linkInput.value.trim() || els.pasteJsonInput.value.trim();
        const parsed = parseSharedInput(raw);
        setLoaded(normalizeLoadedObject(parsed, 'manual'));
    } catch (error) {
        els.bundleText.value = t('invalidInput', { message: error?.message || String(error) });
    }
}

function setupEvents() {
    els.languageSelect.addEventListener('change', () => setLanguage(els.languageSelect.value));
    installLabLanguageMenu({ select: els.languageSelect, setLanguage });
    els.shareModeButton.addEventListener('click', () => setMode('guided'));
    els.researchModeButton.addEventListener('click', () => setMode('research'));
    els.generateBundleButton.addEventListener('click', generateBundle);
    els.downloadBundleButton.addEventListener('click', () => downloadText('topoboard-publication-bundle.json', bundleToDownloadJson(currentBundle), 'application/json'));
    els.downloadManifestButton.addEventListener('click', () => downloadText('topoboard-publication-manifest.json', JSON.stringify(currentBundle.exportManifest, null, 2), 'application/json'));
    els.downloadReadmeButton.addEventListener('click', () => downloadText('README.md', currentBundle.fileContents['README.md'] || '', 'text/markdown'));
    els.downloadCsvButton.addEventListener('click', () => downloadText('observable_time_series.csv', currentBundle.fileContents['data/observable_time_series.csv'] || toCsv([]), 'text/csv'));
    els.copyCitationButton.addEventListener('click', async () => {
        const text = currentBundle.citationMetadata.suggestedCitationText;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            els.bundleText.value = text;
        }
        els.citationPreview.insertAdjacentHTML('afterbegin', `<p>${escapeHtml(t('copiedCitation'))}</p>`);
    });
    els.loadPastedButton.addEventListener('click', loadPastedOrLink);
    els.loadSampleButton.addEventListener('click', () => setLoaded(createDefaultPublicationSource()));
    els.purposeSelect.addEventListener('change', () => {
        applyDefaultArtifacts();
        generateBundle();
    });
    [
        els.figureTypeSelect,
        els.figureFormatSelect,
        els.figureTitleInput,
        els.figureCaptionInput,
        els.tableTypeSelect,
        els.tableFormatSelect,
        els.tableTitleInput,
        els.citationTitleInput,
        els.creatorsInput,
        els.projectUrlInput,
        els.repositoryUrlInput,
        els.licenseSelect,
        els.keywordsInput,
        els.customLicenseInput
    ].forEach((input) => input.addEventListener('input', generateBundle));
    els.licenseSelect.addEventListener('change', generateBundle);
    els.jsonFileInput.addEventListener('change', async () => {
        const file = els.jsonFileInput.files?.[0];
        if (!file) return;
        try {
            const parsed = JSON.parse(await file.text());
            setLoaded(normalizeLoadedObject(parsed, file.name));
        } catch (error) {
            els.bundleText.value = t('invalidInput', { message: error?.message || String(error) });
        }
    });
}

function init() {
    renderOptions();
    renderStoredSources();
    setupEvents();
    setLanguage(language);
    setMode(currentMode);
    setLoaded(currentLoaded);
}

init();
