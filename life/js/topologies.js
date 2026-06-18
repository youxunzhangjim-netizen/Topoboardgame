/**
 * Topology and lattice helpers for Life & Evolution Worlds.
 *
 * Boundary names deliberately accept the same short forms used by the 2D/3D
 * Go and Reversi pages: r2, t2, mobius, klein, sphere/s2, rp2, r3, t3,
 * r3_random, and reflective. Rendering can show these as flat cut-open boards,
 * projected surfaces, or layered 3D volumes, while the engine only needs the
 * intrinsic glued-boundary map and lattice neighbor directions.
 */

export const BOUNDARY_ALIASES = {
  r2: 'open',
  open2d: 'open',
  obc: 'open',
  plane: 'open',
  bounded: 'open',
  open: 'open',
  cube: 'open',
  r3: 'open',
  torus: 'torus',
  pbc: 'torus',
  periodic: 'torus',
  periodic_cube: 'torus',
  t2: 'torus',
  t3: 'torus',
  cylinder: 'cylinder',
  mobius: 'mobius',
  moebius: 'mobius',
  'möbius': 'mobius',
  mobius_strip: 'mobius',
  'mobius-strip': 'mobius',
  klein: 'klein',
  klein_bottle: 'klein',
  'klein-bottle': 'klein',
  sphere: 'sphere',
  s2: 'sphere',
  sphere_like: 'sphere',
  projective: 'projective',
  projective_plane: 'projective',
  rp2: 'projective',
  reflective: 'reflective',
  reflection: 'reflective',
  mirror: 'reflective',
  random: 'random',
  rbc: 'random',
  random_boundary: 'random',
  r2_random: 'random',
  r3_random: 'random'
};

export function normalizeBoundary(boundary = 'open') {
  return BOUNDARY_ALIASES[String(boundary).toLowerCase()] || 'open';
}

export function normalizeDimension(dimension = 2) {
  const dim = Number(dimension);
  return [1, 2, 3, 4].includes(dim) ? dim : 2;
}

export function normalizeLattice(lattice = 'square', dimension = 2) {
  const value = String(lattice || '').toLowerCase();
  if (dimension >= 3) {
    if (['bcc', 'body-centered', 'body_centered'].includes(value)) return 'bcc';
    if (['fcc', 'face-centered', 'face_centered'].includes(value)) return 'fcc';
    if (['hcp', 'hexagonal-close-packed', 'hexagonal_close_packed'].includes(value)) return 'hcp';
    return 'sc';
  }
  if (['tri', 'triangle', 'triangular'].includes(value)) return 'triangular';
  if (['hex', 'honeycomb', 'hexagonal'].includes(value)) return 'honeycomb';
  return 'square';
}

export function normalizeSize(size, dimension = 2) {
  if (Array.isArray(size)) {
    const out = size.slice(0, dimension).map((n) => Math.max(1, Math.floor(Number(n) || 1)));
    while (out.length < dimension) out.push(out[out.length - 1] || 1);
    return out;
  }
  const n = Math.max(1, Math.floor(Number(size) || 64));
  return Array.from({ length: dimension }, () => n);
}

export function positionKey(position) {
  return position.join(',');
}

const TRIANGULAR_DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const HONEYCOMB_EVEN = [[1, 0], [-1, 0], [0, 1]];
const HONEYCOMB_ODD = [[1, 0], [-1, 0], [0, -1]];
const BCC_DIRECTIONS = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z])));
const FCC_DIRECTIONS = [];
for (const a of [-1, 1]) {
  for (const b of [-1, 1]) {
    FCC_DIRECTIONS.push([a, b, 0], [a, 0, b], [0, a, b]);
  }
}
const HCP_DIRECTIONS = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [1, -1, 0], [-1, 1, 0],
  [0, 0, 1], [0, 0, -1], [1, 0, 1], [-1, 0, -1], [0, 1, 1], [0, -1, -1]
];

export function generateDirections(dimension = 2, neighborhoodType = 'moore', lattice = 'square', position = []) {
  const dim = normalizeDimension(dimension);
  const type = String(neighborhoodType || (dim === 1 ? 'nearest' : 'moore')).toLowerCase();
  const lat = normalizeLattice(lattice, dim);

  if (dim === 1) return [[-1], [1]];

  if (dim === 2 && (type === 'nearest' || type === 'lattice')) {
    if (lat === 'triangular') return TRIANGULAR_DIRECTIONS;
    if (lat === 'honeycomb') return ((position[0] + position[1]) % 2 === 0) ? HONEYCOMB_EVEN : HONEYCOMB_ODD;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]];
  }

  if (dim === 3 && (type === 'nearest' || type === 'lattice')) {
    if (lat === 'bcc') return BCC_DIRECTIONS;
    if (lat === 'fcc') return FCC_DIRECTIONS;
    if (lat === 'hcp') return HCP_DIRECTIONS;
    return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  }

  if (dim === 2) {
    if (lat === 'triangular') return TRIANGULAR_DIRECTIONS;
    if (lat === 'honeycomb') return ((position[0] + position[1]) % 2 === 0) ? HONEYCOMB_EVEN : HONEYCOMB_ODD;
  }

  if (dim === 3) {
    if (lat === 'bcc') return BCC_DIRECTIONS;
    if (lat === 'fcc') return FCC_DIRECTIONS;
    if (lat === 'hcp') return HCP_DIRECTIONS;
  }

  const directions = [];
  function build(prefix, axis) {
    if (axis === dim) {
      if (prefix.every((v) => v === 0)) return;
      if (type === 'von_neumann' || type === 'vonneumann' || type === 'von-neumann') {
        const manhattan = prefix.reduce((sum, v) => sum + Math.abs(v), 0);
        if (manhattan !== 1) return;
      }
      directions.push(prefix.slice());
      return;
    }
    for (const delta of [-1, 0, 1]) {
      prefix.push(delta);
      build(prefix, axis + 1);
      prefix.pop();
    }
  }
  build([], 0);
  return directions;
}

function wrap(value, size) {
  return ((value % size) + size) % size;
}

function reflect(value, size) {
  if (size <= 1) return 0;
  let v = value;
  while (v < 0 || v >= size) {
    if (v < 0) v = -v - 1;
    if (v >= size) v = (2 * size) - v - 1;
  }
  return v;
}

function inside(position, size) {
  return position.every((value, axis) => value >= 0 && value < size[axis]);
}

function hashInts(values) {
  let h = 2166136261;
  for (const value of values) {
    h ^= Math.floor(value * 1315423911);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mapOpen(position, size) {
  return inside(position, size) ? position : null;
}

function mapTorus(position, size) {
  return position.map((value, axis) => wrap(value, size[axis]));
}

function mapReflective(position, size) {
  return position.map((value, axis) => reflect(value, size[axis]));
}

function mapRandomBoundary(position, size) {
  if (inside(position, size)) return position;
  const h = hashInts(position.concat(size));
  return size.map((n, axis) => {
    const shifted = h >>> ((axis * 7) % 24);
    return shifted % n;
  });
}

function mapCylinder(position, size) {
  const dim = size.length;
  const mapped = position.slice();
  mapped[0] = wrap(mapped[0], size[0]);
  for (let axis = 1; axis < dim; axis += 1) {
    if (mapped[axis] < 0 || mapped[axis] >= size[axis]) return null;
  }
  return mapped;
}

function mapMobius(position, size) {
  if (size.length < 2) return mapTorus(position, size);
  const mapped = position.slice();
  if (mapped[0] < 0 || mapped[0] >= size[0]) {
    mapped[0] = wrap(mapped[0], size[0]);
    mapped[1] = size[1] - 1 - mapped[1];
  }
  if (mapped[1] < 0 || mapped[1] >= size[1]) return null;
  for (let axis = 2; axis < size.length; axis += 1) {
    if (mapped[axis] < 0 || mapped[axis] >= size[axis]) return null;
  }
  return mapped;
}

function mapKlein(position, size) {
  if (size.length < 2) return mapTorus(position, size);
  const mapped = position.slice();
  if (mapped[0] < 0 || mapped[0] >= size[0]) {
    mapped[0] = wrap(mapped[0], size[0]);
    mapped[1] = size[1] - 1 - mapped[1];
  }
  mapped[1] = wrap(mapped[1], size[1]);
  for (let axis = 2; axis < size.length; axis += 1) mapped[axis] = wrap(mapped[axis], size[axis]);
  return mapped;
}

function mapSphereLike(position, size) {
  if (size.length < 2) return mapOpen(position, size);
  const mapped = position.slice();
  mapped[0] = wrap(mapped[0], size[0]);
  if (mapped[1] < 0) {
    mapped[1] = 0;
    mapped[0] = wrap(mapped[0] + Math.floor(size[0] / 2), size[0]);
  } else if (mapped[1] >= size[1]) {
    mapped[1] = size[1] - 1;
    mapped[0] = wrap(mapped[0] + Math.floor(size[0] / 2), size[0]);
  }
  for (let axis = 2; axis < size.length; axis += 1) mapped[axis] = wrap(mapped[axis], size[axis]);
  return mapped;
}

function mapProjectivePlane(position, size) {
  if (size.length < 2) return mapOpen(position, size);
  const mapped = position.slice();
  if (mapped[0] < 0 || mapped[0] >= size[0]) {
    mapped[0] = wrap(mapped[0], size[0]);
    mapped[1] = size[1] - 1 - mapped[1];
  }
  if (mapped[1] < 0 || mapped[1] >= size[1]) {
    mapped[1] = wrap(mapped[1], size[1]);
    mapped[0] = size[0] - 1 - mapped[0];
  }
  if (!inside(mapped.slice(0, 2), size.slice(0, 2))) return null;
  for (let axis = 2; axis < size.length; axis += 1) mapped[axis] = wrap(mapped[axis], size[axis]);
  return mapped;
}

export class LifeTopology {
  constructor({ size = [64, 64], dimension = 2, boundary = 'open' } = {}) {
    this.dimension = normalizeDimension(dimension);
    this.size = normalizeSize(size, this.dimension);
    this.boundary = normalizeBoundary(boundary);
  }

  clone(overrides = {}) {
    return new LifeTopology({
      size: overrides.size ?? this.size,
      dimension: overrides.dimension ?? this.dimension,
      boundary: overrides.boundary ?? this.boundary
    });
  }

  inBounds(position) {
    return inside(position, this.size);
  }

  map(position) {
    const p = position.slice(0, this.dimension);
    while (p.length < this.dimension) p.push(0);
    switch (this.boundary) {
      case 'torus': return mapTorus(p, this.size);
      case 'cylinder': return mapCylinder(p, this.size);
      case 'mobius': return mapMobius(p, this.size);
      case 'klein': return mapKlein(p, this.size);
      case 'sphere': return mapSphereLike(p, this.size);
      case 'projective': return mapProjectivePlane(p, this.size);
      case 'reflective': return mapReflective(p, this.size);
      case 'random': return mapRandomBoundary(p, this.size);
      case 'open':
      default: return mapOpen(p, this.size);
    }
  }

  step(position, direction) {
    const next = position.map((value, axis) => value + (direction[axis] || 0));
    return this.map(next);
  }

  getNeighbors(position, dimension = this.dimension, neighborhoodType = 'moore', lattice = 'square') {
    const seen = new Set();
    const neighbors = [];
    for (const direction of generateDirections(dimension, neighborhoodType, lattice, position)) {
      const mapped = this.step(position, direction);
      if (!mapped) continue;
      const key = positionKey(mapped);
      if (seen.has(key)) continue;
      seen.add(key);
      neighbors.push(mapped);
    }
    return neighbors;
  }
}

export function createTopology(options = {}) {
  return new LifeTopology(options);
}
