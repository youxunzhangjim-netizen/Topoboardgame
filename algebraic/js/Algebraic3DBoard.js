import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TWO_PI = Math.PI * 2;
const THREE_DIMENSIONAL_VIEWS = new Set(['r3', 'torus', 'sphere_latitude']);

function keyOf(coord) {
    return coord.join(',');
}

function disposeObject(object) {
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
    else object.material?.dispose?.();
    object.material?.map?.dispose?.();
}

function clearGroup(group) {
    while (group.children.length) {
        const child = group.children.pop();
        child.traverse?.(disposeObject);
        disposeObject(child);
    }
}

function anyonSymbol(type) {
    if (type === 'psi') return '\u03c8';
    if (type === 'sigma') return '\u03c3';
    if (type === 'tau') return '\u03c4';
    const znMatch = String(type || '').match(/^z(\d+)$/);
    if (znMatch) return `\u03b1${znMatch[1]}`;
    return type || '1';
}

function labelSprite(text, {
    foreground = '#f8fbff',
    background = 'rgba(6, 11, 16, 0.86)',
    scale = 0.52
} = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 96;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = background;
    context.beginPath();
    context.roundRect(18, 12, 156, 72, 22);
    context.fill();
    context.fillStyle = foreground;
    context.font = '700 44px Georgia, serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(text), 96, 49);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false
    }));
    sprite.scale.set(scale * 1.6, scale * 0.8, 1);
    return sprite;
}

export function usesAlgebraic3DView(topologyName) {
    return THREE_DIMENSIONAL_VIEWS.has(topologyName);
}

export class Algebraic3DBoard {
    constructor({ canvas, resetButton, onHover, onSelect }) {
        this.canvas = canvas;
        this.resetButton = resetButton;
        this.onHover = onHover;
        this.onSelect = onSelect;
        this.game = null;
        this.viewState = {};
        this.signature = '';
        this.pointerGesture = null;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x091016);
        this.camera = new THREE.PerspectiveCamera(47, 1, 0.1, 160);
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.075;
        this.controls.zoomSpeed = 0.45;
        this.controls.enablePan = false;
        this.controls.minDistance = 7;
        this.controls.maxDistance = 16;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 0.2;
        this.pointer = new THREE.Vector2();
        this.boardGroup = new THREE.Group();
        this.entityGroup = new THREE.Group();
        this.markerGroup = new THREE.Group();
        this.trailGroup = new THREE.Group();
        this.scene.add(this.boardGroup, this.trailGroup, this.entityGroup, this.markerGroup);
        this.nodePoints = null;
        this.pointCoords = [];
        this.pointPositions = [];

        this.addLights();
        this.bind();
        this.resetCamera();
        this.animate();
    }

    addLights() {
        this.scene.add(new THREE.HemisphereLight(0xdff7ff, 0x18100a, 1.65));
        const key = new THREE.DirectionalLight(0xffffff, 2.4);
        key.position.set(6, 9, 8);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        this.scene.add(key);
        const fill = new THREE.PointLight(0x42c6ff, 1.4, 34);
        fill.position.set(-7, 3, -5);
        this.scene.add(fill);
    }

    bind() {
        window.addEventListener('resize', () => this.resize());
        this.resetButton?.addEventListener('click', () => this.resetCamera());
        window.matchMedia?.('(pointer: coarse)')?.addEventListener?.('change', () => this.applySafeZoomRange());
        this.canvas.addEventListener('pointerdown', (event) => this.pointerDown(event));
        this.canvas.addEventListener('pointermove', (event) => this.pointerMove(event));
        this.canvas.addEventListener('pointerup', (event) => this.pointerUp(event));
        this.canvas.addEventListener('pointercancel', () => { this.pointerGesture = null; });
        this.canvas.addEventListener('pointerleave', () => this.onHover?.(null));
    }

    setVisible(visible) {
        this.canvas.hidden = !visible;
        if (this.resetButton) this.resetButton.hidden = !visible;
        if (visible) requestAnimationFrame(() => this.resize());
    }

    resize() {
        if (this.canvas.hidden) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const width = Math.max(320, rect.width);
        const height = Math.max(520, Math.min(window.innerHeight * 0.72, 820));
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
        this.applySafeZoomRange();
    }

    renderGame(game, viewState = {}) {
        this.game = game;
        this.viewState = viewState;
        this.buildBoard();
        this.renderEntities();
        this.renderMarkers();
        this.renderTrails();
    }

    buildBoard() {
        const topology = this.game.topology;
        const edgeState = this.game.mode === 'z2_gauge_loop_game' && this.game.edgeVariables
            ? [...this.game.edgeVariables.entries()].map(([key, value]) => `${key}:${value}`).join(';')
            : '';
        const signature = `${topology.name}:${topology.sizes.join('x')}:${topology.lattice || 'square'}:${this.game.mode}:${edgeState}`;
        if (signature === this.signature) return;
        this.signature = signature;
        clearGroup(this.boardGroup);
        clearGroup(this.markerGroup);
        clearGroup(this.trailGroup);
        this.pointCoords = [];
        this.pointPositions = [];
        this.nodePoints = null;

        if (topology.name === 'torus') this.addTorusSurface();
        if (topology.name === 'sphere_latitude') this.addSphereSurface();
        this.addGraph();
        if (topology.name === 'r3') {
            const axes = new THREE.AxesHelper(4.8);
            axes.material.depthTest = false;
            axes.renderOrder = 4;
            this.boardGroup.add(axes);
        }
        this.resetCamera();
        this.resize();
    }

    addTorusSurface() {
        const mesh = new THREE.Mesh(
            new THREE.TorusGeometry(3.35, 1.22, 56, 168),
            new THREE.MeshPhysicalMaterial({
                color: 0x805936,
                roughness: 0.56,
                metalness: 0.02,
                clearcoat: 0.3,
                clearcoatRoughness: 0.48
            })
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.boardGroup.add(mesh);
    }

    addSphereSurface() {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(3.46, 88, 48),
            new THREE.MeshPhysicalMaterial({
                color: 0x5d4b30,
                roughness: 0.63,
                metalness: 0.02,
                transparent: true,
                opacity: 0.78,
                clearcoat: 0.2
            })
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.boardGroup.add(mesh);
    }

    addGraph() {
        const topology = this.game.topology;
        const linePositions = [];
        const lineColors = [];
        const drawn = new Set();
        const z2GaugeEdges = this.game.mode === 'z2_gauge_loop_game' && typeof this.game.value === 'function';
        for (const coord of topology.vertices()) {
            const point = this.positionForCoord(coord, 0.07);
            this.pointCoords.push(coord);
            this.pointPositions.push(point);
            for (const direction of topology.directions()) {
                const step = topology.step(coord, direction);
                if (!step) continue;
                const edgeKey = [keyOf(coord), keyOf(step.coord)].sort().join('|');
                if (drawn.has(edgeKey)) continue;
                drawn.add(edgeKey);
                const path = this.edgePath(coord, step);
                const color = z2GaugeEdges
                    ? new THREE.Color(this.game.value(edgeKey) > 0 ? 0x07111b : 0xf8fbff)
                    : null;
                for (let index = 1; index < path.length; index++) {
                    linePositions.push(
                        path[index - 1].x, path[index - 1].y, path[index - 1].z,
                        path[index].x, path[index].y, path[index].z
                    );
                    if (color) {
                        lineColors.push(
                            color.r, color.g, color.b,
                            color.r, color.g, color.b
                        );
                    }
                }
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        if (z2GaugeEdges) geometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
        this.boardGroup.add(new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({
                color: z2GaugeEdges ? 0xffffff : topology.name === 'r3' ? 0x6ec8ec : 0x24150c,
                vertexColors: z2GaugeEdges,
                transparent: true,
                opacity: z2GaugeEdges ? 0.96 : topology.name === 'r3' ? 0.34 : 0.82,
                depthWrite: false
            })
        ));

        const nodeGeometry = new THREE.BufferGeometry();
        nodeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(
            this.pointPositions.flatMap((point) => [point.x, point.y, point.z]),
            3
        ));
        this.nodePoints = new THREE.Points(
            nodeGeometry,
            new THREE.PointsMaterial({
                color: topology.name === 'r3' ? 0xe4f8ff : 0x24130b,
                size: this.nodeSize(),
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.92,
                depthWrite: false
            })
        );
        this.boardGroup.add(this.nodePoints);
    }

    edgePath(from, step) {
        if (this.game.topology.name === 'r3') {
            return [this.positionForCoord(from, 0), this.positionForCoord(step.coord, 0)];
        }
        const rawTo = step.edge?.rawTo || step.coord;
        const samples = 5;
        return Array.from({ length: samples }, (_, index) => {
            const t = index / (samples - 1);
            const coord = from.map((value, axis) => value + ((rawTo[axis] ?? step.coord[axis]) - value) * t);
            return this.positionForCoord(coord, 0.045);
        });
    }

    renderEntities() {
        clearGroup(this.entityGroup);
        if (this.game.mode === 'anyon_jump') {
            for (const token of this.game.tokens.values()) this.addAnyon(token);
            return;
        }
        for (const coord of this.game.topology.vertices()) {
            const stone = this.game.getStone(coord);
            if (!stone) continue;
            if (this.game.mode === 'ising_domain_game') this.addIsingSpin(coord, stone);
            else if (this.game.mode === 'two_phase_competition_game') this.addTwoPhaseSite(coord, stone);
            else if (this.game.mode === 'physical_cluster_go') this.addClusterSite(coord, stone);
            else if (this.game.mode === 'spin_ice_vertex_game') this.addSpinIceVertex(coord, stone);
            else if (this.game.mode === 'z2_gauge_loop_game') this.addZ2GaugeVertex(coord, stone);
            else if (this.game.mode === 'physical_virasoro_go') this.addGoStone(coord, stone);
            else if (this.game.mode === 'physical_virasoro_reversi') this.addCFTStone(coord, stone);
            else this.addCliffordStone(coord, stone);
        }
    }

    addIsingSpin(coord, stone) {
        const group = this.baseEntity(coord, stone.color, 0.95);
        const label = stone.spin > 0 ? '+1' : '-1';
        const sprite = labelSprite(label, {
            foreground: stone.color === 'black' ? '#8be1ff' : '#17212b',
            background: stone.color === 'black' ? 'rgba(4,8,12,.88)' : 'rgba(246,248,251,.92)'
        });
        sprite.position.y = this.entityRadius() * 1.8;
        group.add(sprite);
        this.entityGroup.add(group);
    }

    addTwoPhaseSite(coord, stone) {
        const group = this.baseEntity(coord, stone.color, 0.95);
        const sprite = labelSprite(stone.phase || (stone.color === 'black' ? 'A' : 'B'), {
            foreground: stone.color === 'black' ? '#8be1ff' : '#17212b',
            background: stone.color === 'black' ? 'rgba(4,8,12,.88)' : 'rgba(246,248,251,.92)'
        });
        sprite.position.y = this.entityRadius() * 1.8;
        group.add(sprite);
        this.entityGroup.add(group);
    }

    addClusterSite(coord, stone) {
        const group = this.baseEntity(coord, stone.color, 0.92);
        const sprite = labelSprite(`${stone.species || (stone.color === 'black' ? 'A' : 'B')}`, {
            foreground: stone.color === 'black' ? '#8be1ff' : '#17212b',
            background: stone.color === 'black' ? 'rgba(4,8,12,.88)' : 'rgba(246,248,251,.92)'
        });
        sprite.position.y = this.entityRadius() * 1.82;
        group.add(sprite);
        const liberties = labelSprite(`L${stone.liberties ?? 0}`, {
            foreground: '#f2c464',
            background: 'rgba(12,16,22,.78)',
            scale: 0.3
        });
        liberties.position.y = -this.entityRadius() * 1.45;
        group.add(liberties);
        this.entityGroup.add(group);
    }

    addSpinIceVertex(coord, stone) {
        const group = this.baseEntity(coord, stone.color, stone.violation ? 1 : 0.72);
        const label = stone.violation ? `M${stone.charge > 0 ? '+' : '-'}${Math.abs(stone.charge)}` : 'ice';
        const sprite = labelSprite(label, {
            foreground: stone.color === 'black' ? '#8be1ff' : '#17212b',
            background: stone.violation
                ? (stone.color === 'black' ? 'rgba(76,12,18,.9)' : 'rgba(255,236,170,.94)')
                : 'rgba(17,28,38,.82)'
        });
        sprite.position.y = this.entityRadius() * 1.8;
        group.add(sprite);
        this.entityGroup.add(group);
    }

    addZ2GaugeVertex(coord, stone) {
        const group = this.baseEntity(coord, stone.color, stone.violation ? 1 : 0.74);
        const sprite = labelSprite(stone.label || 'S+', {
            foreground: stone.violation ? '#ffe8a8' : '#8be1ff',
            background: stone.violation ? 'rgba(76,12,18,.9)' : 'rgba(17,28,38,.82)'
        });
        sprite.position.y = this.entityRadius() * 1.8;
        group.add(sprite);
        this.entityGroup.add(group);
    }

    addCliffordStone(coord, stone) {
        const group = this.baseEntity(coord, stone.color, 1);
        const sign = Number(stone.pauliSign || 1) < 0 ? '-' : '+';
        const physical = this.game.algebraSet === 'physical' || Boolean(this.game.physicalConfig);
        const label = physical
            ? (this.viewState.physicsView === 'physics'
                ? this.game.physicalLabel(stone)
                : stone.isAncilla ? 'A' : stone.color === 'black' ? 'B' : 'W')
            : `${sign}${stone.pauliLabel}`;
        const sprite = labelSprite(label, {
            foreground: stone.color === 'black' ? '#8be1ff' : '#17212b',
            background: stone.color === 'black' ? 'rgba(4,8,12,.88)' : 'rgba(246,248,251,.9)'
        });
        sprite.position.y = this.entityRadius() * 1.85;
        group.add(sprite);
        if (physical && stone.isAncilla) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(this.entityRadius() * 1.35, this.entityRadius() * 0.11, 10, 40),
                new THREE.MeshBasicMaterial({
                    color: stone.nonStabilizerApprox ? 0xff8c42 : 0x42e68a,
                    transparent: true,
                    opacity: 0.86
                })
            );
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }
    }

    addGoStone(coord, stone) {
        const group = this.baseEntity(coord, stone.color, 0.92);
        const info = this.game.groupInfoAt(coord);
        if (info) {
            const label = this.game.primaryLabel?.(stone) || `h=${Number(info.h).toFixed(1)}`;
            const sprite = labelSprite(label, {
                foreground: '#f2c464',
                scale: 0.42
            });
            sprite.position.y = this.entityRadius() * 1.9;
            group.add(sprite);
        }
        const stress = this.game.stressAt(coord);
        if (stress?.stress > 0) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(this.entityRadius() * 1.28, this.entityRadius() * 0.12, 10, 40),
                new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.82 })
            );
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }
    }

    addCFTStone(coord, stone) {
        const group = this.baseEntity(coord, stone.color, 0.96);
        const sprite = labelSprite(this.game.primaryLabel(stone), {
            foreground: stone.color === 'black' ? '#a7ebff' : '#151c24',
            background: stone.color === 'black' ? 'rgba(3,9,14,.9)' : 'rgba(248,250,252,.92)',
            scale: 0.48
        });
        sprite.position.y = this.entityRadius() * 1.85;
        group.add(sprite);
        const stress = this.game.stressAt(coord);
        if (stress?.stress > 0) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(this.entityRadius() * 1.32, this.entityRadius() * 0.1, 10, 40),
                new THREE.MeshBasicMaterial({ color: 0xf6c85f, transparent: true, opacity: 0.82 })
            );
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }
        const channel = labelSprite(stone.hiddenChannel ? '?' : stone.channelLabel, {
            foreground: '#f6c85f',
            background: 'rgba(12,16,22,.78)',
            scale: 0.3
        });
        channel.position.y = -this.entityRadius() * 1.55;
        group.add(channel);
    }

    addAnyon(token) {
        const group = this.baseEntity(token.coord, token.owner, 0.96);
        const sprite = labelSprite(anyonSymbol(token.anyonType), {
            foreground: token.owner === 'black' ? '#8be1ff' : '#18222d',
            background: token.owner === 'black' ? 'rgba(4,8,12,.9)' : 'rgba(246,248,251,.92)'
        });
        sprite.position.y = this.entityRadius() * 1.85;
        group.add(sprite);
        if (token.isBraided || Number(token.braidParity || 0) === 1) {
            const pancake = new THREE.Mesh(
                new THREE.CylinderGeometry(this.entityRadius() * 1.38, this.entityRadius() * 1.38, 0.045, 42),
                new THREE.MeshBasicMaterial({
                    color: Number(token.anyonPhaseNumerator || 0) < 0 ? 0xff7087 : 0xf2c464,
                    transparent: true,
                    opacity: 0.52,
                    depthWrite: false
                })
            );
            pancake.position.y = -this.entityRadius() * 0.9;
            group.add(pancake);
        }
        if (token.id === this.viewState.selectedToken) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(this.entityRadius() * 1.4, this.entityRadius() * 0.12, 10, 42),
                new THREE.MeshBasicMaterial({ color: 0x42e68a })
            );
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }
    }

    baseEntity(coord, color, scale = 1) {
        const radius = this.entityRadius() * scale;
        const group = new THREE.Group();
        group.position.copy(this.positionForCoord(coord, radius * 0.82));
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 24, 16),
            new THREE.MeshPhysicalMaterial({
                color: color === 'black' ? 0x080b10 : 0xf4f7fb,
                roughness: color === 'black' ? 0.34 : 0.22,
                clearcoat: 0.22
            })
        );
        mesh.castShadow = true;
        group.add(mesh);
        this.entityGroup.add(group);
        return group;
    }

    renderMarkers() {
        clearGroup(this.markerGroup);
        const legalKeys = this.viewState.legalKeys || new Set();
        const previewKeys = this.viewState.previewKeys || new Set();
        const affectedKeys = this.viewState.affectedKeys || new Set();
        const trailKeys = this.viewState.trailKeys || new Set();
        for (let index = 0; index < this.pointCoords.length; index++) {
            const coord = this.pointCoords[index];
            const key = keyOf(coord);
            let color = null;
            let scale = 0.52;
            if (previewKeys.has(key)) color = 0xf2c464;
            else if (affectedKeys.has(key)) color = 0xff8c42;
            else if (legalKeys.has(key)) color = 0x42e68a;
            else if (trailKeys.has(key)) {
                color = 0xd4a95f;
                scale = 0.3;
            }
            if (color === null) continue;
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(this.entityRadius() * scale, 14, 10),
                new THREE.MeshBasicMaterial({
                    color,
                    transparent: true,
                    opacity: 0.82,
                    depthWrite: false
                })
            );
            marker.position.copy(this.positionForCoord(coord, this.entityRadius() * 0.75));
            this.markerGroup.add(marker);
        }
    }

    renderTrails() {
        clearGroup(this.trailGroup);
        const paths = this.viewState.paths || [];
        for (const path of paths) {
            if (!Array.isArray(path) || path.length < 2) continue;
            const points = path.map((coord) => this.positionForCoord(coord, 0.2));
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(points),
                new THREE.LineBasicMaterial({ color: 0xf2c464, transparent: true, opacity: 0.34 })
            );
            this.trailGroup.add(line);
        }
    }

    nodeSize() {
        const size = Math.max(...this.game.topology.sizes);
        return size <= 8 ? 0.085 : size <= 13 ? 0.062 : 0.045;
    }

    entityRadius() {
        const size = Math.max(...this.game.topology.sizes);
        if (this.game.topology.name === 'r3') return size <= 8 ? 0.2 : size <= 13 ? 0.145 : 0.1;
        return size <= 9 ? 0.18 : size <= 13 ? 0.14 : 0.105;
    }

    positionForCoord(coord, lift = 0) {
        const topology = this.game.topology;
        if (topology.name === 'torus') return this.torusPosition(coord, lift);
        if (topology.name === 'sphere_latitude') return this.spherePosition(coord, lift);
        return this.r3Position(coord);
    }

    r3Position(coord) {
        const [width, height, depth] = this.game.topology.sizes;
        const scale = 7.4 / Math.max(1, Math.max(width, height, depth) - 1);
        return new THREE.Vector3(
            (coord[0] - (width - 1) / 2) * scale,
            (coord[2] - (depth - 1) / 2) * scale,
            (coord[1] - (height - 1) / 2) * scale
        );
    }

    torusPosition(coord, lift = 0) {
        const [width, height] = this.game.topology.sizes;
        const u = TWO_PI * Number(coord[0]) / width;
        const v = TWO_PI * Number(coord[1]) / height;
        const major = 3.35;
        const minor = 1.22 + lift;
        const ring = major + minor * Math.cos(v);
        return new THREE.Vector3(
            ring * Math.cos(u),
            ring * Math.sin(u),
            minor * Math.sin(v)
        );
    }

    spherePosition(coord, lift = 0) {
        const [width, height] = this.game.topology.sizes;
        const radius = 3.5 + lift;
        const theta = Math.PI * (Number(coord[1]) + 1) / (height + 1);
        const phi = TWO_PI * Number(coord[0]) / width;
        return new THREE.Vector3(
            radius * Math.sin(theta) * Math.cos(phi),
            radius * Math.sin(theta) * Math.sin(phi),
            radius * Math.cos(theta)
        );
    }

    pick(event) {
        if (!this.nodePoints) return null;
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObject(this.nodePoints, false);
        return hits.length ? this.pointCoords[hits[0].index] || null : null;
    }

    pointerDown(event) {
        this.pointerGesture = {
            x: event.clientX,
            y: event.clientY,
            maxDistance: 0,
            cameraPosition: this.camera.position.clone(),
            cameraQuaternion: this.camera.quaternion.clone(),
            target: this.controls.target.clone()
        };
    }

    pointerMove(event) {
        if (this.pointerGesture) {
            const distance = Math.hypot(event.clientX - this.pointerGesture.x, event.clientY - this.pointerGesture.y);
            this.pointerGesture.maxDistance = Math.max(this.pointerGesture.maxDistance, distance);
        }
        this.onHover?.(this.pick(event));
    }

    pointerUp(event) {
        const gesture = this.pointerGesture;
        this.pointerGesture = null;
        if (!gesture || gesture.maxDistance > 5) return;
        this.controls.enableDamping = false;
        this.camera.position.copy(gesture.cameraPosition);
        this.camera.quaternion.copy(gesture.cameraQuaternion);
        this.controls.target.copy(gesture.target);
        this.controls.update();
        this.controls.enableDamping = true;
        const coord = this.pick(event);
        if (coord) this.onSelect?.(coord, event);
    }

    resetCamera() {
        this.camera.position.copy(this.homeCameraPosition());
        this.controls.target.set(0, 0, 0);
        this.applySafeZoomRange();
        this.controls.update();
    }

    homeCameraPosition() {
        const topology = this.game?.topology?.name;
        if (topology === 'torus') return new THREE.Vector3(0, 5.7, 9.9);
        if (topology === 'sphere_latitude') return new THREE.Vector3(0, 2.2, 9.6);
        return new THREE.Vector3(8.2, 7.6, 8.6);
    }

    safeZoomRange() {
        const homeDistance = this.homeCameraPosition().distanceTo(this.controls.target);
        const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
        const narrowViewport = this.camera.aspect < 0.82;
        const mobile = coarsePointer || narrowViewport;
        return mobile
            ? [homeDistance * 0.86, homeDistance * 1.16]
            : [homeDistance * 0.72, homeDistance * 1.34];
    }

    applySafeZoomRange() {
        if (!this.controls) return;
        const [minDistance, maxDistance] = this.safeZoomRange();
        this.controls.minDistance = minDistance;
        this.controls.maxDistance = maxDistance;
        this.controls.zoomSpeed = minDistance === maxDistance ? 0 : (this.camera.aspect < 0.82 ? 0.28 : 0.4);
        const offset = this.camera.position.clone().sub(this.controls.target);
        const distance = offset.length();
        const clamped = Math.min(maxDistance, Math.max(minDistance, distance || minDistance));
        if (Math.abs(clamped - distance) > 0.01) {
            offset.setLength(clamped);
            this.camera.position.copy(this.controls.target).add(offset);
            this.camera.updateProjectionMatrix();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.canvas.hidden) return;
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
