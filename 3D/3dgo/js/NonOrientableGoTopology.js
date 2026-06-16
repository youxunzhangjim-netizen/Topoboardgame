export const MOBIUS_GO_TOPOLOGY = 'mobius_strip';
export const RP2_GO_TOPOLOGY = 'rp2';

function modulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

export function nonOrientableContainsCoord(coord, width, height) {
    return Array.isArray(coord)
        && coord.length === 2
        && Number.isInteger(coord[0])
        && Number.isInteger(coord[1])
        && coord[0] >= 0
        && coord[0] < width
        && coord[1] >= 0
        && coord[1] < height;
}

export function normalizeMobius(x, y, width, height) {
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
        throw new RangeError('Mobius width and height must be positive integers.');
    }
    if (y < 0 || y >= height) return null;
    const horizontalCrossings = Math.floor(x / width);
    const normalizedX = modulo(x, width);
    const normalizedY = modulo(horizontalCrossings, 2) === 1 ? height - 1 - y : y;
    return [normalizedX, normalizedY];
}

export function normalizeRP2(x, y, width, height) {
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
        throw new RangeError('RP2 width and height must be positive integers.');
    }
    let nx = x;
    let ny = y;
    let guard = 0;
    const limit = Math.max(16, (width + height) * 8);
    while (!nonOrientableContainsCoord([nx, ny], width, height) && guard < limit) {
        if (nx < 0) {
            nx += width;
            ny = height - 1 - ny;
        } else if (nx >= width) {
            nx -= width;
            ny = height - 1 - ny;
        }
        if (ny < 0) {
            ny += height;
            nx = width - 1 - nx;
        } else if (ny >= height) {
            ny -= height;
            nx = width - 1 - nx;
        }
        guard++;
    }
    return [modulo(nx, width), modulo(ny, height)];
}

export function mobiusStepCoord(coord, direction, width, height) {
    const [x, y] = coord;
    return normalizeMobius(x + (direction[0] || 0), y + (direction[1] || 0), width, height);
}

export function rp2StepCoord(coord, direction, width, height) {
    const [x, y] = coord;
    return normalizeRP2(x + (direction[0] || 0), y + (direction[1] || 0), width, height);
}

export function mobiusNeighbors(coord, width, height) {
    if (!nonOrientableContainsCoord(coord, width, height)) return [];
    const candidates = [
        mobiusStepCoord(coord, [1, 0], width, height),
        mobiusStepCoord(coord, [-1, 0], width, height),
        mobiusStepCoord(coord, [0, 1], width, height),
        mobiusStepCoord(coord, [0, -1], width, height)
    ].filter(Boolean);
    return [...new Map(candidates.map((neighbor) => [neighbor.join(','), neighbor])).values()];
}

export function rp2Neighbors(coord, width, height) {
    if (!nonOrientableContainsCoord(coord, width, height)) return [];
    const candidates = [
        rp2StepCoord(coord, [1, 0], width, height),
        rp2StepCoord(coord, [-1, 0], width, height),
        rp2StepCoord(coord, [0, 1], width, height),
        rp2StepCoord(coord, [0, -1], width, height)
    ];
    return [...new Map(candidates.map((neighbor) => [neighbor.join(','), neighbor])).values()];
}
