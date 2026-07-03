import { createLifeEngine, isAlive } from './LifeEngine.js';
import { listRulePresets, getRulePreset, rulePresetLabel } from './presets.js';
import {
  LIFE_MODES,
  LIFE_GEOMETRIES,
  LIFE_LATTICES,
  findLifeMode,
  findLifeGeometry,
  latticesForGeometry,
  modeTitle,
  modeLong,
  modeTags,
  geometryTitle,
  latticeTitle,
  geometryInfo
} from '../life-data.js';
import { currentLifeLanguage, localizeStaticText, syncLifeLinks, t } from './i18n.js';
import { FirebaseStateNetworkManager } from '../../js/FirebaseStateNetworkManager.js';

const COLORS = { 1: '#38bdf8', 2: '#ef4444', 3: '#22c55e', 4: '#f5b647' };
const SQRT3 = Math.sqrt(3);
const TAU = Math.PI * 2;
const LATTICE_RULE_TUNING = Object.freeze({
  triangular: { rule: 'B2/S12', birth: [2], survival: [1, 2], neighborhoodType: 'nearest', latticeNeighborCount: 3 },
  honeycomb: { rule: 'B2/S34', birth: [2], survival: [3, 4], neighborhoodType: 'nearest', latticeNeighborCount: 6 }
});
const BOARD_OPACITY_LEVELS = Object.freeze([1, 0.7, 0.35, 0]);
const BOARD_OPACITY_KEYS = Object.freeze(['boardOpacity100', 'boardOpacity70', 'boardOpacity35', 'boardOpacity0']);
const LIFE_CONTROL_TAB_STORAGE_KEY = 'topoboard-life-world-control-view';
const EXPERIMENT_NOTEBOOK_STORAGE_KEY = 'topoboard-life-world-experiment-notebook';
const R3_BOUNDARY_OPTIONS = Object.freeze([
  { value: 'open', labelKey: 'r3BoundaryOpen', infoId: 'r3' },
  { value: 'torus', labelKey: 'r3BoundaryPeriodic', infoId: 't3' },
  { value: 'random', labelKey: 'r3BoundaryRandom', infoId: 'r3_random' }
]);
const LEGACY_3D_GEOMETRY_BOUNDARY = Object.freeze({
  r3: 'open',
  t3: 'torus',
  r3_random: 'random'
});
const LATTICE_NEIGHBOR_COUNTS = Object.freeze({
  square: 4,
  triangular: 3,
  honeycomb: 6,
  sc: 6,
  bcc: 8,
  fcc: 12,
  hcp: 12
});
const NEIGHBORHOOD_METRIC_TO_TYPE = Object.freeze({
  chebyshev: 'moore',
  manhattan: 'von_neumann',
  euclidean: 'euclidean',
  lattice: 'nearest'
});
const NEIGHBORHOOD_TYPE_TO_METRIC = Object.freeze({
  moore: 'chebyshev',
  nearest: 'lattice',
  lattice: 'lattice',
  von_neumann: 'manhattan',
  vonneumann: 'manhattan',
  'von-neumann': 'manhattan',
  euclidean: 'euclidean'
});
const LIFE_PATTERN_LIBRARY = Object.freeze([
  {
    id: 'single-cell',
    nameKey: 'patternSingleCell',
    descriptionKey: 'patternSingleCellDesc',
    dimensions: [1, 2, 3, 4],
    neighborhoods: ['any'],
    offsets: [[0, 0, 0, 0]]
  },
  {
    id: 'block',
    nameKey: 'patternBlock',
    descriptionKey: 'patternBlockDesc',
    dimensions: [2],
    neighborhoods: ['moore'],
    offsets: [[0, 0], [1, 0], [0, 1], [1, 1]]
  },
  {
    id: 'blinker',
    nameKey: 'patternBlinker',
    descriptionKey: 'patternBlinkerDesc',
    dimensions: [2],
    neighborhoods: ['moore'],
    offsets: [[-1, 0], [0, 0], [1, 0]]
  },
  {
    id: 'glider',
    nameKey: 'patternGlider',
    descriptionKey: 'patternGliderDesc',
    dimensions: [2],
    neighborhoods: ['moore'],
    offsets: [[1, -1], [2, 0], [0, 1], [1, 1], [2, 1]]
  },
  {
    id: 'lwss',
    nameKey: 'patternLwss',
    descriptionKey: 'patternLwssDesc',
    dimensions: [2],
    neighborhoods: ['moore'],
    offsets: [[-2, -1], [1, -1], [-3, 0], [-3, 1], [1, 1], [-3, 2], [-2, 2], [-1, 2], [0, 2]]
  },
  {
    id: 'random-cloud',
    nameKey: 'patternRandomCloud',
    descriptionKey: 'patternRandomCloudDesc',
    dimensions: [1, 2, 3, 4],
    neighborhoods: ['any'],
    randomCloud: true
  },
  {
    id: 'two-species-battle',
    nameKey: 'patternTwoSpeciesBattle',
    descriptionKey: 'patternTwoSpeciesBattleDesc',
    dimensions: [2],
    neighborhoods: ['any'],
    offsets: [
      [-3, -1, 1], [-2, -1, 1], [-3, 0, 1], [-2, 0, 1], [-3, 1, 1],
      [2, -1, 2], [3, -1, 2], [2, 0, 2], [3, 0, 2], [3, 1, 2]
    ]
  }
]);
const TOPOLOGY_COMPARE_GEOMETRY_IDS = Object.freeze(['r2', 't2_flat', 'cylinder', 't2', 'mobius', 'klein', 'klein_surface', 'sphere', 'rp2']);
const TOPOLOGY_COMPARE_DEFAULT_GEOMETRIES = Object.freeze(['r2', 't2_flat', 'cylinder', 'mobius']);
function r3BoundaryInfoId(boundary = 'open') {
  return R3_BOUNDARY_OPTIONS.find((option) => option.value === boundary)?.infoId || 'r3';
}

function legacyGeometryBoundary(geometryId, fallback = 'open') {
  return LEGACY_3D_GEOMETRY_BOUNDARY[String(geometryId || '')] || fallback;
}

const LIFE_WORLD_EXTRA_I18N = Object.freeze({
  en: {
    controlTabsLabel: 'Life World control views',
    playTab: 'Play',
    researchTab: 'Research',
    customRuleDesigner: 'Custom Rule Designer',
    customRulePresetsLabel: 'Custom rule presets',
    presetConway: 'Conway Life B3/S23',
    presetHighLife: 'HighLife B36/S23',
    presetSeeds: 'Seeds B2/S',
    presetDayNight: 'Day & Night B3678/S34678',
    presetCustom: 'Custom',
    birthCounts: 'Birth counts',
    survivalCounts: 'Survival counts',
    ruleString: 'Rule',
    customRuleHelp: 'Use counts from the current neighborhood. Commas, spaces, ranges, or compact digits are accepted.',
    applyCustomRule: 'Apply custom rule',
    customRuleMax: 'Current neighborhood supports neighbor counts 0 to {max}.',
    customRuleApplied: 'Custom rule applied: {rule}',
    customRuleErrorSyntax: 'Use B/S notation such as B3/S23.',
    customRuleErrorToken: '{field} contains an invalid count: {token}.',
    customRuleErrorRange: '{field} counts must be between 0 and {max} for this neighborhood.',
    customRuleErrorEmpty: 'Enter at least one birth or survival count.',
    birthField: 'Birth',
    survivalField: 'Survival',
    patternLibrary: 'Pattern Library',
    pattern: 'Pattern',
    patternSingleCell: 'Single cell',
    patternSingleCellDesc: 'Place one live cell using the active species.',
    patternBlock: 'Block',
    patternBlockDesc: 'A small 2x2 still-life for classic 2D Moore Life.',
    patternBlinker: 'Blinker',
    patternBlinkerDesc: 'A three-cell oscillator that flips every generation in classic Moore Life.',
    patternGlider: 'Glider',
    patternGliderDesc: 'A five-cell moving pattern for Conway-style Moore Life.',
    patternLwss: 'Lightweight spaceship',
    patternLwssDesc: 'A larger moving spaceship pattern; shown only where classic 2D Moore behavior is available.',
    patternRandomCloud: 'Random cloud',
    patternRandomCloudDesc: 'Scatter a small local patch of random cells around the clicked location.',
    patternTwoSpeciesBattle: 'Two-species seed battle',
    patternTwoSpeciesBattleDesc: 'Place blue and red starter colonies facing each other.',
    patternDisabledSummary: 'Disabled here: {patterns}.',
    patternDisabledReason: 'This pattern needs {dimension} and {neighborhood}.',
    pattern2DMoore: '2D Moore/Chebyshev radius 1',
    pattern2D: '2D',
    patternAnyNeighborhood: 'any neighborhood',
    geometryTopology: 'Topology',
    geometryBoundary: 'Boundary',
    geometryRecommended: 'Recommended neighborhood',
    neighborhoodLab: 'Neighborhood Laboratory',
    neighborhoodPreviewLabel: 'Neighborhood preview',
    radius: 'Radius',
    metric: 'Metric',
    metricChebyshev: 'Moore / Chebyshev',
    metricManhattan: 'Von Neumann / Manhattan',
    metricEuclidean: 'Euclidean disk',
    metricLattice: 'Lattice nearest',
    neighborCount: 'Neighbor count: {count}',
    neighborhoodFallbackLattice: 'This lattice uses native nearest neighbors here, so the metric was changed to Lattice nearest.',
    neighborhoodFallbackRadius: 'Lattice nearest is fixed at radius 1, so radius was reset to 1.',
    neighborhoodPreviewUnavailable: 'Preview is shown for 2D neighborhoods; the engine still uses the listed neighbor count.'
  },
  zh: {
    controlTabsLabel: '生命世界控制分頁',
    playTab: '遊玩',
    researchTab: '研究',
    customRuleDesigner: '自訂規則設計器',
    customRulePresetsLabel: '自訂規則預設',
    presetConway: 'Conway Life B3/S23',
    presetHighLife: 'HighLife B36/S23',
    presetSeeds: 'Seeds B2/S',
    presetDayNight: 'Day & Night B3678/S34678',
    presetCustom: '自訂',
    birthCounts: '誕生鄰居數',
    survivalCounts: '存活鄰居數',
    ruleString: '規則',
    customRuleHelp: '依照目前鄰域輸入鄰居數；可用逗號、空格、範圍或連續數字。',
    applyCustomRule: '套用自訂規則',
    customRuleMax: '目前鄰域可使用的鄰居數是 0 到 {max}。',
    customRuleApplied: '已套用自訂規則：{rule}',
    customRuleErrorSyntax: '請使用 B/S 記法，例如 B3/S23。',
    customRuleErrorToken: '{field} 包含無效數字：{token}。',
    customRuleErrorRange: '{field} 的鄰居數必須在 0 到 {max} 之間。',
    customRuleErrorEmpty: '請至少輸入一個誕生或存活鄰居數。',
    birthField: '誕生',
    survivalField: '存活',
    patternLibrary: '圖樣庫',
    pattern: '圖樣',
    patternSingleCell: '單一細胞',
    patternSingleCellDesc: '用目前物種放置一個活細胞。',
    patternBlock: '方塊',
    patternBlockDesc: '經典 2D Moore Life 的 2x2 靜態圖樣。',
    patternBlinker: '閃爍器',
    patternBlinkerDesc: '在經典 Moore Life 中每代翻轉的三細胞振盪器。',
    patternGlider: '滑翔機',
    patternGliderDesc: 'Conway 風格 Moore Life 的五細胞移動圖樣。',
    patternLwss: '輕量太空船',
    patternLwssDesc: '較大的移動太空船圖樣；只在經典 2D Moore 行為可用時顯示。',
    patternRandomCloud: '隨機雲',
    patternRandomCloudDesc: '在點擊位置附近撒下一小片隨機細胞。',
    patternTwoSpeciesBattle: '雙物種種子戰',
    patternTwoSpeciesBattleDesc: '放置藍色與紅色起始群落，讓它們面對彼此。',
    patternDisabledSummary: '此處停用：{patterns}。',
    patternDisabledReason: '此圖樣需要 {dimension} 與 {neighborhood}。',
    pattern2DMoore: '2D Moore/Chebyshev 半徑 1',
    pattern2D: '2D',
    patternAnyNeighborhood: '任意鄰域',
    geometryTopology: '拓撲',
    geometryBoundary: '邊界',
    geometryRecommended: '建議鄰域',
    neighborhoodLab: '鄰域實驗室',
    neighborhoodPreviewLabel: '鄰域預覽',
    radius: '半徑',
    metric: '距離',
    metricChebyshev: 'Moore / Chebyshev',
    metricManhattan: 'Von Neumann / Manhattan',
    metricEuclidean: 'Euclidean disk',
    metricLattice: 'Lattice nearest',
    neighborCount: '鄰居數：{count}',
    neighborhoodFallbackLattice: '此格點在這裡使用原生最近鄰，因此距離已改為 Lattice nearest。',
    neighborhoodFallbackRadius: 'Lattice nearest 固定為半徑 1，因此半徑已重設為 1。',
    neighborhoodPreviewUnavailable: '預覽只顯示 2D 鄰域；引擎仍會使用列出的鄰居數。'
  }
});

function readParams() { return new URLSearchParams(window.location.search); }
function lifeWorldText(key, language = 'en', replacements = {}) {
  const table = LIFE_WORLD_EXTRA_I18N[language === 'zh' ? 'zh' : 'en'] || LIFE_WORLD_EXTRA_I18N.en;
  const fallback = LIFE_WORLD_EXTRA_I18N.en[key] || key;
  return Object.entries(replacements).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    table[key] || fallback
  );
}
function normalizeRuleCounts(counts = []) {
  return [...new Set((counts || [])
    .map((count) => Number(count))
    .filter((count) => Number.isInteger(count) && count >= 0))]
    .sort((a, b) => a - b);
}
function formatRuleCounts(counts = []) {
  const normalized = normalizeRuleCounts(counts);
  if (normalized.every((count) => count <= 9)) return normalized.join('');
  return normalized.join(',');
}
function parseCountListInput(value = '', maxNeighbors = 8, field = 'Count', language = 'en') {
  const text = String(value ?? '').trim();
  if (!text) return [];
  const compactNumber = /^\d+$/.test(text) ? Number(text) : NaN;
  const tokens = /[,\s]/.test(text)
    ? text.split(/[,\s]+/).filter(Boolean)
    : (/^\d+$/.test(text) && (maxNeighbors <= 9 || compactNumber > maxNeighbors) ? text.split('') : [text]);
  const counts = [];
  for (const token of tokens) {
    const rangeMatch = token.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
        throw new Error(lifeWorldText('customRuleErrorToken', language, { field, token }));
      }
      for (let count = start; count <= end; count += 1) counts.push(count);
      continue;
    }
    const count = Number(token);
    if (!Number.isInteger(count)) {
      throw new Error(lifeWorldText('customRuleErrorToken', language, { field, token }));
    }
    counts.push(count);
  }
  const normalized = normalizeRuleCounts(counts);
  if (normalized.some((count) => count > maxNeighbors)) {
    throw new Error(lifeWorldText('customRuleErrorRange', language, { field, max: maxNeighbors }));
  }
  return normalized;
}
export function parseLifeBSRule(ruleText = 'B3/S23', maxNeighbors = 8, language = 'en', birthField = 'Birth', survivalField = 'Survival') {
  const normalized = String(ruleText || '').toUpperCase().replace(/\s+/g, '');
  const birthIndex = normalized.indexOf('B');
  const survivalIndex = normalized.indexOf('S');
  if (birthIndex < 0 || survivalIndex < 0 || birthIndex > survivalIndex) {
    throw new Error(lifeWorldText('customRuleErrorSyntax', language));
  }
  const birthText = normalized.slice(birthIndex + 1, survivalIndex).replaceAll('/', '');
  const survivalText = normalized.slice(survivalIndex + 1).replaceAll('/', '');
  return {
    birth: parseCountListInput(birthText, maxNeighbors, birthField, language),
    survival: parseCountListInput(survivalText, maxNeighbors, survivalField, language)
  };
}
export function serializeLifeBSRule(rule = {}) {
  return `B${formatRuleCounts(rule.birth)}/S${formatRuleCounts(rule.survival)}`;
}
export function runLifeRuleDesignerSelfTest() {
  const cases = [
    ['B3/S23', 'B3/S23'],
    ['B36/S23', 'B36/S23'],
    ['B2/S', 'B2/S'],
    ['B4-6/S5,6,7', 'B456/S567'],
    ['B10,12/S11', 'B10,12/S11', 26]
  ];
  for (const [input, expected, max = 8] of cases) {
    const serialized = serializeLifeBSRule(parseLifeBSRule(input, max));
    if (serialized !== expected) throw new Error(`Rule designer self-test failed for ${input}: ${serialized}`);
  }
  return { ok: true, cases: cases.length };
}
function wrapAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}
function kleinBottleSurfacePoint(u, v) {
  const parameterU = wrapAngle(u);
  const parameterV = wrapAngle(v);
  const radial = 2
    + Math.cos(parameterU / 2) * Math.sin(parameterV)
    - Math.sin(parameterU / 2) * Math.sin(2 * parameterV);
  const rawX = radial * Math.cos(parameterU);
  const rawY = radial * Math.sin(parameterU);
  const rawZ = Math.sin(parameterU / 2) * Math.sin(parameterV)
    + Math.cos(parameterU / 2) * Math.sin(2 * parameterV);
  return {
    x: rawX * 0.49,
    y: rawZ * 0.5,
    z: rawY * 0.38
  };
}
function formatNumber(value, digits = 3) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (Math.abs(n) >= 1000) return String(Math.round(n));
  return n.toFixed(digits).replace(/\.?0+$/, '');
}
function compactObject(object = {}, digits = 2) {
  const entries = Object.entries(object);
  if (!entries.length) return '—';
  return entries.map(([key, value]) => `${key}:${formatNumber(value, digits)}`).join(' ');
}
function compactVector(values, digits = 2) {
  if (!Array.isArray(values) || !values.length) return '—';
  return `(${values.map((value) => formatNumber(value, digits)).join(', ')})`;
}
function compactBoundingBox(box, measure = 0) {
  if (!box?.min || !box?.max) return '—';
  const axes = ['x', 'y', 'z', 'w'];
  const ranges = box.min.map((value, axis) => `${axes[axis] || `a${axis}`}:${value}-${box.max[axis]}`);
  return `${ranges.join(' ')} | ${formatNumber(measure, 0)}`;
}
function formatPercent(value, digits = 1) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const percent = Number(value) * 100;
  const prefix = percent > 0 ? '+' : '';
  return `${prefix}${formatNumber(percent, digits)}%`;
}
function csvEscape(value) {
  if (value == null) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function exportTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
function createDeterministicRng(seed = 1) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
function hashAliveCells(engine) {
  const parts = [];
  for (let i = 0; i < engine.cells.length; i += 1) {
    const cell = engine.cells[i];
    if (!isAlive(cell)) continue;
    parts.push(`${i}:${cell.species || 1}`);
  }
  return parts.join('|');
}
function aliveShapeSignature2D(engine) {
  if (engine.dimension !== 2 || engine.topology?.boundary !== 'open') return null;
  const points = [];
  for (let i = 0; i < engine.cells.length; i += 1) {
    const cell = engine.cells[i];
    if (!isAlive(cell)) continue;
    const [x, y] = engine.positionFromIndex(i);
    points.push({ x, y, species: cell.species || 1 });
  }
  if (!points.length) return null;
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  const hash = points
    .map((point) => `${point.x - minX},${point.y - minY}:${point.species}`)
    .sort()
    .join('|');
  return {
    hash,
    min: [minX, minY],
    max: [maxX, maxY],
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    population: points.length
  };
}
function lifeRuleHasRandomness(rule = {}) {
  return [
    rule.birthNoise,
    rule.deathNoise,
    rule.environmentNoise,
    rule.ruleNoise,
    rule.topologyDefectNoise,
    rule.mutationRate,
    rule.agingDeathRate
  ].some((value) => Number(value || 0) > 0);
}
function centerOfMass(engine) {
  let total = 0;
  const sum = Array.from({ length: engine.dimension }, () => 0);
  for (let i = 0; i < engine.cells.length; i += 1) {
    const cell = engine.cells[i];
    if (!isAlive(cell)) continue;
    const position = engine.positionFromIndex(i);
    total += 1;
    for (let axis = 0; axis < engine.dimension; axis += 1) sum[axis] += position[axis];
  }
  return total ? sum.map((v) => v / total) : null;
}
function distance(a, b) {
  if (!a || !b) return 0;
  return Math.sqrt(a.reduce((sum, value, axis) => sum + (value - b[axis]) ** 2, 0));
}

function tuneRuleForLattice(rule, lattice, dimension) {
  const tuning = Number(dimension) === 2 ? LATTICE_RULE_TUNING[lattice] : null;
  if (!tuning || rule.type !== 'life-like') return rule;
  return {
    ...rule,
    rule: tuning.rule,
    birth: [...tuning.birth],
    survival: [...tuning.survival],
    neighborhoodType: tuning.neighborhoodType,
    latticeNeighborCount: tuning.latticeNeighborCount
  };
}

function compactLifeCell(cell = {}) {
  if (!isAlive(cell)) return 0;
  return [
    1,
    Number(cell.species || 1),
    Number(cell.age || 0),
    Number(cell.energy ?? 1),
    Number(cell.health ?? 1)
  ];
}

function expandLifeCell(value) {
  if (!value || value === 0) return { state: 0, species: 0, age: 0, energy: 0, health: 0 };
  if (Array.isArray(value)) {
    return {
      state: Number(value[0] || 0),
      species: Number(value[1] || 1),
      age: Number(value[2] || 0),
      energy: Number(value[3] ?? 1),
      health: Number(value[4] ?? 1)
    };
  }
  return value;
}

function geometryConfig(id) {
  const geometry = findLifeGeometry(id);
  return {
    id: geometry.id,
    dimension: geometry.dimension,
    boundary: geometry.topology,
    view: geometry.view,
    latticeSet: geometry.latticeSet
  };
}

function modeToEngineConfig(mode) {
  const geometry = geometryConfig(mode.geometry || (mode.dimensions === 3 ? 'r3' : 'r2'));
  const preset = mode.id === 'species-war' || mode.id === 'ecosystem-balance' ? 'multiSpecies'
    : mode.id.includes('voxel') || geometry.dimension === 3 ? 'life3dSoft'
    : 'conway';
  const rule = getRulePreset(preset);
  rule.speciesCount = mode.species || rule.speciesCount || 1;
  if (mode.mutation != null) rule.mutationRate = mode.mutation;
  return {
    dimension: geometry.dimension,
    size: geometry.dimension === 3 ? [32, 32, 5] : [32, 32],
    boundary: geometry.boundary,
    lattice: mode.lattice || (geometry.dimension === 3 ? 'sc' : 'square'),
    neighborhoodType: mode.neighborhoodType || (geometry.dimension === 3 ? 'von_neumann' : 'moore'),
    rule
  };
}

export class LifeUI {
  constructor(root = document) {
    this.root = root;
    this.language = currentLifeLanguage();
    this.canvas = root.getElementById('lifeCanvas');
    this.context = this.canvas.getContext('2d');

    this.controlPanel = root.querySelector('.life-control-panel');
    this.playTabButton = root.getElementById('lifePlayTab');
    this.researchTabButton = root.getElementById('lifeResearchTab');
    this.modeSelect = root.getElementById('modeSelect');
    this.usageModeSelect = root.getElementById('usageModeSelect');
    this.twoPlayerModeSelect = root.getElementById('twoPlayerModeSelect');
    this.challengeGoalSelect = root.getElementById('challengeGoalSelect');
    this.activePlayerSelect = root.getElementById('activePlayerSelect');
    this.boardGeometrySelect = root.getElementById('boardGeometrySelect');
    this.latticeSelect = root.getElementById('latticeSelect');
    this.viewModeSelect = root.getElementById('viewModeSelect');
    this.dimensionSelect = root.getElementById('dimensionSelect');
    this.boardSizeSelect = root.getElementById('boardSizeSelect');
    this.topologySelect = root.getElementById('topologySelect');
    this.r3BoundaryControl = root.getElementById('r3BoundaryControl');
    this.speciesSelect = root.getElementById('speciesSelect');
    this.ruleSelect = root.getElementById('ruleSelect');
    this.neighborhoodSelect = root.getElementById('neighborhoodSelect');
    this.speedRange = root.getElementById('speedRange');
    this.birthNoiseRange = root.getElementById('birthNoiseRange');
    this.deathNoiseRange = root.getElementById('deathNoiseRange');
    this.environmentNoiseRange = root.getElementById('environmentNoiseRange');
    this.ruleNoiseRange = root.getElementById('ruleNoiseRange');
    this.topologyDefectNoiseRange = root.getElementById('topologyDefectNoiseRange');
    this.mutationRange = root.getElementById('mutationRange');
    this.ageRange = root.getElementById('ageRange');
    this.agingDeathRateRange = root.getElementById('agingDeathRateRange');
    this.youngBirthBonusRange = root.getElementById('youngBirthBonusRange');
    this.oldAgePenaltyRange = root.getElementById('oldAgePenaltyRange');
    this.maxGenerationInput = root.getElementById('maxGenerationInput');
    this.customRuleDesigner = root.querySelector('.custom-rule-designer');
    this.birthCountsInput = root.getElementById('birthCountsInput');
    this.survivalCountsInput = root.getElementById('survivalCountsInput');
    this.customRuleString = root.getElementById('customRuleString');
    this.customRuleHelp = root.getElementById('customRuleHelp');
    this.customRuleError = root.getElementById('customRuleError');
    this.applyCustomRuleButton = root.getElementById('applyCustomRuleButton');
    this.customRulePresetButtons = [...root.querySelectorAll('[data-custom-rule]')];
    this.patternSelect = root.getElementById('patternSelect');
    this.patternDescription = root.getElementById('patternDescription');
    this.patternWarning = root.getElementById('patternWarning');
    this.geometryInfoCard = root.getElementById('geometryInfoCard');
    this.geometryInfoTitle = root.getElementById('geometryInfoTitle');
    this.geometryInfoDimension = root.getElementById('geometryInfoDimension');
    this.geometryInfoTopology = root.getElementById('geometryInfoTopology');
    this.geometryInfoBoundary = root.getElementById('geometryInfoBoundary');
    this.geometryInfoRecommended = root.getElementById('geometryInfoRecommended');
    this.geometryInfoPlayer = root.getElementById('geometryInfoPlayer');
    this.geometryInfoResearch = root.getElementById('geometryInfoResearch');
    this.neighborCountDisplay = root.getElementById('neighborCountDisplay');
    this.neighborhoodPreviewCanvas = root.getElementById('neighborhoodPreviewCanvas');
    this.neighborhoodRadiusSelect = root.getElementById('neighborhoodRadiusSelect');
    this.neighborhoodMetricSelect = root.getElementById('neighborhoodMetricSelect');
    this.neighborhoodWarning = root.getElementById('neighborhoodWarning');

    this.title = root.getElementById('lifeModeTitle');
    this.description = root.getElementById('lifeModeDescription');
    this.tags = root.getElementById('lifeModeTags');
    this.challengeStatus = root.getElementById('challengeStatus');
    this.detectedStructuresSummary = root.getElementById('detectedStructuresSummary');
    this.populationPlot = root.getElementById('populationPlot');
    this.speciesPlot = root.getElementById('speciesPlot');
    this.obs = Object.fromEntries([
      'Generation', 'Population', 'Density', 'PopulationGrowthRate', 'BirthRate', 'DeathRate', 'SpeciesFractions',
      'MeanAge', 'AgeDistribution', 'ClusterCount', 'LargestCluster', 'ComponentSizeDistribution',
      'Entropy', 'Correlation', 'CenterOfMass', 'RadiusOfActivity', 'BoundingBoxMeasure',
      'ExtinctionTime', 'SurvivalTime', 'Oscillation', 'RecurrencePeriodEstimate', 'FrontVelocity',
      'CompressionRatioProxy', 'DetectedStructures'
    ].map((name) => [name, root.getElementById(`obs${name}`)]));
    this.scoreA = root.getElementById('scoreA');
    this.scoreB = root.getElementById('scoreB');
    this.patternJson = root.getElementById('patternJson');
    this.exportTimeSeriesCsvButton = root.getElementById('exportTimeSeriesCsvButton');
    this.exportExperimentJsonButton = root.getElementById('exportExperimentJsonButton');
    this.phaseScanGeometrySelect = root.getElementById('phaseScanGeometrySelect');
    this.phaseScanLatticeSelect = root.getElementById('phaseScanLatticeSelect');
    this.phaseScanNeighborhoodSelect = root.getElementById('phaseScanNeighborhoodSelect');
    this.phaseScanBoardSizeInput = root.getElementById('phaseScanBoardSizeInput');
    this.phaseScanDensityInput = root.getElementById('phaseScanDensityInput');
    this.phaseScanSeedsInput = root.getElementById('phaseScanSeedsInput');
    this.phaseScanGenerationsInput = root.getElementById('phaseScanGenerationsInput');
    this.phaseScanBirthSetsInput = root.getElementById('phaseScanBirthSetsInput');
    this.phaseScanSurvivalSetsInput = root.getElementById('phaseScanSurvivalSetsInput');
    this.phaseScanStartButton = root.getElementById('phaseScanStartButton');
    this.phaseScanCancelButton = root.getElementById('phaseScanCancelButton');
    this.phaseScanExportJsonButton = root.getElementById('phaseScanExportJsonButton');
    this.phaseScanExportCsvButton = root.getElementById('phaseScanExportCsvButton');
    this.phaseScannerStatus = root.getElementById('phaseScannerStatus');
    this.phaseScannerGrid = root.getElementById('phaseScannerGrid');
    this.performanceReadout = root.getElementById('obsPerformance');
    this.performanceBenchmarkButton = root.getElementById('performanceBenchmarkButton');
    this.topologyCompareGeometryList = root.getElementById('topologyCompareGeometryList');
    this.topologyCompareBoardSizeInput = root.getElementById('topologyCompareBoardSizeInput');
    this.topologyCompareDensityInput = root.getElementById('topologyCompareDensityInput');
    this.topologyCompareSeedInput = root.getElementById('topologyCompareSeedInput');
    this.topologyCompareGenerationsInput = root.getElementById('topologyCompareGenerationsInput');
    this.topologyCompareRuleSummary = root.getElementById('topologyCompareRuleSummary');
    this.topologyCompareRunButton = root.getElementById('topologyCompareRunButton');
    this.topologyCompareExportJsonButton = root.getElementById('topologyCompareExportJsonButton');
    this.topologyCompareStatus = root.getElementById('topologyCompareStatus');
    this.topologyCompareResults = root.getElementById('topologyCompareResults');
    this.experimentNotebookTitleInput = root.getElementById('experimentNotebookTitleInput');
    this.experimentNotebookSelect = root.getElementById('experimentNotebookSelect');
    this.experimentNotebookSaveButton = root.getElementById('experimentNotebookSaveButton');
    this.experimentNotebookLoadButton = root.getElementById('experimentNotebookLoadButton');
    this.experimentNotebookDuplicateButton = root.getElementById('experimentNotebookDuplicateButton');
    this.experimentNotebookDeleteButton = root.getElementById('experimentNotebookDeleteButton');
    this.experimentNotebookExportButton = root.getElementById('experimentNotebookExportButton');
    this.experimentNotebookImportButton = root.getElementById('experimentNotebookImportButton');
    this.experimentNotebookJson = root.getElementById('experimentNotebookJson');
    this.experimentNotebookStatus = root.getElementById('experimentNotebookStatus');
    this.experimentNotebookSummary = root.getElementById('experimentNotebookSummary');
    this.playButton = root.getElementById('playButton');
    this.gridToggleButton = root.getElementById('lifeGridToggleBtn');
    this.boardOpacityButton = root.getElementById('boardOpacityButton');

    this.lifePlayModeSelect = root.getElementById('lifePlayModeSelect');
    this.lifeCreateRoomBtn = root.getElementById('lifeCreateRoomBtn');
    this.lifeFindMatchBtn = root.getElementById('lifeFindMatchBtn');
    this.lifeJoinRoomBtn = root.getElementById('lifeJoinRoomBtn');
    this.roomIdInput = root.getElementById('roomIdInput');
    this.shareLinkInput = root.getElementById('shareLinkInput');
    this.copyLinkBtn = root.getElementById('copyLinkBtn');
    this.onlineColorEl = root.getElementById('lifeOnlineStatus');
    this.connectionStatusEl = root.getElementById('connectionStatus');
    this.lifeOnlineControls = root.querySelector('.life-online-controls');

    this.mode = findLifeMode(readParams().get('mode'));
    this.playing = false;
    this.timer = 0;
    this.tool = 'draw';
    this.showGrid = true;
    this.boardOpacityIndex = 0;
    this.drawing = false;
    this.lastDrawPosition = null;
    this.camera = {
      rotX: -0.58,
      rotY: 0.82,
      zoom: 1,
      panX: 0,
      panY: 0,
      dragging: false,
      lastX: 0,
      lastY: 0
    };
    this.touchPointers = new Map();
    this.touchCameraGesture = null;
    this.history = [];
    this.stateHashes = new Map();
    this.extinctionTime = null;
    this.initialCenter = null;
    this.applyingRemoteState = false;
    this.pendingOnlineSync = 0;
    this.lastOnlineSyncAt = 0;
    this.nextOnlineTurn = '';
    this.myColor = null;
    this.network = null;
    this.customRuleActive = false;
    this.customRuleBirth = [3];
    this.customRuleSurvival = [2, 3];
    this.syncingNeighborhoodControls = false;
    this.pendingNeighborhoodWarnings = [];
    this.lastNeighborhoodWarning = '';
    this.phaseScannerWorker = null;
    this.phaseScanFallbackActive = false;
    this.phaseScanResult = null;
    this.performanceBenchmarkWorker = null;
    this.performanceBenchmarkFallbackActive = false;
    this.performanceBenchmarkResult = null;
    this.topologyCompareResult = null;
    this.experimentNotebookEntries = [];
    this.engine = createLifeEngine(modeToEngineConfig(this.mode));
  }

  install() {
    localizeStaticText(document, this.language);
    this.localizeLifeWorldAdditions();
    syncLifeLinks(this.language);
    this.installRangeValueReadouts();
    this.installControlTabs();
    this.modeSelect.innerHTML = LIFE_MODES.map((mode) => `<option value="${mode.id}">${modeTitle(mode, this.language)}</option>`).join('');
    this.ruleSelect.innerHTML = listRulePresets().map((rule) => `<option value="${rule.id}">${rulePresetLabel(rule, this.language)}</option>`).join('');
    this.boardGeometrySelect.innerHTML = LIFE_GEOMETRIES.map((geometry) => `<option value="${geometry.id}">${geometryTitle(geometry, this.language)}</option>`).join('');

    this.modeSelect.addEventListener('change', () => this.applyMode(findLifeMode(this.modeSelect.value)));
    this.usageModeSelect.addEventListener('change', () => this.applyUsageMode());
    this.twoPlayerModeSelect.addEventListener('change', () => this.applyTwoPlayerMode());
    this.challengeGoalSelect.addEventListener('change', () => this.updateChallengeStatus());
    this.activePlayerSelect.addEventListener('change', () => this.syncToolButtons());
    this.boardGeometrySelect.addEventListener('change', () => this.applyGeometrySelection());

    [this.dimensionSelect, this.boardSizeSelect, this.latticeSelect, this.viewModeSelect, this.topologySelect,
      this.speciesSelect, this.ruleSelect, this.neighborhoodSelect, this.neighborhoodRadiusSelect, this.neighborhoodMetricSelect, this.birthNoiseRange, this.deathNoiseRange,
      this.environmentNoiseRange, this.ruleNoiseRange, this.topologyDefectNoiseRange, this.mutationRange,
      this.ageRange, this.agingDeathRateRange, this.youngBirthBonusRange, this.oldAgePenaltyRange].forEach((control) => {
      if (!control) return;
      control.addEventListener('change', (event) => this.applyControlsFromControl(event));
      control.addEventListener('input', (event) => this.applyControlsFromControl(event));
    });

    this.root.querySelectorAll('[data-tool]').forEach((button) => button.addEventListener('click', () => this.setTool(button.dataset.tool)));
    this.gridToggleButton?.addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      this.syncToolButtons();
      this.draw();
    });
    this.boardOpacityButton?.addEventListener('click', () => {
      this.boardOpacityIndex = (this.boardOpacityIndex + 1) % BOARD_OPACITY_LEVELS.length;
      this.syncToolButtons();
      this.draw();
    });
    this.root.getElementById('randomSeedButton').addEventListener('click', () => this.seedRandom());
    this.root.getElementById('stepButton').addEventListener('click', () => this.step());
    this.root.getElementById('resetButton').addEventListener('click', () => this.reset());
    this.playButton.addEventListener('click', () => this.togglePlay());
    this.root.getElementById('exportButton').addEventListener('click', () => this.exportPattern());
    this.root.getElementById('importButton').addEventListener('click', () => this.importPattern());
    this.exportTimeSeriesCsvButton?.addEventListener('click', () => this.exportTimeSeriesCsv());
    this.exportExperimentJsonButton?.addEventListener('click', () => this.exportExperimentJson());
    this.installPhaseScanner();
    this.installPerformanceBenchmark();
    this.installTopologyCompare();
    this.installExperimentNotebook();
    this.installCustomRuleDesigner();
    this.installNeighborhoodLaboratory();
    this.installPatternLibrary();
    this.installOnlineControls();

    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('wheel', (event) => this.handleCanvasWheel(event), { passive: false });
    this.canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.canvas.setPointerCapture?.(event.pointerId);
      if (event.pointerType === 'touch') {
        this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.touchPointers.size >= 2) {
          this.drawing = false;
          this.lastDrawPosition = null;
          this.camera.dragging = false;
          this.startTouchCameraGesture();
          return;
        }
      }
      if (this.isCameraInteraction(event)) {
        this.startCameraDrag(event);
      } else {
        this.drawing = true;
        this.lastDrawPosition = null;
        this.handleCanvasPointer(event);
      }
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' && this.touchPointers.has(event.pointerId)) {
        this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.touchCameraGesture && this.touchPointers.size >= 2) {
          this.updateTouchCameraGesture(event);
          return;
        }
      }
      if (this.camera.dragging) this.updateCameraDrag(event);
      else if (this.drawing) { event.preventDefault(); this.handleCanvasPointer(event); }
    });
    const finishPointer = (event) => {
      if (event.pointerType === 'touch') {
        this.touchPointers.delete(event.pointerId);
        if (this.touchPointers.size < 2) this.touchCameraGesture = null;
      }
      try { this.canvas.releasePointerCapture?.(event.pointerId); } catch {}
      this.drawing = false;
      this.lastDrawPosition = null;
      this.camera.dragging = false;
    };
    window.addEventListener('pointerup', finishPointer);
    window.addEventListener('pointercancel', finishPointer);
    window.addEventListener('resize', () => this.draw());

    this.applyMode(this.mode);
    this.syncToolButtons();
    this.applyUsageMode();
    this.updateOnlineControls();
    this.tryJoinSharedRoomFromUrl();
  }

  localizeLifeWorldAdditions() {
    this.root.querySelectorAll('[data-life-extra-i18n]').forEach((element) => {
      element.textContent = lifeWorldText(element.dataset.lifeExtraI18n, this.language);
    });
    this.root.querySelectorAll('[data-life-extra-i18n-label]').forEach((element) => {
      element.setAttribute('aria-label', lifeWorldText(element.dataset.lifeExtraI18nLabel, this.language));
    });
  }

  installControlTabs() {
    this.playTabButton?.addEventListener('click', () => this.setControlView('play'));
    this.researchTabButton?.addEventListener('click', () => this.setControlView('research'));
    let saved = 'play';
    try { saved = localStorage.getItem(LIFE_CONTROL_TAB_STORAGE_KEY) || 'play'; } catch {}
    this.setControlView(saved === 'research' ? 'research' : 'play', { persist: false });
  }

  setControlView(view = 'play', options = {}) {
    const activeView = 'combined';
    this.controlPanel?.setAttribute('data-life-active-view', activeView);
    document.body.dataset.lifeActiveView = activeView;
    [
      ['play', this.playTabButton],
      ['research', this.researchTabButton]
    ].forEach(([tab, button]) => {
      if (!button) return;
      const active = tab === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    if (options.persist !== false) {
      try { localStorage.setItem(LIFE_CONTROL_TAB_STORAGE_KEY, activeView); } catch {}
    }
  }

  installCustomRuleDesigner() {
    if (!this.applyCustomRuleButton) return;
    this.applyCustomRuleButton.addEventListener('click', () => this.applyCustomRuleFromDesigner());
    [this.birthCountsInput, this.survivalCountsInput].forEach((input) => {
      input?.addEventListener('input', () => this.updateCustomRulePreview({ clearMessage: true }));
      input?.addEventListener('change', () => this.updateCustomRulePreview({ clearMessage: true }));
    });
    [this.neighborhoodSelect, this.dimensionSelect, this.latticeSelect].forEach((control) => {
      control?.addEventListener('change', () => this.updateCustomRulePreview({ clearMessage: true }));
    });
    this.customRulePresetButtons.forEach((button) => {
      button.addEventListener('click', () => this.applyCustomRulePreset(button.dataset.customRule));
    });
    this.syncCustomRuleDesignerFromRule(getRulePreset(this.ruleSelect.value || 'conway'));
  }

  installNeighborhoodLaboratory() {
    this.syncNeighborhoodMetricFromType();
    this.updateGeometryInfoCard();
    this.updateNeighborhoodLaboratory();
  }

  neighborhoodMetricFromType(type = this.neighborhoodSelect?.value || 'moore') {
    return NEIGHBORHOOD_TYPE_TO_METRIC[String(type || 'moore').toLowerCase()] || 'chebyshev';
  }

  neighborhoodTypeFromMetric(metric = this.neighborhoodMetricSelect?.value || 'chebyshev') {
    return NEIGHBORHOOD_METRIC_TO_TYPE[String(metric || 'chebyshev').toLowerCase()] || 'moore';
  }

  syncNeighborhoodMetricFromType() {
    if (!this.neighborhoodMetricSelect || this.syncingNeighborhoodControls) return;
    this.syncingNeighborhoodControls = true;
    this.neighborhoodMetricSelect.value = this.neighborhoodMetricFromType(this.neighborhoodSelect?.value);
    this.syncingNeighborhoodControls = false;
  }

  syncNeighborhoodTypeFromMetric() {
    if (!this.neighborhoodSelect || this.syncingNeighborhoodControls) return;
    this.syncingNeighborhoodControls = true;
    const type = this.neighborhoodTypeFromMetric(this.neighborhoodMetricSelect?.value);
    if (this.neighborhoodSelect.querySelector(`option[value="${type}"]`)) this.neighborhoodSelect.value = type;
    this.syncingNeighborhoodControls = false;
  }

  resolveNeighborhoodControls({ applyFallback = true } = {}) {
    const dimension = Math.max(1, Number(this.dimensionSelect?.value) || this.engine?.dimension || 2);
    const lattice = String(this.latticeSelect?.value || (dimension >= 3 ? 'sc' : 'square')).toLowerCase();
    let metric = String(this.neighborhoodMetricSelect?.value || this.neighborhoodMetricFromType()).toLowerCase();
    let type = this.neighborhoodTypeFromMetric(metric);
    let radius = Math.max(1, Math.min(2, Number(this.neighborhoodRadiusSelect?.value) || 1));
    const warnings = [];
    const nativeLatticeOnly = (dimension === 2 && lattice !== 'square') || (dimension === 3 && lattice !== 'sc');

    if (nativeLatticeOnly && metric !== 'lattice') {
      metric = 'lattice';
      type = 'nearest';
      warnings.push(lifeWorldText('neighborhoodFallbackLattice', this.language));
    }
    if (metric === 'lattice' && radius !== 1) {
      radius = 1;
      warnings.push(lifeWorldText('neighborhoodFallbackRadius', this.language));
    }

    if (applyFallback) {
      this.syncingNeighborhoodControls = true;
      if (this.neighborhoodMetricSelect) this.neighborhoodMetricSelect.value = metric;
      if (this.neighborhoodRadiusSelect) this.neighborhoodRadiusSelect.value = String(radius);
      if (this.neighborhoodSelect?.querySelector(`option[value="${type}"]`)) this.neighborhoodSelect.value = type;
      this.syncingNeighborhoodControls = false;
    }

    return { dimension, lattice, metric, type, radius, warnings };
  }

  estimatedNeighborCount(config = this.resolveNeighborhoodControls({ applyFallback: false })) {
    if (config.metric === 'lattice') return LATTICE_NEIGHBOR_COUNTS[config.lattice] || config.dimension * 2;
    let count = 0;
    const radius = Math.max(1, Number(config.radius) || 1);
    const deltas = [];
    function build(axis, prefix) {
      if (axis === config.dimension) {
        if (prefix.every((value) => value === 0)) return;
        const manhattan = prefix.reduce((sum, value) => sum + Math.abs(value), 0);
        const chebyshev = Math.max(...prefix.map((value) => Math.abs(value)));
        const squared = prefix.reduce((sum, value) => sum + value * value, 0);
        if (config.metric === 'manhattan' && manhattan > radius) return;
        if (config.metric === 'euclidean' && squared > radius * radius) return;
        if (config.metric === 'chebyshev' && chebyshev > radius) return;
        deltas.push(prefix.slice());
        count += 1;
        return;
      }
      for (let delta = -radius; delta <= radius; delta += 1) build(axis + 1, prefix.concat(delta));
    }
    build(0, []);
    return count;
  }

  updateNeighborhoodLaboratory() {
    const config = this.resolveNeighborhoodControls();
    let count = this.estimatedNeighborCount(config);
    if (this.engine?.getNeighborhoodInfo) {
      const center = this.engine.size.map((n) => Math.floor(n / 2));
      count = this.engine.getNeighborhoodInfo(center).count;
    }
    if (this.neighborCountDisplay) {
      this.neighborCountDisplay.textContent = lifeWorldText('neighborCount', this.language, { count });
      this.neighborCountDisplay.value = String(count);
    }
    const warnings = [...(this.pendingNeighborhoodWarnings || []), ...config.warnings];
    this.pendingNeighborhoodWarnings = [];
    const directWarning = warnings.join(' ');
    if (directWarning) this.lastNeighborhoodWarning = directWarning;
    const warning = config.dimension === 2
      ? (directWarning || this.lastNeighborhoodWarning || '')
      : [directWarning || this.lastNeighborhoodWarning || '', lifeWorldText('neighborhoodPreviewUnavailable', this.language)].filter(Boolean).join(' ');
    if (this.neighborhoodWarning) {
      this.neighborhoodWarning.textContent = warning;
      this.neighborhoodWarning.classList.toggle('is-error', false);
    }
    this.drawNeighborhoodPreview(config);
  }

  drawNeighborhoodPreview(config = this.resolveNeighborhoodControls({ applyFallback: false })) {
    const canvas = this.neighborhoodPreviewCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(3, 8, 14, 0.92)';
    ctx.fillRect(0, 0, width, height);
    if (config.dimension !== 2) {
      ctx.fillStyle = 'rgba(226, 236, 238, 0.7)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('2D preview', width / 2, height / 2);
      return;
    }
    const extent = Math.max(2, config.radius);
    const cells = extent * 2 + 1;
    const pad = 12;
    const step = (Math.min(width, height) - pad * 2) / cells;
    const center = this.engine?.size?.length >= 2
      ? [Math.floor(this.engine.size[0] / 2), Math.floor(this.engine.size[1] / 2)]
      : [8, 8];
    const neighbors = this.engine?.getNeighborPositions ? this.engine.getNeighborPositions(center) : [];
    const neighborKeys = new Set(neighbors.map((position) => {
      let dx = position[0] - center[0];
      let dy = position[1] - center[1];
      const sx = this.engine?.size?.[0] || 999;
      const sy = this.engine?.size?.[1] || 999;
      if (Math.abs(dx) > sx / 2) dx += dx > 0 ? -sx : sx;
      if (Math.abs(dy) > sy / 2) dy += dy > 0 ? -sy : sy;
      return `${dx},${dy}`;
    }));
    for (let y = -extent; y <= extent; y += 1) {
      for (let x = -extent; x <= extent; x += 1) {
        const left = pad + (x + extent) * step;
        const top = pad + (y + extent) * step;
        const isCenter = x === 0 && y === 0;
        const isNeighbor = neighborKeys.has(`${x},${y}`);
        ctx.fillStyle = isCenter
          ? 'rgba(245, 182, 71, 0.88)'
          : isNeighbor ? 'rgba(56, 189, 248, 0.72)' : 'rgba(15, 23, 42, 0.72)';
        ctx.fillRect(left + 2, top + 2, step - 4, step - 4);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
        ctx.strokeRect(left + 2, top + 2, step - 4, step - 4);
      }
    }
  }

  updateGeometryInfoCard() {
    if (!this.geometryInfoCard) return;
    const geometry = findLifeGeometry(this.boardGeometrySelect?.value);
    const infoId = geometry.id === 'r3' ? r3BoundaryInfoId(this.topologySelect?.value || geometry.topology) : geometry.id;
    const info = geometryInfo(infoId, this.language);
    const boundaryOption = geometry.id === 'r3'
      ? R3_BOUNDARY_OPTIONS.find((option) => option.value === (this.topologySelect?.value || 'open'))
      : null;
    const boundarySuffix = boundaryOption ? ` / ${t(boundaryOption.labelKey, this.language)}` : '';
    this.geometryInfoTitle.textContent = `${geometryTitle(geometry, this.language)}${boundarySuffix}`;
    this.geometryInfoDimension.textContent = info.dimension;
    this.geometryInfoTopology.textContent = info.topology;
    this.geometryInfoBoundary.textContent = info.boundary;
    this.geometryInfoRecommended.textContent = info.recommendedNeighborhood;
    this.geometryInfoPlayer.textContent = info.player;
    this.geometryInfoResearch.textContent = info.research;
  }

  installPatternLibrary() {
    if (!this.patternSelect) return;
    this.populatePatternLibrary();
    this.patternSelect.addEventListener('change', () => this.updatePatternLibrary());
  }

  patternName(pattern) {
    return lifeWorldText(pattern.nameKey, this.language);
  }

  patternDescriptionText(pattern) {
    return lifeWorldText(pattern.descriptionKey, this.language);
  }

  patternCompatibility(pattern, config = this.resolveNeighborhoodControls({ applyFallback: false })) {
    const dimensionOk = pattern.dimensions.includes(config.dimension);
    const classicMoore = config.dimension === 2 && config.metric === 'chebyshev' && config.radius === 1;
    const neighborhoodOk = pattern.neighborhoods.includes('any') || (pattern.neighborhoods.includes('moore') && classicMoore);
    return { ok: dimensionOk && neighborhoodOk, dimensionOk, neighborhoodOk };
  }

  patternRequirement(pattern) {
    if (pattern.neighborhoods.includes('moore')) return lifeWorldText('pattern2DMoore', this.language);
    if (pattern.dimensions.length === 1 && pattern.dimensions[0] === 2) return `${lifeWorldText('pattern2D', this.language)} / ${lifeWorldText('patternAnyNeighborhood', this.language)}`;
    return lifeWorldText('patternAnyNeighborhood', this.language);
  }

  populatePatternLibrary() {
    if (!this.patternSelect) return;
    const previous = this.patternSelect.value || 'single-cell';
    const config = this.resolveNeighborhoodControls({ applyFallback: false });
    this.patternSelect.innerHTML = LIFE_PATTERN_LIBRARY.map((pattern) => {
      const compatibility = this.patternCompatibility(pattern, config);
      const disabled = compatibility.ok ? '' : ' disabled';
      const suffix = compatibility.ok ? '' : ` - ${this.patternRequirement(pattern)}`;
      return `<option value="${pattern.id}"${disabled}>${this.patternName(pattern)}${suffix}</option>`;
    }).join('');
    const previousPattern = LIFE_PATTERN_LIBRARY.find((pattern) => pattern.id === previous);
    this.patternSelect.value = previousPattern && this.patternCompatibility(previousPattern, config).ok ? previous : 'single-cell';
    this.updatePatternLibrary();
  }

  updatePatternLibrary() {
    if (!this.patternSelect) return;
    const config = this.resolveNeighborhoodControls({ applyFallback: false });
    const pattern = LIFE_PATTERN_LIBRARY.find((item) => item.id === this.patternSelect.value) || LIFE_PATTERN_LIBRARY[0];
    if (this.patternDescription) this.patternDescription.textContent = this.patternDescriptionText(pattern);
    const disabled = LIFE_PATTERN_LIBRARY
      .filter((item) => !this.patternCompatibility(item, config).ok)
      .map((item) => `${this.patternName(item)} (${this.patternRequirement(item)})`);
    if (this.patternWarning) {
      this.patternWarning.textContent = disabled.length
        ? lifeWorldText('patternDisabledSummary', this.language, { patterns: disabled.join(', ') })
        : '';
      this.patternWarning.classList.toggle('is-error', false);
    }
  }

  selectedPattern() {
    const pattern = LIFE_PATTERN_LIBRARY.find((item) => item.id === this.patternSelect?.value) || LIFE_PATTERN_LIBRARY[0];
    return this.patternCompatibility(pattern).ok ? pattern : LIFE_PATTERN_LIBRARY[0];
  }

  activePlacementSpecies() {
    return this.usageModeSelect.value === 'two'
      ? Number(this.activePlayerSelect.value)
      : Number(this.activePlayerSelect.value || this.speciesSelect.value || 1);
  }

  placePatternAtPosition(position) {
    const pattern = this.selectedPattern();
    if (pattern.id === 'single-cell') {
      this.applyToolAtPosition(position);
      return;
    }
    if (pattern.id === 'two-species-battle' && Number(this.speciesSelect.value) < 2) {
      this.speciesSelect.value = '2';
      this.applyControls(true);
    }
    if (pattern.randomCloud) {
      this.placeRandomCloud(position);
      return;
    }
    const species = this.activePlacementSpecies();
    for (const offset of pattern.offsets || []) {
      const speciesOverride = pattern.id === 'two-species-battle' ? offset[2] : null;
      const deltas = pattern.id === 'two-species-battle' ? offset.slice(0, 2) : offset;
      const target = position.map((value, axis) => value + Number(deltas[axis] || 0));
      this.engine.setCell(target, {
        state: 1,
        species: speciesOverride || species,
        age: 1,
        energy: 1,
        health: 1
      });
    }
  }

  placeRandomCloud(position) {
    const dimension = this.engine.dimension;
    const attempts = dimension === 1 ? 9 : dimension === 2 ? 18 : 26;
    const radius = 2;
    const speciesCount = Math.max(1, Number(this.speciesSelect.value) || 1);
    const seen = new Set();
    for (let i = 0; i < attempts; i += 1) {
      const deltas = Array.from({ length: dimension }, () => Math.floor(Math.random() * (radius * 2 + 1)) - radius);
      if (deltas.every((value) => value === 0) || Math.random() < 0.35) deltas[0] = 0;
      const target = position.map((value, axis) => value + deltas[axis]);
      const key = target.join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      if (Math.random() > 0.62) continue;
      this.engine.setCell(target, {
        state: 1,
        species: 1 + Math.floor(Math.random() * speciesCount),
        age: 1,
        energy: 1,
        health: 1
      });
    }
  }

  maxNeighborCount() {
    return this.estimatedNeighborCount(this.resolveNeighborhoodControls({ applyFallback: false }));
  }

  setCustomRuleMessage(message = '', success = false) {
    if (!this.customRuleError) return;
    this.customRuleError.textContent = message;
    this.customRuleError.classList.toggle('is-success', Boolean(success && message));
  }

  updateCustomRulePreview(options = {}) {
    const max = this.maxNeighborCount();
    if (this.customRuleHelp) {
      this.customRuleHelp.textContent = `${lifeWorldText('customRuleHelp', this.language)} ${lifeWorldText('customRuleMax', this.language, { max })}`;
    }
    try {
      const birth = parseCountListInput(
        this.birthCountsInput?.value || '',
        max,
        lifeWorldText('birthField', this.language),
        this.language
      );
      const survival = parseCountListInput(
        this.survivalCountsInput?.value || '',
        max,
        lifeWorldText('survivalField', this.language),
        this.language
      );
      const ruleString = serializeLifeBSRule({ birth, survival });
      if (this.customRuleString) this.customRuleString.textContent = ruleString;
      if (options.clearMessage) this.setCustomRuleMessage('');
      return { ok: true, birth, survival, ruleString };
    } catch (error) {
      if (this.customRuleString) this.customRuleString.textContent = 'B?/S?';
      this.setCustomRuleMessage(error.message || lifeWorldText('customRuleErrorSyntax', this.language));
      return { ok: false, error };
    }
  }

  syncCustomRuleDesignerFromRule(rule = {}) {
    if (!this.birthCountsInput || !this.survivalCountsInput) return;
    let birth = rule.birth || [];
    let survival = rule.survival || [];
    if ((!birth.length && !survival.length) && rule.rule) {
      try {
        const parsed = parseLifeBSRule(rule.rule, this.maxNeighborCount());
        birth = parsed.birth;
        survival = parsed.survival;
      } catch {}
    }
    this.birthCountsInput.value = formatRuleCounts(birth.length || survival.length ? birth : [3]);
    this.survivalCountsInput.value = formatRuleCounts(birth.length || survival.length ? survival : [2, 3]);
    this.updateCustomRulePreview({ clearMessage: true });
  }

  applyCustomRulePreset(ruleString = 'custom') {
    this.customRuleDesigner.open = true;
    if (ruleString === 'custom') {
      this.updateCustomRulePreview({ clearMessage: true });
      this.birthCountsInput?.focus();
      return;
    }
    try {
      const parsed = parseLifeBSRule(
        ruleString,
        this.maxNeighborCount(),
        this.language,
        lifeWorldText('birthField', this.language),
        lifeWorldText('survivalField', this.language)
      );
      this.birthCountsInput.value = formatRuleCounts(parsed.birth);
      this.survivalCountsInput.value = formatRuleCounts(parsed.survival);
      this.applyCustomRuleFromDesigner();
    } catch (error) {
      this.setCustomRuleMessage(error.message || lifeWorldText('customRuleErrorSyntax', this.language));
    }
  }

  applyCustomRuleFromDesigner() {
    const parsed = this.updateCustomRulePreview();
    if (!parsed.ok) return false;
    if (!parsed.birth.length && !parsed.survival.length) {
      this.setCustomRuleMessage(lifeWorldText('customRuleErrorEmpty', this.language));
      return false;
    }
    this.customRuleActive = true;
    this.customRuleBirth = parsed.birth;
    this.customRuleSurvival = parsed.survival;
    this.setCustomRuleMessage(lifeWorldText('customRuleApplied', this.language, { rule: parsed.ruleString }), true);
    this.applyControls(true);
    return true;
  }

  buildCustomRule(baseRule = {}) {
    const neighborhood = this.resolveNeighborhoodControls({ applyFallback: false });
    const max = this.maxNeighborCount();
    const birth = normalizeRuleCounts(this.customRuleBirth);
    const survival = normalizeRuleCounts(this.customRuleSurvival);
    if (!birth.length && !survival.length) return baseRule;
    if ([...birth, ...survival].some((count) => count > max)) {
      const field = birth.some((count) => count > max) ? lifeWorldText('birthField', this.language) : lifeWorldText('survivalField', this.language);
      this.setCustomRuleMessage(lifeWorldText('customRuleErrorRange', this.language, { field, max }));
      return baseRule;
    }
    const ruleString = serializeLifeBSRule({ birth, survival });
    return {
      ...baseRule,
      id: 'custom',
      label: 'Custom Life',
      zhLabel: 'Custom Life',
      type: 'life-like',
      rule: ruleString,
      birth,
      survival,
      neighborhoodType: neighborhood.type || baseRule.neighborhoodType || 'moore',
      latticeNeighborCount: max
    };
  }

  installRangeValueReadouts() {
    this.rangeValueOutputs = [];
    this.root.querySelectorAll('.life-control-panel input[type="range"]').forEach((input) => {
      let output = input.parentElement?.querySelector(`output[data-life-range-value="${input.id}"]`);
      if (!output) {
        output = document.createElement('output');
        output.className = 'life-range-value';
        output.dataset.lifeRangeValue = input.id;
        output.setAttribute('for', input.id);
        input.insertAdjacentElement('afterend', output);
      }
      const update = () => {
        const value = Number(input.value);
        const step = Number(input.step || 1);
        const digits = Number.isInteger(step) ? 0 : Math.min(4, Math.max(2, String(input.step || '').split('.')[1]?.length || 0));
        output.textContent = Number.isFinite(value) ? formatNumber(value, digits) : input.value;
        output.value = output.textContent;
      };
      input.addEventListener('input', update);
      input.addEventListener('change', update);
      this.rangeValueOutputs.push(update);
      update();
    });
  }

  syncRangeValueReadouts() {
    for (const update of this.rangeValueOutputs || []) update();
  }

  populateLattices(geometryId, preferred) {
    const lattices = latticesForGeometry(geometryId);
    this.latticeSelect.innerHTML = lattices.map((lattice) => `<option value="${lattice.id}">${latticeTitle(lattice, this.language)}</option>`).join('');
    const ids = new Set(lattices.map((lattice) => lattice.id));
    this.latticeSelect.value = ids.has(preferred) ? preferred : lattices[0].id;
  }

  syncBoundaryControlsForGeometry(geometry, preferredBoundary = null) {
    const isR3Volume = geometry?.id === 'r3';
    if (this.r3BoundaryControl) {
      this.r3BoundaryControl.hidden = !isR3Volume;
      this.r3BoundaryControl.setAttribute('aria-hidden', String(!isR3Volume));
    }
    if (!this.topologySelect) return;
    if (isR3Volume) {
      this.topologySelect.innerHTML = R3_BOUNDARY_OPTIONS
        .map((option) => `<option value="${option.value}">${t(option.labelKey, this.language)}</option>`)
        .join('');
      const allowed = new Set(R3_BOUNDARY_OPTIONS.map((option) => option.value));
      this.topologySelect.value = allowed.has(preferredBoundary) ? preferredBoundary : 'open';
      this.topologySelect.tabIndex = 0;
      return;
    }
    const boundary = geometry?.topology || 'open';
    this.topologySelect.innerHTML = `<option value="${boundary}">${boundary}</option>`;
    this.topologySelect.value = boundary;
    this.topologySelect.tabIndex = -1;
  }

  latticeRulePreset(lattice = this.latticeSelect?.value, dimension = Number(this.dimensionSelect?.value) || 2) {
    if (dimension === 2 && lattice === 'triangular') return 'triangularLife';
    if (dimension === 2 && lattice === 'honeycomb') return 'honeycombLife';
    if (dimension === 2) return 'conway';
    if (dimension >= 3) return 'life3dSoft';
    return 'conway';
  }

  applyLatticeDefaults(lattice = this.latticeSelect?.value) {
    const dimension = Number(this.dimensionSelect?.value) || 2;
    const preset = this.latticeRulePreset(lattice, dimension);
    if (!preset) return;
    if (this.ruleSelect?.querySelector(`option[value="${preset}"]`)) this.ruleSelect.value = preset;
    if (this.neighborhoodSelect) this.neighborhoodSelect.value = 'nearest';
    if (this.neighborhoodMetricSelect) this.neighborhoodMetricSelect.value = 'lattice';
    if (this.neighborhoodRadiusSelect) this.neighborhoodRadiusSelect.value = '1';
  }

  applyControlsFromControl(event) {
    if (event?.currentTarget && event.currentTarget !== this.latticeSelect) this.lastNeighborhoodWarning = '';
    if (event?.currentTarget === this.neighborhoodSelect) this.syncNeighborhoodMetricFromType();
    if (event?.currentTarget === this.neighborhoodMetricSelect) this.syncNeighborhoodTypeFromMetric();
    if (event?.currentTarget === this.ruleSelect) {
      this.customRuleActive = false;
      this.syncCustomRuleDesignerFromRule(getRulePreset(this.ruleSelect.value));
    }
    if (event?.currentTarget === this.latticeSelect && !this.customRuleActive) {
      const previousMetric = this.neighborhoodMetricSelect?.value || this.neighborhoodMetricFromType();
      const previousRadius = this.neighborhoodRadiusSelect?.value || '1';
      this.applyLatticeDefaults(this.latticeSelect.value);
      const dimension = Math.max(1, Number(this.dimensionSelect?.value) || 2);
      const lattice = String(this.latticeSelect?.value || '').toLowerCase();
      const nativeLatticeOnly = (dimension === 2 && lattice !== 'square') || (dimension === 3 && lattice !== 'sc');
      if (nativeLatticeOnly && previousMetric !== 'lattice') this.pendingNeighborhoodWarnings.push(lifeWorldText('neighborhoodFallbackLattice', this.language));
      if (nativeLatticeOnly && previousRadius !== '1') this.pendingNeighborhoodWarnings.push(lifeWorldText('neighborhoodFallbackRadius', this.language));
      this.syncCustomRuleDesignerFromRule(getRulePreset(this.ruleSelect.value));
    }
    this.updateCustomRulePreview({ clearMessage: true });
    this.applyControls(true);
  }

  applyGeometrySelection() {
    const selectedGeometryId = this.boardGeometrySelect.value;
    const geometry = findLifeGeometry(selectedGeometryId);
    this.dimensionSelect.value = String(geometry.dimension);
    this.syncBoundaryControlsForGeometry(geometry, legacyGeometryBoundary(selectedGeometryId, geometry.topology));
    this.viewModeSelect.value = geometry.view;
    this.resetInitialCameraScale();
    this.populateLattices(geometry.id, this.latticeSelect.value || (geometry.dimension === 3 ? 'sc' : 'square'));
    if (!this.customRuleActive) this.applyLatticeDefaults(this.latticeSelect.value);
    if (this.neighborhoodSelect.value === 'nearest' && geometry.dimension >= 2) {
      this.neighborhoodSelect.value = 'nearest';
    }
    this.syncNeighborhoodMetricFromType();
    this.updateGeometryInfoCard();
    this.updateCustomRulePreview({ clearMessage: true });
    this.applyControls(true);
  }

  applyMode(mode) {
    this.mode = mode;
    this.title.textContent = modeTitle(mode, this.language);
    this.description.textContent = modeLong(mode, this.language);
    this.tags.textContent = modeTags(mode, this.language).join(' · ');
    this.modeSelect.value = mode.id;
    const config = modeToEngineConfig(mode);
    const geometry = findLifeGeometry(mode.geometry || (config.dimension === 3 ? 'r3' : 'r2'));
    this.boardGeometrySelect.value = geometry.id;
    const selectedDimension = geometry.dimension || config.dimension;
    this.dimensionSelect.value = String(selectedDimension);
    this.boardSizeSelect.value = '32';
    this.syncBoundaryControlsForGeometry(geometry, legacyGeometryBoundary(mode.geometry, geometry.topology || config.boundary));
    this.viewModeSelect.value = geometry.view;
    this.resetInitialCameraScale();
    this.populateLattices(geometry.id, config.lattice);
    this.speciesSelect.value = String(mode.species || config.rule.speciesCount || 1);
    this.ruleSelect.value = config.rule.id || 'conway';
    this.customRuleActive = false;
    this.neighborhoodSelect.value = config.neighborhoodType || 'moore';
    this.neighborhoodRadiusSelect.value = '1';
    this.syncNeighborhoodMetricFromType();
    if (config.dimension >= 3 || config.lattice !== 'square') this.applyLatticeDefaults(this.latticeSelect.value);
    this.syncCustomRuleDesignerFromRule(getRulePreset(this.ruleSelect.value));
    this.birthNoiseRange.value = String(config.rule.birthNoise || 0);
    this.deathNoiseRange.value = String(config.rule.deathNoise || 0);
    this.environmentNoiseRange.value = String(config.rule.environmentNoise || 0);
    this.ruleNoiseRange.value = String(config.rule.ruleNoise || 0);
    this.topologyDefectNoiseRange.value = String(config.rule.topologyDefectNoise || 0);
    this.mutationRange.value = String(mode.mutation || config.rule.mutationRate || 0);
    this.ageRange.value = String(config.rule.maxAge || 0);
    this.agingDeathRateRange.value = String(config.rule.agingDeathRate || 0);
    this.youngBirthBonusRange.value = String(config.rule.youngBirthBonus || 0);
    this.oldAgePenaltyRange.value = String(config.rule.oldAgePenalty ?? 0);
    this.syncRangeValueReadouts();
    const params = readParams();
    params.set('mode', mode.id);
    params.set('lang', this.language);
    history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
    this.reset();
  }

  applyUsageMode() {
    const usage = this.usageModeSelect.value;
    document.body.dataset.lifeUsage = usage;
    if (usage === 'two') { this.speciesSelect.value = String(Math.max(2, Number(this.speciesSelect.value) || 2)); this.activePlayerSelect.value = '1'; }
    if (usage === 'one' && this.challengeGoalSelect.value === 'none') this.challengeGoalSelect.value = 'survive';
    this.applyTwoPlayerMode();
    this.applyControls(true);
    this.updateChallengeStatus();
    this.updateOnlineControls();
  }

  applyTwoPlayerMode() {
    if (this.usageModeSelect.value !== 'two') return;
    const type = this.twoPlayerModeSelect.value;
    if (type === 'mutation-duel') { this.birthNoiseRange.value = '0.01'; this.deathNoiseRange.value = '0.01'; this.mutationRange.value = '0.025'; }
    if (type === 'ecosystem-balance') { this.speciesSelect.value = '3'; this.mutationRange.value = '0.01'; }
    this.syncRangeValueReadouts();
    this.applyControls(true);
  }

  currentSize() {
    const n = Math.max(8, Number(this.boardSizeSelect.value) || 32);
    const dimension = Math.max(1, Number(this.dimensionSelect.value) || 2);
    if (dimension === 1) return [n];
    if (dimension === 2) return [n, n];
    if (dimension === 3) return [Math.min(n, 64), Math.min(n, 64), Math.min(16, Math.max(4, Math.floor(n / 6)))];
    return [Math.min(n, 32), Math.min(n, 32), 4, 4];
  }

  resetInitialCameraScale() {
    const dimension = Math.max(1, Number(this.dimensionSelect?.value) || 2);
    const view = this.viewModeSelect?.value || 'flat';
    const projectedView = dimension >= 3 || view === 'surface3d' || view === 'volume';
    this.camera.zoom = projectedView ? 1.12 : 1;
    this.camera.panX = 0;
    this.camera.panY = 0;
  }

  applyControls(preserve = true) {
    let rule = getRulePreset(this.ruleSelect.value);
    const speciesCount = Math.max(1, Number(this.speciesSelect.value) || 1);
    const dimension = Number(this.dimensionSelect.value);
    const lattice = this.latticeSelect.value;
    const neighborhood = this.resolveNeighborhoodControls();
    rule = tuneRuleForLattice(rule, lattice, dimension);
    if (this.customRuleActive) rule = this.buildCustomRule(rule);
    rule.speciesCount = speciesCount;
    rule.birthNoise = Number(this.birthNoiseRange.value) || 0;
    rule.deathNoise = Number(this.deathNoiseRange.value) || 0;
    rule.environmentNoise = Number(this.environmentNoiseRange.value) || 0;
    rule.ruleNoise = Number(this.ruleNoiseRange.value) || 0;
    rule.topologyDefectNoise = Number(this.topologyDefectNoiseRange.value) || 0;
    rule.mutationRate = Number(this.mutationRange.value) || 0;
    rule.maxAge = Number(this.ageRange.value) || undefined;
    rule.agingDeathRate = Number(this.agingDeathRateRange.value) || 0;
    rule.youngBirthBonus = Number(this.youngBirthBonusRange.value) || 0;
    rule.oldAgePenalty = Number(this.oldAgePenaltyRange.value) || 0;

    this.engine.configure({
      dimension,
      size: this.currentSize(),
      boundary: this.topologySelect.value,
      neighborhoodType: neighborhood.type,
      neighborhoodRadius: neighborhood.radius,
      neighborhoodMetric: neighborhood.metric,
      lattice,
      rule
    });
    if (!preserve) this.engine.clear();
    this.draw();
    this.updateReadout();
    this.updateNeighborhoodLaboratory();
    this.populatePatternLibrary();
    this.updateGeometryInfoCard();
    this.updateTopologyCompareRuleSummary();
  }

  reset() {
    this.stop();
    this.applyControls(false);
    this.history = [];
    this.stateHashes = new Map();
    this.extinctionTime = null;
    this.initialCenter = null;
    if (this.mode.id === 'moore-life' && this.engine.dimension <= 2) this.seedGlider();
    else this.seedRandom();
  }

  seedGlider() {
    this.engine.clear();
    const cx = Math.floor(this.engine.size[0] / 2) - 1;
    const cy = Math.floor((this.engine.size[1] || 1) / 2) - 1;
    if (this.engine.dimension === 1) this.engine.seedPattern([[cx], [cx + 1], [cx + 2]]);
    else this.engine.seedPattern([[cx + 1, cy], [cx + 2, cy + 1], [cx, cy + 2], [cx + 1, cy + 2], [cx + 2, cy + 2]]);
    this.afterStateChange();
  }

  seedRandom() {
    this.applyControls(true);
    this.engine.randomSeed({ density: this.usageModeSelect.value === 'two' ? 0.08 : (Number(this.speciesSelect.value) > 1 ? 0.22 : 0.18), speciesCount: Number(this.speciesSelect.value) || 1 });
    this.afterStateChange();
  }

  step() {
    this.applyControls(true);
    this.engine.step();
    this.afterStateChange();
    const maxGen = Number(this.maxGenerationInput.value) || 0;
    if (maxGen > 0 && this.engine.generation >= maxGen) this.stop();
    if (this.engine.getObservables().population === 0) this.stop();
  }
  togglePlay() { this.playing ? this.stop() : this.start(); }
  start() { this.playing = true; this.playButton.textContent = t('pause', this.language); this.loop(); }
  stop() { this.playing = false; clearTimeout(this.timer); this.playButton.textContent = t('start', this.language); }
  loop() { if (!this.playing) return; this.step(); this.timer = setTimeout(() => this.loop(), Number(this.speedRange.value) || 130); }
  setTool(tool) { this.tool = tool; this.syncToolButtons(); }
  syncToolButtons() {
    this.root.querySelectorAll('[data-tool]').forEach((button) => button.classList.toggle('active', button.dataset.tool === this.tool));
    if (this.gridToggleButton) {
      this.gridToggleButton.classList.toggle('active', this.showGrid);
      this.gridToggleButton.setAttribute('aria-pressed', String(this.showGrid));
      this.gridToggleButton.textContent = t(this.showGrid ? 'gridOn' : 'gridOff', this.language);
    }
    if (this.boardOpacityButton) {
      const key = BOARD_OPACITY_KEYS[this.boardOpacityIndex] || BOARD_OPACITY_KEYS[0];
      const opacity = BOARD_OPACITY_LEVELS[this.boardOpacityIndex] ?? BOARD_OPACITY_LEVELS[0];
      this.boardOpacityButton.classList.toggle('active', opacity > 0);
      this.boardOpacityButton.setAttribute('aria-pressed', String(opacity > 0));
      this.boardOpacityButton.textContent = t(key, this.language);
    }
  }

  installOnlineControls() {
    if (!this.lifePlayModeSelect) return;
    this.network = new FirebaseStateNetworkManager(this, {
      gameKey: this.onlineGameKey(),
      matchKey: this.onlineMatchKey()
    });
    this.lifePlayModeSelect.addEventListener('change', () => this.updateOnlineControls());
    this.lifeCreateRoomBtn?.addEventListener('click', async () => {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls('creatingLifeRoom');
      await this.network?.createRoom();
    });
    this.lifeFindMatchBtn?.addEventListener('click', async () => {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls('findingLifeMatch');
      await this.network?.findMatch();
    });
    this.lifeJoinRoomBtn?.addEventListener('click', async () => {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls('joiningLifeRoom');
      await this.network?.joinRoom(this.roomIdInput?.value || '');
    });
    this.copyLinkBtn?.addEventListener('click', async () => {
      const value = this.shareLinkInput?.value || '';
      if (!value) return;
      try {
        await navigator.clipboard?.writeText(value);
        this.setStatus(this.lifeText('shareLinkCopied'));
      } catch {
        this.shareLinkInput?.select?.();
        this.setStatus(this.lifeText('copySelectedShareLink'));
      }
    });
  }

  lifeText(key, replacements = {}) {
    return Object.entries(replacements).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      t(key, this.language)
    );
  }

  onlineGameKey() {
    return 'life-world';
  }

  onlineMatchKey() {
    const values = [
      this.onlineGameKey(),
      this.modeSelect?.value || this.mode?.id || 'life',
      this.usageModeSelect?.value || 'zero',
      this.twoPlayerModeSelect?.value || 'seed-war',
      this.challengeGoalSelect?.value || 'none',
      this.boardGeometrySelect?.value || 'r2',
      this.latticeSelect?.value || 'square',
      this.viewModeSelect?.value || 'flat',
      this.dimensionSelect?.value || '2',
      this.boardSizeSelect?.value || '32',
      this.customRuleActive ? `custom:${serializeLifeBSRule({ birth: this.customRuleBirth, survival: this.customRuleSurvival })}` : (this.ruleSelect?.value || 'conway'),
      this.neighborhoodSelect?.value || 'moore',
      `rad${this.neighborhoodRadiusSelect?.value || 1}`,
      this.neighborhoodMetricSelect?.value || 'chebyshev',
      `bn${this.birthNoiseRange?.value || 0}`,
      `dn${this.deathNoiseRange?.value || 0}`,
      `en${this.environmentNoiseRange?.value || 0}`,
      `rn${this.ruleNoiseRange?.value || 0}`,
      `td${this.topologyDefectNoiseRange?.value || 0}`,
      `mu${this.mutationRange?.value || 0}`,
      `age${this.ageRange?.value || 0}`
    ];
    return values.join(':');
  }

  readControlValues() {
    const controls = {};
    ['usageModeSelect', 'twoPlayerModeSelect', 'challengeGoalSelect', 'activePlayerSelect', 'boardGeometrySelect',
      'latticeSelect', 'viewModeSelect', 'dimensionSelect', 'boardSizeSelect', 'topologySelect', 'speciesSelect',
      'ruleSelect', 'neighborhoodSelect', 'neighborhoodRadiusSelect', 'neighborhoodMetricSelect', 'patternSelect',
      'speedRange', 'birthNoiseRange', 'deathNoiseRange', 'environmentNoiseRange',
      'ruleNoiseRange', 'topologyDefectNoiseRange', 'mutationRange', 'ageRange', 'agingDeathRateRange',
      'youngBirthBonusRange', 'oldAgePenaltyRange', 'maxGenerationInput'].forEach((key) => {
      if (this[key]) controls[key] = this[key].value;
    });
    return controls;
  }

  writeControlValues(controls = {}) {
    Object.entries(controls).forEach(([key, value]) => {
      if (!this[key] || value == null) return;
      if (key === 'boardGeometrySelect') {
        const geometry = findLifeGeometry(value);
        this[key].value = geometry.id;
        if (geometry.id === 'r3' && !controls.topologySelect) {
          this.syncBoundaryControlsForGeometry(geometry, legacyGeometryBoundary(value, geometry.topology));
        }
        return;
      }
      this[key].value = String(value);
    });
  }

  exportNetworkState() {
    const engine = this.engine.exportState();
    engine.cells = engine.cells.map(compactLifeCell);
    return {
      version: 1,
      kind: 'life-world-state',
      currentPlayer: this.nextOnlineTurn || 'white',
      mode: this.mode?.id || this.modeSelect?.value || 'moore-life',
      controls: this.readControlValues(),
      engine,
      history: this.history.slice(-80)
    };
  }

  importNetworkState(payload = {}) {
    const engineState = payload.engine || payload.state || payload;
    if (!engineState?.cells) return;
    this.applyingRemoteState = true;
    try {
      this.stop();
      if (payload.mode) {
        this.mode = findLifeMode(payload.mode);
        this.modeSelect.value = this.mode.id;
        this.title.textContent = modeTitle(this.mode, this.language);
        this.description.textContent = modeLong(this.mode, this.language);
        this.tags.textContent = modeTags(this.mode, this.language).join(' · ');
      }
      this.writeControlValues(payload.controls || {});
      if (this.boardGeometrySelect?.value) {
        const geometry = findLifeGeometry(this.boardGeometrySelect.value);
        this.syncBoundaryControlsForGeometry(geometry, this.topologySelect?.value || engineState.boundary || geometry.topology);
        this.populateLattices(geometry.id, this.latticeSelect.value);
      }
      const expanded = {
        ...engineState,
        cells: (engineState.cells || []).map(expandLifeCell)
      };
      this.engine.importState(expanded);
      this.dimensionSelect.value = String(this.engine.dimension);
      this.boardSizeSelect.value = String(this.engine.size[0]);
      this.syncBoundaryControlsForGeometry(findLifeGeometry(this.boardGeometrySelect?.value || 'r3'), this.engine.topology.boundary);
      this.topologySelect.value = this.engine.topology.boundary;
      this.neighborhoodSelect.value = this.engine.neighborhoodType;
      this.neighborhoodRadiusSelect.value = String(this.engine.neighborhoodRadius || 1);
      this.neighborhoodMetricSelect.value = this.engine.neighborhoodMetric || this.neighborhoodMetricFromType(this.engine.neighborhoodType);
      this.latticeSelect.value = this.engine.lattice || this.latticeSelect.value;
      this.updateGeometryInfoCard();
      this.updateNeighborhoodLaboratory();
      this.populatePatternLibrary();
      this.history = Array.isArray(payload.history) ? payload.history.slice(-80) : [];
      this.stateHashes = new Map();
      this.extinctionTime = null;
      const obs = this.engine.getObservables();
      if (!this.history.length) this.history.push(structuredClone(obs));
      this.draw();
      this.updateReadout(obs);
      this.updateChallengeStatus(obs);
      this.drawPlots();
    } finally {
      this.applyingRemoteState = false;
    }
  }

  updateOnlineControls(message = '') {
    if (!this.lifePlayModeSelect) return;
    const usage = this.usageModeSelect?.value || 'zero';
    if (usage !== 'two' && this.lifePlayModeSelect.value !== 'local') {
      this.lifePlayModeSelect.value = 'local';
    }
    const online = this.lifePlayModeSelect.value === 'online';
    const showConnectionControls = usage === 'two';
    if (this.lifeOnlineControls) this.lifeOnlineControls.hidden = !showConnectionControls;
    this.lifeOnlineControls?.classList.toggle('online-active', online);
    if (this.lifeCreateRoomBtn) this.lifeCreateRoomBtn.disabled = !online;
    if (this.lifeFindMatchBtn) this.lifeFindMatchBtn.disabled = !online;
    if (this.lifeJoinRoomBtn) this.lifeJoinRoomBtn.disabled = !online;
    if (this.roomIdInput) this.roomIdInput.disabled = !online;
    if (this.connectionStatusEl) {
      this.connectionStatusEl.textContent = t('disconnected', this.language);
      this.connectionStatusEl.className = `connection-status ${online ? 'disconnected' : 'disconnected'} life-online-details`;
    }
    const text = message
      ? this.lifeText(message)
      : this.lifeText(online ? 'onlineReady' : 'localBoardOnly');
    this.setStatus(text);
  }

  setStatus(text) {
    if (this.onlineColorEl) this.onlineColorEl.textContent = text || '';
  }

  setOnlineColor(color, roomId, room) {
    this.myColor = color || null;
    if (!this.onlineColorEl) return;
    if (!roomId) {
      this.onlineColorEl.textContent = this.lifeText('localBoardOnlyShort');
      return;
    }
    if (room?.status === 'waiting') {
      this.onlineColorEl.textContent = this.lifeText('roomWaiting', { room: roomId });
      return;
    }
    this.onlineColorEl.textContent = color ? this.lifeText('connectedAs', { color }) : this.lifeText('connectedSpectator');
  }

  updateOnlineRoomUI(roomId) {
    if (this.lifePlayModeSelect && roomId) {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls();
    }
  }

  tryJoinSharedRoomFromUrl() {
    const room = readParams().get('room');
    if (!room || !this.network || !this.lifePlayModeSelect) return;
    this.lifePlayModeSelect.value = 'online';
    if (this.roomIdInput) this.roomIdInput.value = room;
    window.setTimeout(() => this.network?.joinRoom(room), 120);
  }

  queueOnlineSync() {
    if (this.applyingRemoteState || this.lifePlayModeSelect?.value !== 'online' || !this.network?.isConnected) return;
    const now = Date.now();
    const elapsed = now - this.lastOnlineSyncAt;
    if (elapsed < 650) {
      if (!this.pendingOnlineSync) {
        this.pendingOnlineSync = window.setTimeout(() => {
          this.pendingOnlineSync = 0;
          this.queueOnlineSync();
        }, 650 - elapsed);
      }
      return;
    }
    this.lastOnlineSyncAt = now;
    this.nextOnlineTurn = this.myColor === 'white' ? 'black' : 'white';
    this.network.sendState({ type: 'life_state_update' }).finally(() => { this.nextOnlineTurn = ''; });
  }


  is3DView() {
    return this.engine.dimension >= 3 || this.viewModeSelect.value === 'surface3d';
  }

  isCameraInteraction(event) {
    if (this.is3DView()) {
      return this.tool === 'inspect'
        || event.shiftKey
        || event.altKey
        || event.button === 1
        || event.button === 2;
    }
    return event.shiftKey || event.altKey || event.button === 1 || event.button === 2;
  }

  startCameraDrag(event) {
    event.preventDefault();
    this.camera.dragging = true;
    this.camera.lastX = event.clientX;
    this.camera.lastY = event.clientY;
  }

  updateCameraDrag(event) {
    event.preventDefault();
    const dx = event.clientX - this.camera.lastX;
    const dy = event.clientY - this.camera.lastY;
    this.camera.lastX = event.clientX;
    this.camera.lastY = event.clientY;
    if (this.is3DView()) {
      this.camera.rotY += dx * 0.012;
      this.camera.rotX = Math.max(-1.35, Math.min(1.35, this.camera.rotX + dy * 0.012));
    } else {
      this.camera.panX += dx * (window.devicePixelRatio || 1);
      this.camera.panY += dy * (window.devicePixelRatio || 1);
      this.clampFlatPan();
    }
    this.draw();
  }

  startTouchCameraGesture() {
    const [a, b] = Array.from(this.touchPointers.values()).slice(0, 2);
    if (!a || !b) return;
    this.touchCameraGesture = {
      distance: Math.max(12, Math.hypot(a.x - b.x, a.y - b.y)),
      centerX: (a.x + b.x) / 2,
      centerY: (a.y + b.y) / 2,
      rotX: this.camera.rotX,
      rotY: this.camera.rotY,
      zoom: this.camera.zoom,
      panX: this.camera.panX,
      panY: this.camera.panY
    };
  }

  updateTouchCameraGesture(event) {
    const [a, b] = Array.from(this.touchPointers.values()).slice(0, 2);
    if (!a || !b || !this.touchCameraGesture) return;
    event.preventDefault();
    const centerX = (a.x + b.x) / 2;
    const centerY = (a.y + b.y) / 2;
    const dx = centerX - this.touchCameraGesture.centerX;
    const dy = centerY - this.touchCameraGesture.centerY;
    const factor = Math.max(0.2, Math.min(5, Math.hypot(a.x - b.x, a.y - b.y) / this.touchCameraGesture.distance));

    if (this.is3DView()) {
      this.camera.rotY = this.touchCameraGesture.rotY + dx * 0.012;
      this.camera.rotX = Math.max(-1.35, Math.min(1.35, this.touchCameraGesture.rotX + dy * 0.012));
      this.camera.zoom = Math.max(0.45, Math.min(8, this.touchCameraGesture.zoom * factor));
    } else {
      const pixelRatio = window.devicePixelRatio || 1;
      this.camera.zoom = Math.max(1, Math.min(48, this.touchCameraGesture.zoom * factor));
      this.camera.panX = this.touchCameraGesture.panX + dx * pixelRatio;
      this.camera.panY = this.touchCameraGesture.panY + dy * pixelRatio;
      this.clampFlatPan();
    }
    this.draw();
  }

  handleCanvasWheel(event) {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    if (this.is3DView()) {
      this.camera.zoom = Math.max(0.45, Math.min(8, this.camera.zoom * factor));
    } else {
      this.zoomFlatBoardAtEvent(event, factor);
    }
    this.draw();
  }

  handleCanvasPointer(event) {
    const position = this.eventToPosition(event);
    if (!position) return;
    if (this.tool === 'inspect') {
      const cell = this.engine.getCell(position);
      this.challengeStatus.textContent = `${t('status', this.language)}: ${position.join(',')} ${t('cellSpecies', this.language)}=${cell.species || 0} ${t('cellAge', this.language)}=${cell.age || 0}`;
      return;
    }
    const selectedPattern = this.selectedPattern();
    if (this.tool === 'draw' && selectedPattern.id !== 'single-cell') {
      if (this.drawing && this.lastDrawPosition) return;
      this.placePatternAtPosition(position);
      this.lastDrawPosition = position;
      this.afterStateChange();
      return;
    }
    const positions = this.drawing && this.lastDrawPosition
      ? this.interpolatePositions(this.lastDrawPosition, position)
      : [position];
    for (const item of positions) this.applyToolAtPosition(item);
    this.lastDrawPosition = position;
    this.afterStateChange();
  }

  applyToolAtPosition(position) {
    if (this.tool === 'erase') {
      this.engine.setCell(position, { state: 0, species: 0, age: 0 });
      return;
    }
    const species = this.usageModeSelect.value === 'two'
      ? Number(this.activePlayerSelect.value)
      : Number(this.activePlayerSelect.value || this.speciesSelect.value || 1);
    this.engine.setCell(position, { state: 1, species, age: 1, energy: 1, health: 1 });
  }

  interpolatePositions(start, end) {
    if (!Array.isArray(start) || !Array.isArray(end) || start.length !== end.length) return [end];
    const maxDelta = Math.max(...end.map((value, index) => Math.abs(value - start[index])));
    const steps = Math.max(1, maxDelta);
    const seen = new Set();
    const positions = [];
    for (let step = 0; step <= steps; step += 1) {
      const tValue = step / steps;
      const position = end.map((value, index) => Math.round(start[index] + (value - start[index]) * tValue));
      const key = position.join(',');
      if (!seen.has(key)) { seen.add(key); positions.push(position); }
    }
    return positions;
  }

  canvasPointFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * this.canvas.height
    };
  }

  flatViewTransform(width = this.canvas.width, height = this.canvas.height) {
    const columns = Math.max(1, this.engine.size[0]);
    const rows = Math.max(1, this.engine.dimension >= 2 ? this.engine.size[1] : 1);
    const zoom = Math.max(1, Math.min(48, Number(this.camera.zoom) || 1));
    this.camera.zoom = zoom;
    if (this.engine.dimension === 2 && this.flatLatticeKind() === 'triangular') {
      const baseSide = Math.max(1, Math.min(
        width / Math.max(1, 1 + (columns - 1) * 0.5),
        height / Math.max(1, rows * SQRT3 / 2)
      ) * zoom);
      const triangleHeight = baseSide * SQRT3 / 2;
      const boardWidth = baseSide + Math.max(0, columns - 1) * baseSide * 0.5;
      const boardHeight = rows * triangleHeight;
      return {
        columns,
        rows,
        zoom,
        sx: baseSide * 0.5,
        sy: triangleHeight,
        triangleSide: baseSide,
        triangleHeight,
        boardWidth,
        boardHeight,
        originX: (width - boardWidth) / 2 + (Number(this.camera.panX) || 0),
        originY: (height - boardHeight) / 2 + (Number(this.camera.panY) || 0)
      };
    }
    if (this.engine.dimension === 2 && this.flatLatticeKind() === 'honeycomb') {
      const radius = Math.max(1, Math.min(
        width / (SQRT3 * (columns + 0.5)),
        height / (1.5 * Math.max(0, rows - 1) + 2)
      ) * zoom);
      const hexWidth = SQRT3 * radius;
      const hexHeight = 2 * radius;
      const rowStep = 1.5 * radius;
      const boardWidth = hexWidth * (columns + 0.5);
      const boardHeight = rows <= 1 ? hexHeight : rowStep * (rows - 1) + hexHeight;
      return {
        columns,
        rows,
        zoom,
        sx: hexWidth,
        sy: rowStep,
        hexRadius: radius,
        hexWidth,
        hexHeight,
        hexRowStep: rowStep,
        boardWidth,
        boardHeight,
        originX: (width - boardWidth) / 2 + (Number(this.camera.panX) || 0),
        originY: (height - boardHeight) / 2 + (Number(this.camera.panY) || 0)
      };
    }
    if (this.engine.dimension === 1) {
      const sx = (width / columns) * zoom;
      const boardWidth = sx * columns;
      const boardHeight = Math.max(42, Math.min(height, height * 0.24) * zoom);
      return {
        columns,
        rows,
        zoom,
        sx,
        sy: boardHeight,
        boardWidth,
        boardHeight,
        originX: (width - boardWidth) / 2 + (Number(this.camera.panX) || 0),
        originY: (height - boardHeight) / 2 + (Number(this.camera.panY) || 0)
      };
    }
    const cellSide = Math.max(1, Math.min(width / columns, height / rows) * zoom);
    const boardWidth = cellSide * columns;
    const boardHeight = cellSide * rows;
    return {
      columns,
      rows,
      zoom,
      sx: cellSide,
      sy: cellSide,
      boardWidth,
      boardHeight,
      originX: (width - boardWidth) / 2 + (Number(this.camera.panX) || 0),
      originY: (height - boardHeight) / 2 + (Number(this.camera.panY) || 0)
    };
  }

  clampFlatPan(width = this.canvas.width, height = this.canvas.height) {
    if (this.is3DView()) return;
    const view = this.flatViewTransform(width, height);
    if (view.zoom <= 1.01) {
      this.camera.panX = 0;
      this.camera.panY = 0;
      return;
    }
    const slackX = Math.max(0, (view.boardWidth - width) / 2);
    const slackY = Math.max(0, (view.boardHeight - height) / 2);
    this.camera.panX = Math.max(-slackX, Math.min(slackX, Number(this.camera.panX) || 0));
    this.camera.panY = Math.max(-slackY, Math.min(slackY, Number(this.camera.panY) || 0));
  }

  zoomFlatBoardAtEvent(event, factor) {
    const point = this.canvasPointFromEvent(event);
    if (!point) return;
    const before = this.flatViewTransform();
    const boardX = (point.x - before.originX) / before.sx;
    const boardY = (point.y - before.originY) / before.sy;
    this.camera.zoom = Math.max(1, Math.min(48, before.zoom * factor));
    const after = this.flatViewTransform();
    const centeredOriginX = (this.canvas.width - after.boardWidth) / 2;
    const centeredOriginY = (this.canvas.height - after.boardHeight) / 2;
    this.camera.panX = point.x - boardX * after.sx - centeredOriginX;
    this.camera.panY = point.y - boardY * after.sy - centeredOriginY;
    this.clampFlatPan();
  }

  eventToPosition(event) {
    const point = this.canvasPointFromEvent(event);
    if (!point) return null;
    if (this.isProjectedDrawingView()) return this.projectedPointToPosition(point);
    const view = this.flatViewTransform();
    if (this.engine.dimension === 2 && this.flatLatticeKind() !== 'square') {
      return this.flatLatticePositionFromPoint(point, view);
    }
    const x = Math.floor((point.x - view.originX) / view.sx);
    const y = this.engine.dimension >= 2 ? Math.floor((point.y - view.originY) / view.sy) : 0;
    if (x < 0 || x >= this.engine.size[0]) return null;
    if (this.engine.dimension === 1) return [x];
    if (y < 0 || y >= this.engine.size[1]) return null;
    if (this.engine.dimension === 2) return [x, y];
    if (this.engine.dimension === 3) return [x, y, Math.floor(this.engine.size[2] / 2)];
    return [x, y, 0, 0];
  }

  isProjectedDrawingView() {
    const view = this.viewModeSelect.value;
    return (this.engine.dimension === 2 && view === 'surface3d') || this.engine.dimension >= 3 || view === 'volume';
  }

  flatLatticeKind() {
    return this.engine.dimension === 2 ? (this.engine.lattice || this.latticeSelect?.value || 'square') : 'square';
  }

  currentBoardOpacity() {
    return BOARD_OPACITY_LEVELS[this.boardOpacityIndex] ?? BOARD_OPACITY_LEVELS[0];
  }

  flatCellPolygon(x, y, view, inset = 0) {
    const { sx, sy, originX, originY } = view;
    const left = originX + x * sx + inset;
    const top = originY + y * sy + inset;
    const right = originX + (x + 1) * sx - inset;
    const bottom = originY + (y + 1) * sy - inset;
    const cx = originX + (x + 0.5) * sx;
    const cy = originY + (y + 0.5) * sy;
    const lattice = this.flatLatticeKind();

    if (lattice === 'triangular') {
      const side = Math.max(1, (view.triangleSide || sx * 2) - inset * 2);
      const height = Math.max(1, (view.triangleHeight || sy) - inset * SQRT3);
      const leftEdge = originX + x * (view.triangleSide || sx * 2) * 0.5 + inset;
      const topEdge = originY + y * (view.triangleHeight || sy) + inset * SQRT3 / 2;
      return ((x + y) % 2 === 0)
        ? [[leftEdge + side * 0.5, topEdge], [leftEdge + side, topEdge + height], [leftEdge, topEdge + height]]
        : [[leftEdge, topEdge], [leftEdge + side, topEdge], [leftEdge + side * 0.5, topEdge + height]];
    }

    if (lattice === 'honeycomb') {
      const radius = Math.max(1, (view.hexRadius || Math.min(view.sx / SQRT3, view.sy / 1.5)) - inset);
      const centerX = originX + (x + 0.5 + (y % 2 ? 0.5 : 0)) * (view.hexWidth || view.sx);
      const centerY = originY + radius + y * (view.hexRowStep || view.sy);
      return Array.from({ length: 6 }, (_, index) => {
        const angle = -Math.PI / 2 + index * Math.PI / 3;
        return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];
      });
    }

    return [[left, top], [right, top], [right, bottom], [left, bottom]];
  }

  drawPolygonPath(ctx, points) {
    if (!points.length) return;
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }

  pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      const crosses = ((yi > point.y) !== (yj > point.y))
        && point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-9) + xi;
      if (crosses) inside = !inside;
    }
    return inside;
  }

  flatLatticePositionFromPoint(point, view) {
    const lattice = this.flatLatticeKind();
    const xGuess = lattice === 'honeycomb'
      ? Math.floor((point.x - view.originX) / (view.hexWidth || view.sx))
      : lattice === 'triangular'
      ? Math.floor((point.x - view.originX) / Math.max(1, (view.triangleSide || view.sx * 2) * 0.5))
      : Math.floor((point.x - view.originX) / view.sx);
    const yGuess = lattice === 'honeycomb'
      ? Math.floor((point.y - view.originY) / (view.hexRowStep || view.sy))
      : Math.floor((point.y - view.originY) / view.sy);
    const range = lattice === 'honeycomb' ? 3 : lattice === 'triangular' ? 3 : 1;
    const x0 = Math.max(0, xGuess - range);
    const y0 = Math.max(0, yGuess - range);
    const x1 = Math.min(this.engine.size[0] - 1, xGuess + range + 1);
    const y1 = Math.min(this.engine.size[1] - 1, yGuess + range + 1);
    let nearest = null;
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const polygon = this.flatCellPolygon(x, y, view, 0);
        if (this.pointInPolygon(point, polygon)) return [x, y];
        const cx = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
        const cy = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
        const distance = Math.hypot(point.x - cx, point.y - cy);
        if (!nearest || distance < nearest.distance) nearest = { position: [x, y], distance };
      }
    }
    const maxDistance = lattice === 'honeycomb'
      ? (view.hexRadius || Math.max(view.sx, view.sy) * 0.5)
      : Math.max(view.sx, view.sy) * 0.42;
    return nearest && nearest.distance <= maxDistance ? nearest.position : null;
  }

  projectedSurfaceCellPolygon(x, y, width, height) {
    return this.projectedSurfaceCell(x, y, width, height).polygon;
  }

  projectedSurfaceCell(x, y, width, height, inset = 0) {
    const rawPoints = this.surfaceCellLatticePolygon(x, y, inset)
      .map((latticePoint) => this.surfaceRawFromLatticePoint(latticePoint));
    const projected = rawPoints.map((raw) => this.projectPoint(raw, width, height, 0.82));
    const polygon = projected.map((point) => [point.x, point.y]);
    const depth = projected.reduce((sum, point) => sum + point.z, 0) / Math.max(1, projected.length);
    const perspective = projected.reduce((sum, point) => sum + point.perspective, 0) / Math.max(1, projected.length);
    const center = {
      x: projected.reduce((sum, point) => sum + point.x, 0) / Math.max(1, projected.length),
      y: projected.reduce((sum, point) => sum + point.y, 0) / Math.max(1, projected.length),
      z: depth,
      perspective
    };
    return { polygon, projected, rawPoints, depth, center };
  }

  projectedSurfacePointToPosition(point, width, height) {
    let best = null;
    const limitX = this.engine.size[0];
    const limitY = this.engine.size[1] || 1;
    for (let y = 0; y < limitY; y += 1) {
      for (let x = 0; x < limitX; x += 1) {
        const tile = this.projectedSurfaceCell(x, y, width, height);
        const polygon = tile.polygon;
        if (!this.pointInPolygon(point, polygon)) continue;
        const distance = Math.hypot(point.x - tile.center.x, point.y - tile.center.y);
        const candidate = { distance, depth: tile.depth, position: [x, y] };
        if (!best || candidate.depth > best.depth + 0.035 || (Math.abs(candidate.depth - best.depth) <= 0.035 && candidate.distance < best.distance)) {
          best = candidate;
        }
      }
    }
    return best?.position || null;
  }

  projectedVolumePointToPosition(point, width, height) {
    let best = null;
    const limitX = this.engine.size[0];
    const limitY = this.engine.dimension >= 2 ? this.engine.size[1] : 1;
    const depth = Math.max(1, this.engine.size[2] || 1);
    for (let z = 0; z < depth; z += 1) {
      for (let y = 0; y < limitY; y += 1) {
        for (let x = 0; x < limitX; x += 1) {
          const faces = this.projectedVolumeCellFaces(x, y, z, width, height);
          for (const face of faces) {
            if (!this.pointInPolygon(point, face.polygon)) continue;
            const centerX = face.polygon.reduce((sum, item) => sum + item[0], 0) / face.polygon.length;
            const centerY = face.polygon.reduce((sum, item) => sum + item[1], 0) / face.polygon.length;
            const distance = Math.hypot(point.x - centerX, point.y - centerY);
            const position = this.engine.dimension === 4 ? [x, y, z, 0] : [x, y, z];
            const candidate = { distance, depth: face.depth, position };
            if (!best || candidate.depth > best.depth + 0.04 || (Math.abs(candidate.depth - best.depth) <= 0.04 && candidate.distance < best.distance)) {
              best = candidate;
            }
          }
        }
      }
    }
    return best?.position || null;
  }

  projectedPointToPosition(point) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    if (this.engine.dimension === 2 && this.viewModeSelect.value === 'surface3d') {
      return this.projectedSurfacePointToPosition(point, width, height);
    }
    return this.projectedVolumePointToPosition(point, width, height);
  }

  checkStillLife(currentHash, population) {
    if (!population || lifeRuleHasRandomness(this.engine.rule)) return false;
    const probe = this.engine.clone();
    probe.step();
    return hashAliveCells(probe) === currentHash;
  }

  detectMovingCandidate(shapeSignature, currentHash, currentGeneration) {
    if (!shapeSignature || !currentHash) return null;
    const recent = this.history.slice(-24).reverse();
    for (const sample of recent) {
      if (!sample?.shapeHash2D || sample.shapeHash2D !== shapeSignature.hash) continue;
      if (!sample.shapeBox2D?.min || sample.stateHash === currentHash) continue;
      const dx = shapeSignature.min[0] - sample.shapeBox2D.min[0];
      const dy = shapeSignature.min[1] - sample.shapeBox2D.min[1];
      const period = currentGeneration - sample.generation;
      if (period > 0 && (dx !== 0 || dy !== 0)) {
        return {
          period,
          translation: [dx, dy],
          matchedGeneration: sample.generation,
          confidence: 'candidate'
        };
      }
    }
    return null;
  }

  classifyDetectedStructures(obs, currentHash, shapeSignature) {
    const movingCandidate = this.detectMovingCandidate(shapeSignature, currentHash, obs.generation);
    const stable = this.checkStillLife(currentHash, obs.population);
    const period = Number(obs.recurrenceHashPeriodEstimate || obs.oscillationPeriod || 0);

    if (obs.population === 0) {
      return { kind: 'extinct', labelKey: 'structureExtinct', confidence: 'exact' };
    }
    if (stable) {
      return { kind: 'stable', labelKey: 'structureStable', confidence: 'next-step' };
    }
    if (period > 1) {
      return { kind: 'oscillator', labelKey: 'structureOscillatorPeriod', period, confidence: 'hash-recurrence' };
    }
    if (movingCandidate) {
      return { kind: 'moving_candidate', labelKey: 'structureMovingCandidate', ...movingCandidate };
    }
    return { kind: 'chaotic', labelKey: 'structureChaotic', confidence: 'not-classified' };
  }

  formatDetectedStructures(detection = {}) {
    const key = detection.labelKey || 'structureChaotic';
    const period = detection.period ?? '—';
    const [dx = 0, dy = 0] = detection.translation || [];
    return t(key, this.language)
      .replace('{period}', period)
      .replace('{dx}', dx)
      .replace('{dy}', dy);
  }

  afterStateChange() {
    const obs = this.engine.getObservables();
    const hash = hashAliveCells(this.engine);
    const shapeSignature = aliveShapeSignature2D(this.engine);
    const center = obs.centerOfMass || centerOfMass(this.engine);
    const previous = this.history.length ? this.history[this.history.length - 1] : null;
    if (obs.population === 0 && this.extinctionTime == null) this.extinctionTime = obs.generation;
    if (!this.initialCenter && center) this.initialCenter = center;
    obs.populationGrowthRate = previous?.population ? (obs.population - previous.population) / previous.population : 0;
    obs.stateHash = hash;
    if (hash && this.stateHashes.has(hash)) {
      obs.recurrenceHashPeriodEstimate = obs.generation - this.stateHashes.get(hash);
      obs.oscillationPeriod = obs.recurrenceHashPeriodEstimate;
      this.stateHashes.set(hash, obs.generation);
    }
    else if (hash) this.stateHashes.set(hash, obs.generation);
    if (!obs.recurrenceHashPeriodEstimate) obs.recurrenceHashPeriodEstimate = null;
    obs.frontVelocity = this.initialCenter && center && obs.generation > 0 ? distance(this.initialCenter, center) / obs.generation : 0;
    obs.extinctionTime = this.extinctionTime;
    obs.survivalTime = obs.generation;
    obs.shapeHash2D = shapeSignature?.hash || null;
    obs.shapeBox2D = shapeSignature
      ? { min: shapeSignature.min, max: shapeSignature.max, width: shapeSignature.width, height: shapeSignature.height }
      : null;
    obs.detectedStructures = this.classifyDetectedStructures(obs, hash, shapeSignature);
    this.history.push(structuredClone(obs));
    if (this.history.length > 220) this.history.shift();
    this.draw(); this.updateReadout(obs); this.updateChallengeStatus(obs); this.drawPlots();
    this.queueOnlineSync();
  }

  updateReadout(obs = this.engine.getObservables()) {
    this.obs.Generation.textContent = String(obs.generation);
    this.obs.Population.textContent = String(obs.population);
    this.obs.Density.textContent = formatNumber(obs.density);
    this.obs.PopulationGrowthRate.textContent = formatPercent(obs.populationGrowthRate || 0);
    this.obs.BirthRate.textContent = formatNumber(obs.birthRate);
    this.obs.DeathRate.textContent = formatNumber(obs.deathRate);
    this.obs.SpeciesFractions.textContent = compactObject(obs.speciesFractions);
    this.obs.MeanAge.textContent = formatNumber(obs.meanAge ?? obs.averageAge, 2);
    this.obs.AgeDistribution.textContent = compactObject(obs.ageDistribution, 0);
    this.obs.ClusterCount.textContent = String(obs.clusterCount || 0);
    this.obs.LargestCluster.textContent = String(obs.largestClusterSize || 0);
    this.obs.ComponentSizeDistribution.textContent = compactObject(obs.connectedComponentSizeDistribution, 0);
    this.obs.Entropy.textContent = formatNumber(obs.entropy);
    this.obs.Correlation.textContent = formatNumber(obs.spatialCorrelation);
    this.obs.CenterOfMass.textContent = compactVector(obs.centerOfMass, 2);
    this.obs.RadiusOfActivity.textContent = formatNumber(obs.radiusOfActivity || 0);
    this.obs.BoundingBoxMeasure.textContent = compactBoundingBox(obs.boundingBox, obs.boundingBoxMeasure);
    this.obs.ExtinctionTime.textContent = this.extinctionTime == null ? '—' : String(this.extinctionTime);
    this.obs.SurvivalTime.textContent = String(obs.generation);
    this.obs.Oscillation.textContent = obs.oscillationPeriod ? `${t('detected', this.language)} P=${obs.oscillationPeriod}` : t('notYet', this.language);
    this.obs.RecurrencePeriodEstimate.textContent = obs.recurrenceHashPeriodEstimate ? `P=${obs.recurrenceHashPeriodEstimate}` : t('notYet', this.language);
    this.obs.FrontVelocity.textContent = formatNumber(obs.frontVelocity || 0);
    this.obs.CompressionRatioProxy.textContent = formatNumber(obs.compressionRatioProxy || 0, 4);
    const structureLabel = this.formatDetectedStructures(obs.detectedStructures);
    if (this.detectedStructuresSummary) this.detectedStructuresSummary.textContent = structureLabel;
    if (this.obs.DetectedStructures) this.obs.DetectedStructures.textContent = structureLabel;
    const scores = this.computeScores(obs);
    this.scoreA.textContent = formatNumber(scores.a, 1);
    this.scoreB.textContent = formatNumber(scores.b, 1);
  }

  computeScores(obs = this.engine.getObservables()) {
    const total = obs.population || 0;
    const aCells = obs.speciesCounts?.[1] || 0;
    const bCells = obs.speciesCounts?.[2] || 0;
    const diversity = Math.max(0, obs.entropy || 0) * 8;
    const stability = this.history.length > 8 ? Math.max(0, 20 - Math.abs(total - this.history[this.history.length - 8].population)) : 0;
    const overcrowding = obs.density > 0.45 ? (obs.density - 0.45) * 80 : 0;
    const extinctionA = aCells === 0 && obs.generation > 0 ? 50 : 0;
    const extinctionB = bCells === 0 && obs.generation > 0 ? 50 : 0;
    const territoryA = (obs.speciesClusters?.[1] || 0) * 2 + (obs.largestClusterSize || 0) * (aCells >= bCells ? 0.12 : 0.04);
    const territoryB = (obs.speciesClusters?.[2] || 0) * 2 + (obs.largestClusterSize || 0) * (bCells > aCells ? 0.12 : 0.04);
    return { a: aCells + territoryA + stability + diversity - overcrowding - extinctionA, b: bCells + territoryB + stability + diversity - overcrowding - extinctionB };
  }

  updateChallengeStatus(obs = this.engine.getObservables()) {
    const usage = this.usageModeSelect.value;
    if (usage === 'zero') { this.challengeStatus.textContent = `${t('status', this.language)}: ${t('running', this.language)}`; return; }
    if (usage === 'two') {
      const scores = this.computeScores(obs);
      const lead = scores.a === scores.b ? t('tie', this.language) : (scores.a > scores.b ? t('playerA', this.language) : t('playerB', this.language));
      this.challengeStatus.textContent = `${t('status', this.language)}: ${lead}`; return;
    }
    const goal = this.challengeGoalSelect.value;
    const maxGen = Number(this.maxGenerationInput.value) || 500;
    let state = t('running', this.language);
    if (goal === 'survive') state = obs.population > 0 && obs.generation >= maxGen ? t('passed', this.language) : (obs.population ? t('running', this.language) : t('failed', this.language));
    if (goal === 'population-band') state = obs.population >= 40 && obs.population <= Math.max(120, this.engine.cells.length * 0.22) ? t('passed', this.language) : t('running', this.language);
    if (goal === 'oscillator') state = obs.oscillationPeriod ? t('passed', this.language) : t('notYet', this.language);
    if (goal === 'glider') state = (obs.frontVelocity || 0) > 0.08 && obs.population > 0 ? t('passed', this.language) : t('notYet', this.language);
    if (goal === 'noise-survival') state = obs.population > 0 && obs.generation > 120 ? t('passed', this.language) : (obs.population ? t('running', this.language) : t('failed', this.language));
    if (goal === 'invasive-control') state = obs.density < 0.42 && obs.population > 0 ? t('passed', this.language) : t('running', this.language);
    if (goal === 'ecosystem') state = obs.speciesRichness >= 2 && obs.generation > 80 ? t('passed', this.language) : t('running', this.language);
    this.challengeStatus.textContent = `${t('status', this.language)}: ${state}`;
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.floor(rect.width * ratio));
    const height = Math.max(320, Math.floor(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }


  rotatePoint(point) {
    const cy = Math.cos(this.camera.rotY);
    const sy = Math.sin(this.camera.rotY);
    const cx = Math.cos(this.camera.rotX);
    const sx = Math.sin(this.camera.rotX);

    const x1 = point.x * cy - point.z * sy;
    const z1 = point.x * sy + point.z * cy;
    const y1 = point.y * cx - z1 * sx;
    const z2 = point.y * sx + z1 * cx;
    return { x: x1, y: y1, z: z2 };
  }

  projectPoint(point, width, height, scale = 1) {
    const rotated = this.rotatePoint(point);
    const perspective = 1 / (2.9 - rotated.z * 0.58);
    const s = Math.min(width, height) * 0.47 * this.camera.zoom * scale * perspective;
    return {
      x: width / 2 + rotated.x * s,
      y: height / 2 + rotated.y * s,
      z: rotated.z,
      perspective
    };
  }

  surfaceLatticeBounds() {
    const nx = Math.max(1, this.engine.size[0]);
    const ny = Math.max(1, this.engine.size[1] || 1);
    const lattice = this.flatLatticeKind();
    if (lattice === 'triangular') {
      return { nx: 1 + Math.max(0, nx - 1) * 0.5, ny: Math.max(1, ny * SQRT3 / 2) };
    }
    if (lattice === 'honeycomb') {
      return {
        nx: Math.max(1, SQRT3 * (nx + 0.5)),
        ny: Math.max(1, ny <= 1 ? 2 : 1.5 * (ny - 1) + 2)
      };
    }
    return { nx, ny };
  }

  surfaceLatticePoint(x, y) {
    const bounds = this.surfaceLatticeBounds();
    return { x, y, nx: bounds.nx, ny: bounds.ny };
  }

  surfaceRawFromLatticePoint(latticePoint) {
    const geom = this.boardGeometrySelect.value;
    const nx = latticePoint.nx;
    const ny = latticePoint.ny;
    const u = (latticePoint.x / nx) * Math.PI * 2;
    const vv = (latticePoint.y / Math.max(1, ny));
    const v2 = (latticePoint.y / ny) * Math.PI * 2;
    const vPi = vv * Math.PI;

    if (geom === 'sphere' || geom === 'rp2') {
      return {
        x: Math.cos(u) * Math.sin(vPi),
        y: -Math.cos(vPi),
        z: Math.sin(u) * Math.sin(vPi)
      };
    }

    if (geom === 'mobius') {
      const band = (vv - 0.5) * 0.9;
      const r = 1 + band * Math.cos(u / 2);
      return {
        x: r * Math.cos(u),
        y: band * Math.sin(u / 2),
        z: r * Math.sin(u)
      };
    }

    if (geom === 'cylinder') {
      return {
        x: Math.cos(u),
        y: (vv - 0.5) * 1.75,
        z: Math.sin(u)
      };
    }

    if (geom === 'klein_surface') {
      const surfaceU = vv * TAU;
      const surfaceV = (latticePoint.x / Math.max(1, nx)) * TAU - Math.PI / 2;
      return kleinBottleSurfacePoint(surfaceU, surfaceV);
    }

    if (geom === 't2') {
      const R = 1;
      const r = 0.34;
      return {
        x: (R + r * Math.cos(v2)) * Math.cos(u),
        y: r * Math.sin(v2),
        z: (R + r * Math.cos(v2)) * Math.sin(u)
      };
    }

    return {
      x: (latticePoint.x / Math.max(1, nx) - 0.5) * 1.8,
      y: (latticePoint.y / Math.max(1, ny) - 0.5) * 1.8,
      z: 0
    };
  }

  surfaceRawPoint(x, y) {
    return this.surfaceRawFromLatticePoint(this.surfaceLatticePoint(x, y));
  }

  surfaceCellLatticePolygon(x, y, inset = 0) {
    const bounds = this.surfaceLatticeBounds();
    const lattice = this.flatLatticeKind();
    if (lattice === 'triangular') {
      const height = SQRT3 / 2;
      const left = x * 0.5;
      const top = y * height;
      const points = ((x + y) % 2 === 0)
        ? [[left + 0.5, top], [left + 1, top + height], [left, top + height]]
        : [[left, top], [left + 1, top], [left + 0.5, top + height]];
      return this.insetLatticePolygon(points, inset).map(([px, py]) => ({ x: px, y: py, ...bounds }));
    }
    if (lattice === 'honeycomb') {
      const radius = 1;
      const centerX = (x + 0.5 + (y % 2 ? 0.5 : 0)) * SQRT3;
      const centerY = 1 + y * 1.5;
      const points = Array.from({ length: 6 }, (_, index) => {
        const angle = -Math.PI / 2 + index * Math.PI / 3;
        return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];
      });
      return this.insetLatticePolygon(points, inset).map(([px, py]) => ({ x: px, y: py, ...bounds }));
    }
    const points = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
    return this.insetLatticePolygon(points, inset).map(([px, py]) => ({ x: px, y: py, ...bounds }));
  }

  insetLatticePolygon(points, inset = 0) {
    if (!inset) return points;
    const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
    const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
    return points.map(([px, py]) => {
      const dx = px - cx;
      const dy = py - cy;
      const length = Math.max(1e-6, Math.hypot(dx, dy));
      const nextLength = Math.max(0, length - inset);
      return [cx + (dx / length) * nextLength, cy + (dy / length) * nextLength];
    });
  }

  volumeRawPoint(x, y, z) {
    const nx = Math.max(1, this.engine.size[0] - 1);
    const ny = Math.max(1, (this.engine.size[1] || 1) - 1);
    const nz = Math.max(1, (this.engine.size[2] || 1) - 1);
    return {
      x: (x / nx - 0.5) * 1.75,
      y: (y / ny - 0.5) * 1.75,
      z: (z / nz - 0.5) * 1.75
    };
  }

  drawPath3D(ctx, points, width, height, scale = 1) {
    if (!points.length) return;
    ctx.beginPath();
    points.forEach((point, index) => {
      const p = this.projectPoint(point, width, height, scale);
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }

  drawSurfaceBoundary(ctx, width, height) {
    if (this.boardGeometrySelect.value === 'klein_surface') return;
    const bounds = this.surfaceLatticeBounds();
    const nx = bounds.nx;
    const ny = bounds.ny;
    ctx.save();
    ctx.lineWidth = Math.max(1.2, width / 520);
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.34)';

    const uSteps = Math.min(Math.max(1, this.engine.size[0]), 64);
    const vSteps = Math.min(Math.max(1, this.engine.size[1] || 1), 64);
    for (let i = 0; i < uSteps; i += 1) {
      const x = (i / uSteps) * nx;
      const line = [];
      for (let j = 0; j <= vSteps; j += 1) {
        const y = (j / vSteps) * ny;
        line.push(this.surfaceRawFromLatticePoint({ x, y, nx, ny }));
      }
      this.drawPath3D(ctx, line, width, height, 0.82);
    }
    for (let j = 0; j <= vSteps; j += 1) {
      const y = (j / vSteps) * ny;
      const line = [];
      for (let i = 0; i <= uSteps; i += 1) {
        const x = (i / uSteps) * nx;
        line.push(this.surfaceRawFromLatticePoint({ x, y, nx, ny }));
      }
      this.drawPath3D(ctx, line, width, height, 0.82);
    }

    ctx.strokeStyle = 'rgba(245, 182, 71, 0.88)';
    ctx.lineWidth = Math.max(2.2, width / 360);
    this.drawPath3D(ctx, Array.from({ length: uSteps + 1 }, (_, i) => {
      const x = (i / uSteps) * nx;
      return this.surfaceRawFromLatticePoint({ x, y: 0, nx, ny });
    }), width, height, 0.82);
    this.drawPath3D(ctx, Array.from({ length: uSteps + 1 }, (_, i) => {
      const x = (i / uSteps) * nx;
      return this.surfaceRawFromLatticePoint({ x, y: ny, nx, ny });
    }), width, height, 0.82);

    ctx.fillStyle = 'rgba(245, 182, 71, 0.92)';
    ctx.font = `${Math.max(12, width / 48)}px ui-sans-serif, system-ui`;
    ctx.fillText(`${this.boardGeometrySelect.value.toUpperCase()} boundary`, 14, 26);
    ctx.restore();
  }

  drawSurfaceCells(ctx, width, height) {
    const boardOpacity = this.currentBoardOpacity();
    const tiles = [];
    for (let y = 0; y < this.engine.size[1]; y += 1) {
      for (let x = 0; x < this.engine.size[0]; x += 1) {
        const cell = this.engine.getCell([x, y]);
        const tile = this.projectedSurfaceCell(x, y, width, height, 0);
        tiles.push({ x, y, cell, ...tile });
      }
    }
    tiles.sort((a, b) => a.depth - b.depth);
    ctx.save();
    for (const item of tiles) {
      const isFront = item.depth >= 0.02;
      if (boardOpacity > 0) {
        ctx.globalAlpha = boardOpacity * (isFront ? 0.94 : 0.78);
        ctx.fillStyle = '#f8fafc';
        this.drawPolygonPath(ctx, item.polygon);
        ctx.fill();
      }
      if (isAlive(item.cell)) {
        const p = item.center;
        const maxAge = Number(this.ageRange.value) || 0;
        const ageAlpha = maxAge ? Math.max(0.34, 1 - (item.cell.age || 0) / (maxAge + 6)) : 0.96;
        const depthAlpha = boardOpacity > 0
          ? 0.98
          : item.depth < -0.08 ? 0.34 : item.depth < 0.08 ? 0.58 : 0.92;
        ctx.globalAlpha = ageAlpha * depthAlpha * (0.68 + 0.32 * Math.max(0, p.perspective));
        ctx.fillStyle = COLORS[item.cell.species] || COLORS[1];
        this.drawPolygonPath(ctx, item.polygon);
        ctx.fill();
      }
      if (this.showGrid) {
        ctx.globalAlpha = item.depth < -0.08 && boardOpacity <= 0 ? 0.26 : 0.62;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.lineWidth = Math.max(0.45, Math.min(1.25, width / this.engine.size[0] * 0.045));
        this.drawPolygonPath(ctx, item.polygon);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawVolumeVoxel(ctx, item, width, height, colorAlpha = 1) {
    const [x, y, z] = item.position;
    const faces = this.projectedVolumeCellFaces(x, y, z, width, height);
    faces.sort((a, b) => a.depth - b.depth);
    for (const face of faces) {
      ctx.globalAlpha = colorAlpha * (0.62 + 0.38 * Math.max(0, face.normalDepth));
      this.drawPolygonPath(ctx, face.polygon);
      ctx.fill();
      if (this.showGrid) {
        ctx.globalAlpha = Math.min(0.72, colorAlpha + 0.16);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 0.65;
        ctx.stroke();
      }
    }
  }

  projectedVolumeCellFaces(x, y, z, width, height) {
    const corners = [
      this.volumeRawCornerPoint(x, y, z),
      this.volumeRawCornerPoint(x + 1, y, z),
      this.volumeRawCornerPoint(x + 1, y + 1, z),
      this.volumeRawCornerPoint(x, y + 1, z),
      this.volumeRawCornerPoint(x, y, z + 1),
      this.volumeRawCornerPoint(x + 1, y, z + 1),
      this.volumeRawCornerPoint(x + 1, y + 1, z + 1),
      this.volumeRawCornerPoint(x, y + 1, z + 1)
    ].map((raw) => this.projectPoint(raw, width, height, 0.86));
    const faceIndexes = [
      [0, 1, 2, 3],
      [4, 7, 6, 5],
      [0, 4, 5, 1],
      [1, 5, 6, 2],
      [2, 6, 7, 3],
      [3, 7, 4, 0]
    ];
    return faceIndexes.map((indexes) => {
      const points = indexes.map((index) => corners[index]);
      const depth = points.reduce((sum, point) => sum + point.z, 0) / points.length;
      const normalDepth = Math.max(0, depth + 0.65);
      return {
        polygon: points.map((point) => [point.x, point.y]),
        depth,
        normalDepth
      };
    });
  }

  volumeRawCornerPoint(x, y, z) {
    const nx = Math.max(1, this.engine.size[0]);
    const ny = Math.max(1, this.engine.size[1] || 1);
    const nz = Math.max(1, this.engine.size[2] || 1);
    return {
      x: (x / nx - 0.5) * 1.75,
      y: (y / ny - 0.5) * 1.75,
      z: (z / nz - 0.5) * 1.75
    };
  }

  drawVolumeCells(ctx, width, height) {
    const depth = this.engine.size[2] || 1;
    const cells = [];
    for (let z = 0; z < depth; z += 1) {
      for (let y = 0; y < this.engine.size[1]; y += 1) {
        for (let x = 0; x < this.engine.size[0]; x += 1) {
          const cell = this.engine.getCell([x, y, z]);
          if (!isAlive(cell)) continue;
          const raw = this.volumeRawPoint(x, y, z);
          const rotated = this.rotatePoint(raw);
          cells.push({ cell, raw, position: [x, y, z], z: rotated.z });
        }
      }
    }
    cells.sort((a, b) => a.z - b.z);
    ctx.save();
    for (const item of cells) {
      const p = this.projectPoint(item.raw, width, height, 0.86);
      const maxAge = Number(this.ageRange.value) || 0;
      const ageAlpha = maxAge ? Math.max(0.34, 1 - (item.cell.age || 0) / (maxAge + 6)) : 0.92;
      const depthAlpha = item.z < -0.08 ? 0.46 : item.z < 0.08 ? 0.68 : 0.96;
      const alpha = ageAlpha * depthAlpha * (0.58 + 0.42 * Math.max(0.22, p.perspective));
      ctx.fillStyle = COLORS[item.cell.species] || COLORS[1];
      this.drawVolumeVoxel(ctx, item, width, height, alpha);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  volumeGridIndices(max, target = 28) {
    const limit = Math.max(1, Math.floor(Number(max) || 1));
    const step = Math.max(1, Math.ceil(limit / target));
    const values = [];
    for (let value = 0; value <= limit; value += step) values.push(value);
    if (values[values.length - 1] !== limit) values.push(limit);
    return values;
  }

  drawVolumeBoundary(ctx, width, height) {
    const corners = [
      [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
      [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
    ].map(([x, y, z]) => ({ x: (x - 0.5) * 1.85, y: (y - 0.5) * 1.85, z: (z - 0.5) * 1.85 }));
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    ctx.save();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.38)';
    ctx.lineWidth = Math.max(1.4, width / 480);
    for (const [a, b] of edges) this.drawPath3D(ctx, [corners[a], corners[b]], width, height, 0.86);

    const nx = Math.max(1, this.engine.size[0]);
    const ny = Math.max(1, this.engine.size[1] || 1);
    const nz = Math.max(1, this.engine.size[2] || 1);
    const xs = this.volumeGridIndices(nx, 30);
    const ys = this.volumeGridIndices(ny, 30);
    const zs = this.volumeGridIndices(nz, 18);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = Math.max(0.7, width / 980);
    if (nx <= 96 && ny <= 96 && nz <= 24) {
      for (const z of zs) {
        for (const y of ys) {
          this.drawPath3D(ctx, [this.volumeRawCornerPoint(0, y, z), this.volumeRawCornerPoint(nx, y, z)], width, height, 0.86);
        }
        for (const x of xs) {
          this.drawPath3D(ctx, [this.volumeRawCornerPoint(x, 0, z), this.volumeRawCornerPoint(x, ny, z)], width, height, 0.86);
        }
      }
      for (const x of xs) {
        for (const y of ys) {
          this.drawPath3D(ctx, [this.volumeRawCornerPoint(x, y, 0), this.volumeRawCornerPoint(x, y, nz)], width, height, 0.86);
        }
      }
    }

    ctx.strokeStyle = 'rgba(245, 182, 71, 0.72)';
    ctx.lineWidth = Math.max(2.2, width / 360);
    this.drawPath3D(ctx, [corners[0], corners[1], corners[2], corners[3], corners[0]], width, height, 0.86);
    this.drawPath3D(ctx, [corners[4], corners[5], corners[6], corners[7], corners[4]], width, height, 0.86);

    ctx.fillStyle = 'rgba(245, 182, 71, 0.92)';
    ctx.font = `${Math.max(12, width / 48)}px ui-sans-serif, system-ui`;
    ctx.fillText(`${this.boardGeometrySelect.value.toUpperCase()} volume`, 14, 26);
    ctx.restore();
  }

  drawFlatBoardBackground(ctx, width, height, view) {
    const boardOpacity = this.currentBoardOpacity();
    if (boardOpacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = boardOpacity;
    ctx.fillStyle = '#f8fafc';
    if (this.engine.dimension === 2 && this.flatLatticeKind() !== 'square') {
      const startX = Math.max(0, Math.floor((0 - view.originX) / Math.max(1, view.sx)) - 2);
      const endX = Math.min(this.engine.size[0] - 1, Math.ceil((width - view.originX) / Math.max(1, view.sx)) + 2);
      const startY = Math.max(0, Math.floor((0 - view.originY) / Math.max(1, view.sy)) - 2);
      const endY = Math.min(this.engine.size[1] - 1, Math.ceil((height - view.originY) / Math.max(1, view.sy)) + 2);
      const inset = this.showGrid ? Math.min(0.35, Math.max(0, Math.min(view.sx, view.sy) * 0.006)) : 0;
      for (let y = startY; y <= endY; y += 1) {
        for (let x = startX; x <= endX; x += 1) {
          this.drawPolygonPath(ctx, this.flatCellPolygon(x, y, view, inset));
          ctx.fill();
        }
      }
    } else {
      ctx.fillRect(view.originX, view.originY, view.boardWidth, view.boardHeight);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawFlatLatticeUnits(ctx, width, height, view) {
    const minCell = Math.min(view.sx, view.sy);
    if (minCell < 3) return;
    const startX = Math.max(0, Math.floor((0 - view.originX) / view.sx) - 1);
    const endX = Math.min(this.engine.size[0] - 1, Math.ceil((width - view.originX) / view.sx) + 1);
    const startY = Math.max(0, Math.floor((0 - view.originY) / view.sy) - 1);
    const endY = Math.min(this.engine.size[1] - 1, Math.ceil((height - view.originY) / view.sy) + 1);
    ctx.save();
    ctx.strokeStyle = this.flatLatticeKind() === 'triangular'
      ? 'rgba(2, 6, 12, 0.62)'
      : 'rgba(2, 6, 12, 0.56)';
    ctx.lineWidth = Math.max(0.35, Math.min(0.85, minCell * 0.03));
    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        this.drawPolygonPath(ctx, this.flatCellPolygon(x, y, view, 0));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawFlatGridLines(ctx, width, height, view) {
    if (this.engine.dimension === 2 && this.flatLatticeKind() !== 'square') {
      this.drawFlatLatticeUnits(ctx, width, height, view);
      return;
    }
    const { sx, sy, originX, originY } = view;
    ctx.save();
    ctx.strokeStyle = 'rgba(8, 14, 24, 0.54)';
    ctx.lineWidth = Math.max(0.35, Math.min(0.85, Math.min(sx, sy) * 0.032));
    for (let x = 0; x <= this.engine.size[0]; x += 1) {
      const px = originX + x * sx;
      if (px < -2 || px > width + 2) continue;
      ctx.beginPath();
      ctx.moveTo(px, originY);
      ctx.lineTo(px, originY + view.boardHeight);
      ctx.stroke();
    }
    if (this.engine.dimension >= 2) {
      for (let y = 0; y <= this.engine.size[1]; y += 1) {
        const py = originY + y * sy;
        if (py < -2 || py > height + 2) continue;
        ctx.beginPath();
        ctx.moveTo(originX, py);
        ctx.lineTo(originX + view.boardWidth, py);
        ctx.stroke();
      }
    }
    if (Math.min(sx, sy) >= 14) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 0.35;
      for (let x = 0.5; x < this.engine.size[0]; x += 1) {
        const px = originX + x * sx;
        if (px < -2 || px > width + 2) continue;
        ctx.beginPath();
        ctx.moveTo(px, originY);
        ctx.lineTo(px, originY + view.boardHeight);
        ctx.stroke();
      }
      if (this.engine.dimension >= 2) {
        for (let y = 0.5; y < this.engine.size[1]; y += 1) {
          const py = originY + y * sy;
          if (py < -2 || py > height + 2) continue;
          ctx.beginPath();
          ctx.moveTo(originX, py);
          ctx.lineTo(originX + view.boardWidth, py);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  drawFlatLatticeOverlay(ctx, width, height, view) {
    if (this.engine.dimension !== 2) return;
    const lattice = this.engine.lattice || this.latticeSelect?.value || 'square';
    if (lattice === 'square') return;
    const { sx, sy, originX, originY } = view;
    const minCell = Math.min(sx, sy);
    if (minCell < 3) return;

    ctx.save();
    ctx.strokeStyle = lattice === 'triangular' ? 'rgba(2, 6, 12, 0.68)' : 'rgba(2, 6, 12, 0.58)';
    ctx.lineWidth = Math.max(0.55, Math.min(1.1, minCell * 0.045));

    if (lattice === 'triangular') {
      for (let y = 0; y < this.engine.size[1]; y += 1) {
        for (let x = 0; x < this.engine.size[0]; x += 1) {
          this.drawPolygonPath(ctx, this.flatCellPolygon(x, y, view, 0));
          ctx.stroke();
        }
      }
    } else if (lattice === 'honeycomb') {
      for (let y = 0; y < this.engine.size[1]; y += 1) {
        for (let x = 0; x < this.engine.size[0]; x += 1) {
          const cx = originX + (x + 0.5) * sx;
          const cy = originY + (y + 0.5) * sy;
          const right = [originX + (x + 1) * sx, cy];
          const vertical = ((x + y) % 2 === 0)
            ? [cx, originY + (y + 1) * sy]
            : [cx, originY + y * sy];
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(right[0], right[1]);
          ctx.moveTo(cx, cy);
          ctx.lineTo(vertical[0], vertical[1]);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  drawFlatBoundary(ctx, width, height, view) {
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 182, 71, 0.84)';
    ctx.lineWidth = Math.max(1.8, width / 380);
    ctx.strokeRect(view.originX + 1, view.originY + 1, view.boardWidth - 2, view.boardHeight - 2);
    ctx.fillStyle = 'rgba(245, 182, 71, 0.92)';
    ctx.font = `${Math.max(12, width / 48)}px ui-sans-serif, system-ui`;
    ctx.fillText(`${this.boardGeometrySelect.value.toUpperCase()} cut-open board`, 14, 26);
    ctx.restore();
  }

  draw() {
    this.resizeCanvas();
    const ctx = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#050a12';
    ctx.fillRect(0, 0, width, height);

    const view = this.viewModeSelect.value;
    if (this.engine.dimension === 2 && view === 'surface3d') {
      if (this.showGrid) this.drawSurfaceBoundary(ctx, width, height);
      this.drawSurfaceCells(ctx, width, height);
      return;
    }

    if (this.engine.dimension >= 3 || view === 'volume') {
      if (this.showGrid) this.drawVolumeBoundary(ctx, width, height);
      this.drawVolumeCells(ctx, width, height);
      return;
    }

    this.clampFlatPan(width, height);
    const flatView = this.flatViewTransform(width, height);
    const { sx, sy, originX, originY } = flatView;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();
    this.drawFlatBoardBackground(ctx, width, height, flatView);

    const yLimit = this.engine.dimension === 1 ? 1 : this.engine.size[1];
    for (let y = 0; y < yLimit; y += 1) {
      for (let x = 0; x < this.engine.size[0]; x += 1) {
        const drawX = originX + x * sx;
        const drawY = this.engine.dimension === 1 ? originY + flatView.boardHeight * 0.46 : originY + y * sy;
        const drawW = Math.max(1, sx - 2);
        const drawH = this.engine.dimension === 1 ? Math.max(4, flatView.boardHeight * 0.08) : Math.max(1, sy - 2);
        const lattice = this.flatLatticeKind();
        const polygon = this.engine.dimension === 2 && lattice !== 'square'
          ? this.flatCellPolygon(x, y, flatView, 0)
          : null;
        const bounds = polygon
          ? polygon.reduce((box, [px, py]) => ({
            minX: Math.min(box.minX, px),
            maxX: Math.max(box.maxX, px),
            minY: Math.min(box.minY, py),
            maxY: Math.max(box.maxY, py)
          }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })
          : { minX: drawX, maxX: drawX + drawW, minY: drawY, maxY: drawY + drawH };
        if (bounds.maxX < 0 || bounds.minX > width || bounds.maxY < 0 || bounds.minY > height) continue;
        const position = this.engine.dimension === 1 ? [x] : [x, y];
        const cell = this.engine.getCell(position);
        if (!isAlive(cell)) continue;
        const maxAge = Number(this.ageRange.value) || 0;
        const ageAlpha = maxAge ? Math.max(0.34, 1 - (cell.age || 0) / (maxAge + 6)) : 0.94;
        ctx.globalAlpha = ageAlpha;
        ctx.fillStyle = COLORS[cell.species] || COLORS[1];
        if (this.engine.dimension === 1) {
          ctx.fillRect(drawX + 1, drawY + 1, drawW, drawH);
        } else if (polygon) {
          this.drawPolygonPath(ctx, polygon);
          ctx.fill();
        } else {
          const fillInset = this.showGrid ? Math.min(0.9, Math.max(0, Math.min(sx, sy) * 0.018)) : 0;
          this.drawPolygonPath(ctx, this.flatCellPolygon(x, y, flatView, fillInset));
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
    if (this.showGrid) {
      this.drawFlatGridLines(ctx, width, height, flatView);
      this.drawFlatBoundary(ctx, width, height, flatView);
    }
    ctx.restore();
  }

  drawPlots() { this.drawLinePlot(this.populationPlot, this.history.map((item) => item.population), '#22c55e'); this.drawSpeciesPlot(); }
  drawLinePlot(canvas, values, color) {
    const ctx = canvas.getContext('2d'); const width = canvas.width; const height = canvas.height;
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = 'rgba(5,10,18,0.82)'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(148,163,184,0.18)'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) { const y = (height / 4) * i; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    if (values.length < 2) return; const max = Math.max(1, ...values);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    values.forEach((value, i) => { const x = (i / Math.max(1, values.length - 1)) * width; const y = height - (value / max) * (height - 12) - 6; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke();
  }
  drawSpeciesPlot() {
    const canvas = this.speciesPlot; const ctx = canvas.getContext('2d'); const width = canvas.width; const height = canvas.height;
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = 'rgba(5,10,18,0.82)'; ctx.fillRect(0, 0, width, height);
    [1, 2, 3].forEach((species) => { const values = this.history.map((item) => item.speciesFractions?.[species] || 0); if (values.length < 2) return; ctx.strokeStyle = COLORS[species]; ctx.lineWidth = 2; ctx.beginPath(); values.forEach((value, i) => { const x = (i / Math.max(1, values.length - 1)) * width; const y = height - value * (height - 12) - 6; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); });
  }

  uiText(key, replacements = {}) {
    return Object.entries(replacements).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      t(key, this.language)
    );
  }

  installPerformanceBenchmark() {
    if (!this.performanceBenchmarkButton || !this.performanceReadout) return;
    this.performanceBenchmarkButton.addEventListener('click', () => this.startPerformanceBenchmark());
    this.updatePerformanceReadout('performanceIdle');
  }

  updatePerformanceReadout(key, replacements = {}) {
    if (!this.performanceReadout) return;
    this.performanceReadout.textContent = this.uiText(key, replacements);
  }

  setPerformanceBenchmarkRunning(running) {
    if (this.performanceBenchmarkButton) this.performanceBenchmarkButton.disabled = Boolean(running);
  }

  readPerformanceBenchmarkConfig() {
    const maxGenerations = Math.round(Number(this.maxGenerationInput?.value) || 120);
    const generations = Math.max(10, Math.min(80, maxGenerations));
    const safeAxis = this.engine.dimension >= 3 ? 16 : 32;
    const safeSize = this.engine.size.map((axis) => Math.max(4, Math.min(safeAxis, Number(axis) || safeAxis)));
    return {
      dimension: this.engine.dimension,
      size: safeSize,
      boardSize: safeSize[0] || safeAxis,
      boundary: this.engine.topology?.boundary || 'open',
      lattice: this.engine.lattice,
      neighborhoodType: this.engine.neighborhoodType,
      neighborhoodRadius: this.engine.neighborhoodRadius,
      neighborhoodMetric: this.engine.neighborhoodMetric,
      rule: structuredClone(this.engine.rule),
      seedDensity: Math.max(0.01, Math.min(0.8, Number(this.topologyCompareDensityInput?.value) || 0.18)),
      speciesCount: Math.max(1, Number(this.speciesSelect?.value) || this.engine.rule?.speciesCount || 1),
      baseSeed: Math.max(1, Math.round(Number(this.topologyCompareSeedInput?.value) || 20260627)),
      generations,
      trials: 2
    };
  }

  startPerformanceBenchmark() {
    if (!this.performanceBenchmarkButton) return;
    this.cancelPerformanceBenchmark({ silent: true });
    const config = this.readPerformanceBenchmarkConfig();
    this.performanceBenchmarkResult = null;
    this.setPerformanceBenchmarkRunning(true);
    this.updatePerformanceReadout('performanceRunning');

    if (typeof window !== 'undefined' && window.Worker) {
      try {
        const worker = new Worker(new URL('./LifeBenchmarkWorker.js', import.meta.url), { type: 'module' });
        this.performanceBenchmarkWorker = worker;
        worker.addEventListener('message', (event) => this.handlePerformanceBenchmarkMessage(event.data));
        worker.addEventListener('error', (event) => {
          this.handlePerformanceBenchmarkMessage({ type: 'error', message: event.message || 'Worker error' });
        });
        worker.postMessage({ type: 'benchmark', config });
        return;
      } catch {
        this.performanceBenchmarkWorker = null;
      }
    }

    this.runPerformanceBenchmarkFallback(config);
  }

  async runPerformanceBenchmarkFallback(config) {
    this.performanceBenchmarkFallbackActive = true;
    this.updatePerformanceReadout('performanceFallback');
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      const { runBenchmark } = await import('./LifeWorkerTasks.js');
      const payload = runBenchmark(config, {
        onProgress: (progress) => this.handlePerformanceBenchmarkMessage({ type: 'progress', ...progress }),
        shouldCancel: () => !this.performanceBenchmarkFallbackActive
      });
      if (this.performanceBenchmarkFallbackActive) {
        this.handlePerformanceBenchmarkMessage({ type: 'complete', payload });
      }
    } catch (error) {
      if (!this.performanceBenchmarkFallbackActive || error?.message === 'cancelled') {
        this.updatePerformanceReadout('performanceCancelled');
      } else {
        this.handlePerformanceBenchmarkMessage({ type: 'error', message: error?.message || String(error) });
      }
    } finally {
      this.performanceBenchmarkFallbackActive = false;
      this.setPerformanceBenchmarkRunning(false);
    }
  }

  cancelPerformanceBenchmark(options = {}) {
    if (this.performanceBenchmarkWorker) {
      this.performanceBenchmarkWorker.terminate();
      this.performanceBenchmarkWorker = null;
    }
    this.performanceBenchmarkFallbackActive = false;
    this.setPerformanceBenchmarkRunning(false);
    if (!options.silent) this.updatePerformanceReadout('performanceCancelled');
  }

  handlePerformanceBenchmarkMessage(message = {}) {
    if (message.type === 'progress') {
      this.updatePerformanceReadout('performanceProgress', {
        done: message.completedRuns || 0,
        total: message.totalRuns || 0
      });
      return;
    }
    if (message.type === 'complete') {
      this.performanceBenchmarkWorker?.terminate();
      this.performanceBenchmarkWorker = null;
      this.performanceBenchmarkFallbackActive = false;
      this.performanceBenchmarkResult = message.payload;
      this.setPerformanceBenchmarkRunning(false);
      const summary = this.performanceBenchmarkResult?.summary || {};
      this.updatePerformanceReadout('performanceReadoutValue', {
        gps: formatNumber(summary.generationsPerSecond, 1),
        size: summary.boardSize || '-',
        dim: summary.dimension || '-',
        active: formatNumber(summary.activeCellCount, 0)
      });
      return;
    }
    if (message.type === 'error') {
      this.performanceBenchmarkWorker?.terminate();
      this.performanceBenchmarkWorker = null;
      this.performanceBenchmarkFallbackActive = false;
      this.setPerformanceBenchmarkRunning(false);
      this.updatePerformanceReadout('performanceError', { message: message.message || 'unknown error' });
    }
  }

  installPhaseScanner() {
    if (!this.phaseScanStartButton || !this.phaseScannerGrid) return;
    this.syncPhaseScannerOptions();
    this.phaseScanStartButton.addEventListener('click', () => this.startPhaseScan());
    this.phaseScanCancelButton?.addEventListener('click', () => this.cancelPhaseScan());
    this.phaseScanExportJsonButton?.addEventListener('click', () => this.exportPhaseScanJson());
    this.phaseScanExportCsvButton?.addEventListener('click', () => this.exportPhaseScanCsv());
    this.renderPhaseScannerGrid();
    this.setPhaseScannerRunning(false);
  }

  syncPhaseScannerOptions() {
    const setOptions = (select, options, fallback) => {
      if (!select) return;
      const previous = select.value || fallback;
      select.replaceChildren(...options.map(({ value, label }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
      }));
      select.value = options.some((option) => option.value === previous) ? previous : fallback;
    };

    setOptions(this.phaseScanGeometrySelect, [
      { value: 'open', label: t('phaseGeometryOpen', this.language) },
      { value: 'torus', label: t('phaseGeometryTorus', this.language) },
      { value: 'cylinder', label: t('phaseGeometryCylinder', this.language) },
      { value: 'mobius', label: t('phaseGeometryMobius', this.language) },
      { value: 'klein', label: t('phaseGeometryKlein', this.language) },
      { value: 'projective', label: t('phaseGeometryProjective', this.language) }
    ], 'open');
    setOptions(this.phaseScanLatticeSelect, [
      { value: 'square', label: t('squareLattice', this.language) },
      { value: 'triangular', label: t('triangularLattice', this.language) },
      { value: 'honeycomb', label: t('honeycombLattice', this.language) }
    ], 'square');
    setOptions(this.phaseScanNeighborhoodSelect, [
      { value: 'moore', label: t('phaseNeighborhoodMoore', this.language) },
      { value: 'von_neumann', label: t('phaseNeighborhoodVonNeumann', this.language) },
      { value: 'nearest', label: t('phaseNeighborhoodNearest', this.language) }
    ], 'moore');
  }

  readPhaseScanConfig() {
    return {
      boundary: this.phaseScanGeometrySelect?.value || 'open',
      lattice: this.phaseScanLatticeSelect?.value || 'square',
      neighborhood: this.phaseScanNeighborhoodSelect?.value || 'moore',
      boardSize: Number(this.phaseScanBoardSizeInput?.value || 32),
      seedDensity: Number(this.phaseScanDensityInput?.value || 0.22),
      seedsPerRule: Number(this.phaseScanSeedsInput?.value || 3),
      generations: Number(this.phaseScanGenerationsInput?.value || 80),
      birthSets: this.phaseScanBirthSetsInput?.value || '3;36;2;34',
      survivalSets: this.phaseScanSurvivalSetsInput?.value || '23;34;2;34678',
      baseSeed: 20260627
    };
  }

  setPhaseScannerRunning(running) {
    const controls = [
      this.phaseScanGeometrySelect,
      this.phaseScanLatticeSelect,
      this.phaseScanNeighborhoodSelect,
      this.phaseScanBoardSizeInput,
      this.phaseScanDensityInput,
      this.phaseScanSeedsInput,
      this.phaseScanGenerationsInput,
      this.phaseScanBirthSetsInput,
      this.phaseScanSurvivalSetsInput
    ];
    controls.forEach((control) => { if (control) control.disabled = Boolean(running); });
    if (this.phaseScanStartButton) this.phaseScanStartButton.disabled = Boolean(running);
    if (this.phaseScanCancelButton) this.phaseScanCancelButton.disabled = !running;
    const canExport = !running && Boolean(this.phaseScanResult);
    if (this.phaseScanExportJsonButton) this.phaseScanExportJsonButton.disabled = !canExport;
    if (this.phaseScanExportCsvButton) this.phaseScanExportCsvButton.disabled = !canExport;
  }

  updatePhaseScannerStatus(key, replacements = {}) {
    if (!this.phaseScannerStatus) return;
    this.phaseScannerStatus.textContent = this.uiText(key, replacements);
  }

  startPhaseScan() {
    if (!this.phaseScanStartButton) return;
    this.cancelPhaseScan({ silent: true });
    this.phaseScanResult = null;
    this.renderPhaseScannerGrid();
    this.updatePhaseScannerStatus('phaseScannerStarting');
    this.setPhaseScannerRunning(true);
    const config = this.readPhaseScanConfig();

    if (typeof window === 'undefined' || !window.Worker) {
      this.runPhaseScanFallback(config);
      return;
    }

    try {
      const worker = new Worker(new URL('./PhaseScannerWorker.js', import.meta.url), { type: 'module' });
      this.phaseScannerWorker = worker;
      worker.addEventListener('message', (event) => this.handlePhaseScannerMessage(event.data));
      worker.addEventListener('error', (event) => {
        this.handlePhaseScannerMessage({ type: 'error', message: event.message || 'Worker error' });
      });
      worker.postMessage({ type: 'scan', config });
    } catch (error) {
      this.phaseScannerWorker = null;
      this.runPhaseScanFallback(config, error);
    }
  }

  async runPhaseScanFallback(config, workerError = null) {
    this.phaseScanFallbackActive = true;
    this.updatePhaseScannerStatus(workerError ? 'phaseScannerFallbackAfterWorkerError' : 'phaseScannerFallback');
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      const { runPhaseScan } = await import('./LifeWorkerTasks.js');
      const payload = runPhaseScan(config, {
        onProgress: (progress) => this.handlePhaseScannerMessage({ type: 'progress', ...progress }),
        shouldCancel: () => !this.phaseScanFallbackActive
      });
      if (this.phaseScanFallbackActive) {
        this.handlePhaseScannerMessage({ type: 'complete', payload });
      }
    } catch (error) {
      if (!this.phaseScanFallbackActive || error?.message === 'cancelled') {
        this.updatePhaseScannerStatus('phaseScannerCancelled');
      } else {
        this.handlePhaseScannerMessage({ type: 'error', message: error?.message || String(error) });
      }
    } finally {
      this.phaseScanFallbackActive = false;
      this.setPhaseScannerRunning(false);
    }
  }

  cancelPhaseScan(options = {}) {
    if (this.phaseScannerWorker) {
      this.phaseScannerWorker.terminate();
      this.phaseScannerWorker = null;
    }
    this.phaseScanFallbackActive = false;
    this.setPhaseScannerRunning(false);
    if (!options.silent) this.updatePhaseScannerStatus('phaseScannerCancelled');
  }

  handlePhaseScannerMessage(message = {}) {
    if (message.type === 'progress') {
      this.updatePhaseScannerStatus('phaseScannerRunning', {
        done: message.completedRuns || 0,
        total: message.totalRuns || 0
      });
      return;
    }
    if (message.type === 'complete') {
      this.phaseScannerWorker?.terminate();
      this.phaseScannerWorker = null;
      this.phaseScanFallbackActive = false;
      this.phaseScanResult = message.payload;
      this.renderPhaseScannerGrid(this.phaseScanResult);
      const runs = (this.phaseScanResult?.results || []).reduce((sum, result) => sum + (result.runs?.length || 0), 0);
      this.setPhaseScannerRunning(false);
      this.updatePhaseScannerStatus('phaseScannerComplete', {
        rules: this.phaseScanResult?.results?.length || 0,
        runs
      });
      return;
    }
    if (message.type === 'error') {
      this.phaseScannerWorker?.terminate();
      this.phaseScannerWorker = null;
      this.phaseScanFallbackActive = false;
      this.setPhaseScannerRunning(false);
      this.updatePhaseScannerStatus('phaseScannerError', { message: message.message || 'unknown error' });
    }
  }

  phaseClassLabel(kind = 'active') {
    const key = {
      extinction: 'phaseClassExtinction',
      stable: 'phaseClassStable',
      oscillator: 'phaseClassOscillator',
      growing: 'phaseClassGrowing',
      active: 'phaseClassActive'
    }[kind] || 'phaseClassActive';
    return t(key, this.language);
  }

  renderPhaseScannerGrid(result = this.phaseScanResult) {
    if (!this.phaseScannerGrid) return;
    this.phaseScannerGrid.replaceChildren();
    if (!result) {
      const empty = document.createElement('p');
      empty.className = 'phase-scanner-empty';
      empty.textContent = t('phaseScannerNoResults', this.language);
      this.phaseScannerGrid.append(empty);
      return;
    }

    const birthSets = result.config?.birthSets || [];
    const survivalSets = result.config?.survivalSets || [];
    const byRule = new Map((result.results || []).map((entry) => [`${entry.birth}/${entry.survival}`, entry]));
    this.phaseScannerGrid.style.setProperty('--phase-columns', String(Math.max(1, birthSets.length)));

    const makeAxis = (text) => {
      const axis = document.createElement('div');
      axis.className = 'phase-scanner-axis';
      axis.textContent = text;
      return axis;
    };

    const header = document.createElement('div');
    header.className = 'phase-scanner-row phase-scanner-row-head';
    header.append(makeAxis('S \\ B'));
    birthSets.forEach((birth) => header.append(makeAxis(`B${birth || '-'}`)));
    this.phaseScannerGrid.append(header);

    survivalSets.forEach((survival) => {
      const row = document.createElement('div');
      row.className = 'phase-scanner-row';
      row.append(makeAxis(`S${survival || '-'}`));
      birthSets.forEach((birth) => {
        const entry = byRule.get(`${birth}/${survival}`);
        const cell = document.createElement('article');
        cell.className = 'phase-scanner-cell';
        cell.dataset.phaseClass = entry?.classification || 'active';
        if (!entry) {
          cell.textContent = '-';
        } else {
          const label = this.phaseClassLabel(entry.classification);
          const rule = document.createElement('strong');
          rule.textContent = entry.rule;
          const classification = document.createElement('span');
          classification.textContent = label;
          const density = document.createElement('small');
          density.textContent = `${t('phaseMeanDensity', this.language)} ${formatNumber(entry.meanFinalDensity, 3)}`;
          const counts = document.createElement('small');
          counts.textContent = Object.entries(entry.classCounts || {})
            .filter(([, count]) => count)
            .map(([kind, count]) => `${this.phaseClassLabel(kind)}:${count}`)
            .join(' ');
          cell.title = `${entry.rule}: ${label}`;
          cell.append(rule, classification, density, counts);
        }
        row.append(cell);
      });
      this.phaseScannerGrid.append(row);
    });
  }

  buildPhaseScanCsv() {
    if (!this.phaseScanResult) return '';
    const config = this.phaseScanResult.config || {};
    const columns = [
      'createdAt',
      'boundary',
      'lattice',
      'neighborhood',
      'boardSize',
      'seedDensity',
      'seedsPerRule',
      'generations',
      'rule',
      'birth',
      'survival',
      'classification',
      'extinction',
      'stable',
      'oscillator',
      'growing',
      'active',
      'meanFinalPopulation',
      'meanFinalDensity',
      'recurrencePeriods'
    ];
    const rows = (this.phaseScanResult.results || []).map((entry) => ({
      createdAt: this.phaseScanResult.createdAt,
      boundary: config.boundary,
      lattice: config.lattice,
      neighborhood: config.neighborhood,
      boardSize: config.boardSize,
      seedDensity: config.seedDensity,
      seedsPerRule: config.seedsPerRule,
      generations: config.generations,
      rule: entry.rule,
      birth: entry.birth,
      survival: entry.survival,
      classification: entry.classification,
      extinction: entry.classCounts?.extinction || 0,
      stable: entry.classCounts?.stable || 0,
      oscillator: entry.classCounts?.oscillator || 0,
      growing: entry.classCounts?.growing || 0,
      active: entry.classCounts?.active || 0,
      meanFinalPopulation: entry.meanFinalPopulation,
      meanFinalDensity: entry.meanFinalDensity,
      recurrencePeriods: entry.recurrencePeriods
    }));
    return [
      columns.join(','),
      ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(','))
    ].join('\n');
  }

  exportPhaseScanJson() {
    if (!this.phaseScanResult) return;
    const json = JSON.stringify(this.phaseScanResult, null, 2);
    if (this.patternJson) this.patternJson.value = json;
    downloadTextFile(`topoboard-life-phase-scan-${exportTimestamp()}.json`, json, 'application/json;charset=utf-8');
    this.updatePhaseScannerStatus('phaseScannerJsonExported');
  }

  exportPhaseScanCsv() {
    if (!this.phaseScanResult) return;
    const csv = this.buildPhaseScanCsv();
    if (this.patternJson) this.patternJson.value = csv;
    downloadTextFile(`topoboard-life-phase-scan-${exportTimestamp()}.csv`, csv, 'text/csv;charset=utf-8');
    this.updatePhaseScannerStatus('phaseScannerCsvExported');
  }

  installTopologyCompare() {
    if (!this.topologyCompareRunButton || !this.topologyCompareResults) return;
    this.syncTopologyCompareOptions();
    this.topologyCompareRunButton.addEventListener('click', () => this.runTopologyCompare());
    this.topologyCompareExportJsonButton?.addEventListener('click', () => this.exportTopologyCompareJson());
    [
      this.topologyCompareBoardSizeInput,
      this.topologyCompareDensityInput,
      this.topologyCompareSeedInput,
      this.topologyCompareGenerationsInput
    ].forEach((input) => input?.addEventListener('input', () => this.updateTopologyCompareRuleSummary()));
    this.updateTopologyCompareRuleSummary();
    this.renderTopologyCompareResults();
  }

  syncTopologyCompareOptions() {
    if (!this.topologyCompareGeometryList) return;
    this.topologyCompareGeometryList.replaceChildren();
    TOPOLOGY_COMPARE_GEOMETRY_IDS.forEach((geometryId) => {
      const geometry = findLifeGeometry(geometryId);
      const label = document.createElement('label');
      label.className = 'topology-compare-choice';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = geometry.id;
      input.checked = TOPOLOGY_COMPARE_DEFAULT_GEOMETRIES.includes(geometry.id);
      input.addEventListener('change', () => this.validateTopologyCompareSelection(input));
      const text = document.createElement('span');
      text.textContent = geometryTitle(geometry, this.language);
      label.append(input, text);
      this.topologyCompareGeometryList.append(label);
    });
  }

  selectedTopologyCompareGeometryIds() {
    if (!this.topologyCompareGeometryList) return [];
    return [...this.topologyCompareGeometryList.querySelectorAll('input[type="checkbox"]:checked')]
      .map((input) => input.value)
      .slice(0, 4);
  }

  validateTopologyCompareSelection(changedInput = null) {
    const checked = [...(this.topologyCompareGeometryList?.querySelectorAll('input[type="checkbox"]:checked') || [])];
    if (checked.length > 4 && changedInput) {
      changedInput.checked = false;
      this.updateTopologyCompareStatus('topologyCompareTooMany');
      return false;
    }
    this.updateTopologyCompareRuleSummary();
    return checked.length >= 2 && checked.length <= 4;
  }

  updateTopologyCompareStatus(key, replacements = {}) {
    if (!this.topologyCompareStatus) return;
    this.topologyCompareStatus.textContent = this.uiText(key, replacements);
  }

  topologyCompareLattice() {
    const lattice = this.latticeSelect?.value || 'square';
    return ['square', 'triangular', 'honeycomb'].includes(lattice) ? lattice : 'square';
  }

  topologyCompareRuleConfig(lattice = this.topologyCompareLattice()) {
    const neighborhood = this.resolveNeighborhoodControls({ applyFallback: false });
    const speciesCount = Math.max(1, Number(this.speciesSelect?.value) || 1);
    let rule = tuneRuleForLattice(getRulePreset(this.ruleSelect?.value || 'conway'), lattice, 2);
    if (this.customRuleActive) {
      const birth = normalizeRuleCounts(this.customRuleBirth);
      const survival = normalizeRuleCounts(this.customRuleSurvival);
      rule = {
        ...rule,
        id: 'custom',
        label: 'Custom Life',
        type: 'life-like',
        rule: serializeLifeBSRule({ birth, survival }),
        birth,
        survival,
        neighborhoodType: neighborhood.type || rule.neighborhoodType || 'moore',
        latticeNeighborCount: this.maxNeighborCount()
      };
    }
    return {
      ...rule,
      speciesCount,
      birthNoise: Number(this.birthNoiseRange?.value) || 0,
      deathNoise: Number(this.deathNoiseRange?.value) || 0,
      environmentNoise: Number(this.environmentNoiseRange?.value) || 0,
      ruleNoise: Number(this.ruleNoiseRange?.value) || 0,
      topologyDefectNoise: Number(this.topologyDefectNoiseRange?.value) || 0,
      mutationRate: Number(this.mutationRange?.value) || 0,
      maxAge: Number(this.ageRange?.value) || undefined,
      agingDeathRate: Number(this.agingDeathRateRange?.value) || 0,
      youngBirthBonus: Number(this.youngBirthBonusRange?.value) || 0,
      oldAgePenalty: Number(this.oldAgePenaltyRange?.value) || 0
    };
  }

  updateTopologyCompareRuleSummary() {
    if (!this.topologyCompareRuleSummary) return;
    const lattice = this.topologyCompareLattice();
    const latticeOption = latticesForGeometry('r2').find((item) => item.id === lattice) || { title: lattice, zhTitle: lattice };
    const rule = this.topologyCompareRuleConfig(lattice);
    const neighborhoodLabel = this.neighborhoodSelect?.selectedOptions?.[0]?.textContent || this.neighborhoodSelect?.value || 'moore';
    this.topologyCompareRuleSummary.textContent = this.uiText('topologyCompareRuleSummary', {
      rule: rule.rule || rule.label || rule.id,
      neighborhood: neighborhoodLabel,
      lattice: latticeTitle(latticeOption, this.language)
    });
  }

  readTopologyCompareConfig() {
    const boardSize = Math.round(Math.max(12, Math.min(80, Number(this.topologyCompareBoardSizeInput?.value) || 32)));
    const generations = Math.round(Math.max(5, Math.min(300, Number(this.topologyCompareGenerationsInput?.value) || 80)));
    const seedDensity = Math.max(0.01, Math.min(0.8, Number(this.topologyCompareDensityInput?.value) || 0.22));
    const seed = Math.max(1, Math.round(Number(this.topologyCompareSeedInput?.value) || 20260627));
    const lattice = this.topologyCompareLattice();
    const neighborhood = this.resolveNeighborhoodControls({ applyFallback: false });
    return {
      geometryIds: this.selectedTopologyCompareGeometryIds(),
      boardSize,
      seedDensity,
      seed,
      generations,
      lattice,
      neighborhoodType: neighborhood.type || this.neighborhoodSelect?.value || 'moore',
      neighborhoodRadius: neighborhood.radius || 1,
      neighborhoodMetric: neighborhood.metric || this.neighborhoodMetricFromType(this.neighborhoodSelect?.value),
      rule: this.topologyCompareRuleConfig(lattice)
    };
  }

  runTopologyCompare() {
    const config = this.readTopologyCompareConfig();
    if (config.geometryIds.length < 2 || config.geometryIds.length > 4) {
      this.updateTopologyCompareStatus('topologyCompareSelectRange');
      return;
    }
    this.updateTopologyCompareStatus('topologyCompareRunning');
    this.topologyCompareResult = {
      schema: 'topoboard-life-topology-compare',
      version: 1,
      createdAt: new Date().toISOString(),
      config: {
        ...config,
        rule: {
          id: config.rule.id || 'custom',
          label: config.rule.label || config.rule.name || config.rule.rule || 'Life rule',
          rule: config.rule.rule || null,
          birth: Array.isArray(config.rule.birth) ? [...config.rule.birth] : [],
          survival: Array.isArray(config.rule.survival) ? [...config.rule.survival] : [],
          speciesCount: config.rule.speciesCount || 1
        }
      },
      results: config.geometryIds.map((geometryId) => this.runTopologyComparisonForGeometry(geometryId, config))
    };
    this.renderTopologyCompareResults(this.topologyCompareResult);
    if (this.topologyCompareExportJsonButton) this.topologyCompareExportJsonButton.disabled = false;
    this.updateTopologyCompareStatus('topologyCompareComplete', { count: this.topologyCompareResult.results.length });
  }

  runTopologyComparisonForGeometry(geometryId, config) {
    const geometry = findLifeGeometry(geometryId);
    const engine = createLifeEngine({
      dimension: 2,
      size: [config.boardSize, config.boardSize],
      boundary: geometry.topology,
      lattice: config.lattice,
      neighborhoodType: config.neighborhoodType,
      neighborhoodRadius: config.neighborhoodRadius,
      neighborhoodMetric: config.neighborhoodMetric,
      rule: config.rule,
      rng: createDeterministicRng(config.seed)
    });
    engine.randomSeed({
      density: config.seedDensity,
      speciesCount: config.rule.speciesCount || 1,
      resetGeneration: true
    });

    const seen = new Map();
    const samples = [];
    let extinctionTime = null;
    let oscillationPeriod = null;

    for (let generation = 0; generation <= config.generations; generation += 1) {
      const hash = hashAliveCells(engine);
      const observables = engine.getObservables();
      if (observables.population === 0 && extinctionTime == null) extinctionTime = generation;
      if (hash && seen.has(hash) && oscillationPeriod == null) oscillationPeriod = generation - seen.get(hash);
      if (hash && !seen.has(hash)) seen.set(hash, generation);
      samples.push({
        generation,
        population: observables.population,
        entropy: observables.entropy,
        largestClusterSize: observables.largestClusterSize
      });
      if (generation < config.generations) engine.step();
    }

    const finalObservables = engine.getObservables();
    finalObservables.oscillationPeriod = oscillationPeriod;
    finalObservables.extinctionTime = extinctionTime;
    finalObservables.survivalTime = extinctionTime ?? config.generations;
    const status = finalObservables.population > 0 ? 'survival' : 'extinction';

    return {
      geometryId: geometry.id,
      geometryTitle: geometryTitle(geometry, this.language),
      topology: geometry.topology,
      status,
      finalPopulation: finalObservables.population,
      survivalTime: finalObservables.survivalTime,
      oscillationPeriod,
      entropy: finalObservables.entropy,
      largestClusterSize: finalObservables.largestClusterSize,
      finalDensity: finalObservables.density,
      finalObservables,
      samples,
      preview: this.snapshotAliveCells(engine)
    };
  }

  snapshotAliveCells(engine) {
    const cells = [];
    for (let i = 0; i < engine.cells.length; i += 1) {
      const cell = engine.cells[i];
      if (!isAlive(cell)) continue;
      const [x = 0, y = 0] = engine.positionFromIndex(i);
      cells.push({ x, y, species: cell.species || 1 });
    }
    return {
      dimension: engine.dimension,
      size: engine.size.slice(),
      cells
    };
  }

  renderTopologyCompareResults(result = this.topologyCompareResult) {
    if (!this.topologyCompareResults) return;
    this.topologyCompareResults.replaceChildren();
    if (!result) {
      const empty = document.createElement('p');
      empty.className = 'topology-compare-empty';
      empty.textContent = t('topologyCompareNoResults', this.language);
      this.topologyCompareResults.append(empty);
      if (this.topologyCompareExportJsonButton) this.topologyCompareExportJsonButton.disabled = true;
      return;
    }

    result.results.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'topology-compare-card';
      card.dataset.compareStatus = entry.status;

      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 140;

      const title = document.createElement('h4');
      title.textContent = entry.geometryTitle;
      const state = document.createElement('strong');
      state.textContent = t(entry.status === 'survival' ? 'topologyCompareSurvival' : 'topologyCompareExtinction', this.language);

      const metrics = document.createElement('dl');
      [
        ['population', entry.finalPopulation],
        ['survivalTime', entry.survivalTime],
        ['oscillation', entry.oscillationPeriod ? `P=${entry.oscillationPeriod}` : t('notYet', this.language)],
        ['entropy', formatNumber(entry.entropy)],
        ['largestCluster', entry.largestClusterSize]
      ].forEach(([key, value]) => {
        const dt = document.createElement('dt');
        dt.textContent = t(key, this.language);
        const dd = document.createElement('dd');
        dd.textContent = String(value);
        metrics.append(dt, dd);
      });

      card.append(canvas, title, state, metrics);
      this.topologyCompareResults.append(card);
      this.drawTopologyComparePreview(canvas, entry.preview);
    });
  }

  drawTopologyComparePreview(canvas, preview = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(3, 8, 14, 0.88)';
    ctx.fillRect(0, 0, width, height);
    const [sx = 1, sy = 1] = preview.size || [1, 1];
    const scale = Math.min(width / sx, height / sy);
    const offsetX = (width - sx * scale) / 2;
    const offsetY = (height - sy * scale) / 2;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= sx; x += Math.max(1, Math.ceil(sx / 12))) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x * scale, offsetY);
      ctx.lineTo(offsetX + x * scale, offsetY + sy * scale);
      ctx.stroke();
    }
    for (let y = 0; y <= sy; y += Math.max(1, Math.ceil(sy / 12))) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y * scale);
      ctx.lineTo(offsetX + sx * scale, offsetY + y * scale);
      ctx.stroke();
    }
    for (const cell of preview.cells || []) {
      ctx.fillStyle = COLORS[cell.species] || COLORS[1];
      ctx.fillRect(
        offsetX + cell.x * scale,
        offsetY + cell.y * scale,
        Math.max(1, scale * 0.82),
        Math.max(1, scale * 0.82)
      );
    }
  }

  exportTopologyCompareJson() {
    if (!this.topologyCompareResult) return;
    const json = JSON.stringify(this.topologyCompareResult, null, 2);
    if (this.patternJson) this.patternJson.value = json;
    downloadTextFile(`topoboard-life-topology-compare-${exportTimestamp()}.json`, json, 'application/json;charset=utf-8');
    this.updateTopologyCompareStatus('topologyCompareJsonExported');
  }

  installExperimentNotebook() {
    if (!this.experimentNotebookSaveButton || !this.experimentNotebookSelect) return;
    this.experimentNotebookEntries = this.readExperimentNotebookEntries();
    if (this.experimentNotebookTitleInput && !this.experimentNotebookTitleInput.value) {
      this.experimentNotebookTitleInput.value = modeTitle(this.mode, this.language);
    }
    this.experimentNotebookSaveButton.addEventListener('click', () => this.saveCurrentExperimentNotebookEntry());
    this.experimentNotebookLoadButton?.addEventListener('click', () => this.loadSelectedExperimentNotebookEntry());
    this.experimentNotebookDuplicateButton?.addEventListener('click', () => this.duplicateSelectedExperimentNotebookEntry());
    this.experimentNotebookDeleteButton?.addEventListener('click', () => this.deleteSelectedExperimentNotebookEntry());
    this.experimentNotebookExportButton?.addEventListener('click', () => this.exportExperimentNotebookJson());
    this.experimentNotebookImportButton?.addEventListener('click', () => this.importExperimentNotebookJson());
    this.experimentNotebookSelect.addEventListener('change', () => this.renderExperimentNotebookSummary());
    this.renderExperimentNotebookEntries();
  }

  experimentNotebookId() {
    return `life-exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  readExperimentNotebookEntries() {
    try {
      const raw = localStorage.getItem(EXPERIMENT_NOTEBOOK_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry === 'object') : [];
    } catch {
      return [];
    }
  }

  writeExperimentNotebookEntries(entries = this.experimentNotebookEntries) {
    this.experimentNotebookEntries = entries.slice(0, 80);
    try {
      localStorage.setItem(EXPERIMENT_NOTEBOOK_STORAGE_KEY, JSON.stringify(this.experimentNotebookEntries));
      return true;
    } catch {
      this.updateExperimentNotebookStatus('experimentNotebookStorageError');
      return false;
    }
  }

  updateExperimentNotebookStatus(key, replacements = {}) {
    if (!this.experimentNotebookStatus) return;
    this.experimentNotebookStatus.textContent = this.uiText(key, replacements);
  }

  selectedExperimentNotebookEntry() {
    const id = this.experimentNotebookSelect?.value;
    return this.experimentNotebookEntries.find((entry) => entry.id === id) || null;
  }

  currentNotebookRandomSeed() {
    return Math.max(1, Math.round(Number(this.topologyCompareSeedInput?.value) || 20260627));
  }

  currentNotebookSeedDensity() {
    return Math.max(0.01, Math.min(0.8, Number(this.topologyCompareDensityInput?.value) || 0.18));
  }

  currentNotebookRuleSummary() {
    const metadata = this.engine.getExperimentMetadata();
    return {
      ...metadata.rule,
      selectedPreset: this.ruleSelect?.value || 'conway',
      custom: Boolean(this.customRuleActive),
      ruleString: metadata.rule?.ruleString || this.engine.rule?.rule || null,
      birth: Array.isArray(this.engine.rule?.birth) ? [...this.engine.rule.birth] : metadata.rule?.birth || [],
      survival: Array.isArray(this.engine.rule?.survival) ? [...this.engine.rule.survival] : metadata.rule?.survival || []
    };
  }

  currentNotebookFinalMetrics() {
    const sample = this.currentObservableSample();
    return {
      generation: sample.generation || this.engine.generation || 0,
      population: sample.population || 0,
      density: sample.density || 0,
      birthRate: sample.birthRate || 0,
      deathRate: sample.deathRate || 0,
      speciesFractions: structuredClone(sample.speciesFractions || {}),
      meanAge: sample.meanAge || 0,
      clusterCount: sample.clusterCount || 0,
      largestClusterSize: sample.largestClusterSize || 0,
      entropy: sample.entropy || 0,
      spatialCorrelation: sample.spatialCorrelation || 0,
      survivalTime: sample.survivalTime || sample.generation || 0,
      extinctionTime: sample.extinctionTime ?? this.extinctionTime,
      oscillationPeriod: sample.oscillationPeriod || sample.recurrenceHashPeriodEstimate || null,
      frontVelocity: sample.frontVelocity || 0,
      detectedStructures: structuredClone(sample.detectedStructures || null)
    };
  }

  buildExperimentNotebookEntry(overrides = {}) {
    const metadata = this.engine.getExperimentMetadata();
    const geometry = findLifeGeometry(this.boardGeometrySelect?.value);
    const neighborhood = metadata.neighborhood || {};
    const title = (this.experimentNotebookTitleInput?.value || '').trim()
      || modeTitle(this.mode, this.language)
      || t('lifeWorld', this.language);
    return {
      id: overrides.id || this.experimentNotebookId(),
      title: overrides.title || title,
      timestamp: overrides.timestamp || new Date().toISOString(),
      rule: this.currentNotebookRuleSummary(),
      geometry: {
        id: geometry.id,
        title: geometryTitle(geometry, this.language)
      },
      topology: metadata.topology?.topologyType || this.topologySelect?.value || geometry.topology,
      lattice: metadata.topology?.latticeType || this.latticeSelect?.value || 'square',
      neighborhood: {
        type: neighborhood.type || this.neighborhoodSelect?.value || 'moore',
        radius: neighborhood.radius || Number(this.neighborhoodRadiusSelect?.value) || 1,
        metric: neighborhood.metric || this.neighborhoodMetricSelect?.value || this.neighborhoodMetricFromType(),
        neighborCount: neighborhood.neighborCount || 0
      },
      dimension: metadata.topology?.dimension || this.engine.dimension,
      boardSize: metadata.topology?.size || this.engine.size.slice(),
      modifiers: {
        birthNoise: Number(this.birthNoiseRange?.value) || 0,
        deathNoise: Number(this.deathNoiseRange?.value) || 0,
        environmentNoise: Number(this.environmentNoiseRange?.value) || 0,
        ruleNoise: Number(this.ruleNoiseRange?.value) || 0,
        topologyDefectNoise: Number(this.topologyDefectNoiseRange?.value) || 0,
        mutationRate: Number(this.mutationRange?.value) || 0,
        maxAge: Number(this.ageRange?.value) || 0,
        agingDeathRate: Number(this.agingDeathRateRange?.value) || 0,
        youngBirthBonus: Number(this.youngBirthBonusRange?.value) || 0,
        oldAgePenalty: Number(this.oldAgePenaltyRange?.value) || 0,
        maxGenerations: Number(this.maxGenerationInput?.value) || 0
      },
      randomSeed: this.currentNotebookRandomSeed(),
      seedDensity: this.currentNotebookSeedDensity(),
      finalMetrics: this.currentNotebookFinalMetrics(),
      mode: {
        id: this.mode.id,
        title: modeTitle(this.mode, this.language),
        usage: this.usageModeSelect?.value || 'zero'
      },
      duplicateOf: overrides.duplicateOf || null
    };
  }

  saveCurrentExperimentNotebookEntry() {
    const entry = this.buildExperimentNotebookEntry();
    const entries = [entry, ...this.experimentNotebookEntries.filter((item) => item.id !== entry.id)];
    if (!this.writeExperimentNotebookEntries(entries)) return;
    this.renderExperimentNotebookEntries(entry.id);
    this.updateExperimentNotebookStatus('experimentNotebookSaved', { title: entry.title });
  }

  normalizeImportedNotebookEntry(entry = {}) {
    const normalized = {
      ...entry,
      id: String(entry.id || this.experimentNotebookId()),
      title: String(entry.title || t('experimentNotebookUntitled', this.language)),
      timestamp: entry.timestamp || new Date().toISOString(),
      rule: entry.rule && typeof entry.rule === 'object' ? entry.rule : {},
      geometry: entry.geometry && typeof entry.geometry === 'object' ? entry.geometry : { id: 'r2' },
      topology: String(entry.topology || entry.geometry?.topology || 'open'),
      lattice: String(entry.lattice || 'square'),
      neighborhood: entry.neighborhood && typeof entry.neighborhood === 'object' ? entry.neighborhood : { type: 'moore', radius: 1, metric: 'chebyshev' },
      dimension: Math.max(1, Math.min(4, Number(entry.dimension) || 2)),
      boardSize: Array.isArray(entry.boardSize) ? entry.boardSize.map(Number).filter(Boolean) : [Number(entry.boardSize) || 32],
      modifiers: entry.modifiers && typeof entry.modifiers === 'object' ? entry.modifiers : {},
      randomSeed: Math.max(1, Math.round(Number(entry.randomSeed) || 20260627)),
      seedDensity: Math.max(0.01, Math.min(0.8, Number(entry.seedDensity) || 0.18)),
      finalMetrics: entry.finalMetrics && typeof entry.finalMetrics === 'object' ? entry.finalMetrics : {}
    };
    return normalized;
  }

  duplicateSelectedExperimentNotebookEntry() {
    const source = this.selectedExperimentNotebookEntry() || this.buildExperimentNotebookEntry();
    const duplicate = {
      ...structuredClone(source),
      id: this.experimentNotebookId(),
      title: this.uiText('experimentNotebookCopyTitle', { title: source.title || t('experimentNotebookUntitled', this.language) }),
      timestamp: new Date().toISOString(),
      duplicateOf: source.id || null
    };
    if (!this.writeExperimentNotebookEntries([duplicate, ...this.experimentNotebookEntries])) return;
    this.renderExperimentNotebookEntries(duplicate.id);
    this.updateExperimentNotebookStatus('experimentNotebookDuplicated', { title: duplicate.title });
  }

  deleteSelectedExperimentNotebookEntry() {
    const entry = this.selectedExperimentNotebookEntry();
    if (!entry) {
      this.updateExperimentNotebookStatus('experimentNotebookNoSelection');
      return;
    }
    const entries = this.experimentNotebookEntries.filter((item) => item.id !== entry.id);
    if (!this.writeExperimentNotebookEntries(entries)) return;
    this.renderExperimentNotebookEntries();
    this.updateExperimentNotebookStatus('experimentNotebookDeleted', { title: entry.title });
  }

  loadSelectedExperimentNotebookEntry() {
    const entry = this.selectedExperimentNotebookEntry();
    if (!entry) {
      this.updateExperimentNotebookStatus('experimentNotebookNoSelection');
      return;
    }
    const geometry = findLifeGeometry(entry.geometry?.id || 'r2');
    this.boardGeometrySelect.value = geometry.id;
    this.syncBoundaryControlsForGeometry(geometry, entry.topology || legacyGeometryBoundary(entry.geometry?.id, geometry.topology));
    this.populateLattices(geometry.id, entry.lattice || (geometry.dimension === 3 ? 'sc' : 'square'));
    this.dimensionSelect.value = String(entry.dimension || geometry.dimension);
    this.boardSizeSelect.value = String(Array.isArray(entry.boardSize) ? entry.boardSize[0] : entry.boardSize || 32);
    this.topologySelect.value = entry.topology || geometry.topology;
    this.viewModeSelect.value = geometry.view;
    if (this.latticeSelect.querySelector(`option[value="${entry.lattice}"]`)) this.latticeSelect.value = entry.lattice;

    const rule = entry.rule || {};
    const presetId = rule.selectedPreset || rule.id || 'conway';
    if (presetId !== 'custom' && this.ruleSelect.querySelector(`option[value="${presetId}"]`)) {
      this.ruleSelect.value = presetId;
      this.customRuleActive = false;
      this.syncCustomRuleDesignerFromRule(getRulePreset(presetId));
    } else {
      this.customRuleActive = true;
      this.customRuleBirth = normalizeRuleCounts(rule.birth || []);
      this.customRuleSurvival = normalizeRuleCounts(rule.survival || []);
      if (this.birthCountsInput) this.birthCountsInput.value = formatRuleCounts(this.customRuleBirth);
      if (this.survivalCountsInput) this.survivalCountsInput.value = formatRuleCounts(this.customRuleSurvival);
      this.updateCustomRulePreview({ clearMessage: true });
    }

    if (this.neighborhoodSelect.querySelector(`option[value="${entry.neighborhood?.type}"]`)) {
      this.neighborhoodSelect.value = entry.neighborhood.type;
    }
    if (this.neighborhoodRadiusSelect) this.neighborhoodRadiusSelect.value = String(entry.neighborhood?.radius || 1);
    if (this.neighborhoodMetricSelect) this.neighborhoodMetricSelect.value = entry.neighborhood?.metric || this.neighborhoodMetricFromType(entry.neighborhood?.type);

    const modifiers = entry.modifiers || {};
    if (this.birthNoiseRange) this.birthNoiseRange.value = String(modifiers.birthNoise || 0);
    if (this.deathNoiseRange) this.deathNoiseRange.value = String(modifiers.deathNoise || 0);
    if (this.environmentNoiseRange) this.environmentNoiseRange.value = String(modifiers.environmentNoise || 0);
    if (this.ruleNoiseRange) this.ruleNoiseRange.value = String(modifiers.ruleNoise || 0);
    if (this.topologyDefectNoiseRange) this.topologyDefectNoiseRange.value = String(modifiers.topologyDefectNoise || 0);
    if (this.mutationRange) this.mutationRange.value = String(modifiers.mutationRate || 0);
    if (this.ageRange) this.ageRange.value = String(modifiers.maxAge || 0);
    if (this.agingDeathRateRange) this.agingDeathRateRange.value = String(modifiers.agingDeathRate || 0);
    if (this.youngBirthBonusRange) this.youngBirthBonusRange.value = String(modifiers.youngBirthBonus || 0);
    if (this.oldAgePenaltyRange) this.oldAgePenaltyRange.value = String(modifiers.oldAgePenalty ?? 0);
    if (this.maxGenerationInput) this.maxGenerationInput.value = String(modifiers.maxGenerations || 0);
    if (this.topologyCompareSeedInput) this.topologyCompareSeedInput.value = String(entry.randomSeed || 20260627);
    if (this.topologyCompareDensityInput) this.topologyCompareDensityInput.value = String(entry.seedDensity || 0.18);

    this.syncRangeValueReadouts();
    this.applyControls(false);
    this.engine.configure({ rng: createDeterministicRng(entry.randomSeed || 20260627) });
    this.engine.randomSeed({
      density: entry.seedDensity || 0.18,
      speciesCount: entry.rule?.speciesCount || this.engine.rule?.speciesCount || 1,
      resetGeneration: true
    });
    this.history = [];
    this.stateHashes = new Map();
    this.extinctionTime = null;
    this.initialCenter = null;
    this.afterStateChange();
    this.updateExperimentNotebookStatus('experimentNotebookLoaded', { title: entry.title });
  }

  renderExperimentNotebookEntries(selectedId = this.experimentNotebookSelect?.value) {
    if (!this.experimentNotebookSelect) return;
    const entries = [...this.experimentNotebookEntries].sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
    this.experimentNotebookSelect.replaceChildren();
    if (!entries.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = t('experimentNotebookEmpty', this.language);
      this.experimentNotebookSelect.append(option);
    } else {
      entries.forEach((entry) => {
        const option = document.createElement('option');
        option.value = entry.id;
        option.textContent = `${entry.title || t('experimentNotebookUntitled', this.language)} - ${new Date(entry.timestamp || Date.now()).toLocaleString(this.language === 'zh' ? 'zh-TW' : 'en-US')}`;
        this.experimentNotebookSelect.append(option);
      });
      this.experimentNotebookSelect.value = entries.some((entry) => entry.id === selectedId) ? selectedId : entries[0].id;
    }
    const hasEntries = Boolean(entries.length);
    [this.experimentNotebookLoadButton, this.experimentNotebookDuplicateButton, this.experimentNotebookDeleteButton].forEach((button) => {
      if (button) button.disabled = !hasEntries;
    });
    this.renderExperimentNotebookSummary();
  }

  renderExperimentNotebookSummary() {
    if (!this.experimentNotebookSummary) return;
    this.experimentNotebookSummary.replaceChildren();
    const entry = this.selectedExperimentNotebookEntry();
    if (!entry) {
      const empty = document.createElement('p');
      empty.textContent = t('experimentNotebookNoSaved', this.language);
      this.experimentNotebookSummary.append(empty);
      return;
    }
    const metrics = entry.finalMetrics || {};
    const fields = [
      ['experimentNotebookSavedAt', new Date(entry.timestamp || Date.now()).toLocaleString(this.language === 'zh' ? 'zh-TW' : 'en-US')],
      ['ruleString', entry.rule?.ruleString || entry.rule?.rule || entry.rule?.name || entry.rule?.id || 'Life'],
      ['boardGeometry', entry.geometry?.title || entry.geometry?.id || '-'],
      ['topology', entry.topology || '-'],
      ['lattice', entry.lattice || '-'],
      ['neighborhood', entry.neighborhood?.type || '-'],
      ['population', metrics.population ?? '-'],
      ['entropy', formatNumber(metrics.entropy)],
      ['largestCluster', metrics.largestClusterSize ?? '-']
    ];
    fields.forEach(([key, value]) => {
      const item = document.createElement('div');
      const label = document.createElement('span');
      label.textContent = t(key, this.language);
      const data = document.createElement('strong');
      data.textContent = String(value);
      item.append(label, data);
      this.experimentNotebookSummary.append(item);
    });
  }

  exportExperimentNotebookJson() {
    const payload = {
      schema: 'topoboard-life-experiment-notebook',
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: this.experimentNotebookEntries
    };
    const json = JSON.stringify(payload, null, 2);
    if (this.experimentNotebookJson) this.experimentNotebookJson.value = json;
    downloadTextFile(`topoboard-life-notebook-${exportTimestamp()}.json`, json, 'application/json;charset=utf-8');
    this.updateExperimentNotebookStatus('experimentNotebookExported', { count: this.experimentNotebookEntries.length });
  }

  importExperimentNotebookJson() {
    try {
      const text = this.experimentNotebookJson?.value || this.patternJson?.value || '';
      const payload = JSON.parse(text);
      const imported = Array.isArray(payload) ? payload : payload.entries;
      if (!Array.isArray(imported)) throw new Error(t('experimentNotebookImportShapeError', this.language));
      const existingIds = new Set(this.experimentNotebookEntries.map((entry) => entry.id));
      const normalized = imported.map((entry) => {
        const next = this.normalizeImportedNotebookEntry(entry);
        if (existingIds.has(next.id)) next.id = this.experimentNotebookId();
        existingIds.add(next.id);
        return next;
      });
      if (!this.writeExperimentNotebookEntries([...normalized, ...this.experimentNotebookEntries])) return;
      this.renderExperimentNotebookEntries(normalized[0]?.id);
      this.updateExperimentNotebookStatus('experimentNotebookImported', { count: normalized.length });
    } catch (error) {
      this.updateExperimentNotebookStatus('experimentNotebookImportError', { message: error?.message || String(error) });
    }
  }

  currentObservableSample() {
    return this.history.length ? this.history[this.history.length - 1] : this.engine.getObservables();
  }

  buildTimeSeriesCsv() {
    const rows = this.history.length ? this.history : [this.currentObservableSample()];
    const columns = [
      'generation',
      'population',
      'density',
      'populationGrowthRate',
      'births',
      'deaths',
      'birthRate',
      'deathRate',
      'speciesCounts',
      'speciesFractions',
      'meanAge',
      'ageDistribution',
      'clusterCount',
      'largestClusterSize',
      'connectedComponentSizeDistribution',
      'entropy',
      'spatialCorrelation',
      'speciesSpatialCorrelation',
      'centerOfMass',
      'radiusOfActivity',
      'boundingBox',
      'boundingBoxMeasure',
      'recurrenceHashPeriodEstimate',
      'oscillationPeriod',
      'frontVelocity',
      'compressionRatioProxy',
      'extinctionTime',
      'survivalTime',
      'stateHash',
      'shapeHash2D',
      'shapeBox2D',
      'detectedStructures'
    ];
    return [
      columns.join(','),
      ...rows.map((row) => columns.map((column) => csvEscape(row?.[column])).join(','))
    ].join('\n');
  }

  buildExperimentExportPayload() {
    const metadata = this.engine.getExperimentMetadata();
    return {
      schema: 'topoboard-life-world-experiment',
      version: 3,
      exportedAt: new Date().toISOString(),
      module: 'life/world',
      mode: {
        id: this.mode.id,
        title: modeTitle(this.mode, this.language),
        usage: this.usageModeSelect.value,
        twoPlayerMode: this.twoPlayerModeSelect.value,
        challengeGoal: this.challengeGoalSelect.value
      },
      controls: this.readControlValues(),
      metadata,
      currentObservables: this.currentObservableSample(),
      observableTimeSeries: this.history.map((item) => structuredClone(item)),
      experiment: {
        generation: this.engine.generation,
        historyLength: this.history.length,
        extinctionTime: this.extinctionTime,
        initialCenter: this.initialCenter,
        stateHashesTracked: this.stateHashes.size
      },
      state: this.engine.exportState()
    };
  }

  exportTimeSeriesCsv() {
    const csv = this.buildTimeSeriesCsv();
    this.patternJson.value = csv;
    downloadTextFile(`topoboard-life-timeseries-${exportTimestamp()}.csv`, csv, 'text/csv;charset=utf-8');
    this.challengeStatus.textContent = `${t('status', this.language)}: ${t('timeSeriesCsvExported', this.language)}`;
  }

  exportExperimentJson() {
    const payload = this.buildExperimentExportPayload();
    const json = JSON.stringify(payload, null, 2);
    this.patternJson.value = json;
    downloadTextFile(`topoboard-life-experiment-${exportTimestamp()}.json`, json, 'application/json;charset=utf-8');
    this.challengeStatus.textContent = `${t('status', this.language)}: ${t('experimentJsonExported', this.language)}`;
  }

  exportPattern() {
    const customRule = this.customRuleActive
      ? { rule: serializeLifeBSRule({ birth: this.customRuleBirth, survival: this.customRuleSurvival }), birth: this.customRuleBirth, survival: this.customRuleSurvival }
      : null;
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      mode: this.mode.id,
      geometry: this.boardGeometrySelect.value,
      lattice: this.latticeSelect.value,
      viewMode: this.viewModeSelect.value,
      usage: this.usageModeSelect.value,
      twoPlayerMode: this.twoPlayerModeSelect.value,
      challengeGoal: this.challengeGoalSelect.value,
      customRule,
      metadata: this.engine.getExperimentMetadata(),
      observables: {
        current: this.currentObservableSample(),
        historyLength: this.history.length
      },
      state: this.engine.exportState()
    };
    this.patternJson.value = JSON.stringify(payload, null, 2);
  }

  importPattern() {
    try {
      const payload = JSON.parse(this.patternJson.value); const state = payload.state || payload;
      const importedRule = structuredClone(state.rule || {});
      this.engine.importState(state);
      this.dimensionSelect.value = String(this.engine.dimension); this.boardSizeSelect.value = String(this.engine.size[0]); this.topologySelect.value = this.engine.topology.boundary; this.neighborhoodSelect.value = this.engine.neighborhoodType; this.neighborhoodRadiusSelect.value = String(this.engine.neighborhoodRadius || 1); this.neighborhoodMetricSelect.value = this.engine.neighborhoodMetric || this.neighborhoodMetricFromType(this.engine.neighborhoodType); this.latticeSelect.value = this.engine.lattice || this.latticeSelect.value;
      if (payload.geometry) {
        const geometry = findLifeGeometry(payload.geometry === 'klein' && payload.viewMode === 'surface3d' ? 'klein_surface' : payload.geometry);
        this.boardGeometrySelect.value = geometry.id;
        this.applyGeometrySelection();
        if (geometry.id === 'r3') {
          const boundary = state.boundary || legacyGeometryBoundary(payload.geometry, geometry.topology);
          this.syncBoundaryControlsForGeometry(geometry, boundary);
          this.topologySelect.value = boundary;
          this.engine.configure({ boundary });
          this.updateGeometryInfoCard();
        }
      } else if (payload.viewMode) this.viewModeSelect.value = payload.viewMode;
      if (payload.mode) { this.mode = findLifeMode(payload.mode); this.modeSelect.value = this.mode.id; this.title.textContent = modeTitle(this.mode, this.language); this.description.textContent = modeLong(this.mode, this.language); this.tags.textContent = modeTags(this.mode, this.language).join(' · '); }
      const customRule = payload.customRule || (importedRule?.id === 'custom' ? importedRule : null);
      if (customRule?.birth || customRule?.survival) {
        this.customRuleActive = true;
        this.customRuleBirth = normalizeRuleCounts(customRule.birth);
        this.customRuleSurvival = normalizeRuleCounts(customRule.survival);
        this.syncCustomRuleDesignerFromRule(customRule);
        this.engine.rule = structuredClone({
          ...importedRule,
          id: 'custom',
          type: 'life-like',
          rule: serializeLifeBSRule({ birth: this.customRuleBirth, survival: this.customRuleSurvival }),
          birth: this.customRuleBirth,
          survival: this.customRuleSurvival
        });
        this.engine.neighborhoodType = state.neighborhoodType || this.engine.neighborhoodType;
      } else {
        this.customRuleActive = false;
        this.syncCustomRuleDesignerFromRule(getRulePreset(this.ruleSelect.value || 'conway'));
      }
      this.updateGeometryInfoCard();
      this.updateNeighborhoodLaboratory();
      this.populatePatternLibrary();
      this.history = []; this.stateHashes = new Map(); this.extinctionTime = null; this.afterStateChange();
    } catch (error) { this.challengeStatus.textContent = `${t('importFailed', this.language)}: ${error.message}`; }
  }
}

export function installLifeUI(root = document) { const ui = new LifeUI(root); ui.install(); return ui; }
