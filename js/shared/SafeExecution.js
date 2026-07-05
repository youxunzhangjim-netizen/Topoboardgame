import { boardSpecFromLegacyBoard, createBoardSpec } from './BoardSpec.js';
import { validateBoardSpec } from './BoardSpecValidator.js';
import {
    PERFORMANCE_THRESHOLDS,
    endTimer,
    estimateMemoryRisk,
    recordError,
    recordMetric,
    recordWarning,
    startTimer
} from './PerformanceAudit.js';
import { getFeatureStatus, registerFeatureStatus, resolveFeatureStatus } from './FeatureStatusRegistry.js';
import { STEAM_BOARD_LIMITS, STEAM_LAB_LIMITS } from './SteamSafetyLimits.js';

export const BOARD_PERFORMANCE_BUDGET = Object.freeze({
    generationWarningMs: PERFORMANCE_THRESHOLDS.boardGenerationWarningMs,
    generationDangerMs: PERFORMANCE_THRESHOLDS.boardGenerationDangerMs,
    renderWarningMs: PERFORMANCE_THRESHOLDS.renderWarningMs,
    renderDangerMs: PERFORMANCE_THRESHOLDS.renderDangerMs,
    maxSitesByDimension: Object.freeze(
        Object.fromEntries(Object.entries(STEAM_BOARD_LIMITS).map(([dimension, limits]) => [
            dimension,
            limits.maxPlayableSites
        ]))
    ),
    maxEdges: 150000,
    maxDrawObjects: 50000
});

export const LAB_PERFORMANCE_BUDGET = Object.freeze({
    stepWarningMs: PERFORMANCE_THRESHOLDS.labStepWarningMs,
    stepDangerMs: PERFORMANCE_THRESHOLDS.labStepDangerMs,
    defaultChunkSize: 100,
    maxSynchronousIterations: 5000,
    maxSimpleStateVariables: STEAM_LAB_LIMITS.simpleMaxStateVariables,
    maxUpdateOperationsPerFrame: STEAM_LAB_LIMITS.maxUpdateOperationsPerFrame
});

function asBoardSpec(board, metadata) {
    if (board?.schema === 'topoboard.board.v0') return createBoardSpec(board);
    return boardSpecFromLegacyBoard(board, metadata);
}

function runtimeDeveloping(featureId, reason) {
    const current = getFeatureStatus(featureId) || { id: featureId, family: 'board' };
    registerFeatureStatus({
        ...current,
        status: 'developing',
        reasonEn: reason,
        reasonZh: `執行時安全檢查失敗：${reason}`,
        steamVisible: false
    });
}

export function safeGenerateBoard({
    featureId = 'board:unknown',
    generate,
    fallback = null,
    metadata = {},
    validation = {},
    budget = BOARD_PERFORMANCE_BUDGET
} = {}) {
    const status = resolveFeatureStatus(featureId, { steam: true });
    if (!status.visible && typeof fallback === 'function') {
        return { ok: false, usedFallback: true, board: fallback(), reason: status.warning || 'Feature is hidden.' };
    }
    const timer = startTimer(`generate:${featureId}`);
    try {
        const rawBoard = generate();
        const board = asBoardSpec(rawBoard, metadata);
        const durationMs = endTimer(timer, { category: 'board generation', name: featureId });
        const result = validateBoardSpec(board, validation);
        estimateMemoryRisk({ sites: result.stats.siteCount, edges: result.stats.edgeCount });
        const tooSlow = durationMs > budget.generationDangerMs;
        const tooLarge = result.stats.edgeCount > budget.maxEdges;
        if (!result.ok || tooSlow || tooLarge) {
            const reason = !result.ok
                ? result.errors.join(' ')
                : tooSlow
                    ? `Generation took ${durationMs.toFixed(1)} ms.`
                    : `Board has ${result.stats.edgeCount} edges.`;
            runtimeDeveloping(featureId, reason);
            recordWarning('board safety', `${featureId} is using a fallback.`, { reason, validation: result });
            return {
                ok: false,
                usedFallback: typeof fallback === 'function',
                board: typeof fallback === 'function' ? fallback() : board,
                validation: result,
                reason
            };
        }
        return { ok: true, usedFallback: false, board, validation: result, durationMs };
    } catch (error) {
        endTimer(timer, { category: 'board generation', name: featureId });
        const reason = error?.message || String(error);
        runtimeDeveloping(featureId, reason);
        recordError('board generation', `${featureId} generation failed.`, { reason });
        return {
            ok: false,
            usedFallback: typeof fallback === 'function',
            board: typeof fallback === 'function' ? fallback() : null,
            validation: null,
            reason
        };
    }
}

export function safeRenderBoard({ featureId = 'board:unknown', render, fallbackRender = null } = {}) {
    const timer = startTimer(`render:${featureId}`);
    try {
        const value = render();
        const durationMs = endTimer(timer, { category: 'render', name: featureId });
        if (durationMs > BOARD_PERFORMANCE_BUDGET.renderDangerMs && fallbackRender) {
            recordWarning('render', `${featureId} exceeded the render budget; using fallback rendering.`, { durationMs });
            return { ok: false, usedFallback: true, value: fallbackRender(), durationMs };
        }
        return { ok: true, usedFallback: false, value, durationMs };
    } catch (error) {
        endTimer(timer, { category: 'render', name: featureId });
        recordError('render', `${featureId} render failed.`, { message: error?.message || String(error) });
        return { ok: false, usedFallback: Boolean(fallbackRender), value: fallbackRender?.() ?? null, error };
    }
}

export async function safeLabStep({
    labId = 'lab:unknown',
    step,
    fallback = null,
    stateVariableCount = 0
} = {}) {
    const timer = startTimer(`lab-step:${labId}`);
    try {
        const value = await step();
        const durationMs = endTimer(timer, { category: 'lab step', name: labId });
        recordMetric('lab', `${labId}:state-variables`, stateVariableCount);
        estimateMemoryRisk({ stateVariables: stateVariableCount });
        if (durationMs > LAB_PERFORMANCE_BUDGET.stepDangerMs) {
            runtimeDeveloping(labId, `Lab step took ${durationMs.toFixed(1)} ms.`);
            return { ok: false, usedFallback: Boolean(fallback), value: await fallback?.(), durationMs };
        }
        return { ok: true, usedFallback: false, value, durationMs };
    } catch (error) {
        endTimer(timer, { category: 'lab step', name: labId });
        recordError('lab step', `${labId} failed.`, { message: error?.message || String(error) });
        return { ok: false, usedFallback: Boolean(fallback), value: await fallback?.(), error };
    }
}

export async function runChunked(items, iteratee, {
    chunkSize = LAB_PERFORMANCE_BUDGET.defaultChunkSize,
    signal = null,
    onProgress = null
} = {}) {
    const list = Array.from(items || []);
    const results = [];
    for (let start = 0; start < list.length; start += chunkSize) {
        if (signal?.aborted) return { cancelled: true, results };
        const end = Math.min(list.length, start + chunkSize);
        for (let index = start; index < end; index += 1) {
            results.push(await iteratee(list[index], index));
        }
        onProgress?.({ completed: end, total: list.length });
        if (end < list.length) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return { cancelled: false, results };
}

export async function lazyLoadFeature(importer, featureId = 'feature:unknown') {
    const timer = startTimer(`lazy-load:${featureId}`);
    try {
        const module = await importer();
        endTimer(timer, { category: 'initialization', name: featureId });
        return { ok: true, module };
    } catch (error) {
        endTimer(timer, { category: 'initialization', name: featureId });
        recordError('initialization', `${featureId} failed to load.`, { message: error?.message || String(error) });
        return { ok: false, module: null, error };
    }
}
