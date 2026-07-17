import {
    explainComputeLimit,
    getComputePolicy,
    shouldRejectOversizedBoard,
    shouldRunInChunks,
    shouldUseWorker
} from './ComputePolicy.js';
import {
    endTimer,
    recordError,
    recordMetric,
    recordWarning,
    startTimer
} from './PerformanceAudit.js';
import { getSharedWorkerPool } from './worker/WorkerPool.js';
import { COMPUTE_WORKER_JOB_TYPES } from './worker/ComputeJobHandlers.js';

export const COMPUTE_TASK_MESSAGES = Object.freeze({
    cancelled: {
        en: 'Task cancelled.',
        zh: '任務已取消。'
    },
    exceeded: {
        en: 'Task exceeded safe limits.',
        zh: '任務超出安全限制。'
    },
    background: {
        en: 'Running in background...',
        zh: '背景執行中...'
    },
    progress: {
        en: 'Progress: {percent}%',
        zh: '進度：{percent}%'
    }
});

const activeTasks = new Map();

function localized(key, lang = 'en', replacements = {}) {
    const entry = COMPUTE_TASK_MESSAGES[key] || COMPUTE_TASK_MESSAGES.exceeded;
    const text = String(lang).toLowerCase().startsWith('zh') ? entry.zh : entry.en;
    return Object.entries(replacements).reduce(
        (value, [name, replacement]) => value.replace(`{${name}}`, String(replacement)),
        text
    );
}

function now() {
    return globalThis.performance?.now?.() ?? Date.now();
}

function nextFrame() {
    return new Promise((resolve) => {
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
        else setTimeout(resolve, 0);
    });
}

function idleOrFrame() {
    return new Promise((resolve) => {
        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(() => resolve(), { timeout: 50 });
        } else {
            nextFrame().then(resolve);
        }
    });
}

function isAbortError(error) {
    return error?.name === 'AbortError' || error?.code === 'ABORT_ERR';
}

function abortError(message = 'Task cancelled.') {
    const error = new Error(message);
    error.name = 'AbortError';
    return error;
}

function throwIfAborted(signal) {
    if (signal?.aborted) throw abortError();
}

function estimateStats(estimate = {}, payload = {}) {
    return {
        siteCount: estimate.siteCount ?? estimate.sites ?? payload.siteCount ?? payload.sites ?? 0,
        edgeCount: estimate.edgeCount ?? estimate.edges ?? payload.edgeCount ?? payload.edges ?? 0,
        visibleObjects: estimate.visibleObjects ?? estimate.drawObjects ?? payload.visibleObjects ?? payload.drawObjects ?? 0
    };
}

function workerAvailable() {
    return typeof Worker !== 'undefined';
}

function nodeWorkerAllowed(policy) {
    return Boolean(policy.allowNodeWorkers && globalThis.process?.versions?.node);
}

const WORKER_JOB_BY_TASK_TYPE = Object.freeze({
    board_validate: 'validateBoardSpec',
    adjacency_build: 'buildAdjacencyFromCoordinateRules',
    pathfinding: 'computeShortestPaths',
    '4d_projection': 'compute4DProjection',
    lab_step: 'runLabSteps',
    lab_scan: 'runLabSteps',
    life_step: 'runLifeSteps',
    export_compute: 'computeResearchObservables'
});

function genericWorkerJobType(task) {
    if (task?.allowGenericWorker === false) return '';
    const explicit = task.workerJobType || task.jobType;
    const mapped = explicit || WORKER_JOB_BY_TASK_TYPE[task.type];
    return COMPUTE_WORKER_JOB_TYPES.includes(mapped) ? mapped : '';
}

function platformComputeAvailable(policy) {
    return Boolean(
        (policy.allowUtilityProcess || policy.allowNodeWorkers)
        && globalThis.topoboardCompute
        && typeof globalThis.topoboardCompute.runJob === 'function'
    );
}

function chooseMode(task) {
    const { type, estimate, runSync, runChunked, runWorker } = task;
    const policy = getComputePolicy();
    const wantsWorker = shouldUseWorker(type, estimate);
    const genericJobType = genericWorkerJobType(task);
    const workerCapable = Boolean(
        typeof runWorker === 'function'
        || genericJobType
    );
    const hasWorkerBackend = platformComputeAvailable(policy) || workerAvailable() || nodeWorkerAllowed(policy) || Boolean(genericJobType);
    if (wantsWorker && workerCapable && hasWorkerBackend) {
        return 'worker';
    }
    if (shouldRunInChunks(type, estimate) && typeof runChunked === 'function') return 'chunked';
    if (typeof runSync === 'function') return 'sync';
    if (typeof runChunked === 'function') return 'chunked';
    if (workerCapable && hasWorkerBackend) return 'worker';
    return 'none';
}

async function runTaskMode(mode, task, context) {
    if (mode === 'worker') {
        if (typeof task.runWorker === 'function') return task.runWorker(context);
        return runGenericWorkerTask(task, context);
    }
    if (mode === 'chunked') return task.runChunked(context);
    if (mode === 'sync') return task.runSync(context);
    throw new TypeError('Compute task requires runSync, runChunked, or runWorker.');
}

async function runGenericWorkerTask(task, context) {
    const jobType = genericWorkerJobType(task);
    if (!jobType) throw new TypeError(`No generic worker job is registered for ${task.type}.`);
    const options = {
        ...(task.workerOptions || {}),
        signal: context.signal,
        onProgress: (progress) => context.progress(progress)
    };
    if (platformComputeAvailable(context.policy)) {
        const abortHandler = () => {
            try { globalThis.topoboardCompute.cancelJob?.(context.id); } catch {}
        };
        try {
            context.signal?.addEventListener?.('abort', abortHandler, { once: true });
            const result = await globalThis.topoboardCompute.runJob({
                jobId: context.id,
                jobType,
                payload: task.payload,
                options: task.workerOptions || {}
            });
            if (result?.ok) return result.result;
            recordWarning('compute task', 'Steam compute backend failed; falling back to renderer worker pool.', {
                id: context.id,
                type: task.type,
                error: result?.error || result?.message || 'unknown'
            });
        } catch (error) {
            recordWarning('compute task', 'Steam compute backend threw; falling back to renderer worker pool.', {
                id: context.id,
                type: task.type,
                error: error?.message || String(error)
            });
        } finally {
            context.signal?.removeEventListener?.('abort', abortHandler);
        }
    }
    return getSharedWorkerPool().runJob(jobType, task.payload, options);
}

function normalizeProgress(progress, total) {
    const completed = Number(progress?.completed ?? progress ?? 0);
    const max = Number(progress?.total ?? total ?? 100);
    const percent = max > 0 ? Math.max(0, Math.min(100, Math.round((completed / max) * 100))) : 0;
    return { completed, total: max, percent };
}

function notifyProgress(task, progress) {
    const normalized = normalizeProgress(progress, task.estimate?.total);
    task.onProgress?.(normalized);
    recordMetric('compute task progress', `${task.id}:progress`, normalized.percent, {
        type: task.type,
        completed: normalized.completed,
        total: normalized.total
    });
    return normalized;
}

export async function submitComputeTask(task = {}) {
    const id = String(task.id || `task:${Date.now()}:${Math.random().toString(36).slice(2)}`);
    const type = String(task.type || 'export_compute');
    const estimate = task.estimate || {};
    const policy = getComputePolicy();
    const signal = task.signal;
    const startedAt = now();
    const timer = startTimer(`compute:${id}`, { type });
    const limitCheck = shouldRejectOversizedBoard(estimateStats(estimate, task.payload));

    if (type === 'lab_scan' && policy.maxScanJobs <= 0) {
        const error = new Error(explainComputeLimit('scanDisabled', task.language));
        recordWarning('compute task', error.message, { id, type, policy: policy.edition });
        task.onError?.(error);
        return {
            ok: false,
            id,
            type,
            mode: 'rejected',
            cancelled: false,
            error,
            message: error.message,
            policy
        };
    }

    if (limitCheck.reject) {
        const error = new Error(explainComputeLimit(policy.edition === 'web-lite' ? 'webTooLarge' : 'oversizedBoard', task.language));
        recordWarning('compute task', error.message, { id, type, problems: limitCheck.problems, policy: policy.edition });
        task.onError?.(error);
        return {
            ok: false,
            id,
            type,
            mode: 'rejected',
            cancelled: false,
            error,
            message: localized('exceeded', task.language),
            problems: limitCheck.problems,
            policy
        };
    }

    try {
        throwIfAborted(signal);
        const mode = chooseMode({ ...task, type, estimate });
        if (mode === 'none') throw new TypeError('Compute task requires runSync, runChunked, or runWorker.');

        const controller = {
            id,
            type,
            mode,
            policy,
            startedAt,
            cancelled: false
        };
        activeTasks.set(id, controller);

        const context = {
            id,
            type,
            payload: task.payload,
            estimate,
            policy,
            signal,
            mode,
            yieldToUI: nextFrame,
            yieldLowPriority: idleOrFrame,
            throwIfAborted: () => throwIfAborted(signal),
            progress: (progress) => notifyProgress(task, progress)
        };

        if (mode === 'chunked') {
            recordWarning('compute task', explainComputeLimit('chunked', task.language), { id, type, policy: policy.edition });
        } else if (mode === 'worker') {
            recordMetric('compute task', `${id}:background`, 1, { type, message: localized('background', task.language) });
        }

        const value = await runTaskMode(mode, task, context);
        throwIfAborted(signal);

        const durationMs = endTimer(timer, { category: 'compute task', name: type }) ?? (now() - startedAt);
        activeTasks.delete(id);
        const result = {
            ok: true,
            id,
            type,
            mode,
            value,
            durationMs,
            policy
        };
        task.onComplete?.(result);
        return result;
    } catch (error) {
        const durationMs = endTimer(timer, { category: 'compute task', name: type }) ?? (now() - startedAt);
        activeTasks.delete(id);
        const cancelled = signal?.aborted || isAbortError(error);
        const message = cancelled ? localized('cancelled', task.language) : (error?.message || String(error));
        if (cancelled) {
            recordWarning('compute task', message, { id, type, durationMs });
        } else {
            recordError('compute task', message, { id, type, durationMs });
        }
        const result = {
            ok: false,
            id,
            type,
            mode: 'failed',
            cancelled,
            error,
            message,
            durationMs,
            policy
        };
        task.onError?.(error, result);
        return result;
    }
}

export function getActiveComputeTasks() {
    return [...activeTasks.values()].map((task) => ({ ...task }));
}

export function isComputeTaskRunning(id) {
    return activeTasks.has(String(id));
}
