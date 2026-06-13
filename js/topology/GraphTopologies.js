import { defaultSeamTransport } from '../algebra/PauliAlgebra.js';

const TOPOLOGY_NAMES = Object.freeze([
    'flat',
    'torus',
    'klein_bottle',
    'rp2',
    'sphere_latitude',
    'flat_4d_grid'
]);

const CARDINAL_2D = Object.freeze([
    Object.freeze([1, 0]),
    Object.freeze([-1, 0]),
    Object.freeze([0, 1]),
    Object.freeze([0, -1])
]);

const RAYS_2D = Object.freeze([
    Object.freeze([1, 0]),
    Object.freeze([-1, 0]),
    Object.freeze([0, 1]),
    Object.freeze([0, -1]),
    Object.freeze([1, 1]),
    Object.freeze([1, -1]),
    Object.freeze([-1, 1]),
    Object.freeze([-1, -1])
]);

const AXIS_4D = Object.freeze([
    Object.freeze([1, 0, 0, 0]),
    Object.freeze([-1, 0, 0, 0]),
    Object.freeze([0, 1, 0, 0]),
    Object.freeze([0, -1, 0, 0]),
    Object.freeze([0, 0, 1, 0]),
    Object.freeze([0, 0, -1, 0]),
    Object.freeze([0, 0, 0, 1]),
    Object.freeze([0, 0, 0, -1])
]);

function integer(value, fallback, min = 1, max = 64) {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function mod(value, size) {
    return ((value % size) + size) % size;
}

function keyOf(coord) {
    return coord.join(',');
}

function sameCoord(a, b) {
    return keyOf(a) === keyOf(b);
}

function addCoord(coord, direction) {
    return coord.map((value, index) => value + (direction[index] || 0));
}

function inside(coord, sizes) {
    return coord.length === sizes.length
        && coord.every((value, index) => Number.isInteger(value) && value >= 0 && value < sizes[index]);
}

function enumerateVertices(sizes) {
    const vertices = [];
    const coord = Array(sizes.length).fill(0);
    function visit(axis) {
        if (axis === sizes.length) {
            vertices.push([...coord]);
            return;
        }
        for (let value = 0; value < sizes[axis]; value++) {
            coord[axis] = value;
            visit(axis + 1);
        }
    }
    visit(0);
    return vertices;
}

function signedWrap(from, raw, size) {
    if (raw < 0 || raw - from < -1) return -1;
    if (raw >= size || raw - from > 1) return 1;
    return 0;
}

function makeEdge({ topology, from, rawTo, to, direction, wrap = {}, twisted = false }) {
    const transport = defaultSeamTransport({
        topology,
        twisted,
        side: wrap.y ? 'vertical' : wrap.x ? 'horizontal' : ''
    });
    return {
        from: [...from],
        rawTo: [...rawTo],
        to: [...to],
        direction: [...direction],
        wrapX: wrap.x || 0,
        wrapY: wrap.y || 0,
        wrapZ: wrap.z || 0,
        wrapW: wrap.w || 0,
        twisted,
        transport,
        anyonAutomorphism: twisted ? 'twist' : 'identity',
        homology: {
            x: wrap.x || 0,
            y: wrap.y || 0,
            z: wrap.z || 0,
            w: wrap.w || 0
        }
    };
}

function normalizeKleinCoord(rawCoord, sizes) {
    let [x, y] = rawCoord;
    const [width, height] = sizes;
    let crossings = Math.floor(y / height);
    let normalizedY = mod(y, height);
    if (y < 0 && normalizedY !== 0) crossings = Math.floor(y / height);
    if (crossings % 2 !== 0) x = width - 1 - x;
    return [mod(x, width), normalizedY];
}

function normalizeRP2Coord(rawCoord, sizes) {
    let [x, y] = rawCoord;
    const [width, height] = sizes;
    let guard = 0;
    while (!inside([x, y], sizes) && guard < (width + height) * 8) {
        if (x < 0) {
            x += width;
            y = height - 1 - y;
        } else if (x >= width) {
            x -= width;
            y = height - 1 - y;
        }
        if (y < 0) {
            y += height;
            x = width - 1 - x;
        } else if (y >= height) {
            y -= height;
            x = width - 1 - x;
        }
        guard++;
    }
    return [mod(x, width), mod(y, height)];
}

function create2DTopology(config) {
    const name = config.topology;
    const width = integer(config.width, 8, 2, 32);
    const height = integer(config.height, 8, 2, 32);
    const sizes = [width, height];
    const finiteVertical = name === 'flat' || name === 'sphere_latitude';
    const finiteHorizontal = name === 'flat';
    const nonorientable = name === 'klein_bottle' || name === 'rp2';

    function normalize(rawCoord) {
        const [x, y] = rawCoord;
        if (name === 'flat') return inside([x, y], sizes) ? [x, y] : null;
        if (name === 'sphere_latitude') {
            if (y < 0 || y >= height) return null;
            return [mod(x, width), y];
        }
        if (name === 'torus') return [mod(x, width), mod(y, height)];
        if (name === 'klein_bottle') return normalizeKleinCoord([x, y], sizes);
        if (name === 'rp2') return normalizeRP2Coord([x, y], sizes);
        return [x, y];
    }

    function step(fromCoord, direction) {
        const from = normalize(fromCoord);
        if (!from) return null;
        const rawTo = addCoord(from, direction);
        const to = normalize(rawTo);
        if (!to) return null;
        const wrapX = finiteHorizontal ? 0 : signedWrap(from[0], rawTo[0], width);
        const wrapY = finiteVertical ? 0 : signedWrap(from[1], rawTo[1], height);
        const twisted = nonorientable && (wrapX !== 0 || wrapY !== 0);
        return {
            coord: to,
            edge: makeEdge({
                topology: name,
                from,
                rawTo,
                to,
                direction,
                wrap: { x: wrapX, y: wrapY },
                twisted
            })
        };
    }

    return {
        name,
        dimensions: 2,
        sizes,
        width,
        height,
        maxRaySteps: width * height + 4,
        normalize,
        contains(coord) {
            return Boolean(normalize(coord));
        },
        key: keyOf,
        same: sameCoord,
        vertices() {
            return enumerateVertices(sizes);
        },
        directions() {
            return CARDINAL_2D.map((direction) => [...direction]);
        },
        rayDirections() {
            return RAYS_2D.map((direction) => [...direction]);
        },
        step,
        neighbors(coord) {
            return this.directions()
                .map((direction) => step(coord, direction)?.coord)
                .filter(Boolean)
                .filter((vertex, index, vertices) => vertices.findIndex((other) => sameCoord(other, vertex)) === index);
        },
        edgeTransport(edge) {
            return edge?.transport || 'identity';
        },
        seamTransform(edge) {
            return edge?.anyonAutomorphism || 'identity';
        },
        homologyCycleCrossing(edge) {
            return edge?.homology || { x: 0, y: 0, z: 0, w: 0 };
        },
        edgeWrapInfo(edge) {
            return {
                wrapX: edge?.wrapX || 0,
                wrapY: edge?.wrapY || 0,
                twisted: Boolean(edge?.twisted)
            };
        },
        displayCoord(coord) {
            return `(${coord[0]},${coord[1]})`;
        },
        seamSummary() {
            if (name === 'flat') return 'Flat open boundary: rays stop at the edge.';
            if (name === 'sphere_latitude') return 'Sphere latitude graph: longitude wraps, top and bottom latitude rings stop.';
            if (name === 'torus') return 'Torus: x and y wrap periodically.';
            if (name === 'klein_bottle') return 'Klein bottle: x wraps normally, y wraps with x flip and H/twist seam transport.';
            if (name === 'rp2') return 'RP2: every boundary crossing uses antipodal identification with H/twist seam transport.';
            return '';
        }
    };
}

function create4DTopology(config) {
    const nx = integer(config.nx ?? config.width, 4, 2, 12);
    const ny = integer(config.ny ?? config.height, 4, 2, 12);
    const nz = integer(config.nz, 2, 1, 8);
    const nw = integer(config.nw, 2, 1, 8);
    const sizes = [nx, ny, nz, nw];
    return {
        name: 'flat_4d_grid',
        dimensions: 4,
        sizes,
        width: nx,
        height: ny,
        depth: nz,
        wSize: nw,
        maxRaySteps: nx * ny * nz * nw + 4,
        normalize(coord) {
            return inside(coord, sizes) ? [...coord] : null;
        },
        contains(coord) {
            return inside(coord, sizes);
        },
        key: keyOf,
        same: sameCoord,
        vertices() {
            return enumerateVertices(sizes);
        },
        directions() {
            return AXIS_4D.map((direction) => [...direction]);
        },
        rayDirections() {
            return AXIS_4D.map((direction) => [...direction]);
        },
        step(fromCoord, direction) {
            const from = this.normalize(fromCoord);
            if (!from) return null;
            const rawTo = addCoord(from, direction);
            const to = this.normalize(rawTo);
            if (!to) return null;
            return {
                coord: to,
                edge: makeEdge({
                    topology: this.name,
                    from,
                    rawTo,
                    to,
                    direction,
                    wrap: {},
                    twisted: false
                })
            };
        },
        neighbors(coord) {
            return this.directions()
                .map((direction) => this.step(coord, direction)?.coord)
                .filter(Boolean);
        },
        edgeTransport() {
            return 'identity';
        },
        seamTransform() {
            return 'identity';
        },
        homologyCycleCrossing() {
            return { x: 0, y: 0, z: 0, w: 0 };
        },
        edgeWrapInfo() {
            return { wrapX: 0, wrapY: 0, wrapZ: 0, wrapW: 0, twisted: false };
        },
        displayCoord(coord) {
            return `(${coord[0]},${coord[1]},${coord[2]},${coord[3]})`;
        },
        seamSummary() {
            return 'Flat 4D grid: finite axis-neighbor graph, no diagonal edges.';
        }
    };
}

export function createGraphTopology(options = {}) {
    const topology = String(options.topology || options.name || 'torus').toLowerCase();
    if (topology === 'flat_4d' || topology === 'flat_4d_go' || topology === '4d' || topology === 'flat_4d_grid') {
        return create4DTopology({ ...options, topology: 'flat_4d_grid' });
    }
    const normalized = TOPOLOGY_NAMES.includes(topology) ? topology : 'torus';
    return create2DTopology({ ...options, topology: normalized });
}

export function topologyOptions() {
    return [...TOPOLOGY_NAMES];
}

export function coordKey(coord) {
    return keyOf(coord);
}

export function coordsEqual(a, b) {
    return sameCoord(a, b);
}

export function sumHomology(edges = []) {
    return edges.reduce((total, edge) => {
        total.x += edge?.homology?.x || 0;
        total.y += edge?.homology?.y || 0;
        total.z += edge?.homology?.z || 0;
        total.w += edge?.homology?.w || 0;
        return total;
    }, { x: 0, y: 0, z: 0, w: 0 });
}
