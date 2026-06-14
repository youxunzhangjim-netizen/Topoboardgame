import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ReversiGame, REVERSI_TOPOLOGIES, normalizeReversiSize, normalizeReversiTopology } from '../../../js/reversi/ReversiGame.js';
import { FirebaseStateNetworkManager } from '../../../js/FirebaseStateNetworkManager.js';

const TWO_PI = Math.PI * 2;
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
        else if (topology.topology === 't2') this.buildTorus(topology.width, topology.height);
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
            depthWrite: false
        });
        this.nodePoints = new THREE.Points(geometry, material);
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
        if (!hits.length) return null;
        return this.pointCoords[hits[0].index] || null;
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
        if (topology.topology === 't2') return this.torusPosition(coord, topology.width, topology.height, lift).position;
        if (topology.topology === 'sphere') return this.spherePosition(coord, topology.width, topology.height, lift);
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
        if (mode === 't2') this.camera.position.set(0, 5.7, 9.9);
        else if (mode === 'sphere') this.camera.position.set(0, 2.0, 9.5);
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
        this.modeSelect.value = ['r3', 't3', 'r3_random', 't2', 'sphere'].includes(mode) ? mode : 'r3';
        const size = params.get('size');
        if (size !== null && size.trim() !== '' && Number.isFinite(Number(size))) this.setSizeSelection(size);
        const lattice = String(params.get('lattice') || '').toLowerCase();
        if (lattice === 'hcp') this.latticeSelect.value = 'hcp';
    }

    setSizeSelection(value) {
        const size = normalizeReversiSize(value, { fallback: 12, max: 19 });
        const option = [...this.sizeSelect.options].find((item) => item.value === String(size));
        this.sizeSelect.value = option ? String(size) : 'custom';
        this.customSizeInput.value = String(size);
        this.updateCustomSizeVisibility();
    }

    boardSize() {
        const source = this.sizeSelect.value === 'custom' ? this.customSizeInput.value : this.sizeSelect.value;
        return normalizeReversiSize(source, { fallback: 12, max: 19 });
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

    resetGame({ broadcast = false } = {}) {
        this.logic = this.createLogic();
        this.hoverCoord = null;
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
        this.setStatus(`${this.capitalize(actor)} flipped ${result.flipped} ${result.flipped === 1 ? 'stone' : 'stones'}.`);
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
        this.setStatus('Turn passed.');
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
            sphere: 'S2'
        };
        const modeInfo = {
            r3: lattice === 'hcp'
                ? 'R3 HCP uses offset hexagonal close-packed layers with 12 nearest-neighbor bracket directions.'
                : 'R3 Standard uses ordinary open cubic boundaries. Reversi brackets can run through all 26 graph ray directions.',
            t3: 'T3 PBC wraps x, y, and z, so every cubic axis is periodic.',
            r3_random: '3D RBC uses one fixed seeded random map from each cube-boundary exit to another boundary point.',
            t2: 'T2 is rendered as a solid rotatable torus. Both board directions wrap on the surface.',
            sphere: 'S2 is rendered as a rotatable latitude-ring sphere. Horizontal rays wrap by longitude and vertical rays stop at the caps.'
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
        return ['3dreversi', this.modeSelect.value, this.currentLattice(), this.boardSize()].join(':');
    }

    exportNetworkState() {
        return {
            logic: this.logic.exportState(),
            mode: this.modeSelect.value,
            lattice: this.currentLattice(),
            size: this.boardSize()
        };
    }

    importNetworkState(state) {
        if (!state?.logic) return;
        this.logic.importState(state.logic);
        this.modeSelect.value = state.mode || this.logic.topology.topology || this.modeSelect.value;
        this.latticeSelect.value = state.lattice || this.currentLattice();
        this.setSizeSelection(state.size || this.logic.topology.width);
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
} catch (error) {
    window.drawReversiFallback?.(error);
}
