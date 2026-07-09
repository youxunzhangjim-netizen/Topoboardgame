import { buildAdjacencyMap } from '../shared/BoardSpec.js';

const compatibilityRegistry = new Map();

export const LAB_COMPATIBILITY_MESSAGES = Object.freeze({
    graphNeighbors: {
        en: 'This Lab requires valid graph neighbors.',
        zh: '此 Lab 需要有效的圖鄰接關係。'
    },
    faces: {
        en: 'This Lab requires plaquettes/faces, which this board does not provide.',
        zh: '此 Lab 需要 plaquette／面資料，但此棋盤未提供。'
    },
    incompatible: {
        en: 'This board is not compatible with the selected Lab.',
        zh: '此棋盤與所選 Lab 不相容。'
    }
});

function asArray(value) {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
}

function normalizeConfig(config = {}) {
    if (!config.labId) throw new TypeError('Lab compatibility entries require labId.');
    return Object.freeze({
        labId: String(config.labId),
        allowedDimensions: asArray(config.allowedDimensions).map(Number).filter(Boolean),
        requiredPlayableKind: config.requiredPlayableKind ? String(config.requiredPlayableKind) : '',
        requiredBoardFeatures: asArray(config.requiredBoardFeatures).map(String),
        requiredLabFields: asArray(config.requiredLabFields).map(String),
        requiredTopologyFeatures: asArray(config.requiredTopologyFeatures).map(String),
        maxRecommendedSites: Number(config.maxRecommendedSites || 0),
        supportedLattices: asArray(config.supportedLattices).map(String),
        unsupportedBoardIds: asArray(config.unsupportedBoardIds).map(String),
        fallbackBoardId: config.fallbackBoardId ? String(config.fallbackBoardId) : '',
        reasonEn: String(config.reasonEn || ''),
        reasonZh: String(config.reasonZh || '')
    });
}

function boardFeatureSet(boardSpec = {}) {
    const metadata = boardSpec.metadata || {};
    const features = new Set(asArray(metadata.features).map(String));
    if ((boardSpec.edges || []).length > 0) features.add('edges');
    if ((boardSpec.sites || []).length > 0) features.add('sites');
    if (boardSpec.directions?.length) features.add('directions');
    if (boardSpec.targetZones && Object.keys(boardSpec.targetZones).length) features.add('targetZones');
    if (metadata.faces?.length || metadata.plaquettes?.length || boardSpec.faces?.length || boardSpec.plaquettes?.length) {
        features.add('faces');
        features.add('plaquettes');
    }
    const adjacency = buildAdjacencyMap(boardSpec);
    if (adjacency.size && [...adjacency.values()].some((neighbors) => neighbors.size > 0)) {
        features.add('graphNeighbors');
    }
    if (boardSpec.playableKind) features.add(`playable:${boardSpec.playableKind}`);
    if (boardSpec.lattice?.id) features.add(`lattice:${boardSpec.lattice.id}`);
    if (boardSpec.space?.id) features.add(`space:${boardSpec.space.id}`);
    if (boardSpec.boundary?.id) features.add(`boundary:${boardSpec.boundary.id}`);
    return features;
}

function topologyFeatureSet(boardSpec = {}) {
    const metadata = boardSpec.metadata || {};
    const features = new Set(asArray(metadata.topologyFeatures).map(String));
    for (const key of ['orientable', 'nonorientable', 'periodic', 'boundary', 'closed', 'withBoundary']) {
        if (metadata[key]) features.add(key);
    }
    if (boardSpec.boundary?.gluing) features.add('gluing');
    if (boardSpec.boundary?.id) features.add(boardSpec.boundary.id);
    if (boardSpec.space?.id) features.add(boardSpec.space.id);
    return features;
}

function hasField(root, path) {
    const parts = String(path).split('.').filter(Boolean);
    let current = root;
    for (const part of parts) {
        if (current == null || !(part in current)) return false;
        current = current[part];
    }
    return current != null;
}

function message(en, zh, code, details = {}) {
    return { en, zh, code, details };
}

function defaultReason(config, boardSpec, mismatches) {
    if (config.reasonEn || config.reasonZh) {
        return message(config.reasonEn, config.reasonZh || config.reasonEn, 'configured_reason');
    }
    const first = mismatches[0];
    if (first?.code === 'missing_board_feature' && first.details.feature === 'graphNeighbors') {
        return message(LAB_COMPATIBILITY_MESSAGES.graphNeighbors.en, LAB_COMPATIBILITY_MESSAGES.graphNeighbors.zh, first.code, first.details);
    }
    if (first?.code === 'missing_board_feature' && ['faces', 'plaquettes'].includes(first.details.feature)) {
        return message(LAB_COMPATIBILITY_MESSAGES.faces.en, LAB_COMPATIBILITY_MESSAGES.faces.zh, first.code, first.details);
    }
    return message(LAB_COMPATIBILITY_MESSAGES.incompatible.en, LAB_COMPATIBILITY_MESSAGES.incompatible.zh, first?.code || 'incompatible', {
        labId: config.labId,
        boardId: boardSpec?.id || ''
    });
}

export function registerLabCompatibility(config) {
    const entry = normalizeConfig(config);
    compatibilityRegistry.set(entry.labId, entry);
    return entry;
}

export function getLabCompatibilityConfig(labId) {
    return compatibilityRegistry.get(String(labId)) || null;
}

export function checkLabBoardCompatibility(labId, boardSpec = {}) {
    const config = getLabCompatibilityConfig(labId);
    if (!config) return { ok: true, labId: String(labId), boardId: boardSpec?.id || '', mismatches: [], config: null };

    const mismatches = [];
    const boardFeatures = boardFeatureSet(boardSpec);
    const topologyFeatures = topologyFeatureSet(boardSpec);
    const dimension = Number(boardSpec?.dimension || 0);
    const boardId = String(boardSpec?.id || '');
    const siteCount = boardSpec?.sites?.length || 0;
    const latticeId = String(boardSpec?.lattice?.id || '');

    if (config.allowedDimensions.length && !config.allowedDimensions.includes(dimension)) {
        mismatches.push(message('Dimension is not allowed.', '維度不符合此 Lab。', 'dimension', { dimension, allowed: config.allowedDimensions }));
    }
    if (config.requiredPlayableKind && boardSpec?.playableKind !== config.requiredPlayableKind) {
        mismatches.push(message('Playable kind is not compatible.', '可下子單位類型不相容。', 'playable_kind', {
            required: config.requiredPlayableKind,
            actual: boardSpec?.playableKind
        }));
    }
    if (config.unsupportedBoardIds.includes(boardId)) {
        mismatches.push(message('This board is explicitly unsupported.', '此棋盤已標記為不支援。', 'unsupported_board', { boardId }));
    }
    if (config.supportedLattices.length && latticeId && !config.supportedLattices.includes(latticeId)) {
        mismatches.push(message('This lattice is not supported by the Lab.', '此晶格不支援此 Lab。', 'unsupported_lattice', {
            latticeId,
            supported: config.supportedLattices
        }));
    }
    if (config.maxRecommendedSites && siteCount > config.maxRecommendedSites) {
        mismatches.push(message('The board is larger than the recommended size.', '此棋盤超過建議尺寸。', 'site_count', {
            siteCount,
            maxRecommendedSites: config.maxRecommendedSites
        }));
    }
    for (const feature of config.requiredBoardFeatures) {
        if (!boardFeatures.has(feature)) {
            mismatches.push(message('Required board feature is missing.', '缺少必要棋盤特徵。', 'missing_board_feature', { feature }));
        }
    }
    for (const feature of config.requiredTopologyFeatures) {
        if (!topologyFeatures.has(feature)) {
            mismatches.push(message('Required topology feature is missing.', '缺少必要拓撲特徵。', 'missing_topology_feature', { feature }));
        }
    }
    for (const field of config.requiredLabFields) {
        if (!hasField(boardSpec, field)) {
            mismatches.push(message('Required Lab field is missing.', '缺少必要 Lab 欄位。', 'missing_lab_field', { field }));
        }
    }

    return {
        ok: mismatches.length === 0,
        labId: config.labId,
        boardId,
        mismatches,
        config
    };
}

export function getLabFallbackBoard(labId, boardSpec = {}) {
    const result = checkLabBoardCompatibility(labId, boardSpec);
    return result.ok ? '' : result.config?.fallbackBoardId || '';
}

export function explainLabBoardMismatch(labId, boardSpec = {}, language = 'en') {
    const result = checkLabBoardCompatibility(labId, boardSpec);
    if (result.ok) return { ok: true, message: '', messageEn: '', messageZh: '', mismatches: [] };
    const reason = defaultReason(result.config, boardSpec, result.mismatches);
    return {
        ok: false,
        message: String(language).toLowerCase().startsWith('zh') ? reason.zh : reason.en,
        messageEn: reason.en,
        messageZh: reason.zh,
        fallbackBoardId: result.config?.fallbackBoardId || '',
        mismatches: result.mismatches
    };
}

function registerDefaultLabCompatibility() {
    const graphDefaults = {
        allowedDimensions: [1, 2, 3, 4],
        requiredBoardFeatures: ['graphNeighbors'],
        maxRecommendedSites: 20000,
        fallbackBoardId: 'board.r2-square-standard'
    };
    for (const labId of [
        'ising_domain_game',
        'two_phase_competition_game',
        'physical_cluster_go',
        'physical_jump_particles',
        'physical_anyon_jump'
    ]) {
        registerLabCompatibility({ labId, ...graphDefaults });
    }
    registerLabCompatibility({
        labId: 'spin_ice_vertex_game',
        allowedDimensions: [2],
        requiredPlayableKind: 'edge',
        requiredBoardFeatures: ['edges', 'graphNeighbors'],
        requiredTopologyFeatures: ['orientable'],
        maxRecommendedSites: 12000,
        fallbackBoardId: 'board.r2-square-standard'
    });
    registerLabCompatibility({
        labId: 'z2_gauge_loop_game',
        allowedDimensions: [2],
        requiredBoardFeatures: ['edges', 'faces', 'plaquettes', 'graphNeighbors'],
        maxRecommendedSites: 12000,
        fallbackBoardId: 'board.r2-square-standard',
        reasonEn: LAB_COMPATIBILITY_MESSAGES.faces.en,
        reasonZh: LAB_COMPATIBILITY_MESSAGES.faces.zh
    });
    registerLabCompatibility({
        labId: 'physical_clifford_reversi',
        allowedDimensions: [1, 2, 3, 4],
        requiredBoardFeatures: ['sites', 'graphNeighbors'],
        requiredTopologyFeatures: [],
        maxRecommendedSites: 20000,
        fallbackBoardId: 'board.r2-square-standard',
        reasonEn: 'This Lab requires operator sites and syndrome metadata.',
        reasonZh: '此 Lab 需要算符格點與 syndrome 中繼資料。'
    });
    registerLabCompatibility({
        labId: 'clifford_reversi',
        allowedDimensions: [1, 2, 3, 4],
        requiredBoardFeatures: ['sites', 'graphNeighbors'],
        maxRecommendedSites: 20000,
        fallbackBoardId: 'board.r2-square-standard'
    });
    registerLabCompatibility({
        labId: 'physical_virasoro_go',
        allowedDimensions: [1, 2],
        requiredBoardFeatures: ['graphNeighbors'],
        requiredTopologyFeatures: ['boundary'],
        requiredLabFields: ['directions'],
        maxRecommendedSites: 8000,
        fallbackBoardId: 'board.r2-square-standard',
        reasonEn: 'This Lab requires ordered directions or interval structure.',
        reasonZh: '此 Lab 需要有序方向或區間結構。'
    });
}

registerDefaultLabCompatibility();
