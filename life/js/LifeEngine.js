import {
  createTopology,
  normalizeDimension,
  normalizeSize,
  normalizeLattice,
  normalizeNeighborhoodRadius,
  metricForNeighborhood,
  positionKey
} from './topologies.js';
import { applyRule, createCell, emptyCell, cloneCell, isAlive } from './rules.js';
import { getRulePreset } from './presets.js';
import { computeObservables } from './observables.js';

/**
 * Rendering-independent cellular automaton engine.
 *
 * This class is intentionally plain JavaScript and browser/Node compatible.
 * It does not touch DOM, canvas, WebGL, Firebase, or UI state. The same object
 * can therefore be used by:
 *
 * - visual Life UI,
 * - local robot / AI experiments,
 * - research self-play/statistics tools,
 * - future training pipelines.
 */
export class LifeEngine {
  constructor(options = {}) {
    this.dimension = normalizeDimension(options.dimension ?? 2);
    this.size = normalizeSize(options.size ?? 64, this.dimension);
    this.topology = createTopology({
      size: this.size,
      dimension: this.dimension,
      boundary: options.boundary ?? 'open'
    });
    this.neighborhoodType = options.neighborhoodType || (this.dimension === 1 ? 'nearest' : 'moore');
    this.neighborhoodRadius = normalizeNeighborhoodRadius(options.neighborhoodRadius ?? options.radius ?? 1);
    this.neighborhoodMetric = options.neighborhoodMetric || options.metric || metricForNeighborhood(this.neighborhoodType);
    this.lattice = normalizeLattice(options.lattice || (this.dimension >= 3 ? 'sc' : 'square'), this.dimension);
    this.rule = options.rule ? structuredClone(options.rule) : getRulePreset(options.preset || 'conway');
    this.rng = options.rng || Math.random;
    this.generation = 0;
    this.lastStep = { births: 0, deaths: 0, mutations: 0, events: {} };
    this.cells = Array.from({ length: this.volume() }, () => emptyCell());

    if (options.seed) this.randomSeed(options.seed);
  }

  volume() {
    return this.size.reduce((product, n) => product * n, 1);
  }

  index(position) {
    let stride = 1;
    let out = 0;
    for (let axis = 0; axis < this.dimension; axis += 1) {
      out += position[axis] * stride;
      stride *= this.size[axis];
    }
    return out;
  }

  positionFromIndex(index) {
    let value = index;
    const position = [];
    for (let axis = 0; axis < this.dimension; axis += 1) {
      position.push(value % this.size[axis]);
      value = Math.floor(value / this.size[axis]);
    }
    return position;
  }

  eachPosition(callback) {
    for (let i = 0; i < this.cells.length; i += 1) {
      callback(this.positionFromIndex(i), i);
    }
  }

  inBounds(position) {
    return this.topology.inBounds(position);
  }

  getCell(position) {
    const mapped = this.topology.map(position);
    if (!mapped) return emptyCell();
    return this.cells[this.index(mapped)] || emptyCell();
  }

  setCell(position, cell) {
    const mapped = this.topology.map(position);
    if (!mapped) return false;
    this.cells[this.index(mapped)] = createCell(cell);
    return true;
  }

  toggleCell(position, speciesCount = this.rule.speciesCount || 1) {
    const mapped = this.topology.map(position);
    if (!mapped) return false;
    const i = this.index(mapped);
    const current = this.cells[i] || emptyCell();
    const nextSpecies = ((current.species || 0) + 1) % (speciesCount + 1);
    this.cells[i] = nextSpecies
      ? createCell({ state: 1, species: nextSpecies, age: 1, energy: 1, health: 1 })
      : emptyCell();
    return true;
  }

  clear() {
    this.cells = Array.from({ length: this.volume() }, () => emptyCell());
    this.generation = 0;
    this.lastStep = { births: 0, deaths: 0, mutations: 0, events: {} };
  }

  clone() {
    const copy = new LifeEngine({
      dimension: this.dimension,
      size: this.size,
      boundary: this.topology.boundary,
      neighborhoodType: this.neighborhoodType,
      neighborhoodRadius: this.neighborhoodRadius,
      neighborhoodMetric: this.neighborhoodMetric,
      lattice: this.lattice,
      rule: this.rule,
      rng: this.rng
    });
    copy.generation = this.generation;
    copy.lastStep = structuredClone(this.lastStep);
    copy.cells = this.cells.map(cloneCell);
    return copy;
  }

  configure(options = {}) {
    if (options.dimension || options.size || options.boundary) {
      const oldCells = this.cells;
      const oldSize = this.size;
      const oldDimension = this.dimension;

      this.dimension = normalizeDimension(options.dimension ?? this.dimension);
      this.size = normalizeSize(options.size ?? this.size, this.dimension);
      this.topology = createTopology({
        size: this.size,
        dimension: this.dimension,
        boundary: options.boundary ?? this.topology.boundary
      });
      this.cells = Array.from({ length: this.volume() }, () => emptyCell());

      // Copy overlapping region to preserve the visible board when possible.
      const minDim = Math.min(oldDimension, this.dimension);
      for (let i = 0; i < oldCells.length; i += 1) {
        const position = [];
        let value = i;
        for (let axis = 0; axis < oldDimension; axis += 1) {
          position.push(value % oldSize[axis]);
          value = Math.floor(value / oldSize[axis]);
        }
        if (position.slice(0, minDim).every((v, axis) => v < this.size[axis])) {
          while (position.length < this.dimension) position.push(0);
          this.setCell(position.slice(0, this.dimension), oldCells[i]);
        }
      }
    } else if (options.boundary) {
      this.topology = this.topology.clone({ boundary: options.boundary });
    }

    if (options.neighborhoodType) this.neighborhoodType = options.neighborhoodType;
    if (options.neighborhoodRadius || options.radius) this.neighborhoodRadius = normalizeNeighborhoodRadius(options.neighborhoodRadius ?? options.radius);
    if (options.neighborhoodMetric || options.metric || options.neighborhoodType) {
      this.neighborhoodMetric = options.neighborhoodMetric || options.metric || metricForNeighborhood(this.neighborhoodType);
    }
    if (options.lattice || options.dimension) this.lattice = normalizeLattice(options.lattice || this.lattice, this.dimension);
    if (options.rule) this.rule = structuredClone(options.rule);
    if (options.preset) this.rule = getRulePreset(options.preset);
    if (options.rng) this.rng = options.rng;
  }

  countNeighborCells(position) {
    return this.getNeighborPositions(position).map((neighbor) => this.getCell(neighbor));
  }

  getNeighborPositions(position) {
    return this.topology.getNeighbors(position, this.dimension, this.neighborhoodType, this.lattice, {
      radius: this.neighborhoodRadius,
      metric: this.neighborhoodMetric
    });
  }

  getNeighborhoodInfo(position = null) {
    const center = position || this.size.map((n) => Math.floor(n / 2));
    const neighbors = this.getNeighborPositions(center);
    return {
      dimension: this.dimension,
      neighborhoodType: this.neighborhoodType,
      neighborhoodRadius: this.neighborhoodRadius,
      neighborhoodMetric: this.neighborhoodMetric,
      lattice: this.lattice,
      count: neighbors.length,
      neighbors
    };
  }

  step() {
    const next = Array.from({ length: this.cells.length }, () => emptyCell());
    const metadata = { births: 0, deaths: 0, mutations: 0, events: {} };

    this.eachPosition((position, i) => {
      const cell = this.cells[i] || emptyCell();
      const neighborCells = this.countNeighborCells(position);
      const result = applyRule({
        cell,
        position,
        neighborCells,
        engine: this,
        rule: this.rule,
        rng: this.rng
      });

      next[i] = result.cell || emptyCell();
      const event = result.event || 'empty';
      metadata.events[event] = (metadata.events[event] || 0) + 1;
      if (event === 'birth') metadata.births += 1;
      if (event === 'death') metadata.deaths += 1;
      if (isAlive(cell) && isAlive(next[i]) && cell.species !== next[i].species) metadata.mutations += 1;
    });

    this.cells = next;
    this.generation += 1;
    this.lastStep = metadata;
    return this.getObservables();
  }

  getObservables() {
    return computeObservables(this, this.lastStep);
  }

  randomSeed({
    density = 0.18,
    speciesCount = this.rule.speciesCount || 1,
    energy = 1,
    health = 1,
    resetGeneration = true
  } = {}) {
    if (resetGeneration) {
      this.generation = 0;
      this.lastStep = { births: 0, deaths: 0, mutations: 0, events: {} };
    }

    for (let i = 0; i < this.cells.length; i += 1) {
      if (this.rng() < density) {
        this.cells[i] = createCell({
          state: 1,
          species: 1 + Math.floor(this.rng() * speciesCount),
          age: 1,
          energy,
          health
        });
      } else {
        this.cells[i] = emptyCell();
      }
    }

    return this.getObservables();
  }

  seedPattern(positions, { species = 1, age = 1, energy = 1, health = 1, clear = true } = {}) {
    if (clear) this.clear();
    for (const position of positions) {
      this.setCell(position, { state: 1, species, age, energy, health });
    }
    return this.getObservables();
  }

  exportState() {
    return {
      dimension: this.dimension,
      size: this.size.slice(),
      boundary: this.topology.boundary,
      neighborhoodType: this.neighborhoodType,
      neighborhoodRadius: this.neighborhoodRadius,
      neighborhoodMetric: this.neighborhoodMetric,
      lattice: this.lattice,
      rule: structuredClone(this.rule),
      generation: this.generation,
      cells: this.cells.map(cloneCell)
    };
  }

  importState(state) {
    this.dimension = normalizeDimension(state.dimension);
    this.size = normalizeSize(state.size, this.dimension);
    this.topology = createTopology({ size: this.size, dimension: this.dimension, boundary: state.boundary });
    this.neighborhoodType = state.neighborhoodType || 'moore';
    this.neighborhoodRadius = normalizeNeighborhoodRadius(state.neighborhoodRadius ?? state.radius ?? 1);
    this.neighborhoodMetric = state.neighborhoodMetric || state.metric || metricForNeighborhood(this.neighborhoodType);
    this.lattice = normalizeLattice(state.lattice || (this.dimension >= 3 ? 'sc' : 'square'), this.dimension);
    this.rule = structuredClone(state.rule || getRulePreset('conway'));
    this.generation = Number(state.generation || 0);
    this.cells = (state.cells || []).map(cloneCell);
    while (this.cells.length < this.volume()) this.cells.push(emptyCell());
    this.cells.length = this.volume();
  }
}

export function createLifeEngine(options = {}) {
  return new LifeEngine(options);
}

export { isAlive, createCell, emptyCell, positionKey };
