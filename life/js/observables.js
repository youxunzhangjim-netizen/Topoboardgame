import { isAlive } from './rules.js';

function entropyFromCounts(counts, total) {
  if (!total) return 0;
  let entropy = 0;
  for (const count of Object.values(counts)) {
    if (!count) continue;
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function computeAgeDistribution(cells, binSize = 4) {
  const bins = {};
  for (const cell of cells) {
    if (!isAlive(cell)) continue;
    const age = Math.max(0, Math.floor(cell.age || 0));
    const start = Math.floor(age / binSize) * binSize;
    const label = `${start}-${start + binSize - 1}`;
    bins[label] = (bins[label] || 0) + 1;
  }
  return bins;
}

function computeClusters(engine) {
  const visited = new Set();
  let clusterCount = 0;
  let largestClusterSize = 0;
  const speciesClusters = {};

  for (let i = 0; i < engine.cells.length; i += 1) {
    const cell = engine.cells[i];
    if (!isAlive(cell) || visited.has(i)) continue;

    clusterCount += 1;
    const species = cell.species || 1;
    const queue = [engine.positionFromIndex(i)];
    visited.add(i);
    let size = 0;

    while (queue.length) {
      const position = queue.shift();
      const current = engine.getCell(position);
      size += 1;

      for (const neighbor of engine.topology.getNeighbors(position, engine.dimension, 'von_neumann')) {
        const ni = engine.index(neighbor);
        if (visited.has(ni)) continue;
        const neighborCell = engine.cells[ni];
        if (!isAlive(neighborCell)) continue;
        if ((neighborCell.species || 1) !== (current.species || 1)) continue;
        visited.add(ni);
        queue.push(neighbor);
      }
    }

    largestClusterSize = Math.max(largestClusterSize, size);
    speciesClusters[species] = (speciesClusters[species] || 0) + 1;
  }

  return { clusterCount, largestClusterSize, speciesClusters };
}

function computeSpatialCorrelation(engine) {
  let pairs = 0;
  let sameState = 0;
  let sameSpecies = 0;

  for (let i = 0; i < engine.cells.length; i += 1) {
    const position = engine.positionFromIndex(i);
    const cell = engine.cells[i];
    const alive = isAlive(cell);
    for (const neighbor of engine.topology.getNeighbors(position, engine.dimension, 'von_neumann')) {
      const ni = engine.index(neighbor);
      if (ni <= i) continue;
      const other = engine.cells[ni];
      pairs += 1;
      if (isAlive(other) === alive) sameState += 1;
      if (alive && isAlive(other) && (cell.species || 1) === (other.species || 1)) sameSpecies += 1;
    }
  }

  return {
    sameStateFraction: pairs ? sameState / pairs : 0,
    sameSpeciesFraction: pairs ? sameSpecies / pairs : 0
  };
}

export function computeObservables(engine, metadata = {}) {
  const cells = engine.cells || [];
  const speciesCounts = {};
  let population = 0;
  let ageSum = 0;
  let maxAge = 0;
  let energySum = 0;
  let healthSum = 0;

  for (const cell of cells) {
    if (!isAlive(cell)) continue;
    const species = cell.species || 1;
    population += 1;
    speciesCounts[species] = (speciesCounts[species] || 0) + 1;
    ageSum += cell.age || 0;
    maxAge = Math.max(maxAge, cell.age || 0);
    energySum += cell.energy ?? 1;
    healthSum += cell.health ?? 1;
  }

  const clusters = computeClusters(engine);
  const correlation = computeSpatialCorrelation(engine);
  const entropy = entropyFromCounts(speciesCounts, population);

  return {
    generation: engine.generation || 0,
    population,
    density: cells.length ? population / cells.length : 0,
    speciesCounts,
    speciesFractions: Object.fromEntries(Object.entries(speciesCounts).map(([species, count]) => [species, population ? count / population : 0])),
    speciesRichness: Object.keys(speciesCounts).length,
    averageAge: population ? ageSum / population : 0,
    meanAge: population ? ageSum / population : 0,
    maxAge,
    ageDistribution: computeAgeDistribution(cells),
    averageEnergy: population ? energySum / population : 0,
    averageHealth: population ? healthSum / population : 0,
    births: metadata.births || 0,
    deaths: metadata.deaths || 0,
    mutations: metadata.mutations || 0,
    birthRate: cells.length ? (metadata.births || 0) / cells.length : 0,
    deathRate: cells.length ? (metadata.deaths || 0) / cells.length : 0,
    clusterCount: clusters.clusterCount,
    largestClusterSize: clusters.largestClusterSize,
    speciesClusters: clusters.speciesClusters,
    entropy,
    spatialCorrelation: correlation.sameStateFraction,
    speciesSpatialCorrelation: correlation.sameSpeciesFraction,
    events: metadata.events || {}
  };
}

export function summarizeObservables(observables) {
  return {
    generation: observables.generation,
    population: observables.population,
    density: Number(observables.density.toFixed(4)),
    species: observables.speciesCounts,
    averageAge: Number(observables.averageAge.toFixed(2)),
    clusterCount: observables.clusterCount,
    largestClusterSize: observables.largestClusterSize,
    entropy: Number(observables.entropy.toFixed(3)),
    spatialCorrelation: Number(observables.spatialCorrelation.toFixed(3)),
    births: observables.births,
    deaths: observables.deaths
  };
}
