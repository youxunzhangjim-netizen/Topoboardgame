import { COLORS, GoGameLogic, normalizeTopology, otherColor, valueToColor } from './GoGame.js';
import { FirebaseStateNetworkManager } from '../../../js/FirebaseStateNetworkManager.js';
import { GoRobotController } from './robot/GoRobot.js';

const PUBLIC_GAME_URL = 'https://youxunzhangjim-netizen.github.io/Topoboardgame/2D/2dgo/';
const STORAGE_PREFIX = '2dgo:room:';
const KOMI = 7.5;

class Go2DApp {
    constructor() {
        this.canvas = document.getElementById('goBoard');
        this.ctx = this.canvas.getContext('2d');
        this.boardPanel = this.canvas.closest('.board-panel');
        this.sizeSelect = document.getElementById('boardSizeSelect');
        this.customSizeInput = document.getElementById('customBoardSizeInput');
        this.boundarySelect = document.getElementById('boundarySelect');
        this.latticeSelect = document.getElementById('latticeSelect');
        this.timerSelect = document.getElementById('timerSelect');
        this.timeEvolutionSelect = document.getElementById('timeEvolutionSelect');
        this.timeLifetimeInput = document.getElementById('timeLifetimeInput');
        this.noiseModeSelect = document.getElementById('noiseModeSelect');
        this.noiseRateInput = document.getElementById('noiseRateInput');
        this.noisePeriodInput = document.getElementById('noisePeriodInput');
        this.gameModeSelect = document.getElementById('gameModeSelect');
        this.onlineControls = document.getElementById('onlineControls');
        this.statusEl = document.getElementById('gameStatus');
        this.onlineColorEl = document.getElementById('onlineColorStatus');
        this.turnEl = document.getElementById('playerTurn');
        this.boundaryEl = document.getElementById('boundaryMode');
        this.boundaryInfoEl = document.getElementById('boundaryInfo');
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
        this.updateLatticeAvailability();
        this.logic = new GoGameLogic({ size: this.boardSize(), topology: this.boundarySelect.value, lattice: this.effectiveLattice(), dimension: 2, komi: KOMI });
        this.network = new FirebaseStateNetworkManager(this, { gameKey: this.onlineGameKey(), matchKey: this.onlineMatchKey() });
        this.robot = new GoRobotController(this);
        this.myColor = null;
        this.settingsLocked = false;
        this.gameStarted = false;
        this.timeLimit = Number(this.timerSelect.value) || 0;
        this.timeRemaining = { black: this.timeLimit, white: this.timeLimit };
        this.timerInterval = null;
        this.hoverCoord = null;
        this.lastBoardRect = null;
        this.boardZoom = 1;
        this.zoomPointers = new Map();
        this.pinchStart = null;
        this.suppressClickUntil = 0;
        this.chatMessages = [];
        this.stoneAges = {};
        this.noiseTick = 0;

        this.bindEvents();
        this.resize();
        this.updateUI();
        this.tryJoinSharedRoomFromUrl();
    }

    applyUrlSettings() {
        const params = new URLSearchParams(window.location.search);
        const size = params.get('size');
        if (size !== null && size.trim() !== '' && Number.isFinite(Number(size))) this.setSizeSelection(size);

        const timer = params.get('timer');
        if ([...this.timerSelect.options].some((option) => option.value === timer)) {
            this.timerSelect.value = timer;
        }

        const mode = String(params.get('mode') || params.get('boundary') || '').toLowerCase();
        if (['cylinder', 'cyl', 'pbcx', 'pbc-x', 'x-periodic', 'periodic-x'].includes(mode)) this.boundarySelect.value = 'cylinder';
        if (['pbc', 't2', 'torus', 'periodic', 'periodic2d'].includes(mode)) this.boundarySelect.value = 'pbc';
        if (['klein', 'kleingo', 'klein_bottle', 'klein-bottle'].includes(mode)) this.boundarySelect.value = 'klein';
        if (['random', 'random_boundary', 'random-boundary'].includes(mode)) this.boundarySelect.value = 'random';
        if (['polar', 'polar_center', 'polar-center', 'radial'].includes(mode)) this.boundarySelect.value = 'polar';
        if (mode === 'obc' || mode === 'open2d') this.boundarySelect.value = 'open2d';
        const lattice = String(params.get('lattice') || '').toLowerCase();
        if (lattice === 'honeycomb' || lattice === 'triangular') this.latticeSelect.value = lattice;
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

    boardSize() {
        const source = this.sizeSelect.value === 'custom' ? this.customSizeInput?.value : this.sizeSelect.value;
        return this.normalizedBoardSize(source);
    }

    normalizedBoardSize(value) {
        const parsed = Math.floor(Number(value));
        if (!Number.isFinite(parsed)) return 9;
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

    effectiveLattice() {
        return normalizeTopology(this.boundarySelect.value) === 'polar' ? 'square' : (this.latticeSelect.value || 'square');
    }

    updateLatticeAvailability() {
        const polar = normalizeTopology(this.boundarySelect.value) === 'polar';
        if (polar && this.latticeSelect.value !== 'square') this.latticeSelect.value = 'square';
        [...this.latticeSelect.options].forEach((option) => {
            const unavailable = polar && option.value !== 'square';
            option.disabled = unavailable;
            option.hidden = unavailable;
        });
        this.latticeSelect.title = polar
            ? 'Polar Go uses the cleaned radial square-intersection graph. Honeycomb and triangular lattice options are disabled in polar mode.'
            : '';
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

    coordKeyFromIndex(index) {
        return this.logic.coordFromIndex(index).join(',');
    }

    syncStoneAges() {
        const next = {};
        for (let index = 0; index < this.logic.board.length; index += 1) {
            if (this.logic.board[index] === COLORS.empty) continue;
            const key = this.coordKeyFromIndex(index);
            next[key] = Math.max(1, Number(this.stoneAges?.[key]) || 1);
        }
        this.stoneAges = next;
    }

    applyTimeEvolutionAndNoise() {
        const settings = this.dynamicsSettings();
        this.syncStoneAges();
        if (settings.timeEvolution !== 'off') {
            const aged = {};
            for (const [key, age] of Object.entries(this.stoneAges)) aged[key] = Number(age || 0) + 1;
            this.stoneAges = aged;
            if (settings.timeEvolution === 'decay') {
                for (let index = 0; index < this.logic.board.length; index += 1) {
                    if (this.logic.board[index] === COLORS.empty) continue;
                    const key = this.coordKeyFromIndex(index);
                    if ((this.stoneAges[key] || 1) > settings.lifetime) this.logic.board[index] = COLORS.empty;
                }
            }
        }
        if (settings.noiseMode !== 'off' && settings.noiseRate > 0) {
            this.noiseTick += 1;
            if (this.noiseTick % settings.noisePeriod === 0) {
                for (let index = 0; index < this.logic.board.length; index += 1) {
                    const value = this.logic.board[index];
                    if (settings.noiseMode === 'random-death' && value !== COLORS.empty && Math.random() < settings.noiseRate) {
                        this.logic.board[index] = COLORS.empty;
                    } else if (settings.noiseMode === 'random-birth' && value === COLORS.empty && Math.random() < settings.noiseRate * 0.04) {
                        this.logic.board[index] = this.logic.currentPlayer === 'black' ? COLORS.black : COLORS.white;
                    }
                }
            }
        }
        this.syncStoneAges();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('wheel', (event) => this.handleBoardWheel(event), { passive: false });
        this.canvas.addEventListener('pointerdown', (event) => this.handleBoardPointerDown(event));
        this.canvas.addEventListener('pointermove', (event) => this.handlePointerMove(event));
        this.canvas.addEventListener('pointerup', (event) => this.handleBoardPointerEnd(event));
        this.canvas.addEventListener('pointercancel', (event) => this.handleBoardPointerEnd(event));
        this.canvas.addEventListener('pointerleave', (event) => { this.handleBoardPointerEnd(event); this.hoverCoord = null; this.render(); });
        this.canvas.addEventListener('click', (event) => this.handleBoardClick(event));
        this.sizeSelect.addEventListener('change', () => {
            this.updateCustomSizeVisibility();
            this.resetGame();
        });
        this.customSizeInput?.addEventListener('change', () => {
            this.setSizeSelection(this.customSizeInput.value);
            this.resetGame();
        });
        this.boundarySelect.addEventListener('change', () => {
            this.updateLatticeAvailability();
            this.resetGame();
        });
        this.latticeSelect.addEventListener('change', () => this.resetGame());
        this.timerSelect.addEventListener('change', () => this.resetGame());
        this.dynamicControls().forEach((control) => control.addEventListener('change', () => this.resetGame()));
        this.gameModeSelect.addEventListener('change', () => {
            this.updateOnlineControls();
            this.robot?.updatePanelState();
            this.robot?.scheduleIfNeeded();
            this.updateUI();
        });
        this.passBtn.addEventListener('click', () => this.passTurn());
        this.countBtn.addEventListener('click', () => this.agreeCount());
        this.newGameBtn.addEventListener('click', () => this.resetGame({ broadcast: true }));
        this.surrenderBtn.addEventListener('click', () => this.surrender());
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.lockSettings();
            this.network.createRoom();
        });
        document.getElementById('findMatchBtn').addEventListener('click', () => {
            this.lockSettings();
            this.network.findMatch();
        });
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            this.lockSettings();
            this.network.joinRoom(this.roomIdInput.value);
        });
        this.copyLinkBtn.addEventListener('click', async () => {
            if (!this.shareLinkInput.value) return;
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
        this.robot?.attach();
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

    boardRect() {
        const cssSize = this.canvas.width / Math.min(window.devicePixelRatio || 1, 2);
        const margin = Math.max(28, cssSize * 0.07);
        const span = cssSize - margin * 2;
        if (this.logic.topology === 'polar') {
            return {
                x: cssSize / 2,
                y: cssSize / 2,
                span,
                radius: span / 2,
                step: span / (2 * Math.max(1, this.logic.size - 1)),
                size: cssSize
            };
        }
        if (this.logic.lattice === 'honeycomb') {
            const rawWidth = Math.max(1, (this.logic.size - 1) * Math.sqrt(3) / 2);
            const rawHeight = Math.max(1, this.logic.size - 0.5);
            const step = span / Math.max(rawWidth, rawHeight);
            const spanX = rawWidth * step;
            const spanY = rawHeight * step;
            return {
                x: (cssSize - spanX) / 2,
                y: (cssSize - spanY) / 2,
                span: Math.max(spanX, spanY),
                spanX,
                spanY,
                step,
                size: cssSize
            };
        }
        if (this.logic.lattice === 'triangular') {
            const mobileVertical = cssSize < 680;
            const rawWidth = mobileVertical
                ? Math.max(1, (this.logic.size - 1) * Math.sqrt(3) / 2 + 1)
                : Math.max(1, (this.logic.size - 1) * 1.5 + 1);
            const rawHeight = mobileVertical
                ? Math.max(1, (this.logic.size - 1) * 1.5 + 1)
                : Math.max(1, (this.logic.size - 1) * Math.sqrt(3) / 2 + 1);
            const step = span / Math.max(rawWidth, rawHeight);
            const spanX = rawWidth * step;
            const spanY = rawHeight * step;
            return {
                x: (cssSize - spanX) / 2,
                y: (cssSize - spanY) / 2,
                span: Math.max(spanX, spanY),
                spanX,
                spanY,
                step,
                size: cssSize
            };
        }
        return { x: margin, y: margin, span, step: span / (this.logic.size - 1), size: cssSize };
    }

    coordToPixel(coord) {
        const rect = this.boardRect();
        if (this.logic.topology === 'polar') {
            if (coord[0] === 0) return { x: rect.x, y: rect.y };
            const angle = -Math.PI / 2 + (coord[1] / this.logic.size) * Math.PI * 2;
            const radius = coord[0] * rect.step;
            return {
                x: rect.x + Math.cos(angle) * radius,
                y: rect.y + Math.sin(angle) * radius
            };
        }
        if (this.logic.lattice === 'honeycomb') {
            return {
                x: rect.x + coord[0] * rect.step * Math.sqrt(3) / 2,
                y: rect.y + (coord[1] + (coord[0] % 2) * 0.5) * rect.step
            };
        }
        if (this.logic.lattice === 'triangular') {
            if ((rect.size || this.canvas.clientWidth || 720) < 680) {
                return {
                    x: rect.x + coord[0] * rect.step * Math.sqrt(3) / 2,
                    y: rect.y + (coord[1] + coord[0] * 0.5) * rect.step
                };
            }
            return {
                x: rect.x + (coord[0] + coord[1] * 0.5) * rect.step,
                y: rect.y + coord[1] * rect.step * Math.sqrt(3) / 2
            };
        }
        return {
            x: rect.x + coord[0] * rect.step,
            y: rect.y + coord[1] * rect.step
        };
    }

    pixelToCoord(event) {
        const bounds = this.canvas.getBoundingClientRect();
        const rect = this.boardRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        if (this.logic.topology === 'polar') {
            let nearest = null;
            let nearestDistance = Infinity;
            for (const coord of this.logic.allCoords()) {
                const point = this.coordToPixel(coord);
                const distance = Math.hypot(point.x - x, point.y - y);
                if (distance < nearestDistance) {
                    nearest = coord;
                    nearestDistance = distance;
                }
            }
            return nearestDistance <= Math.max(14, rect.step * 0.42) ? nearest : null;
        }
        if (this.logic.lattice === 'honeycomb' || this.logic.lattice === 'triangular') {
            let nearest = null;
            let nearestDistance = Infinity;
            for (let gy = 0; gy < this.logic.size; gy++) {
                for (let gx = 0; gx < this.logic.size; gx++) {
                    const point = this.coordToPixel([gx, gy]);
                    const distance = Math.hypot(point.x - x, point.y - y);
                    if (distance < nearestDistance) {
                        nearest = [gx, gy];
                        nearestDistance = distance;
                    }
                }
            }
            const threshold = this.logic.lattice === 'honeycomb' ? 0.38 : 0.48;
            return nearestDistance <= Math.max(14, rect.step * threshold) ? nearest : null;
        }
        const gx = Math.round((x - rect.x) / rect.step);
        const gy = Math.round((y - rect.y) / rect.step);
        if (gx < 0 || gy < 0 || gx >= this.logic.size || gy >= this.logic.size) return null;
        const point = this.coordToPixel([gx, gy]);
        const distance = Math.hypot(point.x - x, point.y - y);
        return distance <= Math.max(14, rect.step * 0.44) ? [gx, gy] : null;
    }

    handlePointerMove(event) {
        this.handleBoardPointerMove(event);
        this.hoverCoord = this.pixelToCoord(event);
        this.render();
    }

    handleBoardClick(event) {
        if (performance.now() < this.suppressClickUntil) return;
        const coord = this.pixelToCoord(event);
        if (!coord) return;
        if (this.robot?.shouldBlockHumanInput(this.logic.currentPlayer)) {
            this.setStatus(this.robot.thinking ? 'Robot is thinking.' : "It is the local robot\'s turn.");
            return;
        }
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.logic.currentPlayer}.`);
            return;
        }
        const index = this.logic.indexFromCoord(coord);
        const result = this.logic.tryPlay(coord, this.logic.currentPlayer, {
            virtualEmptyIndexes: this.isSpaceTimeIndexVisible?.(index, coord) === false ? [index] : []
        });
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        this.afterLocalAction(`${this.capitalize(otherColor(this.logic.currentPlayer))} to play.`);
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
            this.setStatus(this.robot.thinking ? 'Robot is thinking.' : "It is the local robot\'s turn.");
            return;
        }
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.logic.currentPlayer}.`);
            return;
        }
        const color = this.logic.currentPlayer;
        const result = this.logic.pass(color);
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        const message = this.logic.scoringPending ? 'Two passes. Both players must agree to count.' : `${this.capitalize(this.logic.currentPlayer)} to play.`;
        this.afterLocalAction(message);
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
        if (margin === 0) return 'Counting pending: provisional draw';
        const leader = score.black > score.white ? 'Black' : 'White';
        return `Counting pending: ${leader} leads by ${margin}`;
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
            this.setStatus(`${this.capitalize(color)} agreed. Waiting for ${this.capitalize(otherColor(color))}.`);
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
        this.setStatus(`${this.capitalize(color)} surrendered. ${this.capitalize(this.logic.winner)} wins.`);
        this.broadcastState();
        this.updateUI();
    }

    afterLocalAction(message) {
        this.gameStarted = true;
        this.lockSettings();
        this.startTimer();
        this.applyTimeEvolutionAndNoise();
        const finalMessage = this.autoFinalizeLocalCount() || (this.logic.gameOver ? this.resultText() : message);
        this.setStatus(finalMessage);
        this.broadcastState();
        this.updateUI();
        this.robot?.afterLocalAction();
    }

    resetGame({ broadcast = false } = {}) {
        if (!broadcast && !this.canChangeSettings()) return;
        this.updateLatticeAvailability();
        this.logic.reset({ size: this.boardSize(), topology: this.boundarySelect.value, lattice: this.effectiveLattice(), dimension: 2, komi: KOMI });
        this.stoneAges = {};
        this.noiseTick = 0;
        this.gameStarted = false;
        this.settingsLocked = this.network.isConnected;
        this.timeLimit = Number(this.timerSelect.value) || 0;
        this.timeRemaining = { black: this.timeLimit, white: this.timeLimit };
        this.stopTimer();
        this.hoverCoord = null;
        this.setStatus('Select an empty intersection for Black.');
        this.robot?.clearAnalysis();
        if (broadcast) this.broadcastState();
        this.updateUI();
        this.robot?.scheduleIfNeeded();
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
                this.setStatus(`${this.capitalize(color)} ran out of time. ${this.capitalize(this.logic.winner)} wins.`);
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

    render() {
        const ctx = this.ctx;
        const rect = this.boardRect();
        const n = this.logic.size;
        ctx.clearRect(0, 0, rect.size, rect.size);
        const wood = ctx.createLinearGradient(0, 0, rect.size, rect.size);
        wood.addColorStop(0, '#e1b979');
        wood.addColorStop(0.55, '#c99048');
        wood.addColorStop(1, '#a96f34');
        ctx.fillStyle = wood;
        ctx.fillRect(0, 0, rect.size, rect.size);

        if (this.logic.lattice === 'honeycomb') this.drawHoneycombFaces(rect);

        ctx.strokeStyle = 'rgba(42, 27, 14, 0.82)';
        ctx.lineWidth = Math.max(1, rect.step * (this.logic.lattice === 'honeycomb' ? 0.045 : 0.035));
        ctx.beginPath();
        if (this.logic.topology === 'polar') {
            this.drawPolarGrid(rect);
        } else if (this.logic.lattice !== 'square') {
            const drawn = new Set();
            for (let y = 0; y < n; y++) {
                for (let x = 0; x < n; x++) {
                    const from = [x, y];
                    const fromKey = from.join(',');
                    const start = this.coordToPixel(from);
                    for (const neighbor of this.logic.neighborsFromCoord(from)) {
                        if (Math.abs(neighbor[0] - x) > 1 || Math.abs(neighbor[1] - y) > 1) continue;
                        const toKey = neighbor.join(',');
                        const edgeKey = [fromKey, toKey].sort().join('|');
                        if (drawn.has(edgeKey)) continue;
                        drawn.add(edgeKey);
                        const end = this.coordToPixel(neighbor);
                        ctx.moveTo(start.x, start.y);
                        ctx.lineTo(end.x, end.y);
                    }
                }
            }
        } else {
            for (let i = 0; i < n; i++) {
                const p = rect.x + i * rect.step;
                ctx.moveTo(rect.x, p);
                ctx.lineTo(rect.x + rect.span, p);
                ctx.moveTo(p, rect.y);
                ctx.lineTo(p, rect.y + rect.span);
            }
        }
        ctx.stroke();

        if (this.logic.lattice === 'honeycomb') {
            ctx.fillStyle = 'rgba(42, 27, 14, 0.88)';
            for (let y = 0; y < n; y++) {
                for (let x = 0; x < n; x++) {
                    const point = this.coordToPixel([x, y]);
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, Math.max(1.7, rect.step * 0.035), 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        if (this.logic.topology === 'cylinder') this.drawCylinderBoundary(rect);
        if (this.logic.topology === 'pbc') this.drawPeriodicBoundary(rect);
        if (this.logic.topology === 'klein') this.drawKleinBoundary(rect);
        if (this.logic.topology === 'random') this.drawRandomBoundary(rect);
        if (this.logic.topology === 'polar') this.drawPolarBoundary(rect);

        for (const [x, y] of this.logic.lattice === 'square' && this.logic.topology !== 'polar' ? this.starPoints(n) : []) {
            const p = this.coordToPixel([x, y]);
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(3, rect.step * 0.09), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(42, 27, 14, 0.9)';
            ctx.fill();
        }

        this.drawTerritoryMarkers(rect);

        if (this.hoverCoord && this.logic.board[this.logic.indexFromCoord(this.hoverCoord)] === COLORS.empty && !this.logic.gameOver) {
            const p = this.coordToPixel(this.hoverCoord);
            ctx.beginPath();
            ctx.arc(p.x, p.y, rect.step * (this.logic.lattice === 'honeycomb' ? 0.28 : 0.36), 0, Math.PI * 2);
            ctx.fillStyle = this.logic.currentPlayer === 'black' ? 'rgba(0, 0, 0, 0.24)' : 'rgba(255, 255, 255, 0.44)';
            ctx.fill();
        }

        for (let index = 0; index < this.logic.board.length; index++) {
            const value = this.logic.board[index];
            if (!value) continue;
            const color = valueToColor(value);
            const coord = this.logic.coordFromIndex(index);
            if (this.isSpaceTimeIndexVisible?.(index, coord) === false) continue;
            const p = this.coordToPixel(coord);
            const radius = rect.step * (this.logic.lattice === 'honeycomb' ? 0.31 : this.logic.topology === 'polar' ? 0.34 : 0.42);
            this.drawStone(p.x, p.y, radius, color);
            this.drawAgeRing(p.x, p.y, radius * 1.18, this.stoneAges?.[coord.join(',')], this.dynamicsSettings(), coord, index);
        }
    }

    drawTerritoryMarkers(rect) {
        if (!this.logic.scoringPending && !this.logic.gameOver && !this.logic.score) return;
        const score = this.logic.score || this.logic.computeAreaScore();
        if (!score?.territorySites) return;
        const ctx = this.ctx;
        const size = Math.max(5, Math.min(rect.step * 0.28, 16));
        const half = size / 2;
        const entries = [
            ['black', 'rgba(15, 23, 42, 0.7)', 'rgba(248, 250, 252, 0.52)'],
            ['white', 'rgba(248, 250, 252, 0.78)', 'rgba(15, 23, 42, 0.42)'],
            ['neutral', 'rgba(148, 163, 184, 0.48)', 'rgba(15, 23, 42, 0.28)']
        ];
        ctx.save();
        for (const [owner, fill, stroke] of entries) {
            for (const coord of score.territorySites[owner] || []) {
                const index = this.logic.indexFromCoord(coord);
                if (index < 0 || this.isSpaceTimeIndexVisible?.(index, coord) === false) continue;
                const point = this.coordToPixel(coord);
                ctx.fillStyle = fill;
                ctx.strokeStyle = stroke;
                ctx.lineWidth = Math.max(1, size * 0.13);
                ctx.fillRect(point.x - half, point.y - half, size, size);
                ctx.strokeRect(point.x - half, point.y - half, size, size);
            }
        }
        ctx.restore();
    }

    drawPolarGrid(rect) {
        const ctx = this.ctx;
        const n = this.logic.size;
        ctx.save();
        ctx.strokeStyle = 'rgba(42, 27, 14, 0.82)';
        ctx.lineWidth = Math.max(1, rect.step * 0.035);
        for (let ring = 1; ring < n; ring += 1) {
            ctx.beginPath();
            ctx.arc(rect.x, rect.y, ring * rect.step, 0, Math.PI * 2);
            ctx.stroke();
        }
        for (let sector = 0; sector < n; sector += 1) {
            const angle = -Math.PI / 2 + (sector / n) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(rect.x, rect.y);
            ctx.lineTo(rect.x + Math.cos(angle) * rect.radius, rect.y + Math.sin(angle) * rect.radius);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(42, 27, 14, 0.9)';
        for (const coord of this.logic.allCoords()) {
            const p = this.coordToPixel(coord);
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1.7, rect.step * 0.035), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawPolarBoundary(rect) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(245, 182, 71, 0.92)';
        ctx.lineWidth = Math.max(2, rect.step * 0.06);
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.arc(rect.x, rect.y, rect.radius + rect.step * 0.28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(245, 182, 71, 0.92)';
        ctx.beginPath();
        ctx.arc(rect.x, rect.y, Math.max(3, rect.step * 0.09), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawHoneycombFaces(rect) {
        const ctx = this.ctx;
        const n = this.logic.size;
        ctx.save();
        for (let x = 0; x <= n - 3; x += 2) {
            for (let y = 0; y <= n - 2; y++) {
                const vertices = [
                    [x, y],
                    [x + 1, y],
                    [x + 2, y],
                    [x + 2, y + 1],
                    [x + 1, y + 1],
                    [x, y + 1]
                ].map((coord) => this.coordToPixel(coord));
                ctx.beginPath();
                vertices.forEach((point, index) => {
                    if (index === 0) ctx.moveTo(point.x, point.y);
                    else ctx.lineTo(point.x, point.y);
                });
                ctx.closePath();
                ctx.fillStyle = (x / 2 + y) % 2 === 0
                    ? 'rgba(244, 205, 139, 0.34)'
                    : 'rgba(123, 72, 31, 0.13)';
                ctx.fill();
            }
        }
        ctx.restore();
    }

    drawPeriodicBoundary(rect) {
        const ctx = this.ctx;
        const offset = rect.step * 0.34;
        const left = rect.x - offset;
        const top = rect.y - offset;
        const right = rect.x + (rect.spanX || rect.span) + offset;
        const bottom = rect.y + (rect.spanY || rect.span) + offset;
        const marker = Math.max(6, rect.step * 0.18);

        ctx.save();
        ctx.strokeStyle = 'rgba(7, 89, 133, 0.9)';
        ctx.lineWidth = Math.max(2, rect.step * 0.07);
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(left, top, right - left, bottom - top);
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(left - marker, (top + bottom) / 2);
        ctx.lineTo(left, (top + bottom) / 2 - marker * 0.6);
        ctx.moveTo(left - marker, (top + bottom) / 2);
        ctx.lineTo(left, (top + bottom) / 2 + marker * 0.6);
        ctx.moveTo(right + marker, (top + bottom) / 2);
        ctx.lineTo(right, (top + bottom) / 2 - marker * 0.6);
        ctx.moveTo(right + marker, (top + bottom) / 2);
        ctx.lineTo(right, (top + bottom) / 2 + marker * 0.6);
        ctx.moveTo((left + right) / 2, top - marker);
        ctx.lineTo((left + right) / 2 - marker * 0.6, top);
        ctx.moveTo((left + right) / 2, top - marker);
        ctx.lineTo((left + right) / 2 + marker * 0.6, top);
        ctx.moveTo((left + right) / 2, bottom + marker);
        ctx.lineTo((left + right) / 2 - marker * 0.6, bottom);
        ctx.moveTo((left + right) / 2, bottom + marker);
        ctx.lineTo((left + right) / 2 + marker * 0.6, bottom);
        ctx.stroke();
        ctx.restore();
    }

    drawCylinderBoundary(rect) {
        const ctx = this.ctx;
        const offset = rect.step * 0.34;
        const left = rect.x - offset;
        const top = rect.y - offset;
        const right = rect.x + (rect.spanX || rect.span) + offset;
        const bottom = rect.y + (rect.spanY || rect.span) + offset;
        const marker = Math.max(6, rect.step * 0.18);

        ctx.save();
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)';
        ctx.lineWidth = Math.max(2, rect.step * 0.07);
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.moveTo(right, top);
        ctx.lineTo(right, bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(left - marker, (top + bottom) / 2);
        ctx.lineTo(left, (top + bottom) / 2 - marker * 0.6);
        ctx.moveTo(left - marker, (top + bottom) / 2);
        ctx.lineTo(left, (top + bottom) / 2 + marker * 0.6);
        ctx.moveTo(right + marker, (top + bottom) / 2);
        ctx.lineTo(right, (top + bottom) / 2 - marker * 0.6);
        ctx.moveTo(right + marker, (top + bottom) / 2);
        ctx.lineTo(right, (top + bottom) / 2 + marker * 0.6);
        ctx.stroke();
        ctx.restore();
    }

    drawKleinBoundary(rect) {
        const ctx = this.ctx;
        const offset = rect.step * 0.36;
        const left = rect.x - offset;
        const top = rect.y - offset;
        const right = rect.x + (rect.spanX || rect.span) + offset;
        const bottom = rect.y + (rect.spanY || rect.span) + offset;
        const marker = Math.max(6, rect.step * 0.18);

        ctx.save();
        ctx.strokeStyle = 'rgba(94, 234, 212, 0.92)';
        ctx.lineWidth = Math.max(2, rect.step * 0.06);
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(left, top, right - left, bottom - top);
        ctx.setLineDash([]);

        ctx.strokeStyle = 'rgba(242, 196, 100, 0.92)';
        ctx.lineWidth = Math.max(1, rect.step * 0.025);
        const stride = Math.max(1, Math.ceil(this.logic.size / 9));
        for (let i = 0; i < this.logic.size; i += stride) {
            const x = rect.x + i * rect.step;
            const mirroredX = rect.x + (this.logic.size - 1 - i) * rect.step;
            ctx.beginPath();
            ctx.moveTo(x, top - marker * 0.35);
            ctx.lineTo(mirroredX, bottom + marker * 0.35);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(94, 234, 212, 0.92)';
        ctx.lineWidth = Math.max(2, rect.step * 0.06);
        ctx.beginPath();
        ctx.moveTo(left - marker, (top + bottom) / 2);
        ctx.lineTo(left, (top + bottom) / 2 - marker * 0.6);
        ctx.moveTo(left - marker, (top + bottom) / 2);
        ctx.lineTo(left, (top + bottom) / 2 + marker * 0.6);
        ctx.moveTo(right + marker, (top + bottom) / 2);
        ctx.lineTo(right, (top + bottom) / 2 - marker * 0.6);
        ctx.moveTo(right + marker, (top + bottom) / 2);
        ctx.lineTo(right, (top + bottom) / 2 + marker * 0.6);
        ctx.stroke();
        ctx.restore();
    }

    drawRandomBoundary(rect) {
        const ctx = this.ctx;
        const offset = rect.step * 0.4;
        const left = rect.x - offset;
        const top = rect.y - offset;
        const right = rect.x + (rect.spanX || rect.span) + offset;
        const bottom = rect.y + (rect.spanY || rect.span) + offset;

        ctx.save();
        ctx.strokeStyle = 'rgba(216, 180, 254, 0.88)';
        ctx.lineWidth = Math.max(2, rect.step * 0.055);
        ctx.setLineDash([7, 7]);
        ctx.strokeRect(left, top, right - left, bottom - top);
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(216, 180, 254, 0.92)';
        const marker = Math.max(2.5, rect.step * 0.075);
        for (const [x, y] of [
            [left, top],
            [right, top],
            [right, bottom],
            [left, bottom]
        ]) {
            ctx.beginPath();
            ctx.arc(x, y, marker, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawStone(x, y, radius, color) {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.45, radius * 0.12, x, y, radius);
        if (color === 'black') {
            gradient.addColorStop(0, '#5f6872');
            gradient.addColorStop(0.35, '#161a20');
            gradient.addColorStop(1, '#030405');
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.55, '#edf2f7');
            gradient.addColorStop(1, '#aeb8c2');
        }
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = color === 'black' ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.3)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    drawAgeRing(x, y, radius, age, settings = this.dynamicsSettings(), coord = null, index = null) {
        const mode = settings?.timeEvolution || 'off';
        const config = this.pieceTimeConfig?.() || {
            enabled: mode !== 'off',
            ageEnabled: mode === 'decay',
            periodEnabled: mode === 'periodic',
            decay: mode === 'decay',
            ageLifespan: settings?.lifetime,
            periodLifespan: settings?.lifetime
        };
        const numericAge = Number(age || 0);
        if (!config.enabled) return;
        const ageLifetime = Math.max(1, Number(config.ageLifespan || settings?.lifetime) || 1);
        const ctx = this.ctx;
        ctx.save();
        ctx.lineCap = 'round';
        if (config.periodEnabled) {
            const periodProgress = Number(this.spaceTimePeriodRingProgress?.(index, coord));
            if (Number.isFinite(periodProgress)) {
                const progress = Math.max(0.05, Math.min(1, periodProgress));
                ctx.lineWidth = Math.max(2, radius * 0.09);
                ctx.strokeStyle = 'rgba(246, 184, 75, 0.96)';
                ctx.shadowColor = ctx.strokeStyle;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(x, y, radius * 1.22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
                ctx.stroke();
            }
        }
        if (config.ageEnabled && Number.isFinite(numericAge) && numericAge > 0) {
            const progress = Math.max(0.04, Math.min(1, numericAge / ageLifetime));
            ctx.lineWidth = Math.max(2.4, radius * 0.11);
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
        }
        ctx.restore();
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

    canActFor(color) {
        if (this.gameModeSelect?.value === 'robot' && this.robot?.side === color) return false;
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
        this.sizeSelect.disabled = true;
        if (this.customSizeInput) this.customSizeInput.disabled = true;
        this.boundarySelect.disabled = true;
        this.latticeSelect.disabled = true;
        this.timerSelect.disabled = true;
        this.dynamicControls().forEach((control) => { control.disabled = true; });
    }

    unlockSettingsIfLocal() {
        if (!this.canChangeSettings()) return;
        this.settingsLocked = false;
        this.sizeSelect.disabled = false;
        if (this.customSizeInput) this.customSizeInput.disabled = false;
        this.boundarySelect.disabled = false;
        this.latticeSelect.disabled = normalizeTopology(this.boundarySelect.value) === 'polar';
        this.timerSelect.disabled = false;
        this.dynamicControls().forEach((control) => { control.disabled = false; });
    }

    updateSettingsLockState() {
        const locked = !this.canChangeSettings();
        this.settingsLocked = locked;
        this.sizeSelect.disabled = locked;
        if (this.customSizeInput) this.customSizeInput.disabled = locked;
        this.boundarySelect.disabled = locked;
        this.latticeSelect.disabled = locked || normalizeTopology(this.boundarySelect.value) === 'polar';
        this.timerSelect.disabled = locked;
        this.dynamicControls().forEach((control) => { control.disabled = locked; });
    }

    updateOnlineControls() {
        const mode = this.gameModeSelect.value;
        const online = mode === 'online';
        this.onlineControls.classList.toggle('active', online);
        if (!online) {
            this.network.close({ silent: true });
            this.myColor = null;
            this.onlineColorEl.textContent = mode === 'robot'
                ? `Local robot opponent (${this.robot?.side || 'white'})`
                : 'Local pass and play';
            this.unlockSettingsIfLocal();
        }
        this.updateUI();
        this.robot?.scheduleIfNeeded();
    }

    updateUI() {
        this.updateLatticeAvailability();
        this.updateSettingsLockState();
        const topology = normalizeTopology(this.logic.topology);
        const periodic = topology === 'pbc';
        const cylinder = topology === 'cylinder';
        const klein = topology === 'klein';
        const random = topology === 'random';
        const polar = topology === 'polar';
        this.boundaryEl.textContent = polar ? 'Polar Center' : random ? '2D RBC' : klein ? 'Klein' : cylinder ? 'Cylinder x-wrap' : periodic ? 'PBC x/y' : 'Standard';
        const latticeText = this.logic.lattice === 'honeycomb'
            ? ' Honeycomb uses three graph neighbors per interior point; groups, liberties, captures, and territory use those links.'
            : this.logic.lattice === 'triangular'
                ? ' Triangular uses six graph neighbors per interior point. A group is captured only after every exposed axial and diagonal liberty is enclosed.'
                : ' Square uses the usual four orthogonal graph neighbors.';
        this.boundaryInfoEl.textContent = (polar
            ? 'Polar coordinates use one true center node, radial rings, circular angular neighbors, and center-to-first-ring links.'
            : random
            ? '2D RBC uses one fixed random map from each boundary exit to another boundary point. The map is stored with the game state.'
            : klein
            ? 'Klein bottle identifies left-right normally and top-bottom with x flipped: leaving at x enters at size - 1 - x.'
            : cylinder
            ? 'Cylinder identifies only the left-right edges. Top and bottom stay open, so liberties can vanish at the caps.'
            : periodic
                ? 'PBC identifies both left-right and top-bottom edges. Every point has periodic neighbors in both board directions.'
                : 'Standard uses ordinary open board edges.') + latticeText;
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : this.logic.scoringPending ? this.pendingScoreText() : `${this.capitalize(this.logic.currentPlayer)} to play`;
        this.blackCapturedEl.textContent = `${this.logic.captures.black} ${this.logic.captures.black === 1 ? 'stone' : 'stones'}`;
        this.whiteCapturedEl.textContent = `${this.logic.captures.white} ${this.logic.captures.white === 1 ? 'stone' : 'stones'}`;
        this.blackTimerBox.classList.toggle('active', this.logic.currentPlayer === 'black' && !this.logic.gameOver);
        this.whiteTimerBox.classList.toggle('active', this.logic.currentPlayer === 'white' && !this.logic.gameOver);
        this.countBtn.disabled = !this.logic.scoringPending || this.logic.gameOver || (this.gameModeSelect.value === 'online' && !this.myColor);
        this.passBtn.disabled = this.logic.gameOver || this.logic.scoringPending;
        this.updateTimerDisplay();
        this.renderHistory();
        this.renderScore();
        this.renderChatMessages();
        this.render();
        if (this.logic.gameOver) {
            this.setStatus(this.resultText());
            this.robot?.renderFinalWinRateFlow?.();
        } else {
            this.robot?.updatePanelState?.();
        }
    }

    updateTimerDisplay() {
        this.blackTimerEl.textContent = this.formatTime(this.timeRemaining.black);
        this.whiteTimerEl.textContent = this.formatTime(this.timeRemaining.white);
    }

    renderHistory() {
        if (!this.logic.moveHistory.length) {
            this.historyEl.innerHTML = '<div class="move-history-item muted">Game started.</div>';
            return;
        }
        this.historyEl.innerHTML = this.logic.moveHistory.slice(0, 80).map((move) => {
            if (move.type === 'play') return `<div class="move-history-item">${move.number}. ${this.capitalize(move.color)} (${move.coord.map((v) => v + 1).join(',')})${move.captured ? ` captures ${move.captured}` : ''}</div>`;
            if (move.type === 'pass') return `<div class="move-history-item">${move.number}. ${this.capitalize(move.color)} passes</div>`;
            if (move.type === 'surrender') return `<div class="move-history-item">${this.capitalize(move.color)} surrendered</div>`;
            if (move.type === 'score') return `<div class="move-history-item">Final count: ${this.resultText()}</div>`;
            return '';
        }).join('');
    }

    scoreChip(label, value, kind) {
        return `<span class="go-score-chip ${kind}"><span class="go-score-swatch"></span><span>${label}</span><strong>${value ?? 0}</strong></span>`;
    }

    scoreBreakdownHtml(score, result) {
        return `
            <div class="go-score-total">
                <strong>Black ${score.black}</strong>
                <strong>White ${score.white}</strong>
            </div>
            <div class="go-score-breakdown">
                ${this.scoreChip('Black stones', score.blackStones, 'black')}
                ${this.scoreChip('Black territory', score.blackTerritory, 'black-territory')}
                ${this.scoreChip('White stones', score.whiteStones, 'white')}
                ${this.scoreChip('White territory', score.whiteTerritory, 'white-territory')}
                ${this.scoreChip('Komi', score.komi, 'komi')}
                ${this.scoreChip('Neutral / dame', score.neutral, 'neutral')}
                ${this.scoreChip('Dead black removed', score.deadBlack, 'dead-black')}
                ${this.scoreChip('Dead white removed', score.deadWhite, 'dead-white')}
            </div>
            <p class="go-score-note">Mixed-border empty regions stay neutral.</p>
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
        const suffix = this.logic.gameOver ? this.resultText() : this.pendingScoreText();
        this.scoreResult.innerHTML = this.scoreBreakdownHtml(score, suffix);
    }

    resultText() {
        if (!this.logic.gameOver) return '';
        if (this.logic.winner === 'draw') return this.logic.score ? `Draw (Black ${this.logic.score.black}, White ${this.logic.score.white})` : 'Draw';
        if (this.logic.score) return `${this.capitalize(this.logic.winner)} wins by ${this.logic.score.margin} (Black ${this.logic.score.black}, White ${this.logic.score.white})`;
        return `${this.capitalize(this.logic.winner)} wins`;
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

    setStatus(text) {
        this.statusEl.textContent = text;
    }

    setOnlineColor(color) {
        this.myColor = color;
        this.onlineColorEl.textContent = color ? `Online as ${this.capitalize(color)}` : 'Local pass and play';
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
            this.chatMessagesEl.innerHTML = '<div class="chat-empty">Connect online to chat.</div>';
            return;
        }
        this.chatMessagesEl.innerHTML = this.chatMessages.map((message) => {
            const mine = message.senderId && this.network?.peer?.id && message.senderId === this.network.peer.id;
            const author = message.author === 'black' || message.author === 'white'
                ? this.capitalize(message.author)
                : message.author || 'Player';
            const time = message.time ? new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return `<div class="chat-message${mine ? ' mine' : ''}"><div class="chat-meta">${this.escapeHTML(author)}${time ? ` - ${this.escapeHTML(time)}` : ''}</div><div class="chat-text">${this.escapeHTML(message.text || '')}</div></div>`;
        }).join('');
        this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;
    }

    sendChatMessage() {
        const text = this.chatInput?.value.trim();
        if (!text) return;
        if (this.gameModeSelect.value !== 'online' || !this.network?.isConnected) {
            this.setStatus('Connect online before chatting.');
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
        return {
            variant: '2dgo',
            mode: normalizeTopology(this.boundarySelect.value),
            lattice: this.effectiveLattice(),
            size: this.boardSize(),
            timer: Number(this.timerSelect.value) || 0,
            dynamics: this.dynamicsSettings()
        };
    }

    onlineGameKey() {
        return '2dgo';
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
            dynamics: this.dynamicsSettings(),
            stoneAges: { ...this.stoneAges },
            noiseTick: this.noiseTick
        };
    }

    importNetworkState(state) {
        if (!state?.logic) return;
        this.stopTimer();
        this.logic.importState(state.logic);
        this.setSizeSelection(this.logic.size);
        this.boundarySelect.value = normalizeTopology(this.logic.topology);
        this.latticeSelect.value = this.logic.lattice || 'square';
        this.updateLatticeAvailability();
        this.timerSelect.value = String(state.timerValue ?? state.timeLimit ?? 0);
        this.setDynamicsSettings(state.dynamics || {});
        this.stoneAges = { ...(state.stoneAges || {}) };
        this.noiseTick = Number(state.noiseTick) || 0;
        this.timeLimit = Number(state.timeLimit) || 0;
        this.timeRemaining = {
            black: Number(state.timeRemaining?.black) || this.timeLimit,
            white: Number(state.timeRemaining?.white) || this.timeLimit
        };
        this.gameStarted = Boolean(state.gameStarted);
        this.lockSettings();
        if (this.gameStarted && !this.logic.gameOver && !this.logic.scoringPending) this.startTimer();
        this.setStatus(this.logic.gameOver ? this.resultText() : 'Synced online game.');
        this.updateUI();
    }

    broadcastState() {
        if (this.network.isConnected) this.network.sendState();
    }
}

window.go2dApp = new Go2DApp();
