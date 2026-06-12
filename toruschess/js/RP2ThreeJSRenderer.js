import * as THREE from 'three';
import { TorusThreeJSRenderer } from './TorusThreeJSRenderer.js';
import {
    RP2_BOARD_HEIGHT,
    RP2_BOARD_WIDTH,
    RP2_HOME_ROWS,
    RP2_PAWN_DIR
} from './RP2Config.js';

export class RP2ThreeJSRenderer extends TorusThreeJSRenderer {
    constructor(game) {
        super(game);
        this.cellSize = 0.72;
        this.cellGap = 0.035;
        this.edgeGap = 0.58;
        this.boardLift = 0.03;
        this.pieceLift = 0.18;
        this.sheetRise = 1.05;
        this.sheetSpread = 3.25;
        this.boundaryLinks = new Map();
    }

    init3D() {
        super.init3D();
        this.resetCamera();
    }

    createBoard3D() {
        this.boardGroup.clear();
        this.boundaryLinks.clear();

        this.addSheetBase(0);
        this.addSheetBase(1);

        for (const { x, y, sheet } of this.game.validCells()) {
            const cell = new THREE.Mesh(
                this.createCellGeometry(sheet),
                this.materialForCell(x, y, sheet)
            );
            cell.position.copy(this.getCellPose(x, y, 0, sheet).position);
            cell.castShadow = true;
            cell.receiveShadow = true;
            cell.userData = { type: 'cell', x, y, sheet };
            this.boardGroup.add(cell);
        }

        this.addBoundaryRails();
        this.addGlueLinks();
        this.addWindingGuides();
    }

    addSheetBase(sheet) {
        const width = this.boardSpanX();
        const height = this.boardSpanZ();
        const center = this.sheetOffset(sheet);
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.18, 0.055, height + 0.18),
            new THREE.MeshStandardMaterial({
                color: 0x31434c,
                metalness: 0.08,
                roughness: 0.48,
                transparent: false,
                opacity: 1
            })
        );
        base.position.set(center.x, center.y - 0.045, center.z);
        base.receiveShadow = true;
        base.userData = { type: 'sheet-base', sheet };
        this.boardGroup.add(base);
    }

    materialForCell(x, y, sheet = 0) {
        return (x + y) % 2 === 0 ? this.materials.light : this.materials.dark;
    }

    addBoundaryRails() {
        const lrMaterial = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0ea5e9,
            emissiveIntensity: 0.2,
            roughness: 0.32
        });
        const tbMaterial = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.22,
            roughness: 0.36
        });

        for (const sheet of [0, 1]) {
            for (let y = 0; y < this.boardHeight(); y++) {
                for (const side of ['left', 'right']) {
                    const rail = new THREE.Mesh(
                        new THREE.BoxGeometry(0.12, 0.08, this.cellSize * 0.74),
                        lrMaterial
                    );
                    rail.position.copy(this.edgePoint(side, y, sheet, 0.04));
                    rail.castShadow = true;
                    rail.userData = { type: 'edge-rail', sheet, side, index: y };
                    this.boardGroup.add(rail);
                }
            }

            for (let x = 0; x < this.boardWidth(); x++) {
                for (const side of ['top', 'bottom']) {
                    const rail = new THREE.Mesh(
                        new THREE.BoxGeometry(this.cellSize * 0.74, 0.08, 0.12),
                        tbMaterial
                    );
                    rail.position.copy(this.edgePoint(side, x, sheet, 0.04));
                    rail.castShadow = true;
                    rail.userData = { type: 'edge-rail', sheet, side, index: x };
                    this.boardGroup.add(rail);
                }
            }
        }
    }

    addGlueLinks() {
        for (const sheet of [0, 1]) {
            for (let y = 0; y < this.boardHeight(); y++) {
                this.addBoundaryLink(sheet, 'left', y);
                this.addBoundaryLink(sheet, 'right', y);
            }

            for (let x = 0; x < this.boardWidth(); x++) {
                this.addBoundaryLink(sheet, 'top', x);
                this.addBoundaryLink(sheet, 'bottom', x);
            }
        }
    }

    addBoundaryLink(fromSheet, side, index) {
        const toSheet = 1 - fromSheet;
        const toSide = this.oppositeSide(side);
        const horizontal = side === 'left' || side === 'right';
        const reversedIndex = horizontal
            ? this.boardHeight() - 1 - index
            : this.boardWidth() - 1 - index;
        const start = this.edgePoint(side, index, fromSheet, 0.18);
        const end = this.edgePoint(toSide, reversedIndex, toSheet, 0.2);
        const midpoint = start.clone().add(end).multiplyScalar(0.5);
        const control = midpoint.clone();
        const maxIndex = horizontal ? this.boardHeight() - 1 : this.boardWidth() - 1;
        control.y += 1.2 + Math.abs(index - maxIndex / 2) * 0.04;
        const lineMaterial = new THREE.LineBasicMaterial({
            color: horizontal ? 0x67e8f9 : 0xfbbf24,
            transparent: true,
            opacity: 0.62,
            depthWrite: false
        });
        const arrowMaterial = new THREE.MeshStandardMaterial({
            color: horizontal ? 0x67e8f9 : 0xfbbf24,
            emissive: horizontal ? 0x0891b2 : 0xf59e0b,
            emissiveIntensity: 0.26,
            roughness: 0.32
        });
        const key = this.game.boundaryCrossingKey(fromSheet, side, index);
        const line = this.createLinkCurve(start, control, end, lineMaterial, key);
        const arrow = this.createArrowAt(end, end.clone().sub(control), arrowMaterial, key);

        this.boundaryLinks.set(key, {
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
        line.userData = { type: 'glue-link', key };
        line.renderOrder = 18;
        return line;
    }

    createArrowAt(position, direction, material, key = '') {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 16), material);
        const tangent = direction.clone().normalize();
        cone.position.copy(position).add(tangent.clone().multiplyScalar(-0.08));
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
        cone.userData = { type: 'glue-arrow', key };
        return cone;
    }

    addWindingGuides() {
        const guideMaterial = {
            white: new THREE.MeshStandardMaterial({
                color: 0x7dd3fc,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.36,
                roughness: 0.28
            }),
            black: new THREE.MeshStandardMaterial({
                color: 0xf4a261,
                emissive: 0xf59e0b,
                emissiveIntensity: 0.32,
                roughness: 0.32
            })
        };
        const cone = new THREE.ConeGeometry(0.06, 0.2, 18);
        const yAxis = new THREE.Vector3(0, 1, 0);
        const centralGuideFiles = this.sampleValues(this.centralPieceFiles(), 4);

        for (const color of ['white', 'black']) {
            const row = this.homeRow(color);
            const direction = this.pawnDirection(color);
            for (const x of centralGuideFiles) {
                const pose = this.getCellPose(x, row, 0.24, 0);
                const tangent = pose.tangentV.clone().multiplyScalar(direction).normalize();
                const arrow = new THREE.Mesh(cone, guideMaterial[color]);
                arrow.position.copy(pose.position).add(tangent.clone().multiplyScalar(0.18));
                arrow.quaternion.setFromUnitVectors(yAxis, tangent);
                arrow.castShadow = true;
                arrow.userData = { type: 'guide', sheet: 0 };
                this.boardGroup.add(arrow);
            }
        }

        const boundaryRows = { white: 0, black: this.boardHeight() - 1 };
        const boundaryGuideFiles = this.sampleIndices(this.boardWidth(), 4);
        for (const color of ['white', 'black']) {
            const row = boundaryRows[color];
            const direction = this.pawnDirection(color);
            for (const x of boundaryGuideFiles) {
                const pose = this.getCellPose(x, row, 0.24, 1);
                const tangent = pose.tangentV.clone().multiplyScalar(direction).normalize();
                const arrow = new THREE.Mesh(cone, guideMaterial[color]);
                arrow.position.copy(pose.position).add(tangent.clone().multiplyScalar(0.16));
                arrow.quaternion.setFromUnitVectors(yAxis, tangent);
                arrow.castShadow = true;
                arrow.userData = { type: 'guide', sheet: 1 };
                this.boardGroup.add(arrow);
            }
        }
    }

    addBoardLabels() {
        this.labelGroup.clear();

        const centerX = Math.floor(this.boardWidth() / 2);
        const centerY = Math.floor(this.boardHeight() / 2);
        const boundary = this.createTextSprite('RP2', 0x86efac, 54);
        boundary.position.copy(this.getCellPose(centerX, centerY, 0.42, 1).position);
        boundary.scale.set(0.34, 0.34, 0.34);
        this.labelGroup.add(boundary);

        for (let x = 0; x < this.boardWidth(); x++) {
            const xLabel = this.createTextSprite(String(x), 0xc9d7df, 52);
            xLabel.position.copy(this.bottomEdgePoint(x, 0.36, 0));
            xLabel.scale.set(0.28, 0.28, 0.28);
            this.labelGroup.add(xLabel);
        }

        for (let y = 0; y < this.boardHeight(); y++) {
            const yLabel = this.createTextSprite(String(y), 0xc9d7df, 52);
            yLabel.position.copy(this.leftEdgePoint(y, 0.36, 0));
            yLabel.scale.set(0.28, 0.28, 0.28);
            this.labelGroup.add(yLabel);
        }
    }

    showLegalMoves(moves) {
        super.showLegalMoves(moves);
        if (this.game.showMoveHints) this.showBoundaryCrossingHints(moves);
    }

    clearLegalMoveHints() {
        super.clearLegalMoveHints();
        this.clearBoundaryCrossingHints();
    }

    showBoundaryCrossingHints(moves) {
        this.clearBoundaryCrossingHints();
        const seen = new Set();
        const material = new THREE.MeshBasicMaterial({
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
                const link = this.boundaryLinks.get(crossing.key);
                if (!link) continue;

                link.line.material.color.set(0x22c55e);
                link.line.material.opacity = 0.96;
                link.arrow.material.color.set(0x22c55e);
                link.arrow.material.emissive.set(0x22c55e);
                link.arrow.material.emissiveIntensity = 0.9;

                const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), material);
                glow.position.copy(link.glowPosition);
                glow.renderOrder = 38;
                glow.userData = { type: 'boundary-glow', key: crossing.key };
                this.highlightGroup.add(glow);
            }
        }
    }

    clearBoundaryCrossingHints() {
        const remove = this.highlightGroup.children.filter((child) => child.userData?.type === 'boundary-glow');
        for (const child of remove) this.highlightGroup.remove(child);

        for (const link of this.boundaryLinks.values()) {
            link.line.material.color.copy(link.lineColor);
            link.line.material.opacity = link.lineOpacity;
            link.arrow.material.color.copy(link.arrowColor);
            link.arrow.material.emissive.copy(link.arrowEmissive);
            link.arrow.material.emissiveIntensity = link.arrowEmissiveIntensity;
        }
    }

    createCellOverlay(x, y, sheetOrColor, colorOrOpacity, opacityOrType, maybeType) {
        const hasSheetArgument = maybeType !== undefined;
        const sheet = hasSheetArgument ? sheetOrColor : 0;
        const color = hasSheetArgument ? colorOrOpacity : sheetOrColor;
        const opacity = hasSheetArgument ? opacityOrType : colorOrOpacity;
        const type = hasSheetArgument ? maybeType : opacityOrType;
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(this.cellSize * 1.08, 0.035, this.cellSize * 1.08),
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity,
                depthTest: false,
                depthWrite: false
            })
        );
        mesh.position.copy(this.getCellPose(x, y, 0.075, sheet).position);
        mesh.renderOrder = type === 'selection' ? 22 : 26;
        mesh.userData = { type, x, y, sheet };
        return mesh;
    }

    createCellGeometry(sheet = 0) {
        if (sheet === 1) return new THREE.BoxGeometry(this.cellSize * 0.86, 0.06, this.cellSize * 0.86);
        return new THREE.BoxGeometry(this.cellSize, 0.06, this.cellSize);
    }

    getCellPose(x, y, lift = 0, sheet = 0) {
        const offset = this.sheetOffset(sheet);
        return {
            position: new THREE.Vector3(this.cellX(x) + offset.x, this.boardLift + lift + offset.y, this.cellZ(y) + offset.z),
            normal: new THREE.Vector3(0, 1, 0),
            tangentU: new THREE.Vector3(1, 0, 0),
            tangentV: new THREE.Vector3(0, 0, 1)
        };
    }

    sheetOffset(sheet = 0) {
        const spread = this.sheetSeparation();
        return Number(sheet) === 1
            ? new THREE.Vector3(0, this.sheetRise, -spread * 0.5)
            : new THREE.Vector3(0, 0, spread * 0.5);
    }

    boardWidth() {
        return this.game?.boardWidth?.() ?? RP2_BOARD_WIDTH;
    }

    boardHeight() {
        return this.game?.boardHeight?.() ?? RP2_BOARD_HEIGHT;
    }

    homeRow(color) {
        return this.game?.homeRow?.(color) ?? RP2_HOME_ROWS[color];
    }

    pawnDirection(color) {
        return this.game?.pawnDirection?.(color) ?? RP2_PAWN_DIR[color];
    }

    centralPieceFiles() {
        return this.game?.centralPieceFiles?.() ?? this.sampleIndices(this.boardWidth(), 4);
    }

    sampleIndices(count, targetCount) {
        return this.sampleValues(Array.from({ length: count }, (_, index) => index), targetCount);
    }

    sampleValues(values, targetCount) {
        if (values.length <= targetCount) return values;
        const sampled = new Set();
        for (let i = 0; i < targetCount; i++) {
            const index = Math.round((i * (values.length - 1)) / (targetCount - 1));
            sampled.add(values[index]);
        }
        return [...sampled];
    }

    sheetSeparation() {
        return Math.max(this.sheetSpread, this.boardSpanZ() * 0.54);
    }

    boardStep() {
        return this.cellSize + this.cellGap;
    }

    boardSpan() {
        return this.boardSpanX();
    }

    boardSpanX() {
        return this.boardWidth() * this.cellSize + (this.boardWidth() - 1) * this.cellGap;
    }

    boardSpanZ() {
        return this.boardHeight() * this.cellSize + (this.boardHeight() - 1) * this.cellGap;
    }

    cellX(x) {
        return (x - (this.boardWidth() - 1) / 2) * this.boardStep();
    }

    cellZ(y) {
        return (y - (this.boardHeight() - 1) / 2) * this.boardStep();
    }

    boardLeft() {
        return this.cellX(0) - this.cellSize / 2;
    }

    boardRight() {
        return this.cellX(this.boardWidth() - 1) + this.cellSize / 2;
    }

    boardTop() {
        return this.cellZ(0) - this.cellSize / 2;
    }

    boardBottom() {
        return this.cellZ(this.boardHeight() - 1) + this.cellSize / 2;
    }

    edgePoint(side, index, sheet = 0, lift = 0.12) {
        switch (side) {
            case 'left':
                return this.leftEdgePoint(index, lift, sheet);
            case 'right':
                return this.rightEdgePoint(index, lift, sheet);
            case 'top':
                return this.topEdgePoint(index, lift, sheet);
            case 'bottom':
                return this.bottomEdgePoint(index, lift, sheet);
            default:
                return this.getCellPose(0, 0, lift, sheet).position;
        }
    }

    oppositeSide(side) {
        return {
            left: 'right',
            right: 'left',
            top: 'bottom',
            bottom: 'top'
        }[side] || side;
    }

    leftEdgePoint(y, lift = 0.12, sheet = 0) {
        const offset = this.sheetOffset(sheet);
        return new THREE.Vector3(this.boardLeft() - this.edgeGap + offset.x, this.boardLift + lift + offset.y, this.cellZ(y) + offset.z);
    }

    rightEdgePoint(y, lift = 0.12, sheet = 0) {
        const offset = this.sheetOffset(sheet);
        return new THREE.Vector3(this.boardRight() + this.edgeGap + offset.x, this.boardLift + lift + offset.y, this.cellZ(y) + offset.z);
    }

    topEdgePoint(x, lift = 0.12, sheet = 0) {
        const offset = this.sheetOffset(sheet);
        return new THREE.Vector3(this.cellX(x) + offset.x, this.boardLift + lift + offset.y, this.boardTop() - this.edgeGap + offset.z);
    }

    bottomEdgePoint(x, lift = 0.12, sheet = 0) {
        const offset = this.sheetOffset(sheet);
        return new THREE.Vector3(this.cellX(x) + offset.x, this.boardLift + lift + offset.y, this.boardBottom() + this.edgeGap + offset.z);
    }

    resetCamera() {
        this.camera.position.copy(this.homeCameraPosition());
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    homeCameraPosition() {
        const base = this.game.currentPlayer === 'black'
            ? new THREE.Vector3(-5.8, 7.3, -7.4)
            : new THREE.Vector3(5.8, 7.3, 7.4);
        if (this.camera?.aspect < 0.72) base.setLength(14.2);
        return base;
    }
}
