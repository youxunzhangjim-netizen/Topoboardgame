export const LIFE_DEFECT_LAYER_SCHEMA = 'topoboard.lifeDefectLayer.v0';

export const LIFE_DEFECT_TYPES = Object.freeze({
  VACANCY: 'vacancy',
  IMPURITY: 'impurity',
  PINNED_SITE: 'pinned_site',
  CRACK: 'crack',
  GRAIN_BOUNDARY: 'grain_boundary',
  EDGE_DISLOCATION_2D: 'edge_dislocation_2d',
  SCREW_DISLOCATION_3D: 'screw_dislocation_3d',
  INCLUSION: 'inclusion',
  SLIP_LINE: 'slip_line',
  RANDOM_DEFECT_FIELD: 'random_defect_field'
});

export const LIFE_DEFECT_LABELS = Object.freeze({
  defectLayer: { en: 'Defect Layer', zh: '缺陷層' },
  [LIFE_DEFECT_TYPES.VACANCY]: { en: 'Vacancy', zh: '空位' },
  [LIFE_DEFECT_TYPES.IMPURITY]: { en: 'Impurity', zh: '雜質' },
  [LIFE_DEFECT_TYPES.PINNED_SITE]: { en: 'Pinned Site', zh: '釘扎格點' },
  [LIFE_DEFECT_TYPES.CRACK]: { en: 'Crack', zh: '裂縫' },
  [LIFE_DEFECT_TYPES.GRAIN_BOUNDARY]: { en: 'Grain Boundary', zh: '晶界' },
  [LIFE_DEFECT_TYPES.EDGE_DISLOCATION_2D]: { en: 'Edge Dislocation', zh: '邊緣位錯' },
  [LIFE_DEFECT_TYPES.SCREW_DISLOCATION_3D]: { en: 'Screw Dislocation', zh: '螺旋位錯' },
  [LIFE_DEFECT_TYPES.INCLUSION]: { en: 'Inclusion', zh: '夾雜區' },
  [LIFE_DEFECT_TYPES.SLIP_LINE]: { en: 'Slip Line', zh: '滑移線' },
  [LIFE_DEFECT_TYPES.RANDOM_DEFECT_FIELD]: { en: 'Random Defect Field', zh: '隨機缺陷場' }
});

const KNOWN_DEFECT_TYPES = new Set(Object.values(LIFE_DEFECT_TYPES));

function cloneJson(value, fallback = {}) {
  if (value == null) return fallback;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function siteIdFromPosition(position) {
  if (Array.isArray(position)) return position.map((value) => String(value)).join(',');
  if (position && typeof position === 'object') {
    if (position.id != null) return String(position.id);
    if (Array.isArray(position.coord)) return siteIdFromPosition(position.coord);
    if (Array.isArray(position.position)) return siteIdFromPosition(position.position);
    const axes = ['x', 'y', 'z', 'w'].filter((axis) => position[axis] != null);
    if (axes.length) return axes.map((axis) => String(position[axis])).join(',');
  }
  return String(position);
}

export function undirectedEdgeKey(a, b) {
  const source = siteIdFromPosition(a);
  const target = siteIdFromPosition(b);
  return source < target ? `${source}|${target}` : `${target}|${source}`;
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
      ...edge,
      source: siteIdFromPosition(source),
      target: siteIdFromPosition(target),
      key: edge.key || undirectedEdgeKey(source, target)
    };
  }

  const [source, target] = String(edge).split('|');
  return {
    source: siteIdFromPosition(source),
    target: siteIdFromPosition(target),
    key: source && target ? undirectedEdgeKey(source, target) : String(edge)
  };
}

function uniqueSites(values = []) {
  return [...new Set(values.map(siteIdFromPosition))];
}

function uniqueEdges(values = []) {
  const seen = new Set();
  const edges = [];
  for (const rawEdge of values) {
    const edge = normalizeEdge(rawEdge);
    if (!edge.source || !edge.target || seen.has(edge.key)) continue;
    seen.add(edge.key);
    edges.push(edge);
  }
  return edges;
}

function mergeModifier(base = {}, update = {}) {
  return {
    ...base,
    ...update,
    defects: [...new Set([...(base.defects || []), ...(update.defects || [])])]
  };
}

function labelForType(type) {
  return LIFE_DEFECT_LABELS[type] || { en: type, zh: type };
}

function normalizeDefect(defect = {}, index = 0) {
  const type = defect.type || LIFE_DEFECT_TYPES.IMPURITY;
  if (!KNOWN_DEFECT_TYPES.has(type)) {
    throw new Error(`Unknown Life defect type: ${type}`);
  }

  const label = labelForType(type);
  return {
    id: String(defect.id || `${type}:${index}`),
    type,
    parameters: cloneJson(defect.parameters || {}),
    affectedSites: uniqueSites(defect.affectedSites || []),
    affectedEdges: uniqueEdges(defect.affectedEdges || []),
    createdAtTick: Number(defect.createdAtTick || 0),
    enabled: defect.enabled !== false,
    nameEn: String(defect.nameEn || label.en),
    nameZh: String(defect.nameZh || label.zh),
    metadata: cloneJson(defect.metadata || {})
  };
}

function addLocalModifier(layer, siteId, modifier) {
  const id = siteIdFromPosition(siteId);
  layer.localRuleOverrides.set(id, mergeModifier(layer.localRuleOverrides.get(id), modifier));
}

function addBlockedSite(layer, siteId) {
  layer.blockedSites.add(siteIdFromPosition(siteId));
}

function addPinnedSite(layer, siteId) {
  layer.pinnedSites.add(siteIdFromPosition(siteId));
}

function edgeBlocksNeighbor(edgeModifier = {}) {
  return edgeModifier.blocked === true
    || edgeModifier.enabled === false
    || Number(edgeModifier.interactionStrength ?? 1) <= 0;
}

function indexDefect(layer, defect) {
  if (!defect.enabled) return;

  const baseModifier = {
    defects: [defect.id],
    defectType: defect.type,
    weight: defect.parameters.weight,
    updateRate: defect.parameters.updateRate
  };

  if (defect.type === LIFE_DEFECT_TYPES.VACANCY) {
    defect.affectedSites.forEach((siteId) => addBlockedSite(layer, siteId));
  }

  if (defect.type === LIFE_DEFECT_TYPES.PINNED_SITE) {
    defect.affectedSites.forEach((siteId) => {
      addPinnedSite(layer, siteId);
      addLocalModifier(layer, siteId, {
        ...baseModifier,
        pinned: true,
        fixedState: defect.parameters.fixedState ?? defect.parameters.state ?? 1,
        fixedSpecies: defect.parameters.species
      });
    });
  }

  if (
    defect.type === LIFE_DEFECT_TYPES.IMPURITY
    || defect.type === LIFE_DEFECT_TYPES.INCLUSION
    || defect.type === LIFE_DEFECT_TYPES.GRAIN_BOUNDARY
  ) {
    defect.affectedSites.forEach((siteId) => {
      addLocalModifier(layer, siteId, {
        ...baseModifier,
        ...(defect.parameters.ruleModifier || {})
      });
    });
  }

  if (defect.type === LIFE_DEFECT_TYPES.RANDOM_DEFECT_FIELD) {
    uniqueSites(defect.parameters.vacancySites || []).forEach((siteId) => addBlockedSite(layer, siteId));
    uniqueSites(defect.parameters.pinnedSites || []).forEach((siteId) => {
      addPinnedSite(layer, siteId);
      addLocalModifier(layer, siteId, {
        ...baseModifier,
        pinned: true,
        fixedState: defect.parameters.fixedState ?? 1
      });
    });
    uniqueSites(defect.parameters.impuritySites || []).forEach((siteId) => {
      addLocalModifier(layer, siteId, {
        ...baseModifier,
        ...(defect.parameters.ruleModifier || {})
      });
    });
  }

  const shouldBlockEdges = defect.type === LIFE_DEFECT_TYPES.CRACK
    || defect.type === LIFE_DEFECT_TYPES.EDGE_DISLOCATION_2D
    || defect.type === LIFE_DEFECT_TYPES.SCREW_DISLOCATION_3D;

  for (const edge of defect.affectedEdges) {
    layer.modifiedEdges.set(edge.key, {
      defectId: defect.id,
      type: defect.type,
      source: edge.source,
      target: edge.target,
      enabled: defect.enabled,
      blocked: shouldBlockEdges || defect.parameters.blocked === true,
      interactionStrength: defect.parameters.interactionStrength,
      shiftVector: defect.parameters.shiftVector,
      metadata: cloneJson(edge.metadata || {})
    });
  }

  if (defect.type === LIFE_DEFECT_TYPES.SLIP_LINE) {
    for (const edge of defect.affectedEdges) {
      const current = layer.modifiedEdges.get(edge.key) || {};
      layer.modifiedEdges.set(edge.key, {
        ...current,
        defectId: defect.id,
        type: defect.type,
        source: edge.source,
        target: edge.target,
        enabled: defect.enabled,
        interactionStrength: defect.parameters.interactionStrength ?? 0.5,
        shiftVector: defect.parameters.shiftVector
      });
    }
  }
}

export function createDefectLayer(options = {}) {
  const layer = {
    schema: LIFE_DEFECT_LAYER_SCHEMA,
    enabled: Boolean(options.enabled),
    defects: [],
    latticeOverrides: cloneJson(options.latticeOverrides || {}),
    blockedSites: new Set(uniqueSites(options.blockedSites || [])),
    modifiedEdges: new Map(),
    pinnedSites: new Set(uniqueSites(options.pinnedSites || [])),
    localRuleOverrides: new Map(),
    metadata: cloneJson(options.metadata || {})
  };

  for (const [key, value] of options.modifiedEdges || []) {
    layer.modifiedEdges.set(String(key), cloneJson(value));
  }
  for (const [key, value] of options.localRuleOverrides || []) {
    layer.localRuleOverrides.set(siteIdFromPosition(key), cloneJson(value));
  }
  for (const defect of options.defects || []) addDefect(layer, defect);
  return layer;
}

export const LifeDefectLayer = Object.freeze({
  schema: LIFE_DEFECT_LAYER_SCHEMA,
  enabled: false,
  defects: [],
  latticeOverrides: {},
  blockedSites: new Set(),
  modifiedEdges: new Map(),
  pinnedSites: new Set(),
  localRuleOverrides: new Map(),
  metadata: {}
});

export function rebuildLayerIndexes(layer) {
  const rebuilt = createDefectLayer({
    enabled: layer.enabled,
    latticeOverrides: layer.latticeOverrides,
    metadata: layer.metadata
  });
  rebuilt.defects = layer.defects.map((defect, index) => normalizeDefect(defect, index));
  rebuilt.defects.forEach((defect) => indexDefect(rebuilt, defect));

  layer.blockedSites = rebuilt.blockedSites;
  layer.modifiedEdges = rebuilt.modifiedEdges;
  layer.pinnedSites = rebuilt.pinnedSites;
  layer.localRuleOverrides = rebuilt.localRuleOverrides;
  layer.defects = rebuilt.defects;
  return layer;
}

export function addDefect(layer, defect) {
  if (!layer || layer.schema !== LIFE_DEFECT_LAYER_SCHEMA) {
    throw new Error('addDefect requires a LifeDefectLayer.');
  }
  const normalized = normalizeDefect(defect, layer.defects.length);
  if (layer.defects.some((item) => item.id === normalized.id)) {
    throw new Error(`Duplicate Life defect id: ${normalized.id}`);
  }
  layer.defects.push(normalized);
  indexDefect(layer, normalized);
  return normalized;
}

export function removeDefect(layer, defectId) {
  if (!layer || layer.schema !== LIFE_DEFECT_LAYER_SCHEMA) return false;
  const before = layer.defects.length;
  layer.defects = layer.defects.filter((defect) => defect.id !== defectId);
  if (layer.defects.length === before) return false;
  rebuildLayerIndexes(layer);
  return true;
}

export function isSiteBlocked(layer, siteId) {
  if (!layer?.enabled) return false;
  return layer.blockedSites.has(siteIdFromPosition(siteId));
}

export function isSitePinned(layer, siteId) {
  if (!layer?.enabled) return false;
  return layer.pinnedSites.has(siteIdFromPosition(siteId));
}

export function getLocalRuleModifier(layer, siteId) {
  if (!layer?.enabled) return null;
  const modifier = layer.localRuleOverrides.get(siteIdFromPosition(siteId));
  return modifier ? cloneJson(modifier, null) : null;
}

export function applyDefectLayerToNeighborhood(board, layer, siteId, neighbors = []) {
  if (!layer?.enabled) return neighbors;
  const sourceId = siteIdFromPosition(siteId);
  if (layer.blockedSites.has(sourceId)) return [];

  return neighbors.filter((neighbor) => {
    const targetId = siteIdFromPosition(neighbor);
    if (layer.blockedSites.has(targetId)) return false;
    const edgeModifier = layer.modifiedEdges.get(undirectedEdgeKey(sourceId, targetId));
    return !edgeModifier || !edgeBlocksNeighbor(edgeModifier);
  });
}

function serializeDefect(defect) {
  return {
    ...defect,
    parameters: cloneJson(defect.parameters || {}),
    affectedSites: uniqueSites(defect.affectedSites || []),
    affectedEdges: uniqueEdges(defect.affectedEdges || []),
    metadata: cloneJson(defect.metadata || {})
  };
}

export function exportDefectLayer(layer) {
  if (!layer || layer.schema !== LIFE_DEFECT_LAYER_SCHEMA) {
    throw new Error('exportDefectLayer requires a LifeDefectLayer.');
  }
  return {
    schema: LIFE_DEFECT_LAYER_SCHEMA,
    enabled: Boolean(layer.enabled),
    defects: layer.defects.map(serializeDefect),
    latticeOverrides: cloneJson(layer.latticeOverrides || {}),
    blockedSites: [...layer.blockedSites],
    modifiedEdges: [...layer.modifiedEdges.entries()],
    pinnedSites: [...layer.pinnedSites],
    localRuleOverrides: [...layer.localRuleOverrides.entries()],
    metadata: cloneJson(layer.metadata || {})
  };
}

export function importDefectLayer(json) {
  const payload = typeof json === 'string' ? JSON.parse(json) : json;
  if (!payload || payload.schema !== LIFE_DEFECT_LAYER_SCHEMA) {
    throw new Error(`Unsupported Life defect layer schema: ${payload?.schema || 'missing'}`);
  }

  const layer = createDefectLayer({
    enabled: payload.enabled,
    latticeOverrides: payload.latticeOverrides,
    metadata: payload.metadata,
    blockedSites: payload.blockedSites,
    pinnedSites: payload.pinnedSites,
    modifiedEdges: payload.modifiedEdges,
    localRuleOverrides: payload.localRuleOverrides
  });

  for (const defect of payload.defects || []) addDefect(layer, defect);
  return layer;
}

