import { LIFE_DEFECT_TYPES } from './LifeDefectLayer.js';

export const LIFE_RESEARCH_SAFETY_LIMITS = Object.freeze({
  normal: {
    maxSites: 20000,
    maxDefectObjects: 200,
    maxInitialPatternOperations: 20000
  },
  research: {
    maxSites: 100000,
    warnSites: 50000,
    confirmSites: 100000,
    maxDefectObjects: 2000,
    maxInitialPatternOperations: 100000
  }
});

export const LIFE_RESEARCH_SAFETY_MESSAGES = Object.freeze({
  en: {
    unsupportedPattern: 'This initial pattern is not supported on the selected board.',
    unsupportedDefect: 'This defect type is not supported on the selected lattice.',
    boardTooLarge: 'The board is too large for this research preset.',
    defectLayerDisabled: 'Defect layer disabled to keep the simulation safe.',
    largeResearchWarning: 'This board is large and may run slowly.',
    largeResearchConfirmation: 'This board is very large and may run slowly. Continue?',
    tooManyDefects: 'Too many defects were requested for this mode.',
    quadraticRisk: 'This request appears to need O(N^2) work on a large board.',
    missingCoordinates: 'This defect requires board coordinates.',
    developing3DDislocation: '3D screw dislocation is still developing.'
  },
  zh: {
    unsupportedPattern: '所選棋盤不支援此初始圖案。',
    unsupportedDefect: '所選晶格不支援此缺陷類型。',
    boardTooLarge: '此棋盤對該研究預設過大。',
    defectLayerDisabled: '已停用缺陷層以保持模擬安全。',
    largeResearchWarning: '此棋盤較大，可能運行緩慢。',
    largeResearchConfirmation: '此棋盤非常大，可能運行緩慢。是否繼續？',
    tooManyDefects: '此模式要求的缺陷數過多。',
    quadraticRisk: '此請求可能在大型棋盤上執行 O(N^2) 工作。',
    missingCoordinates: '此缺陷需要棋盤座標。',
    developing3DDislocation: '3D 螺旋位錯仍在開發中。'
  }
});

const COORDINATE_REQUIRED_DEFECTS = new Set([
  LIFE_DEFECT_TYPES.CRACK,
  LIFE_DEFECT_TYPES.GRAIN_BOUNDARY,
  LIFE_DEFECT_TYPES.EDGE_DISLOCATION_2D,
  LIFE_DEFECT_TYPES.SCREW_DISLOCATION_3D,
  LIFE_DEFECT_TYPES.INCLUSION,
  LIFE_DEFECT_TYPES.SLIP_LINE
]);

const LATTICE_LIMITED_DEFECTS = new Map([
  [LIFE_DEFECT_TYPES.EDGE_DISLOCATION_2D, new Set(['square', 'triangular', 'honeycomb'])],
  [LIFE_DEFECT_TYPES.SLIP_LINE, new Set(['square', 'triangular', 'honeycomb', 'sc'])],
  [LIFE_DEFECT_TYPES.GRAIN_BOUNDARY, new Set(['square', 'triangular', 'honeycomb', 'sc', 'bcc', 'fcc', 'hcp'])]
]);

function message(key, language = 'en') {
  return LIFE_RESEARCH_SAFETY_MESSAGES[language]?.[key] || LIFE_RESEARCH_SAFETY_MESSAGES.en[key] || key;
}

function modeName(value) {
  return value === 'research' || value === true ? 'research' : 'normal';
}

function limitsFor(mode, overrides = {}) {
  return {
    ...LIFE_RESEARCH_SAFETY_LIMITS[modeName(mode)],
    ...Object.fromEntries(Object.entries(overrides).filter(([, value]) => value != null))
  };
}

function boardDimension(board) {
  return Number(board?.dimension || board?.metadata?.dimension || 2);
}

function boardSize(board) {
  const dimension = boardDimension(board);
  const size = Array.isArray(board?.size)
    ? board.size
    : Array.isArray(board?.metadata?.size)
      ? board.metadata.size
      : Array.from({ length: dimension }, () => 1);
  const result = size.slice(0, dimension).map((value) => Math.max(1, Number(value) || 1));
  while (result.length < dimension) result.push(1);
  return result;
}

function boardSiteCount(board) {
  if (typeof board?.volume === 'function') return Number(board.volume()) || 0;
  if (Array.isArray(board?.sites)) return board.sites.length;
  if (Array.isArray(board?.cells)) return board.cells.length;
  return boardSize(board).reduce((product, value) => product * value, 1);
}

function boardEdgeCount(board) {
  if (Array.isArray(board?.edges)) return board.edges.length;
  const dimension = boardDimension(board);
  return boardSiteCount(board) * Math.max(1, dimension) * 2;
}

function boardLattice(board) {
  return String(board?.lattice || board?.latticeType || board?.metadata?.lattice || 'square').toLowerCase();
}

function boardHasCoordinates(board) {
  if (Array.isArray(board?.size)) return true;
  if (!Array.isArray(board?.sites) || board.sites.length === 0) return false;
  return board.sites.every((site) => {
    if (Array.isArray(site?.coord) || Array.isArray(site?.position)) return true;
    return ['x', 'y', 'z', 'w'].some((axis) => site?.[axis] != null);
  });
}

function patternOperationComplexity(pattern, params = {}) {
  return String(pattern?.complexity || pattern?.metadata?.complexity || params.complexity || 'linear').toLowerCase();
}

function hasQuadraticRisk(pattern, defectLayer, params = {}) {
  if (patternOperationComplexity(pattern, params).includes('n^2')) return true;
  if (patternOperationComplexity(pattern, params).includes('quadratic')) return true;
  return (defectLayer?.defects || []).some((defect) => {
    return String(defect?.metadata?.complexity || defect?.parameters?.complexity || '').toLowerCase().includes('quadratic')
      || String(defect?.metadata?.complexity || defect?.parameters?.complexity || '').toLowerCase().includes('n^2');
  });
}

function defectCount(defectLayer) {
  if (!defectLayer?.enabled && !defectLayer?.defects?.length) return 0;
  return Array.isArray(defectLayer?.defects) ? defectLayer.defects.length : 0;
}

function addIssue(list, key, language, details = {}) {
  list.push({
    key,
    message: message(key, language),
    ...details
  });
}

export function estimateLifeResearchCost(board, pattern = null, defectLayer = null) {
  const siteCount = boardSiteCount(board);
  const edgeCount = boardEdgeCount(board);
  const defects = defectCount(defectLayer);
  const initialPatternOperations = siteCount;
  const defectOperations = defects ? siteCount + edgeCount + defects : 0;
  const quadraticRisk = hasQuadraticRisk(pattern, defectLayer);
  return {
    siteCount,
    edgeCount,
    defectCount: defects,
    initialPatternOperations,
    defectOperations,
    estimatedOperations: initialPatternOperations + defectOperations,
    complexity: quadraticRisk ? 'quadratic-risk' : 'linear',
    quadraticRisk
  };
}

export function validateInitialPatternRequest(board, pattern, params = {}) {
  const language = params.language || 'en';
  const mode = modeName(params.mode ?? params.researchMode);
  const limits = limitsFor(mode, {
    maxSites: params.maxSites,
    warnSites: params.warnSites,
    confirmSites: params.confirmSites,
    maxInitialPatternOperations: params.maxInitialPatternOperations
  });
  const dimension = boardDimension(board);
  const cost = estimateLifeResearchCost(board, pattern, null);
  const errors = [];
  const warnings = [];

  if (!pattern) {
    addIssue(errors, 'unsupportedPattern', language);
  } else if (Array.isArray(pattern.supportedDimensions) && !pattern.supportedDimensions.includes(dimension)) {
    addIssue(errors, 'unsupportedPattern', language, { dimension, supportedDimensions: pattern.supportedDimensions });
  }

  const requestedNeighborhood = params.neighborhoodType || board?.neighborhoodType || board?.neighborhood || null;
  if (pattern?.supportedNeighborhoods?.length && requestedNeighborhood && !pattern.supportedNeighborhoods.includes(requestedNeighborhood)) {
    addIssue(errors, 'unsupportedPattern', language, { neighborhood: requestedNeighborhood });
  }

  if (mode === 'normal' && cost.siteCount > limits.maxSites) {
    addIssue(errors, 'boardTooLarge', language, { siteCount: cost.siteCount, maxSites: limits.maxSites });
  }

  if (mode === 'normal' && cost.initialPatternOperations > limits.maxInitialPatternOperations) {
    addIssue(errors, 'boardTooLarge', language, {
      operations: cost.initialPatternOperations,
      maxOperations: limits.maxInitialPatternOperations
    });
  }

  if (mode === 'research' && cost.siteCount > limits.warnSites) {
    addIssue(warnings, 'largeResearchWarning', language, { siteCount: cost.siteCount, warnSites: limits.warnSites });
  }

  if (hasQuadraticRisk(pattern, null, params) && cost.siteCount > 2000) {
    addIssue(errors, 'quadraticRisk', language, { siteCount: cost.siteCount });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    requiresConfirmation: mode === 'research' && cost.siteCount > limits.confirmSites,
    fallback: errors.length ? fallbackToSafePattern(errors[0].key) : null,
    cost
  };
}

export function validateDefectLayer(board, defectLayer, options = {}) {
  const language = options.language || 'en';
  const mode = modeName(options.mode ?? options.researchMode);
  const limits = limitsFor(mode, {
    maxSites: options.maxSites,
    warnSites: options.warnSites,
    confirmSites: options.confirmSites,
    maxDefectObjects: options.maxDefectObjects
  });
  const dimension = boardDimension(board);
  const lattice = boardLattice(board);
  const cost = estimateLifeResearchCost(board, null, defectLayer);
  const errors = [];
  const warnings = [];
  const defects = Array.isArray(defectLayer?.defects) ? defectLayer.defects.filter((defect) => defect.enabled !== false) : [];

  if (!defectLayer?.enabled && defects.length === 0) {
    return {
      ok: true,
      errors,
      warnings,
      disableDefectLayer: false,
      cost
    };
  }

  if (defects.length > limits.maxDefectObjects) {
    addIssue(errors, 'tooManyDefects', language, { defectCount: defects.length, maxDefectObjects: limits.maxDefectObjects });
  }

  if (mode === 'normal' && cost.siteCount > limits.maxSites) {
    addIssue(errors, 'boardTooLarge', language, { siteCount: cost.siteCount, maxSites: limits.maxSites });
  }

  for (const defect of defects) {
    const type = defect.type;
    if (!Object.values(LIFE_DEFECT_TYPES).includes(type)) {
      addIssue(errors, 'unsupportedDefect', language, { defectId: defect.id, type });
      continue;
    }

    if (COORDINATE_REQUIRED_DEFECTS.has(type) && !boardHasCoordinates(board)) {
      addIssue(errors, 'missingCoordinates', language, { defectId: defect.id, type });
    }

    if (type === LIFE_DEFECT_TYPES.EDGE_DISLOCATION_2D && dimension !== 2) {
      addIssue(errors, 'unsupportedDefect', language, { defectId: defect.id, type, dimension });
    }

    if (type === LIFE_DEFECT_TYPES.SCREW_DISLOCATION_3D) {
      addIssue(warnings, 'developing3DDislocation', language, { defectId: defect.id, type });
      if (defect.enabled !== false) addIssue(errors, 'unsupportedDefect', language, { defectId: defect.id, type, dimension });
    }

    const allowedLattices = LATTICE_LIMITED_DEFECTS.get(type);
    if (allowedLattices && !allowedLattices.has(lattice)) {
      addIssue(errors, 'unsupportedDefect', language, { defectId: defect.id, type, lattice });
    }
  }

  if (cost.quadraticRisk && cost.siteCount > 2000) {
    addIssue(errors, 'quadraticRisk', language, { siteCount: cost.siteCount });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    disableDefectLayer: errors.length > 0,
    cost
  };
}

export function applyLifeResearchSafetyLimits(request = {}) {
  const language = request.language || 'en';
  const patternResult = validateInitialPatternRequest(request.board, request.pattern, {
    ...(request.params || {}),
    mode: request.mode,
    researchMode: request.researchMode,
    language,
    maxSites: request.maxSites,
    warnSites: request.warnSites,
    confirmSites: request.confirmSites,
    maxInitialPatternOperations: request.maxInitialPatternOperations
  });
  const defectResult = validateDefectLayer(request.board, request.defectLayer, {
    mode: request.mode,
    researchMode: request.researchMode,
    language,
    maxSites: request.maxSites,
    warnSites: request.warnSites,
    confirmSites: request.confirmSites,
    maxDefectObjects: request.maxDefectObjects
  });
  const errors = [...patternResult.errors, ...defectResult.errors];
  const warnings = [...patternResult.warnings, ...defectResult.warnings];
  const cost = estimateLifeResearchCost(request.board, request.pattern, request.defectLayer);
  const mode = modeName(request.mode ?? request.researchMode);
  const limits = limitsFor(mode, {
    maxSites: request.maxSites,
    warnSites: request.warnSites,
    confirmSites: request.confirmSites
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    requiresConfirmation: patternResult.requiresConfirmation || (mode === 'research' && cost.siteCount > limits.confirmSites),
    disableDefectLayer: defectResult.disableDefectLayer,
    fallback: errors.length ? fallbackToSafePattern(errors[0].key) : null,
    cost
  };
}

export function fallbackToSafePattern(reason = '') {
  const key = typeof reason === 'object' ? reason.key || reason.reason || '' : String(reason || '');
  return {
    patternId: key.includes('unsupported') ? 'random_clustered' : 'localized_colony',
    alternatives: ['random_clustered', 'localized_colony'],
    reason: key || 'safe_fallback'
  };
}

export function safetyMessagesFor(result, language = 'en') {
  return [...(result?.errors || []), ...(result?.warnings || [])]
    .map((issue) => issue.message || message(issue.key, language))
    .filter(Boolean);
}
