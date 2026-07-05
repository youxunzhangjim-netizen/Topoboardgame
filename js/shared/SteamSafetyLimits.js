export const STEAM_BOARD_LIMITS = Object.freeze({
    1: Object.freeze({ maxPlayableSites: 10000, recommendedPlayableSites: 2500 }),
    2: Object.freeze({ maxPlayableSites: 10000, recommendedPlayableSites: 2500 }),
    3: Object.freeze({ maxPlayableSites: 20000, recommendedPlayableSites: 4000 }),
    4: Object.freeze({
        maxPlayableSites: 30000,
        recommendedPlayableSites: 3000,
        recommendedVisibleSitesPerSlice: 3000,
        slicedOrProjectedOnly: true
    })
});

export const STEAM_LAB_LIMITS = Object.freeze({
    simpleMaxStateVariables: 20000,
    maxUpdateOperationsPerFrame: 100000,
    synchronousStepWarningMs: 100
});

export const STEAM_RENDER_LIMITS = Object.freeze({
    warningMs: 100,
    dangerMs: 500,
    maxVisibleSitesWithLabels: 5000,
    maxVisibleEdgesAtFullDetail: 20000
});

export const STEAM_SAFETY_TEXT = Object.freeze({
    en: Object.freeze({
        boardWarning: 'This board is large and may run slowly. Reduce size or switch to Research/Debug mode.',
        performanceMode: 'Performance Mode',
        showEdges: 'Show Edges',
        showLabels: 'Show Labels',
        lowerDetail: 'Lower Detail',
        pauseUpdates: 'Pause Updates'
    }),
    zh: Object.freeze({
        boardWarning: '此棋盤較大，可能運行緩慢。請降低尺寸，或切換到研究／除錯模式。',
        performanceMode: '效能模式',
        showEdges: '顯示邊',
        showLabels: '顯示標籤',
        lowerDetail: '降低細節',
        pauseUpdates: '暫停更新'
    })
});

function readDebugFlag() {
    if (typeof globalThis === 'undefined') return false;
    if (globalThis.__TOPOBOARD_DEBUG__ === true) return true;
    try {
        const params = new URLSearchParams(globalThis.location?.search || '');
        if (['1', 'true', 'yes'].includes(String(params.get('debug')).toLowerCase())) return true;
        return globalThis.localStorage?.getItem('topoboard-advanced-debug') === 'true';
    } catch {
        return false;
    }
}

export function isAdvancedDebugEnabled(options = {}) {
    if (typeof options.debug === 'boolean') return options.debug;
    if (typeof options.advanced === 'boolean') return options.advanced;
    return readDebugFlag();
}

export function getBoardSafetyLimit(dimension = 2) {
    return STEAM_BOARD_LIMITS[Number(dimension)] || STEAM_BOARD_LIMITS[2];
}

export function assessBoardSafety({
    dimension = 2,
    playableSites = 0,
    visibleSites = playableSites,
    slicedOrProjected = false,
    debug,
    advanced
} = {}) {
    const limit = getBoardSafetyLimit(dimension);
    const privileged = isAdvancedDebugEnabled({ debug, advanced });
    const exceedsMax = playableSites > limit.maxPlayableSites;
    const invalid4DPresentation = Number(dimension) === 4
        && limit.slicedOrProjectedOnly
        && !slicedOrProjected
        && visibleSites > limit.recommendedVisibleSitesPerSlice;
    const exceedsRecommended = playableSites > limit.recommendedPlayableSites
        || (Number(dimension) === 4 && visibleSites > limit.recommendedVisibleSitesPerSlice);
    return {
        allowed: privileged || (!exceedsMax && !invalid4DPresentation),
        requiresAdvanced: !privileged && (exceedsMax || invalid4DPresentation),
        warning: exceedsRecommended ? STEAM_SAFETY_TEXT.en.boardWarning : '',
        warningZh: exceedsRecommended ? STEAM_SAFETY_TEXT.zh.boardWarning : '',
        exceedsMax,
        exceedsRecommended,
        invalid4DPresentation,
        limit
    };
}

export function assessRenderSafety({
    durationMs = 0,
    visibleSites = 0,
    visibleEdges = 0
} = {}) {
    return {
        warn: durationMs > STEAM_RENDER_LIMITS.warningMs,
        simplify: durationMs > STEAM_RENDER_LIMITS.dangerMs
            || visibleSites > STEAM_RENDER_LIMITS.maxVisibleSitesWithLabels
            || visibleEdges > STEAM_RENDER_LIMITS.maxVisibleEdgesAtFullDetail,
        showLabelsByDefault: visibleSites <= STEAM_RENDER_LIMITS.maxVisibleSitesWithLabels,
        showEdgesByDefault: visibleEdges <= STEAM_RENDER_LIMITS.maxVisibleEdgesAtFullDetail
    };
}

export function largestSafeUniformSize(dimension, requestedSize, {
    slicedOrProjected = Number(dimension) === 4,
    minimum = 1
} = {}) {
    const requested = Math.max(minimum, Math.floor(Number(requestedSize) || minimum));
    const limit = getBoardSafetyLimit(dimension);
    const maxSites = Number(dimension) === 4 && !slicedOrProjected
        ? limit.recommendedVisibleSitesPerSlice
        : limit.maxPlayableSites;
    const maximumSide = Math.max(minimum, Math.floor(maxSites ** (1 / Math.max(1, Number(dimension)))));
    return Math.min(requested, maximumSide);
}
