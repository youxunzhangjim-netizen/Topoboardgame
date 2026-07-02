const SQRT3 = Math.sqrt(3);
const HEX_ANGLES = Object.freeze(Array.from({ length: 6 }, (_, index) => (Math.PI / 180) * (60 * index)));

function clampBoardSize(value) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function coordKey(coord) {
  return Array.isArray(coord) ? coord.join(',') : '';
}

function pushNeighbor(neighbors, seen, coord, width, height) {
  if (!Array.isArray(coord)) return;
  if (coord[0] < 0 || coord[0] >= width || coord[1] < 0 || coord[1] >= height) return;
  const key = coordKey(coord);
  if (seen.has(key)) return;
  seen.add(key);
  neighbors.push([...coord]);
}

function coordFromIndex(index, width, height = width) {
  const boardWidth = clampBoardSize(width);
  const boardHeight = clampBoardSize(height);
  const count = boardWidth * boardHeight;
  if (!Number.isInteger(index) || index < 0 || index >= count) return null;
  return [index % boardWidth, Math.floor(index / boardWidth)];
}

function pointKey(point) {
  return `${point.x.toFixed(6)},${point.y.toFixed(6)}`;
}

function cellCenter(q, r) {
  return {
    x: 1 + 1.5 * q,
    y: SQRT3 * (0.5 + r + (q % 2) * 0.5)
  };
}

function cellVertices(q, r) {
  const center = cellCenter(q, r);
  return HEX_ANGLES.map((angle) => ({
    x: center.x + Math.cos(angle),
    y: center.y + Math.sin(angle)
  }));
}

function boundsFromPoints(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs, 0),
    maxX: Math.max(...xs, 1),
    minY: Math.min(...ys, 0),
    maxY: Math.max(...ys, 1)
  };
}

function cellPatchDimensions(width, height = width) {
  const boardWidth = clampBoardSize(width);
  const boardHeight = clampBoardSize(height);
  const target = boardWidth * boardHeight;
  let best = null;
  const maxSide = Math.max(3, Math.ceil(Math.sqrt(target)) + 6);
  for (let columns = 2; columns <= maxSide; columns += 1) {
    for (let rows = 2; rows <= maxSide; rows += 1) {
      const graph = graphFromCells(columns, rows);
      const vertexCount = graph.vertices.size;
      if (vertexCount < target) continue;
      const rawWidth = 1.5 * (columns - 1) + 2;
      const rawHeight = SQRT3 * (rows + (columns > 1 ? 0.5 : 0));
      const aspectPenalty = Math.abs(rawWidth / rawHeight - 1);
      const extra = vertexCount - target;
      const overfillPenalty = extra / Math.max(1, target);
      const score = aspectPenalty * 4 + overfillPenalty;
      const candidate = { columns, rows, vertexCount, extra, aspectPenalty, overfillPenalty, score, graph };
      if (
        !best ||
        candidate.score < best.score ||
        (candidate.score === best.score && candidate.extra < best.extra) ||
        (candidate.score === best.score && candidate.extra === best.extra && candidate.aspectPenalty < best.aspectPenalty)
      ) {
        best = candidate;
      }
    }
  }
  return best || { columns: boardWidth, rows: boardHeight, graph: graphFromCells(boardWidth, boardHeight) };
}

function graphFromCells(columns, rows) {
  const vertices = new Map();
  const adjacency = new Map();
  const edgeSet = new Set();
  const cells = [];

  function ensureVertex(point) {
    const key = pointKey(point);
    if (!vertices.has(key)) {
      vertices.set(key, { key, point: { x: point.x, y: point.y } });
      adjacency.set(key, new Set());
    }
    return key;
  }

  for (let r = 0; r < rows; r += 1) {
    for (let q = 0; q < columns; q += 1) {
      const center = cellCenter(q, r);
      const points = cellVertices(q, r);
      const keys = points.map(ensureVertex);
      cells.push({ q, r, center, vertices: points, keys });
      for (let index = 0; index < keys.length; index += 1) {
        const a = keys[index];
        const b = keys[(index + 1) % keys.length];
        const edgeKey = [a, b].sort().join('|');
        if (edgeSet.has(edgeKey)) continue;
        edgeSet.add(edgeKey);
        adjacency.get(a)?.add(b);
        adjacency.get(b)?.add(a);
      }
    }
  }
  return { vertices, adjacency, cells };
}

function buildHoneycombPatch(width, height = width) {
  const boardWidth = clampBoardSize(width);
  const boardHeight = clampBoardSize(height);
  const target = boardWidth * boardHeight;
  const { graph } = cellPatchDimensions(boardWidth, boardHeight);
  const graphBounds = boundsFromPoints(graph.cells.flatMap((cell) => cell.vertices));
  const centerX = (graphBounds.minX + graphBounds.maxX) / 2;
  const centerY = (graphBounds.minY + graphBounds.maxY) / 2;
  const selected = [...graph.vertices.values()]
    .map((vertex) => ({
      ...vertex,
      score: (vertex.point.x - centerX) ** 2 + (vertex.point.y - centerY) ** 2
    }))
    .sort((a, b) => (a.score - b.score) || (a.point.y - b.point.y) || (a.point.x - b.point.x))
    .slice(0, target)
    .sort((a, b) => (a.point.y - b.point.y) || (a.point.x - b.point.x))
    .map((vertex, index) => ({
      ...vertex,
      coord: coordFromIndex(index, boardWidth, boardHeight)
    }));

  const vertexByCoord = new Map(selected.map((vertex) => [coordKey(vertex.coord), vertex]));
  const coordByVertexKey = new Map(selected.map((vertex) => [vertex.key, vertex.coord]));
  const bounds = graphBounds;
  const neighborsByCoord = new Map();
  for (const vertex of selected) {
    const key = coordKey(vertex.coord);
    const neighbors = [];
    const seen = new Set();
    for (const neighborKey of graph.adjacency.get(vertex.key) || []) {
      const coord = coordByVertexKey.get(neighborKey);
      if (!coord) continue;
      const nextKey = coordKey(coord);
      if (seen.has(nextKey)) continue;
      seen.add(nextKey);
      neighbors.push([...coord]);
    }
    neighborsByCoord.set(key, neighbors);
  }

  return {
    boardWidth,
    boardHeight,
    cells: graph.cells,
    vertexByCoord,
    neighborsByCoord,
    bounds
  };
}

const patchCache = new Map();

function honeycombPatch(width, height = width) {
  const key = `${clampBoardSize(width)}x${clampBoardSize(height)}`;
  if (!patchCache.has(key)) patchCache.set(key, buildHoneycombPatch(width, height));
  return patchCache.get(key);
}

export function honeycombPoint(coord, width, height = width) {
  const vertex = honeycombPatch(width, height).vertexByCoord.get(coordKey(coord));
  return vertex ? { ...vertex.point } : null;
}

export function honeycombBounds(width, height = width) {
  return { ...honeycombPatch(width, height).bounds };
}

export function honeycombCells(width, height = width) {
  return honeycombPatch(width, height).cells.map((cell) => ({
    center: { ...cell.center },
    vertices: cell.vertices.map((point) => ({ ...point }))
  }));
}

export function honeycombEdges(width, height = width) {
  const patch = honeycombPatch(width, height);
  const edges = [];
  const seen = new Set();
  for (const [coordText, vertex] of patch.vertexByCoord.entries()) {
    for (const neighbor of patch.neighborsByCoord.get(coordText) || []) {
      const neighborText = coordKey(neighbor);
      const edgeKey = [coordText, neighborText].sort().join('|');
      if (seen.has(edgeKey)) continue;
      const nextVertex = patch.vertexByCoord.get(neighborText);
      if (!nextVertex) continue;
      seen.add(edgeKey);
      edges.push({
        fromCoord: [...vertex.coord],
        toCoord: [...neighbor],
        from: { ...vertex.point },
        to: { ...nextVertex.point }
      });
    }
  }
  return edges;
}

export function honeycombNeighbors(coord, width, height = width, options = {}) {
  const boardWidth = clampBoardSize(width);
  const boardHeight = clampBoardSize(height);
  const neighbors = [];
  const seen = new Set();
  for (const neighbor of honeycombPatch(boardWidth, boardHeight).neighborsByCoord.get(coordKey(coord)) || []) {
    pushNeighbor(neighbors, seen, neighbor, boardWidth, boardHeight);
  }
  if (options.wrapX) {
    if (coord[0] === 0) pushNeighbor(neighbors, seen, [boardWidth - 1, coord[1]], boardWidth, boardHeight);
    if (coord[0] === boardWidth - 1) pushNeighbor(neighbors, seen, [0, coord[1]], boardWidth, boardHeight);
  }
  if (options.wrapY) {
    if (coord[1] === 0) pushNeighbor(neighbors, seen, [coord[0], boardHeight - 1], boardWidth, boardHeight);
    if (coord[1] === boardHeight - 1) pushNeighbor(neighbors, seen, [coord[0], 0], boardWidth, boardHeight);
  }
  return neighbors;
}
