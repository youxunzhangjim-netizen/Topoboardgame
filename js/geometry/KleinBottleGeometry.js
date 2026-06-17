import * as THREE from 'three';

export const KLEIN_SURFACE_MAJOR_RADIUS = 3.4;
export const KLEIN_SURFACE_WIDTH_SCALE = 2.0;
export const KLEIN_SURFACE_NECK_SCALE = 1.4;
export const KLEIN_SURFACE_HEIGHT_SCALE = 2.8;
const TWO_PI = Math.PI * 2;
const NORMAL_EPSILON = 0.0008;

function positiveModulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

export function kleinParametersForCoord(coord, width, height) {
    const x = Number(coord?.[0]) || 0;
    const y = Number(coord?.[1]) || 0;
    return {
        // The x coordinate is centered in each tube cell so the flipped
        // y-seam maps x to width - 1 - x without collapsing edge vertices.
        v: TWO_PI * (x + 0.5) / Math.max(1, width),
        u: TWO_PI * y / Math.max(1, height)
    };
}

export function kleinBottleBasePoint(u, v) {
    const halfU = u / 2;
    const tubeRadius = KLEIN_SURFACE_MAJOR_RADIUS
        + KLEIN_SURFACE_WIDTH_SCALE * Math.cos(halfU) * Math.sin(v)
        - KLEIN_SURFACE_NECK_SCALE * Math.sin(halfU) * Math.sin(2 * v);
    return new THREE.Vector3(
        tubeRadius * Math.cos(u),
        KLEIN_SURFACE_HEIGHT_SCALE * (
            Math.sin(halfU) * Math.sin(v)
            + Math.cos(halfU) * Math.sin(2 * v)
        ),
        tubeRadius * Math.sin(u)
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
    const positions = [];
    const indices = [];
    for (let iu = 0; iu <= uSegments; iu += 1) {
        const u = (iu / uSegments) * TWO_PI;
        for (let iv = 0; iv <= vSegments; iv += 1) {
            const v = (iv / vSegments) * TWO_PI;
            const point = kleinBottlePoint(u, v, lift);
            positions.push(point.x, point.y, point.z);
        }
    }
    const row = vSegments + 1;
    for (let iu = 0; iu < uSegments; iu += 1) {
        for (let iv = 0; iv < vSegments; iv += 1) {
            const a = iu * row + iv;
            const b = (iu + 1) * row + iv;
            const c = (iu + 1) * row + iv + 1;
            const d = iu * row + iv + 1;
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

    if (isHorizontalWrapEdge(a, b, width)) {
        const left = a[0] === width - 1 ? a : b;
        const right = left === a ? b : a;
        const leftParam = kleinParametersForCoord(left, width, height);
        const rightParam = kleinParametersForCoord(right, width, height);
        addParameterLine(points, leftParam.u, leftParam.v, leftParam.u, TWO_PI, lift, Math.max(2, Math.ceil(segments / 2)));
        addParameterLine(points, rightParam.u, 0, rightParam.u, rightParam.v, lift, Math.max(2, Math.ceil(segments / 2)));
        return points;
    }

    if (isVerticalFlipEdge(a, b, height)) {
        const lower = a[1] === height - 1 ? a : b;
        const upper = lower === a ? b : a;
        const lowerParam = kleinParametersForCoord(lower, width, height);
        const upperParam = kleinParametersForCoord(upper, width, height);
        addParameterLine(points, lowerParam.u, lowerParam.v, TWO_PI, lowerParam.v, lift, Math.max(2, Math.ceil(segments / 2)));
        addParameterLine(points, 0, positiveModulo(-lowerParam.v, TWO_PI), upperParam.u, upperParam.v, lift, Math.max(2, Math.ceil(segments / 2)));
        return points;
    }

    addParameterLine(points, start.u, start.v, end.u, end.v, lift, segments);
    return points;
}
