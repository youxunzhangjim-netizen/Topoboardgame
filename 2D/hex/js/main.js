import HexGame, { HEX_COLORS } from '../../../js/hex/HexGame.js';

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
        newGame: 'New Game',
        targets: 'Target Sides',
        blackTarget: 'Black connects left to right',
        whiteTarget: 'White connects top to bottom',
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
            rp2: 'RP2 identifies opposite edges with reversals; both goals are explicit marked zones.'
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
        newGame: '新遊戲',
        targets: '目標邊',
        blackTarget: '黑方連接左邊與右邊',
        whiteTarget: '白方連接上邊與下邊',
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
            rp2: 'RP2 以反轉方式識別相對邊；雙方皆使用明確標示的目標區。'
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
    boundaryInfo: document.getElementById('boundaryInfo'),
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
    updateReadout();
    renderHistory();
}

function selectedSize() {
    if (elements.boardSize.value !== 'custom') return Number(elements.boardSize.value);
    return Math.max(3, Math.min(25, Number(elements.customSize.value) || 11));
}

function newGame(messageKey = 'emptyPrompt') {
    clearTimeout(robotTimer);
    size = selectedSize();
    topology = elements.boundary.value;
    game = new HexGame({ dimension: 2, size, topology });
    statusKey = messageKey;
    elements.boundaryMode.textContent = elements.boundary.options[elements.boundary.selectedIndex].text;
    elements.boundaryInfo.textContent = text(`topologyInfo.${topology}`);
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
                key: `${q},${r}`,
                x: offsetX + Math.sqrt(3) * radius * (q + r / 2),
                y: offsetY + 1.5 * radius * r,
                radius
            });
        }
    }
}

function drawStone(cell, color) {
    const stoneRadius = cell.radius * 0.72;
    const gradient = context.createRadialGradient(
        cell.x - stoneRadius * 0.3,
        cell.y - stoneRadius * 0.35,
        stoneRadius * 0.1,
        cell.x,
        cell.y,
        stoneRadius
    );
    if (color === HEX_COLORS.BLACK) {
        gradient.addColorStop(0, '#65717b');
        gradient.addColorStop(0.35, '#202830');
        gradient.addColorStop(1, '#050709');
    } else {
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.65, '#e8ece9');
        gradient.addColorStop(1, '#9aa3a6');
    }
    context.beginPath();
    context.arc(cell.x, cell.y, stoneRadius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = color === HEX_COLORS.BLACK ? '#030405' : '#687177';
    context.lineWidth = Math.max(1, cell.radius * 0.08);
    context.stroke();
}

function drawBoard() {
    if (!game) return;
    const { width, height } = fitCanvas();
    buildCenters(width, height);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#f6f7f5';
    context.fillRect(0, 0, width, height);

    for (const cell of centers) {
        const blackTarget = cell.q === 0 || cell.q === size - 1;
        const whiteTarget = cell.r === 0 || cell.r === size - 1;
        traceHex(context, cell.x, cell.y, cell.radius * 0.97);
        context.fillStyle = blackTarget && whiteTarget
            ? 'rgba(121, 170, 136, 0.22)'
            : blackTarget
                ? 'rgba(66, 199, 223, 0.18)'
                : whiteTarget
                    ? 'rgba(232, 180, 76, 0.18)'
                    : '#e5e9e5';
        context.fill();
        context.strokeStyle = '#69737a';
        context.lineWidth = Math.max(0.8, cell.radius * 0.055);
        context.stroke();

        if (blackTarget) {
            traceHex(context, cell.x, cell.y, cell.radius * 0.91);
            context.strokeStyle = 'rgba(24, 142, 169, 0.72)';
            context.lineWidth = Math.max(1.4, cell.radius * 0.13);
            context.stroke();
        }
        if (whiteTarget) {
            traceHex(context, cell.x, cell.y, cell.radius * 0.8);
            context.strokeStyle = 'rgba(185, 124, 13, 0.74)';
            context.lineWidth = Math.max(1.2, cell.radius * 0.1);
            context.stroke();
        }

        if (hoverKey === cell.key && !game.getCell([cell.q, cell.r]) && !game.winner) {
            traceHex(context, cell.x, cell.y, cell.radius * 0.7);
            context.fillStyle = game.currentColor === HEX_COLORS.BLACK
                ? 'rgba(20, 30, 38, 0.28)'
                : 'rgba(255, 255, 255, 0.72)';
            context.fill();
        }
    }

    for (const cell of centers) {
        const color = game.getCell([cell.q, cell.r]);
        if (color) drawStone(cell, color);
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
    const result = game.play(coordinate);
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

function scheduleRobot() {
    clearTimeout(robotTimer);
    if (elements.gameMode.value !== 'robot' || game.winner || game.currentColor !== HEX_COLORS.WHITE) return;
    statusKey = 'robotThinking';
    updateReadout();
    robotTimer = window.setTimeout(() => {
        const empty = game.topology.coordinates().filter((coordinate) => game.getCell(coordinate) === null);
        if (!empty.length) return;
        const coordinate = empty[Math.floor(Math.random() * empty.length)];
        game.play(coordinate);
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
    if (cell) playAt([cell.q, cell.r]);
});

elements.boardSize.addEventListener('change', () => {
    elements.customSize.hidden = elements.boardSize.value !== 'custom';
    if (!elements.customSize.hidden) elements.customSize.focus();
    newGame();
});
elements.customSize.addEventListener('change', () => newGame());
elements.boundary.addEventListener('change', () => newGame());
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
});
window.addEventListener('resize', drawBoard);

newGame();
applyLanguage();
window.hexApp = {
    get game() { return game; },
    playAt,
    newGame,
    setLanguage(nextLanguage) {
        language = normalizeLanguage(nextLanguage);
        localStorage.setItem(LANGUAGE_KEY, language);
        applyLanguage();
        drawBoard();
    }
};
