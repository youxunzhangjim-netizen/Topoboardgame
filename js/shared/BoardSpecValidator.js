import { BOARD_PLAYABLE_KINDS, BOARD_SPEC_SCHEMA, buildAdjacencyMap } from './BoardSpec.js';
import { isPerformanceDebugEnabled, recordWarning, startTimer, endTimer } from './PerformanceAudit.js';
import { getBoardSafetyLimit } from './SteamSafetyLimits.js';

export const STEAM_SAFE_SITE_LIMITS = Object.freeze(
    Object.fromEntries([1, 2, 3, 4].map((dimension) => [
        dimension,
        getBoardSafetyLimit(dimension).maxPlayableSites
    ]))
);

function edgeKey(a, b) {
    return String(a) < String(b) ? `${a}|${b}` : `${b}|${a}`;
}

function components(adjacency) {
    const remaining = new Set(adjacency.keys());
    let count = 0;
    while (remaining.size) {
        count += 1;
        const stack = [remaining.values().next().value];
        remaining.delete(stack[0]);
        while (stack.length) {
            for (const neighbor of adjacency.get(stack.pop()) || []) {
                if (remaining.delete(neighbor)) stack.push(neighbor);
            }
        }
    }
    return count;
}

function sublattice(site) {
    if (site?.coord?.sub != null) return String(site.coord.sub);
    return site?.tags?.find((tag) => /^sublattice:/i.test(tag))?.split(':')[1] || '';
}

export function validateBoardSpec(boardSpec, options = {}) {
    const timer = startTimer('validateBoardSpec');
    const errors = [];
    const warnings = [];
    const sites = Array.isArray(boardSpec?.sites) ? boardSpec.sites : [];
    const edges = Array.isArray(boardSpec?.edges) ? boardSpec.edges : [];
    if (boardSpec?.schema !== BOARD_SPEC_SCHEMA) errors.push(`schema must be "${BOARD_SPEC_SCHEMA}".`);
    if (!boardSpec?.id) errors.push('id is required.');
    if (![1, 2, 3, 4].includes(Number(boardSpec?.dimension))) errors.push('dimension must be 1, 2, 3, or 4.');
    if (!BOARD_PLAYABLE_KINDS.includes(boardSpec?.playableKind)) errors.push('playableKind is invalid.');
    for (const field of ['space', 'lattice', 'boundary']) {
        if (!boardSpec?.[field]?.id || !boardSpec?.[field]?.nameEn || !boardSpec?.[field]?.nameZh) {
            errors.push(`${field} metadata requires id, nameEn, and nameZh.`);
        }
    }

    const ids = new Set();
    for (const [index, site] of sites.entries()) {
        if (!site?.id) errors.push(`Site ${index} has no id.`);
        else if (ids.has(String(site.id))) errors.push(`Duplicate site id: ${site.id}.`);
        else ids.add(String(site.id));
        if (site?.coord == null) warnings.push(`Site ${site?.id || index} has no logical coord.`);
    }

    const seenEdges = new Set();
    for (const [index, edge] of edges.entries()) {
        const source = String(edge?.source);
        const target = String(edge?.target);
        if (!ids.has(source)) errors.push(`Edge ${index} references missing source ${source}.`);
        if (!ids.has(target)) errors.push(`Edge ${index} references missing target ${target}.`);
        if (source === target && !options.allowSelfLoops) errors.push(`Self-loop at ${source}.`);
        const key = edgeKey(source, target);
        if (seenEdges.has(key)) errors.push(`Duplicate undirected edge ${key}.`);
        seenEdges.add(key);
    }

    const adjacency = buildAdjacencyMap(boardSpec);
    for (const [id, neighbors] of adjacency) {
        if (neighbors.size !== new Set(neighbors).size) errors.push(`Duplicate neighbors at ${id}.`);
        for (const neighbor of neighbors) {
            if (!adjacency.get(neighbor)?.has(id)) errors.push(`Asymmetric neighbor relation ${id} -> ${neighbor}.`);
        }
    }

    const degrees = [...adjacency.values()].map((neighbors) => neighbors.size);
    const connectedComponents = components(adjacency);
    const stats = {
        siteCount: sites.length,
        edgeCount: edges.length,
        minDegree: degrees.length ? Math.min(...degrees) : 0,
        maxDegree: degrees.length ? Math.max(...degrees) : 0,
        averageDegree: degrees.length ? degrees.reduce((sum, value) => sum + value, 0) / degrees.length : 0,
        connectedComponents,
        hasDrawPositions: sites.length > 0 && sites.every((site) => Number.isFinite(site?.draw?.x) && Number.isFinite(site?.draw?.y)),
        has3DPositions: sites.length > 0 && sites.every((site) =>
            Number.isFinite(site?.position3D?.x) && Number.isFinite(site?.position3D?.y) && Number.isFinite(site?.position3D?.z))
    };

    if (!options.allowDisconnected && sites.length && connectedComponents !== 1) {
        errors.push(`Graph has ${connectedComponents} connected components.`);
    }
    const drawPositionsRequired = options.drawPositionsRequired
        || options.requireDrawPositions
        || options.renderer === '2d';
    const positions3DRequired = options.positions3DRequired
        || options.position3DRequired
        || options.require3DPositions
        || options.renderer === '3d';
    if (drawPositionsRequired && !stats.hasDrawPositions) {
        errors.push('Draw positions are required for every site.');
    }
    if (positions3DRequired && !stats.has3DPositions) {
        errors.push('3D positions are required for every site.');
    }
    const debug = options.debug ?? isPerformanceDebugEnabled();
    const siteLimit = options.maxSites ?? STEAM_SAFE_SITE_LIMITS[boardSpec?.dimension] ?? 10000;
    if (!debug && sites.length > siteLimit) errors.push(`Board has ${sites.length} sites; Steam-safe limit is ${siteLimit}.`);

    if (options.expectedSiteCount != null && stats.siteCount !== options.expectedSiteCount) {
        errors.push(`Expected ${options.expectedSiteCount} sites; found ${stats.siteCount}.`);
    }
    if (options.expectedEdgeCount != null && stats.edgeCount !== options.expectedEdgeCount) {
        errors.push(`Expected ${options.expectedEdgeCount} edges; found ${stats.edgeCount}.`);
    }
    if (options.expectedDegree != null) {
        for (const [id, neighbors] of adjacency) if (neighbors.size !== options.expectedDegree) {
            errors.push(`Site ${id} has degree ${neighbors.size}; expected ${options.expectedDegree}.`);
        }
    }
    const degreeRange = options.degreeRange || options.allowedDegreeRange;
    if (Array.isArray(degreeRange)) {
        for (const [id, neighbors] of adjacency) if (neighbors.size < degreeRange[0] || neighbors.size > degreeRange[1]) {
            errors.push(`Site ${id} has degree ${neighbors.size}; expected ${degreeRange[0]}-${degreeRange[1]}.`);
        }
    }
    if (options.bipartite) {
        const colors = new Map();
        for (const root of adjacency.keys()) {
            if (colors.has(root)) continue;
            colors.set(root, 0);
            const queue = [root];
            while (queue.length) {
                const id = queue.shift();
                for (const neighbor of adjacency.get(id) || []) {
                    if (!colors.has(neighbor)) {
                        colors.set(neighbor, 1 - colors.get(id));
                        queue.push(neighbor);
                    } else if (colors.get(neighbor) === colors.get(id)) {
                        errors.push(`Graph is not bipartite at ${id}-${neighbor}.`);
                    }
                }
            }
        }
    }
    if (options.noSameSublatticeEdges) {
        const byId = new Map(sites.map((site) => [String(site.id), site]));
        for (const edge of edges) {
            const a = sublattice(byId.get(String(edge.source)));
            const b = sublattice(byId.get(String(edge.target)));
            if (a && b && a === b) errors.push(`Same-sublattice edge ${edgeKey(edge.source, edge.target)}.`);
        }
    }
    if (options.targetZonesRequired) {
        const targetZones = boardSpec?.targetZones;
        const hasTargetZones = targetZones
            && typeof targetZones === 'object'
            && Object.keys(targetZones).length > 0;
        if (!hasTargetZones) errors.push('targetZones are required.');
    }
    if (options.directionsRequired && !boardSpec?.directions?.length) errors.push('directions are required.');

    const result = { ok: errors.length === 0, errors, warnings, stats };
    endTimer(timer, { category: 'board validation', name: boardSpec?.id || 'unknown', details: stats });
    if (!result.ok && isPerformanceDebugEnabled()) {
        recordWarning('board validation', `BoardSpec ${boardSpec?.id || 'unknown'} failed validation.`, result);
    }
    return result;
}
