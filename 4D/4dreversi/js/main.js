import { ReversiGame, normalizeReversiSize, otherReversiColor } from '../../../js/reversi/ReversiGame.js';

class Reversi4DApp {
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
        this.blackScoreEl = document.getElementById('blackScore');
        this.whiteScoreEl = document.getElementById('whiteScore');
        this.blackScoreBox = document.getElementById('blackScoreBox');
        this.whiteScoreBox = document.getElementById('whiteScoreBox');
        this.historyEl = document.getElementById('moveHistoryList');
        this.selectedKey = '';
        this.hoverKey = '';
        this.logic = this.createLogic();
        this.bindEvents();
        this.updateZoomOptions();
        this.updateUI();
    }

    sizes() {
        const clamp = (value) => normalizeReversiSize(value, { fallback: 5, min: 4, max: 9 });
        return {
            nx: clamp(this.inputs.nx.value),
            ny: clamp(this.inputs.ny.value),
            nz: clamp(this.inputs.nz.value),
            nw: clamp(this.inputs.nw.value)
        };
    }

    createLogic() {
        const { nx, ny, nz, nw } = this.sizes();
        return new ReversiGame({
            topology: 'r4',
            size: nx,
            width: nx,
            height: ny,
            depth: nz,
            wSize: nw,
            maxSize: 9
        });
    }

    bindEvents() {
        Object.values(this.inputs).forEach((input) => {
            input.addEventListener('change', () => this.resetGame());
        });
        this.zoomSelect.addEventListener('change', () => this.render());
        document.getElementById('passBtn').addEventListener('click', () => this.passTurn());
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame());
        this.gridEl.addEventListener('pointerover', (event) => {
            const button = event.target.closest('button[data-coord]');
            this.hoverKey = button ? button.dataset.key : '';
            this.updateBoardHighlights();
            this.updateSelectionSummary();
        });
        this.gridEl.addEventListener('pointerleave', () => {
            this.hoverKey = '';
            this.updateBoardHighlights();
            this.updateSelectionSummary();
        });
    }

    resetGame() {
        this.logic = this.createLogic();
        this.selectedKey = '';
        this.hoverKey = '';
        this.updateZoomOptions();
        this.setStatus('New 4D Reversi game started.');
        this.updateUI();
    }

    play(coord) {
        const actor = this.logic.currentPlayer;
        const result = this.logic.play(coord);
        if (!result.ok) {
            this.selectedKey = this.logic.key(coord);
            this.setStatus(result.reason === 'illegal' ? 'That vertex does not bracket any opponent stones.' : 'Move unavailable.');
            this.updateUI();
            return;
        }
        this.selectedKey = this.logic.key(result.coord);
        this.hoverKey = '';
        this.setStatus(`${this.capitalize(actor)} flipped ${result.flipped} ${result.flipped === 1 ? 'stone' : 'stones'}.`);
        this.updateUI();
    }

    passTurn() {
        const result = this.logic.pass();
        if (!result.ok) {
            this.setStatus(result.reason === 'legal-moves' ? 'Pass is only available when the current player has no legal move.' : 'Pass unavailable.');
            this.updateUI();
            return;
        }
        this.setStatus(this.resultText());
        this.updateUI();
    }

    updateZoomOptions() {
        const current = this.zoomSelect.value || 'all';
        this.zoomSelect.innerHTML = '<option value="all">All layers</option>';
        for (let w = 0; w < this.logic.topology.wSize; w += 1) {
            for (let z = 0; z < this.logic.topology.depth; z += 1) {
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
        const counts = this.logic.counts();
        this.turnEl.textContent = this.logic.gameOver ? this.resultText() : `${this.capitalize(this.logic.currentPlayer)} to play`;
        this.blackScoreEl.textContent = `${counts.black} ${counts.black === 1 ? 'stone' : 'stones'}`;
        this.whiteScoreEl.textContent = `${counts.white} ${counts.white === 1 ? 'stone' : 'stones'}`;
        this.blackScoreBox.classList.toggle('active', this.logic.currentPlayer === 'black' && !this.logic.gameOver);
        this.whiteScoreBox.classList.toggle('active', this.logic.currentPlayer === 'white' && !this.logic.gameOver);
        document.getElementById('passBtn').disabled = this.logic.gameOver || this.logic.legalMoves(this.logic.currentPlayer).length > 0;
        this.updateSelectionSummary();
        this.renderHistory();
        this.render();
    }

    updateSelectionSummary() {
        const key = this.hoverKey || this.selectedKey;
        if (!key) {
            this.selectionEl.textContent = 'No active selection.';
            return;
        }
        const coord = key.split(',').map(Number);
        const stone = this.logic.get(coord);
        const flips = this.logic.previewMove(coord);
        if (stone) {
            this.selectionEl.textContent = `${this.capitalize(stone.color)} stone at (${coord.join(',')}).`;
        } else {
            this.selectionEl.textContent = `Empty (${coord.join(',')}): ${flips.length ? `legal, flips ${flips.length}` : 'not legal for current player'}.`;
        }
    }

    render() {
        const { width, height, depth, wSize } = this.logic.topology;
        const zoom = this.zoomSelect.value;
        const onlyLayer = zoom !== 'all' ? zoom.split(',').map(Number) : null;
        const legal = new Set(this.logic.legalMoves(this.logic.currentPlayer).map((move) => this.logic.key(move.coord)));
        const preview = this.hoverKey ? this.logic.previewMove(this.hoverKey.split(',').map(Number)) : [];
        const previewFlips = new Set(preview.map((coord) => this.logic.key(coord)));

        this.gridEl.style.gridTemplateColumns = onlyLayer ? '1fr' : `repeat(${depth}, max-content)`;
        this.gridEl.innerHTML = '';

        for (let w = 0; w < wSize; w += 1) {
            for (let z = 0; z < depth; z += 1) {
                if (onlyLayer && (onlyLayer[0] !== z || onlyLayer[1] !== w)) continue;
                const slice = document.createElement('section');
                slice.className = `slice-board${onlyLayer ? ' zoomed' : ''}`;
                slice.innerHTML = `<div class="slice-title">z=${z}, w=${w}</div>`;
                const grid = document.createElement('div');
                grid.className = 'xy-grid';
                grid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
                grid.style.gridTemplateRows = `repeat(${height}, 1fr)`;
                for (let y = 0; y < height; y += 1) {
                    for (let x = 0; x < width; x += 1) {
                        const coord = [x, y, z, w];
                        const key = this.logic.key(coord);
                        const stone = this.logic.get(coord);
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'vertex';
                        button.dataset.coord = JSON.stringify(coord);
                        button.dataset.key = key;
                        button.title = `(${coord.join(',')})`;
                        button.setAttribute('aria-label', `Point (${coord.join(',')})`);
                        button.addEventListener('click', () => this.play(coord));
                        button.classList.toggle('selected', key === this.selectedKey);
                        button.classList.toggle('hover', key === this.hoverKey);
                        button.classList.toggle('liberty', legal.has(key));
                        button.classList.toggle('group', previewFlips.has(key));
                        if (stone) {
                            const node = document.createElement('span');
                            node.className = `stone ${stone.color}`;
                            button.append(node);
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
        const legal = new Set(this.logic.legalMoves(this.logic.currentPlayer).map((move) => this.logic.key(move.coord)));
        const preview = this.hoverKey ? this.logic.previewMove(this.hoverKey.split(',').map(Number)) : [];
        const previewFlips = new Set(preview.map((coord) => this.logic.key(coord)));
        this.gridEl.querySelectorAll('button.vertex[data-key]').forEach((button) => {
            const key = button.dataset.key;
            button.classList.toggle('selected', key === this.selectedKey);
            button.classList.toggle('hover', key === this.hoverKey);
            button.classList.toggle('liberty', legal.has(key));
            button.classList.toggle('group', previewFlips.has(key));
        });
    }

    renderHistory() {
        if (!this.logic.moveHistory.length) {
            this.historyEl.innerHTML = '<div class="move-history-item muted">Game started.</div>';
            return;
        }
        this.historyEl.innerHTML = this.logic.moveHistory.slice(0, 90).map((move) => {
            if (move.type === 'move') return `<div class="move-history-item">${move.number}. ${this.capitalize(move.color)} (${move.coord.join(',')}) flipped ${move.flipped}</div>`;
            if (move.type === 'no-move-end') return `<div class="move-history-item">${this.capitalize(move.color)} has no legal moves. Final count.</div>`;
            return '';
        }).join('');
    }

    resultText() {
        if (!this.logic.gameOver) return '';
        if (this.logic.winner === 'draw') return 'Draw';
        const counts = this.logic.counts();
        return `${this.capitalize(this.logic.winner)} wins by ${Math.abs(counts.black - counts.white)}`;
    }

    setStatus(text) {
        this.statusEl.textContent = text;
    }

    capitalize(value) {
        return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
    }
}

window.reversi4dApp = new Reversi4DApp();
window.Reversi4DGame = ReversiGame;
window.otherReversiColor = otherReversiColor;
