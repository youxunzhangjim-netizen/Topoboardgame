import assert from 'node:assert/strict';
import { JumpGameApp } from '../js/shared/JumpGameApp.js';

function createSurfaceProbe(topology, lattice = 'square', size = 8) {
  const app = Object.create(JumpGameApp.prototype);
  app.config = { topology };
  app.dimension = 3;
  app.game = { size, dimension: 2, topologyName: topology, lattice };
  app.topologySelect = { value: topology };
  app.latticeSelect = { value: lattice };
  app.view = { rotX: -26, rotY: 32, rotZ: 0, zoom: 1 };
  app.canvas = { clientWidth: 900, clientHeight: 620, widthCss: 900, heightCss: 620 };
  app.sliceProjectionMap = null;
  return app;
}

function distanceFromTorusCenterline(point) {
  const angle = Math.atan2(point[1], point[0]);
  const center = [1.45 * Math.cos(angle), 1.45 * Math.sin(angle), 0];
  return Math.hypot(point[0] - center[0], point[1] - center[1], point[2] - center[2]);
}

for (const topology of ['cylinder', 'torus']) {
  for (const lattice of ['square', 'triangular']) {
    const app = createSurfaceProbe(topology, lattice);
    const samples = [[0, 0], [2, 3], [7, 7]];
    for (const coord of samples) {
      const base = app.embeddedPoint(coord);
      const lifted = app.liftedEmbeddedSurfacePoint(coord);
      const offset = lifted.point.map((value, axis) => value - base[axis]);
      const outward = offset.reduce((sum, value, axis) => sum + value * lifted.normal[axis], 0);
      assert.ok(outward > 0.05, `${topology}/${lattice} site ${coord} must be outside the surface`);
      if (topology === 'cylinder') {
        assert.ok(Math.hypot(lifted.point[0], lifted.point[2]) > 1.18, 'Cylinder site must be outside its radius');
      } else {
        assert.ok(distanceFromTorusCenterline(lifted.point) > 0.48, 'Torus site must be outside its tube');
      }
    }

    const seamPath = app.projectEmbeddedSurfaceEdge([0, 2], [7, 2]);
    assert.equal(seamPath.length, 9);
    assert.ok(seamPath.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)));
  }
}

console.log('Jump cylinder/torus outside-surface verification passed.');
