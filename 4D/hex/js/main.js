import HexGame, { HEX_COLORS } from '../../../js/hex/HexGame.js';

const LANGUAGE_KEY = 'topological-boardgame:language';
const params = new URLSearchParams(window.location.search);

const I18N = {
    en: {
        eyebrow: 'Four-dimensional connection strategy',
        title: '4D Hex',
        description: 'Place stones on a 4D axis-neighbor graph and inspect it by slices or projection.',
        boardAria: 'Projected or sliced 4D Hex board',
        controls: 'Game Controls',
        home: 'Home',
        black: 'Black',
        white: 'White',
        moves: 'Moves',
        gameMode: 'Game Mode',
        local: 'Local',
        robot: 'Robot',
        boardSize: 'Board Size',
        topology: 'Topology',
        hypercube: 'Hypercube / R4',
        torus: '4D Torus / T4',
        viewMode: 'View',
        sliceView: 'z-w Slice',
        projectionView: '4D Projection',
        boardView: 'Board View',
        sliceZ: 'Visible z slice',
        sliceW: 'Visible w slice',
        rotateProjection: 'Rotate projection',
        zoom: 'Zoom',
        resetView: 'Reset View',
        newGame: 'New Game',
        targetHyperfaces: 'Target Hyperfaces',
        blackTarget: 'Black connects x-low to x-high',
        whiteTarget: 'White connects y-low to y-high',
        moveHistory: 'Move History',
        blackTurn: 'Black to play',
        whiteTurn: 'White to play',
        emptyPrompt: 'Choose an empty 4D site.',
        occupied: 'Choose an empty Hex site.',
        noStones: 'No stones placed',
        stoneSummary: '{count} stones on the board',
        historyEmpty: 'No moves yet',
        blackWin: 'Black connected the x-low and x-high hyperfaces.',
        whiteWin: 'White connected the y-low and y-high hyperfaces.',
        robotThinking: 'Robot is choosing an empty site.',
        topologyInfo: {
            open: 'R4 uses open hyperfaces and eight axis-neighbors at interior sites.',
            torus: 'T4 wraps all four axes. Both players connect explicit marked cut-hyperface zones.'
        }
    },
    zh: {
        eyebrow: '四維連線策略',
        title: '4D Hex',
        description: '在四維軸向相鄰圖上落子，並以切片或投影檢視棋盤。',
        boardAria: '投影或切片顯示的 4D Hex 棋盤',
        controls: '遊戲控制',
        home: '首頁',
        black: '黑方',
        white: '白方',
        moves: '步數',
        gameMode: '遊戲模式',
        local: '本機',
        robot: '機器人',
        boardSize: '棋盤大小',
        topology: '拓撲',
        hypercube: '超立方體／R4',
        torus: '四維環面／T4',
        viewMode: '視圖',
        sliceView: 'z-w 切片',
        projectionView: '四維投影',
        boardView: '棋盤視圖',
        sliceZ: '可見 z 切片',
        sliceW: '可見 w 切片',
        rotateProjection: '旋轉投影',
        zoom: '縮放',
        resetView: '重設視圖',
        newGame: '新遊戲',
        targetHyperfaces: '目標超平面',
        blackTarget: '黑方連接 x-low 與 x-high',
        whiteTarget: '白方連接 y-low 與 y-high',
        moveHistory: '落子記錄',
        blackTurn: '輪到黑方',
        whiteTurn: '輪到白方',
        emptyPrompt: '請選擇一個空的 4D 格點。',
        occupied: '請選擇一個空的 Hex 格點。',
        noStones: '尚未落子',
        stoneSummary: '棋盤上共有 {count} 顆棋子',
        historyEmpty: '尚無落子記錄',
        blackWin: '黑方已連接 x-low 與 x-high 超平面。',
        whiteWin: '白方已連接 y-low 與 y-high 超平面。',
        robotThinking: '機器人正在選擇空格。',
        topologyInfo: {
            open: 'R4 使用開放超平面；內部格點各有八個軸向鄰點。',
            torus: 'T4 會包裹全部四個座標軸；雙方連接明確標示的切面目標區。'
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
    size: document.getElementById('boardSizeSelect'),
    topology: document.getElementById('topologySelect'),
    viewMode: document.getElementById('viewModeSelect'),
    topologyInfo: document.getElementById('topologyInfo'),
    sliceControls: document.getElementById('sliceControls'),
    sliceZ: document.getElementById('sliceZ'),
    sliceW: document.getElementById('sliceW'),
    sliceZValue: document.getElementById('sliceZValue'),
    sliceWValue: document.getElementById('sliceWValue'),
    rotation: document.getElementById('projectionRotation'),
    zoom: document.getElementById('zoom'),
    resetView: document.getElementById('resetViewBtn'),
    newGame: document.getElementById('newGameBtn'),
    history: document.getElementById('moveHistoryList'),
    language: document.getElementById('languageButton'),
    home: document.getElementById('homeLink')
};

const context = elements.canvas.getContext('2d');
let language = normalizeLanguage(params.get('lang') || localStorage.getItem(LANGUAGE_KEY));
let game;
let size = 5;
let projectedSites = [];
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
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
        node.setAttribute('aria-label', text(node.dataset.i18nAria));
    });
    elements.language.textContent = language === 'zh' ? '中 / EN' : 'EN / 中';
    elements.home.href = `../../index.html?lang=${language}`;
    elements.topologyInfo.textContent = text(`topologyInfo.${elements.topology.value}`);
    updateReadout();
    renderHistory();
}

function newGame() {
    clearTimeout(robotTimer);
    size = Number(elements.size.value);
    game = new HexGame({ dimension: 4, size, topology: elements.topology.value });
    statusKey = 'emptyPrompt';
    elements.topologyMode.textContent = elements.topology.options[elements.topology.selectedIndex].text;
    elements.topologyInfo.textContent = text(`topologyInfo.${elements.topology.value}`);
    for (const input of [elements.sliceZ, elements.sliceW]) {
        input.max = String(size - 1);
        input.value = String(Math.floor(size / 2));
    }
    updateSliceLabels();
    updateReadout();
    renderHistory();
    drawBoard();
}

function updateSliceLabels() {
    elements.sliceZValue.textContent = elements.sliceZ.value;
    elements.sliceWValue.textContent = elements.sliceW.value;
    elements.sliceControls.hidden = elements.viewMode.value !== 'slice';
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

function targetEnds() {
    const wrapped = elements.topology.value === 'torus';
    return {
        x: wrapped ? Math.floor(size / 2) : size - 1,
        y: wrapped ? Math.floor(size / 2) : size - 1
    };
}

function drawSite(site, ends) {
    const color = game.getCell(site.coordinate);
    const blackTarget = site.coordinate[0] === 0 || site.coordinate[0] === ends.x;
    const whiteTarget = site.coordinate[1] === 0 || site.coordinate[1] === ends.y;
    const radius = color
        ? Math.max(5.5, Math.min(9, site.radius * 0.11))
        : Math.max(2.2, Math.min(4, site.radius * 0.035));
    context.beginPath();
    context.arc(site.x, site.y, radius, 0, Math.PI * 2);
    if (color === HEX_COLORS.BLACK) context.fillStyle = '#111820';
    else if (color === HEX_COLORS.WHITE) context.fillStyle = '#f5f6f1';
    else if (blackTarget && whiteTarget) context.fillStyle = '#7a8e78';
    else if (blackTarget) context.fillStyle = '#42c7df';
    else if (whiteTarget) context.fillStyle = '#e8b44c';
    else context.fillStyle = '#6f8491';
    context.fill();
    context.strokeStyle = color === HEX_COLORS.WHITE ? '#747d82' : 'rgba(231,240,245,0.72)';
    context.lineWidth = color ? 1.3 : 0.55;
    context.stroke();
}

function drawSlice(width, height) {
    const z = Number(elements.sliceZ.value);
    const w = Number(elements.sliceW.value);
    const padding = Math.max(38, Math.min(width, height) * 0.09);
    const spacing = Math.min((width - padding * 2) / Math.max(1, size - 1), (height - padding * 2) / Math.max(1, size - 1)) * Number(elements.zoom.value);
    const boardWidth = spacing * (size - 1);
    const boardHeight = spacing * (size - 1);
    const startX = (width - boardWidth) / 2;
    const startY = (height - boardHeight) / 2;
    const ends = targetEnds();

    context.fillStyle = 'rgba(66,199,223,0.08)';
    for (const xTarget of [0, ends.x]) {
        context.fillRect(startX + xTarget * spacing - spacing * 0.25, startY - spacing * 0.3, spacing * 0.5, boardHeight + spacing * 0.6);
    }
    context.fillStyle = 'rgba(232,180,76,0.08)';
    for (const yTarget of [0, ends.y]) {
        context.fillRect(startX - spacing * 0.3, startY + yTarget * spacing - spacing * 0.25, boardWidth + spacing * 0.6, spacing * 0.5);
    }

    projectedSites = [];
    context.strokeStyle = 'rgba(160,184,198,0.3)';
    context.lineWidth = 1;
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const px = startX + x * spacing;
            const py = startY + y * spacing;
            if (x < size - 1) {
                context.beginPath();
                context.moveTo(px, py);
                context.lineTo(px + spacing, py);
                context.stroke();
            }
            if (y < size - 1) {
                context.beginPath();
                context.moveTo(px, py);
                context.lineTo(px, py + spacing);
                context.stroke();
            }
            projectedSites.push({ x: px, y: py, depth: 0, radius: spacing, coordinate: [x, y, z, w] });
        }
    }
    for (const site of projectedSites) drawSite(site, ends);
}

function projectionPoint(coordinate, width, height) {
    const midpoint = (size - 1) / 2;
    const [rawX, rawY, rawZ, rawW] = coordinate.map((value) => value - midpoint);
    const angle = Number(elements.rotation.value) * Math.PI / 180;
    const x = rawX * Math.cos(angle) - rawY * Math.sin(angle);
    const y = rawX * Math.sin(angle) + rawY * Math.cos(angle);
    const scale = Math.min(width, height) * 0.48 / Math.max(1, size - 1) * Number(elements.zoom.value);
    return {
        x: width / 2 + (x + rawZ * 0.38 + rawW * 0.18) * scale,
        y: height / 2 + (y - rawZ * 0.26 + rawW * 0.42) * scale,
        depth: rawZ + rawW * 0.7,
        radius: scale,
        coordinate
    };
}

function drawProjection(width, height) {
    const coordinates = game.topology.coordinates();
    const projected = new Map(coordinates.map((coordinate) => [
        coordinate.join(','),
        projectionPoint(coordinate, width, height)
    ]));
    context.strokeStyle = 'rgba(160,184,198,0.12)';
    context.lineWidth = 0.55;
    for (const coordinate of coordinates) {
        const from = projected.get(coordinate.join(','));
        for (let axis = 0; axis < 4; axis += 1) {
            const next = [...coordinate];
            next[axis] += 1;
            if (next[axis] >= size) continue;
            const to = projected.get(next.join(','));
            context.beginPath();
            context.moveTo(from.x, from.y);
            context.lineTo(to.x, to.y);
            context.stroke();
        }
    }
    projectedSites = [...projected.values()].sort((a, b) => a.depth - b.depth);
    const ends = targetEnds();
    for (const site of projectedSites) drawSite(site, ends);
}

function drawBoard() {
    if (!game) return;
    const { width, height } = fitCanvas();
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#080d12';
    context.fillRect(0, 0, width, height);
    if (elements.viewMode.value === 'slice') drawSlice(width, height);
    else drawProjection(width, height);
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
    let best = elements.viewMode.value === 'slice' ? 24 : 13;
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
    const result = game.play(coordinate);
    if (!result.ok) statusKey = 'occupied';
    else statusKey = game.winner
        ? game.winner === HEX_COLORS.BLACK ? 'blackWin' : 'whiteWin'
        : 'emptyPrompt';
    updateReadout();
    renderHistory();
    drawBoard();
    if (result.ok) scheduleRobot();
    return result;
}

function scheduleRobot() {
    clearTimeout(robotTimer);
    if (elements.mode.value !== 'robot' || game.winner || game.currentColor !== HEX_COLORS.WHITE) return;
    statusKey = 'robotThinking';
    updateReadout();
    robotTimer = window.setTimeout(() => {
        const empty = game.topology.coordinates().filter((coordinate) => game.getCell(coordinate) === null);
        if (!empty.length) return;
        game.play(empty[Math.floor(Math.random() * empty.length)]);
        statusKey = game.winner ? 'whiteWin' : 'emptyPrompt';
        updateReadout();
        renderHistory();
        drawBoard();
    }, 320);
}

elements.canvas.addEventListener('click', (event) => {
    const site = nearestSite(event);
    if (site) playAt(site.coordinate);
});
for (const input of [elements.sliceZ, elements.sliceW, elements.rotation, elements.zoom]) {
    input.addEventListener('input', () => {
        updateSliceLabels();
        drawBoard();
    });
}
elements.viewMode.addEventListener('change', () => {
    updateSliceLabels();
    drawBoard();
});
elements.resetView.addEventListener('click', () => {
    elements.sliceZ.value = String(Math.floor(size / 2));
    elements.sliceW.value = String(Math.floor(size / 2));
    elements.rotation.value = '20';
    elements.zoom.value = '1';
    updateSliceLabels();
    drawBoard();
});
elements.size.addEventListener('change', newGame);
elements.topology.addEventListener('change', newGame);
elements.newGame.addEventListener('click', newGame);
elements.mode.addEventListener('change', scheduleRobot);
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
