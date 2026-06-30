import * as THREE from 'three';
import { installGo3DRobot } from './robot/Go3DRobot.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
    BCC_LATTICE,
    CYLINDER_GO_TOPOLOGY,
    COLORS,
    FCC_LATTICE,
    GoGameLogic,
    HCP_LATTICE,
    HONEYCOMB_LATTICE,
    otherColor,
    R3_RANDOM_TOPOLOGY,
    R3_RP3_TOPOLOGY,
    R3_STANDARD_TOPOLOGY,
    SIMPLE_CUBIC_LATTICE,
    SQUARE_LATTICE,
    TRIANGULAR_LATTICE,
    T3_PBC_TOPOLOGY,
    valueToColor
} from './GoGame.js';
import { FirebaseStateNetworkManager } from '../../../js/FirebaseStateNetworkManager.js';
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
import { MOBIUS_GO_TOPOLOGY, RP2_GO_TOPOLOGY } from './NonOrientableGoTopology.js';
import {
    createKleinBottleSurfaceGeometry,
    createKleinBottleGridLines,
    kleinBottlePose
} from '../../../js/geometry/KleinBottleGeometry.js';
import {
    createBuckyballSphereGridLines,
    createBuckyballSphereVertices,
    sphereArcPoints
} from '../../../js/geometry/SphereBoardGeometry.js';
import {
    advanceIndexedPieceAges,
    createAgeArray,
    normalizePieceTimeConfig
} from '../../../js/time/PieceAgeClock.js';

const PUBLIC_GAME_URL = 'https://youxunzhangjim-netizen.github.io/Topoboardgame/3D/3dgo/';
const STORAGE_PREFIX = '3dgo:room:';
const KOMI = 7.5;
const LANGUAGE_STORAGE_KEY = '3dgo:language';
const GLOBAL_LANGUAGE_STORAGE_KEY = 'topological-boardgame:language';

const R3_LIKE_TOPOLOGIES = new Set([R3_STANDARD_TOPOLOGY, T3_PBC_TOPOLOGY, R3_RANDOM_TOPOLOGY, R3_RP3_TOPOLOGY]);
const TWO_PI = Math.PI * 2;
const MOBIUS_BAND_RADIUS = 3.05;
const MOBIUS_BAND_HALF_WIDTH = 1.18;
const RP2_CELL_SIZE = 0.72;
const RP2_CELL_GAP = 0.035;
const RP2_EDGE_GAP = 0.84;
const RP2_BOARD_LIFT = 0.02;
const CYLINDER_RADIUS = 2.38;
const CYLINDER_HEIGHT = 5.8;
const SPHERE_COORDINATE_LATTICE = 'sphere_coordinate';
const BUCKYBALL_LATTICE = 'buckyball';

function isR3LikeTopology(topology) {
    return R3_LIKE_TOPOLOGIES.has(topology);
}

function normalizeGoMode(value) {
    const mode = String(value || '').toLowerCase();
    if (['s2', 'sphere'].includes(mode)) return 'sphere';
    if (['t3', 't3go', 'pbc3d', '3d_pbc', 'r3_random', 'r3-random', 'r3rbc', 'rbc3d', '3d_rbc', 'random3d', 'rp3', 'real_projective_3', 'real-projective-3', 'projective3'].includes(mode)) return R3_STANDARD_TOPOLOGY;
    if (['cylinder', 'cyl', 'pbcx', 'pbc-x', 'x-periodic', 'periodic-x'].includes(mode)) return CYLINDER_GO_TOPOLOGY;
    if (['t2', 't2go', 'torus'].includes(mode)) return 't2';
    if (['klein', 'klein_bottle'].includes(mode)) return 'klein';
    if (['mobius', 'moebius', 'mobius_strip'].includes(mode)) return 'mobius';
    if (['rp2', 'projective', 'real_projective_plane'].includes(mode)) return R3_STANDARD_TOPOLOGY;
    return R3_STANDARD_TOPOLOGY;
}

function normalizeR3Boundary(value) {
    const mode = String(value || '').toLowerCase();
    if (['t3', 't3go', 'pbc3d', '3d_pbc', 'pbc', 'periodic'].includes(mode)) return T3_PBC_TOPOLOGY;
    if (['r3_random', 'r3-random', 'r3rbc', 'rbc3d', '3d_rbc', 'random3d', 'rbc'].includes(mode)) return R3_RANDOM_TOPOLOGY;
    if (['rp3', 'real_projective_3', 'real-projective-3', 'projective3', 'antipodal3d'].includes(mode)) return R3_RP3_TOPOLOGY;
    return R3_STANDARD_TOPOLOGY;
}

function r3BoundaryKey(topology) {
    const boundary = normalizeR3Boundary(topology);
    if (boundary === T3_PBC_TOPOLOGY) return 't3';
    if (boundary === R3_RANDOM_TOPOLOGY) return 'r3Random';
    if (boundary === R3_RP3_TOPOLOGY) return 'rp3';
    return 'r3Open';
}

const I18N = {
    en: {
        language: { label: 'Language', english: 'English', chinese: 'Chinese' },
        navigation: { home: 'Home' },
        app: { title: '3D Go', tagline: 'R3 lattice, T2 torus, S2 sphere, Klein bottle, and Mobius strip Go with 9, 13, and 19 scale options.' },
        colors: { black: 'Black', white: 'White' },
        captured: { byBlack: 'Captured by Black', byWhite: 'Captured by White', stones: ({ count }) => count + ' ' + (count === 1 ? 'stone' : 'stones') },
        controls: { title: 'Game Controls', gameMode: 'Game Mode', local: 'Local', online: 'Online', goSpace: 'Go Space', lattice: 'Lattice', sphereView: 'Sphere View', boardScale: 'Board Scale', timer: 'Timer per Player', sliceView: 'R3 Slice View', sliceHelp: 'Empty fields show all sites. x = 5 shows the whole yz-plane.', resetCamera: 'Reset Camera', focusOwnPieces: 'Focus Own', pass: 'Pass', agreeCount: 'Agree Count', newGame: 'New Game', surrender: 'Surrender' },
        online: { localStatus: 'Local pass and play', findMatch: 'Find Match', privateRoom: 'PRIVATE ROOM', createRoom: 'Create Room', or: 'OR', roomInput: '5-digit room code or shared link', joinRoom: 'Join Room', roomCode: 'Room Code', copy: 'Copy', copied: 'Copied', onlineAs: ({ color }) => 'Online as ' + color },
        chat: { title: 'Online Chat', empty: 'Connect online to chat.', placeholder: 'Message online opponent', send: 'Send', player: 'Player', connectFirst: 'Connect online before chatting.' },
        mode: { r3Option: 'R3 Go', t2Option: 'T2 Torus Go', sphereOption: 'S2 Sphere Go', kleinOption: 'Klein Bottle Go', sphere3d: '3D Sphere', sphere2d: '2D Cut-open Fallback', r3Display: ({ size }) => size + '^3 R3 Go', t2Display: ({ size }) => size + ' x ' + size + ' T2 Go', sphereDisplay: ({ width, height }) => width + ' x ' + height + ' S2 Go', kleinDisplay: ({ width, height }) => width + ' x ' + height + ' Klein Bottle Go', r3Info: 'R3 uses open boundaries in x, y, and z.', t2Info: 'T2 wraps both directions on the torus board.', sphereInfo: 'S2 uses longitude rings with horizontal wrap. The north and south pole nodes are playable and connect to every point on the nearest latitude ring.', kleinInfo: 'The Klein bottle has normal left-right wrap and flipped top-bottom wrap: leaving at x enters at width - 1 - x.' },
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
        controls: { title: '遊戲控制', gameMode: '遊戲模式', local: '本地輪流', online: '線上多人', goSpace: '圍棋空間', lattice: '格點', sphereView: '球面視圖', boardScale: '棋盤尺度', timer: '每方時間', sliceView: 'R3 切片視圖', sliceHelp: '空白代表顯示全部。x = 5 只顯示第 5 層 yz 平面。', resetCamera: '重設視角', focusOwnPieces: '突出己方', pass: '停一手', agreeCount: '同意計分', newGame: '新遊戲', surrender: '認輸' },
        online: { localStatus: '本地輪流', findMatch: '尋找配對', privateRoom: '私人房間', createRoom: '建立房間', or: '或', roomInput: '5 位房間碼或分享連結', joinRoom: '加入房間', roomCode: '房間碼', copy: '複製', copied: '已複製', onlineAs: ({ color }) => '線上身分：' + color },
        mode: { r3Option: 'R3 圍棋', t2Option: 'T2 環面圍棋', sphereOption: 'S2 球面圍棋', kleinOption: '克萊因瓶圍棋', sphere3d: '3D 球面', sphere2d: '2D 切開備用視圖', r3Display: ({ size }) => size + '^3 R3 圍棋', t2Display: ({ size }) => size + ' x ' + size + ' T2 圍棋', sphereDisplay: ({ width, height }) => width + ' x ' + height + ' S2 圍棋', kleinDisplay: ({ width, height }) => width + ' x ' + height + ' 克萊因瓶圍棋', r3Info: 'R3 在 x、y、z 三個方向使用開放邊界。', t2Info: 'T2 在環面棋盤的兩個方向皆為週期連接。', sphereInfo: 'S2 使用經度環並在水平方向循環。南北極點可落子，並連到最近緯度環上的每個節點。', kleinInfo: '克萊因瓶的左右邊界直接循環；上下邊界循環時翻轉 x，從 x 離開後會在 width - 1 - x 進入。' },
        timer: { none: '無計時', five: '5 分鐘', ten: '10 分鐘', thirty: '30 分鐘', hour: '1 小時', oneDay: '1 天' },
        history: { title: '走法記錄', started: '遊戲開始。' },
        rules: { title: '規則', text: '面積計分，貼目 7.5。提子、氣、超級劫與領地皆使用所選棋盤的圖相鄰關係。' },
        status: { start: '請選擇一個發光節點讓黑方落子。', waitingForColor: ({ color }) => '等待' + color + '。', toPlay: ({ color }) => color + '落子', countingPending: '等待計分確認', twoPasses: '雙方連續停一手。兩位玩家都需要同意計分。', agreed: ({ color, other }) => color + '已同意，等待' + other + '。', surrendered: ({ color, winner }) => color + '認輸，' + winner + '獲勝。', timedOut: ({ color, winner }) => color + '逾時，' + winner + '獲勝。', synced: '已同步線上棋局。', finalCount: '終局計分：' },
        score: { draw: '和局', wins: ({ color }) => color + '獲勝', winsBy: ({ color, margin }) => color + '勝 ' + margin, summary: ({ black, white, komi, result }) => '黑方 ' + black + '，白方 ' + white + '，含貼目 ' + komi + '。' + result }
    }
};

Object.assign(I18N.en.controls, {
    boundaryCondition: 'R3 Boundary Condition'
});
I18N.en.boundary = {
    r3Open: 'Standard open boundary',
    t3Pbc: 'T3 PBC: all-side periodic',
    r3Rbc: '3D RBC: random boundary condition',
    rp3: 'RP3: antipodal boundary'
};
Object.assign(I18N.zh.controls, {
    boundaryCondition: 'R3 邊界條件'
});
I18N.zh.boundary = {
    r3Open: '標準開放邊界',
    t3Pbc: 'T3 PBC：全方向週期',
    r3Rbc: '3D RBC：隨機邊界條件'
};
Object.assign(I18N.en.app, {
    tagline: 'R3 Standard, T3 PBC, 3D RBC, RP3, T2 torus, S2 sphere, Klein bottle, and Mobius strip Go with 9, 13, and 19 scale options.'
});
Object.assign(I18N.en.score, {
    pendingDraw: 'Counting pending: provisional draw',
    pendingLead: ({ color, margin }) => 'Counting pending: ' + color + ' leads by ' + margin
});
Object.assign(I18N.zh.score, {
    pendingDraw: '等待計分：暫時和棋',
    pendingLead: ({ color, margin }) => '等待計分：' + color + '暫時領先 ' + margin
});
Object.assign(I18N.en.score, {
    stones: 'stones',
    territory: 'territory',
    komiLabel: 'komi',
    neutralDame: 'neutral / dame',
    deadBlackRemoved: 'dead black removed',
    deadWhiteRemoved: 'dead white removed',
    mixedNeutral: 'Mixed-border empty regions stay neutral.'
});
Object.assign(I18N.zh.score, {
    stones: '棋子',
    territory: '地',
    komiLabel: '貼目',
    neutralDame: '中立 / 單官',
    deadBlackRemoved: '已移除黑方死子',
    deadWhiteRemoved: '已移除白方死子',
    mixedNeutral: '混合邊界的空區保持中立。'
});
Object.assign(I18N.en.mode, {
    r3Option: 'R3 Standard Go',
    t3Option: 'T3 PBC Go',
    r3RandomOption: '3D RBC Go',
    r3Display: ({ size }) => size + '^3 R3 Standard Go',
    t3Display: ({ size }) => size + '^3 T3 PBC Go',
    r3RandomDisplay: ({ size }) => size + '^3 3D RBC Go',
    rp3Display: ({ size }) => size + '^3 RP3 Go',
    r3Info: 'R3 Standard uses ordinary open boundaries in x, y, and z.',
    t3Info: 'T3 PBC wraps x, y, and z, so every cubic axis is periodic.',
    r3RandomInfo: '3D RBC uses one fixed seeded random map from each cube-boundary exit to another boundary point.',
    rp3Info: 'RP3 identifies each R3 boundary exit with the opposite side and reverses the other two coordinates, giving an antipodal projective boundary.'
});
Object.assign(I18N.zh.app, {
    tagline: 'R3 標準、T3 週期、3D RBC、T2 環面、S2 球面、Klein bottle 與 Mobius strip 圍棋，支援 9、13、19 尺度。'
});
Object.assign(I18N.zh.mode, {
    r3Option: 'R3 標準圍棋',
    t3Option: 'T3 週期圍棋',
    r3RandomOption: '3D RBC 圍棋',
    r3Display: ({ size }) => size + '^3 R3 標準圍棋',
    t3Display: ({ size }) => size + '^3 T3 週期圍棋',
    r3RandomDisplay: ({ size }) => size + '^3 3D RBC 圍棋',
    r3Info: 'R3 標準在 x、y、z 三個方向使用普通開放邊界。',
    t3Info: 'T3 週期會在 x、y、z 三個方向全部週期連接。',
    r3RandomInfo: '3D RBC 會用固定種子的隨機映射，把每個立方體邊界出口連到另一個邊界點。'
});

Object.assign(I18N.zh.app, {
    title: '3D 圍棋',
    tagline: 'R3 標準、T3 週期、3D RBC、T2 環面、S2 球面、Klein 瓶與 Mobius 帶圍棋，支援 9、13、19 尺度。'
});
Object.assign(I18N.zh.mode, {
    r3Option: 'R3 Standard 圍棋',
    t3Option: 'T3 PBC 圍棋',
    r3RandomOption: '3D RBC 圍棋',
    t2Option: 'T2 環面圍棋',
    sphereOption: 'S2 球面圍棋',
    kleinOption: 'Klein 瓶圍棋',
    mobiusOption: 'Mobius 帶圍棋',
    rp2Option: 'RP2 圍棋',
    r3Display: ({ size }) => size + '^3 R3 Standard 圍棋',
    t3Display: ({ size }) => size + '^3 T3 PBC 圍棋',
    r3RandomDisplay: ({ size }) => size + '^3 3D RBC 圍棋',
    t2Display: ({ size }) => size + ' x ' + size + ' T2 環面圍棋',
    sphereDisplay: ({ width, height }) => width + ' x ' + height + ' S2 球面圍棋',
    kleinDisplay: ({ width, height }) => width + ' x ' + height + ' Klein 瓶圍棋',
    mobiusDisplay: ({ width, height }) => width + ' x ' + height + ' Mobius 帶圍棋',
    rp2Display: ({ width, height }) => width + ' x ' + height + ' RP2 圍棋',
    r3Info: 'R3 標準在 x、y、z 三個方向使用普通開放邊界。',
    t3Info: 'T3 PBC 會在 x、y、z 三個方向週期包回。',
    r3RandomInfo: '3D RBC 會用固定種子的隨機映射，把每個立方體邊界出口連到另一個邊界點。',
    t2Info: 'T2 環面會在棋盤兩個方向週期包回。',
    sphereInfo: 'S2 球面使用經度環；水平方向包回，南北極點可落子並連到最近緯度環。',
    kleinInfo: 'Klein 瓶左右正常包回，上下包回時 x 會翻轉為 width - 1 - x。',
    mobiusInfo: 'Mobius 帶使用單一扭轉方向包回，垂直方向維持開放邊界。',
    rp2Info: 'RP2 使用立體對映邊界板；升起的弧線顯示對邊反轉黏合，每次穿越邊界會翻轉另一個座標。'
});


Object.assign(I18N.en.mode, {
    mobiusOption: 'Mobius Strip Go',
    rp2Option: 'RP2 Go',
    cylinderOption: 'Cylinder Go',
    mobiusDisplay: ({ width, height }) => width + ' x ' + height + ' Mobius Strip Go',
    rp2Display: ({ width, height }) => width + ' x ' + height + ' RP2 Go',
    cylinderDisplay: ({ size }) => size + ' x ' + size + ' Cylinder Go',
    mobiusInfo: 'Mobius strip uses one twisted horizontal wrap with open vertical edges.',
    rp2Info: 'RP2 uses a raised projective board with antipodal glue arcs; crossing any cut edge flips the transverse coordinate.',
    cylinderInfo: 'Cylinder Go wraps left-right around the circumference while top and bottom remain open.'
});

Object.assign(I18N.zh.mode, {
    cylinderOption: '圓柱圍棋',
    cylinderDisplay: ({ size }) => size + ' x ' + size + ' 圓柱圍棋',
    cylinderInfo: '圓柱只在左右方向週期包回，上下邊界保持開放。'
});

Object.assign(I18N.zh.boundary, {
    rp3: 'RP3：對映邊界'
});
Object.assign(I18N.zh.app, {
    tagline: 'R3 標準、T3 週期、3D RBC、RP3、T2 環面、S2 球面、Klein 瓶與 Mobius 帶圍棋，支援 9、13、19 尺度。'
});
Object.assign(I18N.zh.mode, {
    rp3Option: 'RP3 圍棋',
    rp3Display: ({ size }) => size + '^3 RP3 圍棋',
    rp3Info: 'RP3 把 R3 邊界出口對接到對面，並翻轉另外兩個座標，形成實射影三維的對映邊界。'
});

function normalizeLanguage(value) {
    const language = String(value || '');
    return language === 'zh' || language === 'zh-Hant' || language === 'zh_tw' ? 'zh' : language === 'en' ? 'en' : '';
}

let currentLanguage = (() => {
    try {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = normalizeLanguage(params.get('lang'));
        if (fromUrl && Object.prototype.hasOwnProperty.call(I18N, fromUrl)) return fromUrl;
        const global = normalizeLanguage(window.localStorage.getItem(GLOBAL_LANGUAGE_STORAGE_KEY));
        if (global && Object.prototype.hasOwnProperty.call(I18N, global)) return global;
        const stored = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
        return stored && Object.prototype.hasOwnProperty.call(I18N, stored) ? stored : 'en';
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
    try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        window.localStorage.setItem(GLOBAL_LANGUAGE_STORAGE_KEY, language);
    } catch {}
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
        this.raycaster.params.Points.threshold = 0.12;
        this.pointer = new THREE.Vector2();
        this.boardGroup = new THREE.Group();
        this.stoneGroup = new THREE.Group();
        this.hoverGroup = new THREE.Group();
        this.scene.add(this.boardGroup, this.stoneGroup, this.hoverGroup);
        this.focusColor = null;
        this.pointCoords = [];
        this.pointPositions = [];
        this.nodePoints = null;
        this.buckyballPositionCache = new Map();
        this.mode = '';
        this.size = 0;
        this.width = 0;
        this.height = 0;
        this.view = '';
        this.lattice = '';
        this.sliceSignature = '';
        this.pointerGesture = null;
        this.clock = new THREE.Clock();
        this.initLights();
        this.bind();
        this.resize();
        this.resetCamera();
        this.animate();
    }

    initLights() {
        const ambient = new THREE.AmbientLight(0xf4fbff, 0.58);
        this.scene.add(ambient);
        const hemi = new THREE.HemisphereLight(0xf0fbff, 0x20180f, 1.95);
        this.scene.add(hemi);
        const key = new THREE.DirectionalLight(0xffffff, 2.75);
        key.position.set(5, 9, 7);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        this.scene.add(key);
        const fill = new THREE.PointLight(0x7dd3fc, 1.75, 32);
        fill.position.set(-6, 3, -5);
        this.scene.add(fill);
    }

    bind() {
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
        this.canvas.addEventListener('pointermove', (event) => this.handlePointerMove(event));
        this.canvas.addEventListener('pointerleave', () => this.setHover(null));
        this.canvas.addEventListener('pointerup', (event) => this.handlePointerUp(event));
        this.canvas.addEventListener('pointercancel', () => { this.pointerGesture = null; });
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
        const visualLattice = logic.topology === SPHERE_GO_TOPOLOGY ? this.app.currentLattice() : logic.lattice;
        const sliceSignature = this.app?.r3SliceSignature?.() || '';
        if (this.mode === logic.topology
            && this.size === logic.size
            && this.width === logic.width
            && this.height === logic.height
            && this.lattice === visualLattice
            && this.view === view
            && this.sliceSignature === sliceSignature) return;
        this.mode = logic.topology;
        this.size = logic.size;
        this.width = logic.width;
        this.height = logic.height;
        this.lattice = visualLattice;
        this.view = view;
        this.sliceSignature = sliceSignature;
        this.controls.enableRotate = !(logic.topology === SPHERE_GO_TOPOLOGY && view === '2d');
        this.controls.minPolarAngle = logic.topology === CYLINDER_GO_TOPOLOGY ? Math.PI / 2 : 0;
        this.controls.maxPolarAngle = logic.topology === CYLINDER_GO_TOPOLOGY ? Math.PI / 2 : Math.PI;
        this.clearGroup(this.boardGroup);
        this.clearGroup(this.hoverGroup);
        this.pointCoords = [];
        this.pointPositions = [];
        this.nodePoints = null;
        if (isR3LikeTopology(logic.topology)) this.buildR3(logic);
        else if (logic.topology === 't2') this.buildTorus(logic);
        else if (logic.topology === CYLINDER_GO_TOPOLOGY) this.buildCylinder(logic);
        else if (logic.topology === MOBIUS_GO_TOPOLOGY) this.buildMobius(logic.width, logic.height);
        else if (logic.topology === RP2_GO_TOPOLOGY) this.buildRP2(logic.width, logic.height);
        else if (logic.topology === KLEIN_BOTTLE_TOPOLOGY) this.buildKlein(logic.width, logic.height);
        else if (view === '2d') this.buildSphereFlat(logic.width, logic.height);
        else this.buildSphere(logic.width, logic.height);
        this.resetCamera();
    }

    buildSphere(width, height) {
        const logic = this.app.logic;
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
        surface.userData.kleinPickOccluder = true;
        surface.userData.surfacePickOccluder = true;
        this.boardGroup.add(surface);

        const linePositions = [];
        if (this.app.sphereGridMode() === BUCKYBALL_LATTICE) {
            for (const points of createBuckyballSphereGridLines({ radius, lift: 0.07, segments: 9 })) {
                this.appendPolyline(linePositions, points);
            }
        } else {
            const drawn = new Set();
            for (const coord of logic.playableCoords()) {
                const fromKey = logic.coordKey(coord);
                for (const neighbor of logic.neighborsFromCoord(coord)) {
                    const edgeKey = [fromKey, logic.coordKey(neighbor)].sort().join('|');
                    if (drawn.has(edgeKey)) continue;
                    drawn.add(edgeKey);
                    this.appendPolyline(
                        linePositions,
                        sphereArcPoints(
                            this.spherePosition(coord, width, height, 0.055),
                            this.spherePosition(neighbor, width, height, 0.055),
                            10
                        )
                    );
                }
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({ color: 0x060606, transparent: true, opacity: 0.68 })
        ));

        const pointPositions = [];
        for (const coord of logic.playableCoords()) {
            const point = this.sphereDisplayPosition(coord, width, height, 0.075);
            this.pointCoords.push(coord);
            this.pointPositions.push(point);
            pointPositions.push(point.x, point.y, point.z);
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.075 : width <= 13 ? 0.056 : 0.042, {
            color: 0x10100f,
            opacity: 0.92
        });
    }

    buildSphereFlat(width, height) {
        const logic = this.app.logic;
        const linePositions = [];
        const pointPositions = [];
        const scale = 7 / Math.max(width - 1, height - 1);
        const position = ([x, y]) => new THREE.Vector3(
            x === 0 && y === -1 ? 0 : x === 0 && y === height ? 0 : (x - (width - 1) / 2) * scale,
            y === -1 ? ((height - 1) / 2 + 1.2) * scale
                : y === height ? (-(height - 1) / 2 - 1.2) * scale
                : ((height - 1) / 2 - y) * scale,
            0
        );
        const drawn = new Set();
        for (const coord of logic.playableCoords()) {
            const point = position(coord);
            this.pointCoords.push(coord);
            this.pointPositions.push(point);
            pointPositions.push(point.x, point.y, point.z);
            const fromKey = logic.coordKey(coord);
            for (const neighbor of logic.neighborsFromCoord(coord)) {
                const edgeKey = [fromKey, logic.coordKey(neighbor)].sort().join('|');
                if (drawn.has(edgeKey)) continue;
                drawn.add(edgeKey);
                const next = position(neighbor);
                linePositions.push(point.x, point.y, 0, next.x, next.y, 0);
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
        const surface = new THREE.Mesh(
            createKleinBottleSurfaceGeometry({ uSegments: 240, vSegments: 100, lift: 0 }),
            new THREE.MeshPhysicalMaterial({
                color: 0x7b5a2f,
                roughness: 0.64,
                metalness: 0.01,
                transparent: true,
                opacity: 0.72,
                depthWrite: false,
                clearcoat: 0.2,
                clearcoatRoughness: 0.54,
                side: THREE.DoubleSide
            })
        );
        surface.renderOrder = 2;
        surface.castShadow = false;
        surface.receiveShadow = false;
        surface.userData.kleinPickOccluder = true;
        this.boardGroup.add(surface);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x050505,
            transparent: true,
            opacity: 0.9,
            depthTest: true,
            depthWrite: false
        });
        const addLine = (points, material = gridMaterial) => {
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
            line.renderOrder = 4;
            this.boardGroup.add(line);
        };

        for (const points of createKleinBottleGridLines({
            uSteps: Math.max(8, Math.min(12, Math.round(height * 0.55))),
            vSteps: Math.max(8, Math.min(12, width)),
            lift: 0.035,
            uSegments: 220,
            vSegments: 160
        })) addLine(points);

        const pointPositions = [];
        const logic = this.app.logic;
        for (const coord of logic.playableCoords()) {
            const pose = this.kleinOutsidePose(coord, width, height, 0.18);
            this.pointCoords.push(coord);
            this.pointPositions.push(pose.position);
            pointPositions.push(pose.position.x, pose.position.y, pose.position.z);
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.026 : width <= 13 ? 0.021 : 0.017, {
            color: 0x050505,
            opacity: 0.58,
            depthTest: true,
            renderOrder: 5
        });
    }

    buildMobius(width, height) {
        const surfaceMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x8f6238,
            roughness: 0.58,
            metalness: 0.02,
            transparent: true,
            opacity: 0.78,
            depthWrite: false,
            clearcoat: 0.28,
            clearcoatRoughness: 0.48,
            side: THREE.DoubleSide
        });
        const surface = new THREE.Mesh(
            this.createMobiusSolidGeometry(224, 50, 0.064),
            surfaceMaterial
        );
        surface.castShadow = true;
        surface.receiveShadow = true;
        surface.userData.mobiusPickOccluder = true;
        surface.userData.surfacePickOccluder = true;
        this.boardGroup.add(surface);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x050505,
            transparent: true,
            opacity: 0.9,
            depthTest: false,
            depthWrite: false
        });
        const seamMaterial = new THREE.LineBasicMaterial({
            color: 0x050505,
            transparent: true,
            opacity: 0.95,
            depthTest: false,
            depthWrite: false
        });
        const logic = this.app.logic;
        const addLine = (points, material = gridMaterial) => {
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
            line.userData = { type: 'grid' };
            line.renderOrder = 2;
            this.boardGroup.add(line);
        };

        const drawn = new Set();
        for (const coord of logic.playableCoords()) {
            const fromKey = logic.coordKey(coord);
            for (const neighbor of logic.neighborsFromCoord(coord)) {
                const edgeKey = [fromKey, logic.coordKey(neighbor)].sort().join('|');
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
        for (const coord of logic.playableCoords()) {
            for (const lift of [0.075, -0.075]) {
                const pose = this.mobiusPose(coord, width, height, lift);
                this.pointCoords.push(coord);
                this.pointPositions.push(pose.position);
                pointPositions.push(pose.position.x, pose.position.y, pose.position.z);
            }
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.058 : width <= 13 ? 0.047 : 0.036, {
            color: 0x050505,
            opacity: 0.96,
            depthTest: false,
            renderOrder: 3
        });
        this.addMobiusStarPoints(width, height);
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
            const end = a[0] === width - 1 ? b : a;
            const u0 = (start[0] / Math.max(1, width)) * TWO_PI;
            const t = this.mobiusTForY(start[1], height);
            for (let step = 0; step <= segments; step += 1) {
                const u = THREE.MathUtils.lerp(u0, TWO_PI, step / segments);
                points.push(this.mobiusPoint(u, t, lift));
            }
            const endT = this.mobiusTForY(end[1], height);
            for (let step = 1; step <= Math.max(2, Math.ceil(segments / 5)); step += 1) {
                const tStep = THREE.MathUtils.lerp(-t, endT, step / Math.max(2, Math.ceil(segments / 5)));
                points.push(this.mobiusPoint(0, tStep, lift));
            }
            return points;
        }

        const sameRow = a[1] === b[1];
        const sameColumn = a[0] === b[0];
        if (sameRow) {
            const start = a[0] <= b[0] ? a : b;
            const end = start === a ? b : a;
            const u0 = (start[0] / Math.max(1, width)) * TWO_PI;
            const u1 = (end[0] / Math.max(1, width)) * TWO_PI;
            const t = this.mobiusTForY(start[1], height);
            for (let step = 0; step <= segments; step += 1) {
                const u = THREE.MathUtils.lerp(u0, u1, step / segments);
                points.push(this.mobiusPoint(u, t, lift));
            }
            return points;
        }

        if (sameColumn) {
            const start = a[1] <= b[1] ? a : b;
            const end = start === a ? b : a;
            const u = (start[0] / Math.max(1, width)) * TWO_PI;
            const t0 = this.mobiusTForY(start[1], height);
            const t1 = this.mobiusTForY(end[1], height);
            for (let step = 0; step <= segments; step += 1) {
                const t = THREE.MathUtils.lerp(t0, t1, step / segments);
                points.push(this.mobiusPoint(u, t, lift));
            }
            return points;
        }

        points.push(this.mobiusPose(a, width, height, lift).position);
        points.push(this.mobiusPose(b, width, height, lift).position);
        return points;
    }

    buildRP2(width, height) {
        const spanX = this.rp2BoardSpanX(width);
        const spanZ = this.rp2BoardSpanZ(height);
        const surface = new THREE.Mesh(
            new THREE.BoxGeometry(spanX + RP2_CELL_SIZE * 0.9, 0.065, spanZ + RP2_CELL_SIZE * 0.9),
            new THREE.MeshPhysicalMaterial({
                color: 0x835b33,
                roughness: 0.62,
                metalness: 0.02,
                clearcoat: 0.18,
                clearcoatRoughness: 0.48
            })
        );
        surface.position.y = RP2_BOARD_LIFT - 0.075;
        surface.receiveShadow = true;
        this.boardGroup.add(surface);

        const cellMaterialA = new THREE.MeshPhysicalMaterial({
            color: 0xd39a5d,
            roughness: 0.5,
            metalness: 0.02,
            clearcoat: 0.2
        });
        const cellMaterialB = new THREE.MeshPhysicalMaterial({
            color: 0x9f7148,
            roughness: 0.55,
            metalness: 0.02,
            clearcoat: 0.18
        });
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = new THREE.Mesh(
                    new THREE.BoxGeometry(RP2_CELL_SIZE * 0.96, 0.035, RP2_CELL_SIZE * 0.96),
                    (x + y) % 2 === 0 ? cellMaterialA : cellMaterialB
                );
                cell.position.copy(this.rp2Position([x, y], width, height, -0.018));
                cell.castShadow = true;
                cell.receiveShadow = true;
                this.boardGroup.add(cell);
            }
        }

        const linePositions = [];
        const pointPositions = [];
        const addLine = (a, b) => linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const coord = [x, y];
                const point = this.rp2Position(coord, width, height, 0.06);
                this.pointCoords.push(coord);
                this.pointPositions.push(point);
                pointPositions.push(point.x, point.y, point.z);
                if (x < width - 1) addLine(point, this.rp2Position([x + 1, y], width, height, 0.06));
                if (y < height - 1) addLine(point, this.rp2Position([x, y + 1], width, height, 0.06));
            }
        }

        const gridGeometry = new THREE.BufferGeometry();
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(
            gridGeometry,
            new THREE.LineBasicMaterial({ color: 0x4b2f1b, transparent: true, opacity: 0.76, depthWrite: false })
        ));
        this.addNodePoints(pointPositions, width <= 9 ? 0.062 : width <= 13 ? 0.048 : 0.037, {
            color: 0x23140d,
            opacity: 0.97
        });
        this.addRP2BoundaryRails(width, height);
        this.addRP2GlueLinks(width, height);
        this.addRP2StarPoints(width, height);
    }

    addRP2BoundaryRails(width, height) {
        const lrMaterial = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0ea5e9,
            emissiveIntensity: 0.2,
            roughness: 0.34
        });
        const tbMaterial = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.2,
            roughness: 0.36
        });
        for (let y = 0; y < height; y++) {
            for (const side of ['left', 'right']) {
                const rail = new THREE.Mesh(
                    new THREE.BoxGeometry(0.12, 0.08, RP2_CELL_SIZE * 0.72),
                    lrMaterial
                );
                rail.position.copy(this.rp2EdgePoint(side, y, width, height, 0.075));
                rail.castShadow = true;
                this.boardGroup.add(rail);
            }
        }
        for (let x = 0; x < width; x++) {
            for (const side of ['top', 'bottom']) {
                const rail = new THREE.Mesh(
                    new THREE.BoxGeometry(RP2_CELL_SIZE * 0.72, 0.08, 0.12),
                    tbMaterial
                );
                rail.position.copy(this.rp2EdgePoint(side, x, width, height, 0.075));
                rail.castShadow = true;
                this.boardGroup.add(rail);
            }
        }
    }

    addRP2GlueLinks(width, height) {
        for (let y = 0; y < height; y++) this.addRP2BoundaryLink('left', y, width, height);
        for (let x = 0; x < width; x++) this.addRP2BoundaryLink('top', x, width, height);
    }

    addRP2BoundaryLink(side, index, width, height) {
        const horizontal = side === 'left' || side === 'right';
        const targetSide = this.rp2OppositeSide(side);
        const reversedIndex = horizontal ? height - 1 - index : width - 1 - index;
        const start = this.rp2EdgePoint(side, index, width, height, 1.42);
        const end = this.rp2EdgePoint(targetSide, reversedIndex, width, height, 1.42);
        const maxIndex = Math.max(1, (horizontal ? height : width) - 1);
        const normalized = (index / maxIndex) * 2 - 1;
        const domeAmount = Math.sqrt(Math.max(0, 1 - normalized * normalized));
        const apex = start.clone().add(end).multiplyScalar(0.5);
        apex.y = THREE.MathUtils.lerp(4.6, 6.8, domeAmount);
        if (horizontal) apex.z = normalized * this.rp2BoardSpanZ(height) * 0.44;
        else apex.x = normalized * this.rp2BoardSpanX(width) * 0.44;

        const curve = new THREE.CatmullRomCurve3([start, apex, end], false, 'centripetal', 0.42);
        const material = new THREE.MeshBasicMaterial({
            color: horizontal ? 0xa5f3fc : 0xfde68a,
            transparent: true,
            opacity: 0.78,
            depthWrite: false
        });
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.007, 8, false), material);
        tube.renderOrder = 5;
        this.boardGroup.add(tube);

        const arrowMaterial = new THREE.MeshStandardMaterial({
            color: horizontal ? 0xa5f3fc : 0xfde68a,
            emissive: horizontal ? 0x22d3ee : 0xfbbf24,
            emissiveIntensity: 0.55,
            roughness: 0.24,
            transparent: true,
            opacity: 0.9
        });
        for (const t of [0.16, 0.84]) {
            const arrow = this.createRP2Arrow(curve.getPoint(t), curve.getTangent(t), arrowMaterial);
            this.boardGroup.add(arrow);
        }
    }

    createRP2Arrow(position, direction, material) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.15, 18), material);
        const tangent = direction.clone().normalize();
        cone.position.copy(position).add(tangent.clone().multiplyScalar(-0.062));
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
        cone.castShadow = true;
        return cone;
    }

    coordVisible(coord) {
        return this.app?.coordVisibleInSlice?.(coord) !== false;
    }

    buildR3(logic) {
        const size = logic.size;
        const linePositions = [];
        const material = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.26 });
        const drawn = new Set();
        for (const coord of logic.playableCoords()) {
            if (!this.coordVisible(coord)) continue;
            const fromKey = logic.coordKey(coord);
            for (const neighbor of logic.neighborsFromCoord(coord)) {
                if (!this.coordVisible(neighbor)) continue;
                if (neighbor.some((value, axis) => Math.abs(value - coord[axis]) > 1)) continue;
                const edgeKey = [fromKey, logic.coordKey(neighbor)].sort().join('|');
                if (drawn.has(edgeKey)) continue;
                drawn.add(edgeKey);
                const a = this.r3Position(coord, size, logic.lattice);
                const b = this.r3Position(neighbor, size, logic.lattice);
                linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
            }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(geometry, material));

        const pointPositions = [];
        for (const coord of logic.playableCoords()) {
            if (!this.coordVisible(coord)) continue;
            const p = this.r3Position(coord, size, logic.lattice);
            this.pointCoords.push(coord);
            this.pointPositions.push(p);
            pointPositions.push(p.x, p.y, p.z);
        }
        this.addNodePoints(pointPositions, size <= 9 ? 0.06 : size <= 13 ? 0.045 : 0.034);
        const scale = this.r3Scale(size);
        const axes = new THREE.AxesHelper(scale * (size - 1) * 0.65);
        axes.material.depthTest = false;
        axes.renderOrder = 3;
        this.boardGroup.add(axes);
    }

    buildTorus(logic) {
        const size = logic.size;
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
        torus.userData.surfacePickOccluder = true;
        this.boardGroup.add(torus);

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x2b180e,
            transparent: true,
            opacity: 0.82,
            depthWrite: false
        });
        const linePositions = [];
        const drawn = new Set();
        for (const coord of logic.playableCoords()) {
            const fromKey = logic.coordKey(coord);
            for (const neighbor of logic.neighborsFromCoord(coord)) {
                const edgeKey = [fromKey, logic.coordKey(neighbor)].sort().join('|');
                if (drawn.has(edgeKey)) continue;
                drawn.add(edgeKey);
                this.appendPolyline(linePositions, this.torusSurfaceEdgePoints(coord, neighbor, size, logic.lattice, 0.04));
            }
        }
        const gridGeometry = new THREE.BufferGeometry();
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(gridGeometry, gridMaterial));

        const pointPositions = [];
        for (const coord of logic.playableCoords()) {
            const p = this.torusPosition(coord, size, 0.055, logic.lattice).position;
            this.pointCoords.push(coord);
            this.pointPositions.push(p);
            pointPositions.push(p.x, p.y, p.z);
        }
        this.addNodePoints(
            pointPositions,
            size <= 9 ? 0.055 : size <= 13 ? 0.044 : 0.034,
            { color: 0x4b2f1b, opacity: 0.96 }
        );
        if (logic.lattice === SQUARE_LATTICE) this.addTorusStarPoints(size);
    }

    buildCylinder(logic) {
        const width = logic.width;
        const height = logic.height;
        const surface = new THREE.Mesh(
            new THREE.CylinderGeometry(CYLINDER_RADIUS, CYLINDER_RADIUS, CYLINDER_HEIGHT, 128, 1, true),
            new THREE.MeshPhysicalMaterial({
                color: 0x6f8e56,
                roughness: 0.58,
                metalness: 0.02,
                transparent: true,
                opacity: 0.74,
                depthWrite: false,
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
            color: 0xe6efad,
            transparent: true,
            opacity: 0.78,
            depthWrite: false
        });
        const linePositions = [];
        const drawn = new Set();
        for (const coord of logic.playableCoords()) {
            const fromKey = logic.coordKey(coord);
            for (const neighbor of logic.neighborsFromCoord(coord)) {
                const edgeKey = [fromKey, logic.coordKey(neighbor)].sort().join('|');
                if (drawn.has(edgeKey)) continue;
                drawn.add(edgeKey);
                this.appendPolyline(linePositions, this.cylinderSurfaceEdgePoints(coord, neighbor, width, height, logic.lattice, 0.04));
            }
        }
        const gridGeometry = new THREE.BufferGeometry();
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.boardGroup.add(new THREE.LineSegments(gridGeometry, gridMaterial));

        const pointPositions = [];
        for (const coord of logic.playableCoords()) {
            const p = this.cylinderPosition(coord, width, height, 0.06, logic.lattice).position;
            this.pointCoords.push(coord);
            this.pointPositions.push(p);
            pointPositions.push(p.x, p.y, p.z);
        }
        this.addNodePoints(pointPositions, width <= 9 ? 0.062 : width <= 13 ? 0.048 : 0.036, {
            color: 0xf4f6c8,
            opacity: 0.96
        });
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
                color: 0x332018,
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

    addMobiusStarPoints(width, height) {
        const coords = this.starPoints(Math.min(width, height))
            .map(([x, y]) => [
                Math.round(x * (width - 1) / Math.max(1, Math.min(width, height) - 1)),
                Math.round(y * (height - 1) / Math.max(1, Math.min(width, height) - 1))
            ]);
        const unique = [...new Map(coords.map((coord) => [coord.join(','), coord])).values()]
            .filter(([x, y]) => x >= 0 && x < width && y >= 0 && y < height);
        if (!unique.length) return;
        const mesh = new THREE.InstancedMesh(
            new THREE.SphereGeometry(width <= 9 ? 0.074 : width <= 13 ? 0.06 : 0.045, 16, 10),
            new THREE.MeshStandardMaterial({ color: 0x332018, roughness: 0.7, metalness: 0.02, depthTest: false }),
            unique.length
        );
        const matrix = new THREE.Matrix4();
        unique.forEach((coord, index) => {
            const position = this.mobiusPose(coord, width, height, 0.1).position;
            matrix.makeTranslation(position.x, position.y, position.z);
            mesh.setMatrixAt(index, matrix);
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.renderOrder = 8;
        this.boardGroup.add(mesh);
    }

    addRP2StarPoints(width, height) {
        const coords = this.starPoints(Math.min(width, height))
            .map(([x, y]) => [
                Math.round(x * (width - 1) / Math.max(1, Math.min(width, height) - 1)),
                Math.round(y * (height - 1) / Math.max(1, Math.min(width, height) - 1))
            ]);
        const unique = [...new Map(coords.map((coord) => [coord.join(','), coord])).values()]
            .filter(([x, y]) => x >= 0 && x < width && y >= 0 && y < height);
        if (!unique.length) return;
        const mesh = new THREE.InstancedMesh(
            new THREE.SphereGeometry(width <= 9 ? 0.072 : width <= 13 ? 0.056 : 0.043, 16, 10),
            new THREE.MeshStandardMaterial({ color: 0x2b1a13, roughness: 0.68, metalness: 0.02 }),
            unique.length
        );
        const matrix = new THREE.Matrix4();
        unique.forEach((coord, index) => {
            const position = this.rp2Position(coord, width, height, 0.12);
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
        if (size === 19) return [3, 9, 15].flatMap((x) => [3, 9, 15].map((y) => [x, y]));
        const center = Math.floor(size / 2);
        const low = Math.max(1, Math.floor(size / 4));
        const high = Math.min(size - 2, size - 1 - low);
        return [...new Map([
            [center, center],
            [low, low],
            [low, high],
            [high, low],
            [high, high]
        ].filter(([x, y]) => x >= 0 && y >= 0 && x < size && y < size)
            .map((coord) => [coord.join(','), coord])).values()];
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
        this.buildBoard(logic);
        this.clearGroup(this.stoneGroup);
        const black = [];
        const white = [];
        const ageRings = [];
        for (let index = 0; index < logic.board.length; index++) {
            const value = logic.board[index];
            if (!value) continue;
            const coord = logic.coordFromIndex(index);
            if (this.app?.isSpaceTimeIndexVisible?.(index, coord) === false) continue;
            if (!this.coordVisible(coord)) continue;
            const positions = this.positionsForCoord(coord, logic);
            if (value === COLORS.black) black.push(...positions);
            else white.push(...positions);
            if (this.app?.shouldShowAgeRings?.()) {
                for (const position of positions) ageRings.push({ position, age: this.app.pieceAges?.[index] || 0 });
            }
        }
        this.addStoneInstances(black, 'black', logic);
        this.addStoneInstances(white, 'white', logic);
        this.addAgeRings(ageRings, logic);
    }

    addStoneInstances(positions, color, logic) {
        if (!positions.length) return;
        const radius = isR3LikeTopology(logic.topology)
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
            emissiveIntensity: 1.6,
            transparent: true,
            opacity: 1
        });
        stoneMaterial.userData.baseOpacity = stoneMaterial.opacity;
        dotMaterial.userData.baseOpacity = dotMaterial.opacity;
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
        stoneMesh.userData.pieceColor = color;
        dotMesh.userData.pieceColor = color;
        this.applyPieceFocusToObject(stoneMesh);
        this.applyPieceFocusToObject(dotMesh);
        this.stoneGroup.add(stoneMesh, dotMesh);
    }

    addAgeRings(items, logic) {
        if (!items.length) return;
        const config = this.app?.pieceTimeConfig?.();
        if (!config?.enabled) return;
        const lifetime = Math.max(1, Number(config.lifespan || config.lifetime) || 1);
        const radius = isR3LikeTopology(logic.topology)
            ? (logic.size <= 9 ? 0.18 : logic.size <= 13 ? 0.13 : 0.095)
            : (logic.size <= 9 ? 0.16 : logic.size <= 13 ? 0.13 : 0.105);
        const ringGeometry = new THREE.TorusGeometry(radius * 1.55, Math.max(0.012, radius * 0.085), 10, 64);
        const normalMaterial = new THREE.MeshBasicMaterial({ color: 0x9ffcff, transparent: true, opacity: 0.96, depthWrite: false });
        const warnMaterial = new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 1, depthWrite: false });
        normalMaterial.userData.baseOpacity = normalMaterial.opacity;
        warnMaterial.userData.baseOpacity = warnMaterial.opacity;
        for (const item of items) {
            const age = Number(item.age || 0);
            if (!Number.isFinite(age) || age <= 0) continue;
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

    setHover(coord, logic = this.app.logic) {
        this.clearGroup(this.hoverGroup);
        if (!coord || logic.gameOver || logic.scoringPending || !this.coordVisible(coord)) return;
        const index = logic.indexFromCoord(coord);
        if (index < 0 || logic.board[index] !== COLORS.empty) return;
        const p = this.positionForCoord(coord, logic);
        const radius = isR3LikeTopology(logic.topology)
            ? (logic.size <= 9 ? 0.2 : logic.size <= 13 ? 0.145 : 0.105)
            : (logic.size <= 9 ? 0.18 : logic.size <= 13 ? 0.145 : 0.115);
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 20, 12),
            new THREE.MeshBasicMaterial({ color: logic.currentPlayer === 'black' ? 0x111827 : 0xffffff, transparent: true, opacity: 0.38 })
        );
        mesh.position.copy(p);
        this.hoverGroup.add(mesh);
    }

    positionsForCoord(coord, logic) {
        if (logic.topology === MOBIUS_GO_TOPOLOGY) {
            return [
                this.mobiusPose(coord, logic.width, logic.height, 0.18).position,
                this.mobiusPose(coord, logic.width, logic.height, -0.18).position
            ];
        }
        return [this.positionForCoord(coord, logic)];
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
        const logic = this.app.logic;
        const isSurfaceGraph = ['t2', CYLINDER_GO_TOPOLOGY, KLEIN_BOTTLE_TOPOLOGY, MOBIUS_GO_TOPOLOGY, RP2_GO_TOPOLOGY, SPHERE_GO_TOPOLOGY].includes(logic?.topology);
        if (!isSurfaceGraph) return null;
        const targetX = event.clientX - rect.left;
        const targetY = event.clientY - rect.top;
        const maxPixels = logic?.topology === KLEIN_BOTTLE_TOPOLOGY || logic?.topology === MOBIUS_GO_TOPOLOGY ? 24 : 18;
        const projected = new THREE.Vector3();
        let best = null;
        for (let index = 0; index < this.pointPositions.length; index += 1) {
            const coord = this.pointCoords[index];
            const pose = logic.topology === 't2'
                ? this.torusPosition(coord, logic.size, 0.055, logic.lattice)
                : logic.topology === CYLINDER_GO_TOPOLOGY
                    ? this.cylinderPosition(coord, logic.width, logic.height, 0.06, logic.lattice)
                    : logic.topology === RP2_GO_TOPOLOGY
                        ? this.rp2Pose(coord, logic.width, logic.height, 0.075)
                        : logic.topology === KLEIN_BOTTLE_TOPOLOGY
                            ? this.kleinOutsidePose(coord, logic.width, logic.height, 0.11)
                            : logic.topology === MOBIUS_GO_TOPOLOGY
                                ? this.mobiusPose(coord, logic.width, logic.height, 0.075)
                                : { position: this.sphereDisplayPosition(coord, logic.width, logic.height, 0.08), normal: this.sphereDisplayPosition(coord, logic.width, logic.height, 0).normalize() };
            if (logic.topology !== KLEIN_BOTTLE_TOPOLOGY && this.surfaceOccludesDistance(this.camera.position.distanceTo(pose.position))) continue;
            if (['t2', SPHERE_GO_TOPOLOGY].includes(logic.topology) && !this.isPoseFacingCamera(pose.position, pose.normal)) continue;
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
        if (!hit || !logic || !['t2', CYLINDER_GO_TOPOLOGY, KLEIN_BOTTLE_TOPOLOGY, MOBIUS_GO_TOPOLOGY, RP2_GO_TOPOLOGY, SPHERE_GO_TOPOLOGY].includes(logic.topology)) return Boolean(hit);
        const coord = this.pointCoords[hit.index];
        if (!coord) return false;
        const pose = logic.topology === 't2'
            ? this.torusPosition(coord, logic.size, 0.055, logic.lattice)
            : logic.topology === CYLINDER_GO_TOPOLOGY
                ? this.cylinderPosition(coord, logic.width, logic.height, 0.06, logic.lattice)
            : logic.topology === RP2_GO_TOPOLOGY
                    ? this.rp2Pose(coord, logic.width, logic.height, 0.075)
                    : logic.topology === KLEIN_BOTTLE_TOPOLOGY
                    ? this.kleinOutsidePose(coord, logic.width, logic.height, 0.11)
                    : logic.topology === MOBIUS_GO_TOPOLOGY
                        ? this.mobiusPose(coord, logic.width, logic.height, 0.075)
                        : { position: this.sphereDisplayPosition(coord, logic.width, logic.height, 0.08), normal: this.sphereDisplayPosition(coord, logic.width, logic.height, 0).normalize() };
        if (logic.topology !== KLEIN_BOTTLE_TOPOLOGY && this.surfaceOccludesDistance(hit.distance)) return false;
        if (logic.topology === KLEIN_BOTTLE_TOPOLOGY || logic.topology === MOBIUS_GO_TOPOLOGY) return true;
        if (!this.isPoseFacingCamera(pose.position, pose.normal)) return false;
        return true;
    }

    surfaceOccludesDistance(distance) {
        const occluders = this.boardGroup.children.filter((child) => child.userData?.surfacePickOccluder);
        if (!occluders.length) return false;
        const surfaceHits = this.raycaster.intersectObjects(occluders, false);
        const nearest = surfaceHits.find((surfaceHit) => surfaceHit.distance > 0.01);
        return Boolean(nearest && nearest.distance < distance - 0.08);
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

    mobiusSurfaceOccludes(hit) {
        const occluders = this.boardGroup.children.filter((child) => child.userData?.mobiusPickOccluder);
        if (!occluders.length) return false;
        const surfaceHits = this.raycaster.intersectObjects(occluders, false);
        const nearest = surfaceHits.find((surfaceHit) => surfaceHit.distance > 0.01);
        return Boolean(nearest && nearest.distance < hit.distance - 0.08);
    }

    isPoseFacingCamera(position, normal, threshold = 0.04) {
        return normal.clone().normalize().dot(this.camera.position.clone().sub(position).normalize()) > threshold;
    }

    handlePointerMove(event) {
        if (this.pointerGesture) {
            this.pointerGesture.distance = Math.max(
                this.pointerGesture.distance,
                Math.hypot(event.clientX - this.pointerGesture.x, event.clientY - this.pointerGesture.y)
            );
        }
        const coord = this.pickCoord(event);
        this.setHover(coord);
    }

    handlePointerDown(event) {
        this.pointerGesture = {
            x: event.clientX,
            y: event.clientY,
            distance: 0,
            cameraPosition: this.camera.position.clone(),
            cameraQuaternion: this.camera.quaternion.clone(),
            target: this.controls.target.clone()
        };
    }

    settleClickCamera(gesture) {
        const damping = this.controls.enableDamping;
        this.controls.enableDamping = false;
        this.controls.update();
        this.camera.position.copy(gesture.cameraPosition);
        this.camera.quaternion.copy(gesture.cameraQuaternion);
        this.controls.target.copy(gesture.target);
        this.controls.update();
        this.controls.enableDamping = damping;
    }

    handlePointerUp(event) {
        const gesture = this.pointerGesture;
        this.pointerGesture = null;
        if (!gesture) return;
        const distance = Math.max(
            gesture.distance,
            Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y)
        );
        if (distance > 5) return;
        this.settleClickCamera(gesture);
        const coord = this.pickCoord(event);
        if (coord && this.coordVisible(coord)) this.app.playAt(coord);
    }

    positionForCoord(coord, logic) {
        if (logic.topology === 't2') return this.torusPosition(coord, logic.size, 0.18, logic.lattice).position;
        if (logic.topology === CYLINDER_GO_TOPOLOGY) return this.cylinderPosition(coord, logic.width, logic.height, 0.18, logic.lattice).position;
        if (logic.topology === MOBIUS_GO_TOPOLOGY) {
            return this.mobiusPose(coord, logic.width, logic.height, 0.18, logic.lattice).position;
        }
        if (logic.topology === RP2_GO_TOPOLOGY) {
            return this.rp2Position(coord, logic.width, logic.height, 0.18);
        }
        if (logic.topology === KLEIN_BOTTLE_TOPOLOGY) {
            return this.kleinOutsidePose(coord, logic.width, logic.height, 0.18).position;
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
            return this.sphereDisplayPosition(coord, logic.width, logic.height, 0.18);
        }
        return this.r3Position(coord, logic.size, logic.lattice);
    }

    sphereDisplayPosition(coord, width, height, lift = 0) {
        if (this.app?.sphereGridMode?.() === BUCKYBALL_LATTICE && this.app?.sphereView?.() !== '2d') {
            return this.buckyballPositionForCoord(coord, width, height, lift);
        }
        return this.spherePosition(coord, width, height, lift);
    }

    orderedSphereCoords(width, height) {
        const coords = typeof this.app?.logic?.playableCoords === 'function'
            ? this.app.logic.playableCoords()
            : [];
        const rank = (coord) => {
            const x = Number(coord?.[0]) || 0;
            const y = Number(coord?.[1]) || 0;
            if (y < 0) return [-1, 0];
            if (y >= height) return [height + 1, 0];
            return [y, x];
        };
        return [...coords].sort((a, b) => {
            const ra = rank(a);
            const rb = rank(b);
            return ra[0] - rb[0] || ra[1] - rb[1];
        });
    }

    orderedBuckyballVertices(lift = 0) {
        return createBuckyballSphereVertices({ radius: 3.5, lift })
            .sort((a, b) => {
                const angleA = Math.atan2(a.y, a.x);
                const angleB = Math.atan2(b.y, b.x);
                return b.z - a.z || angleA - angleB;
            });
    }

    buckyballPositionForCoord(coord, width, height, lift = 0) {
        const key = `${width}:${height}:${lift}:${coord?.join?.(',')}`;
        if (!this.buckyballPositionCache) this.buckyballPositionCache = new Map();
        if (this.buckyballPositionCache.has(key)) return this.buckyballPositionCache.get(key).clone();
        const coords = this.orderedSphereCoords(width, height);
        const index = Math.max(0, coords.findIndex((item) => this.app.logic.coordKey(item) === this.app.logic.coordKey(coord)));
        const vertices = this.orderedBuckyballVertices(lift);
        const position = vertices[index % vertices.length]?.clone() || this.spherePosition(coord, width, height, lift);
        this.buckyballPositionCache.set(key, position.clone());
        return position;
    }

    spherePosition(coord, width, height, lift = 0) {
        const point = sphereVertexPosition(coord, width, height, 3.5, lift);
        return new THREE.Vector3(point.x, point.y, point.z);
    }

    rp2BoardStep() {
        return RP2_CELL_SIZE + RP2_CELL_GAP;
    }

    rp2BoardSpanX(width) {
        return width * RP2_CELL_SIZE + (width - 1) * RP2_CELL_GAP;
    }

    rp2BoardSpanZ(height) {
        return height * RP2_CELL_SIZE + (height - 1) * RP2_CELL_GAP;
    }

    rp2CellX(x, width) {
        return (Number(x) - (width - 1) / 2) * this.rp2BoardStep();
    }

    rp2CellZ(y, height) {
        return (Number(y) - (height - 1) / 2) * this.rp2BoardStep();
    }

    rp2Position(coord, width, height, lift = 0) {
        return new THREE.Vector3(
            this.rp2CellX(coord[0], width),
            RP2_BOARD_LIFT + lift,
            this.rp2CellZ(coord[1], height)
        );
    }

    rp2Pose(coord, width, height, lift = 0) {
        return {
            position: this.rp2Position(coord, width, height, lift),
            normal: new THREE.Vector3(0, 1, 0)
        };
    }

    rp2EdgePoint(side, index, width, height, lift = 0.12) {
        const left = this.rp2CellX(0, width) - RP2_CELL_SIZE / 2 - RP2_EDGE_GAP;
        const right = this.rp2CellX(width - 1, width) + RP2_CELL_SIZE / 2 + RP2_EDGE_GAP;
        const top = this.rp2CellZ(0, height) - RP2_CELL_SIZE / 2 - RP2_EDGE_GAP;
        const bottom = this.rp2CellZ(height - 1, height) + RP2_CELL_SIZE / 2 + RP2_EDGE_GAP;
        if (side === 'left') return new THREE.Vector3(left, RP2_BOARD_LIFT + lift, this.rp2CellZ(index, height));
        if (side === 'right') return new THREE.Vector3(right, RP2_BOARD_LIFT + lift, this.rp2CellZ(index, height));
        if (side === 'top') return new THREE.Vector3(this.rp2CellX(index, width), RP2_BOARD_LIFT + lift, top);
        return new THREE.Vector3(this.rp2CellX(index, width), RP2_BOARD_LIFT + lift, bottom);
    }

    rp2OppositeSide(side) {
        return {
            left: 'right',
            right: 'left',
            top: 'bottom',
            bottom: 'top'
        }[side] || side;
    }

    r3Scale(size) {
        return 7.8 / Math.max(1, size - 1);
    }

    r3Position(coord, size, lattice = SIMPLE_CUBIC_LATTICE) {
        const scale = this.r3Scale(size);
        const center = (size - 1) / 2;
        if (lattice === HCP_LATTICE) {
            const layerShiftX = coord[2] % 2 ? 0.5 : 0;
            const layerShiftZ = coord[2] % 2 ? Math.sqrt(3) / 6 : 0;
            const planeX = coord[0] + coord[1] * 0.5 + layerShiftX;
            const planeZ = coord[1] * Math.sqrt(3) / 2 + layerShiftZ;
            const centerX = center * 1.5 + 0.25;
            const centerZ = center * Math.sqrt(3) / 2 + Math.sqrt(3) / 12;
            return new THREE.Vector3(
                (planeX - centerX) * scale * 0.68,
                (coord[2] - center) * scale * Math.sqrt(2 / 3),
                (planeZ - centerZ) * scale * 0.68
            );
        }
        return new THREE.Vector3((coord[0] - center) * scale, (coord[2] - center) * scale, (coord[1] - center) * scale);
    }

    latticeSurfaceUV(coord, width, height, lattice = SQUARE_LATTICE) {
        if (lattice === TRIANGULAR_LATTICE) {
            const rawX = Number(coord[0]) + Number(coord[1]) * 0.5;
            const rawY = Number(coord[1]) * Math.sqrt(3) / 2;
            const circumference = Math.max(1, width);
            const periodicAxis = Math.max(1, height * Math.sqrt(3) / 2);
            const cylinderBand = Math.max(1, (height - 1) * Math.sqrt(3) / 2);
            return {
                u: (rawX / circumference) * TWO_PI,
                v: (rawY / periodicAxis) * TWO_PI,
                band: rawY / cylinderBand
            };
        }
        if (lattice === HONEYCOMB_LATTICE) {
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

    torusPointFromUV(uv, lift = 0) {
        const radius = 1.22 + lift;
        const ringRadius = 3.35 + radius * Math.cos(uv.v);
        return new THREE.Vector3(
            ringRadius * Math.cos(uv.u),
            ringRadius * Math.sin(uv.u),
            radius * Math.sin(uv.v)
        );
    }

    cylinderPointFromUV(uv, lift = 0) {
        const radius = CYLINDER_RADIUS + lift;
        const y = (0.5 - uv.band) * CYLINDER_HEIGHT;
        return new THREE.Vector3(radius * Math.cos(uv.u), y, radius * Math.sin(uv.u));
    }

    torusSurfaceEdgePoints(a, b, size, lattice = SQUARE_LATTICE, lift = 0.04, segments = 6) {
        const start = this.latticeSurfaceUV(a, size, size, lattice);
        const end = this.latticeSurfaceUV(b, size, size, lattice);
        const du = this.shortestAngleDelta(start.u, end.u);
        const dv = this.shortestAngleDelta(start.v, end.v);
        const points = [];
        for (let step = 0; step <= segments; step += 1) {
            const t = step / segments;
            points.push(this.torusPointFromUV({
                u: start.u + du * t,
                v: start.v + dv * t
            }, lift));
        }
        return points;
    }

    cylinderSurfaceEdgePoints(a, b, width, height, lattice = SQUARE_LATTICE, lift = 0.04, segments = 6) {
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

    torusPosition(coord, size, lift = 0, lattice = SQUARE_LATTICE) {
        if (lattice !== SQUARE_LATTICE) {
            const uv = this.latticeSurfaceUV(coord, size, size, lattice);
            const position = this.torusPointFromUV(uv, lift);
            const normal = new THREE.Vector3(Math.cos(uv.u) * Math.cos(uv.v), Math.sin(uv.u) * Math.cos(uv.v), Math.sin(uv.v)).normalize();
            return { position, normal };
        }
        const frame = torusFrame(coord, size, lift);
        const position = new THREE.Vector3(frame.position.x, frame.position.y, frame.position.z);
        const normal = new THREE.Vector3(frame.normal.x, frame.normal.y, frame.normal.z).normalize();
        return { position, normal };
    }

    cylinderPosition(coord, width, height, lift = 0, lattice = SQUARE_LATTICE) {
        const uv = this.latticeSurfaceUV(coord, width, height, lattice);
        const position = this.cylinderPointFromUV(uv, lift);
        const normal = new THREE.Vector3(Math.cos(uv.u), 0, Math.sin(uv.u)).normalize();
        return { position, normal };
    }

    kleinOutsidePose(coord, width, height, lift = 0.1) {
        const pose = kleinBottlePose(coord, width, height, -Math.abs(lift));
        pose.normal.multiplyScalar(-1);
        return pose;
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

    mobiusPose(coord, width, height, lift = 0, lattice = SQUARE_LATTICE) {
        const uv = this.latticeSurfaceUV(coord, width, height, lattice);
        const u = uv.u;
        const t = THREE.MathUtils.lerp(-MOBIUS_BAND_HALF_WIDTH, MOBIUS_BAND_HALF_WIDTH, uv.band);
        return {
            position: this.mobiusPoint(u, t, lift),
            normal: this.mobiusBasis(u, t).normal
        };
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

    resetCamera() {
        if (this.app?.logic?.topology === 't2') {
            this.camera.position.set(0, 5.6, 9.8);
            this.controls.target.set(0, 0, 0);
        } else if (this.app?.logic?.topology === CYLINDER_GO_TOPOLOGY) {
            this.camera.position.set(0, 0, 9.2);
            this.controls.target.set(0, 0, 0);
        } else if (this.app?.logic?.topology === MOBIUS_GO_TOPOLOGY) {
            this.camera.position.set(6.4, 4.8, 7.4);
            this.controls.target.set(0, 0, 0);
        } else if (this.app?.logic?.topology === RP2_GO_TOPOLOGY) {
            this.camera.position.set(0, 8.6, 7.4);
            this.controls.target.set(0, 0.35, 0);
        } else if (this.app?.logic?.topology === KLEIN_BOTTLE_TOPOLOGY) {
            this.camera.position.set(8.8, 4.8, 12.8);
            this.controls.target.set(0, -3.0, 0);
        } else if (this.app?.logic?.topology === SPHERE_GO_TOPOLOGY) {
            this.camera.position.set(0, 0, this.view === '2d' ? 10.5 : 18.5);
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
            if (child.userData?.ageRing) child.lookAt(this.camera.position);
        });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

class Go3DApp {
    constructor() {
        this.modeSelect = document.getElementById('goModeSelect');
        this.r3BoundaryGroup = document.getElementById('r3BoundaryGroup');
        this.r3BoundarySelect = document.getElementById('r3BoundarySelect');
        this.latticeGroup = document.getElementById('latticeGroup');
        this.latticeSelect = document.getElementById('latticeSelect');
        this.sphereViewSelect = document.getElementById('sphereViewSelect');
        this.sphereViewGroup = document.getElementById('sphereViewGroup');
        this.sizeSelect = document.getElementById('boardSizeSelect');
        this.customSizeInput = document.getElementById('customBoardSizeInput');
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
        this.timeEvolutionSelect = document.getElementById('timeEvolutionSelect');
        this.timeLifetimeInput = document.getElementById('timeLifetimeInput');
        this.noiseModeSelect = document.getElementById('noiseModeSelect');
        this.noisePeriodInput = document.getElementById('noisePeriodInput');
        this.blackCapturedEl = document.getElementById('blackCaptured');
        this.whiteCapturedEl = document.getElementById('whiteCaptured');
        this.historyEl = document.getElementById('moveHistoryList');
        this.scorePanel = document.getElementById('scorePanel');
        this.scoreResult = document.getElementById('scoreResult');
        this.passBtn = document.getElementById('passBtn');
        this.countBtn = document.getElementById('countBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.surrenderBtn = document.getElementById('surrenderBtn');
        this.focusOwnPiecesBtn = document.getElementById('focusOwnPiecesBtn');
        this.sliceFilterEl = document.getElementById('r3FilterControl') || document.getElementById('r3SliceFilter');
        this.sliceInputs = {
            x: document.getElementById('r3FilterX') || document.getElementById('sliceXInput'),
            y: document.getElementById('r3FilterY') || document.getElementById('sliceYInput'),
            z: document.getElementById('r3FilterZ') || document.getElementById('sliceZInput')
        };
        this.focusOwnPieces = false;
        this.roomIdInput = document.getElementById('roomIdInput');
        this.copyLinkBtn = document.getElementById('copyLinkBtn');
        this.shareLinkInput = document.getElementById('shareLinkInput');
        this.chatMessagesEl = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.chatSendBtn = document.getElementById('chatSendBtn');
        this.applyUrlSettings();
        this.syncBoundaryVisibility();
        this.syncLatticeOptions(this.selectedTopologyMode());
        this.logic = this.createLogic();
        this.renderer = new Go3DRenderer(this);
        this.network = new FirebaseStateNetworkManager(this, { gameKey: this.onlineGameKey(), matchKey: this.onlineMatchKey() });
        this.myColor = null;
        this.settingsLocked = false;
        this.gameStarted = false;
        this.timeLimit = Number(this.timerSelect.value) || 0;
        this.timeRemaining = { black: this.timeLimit, white: this.timeLimit };
        this.timerInterval = null;
        this.pieceAges = createAgeArray(this.logic.board.length);
        this.noiseTick = 0;
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
        const boundary = params.get('boundary') || params.get('boundaryCondition') || params.get('r3Boundary') || mode;
        if (mode) this.modeSelect.value = normalizeGoMode(mode);
        if (this.r3BoundarySelect) this.r3BoundarySelect.value = normalizeR3Boundary(boundary);

        const size = params.get('size');
        if (size !== null && size.trim() !== '' && Number.isFinite(Number(size))) this.setSizeSelection(size);

        const timer = params.get('timer');
        if ([...this.timerSelect.options].some((option) => option.value === timer)) {
            this.timerSelect.value = timer;
        }
        const lattice = String(params.get('lattice') || '').toLowerCase();
        if ([SQUARE_LATTICE, HONEYCOMB_LATTICE, TRIANGULAR_LATTICE, SIMPLE_CUBIC_LATTICE, BCC_LATTICE, FCC_LATTICE, HCP_LATTICE, SPHERE_COORDINATE_LATTICE, BUCKYBALL_LATTICE].includes(lattice)) {
            this.latticeSelect.value = lattice;
        }
    }

    syncLatticeOptions(mode = normalizeGoMode(this.modeSelect?.value || R3_STANDARD_TOPOLOGY)) {
        const allowed = isR3LikeTopology(mode)
            ? [SIMPLE_CUBIC_LATTICE, BCC_LATTICE, FCC_LATTICE, HCP_LATTICE]
            : mode === 't2' || mode === CYLINDER_GO_TOPOLOGY
                ? [SQUARE_LATTICE, HONEYCOMB_LATTICE, TRIANGULAR_LATTICE]
                : mode === 'sphere'
                    ? [SPHERE_COORDINATE_LATTICE, BUCKYBALL_LATTICE]
                    : [];
        this.latticeGroup.hidden = allowed.length === 0;
        for (const option of this.latticeSelect.options) {
            option.hidden = !allowed.includes(option.value);
            option.disabled = !allowed.includes(option.value);
        }
        if (allowed.length && !allowed.includes(this.latticeSelect.value)) {
            this.latticeSelect.value = allowed[0];
        }
        return allowed.length ? this.latticeSelect.value : (isR3LikeTopology(mode) ? SIMPLE_CUBIC_LATTICE : SQUARE_LATTICE);
    }

    syncBoundaryVisibility() {
        const spaceMode = this.selectedSpaceMode();
        if (this.r3BoundaryGroup) this.r3BoundaryGroup.hidden = spaceMode !== R3_STANDARD_TOPOLOGY;
        if (spaceMode !== R3_STANDARD_TOPOLOGY && this.r3BoundarySelect) {
            this.r3BoundarySelect.value = R3_STANDARD_TOPOLOGY;
        }
    }

    latticeName(lattice) {
        const resolvedLattice = lattice
            || (normalizeGoMode(this.modeSelect?.value || R3_STANDARD_TOPOLOGY) === 'sphere'
                ? this.currentLattice()
                : (this.logic?.lattice || this.latticeSelect.value));
        return ({
            [SQUARE_LATTICE]: 'Square',
            [HONEYCOMB_LATTICE]: 'Honeycomb',
            [TRIANGULAR_LATTICE]: 'Triangular',
            [SIMPLE_CUBIC_LATTICE]: 'Simple Cubic',
            [BCC_LATTICE]: 'BCC',
            [FCC_LATTICE]: 'FCC',
            [HCP_LATTICE]: 'HCP',
            [SPHERE_COORDINATE_LATTICE]: 'Geodesic',
            [BUCKYBALL_LATTICE]: 'Buckyball'
        })[resolvedLattice] || resolvedLattice;
    }

    latticeInfo(lattice = this.logic?.lattice) {
        const enInfo = {
            [SQUARE_LATTICE]: ' Square surface nodes have four wrapped neighbors.',
            [HONEYCOMB_LATTICE]: ' Honeycomb surface nodes form a zigzag nanotube-style graph with three wrapped neighbors.',
            [TRIANGULAR_LATTICE]: ' Triangular surface nodes have six wrapped neighbors.',
            [SIMPLE_CUBIC_LATTICE]: ' Simple-cubic sites have six nearest neighbors.',
            [BCC_LATTICE]: ' BCC sites use eight body-diagonal nearest neighbors.',
            [FCC_LATTICE]: ' FCC sites use twelve face-diagonal nearest neighbors.',
            [HCP_LATTICE]: ' HCP sites use six in-plane and six adjacent-layer nearest neighbors.'
        };
        const zhInfo = {
            [SQUARE_LATTICE]: ' 方格曲面節點有四個包回鄰居。',
            [HONEYCOMB_LATTICE]: ' 蜂巢曲面節點形成鋸齒型奈米碳管式圖格，並有三個包回鄰居。',
            [TRIANGULAR_LATTICE]: ' 三角曲面節點有六個包回鄰居。',
            [SIMPLE_CUBIC_LATTICE]: ' 簡單立方格點有六個最近鄰。',
            [BCC_LATTICE]: ' BCC 格點使用八個體對角最近鄰。',
            [FCC_LATTICE]: ' FCC 格點使用十二個面對角最近鄰。',
            [HCP_LATTICE]: ' HCP 格點使用六個同層與六個相鄰層最近鄰。'
        };
        enInfo[SPHERE_COORDINATE_LATTICE] = ' Geodesic sphere grid shows longitude-latitude arcs with playable pole nodes.';
        enInfo[BUCKYBALL_LATTICE] = ' Buckyball sphere grid shows pentagon/hexagon carbon-shell style arcs on the sphere.';
        zhInfo[SPHERE_COORDINATE_LATTICE] = ' Geodesic 球面格顯示經緯弧線，並保留可落子的南北極點。';
        zhInfo[BUCKYBALL_LATTICE] = ' Buckyball 球面格顯示五邊形與六邊形的碳殼式弧線。';
        return (currentLanguage === 'zh' ? zhInfo : enInfo)[lattice] || '';
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

    selectedSpaceMode() {
        return normalizeGoMode(this.modeSelect?.value || R3_STANDARD_TOPOLOGY);
    }

    selectedR3Boundary() {
        return normalizeR3Boundary(this.r3BoundarySelect?.value || R3_STANDARD_TOPOLOGY);
    }

    selectedTopologyMode() {
        const mode = this.selectedSpaceMode();
        return mode === R3_STANDARD_TOPOLOGY ? this.selectedR3Boundary() : mode;
    }

    createLogic() {
        const spaceMode = this.selectedSpaceMode();
        const mode = this.selectedTopologyMode();
        const visualLattice = this.syncLatticeOptions(mode);
        const lattice = mode === 'sphere' ? SQUARE_LATTICE : visualLattice;
        const requestedSize = this.boardSize();
        const needsEvenHoneycombSeam = lattice === HONEYCOMB_LATTICE
            && (mode === 't2' || mode === CYLINDER_GO_TOPOLOGY);
        const size = needsEvenHoneycombSeam && requestedSize % 2 ? requestedSize + 1 : requestedSize;
        const topology = isR3LikeTopology(mode)
            ? mode
            : mode === 'sphere'
                ? SPHERE_GO_TOPOLOGY
                : mode === CYLINDER_GO_TOPOLOGY ? CYLINDER_GO_TOPOLOGY
                : mode === 'klein' ? KLEIN_BOTTLE_TOPOLOGY
                    : mode === 'mobius' ? MOBIUS_GO_TOPOLOGY
                        : mode === 'rp2' ? RP2_GO_TOPOLOGY : 't2';
        return new GoGameLogic({
            size,
            width: size,
            height: spaceMode === 'klein' ? 19 : size,
            dimension: isR3LikeTopology(mode) ? 3 : 2,
            topology,
            lattice,
            komi: KOMI
        });
    }

    boardSize() {
        const source = this.sizeSelect.value === 'custom' ? this.customSizeInput?.value : this.sizeSelect.value;
        return this.normalizedBoardSize(source);
    }

    normalizedBoardSize(value) {
        const parsed = Math.floor(Number(value));
        if (!Number.isFinite(parsed)) return 19;
        return Math.min(39, Math.max(2, parsed));
    }

    setSizeSelection(value) {
        const size = this.normalizedBoardSize(value);
        const option = [...this.sizeSelect.options].find((item) => item.value === String(size));
        this.sizeSelect.value = option ? String(size) : 'custom';
        if (this.customSizeInput) this.customSizeInput.value = String(size);
        this.updateCustomSizeVisibility();
    }

    updateCustomSizeVisibility() {
        if (this.customSizeInput) this.customSizeInput.hidden = this.sizeSelect.value !== 'custom';
    }

    bindEvents() {
        this.modeSelect.addEventListener('change', () => {
            this.syncBoundaryVisibility();
            this.syncLatticeOptions(this.selectedTopologyMode());
            this.resetGame();
        });
        this.r3BoundarySelect?.addEventListener('change', () => {
            this.syncLatticeOptions(this.selectedTopologyMode());
            this.resetGame();
        });
        this.latticeSelect.addEventListener('change', () => this.resetGame());
        this.sphereViewSelect.addEventListener('change', () => {
            this.renderer.mode = '';
            this.renderer.renderStones(this.logic);
        });
        this.sizeSelect.addEventListener('change', () => {
            this.updateCustomSizeVisibility();
            this.resetGame();
        });
        this.customSizeInput?.addEventListener('change', () => {
            this.setSizeSelection(this.customSizeInput.value);
            this.resetGame();
        });
        this.timerSelect.addEventListener('change', () => this.resetGame());
        this.timeEvolutionSelect?.addEventListener('change', () => {
            this.syncPieceAges();
            this.updateUI();
        });
        this.timeLifetimeInput?.addEventListener('change', () => {
            this.syncPieceAges();
            this.updateUI();
        });
        this.noiseModeSelect?.addEventListener('change', () => {
            this.syncPieceAges();
            this.updateUI();
        });
        this.noisePeriodInput?.addEventListener('change', () => {
            this.syncPieceAges();
            this.updateUI();
        });
        this.gameModeSelect.addEventListener('change', () => this.updateOnlineControls());
        document.getElementById('cameraReset').addEventListener('click', () => {
            this.clearR3SliceFilters(false);
            this.renderer.resetCamera();
            this.updateUI();
        });
        for (const input of Object.values(this.sliceInputs || {})) {
            input?.addEventListener('input', () => this.refreshR3SliceFilter());
            input?.addEventListener('change', () => this.refreshR3SliceFilter());
        }
        this.focusOwnPiecesBtn?.addEventListener('click', () => this.togglePieceFocus());
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
        if (!isR3LikeTopology(this.logic?.topology)) return '';
        const { x, y, z } = this.r3SliceSettings();
        return ['slice', x ?? '*', y ?? '*', z ?? '*'].join(':');
    }

    coordVisibleInSlice(coord) {
        if (!isR3LikeTopology(this.logic?.topology)) return true;
        const { x, y, z } = this.r3SliceSettings();
        return (x === null || coord[0] === x)
            && (y === null || coord[1] === y)
            && (z === null || coord[2] === z);
    }

    clearR3SliceFilters(update = true) {
        for (const input of Object.values(this.sliceInputs || {})) {
            if (input) input.value = '';
        }
        this.renderer.sliceSignature = '';
        this.hoverCoord = null;
        if (update) this.updateUI();
    }

    refreshR3SliceFilter() {
        this.renderer.sliceSignature = '';
        this.hoverCoord = null;
        this.updateUI();
    }

    updateR3SliceFilterVisibility() {
        if (!this.sliceFilterEl) return;
        this.sliceFilterEl.hidden = !isR3LikeTopology(this.logic?.topology);
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

    syncPieceAges() {
        const next = createAgeArray(this.logic.board.length, this.pieceAges);
        for (let index = 0; index < this.logic.board.length; index += 1) {
            if (this.logic.board[index] === COLORS.empty) next[index] = 0;
        }
        this.pieceAges = next;
    }

    resetExternalPositionHistory() {
        const serialized = this.logic.serializeBoard(this.logic.board);
        this.logic.positionHistory = [serialized];
        this.logic.positionSet = new Set([serialized]);
        this.logic.passCount = 0;
        this.logic.scoringPending = false;
        this.logic.countAgreements = { black: false, white: false };
        this.logic.score = null;
    }

    randomBoardIndex(filter) {
        const indexes = [];
        for (let index = 0; index < this.logic.board.length; index += 1) {
            if (!this.logic.isPlayableIndex(index)) continue;
            if (!filter || filter(index)) indexes.push(index);
        }
        if (!indexes.length) return -1;
        return indexes[Math.floor(Math.random() * indexes.length)];
    }

    applyNoiseTick({ mode, period }) {
        if (mode === 'off') return '';
        this.noiseTick += 1;
        const dueByTurn = this.noiseTick % period === 0;
        const dueByPiece = (index) => this.logic.board[index] !== COLORS.empty
            && this.pieceAges[index] > 0
            && this.pieceAges[index] % period === 0;

        if (mode === 'pieces') {
            const index = this.randomBoardIndex(dueByPiece);
            if (index < 0) return '';
            this.logic.board[index] = COLORS.empty;
            this.logic.pauliLabels[index] = 'I';
            this.pieceAges[index] = 0;
            return 'noise removed one aged stone';
        }

        if (!dueByTurn) return '';
        const index = this.randomBoardIndex();
        if (index < 0) return '';
        if (this.logic.board[index] === COLORS.empty) {
            this.logic.board[index] = Math.random() < 0.5 ? COLORS.black : COLORS.white;
            this.pieceAges[index] = 0;
            return 'whole-board noise seeded one stone';
        }
        this.logic.board[index] = COLORS.empty;
        this.logic.pauliLabels[index] = 'I';
        this.pieceAges[index] = 0;
        return 'whole-board noise removed one stone';
    }

    advanceEvolution(protectedIndexes = []) {
        this.syncPieceAges();
        const time = this.pieceTimeConfig();
        const before = this.logic.serializeBoard(this.logic.board);
        const messages = [];
        const timeResult = advanceIndexedPieceAges({
            board: this.logic.board,
            labels: this.logic.pauliLabels,
            ages: this.pieceAges,
            config: time,
            emptyValue: COLORS.empty,
            protectedIndexes
        });
        if (time.decay && timeResult.expired.length) {
            messages.push(`${timeResult.expired.length} aged ${timeResult.expired.length === 1 ? 'stone vanished' : 'stones vanished'}`);
        }
        const noiseMessage = this.applyNoiseTick(this.noiseConfig());
        if (noiseMessage) messages.push(noiseMessage);

        if (this.logic.serializeBoard(this.logic.board) !== before) {
            this.resetExternalPositionHistory();
            this.logic.moveHistory.unshift({
                type: 'evolution',
                number: this.logic.moveNumber,
                message: messages.join('; ') || 'External evolution changed the board'
            });
        }
        return messages.join('; ');
    }

    playAt(coord) {
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(tr('status.waitingForColor', { color: this.colorName(this.logic.currentPlayer) }));
            return;
        }
        const placedIndex = this.logic.indexFromCoord(coord);
        const result = this.logic.tryPlay(coord, this.logic.currentPlayer, {
            virtualEmptyIndexes: this.isSpaceTimeIndexVisible?.(placedIndex, coord) === false ? [placedIndex] : []
        });
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        const evolution = this.advanceEvolution([placedIndex]);
        const base = tr('status.toPlay', { color: this.colorName(this.logic.currentPlayer) });
        this.afterLocalAction(evolution ? `${base}. ${evolution}.` : base);
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
        const evolution = this.advanceEvolution();
        const base = this.logic.scoringPending ? tr('status.twoPasses') : tr('status.toPlay', { color: this.colorName(this.logic.currentPlayer) });
        this.afterLocalAction(evolution ? `${base}. ${evolution}.` : base);
    }

    autoFinalizeLocalCount() {
        if (!this.logic.scoringPending || this.logic.gameOver || this.gameModeSelect.value === 'online') return '';
        this.logic.agreeToCount('black');
        this.logic.agreeToCount('white');
        if (this.logic.gameOver) {
            this.stopTimer();
            return this.resultText();
        }
        return '';
    }

    pendingScoreText() {
        if (!this.logic.scoringPending || this.logic.gameOver) return '';
        const score = this.logic.computeAreaScore();
        const margin = Math.abs(score.black - score.white);
        if (margin === 0) return tr('score.pendingDraw');
        const leader = score.black > score.white ? 'black' : 'white';
        return tr('score.pendingLead', { color: this.colorName(leader), margin });
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
        const finalMessage = this.autoFinalizeLocalCount() || message;
        this.setStatus(finalMessage);
        this.broadcastState();
        this.updateUI();
    }

    resetGame({ broadcast = false } = {}) {
        if (!broadcast && !this.canChangeSettings()) return;
        this.logic = this.createLogic();
        this.gameStarted = false;
        this.settingsLocked = this.network?.isConnected || false;
        this.timeLimit = Number(this.timerSelect.value) || 0;
        this.timeRemaining = { black: this.timeLimit, white: this.timeLimit };
        this.pieceAges = createAgeArray(this.logic.board.length);
        this.noiseTick = 0;
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
                this.updateUI();
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

    hasActiveGame() {
        return this.gameStarted && !this.logic.gameOver;
    }

    canChangeSettings() {
        if (this.logic.gameOver) return true;
        return !this.hasActiveGame() && !this.network.isConnected;
    }

    lockSettings() {
        this.settingsLocked = true;
        this.modeSelect.disabled = true;
        if (this.r3BoundarySelect) this.r3BoundarySelect.disabled = true;
        this.latticeSelect.disabled = true;
        this.sizeSelect.disabled = true;
        if (this.customSizeInput) this.customSizeInput.disabled = true;
        this.timerSelect.disabled = true;
        if (this.timeEvolutionSelect) this.timeEvolutionSelect.disabled = true;
        if (this.timeLifetimeInput) this.timeLifetimeInput.disabled = true;
        if (this.noiseModeSelect) this.noiseModeSelect.disabled = true;
        if (this.noisePeriodInput) this.noisePeriodInput.disabled = true;
    }

    unlockSettingsIfLocal() {
        if (!this.canChangeSettings()) return;
        this.settingsLocked = false;
        this.modeSelect.disabled = false;
        if (this.r3BoundarySelect) this.r3BoundarySelect.disabled = false;
        this.latticeSelect.disabled = false;
        this.sizeSelect.disabled = false;
        if (this.customSizeInput) this.customSizeInput.disabled = false;
        this.timerSelect.disabled = false;
        if (this.timeEvolutionSelect) this.timeEvolutionSelect.disabled = false;
        if (this.timeLifetimeInput) this.timeLifetimeInput.disabled = false;
        if (this.noiseModeSelect) this.noiseModeSelect.disabled = false;
        if (this.noisePeriodInput) this.noisePeriodInput.disabled = false;
    }

    updateSettingsLockState() {
        const locked = !this.canChangeSettings();
        this.settingsLocked = locked;
        this.modeSelect.disabled = locked;
        if (this.r3BoundarySelect) this.r3BoundarySelect.disabled = locked;
        this.latticeSelect.disabled = locked;
        this.sizeSelect.disabled = locked;
        if (this.customSizeInput) this.customSizeInput.disabled = locked;
        this.timerSelect.disabled = locked;
        if (this.timeEvolutionSelect) this.timeEvolutionSelect.disabled = locked;
        if (this.timeLifetimeInput) this.timeLifetimeInput.disabled = locked;
        if (this.noiseModeSelect) this.noiseModeSelect.disabled = locked;
        if (this.noisePeriodInput) this.noisePeriodInput.disabled = locked;
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
        this.updateSettingsLockState();
        this.syncBoundaryVisibility();
        this.updateR3SliceFilterVisibility();
        const isR3Like = isR3LikeTopology(this.logic.topology);
        const isSphere = this.logic.topology === SPHERE_GO_TOPOLOGY;
        const isCylinder = this.logic.topology === CYLINDER_GO_TOPOLOGY;
        const isKlein = this.logic.topology === KLEIN_BOTTLE_TOPOLOGY;
        const isMobius = this.logic.topology === MOBIUS_GO_TOPOLOGY;
        const isRP2 = this.logic.topology === RP2_GO_TOPOLOGY;
        const boundaryKey = isR3Like ? r3BoundaryKey(this.logic.topology) : '';
        const modeKey = isR3Like
            ? 'r3'
            : isSphere ? 'sphere' : isCylinder ? 'cylinder' : isKlein ? 'klein' : isMobius ? 'mobius' : isRP2 ? 'rp2' : 't2';
        const boundaryInfoKey = isR3Like
            ? (this.logic.topology === T3_PBC_TOPOLOGY ? 't3' : this.logic.topology === R3_RANDOM_TOPOLOGY ? 'r3Random' : this.logic.topology === R3_RP3_TOPOLOGY ? 'rp3' : 'r3')
            : modeKey;
        const visualLattice = isSphere ? this.currentLattice() : this.logic.lattice;
        const boundaryLabel = isR3Like ? ` - ${tr(`boundary.${boundaryKey}`)}` : '';
        this.modeDisplay.textContent = `${tr(`mode.${modeKey}Display`, {
            size: this.logic.size,
            width: this.logic.width,
            height: this.logic.height
        })} · ${this.latticeName()}`;
        if (boundaryLabel) {
            this.modeDisplay.textContent = `${tr(`mode.${modeKey}Display`, {
                size: this.logic.size,
                width: this.logic.width,
                height: this.logic.height
            })}${boundaryLabel} - ${this.latticeName()}`;
        }
        this.modeInfo.textContent = tr(`mode.${boundaryInfoKey}Info`) + this.latticeInfo(visualLattice);
        this.sphereViewGroup.hidden = !isSphere;
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : this.logic.scoringPending ? this.pendingScoreText() : tr('status.toPlay', { color: this.colorName(this.logic.currentPlayer) });
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
        this.syncPieceFocus();
        if (!this.network?.isConnected && this.gameModeSelect.value !== 'online') {
            this.onlineColorEl.textContent = tr('online.localStatus');
        }
    }

    focusColor() {
        return this.gameModeSelect.value === 'online' && this.myColor ? this.myColor : this.logic.currentPlayer;
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
            if (move.type === 'evolution') return `<div class="move-history-item">${this.escapeHTML(move.message || 'External evolution changed the board')}</div>`;
            if (move.type === 'surrender') return `<div class="move-history-item">${this.capitalize(move.color)} surrendered</div>`;
            if (move.type === 'score') return `<div class="move-history-item">${tr('status.finalCount')} ${this.resultText()}</div>`;
            return '';
        }).join('');
    }

    scoreChip(label, value, kind) {
        return `<span class="go-score-chip ${kind}"><span class="go-score-swatch"></span><span>${label}</span><strong>${value ?? 0}</strong></span>`;
    }

    scoreBreakdownHtml(score, result) {
        const blackName = this.colorName('black');
        const whiteName = this.colorName('white');
        return `
            <div class="go-score-total">
                <strong>${blackName} ${score.black}</strong>
                <strong>${whiteName} ${score.white}</strong>
            </div>
            <div class="go-score-breakdown">
                ${this.scoreChip(`${blackName} ${tr('score.stones')}`, score.blackStones, 'black')}
                ${this.scoreChip(`${blackName} ${tr('score.territory')}`, score.blackTerritory, 'black-territory')}
                ${this.scoreChip(`${whiteName} ${tr('score.stones')}`, score.whiteStones, 'white')}
                ${this.scoreChip(`${whiteName} ${tr('score.territory')}`, score.whiteTerritory, 'white-territory')}
                ${this.scoreChip(tr('score.komiLabel'), score.komi, 'komi')}
                ${this.scoreChip(tr('score.neutralDame'), score.neutral, 'neutral')}
                ${this.scoreChip(tr('score.deadBlackRemoved'), score.deadBlack, 'dead-black')}
                ${this.scoreChip(tr('score.deadWhiteRemoved'), score.deadWhite, 'dead-white')}
            </div>
            <p class="go-score-note">${tr('score.mixedNeutral')}</p>
            <p class="go-score-result">${result}</p>
        `;
    }

    renderScore() {
        const score = this.logic.score || (this.logic.scoringPending ? this.logic.computeAreaScore() : null);
        if (!score) {
            this.scorePanel.hidden = true;
            this.scoreResult.textContent = '';
            return;
        }
        this.scorePanel.hidden = false;
        const result = this.logic.gameOver ? this.resultText() : this.pendingScoreText();
        this.scoreResult.innerHTML = this.scoreBreakdownHtml(score, result);
    }

    resultText() {
        if (!this.logic.gameOver) return '';
        if (this.logic.winner === 'draw') return this.logic.score ? `${tr('score.draw')} (${this.colorName('black')} ${this.logic.score.black}, ${this.colorName('white')} ${this.logic.score.white})` : tr('score.draw');
        if (this.logic.score) {
            const result = tr('score.winsBy', { color: this.colorName(this.logic.winner), margin: this.logic.score.margin });
            return `${result} (${this.colorName('black')} ${this.logic.score.black}, ${this.colorName('white')} ${this.logic.score.white})`;
        }
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
        this.network.sendChat({ text });
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
        const spaceMode = this.selectedSpaceMode();
        const mode = this.selectedTopologyMode();
        return {
            variant: spaceMode === 't2' ? 't2go' : spaceMode === 'sphere' ? 's2go' : spaceMode === 'klein' ? 'kleingo' : spaceMode === 'mobius' ? 'mobiusgo' : spaceMode === 'rp2' ? 'rp2go' : mode === T3_PBC_TOPOLOGY ? 't3go' : mode === R3_RANDOM_TOPOLOGY ? 'r3rbcgo' : mode === R3_RP3_TOPOLOGY ? 'rp3go' : 'r3go',
            mode: spaceMode,
            boundary: isR3LikeTopology(mode) ? mode : '',
            lattice: this.latticeSelect.value,
            size: this.boardSize(),
            timer: Number(this.timerSelect.value) || 0,
            timeEvolution: this.timeEvolutionSelect?.value || 'off',
            timeLifetime: Math.max(1, Math.min(512, Math.floor(Number(this.timeLifetimeInput?.value) || 12))),
            noiseMode: this.noiseModeSelect?.value || 'off',
            noisePeriod: Math.max(1, Math.min(512, Math.floor(Number(this.noisePeriodInput?.value) || 6)))
        };
    }

    onlineGameKey() {
        return '3dgo';
    }

    onlineMatchKey() {
        const settings = this.getNetworkSettings();
        return [settings.variant, settings.mode, settings.lattice, settings.size, settings.timer].join(':');
    }

    exportNetworkState() {
        return {
            logic: this.logic.exportState(),
            gameStarted: this.gameStarted,
            timeLimit: this.timeLimit,
            timeRemaining: { ...this.timeRemaining },
            timerValue: Number(this.timerSelect.value) || 0,
            modeValue: this.modeSelect.value,
            r3BoundaryValue: this.r3BoundarySelect?.value || R3_STANDARD_TOPOLOGY,
            pieceAges: Array.from(this.pieceAges || []),
            noiseTick: this.noiseTick,
            timeEvolution: this.timeEvolutionSelect?.value || 'off',
            timeLifetime: Math.max(1, Math.min(512, Math.floor(Number(this.timeLifetimeInput?.value) || 12))),
            noiseMode: this.noiseModeSelect?.value || 'off',
            noisePeriod: Math.max(1, Math.min(512, Math.floor(Number(this.noisePeriodInput?.value) || 6)))
        };
    }

    importNetworkState(state) {
        if (!state?.logic) return;
        this.stopTimer();
        this.logic.importState(state.logic);
        this.modeSelect.value = this.logic.topology === 't2'
            ? 't2'
            : this.logic.topology === CYLINDER_GO_TOPOLOGY
                ? CYLINDER_GO_TOPOLOGY
            : this.logic.topology === SPHERE_GO_TOPOLOGY
                ? 'sphere'
                : this.logic.topology === KLEIN_BOTTLE_TOPOLOGY
                    ? 'klein'
                    : this.logic.topology === MOBIUS_GO_TOPOLOGY
                        ? 'mobius'
                        : this.logic.topology === RP2_GO_TOPOLOGY
                            ? 'rp2'
                            : R3_STANDARD_TOPOLOGY;
        if (this.r3BoundarySelect) {
            this.r3BoundarySelect.value = isR3LikeTopology(this.logic.topology)
                ? this.logic.topology
                : R3_STANDARD_TOPOLOGY;
        }
        this.syncBoundaryVisibility();
        this.syncLatticeOptions(this.selectedTopologyMode());
        this.latticeSelect.value = this.logic.lattice;
        this.setSizeSelection(this.logic.size);
        this.timerSelect.value = String(state.timerValue ?? state.timeLimit ?? 0);
        if (this.timeEvolutionSelect) this.timeEvolutionSelect.value = state.timeEvolution || 'off';
        if (this.timeLifetimeInput) this.timeLifetimeInput.value = String(state.timeLifetime || 12);
        if (this.noiseModeSelect) this.noiseModeSelect.value = state.noiseMode || 'off';
        if (this.noisePeriodInput) this.noisePeriodInput.value = String(state.noisePeriod || 6);
        this.timeLimit = Number(state.timeLimit) || 0;
        this.timeRemaining = {
            black: Number(state.timeRemaining?.black) || this.timeLimit,
            white: Number(state.timeRemaining?.white) || this.timeLimit
        };
        this.pieceAges = createAgeArray(this.logic.board.length, state.pieceAges);
        this.noiseTick = Number(state.noiseTick) || 0;
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

    currentLattice() {
        const mode = normalizeGoMode(this.modeSelect?.value || R3_STANDARD_TOPOLOGY);
        if (mode === 'sphere') {
            return this.latticeSelect?.value === BUCKYBALL_LATTICE ? BUCKYBALL_LATTICE : SPHERE_COORDINATE_LATTICE;
        }
        return this.logic?.lattice || this.latticeSelect?.value || SQUARE_LATTICE;
    }

    sphereGridMode() {
        return this.currentLattice();
    }
}

window.go3dApp = new Go3DApp();
installGo3DRobot(window.go3dApp);
