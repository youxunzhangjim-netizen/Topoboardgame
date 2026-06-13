import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COLORS, GoGameLogic, otherColor, valueToColor } from './GoGame.js';
import { GoNetworkManager } from './NetworkManager.js';
import {
    createTorusSurfaceData,
    TORUS_MAJOR_RADIUS,
    TORUS_MINOR_RADIUS,
    torusFrame
} from './TorusBoardGeometry.js';
import {
    SPHERE_GO_TOPOLOGY,
    sphereVertexPosition
} from './SphereGoTopology.js';
import { KLEIN_BOTTLE_TOPOLOGY } from './KleinBottleTopology.js';

const PUBLIC_GAME_URL = 'https://youxunzhangjim-netizen.github.io/Spacechess/3D/3dgo/';
const STORAGE_PREFIX = '3dgo:room:';
const KOMI = 7.5;
const LANGUAGE_STORAGE_KEY = '3dgo:language';

const I18N = {
    en: {
        language: { label: 'Language', english: 'English', chinese: 'Chinese' },
        navigation: { home: 'Home' },
        app: { title: '3D Go', tagline: 'R3 lattice, T2 torus, S2 sphere, and Klein bottle Go with 9, 13, and 19 scale options.' },
        colors: { black: 'Black', white: 'White' },
        captured: { byBlack: 'Captured by Black', byWhite: 'Captured by White', stones: ({ count }) => count + ' ' + (count === 1 ? 'stone' : 'stones') },
        controls: { title: 'Game Controls', gameMode: 'Game Mode', local: 'Local Pass and Play', online: 'Online Multiplayer', goSpace: 'Go Space', sphereView: 'Sphere View', boardScale: 'Board Scale', timer: 'Timer per Player', resetCamera: 'Reset Camera', pass: 'Pass', agreeCount: 'Agree Count', newGame: 'New Game', surrender: 'Surrender' },
        online: { localStatus: 'Local pass and play', findMatch: 'Find Match', privateRoom: 'PRIVATE ROOM', createRoom: 'Create Room', or: 'OR', roomInput: '5-digit room code or shared link', joinRoom: 'Join Room', roomCode: 'Room Code', copy: 'Copy', copied: 'Copied', onlineAs: ({ color }) => 'Online as ' + color },
        chat: { title: 'Online Chat', empty: 'Connect online to chat.', placeholder: 'Message online opponent', send: 'Send', player: 'Player', connectFirst: 'Connect online before chatting.' },
        mode: { r3Option: 'R3 Go', t2Option: 'T2 Torus Go', sphereOption: 'S2 Sphere Go', kleinOption: 'Klein Bottle Go', sphere3d: '3D Sphere', sphere2d: '2D Cut-open Fallback', r3Display: ({ size }) => size + '^3 R3 Go', t2Display: ({ size }) => size + ' x ' + size + ' T2 Go', sphereDisplay: ({ width, height }) => width + ' x ' + height + ' S2 Go', kleinDisplay: ({ width, height }) => width + ' x ' + height + ' Klein Bottle Go', r3Info: 'R3 uses open boundaries in x, y, and z.', t2Info: 'T2 wraps both directions on the torus board.', sphereInfo: 'S2 uses longitude rings with horizontal wrap. The first and last latitude rings have degree 3; there are no playable pole nodes or pole-crossing links.', kleinInfo: 'The Klein bottle has normal left-right wrap and flipped top-bottom wrap: leaving at x enters at width - 1 - x.' },
        timer: { none: 'No Timer', five: '5 Minutes', ten: '10 Minutes', thirty: '30 Minutes', hour: '1 Hour', oneDay: '1 Day' },
        history: { title: 'Move History', started: 'Game started.' },
        rules: { title: 'Rules', text: 'Area scoring with 7.5 komi. Captures, liberties, superko, and territory use the selected board graph.' },
        status: { start: 'Select a glowing node for Black.', waitingForColor: ({ color }) => 'Waiting for ' + color + '.', toPlay: ({ color }) => color + ' to play', countingPending: 'Counting pending', twoPasses: 'Two passes. Both players must agree to count.', agreed: ({ color, other }) => color + ' agreed. Waiting for ' + other + '.', surrendered: ({ color, winner }) => color + ' surrendered. ' + winner + ' wins.', timedOut: ({ color, winner }) => color + ' ran out of time. ' + winner + ' wins.', synced: 'Synced online game.', finalCount: 'Final count:' },
        score: { draw: 'Draw', wins: ({ color }) => color + ' wins', winsBy: ({ color, margin }) => color + ' wins by ' + margin, summary: ({ black, white, komi, result }) => 'Black ' + black + ', White ' + white + ' including ' + komi + ' komi. ' + result }
    },
    zh: {
        language: { label: '語言', english: 'English', chinese: '繁體中文' },
        navigation: { home: '首頁' },
        app: { title: '3D 圍棋', tagline: 'R3 格點、T2 環面、S2 球面與克萊因瓶圍棋，支援 9、13、19 尺寸。' },
        colors: { black: '黑方', white: '白方' },
        captured: { byBlack: '黑方提子', byWhite: '白方提子', stones: ({ count }) => count + ' 子' },
        controls: { title: '遊戲控制', gameMode: '遊戲模式', local: '本地輪流', online: '線上多人', goSpace: '圍棋空間', sphereView: '球面視圖', boardScale: '棋盤尺度', timer: '每方時間', resetCamera: '重設視角', pass: '停一手', agreeCount: '同意計分', newGame: '新遊戲', surrender: '認輸' },
        online: { localStatus: '本地輪流', findMatch: '尋找配對', privateRoom: '私人房間', createRoom: '建立房間', or: '或', roomInput: '5 位房間碼或分享連結', joinRoom: '加入房間', roomCode: '房間碼', copy: '複製', copied: '已複製', onlineAs: ({ color }) => '線上身分：' + color },
        mode: { r3Option: 'R3 圍棋', t2Option: 'T2 環面圍棋', sphereOption: 'S2 球面圍棋', kleinOption: '克萊因瓶圍棋', sphere3d: '3D 球面', sphere2d: '2D 切開備用視圖', r3Display: ({ size }) => size + '^3 R3 圍棋', t2Display: ({ size }) => size + ' x ' + size + ' T2 圍棋', sphereDisplay: ({ width, height }) => width + ' x ' + height + ' S2 圍棋', kleinDisplay: ({ width, height }) => width + ' x ' + height + ' 克萊因瓶圍棋', r3Info: 'R3 在 x、y、z 三個方向使用開放邊界。', t2Info: 'T2 在環面棋盤的兩個方向皆為週期連接。', sphereInfo: 'S2 使用經度環並在水平方向循環。最南與最北緯度環的節點度數為 3；南北極沒有可落子節點，也沒有穿越極點的連線。', kleinInfo: '克萊因瓶的左右邊界直接循環；上下邊界循環時翻轉 x，從 x 離開後會在 width - 1 - x 進入。' },
        timer: { none: '無計時', five: '5 分鐘', ten: '10 分鐘', thirty: '30 分鐘', hour: '1 小時', oneDay: '1 天' },
        history: { title: '走法記錄', started: '遊戲開始。' },
        rules: { title: '規則', text: '面積計分，貼目 7.5。提子、氣、超級劫與領地皆使用所選棋盤的圖相鄰關係。' },
        status: { start: '請選擇一個發光節點讓黑方落子。', waitingForColor: ({ color }) => '等待' + color + '。', toPlay: ({ color }) => color + '落子', countingPending: '等待計分確認', twoPasses: '雙方連續停一手。兩位玩家都需要同意計分。', agreed: ({ color, other }) => color + '已同意，等待' + other + '。', surrendered: ({ color, winner }) => color + '認輸，' + winner + '獲勝。', timedOut: ({ color, winner }) => color + '逾時，' + winner + '獲勝。', synced: '已同步線上棋局。', finalCount: '終局計分：' },
        score: { draw: '和局', wins: ({ color }) => color + '獲勝', winsBy: ({ color, margin }) => color + '勝 ' + margin, summary: ({ black, white, komi, result }) => '黑方 ' + black + '，白方 ' + white + '，含貼目 ' + komi + '。' + result }
    }
};

let currentLanguage = (() => {
    try {
        const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return Object.prototype.hasOwnProperty.call(I18N, stored) ? stored : 'en';
    } catch {
        return 'en';
    }
})();

function readTranslation(lang, key) {
    return key.split('.').reduce((node, part) => node?.[part], I18N[lang]);
}

function tr(key, params = {}) {
    const value = readTranslation(currentLanguage, key) ?? readTranslation('en', key) ?? key;
    return typeof value === 'function' ? value(params) : String(value);
}

function applyLanguage(root = document) {
    document.documentElement.lang = currentLanguage === 'zh' ? 'zh-Hant' : 'en';
    document.title = tr('app.title');
    root.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = tr(element.dataset.i18n); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => { element.setAttribute('placeholder', tr(element.dataset.i18nPlaceholder)); });
    root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => { element.setAttribute('aria-label', tr(element.dataset.i18nAriaLabel)); });
    root.querySelectorAll('[data-i18n-title]').forEach((element) => { element.setAttribute('title', tr(element.dataset.i18nTitle)); });
    root.querySelectorAll('[data-lang-option]').forEach((button) => {
        const active = button.dataset.langOption === currentLanguage;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
}

function setLanguage(language) {
    if (!Object.prototype.hasOwnProperty.call(I18N, language) || language === currentLanguage) return;
    currentLanguage = language;
    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch {}
    applyLanguage();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
}

class Go3DRenderer {
    constructor(app) {
        this.app = app;
        this.canvas = document.getElementById('goCanvas');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b0f14);
        this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.zoomSpeed = 0.7;
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 0.12;
        this.pointer = new THREE.Vector2();
        this.boardGroup = new THREE.Group();
        this.stoneGroup = new THREE.Group();
        this.hoverGroup = new THREE.Group();
        this.scene.add(this.boardGroup, this.stoneGroup, this.hoverGroup);
        this.pointCoords = [];
        this.pointPositions = [];
        this.nodePoints = null;
        this.mode = '';
        this.size = 0;
        this.width = 0;
        this.height = 0;
        this.view = '';
        this.clock = new THREE.Clock();
        this.initLights();
        this.bind();
        this.resize();
        this.resetCamera();
        this.animate();
    }

    initLights() {
        const hemi = new THREE.HemisphereLight(0xdff6ff, 0x15110d, 1.6);
        this.scene.add(hemi);
        const key = new THREE.DirectionalLight(0xffffff, 2.4);
        key.position.set(5, 9, 7);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        this.scene.add(key);
        const fill = new THREE.PointLight(0x38bdf8, 1.4, 28);
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
            if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose?.());
            else child.material?.dispose?.();
        }
    }

    buildBoard(logic) {
        const view = logic.topology === SPHERE_GO_TOPOLOGY ? this.app.sphereView() : '';
        if (this.mode === logic.topology
            && this.size === logic.size
            && this.width === logic.width
            && this.height === logic.height
            && this.view === view) return;
        this.mode = logic.topology;
        this.size = logic.size;
        this.width = logic.width;
        this.height = logic.height;
        this.view = view;
        this.controls.enableRotate = !(logic.topology === KLEIN_BOTTLE_TOPOLOGY
            || (logic.topology === SPHERE_GO_TOPOLOGY && view === '2d'));
        this.clearGroup(this.boardGroup);
        this.clearGroup(this.hoverGroup);
        this.pointCoords = [];
        this.pointPositions = [];
        this.nodePoints = null;
        if (logic.topology === 'r3') this.buildR3(logic.size);
        else if (logic.topology === 't2') this.buildTorus(logic.size);
        else if (logic.topology === KLEIN_BOTTLE_TOPOLOGY) this.buildKlein(logic.width, logic.height);
        else if (view === '2d') this.buildSphereFlat(logic.width, logic.height);
        else this.buildSphere(logic.width, logic.height);
        this.resetCamera();
    }

    buildSphere(width, height) {
        const radius = 3.45;
        const surface = new THREE.Mesh(
            new THREE.SphereGeometry(radius - 0.045, 96, 48),
            new THREE.MeshPhysicalMaterial({
                color: 0x604a2b,
                roughness: 0.6,
                metalness: 0.02,
                transparent: true,
                opacity: 0.62,
                clearcoat: 0.18
            })
        );
        surface.castShadow = true;
        surface.receiveShadow = true;
        this.boardGroup.add(surface);

        const linePositions = [];
        const addEdge = (a, b) => linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const current = this.spherePosition([x, y], width, height, 0.04);
                const horizontal = this.spherePosition([(x + 1) % width, y], width, height, 0.04);
                addEdge(current, horizontal);
                if (y < height - 1) {
                    addEdge(current, this.spherePosition([x, y + 1], width, height, 0.04));
                }
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({ color: 0xd8b36b, transparent: true, opacity: 0.72 })
        ));

        const pointPositions = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const coord = [x, y];
                const point = this.spherePosition(coord, width, height, 0.075);
                this.pointCoords.push(coord);
                this.pointPositions.push(point);
                pointPositions.push(point.x, point.y, point.z);
            }
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.075 : width <= 13 ? 0.056 : 0.042, {
            color: 0xffe3a3,
            opacity: 0.98
        });
    }

    buildSphereFlat(width, height) {
        const linePositions = [];
        const pointPositions = [];
        const scale = 7 / Math.max(width - 1, height - 1);
        const position = ([x, y]) => new THREE.Vector3(
            (x - (width - 1) / 2) * scale,
            ((height - 1) / 2 - y) * scale,
            0
        );
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const coord = [x, y];
                const point = position(coord);
                this.pointCoords.push(coord);
                this.pointPositions.push(point);
                pointPositions.push(point.x, point.y, point.z);
                if (x < width - 1) {
                    const next = position([x + 1, y]);
                    linePositions.push(point.x, point.y, 0, next.x, next.y, 0);
                }
                if (y < height - 1) {
                    const next = position([x, y + 1]);
                    linePositions.push(point.x, point.y, 0, next.x, next.y, 0);
                }
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({ color: 0xd8b36b, transparent: true, opacity: 0.64 })
        ));
        this.addNodePoints(pointPositions, width <= 9 ? 0.075 : width <= 13 ? 0.055 : 0.04, {
            color: 0xffe3a3,
            opacity: 0.98
        });

        const halfWidth = (width - 1) * scale / 2;
        const halfHeight = (height - 1) * scale / 2;
        const wrapMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });
        for (const side of [-1, 1]) {
            const x = side * (halfWidth + scale * 0.42);
            const points = [
                new THREE.Vector3(x, -halfHeight, 0),
                new THREE.Vector3(x, halfHeight, 0)
            ];
            this.boardGroup.add(new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(points),
                wrapMaterial
            ));
            const direction = side < 0 ? -1 : 1;
            const arrowX = x + direction * scale * 0.16;
            const arrowSegments = [
                new THREE.Vector3(arrowX - direction * scale * 0.16, scale * 0.12, 0),
                new THREE.Vector3(arrowX, 0, 0),
                new THREE.Vector3(arrowX, 0, 0),
                new THREE.Vector3(arrowX - direction * scale * 0.16, -scale * 0.12, 0)
            ];
            this.boardGroup.add(new THREE.LineSegments(
                new THREE.BufferGeometry().setFromPoints(arrowSegments),
                wrapMaterial
            ));
        }
    }

    buildKlein(width, height) {
        const scale = 7 / Math.max(width - 1, height - 1);
        const halfWidth = (width - 1) * scale / 2;
        const halfHeight = (height - 1) * scale / 2;
        const linePositions = [];
        const pointPositions = [];

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

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const coord = [x, y];
                const point = this.kleinPosition(coord, width, height);
                this.pointCoords.push(coord);
                this.pointPositions.push(point);
                pointPositions.push(point.x, point.y, point.z);
                if (x < width - 1) {
                    const next = this.kleinPosition([x + 1, y], width, height);
                    linePositions.push(point.x, point.y, 0, next.x, next.y, 0);
                }
                if (y < height - 1) {
                    const next = this.kleinPosition([x, y + 1], width, height);
                    linePositions.push(point.x, point.y, 0, next.x, next.y, 0);
                }
            }
        }

        const gridGeometry = new THREE.BufferGeometry();
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            gridGeometry,
            new THREE.LineBasicMaterial({ color: 0xe0b86d, transparent: true, opacity: 0.72 })
        ));
        this.addNodePoints(pointPositions, width <= 9 ? 0.072 : width <= 13 ? 0.052 : 0.04, {
            color: 0xffe5a8,
            opacity: 0.98
        });

        const sideMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.96 });
        const seamMaterial = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.96 });
        const guideMaterial = new THREE.LineBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.24 });
        const margin = scale * 0.55;
        const addLine = (points, material) => {
            this.boardGroup.add(new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(points),
                material
            ));
        };

        for (const side of [-1, 1]) {
            const x = side * (halfWidth + margin);
            addLine([
                new THREE.Vector3(x, -halfHeight, 0.03),
                new THREE.Vector3(x, halfHeight, 0.03)
            ], sideMaterial);
            const direction = side < 0 ? -1 : 1;
            this.boardGroup.add(new THREE.ArrowHelper(
                new THREE.Vector3(direction, 0, 0),
                new THREE.Vector3(x - direction * scale * 0.25, 0, 0.04),
                scale * 0.5,
                0x38bdf8,
                scale * 0.18,
                scale * 0.11
            ));
        }

        for (const side of [-1, 1]) {
            const y = side * (halfHeight + margin);
            addLine([
                new THREE.Vector3(-halfWidth, y, 0.03),
                new THREE.Vector3(halfWidth, y, 0.03)
            ], seamMaterial);
        }

        const guideCount = Math.min(width, 7);
        const guideXs = new Set();
        for (let index = 0; index < guideCount; index++) {
            guideXs.add(Math.round(index * (width - 1) / Math.max(1, guideCount - 1)));
        }
        for (const x of guideXs) {
            const mirroredX = width - 1 - x;
            const top = this.kleinPosition([x, 0], width, height, 0.025);
            const bottom = this.kleinPosition([mirroredX, height - 1], width, height, 0.025);
            addLine([top, bottom], guideMaterial);

            const arrowLength = scale * 0.42;
            this.boardGroup.add(new THREE.ArrowHelper(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(top.x, halfHeight + margin + scale * 0.12, 0.05),
                arrowLength,
                0xfbbf24,
                scale * 0.15,
                scale * 0.1
            ));
            this.boardGroup.add(new THREE.ArrowHelper(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(bottom.x, -halfHeight - margin - arrowLength - scale * 0.12, 0.05),
                arrowLength,
                0xfbbf24,
                scale * 0.15,
                scale * 0.1
            ));
        }
    }

    buildR3(size) {
        const linePositions = [];
        const scale = this.r3Scale(size);
        const material = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.26 });
        const addSegment = (a, b) => {
            linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        };
        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) addSegment(this.r3Position([0, y, z], size), this.r3Position([size - 1, y, z], size));
            for (let x = 0; x < size; x++) addSegment(this.r3Position([x, 0, z], size), this.r3Position([x, size - 1, z], size));
        }
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) addSegment(this.r3Position([x, y, 0], size), this.r3Position([x, y, size - 1], size));
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(geometry, material));

        const pointPositions = [];
        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const coord = [x, y, z];
                    const p = this.r3Position(coord, size);
                    this.pointCoords.push(coord);
                    this.pointPositions.push(p);
                    pointPositions.push(p.x, p.y, p.z);
                }
            }
        }
        this.addNodePoints(pointPositions, size <= 9 ? 0.06 : size <= 13 ? 0.045 : 0.034);
        const axes = new THREE.AxesHelper(scale * (size - 1) * 0.65);
        axes.material.depthTest = false;
        axes.renderOrder = 3;
        this.boardGroup.add(axes);
    }

    buildTorus(size) {
        const surfaceData = createTorusSurfaceData();
        const surfaceGeometry = new THREE.BufferGeometry();
        surfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(surfaceData.positions, 3));
        surfaceGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(surfaceData.normals, 3));
        surfaceGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(surfaceData.uvs, 2));
        surfaceGeometry.setIndex(surfaceData.indices);
        const torus = new THREE.Mesh(
            surfaceGeometry,
            new THREE.MeshPhysicalMaterial({
                color: 0xb5793f,
                roughness: 0.5,
                metalness: 0.03,
                clearcoat: 0.34,
                clearcoatRoughness: 0.44
            })
        );
        torus.castShadow = true;
        torus.receiveShadow = true;
        this.boardGroup.add(torus);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x2b180e,
            transparent: true,
            opacity: 0.82,
            depthWrite: false
        });
        for (let y = 0; y < size; y++) this.boardGroup.add(this.torusLine(size, 'x', y, gridMaterial));
        for (let x = 0; x < size; x++) this.boardGroup.add(this.torusLine(size, 'y', x, gridMaterial));

        const pointPositions = [];
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const coord = [x, y];
                const p = this.torusPosition(coord, size, 0.055).position;
                this.pointCoords.push(coord);
                this.pointPositions.push(p);
                pointPositions.push(p.x, p.y, p.z);
            }
        }
        this.addNodePoints(
            pointPositions,
            size <= 9 ? 0.055 : size <= 13 ? 0.044 : 0.034,
            { color: 0x24130b, opacity: 0.96 }
        );
        this.addTorusStarPoints(size);
    }

    torusLine(size, varyingAxis, fixedValue, material) {
        const points = [];
        const segments = Math.max(96, size * 8);
        for (let i = 0; i <= segments; i++) {
            const value = (i / segments) * size;
            const coord = varyingAxis === 'x' ? [value, fixedValue] : [fixedValue, value];
            points.push(this.torusPosition(coord, size, 0.035).position);
        }
        return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    }

    addTorusStarPoints(size) {
        const starCoords = this.starPoints(size);
        const radius = size <= 9 ? 0.075 : size <= 13 ? 0.06 : 0.045;
        const mesh = new THREE.InstancedMesh(
            new THREE.SphereGeometry(radius, 16, 10),
            new THREE.MeshStandardMaterial({
                color: 0x190d08,
                roughness: 0.7,
                metalness: 0.02
            }),
            starCoords.length
        );
        const matrix = new THREE.Matrix4();
        starCoords.forEach((coord, index) => {
            const position = this.torusPosition(coord, size, 0.075).position;
            matrix.makeTranslation(position.x, position.y, position.z);
            mesh.setMatrixAt(index, matrix);
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.boardGroup.add(mesh);
    }

    starPoints(size) {
        if (size === 9) return [2, 4, 6].flatMap((x) => [2, 4, 6].map((y) => [x, y]));
        if (size === 13) return [3, 6, 9].flatMap((x) => [3, 6, 9].map((y) => [x, y]));
        return [3, 9, 15].flatMap((x) => [3, 9, 15].map((y) => [x, y]));
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
        this.buildBoard(logic);
        this.clearGroup(this.stoneGroup);
        const black = [];
        const white = [];
        for (let index = 0; index < logic.board.length; index++) {
            const value = logic.board[index];
            if (!value) continue;
            const coord = logic.coordFromIndex(index);
            const p = this.positionForCoord(coord, logic);
            if (value === COLORS.black) black.push(p);
            else white.push(p);
        }
        this.addStoneInstances(black, 'black', logic);
        this.addStoneInstances(white, 'white', logic);
    }

    addStoneInstances(positions, color, logic) {
        if (!positions.length) return;
        const radius = logic.topology === 'r3'
            ? (logic.size <= 9 ? 0.18 : logic.size <= 13 ? 0.13 : 0.095)
            : (logic.size <= 9 ? 0.16 : logic.size <= 13 ? 0.13 : 0.105);
        const stoneGeometry = new THREE.SphereGeometry(radius, 24, 16);
        const dotGeometry = new THREE.SphereGeometry(radius * 0.28, 16, 10);
        const stoneMaterial = new THREE.MeshPhysicalMaterial({
            color: color === 'black' ? 0x05070a : 0xf5f7fb,
            roughness: color === 'black' ? 0.3 : 0.18,
            metalness: 0.05,
            transparent: true,
            opacity: color === 'black' ? 0.78 : 0.72,
            transmission: 0.15
        });
        const dotMaterial = new THREE.MeshStandardMaterial({
            color: color === 'black' ? 0x38bdf8 : 0xfacc15,
            emissive: color === 'black' ? 0x38bdf8 : 0xfacc15,
            emissiveIntensity: 1.6
        });
        const stoneMesh = new THREE.InstancedMesh(stoneGeometry, stoneMaterial, positions.length);
        const dotMesh = new THREE.InstancedMesh(dotGeometry, dotMaterial, positions.length);
        const matrix = new THREE.Matrix4();
        positions.forEach((pos, index) => {
            matrix.makeTranslation(pos.x, pos.y, pos.z);
            stoneMesh.setMatrixAt(index, matrix);
            dotMesh.setMatrixAt(index, matrix);
        });
        stoneMesh.castShadow = true;
        dotMesh.castShadow = true;
        this.stoneGroup.add(stoneMesh, dotMesh);
    }

    setHover(coord, logic = this.app.logic) {
        this.clearGroup(this.hoverGroup);
        if (!coord || logic.gameOver || logic.scoringPending) return;
        const index = logic.indexFromCoord(coord);
        if (index < 0 || logic.board[index] !== COLORS.empty) return;
        const p = this.positionForCoord(coord, logic);
        const radius = logic.topology === 'r3'
            ? (logic.size <= 9 ? 0.2 : logic.size <= 13 ? 0.145 : 0.105)
            : (logic.size <= 9 ? 0.18 : logic.size <= 13 ? 0.145 : 0.115);
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 20, 12),
            new THREE.MeshBasicMaterial({ color: logic.currentPlayer === 'black' ? 0x111827 : 0xffffff, transparent: true, opacity: 0.38 })
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
        this.setHover(coord);
    }

    handleClick(event) {
        const coord = this.pickCoord(event);
        if (coord) this.app.playAt(coord);
    }

    positionForCoord(coord, logic) {
        if (logic.topology === 't2') return this.torusPosition(coord, logic.size, 0.18).position;
        if (logic.topology === KLEIN_BOTTLE_TOPOLOGY) {
            return this.kleinPosition(coord, logic.width, logic.height, 0.14);
        }
        if (logic.topology === SPHERE_GO_TOPOLOGY) {
            if (this.view === '2d') {
                const scale = 7 / Math.max(logic.width - 1, logic.height - 1);
                return new THREE.Vector3(
                    (coord[0] - (logic.width - 1) / 2) * scale,
                    ((logic.height - 1) / 2 - coord[1]) * scale,
                    0.14
                );
            }
            return this.spherePosition(coord, logic.width, logic.height, 0.18);
        }
        return this.r3Position(coord, logic.size);
    }

    spherePosition(coord, width, height, lift = 0) {
        const point = sphereVertexPosition(coord, width, height, 3.45, lift);
        return new THREE.Vector3(point.x, point.y, point.z);
    }

    kleinPosition(coord, width, height, lift = 0) {
        const scale = 7 / Math.max(width - 1, height - 1);
        return new THREE.Vector3(
            (coord[0] - (width - 1) / 2) * scale,
            ((height - 1) / 2 - coord[1]) * scale,
            lift
        );
    }

    r3Scale(size) {
        return 7.8 / Math.max(1, size - 1);
    }

    r3Position(coord, size) {
        const scale = this.r3Scale(size);
        const center = (size - 1) / 2;
        return new THREE.Vector3((coord[0] - center) * scale, (coord[2] - center) * scale, (coord[1] - center) * scale);
    }

    torusPosition(coord, size, lift = 0) {
        const frame = torusFrame(coord, size, lift);
        const position = new THREE.Vector3(frame.position.x, frame.position.y, frame.position.z);
        const normal = new THREE.Vector3(frame.normal.x, frame.normal.y, frame.normal.z).normalize();
        return { position, normal };
    }

    resetCamera() {
        if (this.app?.logic?.topology === 't2') {
            this.camera.position.set(0, 5.6, 9.8);
            this.controls.target.set(0, 0, 0);
        } else if (this.app?.logic?.topology === KLEIN_BOTTLE_TOPOLOGY) {
            this.camera.position.set(0, 0, 10.5);
            this.controls.target.set(0, 0, 0);
        } else if (this.app?.logic?.topology === SPHERE_GO_TOPOLOGY) {
            this.camera.position.set(0, this.view === '2d' ? 0 : 1.8, this.view === '2d' ? 10.5 : 9.4);
            this.controls.target.set(0, 0, 0);
        } else {
            this.camera.position.set(7.8, 7.4, 8.2);
            this.controls.target.set(0, 0, 0);
        }
        this.controls.update();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const elapsed = this.clock.getElapsedTime();
        this.stoneGroup.children.forEach((child) => {
            if (child.material?.emissive) child.material.emissiveIntensity = 1.25 + Math.sin(elapsed * 2.2) * 0.22;
        });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

class Go3DApp {
    constructor() {
        this.modeSelect = document.getElementById('goModeSelect');
        this.sphereViewSelect = document.getElementById('sphereViewSelect');
        this.sphereViewGroup = document.getElementById('sphereViewGroup');
        this.sizeSelect = document.getElementById('boardSizeSelect');
        this.timerSelect = document.getElementById('timerSelect');
        this.gameModeSelect = document.getElementById('gameModeSelect');
        this.onlineControls = document.getElementById('onlineControls');
        this.statusEl = document.getElementById('gameStatus');
        this.onlineColorEl = document.getElementById('onlineColorStatus');
        this.turnEl = document.getElementById('playerTurn');
        this.modeDisplay = document.getElementById('modeDisplay');
        this.modeInfo = document.getElementById('modeInfo');
        this.blackTimerEl = document.getElementById('blackTimer');
        this.whiteTimerEl = document.getElementById('whiteTimer');
        this.blackTimerBox = document.getElementById('blackTimerBox');
        this.whiteTimerBox = document.getElementById('whiteTimerBox');
        this.blackCapturedEl = document.getElementById('blackCaptured');
        this.whiteCapturedEl = document.getElementById('whiteCaptured');
        this.historyEl = document.getElementById('moveHistoryList');
        this.scorePanel = document.getElementById('scorePanel');
        this.scoreResult = document.getElementById('scoreResult');
        this.passBtn = document.getElementById('passBtn');
        this.countBtn = document.getElementById('countBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.surrenderBtn = document.getElementById('surrenderBtn');
        this.roomIdInput = document.getElementById('roomIdInput');
        this.copyLinkBtn = document.getElementById('copyLinkBtn');
        this.shareLinkInput = document.getElementById('shareLinkInput');
        this.chatMessagesEl = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.chatSendBtn = document.getElementById('chatSendBtn');
        this.applyUrlSettings();
        this.logic = this.createLogic();
        this.renderer = new Go3DRenderer(this);
        this.network = new GoNetworkManager(this, { publicGameUrl: PUBLIC_GAME_URL, storagePrefix: STORAGE_PREFIX });
        this.myColor = null;
        this.settingsLocked = false;
        this.gameStarted = false;
        this.timeLimit = Number(this.timerSelect.value) || 0;
        this.timeRemaining = { black: this.timeLimit, white: this.timeLimit };
        this.timerInterval = null;
        this.chatMessages = [];
        this.bindEvents();
        applyLanguage();
        this.setStatus(tr('status.start'));
        this.updateUI();
        this.tryJoinSharedRoomFromUrl();
    }

    applyUrlSettings() {
        const params = new URLSearchParams(window.location.search);
        const mode = String(params.get('mode') || '').toLowerCase();
        if (mode === 'r3' || mode === 't2' || mode === 'sphere' || mode === 's2') {
            this.modeSelect.value = mode === 's2' ? 'sphere' : mode;
        }

        const size = params.get('size');
        if (['9', '13', '19'].includes(size)) this.sizeSelect.value = size;

        const timer = params.get('timer');
        if ([...this.timerSelect.options].some((option) => option.value === timer)) {
            this.timerSelect.value = timer;
        }
    }

    tryJoinSharedRoomFromUrl() {
        const roomId = new URLSearchParams(window.location.search).get('room');
        if (!roomId) return;
        this.gameModeSelect.value = 'online';
        this.updateOnlineControls();
        this.roomIdInput.value = roomId;
        this.lockSettings();
        this.setStatus('Joining shared online room...');
        window.setTimeout(() => this.network.resumeOrJoinRoom(roomId), 150);
    }

    createLogic() {
        const mode = this.modeSelect?.value || 'r3';
        const size = Number(this.sizeSelect?.value) || 19;
        const topology = mode === 'r3'
            ? 'r3'
            : mode === 'sphere'
                ? SPHERE_GO_TOPOLOGY
                : mode === 'klein' ? KLEIN_BOTTLE_TOPOLOGY : 't2';
        return new GoGameLogic({
            size,
            width: size,
            height: mode === 'klein' ? 19 : size,
            dimension: mode === 'r3' ? 3 : 2,
            topology,
            komi: KOMI
        });
    }

    bindEvents() {
        this.modeSelect.addEventListener('change', () => this.resetGame());
        this.sphereViewSelect.addEventListener('change', () => {
            this.renderer.mode = '';
            this.renderer.renderStones(this.logic);
        });
        this.sizeSelect.addEventListener('change', () => this.resetGame());
        this.timerSelect.addEventListener('change', () => this.resetGame());
        this.gameModeSelect.addEventListener('change', () => this.updateOnlineControls());
        document.getElementById('cameraReset').addEventListener('click', () => this.renderer.resetCamera());
        this.passBtn.addEventListener('click', () => this.passTurn());
        this.countBtn.addEventListener('click', () => this.agreeCount());
        this.newGameBtn.addEventListener('click', () => this.resetGame({ broadcast: true }));
        this.surrenderBtn.addEventListener('click', () => this.surrender());
        document.getElementById('createRoomBtn').addEventListener('click', () => { this.lockSettings(); this.network.createRoom(); });
        document.getElementById('findMatchBtn').addEventListener('click', () => { this.lockSettings(); this.network.findMatch(); });
        document.getElementById('joinRoomBtn').addEventListener('click', () => { this.lockSettings(); this.network.joinRoom(this.roomIdInput.value); });
        this.copyLinkBtn.addEventListener('click', async () => {
            if (!this.shareLinkInput.value) return;
            await navigator.clipboard?.writeText(this.shareLinkInput.value);
            this.copyLinkBtn.textContent = tr('online.copied');
            window.setTimeout(() => { this.copyLinkBtn.textContent = tr('online.copy'); }, 1000);
        });
        this.chatSendBtn?.addEventListener('click', () => this.sendChatMessage());
        this.chatInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' || event.shiftKey) return;
            event.preventDefault();
            this.sendChatMessage();
        });
        document.querySelectorAll('[data-lang-option]').forEach((button) => {
            button.addEventListener('click', () => setLanguage(button.dataset.langOption));
        });
        window.addEventListener('languagechange', () => {
            this.updateUI();
            if (!this.gameStarted && !this.network?.isConnected) {
                this.setStatus(tr('status.start'));
            } else if (this.logic.gameOver) {
                this.setStatus(this.resultText());
            } else if (this.logic.scoringPending) {
                this.setStatus(tr('status.countingPending'));
            } else {
                this.setStatus(tr('status.toPlay', { color: this.colorName(this.logic.currentPlayer) }));
            }
            if (!this.network?.isConnected) this.setOnlineColor(null);
        });
    }

    playAt(coord) {
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(tr('status.waitingForColor', { color: this.colorName(this.logic.currentPlayer) }));
            return;
        }
        const result = this.logic.tryPlay(coord, this.logic.currentPlayer);
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        this.afterLocalAction(tr('status.toPlay', { color: this.colorName(this.logic.currentPlayer) }));
    }

    passTurn() {
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(tr('status.waitingForColor', { color: this.colorName(this.logic.currentPlayer) }));
            return;
        }
        const color = this.logic.currentPlayer;
        const result = this.logic.pass(color);
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        this.afterLocalAction(this.logic.scoringPending ? tr('status.twoPasses') : tr('status.toPlay', { color: this.colorName(this.logic.currentPlayer) }));
    }

    agreeCount() {
        const color = this.gameModeSelect.value === 'online'
            ? this.myColor
            : (!this.logic.countAgreements.black ? 'black' : 'white');
        const result = this.logic.agreeToCount(color);
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        if (this.logic.gameOver) {
            this.stopTimer();
            this.setStatus(this.resultText());
        } else {
            this.setStatus(tr('status.agreed', { color: this.colorName(color), other: this.colorName(otherColor(color)) }));
        }
        this.broadcastState();
        this.updateUI();
    }

    surrender() {
        const color = this.gameModeSelect.value === 'online' && this.myColor ? this.myColor : this.logic.currentPlayer;
        this.logic.gameOver = true;
        this.logic.winner = otherColor(color);
        this.logic.moveHistory.unshift({ type: 'surrender', color, number: this.logic.moveNumber });
        this.stopTimer();
        this.setStatus(tr('status.surrendered', { color: this.colorName(color), winner: this.colorName(this.logic.winner) }));
        this.broadcastState();
        this.updateUI();
    }

    afterLocalAction(message) {
        this.gameStarted = true;
        this.lockSettings();
        this.startTimer();
        this.setStatus(message);
        this.broadcastState();
        this.updateUI();
    }

    resetGame({ broadcast = false } = {}) {
        if (this.settingsLocked && !broadcast && this.gameStarted) return;
        this.logic = this.createLogic();
        this.gameStarted = false;
        this.settingsLocked = this.network?.isConnected || false;
        this.timeLimit = Number(this.timerSelect.value) || 0;
        this.timeRemaining = { black: this.timeLimit, white: this.timeLimit };
        this.stopTimer();
        this.setStatus(tr('status.start'));
        if (broadcast) this.broadcastState();
        this.updateUI();
    }

    startTimer() {
        if (this.timerInterval || this.timeLimit <= 0 || this.logic.gameOver || this.logic.scoringPending) return;
        this.timerInterval = window.setInterval(() => {
            if (this.logic.gameOver || this.logic.scoringPending) {
                this.stopTimer();
                return;
            }
            const color = this.logic.currentPlayer;
            this.timeRemaining[color] = Math.max(0, this.timeRemaining[color] - 1);
            if (this.timeRemaining[color] <= 0) {
                this.logic.gameOver = true;
                this.logic.winner = otherColor(color);
                this.stopTimer();
                this.setStatus(tr('status.timedOut', { color: this.colorName(color), winner: this.colorName(this.logic.winner) }));
                this.broadcastState();
            }
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (!this.timerInterval) return;
        window.clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    canActFor(color) {
        if (this.gameModeSelect.value !== 'online') return true;
        return this.network.isConnected && this.myColor === color;
    }

    lockSettings() {
        this.settingsLocked = true;
        this.modeSelect.disabled = true;
        this.sizeSelect.disabled = true;
        this.timerSelect.disabled = true;
    }

    unlockSettingsIfLocal() {
        if (this.gameStarted || this.network.isConnected) return;
        this.settingsLocked = false;
        this.modeSelect.disabled = false;
        this.sizeSelect.disabled = false;
        this.timerSelect.disabled = false;
    }

    updateOnlineControls() {
        const online = this.gameModeSelect.value === 'online';
        this.onlineControls.classList.toggle('active', online);
        if (!online) {
            this.network.close({ silent: true });
            this.myColor = null;
            this.onlineColorEl.textContent = tr('online.localStatus');
            this.unlockSettingsIfLocal();
        }
        this.updateUI();
    }

    updateUI() {
        const isR3 = this.logic.topology === 'r3';
        const isSphere = this.logic.topology === SPHERE_GO_TOPOLOGY;
        const isKlein = this.logic.topology === KLEIN_BOTTLE_TOPOLOGY;
        const modeKey = isR3 ? 'r3' : isSphere ? 'sphere' : isKlein ? 'klein' : 't2';
        this.modeDisplay.textContent = tr(`mode.${modeKey}Display`, {
            size: this.logic.size,
            width: this.logic.width,
            height: this.logic.height
        });
        this.modeInfo.textContent = tr(`mode.${modeKey}Info`);
        this.sphereViewGroup.hidden = !isSphere;
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : this.logic.scoringPending ? tr('status.countingPending') : tr('status.toPlay', { color: this.colorName(this.logic.currentPlayer) });
        this.blackCapturedEl.textContent = tr('captured.stones', { count: this.logic.captures.black });
        this.whiteCapturedEl.textContent = tr('captured.stones', { count: this.logic.captures.white });
        this.blackTimerBox.classList.toggle('active', this.logic.currentPlayer === 'black' && !this.logic.gameOver);
        this.whiteTimerBox.classList.toggle('active', this.logic.currentPlayer === 'white' && !this.logic.gameOver);
        this.countBtn.disabled = !this.logic.scoringPending || this.logic.gameOver || (this.gameModeSelect.value === 'online' && !this.myColor);
        this.passBtn.disabled = this.logic.gameOver || this.logic.scoringPending;
        this.updateTimerDisplay();
        this.renderHistory();
        this.renderScore();
        this.renderChatMessages();
        this.renderer.renderStones(this.logic);
        if (!this.network?.isConnected && this.gameModeSelect.value !== 'online') {
            this.onlineColorEl.textContent = tr('online.localStatus');
        }
    }

    updateTimerDisplay() {
        this.blackTimerEl.textContent = this.formatTime(this.timeRemaining.black);
        this.whiteTimerEl.textContent = this.formatTime(this.timeRemaining.white);
    }

    renderHistory() {
        if (!this.logic.moveHistory.length) {
            this.historyEl.innerHTML = `<div class="move-history-item muted">${tr('history.started')}</div>`;
            return;
        }
        this.historyEl.innerHTML = this.logic.moveHistory.slice(0, 80).map((move) => {
            if (move.type === 'play') return `<div class="move-history-item">${move.number}. ${this.capitalize(move.color)} (${move.coord.map((v) => v + 1).join(',')})${move.captured ? ` captures ${move.captured}` : ''}</div>`;
            if (move.type === 'pass') return `<div class="move-history-item">${move.number}. ${this.capitalize(move.color)} passes</div>`;
            if (move.type === 'surrender') return `<div class="move-history-item">${this.capitalize(move.color)} surrendered</div>`;
            if (move.type === 'score') return `<div class="move-history-item">${tr('status.finalCount')} ${this.resultText()}</div>`;
            return '';
        }).join('');
    }

    renderScore() {
        if (!this.logic.score) {
            this.scorePanel.hidden = true;
            this.scoreResult.textContent = '';
            return;
        }
        this.scorePanel.hidden = false;
        this.scoreResult.textContent = tr('score.summary', { black: this.logic.score.black, white: this.logic.score.white, komi: this.logic.score.komi, result: this.resultText() });
    }

    resultText() {
        if (!this.logic.gameOver) return '';
        if (this.logic.winner === 'draw') return tr('score.draw');
        if (this.logic.score) return tr('score.winsBy', { color: this.colorName(this.logic.winner), margin: this.logic.score.margin });
        return tr('score.wins', { color: this.colorName(this.logic.winner) });
    }

    formatTime(value) {
        const seconds = Math.max(0, Number(value) || 0);
        const minutes = Math.floor(seconds / 60);
        const rest = seconds % 60;
        return `${minutes}:${String(rest).padStart(2, '0')}`;
    }

    capitalize(value) {
        return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
    }

    colorName(color) {
        return tr('colors.' + color);
    }

    setStatus(text) {
        this.statusEl.textContent = text;
    }

    setOnlineColor(color) {
        this.myColor = color;
        this.onlineColorEl.textContent = color ? tr('online.onlineAs', { color: this.colorName(color) }) : tr('online.localStatus');
    }

    escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    }

    renderChatMessages() {
        const canChat = this.gameModeSelect.value === 'online' && this.network?.isConnected;
        if (this.chatInput) this.chatInput.disabled = !canChat;
        if (this.chatSendBtn) this.chatSendBtn.disabled = !canChat;
        if (!this.chatMessagesEl) return;
        if (this.chatMessages.length === 0) {
            this.chatMessagesEl.innerHTML = `<div class="chat-empty">${this.escapeHTML(tr('chat.empty'))}</div>`;
            return;
        }
        this.chatMessagesEl.innerHTML = this.chatMessages.map((message) => {
            const mine = message.senderId && this.network?.peer?.id && message.senderId === this.network.peer.id;
            const author = message.author === 'black' || message.author === 'white'
                ? this.colorName(message.author)
                : message.author || tr('chat.player');
            const time = message.time ? new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return `<div class="chat-message${mine ? ' mine' : ''}"><div class="chat-meta">${this.escapeHTML(author)}${time ? ` - ${this.escapeHTML(time)}` : ''}</div><div class="chat-text">${this.escapeHTML(message.text || '')}</div></div>`;
        }).join('');
        this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;
    }

    sendChatMessage() {
        const text = this.chatInput?.value.trim();
        if (!text) return;
        if (this.gameModeSelect.value !== 'online' || !this.network?.isConnected) {
            this.setStatus(tr('chat.connectFirst'));
            this.updateUI();
            return;
        }
        const message = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            author: this.myColor || this.logic.currentPlayer,
            senderId: this.network.peer?.id || '',
            text,
            time: Date.now()
        };
        this.receiveChatMessage(message);
        this.network.sendChat(message);
        if (this.chatInput) this.chatInput.value = '';
    }

    receiveChatMessage(message) {
        if (!message || typeof message.text !== 'string') return;
        const cleaned = {
            id: message.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            author: message.author || 'player',
            senderId: message.senderId || '',
            text: message.text.slice(0, 240),
            time: message.time || Date.now()
        };
        if (this.chatMessages.some((item) => item.id === cleaned.id)) return;
        this.chatMessages.push(cleaned);
        if (this.chatMessages.length > 80) this.chatMessages.shift();
        this.renderChatMessages();
    }

    getNetworkSettings() {
        const mode = ['r3', 't2', 'sphere'].includes(this.modeSelect.value) ? this.modeSelect.value : 'r3';
        return {
            variant: mode === 't2' ? 't2go' : mode === 'sphere' ? 's2go' : 'r3go',
            mode,
            size: Number(this.sizeSelect.value) || 19,
            timer: Number(this.timerSelect.value) || 0
        };
    }

    exportNetworkState() {
        return {
            logic: this.logic.exportState(),
            gameStarted: this.gameStarted,
            timeLimit: this.timeLimit,
            timeRemaining: { ...this.timeRemaining },
            timerValue: Number(this.timerSelect.value) || 0,
            modeValue: this.modeSelect.value
        };
    }

    importNetworkState(state) {
        if (!state?.logic) return;
        this.stopTimer();
        this.logic.importState(state.logic);
        this.modeSelect.value = this.logic.topology === 't2'
            ? 't2'
            : this.logic.topology === SPHERE_GO_TOPOLOGY
                ? 'sphere'
                : this.logic.topology === KLEIN_BOTTLE_TOPOLOGY ? 'klein' : 'r3';
        this.sizeSelect.value = String(this.logic.size);
        this.timerSelect.value = String(state.timerValue ?? state.timeLimit ?? 0);
        this.timeLimit = Number(state.timeLimit) || 0;
        this.timeRemaining = {
            black: Number(state.timeRemaining?.black) || this.timeLimit,
            white: Number(state.timeRemaining?.white) || this.timeLimit
        };
        this.gameStarted = Boolean(state.gameStarted);
        this.lockSettings();
        if (this.gameStarted && !this.logic.gameOver && !this.logic.scoringPending) this.startTimer();
        this.setStatus(this.logic.gameOver ? this.resultText() : tr('status.synced'));
        this.updateUI();
    }

    broadcastState() {
        if (this.network.isConnected) this.network.sendState();
    }

    sphereView() {
        return this.sphereViewSelect?.value === '2d' ? '2d' : '3d';
    }
}

window.go3dApp = new Go3DApp();
