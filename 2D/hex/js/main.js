import HexGame, { HEX_COLORS, otherHexColor } from '../../../js/hex/HexGame.js';
import { createHexOnlineController } from '../../../js/hex/HexOnline.js';

const LANGUAGE_KEY = 'topological-boardgame:language';
const params = new URLSearchParams(window.location.search);
const isSpaceTime = params.get('spacetime') === '2p1';

const I18N = {
    en: {
        eyebrow: 'Connection strategy',
        title: isSpaceTime ? '2+1D Hex' : '2D Hex',
        description: isSpaceTime
            ? 'Place stones on the spatial board while the launcher preserves the selected time-schedule parameters.'
            : 'Place stones to build one unbroken path between your two target sides.',
        boardAria: '2D Hex board',
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
        custom: 'Custom',
        topology: 'Boundary / Topology',
        standard: 'Standard',
        cylinder: 'Cylinder',
        torus: 'Torus',
        mobius: 'Möbius',
        klein: 'Klein Bottle',
        kleinQuartic: 'Klein Quartic',
        randomBoundary: 'Random Boundary',
        lattice: 'Lattice',
        hexagonal: 'Honeycomb',
        triangular: 'Triangular',
        square: 'Square',
        honeycomb: 'Honeycomb',
        boardView: 'Board View',
        zoom: 'Zoom',
        resetView: 'Reset View',
        newGame: 'New Game',
        targets: 'Target Sides',
        targetZones: 'Target Zones',
        blackTarget: 'Black connects left to right',
        whiteTarget: 'White connects top to bottom',
        blackMarkedTarget: 'Black connects the two cyan marked zones',
        whiteMarkedTarget: 'White connects the two gold marked zones',
        moveHistory: 'Move History',
        onlineChat: 'Online Chat',
        chatEmpty: 'Connect online to chat.',
        messagePlaceholder: 'Message opponent',
        send: 'Send',
        blackTurn: 'Black to play',
        whiteTurn: 'White to play',
        emptyPrompt: 'Choose an empty Hex cell.',
        noStones: 'No stones placed',
        stoneSummary: '{count} stones on the board',
        historyEmpty: 'No moves yet',
        occupied: 'Choose an empty Hex cell.',
        blackWin: 'Black connected its target sides.',
        whiteWin: 'White connected its target sides.',
        robotThinking: 'Robot is choosing an empty cell.',
        connectOnline: 'Connect or join an Online room before placing.',
        waitingFor: 'Waiting for {color}.',
        onlineAs: 'Online as {color}',
        waitingOpponent: 'Waiting for opponent',
        syncedOnline: 'Online board synchronized.',
        you: 'You',
        opponent: 'Opponent',
        onlineUnavailable: 'Connect or join an Online room before placing.',
        chatLocal: 'Chat is stored only in this page until an online room is connected.',
        topologyInfo: {
            open: 'Standard has ordinary edges. Hex fills honeycomb cells: Black connects left/right; White connects top/bottom.',
            cylinder: 'Cylinder identifies left/right. Black uses two marked cut-seam zones; White keeps physical top/bottom targets.',
            torus: 'Torus wraps both directions. Both colors connect explicit marked cut-seam zones.',
            mobius: 'Möbius identifies left/right with a twist. Black uses marked cut-seam zones.',
            klein: 'Klein Bottle uses one ordinary wrap and one twisted wrap; both goals are marked zones.',
            klein_quartic: 'Klein Quartic uses a 56-triangle genus-3 fundamental-domain board. Both colors connect explicit marked zones.',
            rp2: 'RP2 identifies opposite edges with reversals; both goals are explicit marked zones.',
            random: 'Random Boundary uses one fixed, invertible boundary pairing for this game. Both goals are marked zones.'
        }
    },
    zh: {
        eyebrow: '連線策略',
        title: isSpaceTime ? '2+1D 六貫棋' : '2D 六貫棋',
        description: isSpaceTime
            ? '在空間棋盤上落子，並保留啟動器所選的時間排程參數。'
            : '輪流落子，建立一條連續路徑來連接自己的一對目標邊。',
        boardAria: '2D 六貫棋棋盤',
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
        custom: '自訂',
        topology: '邊界／拓撲',
        standard: '標準',
        cylinder: '圓柱',
        torus: '環面',
        mobius: 'Möbius 帶',
        klein: 'Klein 瓶',
        kleinQuartic: 'Klein 四次曲線',
        randomBoundary: '隨機邊界',
        lattice: '晶格',
        hexagonal: '蜂巢晶格',
        triangular: '三角晶格',
        square: '方格晶格',
        honeycomb: '蜂巢晶格',
        boardView: '棋盤視圖',
        zoom: '縮放',
        resetView: '重設視圖',
        newGame: '新遊戲',
        targets: '目標邊',
        targetZones: '目標區',
        blackTarget: '黑方連接左邊與右邊',
        whiteTarget: '白方連接上邊與下邊',
        blackMarkedTarget: '黑方連接兩個青色標示區',
        whiteMarkedTarget: '白方連接兩個金色標示區',
        moveHistory: '落子記錄',
        onlineChat: '線上聊天',
        chatEmpty: '連上線上房間後即可聊天。',
        messagePlaceholder: '傳送訊息給對手',
        send: '傳送',
        blackTurn: '輪到黑方',
        whiteTurn: '輪到白方',
        emptyPrompt: '請選擇一個空的六貫棋格。',
        noStones: '尚未落子',
        stoneSummary: '棋盤上共有 {count} 顆棋子',
        historyEmpty: '尚無落子記錄',
        occupied: '請選擇一個空的六貫棋格。',
        blackWin: '黑方已連接自己的兩個目標邊。',
        whiteWin: '白方已連接自己的兩個目標邊。',
        robotThinking: '機器人正在選擇空格。',
        connectOnline: '請先連線或加入線上房間再落子。',
        waitingFor: '等待 {color} 行動。',
        onlineAs: '線上身份：{color}',
        waitingOpponent: '等待對手',
        syncedOnline: '線上棋盤已同步。',
        you: '你',
        opponent: '對手',
        onlineUnavailable: '請先連線或加入線上房間再落子。',
        chatLocal: '連上線上房間前，訊息只會保留在此頁。',
        topologyInfo: {
            open: '標準棋盤使用普通邊界。黑方連接左右，白方連接上下。',
            cylinder: '圓柱會識別左右邊；黑方改用兩個切縫目標區，白方保留上下實體目標邊。',
            torus: '環面會包裹兩個方向；雙方都連接明確標示的切縫目標區。',
            mobius: 'Möbius 帶以扭轉方式識別左右邊；黑方使用切縫目標區。',
            klein: 'Klein 瓶包含普通包裹與扭轉包裹；雙方皆使用標示目標區。',
            klein_quartic: 'Klein 四次曲線使用 56 個三角形組成的 genus-3 基本域棋盤；雙方皆連接明確標示的目標區。',
            rp2: 'RP2 以反轉方式識別相對邊；雙方皆使用明確標示的目標區。',
            random: '隨機邊界在本局使用固定且可逆的邊界配對；雙方皆使用標示目標區。'
        }
    }
};

const elements = {
    canvas: document.getElementById('hexBoard'),
    pageTitle: document.getElementById('pageTitle'),
    playerTurn: document.getElementById('playerTurn'),
    blackScore: document.getElementById('blackScore'),
    whiteScore: document.getElementById('whiteScore'),
    moveCount: document.getElementById('moveCount'),
    boundaryMode: document.getElementById('boundaryMode'),
    gameStatus: document.getElementById('gameStatus'),
    moveSummary: document.getElementById('moveSummary'),
    gameMode: document.getElementById('gameModeSelect'),
    onlineControls: document.getElementById('onlineControls'),
    connectionStatus: document.getElementById('connectionStatus'),
    findMatch: document.getElementById('findMatchBtn'),
    createRoom: document.getElementById('createRoomBtn'),
    joinRoom: document.getElementById('joinRoomBtn'),
    roomId: document.getElementById('roomIdInput'),
    boardSize: document.getElementById('boardSizeSelect'),
    customSize: document.getElementById('customBoardSizeInput'),
    boundary: document.getElementById('boundarySelect'),
    lattice: document.getElementById('latticeSelect'),
    zoom: document.getElementById('zoom'),
    resetView: document.getElementById('resetViewBtn'),
    boundaryInfo: document.getElementById('boundaryInfo'),
    targetHeading: document.getElementById('targetHeading'),
    blackTargetText: document.getElementById('blackTargetText'),
    whiteTargetText: document.getElementById('whiteTargetText'),
    newGame: document.getElementById('newGameBtn'),
    history: document.getElementById('moveHistoryList'),
    language: document.getElementById('languageButton'),
    home: document.getElementById('homeLink'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    chatSend: document.getElementById('chatSendBtn')
};

const context = elements.canvas.getContext('2d');
let language = normalizeLanguage(params.get('lang') || localStorage.getItem(LANGUAGE_KEY));
let game;
let size = 11;
let topology = 'open';
let centers = [];
let hoverKey = null;
let statusKey = 'emptyPrompt';
let robotTimer = null;
let renderDpr = 1;
let onlineController = null;

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
    elements.boundaryInfo.textContent = text(`topologyInfo.${topology}`);
    onlineController?.refreshLabels();
    updateTargetText();
    updateReadout();
    renderHistory();
}

function updateTargetText() {
    if (!game) return;
    const physical = game.topology.goalZones.black.type === 'physical-sides' &&
        game.topology.goalZones.white.type === 'physical-sides';
    elements.blackTargetText.textContent = text(physical ? 'blackTarget' : 'blackMarkedTarget');
    elements.whiteTargetText.textContent = text(physical ? 'whiteTarget' : 'whiteMarkedTarget');
    elements.targetHeading.textContent = text(physical ? 'targets' : 'targetZones');
}

function selectedSize() {
    if (elements.boardSize.value !== 'custom') return Number(elements.boardSize.value);
    return Math.max(3, Math.min(25, Number(elements.customSize.value) || 11));
}

function newGame(messageKey = 'emptyPrompt') {
    window.hexApp?.__spaceTimeOnNewGame?.();
    clearTimeout(robotTimer);
    size = selectedSize();
    topology = elements.boundary.value;
    const gameSize = elements.lattice.value === 'triangular'
        ? [size * 2 - 1, size]
        : size;
    game = new HexGame({
        dimension: 2,
        size: gameSize,
        topology,
        lattice: elements.lattice.value,
        randomBoundarySeed: topology === 'random' ? `hex-rbc:${size}:${Date.now()}` : ''
    });
    elements.lattice.disabled = game.topology.isSpecial === true;
    statusKey = messageKey;
    elements.boundaryMode.textContent = elements.boundary.options[elements.boundary.selectedIndex].text;
    elements.boundaryInfo.textContent = text(`topologyInfo.${topology}`);
    updateTargetText();
    hoverKey = null;
    updateReadout();
    renderHistory();
    drawBoard();
}

function updateReadout() {
    if (!game) return;
    const black = [...game.board.values()].filter((color) => color === HEX_COLORS.BLACK).length;
    const white = game.board.size - black;
    elements.blackScore.textContent = String(black);
    elements.whiteScore.textContent = String(white);
    elements.moveCount.textContent = String(game.moveNumber);
    elements.moveSummary.textContent = game.moveNumber
        ? text('stoneSummary', { count: game.board.size })
        : text('noStones');

    if (game.winner) {
        elements.playerTurn.textContent = game.winner === HEX_COLORS.BLACK ? text('blackWin') : text('whiteWin');
        elements.gameStatus.textContent = elements.playerTurn.textContent;
    } else {
        elements.playerTurn.textContent = game.currentColor === HEX_COLORS.BLACK ? text('blackTurn') : text('whiteTurn');
        elements.gameStatus.textContent = text(statusKey);
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
        const player = move.color === HEX_COLORS.BLACK ? text('black') : text('white');
        row.textContent = `${move.move}. ${player} [${move.coordinate.join(', ')}]`;
        elements.history.append(row);
    }
}

function traceHex(ctx, x, y, radius) {
    ctx.beginPath();
    for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI / 180) * (60 * index - 30);
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function fitCanvas() {
    const rect = elements.canvas.getBoundingClientRect();
    renderDpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(360, Math.round(rect.height));
    if (elements.canvas.width !== Math.round(width * renderDpr) || elements.canvas.height !== Math.round(height * renderDpr)) {
        elements.canvas.width = Math.round(width * renderDpr);
        elements.canvas.height = Math.round(height * renderDpr);
    }
    context.setTransform(renderDpr, 0, 0, renderDpr, 0, 0);
    return { width, height };
}

function buildCenters(width, height) {
    const padding = Math.max(24, Math.min(width, height) * 0.055);
    const zoom = Math.max(0.35, Math.min(2.8, Number(elements.zoom?.value) || 1));
    const [gridWidth, gridHeight] = game?.size || [size, size];
    if (elements.lattice.value === 'square') {
        const spacing = Math.max(8, Math.min(
            (width - padding * 2) / gridWidth,
            (height - padding * 2) / gridHeight
        )) * zoom;
        const boardWidth = spacing * gridWidth;
        const boardHeight = spacing * gridHeight;
        const offsetX = (width - boardWidth) / 2;
        const offsetY = (height - boardHeight) / 2;
        centers = [];
        for (let r = 0; r < gridHeight; r += 1) {
            for (let q = 0; q < gridWidth; q += 1) {
                centers.push({
                    q,
                    r,
                    coordinate: [q, r],
                    key: `${q},${r}`,
                    x: offsetX + (q + 0.5) * spacing,
                    y: offsetY + (r + 0.5) * spacing,
                    radius: spacing / 2,
                    vertices: [
                        [offsetX + q * spacing, offsetY + r * spacing],
                        [offsetX + (q + 1) * spacing, offsetY + r * spacing],
                        [offsetX + (q + 1) * spacing, offsetY + (r + 1) * spacing],
                        [offsetX + q * spacing, offsetY + (r + 1) * spacing]
                    ],
                    shape: 'square'
                });
            }
        }
        return;
    }

    const triangular = elements.lattice.value === 'triangular';
    if (triangular) {
        const triangleHeight = Math.sqrt(3) / 2;
        const boardWidthUnits = (gridWidth + 1) / 2;
        const boardHeightUnits = Math.max(1, gridHeight * triangleHeight);
        const side = Math.max(10, Math.min(
            (width - padding * 2) / boardWidthUnits,
            (height - padding * 2) / boardHeightUnits
        )) * zoom;
        const heightStep = side * triangleHeight;
        const boardWidth = boardWidthUnits * side;
        const boardHeight = boardHeightUnits * side;
        const offsetX = (width - boardWidth) / 2;
        const offsetY = (height - boardHeight) / 2;
        centers = [];
        for (let r = 0; r < gridHeight; r += 1) {
            for (let q = 0; q < gridWidth; q += 1) {
                const left = offsetX + q * side * 0.5;
                const right = left + side;
                const mid = left + side * 0.5;
                const top = offsetY + r * heightStep;
                const bottom = top + heightStep;
                const up = (q + r) % 2 === 0;
                const vertices = up
                    ? [[left, bottom], [right, bottom], [mid, top]]
                    : [[left, top], [right, top], [mid, bottom]];
                const centerX = vertices.reduce((sum, vertex) => sum + vertex[0], 0) / 3;
                const centerY = vertices.reduce((sum, vertex) => sum + vertex[1], 0) / 3;
                centers.push({
                    q,
                    r,
                    coordinate: [q, r],
                    key: `${q},${r}`,
                    x: centerX,
                    y: centerY,
                    radius: side / Math.sqrt(3),
                    vertices,
                    shape: 'triangle'
                });
            }
        }
        return;
    }

    const rawWidthFactor = Math.sqrt(3) * (gridWidth + Math.max(0, gridHeight - 1) / 2);
    const rawHeightFactor = 1.5 * (gridHeight - 1) + 2;
    const radius = Math.max(7, Math.min(
        (width - padding * 2) / rawWidthFactor,
        (height - padding * 2) / rawHeightFactor
    )) * zoom;
    const boardWidth = rawWidthFactor * radius;
    const boardHeight = rawHeightFactor * radius;
    const offsetX = (width - boardWidth) / 2 + Math.sqrt(3) * radius / 2;
    const offsetY = (height - boardHeight) / 2 + radius;
    centers = [];
    for (let r = 0; r < gridHeight; r += 1) {
        for (let q = 0; q < gridWidth; q += 1) {
            centers.push({
                q,
                r,
                coordinate: [q, r],
                key: `${q},${r}`,
                x: offsetX + Math.sqrt(3) * radius * (q + r / 2),
                y: offsetY + 1.5 * radius * r,
                radius,
                vertices: Array.from({ length: 6 }, (_, index) => {
                    const angle = (Math.PI / 180) * (60 * index - 30);
                    return [
                        offsetX + Math.sqrt(3) * radius * (q + r / 2) + radius * Math.cos(angle),
                        offsetY + 1.5 * radius * r + radius * Math.sin(angle)
                    ];
                }),
                shape: 'hex'
            });
        }
    }
}

function traceCell(cell, scale = 0.96) {
    if (cell.vertices?.length >= 3) {
        context.beginPath();
        for (let index = 0; index < cell.vertices.length; index += 1) {
            const x = cell.x + (cell.vertices[index][0] - cell.x) * scale;
            const y = cell.y + (cell.vertices[index][1] - cell.y) * scale;
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.closePath();
        return;
    }
    if (cell.shape === 'square') {
        const half = cell.radius * scale;
        context.beginPath();
        context.rect(cell.x - half, cell.y - half, half * 2, half * 2);
        context.closePath();
        return;
    }
    if (cell.shape === 'triangle') {
        const vertices = cell.vertices || [];
        context.beginPath();
        for (let index = 0; index < vertices.length; index += 1) {
            const x = cell.x + (vertices[index][0] - cell.x) * scale;
            const y = cell.y + (vertices[index][1] - cell.y) * scale;
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.closePath();
        return;
    }
    traceHex(context, cell.x, cell.y, cell.radius * scale);
}

function buildSpecialCenters(width, height) {
    const coordinates = game.topology.coordinates();
    const positioned = coordinates.map((coordinate) => ({
        coordinate,
        position: game.topology.position(coordinate),
        vertices: game.topology.cellVertices?.(coordinate) || null
    })).filter((item) => item.position);
    const modelPoints = positioned.flatMap((item) => item.vertices?.length ? item.vertices : [item.position]);
    const xs = modelPoints.map((item) => item[0]);
    const ys = modelPoints.map((item) => item[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padding = Math.max(32, Math.min(width, height) * 0.08);
    const zoom = Math.max(0.35, Math.min(2.8, Number(elements.zoom?.value) || 1));
    const scale = Math.min(
        (width - padding * 2) / Math.max(0.1, maxX - minX),
        (height - padding * 2) / Math.max(0.1, maxY - minY)
    ) * zoom;
    const usedWidth = (maxX - minX) * scale;
    const usedHeight = (maxY - minY) * scale;
    const offsetX = (width - usedWidth) / 2 - minX * scale;
    const offsetY = (height - usedHeight) / 2 - minY * scale;
    const radius = game.topology.topology === 'klein_quartic'
        ? Math.max(5, Math.min(12, scale * 0.075))
        : Math.max(4, Math.min(9, scale * 0.055));
    centers = positioned.map(({ coordinate, position, vertices }) => {
        const screenVertices = vertices?.map((vertex) => [
            offsetX + vertex[0] * scale,
            offsetY + vertex[1] * scale
        ]) || null;
        const center = screenVertices?.length
            ? screenVertices.reduce((sum, vertex) => [sum[0] + vertex[0], sum[1] + vertex[1]], [0, 0])
                .map((value) => value / screenVertices.length)
            : [offsetX + position[0] * scale, offsetY + position[1] * scale];
        return {
            coordinate,
            key: game.topology.key(coordinate),
            x: center[0],
            y: center[1],
            radius,
            vertices: screenVertices,
            shape: game.topology.topology === 'klein_quartic' ? 'triangle' : 'hex'
        };
    });
}

function targetFlags(coordinate) {
    const black = game.topology.goalZones.black;
    const white = game.topology.goalZones.white;
    return {
        blackTarget: black.start(coordinate) || black.end(coordinate),
        whiteTarget: white.start(coordinate) || white.end(coordinate)
    };
}

function cellFill(cell, blackTarget, whiteTarget) {
    const color = game.getCell(cell.coordinate);
    if (color === HEX_COLORS.BLACK) return '#24a9c2';
    if (color === HEX_COLORS.WHITE) return '#e3a42f';
    if (hoverKey === cell.key && !game.winner) {
        return game.currentColor === HEX_COLORS.BLACK ? '#a8e3ec' : '#f8d99a';
    }
    if (blackTarget && whiteTarget) return '#cbd8c8';
    if (blackTarget) return '#d9f3f7';
    if (whiteTarget) return '#f8e9c4';
    return '#e5e9e5';
}

function drawSpecialEdges() {
    if (game.topology.topology === 'klein_quartic') return;
    const centerByKey = new Map(centers.map((cell) => [cell.key, cell]));
    const drawn = new Set();
    const isKlein = game.topology.topology === 'klein_quartic';
    context.strokeStyle = isKlein ? 'rgba(75, 91, 102, 0.16)' : 'rgba(75, 91, 102, 0.34)';
    context.lineWidth = isKlein ? 0.75 : 1;
    for (const cell of centers) {
        for (const neighbor of game.topology.neighbors(cell.coordinate)) {
            const neighborKey = game.topology.key(neighbor);
            const edgeKey = [cell.key, neighborKey].sort().join('|');
            if (drawn.has(edgeKey)) continue;
            const target = centerByKey.get(neighborKey);
            if (!target) continue;
            drawn.add(edgeKey);
            context.beginPath();
            context.moveTo(cell.x, cell.y);
            if (isKlein) {
                const midX = (cell.x + target.x) / 2;
                const midY = (cell.y + target.y) / 2;
                const pull = 0.12;
                const controlX = midX * (1 - pull) + (context.canvas.width / renderDpr / 2) * pull;
                const controlY = midY * (1 - pull) + (context.canvas.height / renderDpr / 2) * pull;
                context.quadraticCurveTo(controlX, controlY, target.x, target.y);
            } else {
                context.lineTo(target.x, target.y);
            }
            context.stroke();
        }
    }
}

function drawBoard() {
    if (!game) return;
    const { width, height } = fitCanvas();
    if (game.topology.isSpecial) buildSpecialCenters(width, height);
    else buildCenters(width, height);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#f6f7f5';
    context.fillRect(0, 0, width, height);
    if (game.topology.isSpecial) drawSpecialEdges();

    for (const cell of centers) {
        const { blackTarget, whiteTarget } = targetFlags(cell.coordinate);
        traceCell(cell, 1);
        context.fillStyle = cellFill(cell, blackTarget, whiteTarget);
        context.fill();
        const color = game.getCell(cell.coordinate);
        context.strokeStyle = color === HEX_COLORS.BLACK
            ? '#08788e'
            : color === HEX_COLORS.WHITE
                ? '#a96c05'
                : '#69737a';
        context.lineWidth = color ? Math.max(1.2, cell.radius * 0.12) : Math.max(0.8, cell.radius * 0.055);
        context.stroke();

        if (blackTarget) {
            traceCell(cell, 0.82);
            context.strokeStyle = 'rgba(24, 142, 169, 0.72)';
            context.lineWidth = Math.max(1.4, cell.radius * 0.13);
            context.stroke();
        }
        if (whiteTarget) {
            traceCell(cell, 0.7);
            context.strokeStyle = 'rgba(185, 124, 13, 0.74)';
            context.lineWidth = Math.max(1.2, cell.radius * 0.1);
            context.stroke();
        }
    }
}

function canvasPoint(event) {
    const rect = elements.canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (rect.width ? elements.canvas.width / renderDpr / rect.width : 1),
        y: (event.clientY - rect.top) * (rect.height ? elements.canvas.height / renderDpr / rect.height : 1)
    };
}

function nearestCell(event) {
    const point = canvasPoint(event);
    let nearest = null;
    let distance = Infinity;
    for (const cell of centers) {
        if (cell.vertices?.length) {
            if (pointInPolygon(point, cell.vertices)) return cell;
            continue;
        }
        const candidate = Math.hypot(point.x - cell.x, point.y - cell.y);
        if (candidate < distance) {
            distance = candidate;
            nearest = cell;
        }
    }
    return nearest && distance <= nearest.radius ? nearest : null;
}

function pointInPolygon(point, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
        const [xi, yi] = vertices[i];
        const [xj, yj] = vertices[j];
        const intersects = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 1e-9) + xi);
        if (intersects) inside = !inside;
    }
    return inside;
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
    if (!result.ok) {
        statusKey = 'occupied';
        updateReadout();
        return result;
    }
    statusKey = game.winner
        ? game.winner === HEX_COLORS.BLACK ? 'blackWin' : 'whiteWin'
        : 'emptyPrompt';
    updateReadout();
    renderHistory();
    drawBoard();
    onlineController?.broadcastState();
    scheduleRobot();
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
    if (elements.gameMode.value !== 'robot' || game.winner || game.currentColor !== HEX_COLORS.WHITE) return;
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

elements.canvas.addEventListener('pointermove', (event) => {
    const cell = nearestCell(event);
    const next = cell?.key ?? null;
    if (next !== hoverKey) {
        hoverKey = next;
        drawBoard();
    }
});

elements.canvas.addEventListener('pointerleave', () => {
    hoverKey = null;
    drawBoard();
});

elements.canvas.addEventListener('click', (event) => {
    const cell = nearestCell(event);
    if (cell) playAt(cell.coordinate);
});

elements.boardSize.addEventListener('change', () => {
    elements.customSize.hidden = elements.boardSize.value !== 'custom';
    if (!elements.customSize.hidden) elements.customSize.focus();
    newGame();
});
elements.customSize.addEventListener('change', () => newGame());
elements.boundary.addEventListener('change', () => newGame());
elements.lattice.addEventListener('change', () => newGame());
elements.zoom?.addEventListener('input', drawBoard);
elements.resetView?.addEventListener('click', () => {
    elements.zoom.value = '1';
    drawBoard();
});
elements.newGame.addEventListener('click', () => newGame());
elements.gameMode.addEventListener('change', () => {
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
elements.canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (!elements.zoom) return;
    elements.zoom.value = String(Math.max(0.35, Math.min(2.8, Number(elements.zoom.value) - event.deltaY * 0.001)));
    drawBoard();
}, { passive: false });
window.addEventListener('resize', drawBoard);

newGame();
applyLanguage();

function importHexState(state, messageKey = '') {
    game = HexGame.fromState(state);
    size = game.topology.lattice === 'triangular'
        ? Math.max(3, Math.round((game.size[0] + 1) / 2))
        : game.size[0];
    if ([...elements.boardSize.options].some((option) => Number(option.value) === size)) {
        elements.boardSize.value = String(size);
    }
    if ([...elements.boundary.options].some((option) => option.value === game.topology.topology)) {
        elements.boundary.value = game.topology.topology;
    }
    if ([...elements.lattice.options].some((option) => option.value === game.topology.lattice)) {
        elements.lattice.value = game.topology.lattice;
    }
    elements.lattice.disabled = game.topology.isSpecial === true;
    elements.boundaryMode.textContent = elements.boundary.options[elements.boundary.selectedIndex].text;
    elements.boundaryInfo.textContent = text(`topologyInfo.${game.topology.topology}`);
    topology = game.topology.topology;
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
    getMode() { return elements.gameMode.value; },
    onlineElements: {
        mode: elements.gameMode,
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
        return `hex-2d-${topology}-${elements.lattice.value}-${size}`;
    },
    onlineMatchKey() {
        return isSpaceTime ? 'hex-2p1' : 'hex-2d';
    },
    coordFromEvent(event) {
        return nearestCell(event)?.coordinate || null;
    },
    getSpaceTimeCells() {
        return centers.map((cell) => ({
            coordinate: [...cell.coordinate],
            key: cell.key,
            x: cell.x,
            y: cell.y,
            radius: cell.radius,
            shape: cell.shape
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
