import assert from 'node:assert/strict';
import {
    GoGameLogic,
    HONEYCOMB_LATTICE,
    SQUARE_LATTICE,
    TRIANGULAR_LATTICE
} from '../js/GoGame.js';
import {
    createTorusSurfaceData,
    TORUS_MAJOR_RADIUS,
    TORUS_MINOR_RADIUS,
    torusFrame
} from '../js/TorusBoardGeometry.js';

const EPSILON = 1e-9;
const close = (actual, expected, message) => {
    assert.ok(Math.abs(actual - expected) < EPSILON, `${message}: expected ${expected}, got ${actual}`);
};
const coordKey = (coord) => coord.join(',');

const torus = new GoGameLogic({ size: 19, dimension: 2, topology: 't2', lattice: SQUARE_LATTICE });
const cornerNeighbors = new Set(torus.neighborsFromCoord([0, 0]).map(coordKey));
assert.deepEqual(
    [...cornerNeighbors].sort(),
    ['0,1', '0,18', '1,0', '18,0'],
    'T2 Go should wrap across both torus directions'
);

for (let y = 0; y < torus.size; y++) {
    for (let x = 0; x < torus.size; x++) {
        assert.equal(torus.neighborsFromCoord([x, y]).length, 4, `T2 degree should be 4 at (${x},${y})`);
    }
}

const triangular = new GoGameLogic({
    size: 19,
    dimension: 2,
    topology: 't2',
    lattice: TRIANGULAR_LATTICE
});
assert.equal(triangular.neighborsFromCoord([0, 0]).length, 6, 'Triangular T2 has six wrapped neighbors.');
assert.ok(
    triangular.neighborsFromCoord([0, 0]).some((coord) => coordKey(coord) === '18,18'),
    'Triangular diagonal edges wrap across the torus seam.'
);

const honeycomb = new GoGameLogic({
    size: 19,
    dimension: 2,
    topology: 't2',
    lattice: HONEYCOMB_LATTICE
});
assert.equal(honeycomb.total, 2 * 19 * 19, 'Honeycomb T2 uses two vertices per unit cell.');
assert.equal(honeycomb.neighborsFromCoord([0, 0, 0]).length, 3, 'Honeycomb T2 has three wrapped neighbors.');
assert.ok(
    honeycomb.neighborsFromCoord([0, 0, 0]).some((coord) => coordKey(coord) === '18,0,1'),
    'Honeycomb horizontal edges cover the periodic torus seam.'
);

const size = 8;
const outer = torusFrame([0, 0], size);
close(outer.position.x, TORUS_MAJOR_RADIUS + TORUS_MINOR_RADIUS, 'outer equator x');
close(outer.position.y, 0, 'outer equator y');
close(outer.position.z, 0, 'outer equator z');

const quarterMajor = torusFrame([size / 4, 0], size);
close(quarterMajor.position.x, 0, 'quarter major x');
close(quarterMajor.position.y, TORUS_MAJOR_RADIUS + TORUS_MINOR_RADIUS, 'quarter major y');
close(quarterMajor.position.z, 0, 'quarter major z');

const quarterMinor = torusFrame([0, size / 4], size);
close(quarterMinor.position.x, TORUS_MAJOR_RADIUS, 'quarter minor x');
close(quarterMinor.position.y, 0, 'quarter minor y');
close(quarterMinor.position.z, TORUS_MINOR_RADIUS, 'quarter minor z');

const wrappedX = torusFrame([size, 3], size);
const originX = torusFrame([0, 3], size);
close(wrappedX.position.x, originX.position.x, 'x-periodic surface x');
close(wrappedX.position.y, originX.position.y, 'x-periodic surface y');
close(wrappedX.position.z, originX.position.z, 'x-periodic surface z');

const wrappedY = torusFrame([4, size], size);
const originY = torusFrame([4, 0], size);
close(wrappedY.position.x, originY.position.x, 'y-periodic surface x');
close(wrappedY.position.y, originY.position.y, 'y-periodic surface y');
close(wrappedY.position.z, originY.position.z, 'y-periodic surface z');

const majorSegments = 12;
const minorSegments = 8;
const surface = createTorusSurfaceData(majorSegments, minorSegments);
assert.equal(surface.positions.length, (majorSegments + 1) * (minorSegments + 1) * 3);
assert.equal(surface.normals.length, surface.positions.length);
assert.equal(surface.indices.length, majorSegments * minorSegments * 6);

const surfaceStride = minorSegments + 1;
const sampleMajor = 3;
const sampleMinor = 2;
const sampleOffset = (sampleMajor * surfaceStride + sampleMinor) * 3;
const sampleFrame = torusFrameFromGrid(sampleMajor, sampleMinor);
close(surface.positions[sampleOffset], sampleFrame.position.x, 'solid surface/grid x alignment');
close(surface.positions[sampleOffset + 1], sampleFrame.position.y, 'solid surface/grid y alignment');
close(surface.positions[sampleOffset + 2], sampleFrame.position.z, 'solid surface/grid z alignment');

console.log('3D torus Go topology and geometry verification passed.');

function torusFrameFromGrid(major, minor) {
    return torusFrame([
        major * size / majorSegments,
        minor * size / minorSegments
    ], size);
}
