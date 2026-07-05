import { buildAdjacencyMap, undirectedEdgeKey } from './VertexGraphBoardValidator.js';

const mod = (value, modulus) => ((value % modulus) + modulus) % modulus;
const siteId = (x, y) => `k:${x}:${y}`;

export function normalizeKleinBottleSquare(coord, width, height) {
    const W = Math.floor(Number(width));
    const H = Math.floor(Number(height));
    if (!Number.isInteger(W) || W < 3 || !Number.isInteger(H) || H < 3) {
        throw new RangeError('Klein bottle square vertex boards require width and height >= 3.');
    }
    const sourceX = Math.trunc(Number(coord?.x) || 0);
    const sourceY = Math.trunc(Number(coord?.y) || 0);
    const crossings = Math.floor(sourceY / H);
    const y = mod(sourceY, H);
    let x = mod(sourceX, W);
    if (mod(crossings, 2) === 1) x = W - 1 - x;
    return { x, y };
}

export function createKleinBottleVertexGraph(width, height) {
    const W = Math.floor(Number(width));
    const H = Math.floor(Number(height));
    if (!Number.isInteger(W) || W < 3 || !Number.isInteger(H) || H < 3) {
        throw new RangeError('Klein bottle square vertex boards require width and height >= 3.');
    }
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
    // Topology is defined by logical coordinates and edges, not by visual distance.
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
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const neighbor = normalizeKleinBottleSquare({ x: x + dx, y: y + dy }, W, H);
            add(site.id, siteId(neighbor.x, neighbor.y));
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
            label: 'Klein Bottle Square Vertex Go',
            space: 'Klein Bottle',
            lattice: 'Square Vertex Lattice',
            boundary: 'periodic x, flipped y gluing',
            boundaryGluing: 'periodic x, flipped y gluing',
            zh: {
                label: 'Klein 瓶方格頂點棋盤',
                space: 'Klein 瓶',
                lattice: '方格頂點晶格',
                boundary: 'x 方向週期黏合，y 方向反向黏合'
            }
        }
    };
    board.adjacency = buildAdjacencyMap(sites, edges);
    board.siteById = new Map(sites.map((site) => [site.id, site]));
    board.siteByGameCoord = new Map(sites.map((site) => [site.gameCoord.join(','), site]));
    board.indexById = new Map(sites.map((site, index) => [site.id, index]));
    board.neighbors = (id) => [...(board.adjacency.get(String(id)) || [])];
    return board;
}
