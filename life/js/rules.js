/**
 * Rule functions for Life & Evolution Worlds.
 *
 * The engine passes rendering-independent cell and neighbor data into these
 * functions. Rule presets are plain objects so future AI/research tools can
 * serialize and mutate them.
 */

function toSet(values = []) {
  return new Set([...values].map((v) => Number(v)));
}

export function parseCountList(part = '') {
  const values = new Set();
  for (const token of String(part).split(/[, ]*/).filter(Boolean)) {
    if (token.includes('-')) {
      const [a, b] = token.split('-').map(Number);
      for (let n = Math.min(a, b); n <= Math.max(a, b); n += 1) values.add(n);
    } else {
      values.add(Number(token));
    }
  }
  return values;
}

export function parseRuleString(rule = 'B3/S23') {
  const normalized = String(rule).toUpperCase().replace(/\s+/g, '');
  const birthMatch = normalized.match(/B([0-9,\-]*)/);
  const survivalMatch = normalized.match(/S([0-9,\-]*)/);
  return {
    birth: parseCountList(birthMatch?.[1] ?? ''),
    survival: parseCountList(survivalMatch?.[1] ?? '')
  };
}

export function createCell({ state = 0, species = 0, age = 0, energy = 1, health = 1, infected = false, recovered = false } = {}) {
  return { state, species, age, energy, health, infected, recovered };
}

export function isAlive(cell) {
  return Boolean(cell?.state || cell?.species);
}

export function emptyCell() {
  return createCell();
}

export function cloneCell(cell) {
  return createCell(cell);
}

export function speciesHistogram(neighborCells) {
  const counts = new Map();
  for (const cell of neighborCells) {
    if (!isAlive(cell)) continue;
    const species = cell.species || 1;
    counts.set(species, (counts.get(species) || 0) + 1);
  }
  return counts;
}

export function majoritySpecies(neighborCells, rng = Math.random, tieRule = 'random') {
  const counts = speciesHistogram(neighborCells);
  if (!counts.size) return 1;

  let bestCount = -1;
  let bestSpecies = [];
  for (const [species, count] of counts.entries()) {
    if (count > bestCount) {
      bestCount = count;
      bestSpecies = [species];
    } else if (count === bestCount) {
      bestSpecies.push(species);
    }
  }

  if (tieRule === 'lowest') return Math.min(...bestSpecies);
  if (tieRule === 'highest') return Math.max(...bestSpecies);
  return bestSpecies[Math.floor(rng() * bestSpecies.length)];
}

export function mutateSpecies(species, speciesCount = 1, mutationRate = 0, rng = Math.random) {
  if (speciesCount <= 1 || rng() >= mutationRate) return species;
  let next = species;
  while (next === species) next = 1 + Math.floor(rng() * speciesCount);
  return next;
}

function applySpeciesAdvantage(count, species, advantages = {}, type = 'birth') {
  const bySpecies = advantages?.[species] || advantages?.[String(species)] || {};
  const delta = Number(bySpecies[type] || 0);
  return count + delta;
}

export function applyLifeLikeRule({ cell, neighborCells, rule, rng = Math.random }) {
  const alive = isAlive(cell);
  const livingNeighbors = neighborCells.filter(isAlive);
  const bornSpecies = majoritySpecies(livingNeighbors, rng, rule.tieRule || 'random');
  const species = alive ? (cell.species || 1) : bornSpecies;
  const adjustedCount = applySpeciesAdvantage(
    livingNeighbors.length,
    species,
    rule.speciesAdvantages,
    alive ? 'survival' : 'birth'
  );

  const birth = toSet(rule.birth);
  const survival = toSet(rule.survival);
  let nextAlive = alive ? survival.has(adjustedCount) : birth.has(adjustedCount);
  let event = nextAlive
    ? (alive ? 'survive' : 'birth')
    : (alive ? 'death' : 'empty');

  if (rule.ruleNoise && rng() < rule.ruleNoise) {
    nextAlive = !nextAlive;
    event = nextAlive ? (alive ? 'survive' : 'birth') : (alive ? 'death' : 'empty');
  }

  if (rule.birthNoise && !alive && !nextAlive && rng() < rule.birthNoise) {
    nextAlive = true;
    event = 'birth';
  }

  if (rule.deathNoise && alive && nextAlive && rng() < rule.deathNoise) {
    nextAlive = false;
    event = 'death';
  }

  if (rule.environmentNoise && rng() < rule.environmentNoise) {
    nextAlive = rng() < 0.5;
    event = nextAlive ? (alive ? 'survive' : 'birth') : (alive ? 'death' : 'empty');
  }

  if (!nextAlive) {
    return { cell: emptyCell(), event };
  }

  const speciesCount = Number(rule.speciesCount || 1);
  const nextSpecies = mutateSpecies(species, speciesCount, Number(rule.mutationRate || 0), rng);
  let nextAge = alive ? (cell.age || 0) + 1 : 1;
  let health = alive ? (cell.health ?? 1) : 1;
  let energy = alive ? (cell.energy ?? 1) : 1;

  if (rule.maxAge && nextAge > rule.maxAge) {
    const agePenalty = Number(rule.oldAgePenalty ?? 1);
    if (rng() < agePenalty) return { cell: emptyCell(), event: 'death' };
    health *= Math.max(0, 1 - agePenalty);
  }

  if (rule.agingDeathRate && nextAge > 1 && rng() < rule.agingDeathRate * nextAge) {
    return { cell: emptyCell(), event: 'death' };
  }

  if (!alive && rule.youngBirthBonus) {
    energy += Number(rule.youngBirthBonus);
    health += Number(rule.youngBirthBonus);
  }

  return {
    cell: createCell({
      state: 1,
      species: nextSpecies,
      age: nextAge,
      energy,
      health
    }),
    event
  };
}

export function applyPredatorPreyRule({ cell, neighborCells, rule, rng = Math.random }) {
  const species = cell.species || 0;
  const counts = speciesHistogram(neighborCells);
  const prey = counts.get(1) || 0;
  const predators = counts.get(2) || 0;

  if (species === 2) {
    if (prey >= 1 && predators <= 5) return { cell: createCell({ state: 1, species: 2, age: cell.age + 1, energy: (cell.energy || 1) + 0.2 }), event: 'survive' };
    return { cell: emptyCell(), event: 'death' };
  }

  if (species === 1) {
    if (predators >= 2 && rng() < 0.72) return { cell: emptyCell(), event: 'death' };
    if (prey >= 2 && prey <= 5) return { cell: createCell({ state: 1, species: 1, age: cell.age + 1 }), event: 'survive' };
    return { cell: emptyCell(), event: 'death' };
  }

  if (prey === 3 && predators < 3) return { cell: createCell({ state: 1, species: 1, age: 1 }), event: 'birth' };
  if (prey >= 2 && predators >= 1 && rng() < 0.18) return { cell: createCell({ state: 1, species: 2, age: 1 }), event: 'birth' };
  return { cell: emptyCell(), event: 'empty' };
}

export function applySIRRule({ cell, neighborCells, rule, rng = Math.random }) {
  const susceptible = cell.species === 1;
  const infected = cell.species === 2;
  const recovered = cell.species === 3;
  const infectedNeighbors = neighborCells.filter((n) => n.species === 2).length;
  const infectionRate = Number(rule.infectionRate ?? 0.28);
  const recoveryRate = Number(rule.recoveryRate ?? 0.08);
  const immunityLossRate = Number(rule.immunityLossRate ?? 0.005);

  if (!isAlive(cell)) {
    if (neighborCells.filter(isAlive).length === 3) return { cell: createCell({ state: 1, species: 1, age: 1 }), event: 'birth' };
    return { cell: emptyCell(), event: 'empty' };
  }

  if (susceptible && infectedNeighbors > 0 && rng() < 1 - Math.pow(1 - infectionRate, infectedNeighbors)) {
    return { cell: createCell({ state: 1, species: 2, age: cell.age + 1, infected: true }), event: 'infect' };
  }

  if (infected && rng() < recoveryRate) {
    return { cell: createCell({ state: 1, species: 3, age: cell.age + 1, recovered: true }), event: 'recover' };
  }

  if (recovered && rng() < immunityLossRate) {
    return { cell: createCell({ state: 1, species: 1, age: cell.age + 1 }), event: 'susceptible' };
  }

  return { cell: createCell({ ...cell, age: cell.age + 1 }), event: 'survive' };
}

export function applyForestFireRule({ cell, neighborCells, rule, rng = Math.random }) {
  const empty = cell.species === 0;
  const tree = cell.species === 1;
  const burning = cell.species === 2;
  const burningNeighbors = neighborCells.filter((n) => n.species === 2).length;
  const growthRate = Number(rule.growthRate ?? 0.01);
  const lightningRate = Number(rule.lightningRate ?? 0.0005);
  const spreadRate = Number(rule.spreadRate ?? 0.58);

  if (burning) return { cell: emptyCell(), event: 'death' };
  if (tree) {
    if (burningNeighbors && rng() < 1 - Math.pow(1 - spreadRate, burningNeighbors)) {
      return { cell: createCell({ state: 1, species: 2, age: 1 }), event: 'burn' };
    }
    if (rng() < lightningRate) return { cell: createCell({ state: 1, species: 2, age: 1 }), event: 'burn' };
    return { cell: createCell({ state: 1, species: 1, age: cell.age + 1 }), event: 'survive' };
  }
  if (empty && rng() < growthRate) return { cell: createCell({ state: 1, species: 1, age: 1 }), event: 'birth' };
  return { cell: emptyCell(), event: 'empty' };
}

export function applyRule(context) {
  const type = context.rule.type || 'life-like';
  if (type === 'predator-prey') return applyPredatorPreyRule(context);
  if (type === 'sir') return applySIRRule(context);
  if (type === 'forest-fire') return applyForestFireRule(context);
  return applyLifeLikeRule(context);
}
