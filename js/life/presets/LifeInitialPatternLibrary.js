import {
  generateCrackLine,
  generateEdgeDislocation2D,
  generateGrainBoundary,
  generateInclusion,
  generateRandomDefectField,
  generateVacancyCluster
} from '../research/LifeDefectGenerators.js';
import { addDefect, createDefectLayer } from '../research/LifeDefectLayer.js';

export const LIFE_INITIAL_PATTERN_SCHEMA = 'topoboard.lifeInitialPattern.v0';

export const LIFE_INITIAL_PATTERN_CATEGORIES = Object.freeze([
  { id: 'random_noise', nameEn: 'Random / Noise', nameZh: '隨機 / 噪聲' },
  { id: 'seeds_colonies', nameEn: 'Seeds / Colonies', nameZh: '種子 / 群落' },
  { id: 'droplets', nameEn: 'Droplets', nameZh: '液滴' },
  { id: 'domain_walls', nameEn: 'Domain Walls / Interfaces', nameZh: '相域牆 / 界面' },
  { id: 'stripes', nameEn: 'Stripes / Lamellae', nameZh: '條紋 / 層狀' },
  { id: 'rings_fronts', nameEn: 'Rings / Fronts', nameZh: '環 / 前沿' },
  { id: 'crystal_lattice', nameEn: 'Crystal / Lattice Seeds', nameZh: '晶體 / 晶格種子' },
  { id: 'defects', nameEn: 'Defect / Dislocation Initial States', nameZh: '缺陷 / 位錯初態' },
  { id: 'ecology_biology', nameEn: 'Ecology / Biology', nameZh: '生態 / 生物' },
  { id: 'lab_inspired', nameEn: 'Lab-inspired', nameZh: 'Labs 啟發' }
]);

const SIMPLE_PATTERN_IDS = new Set([
  'random_uniform',
  'single_seed',
  'finite_seed',
  'localized_colony',
  'glider_known',
  'circular_droplet_2d',
  'straight_domain_wall',
  'vertical_stripes'
]);

function hashSeed(seed = 1) {
  const text = String(seed);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

export function createSeededRng(seed = 1) {
  let state = hashSeed(seed);
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function numberParam(params, key, fallback, min = -Infinity, max = Infinity) {
  const value = Number(params?.[key]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function intParam(params, key, fallback, min = -Infinity, max = Infinity) {
  return Math.round(numberParam(params, key, fallback, min, max));
}

function boardDimension(board) {
  return Math.max(1, Math.min(4, Number(board?.dimension || board?.size?.length || 2)));
}

function boardSize(board) {
  const dimension = boardDimension(board);
  const size = Array.isArray(board?.size) ? board.size.slice(0, dimension) : [32, 32].slice(0, dimension);
  while (size.length < dimension) size.push(dimension >= 3 ? 8 : 32);
  return size.map((value) => Math.max(1, Math.round(Number(value) || 1)));
}

function centerOf(size) {
  return size.map((value) => Math.floor(value / 2));
}

function wrapPosition(position, size) {
  return position.map((value, axis) => {
    const n = size[axis] || 1;
    return ((Math.round(value) % n) + n) % n;
  });
}

function inBounds(position, size) {
  return position.every((value, axis) => value >= 0 && value < size[axis]);
}

function addCell(cells, position, species = 1, options = {}) {
  const key = position.join(',');
  cells.set(key, {
    position: position.slice(),
    state: 1,
    species,
    age: Number(options.age || 1),
    energy: Number(options.energy ?? 1),
    health: Number(options.health ?? 1)
  });
}

function finalizeCells(cells) {
  return [...cells.values()];
}

function chooseSpecies(rng, speciesCount = 1) {
  return 1 + Math.floor(rng() * Math.max(1, speciesCount));
}

function forEachPosition(size, callback) {
  const dimension = size.length;
  const position = Array.from({ length: dimension }, () => 0);
  function visit(axis) {
    if (axis === dimension) {
      callback(position.slice());
      return;
    }
    for (let value = 0; value < size[axis]; value += 1) {
      position[axis] = value;
      visit(axis + 1);
    }
  }
  visit(0);
}

function distance(position, center) {
  return Math.sqrt(position.reduce((sum, value, axis) => sum + (value - center[axis]) ** 2, 0));
}

function angleProjection(position, center, angle) {
  const dx = position[0] - center[0];
  const dy = (position[1] || 0) - (center[1] || 0);
  return dx * Math.cos(angle) + dy * Math.sin(angle);
}

function stripeValue(position, center, angle, width) {
  return Math.floor((angleProjection(position, center, angle) + 10000) / Math.max(1, width));
}

function lineSignedDistance(position, center, angle, offset = 0) {
  const dx = position[0] - center[0];
  const dy = (position[1] || 0) - (center[1] || 0);
  return dx * Math.cos(angle + Math.PI / 2) + dy * Math.sin(angle + Math.PI / 2) - offset;
}

function maybeNoisyBoundary(value, amplitude, rng) {
  return value + (rng() - 0.5) * 2 * amplitude;
}

function randomFill({ board, params = {}, rng }) {
  const size = boardSize(board);
  const cells = new Map();
  const density = numberParam(params, 'density', 0.18, 0, 1);
  const speciesCount = intParam(params, 'species', params.speciesCount || 1, 1, 8);
  forEachPosition(size, (position) => {
    if (rng() <= density) addCell(cells, position, chooseSpecies(rng, speciesCount));
  });
  return { cells: finalizeCells(cells) };
}

function clusterFill({ board, params = {}, rng }) {
  const size = boardSize(board);
  const dimension = size.length;
  const cells = new Map();
  const radius = numberParam(params, 'radius', dimension >= 3 ? 4 : 6, 1, Math.max(...size));
  const density = numberParam(params, 'density', 0.5, 0, 1);
  const speciesCount = intParam(params, 'species', params.speciesCount || 1, 1, 8);
  const clusterCount = intParam(params, 'count', 4, 1, 16);
  const centers = Array.from({ length: clusterCount }, () => size.map((n) => Math.floor(rng() * n)));
  forEachPosition(size, (position) => {
    const nearest = Math.min(...centers.map((center) => distance(position, center)));
    if (nearest <= radius && rng() <= density * (1 - nearest / (radius + 1))) {
      const centerIndex = centers.findIndex((center) => distance(position, center) === nearest);
      addCell(cells, position, 1 + (Math.max(0, centerIndex) % speciesCount));
    }
  });
  return { cells: finalizeCells(cells) };
}

function colony({ board, params = {}, rng, multi = false }) {
  const size = boardSize(board);
  const dimension = size.length;
  const cells = new Map();
  const radius = numberParam(params, 'radius', dimension >= 3 ? 3 : 5, 1, Math.max(...size));
  const density = numberParam(params, 'density', 0.72, 0, 1);
  const speciesCount = intParam(params, 'species', multi ? 3 : 1, 1, 8);
  const centers = multi
    ? [
      size.map((n) => Math.floor(n * 0.28)),
      size.map((n) => Math.floor(n * 0.72)),
      size.map((n, axis) => Math.floor(axis === 0 ? n * 0.5 : n * 0.32))
    ]
    : [centerOf(size)];
  forEachPosition(size, (position) => {
    centers.forEach((center, index) => {
      const d = distance(position, center);
      if (d <= radius && rng() <= density * (1 - d / (radius + 1))) {
        addCell(cells, position, multi ? 1 + (index % speciesCount) : chooseSpecies(rng, speciesCount));
      }
    });
  });
  return { cells: finalizeCells(cells) };
}

function droplet({ board, params = {}, rng, shell = false, multiple = false, noisy = false }) {
  const size = boardSize(board);
  const dimension = size.length;
  const cells = new Map();
  const radius = numberParam(params, 'radius', dimension >= 3 ? Math.min(...size) * 0.22 : Math.min(...size) * 0.25, 1, Math.max(...size));
  const width = numberParam(params, 'width', 2, 1, Math.max(...size));
  const species = intParam(params, 'species', 1, 1, 8);
  const noiseAmplitude = noisy ? numberParam(params, 'boundaryRoughness', 1.5, 0, 8) : 0;
  const centers = multiple
    ? [
      size.map((n) => Math.floor(n * 0.32)),
      size.map((n) => Math.floor(n * 0.68)),
      size.map((n, axis) => Math.floor(axis === 0 ? n * 0.52 : n * 0.38))
    ]
    : [centerOf(size)];
  forEachPosition(size, (position) => {
    centers.forEach((center, index) => {
      const d = distance(position, center);
      const noisyRadius = maybeNoisyBoundary(radius, noiseAmplitude, rng);
      const inside = shell ? Math.abs(d - noisyRadius) <= width : d <= noisyRadius;
      if (inside) addCell(cells, position, multiple ? 1 + (index % 3) : species);
    });
  });
  return { cells: finalizeCells(cells) };
}

function domainWall({ board, params = {}, rng, rough = false, doubleWall = false, sinusoidal = false }) {
  const size = boardSize(board);
  const cells = new Map();
  const center = centerOf(size);
  const angle = numberParam(params, 'angle', 0, -Math.PI, Math.PI);
  const width = numberParam(params, 'width', 2, 1, Math.max(...size));
  const amplitude = rough ? numberParam(params, 'boundaryRoughness', 2, 0, 8) : 0;
  const frequency = 2 * Math.PI / Math.max(1, Math.min(size[0], size[1] || size[0]) * 0.55);
  forEachPosition(size, (position) => {
    let boundary = lineSignedDistance(position, center, angle);
    if (sinusoidal) boundary += Math.sin((position[0] || 0) * frequency) * width * 1.5;
    boundary = maybeNoisyBoundary(boundary, amplitude, rng);
    if (doubleWall) {
      const phase = Math.abs(boundary) < width * 2 ? 2 : 1;
      addCell(cells, position, phase);
    } else {
      addCell(cells, position, boundary < 0 ? 1 : 2);
    }
  });
  return { cells: finalizeCells(cells) };
}

function stripes({ board, params = {}, angle = 0 }) {
  const size = boardSize(board);
  const cells = new Map();
  const center = centerOf(size);
  const width = numberParam(params, 'width', 4, 1, Math.max(...size));
  forEachPosition(size, (position) => {
    const species = stripeValue(position, center, angle, width) % 2 === 0 ? 1 : 2;
    addCell(cells, position, species);
  });
  return { cells: finalizeCells(cells) };
}

function radialGradient({ board, params = {}, rng }) {
  const size = boardSize(board);
  const cells = new Map();
  const center = centerOf(size);
  const maxRadius = Math.max(1, Math.min(...size) * 0.5);
  const density = numberParam(params, 'density', 0.95, 0, 1);
  forEachPosition(size, (position) => {
    const d = distance(position, center);
    const p = Math.max(0, 1 - d / maxRadius) * density;
    if (rng() <= p) addCell(cells, position, d < maxRadius * 0.5 ? 1 : 2);
  });
  return { cells: finalizeCells(cells) };
}

function checker({ board, params = {}, phase = 0 }) {
  const size = boardSize(board);
  const cells = new Map();
  const density = numberParam(params, 'density', 1, 0, 1);
  forEachPosition(size, (position) => {
    const parity = position.reduce((sum, value) => sum + value, phase) % 2;
    if (density >= 1 || parity === 0) addCell(cells, position, parity === 0 ? 1 : 2);
  });
  return { cells: finalizeCells(cells) };
}

function latticePatch({ board, params = {}, period = 3, species = 1 }) {
  const size = boardSize(board);
  const center = centerOf(size);
  const radius = numberParam(params, 'radius', Math.min(...size) * 0.28, 1, Math.max(...size));
  const cells = new Map();
  forEachPosition(size, (position) => {
    if (distance(position, center) > radius) return;
    if (position.reduce((sum, value) => sum + value, 0) % period === 0) addCell(cells, position, species);
  });
  return { cells: finalizeCells(cells) };
}

function wavefront({ board, params = {}, ring = false, target = false }) {
  const size = boardSize(board);
  const center = centerOf(size);
  const radius = numberParam(params, 'radius', Math.min(...size) * 0.28, 1, Math.max(...size));
  const width = numberParam(params, 'width', 2, 1, Math.max(...size));
  const cells = new Map();
  forEachPosition(size, (position) => {
    const d = distance(position, center);
    if (ring || target) {
      const band = Math.floor(d / Math.max(1, width * 2));
      if (Math.abs(d - radius) <= width || (target && band % 2 === 0 && d <= radius * 1.6)) addCell(cells, position, 1 + (band % 2));
    } else if (Math.abs(d - radius) <= width) {
      addCell(cells, position, 1);
    }
  });
  return { cells: finalizeCells(cells) };
}

function glider({ board }) {
  const size = boardSize(board);
  const center = centerOf(size);
  const cells = new Map();
  [[1, -1], [2, 0], [0, 1], [1, 1], [2, 1]].forEach(([dx, dy]) => {
    const position = wrapPosition([center[0] + dx, center[1] + dy], size);
    addCell(cells, position, 1);
  });
  return { cells: finalizeCells(cells) };
}

function ecologyPatch({ board, params = {}, kind = 'predator_prey_patch', rng }) {
  const size = boardSize(board);
  const cells = new Map();
  const center = centerOf(size);
  const radius = numberParam(params, 'radius', Math.min(...size) * 0.22, 1, Math.max(...size));
  forEachPosition(size, (position) => {
    const d = distance(position, center);
    if (d > radius) return;
    if (kind === 'infection_spot') addCell(cells, position, d < radius * 0.35 ? 2 : 1);
    else if (kind === 'immune_barrier') addCell(cells, position, Math.abs(d - radius * 0.65) < 1.5 ? 3 : 1);
    else if (kind === 'forest_fire_line') addCell(cells, position, Math.abs(position[0] - center[0]) < 1 ? 2 : 1);
    else if (kind === 'invasion_front') addCell(cells, position, position[0] < center[0] ? 1 : 2);
    else if (kind === 'nutrient_patch') addCell(cells, position, 1);
    else addCell(cells, position, rng() < 0.18 ? 2 : 1);
  });
  return { cells: finalizeCells(cells) };
}

function boardSites(board) {
  const size = boardSize(board);
  const sites = [];
  forEachPosition(size, (position) => sites.push(position));
  return sites;
}

function boardEdges(board) {
  const size = boardSize(board);
  const edges = [];
  const seen = new Set();
  forEachPosition(size, (position) => {
    const directions = size.length >= 3 ? [[1, 0, 0], [0, 1, 0], [0, 0, 1]] : [[1, 0], [0, 1]];
    for (const direction of directions) {
      const target = position.map((value, axis) => value + (direction[axis] || 0));
      if (!inBounds(target, size)) continue;
      const key = `${position.join(',')}|${target.join(',')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([position, target]);
    }
  });
  return edges;
}

function defectInitial({ board, params = {}, rng, type }) {
  const size = boardSize(board);
  const center = centerOf(size);
  const sites = boardSites(board);
  const edges = boardEdges(board);
  const radius = numberParam(params, 'radius', Math.min(...size) * 0.16, 1, Math.max(...size));
  const seed = params.seed || Math.floor(rng() * 0x7fffffff);
  const cells = droplet({ board, params: { ...params, radius: radius * 1.8 }, rng }).cells;

  if (type === 'vacancy_cluster_initial') {
    return {
      cells,
      defects: [generateVacancyCluster({ center, radius, density: 0.82, seed, sites })]
    };
  }
  if (type === 'defect_pair') {
    const a = center.map((value, axis) => value + (axis === 0 ? -radius : 0));
    const b = center.map((value, axis) => value + (axis === 0 ? radius : 0));
    return {
      cells,
      defects: [
        generateInclusion({ id: `defect_pair:left:${seed}`, center: a, radius: Math.max(1, radius * 0.45), modifierType: 'impurity', ruleModifier: { birthBias: -1 }, sites }),
        generateInclusion({ id: `defect_pair:right:${seed}`, center: b, radius: Math.max(1, radius * 0.45), modifierType: 'impurity', ruleModifier: { birthBias: 1 }, sites })
      ]
    };
  }
  if (type === 'dislocation_dipole_2d') {
    return {
      cells,
      defects: [
        generateEdgeDislocation2D({ id: `dislocation_dipole:left:${seed}`, core: [center[0] - radius, center[1]], burgersVector: [1, 0], halfPlaneLength: radius * 2, sites, edges }),
        generateEdgeDislocation2D({ id: `dislocation_dipole:right:${seed}`, core: [center[0] + radius, center[1]], burgersVector: [-1, 0], halfPlaneLength: radius * 2, sites, edges })
      ]
    };
  }
  if (type === 'crack_seed') {
    return {
      cells,
      defects: [generateCrackLine({ start: [center[0] - radius, center[1]], end: [center[0] + radius, center[1]], thickness: 0.7, seed, sites, edges })]
    };
  }
  if (type === 'grain_boundary_seed') {
    return {
      cells: domainWall({ board, params, rng, rough: true }).cells,
      defects: [generateGrainBoundary({ lineOrPlane: { point: center, normal: [1, 0] }, interactionStrength: 0.35, sites, edges })]
    };
  }
  return {
    cells,
    defects: [generateRandomDefectField({ densityVacancy: 0.02, densityImpurity: 0.02, densityPinned: 0.01, seed, sites })]
  };
}

function makePattern(definition) {
  return Object.freeze({
    schema: LIFE_INITIAL_PATTERN_SCHEMA,
    supportedDimensions: [1, 2, 3, 4],
    supportedNeighborhoods: ['any'],
    supportedSpeciesModes: ['single', 'multi', 'ecology'],
    parameters: {},
    simple: SIMPLE_PATTERN_IDS.has(definition.id),
    ...definition
  });
}

export const LIFE_INITIAL_PATTERNS = Object.freeze([
  makePattern({ id: 'random_uniform', category: 'random_noise', nameEn: 'Random Uniform', nameZh: '均勻隨機', descriptionEn: 'Seed cells independently with a fixed density.', descriptionZh: '用固定密度獨立播種細胞。', generate: randomFill }),
  makePattern({ id: 'random_clustered', category: 'random_noise', nameEn: 'Clustered Random', nameZh: '團簇隨機', descriptionEn: 'Seed several correlated random clusters.', descriptionZh: '播種數個相關的隨機團簇。', generate: clusterFill }),
  makePattern({ id: 'random_species_mixture', category: 'random_noise', nameEn: 'Random Species Mixture', nameZh: '隨機物種混合', descriptionEn: 'Random cells with multiple species labels.', descriptionZh: '用多物種標籤建立隨機細胞。', parameters: { species: 3, density: 0.24 }, generate: ({ board, params, rng }) => randomFill({ board, params: { density: 0.24, species: 3, ...params }, rng }) }),
  makePattern({ id: 'random_low_density', category: 'random_noise', nameEn: 'Low-Density Random', nameZh: '低密度隨機', descriptionEn: 'Sparse random seeds for long survival tests.', descriptionZh: '稀疏隨機種子，用於長時間存活測試。', generate: ({ board, params, rng }) => randomFill({ board, params: { density: 0.06, ...params }, rng }) }),
  makePattern({ id: 'random_high_density', category: 'random_noise', nameEn: 'High-Density Random', nameZh: '高密度隨機', descriptionEn: 'Dense random state for collapse and coarsening tests.', descriptionZh: '高密度隨機初態，用於崩塌與粗化測試。', generate: ({ board, params, rng }) => randomFill({ board, params: { density: 0.38, ...params }, rng }) }),

  makePattern({ id: 'single_seed', category: 'seeds_colonies', nameEn: 'Single Seed', nameZh: '單一種子', descriptionEn: 'Place one live cell at the board center.', descriptionZh: '在棋盤中心放置一個活細胞。', generate: ({ board, params }) => ({ cells: [{ position: centerOf(boardSize(board)), state: 1, species: intParam(params, 'species', 1, 1, 8), age: 1, energy: 1, health: 1 }] }) }),
  makePattern({ id: 'finite_seed', category: 'seeds_colonies', nameEn: 'Finite Seed', nameZh: '有限種子', descriptionEn: 'A small plus-shaped finite seed.', descriptionZh: '小型十字形有限種子。', generate: ({ board, params }) => { const size = boardSize(board); const c = centerOf(size); const cells = new Map(); [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach((d) => addCell(cells, wrapPosition(c.map((v, i) => v + (d[i] || 0)), size), intParam(params, 'species', 1, 1, 8))); return { cells: finalizeCells(cells) }; } }),
  makePattern({ id: 'localized_colony', category: 'seeds_colonies', nameEn: 'Localized Colony', nameZh: '局部群落', descriptionEn: 'A compact colony around the center.', descriptionZh: '中心附近的緊湊群落。', generate: colony }),
  makePattern({ id: 'multi_colony', category: 'seeds_colonies', nameEn: 'Multiple Colonies', nameZh: '多群落', descriptionEn: 'Several separated colonies with different species.', descriptionZh: '多個分離且物種不同的群落。', generate: (args) => colony({ ...args, multi: true }) }),
  makePattern({ id: 'glider_known', category: 'seeds_colonies', nameEn: 'Glider / Known Pattern', nameZh: '滑翔機 / 已知圖樣', descriptionEn: 'Classic five-cell glider on compatible 2D boards.', descriptionZh: '相容 2D 棋盤上的經典五細胞滑翔機。', supportedDimensions: [2], supportedNeighborhoods: ['moore'], generate: glider }),

  makePattern({ id: 'circular_droplet_2d', category: 'droplets', nameEn: 'Droplet', nameZh: '液滴', descriptionEn: 'A filled circular phase droplet.', descriptionZh: '填滿的圓形相液滴。', supportedDimensions: [2], generate: droplet }),
  makePattern({ id: 'spherical_droplet_3d', category: 'droplets', nameEn: 'Spherical Droplet', nameZh: '球形液滴', descriptionEn: 'A filled spherical droplet in a 3D volume.', descriptionZh: '3D 體積中的填滿球形液滴。', supportedDimensions: [3], generate: droplet }),
  makePattern({ id: 'annular_droplet', category: 'droplets', nameEn: 'Annular Droplet', nameZh: '環狀液滴', descriptionEn: 'A shell or annulus of living cells.', descriptionZh: '活細胞形成的殼層或環帶。', supportedDimensions: [2, 3], generate: (args) => droplet({ ...args, shell: true }) }),
  makePattern({ id: 'multi_droplet', category: 'droplets', nameEn: 'Multiple Droplets', nameZh: '多液滴', descriptionEn: 'Several separated phase droplets.', descriptionZh: '多個分離的相液滴。', supportedDimensions: [2, 3], generate: (args) => droplet({ ...args, multiple: true }) }),
  makePattern({ id: 'noisy_droplet_boundary', category: 'droplets', nameEn: 'Noisy Droplet Boundary', nameZh: '噪聲液滴邊界', descriptionEn: 'A droplet with a rough stochastic boundary.', descriptionZh: '具有粗糙隨機邊界的液滴。', supportedDimensions: [2, 3], generate: (args) => droplet({ ...args, noisy: true }) }),

  makePattern({ id: 'straight_domain_wall', category: 'domain_walls', nameEn: 'Domain Wall', nameZh: '相域牆', descriptionEn: 'Two phases separated by a straight interface.', descriptionZh: '兩個相由直線界面分隔。', supportedDimensions: [2, 3], generate: domainWall }),
  makePattern({ id: 'tilted_domain_wall', category: 'domain_walls', nameEn: 'Tilted Domain Wall', nameZh: '傾斜相域牆', descriptionEn: 'Two phases separated by a tilted wall.', descriptionZh: '兩相由傾斜相域牆分隔。', supportedDimensions: [2, 3], generate: ({ board, params, rng }) => domainWall({ board, params: { angle: Math.PI / 5, ...params }, rng }) }),
  makePattern({ id: 'sinusoidal_domain_wall', category: 'domain_walls', nameEn: 'Sinusoidal Domain Wall', nameZh: '正弦相域牆', descriptionEn: 'A wavy interface between two phases.', descriptionZh: '兩相之間的波浪形界面。', supportedDimensions: [2], generate: (args) => domainWall({ ...args, sinusoidal: true }) }),
  makePattern({ id: 'rough_domain_wall', category: 'domain_walls', nameEn: 'Rough Domain Wall', nameZh: '粗糙相域牆', descriptionEn: 'A noisy interface for roughening tests.', descriptionZh: '用於粗糙化測試的噪聲界面。', supportedDimensions: [2, 3], generate: (args) => domainWall({ ...args, rough: true }) }),
  makePattern({ id: 'double_domain_wall', category: 'domain_walls', nameEn: 'Double Domain Wall', nameZh: '雙相域牆', descriptionEn: 'A thin middle phase between two domains.', descriptionZh: '兩個相域之間夾著薄中間相。', supportedDimensions: [2, 3], generate: (args) => domainWall({ ...args, doubleWall: true }) }),
  makePattern({ id: 'phase_interface', category: 'domain_walls', nameEn: 'Phase Interface', nameZh: '相界面', descriptionEn: 'A generic A/B phase interface.', descriptionZh: '一般 A/B 相界面。', supportedDimensions: [2, 3], generate: domainWall }),

  makePattern({ id: 'vertical_stripes', category: 'stripes', nameEn: 'Stripe', nameZh: '條紋', descriptionEn: 'Vertical alternating phase stripes.', descriptionZh: '垂直交替相條紋。', supportedDimensions: [2, 3], generate: (args) => stripes({ ...args, angle: 0 }) }),
  makePattern({ id: 'horizontal_stripes', category: 'stripes', nameEn: 'Horizontal Stripes', nameZh: '水平條紋', descriptionEn: 'Horizontal alternating phase stripes.', descriptionZh: '水平交替相條紋。', supportedDimensions: [2, 3], generate: (args) => stripes({ ...args, angle: Math.PI / 2 }) }),
  makePattern({ id: 'diagonal_stripes', category: 'stripes', nameEn: 'Diagonal Stripes', nameZh: '對角條紋', descriptionEn: 'Diagonal alternating phase stripes.', descriptionZh: '對角交替相條紋。', supportedDimensions: [2, 3], generate: (args) => stripes({ ...args, angle: Math.PI / 4 }) }),
  makePattern({ id: 'alternating_lamellae', category: 'stripes', nameEn: 'Alternating Lamellae', nameZh: '交替層狀', descriptionEn: 'Wide alternating lamellar bands.', descriptionZh: '寬交替層狀帶。', supportedDimensions: [2, 3], generate: ({ board, params, rng }) => stripes({ board, params: { width: 7, ...params }, rng, angle: Math.PI / 8 }) }),

  makePattern({ id: 'ring_front', category: 'rings_fronts', nameEn: 'Ring Front', nameZh: '環形前沿', descriptionEn: 'A circular ring of active cells.', descriptionZh: '活細胞形成的圓形環前沿。', supportedDimensions: [2, 3], generate: (args) => wavefront({ ...args, ring: true }) }),
  makePattern({ id: 'expanding_wavefront', category: 'rings_fronts', nameEn: 'Wavefront', nameZh: '波前', descriptionEn: 'A front-like shell around a quiet interior.', descriptionZh: '安靜內部周圍的前沿殼層。', supportedDimensions: [2, 3], generate: wavefront }),
  makePattern({ id: 'radial_gradient', category: 'rings_fronts', nameEn: 'Radial Gradient', nameZh: '徑向梯度', descriptionEn: 'Density and species change radially.', descriptionZh: '密度與物種沿徑向改變。', supportedDimensions: [2, 3], generate: radialGradient }),
  makePattern({ id: 'target_pattern', category: 'rings_fronts', nameEn: 'Target Pattern', nameZh: '靶形圖樣', descriptionEn: 'Concentric alternating bands.', descriptionZh: '同心交替環帶。', supportedDimensions: [2, 3], generate: (args) => wavefront({ ...args, target: true }) }),

  makePattern({ id: 'checkerboard', category: 'crystal_lattice', nameEn: 'Checker / Domain Mixture', nameZh: '棋盤 / 相域混合', descriptionEn: 'Alternating sublattice state.', descriptionZh: '交替子晶格狀態。', generate: checker }),
  makePattern({ id: 'triangular_seed', category: 'crystal_lattice', nameEn: 'Triangular Seed', nameZh: '三角種子', descriptionEn: 'A period-3 triangular-style patch.', descriptionZh: '週期 3 的三角風格片區。', supportedDimensions: [2], generate: (args) => latticePatch({ ...args, period: 3 }) }),
  makePattern({ id: 'hex_seed', category: 'crystal_lattice', nameEn: 'Hex Seed', nameZh: '六角種子', descriptionEn: 'A hex-like periodic patch.', descriptionZh: '六角風格的週期片區。', supportedDimensions: [2], generate: (args) => latticePatch({ ...args, period: 2 }) }),
  makePattern({ id: 'crystal_patch', category: 'crystal_lattice', nameEn: 'Crystal Patch', nameZh: '晶體片區', descriptionEn: 'A finite ordered crystal-like patch.', descriptionZh: '有限有序晶體狀片區。', supportedDimensions: [2, 3], generate: (args) => latticePatch({ ...args, period: 2 }) }),
  makePattern({ id: 'sublattice_pattern', category: 'crystal_lattice', nameEn: 'Sublattice Pattern', nameZh: '子晶格圖樣', descriptionEn: 'Only selected sublattice sites are occupied.', descriptionZh: '只佔據部分子晶格。', generate: (args) => latticePatch({ ...args, period: 4 }) }),

  makePattern({ id: 'vacancy_cluster_initial', category: 'defects', nameEn: 'Vacancy Cluster', nameZh: '空位團簇', descriptionEn: 'A droplet with a blocked vacancy cluster.', descriptionZh: '帶有阻塞空位團簇的液滴。', supportedDimensions: [2, 3], generate: (args) => defectInitial({ ...args, type: 'vacancy_cluster_initial' }) }),
  makePattern({ id: 'defect_pair', category: 'defects', nameEn: 'Defect Pair', nameZh: '缺陷對', descriptionEn: 'Two separated local defect centers.', descriptionZh: '兩個分離的局部缺陷中心。', supportedDimensions: [2, 3], generate: (args) => defectInitial({ ...args, type: 'defect_pair' }) }),
  makePattern({ id: 'dislocation_dipole_2d', category: 'defects', nameEn: 'Dislocation Dipole', nameZh: '位錯偶極', descriptionEn: 'Approximate opposite edge dislocation cores.', descriptionZh: '近似的相反邊緣位錯核心。', supportedDimensions: [2], generate: (args) => defectInitial({ ...args, type: 'dislocation_dipole_2d' }) }),
  makePattern({ id: 'crack_seed', category: 'defects', nameEn: 'Crack Seed', nameZh: '裂縫種子', descriptionEn: 'A broken interaction line through a seeded droplet.', descriptionZh: '穿過播種液滴的斷裂互動線。', supportedDimensions: [2, 3], generate: (args) => defectInitial({ ...args, type: 'crack_seed' }) }),
  makePattern({ id: 'grain_boundary_seed', category: 'defects', nameEn: 'Grain Boundary Seed', nameZh: '晶界種子', descriptionEn: 'Two phases divided by a weak grain boundary.', descriptionZh: '兩相由弱互動晶界分隔。', supportedDimensions: [2, 3], generate: (args) => defectInitial({ ...args, type: 'grain_boundary_seed' }) }),
  makePattern({ id: 'impurity_patch', category: 'defects', nameEn: 'Impurity Patch', nameZh: '雜質片區', descriptionEn: 'A local region with modified rule tags.', descriptionZh: '具有局部規則標記的雜質區。', supportedDimensions: [2, 3], generate: (args) => defectInitial({ ...args, type: 'impurity_patch' }) }),

  makePattern({ id: 'predator_prey_patch', category: 'ecology_biology', nameEn: 'Predator-Prey Patch', nameZh: '捕食者-獵物片區', descriptionEn: 'Mixed prey and predator colonies.', descriptionZh: '混合獵物與捕食者群落。', supportedSpeciesModes: ['ecology', 'multi'], generate: (args) => ecologyPatch({ ...args, kind: 'predator_prey_patch' }) }),
  makePattern({ id: 'nutrient_patch', category: 'ecology_biology', nameEn: 'Nutrient Patch', nameZh: '營養區', descriptionEn: 'A dense growth-friendly patch.', descriptionZh: '有利於成長的高密度片區。', generate: (args) => ecologyPatch({ ...args, kind: 'nutrient_patch' }) }),
  makePattern({ id: 'infection_spot', category: 'ecology_biology', nameEn: 'Infection Spot', nameZh: '感染點', descriptionEn: 'Infected cells in a susceptible colony.', descriptionZh: '易感群落中的感染點。', supportedSpeciesModes: ['ecology', 'multi'], generate: (args) => ecologyPatch({ ...args, kind: 'infection_spot' }) }),
  makePattern({ id: 'immune_barrier', category: 'ecology_biology', nameEn: 'Immune Barrier', nameZh: '免疫屏障', descriptionEn: 'Recovered/immune cells form a barrier.', descriptionZh: '恢復或免疫細胞形成屏障。', supportedSpeciesModes: ['ecology', 'multi'], generate: (args) => ecologyPatch({ ...args, kind: 'immune_barrier' }) }),
  makePattern({ id: 'forest_fire_line', category: 'ecology_biology', nameEn: 'Forest Fire Line', nameZh: '森林火線', descriptionEn: 'A burning line inside a tree patch.', descriptionZh: '樹林片區中的燃燒線。', supportedSpeciesModes: ['ecology', 'multi'], generate: (args) => ecologyPatch({ ...args, kind: 'forest_fire_line' }) }),
  makePattern({ id: 'invasion_front', category: 'ecology_biology', nameEn: 'Invasion Front', nameZh: '入侵前沿', descriptionEn: 'Two species meet at an invasion front.', descriptionZh: '兩物種在入侵前沿相遇。', supportedSpeciesModes: ['multi'], generate: (args) => ecologyPatch({ ...args, kind: 'invasion_front' }) }),

  makePattern({ id: 'phase_A_B_droplet', category: 'lab_inspired', nameEn: 'Phase A/B Droplet', nameZh: 'A/B 相液滴', descriptionEn: 'A phase-A droplet inside phase B.', descriptionZh: 'B 相中的 A 相液滴。', supportedSpeciesModes: ['multi'], generate: ({ board, params, rng }) => ({ cells: [...domainWall({ board, params, rng }).cells, ...droplet({ board, params: { ...params, species: 1 }, rng }).cells] }) }),
  makePattern({ id: 'phase_domain_wall', category: 'lab_inspired', nameEn: 'Phase Domain Wall', nameZh: '相域牆', descriptionEn: 'Lab-style two-phase wall initial condition.', descriptionZh: 'Labs 風格的雙相相域牆初態。', supportedSpeciesModes: ['multi'], generate: domainWall }),
  makePattern({ id: 'operator_seed_pattern', category: 'lab_inspired', nameEn: 'Operator Seed Pattern', nameZh: '算子種子圖樣', descriptionEn: 'Sparse marked operator-like seeds.', descriptionZh: '稀疏的算子風格標記種子。', generate: ({ board, params, rng }) => randomFill({ board, params: { density: 0.04, species: 3, ...params }, rng }) }),
  makePattern({ id: 'reaction_front', category: 'lab_inspired', nameEn: 'Reaction Front', nameZh: '反應前沿', descriptionEn: 'A/B species reaction front.', descriptionZh: 'A/B 物種反應前沿。', supportedSpeciesModes: ['multi'], generate: (args) => ecologyPatch({ ...args, kind: 'invasion_front' }) }),
  makePattern({ id: 'pinning_center_array', category: 'lab_inspired', nameEn: 'Pinning Center Array', nameZh: '釘扎中心陣列', descriptionEn: 'Periodic pinned centers inside a seeded phase.', descriptionZh: '播種相中的週期釘扎中心。', generate: ({ board, params, rng }) => { const base = latticePatch({ board, params: { ...params, period: 5 }, rng }); const sites = base.cells.map((cell) => cell.position); return { cells: droplet({ board, params, rng }).cells, defects: [generateRandomDefectField({ densityPinned: 0.03, seed: params.seed || 1, sites })] }; } })
]);

export function getLifeInitialPattern(id) {
  return LIFE_INITIAL_PATTERNS.find((pattern) => pattern.id === id) || LIFE_INITIAL_PATTERNS[0];
}

export function listLifeInitialPatterns({ category = 'all', simpleOnly = false, dimension = null } = {}) {
  return LIFE_INITIAL_PATTERNS.filter((pattern) => {
    if (simpleOnly && !pattern.simple) return false;
    if (category !== 'all' && pattern.category !== category) return false;
    if (dimension != null && !pattern.supportedDimensions.includes(Number(dimension))) return false;
    return true;
  });
}

export function lifeInitialPatternName(pattern, language = 'en') {
  return language === 'zh' ? pattern.nameZh : pattern.nameEn;
}

export function lifeInitialPatternDescription(pattern, language = 'en') {
  return language === 'zh' ? pattern.descriptionZh : pattern.descriptionEn;
}

export function generateLifeInitialPattern(patternId, { board, params = {}, rng = null } = {}) {
  const pattern = getLifeInitialPattern(patternId);
  const seed = params.seed ?? 1;
  const generatorRng = rng || createSeededRng(seed);
  const generated = pattern.generate({
    board,
    params: { ...pattern.parameters, ...params, seed },
    rng: generatorRng
  });
  const defectLayer = generated.defectLayer || (generated.defects?.length
    ? generated.defects.reduce((layer, defect) => {
      addDefect(layer, defect);
      return layer;
    }, createDefectLayer({ enabled: false, metadata: { sourcePatternId: pattern.id } }))
    : null);
  return {
    schema: LIFE_INITIAL_PATTERN_SCHEMA,
    patternId: pattern.id,
    generatedAt: new Date().toISOString(),
    params: { ...pattern.parameters, ...params, seed },
    ...generated,
    defectLayer
  };
}
