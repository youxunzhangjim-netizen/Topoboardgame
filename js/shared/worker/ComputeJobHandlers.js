import { buildAdjacencyMap, createBoardSpec } from '../BoardSpec.js';
import { validateBoardSpec } from '../BoardSpecValidator.js';
import { computeLifeObservables } from '../../life/research/LifeResearchObservables.js';
import { createLifeEngine } from '../../../life/js/LifeEngine.js';

export const COMPUTE_WORKER_JOB_TYPES = Object.freeze([
  'buildAdjacencyFromCoordinateRules',
  'validateBoardSpec',
  'runLifeSteps',
  'runLabSteps',
  'computeConnectedComponents',
  'computeShortestPaths',
  'compute4DProjection',
  'computeResearchObservables'
]);

function cloneJson(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function assertKnownJob(jobType) {
  if (!COMPUTE_WORKER_JOB_TYPES.includes(jobType)) {
    throw new Error(`Unsupported compute job type: ${jobType}`);
  }
}

function coordEntries(coord = {}) {
  if (Array.isArray(coord)) return coord.map((value, index) => [String(index), value]);
  return Object.keys(coord).sort().map((key) => [key, coord[key]]);
}

function coordKey(coord = {}) {
  return coordEntries(coord).map(([key, value]) => `${key}:${value}`).join('|');
}

function normalizeAxisKey(axis) {
  if (typeof axis === 'number') return String(axis);
  return String(axis);
}

function applyDelta(coord = {}, delta = {}) {
  const out = Array.isArray(coord) ? coord.slice() : { ...coord };
  const entries = Array.isArray(delta)
    ? delta.map((value, index) => [String(index), value])
    : Object.entries(delta);
  for (const [rawAxis, rawValue] of entries) {
    const axis = normalizeAxisKey(rawAxis);
    const value = Number(rawValue) || 0;
    const current = Number(out[axis] ?? 0);
    out[axis] = current + value;
  }
  return out;
}

function normalizeCoordinate(coord, size = null, periodicAxes = []) {
  if (!size) return coord;
  const out = Array.isArray(coord) ? coord.slice() : { ...coord };
  const periodic = new Set(periodicAxes.map(String));
  const entries = Array.isArray(size)
    ? size.map((value, index) => [String(index), value])
    : Object.entries(size);
  for (const [axis, rawLimit] of entries) {
    const limit = Math.max(1, Math.floor(Number(rawLimit) || 1));
    const value = Number(out[axis]);
    if (!Number.isFinite(value)) continue;
    if (value < 0 || value >= limit) {
      if (!periodic.has(String(axis))) return null;
      out[axis] = ((value % limit) + limit) % limit;
    }
  }
  return out;
}

function edgeKey(a, b) {
  const source = String(a);
  const target = String(b);
  return source < target ? `${source}|${target}` : `${target}|${source}`;
}

function adjacencyFromSitesEdges(sites = [], edges = []) {
  const adjacency = new Map(sites.map((site) => [String(site.id), new Set()]));
  for (const edge of edges) {
    const source = String(edge.source ?? edge.from ?? edge[0]);
    const target = String(edge.target ?? edge.to ?? edge[1]);
    if (!adjacency.has(source) || !adjacency.has(target) || source === target) continue;
    adjacency.get(source).add(target);
    adjacency.get(target).add(source);
  }
  return adjacency;
}

function serializeAdjacency(adjacency) {
  return Object.fromEntries([...adjacency.entries()].map(([id, neighbors]) => [id, [...neighbors]]));
}

function connectedComponentsFromAdjacency(adjacency) {
  const remaining = new Set(adjacency.keys());
  const components = [];
  while (remaining.size) {
    const root = remaining.values().next().value;
    const stack = [root];
    const sites = [];
    remaining.delete(root);
    while (stack.length) {
      const id = stack.pop();
      sites.push(id);
      for (const neighbor of adjacency.get(id) || []) {
        if (remaining.delete(neighbor)) stack.push(neighbor);
      }
    }
    components.push(sites);
  }
  components.sort((a, b) => b.length - a.length);
  return components;
}

function boardPieces(payload = {}) {
  const boardSpec = payload.boardSpec ? createBoardSpec(payload.boardSpec) : null;
  const sites = boardSpec?.sites || payload.sites || [];
  const edges = boardSpec?.edges || payload.edges || [];
  return { boardSpec, sites, edges };
}

function buildAdjacencyFromCoordinateRules(payload = {}) {
  const sites = (payload.sites || []).map((site, index) => ({
    id: String(site.id ?? `site:${index}`),
    coord: site.coord ?? site
  }));
  const directions = payload.directions || payload.coordinateRules || [];
  const size = payload.size || payload.bounds || null;
  const periodicAxes = payload.periodicAxes || payload.wrapAxes || [];
  const byCoord = new Map(sites.map((site) => [coordKey(site.coord), site.id]));
  const seen = new Set();
  const edges = [];

  for (const site of sites) {
    for (const rawDirection of directions) {
      const delta = rawDirection.delta || rawDirection;
      const nextCoord = normalizeCoordinate(applyDelta(site.coord, delta), size, periodicAxes);
      if (!nextCoord) continue;
      const target = byCoord.get(coordKey(nextCoord));
      if (!target || target === site.id) continue;
      const key = edgeKey(site.id, target);
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        source: site.id,
        target,
        ...(rawDirection.id || rawDirection.dir ? { dir: String(rawDirection.id || rawDirection.dir) } : {}),
        ...(rawDirection.seam ? { seam: true } : {})
      });
    }
  }

  const adjacency = adjacencyFromSitesEdges(sites, edges);
  return {
    sites,
    edges,
    adjacency: serializeAdjacency(adjacency),
    stats: {
      siteCount: sites.length,
      edgeCount: edges.length,
      connectedComponents: connectedComponentsFromAdjacency(adjacency).length
    }
  };
}

function validateBoardSpecJob(payload = {}) {
  const boardSpec = createBoardSpec(payload.boardSpec || payload);
  return validateBoardSpec(boardSpec, payload.options || {});
}

function computeConnectedComponentsJob(payload = {}) {
  const { boardSpec, sites, edges } = boardPieces(payload);
  const adjacency = boardSpec ? buildAdjacencyMap(boardSpec) : adjacencyFromSitesEdges(sites, edges);
  const components = connectedComponentsFromAdjacency(adjacency);
  return {
    components,
    stats: {
      siteCount: adjacency.size,
      componentCount: components.length,
      largestComponent: components[0]?.length || 0
    }
  };
}

function computeShortestPathsJob(payload = {}, _options = {}, hooks = {}) {
  const { boardSpec, sites, edges } = boardPieces(payload);
  const adjacency = boardSpec ? buildAdjacencyMap(boardSpec) : adjacencyFromSitesEdges(sites, edges);
  const sources = (payload.sourceIds || payload.sources || []).map(String);
  const targets = new Set((payload.targetIds || payload.targets || []).map(String));
  const maxVisited = Math.max(1, Number(payload.maxVisited || adjacency.size || 1));
  const distances = {};
  const previous = {};
  const queue = [];

  for (const source of sources) {
    if (!adjacency.has(source)) continue;
    distances[source] = 0;
    queue.push(source);
  }

  let head = 0;
  while (head < queue.length && Object.keys(distances).length <= maxVisited) {
    hooks.throwIfCancelled?.();
    const id = queue[head];
    head += 1;
    if (targets.size && targets.has(id) && targets.size === [...targets].filter((target) => distances[target] != null).length) break;
    for (const neighbor of adjacency.get(id) || []) {
      if (distances[neighbor] != null) continue;
      distances[neighbor] = distances[id] + 1;
      previous[neighbor] = id;
      queue.push(neighbor);
    }
    if (head % 1000 === 0) hooks.onProgress?.({ completed: head, total: Math.max(1, adjacency.size) });
  }

  return { distances, previous, visited: Object.keys(distances).length };
}

function numericCoord(site, axis, fallback = 0) {
  const coord = site.coord || site.position4D || site.position || {};
  if (Array.isArray(coord)) {
    const index = Number(axis);
    return Number.isFinite(index) ? Number(coord[index] ?? fallback) : fallback;
  }
  return Number(coord[axis] ?? site[axis] ?? fallback);
}

function compute4DProjectionJob(payload = {}, _options = {}, hooks = {}) {
  const sites = payload.sites || payload.boardSpec?.sites || [];
  const slice = payload.slice || {};
  const axisX = payload.axes?.x || 'x';
  const axisY = payload.axes?.y || 'y';
  const depthAxis = payload.axes?.depth || payload.axes?.z || 'z';
  const sliceAxis = slice.axis || payload.axes?.slice || 'w';
  const sliceValue = slice.value;
  const tolerance = Number(slice.tolerance ?? 0.001);
  const scale = Number(payload.scale || 1);
  const offset = payload.offset || {};
  const visibleSites = [];

  for (let index = 0; index < sites.length; index += 1) {
    hooks.throwIfCancelled?.();
    const site = sites[index];
    if (sliceValue != null && Math.abs(numericCoord(site, sliceAxis) - Number(sliceValue)) > tolerance) continue;
    visibleSites.push({
      id: String(site.id ?? index),
      coord: cloneJson(site.coord || {}),
      draw: {
        x: numericCoord(site, axisX) * scale + Number(offset.x || 0),
        y: numericCoord(site, axisY) * scale + Number(offset.y || 0)
      },
      depth: numericCoord(site, depthAxis)
    });
    if (index % 2000 === 0) hooks.onProgress?.({ completed: index, total: sites.length });
  }

  return {
    visibleSites,
    stats: {
      inputSites: sites.length,
      visibleSites: visibleSites.length
    }
  };
}

function runLifeStepsJob(payload = {}, _options = {}, hooks = {}) {
  const steps = Math.max(0, Math.floor(Number(payload.steps || payload.generations || 1)));
  const engine = createLifeEngine(payload.engineOptions || payload.config || {});
  if (payload.state) engine.setState(payload.state);
  if (payload.randomSeed) engine.randomSeed(payload.randomSeed);

  for (let step = 0; step < steps; step += 1) {
    hooks.throwIfCancelled?.();
    engine.step();
    if (step % 10 === 0 || step === steps - 1) hooks.onProgress?.({ completed: step + 1, total: steps });
  }

  return {
    state: engine.getState(),
    observables: engine.getObservables()
  };
}

function runLabStepsJob(payload = {}, _options = {}, hooks = {}) {
  const steps = payload.steps || [];
  if (!Array.isArray(steps)) throw new Error('runLabSteps requires a JSON-serializable steps array.');
  const state = cloneJson(payload.initialState || {});

  for (let index = 0; index < steps.length; index += 1) {
    hooks.throwIfCancelled?.();
    const step = steps[index] || {};
    if (step.op === 'set') state[step.key] = cloneJson(step.value);
    else if (step.op === 'increment') state[step.key] = Number(state[step.key] || 0) + Number(step.value ?? 1);
    else if (step.op === 'append') {
      if (!Array.isArray(state[step.key])) state[step.key] = [];
      state[step.key].push(cloneJson(step.value));
    } else if (step.op) {
      throw new Error(`Unsupported JSON lab step op: ${step.op}`);
    }
    if (index % 100 === 0 || index === steps.length - 1) hooks.onProgress?.({ completed: index + 1, total: steps.length });
  }

  return { state, stepsRun: steps.length };
}

function computeResearchObservablesJob(payload = {}) {
  return computeLifeObservables(payload.state, payload.board, payload.defectLayer, payload.options || {});
}

export async function runComputeJob(jobType, payload = {}, options = {}, hooks = {}) {
  assertKnownJob(jobType);
  switch (jobType) {
    case 'buildAdjacencyFromCoordinateRules':
      return buildAdjacencyFromCoordinateRules(payload, options, hooks);
    case 'validateBoardSpec':
      return validateBoardSpecJob(payload, options, hooks);
    case 'runLifeSteps':
      return runLifeStepsJob(payload, options, hooks);
    case 'runLabSteps':
      return runLabStepsJob(payload, options, hooks);
    case 'computeConnectedComponents':
      return computeConnectedComponentsJob(payload, options, hooks);
    case 'computeShortestPaths':
      return computeShortestPathsJob(payload, options, hooks);
    case 'compute4DProjection':
      return compute4DProjectionJob(payload, options, hooks);
    case 'computeResearchObservables':
      return computeResearchObservablesJob(payload, options, hooks);
    default:
      throw new Error(`Unsupported compute job type: ${jobType}`);
  }
}

