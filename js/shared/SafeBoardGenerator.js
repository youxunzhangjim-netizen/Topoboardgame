import { boardSpecFromLegacyBoard, createBoardSpec } from './BoardSpec.js';
import { validateBoardSpec } from './BoardSpecValidator.js';
import {
    endTimer,
    estimateMemoryRisk,
    isPerformanceDebugEnabled,
    recordError,
    recordMetric,
    recordWarning,
    startTimer
} from './PerformanceAudit.js';
import { submitComputeTask } from './ComputeTaskScheduler.js';

export const SAFE_BOARD_FALLBACK_MESSAGE = Object.freeze({
    en: 'The selected board could not be loaded safely. A stable fallback was loaded.',
    zh: '所選棋盤無法安全載入，因此已改用穩定替代棋盤。'
});

export const SAFE_BOARD_GENERATOR_DEFAULTS = Object.freeze({
    id: 'board:unknown',
    timeoutWarningMs: 300,
    timeoutDangerMs: 1500,
    maxSites: 20000,
    maxEdges: 100000,
    validate: true,
    validatorOptions: Object.freeze({}),
    fallbackGenerator: null,
    fallbackParams: null
});

function normalizeOptions(options = {}) {
    return {
        ...SAFE_BOARD_GENERATOR_DEFAULTS,
        ...options,
        validatorOptions: {
            ...SAFE_BOARD_GENERATOR_DEFAULTS.validatorOptions,
            ...(options.validatorOptions || {})
        }
    };
}

function toBoardSpec(rawBoard, metadata = {}) {
    if (rawBoard?.schema === 'topoboard.board.v0') return createBoardSpec(rawBoard);
    return boardSpecFromLegacyBoard(rawBoard || {}, metadata);
}

function emptyStats() {
    return {
        siteCount: 0,
        edgeCount: 0,
        minDegree: 0,
        maxDegree: 0,
        averageDegree: 0,
        connectedComponents: 0
    };
}

function summarizeValidation(boardSpec, validation) {
    const siteCount = validation?.stats?.siteCount ?? boardSpec?.sites?.length ?? 0;
    const edgeCount = validation?.stats?.edgeCount ?? boardSpec?.edges?.length ?? 0;
    return {
        ...emptyStats(),
        ...(validation?.stats || {}),
        siteCount,
        edgeCount
    };
}

function limitErrors(stats, config) {
    const errors = [];
    if (stats.siteCount > config.maxSites) {
        errors.push(`Board has ${stats.siteCount} sites; limit is ${config.maxSites}.`);
    }
    if (stats.edgeCount > config.maxEdges) {
        errors.push(`Board has ${stats.edgeCount} edges; limit is ${config.maxEdges}.`);
    }
    return errors;
}

function warnForDuration(config, durationMs, warnings) {
    if (durationMs > config.timeoutDangerMs) {
        const message = `Board generation exceeded danger threshold: ${durationMs.toFixed(1)} ms.`;
        warnings.push(message);
        recordError('board generation', message, {
            id: config.id,
            durationMs,
            thresholdMs: config.timeoutDangerMs
        });
    } else if (durationMs > config.timeoutWarningMs) {
        const message = `Board generation exceeded warning threshold: ${durationMs.toFixed(1)} ms.`;
        warnings.push(message);
        recordWarning('board generation', message, {
            id: config.id,
            durationMs,
            thresholdMs: config.timeoutWarningMs
        });
    }
}

function maybeCallGenerator(generatorFn, params) {
    if (typeof generatorFn !== 'function') {
        throw new TypeError('generateBoardSafely requires a generator function.');
    }
    return generatorFn(params);
}

function fallbackResult(config, params, originalErrors, originalWarnings, originalError = null) {
    if (originalError && isPerformanceDebugEnabled()) {
        console.error(`[Topoboard safe board:${config.id}] Original generator failed.`, originalError);
    }
    if (typeof config.fallbackGenerator !== 'function') {
        return {
            ok: false,
            boardSpec: null,
            usedFallback: false,
            errors: originalErrors,
            warnings: originalWarnings,
            stats: emptyStats()
        };
    }

    const fallbackParams = config.fallbackParams ?? params;
    const fallbackWarnings = [
        ...originalWarnings,
        SAFE_BOARD_FALLBACK_MESSAGE.en
    ];
    try {
        const fallbackRaw = maybeCallGenerator(config.fallbackGenerator, fallbackParams);
        const fallbackBoardSpec = toBoardSpec(fallbackRaw, {
            id: `${config.id}:fallback`,
            metadata: { fallbackFor: config.id }
        });
        const fallbackValidation = config.validate
            ? validateBoardSpec(fallbackBoardSpec, {
                ...config.validatorOptions,
                maxSites: config.maxSites
            })
            : { ok: true, errors: [], warnings: [], stats: summarizeValidation(fallbackBoardSpec, null) };
        const stats = summarizeValidation(fallbackBoardSpec, fallbackValidation);
        const errors = [
            ...originalErrors,
            ...fallbackValidation.errors,
            ...limitErrors(stats, config)
        ];
        const ok = errors.length === originalErrors.length;
        if (!ok) {
            recordError('board generation', `${config.id} fallback board is not safe.`, { errors });
        } else {
            recordWarning('board generation', SAFE_BOARD_FALLBACK_MESSAGE.en, {
                id: config.id,
                messageZh: SAFE_BOARD_FALLBACK_MESSAGE.zh,
                originalErrors
            });
        }
        recordMetric('board', `${config.id}:fallback-sites`, stats.siteCount);
        recordMetric('board', `${config.id}:fallback-edges`, stats.edgeCount);
        estimateMemoryRisk({ sites: stats.siteCount, edges: stats.edgeCount });
        return {
            ok,
            boardSpec: ok ? fallbackBoardSpec : null,
            usedFallback: true,
            errors,
            warnings: fallbackWarnings,
            stats
        };
    } catch (fallbackError) {
        const message = fallbackError?.message || String(fallbackError);
        recordError('board generation', `${config.id} fallback generation failed.`, { message });
        return {
            ok: false,
            boardSpec: null,
            usedFallback: true,
            errors: [...originalErrors, message],
            warnings: fallbackWarnings,
            stats: emptyStats()
        };
    }
}

export function generateBoardSafely(generatorFn, params = {}, options = {}) {
    const config = normalizeOptions(options);
    const timer = startTimer(`safe-board:${config.id}`);
    const errors = [];
    const warnings = [];
    let durationMs = 0;

    try {
        const rawBoard = maybeCallGenerator(generatorFn, params);
        durationMs = endTimer(timer, { category: 'board generation', name: config.id }) ?? 0;
        warnForDuration(config, durationMs, warnings);

        const boardSpec = toBoardSpec(rawBoard, {
            id: config.id,
            metadata: { generatedSafely: true }
        });
        const validation = config.validate
            ? validateBoardSpec(boardSpec, {
                ...config.validatorOptions,
                maxSites: config.maxSites
            })
            : { ok: true, errors: [], warnings: [], stats: summarizeValidation(boardSpec, null) };
        const stats = summarizeValidation(boardSpec, validation);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
        errors.push(...limitErrors(stats, config));

        recordMetric('board', `${config.id}:sites`, stats.siteCount);
        recordMetric('board', `${config.id}:edges`, stats.edgeCount);
        estimateMemoryRisk({ sites: stats.siteCount, edges: stats.edgeCount });

        if (durationMs > config.timeoutDangerMs) {
            errors.push(`Board generation took ${durationMs.toFixed(1)} ms; danger threshold is ${config.timeoutDangerMs} ms.`);
        }
        if (errors.length) {
            return fallbackResult(config, params, errors, warnings);
        }
        return {
            ok: true,
            boardSpec,
            usedFallback: false,
            errors,
            warnings,
            stats
        };
    } catch (error) {
        durationMs = endTimer(timer, { category: 'board generation', name: config.id }) ?? durationMs;
        const message = error?.message || String(error);
        errors.push(message);
        warnForDuration(config, durationMs, warnings);
        recordError('board generation', `${config.id} generator threw.`, { message, durationMs });
        return fallbackResult(config, params, errors, warnings, error);
    }
}

export async function generateBoardSafelyAsync(generatorFn, params = {}, options = {}) {
    const config = normalizeOptions(options);
    const scheduled = await submitComputeTask({
        id: `safe-board:${config.id}`,
        type: 'board_generate',
        allowGenericWorker: false,
        language: options.language,
        signal: options.signal,
        estimate: {
            siteCount: options.estimatedSites ?? params.estimatedSites ?? params.siteCount ?? params.sites ?? 0,
            edgeCount: options.estimatedEdges ?? params.estimatedEdges ?? params.edgeCount ?? params.edges ?? 0,
            durationMs: config.timeoutWarningMs
        },
        onProgress: options.onProgress,
        runChunked: async (context) => {
            context.progress({ completed: 0, total: 2 });
            await context.yieldToUI();
            context.throwIfAborted();
            const result = generateBoardSafely(generatorFn, params, options);
            context.throwIfAborted();
            context.progress({ completed: 2, total: 2 });
            return result;
        },
        runSync: () => generateBoardSafely(generatorFn, params, options)
    });

    if (scheduled.ok) return scheduled.value;
    return {
        ok: false,
        boardSpec: null,
        usedFallback: false,
        errors: [scheduled.message || scheduled.error?.message || String(scheduled.error || 'Board generation failed.')],
        warnings: [],
        stats: emptyStats()
    };
}
