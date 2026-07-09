const DEFAULT_EDITION_ID = 'web-lite';

export const EDITION_CONFIGS = {
    'web-lite': {
        id: 'web-lite',
        name: 'Web Lite',
        target: 'github-pages',
        public: true,
        steam: false,
        debug: false,
        features: {
            stableGames: true,
            lifeWorld: true,
            selectedLabs: true,
            researchBridge: false,
            researchBoardBuilder: false,
            materialDatabase: false,
            externalPythonBridge: false,
            experimentalBoards: false,
            heavyLabs: false,
            debugTools: false
        },
        visibleFeatureStatuses: ['stable', 'playable'],
        visibleLabTiers: ['simple', 'standard'],
        hiddenRoutes: ['labs/board-builder', 'labs/phase-diagrams', 'labs/publication']
    },
    'steam-stable': {
        id: 'steam-stable',
        name: 'Steam Stable',
        target: 'steam-desktop',
        public: true,
        steam: true,
        debug: false,
        features: {
            stableGames: true,
            lifeWorld: true,
            selectedLabs: true,
            researchBridge: false,
            researchBoardBuilder: false,
            materialDatabase: false,
            externalPythonBridge: false,
            experimentalBoards: false,
            heavyLabs: false,
            debugTools: false,
            desktopSaveFiles: true,
            steamCloudReady: true
        },
        visibleFeatureStatuses: ['stable', 'playable'],
        visibleLabTiers: ['simple', 'standard'],
        hiddenRoutes: ['labs/board-builder']
    },
    'research-dev': {
        id: 'research-dev',
        name: 'Research Dev',
        target: 'local-research',
        public: false,
        steam: false,
        debug: false,
        features: {
            stableGames: true,
            lifeWorld: true,
            selectedLabs: true,
            researchBridge: true,
            researchBoardBuilder: true,
            materialDatabase: false,
            externalPythonBridge: false,
            experimentalBoards: true,
            heavyLabs: true,
            debugTools: false,
            boardSpecImportExport: true
        },
        visibleFeatureStatuses: ['stable', 'playable', 'experimental', 'research', 'developing'],
        visibleLabTiers: ['simple', 'standard', 'research'],
        hiddenRoutes: []
    },
    'debug-dev': {
        id: 'debug-dev',
        name: 'Debug Dev',
        target: 'local-debug',
        public: false,
        steam: false,
        debug: true,
        features: {
            stableGames: true,
            lifeWorld: true,
            selectedLabs: true,
            researchBridge: true,
            researchBoardBuilder: true,
            materialDatabase: false,
            externalPythonBridge: false,
            experimentalBoards: true,
            heavyLabs: true,
            debugTools: true,
            boardSpecImportExport: true
        },
        visibleFeatureStatuses: ['stable', 'playable', 'experimental', 'research', 'developing', 'hidden', 'suspended'],
        visibleLabTiers: ['simple', 'standard', 'research', 'debug'],
        hiddenRoutes: []
    }
};

export function normalizeEditionId(value) {
    const id = String(value || '').trim().toLowerCase();
    return EDITION_CONFIGS[id] ? id : DEFAULT_EDITION_ID;
}

export function getEditionConfig(editionId = getCurrentEditionId()) {
    return EDITION_CONFIGS[normalizeEditionId(editionId)];
}

export function getCurrentEditionId() {
    if (typeof window === 'undefined') return DEFAULT_EDITION_ID;
    const globalEdition = window.__TOPOBOARD_EDITION__;
    if (globalEdition) return normalizeEditionId(globalEdition);
    const metaEdition = document.querySelector('meta[name="topoboard-edition"]')?.content;
    if (metaEdition) return normalizeEditionId(metaEdition);
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('edition')) return normalizeEditionId(params.get('edition'));
    } catch {}
    return DEFAULT_EDITION_ID;
}

export function isEditionFeatureEnabled(featureName, editionId = getCurrentEditionId()) {
    const config = getEditionConfig(editionId);
    return Boolean(config.features?.[featureName]);
}

export function isFeatureStatusVisible(status, editionId = getCurrentEditionId()) {
    const config = getEditionConfig(editionId);
    return config.visibleFeatureStatuses.includes(String(status || '').toLowerCase());
}

export function isLabTierVisible(tier, editionId = getCurrentEditionId()) {
    const config = getEditionConfig(editionId);
    return config.visibleLabTiers.includes(String(tier || '').toLowerCase());
}

export function normalizeRoute(route) {
    return String(route || '')
        .replace(/^[./]+/, '')
        .replace(/\/index\.html$/i, '')
        .replace(/\/+$/, '');
}

export function isRouteHidden(route, editionId = getCurrentEditionId()) {
    const normalized = normalizeRoute(route);
    const config = getEditionConfig(editionId);
    return config.hiddenRoutes.some((hiddenRoute) => normalizeRoute(hiddenRoute) === normalized);
}

export async function loadEditionConfig(editionId = getCurrentEditionId(), options = {}) {
    const id = normalizeEditionId(editionId);
    if (options.fetch === false || typeof fetch !== 'function') return getEditionConfig(id);
    try {
        const response = await fetch(`./configs/editions/${id}.json`, { cache: 'no-store' });
        if (!response.ok) return getEditionConfig(id);
        const loaded = await response.json();
        return { ...getEditionConfig(id), ...loaded, features: { ...getEditionConfig(id).features, ...loaded.features } };
    } catch {
        return getEditionConfig(id);
    }
}

export default {
    EDITION_CONFIGS,
    getCurrentEditionId,
    getEditionConfig,
    isEditionFeatureEnabled,
    isFeatureStatusVisible,
    isLabTierVisible,
    isRouteHidden,
    loadEditionConfig,
    normalizeEditionId,
    normalizeRoute
};
