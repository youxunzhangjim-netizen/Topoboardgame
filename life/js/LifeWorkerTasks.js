import { createLifeEngine } from './LifeEngine.js';
import { parseRuleString } from './rules.js';

const MAX_RULES = 64;
const MAX_SEEDS = 12;
const MAX_SCAN_GENERATIONS = 300;
const MAX_SCAN_SIZE = 80;
const MAX_BENCHMARK_TRIALS = 30;
const MAX_BENCHMARK_GENERATIONS = 2000;

function nowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

export function clampNumber(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

export function createWorkerRng(seed = 1) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function normalizeRulePart(part, label) {
  const compact = String(part || '')
    .trim()
    .toUpperCase()
    .replace(/^B|^S/g, '')
    .replace(/[\s,]/g, '');
  if (!/^\d*$/.test(compact)) {
    throw new Error(`${label} must contain only neighbor counts from 0 to 8.`);
  }
  const counts = [...new Set(compact.split('').map(Number))]
    .filter((count) => Number.isInteger(count))
    .sort((a, b) => a - b);
  if (counts.some((count) => count < 0 || count > 8)) {
    throw new Error(`${label} counts must stay between 0 and 8 for the safe 2D scan.`);
  }
  return counts.join('');
}

function parseRuleSets(text, fallback, label) {
  const source = String(text ?? '').trim() ? text : fallback;
  const values = String(source)
    .split(';')
    .map((part) => normalizeRulePart(part, label))
    .slice(0, 8);
  return values.length ? values : String(fallback).split(';').map((part) => normalizeRulePart(part, label));
}

function ruleFromParts(birthPart, survivalPart) {
  const ruleString = `B${birthPart}/S${survivalPart}`;
  const parsed = parseRuleString(ruleString);
  return {
    id: `scanner:${ruleString}`,
    label: ruleString,
    type: 'life-like',
    rule: ruleString,
    birth: [...parsed.birth],
    survival: [...parsed.survival],
    speciesCount: 1,
    neighborhoodType: 'moore',
    dimension: 2
  };
}

function aliveHash(engine) {
  const parts = [];
  for (let i = 0; i < engine.cells.length; i += 1) {
    const cell = engine.cells[i];
    if (cell?.state || cell?.species) parts.push(i);
  }
  return parts.join('|');
}

function classifyRun(samples, finalPopulation, size) {
  if (finalPopulation === 0) return 'extinction';
  const last = samples[samples.length - 1] || {};
  const initial = samples[0] || {};
  const recent = samples.slice(-Math.min(12, samples.length));
  const populations = recent.map((sample) => sample.population || 0);
  const minPopulation = Math.min(...populations);
  const maxPopulation = Math.max(...populations);
  const finalDensity = finalPopulation / Math.max(1, size * size);

  if (last.period && last.period > 1) return 'oscillator';
  if ((maxPopulation - minPopulation) <= Math.max(2, finalPopulation * 0.02)) return 'stable';
  if (finalPopulation > Math.max(initial.population || 1, 1) * 1.8 || finalDensity > 0.42) return 'growing';
  return 'active';
}

function dominantClass(counts) {
  const order = ['extinction', 'stable', 'oscillator', 'growing', 'active'];
  return order.reduce((best, key) => {
    if (!best || (counts[key] || 0) > (counts[best] || 0)) return key;
    return best;
  }, 'active');
}

function runOnePhaseScan(config, rule, seedIndex) {
  const rng = createWorkerRng(config.baseSeed + seedIndex * 9973);
  const engine = createLifeEngine({
    dimension: 2,
    size: [config.boardSize, config.boardSize],
    boundary: config.boundary,
    lattice: config.lattice,
    neighborhoodType: config.neighborhood,
    neighborhoodRadius: 1,
    neighborhoodMetric: config.neighborhood === 'von_neumann' ? 'manhattan' : 'chebyshev',
    rule,
    rng
  });
  engine.randomSeed({ density: config.seedDensity, speciesCount: 1, resetGeneration: true });

  const seen = new Map();
  const samples = [];
  let period = null;
  for (let generation = 0; generation <= config.generations; generation += 1) {
    const hash = aliveHash(engine);
    const observables = engine.getObservables();
    if (hash && seen.has(hash) && period == null) period = generation - seen.get(hash);
    if (hash && !seen.has(hash)) seen.set(hash, generation);
    samples.push({ generation, population: observables.population, density: observables.density, period });
    if (generation < config.generations) engine.step();
  }

  const final = samples[samples.length - 1];
  const classification = classifyRun(samples, final.population, config.boardSize);
  return {
    seedIndex,
    finalPopulation: final.population,
    finalDensity: final.density,
    recurrencePeriod: period,
    classification
  };
}

export function normalizePhaseScanConfig(rawConfig = {}) {
  const birthSets = parseRuleSets(rawConfig.birthSets, '3;36;2;34', 'Birth').slice(0, 8);
  const survivalSets = parseRuleSets(rawConfig.survivalSets, '23;34;2;34678', 'Survival').slice(0, 8);
  return {
    boundary: rawConfig.boundary || 'open',
    lattice: rawConfig.lattice || 'square',
    neighborhood: rawConfig.neighborhood || 'moore',
    boardSize: Math.round(clampNumber(rawConfig.boardSize, 32, 12, MAX_SCAN_SIZE)),
    seedDensity: clampNumber(rawConfig.seedDensity, 0.22, 0.01, 0.8),
    seedsPerRule: Math.round(clampNumber(rawConfig.seedsPerRule, 3, 1, MAX_SEEDS)),
    generations: Math.round(clampNumber(rawConfig.generations, 80, 5, MAX_SCAN_GENERATIONS)),
    baseSeed: Math.round(clampNumber(rawConfig.baseSeed, 20260627, 1, 0x7fffffff)),
    birthSets,
    survivalSets
  };
}

export function runPhaseScan(rawConfig = {}, hooks = {}) {
  const config = normalizePhaseScanConfig(rawConfig);
  const onProgress = typeof hooks.onProgress === 'function' ? hooks.onProgress : () => {};
  const shouldCancel = typeof hooks.shouldCancel === 'function' ? hooks.shouldCancel : () => false;
  const rules = [];

  for (const survival of config.survivalSets) {
    for (const birth of config.birthSets) {
      if (rules.length >= MAX_RULES) break;
      rules.push({ birth, survival, rule: ruleFromParts(birth, survival) });
    }
  }

  const totalRuns = rules.length * config.seedsPerRule;
  const results = [];
  let completedRuns = 0;

  for (const entry of rules) {
    const classCounts = { extinction: 0, stable: 0, oscillator: 0, growing: 0, active: 0 };
    const runs = [];
    for (let seedIndex = 0; seedIndex < config.seedsPerRule; seedIndex += 1) {
      if (shouldCancel()) throw new Error('cancelled');
      const run = runOnePhaseScan(config, entry.rule, seedIndex);
      classCounts[run.classification] += 1;
      runs.push(run);
      completedRuns += 1;
      onProgress({ completedRuns, totalRuns });
    }
    const meanFinalPopulation = runs.reduce((sum, run) => sum + run.finalPopulation, 0) / runs.length;
    const meanFinalDensity = runs.reduce((sum, run) => sum + run.finalDensity, 0) / runs.length;
    const periods = runs.map((run) => run.recurrencePeriod).filter(Boolean);
    results.push({
      rule: entry.rule.rule,
      birth: entry.birth,
      survival: entry.survival,
      classification: dominantClass(classCounts),
      classCounts,
      meanFinalPopulation,
      meanFinalDensity,
      recurrencePeriods: periods,
      runs
    });
  }

  return {
    schema: 'topoboard-life-phase-scan',
    version: 1,
    createdAt: new Date().toISOString(),
    config,
    results
  };
}

function maxBenchmarkSizeForDimension(dimension) {
  if (dimension <= 1) return 4096;
  if (dimension === 2) return 96;
  if (dimension === 3) return 32;
  return 12;
}

function normalizeBenchmarkSize(rawSize, dimension, fallbackSize) {
  const fallback = Number(fallbackSize) || (dimension === 1 ? 512 : 32);
  const maxSize = maxBenchmarkSizeForDimension(dimension);
  const source = Array.isArray(rawSize) ? rawSize : Array.from({ length: dimension }, () => fallback);
  const size = source.slice(0, dimension).map((value) => Math.round(clampNumber(value, fallback, 4, maxSize)));
  while (size.length < dimension) size.push(Math.round(clampNumber(fallback, 32, 4, maxSize)));
  return size;
}

export function normalizeBenchmarkConfig(rawConfig = {}) {
  const dimension = Math.round(clampNumber(rawConfig.dimension, 2, 1, 4));
  const boardSize = Math.round(clampNumber(rawConfig.boardSize, dimension === 1 ? 512 : 32, 4, maxBenchmarkSizeForDimension(dimension)));
  const size = normalizeBenchmarkSize(rawConfig.size, dimension, boardSize);
  return {
    dimension,
    size,
    boardSize: size.join('x'),
    boundary: rawConfig.boundary || 'open',
    lattice: rawConfig.lattice || (dimension >= 3 ? 'sc' : 'square'),
    neighborhoodType: rawConfig.neighborhoodType || rawConfig.neighborhood || (dimension === 1 ? 'nearest' : 'moore'),
    neighborhoodRadius: Math.round(clampNumber(rawConfig.neighborhoodRadius ?? rawConfig.radius, 1, 1, 2)),
    neighborhoodMetric: rawConfig.neighborhoodMetric || rawConfig.metric || null,
    rule: rawConfig.rule || null,
    seedDensity: clampNumber(rawConfig.seedDensity, 0.18, 0.01, 0.8),
    speciesCount: Math.round(clampNumber(rawConfig.speciesCount, rawConfig.rule?.speciesCount || 1, 1, 4)),
    baseSeed: Math.round(clampNumber(rawConfig.baseSeed, 20260627, 1, 0x7fffffff)),
    trials: Math.round(clampNumber(rawConfig.trials, 3, 1, MAX_BENCHMARK_TRIALS)),
    generations: Math.round(clampNumber(rawConfig.generations, 120, 1, MAX_BENCHMARK_GENERATIONS))
  };
}

function runOneBenchmark(config, trialIndex) {
  const rng = createWorkerRng(config.baseSeed + trialIndex * 104729);
  const engine = createLifeEngine({
    dimension: config.dimension,
    size: config.size,
    boundary: config.boundary,
    lattice: config.lattice,
    neighborhoodType: config.neighborhoodType,
    neighborhoodRadius: config.neighborhoodRadius,
    neighborhoodMetric: config.neighborhoodMetric || undefined,
    rule: config.rule || undefined,
    rng
  });
  engine.randomSeed({
    density: config.seedDensity,
    speciesCount: config.speciesCount,
    resetGeneration: true
  });

  const startedAt = nowMs();
  for (let generation = 0; generation < config.generations; generation += 1) {
    engine.step();
  }
  const elapsedMs = Math.max(0.001, nowMs() - startedAt);
  const finalObservables = engine.getObservables();
  return {
    trialIndex,
    elapsedMs,
    generations: config.generations,
    generationsPerSecond: config.generations / (elapsedMs / 1000),
    finalPopulation: finalObservables.population,
    finalDensity: finalObservables.density,
    activeCellCount: finalObservables.population,
    generation: finalObservables.generation
  };
}

export function runBenchmark(rawConfig = {}, hooks = {}) {
  const config = normalizeBenchmarkConfig(rawConfig);
  const onProgress = typeof hooks.onProgress === 'function' ? hooks.onProgress : () => {};
  const shouldCancel = typeof hooks.shouldCancel === 'function' ? hooks.shouldCancel : () => false;
  const startedAt = nowMs();
  const trials = [];

  for (let trialIndex = 0; trialIndex < config.trials; trialIndex += 1) {
    if (shouldCancel()) throw new Error('cancelled');
    const trial = runOneBenchmark(config, trialIndex);
    trials.push(trial);
    onProgress({ completedRuns: trialIndex + 1, totalRuns: config.trials });
  }

  const elapsedMs = Math.max(0.001, nowMs() - startedAt);
  const totalGenerations = config.generations * config.trials;
  const activeCellCount = trials.reduce((sum, trial) => sum + trial.activeCellCount, 0) / Math.max(1, trials.length);
  const finalPopulation = trials.reduce((sum, trial) => sum + trial.finalPopulation, 0) / Math.max(1, trials.length);

  return {
    schema: 'topoboard-life-benchmark',
    version: 1,
    createdAt: new Date().toISOString(),
    config: {
      ...config,
      rule: config.rule
        ? {
          id: config.rule.id || 'custom',
          label: config.rule.label || config.rule.name || config.rule.rule || 'Life rule',
          rule: config.rule.rule || null,
          birth: Array.isArray(config.rule.birth) ? [...config.rule.birth] : [],
          survival: Array.isArray(config.rule.survival) ? [...config.rule.survival] : [],
          speciesCount: config.rule.speciesCount || config.speciesCount
        }
        : null
    },
    summary: {
      generationsPerSecond: totalGenerations / (elapsedMs / 1000),
      boardSize: config.boardSize,
      dimension: config.dimension,
      activeCellCount,
      finalPopulation,
      elapsedMs,
      generations: config.generations,
      trials: config.trials,
      totalGenerations
    },
    trials
  };
}
