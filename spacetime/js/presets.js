const FAMILY_TEXT = {
  chess: {
    title: 'Chess',
    action: 'Move piece',
    rules: 'Move a selected piece one legal step. Time settings can delay a move, switch active phases, add cooldown, or make old pieces vanish. No noise option is used for Chess.'
  },
  go: {
    title: 'Go',
    action: 'Put stone',
    rules: 'Put a stone on an empty site. Time settings can age stones, expire old stones, schedule delayed placement, or make stones active only on their phase. Go supports optional noise only inside +1D time modes.'
  },
  reversi: {
    title: 'Reversi',
    action: 'Place / flip',
    rules: 'Place on an empty site and flip adjacent bracketed or neighboring opponent pieces in the simplified time prototype. Reversi supports optional noise only inside +1D time modes.'
  },
  jump: {
    title: 'Jump',
    action: 'Step / chain jump',
    rules: 'Move one step to an empty site or jump over one occupied neighbor to the empty site beyond. Time settings can delay, phase, cool down, or age pieces. No noise option is used for Jump.'
  }
};

const DIMENSION_TEXT = {
  '2p1': {
    title: '2+1D',
    dimension: 2,
    size: [9, 9],
    topologies: ['plane', 'torus', 'mobius', 'klein', 'rp2', 'sphere'],
    lattices: ['square', 'triangular', 'honeycomb'],
    description: '2D board plus discrete turn-time.'
  },
  '3p1': {
    title: '3+1D',
    dimension: 3,
    size: [6, 6, 4],
    topologies: ['r3', 'torus3', 'reflective', 'sphere-shell'],
    lattices: ['cubic', 'bcc', 'fcc'],
    description: '3D board plus discrete turn-time.'
  }
};

const TIME_MODES = {
  delay: {
    title: 'Delayed Action',
    description: 'Skip tempo to secretly charge a future action. The opponent sees charging but not the target.',
    rules: 'Select a piece or empty action site, then Program Future Action. The action resolves after the configured delay if the destination is still legal.'
  },
  periodic: {
    title: 'Periodic Pieces',
    description: 'Pieces are active only at a chosen phase of the global clock.',
    rules: 'A piece is active when turn % period equals its phase. The phase and time lattice controls decide the rhythm.'
  },
  decay: {
    title: 'Age / Decay Board',
    description: 'Pieces age every turn and vanish after their lifetime.',
    rules: 'Use the lifetime, old-age, and frequency controls to decide when pieces slow, expire, or become strategically fragile.'
  }
};

function makePreset(dimensionGroup, family, timeMode) {
  const dim = DIMENSION_TEXT[dimensionGroup];
  const fam = FAMILY_TEXT[family];
  const mode = TIME_MODES[timeMode];
  const noiseAllowed = family === 'go' || family === 'reversi';
  const id = `${dimensionGroup}-${family}-${timeMode}`;
  const defaultSize = family === 'chess'
    ? (dimensionGroup === '2p1' ? [8, 8] : [5, 5, 4])
    : family === 'go'
      ? (dimensionGroup === '2p1' ? [9, 9] : [5, 5, 5])
      : family === 'reversi'
        ? (dimensionGroup === '2p1' ? [8, 8] : [6, 6, 4])
        : (dimensionGroup === '2p1' ? [9, 9] : [6, 6, 4]);
  return {
    id,
    title: `${dim.title} ${fam.title} — ${mode.title}`,
    shortTitle: `${dim.title} ${fam.title}`,
    family,
    dimensionGroup,
    timeMode,
    description: mode.description,
    rules: `${fam.rules} ${mode.rules}`,
    dimension: dim.dimension,
    size: defaultSize,
    topology: dim.topologies[0],
    boundary: dim.topologies[0],
    lattice: dim.lattices[0],
    topologies: dim.topologies,
    lattices: dim.lattices,
    delay: timeMode === 'delay' ? 2 : 1,
    period: timeMode === 'periodic' ? 4 : 1,
    lifetime: timeMode === 'decay' ? 50 : null,
    oldAge: timeMode === 'decay' ? 40 : null,
    cooldown: family === 'chess' || family === 'jump' ? 1 : 0,
    allowNoise: noiseAllowed,
    noise: 0,
    actionLabel: fam.action
  };
}

export const SPACE_TIME_DIMENSIONS = DIMENSION_TEXT;
export const SPACE_TIME_FAMILIES = FAMILY_TEXT;
export const SPACE_TIME_MODES = TIME_MODES;
export const SPACE_TIME_PRESETS = [];
for (const dimensionGroup of ['2p1', '3p1']) {
  for (const family of ['chess', 'go', 'reversi', 'jump']) {
    for (const timeMode of ['delay', 'periodic', 'decay']) {
      if (family === 'chess' && timeMode === 'periodic') continue;
      SPACE_TIME_PRESETS.push(makePreset(dimensionGroup, family, timeMode));
    }
  }
}

export const PHYSICS_LAB_TIME_PRESETS = [
  {
    id: 'physics-momentum-lab',
    title: 'Physics Lab — Momentum Time Walk',
    shortTitle: 'Momentum Lab',
    family: 'physics',
    dimensionGroup: '3p1',
    timeMode: 'physics',
    description: 'Physics-lab preset where internal momentum drives motion and boundary response.',
    rules: 'Momentum, Hamiltonian-inspired motion, and stochastic physics controls are intentionally kept in Strategy & Systems Labs, not in ordinary 2+1D or 3+1D game modes.',
    dimension: 3,
    size: [6, 6, 4],
    topology: 'reflective',
    boundary: 'reflective',
    lattice: 'cubic',
    topologies: ['r3', 'torus3', 'reflective'],
    lattices: ['cubic'],
    momentum: true,
    allowNoise: true,
    noise: 0,
    period: 4,
    lifetime: null,
    actionLabel: 'Momentum step',
    physicsLab: true
  },
  {
    id: 'physics-hamiltonian-walk',
    title: 'Physics Lab — Hamiltonian Walk',
    shortTitle: 'Hamiltonian Walk',
    family: 'physics',
    dimensionGroup: '2p1',
    timeMode: 'physics',
    description: 'Physics-lab preset for simplified Hamiltonian-style graph evolution and measurement.',
    rules: 'Select a piece and measure a probability-inspired walk. This is a physics-lab tool and is not shown inside ordinary 2+1D / 3+1D Chess, Go, Reversi, or Jump.',
    dimension: 2,
    size: [9, 9],
    topology: 'torus',
    boundary: 'torus',
    lattice: 'square',
    topologies: ['plane', 'torus'],
    lattices: ['square'],
    walkSteps: 4,
    allowNoise: true,
    noise: 0,
    period: 4,
    lifetime: null,
    actionLabel: 'Measure walk',
    physicsLab: true
  }
];

export function getPresetList({ includePhysics = false } = {}) {
  return includePhysics ? [...SPACE_TIME_PRESETS, ...PHYSICS_LAB_TIME_PRESETS] : SPACE_TIME_PRESETS;
}

export function findSpaceTimePreset({ dimensionGroup = '2p1', family = 'go', timeMode = 'delay', includePhysics = false } = {}) {
  const list = getPresetList({ includePhysics });
  return list.find((preset) => preset.dimensionGroup === dimensionGroup && preset.family === family && preset.timeMode === timeMode) || list[0];
}

export function getSpaceTimePreset(id, { includePhysics = false } = {}) {
  const list = getPresetList({ includePhysics });
  const preset = list.find((item) => item.id === id) || list[0];
  return structuredClone(preset);
}
