import * as THREE from 'three';

const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSAHEDRON_VERTICES = Object.freeze([
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize()));

const ICOSAHEDRON_FACES = Object.freeze([
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
]);

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function projectedBasis(normal) {
    const reference = Math.abs(normal.y) < 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0);
    const tangentA = reference.clone().addScaledVector(normal, -reference.dot(normal)).normalize();
    const tangentB = new THREE.Vector3().crossVectors(normal, tangentA).normalize();
    return { tangentA, tangentB };
}

function directedPoint(a, b) {
    return ICOSAHEDRON_VERTICES[a].clone().multiplyScalar(2 / 3)
        .add(ICOSAHEDRON_VERTICES[b].clone().multiplyScalar(1 / 3))
        .normalize();
}

function addEdge(edges, a, b) {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (!edges.has(key)) edges.set(key, [a, b]);
}

function orderedVertexNeighbors(vertex, neighbors) {
    const normal = ICOSAHEDRON_VERTICES[vertex];
    const { tangentA, tangentB } = projectedBasis(normal);
    return [...neighbors].sort((a, b) => {
        const va = ICOSAHEDRON_VERTICES[a].clone().addScaledVector(normal, -ICOSAHEDRON_VERTICES[a].dot(normal)).normalize();
        const vb = ICOSAHEDRON_VERTICES[b].clone().addScaledVector(normal, -ICOSAHEDRON_VERTICES[b].dot(normal)).normalize();
        const angleA = Math.atan2(va.dot(tangentB), va.dot(tangentA));
        const angleB = Math.atan2(vb.dot(tangentB), vb.dot(tangentA));
        return angleA - angleB;
    });
}

function truncatedIcosahedronData() {
    const points = new Map();
    const neighbors = new Map();
    const edges = new Map();
    const pointKey = (a, b) => `${a}->${b}`;
    const ensurePoint = (a, b) => {
        const key = pointKey(a, b);
        if (!points.has(key)) points.set(key, directedPoint(a, b));
        return key;
    };

    for (const [a, b, c] of ICOSAHEDRON_FACES) {
        const face = [
            ensurePoint(a, b), ensurePoint(b, a),
            ensurePoint(b, c), ensurePoint(c, b),
            ensurePoint(c, a), ensurePoint(a, c)
        ];
        for (let index = 0; index < face.length; index += 1) {
            addEdge(edges, face[index], face[(index + 1) % face.length]);
        }
        for (const [from, to] of [[a, b], [b, c], [c, a]]) {
            if (!neighbors.has(from)) neighbors.set(from, new Set());
            if (!neighbors.has(to)) neighbors.set(to, new Set());
            neighbors.get(from).add(to);
            neighbors.get(to).add(from);
        }
    }

    for (let vertex = 0; vertex < ICOSAHEDRON_VERTICES.length; vertex += 1) {
        const ring = orderedVertexNeighbors(vertex, neighbors.get(vertex) || []);
        const face = ring.map((neighbor) => ensurePoint(vertex, neighbor));
        for (let index = 0; index < face.length; index += 1) {
            addEdge(edges, face[index], face[(index + 1) % face.length]);
        }
    }

    return { points, edges: [...edges.values()] };
}

function truncatedIcosahedronEdges() {
    const { points, edges } = truncatedIcosahedronData();
    return edges.map(([a, b]) => [points.get(a), points.get(b)]);
}

export function sphereArcPoints(start, end, segments = 10) {
    const startUnit = start.clone().normalize();
    const endUnit = end.clone().normalize();
    const radius = (start.length() + end.length()) / 2;
    const dot = clamp(startUnit.dot(endUnit), -1, 1);
    const angle = Math.acos(dot);
    const points = [];

    if (angle < 1e-6) return [start.clone(), end.clone()];
    const sinAngle = Math.sin(angle);
    for (let step = 0; step <= segments; step += 1) {
        const t = step / segments;
        const a = Math.sin((1 - t) * angle) / sinAngle;
        const b = Math.sin(t * angle) / sinAngle;
        points.push(startUnit.clone().multiplyScalar(a)
            .add(endUnit.clone().multiplyScalar(b))
            .normalize()
            .multiplyScalar(radius));
    }
    return points;
}

export function createBuckyballSphereGridLines({
    radius = 3.5,
    lift = 0.05,
    segments = 8
} = {}) {
    const scale = radius + lift;
    return truncatedIcosahedronEdges().map(([start, end]) =>
        sphereArcPoints(start.clone().multiplyScalar(scale), end.clone().multiplyScalar(scale), segments));
}

export function createBuckyballSphereVertices({
    radius = 3.5,
    lift = 0.05
} = {}) {
    const scale = radius + lift;
    const { points } = truncatedIcosahedronData();
    return [...points.entries()]
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([, point]) => point.clone().multiplyScalar(scale));
}
