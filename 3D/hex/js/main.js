import HexGame, { HEX_COLORS, otherHexColor } from '../../../js/hex/HexGame.js';
import { createHexOnlineController } from '../../../js/hex/HexOnline.js';

const LANGUAGE_KEY = 'topological-boardgame:language';
const params = new URLSearchParams(window.location.search);
const isSpaceTime = params.get('spacetime') === '3p1';

const I18N = {
    en: {
        eyebrow: 'Volumetric connection strategy',
        title: isSpaceTime ? '3+1D Hex' : '3D Hex',
        description: isSpaceTime
            ? 'Build a connection through the spatial volume while preserving the selected time-schedule parameters.'
            : 'Place stones on volume or embedded-surface boards and connect the active target zones.',
        boardAria: 'Rotatable 3D Hex board',
        controls: 'Game Controls',
        home: 'Home',
        switchLanguage: 'Switch language',
        black: 'Black',
        white: 'White',
        moves: 'Moves',
        gameMode: 'Game Mode',
        local: 'Local',
        online: 'Online',
        robot: 'Robot',
        disconnected: 'Disconnected',
        findMatch: 'Find Match',
        privateRoom: 'PRIVATE ROOM',
        createRoom: 'Create Room',
        or: 'OR',
        roomPlaceholder: 'Room code',
        joinRoom: 'Join Room',
        boardSize: 'Board Size',
        topology: 'Topology',
        cube: 'R3 / Cube',
        t3: 'T3 Periodic Volume',
        r3Random: '3D Random Boundary',
        reflective: 'Reflective Volume',
        t2: 'T2 Torus Surface',
        cylinder: 'Cylinder Surface',
        sphere: 'S2 Sphere Surface',
        klein: 'Klein Bottle Surface',
        mobius: 'Mobius Strip Surface',
        rp2: 'RP2 Surface',
        lattice: 'Lattice',
        axisLattice: 'Standard axis',
        hcpLattice: 'HCP',
        trefoilTube: 'Trefoil Tube',
        trefoilSolid: 'Trefoil Solid Tube',
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
        blackTarget: 'Black connects x-low to x-high',
        whiteTarget: 'White connects y-low to y-high',
        blackMarkedTarget: 'Black connects the two cyan marked zones',
        whiteMarkedTarget: 'White connects the two gold marked zones',
        moveHistory: 'Move History',
        onlineChat: 'Online Chat',
        chatEmpty: 'Connect online to chat.',
        messagePlaceholder: 'Message opponent',
        send: 'Send',
        blackTurn: 'Black to play',
        whiteTurn: 'White to play',
        emptyPrompt: 'Choose an empty 3D site.',
        occupied: 'Choose an empty Hex site.',
        noStones: 'No stones placed',
        stoneSummary: '{count} stones on the board',
        historyEmpty: 'No moves yet',
        blackWin: 'Black connected x-low to x-high.',
        whiteWin: 'White connected y-low to y-high.',
        robotThinking: 'Robot is choosing an empty site.',
        connectOnline: 'Connect or join an Online room before placing.',
        waitingFor: 'Waiting for {color}.',
        onlineAs: 'Online as {color}',
        waitingOpponent: 'Waiting for opponent',
        syncedOnline: 'Online board synchronized.',
        you: 'You',
        opponent: 'Opponent',
        onlineUnavailable: 'Connect or join an Online room before placing.',
        topologyInfo: {
            open: 'R3 / Cube uses open boundaries and axis-neighbor cubic adjacency.',
            torus: 'T3 wraps every volume axis. Goals are explicit marked cut-zone planes inside the periodic volume.',
            r3_random: '3D RBC uses a seeded random boundary pairing when a move exits the cube.',
            reflective: 'Reflective volume keeps the finite cubic graph while displaying reflective boundary intent.',
            t2: 'T2 is a torus surface embedded in 3D. Both players connect marked cut-seam zones on the surface.',
            cylinder: 'Cylinder is a 2D surface embedded in 3D. Black uses cut-seam zones; White uses the two rim directions.',
            sphere: 'S2 is a latitude-ring sphere. Longitude wraps while the polar direction has physical caps.',
            klein: 'Klein bottle is a non-orientable surface with a twisted seam. Goals use marked surface zones.',
            mobius: 'Mobius strip is a one-sided twisted strip. Black uses the seam zones; White uses the open sides.',
            rp2: 'RP2 uses antipodal edge identification and is shown as a marked fundamental polygon surface.',
            trefoil_tube: 'A two-dimensional periodic tube surface around a trefoil centerline, embedded in the rotatable 3D view.',
            trefoil_solid: 'A discrete solid trefoil tube with periodic (s, theta) directions and bounded radial layers.'
        }
    },
    zh: {
        eyebrow: '體積連線策略',
        title: isSpaceTime ? '3+1D Hex' : '3D Hex',
        description: isSpaceTime
            ? '在空間體積中建立連線，並保留所選的時間排程參數。'
            : '在體積或嵌入曲面棋盤上落子，連接目前棋盤的目標區。',
        boardAria: '可旋轉的 3D Hex 棋盤',
        controls: '遊戲控制',
        home: '首頁',
        switchLanguage: '切換語言',
        black: '黑方',
        white: '白方',
        moves: '步數',
        gameMode: '遊戲模式',
        local: '本機',
        online: '線上',
        robot: '機器人',
        disconnected: '未連線',
        findMatch: '尋找對手',
        privateRoom: '私人房間',
        createRoom: '建立房間',
        or: '或',
        roomPlaceholder: '房間代碼',
        joinRoom: '加入房間',
        boardSize: '棋盤大小',
        topology: '拓撲',
        cube: 'R3／立方體',
        t3: 'T3 週期體積',
        r3Random: '3D 隨機邊界',
        reflective: '反射體積',
        t2: 'T2 環面曲面',
        cylinder: '圓柱曲面',
        sphere: 'S2 球面曲面',
        klein: 'Klein 瓶曲面',
        mobius: 'Mobius 帶曲面',
        rp2: 'RP2 曲面',
        lattice: '晶格',
        axisLattice: '標準軸向',
        hcpLattice: 'HCP',
        trefoilTube: '三葉結管面',
        trefoilSolid: '三葉結實心管',
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
        blackTarget: '黑方連接 x-low 與 x-high',
        whiteTarget: '白方連接 y-low 與 y-high',
        blackMarkedTarget: '黑方連接兩個青色標示區',
        whiteMarkedTarget: '白方連接兩個金色標示區',
        moveHistory: '落子記錄',
        onlineChat: '線上聊天',
        chatEmpty: '連上線上房間後即可聊天。',
        messagePlaceholder: '傳送訊息給對手',
        send: '傳送',
        blackTurn: '輪到黑方',
        whiteTurn: '輪到白方',
        emptyPrompt: '請選擇一個空的 3D 格點。',
        occupied: '請選擇一個空的 Hex 格點。',
        noStones: '尚未落子',
        stoneSummary: '棋盤上共有 {count} 顆棋子',
        historyEmpty: '尚無落子記錄',
        blackWin: '黑方已連接 x-low 與 x-high。',
        whiteWin: '白方已連接 y-low 與 y-high。',
        robotThinking: '機器人正在選擇空格。',
        connectOnline: '請先連線或加入線上房間再落子。',
        waitingFor: '等待 {color} 行動。',
        onlineAs: '線上身份：{color}',
        waitingOpponent: '等待對手',
        syncedOnline: '線上棋盤已同步。',
        you: '你',
        opponent: '對手',
        onlineUnavailable: '請先連線或加入線上房間再落子。',
        topologyInfo: {
            open: 'R3／立方體使用開放邊界與立方晶格的軸向相鄰關係。',
            torus: 'T3 會包裹全部體積座標軸；雙方連接週期體積中的明確切面目標區。',
            r3_random: '3D RBC 會在行動離開立方體邊界時使用固定種子的隨機邊界配對。',
            reflective: '反射體積保留有限立方圖，並顯示反射邊界的意義。',
            t2: 'T2 是嵌入 3D 視圖的環面曲面；雙方連接曲面上的切縫目標區。',
            cylinder: '圓柱是嵌入 3D 視圖的二維曲面；黑方使用切縫目標區，白方使用兩側邊界。',
            sphere: 'S2 是緯線球面；經度包回，極向保留實體端點。',
            klein: 'Klein 瓶是含扭轉縫的非定向曲面；目標使用曲面標示區。',
            mobius: 'Mobius 帶是一側曲面；黑方使用接縫目標區，白方使用開放邊。',
            rp2: 'RP2 使用對跖邊界識別，並以標示基本多邊形曲面顯示。',
            trefoil_tube: '嵌入可旋轉 3D 視圖中的二維週期三葉結管面。',
            trefoil_solid: '離散三葉結實心管；(s, theta) 方向週期包回，徑向分層有界。'
        }
    }
};

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
    onlineControls: document.getElementById('onlineControls'),
    connectionStatus: document.getElementById('connectionStatus'),
    findMatch: document.getElementById('findMatchBtn'),
    createRoom: document.getElementById('createRoomBtn'),
    joinRoom: document.getElementById('joinRoomBtn'),
    roomId: document.getElementById('roomIdInput'),
    size: document.getElementById('boardSizeSelect'),
    topology: document.getElementById('topologySelect'),
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

const context = elements.canvas.getContext('2d');
let language = normalizeLanguage(params.get('lang') || localStorage.getItem(LANGUAGE_KEY));
let game;
let size = 6;
let projectedSites = [];
let statusKey = 'emptyPrompt';
let robotTimer = null;
let onlineController = null;
let dragging = false;
let dragMoved = false;
let lastPointer = null;
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
    elements.topologyInfo.textContent = text(`topologyInfo.${elements.topology.value}`);
    updateTargetText();
    updateReadout();
    renderHistory();
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
    size = Number(elements.size.value);
    game = new HexGame({ dimension: 3, size, topology: elements.topology.value, lattice: elements.lattice.value });
    statusKey = 'emptyPrompt';
    elements.topologyMode.textContent = elements.topology.options[elements.topology.selectedIndex].text;
    elements.topologyInfo.textContent = text(`topologyInfo.${elements.topology.value}`);
    updateTargetText();
    syncLatticeControl();
    for (const filter of [elements.filterX, elements.filterY, elements.filterZ]) {
        filter.max = String(size);
        if (Number(filter.value) > size) filter.value = '';
        filter.disabled = game.topology.isSpecial === true || isSurfaceTopology();
    }
    updateReadout();
    renderHistory();
    drawBoard();
}

function isVolumeTopology(value = elements.topology.value) {
    return ['open', 'torus', 'r3_random', 'reflective'].includes(value);
}

function isSurfaceTopology(value = elements.topology.value) {
    return ['t2', 'cylinder', 'sphere', 'klein', 'mobius', 'rp2'].includes(value);
}

function syncLatticeControl() {
    const volume = isVolumeTopology();
    elements.latticeGroup.hidden = !volume;
    elements.lattice.disabled = !volume;
    if (!volume) elements.lattice.value = 'axis';
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

function projectCoordinate(coordinate, width, height) {
    const midpoint = (size - 1) / 2;
    const model = game.topology.isSpecial
        ? game.topology.position(coordinate).slice(0, 3)
        : (game.topology.position?.(coordinate) || coordinate.map((value) => value - midpoint));
    const rotated = rotatePoint(model);
    const extent = game.topology.isSpecial || isSurfaceTopology()
        ? specialModelExtent * 1.2
        : size - 1;
    const scale = Math.min(width, height) * 0.62 /
        Math.max(1, extent) *
        Number(elements.zoom.value);
    const perspective = 1 + rotated[2] / Math.max(12, size * 4);
    return {
        x: width / 2 + rotated[0] * scale * perspective,
        y: height / 2 - rotated[1] * scale * perspective,
        depth: rotated[2],
        coordinate
    };
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
    return Number.isInteger(value) && value >= 1 && value <= size ? value - 1 : null;
}

function visibleCoordinate(coordinate) {
    if (game.topology.isSpecial || isSurfaceTopology()) return true;
    const filters = [filterValue(elements.filterX), filterValue(elements.filterY), filterValue(elements.filterZ)];
    return filters.every((value, axis) => value === null || coordinate[axis] === value);
}

function planeCorners(axis, value) {
    const otherAxes = [0, 1, 2].filter((candidate) => candidate !== axis);
    return [[0, 0], [size - 1, 0], [size - 1, size - 1], [0, size - 1]].map(([a, b]) => {
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

function drawBoard() {
    if (!game) return;
    const { width, height } = fitCanvas();
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#080d12';
    context.fillRect(0, 0, width, height);

    const special = game.topology.isSpecial === true;
    const surface = isSurfaceTopology();
    if (special || surface) {
        const positions = game.topology.coordinates().map((coordinate) => game.topology.position(coordinate));
        specialModelExtent = Math.max(1, ...positions.flatMap((position) => position.slice(0, 3).map(Math.abs)));
    }
    const blackZone = game.topology.goalZones.black;
    const whiteZone = game.topology.goalZones.white;
    const xEnd = blackZone.type === 'physical-sides' ? size - 1 : Math.floor(size / 2);
    const yEnd = whiteZone.type === 'physical-sides' ? size - 1 : Math.floor(size / 2);
    if (!special && !surface) {
        drawPlane(0, 0, 'rgba(66,199,223,0.08)', 'rgba(66,199,223,0.45)', width, height);
        drawPlane(0, xEnd, 'rgba(66,199,223,0.12)', 'rgba(66,199,223,0.68)', width, height);
        drawPlane(1, 0, 'rgba(232,180,76,0.07)', 'rgba(232,180,76,0.42)', width, height);
        drawPlane(1, yEnd, 'rgba(232,180,76,0.11)', 'rgba(232,180,76,0.65)', width, height);
    }

    const visible = game.topology.coordinates().filter(visibleCoordinate);
    const visibleKeys = new Set(visible.map((coordinate) => coordinate.join(',')));
    const projected = new Map(visible.map((coordinate) => [coordinate.join(','), projectCoordinate(coordinate, width, height)]));

    context.lineWidth = 0.75;
    context.strokeStyle = 'rgba(160,184,198,0.2)';
    const drawnEdges = new Set();
    for (const coordinate of visible) {
        const fromKey = coordinate.join(',');
        const from = projected.get(fromKey);
        const topologyEdges = special || surface || game.topology.lattice === 'hcp';
        const neighbors = topologyEdges
            ? game.topology.neighbors(coordinate)
            : Array.from({ length: 3 }, (_, axis) => {
                const next = [...coordinate];
                next[axis] += 1;
                return next;
            });
        for (const next of neighbors) {
            if (!special && !surface && !isLocalVisualEdge(coordinate, next)) continue;
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

    projectedSites = [...projected.values()].sort((a, b) => a.depth - b.depth);
    for (const site of projectedSites) {
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
    if (!result.ok) statusKey = 'occupied';
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
    statusKey = game.winner
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
    if (elements.mode.value !== 'robot' || game.winner || game.currentColor !== HEX_COLORS.WHITE) return;
    statusKey = 'robotThinking';
    updateReadout();
    robotTimer = window.setTimeout(() => {
        const empty = game.topology.coordinates().filter((coordinate) => game.getCell(coordinate) === null);
        if (!empty.length) return;
        const coordinate = empty[Math.floor(Math.random() * empty.length)];
        if (window.hexApp?.__spaceTimeUsesFuture && window.hexApp.__spaceTimeScheduleRobotAction) {
            window.hexApp.__spaceTimeScheduleRobotAction({
                kind: 'hex',
                player: game.currentColor,
                coord: [...coordinate]
            });
            return;
        }
        const player = game.currentColor;
        const result = game.play(coordinate);
        window.hexApp?.__spaceTimeRecordImmediate?.({
            kind: 'hex',
            player,
            coord: [...coordinate]
        }, result);
        statusKey = game.winner ? 'whiteWin' : 'emptyPrompt';
        updateReadout();
        renderHistory();
        drawBoard();
    }, 320);
}

elements.canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    dragMoved = false;
    lastPointer = { x: event.clientX, y: event.clientY };
    elements.canvas.setPointerCapture(event.pointerId);
    elements.canvas.classList.add('dragging');
});
elements.canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragMoved = true;
    elements.rotateY.value = String(Math.max(-180, Math.min(180, Number(elements.rotateY.value) + dx * 0.5)));
    elements.rotateX.value = String(Math.max(-90, Math.min(90, Number(elements.rotateX.value) + dy * 0.45)));
    lastPointer = { x: event.clientX, y: event.clientY };
    drawBoard();
});
elements.canvas.addEventListener('pointerup', (event) => {
    const site = !dragMoved ? nearestSite(event) : null;
    dragging = false;
    elements.canvas.classList.remove('dragging');
    if (site && !window.hexApp?.__spaceTimeUsesFuture) playAt(site.coordinate);
});
elements.canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    elements.zoom.value = String(Math.max(0.55, Math.min(1.8, Number(elements.zoom.value) - event.deltaY * 0.001)));
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
elements.lattice.addEventListener('change', newGame);
elements.newGame.addEventListener('click', newGame);
elements.mode.addEventListener('change', () => {
    statusKey = 'emptyPrompt';
    updateReadout();
    scheduleRobot();
});
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

function importHexState(state, messageKey = '') {
    game = HexGame.fromState(state);
    size = game.size[0];
    if ([...elements.size.options].some((option) => Number(option.value) === size)) {
        elements.size.value = String(size);
    }
    if ([...elements.topology.options].some((option) => option.value === game.topology.topology)) {
        elements.topology.value = game.topology.topology;
    }
    if ([...elements.lattice.options].some((option) => option.value === game.lattice)) {
        elements.lattice.value = game.lattice;
    }
    elements.topologyMode.textContent = elements.topology.options[elements.topology.selectedIndex].text;
    elements.topologyInfo.textContent = text(`topologyInfo.${game.topology.topology}`);
    syncLatticeControl();
    for (const filter of [elements.filterX, elements.filterY, elements.filterZ]) {
        filter.max = String(size);
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
        return `hex-3d-${elements.topology.value}-${elements.lattice.value}-${size}`;
    },
    onlineMatchKey() {
        return isSpaceTime ? 'hex-3p1' : 'hex-3d';
    },
    coordFromEvent(event) {
        return nearestSite(event)?.coordinate || null;
    },
    getSpaceTimeCells() {
        return projectedSites.map((site) => ({
            coordinate: [...site.coordinate],
            key: site.coordinate.join(','),
            x: site.x,
            y: site.y,
            radius: site.radius || (game.getCell(site.coordinate) ? 7.5 : 3.4),
            shape: 'circle'
        }));
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
