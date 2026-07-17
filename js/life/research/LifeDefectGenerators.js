import {
  LIFE_DEFECT_TYPES,
  LIFE_DEFECT_LABELS,
  addDefect,
  createDefectLayer,
  siteIdFromPosition,
  undirectedEdgeKey
} from './LifeDefectLayer.js';

const DEFAULT_MAX_AFFECTED_SITES = 20000;
const DEFAULT_MAX_AFFECTED_EDGES = 100000;

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

function cloneJson(value, fallback = {}) {
  if (value == null) return fallback;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function vectorFrom(value, dimension = 2, fallback = 0) {
  if (Array.isArray(value)) {
    const result = value.slice(0, dimension).map(Number);
    while (result.length < dimension) result.push(fallback);
    return result.map((entry) => Number.isFinite(entry) ? entry : fallback);
  }
  if (value && typeof value === 'object') {
    const axes = ['x', 'y', 'z', 'w'];
    return axes.slice(0, dimension).map((axis, index) => Number(value[axis] ?? value[index] ?? fallback));
  }
  return Array.from({ length: dimension }, () => Number(value) || fallback);
}

function inferCoord(site) {
  if (Array.isArray(site)) return site.map(Number);
  if (site && typeof site === 'object') {
    if (Array.isArray(site.coord)) return site.coord.map(Number);
    if (Array.isArray(site.position)) return site.position.map(Number);
    if (Array.isArray(site.position3D)) return site.position3D.map(Number);
    const axes = ['x', 'y', 'z', 'w'].filter((axis) => site[axis] != null);
    if (axes.length) return axes.map((axis) => Number(site[axis]));
  }
  return null;
}

function normalizeSite(site) {
  const coord = inferCoord(site);
  return {
    id: siteIdFromPosition(site),
    coord
  };
}

function normalizeSites(sites = []) {
  return sites.map(normalizeSite);
}

function normalizeEdge(edge) {
  if (Array.isArray(edge) && edge.length >= 2) {
    return {
      source: siteIdFromPosition(edge[0]),
      target: siteIdFromPosition(edge[1]),
      key: undirectedEdgeKey(edge[0], edge[1])
    };
  }
  if (edge && typeof edge === 'object') {
    const source = edge.source ?? edge.a ?? edge.from;
    const target = edge.target ?? edge.b ?? edge.to;
    return {
      source: siteIdFromPosition(source),
      target: siteIdFromPosition(target),
      key: edge.key || undirectedEdgeKey(source, target)
    };
  }
  const [source, target] = String(edge).split('|');
  return {
    source,
    target,
    key: source && target ? undirectedEdgeKey(source, target) : String(edge)
  };
}

function unique(values = []) {
  return [...new Set(values)];
}

function uniqueEdges(edges = []) {
  const seen = new Set();
  const result = [];
  for (const edge of edges.map(normalizeEdge)) {
    if (!edge.source || !edge.target || seen.has(edge.key)) continue;
    seen.add(edge.key);
    result.push(edge);
  }
  return result;
}

function label(type) {
  return LIFE_DEFECT_LABELS[type] || { en: type, zh: type };
}

function makeDefect(type, options = {}) {
  const names = label(type);
  const defect = {
    id: String(options.id || `${type}:${hashSeed(options.seed ?? options.id ?? type).toString(36)}`),
    type,
    parameters: cloneJson(options.parameters || {}),
    affectedSites: unique((options.affectedSites || []).map(siteIdFromPosition)),
    affectedEdges: uniqueEdges(options.affectedEdges || []),
    createdAtTick: Number(options.createdAtTick || 0),
    enabled: options.enabled !== false,
    nameEn: String(options.nameEn || names.en),
    nameZh: String(options.nameZh || names.zh),
    metadata: cloneJson(options.metadata || {})
  };
  return defect;
}

function requireCoordinateSites(normalizedSites, generatorName) {
  if (!normalizedSites.length) return;
  if (normalizedSites.some((site) => !Array.isArray(site.coord))) {
    throw new Error(`${generatorName} requires sites with logical coordinates.`);
  }
}

function squaredDistance(a, b) {
  return a.reduce((sum, value, index) => sum + (value - (b[index] || 0)) ** 2, 0);
}

function pointSegmentDistance(point, start, end) {
  const vector = end.map((value, index) => value - start[index]);
  const lengthSquared = vector.reduce((sum, value) => sum + value * value, 0);
  if (!lengthSquared) return Math.sqrt(squaredDistance(point, start));
  const t = Math.max(0, Math.min(1, point.reduce((sum, value, index) => {
    return sum + (value - start[index]) * vector[index];
  }, 0) / lengthSquared));
  const closest = start.map((value, index) => value + t * vector[index]);
  return Math.sqrt(squaredDistance(point, closest));
}

function pointInShape(coord, { center, radius, shape = 'disk', start, end, thickness = 1, dimension = coord.length }) {
  const localCenter = vectorFrom(center, dimension);
  const radii = Array.isArray(radius) ? vectorFrom(radius, dimension, 1) : Array.from({ length: dimension }, () => Number(radius) || 1);
  if (shape === 'rectangle') {
    return coord.every((value, index) => Math.abs(value - localCenter[index]) <= radii[index]);
  }
  if (shape === 'line') {
    return pointSegmentDistance(coord, vectorFrom(start, dimension), vectorFrom(end, dimension)) <= Number(thickness || 1);
  }
  return squaredDistance(coord, localCenter) <= (Number(radius) || 1) ** 2;
}

function generateIntegerSitesInShape({ center, radius = 1, shape = 'disk', dimension = 2, start, end, thickness = 1 }) {
  const localCenter = vectorFrom(center, dimension);
  const radii = Array.isArray(radius) ? vectorFrom(radius, dimension, 1) : Array.from({ length: dimension }, () => Number(radius) || 1);
  const min = localCenter.map((value, index) => Math.floor(value - radii[index] - thickness - 1));
  const max = localCenter.map((value, index) => Math.ceil(value + radii[index] + thickness + 1));
  const result = [];
  const current = [];

  function visit(axis) {
    if (axis === dimension) {
      if (pointInShape(current, { center, radius, shape, start, end, thickness, dimension })) {
        result.push(current.slice());
      }
      return;
    }
    for (let value = min[axis]; value <= max[axis]; value += 1) {
      current[axis] = value;
      visit(axis + 1);
    }
  }

  visit(0);
  return result;
}

function edgeCoordinates(edge, siteMap) {
  const source = siteMap.get(edge.source);
  const target = siteMap.get(edge.target);
  if (!source?.coord || !target?.coord) return null;
  return { source: source.coord, target: target.coord };
}

function signedSide(coord, point, normal) {
  return coord.reduce((sum, value, index) => sum + (value - point[index]) * normal[index], 0);
}

export function validateGeneratedDefect(defect, options = {}) {
  const errors = [];
  const warnings = [];
  const siteIds = options.siteIds ? new Set([...options.siteIds].map(siteIdFromPosition)) : null;
  const seenSites = new Set();
  const seenEdges = new Set();

  for (const siteId of defect.affectedSites || []) {
    if (seenSites.has(siteId)) errors.push(`Duplicate affected site: ${siteId}`);
    seenSites.add(siteId);
    if (siteIds && !siteIds.has(siteId)) errors.push(`Invalid affected site: ${siteId}`);
  }

  for (const edge of defect.affectedEdges || []) {
    const key = edge.key || undirectedEdgeKey(edge.source, edge.target);
    if (seenEdges.has(key)) errors.push(`Duplicate affected edge: ${key}`);
    seenEdges.add(key);
    if (siteIds && (!siteIds.has(edge.source) || !siteIds.has(edge.target))) {
      errors.push(`Invalid affected edge endpoint: ${edge.source}|${edge.target}`);
    }
  }

  if ((defect.affectedSites?.length || 0) > (options.maxAffectedSites || DEFAULT_MAX_AFFECTED_SITES)) {
    errors.push(`Defect affects too many sites: ${defect.affectedSites.length}`);
  }
  if ((defect.affectedEdges?.length || 0) > (options.maxAffectedEdges || DEFAULT_MAX_AFFECTED_EDGES)) {
    errors.push(`Defect affects too many edges: ${defect.affectedEdges.length}`);
  }
  if (defect.type === LIFE_DEFECT_TYPES.SCREW_DISLOCATION_3D && defect.metadata?.developing) {
    warnings.push('Screw dislocation is a developing placeholder.');
  }

  return { ok: errors.length === 0, errors, warnings };
}

function finalizeDefect(defect, options = {}) {
  const validation = validateGeneratedDefect(defect, options);
  if (!validation.ok) throw new Error(validation.errors.join('; '));
  defect.metadata = {
    ...defect.metadata,
    warnings: [...(defect.metadata?.warnings || []), ...validation.warnings]
  };
  return defect;
}

export function generateVacancyCluster({
  center = [0, 0],
  radius = 3,
  shape = 'disk',
  density = 1,
  seed = 1,
  sites = [],
  dimension = Array.isArray(center) ? center.length : 2,
  id
} = {}) {
  const rng = createSeededRng(seed);
  const normalizedSites = normalizeSites(sites);
  const candidates = normalizedSites.length
    ? normalizedSites
    : generateIntegerSitesInShape({ center, radius, shape, dimension }).map(normalizeSite);
  if (normalizedSites.length) requireCoordinateSites(normalizedSites, 'generateVacancyCluster');

  const affectedSites = candidates
    .filter((site) => pointInShape(site.coord, { center, radius, shape, dimension }) && rng() <= density)
    .map((site) => site.id);

  return finalizeDefect(makeDefect(LIFE_DEFECT_TYPES.VACANCY, {
    id,
    seed,
    affectedSites,
    parameters: { center, radius, shape, density, seed },
    metadata: { generator: 'generateVacancyCluster' }
  }), { siteIds: normalizedSites.map((site) => site.id) });
}

export function generateCrackLine({
  start = [0, 0],
  end = [8, 0],
  thickness = 0.5,
  jaggedness = 0,
  seed = 1,
  sites = [],
  edges = [],
  blockSites = false,
  id
} = {}) {
  const dimension = Math.max(vectorFrom(start).length, vectorFrom(end).length);
  const normalizedSites = normalizeSites(sites);
  requireCoordinateSites(normalizedSites, 'generateCrackLine');
  const siteMap = new Map(normalizedSites.map((site) => [site.id, site]));
  const rng = createSeededRng(seed);

  const affectedSites = blockSites
    ? normalizedSites
      .filter((site) => pointSegmentDistance(site.coord, vectorFrom(start, dimension), vectorFrom(end, dimension)) <= thickness)
      .map((site) => site.id)
    : [];

  const affectedEdges = uniqueEdges(edges).filter((edge) => {
    const coords = edgeCoordinates(edge, siteMap);
    if (!coords) return false;
    const midpoint = coords.source.map((value, index) => (value + coords.target[index]) / 2);
    const localThickness = Number(thickness) * (1 + Number(jaggedness || 0) * (rng() - 0.5));
    return pointSegmentDistance(midpoint, vectorFrom(start, dimension), vectorFrom(end, dimension)) <= localThickness;
  });

  return finalizeDefect(makeDefect(LIFE_DEFECT_TYPES.CRACK, {
    id,
    seed,
    affectedSites,
    affectedEdges,
    parameters: { start, end, thickness, jaggedness, seed, blockSites, blocked: true },
    metadata: { generator: 'generateCrackLine' }
  }), { siteIds: siteMap.keys() });
}

export function generateGrainBoundary({
  lineOrPlane = { point: [0, 0], normal: [1, 0] },
  orientationA = 'A',
  orientationB = 'B',
  interactionStrength = 0.5,
  sites = [],
  edges = [],
  id
} = {}) {
  const normalizedSites = normalizeSites(sites);
  requireCoordinateSites(normalizedSites, 'generateGrainBoundary');
  const dimension = normalizedSites[0]?.coord?.length || 2;
  const point = vectorFrom(lineOrPlane.point ?? lineOrPlane.center ?? [0, 0], dimension);
  const normal = vectorFrom(lineOrPlane.normal ?? [1, 0], dimension);
  const siteMap = new Map(normalizedSites.map((site) => [site.id, site]));
  const affectedSites = normalizedSites.map((site) => site.id);
  const affectedEdges = uniqueEdges(edges).filter((edge) => {
    const coords = edgeCoordinates(edge, siteMap);
    if (!coords) return false;
    return signedSide(coords.source, point, normal) * signedSide(coords.target, point, normal) < 0;
  });

  return finalizeDefect(makeDefect(LIFE_DEFECT_TYPES.GRAIN_BOUNDARY, {
    id,
    affectedSites,
    affectedEdges,
    parameters: {
      lineOrPlane,
      orientationA,
      orientationB,
      interactionStrength,
      ruleModifier: { grainBoundary: true, orientationA, orientationB }
    },
    metadata: { generator: 'generateGrainBoundary' }
  }), { siteIds: siteMap.keys() });
}

export function generateEdgeDislocation2D({
  core = [0, 0],
  burgersVector = [1, 0],
  halfPlaneLength = 8,
  orientation = [0, 1],
  sites = [],
  edges = [],
  id
} = {}) {
  const normalizedSites = normalizeSites(sites);
  requireCoordinateSites(normalizedSites, 'generateEdgeDislocation2D');
  const siteMap = new Map(normalizedSites.map((site) => [site.id, site]));
  const corePoint = vectorFrom(core, 2);
  const direction = vectorFrom(orientation, 2);
  const end = corePoint.map((value, index) => value + direction[index] * halfPlaneLength);
  const affectedSites = normalizedSites
    .filter((site) => pointSegmentDistance(site.coord.slice(0, 2), corePoint, end) <= 0.75)
    .map((site) => site.id);
  const affectedEdges = uniqueEdges(edges).filter((edge) => {
    const coords = edgeCoordinates(edge, siteMap);
    if (!coords) return false;
    const midpoint = coords.source.slice(0, 2).map((value, index) => (value + coords.target[index]) / 2);
    return pointSegmentDistance(midpoint, corePoint, end) <= 0.75;
  });

  return finalizeDefect(makeDefect(LIFE_DEFECT_TYPES.EDGE_DISLOCATION_2D, {
    id,
    affectedSites,
    affectedEdges,
    parameters: { core, burgersVector, halfPlaneLength, orientation, blocked: true },
    metadata: { generator: 'generateEdgeDislocation2D', burgersVector }
  }), { siteIds: siteMap.keys() });
}

export function generateScrewDislocation3D({
  line = { start: [0, 0, 0], end: [0, 0, 8] },
  burgersVector = [0, 0, 1],
  pitch = 1,
  id
} = {}) {
  return makeDefect(LIFE_DEFECT_TYPES.SCREW_DISLOCATION_3D, {
    id,
    enabled: false,
    parameters: { line, burgersVector, pitch, developing: true },
    metadata: {
      generator: 'generateScrewDislocation3D',
      developing: true,
      warnings: ['Screw dislocation is represented as a validated placeholder until full helical seam support is wired into Research Life.']
    }
  });
}

export function generateRandomDefectField({
  densityVacancy = 0.02,
  densityImpurity = 0,
  densityPinned = 0,
  seed = 1,
  sites = [],
  fixedState = 1,
  ruleModifier = {},
  id
} = {}) {
  const normalizedSites = normalizeSites(sites);
  if (!normalizedSites.length) throw new Error('generateRandomDefectField requires a finite site list.');
  const rng = createSeededRng(seed);
  const vacancySites = [];
  const impuritySites = [];
  const pinnedSites = [];

  for (const site of normalizedSites) {
    const roll = rng();
    if (roll < densityVacancy) vacancySites.push(site.id);
    else if (roll < densityVacancy + densityPinned) pinnedSites.push(site.id);
    else if (roll < densityVacancy + densityPinned + densityImpurity) impuritySites.push(site.id);
  }

  return finalizeDefect(makeDefect(LIFE_DEFECT_TYPES.RANDOM_DEFECT_FIELD, {
    id,
    seed,
    affectedSites: [...vacancySites, ...impuritySites, ...pinnedSites],
    parameters: {
      densityVacancy,
      densityImpurity,
      densityPinned,
      seed,
      vacancySites,
      impuritySites,
      pinnedSites,
      fixedState,
      ruleModifier
    },
    metadata: { generator: 'generateRandomDefectField' }
  }), { siteIds: normalizedSites.map((site) => site.id) });
}

export function generateInclusion({
  center = [0, 0],
  radius = 3,
  modifierType = 'rule',
  ruleModifier = {},
  sites = [],
  dimension = Array.isArray(center) ? center.length : 2,
  id
} = {}) {
  const normalizedSites = normalizeSites(sites);
  const candidates = normalizedSites.length
    ? normalizedSites
    : generateIntegerSitesInShape({ center, radius, shape: dimension >= 3 ? 'sphere' : 'disk', dimension }).map(normalizeSite);
  if (normalizedSites.length) requireCoordinateSites(normalizedSites, 'generateInclusion');
  const affectedSites = candidates
    .filter((site) => pointInShape(site.coord, { center, radius, shape: dimension >= 3 ? 'sphere' : 'disk', dimension }))
    .map((site) => site.id);

  return finalizeDefect(makeDefect(LIFE_DEFECT_TYPES.INCLUSION, {
    id,
    affectedSites,
    parameters: { center, radius, modifierType, ruleModifier },
    metadata: { generator: 'generateInclusion' }
  }), { siteIds: normalizedSites.map((site) => site.id) });
}

export function generateSlipLine({
  path = [[0, 0], [8, 0]],
  shiftVector = [1, 0],
  interactionStrength = 0.5,
  thickness = 0.5,
  sites = [],
  edges = [],
  id
} = {}) {
  if (!Array.isArray(path) || path.length < 2) throw new Error('generateSlipLine requires a path with at least two points.');
  const normalizedSites = normalizeSites(sites);
  requireCoordinateSites(normalizedSites, 'generateSlipLine');
  const siteMap = new Map(normalizedSites.map((site) => [site.id, site]));
  const segments = path.slice(0, -1).map((point, index) => [vectorFrom(point, 2), vectorFrom(path[index + 1], 2)]);
  const affectedEdges = uniqueEdges(edges).filter((edge) => {
    const coords = edgeCoordinates(edge, siteMap);
    if (!coords) return false;
    const midpoint = coords.source.slice(0, 2).map((value, index) => (value + coords.target[index]) / 2);
    return segments.some(([start, end]) => pointSegmentDistance(midpoint, start, end) <= thickness);
  });

  return finalizeDefect(makeDefect(LIFE_DEFECT_TYPES.SLIP_LINE, {
    id,
    affectedEdges,
    parameters: { path, shiftVector, interactionStrength, thickness },
    metadata: { generator: 'generateSlipLine' }
  }), { siteIds: siteMap.keys() });
}

export function createLayerFromGeneratedDefects(defects = [], options = {}) {
  const layer = createDefectLayer({ enabled: options.enabled ?? true, metadata: options.metadata });
  defects.forEach((defect) => addDefect(layer, defect));
  return layer;
}

