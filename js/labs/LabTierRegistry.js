export const LAB_TIERS = Object.freeze([
    'simple',
    'standard',
    'research',
    'debug'
]);

export const LAB_TIER_LABELS = Object.freeze({
    simple: { en: 'Simple', zh: '簡易' },
    standard: { en: 'Standard', zh: '標準' },
    research: { en: 'Research', zh: '研究' },
    debug: { en: 'Debug', zh: '除錯' }
});

const tierRegistry = new Map();

function normalizeTier(value) {
    return LAB_TIERS.includes(value) ? value : 'standard';
}

function normalizeConfig(labId, tierConfig = {}) {
    if (!labId) throw new TypeError('Lab tier entries require labId.');
    const tier = normalizeTier(tierConfig.tier);
    return Object.freeze({
        labId: String(labId),
        tier,
        labelEn: String(tierConfig.labelEn || LAB_TIER_LABELS[tier].en),
        labelZh: String(tierConfig.labelZh || LAB_TIER_LABELS[tier].zh),
        publicVisible: tierConfig.publicVisible ?? (tier === 'simple' || tier === 'standard'),
        researchOptInRequired: tierConfig.researchOptInRequired ?? tier === 'research',
        debugOnly: tierConfig.debugOnly ?? tier === 'debug',
        reasonEn: String(tierConfig.reasonEn || ''),
        reasonZh: String(tierConfig.reasonZh || ''),
        maxRecommendedSites: Number(tierConfig.maxRecommendedSites || 0),
        maxRecommendedSteps: Number(tierConfig.maxRecommendedSteps || 0)
    });
}

export function registerLabTier(labId, tierConfig = {}) {
    const entry = normalizeConfig(labId, tierConfig);
    tierRegistry.set(entry.labId, entry);
    return entry;
}

export function getLabTier(labId) {
    return tierRegistry.get(String(labId)) || normalizeConfig(String(labId || 'lab:unknown'), { tier: 'standard' });
}

export function canShowLabInPublicMode(labId) {
    const tier = getLabTier(labId);
    return tier.publicVisible && !tier.debugOnly;
}

export function requiresResearchOptIn(labId) {
    return getLabTier(labId).researchOptInRequired === true;
}

export function labTierLabel(labIdOrTier, language = 'en') {
    const tier = LAB_TIERS.includes(labIdOrTier) ? labIdOrTier : getLabTier(labIdOrTier).tier;
    const labels = LAB_TIER_LABELS[tier] || LAB_TIER_LABELS.standard;
    return String(language).toLowerCase().startsWith('zh') ? labels.zh : labels.en;
}

export function listLabTiers(filters = {}) {
    return [...tierRegistry.values()].filter((entry) =>
        Object.entries(filters).every(([key, value]) => value == null || entry[key] === value));
}

function registerDefaultLabTiers() {
    for (const labId of [
        'ising_domain_game',
        'two_phase_competition_game',
        'physical_cluster_go',
        'physical_jump_particles',
        'clifford_reversi'
    ]) {
        registerLabTier(labId, {
            tier: 'standard',
            maxRecommendedSites: 12000,
            maxRecommendedSteps: 1000
        });
    }
    for (const labId of [
        'spin_ice_vertex_game',
        'z2_gauge_loop_game',
        'physical_clifford_reversi',
        'physical_anyon_jump',
        'physical_virasoro_go'
    ]) {
        registerLabTier(labId, {
            tier: 'research',
            publicVisible: false,
            researchOptInRequired: true,
            maxRecommendedSites: 8000,
            maxRecommendedSteps: 2000
        });
    }
}

registerDefaultLabTiers();
