import * as THREE from 'three';
import { installReversi3DRobot } from './robot/Reversi3DRobot.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ReversiGame, REVERSI_TOPOLOGIES, normalizeReversiSize, normalizeReversiTopology } from '../../../js/reversi/ReversiGame.js';
import { FirebaseStateNetworkManager } from '../../../js/FirebaseStateNetworkManager.js';
import {
    createKleinBottleSurfaceGeometry,
    kleinBottleGraphEdgePoints,
    kleinBottlePose
} from '../../../js/geometry/KleinBottleGeometry.js';
import {
    advanceMapPieceAges,
    normalizePieceTimeConfig
} from '../../../js/time/PieceAgeClock.js';

const TWO_PI = Math.PI * 2;
const MOBIUS_BAND_RADIUS = 3.05;
const MOBIUS_BAND_HALF_WIDTH = 1.18;
const R3_LIKE_TOPOLOGIES = new Set([
    REVERSI_TOPOLOGIES.R3,
    REVERSI_TOPOLOGIES.T3,
    REVERSI_TOPOLOGIES.R3_RANDOM
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
        this.pointCoords = [];
        this.pointPositions = [];
        this.nodePoints = null;
        this.signature = '';
        this.clock = new THREE.Clock();
        this.initLights();
        this.bind();
        this.resize();
        this.resetCamera();
        this.animate();
    }

    initLights() {
        this.scene.add(new THREE.AmbientLight(0xeaf6ff, 0.42));
        this.scene.add(new THREE.HemisphereLight(0xe0f7ff, 0x17110d, 1.65));
        const key = new THREE.DirectionalLight(0xffffff, 2.35);
        key.position.set(6, 9, 7);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        this.scene.add(key);
        const fill = new THREE.PointLight(0x48c7f4, 1.45, 34);
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
        const signature = [
            topology.topology,
            topology.lattice,
            topology.width,
            topology.height,
            topology.depth
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
        else if (topology.topology === REVERSI_TOPOLOGIES.T2) this.buildTorus(topology.width, topology.height);
        else if (topology.topology === REVERSI_TOPOLOGIES.MOBIUS) this.buildMobius(topology.width, topology.height);
        else if (topology.topology === REVERSI_TOPOLOGIES.KLEIN) this.buildKlein(topology);
        else if (topology.topology === REVERSI_TOPOLOGIES.RP2) {
            this.buildFlatNonOrientable(topology.width, topology.height, topology.topology);
        }
        else this.buildSphere(topology.width, topology.height);

        this.resetCamera();
    }

    buildR3(topology) {
        const { width, height, depth, lattice } = topology;
        const linePositions = [];
        const addSegment = (a, b) => linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        if (lattice === 'hcp') {
            const drawn = new Set();
            for (const coord of topology.allCoords()) {
                for (const direction of topology.directionsFor(coord)) {
                    const next = topology.step(coord, direction);
                    if (!next) continue;
                    const edgeKey = [coord.join(','), next.join(',')].sort().join('|');
                    if (drawn.has(edgeKey)) continue;
                    drawn.add(edgeKey);
                    addSegment(this.r3Position(coord, topology), this.r3Position(next, topology));
                }
            }
        } else {
            for (let z = 0; z < depth; z += 1) {
                for (let y = 0; y < height; y += 1) addSegment(this.r3Position([0, y, z], topology), this.r3Position([width - 1, y, z], topology));
                for (let x = 0; x < width; x += 1) addSegment(this.r3Position([x, 0, z], topology), this.r3Position([x, height - 1, z], topology));
            }
            for (let x = 0; x < width; x += 1) {
                for (let y = 0; y < height; y += 1) addSegment(this.r3Position([x, y, 0], topology), this.r3Position([x, y, depth - 1], topology));
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.24 })
        ));

        const pointPositions = [];
        for (let z = 0; z < depth; z += 1) {
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    const coord = [x, y, z];
                    const p = this.r3Position(coord, topology);
                    this.pointCoords.push(coord);
                    this.pointPositions.push(p);
                    pointPositions.push(p.x, p.y, p.z);
                }
            }
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.068 : width <= 13 ? 0.052 : 0.038, {
            color: 0xdff8ff,
            opacity: 0.82
        });
        const axes = new THREE.AxesHelper(this.r3Scale(topology) * Math.max(width, height, depth) * 0.62);
        axes.material.depthTest = false;
        axes.renderOrder = 3;
        this.boardGroup.add(axes);
    }

    buildTorus(width, height) {
        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(3.35, 1.22, 64, 192),
            new THREE.MeshPhysicalMaterial({
                color: 0x9b6838,
                roughness: 0.52,
                metalness: 0.03,
                clearcoat: 0.32,
                clearcoatRoughness: 0.46
            })
        );
        torus.castShadow = true;
        torus.receiveShadow = true;
        this.boardGroup.add(torus);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x1e120b,
            transparent: true,
            opacity: 0.84,
            depthWrite: false
        });
        for (let y = 0; y < height; y += 1) this.boardGroup.add(this.torusLine(width, height, 'x', y, gridMaterial));
        for (let x = 0; x < width; x += 1) this.boardGroup.add(this.torusLine(width, height, 'y', x, gridMaterial));

        const pointPositions = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const coord = [x, y];
                const p = this.torusPosition(coord, width, height, 0.07).position;
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

    buildMobius(width, height) {
        const surface = new THREE.Mesh(
            this.createMobiusSurfaceGeometry(220, 48, -0.018),
            new THREE.MeshPhysicalMaterial({
                color: 0x8f6238,
                roughness: 0.58,
                metalness: 0.02,
                transparent: false,
                opacity: 1,
                depthWrite: true,
                clearcoat: 0.28,
                clearcoatRoughness: 0.48,
                side: THREE.DoubleSide
            })
        );
        surface.castShadow = true;
        surface.receiveShadow = true;
        surface.userData.kleinPickOccluder = true;
        this.boardGroup.add(surface);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x050505,
            transparent: true,
            opacity: 0.9,
            depthTest: true,
            depthWrite: false
        });
        const seamMaterial = new THREE.LineBasicMaterial({
            color: 0x050505,
            transparent: true,
            opacity: 0.95,
            depthTest: true,
            depthWrite: false
        });
        const topology = this.app.logic.topology;
        const addLine = (points, material = gridMaterial) => {
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
            line.renderOrder = 2;
            this.boardGroup.add(line);
        };

        const drawn = new Set();
        for (const coord of topology.allCoords()) {
            for (const direction of [[1, 0], [0, 1]]) {
                const neighbor = topology.step(coord, direction);
                if (!neighbor) continue;
                const edgeKey = [topology.key(coord), topology.key(neighbor)].sort().join('|');
                if (drawn.has(edgeKey)) continue;
                drawn.add(edgeKey);
                const seam = this.isMobiusSeamEdge(coord, neighbor, width);
                addLine(
                    this.mobiusGraphEdgePoints(coord, neighbor, width, height, 0.052, seam ? 34 : 22),
                    seam ? seamMaterial : gridMaterial
                );
            }
        }

        const pointPositions = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const coord = [x, y];
                const pose = this.mobiusPose(coord, width, height, 0.08);
                this.pointCoords.push(coord);
                this.pointPositions.push(pose.position);
                pointPositions.push(pose.position.x, pose.position.y, pose.position.z);
            }
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.08 : width <= 13 ? 0.058 : 0.044, {
            color: 0xffe3a3,
            opacity: 0.98,
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

    buildKlein(topology) {
        const { width, height } = topology;
        const surface = new THREE.Mesh(
            createKleinBottleSurfaceGeometry({ uSegments: 240, vSegments: 96, lift: -0.018 }),
            new THREE.MeshPhysicalMaterial({
                color: 0x8a6a39,
                roughness: 0.58,
                metalness: 0.02,
                transparent: false,
                opacity: 1,
                depthWrite: true,
                clearcoat: 0.24,
                clearcoatRoughness: 0.48,
                side: THREE.DoubleSide
            })
        );
        surface.castShadow = true;
        surface.receiveShadow = true;
        surface.userData.kleinPickOccluder = true;
        this.boardGroup.add(surface);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x050505,
            transparent: true,
            opacity: 0.9,
            depthTest: true,
            depthWrite: false
        });
        const seamMaterial = new THREE.LineBasicMaterial({
            color: 0x050505,
            transparent: true,
            opacity: 0.95,
            depthTest: true,
            depthWrite: false
        });
        const addLine = (points, material = gridMaterial) => {
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
            line.renderOrder = 2;
            this.boardGroup.add(line);
        };

        const drawn = new Set();
        for (const coord of topology.allCoords()) {
            for (const direction of [[1, 0], [0, 1]]) {
                const neighbor = topology.step(coord, direction);
                if (!neighbor) continue;
                const edgeKey = [topology.key(coord), topology.key(neighbor)].sort().join('|');
                if (drawn.has(edgeKey)) continue;
                drawn.add(edgeKey);
                const seam = Math.abs(coord[0] - neighbor[0]) > 1 || Math.abs(coord[1] - neighbor[1]) > 1;
                addLine(kleinBottleGraphEdgePoints(coord, neighbor, width, height, 0.055), seam ? seamMaterial : gridMaterial);
            }
        }

        const pointPositions = [];
        for (const coord of topology.allCoords()) {
            const pose = kleinBottlePose(coord, width, height, 0.095);
            this.pointCoords.push(coord);
            this.pointPositions.push(pose.position);
            pointPositions.push(pose.position.x, pose.position.y, pose.position.z);
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.074 : width <= 13 ? 0.054 : 0.039, {
            color: 0xf0fdf4,
            opacity: 0.96,
            depthTest: true,
            renderOrder: 3
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
                const point = this.flatPosition(coord, width, height, 0.02);
                this.pointCoords.push(coord);
                this.pointPositions.push(point);
                pointPositions.push(point.x, point.y, point.z);
                if (x < width - 1) {
                    const next = this.flatPosition([x + 1, y], width, height, 0.02);
                    linePositions.push(point.x, point.y, point.z, next.x, next.y, next.z);
                }
                if (y < height - 1) {
                    const next = this.flatPosition([x, y + 1], width, height, 0.02);
                    linePositions.push(point.x, point.y, point.z, next.x, next.y, next.z);
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
        const radius = 3.5;
        const surface = new THREE.Mesh(
            new THREE.SphereGeometry(radius - 0.045, 96, 48),
            new THREE.MeshPhysicalMaterial({
                color: 0x604a2b,
                roughness: 0.62,
                metalness: 0.02,
                transparent: true,
                opacity: 0.68,
                clearcoat: 0.18
            })
        );
        surface.castShadow = true;
        surface.receiveShadow = true;
        this.boardGroup.add(surface);

        const linePositions = [];
        const addEdge = (a, b) => linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const current = this.spherePosition([x, y], width, height, 0.045);
                addEdge(current, this.spherePosition([(x + 1) % width, y], width, height, 0.045));
                if (y < height - 1) addEdge(current, this.spherePosition([x, y + 1], width, height, 0.045));
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({ color: 0xd8b36b, transparent: true, opacity: 0.74 })
        ));

        const pointPositions = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const coord = [x, y];
                const point = this.spherePosition(coord, width, height, 0.08);
                this.pointCoords.push(coord);
                this.pointPositions.push(point);
                pointPositions.push(point.x, point.y, point.z);
            }
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.082 : width <= 13 ? 0.06 : 0.045, {
            color: 0xffe3a3,
            opacity: 0.98
        });
    }

    torusLine(width, height, varyingAxis, fixedValue, material) {
        const points = [];
        const segments = Math.max(96, Math.max(width, height) * 8);
        for (let i = 0; i <= segments; i += 1) {
            const value = i / segments;
            const coord = varyingAxis === 'x'
                ? [value * width, fixedValue]
                : [fixedValue, value * height];
            points.push(this.torusPosition(coord, width, height, 0.04).position);
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
        for (const [key, stone] of logic.board.entries()) {
            const coord = key.split(',').map(Number);
            const p = this.positionForCoord(coord, logic, 0.18);
            if (stone.color === 'black') black.push(p);
            else white.push(p);
        }
        this.addStoneInstances(black, 'black', logic);
        this.addStoneInstances(white, 'white', logic);
    }

    renderLegalMoves(logic) {
        this.clearGroup(this.markerGroup);
        const positions = logic.legalMoves().map((move) => this.positionForCoord(move.coord, logic, 0.22));
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
        const stoneMaterial = new THREE.MeshPhysicalMaterial({
            color: color === 'black' ? 0x05070a : 0xf5f7fb,
            roughness: color === 'black' ? 0.34 : 0.2,
            metalness: 0.04,
            clearcoat: 0.18
        });
        const dotMaterial = new THREE.MeshStandardMaterial({
            color: color === 'black' ? 0x48c7f4 : 0xf2c464,
            emissive: color === 'black' ? 0x48c7f4 : 0xf2c464,
            emissiveIntensity: 1.35
        });
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
        this.stoneGroup.add(stoneMesh, dotMesh);
    }

    markerRadius(logic) {
        const size = Math.max(logic.topology.width, logic.topology.height, logic.topology.depth);
        if (isR3LikeTopology(logic.topology.topology)) return size <= 9 ? 0.18 : size <= 13 ? 0.13 : 0.095;
        return size <= 9 ? 0.17 : size <= 13 ? 0.135 : 0.105;
    }

    setHover(coord, logic = this.app.logic) {
        this.clearGroup(this.hoverGroup);
        if (!coord || !logic || logic.gameOver) return;
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

    pickCoord(event) {
        if (!this.nodePoints) return null;
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObject(this.nodePoints, false);
        const hit = hits.find((candidate) => this.pickHitIsCameraFacing(candidate));
        return hit ? this.pointCoords[hit.index] || null : null;
    }

    pickHitIsCameraFacing(hit) {
        const logic = this.app.logic;
        const mode = logic?.topology?.topology;
        if (!hit || ![REVERSI_TOPOLOGIES.T2, REVERSI_TOPOLOGIES.KLEIN, REVERSI_TOPOLOGIES.MOBIUS].includes(mode)) return Boolean(hit);
        const coord = this.pointCoords[hit.index];
        if (!coord) return false;
        const pose = mode === REVERSI_TOPOLOGIES.T2
            ? this.torusPosition(coord, logic.topology.width, logic.topology.height, 0.07)
            : mode === REVERSI_TOPOLOGIES.KLEIN
                ? kleinBottlePose(coord, logic.topology.width, logic.topology.height, 0.095)
            : this.mobiusPose(coord, logic.topology.width, logic.topology.height, 0.08);
        if (!this.isPoseFacingCamera(pose.position, pose.normal)) return false;
        if (mode === REVERSI_TOPOLOGIES.KLEIN && this.kleinSurfaceOccludes(hit, pose)) return false;
        return true;
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
        return nearest.distance < hit.distance - 0.08 && !this.kleinClickThroughWindow(pose);
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
        if (coord) this.app.playAt(coord);
    }

    positionForCoord(coord, logic, lift = 0) {
        const topology = logic.topology;
        if (topology.topology === REVERSI_TOPOLOGIES.T2) return this.torusPosition(coord, topology.width, topology.height, lift).position;
        if (topology.topology === REVERSI_TOPOLOGIES.MOBIUS) return this.mobiusPose(coord, topology.width, topology.height, lift).position;
        if (topology.topology === REVERSI_TOPOLOGIES.KLEIN) return kleinBottlePose(coord, topology.width, topology.height, lift).position;
        if (topology.topology === REVERSI_TOPOLOGIES.RP2) return this.flatPosition(coord, topology.width, topology.height, lift);
        if (topology.topology === REVERSI_TOPOLOGIES.SPHERE) return this.spherePosition(coord, topology.width, topology.height, lift);
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

    torusPosition(coord, width, height, lift = 0) {
        const majorRadius = 3.35;
        const minorRadius = 1.22;
        const u = (Number(coord[0]) / Math.max(1, width)) * TWO_PI;
        const v = (Number(coord[1]) / Math.max(1, height)) * TWO_PI;
        const tubeRadius = minorRadius + lift;
        const ringRadius = majorRadius + tubeRadius * Math.cos(v);
        const position = new THREE.Vector3(
            ringRadius * Math.cos(u),
            ringRadius * Math.sin(u),
            tubeRadius * Math.sin(v)
        );
        const normal = new THREE.Vector3(
            Math.cos(u) * Math.cos(v),
            Math.sin(u) * Math.cos(v),
            Math.sin(v)
        ).normalize();
        return { position, normal };
    }

    flatPosition(coord, width, height, lift = 0) {
        const scale = 7 / Math.max(width - 1, height - 1);
        return new THREE.Vector3(
            (coord[0] - (width - 1) / 2) * scale,
            ((height - 1) / 2 - coord[1]) * scale,
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

    mobiusPose(coord, width, height, lift = 0) {
        const u = (Number(coord[0]) / Math.max(1, width)) * TWO_PI;
        const t = this.mobiusTForY(Number(coord[1]), height);
        return {
            position: this.mobiusPoint(u, t, lift),
            normal: this.mobiusBasis(u, t).normal
        };
    }

    createMobiusSurfaceGeometry(uSegments = 220, tSegments = 48, lift = 0) {
        const positions = [];
        const indices = [];
        for (let iu = 0; iu <= uSegments; iu += 1) {
            const u = (iu / uSegments) * TWO_PI;
            for (let it = 0; it <= tSegments; it += 1) {
                const t = THREE.MathUtils.lerp(-MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, it / tSegments);
                const point = this.mobiusPoint(u, t, lift);
                positions.push(point.x, point.y, point.z);
            }
        }
        const row = tSegments + 1;
        for (let iu = 0; iu < uSegments; iu += 1) {
            for (let it = 0; it < tSegments; it += 1) {
                const a = iu * row + it;
                const b = (iu + 1) * row + it;
                const c = (iu + 1) * row + it + 1;
                const d = iu * row + it + 1;
                indices.push(a, b, d, b, c, d);
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    spherePosition(coord, width, height, lift = 0) {
        const radius = 3.5 + lift;
        const theta = Math.PI * (Number(coord[1]) + 1) / (Math.max(1, height) + 1);
        const phi = TWO_PI * Number(coord[0]) / Math.max(1, width);
        return new THREE.Vector3(
            radius * Math.sin(theta) * Math.cos(phi),
            radius * Math.sin(theta) * Math.sin(phi),
            radius * Math.cos(theta)
        );
    }

    resetCamera() {
        const mode = this.app?.logic?.topology?.topology || 'r3';
        if (mode === REVERSI_TOPOLOGIES.T2) this.camera.position.set(0, 5.7, 9.9);
        else if (mode === REVERSI_TOPOLOGIES.MOBIUS) this.camera.position.set(6.4, 4.8, 7.4);
        else if (mode === REVERSI_TOPOLOGIES.KLEIN) this.camera.position.set(9.4, 6.2, 12.4);
        else if (mode === REVERSI_TOPOLOGIES.SPHERE) this.camera.position.set(0, 2.0, 9.5);
        else if (mode === REVERSI_TOPOLOGIES.RP2) this.camera.position.set(0, 0, 10.5);
        else this.camera.position.set(7.9, 7.4, 8.2);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const elapsed = this.clock.getElapsedTime();
        this.markerGroup.children.forEach((child) => {
            if (child.material?.emissive) child.material.emissiveIntensity = 1.45 + Math.sin(elapsed * 2.2) * 0.28;
        });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

class Reversi3DApp {
    constructor() {
        this.modeSelect = document.getElementById('spaceSelect');
        this.latticeGroup = document.getElementById('latticeControlGroup');
        this.latticeSelect = document.getElementById('latticeSelect');
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
        this.modeSelect.value = ['r3', 't3', 'r3_random', 't2', 'sphere', 'klein', 'mobius', 'rp2'].includes(mode) ? mode : 'r3';
        const size = params.get('size');
        if (size !== null && size.trim() !== '' && Number.isFinite(Number(size))) this.setSizeSelection(size);
        const lattice = String(params.get('lattice') || '').toLowerCase();
        if (lattice === 'hcp') this.latticeSelect.value = 'hcp';
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

    createLogic() {
        return new ReversiGame({
            topology: this.modeSelect.value,
            lattice: this.currentLattice(),
            size: this.boardSize(),
            maxSize: 19
        });
    }

    bindEvents() {
        this.modeSelect.addEventListener('change', () => this.resetGame());
        this.latticeSelect.addEventListener('change', () => this.resetGame());
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
        this.cameraResetBtn?.addEventListener('click', () => this.renderer.resetCamera());
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

    syncLayerControl() {
        this.layerGroup.hidden = true;
        this.layerInfo.textContent = 'Full 3D board';
        this.layerSelect.value = '0';
        const mode = this.modeSelect.value;
        this.latticeGroup.hidden = mode !== 'r3';
        if (mode !== 'r3') this.latticeSelect.value = 'square';
    }

    currentLattice() {
        return this.modeSelect.value === 'r3' && this.latticeSelect.value === 'hcp' ? 'hcp' : 'square';
    }

    pieceTimeConfig() {
        const mode = this.timeEvolutionSelect?.value || 'off';
        const noiseEnabled = (this.noiseModeSelect?.value || 'off') !== 'off';
        return normalizePieceTimeConfig({
            enabled: mode !== 'off' || noiseEnabled,
            mode: mode === 'decay' ? 'decay' : 'count',
            decay: mode === 'decay',
            lifespan: this.timeLifetimeInput?.value || 12
        });
    }

    noiseConfig() {
        return {
            mode: this.noiseModeSelect?.value || 'off',
            period: Math.max(1, Math.min(512, Math.floor(Number(this.noisePeriodInput?.value) || 6)))
        };
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
        this.syncLayerControl();
        const counts = this.logic.counts();
        this.blackScoreEl.textContent = counts.black;
        this.whiteScoreEl.textContent = counts.white;
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : `${this.capitalize(this.logic.currentPlayer)} to play`;
        this.summaryEl.textContent = `${counts.black + counts.white} stones on board, ${counts.empty} empty`;
        this.passBtn.disabled = this.logic.gameOver || this.logic.legalMoves(this.logic.currentPlayer).length > 0;
        const mode = this.modeSelect.value;
        const lattice = this.currentLattice();
        const modeText = {
            r3: lattice === 'hcp' ? 'R3 HCP' : 'R3 Standard',
            t3: 'T3 PBC',
            r3_random: '3D RBC',
            t2: 'T2',
            sphere: 'S2',
            klein: 'Klein Bottle',
            mobius: 'Mobius Strip',
            rp2: 'RP2'
        };
        const modeInfo = {
            r3: lattice === 'hcp'
                ? 'R3 HCP uses offset hexagonal close-packed layers with 12 nearest-neighbor bracket directions.'
                : 'R3 Standard uses ordinary open cubic boundaries. Reversi brackets can run through all 26 graph ray directions.',
            t3: 'T3 PBC wraps x, y, and z, so every cubic axis is periodic.',
            r3_random: '3D RBC uses one fixed seeded random map from each cube-boundary exit to another boundary point.',
            t2: 'T2 is rendered as a solid rotatable torus. Both board directions wrap on the surface.',
            sphere: 'S2 is rendered as a rotatable latitude-ring sphere. Horizontal rays wrap by longitude and vertical rays stop at the caps.',
            klein: 'Klein bottle uses normal left-right wrap and flipped top-bottom wrap on the board graph.',
            mobius: 'Mobius strip is rendered as a solid twisted band. Horizontal seam crossings flip the transverse coordinate.',
            rp2: 'RP2 identifies opposite boundary edges with antipodal flips in both board directions.'
        };
        this.modeDisplay.textContent = modeText[mode] || modeText.r3;
        this.modeInfo.textContent = modeInfo[mode] || modeInfo.r3;
        if (this.logic.gameOver) this.setStatus(this.resultText());
        this.renderHistory();
        this.renderer.renderGame(this.logic);
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
        if (this.logic.winner === 'draw') return 'Draw';
        const counts = this.logic.counts();
        const margin = Math.abs(counts.black - counts.white);
        return `${this.capitalize(this.logic.winner)} wins by ${margin}`;
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
            this.onlineColorEl.textContent = color ? `Online as ${this.capitalize(color)}` : 'Local pass and play';
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
        return [
            '3dreversi',
            this.modeSelect.value,
            this.currentLattice(),
            this.boardSize(),
            this.timeEvolutionSelect?.value || 'off',
            Math.max(1, Math.min(512, Math.floor(Number(this.timeLifetimeInput?.value) || 12))),
            this.noiseModeSelect?.value || 'off',
            Math.max(1, Math.min(512, Math.floor(Number(this.noisePeriodInput?.value) || 6)))
        ].join(':');
    }

    exportNetworkState() {
        return {
            logic: this.logic.exportState(),
            mode: this.modeSelect.value,
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
        this.modeSelect.value = state.mode || this.logic.topology.topology || this.modeSelect.value;
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
        this.chatMessagesEl.innerHTML = messages.map((message) => `<div class="chat-message"><div class="chat-meta">${this.capitalize(message.player || 'player')}</div><div class="chat-text">${this.escapeHTML(message.text || '')}</div></div>`).join('');
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
