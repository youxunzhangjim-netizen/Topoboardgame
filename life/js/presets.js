import { parseRuleString } from './rules.js';

function lifeLike(id, label, rule, options = {}) {
  const parsed = parseRuleString(rule);
  return {
    id,
    label,
    zhLabel: options.zhLabel || label,
    type: 'life-like',
    rule,
    birth: [...parsed.birth],
    survival: [...parsed.survival],
    neighborhoodType: options.neighborhoodType || 'moore',
    dimension: options.dimension || 2,
    speciesCount: options.speciesCount || 1,
    ...options
  };
}

export const LIFE_RULE_PRESETS = {
  conway: lifeLike('conway', 'Classic Conway Life', 'B3/S23', { zhLabel: 'Classic Conway Life（經典）' }),
  triangularLife: lifeLike('triangularLife', 'Triangular Edge Life', 'B2/S12', { zhLabel: 'Triangular Edge Life（三角格邊鄰）', neighborhoodType: 'nearest', latticeNeighborCount: 3 }),
  honeycombLife: lifeLike('honeycombLife', 'Hexagon Edge Life', 'B2/S34', { zhLabel: 'Hexagon Edge Life（六邊格邊鄰）', neighborhoodType: 'nearest', latticeNeighborCount: 6 }),
  highlife: lifeLike('highlife', 'HighLife', 'B36/S23', { zhLabel: 'HighLife' }),
  seeds: lifeLike('seeds', 'Seeds', 'B2/S', { zhLabel: 'Seeds' }),
  dayNight: lifeLike('dayNight', 'Day & Night', 'B3678/S34678', { zhLabel: 'Day & Night' }),
  life3dSoft: lifeLike('life3dSoft', '3D Life Soft', 'B5/S4-6', { zhLabel: '3D Life Soft（柔和）', dimension: 3, neighborhoodType: 'moore' }),
  life3dDense: lifeLike('life3dDense', '3D Life Dense', 'B6/S5-7', { zhLabel: '3D Life Dense（密集）', dimension: 3, neighborhoodType: 'moore' }),
  noisyLife: lifeLike('noisyLife', 'Noisy Life', 'B3/S23', {
    zhLabel: 'Noisy Life（含噪聲）',
    birthNoise: 0.01,
    deathNoise: 0.01,
    environmentNoise: 0.005,
    ruleNoise: 0
  }),
  ageStructured: lifeLike('ageStructured', 'Age-Structured Life', 'B3/S23', {
    zhLabel: 'Age-Structured Life（年齡結構）',
    maxAge: 12,
    agingDeathRate: 0.002,
    youngBirthBonus: 0.15,
    oldAgePenalty: 0.35,
    ageColoring: true
  }),
  multiSpecies: lifeLike('multiSpecies', 'Multi-Species Life', 'B3/S23', {
    zhLabel: 'Multi-Species Life（多物種）',
    speciesCount: 3,
    mutationRate: 0.01,
    tieRule: 'random'
  }),
  predatorPrey: {
    id: 'predatorPrey',
    label: 'Predator–Prey Automaton',
    zhLabel: 'Predator-Prey Automaton（捕食-被捕食）',
    type: 'predator-prey',
    dimension: 2,
    neighborhoodType: 'moore',
    speciesCount: 2
  },
  sir: {
    id: 'sir',
    label: 'Epidemic / SIR Automaton',
    zhLabel: 'Epidemic / SIR Automaton（流行病）',
    type: 'sir',
    dimension: 2,
    neighborhoodType: 'moore',
    speciesCount: 3,
    infectionRate: 0.28,
    recoveryRate: 0.08,
    immunityLossRate: 0.005
  },
  forestFire: {
    id: 'forestFire',
    label: 'Forest-Fire Automaton',
    zhLabel: 'Forest-Fire Automaton（森林火災）',
    type: 'forest-fire',
    dimension: 2,
    neighborhoodType: 'moore',
    speciesCount: 2,
    growthRate: 0.012,
    lightningRate: 0.0007,
    spreadRate: 0.62
  }
};

export function getRulePreset(id = 'conway') {
  return structuredClone(LIFE_RULE_PRESETS[id] || LIFE_RULE_PRESETS.conway);
}

export function listRulePresets() {
  return Object.values(LIFE_RULE_PRESETS).map((preset) => structuredClone(preset));
}

export function rulePresetLabel(preset, language = 'en') {
  return language === 'zh' ? (preset.zhLabel || preset.label) : preset.label;
}
