import { buildAdjacencyMap, undirectedEdgeKey } from './VertexGraphBoardValidator.js';
import { endTimer, estimateMemoryRisk, recordMetric, startTimer } from './PerformanceAudit.js';

const SQRT3 = Math.sqrt(3);
const mod = (value, modulus) => ((value % modulus) + modulus) % modulus;
const siteId = (u, v, sub) => `h:${u}:${v}:${sub}`;

export const BOARD_TYPE_IDS = Object.freeze({
    hexCellGrid: 'hex_cell_grid',
    honeycombGraph: 'honeycomb_graph'
});

export const BOARD_TYPE_LABELS = Object.freeze({
    hex_cell_grid: Object.freeze({
        en: 'Hex-Cell Grid (6-neighbor)',
        zh: '六角格棋盤（6 鄰接）'
    }),
    honeycomb_graph: Object.freeze({
        en: 'Honeycomb Graph (3-neighbor)',
        zh: '蜂巢圖晶格（3 鄰接）'
    })
});

function createHoneycombGraph(width, height, wrapU, wrapV) {
    const timer = startTimer(`honeycomb:${wrapU ? 'periodic-u' : 'hard-u'}:${wrapV ? 'periodic-v' : 'hard-v'}`);
    const W = Math.max(2, Math.floor(Number(width) || 2));
    const H = Math.max(2, Math.floor(Number(height) || 2));
    const sites = [];
    for (let v = 0; v < H; v += 1) {
        for (let u = 0; u < W; u += 1) {
            sites.push({
                id: siteId(u, v, 'A'),
                coord: { u, v, sub: 'A' },
                gameCoord: [u, v, 0],
                draw: { x: SQRT3 * (u + v / 2), y: 1.5 * v }
            });
            sites.push({
                id: siteId(u, v, 'B'),
                coord: { u, v, sub: 'B' },
                gameCoord: [u, v, 1],
                draw: { x: SQRT3 * (u + v / 2 + 0.5), y: 1.5 * v + 0.5 }
            });
        }
    }

    // Topology is defined by logical coordinates and edges, not by visual distance.
    const edges = [];
    const seen = new Set();
    const addEdge = (a, b) => {
        const key = undirectedEdgeKey(a, b);
        if (seen.has(key)) return;
        seen.add(key);
        edges.push({ source: a, target: b });
    };
    for (let v = 0; v < H; v += 1) {
        for (let u = 0; u < W; u += 1) {
            const a = siteId(u, v, 'A');
            addEdge(a, siteId(u, v, 'B'));
            if (wrapU || u > 0) addEdge(a, siteId(mod(u - 1, W), v, 'B'));
            if (wrapV || v > 0) addEdge(a, siteId(u, mod(v - 1, H), 'B'));
        }
    }

    const metadata = wrapV
        ? {
            boardType: BOARD_TYPE_IDS.honeycombGraph,
            space: 'Torus T²',
            lattice: 'Honeycomb Graph',
            boundary: 'Periodic Gluing',
            boundaryGluing: 'Periodic Gluing',
            zh: { space: '環面 T²', lattice: '蜂巢圖晶格', boundary: '週期黏合' }
        }
        : {
            boardType: BOARD_TYPE_IDS.honeycombGraph,
            space: 'Cylinder',
            lattice: 'Honeycomb Graph',
            boundary: 'Periodic around u, hard at v ends',
            boundaryGluing: 'Periodic around u, hard at v ends',
            zh: { space: '圓柱', lattice: '蜂巢圖晶格', boundary: 'u 方向週期黏合，v 端為硬邊界' }
        };

    const board = { width: W, height: H, sites, edges, metadata, playableKind: 'vertex', hitRadius: 0.42 };
    board.adjacency = buildAdjacencyMap(sites, edges);
    board.siteById = new Map(sites.map((site) => [site.id, site]));
    board.siteByGameCoord = new Map(sites.map((site) => [site.gameCoord.join(','), site]));
    board.indexById = new Map(sites.map((site, index) => [site.id, index]));
    board.neighbors = (id) => [...(board.adjacency.get(String(id)) || [])];
    endTimer(timer, { category: 'board generation', name: wrapV ? 'honeycomb-torus' : 'honeycomb-cylinder' });
    recordMetric('board', 'honeycomb-sites', sites.length, { wrapU, wrapV });
    recordMetric('board', 'honeycomb-edges', edges.length, { wrapU, wrapV });
    estimateMemoryRisk({ sites: sites.length, edges: edges.length });
    return board;
}

export function createHoneycombTorusGraph(width, height) {
    return createHoneycombGraph(width, height, true, true);
}

export function createHoneycombCylinderGraph(width, height) {
    return createHoneycombGraph(width, height, true, false);
}

export function honeycombGraphSiteId(coord) {
    if (!Array.isArray(coord) || coord.length < 3) return '';
    return siteId(Number(coord[0]), Number(coord[1]), Number(coord[2]) === 0 ? 'A' : 'B');
}
