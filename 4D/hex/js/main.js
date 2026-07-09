import HexGame, { HEX_COLORS } from '../../../js/hex/HexGame.js';
import { createHexOnlineController } from '../../../js/hex/HexOnline.js';
import { buildOnlineMatchKey } from '../../../js/shared/OnlineMatchKey.js';

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
        switchLanguage: 'Switch language',
        black: 'Blue',
        white: 'Orange',
        moves: 'Moves',
        gameMode: 'Game Mode',
        local: 'Local',
        online: 'Online',
        disconnected: 'Disconnected',
        findMatch: 'Find Match',
        privateRoom: 'PRIVATE ROOM',
        createRoom: 'Create Room',
        or: 'OR',
        roomPlaceholder: 'Room code',
        joinRoom: 'Join Room',
        boardSize: 'Board Size',
        topology: 'Topology',
        hypercube: 'Hypercube / R4',
        torus: '4D Torus / T4',
        kleinQuarticProduct: 'Klein Quartic × I × I',
        viewMode: 'View',
        allSlicesView: 'All z/w Slices',
        sliceView: '2D z/w Slice',
        stackView: 'Interactive 3D x/y/z Slice',
        rotateX: 'Rotate X',
        rotateY: 'Rotate Y',
        rotateZ: 'Rotate Z',
        projectionView: '4D Projection',
        boardView: 'Board View',
        sliceZ: 'Visible z slice',
        sliceW: 'Visible w slice',
        rotateProjection: 'Rotate projection',
        zoom: 'Zoom',
        resetView: 'Reset View',
        newGame: 'New Game',
        targetHyperfaces: 'Target Hyperfaces',
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
        emptyPrompt: 'Choose an empty 4D site.',
        occupied: 'Choose an empty Hex site.',
        noStones: 'No stones placed',
        stoneSummary: '{count} stones on the board',
        historyEmpty: 'No moves yet',
        blackWin: 'Blue connected the x-low and x-high hyperfaces.',
        whiteWin: 'Orange connected the y-low and y-high hyperfaces.',
        connectOnline: 'Connect or join an Online room before placing.',
        waitingFor: 'Waiting for {color}.',
        onlineAs: 'Online as {color}',
        waitingOpponent: 'Waiting for opponent',
        syncedOnline: 'Online board synchronized.',
        you: 'You',
        opponent: 'Opponent',
        topologyInfo: {
            open: 'R4 uses open hyperfaces and eight axis-neighbors at interior sites.',
            torus: 'T4 wraps all four axes. Both players connect explicit marked cut-hyperface zones.',
            klein_quartic_product: 'The 56-triangle Klein quartic cell graph multiplied by two finite interval directions.',
        }
    },
    zh: {
        eyebrow: '四維連線策略',
        title: '4D 六貫棋',
        description: '在四維軸向相鄰圖上落子，並以切片或投影檢視棋盤。',
        boardAria: '投影或切片顯示的 4D 六貫棋棋盤',
        controls: '遊戲控制',
        home: '首頁',
        switchLanguage: '切換語言',
        black: '藍方',
        white: '橙方',
        moves: '步數',
        gameMode: '遊戲模式',
        local: '本機',
        online: '線上',
        disconnected: '未連線',
        findMatch: '尋找對手',
        privateRoom: '私人房間',
        createRoom: '建立房間',
        or: '或',
        roomPlaceholder: '房間代碼',
        joinRoom: '加入房間',
        boardSize: '棋盤大小',
        topology: '拓撲',
        hypercube: '超立方體／R4',
        torus: '四維環面／T4',
        kleinQuarticProduct: 'Klein 四次曲線 × I × I',
        viewMode: '視圖',
        allSlicesView: '全部 z/w 切片',
        sliceView: '2D z/w 切片',
        stackView: '互動 3D x/y/z 切片',
        rotateX: '繞 X 軸旋轉',
        rotateY: '繞 Y 軸旋轉',
        rotateZ: '繞 Z 軸旋轉',
        projectionView: '四維投影',
        boardView: '棋盤視圖',
        sliceZ: '可見 z 切片',
        sliceW: '可見 w 切片',
        rotateProjection: '旋轉投影',
        zoom: '縮放',
        resetView: '重設視圖',
        newGame: '新遊戲',
        targetHyperfaces: '目標超平面',
        targetZones: '目標區',
        blackTarget: '藍方連接 x-low 與 x-high',
        whiteTarget: '橙方連接 y-low 與 y-high',
        blackMarkedTarget: '黑方連接兩個青色標示區',
        whiteMarkedTarget: '白方連接兩個金色標示區',
        moveHistory: '落子記錄',
        onlineChat: '線上聊天',
        chatEmpty: '連上線上房間後即可聊天。',
        messagePlaceholder: '傳送訊息給對手',
        send: '傳送',
        blackTurn: '輪到黑方',
        whiteTurn: '輪到白方',
        emptyPrompt: '請選擇一個空的 4D 格點。',
        occupied: '請選擇一個空的六貫棋格點。',
        noStones: '尚未落子',
        stoneSummary: '棋盤上共有 {count} 顆棋子',
        historyEmpty: '尚無落子記錄',
        blackWin: '黑方已連接 x-low 與 x-high 超平面。',
        whiteWin: '白方已連接 y-low 與 y-high 超平面。',
        connectOnline: '請先連線或加入線上房間再落子。',
        waitingFor: '等待 {color} 行動。',
        onlineAs: '線上身份：{color}',
        waitingOpponent: '等待對手',
        syncedOnline: '線上棋盤已同步。',
        you: '你',
        opponent: '對手',
        topologyInfo: {
            open: 'R4 使用開放超平面；內部格點各有八個軸向鄰點。',
            torus: 'T4 會包裹全部四個座標軸；雙方連接明確標示的切面目標區。',
            klein_quartic_product: '把 56 三角形的 Klein 四次曲線胞腔圖乘上兩個有限區間方向。',
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
    viewMode: document.getElementById('viewModeSelect'),
    topologyInfo: document.getElementById('topologyInfo'),
    targetHeading: document.getElementById('targetHeading'),
    blackTargetText: document.getElementById('blackTargetText'),
    whiteTargetText: document.getElementById('whiteTargetText'),
    sliceControls: document.getElementById('sliceControls'),
    sliceZ: document.getElementById('sliceZ'),
    sliceW: document.getElementById('sliceW'),
    sliceZValue: document.getElementById('sliceZValue'),
    sliceWValue: document.getElementById('sliceWValue'),
    wSliceButtons: document.getElementById('wSliceButtons'),
    rotationX: document.getElementById('rotationX'),
    rotationY: document.getElementById('rotationY'),
    rotation: document.getElementById('projectionRotation'),
    zoom: document.getElementById('zoom'),
    resetView: document.getElementById('resetViewBtn'),
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
let size = 5;
let projectedSites = [];
let sliceTileRegions = [];
let statusKey = 'emptyPrompt';
let onlineController = null;
let renderDpr = 1;
let specialModelExtent = 1;
const activePointers = new Map();
let dragging = false;
let dragMoved = false;
let lastPointer = null;
let pinchStartDistance = 0;
let pinchStartZoom = 1;

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
    elements.targetHeading.textContent = text(marked ? 'targetZones' : 'targetHyperfaces');
}

function newGame() {
    size = Number(elements.size.value);
    game = new HexGame({ dimension: 4, size, topology: elements.topology.value });
    statusKey = 'emptyPrompt';
    elements.topologyMode.textContent = elements.topology.options[elements.topology.selectedIndex].text;
    elements.topologyInfo.textContent = text(`topologyInfo.${elements.topology.value}`);
    updateTargetText();
    for (const input of [elements.sliceZ, elements.sliceW]) {
        input.max = String(size - 1);
        input.value = String(Math.floor(size / 2));
    }
    const sliceOption = elements.viewMode.querySelector('option[value="slice"]');
    if (sliceOption) sliceOption.disabled = game.topology.isSpecial === true;
    if (game.topology.isSpecial) elements.viewMode.value = 'projection';
    updateSliceLabels();
    updateReadout();
    renderHistory();
    drawBoard();
}

function updateSliceLabels() {
    elements.sliceZValue.textContent = elements.sliceZ.value;
    elements.sliceWValue.textContent = elements.sliceW.value;
    elements.sliceZ.closest('label').hidden = elements.viewMode.value !== 'slice';
    elements.sliceW.closest('label').hidden = elements.viewMode.value === 'all_slices';
    elements.sliceControls.hidden = elements.viewMode.value === 'all_slices';
    renderWSliceButtons();
}

function renderWSliceButtons() {
    if (!elements.wSliceButtons) return;
    elements.wSliceButtons.replaceChildren(...Array.from({ length: size }, (_, w) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `w=${w}`;
        button.setAttribute('aria-pressed', String(Number(elements.sliceW.value) === w));
        button.addEventListener('click', () => {
            elements.sliceW.value = String(w);
            elements.viewMode.value = 'stack';
            updateSliceLabels();
            drawBoard();
        });
        return button;
    }));
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
    const blackTarget = game.topology.isSpecial
        ? game.topology.goalZones.black.start(site.coordinate) || game.topology.goalZones.black.end(site.coordinate)
        : site.coordinate[0] === 0 || site.coordinate[0] === ends.x;
    const whiteTarget = game.topology.isSpecial
        ? game.topology.goalZones.white.start(site.coordinate) || game.topology.goalZones.white.end(site.coordinate)
        : site.coordinate[1] === 0 || site.coordinate[1] === ends.y;
    const radius = color
        ? Math.max(5.5, Math.min(9, site.radius * 0.11))
        : Math.max(2.2, Math.min(4, site.radius * 0.035));
    context.beginPath();
    context.arc(site.x, site.y, radius, 0, Math.PI * 2);
    if (color === HEX_COLORS.BLACK) context.fillStyle = '#24a9c2';
    else if (color === HEX_COLORS.WHITE) context.fillStyle = '#e3a42f';
    else if (blackTarget && whiteTarget) context.fillStyle = '#7a8e78';
    else if (blackTarget) context.fillStyle = '#42c7df';
    else if (whiteTarget) context.fillStyle = '#e8b44c';
    else context.fillStyle = '#6f8491';
    context.fill();
    context.strokeStyle = color === HEX_COLORS.BLACK
        ? '#8ce7f4'
        : color === HEX_COLORS.WHITE
            ? '#ffe0a3'
            : 'rgba(231,240,245,0.72)';
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

function drawAllSlices(width, height) {
    const sliceCount = size * size;
    const columns = Math.max(1, Math.ceil(Math.sqrt(sliceCount)));
    const rows = Math.ceil(sliceCount / columns);
    const outerPadding = Math.max(12, Math.min(width, height) * 0.025);
    const gap = Math.max(8, Math.min(width, height) * 0.012);
    const tileWidth = (width - outerPadding * 2 - gap * (columns - 1)) / columns;
    const tileHeight = (height - outerPadding * 2 - gap * (rows - 1)) / rows;
    const titleHeight = Math.max(13, Math.min(22, tileHeight * 0.13));
    const ends = targetEnds();
    projectedSites = [];
    sliceTileRegions = [];
    context.font = `${Math.max(9, Math.min(13, titleHeight * 0.65))}px system-ui, sans-serif`;
    context.textAlign = 'left';
    context.textBaseline = 'middle';

    let tileIndex = 0;
    for (let w = 0; w < size; w += 1) {
        for (let z = 0; z < size; z += 1) {
            const column = tileIndex % columns;
            const row = Math.floor(tileIndex / columns);
            const left = outerPadding + column * (tileWidth + gap);
            const top = outerPadding + row * (tileHeight + gap);
            const boardTop = top + titleHeight;
            const boardHeight = Math.max(1, tileHeight - titleHeight);
            const padding = Math.max(5, Math.min(tileWidth, boardHeight) * 0.09);
            const spacing = Math.min(
                (tileWidth - padding * 2) / Math.max(1, size - 1),
                (boardHeight - padding * 2) / Math.max(1, size - 1)
            );
            const boardWidth = spacing * (size - 1);
            const drawnHeight = spacing * (size - 1);
            const startX = left + (tileWidth - boardWidth) / 2;
            const startY = boardTop + (boardHeight - drawnHeight) / 2;

            context.fillStyle = 'rgba(13, 24, 34, 0.96)';
            context.fillRect(left, top, tileWidth, tileHeight);
            context.strokeStyle = 'rgba(109, 145, 164, 0.34)';
            context.lineWidth = 0.8;
            context.strokeRect(left + 0.5, top + 0.5, tileWidth - 1, tileHeight - 1);
            context.fillStyle = '#b9cad5';
            context.fillText(`z=${z}, w=${w}`, left + 6, top + titleHeight * 0.5);
            sliceTileRegions.push({ left, top, width: tileWidth, height: titleHeight, w });

            context.strokeStyle = 'rgba(160,184,198,0.34)';
            context.lineWidth = 0.7;
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
                    projectedSites.push({
                        x: px,
                        y: py,
                        depth: tileIndex,
                        radius: Math.max(8, spacing),
                        coordinate: [x, y, z, w]
                    });
                }
            }
            tileIndex += 1;
        }
    }
    for (const site of projectedSites) drawSite(site, ends);
}

function stackPoint(coordinate, width, height) {
    const [x, y, z, w] = coordinate;
    const midpoint = (size - 1) / 2;
    let px = x - midpoint;
    let py = y - midpoint;
    let pz = z - midpoint;
    const rotateX = Number(elements.rotationX.value) * Math.PI / 180;
    const rotateY = Number(elements.rotationY.value) * Math.PI / 180;
    const rotateZ = Number(elements.rotation.value) * Math.PI / 180;
    [py, pz] = [
        py * Math.cos(rotateX) - pz * Math.sin(rotateX),
        py * Math.sin(rotateX) + pz * Math.cos(rotateX)
    ];
    [px, pz] = [
        px * Math.cos(rotateY) + pz * Math.sin(rotateY),
        -px * Math.sin(rotateY) + pz * Math.cos(rotateY)
    ];
    [px, py] = [
        px * Math.cos(rotateZ) - py * Math.sin(rotateZ),
        px * Math.sin(rotateZ) + py * Math.cos(rotateZ)
    ];
    const zoom = Number(elements.zoom.value);
    const spacing = Math.min(width, height) * 0.63 / Math.max(1, size - 1) * zoom;
    const perspective = Math.max(0.72, 1 + pz * 0.035);
    return {
        x: width / 2 + px * spacing * perspective,
        y: height / 2 + py * spacing * perspective,
        depth: pz,
        radius: spacing * perspective,
        coordinate
    };
}

function drawStack(width, height) {
    const w = Number(elements.sliceW.value);
    const ends = targetEnds();
    projectedSites = [];
    const drawnEdges = new Set();
    context.strokeStyle = 'rgba(160,184,198,0.24)';
    context.lineWidth = 0.85;

    for (let z = 0; z < size; z += 1) {
        context.fillStyle = z % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(66,199,223,0.025)';
        const layerCorners = [[0, 0, z, w], [size - 1, 0, z, w], [size - 1, size - 1, z, w], [0, size - 1, z, w]]
            .map((coord) => stackPoint(coord, width, height));
        context.beginPath();
        layerCorners.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
        context.closePath();
        context.fill();
        context.stroke();
    }

    for (let z = 0; z < size; z += 1) {
        for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < size; x += 1) {
                const coordinate = [x, y, z, w];
                const from = stackPoint(coordinate, width, height);
                projectedSites.push(from);
                for (const axis of [0, 1, 2]) {
                    const next = [...coordinate];
                    next[axis] += 1;
                    if (next[axis] >= size) continue;
                    const edgeKey = [coordinate.join(','), next.join(',')].sort().join('|');
                    if (drawnEdges.has(edgeKey)) continue;
                    drawnEdges.add(edgeKey);
                    const to = stackPoint(next, width, height);
                    context.beginPath();
                    context.moveTo(from.x, from.y);
                    context.lineTo(to.x, to.y);
                    context.stroke();
                }
            }
        }
    }
    projectedSites.sort((a, b) => a.depth - b.depth);
    for (const site of projectedSites) drawSite(site, ends);
}

function projectionPoint(coordinate, width, height) {
    const midpoint = (size - 1) / 2;
    const [rawX = 0, rawY = 0, rawZ = 0, rawW = 0] = game.topology.isSpecial
        ? game.topology.position(coordinate)
        : coordinate.map((value) => value - midpoint);
    const angle = Number(elements.rotation.value) * Math.PI / 180;
    const x = rawX * Math.cos(angle) - rawY * Math.sin(angle);
    const y = rawX * Math.sin(angle) + rawY * Math.cos(angle);
    const scale = Math.min(width, height) * 0.48 /
        Math.max(1, game.topology.isSpecial ? specialModelExtent : size - 1) *
        Number(elements.zoom.value);
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
    if (game.topology.isSpecial) {
        const positions = coordinates.map((coordinate) => game.topology.position(coordinate));
        specialModelExtent = Math.max(1, ...positions.flatMap((position) => position.map(Math.abs)));
    }
    const projected = new Map(coordinates.map((coordinate) => [
        coordinate.join(','),
        projectionPoint(coordinate, width, height)
    ]));
    context.strokeStyle = 'rgba(160,184,198,0.12)';
    context.lineWidth = 0.55;
    const coordinateKeys = new Set(projected.keys());
    const drawnEdges = new Set();
    for (const coordinate of coordinates) {
        const fromKey = coordinate.join(',');
        const from = projected.get(fromKey);
        const neighbors = game.topology.isSpecial
            ? game.topology.neighbors(coordinate)
            : Array.from({ length: 4 }, (_, axis) => {
                const next = [...coordinate];
                next[axis] += 1;
                return next;
            });
        for (const next of neighbors) {
            const nextKey = next.join(',');
            if (!coordinateKeys.has(nextKey)) continue;
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
    const ends = targetEnds();
    for (const site of projectedSites) drawSite(site, ends);
}

function drawBoard() {
    if (!game) return;
    const { width, height } = fitCanvas();
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#080d12';
    context.fillRect(0, 0, width, height);
    if (elements.viewMode.value === 'all_slices' && !game.topology.isSpecial) drawAllSlices(width, height);
    else if (elements.viewMode.value === 'slice' && !game.topology.isSpecial) drawSlice(width, height);
    else if (elements.viewMode.value === 'stack' && !game.topology.isSpecial) drawStack(width, height);
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
    let best = elements.viewMode.value === 'all_slices' ? 10 : elements.viewMode.value === 'slice' ? 24 : 13;
    for (const site of [...projectedSites].reverse()) {
        const distance = Math.hypot(point.x - site.x, point.y - site.y);
        if (distance < best) {
            best = distance;
            nearest = site;
        }
    }
    return nearest;
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
    const result = game.play(coordinate);
    if (!result.ok) statusKey = 'occupied';
    else statusKey = game.winner
        ? game.winner === HEX_COLORS.BLACK ? 'blackWin' : 'whiteWin'
        : 'emptyPrompt';
    updateReadout();
    renderHistory();
    drawBoard();
    if (result.ok) onlineController?.broadcastState();
    return result;
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
    if (Math.hypot(dx, dy) > 2) dragMoved = true;
    elements.rotationY.value = String(Math.max(-180, Math.min(180, Number(elements.rotationY.value) + dx * 0.18)));
    elements.rotationX.value = String(Math.max(-90, Math.min(90, Number(elements.rotationX.value) + dy * 0.18)));
    lastPointer = { x: event.clientX, y: event.clientY };
    drawBoard();
});
elements.canvas.addEventListener('pointerup', (event) => {
    event.preventDefault();
    const wasTap = !dragMoved && activePointers.size === 1;
    const point = wasTap ? canvasPoint(event) : null;
    const tile = point && elements.viewMode.value === 'all_slices'
        ? sliceTileRegions.find((region) =>
            point.x >= region.left && point.x <= region.left + region.width &&
            point.y >= region.top && point.y <= region.top + region.height)
        : null;
    const site = wasTap && !tile ? nearestSite(event) : null;
    activePointers.delete(event.pointerId);
    resetPointerGesture(event);
    if (tile) {
        elements.sliceW.value = String(tile.w);
        elements.viewMode.value = 'stack';
        updateSliceLabels();
        drawBoard();
    } else if (site) {
        playAt(site.coordinate);
    }
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
for (const input of [elements.sliceZ, elements.sliceW, elements.rotationX, elements.rotationY, elements.rotation, elements.zoom]) {
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
    elements.rotationX.value = '-26';
    elements.rotationY.value = '32';
    elements.rotation.value = '0';
    elements.zoom.value = '1';
    updateSliceLabels();
    drawBoard();
});
elements.size.addEventListener('change', newGame);
elements.topology.addEventListener('change', newGame);
elements.newGame.addEventListener('click', newGame);
elements.mode.addEventListener('change', () => {
    statusKey = 'emptyPrompt';
    updateReadout();
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
    elements.topologyMode.textContent = elements.topology.options[elements.topology.selectedIndex].text;
    elements.topologyInfo.textContent = text(`topologyInfo.${game.topology.topology}`);
    const sliceOption = elements.viewMode.querySelector('option[value="slice"]');
    if (sliceOption) sliceOption.disabled = game.topology.isSpecial === true;
    if (game.topology.isSpecial) elements.viewMode.value = 'projection';
    if (messageKey) statusKey = messageKey;
    updateTargetText();
    updateSliceLabels();
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
    getVisibleSites() { return projectedSites.map((site) => ({ ...site, coordinate: [...site.coordinate] })); },
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
        return `hex-4d-${elements.topology.value}-${size}`;
    },
    onlineMatchKey() {
        return buildOnlineMatchKey({
            gameFamily: 'hex',
            dimension: 4,
            boardSpace: elements.topology.value,
            topology: elements.topology.value,
            lattice: 'hypercubic',
            boundary: elements.topology.value,
            size,
            ruleset: 'hex-connection',
            rulesetVersion: 1
        });
    },
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
