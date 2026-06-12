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
        this.edgeGap = 0.86;
        this.boardLift = 0.03;
        this.pieceLift = 0.18;
        this.cageHeight = 9.4;
        this.boundaryLinks = new Map();
        this.planeSpin = {
            active: false,
            pointerId: null,
            lastX: 0,
            lastY: 0,
            totalDx: 0,
            dragged: false
        };
        this.minHemispherePolar = 0.08;
        this.maxHemispherePolar = 1.4;
        this.suppressNextClick = false;
    }

    init3D() {
        super.init3D();
        this.configureUpperHemisphereRotation();
        this.resetCamera();
    }

    addLighting() {
        super.addLighting();
        this.decorGroup.clear();
    }

    configureUpperHemisphereRotation() {
        if (!this.controls || !this.renderer?.domElement) return;

        this.controls.noRotate = true;
        this.controls.noPan = true;
        const canvas = this.renderer.domElement;
        canvas.style.touchAction = 'none';

        canvas.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            this.planeSpin.lastY = event.clientY;
            this.planeSpin.active = true;
            this.planeSpin.pointerId = event.pointerId;
            this.planeSpin.lastX = event.clientX;
            this.planeSpin.totalDx = 0;
            this.planeSpin.dragged = false;
            canvas.setPointerCapture?.(event.pointerId);
        });

        canvas.addEventListener('pointermove', (event) => {
            if (!this.planeSpin.active || event.pointerId !== this.planeSpin.pointerId) return;

            const dx = event.clientX - this.planeSpin.lastX;
            const dy = event.clientY - this.planeSpin.lastY;
            this.planeSpin.lastX = event.clientX;
            this.planeSpin.lastY = event.clientY;
            if (Math.abs(dx) + Math.abs(dy) < 0.25) return;

            this.planeSpin.totalDx += Math.abs(dx) + Math.abs(dy);
            this.orbitUpperHemisphere(-dx * 0.0065, dy * 0.0065);
            if (this.planeSpin.totalDx > 3) this.planeSpin.dragged = true;
            event.preventDefault();
        });

        const finishSpin = (event) => {
            if (!this.planeSpin.active || event.pointerId !== this.planeSpin.pointerId) return;
            if (this.planeSpin.dragged) this.suppressNextClick = true;
            this.planeSpin.active = false;
            this.planeSpin.pointerId = null;
            canvas.releasePointerCapture?.(event.pointerId);
        };

        canvas.addEventListener('pointerup', finishSpin);
        canvas.addEventListener('pointercancel', finishSpin);
    }

    orbitUpperHemisphere(azimuthDelta, polarDelta) {
        if (!this.camera || !this.controls) return;
        const target = this.controls.target || new THREE.Vector3();
        const offset = this.camera.position.clone().sub(target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta += azimuthDelta;
        spherical.phi = THREE.MathUtils.clamp(
            spherical.phi + polarDelta,
            this.minHemispherePolar,
            this.maxHemispherePolar
        );
        offset.setFromSpherical(spherical);
        this.camera.position.copy(target).add(offset);
        this.camera.up.copy(this.cameraUpForAzimuth(spherical.theta));
        this.camera.lookAt(target);
        this.controls.update();
    }

    cameraUpForAzimuth(theta) {
        return new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), theta).normalize();
    }

    async onMouseClick(event) {
        if (this.suppressNextClick) {
            this.suppressNextClick = false;
            return;
        }
        return super.onMouseClick(event);
    }

    createBoard3D() {
        this.boardGroup.clear();
        this.boundaryLinks.clear();


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
        const sheet = 0;

        for (let y = 0; y < this.boardHeight(); y++) {
            for (const side of ['left', 'right']) {
                const rail = new THREE.Mesh(
                    new THREE.BoxGeometry(0.12, 0.08, this.cellSize * 0.74),
                    lrMaterial
                );
                rail.position.copy(this.edgePoint(side, y, sheet, 0.05));
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
                rail.position.copy(this.edgePoint(side, x, sheet, 0.05));
                rail.castShadow = true;
                rail.userData = { type: 'edge-rail', sheet, side, index: x };
                this.boardGroup.add(rail);
            }
        }
    }
    addGlueLinks() {
        const sheet = 0;
        const visibleY = this.visibleBoundaryIndices(this.boardHeight());
        const visibleX = this.visibleBoundaryIndices(this.boardWidth());

        for (const y of visibleY) {
            this.addBoundaryLink(sheet, 'left', y);
        }

        for (const x of visibleX) {
            this.addBoundaryLink(sheet, 'top', x);
        }

        this.aliasMissingBoundaryKeys('left', this.boardHeight(), visibleY);
        this.aliasMissingBoundaryKeys('right', this.boardHeight(), visibleY.map((y) => this.boardHeight() - 1 - y));
        this.aliasMissingBoundaryKeys('top', this.boardWidth(), visibleX);
        this.aliasMissingBoundaryKeys('bottom', this.boardWidth(), visibleX.map((x) => this.boardWidth() - 1 - x));
    }

    visibleBoundaryIndices(count) {
        return Array.from({ length: count }, (_, index) => index);
    }

    aliasMissingBoundaryKeys(side, count, visibleIndices) {
        const visible = [...new Set(visibleIndices)]
            .filter((index) => index >= 0 && index < count)
            .sort((a, b) => a - b);

        for (let index = 0; index < count; index++) {
            const key = this.game.boundaryCrossingKey(0, side, index);
            if (this.boundaryLinks.has(key)) continue;

            const nearest = this.nearestVisibleBoundaryIndex(index, visible);
            const source = this.boundaryLinks.get(this.game.boundaryCrossingKey(0, side, nearest));
            if (source) this.boundaryLinks.set(key, { ...source, key });
        }
    }

    nearestVisibleBoundaryIndex(index, visibleIndices) {
        return visibleIndices.reduce((nearest, candidate) =>
            Math.abs(candidate - index) < Math.abs(nearest - index) ? candidate : nearest,
            visibleIndices[0]
        );
    }

    addBoundaryLink(fromSheet, side, index) {
        const toSheet = 0;
        const toSide = this.oppositeSide(side);
        const horizontal = side === 'left' || side === 'right';
        const reversedIndex = horizontal
            ? this.boardHeight() - 1 - index
            : this.boardWidth() - 1 - index;
        const start = this.edgePoint(side, index, 0, 1.68);
        const end = this.edgePoint(toSide, reversedIndex, toSheet, 1.68);
        const maxIndex = horizontal ? this.boardHeight() - 1 : this.boardWidth() - 1;
        const normalized = maxIndex === 0 ? 0 : (index / maxIndex) * 2 - 1;
        const domeAmount = Math.sqrt(Math.max(0, 1 - normalized * normalized));
        const apex = start.clone().add(end).multiplyScalar(0.5);
        apex.y = this.boardLift + 1.68 + THREE.MathUtils.lerp(this.cageHeight * 0.68, this.cageHeight, domeAmount);
        if (horizontal) {
            apex.z = normalized * this.boardSpanZ() * 0.42;
        } else {
            apex.x = normalized * this.boardSpanX() * 0.42;
        }

        const curve = new THREE.CatmullRomCurve3([start, apex, end], false, 'centripetal', 0.42);
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: horizontal ? 0xa5f3fc : 0xfde68a,
            transparent: true,
            opacity: 0.82,
            depthWrite: false,
            depthTest: true
        });
        const arrowMaterial = new THREE.MeshStandardMaterial({
            color: horizontal ? 0xa5f3fc : 0xfde68a,
            emissive: horizontal ? 0x22d3ee : 0xfbbf24,
            emissiveIntensity: 0.82,
            roughness: 0.22,
            transparent: true,
            opacity: 0.9
        });
        const key = this.game.boundaryCrossingKey(fromSheet, side, index);
        const aliasKey = this.game.boundaryCrossingKey(toSheet, toSide, reversedIndex);
        const line = this.createLinkCurve(curve, lineMaterial, key);
        const arrows = this.createEdgeArrows(curve, arrowMaterial, key);

        const sharedLink = {
            key,
            line,
            arrows,
            lineColor: lineMaterial.color.clone(),
            lineOpacity: lineMaterial.opacity,
            arrowColor: arrowMaterial.color.clone(),
            arrowOpacity: arrowMaterial.opacity,
            arrowEmissive: arrowMaterial.emissive.clone(),
            arrowEmissiveIntensity: arrowMaterial.emissiveIntensity,
            glowPosition: curve.getPoint(0.16)
        };

        this.boundaryLinks.set(key, sharedLink);
        this.boundaryLinks.set(aliasKey, {
            ...sharedLink,
            key: aliasKey,
            glowPosition: curve.getPoint(0.84)
        });
        this.boardGroup.add(line);
        for (const arrow of arrows) this.boardGroup.add(arrow);
    }

    createLinkCurve(curve, material, key = '') {
        const geometry = new THREE.TubeGeometry(curve, 56, 0.0065, 8, false);
        const line = new THREE.Mesh(geometry, material);
        line.userData = { type: 'glue-link', key };
        line.renderOrder = 12;
        return line;
    }

    createEdgeArrows(curve, material, key = '') {
        return [
            this.createArrowAt(curve.getPoint(0.14), curve.getTangent(0.14), material, key),
            this.createArrowAt(curve.getPoint(0.86), curve.getTangent(0.86), material, key)
        ];
    }

    createArrowAt(position, direction, material, key = '') {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.13, 18), material);
        const tangent = direction.clone().normalize();
        cone.position.copy(position).add(tangent.clone().multiplyScalar(-0.055));
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
    }
    addBoardLabels() {
        this.labelGroup.clear();

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
                for (const arrow of link.arrows || []) {
                    arrow.material.color.set(0x22c55e);
                    arrow.material.opacity = 0.98;
                    arrow.material.emissive.set(0x22c55e);
                    arrow.material.emissiveIntensity = 0.95;
                }

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
            for (const arrow of link.arrows || []) {
                arrow.material.color.copy(link.arrowColor);
                arrow.material.opacity = link.arrowOpacity;
                arrow.material.emissive.copy(link.arrowEmissive);
                arrow.material.emissiveIntensity = link.arrowEmissiveIntensity;
            }
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
        return new THREE.Vector3(0, 0, 0);
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
        this.camera.up.copy(this.homeCameraUp());
        this.controls.target.set(0, 0, 0);
        this.camera.lookAt(this.controls.target);
        this.controls.update();
    }

    homeCameraPosition() {
        const distance = this.camera?.aspect < 0.72 ? 18.4 : 15.8;
        return new THREE.Vector3(0, distance, 1.85);
    }

    homeCameraUp() {
        return new THREE.Vector3(0, 0, -1);
    }
}
