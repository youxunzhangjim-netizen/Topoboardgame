import { EDITION } from './EditionConfig.js';

export const COMPUTE_TASK_TYPES = Object.freeze([
    'board_generate',
    'board_validate',
    'adjacency_build',
    'pathfinding',
    '3d_projection',
    '4d_projection',
    'spacetime_resolve',
    'lab_step',
    'lab_scan',
    'life_step',
    'robot_search',
    'export_compute'
]);

const POLICIES = Object.freeze({
    'web-lite': Object.freeze({
        maxWorkers: 2,
        maxSites: 3000,
        maxEdges: 12000,
        maxVisibleObjects: 5000,
        maxLabStepMs: 50,
        maxBoardBuildMs: 300,
        maxScanJobs: 0,
        allowLongResearchJobs: false,
        allowNodeWorkers: false,
        allowUtilityProcess: false,
        allowWebGPU: false
    }),
    'steam-stable': Object.freeze({
        maxWorkers: 4,
        maxSites: 10000,
        maxEdges: 50000,
        maxVisibleObjects: 12000,
        maxLabStepMs: 100,
        maxBoardBuildMs: 1000,
        maxScanJobs: 1,
        allowLongResearchJobs: false,
        allowNodeWorkers: true,
        allowUtilityProcess: true,
        allowWebGPU: false
    }),
    'research-dev': Object.freeze({
        maxWorkers: 'auto',
        maxSites: 50000,
        maxEdges: 250000,
        maxVisibleObjects: 25000,
        maxLabStepMs: 250,
        maxBoardBuildMs: 3000,
        maxScanJobs: 4,
        allowLongResearchJobs: true,
        allowNodeWorkers: true,
        allowUtilityProcess: true,
        allowWebGPU: 'optional'
    })
});

export const COMPUTE_POLICY_MESSAGES = Object.freeze({
    webTooLarge: {
        en: 'This mode is too large for the website edition. Reduce size or use the Steam / Research edition.',
        zh: '此模式對網站版過大，請降低尺寸或使用 Steam / Research 版本。'
    },
    chunked: {
        en: 'This research task may take longer, so it is running in chunks.',
        zh: '此研究任務可能耗時較久，已切換為分批執行。'
    },
    paused: {
        en: 'This task was paused to avoid freezing the interface.',
        zh: '為避免卡住介面，此任務已被暫停。'
    },
    oversizedBoard: {
        en: 'This board exceeds the current edition compute limits.',
        zh: '此棋盤超出目前版本的計算限制。'
    },
    scanDisabled: {
        en: 'Research scan jobs are disabled in this edition.',
        zh: '此版本停用研究掃描工作。'
    }
});

function editionName() {
    if (EDITION.isSteam) return 'steam-stable';
    if (EDITION.isResearch) return 'research-dev';
    if (EDITION.isWebLite) return 'web-lite';
    return POLICIES[EDITION.name] ? EDITION.name : 'web-lite';
}

function availableHardwareThreads() {
    const browserThreads = Number(globalThis.navigator?.hardwareConcurrency);
    if (Number.isFinite(browserThreads) && browserThreads > 0) return Math.max(1, Math.floor(browserThreads));

    const processThreads = Number(globalThis.process?.env?.NUMBER_OF_PROCESSORS);
    if (Number.isFinite(processThreads) && processThreads > 0) return Math.max(1, Math.floor(processThreads));

    return 2;
}

function resolveWorkerLimit(rawLimit) {
    const available = Math.max(1, availableHardwareThreads() - 1);
    if (rawLimit === 'auto') return available;
    const explicit = Math.max(0, Math.floor(Number(rawLimit) || 0));
    return Math.min(explicit, available);
}

function numberFromEstimate(estimate = {}, keys = []) {
    for (const key of keys) {
        const value = Number(estimate?.[key]);
        if (Number.isFinite(value)) return value;
    }
    return 0;
}

function estimatedOperations(estimate = {}) {
    const explicit = numberFromEstimate(estimate, ['operations', 'estimatedOperations', 'workUnits']);
    if (explicit) return explicit;

    const sites = numberFromEstimate(estimate, ['sites', 'siteCount', 'cells', 'cellCount']);
    const edges = numberFromEstimate(estimate, ['edges', 'edgeCount']);
    const visibleObjects = numberFromEstimate(estimate, ['visibleObjects', 'drawObjects']);
    const steps = numberFromEstimate(estimate, ['steps', 'iterations', 'generations']);
    return Math.max(sites + edges, visibleObjects, sites * Math.max(1, steps));
}

export function getComputePolicy() {
    const name = editionName();
    const base = POLICIES[name] || POLICIES['web-lite'];
    return Object.freeze({
        edition: name,
        ...base,
        maxWorkers: resolveWorkerLimit(base.maxWorkers)
    });
}

export function getMaxWorkerCount() {
    return getComputePolicy().maxWorkers;
}

export function shouldRejectOversizedBoard(boardStats = {}) {
    const policy = getComputePolicy();
    const siteCount = numberFromEstimate(boardStats, ['sites', 'siteCount', 'cells', 'cellCount']);
    const edgeCount = numberFromEstimate(boardStats, ['edges', 'edgeCount']);
    const visibleObjects = numberFromEstimate(boardStats, ['visibleObjects', 'drawObjects']);
    const problems = [];

    if (siteCount > policy.maxSites) problems.push({ reason: 'maxSites', value: siteCount, limit: policy.maxSites });
    if (edgeCount > policy.maxEdges) problems.push({ reason: 'maxEdges', value: edgeCount, limit: policy.maxEdges });
    if (visibleObjects > policy.maxVisibleObjects) {
        problems.push({ reason: 'maxVisibleObjects', value: visibleObjects, limit: policy.maxVisibleObjects });
    }

    return {
        reject: problems.length > 0,
        problems,
        policy
    };
}

export function shouldUseWorker(taskType, estimatedCost = {}) {
    const policy = getComputePolicy();
    if (policy.maxWorkers <= 0) return false;
    if (taskType === 'lab_scan' && policy.maxScanJobs <= 0) return false;
    if (taskType === 'lab_scan' && policy.maxScanJobs > 0) return true;

    const operations = estimatedOperations(estimatedCost);
    const sites = numberFromEstimate(estimatedCost, ['sites', 'siteCount', 'cells', 'cellCount']);
    const edges = numberFromEstimate(estimatedCost, ['edges', 'edgeCount']);
    const durationMs = numberFromEstimate(estimatedCost, ['durationMs', 'estimatedMs']);

    if (['4d_projection', 'robot_search', 'pathfinding', 'adjacency_build', 'export_compute'].includes(taskType)) {
        return operations > 25000 || durationMs > 40;
    }
    if (taskType === 'life_step' || taskType === 'lab_step') {
        return sites > Math.min(policy.maxSites, 4000) || durationMs > policy.maxLabStepMs;
    }
    if (taskType === 'board_generate' || taskType === 'board_validate') {
        return sites > 3000 || edges > 12000 || durationMs > policy.maxBoardBuildMs;
    }
    return operations > 100000;
}

export function shouldRunInChunks(taskType, estimatedCost = {}) {
    const policy = getComputePolicy();
    if (shouldUseWorker(taskType, estimatedCost)) return false;
    if (taskType === 'lab_scan') return policy.maxScanJobs > 0;

    const operations = estimatedOperations(estimatedCost);
    const sites = numberFromEstimate(estimatedCost, ['sites', 'siteCount', 'cells', 'cellCount']);
    const durationMs = numberFromEstimate(estimatedCost, ['durationMs', 'estimatedMs']);

    if (durationMs > Math.min(policy.maxLabStepMs, 50)) return true;
    if (['3d_projection', '4d_projection', 'spacetime_resolve', 'life_step', 'lab_step'].includes(taskType)) {
        return operations > 10000 || sites > 1500;
    }
    return operations > 50000;
}

export function explainComputeLimit(reason, lang = 'en') {
    const language = String(lang || 'en').toLowerCase();
    const key = COMPUTE_POLICY_MESSAGES[reason] ? reason : 'oversizedBoard';
    const message = COMPUTE_POLICY_MESSAGES[key];
    return language.startsWith('zh') ? message.zh : message.en;
}

export { POLICIES as COMPUTE_POLICIES };
