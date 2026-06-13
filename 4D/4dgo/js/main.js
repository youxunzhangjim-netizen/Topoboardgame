import { COLORS, FLAT_4D_GO_TOPOLOGY, Flat4DGoGame, otherColor, valueToColor } from './Flat4DGo.js';

const KOMI = 7.5;

class Go4DApp {
    constructor() {
        this.gridEl = document.getElementById('sliceGrid');
        this.inputs = {
            nx: document.getElementById('nxInput'),
            ny: document.getElementById('nyInput'),
            nz: document.getElementById('nzInput'),
            nw: document.getElementById('nwInput')
        };
        this.zoomSelect = document.getElementById('zoomLayerSelect');
        this.statusEl = document.getElementById('gameStatus');
        this.selectionEl = document.getElementById('selectionStatus');
        this.turnEl = document.getElementById('playerTurn');
        this.blackCapturedEl = document.getElementById('blackCaptured');
        this.whiteCapturedEl = document.getElementById('whiteCaptured');
        this.blackTimerBox = document.getElementById('blackTimerBox');
        this.whiteTimerBox = document.getElementById('whiteTimerBox');
        this.historyEl = document.getElementById('moveHistoryList');
        this.scorePanel = document.getElementById('scorePanel');
        this.scoreResult = document.getElementById('scoreResult');
        this.selectedIndex = -1;
        this.hoverIndex = -1;
        this.logic = this.createLogic();
        this.bindEvents();
        this.updateZoomOptions();
        this.updateUI();
    }

    sizes() {
        const clamp = (value, min, max) => Math.min(max, Math.max(min, Math.floor(Number(value) || min)));
        return {
            nx: clamp(this.inputs.nx.value, 2, 9),
            ny: clamp(this.inputs.ny.value, 2, 9),
            nz: clamp(this.inputs.nz.value, 1, 9),
            nw: clamp(this.inputs.nw.value, 1, 9)
        };
    }

    createLogic() {
        return new Flat4DGoGame({ ...this.sizes(), komi: KOMI });
    }

    bindEvents() {
        Object.values(this.inputs).forEach((input) => {
            input.addEventListener('change', () => this.resetGame());
        });
        this.zoomSelect.addEventListener('change', () => this.render());
        document.getElementById('passBtn').addEventListener('click', () => this.passTurn());
        document.getElementById('countBtn').addEventListener('click', () => this.agreeCount());
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('surrenderBtn').addEventListener('click', () => this.surrender());
        this.gridEl.addEventListener('pointerover', (event) => {
            const button = event.target.closest('button[data-coord]');
            this.hoverIndex = button ? this.logic.indexFromCoord(JSON.parse(button.dataset.coord)) : -1;
            this.updateBoardHighlights();
        });
        this.gridEl.addEventListener('pointerleave', () => {
            this.hoverIndex = -1;
            this.updateBoardHighlights();
        });
    }

    resetGame() {
        this.logic = this.createLogic();
        this.selectedIndex = -1;
        this.hoverIndex = -1;
        this.updateZoomOptions();
        this.setStatus('New 4D Go game started.');
        this.updateUI();
    }

    play(coord) {
        const result = this.logic.tryPlay(coord, this.logic.currentPlayer);
        if (!result.ok) {
            this.setStatus(result.error);
            this.select(coord);
            return;
        }
        this.selectedIndex = this.logic.indexFromCoord(coord);
        this.setStatus(`${this.capitalize(otherColor(this.logic.currentPlayer))} played (${coord.join(',')}).`);
        this.updateUI();
    }

    select(coord) {
        this.selectedIndex = this.logic.indexFromCoord(coord);
        this.updateUI();
    }

    passTurn() {
        const color = this.logic.currentPlayer;
        const result = this.logic.pass(color);
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        this.setStatus(this.logic.scoringPending ? 'Two passes. Both players must agree to count.' : `${this.capitalize(this.logic.currentPlayer)} to play.`);
        this.updateUI();
    }

    agreeCount() {
        const color = !this.logic.countAgreements.black ? 'black' : 'white';
        const result = this.logic.agreeToCount(color);
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        this.setStatus(this.logic.gameOver ? this.resultText() : `${this.capitalize(color)} agreed. Waiting for ${this.capitalize(otherColor(color))}.`);
        this.updateUI();
    }

    surrender() {
        const color = this.logic.currentPlayer;
        this.logic.gameOver = true;
        this.logic.winner = otherColor(color);
        this.logic.moveHistory.unshift({ type: 'surrender', color, number: this.logic.moveNumber });
        this.setStatus(`${this.capitalize(color)} surrendered. ${this.capitalize(this.logic.winner)} wins.`);
        this.updateUI();
    }

    updateZoomOptions() {
        const current = this.zoomSelect.value || 'all';
        this.zoomSelect.innerHTML = '<option value="all">All layers</option>';
        for (let w = 0; w < this.logic.sizes.nw; w++) {
            for (let z = 0; z < this.logic.sizes.nz; z++) {
                const value = `${z},${w}`;
                const option = document.createElement('option');
                option.value = value;
                option.textContent = `z=${z}, w=${w}`;
                this.zoomSelect.append(option);
            }
        }
        this.zoomSelect.value = [...this.zoomSelect.options].some((option) => option.value === current) ? current : 'all';
    }

    updateUI() {
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : `${this.capitalize(this.logic.currentPlayer)} to play`;
        this.blackCapturedEl.textContent = `${this.logic.captures.black} ${this.logic.captures.black === 1 ? 'stone' : 'stones'}`;
        this.whiteCapturedEl.textContent = `${this.logic.captures.white} ${this.logic.captures.white === 1 ? 'stone' : 'stones'}`;
        this.blackTimerBox.classList.toggle('active', this.logic.currentPlayer === 'black' && !this.logic.gameOver);
        this.whiteTimerBox.classList.toggle('active', this.logic.currentPlayer === 'white' && !this.logic.gameOver);
        this.renderSelectionSummary();
        this.renderHistory();
        this.renderScore();
        this.render();
    }

    renderSelectionSummary() {
        if (this.selectedIndex < 0) {
            this.selectionEl.textContent = 'No active selection.';
            return;
        }
        const coord = this.logic.coordFromIndex(this.selectedIndex);
        const value = this.logic.board[this.selectedIndex];
        if (!value) {
            this.selectionEl.textContent = `Selected empty (${coord.join(',')}).`;
            return;
        }
        const group = this.logic.getGroupAndLiberties(this.logic.board, this.selectedIndex);
        const split = this.libertyAxisSummary(group);
        this.selectionEl.textContent = `${this.capitalize(valueToColor(value))} group at (${coord.join(',')}): ${group.group.size} stones, ${group.liberties.size} liberties (${split.visibleAxes} in x/y/z, ${split.wAxis} in w).`;
    }

    libertyAxisSummary(group) {
        const xyz = new Set();
        const wAxis = new Set();
        for (const liberty of group.liberties) {
            const libertyCoord = this.logic.coordFromIndex(liberty);
            for (const stone of group.group) {
                const stoneCoord = this.logic.coordFromIndex(stone);
                const diffs = libertyCoord.map((value, axis) => value - stoneCoord[axis]);
                const changedAxes = diffs.reduce((axes, diff, axis) => diff === 0 ? axes : [...axes, axis], []);
                if (changedAxes.length !== 1) continue;
                if (changedAxes[0] === 3) wAxis.add(liberty);
                else xyz.add(liberty);
            }
        }
        return { visibleAxes: xyz.size, wAxis: wAxis.size };
    }

    selectionSets() {
        const group = new Set();
        const liberties = new Set();
        if (this.selectedIndex >= 0 && this.logic.board[this.selectedIndex]) {
            const info = this.logic.getGroupAndLiberties(this.logic.board, this.selectedIndex);
            for (const index of info.group) group.add(index);
            for (const index of info.liberties) liberties.add(index);
        }
        return { group, liberties };
    }

    render() {
        const { nx, ny, nz, nw } = this.logic.sizes;
        const zoom = this.zoomSelect.value;
        const onlyLayer = zoom !== 'all' ? zoom.split(',').map(Number) : null;
        const { group, liberties } = this.selectionSets();
        this.gridEl.style.gridTemplateColumns = onlyLayer ? '1fr' : `repeat(${nz}, max-content)`;
        this.gridEl.innerHTML = '';

        for (let w = 0; w < nw; w++) {
            for (let z = 0; z < nz; z++) {
                if (onlyLayer && (onlyLayer[0] !== z || onlyLayer[1] !== w)) continue;
                const slice = document.createElement('section');
                slice.className = `slice-board${onlyLayer ? ' zoomed' : ''}`;
                slice.innerHTML = `<div class="slice-title">z=${z}, w=${w}</div>`;
                const grid = document.createElement('div');
                grid.className = 'xy-grid';
                grid.style.gridTemplateColumns = `repeat(${nx}, 1fr)`;
                grid.style.gridTemplateRows = `repeat(${ny}, 1fr)`;
                for (let y = 0; y < ny; y++) {
                    for (let x = 0; x < nx; x++) {
                        const coord = [x, y, z, w];
                        const index = this.logic.indexFromCoord(coord);
                        const value = this.logic.board[index];
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'vertex';
                        button.dataset.coord = JSON.stringify(coord);
                        button.title = `(${coord.join(',')})`;
                        button.setAttribute('aria-label', `Point (${coord.join(',')})`);
                        button.addEventListener('click', () => this.play(coord));
                        button.classList.toggle('selected', index === this.selectedIndex);
                        button.classList.toggle('hover', index === this.hoverIndex);
                        button.classList.toggle('group', group.has(index));
                        button.classList.toggle('liberty', liberties.has(index));
                        if (value) {
                            const stone = document.createElement('span');
                            stone.className = `stone ${valueToColor(value)}`;
                            button.append(stone);
                        }
                        grid.append(button);
                    }
                }
                slice.append(grid);
                this.gridEl.append(slice);
            }
        }
    }

    updateBoardHighlights() {
        const { group, liberties } = this.selectionSets();
        this.gridEl.querySelectorAll('button.vertex[data-coord]').forEach((button) => {
            const index = this.logic.indexFromCoord(JSON.parse(button.dataset.coord));
            button.classList.toggle('selected', index === this.selectedIndex);
            button.classList.toggle('hover', index === this.hoverIndex);
            button.classList.toggle('group', group.has(index));
            button.classList.toggle('liberty', liberties.has(index));
        });
    }

    renderHistory() {
        if (!this.logic.moveHistory.length) {
            this.historyEl.innerHTML = '<div class="move-history-item muted">Game started.</div>';
            return;
        }
        this.historyEl.innerHTML = this.logic.moveHistory.slice(0, 90).map((move) => {
            if (move.type === 'play') return `<div class="move-history-item">${move.number}. ${this.capitalize(move.color)} (${move.coord.join(',')})${move.captured ? ` captures ${move.captured}` : ''}</div>`;
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

    setStatus(text) {
        this.statusEl.textContent = text;
    }

    capitalize(value) {
        return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
    }
}

window.go4dApp = new Go4DApp();
window.FLAT_4D_GO_TOPOLOGY = FLAT_4D_GO_TOPOLOGY;
