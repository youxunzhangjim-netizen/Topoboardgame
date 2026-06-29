import * as THREE from 'three';

export const KLEIN_SURFACE_MAJOR_RADIUS = 3.4;
export const KLEIN_SURFACE_WIDTH_SCALE = 2.0;
export const KLEIN_SURFACE_NECK_SCALE = 1.72;
export const KLEIN_SURFACE_HEIGHT_SCALE = 2.8;
const TWO_PI = Math.PI * 2;
const KLEIN_U_MAX = TWO_PI;
const KLEIN_V_MIN = 0;
const KLEIN_V_MAX = TWO_PI;
const KLEIN_DIXON_SCALE = 0.2;
const KLEIN_VISUAL_X_SCALE = 1.24;
const KLEIN_VISUAL_Y_SCALE = 0.76;
const KLEIN_VISUAL_Z_SCALE = 1.24;
const NORMAL_EPSILON = 0.0008;

function positiveModulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

function normalizeKleinU(u) {
    if (Math.abs(u - KLEIN_U_MAX) < NORMAL_EPSILON * 2) return KLEIN_U_MAX;
    return positiveModulo(u, KLEIN_U_MAX);
}

export function kleinParametersForCoord(coord, width, height) {
    const x = Number(coord?.[0]) || 0;
    const y = Number(coord?.[1]) || 0;
    return {
        v: positiveModulo(KLEIN_V_MIN + TWO_PI * (x + 0.5) / Math.max(1, width) - Math.PI / 2, TWO_PI),
        u: KLEIN_U_MAX * (y + 0.5) / Math.max(1, height)
    };
}

function kleinSeamV(v) {
    return positiveModulo(Math.PI - v, TWO_PI);
}

export function kleinBottleBasePoint(u, v) {
    const parameterU = normalizeKleinU(u);
    const parameterV = positiveModulo(v, TWO_PI);
    const radial = 4 * (1 - Math.cos(parameterU) / 2);
    let rawX;
    let rawY;
    if (parameterU < Math.PI) {
        rawX = 6 * Math.cos(parameterU) * (1 + Math.sin(parameterU)) +
            radial * Math.cos(parameterU) * Math.cos(parameterV);
        rawY = 16 * Math.sin(parameterU) + radial * Math.sin(parameterU) * Math.cos(parameterV);
    } else {
        rawX = 6 * Math.cos(parameterU) * (1 + Math.sin(parameterU)) +
            radial * Math.cos(parameterV + Math.PI);
        rawY = 16 * Math.sin(parameterU);
    }
    const rawZ = radial * Math.sin(parameterV);
    return new THREE.Vector3(
        rawX * KLEIN_DIXON_SCALE * KLEIN_VISUAL_X_SCALE,
        rawY * KLEIN_DIXON_SCALE * KLEIN_VISUAL_Y_SCALE,
        rawZ * KLEIN_DIXON_SCALE * KLEIN_VISUAL_Z_SCALE
    );
}

export function kleinBottleBasis(u, v) {
    const uForward = kleinBottleBasePoint(u + NORMAL_EPSILON, v);
    const uBack = kleinBottleBasePoint(u - NORMAL_EPSILON, v);
    const vForward = kleinBottleBasePoint(u, v + NORMAL_EPSILON);
    const vBack = kleinBottleBasePoint(u, v - NORMAL_EPSILON);
    const tangentU = uForward.sub(uBack).normalize();
    const tangentV = vForward.sub(vBack).normalize();
    const normal = new THREE.Vector3().crossVectors(tangentV, tangentU).normalize();
    return { tangentU, tangentV, normal };
}

export function kleinBottlePoint(u, v, lift = 0) {
    const position = kleinBottleBasePoint(u, v);
    if (!lift) return position;
    return position.add(kleinBottleBasis(u, v).normal.multiplyScalar(lift));
}

export function kleinBottlePose(coord, width, height, lift = 0) {
    const { u, v } = kleinParametersForCoord(coord, width, height);
    return {
        u,
        v,
        position: kleinBottlePoint(u, v, lift),
        normal: kleinBottleBasis(u, v).normal
    };
}

export function createKleinBottleSurfaceGeometry({
    uSegments = 100,
    vSegments = 100,
    lift = 0
} = {}) {
    const uCount = Math.max(32, Math.floor(uSegments));
    const rawVCount = Math.max(32, Math.floor(vSegments));
    const vCount = rawVCount % 2 === 0 ? rawVCount : rawVCount + 1;
    const positions = [];
    const uvs = [];
    const indices = [];
    const indexFor = (i, j) => positiveModulo(i, uCount) * vCount + positiveModulo(j, vCount);
    const seamVIndex = (j) => positiveModulo(vCount / 2 - j, vCount);

    for (let i = 0; i < uCount; i += 1) {
        const u = TWO_PI * i / uCount;
        for (let j = 0; j < vCount; j += 1) {
            const v = TWO_PI * j / vCount;
            const point = kleinBottlePoint(u, v, lift);
            positions.push(point.x, point.y, point.z);
            uvs.push(i / uCount, j / vCount);
        }
    }

    for (let i = 0; i < uCount; i += 1) {
        const nextI = (i + 1) % uCount;
        const wrapsU = nextI === 0;
        for (let j = 0; j < vCount; j += 1) {
            const nextJ = (j + 1) % vCount;
            const a = indexFor(i, j);
            const b = indexFor(i, nextJ);
            const c = wrapsU ? indexFor(nextI, seamVIndex(nextJ)) : indexFor(nextI, nextJ);
            const d = wrapsU ? indexFor(nextI, seamVIndex(j)) : indexFor(nextI, j);
            indices.push(a, b, c, a, c, d);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

function isHorizontalWrapEdge(a, b, width) {
    return Math.abs((Number(a?.[0]) || 0) - (Number(b?.[0]) || 0)) > 1
        || (a?.[0] === 0 && b?.[0] === width - 1)
        || (b?.[0] === 0 && a?.[0] === width - 1);
}

function isVerticalFlipEdge(a, b, height) {
    return Math.abs((Number(a?.[1]) || 0) - (Number(b?.[1]) || 0)) > 1
        || (a?.[1] === 0 && b?.[1] === height - 1)
        || (b?.[1] === 0 && a?.[1] === height - 1);
}

function addParameterLine(points, u0, v0, u1, v1, lift, segments) {
    for (let step = 0; step <= segments; step += 1) {
        const t = step / segments;
        points.push(kleinBottlePoint(
            THREE.MathUtils.lerp(u0, u1, t),
            THREE.MathUtils.lerp(v0, v1, t),
            lift
        ));
    }
}

function addShortestVLine(points, u, v0, v1, lift, segments) {
    let endV = v1;
    const delta = endV - v0;
    if (delta > Math.PI) endV -= TWO_PI;
    else if (delta < -Math.PI) endV += TWO_PI;
    addParameterLine(points, u, v0, u, endV, lift, segments);
}

export function kleinBottleGraphEdgePoints(a, b, width, height, lift = 0.05, segments = 24) {
    const start = kleinParametersForCoord(a, width, height);
    const end = kleinParametersForCoord(b, width, height);
    const points = [];

    if (isVerticalFlipEdge(a, b, height)) {
        const lower = a[1] === height - 1 ? a : b;
        const upper = lower === a ? b : a;
        const lowerParam = kleinParametersForCoord(lower, width, height);
        const upperParam = kleinParametersForCoord(upper, width, height);
        addParameterLine(points, lowerParam.u, lowerParam.v, KLEIN_U_MAX, lowerParam.v, lift, Math.max(2, Math.ceil(segments / 2)));
        addParameterLine(points, 0, kleinSeamV(lowerParam.v), upperParam.u, upperParam.v, lift, Math.max(2, Math.ceil(segments / 2)));
        return points;
    }

    if (isHorizontalWrapEdge(a, b, width)) {
        const left = a[0] === width - 1 ? a : b;
        const right = left === a ? b : a;
        const leftParam = kleinParametersForCoord(left, width, height);
        const rightParam = kleinParametersForCoord(right, width, height);
        addShortestVLine(points, leftParam.u, leftParam.v, rightParam.v, lift, segments);
        return points;
    }

    addParameterLine(points, start.u, start.v, end.u, end.v, lift, segments);
    return points;
}

export function createKleinBottleGridLines({
    uSteps = 18,
    vSteps = 16,
    lift = 0.08,
    uSegments = 160,
    vSegments = 120
} = {}) {
    const lines = [];
    const safeUSteps = Math.max(4, Math.floor(uSteps));
    const safeVSteps = Math.max(4, Math.floor(vSteps));
    const safeUSegments = Math.max(32, Math.floor(uSegments));
    const safeVSegments = Math.max(32, Math.floor(vSegments));

    for (let i = 0; i < safeUSteps; i += 1) {
        const u = TWO_PI * i / safeUSteps;
        const points = [];
        addParameterLine(points, u, 0, u, TWO_PI, lift, safeVSegments);
        lines.push(points);
    }

    for (let j = 0; j < safeVSteps; j += 1) {
        const v = TWO_PI * j / safeVSteps;
        const points = [];
        addParameterLine(points, 0, v, TWO_PI, v, lift, safeUSegments);
        lines.push(points);
    }

    return lines;
}
