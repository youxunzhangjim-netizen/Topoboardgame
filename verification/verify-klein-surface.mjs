import assert from 'node:assert/strict';
import {
    classicKleinBottlePoint,
    KLEIN_TWO_PI
} from '../js/geometry/KleinBottleMath.js';
import { createKleinBottleGridLines } from '../js/geometry/KleinBottleGeometry.js';

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

for (let index = 0; index < 24; index += 1) {
    const v = KLEIN_TWO_PI * index / 24;
    const seamEnd = classicKleinBottlePoint(KLEIN_TWO_PI, v);
    const identifiedStart = classicKleinBottlePoint(0, Math.PI - v);
    assert.ok(distance(seamEnd, identifiedStart) < 1e-9, `Klein seam mismatch at sample ${index}.`);
}

for (const line of createKleinBottleGridLines({ uSteps: 10, vSteps: 10 })) {
    assert.ok(line.length > 2);
    for (let index = 1; index < line.length; index += 1) {
        assert.ok(line[index].distanceTo(line[index - 1]) < 0.5, 'Klein grid contains a discontinuous segment.');
    }
}

console.log('Klein surface seam verification passed.');
