import { createLifeEngine } from './LifeEngine.js';
import { parseRuleString } from './rules.js';

const MAX_RULES = 64;
const MAX_SEEDS = 12;
const MAX_GENERATIONS = 300;
const MAX_SIZE = 80;

function clampNumber(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function createRng(seed = 1) {
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

function runOne(config, rule, seedIndex) {
  const rng = createRng(config.baseSeed + seedIndex * 9973);
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

function runScan(rawConfig) {
  const birthSets = parseRuleSets(rawConfig.birthSets, '3;36;2;34', 'Birth').slice(0, 8);
  const survivalSets = parseRuleSets(rawConfig.survivalSets, '23;34;2;34678', 'Survival').slice(0, 8);
  const config = {
    boundary: rawConfig.boundary || 'open',
    lattice: rawConfig.lattice || 'square',
    neighborhood: rawConfig.neighborhood || 'moore',
    boardSize: Math.round(clampNumber(rawConfig.boardSize, 32, 12, MAX_SIZE)),
    seedDensity: clampNumber(rawConfig.seedDensity, 0.22, 0.01, 0.8),
    seedsPerRule: Math.round(clampNumber(rawConfig.seedsPerRule, 3, 1, MAX_SEEDS)),
    generations: Math.round(clampNumber(rawConfig.generations, 80, 5, MAX_GENERATIONS)),
    baseSeed: Math.round(clampNumber(rawConfig.baseSeed, 20260627, 1, 0x7fffffff)),
    birthSets,
    survivalSets
  };

  const rules = [];
  for (const survival of survivalSets) {
    for (const birth of birthSets) {
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
      const run = runOne(config, entry.rule, seedIndex);
      classCounts[run.classification] += 1;
      runs.push(run);
      completedRuns += 1;
      self.postMessage({ type: 'progress', completedRuns, totalRuns });
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

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'scan') return;
  try {
    self.postMessage({ type: 'complete', payload: runScan(event.data.config || {}) });
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || String(error) });
  }
});
