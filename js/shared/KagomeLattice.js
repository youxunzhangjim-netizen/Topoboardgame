const SQRT3 = Math.sqrt(3);

const BASIS = Object.freeze([
  Object.freeze([0, 0]),
  Object.freeze([0.5, 0]),
  Object.freeze([0.25, SQRT3 / 4])
]);

function clampBoardSize(value) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

export function kagomeLayout(width, height = width) {
  const boardWidth = clampBoardSize(width);
  const boardHeight = clampBoardSize(height);
  const siteCount = boardWidth * boardHeight;
  return { boardWidth, boardHeight, siteCount };
}

function coordFromIndex(index, width, height = width) {
  const boardWidth = clampBoardSize(width);
  const boardHeight = clampBoardSize(height);
  const siteCount = boardWidth * boardHeight;
  if (!Number.isInteger(index) || index < 0 || index >= siteCount) return null;
  return [index % boardWidth, Math.floor(index / boardWidth)];
}

function coordKey(coord) {
  return Array.isArray(coord) ? coord.join(',') : '';
}

function indexFromCoord(coord, width, height = width) {
  if (!Array.isArray(coord)) return -1;
  const boardWidth = clampBoardSize(width);
  const boardHeight = clampBoardSize(height);
  const x = Math.floor(Number(coord[0]));
  const y = Math.floor(Number(coord[1]));
  if (x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) return -1;
  return y * boardWidth + x;
}

function sourceKey(cellX, cellY, site) {
  return `${cellX},${cellY},${site}`;
}

function sourcePoint(cellX, cellY, site) {
  const basis = BASIS[site];
  return {
    x: cellX + cellY * 0.5 + basis[0],
    y: cellY * SQRT3 / 2 + basis[1]
  };
}

function sourceNeighborInfos(cellX, cellY, site) {
  if (site === 0) {
    return [
      [cellX, cellY, 1],
      [cellX - 1, cellY, 1],
      [cellX, cellY, 2],
      [cellX, cellY - 1, 2]
    ];
  }
  if (site === 1) {
    return [
      [cellX, cellY, 0],
      [cellX + 1, cellY, 0],
      [cellX, cellY, 2],
      [cellX + 1, cellY - 1, 2]
    ];
  }
  return [
    [cellX, cellY, 0],
    [cellX, cellY + 1, 0],
    [cellX, cellY, 1],
    [cellX - 1, cellY + 1, 1]
  ];
}

function buildSourceNodes(targetCount, padding = 8) {
  const radius = Math.max(5, Math.ceil(Math.sqrt(targetCount / 2)) + padding);
  const nodes = [];
  for (let cellY = -radius; cellY <= radius; cellY += 1) {
    for (let cellX = -radius; cellX <= radius; cellX += 1) {
      for (let site = 0; site < 3; site += 1) {
        const point = sourcePoint(cellX, cellY, site);
        nodes.push({
          key: sourceKey(cellX, cellY, site),
          cellX,
          cellY,
          site,
          point,
          neighborKeys: sourceNeighborInfos(cellX, cellY, site).map((item) => sourceKey(...item))
        });
      }
    }
  }
  const minX = Math.min(...nodes.map((node) => node.point.x));
  const maxX = Math.max(...nodes.map((node) => node.point.x));
  const minY = Math.min(...nodes.map((node) => node.point.y));
  const maxY = Math.max(...nodes.map((node) => node.point.y));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  for (const node of nodes) {
    const dx = node.point.x - centerX;
    const dy = node.point.y - centerY;
    node.score = dx * dx + dy * dy;
  }
  nodes.sort((a, b) => (a.score - b.score) || (a.point.y - b.point.y) || (a.point.x - b.point.x));
  return nodes;
}

function selectedDegree(node, selectedKeys) {
  return node.neighborKeys.reduce((count, key) => count + (selectedKeys.has(key) ? 1 : 0), 0);
}

function selectCompactNodes(candidates, targetCount) {
  const selectedKeys = new Set(candidates.slice(0, targetCount).map((node) => node.key));
  for (let pass = 0; pass < 12; pass += 1) {
    const selected = candidates.filter((node) => selectedKeys.has(node.key));
    const leaf = selected
      .filter((node) => selectedDegree(node, selectedKeys) < 2)
      .sort((a, b) => (b.score - a.score) || (b.point.y - a.point.y) || (b.point.x - a.point.x))[0];
    if (!leaf) break;
    const replacement = candidates.find((node) => {
      if (selectedKeys.has(node.key)) return false;
      const nextKeys = new Set(selectedKeys);
      nextKeys.delete(leaf.key);
      return selectedDegree(node, nextKeys) >= 2;
    });
    if (!replacement) break;
    selectedKeys.delete(leaf.key);
    selectedKeys.add(replacement.key);
  }
  return candidates
    .filter((node) => selectedKeys.has(node.key))
    .sort((a, b) => (a.point.y - b.point.y) || (a.point.x - b.point.x));
}

function buildKagomePatch(width, height = width) {
  const layout = kagomeLayout(width, height);
  const candidates = buildSourceNodes(layout.siteCount, 9);
  const nodes = selectCompactNodes(candidates, layout.siteCount)
    .map((node, index) => ({
      ...node,
      coord: coordFromIndex(index, layout.boardWidth, layout.boardHeight)
    }));
  const nodeByCoord = new Map(nodes.map((node) => [coordKey(node.coord), node]));
  const coordBySource = new Map(nodes.map((node) => [node.key, node.coord]));
  const bounds = boundsFromPoints(nodes.map((node) => node.point));
  return { layout, nodes, nodeByCoord, coordBySource, bounds };
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

const patchCache = new Map();

function kagomePatch(width, height = width) {
  const key = `${clampBoardSize(width)}x${clampBoardSize(height)}`;
  if (!patchCache.has(key)) patchCache.set(key, buildKagomePatch(width, height));
  return patchCache.get(key);
}

export function kagomePoint(coord, width, height = width) {
  const node = kagomePatch(width, height).nodeByCoord.get(coordKey(coord));
  return node ? { ...node.point } : null;
}

export function kagomeBounds(width, height = width) {
  return { ...kagomePatch(width, height).bounds };
}

export function kagomeNeighbors(coord, width, height = width, options = {}) {
  const patch = kagomePatch(width, height);
  const node = patch.nodeByCoord.get(coordKey(coord));
  if (!node) return [];
  const neighbors = [];
  const seen = new Set();
  for (const source of node.neighborKeys) {
    const neighbor = patch.coordBySource.get(source);
    if (!neighbor) continue;
    const key = coordKey(neighbor);
    if (seen.has(key) || key === coordKey(coord)) continue;
    seen.add(key);
    neighbors.push([...neighbor]);
  }
  if (!neighbors.length && (options.wrapX || options.wrapY)) {
    return [];
  }
  return neighbors;
}

function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function canonicalCycle(cycle) {
  const rotations = [];
  for (let index = 0; index < cycle.length; index += 1) {
    rotations.push([...cycle.slice(index), ...cycle.slice(0, index)].join(','));
  }
  const reversed = [...cycle].reverse();
  for (let index = 0; index < reversed.length; index += 1) {
    rotations.push([...reversed.slice(index), ...reversed.slice(0, index)].join(','));
  }
  return rotations.sort()[0];
}

function buildFaceSourceGraph(targetCount) {
  const sourceNodes = buildSourceNodes(Math.max(targetCount * 4, 64), 12);
  const points = new Map();
  const adjacency = new Map();
  for (const node of sourceNodes) {
    points.set(node.key, { ...node.point, source: node });
    adjacency.set(node.key, new Set());
  }
  for (const node of sourceNodes) {
    for (const neighborKey of node.neighborKeys) {
      if (!points.has(neighborKey)) continue;
      adjacency.get(node.key)?.add(neighborKey);
      adjacency.get(neighborKey)?.add(node.key);
    }
  }
  return { points, adjacency };
}

function detectKagomeFaces(targetCount) {
  const { points, adjacency } = buildFaceSourceGraph(targetCount);
  const sortedNeighbors = new Map();
  for (const [key, neighbors] of adjacency.entries()) {
    const origin = points.get(key);
    sortedNeighbors.set(key, [...neighbors].sort((a, b) => {
      const pa = points.get(a);
      const pb = points.get(b);
      const aa = Math.atan2(pa.y - origin.y, pa.x - origin.x);
      const ab = Math.atan2(pb.y - origin.y, pb.x - origin.x);
      return aa - ab;
    }));
  }

  const visited = new Set();
  const facesByKey = new Map();
  for (const start of adjacency.keys()) {
    for (const next of adjacency.get(start)) {
      const directedKey = `${start}>${next}`;
      if (visited.has(directedKey)) continue;
      const cycle = [];
      let a = start;
      let b = next;
      let guard = 0;
      while (guard < 64) {
        visited.add(`${a}>${b}`);
        cycle.push(a);
        const neighbors = sortedNeighbors.get(b) || [];
        const reverseIndex = neighbors.indexOf(a);
        if (reverseIndex < 0) break;
        const c = neighbors[(reverseIndex - 1 + neighbors.length) % neighbors.length];
        a = b;
        b = c;
        guard += 1;
        if (a === start && b === next) break;
      }
      if (a !== start || b !== next || cycle.length < 3) continue;
      const vertices = cycle.map((key) => points.get(key)).filter(Boolean);
      const area = polygonArea(vertices);
      if (area <= 1e-5) continue;
      const unique = [...new Set(cycle)];
      if (unique.length !== cycle.length) continue;
      if (cycle.length !== 3 && cycle.length !== 6) continue;
      const canonical = canonicalCycle(cycle);
      if (facesByKey.has(canonical)) continue;
      const center = vertices.reduce((sum, point) => ({
        x: sum.x + point.x / vertices.length,
        y: sum.y + point.y / vertices.length
      }), { x: 0, y: 0 });
      facesByKey.set(canonical, {
        key: canonical,
        cycle,
        vertices: vertices.map((point) => ({ x: point.x, y: point.y })),
        center,
        sides: cycle.length,
        area
      });
    }
  }
  return [...facesByKey.values()];
}

function faceAdjacencyFor(faces) {
  const edgeToFaces = new Map();
  for (const face of faces) {
    for (let index = 0; index < face.cycle.length; index += 1) {
      const a = face.cycle[index];
      const b = face.cycle[(index + 1) % face.cycle.length];
      const edgeKey = [a, b].sort().join('|');
      if (!edgeToFaces.has(edgeKey)) edgeToFaces.set(edgeKey, []);
      edgeToFaces.get(edgeKey).push(face.key);
    }
  }
  const neighbors = new Map(faces.map((face) => [face.key, new Set()]));
  for (const shared of edgeToFaces.values()) {
    if (shared.length < 2) continue;
    for (const a of shared) {
      for (const b of shared) {
        if (a !== b) neighbors.get(a)?.add(b);
      }
    }
  }
  return neighbors;
}

function selectedFaceDegree(face, selectedKeys, sourceNeighbors) {
  return [...(sourceNeighbors.get(face.key) || [])].reduce((count, key) => count + (selectedKeys.has(key) ? 1 : 0), 0);
}

function selectCompactFaces(allFaces, targetCount) {
  const bounds = boundsFromPoints(allFaces.map((face) => face.center));
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  for (const face of allFaces) {
    const dx = face.center.x - centerX;
    const dy = face.center.y - centerY;
    face.score = dx * dx + dy * dy;
  }
  allFaces.sort((a, b) => (a.score - b.score) || (a.center.y - b.center.y) || (a.center.x - b.center.x));
  const selectedKeys = new Set(allFaces.slice(0, targetCount).map((face) => face.key));
  const sourceNeighbors = faceAdjacencyFor(allFaces);
  for (let pass = 0; pass < 16; pass += 1) {
    const selected = allFaces.filter((face) => selectedKeys.has(face.key));
    const leaf = selected
      .filter((face) => selectedFaceDegree(face, selectedKeys, sourceNeighbors) < 1)
      .sort((a, b) => (b.score - a.score) || (b.center.y - a.center.y) || (b.center.x - a.center.x))[0];
    if (!leaf) break;
    const replacement = allFaces.find((face) => {
      if (selectedKeys.has(face.key)) return false;
      const nextKeys = new Set(selectedKeys);
      nextKeys.delete(leaf.key);
      return selectedFaceDegree(face, nextKeys, sourceNeighbors) >= 1;
    });
    if (!replacement) break;
    selectedKeys.delete(leaf.key);
    selectedKeys.add(replacement.key);
  }
  return allFaces
    .filter((face) => selectedKeys.has(face.key))
    .sort((a, b) => (a.center.y - b.center.y) || (a.center.x - b.center.x));
}

function buildKagomeFaceCache(width, height = width) {
  const layout = kagomeLayout(width, height);
  const allFaces = detectKagomeFaces(layout.siteCount);
  const faces = selectCompactFaces(allFaces, layout.siteCount)
    .map((face, index) => ({ ...face, index, coord: coordFromIndex(index, layout.boardWidth, layout.boardHeight) }));

  const faceForCoord = new Map(faces.map((face) => [coordKey(face.coord), face]));
  const faceByKey = new Map(faces.map((face) => [face.key, face]));
  const sourceNeighbors = faceAdjacencyFor(faces);
  const faceNeighbors = new Map(faces.map((face) => [coordKey(face.coord), new Set()]));
  for (const face of faces) {
    const from = coordKey(face.coord);
    for (const neighborKey of sourceNeighbors.get(face.key) || []) {
      const neighbor = faceByKey.get(neighborKey);
      if (!neighbor) continue;
      faceNeighbors.get(from)?.add(coordKey(neighbor.coord));
    }
  }

  const allPoints = faces.flatMap((face) => face.vertices);
  return {
    layout,
    faces,
    faceForCoord,
    faceNeighbors,
    bounds: boundsFromPoints(allPoints)
  };
}

const faceCache = new Map();

function kagomeFaceCache(width, height = width) {
  const key = `${clampBoardSize(width)}x${clampBoardSize(height)}`;
  if (!faceCache.has(key)) faceCache.set(key, buildKagomeFaceCache(width, height));
  return faceCache.get(key);
}

export function kagomeFaceCells(width, height = width) {
  return kagomeFaceCache(width, height).faces.map((face) => ({
    coord: [...face.coord],
    center: { ...face.center },
    vertices: face.vertices.map((point) => ({ ...point })),
    sides: face.sides
  }));
}

export function kagomeFaceBounds(width, height = width) {
  return { ...kagomeFaceCache(width, height).bounds };
}

export function kagomeFacePoint(coord, width, height = width) {
  const face = kagomeFaceCache(width, height).faceForCoord.get(coordKey(coord));
  return face ? { ...face.center } : null;
}

export function kagomeFaceVertices(coord, width, height = width) {
  const face = kagomeFaceCache(width, height).faceForCoord.get(coordKey(coord));
  return face ? face.vertices.map((point) => ({ ...point })) : [];
}

export function kagomeFaceNeighbors(coord, width, height = width) {
  const neighbors = kagomeFaceCache(width, height).faceNeighbors.get(coordKey(coord));
  return [...(neighbors || [])].map((key) => key.split(',').map(Number));
}
