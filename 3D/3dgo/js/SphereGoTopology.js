const TWO_PI = Math.PI * 2;

export const SPHERE_GO_TOPOLOGY = 'sphere_latitude_ring';

export function wrapSphereLongitude(x, width) {
    return ((x % width) + width) % width;
}

export function sphereContainsCoord(coord, width, height) {
    return Array.isArray(coord)
        && coord.length === 2
        && Number.isInteger(coord[0])
        && Number.isInteger(coord[1])
        && (
            (coord[0] >= 0 && coord[0] < width && coord[1] >= 0 && coord[1] < height)
            || (coord[0] === 0 && (coord[1] === -1 || coord[1] === height))
        );
}

export function isSphereNorthPole(coord, height) {
    return Array.isArray(coord) && coord[0] === 0 && coord[1] === -1;
}

export function isSphereSouthPole(coord, height) {
    return Array.isArray(coord) && coord[0] === 0 && coord[1] === height;
}

export function sphereNorthPoleCoord() {
    return [0, -1];
}

export function sphereSouthPoleCoord(height) {
    return [0, height];
}

export function sphereLatitudeRingNeighbors(coord, width, height) {
    if (!sphereContainsCoord(coord, width, height)) return [];
    const [x, y] = coord;
    if (isSphereNorthPole(coord, height)) {
        return Array.from({ length: width }, (_, index) => [index, 0]);
    }
    if (isSphereSouthPole(coord, height)) {
        return Array.from({ length: width }, (_, index) => [index, height - 1]);
    }
    const neighbors = [
        [wrapSphereLongitude(x - 1, width), y],
        [wrapSphereLongitude(x + 1, width), y]
    ];
    if (y > 0) neighbors.push([x, y - 1]);
    else neighbors.push(sphereNorthPoleCoord());
    if (y < height - 1) neighbors.push([x, y + 1]);
    else neighbors.push(sphereSouthPoleCoord(height));
    return neighbors;
}

export function sphereVertexPosition(coord, width, height, radius = 3.45, lift = 0) {
    const [x, y] = coord;
    const r = radius + lift;
    if (isSphereNorthPole(coord, height)) return { x: 0, y: r, z: 0 };
    if (isSphereSouthPole(coord, height)) return { x: 0, y: -r, z: 0 };
    const theta = Math.PI * (y + 1) / (height + 1);
    const phi = TWO_PI * x / width;
    const sinTheta = Math.sin(theta);
    return {
        x: r * sinTheta * Math.cos(phi),
        y: r * Math.cos(theta),
        z: r * sinTheta * Math.sin(phi)
    };
}
