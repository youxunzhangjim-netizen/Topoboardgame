import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ReversiGame, normalizeReversiSize, normalizeReversiTopology } from '../../../js/reversi/ReversiGame.js';

const TWO_PI = Math.PI * 2;

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

        if (topology.topology === 'r3') this.buildR3(topology.width, topology.height, topology.depth);
        else if (topology.topology === 't2') this.buildTorus(topology.width, topology.height);
        else this.buildSphere(topology.width, topology.height);

        this.resetCamera();
    }

    buildR3(width, height, depth) {
        const linePositions = [];
        const addSegment = (a, b) => linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        for (let z = 0; z < depth; z += 1) {
            for (let y = 0; y < height; y += 1) addSegment(this.r3Position([0, y, z], { width, height, depth }), this.r3Position([width - 1, y, z], { width, height, depth }));
            for (let x = 0; x < width; x += 1) addSegment(this.r3Position([x, 0, z], { width, height, depth }), this.r3Position([x, height - 1, z], { width, height, depth }));
        }
        for (let x = 0; x < width; x += 1) {
            for (let y = 0; y < height; y += 1) addSegment(this.r3Position([x, y, 0], { width, height, depth }), this.r3Position([x, y, depth - 1], { width, height, depth }));
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
                    const p = this.r3Position(coord, { width, height, depth });
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
        const axes = new THREE.AxesHelper(this.r3Scale({ width, height, depth }) * Math.max(width, height, depth) * 0.62);
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
        if (logic.topology.topology === 'r3') return size <= 9 ? 0.18 : size <= 13 ? 0.13 : 0.095;
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
        return new THREE.Vector3(
            (coord[0] - centerX) * scale,
            (coord[2] - centerZ) * scale,
            (coord[1] - centerY) * scale
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
        this.hoverCoord = null;

        this.applyUrlSettings();
        this.logic = this.createLogic();
        this.renderer = new Reversi3DRenderer(this);
        this.syncLayerControl();
        this.bindEvents();
        this.updateUI();
    }

    applyUrlSettings() {
        const params = new URLSearchParams(window.location.search);
        const mode = normalizeReversiTopology(params.get('mode') || 'r3');
        this.modeSelect.value = ['r3', 't2', 'sphere'].includes(mode) ? mode : 'r3';
        const size = params.get('size');
        if (size !== null && size.trim() !== '' && Number.isFinite(Number(size))) this.setSizeSelection(size);
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
            size: this.boardSize(),
            maxSize: 19
        });
    }

    bindEvents() {
        this.modeSelect.addEventListener('change', () => this.resetGame());
        this.sizeSelect.addEventListener('change', () => {
            this.updateCustomSizeVisibility();
            this.resetGame();
        });
        this.customSizeInput.addEventListener('change', () => {
            this.setSizeSelection(this.customSizeInput.value);
            this.resetGame();
        });
        this.passBtn.addEventListener('click', () => this.passTurn());
        this.newGameBtn.addEventListener('click', () => this.resetGame());
        this.cameraResetBtn?.addEventListener('click', () => this.renderer.resetCamera());
    }

    updateCustomSizeVisibility() {
        this.customSizeInput.hidden = this.sizeSelect.value !== 'custom';
    }

    syncLayerControl() {
        this.layerGroup.hidden = true;
        this.layerInfo.textContent = 'Full 3D board';
        this.layerSelect.value = '0';
    }

    resetGame() {
        this.logic = this.createLogic();
        this.hoverCoord = null;
        this.syncLayerControl();
        this.setStatus('New 3D Reversi game started.');
        this.updateUI();
    }

    playAt(coord) {
        if (!coord) return;
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
    }

    passTurn() {
        const result = this.logic.pass();
        if (!result.ok) {
            this.setStatus(result.reason === 'legal-moves' ? 'You can only pass when no legal move exists.' : 'Pass unavailable.');
            this.updateUI();
            return;
        }
        this.setStatus('Turn passed.');
        this.updateUI();
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
        this.modeDisplay.textContent = mode === 'sphere' ? 'S2' : mode === 't2' ? 'T2' : 'R3';
        this.modeInfo.textContent = mode === 'sphere'
            ? 'S2 is rendered as a rotatable latitude-ring sphere. Horizontal rays wrap by longitude and vertical rays stop at the caps.'
            : mode === 't2'
                ? 'T2 is rendered as a solid rotatable torus. Both board directions wrap on the surface.'
                : 'R3 is rendered as the full cubic lattice. Reversi brackets can run through all 26 graph ray directions.';
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

    setStatus(text) {
        this.statusEl.textContent = text;
    }

    capitalize(value) {
        return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
    }
}

window.reversi3dApp = new Reversi3DApp();
