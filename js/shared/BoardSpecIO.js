import { createBoardSpec, exportBoardSpec, importBoardSpec } from './BoardSpec.js';
import { validateBoardSpec } from './BoardSpecValidator.js';
import { recordError, recordMetric, recordWarning } from './PerformanceAudit.js';

export const BOARD_SPEC_IO_LABELS = Object.freeze({
    exportBoardSpec: { en: 'Export BoardSpec', zh: '匯出 BoardSpec' },
    importBoardSpec: { en: 'Import BoardSpec', zh: '匯入 BoardSpec' },
    validateBoard: { en: 'Validate Board', zh: '驗證棋盤' },
    boardValid: { en: 'Board valid', zh: '棋盤有效' },
    boardInvalid: { en: 'Board invalid', zh: '棋盤無效' }
});

export const IMPORTED_BOARD_POLICY = Object.freeze({
    access: 'research_debug',
    steamVisible: false,
    publicRoomsAllowed: false,
    rankedRoomsAllowed: false,
    labsAllowedBeforeValidation: false
});

let currentBoardSpec = null;

export function setCurrentBoardSpec(boardSpec) {
    currentBoardSpec = createBoardSpec(boardSpec);
    return currentBoardSpec;
}

export function exportCurrentBoardSpec() {
    return currentBoardSpec ? createBoardSpec(currentBoardSpec) : null;
}

function fileNameForBoard(boardSpec) {
    const safeId = String(boardSpec?.id || 'topoboard-board')
        .replace(/[^a-z0-9._-]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        || 'topoboard-board';
    return `${safeId}.board-spec.json`;
}

export function downloadBoardSpecJson(boardSpec) {
    const safeBoardSpec = createBoardSpec(boardSpec);
    const blob = new Blob([exportBoardSpec(safeBoardSpec)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileNameForBoard(safeBoardSpec);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    recordMetric('board-spec', 'exported-sites', safeBoardSpec.sites.length);
    return safeBoardSpec;
}

export async function importBoardSpecJson(file) {
    if (!file) throw new TypeError('A BoardSpec JSON file is required.');
    const text = await file.text();
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (error) {
        recordError('board-spec import', 'BoardSpec JSON parse failed.', { message: error?.message || String(error) });
        throw error;
    }
    const boardSpec = importBoardSpec(parsed);
    boardSpec.metadata = {
        ...(boardSpec.metadata || {}),
        imported: true,
        importedAt: new Date().toISOString(),
        importedFileName: file.name || '',
        policy: IMPORTED_BOARD_POLICY
    };
    const validation = validateImportedBoardSpec(boardSpec);
    if (!validation.ok) {
        recordWarning('board-spec import', 'Imported BoardSpec failed validation.', {
            id: boardSpec.id,
            errors: validation.errors
        });
    }
    setCurrentBoardSpec(boardSpec);
    return { boardSpec, validation };
}

export function validateImportedBoardSpec(boardSpec, options = {}) {
    const result = validateBoardSpec(boardSpec, {
        maxSites: options.maxSites ?? 20000,
        allowDisconnected: options.allowDisconnected === true,
        ...options.validatorOptions
    });
    const stats = result.stats || {};
    const tooLarge = stats.siteCount > (options.maxSites ?? 20000) || stats.edgeCount > (options.maxEdges ?? 100000);
    if (tooLarge) {
        result.errors.push('Imported board is too large for safe public use.');
        result.ok = false;
    }
    return {
        ...result,
        importedPolicy: IMPORTED_BOARD_POLICY
    };
}
