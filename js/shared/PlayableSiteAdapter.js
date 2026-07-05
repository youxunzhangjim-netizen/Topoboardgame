import { buildAdjacencyMap } from './BoardSpec.js';

const boardCache = new WeakMap();

function edgeUnitId(edge) {
    if (edge?.id != null) return String(edge.id);
    const a = String(edge?.source);
    const b = String(edge?.target);
    return a < b ? `edge:${a}|${b}` : `edge:${b}|${a}`;
}

function unitId(unit, playableKind) {
    return playableKind === 'edge' ? edgeUnitId(unit) : String(unit?.id);
}

function rawUnits(boardSpec) {
    if (!boardSpec) return [];
    if (boardSpec.playableKind === 'edge') return Array.isArray(boardSpec.edges) ? boardSpec.edges : [];
    if (boardSpec.playableKind === 'cell' && Array.isArray(boardSpec.cells)) return boardSpec.cells;
    return Array.isArray(boardSpec.sites) ? boardSpec.sites : [];
}

function buildCache(boardSpec) {
    if (!boardSpec || typeof boardSpec !== 'object') {
        return { units: [], byId: new Map(), adjacency: new Map(), minimumSpacing: 0 };
    }
    const cached = boardCache.get(boardSpec);
    const signature = `${boardSpec.playableKind}:${boardSpec.sites?.length || 0}:${boardSpec.cells?.length || 0}:${boardSpec.edges?.length || 0}`;
    if (cached?.signature === signature) return cached;

    const units = rawUnits(boardSpec);
    const byId = new Map(units.map((unit) => [unitId(unit, boardSpec.playableKind), unit]));
    const siteById = new Map((boardSpec.sites || []).map((site) => [String(site.id), site]));
    const adjacency = boardSpec.adjacency instanceof Map
        ? boardSpec.adjacency
        : buildAdjacencyMap(boardSpec);
    let minimumSpacing = Infinity;
    for (const [id, neighbors] of adjacency) {
        const source = drawPosition(boardSpec, byId.get(String(id)), siteById);
        if (!source) continue;
        for (const neighborId of neighbors || []) {
            const target = drawPosition(boardSpec, byId.get(String(neighborId)), siteById);
            if (!target) continue;
            const distance = Math.hypot(source.x - target.x, source.y - target.y);
            if (distance > 0 && distance < minimumSpacing) minimumSpacing = distance;
        }
    }
    const value = {
        signature,
        units,
        byId,
        siteById,
        adjacency,
        minimumSpacing: Number.isFinite(minimumSpacing) ? minimumSpacing : 0
    };
    boardCache.set(boardSpec, value);
    return value;
}

function drawPosition(boardSpec, unit, siteById = null) {
    if (!unit) return null;
    if (boardSpec?.playableKind === 'edge') {
        const sites = siteById || buildCache(boardSpec).siteById;
        const source = sites.get(String(unit.source));
        const target = sites.get(String(unit.target));
        const a = source?.draw || source?.position || source?.center;
        const b = target?.draw || target?.position || target?.center;
        if (!a || !b) return null;
        return { x: (Number(a.x) + Number(b.x)) / 2, y: (Number(a.y) + Number(b.y)) / 2 };
    }
    return unit.draw || unit.position || unit.center || null;
}

function occupiedStore(gameState) {
    if (!gameState) return null;
    if (gameState.stones instanceof Map) return gameState.stones;
    if (gameState.board instanceof Map) return gameState.board;
    if (gameState.pieces instanceof Map) return gameState.pieces;
    return null;
}

export function getPlayableUnits(boardSpec) {
    return [...buildCache(boardSpec).units];
}

export function getPlayableUnitIdFromMove(move) {
    if (move == null) return '';
    if (typeof move === 'string' || typeof move === 'number') return String(move);
    return String(move.unitId ?? move.siteId ?? move.cellId ?? move.edgeId ?? move.id ?? '');
}

export function getDrawPosition(boardSpec, unitIdValue) {
    const cache = buildCache(boardSpec);
    return drawPosition(boardSpec, cache.byId.get(String(unitIdValue)), cache.siteById);
}

export function getNeighborsForGame(boardSpec, unitIdValue) {
    const id = String(unitIdValue);
    const cache = buildCache(boardSpec);
    if (boardSpec?.playableKind !== 'edge') return [...(cache.adjacency.get(id) || [])];

    const edge = cache.byId.get(id);
    if (!edge) return [];
    const neighbors = [];
    for (const candidate of cache.units) {
        const candidateId = edgeUnitId(candidate);
        if (candidateId === id) continue;
        if (candidate.source === edge.source || candidate.source === edge.target
            || candidate.target === edge.source || candidate.target === edge.target) {
            neighbors.push(candidateId);
        }
    }
    return neighbors;
}

export function hitTestPlayableUnit(boardSpec, x, y, options = {}) {
    const cache = buildCache(boardSpec);
    const explicitThreshold = Number(options.threshold ?? options.hitRadius ?? boardSpec?.hitRadius);
    const threshold = Number.isFinite(explicitThreshold) && explicitThreshold > 0
        ? explicitThreshold
        : cache.minimumSpacing * 0.42;
    let best = null;
    for (const unit of cache.units) {
        const draw = drawPosition(boardSpec, unit, cache.siteById);
        if (!draw || !Number.isFinite(Number(draw.x)) || !Number.isFinite(Number(draw.y))) continue;
        const distance = Math.hypot(Number(x) - Number(draw.x), Number(y) - Number(draw.y));
        if (distance > threshold || (best && distance >= best.distance)) continue;
        best = {
            unitId: unitId(unit, boardSpec.playableKind),
            siteId: unitId(unit, boardSpec.playableKind),
            unit,
            site: unit,
            distance
        };
    }
    return best;
}

export function isPlayableUnitOccupied(gameState, unitIdValue) {
    const id = String(unitIdValue);
    const store = occupiedStore(gameState);
    if (store) return store.has(id) && store.get(id) != null && store.get(id) !== 0;
    const value = gameState?.siteStates?.[id]
        ?? gameState?.cellStates?.[id]
        ?? gameState?.edgeStates?.[id]
        ?? gameState?.board?.[id];
    return value != null && value !== 0 && value !== 'empty';
}

export function placePieceOnPlayableUnit(gameState, unitIdValue, player) {
    const id = String(unitIdValue);
    if (!id) return { ok: false, reason: 'missing_unit_id' };
    if (isPlayableUnitOccupied(gameState, id)) return { ok: false, reason: 'occupied', unitId: id };
    const store = occupiedStore(gameState);
    if (store) store.set(id, player);
    else {
        if (!gameState.siteStates || typeof gameState.siteStates !== 'object') gameState.siteStates = {};
        gameState.siteStates[id] = player;
    }
    return { ok: true, unitId: id, player };
}

// Topology is defined by logical coordinates and edges, not by visual distance.
export function clearPlayableSiteAdapterCache(boardSpec) {
    if (boardSpec && typeof boardSpec === 'object') boardCache.delete(boardSpec);
}
