import { ReversiGame, normalizeReversiSize, otherReversiColor } from '../../../js/reversi/ReversiGame.js';
import { FirebaseStateNetworkManager } from '../../../js/FirebaseStateNetworkManager.js';
import { installProjectedBoardTouchControls } from '../../../js/shared/ProjectedBoardTouchControls.js';
import { installGameUILocalizer } from '../../../js/shared/GameUILocalizer.js';

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
        this.viewModeSelect = document.getElementById('viewModeSelect');
        this.wSliceInput = document.getElementById('wSliceInput');
        this.wSliceValue = document.getElementById('wSliceValue');
        this.wSliceGroup = document.getElementById('wSliceGroup');
        this.wSliceButtons = document.getElementById('wSliceButtons');
        this.stackedViewControls = document.getElementById('stackedViewControls');
        this.statusEl = document.getElementById('gameStatus');
        this.selectionEl = document.getElementById('selectionStatus');
        this.turnEl = document.getElementById('playerTurn');
        this.blackScoreEl = document.getElementById('blackScore');
        this.whiteScoreEl = document.getElementById('whiteScore');
        this.blackScoreBox = document.getElementById('blackScoreBox');
        this.whiteScoreBox = document.getElementById('whiteScoreBox');
        this.historyEl = document.getElementById('moveHistoryList');
        this.moveChoiceButtons = document.getElementById('moveChoiceButtons');
        this.moveChoiceSummary = document.getElementById('moveChoiceSummary');
        this.gameModeSelect = document.getElementById('gameModeSelect');
        this.onlineControls = document.getElementById('onlineControls');
        this.onlineColorEl = document.getElementById('onlineColorStatus');
        this.roomIdInput = document.getElementById('roomIdInput');
        this.shareLinkInput = document.getElementById('shareLinkInput');
        this.copyLinkBtn = document.getElementById('copyLinkBtn');
        this.chatMessagesEl = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.chatSendBtn = document.getElementById('chatSendBtn');
        this.timeEvolutionSelect = document.getElementById('timeEvolutionSelect');
        this.timeLifetimeInput = document.getElementById('timeLifetimeInput');
        this.noiseModeSelect = document.getElementById('noiseModeSelect');
        this.noiseRateInput = document.getElementById('noiseRateInput');
        this.noisePeriodInput = document.getElementById('noisePeriodInput');
        this.myColor = null;
        this.selectedKey = '';
        this.hoverKey = '';
        this.pieceAges = {};
        this.noiseTick = 0;
        this.view = { rotX: -26, rotY: 32, rotZ: 0, zoom: 1, drag: null };
        this.viewControls = {
            rotX: document.getElementById('viewRotateX'),
            rotY: document.getElementById('viewRotateY'),
            rotZ: document.getElementById('viewRotateZ'),
            zoom: document.getElementById('viewZoom'),
            reset: document.getElementById('viewResetButton')
        };
        this.suppressClickUntil = 0;
        this.logic = this.createLogic();
        this.network = new FirebaseStateNetworkManager(this, { gameKey: this.onlineGameKey(), matchKey: this.onlineMatchKey() });
        this.bindEvents();
        this.updateZoomOptions();
        this.updateUI();
        this.tryJoinSharedRoomFromUrl();
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
                    if (stone && (this.pieceAges[this.logic.key(coord)] || 1) > settings.lifetime) this.logic.delete(coord);
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
                    } else if (settings.noiseMode === 'random-birth' && !stone && Math.random() < settings.noiseRate * 0.02) {
                        this.logic.set(coord, { color: this.logic.currentPlayer });
                    }
                }
            }
        }
        this.syncPieceAges();
    }

    bindEvents() {
        Object.values(this.inputs).forEach((input) => {
            input.addEventListener('change', () => this.resetGame());
        });
        this.dynamicControls().forEach((control) => control.addEventListener('change', () => this.resetGame()));
        this.zoomSelect.addEventListener('change', () => this.render());
        this.viewModeSelect?.addEventListener('change', () => {
            this.zoomSelect.value = 'all';
            this.updateViewControls();
            this.render();
        });
        this.wSliceInput?.addEventListener('input', () => {
            this.updateViewControls();
            this.render();
        });
        document.getElementById('passBtn').addEventListener('click', () => this.passTurn());
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame({ broadcast: true }));
        this.gameModeSelect?.addEventListener('change', () => this.updateOnlineControls());
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
        this.installViewControls();
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

    installViewControls() {
        const syncView = () => {
            this.view.rotX = Number(this.viewControls.rotX?.value ?? this.view.rotX);
            this.view.rotY = Number(this.viewControls.rotY?.value ?? this.view.rotY);
            this.view.rotZ = Number(this.viewControls.rotZ?.value ?? this.view.rotZ);
            this.view.zoom = Math.max(0.35, Math.min(2.8, Number(this.viewControls.zoom?.value ?? this.view.zoom)));
            this.render();
        };
        for (const control of [this.viewControls.rotX, this.viewControls.rotY, this.viewControls.rotZ, this.viewControls.zoom]) {
            control?.addEventListener('input', syncView);
        }
        this.viewControls.reset?.addEventListener('click', () => {
            Object.assign(this.view, { rotX: -26, rotY: 32, rotZ: 0, zoom: 1, drag: null });
            if (this.viewControls.rotX) this.viewControls.rotX.value = String(this.view.rotX);
            if (this.viewControls.rotY) this.viewControls.rotY.value = String(this.view.rotY);
            if (this.viewControls.rotZ) this.viewControls.rotZ.value = String(this.view.rotZ);
            if (this.viewControls.zoom) this.viewControls.zoom.value = String(this.view.zoom);
            this.render();
        });
        this.gridEl.addEventListener('wheel', (event) => {
            if (this.viewModeSelect?.value !== 'stacked_4d') return;
            event.preventDefault();
            const factor = event.deltaY < 0 ? 1.08 : 0.92;
            this.view.zoom = Math.max(0.35, Math.min(2.8, this.view.zoom * factor));
            if (this.viewControls.zoom) this.viewControls.zoom.value = String(this.view.zoom.toFixed(2));
            this.render();
        }, { passive: false });
        installProjectedBoardTouchControls({
            element: this.gridEl,
            view: this.view,
            isEnabled: () => this.viewModeSelect?.value === 'stacked_4d',
            rotationScale: 0.22,
            syncControls: () => {
                if (this.viewControls.rotX) this.viewControls.rotX.value = String(Math.round(this.view.rotX));
                if (this.viewControls.rotY) this.viewControls.rotY.value = String(Math.round(this.view.rotY));
                if (this.viewControls.zoom) this.viewControls.zoom.value = String(this.view.zoom.toFixed(2));
            },
            render: () => this.render(),
            suppressClick: () => { this.suppressClickUntil = performance.now() + 180; }
        });
    }

    resetGame({ broadcast = false } = {}) {
        this.logic = this.createLogic();
        this.selectedKey = '';
        this.hoverKey = '';
        this.pieceAges = {};
        this.noiseTick = 0;
        this.updateZoomOptions();
        this.setStatus('New 4D Reversi game started.');
        this.updateUI();
        if (broadcast) this.broadcastState();
    }

    play(coord) {
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.capitalize(this.logic.currentPlayer)}.`);
            return;
        }
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
        this.applyTimeEvolutionAndNoise();
        this.setStatus(`${this.capitalize(actor)} flipped ${result.flipped} ${result.flipped === 1 ? 'stone' : 'stones'}.`);
        this.updateUI();
        this.broadcastState();
    }

    passTurn() {
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.capitalize(this.logic.currentPlayer)}.`);
            return;
        }
        const result = this.logic.pass();
        if (!result.ok) {
            this.setStatus(result.reason === 'legal-moves' ? 'Pass is only available when the current player has no legal move.' : 'Pass unavailable.');
            this.updateUI();
            return;
        }
        this.setStatus(this.resultText());
        this.updateUI();
        this.broadcastState();
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
        if (this.wSliceInput) {
            this.wSliceInput.max = String(Math.max(0, this.logic.topology.wSize - 1));
            this.wSliceInput.value = String(Math.min(Number(this.wSliceInput.value) || 0, this.logic.topology.wSize - 1));
        }
        this.updateViewControls();
    }

    updateViewControls() {
        const is3DSlice = this.viewModeSelect?.value === 'w_slice';
        const isStacked = this.viewModeSelect?.value === 'stacked_4d';
        if (this.wSliceGroup) this.wSliceGroup.hidden = !is3DSlice;
        if (this.stackedViewControls) this.stackedViewControls.hidden = !isStacked;
        if (this.wSliceValue && this.wSliceInput) this.wSliceValue.textContent = this.wSliceInput.value;
        this.renderWSliceButtons();
    }

    renderWSliceButtons() {
        if (!this.wSliceButtons || !this.wSliceInput) return;
        const count = this.logic?.topology?.wSize || 1;
        this.wSliceButtons.replaceChildren(...Array.from({ length: count }, (_, w) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = `w=${w}`;
            button.setAttribute('aria-pressed', String(Number(this.wSliceInput.value) === w));
            button.addEventListener('click', () => {
                this.wSliceInput.value = String(w);
                this.zoomSelect.value = 'all';
                this.updateViewControls();
                this.render();
            });
            return button;
        }));
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
        this.renderMoveChoices();
        this.renderHistory();
        this.render();
    }

    renderMoveChoices() {
        if (!this.moveChoiceButtons) return;
        const moves = this.logic.gameOver ? [] : this.logic.legalMoves(this.logic.currentPlayer);
        const isZh = document.documentElement.lang.toLowerCase().startsWith('zh');
        if (this.moveChoiceSummary) {
            this.moveChoiceSummary.textContent = isZh
                ? `${moves.length} 個可用走法`
                : `${moves.length} available`;
        }
        this.moveChoiceButtons.replaceChildren(...moves.slice(0, 40).map((move) => {
            const coord = move.coord || move;
            const flips = this.logic.previewMove(coord).length;
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = `(${coord.join(', ')}) · ${flips}`;
            button.title = isZh
                ? `翻轉 ${flips} 枚棋子`
                : `${flips} ${flips === 1 ? 'flip' : 'flips'}`;
            button.addEventListener('click', () => this.play(coord));
            return button;
        }));
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
        const isStacked = this.viewModeSelect?.value === 'stacked_4d';
        if (isStacked) {
            this.renderStacked4D();
            return;
        }
        const is3DSlice = this.viewModeSelect?.value === 'w_slice';
        const onlyLayer = zoom !== 'all' ? zoom.split(',').map(Number) : null;
        const visibleW = is3DSlice ? Number(this.wSliceInput?.value || 0) : null;
        const legal = new Set(this.logic.legalMoves(this.logic.currentPlayer).map((move) => this.logic.key(move.coord)));
        const preview = this.hoverKey ? this.logic.previewMove(this.hoverKey.split(',').map(Number)) : [];
        const previewFlips = new Set(preview.map((coord) => this.logic.key(coord)));

        this.gridEl.className = 'slice-grid';
        this.gridEl.style.gridTemplateColumns = onlyLayer ? '1fr' : `repeat(${depth}, max-content)`;
        this.gridEl.style.minHeight = '';
        this.gridEl.innerHTML = '';

        for (let w = 0; w < wSize; w += 1) {
            for (let z = 0; z < depth; z += 1) {
                if (visibleW !== null && w !== visibleW) continue;
                if (onlyLayer && (onlyLayer[0] !== z || onlyLayer[1] !== w)) continue;
                const slice = document.createElement('section');
                slice.className = `slice-board${onlyLayer ? ' zoomed' : ''}`;
                slice.innerHTML = `<div class="slice-title">z=${z}, w=${w}</div>`;
                slice.querySelector('.slice-title').addEventListener('click', () => {
                    this.zoomSelect.value = `${z},${w}`;
                    this.render();
                });
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

    renderStacked4D() {
        const { width, height, depth, wSize } = this.logic.topology;
        const legal = new Set(this.logic.legalMoves(this.logic.currentPlayer).map((move) => this.logic.key(move.coord)));
        const preview = this.hoverKey ? this.logic.previewMove(this.hoverKey.split(',').map(Number)) : [];
        const previewFlips = new Set(preview.map((coord) => this.logic.key(coord)));
        this.gridEl.className = 'slice-grid reversi4d-projection';
        this.gridEl.style.gridTemplateColumns = '';
        this.gridEl.style.minHeight = 'clamp(480px, 70vh, 760px)';
        this.gridEl.innerHTML = '';
        const rect = this.gridEl.getBoundingClientRect();
        const boardWidth = Math.max(320, rect.width || this.gridEl.clientWidth || 720);
        const boardHeight = Math.max(480, rect.height || this.gridEl.clientHeight || 540);
        const coords = [];
        for (let w = 0; w < wSize; w += 1) {
            for (let z = 0; z < depth; z += 1) {
                for (let y = 0; y < height; y += 1) {
                    for (let x = 0; x < width; x += 1) coords.push([x, y, z, w]);
                }
            }
        }
        const projected = new Map(coords.map((coord) => [
            this.logic.key(coord),
            { coord, ...this.projectCoord(coord, boardWidth, boardHeight) }
        ]));
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'reversi4d-edge-layer');
        svg.setAttribute('viewBox', `0 0 ${boardWidth} ${boardHeight}`);
        for (const item of projected.values()) {
            for (let axis = 0; axis < 4; axis += 1) {
                const next = [...item.coord];
                next[axis] += 1;
                const other = projected.get(this.logic.key(next));
                if (!other) continue;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('class', 'reversi4d-edge');
                line.setAttribute('x1', item.x.toFixed(1));
                line.setAttribute('y1', item.y.toFixed(1));
                line.setAttribute('x2', other.x.toFixed(1));
                line.setAttribute('y2', other.y.toFixed(1));
                svg.append(line);
            }
        }
        this.gridEl.append(svg);
        [...projected.values()].sort((a, b) => a.depth - b.depth).forEach(({ coord, x, y, depth: pointDepth }) => {
            const key = this.logic.key(coord);
            const stone = this.logic.get(coord);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'vertex projected-vertex';
            button.dataset.coord = JSON.stringify(coord);
            button.dataset.key = key;
            button.title = `(${coord.join(',')})`;
            button.style.left = `${x}px`;
            button.style.top = `${y}px`;
            button.style.zIndex = String(Math.round((pointDepth + 8) * 100));
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
            this.gridEl.append(button);
        });
    }

    projectCoord(coord, width, height) {
        const { width: nx, height: ny, depth, wSize } = this.logic.topology;
        const scaleAxis = (value, max) => (value / Math.max(1, max - 1) - 0.5) * 2;
        const point = [
            scaleAxis(coord[0], nx),
            scaleAxis(coord[1], ny),
            scaleAxis(coord[2], depth) + scaleAxis(coord[3], wSize) * 0.55
        ];
        const [x, y, z] = this.rotatePoint3D(point);
        const perspective = 1 / Math.max(0.35, 1 + z * 0.18);
        const scale = Math.min(width, height) * 0.34 * (this.view.zoom || 1) * perspective;
        return { x: width / 2 + x * scale, y: height * 0.45 + y * scale, depth: z };
    }

    rotatePoint3D(point) {
        let [x, y, z] = point;
        const rx = (this.view.rotX || 0) * Math.PI / 180;
        const ry = (this.view.rotY || 0) * Math.PI / 180;
        const rz = (this.view.rotZ || 0) * Math.PI / 180;
        let c = Math.cos(rx);
        let s = Math.sin(rx);
        [y, z] = [y * c - z * s, y * s + z * c];
        c = Math.cos(ry);
        s = Math.sin(ry);
        [x, z] = [x * c + z * s, -x * s + z * c];
        c = Math.cos(rz);
        s = Math.sin(rz);
        [x, y] = [x * c - y * s, x * s + y * c];
        return [x, y, z];
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
        const counts = this.logic.counts();
        if (this.logic.winner === 'draw') return `Draw (Black ${counts.black}, White ${counts.white})`;
        return `${this.capitalize(this.logic.winner)} wins by ${Math.abs(counts.black - counts.white)} (Black ${counts.black}, White ${counts.white})`;
    }

    canActFor(color) {
        return this.gameModeSelect?.value !== 'online' || (this.network?.isConnected && this.myColor === color);
    }

    updateOnlineControls() {
        const online = this.gameModeSelect?.value === 'online';
        if (this.onlineControls) this.onlineControls.hidden = !online;
        if (!online) {
            this.myColor = null;
            this.network?.close?.({ silent: true });
            this.setOnlineColor(null);
        }
    }

    setOnlineColor(color, roomId = this.network?.roomId) {
        this.myColor = color;
        if (this.onlineColorEl) {
            
            this.onlineColorEl.hidden = !color;
            this.onlineColorEl.textContent = color ? `Online as ${this.capitalize(color)}` : '';
        }
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
        return '4dreversi';
    }

    onlineMatchKey() {
        const { nx, ny, nz, nw } = this.sizes();
        return ['4dreversi', nx, ny, nz, nw].join(':');
    }

    exportNetworkState() {
        return { logic: this.logic.exportState(), sizes: this.sizes(), dynamics: this.dynamicsSettings(), pieceAges: { ...this.pieceAges }, noiseTick: this.noiseTick };
    }

    importNetworkState(state) {
        if (!state?.logic) return;
        const topology = state.logic.topology || {};
        const sizes = state.sizes || {
            nx: topology.width,
            ny: topology.height,
            nz: topology.depth,
            nw: topology.wSize
        };
        for (const [key, input] of Object.entries(this.inputs)) {
            if (input && sizes[key]) input.value = String(sizes[key]);
        }
        this.logic.importState(state.logic);
        this.setDynamicsSettings(state.dynamics || {});
        this.pieceAges = { ...(state.pieceAges || {}) };
        this.noiseTick = Number(state.noiseTick) || 0;
        this.updateZoomOptions();
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

window.reversi4dApp = new Reversi4DApp();
window.Reversi4DGame = ReversiGame;
window.otherReversiColor = otherReversiColor;
installGameUILocalizer();
