import { SpaceTimeRules, coordKey } from './SpaceTimeRules.js';
import { SPACE_TIME_DIMENSIONS, SPACE_TIME_FAMILIES, SPACE_TIME_MODES, getPresetList, findSpaceTimePreset } from './presets.js';

function pretty(value) { return JSON.stringify(value, null, 2); }

function downloadText(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fillSelect(select, entries, value = null) {
  select.innerHTML = entries.map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
  if (value !== null && [...select.options].some((option) => option.value === value)) select.value = value;
}

function clampInt(value, min, max, fallback) {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function formatTopology(name = '') {
  return String(name)
    .replace('plane', '2D Plane')
    .replace('r3', 'R3 Standard')
    .replace('torus3', '3D Torus')
    .replace('sphere-shell', '3D Sphere / Shell')
    .replace('mobius', 'Möbius')
    .replace('rp2', 'RP2')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export class SpaceTimeUI {
  constructor(root = document) {
    this.root = root;
    this.params = new URLSearchParams(globalThis.location?.search || '');
    this.includePhysics = this.params.get('physics') === '1';
    this.canvas = root.getElementById('spaceTimeCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.dimensionSelect = root.getElementById('dimensionSelect');
    this.familySelect = root.getElementById('familySelect');
    this.timeModeSelect = root.getElementById('timeModeSelect');
    this.topologySelect = root.getElementById('topologySelect');
    this.latticeSelect = root.getElementById('latticeSelect');
    this.nxInput = root.getElementById('nxInput');
    this.nyInput = root.getElementById('nyInput');
    this.nzControl = root.getElementById('nzControl');
    this.nzInput = root.getElementById('nzInput');
    this.zLayerControl = root.getElementById('zLayerControl');
    this.zLayerInput = root.getElementById('zLayerInput');
    this.actionLabel = root.getElementById('actionLabel');
    this.delayInput = root.getElementById('delayInput');
    this.periodInput = root.getElementById('periodInput');
    this.lifetimeInput = root.getElementById('lifetimeInput');
    this.oldAgeInput = root.getElementById('oldAgeInput');
    this.timeLatticeInput = root.getElementById('timeLatticeInput');
    this.noiseControl = root.getElementById('noiseControl');
    this.noiseInput = root.getElementById('noiseInput');
    this.resetButton = root.getElementById('resetButton');
    this.passButton = root.getElementById('passButton');
    this.startButton = root.getElementById('startButton');
    this.pauseButton = root.getElementById('pauseButton');
    this.stepButton = root.getElementById('stepButton');
    this.programButton = root.getElementById('programButton');
    this.measureButton = root.getElementById('measureButton');
    this.clockText = root.getElementById('clockText');
    this.rulesText = root.getElementById('rulesText');
    this.statusText = root.getElementById('statusText');
    this.observableList = root.getElementById('observableList');
    this.logList = root.getElementById('logList');
    this.exportBoardButton = root.getElementById('exportBoardButton');
    this.exportEventsButton = root.getElementById('exportEventsButton');
    this.exportCsvButton = root.getElementById('exportCsvButton');
    this.importText = root.getElementById('importText');
    this.importButton = root.getElementById('importButton');
    this.selectedTarget = null;
    this.running = false;
    this.timer = null;
    this.game = null;
  }

  install() {
    this.populateBaseSelectors();
    const requestedPreset = this.params.get('preset');
    const dimensionGroup = this.params.get('dimension') || '2p1';
    const family = this.params.get('family') || 'go';
    const timeMode = this.params.get('time') || 'delay';
    const initial = requestedPreset
      ? getPresetList({ includePhysics: this.includePhysics }).find((preset) => preset.id === requestedPreset)
      : findSpaceTimePreset({ dimensionGroup, family, timeMode, includePhysics: this.includePhysics });
    this.loadPreset(initial?.id || '2p1-go-delay');

    this.dimensionSelect.addEventListener('change', () => this.loadFromSelectors());
    this.familySelect.addEventListener('change', () => this.loadFromSelectors());
    this.timeModeSelect.addEventListener('change', () => this.loadFromSelectors());
    for (const input of [this.topologySelect, this.latticeSelect, this.nxInput, this.nyInput, this.nzInput, this.zLayerInput, this.delayInput, this.periodInput, this.lifetimeInput, this.oldAgeInput, this.timeLatticeInput, this.noiseInput]) {
      input.addEventListener('change', () => this.applyControls());
    }
    this.resetButton.addEventListener('click', () => { this.loadPreset(this.game.preset.id); this.afterChange('New game.'); });
    this.passButton.addEventListener('click', () => { this.game.pass(); this.afterChange('Passed.'); });
    this.startButton.addEventListener('click', () => this.start());
    this.pauseButton.addEventListener('click', () => this.pause());
    this.stepButton.addEventListener('click', () => this.step());
    this.programButton.addEventListener('click', () => this.programSelected());
    this.measureButton.addEventListener('click', () => { const result = this.game.measureHamiltonianWalk(); this.afterChange(result.ok ? 'Measured physics walk.' : result.error); });
    this.canvas.addEventListener('click', (event) => this.handleClick(event));
    this.exportBoardButton.addEventListener('click', () => downloadText('spacetime-board-state.json', pretty(this.game.exportState())));
    this.exportEventsButton.addEventListener('click', () => downloadText('spacetime-scheduled-events.json', pretty(this.game.engine.exportScheduledEvents({ revealHidden: true }))));
    this.exportCsvButton.addEventListener('click', () => downloadText('spacetime-observables.csv', this.game.engine.exportTimeSeriesCSV(), 'text/csv'));
    this.importButton.addEventListener('click', () => this.importState());
    window.addEventListener('resize', () => this.draw());
  }

  populateBaseSelectors() {
    fillSelect(this.dimensionSelect, Object.entries(SPACE_TIME_DIMENSIONS).map(([id, item]) => [id, item.title]));
    fillSelect(this.familySelect, Object.entries(SPACE_TIME_FAMILIES).map(([id, item]) => [id, item.title]));
    fillSelect(this.timeModeSelect, Object.entries(SPACE_TIME_MODES).map(([id, item]) => [id, item.title]));
    if (this.includePhysics) {
      this.familySelect.insertAdjacentHTML('beforeend', '<option value="physics">Physics Lab</option>');
      this.timeModeSelect.insertAdjacentHTML('beforeend', '<option value="physics">Physics Lab</option>');
    }
  }

  loadFromSelectors() {
    if (this.familySelect.value === 'physics' || this.timeModeSelect.value === 'physics') {
      const physicsPreset = getPresetList({ includePhysics: true }).find((preset) => preset.physicsLab) || null;
      this.loadPreset(physicsPreset?.id || 'physics-momentum-lab');
      return;
    }
    const preset = findSpaceTimePreset({
      dimensionGroup: this.dimensionSelect.value,
      family: this.familySelect.value,
      timeMode: this.timeModeSelect.value,
      includePhysics: this.includePhysics
    });
    this.loadPreset(preset.id);
  }

  loadPreset(id, preserveControls = false) {
    this.pause();
    const overrides = preserveControls ? this.readOverrides() : {};
    this.game = new SpaceTimeRules(id, { includePhysics: this.includePhysics, overrides });
    this.syncControlsFromPreset();
    this.afterChange('Mode loaded.');
  }

  syncControlsFromPreset() {
    const preset = this.game.preset;
    if ([...this.dimensionSelect.options].some((option) => option.value === preset.dimensionGroup)) this.dimensionSelect.value = preset.dimensionGroup;
    if ([...this.familySelect.options].some((option) => option.value === preset.family)) this.familySelect.value = preset.family;
    if ([...this.timeModeSelect.options].some((option) => option.value === preset.timeMode)) this.timeModeSelect.value = preset.timeMode;
    fillSelect(this.topologySelect, (preset.topologies || [preset.topology || 'plane']).map((value) => [value, formatTopology(value)]), preset.topology || preset.boundary);
    fillSelect(this.latticeSelect, (preset.lattices || [preset.lattice || 'square']).map((value) => [value, formatTopology(value)]), preset.lattice);
    this.nxInput.value = this.game.size[0] || 8;
    this.nyInput.value = this.game.size[1] || 8;
    this.nzInput.value = this.game.size[2] || 1;
    this.zLayerInput.value = Math.min(Number(this.zLayerInput.value) || 0, Math.max(0, (this.game.size[2] || 1) - 1));
    this.nzControl.hidden = this.game.dimension < 3;
    this.zLayerControl.hidden = this.game.dimension < 3;
    this.actionLabel.value = preset.actionLabel || SPACE_TIME_FAMILIES[preset.family]?.action || 'Action';
    this.delayInput.value = preset.delay || 2;
    this.periodInput.value = preset.period || 4;
    this.lifetimeInput.value = preset.lifetime || 50;
    this.oldAgeInput.value = preset.oldAge || 40;
    this.timeLatticeInput.value = preset.dt || 1;
    this.noiseInput.value = preset.allowNoise ? (preset.noise || 0) : 0;
    this.noiseControl.hidden = !preset.allowNoise;
    this.measureButton.hidden = !preset.physicsLab;
    this.programButton.textContent = preset.timeMode === 'delay' ? 'Program Future Action' : 'Program Future Action';
  }

  readOverrides() {
    const dimension = this.dimensionSelect.value === '3p1' || this.familySelect.value === 'physics' && Number(this.nzInput.value) > 1 ? 3 : 2;
    const size = [
      clampInt(this.nxInput.value, 3, 24, 9),
      clampInt(this.nyInput.value, 3, 24, 9)
    ];
    if (dimension >= 3) size.push(clampInt(this.nzInput.value, 1, 12, 4));
    const allowNoise = this.game?.preset?.allowNoise ?? (this.familySelect.value === 'go' || this.familySelect.value === 'reversi');
    return {
      size,
      dimension,
      topology: this.topologySelect.value,
      boundary: this.topologySelect.value,
      lattice: this.latticeSelect.value,
      delay: clampInt(this.delayInput.value, 1, 16, 2),
      period: clampInt(this.periodInput.value, 1, 16, 4),
      lifetime: clampInt(this.lifetimeInput.value, 1, 99, 50),
      oldAge: clampInt(this.oldAgeInput.value, 1, 99, 40),
      dt: clampInt(this.timeLatticeInput.value, 1, 8, 1),
      noise: allowNoise ? Math.max(0, Math.min(1, Number(this.noiseInput.value) || 0)) : 0
    };
  }

  applyControls() {
    const overrides = this.readOverrides();
    this.game.setOverrides(overrides);
    this.syncControlsFromPreset();
    this.afterChange('Settings applied.');
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.timer = window.setInterval(() => this.step(), 900);
    this.statusText.textContent = 'Auto stepping.';
  }

  pause() {
    this.running = false;
    if (this.timer) window.clearInterval(this.timer);
    this.timer = null;
  }

  step() {
    this.game.endTurn();
    this.afterChange('Advanced one time step.');
  }

  programSelected() {
    const target = this.selectedTarget || this.game.legalMoves()[0]?.to || null;
    if (!target) {
      this.statusText.textContent = 'Select a piece or legal target first.';
      return;
    }
    const result = this.game.playAt(target, { programmed: true });
    this.selectedTarget = null;
    this.afterChange(result.ok ? 'Future action programmed.' : result.error);
  }

  visibleZLayer() {
    return clampInt(this.zLayerInput.value, 0, Math.max(0, (this.game.size[2] || 1) - 1), 0);
  }

  positionFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    const ratioX = this.canvas.width / rect.width;
    const ratioY = this.canvas.height / rect.height;
    const x = (event.clientX - rect.left) * ratioX;
    const y = (event.clientY - rect.top) * ratioY;
    const board = this.boardRect();
    const sx = board.width / this.game.size[0];
    const sy = board.height / this.game.size[1];
    const ix = Math.floor((x - board.x) / sx);
    const iy = Math.floor((y - board.y) / sy);
    if (ix < 0 || iy < 0 || ix >= this.game.size[0] || iy >= this.game.size[1]) return null;
    const position = [ix, iy];
    if (this.game.dimension >= 3) position.push(this.visibleZLayer());
    return position;
  }

  handleClick(event) {
    const position = this.positionFromEvent(event);
    if (!position) return;
    const key = coordKey(position);
    const legal = this.game.legalMoves().find((move) => coordKey(move.to) === key);
    if (this.game.preset.family === 'go' || this.game.preset.family === 'reversi') {
      if (!legal) {
        this.statusText.textContent = 'That site is not available.';
        return;
      }
      this.selectedTarget = position;
      const result = this.game.playAt(position, { programmed: this.game.preset.timeMode === 'delay' });
      this.afterChange(result.ok ? 'Action played.' : result.error);
      return;
    }
    if (legal) {
      this.selectedTarget = position;
      const result = this.game.playAt(position, { programmed: this.game.preset.timeMode === 'delay' });
      this.afterChange(result.ok ? 'Action played.' : result.error);
      return;
    }
    const selected = this.game.selectAt(position);
    this.selectedTarget = null;
    this.afterChange(selected ? `Selected ${selected}.` : 'No active piece there.');
  }

  importState() {
    try {
      const payload = JSON.parse(this.importText.value);
      this.game.importState(payload);
      this.syncControlsFromPreset();
      this.afterChange('State imported.');
    } catch (error) {
      this.statusText.textContent = `Import failed: ${error.message}`;
    }
  }

  afterChange(message = '') {
    this.statusText.textContent = this.game.winner ? `Winner: ${this.game.winner}` : message;
    this.renderText();
    this.draw();
  }

  renderText() {
    const preset = this.game.preset;
    this.clockText.textContent = `Turn ${this.game.engine.turn} · Player ${this.game.currentPlayer} · ${preset.shortTitle || preset.title}`;
    this.rulesText.textContent = preset.rules;
    const obs = this.game.engine.observables();
    this.observableList.innerHTML = Object.entries(obs).map(([key, value]) => `<div><strong>${key}</strong><span>${typeof value === 'object' ? JSON.stringify(value) : value}</span></div>`).join('');
    this.logList.innerHTML = (this.game.log.slice(0, 12).map((item) => `<li>${item}</li>`).join('') || '<li>No actions yet.</li>');
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(480, Math.floor(rect.width * ratio));
    const height = Math.max(440, Math.floor(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  boardRect() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const size = Math.min(width, height) * 0.88;
    return { x: (width - size) / 2, y: (height - size) / 2, width: size, height: size };
  }

  draw() {
    if (!this.game) return;
    this.resizeCanvas();
    const ctx = this.ctx;
    const board = this.boardRect();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#06101a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const sx = board.width / this.game.size[0];
    const sy = board.height / this.game.size[1];
    const zLayer = this.visibleZLayer();

    ctx.save();
    ctx.strokeStyle = 'rgba(125,211,252,.32)';
    ctx.lineWidth = Math.max(1, sx * 0.018);
    for (let x = 0; x <= this.game.size[0]; x += 1) {
      ctx.beginPath(); ctx.moveTo(board.x + x * sx, board.y); ctx.lineTo(board.x + x * sx, board.y + board.height); ctx.stroke();
    }
    for (let y = 0; y <= this.game.size[1]; y += 1) {
      ctx.beginPath(); ctx.moveTo(board.x, board.y + y * sy); ctx.lineTo(board.x + board.width, board.y + y * sy); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(34,197,94,.17)';
    ctx.fillRect(board.x, board.y, board.width, sy * 1.08);
    ctx.fillStyle = 'rgba(248,113,113,.17)';
    ctx.fillRect(board.x, board.y + board.height - sy * 1.08, board.width, sy * 1.08);
    ctx.fillStyle = '#dbeafe';
    ctx.font = `${Math.max(10, sy * 0.22)}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('A home / B target', board.x + 8, board.y + 7);
    ctx.textBaseline = 'bottom';
    ctx.fillText('B home / A target', board.x + 8, board.y + board.height - 7);

    const legalKeys = new Set(this.game.legalMoves().filter((move) => this.game.dimension < 3 || move.to[2] === zLayer).map((move) => coordKey(move.to)));
    for (const key of legalKeys) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = 'rgba(34,197,94,.52)';
      ctx.beginPath();
      ctx.arc(board.x + (x + 0.5) * sx, board.y + (y + 0.5) * sy, Math.min(sx, sy) * 0.17, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const piece of this.game.engine.pieces.values()) {
      if (!piece.isVisible) continue;
      if (this.game.dimension >= 3 && (piece.position[2] || 0) !== zLayer) continue;
      const [x, y] = piece.position;
      const cx = board.x + (x + 0.5) * sx;
      const cy = board.y + (y + 0.5) * sy;
      const r = Math.min(sx, sy) * 0.34;
      ctx.globalAlpha = piece.isActive ? 1 : 0.36;
      ctx.fillStyle = piece.player === 'A' ? '#38bdf8' : '#f59e0b';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = piece.id === this.game.selectedPieceId ? '#ffffff' : piece.hiddenProgram ? '#f472b6' : 'rgba(255,255,255,.32)';
      ctx.lineWidth = piece.id === this.game.selectedPieceId ? Math.max(4, r * 0.14) : Math.max(2, r * 0.09);
      ctx.stroke();
      const life = piece.lifetime || Number(this.lifetimeInput.value) || 50;
      if (piece.age > 0 && this.game.preset.timeMode === 'decay') {
        const progress = Math.max(0.05, Math.min(1, piece.age / life));
        ctx.strokeStyle = progress >= 0.92 ? 'rgba(255,82,82,1)' : 'rgba(170,255,255,1)';
        ctx.lineWidth = Math.max(4, r * 0.16);
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = '#06101a';
      ctx.font = `${Math.max(12, r * 0.62)}px ui-sans-serif, system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(piece.player, cx, cy);
      if (piece.hiddenProgram || piece.chargeUntil) {
        ctx.fillStyle = '#f9a8d4';
        ctx.font = `${Math.max(10, r * 0.34)}px ui-sans-serif, system-ui`;
        ctx.fillText('charging', cx, cy + r * 1.55);
      }
      ctx.globalAlpha = 1;
    }

    if (this.game.dimension >= 3) {
      ctx.fillStyle = 'rgba(191,219,254,.88)';
      ctx.font = `${Math.max(13, this.canvas.width * 0.014)}px ui-sans-serif, system-ui`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText(`showing z = ${zLayer}`, board.x + board.width - 10, board.y + 10);
    }
    ctx.restore();
  }
}

export function installSpaceTimeUI(root = document) {
  const ui = new SpaceTimeUI(root);
  ui.install();
  return ui;
}
