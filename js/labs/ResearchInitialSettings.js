const DEFAULT_RANDOM_SEED = 'topology-seed';

function freezeDeep(value) {
    if (Array.isArray(value)) {
        value.forEach(freezeDeep);
        return Object.freeze(value);
    }
    if (value && typeof value === 'object') {
        Object.values(value).forEach(freezeDeep);
        return Object.freeze(value);
    }
    return value;
}

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function normalizeArray(value) {
    if (Array.isArray(value)) return value.map(String);
    if (value == null || value === '') return [];
    return [String(value)];
}

export const RESEARCH_INITIAL_SETTING_KEYS = Object.freeze([
    'initialOperatorTypes',
    'flavors',
    'allowedActions',
    'allowedFusionRules',
    'allowedExchangeRules',
    'boundaryOperators',
    'measurementOperators',
    'conservedQuantities',
    'stochasticMode',
    'randomSeed'
]);

export const RESEARCH_INITIAL_SETTINGS_PRESETS = freezeDeep({
    anyon_braiding: {
        id: 'anyon_braiding',
        labelEn: 'Anyon / Braiding',
        labelZh: '任意子／編織',
        initialOperatorTypes: ['σ', 'ψ', '1'],
        flavors: ['σ particle', 'ψ fermion', 'vacuum 1'],
        charges: ['topological charge σ', 'topological charge ψ', 'vacuum 1'],
        allowedActions: ['exchange', 'merge', 'split', 'measure'],
        allowedFusionRules: ['σ × σ = 1 + ψ', 'σ × ψ = σ', 'ψ × ψ = 1'],
        allowedExchangeRules: ['clockwise exchange σ_i', 'counterclockwise exchange σ_i^-1'],
        boundaryOperators: ['vacuum boundary', 'charge-conserving boundary'],
        measurementOperators: ['fusion channel', 'braid word'],
        conservedQuantities: ['total topological charge when boundaries are closed'],
        observables: ['braid word', 'fusion channels'],
        interactionRules: ['adjacent braidable modes exchange through declared exchange edges'],
        stochasticMode: false,
        randomSeed: DEFAULT_RANDOM_SEED
    },
    majorana: {
        id: 'majorana',
        labelEn: 'Majorana Modes',
        labelZh: 'Majorana 模式',
        initialOperatorTypes: ['γ_i Majorana mode', 'Majorana pair'],
        flavors: Array.from({ length: 8 }, (_, index) => `Flavor ${index}`),
        charges: ['Ising σ sector', 'fermion parity p = iγ_iγ_j'],
        allowedActions: ['create_pair', 'braid', 'merge', 'split', 'measure_parity'],
        allowedFusionRules: ['σ × σ = 1 + ψ', 'even parity -> 1', 'odd parity -> ψ'],
        allowedExchangeRules: [
            'clockwise: γ_i -> γ_j, γ_j -> -γ_i',
            'counterclockwise: γ_i -> -γ_j, γ_j -> γ_i'
        ],
        boundaryOperators: ['open toy boundary', 'parity-preserving boundary'],
        measurementOperators: ['p = iγ_iγ_j', 'fusion channel'],
        conservedQuantities: ['fermion parity when no merge/split changes it'],
        observables: ['parity', 'braid word', 'active modes'],
        interactionRules: ['symbolic unitary U_ij = exp(π/4 γ_i γ_j) for clockwise exchange'],
        stochasticMode: false,
        randomSeed: DEFAULT_RANDOM_SEED
    },
    clifford_stabilizer: {
        id: 'clifford_stabilizer',
        labelEn: 'Clifford / Stabilizer',
        labelZh: 'Clifford／穩定子',
        initialOperatorTypes: ['X', 'Y', 'Z', 'H', 'S', 'CNOT-symbolic'],
        flavors: ['Pauli X', 'Pauli Y', 'Pauli Z', 'Clifford frame'],
        charges: ['syndrome bit 0/1', 'logical sector'],
        allowedActions: ['apply_stabilizer', 'measure_syndrome', 'recover'],
        allowedFusionRules: ['Pauli multiplication up to phase', 'stabilizer projection'],
        allowedExchangeRules: ['Clifford conjugation', 'Pauli-frame transport'],
        boundaryOperators: ['rough boundary', 'smooth boundary', 'logical boundary'],
        measurementOperators: ['syndrome projector', 'logical observable'],
        conservedQuantities: ['stabilizer parity when no error is injected'],
        observables: ['syndrome count', 'logical error flag'],
        interactionRules: ['local stabilizer checks update symbolic Pauli sectors'],
        stochasticMode: false,
        randomSeed: DEFAULT_RANDOM_SEED
    },
    cluster_phase: {
        id: 'cluster_phase',
        labelEn: 'Cluster / Phase',
        labelZh: '團簇／相位',
        initialOperatorTypes: ['phase A', 'phase B', 'defect', 'boundary'],
        flavors: ['phase A', 'phase B', 'domain wall', 'defect marker'],
        charges: ['phase label', 'defect charge', 'boundary orientation'],
        allowedActions: ['nucleate', 'grow', 'relax', 'measure interface'],
        allowedFusionRules: ['A/A coalescence', 'B/B coalescence', 'defect-boundary attachment'],
        allowedExchangeRules: ['local interface rewrite', 'defect transport along boundary'],
        boundaryOperators: ['fixed phase boundary', 'open boundary', 'periodic boundary'],
        measurementOperators: ['interface length', 'domain component label'],
        conservedQuantities: ['total area only under conservative dynamics'],
        observables: ['domain count', 'interface length'],
        interactionRules: ['local flips lower the finite graph objective unless stochastic mode is enabled'],
        stochasticMode: false,
        randomSeed: DEFAULT_RANDOM_SEED
    }
});

const MODE_PRESET_ALIASES = Object.freeze({
    anyon_jump: 'anyon_braiding',
    physical_anyon_jump: 'anyon_braiding',
    anyon_reversi: 'anyon_braiding',
    physical_anyon_reversi: 'anyon_braiding',
    majorana_modes: 'majorana',
    majorana: 'majorana',
    clifford_reversi: 'clifford_stabilizer',
    physical_clifford_reversi: 'clifford_stabilizer',
    clifford_go: 'clifford_stabilizer',
    clifford_jump: 'clifford_stabilizer',
    stabilizer: 'clifford_stabilizer',
    pauli: 'clifford_stabilizer',
    physical_cluster_go: 'cluster_phase',
    cluster_go: 'cluster_phase',
    two_phase_competition_game: 'cluster_phase',
    ising_domain_game: 'cluster_phase',
    domain_wall_game: 'cluster_phase',
    phase_competition: 'cluster_phase'
});

export function presetIdForResearchLab(mode = '') {
    const key = String(mode || '').trim();
    return MODE_PRESET_ALIASES[key] || MODE_PRESET_ALIASES[key.toLowerCase()] || 'cluster_phase';
}

export function getResearchInitialSettingsPreset(mode = '') {
    const presetId = presetIdForResearchLab(mode);
    return cloneValue(RESEARCH_INITIAL_SETTINGS_PRESETS[presetId] || RESEARCH_INITIAL_SETTINGS_PRESETS.cluster_phase);
}

export function resolveResearchInitialSettings(mode = '', overrides = {}) {
    const preset = getResearchInitialSettingsPreset(mode);
    const merged = {
        ...preset,
        ...cloneValue(overrides)
    };
    for (const key of RESEARCH_INITIAL_SETTING_KEYS) {
        if (key === 'stochasticMode') {
            merged[key] = Boolean(overrides[key] ?? preset[key]);
        } else if (key === 'randomSeed') {
            merged[key] = String(overrides[key] || preset[key] || DEFAULT_RANDOM_SEED);
        } else {
            merged[key] = normalizeArray(overrides[key] ?? preset[key]);
        }
    }
    merged.observables = normalizeArray(overrides.observables ?? preset.observables);
    merged.interactionRules = normalizeArray(overrides.interactionRules ?? preset.interactionRules);
    merged.charges = normalizeArray(overrides.charges ?? preset.charges);
    return merged;
}

export function formatResearchInitialSettingValue(value, { empty = 'None' } = {}) {
    if (Array.isArray(value)) return value.length ? value.join(', ') : empty;
    if (value === true) return 'On';
    if (value === false) return 'Off';
    if (value == null || value === '') return empty;
    return String(value);
}

export function researchInitialSettingsSummary(settings = {}) {
    return {
        preset: settings.labelEn || settings.id || '',
        operators: formatResearchInitialSettingValue(settings.initialOperatorTypes),
        actions: formatResearchInitialSettingValue(settings.allowedActions),
        observables: formatResearchInitialSettingValue(settings.observables)
    };
}
