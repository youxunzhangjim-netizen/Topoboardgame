import HexGame, { HEX_COLORS, otherHexColor } from '../../../js/hex/HexGame.js';
import { createHexOnlineController } from '../../../js/hex/HexOnline.js';
import { analyzeHexRobotPosition, chooseHexRobotMove } from '../../../js/hex/HexRobot.js';
import {
    createBuckyballSphereFacePolygons,
    createBuckyballSphereGridLines
} from '../../../js/geometry/SphereBoardGeometry.js';
import { honeycombBounds, honeycombCells } from '../../../js/shared/HoneycombLattice.js';

const LANGUAGE_KEY = 'topological-boardgame:language';
const params = new URLSearchParams(window.location.search);
const TWO_PI = Math.PI * 2;
const isSpaceTime = params.get('spacetime') === '3p1';
const SPHERE_GEODESIC_LATTICE = 'sphere_coordinate';
const BUCKYBALL_LATTICE = 'buckyball';
const BUCKYBALL_RENDER_RADIUS = 4.12;

const I18N = {
    en: {
        eyebrow: 'Volumetric connection strategy',
        title: isSpaceTime ? '3+1D Hex' : '3D Hex',
        description: isSpaceTime
            ? 'Build a connection through the spatial volume while preserving the selected time-schedule parameters.'
            : 'Fill volume sites or embedded-surface cells and connect the active target zones.',
        boardAria: 'Rotatable 3D Hex board',
        controls: 'Game Controls',
        home: 'Home',
        switchLanguage: 'Switch language',
        black: 'Blue',
        white: 'Orange',
        moves: 'Moves',
        gameMode: 'Game Mode',
        local: 'Local',
        online: 'Online',
        robot: 'Robot',
        robotPanelTitle: 'Robot & Analysis',
        robotHelp: 'Select Robot from Game Mode for automatic robot play, or analyze the current position while playing locally.',
        robotSide: 'Robot Side',
        robotStrength: 'Strength',
        robotLevel1: 'L1 Quick',
        robotLevel2: 'L2 Tactical',
        robotLevel3: 'L3 Search',
        robotLevel4: 'L4 Deep',
        robotMove: 'Robot Move',
        robotAnalyze: 'Analyze Position',
        robotAnalysisIdle: 'Click Analyze Position to rank Hex connection moves.',
        robotNoMove: 'Robot found no legal move.',
        robotMoved: 'Robot played {coord}. Score {score}. Nodes {nodes}.',
        robotScheduled: 'Robot scheduled {coord}. Score {score}. Nodes {nodes}.',
        robotModeHint: 'Robot side is used for automatic play. Robot Move plays the current side once.',
        robotTopMoves: 'Top Moves',
        robotScore: 'Score',
        robotNodes: 'Nodes',
        robotLimited: 'limited',
        robotCurrent: '{player} to move. Score {score}. Win estimate {winRate}%. Nodes {nodes}.',
        robotReason: {
            win: 'winning connection',
            block: 'blocks opponent connection',
            heuristic: 'fast heuristic',
            search: 'searched line',
            'search-timeout': 'time-limited search'
        },
        disconnected: 'Disconnected',
        findMatch: 'Find Match',
        privateRoom: 'PRIVATE ROOM',
        createRoom: 'Create Room',
        or: 'OR',
        roomPlaceholder: 'Room code',
        joinRoom: 'Join Room',
        boardSize: 'Board Size',
        topology: 'Topology',
        cube: 'R3 Volume',
        boundaryCondition: 'Boundary Condition',
        standardBoundary: 'Standard',
        t3Boundary: 'T3 all-side periodic',
        r3RandomBoundary: '3D random boundary',
        t2: 'T2 Torus',
        cylinder: 'Cylinder',
        sphere: 'S2 Sphere',
        klein: 'Klein Bottle',
        mobius: 'Mobius Strip',
        rp2: 'RP2',
        lattice: 'Lattice',
        axisLattice: 'Simple cubic',
        bccLattice: 'BCC',
        fccLattice: 'FCC',
        hcpLattice: 'HCP',
        geodesicLattice: 'Geodesic',
        buckyballLattice: 'Buckyball',
        trefoilTube: 'Trefoil Tube',
        kleinQuartic: 'Klein Quartic x I',
        boardView: 'Board View',
        rotateX: 'Rotate X',
        rotateY: 'Rotate Y',
        rotateZ: 'Rotate Z',
        zoom: 'Zoom',
        coordinateFilter: 'Coordinate Filter',
        allX: 'x = all',
        allY: 'y = all',
        allZ: 'z = all',
        resetCamera: 'Reset Camera',
        newGame: 'New Game',
        targetZones: 'Target Zones',
        blackTarget: 'Blue connects x-low to x-high',
        whiteTarget: 'Orange connects y-low to y-high',
        blackMarkedTarget: 'Blue connects the two cyan marked zones',
        whiteMarkedTarget: 'Orange connects the two gold marked zones',
        moveHistory: 'Move History',
        onlineChat: 'Online Chat',
        chatEmpty: 'Connect online to chat.',
        messagePlaceholder: 'Message opponent',
        send: 'Send',
        blackTurn: 'Blue to play',
        whiteTurn: 'Orange to play',
        emptyPrompt: 'Choose an empty 3D site.',
        occupied: 'Choose an empty Hex site.',
        opponentCamp: 'You may enter the opponent camp, but cannot seal every cell of it.',
        noStones: 'No stones placed',
        stoneSummary: '{count} stones on the board',
        historyEmpty: 'No moves yet',
        blackWin: 'Blue connected x-low to x-high.',
        whiteWin: 'Orange connected y-low to y-high.',
        robotThinking: 'Robot is searching for a connection move.',
        connectOnline: 'Connect or join an Online room before placing.',
        waitingFor: 'Waiting for {color}.',
        onlineAs: 'Online as {color}',
        waitingOpponent: 'Waiting for opponent',
        syncedOnline: 'Online board synchronized.',
        you: 'You',
        opponent: 'Opponent',
        onlineUnavailable: 'Connect or join an Online room before placing.',
        topologyInfo: {
            open: 'R3 volume uses open boundaries and the selected 3D lattice adjacency. Volume Hex connects through site vertices.',
            torus: 'T3 is the all-side periodic boundary condition on the R3 volume board. Goals use explicit marked cut-zone planes inside the periodic volume.',
            r3_random: '3D RBC uses a seeded random boundary pairing when a move exits the cube.',
            t2: 'T2 is a torus surface embedded in 3D. Surface Hex fills face cells and both players connect marked cut-seam zones.',
            cylinder: 'Cylinder is a 2D surface embedded in 3D. Surface Hex fills face cells; Blue uses cut-seam zones and Orange uses the two rim directions.',
            sphere: 'S2 Sphere Hex can use a Geodesic longitude-latitude face board or a Buckyball pentagon/hexagon face board. Hex fills face cells on both sphere lattices.',
            klein: 'Klein bottle is a non-orientable surface with a twisted seam. Surface Hex fills face cells and goals use marked zones.',
            mobius: 'Mobius strip is a one-sided twisted strip. Surface Hex fills face cells; Blue uses the seam zones and Orange uses the open sides.',
            rp2: 'RP2 uses antipodal edge identification and is shown as a marked fundamental polygon surface.',
            trefoil_tube: 'A two-dimensional periodic tube surface around a trefoil centerline. Blue and Orange use equal-width winding arc camps placed at separated trefoil positions.',
            klein_quartic: 'Klein Quartic x I is a genus-3 cell-complex board extruded through one interval layer for 3D play.'
        }
    },
    zh: {
        eyebrow: '體積連線策略',
        title: isSpaceTime ? '3+1D 六貫棋' : '3D 六貫棋',
        description: isSpaceTime
            ? '在空間體積中建立連線，並保留所選的時間排程參數。'
            : '填入體積格點或嵌入曲面單元，連接目前棋盤的目標區。',
        boardAria: '可旋轉的 3D 六貫棋棋盤',
        controls: '遊戲控制',
        home: '首頁',
        switchLanguage: '切換語言',
        black: '藍方',
        white: '橙方',
        moves: '步數',
        gameMode: '遊戲模式',
        local: '本機',
        online: '線上',
        robot: '機器人',
        robotPanelTitle: '機器人與分析',
        robotHelp: '在遊戲模式選擇機器人可自動對弈；本機遊玩時也可分析目前局面。',
        robotSide: '機器人陣營',
        robotStrength: '強度',
        robotLevel1: 'L1 快速',
        robotLevel2: 'L2 戰術',
        robotLevel3: 'L3 搜尋',
        robotLevel4: 'L4 深搜',
        robotMove: '機器人走子',
        robotAnalyze: '分析局面',
        robotAnalysisIdle: '按下「分析局面」可排序六貫棋連線走法。',
        robotNoMove: '機器人找不到合法走法。',
        robotMoved: '機器人走在 {coord}。分數 {score}，節點 {nodes}。',
        robotScheduled: '機器人已排程 {coord}。分數 {score}，節點 {nodes}。',
        robotModeHint: '機器人陣營用於自動對弈；「機器人走子」會讓目前輪到的一方走一步。',
        robotTopMoves: '推薦走法',
        robotScore: '分數',
        robotNodes: '節點',
        robotLimited: '已限時',
        robotCurrent: '輪到 {player}。分數 {score}，勝率估計 {winRate}%，節點 {nodes}。',
        robotReason: {
            win: '完成連線',
            block: '阻擋對手連線',
            heuristic: '快速估值',
            search: '搜尋變化',
            'search-timeout': '限時搜尋'
        },
        disconnected: '未連線',
        findMatch: '尋找對手',
        privateRoom: '私人房間',
        createRoom: '建立房間',
        or: '或',
        roomPlaceholder: '房間代碼',
        joinRoom: '加入房間',
        boardSize: '棋盤大小',
        topology: '拓撲',
        cube: 'R3 體積',
        boundaryCondition: '邊界條件',
        standardBoundary: '標準',
        t3Boundary: 'T3 全面週期',
        r3RandomBoundary: '3D 隨機邊界',
        t2: 'T2 環面曲面',
        cylinder: '圓柱曲面',
        sphere: 'S2 球面曲面',
        klein: 'Klein 瓶曲面',
        mobius: 'Mobius 帶曲面',
        rp2: 'RP2 曲面',
        lattice: '晶格',
        axisLattice: '簡單立方',
        bccLattice: 'BCC',
        fccLattice: 'FCC',
        hcpLattice: 'HCP',
        geodesicLattice: '測地格',
        buckyballLattice: '巴克球',
        trefoilTube: '三葉結管面',
        kleinQuartic: 'Klein quartic x I',
        boardView: '棋盤視角',
        rotateX: '繞 X 軸旋轉',
        rotateY: '繞 Y 軸旋轉',
        rotateZ: '繞 Z 軸旋轉',
        zoom: '縮放',
        coordinateFilter: '座標篩選',
        allX: '顯示全部 x',
        allY: '顯示全部 y',
        allZ: '顯示全部 z',
        resetCamera: '重設視角',
        newGame: '新遊戲',
        targetZones: '目標區',
        blackTarget: '藍方連接 x-low 與 x-high',
        whiteTarget: '橙方連接 y-low 與 y-high',
        blackMarkedTarget: '藍方連接兩個青色標示區',
        whiteMarkedTarget: '橙方連接兩個金色標示區',
        moveHistory: '落子記錄',
        onlineChat: '線上聊天',
        chatEmpty: '連上線上房間後即可聊天。',
        messagePlaceholder: '傳送訊息給對手',
        send: '傳送',
        blackTurn: '輪到藍方',
        whiteTurn: '輪到橙方',
        emptyPrompt: '請選擇一個空的 3D 格點。',
        occupied: '請選擇一個空的六貫棋格點。',
        opponentCamp: '可以進入對手目標區，但不能封住整個目標區。',
        noStones: '尚未落子',
        stoneSummary: '棋盤上共有 {count} 顆棋子',
        historyEmpty: '尚無落子記錄',
        blackWin: '藍方已連接 x-low 與 x-high。',
        whiteWin: '橙方已連接 y-low 與 y-high。',
        robotThinking: '機器人正在搜尋連線走法。',
        connectOnline: '請先連線或加入線上房間再落子。',
        waitingFor: '等待 {color} 行動。',
        onlineAs: '線上身份：{color}',
        waitingOpponent: '等待對手',
        syncedOnline: '線上棋盤已同步。',
        you: '你',
        opponent: '對手',
        onlineUnavailable: '請先連線或加入線上房間再落子。',
        topologyInfo: {
            open: 'R3 體積使用開放邊界，並依所選 3D 晶格產生相鄰關係。體積六貫棋沿格點連線。',
            torus: 'T3 是 R3 體積棋盤的全面週期邊界條件；目標使用週期體積中的明確切面標示區。',
            r3_random: '3D RBC 會在行動離開立方體邊界時使用固定種子的隨機邊界配對。',
            t2: 'T2 是嵌入 3D 視圖的環面曲面；曲面六貫棋填入面單元，雙方連接曲面上的切縫目標區。',
            cylinder: '圓柱是嵌入 3D 視圖的二維曲面；曲面六貫棋填入面單元，藍方使用切縫目標區，橙方使用兩側邊界。',
            sphere: 'S2 球面六貫棋可使用測地經緯面格，或巴克球五邊形 / 六邊形面格；兩者都以填滿面單元來落子。',
            klein: 'Klein 瓶是含扭轉縫的非定向曲面；曲面六貫棋填入面單元，目標使用曲面標示區。',
            mobius: 'Mobius 帶是一側曲面；曲面六貫棋填入面單元，藍方使用接縫目標區，橙方使用開放邊。',
            rp2: 'RP2 使用對跖邊界識別，並以標示基本多邊形曲面顯示。',
            trefoil_tube: '嵌入可旋轉 3D 視圖中的二維週期三葉結管面；藍方與橙方使用寬度相同的繞行弧形營區，並放在分離的三葉結位置。',
            klein_quartic: 'Klein quartic x I 是將 genus-3 胞複形棋盤沿一個區間層擴展後的 3D 棋盤。'
        }
    }
};

Object.assign(I18N.en, {
    t2: 'T2 Torus',
    cylinder: 'Cylinder',
    sphere: 'S2 Sphere',
    klein: 'Klein Bottle',
    mobius: 'Mobius Strip',
    rp2: 'RP2',
    squareLattice: 'Square',
    honeycombLattice: 'Honeycomb',
    triangularLattice: 'Triangular'
});

Object.assign(I18N.zh, {
    t2: 'T2 環面',
    cylinder: '圓柱',
    sphere: 'S2 球面',
    klein: 'Klein 瓶',
    mobius: 'Mobius 帶',
    rp2: 'RP2',
    squareLattice: '方格',
    honeycombLattice: '蜂巢',
    triangularLattice: '三角'
});

const elements = {
    canvas: document.getElementById('hexBoard'),
    turn: document.getElementById('playerTurn'),
    black: document.getElementById('blackScore'),
    white: document.getElementById('whiteScore'),
    moves: document.getElementById('moveCount'),
    topologyMode: document.getElementById('topologyMode'),
    status: document.getElementById('gameStatus'),
    summary: document.getElementById('moveSummary'),
    mode: document.getElementById('gameModeSelect'),
    robotSide: document.getElementById('robotSideSelect'),
    robotDepth: document.getElementById('robotDepthSelect'),
    robotMove: document.getElementById('robotMoveBtn'),
    robotAnalyze: document.getElementById('robotAnalyzeBtn'),
    robotAnalysis: document.getElementById('robotAnalysisOutput'),
    onlineControls: document.getElementById('onlineControls'),
    connectionStatus: document.getElementById('connectionStatus'),
    findMatch: document.getElementById('findMatchBtn'),
    createRoom: document.getElementById('createRoomBtn'),
    joinRoom: document.getElementById('joinRoomBtn'),
    roomId: document.getElementById('roomIdInput'),
    size: document.getElementById('boardSizeSelect'),
    topology: document.getElementById('topologySelect'),
    boundaryGroup: document.getElementById('boundaryControlGroup'),
    boundary: document.getElementById('boundarySelect'),
    latticeGroup: document.getElementById('latticeControlGroup'),
    lattice: document.getElementById('latticeSelect'),
    topologyInfo: document.getElementById('topologyInfo'),
    blackTargetText: document.getElementById('blackTargetText'),
    whiteTargetText: document.getElementById('whiteTargetText'),
    rotateX: document.getElementById('rotateX'),
    rotateY: document.getElementById('rotateY'),
    rotateZ: document.getElementById('rotateZ'),
    zoom: document.getElementById('zoom'),
    filterX: document.getElementById('filterX'),
    filterY: document.getElementById('filterY'),
    filterZ: document.getElementById('filterZ'),
    resetCamera: document.getElementById('resetCameraBtn'),
    newGame: document.getElementById('newGameBtn'),
    history: document.getElementById('moveHistoryList'),
    language: document.getElementById('languageButton'),
    home: document.getElementById('homeLink'),
    onlineMessage: document.getElementById('onlineMessage'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    chatSend: document.getElementById('chatSendBtn')
};
const latticeOptionTemplates = Array.from(elements.lattice.options).map((option) => option.cloneNode(true));

const context = elements.canvas.getContext('2d');
let language = normalizeLanguage(params.get('lang') || localStorage.getItem(LANGUAGE_KEY));
let game;
let size = 4;
let axisSizes = [4, 4, 4];
let projectedSites = [];
let projectedSurfaceCells = [];
let statusKey = 'emptyPrompt';
let robotTimer = null;
let onlineController = null;
let dragging = false;
let dragMoved = false;
let lastPointer = null;
const activePointers = new Map();
let pinchStartDistance = 0;
let pinchStartZoom = 1;
let renderDpr = 1;
let specialModelExtent = 1;

function normalizeLanguage(value) {
    return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function text(key, values = {}) {
    const value = key.split('.').reduce((node, part) => node?.[part], I18N[language])
        ?? key.split('.').reduce((node, part) => node?.[part], I18N.en)
        ?? key;
    return String(value).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function applyLanguage() {
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
    document.title = text('title');
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        node.textContent = text(node.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
        node.placeholder = text(node.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
        node.setAttribute('aria-label', text(node.dataset.i18nAria));
    });
    elements.language.setAttribute('aria-label', text('switchLanguage'));
    elements.language.title = text('switchLanguage');
    elements.home.href = `../../index.html?lang=${language}`;
    onlineController?.refreshLabels();
    elements.topologyInfo.textContent = text(`topologyInfo.${selectedTopology()}`);
    if (game) elements.topologyMode.textContent = selectedTopologyLabel();
    updateTargetText();
    updateReadout();
    renderHistory();
}

function syncRobotControls() {
    if (elements.robotMove) elements.robotMove.disabled = !game || game.winner || elements.mode.value === 'online';
    if (elements.robotAnalyze) elements.robotAnalyze.disabled = !game;
}

function robotSide() {
    return elements.robotSide?.value === HEX_COLORS.BLACK ? HEX_COLORS.BLACK : HEX_COLORS.WHITE;
}

function robotLevel() {
    return Math.max(1, Math.min(4, Math.floor(Number(elements.robotDepth?.value) || 3)));
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function coordLabel(coordinate) {
    return `(${coordinate.map((value) => Number(value) + 1).join(', ')})`;
}

function formatRobotScore(score) {
    if (!Number.isFinite(score)) return '0';
    if (Math.abs(score) >= 99900) return score > 0 ? '+win' : '-win';
    return (score / 100).toFixed(2);
}

function setRobotAnalysisMessage(message) {
    if (!elements.robotAnalysis) return;
    elements.robotAnalysis.innerHTML = `<p class="robot-muted">${escapeHtml(message)}</p>`;
}

function renderRobotAnalysis(analysis) {
    if (!elements.robotAnalysis || !analysis) return;
    const rows = analysis.topMoves.map((move, index) => `
        <li>
            <strong>${index + 1}. ${escapeHtml(coordLabel(move.coordinate))}</strong>
            <span class="robot-muted">${escapeHtml(formatRobotScore(move.score))} · ${(move.winRate * 100).toFixed(1)}% · ${escapeHtml(text(`robotReason.${move.reason}`))}</span>
        </li>
    `).join('');
    elements.robotAnalysis.innerHTML = `
        <div class="robot-summary-grid">
            <div><span class="robot-label">${escapeHtml(text('robotSide'))}</span><strong>${escapeHtml(text(analysis.player))}</strong></div>
            <div><span class="robot-label">${escapeHtml(text('robotStrength'))}</span><strong>L${analysis.level}</strong></div>
            <div><span class="robot-label">${escapeHtml(text('robotScore'))}</span><strong>${escapeHtml(formatRobotScore(analysis.currentScore))}</strong></div>
            <div><span class="robot-label">${escapeHtml(text('robotNodes'))}</span><strong>${analysis.nodes}</strong></div>
        </div>
        <p class="robot-muted">${escapeHtml(text('robotCurrent', {
            player: text(analysis.player),
            score: formatRobotScore(analysis.currentScore),
            winRate: (analysis.currentWinRate * 100).toFixed(1),
            nodes: analysis.nodes
        }))}${analysis.truncated ? ` · ${escapeHtml(text('robotLimited'))}` : ''}</p>
        <h4>${escapeHtml(text('robotTopMoves'))}</h4>
        <ol class="robot-move-list">${rows || `<li>${escapeHtml(text('robotNoMove'))}</li>`}</ol>
    `;
}

function analyzeRobotPosition() {
    const analysis = analyzeHexRobotPosition(game, { level: robotLevel(), limit: 6 });
    renderRobotAnalysis(analysis);
    return analysis;
}

function updateTargetText() {
    if (!game) return;
    const marked = game.topology.goalZones.black.type !== 'physical-sides' ||
        game.topology.goalZones.white.type !== 'physical-sides';
    elements.blackTargetText.textContent = text(marked ? 'blackMarkedTarget' : 'blackTarget');
    elements.whiteTargetText.textContent = text(marked ? 'whiteMarkedTarget' : 'whiteTarget');
}

function newGame() {
    window.hexApp?.__spaceTimeOnNewGame?.();
    clearTimeout(robotTimer);
    const requestedSize = Number(elements.size.value);
    const topology = selectedTopology();
    const lattice = selectedLatticeForTopology(topology);
    const topologySize = expandedBoardSize(topology, requestedSize, lattice);
    game = new HexGame({
        dimension: 3,
        size: topologySize,
        topology,
        lattice,
        goalZones: createBuckyballGoalZones(topology, topologySize, lattice) ||
            createTrefoilTubeGoalZones(topology, topologySize)
    });
    syncBoardDimensions();
    statusKey = 'emptyPrompt';
    elements.topologyMode.textContent = selectedTopologyLabel();
    elements.topologyInfo.textContent = text(`topologyInfo.${topology}`);
    updateTargetText();
    syncLatticeControl();
    for (const filter of [elements.filterX, elements.filterY, elements.filterZ]) {
        const axis = [elements.filterX, elements.filterY, elements.filterZ].indexOf(filter);
        filter.max = String(axisSizes[axis] || size);
        if (Number(filter.value) > (axisSizes[axis] || size)) filter.value = '';
        filter.disabled = game.topology.isSpecial === true || isSurfaceTopology();
    }
    updateReadout();
    renderHistory();
    drawBoard();
}

function surfaceSphereCoordinatesForSize(size) {
    const [width, height] = size;
    const coordinates = [];
    for (let y = 0; y < height; y += 1) {
        if (y === 0 || y === height - 1) {
            coordinates.push([0, y, 0]);
            continue;
        }
        for (let x = 0; x < width; x += 1) coordinates.push([x, y, 0]);
    }
    return coordinates;
}

function createBuckyballGoalZones(topology, topologySize, lattice) {
    if (topology !== 'sphere' || lattice !== BUCKYBALL_LATTICE) return null;
    const polygons = createBuckyballSphereFacePolygons({ radius: BUCKYBALL_RENDER_RADIUS, lift: 0.08 });
    const coordinates = surfaceSphereCoordinatesForSize(topologySize).slice(0, polygons.length);
    const vertexKey = (point) => `${point.x.toFixed(5)},${point.y.toFixed(5)},${point.z.toFixed(5)}`;
    const faceVertexSets = polygons.map((polygon) => new Set(polygon.map(vertexKey)));
    const sharedVertexCount = (aIndex, bIndex) => {
        let shared = 0;
        for (const key of faceVertexSets[aIndex] || []) {
            if (faceVertexSets[bIndex]?.has(key)) shared += 1;
            if (shared >= 2) break;
        }
        return shared;
    };
    const faceAdjacency = faceVertexSets.map(() => []);
    for (let a = 0; a < faceVertexSets.length; a += 1) {
        for (let b = a + 1; b < faceVertexSets.length; b += 1) {
            if (sharedVertexCount(a, b) < 2) continue;
            faceAdjacency[a].push(b);
            faceAdjacency[b].push(a);
        }
    }
    const faceGraphDistance = (from, to) => {
        if (from === to) return 0;
        const queue = [from];
        const distances = new Map([[from, 0]]);
        for (let index = 0; index < queue.length; index += 1) {
            const current = queue[index];
            const nextDistance = distances.get(current) + 1;
            for (const next of faceAdjacency[current] || []) {
                if (distances.has(next)) continue;
                if (next === to) return nextDistance;
                distances.set(next, nextDistance);
                queue.push(next);
            }
        }
        return 0;
    };
    const graphDistances = faceVertexSets.map((_, from) =>
        faceVertexSets.map((__, to) => faceGraphDistance(from, to)));
    const graphDistance = (a, b) => graphDistances[a.index]?.[b.index] || 0;
    const minGraphDistance = (selected) => {
        let best = Infinity;
        for (let a = 0; a < selected.length; a += 1) {
            for (let b = a + 1; b < selected.length; b += 1) {
                best = Math.min(best, graphDistance(selected[a], selected[b]));
            }
        }
        return Number.isFinite(best) ? best : 0;
    };
    const faceDistance = (a, b) => Math.hypot(
        a.center.x - b.center.x,
        a.center.y - b.center.y,
        a.center.z - b.center.z
    );
    const rotateDefault = (center) => {
        let { x, y, z } = center;
        const ax = -24 * Math.PI / 180;
        const ay = 34 * Math.PI / 180;
        [y, z] = [y * Math.cos(ax) - z * Math.sin(ax), y * Math.sin(ax) + z * Math.cos(ax)];
        [x, z] = [x * Math.cos(ay) + z * Math.sin(ay), -x * Math.sin(ay) + z * Math.cos(ay)];
        return { x, y, z };
    };
    const entries = polygons.map((polygon, index) => {
        const center = polygon.reduce((sum, point) => {
            sum.x += point.x;
            sum.y += point.y;
            sum.z += point.z;
            return sum;
        }, { x: 0, y: 0, z: 0 });
        center.x /= Math.max(1, polygon.length);
        center.y /= Math.max(1, polygon.length);
        center.z /= Math.max(1, polygon.length);
        return { coordinate: coordinates[index], center, view: rotateDefault(center), index };
    }).filter((entry) => Array.isArray(entry.coordinate));
    const keyOf = (coordinate) => coordinate.join(',');
    const pickSeparatedVisibleCaps = () => {
        const minAnyGraphDistance = 3;
        const minSameColorGraphDistance = 3;
        let best = null;

        const isSeparated = (selected) => {
            for (let a = 0; a < selected.length; a += 1) {
                for (let b = a + 1; b < selected.length; b += 1) {
                    if (graphDistance(selected[a], selected[b]) < minAnyGraphDistance) return false;
                }
            }
            return true;
        };

        for (const blackStart of entries) {
            for (const blackEnd of entries) {
                if (blackEnd === blackStart) continue;
                if (graphDistance(blackStart, blackEnd) < minSameColorGraphDistance) continue;
                for (const whiteStart of entries) {
                    if (whiteStart === blackStart || whiteStart === blackEnd) continue;
                    for (const whiteEnd of entries) {
                        const selected = [blackStart, blackEnd, whiteStart, whiteEnd];
                        if (new Set(selected).size !== selected.length) continue;
                        if (graphDistance(whiteStart, whiteEnd) < minSameColorGraphDistance) continue;
                        if (!isSeparated(selected)) continue;

                        const crossDistances = [
                            faceDistance(blackStart, whiteStart),
                            faceDistance(blackStart, whiteEnd),
                            faceDistance(blackEnd, whiteStart),
                            faceDistance(blackEnd, whiteEnd)
                        ];
                        const crossGraphDistances = [
                            graphDistance(blackStart, whiteStart),
                            graphDistance(blackStart, whiteEnd),
                            graphDistance(blackEnd, whiteStart),
                            graphDistance(blackEnd, whiteEnd)
                        ];
                        const sameGraphDistance = graphDistance(blackStart, blackEnd) + graphDistance(whiteStart, whiteEnd);
                        const score =
                            minGraphDistance(selected) * 140 +
                            sameGraphDistance * 60 +
                            Math.min(...crossGraphDistances) * 40 +
                            (faceDistance(blackStart, blackEnd) + faceDistance(whiteStart, whiteEnd)) * 3 +
                            Math.min(...crossDistances) * 3 +
                            (-blackStart.view.x + blackEnd.view.x + whiteStart.view.y - whiteEnd.view.y) * 0.35 +
                            (blackStart.view.z + blackEnd.view.z + whiteStart.view.z + whiteEnd.view.z) * 0.25;
                        if (!best || score > best.score) best = { score, blackStart, blackEnd, whiteStart, whiteEnd };
                    }
                }
            }
        }
        return best;
    };

    const caps = pickSeparatedVisibleCaps();
    const blackStart = new Set([keyOf(caps?.blackStart?.coordinate || coordinates[4])]);
    const blackEnd = new Set([keyOf(caps?.blackEnd?.coordinate || coordinates[10])]);
    const whiteStart = new Set([keyOf(caps?.whiteStart?.coordinate || coordinates[25])]);
    const whiteEnd = new Set([keyOf(caps?.whiteEnd?.coordinate || coordinates[22])]);
    return {
        black: {
            type: 'marked-cut-zones',
            label: 'buckyball cyan diagonal zones',
            start: (coordinate) => blackStart.has(keyOf(coordinate)),
            end: (coordinate) => blackEnd.has(keyOf(coordinate))
        },
        white: {
            type: 'marked-cut-zones',
            label: 'buckyball amber diagonal zones',
            start: (coordinate) => whiteStart.has(keyOf(coordinate)),
            end: (coordinate) => whiteEnd.has(keyOf(coordinate))
        }
    };
}

function createTrefoilTubeGoalZones(topology, topologySize) {
    if (topology !== 'trefoil_tube') return null;
    const width = Math.max(1, Number(topologySize?.[0]) || 1);
    const xEnd = Math.floor(width / 2);
    const arc = Math.max(1, Math.floor(width / 22));
    const cyclicDistance = (value, anchor) => {
        const direct = Math.abs(value - anchor);
        return Math.min(direct, width - direct);
    };

    return {
        black: {
            type: 'marked-cut-zones',
            label: 'trefoil seam zones',
            start: (coordinate) => Array.isArray(coordinate) && cyclicDistance(coordinate[0], 0) <= arc,
            end: (coordinate) => Array.isArray(coordinate) && cyclicDistance(coordinate[0], xEnd) <= arc
        },
        white: {
            type: 'marked-cut-zones',
            label: 'trefoil quarter-turn arc zones',
            start: (coordinate) => Array.isArray(coordinate) && cyclicDistance(coordinate[0], Math.floor(width / 4)) <= arc,
            end: (coordinate) => Array.isArray(coordinate) && cyclicDistance(coordinate[0], Math.floor(3 * width / 4)) <= arc
        }
    };
}

function expandedBoardSize(topology, baseSize, lattice = selectedLatticeForTopology(topology)) {
    const base = Math.max(4, Number(baseSize) || 6);
    if (topology === 'sphere' && lattice === BUCKYBALL_LATTICE) {
        return [30, 3, 1];
    }
    if (topology === 't2') {
        const wrapped = Math.max(24, base * 4);
        return [wrapped, wrapped, 1];
    }
    if (['t2', 'cylinder', 'sphere', 'klein', 'mobius', 'rp2'].includes(topology)) {
        return [Math.max(20, base * 4), Math.max(14, base * 3), 1];
    }
    if (topology === 'trefoil_tube') {
        return [Math.max(24, base * 6), Math.max(10, base * 2 + 2), 1];
    }
    if (topology === 'klein_quartic') {
        return [56, Math.max(4, base), 1];
    }
    return [base, base, base];
}

function syncBoardDimensions() {
    axisSizes = [0, 1, 2].map((axis) => Math.max(1, Number(game?.size?.[axis] || game?.size?.[0] || 4)));
    size = axisSizes[0];
}

function boardSelectSizeFromGame() {
    const topology = game?.topology?.topology || selectedTopology();
    if (topology === 'trefoil_tube') return Math.max(4, Math.round(axisSizes[0] / 6));
    if (['t2', 'cylinder', 'sphere', 'klein', 'mobius', 'rp2'].includes(topology)) return Math.max(4, Math.round(axisSizes[0] / 3));
    if (topology === 'klein_quartic' || topology === 'klein_quartic_product') return Math.max(4, axisSizes[1] || 4);
    return axisSizes[0] || 4;
}

function selectedTopology() {
    return elements.topology.value === 'open' ? elements.boundary.value : elements.topology.value;
}

function selectedLatticeForTopology(topology = selectedTopology()) {
    if (isVolumeTopology()) return elements.lattice.value || 'axis';
    if (topology === 'sphere') {
        return elements.lattice.value === BUCKYBALL_LATTICE
            ? BUCKYBALL_LATTICE
            : SPHERE_GEODESIC_LATTICE;
    }
    if (['t2', 'cylinder', 'klein', 'mobius'].includes(topology)) {
        return ['square', 'honeycomb', 'triangular'].includes(elements.lattice.value)
            ? elements.lattice.value
            : 'square';
    }
    return 'square';
}

function selectedTopologyLabel() {
    if (elements.topology.value !== 'open') {
        return elements.topology.options[elements.topology.selectedIndex]?.textContent || text(elements.topology.value);
    }
    const boundaryText = elements.boundary.options[elements.boundary.selectedIndex]?.textContent || text('standardBoundary');
    return `${text('cube')} / ${boundaryText}`;
}

function isVolumeTopology(value = elements.topology.value) {
    return value === 'open';
}

function isSurfaceTopology(value = elements.topology.value) {
    return ['t2', 'cylinder', 'sphere', 'klein', 'mobius', 'rp2', 'trefoil_tube'].includes(value);
}

function isBuckyballSphere() {
    return selectedTopology() === 'sphere' && game?.topology?.lattice === BUCKYBALL_LATTICE;
}

function syncLatticeControl() {
    const volume = isVolumeTopology();
    const sphere = !volume && selectedTopology() === 'sphere';
    const surfaceBoard = !volume && ['t2', 'cylinder', 'klein', 'mobius'].includes(selectedTopology());
    const allowed = volume
        ? ['axis', 'bcc', 'fcc', 'hcp']
        : sphere
            ? [SPHERE_GEODESIC_LATTICE, BUCKYBALL_LATTICE]
            : surfaceBoard
                ? ['square', 'honeycomb', 'triangular']
                : [];
    elements.boundaryGroup.hidden = !volume;
    elements.boundary.disabled = !volume;
    elements.latticeGroup.hidden = allowed.length === 0;
    elements.lattice.disabled = allowed.length === 0;
    const current = allowed.includes(elements.lattice.value) ? elements.lattice.value : allowed[0];
    elements.lattice.replaceChildren(...latticeOptionTemplates
        .filter((option) => allowed.includes(option.value))
        .map((option) => {
            const clone = option.cloneNode(true);
            if (clone.dataset.i18n) clone.textContent = text(clone.dataset.i18n);
            return clone;
        }));
    if (current) {
        elements.lattice.value = current;
    }
    if (!volume) {
        elements.boundary.value = 'open';
    }
}

function updateReadout() {
    if (!game) return;
    const blackCount = [...game.board.values()].filter((color) => color === HEX_COLORS.BLACK).length;
    elements.black.textContent = String(blackCount);
    elements.white.textContent = String(game.board.size - blackCount);
    elements.moves.textContent = String(game.moveNumber);
    elements.summary.textContent = game.moveNumber
        ? text('stoneSummary', { count: game.board.size })
        : text('noStones');
    if (game.winner) {
        elements.turn.textContent = game.winner === HEX_COLORS.BLACK ? text('blackWin') : text('whiteWin');
        elements.status.textContent = elements.turn.textContent;
    } else {
        elements.turn.textContent = game.currentColor === HEX_COLORS.BLACK ? text('blackTurn') : text('whiteTurn');
        elements.status.textContent = text(statusKey);
    }
}

function renderHistory() {
    if (!game) return;
    elements.history.replaceChildren();
    if (!game.history.length) {
        const empty = document.createElement('div');
        empty.className = 'history-empty';
        empty.textContent = text('historyEmpty');
        elements.history.append(empty);
        return;
    }
    for (const move of [...game.history].reverse()) {
        const row = document.createElement('div');
        row.className = 'move-history-item';
        row.textContent = `${move.move}. ${move.color === HEX_COLORS.BLACK ? text('black') : text('white')} [${move.coordinate.join(', ')}]`;
        elements.history.append(row);
    }
}

function radians(value) {
    return Number(value) * Math.PI / 180;
}

function rotatePoint(point) {
    let [x, y, z] = point;
    const ax = radians(elements.rotateX.value);
    const ay = radians(elements.rotateY.value);
    const az = radians(elements.rotateZ.value);
    [y, z] = [y * Math.cos(ax) - z * Math.sin(ax), y * Math.sin(ax) + z * Math.cos(ax)];
    [x, z] = [x * Math.cos(ay) + z * Math.sin(ay), -x * Math.sin(ay) + z * Math.cos(ay)];
    [x, y] = [x * Math.cos(az) - y * Math.sin(az), x * Math.sin(az) + y * Math.cos(az)];
    return [x, y, z];
}

function subtractVectors(left, right) {
    return left.map((value, index) => value - right[index]);
}

function crossVectors(left, right) {
    return [
        left[1] * right[2] - left[2] * right[1],
        left[2] * right[0] - left[0] * right[2],
        left[0] * right[1] - left[1] * right[0]
    ];
}

function normalizeVector(point) {
    const length = Math.hypot(point[0] || 0, point[1] || 0, point[2] || 0);
    return length > 0.0001 ? point.map((value) => value / length) : null;
}

function surfaceNormal(coordinate, model) {
    const topology = selectedTopology();
    const [x, y, z] = model;
    if (topology === 'sphere') return normalizeVector(model);
    if (topology === 'cylinder') return normalizeVector([x, 0, z]);
    if (topology === 't2') {
        const angle = Math.atan2(y, x);
        const center = [3.35 * Math.cos(angle), 3.35 * Math.sin(angle), 0];
        return normalizeVector([x - center[0], y - center[1], z]);
    }
    if (topology === 'klein' || topology === 'mobius' || topology === 'rp2') {
        return normalizeVector(model);
    }
    if (game?.topology?.isSpecial) {
        return normalizeVector(model);
    }
    return null;
}

function projectModelPoint(model, width, height, coordinate = null) {
    const rotated = rotatePoint(model);
    const normal = surfaceNormal(coordinate, model);
    const rotatedNormal = normal ? rotatePoint(normal) : null;
    const extent = isBuckyballSphere()
        ? specialModelExtent * 1.52
        : game.topology.isSpecial || isSurfaceTopology()
            ? specialModelExtent * 1.2
        : Math.max(...axisSizes) - 1;
    const fit = game.topology.isSpecial || isSurfaceTopology() ? 0.62 : 0.38;
    const scale = Math.min(width, height) * fit /
        Math.max(1, extent) *
        Number(elements.zoom.value);
    const perspective = 1 + rotated[2] / Math.max(12, Math.max(...axisSizes) * 4);
    return {
        x: width / 2 + rotated[0] * scale * perspective,
        y: height / 2 - rotated[1] * scale * perspective,
        depth: rotated[2],
        frontFacing: !rotatedNormal || rotatedNormal[2] >= -0.08,
        coordinate
    };
}

function kleinSurfaceCornerModelPoint(x, y, width, height) {
    const u = (y / Math.max(1, height)) * TWO_PI;
    const v = (x / Math.max(1, width)) * TWO_PI - Math.PI / 2;
    const r = 4 * (1 - Math.cos(u) / 2);
    let rawX;
    let rawY;
    if (u < Math.PI) {
        rawX = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(u) * Math.cos(v);
        rawY = 16 * Math.sin(u) + r * Math.sin(u) * Math.cos(v);
    } else {
        rawX = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI);
        rawY = 16 * Math.sin(u);
    }
    const rawZ = r * Math.sin(v);
    const scale = 0.2;
    return [
        rawX * scale * 1.12,
        rawY * scale * 0.72,
        rawZ * scale * 1.12
    ];
}

function polygonNormal(vertices) {
    if (!vertices || vertices.length < 3) return null;
    for (let index = 1; index < vertices.length - 1; index += 1) {
        const first = subtractVectors(vertices[index], vertices[0]);
        const second = subtractVectors(vertices[index + 1], vertices[0]);
        const normal = normalizeVector(crossVectors(first, second));
        if (normal) return normal;
    }
    return null;
}

function projectCoordinate(coordinate, width, height) {
    const midpoint = axisSizes.map((value) => (value - 1) / 2);
    const model = game.topology.isSpecial
        ? game.topology.position(coordinate).slice(0, 3)
        : (game.topology.position?.(coordinate) || coordinate.map((value, axis) => value - (midpoint[axis] || 0)));
    return projectModelPoint(model, width, height, coordinate);
}

function fitCanvas() {
    const rect = elements.canvas.getBoundingClientRect();
    renderDpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(380, Math.round(rect.height));
    if (elements.canvas.width !== Math.round(width * renderDpr) || elements.canvas.height !== Math.round(height * renderDpr)) {
        elements.canvas.width = Math.round(width * renderDpr);
        elements.canvas.height = Math.round(height * renderDpr);
    }
    context.setTransform(renderDpr, 0, 0, renderDpr, 0, 0);
    return { width, height };
}

function filterValue(input) {
    const value = Number(input.value);
    const axis = input === elements.filterY ? 1 : input === elements.filterZ ? 2 : 0;
    const limit = axisSizes[axis] || size;
    return Number.isInteger(value) && value >= 1 && value <= limit ? value - 1 : null;
}

function visibleCoordinate(coordinate) {
    if (game.topology.isSpecial || isSurfaceTopology()) return true;
    const filters = [filterValue(elements.filterX), filterValue(elements.filterY), filterValue(elements.filterZ)];
    return filters.every((value, axis) => value === null || coordinate[axis] === value);
}

function planeCorners(axis, value) {
    const otherAxes = [0, 1, 2].filter((candidate) => candidate !== axis);
    return [[0, 0], [axisSizes[otherAxes[0]] - 1, 0], [axisSizes[otherAxes[0]] - 1, axisSizes[otherAxes[1]] - 1], [0, axisSizes[otherAxes[1]] - 1]].map(([a, b]) => {
        const coordinate = [0, 0, 0];
        coordinate[axis] = value;
        coordinate[otherAxes[0]] = a;
        coordinate[otherAxes[1]] = b;
        return coordinate;
    });
}

function isLocalVisualEdge(a, b) {
    return a.every((value, axis) => Math.abs(value - b[axis]) <= 1);
}

function drawPlane(axis, value, fill, stroke, width, height) {
    const points = planeCorners(axis, value).map((coordinate) => projectCoordinate(coordinate, width, height));
    context.beginPath();
    points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = 1.5;
    context.stroke();
}

function surfacePanelCoordinates(x, y) {
    const topology = selectedTopology();
    const [width, height] = game.size;
    const normalize = (coordinate) => game.topology.normalize(coordinate);
    if (topology === 'trefoil_tube') {
        const wrap = (value, modulus) => ((value % modulus) + modulus) % modulus;
        return [
            normalize([wrap(x, width), wrap(y, height), 0]),
            normalize([wrap(x + 1, width), wrap(y, height), 0]),
            normalize([wrap(x + 1, width), wrap(y + 1, height), 0]),
            normalize([wrap(x, width), wrap(y + 1, height), 0])
        ].filter(Boolean);
    }
    if (topology === 'rp2') {
        if (x >= width - 1 || y >= height - 1) return [];
        return [
            normalize([x, y, 0]),
            normalize([x + 1, y, 0]),
            normalize([x + 1, y + 1, 0]),
            normalize([x, y + 1, 0])
        ].filter(Boolean);
    }
    if (topology === 'sphere') {
        if (y === 0) {
            return [
                normalize([0, 0, 0]),
                normalize([x, 1, 0]),
                normalize([x + 1, 1, 0])
            ].filter(Boolean);
        }
        if (y === height - 2) {
            return [
                normalize([x, height - 2, 0]),
                normalize([0, height - 1, 0]),
                normalize([x + 1, height - 2, 0])
            ].filter(Boolean);
        }
    }
    return [
        normalize([x, y, 0]),
        normalize([x + 1, y, 0]),
        normalize([x + 1, y + 1, 0]),
        normalize([x, y + 1, 0])
    ].filter(Boolean);
}

function surfacePanelCellCoordinate(x, y) {
    const [width, height] = game.size;
    const topology = selectedTopology();
    if (topology === 'sphere') {
        if (y === 0) return game.topology.normalize([x, 0, 0]);
        if (y >= height - 2) return game.topology.normalize([x, height - 1, 0]);
    }
    return game.topology.normalize([x, y, 0]);
}

function surfaceModelPointFromPlanar(x, y, gridWidth, gridHeight, lattice = selectedLatticeForTopology()) {
    const topology = selectedTopology();
    const u = (x / Math.max(1, gridWidth)) * TWO_PI;
    const band = y / Math.max(1, gridHeight);
    if (topology === 't2') {
        const v = band * TWO_PI;
        const honeycombTorus = lattice === 'honeycomb';
        const major = honeycombTorus ? 3.0 : 3.35;
        const minor = honeycombTorus ? 1.0 : 1.22;
        const ring = major + minor * Math.cos(v);
        return [ring * Math.cos(u), ring * Math.sin(u), minor * Math.sin(v)];
    }
    if (topology === 'cylinder') {
        const radius = 3.25;
        return [radius * Math.cos(u), (0.5 - band) * 6.0, radius * Math.sin(u)];
    }
    if (topology === 'mobius') {
        const t = (band - 0.5) * 1.65;
        const radius = 2.75 + t * Math.cos(u / 2);
        return [radius * Math.cos(u), t * Math.sin(u / 2), radius * Math.sin(u)];
    }
    return null;
}

function projectSurfacePlanarPoint(x, y, gridWidth, gridHeight, width, height, coordinate = null, lattice = selectedLatticeForTopology()) {
    const model = surfaceModelPointFromPlanar(x, y, gridWidth, gridHeight, lattice);
    return model ? projectModelPoint(model, width, height, coordinate) : null;
}

function surfacePanelFill(panel, topology) {
    const opaqueSphere = topology === 'sphere';
    if (panel.color === HEX_COLORS.BLACK) return opaqueSphere ? '#24a9c2' : 'rgba(36, 169, 194, 0.9)';
    if (panel.color === HEX_COLORS.WHITE) return opaqueSphere ? '#e3a42f' : 'rgba(227, 164, 47, 0.9)';
    if (panel.blackTarget && panel.whiteTarget) return opaqueSphere ? '#85977a' : 'rgba(133, 151, 122, 0.78)';
    if (panel.blackTarget) return opaqueSphere ? '#c2eff7' : 'rgba(194, 239, 247, 0.88)';
    if (panel.whiteTarget) return opaqueSphere ? '#f8e6ba' : 'rgba(248, 230, 186, 0.88)';
    return opaqueSphere ? '#e0e7e4' : topology === 'klein' ? 'rgba(224, 231, 228, 0.7)' : 'rgba(224, 231, 228, 0.84)';
}

function drawPanelList(panels, topology, filledCells) {
    panels.sort((a, b) => a.avgDepth - b.avgDepth);
    context.save();
    for (const panel of panels) {
        context.beginPath();
        panel.points.forEach((point, index) => {
            if (index) context.lineTo(point.x, point.y);
            else context.moveTo(point.x, point.y);
        });
        context.closePath();
        context.fillStyle = surfacePanelFill(panel, topology);
        context.fill();
        context.strokeStyle = topology === 'klein' ? 'rgba(65, 76, 84, 0.36)' : 'rgba(65, 76, 84, 0.58)';
        context.lineWidth = topology === 'klein' ? 0.45 : 0.72;
        context.stroke();
        if (panel.cell) {
            projectedSurfaceCells.push({
                points: panel.points,
                coordinate: panel.cell,
                depth: panel.avgDepth
            });
        }
    }
    context.restore();
    return filledCells;
}

function drawLatticeSurfacePanels(width, height, lattice) {
    const topology = selectedTopology();
    const [gridWidth, gridHeight] = game.size;
    const blackZone = game.topology.goalZones.black;
    const whiteZone = game.topology.goalZones.white;
    const panels = [];
    const filledCells = new Set();
    const addPanel = (vertices, cell) => {
        const points = vertices
            .map(([x, y]) => projectSurfacePlanarPoint(x, y, gridWidth, gridHeight, width, height, cell, lattice))
            .filter(Boolean);
        if (points.length < 3 || !cell) return;
        const color = game.getCell(cell);
        if (color) filledCells.add(cell.join(','));
        panels.push({
            points,
            avgDepth: points.reduce((sum, point) => sum + point.depth, 0) / points.length,
            cell,
            color,
            blackTarget: blackZone.start(cell) || blackZone.end(cell),
            whiteTarget: whiteZone.start(cell) || whiteZone.end(cell)
        });
    };

    if (lattice === 'honeycomb') {
        if (topology === 't2') {
            const root3 = Math.sqrt(3);
            const rawWidth = Math.max(1, 1.5 * gridWidth);
            const rawHeight = Math.max(1, root3 * gridHeight);
            const radius = 1.015;
            for (let y = 0; y < gridHeight; y += 1) {
                for (let x = 0; x < gridWidth; x += 1) {
                    const cell = game.topology.normalize([x, y, 0]);
                    const centerX = 1.5 * x;
                    const centerY = root3 * (y + (x % 2) * 0.5);
                    const vertices = Array.from({ length: 6 }, (_, index) => {
                        const angle = index * Math.PI / 3;
                        return [
                            ((centerX + radius * Math.cos(angle)) / rawWidth) * gridWidth,
                            ((centerY + radius * Math.sin(angle)) / rawHeight) * gridHeight
                        ];
                    });
                    addPanel(vertices, cell);
                }
            }
        } else {
            const bounds = honeycombBounds(gridWidth, gridHeight);
            const rawWidth = Math.max(1, bounds.maxX - bounds.minX);
            const rawHeight = Math.max(1, bounds.maxY - bounds.minY);
            honeycombCells(gridWidth, gridHeight).forEach((cellData, index) => {
                const x = index % gridWidth;
                const y = Math.floor(index / gridWidth);
                const cell = game.topology.normalize([x, y, 0]);
                const vertices = cellData.vertices.map((point) => [
                    ((point.x - bounds.minX) / rawWidth) * gridWidth,
                    ((point.y - bounds.minY) / rawHeight) * gridHeight
                ]);
                addPanel(vertices, cell);
            });
        }
    } else if (lattice === 'triangular') {
        for (let y = 0; y < gridHeight; y += 1) {
            for (let x = 0; x < gridWidth; x += 1) {
                const cell = game.topology.normalize([x, y, 0]);
                const shift0 = (y % 2) * 0.5;
                const shift1 = ((y + 1) % 2) * 0.5;
                addPanel([[x + shift0, y], [x + 1 + shift0, y], [x + shift1, y + 1]], cell);
                addPanel([[x + 1 + shift0, y], [x + 1 + shift1, y + 1], [x + shift1, y + 1]], cell);
            }
        }
    }
    return drawPanelList(panels, topology, filledCells);
}

function drawBuckyballSpherePanels(width, height) {
    const coordinates = game.topology.coordinates();
    const polygons = createBuckyballSphereFacePolygons({ radius: BUCKYBALL_RENDER_RADIUS, lift: 0.08 });
    const blackZone = game.topology.goalZones.black;
    const whiteZone = game.topology.goalZones.white;
    const panels = [];
    const filledCells = new Set();

    for (let index = 0; index < Math.min(coordinates.length, polygons.length); index += 1) {
        const coordinate = coordinates[index];
        const vertices = polygons[index].map((point) => [point.x, point.y, point.z]);
        const points = vertices.map((vertex) => projectModelPoint(vertex, width, height, coordinate));
        const avgDepth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
        const normal = polygonNormal(vertices);
        const rotatedNormal = normal ? rotatePoint(normal) : null;
        const color = game.getCell(coordinate);
        if (color) filledCells.add(coordinate.join(','));
        panels.push({
            points,
            coordinate,
            avgDepth,
            color,
            frontFacing: !rotatedNormal || rotatedNormal[2] >= -0.02,
            blackTarget: blackZone.start(coordinate) || blackZone.end(coordinate),
            whiteTarget: whiteZone.start(coordinate) || whiteZone.end(coordinate)
        });
    }

    panels.sort((a, b) => a.avgDepth - b.avgDepth);
    context.save();
    for (const panel of panels) {
        context.beginPath();
        panel.points.forEach((point, index) => {
            if (index) context.lineTo(point.x, point.y);
            else context.moveTo(point.x, point.y);
        });
        context.closePath();
        if (panel.color === HEX_COLORS.BLACK) context.fillStyle = '#24a9c2';
        else if (panel.color === HEX_COLORS.WHITE) context.fillStyle = '#e3a42f';
        else if (panel.blackTarget && panel.whiteTarget) context.fillStyle = '#85977a';
        else if (panel.blackTarget) context.fillStyle = '#c2eff7';
        else if (panel.whiteTarget) context.fillStyle = '#f8e6ba';
        else context.fillStyle = '#e0e7e4';
        context.fill();
        context.strokeStyle = 'rgba(37, 49, 56, 0.68)';
        context.lineWidth = 0.82;
        context.stroke();
        projectedSurfaceCells.push({
            points: panel.points,
            coordinate: panel.coordinate,
            depth: panel.avgDepth,
            frontFacing: panel.frontFacing
        });
    }

    context.strokeStyle = 'rgba(23, 32, 38, 0.58)';
    context.lineWidth = 0.65;
    for (const line of createBuckyballSphereGridLines({ radius: BUCKYBALL_RENDER_RADIUS, lift: 0.1, segments: 7 })) {
        const points = line.map((point) => projectModelPoint([point.x, point.y, point.z], width, height));
        context.beginPath();
        points.forEach((point, index) => {
            if (index) context.lineTo(point.x, point.y);
            else context.moveTo(point.x, point.y);
        });
        context.stroke();
    }
    context.restore();
    return filledCells;
}

function drawSurfacePanels(width, height) {
    const topology = selectedTopology();
    if (!isSurfaceTopology()) return new Set();
    if (isBuckyballSphere()) return drawBuckyballSpherePanels(width, height);
    const lattice = selectedLatticeForTopology(topology);
    if ((lattice === 'honeycomb' || lattice === 'triangular') && ['t2', 'cylinder', 'mobius'].includes(topology)) {
        return drawLatticeSurfacePanels(width, height, lattice);
    }
    const [gridWidth, gridHeight] = game.size;
    const wrapY = topology === 't2' || topology === 'klein' || topology === 'trefoil_tube';
    const yLimit = topology === 'sphere'
        ? gridHeight - 1
        : wrapY ? gridHeight : gridHeight - 1;
    const blackZone = game.topology.goalZones.black;
    const whiteZone = game.topology.goalZones.white;
    const panels = [];
    const filledCells = new Set();

    for (let y = 0; y < yLimit; y += 1) {
        for (let x = 0; x < gridWidth; x += 1) {
            const cell = surfacePanelCellCoordinate(x, y);
            let points;
            let blackTarget;
            let whiteTarget;
            if (topology === 'klein') {
                const corners = [
                    [x, y],
                    [x + 1, y],
                    [x + 1, y + 1],
                    [x, y + 1]
                ];
                points = corners.map(([cornerX, cornerY]) => projectModelPoint(
                    kleinSurfaceCornerModelPoint(cornerX, cornerY, gridWidth, gridHeight),
                    width,
                    height,
                    cell
                ));
                blackTarget = cell && (blackZone.start(cell) || blackZone.end(cell));
                whiteTarget = cell && (whiteZone.start(cell) || whiteZone.end(cell));
            } else {
                const coords = surfacePanelCoordinates(x, y);
                const unique = [...new Map(coords.map((coordinate) => [coordinate.join(','), coordinate])).values()];
                if (unique.length < 3) continue;
                points = unique.map((coordinate) => projectCoordinate(coordinate, width, height));
                blackTarget = unique.some((coordinate) => blackZone.start(coordinate) || blackZone.end(coordinate));
                whiteTarget = unique.some((coordinate) => whiteZone.start(coordinate) || whiteZone.end(coordinate));
            }
            if (!points || points.length < 3) continue;
            const avgDepth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
            const color = cell ? game.getCell(cell) : null;
            if (color && cell) filledCells.add(cell.join(','));
            panels.push({
                points,
                avgDepth,
                cell,
                color,
                blackTarget,
                whiteTarget
            });
        }
    }

    return drawPanelList(panels, topology, filledCells);
}

function hasSpecialCellPanels() {
    if (!game?.topology?.isSpecial || typeof game.topology.cellVertices !== 'function') return false;
    return game.topology.coordinates().some((coordinate) => game.topology.cellVertices(coordinate)?.length >= 3);
}

function drawSpecialCellPanels(width, height) {
    const blackZone = game.topology.goalZones.black;
    const whiteZone = game.topology.goalZones.white;
    const panels = [];
    const filledCells = new Set();
    for (const coordinate of game.topology.coordinates()) {
        const vertices = game.topology.cellVertices(coordinate);
        if (!vertices?.length) continue;
        const points = vertices.map((vertex) => projectModelPoint(vertex.slice(0, 3), width, height, coordinate));
        const avgDepth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
        const normal = polygonNormal(vertices.map((vertex) => vertex.slice(0, 3)));
        const rotatedNormal = normal ? rotatePoint(normal) : null;
        const color = game.getCell(coordinate);
        if (color) filledCells.add(coordinate.join(','));
        panels.push({
            points,
            avgDepth,
            coordinate,
            color,
            frontFacing: !rotatedNormal || rotatedNormal[2] >= -0.02,
            blackTarget: blackZone.start(coordinate) || blackZone.end(coordinate),
            whiteTarget: whiteZone.start(coordinate) || whiteZone.end(coordinate)
        });
    }

    panels.sort((a, b) => a.avgDepth - b.avgDepth);
    context.save();
    for (const panel of panels) {
        context.beginPath();
        panel.points.forEach((point, index) => {
            if (index) context.lineTo(point.x, point.y);
            else context.moveTo(point.x, point.y);
        });
        context.closePath();
        if (panel.color === HEX_COLORS.BLACK) context.fillStyle = 'rgba(36, 169, 194, 0.92)';
        else if (panel.color === HEX_COLORS.WHITE) context.fillStyle = 'rgba(227, 164, 47, 0.92)';
        else if (panel.blackTarget && panel.whiteTarget) context.fillStyle = 'rgba(133, 151, 122, 0.76)';
        else if (panel.blackTarget) context.fillStyle = 'rgba(194, 239, 247, 0.86)';
        else if (panel.whiteTarget) context.fillStyle = 'rgba(248, 230, 186, 0.86)';
        else context.fillStyle = 'rgba(224, 231, 228, 0.82)';
        context.fill();
        context.strokeStyle = 'rgba(41, 53, 61, 0.52)';
        context.lineWidth = 0.72;
        context.stroke();
        projectedSurfaceCells.push({
            points: panel.points,
            coordinate: panel.coordinate,
            depth: panel.avgDepth,
            frontFacing: panel.frontFacing
        });
    }
    context.restore();
    return filledCells;
}

function drawBoard() {
    if (!game) return;
    const { width, height } = fitCanvas();
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#080d12';
    context.fillRect(0, 0, width, height);
    projectedSurfaceCells = [];

    const special = game.topology.isSpecial === true;
    const surface = isSurfaceTopology();
    const specialCellPanels = hasSpecialCellPanels();
    if (special || surface) {
        const positions = game.topology.coordinates().flatMap((coordinate) => {
            const vertices = game.topology.cellVertices?.(coordinate);
            return vertices?.length ? vertices : [game.topology.position(coordinate)];
        });
        specialModelExtent = Math.max(1, ...positions.flatMap((position) => position.slice(0, 3).map(Math.abs)));
    }
    const blackZone = game.topology.goalZones.black;
    const whiteZone = game.topology.goalZones.white;
    const xEnd = blackZone.type === 'physical-sides' ? axisSizes[0] - 1 : Math.floor(axisSizes[0] / 2);
    const yEnd = whiteZone.type === 'physical-sides' ? axisSizes[1] - 1 : Math.floor(axisSizes[1] / 2);
    if (!special && !surface) {
        drawPlane(0, 0, 'rgba(66,199,223,0.08)', 'rgba(66,199,223,0.45)', width, height);
        drawPlane(0, xEnd, 'rgba(66,199,223,0.12)', 'rgba(66,199,223,0.68)', width, height);
        drawPlane(1, 0, 'rgba(232,180,76,0.07)', 'rgba(232,180,76,0.42)', width, height);
        drawPlane(1, yEnd, 'rgba(232,180,76,0.11)', 'rgba(232,180,76,0.65)', width, height);
    }
    const surfaceFilledCells = specialCellPanels
        ? drawSpecialCellPanels(width, height)
        : surface
            ? drawSurfacePanels(width, height)
            : new Set();

    const projectedEntries = game.topology.coordinates()
        .filter(visibleCoordinate)
        .map((coordinate) => [coordinate.join(','), projectCoordinate(coordinate, width, height)])
        .filter(([, point]) => point && Number.isFinite(point.x) && Number.isFinite(point.y))
        .filter(([, point]) => !surface || selectedTopology() === 'klein' || point.frontFacing !== false);
    const visible = projectedEntries.map(([key]) => key.split(',').map(Number));
    const visibleKeys = new Set(projectedEntries.map(([key]) => key));
    const projected = new Map(projectedEntries);

    if (!surface && !specialCellPanels) {
        context.lineWidth = 0.75;
        context.strokeStyle = 'rgba(160,184,198,0.2)';
        const drawnEdges = new Set();
        for (const coordinate of visible) {
            const fromKey = coordinate.join(',');
            const from = projected.get(fromKey);
            const topologyEdges = special || game.topology.lattice === 'hcp';
            const neighbors = topologyEdges
                ? game.topology.neighbors(coordinate)
                : Array.from({ length: 3 }, (_, axis) => {
                    const next = [...coordinate];
                    next[axis] += 1;
                    return next;
                });
            for (const next of neighbors) {
                if (!special && !isLocalVisualEdge(coordinate, next)) continue;
                const nextKey = next.join(',');
                if (!visibleKeys.has(nextKey)) continue;
                const edgeKey = [fromKey, nextKey].sort().join('|');
                if (drawnEdges.has(edgeKey)) continue;
                drawnEdges.add(edgeKey);
                const to = projected.get(nextKey);
                context.beginPath();
                context.moveTo(from.x, from.y);
                context.lineTo(to.x, to.y);
                context.stroke();
            }
        }
    }

    projectedSites = [...projected.values()].sort((a, b) => a.depth - b.depth);
    for (const site of projectedSites) {
        const siteKey = site.coordinate.join(',');
        if (surface && surfaceFilledCells.has(siteKey)) continue;
        if (specialCellPanels && surfaceFilledCells.has(siteKey)) continue;
        if (surface || specialCellPanels) continue;
        const color = game.getCell(site.coordinate);
        const isBlackTarget = blackZone.start(site.coordinate) || blackZone.end(site.coordinate);
        const isWhiteTarget = whiteZone.start(site.coordinate) || whiteZone.end(site.coordinate);
        const radius = color ? 7.5 : 3.4;
        context.beginPath();
        context.arc(site.x, site.y, radius, 0, Math.PI * 2);
        if (color === HEX_COLORS.BLACK) context.fillStyle = '#24a9c2';
        else if (color === HEX_COLORS.WHITE) context.fillStyle = '#e3a42f';
        else if (isBlackTarget && isWhiteTarget) context.fillStyle = '#7a8e78';
        else if (isBlackTarget) context.fillStyle = '#42c7df';
        else if (isWhiteTarget) context.fillStyle = '#e8b44c';
        else context.fillStyle = '#6f8491';
        context.fill();
        context.strokeStyle = color === HEX_COLORS.BLACK
            ? '#8ce7f4'
            : color === HEX_COLORS.WHITE
                ? '#ffe0a3'
                : 'rgba(228,239,245,0.7)';
        context.lineWidth = color ? 1.4 : 0.6;
        context.stroke();
    }
}

function canvasPoint(event) {
    const rect = elements.canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (elements.canvas.width / renderDpr) / rect.width,
        y: (event.clientY - rect.top) * (elements.canvas.height / renderDpr) / rect.height
    };
}

function nearestSite(event) {
    const point = canvasPoint(event);
    const frontOnly = isBuckyballSphere();
    const depths = projectedSurfaceCells.map((cell) => cell.depth);
    const maxDepth = depths.length ? Math.max(...depths) : 0;
    const minDepth = depths.length ? Math.min(...depths) : 0;
    const frontCutoff = maxDepth - (maxDepth - minDepth) * 0.58;
    for (const cell of [...projectedSurfaceCells].sort((a, b) => b.depth - a.depth)) {
        const clippedByDepth = isBuckyballSphere() && cell.depth < frontCutoff;
        if (frontOnly && (clippedByDepth || cell.frontFacing === false)) continue;
        if (pointInPolygon(point, cell.points)) {
            const center = cell.points.reduce((sum, item) => [sum[0] + item.x, sum[1] + item.y], [0, 0])
                .map((value) => value / cell.points.length);
            return {
                x: center[0],
                y: center[1],
                depth: cell.depth,
                coordinate: cell.coordinate
            };
        }
    }
    if (frontOnly && projectedSurfaceCells.length) return null;
    let nearest = null;
    let best = 32;
    for (const site of [...projectedSites].reverse()) {
        const distance = Math.hypot(point.x - site.x, point.y - site.y);
        if (distance < best) {
            best = distance;
            nearest = site;
        }
    }
    return nearest;
}

function pointInPolygon(point, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
        const xi = vertices[i].x;
        const yi = vertices[i].y;
        const xj = vertices[j].x;
        const yj = vertices[j].y;
        const intersects = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 1e-9) + xi);
        if (intersects) inside = !inside;
    }
    return inside;
}

function pointerDistance() {
    const pointers = [...activePointers.values()];
    if (pointers.length < 2) return 0;
    return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
}

function clampZoom(value) {
    return Math.max(0.35, Math.min(2.2, value));
}

function resetPointerGesture(event) {
    if (event && elements.canvas.hasPointerCapture?.(event.pointerId)) {
        try {
            elements.canvas.releasePointerCapture(event.pointerId);
        } catch {
            // Pointer capture may already be released by the browser.
        }
    }
    if (activePointers.size >= 2) {
        pinchStartDistance = pointerDistance();
        pinchStartZoom = Number(elements.zoom.value) || 1;
        dragMoved = true;
    } else if (activePointers.size === 1) {
        const pointer = [...activePointers.values()][0];
        lastPointer = { x: pointer.x, y: pointer.y };
        pinchStartDistance = 0;
    } else {
        dragging = false;
        lastPointer = null;
        pinchStartDistance = 0;
        elements.canvas.classList.remove('dragging');
    }
}

function playAt(coordinate) {
    if (onlineController && !onlineController.canActFor(game.currentColor)) {
        return { ok: false, error: text('connectOnline') };
    }
    const player = game.currentColor;
    const result = game.play(coordinate);
    window.hexApp?.__spaceTimeRecordImmediate?.({
        kind: 'hex',
        player,
        coord: [...coordinate]
    }, result);
    if (!result.ok) statusKey = result.code === 'opponent_camp' ? 'opponentCamp' : 'occupied';
    else statusKey = game.winner
        ? game.winner === HEX_COLORS.BLACK ? 'blackWin' : 'whiteWin'
        : 'emptyPrompt';
    updateReadout();
    renderHistory();
    drawBoard();
    if (result.ok) onlineController?.broadcastState();
    if (result.ok) scheduleRobot();
    return result;
}

function resolveScheduledHex(coordinate, player, { instant = false } = {}) {
    if (game.winner || game.getCell(coordinate) !== null) {
        statusKey = 'occupied';
        updateReadout();
        return { ok: false, error: text('occupied') };
    }
    const savedPlayer = game.currentColor;
    game.currentColor = player;
    const result = game.play(coordinate, player);
    if (!result.ok) game.currentColor = savedPlayer;
    else if (!instant && !game.winner) game.currentColor = savedPlayer;
    statusKey = !result.ok
        ? result.code === 'opponent_camp' ? 'opponentCamp' : 'occupied'
        : game.winner
        ? game.winner === HEX_COLORS.BLACK ? 'blackWin' : 'whiteWin'
        : 'emptyPrompt';
    updateReadout();
    renderHistory();
    drawBoard();
    return result;
}

function consumeScheduledHexTurn() {
    if (!game.winner) game.currentColor = otherHexColor(game.currentColor);
    updateReadout();
    drawBoard();
}

function scheduleRobot() {
    clearTimeout(robotTimer);
    syncRobotControls();
    if (elements.mode.value !== 'robot' || game.winner || game.currentColor !== robotSide()) return;
    statusKey = 'robotThinking';
    updateReadout();
    robotTimer = window.setTimeout(() => performRobotMove({ automatic: true }), 320);
}

function performRobotMove({ automatic = false } = {}) {
    if (!game || game.winner) return null;
    if (elements.mode.value === 'online') {
        setRobotAnalysisMessage(text('onlineUnavailable'));
        return null;
    }
    if (automatic && game.currentColor !== robotSide()) return null;
    const robotMove = chooseHexRobotMove(game, { level: robotLevel() });
    const coordinate = robotMove?.coordinate;
    if (!coordinate) {
        setRobotAnalysisMessage(text('robotNoMove'));
        return null;
    }
    const player = game.currentColor;
    if (window.hexApp?.__spaceTimeUsesFuture && window.hexApp.__spaceTimeScheduleRobotAction) {
        window.hexApp.__spaceTimeScheduleRobotAction({
            kind: 'hex',
            player,
            coord: [...coordinate]
        });
        setRobotAnalysisMessage(text('robotScheduled', {
            coord: coordLabel(coordinate),
            score: formatRobotScore(robotMove.score),
            nodes: robotMove.nodes
        }));
        return robotMove;
    }
    const result = game.play(coordinate);
    window.hexApp?.__spaceTimeRecordImmediate?.({
        kind: 'hex',
        player,
        coord: [...coordinate]
    }, result);
    statusKey = game.winner
        ? game.winner === HEX_COLORS.BLACK ? 'blackWin' : 'whiteWin'
        : 'emptyPrompt';
    updateReadout();
    renderHistory();
    drawBoard();
    setRobotAnalysisMessage(result.ok ? text('robotMoved', {
        coord: coordLabel(coordinate),
        score: formatRobotScore(robotMove.score),
        nodes: robotMove.nodes
    }) : result.error || text('occupied'));
    if (result.ok) onlineController?.broadcastState();
    if (result.ok) scheduleRobot();
    return robotMove;
}

elements.canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragging = true;
    dragMoved = false;
    lastPointer = { x: event.clientX, y: event.clientY };
    elements.canvas.setPointerCapture(event.pointerId);
    elements.canvas.classList.add('dragging');
    if (activePointers.size >= 2) {
        pinchStartDistance = pointerDistance();
        pinchStartZoom = Number(elements.zoom.value) || 1;
        dragMoved = true;
    }
});
elements.canvas.addEventListener('pointermove', (event) => {
    if (activePointers.has(event.pointerId)) {
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (!dragging) return;
    event.preventDefault();
    if (activePointers.size >= 2) {
        const distance = pointerDistance();
        if (pinchStartDistance > 0 && distance > 0) {
            elements.zoom.value = String(clampZoom(pinchStartZoom * (distance / pinchStartDistance)));
            drawBoard();
        }
        dragMoved = true;
        return;
    }
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragMoved = true;
    elements.rotateY.value = String(Math.max(-180, Math.min(180, Number(elements.rotateY.value) + dx * 0.22)));
    elements.rotateX.value = String(Math.max(-90, Math.min(90, Number(elements.rotateX.value) + dy * 0.2)));
    lastPointer = { x: event.clientX, y: event.clientY };
    drawBoard();
});
elements.canvas.addEventListener('pointerup', (event) => {
    event.preventDefault();
    const wasTap = !dragMoved && activePointers.size === 1;
    const site = wasTap ? nearestSite(event) : null;
    activePointers.delete(event.pointerId);
    resetPointerGesture(event);
    const timeControlled = Boolean(window.hexApp?.__spaceTimeUsesFuture || window.hexApp?.__spaceTimeUsesPast);
    if (site && !timeControlled) playAt(site.coordinate);
});
elements.canvas.addEventListener('pointercancel', (event) => {
    activePointers.delete(event.pointerId);
    resetPointerGesture(event);
});
elements.canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    elements.zoom.value = String(clampZoom(Number(elements.zoom.value) - event.deltaY * 0.0007));
    drawBoard();
}, { passive: false });

for (const input of [elements.rotateX, elements.rotateY, elements.rotateZ, elements.zoom, elements.filterX, elements.filterY, elements.filterZ]) {
    input.addEventListener('input', drawBoard);
}
elements.resetCamera.addEventListener('click', () => {
    elements.rotateX.value = '-24';
    elements.rotateY.value = '34';
    elements.rotateZ.value = '0';
    elements.zoom.value = '1';
    elements.filterX.value = '';
    elements.filterY.value = '';
    elements.filterZ.value = '';
    drawBoard();
});
elements.size.addEventListener('change', newGame);
elements.topology.addEventListener('change', newGame);
elements.boundary.addEventListener('change', newGame);
elements.lattice.addEventListener('change', newGame);
elements.newGame.addEventListener('click', newGame);
elements.mode.addEventListener('change', () => {
    statusKey = 'emptyPrompt';
    syncRobotControls();
    updateReadout();
    scheduleRobot();
});
elements.robotSide?.addEventListener('change', () => {
    setRobotAnalysisMessage(text('robotModeHint'));
    scheduleRobot();
});
elements.robotDepth?.addEventListener('change', () => {
    analyzeRobotPosition();
    scheduleRobot();
});
elements.robotMove?.addEventListener('click', () => performRobotMove({ automatic: false }));
elements.robotAnalyze?.addEventListener('click', () => analyzeRobotPosition());
elements.language.addEventListener('click', () => {
    language = language === 'en' ? 'zh' : 'en';
    localStorage.setItem(LANGUAGE_KEY, language);
    applyLanguage();
    drawBoard();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
});
window.addEventListener('resize', drawBoard);

newGame();
applyLanguage();
syncRobotControls();

function importHexState(state, messageKey = '') {
    game = HexGame.fromState(state);
    syncBoardDimensions();
    const importedBaseSize = boardSelectSizeFromGame();
    if ([...elements.size.options].some((option) => Number(option.value) === importedBaseSize)) {
        elements.size.value = String(importedBaseSize);
    }
    const importedTopology = game.topology.topology;
    if (['open', 'torus', 'r3_random', 'reflective'].includes(importedTopology)) {
        elements.topology.value = 'open';
        elements.boundary.value = importedTopology === 'reflective' ? 'open' : importedTopology;
    } else if ([...elements.topology.options].some((option) => option.value === importedTopology)) {
        elements.topology.value = importedTopology;
        elements.boundary.value = 'open';
    }
    if ([...elements.lattice.options].some((option) => option.value === game.topology.lattice)) {
        elements.lattice.value = game.topology.lattice;
    }
    elements.topologyMode.textContent = selectedTopologyLabel();
    elements.topologyInfo.textContent = text(`topologyInfo.${game.topology.topology}`);
    syncLatticeControl();
    for (const filter of [elements.filterX, elements.filterY, elements.filterZ]) {
        const axis = [elements.filterX, elements.filterY, elements.filterZ].indexOf(filter);
        filter.max = String(axisSizes[axis] || size);
        filter.disabled = game.topology.isSpecial === true || isSurfaceTopology();
    }
    if (messageKey) statusKey = messageKey;
    updateTargetText();
    updateReadout();
    renderHistory();
    drawBoard();
}

function exportNetworkState() {
    return {
        ...game.exportState(),
        currentPlayer: game.currentColor
    };
}

window.hexApp = {
    get game() { return game; },
    canvas: elements.canvas,
    text,
    getMode() { return elements.mode.value; },
    onlineElements: {
        mode: elements.mode,
        onlineControls: elements.onlineControls,
        connectionStatus: elements.connectionStatus,
        findMatch: elements.findMatch,
        createRoom: elements.createRoom,
        joinRoom: elements.joinRoom,
        roomId: elements.roomId,
        chatMessages: elements.chatMessages,
        chatInput: elements.chatInput,
        chatSend: elements.chatSend
    },
    playAt,
    exportState() {
        return game.exportState();
    },
    importState(state) {
        importHexState(state);
    },
    exportNetworkState,
    importNetworkState(state) {
        importHexState(state, 'syncedOnline');
        return true;
    },
    setStatus(message) {
        statusKey = message;
        updateReadout();
    },
    onlineGameKey() {
        return `hex-3d-${selectedTopology()}-${elements.lattice.value}-${axisSizes.join('x')}`;
    },
    onlineMatchKey() {
        return isSpaceTime ? 'hex-3p1' : 'hex-3d';
    },
    coordFromEvent(event) {
        return nearestSite(event)?.coordinate || null;
    },
    getSpaceTimeCells() {
        const surfaceCells = projectedSurfaceCells.map((cell) => {
            const center = cell.points.reduce((sum, item) => [sum[0] + item.x, sum[1] + item.y], [0, 0])
                .map((value) => value / cell.points.length);
            return {
                coordinate: [...cell.coordinate],
                key: cell.coordinate.join(','),
                x: center[0],
                y: center[1],
                radius: 11,
                shape: 'polygon'
            };
        });
        const cells = surfaceCells.length ? surfaceCells : projectedSites.map((site) => ({
            coordinate: [...site.coordinate],
            key: site.coordinate.join(','),
            x: site.x,
            y: site.y,
            radius: site.radius || (game.getCell(site.coordinate) ? 7.5 : 3.4),
            shape: 'circle'
        }));
        return cells;
    },
    resolveScheduledHex,
    consumeScheduledHexTurn,
    render: drawBoard,
    newGame,
    setLanguage(nextLanguage) {
        language = normalizeLanguage(nextLanguage);
        localStorage.setItem(LANGUAGE_KEY, language);
        applyLanguage();
        drawBoard();
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
    }
};

onlineController = createHexOnlineController(window.hexApp);
