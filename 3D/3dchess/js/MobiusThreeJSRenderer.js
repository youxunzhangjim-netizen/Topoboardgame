import * as THREE from 'three';
import { TorusThreeJSRenderer } from './TorusThreeJSRenderer.js';
import {
    BACK_PAWN_ROWS,
    BOARD_HEIGHT,
    BOARD_WIDTH,
    FRONT_PAWN_ROWS,
    HOME_ROWS
} from './BoardSetup.js';

const TWO_PI = Math.PI * 2;

export class MobiusThreeJSRenderer extends TorusThreeJSRenderer {
    constructor(game) {
        super(game);
        this.bandRadius = 3.05;
        this.bandHalfWidth = 1.18;
        this.surfaceLift = 0.025;
        this.pieceLift = 0.18;
        this.twistLinks = new Map();
    }

    createBoard3D() {
        this.boardGroup.clear();
        this.twistLinks.clear();

        for (const { x, y, sheet } of this.game.validCells()) {
            const cell = new THREE.Mesh(
                this.createCellGeometry(x, y, 0.018, 0.026, sheet),
                this.materialForCell(x, y, sheet)
            );
            cell.castShadow = true;
            cell.receiveShadow = true;
            cell.userData = { type: 'cell', x, y, sheet };
            this.boardGroup.add(cell);
        }

        this.addOpenEdgeRails();
        this.addTwistLinks();
        this.addWindingGuides();
    }

    materialForCell(x, y, sheet = 0) {
        return (x + y) % 2 === 0 ? this.materials.light : this.materials.dark;
    }

    homeSheetFor(color) {
        return this.game.homeSheetFor?.(color) ?? (color === 'white' ? 0 : 1);
    }

    homeRowFor(color) {
        return this.game.homeRowFor?.(color) ?? HOME_ROWS[color];
    }

    pawnRowsFor(color) {
        return this.game.pawnRowsFor?.(color) ?? [FRONT_PAWN_ROWS[color], BACK_PAWN_ROWS[color]];
    }

    addOpenEdgeRails() {
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.7,
            depthWrite: false
        });

        for (const sheet of [0, 1]) {
            for (const x of [0, BOARD_WIDTH - 1]) {
                const points = [];
                const t = this.tForX(x + 0.5);
                for (let i = 0; i <= 160; i++) {
                    points.push(this.mobiusPoint((i / 160) * TWO_PI, t, 0.06, sheet));
                }
                const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), edgeMaterial);
                line.userData = { type: 'open-edge', sheet, x };
                this.boardGroup.add(line);
            }
        }
    }

    addTwistLinks() {
        for (const sheet of [0, 1]) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                this.addTwistLink(sheet, 'top', x);
                this.addTwistLink(sheet, 'bottom', x);
            }
        }
    }

    addTwistLink(sheet, side, x) {
        const toSheet = 1 - sheet;
        const toSide = side === 'top' ? 'bottom' : 'top';
        const targetX = BOARD_WIDTH - 1 - x;
        const start = this.edgePoint(side, x, sheet, 0.32);
        const end = this.edgePoint(toSide, targetX, toSheet, 0.32);
        const control = start.clone().add(end).multiplyScalar(0.5);
        control.y += 1.15 + Math.abs(x - 3.5) * 0.04;

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.58,
            depthWrite: false
        });
        const arrowMaterial = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.25,
            roughness: 0.34
        });
        const key = this.game.boundaryCrossingKey(sheet, side, x);
        const line = this.createLinkCurve(start, control, end, lineMaterial, key);
        const arrow = this.createArrowAt(end, end.clone().sub(control), arrowMaterial, key);

        this.twistLinks.set(key, {
            key,
            line,
            arrow,
            lineColor: lineMaterial.color.clone(),
            lineOpacity: lineMaterial.opacity,
            arrowColor: arrowMaterial.color.clone(),
            arrowEmissive: arrowMaterial.emissive.clone(),
            arrowEmissiveIntensity: arrowMaterial.emissiveIntensity,
            glowPosition: end.clone().add(control.clone().sub(end).normalize().multiplyScalar(0.18))
        });

        this.boardGroup.add(line);
        this.boardGroup.add(arrow);
    }

    createLinkCurve(start, control, end, material, key = '') {
        const curve = new THREE.QuadraticBezierCurve3(start, control, end);
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(28));
        const line = new THREE.Line(geometry, material);
        line.userData = { type: 'twist-link', key };
        line.renderOrder = 18;
        return line;
    }

    createArrowAt(position, direction, material, key = '') {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 18), material);
        const tangent = direction.clone().normalize();
        cone.position.copy(position).add(tangent.clone().multiplyScalar(-0.1));
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
        cone.userData = { type: 'twist-arrow', key };
        return cone;
    }

    addWindingGuides() {
        const guideMaterial = {
            white: new THREE.MeshStandardMaterial({
                color: 0x7dd3fc,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.4,
                roughness: 0.28
            }),
            black: new THREE.MeshStandardMaterial({
                color: 0xf4a261,
                emissive: 0xf59e0b,
                emissiveIntensity: 0.34,
                roughness: 0.32
            })
        };
        const cone = new THREE.ConeGeometry(0.07, 0.24, 18);
        const yAxis = new THREE.Vector3(0, 1, 0);

        for (const color of ['white', 'black']) {
            const sheet = this.homeSheetFor(color);
            for (const row of this.pawnRowsFor(color)) {
                const direction = this.game?.pawnDirectionFromHome?.(color, row, sheet) ?? (row < this.homeRowFor(color) ? -1 : 1);
                for (const x of [1, 3, 5, 7]) {
                    const pose = this.getCellPose(x, row, 0.3, sheet);
                    const tangent = pose.tangentV.clone().multiplyScalar(direction).normalize();
                    const arrow = new THREE.Mesh(cone, guideMaterial[color]);
                    arrow.position.copy(pose.position).add(tangent.clone().multiplyScalar(0.18));
                    arrow.quaternion.setFromUnitVectors(yAxis, tangent);
                    arrow.castShadow = true;
                    arrow.userData = { type: 'guide', sheet };
                    this.boardGroup.add(arrow);
                }
            }
        }
    }

    addBoardLabels() {
        this.labelGroup.clear();
    }

    showLegalMoves(moves) {
        super.showLegalMoves(moves);
        if (this.game.showMoveHints) this.showTwistCrossingHints(moves);
    }

    clearLegalMoveHints() {
        super.clearLegalMoveHints();
        this.clearTwistCrossingHints();
    }

    showTwistCrossingHints(moves) {
        this.clearTwistCrossingHints();
        const seen = new Set();
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x22c55e,
            transparent: true,
            opacity: 0.96,
            depthTest: false,
            depthWrite: false
        });

        for (const move of moves) {
            for (const crossing of move.boundaryCrossings || []) {
                if (seen.has(crossing.key)) continue;
                seen.add(crossing.key);
                const link = this.twistLinks.get(crossing.key);
                if (!link) continue;

                link.line.material.color.set(0x22c55e);
                link.line.material.opacity = 0.98;
                link.arrow.material.color.set(0x22c55e);
                link.arrow.material.emissive.set(0x22c55e);
                link.arrow.material.emissiveIntensity = 0.9;

                const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), glowMaterial);
                glow.position.copy(link.glowPosition);
                glow.renderOrder = 38;
                glow.userData = { type: 'twist-glow', key: crossing.key };
                this.highlightGroup.add(glow);
            }
        }
    }

    clearTwistCrossingHints() {
        const remove = this.highlightGroup.children.filter((child) => child.userData?.type === 'twist-glow');
        for (const child of remove) this.highlightGroup.remove(child);

        for (const link of this.twistLinks.values()) {
            link.line.material.color.copy(link.lineColor);
            link.line.material.opacity = link.lineOpacity;
            link.arrow.material.color.copy(link.arrowColor);
            link.arrow.material.emissive.copy(link.arrowEmissive);
            link.arrow.material.emissiveIntensity = link.arrowEmissiveIntensity;
        }
    }

    createCellGeometry(x, y, lift = 0, inset = 0.026, sheet = 0) {
        const u0 = ((y + inset) / BOARD_HEIGHT) * TWO_PI;
        const u1 = ((y + 1 - inset) / BOARD_HEIGHT) * TWO_PI;
        const t0 = this.tForX(x + inset);
        const t1 = this.tForX(x + 1 - inset);
        return this.createMobiusPatchGeometry(u0, u1, t0, t1, 8, 6, lift, sheet);
    }

    createMobiusPatchGeometry(u0, u1, t0, t1, uSegments, tSegments, lift = 0, sheet = 0) {
        const vertices = [];
        const indices = [];

        for (let iu = 0; iu <= uSegments; iu++) {
            const u = THREE.MathUtils.lerp(u0, u1, iu / uSegments);
            for (let it = 0; it <= tSegments; it++) {
                const t = THREE.MathUtils.lerp(t0, t1, it / tSegments);
                const point = this.mobiusPoint(u, t, lift, sheet);
                vertices.push(point.x, point.y, point.z);
            }
        }

        const row = tSegments + 1;
        for (let iu = 0; iu < uSegments; iu++) {
            for (let it = 0; it < tSegments; it++) {
                const a = iu * row + it;
                const b = (iu + 1) * row + it;
                const c = (iu + 1) * row + it + 1;
                const d = iu * row + it + 1;
                indices.push(a, b, d, b, c, d);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    getCellPose(x, y, lift = 0, sheet = 0) {
        const u = ((y + 0.5) / BOARD_HEIGHT) * TWO_PI;
        const t = this.tForX(x + 0.5);
        const basis = this.mobiusBasis(u, t, sheet);
        const position = this.mobiusPoint(u, t, lift, sheet);
        return {
            position,
            normal: basis.normal,
            tangentU: basis.tangentT,
            tangentV: basis.tangentU
        };
    }

    edgePoint(side, x, sheet = 0, lift = 0.18) {
        const u = side === 'top' ? 0 : TWO_PI;
        const t = this.tForX(x + 0.5);
        return this.mobiusPoint(u, t, lift, sheet);
    }

    tForX(value) {
        return THREE.MathUtils.lerp(-this.bandHalfWidth, this.bandHalfWidth, value / BOARD_WIDTH);
    }

    mobiusPoint(u, t, lift = 0, sheet = 0) {
        const basis = this.mobiusBasis(u, t, sheet);
        const radial = this.bandRadius + t * Math.cos(u / 2);
        const base = new THREE.Vector3(
            radial * Math.cos(u),
            t * Math.sin(u / 2),
            radial * Math.sin(u)
        );
        return base.add(basis.normal.clone().multiplyScalar(this.surfaceLift + lift));
    }

    mobiusBasis(u, t, sheet = 0) {
        const sinU = Math.sin(u);
        const cosU = Math.cos(u);
        const sinHalf = Math.sin(u / 2);
        const cosHalf = Math.cos(u / 2);
        const radial = this.bandRadius + t * cosHalf;

        const tangentU = new THREE.Vector3(
            -0.5 * t * sinHalf * cosU - radial * sinU,
            0.5 * t * cosHalf,
            -0.5 * t * sinHalf * sinU + radial * cosU
        ).normalize();
        const tangentT = new THREE.Vector3(cosHalf * cosU, sinHalf, cosHalf * sinU).normalize();
        const normal = new THREE.Vector3().crossVectors(tangentT, tangentU).normalize();
        if (Number(sheet) === 1) normal.multiplyScalar(-1);

        return { tangentU, tangentT, normal };
    }

    homeCameraPosition() {
        const base = this.game.currentPlayer === 'black'
            ? new THREE.Vector3(-6.2, 5.2, -7.2)
            : new THREE.Vector3(6.2, 5.2, 7.2);
        if (this.camera?.aspect < 0.72) base.setLength(14);
        return base;
    }
}
