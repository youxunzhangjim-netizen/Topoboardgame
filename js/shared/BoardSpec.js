export const BOARD_SPEC_SCHEMA = 'topoboard.board.v0';
export const BOARD_PLAYABLE_KINDS = Object.freeze(['cell', 'vertex', 'edge', 'mixed']);
export const BOARD_DIMENSIONS = Object.freeze([1, 2, 3, 4]);

function clone(value) {
    if (value == null) return value;
    try {
        return structuredClone(value);
    } catch {
        return JSON.parse(JSON.stringify(value));
    }
}

function metadataText(raw, fallbackId = 'unknown') {
    if (typeof raw === 'string') {
        return { id: raw, nameEn: raw, nameZh: raw };
    }
    return {
        id: String(raw?.id || fallbackId),
        nameEn: String(raw?.nameEn || raw?.name || fallbackId),
        nameZh: String(raw?.nameZh || raw?.zhName || raw?.nameEn || raw?.name || fallbackId),
        ...(raw?.technicalName ? { technicalName: String(raw.technicalName) } : {})
    };
}

function normalizeDimension(value) {
    const dimension = Number(value || 2);
    return BOARD_DIMENSIONS.includes(dimension) ? dimension : 2;
}

function normalizePlayableKind(value) {
    return BOARD_PLAYABLE_KINDS.includes(value) ? value : 'vertex';
}

function normalizeDraw(draw) {
    if (!draw) return {};
    return {
        draw: {
            x: Number(draw.x),
            y: Number(draw.y)
        }
    };
}

function normalizePosition3D(raw) {
    const position = raw?.position3D || raw?.position;
    if (!position) return {};
    return {
        position3D: {
            x: Number(position.x),
            y: Number(position.y),
            z: Number(position.z)
        }
    };
}

function normalizeSite(site, index) {
    return {
        id: String(site?.id ?? site?.key ?? `site:${index}`),
        coord: clone(site?.coord ?? site?.gameCoord ?? site?.logicalCoord ?? { index }),
        ...normalizeDraw(site?.draw),
        ...normalizePosition3D(site),
        ...(Array.isArray(site?.tags) ? { tags: site.tags.map(String) } : {})
    };
}

function normalizeEdge(edge) {
    const source = Array.isArray(edge) ? edge[0] : edge?.source ?? edge?.from ?? edge?.a;
    const target = Array.isArray(edge) ? edge[1] : edge?.target ?? edge?.to ?? edge?.b;
    return {
        source: String(source),
        target: String(target),
        ...(edge?.dir ? { dir: String(edge.dir) } : {}),
        ...(edge?.seam ? { seam: true } : {}),
        ...(Array.isArray(edge?.tags) ? { tags: edge.tags.map(String) } : {})
    };
}

export function createBoardSpec(raw = {}) {
    const directions = Array.isArray(raw.directions) ? raw.directions.map(String) : [];
    const targetZones = raw.targetZones ? clone(raw.targetZones) : {};
    const metadata = raw.metadata ? clone(raw.metadata) : {};
    return {
        schema: BOARD_SPEC_SCHEMA,
        id: String(raw.id || 'board:unnamed'),
        nameEn: String(raw.nameEn || raw.name || raw.id || 'Unnamed Board'),
        nameZh: String(raw.nameZh || raw.zhName || raw.nameEn || raw.name || raw.id || '未命名棋盤'),
        dimension: normalizeDimension(raw.dimension),
        playableKind: normalizePlayableKind(raw.playableKind),
        space: metadataText(raw.space, 'space:unknown'),
        lattice: metadataText(raw.lattice, 'lattice:unknown'),
        boundary: {
            ...metadataText(raw.boundary, 'boundary:unknown'),
            ...(raw.boundary?.gluing ? { gluing: clone(raw.boundary.gluing) } : {})
        },
        sites: (Array.isArray(raw.sites) ? raw.sites : []).map(normalizeSite),
        edges: (Array.isArray(raw.edges) ? raw.edges : []).map(normalizeEdge),
        directions,
        targetZones,
        metadata
    };
}

function undirectedKey(a, b) {
    const source = String(a);
    const target = String(b);
    return source < target ? `${source}|${target}` : `${target}|${source}`;
}

function edgesFromAdjacency(legacyBoard, sites) {
    const adjacency = legacyBoard?.adjacency || legacyBoard?.neighbors;
    if (!adjacency) return [];
    const entries = adjacency instanceof Map ? [...adjacency.entries()] : Object.entries(adjacency);
    const siteIds = new Set(sites.map((site) => String(site.id)));
    const seen = new Set();
    const edges = [];
    for (const [sourceRaw, neighborsRaw] of entries) {
        const source = String(sourceRaw);
        if (!siteIds.has(source)) continue;
        for (const targetRaw of neighborsRaw || []) {
            const target = String(targetRaw);
            if (!siteIds.has(target)) continue;
            const key = undirectedKey(source, target);
            if (seen.has(key)) continue;
            seen.add(key);
            edges.push({ source, target });
        }
    }
    return edges;
}

export function boardSpecFromLegacyBoard(legacyBoard = {}, metadata = {}) {
    const sites = Array.isArray(legacyBoard.sites)
        ? legacyBoard.sites
        : Array.isArray(legacyBoard.vertices)
            ? legacyBoard.vertices
            : Array.isArray(legacyBoard.nodes)
                ? legacyBoard.nodes
                : [];
    const edges = Array.isArray(legacyBoard.edges)
        ? legacyBoard.edges
        : edgesFromAdjacency(legacyBoard, sites);
    return createBoardSpec({
        id: metadata.id || legacyBoard.id || 'legacy:board',
        nameEn: metadata.nameEn || legacyBoard.nameEn || legacyBoard.name || 'Legacy Board',
        nameZh: metadata.nameZh || legacyBoard.nameZh || legacyBoard.zhName || '舊版棋盤',
        dimension: metadata.dimension || legacyBoard.dimension || 2,
        playableKind: metadata.playableKind || legacyBoard.playableKind || 'vertex',
        space: metadata.space || legacyBoard.space,
        lattice: metadata.lattice || legacyBoard.lattice,
        boundary: metadata.boundary || legacyBoard.boundary,
        sites,
        edges,
        directions: metadata.directions || legacyBoard.directions,
        targetZones: metadata.targetZones || legacyBoard.targetZones,
        metadata: {
            legacy: true,
            ...(legacyBoard.metadata || {}),
            ...(metadata.metadata || {})
        }
    });
}

export function getSite(boardSpec, siteId) {
    const id = String(siteId);
    return boardSpec?.sites?.find((site) => String(site.id) === id) || null;
}

export function buildAdjacencyMap(boardSpec) {
    const adjacency = new Map((boardSpec?.sites || []).map((site) => [String(site.id), new Set()]));
    for (const edge of boardSpec?.edges || []) {
        const source = String(edge.source);
        const target = String(edge.target);
        if (!adjacency.has(source) || !adjacency.has(target)) continue;
        adjacency.get(source).add(target);
        adjacency.get(target).add(source);
    }
    return adjacency;
}

export function getNeighbors(boardSpec, siteId) {
    return [...(buildAdjacencyMap(boardSpec).get(String(siteId)) || [])];
}

export function exportBoardSpec(boardSpec) {
    return JSON.stringify(createBoardSpec(boardSpec), null, 2);
}

export function importBoardSpec(json) {
    const raw = typeof json === 'string' ? JSON.parse(json) : json;
    return createBoardSpec(raw);
}

export const BOARD_NAMING = Object.freeze({
    spaces: {
        r2: ['Euclidean Plane R2', '歐氏平面 R2'],
        r3: ['Euclidean 3-Space R3', '歐氏三維空間 R3'],
        r4: ['Euclidean 4-Space R4', '歐氏四維空間 R4'],
        t2: ['Torus T2', '環面 T2'],
        s2: ['Sphere S2', '球面 S2'],
        mobius: ['Mobius Strip', 'Mobius 帶'],
        klein: ['Klein Bottle', 'Klein 瓶']
    },
    lattices: {
        square: ['Square Lattice', '方格晶格'],
        triangular: ['Triangular Lattice', '三角晶格'],
        hex_cell_grid: ['Hex-Cell Grid', '六角格棋盤'],
        honeycomb: ['Honeycomb Lattice', '蜂巢圖晶格'],
        simple_cubic: ['Simple Cubic', '簡立方晶格'],
        bcc: ['BCC', '體心立方'],
        fcc: ['FCC', '面心立方'],
        hcp: ['HCP', '六方最密堆積']
    },
    boundaries: {
        hard: ['Hard Boundary', '硬邊界'],
        periodic: ['Periodic Gluing', '週期黏合'],
        reflective: ['Reflective Boundary', '反射邊界'],
        random: ['Random Boundary', '隨機邊界'],
        twisted: ['Twisted Gluing', '扭轉黏合']
    }
});
