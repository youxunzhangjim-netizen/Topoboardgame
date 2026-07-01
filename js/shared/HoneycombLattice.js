const SQRT3 = Math.sqrt(3);

function clampBoardSize(value) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function inside(coord, width, height) {
  return Array.isArray(coord) &&
    coord[0] >= 0 && coord[0] < width &&
    coord[1] >= 0 && coord[1] < height;
}

function wrap(value, size) {
  return ((value % size) + size) % size;
}

function normalize(coord, width, height, options = {}) {
  const next = [coord[0], coord[1]];
  if (next[0] < 0 || next[0] >= width) {
    if (!options.wrapX) return null;
    next[0] = wrap(next[0], width);
  }
  if (next[1] < 0 || next[1] >= height) {
    if (!options.wrapY) return null;
    next[1] = wrap(next[1], height);
  }
  return next;
}

function honeycombDirections(coord) {
  const [x = 0, y = 0] = coord;
  const evenRow = y % 2 === 0;
  const evenVertex = (x + y) % 2 === 0;
  if (evenRow) {
    return evenVertex
      ? [[1, 0], [-1, -1], [-1, 1]]
      : [[-1, 0], [0, -1], [0, 1]];
  }
  return evenVertex
    ? [[1, 0], [0, -1], [0, 1]]
    : [[-1, 0], [1, -1], [1, 1]];
}

export function honeycombPoint(coord, width, height = width) {
  if (!inside(coord, clampBoardSize(width), clampBoardSize(height))) return null;
  const [x, y] = coord;
  return {
    x: x + (y % 2) * 0.5,
    y: y * SQRT3 / 2
  };
}

export function honeycombBounds(width, height = width) {
  const boardWidth = clampBoardSize(width);
  const boardHeight = clampBoardSize(height);
  const points = [];
  for (let y = 0; y < boardHeight; y += 1) {
    for (let x = 0; x < boardWidth; x += 1) {
      points.push(honeycombPoint([x, y], boardWidth, boardHeight));
    }
  }
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs, 0),
    maxX: Math.max(...xs, 1),
    minY: Math.min(...ys, 0),
    maxY: Math.max(...ys, 1)
  };
}

export function honeycombNeighbors(coord, width, height = width, options = {}) {
  const boardWidth = clampBoardSize(width);
  const boardHeight = clampBoardSize(height);
  if (!inside(coord, boardWidth, boardHeight)) return [];
  const seen = new Set();
  const result = [];
  for (const [dx, dy] of honeycombDirections(coord)) {
    const candidate = normalize([coord[0] + dx, coord[1] + dy], boardWidth, boardHeight, options);
    if (!candidate) continue;
    const key = candidate.join(',');
    if (seen.has(key) || key === coord.join(',')) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}
