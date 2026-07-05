export const KLEIN_TWO_PI = Math.PI * 2;

function positiveModulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

export function normalizeClassicKleinParameters(u, v) {
    const turns = Math.floor(Number(u) / KLEIN_TWO_PI);
    return {
        u: positiveModulo(Number(u), KLEIN_TWO_PI),
        v: Math.abs(turns) % 2 === 1
            ? positiveModulo(Math.PI - Number(v), KLEIN_TWO_PI)
            : positiveModulo(Number(v), KLEIN_TWO_PI)
    };
}

export function classicKleinBottlePoint(u, v, {
    scale = 0.2,
    xScale = 1,
    yScale = 1,
    zScale = 1
} = {}) {
    const parameters = normalizeClassicKleinParameters(u, v);
    const radial = 4 * (1 - Math.cos(parameters.u) / 2);
    let rawX;
    let rawY;
    if (parameters.u < Math.PI) {
        rawX = 6 * Math.cos(parameters.u) * (1 + Math.sin(parameters.u))
            + radial * Math.cos(parameters.u) * Math.cos(parameters.v);
        rawY = 16 * Math.sin(parameters.u)
            + radial * Math.sin(parameters.u) * Math.cos(parameters.v);
    } else {
        rawX = 6 * Math.cos(parameters.u) * (1 + Math.sin(parameters.u))
            + radial * Math.cos(parameters.v + Math.PI);
        rawY = 16 * Math.sin(parameters.u);
    }
    return {
        x: rawX * scale * xScale,
        y: rawY * scale * yScale,
        z: radial * Math.sin(parameters.v) * scale * zScale
    };
}
