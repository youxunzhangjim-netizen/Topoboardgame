import { boardSpecFromLegacyBoard } from '../shared/BoardSpec.js';
import { validateBoardSpec } from '../shared/BoardSpecValidator.js';
import {
    endTimer,
    estimateMemoryRisk,
    recordError,
    recordMetric,
    recordWarning,
    startTimer
} from '../shared/PerformanceAudit.js';
import { STEAM_LAB_LIMITS } from '../shared/SteamSafetyLimits.js';

export const SAFE_LAB_DEFAULTS = Object.freeze({
    maxStepMs: 100,
    maxInitMs: 1500,
    maxSites: 20000,
    maxEdges: 100000,
    maxStateVariables: STEAM_LAB_LIMITS.simpleMaxStateVariables,
    chunkSize: 1000,
    yieldToUI: true
});

export const SAFE_LAB_MESSAGES = Object.freeze({
    paused: {
        en: 'Lab paused for performance.',
        zh: 'Lab 因效能原因已暫停。'
    },
    slowStep: {
        en: 'Lab step took too long.',
        zh: 'Lab 步驟耗時過久。'
    },
    reduceSize: {
        en: 'Reduce board size or switch to Research mode.',
        zh: '請降低棋盤尺寸，或切換到研究模式。'
    },
    cancelled: {
        en: 'Lab run cancelled.',
        zh: 'Lab 執行已取消。'
    }
});

const runtime = {
    paused: false,
    cancelled: false,
    running: false,
    activeRunId: 0,
    stats: {
        initializedLabs: 0,
        initializationFailures: 0,
        completedSteps: 0,
        failedSteps: 0,
        cancelledRuns: 0,
        lastInitMs: 0,
        lastStepMs: 0,
        maxInitMs: 0,
        maxStepMs: 0,
        totalStepMs: 0,
        sites: 0,
        edges: 0,
        stateVariables: 0,
        warnings: []
    }
};

function settings(options = {}) {
    return { ...SAFE_LAB_DEFAULTS, ...options };
}

function localizedMessage(key, language = 'en') {
    const message = SAFE_LAB_MESSAGES[key] || SAFE_LAB_MESSAGES.paused;
    return String(language).toLowerCase().startsWith('zh') ? message.zh : message.en;
}

function warning(key, options, details = null) {
    const item = {
        key,
        message: localizedMessage(key, options.language),
        messageEn: SAFE_LAB_MESSAGES[key]?.en || key,
        messageZh: SAFE_LAB_MESSAGES[key]?.zh || key,
        details
    };
    runtime.stats.warnings.push(item);
    options.onWarning?.(item);
    recordWarning('lab safety', item.messageEn, { ...details, messageZh: item.messageZh });
    return item;
}

function countStateVariables(value, limit, seen = new WeakSet()) {
    if (value == null || typeof value !== 'object') return 1;
    if (seen.has(value)) return 0;
    seen.add(value);
    let count = 0;
    const stack = [value];
    while (stack.length && count <= limit) {
        const current = stack.pop();
        if (current == null || typeof current !== 'object') {
            count += 1;
            continue;
        }
        if (current !== value) {
            if (seen.has(current)) continue;
            seen.add(current);
        }
        if (current instanceof Map) {
            count += current.size;
            for (const entry of current.values()) if (entry && typeof entry === 'object') stack.push(entry);
        } else if (current instanceof Set) {
            count += current.size;
        } else if (ArrayBuffer.isView(current)) {
            count += current.length;
        } else {
            const values = Array.isArray(current) ? current : Object.values(current);
            count += values.length;
            for (const entry of values) if (entry && typeof entry === 'object') stack.push(entry);
        }
    }
    return count;
}

function findBoard(lab, params) {
    return lab?.boardSpec || lab?.board || lab?.topology?.boardSpec
        || params?.boardSpec || params?.board || null;
}

function toBoardSpec(board, params = {}) {
    if (!board) return null;
    if (board.schema === 'topoboard.board.v0') return board;
    if (!Array.isArray(board.sites) || !Array.isArray(board.edges)) return null;
    return boardSpecFromLegacyBoard(board, params.boardMetadata || board.metadata || {});
}

function validateLabResources(lab, params, options) {
    const board = findBoard(lab, params);
    const boardSpec = toBoardSpec(board, params);
    const rawSites = boardSpec?.sites?.length ?? board?.sites?.length ?? 0;
    const rawEdges = boardSpec?.edges?.length ?? board?.edges?.length ?? 0;
    const stateVariables = Number(params?.stateVariableCount)
        || countStateVariables(lab?.state ?? lab?.getState?.() ?? lab, options.maxStateVariables + 1);
    const errors = [];
    let validation = null;

    if (boardSpec) {
        validation = validateBoardSpec(boardSpec, {
            allowDisconnected: Boolean(params?.allowDisconnected),
            maxSites: options.maxSites,
            debug: false
        });
        if (!validation.ok) errors.push(...validation.errors);
    } else if (board) {
        errors.push('Lab board cannot be adapted to BoardSpec for validation.');
    }
    if (rawSites > options.maxSites) errors.push(`Lab has ${rawSites} sites; limit is ${options.maxSites}.`);
    if (rawEdges > options.maxEdges) errors.push(`Lab has ${rawEdges} edges; limit is ${options.maxEdges}.`);
    if (stateVariables > options.maxStateVariables) {
        errors.push(`Lab has at least ${stateVariables} state variables; limit is ${options.maxStateVariables}.`);
    }

    runtime.stats.sites = rawSites;
    runtime.stats.edges = rawEdges;
    runtime.stats.stateVariables = stateVariables;
    recordMetric('lab', 'sites', rawSites);
    recordMetric('lab', 'edges', rawEdges);
    recordMetric('lab', 'state-variables', stateVariables);
    estimateMemoryRisk({ sites: rawSites, edges: rawEdges, stateVariables });
    return { ok: errors.length === 0, errors, validation, sites: rawSites, edges: rawEdges, stateVariables };
}

function nextFrame() {
    return new Promise((resolve) => {
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
        else setTimeout(resolve, 0);
    });
}

function callLabAction(lab, action) {
    if (typeof action === 'function') return action(lab);
    if (typeof lab?.step === 'function') return lab.step(action);
    if (typeof lab?.applyAction === 'function') return lab.applyAction(action);
    throw new TypeError('Lab action requires a function, lab.step(), or lab.applyAction().');
}

export async function initializeLabSafely(labFactory, params = {}, options = {}) {
    const config = settings(options);
    const timer = startTimer('safe-lab-initialize');
    runtime.cancelled = false;
    try {
        const lab = await (typeof labFactory === 'function' ? labFactory(params) : labFactory?.create?.(params));
        const durationMs = endTimer(timer, { category: 'lab initialization', name: params.labId || 'lab' });
        runtime.stats.lastInitMs = durationMs;
        runtime.stats.maxInitMs = Math.max(runtime.stats.maxInitMs, durationMs);
        const resources = validateLabResources(lab, params, config);
        const tooSlow = durationMs > config.maxInitMs;
        if (!lab || tooSlow || !resources.ok) {
            runtime.paused = true;
            runtime.stats.initializationFailures += 1;
            const messages = [];
            if (tooSlow) messages.push(warning('paused', config, { durationMs, maxInitMs: config.maxInitMs }));
            if (!resources.ok) messages.push(warning('reduceSize', config, { errors: resources.errors }));
            return { ok: false, lab: null, durationMs, resources, messages };
        }
        runtime.paused = false;
        runtime.stats.initializedLabs += 1;
        return { ok: true, lab, durationMs, resources, messages: [] };
    } catch (error) {
        const durationMs = endTimer(timer, { category: 'lab initialization', name: params.labId || 'lab' });
        runtime.paused = true;
        runtime.stats.initializationFailures += 1;
        recordError('lab initialization', 'Lab initialization failed.', { message: error?.message || String(error) });
        return { ok: false, lab: null, durationMs, error, messages: [warning('paused', config)] };
    }
}

export async function runLabStepSafely(lab, action, options = {}) {
    const config = settings(options);
    if (runtime.cancelled) {
        return { ok: false, cancelled: true, failed: false, messages: [warning('cancelled', config)] };
    }
    if (runtime.paused && !options.ignorePause) {
        return { ok: false, paused: true, failed: false, messages: [warning('paused', config)] };
    }

    const timer = startTimer('safe-lab-step');
    try {
        const value = await callLabAction(lab, action);
        const durationMs = endTimer(timer, { category: 'lab step', name: options.labId || 'lab' });
        runtime.stats.lastStepMs = durationMs;
        runtime.stats.maxStepMs = Math.max(runtime.stats.maxStepMs, durationMs);
        runtime.stats.totalStepMs += durationMs;
        runtime.stats.completedSteps += 1;
        if (durationMs > config.maxStepMs) {
            runtime.paused = true;
            return {
                ok: false,
                paused: true,
                failed: false,
                value,
                durationMs,
                messages: [
                    warning('slowStep', config, { durationMs, maxStepMs: config.maxStepMs }),
                    warning('paused', config, { durationMs })
                ]
            };
        }
        return { ok: true, value, durationMs, failed: false, messages: [] };
    } catch (error) {
        const durationMs = endTimer(timer, { category: 'lab step', name: options.labId || 'lab' });
        runtime.stats.failedSteps += 1;
        runtime.stats.lastStepMs = durationMs;
        recordError('lab step', 'Lab step failed and was contained.', { message: error?.message || String(error) });
        return { ok: false, failed: true, error, durationMs, messages: [] };
    }
}

export async function runManyStepsSafely(lab, count, options = {}) {
    const config = settings(options);
    const total = Math.max(0, Math.floor(Number(count) || 0));
    const chunkSize = Math.max(1, Math.floor(Number(config.chunkSize) || 1));
    const runId = ++runtime.activeRunId;
    runtime.running = true;
    runtime.cancelled = false;
    const results = [];
    let completed = 0;
    try {
        while (completed < total) {
            if (runtime.cancelled || runId !== runtime.activeRunId) {
                runtime.stats.cancelledRuns += 1;
                return { ok: false, cancelled: true, completed, results, messages: [warning('cancelled', config)] };
            }
            if (runtime.paused) return { ok: false, paused: true, completed, results, messages: [warning('paused', config)] };
            const end = Math.min(total, completed + chunkSize);
            while (completed < end) {
                const action = typeof options.actionFactory === 'function'
                    ? options.actionFactory(completed, lab)
                    : options.action;
                const result = await runLabStepSafely(lab, action, { ...config, ignorePause: false });
                results.push(result);
                if (!result.ok) return { ...result, completed, results };
                completed += 1;
            }
            options.onProgress?.({ completed, total });
            if (config.yieldToUI && completed < total) await nextFrame();
        }
        return { ok: true, cancelled: false, completed, results, messages: [] };
    } finally {
        if (runId === runtime.activeRunId) runtime.running = false;
    }
}

export function pauseLab() {
    runtime.paused = true;
    return getLabPerformanceStats();
}

export function resumeLab() {
    runtime.paused = false;
    runtime.cancelled = false;
    return getLabPerformanceStats();
}

export function cancelRunningLab() {
    runtime.cancelled = true;
    runtime.running = false;
    runtime.activeRunId += 1;
    return getLabPerformanceStats();
}

export function cancelLab() {
    return cancelRunningLab();
}

export function getLabPerformanceStats() {
    const completed = runtime.stats.completedSteps;
    return {
        paused: runtime.paused,
        cancelled: runtime.cancelled,
        running: runtime.running,
        ...runtime.stats,
        averageStepMs: completed ? runtime.stats.totalStepMs / completed : 0,
        warnings: runtime.stats.warnings.map((item) => ({ ...item }))
    };
}

export function resetLabPerformanceStats() {
    runtime.paused = false;
    runtime.cancelled = false;
    runtime.running = false;
    runtime.activeRunId += 1;
    runtime.stats = {
        initializedLabs: 0,
        initializationFailures: 0,
        completedSteps: 0,
        failedSteps: 0,
        cancelledRuns: 0,
        lastInitMs: 0,
        lastStepMs: 0,
        maxInitMs: 0,
        maxStepMs: 0,
        totalStepMs: 0,
        sites: 0,
        edges: 0,
        stateVariables: 0,
        warnings: []
    };
}
