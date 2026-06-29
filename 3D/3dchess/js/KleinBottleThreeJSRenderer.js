import * as THREE from 'three';
import { RP2ThreeJSRenderer } from './RP2ThreeJSRenderer.js';
import {
    createKleinBottleGridLines,
    createKleinBottleSurfaceGeometry,
    kleinBottleBasis,
    kleinBottlePoint,
    kleinBottlePose
} from '../../../js/geometry/KleinBottleGeometry.js';

const LEFT_RIGHT_COLOR = 0xa5f3fc;
const TOP_BOTTOM_COLOR = 0xfde68a;
const TWO_PI = Math.PI * 2;

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

    createBoard3D() {
        this.boardGroup.clear();
        this.boundaryLinks.clear();

        const surface = new THREE.Mesh(
            createKleinBottleSurfaceGeometry({ uSegments: 240, vSegments: 100, lift: 0 }),
            new THREE.MeshPhysicalMaterial({
                color: 0xdfe7e4,
                roughness: 0.52,
                metalness: 0.01,
                transparent: true,
                opacity: 0.56,
                depthWrite: false,
                clearcoat: 0.16,
                clearcoatRoughness: 0.48,
                side: THREE.DoubleSide
            })
        );
        surface.receiveShadow = true;
        surface.userData = { type: 'surface' };
        this.boardGroup.add(surface);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x64747c,
            transparent: true,
            opacity: 0.46,
            depthTest: true,
            depthWrite: false
        });
        for (const points of createKleinBottleGridLines({
            uSteps: this.boardHeight(),
            vSteps: this.boardWidth(),
            lift: 0.15,
            uSegments: 180,
            vSegments: 140
        })) {
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial);
            line.renderOrder = 4;
            this.boardGroup.add(line);
        }

        for (const { x, y, sheet } of this.game.validCells()) {
            const cell = new THREE.Mesh(
                this.createKleinCellGeometry(x, y, 0.065, 0.026),
                this.materialForCell(x, y, sheet)
            );
            cell.castShadow = true;
            cell.receiveShadow = true;
            cell.renderOrder = 2;
            cell.userData = { type: 'cell', x, y, sheet };
            this.boardGroup.add(cell);
        }
    }

    createCellOverlay(x, y, sheet, color, opacity, type) {
        const mesh = new THREE.Mesh(
            this.createKleinCellGeometry(x, y, 0.12, 0.04),
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity,
                side: THREE.DoubleSide,
                depthTest: false,
                depthWrite: false
            })
        );
        mesh.renderOrder = type === 'selection' ? 22 : 26;
        mesh.userData = { type, x, y, sheet };
        return mesh;
    }

    createKleinCellGeometry(x, y, lift = 0.05, inset = 0.02, uSegments = 4, vSegments = 4) {
        const width = this.boardWidth();
        const height = this.boardHeight();
        const u0 = ((y + inset) / height) * TWO_PI;
        const u1 = ((y + 1 - inset) / height) * TWO_PI;
        const v0 = ((x + inset) / width) * TWO_PI - Math.PI / 2;
        const v1 = ((x + 1 - inset) / width) * TWO_PI - Math.PI / 2;
        const vertices = [];
        const indices = [];

        for (let iu = 0; iu <= uSegments; iu += 1) {
            const u = THREE.MathUtils.lerp(u0, u1, iu / uSegments);
            for (let iv = 0; iv <= vSegments; iv += 1) {
                const v = THREE.MathUtils.lerp(v0, v1, iv / vSegments);
                const point = kleinBottlePoint(u, v, -Math.abs(lift));
                vertices.push(point.x, point.y, point.z);
            }
        }

        const row = vSegments + 1;
        for (let iu = 0; iu < uSegments; iu += 1) {
            for (let iv = 0; iv < vSegments; iv += 1) {
                const a = iu * row + iv;
                const b = (iu + 1) * row + iv;
                const c = (iu + 1) * row + iv + 1;
                const d = iu * row + iv + 1;
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
        const pose = kleinBottlePose([x, y], this.boardWidth(), this.boardHeight(), -Math.abs(lift));
        const basis = kleinBottleBasis(pose.u, pose.v);
        return {
            position: pose.position,
            normal: basis.normal.multiplyScalar(-1),
            tangentU: basis.tangentV,
            tangentV: basis.tangentU
        };
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
        return this.camera?.aspect < 0.72
            ? new THREE.Vector3(8.8, 7.4, 14.4)
            : new THREE.Vector3(8.4, 5.6, 11.8);
    }
}
