export const FEATURE_STATUSES = Object.freeze([
    'stable',
    'playable',
    'experimental',
    'research',
    'developing',
    'hidden',
    'suspended'
]);

export const FEATURE_KINDS = Object.freeze([
    'board',
    'lab',
    'game',
    'connection'
]);

export const FEATURE_STATUS_LABELS = Object.freeze({
    stable: { en: 'Stable', zh: '穩定' },
    playable: { en: 'Playable', zh: '可玩' },
    experimental: { en: 'Experimental', zh: '實驗' },
    research: { en: 'Research', zh: '研究' },
    developing: { en: 'Developing', zh: '開發中' },
    hidden: { en: 'Hidden', zh: '隱藏' },
    suspended: { en: 'Suspended', zh: '暫停' }
});

const registry = new Map();

function normalizeKind(raw = {}) {
    if (FEATURE_KINDS.includes(raw.kind)) return raw.kind;
    if (FEATURE_KINDS.includes(raw.family)) return raw.family;
    return 'board';
}

function normalizeStatus(status) {
    return FEATURE_STATUSES.includes(status) ? status : 'developing';
}

function normalizeEntry(raw = {}) {
    if (!raw.id) throw new TypeError('Feature status entries require an id.');
    const status = normalizeStatus(raw.status);
    const kind = normalizeKind(raw);
    return Object.freeze({
        id: String(raw.id),
        kind,
        status,
        reasonEn: String(raw.reasonEn || ''),
        reasonZh: String(raw.reasonZh || ''),
        fallbackId: raw.fallbackId ? String(raw.fallbackId) : '',
        steamVisible: raw.steamVisible !== false,
        debugVisible: raw.debugVisible === true,

        // Compatibility metadata for existing board safety scripts.
        family: String(raw.family || kind),
        boardSpace: String(raw.boardSpace || ''),
        lattice: String(raw.lattice || ''),
        topology: String(raw.topology || ''),
        dimension: Number(raw.dimension || 2)
    });
}

export function registerFeatureStatus(raw) {
    const entry = normalizeEntry(raw);
    registry.set(entry.id, entry);
    return entry;
}

export function registerFeatureStatuses(entries = []) {
    return entries.map(registerFeatureStatus);
}

export function getFeatureStatus(id) {
    return registry.get(String(id)) || null;
}

export function isSteamVisible(id) {
    const entry = getFeatureStatus(id);
    if (!entry) return true;
    if (!entry.steamVisible) return false;
    return entry.status !== 'hidden' && entry.status !== 'suspended';
}

export function shouldShowDevelopingLabel(id) {
    const entry = getFeatureStatus(id);
    return entry?.status === 'developing';
}

export function getFallbackId(id) {
    return getFeatureStatus(id)?.fallbackId || '';
}

export function listFeaturesByStatus(status) {
    return [...registry.values()].filter((entry) => entry.status === status);
}

export function listFeatureStatuses(filters = {}) {
    return [...registry.values()].filter((entry) =>
        Object.entries(filters).every(([key, value]) => value == null || entry[key] === value));
}

export function featureStatusLabel(status, language = 'en') {
    const labels = FEATURE_STATUS_LABELS[normalizeStatus(status)] || FEATURE_STATUS_LABELS.developing;
    return String(language).toLowerCase().startsWith('zh') ? labels.zh : labels.en;
}

export function featureStatusSuffix(status, language = 'en') {
    if (status !== 'developing') return '';
    return String(language).toLowerCase().startsWith('zh') ? '（開發中）' : ' (Developing)';
}

export function isFeatureVisible(idOrEntry, { debug = false, research = false, steam = false } = {}) {
    const entry = typeof idOrEntry === 'string' ? getFeatureStatus(idOrEntry) : idOrEntry;
    if (!entry) return true;
    if (steam && !isSteamVisible(entry.id)) return false;
    if (entry.status === 'hidden') return debug && entry.debugVisible;
    if (entry.status === 'suspended') return debug && entry.debugVisible;
    if (entry.status === 'research') return research || debug;
    return true;
}

export function resolveFeatureStatus(id, options = {}) {
    const entry = getFeatureStatus(id);
    if (!entry) return { entry: null, visible: true, warning: '', fallbackId: '' };
    const language = options.language || 'en';
    return {
        entry,
        visible: isFeatureVisible(entry, options),
        warning: String(language).toLowerCase().startsWith('zh') ? entry.reasonZh : entry.reasonEn,
        fallbackId: entry.fallbackId
    };
}

export function clearFeatureStatusRegistry() {
    registry.clear();
    registerDefaultFeatureStatuses();
}

export function steamSafeFeatures(options = {}) {
    return listFeatureStatuses()
        .filter((entry) => entry.steamVisible && isFeatureVisible(entry, { ...options, steam: true }));
}

function registerDefaultFeatureStatuses() {
    registerFeatureStatuses([
        {
            id: 'board.klein-quartic',
            kind: 'board',
            boardSpace: 'klein_quartic',
            status: 'hidden',
            reasonEn: 'The current generator is not Steam-stable.',
            reasonZh: '目前產生器尚未達到 Steam 穩定標準。',
            steamVisible: false,
            debugVisible: true
        },
        {
            id: 'board.trefoil-experimental',
            kind: 'board',
            boardSpace: 'trefoil',
            status: 'developing',
            reasonEn: 'Trefoil and torus-knot boards remain experimental.',
            reasonZh: '三葉結與環面結棋盤仍屬實驗功能。',
            steamVisible: false,
            debugVisible: true
        },
        {
            id: 'board.klein-honeycomb',
            kind: 'board',
            boardSpace: 'klein_bottle',
            lattice: 'honeycomb',
            status: 'hidden',
            reasonEn: 'Honeycomb Klein bottle generation is not validated.',
            reasonZh: '蜂巢圖 Klein 瓶產生器尚未通過驗證。',
            fallbackId: 'board.klein-square',
            steamVisible: false,
            debugVisible: true
        },
        {
            id: 'board.klein-square',
            kind: 'board',
            boardSpace: 'klein_bottle',
            lattice: 'square',
            status: 'playable',
            steamVisible: true,
            debugVisible: true
        }
    ]);
}

registerDefaultFeatureStatuses();
