import { ReversiGame, normalizeReversiSize, normalizeReversiTopology } from '../../../js/reversi/ReversiGame.js';
import { FirebaseStateNetworkManager } from '../../../js/FirebaseStateNetworkManager.js';
import { installGameUILocalizer } from '../../../js/shared/GameUILocalizer.js';
import { kagomeBounds, kagomePoint } from '../../../js/shared/KagomeLattice.js';
import { ReversiRobotController } from './robot/ReversiRobot.js';

const BOARD_THEMES = [
    { light: '#f1f5f9', dark: '#334155', line: 'rgba(15, 23, 42, 0.42)', polar: '#334155' },
    { light: '#e9d8d0', dark: '#5b4b43', line: 'rgba(44, 32, 27, 0.5)', polar: '#5b4b43' },
    { light: '#dde7e3', dark: '#35524a', line: 'rgba(5, 12, 14, 0.58)', polar: '#35524a' },
    { light: '#d9e2ec', dark: '#1e3a8a', line: 'rgba(10, 20, 54, 0.48)', polar: '#1e3a8a' }
];

class Reversi2DApp {
    constructor() {
        this.canvas = document.getElementById('reversiBoard');
        this.ctx = this.canvas.getContext('2d');
        this.boardPanel = this.canvas.closest('.board-panel');
        this.sizeSelect = document.getElementById('boardSizeSelect');
        this.customSizeInput = document.getElementById('customBoardSizeInput');
        this.boundarySelect = document.getElementById('boundarySelect');
        this.latticeSelect = document.getElementById('latticeSelect');
        this.timeEvolutionSelect = document.getElementById('timeEvolutionSelect');
        this.timeLifetimeInput = document.getElementById('timeLifetimeInput');
        this.noiseModeSelect = document.getElementById('noiseModeSelect');
        this.noiseRateInput = document.getElementById('noiseRateInput');
        this.noisePeriodInput = document.getElementById('noisePeriodInput');
        this.statusEl = document.getElementById('gameStatus');
        this.summaryEl = document.getElementById('moveSummary');
        this.turnEl = document.getElementById('playerTurn');
        this.boundaryEl = document.getElementById('boundaryMode');
        this.boundaryInfoEl = document.getElementById('boundaryInfo');
        this.blackScoreEl = document.getElementById('blackScore');
        this.whiteScoreEl = document.getElementById('whiteScore');
        this.passBtn = document.getElementById('passBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.historyEl = document.getElementById('moveHistoryList');
        this.gameModeSelect = document.getElementById('gameModeSelect');
        this.onlineControls = document.getElementById('onlineControls');
        this.onlineColorEl = document.getElementById('onlineColorStatus');
        this.roomIdInput = document.getElementById('roomIdInput');
        this.shareLinkInput = document.getElementById('shareLinkInput');
        this.copyLinkBtn = document.getElementById('copyLinkBtn');
        this.chatMessagesEl = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.chatSendBtn = document.getElementById('chatSendBtn');
        this.colorButtons = [...document.querySelectorAll('.color-pair')];
        this.hoverCoord = null;
        this.lastRect = null;
        this.boardZoom = 1;
        this.boardTheme = Number(localStorage.getItem('topoboardgame.2dreversi.boardTheme') || 2);
        this.zoomPointers = new Map();
        this.pinchStart = null;
        this.suppressClickUntil = 0;
        this.myColor = null;
        this.chatMessages = [];
        this.pieceAges = {};
        this.noiseTick = 0;

        this.applyUrlSettings();
        this.logic = this.createLogic();
        this.network = new FirebaseStateNetworkManager(this, { gameKey: this.onlineGameKey(), matchKey: this.onlineMatchKey() });
        this.robot = new ReversiRobotController(this);
        this.bindEvents();
        this.resize();
        this.updateUI();
        this.tryJoinSharedRoomFromUrl();
    }

    applyUrlSettings() {
        const params = new URLSearchParams(window.location.search);
        const mode = normalizeReversiTopology(params.get('mode') || params.get('boundary') || 'open2d');
        this.boundarySelect.value = ['open2d', 'cylinder', 'pbc', 'klein', 'random'].includes(mode) ? mode : 'open2d';
        const lattice = String(params.get('lattice') || '').toLowerCase();
        if (lattice === 'honeycomb' || lattice === 'kagome') this.latticeSelect.value = lattice;
        const size = params.get('size');
        if (size !== null && size.trim() !== '' && Number.isFinite(Number(size))) this.setSizeSelection(size);
    }

    setSizeSelection(value) {
        const size = normalizeReversiSize(value, { fallback: 8, max: 30 });
        const option = [...this.sizeSelect.options].find((item) => item.value === String(size));
        this.sizeSelect.value = option ? String(size) : 'custom';
        this.customSizeInput.value = String(size);
        this.updateCustomSizeVisibility();
    }

    boardSize() {
        const source = this.sizeSelect.value === 'custom' ? this.customSizeInput.value : this.sizeSelect.value;
        return normalizeReversiSize(source, { fallback: 8, max: 30 });
    }

    createLogic() {
        return new ReversiGame({
            topology: this.boundarySelect.value,
            lattice: this.latticeSelect.value,
            size: this.boardSize(),
            maxSize: 30
        });
    }

    dynamicControls() {
        return [];
    }

    dynamicsSettings() {
        return { timeEvolution: 'off', lifetime: 60, noiseMode: 'off', noiseRate: 0, noisePeriod: 1 };
    }

    setDynamicsSettings() {
        // Ordinary 2D/4D modes do not expose +1D time/noise settings.
    }

    syncPieceAges() {
        const next = {};
        for (const coord of this.logic.topology.allCoords()) {
            const stone = this.logic.get(coord);
            if (!stone) continue;
            const key = this.logic.key(coord);
            next[key] = Math.max(1, Number(this.pieceAges?.[key]) || 1);
        }
        this.pieceAges = next;
    }

    applyTimeEvolutionAndNoise() {
        const settings = this.dynamicsSettings();
        this.syncPieceAges();
        if (settings.timeEvolution !== 'off') {
            for (const key of Object.keys(this.pieceAges)) this.pieceAges[key] = Number(this.pieceAges[key] || 0) + 1;
            if (settings.timeEvolution === 'decay') {
                for (const coord of this.logic.topology.allCoords()) {
                    const stone = this.logic.get(coord);
                    if (!stone) continue;
                    const key = this.logic.key(coord);
                    if ((this.pieceAges[key] || 1) > settings.lifetime) this.logic.delete(coord);
                }
            }
        }
        if (settings.noiseMode !== 'off' && settings.noiseRate > 0) {
            this.noiseTick += 1;
            if (this.noiseTick % settings.noisePeriod === 0) {
                for (const coord of this.logic.topology.allCoords()) {
                    const stone = this.logic.get(coord);
                    if (settings.noiseMode === 'random-death' && stone && Math.random() < settings.noiseRate) {
                        this.logic.delete(coord);
                    } else if (settings.noiseMode === 'random-birth' && !stone && Math.random() < settings.noiseRate * 0.04) {
                        this.logic.set(coord, { color: this.logic.currentPlayer });
                    }
                }
            }
        }
        this.syncPieceAges();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('wheel', (event) => this.handleBoardWheel(event), { passive: false });
        this.canvas.addEventListener('pointerdown', (event) => this.handleBoardPointerDown(event));
        this.canvas.addEventListener('pointermove', (event) => this.handlePointerMove(event));
        this.canvas.addEventListener('pointerup', (event) => this.handleBoardPointerEnd(event));
        this.canvas.addEventListener('pointercancel', (event) => this.handleBoardPointerEnd(event));
        this.canvas.addEventListener('pointerleave', (event) => {
            this.handleBoardPointerEnd(event);
            this.hoverCoord = null;
            this.render();
        });
        this.canvas.addEventListener('click', (event) => this.handleBoardClick(event));
        this.sizeSelect.addEventListener('change', () => {
            this.updateCustomSizeVisibility();
            this.resetGame();
        });
        this.customSizeInput.addEventListener('change', () => {
            this.setSizeSelection(this.customSizeInput.value);
            this.resetGame();
        });
        this.boundarySelect.addEventListener('change', () => this.resetGame());
        this.latticeSelect.addEventListener('change', () => this.resetGame());
        this.dynamicControls().forEach((control) => control.addEventListener('change', () => this.resetGame()));
        this.passBtn.addEventListener('click', () => this.passTurn());
        this.newGameBtn.addEventListener('click', () => this.resetGame({ broadcast: true }));
        this.gameModeSelect?.addEventListener('change', () => {
            this.updateOnlineControls();
            this.robot?.updatePanelState();
            this.robot?.scheduleIfNeeded();
            this.updateUI();
        });
        document.getElementById('createRoomBtn')?.addEventListener('click', () => this.network.createRoom());
        document.getElementById('findMatchBtn')?.addEventListener('click', () => this.network.findMatch());
        document.getElementById('joinRoomBtn')?.addEventListener('click', () => this.network.joinRoom(this.roomIdInput.value));
        this.copyLinkBtn?.addEventListener('click', async () => {
            if (!this.shareLinkInput?.value) return;
            await navigator.clipboard?.writeText(this.shareLinkInput.value);
            this.copyLinkBtn.textContent = 'Copied';
            window.setTimeout(() => { this.copyLinkBtn.textContent = 'Copy'; }, 1000);
        });
        this.chatSendBtn?.addEventListener('click', () => this.sendChatMessage());
        this.chatInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' || event.shiftKey) return;
            event.preventDefault();
            this.sendChatMessage();
        });
        this.colorButtons.forEach((button) => {
            button.addEventListener('click', () => this.setBoardTheme(Number(button.dataset.theme || 0)));
        });
        this.syncThemeButtons();
        this.robot?.attach();
    }

    themeColors() {
        return BOARD_THEMES[this.boardTheme] || BOARD_THEMES[2];
    }

    setBoardTheme(index) {
        this.boardTheme = Math.max(0, Math.min(BOARD_THEMES.length - 1, Number(index) || 0));
        localStorage.setItem('topoboardgame.2dreversi.boardTheme', String(this.boardTheme));
        this.syncThemeButtons();
        this.render();
    }

    syncThemeButtons() {
        this.colorButtons.forEach((button) => {
            const active = Number(button.dataset.theme || 0) === this.boardTheme;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    updateCustomSizeVisibility() {
        this.customSizeInput.hidden = this.sizeSelect.value !== 'custom';
    }

    resetGame({ broadcast = false } = {}) {
        this.logic = this.createLogic();
        this.pieceAges = {};
        this.noiseTick = 0;
        this.setStatus('New Reversi game started.');
        this.robot?.clearAnalysis();
        this.updateUI();
        if (broadcast) this.broadcastState();
        this.robot?.scheduleIfNeeded();
    }

    resize() {
        const panelRect = this.boardPanel?.getBoundingClientRect?.() || this.canvas.parentElement?.getBoundingClientRect?.() || { width: 720, height: 720 };
        const panelPadding = 24;
        const baseSize = Math.max(320, Math.floor(Math.min(
            Math.max(320, (panelRect.width || 720) - panelPadding),
            Math.max(320, (panelRect.height || panelRect.width || 720) - panelPadding)
        )));
        const size = Math.max(220, Math.floor(baseSize * this.boardZoom));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.floor(size * dpr);
        this.canvas.height = Math.floor(size * dpr);
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.render();
    }

    handlePointerMove(event) {
        this.handleBoardPointerMove(event);
        this.hoverCoord = this.coordFromEvent(event);
        this.render();
    }

    handleBoardClick(event) {
        if (performance.now() < this.suppressClickUntil) return;
        const coord = this.coordFromEvent(event);
        if (!coord) return;
        if (this.robot?.shouldBlockHumanInput(this.logic.currentPlayer)) {
            this.setStatus(this.robot.thinking ? 'Robot is thinking.' : "It is the local robot's turn.");
            return;
        }
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.capitalize(this.logic.currentPlayer)}.`);
            return;
        }
        const actor = this.logic.currentPlayer;
        const result = this.logic.play(coord);
        if (!result.ok) {
            this.setStatus(result.reason === 'illegal' ? 'That square does not bracket any opponent stones.' : 'Move unavailable.');
            this.updateUI();
            return;
        }
        this.afterLocalAction(`${this.capitalize(actor)} flipped ${result.flipped} ${result.flipped === 1 ? 'stone' : 'stones'}.`);
    }

    handleBoardWheel(event) {
        event.preventDefault();
        const factor = event.deltaY < 0 ? 1.1 : 0.9;
        this.boardZoom = Math.max(0.65, Math.min(3.5, this.boardZoom * factor));
        this.resize();
    }

    handleBoardPointerDown(event) {
        this.zoomPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.zoomPointers.size >= 2) {
            const [a, b] = [...this.zoomPointers.values()];
            this.pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.boardZoom };
            this.canvas.setPointerCapture?.(event.pointerId);
        }
    }

    handleBoardPointerMove(event) {
        if (!this.zoomPointers.has(event.pointerId)) return;
        this.zoomPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.zoomPointers.size < 2 || !this.pinchStart) return;
        const [a, b] = [...this.zoomPointers.values()];
        const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        this.boardZoom = Math.max(0.65, Math.min(3.5, this.pinchStart.zoom * distance / Math.max(1, this.pinchStart.distance)));
        this.suppressClickUntil = performance.now() + 220;
        this.resize();
    }

    handleBoardPointerEnd(event) {
        this.zoomPointers.delete(event.pointerId);
        if (this.zoomPointers.size < 2) this.pinchStart = null;
    }

    passTurn() {
        if (this.robot?.shouldBlockHumanInput(this.logic.currentPlayer)) {
            this.setStatus(this.robot.thinking ? 'Robot is thinking.' : "It is the local robot's turn.");
            return;
        }
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.capitalize(this.logic.currentPlayer)}.`);
            return;
        }
        const result = this.logic.pass();
        if (!result.ok) {
            this.setStatus(result.reason === 'legal-moves' ? 'You can only pass when no legal move exists.' : 'Pass unavailable.');
            this.updateUI();
            return;
        }
        this.afterLocalAction('Turn passed.');
    }

    afterLocalAction(message) {
        this.applyTimeEvolutionAndNoise();
        this.setStatus(this.logic.gameOver ? this.resultText() : message);
        this.updateUI();
        this.broadcastState();
        this.robot?.afterLocalAction();
    }

    coordFromEvent(event) {
        if (!this.lastRect) return null;
        const bounds = this.canvas.getBoundingClientRect();
        const x = (event.clientX - bounds.left) * (this.canvas.clientWidth / bounds.width);
        const y = (event.clientY - bounds.top) * (this.canvas.clientHeight / bounds.height);
        if (this.logic.topology.lattice === 'honeycomb' || this.logic.topology.lattice === 'kagome') {
            let nearest = null;
            let nearestDistance = Infinity;
            for (const coord of this.logic.topology.allCoords()) {
                const center = this.graphCenter(coord, this.lastRect);
                const distance = Math.hypot(center.x - x, center.y - y);
                if (distance < nearestDistance) {
                    nearest = coord;
                    nearestDistance = distance;
                }
            }
            const threshold = this.logic.topology.lattice === 'kagome' ? this.lastRect.step * 0.42 : this.lastRect.radius;
            return nearestDistance <= threshold ? nearest : null;
        }
        if (this.logic.topology.topology === 'polar') {
            let nearest = null;
            let nearestDistance = Infinity;
            for (const coord of this.logic.topology.allCoords()) {
                const center = this.polarCenter(coord, this.lastRect);
                const distance = Math.hypot(center.x - x, center.y - y);
                if (distance < nearestDistance) {
                    nearest = coord;
                    nearestDistance = distance;
                }
            }
            return nearestDistance <= Math.max(12, this.lastRect.step * 0.42) ? nearest : null;
        }
        const col = Math.floor((x - this.lastRect.left) / this.lastRect.step);
        const row = Math.floor((y - this.lastRect.top) / this.lastRect.step);
        if (col < 0 || row < 0 || col >= this.logic.topology.width || row >= this.logic.topology.height) return null;
        return [col, row];
    }

    boardRect() {
        const width = this.canvas.clientWidth || 720;
        const height = this.canvas.clientHeight || width;
        const margin = Math.max(18, Math.min(width, height) * 0.045);
        const usable = Math.min(width, height) - margin * 2;
        if (this.logic.topology.topology === 'polar') {
            const radius = usable / 2;
            return {
                centerX: width / 2,
                centerY: height / 2,
                radius,
                step: radius / Math.max(1, this.logic.topology.height - 1),
                left: width / 2 - radius,
                top: height / 2 - radius,
                right: width / 2 + radius,
                bottom: height / 2 + radius
            };
        }
        if (this.logic.topology.lattice === 'honeycomb') {
            const n = this.logic.topology.width;
            const rawWidth = Math.sqrt(3) * (n + (n > 1 ? 0.5 : 0));
            const rawHeight = 1.5 * (n - 1) + 2;
            const radius = usable / Math.max(rawWidth, rawHeight);
            const boardWidth = rawWidth * radius;
            const boardHeight = rawHeight * radius;
            return {
                left: (width - boardWidth) / 2,
                top: (height - boardHeight) / 2,
                right: (width + boardWidth) / 2,
                bottom: (height + boardHeight) / 2,
                radius,
                step: radius * 2
            };
        }
        if (this.logic.topology.lattice === 'kagome') {
            const bounds = kagomeBounds(this.logic.topology.width, this.logic.topology.height);
            const rawWidth = Math.max(1, bounds.maxX - bounds.minX);
            const rawHeight = Math.max(1, bounds.maxY - bounds.minY);
            const step = usable / Math.max(rawWidth, rawHeight);
            const spanX = rawWidth * step;
            const spanY = rawHeight * step;
            return {
                left: (width - spanX) / 2 - bounds.minX * step,
                top: (height - spanY) / 2 - bounds.minY * step,
                right: (width + spanX) / 2,
                bottom: (height + spanY) / 2,
                step
            };
        }
        const step = usable / this.logic.topology.width;
        return {
            left: (width - step * this.logic.topology.width) / 2,
            top: (height - step * this.logic.topology.height) / 2,
            step
        };
    }

    render() {
        if (!this.ctx || !this.logic) return;
        const ctx = this.ctx;
        const width = this.canvas.clientWidth || 720;
        const height = this.canvas.clientHeight || width;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0b1116';
        ctx.fillRect(0, 0, width, height);

        const rect = this.boardRect();
        this.lastRect = rect;
        const legalMoves = new Map(this.logic.legalMoves().map((move) => [this.logic.key(move.coord), move]));
        const n = this.logic.topology.width;
        const theme = this.themeColors();

        if (this.logic.topology.lattice === 'honeycomb') {
            for (const coord of this.logic.topology.allCoords()) this.drawHexCell(coord, rect);
        } else if (this.logic.topology.lattice === 'kagome') {
            this.drawKagomeBoard(rect);
        } else if (this.logic.topology.topology === 'polar') {
            this.drawPolarBoard(rect);
        } else {
            for (let y = 0; y < n; y += 1) {
                for (let x = 0; x < n; x += 1) {
                    const px = rect.left + x * rect.step;
                    const py = rect.top + y * rect.step;
                    ctx.fillStyle = (x + y) % 2 === 0 ? theme.light : theme.dark;
                    ctx.fillRect(px, py, rect.step, rect.step);
                    ctx.strokeStyle = theme.line;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, rect.step, rect.step);
                }
            }
        }

        this.drawTopologyHints(rect);
        for (const coord of this.logic.topology.allCoords()) {
            const stone = this.logic.get(coord);
            if (stone) this.drawStone(coord, stone.color, rect);
        }
        for (const move of legalMoves.values()) this.drawLegalDot(move.coord, rect);
        if (this.hoverCoord && legalMoves.has(this.logic.key(this.hoverCoord))) {
            this.drawHover(this.hoverCoord, rect);
        }
    }

    hexCenter(coord, rect) {
        const [x, y] = coord;
        return {
            x: rect.left + Math.sqrt(3) * rect.radius * (0.5 + x + (y % 2) * 0.5),
            y: rect.top + rect.radius + 1.5 * rect.radius * y
        };
    }

    kagomeCenter(coord, rect) {
        const point = kagomePoint(coord, this.logic.topology.width, this.logic.topology.height);
        return {
            x: rect.left + (point?.x || 0) * rect.step,
            y: rect.top + (point?.y || 0) * rect.step
        };
    }

    graphCenter(coord, rect) {
        return this.logic.topology.lattice === 'kagome'
            ? this.kagomeCenter(coord, rect)
            : this.hexCenter(coord, rect);
    }

    polarCenter(coord, rect) {
        if (coord[0] === 0) return { x: rect.centerX, y: rect.centerY };
        const angle = -Math.PI / 2 + (coord[1] / this.logic.topology.width) * Math.PI * 2;
        const radius = coord[0] * rect.step;
        return {
            x: rect.centerX + Math.cos(angle) * radius,
            y: rect.centerY + Math.sin(angle) * radius
        };
    }

    drawPolarBoard(rect) {
        const ctx = this.ctx;
        const rings = this.logic.topology.height;
        const sectors = this.logic.topology.width;
        const theme = this.themeColors();
        ctx.save();
        ctx.fillStyle = theme.polar || theme.dark;
        ctx.beginPath();
        ctx.arc(rect.centerX, rect.centerY, rect.radius + rect.step * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = theme.line;
        ctx.lineWidth = Math.max(1.25, rect.step * 0.035);
        for (let ring = 1; ring < rings; ring += 1) {
            ctx.beginPath();
            ctx.arc(rect.centerX, rect.centerY, ring * rect.step, 0, Math.PI * 2);
            ctx.stroke();
        }
        for (let sector = 0; sector < sectors; sector += 1) {
            const angle = -Math.PI / 2 + (sector / sectors) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(rect.centerX, rect.centerY);
            ctx.lineTo(rect.centerX + Math.cos(angle) * rect.radius, rect.centerY + Math.sin(angle) * rect.radius);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(5, 12, 14, 0.9)';
        for (const coord of this.logic.topology.allCoords()) {
            const center = this.polarCenter(coord, rect);
            ctx.beginPath();
            ctx.arc(center.x, center.y, Math.max(1.8, rect.step * 0.04), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    traceHex(center, radius) {
        this.ctx.beginPath();
        for (let side = 0; side < 6; side++) {
            const angle = Math.PI / 3 * side - Math.PI / 6;
            const x = center.x + radius * Math.cos(angle);
            const y = center.y + radius * Math.sin(angle);
            if (side === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
    }

    drawHexCell(coord, rect) {
        const center = this.hexCenter(coord, rect);
        const theme = this.themeColors();
        this.traceHex(center, rect.radius);
        this.ctx.fillStyle = (coord[0] + coord[1]) % 2 === 0 ? theme.light : theme.dark;
        this.ctx.fill();
        this.ctx.strokeStyle = theme.line;
        this.ctx.lineWidth = Math.max(1.15, rect.radius * 0.055);
        this.ctx.stroke();
    }

    drawKagomeBoard(rect) {
        const ctx = this.ctx;
        const theme = this.themeColors();
        const drawn = new Set();
        ctx.save();
        ctx.strokeStyle = theme.line;
        ctx.lineWidth = Math.max(1.2, rect.step * 0.035);
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (const coord of this.logic.topology.allCoords()) {
            const from = this.kagomeCenter(coord, rect);
            const fromKey = this.logic.key(coord);
            for (const direction of this.logic.topology.directionsFor(coord)) {
                const next = this.logic.topology.step(coord, direction);
                if (!next) continue;
                const toKey = this.logic.key(next);
                const edgeKey = [fromKey, toKey].sort().join('|');
                if (drawn.has(edgeKey)) continue;
                drawn.add(edgeKey);
                const to = this.kagomeCenter(next, rect);
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
            }
        }
        ctx.stroke();
        ctx.fillStyle = theme.light;
        for (const coord of this.logic.topology.allCoords()) {
            const center = this.kagomeCenter(coord, rect);
            ctx.beginPath();
            ctx.arc(center.x, center.y, Math.max(1.8, rect.step * 0.032), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawTopologyHints(rect) {
        const ctx = this.ctx;
        const right = rect.right || rect.left + this.logic.topology.width * rect.step;
        const bottom = rect.bottom || rect.top + this.logic.topology.height * rect.step;
        ctx.save();
        ctx.strokeStyle = this.boundarySelect.value === 'polar' ? 'rgba(245, 182, 71, 0.9)' : this.boundarySelect.value === 'klein' ? 'rgba(242, 196, 100, 0.82)' : this.boundarySelect.value === 'random' ? 'rgba(216, 180, 254, 0.86)' : 'rgba(72, 199, 244, 0.68)';
        ctx.lineWidth = Math.max(1.5, rect.step * 0.035);
        ctx.setLineDash([rect.step * 0.35, rect.step * 0.22]);
        if (this.boundarySelect.value === 'polar') {
            ctx.beginPath();
            ctx.arc(rect.centerX, rect.centerY, rect.radius + rect.step * 0.32, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.boundarySelect.value === 'cylinder') {
            ctx.beginPath();
            ctx.moveTo(rect.left - 5, rect.top - 5);
            ctx.lineTo(rect.left - 5, bottom + 5);
            ctx.moveTo(right + 5, rect.top - 5);
            ctx.lineTo(right + 5, bottom + 5);
            ctx.stroke();
        } else if (this.boundarySelect.value === 'pbc') {
            ctx.strokeRect(rect.left - 5, rect.top - 5, right - rect.left + 10, bottom - rect.top + 10);
        } else if (this.boundarySelect.value === 'klein') {
            ctx.beginPath();
            ctx.moveTo(rect.left, rect.top - 7);
            ctx.lineTo(right, rect.top - 7);
            ctx.moveTo(right, bottom + 7);
            ctx.lineTo(rect.left, bottom + 7);
            ctx.stroke();
        } else if (this.boundarySelect.value === 'random') {
            ctx.strokeRect(rect.left - 5, rect.top - 5, right - rect.left + 10, bottom - rect.top + 10);
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(216, 180, 254, 0.92)';
            const marker = Math.max(2.5, rect.step * 0.075);
            for (const [x, y] of [
                [rect.left - 5, rect.top - 5],
                [right + 5, rect.top - 5],
                [right + 5, bottom + 5],
                [rect.left - 5, bottom + 5]
            ]) {
                ctx.beginPath();
                ctx.arc(x, y, marker, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    drawStone(coord, color, rect) {
        const center = this.logic.topology.lattice === 'honeycomb' || this.logic.topology.lattice === 'kagome'
            ? this.graphCenter(coord, rect)
            : this.logic.topology.topology === 'polar'
            ? this.polarCenter(coord, rect)
            : {
                x: rect.left + (coord[0] + 0.5) * rect.step,
                y: rect.top + (coord[1] + 0.5) * rect.step
            };
        const cx = center.x;
        const cy = center.y;
        const radius = this.logic.topology.lattice === 'honeycomb'
            ? rect.radius * 0.58
            : this.logic.topology.lattice === 'kagome'
            ? rect.step * 0.27
            : this.logic.topology.topology === 'polar' ? rect.step * 0.34 : rect.step * 0.39;
        const gradient = this.ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.45, radius * 0.1, cx, cy, radius);
        if (color === 'black') {
            gradient.addColorStop(0, '#5a646d');
            gradient.addColorStop(0.35, '#14191f');
            gradient.addColorStop(1, '#030405');
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.56, '#edf2f7');
            gradient.addColorStop(1, '#aeb8c2');
        }
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.strokeStyle = color === 'black' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.34)';
        this.ctx.lineWidth = Math.max(1, rect.step * 0.025);
        this.ctx.stroke();
        this.drawAgeRing(cx, cy, radius * 1.22, this.pieceAges?.[this.logic.key(coord)], this.dynamicsSettings());
    }

    drawAgeRing(x, y, radius, age, settings = this.dynamicsSettings()) {
        const mode = settings?.timeEvolution || 'off';
        const config = this.pieceTimeConfig?.() || {
            enabled: mode !== 'off',
            ageEnabled: mode === 'decay',
            decay: mode === 'decay',
            ageLifespan: settings?.lifetime
        };
        const numericAge = Number(age || 0);
        if (!config.enabled || !config.ageEnabled || !Number.isFinite(numericAge) || numericAge <= 0) return;
        const lifetime = Math.max(1, Number(config.ageLifespan || settings?.lifetime) || 1);
        const progress = Math.max(0.04, Math.min(1, numericAge / lifetime));
        const ctx = this.ctx;
        ctx.save();
        ctx.lineWidth = Math.max(2.4, radius * 0.11);
        ctx.lineCap = 'round';
        ctx.strokeStyle = config.decay && progress >= 0.96 ? 'rgba(255, 64, 64, 1)' : 'rgba(94, 234, 212, 0.98)';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = progress >= 0.96 ? 16 : 9;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.92, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
        if (config.decay && progress >= 0.96) {
            ctx.setLineDash([Math.max(3, radius * 0.28), Math.max(3, radius * 0.18)]);
            ctx.beginPath();
            ctx.arc(x, y, radius * 1.02, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawLegalDot(coord, rect) {
        const center = this.logic.topology.lattice === 'honeycomb' || this.logic.topology.lattice === 'kagome'
            ? this.graphCenter(coord, rect)
            : this.logic.topology.topology === 'polar'
            ? this.polarCenter(coord, rect)
            : {
                x: rect.left + (coord[0] + 0.5) * rect.step,
                y: rect.top + (coord[1] + 0.5) * rect.step
            };
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, Math.max(4, rect.step * 0.11), 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(242, 196, 100, 0.8)';
        this.ctx.fill();
    }

    drawHover(coord, rect) {
        this.ctx.strokeStyle = 'rgba(224, 247, 255, 0.92)';
        this.ctx.lineWidth = Math.max(2, rect.step * 0.05);
        if (this.logic.topology.lattice === 'honeycomb') {
            this.traceHex(this.hexCenter(coord, rect), rect.radius * 0.82);
            this.ctx.stroke();
        } else if (this.logic.topology.lattice === 'kagome') {
            const center = this.kagomeCenter(coord, rect);
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, rect.step * 0.34, 0, Math.PI * 2);
            this.ctx.stroke();
        } else if (this.logic.topology.topology === 'polar') {
            const center = this.polarCenter(coord, rect);
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, rect.step * 0.42, 0, Math.PI * 2);
            this.ctx.stroke();
        } else {
            this.ctx.strokeRect(
                rect.left + coord[0] * rect.step + 2,
                rect.top + coord[1] * rect.step + 2,
                rect.step - 4,
                rect.step - 4
            );
        }
    }

    updateUI() {
        this.updateCustomSizeVisibility();
        const counts = this.logic.counts();
        this.blackScoreEl.textContent = counts.black;
        this.whiteScoreEl.textContent = counts.white;
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : `${this.capitalize(this.logic.currentPlayer)} to play`;
        this.summaryEl.textContent = `${counts.black + counts.white} stones on board, ${counts.empty} empty`;
        this.passBtn.disabled = this.logic.gameOver || this.logic.legalMoves(this.logic.currentPlayer).length > 0;
        const topology = this.boundarySelect.value;
        this.boundaryEl.textContent = topology === 'polar' ? 'Polar Center' : topology === 'random' ? '2D RBC' : topology === 'klein' ? 'Klein' : topology === 'cylinder' ? 'Cylinder x-wrap' : topology === 'pbc' ? 'PBC x/y' : 'Standard';
        const latticeText = this.logic.topology.lattice === 'honeycomb'
            ? ' Honeycomb uses regular hexagonal cells. Stones occupy cell centers and bracket along six axial rays.'
            : this.logic.topology.lattice === 'kagome'
            ? ' Kagome uses a staggered triangle-hexagon graph. Stones occupy graph sites and bracket along visible Kagome links.'
            : topology === 'polar'
            ? ' Polar rays can bracket around rings and radially through the center.'
            : ' Square uses the usual eight 2D rays.';
        this.boundaryInfoEl.textContent = (topology === 'polar'
            ? 'Polar coordinates use one true center node, radial rings, circular angular neighbors, and ring/ray bracketing.'
            : topology === 'random'
            ? '2D RBC uses one fixed random map from each boundary exit to another boundary square. The map stays static for this game.'
            : topology === 'klein'
            ? 'Klein bottle identifies left-right normally and top-bottom with x flipped.'
            : topology === 'cylinder'
            ? 'Cylinder identifies only left-right edges, while top and bottom remain ordinary open Reversi edges.'
            : topology === 'pbc'
                ? 'PBC identifies both left-right and top-bottom edges.'
                : 'Standard uses ordinary open board edges.') + latticeText;
        if (this.logic.gameOver) this.setStatus(this.resultText());
        this.renderHistory();
        this.render();
        if (this.logic.gameOver) this.robot?.renderFinalWinRateFlow?.();
        else this.robot?.updatePanelState();
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
        const counts = this.logic.counts();
        if (this.logic.winner === 'draw') return `Draw (Black ${counts.black}, White ${counts.white})`;
        const margin = Math.abs(counts.black - counts.white);
        return `${this.capitalize(this.logic.winner)} wins by ${margin} (Black ${counts.black}, White ${counts.white})`;
    }

    canActFor(color) {
        if (this.gameModeSelect?.value === 'robot' && this.robot?.side === color) return false;
        return this.gameModeSelect?.value !== 'online' || (this.network?.isConnected && this.myColor === color);
    }

    updateOnlineStatusLine(text = '', visible = false) {
        if (!this.onlineColorEl) return;
        this.onlineColorEl.textContent = text;
        this.onlineColorEl.hidden = !visible;
    }

    updateOnlineControls() {
        const mode = this.gameModeSelect?.value || 'local';
        const online = mode === 'online';
        if (this.onlineControls) this.onlineControls.hidden = !online;
        if (!online) {
            this.myColor = null;
            this.network?.close?.({ silent: true });
            if (mode === 'robot') this.updateOnlineStatusLine(`Local robot opponent (${this.robot?.side || 'white'})`, true);
            else this.updateOnlineStatusLine('', false);
        } else if (!this.myColor) {
            this.updateOnlineStatusLine('Online mode selected.', true);
        }
    }

    setOnlineColor(color, roomId = this.network?.roomId) {
        this.myColor = color;
        this.updateOnlineStatusLine(color ? `Online as ${this.capitalize(color)}` : '', Boolean(color));
        if (this.shareLinkInput && roomId) {
            const url = new URL(window.location.href);
            url.searchParams.set('room', roomId);
            this.shareLinkInput.value = url.href;
        }
    }

    tryJoinSharedRoomFromUrl() {
        const roomId = new URLSearchParams(window.location.search).get('room');
        if (!roomId || !this.gameModeSelect) return;
        this.gameModeSelect.value = 'online';
        this.updateOnlineControls();
        if (this.roomIdInput) this.roomIdInput.value = roomId;
        window.setTimeout(() => this.network.resumeOrJoinRoom(roomId), 150);
    }

    onlineGameKey() {
        return '2dreversi';
    }

    onlineMatchKey() {
        return ['2dreversi', this.boundarySelect.value, this.latticeSelect.value, this.boardSize()].join(':');
    }

    exportNetworkState() {
        return {
            logic: this.logic.exportState(),
            size: this.boardSize(),
            topology: this.boundarySelect.value,
            lattice: this.latticeSelect.value,
            dynamics: this.dynamicsSettings(),
            pieceAges: { ...this.pieceAges },
            noiseTick: this.noiseTick
        };
    }

    importNetworkState(state) {
        if (!state?.logic) return;
        this.logic.importState(state.logic);
        this.boundarySelect.value = state.topology || this.logic.topology.topology || this.boundarySelect.value;
        this.latticeSelect.value = state.lattice || this.logic.topology.lattice || this.latticeSelect.value;
        this.setDynamicsSettings(state.dynamics || {});
        this.pieceAges = { ...(state.pieceAges || {}) };
        this.noiseTick = Number(state.noiseTick) || 0;
        this.setSizeSelection(state.size || this.logic.topology.width);
        this.setStatus('Synced online game.');
        this.updateUI();
    }

    broadcastState() {
        if (this.gameModeSelect?.value === 'online' && this.network?.isConnected) this.network.sendState();
    }

    sendChatMessage() {
        const text = this.chatInput?.value.trim();
        if (!text) return;
        if (this.gameModeSelect?.value !== 'online' || !this.network?.isConnected) {
            this.setStatus('Connect online before chatting.');
            return;
        }
        this.network.sendChat({ text });
        this.chatInput.value = '';
    }

    renderOnlineChatMessages(messages = []) {
        if (!this.chatMessagesEl) return;
        if (!messages.length) {
            this.chatMessagesEl.innerHTML = '<div class="chat-empty">Connect online to chat.</div>';
            return;
        }
        this.chatMessagesEl.innerHTML = messages.map((message) => `<div class="chat-message"><div class="chat-meta">${this.escapeHTML(message.displayName || this.capitalize(message.player || 'player'))}</div><div class="chat-text">${this.escapeHTML(message.text || '')}</div></div>`).join('');
        this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;
    }

    escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }

    setStatus(text) {
        this.statusEl.textContent = text;
    }

    capitalize(value) {
        return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
    }
}

window.reversi2dApp = new Reversi2DApp();
installGameUILocalizer();
