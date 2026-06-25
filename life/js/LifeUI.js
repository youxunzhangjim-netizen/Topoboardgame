import { createLifeEngine, isAlive } from './LifeEngine.js';
import { listRulePresets, getRulePreset, rulePresetLabel } from './presets.js';
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
const SQRT3 = Math.sqrt(3);
const TAU = Math.PI * 2;
const LATTICE_RULE_TUNING = Object.freeze({
  triangular: { rule: 'B2/S12', birth: [2], survival: [1, 2], neighborhoodType: 'nearest', latticeNeighborCount: 3 },
  honeycomb: { rule: 'B2/S34', birth: [2], survival: [3, 4], neighborhoodType: 'nearest', latticeNeighborCount: 6 }
});

function readParams() { return new URLSearchParams(window.location.search); }
function wrapAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}
function kleinBottleSurfacePoint(u, v) {
  const parameterU = wrapAngle(u);
  const sinU = Math.sin(parameterU);
  const cosU = Math.cos(parameterU);
  const sinV = Math.sin(v);
  const cosV = Math.cos(v);
  const tube = 2 * (1 - cosU / 2) * 1.72 / 1.4;
  const rawX = parameterU < Math.PI
    ? 3 * cosU * (1 + sinU) + tube * cosU * cosV
    : 3 * cosU * (1 + sinU) + tube * Math.cos(v + Math.PI);
  const rawY = -2 * (1 - cosU / 2) * sinV;
  const rawZ = parameterU < Math.PI
    ? -8 * sinU - tube * sinU * cosV
    : -8 * sinU;
  return {
    x: rawX * 0.52 * 0.34,
    y: rawZ * 0.52 * 0.26,
    z: rawY * 0.52 * 0.55
  };
}
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

function tuneRuleForLattice(rule, lattice, dimension) {
  const tuning = Number(dimension) === 2 ? LATTICE_RULE_TUNING[lattice] : null;
  if (!tuning || rule.type !== 'life-like') return rule;
  return {
    ...rule,
    rule: tuning.rule,
    birth: [...tuning.birth],
    survival: [...tuning.survival],
    neighborhoodType: tuning.neighborhoodType,
    latticeNeighborCount: tuning.latticeNeighborCount
  };
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
    size: geometry.dimension === 3 ? [40, 40, 10] : [48, 48],
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
    this.gridToggleButton = root.getElementById('lifeGridToggleBtn');

    this.lifePlayModeSelect = root.getElementById('lifePlayModeSelect');
    this.lifeCreateRoomBtn = root.getElementById('lifeCreateRoomBtn');
    this.lifeFindMatchBtn = root.getElementById('lifeFindMatchBtn');
    this.lifeJoinRoomBtn = root.getElementById('lifeJoinRoomBtn');
    this.roomIdInput = root.getElementById('roomIdInput');
    this.shareLinkInput = root.getElementById('shareLinkInput');
    this.copyLinkBtn = root.getElementById('copyLinkBtn');
    this.onlineColorEl = root.getElementById('lifeOnlineStatus');
    this.connectionStatusEl = root.getElementById('connectionStatus');
    this.lifeOnlineControls = root.querySelector('.life-online-controls');

    this.mode = findLifeMode(readParams().get('mode'));
    this.playing = false;
    this.timer = 0;
    this.tool = 'draw';
    this.showGrid = true;
    this.drawing = false;
    this.lastDrawPosition = null;
    this.camera = {
      rotX: -0.58,
      rotY: 0.82,
      zoom: 1,
      panX: 0,
      panY: 0,
      dragging: false,
      lastX: 0,
      lastY: 0
    };
    this.touchPointers = new Map();
    this.touchCameraGesture = null;
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
    this.ruleSelect.innerHTML = listRulePresets().map((rule) => `<option value="${rule.id}">${rulePresetLabel(rule, this.language)}</option>`).join('');
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
      control.addEventListener('change', (event) => this.applyControlsFromControl(event));
      control.addEventListener('input', (event) => this.applyControlsFromControl(event));
    });

    this.root.querySelectorAll('[data-tool]').forEach((button) => button.addEventListener('click', () => this.setTool(button.dataset.tool)));
    this.gridToggleButton?.addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      this.syncToolButtons();
      this.draw();
    });
    this.root.getElementById('randomSeedButton').addEventListener('click', () => this.seedRandom());
    this.root.getElementById('stepButton').addEventListener('click', () => this.step());
    this.root.getElementById('resetButton').addEventListener('click', () => this.reset());
    this.playButton.addEventListener('click', () => this.togglePlay());
    this.root.getElementById('exportButton').addEventListener('click', () => this.exportPattern());
    this.root.getElementById('importButton').addEventListener('click', () => this.importPattern());
    this.installOnlineControls();

    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('wheel', (event) => this.handleCanvasWheel(event), { passive: false });
    this.canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.canvas.setPointerCapture?.(event.pointerId);
      if (event.pointerType === 'touch') {
        this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.touchPointers.size >= 2) {
          this.drawing = false;
          this.lastDrawPosition = null;
          this.camera.dragging = false;
          this.startTouchCameraGesture();
          return;
        }
      }
      if (this.isCameraInteraction(event)) {
        this.startCameraDrag(event);
      } else {
        this.drawing = true;
        this.lastDrawPosition = null;
        this.handleCanvasPointer(event);
      }
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' && this.touchPointers.has(event.pointerId)) {
        this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.touchCameraGesture && this.touchPointers.size >= 2) {
          this.updateTouchCameraGesture(event);
          return;
        }
      }
      if (this.camera.dragging) this.updateCameraDrag(event);
      else if (this.drawing) { event.preventDefault(); this.handleCanvasPointer(event); }
    });
    const finishPointer = (event) => {
      if (event.pointerType === 'touch') {
        this.touchPointers.delete(event.pointerId);
        if (this.touchPointers.size < 2) this.touchCameraGesture = null;
      }
      try { this.canvas.releasePointerCapture?.(event.pointerId); } catch {}
      this.drawing = false;
      this.lastDrawPosition = null;
      this.camera.dragging = false;
    };
    window.addEventListener('pointerup', finishPointer);
    window.addEventListener('pointercancel', finishPointer);
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

  latticeRulePreset(lattice = this.latticeSelect?.value, dimension = Number(this.dimensionSelect?.value) || 2) {
    if (dimension === 2 && lattice === 'triangular') return 'triangularLife';
    if (dimension === 2 && lattice === 'honeycomb') return 'honeycombLife';
    if (dimension === 2) return 'conway';
    if (dimension >= 3) return 'life3dSoft';
    return 'conway';
  }

  applyLatticeDefaults(lattice = this.latticeSelect?.value) {
    const dimension = Number(this.dimensionSelect?.value) || 2;
    const preset = this.latticeRulePreset(lattice, dimension);
    if (!preset) return;
    if (this.ruleSelect?.querySelector(`option[value="${preset}"]`)) this.ruleSelect.value = preset;
    if (this.neighborhoodSelect) this.neighborhoodSelect.value = 'nearest';
  }

  applyControlsFromControl(event) {
    if (event?.currentTarget === this.latticeSelect) this.applyLatticeDefaults(this.latticeSelect.value);
    this.applyControls(true);
  }

  applyGeometrySelection() {
    const geometry = findLifeGeometry(this.boardGeometrySelect.value);
    this.dimensionSelect.value = String(geometry.dimension);
    this.topologySelect.value = geometry.topology;
    this.viewModeSelect.value = geometry.view;
    this.populateLattices(geometry.id, this.latticeSelect.value || (geometry.dimension === 3 ? 'sc' : 'square'));
    this.applyLatticeDefaults(this.latticeSelect.value);
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
    const selectedDimension = geometry.dimension || config.dimension;
    this.dimensionSelect.value = String(selectedDimension);
    this.boardSizeSelect.value = String(selectedDimension === 3 ? 40 : 48);
    this.topologySelect.value = geometry.topology || config.boundary;
    this.viewModeSelect.value = geometry.view;
    this.populateLattices(geometry.id, config.lattice);
    this.speciesSelect.value = String(mode.species || config.rule.speciesCount || 1);
    this.ruleSelect.value = config.rule.id || 'conway';
    this.neighborhoodSelect.value = config.neighborhoodType || 'moore';
    if (config.dimension >= 3 || config.lattice !== 'square') this.applyLatticeDefaults(this.latticeSelect.value);
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
    this.updateOnlineControls();
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
    const n = Math.max(8, Number(this.boardSizeSelect.value) || 48);
    const dimension = Math.max(1, Number(this.dimensionSelect.value) || 2);
    if (dimension === 1) return [n];
    if (dimension === 2) return [n, n];
    if (dimension === 3) return [Math.min(n, 64), Math.min(n, 64), Math.min(16, Math.max(4, Math.floor(n / 6)))];
    return [Math.min(n, 32), Math.min(n, 32), 4, 4];
  }

  applyControls(preserve = true) {
    let rule = getRulePreset(this.ruleSelect.value);
    const speciesCount = Math.max(1, Number(this.speciesSelect.value) || 1);
    const dimension = Number(this.dimensionSelect.value);
    const lattice = this.latticeSelect.value;
    rule = tuneRuleForLattice(rule, lattice, dimension);
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
      dimension,
      size: this.currentSize(),
      boundary: this.topologySelect.value,
      neighborhoodType: rule.neighborhoodType || this.neighborhoodSelect.value,
      lattice,
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
  syncToolButtons() {
    this.root.querySelectorAll('[data-tool]').forEach((button) => button.classList.toggle('active', button.dataset.tool === this.tool));
    if (this.gridToggleButton) {
      this.gridToggleButton.classList.toggle('active', this.showGrid);
      this.gridToggleButton.setAttribute('aria-pressed', String(this.showGrid));
      this.gridToggleButton.textContent = t(this.showGrid ? 'gridOn' : 'gridOff', this.language);
    }
  }

  installOnlineControls() {
    if (!this.lifePlayModeSelect) return;
    this.network = new FirebaseStateNetworkManager(this, {
      gameKey: this.onlineGameKey(),
      matchKey: this.onlineMatchKey()
    });
    this.lifePlayModeSelect.addEventListener('change', () => this.updateOnlineControls());
    this.lifeCreateRoomBtn?.addEventListener('click', async () => {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls('creatingLifeRoom');
      await this.network?.createRoom();
    });
    this.lifeFindMatchBtn?.addEventListener('click', async () => {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls('findingLifeMatch');
      await this.network?.findMatch();
    });
    this.lifeJoinRoomBtn?.addEventListener('click', async () => {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls('joiningLifeRoom');
      await this.network?.joinRoom(this.roomIdInput?.value || '');
    });
    this.copyLinkBtn?.addEventListener('click', async () => {
      const value = this.shareLinkInput?.value || '';
      if (!value) return;
      try {
        await navigator.clipboard?.writeText(value);
        this.setStatus(this.lifeText('shareLinkCopied'));
      } catch {
        this.shareLinkInput?.select?.();
        this.setStatus(this.lifeText('copySelectedShareLink'));
      }
    });
  }

  lifeText(key, replacements = {}) {
    return Object.entries(replacements).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      t(key, this.language)
    );
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
      this.boardSizeSelect?.value || '48',
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
    const usage = this.usageModeSelect?.value || 'zero';
    if (usage !== 'two' && this.lifePlayModeSelect.value !== 'local') {
      this.lifePlayModeSelect.value = 'local';
    }
    const online = this.lifePlayModeSelect.value === 'online';
    const robots = this.lifePlayModeSelect.value === 'robot';
    const showConnectionControls = usage === 'two';
    if (this.lifeOnlineControls) this.lifeOnlineControls.hidden = !showConnectionControls;
    this.lifeOnlineControls?.classList.toggle('online-active', online);
    if (this.lifeCreateRoomBtn) this.lifeCreateRoomBtn.disabled = !online;
    if (this.lifeFindMatchBtn) this.lifeFindMatchBtn.disabled = !online;
    if (this.lifeJoinRoomBtn) this.lifeJoinRoomBtn.disabled = !online;
    if (this.roomIdInput) this.roomIdInput.disabled = !online;
    if (this.connectionStatusEl) {
      this.connectionStatusEl.textContent = t('disconnected', this.language);
      this.connectionStatusEl.className = `connection-status ${online ? 'disconnected' : 'disconnected'} life-online-details`;
    }
    const text = message
      ? this.lifeText(message)
      : this.lifeText(online ? 'onlineReady' : (robots ? 'robotBoardOnly' : 'localBoardOnly'));
    this.setStatus(text);
  }

  setStatus(text) {
    if (this.onlineColorEl) this.onlineColorEl.textContent = text || '';
  }

  setOnlineColor(color, roomId, room) {
    this.myColor = color || null;
    if (!this.onlineColorEl) return;
    if (!roomId) {
      this.onlineColorEl.textContent = this.lifeText('localBoardOnlyShort');
      return;
    }
    if (room?.status === 'waiting') {
      this.onlineColorEl.textContent = this.lifeText('roomWaiting', { room: roomId });
      return;
    }
    this.onlineColorEl.textContent = color ? this.lifeText('connectedAs', { color }) : this.lifeText('connectedSpectator');
  }

  updateOnlineRoomUI(roomId) {
    if (this.lifePlayModeSelect && roomId) {
      this.lifePlayModeSelect.value = 'online';
      this.updateOnlineControls();
    }
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
    if (this.is3DView()) {
      return this.tool === 'inspect'
        || event.shiftKey
        || event.altKey
        || event.button === 1
        || event.button === 2;
    }
    return event.shiftKey || event.altKey || event.button === 1 || event.button === 2;
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
    if (this.is3DView()) {
      this.camera.rotY += dx * 0.012;
      this.camera.rotX = Math.max(-1.35, Math.min(1.35, this.camera.rotX + dy * 0.012));
    } else {
      this.camera.panX += dx * (window.devicePixelRatio || 1);
      this.camera.panY += dy * (window.devicePixelRatio || 1);
      this.clampFlatPan();
    }
    this.draw();
  }

  startTouchCameraGesture() {
    const [a, b] = Array.from(this.touchPointers.values()).slice(0, 2);
    if (!a || !b) return;
    this.touchCameraGesture = {
      distance: Math.max(12, Math.hypot(a.x - b.x, a.y - b.y)),
      centerX: (a.x + b.x) / 2,
      centerY: (a.y + b.y) / 2,
      rotX: this.camera.rotX,
      rotY: this.camera.rotY,
      zoom: this.camera.zoom,
      panX: this.camera.panX,
      panY: this.camera.panY
    };
  }

  updateTouchCameraGesture(event) {
    const [a, b] = Array.from(this.touchPointers.values()).slice(0, 2);
    if (!a || !b || !this.touchCameraGesture) return;
    event.preventDefault();
    const centerX = (a.x + b.x) / 2;
    const centerY = (a.y + b.y) / 2;
    const dx = centerX - this.touchCameraGesture.centerX;
    const dy = centerY - this.touchCameraGesture.centerY;
    const factor = Math.max(0.2, Math.min(5, Math.hypot(a.x - b.x, a.y - b.y) / this.touchCameraGesture.distance));

    if (this.is3DView()) {
      this.camera.rotY = this.touchCameraGesture.rotY + dx * 0.012;
      this.camera.rotX = Math.max(-1.35, Math.min(1.35, this.touchCameraGesture.rotX + dy * 0.012));
      this.camera.zoom = Math.max(0.45, Math.min(8, this.touchCameraGesture.zoom * factor));
    } else {
      const pixelRatio = window.devicePixelRatio || 1;
      this.camera.zoom = Math.max(1, Math.min(48, this.touchCameraGesture.zoom * factor));
      this.camera.panX = this.touchCameraGesture.panX + dx * pixelRatio;
      this.camera.panY = this.touchCameraGesture.panY + dy * pixelRatio;
      this.clampFlatPan();
    }
    this.draw();
  }

  handleCanvasWheel(event) {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    if (this.is3DView()) {
      this.camera.zoom = Math.max(0.45, Math.min(8, this.camera.zoom * factor));
    } else {
      this.zoomFlatBoardAtEvent(event, factor);
    }
    this.draw();
  }

  handleCanvasPointer(event) {
    const position = this.eventToPosition(event);
    if (!position) return;
    if (this.tool === 'inspect') {
      const cell = this.engine.getCell(position);
      this.challengeStatus.textContent = `${t('status', this.language)}: ${position.join(',')} ${t('cellSpecies', this.language)}=${cell.species || 0} ${t('cellAge', this.language)}=${cell.age || 0}`;
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

  flatViewTransform(width = this.canvas.width, height = this.canvas.height) {
    const columns = Math.max(1, this.engine.size[0]);
    const rows = Math.max(1, this.engine.dimension >= 2 ? this.engine.size[1] : 1);
    const zoom = Math.max(1, Math.min(48, Number(this.camera.zoom) || 1));
    this.camera.zoom = zoom;
    if (this.engine.dimension === 2 && this.flatLatticeKind() === 'triangular') {
      const baseSide = Math.max(1, Math.min(
        width / Math.max(1, 1 + (columns - 1) * 0.5),
        height / Math.max(1, rows * SQRT3 / 2)
      ) * zoom);
      const triangleHeight = baseSide * SQRT3 / 2;
      const boardWidth = baseSide + Math.max(0, columns - 1) * baseSide * 0.5;
      const boardHeight = rows * triangleHeight;
      return {
        columns,
        rows,
        zoom,
        sx: baseSide * 0.5,
        sy: triangleHeight,
        triangleSide: baseSide,
        triangleHeight,
        boardWidth,
        boardHeight,
        originX: (width - boardWidth) / 2 + (Number(this.camera.panX) || 0),
        originY: (height - boardHeight) / 2 + (Number(this.camera.panY) || 0)
      };
    }
    if (this.engine.dimension === 2 && this.flatLatticeKind() === 'honeycomb') {
      const radius = Math.max(1, Math.min(
        width / (SQRT3 * (columns + 0.5)),
        height / (1.5 * Math.max(0, rows - 1) + 2)
      ) * zoom);
      const hexWidth = SQRT3 * radius;
      const hexHeight = 2 * radius;
      const rowStep = 1.5 * radius;
      const boardWidth = hexWidth * (columns + 0.5);
      const boardHeight = rows <= 1 ? hexHeight : rowStep * (rows - 1) + hexHeight;
      return {
        columns,
        rows,
        zoom,
        sx: hexWidth,
        sy: rowStep,
        hexRadius: radius,
        hexWidth,
        hexHeight,
        hexRowStep: rowStep,
        boardWidth,
        boardHeight,
        originX: (width - boardWidth) / 2 + (Number(this.camera.panX) || 0),
        originY: (height - boardHeight) / 2 + (Number(this.camera.panY) || 0)
      };
    }
    if (this.engine.dimension === 1) {
      const sx = (width / columns) * zoom;
      const boardWidth = sx * columns;
      const boardHeight = Math.max(42, Math.min(height, height * 0.24) * zoom);
      return {
        columns,
        rows,
        zoom,
        sx,
        sy: boardHeight,
        boardWidth,
        boardHeight,
        originX: (width - boardWidth) / 2 + (Number(this.camera.panX) || 0),
        originY: (height - boardHeight) / 2 + (Number(this.camera.panY) || 0)
      };
    }
    const cellSide = Math.max(1, Math.min(width / columns, height / rows) * zoom);
    const boardWidth = cellSide * columns;
    const boardHeight = cellSide * rows;
    return {
      columns,
      rows,
      zoom,
      sx: cellSide,
      sy: cellSide,
      boardWidth,
      boardHeight,
      originX: (width - boardWidth) / 2 + (Number(this.camera.panX) || 0),
      originY: (height - boardHeight) / 2 + (Number(this.camera.panY) || 0)
    };
  }

  clampFlatPan(width = this.canvas.width, height = this.canvas.height) {
    if (this.is3DView()) return;
    const view = this.flatViewTransform(width, height);
    if (view.zoom <= 1.01) {
      this.camera.panX = 0;
      this.camera.panY = 0;
      return;
    }
    const slackX = Math.max(0, (view.boardWidth - width) / 2);
    const slackY = Math.max(0, (view.boardHeight - height) / 2);
    this.camera.panX = Math.max(-slackX, Math.min(slackX, Number(this.camera.panX) || 0));
    this.camera.panY = Math.max(-slackY, Math.min(slackY, Number(this.camera.panY) || 0));
  }

  zoomFlatBoardAtEvent(event, factor) {
    const point = this.canvasPointFromEvent(event);
    if (!point) return;
    const before = this.flatViewTransform();
    const boardX = (point.x - before.originX) / before.sx;
    const boardY = (point.y - before.originY) / before.sy;
    this.camera.zoom = Math.max(1, Math.min(48, before.zoom * factor));
    const after = this.flatViewTransform();
    const centeredOriginX = (this.canvas.width - after.boardWidth) / 2;
    const centeredOriginY = (this.canvas.height - after.boardHeight) / 2;
    this.camera.panX = point.x - boardX * after.sx - centeredOriginX;
    this.camera.panY = point.y - boardY * after.sy - centeredOriginY;
    this.clampFlatPan();
  }

  eventToPosition(event) {
    const point = this.canvasPointFromEvent(event);
    if (!point) return null;
    if (this.isProjectedDrawingView()) return this.projectedPointToPosition(point);
    const view = this.flatViewTransform();
    if (this.engine.dimension === 2 && this.flatLatticeKind() !== 'square') {
      return this.flatLatticePositionFromPoint(point, view);
    }
    const x = Math.floor((point.x - view.originX) / view.sx);
    const y = this.engine.dimension >= 2 ? Math.floor((point.y - view.originY) / view.sy) : 0;
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

  flatLatticeKind() {
    return this.engine.dimension === 2 ? (this.engine.lattice || this.latticeSelect?.value || 'square') : 'square';
  }

  flatCellPolygon(x, y, view, inset = 0) {
    const { sx, sy, originX, originY } = view;
    const left = originX + x * sx + inset;
    const top = originY + y * sy + inset;
    const right = originX + (x + 1) * sx - inset;
    const bottom = originY + (y + 1) * sy - inset;
    const cx = originX + (x + 0.5) * sx;
    const cy = originY + (y + 0.5) * sy;
    const lattice = this.flatLatticeKind();

    if (lattice === 'triangular') {
      const side = Math.max(1, (view.triangleSide || sx * 2) - inset * 2);
      const height = Math.max(1, (view.triangleHeight || sy) - inset * SQRT3);
      const leftEdge = originX + x * (view.triangleSide || sx * 2) * 0.5 + inset;
      const topEdge = originY + y * (view.triangleHeight || sy) + inset * SQRT3 / 2;
      return ((x + y) % 2 === 0)
        ? [[leftEdge + side * 0.5, topEdge], [leftEdge + side, topEdge + height], [leftEdge, topEdge + height]]
        : [[leftEdge, topEdge], [leftEdge + side, topEdge], [leftEdge + side * 0.5, topEdge + height]];
    }

    if (lattice === 'honeycomb') {
      const radius = Math.max(1, (view.hexRadius || Math.min(view.sx / SQRT3, view.sy / 1.5)) - inset);
      const centerX = originX + (x + 0.5 + (y % 2 ? 0.5 : 0)) * (view.hexWidth || view.sx);
      const centerY = originY + radius + y * (view.hexRowStep || view.sy);
      return Array.from({ length: 6 }, (_, index) => {
        const angle = -Math.PI / 2 + index * Math.PI / 3;
        return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];
      });
    }

    return [[left, top], [right, top], [right, bottom], [left, bottom]];
  }

  drawPolygonPath(ctx, points) {
    if (!points.length) return;
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }

  pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      const crosses = ((yi > point.y) !== (yj > point.y))
        && point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-9) + xi;
      if (crosses) inside = !inside;
    }
    return inside;
  }

  flatLatticePositionFromPoint(point, view) {
    const lattice = this.flatLatticeKind();
    const xGuess = lattice === 'honeycomb'
      ? Math.floor((point.x - view.originX) / (view.hexWidth || view.sx))
      : lattice === 'triangular'
      ? Math.floor((point.x - view.originX) / Math.max(1, (view.triangleSide || view.sx * 2) * 0.5))
      : Math.floor((point.x - view.originX) / view.sx);
    const yGuess = lattice === 'honeycomb'
      ? Math.floor((point.y - view.originY) / (view.hexRowStep || view.sy))
      : Math.floor((point.y - view.originY) / view.sy);
    const range = lattice === 'honeycomb' ? 3 : lattice === 'triangular' ? 3 : 1;
    const x0 = Math.max(0, xGuess - range);
    const y0 = Math.max(0, yGuess - range);
    const x1 = Math.min(this.engine.size[0] - 1, xGuess + range + 1);
    const y1 = Math.min(this.engine.size[1] - 1, yGuess + range + 1);
    let nearest = null;
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const polygon = this.flatCellPolygon(x, y, view, 0);
        if (this.pointInPolygon(point, polygon)) return [x, y];
        const cx = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
        const cy = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
        const distance = Math.hypot(point.x - cx, point.y - cy);
        if (!nearest || distance < nearest.distance) nearest = { position: [x, y], distance };
      }
    }
    const maxDistance = lattice === 'honeycomb'
      ? (view.hexRadius || Math.max(view.sx, view.sy) * 0.5)
      : Math.max(view.sx, view.sy) * 0.42;
    return nearest && nearest.distance <= maxDistance ? nearest.position : null;
  }

  projectedSurfaceCellPolygon(x, y, width, height) {
    const points = [
      this.surfaceRawPoint(x, y),
      this.surfaceRawPoint(x + 1, y),
      this.surfaceRawPoint(x + 1, y + 1),
      this.surfaceRawPoint(x, y + 1)
    ].map((raw) => this.projectPoint(raw, width, height, 0.82));
    return points.map((projected) => [projected.x, projected.y]);
  }

  projectedSurfacePointToPosition(point, width, height) {
    let best = null;
    const limitX = this.engine.size[0];
    const limitY = this.engine.size[1] || 1;
    for (let y = 0; y < limitY; y += 1) {
      for (let x = 0; x < limitX; x += 1) {
        const polygon = this.projectedSurfaceCellPolygon(x, y, width, height);
        if (!this.pointInPolygon(point, polygon)) continue;
        const center = this.projectPoint(this.surfaceRawPoint(x + 0.5, y + 0.5), width, height, 0.82);
        const distance = Math.hypot(point.x - center.x, point.y - center.y);
        const candidate = { distance, depth: center.z, position: [x, y] };
        if (!best || candidate.depth > best.depth + 0.035 || (Math.abs(candidate.depth - best.depth) <= 0.035 && candidate.distance < best.distance)) {
          best = candidate;
        }
      }
    }
    return best?.position || null;
  }

  projectedVolumePointToPosition(point, width, height) {
    let best = null;
    const limitX = this.engine.size[0];
    const limitY = this.engine.dimension >= 2 ? this.engine.size[1] : 1;
    const depth = Math.max(1, this.engine.size[2] || 1);
    const baseScale = Math.min(width / Math.max(1, limitX), height / Math.max(1, limitY));
    const cellScale = Math.max(4, baseScale * this.camera.zoom * 0.52);
    for (let z = 0; z < depth; z += 1) {
      for (let y = 0; y < limitY; y += 1) {
        for (let x = 0; x < limitX; x += 1) {
          const raw = this.volumeRawPoint(x, y, z);
          const projected = this.projectPoint(raw, width, height, 0.86);
          const radius = cellScale * Math.max(0.4, projected.perspective || 1);
          const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
          if (distance > radius) continue;
          const position = this.engine.dimension === 4 ? [x, y, z, 0] : [x, y, z];
          const candidate = { distance, depth: projected.z, position };
          if (!best || candidate.depth > best.depth + 0.04 || (Math.abs(candidate.depth - best.depth) <= 0.04 && candidate.distance < best.distance)) {
            best = candidate;
          }
        }
      }
    }
    return best?.position || null;
  }

  projectedPointToPosition(point) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    if (this.engine.dimension === 2 && this.viewModeSelect.value === 'surface3d') {
      return this.projectedSurfacePointToPosition(point, width, height);
    }
    return this.projectedVolumePointToPosition(point, width, height);
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
      const lead = scores.a === scores.b ? t('tie', this.language) : (scores.a > scores.b ? t('playerA', this.language) : t('playerB', this.language));
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

  surfaceLatticePoint(x, y) {
    const nx = Math.max(1, this.engine.size[0]);
    const ny = Math.max(1, this.engine.size[1] || 1);
    const lattice = this.flatLatticeKind();
    if (lattice === 'triangular') {
      const rawX = x + y * 0.5;
      const rawY = y * SQRT3 / 2;
      return {
        x: rawX,
        y: rawY,
        nx: nx + ny * 0.5,
        ny: Math.max(1, ny * SQRT3 / 2)
      };
    }
    if (lattice === 'honeycomb') {
      const columnOffset = Math.floor(x) % 2 ? 0.5 : 0;
      const rawX = x * SQRT3 / 2;
      const rawY = y + columnOffset;
      return {
        x: rawX,
        y: rawY,
        nx: Math.max(1, nx * SQRT3 / 2),
        ny: Math.max(1, ny + 0.5)
      };
    }
    return { x, y, nx, ny };
  }

  surfaceRawPoint(x, y) {
    const geom = this.boardGeometrySelect.value;
    const latticePoint = this.surfaceLatticePoint(x, y);
    const nx = latticePoint.nx;
    const ny = latticePoint.ny;
    const u = (latticePoint.x / nx) * Math.PI * 2;
    const vv = (latticePoint.y / Math.max(1, ny));
    const v2 = (latticePoint.y / ny) * Math.PI * 2;
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

    if (geom === 'cylinder') {
      return {
        x: Math.cos(u),
        y: (vv - 0.5) * 1.75,
        z: Math.sin(u)
      };
    }

    if (geom === 'klein_surface') {
      const surfaceU = vv * TAU;
      const surfaceV = (latticePoint.x / Math.max(1, nx)) * TAU - Math.PI / 2;
      return kleinBottleSurfacePoint(surfaceU, surfaceV);
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
      x: (latticePoint.x / Math.max(1, nx) - 0.5) * 1.8,
      y: (latticePoint.y / Math.max(1, ny) - 0.5) * 1.8,
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

  projectedMarkerShape(position = []) {
    const lattice = this.engine.lattice || this.latticeSelect?.value || 'square';
    if (this.engine.dimension === 2) {
      if (lattice === 'triangular') return { sides: 3, rotation: ((position[0] + position[1]) % 2 === 0) ? -Math.PI / 2 : Math.PI / 2 };
      if (lattice === 'honeycomb') return { sides: 6, rotation: Math.PI / 6 };
      return { sides: 4, rotation: Math.PI / 4 };
    }
    if (lattice === 'bcc') return { sides: 4, rotation: Math.PI / 4 };
    if (lattice === 'fcc') return { sides: 6, rotation: Math.PI / 6 };
    if (lattice === 'hcp') return { sides: 6, rotation: 0 };
    return { sides: 4, rotation: 0 };
  }

  drawProjectedMarker(ctx, projected, radius, position = []) {
    const shape = this.projectedMarkerShape(position);
    const sides = Math.max(3, shape.sides || 4);
    ctx.beginPath();
    for (let i = 0; i < sides; i += 1) {
      const angle = shape.rotation + (i / sides) * Math.PI * 2;
      const x = projected.x + Math.cos(angle) * radius;
      const y = projected.y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
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
      const depthAlpha = item.z < -0.08 ? 0.34 : item.z < 0.08 ? 0.58 : 0.92;
      ctx.globalAlpha = ageAlpha * depthAlpha * (0.58 + 0.42 * Math.max(0, p.perspective));
      ctx.fillStyle = COLORS[item.cell.species] || COLORS[1];
      this.drawProjectedMarker(ctx, p, radius * p.perspective, [item.x, item.y]);
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
          cells.push({ cell, raw, position: [x, y, z], z: rotated.z });
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
      this.drawProjectedMarker(ctx, p, base * p.perspective, item.position);
    }
    ctx.globalAlpha = 1;
  }

  drawFlatLatticeUnits(ctx, width, height, view) {
    const minCell = Math.min(view.sx, view.sy);
    if (minCell < 3) return;
    const startX = Math.max(0, Math.floor((0 - view.originX) / view.sx) - 1);
    const endX = Math.min(this.engine.size[0] - 1, Math.ceil((width - view.originX) / view.sx) + 1);
    const startY = Math.max(0, Math.floor((0 - view.originY) / view.sy) - 1);
    const endY = Math.min(this.engine.size[1] - 1, Math.ceil((height - view.originY) / view.sy) + 1);
    ctx.save();
    ctx.strokeStyle = this.flatLatticeKind() === 'triangular'
      ? 'rgba(2, 6, 12, 0.78)'
      : 'rgba(2, 6, 12, 0.7)';
    ctx.lineWidth = Math.max(0.5, Math.min(1.05, minCell * 0.04));
    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        this.drawPolygonPath(ctx, this.flatCellPolygon(x, y, view, 0));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawFlatGridLines(ctx, width, height, view) {
    if (this.engine.dimension === 2 && this.flatLatticeKind() !== 'square') {
      this.drawFlatLatticeUnits(ctx, width, height, view);
      return;
    }
    const { sx, sy, originX, originY } = view;
    ctx.save();
    ctx.strokeStyle = 'rgba(8, 14, 24, 0.64)';
    ctx.lineWidth = Math.max(0.7, Math.min(1.25, Math.min(sx, sy) * 0.045));
    for (let x = 0; x <= this.engine.size[0]; x += 1) {
      const px = originX + x * sx;
      if (px < -2 || px > width + 2) continue;
      ctx.beginPath();
      ctx.moveTo(px, originY);
      ctx.lineTo(px, originY + view.boardHeight);
      ctx.stroke();
    }
    if (this.engine.dimension >= 2) {
      for (let y = 0; y <= this.engine.size[1]; y += 1) {
        const py = originY + y * sy;
        if (py < -2 || py > height + 2) continue;
        ctx.beginPath();
        ctx.moveTo(originX, py);
        ctx.lineTo(originX + view.boardWidth, py);
        ctx.stroke();
      }
    }
    if (Math.min(sx, sy) >= 14) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.34)';
      ctx.lineWidth = 0.5;
      for (let x = 0.5; x < this.engine.size[0]; x += 1) {
        const px = originX + x * sx;
        if (px < -2 || px > width + 2) continue;
        ctx.beginPath();
        ctx.moveTo(px, originY);
        ctx.lineTo(px, originY + view.boardHeight);
        ctx.stroke();
      }
      if (this.engine.dimension >= 2) {
        for (let y = 0.5; y < this.engine.size[1]; y += 1) {
          const py = originY + y * sy;
          if (py < -2 || py > height + 2) continue;
          ctx.beginPath();
          ctx.moveTo(originX, py);
          ctx.lineTo(originX + view.boardWidth, py);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  drawFlatLatticeOverlay(ctx, width, height, view) {
    if (this.engine.dimension !== 2) return;
    const lattice = this.engine.lattice || this.latticeSelect?.value || 'square';
    if (lattice === 'square') return;
    const { sx, sy, originX, originY } = view;
    const minCell = Math.min(sx, sy);
    if (minCell < 3) return;

    ctx.save();
    ctx.strokeStyle = lattice === 'triangular' ? 'rgba(2, 6, 12, 0.68)' : 'rgba(2, 6, 12, 0.58)';
    ctx.lineWidth = Math.max(0.55, Math.min(1.1, minCell * 0.045));

    if (lattice === 'triangular') {
      for (let y = 0; y < this.engine.size[1]; y += 1) {
        for (let x = 0; x < this.engine.size[0]; x += 1) {
          this.drawPolygonPath(ctx, this.flatCellPolygon(x, y, view, 0));
          ctx.stroke();
        }
      }
    } else if (lattice === 'honeycomb') {
      for (let y = 0; y < this.engine.size[1]; y += 1) {
        for (let x = 0; x < this.engine.size[0]; x += 1) {
          const cx = originX + (x + 0.5) * sx;
          const cy = originY + (y + 0.5) * sy;
          const right = [originX + (x + 1) * sx, cy];
          const vertical = ((x + y) % 2 === 0)
            ? [cx, originY + (y + 1) * sy]
            : [cx, originY + y * sy];
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(right[0], right[1]);
          ctx.moveTo(cx, cy);
          ctx.lineTo(vertical[0], vertical[1]);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  drawFlatBoundary(ctx, width, height, view) {
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 182, 71, 0.84)';
    ctx.lineWidth = Math.max(2.2, width / 320);
    ctx.strokeRect(view.originX + 1, view.originY + 1, view.boardWidth - 2, view.boardHeight - 2);
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
      if (this.showGrid) this.drawSurfaceBoundary(ctx, width, height);
      this.drawSurfaceCells(ctx, width, height);
      return;
    }

    if (this.engine.dimension >= 3 || view === 'volume') {
      if (this.showGrid) this.drawVolumeBoundary(ctx, width, height);
      this.drawVolumeCells(ctx, width, height);
      return;
    }

    this.clampFlatPan(width, height);
    const flatView = this.flatViewTransform(width, height);
    const { sx, sy, originX, originY } = flatView;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    const yLimit = this.engine.dimension === 1 ? 1 : this.engine.size[1];
    for (let y = 0; y < yLimit; y += 1) {
      for (let x = 0; x < this.engine.size[0]; x += 1) {
        const drawX = originX + x * sx;
        const drawY = this.engine.dimension === 1 ? originY + flatView.boardHeight * 0.46 : originY + y * sy;
        const drawW = Math.max(1, sx - 2);
        const drawH = this.engine.dimension === 1 ? Math.max(4, flatView.boardHeight * 0.08) : Math.max(1, sy - 2);
        const lattice = this.flatLatticeKind();
        const polygon = this.engine.dimension === 2 && lattice !== 'square'
          ? this.flatCellPolygon(x, y, flatView, 0)
          : null;
        const bounds = polygon
          ? polygon.reduce((box, [px, py]) => ({
            minX: Math.min(box.minX, px),
            maxX: Math.max(box.maxX, px),
            minY: Math.min(box.minY, py),
            maxY: Math.max(box.maxY, py)
          }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })
          : { minX: drawX, maxX: drawX + drawW, minY: drawY, maxY: drawY + drawH };
        if (bounds.maxX < 0 || bounds.minX > width || bounds.maxY < 0 || bounds.minY > height) continue;
        const position = this.engine.dimension === 1 ? [x] : [x, y];
        const cell = this.engine.getCell(position);
        if (!isAlive(cell)) continue;
        const maxAge = Number(this.ageRange.value) || 0;
        const ageAlpha = maxAge ? Math.max(0.34, 1 - (cell.age || 0) / (maxAge + 6)) : 0.94;
        ctx.globalAlpha = ageAlpha;
        ctx.fillStyle = COLORS[cell.species] || COLORS[1];
        if (this.engine.dimension === 1) {
          ctx.fillRect(drawX + 1, drawY + 1, drawW, drawH);
        } else if (polygon) {
          this.drawPolygonPath(ctx, polygon);
          ctx.fill();
        } else {
          const fillInset = this.showGrid ? Math.min(0.9, Math.max(0, Math.min(sx, sy) * 0.018)) : 0;
          this.drawPolygonPath(ctx, this.flatCellPolygon(x, y, flatView, fillInset));
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
    if (this.showGrid) {
      this.drawFlatGridLines(ctx, width, height, flatView);
      this.drawFlatBoundary(ctx, width, height, flatView);
    }
    ctx.restore();
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
      if (payload.geometry) {
        const geometry = findLifeGeometry(payload.geometry === 'klein' && payload.viewMode === 'surface3d' ? 'klein_surface' : payload.geometry);
        this.boardGeometrySelect.value = geometry.id;
        this.applyGeometrySelection();
      } else if (payload.viewMode) this.viewModeSelect.value = payload.viewMode;
      if (payload.mode) { this.mode = findLifeMode(payload.mode); this.modeSelect.value = this.mode.id; this.title.textContent = modeTitle(this.mode, this.language); this.description.textContent = modeLong(this.mode, this.language); this.tags.textContent = modeTags(this.mode, this.language).join(' · '); }
      this.history = []; this.stateHashes = new Map(); this.extinctionTime = null; this.afterStateChange();
    } catch (error) { this.challengeStatus.textContent = `${t('importFailed', this.language)}: ${error.message}`; }
  }
}

export function installLifeUI(root = document) { const ui = new LifeUI(root); ui.install(); return ui; }
