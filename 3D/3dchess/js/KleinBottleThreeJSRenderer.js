import * as THREE from 'three';
import { RP2ThreeJSRenderer } from './RP2ThreeJSRenderer.js';

const LEFT_RIGHT_COLOR = 0xa5f3fc;
const TOP_BOTTOM_COLOR = 0xfde68a;

export class KleinBottleThreeJSRenderer extends RP2ThreeJSRenderer {
    constructor(game) {
        super(game);
        this.cellSize = 0.58;
        this.cellGap = 0.03;
        this.edgeGap = 0.78;
        this.boardLift = 0.03;
        this.pieceLift = 0.18;
        this.cageHeight = 8.2;
        this.maxPixelRatio = 1.25;
        this.minHemispherePolar = 0.08;
        this.maxHemispherePolar = 1.32;
    }

    init3D() {
        super.init3D();
        this.controls.minDistance = 9;
        this.controls.maxDistance = 24;
        this.resetCamera();
    }

    addGlueLinks() {
        const visibleY = this.visibleBoundaryIndices(this.boardHeight());
        const visibleX = this.visibleBoundaryIndices(this.boardWidth());

        for (const y of visibleY) {
            this.addBoundaryLink(0, 'left', y);
        }

        for (const x of visibleX) {
            this.addBoundaryLink(0, 'top', x);
        }

        this.aliasMissingBoundaryKeys('left', this.boardHeight(), visibleY);
        this.aliasMissingBoundaryKeys('right', this.boardHeight(), visibleY);
        this.aliasMissingBoundaryKeys('top', this.boardWidth(), visibleX);
        this.aliasMissingBoundaryKeys('bottom', this.boardWidth(), visibleX.map((x) => this.boardWidth() - 1 - x));
    }

    addBoundaryLink(fromSheet, side, index) {
        const toSheet = 0;
        const horizontal = side === 'left' || side === 'right';
        const toSide = this.oppositeSide(side);
        const toIndex = horizontal ? index : this.boardWidth() - 1 - index;
        const start = this.edgePoint(side, index, 0, 1.38);
        const end = this.edgePoint(toSide, toIndex, toSheet, 1.38);
        const maxIndex = horizontal ? this.boardHeight() - 1 : this.boardWidth() - 1;
        const normalized = maxIndex === 0 ? 0 : (index / maxIndex) * 2 - 1;
        const domeAmount = Math.sqrt(Math.max(0, 1 - normalized * normalized));
        const apex = start.clone().add(end).multiplyScalar(0.5);

        apex.y = this.boardLift + THREE.MathUtils.lerp(this.cageHeight * 0.62, this.cageHeight, domeAmount);
        if (horizontal) {
            apex.z = normalized * this.boardSpanZ() * 0.5;
        } else {
            apex.x = normalized * this.boardSpanX() * 0.5;
        }

        const curve = new THREE.CatmullRomCurve3([start, apex, end], false, 'centripetal', 0.44);
        const color = horizontal ? LEFT_RIGHT_COLOR : TOP_BOTTOM_COLOR;
        const emissive = horizontal ? 0x22d3ee : 0xfbbf24;
        const lineMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.84,
            depthWrite: false,
            depthTest: true
        });
        const arrowMaterial = new THREE.MeshStandardMaterial({
            color,
            emissive,
            emissiveIntensity: 0.86,
            roughness: 0.2,
            transparent: true,
            opacity: 0.92
        });
        const key = this.game.boundaryCrossingKey(fromSheet, side, index);
        const aliasKey = this.game.boundaryCrossingKey(toSheet, toSide, toIndex);
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

    addBoardLabels() {
        this.labelGroup.clear();
    }

    homeCameraPosition() {
        const distance = this.camera?.aspect < 0.72 ? 19.2 : 16.2;
        return new THREE.Vector3(0, distance, 1.9);
    }
}
