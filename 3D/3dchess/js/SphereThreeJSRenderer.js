import * as THREE from 'three';
import { TorusThreeJSRenderer } from './TorusThreeJSRenderer.js';
import {
    SPHERE_BOARD_HEIGHT,
    SPHERE_BOARD_WIDTH,
    SPHERE_PLAYABLE_MIN_Y
} from './SphereConfig.js';

const TWO_PI = Math.PI * 2;
const BOARD_LIGHT_COLOR = 0xd7e8df;
const BOARD_DARK_COLOR = 0x31434c;

export class SphereThreeJSRenderer extends TorusThreeJSRenderer {
    constructor(game) {
        super(game);
        this.cylinderRadius = 3.05;
        this.cylinderHeight = 5.7;
        this.surfaceLift = 0.03;
        this.pieceLift = 0.22;
        this.maxPixelRatio = 1.25;
    }

    init3D() {
        super.init3D();
        this.controls.rotateSpeed = 2.8;
        this.controls.minDistance = 5.2;
        this.controls.maxDistance = 20;
        this.resetCamera();
    }

    addLighting() {
        super.addLighting();
        const floor = this.decorGroup.children.find((child) => child.isMesh && child.material?.isShadowMaterial);
        if (floor) {
            floor.geometry.dispose();
            floor.geometry = new THREE.PlaneGeometry(14, 14);
            floor.position.y = -3.45;
        }
    }

    createBoard3D() {
        this.boardGroup.clear();

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(this.cylinderRadius - 0.035, this.cylinderRadius - 0.035, this.cylinderHeight, 112, 1, true),
            this.materials.base
        );
        base.castShadow = true;
        base.receiveShadow = true;
        base.userData = { type: 'cylinder-base' };
        this.boardGroup.add(base);

        for (const { x, y, sheet } of this.game.validCells()) {
            const cell = new THREE.Mesh(
                this.createCellGeometry(x, y, 0.018, 0.018, sheet),
                this.materialForCell(x, y, sheet)
            );
            cell.castShadow = true;
            cell.receiveShadow = true;
            cell.userData = { type: 'cell', x, y, sheet };
            this.boardGroup.add(cell);
        }

        this.addGridLines();
        if (this.renderer) this.renderer.shadowMap.needsUpdate = true;
    }

    boardWidth() {
        return this.game?.boardWidth?.() ?? SPHERE_BOARD_WIDTH;
    }

    boardHeight() {
        return this.game?.boardHeight?.() ?? SPHERE_BOARD_HEIGHT;
    }

    playableMinY() {
        return SPHERE_PLAYABLE_MIN_Y;
    }

    playableMaxY() {
        return this.boardHeight() - 2;
    }

    addGridLines() {
        const gridMaterial = new THREE.LineBasicMaterial({
            color: BOARD_LIGHT_COLOR,
            transparent: true,
            opacity: 0.34,
            depthWrite: false
        });
        const seamMaterial = new THREE.LineBasicMaterial({
            color: BOARD_LIGHT_COLOR,
            transparent: true,
            opacity: 0.62,
            depthWrite: false
        });

        for (let x = 0; x < this.boardWidth(); x++) {
            this.boardGroup.add(this.createLongitudeLine(x, x === 0 ? seamMaterial : gridMaterial));
        }

        for (let y = this.playableMinY(); y <= this.playableMaxY() + 1; y++) {
            const material = y === this.playableMinY() || y === this.playableMaxY() + 1
                ? seamMaterial
                : gridMaterial;
            this.boardGroup.add(this.createLatitudeLine(y, material));
        }
    }

    addWindingGuides() {
        // Cylinder mode has one periodic circumference; the top and bottom rings remain open edges.
    }

    addBoardLabels() {
        this.labelGroup.clear();
    }

    createLongitudeLine(xBoundary, material) {
        const points = [];
        const theta = (xBoundary / this.boardWidth()) * TWO_PI;
        const yStart = this.cylinderYForBoundary(this.playableMinY());
        const yEnd = this.cylinderYForBoundary(this.playableMaxY() + 1);
        const segments = 96;

        for (let i = 0; i <= segments; i++) {
            const y = THREE.MathUtils.lerp(yStart, yEnd, i / segments);
            points.push(this.pointOnCylinder(theta, y, this.surfaceLift + 0.035));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        line.userData = { type: 'grid' };
        return line;
    }

    createLatitudeLine(yBoundary, material) {
        const points = [];
        const y = this.cylinderYForBoundary(yBoundary);
        const segments = 144;

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * TWO_PI;
            points.push(this.pointOnCylinder(theta, y, this.surfaceLift + 0.035));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.LineLoop(geometry, material);
        line.userData = { type: 'grid' };
        return line;
    }

    createCellGeometry(x, y, lift = 0, inset = 0.018) {
        const theta0 = ((x + inset) / this.boardWidth()) * TWO_PI;
        const theta1 = ((x + 1 - inset) / this.boardWidth()) * TWO_PI;
        const y0 = this.cylinderYForBoundary(y + inset);
        const y1 = this.cylinderYForBoundary(y + 1 - inset);
        const thetaSegments = 5;
        const ySegments = 4;
        const vertices = [];
        const indices = [];

        for (let iy = 0; iy <= ySegments; iy++) {
            const currentY = THREE.MathUtils.lerp(y0, y1, iy / ySegments);
            for (let ix = 0; ix <= thetaSegments; ix++) {
                const theta = THREE.MathUtils.lerp(theta0, theta1, ix / thetaSegments);
                const point = this.pointOnCylinder(theta, currentY, this.surfaceLift + lift);
                vertices.push(point.x, point.y, point.z);
            }
        }

        const row = thetaSegments + 1;
        for (let iy = 0; iy < ySegments; iy++) {
            for (let ix = 0; ix < thetaSegments; ix++) {
                const a = iy * row + ix;
                const b = (iy + 1) * row + ix;
                const c = (iy + 1) * row + ix + 1;
                const d = iy * row + ix + 1;
                indices.push(a, b, d, b, c, d);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    getCellPose(x, y, lift = 0) {
        const theta = ((x + 0.5) / this.boardWidth()) * TWO_PI;
        const boardY = this.cylinderYForBoundary(y + 0.5);
        const normal = this.normalOnCylinder(theta);
        const position = this.pointOnCylinder(theta, boardY, this.surfaceLift + lift);
        const tangentU = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta)).normalize();
        const tangentV = new THREE.Vector3(0, 1, 0);

        return { position, normal, tangentU, tangentV };
    }

    cylinderYForBoundary(yBoundary) {
        const start = this.playableMinY();
        const end = this.playableMaxY() + 1;
        const t = (yBoundary - start) / Math.max(1, end - start);
        return THREE.MathUtils.lerp(-this.cylinderHeight / 2, this.cylinderHeight / 2, t);
    }

    pointOnCylinder(theta, y, lift = 0) {
        const radius = this.cylinderRadius + lift;
        return new THREE.Vector3(
            radius * Math.cos(theta),
            y,
            radius * Math.sin(theta)
        );
    }

    normalOnCylinder(theta) {
        return new THREE.Vector3(
            Math.cos(theta),
            0,
            Math.sin(theta)
        ).normalize();
    }

    homeCameraPosition() {
        const base = this.game.currentPlayer === 'black'
            ? new THREE.Vector3(-5.8, 4.5, -8.2)
            : new THREE.Vector3(5.8, 4.5, 8.2);
        if (this.camera?.aspect < 0.72) base.setLength(13.8);
        return base;
    }
}
