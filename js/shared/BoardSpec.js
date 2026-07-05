export const BOARD_SPEC_SCHEMA = 'topoboard.board.v0';
export const BOARD_PLAYABLE_KINDS = Object.freeze(['cell', 'vertex', 'edge', 'mixed']);

function clone(value) {
    if (value == null) return value;
    try { return structuredClone(value); } catch { return JSON.parse(JSON.stringify(value)); }
}

function textMetadata(raw, fallbackId = 'unknown') {
    return {
        id: String(raw?.id || fallbackId),
        nameEn: String(raw?.nameEn || raw?.name || fallbackId),
        nameZh: String(raw?.nameZh || raw?.zhName || raw?.nameEn || raw?.name || fallbackId),
        ...(raw?.technicalName ? { technicalName: String(raw.technicalName) } : {})
    };
}

function normalizeSite(site, index) {
    return {
        id: String(site?.id ?? `site:${index}`),
        coord: clone(site?.coord ?? site?.gameCoord ?? { index }),
        ...(site?.draw ? { draw: { x: Number(site.draw.x), y: Number(site.draw.y) } } : {}),
        ...(site?.position3D || site?.position ? {
            position3D: {
                x: Number((site.position3D || site.position).x),
                y: Number((site.position3D || site.position).y),
                z: Number((site.position3D || site.position).z)
            }
        } : {}),
        ...(Array.isArray(site?.tags) ? { tags: site.tags.map(String) } : {})
    };
}

function normalizeEdge(edge) {
    return {
        source: String(edge?.source),
        target: String(edge?.target),
        ...(edge?.dir ? { dir: String(edge.dir) } : {}),
        ...(edge?.seam ? { seam: true } : {}),
        ...(Array.isArray(edge?.tags) ? { tags: edge.tags.map(String) } : {})
    };
}

export function createBoardSpec(raw = {}) {
    return {
        schema: BOARD_SPEC_SCHEMA,
        id: String(raw.id || 'board:unnamed'),
        nameEn: String(raw.nameEn || raw.name || raw.id || 'Unnamed Board'),
        nameZh: String(raw.nameZh || raw.zhName || raw.nameEn || raw.name || raw.id || '未命名棋盤'),
        dimension: Number(raw.dimension || 2),
        playableKind: BOARD_PLAYABLE_KINDS.includes(raw.playableKind) ? raw.playableKind : 'vertex',
        space: textMetadata(raw.space, 'space:unknown'),
        lattice: textMetadata(raw.lattice, 'lattice:unknown'),
        boundary: {
            ...textMetadata(raw.boundary, 'boundary:unknown'),
            ...(raw.boundary?.gluing ? { gluing: clone(raw.boundary.gluing) } : {})
        },
        sites: (Array.isArray(raw.sites) ? raw.sites : []).map(normalizeSite),
        edges: (Array.isArray(raw.edges) ? raw.edges : []).map(normalizeEdge),
        ...(Array.isArray(raw.directions) ? { directions: raw.directions.map(String) } : {}),
        ...(raw.targetZones ? { targetZones: clone(raw.targetZones) } : {}),
        ...(raw.metadata ? { metadata: clone(raw.metadata) } : {})
    };
}

function edgesFromAdjacency(legacyBoard, sites) {
    const adjacency = legacyBoard?.adjacency;
    if (!adjacency) return [];
    const entries = adjacency instanceof Map ? [...adjacency.entries()] : Object.entries(adjacency);
    const ids = new Set(sites.map((site) => String(site.id)));
    const seen = new Set();
    const edges = [];
    for (const [sourceRaw, neighborsRaw] of entries) {
        const source = String(sourceRaw);
        for (const targetRaw of neighborsRaw || []) {
            const target = String(targetRaw);
            const key = source < target ? `${source}|${target}` : `${target}|${source}`;
            if (!ids.has(source) || !ids.has(target) || seen.has(key)) continue;
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
            : [];
    const edges = Array.isArray(legacyBoard.edges) ? legacyBoard.edges : edgesFromAdjacency(legacyBoard, sites);
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
        metadata: { legacy: true, ...(legacyBoard.metadata || {}), ...(metadata.metadata || {}) }
    });
}

export function getSite(boardSpec, siteId) {
    return boardSpec?.sites?.find((site) => site.id === String(siteId)) || null;
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
        r2: ['Euclidean Plane R²', '歐氏平面 R²'],
        r3: ['Euclidean 3-Space R³', '歐氏三維空間 R³'],
        r4: ['Euclidean 4-Space R⁴', '歐氏四維空間 R⁴'],
        t2: ['Torus T²', '環面 T²'],
        s2: ['Sphere S²', '球面 S²'],
        mobius: ['Möbius Strip', 'Möbius 帶'],
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
