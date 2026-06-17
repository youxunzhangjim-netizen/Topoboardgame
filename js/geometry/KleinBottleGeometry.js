import * as THREE from 'three';

export const KLEIN_SURFACE_MAJOR_RADIUS = 3.4;
export const KLEIN_SURFACE_WIDTH_SCALE = 2.0;
export const KLEIN_SURFACE_NECK_SCALE = 1.72;
export const KLEIN_SURFACE_HEIGHT_SCALE = 2.8;
const TWO_PI = Math.PI * 2;
const KLEIN_U_MAX = TWO_PI;
const KLEIN_V_MIN = -Math.PI / 2;
const KLEIN_V_MAX = Math.PI * 1.5;
const KLEIN_VISUAL_SCALE = 0.52;
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
        // The v offset makes the graph flip x -> width - 1 - x coincide with
        // the traditional Klein bottle seam v -> pi - v.
        v: KLEIN_V_MIN + TWO_PI * (x + 0.5) / Math.max(1, width),
        u: KLEIN_U_MAX * y / Math.max(1, height)
    };
}

export function kleinBottleBasePoint(u, v) {
    const parameterU = normalizeKleinU(u);
    const sinU = Math.sin(parameterU);
    const cosU = Math.cos(parameterU);
    const cosV = Math.cos(v);
    const sinV = Math.sin(v);
    let rawX;
    let rawZ;
    if (parameterU < Math.PI) {
        const tube = 2 * (1 - cosU / 2) * KLEIN_SURFACE_NECK_SCALE / 1.4;
        rawX = 3 * cosU * (1 + sinU) + tube * cosU * cosV;
        rawZ = -8 * sinU - tube * sinU * cosV;
    } else {
        const tube = 2 * (1 - cosU / 2) * KLEIN_SURFACE_NECK_SCALE / 1.4;
        rawX = 3 * cosU * (1 + sinU) + tube * Math.cos(v + Math.PI);
        rawZ = -8 * sinU;
    }
    const rawY = -2 * (1 - cosU / 2) * (KLEIN_SURFACE_WIDTH_SCALE / 2.0) * sinV;
    return new THREE.Vector3(
        rawX * KLEIN_VISUAL_SCALE,
        rawZ * KLEIN_VISUAL_SCALE,
        rawY * KLEIN_VISUAL_SCALE
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
    uSegments = 220,
    vSegments = 80,
    lift = 0
} = {}) {
    const safeUSegments = Math.max(8, Math.floor(uSegments));
    const safeVSegments = Math.max(8, Math.floor(vSegments / 2) * 2);
    const positions = [];
    const indices = [];
    for (let iu = 0; iu < safeUSegments; iu += 1) {
        const u = (iu / safeUSegments) * KLEIN_U_MAX;
        for (let iv = 0; iv < safeVSegments; iv += 1) {
            const v = KLEIN_V_MIN + (iv / safeVSegments) * TWO_PI;
            const point = kleinBottlePoint(u, v, lift);
            positions.push(point.x, point.y, point.z);
        }
    }
    const row = safeVSegments;
    const twistIndex = (iv) => positiveModulo((safeVSegments / 2) - iv, safeVSegments);
    for (let iu = 0; iu < safeUSegments; iu += 1) {
        const nextU = (iu + 1) % safeUSegments;
        const wrapsU = nextU === 0;
        for (let iv = 0; iv < safeVSegments; iv += 1) {
            const nextV = (iv + 1) % safeVSegments;
            const a = iu * row + iv;
            const b = wrapsU ? twistIndex(iv) : nextU * row + iv;
            const c = wrapsU ? twistIndex(nextV) : nextU * row + nextV;
            const d = iu * row + nextV;
            indices.push(a, b, d, b, c, d);
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
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
        addParameterLine(points, 0, Math.PI - lowerParam.v, upperParam.u, upperParam.v, lift, Math.max(2, Math.ceil(segments / 2)));
        return points;
    }

    if (isHorizontalWrapEdge(a, b, width)) {
        const left = a[0] === width - 1 ? a : b;
        const right = left === a ? b : a;
        const leftParam = kleinParametersForCoord(left, width, height);
        const rightParam = kleinParametersForCoord(right, width, height);
        addParameterLine(points, leftParam.u, leftParam.v, leftParam.u, KLEIN_V_MAX, lift, Math.max(2, Math.ceil(segments / 2)));
        addParameterLine(points, rightParam.u, KLEIN_V_MIN, rightParam.u, rightParam.v, lift, Math.max(2, Math.ceil(segments / 2)));
        return points;
    }

    addParameterLine(points, start.u, start.v, end.u, end.v, lift, segments);
    return points;
}
