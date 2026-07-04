import * as THREE from 'three';
import { installReversi3DRobot } from './robot/Reversi3DRobot.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ReversiGame, REVERSI_TOPOLOGIES, normalizeReversiSize, normalizeReversiTopology } from '../../../js/reversi/ReversiGame.js';
import { FirebaseStateNetworkManager } from '../../../js/FirebaseStateNetworkManager.js';
import { installGameUILocalizer } from '../../../js/shared/GameUILocalizer.js';
import { kagomeBounds, kagomePoint } from '../../../js/shared/KagomeLattice.js';
import {
    createKleinBottleSurfaceGeometry,
    createKleinBottleGridLines,
    kleinBottlePose
} from '../../../js/geometry/KleinBottleGeometry.js';
import {
    sphereArcPoints
} from '../../../js/geometry/SphereBoardGeometry.js';
import {
    advanceMapPieceAges,
    normalizePieceTimeConfig
} from '../../../js/time/PieceAgeClock.js';

const TWO_PI = Math.PI * 2;
const CYLINDER_RADIUS = 2.38;
const HONEYCOMB_CYLINDER_RADIUS = 2.28;
const CYLINDER_HEIGHT = 5.8;
const MOBIUS_BAND_RADIUS = 4.05;
const MOBIUS_BAND_HALF_WIDTH = 2.72;
const KLEIN_RENDER_SCALE = 1.42;
const SQUARE_LATTICE = 'square';
const HCP_LATTICE = 'hcp';
const HONEYCOMB_LATTICE = 'honeycomb';
const KAGOME_LATTICE = 'kagome';
const SPHERE_COORDINATE_LATTICE = 'sphere_coordinate';
const R3_LIKE_TOPOLOGIES = new Set([
    REVERSI_TOPOLOGIES.R3,
    REVERSI_TOPOLOGIES.T3,
    REVERSI_TOPOLOGIES.R3_RANDOM,
    REVERSI_TOPOLOGIES.RP3
]);

function isR3LikeTopology(topology) {
    return R3_LIKE_TOPOLOGIES.has(topology);
}

class Reversi3DRenderer {
    constructor(app) {
        this.app = app;
        this.canvas = document.getElementById('reversiBoard');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b1116);
        this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 140);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.canvas.style.touchAction = 'none';
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.zoomSpeed = 0.7;
        this.controls.enablePan = false;
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 0.16;
        this.pointer = new THREE.Vector2();
        this.boardGroup = new THREE.Group();
        this.stoneGroup = new THREE.Group();
        this.markerGroup = new THREE.Group();
        this.hoverGroup = new THREE.Group();
        this.scene.add(this.boardGroup, this.stoneGroup, this.markerGroup, this.hoverGroup);
        this.focusColor = null;
        this.pointCoords = [];
        this.pointPositions = [];
        this.nodePoints = null;
        this.signature = '';
        this.sliceSignature = '';
        this.clock = new THREE.Clock();
        this.initLights();
        this.bind();
        this.resize();
        this.resetCamera();
        this.animate();
    }

    initLights() {
        this.scene.add(new THREE.AmbientLight(0xf4fbff, 0.58));
        this.scene.add(new THREE.HemisphereLight(0xf0fbff, 0x20180f, 1.95));
        const key = new THREE.DirectionalLight(0xffffff, 2.7);
        key.position.set(6, 9, 7);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        this.scene.add(key);
        const fill = new THREE.PointLight(0x7dd3fc, 1.75, 36);
        fill.position.set(-6, 3, -5);
        this.scene.add(fill);
    }

    bind() {
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('pointermove', (event) => this.handlePointerMove(event));
        this.canvas.addEventListener('pointerleave', () => this.setHover(null));
        this.canvas.addEventListener('click', (event) => this.handleClick(event));
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const width = Math.max(320, rect.width);
        const height = Math.max(360, rect.height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    clearGroup(group) {
        while (group.children.length) {
            const child = group.children.pop();
            child.geometry?.dispose?.();
            if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.());
            else child.material?.dispose?.();
        }
    }

    renderGame(logic) {
        this.buildBoard(logic);
        this.renderStones(logic);
        this.renderLegalMoves(logic);
        this.setHover(this.app.hoverCoord, logic);
    }

    buildBoard(logic) {
        const topology = logic.topology;
        const visualLattice = topology.topology === REVERSI_TOPOLOGIES.SPHERE
            ? this.app.currentLattice()
            : topology.lattice;
        const signature = [
            topology.topology,
            visualLattice,
            topology.width,
            topology.height,
            topology.depth,
            this.app?.surfaceViewMode?.() || '3d',
            this.app?.r3SliceSignature?.() || ''
        ].join(':');
        if (signature === this.signature) return;
        this.signature = signature;
        this.clearGroup(this.boardGroup);
        this.clearGroup(this.markerGroup);
        this.clearGroup(this.hoverGroup);
        this.pointCoords = [];
        this.pointPositions = [];
        this.nodePoints = null;

        if (isR3LikeTopology(topology.topology)) this.buildR3(topology);
        else if (topology.topology === REVERSI_TOPOLOGIES.T2 && topology.lattice === HONEYCOMB_LATTICE && this.app?.surfaceViewMode?.() === 'cut2d') this.buildHoneycombCutView(topology.width, topology.height);
        else if (topology.topology === REVERSI_TOPOLOGIES.T2) this.buildTorus(topology.width, topology.height, topology.lattice);
        else if (topology.topology === REVERSI_TOPOLOGIES.CYLINDER) this.buildCylinder(topology.width, topology.height, topology.lattice);
        else if (topology.topology === REVERSI_TOPOLOGIES.MOBIUS) this.buildMobius(topology.width, topology.height);
        else if (topology.topology === REVERSI_TOPOLOGIES.KLEIN) this.buildKlein(topology);
        else if (topology.topology === REVERSI_TOPOLOGIES.RP2) {
            this.buildFlatNonOrientable(topology.width, topology.height, topology.topology);
        }
        else this.buildSphere(topology.width, topology.height);
        const flatCut = topology.topology === REVERSI_TOPOLOGIES.T2 && topology.lattice === HONEYCOMB_LATTICE && this.app?.surfaceViewMode?.() === 'cut2d';
        this.controls.enableRotate = !flatCut;
        this.controls.minPolarAngle = topology.topology === REVERSI_TOPOLOGIES.CYLINDER ? Math.PI / 2 : 0;
        this.controls.maxPolarAngle = topology.topology === REVERSI_TOPOLOGIES.CYLINDER ? Math.PI / 2 : Math.PI;

        this.resetCamera();
    }

    coordVisible(coord) {
        return this.app?.coordVisibleInSlice?.(coord) !== false;
    }

    honeycombCutCenter(coord, width, height) {
        const root3 = Math.sqrt(3);
        const rawX = 1.5 * Number(coord?.[0] || 0);
        const rawY = root3 * (Number(coord?.[1] || 0) + (Number(coord?.[0] || 0) % 2) * 0.5);
        const boardW = Math.max(1, 1.5 * Math.max(1, width - 1));
        const boardH = Math.max(1, root3 * Math.max(1, height - 0.5));
        const scale = Math.min(8.2 / boardW, 5.9 / boardH);
        return new THREE.Vector3((rawX - boardW / 2) * scale, (boardH / 2 - rawY) * scale, 0);
    }

    honeycombCutPose(coord, width, height, lift = 0.08) {
        return {
            position: this.honeycombCutCenter(coord, width, height).add(new THREE.Vector3(0, 0, lift)),
            normal: new THREE.Vector3(0, 0, 1)
        };
    }

    buildHoneycombCutView(width, height) {
        const linePositions = [];
        const radius = 0.48;
        const pushLine = (a, b) => linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const center = this.honeycombCutCenter([x, y], width, height);
                const vertices = Array.from({ length: 6 }, (_, index) => {
                    const angle = index * Math.PI / 3;
                    return new THREE.Vector3(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius, 0);
                });
                for (let index = 0; index < 6; index += 1) pushLine(vertices[index], vertices[(index + 1) % 6]);
            }
        }
        const gridGeometry = new THREE.BufferGeometry();
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            gridGeometry,
            new THREE.LineBasicMaterial({ color: 0x5a3518, transparent: true, opacity: 0.96 })
        ));
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(9.2, 6.6),
            new THREE.MeshBasicMaterial({ color: 0xd29a53, transparent: true, opacity: 0.82, side: THREE.DoubleSide })
        );
        plane.position.z = -0.02;
        this.boardGroup.add(plane);
        const pointPositions = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const coord = [x, y];
                const position = this.honeycombCutPose(coord, width, height, 0.04).position;
                this.pointCoords.push(coord);
                this.pointPositions.push(position);
                pointPositions.push(position.x, position.y, position.z);
            }
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.046 : 0.034, { color: 0x6b421d, opacity: 0.9 });
    }

    buildR3(topology) {
        const { width, height, depth } = topology;
        const linePositions = [];
        const addSegment = (a, b) => linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        const drawn = new Set();
        const visualDirections = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        for (const coord of topology.allCoords()) {
            if (!this.coordVisible(coord)) continue;
            for (const direction of visualDirections) {
                const next = topology.step(coord, direction);
                if (!next || !this.coordVisible(next)) continue;
                const manhattan = coord.reduce((sum, value, axis) => sum + Math.abs((next[axis] || 0) - value), 0);
                if (manhattan !== 1) continue;
                const edgeKey = [coord.join(','), next.join(',')].sort().join('|');
                if (drawn.has(edgeKey)) continue;
                drawn.add(edgeKey);
                addSegment(this.r3Position(coord, topology), this.r3Position(next, topology));
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.3, depthWrite: false })
        ));

        const pointPositions = [];
        for (let z = 0; z < depth; z += 1) {
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    const coord = [x, y, z];
                    if (!this.coordVisible(coord)) continue;
                    const p = this.r3Position(coord, topology);
                    this.pointCoords.push(coord);
                    this.pointPositions.push(p);
                    pointPositions.push(p.x, p.y, p.z);
                }
            }
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.068 : width <= 13 ? 0.052 : 0.038, {
            color: 0xdff8ff,
            opacity: 0.88
        });
        const axes = new THREE.AxesHelper(this.r3Scale(topology) * Math.max(width, height, depth) * 0.62);
        axes.material.depthTest = false;
        axes.renderOrder = 3;
        this.boardGroup.add(axes);
    }

    buildTorus(width, height, lattice = 'square') {
        const honeycombProfile = lattice === HONEYCOMB_LATTICE;
        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(honeycombProfile ? 3.0 : 3.35, honeycombProfile ? 1.0 : 1.22, 64, 192),
            new THREE.MeshPhysicalMaterial({
                color: 0xb67b45,
                roughness: 0.52,
                metalness: 0.03,
                clearcoat: 0.32,
                clearcoatRoughness: 0.46
            })
        );
        torus.castShadow = true;
        torus.receiveShadow = true;
        torus.userData.surfacePickOccluder = true;
        this.boardGroup.add(torus);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x3d2718,
            transparent: true,
            opacity: 0.84,
            depthWrite: false,
            depthTest: true
        });
        if (lattice === HONEYCOMB_LATTICE) {
            const linePositions = this.surfaceHoneycombFacePositions(width, height, lattice, 'torus', 0.15);
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            const gridLines = new THREE.LineSegments(geometry, gridMaterial);
            gridLines.renderOrder = 6;
            this.boardGroup.add(gridLines);
        } else if (lattice === KAGOME_LATTICE) {
            const linePositions = [];
            const drawn = new Set();
            for (const coord of this.app.logic.topology.allCoords()) {
                const fromKey = this.app.logic.key(coord);
                for (const direction of this.app.logic.topology.directionsFor(coord)) {
                    const neighbor = this.app.logic.topology.step(coord, direction);
                    if (!neighbor) continue;
                    const edgeKey = [fromKey, this.app.logic.key(neighbor)].sort().join('|');
                    if (drawn.has(edgeKey)) continue;
                    drawn.add(edgeKey);
                    this.appendPolyline(linePositions, this.torusSurfaceEdgePoints(coord, neighbor, width, height, lattice, 0.045));
                }
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            this.boardGroup.add(new THREE.LineSegments(geometry, gridMaterial));
        } else {
            for (let y = 0; y < height; y += 1) this.boardGroup.add(this.torusLine(width, height, 'x', y, gridMaterial, lattice));
            for (let x = 0; x < width; x += 1) this.boardGroup.add(this.torusLine(width, height, 'y', x, gridMaterial, lattice));
        }

        const pointPositions = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const coord = [x, y];
                const p = this.positionForCoord(coord, this.app.logic, 0.07);
                this.pointCoords.push(coord);
                this.pointPositions.push(p);
                pointPositions.push(p.x, p.y, p.z);
            }
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.062 : width <= 13 ? 0.05 : 0.038, {
            color: 0x24130b,
            opacity: 0.96
        });
    }

    buildCylinder(width, height, lattice = 'square') {
        const surfaceRadius = lattice === HONEYCOMB_LATTICE
            ? HONEYCOMB_CYLINDER_RADIUS
            : CYLINDER_RADIUS;
        const surface = new THREE.Mesh(
            new THREE.CylinderGeometry(surfaceRadius, surfaceRadius, CYLINDER_HEIGHT, 128, 1, true),
            new THREE.MeshPhysicalMaterial({
                color: 0x6f8e56,
                roughness: 0.58,
                metalness: 0.02,
                transparent: true,
                opacity: 0.94,
                depthWrite: true,
                clearcoat: 0.24,
                clearcoatRoughness: 0.5,
                side: THREE.DoubleSide
            })
        );
        surface.castShadow = true;
        surface.receiveShadow = true;
        surface.userData.surfacePickOccluder = true;
        this.boardGroup.add(surface);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0xdde8a7,
            transparent: true,
            opacity: 0.9,
            depthWrite: false
        });
        const linePositions = [];
        if (lattice === HONEYCOMB_LATTICE) {
            linePositions.push(...this.surfaceHoneycombFacePositions(width, height, lattice, 'cylinder', 0.045));
        } else if (lattice === KAGOME_LATTICE) {
            const drawn = new Set();
            for (const coord of this.app.logic.topology.allCoords()) {
                const fromKey = this.app.logic.key(coord);
                for (const direction of this.app.logic.topology.directionsFor(coord)) {
                    const neighbor = this.app.logic.topology.step(coord, direction);
                    if (!neighbor) continue;
                    const edgeKey = [fromKey, this.app.logic.key(neighbor)].sort().join('|');
                    if (drawn.has(edgeKey)) continue;
                    drawn.add(edgeKey);
                    this.appendPolyline(linePositions, this.cylinderSurfaceEdgePoints(coord, neighbor, width, height, lattice, 0.045));
                }
            }
        } else {
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    this.appendPolyline(linePositions, this.cylinderSurfaceEdgePoints([x, y], [(x + 1) % width, y], width, height, lattice, 0.045));
                    if (y < height - 1) this.appendPolyline(linePositions, this.cylinderSurfaceEdgePoints([x, y], [x, y + 1], width, height, lattice, 0.045));
                }
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(geometry, gridMaterial));

        const pointPositions = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const coord = [x, y];
                const point = this.positionForCoord(coord, this.app.logic, 0.08);
                this.pointCoords.push(coord);
                this.pointPositions.push(point);
                pointPositions.push(point.x, point.y, point.z);
            }
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.074 : width <= 13 ? 0.056 : 0.042, {
            color: 0xf4f6c8,
            opacity: 0.96
        });
    }

    buildMobius(width, height) {
        this.addMobiusCellPanels(width, height);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x1f150b,
            transparent: true,
            opacity: 0.96,
            depthTest: false,
            depthWrite: false
        });
        const seamMaterial = new THREE.LineBasicMaterial({
            color: 0x0f0a05,
            transparent: true,
            opacity: 1,
            depthTest: false,
            depthWrite: false
        });
        const addLine = (points, material = gridMaterial) => {
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
            line.renderOrder = 2;
            this.boardGroup.add(line);
        };

        for (const points of this.mobiusCellBoundaryLines(width, height, 0.082)) {
            addLine(points, gridMaterial);
        }
        addLine(this.mobiusParameterLine(0, -MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, 0.09, 84), seamMaterial);

        const pointPositions = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const coord = [x, y];
                for (const position of this.positionsForCoord(coord, this.app.logic, 0.115)) {
                    this.pointCoords.push(coord);
                    this.pointPositions.push(position);
                    pointPositions.push(position.x, position.y, position.z);
                }
            }
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.08 : width <= 13 ? 0.058 : 0.044, {
            color: 0xffe3a3,
            opacity: 0.08,
            depthTest: true,
            renderOrder: 3
        });
    }

    isMobiusSeamEdge(a, b, width) {
        return Math.abs((a?.[0] ?? 0) - (b?.[0] ?? 0)) > 1
            || ((a?.[0] === 0 && b?.[0] === width - 1) || (b?.[0] === 0 && a?.[0] === width - 1));
    }

    mobiusGraphEdgePoints(a, b, width, height, lift = 0.05, segments = 22) {
        const points = [];
        const seam = this.isMobiusSeamEdge(a, b, width);
        if (seam) {
            const start = a[0] === width - 1 ? a : b;
            const end = start === a ? b : a;
            const u0 = (start[0] / Math.max(1, width)) * TWO_PI;
            const t = this.mobiusTForY(start[1], height);
            for (let step = 0; step <= segments; step += 1) {
                points.push(this.mobiusPoint(THREE.MathUtils.lerp(u0, TWO_PI, step / segments), t, lift));
            }
            const endT = this.mobiusTForY(end[1], height);
            const bridgeSegments = Math.max(2, Math.ceil(segments / 5));
            for (let step = 1; step <= bridgeSegments; step += 1) {
                points.push(this.mobiusPoint(0, THREE.MathUtils.lerp(-t, endT, step / bridgeSegments), lift));
            }
            return points;
        }

        if (a[1] === b[1]) {
            const start = a[0] <= b[0] ? a : b;
            const end = start === a ? b : a;
            const u0 = (start[0] / Math.max(1, width)) * TWO_PI;
            const u1 = (end[0] / Math.max(1, width)) * TWO_PI;
            const t = this.mobiusTForY(start[1], height);
            for (let step = 0; step <= segments; step += 1) {
                points.push(this.mobiusPoint(THREE.MathUtils.lerp(u0, u1, step / segments), t, lift));
            }
            return points;
        }

        if (a[0] === b[0]) {
            const start = a[1] <= b[1] ? a : b;
            const end = start === a ? b : a;
            const u = (start[0] / Math.max(1, width)) * TWO_PI;
            const t0 = this.mobiusTForY(start[1], height);
            const t1 = this.mobiusTForY(end[1], height);
            for (let step = 0; step <= segments; step += 1) {
                points.push(this.mobiusPoint(u, THREE.MathUtils.lerp(t0, t1, step / segments), lift));
            }
            return points;
        }

        points.push(this.mobiusPose(a, width, height, lift).position);
        points.push(this.mobiusPose(b, width, height, lift).position);
        return points;
    }

    addMobiusCellPanels(width, height) {
        const materialA = new THREE.MeshBasicMaterial({
            color: 0xd19a54,
            transparent: true,
            opacity: 0.62,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true
        });
        const materialB = new THREE.MeshBasicMaterial({
            color: 0xb98549,
            transparent: true,
            opacity: 0.62,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true
        });
        const uSegments = 3;
        const tSegments = 2;
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const positions = [];
                const indices = [];
                const base = [];
                const t0 = THREE.MathUtils.lerp(-MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, y / Math.max(1, height));
                const t1 = THREE.MathUtils.lerp(-MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, (y + 1) / Math.max(1, height));
                const addVertex = (u, t) => {
                    const point = this.mobiusPoint(u, t, 0);
                    positions.push(point.x, point.y, point.z);
                    return positions.length / 3 - 1;
                };
                for (let iu = 0; iu <= uSegments; iu += 1) {
                    base[iu] = [];
                    const u = ((x + iu / uSegments) / Math.max(1, width)) * TWO_PI;
                    for (let it = 0; it <= tSegments; it += 1) {
                        base[iu][it] = addVertex(u, THREE.MathUtils.lerp(t0, t1, it / tSegments));
                    }
                }
                for (let iu = 0; iu < uSegments; iu += 1) {
                    for (let it = 0; it < tSegments; it += 1) {
                        const a = base[iu][it];
                        const b = base[iu + 1][it];
                        const c = base[iu + 1][it + 1];
                        const d = base[iu][it + 1];
                        indices.push(a, b, d, b, c, d);
                    }
                }
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                geometry.setIndex(indices);
                geometry.computeVertexNormals();
                const mesh = new THREE.Mesh(geometry, (x + y) % 2 === 0 ? materialA : materialB);
                mesh.renderOrder = 1;
                this.boardGroup.add(mesh);
            }
        }
    }

    buildKlein(topology) {
        const { width, height } = topology;
        const surface = new THREE.Mesh(
            createKleinBottleSurfaceGeometry({ uSegments: 220, vSegments: 92, lift: -0.012 }),
            new THREE.MeshPhysicalMaterial({
                color: 0x8a6a39,
                roughness: 0.58,
                metalness: 0.02,
                transparent: true,
                opacity: 0.74,
                depthWrite: false,
                clearcoat: 0.24,
                clearcoatRoughness: 0.48,
                side: THREE.DoubleSide
            })
        );
        surface.scale.setScalar(KLEIN_RENDER_SCALE);
        surface.renderOrder = 2;
        surface.castShadow = false;
        surface.receiveShadow = false;
        surface.userData.kleinPickOccluder = true;
        surface.userData.surfacePickOccluder = true;
        this.boardGroup.add(surface);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x050505,
            transparent: true,
            opacity: 0.72,
            depthTest: true,
            depthWrite: false
        });
        const addLine = (points, material = gridMaterial) => {
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
            line.scale.setScalar(KLEIN_RENDER_SCALE);
            line.renderOrder = 4;
            this.boardGroup.add(line);
        };

        for (const points of createKleinBottleGridLines({
            uSteps: Math.max(8, height),
            vSteps: Math.max(8, width),
            lift: -0.057,
            uSegments: 180,
            vSegments: 160
        })) {
            addLine(points, gridMaterial);
        }

        const pointPositions = [];
        for (const coord of topology.allCoords()) {
            const pose = this.posesForCoord(coord, this.app.logic, 0.11)[0];
            this.pointCoords.push(coord);
            this.pointPositions.push(pose.position);
            pointPositions.push(pose.position.x, pose.position.y, pose.position.z);
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.035 : width <= 13 ? 0.027 : 0.022, {
            color: 0xf0fdf4,
            opacity: 0.04,
            depthTest: true,
            renderOrder: 5
        });
    }

    buildFlatNonOrientable(width, height, mode) {
        const scale = 7 / Math.max(width - 1, height - 1);
        const halfWidth = (width - 1) * scale / 2;
        const halfHeight = (height - 1) * scale / 2;
        const surface = new THREE.Mesh(
            new THREE.PlaneGeometry(halfWidth * 2 + scale * 0.8, halfHeight * 2 + scale * 0.8),
            new THREE.MeshPhysicalMaterial({
                color: 0x5d4225,
                roughness: 0.78,
                metalness: 0.01,
                clearcoat: 0.12,
                side: THREE.DoubleSide
            })
        );
        surface.position.z = -0.045;
        surface.receiveShadow = true;
        this.boardGroup.add(surface);

        const linePositions = [];
        const pointPositions = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const coord = [x, y];
                const gridPoint = this.flatPosition(coord, width, height, 0.02);
                const point = this.positionForCoord(coord, this.app.logic, 0.02);
                this.pointCoords.push(coord);
                this.pointPositions.push(point);
                pointPositions.push(point.x, point.y, point.z);
                if (x < width - 1) {
                    const next = this.flatPosition([x + 1, y], width, height, 0.02);
                    linePositions.push(gridPoint.x, gridPoint.y, gridPoint.z, next.x, next.y, next.z);
                }
                if (y < height - 1) {
                    const next = this.flatPosition([x, y + 1], width, height, 0.02);
                    linePositions.push(gridPoint.x, gridPoint.y, gridPoint.z, next.x, next.y, next.z);
                }
            }
        }
        const grid = new THREE.BufferGeometry();
        grid.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            grid,
            new THREE.LineBasicMaterial({ color: 0xe0b86d, transparent: true, opacity: 0.72 })
        ));
        this.addNodePoints(pointPositions, width <= 9 ? 0.078 : width <= 13 ? 0.058 : 0.044, {
            color: 0xffe5a8,
            opacity: 0.98
        });

        const sideMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.96 });
        const seamMaterial = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.96 });
        const margin = scale * 0.55;
        const addLine = (points, material) => this.boardGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
        const addArrow = (direction, origin, color) => this.boardGroup.add(new THREE.ArrowHelper(direction, origin, scale * 0.48, color, scale * 0.15, scale * 0.1));

        for (const side of [-1, 1]) {
            const x = side * (halfWidth + margin);
            addLine([new THREE.Vector3(x, -halfHeight, 0.04), new THREE.Vector3(x, halfHeight, 0.04)], mode === REVERSI_TOPOLOGIES.MOBIUS ? seamMaterial : sideMaterial);
            addArrow(new THREE.Vector3(side, 0, 0), new THREE.Vector3(x - side * scale * 0.25, 0, 0.05), mode === REVERSI_TOPOLOGIES.MOBIUS ? 0xfbbf24 : 0x38bdf8);
        }
        for (const side of [-1, 1]) {
            const y = side * (halfHeight + margin);
            addLine([new THREE.Vector3(-halfWidth, y, 0.04), new THREE.Vector3(halfWidth, y, 0.04)], mode === REVERSI_TOPOLOGIES.RP2 ? seamMaterial : sideMaterial);
            addArrow(new THREE.Vector3(0, side, 0), new THREE.Vector3(0, y - side * scale * 0.25, 0.05), mode === REVERSI_TOPOLOGIES.RP2 ? 0xfbbf24 : 0x38bdf8);
        }
    }

    buildSphere(width, height) {
        const topology = this.app.logic.topology;
        const radius = 3.5;
        const surface = new THREE.Mesh(
            new THREE.SphereGeometry(radius - 0.045, 96, 48),
            new THREE.MeshPhysicalMaterial({
                color: 0x8a6a3d,
                roughness: 0.62,
                metalness: 0.02,
                transparent: true,
                opacity: 0.68,
                clearcoat: 0.18
            })
        );
        surface.castShadow = true;
        surface.receiveShadow = true;
        surface.userData.surfacePickOccluder = true;
        this.boardGroup.add(surface);

        const linePositions = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                this.appendPolyline(linePositions, this.sphereSurfaceEdgePoints([x, y], [(x + 1) % width, y], width, height, 0.045, 10));
                if (y < height - 1) this.appendPolyline(linePositions, this.sphereSurfaceEdgePoints([x, y], [x, y + 1], width, height, 0.045, 10));
            }
        }
        for (let x = 0; x < width; x += 1) {
            this.appendPolyline(linePositions, this.sphereSurfaceEdgePoints([0, -1], [x, 0], width, height, 0.045, 10));
            this.appendPolyline(linePositions, this.sphereSurfaceEdgePoints([x, height - 1], [0, height], width, height, 0.045, 10));
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({ color: 0x0b0b0b, transparent: true, opacity: 0.68 })
        ));

        const pointPositions = [];
        for (const coord of topology.allCoords()) {
            const point = this.positionForCoord(coord, this.app.logic, 0.08);
            this.pointCoords.push(coord);
            this.pointPositions.push(point);
            pointPositions.push(point.x, point.y, point.z);
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.082 : width <= 13 ? 0.06 : 0.045, {
            color: 0xffe3a3,
            opacity: 0.98
        });
    }

    torusLine(width, height, varyingAxis, fixedValue, material, lattice = 'square') {
        const points = [];
        const segments = Math.max(96, Math.max(width, height) * 8);
        for (let i = 0; i <= segments; i += 1) {
            const value = i / segments;
            const coord = varyingAxis === 'x'
                ? [value * width, fixedValue]
                : [fixedValue, value * height];
            points.push(this.torusPosition(coord, width, height, 0.04, lattice).position);
        }
        return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    }

    addNodePoints(positions, pointSize, options = {}) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: options.color ?? 0xdff8ff,
            size: pointSize,
            sizeAttenuation: true,
            transparent: true,
            opacity: options.opacity ?? 0.86,
            depthTest: options.depthTest ?? true,
            depthWrite: false
        });
        this.nodePoints = new THREE.Points(geometry, material);
        this.nodePoints.renderOrder = options.renderOrder ?? 0;
        this.boardGroup.add(this.nodePoints);
    }

    renderStones(logic) {
        this.clearGroup(this.stoneGroup);
        const black = [];
        const white = [];
        const blackSurface = [];
        const whiteSurface = [];
        const ageRings = [];
        const surfaceFaceBoard = this.isSurfaceFaceBoard(logic);
        for (const [key, stone] of logic.board.entries()) {
            const coord = key.split(',').map(Number);
            if (!this.coordVisible(coord)) continue;
            const poses = this.posesForCoord(
                coord,
                logic,
                surfaceFaceBoard
                    ? logic.topology.topology === REVERSI_TOPOLOGIES.KLEIN ? 0.14 : 0.105
                    : 0.18
            );
            const positions = poses.map((pose) => pose.position);
            if (surfaceFaceBoard) {
                if (stone.color === 'black') blackSurface.push(...poses);
                else whiteSurface.push(...poses);
            } else if (stone.color === 'black') black.push(...positions);
            else white.push(...positions);
            if (this.app?.shouldShowAgeRings?.()) {
                for (const position of positions) ageRings.push({ position, age: stone.age || 0 });
            }
        }
        this.addSurfaceStoneDiscs(blackSurface, 'black', logic);
        this.addSurfaceStoneDiscs(whiteSurface, 'white', logic);
        this.addStoneInstances(black, 'black', logic);
        this.addStoneInstances(white, 'white', logic);
        this.addAgeRings(ageRings, logic);
    }

    renderLegalMoves(logic) {
        this.clearGroup(this.markerGroup);
        const positions = logic.legalMoves()
            .filter((move) => this.coordVisible(move.coord))
            .flatMap((move) => this.positionsForCoord(move.coord, logic, 0.22));
        if (!positions.length) return;
        const radius = this.markerRadius(logic) * 0.58;
        const mesh = new THREE.InstancedMesh(
            new THREE.SphereGeometry(radius, 16, 10),
            new THREE.MeshStandardMaterial({
                color: 0xf2c464,
                emissive: 0xf2c464,
                emissiveIntensity: 1.7,
                roughness: 0.36,
                transparent: true,
                opacity: 0.86
            }),
            positions.length
        );
        const matrix = new THREE.Matrix4();
        positions.forEach((position, index) => {
            matrix.makeTranslation(position.x, position.y, position.z);
            mesh.setMatrixAt(index, matrix);
        });
        mesh.castShadow = true;
        this.markerGroup.add(mesh);
    }

    addStoneInstances(positions, color, logic) {
        if (!positions.length) return;
        const radius = this.markerRadius(logic);
        const stoneGeometry = new THREE.SphereGeometry(radius, 28, 18);
        const dotGeometry = new THREE.SphereGeometry(radius * 0.26, 16, 10);
        const r3Stone = isR3LikeTopology(logic.topology.topology);
        const stoneMaterial = new THREE.MeshPhysicalMaterial({
            color: color === 'black' ? 0x05070a : 0xf5f7fb,
            roughness: r3Stone ? (color === 'black' ? 0.16 : 0.1) : (color === 'black' ? 0.34 : 0.2),
            metalness: r3Stone ? 0.14 : 0.04,
            clearcoat: r3Stone ? 0.74 : 0.18,
            clearcoatRoughness: r3Stone ? 0.12 : 0.34,
            emissive: color === 'black' ? 0x071521 : 0xffffff,
            emissiveIntensity: r3Stone ? (color === 'black' ? 0.18 : 0.08) : 0,
            envMapIntensity: r3Stone ? 1.5 : 1,
            transparent: true,
            opacity: 1
        });
        const dotMaterial = new THREE.MeshStandardMaterial({
            color: color === 'black' ? 0x48c7f4 : 0xf2c464,
            emissive: color === 'black' ? 0x48c7f4 : 0xf2c464,
            emissiveIntensity: r3Stone ? 2.0 : 1.35,
            transparent: true,
            opacity: 1
        });
        stoneMaterial.userData.baseOpacity = stoneMaterial.opacity;
        dotMaterial.userData.baseOpacity = dotMaterial.opacity;
        const stoneMesh = new THREE.InstancedMesh(stoneGeometry, stoneMaterial, positions.length);
        const dotMesh = new THREE.InstancedMesh(dotGeometry, dotMaterial, positions.length);
        const matrix = new THREE.Matrix4();
        positions.forEach((position, index) => {
            matrix.makeTranslation(position.x, position.y, position.z);
            stoneMesh.setMatrixAt(index, matrix);
            dotMesh.setMatrixAt(index, matrix);
        });
        stoneMesh.castShadow = true;
        dotMesh.castShadow = true;
        stoneMesh.userData.pieceColor = color;
        dotMesh.userData.pieceColor = color;
        this.applyPieceFocusToObject(stoneMesh);
        this.applyPieceFocusToObject(dotMesh);
        this.stoneGroup.add(stoneMesh, dotMesh);
    }

    addSurfaceStoneDiscs(poses, color, logic) {
        if (!poses.length) return;
        const radius = this.markerRadius(logic) * (logic.topology.topology === REVERSI_TOPOLOGIES.KLEIN ? 1.1 : 1.55);
        const puckThickness = logic.topology.topology === REVERSI_TOPOLOGIES.MOBIUS ? 0.09 : 0.075;
        const discGeometry = new THREE.CylinderGeometry(radius, radius, puckThickness, 48, 1);
        const rimGeometry = new THREE.RingGeometry(radius * 0.985, radius * 1.025, 42);
        const discMaterial = new THREE.MeshPhysicalMaterial({
            color: color === 'black' ? 0x05070a : 0xf8fafc,
            roughness: color === 'black' ? 0.18 : 0.12,
            metalness: 0.05,
            clearcoat: 0.46,
            clearcoatRoughness: 0.2,
            emissive: color === 'black' ? 0x02070b : 0xffffff,
            emissiveIntensity: color === 'black' ? 0.1 : 0.05,
            side: THREE.DoubleSide,
            depthWrite: true,
            polygonOffset: true,
            polygonOffsetFactor: -3,
            polygonOffsetUnits: -3
        });
        const rimMaterial = new THREE.MeshBasicMaterial({
            color: color === 'black' ? 0x05070a : 0xf8fafc,
            transparent: true,
            opacity: 0.82,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        discMaterial.userData.baseOpacity = discMaterial.opacity;
        rimMaterial.userData.baseOpacity = rimMaterial.opacity;
        const localPuckNormal = new THREE.Vector3(0, 1, 0);
        const localRimNormal = new THREE.Vector3(0, 0, 1);
        for (const pose of poses) {
            const normal = pose.normal?.clone?.().normalize?.() || new THREE.Vector3(0, 0, 1);
            const surfaceLift = logic.topology.topology === REVERSI_TOPOLOGIES.MOBIUS ? 0.07 : 0.052;
            const position = pose.position.clone().add(normal.clone().multiplyScalar(surfaceLift + puckThickness * 0.5));
            const disc = new THREE.Mesh(discGeometry, discMaterial);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            disc.position.copy(position);
            rim.position.copy(position.clone().add(normal.clone().multiplyScalar(puckThickness * 0.55)));
            disc.quaternion.setFromUnitVectors(localPuckNormal, normal);
            rim.quaternion.setFromUnitVectors(localRimNormal, normal);
            disc.renderOrder = 8;
            rim.renderOrder = 9;
            disc.userData.pieceColor = color;
            rim.userData.pieceColor = color;
            this.applyPieceFocusToObject(disc);
            this.applyPieceFocusToObject(rim);
            this.stoneGroup.add(disc, rim);
        }
    }

    addAgeRings(items, logic) {
        if (!items.length) return;
        const config = this.app?.pieceTimeConfig?.();
        if (!config?.enabled) return;
        const lifetime = Math.max(1, Number(config.ageLifespan || config.lifespan || config.lifetime) || 1);
        const radius = this.markerRadius(logic);
        const ringGeometry = new THREE.TorusGeometry(radius * 1.38, Math.max(0.01, radius * 0.075), 10, 64);
        const normalMaterial = new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.96, depthWrite: false });
        const warnMaterial = new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 1, depthWrite: false });
        normalMaterial.userData.baseOpacity = normalMaterial.opacity;
        warnMaterial.userData.baseOpacity = warnMaterial.opacity;
        for (const item of items) {
            const age = Number(item.age || 0);
            if (!config.ageEnabled || !Number.isFinite(age) || age <= 0) continue;
            const progress = Math.max(0.05, Math.min(1, age / lifetime));
            const material = config.decay && progress >= 0.96 ? warnMaterial : normalMaterial;
            const ring = new THREE.Mesh(ringGeometry, material);
            ring.position.copy(item.position);
            ring.userData.ageRing = true;
            ring.userData.ageProgress = progress;
            ring.scale.setScalar(progress);
            ring.renderOrder = 12;
            this.stoneGroup.add(ring);
        }
    }

    setPieceFocus(color = null) {
        this.focusColor = color === 'black' || color === 'white' ? color : null;
        this.applyPieceFocus();
    }

    applyPieceFocus() {
        this.stoneGroup.children.forEach((object) => this.applyPieceFocusToObject(object));
    }

    applyPieceFocusToObject(object) {
        const material = object?.material;
        if (!material) return;
        const baseOpacity = material.userData?.baseOpacity ?? material.opacity ?? 1;
        const dim = Boolean(this.focusColor && object.userData?.pieceColor && object.userData.pieceColor !== this.focusColor);
        material.transparent = baseOpacity < 1 || dim;
        material.opacity = dim ? 0.5 : baseOpacity;
        material.needsUpdate = true;
    }

    markerRadius(logic) {
        const size = Math.max(logic.topology.width, logic.topology.height, logic.topology.depth);
        if (isR3LikeTopology(logic.topology.topology)) return size <= 9 ? 0.18 : size <= 13 ? 0.13 : 0.095;
        return size <= 9 ? 0.17 : size <= 13 ? 0.135 : 0.105;
    }

    setHover(coord, logic = this.app.logic) {
        this.clearGroup(this.hoverGroup);
        if (!coord || !logic || logic.gameOver || !this.coordVisible(coord)) return;
        const legal = logic.previewMove(coord).length > 0;
        if (!legal) return;
        const p = this.positionForCoord(coord, logic, 0.27);
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.markerRadius(logic) * 1.15, 24, 14),
            new THREE.MeshBasicMaterial({
                color: logic.currentPlayer === 'black' ? 0x111827 : 0xffffff,
                transparent: true,
                opacity: 0.38,
                depthWrite: false
            })
        );
        mesh.position.copy(p);
        this.hoverGroup.add(mesh);
    }

    positionsForCoord(coord, logic, lift = 0) {
        return this.posesForCoord(coord, logic, lift).map((pose) => pose.position);
    }

    isSurfaceFaceBoard(logic = this.app?.logic) {
        return [
            REVERSI_TOPOLOGIES.T2,
            REVERSI_TOPOLOGIES.CYLINDER,
            REVERSI_TOPOLOGIES.KLEIN,
            REVERSI_TOPOLOGIES.MOBIUS
        ].includes(logic?.topology?.topology);
    }

    surfaceCellCoord(coord, logic = this.app?.logic) {
        if (!this.isSurfaceFaceBoard(logic) || !Array.isArray(coord)) return coord;
        if (logic?.topology?.topology === REVERSI_TOPOLOGIES.KLEIN) {
            return [Number(coord[0]), Number(coord[1])];
        }
        return [Number(coord[0]) + 0.5, Number(coord[1]) + 0.5];
    }

    posesForCoord(coord, logic, lift = 0) {
        const topology = logic.topology;
        const visualCoord = this.surfaceCellCoord(coord, logic);
        if (topology.lattice === HONEYCOMB_LATTICE && topology.topology === REVERSI_TOPOLOGIES.T2 && this.app?.surfaceViewMode?.() === 'cut2d') {
            return [this.honeycombCutPose(coord, topology.width, topology.height, lift)];
        }
        if (logic.topology.topology === REVERSI_TOPOLOGIES.MOBIUS) {
            return [this.mobiusPose(visualCoord, topology.width, topology.height, Math.abs(lift), topology.lattice)];
        }
        if (topology.lattice === HONEYCOMB_LATTICE && topology.topology === REVERSI_TOPOLOGIES.T2) {
            return [this.honeycombSurfacePose(coord, topology.width, topology.height, 'torus', lift)];
        }
        if (topology.lattice === HONEYCOMB_LATTICE && topology.topology === REVERSI_TOPOLOGIES.CYLINDER) {
            return [this.honeycombSurfacePose(coord, topology.width, topology.height, 'cylinder', lift)];
        }
        if (topology.topology === REVERSI_TOPOLOGIES.T2) return [this.torusPosition(visualCoord, topology.width, topology.height, lift, topology.lattice)];
        if (topology.topology === REVERSI_TOPOLOGIES.CYLINDER) return [this.cylinderPose(visualCoord, topology.width, topology.height, lift, topology.lattice)];
        if (topology.topology === REVERSI_TOPOLOGIES.KLEIN) return [this.kleinOutsidePose(visualCoord, topology.width, topology.height, lift)];
        if (topology.topology === REVERSI_TOPOLOGIES.RP2) return [{
            position: this.flatCellPosition(coord, topology.width, topology.height, lift),
            normal: new THREE.Vector3(0, 0, 1)
        }];
        if (topology.topology === REVERSI_TOPOLOGIES.SPHERE) {
            const position = this.sphereDisplayPosition(visualCoord, topology.width, topology.height, lift);
            const normal = this.sphereDisplayPosition(visualCoord, topology.width, topology.height, 0).normalize();
            return [{ position, normal }];
        }
        return [{
            position: this.positionForCoord(coord, logic, lift),
            normal: new THREE.Vector3(0, 1, 0)
        }];
    }

    pickCoord(event) {
        if (!this.nodePoints) return null;
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObject(this.nodePoints, false);
        const hit = hits.find((candidate) => this.pickHitIsCameraFacing(candidate));
        if (hit) return this.pointCoords[hit.index] || null;
        return this.pickCoordByScreenDistance(event, rect);
    }

    pickCoordByScreenDistance(event, rect) {
        if (!this.pointPositions.length) return null;
        const mode = this.app.logic?.topology?.topology;
        const isSurfaceGraph = [
            REVERSI_TOPOLOGIES.T2,
            REVERSI_TOPOLOGIES.CYLINDER,
            REVERSI_TOPOLOGIES.KLEIN,
            REVERSI_TOPOLOGIES.MOBIUS,
            REVERSI_TOPOLOGIES.RP2,
            REVERSI_TOPOLOGIES.SPHERE
        ].includes(mode);
        if (!isSurfaceGraph) return null;
        const targetX = event.clientX - rect.left;
        const targetY = event.clientY - rect.top;
        const maxPixels = mode === REVERSI_TOPOLOGIES.KLEIN || mode === REVERSI_TOPOLOGIES.MOBIUS ? 24 : 18;
        const projected = new THREE.Vector3();
        let best = null;
        for (let index = 0; index < this.pointPositions.length; index += 1) {
            const coord = this.pointCoords[index];
            const pose = this.posesForCoord(coord, this.app.logic, mode === REVERSI_TOPOLOGIES.KLEIN ? 0.11 : 0.08)[0];
            const hitLike = { distance: this.camera.position.distanceTo(this.pointPositions[index]) };
            if (mode === REVERSI_TOPOLOGIES.KLEIN) {
                if (this.kleinSurfaceOccludes(hitLike, pose)) continue;
            } else if (mode === REVERSI_TOPOLOGIES.MOBIUS) {
                if (this.mobiusSurfaceOccludes(hitLike)) continue;
            } else if (this.surfaceOccludesDistance(hitLike.distance)) continue;
            if ([REVERSI_TOPOLOGIES.T2, REVERSI_TOPOLOGIES.SPHERE].includes(mode) && !this.isPoseFacingCamera(pose.position, pose.normal)) continue;
            projected.copy(this.pointPositions[index]).project(this.camera);
            if (projected.z < -1 || projected.z > 1) continue;
            const x = (projected.x * 0.5 + 0.5) * rect.width;
            const y = (-projected.y * 0.5 + 0.5) * rect.height;
            const screenDistance = Math.hypot(x - targetX, y - targetY);
            if (screenDistance > maxPixels) continue;
            const cameraDistance = this.camera.position.distanceTo(this.pointPositions[index]);
            if (!best
                || screenDistance < best.screenDistance - 0.6
                || (Math.abs(screenDistance - best.screenDistance) <= 0.6 && cameraDistance < best.cameraDistance)) {
                best = { index, screenDistance, cameraDistance };
            }
        }
        return best ? this.pointCoords[best.index] || null : null;
    }

    pickHitIsCameraFacing(hit) {
        const logic = this.app.logic;
        const mode = logic?.topology?.topology;
        if (!hit || ![REVERSI_TOPOLOGIES.T2, REVERSI_TOPOLOGIES.CYLINDER, REVERSI_TOPOLOGIES.KLEIN, REVERSI_TOPOLOGIES.MOBIUS, REVERSI_TOPOLOGIES.SPHERE].includes(mode)) return Boolean(hit);
        const coord = this.pointCoords[hit.index];
        if (!coord) return false;
        const pose = this.posesForCoord(coord, logic, mode === REVERSI_TOPOLOGIES.KLEIN ? 0.11 : 0.08)[0];
        if (mode === REVERSI_TOPOLOGIES.KLEIN) return !this.kleinSurfaceOccludes(hit, pose);
        if (mode === REVERSI_TOPOLOGIES.MOBIUS) return !this.mobiusSurfaceOccludes(hit);
        if (this.surfaceOccludesDistance(hit.distance)) return false;
        if (!this.isPoseFacingCamera(pose.position, pose.normal)) return false;
        return true;
    }

    surfaceOccludesDistance(distance) {
        const occluders = this.boardGroup.children.filter((child) => child.userData?.surfacePickOccluder);
        if (!occluders.length) return false;
        const surfaceHits = this.raycaster.intersectObjects(occluders, false);
        const nearest = surfaceHits.find((surfaceHit) => surfaceHit.distance > 0.01);
        return Boolean(nearest && nearest.distance < distance - 0.04);
    }

    kleinClickThroughWindow(pose) {
        if (!pose) return false;
        const uDistance = Math.min(
            Math.abs(pose.u - Math.PI),
            Math.abs(pose.u),
            Math.abs(pose.u - TWO_PI)
        );
        return uDistance < 0.42 && Math.abs(pose.position.x) < 2.25 && pose.position.y < 0.85;
    }

    kleinSurfaceOccludes(hit, pose) {
        const occluders = this.boardGroup.children.filter((child) => child.userData?.kleinPickOccluder);
        if (!occluders.length) return false;
        const surfaceHits = this.raycaster.intersectObjects(occluders, false);
        const nearest = surfaceHits.find((surfaceHit) => surfaceHit.distance > 0.01);
        if (!nearest) return false;
        return nearest.distance < hit.distance - 0.04 && !this.kleinClickThroughWindow(pose);
    }

    mobiusSurfaceOccludes(hit) {
        const occluders = this.boardGroup.children.filter((child) => child.userData?.mobiusPickOccluder);
        if (!occluders.length) return false;
        const surfaceHits = this.raycaster.intersectObjects(occluders, false);
        const nearest = surfaceHits.find((surfaceHit) => surfaceHit.distance > 0.01);
        return Boolean(nearest && nearest.distance < hit.distance - 0.04);
    }

    isPoseFacingCamera(position, normal, threshold = 0.04) {
        return normal.clone().normalize().dot(this.camera.position.clone().sub(position).normalize()) > threshold;
    }

    handlePointerMove(event) {
        const coord = this.pickCoord(event);
        this.app.hoverCoord = coord;
        this.setHover(coord);
    }

    handleClick(event) {
        const coord = this.pickCoord(event);
        if (coord && this.coordVisible(coord)) this.app.playAt(coord);
    }

    positionForCoord(coord, logic, lift = 0) {
        const topology = logic.topology;
        const visualCoord = this.surfaceCellCoord(coord, logic);
        if (topology.lattice === HONEYCOMB_LATTICE && topology.topology === REVERSI_TOPOLOGIES.T2 && this.app?.surfaceViewMode?.() === 'cut2d') {
            return this.honeycombCutPose(coord, topology.width, topology.height, lift).position;
        }
        if (topology.lattice === HONEYCOMB_LATTICE && topology.topology === REVERSI_TOPOLOGIES.T2) {
            return this.honeycombSurfacePose(coord, topology.width, topology.height, 'torus', lift).position;
        }
        if (topology.lattice === HONEYCOMB_LATTICE && topology.topology === REVERSI_TOPOLOGIES.CYLINDER) {
            return this.honeycombSurfacePose(coord, topology.width, topology.height, 'cylinder', lift).position;
        }
        if (topology.topology === REVERSI_TOPOLOGIES.T2) return this.torusPosition(visualCoord, topology.width, topology.height, lift, topology.lattice).position;
        if (topology.topology === REVERSI_TOPOLOGIES.CYLINDER) return this.cylinderPosition(visualCoord, topology.width, topology.height, lift, topology.lattice);
        if (topology.topology === REVERSI_TOPOLOGIES.MOBIUS) return this.mobiusPose(visualCoord, topology.width, topology.height, lift, topology.lattice).position;
        if (topology.topology === REVERSI_TOPOLOGIES.KLEIN) return this.kleinOutsidePose(visualCoord, topology.width, topology.height, lift).position;
        if (topology.topology === REVERSI_TOPOLOGIES.RP2) return this.flatCellPosition(coord, topology.width, topology.height, lift);
        if (topology.topology === REVERSI_TOPOLOGIES.SPHERE) return this.sphereDisplayPosition(visualCoord, topology.width, topology.height, lift);
        return this.r3Position(coord, topology);
    }

    r3Scale({ width, height, depth }) {
        return 7.8 / Math.max(1, Math.max(width, height, depth) - 1);
    }

    r3Position(coord, topology) {
        const scale = this.r3Scale(topology);
        const centerX = (topology.width - 1) / 2;
        const centerY = (topology.height - 1) / 2;
        const centerZ = (topology.depth - 1) / 2;
        const hcpOffsetX = topology.lattice === 'hcp' ? ((coord[2] % 2) * 0.5 + (coord[1] % 2) * 0.5) : 0;
        const hcpOffsetY = topology.lattice === 'hcp' ? coord[2] * 0.18 : 0;
        return new THREE.Vector3(
            (coord[0] + hcpOffsetX - centerX) * scale,
            (coord[2] * (topology.lattice === 'hcp' ? 0.82 : 1) - centerZ + hcpOffsetY) * scale,
            ((coord[1] - centerY) * (topology.lattice === 'hcp' ? 0.866 : 1)) * scale
        );
    }

    latticeSurfaceUV(coord, width, height, lattice = 'square') {
        if (lattice === KAGOME_LATTICE) {
            const point = kagomePoint(coord, width, height) || { x: 0, y: 0 };
            const bounds = kagomeBounds(width, height);
            const rawX = point.x - bounds.minX;
            const rawY = point.y - bounds.minY;
            const circumference = Math.max(1, bounds.maxX - bounds.minX);
            const periodicAxis = Math.max(1, bounds.maxY - bounds.minY);
            return {
                u: (rawX / circumference) * TWO_PI,
                v: (rawY / periodicAxis) * TWO_PI,
                band: rawY / periodicAxis
            };
        }
        if (lattice === 'honeycomb') {
            const rawX = Number(coord[0]) * Math.sqrt(3) / 2;
            const rawY = Number(coord[1]) + (Number(coord[0]) % 2 ? 0.5 : 0);
            const circumference = Math.max(1, width * Math.sqrt(3) / 2);
            const periodicAxis = Math.max(1, height);
            const cylinderBand = Math.max(1, height - 0.5);
            return {
                u: (rawX / circumference) * TWO_PI,
                v: (rawY / periodicAxis) * TWO_PI,
                band: rawY / cylinderBand
            };
        }
        return {
            u: (Number(coord[0]) / Math.max(1, width)) * TWO_PI,
            v: (Number(coord[1]) / Math.max(1, height)) * TWO_PI,
            band: Number(coord[1]) / Math.max(1, height - 1)
        };
    }

    wrapSurfaceCoord(coord, width, height, wrapY = false) {
        const x = ((Number(coord[0]) % width) + width) % width;
        const rawY = Number(coord[1]);
        if (!wrapY && (rawY < 0 || rawY >= height)) return null;
        const y = wrapY ? ((rawY % height) + height) % height : rawY;
        return [x, y];
    }

    honeycombSurfaceMetrics(width, height, surface = 'flat') {
        const radius = 1;
        const dx = Math.sqrt(3);
        const dy = 1.5;
        const rawPeriodX = Math.max(1, Math.sqrt(3) * width);
        const rawPeriodY = Math.max(1, 1.5 * (height - 1) + 2);
        const yScale = surface === 'torus'
            ? Math.max(0.94, rawPeriodY / (rawPeriodY + Math.max(0.001, rawPeriodY / Math.max(8, height * 4))))
            : 1;
        const periodX = rawPeriodX;
        const periodY = rawPeriodY * yScale;
        return {
            radius,
            dx,
            dy,
            cylinderRadius: HONEYCOMB_CYLINDER_RADIUS,
            periodX,
            periodY,
            profile: surface === 'torus' ? 'honeycomb' : 'standard',
            originX: 0,
            originY: (rawPeriodY - periodY) / 2,
            minY: 0,
            maxY: rawPeriodY
        };
    }

    honeycombSurfaceCenter(col, row, metrics) {
        return {
            x: Math.sqrt(3) * (0.5 + col + (row % 2) * 0.5),
            y: 1 + metrics.dy * row
        };
    }

    surfacePointFromPlanar(point, metrics, surface, lift = 0.045) {
        const x = (((point.x - metrics.originX) % metrics.periodX) + metrics.periodX) % metrics.periodX;
        const u = x / metrics.periodX * TWO_PI;
        if (surface === 'torus') {
            const y = (((point.y - metrics.originY) % metrics.periodY) + metrics.periodY) % metrics.periodY;
            return this.torusPointFromUV({ u, v: y / metrics.periodY * TWO_PI }, lift, metrics.profile);
        }
        const span = Math.max(1e-6, metrics.maxY - metrics.minY);
        const band = THREE.MathUtils.clamp((point.y - metrics.minY) / span, 0, 1);
        return this.cylinderPointFromUV({ u, band }, lift, metrics.cylinderRadius);
    }

    honeycombSurfacePose(coord, width, height, surface, lift = 0.08) {
        const metrics = this.honeycombSurfaceMetrics(width, height, surface);
        const row = Number(coord?.[1]) || 0;
        const col = Number(coord?.[0]) || 0;
        if (surface === 'torus') {
            const root3 = Math.sqrt(3);
            const center = {
                x: 1.5 * col,
                y: root3 * (row + (col % 2) * 0.5)
            };
            const u = (center.x / Math.max(1, 1.5 * width)) * TWO_PI;
            const v = (center.y / Math.max(1, root3 * height)) * TWO_PI;
            return {
                position: this.torusPointFromUV({ u, v }, lift, 'honeycomb'),
                normal: new THREE.Vector3(Math.cos(u) * Math.cos(v), Math.sin(u) * Math.cos(v), Math.sin(v)).normalize()
            };
        }
        const center = this.honeycombSurfaceCenter(col, row, metrics);
        const x = (((center.x - metrics.originX) % metrics.periodX) + metrics.periodX) % metrics.periodX;
        const u = x / metrics.periodX * TWO_PI;
        if (surface === 'torus') {
            const y = (((center.y - metrics.originY) % metrics.periodY) + metrics.periodY) % metrics.periodY;
            const v = y / metrics.periodY * TWO_PI;
            return {
                position: this.torusPointFromUV({ u, v }, lift, metrics.profile),
                normal: new THREE.Vector3(Math.cos(u) * Math.cos(v), Math.sin(u) * Math.cos(v), Math.sin(v)).normalize()
            };
        }
        const band = THREE.MathUtils.clamp((center.y - metrics.minY) / Math.max(1e-6, metrics.maxY - metrics.minY), 0, 1);
        return {
            position: this.cylinderPointFromUV({ u, band }, lift, metrics.cylinderRadius),
            normal: new THREE.Vector3(Math.cos(u), 0, Math.sin(u)).normalize()
        };
    }

    surfacePlanarEdgePoints(a, b, metrics, surface, lift = 0.045, segments = 8) {
        const start = {
            x: ((a.x % metrics.periodX) + metrics.periodX) % metrics.periodX,
            y: surface === 'torus' ? ((a.y % metrics.periodY) + metrics.periodY) % metrics.periodY : a.y
        };
        const end = {
            x: ((b.x % metrics.periodX) + metrics.periodX) % metrics.periodX,
            y: surface === 'torus' ? ((b.y % metrics.periodY) + metrics.periodY) % metrics.periodY : b.y
        };
        let dx = end.x - start.x;
        if (dx > metrics.periodX / 2) dx -= metrics.periodX;
        if (dx < -metrics.periodX / 2) dx += metrics.periodX;
        let dy = end.y - start.y;
        if (surface === 'torus') {
            if (dy > metrics.periodY / 2) dy -= metrics.periodY;
            if (dy < -metrics.periodY / 2) dy += metrics.periodY;
        }
        const points = [];
        for (let step = 0; step <= segments; step += 1) {
            const t = step / segments;
            points.push(this.surfacePointFromPlanar({
                x: start.x + dx * t,
                y: start.y + dy * t
            }, metrics, surface, lift));
        }
        return points;
    }

    appendPlanarPolyline(linePositions, vertices, metrics, surface, lift = 0.045, close = false) {
        const count = close ? vertices.length : vertices.length - 1;
        for (let index = 0; index < count; index += 1) {
            const a = vertices[index];
            const b = vertices[(index + 1) % vertices.length];
            this.appendPolyline(linePositions, this.surfacePlanarEdgePoints(a, b, metrics, surface, lift, 8));
        }
    }

    surfaceHoneycombFacePositions(width, height, lattice, surface, lift = 0.045) {
        const linePositions = [];
        if (surface === 'torus') {
            const root3 = Math.sqrt(3);
            const periodX = Math.max(1, 1.5 * width);
            const periodY = Math.max(1, root3 * height);
            const radius = 1.015;
            const edges = new Map();
            const edgeKey = (a, b) => [
                `${a.x.toFixed(5)},${a.y.toFixed(5)}`,
                `${b.x.toFixed(5)},${b.y.toFixed(5)}`
            ].sort().join('|');
            const pointFromPlanar = (point) => this.torusPointFromUV({
                u: (point.x / periodX) * TWO_PI,
                v: (point.y / periodY) * TWO_PI
            }, lift, 'honeycomb');
            for (let row = 0; row < height; row += 1) {
                for (let col = 0; col < width; col += 1) {
                    const center = {
                        x: 1.5 * col,
                        y: root3 * (row + (col % 2) * 0.5)
                    };
                    const vertices = Array.from({ length: 6 }, (_, index) => {
                        const angle = index * Math.PI / 3;
                        return {
                            x: center.x + radius * Math.cos(angle),
                            y: center.y + radius * Math.sin(angle)
                        };
                    });
                    for (let index = 0; index < vertices.length; index += 1) {
                        const a = vertices[index];
                        const b = vertices[(index + 1) % vertices.length];
                        const key = edgeKey(a, b);
                        if (!edges.has(key)) edges.set(key, [a, b]);
                    }
                }
            }
            for (const [a, b] of edges.values()) {
                const start = {
                    u: (a.x / periodX) * TWO_PI,
                    v: (a.y / periodY) * TWO_PI
                };
                const end = {
                    u: (b.x / periodX) * TWO_PI,
                    v: (b.y / periodY) * TWO_PI
                };
                const du = this.shortestAngleDelta(start.u, end.u);
                const dv = this.shortestAngleDelta(start.v, end.v);
                const points = [];
                for (let step = 0; step <= 8; step += 1) {
                    const t = step / 8;
                    points.push(pointFromPlanar({
                        x: ((start.u + du * t) / TWO_PI) * periodX,
                        y: ((start.v + dv * t) / TWO_PI) * periodY
                    }));
                }
                this.appendPolyline(linePositions, points);
            }
            return linePositions;
        }
        const metrics = this.honeycombSurfaceMetrics(width, height, surface);
        const edges = new Map();
        const edgeKey = (a, b) => [
            `${a.x.toFixed(5)},${a.y.toFixed(5)}`,
            `${b.x.toFixed(5)},${b.y.toFixed(5)}`
        ].sort().join('|');
        for (let row = 0; row < height; row += 1) {
            for (let col = 0; col < width; col += 1) {
                const center = this.honeycombSurfaceCenter(col, row, metrics);
                const vertices = Array.from({ length: 6 }, (_, index) => {
                    const angle = index * Math.PI / 3 - Math.PI / 6;
                    return {
                        x: center.x + metrics.radius * Math.cos(angle),
                        y: center.y + metrics.radius * Math.sin(angle)
                    };
                });
                for (let index = 0; index < vertices.length; index += 1) {
                    const a = vertices[index];
                    const b = vertices[(index + 1) % vertices.length];
                    const key = edgeKey(a, b);
                    if (!edges.has(key)) edges.set(key, [a, b]);
                }
            }
        }
        for (const [a, b] of edges.values()) {
            this.appendPolyline(linePositions, this.surfacePlanarEdgePoints(a, b, metrics, surface, lift, 8));
        }
        return linePositions;
    }

    surfaceHoneycombCylinderSeamPositions(width, height, metrics, lift = 0.045) {
        const linePositions = [];
        const points = [];
        const segments = Math.max(32, height * 8);
        for (let step = 0; step <= segments; step += 1) {
            points.push(this.cylinderPointFromUV({
                u: 0,
                band: step / segments
            }, lift + 0.012, metrics.cylinderRadius));
        }
        this.appendPolyline(linePositions, points);
        return linePositions;
    }

    appendPolyline(linePositions, points) {
        for (let index = 1; index < points.length; index += 1) {
            const previous = points[index - 1];
            const current = points[index];
            linePositions.push(previous.x, previous.y, previous.z, current.x, current.y, current.z);
        }
    }

    shortestAngleDelta(start, end) {
        let delta = end - start;
        if (delta > Math.PI) delta -= TWO_PI;
        if (delta < -Math.PI) delta += TWO_PI;
        return delta;
    }

    torusPointFromUV(uv, lift = 0, profile = 'standard') {
        const majorRadius = profile === 'honeycomb' ? 3.0 : 3.35;
        const minorBase = profile === 'honeycomb' ? 1.0 : 1.22;
        const minorRadius = minorBase + lift;
        const ringRadius = majorRadius + minorRadius * Math.cos(uv.v);
        return new THREE.Vector3(
            ringRadius * Math.cos(uv.u),
            ringRadius * Math.sin(uv.u),
            minorRadius * Math.sin(uv.v)
        );
    }

    cylinderPointFromUV(uv, lift = 0, baseRadius = CYLINDER_RADIUS) {
        const radius = baseRadius + lift;
        const y = (0.5 - uv.band) * CYLINDER_HEIGHT;
        return new THREE.Vector3(radius * Math.cos(uv.u), y, radius * Math.sin(uv.u));
    }

    torusSurfaceEdgePoints(a, b, width, height, lattice = 'square', lift = 0.04, segments = 6) {
        const start = this.latticeSurfaceUV(a, width, height, lattice);
        const end = this.latticeSurfaceUV(b, width, height, lattice);
        const du = this.shortestAngleDelta(start.u, end.u);
        const dv = this.shortestAngleDelta(start.v, end.v);
        const points = [];
        for (let step = 0; step <= segments; step += 1) {
            const t = step / segments;
            points.push(this.torusPointFromUV({
                u: start.u + du * t,
                v: start.v + dv * t
            }, lift, lattice === HONEYCOMB_LATTICE ? 'honeycomb' : 'standard'));
        }
        return points;
    }

    cylinderSurfaceEdgePoints(a, b, width, height, lattice = 'square', lift = 0.04, segments = 6) {
        const start = this.latticeSurfaceUV(a, width, height, lattice);
        const end = this.latticeSurfaceUV(b, width, height, lattice);
        const du = this.shortestAngleDelta(start.u, end.u);
        const points = [];
        for (let step = 0; step <= segments; step += 1) {
            const t = step / segments;
            points.push(this.cylinderPointFromUV({
                u: start.u + du * t,
                band: THREE.MathUtils.lerp(start.band, end.band, t)
            }, lift));
        }
        return points;
    }

    sphereSurfaceEdgePoints(a, b, width, height, lift = 0.04, segments = 8) {
        return sphereArcPoints(
            this.spherePosition(a, width, height, lift),
            this.spherePosition(b, width, height, lift),
            segments
        );
    }

    sphereDisplayPosition(coord, width, height, lift = 0) {
        return this.spherePosition(coord, width, height, lift);
    }

    torusPosition(coord, width, height, lift = 0, lattice = 'square') {
        const uv = this.latticeSurfaceUV(coord, width, height, lattice);
        const position = this.torusPointFromUV(uv, lift, lattice === HONEYCOMB_LATTICE ? 'honeycomb' : 'standard');
        const normal = new THREE.Vector3(
            Math.cos(uv.u) * Math.cos(uv.v),
            Math.sin(uv.u) * Math.cos(uv.v),
            Math.sin(uv.v)
        ).normalize();
        return { position, normal };
    }

    cylinderPose(coord, width, height, lift = 0, lattice = 'square') {
        const uv = this.latticeSurfaceUV(coord, width, height, lattice);
        const position = this.cylinderPointFromUV(uv, lift);
        const normal = new THREE.Vector3(Math.cos(uv.u), 0, Math.sin(uv.u)).normalize();
        return { position, normal };
    }

    cylinderPosition(coord, width, height, lift = 0, lattice = 'square') {
        return this.cylinderPose(coord, width, height, lift, lattice).position;
    }

    kleinOutsidePose(coord, width, height, lift = 0.1) {
        const pose = kleinBottlePose(coord, width, height, -Math.abs(lift));
        pose.normal.multiplyScalar(-1);
        pose.position.multiplyScalar(KLEIN_RENDER_SCALE);
        return pose;
    }

    flatPosition(coord, width, height, lift = 0) {
        const scale = 7 / Math.max(width - 1, height - 1);
        return new THREE.Vector3(
            (coord[0] - (width - 1) / 2) * scale,
            ((height - 1) / 2 - coord[1]) * scale,
            lift
        );
    }

    flatCellPosition(coord, width, height, lift = 0) {
        const scale = 7 / Math.max(width, height);
        return new THREE.Vector3(
            (Number(coord[0]) + 0.5 - width / 2) * scale,
            (height / 2 - Number(coord[1]) - 0.5) * scale,
            lift
        );
    }

    mobiusTForY(y, height) {
        if (height <= 1) return 0;
        return THREE.MathUtils.lerp(-MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, Number(y) / (height - 1));
    }

    mobiusPoint(u, t, lift = 0) {
        const basis = this.mobiusBasis(u, t);
        const radial = MOBIUS_BAND_RADIUS + t * Math.cos(u / 2);
        const base = new THREE.Vector3(
            radial * Math.cos(u),
            t * Math.sin(u / 2),
            radial * Math.sin(u)
        );
        return base.add(basis.normal.clone().multiplyScalar(lift));
    }

    mobiusParameterLine(u, t0, t1, lift = 0.06, segments = 48) {
        const points = [];
        for (let step = 0; step <= segments; step += 1) {
            const t = THREE.MathUtils.lerp(t0, t1, step / segments);
            points.push(this.mobiusPoint(u, t, lift));
        }
        return points;
    }

    mobiusLoopLine(t, lift = 0.06, segments = 180) {
        const points = [];
        for (let step = 0; step <= segments; step += 1) {
            points.push(this.mobiusPoint(TWO_PI * step / segments, t, lift));
        }
        return points;
    }

    mobiusCellBoundaryLines(width, height, lift = 0.06) {
        const lines = [];
        for (let x = 0; x < width; x += 1) {
            const u = TWO_PI * x / Math.max(1, width);
            lines.push(this.mobiusParameterLine(u, -MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, lift, Math.max(48, height * 6)));
        }
        for (let y = 0; y <= height; y += 1) {
            const t = THREE.MathUtils.lerp(-MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, y / Math.max(1, height));
            lines.push(this.mobiusLoopLine(t, lift, Math.max(144, width * 12)));
        }
        return lines;
    }

    mobiusBasis(u, t) {
        const sinU = Math.sin(u);
        const cosU = Math.cos(u);
        const sinHalf = Math.sin(u / 2);
        const cosHalf = Math.cos(u / 2);
        const radial = MOBIUS_BAND_RADIUS + t * cosHalf;
        const tangentU = new THREE.Vector3(
            -0.5 * t * sinHalf * cosU - radial * sinU,
            0.5 * t * cosHalf,
            -0.5 * t * sinHalf * sinU + radial * cosU
        ).normalize();
        const tangentT = new THREE.Vector3(cosHalf * cosU, sinHalf, cosHalf * sinU).normalize();
        const normal = new THREE.Vector3().crossVectors(tangentT, tangentU).normalize();
        return { tangentU, tangentT, normal };
    }

    mobiusPose(coord, width, height, lift = 0, lattice = 'square') {
        const x = Number(coord?.[0]) || 0;
        const y = Number(coord?.[1]) || 0;
        const u = (x / Math.max(1, width)) * TWO_PI;
        const band = THREE.MathUtils.clamp(y / Math.max(1, height), 0, 1);
        const t = THREE.MathUtils.lerp(-MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, band);
        return {
            position: this.mobiusPoint(u, t, lift),
            normal: this.mobiusBasis(u, t).normal
        };
    }

    createMobiusSurfaceGeometry(uSegments = 220, tSegments = 48) {
        const safeUSegments = Math.max(12, Math.floor(uSegments));
        const safeTSegments = Math.max(4, Math.floor(tSegments));
        const positions = [];
        const indices = [];
        for (let iu = 0; iu < safeUSegments; iu += 1) {
            const u = (iu / safeUSegments) * TWO_PI;
            for (let it = 0; it <= safeTSegments; it += 1) {
                const t = THREE.MathUtils.lerp(-MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, it / safeTSegments);
                const point = this.mobiusPoint(u, t, 0);
                positions.push(point.x, point.y, point.z);
            }
        }
        const row = safeTSegments + 1;
        const indexAt = (iu, it) => iu * row + it;
        const wrappedIt = (it, wraps) => wraps ? safeTSegments - it : it;
        for (let iu = 0; iu < safeUSegments; iu += 1) {
            const nextU = (iu + 1) % safeUSegments;
            const wraps = nextU === 0;
            for (let it = 0; it < safeTSegments; it += 1) {
                const a = indexAt(iu, it);
                const b = indexAt(nextU, wrappedIt(it, wraps));
                const c = indexAt(nextU, wrappedIt(it + 1, wraps));
                const d = indexAt(iu, it + 1);
                indices.push(a, b, d, b, c, d);
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    createMobiusSolidGeometry(uSegments = 220, tSegments = 48, thickness = 0.06) {
        const safeUSegments = Math.max(12, Math.floor(uSegments));
        const safeTSegments = Math.max(4, Math.floor(tSegments));
        const positions = [];
        const indices = [];
        const halfThickness = Math.max(0.01, Math.abs(thickness) / 2);
        for (const lift of [halfThickness, -halfThickness]) {
            for (let iu = 0; iu < safeUSegments; iu += 1) {
                const u = (iu / safeUSegments) * TWO_PI;
                for (let it = 0; it <= safeTSegments; it += 1) {
                    const t = THREE.MathUtils.lerp(-MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, it / safeTSegments);
                    const point = this.mobiusPoint(u, t, lift);
                    positions.push(point.x, point.y, point.z);
                }
            }
        }
        const row = safeTSegments + 1;
        const layerStride = safeUSegments * row;
        const indexAt = (layer, iu, it) => layer * layerStride + iu * row + it;
        const wrappedIt = (it, wraps) => wraps ? safeTSegments - it : it;
        for (let iu = 0; iu < safeUSegments; iu += 1) {
            const nextU = (iu + 1) % safeUSegments;
            const wraps = nextU === 0;
            for (let it = 0; it < safeTSegments; it += 1) {
                const a = indexAt(0, iu, it);
                const b = indexAt(0, nextU, wrappedIt(it, wraps));
                const c = indexAt(0, nextU, wrappedIt(it + 1, wraps));
                const d = indexAt(0, iu, it + 1);
                indices.push(a, b, d, b, c, d);

                const e = indexAt(1, iu, it);
                const f = indexAt(1, nextU, wrappedIt(it, wraps));
                const g = indexAt(1, nextU, wrappedIt(it + 1, wraps));
                const h = indexAt(1, iu, it + 1);
                indices.push(e, h, f, f, h, g);
            }

            const lowerNext = wrappedIt(0, wraps);
            const upperNext = wrappedIt(safeTSegments, wraps);
            indices.push(
                indexAt(0, iu, 0), indexAt(1, iu, 0), indexAt(0, nextU, lowerNext),
                indexAt(1, iu, 0), indexAt(1, nextU, lowerNext), indexAt(0, nextU, lowerNext),
                indexAt(0, nextU, upperNext), indexAt(1, iu, safeTSegments), indexAt(0, iu, safeTSegments),
                indexAt(1, nextU, upperNext), indexAt(1, iu, safeTSegments), indexAt(0, nextU, upperNext)
            );
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    spherePosition(coord, width, height, lift = 0) {
        const radius = 3.5 + lift;
        const y = Number(coord[1]);
        if (y < 0) return new THREE.Vector3(0, 0, radius);
        if (y >= height) return new THREE.Vector3(0, 0, -radius);
        const theta = Math.PI * (y + 1) / (Math.max(1, height) + 1);
        const phi = TWO_PI * Number(coord[0]) / Math.max(1, width);
        return new THREE.Vector3(
            radius * Math.sin(theta) * Math.cos(phi),
            radius * Math.sin(theta) * Math.sin(phi),
            radius * Math.cos(theta)
        );
    }

    resetCamera() {
        const mode = this.app?.logic?.topology?.topology || 'r3';
        if (mode === REVERSI_TOPOLOGIES.T2 && this.app?.surfaceViewMode?.() === 'cut2d') this.camera.position.set(0, 0, 10.2);
        else if (mode === REVERSI_TOPOLOGIES.T2) this.camera.position.set(0, 5.7, 9.9);
        else if (mode === REVERSI_TOPOLOGIES.CYLINDER) this.camera.position.set(0, 0, 9.2);
        else if (mode === REVERSI_TOPOLOGIES.MOBIUS) this.camera.position.set(8.2, 5.9, 9.2);
        else if (mode === REVERSI_TOPOLOGIES.KLEIN) this.camera.position.set(10.2, 5.6, 11.4);
        else if (mode === REVERSI_TOPOLOGIES.SPHERE) this.camera.position.set(0, 2.0, 9.5);
        else if (mode === REVERSI_TOPOLOGIES.RP2) this.camera.position.set(0, 0, 10.5);
        else this.camera.position.set(7.9, 7.4, 8.2);
        this.controls.target.set(0, mode === REVERSI_TOPOLOGIES.KLEIN ? 0.24 : 0, 0);
        this.controls.update();
    }

    setCameraView(view = 'home') {
        if (view === 'home') {
            this.resetCamera();
            return;
        }
        const mode = this.app?.logic?.topology?.topology || 'r3';
        const distance = mode === REVERSI_TOPOLOGIES.SPHERE ? 9.8 : 10.6;
        const presets = {
            x: [distance, 0, 0],
            y: [0, distance, 0],
            z: [0, 0, distance]
        };
        const position = presets[view] || presets.z;
        this.camera.position.set(position[0], position[1], position[2]);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const elapsed = this.clock.getElapsedTime();
        this.markerGroup.children.forEach((child) => {
            if (child.material?.emissive) child.material.emissiveIntensity = 1.45 + Math.sin(elapsed * 2.2) * 0.28;
        });
        this.stoneGroup.children.forEach((child) => {
            if (child.userData?.ageRing) child.lookAt(this.camera.position);
        });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

class Reversi3DApp {
    constructor() {
        this.modeSelect = document.getElementById('spaceSelect');
        this.boundaryGroup = document.getElementById('boundaryControlGroup');
        this.boundarySelect = document.getElementById('boundarySelect');
        this.latticeGroup = document.getElementById('latticeControlGroup');
        this.latticeSelect = document.getElementById('latticeSelect');
        this.surfaceViewGroup = document.getElementById('surfaceViewControlGroup');
        this.surfaceViewSelect = document.getElementById('surfaceViewSelect');
        this.sizeSelect = document.getElementById('boardSizeSelect');
        this.customSizeInput = document.getElementById('customBoardSizeInput');
        this.layerGroup = document.getElementById('layerControlGroup');
        this.layerSelect = document.getElementById('layerSelect');
        this.layerInfo = document.getElementById('layerInfo');
        this.statusEl = document.getElementById('gameStatus');
        this.summaryEl = document.getElementById('moveSummary');
        this.turnEl = document.getElementById('playerTurn');
        this.modeDisplay = document.getElementById('modeDisplay');
        this.modeInfo = document.getElementById('modeInfo');
        this.blackScoreEl = document.getElementById('blackScore');
        this.whiteScoreEl = document.getElementById('whiteScore');
        this.timeEvolutionSelect = document.getElementById('timeEvolutionSelect');
        this.timeLifetimeInput = document.getElementById('timeLifetimeInput');
        this.noiseModeSelect = document.getElementById('noiseModeSelect');
        this.noisePeriodInput = document.getElementById('noisePeriodInput');
        this.passBtn = document.getElementById('passBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.cameraResetBtn = document.getElementById('cameraResetBtn');
        this.sliceFilterEl = document.getElementById('r3FilterControl') || document.getElementById('r3SliceFilter');
        this.sliceInputs = {
            x: document.getElementById('r3FilterX') || document.getElementById('sliceXInput'),
            y: document.getElementById('r3FilterY') || document.getElementById('sliceYInput'),
            z: document.getElementById('r3FilterZ') || document.getElementById('sliceZInput')
        };
        this.focusOwnPiecesBtn = document.getElementById('focusOwnPiecesBtn');
        this.focusOwnPieces = false;
        this.historyEl = document.getElementById('moveHistoryList');
        this.gameModeSelect = document.getElementById('gameModeSelect');
        this.onlineControls = document.getElementById('onlineControls');
        this.onlineColorEl = document.getElementById('onlineColorStatus');
        this.roomIdInput = document.getElementById('roomIdInput');
        this.shareLinkInput = document.getElementById('shareLinkInput');
        this.copyLinkBtn = document.getElementById('copyLinkBtn');
        this.chatMessagesEl = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.chatSendBtn = document.getElementById('chatSendBtn');
        this.hoverCoord = null;
        this.myColor = null;
        this.noiseTick = 0;

        this.applyUrlSettings();
        this.logic = this.createLogic();
        this.network = new FirebaseStateNetworkManager(this, { gameKey: this.onlineGameKey(), matchKey: this.onlineMatchKey() });
        this.renderer = new Reversi3DRenderer(this);
        this.syncLayerControl();
        this.bindEvents();
        this.updateUI();
        this.tryJoinSharedRoomFromUrl();
    }

    applyUrlSettings() {
        const params = new URLSearchParams(window.location.search);
        const mode = normalizeReversiTopology(params.get('mode') || 'r3');
        const boundary = normalizeReversiTopology(params.get('boundary') || params.get('boundaryCondition') || params.get('r3Boundary') || mode);
        if (['r3', 't3', 'r3_random', 'rp3'].includes(mode)) {
            this.modeSelect.value = 'r3';
            this.boundarySelect.value = ['r3', 't3', 'r3_random', 'rp3'].includes(boundary) ? boundary : mode;
        } else {
            this.modeSelect.value = ['t2', 'cylinder', 'sphere', 'klein', 'mobius'].includes(mode) ? mode : 'r3';
            this.boundarySelect.value = 'r3';
        }
        const size = params.get('size');
        if (size !== null && size.trim() !== '' && Number.isFinite(Number(size))) this.setSizeSelection(size);
        const lattice = String(params.get('lattice') || '').toLowerCase();
        if ([SQUARE_LATTICE, HCP_LATTICE, HONEYCOMB_LATTICE, KAGOME_LATTICE, SPHERE_COORDINATE_LATTICE].includes(lattice)) {
            this.latticeSelect.value = lattice;
        }
    }

    setSizeSelection(value) {
        const size = normalizeReversiSize(value, { fallback: 8, max: 19 });
        const option = [...this.sizeSelect.options].find((item) => item.value === String(size));
        this.sizeSelect.value = option ? String(size) : 'custom';
        this.customSizeInput.value = String(size);
        this.updateCustomSizeVisibility();
    }

    boardSize() {
        const source = this.sizeSelect.value === 'custom' ? this.customSizeInput.value : this.sizeSelect.value;
        return normalizeReversiSize(source, { fallback: 8, max: 19 });
    }

    defaultBoardSizeForMode(mode = this.activeTopology()) {
        return ['r3', 't3', 'r3_random', 'rp3'].includes(mode) ? 6 : 8;
    }

    createLogic() {
        const activeTopology = this.activeTopology();
        const lattice = this.logicLattice();
        const requestedSize = this.boardSize();
        const needsEvenHoneycombSeam = lattice === HONEYCOMB_LATTICE
            && (activeTopology === REVERSI_TOPOLOGIES.T2 || activeTopology === REVERSI_TOPOLOGIES.CYLINDER);
        const size = needsEvenHoneycombSeam && requestedSize % 2
            ? (requestedSize < 19 ? requestedSize + 1 : requestedSize - 1)
            : requestedSize;
        return new ReversiGame({
            topology: activeTopology,
            lattice,
            size,
            maxSize: 19
        });
    }

    bindEvents() {
        this.modeSelect.addEventListener('change', () => {
            this.setSizeSelection(this.defaultBoardSizeForMode());
            this.resetGame();
        });
        this.boundarySelect?.addEventListener('change', () => {
            this.setSizeSelection(this.defaultBoardSizeForMode());
            this.resetGame();
        });
        this.latticeSelect.addEventListener('change', () => this.resetGame());
        this.surfaceViewSelect?.addEventListener('change', () => {
            this.renderer.signature = '';
            this.updateUI();
        });
        this.sizeSelect.addEventListener('change', () => {
            this.updateCustomSizeVisibility();
            this.resetGame();
        });
        this.customSizeInput.addEventListener('change', () => {
            this.setSizeSelection(this.customSizeInput.value);
            this.resetGame();
        });
        this.timeEvolutionSelect?.addEventListener('change', () => this.updateUI());
        this.timeLifetimeInput?.addEventListener('change', () => this.updateUI());
        this.noiseModeSelect?.addEventListener('change', () => this.updateUI());
        this.noisePeriodInput?.addEventListener('change', () => this.updateUI());
        this.passBtn.addEventListener('click', () => this.passTurn());
        this.newGameBtn.addEventListener('click', () => this.resetGame({ broadcast: true }));
        this.cameraResetBtn?.addEventListener('click', () => {
            this.clearR3SliceFilters(false);
            this.renderer.resetCamera();
            this.updateUI();
        });
        document.getElementById('boardCameraPad')?.addEventListener('click', (event) => {
            const button = event.target.closest?.('button[data-camera-view]');
            if (!button) return;
            if (button.dataset.cameraView === 'home') this.clearR3SliceFilters(false);
            this.renderer.setCameraView(button.dataset.cameraView || 'home');
            this.updateUI();
        });
        for (const input of Object.values(this.sliceInputs || {})) {
            input?.addEventListener('input', () => this.refreshR3SliceFilter());
            input?.addEventListener('change', () => this.refreshR3SliceFilter());
        }
        this.focusOwnPiecesBtn?.addEventListener('click', () => this.togglePieceFocus());
        this.gameModeSelect?.addEventListener('change', () => this.updateOnlineControls());
        document.getElementById('createRoomBtn')?.addEventListener('click', () => this.network.createRoom());
        document.getElementById('findMatchBtn')?.addEventListener('click', () => this.network.findMatch());
        document.getElementById('joinRoomBtn')?.addEventListener('click', () => this.network.joinRoom(this.roomIdInput.value));
        this.copyLinkBtn?.addEventListener('click', async () => {
            if (!this.shareLinkInput?.value) return;
            await navigator.clipboard?.writeText(this.shareLinkInput.value);
            this.copyLinkBtn.textContent = 'Copied';
            window.setTimeout(() => { this.copyLinkBtn.textContent = 'Copy'; }, 1000);
        });
        this.chatSendBtn?.addEventListener('click', () => this.sendChatMessage());
        this.chatInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' || event.shiftKey) return;
            event.preventDefault();
            this.sendChatMessage();
        });
    }

    updateCustomSizeVisibility() {
        this.customSizeInput.hidden = this.sizeSelect.value !== 'custom';
    }

    latticeOptionsForMode(mode = this.modeSelect.value) {
        if (mode === 'r3') return [SQUARE_LATTICE, HCP_LATTICE];
        if (mode === REVERSI_TOPOLOGIES.T2) return [SQUARE_LATTICE, HONEYCOMB_LATTICE];
        if (mode === REVERSI_TOPOLOGIES.CYLINDER) return [SQUARE_LATTICE, HONEYCOMB_LATTICE];
        if (mode === REVERSI_TOPOLOGIES.SPHERE) return [SPHERE_COORDINATE_LATTICE];
        return [SQUARE_LATTICE];
    }

    syncLatticeOptions(mode = this.modeSelect.value) {
        const allowed = this.latticeOptionsForMode(mode);
        this.latticeGroup.hidden = allowed.length <= 1 && allowed[0] === SQUARE_LATTICE;
        for (const option of this.latticeSelect.options) {
            option.hidden = !allowed.includes(option.value);
            option.disabled = !allowed.includes(option.value);
        }
        if (!allowed.includes(this.latticeSelect.value)) {
            this.latticeSelect.value = allowed[0];
        }
        return this.latticeSelect.value;
    }

    syncLayerControl() {
        this.layerGroup.hidden = true;
        this.layerInfo.textContent = 'Full 3D board';
        this.layerSelect.value = '0';
        const mode = this.modeSelect.value;
        const volumeBoard = mode === 'r3';
        if (this.boundaryGroup) this.boundaryGroup.hidden = !volumeBoard;
        if (this.boundarySelect) this.boundarySelect.disabled = !volumeBoard;
        if (!volumeBoard) {
            this.boundarySelect.value = 'r3';
        }
        this.syncLatticeOptions(mode);
    }

    currentLattice() {
        return this.syncLatticeOptions(this.modeSelect.value);
    }

    latticeLabel(lattice = this.currentLattice()) {
        return ({
            [SQUARE_LATTICE]: 'Standard',
            [HCP_LATTICE]: 'HCP',
            [HONEYCOMB_LATTICE]: 'Honeycomb',
            [KAGOME_LATTICE]: 'Kagome',
            [SPHERE_COORDINATE_LATTICE]: 'Geodesic'
        })[lattice] || lattice;
    }

    logicLattice() {
        const mode = this.modeSelect.value;
        const lattice = this.currentLattice();
        if (mode === REVERSI_TOPOLOGIES.SPHERE) return SQUARE_LATTICE;
        if (mode === 'r3') return lattice === HCP_LATTICE ? HCP_LATTICE : SQUARE_LATTICE;
        if (lattice === HONEYCOMB_LATTICE) return HONEYCOMB_LATTICE;
        if (lattice === KAGOME_LATTICE) return KAGOME_LATTICE;
        return SQUARE_LATTICE;
    }

    activeTopology() {
        return this.modeSelect.value === 'r3' ? (this.boundarySelect?.value || 'r3') : this.modeSelect.value;
    }

    sliceInputValue(input) {
        if (!input || String(input.value || '').trim() === '') return null;
        const parsed = Math.floor(Number(input.value));
        if (!Number.isFinite(parsed)) return null;
        return Math.max(0, parsed - 1);
    }

    r3SliceSettings() {
        return {
            x: this.sliceInputValue(this.sliceInputs?.x),
            y: this.sliceInputValue(this.sliceInputs?.y),
            z: this.sliceInputValue(this.sliceInputs?.z)
        };
    }

    r3SliceSignature() {
        if (!isR3LikeTopology(this.logic?.topology?.topology)) return '';
        const { x, y, z } = this.r3SliceSettings();
        return ['slice', x ?? '*', y ?? '*', z ?? '*'].join(':');
    }

    coordVisibleInSlice(coord) {
        if (!isR3LikeTopology(this.logic?.topology?.topology)) return true;
        const { x, y, z } = this.r3SliceSettings();
        return (x === null || coord[0] === x)
            && (y === null || coord[1] === y)
            && (z === null || coord[2] === z);
    }

    clearR3SliceFilters(update = true) {
        for (const input of Object.values(this.sliceInputs || {})) {
            if (input) input.value = '';
        }
        this.renderer.signature = '';
        this.hoverCoord = null;
        if (update) this.updateUI();
    }

    refreshR3SliceFilter() {
        this.renderer.signature = '';
        this.hoverCoord = null;
        this.updateUI();
    }

    updateR3SliceFilterVisibility() {
        if (!this.sliceFilterEl) return;
        this.sliceFilterEl.hidden = !isR3LikeTopology(this.logic?.topology?.topology);
    }

    shouldShowAgeRings() {
        return false;
    }

    pieceTimeConfig() {
        return normalizePieceTimeConfig({ enabled: false, mode: 'count', decay: false, lifespan: 12 });
    }

    noiseConfig() {
        return { mode: 'off', period: 1 };
    }

    ensureStoneAges() {
        for (const stone of this.logic.board.values()) {
            if (!Number.isFinite(Number(stone.age))) stone.age = 0;
        }
    }

    randomCoord(filter) {
        const coords = [];
        for (const coord of this.logic.topology.allCoords()) {
            if (!filter || filter(coord)) coords.push(coord);
        }
        if (!coords.length) return null;
        return coords[Math.floor(Math.random() * coords.length)];
    }

    applyNoiseTick({ mode, period }) {
        if (mode === 'off') return '';
        this.noiseTick += 1;
        const key = (coord) => this.logic.key(coord);

        if (mode === 'pieces') {
            const candidates = [...this.logic.board.entries()].filter(([, stone]) =>
                stone && Number(stone.age) > 0 && Number(stone.age) % period === 0);
            if (!candidates.length) return '';
            const [stoneKey, stone] = candidates[Math.floor(Math.random() * candidates.length)];
            stone.color = stone.color === 'black' ? 'white' : 'black';
            stone.age = 0;
            return 'noise flipped one aged stone';
        }

        if (this.noiseTick % period !== 0) return '';
        const coord = this.randomCoord();
        if (!coord) return '';
        const stone = this.logic.board.get(key(coord));
        if (stone) {
            stone.color = stone.color === 'black' ? 'white' : 'black';
            stone.age = 0;
            return 'whole-board noise flipped one stone';
        }
        this.logic.set(coord, { color: Math.random() < 0.5 ? 'black' : 'white', age: 0 });
        return 'whole-board noise seeded one stone';
    }

    advanceEvolution(protectedKeys = []) {
        this.ensureStoneAges();
        const messages = [];
        const before = JSON.stringify([...this.logic.board.entries()]);
        const time = this.pieceTimeConfig();
        const timeResult = advanceMapPieceAges(this.logic.board, {
            config: time,
            protectedKeys
        });
        if (time.decay && timeResult.expired.length) {
            messages.push(`${timeResult.expired.length} aged ${timeResult.expired.length === 1 ? 'stone vanished' : 'stones vanished'}`);
        }
        const noiseMessage = this.applyNoiseTick(this.noiseConfig());
        if (noiseMessage) messages.push(noiseMessage);

        if (JSON.stringify([...this.logic.board.entries()]) !== before) {
            this.logic.moveHistory.unshift({
                type: 'evolution',
                message: messages.join('; ') || 'External evolution changed the board'
            });
        }
        return messages.join('; ');
    }

    resetGame({ broadcast = false } = {}) {
        this.logic = this.createLogic();
        this.hoverCoord = null;
        this.noiseTick = 0;
        this.syncLayerControl();
        this.setStatus('New 3D Reversi game started.');
        this.updateUI();
        if (broadcast) this.broadcastState();
    }

    playAt(coord) {
        if (!coord) return;
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.capitalize(this.logic.currentPlayer)}.`);
            return;
        }
        const actor = this.logic.currentPlayer;
        const result = this.logic.play(coord);
        if (!result.ok) {
            this.setStatus(result.reason === 'illegal' ? 'That vertex does not bracket any opponent stones.' : 'Move unavailable.');
            this.updateUI();
            return;
        }
        this.hoverCoord = null;
        const protectedKeys = [this.logic.key(result.coord), ...(this.logic.lastFlipped || [])];
        const evolution = this.advanceEvolution(protectedKeys);
        const base = `${this.capitalize(actor)} flipped ${result.flipped} ${result.flipped === 1 ? 'stone' : 'stones'}.`;
        this.setStatus(evolution ? `${base} ${evolution}.` : base);
        this.updateUI();
        this.broadcastState();
    }

    passTurn() {
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.capitalize(this.logic.currentPlayer)}.`);
            return;
        }
        const result = this.logic.pass();
        if (!result.ok) {
            this.setStatus(result.reason === 'legal-moves' ? 'You can only pass when no legal move exists.' : 'Pass unavailable.');
            this.updateUI();
            return;
        }
        const evolution = this.advanceEvolution();
        this.setStatus(evolution ? `Turn passed. ${evolution}.` : 'Turn passed.');
        this.updateUI();
        this.broadcastState();
    }

    updateUI() {
        this.updateCustomSizeVisibility();
        this.syncSurfaceViewControl();
        this.syncLayerControl();
        const counts = this.logic.counts();
        this.blackScoreEl.textContent = counts.black;
        this.whiteScoreEl.textContent = counts.white;
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : `${this.capitalize(this.logic.currentPlayer)} to play`;
        this.summaryEl.textContent = `${counts.black + counts.white} stones on board, ${counts.empty} empty`;
        this.passBtn.disabled = this.logic.gameOver || this.logic.legalMoves(this.logic.currentPlayer).length > 0;
        const mode = this.activeTopology();
        const lattice = this.currentLattice();
        const latticeLabel = this.latticeLabel(lattice);
        const modeText = {
            r3: lattice === HCP_LATTICE ? 'R3 HCP' : 'R3 Standard',
            t3: lattice === HCP_LATTICE ? 'R3 HCP / T3 PBC' : 'R3 / T3 PBC',
            r3_random: lattice === HCP_LATTICE ? 'R3 HCP / 3D RBC' : 'R3 / 3D RBC',
            rp3: lattice === HCP_LATTICE ? 'R3 HCP / RP3' : 'R3 / RP3',
            t2: lattice === HONEYCOMB_LATTICE ? 'T2 Honeycomb' : lattice === KAGOME_LATTICE ? 'T2 Kagome' : 'T2 Standard',
            cylinder: lattice === HONEYCOMB_LATTICE ? 'Cylinder Honeycomb' : lattice === KAGOME_LATTICE ? 'Cylinder Kagome' : 'Cylinder Standard',
            sphere: `S2 ${latticeLabel}`,
            klein: 'Klein Bottle',
            mobius: 'Mobius Strip',
            rp2: 'RP2'
        };
        const modeInfo = {
            r3: lattice === HCP_LATTICE
                ? 'R3 HCP uses offset hexagonal close-packed site vertices with 12 nearest-neighbor bracket directions.'
                : 'R3 Standard uses ordinary open cubic site vertices. Reversi brackets can run through all 26 graph ray directions.',
            t3: 'T3 is the all-side periodic boundary condition on the R3 board. It wraps x, y, and z, so every volume axis is periodic.',
            r3_random: '3D RBC is the random boundary condition on the R3 board. It uses one fixed seeded random map from each cube-boundary exit to another boundary point.',
            rp3: 'RP3 is an antipodal boundary condition on the R3 board: exiting one cube face enters the opposite face with the other two coordinates reversed.',
            t2: lattice === HONEYCOMB_LATTICE
                ? 'T2 honeycomb uses a zigzag nanotube-style hexagon net wrapped on a torus. Reversi stones occupy face centers; bracket rays follow only directly shared hex-cell edges. Use 2D Cut View to verify PBC crossings.'
                : lattice === KAGOME_LATTICE
                ? 'T2 Kagome uses a staggered triangle-hexagon graph wrapped on the torus. Reversi stones occupy visible graph sites.'
                : 'T2 is rendered as a solid rotatable torus. Reversi stones occupy face cells and both board directions wrap on the surface.',
            cylinder: lattice === HONEYCOMB_LATTICE
                ? 'Cylinder honeycomb wraps zigzag hexagon rings around the circumference, like a carbon nanotube. Reversi stones occupy face-cell centers.'
                : lattice === KAGOME_LATTICE
                ? 'Cylinder Kagome winds alternating triangle and hexagon graph links around the cylinder. Top and bottom remain open.'
                : 'Cylinder Reversi uses face cells on the surface: left-right wraps around the circumference while top and bottom remain open.',
            sphere: 'S2 Geodesic shows longitude-latitude arcs with playable pole nodes. Sphere Reversi remains vertex-based at the singular caps.',
            klein: 'Klein bottle uses face cells on the non-orientable surface, with normal left-right wrap and flipped top-bottom wrap on the board graph.',
            mobius: 'Mobius strip uses face cells on a solid twisted band. Horizontal seam crossings flip the transverse coordinate.',
            rp2: 'RP2 identifies opposite boundary edges with antipodal flips in both board directions.'
        };
        this.modeDisplay.textContent = modeText[mode] || modeText.r3;
        this.modeInfo.textContent = modeInfo[mode] || modeInfo.r3;
        if (this.logic.gameOver) this.setStatus(this.resultText());
        this.renderHistory();
        this.renderer.renderGame(this.logic);
        this.syncPieceFocus();
    }

    focusColor() {
        return this.gameModeSelect?.value === 'online' && this.myColor ? this.myColor : this.logic.currentPlayer;
    }

    surfaceViewMode() {
        return this.surfaceViewSelect?.value || '3d';
    }

    syncSurfaceViewControl() {
        const show = this.activeTopology() === REVERSI_TOPOLOGIES.T2 && this.currentLattice() === HONEYCOMB_LATTICE;
        if (this.surfaceViewGroup) this.surfaceViewGroup.hidden = !show;
        if (!show && this.surfaceViewSelect) this.surfaceViewSelect.value = '3d';
    }

    togglePieceFocus() {
        this.focusOwnPieces = !this.focusOwnPieces;
        this.syncPieceFocus();
    }

    syncPieceFocus() {
        const color = this.focusOwnPieces ? this.focusColor() : null;
        this.renderer.setPieceFocus(color);
        this.focusOwnPiecesBtn?.setAttribute('aria-pressed', String(this.focusOwnPieces));
    }

    renderHistory() {
        if (!this.logic.moveHistory.length) {
            this.historyEl.innerHTML = '<div class="move-history-item muted">Game started.</div>';
            return;
        }
        this.historyEl.innerHTML = this.logic.moveHistory.slice(0, 80).map((move) => {
            if (move.type === 'move') return `<div class="move-history-item">${move.number}. ${this.capitalize(move.color)} (${move.coord.map((v) => v + 1).join(',')}) flipped ${move.flipped}</div>`;
            if (move.type === 'pass') return `<div class="move-history-item">${this.capitalize(move.color)} ${move.automatic ? 'auto-passed' : 'passed'}</div>`;
            if (move.type === 'no-move-end') return `<div class="move-history-item">${this.capitalize(move.color)} has no legal moves. Final count.</div>`;
            if (move.type === 'evolution') return `<div class="move-history-item">${this.escapeHTML(move.message || 'External evolution changed the board')}</div>`;
            return '';
        }).join('');
    }

    resultText() {
        if (!this.logic.gameOver) return '';
        const counts = this.logic.counts();
        if (this.logic.winner === 'draw') return `Draw (Black ${counts.black}, White ${counts.white})`;
        const margin = Math.abs(counts.black - counts.white);
        return `${this.capitalize(this.logic.winner)} wins by ${margin} (Black ${counts.black}, White ${counts.white})`;
    }

    canActFor(color) {
        return this.gameModeSelect?.value !== 'online' || (this.network?.isConnected && this.myColor === color);
    }

    updateOnlineControls() {
        const online = this.gameModeSelect?.value === 'online';
        if (this.onlineControls) this.onlineControls.hidden = !online;
        if (!online) {
            this.myColor = null;
            this.network?.close?.({ silent: true });
            this.setOnlineColor(null);
        }
    }

    setOnlineColor(color, roomId = this.network?.roomId) {
        this.myColor = color;
        if (this.onlineColorEl) {
            
            this.onlineColorEl.hidden = !color;
            this.onlineColorEl.textContent = color ? `Online as ${this.capitalize(color)}` : '';
        }
        if (this.shareLinkInput && roomId) {
            const url = new URL(window.location.href);
            url.searchParams.set('room', roomId);
            this.shareLinkInput.value = url.href;
        }
    }

    tryJoinSharedRoomFromUrl() {
        const roomId = new URLSearchParams(window.location.search).get('room');
        if (!roomId || !this.gameModeSelect) return;
        this.gameModeSelect.value = 'online';
        this.updateOnlineControls();
        if (this.roomIdInput) this.roomIdInput.value = roomId;
        window.setTimeout(() => this.network.resumeOrJoinRoom(roomId), 150);
    }

    onlineGameKey() {
        return '3dreversi';
    }

    onlineMatchKey() {
        return ['3dreversi', this.activeTopology(), this.currentLattice(), this.boardSize()].join(':');
    }

    exportNetworkState() {
        return {
            logic: this.logic.exportState(),
            mode: this.activeTopology(),
            boardSpace: this.modeSelect.value,
            boundary: this.boundarySelect?.value || 'r3',
            lattice: this.currentLattice(),
            size: this.boardSize(),
            noiseTick: this.noiseTick,
            timeEvolution: this.timeEvolutionSelect?.value || 'off',
            timeLifetime: Math.max(1, Math.min(512, Math.floor(Number(this.timeLifetimeInput?.value) || 12))),
            noiseMode: this.noiseModeSelect?.value || 'off',
            noisePeriod: Math.max(1, Math.min(512, Math.floor(Number(this.noisePeriodInput?.value) || 6)))
        };
    }

    importNetworkState(state) {
        if (!state?.logic) return;
        this.logic.importState(state.logic);
        const topology = state.mode || this.logic.topology.topology || this.modeSelect.value;
        if (['r3', 't3', 'r3_random', 'rp3'].includes(topology)) {
            this.modeSelect.value = 'r3';
            if (this.boundarySelect) this.boundarySelect.value = topology;
        } else {
            this.modeSelect.value = topology;
            if (this.boundarySelect) this.boundarySelect.value = 'r3';
        }
        this.latticeSelect.value = state.lattice || this.currentLattice();
        this.setSizeSelection(state.size || this.logic.topology.width);
        if (this.timeEvolutionSelect) this.timeEvolutionSelect.value = state.timeEvolution || 'off';
        if (this.timeLifetimeInput) this.timeLifetimeInput.value = String(state.timeLifetime || 12);
        if (this.noiseModeSelect) this.noiseModeSelect.value = state.noiseMode || 'off';
        if (this.noisePeriodInput) this.noisePeriodInput.value = String(state.noisePeriod || 6);
        this.noiseTick = Number(state.noiseTick) || 0;
        this.syncLayerControl();
        this.setStatus('Synced online game.');
        this.updateUI();
    }

    broadcastState() {
        if (this.gameModeSelect?.value === 'online' && this.network?.isConnected) this.network.sendState();
    }

    sendChatMessage() {
        const text = this.chatInput?.value.trim();
        if (!text) return;
        if (this.gameModeSelect?.value !== 'online' || !this.network?.isConnected) {
            this.setStatus('Connect online before chatting.');
            return;
        }
        this.network.sendChat({ text });
        this.chatInput.value = '';
    }

    renderOnlineChatMessages(messages = []) {
        if (!this.chatMessagesEl) return;
        if (!messages.length) {
            this.chatMessagesEl.innerHTML = '<div class="chat-empty">Connect online to chat.</div>';
            return;
        }
        this.chatMessagesEl.innerHTML = messages.map((message) => `<div class="chat-message"><div class="chat-meta">${this.escapeHTML(message.displayName || this.capitalize(message.player || 'player'))}</div><div class="chat-text">${this.escapeHTML(message.text || '')}</div></div>`).join('');
        this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;
    }

    escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }

    setStatus(text) {
        this.statusEl.textContent = text;
    }

    capitalize(value) {
        return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
    }
}

try {
    window.reversi3dApp = new Reversi3DApp();
    installReversi3DRobot(window.reversi3dApp);
} catch (error) {
    window.drawReversiFallback?.(error);
}
installGameUILocalizer();
