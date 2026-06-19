import { FirebaseStateNetworkManager } from '../FirebaseStateNetworkManager.js';
import { JumpGameState, chooseJumpRobotMove, coordKey, otherPlayer } from './JumpRules.js';

const DIM_LABELS = { 2: '2D', 3: '3D', 4: '4D' };
const TOPOLOGY_LABELS = {
  plane: 'Flat', torus: 'Torus', mobius: 'Möbius', klein: 'Klein', rp2: 'RP2', sphere: 'Sphere',
  cube: '3D', reflective: 'Reflective', shell: 'Sphere / Shell', hypercube: 'Hypercube', projection: 'Projection', '4d-torus': '4D Torus'
};

function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || min)); }
function parseCoordKey(key) { return key.split(',').map(Number); }
function withQuery(defaults = {}) {
  const params = new URLSearchParams(location.search);
  const value = (name, fallback) => params.get(name) || fallback;
  return {
    ...defaults,
    dimension: Number(value('dimension', defaults.dimension || 2)),
    topology: value('topology', defaults.topology || defaults.boundary || 'plane'),
    labMode: value('lab', defaults.labMode || ''),
    size: Number(value('size', defaults.size || (defaults.dimension === 4 ? 5 : defaults.dimension === 3 ? 6 : 8)))
  };
}

function jumpLanguage() {
  const params = new URLSearchParams(location.search);
  const raw = params.get('lang')
    || localStorage.getItem('topoboardgame.lang')
    || document.documentElement.lang
    || navigator.language
    || 'en';
  return String(raw).toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function jumpWord() {
  return jumpLanguage() === 'zh' ? '跳棋' : 'Jump';
}

function playerFromOnlineColor(color) {
  if (color === 'black') return 'A';
  if (color === 'white') return 'B';
  return color;
}

function normalizeJumpNetworkState(state = {}) {
  return {
    ...state,
    currentPlayer: playerFromOnlineColor(state.currentPlayer),
    winner: playerFromOnlineColor(state.winner)
  };
}

export class JumpGameApp {
  constructor(config = {}) {
    this.config = withQuery(config);
    this.dimension = clamp(this.config.dimension, 2, 4);
    this.canvas = document.getElementById('jumpCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.statusEl = document.getElementById('jumpStatus');
    this.progressEl = document.getElementById('jumpProgress');
    this.infoEl = document.getElementById('jumpInfo');
    this.historyEl = document.getElementById('moveHistory');
    this.modeSelect = document.getElementById('gameModeSelect');
    this.topologySelect = document.getElementById('topologySelect');
    this.sizeSelect = document.getElementById('boardSizeSelect');
    this.axisSelect = document.getElementById('targetAxisSelect');
    this.targetModeSelect = document.getElementById('targetModeSelect');
    this.endJumpButton = document.getElementById('endJumpButton');
    this.newButton = document.getElementById('newGameButton');
    this.analyzeButton = document.getElementById('analyzeButton');
    this.analysisEl = document.getElementById('analysisOutput');
    this.selected = null;
    this.legal = [];
    this.history = [];
    this.myColor = null;
    this.view = { rotX: -26, rotY: 32, rotZ: 0, zoom: 1, drag: null };
    this.viewControls = {
      rotX: document.getElementById('viewRotateX'),
      rotY: document.getElementById('viewRotateY'),
      rotZ: document.getElementById('viewRotateZ'),
      zoom: document.getElementById('viewZoom'),
      reset: document.getElementById('viewResetButton'),
      focusOwn: document.getElementById('focusOwnPiecesBtn')
    };
    this.sliceInputs = {
      x: document.getElementById('r3FilterX') || document.getElementById('sliceXInput'),
      y: document.getElementById('r3FilterY') || document.getElementById('sliceYInput'),
      z: document.getElementById('r3FilterZ') || document.getElementById('sliceZInput'),
      w: document.getElementById('sliceWInput')
    };
    this.sliceFilterEl = document.getElementById('r3FilterControl');
    this.focusOwnPieces = false;
    this.movePicker = this.ensureMovePicker();
    this.suppressCanvasClickUntil = 0;
    this.network = new FirebaseStateNetworkManager(this, { gameKey: this.onlineGameKey(), matchKey: this.onlineMatchKey() });
    this.game = this.createGame();
    this.install();
    this.updateLabels();
    this.render();
  }

  createGame() {
    const topology = this.topologySelect?.value || this.config.topology || 'plane';
    const size = Number(this.sizeSelect?.value || this.config.size || (this.dimension === 4 ? 5 : this.dimension === 3 ? 6 : 8));
    const targetAxis = this.axisSelect?.value || this.config.targetAxis || 'x';
    const labTargetMode = this.targetModeSelect?.value || 'opponentHome';
    return new JumpGameState({
      dimension: this.dimension,
      size,
      topology,
      targetAxis,
      labMode: this.config.labMode || '',
      labTargetMode,
      zoneMode: ['torus', 'mobius', 'klein', 'rp2', 'projection', '4d-torus'].includes(topology) ? 'marked' : 'auto'
    });
  }

  install() {
    addEventListener('resize', () => this.render());
    this.canvas.addEventListener('click', (event) => this.onCanvasClick(event));
    this.installViewControls();
    for (const el of [this.modeSelect, this.topologySelect, this.sizeSelect, this.axisSelect, this.targetModeSelect]) {
      el?.addEventListener('change', () => {
        if (el === this.modeSelect && this.modeSelect?.value !== 'online') {
          this.network.close({ silent: true });
          this.myColor = null;
        }
        this.resetGame();
      });
    }
    this.endJumpButton?.addEventListener('click', () => { this.game.endTurn(); this.selected = null; this.legal = []; this.afterMove('jump chain stopped'); });
    this.newButton?.addEventListener('click', () => this.resetGame());
    this.analyzeButton?.addEventListener('click', () => this.showAnalysis());
    document.getElementById('createRoomButton')?.addEventListener('click', () => { this.enterOnlineMode(); this.network.createRoom(); });
    document.getElementById('findMatchButton')?.addEventListener('click', () => { this.enterOnlineMode(); this.network.findMatch(); });
    document.getElementById('joinRoomButton')?.addEventListener('click', () => { this.enterOnlineMode(); this.network.joinRoom(document.getElementById('roomIdInput')?.value?.trim()); });
    document.getElementById('leaveRoomButton')?.addEventListener('click', () => this.network.close());
    document.getElementById('copyShareLinkButton')?.addEventListener('click', async () => {
      const input = document.getElementById('shareLinkInput');
      if (input?.value) await navigator.clipboard?.writeText(input.value).catch(() => {});
    });
    const params = new URLSearchParams(location.search);
    const room = params.get('room');
    if (room) {
      this.enterOnlineMode();
      setTimeout(() => this.network.resumeOrJoinRoom(room), 200);
    }
  }


  installViewControls() {
    const sync = () => {
      this.view.rotX = Number(this.viewControls.rotX?.value ?? this.view.rotX);
      this.view.rotY = Number(this.viewControls.rotY?.value ?? this.view.rotY);
      this.view.rotZ = Number(this.viewControls.rotZ?.value ?? this.view.rotZ);
      this.view.zoom = Math.max(0.35, Math.min(2.8, Number(this.viewControls.zoom?.value ?? this.view.zoom)));
      this.render();
    };
    for (const control of [this.viewControls.rotX, this.viewControls.rotY, this.viewControls.rotZ, this.viewControls.zoom]) {
      control?.addEventListener('input', sync);
    }
    this.viewControls.reset?.addEventListener('click', () => {
      this.view = { rotX: -26, rotY: 32, rotZ: 0, zoom: 1, drag: null };
      this.clearR3SliceFilters(false);
      if (this.viewControls.rotX) this.viewControls.rotX.value = String(this.view.rotX);
      if (this.viewControls.rotY) this.viewControls.rotY.value = String(this.view.rotY);
      if (this.viewControls.rotZ) this.viewControls.rotZ.value = String(this.view.rotZ);
      if (this.viewControls.zoom) this.viewControls.zoom.value = String(this.view.zoom);
      this.render();
    });
    for (const input of Object.values(this.sliceInputs || {})) {
      input?.addEventListener('input', () => this.refreshR3SliceFilter());
      input?.addEventListener('change', () => this.refreshR3SliceFilter());
    }
    this.viewControls.focusOwn?.addEventListener('click', () => {
      this.focusOwnPieces = !this.focusOwnPieces;
      this.syncPieceFocusButton();
      this.render();
    });
    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      this.view.zoom = Math.max(0.35, Math.min(2.8, this.view.zoom * factor));
      if (this.viewControls.zoom) this.viewControls.zoom.value = String(this.view.zoom.toFixed(2));
      this.render();
    }, { passive: false });
    this.canvas.addEventListener('pointerdown', (event) => {
      if (!this.usesEmbeddedView()) return;
      if (![0, 1, 2].includes(event.button)) return;
      this.view.drag = {
        x: event.clientX,
        y: event.clientY,
        rotX: this.view.rotX,
        rotY: this.view.rotY,
        active: event.shiftKey || event.button !== 0
      };
      this.canvas.setPointerCapture?.(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.view.drag) return;
      const dx = event.clientX - this.view.drag.x;
      const dy = event.clientY - this.view.drag.y;
      if (!this.view.drag.active && Math.hypot(dx, dy) < 4) return;
      this.view.drag.active = true;
      event.preventDefault();
      this.view.rotY = this.view.drag.rotY + dx * 0.45;
      this.view.rotX = this.view.drag.rotX - dy * 0.45;
      if (this.viewControls.rotX) this.viewControls.rotX.value = String(Math.round(this.view.rotX));
      if (this.viewControls.rotY) this.viewControls.rotY.value = String(Math.round(this.view.rotY));
      this.render();
    });
    const stopDrag = (event) => {
      if (!this.view.drag) return;
      if (this.view.drag.active) this.suppressCanvasClickUntil = performance.now() + 220;
      this.view.drag = null;
      try { this.canvas.releasePointerCapture?.(event.pointerId); } catch {}
    };
    this.canvas.addEventListener('pointerup', stopDrag);
    this.canvas.addEventListener('pointercancel', stopDrag);
    this.canvas.addEventListener('contextmenu', (event) => { if (this.usesEmbeddedView()) event.preventDefault(); });
    this.updateR3SliceFilterVisibility();
    this.syncPieceFocusButton();
  }

  updateLabels() {
    const title = document.getElementById('gameTitle');
    const lab = this.config.labMode;
    if (title) title.textContent = lab ? labTitle(lab) : `${TOPOLOGY_LABELS[this.config.topology] || DIM_LABELS[this.dimension]} ${jumpWord()}`;
    const desc = document.getElementById('gameDescription');
    if (desc) desc.textContent = lab ? labDescription(lab) : dimensionDescription(this.dimension);
    if (this.infoEl) {
      this.infoEl.textContent = jumpLanguage() === 'zh'
        ? '跳棋模式使用一步移動與連跳。目標是把自己的棋子從本方區域移到目標區。一般棋盤的目標像對面，但在環面、莫比烏斯、Klein、RP2、球面、3D 與 4D 棋盤上，目標會直接標出，因為空間改變時「對面」的意思也會改變。'
        : 'Jump modes use step moves and chain jumps. Your goal is to move your pieces from your home zone into the target zone. On ordinary boards the target may look like the opposite side, but on torus, Möbius, Klein, RP2, sphere, 3D, and 4D boards the target is explicitly marked because the meaning of opposite changes with the space.';
    }
  }

  resetGame() {
    this.game = this.createGame();
    this.selected = null;
    this.legal = [];
    this.history = [];
    this.network.gameKey = this.onlineGameKey();
    this.network.matchKey = this.onlineMatchKey();
    this.render();
  }

  onCanvasClick(event) {
    if (performance.now() < this.suppressCanvasClickUntil) return;
    if (!this.canCurrentUserAct()) return;
    const coord = this.coordFromEvent(event);
    if (!coord) return;
    if (this.selected) {
      const move = this.legal.find((candidate) => samePoint(candidate.to, coord));
      if (move) {
        const result = this.game.applyMove(move);
        if (result.ok) {
          this.history.push(`${this.game.currentPlayer === 'A' ? 'B' : 'A'} ${move.type}: ${move.from.join(',')} → ${move.to.join(',')}`);
          if (result.continueJump) {
            this.selected = move.to;
            this.legal = this.game.legalMovesFrom(move.to, true);
          } else {
            this.selected = null;
            this.legal = [];
          }
          this.afterMove(move.type);
        }
        return;
      }
    }
    if (this.game.isOwn(coord)) {
      this.selectJumpPiece(coord);
    }
  }

  ensureMovePicker() {
    const existing = document.getElementById('jumpMovePicker');
    const panel = existing || document.createElement('section');
    panel.id = 'jumpMovePicker';
    panel.className = 'jump-move-picker';
    panel.setAttribute('aria-label', 'Jump move picker');
    if (!existing) {
      panel.innerHTML = `
        <div class="jump-move-picker-head">
          <span>Movable Pieces</span>
          <span class="jump-picker-summary" id="jumpPieceSummary">Current player pieces</span>
        </div>
        <div class="jump-piece-strip" id="jumpMovablePiecesList"></div>
        <div class="jump-move-picker-head jump-move-options-head">
          <span>Available Moves</span>
          <span class="jump-picker-summary" id="jumpMoveSummary">Select a piece</span>
        </div>
        <div class="jump-move-options" id="jumpMoveOptionsList"></div>
      `;
      const wrap = this.canvas?.closest('.jump-canvas-wrap');
      if (wrap?.parentElement) wrap.insertAdjacentElement('afterend', panel);
    }
    const pieces = panel.querySelector('#jumpMovablePiecesList');
    const moves = panel.querySelector('#jumpMoveOptionsList');
    pieces?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-piece-key]');
      if (!button || !this.canCurrentUserAct()) return;
      this.selectJumpPiece(parseCoordKey(button.dataset.pieceKey));
    });
    moves?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-move-id]');
      if (!button || !this.canCurrentUserAct()) return;
      const move = this.legal.find((candidate) => candidate.id === button.dataset.moveId);
      if (move) this.applyJumpMove(move);
    });
    return {
      panel,
      pieceSummary: panel.querySelector('#jumpPieceSummary'),
      moveSummary: panel.querySelector('#jumpMoveSummary'),
      pieces,
      moves
    };
  }

  shouldShowMovePicker() {
    const params = new URLSearchParams(location.search);
    return this.dimension >= 3 || params.get('spacetime') === '3p1';
  }

  canCurrentUserAct() {
    if (this.modeSelect?.value !== 'online') return true;
    return Boolean(this.network?.isConnected && this.myColor && this.myColor === this.game.currentPlayer);
  }

  selectJumpPiece(coord) {
    if (!this.game.isOwn(coord)) return;
    if (this.game.chainFrom && this.selected && !samePoint(this.selected, coord)) return;
    this.selected = coord;
    this.game.selected = coord;
    this.legal = this.game.legalMovesFrom(coord, Boolean(this.game.chainFrom));
    this.render();
  }

  applyJumpMove(move) {
    const movingPlayer = this.game.currentPlayer;
    const result = this.game.applyMove(move);
    if (!result.ok) return false;
    this.history.push(`Player ${movingPlayer} ${move.type}: ${move.from.join(',')} -> ${move.to.join(',')}`);
    if (result.continueJump) {
      this.selected = move.to;
      this.legal = this.game.legalMovesFrom(move.to, true);
    } else {
      this.selected = null;
      this.legal = [];
    }
    this.afterMove(move.type);
    return true;
  }

  getMovablePieces(player = this.game.currentPlayer) {
    const pieces = [];
    for (const [key, owner] of this.game.pieces.entries()) {
      if (owner !== player) continue;
      const coord = parseCoordKey(key);
      if (this.game.chainFrom && this.selected && !samePoint(this.selected, coord)) continue;
      const moves = this.game.legalMovesFrom(coord, Boolean(this.game.chainFrom));
      if (moves.length) pieces.push({ key, coord, owner, moves });
    }
    return pieces.sort((a, b) => a.coord.reduce((result, value, index) => result || value - b.coord[index], 0));
  }

  renderMovePicker() {
    if (!this.movePicker?.panel) return;
    const show = this.shouldShowMovePicker();
    this.movePicker.panel.hidden = !show;
    if (!show) return;

    const canMove = this.canCurrentUserAct() && !this.game.winner;
    const player = this.game.currentPlayer;
    const movablePieces = canMove ? this.getMovablePieces(player) : [];
    const selectedKey = this.selected ? coordKey(this.selected) : '';

    if (!canMove) {
      const text = this.game.winner ? `Winner: ${this.game.winner}` : `Waiting for Player ${player}`;
      if (this.movePicker.pieceSummary) this.movePicker.pieceSummary.textContent = text;
      if (this.movePicker.pieces) this.movePicker.pieces.innerHTML = `<span class="jump-empty-row">${escapeHtml(text)}</span>`;
      if (this.movePicker.moveSummary) this.movePicker.moveSummary.textContent = 'No active selection';
      if (this.movePicker.moves) this.movePicker.moves.innerHTML = '<span class="jump-empty-row">Destinations appear on your turn.</span>';
      return;
    }

    if (this.movePicker.pieceSummary) this.movePicker.pieceSummary.textContent = `Player ${player}: ${movablePieces.length} movable`;
    if (this.movePicker.pieces) {
      this.movePicker.pieces.innerHTML = movablePieces.length
        ? movablePieces.map(({ key, coord, moves }) => `
          <button class="jump-piece-button${key === selectedKey ? ' active' : ''}" type="button" data-piece-key="${escapeHtml(key)}" aria-pressed="${key === selectedKey}">
            <span class="jump-piece-owner">${escapeHtml(player)}</span>
            <span class="jump-piece-coord">${escapeHtml(this.formatCoord(coord))}</span>
            <span class="jump-piece-count">${moves.length}</span>
          </button>
        `).join('')
        : '<span class="jump-empty-row">No movable pieces.</span>';
    }

    if (!this.selected) {
      if (this.movePicker.moveSummary) this.movePicker.moveSummary.textContent = 'Select a piece';
      if (this.movePicker.moves) this.movePicker.moves.innerHTML = '<span class="jump-empty-row">Select a movable piece to list destinations.</span>';
      return;
    }

    if (this.movePicker.moveSummary) this.movePicker.moveSummary.textContent = `${this.formatCoord(this.selected)} -> ${this.legal.length} destination${this.legal.length === 1 ? '' : 's'}`;
    if (this.movePicker.moves) {
      this.movePicker.moves.innerHTML = this.legal.length
        ? this.legal.map((move) => `
          <button class="jump-move-option ${move.type}" type="button" data-move-id="${escapeHtml(move.id)}">
            ${escapeHtml(this.formatMoveLabel(move))}
          </button>
        `).join('')
        : '<span class="jump-empty-row">This piece has no legal destinations.</span>';
    }
  }

  formatCoord(coord) { return `(${coord.join(',')})`; }
  formatMoveLabel(move) {
    const over = move.over ? ` over ${this.formatCoord(move.over)}` : '';
    return `${move.type} -> ${this.formatCoord(move.to)}${over}`;
  }

  afterMove(label) {
    this.render();
    this.network.sendState({ type: label || 'jump_move' });
    if (this.modeSelect?.value === 'robot' && !this.game.winner) setTimeout(() => this.robotTurn(), 180);
  }

  robotTurn() {
    if (this.game.currentPlayer !== 'B' || this.game.winner) return;
    let guard = 0;
    do {
      const move = chooseJumpRobotMove(this.game, 'B');
      if (!move) {
        this.game.endTurn();
        this.history.push('Robot had no legal move and passed the turn.');
        break;
      }
      const result = this.game.applyMove(move);
      if (!result.ok) {
        this.history.push(`Robot skipped rejected move: ${move.from.join(',')} -> ${move.to.join(',')}`);
        this.game.endTurn();
        break;
      }
      this.history.push(`Robot ${move.type}: ${move.from.join(',')} → ${move.to.join(',')}`);
      guard += 1;
      if (result.continueJump) this.game.endTurn();
      break;
    } while (this.game.currentPlayer === 'B' && !this.game.winner);
    this.render();
  }

  coordFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let best = null;
    let bestDist = Infinity;
    for (const coord of this.game.topology.allCoords()) {
      if (!this.visibleCoord(coord)) continue;
      const p = this.project(coord);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestDist) { bestDist = d; best = coord; }
    }
    return bestDist < this.cellRadius() * 1.2 ? best : null;
  }

  visibleCoord(coord) {
    if (this.dimension <= 2) return true;
    const { x, y, z, w } = this.r3SliceSettings();
    if (x !== null && coord[0] !== x) return false;
    if (y !== null && coord[1] !== y) return false;
    if (z !== null && coord[2] !== z) return false;
    if (this.dimension === 4 && w !== null && coord[3] !== w) return false;
    return true;
  }

  sliceInputValue(input) {
    if (!input || String(input.value || '').trim() === '') return null;
    const parsed = Math.floor(Number(input.value));
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, parsed - 1);
  }

  r3SliceSettings() {
    return {
      x: this.sliceInputValue(this.sliceInputs?.x),
      y: this.sliceInputValue(this.sliceInputs?.y),
      z: this.sliceInputValue(this.sliceInputs?.z),
      w: this.sliceInputValue(this.sliceInputs?.w)
    };
  }

  clearR3SliceFilters(update = true) {
    for (const input of Object.values(this.sliceInputs || {})) {
      if (input) input.value = '';
    }
    if (update) this.render();
  }

  refreshR3SliceFilter() {
    this.render();
  }

  updateR3SliceFilterVisibility() {
    const show = this.dimension >= 3;
    if (this.sliceFilterEl) this.sliceFilterEl.hidden = !show;
    if (this.viewControls.focusOwn) this.viewControls.focusOwn.hidden = !show;
  }

  focusPlayer() {
    return this.modeSelect?.value === 'online' && this.myColor ? this.myColor : this.game.currentPlayer;
  }

  syncPieceFocusButton() {
    this.viewControls.focusOwn?.setAttribute('aria-pressed', String(this.focusOwnPieces));
  }

  cellRadius() { return Math.max(8, Math.min(this.canvas.clientWidth || 720, this.canvas.clientHeight || 520) / (this.game.size * 2.8)); }

  usesEmbeddedView() {
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    return this.dimension >= 3 || ['torus', 'mobius', 'klein', 'rp2', 'sphere', 'shell', 'projection', '4d-torus', 'hypercube'].includes(topology);
  }

  embeddedPoint(coord) {
    const n = Math.max(1, this.game.size - 1);
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    const u = (coord[0] / Math.max(1, this.game.size)) * Math.PI * 2;
    const v = (coord[1] / Math.max(1, this.game.size)) * Math.PI * 2;
    if (topology === 'torus' || topology === '4d-torus') {
      const R = 1.45;
      const r = 0.48;
      return [(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v) + (coord[2] || 0) / Math.max(1, n) - 0.5];
    }
    if (topology === 'mobius') {
      const t = (coord[1] / Math.max(1, n) - 0.5) * 0.9;
      return [(1.35 + t * Math.cos(u / 2)) * Math.cos(u), (1.35 + t * Math.cos(u / 2)) * Math.sin(u), t * Math.sin(u / 2)];
    }
    if (topology === 'klein') {
      const R = 1.15 + 0.36 * Math.cos(v);
      return [R * Math.cos(u), R * Math.sin(u), 0.56 * Math.sin(v) + 0.18 * Math.sin(2 * u)];
    }
    if (topology === 'rp2' || topology === 'sphere' || topology === 'shell') {
      const lon = u;
      const lat = (coord[1] / Math.max(1, n) - 0.5) * Math.PI;
      return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
    }
    const centered = coord.map((value) => (value / Math.max(1, n) - 0.5) * 2);
    return [centered[0] || 0, centered[1] || 0, (centered[2] || 0) + (centered[3] || 0) * 0.55];
  }

  rotatePoint3D(point) {
    let [x, y, z] = point;
    const rx = (this.view.rotX || 0) * Math.PI / 180;
    const ry = (this.view.rotY || 0) * Math.PI / 180;
    const rz = (this.view.rotZ || 0) * Math.PI / 180;
    let cy = Math.cos(rx), sy = Math.sin(rx);
    [y, z] = [y * cy - z * sy, y * sy + z * cy];
    cy = Math.cos(ry); sy = Math.sin(ry);
    [x, z] = [x * cy + z * sy, -x * sy + z * cy];
    cy = Math.cos(rz); sy = Math.sin(rz);
    [x, y] = [x * cy - y * sy, x * sy + y * cy];
    return [x, y, z];
  }

  project(coord) {
    const n = this.game.size;
    const width = this.canvas.clientWidth || 720;
    const height = this.canvas.clientHeight || 520;
    if (this.usesEmbeddedView()) {
      const [x, y, z] = this.rotatePoint3D(this.embeddedPoint(coord));
      const perspective = 1 / Math.max(0.35, 1 + z * 0.18);
      const scale = Math.min(width, height) * 0.34 * (this.view.zoom || 1) * perspective;
      return { x: width / 2 + x * scale, y: height * 0.42 + y * scale, depth: z };
    }
    const pad = Math.max(40, Math.min(width, height) * 0.08);
    const usableW = width - pad * 2;
    const usableH = height - pad * 2;
    const zShift = this.dimension >= 3 ? (coord[2] - (n - 1) / 2) * (usableW / n) * 0.18 : 0;
    const wShift = this.dimension >= 4 ? (coord[3] - (n - 1) / 2) * (usableH / n) * 0.12 : 0;
    return {
      x: pad + (coord[0] / Math.max(1, n - 1)) * usableW + zShift,
      y: pad + (coord[1] / Math.max(1, n - 1)) * usableH - zShift + wShift
    };
  }

  render() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.max(1, devicePixelRatio || 1);
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(Math.max(480, rect.height) * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${Math.max(480, rect.height)}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cssW = rect.width;
    const cssH = Math.max(480, rect.height);
    this.canvas.width = Math.floor(cssW * dpr);
    this.canvas.height = Math.floor(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvas.widthCss = cssW;
    this.canvas.heightCss = cssH;
    this.canvas.style.touchAction = this.usesEmbeddedView() ? 'none' : 'manipulation';
    this.draw(cssW, cssH);
    this.updateStatus();
  }

  draw(width, height) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#07111e';
    ctx.fillRect(0, 0, width, height);
    const coords = this.game.topology.allCoords().filter((c) => this.visibleCoord(c));
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(95, 174, 255, 0.26)';
    for (const coord of coords) {
      for (const dir of this.game.directions.filter((d) => d.filter(Boolean).length === 1)) {
        const next = this.game.topology.step(coord, dir)?.position;
        if (!next || !this.visibleCoord(next)) continue;
        const a = this.project(coord);
        const b = this.project(next);
        if (!this.usesEmbeddedView() && Math.hypot(a.x - b.x, a.y - b.y) > Math.min(width, height) / 2) continue;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    for (const coord of coords) this.drawZone(coord);
    for (const coord of coords) this.drawSite(coord);
    for (const [key, owner] of this.game.pieces.entries()) {
      const coord = parseCoordKey(key);
      if (!this.visibleCoord(coord)) continue;
      this.drawPiece(coord, owner, this.game.labels.get(key));
    }
    if (this.game.chainPath.length) this.drawPath(this.game.chainPath);
    if (this.selected) this.drawSelected(this.selected);
    for (const move of this.legal) this.drawLegal(move);
  }

  drawZone(coord) {
    const key = coordKey(coord);
    const p = this.project(coord);
    const r = this.cellRadius() * 1.25;
    const ctx = this.ctx;
    if (this.game.zones.aHome.has(key)) { ctx.fillStyle = 'rgba(84, 164, 255, 0.22)'; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
    if (this.game.zones.aTarget.has(key)) { ctx.strokeStyle = 'rgba(84, 164, 255, 0.85)'; ctx.strokeRect(p.x - r, p.y - r, r * 2, r * 2); }
    if (this.game.zones.bHome.has(key)) { ctx.fillStyle = 'rgba(255, 190, 76, 0.22)'; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
    if (this.game.zones.bTarget.has(key)) { ctx.strokeStyle = 'rgba(255, 190, 76, 0.85)'; ctx.strokeRect(p.x - r * 0.82, p.y - r * 0.82, r * 1.64, r * 1.64); }
  }

  drawSite(coord) {
    const p = this.project(coord);
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(210, 230, 255, 0.85)';
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2, this.cellRadius() * 0.13), 0, Math.PI * 2); ctx.fill();
  }

  drawPiece(coord, owner, label) {
    const p = this.project(coord);
    const r = this.cellRadius() * 0.72;
    const ctx = this.ctx;
    const focus = this.focusOwnPieces ? this.focusPlayer() : null;
    ctx.save();
    if (focus && owner !== focus) ctx.globalAlpha = 0.34;
    ctx.fillStyle = owner === 'A' ? '#54a4ff' : '#ffbe4c';
    ctx.strokeStyle = '#f8fbff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = owner === 'A' ? '#04111f' : '#160d02';
    ctx.font = `${Math.max(10, r * 0.75)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label?.charge || owner, p.x, p.y);
    ctx.restore();
  }

  drawSelected(coord) {
    const p = this.project(coord);
    const ctx = this.ctx;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, this.cellRadius() * 1.08, 0, Math.PI * 2); ctx.stroke();
  }

  drawLegal(move) {
    const p = this.project(move.to);
    const ctx = this.ctx;
    ctx.fillStyle = move.type === 'jump' ? 'rgba(255, 96, 96, 0.88)' : 'rgba(108, 255, 172, 0.86)';
    ctx.beginPath(); ctx.arc(p.x, p.y, this.cellRadius() * 0.42, 0, Math.PI * 2); ctx.fill();
  }

  drawPath(path) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.beginPath();
    path.forEach((coord, index) => { const p = this.project(coord); if (index) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    ctx.stroke();
  }

  updateStatus() {
    const a = this.game.targetProgress('A');
    const b = this.game.targetProgress('B');
    if (this.statusEl) this.statusEl.textContent = this.game.winner ? `Winner: ${this.game.winner}` : `Turn ${this.game.turnNumber}: Player ${this.game.currentPlayer}`;
    if (this.progressEl) this.progressEl.innerHTML = `<span>Player A target: ${a.percentage}% (${a.filled}/${a.total})</span><span>Player B target: ${b.percentage}% (${b.filled}/${b.total})</span>`;
    if (this.endJumpButton) this.endJumpButton.disabled = !this.game.chainFrom;
    if (this.historyEl) this.historyEl.innerHTML = this.history.slice(-10).map((line) => `<li>${escapeHtml(line)}</li>`).join('');
    this.syncPieceFocusButton();
    this.renderMovePicker();
  }

  showAnalysis() {
    const a = this.game.targetProgress('A');
    const b = this.game.targetProgress('B');
    const best = chooseJumpRobotMove(this.game, this.game.currentPlayer);
    if (this.analysisEl) this.analysisEl.textContent = `Current player: ${this.game.currentPlayer}\nLegal moves: ${this.game.allLegalMoves().length}\nSuggested move: ${best ? `${best.type} ${best.from.join(',')} → ${best.to.join(',')}` : 'none'}\nPlayer A progress: ${a.percentage}%\nPlayer B progress: ${b.percentage}%\nScore estimate for A: ${this.game.score('A')}`;
  }

  setStatus(text) { if (this.statusEl && text) this.statusEl.textContent = text; }
  updateUI() { this.render(); }
  exportState() { return this.game.serialize(); }
  exportNetworkState() { return this.exportState(); }
  importState(state) { this.game.import(normalizeJumpNetworkState(state)); this.selected = null; this.legal = []; this.render(); }
  importNetworkState(state) { this.importState(state); }
  enterOnlineMode() { if (this.modeSelect) this.modeSelect.value = 'online'; }
  onlineGameKey() { return `jump-${this.dimension}d-${this.config.labMode || 'game'}`; }
  onlineMatchKey() {
    const t = this.topologySelect?.value || this.config.topology || 'plane';
    const s = this.sizeSelect?.value || this.config.size;
    const axis = this.axisSelect?.value || 'x';
    const target = this.targetModeSelect?.value || 'opponentHome';
    return `jump:${this.dimension}d:${t}:size${s}:axis${axis}:target${target}:lab${this.config.labMode || 'none'}`;
  }
  updateOnlineRoomUI(roomId, color) { if (roomId) this.enterOnlineMode(); this.setOnlineColor(color); }
  setOnlineColor(color) { this.myColor = playerFromOnlineColor(color); }
}

function samePoint(a, b) { return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]); }
function escapeHtml(text) { return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function dimensionDescription(d) {
  if (jumpLanguage() === 'zh') {
    if (d === 3) return '在體積、層與包裹空間中進行跳棋連跳，3D 拓撲會改變距離、包圍與目標區。';
    if (d === 4) return '在投影的高維棋盤上競速，用連跳與目標區探索 4D 空間策略。';
    return '在平面與拓撲棋盤上一步移動和連跳，把棋子從本方區域移到對方目標區。';
  }
  if (d === 3) return 'Jump through volumes, layers, and wrapped spaces. Plan chain paths where distance, enclosure, and targets depend on 3D topology.';
  if (d === 4) return 'Race through projected higher-dimensional boards. Use jumps and target zones to explore strategy in 4D spaces.';
  return 'Leap and chain across flat and topological boards. Move pieces from your home zone into the opponent’s target zone.';
}
function labTitle(lab) {
  if (jumpLanguage() === 'zh') {
    if (lab === 'anyon') return 'Anyon 跳棋 Lab';
    if (lab === 'spin-parity') return 'Spin-Parity 跳棋 Lab';
    if (lab === 'momentum') return 'Momentum 跳棋 Lab';
    return '跳棋 Lab';
  }
  if (lab === 'anyon') return 'Anyon Jump Lab';
  if (lab === 'spin-parity') return 'Spin-Parity Jump Lab';
  if (lab === 'momentum') return 'Momentum Jump Lab';
  return 'Jump Lab';
}
function labDescription(lab) {
  if (lab === 'anyon') return 'Use jump movement with algebraic labels such as charge, sector, parity, braid history, and fusion targets.';
  if (lab === 'spin-parity') return 'Use jump movement to compare spin sectors, parity labels, and target-zone symmetry.';
  if (lab === 'momentum') return 'Use jump movement with momentum-style sectors and projected target constraints.';
  return dimensionDescription(2);
}
