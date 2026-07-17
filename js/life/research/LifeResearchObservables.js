import { isAlive } from '../../../life/js/rules.js';
import { siteIdFromPosition, undirectedEdgeKey } from './LifeDefectLayer.js';

function stateCells(state) {
  if (Array.isArray(state?.cells)) return state.cells;
  if (Array.isArray(state)) return state;
  return [];
}

function boardDimension(board, state = null) {
  return Number(board?.dimension || state?.dimension || 2);
}

function boardSize(board, state = null) {
  const dimension = boardDimension(board, state);
  const size = Array.isArray(board?.size) ? board.size : Array.isArray(state?.size) ? state.size : [32, 32];
  const out = size.slice(0, dimension);
  while (out.length < dimension) out.push(1);
  return out.map((value) => Math.max(1, Number(value) || 1));
}

function positionFromIndex(index, size) {
  let value = index;
  return size.map((axisSize) => {
    const coordinate = value % axisSize;
    value = Math.floor(value / axisSize);
    return coordinate;
  });
}

function indexFromPosition(position, size) {
  let stride = 1;
  let index = 0;
  for (let axis = 0; axis < size.length; axis += 1) {
    index += position[axis] * stride;
    stride *= size[axis];
  }
  return index;
}

function defaultNeighbors(position, size) {
  const neighbors = [];
  for (let axis = 0; axis < size.length; axis += 1) {
    for (const delta of [-1, 1]) {
      const next = position.slice();
      next[axis] += delta;
      if (next[axis] >= 0 && next[axis] < size[axis]) neighbors.push(next);
    }
  }
  return neighbors;
}

function getNeighbors(board, position, size) {
  if (typeof board?.getNeighborPositions === 'function') return board.getNeighborPositions(position);
  if (board?.topology && typeof board.topology.getNeighbors === 'function') {
    return board.topology.getNeighbors(position, size.length, board.neighborhoodType || 'von_neumann', board.lattice || 'square', {
      radius: board.neighborhoodRadius || 1,
      metric: board.neighborhoodMetric || 'manhattan'
    });
  }
  return defaultNeighbors(position, size);
}

function cellAt(state, board, position, size) {
  if (typeof board?.getCell === 'function') return board.getCell(position);
  return stateCells(state)[indexFromPosition(position, size)] || null;
}

function aliveSpecies(cell) {
  return isAlive(cell) ? String(cell.species || cell.state || 1) : '0';
}

function forEachCell(state, board, callback) {
  const cells = stateCells(state);
  const size = boardSize(board, state);
  for (let index = 0; index < cells.length; index += 1) {
    callback(cells[index], positionFromIndex(index, size), index);
  }
}

export function computeDomainComponents(state, board, targetStateOrSpecies = null) {
  const size = boardSize(board, state);
  const visited = new Set();
  const components = [];

  forEachCell(state, board, (cell, position, index) => {
    const species = aliveSpecies(cell);
    if (species === '0' || visited.has(index)) return;
    if (targetStateOrSpecies != null && species !== String(targetStateOrSpecies)) return;
    const queue = [position];
    const sites = [];
    visited.add(index);

    while (queue.length) {
      const current = queue.shift();
      const currentIndex = indexFromPosition(current, size);
      const currentCell = cellAt(state, board, current, size);
      const currentSpecies = aliveSpecies(currentCell);
      sites.push(siteIdFromPosition(current));

      for (const neighbor of getNeighbors(board, current, size)) {
        const neighborIndex = indexFromPosition(neighbor, size);
        if (visited.has(neighborIndex)) continue;
        const neighborCell = cellAt(state, board, neighbor, size);
        if (aliveSpecies(neighborCell) !== currentSpecies) continue;
        visited.add(neighborIndex);
        queue.push(neighbor);
      }
    }

    components.push({ species, size: sites.length, sites });
  });

  components.sort((a, b) => b.size - a.size);
  return components;
}

export function computeInterfaceEdges(state, board) {
  const size = boardSize(board, state);
  const seen = new Set();
  const edges = [];

  forEachCell(state, board, (cell, position) => {
    const sourceSpecies = aliveSpecies(cell);
    for (const neighbor of getNeighbors(board, position, size)) {
      const key = undirectedEdgeKey(position, neighbor);
      if (seen.has(key)) continue;
      seen.add(key);
      const targetSpecies = aliveSpecies(cellAt(state, board, neighbor, size));
      if (sourceSpecies !== targetSpecies) {
        edges.push({
          source: siteIdFromPosition(position),
          target: siteIdFromPosition(neighbor),
          sourceSpecies,
          targetSpecies
        });
      }
    }
  });

  return edges;
}

export function computeDefectStats(defectLayer = null) {
  if (!defectLayer?.enabled) {
    return {
      defect_count: 0,
      vacancy_count: 0,
      pinned_site_count: 0,
      crack_length: 0,
      grain_boundary_length: 0,
      dislocation_core_count: 0
    };
  }
  const defects = defectLayer.defects?.filter((defect) => defect.enabled !== false) || [];
  return {
    defect_count: defects.length,
    vacancy_count: defectLayer.blockedSites?.size || 0,
    pinned_site_count: defectLayer.pinnedSites?.size || 0,
    crack_length: defects
      .filter((defect) => defect.type === 'crack')
      .reduce((sum, defect) => sum + (defect.affectedEdges?.length || 0), 0),
    grain_boundary_length: defects
      .filter((defect) => defect.type === 'grain_boundary')
      .reduce((sum, defect) => sum + (defect.affectedEdges?.length || 0), 0),
    dislocation_core_count: defects.filter((defect) => String(defect.type || '').includes('dislocation')).length
  };
}

function speciesFractions(cells) {
  const counts = {};
  let alive = 0;
  for (const cell of cells) {
    if (!isAlive(cell)) continue;
    const species = cell.species || 1;
    counts[species] = (counts[species] || 0) + 1;
    alive += 1;
  }
  return Object.fromEntries(Object.entries(counts).map(([species, count]) => [species, alive ? count / alive : 0]));
}

function largestDroplet(components, dimension) {
  const largest = components[0]?.size || 0;
  const radius = dimension >= 3
    ? Math.cbrt((3 * largest) / (4 * Math.PI))
    : Math.sqrt(largest / Math.PI);
  return { measure: largest, radius };
}

function roughness(interfaceEdges = []) {
  if (!interfaceEdges.length) return 0;
  const coordinates = interfaceEdges.flatMap((edge) => [edge.source, edge.target])
    .map((site) => site.split(',').map(Number))
    .filter((values) => values.every(Number.isFinite));
  if (!coordinates.length) return 0;
  const dim = coordinates[0].length;
  const mean = Array.from({ length: dim }, (_, axis) => coordinates.reduce((sum, point) => sum + point[axis], 0) / coordinates.length);
  const distances = coordinates.map((point) => Math.sqrt(point.reduce((sum, value, axis) => sum + (value - mean[axis]) ** 2, 0)));
  const average = distances.reduce((sum, value) => sum + value, 0) / distances.length;
  return Math.sqrt(distances.reduce((sum, value) => sum + (value - average) ** 2, 0) / distances.length);
}

function entropyDensity(speciesFraction = {}, siteCount = 1) {
  const entropy = Object.values(speciesFraction).reduce((sum, value) => {
    if (!value) return sum;
    return sum - value * Math.log2(value);
  }, 0);
  return entropy / Math.max(1, Math.log2(Math.max(2, siteCount)));
}

function defectDistanceToDomainWall(defectLayer, interfaceEdges) {
  const defectSites = [...(defectLayer?.blockedSites || [])]
    .map((site) => site.split(',').map(Number))
    .filter((values) => values.every(Number.isFinite));
  const wallSites = interfaceEdges.flatMap((edge) => [edge.source, edge.target])
    .map((site) => site.split(',').map(Number))
    .filter((values) => values.every(Number.isFinite));
  if (!defectSites.length || !wallSites.length) return null;
  let best = Infinity;
  for (const defect of defectSites) {
    for (const wall of wallSites) {
      const d = Math.sqrt(defect.reduce((sum, value, axis) => sum + (value - wall[axis]) ** 2, 0));
      best = Math.min(best, d);
    }
  }
  return best;
}

export function computeLifeObservables(state, board, defectLayer = null, options = {}) {
  const cells = stateCells(state);
  const dimension = boardDimension(board, state);
  const siteCount = Math.max(1, cells.length || boardSize(board, state).reduce((product, value) => product * value, 1));
  const aliveCount = cells.filter(isAlive).length;
  const components = computeDomainComponents(state, board);
  const interfaceEdges = computeInterfaceEdges(state, board);
  const droplet = largestDroplet(components, dimension);
  const defectStats = computeDefectStats(defectLayer);
  const fractions = speciesFractions(cells);
  const history = options.history || [];

  return {
    alive_fraction: aliveCount / siteCount,
    species_fraction: fractions,
    cluster_count: components.length,
    domain_count: components.length,
    largest_cluster_size: components[0]?.size || 0,
    interface_length: interfaceEdges.length,
    domain_wall_length: interfaceEdges.filter((edge) => edge.sourceSpecies !== '0' && edge.targetSpecies !== '0').length,
    droplet_area_or_volume: droplet.measure,
    droplet_radius_estimate: droplet.radius,
    roughness_of_domain_wall: roughness(interfaceEdges),
    ...defectStats,
    defect_distance_to_domain_wall: defectDistanceToDomainWall(defectLayer, interfaceEdges),
    front_velocity_estimate: options.frontVelocity ?? history.at?.(-1)?.frontVelocity ?? null,
    extinction_time: options.extinctionTime ?? null,
    oscillation_period_estimate: options.oscillationPeriod ?? null,
    entropy_density_approx: entropyDensity(fractions, siteCount),
    domainComponents: components,
    interfaceEdges
  };
}

function csvEscape(value) {
  if (value == null) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function exportLifeResearchCSV(history = []) {
  const rows = Array.isArray(history) ? history : [];
  const columns = [
    'generation',
    'alive_fraction',
    'species_fraction',
    'cluster_count',
    'largest_cluster_size',
    'interface_length',
    'domain_wall_length',
    'droplet_area_or_volume',
    'droplet_radius_estimate',
    'roughness_of_domain_wall',
    'defect_count',
    'vacancy_count',
    'pinned_site_count',
    'crack_length',
    'grain_boundary_length',
    'dislocation_core_count',
    'defect_distance_to_domain_wall',
    'front_velocity_estimate',
    'extinction_time',
    'oscillation_period_estimate',
    'entropy_density_approx'
  ];
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row?.[column])).join(','))
  ].join('\n');
}

export function exportLifeResearchJSON(history = []) {
  return {
    schema: 'topoboard.lifeResearchObservables.v0',
    exportedAt: new Date().toISOString(),
    observables: Array.isArray(history) ? history : []
  };
}
