import HexGame, { HEX_COLORS, otherHexColor } from '../../../js/hex/HexGame.js';

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
        randomBoundary: 'Random Boundary',
        kleinQuartic: 'Klein Quartic (56 triangles)',
        trefoilDiagram: 'Trefoil Diagram',
        trefoilTube: 'Trefoil Tube',
        lattice: 'Lattice',
        hexagonal: 'Hexagonal / Axial',
        square: 'Square',
        honeycomb: 'Honeycomb',
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
        onlineUnavailable: 'Online Hex rooms are not connected yet. Local and Robot modes are ready.',
        chatLocal: 'Chat is stored only in this page until an online room is connected.',
        topologyInfo: {
            open: 'Standard has ordinary edges. Black connects left/right; White connects top/bottom.',
            cylinder: 'Cylinder identifies left/right. Black uses two marked cut-seam zones; White keeps physical top/bottom targets.',
            torus: 'Torus wraps both directions. Both colors connect explicit marked cut-seam zones.',
            mobius: 'Möbius identifies left/right with a twist. Black uses marked cut-seam zones.',
            klein: 'Klein Bottle uses one ordinary wrap and one twisted wrap; both goals are marked zones.',
            rp2: 'RP2 identifies opposite edges with reversals; both goals are explicit marked zones.',
            random: 'Random Boundary uses one fixed, invertible boundary pairing for this game. Both goals are marked zones.',
            klein_quartic: 'A closed genus-3 board represented by the 56 triangular cells of the cubic Klein graph. The graph has 84 cell adjacencies and explicit goal arcs.',
            trefoil_diagram: 'A cyclic trefoil diagram with three recorded over/under crossings. Placement follows the knot-track graph.',
            trefoil_tube: 'A periodic tube around a trefoil centerline with coordinates (s, theta). Both coordinate directions wrap.'
        }
    },
    zh: {
        eyebrow: '連線策略',
        title: isSpaceTime ? '2+1D Hex' : '2D Hex',
        description: isSpaceTime
            ? '在空間棋盤上落子，並保留啟動器所選的時間排程參數。'
            : '輪流落子，建立一條連續路徑來連接自己的一對目標邊。',
        boardAria: '2D Hex 棋盤',
        controls: '遊戲控制',
        home: '首頁',
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
        randomBoundary: '隨機邊界',
        kleinQuartic: 'Klein 四次曲線（56 三角形）',
        trefoilDiagram: '三葉結圖',
        trefoilTube: '三葉結管面',
        lattice: '晶格',
        hexagonal: '六角形／軸向',
        square: '方格',
        honeycomb: '蜂巢',
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
        emptyPrompt: '請選擇一個空的 Hex 格。',
        noStones: '尚未落子',
        stoneSummary: '棋盤上共有 {count} 顆棋子',
        historyEmpty: '尚無落子記錄',
        occupied: '請選擇一個空的 Hex 格。',
        blackWin: '黑方已連接自己的兩個目標邊。',
        whiteWin: '白方已連接自己的兩個目標邊。',
        robotThinking: '機器人正在選擇空格。',
        onlineUnavailable: '線上 Hex 房間尚未接通；本機與機器人模式可正常遊玩。',
        chatLocal: '連上線上房間前，訊息只會保留在此頁。',
        topologyInfo: {
            open: '標準棋盤使用普通邊界。黑方連接左右，白方連接上下。',
            cylinder: '圓柱會識別左右邊；黑方改用兩個切縫目標區，白方保留上下實體目標邊。',
            torus: '環面會包裹兩個方向；雙方都連接明確標示的切縫目標區。',
            mobius: 'Möbius 帶以扭轉方式識別左右邊；黑方使用切縫目標區。',
            klein: 'Klein 瓶包含普通包裹與扭轉包裹；雙方皆使用標示目標區。',
            rp2: 'RP2 以反轉方式識別相對邊；雙方皆使用明確標示的目標區。',
            random: '隨機邊界在本局使用固定且可逆的邊界配對；雙方皆使用標示目標區。',
            klein_quartic: '封閉的虧格 3 棋盤，以三次 Klein 圖的 56 個三角形胞腔表示，共有 84 條胞腔鄰接邊與明確目標弧。',
            trefoil_diagram: '具有三個上下穿越記錄的循環三葉結圖；落子沿著結軌道圖進行。',
            trefoil_tube: '沿三葉結中心線形成的週期管面，座標為 (s, theta)，兩個座標方向皆會包回。'
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
    boardSize: document.getElementById('boardSizeSelect'),
    customSize: document.getElementById('customBoardSizeInput'),
    boundary: document.getElementById('boundarySelect'),
    lattice: document.getElementById('latticeSelect'),
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
    elements.language.textContent = language === 'zh' ? '中 / EN' : 'EN / 中';
    elements.home.href = `../../index.html?lang=${language}`;
    elements.boundaryInfo.textContent = text(`topologyInfo.${topology}`);
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
    game = new HexGame({
        dimension: 2,
        size,
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
    if (elements.lattice.value === 'square') {
        const spacing = Math.max(8, Math.min(
            (width - padding * 2) / size,
            (height - padding * 2) / size
        ));
        const boardWidth = spacing * size;
        const boardHeight = spacing * size;
        const offsetX = (width - boardWidth) / 2;
        const offsetY = (height - boardHeight) / 2;
        centers = [];
        for (let r = 0; r < size; r += 1) {
            for (let q = 0; q < size; q += 1) {
                centers.push({
                    q,
                    r,
                    coordinate: [q, r],
                    key: `${q},${r}`,
                    x: offsetX + (q + 0.5) * spacing,
                    y: offsetY + (r + 0.5) * spacing,
                    radius: spacing / 2,
                    shape: 'square'
                });
            }
        }
        return;
    }

    const rawWidthFactor = Math.sqrt(3) * (1.5 * (size - 1) + 1);
    const rawHeightFactor = 1.5 * (size - 1) + 2;
    const radius = Math.max(7, Math.min(
        (width - padding * 2) / rawWidthFactor,
        (height - padding * 2) / rawHeightFactor
    ));
    const boardWidth = rawWidthFactor * radius;
    const boardHeight = rawHeightFactor * radius;
    const offsetX = (width - boardWidth) / 2 + Math.sqrt(3) * radius / 2;
    const offsetY = (height - boardHeight) / 2 + radius;
    centers = [];
    for (let r = 0; r < size; r += 1) {
        for (let q = 0; q < size; q += 1) {
            centers.push({
                q,
                r,
                coordinate: [q, r],
                key: `${q},${r}`,
                x: offsetX + Math.sqrt(3) * radius * (q + r / 2),
                y: offsetY + 1.5 * radius * r,
                radius,
                shape: 'hex'
            });
        }
    }
}

function traceCell(cell, scale = 0.96) {
    if (cell.shape === 'square') {
        const half = cell.radius * scale;
        context.beginPath();
        context.rect(cell.x - half, cell.y - half, half * 2, half * 2);
        context.closePath();
        return;
    }
    if (cell.shape === 'triangle') {
        const radius = cell.radius * scale;
        const rotation = cell.coordinate[0] % 2 === 0 ? -Math.PI / 2 : Math.PI / 2;
        context.beginPath();
        for (let index = 0; index < 3; index += 1) {
            const angle = rotation + index * Math.PI * 2 / 3;
            const x = cell.x + Math.cos(angle) * radius;
            const y = cell.y + Math.sin(angle) * radius;
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
        position: game.topology.position(coordinate)
    })).filter((item) => item.position);
    const xs = positioned.map((item) => item.position[0]);
    const ys = positioned.map((item) => item.position[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padding = Math.max(32, Math.min(width, height) * 0.08);
    const scale = Math.min(
        (width - padding * 2) / Math.max(0.1, maxX - minX),
        (height - padding * 2) / Math.max(0.1, maxY - minY)
    );
    const usedWidth = (maxX - minX) * scale;
    const usedHeight = (maxY - minY) * scale;
    const offsetX = (width - usedWidth) / 2 - minX * scale;
    const offsetY = (height - usedHeight) / 2 - minY * scale;
    const radius = game.topology.topology === 'klein_quartic'
        ? Math.max(5, Math.min(12, scale * 0.075))
        : Math.max(4, Math.min(9, scale * 0.055));
    centers = positioned.map(({ coordinate, position }) => ({
        coordinate,
        key: game.topology.key(coordinate),
        x: offsetX + position[0] * scale,
        y: offsetY + position[1] * scale,
        radius,
        shape: game.topology.topology === 'klein_quartic' ? 'triangle' : 'hex'
    }));
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
            context.lineTo(target.x, target.y);
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
        traceCell(cell, 0.96);
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
        const candidate = Math.hypot(point.x - cell.x, point.y - cell.y);
        if (candidate < distance) {
            distance = candidate;
            nearest = cell;
        }
    }
    return nearest && distance <= nearest.radius ? nearest : null;
}

function playAt(coordinate) {
    if (elements.gameMode.value === 'online') {
        statusKey = 'onlineUnavailable';
        updateReadout();
        return { ok: false, error: text('onlineUnavailable') };
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
elements.newGame.addEventListener('click', () => newGame());
elements.gameMode.addEventListener('change', () => {
    elements.onlineControls.hidden = elements.gameMode.value !== 'online';
    statusKey = elements.gameMode.value === 'online' ? 'onlineUnavailable' : 'emptyPrompt';
    updateReadout();
    scheduleRobot();
});

for (const button of [document.getElementById('findMatchBtn'), document.getElementById('createRoomBtn'), document.getElementById('joinRoomBtn')]) {
    button.addEventListener('click', () => {
        elements.connectionStatus.textContent = text('onlineUnavailable');
        statusKey = 'onlineUnavailable';
        updateReadout();
    });
}

function sendChat() {
    const message = elements.chatInput.value.trim();
    if (!message) return;
    if (elements.chatMessages.querySelector('.chat-empty')) elements.chatMessages.replaceChildren();
    const row = document.createElement('div');
    row.className = 'chat-message';
    row.textContent = `${text('chatLocal')} ${message}`;
    elements.chatMessages.append(row);
    elements.chatInput.value = '';
}

elements.chatSend.addEventListener('click', sendChat);
elements.chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') sendChat();
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
window.hexApp = {
    get game() { return game; },
    canvas: elements.canvas,
    playAt,
    exportState() {
        return game.exportState();
    },
    importState(state) {
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
        elements.lattice.disabled = game.topology.isSpecial === true;
        elements.boundaryMode.textContent = elements.boundary.options[elements.boundary.selectedIndex].text;
        elements.boundaryInfo.textContent = text(`topologyInfo.${game.topology.topology}`);
        updateTargetText();
        updateReadout();
        renderHistory();
        drawBoard();
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
