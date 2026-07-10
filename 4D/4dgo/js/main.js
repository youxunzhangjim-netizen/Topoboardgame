import { COLORS, FLAT_4D_GO_TOPOLOGY, Flat4DGoGame, otherColor, valueToColor } from './Flat4DGo.js';
import { FirebaseStateNetworkManager } from '../../../js/FirebaseStateNetworkManager.js';
import { buildOnlineMatchKey } from '../../../js/shared/OnlineMatchKey.js';
import { installGameUILocalizer } from '../../../js/shared/GameUILocalizer.js';

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
        this.viewModeSelect = document.getElementById('viewModeSelect');
        this.wSliceInput = document.getElementById('wSliceInput');
        this.wSliceValue = document.getElementById('wSliceValue');
        this.wSliceGroup = document.getElementById('wSliceGroup');
        this.wSliceButtons = document.getElementById('wSliceButtons');
        this.slice3DViewControls = document.getElementById('slice3DViewControls');
        this.view = { rotX: -26, rotY: 32, rotZ: 0, zoom: 1, drag: null };
        this.viewControls = {
            rotX: document.getElementById('viewRotateX'),
            rotY: document.getElementById('viewRotateY'),
            rotZ: document.getElementById('viewRotateZ'),
            zoom: document.getElementById('viewZoom'),
            reset: document.getElementById('viewResetButton')
        };
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
        this.selectedIndex = -1;
        this.hoverIndex = -1;
        this.userSelectedWSlice = false;
        this.stoneAges = {};
        this.noiseTick = 0;
        this.logic = this.createLogic();
        this.network = new FirebaseStateNetworkManager(this, { gameKey: this.onlineGameKey(), matchKey: this.onlineMatchKey() });
        this.bindEvents();
        this.updateZoomOptions();
        this.updateUI();
        this.tryJoinSharedRoomFromUrl();
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

    dynamicControls() {
        return [];
    }

    dynamicsSettings() {
        return { timeEvolution: 'off', lifetime: 60, noiseMode: 'off', noiseRate: 0, noisePeriod: 1 };
    }

    setDynamicsSettings() {
        // Ordinary 2D/4D modes do not expose +1D time/noise settings.
    }

    syncStoneAges() {
        const next = {};
        for (let index = 0; index < this.logic.board.length; index += 1) {
            if (this.logic.board[index] === COLORS.empty) continue;
            const key = this.logic.coordFromIndex(index).join(',');
            next[key] = Math.max(1, Number(this.stoneAges?.[key]) || 1);
        }
        this.stoneAges = next;
    }

    applyTimeEvolutionAndNoise() {
        const settings = this.dynamicsSettings();
        this.syncStoneAges();
        if (settings.timeEvolution !== 'off') {
            for (const key of Object.keys(this.stoneAges)) this.stoneAges[key] = Number(this.stoneAges[key] || 0) + 1;
            if (settings.timeEvolution === 'decay') {
                for (let index = 0; index < this.logic.board.length; index += 1) {
                    if (this.logic.board[index] !== COLORS.empty && (this.stoneAges[this.logic.coordFromIndex(index).join(',')] || 1) > settings.lifetime) {
                        this.logic.board[index] = COLORS.empty;
                        if (Array.isArray(this.logic.pauliLabels)) this.logic.pauliLabels[index] = 'I';
                    }
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
                    } else if (settings.noiseMode === 'random-birth' && value === COLORS.empty && Math.random() < settings.noiseRate * 0.02) {
                        this.logic.board[index] = this.logic.currentPlayer === 'black' ? COLORS.black : COLORS.white;
                    }
                }
            }
        }
        this.syncStoneAges();
        this.logic.positionHistory = [this.logic.serializeBoard(this.logic.board)];
        this.logic.positionSet = new Set(this.logic.positionHistory);
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
        const syncWSlice = () => this.setVisibleWSlice(this.wSliceInput?.value, {
            force3D: this.viewModeSelect?.value === 'w_slice'
        });
        this.wSliceInput?.addEventListener('input', syncWSlice);
        this.wSliceInput?.addEventListener('change', syncWSlice);
        document.getElementById('passBtn').addEventListener('click', () => this.passTurn());
        document.getElementById('countBtn').addEventListener('click', () => this.agreeCount());
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame({ broadcast: true }));
        document.getElementById('surrenderBtn').addEventListener('click', () => this.surrender());
        this.gameModeSelect?.addEventListener('change', () => this.updateOnlineControls());
        document.getElementById('createRoomBtn')?.addEventListener('click', () => { this.enterOnlineMode(); this.network.createRoom(); });
        document.getElementById('findMatchBtn')?.addEventListener('click', () => { this.enterOnlineMode(); this.network.findMatch(); });
        document.getElementById('joinRoomBtn')?.addEventListener('click', () => { this.enterOnlineMode(); this.network.joinRoom(this.roomIdInput.value); });
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
        this.gridEl.addEventListener('pointerover', (event) => {
            const button = event.target.closest('button[data-coord]');
            this.hoverIndex = button ? this.logic.indexFromCoord(JSON.parse(button.dataset.coord)) : -1;
            this.updateBoardHighlights();
        });
        this.gridEl.addEventListener('pointerleave', () => {
            this.hoverIndex = -1;
            this.updateBoardHighlights();
        });
        for (const control of [this.viewControls.rotX, this.viewControls.rotY, this.viewControls.rotZ, this.viewControls.zoom]) {
            control?.addEventListener('input', () => {
                this.view.rotX = Number(this.viewControls.rotX.value);
                this.view.rotY = Number(this.viewControls.rotY.value);
                this.view.rotZ = Number(this.viewControls.rotZ.value);
                this.view.zoom = Number(this.viewControls.zoom.value);
                this.render();
            });
        }
        this.viewControls.reset?.addEventListener('click', () => {
            Object.assign(this.view, { rotX: -26, rotY: 32, rotZ: 0, zoom: 1, drag: null });
            this.syncViewControls();
            this.render();
        });
        this.gridEl.addEventListener('pointerdown', (event) => {
            if (this.viewModeSelect?.value !== 'w_slice') return;
            if (event.target.closest?.('button[data-coord]')) return;
            this.view.drag = { x: event.clientX, y: event.clientY };
            this.gridEl.setPointerCapture?.(event.pointerId);
        });
        this.gridEl.addEventListener('pointermove', (event) => {
            if (!this.view.drag || this.viewModeSelect?.value !== 'w_slice') return;
            const dx = event.clientX - this.view.drag.x;
            const dy = event.clientY - this.view.drag.y;
            this.view.rotY += dx * 0.22;
            this.view.rotX = Math.max(-90, Math.min(90, this.view.rotX + dy * 0.22));
            this.view.drag = { x: event.clientX, y: event.clientY };
            this.syncViewControls();
            this.render();
        });
        this.gridEl.addEventListener('pointerup', () => { this.view.drag = null; });
        this.gridEl.addEventListener('pointercancel', () => { this.view.drag = null; });
        this.gridEl.addEventListener('wheel', (event) => {
            if (this.viewModeSelect?.value !== 'w_slice') return;
            event.preventDefault();
            this.view.zoom = Math.max(0.45, Math.min(2.4, this.view.zoom - event.deltaY * 0.001));
            this.syncViewControls();
            this.render();
        }, { passive: false });
    }

    resetGame({ broadcast = false } = {}) {
        this.logic = this.createLogic();
        this.selectedIndex = -1;
        this.hoverIndex = -1;
        this.userSelectedWSlice = false;
        this.stoneAges = {};
        this.noiseTick = 0;
        this.updateZoomOptions();
        this.setStatus('New 4D Go game started.');
        this.updateUI();
        if (broadcast) this.broadcastState();
    }

    play(coord) {
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.capitalize(this.logic.currentPlayer)}.`);
            return;
        }
        const result = this.logic.tryPlay(coord, this.logic.currentPlayer);
        if (!result.ok) {
            this.setStatus(result.error);
            this.select(coord);
            return;
        }
        this.selectedIndex = this.logic.indexFromCoord(coord);
        this.applyTimeEvolutionAndNoise();
        this.setStatus(`${this.capitalize(otherColor(this.logic.currentPlayer))} played (${coord.join(',')}).`);
        this.updateUI();
        this.broadcastState();
    }

    select(coord) {
        this.selectedIndex = this.logic.indexFromCoord(coord);
        this.updateUI();
    }

    passTurn() {
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.capitalize(this.logic.currentPlayer)}.`);
            return;
        }
        const color = this.logic.currentPlayer;
        const result = this.logic.pass(color);
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        this.applyTimeEvolutionAndNoise();
        this.setStatus(this.logic.scoringPending ? 'Two passes. Both players must agree to count.' : `${this.capitalize(this.logic.currentPlayer)} to play.`);
        this.updateUI();
        this.broadcastState();
    }

    agreeCount() {
        const color = this.gameModeSelect?.value === 'online' && this.myColor ? this.myColor : (!this.logic.countAgreements.black ? 'black' : 'white');
        const result = this.logic.agreeToCount(color);
        if (!result.ok) {
            this.setStatus(result.error);
            return;
        }
        this.setStatus(this.logic.gameOver ? this.resultText() : `${this.capitalize(color)} agreed. Waiting for ${this.capitalize(otherColor(color))}.`);
        this.updateUI();
        this.broadcastState();
    }

    surrender() {
        if (!this.canActFor(this.logic.currentPlayer)) {
            this.setStatus(`Waiting for ${this.capitalize(this.logic.currentPlayer)}.`);
            return;
        }
        const color = this.logic.currentPlayer;
        this.logic.gameOver = true;
        this.logic.winner = otherColor(color);
        this.logic.moveHistory.unshift({ type: 'surrender', color, number: this.logic.moveNumber });
        this.setStatus(`${this.capitalize(color)} surrendered. ${this.capitalize(this.logic.winner)} wins.`);
        this.updateUI();
        this.broadcastState();
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
        if (this.wSliceInput) {
            const maxW = Math.max(0, this.logic.sizes.nw - 1);
            const centerW = Math.floor(maxW / 2);
            const currentW = Math.min(Number(this.wSliceInput.value) || 0, maxW);
            this.wSliceInput.max = String(maxW);
            this.wSliceInput.value = String(this.userSelectedWSlice ? currentW : centerW);
        }
        this.updateViewControls();
    }

    updateViewControls() {
        const is3DSlice = this.viewModeSelect?.value === 'w_slice';
        if (this.wSliceGroup) this.wSliceGroup.hidden = !is3DSlice;
        if (this.slice3DViewControls) this.slice3DViewControls.hidden = !is3DSlice;
        if (this.wSliceValue && this.wSliceInput) this.wSliceValue.textContent = this.wSliceInput.value;
        this.renderWSliceButtons();
    }

    syncViewControls() {
        if (this.viewControls.rotX) this.viewControls.rotX.value = String(this.view.rotX);
        if (this.viewControls.rotY) this.viewControls.rotY.value = String(this.view.rotY);
        if (this.viewControls.rotZ) this.viewControls.rotZ.value = String(this.view.rotZ);
        if (this.viewControls.zoom) this.viewControls.zoom.value = String(this.view.zoom);
    }

    renderWSliceButtons() {
        if (!this.wSliceButtons || !this.wSliceInput) return;
        const count = this.logic?.sizes?.nw || 1;
        this.wSliceButtons.replaceChildren(...Array.from({ length: count }, (_, w) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = `w=${w}`;
            button.setAttribute('aria-pressed', String(Number(this.wSliceInput.value) === w));
            button.addEventListener('click', () => this.setVisibleWSlice(w));
            return button;
        }));
    }

    setVisibleWSlice(w, { force3D = true } = {}) {
        if (!this.wSliceInput) return;
        const maxW = Math.max(0, this.logic?.sizes?.nw ? this.logic.sizes.nw - 1 : Number(this.wSliceInput.max || 0));
        const nextW = Math.max(0, Math.min(Math.floor(Number(w) || 0), maxW));
        this.userSelectedWSlice = true;
        this.wSliceInput.max = String(maxW);
        this.wSliceInput.value = String(nextW);
        if (force3D && this.viewModeSelect) this.viewModeSelect.value = 'w_slice';
        if (this.zoomSelect) this.zoomSelect.value = 'all';
        this.updateViewControls();
        this.render();
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

    scoreForDisplay() {
        if (!this.logic?.score && !this.logic?.scoringPending) return null;
        return this.logic.score || this.logic.computeAreaScore();
    }

    scoreViewSets(score) {
        const dead = new Set();
        const territory = new Map();
        for (const entry of score?.removedDeadStones || []) {
            if (!Array.isArray(entry.coord)) continue;
            const index = this.logic.indexFromCoord(entry.coord);
            if (index >= 0) dead.add(index);
        }
        for (const owner of ['black', 'white', 'neutral']) {
            for (const coord of score?.territorySites?.[owner] || []) {
                const index = this.logic.indexFromCoord(coord);
                if (index >= 0) territory.set(index, owner);
            }
        }
        return { dead, territory };
    }

    render() {
        const { nx, ny, nz, nw } = this.logic.sizes;
        const zoom = this.zoomSelect.value;
        const is3DSlice = this.viewModeSelect?.value === 'w_slice';
        const onlyLayer = zoom !== 'all' ? zoom.split(',').map(Number) : null;
        const visibleW = is3DSlice ? Number(this.wSliceInput?.value || 0) : null;
        const { group, liberties } = this.selectionSets();
        const scoreView = this.scoreViewSets(this.scoreForDisplay());
        if (is3DSlice) {
            this.render3DSlice(visibleW, group, liberties, scoreView);
            return;
        }
        this.gridEl.className = 'slice-grid';
        this.gridEl.style.gridTemplateColumns = onlyLayer ? '1fr' : `repeat(${nz}, max-content)`;
        this.gridEl.innerHTML = '';

        for (let w = 0; w < nw; w++) {
            for (let z = 0; z < nz; z++) {
                if (visibleW !== null && w !== visibleW) continue;
                if (onlyLayer && (onlyLayer[0] !== z || onlyLayer[1] !== w)) continue;
                const slice = document.createElement('section');
                slice.className = `slice-board${onlyLayer ? ' zoomed' : ''}`;
                slice.innerHTML = `<div class="slice-title">z=${z}, w=${w}</div>`;
                slice.querySelector('.slice-title').addEventListener('click', () => this.setVisibleWSlice(w));
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
                        const territoryOwner = scoreView.territory.get(index);
                        if (territoryOwner) button.classList.add(`territory-${territoryOwner}`);
                        if (value && !scoreView.dead.has(index)) {
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

    render3DSlice(w, group, liberties, scoreView = { dead: new Set(), territory: new Map() }) {
        const { nx, ny, nz } = this.logic.sizes;
        this.gridEl.className = 'slice-grid interactive-3d-slice';
        this.gridEl.style.gridTemplateColumns = '';
        this.gridEl.innerHTML = '<div class="slice-3d-label">Interactive 3D x/y/z slice - w=' + w + '</div>';
        const rect = this.gridEl.getBoundingClientRect();
        const width = Math.max(320, rect.width || 720);
        const height = Math.max(500, rect.height || 620);
        const coords = [];
        for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) coords.push([x, y, z, w]);
        const projected = new Map(coords.map((coord) => {
            const point = this.project3DCoord(coord, width, height);
            return [coord.join(','), { coord, ...point }];
        }));
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'interactive-3d-edge-layer');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        for (const item of projected.values()) {
            for (let axis = 0; axis < 3; axis++) {
                const next = [...item.coord];
                next[axis] += 1;
                const other = projected.get(next.join(','));
                if (!other) continue;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('class', 'interactive-3d-edge');
                line.setAttribute('x1', item.x);
                line.setAttribute('y1', item.y);
                line.setAttribute('x2', other.x);
                line.setAttribute('y2', other.y);
                svg.append(line);
            }
        }
        this.gridEl.append(svg);
        [...projected.values()].sort((a, b) => a.depth - b.depth).forEach(({ coord, x, y, depth }) => {
            const index = this.logic.indexFromCoord(coord);
            const value = this.logic.board[index];
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'vertex projected-vertex';
            button.dataset.coord = JSON.stringify(coord);
            button.title = `(${coord.join(',')})`;
            button.style.left = `${x}px`;
            button.style.top = `${y}px`;
            button.style.zIndex = String(Math.round((depth + 8) * 100));
            button.addEventListener('click', () => this.play(coord));
            button.classList.toggle('selected', index === this.selectedIndex);
            button.classList.toggle('hover', index === this.hoverIndex);
            button.classList.toggle('group', group.has(index));
            button.classList.toggle('liberty', liberties.has(index));
            const territoryOwner = scoreView.territory.get(index);
            if (territoryOwner) button.classList.add(`territory-${territoryOwner}`);
            if (value && !scoreView.dead.has(index)) {
                const stone = document.createElement('span');
                stone.className = `stone ${valueToColor(value)}`;
                button.append(stone);
            }
            this.gridEl.append(button);
        });
    }

    project3DCoord(coord, width, height) {
        const { nx, ny, nz } = this.logic.sizes;
        const normalize = (value, count) => (value / Math.max(1, count - 1) - 0.5) * 2;
        let x = normalize(coord[0], nx);
        let y = normalize(coord[1], ny);
        let z = normalize(coord[2], nz);
        const rx = this.view.rotX * Math.PI / 180;
        const ry = this.view.rotY * Math.PI / 180;
        const rz = this.view.rotZ * Math.PI / 180;
        let c = Math.cos(rx), s = Math.sin(rx);
        [y, z] = [y * c - z * s, y * s + z * c];
        c = Math.cos(ry); s = Math.sin(ry);
        [x, z] = [x * c + z * s, -x * s + z * c];
        c = Math.cos(rz); s = Math.sin(rz);
        [x, y] = [x * c - y * s, x * s + y * c];
        const perspective = 1 / Math.max(0.42, 1 + z * 0.18);
        const scale = Math.min(width, height) * 0.34 * this.view.zoom * perspective;
        return { x: width / 2 + x * scale, y: height / 2 + y * scale, depth: z };
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
        if (!this.logic.score) {
            this.scorePanel.hidden = true;
            this.scoreResult.textContent = '';
            return;
        }
        this.scorePanel.hidden = false;
        this.scoreResult.innerHTML = this.scoreBreakdownHtml(this.logic.score, this.resultText());
    }

    resultText() {
        if (!this.logic.gameOver) return '';
        if (this.logic.winner === 'draw') return this.logic.score ? `Draw (Black ${this.logic.score.black}, White ${this.logic.score.white})` : 'Draw';
        if (this.logic.score) return `${this.capitalize(this.logic.winner)} wins by ${this.logic.score.margin} (Black ${this.logic.score.black}, White ${this.logic.score.white})`;
        return `${this.capitalize(this.logic.winner)} wins`;
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

    enterOnlineMode() {
        if (this.gameModeSelect) this.gameModeSelect.value = 'online';
        this.updateOnlineControls();
    }

    setOnlineColor(color, roomId = this.network?.roomId) {
        this.myColor = color;
        if (this.onlineColorEl) {
            this.onlineColorEl.textContent = color ? `Online as ${this.capitalize(color)}` : 'Local pass and play';
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
        return '4dgo';
    }

    onlineMatchKey() {
        const { nx, ny, nz, nw } = this.sizes();
        return buildOnlineMatchKey({
            gameFamily: 'go',
            dimension: 4,
            boardSpace: 'r4',
            topology: 'hypercube',
            lattice: 'hypercubic',
            boundary: 'hard',
            size: [nx, ny, nz, nw],
            ruleset: 'go',
            rulesetVersion: 1
        });
    }

    exportNetworkState() {
        return { logic: this.logic.exportState(), sizes: this.sizes(), dynamics: this.dynamicsSettings(), stoneAges: { ...this.stoneAges }, noiseTick: this.noiseTick };
    }

    importNetworkState(state) {
        if (!state?.logic) return;
        const sizes = state.logic.sizes || state.sizes || {};
        for (const [key, input] of Object.entries(this.inputs)) {
            if (input && sizes[key]) input.value = String(sizes[key]);
        }
        this.logic.importState(state.logic);
        this.setDynamicsSettings(state.dynamics || {});
        this.stoneAges = { ...(state.stoneAges || {}) };
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

window.go4dApp = new Go4DApp();
window.FLAT_4D_GO_TOPOLOGY = FLAT_4D_GO_TOPOLOGY;
installGameUILocalizer();
