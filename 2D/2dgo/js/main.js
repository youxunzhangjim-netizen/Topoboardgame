import { COLORS, GoGameLogic, otherColor, valueToColor } from './GoGame.js';
import { GoNetworkManager } from './NetworkManager.js';

const PUBLIC_GAME_URL = 'https://youxunzhangjim-netizen.github.io/Spacechess/2D/2dgo/';
const STORAGE_PREFIX = '2dgo:room:';
const KOMI = 7.5;

class Go2DApp {
    constructor() {
        this.canvas = document.getElementById('goBoard');
        this.ctx = this.canvas.getContext('2d');
        this.sizeSelect = document.getElementById('boardSizeSelect');
        this.boundarySelect = document.getElementById('boundarySelect');
        this.timerSelect = document.getElementById('timerSelect');
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

        this.applyUrlSettings();
        this.logic = new GoGameLogic({ size: this.boardSize(), topology: this.boundarySelect.value, dimension: 2, komi: KOMI });
        this.network = new GoNetworkManager(this, { publicGameUrl: PUBLIC_GAME_URL, storagePrefix: STORAGE_PREFIX });
        this.myColor = null;
        this.settingsLocked = false;
        this.gameStarted = false;
        this.timeLimit = Number(this.timerSelect.value) || 0;
        this.timeRemaining = { black: this.timeLimit, white: this.timeLimit };
        this.timerInterval = null;
        this.hoverCoord = null;
        this.lastBoardRect = null;

        this.bindEvents();
        this.resize();
        this.updateUI();
        this.tryJoinSharedRoomFromUrl();
    }

    applyUrlSettings() {
        const params = new URLSearchParams(window.location.search);
        const size = params.get('size');
        if (['9', '13', '19'].includes(size)) this.sizeSelect.value = size;

        const timer = params.get('timer');
        if ([...this.timerSelect.options].some((option) => option.value === timer)) {
            this.timerSelect.value = timer;
        }

        const mode = String(params.get('mode') || params.get('boundary') || '').toLowerCase();
        if (mode === 'pbcx' || mode === 'pbc-x') this.boundarySelect.value = 'pbc-x';
        if (mode === 'obc' || mode === 'open2d') this.boundarySelect.value = 'open2d';
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
        return Number(this.sizeSelect.value) || 19;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('pointermove', (event) => this.handlePointerMove(event));
        this.canvas.addEventListener('pointerleave', () => { this.hoverCoord = null; this.render(); });
        this.canvas.addEventListener('click', (event) => this.handleBoardClick(event));
        this.sizeSelect.addEventListener('change', () => this.resetGame());
        this.boundarySelect.addEventListener('change', () => this.resetGame());
        this.timerSelect.addEventListener('change', () => this.resetGame());
        this.gameModeSelect.addEventListener('change', () => this.updateOnlineControls());
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
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const size = Math.max(320, Math.floor(Math.min(rect.width || 720, rect.height || rect.width || 720)));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.floor(size * dpr);
        this.canvas.height = Math.floor(size * dpr);
        this.canvas.style.height = `${size}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.render();
    }

    boardRect() {
        const cssSize = this.canvas.width / Math.min(window.devicePixelRatio || 1, 2);
        const margin = Math.max(28, cssSize * 0.07);
        const span = cssSize - margin * 2;
        return { x: margin, y: margin, span, step: span / (this.logic.size - 1), size: cssSize };
    }

    coordToPixel(coord) {
        const rect = this.boardRect();
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
        const gx = Math.round((x - rect.x) / rect.step);
        const gy = Math.round((y - rect.y) / rect.step);
        if (gx < 0 || gy < 0 || gx >= this.logic.size || gy >= this.logic.size) return null;
        const point = this.coordToPixel([gx, gy]);
        const distance = Math.hypot(point.x - x, point.y - y);
        return distance <= Math.max(14, rect.step * 0.44) ? [gx, gy] : null;
    }

    handlePointerMove(event) {
        this.hoverCoord = this.pixelToCoord(event);
        this.render();
    }

    handleBoardClick(event) {
        const coord = this.pixelToCoord(event);
        if (!coord) return;
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.logic.currentPlayer}.`);
            return;
        }
        const result = this.logic.tryPlay(coord, this.logic.currentPlayer);
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        this.afterLocalAction(`${this.capitalize(otherColor(this.logic.currentPlayer))} to play.`);
    }

    passTurn() {
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
        this.setStatus(message);
        this.broadcastState();
        this.updateUI();
    }

    resetGame({ broadcast = false } = {}) {
        if (this.settingsLocked && !broadcast && this.gameStarted) return;
        this.logic.reset({ size: this.boardSize(), topology: this.boundarySelect.value, dimension: 2, komi: KOMI });
        this.gameStarted = false;
        this.settingsLocked = this.network.isConnected;
        this.timeLimit = Number(this.timerSelect.value) || 0;
        this.timeRemaining = { black: this.timeLimit, white: this.timeLimit };
        this.stopTimer();
        this.hoverCoord = null;
        this.setStatus('Select an empty intersection for Black.');
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
                this.setStatus(`${this.capitalize(color)} ran out of time. ${this.capitalize(this.logic.winner)} wins.`);
                this.broadcastState();
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

        ctx.strokeStyle = 'rgba(42, 27, 14, 0.82)';
        ctx.lineWidth = Math.max(1, rect.step * 0.035);
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const p = rect.x + i * rect.step;
            ctx.moveTo(rect.x, p);
            ctx.lineTo(rect.x + rect.span, p);
            ctx.moveTo(p, rect.y);
            ctx.lineTo(p, rect.y + rect.span);
        }
        ctx.stroke();

        if (this.logic.topology === 'pbc-x') {
            ctx.strokeStyle = 'rgba(7, 89, 133, 0.82)';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 8]);
            ctx.strokeRect(rect.x - rect.step * 0.34, rect.y, rect.span + rect.step * 0.68, rect.span);
            ctx.setLineDash([]);
        }

        for (const [x, y] of this.starPoints(n)) {
            const p = this.coordToPixel([x, y]);
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(3, rect.step * 0.09), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(42, 27, 14, 0.9)';
            ctx.fill();
        }

        if (this.hoverCoord && this.logic.board[this.logic.indexFromCoord(this.hoverCoord)] === COLORS.empty && !this.logic.gameOver) {
            const p = this.coordToPixel(this.hoverCoord);
            ctx.beginPath();
            ctx.arc(p.x, p.y, rect.step * 0.36, 0, Math.PI * 2);
            ctx.fillStyle = this.logic.currentPlayer === 'black' ? 'rgba(0, 0, 0, 0.24)' : 'rgba(255, 255, 255, 0.44)';
            ctx.fill();
        }

        for (let index = 0; index < this.logic.board.length; index++) {
            const value = this.logic.board[index];
            if (!value) continue;
            const color = valueToColor(value);
            const p = this.coordToPixel(this.logic.coordFromIndex(index));
            this.drawStone(p.x, p.y, rect.step * 0.42, color);
        }
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

    starPoints(size) {
        if (size === 9) return [2, 4, 6].flatMap((x) => [2, 4, 6].map((y) => [x, y]));
        if (size === 13) return [3, 6, 9].flatMap((x) => [3, 6, 9].map((y) => [x, y]));
        return [3, 9, 15].flatMap((x) => [3, 9, 15].map((y) => [x, y]));
    }

    canActFor(color) {
        if (this.gameModeSelect.value !== 'online') return true;
        return this.network.isConnected && this.myColor === color;
    }

    lockSettings() {
        this.settingsLocked = true;
        this.sizeSelect.disabled = true;
        this.boundarySelect.disabled = true;
        this.timerSelect.disabled = true;
    }

    unlockSettingsIfLocal() {
        if (this.gameStarted || this.network.isConnected) return;
        this.settingsLocked = false;
        this.sizeSelect.disabled = false;
        this.boundarySelect.disabled = false;
        this.timerSelect.disabled = false;
    }

    updateOnlineControls() {
        const online = this.gameModeSelect.value === 'online';
        this.onlineControls.classList.toggle('active', online);
        if (!online) {
            this.network.close({ silent: true });
            this.myColor = null;
            this.onlineColorEl.textContent = 'Local pass and play';
            this.unlockSettingsIfLocal();
        }
        this.updateUI();
    }

    updateUI() {
        this.boundaryEl.textContent = this.logic.topology === 'pbc-x' ? 'PBC left-right' : 'OBC';
        this.boundaryInfoEl.textContent = this.logic.topology === 'pbc-x'
            ? 'PBC identifies the left and right edges only. Top and bottom remain open.'
            : 'OBC uses ordinary open board edges.';
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : this.logic.scoringPending ? 'Counting pending' : `${this.capitalize(this.logic.currentPlayer)} to play`;
        this.blackCapturedEl.textContent = `${this.logic.captures.black} ${this.logic.captures.black === 1 ? 'stone' : 'stones'}`;
        this.whiteCapturedEl.textContent = `${this.logic.captures.white} ${this.logic.captures.white === 1 ? 'stone' : 'stones'}`;
        this.blackTimerBox.classList.toggle('active', this.logic.currentPlayer === 'black' && !this.logic.gameOver);
        this.whiteTimerBox.classList.toggle('active', this.logic.currentPlayer === 'white' && !this.logic.gameOver);
        this.countBtn.disabled = !this.logic.scoringPending || this.logic.gameOver || (this.gameModeSelect.value === 'online' && !this.myColor);
        this.passBtn.disabled = this.logic.gameOver || this.logic.scoringPending;
        this.updateTimerDisplay();
        this.renderHistory();
        this.renderScore();
        this.render();
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

    renderScore() {
        if (!this.logic.score) {
            this.scorePanel.hidden = true;
            this.scoreResult.textContent = '';
            return;
        }
        this.scorePanel.hidden = false;
        this.scoreResult.textContent = `Black ${this.logic.score.black}, White ${this.logic.score.white} including ${this.logic.score.komi} komi. ${this.resultText()}`;
    }

    resultText() {
        if (!this.logic.gameOver) return '';
        if (this.logic.winner === 'draw') return 'Draw';
        if (this.logic.score) return `${this.capitalize(this.logic.winner)} wins by ${this.logic.score.margin}`;
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

    getNetworkSettings() {
        return {
            variant: '2dgo',
            mode: this.boundarySelect.value === 'pbc-x' ? 'pbcx' : 'obc',
            size: this.boardSize(),
            timer: Number(this.timerSelect.value) || 0
        };
    }

    exportNetworkState() {
        return {
            logic: this.logic.exportState(),
            gameStarted: this.gameStarted,
            timeLimit: this.timeLimit,
            timeRemaining: { ...this.timeRemaining },
            timerValue: Number(this.timerSelect.value) || 0
        };
    }

    importNetworkState(state) {
        if (!state?.logic) return;
        this.stopTimer();
        this.logic.importState(state.logic);
        this.sizeSelect.value = String(this.logic.size);
        this.boundarySelect.value = this.logic.topology;
        this.timerSelect.value = String(state.timerValue ?? state.timeLimit ?? 0);
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

new Go2DApp();