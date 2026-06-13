import { ReversiGame, normalizeReversiSize, normalizeReversiTopology } from '../../../js/reversi/ReversiGame.js';

class Reversi3DApp {
    constructor() {
        this.canvas = document.getElementById('reversiBoard');
        this.ctx = this.canvas.getContext('2d');
        this.modeSelect = document.getElementById('spaceSelect');
        this.sizeSelect = document.getElementById('boardSizeSelect');
        this.customSizeInput = document.getElementById('customBoardSizeInput');
        this.layerGroup = document.getElementById('layerControlGroup');
        this.layerSelect = document.getElementById('layerSelect');
        this.layerInfo = document.getElementById('layerInfo');
        this.statusEl = document.getElementById('gameStatus');
        this.summaryEl = document.getElementById('moveSummary');
        this.turnEl = document.getElementById('playerTurn');
        this.modeDisplay = document.getElementById('modeDisplay');
        this.modeInfo = document.getElementById('modeInfo');
        this.blackScoreEl = document.getElementById('blackScore');
        this.whiteScoreEl = document.getElementById('whiteScore');
        this.passBtn = document.getElementById('passBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.historyEl = document.getElementById('moveHistoryList');
        this.hoverCoord = null;
        this.lastRect = null;

        this.applyUrlSettings();
        this.logic = this.createLogic();
        this.syncLayerControl();
        this.bindEvents();
        this.resize();
        this.updateUI();
    }

    applyUrlSettings() {
        const params = new URLSearchParams(window.location.search);
        const mode = normalizeReversiTopology(params.get('mode') || 'r3');
        this.modeSelect.value = ['r3', 't2', 'sphere'].includes(mode) ? mode : 'r3';
        const rawSize = Number(params.get('size'));
        if (Number.isFinite(rawSize)) this.setSizeSelection(rawSize);
    }

    setSizeSelection(value) {
        const size = normalizeReversiSize(value, { fallback: 8, max: 19 });
        const option = [...this.sizeSelect.options].find((item) => item.value === String(size));
        this.sizeSelect.value = option ? String(size) : 'custom';
        this.customSizeInput.value = String(size);
        this.updateCustomSizeVisibility();
    }

    boardSize() {
        const source = this.sizeSelect.value === 'custom' ? this.customSizeInput.value : this.sizeSelect.value;
        return normalizeReversiSize(source, { fallback: 8, max: 19 });
    }

    createLogic() {
        return new ReversiGame({
            topology: this.modeSelect.value,
            size: this.boardSize(),
            maxSize: 19
        });
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('pointermove', (event) => this.handlePointerMove(event));
        this.canvas.addEventListener('pointerleave', () => {
            this.hoverCoord = null;
            this.render();
        });
        this.canvas.addEventListener('click', (event) => this.handleBoardClick(event));
        this.modeSelect.addEventListener('change', () => this.resetGame());
        this.sizeSelect.addEventListener('change', () => {
            this.updateCustomSizeVisibility();
            this.resetGame();
        });
        this.customSizeInput.addEventListener('change', () => {
            this.setSizeSelection(this.customSizeInput.value);
            this.resetGame();
        });
        this.layerSelect.addEventListener('input', () => {
            this.updateLayerLabel();
            this.render();
        });
        this.passBtn.addEventListener('click', () => this.passTurn());
        this.newGameBtn.addEventListener('click', () => this.resetGame());
    }

    updateCustomSizeVisibility() {
        this.customSizeInput.hidden = this.sizeSelect.value !== 'custom';
    }

    syncLayerControl() {
        const r3 = this.modeSelect.value === 'r3';
        this.layerGroup.hidden = !r3;
        const max = Math.max(0, this.logic.topology.depth - 1);
        this.layerSelect.max = String(max);
        const rawLayer = Number(this.layerSelect.value);
        const current = Number.isFinite(rawLayer)
            ? Math.min(max, Math.max(0, rawLayer))
            : Math.floor(max / 2);
        this.layerSelect.value = String(current);
        this.updateLayerLabel();
    }

    updateLayerLabel() {
        this.layerInfo.textContent = `z = ${Number(this.layerSelect.value) + 1}`;
    }

    resetGame() {
        this.logic = this.createLogic();
        this.syncLayerControl();
        this.setStatus('New Reversi game started.');
        this.updateUI();
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

    handlePointerMove(event) {
        this.hoverCoord = this.coordFromEvent(event);
        this.render();
    }

    handleBoardClick(event) {
        const coord = this.coordFromEvent(event);
        if (!coord) return;
        const actor = this.logic.currentPlayer;
        const result = this.logic.play(coord);
        if (!result.ok) {
            this.setStatus(result.reason === 'illegal' ? 'That square does not bracket any opponent stones.' : 'Move unavailable.');
            this.updateUI();
            return;
        }
        this.setStatus(`${this.capitalize(actor)} flipped ${result.flipped} ${result.flipped === 1 ? 'stone' : 'stones'}.`);
        this.updateUI();
    }

    passTurn() {
        const result = this.logic.pass();
        if (!result.ok) {
            this.setStatus(result.reason === 'legal-moves' ? 'You can only pass when no legal move exists.' : 'Pass unavailable.');
            this.updateUI();
            return;
        }
        this.setStatus('Turn passed.');
        this.updateUI();
    }

    coordFromEvent(event) {
        if (!this.lastRect) return null;
        const bounds = this.canvas.getBoundingClientRect();
        const x = (event.clientX - bounds.left) * (this.canvas.clientWidth / bounds.width);
        const y = (event.clientY - bounds.top) * (this.canvas.clientHeight / bounds.height);
        const col = Math.floor((x - this.lastRect.left) / this.lastRect.step);
        const row = Math.floor((y - this.lastRect.top) / this.lastRect.step);
        if (col < 0 || row < 0 || col >= this.logic.topology.width || row >= this.logic.topology.height) return null;
        if (this.logic.topology.dimension === 3) return [col, row, Number(this.layerSelect.value) || 0];
        return [col, row];
    }

    boardRect() {
        const width = this.canvas.clientWidth || 720;
        const height = this.canvas.clientHeight || width;
        const margin = Math.max(18, Math.min(width, height) * 0.045);
        const usable = Math.min(width, height) - margin * 2;
        const step = usable / this.logic.topology.width;
        return {
            left: (width - step * this.logic.topology.width) / 2,
            top: (height - step * this.logic.topology.height) / 2,
            step
        };
    }

    visibleCoords() {
        if (this.logic.topology.dimension !== 3) return this.logic.topology.allCoords();
        const z = Number(this.layerSelect.value) || 0;
        const coords = [];
        for (let y = 0; y < this.logic.topology.height; y += 1) {
            for (let x = 0; x < this.logic.topology.width; x += 1) coords.push([x, y, z]);
        }
        return coords;
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
        for (const coord of this.visibleCoords()) {
            const [x, y] = coord;
            const px = rect.left + x * rect.step;
            const py = rect.top + y * rect.step;
            ctx.fillStyle = (x + y) % 2 === 0 ? '#2f5f69' : '#204e58';
            ctx.fillRect(px, py, rect.step, rect.step);
            ctx.strokeStyle = 'rgba(5, 12, 14, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, rect.step, rect.step);
        }
        this.drawTopologyHints(rect);
        for (const coord of this.visibleCoords()) {
            const stone = this.logic.get(coord);
            if (stone) this.drawStone(coord, stone.color, rect);
        }
        for (const move of legalMoves.values()) {
            if (this.isCoordVisible(move.coord)) this.drawLegalDot(move.coord, rect);
        }
        if (this.hoverCoord && legalMoves.has(this.logic.key(this.hoverCoord))) this.drawHover(this.hoverCoord, rect);
        this.drawLayerCaption(rect);
    }

    isCoordVisible(coord) {
        return this.logic.topology.dimension !== 3 || coord[2] === Number(this.layerSelect.value);
    }

    drawTopologyHints(rect) {
        const ctx = this.ctx;
        const right = rect.left + this.logic.topology.width * rect.step;
        const bottom = rect.top + this.logic.topology.height * rect.step;
        ctx.save();
        ctx.strokeStyle = this.modeSelect.value === 'sphere' ? 'rgba(242, 196, 100, 0.78)' : 'rgba(72, 199, 244, 0.68)';
        ctx.lineWidth = Math.max(1.5, rect.step * 0.035);
        ctx.setLineDash([rect.step * 0.35, rect.step * 0.22]);
        if (this.modeSelect.value === 't2') {
            ctx.strokeRect(rect.left - 5, rect.top - 5, right - rect.left + 10, bottom - rect.top + 10);
        } else if (this.modeSelect.value === 'sphere') {
            ctx.beginPath();
            ctx.moveTo(rect.left - 5, rect.top);
            ctx.lineTo(rect.left - 5, bottom);
            ctx.moveTo(right + 5, rect.top);
            ctx.lineTo(right + 5, bottom);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawLayerCaption(rect) {
        if (this.logic.topology.dimension !== 3) return;
        this.ctx.fillStyle = 'rgba(224, 247, 255, 0.72)';
        this.ctx.font = '700 13px Inter, sans-serif';
        this.ctx.fillText(`R3 z-layer ${Number(this.layerSelect.value) + 1}/${this.logic.topology.depth}`, rect.left, Math.max(16, rect.top - 8));
    }

    drawStone(coord, color, rect) {
        const [x, y] = coord;
        const cx = rect.left + (x + 0.5) * rect.step;
        const cy = rect.top + (y + 0.5) * rect.step;
        const radius = rect.step * 0.39;
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
    }

    drawLegalDot(coord, rect) {
        const [x, y] = coord;
        const cx = rect.left + (x + 0.5) * rect.step;
        const cy = rect.top + (y + 0.5) * rect.step;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, Math.max(4, rect.step * 0.11), 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(242, 196, 100, 0.82)';
        this.ctx.fill();
    }

    drawHover(coord, rect) {
        const [x, y] = coord;
        this.ctx.strokeStyle = 'rgba(224, 247, 255, 0.92)';
        this.ctx.lineWidth = Math.max(2, rect.step * 0.05);
        this.ctx.strokeRect(rect.left + x * rect.step + 2, rect.top + y * rect.step + 2, rect.step - 4, rect.step - 4);
    }

    updateUI() {
        this.updateCustomSizeVisibility();
        this.syncLayerControl();
        const counts = this.logic.counts();
        this.blackScoreEl.textContent = counts.black;
        this.whiteScoreEl.textContent = counts.white;
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : `${this.capitalize(this.logic.currentPlayer)} to play`;
        this.summaryEl.textContent = `${counts.black + counts.white} stones on board, ${counts.empty} empty`;
        this.passBtn.disabled = this.logic.gameOver || this.logic.legalMoves(this.logic.currentPlayer).length > 0;
        const mode = this.modeSelect.value;
        this.modeDisplay.textContent = mode === 'sphere' ? 'S2' : mode === 't2' ? 'T2' : 'R3';
        this.modeInfo.textContent = mode === 'sphere'
            ? 'S2 uses longitude wrapping and latitude-ring rows; rays stop at the north and south caps.'
            : mode === 't2'
                ? 'T2 wraps both board directions on a torus surface.'
                : 'R3 uses a cubic graph. Moves can bracket along 26 topology-aware ray directions.';
        if (this.logic.gameOver) this.setStatus(this.resultText());
        this.renderHistory();
        this.render();
    }

    renderHistory() {
        if (!this.logic.moveHistory.length) {
            this.historyEl.innerHTML = '<div class="move-history-item muted">Game started.</div>';
            return;
        }
        this.historyEl.innerHTML = this.logic.moveHistory.slice(0, 80).map((move) => {
            if (move.type === 'move') return `<div class="move-history-item">${move.number}. ${this.capitalize(move.color)} (${move.coord.map((v) => v + 1).join(',')}) flipped ${move.flipped}</div>`;
            if (move.type === 'pass') return `<div class="move-history-item">${this.capitalize(move.color)} ${move.automatic ? 'auto-passed' : 'passed'}</div>`;
            return '';
        }).join('');
    }

    resultText() {
        if (!this.logic.gameOver) return '';
        if (this.logic.winner === 'draw') return 'Draw';
        const counts = this.logic.counts();
        const margin = Math.abs(counts.black - counts.white);
        return `${this.capitalize(this.logic.winner)} wins by ${margin}`;
    }

    setStatus(text) {
        this.statusEl.textContent = text;
    }

    capitalize(value) {
        return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
    }
}

window.reversi3dApp = new Reversi3DApp();
