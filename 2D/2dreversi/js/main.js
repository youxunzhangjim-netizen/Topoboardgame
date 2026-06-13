import { ReversiGame, normalizeReversiSize, normalizeReversiTopology } from '../../../js/reversi/ReversiGame.js';

class Reversi2DApp {
    constructor() {
        this.canvas = document.getElementById('reversiBoard');
        this.ctx = this.canvas.getContext('2d');
        this.sizeSelect = document.getElementById('boardSizeSelect');
        this.customSizeInput = document.getElementById('customBoardSizeInput');
        this.boundarySelect = document.getElementById('boundarySelect');
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
        this.hoverCoord = null;
        this.lastRect = null;

        this.applyUrlSettings();
        this.logic = this.createLogic();
        this.bindEvents();
        this.resize();
        this.updateUI();
    }

    applyUrlSettings() {
        const params = new URLSearchParams(window.location.search);
        const mode = normalizeReversiTopology(params.get('mode') || params.get('boundary') || 'open2d');
        this.boundarySelect.value = ['open2d', 'pbc', 'klein', 'random'].includes(mode) ? mode : 'open2d';
        const size = params.get('size');
        if (size !== null && size.trim() !== '' && Number.isFinite(Number(size))) this.setSizeSelection(size);
    }

    setSizeSelection(value) {
        const size = normalizeReversiSize(value, { fallback: 12, max: 30 });
        const option = [...this.sizeSelect.options].find((item) => item.value === String(size));
        this.sizeSelect.value = option ? String(size) : 'custom';
        this.customSizeInput.value = String(size);
        this.updateCustomSizeVisibility();
    }

    boardSize() {
        const source = this.sizeSelect.value === 'custom' ? this.customSizeInput.value : this.sizeSelect.value;
        return normalizeReversiSize(source, { fallback: 12, max: 30 });
    }

    createLogic() {
        return new ReversiGame({
            topology: this.boundarySelect.value,
            size: this.boardSize(),
            maxSize: 30
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
        this.sizeSelect.addEventListener('change', () => {
            this.updateCustomSizeVisibility();
            this.resetGame();
        });
        this.customSizeInput.addEventListener('change', () => {
            this.setSizeSelection(this.customSizeInput.value);
            this.resetGame();
        });
        this.boundarySelect.addEventListener('change', () => this.resetGame());
        this.passBtn.addEventListener('click', () => this.passTurn());
        this.newGameBtn.addEventListener('click', () => this.resetGame());
    }

    updateCustomSizeVisibility() {
        this.customSizeInput.hidden = this.sizeSelect.value !== 'custom';
    }

    resetGame() {
        this.logic = this.createLogic();
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

        for (let y = 0; y < n; y += 1) {
            for (let x = 0; x < n; x += 1) {
                const px = rect.left + x * rect.step;
                const py = rect.top + y * rect.step;
                ctx.fillStyle = (x + y) % 2 === 0 ? '#2f6b55' : '#245745';
                ctx.fillRect(px, py, rect.step, rect.step);
                ctx.strokeStyle = 'rgba(5, 12, 14, 0.58)';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, rect.step, rect.step);
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

    drawTopologyHints(rect) {
        const ctx = this.ctx;
        const right = rect.left + this.logic.topology.width * rect.step;
        const bottom = rect.top + this.logic.topology.height * rect.step;
        ctx.save();
        ctx.strokeStyle = this.boundarySelect.value === 'klein' ? 'rgba(242, 196, 100, 0.82)' : this.boundarySelect.value === 'random' ? 'rgba(216, 180, 254, 0.86)' : 'rgba(72, 199, 244, 0.68)';
        ctx.lineWidth = Math.max(1.5, rect.step * 0.035);
        ctx.setLineDash([rect.step * 0.35, rect.step * 0.22]);
        if (this.boundarySelect.value === 'pbc') {
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
            ctx.globalAlpha = 0.62;
            ctx.lineWidth = Math.max(1, rect.step * 0.018);
            for (const link of this.logic.topology.randomBoundaryLinks(30)) {
                const from = {
                    x: rect.left + (link.from[0] + 0.5) * rect.step,
                    y: rect.top + (link.from[1] + 0.5) * rect.step
                };
                const to = {
                    x: rect.left + (link.to[0] + 0.5) * rect.step,
                    y: rect.top + (link.to[1] + 0.5) * rect.step
                };
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            }
        }
        ctx.restore();
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
        this.ctx.fillStyle = 'rgba(242, 196, 100, 0.8)';
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
        const counts = this.logic.counts();
        this.blackScoreEl.textContent = counts.black;
        this.whiteScoreEl.textContent = counts.white;
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : `${this.capitalize(this.logic.currentPlayer)} to play`;
        this.summaryEl.textContent = `${counts.black + counts.white} stones on board, ${counts.empty} empty`;
        this.passBtn.disabled = this.logic.gameOver || this.logic.legalMoves(this.logic.currentPlayer).length > 0;
        const topology = this.boundarySelect.value;
        this.boundaryEl.textContent = topology === 'random' ? '2D RBC' : topology === 'klein' ? 'Klein' : topology === 'pbc' ? 'PBC x/y' : 'Standard';
        this.boundaryInfoEl.textContent = topology === 'random'
            ? '2D RBC uses one fixed random map from each boundary exit to another boundary square. The map stays static for this game.'
            : topology === 'klein'
            ? 'Klein bottle identifies left-right normally and top-bottom with x flipped.'
            : topology === 'pbc'
                ? 'PBC identifies both left-right and top-bottom edges.'
                : 'Standard uses ordinary open board edges.';
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
            if (move.type === 'no-move-end') return `<div class="move-history-item">${this.capitalize(move.color)} has no legal moves. Final count.</div>`;
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

window.reversi2dApp = new Reversi2DApp();
