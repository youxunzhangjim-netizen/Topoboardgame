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
  const cellCount = Math.ceil(siteCount / 3);
  const cellColumns = Math.max(1, Math.ceil(Math.sqrt(cellCount * 1.35)));
  const cellRows = Math.max(1, Math.ceil(cellCount / cellColumns));
  return { boardWidth, boardHeight, siteCount, cellCount, cellColumns, cellRows };
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

function coordFromIndex(index, width, height = width) {
  const layout = kagomeLayout(width, height);
  if (!Number.isInteger(index) || index < 0 || index >= layout.siteCount) return null;
  return [index % layout.boardWidth, Math.floor(index / layout.boardWidth)];
}

function siteInfo(coord, width, height = width) {
  const layout = kagomeLayout(width, height);
  const index = indexFromCoord(coord, layout.boardWidth, layout.boardHeight);
  if (index < 0) return null;
  const cellIndex = Math.floor(index / 3);
  return {
    ...layout,
    index,
    cellIndex,
    site: index % 3,
    cellX: cellIndex % layout.cellColumns,
    cellY: Math.floor(cellIndex / layout.cellColumns)
  };
}

function coordFromCell(cellX, cellY, site, layout, options = {}) {
  let x = cellX;
  let y = cellY;
  if (options.wrapX) x = ((x % layout.cellColumns) + layout.cellColumns) % layout.cellColumns;
  if (options.wrapY) y = ((y % layout.cellRows) + layout.cellRows) % layout.cellRows;
  if (x < 0 || x >= layout.cellColumns || y < 0 || y >= layout.cellRows) return null;
  const index = (y * layout.cellColumns + x) * 3 + site;
  return coordFromIndex(index, layout.boardWidth, layout.boardHeight);
}

export function kagomePoint(coord, width, height = width) {
  const info = siteInfo(coord, width, height);
  if (!info) return null;
  const basis = BASIS[info.site];
  return {
    x: info.cellX + info.cellY * 0.5 + basis[0],
    y: info.cellY * SQRT3 / 2 + basis[1]
  };
}

export function kagomeBounds(width, height = width) {
  const layout = kagomeLayout(width, height);
  const points = [];
  for (let index = 0; index < layout.siteCount; index += 1) {
    const point = kagomePoint(coordFromIndex(index, layout.boardWidth, layout.boardHeight), layout.boardWidth, layout.boardHeight);
    if (point) points.push(point);
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

export function kagomeNeighbors(coord, width, height = width, options = {}) {
  const info = siteInfo(coord, width, height);
  if (!info) return [];
  const { cellX, cellY, site } = info;
  const raw = site === 0
    ? [
        [cellX, cellY, 1],
        [cellX - 1, cellY, 1],
        [cellX, cellY, 2],
        [cellX, cellY - 1, 2]
      ]
    : site === 1
      ? [
          [cellX, cellY, 0],
          [cellX + 1, cellY, 0],
          [cellX, cellY, 2],
          [cellX + 1, cellY - 1, 2]
        ]
      : [
          [cellX, cellY, 0],
          [cellX, cellY + 1, 0],
          [cellX, cellY, 1],
          [cellX - 1, cellY + 1, 1]
        ];
  const seen = new Set();
  const neighbors = [];
  for (const [x, y, neighborSite] of raw) {
    const neighbor = coordFromCell(x, y, neighborSite, info, options);
    if (!neighbor) continue;
    const key = neighbor.join(',');
    if (seen.has(key) || key === coord.join(',')) continue;
    seen.add(key);
    neighbors.push(neighbor);
  }
  return neighbors;
}
