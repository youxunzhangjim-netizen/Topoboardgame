import { buildAdjacencyMap, undirectedEdgeKey } from './VertexGraphBoardValidator.js';

const mod = (value, modulus) => ((value % modulus) + modulus) % modulus;
const siteId = (x, y) => `k:${x}:${y}`;

function normalize(x, y, width, height) {
    const crossings = Math.floor(y / height);
    const ny = mod(y, height);
    let nx = mod(x, width);
    if (mod(crossings, 2) === 1) nx = width - 1 - nx;
    return [nx, ny];
}

export function createKleinBottleVertexGraph(width, height) {
    const W = Math.max(3, Math.floor(Number(width) || 3));
    const H = Math.max(3, Math.floor(Number(height) || 3));
    const sites = [];
    for (let y = 0; y < H; y += 1) {
        for (let x = 0; x < W; x += 1) {
            sites.push({
                id: siteId(x, y),
                coord: { x, y },
                gameCoord: [x, y],
                draw: { x, y }
            });
        }
    }
    const edges = [];
    const seen = new Set();
    const add = (a, b) => {
        const key = undirectedEdgeKey(a, b);
        if (seen.has(key)) return;
        seen.add(key);
        edges.push({ source: a, target: b });
    };
    for (const site of sites) {
        const { x, y } = site.coord;
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
            const [nx, ny] = normalize(x + dx, y + dy, W, H);
            add(site.id, siteId(nx, ny));
        }
    }
    const board = {
        width: W,
        height: H,
        sites,
        edges,
        playableKind: 'vertex',
        hitRadius: 0.42,
        metadata: {
            boardType: 'vertex_graph',
            space: 'Klein Bottle',
            lattice: 'Square Vertex Graph',
            boundary: 'Periodic/Twisted Gluing',
            zh: { space: 'Klein 瓶', lattice: '方形頂點圖', boundary: '週期／扭轉黏合' }
        }
    };
    board.adjacency = buildAdjacencyMap(sites, edges);
    board.siteById = new Map(sites.map((site) => [site.id, site]));
    board.siteByGameCoord = new Map(sites.map((site) => [site.gameCoord.join(','), site]));
    board.indexById = new Map(sites.map((site, index) => [site.id, index]));
    board.neighbors = (id) => [...(board.adjacency.get(String(id)) || [])];
    return board;
}
