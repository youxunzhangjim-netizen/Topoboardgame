import { createLifeEngine, isAlive } from './LifeEngine.js';
import { listRulePresets, getRulePreset } from './presets.js';
import { LIFE_MODES, findLifeMode, modeTitle, modeLong, modeTags } from '../life-data.js';
import { currentLifeLanguage, localizeStaticText, syncLifeLinks, t } from './i18n.js';

const COLORS = {
  1: '#38bdf8',
  2: '#ef4444',
  3: '#22c55e',
  4: '#f5b647'
};

function readParams() {
  return new URLSearchParams(window.location.search);
}

function modeToEngineConfig(mode) {
  const dimension = mode.dimensions || (mode.topology === 'voxel3d' ? 3 : 2);
  const preset =
    mode.id === '3d-voxel-life' ? 'life3dSoft'
    : mode.id === 'noisy-life' ? 'noisyLife'
    : mode.id === 'age-structured-life' ? 'ageStructured'
    : mode.id === 'species-war' ? 'multiSpecies'
    : mode.id === 'ecosystem-balance' ? 'multiSpecies'
    : 'conway';

  const rule = getRulePreset(preset);
  rule.speciesCount = mode.species || rule.speciesCount || 1;
  if (mode.noise != null) {
    rule.birthNoise = mode.noise;
    rule.deathNoise = mode.noise;
    rule.environmentNoise = mode.noise * 0.3;
  }
  if (mode.mutation != null) rule.mutationRate = mode.mutation;
  if (mode.maxAge != null) rule.maxAge = mode.maxAge;

  return {
    dimension,
    size: dimension === 3 ? [40, 40, 10] : [64, 64],
    boundary: mode.topology === 'voxel3d' ? 'torus' : mode.topology,
    neighborhoodType: dimension === 3 ? 'moore' : 'moore',
    rule
  };
}

function topologyForMode(mode) {
  if (mode.topology === 'voxel3d') return 'torus';
  return mode.topology || 'open';
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
  if (!total) return null;
  return sum.map((v) => v / total);
}

function distance(a, b) {
  if (!a || !b) return 0;
  return Math.sqrt(a.reduce((sum, value, axis) => sum + (value - b[axis]) ** 2, 0));
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

    this.obs = Object.fromEntries([
      'Generation', 'Population', 'Density', 'BirthRate', 'DeathRate', 'SpeciesFractions',
      'MeanAge', 'AgeDistribution', 'ClusterCount', 'LargestCluster', 'Entropy', 'Correlation',
      'ExtinctionTime', 'SurvivalTime', 'Oscillation', 'FrontVelocity'
    ].map((name) => [name, root.getElementById(`obs${name}`)]));

    this.scoreA = root.getElementById('scoreA');
    this.scoreB = root.getElementById('scoreB');
    this.patternJson = root.getElementById('patternJson');
    this.playButton = root.getElementById('playButton');

    this.mode = findLifeMode(readParams().get('mode'));
    this.playing = false;
    this.timer = 0;
    this.tool = 'draw';
    this.drawing = false;
    this.history = [];
    this.stateHashes = new Map();
    this.extinctionTime = null;
    this.initialCenter = null;
    this.engine = createLifeEngine(modeToEngineConfig(this.mode));
  }

  install() {
    localizeStaticText(document, this.language);
    syncLifeLinks(this.language);

    this.modeSelect.innerHTML = LIFE_MODES.map((mode) => `<option value="${mode.id}">${modeTitle(mode, this.language)}</option>`).join('');
    this.modeSelect.value = this.mode.id;

    this.ruleSelect.innerHTML = listRulePresets().map((rule) => `<option value="${rule.id}">${rule.label}</option>`).join('');

    this.modeSelect.addEventListener('change', () => this.applyMode(findLifeMode(this.modeSelect.value)));
    this.usageModeSelect.addEventListener('change', () => this.applyUsageMode());
    this.twoPlayerModeSelect.addEventListener('change', () => this.applyTwoPlayerMode());
    this.challengeGoalSelect.addEventListener('change', () => this.updateChallengeStatus());
    this.activePlayerSelect.addEventListener('change', () => this.syncToolButtons());

    [
      this.dimensionSelect, this.boardSizeSelect, this.topologySelect, this.speciesSelect, this.ruleSelect,
      this.neighborhoodSelect, this.birthNoiseRange, this.deathNoiseRange, this.environmentNoiseRange,
      this.ruleNoiseRange, this.topologyDefectNoiseRange, this.mutationRange, this.ageRange,
      this.agingDeathRateRange, this.youngBirthBonusRange, this.oldAgePenaltyRange
    ].forEach((control) => {
      control.addEventListener('change', () => this.applyControls(true));
      control.addEventListener('input', () => this.applyControls(true));
    });

    this.root.querySelectorAll('[data-tool]').forEach((button) => {
      button.addEventListener('click', () => this.setTool(button.dataset.tool));
    });

    this.root.getElementById('randomSeedButton').addEventListener('click', () => this.seedRandom());
    this.root.getElementById('stepButton').addEventListener('click', () => this.step());
    this.root.getElementById('resetButton').addEventListener('click', () => this.reset());
    this.playButton.addEventListener('click', () => this.togglePlay());
    this.root.getElementById('exportButton').addEventListener('click', () => this.exportPattern());
    this.root.getElementById('importButton').addEventListener('click', () => this.importPattern());

    this.canvas.addEventListener('pointerdown', (event) => {
      this.drawing = true;
      this.canvas.setPointerCapture?.(event.pointerId);
      this.handleCanvasPointer(event);
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (this.drawing) this.handleCanvasPointer(event);
    });
    window.addEventListener('pointerup', () => { this.drawing = false; });
    window.addEventListener('resize', () => this.draw());

    this.applyMode(this.mode);
    this.applyUsageMode();
  }

  applyMode(mode) {
    this.mode = mode;
    this.title.textContent = modeTitle(mode, this.language);
    this.description.textContent = modeLong(mode, this.language);
    this.tags.textContent = modeTags(mode, this.language).join(' · ');
    this.modeSelect.value = mode.id;

    const config = modeToEngineConfig(mode);
    this.dimensionSelect.value = String(config.dimension);
    this.boardSizeSelect.value = String(config.dimension === 3 ? 40 : 64);
    this.topologySelect.value = topologyForMode(mode);
    this.speciesSelect.value = String(mode.species || config.rule.speciesCount || 1);
    this.ruleSelect.value = config.rule.id || 'conway';
    this.neighborhoodSelect.value = config.neighborhoodType || 'moore';
    this.birthNoiseRange.value = String(mode.noise || config.rule.birthNoise || 0);
    this.deathNoiseRange.value = String(mode.noise || config.rule.deathNoise || 0);
    this.environmentNoiseRange.value = String(config.rule.environmentNoise || 0);
    this.ruleNoiseRange.value = String(config.rule.ruleNoise || 0);
    this.topologyDefectNoiseRange.value = String(config.rule.topologyDefectNoise || 0);
    this.mutationRange.value = String(mode.mutation || config.rule.mutationRate || 0);
    this.ageRange.value = String(mode.maxAge || config.rule.maxAge || 0);
    this.agingDeathRateRange.value = String(config.rule.agingDeathRate || 0);
    this.youngBirthBonusRange.value = String(config.rule.youngBirthBonus || 0);
    this.oldAgePenaltyRange.value = String(config.rule.oldAgePenalty ?? 0.35);

    const params = readParams();
    params.set('mode', mode.id);
    params.set('lang', this.language);
    history.replaceState(null, '', `${location.pathname}?${params.toString()}`);

    this.reset();
  }

  applyUsageMode() {
    const usage = this.usageModeSelect.value;
    document.body.dataset.lifeUsage = usage;

    if (usage === 'two') {
      this.speciesSelect.value = String(Math.max(2, Number(this.speciesSelect.value) || 2));
      this.activePlayerSelect.value = '1';
    }
    if (usage === 'one' && this.challengeGoalSelect.value === 'none') {
      this.challengeGoalSelect.value = 'survive';
    }

    this.applyTwoPlayerMode();
    this.applyControls(true);
    this.updateChallengeStatus();
  }

  applyTwoPlayerMode() {
    if (this.usageModeSelect.value !== 'two') return;
    const type = this.twoPlayerModeSelect.value;
    if (type === 'mutation-duel') {
      this.birthNoiseRange.value = '0.01';
      this.deathNoiseRange.value = '0.01';
      this.mutationRange.value = '0.025';
    }
    if (type === 'ecosystem-balance') {
      this.speciesSelect.value = '3';
      this.mutationRange.value = '0.01';
    }
    this.applyControls(true);
  }

  currentSize() {
    const n = Math.max(8, Number(this.boardSizeSelect.value) || 64);
    const dimension = Math.max(1, Number(this.dimensionSelect.value) || 2);
    if (dimension === 1) return [n];
    if (dimension === 2) return [n, n];
    if (dimension === 3) return [Math.min(n, 64), Math.min(n, 64), Math.min(12, Math.max(4, Math.floor(n / 8)))];
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
    if (this.mode.id === 'classic-life') this.seedGlider();
    else this.seedRandom();
  }

  seedGlider() {
    this.engine.clear();
    const cx = Math.floor(this.engine.size[0] / 2) - 1;
    const cy = Math.floor((this.engine.size[1] || 1) / 2) - 1;
    if (this.engine.dimension === 1) {
      this.engine.seedPattern([[cx], [cx + 1], [cx + 2]]);
    } else {
      this.engine.seedPattern([[cx + 1, cy], [cx + 2, cy + 1], [cx, cy + 2], [cx + 1, cy + 2], [cx + 2, cy + 2]]);
    }
    this.afterStateChange();
  }

  seedRandom() {
    this.applyControls(true);
    this.engine.randomSeed({
      density: this.usageModeSelect.value === 'two' ? 0.08 : (Number(this.speciesSelect.value) > 1 ? 0.22 : 0.18),
      speciesCount: Number(this.speciesSelect.value) || 1
    });
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

  togglePlay() {
    this.playing ? this.stop() : this.start();
  }

  start() {
    this.playing = true;
    this.playButton.textContent = t('pause', this.language);
    this.loop();
  }

  stop() {
    this.playing = false;
    clearTimeout(this.timer);
    this.playButton.textContent = t('start', this.language);
  }

  loop() {
    if (!this.playing) return;
    this.step();
    this.timer = setTimeout(() => this.loop(), Number(this.speedRange.value) || 130);
  }

  setTool(tool) {
    this.tool = tool;
    this.syncToolButtons();
  }

  syncToolButtons() {
    this.root.querySelectorAll('[data-tool]').forEach((button) => {
      button.classList.toggle('active', button.dataset.tool === this.tool);
    });
  }

  handleCanvasPointer(event) {
    const position = this.eventToPosition(event);
    if (!position) return;

    if (this.tool === 'inspect') {
      const cell = this.engine.getCell(position);
      this.challengeStatus.textContent = `${t('status', this.language)}: ${position.join(',')} species=${cell.species || 0} age=${cell.age || 0}`;
      return;
    }

    if (this.tool === 'erase') {
      this.engine.setCell(position, { state: 0, species: 0, age: 0 });
    } else {
      const species = this.usageModeSelect.value === 'two'
        ? Number(this.activePlayerSelect.value)
        : Number(this.activePlayerSelect.value || this.speciesSelect.value || 1);
      this.engine.setCell(position, { state: 1, species, age: 1, energy: 1, health: 1 });
    }
    this.afterStateChange();
  }

  eventToPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * this.engine.size[0]);
    const y = this.engine.dimension >= 2
      ? Math.floor(((event.clientY - rect.top) / rect.height) * this.engine.size[1])
      : 0;
    if (x < 0 || x >= this.engine.size[0]) return null;
    if (this.engine.dimension === 1) return [x];
    if (y < 0 || y >= this.engine.size[1]) return null;
    if (this.engine.dimension === 2) return [x, y];
    if (this.engine.dimension === 3) return [x, y, Math.floor(this.engine.size[2] / 2)];
    return [x, y, 0, 0];
  }

  afterStateChange() {
    const obs = this.engine.getObservables();
    const hash = hashAliveCells(this.engine);
    const center = centerOfMass(this.engine);

    if (obs.population === 0 && this.extinctionTime == null) this.extinctionTime = obs.generation;
    if (!this.initialCenter && center) this.initialCenter = center;

    if (hash && this.stateHashes.has(hash)) {
      obs.oscillationPeriod = obs.generation - this.stateHashes.get(hash);
    } else if (hash) {
      this.stateHashes.set(hash, obs.generation);
    }

    obs.frontVelocity = this.initialCenter && center && obs.generation > 0
      ? distance(this.initialCenter, center) / obs.generation
      : 0;

    this.history.push(structuredClone(obs));
    if (this.history.length > 220) this.history.shift();

    this.draw();
    this.updateReadout(obs);
    this.updateChallengeStatus(obs);
    this.drawPlots();
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
    return {
      a: aCells + territoryA + stability + diversity - overcrowding - extinctionA,
      b: bCells + territoryB + stability + diversity - overcrowding - extinctionB
    };
  }

  updateChallengeStatus(obs = this.engine.getObservables()) {
    const usage = this.usageModeSelect.value;
    if (usage === 'zero') {
      this.challengeStatus.textContent = `${t('status', this.language)}: ${t('running', this.language)}`;
      return;
    }

    if (usage === 'two') {
      const scores = this.computeScores(obs);
      const lead = scores.a === scores.b ? 'Tie' : (scores.a > scores.b ? t('playerA', this.language) : t('playerB', this.language));
      this.challengeStatus.textContent = `${t('status', this.language)}: ${lead}`;
      return;
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
    if (this.canvas.width !== size || this.canvas.height !== size) {
      this.canvas.width = size;
      this.canvas.height = size;
    }
  }

  draw() {
    this.resizeCanvas();
    const ctx = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const sx = width / this.engine.size[0];
    const sy = height / (this.engine.size[1] || 1);
    const depth = this.engine.dimension >= 3 ? this.engine.size[2] : 1;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#050a12';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = Math.max(1, sx * 0.04);
    for (let x = 0; x <= this.engine.size[0]; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x * sx, 0);
      ctx.lineTo(x * sx, height);
      ctx.stroke();
    }
    if (this.engine.dimension >= 2) {
      for (let y = 0; y <= this.engine.size[1]; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y * sy);
        ctx.lineTo(width, y * sy);
        ctx.stroke();
      }
    }

    for (let z = 0; z < depth; z += 1) {
      const depthAlpha = depth === 1 ? 1 : 0.22 + (z / Math.max(1, depth - 1)) * 0.78;
      const yLimit = this.engine.dimension === 1 ? 1 : this.engine.size[1];
      for (let y = 0; y < yLimit; y += 1) {
        for (let x = 0; x < this.engine.size[0]; x += 1) {
          const position = this.engine.dimension === 1 ? [x] : (this.engine.dimension === 2 ? [x, y] : [x, y, z]);
          const cell = this.engine.getCell(position);
          if (!isAlive(cell)) continue;
          const maxAge = Number(this.ageRange.value) || 0;
          const ageAlpha = maxAge ? Math.max(0.34, 1 - (cell.age || 0) / (maxAge + 6)) : 0.92;
          ctx.globalAlpha = ageAlpha * depthAlpha;
          ctx.fillStyle = COLORS[cell.species] || COLORS[1];
          const offset = depth === 1 ? 0 : z * 0.25;
          const drawY = this.engine.dimension === 1 ? height * 0.46 : y * sy;
          const drawH = this.engine.dimension === 1 ? Math.max(4, height * 0.08) : Math.max(1, sy - 2);
          ctx.fillRect(x * sx + 1 + offset, drawY + 1 + offset, Math.max(1, sx - 2), drawH);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  drawPlots() {
    this.drawLinePlot(this.populationPlot, this.history.map((item) => item.population), '#22c55e');
    this.drawSpeciesPlot();
  }

  drawLinePlot(canvas, values, color) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(5,10,18,0.82)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(148,163,184,0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    if (values.length < 2) return;
    const max = Math.max(1, ...values);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((value, i) => {
      const x = (i / Math.max(1, values.length - 1)) * width;
      const y = height - (value / max) * (height - 12) - 6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  drawSpeciesPlot() {
    const canvas = this.speciesPlot;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(5,10,18,0.82)';
    ctx.fillRect(0, 0, width, height);
    [1, 2, 3].forEach((species) => {
      const values = this.history.map((item) => item.speciesFractions?.[species] || 0);
      if (values.length < 2) return;
      ctx.strokeStyle = COLORS[species];
      ctx.lineWidth = 2;
      ctx.beginPath();
      values.forEach((value, i) => {
        const x = (i / Math.max(1, values.length - 1)) * width;
        const y = height - value * (height - 12) - 6;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }

  exportPattern() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      mode: this.mode.id,
      usage: this.usageModeSelect.value,
      twoPlayerMode: this.twoPlayerModeSelect.value,
      challengeGoal: this.challengeGoalSelect.value,
      state: this.engine.exportState()
    };
    this.patternJson.value = JSON.stringify(payload, null, 2);
  }

  importPattern() {
    try {
      const payload = JSON.parse(this.patternJson.value);
      const state = payload.state || payload;
      this.engine.importState(state);
      this.dimensionSelect.value = String(this.engine.dimension);
      this.boardSizeSelect.value = String(this.engine.size[0]);
      this.topologySelect.value = this.engine.topology.boundary;
      this.neighborhoodSelect.value = this.engine.neighborhoodType;
      if (payload.mode) {
        this.mode = findLifeMode(payload.mode);
        this.modeSelect.value = this.mode.id;
        this.title.textContent = modeTitle(this.mode, this.language);
        this.description.textContent = modeLong(this.mode, this.language);
        this.tags.textContent = modeTags(this.mode, this.language).join(' · ');
      }
      this.history = [];
      this.stateHashes = new Map();
      this.extinctionTime = null;
      this.afterStateChange();
    } catch (error) {
      this.challengeStatus.textContent = `Import failed: ${error.message}`;
    }
  }
}

export function installLifeUI(root = document) {
  const ui = new LifeUI(root);
  ui.install();
  return ui;
}
