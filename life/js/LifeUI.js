import { createLifeEngine, isAlive } from './LifeEngine.js';
import { listRulePresets, getRulePreset } from './presets.js';
import {
  LIFE_MODES,
  LIFE_GEOMETRIES,
  LIFE_LATTICES,
  findLifeMode,
  findLifeGeometry,
  latticesForGeometry,
  modeTitle,
  modeLong,
  modeTags,
  geometryTitle,
  latticeTitle
} from '../life-data.js';
import { currentLifeLanguage, localizeStaticText, syncLifeLinks, t } from './i18n.js';
import { FirebaseStateNetworkManager } from '../../js/FirebaseStateNetworkManager.js';

const COLORS = { 1: '#38bdf8', 2: '#ef4444', 3: '#22c55e', 4: '#f5b647' };

function readParams() { return new URLSearchParams(window.location.search); }
function formatNumber(value, digits = 3) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (Math.abs(n) >= 1000) return String(Math.round(n));
  return n.toFixed(digits).replace(/\.?0+$/, '');
}
function compactObject(object = {}, digits = 2) {
  const entries = Object.entries(object);
  if (!entries.length) return '—';
  return entries.map(([key, value]) => `${key}:${formatNumber(value, digits)}`).join(' ');
}
function hashAliveCells(engine) {
  const parts = [];
  for (let i = 0; i < engine.cells.length; i += 1) {
    const cell = engine.cells[i];
    if (!isAlive(cell)) continue;
    parts.push(`${i}:${cell.species || 1}`);
  }
  return parts.join('|');
}
function centerOfMass(engine) {
  let total = 0;
  const sum = Array.from({ length: engine.dimension }, () => 0);
  for (let i = 0; i < engine.cells.length; i += 1) {
    const cell = engine.cells[i];
    if (!isAlive(cell)) continue;
    const position = engine.positionFromIndex(i);
    total += 1;
    for (let axis = 0; axis < engine.dimension; axis += 1) sum[axis] += position[axis];
  }
  return total ? sum.map((v) => v / total) : null;
}
function distance(a, b) {
  if (!a || !b) return 0;
  return Math.sqrt(a.reduce((sum, value, axis) => sum + (value - b[axis]) ** 2, 0));
}

function compactLifeCell(cell = {}) {
  if (!isAlive(cell)) return 0;
  return [
    1,
    Number(cell.species || 1),
    Number(cell.age || 0),
    Number(cell.energy ?? 1),
    Number(cell.health ?? 1)
  ];
}

function expandLifeCell(value) {
  if (!value || value === 0) return { state: 0, species: 0, age: 0, energy: 0, health: 0 };
  if (Array.isArray(value)) {
    return {
      state: Number(value[0] || 0),
      species: Number(value[1] || 1),
      age: Number(value[2] || 0),
      energy: Number(value[3] ?? 1),
      health: Number(value[4] ?? 1)
    };
  }
  return value;
}

function geometryConfig(id) {
  const geometry = findLifeGeometry(id);
  return {
    id: geometry.id,
    dimension: geometry.dimension,
    boundary: geometry.topology,
    view: geometry.view,
    latticeSet: geometry.latticeSet
  };
}

function modeToEngineConfig(mode) {
  const geometry = geometryConfig(mode.geometry || (mode.dimensions === 3 ? 'r3' : 'r2'));
  const preset = mode.id === 'species-war' || mode.id === 'ecosystem-balance' ? 'multiSpecies'
    : mode.id.includes('voxel') || geometry.dimension === 3 ? 'life3dSoft'
    : 'conway';
  const rule = getRulePreset(preset);
  rule.speciesCount = mode.species || rule.speciesCount || 1;
  if (mode.mutation != null) rule.mutationRate = mode.mutation;
  return {
    dimension: geometry.dimension,
    size: geometry.dimension === 3 ? [40, 40, 10] : [64, 64],
    boundary: geometry.boundary,
    lattice: mode.lattice || (geometry.dimension === 3 ? 'sc' : 'square'),
    neighborhoodType: mode.neighborhoodType || (geometry.dimension === 3 ? 'von_neumann' : 'moore'),
    rule
  };
}

export class LifeUI {
  constructor(root = document) {
    this.root = root;
    this.language = currentLifeLanguage();
    this.canvas = root.getElementById('lifeCanvas');
    this.context = this.canvas.getContext('2d');

    this.modeSelect = root.getElementById('modeSelect');
    this.usageModeSelect = root.getElementById('usageModeSelect');
    this.twoPlayerModeSelect = root.getElementById('twoPlayerModeSelect');
    this.challengeGoalSelect = root.getElementById('challengeGoalSelect');
    this.activePlayerSelect = root.getElementById('activePlayerSelect');
    this.boardGeometrySelect = root.getElementById('boardGeometrySelect');
    this.latticeSelect = root.getElementById('latticeSelect');
    this.viewModeSelect = root.getElementById('viewModeSelect');
    this.dimensionSelect = root.getElementById('dimensionSelect');
    this.boardSizeSelect = root.getElementById('boardSizeSelect');
    this.topologySelect = root.getElementById('topologySelect');
    this.speciesSelect = root.getElementById('speciesSelect');
    this.ruleSelect = root.getElementById('ruleSelect');
    this.neighborhoodSelect = root.getElementById('neighborhoodSelect');
    this.speedRange = root.getElementById('speedRange');
    this.birthNoiseRange = root.getElementById('birthNoiseRange');
    this.deathNoiseRange = root.getElementById('deathNoiseRange');
    this.environmentNoiseRange = root.getElementById('environmentNoiseRange');
    this.ruleNoiseRange = root.getElementById('ruleNoiseRange');
    this.topologyDefectNoiseRange = root.getElementById('topologyDefectNoiseRange');
    this.mutationRange = root.getElementById('mutationRange');
    this.ageRange = root.getElementById('ageRange');
    this.agingDeathRateRange = root.getElementById('agingDeathRateRange');
    this.youngBirthBonusRange = root.getElementById('youngBirthBonusRange');
    this.oldAgePenaltyRange = root.getElementById('oldAgePenaltyRange');
    this.maxGenerationInput = root.getElementById('maxGenerationInput');

    this.title = root.getElementById('lifeModeTitle');
    this.description = root.getElementById('lifeModeDescription');
    this.tags = root.getElementById('lifeModeTags');
    this.challengeStatus = root.getElementById('challengeStatus');
    this.populationPlot = root.getElementById('populationPlot');
    this.speciesPlot = root.getElementById('speciesPlot');
    this.obs = Object.fromEntries(['Generation', 'Population', 'Density', 'BirthRate', 'DeathRate', 'SpeciesFractions', 'MeanAge', 'AgeDistribution', 'ClusterCount', 'LargestCluster', 'Entropy', 'Correlation', 'ExtinctionTime', 'SurvivalTime', 'Oscillation', 'FrontVelocity'].map((name) => [name, root.getElementById(`obs${name}`)]));
    this.scoreA = root.getElementById('scoreA');
    this.scoreB = root.getElementById('scoreB');
    this.patternJson = root.getElementById('patternJson');
    this.playButton = root.getElementById('playButton');

    this.lifePlayModeSelect = root.getElementById('lifePlayModeSelect');
    this.lifeCreateRoomBtn = root.getElementById('lifeCreateRoomBtn');
    this.lifeFindMatchBtn = root.getElementById('lifeFindMatchBtn');
    this.lifeJoinRoomBtn = root.getElementById('lifeJoinRoomBtn');
    this.roomIdInput = root.getElementById('roomIdInput');
    this.shareLinkInput = root.getElementById('shareLinkInput');
    this.copyLinkBtn = root.getElementById('copyLinkBtn');
    this.onlineColorEl = root.getElementById('lifeOnlineStatus');
    this.connectionStatusEl = root.getElementById('connectionStatus');

    this.mode = findLifeMode(readParams().get('mode'));
    this.playing = false;
    this.timer = 0;
    this.tool = 'draw';
    this.drawing = false;
    this.lastDrawPosition = null;
    this.camera = {
      rotX: -0.58,
      rotY: 0.82,
      zoom: 1,
      dragging: false,
      lastX: 0,
      lastY: 0
    };
    this.history = [];
    this.stateHashes = new Map();
    this.extinctionTime = null;
    this.initialCenter = null;
    this.applyingRemoteState = false;
    this.pendingOnlineSync = 0;
    this.lastOnlineSyncAt = 0;
    this.nextOnlineTurn = '';
    this.myColor = null;
    this.network = null;
    this.engine = createLifeEngine(modeToEngineConfig(this.mode));
  }

  install() {
    localizeStaticText(document, this.language);
    syncLifeLinks(this.language);
    this.installRangeValueReadouts();
    this.modeSelect.innerHTML = LIFE_MODES.map((mode) => `<option value="${mode.id}">${modeTitle(mode, this.language)}</option>`).join('');
    this.ruleSelect.innerHTML = listRulePresets().map((rule) => `<option value="${rule.id}">${rule.label}</option>`).join('');
    this.boardGeometrySelect.innerHTML = LIFE_GEOMETRIES.map((geometry) => `<option value="${geometry.id}">${geometryTitle(geometry, this.language)}</option>`).join('');

    this.modeSelect.addEventListener('change', () => this.applyMode(findLifeMode(this.modeSelect.value)));
    this.usageModeSelect.addEventListener('change', () => this.applyUsageMode());
    this.twoPlayerModeSelect.addEventListener('change', () => this.applyTwoPlayerMode());
    this.challengeGoalSelect.addEventListener('change', () => this.updateChallengeStatus());
    this.activePlayerSelect.addEventListener('change', () => this.syncToolButtons());
    this.boardGeometrySelect.addEventListener('change', () => this.applyGeometrySelection());

    [this.dimensionSelect, this.boardSizeSelect, this.latticeSelect, this.viewModeSelect, this.topologySelect,
      this.speciesSelect, this.ruleSelect, this.neighborhoodSelect, this.birthNoiseRange, this.deathNoiseRange,
      this.environmentNoiseRange, this.ruleNoiseRange, this.topologyDefectNoiseRange, this.mutationRange,
      this.ageRange, this.agingDeathRateRange, this.youngBirthBonusRange, this.oldAgePenaltyRange].forEach((control) => {
      if (!control) return;
      control.addEventListener('change', () => this.applyControls(true));
      control.addEventListener('input', () => this.applyControls(true));
    });

    this.root.querySelectorAll('[data-tool]').forEach((button) => button.addEventListener('click', () => this.setTool(button.dataset.tool)));
    this.root.getElementById('randomSeedButton').addEventListener('click', () => this.seedRandom());
    this.root.getElementById('stepButton').addEventListener('click', () => this.step());
    this.root.getElementById('resetButton').addEventListener('click', () => this.reset());
    this.playButton.addEventListener('click', () => this.togglePlay());
    this.root.getElementById('exportButton').addEventListener('click', () => this.exportPattern());
    this.root.getElementById('importButton').addEventListener('click', () => this.importPattern());
    this.installOnlineControls();

    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    this.canvas.addEventListener('wheel', (event) => this.handleCanvasWheel(event), { passive: false });
    this.canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.canvas.setPointerCapture?.(event.pointerId);
      if (this.isCameraInteraction(event)) {
        this.startCameraDrag(event);
      } else {
        this.drawing = true;
        this.lastDrawPosition = null;
        this.handleCanvasPointer(event);
      }
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (this.camera.dragging) this.updateCameraDrag(event);
      else if (this.drawing) { event.preventDefault(); this.handleCanvasPointer(event); }
    });
    window.addEventListener('pointerup', () => {
      this.drawing = false;
      this.lastDrawPosition = null;
      this.camera.dragging = false;
    });
    window.addEventListener('resize', () => this.draw());

    this.applyMode(this.mode);
    this.applyUsageMode();
    this.updateOnlineControls();
    this.tryJoinSharedRoomFromUrl();
  }

  installRangeValueReadouts() {
    this.rangeValueOutputs = [];
    this.root.querySelectorAll('.life-control-panel input[type="range"]').forEach((input) => {
      let output = input.parentElement?.querySelector(`output[data-life-range-value="${input.id}"]`);
      if (!output) {
        output = document.createElement('output');
        output.className = 'life-range-value';
        output.dataset.lifeRangeValue = input.id;
        output.setAttribute('for', input.id);
        input.insertAdjacentElement('afterend', output);
      }
      const update = () => {
        const value = Number(input.value);
        const step = Number(input.step || 1);
        const digits = Number.isInteger(step) ? 0 : Math.min(4, Math.max(2, String(input.step || '').split('.')[1]?.length || 0));
        output.textContent = Number.isFinite(value) ? formatNumber(value, digits) : input.value;
        output.value = output.textContent;
      };
      input.addEventListener('input', update);
      input.addEventListener('change', update);
      this.rangeValueOutputs.push(update);
      update();
    });
  }

  syncRangeValueReadouts() {
    for (const update of this.rangeValueOutputs || []) update();
  }

  populateLattices(geometryId, preferred) {
    const lattices = latticesForGeometry(geometryId);
    this.latticeSelect.innerHTML = lattices.map((lattice) => `<option value="${lattice.id}">${latticeTitle(lattice, this.language)}</option>`).join('');
    const ids = new Set(lattices.map((lattice) => lattice.id));
    this.latticeSelect.value = ids.has(preferred) ? preferred : lattices[0].id;
  }

  applyGeometrySelection() {
    const geometry = findLifeGeometry(this.boardGeometrySelect.value);
    this.dimensionSelect.value = String(geometry.dimension);
    this.topologySelect.value = geometry.topology;
    this.viewModeSelect.value = geometry.view;
    this.populateLattices(geometry.id, this.latticeSelect.value || (geometry.dimension === 3 ? 'sc' : 'square'));
    if (this.neighborhoodSelect.value === 'nearest' && geometry.dimension >= 2) {
      this.neighborhoodSelect.value = 'nearest';
    }
    this.applyControls(true);
  }

  applyMode(mode) {
    this.mode = mode;
    this.title.textContent = modeTitle(mode, this.language);
    this.description.textContent = modeLong(mode, this.language);
    this.tags.textContent = modeTags(mode, this.language).join(' · ');
    this.modeSelect.value = mode.id;
    const config = modeToEngineConfig(mode);
    const geometry = findLifeGeometry(mode.geometry || (config.dimension === 3 ? 'r3' : 'r2'));
    this.boardGeometrySelect.value = geometry.id;
    this.dimensionSelect.value = String(config.dimension);
    this.boardSizeSelect.value = String(config.dimension === 3 ? 40 : 64);
    this.topologySelect.value = config.boundary;
    this.viewModeSelect.value = geometry.view;
    this.populateLattices(geometry.id, config.lattice);
    this.speciesSelect.value = String(mode.species || config.rule.speciesCount || 1);
    this.ruleSelect.value = config.rule.id || 'conway';
    this.neighborhoodSelect.value = config.neighborhoodType || 'moore';
    this.birthNoiseRange.value = String(config.rule.birthNoise || 0);
    this.deathNoiseRange.value = String(config.rule.deathNoise || 0);
    this.environmentNoiseRange.value = String(config.rule.environmentNoise || 0);
    this.ruleNoiseRange.value = String(config.rule.ruleNoise || 0);
    this.topologyDefectNoiseRange.value = String(config.rule.topologyDefectNoise || 0);
    this.mutationRange.value = String(mode.mutation || config.rule.mutationRate || 0);
    this.ageRange.value = String(config.rule.maxAge || 0);
    this.agingDeathRateRange.value = String(config.rule.agingDeathRate || 0);
    this.youngBirthBonusRange.value = String(config.rule.youngBirthBonus || 0);
    this.oldAgePenaltyRange.value = String(config.rule.oldAgePenalty ?? 0.35);
    this.syncRangeValueReadouts();
    const params = readParams();
    params.set('mode', mode.id);
    params.set('lang', this.language);
    history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
    this.reset();
  }

  applyUsageMode() {
    const usage = this.usageModeSelect.value;
    document.body.dataset.lifeUsage = usage;
    if (usage === 'two') { this.speciesSelect.value = String(Math.max(2, Number(this.speciesSelect.value) || 2)); this.activePlayerSelect.value = '1'; }
    if (usage === 'one' && this.challengeGoalSelect.value === 'none') this.challengeGoalSelect.value = 'survive';
    this.applyTwoPlayerMode();
    this.applyControls(true);
    this.updateChallengeStatus();
  }

  applyTwoPlayerMode() {
    if (this.usageModeSelect.value !== 'two') return;
    const type = this.twoPlayerModeSelect.value;
    if (type === 'mutation-duel') { this.birthNoiseRange.value = '0.01'; this.deathNoiseRange.value = '0.01'; this.mutationRange.value = '0.025'; }
    if (type === 'ecosystem-balance') { this.speciesSelect.value = '3'; this.mutationRange.value = '0.01'; }
    this.syncRangeValueReadouts();
    this.applyControls(true);
  }

  currentSize() {
    const n = Math.max(8, Number(this.boardSizeSelect.value) || 64);
    const dimension = Math.max(1, Number(this.dimensionSelect.value) || 2);
    if (dimension === 1) return [n];
    if (dimension === 2) return [n, n];
    if (dimension === 3) return [Math.min(n, 64), Math.min(n, 64), Math.min(16, Math.max(4, Math.floor(n / 6)))];
    return [Math.min(n, 32), Math.min(n, 32), 4, 4];
  }

  applyControls(preserve = true) {
    const rule = getRulePreset(this.ruleSelect.value);
    const speciesCount = Math.max(1, Number(this.speciesSelect.value) || 1);
    rule.speciesCount = speciesCount;
    rule.birthNoise = Number(this.birthNoiseRange.value) || 0;
    rule.deathNoise = Number(this.deathNoiseRange.value) || 0;
    rule.environmentNoise = Number(this.environmentNoiseRange.value) || 0;
    rule.ruleNoise = Number(this.ruleNoiseRange.value) || 0;
    rule.topologyDefectNoise = Number(this.topologyDefectNoiseRange.value) || 0;
    rule.mutationRate = Number(this.mutationRange.value) || 0;
    rule.maxAge = Number(this.ageRange.value) || undefined;
    rule.agingDeathRate = Number(this.agingDeathRateRange.value) || 0;
    rule.youngBirthBonus = Number(this.youngBirthBonusRange.value) || 0;
    rule.oldAgePenalty = Number(this.oldAgePenaltyRange.value) || 0;

    this.engine.configure({
      dimension: Number(this.dimensionSelect.value),
      size: this.currentSize(),
      boundary: this.topologySelect.value,
      neighborhoodType: this.neighborhoodSelect.value,
      lattice: this.latticeSelect.value,
      rule
    });
    if (!preserve) this.engine.clear();
    this.draw();
    this.updateReadout();
  }

  reset() {
    this.stop();
    this.applyControls(false);
    this.history = [];
    this.stateHashes = new Map();
    this.extinctionTime = null;
    this.initialCenter = null;
    if (this.mode.id === 'moore-life') this.seedGlider(); else this.seedRandom();
  }

  seedGlider() {
    this.engine.clear();
    const cx = Math.floor(this.engine.size[0] / 2) - 1;
    const cy = Math.floor((this.engine.size[1] || 1) / 2) - 1;
    if (this.engine.dimension === 1) this.engine.seedPattern([[cx], [cx + 1], [cx + 2]]);
    else this.engine.seedPattern([[cx + 1, cy], [cx + 2, cy + 1], [cx, cy + 2], [cx + 1, cy + 2], [cx + 2, cy + 2]]);
    this.afterStateChange();
  }

  seedRandom() {
    this.applyControls(true);
    this.engine.randomSeed({ density: this.usageModeSelect.value === 'two' ? 0.08 : (Number(this.speciesSelect.value) > 1 ? 0.22 : 0.18), speciesCount: Number(this.speciesSelect.value) || 1 });
    this.afterStateChange();
  }

  step() {
    this.applyControls(true);
    this.engine.step();
    this.afterStateChange();
    const maxGen = Number(this.maxGenerationInput.value) || 0;
    if (maxGen > 0 && this.engine.generation >= maxGen) this.stop();
    if (this.engine.getObservables().population === 0) this.stop();
  }
  togglePlay() { this.playing ? this.stop() : this.start(); }
  start() { this.playing = true; this.playButton.textContent = t('pause', this.language); this.loop(); }
  stop() { this.playing = false; clearTimeout(this.timer); this.playButton.textContent = t('start', this.language); }
  loop() { if (!this.playing) return; this.step(); this.timer = setTimeout(() => this.loop(), Number(this.speedRange.value) || 130); }
  setTool(tool) { this.tool = tool; this.syncToolButtons(); }
  syncToolButtons() { this.root.querySelectorAll('[data-tool]').forEach((button) => button.classList.toggle('active', button.dataset.tool === this.tool)); }

  installOnlineControls() {
    if (!this.lifePlayModeSelect) return;
    this.network = new FirebaseStateNetworkManager(this, {
      gameKey: this.onlineGameKey(),
      matchKey: this.onlineMatchKey()
    });
    this.lifePlayModeSelect.addEventListener('change', () => this.updateOnlineControls());
    this.lifeCreateRoomBtn?.addEventListener('click', async () => {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls('Creating Life room...');
      await this.network?.createRoom();
    });
    this.lifeFindMatchBtn?.addEventListener('click', async () => {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls('Finding Life match...');
      await this.network?.findMatch();
    });
    this.lifeJoinRoomBtn?.addEventListener('click', async () => {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls('Joining Life room...');
      await this.network?.joinRoom(this.roomIdInput?.value || '');
    });
    this.copyLinkBtn?.addEventListener('click', async () => {
      const value = this.shareLinkInput?.value || '';
      if (!value) return;
      try {
        await navigator.clipboard?.writeText(value);
        this.setStatus('Share link copied.');
      } catch {
        this.shareLinkInput?.select?.();
        this.setStatus('Copy the selected share link.');
      }
    });
  }

  onlineGameKey() {
    return 'life-world';
  }

  onlineMatchKey() {
    const values = [
      this.onlineGameKey(),
      this.modeSelect?.value || this.mode?.id || 'life',
      this.usageModeSelect?.value || 'zero',
      this.twoPlayerModeSelect?.value || 'seed-war',
      this.challengeGoalSelect?.value || 'none',
      this.boardGeometrySelect?.value || 'r2',
      this.latticeSelect?.value || 'square',
      this.viewModeSelect?.value || 'flat',
      this.dimensionSelect?.value || '2',
      this.boardSizeSelect?.value || '64',
      this.ruleSelect?.value || 'conway',
      this.neighborhoodSelect?.value || 'moore',
      `bn${this.birthNoiseRange?.value || 0}`,
      `dn${this.deathNoiseRange?.value || 0}`,
      `en${this.environmentNoiseRange?.value || 0}`,
      `rn${this.ruleNoiseRange?.value || 0}`,
      `td${this.topologyDefectNoiseRange?.value || 0}`,
      `mu${this.mutationRange?.value || 0}`,
      `age${this.ageRange?.value || 0}`
    ];
    return values.join(':');
  }

  readControlValues() {
    const controls = {};
    ['usageModeSelect', 'twoPlayerModeSelect', 'challengeGoalSelect', 'activePlayerSelect', 'boardGeometrySelect',
      'latticeSelect', 'viewModeSelect', 'dimensionSelect', 'boardSizeSelect', 'topologySelect', 'speciesSelect',
      'ruleSelect', 'neighborhoodSelect', 'speedRange', 'birthNoiseRange', 'deathNoiseRange', 'environmentNoiseRange',
      'ruleNoiseRange', 'topologyDefectNoiseRange', 'mutationRange', 'ageRange', 'agingDeathRateRange',
      'youngBirthBonusRange', 'oldAgePenaltyRange', 'maxGenerationInput'].forEach((key) => {
      if (this[key]) controls[key] = this[key].value;
    });
    return controls;
  }

  writeControlValues(controls = {}) {
    Object.entries(controls).forEach(([key, value]) => {
      if (this[key] && value != null) this[key].value = String(value);
    });
  }

  exportNetworkState() {
    const engine = this.engine.exportState();
    engine.cells = engine.cells.map(compactLifeCell);
    return {
      version: 1,
      kind: 'life-world-state',
      currentPlayer: this.nextOnlineTurn || 'white',
      mode: this.mode?.id || this.modeSelect?.value || 'moore-life',
      controls: this.readControlValues(),
      engine,
      history: this.history.slice(-80)
    };
  }

  importNetworkState(payload = {}) {
    const engineState = payload.engine || payload.state || payload;
    if (!engineState?.cells) return;
    this.applyingRemoteState = true;
    try {
      this.stop();
      if (payload.mode) {
        this.mode = findLifeMode(payload.mode);
        this.modeSelect.value = this.mode.id;
        this.title.textContent = modeTitle(this.mode, this.language);
        this.description.textContent = modeLong(this.mode, this.language);
        this.tags.textContent = modeTags(this.mode, this.language).join(' · ');
      }
      this.writeControlValues(payload.controls || {});
      if (this.boardGeometrySelect?.value) this.populateLattices(this.boardGeometrySelect.value, this.latticeSelect.value);
      const expanded = {
        ...engineState,
        cells: (engineState.cells || []).map(expandLifeCell)
      };
      this.engine.importState(expanded);
      this.dimensionSelect.value = String(this.engine.dimension);
      this.boardSizeSelect.value = String(this.engine.size[0]);
      this.topologySelect.value = this.engine.topology.boundary;
      this.neighborhoodSelect.value = this.engine.neighborhoodType;
      this.latticeSelect.value = this.engine.lattice || this.latticeSelect.value;
      this.history = Array.isArray(payload.history) ? payload.history.slice(-80) : [];
      this.stateHashes = new Map();
      this.extinctionTime = null;
      const obs = this.engine.getObservables();
      if (!this.history.length) this.history.push(structuredClone(obs));
      this.draw();
      this.updateReadout(obs);
      this.updateChallengeStatus(obs);
      this.drawPlots();
    } finally {
      this.applyingRemoteState = false;
    }
  }

  updateOnlineControls(message = '') {
    if (!this.lifePlayModeSelect) return;
    const online = this.lifePlayModeSelect.value === 'online';
    if (this.lifeCreateRoomBtn) this.lifeCreateRoomBtn.disabled = !online;
    if (this.lifeFindMatchBtn) this.lifeFindMatchBtn.disabled = !online;
    if (this.lifeJoinRoomBtn) this.lifeJoinRoomBtn.disabled = !online;
    if (this.roomIdInput) this.roomIdInput.disabled = !online;
    const text = message || (online
      ? 'Online room mode is ready. Create a room, find a match, or join by room code.'
      : 'Local board only. Switch to Online room to use matchmaking, room codes, or shared links.');
    this.setStatus(text);
  }

  setStatus(text) {
    if (this.onlineColorEl) this.onlineColorEl.textContent = text || '';
  }

  setOnlineColor(color, roomId, room) {
    this.myColor = color || null;
    if (!this.onlineColorEl) return;
    if (!roomId) {
      this.onlineColorEl.textContent = 'Local board only.';
      return;
    }
    if (room?.status === 'waiting') {
      this.onlineColorEl.textContent = `Room ${roomId}: waiting for opponent.`;
      return;
    }
    this.onlineColorEl.textContent = color ? `Connected as ${color}. The Life board is synchronized.` : 'Connected as spectator.';
  }

  updateOnlineRoomUI(roomId) {
    if (this.lifePlayModeSelect && roomId) this.lifePlayModeSelect.value = 'online';
  }

  tryJoinSharedRoomFromUrl() {
    const room = readParams().get('room');
    if (!room || !this.network || !this.lifePlayModeSelect) return;
    this.lifePlayModeSelect.value = 'online';
    if (this.roomIdInput) this.roomIdInput.value = room;
    window.setTimeout(() => this.network?.joinRoom(room), 120);
  }

  queueOnlineSync() {
    if (this.applyingRemoteState || this.lifePlayModeSelect?.value !== 'online' || !this.network?.isConnected) return;
    const now = Date.now();
    const elapsed = now - this.lastOnlineSyncAt;
    if (elapsed < 650) {
      if (!this.pendingOnlineSync) {
        this.pendingOnlineSync = window.setTimeout(() => {
          this.pendingOnlineSync = 0;
          this.queueOnlineSync();
        }, 650 - elapsed);
      }
      return;
    }
    this.lastOnlineSyncAt = now;
    this.nextOnlineTurn = this.myColor === 'white' ? 'black' : 'white';
    this.network.sendState({ type: 'life_state_update' }).finally(() => { this.nextOnlineTurn = ''; });
  }


  is3DView() {
    return this.engine.dimension >= 3 || this.viewModeSelect.value === 'surface3d';
  }

  isCameraInteraction(event) {
    return this.is3DView() && (
      this.tool === 'inspect'
      || event.shiftKey
      || event.altKey
      || event.button === 1
      || event.button === 2
    );
  }

  startCameraDrag(event) {
    event.preventDefault();
    this.camera.dragging = true;
    this.camera.lastX = event.clientX;
    this.camera.lastY = event.clientY;
  }

  updateCameraDrag(event) {
    event.preventDefault();
    const dx = event.clientX - this.camera.lastX;
    const dy = event.clientY - this.camera.lastY;
    this.camera.lastX = event.clientX;
    this.camera.lastY = event.clientY;
    this.camera.rotY += dx * 0.012;
    this.camera.rotX = Math.max(-1.35, Math.min(1.35, this.camera.rotX + dy * 0.012));
    this.draw();
  }

  handleCanvasWheel(event) {
    if (!this.is3DView()) return;
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    this.camera.zoom = Math.max(0.45, Math.min(2.7, this.camera.zoom * factor));
    this.draw();
  }

  handleCanvasPointer(event) {
    const position = this.eventToPosition(event);
    if (!position) return;
    if (this.tool === 'inspect') {
      const cell = this.engine.getCell(position);
      this.challengeStatus.textContent = `${t('status', this.language)}: ${position.join(',')} species=${cell.species || 0} age=${cell.age || 0}`;
      return;
    }
    const positions = this.drawing && this.lastDrawPosition
      ? this.interpolatePositions(this.lastDrawPosition, position)
      : [position];
    for (const item of positions) this.applyToolAtPosition(item);
    this.lastDrawPosition = position;
    this.afterStateChange();
  }

  applyToolAtPosition(position) {
    if (this.tool === 'erase') {
      this.engine.setCell(position, { state: 0, species: 0, age: 0 });
      return;
    }
    const species = this.usageModeSelect.value === 'two'
      ? Number(this.activePlayerSelect.value)
      : Number(this.activePlayerSelect.value || this.speciesSelect.value || 1);
    this.engine.setCell(position, { state: 1, species, age: 1, energy: 1, health: 1 });
  }

  interpolatePositions(start, end) {
    if (!Array.isArray(start) || !Array.isArray(end) || start.length !== end.length) return [end];
    const maxDelta = Math.max(...end.map((value, index) => Math.abs(value - start[index])));
    const steps = Math.max(1, maxDelta);
    const seen = new Set();
    const positions = [];
    for (let step = 0; step <= steps; step += 1) {
      const tValue = step / steps;
      const position = end.map((value, index) => Math.round(start[index] + (value - start[index]) * tValue));
      const key = position.join(',');
      if (!seen.has(key)) { seen.add(key); positions.push(position); }
    }
    return positions;
  }

  canvasPointFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * this.canvas.height
    };
  }

  eventToPosition(event) {
    const point = this.canvasPointFromEvent(event);
    if (!point) return null;
    if (this.isProjectedDrawingView()) {
      const projected = this.projectedPointToPosition(point);
      if (projected) return projected;
    }
    const clampIndex = (value, max) => Math.max(0, Math.min(max - 1, Math.floor(value * max)));
    const x = clampIndex(point.x / this.canvas.width, this.engine.size[0]);
    const y = this.engine.dimension >= 2 ? clampIndex(point.y / this.canvas.height, this.engine.size[1]) : 0;
    if (x < 0 || x >= this.engine.size[0]) return null;
    if (this.engine.dimension === 1) return [x];
    if (y < 0 || y >= this.engine.size[1]) return null;
    if (this.engine.dimension === 2) return [x, y];
    if (this.engine.dimension === 3) return [x, y, Math.floor(this.engine.size[2] / 2)];
    return [x, y, 0, 0];
  }

  isProjectedDrawingView() {
    const view = this.viewModeSelect.value;
    return (this.engine.dimension === 2 && view === 'surface3d') || this.engine.dimension >= 3 || view === 'volume';
  }

  projectedPointToPosition(point) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    let nearest = null;
    let nearestDistance = Infinity;
    const limitX = this.engine.size[0];
    const limitY = this.engine.dimension >= 2 ? this.engine.size[1] : 1;
    const z = this.engine.dimension >= 3 ? Math.floor(this.engine.size[2] / 2) : 0;
    for (let y = 0; y < limitY; y += 1) {
      for (let x = 0; x < limitX; x += 1) {
        const raw = this.engine.dimension >= 3 || this.viewModeSelect.value === 'volume'
          ? this.volumeRawPoint(x, y, z)
          : this.surfaceRawPoint(x + 0.5, y + 0.5);
        const projected = this.projectPoint(raw, width, height, this.engine.dimension >= 3 ? 0.86 : 0.82);
        const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = this.engine.dimension >= 3 ? [x, y, z] : [x, y];
        }
      }
    }
    const cellScale = Math.max(8, Math.min(width / Math.max(1, limitX), height / Math.max(1, limitY)) * this.camera.zoom * 1.4);
    return nearestDistance <= cellScale ? nearest : null;
  }

  afterStateChange() {
    const obs = this.engine.getObservables();
    const hash = hashAliveCells(this.engine);
    const center = centerOfMass(this.engine);
    if (obs.population === 0 && this.extinctionTime == null) this.extinctionTime = obs.generation;
    if (!this.initialCenter && center) this.initialCenter = center;
    if (hash && this.stateHashes.has(hash)) obs.oscillationPeriod = obs.generation - this.stateHashes.get(hash);
    else if (hash) this.stateHashes.set(hash, obs.generation);
    obs.frontVelocity = this.initialCenter && center && obs.generation > 0 ? distance(this.initialCenter, center) / obs.generation : 0;
    this.history.push(structuredClone(obs));
    if (this.history.length > 220) this.history.shift();
    this.draw(); this.updateReadout(obs); this.updateChallengeStatus(obs); this.drawPlots();
    this.queueOnlineSync();
  }

  updateReadout(obs = this.engine.getObservables()) {
    this.obs.Generation.textContent = String(obs.generation);
    this.obs.Population.textContent = String(obs.population);
    this.obs.Density.textContent = formatNumber(obs.density);
    this.obs.BirthRate.textContent = formatNumber(obs.birthRate);
    this.obs.DeathRate.textContent = formatNumber(obs.deathRate);
    this.obs.SpeciesFractions.textContent = compactObject(obs.speciesFractions);
    this.obs.MeanAge.textContent = formatNumber(obs.meanAge ?? obs.averageAge, 2);
    this.obs.AgeDistribution.textContent = compactObject(obs.ageDistribution, 0);
    this.obs.ClusterCount.textContent = String(obs.clusterCount || 0);
    this.obs.LargestCluster.textContent = String(obs.largestClusterSize || 0);
    this.obs.Entropy.textContent = formatNumber(obs.entropy);
    this.obs.Correlation.textContent = formatNumber(obs.spatialCorrelation);
    this.obs.ExtinctionTime.textContent = this.extinctionTime == null ? '—' : String(this.extinctionTime);
    this.obs.SurvivalTime.textContent = String(obs.generation);
    this.obs.Oscillation.textContent = obs.oscillationPeriod ? `${t('detected', this.language)} P=${obs.oscillationPeriod}` : t('notYet', this.language);
    this.obs.FrontVelocity.textContent = formatNumber(obs.frontVelocity || 0);
    const scores = this.computeScores(obs);
    this.scoreA.textContent = formatNumber(scores.a, 1);
    this.scoreB.textContent = formatNumber(scores.b, 1);
  }

  computeScores(obs = this.engine.getObservables()) {
    const total = obs.population || 0;
    const aCells = obs.speciesCounts?.[1] || 0;
    const bCells = obs.speciesCounts?.[2] || 0;
    const diversity = Math.max(0, obs.entropy || 0) * 8;
    const stability = this.history.length > 8 ? Math.max(0, 20 - Math.abs(total - this.history[this.history.length - 8].population)) : 0;
    const overcrowding = obs.density > 0.45 ? (obs.density - 0.45) * 80 : 0;
    const extinctionA = aCells === 0 && obs.generation > 0 ? 50 : 0;
    const extinctionB = bCells === 0 && obs.generation > 0 ? 50 : 0;
    const territoryA = (obs.speciesClusters?.[1] || 0) * 2 + (obs.largestClusterSize || 0) * (aCells >= bCells ? 0.12 : 0.04);
    const territoryB = (obs.speciesClusters?.[2] || 0) * 2 + (obs.largestClusterSize || 0) * (bCells > aCells ? 0.12 : 0.04);
    return { a: aCells + territoryA + stability + diversity - overcrowding - extinctionA, b: bCells + territoryB + stability + diversity - overcrowding - extinctionB };
  }

  updateChallengeStatus(obs = this.engine.getObservables()) {
    const usage = this.usageModeSelect.value;
    if (usage === 'zero') { this.challengeStatus.textContent = `${t('status', this.language)}: ${t('running', this.language)}`; return; }
    if (usage === 'two') {
      const scores = this.computeScores(obs);
      const lead = scores.a === scores.b ? 'Tie' : (scores.a > scores.b ? t('playerA', this.language) : t('playerB', this.language));
      this.challengeStatus.textContent = `${t('status', this.language)}: ${lead}`; return;
    }
    const goal = this.challengeGoalSelect.value;
    const maxGen = Number(this.maxGenerationInput.value) || 500;
    let state = t('running', this.language);
    if (goal === 'survive') state = obs.population > 0 && obs.generation >= maxGen ? t('passed', this.language) : (obs.population ? t('running', this.language) : t('failed', this.language));
    if (goal === 'population-band') state = obs.population >= 40 && obs.population <= Math.max(120, this.engine.cells.length * 0.22) ? t('passed', this.language) : t('running', this.language);
    if (goal === 'oscillator') state = obs.oscillationPeriod ? t('passed', this.language) : t('notYet', this.language);
    if (goal === 'glider') state = (obs.frontVelocity || 0) > 0.08 && obs.population > 0 ? t('passed', this.language) : t('notYet', this.language);
    if (goal === 'noise-survival') state = obs.population > 0 && obs.generation > 120 ? t('passed', this.language) : (obs.population ? t('running', this.language) : t('failed', this.language));
    if (goal === 'invasive-control') state = obs.density < 0.42 && obs.population > 0 ? t('passed', this.language) : t('running', this.language);
    if (goal === 'ecosystem') state = obs.speciesRichness >= 2 && obs.generation > 80 ? t('passed', this.language) : t('running', this.language);
    this.challengeStatus.textContent = `${t('status', this.language)}: ${state}`;
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.max(320, Math.floor(Math.min(rect.width, rect.height) * ratio));
    if (this.canvas.width !== size || this.canvas.height !== size) { this.canvas.width = size; this.canvas.height = size; }
  }


  rotatePoint(point) {
    const cy = Math.cos(this.camera.rotY);
    const sy = Math.sin(this.camera.rotY);
    const cx = Math.cos(this.camera.rotX);
    const sx = Math.sin(this.camera.rotX);

    const x1 = point.x * cy - point.z * sy;
    const z1 = point.x * sy + point.z * cy;
    const y1 = point.y * cx - z1 * sx;
    const z2 = point.y * sx + z1 * cx;
    return { x: x1, y: y1, z: z2 };
  }

  projectPoint(point, width, height, scale = 1) {
    const rotated = this.rotatePoint(point);
    const perspective = 1 / (2.9 - rotated.z * 0.58);
    const s = Math.min(width, height) * 0.47 * this.camera.zoom * scale * perspective;
    return {
      x: width / 2 + rotated.x * s,
      y: height / 2 + rotated.y * s,
      z: rotated.z,
      perspective
    };
  }

  surfaceRawPoint(x, y) {
    const geom = this.boardGeometrySelect.value;
    const nx = Math.max(1, this.engine.size[0]);
    const ny = Math.max(1, this.engine.size[1] || 1);
    const u = (x / nx) * Math.PI * 2;
    const vv = (y / Math.max(1, ny - 1));
    const v2 = (y / ny) * Math.PI * 2;
    const vPi = vv * Math.PI;

    if (geom === 'sphere' || geom === 'rp2') {
      return {
        x: Math.cos(u) * Math.sin(vPi),
        y: -Math.cos(vPi),
        z: Math.sin(u) * Math.sin(vPi)
      };
    }

    if (geom === 'mobius') {
      const band = (vv - 0.5) * 0.9;
      const r = 1 + band * Math.cos(u / 2);
      return {
        x: r * Math.cos(u),
        y: band * Math.sin(u / 2),
        z: r * Math.sin(u)
      };
    }

    if (geom === 'klein') {
      const r = 1 + 0.32 * Math.cos(v2);
      return {
        x: r * Math.cos(u),
        y: 0.32 * Math.sin(v2) + 0.18 * Math.sin(2 * u),
        z: r * Math.sin(u) * 0.72 + 0.18 * Math.cos(2 * u)
      };
    }

    if (geom === 't2') {
      const R = 1;
      const r = 0.34;
      return {
        x: (R + r * Math.cos(v2)) * Math.cos(u),
        y: r * Math.sin(v2),
        z: (R + r * Math.cos(v2)) * Math.sin(u)
      };
    }

    return {
      x: (x / Math.max(1, nx - 1) - 0.5) * 1.8,
      y: (y / Math.max(1, ny - 1) - 0.5) * 1.8,
      z: 0
    };
  }

  volumeRawPoint(x, y, z) {
    const nx = Math.max(1, this.engine.size[0] - 1);
    const ny = Math.max(1, (this.engine.size[1] || 1) - 1);
    const nz = Math.max(1, (this.engine.size[2] || 1) - 1);
    return {
      x: (x / nx - 0.5) * 1.75,
      y: (y / ny - 0.5) * 1.75,
      z: (z / nz - 0.5) * 1.75
    };
  }

  drawPath3D(ctx, points, width, height, scale = 1) {
    if (!points.length) return;
    ctx.beginPath();
    points.forEach((point, index) => {
      const p = this.projectPoint(point, width, height, scale);
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }

  drawSurfaceBoundary(ctx, width, height) {
    const nx = Math.max(1, this.engine.size[0]);
    const ny = Math.max(1, this.engine.size[1] || 1);
    ctx.save();
    ctx.lineWidth = Math.max(1.2, width / 520);
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.34)';

    const uSteps = Math.min(nx, 64);
    const vSteps = Math.min(ny, 64);
    for (let i = 0; i < uSteps; i += 1) {
      const x = (i / uSteps) * nx;
      const line = [];
      for (let j = 0; j <= ny; j += 1) line.push(this.surfaceRawPoint(x, j));
      this.drawPath3D(ctx, line, width, height, 0.82);
    }
    for (let j = 0; j <= vSteps; j += 1) {
      const y = (j / vSteps) * ny;
      const line = [];
      for (let i = 0; i <= nx; i += 1) line.push(this.surfaceRawPoint(i, y));
      this.drawPath3D(ctx, line, width, height, 0.82);
    }

    ctx.strokeStyle = 'rgba(245, 182, 71, 0.88)';
    ctx.lineWidth = Math.max(2.2, width / 360);
    this.drawPath3D(ctx, Array.from({ length: nx + 1 }, (_, i) => this.surfaceRawPoint(i, 0)), width, height, 0.82);
    this.drawPath3D(ctx, Array.from({ length: nx + 1 }, (_, i) => this.surfaceRawPoint(i, ny)), width, height, 0.82);

    ctx.fillStyle = 'rgba(245, 182, 71, 0.92)';
    ctx.font = `${Math.max(12, width / 48)}px ui-sans-serif, system-ui`;
    ctx.fillText(`${this.boardGeometrySelect.value.toUpperCase()} boundary`, 14, 26);
    ctx.restore();
  }

  drawSurfaceCells(ctx, width, height) {
    const radius = Math.max(1.9, width / this.engine.size[0] * 0.42) * this.camera.zoom;
    const cells = [];
    for (let y = 0; y < this.engine.size[1]; y += 1) {
      for (let x = 0; x < this.engine.size[0]; x += 1) {
        const cell = this.engine.getCell([x, y]);
        if (!isAlive(cell)) continue;
        const raw = this.surfaceRawPoint(x + 0.5, y + 0.5);
        const rotated = this.rotatePoint(raw);
        cells.push({ x, y, cell, raw, z: rotated.z });
      }
    }
    cells.sort((a, b) => a.z - b.z);
    for (const item of cells) {
      const p = this.projectPoint(item.raw, width, height, 0.82);
      const maxAge = Number(this.ageRange.value) || 0;
      const ageAlpha = maxAge ? Math.max(0.34, 1 - (item.cell.age || 0) / (maxAge + 6)) : 0.94;
      ctx.globalAlpha = ageAlpha * (0.58 + 0.42 * Math.max(0, p.perspective));
      ctx.fillStyle = COLORS[item.cell.species] || COLORS[1];
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * p.perspective, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawVolumeBoundary(ctx, width, height) {
    const corners = [
      [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
      [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
    ].map(([x, y, z]) => ({ x: (x - 0.5) * 1.85, y: (y - 0.5) * 1.85, z: (z - 0.5) * 1.85 }));
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    ctx.save();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.38)';
    ctx.lineWidth = Math.max(1.4, width / 480);
    for (const [a, b] of edges) this.drawPath3D(ctx, [corners[a], corners[b]], width, height, 0.86);

    const nx = Math.max(1, this.engine.size[0]);
    const ny = Math.max(1, this.engine.size[1] || 1);
    const nz = Math.max(1, this.engine.size[2] || 1);
    const activeZ = nz > 1 ? Math.floor(nz / 2) : 0;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = Math.max(0.7, width / 980);
    if (nx <= 80 && ny <= 80) {
      for (let x = 0; x < nx; x += 1) this.drawPath3D(ctx, [this.volumeRawPoint(x, 0, activeZ), this.volumeRawPoint(x, ny - 1, activeZ)], width, height, 0.86);
      for (let y = 0; y < ny; y += 1) this.drawPath3D(ctx, [this.volumeRawPoint(0, y, activeZ), this.volumeRawPoint(nx - 1, y, activeZ)], width, height, 0.86);
    }

    ctx.strokeStyle = 'rgba(245, 182, 71, 0.72)';
    ctx.lineWidth = Math.max(2.2, width / 360);
    this.drawPath3D(ctx, [corners[0], corners[1], corners[2], corners[3], corners[0]], width, height, 0.86);

    ctx.fillStyle = 'rgba(245, 182, 71, 0.92)';
    ctx.font = `${Math.max(12, width / 48)}px ui-sans-serif, system-ui`;
    ctx.fillText(`${this.boardGeometrySelect.value.toUpperCase()} volume`, 14, 26);
    ctx.restore();
  }

  drawVolumeCells(ctx, width, height) {
    const depth = this.engine.size[2] || 1;
    const cells = [];
    for (let z = 0; z < depth; z += 1) {
      for (let y = 0; y < this.engine.size[1]; y += 1) {
        for (let x = 0; x < this.engine.size[0]; x += 1) {
          const cell = this.engine.getCell([x, y, z]);
          if (!isAlive(cell)) continue;
          const raw = this.volumeRawPoint(x, y, z);
          const rotated = this.rotatePoint(raw);
          cells.push({ cell, raw, z: rotated.z });
        }
      }
    }
    cells.sort((a, b) => a.z - b.z);
    const base = Math.max(2.1, width / this.engine.size[0] * 0.55) * this.camera.zoom;
    for (const item of cells) {
      const p = this.projectPoint(item.raw, width, height, 0.86);
      const maxAge = Number(this.ageRange.value) || 0;
      const ageAlpha = maxAge ? Math.max(0.34, 1 - (item.cell.age || 0) / (maxAge + 6)) : 0.92;
      ctx.globalAlpha = ageAlpha * (0.42 + 0.58 * Math.max(0.22, p.perspective));
      ctx.fillStyle = COLORS[item.cell.species] || COLORS[1];
      ctx.beginPath();
      ctx.arc(p.x, p.y, base * p.perspective, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawFlatBoundary(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 182, 71, 0.84)';
    ctx.lineWidth = Math.max(2.2, width / 320);
    ctx.strokeRect(1, 1, width - 2, height - 2);
    ctx.fillStyle = 'rgba(245, 182, 71, 0.92)';
    ctx.font = `${Math.max(12, width / 48)}px ui-sans-serif, system-ui`;
    ctx.fillText(`${this.boardGeometrySelect.value.toUpperCase()} cut-open board`, 14, 26);
    ctx.restore();
  }

  draw() {
    this.resizeCanvas();
    const ctx = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#050a12';
    ctx.fillRect(0, 0, width, height);

    const view = this.viewModeSelect.value;
    if (this.engine.dimension === 2 && view === 'surface3d') {
      this.drawSurfaceBoundary(ctx, width, height);
      this.drawSurfaceCells(ctx, width, height);
      return;
    }

    if (this.engine.dimension >= 3 || view === 'volume') {
      this.drawVolumeBoundary(ctx, width, height);
      this.drawVolumeCells(ctx, width, height);
      return;
    }

    const sx = width / this.engine.size[0];
    const sy = height / (this.engine.size[1] || 1);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = Math.max(0.6, Math.min(1.2, Math.min(sx, sy) * 0.035));
    for (let x = 0; x <= this.engine.size[0]; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * sx, 0);
      ctx.lineTo(x * sx, height);
      ctx.stroke();
    }
    if (this.engine.dimension >= 2) {
      for (let y = 0; y <= this.engine.size[1]; y += 1) {
        ctx.beginPath();
        ctx.moveTo(0, y * sy);
        ctx.lineTo(width, y * sy);
        ctx.stroke();
      }
    }
    if (Math.min(sx, sy) >= 14) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.10)';
      ctx.lineWidth = 0.5;
      for (let x = 0.5; x < this.engine.size[0]; x += 1) {
        ctx.beginPath();
        ctx.moveTo(x * sx, 0);
        ctx.lineTo(x * sx, height);
        ctx.stroke();
      }
      if (this.engine.dimension >= 2) {
        for (let y = 0.5; y < this.engine.size[1]; y += 1) {
          ctx.beginPath();
          ctx.moveTo(0, y * sy);
          ctx.lineTo(width, y * sy);
          ctx.stroke();
        }
      }
    }
    this.drawFlatBoundary(ctx, width, height);

    const yLimit = this.engine.dimension === 1 ? 1 : this.engine.size[1];
    for (let y = 0; y < yLimit; y += 1) {
      for (let x = 0; x < this.engine.size[0]; x += 1) {
        const position = this.engine.dimension === 1 ? [x] : [x, y];
        const cell = this.engine.getCell(position);
        if (!isAlive(cell)) continue;
        const maxAge = Number(this.ageRange.value) || 0;
        const ageAlpha = maxAge ? Math.max(0.34, 1 - (cell.age || 0) / (maxAge + 6)) : 0.94;
        ctx.globalAlpha = ageAlpha;
        ctx.fillStyle = COLORS[cell.species] || COLORS[1];
        const drawY = this.engine.dimension === 1 ? height * 0.46 : y * sy;
        const drawH = this.engine.dimension === 1 ? Math.max(4, height * 0.08) : Math.max(1, sy - 2);
        ctx.fillRect(x * sx + 1, drawY + 1, Math.max(1, sx - 2), drawH);
      }
    }
    ctx.globalAlpha = 1;
  }

  drawPlots() { this.drawLinePlot(this.populationPlot, this.history.map((item) => item.population), '#22c55e'); this.drawSpeciesPlot(); }
  drawLinePlot(canvas, values, color) {
    const ctx = canvas.getContext('2d'); const width = canvas.width; const height = canvas.height;
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = 'rgba(5,10,18,0.82)'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(148,163,184,0.18)'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) { const y = (height / 4) * i; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    if (values.length < 2) return; const max = Math.max(1, ...values);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    values.forEach((value, i) => { const x = (i / Math.max(1, values.length - 1)) * width; const y = height - (value / max) * (height - 12) - 6; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke();
  }
  drawSpeciesPlot() {
    const canvas = this.speciesPlot; const ctx = canvas.getContext('2d'); const width = canvas.width; const height = canvas.height;
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = 'rgba(5,10,18,0.82)'; ctx.fillRect(0, 0, width, height);
    [1, 2, 3].forEach((species) => { const values = this.history.map((item) => item.speciesFractions?.[species] || 0); if (values.length < 2) return; ctx.strokeStyle = COLORS[species]; ctx.lineWidth = 2; ctx.beginPath(); values.forEach((value, i) => { const x = (i / Math.max(1, values.length - 1)) * width; const y = height - value * (height - 12) - 6; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); });
  }

  exportPattern() {
    const payload = { version: 2, exportedAt: new Date().toISOString(), mode: this.mode.id, geometry: this.boardGeometrySelect.value, lattice: this.latticeSelect.value, viewMode: this.viewModeSelect.value, usage: this.usageModeSelect.value, twoPlayerMode: this.twoPlayerModeSelect.value, challengeGoal: this.challengeGoalSelect.value, state: this.engine.exportState() };
    this.patternJson.value = JSON.stringify(payload, null, 2);
  }

  importPattern() {
    try {
      const payload = JSON.parse(this.patternJson.value); const state = payload.state || payload;
      this.engine.importState(state);
      this.dimensionSelect.value = String(this.engine.dimension); this.boardSizeSelect.value = String(this.engine.size[0]); this.topologySelect.value = this.engine.topology.boundary; this.neighborhoodSelect.value = this.engine.neighborhoodType; this.latticeSelect.value = this.engine.lattice || this.latticeSelect.value;
      if (payload.geometry) { this.boardGeometrySelect.value = payload.geometry; this.applyGeometrySelection(); }
      if (payload.viewMode) this.viewModeSelect.value = payload.viewMode;
      if (payload.mode) { this.mode = findLifeMode(payload.mode); this.modeSelect.value = this.mode.id; this.title.textContent = modeTitle(this.mode, this.language); this.description.textContent = modeLong(this.mode, this.language); this.tags.textContent = modeTags(this.mode, this.language).join(' · '); }
      this.history = []; this.stateHashes = new Map(); this.extinctionTime = null; this.afterStateChange();
    } catch (error) { this.challengeStatus.textContent = `Import failed: ${error.message}`; }
  }
}

export function installLifeUI(root = document) { const ui = new LifeUI(root); ui.install(); return ui; }
