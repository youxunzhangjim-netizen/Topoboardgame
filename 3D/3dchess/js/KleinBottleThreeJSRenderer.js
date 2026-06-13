import * as THREE from 'three';
import { TorusThreeJSRenderer } from './TorusThreeJSRenderer.js';

const LEFT_RIGHT_COLOR = 0x38bdf8;
const TOP_BOTTOM_COLOR = 0xfbbf24;

export class KleinBottleThreeJSRenderer extends TorusThreeJSRenderer {
    constructor(game) {
        super(game);
        this.cellSize = 0.48;
        this.cellGap = 0.025;
        this.surfaceLift = 0.02;
        this.pieceLift = 0.16;
        this.maxPixelRatio = 1.25;
    }

    init3D() {
        super.init3D();
        this.controls.rotateSpeed = 2.4;
        this.controls.zoomSpeed = 0.34;
        this.controls.minDistance = 7;
        this.controls.maxDistance = 22;
        this.resetCamera();
    }

    addLighting() {
        super.addLighting();
        this.decorGroup.clear();
    }

    createBoard3D() {
        this.boardGroup.clear();

        const base = new THREE.Mesh(
            new THREE.PlaneGeometry(
                this.boardSpanX() + this.cellSize * 0.24,
                this.boardSpanY() + this.cellSize * 0.24
            ),
            this.materials.base
        );
        base.position.z = -0.055;
        base.castShadow = true;
        base.receiveShadow = true;
        base.userData = { type: 'klein-base' };
        this.boardGroup.add(base);

        for (const { x, y, sheet } of this.game.validCells()) {
            const cell = new THREE.Mesh(
                this.createCellGeometry(x, y, 0.018, this.cellGap, sheet),
                this.materialForCell(x, y, sheet)
            );
            cell.castShadow = true;
            cell.receiveShadow = true;
            cell.userData = { type: 'cell', x, y, sheet };
            this.boardGroup.add(cell);
        }

        this.addBoundaryRails();
        this.addNormalWrapHints();
        this.addFlippedWrapHints();
        if (this.renderer) this.renderer.shadowMap.needsUpdate = true;
    }

    materialForCell(x, y) {
        return (x + y) % 2 === 0 ? this.materials.light : this.materials.dark;
    }

    createCellGeometry(x, y, lift = 0, inset = this.cellGap) {
        const size = this.cellSize - inset * 2;
        const geometry = new THREE.PlaneGeometry(size, size);
        const pose = this.getCellPose(x, y, lift);
        geometry.translate(pose.position.x, pose.position.y, pose.position.z);
        return geometry;
    }

    getCellPose(x, y, lift = 0) {
        return {
            position: new THREE.Vector3(
                (x - (this.boardWidth() - 1) / 2) * this.cellSize,
                ((this.boardHeight() - 1) / 2 - y) * this.cellSize,
                this.surfaceLift + lift
            ),
            normal: new THREE.Vector3(0, 0, 1),
            tangentU: new THREE.Vector3(1, 0, 0),
            tangentV: new THREE.Vector3(0, 1, 0)
        };
    }

    addBoundaryRails() {
        const horizontalMaterial = new THREE.MeshStandardMaterial({
            color: TOP_BOTTOM_COLOR,
            emissive: TOP_BOTTOM_COLOR,
            emissiveIntensity: 0.34,
            roughness: 0.3
        });
        const verticalMaterial = new THREE.MeshStandardMaterial({
            color: LEFT_RIGHT_COLOR,
            emissive: LEFT_RIGHT_COLOR,
            emissiveIntensity: 0.32,
            roughness: 0.3
        });
        const sideX = this.boardSpanX() / 2 + this.cellSize * 0.17;
        const sideY = this.boardSpanY() / 2 + this.cellSize * 0.17;

        for (const x of [-sideX, sideX]) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(0.055, this.boardSpanY(), 0.055),
                verticalMaterial
            );
            rail.position.set(x, 0, 0.08);
            this.boardGroup.add(rail);
        }

        for (const y of [-sideY, sideY]) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(this.boardSpanX(), 0.055, 0.055),
                horizontalMaterial
            );
            rail.position.set(0, y, 0.08);
            this.boardGroup.add(rail);
        }
    }

    addNormalWrapHints() {
        const sideX = this.boardSpanX() / 2 + this.cellSize * 0.55;
        for (const { x, direction } of [
            { x: -sideX, direction: -1 },
            { x: sideX, direction: 1 }
        ]) {
            for (const y of [-this.cellSize * 2.5, 0, this.cellSize * 2.5]) {
                this.boardGroup.add(new THREE.ArrowHelper(
                    new THREE.Vector3(direction, 0, 0),
                    new THREE.Vector3(x - direction * this.cellSize * 0.25, y, 0.18),
                    this.cellSize * 0.5,
                    LEFT_RIGHT_COLOR,
                    this.cellSize * 0.18,
                    this.cellSize * 0.11
                ));
            }
        }
    }

    addFlippedWrapHints() {
        const halfWidth = this.boardSpanX() / 2;
        const halfHeight = this.boardSpanY() / 2;
        const routeX = halfWidth + this.cellSize * 0.92;
        const routeY = halfHeight + this.cellSize * 0.42;
        const material = new THREE.LineBasicMaterial({
            color: TOP_BOTTOM_COLOR,
            transparent: true,
            opacity: 0.54,
            depthWrite: false
        });

        for (let x = 0; x < this.boardWidth(); x++) {
            const mirroredX = this.boardWidth() - 1 - x;
            const top = this.edgePoint(x, 'top');
            const bottom = this.edgePoint(mirroredX, 'bottom');
            const side = x < this.boardWidth() / 2 ? -1 : 1;
            const curve = new THREE.CatmullRomCurve3([
                top,
                new THREE.Vector3(top.x, routeY, 0.17),
                new THREE.Vector3(side * routeX, routeY, 0.22),
                new THREE.Vector3(side * routeX, -routeY, 0.22),
                new THREE.Vector3(bottom.x, -routeY, 0.17),
                bottom
            ], false, 'centripetal', 0.35);
            const points = curve.getPoints(42);
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(points),
                material
            );
            line.userData = { type: 'klein-map', fromX: x, toX: mirroredX };
            this.boardGroup.add(line);

            const arrowStart = points[points.length - 3];
            const arrowEnd = points[points.length - 1];
            this.boardGroup.add(new THREE.ArrowHelper(
                arrowEnd.clone().sub(arrowStart).normalize(),
                arrowStart,
                arrowStart.distanceTo(arrowEnd),
                TOP_BOTTOM_COLOR,
                this.cellSize * 0.15,
                this.cellSize * 0.09
            ));
        }
    }

    edgePoint(x, side) {
        const pose = this.getCellPose(
            x,
            side === 'top' ? 0 : this.boardHeight() - 1,
            0.13
        );
        pose.position.y += side === 'top' ? this.cellSize * 0.58 : -this.cellSize * 0.58;
        return pose.position;
    }

    addWindingGuides() {}

    addGridLines() {}

    addBoardLabels() {
        this.labelGroup.clear();
    }

    boardWidth() {
        return this.game.boardWidth();
    }

    boardHeight() {
        return this.game.boardHeight();
    }

    boardSpanX() {
        return this.boardWidth() * this.cellSize;
    }

    boardSpanY() {
        return this.boardHeight() * this.cellSize;
    }

    homeCameraPosition() {
        const base = new THREE.Vector3(0, 0.5, 12.8);
        if (this.camera?.aspect < 0.72) base.z = 15.8;
        return base;
    }
}
