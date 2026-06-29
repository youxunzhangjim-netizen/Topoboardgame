const KLEIN_TRIANGLE_EDGES = Object.freeze([
    [0, 3], [1, 4], [2, 6], [3, 7], [5, 8], [6, 9], [8, 9], [3, 10],
    [7, 12], [9, 12], [5, 13], [6, 14], [4, 15], [11, 16], [15, 16],
    [10, 17], [15, 17], [7, 18], [13, 18], [12, 19], [17, 20], [19, 20],
    [14, 21], [4, 22], [21, 22], [16, 23], [19, 24], [21, 24], [11, 25],
    [22, 26], [25, 26], [20, 27], [23, 28], [27, 28], [10, 29], [1, 30],
    [29, 30], [24, 31], [26, 32], [8, 33], [28, 33], [31, 34], [32, 34],
    [27, 35], [31, 36], [35, 36], [14, 37], [35, 38], [33, 39], [18, 40],
    [34, 40], [38, 41], [39, 41], [1, 42], [37, 42], [36, 43], [2, 44],
    [25, 44], [39, 44], [43, 45], [29, 46], [38, 46], [23, 47], [45, 47],
    [37, 48], [43, 48], [40, 49], [45, 49], [5, 50], [42, 50], [47, 50],
    [32, 51], [41, 51], [46, 52], [48, 52], [0, 53], [11, 53], [49, 53],
    [13, 54], [30, 54], [51, 54], [0, 55], [2, 55], [52, 55]
]);

const KLEIN_CIRCLE_ORDER = Object.freeze([
    0, 2, 3, 4, 6, 8, 14, 1, 37, 30, 34, 48, 55, 43, 40, 45, 18, 20,
    47, 42, 23, 17, 16, 10, 41, 11, 49, 25, 51, 26, 54, 9, 22, 15, 21,
    12, 24, 7, 52, 31, 32, 36, 46, 35, 29, 50, 27, 19, 28, 5, 33, 13,
    53, 39, 38, 44
]);

const KLEIN_ORDER_INDEX = new Map(KLEIN_CIRCLE_ORDER.map((node, index) => [node, index]));
const SPECIAL_ALIASES = Object.freeze({
    kleinquartic: 'klein_quartic',
    'klein-quartic': 'klein_quartic',
    klein_quartic: 'klein_quartic',
    kleinquartic_product: 'klein_quartic_product',
    'klein-quartic-product': 'klein_quartic_product',
    klein_quartic_product: 'klein_quartic_product',
    trefoil: 'trefoil_diagram',
    'trefoil-diagram': 'trefoil_diagram',
    trefoil_diagram: 'trefoil_diagram',
    'trefoil-track': 'trefoil_track',
    trefoil_track: 'trefoil_track',
    'trefoil-tube': 'trefoil_tube',
    trefoil_tube: 'trefoil_tube',
    'trefoil-solid': 'trefoil_solid',
    'trefoil-solid-tube': 'trefoil_solid',
    trefoil_solid: 'trefoil_solid',
    'trefoil-solid-product': 'trefoil_solid_product',
    trefoil_solid_product: 'trefoil_solid_product'
});

function clampInteger(value, min, max, fallback) {
    const parsed = Number(value);
    return Math.max(min, Math.min(max, Number.isFinite(parsed) ? Math.floor(parsed) : fallback));
}

function modulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

function keyOf(coordinate) {
    return coordinate.join(',');
}

function parseKey(key, dimension) {
    const coordinate = String(key).split(',').map(Number);
    if (coordinate.length !== dimension || coordinate.some((value) => !Number.isInteger(value))) {
        throw new TypeError(`Invalid ${dimension}D special-board coordinate: ${String(key)}`);
    }
    return coordinate;
}

function uniqueCoordinates(coordinates) {
    return [...new Map(coordinates.map((coordinate) => [keyOf(coordinate), coordinate])).values()];
}

function adjacencyFromEdges(vertexCount, edges) {
    const adjacency = Array.from({ length: vertexCount }, () => []);
    for (const [left, right] of edges) {
        adjacency[left].push(right);
        adjacency[right].push(left);
    }
    return adjacency.map((neighbors) => Object.freeze([...neighbors].sort((a, b) => a - b)));
}

const KLEIN_ADJACENCY = Object.freeze(adjacencyFromEdges(56, KLEIN_TRIANGLE_EDGES));

function cyclicDistance(value, anchor, modulus) {
    const delta = Math.abs(value - anchor);
    return Math.min(delta, modulus - delta);
}

function kleinPosition(node) {
    const order = KLEIN_ORDER_INDEX.get(node) ?? node;
    const sector = order % 7;
    const ring = Math.floor(order / 7);
    const angle = Math.PI * 2 * (sector + ring * 0.36) / 7 - Math.PI / 2;
    const radius = Math.tanh((ring + 0.72) * 0.32) * 2.85;
    return [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0.05 * Math.sin(Math.PI * 2 * sector / 7 + ring * 0.8)
    ];
}

function kleinEmbeddedPosition(node, layer = 0, interval = 1, second = 0, secondInterval = 1) {
    const order = KLEIN_ORDER_INDEX.get(node) ?? node;
    const sector = order % 7;
    const ring = Math.floor(order / 7);
    const theta = Math.PI * 2 * (sector + ring * 0.36) / 7;
    const phi = Math.PI * 2 * (ring + 0.5) / 8;
    const lobe = 0.22 * Math.cos(7 * theta);
    const major = 2.05 + lobe + 0.2 * Math.cos(3 * phi);
    const minor = 0.72 + 0.12 * Math.sin(7 * theta + phi);
    const shell = [
        (major + minor * Math.cos(phi)) * Math.cos(theta),
        (major + minor * Math.cos(phi)) * Math.sin(theta),
        minor * Math.sin(phi)
    ];
    const radial = [Math.cos(theta), Math.sin(theta), 0];
    const layerOffset = (layer - (interval - 1) / 2) * 0.2;
    const secondOffset = (second - (secondInterval - 1) / 2) * 0.16;
    return [
        shell[0] + radial[0] * layerOffset,
        shell[1] + radial[1] * layerOffset,
        shell[2] + secondOffset,
        secondOffset
    ];
}

function trefoilPosition(segment, segmentCount) {
    const t = Math.PI * 2 * modulo(segment, segmentCount) / segmentCount;
    const compact = 0.72;
    return [
        (Math.sin(t) + 2 * Math.sin(2 * t)) * compact,
        (Math.cos(t) - 2 * Math.cos(2 * t)) * compact,
        -Math.sin(3 * t) * 0.82
    ];
}

function createGoalZones({ type, segmentCount = 0, thetaCount = 0 }) {
    if (type.startsWith('klein_quartic')) {
        const orderOf = (coordinate) => KLEIN_ORDER_INDEX.get(coordinate[0]) ?? coordinate[0];
        const arc = 2;
        return Object.freeze({
            black: Object.freeze({
                type: 'marked-cell-zones',
                label: 'opposite Klein-map arcs',
                start: (coordinate) => cyclicDistance(orderOf(coordinate), 0, 56) <= arc,
                end: (coordinate) => cyclicDistance(orderOf(coordinate), 28, 56) <= arc
            }),
            white: Object.freeze({
                type: 'marked-cell-zones',
                label: 'quarter-turn Klein-map arcs',
                start: (coordinate) => cyclicDistance(orderOf(coordinate), 14, 56) <= arc,
                end: (coordinate) => cyclicDistance(orderOf(coordinate), 42, 56) <= arc
            })
        });
    }

    const count = Math.max(8, segmentCount);
    const arc = Math.max(1, Math.floor(count / 22));
    const thetaOf = (coordinate) => Number(coordinate[1] || 0);
    const hasTheta = type === 'trefoil_tube' || type === 'trefoil_solid' || type === 'trefoil_solid_product';
    return Object.freeze({
        black: Object.freeze({
            type: 'marked-knot-arcs',
            label: 'opposite trefoil arcs',
            start: (coordinate) => cyclicDistance(coordinate[0], 0, count) <= arc,
            end: (coordinate) => cyclicDistance(coordinate[0], Math.floor(count / 2), count) <= arc
        }),
        white: Object.freeze({
            type: 'marked-knot-arcs',
            label: hasTheta ? 'opposite tube-angle arcs' : 'quarter-turn trefoil arcs',
            start: (coordinate) => hasTheta
                ? thetaOf(coordinate) === 0
                : cyclicDistance(coordinate[0], Math.floor(count / 4), count) <= arc,
            end: (coordinate) => hasTheta
                ? thetaOf(coordinate) === Math.floor(Math.max(2, thetaCount) / 2)
                : cyclicDistance(coordinate[0], Math.floor(3 * count / 4), count) <= arc
        })
    });
}

function topologyObject({
    id,
    dimension,
    size,
    coordinates,
    neighbors,
    position,
    goalZones,
    metadata
}) {
    const coordinateMap = new Map(coordinates.map((coordinate) => [keyOf(coordinate), Object.freeze([...coordinate])]));
    const normalize = (coordinate) => {
        if (!Array.isArray(coordinate) || coordinate.length !== dimension) return null;
        const parsed = coordinate.map(Number);
        if (parsed.some((value) => !Number.isInteger(value))) return null;
        return coordinateMap.get(keyOf(parsed)) || null;
    };

    return Object.freeze({
        dimension,
        size: Object.freeze([...size]),
        topology: id,
        lattice: 'cell-complex',
        isWrapped: true,
        isSpecial: true,
        goalZones,
        metadata: Object.freeze({ ...metadata }),
        normalize,
        neighbors(coordinate) {
            const normalized = normalize(coordinate);
            return normalized ? uniqueCoordinates(neighbors(normalized).map((item) => normalize(item)).filter(Boolean)) : [];
        },
        key(coordinate) {
            const normalized = normalize(coordinate);
            return normalized ? keyOf(normalized) : null;
        },
        coordinate(key) {
            const parsed = parseKey(key, dimension);
            const normalized = normalize(parsed);
            if (!normalized) throw new RangeError(`Coordinate is outside ${id}: ${String(key)}`);
            return [...normalized];
        },
        coordinates() {
            return coordinates.map((coordinate) => [...coordinate]);
        },
        position(coordinate) {
            const normalized = normalize(coordinate);
            return normalized ? position(normalized) : null;
        }
    });
}

function createKleinQuarticTopology({ dimension, size, product = false }) {
    const interval = clampInteger(size?.[1] ?? size?.[0], 2, 7, dimension === 2 ? 2 : 4);
    const secondInterval = clampInteger(size?.[2] ?? interval, 2, 7, interval);
    const coordinates = [];

    if (dimension === 2 && !product) {
        for (let node = 0; node < 56; node += 1) coordinates.push([node, 0]);
    } else if (dimension === 3) {
        for (let layer = 0; layer < interval; layer += 1) {
            for (let node = 0; node < 56; node += 1) coordinates.push([node, layer, 0]);
        }
    } else {
        for (let second = 0; second < secondInterval; second += 1) {
            for (let layer = 0; layer < interval; layer += 1) {
                for (let node = 0; node < 56; node += 1) coordinates.push([node, layer, second, 0]);
            }
        }
    }

    const id = dimension === 2 ? 'klein_quartic' : 'klein_quartic_product';
    return topologyObject({
        id,
        dimension,
        size: dimension === 2 ? [56, 1] : dimension === 3 ? [56, interval, 1] : [56, interval, secondInterval, 1],
        coordinates,
        neighbors(coordinate) {
            const result = KLEIN_ADJACENCY[coordinate[0]].map((node) => {
                const next = [...coordinate];
                next[0] = node;
                return next;
            });
            for (let axis = 1; axis < dimension - 1; axis += 1) {
                for (const delta of [-1, 1]) {
                    const next = [...coordinate];
                    next[axis] += delta;
                    result.push(next);
                }
            }
            return result;
        },
        position(coordinate) {
            if (dimension === 2 && !product) {
                const [x, y] = kleinPosition(coordinate[0]);
                return [x, y];
            }
            return kleinEmbeddedPosition(
                coordinate[0],
                coordinate[1] || 0,
                interval,
                coordinate[2] || 0,
                secondInterval
            ).slice(0, dimension);
        },
        goalZones: createGoalZones({ type: id }),
        metadata: {
            topologyType: 'closed-orientable-genus-3',
            representation: '56-triangle cell adjacency (cubic Klein graph)',
            baseVertices: 56,
            baseEdges: 84,
            baseFaces: 24,
            genus: 3
        }
    });
}

function createTrefoilTopology({ type, dimension, size }) {
    const requestedSegments = Number(size?.[0]);
    const isTubeLike = type === 'trefoil_tube' || type === 'trefoil_solid' || type === 'trefoil_solid_product';
    const segmentCount = clampInteger(
        requestedSegments >= (isTubeLike ? 24 : 18)
            ? requestedSegments
            : requestedSegments * (isTubeLike ? 6 : 3),
        isTubeLike ? 24 : 18,
        isTubeLike ? 72 : 72,
        isTubeLike ? 36 : 30
    );
    const thetaCount = clampInteger(size?.[1], isTubeLike ? 8 : 4, 20, isTubeLike ? 12 : 6);
    const radialCount = clampInteger(size?.[2], 2, 5, 3);
    const intervalCount = clampInteger(size?.[3], 2, 3, 3);
    const coordinates = [];

    for (let s = 0; s < segmentCount; s += 1) {
        if (type === 'trefoil_diagram' || type === 'trefoil_track') {
            coordinates.push(Array.from({ length: dimension }, (_, axis) => axis === 0 ? s : 0));
            continue;
        }
        for (let theta = 0; theta < thetaCount; theta += 1) {
            if (type === 'trefoil_tube') {
                coordinates.push(dimension === 3 ? [s, theta, 0] : [s, theta]);
                continue;
            }
            for (let radius = 0; radius < radialCount; radius += 1) {
                if (dimension === 3) coordinates.push([s, theta, radius]);
                else {
                    for (let interval = 0; interval < intervalCount; interval += 1) {
                        coordinates.push([s, theta, radius, interval]);
                    }
                }
            }
        }
    }

    return topologyObject({
        id: type,
        dimension,
        size: dimension === 2
            ? type === 'trefoil_diagram' ? [segmentCount, 1] : [segmentCount, thetaCount]
            : dimension === 3
                ? type === 'trefoil_track' ? [segmentCount, 1, 1] : type === 'trefoil_tube' ? [segmentCount, thetaCount, 1] : [segmentCount, thetaCount, radialCount]
                : [segmentCount, thetaCount, radialCount, intervalCount],
        coordinates,
        neighbors(coordinate) {
            const result = [];
            const cyclic = [...coordinate];
            cyclic[0] = modulo(cyclic[0] - 1, segmentCount);
            result.push([...cyclic]);
            cyclic[0] = modulo(coordinate[0] + 1, segmentCount);
            result.push([...cyclic]);

            if (type !== 'trefoil_diagram' && type !== 'trefoil_track') {
                for (const delta of [-1, 1]) {
                    const next = [...coordinate];
                    next[1] = modulo(next[1] + delta, thetaCount);
                    result.push(next);
                }
            }
            if (type === 'trefoil_solid' || type === 'trefoil_solid_product') {
                for (let axis = 2; axis < dimension; axis += 1) {
                    for (const delta of [-1, 1]) {
                        const next = [...coordinate];
                        next[axis] += delta;
                        result.push(next);
                    }
                }
            }
            return result;
        },
        position(coordinate) {
            const center = trefoilPosition(coordinate[0], segmentCount);
            if (type === 'trefoil_diagram') return center.slice(0, 2);
            if (type === 'trefoil_track') return center.slice(0, dimension);
            const theta = Math.PI * 2 * coordinate[1] / thetaCount;
            const radial = type === 'trefoil_tube' ? 0.48 : 0.24 + 0.16 * coordinate[2];
            return [
                center[0] + Math.cos(theta) * radial,
                center[1] + Math.sin(theta) * radial,
                center[2] + Math.sin(theta) * radial + (coordinate[3] || 0) * 0.16,
                coordinate[3] || 0
            ].slice(0, dimension);
        },
        goalZones: createGoalZones({ type, segmentCount, thetaCount }),
        metadata: {
            topologyType: type === 'trefoil_diagram'
                ? 'projected-knot-diagram'
                : type === 'trefoil_track'
                    ? 'closed-knot-track'
                    : type === 'trefoil_tube'
                        ? 'periodic-tube-surface'
                        : 'solid-tube-product',
            segmentCount,
            thetaCount: type === 'trefoil_diagram' || type === 'trefoil_track' ? 0 : thetaCount,
            radialCount: type === 'trefoil_solid' || type === 'trefoil_solid_product' ? radialCount : 0,
            crossings: type === 'trefoil_diagram'
                ? [
                    { strands: [2, Math.floor(segmentCount / 2) + 2], over: 2 },
                    { strands: [Math.floor(segmentCount / 6), Math.floor(2 * segmentCount / 3)], over: Math.floor(2 * segmentCount / 3) },
                    { strands: [Math.floor(segmentCount / 3), Math.floor(5 * segmentCount / 6)], over: Math.floor(segmentCount / 3) }
                ]
                : []
        }
    });
}

export function normalizeSpecialTopology(value) {
    const token = String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
    return SPECIAL_ALIASES[token] || null;
}

export function isSpecialBoardTopology(value) {
    return normalizeSpecialTopology(value) !== null;
}

export function createSpecialBoardTopology(options = {}) {
    const type = normalizeSpecialTopology(options.topology);
    if (!type) throw new RangeError(`Unsupported special board topology: ${String(options.topology)}`);
    const dimension = clampInteger(options.dimension, 2, 4, 2);
    const size = Array.isArray(options.size) ? options.size : Array(dimension).fill(options.size || 8);

    if (type === 'klein_quartic' || type === 'klein_quartic_product') {
        return createKleinQuarticTopology({
            dimension,
            size,
            product: type === 'klein_quartic_product' || dimension > 2
        });
    }
    if (dimension === 2) {
        return createTrefoilTopology({
            type: type === 'trefoil_tube' ? 'trefoil_tube' : 'trefoil_diagram',
            dimension,
            size
        });
    }
    if (dimension === 3) {
        return createTrefoilTopology({
            type: type === 'trefoil_tube' ? 'trefoil_tube' : 'trefoil_solid',
            dimension,
            size
        });
    }
    return createTrefoilTopology({ type: 'trefoil_solid_product', dimension, size });
}

export const SPECIAL_BOARD_OPTIONS = Object.freeze({
    2: Object.freeze([
        Object.freeze({ value: 'klein_quartic', en: 'Klein Quartic (56 triangles)', zh: 'Klein 四次曲線（56 三角形）' }),
        Object.freeze({ value: 'trefoil_diagram', en: 'Trefoil Diagram', zh: '三葉結圖' }),
        Object.freeze({ value: 'trefoil_tube', en: 'Trefoil Tube', zh: '三葉結管面' })
    ]),
    3: Object.freeze([
        Object.freeze({ value: 'trefoil_tube', en: 'Trefoil Tube', zh: '三葉結管面' }),
        Object.freeze({ value: 'trefoil_solid', en: 'Trefoil Solid Tube', zh: '三葉結實心管' })
    ]),
    4: Object.freeze([
        Object.freeze({ value: 'klein_quartic_product', en: 'Klein Quartic × I × I', zh: 'Klein 四次曲線 × I × I' }),
        Object.freeze({ value: 'trefoil_solid_product', en: 'Trefoil Solid Tube × I', zh: '三葉結實心管 × I' })
    ])
});
