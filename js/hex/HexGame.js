import {
    createSpecialBoardTopology,
    isSpecialBoardTopology,
    normalizeSpecialTopology
} from '../topology/SpecialBoardTopologies.js';

export const HEX_COLORS = Object.freeze({
    BLACK: 'black',
    WHITE: 'white'
});

const HEX_COLOR_VALUES = new Set(Object.values(HEX_COLORS));
const SUPPORTED_DIMENSIONS = new Set([2, 3, 4]);
const TOPOLOGY_ALIASES = Object.freeze({
    open: 'open',
    flat: 'open',
    plane: 'open',
    rhombus: 'open',
    r2: 'open',
    r3: 'open',
    r4: 'open',
    cube: 'open',
    hypercube: 'open',
    cylinder: 'cylinder',
    cylindrical: 'cylinder',
    torus: 'torus',
    t3: 'torus',
    t4: 'torus',
    '4d-torus': 'torus',
    t2: 't2',
    '2-torus': 't2',
    'torus-surface': 't2',
    sphere: 'sphere',
    s2: 'sphere',
    'sphere-s2': 'sphere',
    reflective: 'reflective',
    mobius: 'mobius',
    'mobius-strip': 'mobius',
    'möbius': 'mobius',
    klein: 'klein',
    'klein-bottle': 'klein',
    rp2: 'rp2',
    projective: 'rp2',
    'projective-plane': 'rp2',
    random: 'random',
    'random-boundary': 'random',
    rbc: 'random',
    'r3-random': 'r3_random',
    r3_random: 'r3_random',
    '3d-rbc': 'r3_random'
});

const SURFACE_3D_TOPOLOGIES = new Set(['t2', 'cylinder', 'sphere', 'mobius', 'klein', 'rp2']);
const VOLUME_3D_TOPOLOGIES = new Set(['open', 'torus', 'reflective', 'r3_random']);

export function otherHexColor(color) {
    if (color === HEX_COLORS.BLACK) return HEX_COLORS.WHITE;
    if (color === HEX_COLORS.WHITE) return HEX_COLORS.BLACK;
    throw new TypeError(`Unknown Hex color: ${String(color)}`);
}

function normalizeDimension(value) {
    const dimension = Number(value);
    if (!SUPPORTED_DIMENSIONS.has(dimension)) {
        throw new RangeError('Hex dimension must be 2, 3, or 4.');
    }
    return dimension;
}

function normalizeAxisSize(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(2, Math.min(64, Math.floor(parsed)));
}

export function normalizeHexSize(size, dimension = 2) {
    const normalizedDimension = normalizeDimension(dimension);
    const fallback = normalizedDimension === 2 ? 11 : normalizedDimension === 3 ? 7 : 5;

    if (Array.isArray(size)) {
        return Array.from(
            { length: normalizedDimension },
            (_, axis) => normalizeAxisSize(size[axis], fallback)
        );
    }

    if (size && typeof size === 'object') {
        const axisNames = ['x', 'y', 'z', 'w'];
        return axisNames
            .slice(0, normalizedDimension)
            .map((axis) => normalizeAxisSize(size[axis], fallback));
    }

    const uniformSize = normalizeAxisSize(size, fallback);
    return Array(normalizedDimension).fill(uniformSize);
}

export function normalizeHexTopology(topology = 'open', dimension = 2) {
    const normalizedDimension = normalizeDimension(dimension);
    const token = String(topology ?? 'open')
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-');
    const special = normalizeSpecialTopology(token);
    if (special) return special;
    const normalized = TOPOLOGY_ALIASES[token] ?? 'open';

    if (normalizedDimension === 2) {
        if (normalized === 't2') return 'torus';
        if (normalized === 'r3_random' || normalized === 'sphere') return 'open';
        return normalized === 'reflective' ? 'open' : normalized;
    }
    if (normalizedDimension === 3) {
        return VOLUME_3D_TOPOLOGIES.has(normalized) || SURFACE_3D_TOPOLOGIES.has(normalized)
            ? normalized
            : 'open';
    }
    return ['open', 'torus', 'reflective'].includes(normalized) ? normalized : 'open';
}

export function normalizeHexLattice(lattice = 'hexagonal', dimension = 2) {
    const normalizedDimension = normalizeDimension(dimension);
    const token = String(lattice || '').trim().toLowerCase();
    if (normalizedDimension === 3) {
        if (token === 'hcp') return 'hcp';
        if (token === 'bcc') return 'bcc';
        if (token === 'fcc') return 'fcc';
        if (token === 'simple-cubic' || token === 'simple_cubic' || token === 'cubic' || token === 'sc') return 'axis';
        return 'axis';
    }
    if (normalizedDimension !== 2) return 'axis';
    if (token === 'square' || token === 'quad') return 'square';
    if (token === 'triangular' || token === 'triangle') return 'triangular';
    if (token === 'honeycomb' || token === 'hexagon' || token === 'hexagonal' || token === 'axial') return 'hexagonal';
    return 'hexagonal';
}

function modulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

function reflect(value, size) {
    return size - 1 - value;
}

function coordinateKey(coordinate) {
    return coordinate.join(',');
}

function uniqueCoordinates(coordinates) {
    return [...new Map(coordinates.map((coordinate) => [coordinateKey(coordinate), coordinate])).values()];
}

function parseCoordinateKey(key, dimension) {
    const coordinate = String(key).split(',').map(Number);
    if (
        coordinate.length !== dimension ||
        coordinate.some((value) => !Number.isInteger(value))
    ) {
        throw new TypeError(`Invalid ${dimension}D Hex coordinate key: ${String(key)}`);
    }
    return coordinate;
}

function coordinatesEqual(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizeCoordinateInput(coordinate, dimension) {
    if (!Array.isArray(coordinate) || coordinate.length !== dimension) return null;
    const normalized = coordinate.map(Number);
    return normalized.every(Number.isInteger) ? normalized : null;
}

function normalize2DCoordinate(coordinate, size, topology, randomBoundary = null) {
    let [x, y] = coordinate;
    const [width, height] = size;

    if (topology === 'open') {
        return x >= 0 && x < width && y >= 0 && y < height ? [x, y] : null;
    }

    if (topology === 'cylinder') {
        return y >= 0 && y < height ? [modulo(x, width), y] : null;
    }

    if (topology === 'torus') {
        return [modulo(x, width), modulo(y, height)];
    }

    if (topology === 'mobius') {
        if (y < 0 || y >= height) return null;
        if (x < 0 || x >= width) {
            const crossings = Math.floor(x / width);
            x = modulo(x, width);
            if (Math.abs(crossings) % 2 === 1) y = reflect(y, height);
        }
        return [x, y];
    }

    if (topology === 'klein') {
        if (y < 0 || y >= height) {
            const crossings = Math.floor(y / height);
            y = modulo(y, height);
            if (Math.abs(crossings) % 2 === 1) x = reflect(x, width);
        }
        return [modulo(x, width), y];
    }

    if (topology === 'rp2') {
        let guard = 0;
        while ((x < 0 || x >= width || y < 0 || y >= height) && guard < 4) {
            if (x < 0 || x >= width) {
                x = modulo(x, width);
                y = reflect(y, height);
            }
            if (y < 0 || y >= height) {
                y = modulo(y, height);
                x = reflect(x, width);
            }
            guard += 1;
        }
        return x >= 0 && x < width && y >= 0 && y < height ? [x, y] : null;
    }

    if (topology === 'random' && randomBoundary) {
        let guard = 0;
        while ((x < 0 || x >= width || y < 0 || y >= height) && guard < 4) {
            if (x < 0) {
                x = width - 1;
                y = randomBoundary.xInverse[modulo(y, height)];
            } else if (x >= width) {
                x = 0;
                y = randomBoundary.xForward[modulo(y, height)];
            }
            if (y < 0) {
                y = height - 1;
                x = randomBoundary.yInverse[modulo(x, width)];
            } else if (y >= height) {
                y = 0;
                x = randomBoundary.yForward[modulo(x, width)];
            }
            guard += 1;
        }
        return x >= 0 && x < width && y >= 0 && y < height ? [x, y] : null;
    }

    return null;
}

function hashSeed(seed) {
    let hash = 2166136261;
    for (const character of String(seed)) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function seededPermutation(length, seed) {
    const values = Array.from({ length }, (_, index) => index);
    let state = hashSeed(seed) || 1;
    const random = () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 0x100000000;
    };
    for (let index = values.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(random() * (index + 1));
        [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
}

function invertPermutation(permutation) {
    const inverse = Array(permutation.length);
    permutation.forEach((value, index) => {
        inverse[value] = index;
    });
    return inverse;
}

function createRandomBoundary(size, seed) {
    const xForward = seededPermutation(size[1], `${seed}:x`);
    const yForward = seededPermutation(size[0], `${seed}:y`);
    return Object.freeze({
        xForward: Object.freeze(xForward),
        xInverse: Object.freeze(invertPermutation(xForward)),
        yForward: Object.freeze(yForward),
        yInverse: Object.freeze(invertPermutation(yForward))
    });
}

function normalizeHigherDimCoordinate(coordinate, size, topology) {
    if (topology === 'torus') {
        return coordinate.map((value, axis) => modulo(value, size[axis]));
    }

    if (topology === 'cylinder') {
        const lastAxis = coordinate.length - 1;
        if (coordinate.some((value, axis) => axis !== lastAxis && (value < 0 || value >= size[axis]))) {
            return null;
        }
        const normalized = [...coordinate];
        normalized[lastAxis] = modulo(normalized[lastAxis], size[lastAxis]);
        return normalized;
    }

    // Nearest-neighbor reflection produces the same simple graph as an open
    // boundary after self-neighbors are removed, while retaining its UI label.
    return coordinate.every((value, axis) => value >= 0 && value < size[axis])
        ? coordinate
        : null;
}

function normalizeSurface3DCoordinate(coordinate, size, topology, randomBoundary = null) {
    const [x, y, z = 0] = coordinate;
    if (z !== 0) return null;
    if (topology === 'sphere') {
        const [width, height] = size;
        if (y < 0 || y >= height) return null;
        if (y === 0 || y === height - 1) return [0, y, 0];
        return [modulo(x, width), y, 0];
    }
    const mappedTopology = topology === 't2' ? 'torus' : topology;
    const normalized = normalize2DCoordinate([x, y], [size[0], size[1]], mappedTopology, randomBoundary);
    return normalized ? [normalized[0], normalized[1], 0] : null;
}

function createGoalDefinition(dimension, size, topology, customGoalZones) {
    if (customGoalZones) {
        const normalizeZone = (zone, label) => {
            if (!zone || typeof zone.start !== 'function' || typeof zone.end !== 'function') {
                throw new TypeError(`${label} goal zone must provide start() and end() predicates.`);
            }
            return Object.freeze({
                type: zone.type || 'marked-zones',
                label: zone.label || label,
                start: zone.start,
                end: zone.end
            });
        };
        return Object.freeze({
            black: normalizeZone(customGoalZones.black, 'black'),
            white: normalizeZone(customGoalZones.white, 'white')
        });
    }

    const surface3D = dimension === 3 && SURFACE_3D_TOPOLOGIES.has(topology);
    const surfaceTopology = topology === 't2' ? 'torus' : topology;
    if (surface3D && surfaceTopology === 'sphere') {
        const xEnd = Math.floor(size[0] / 2);
        return Object.freeze({
            black: Object.freeze({
                type: 'marked-cut-zones',
                label: 'sphere meridian cut zones',
                start: (coordinate) => coordinate[1] > 0 && coordinate[1] < size[1] - 1 && coordinate[0] === 0,
                end: (coordinate) => coordinate[1] > 0 && coordinate[1] < size[1] - 1 && coordinate[0] === xEnd
            }),
            white: Object.freeze({
                type: 'physical-sides',
                label: 'north pole / south pole',
                start: (coordinate) => coordinate[1] === 0,
                end: (coordinate) => coordinate[1] === size[1] - 1
            })
        });
    }
    const xHasPhysicalSides = dimension === 2 || surface3D
        ? surfaceTopology === 'open'
        : topology !== 'torus';
    const yHasPhysicalSides = dimension === 2 || surface3D
        ? surfaceTopology === 'open' || surfaceTopology === 'cylinder' || surfaceTopology === 'mobius' || surfaceTopology === 'sphere'
        : topology !== 'torus';
    const xEnd = xHasPhysicalSides ? size[0] - 1 : Math.floor(size[0] / 2);
    const yEnd = yHasPhysicalSides ? size[1] - 1 : Math.floor(size[1] / 2);

    return Object.freeze({
        black: Object.freeze({
            type: xHasPhysicalSides ? 'physical-sides' : 'marked-cut-zones',
            label: xHasPhysicalSides ? 'x-low / x-high' : 'x cut-seam zones',
            start: (coordinate) => coordinate[0] === 0,
            end: (coordinate) => coordinate[0] === xEnd
        }),
        white: Object.freeze({
            type: yHasPhysicalSides ? 'physical-sides' : 'marked-cut-zones',
            label: yHasPhysicalSides ? 'y-low / y-high' : 'y cut-seam zones',
            start: (coordinate) => coordinate[1] === 0,
            end: (coordinate) => coordinate[1] === yEnd
        })
    });
}

function enumerateCoordinates(size) {
    const coordinates = [];
    const current = Array(size.length).fill(0);

    const visit = (axis) => {
        if (axis === size.length) {
            coordinates.push([...current]);
            return;
        }
        for (let value = 0; value < size[axis]; value += 1) {
            current[axis] = value;
            visit(axis + 1);
        }
    };

    visit(0);
    return coordinates;
}

function enumerateSurface3DCoordinates(size, topology) {
    const coordinates = [];
    if (topology === 'sphere') {
        for (let y = 0; y < size[1]; y += 1) {
            if (y === 0 || y === size[1] - 1) {
                coordinates.push([0, y, 0]);
                continue;
            }
            for (let x = 0; x < size[0]; x += 1) coordinates.push([x, y, 0]);
        }
        return coordinates;
    }
    for (let y = 0; y < size[1]; y += 1) {
        for (let x = 0; x < size[0]; x += 1) {
            coordinates.push([x, y, 0]);
        }
    }
    return coordinates;
}

function hcpOffsets(origin) {
    const parity = modulo((origin?.[0] || 0) + (origin?.[1] || 0) + (origin?.[2] || 0), 2);
    const layer = parity === 0
        ? [[0, 0, 1], [-1, 0, 1], [0, -1, 1], [0, 0, -1], [1, 0, -1], [0, 1, -1]]
        : [[0, 0, 1], [1, 0, 1], [0, 1, 1], [0, 0, -1], [-1, 0, -1], [0, -1, -1]];
    return [
        [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [1, -1, 0], [-1, 1, 0],
        ...layer
    ];
}

function bccOffsets() {
    const result = [];
    for (const dx of [-1, 1]) {
        for (const dy of [-1, 1]) {
            for (const dz of [-1, 1]) result.push([dx, dy, dz]);
        }
    }
    return result;
}

function fccOffsets() {
    const result = [];
    for (const dx of [-1, 1]) {
        for (const dy of [-1, 1]) result.push([dx, dy, 0]);
        for (const dz of [-1, 1]) result.push([dx, 0, dz]);
    }
    for (const dy of [-1, 1]) {
        for (const dz of [-1, 1]) result.push([0, dy, dz]);
    }
    return result;
}

function parametricPosition(coordinate, size, topology, lattice = 'axis') {
    const [x = 0, y = 0, z = 0] = coordinate;
    const [width, height, depth = 1] = size;
    const scale = 7.8 / Math.max(1, Math.max(width, height, depth) - 1);
    if (topology === 'open' || topology === 'torus' || topology === 'reflective' || topology === 'r3_random') {
        const hcpOffsetX = lattice === 'hcp' ? ((z % 2) * 0.5 + (y % 2) * 0.5) : 0;
        const hcpOffsetY = lattice === 'hcp' ? z * 0.18 : 0;
        const bccOffset = lattice === 'bcc' && (x + y + z) % 2 ? 0.22 : 0;
        const fccOffset = lattice === 'fcc' ? ((x + y + z) % 3 - 1) * 0.12 : 0;
        return [
            (x + hcpOffsetX + bccOffset - (width - 1) / 2) * scale,
            (z * (lattice === 'hcp' ? 0.82 : 1) - (depth - 1) / 2 + hcpOffsetY + fccOffset) * scale,
            ((y - (height - 1) / 2) * (lattice === 'hcp' ? 0.866 : 1) - bccOffset) * scale
        ];
    }

    const u = (x / Math.max(1, width)) * Math.PI * 2;
    const v = (y / Math.max(1, height)) * Math.PI * 2;
    const band = y / Math.max(1, height - 1);
    if (topology === 't2') {
        const major = 3.35;
        const minor = 1.22;
        const ring = major + minor * Math.cos(v);
        return [ring * Math.cos(u), ring * Math.sin(u), minor * Math.sin(v)];
    }
    if (topology === 'cylinder') {
        const radius = 3.25;
        return [radius * Math.cos(u), (0.5 - band) * 6.0, radius * Math.sin(u)];
    }
    if (topology === 'sphere') {
        const theta = u;
        const phi = Math.PI * band;
        const radius = 3.45;
        return [
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        ];
    }
    if (topology === 'mobius') {
        const t = (band - 0.5) * 1.65;
        const radius = 2.75 + t * Math.cos(u / 2);
        return [
            radius * Math.cos(u),
            t * Math.sin(u / 2),
            radius * Math.sin(u)
        ];
    }
    if (topology === 'klein') {
        const kleinU = ((y + 0.5) / Math.max(1, height)) * Math.PI * 2;
        const kleinV = ((x + 0.5) / Math.max(1, width)) * Math.PI * 2 - Math.PI / 2;
        const r = 4 * (1 - Math.cos(kleinU) / 2);
        let rawX;
        let rawY;
        if (kleinU < Math.PI) {
            rawX = 6 * Math.cos(kleinU) * (1 + Math.sin(kleinU)) + r * Math.cos(kleinU) * Math.cos(kleinV);
            rawY = 16 * Math.sin(kleinU) + r * Math.sin(kleinU) * Math.cos(kleinV);
        } else {
            rawX = 6 * Math.cos(kleinU) * (1 + Math.sin(kleinU)) + r * Math.cos(kleinV + Math.PI);
            rawY = 16 * Math.sin(kleinU);
        }
        const rawZ = r * Math.sin(kleinV);
        const dixonScale = 0.2;
        return [
            rawX * dixonScale * 1.12,
            rawY * dixonScale * 0.72,
            rawZ * dixonScale * 1.12
        ];
    }
    const flatScale = 7 / Math.max(width - 1, height - 1);
    return [(x - (width - 1) / 2) * flatScale, (0.5 - band) * 7, 0];
}

export function createHexTopology(options = {}) {
    const dimension = normalizeDimension(options.dimension ?? 2);
    const size = Object.freeze(normalizeHexSize(options.size, dimension));
    const topology = normalizeHexTopology(options.topology, dimension);
    if (isSpecialBoardTopology(topology)) {
        return createSpecialBoardTopology({ ...options, dimension, size, topology });
    }
    const lattice = normalizeHexLattice(options.lattice, dimension);
    const surface3D = dimension === 3 && SURFACE_3D_TOPOLOGIES.has(topology);
    const randomBoundarySeed = topology === 'random'
        ? String(options.randomBoundarySeed || `hex-rbc:${size.join('x')}`)
        : '';
    const randomBoundary = topology === 'random'
        ? createRandomBoundary(size, randomBoundarySeed)
        : null;
    const goalZones = createGoalDefinition(dimension, size, topology, options.goalZones);

    const normalize = (coordinate) => {
        const parsed = normalizeCoordinateInput(coordinate, dimension);
        if (!parsed) return null;
        if (dimension === 2) return normalize2DCoordinate(parsed, size, topology, randomBoundary);
        if (surface3D) return normalizeSurface3DCoordinate(parsed, size, topology, randomBoundary);
        return normalizeHigherDimCoordinate(parsed, size, topology);
    };

    const neighborOffsets = dimension === 2
        ? lattice === 'triangular'
            ? null
            : lattice === 'square'
            ? [[1, 0], [-1, 0], [0, 1], [0, -1]]
            : lattice === 'honeycomb'
                ? null
                : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]
        : surface3D
            ? [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [1, -1, 0], [-1, 1, 0]]
            : ['hcp', 'bcc', 'fcc'].includes(lattice)
                ? null
        : Array.from({ length: dimension * 2 }, (_, index) => {
            const offset = Array(dimension).fill(0);
            const axis = Math.floor(index / 2);
            offset[axis] = index % 2 === 0 ? 1 : -1;
            return offset;
        });

    const offsetsFor = (origin) => neighborOffsets || [
        ...(dimension === 3
            ? lattice === 'bcc'
                ? bccOffsets()
                : lattice === 'fcc'
                    ? fccOffsets()
                    : hcpOffsets(origin)
            : lattice === 'triangular'
                ? [[-1, 0], [1, 0], [0, (origin[0] + origin[1]) % 2 === 0 ? 1 : -1]]
                : [[1, 0], [-1, 0], [0, (origin[0] + origin[1]) % 2 === 0 ? 1 : -1]])
    ];

    const coordinateList = surface3D ? enumerateSurface3DCoordinates(size, topology) : enumerateCoordinates(size);
    const randomAdjacency = topology === 'random' || topology === 'r3_random'
        ? (() => {
            const adjacency = new Map(coordinateList.map((coordinate) => [coordinateKey(coordinate), new Map()]));
            const boundary = coordinateList.filter((coordinate) =>
                coordinate.some((value, axis) => axis < dimension && (value === 0 || value === size[axis] - 1)));
            const boundaryPermutation = seededPermutation(Math.max(1, boundary.length), randomBoundarySeed || `hex-rbc:${size.join('x')}`);
            const boundaryTarget = (origin, offset) => {
                if (!boundary.length) return null;
                const raw = origin.map((value, axis) => value + offset[axis]);
                const hash = Math.abs(hashSeed(`${coordinateKey(origin)}:${coordinateKey(offset)}:${coordinateKey(raw)}`));
                return boundary[boundaryPermutation[hash % boundary.length]];
            };
            for (const origin of coordinateList) {
                const originKey = coordinateKey(origin);
                for (const offset of offsetsFor(origin)) {
                    const raw = origin.map((value, axis) => value + offset[axis]);
                    let candidate = normalize(raw);
                    if (!candidate && topology === 'r3_random') candidate = boundaryTarget(origin, offset);
                    if (!candidate || coordinatesEqual(candidate, origin)) continue;
                    const candidateKey = coordinateKey(candidate);
                    if (!adjacency.has(candidateKey)) continue;
                    adjacency.get(originKey).set(candidateKey, candidate);
                    adjacency.get(candidateKey).set(originKey, origin);
                }
            }
            return adjacency;
        })()
        : null;

    const neighbors = (coordinate) => {
        const origin = normalize(coordinate);
        if (!origin) return [];
        if (randomAdjacency) {
            return [...(randomAdjacency.get(coordinateKey(origin))?.values() || [])].map((item) => [...item]);
        }
        if (surface3D && topology === 'sphere') {
            const [width, height] = size;
            if (origin[1] === 0) {
                const ringY = Math.min(height - 1, 1);
                return uniqueCoordinates(Array.from({ length: width }, (_, x) => normalize([x, ringY, 0])).filter(Boolean));
            }
            if (origin[1] === height - 1) {
                const ringY = Math.max(0, height - 2);
                return uniqueCoordinates(Array.from({ length: width }, (_, x) => normalize([x, ringY, 0])).filter(Boolean));
            }
        }
        const seen = new Set();
        const result = [];

        for (const offset of offsetsFor(origin)) {
            const candidate = normalize(origin.map((value, axis) => value + offset[axis]));
            if (!candidate || coordinatesEqual(candidate, origin)) continue;
            const key = coordinateKey(candidate);
            if (seen.has(key)) continue;
            seen.add(key);
            result.push(candidate);
        }
        return result;
    };

    return Object.freeze({
        dimension,
        size,
        topology,
        lattice,
        isWrapped: ['cylinder', 'torus', 't2', 'sphere', 'mobius', 'klein', 'rp2', 'random', 'r3_random'].includes(topology),
        randomBoundarySeed,
        randomBoundary,
        goalZones,
        normalize,
        neighbors,
        key(coordinate) {
            const normalized = normalize(coordinate);
            return normalized ? coordinateKey(normalized) : null;
        },
        coordinate(key) {
            const parsed = parseCoordinateKey(key, dimension);
            const normalized = normalize(parsed);
            if (!normalized || !coordinatesEqual(parsed, normalized)) {
                throw new RangeError(`Coordinate key is outside this Hex topology: ${String(key)}`);
            }
            return normalized;
        },
        coordinates() {
            return coordinateList.map((coordinate) => [...coordinate]);
        },
        position(coordinate) {
            const normalized = normalize(coordinate);
            return normalized ? parametricPosition(normalized, size, topology, lattice) : null;
        }
    });
}

function cloneHistoryEntry(entry) {
    return {
        move: entry.move,
        color: entry.color,
        coordinate: [...entry.coordinate]
    };
}

export class HexGame {
    constructor(options = {}) {
        this.allowPass = options.allowPass === true;
        this.startingColor = HEX_COLOR_VALUES.has(options.startingColor)
            ? options.startingColor
            : HEX_COLORS.BLACK;
        this.topology = createHexTopology(options);
        this.board = new Map();
        this.currentColor = this.startingColor;
        this.winner = null;
        this.moveNumber = 0;
        this.history = [];
    }

    get dimension() {
        return this.topology.dimension;
    }

    get size() {
        return [...this.topology.size];
    }

    get topologyType() {
        return this.topology.topology;
    }

    getCell(coordinate) {
        const key = this.topology.key(coordinate);
        return key ? this.board.get(key) ?? null : null;
    }

    setCell(coordinate, color = null) {
        const normalized = this.topology.normalize(coordinate);
        if (!normalized) return false;
        const key = this.topology.key(normalized);
        if (!key) return false;
        if (color === null || color === undefined) {
            this.board.delete(key);
            return true;
        }
        if (!HEX_COLOR_VALUES.has(color)) return false;
        this.board.set(key, color);
        return true;
    }

    isLegalPlacement(coordinate, color = this.currentColor) {
        if (!HEX_COLOR_VALUES.has(color)) return false;
        if (this.winner || color !== this.currentColor) return false;
        const key = this.topology.key(coordinate);
        return Boolean(key && !this.board.has(key));
    }

    place(coordinate, color = this.currentColor) {
        if (!HEX_COLOR_VALUES.has(color)) {
            return { ok: false, error: 'Unknown Hex color.' };
        }
        if (this.winner) {
            return { ok: false, error: 'The game already has a winner.', winner: this.winner };
        }
        if (color !== this.currentColor) {
            return { ok: false, error: `It is ${this.currentColor}'s turn.` };
        }

        const normalized = this.topology.normalize(coordinate);
        if (!normalized) return { ok: false, error: 'Coordinate is outside the board.' };

        const key = this.topology.key(normalized);
        if (this.board.has(key)) return { ok: false, error: 'Hex placements require an empty cell.' };

        this.board.set(key, color);
        this.moveNumber += 1;
        this.history.push({ move: this.moveNumber, color, coordinate: [...normalized] });

        const won = this.hasConnection(color);
        if (won) {
            this.winner = color;
        } else {
            this.currentColor = otherHexColor(color);
        }

        return {
            ok: true,
            color,
            coordinate: [...normalized],
            moveNumber: this.moveNumber,
            winner: this.winner
        };
    }

    play(coordinate, color = this.currentColor) {
        return this.place(coordinate, color);
    }

    pass() {
        if (!this.allowPass) return { ok: false, error: 'Passing is disabled in Hex.' };
        if (this.winner) return { ok: false, error: 'The game already has a winner.' };
        this.currentColor = otherHexColor(this.currentColor);
        return { ok: true, currentColor: this.currentColor };
    }

    hasConnection(color) {
        if (!HEX_COLOR_VALUES.has(color)) {
            throw new TypeError(`Unknown Hex color: ${String(color)}`);
        }

        const zone = this.topology.goalZones[color];
        const queue = [];
        const visited = new Set();

        for (const [key, cellColor] of this.board) {
            if (cellColor !== color) continue;
            const coordinate = this.topology.coordinate(key);
            if (!zone.start(coordinate)) continue;
            queue.push(coordinate);
            visited.add(key);
        }

        for (let index = 0; index < queue.length; index += 1) {
            const coordinate = queue[index];
            if (zone.end(coordinate)) return true;

            for (const neighbor of this.topology.neighbors(coordinate)) {
                const key = this.topology.key(neighbor);
                if (visited.has(key) || this.board.get(key) !== color) continue;
                visited.add(key);
                queue.push(neighbor);
            }
        }

        return false;
    }

    reset() {
        this.board.clear();
        this.currentColor = this.startingColor;
        this.winner = null;
        this.moveNumber = 0;
        this.history = [];
    }

    exportState() {
        return {
            version: 1,
            game: 'hex',
            dimension: this.dimension,
            size: this.size,
            topology: this.topologyType,
            lattice: this.topology.lattice,
            randomBoundarySeed: this.topology.randomBoundarySeed || '',
            goalZones: {
                black: {
                    type: this.topology.goalZones.black.type,
                    label: this.topology.goalZones.black.label
                },
                white: {
                    type: this.topology.goalZones.white.type,
                    label: this.topology.goalZones.white.label
                }
            },
            allowPass: this.allowPass,
            startingColor: this.startingColor,
            currentColor: this.currentColor,
            winner: this.winner,
            moveNumber: this.moveNumber,
            cells: [...this.board.entries()].map(([key, color]) => ({
                coordinate: this.topology.coordinate(key),
                color
            })),
            history: this.history.map(cloneHistoryEntry)
        };
    }

    importState(state) {
        if (!state || typeof state !== 'object' || state.game !== 'hex') {
            throw new TypeError('Invalid Hex state.');
        }

        const topology = createHexTopology({
            dimension: state.dimension,
            size: state.size,
            topology: state.topology,
            lattice: state.lattice,
            randomBoundarySeed: state.randomBoundarySeed
        });
        const board = new Map();
        for (const cell of state.cells ?? []) {
            if (!HEX_COLOR_VALUES.has(cell?.color)) throw new TypeError('Invalid Hex cell color.');
            const key = topology.key(cell.coordinate);
            if (!key) throw new RangeError('Hex state contains a cell outside the board.');
            if (board.has(key)) throw new TypeError('Hex state contains duplicate cells.');
            board.set(key, cell.color);
        }

        const currentColor = HEX_COLOR_VALUES.has(state.currentColor)
            ? state.currentColor
            : this.startingColor;
        const winner = state.winner == null ? null : state.winner;
        if (winner !== null && !HEX_COLOR_VALUES.has(winner)) {
            throw new TypeError('Invalid Hex winner.');
        }

        this.topology = topology;
        this.allowPass = state.allowPass === true;
        this.startingColor = HEX_COLOR_VALUES.has(state.startingColor)
            ? state.startingColor
            : HEX_COLORS.BLACK;
        this.board = board;
        this.currentColor = currentColor;
        this.moveNumber = Number.isInteger(state.moveNumber)
            ? Math.max(0, state.moveNumber)
            : board.size;
        this.history = Array.isArray(state.history)
            ? state.history.map((entry) => ({
                move: Number(entry.move),
                color: entry.color,
                coordinate: [...entry.coordinate]
            }))
            : [];

        const blackConnected = this.hasConnection(HEX_COLORS.BLACK);
        const whiteConnected = this.hasConnection(HEX_COLORS.WHITE);
        if (blackConnected && whiteConnected) {
            throw new TypeError('Invalid Hex state: both colors cannot be winners.');
        }
        this.winner = blackConnected ? HEX_COLORS.BLACK : whiteConnected ? HEX_COLORS.WHITE : winner;

        if (this.winner && !this.hasConnection(this.winner)) {
            throw new TypeError('Invalid Hex state: winner has no connected path.');
        }

        return this;
    }

    static fromState(state) {
        return new HexGame({
            dimension: state?.dimension,
            size: state?.size,
            topology: state?.topology,
            lattice: state?.lattice,
            randomBoundarySeed: state?.randomBoundarySeed
        }).importState(state);
    }
}

export default HexGame;
