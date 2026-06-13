import {
    DEFAULT_BRAID_MEMORY_CONFIG,
    normalizeBraidMemoryConfig
} from './BraidMemory.js';
import {
    DEFAULT_BRAIDED_CAPTURE_CONFIG,
    normalizeBraidedCaptureConfig
} from './BraidedCapture.js';

export const ANYON_MODELS = Object.freeze({
    toric_code: Object.freeze(['1', 'e', 'm', 'psi']),
    ising: Object.freeze(['1', 'sigma', 'psi']),
    fibonacci: Object.freeze(['1', 'tau'])
});

export const BRAID_EFFECTS = Object.freeze([
    'add_braid_token',
    'flip_parity',
    'disable_one_turn',
    'score_bonus'
]);

export const DEFAULT_ANYON_CONFIG = Object.freeze({
    anyonModel: 'toric_code',
    phaseModel: 'off',
    generalAnyonGrade: 2,
    braidEffect: 'add_braid_token',
    enableFusionChannels: true,
    enablePathHistory: true,
    enableTopologySeamTransforms: true,
    vacuumFusionBehavior: 'remove',
    ...DEFAULT_BRAIDED_CAPTURE_CONFIG,
    ...DEFAULT_BRAID_MEMORY_CONFIG
});

const TORIC_FUSION = {
    1: { 1: ['1'], e: ['e'], m: ['m'], psi: ['psi'] },
    e: { 1: ['e'], e: ['1'], m: ['psi'], psi: ['m'] },
    m: { 1: ['m'], e: ['psi'], m: ['1'], psi: ['e'] },
    psi: { 1: ['psi'], e: ['m'], m: ['e'], psi: ['1'] }
};

const ISING_FUSION = {
    1: { 1: ['1'], sigma: ['sigma'], psi: ['psi'] },
    sigma: { 1: ['sigma'], sigma: ['1', 'psi'], psi: ['sigma'] },
    psi: { 1: ['psi'], sigma: ['sigma'], psi: ['1'] }
};

const FIBONACCI_FUSION = {
    1: { 1: ['1'], tau: ['tau'] },
    tau: { 1: ['tau'], tau: ['1', 'tau'] }
};

const FUSION_TABLES = Object.freeze({
    toric_code: TORIC_FUSION,
    ising: ISING_FUSION,
    fibonacci: FIBONACCI_FUSION
});

const TORIC_BRAID_PHASES = {
    e: { m: -1 },
    m: { e: -1 }
};

const TWIST_AUTOMORPHISM = Object.freeze({
    1: '1',
    e: 'm',
    m: 'e',
    psi: 'psi',
    sigma: 'sigma',
    tau: 'tau'
});

export function normalizeAnyonModel(model = DEFAULT_ANYON_CONFIG.anyonModel) {
    return Object.prototype.hasOwnProperty.call(ANYON_MODELS, model) ? model : DEFAULT_ANYON_CONFIG.anyonModel;
}

export function anyonTypes(model = DEFAULT_ANYON_CONFIG.anyonModel) {
    return [...ANYON_MODELS[normalizeAnyonModel(model)]];
}

export function normalizeAnyonType(type = '1', model = DEFAULT_ANYON_CONFIG.anyonModel) {
    const value = String(type || '1').trim();
    return ANYON_MODELS[normalizeAnyonModel(model)].includes(value) ? value : '1';
}

export function normalizeAnyonConfig(config = {}) {
    const anyonModel = normalizeAnyonModel(config.anyonModel);
    const braidEffect = BRAID_EFFECTS.includes(config.braidEffect) ? config.braidEffect : DEFAULT_ANYON_CONFIG.braidEffect;
    const phaseModel = config.phaseModel === 'zn_phase' ? 'zn_phase' : 'off';
    const parsedGrade = Math.floor(Number(config.generalAnyonGrade));
    const generalAnyonGrade = Number.isFinite(parsedGrade)
        ? Math.max(2, Math.min(64, parsedGrade))
        : DEFAULT_ANYON_CONFIG.generalAnyonGrade;
    const braidMemory = normalizeBraidMemoryConfig(config);
    const braidedCapture = normalizeBraidedCaptureConfig(config);
    return {
        ...DEFAULT_ANYON_CONFIG,
        ...config,
        ...braidMemory,
        ...braidedCapture,
        anyonModel,
        phaseModel,
        generalAnyonGrade,
        braidEffect,
        enableFusionChannels: config.enableFusionChannels ?? DEFAULT_ANYON_CONFIG.enableFusionChannels,
        enablePathHistory: config.enablePathHistory ?? DEFAULT_ANYON_CONFIG.enablePathHistory,
        enableTopologySeamTransforms: config.enableTopologySeamTransforms ?? DEFAULT_ANYON_CONFIG.enableTopologySeamTransforms
    };
}

export function fusionOutputs(a, b, model = DEFAULT_ANYON_CONFIG.anyonModel) {
    const anyonModel = normalizeAnyonModel(model);
    const left = normalizeAnyonType(a, anyonModel);
    const right = normalizeAnyonType(b, anyonModel);
    return [...(FUSION_TABLES[anyonModel]?.[left]?.[right]
        || FUSION_TABLES[anyonModel]?.[right]?.[left]
        || [])];
}

export function canFuseToVacuum(a, b, model = DEFAULT_ANYON_CONFIG.anyonModel) {
    return fusionOutputs(a, b, model).includes('1');
}

export function createFusionResult(a, b, config = {}) {
    const normalized = normalizeAnyonConfig(config);
    const outputs = fusionOutputs(a, b, normalized.anyonModel);
    const resolved = outputs.length === 1 ? outputs[0] : null;
    return {
        input: [normalizeAnyonType(a, normalized.anyonModel), normalizeAnyonType(b, normalized.anyonModel)],
        outputs,
        resolved,
        vacuum: outputs.includes('1'),
        fusionChannel: outputs.length > 1
            ? { model: normalized.anyonModel, inputs: [a, b], possibleOutputs: outputs, selected: null }
            : null
    };
}

export function mutualBraidPhase(movingType, stationaryType, model = DEFAULT_ANYON_CONFIG.anyonModel) {
    if (normalizeAnyonModel(model) !== 'toric_code') return 1;
    const moving = normalizeAnyonType(movingType, 'toric_code');
    const stationary = normalizeAnyonType(stationaryType, 'toric_code');
    return TORIC_BRAID_PHASES[moving]?.[stationary] ?? 1;
}

export function braidEffectForPhase(phase, config = {}) {
    const normalized = normalizeAnyonConfig(config);
    if (phase !== -1) return { phase, effect: 'none', delta: 0 };
    return { phase, effect: normalized.braidEffect, delta: 1 };
}

export function applyTwistAutomorphism(type, model = DEFAULT_ANYON_CONFIG.anyonModel) {
    const anyonModel = normalizeAnyonModel(model);
    const normalized = normalizeAnyonType(type, anyonModel);
    const mapped = TWIST_AUTOMORPHISM[normalized] || normalized;
    return normalizeAnyonType(mapped, anyonModel);
}

export function applyAnyonAutomorphism(type, automorphism = 'identity', model = DEFAULT_ANYON_CONFIG.anyonModel) {
    if (!automorphism || automorphism === 'identity') return normalizeAnyonType(type, model);
    if (automorphism === 'twist' || automorphism === 'em_duality') return applyTwistAutomorphism(type, model);
    if (typeof automorphism === 'object') {
        return normalizeAnyonType(automorphism[type] || type, model);
    }
    return normalizeAnyonType(type, model);
}

export function previewAnyonCapture(attackerType, defenderType, config = {}) {
    const fusion = createFusionResult(attackerType, defenderType, config);
    return {
        legalCapture: fusion.vacuum,
        fusion,
        captureMode: fusion.vacuum ? 'capture' : 'fuse'
    };
}
