import { FirebaseStateNetworkManager } from '../FirebaseStateNetworkManager.js';
import { installProjectedBoardTouchControls } from './ProjectedBoardTouchControls.js';
import { JumpGameState, chooseJumpRobotMove, coordKey, normalizeJumpLattice, otherPlayer } from './JumpRules.js';
import { loadLatestJumpTrainedScorer } from './JumpTrainedRobot.js';
import { recordRobotLearningMove } from './RobotLearningRecorder.js';

const JUMP_ROBOT_STEP_MS = 1000;
const EMBEDDED_SURFACE_TOPOLOGIES = new Set(['cylinder', 'torus', 'mobius', 'klein', 'rp2', 'sphere', 'shell']);
const DIM_LABELS = { 2: '2D', 3: '3D', 4: '4D' };
const TOPOLOGY_LABELS = {
  plane: 'Standard', polar: 'Polar', cylinder: 'Cylinder', torus: 'Torus', mobius: 'Mobius', klein: 'Klein', rp2: 'RP2', sphere: 'Sphere',
  cube: 'R3', reflective: 'Reflective', shell: 'Sphere', hypercube: 'Hypercube', projection: 'Projection', '4d-torus': '4D Torus'
};
const TOPOLOGY_ZH_LABELS = {
  plane: '標準',
  polar: '極座標',
  cylinder: '圓柱',
  torus: '環面',
  mobius: '莫比烏斯',
  klein: 'Klein 瓶',
  rp2: 'RP2',
  sphere: '球面',
  cube: 'R3',
  reflective: '反射',
  shell: '球殼',
  hypercube: '4D',
  projection: '投影',
  '4d-torus': '4D 環面'
};
TOPOLOGY_LABELS.plane = 'Square Board';
TOPOLOGY_LABELS.diamond = 'Standard';
TOPOLOGY_ZH_LABELS.plane = '\u65b9\u5f62\u68cb\u76e4';
TOPOLOGY_ZH_LABELS.diamond = '\u6a19\u6e96';
const LATTICE_LABELS = { square: 'Square', triangular: 'Triangular', kagome: 'Kagome' };
const JUMP_ZH_TEXT = new Map(Object.entries({
  '2D Jump': '2D 跳棋',
  'Standard Jump': '標準跳棋',
  '3D Jump': '3D 跳棋',
  '4D Jump': '4D 跳棋',
  jump: '跳棋',
  chain: '連跳',
  target: '目標',
  topology: '拓撲',
  'Game Controls': '遊戲控制',
  Home: '首頁',
  Play: '對局',
  Mode: '模式',
  Topology: '拓撲',
  Lattice: '晶格',
  'Board size': '棋盤大小',
  'Target axis': '目標軸',
  Timer: '計時',
  'No time': '不計時',
  'Target Mode': '目標模式',
  'Opponent Home Zone': '對方本區',
  'Antipodal Zone': '對跖目標區',
  'Same Charge Sector': '同電荷扇區',
  'Fusion Target': '融合目標',
  'Braid Target': '編織目標',
  'Custom Marked Target': '自訂標記目標',
  'Advanced / Research Settings': '進階 / 研究設定',
  'Board View': '棋盤視角',
  View: '視圖',
  Board: '棋盤',
  'All 2D z/w slices': '全部 2D z/w 切片',
  '3D x/y/z slice': '3D x/y/z 切片',
  '4D stacked view': '4D 堆疊視圖',
  'Visible w for 3D slice': '3D 切片的可見 w',
  'Hypercubic / R4': '超立方格 / R4',
  'Choose one w coordinate to inspect its interactive 3D x/y/z board.': '選擇一個 w 座標，檢視可互動的 3D x/y/z 棋盤。',
  'Rotate X': '旋轉 X',
  'Rotate Y': '旋轉 Y',
  'Rotate Z': '旋轉 Z',
  Zoom: '縮放',
  'R3 coordinate view filter': 'R3 座標視圖篩選',
  'Leave a field empty to show all coordinates on that axis. Reset Camera clears this filter.': '欄位留空會顯示該軸全部座標。重設相機會清除篩選。',
  'Reset Camera': '重設相機',
  'Reset View': '重設視角',
  'Focus Own': '聚焦己方',
  'Drag rotates 3D boards. Mouse wheel or trackpad zooms.': '拖曳可旋轉 3D 棋盤，滑鼠滾輪或觸控板可縮放。',
  'New Game': '新局',
  'Stop Jump Chain': '停止連跳',
  Online: 'Online',
  Disconnected: '未連線',
  'Find Match': '尋找對手',
  'Create Room': '建立房間',
  'Room code': '房間碼',
  Join: '加入',
  'Room:': '房間：',
  'Copy Share Link': '複製分享連結',
  'Leave Room': '離開房間',
  Zones: '區域',
  'Player A home / B target': '玩家 A 本區 / B 目標',
  'Player B home / A target': '玩家 B 本區 / A 目標',
  'Legal step': '合法一步',
  'Legal jump': '合法跳躍',
  Info: '說明',
  'Move History + Analysis': '移動歷史 + 分析',
  'Analyze / Suggest': '分析 / 建議',
  Ready: '準備',
  'Movable Pieces': '可移動棋子',
  'Current player pieces': '當前玩家棋子',
  'Available Moves': '可用走法',
  'Select a piece': '選擇棋子',
  'Jump move picker': '跳棋走法選擇',
  Winner: '勝者',
  Turn: '回合',
  'Waiting for Player': '等待玩家',
  'No active selection': '尚未選取',
  'Destinations appear on your turn.': '輪到你時會顯示目的地。',
  Player: '玩家',
  movable: '可移動',
  'No movable pieces.': '沒有可移動棋子。',
  'Select a movable piece to list destinations.': '選擇可移動棋子以列出目的地。',
  destination: '目的地',
  destinations: '目的地',
  'This piece has no legal destinations.': '這枚棋子沒有合法目的地。',
  over: '越過',
  stepMove: '一步',
  jumpMove: '跳躍',
  none: '無',
  'Current player': '當前玩家',
  'Legal moves': '合法走法',
  'Suggested move': '建議走法',
  progress: '進度',
  'Score estimate for A': '玩家 A 分數估計',
  'wins on time': '超時獲勝',
  'Polar Jump': '極座標跳棋',
  'Cylinder Jump': '圓柱跳棋',
  'Torus Jump': '環面跳棋',
  'Mobius Jump': '莫比烏斯跳棋',
  'Klein Jump': 'Klein 瓶跳棋',
  'RP2 Jump': 'RP2 跳棋',
  'Sphere Jump': '球面跳棋',
  '3D Cylinder Jump': '3D 圓柱跳棋',
  '3D Torus Jump': '3D 環面跳棋',
  '3D Reflective Jump': '3D 反射跳棋',
  '3D Sphere / Shell Jump': '3D 球殼跳棋',
  '4D Cylinder Jump': '4D 圓柱跳棋',
  '4D Torus Jump': '4D 環面跳棋',
  '4D Hypercube Jump': '4D 超立方跳棋',
  '4D Projection Jump': '4D 投影跳棋',
  Square: '方格',
  Triangular: '三角格',
  'Slice z': '切片 z',
  'Slice w': '切片 w',
  all: '全部',
  'x = all': 'x = 全部',
  'y = all': 'y = 全部',
  'z = all': 'z = 全部'
}));
JUMP_ZH_TEXT.set('Diamond Jump', '菱形跳棋');
JUMP_ZH_TEXT.set('Space', '空間');
JUMP_ZH_TEXT.set('R3 Jump', 'R3 跳棋');
JUMP_ZH_TEXT.set('R3', 'R3');
JUMP_ZH_TEXT.set('x-wrap', 'x \u74b0\u7e5e');
JUMP_ZH_TEXT.set('y-wrap', 'y \u74b0\u7e5e');
JUMP_ZH_TEXT.set('x-wrap + y-twist', 'x \u74b0\u7e5e + y \u7ffb\u8f49');
JUMP_ZH_TEXT.set('x/y antipodal', 'x/y \u5c0d\u8e60');
JUMP_ZH_TEXT.set('Sphere / Shell', '球面 / 球殼');

function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || min)); }
function parseCoordKey(key) { return key.split(',').map(Number); }
function withQuery(defaults = {}) {
  const params = new URLSearchParams(location.search);
  const value = (name, fallback) => params.get(name) || fallback;
  return {
    ...defaults,
    dimension: Number(value('dimension', defaults.dimension || 2)),
    topology: value('topology', defaults.topology || defaults.boundary || 'diamond'),
    lattice: value('lattice', defaults.lattice || 'triangular'),
    labMode: value('lab', defaults.labMode || ''),
    size: Number(value('size', defaults.size || (defaults.dimension === 4 ? 5 : defaults.dimension === 3 ? 6 : 12)))
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

function waitJumpRobotStep() {
  return new Promise((resolve) => setTimeout(resolve, JUMP_ROBOT_STEP_MS));
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
    this.language = jumpLanguage();
    this.dimension = clamp(this.config.dimension, 2, 4);
    this.canvas = document.getElementById('jumpCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.statusEl = document.getElementById('jumpStatus');
    this.progressEl = document.getElementById('jumpProgress');
    this.infoEl = document.getElementById('jumpInfo');
    this.historyEl = document.getElementById('moveHistory');
    this.modeSelect = document.getElementById('gameModeSelect');
    this.viewModeSelect = document.getElementById('viewModeSelect');
    this.onlineControls = document.getElementById('onlineControls');
    this.wSliceButtons = document.getElementById('wSliceButtons');
    this.topologySelect = document.getElementById('topologySelect');
    this.latticeSelect = document.getElementById('latticeSelect');
    this.playerCountSelect = document.getElementById('playerCountSelect');
    this.sizeSelect = document.getElementById('boardSizeSelect');
    this.timerSelect = document.getElementById('timerSelect');
    this.timerRow = document.getElementById('jumpTimerRow');
    this.timerAEl = document.getElementById('jumpTimerA');
    this.timerBEl = document.getElementById('jumpTimerB');
    this.axisSelect = document.getElementById('targetAxisSelect');
    this.targetModeSelect = document.getElementById('targetModeSelect');
    this.endJumpButton = document.getElementById('endJumpButton');
    this.newButton = document.getElementById('newGameButton');
    this.analyzeButton = document.getElementById('analyzeButton');
    this.analysisEl = document.getElementById('analysisOutput');
    this.selected = null;
    this.legal = [];
    this.history = [];
    this.timeLimit = 0;
    this.timeRemaining = { A: 0, B: 0 };
    this.timerInterval = null;
    this.myColor = null;
    this.trainedRobotScorer = null;
    this.view = { rotX: -26, rotY: 32, rotZ: 0, zoom: 1, drag: null };
    this.viewControls = {
      rotX: document.getElementById('viewRotateX'),
      rotY: document.getElementById('viewRotateY'),
      rotZ: document.getElementById('viewRotateZ'),
      zoom: document.getElementById('viewZoom'),
      reset: document.getElementById('viewResetButton'),
      focusOwn: document.getElementById('focusOwnPiecesBtn'),
      cameraPad: document.getElementById('cameraPad')
    };
    this.sliceInputs = {
      x: document.getElementById('r3FilterX') || document.getElementById('sliceXInput'),
      y: document.getElementById('r3FilterY') || document.getElementById('sliceYInput'),
      z: document.getElementById('r3FilterZ') || document.getElementById('sliceZInput'),
      w: document.getElementById('sliceWInput')
    };
    this.sliceFilterEl = document.getElementById('r3FilterControl');
    this.focusOwnPieces = false;
    this.sliceProjectionMap = null;
    this.sliceTileRegions = [];
    this.sliceCellSize = 0;
    this.applyInitialSelectValues();
    this.movePicker = this.ensureMovePicker();
    this.translateStaticUI();
    this.suppressCanvasClickUntil = 0;
    this.network = new FirebaseStateNetworkManager(this, { gameKey: this.onlineGameKey(), matchKey: this.onlineMatchKey() });
    this.game = this.createGame();
    this.syncTimerFromSelect(true);
    this.install();
    this.updateLabels();
    this.render();
    loadLatestJumpTrainedScorer().then((scorer) => { this.trainedRobotScorer = scorer; });
  }

  chooseRobotMove(player = this.game.currentPlayer, remember = true) {
    return chooseJumpRobotMove(this.game, player, this.trainedRobotScorer, { remember });
  }

  createGame() {
    const topology = this.topologySelect?.value || this.config.topology || 'plane';
    const gameDimension = this.effectiveDimensionForTopology(topology);
    this.syncLatticeAvailability(topology);
    const lattice = normalizeJumpLattice(this.latticeSelect?.value || this.config.lattice || 'square', gameDimension, topology);
    const playerCount = Math.max(2, Math.min(3, Math.floor(Number(this.playerCountSelect?.value || this.config.playerCount || 2) || 2)));
    const size = Number(this.sizeSelect?.value || this.config.size || (this.dimension === 4 ? 5 : 8));
    const targetAxis = this.axisSelect?.value || this.config.targetAxis || 'x';
    const labTargetMode = this.targetModeSelect?.value || 'opponentHome';
    return new JumpGameState({
      dimension: gameDimension,
      size,
      topology,
      lattice,
      playerCount,
      targetAxis,
      labMode: this.config.labMode || '',
      labTargetMode,
      zoneMode: ['cylinder', 'torus', 'mobius', 'klein', 'rp2', 'projection', '4d-torus'].includes(topology) ? 'marked' : 'auto'
    });
  }

  effectiveDimensionForTopology(topology = this.topologySelect?.value || this.config.topology || 'plane') {
    const top = String(topology || '').toLowerCase();
    return this.dimension >= 3 && EMBEDDED_SURFACE_TOPOLOGIES.has(top) ? 2 : this.dimension;
  }

  applyInitialSelectValues() {
    const setIfPresent = (select, value) => {
      if (!select || value == null) return;
      const normalized = String(value);
      if ([...select.options].some((option) => option.value === normalized)) select.value = normalized;
    };
    setIfPresent(this.topologySelect, this.config.topology);
    setIfPresent(this.sizeSelect, this.config.size);
    setIfPresent(this.timerSelect, this.config.timer || this.config.timeLimit || 0);
    setIfPresent(this.axisSelect, this.config.targetAxis);
    setIfPresent(this.targetModeSelect, this.config.labTargetMode);
    setIfPresent(this.latticeSelect, this.config.lattice);
    setIfPresent(this.playerCountSelect, this.config.playerCount || 2);
    this.syncLatticeAvailability();
  }

  syncLatticeAvailability(topology = this.topologySelect?.value || this.config.topology || 'plane') {
    if (!this.latticeSelect) return;
    const top = String(topology || '').toLowerCase();
    const effectiveDimension = this.effectiveDimensionForTopology(top);
    const allowGraphLattice = effectiveDimension === 2 && top !== 'polar';
    const allowKagome = this.dimension === 2;
    for (const option of this.latticeSelect.options) {
      option.disabled = (option.value === 'triangular' && !allowGraphLattice)
        || (option.value === 'kagome' && (!allowGraphLattice || !allowKagome));
      option.textContent = this.language === 'zh'
        ? (option.value === 'triangular' ? '三角格' : '方格')
        : (LATTICE_LABELS[option.value] || option.textContent);
      if (this.language === 'zh' && option.value === 'kagome') option.textContent = 'Kagome 格';
    }
    if (!allowGraphLattice || (this.latticeSelect.value === 'kagome' && !allowKagome) || !['square', 'triangular', 'kagome'].includes(this.latticeSelect.value)) {
      this.latticeSelect.value = normalizeJumpLattice(this.latticeSelect.value || this.config.lattice || 'square', effectiveDimension, top);
      if (this.latticeSelect.value === 'kagome' && !allowKagome) this.latticeSelect.value = 'square';
    }
    this.latticeSelect.disabled = !allowGraphLattice;
    this.latticeSelect.title = top === 'polar'
      ? (this.language === 'zh' ? '極座標跳棋固定使用方格徑向/角向連線。' : 'Polar Jump uses square radial/angular links only.')
      : '';
  }

  t(key, fallback = key) {
    if (this.language !== 'zh') return fallback;
    return JUMP_ZH_TEXT.get(key) || fallback;
  }

  translateStaticUI() {
    if (this.language !== 'zh') return;
    document.documentElement.lang = 'zh-Hant';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const tag = node.parentElement?.tagName;
        return tag === 'SCRIPT' || tag === 'STYLE' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const trimmed = node.nodeValue.trim();
      if (!trimmed || !JUMP_ZH_TEXT.has(trimmed)) continue;
      node.nodeValue = node.nodeValue.replace(trimmed, JUMP_ZH_TEXT.get(trimmed));
    }
    document.querySelectorAll('input[placeholder]').forEach((node) => {
      const text = node.getAttribute('placeholder');
      if (JUMP_ZH_TEXT.has(text)) node.setAttribute('placeholder', JUMP_ZH_TEXT.get(text));
    });
    document.querySelectorAll('[aria-label]').forEach((node) => {
      const text = node.getAttribute('aria-label');
      if (JUMP_ZH_TEXT.has(text)) node.setAttribute('aria-label', JUMP_ZH_TEXT.get(text));
    });
    this.syncLatticeAvailability();
  }

  install() {
    addEventListener('resize', () => this.render());
    this.canvas.addEventListener('click', (event) => this.onCanvasClick(event));
    this.installViewControls();
    for (const el of [this.modeSelect, this.viewModeSelect, this.topologySelect, this.latticeSelect, this.playerCountSelect, this.sizeSelect, this.timerSelect, this.axisSelect, this.targetModeSelect]) {
      el?.addEventListener('change', () => {
        if (el === this.modeSelect && this.modeSelect?.value !== 'online') {
          this.network.close({ silent: true });
          this.myColor = null;
        }
        if (el === this.modeSelect) this.updateOnlineControls();
        if (el === this.viewModeSelect) {
          this.updateR3SliceFilterVisibility();
          this.render();
          return;
        }
        if (el === this.topologySelect) this.syncLatticeAvailability();
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
    this.updateOnlineControls();
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
      Object.assign(this.view, { rotX: -26, rotY: 32, rotZ: 0, zoom: 1, drag: null });
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
    this.viewControls.cameraPad?.addEventListener('click', (event) => {
      const button = event.target.closest?.('button[data-camera-view]');
      if (!button) return;
      this.setCameraView(button.dataset.cameraView || 'home');
    });
    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      this.view.zoom = Math.max(0.35, Math.min(2.8, this.view.zoom * factor));
      if (this.viewControls.zoom) this.viewControls.zoom.value = String(this.view.zoom.toFixed(2));
      this.render();
    }, { passive: false });
    installProjectedBoardTouchControls({
      element: this.canvas,
      view: this.view,
      isEnabled: () => this.usesEmbeddedView(),
      rotationScale: 0.24,
      syncControls: () => {
        if (this.viewControls.rotX) this.viewControls.rotX.value = String(Math.round(this.view.rotX));
        if (this.viewControls.rotY) this.viewControls.rotY.value = String(Math.round(this.view.rotY));
        if (this.viewControls.zoom) this.viewControls.zoom.value = String(this.view.zoom.toFixed(2));
      },
      render: () => this.render(),
      suppressClick: () => { this.suppressCanvasClickUntil = performance.now() + 220; }
    });
    this.canvas.addEventListener('contextmenu', (event) => { if (this.usesEmbeddedView()) event.preventDefault(); });
    this.updateR3SliceFilterVisibility();
    this.syncPieceFocusButton();
  }

  isFreeAxis3DBoard() {
    const top = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    return this.dimension >= 3 && !EMBEDDED_SURFACE_TOPOLOGIES.has(top);
  }

  setCameraView(view) {
    const presets = {
      x: { rotX: 0, rotY: 90, rotZ: 0, zoom: 1.08 },
      y: { rotX: -90, rotY: 0, rotZ: 0, zoom: 1.08 },
      z: { rotX: 0, rotY: 0, rotZ: 0, zoom: 1.08 },
      home: { rotX: -26, rotY: 32, rotZ: 0, zoom: 1 }
    };
    Object.assign(this.view, presets[view] || presets.home, { drag: null });
    if (this.viewControls.rotX) this.viewControls.rotX.value = String(this.view.rotX);
    if (this.viewControls.rotY) this.viewControls.rotY.value = String(this.view.rotY);
    if (this.viewControls.rotZ) this.viewControls.rotZ.value = String(this.view.rotZ);
    if (this.viewControls.zoom) this.viewControls.zoom.value = String(this.view.zoom);
    this.render();
  }

  updateLabels() {
    const title = document.getElementById('gameTitle');
    const lab = this.config.labMode;
    const topology = this.topologySelect?.value || this.config.topology || this.game?.topologyName || 'plane';
    const topologyLabel = this.language === 'zh'
      ? (TOPOLOGY_ZH_LABELS[topology] || DIM_LABELS[this.dimension])
      : (TOPOLOGY_LABELS[topology] || DIM_LABELS[this.dimension]);
    if (title) title.textContent = lab ? labTitle(lab) : `${topologyLabel} ${jumpWord()}`;
    const desc = document.getElementById('gameDescription');
    if (desc) desc.textContent = lab ? labDescription(lab) : dimensionDescription(this.dimension);
    if (this.infoEl) {
      this.infoEl.textContent = jumpIntroText();
      return;
      this.infoEl.textContent = jumpLanguage() === 'zh'
        ? '跳棋模式使用一步移動與連跳。目標是把自己的棋子從本方區域移到目標區。方格棋盤使用上下左右連線，三角格棋盤增加兩條斜向連線；極座標棋盤固定使用方格徑向/角向連線。環面、莫比烏斯、Klein、RP2、球面、3D 與 4D 棋盤會直接標出目標區，因為空間改變時「對面」的意思也會改變。'
        : 'Jump modes use step moves and chain jumps. Move your pieces from home into the target zone. Diamond boards place the armies in triangular tip regions and can use Square, Triangular, or Kagome lattice links. Square boards use axis links, triangular boards add visible diagonal graph links, Kagome alternates triangle and hexagon links, and polar boards use square radial/angular links only. On torus, Mobius, Klein, RP2, sphere, 3D, and 4D boards the target is explicitly marked because opposite changes with the space.';
    }
  }

  resetGame() {
    this.stopTimer();
    this.syncLatticeAvailability();
    this.game = this.createGame();
    this.selected = null;
    this.legal = [];
    this.history = [];
    this.syncTimerFromSelect(true);
    this.network.gameKey = this.onlineGameKey();
    this.network.matchKey = this.onlineMatchKey();
    this.updateLabels();
    this.updateR3SliceFilterVisibility();
    this.render();
    if (this.modeSelect?.value === 'online' && this.game.playerCount >= 3 && this.game.currentPlayer === 'C' && this.myColor === 'A') {
      setTimeout(() => this.onlineRobotTurn('C'), JUMP_ROBOT_STEP_MS);
    }
  }

  syncTimerFromSelect(resetClocks = false) {
    const value = Math.max(0, Number(this.timerSelect?.value || 0) || 0);
    this.timeLimit = value;
    if (resetClocks || !this.timeRemaining) this.timeRemaining = { A: value, B: value };
    if (value <= 0) {
      this.timeRemaining = { A: 0, B: 0 };
      this.stopTimer();
    }
    this.updateTimerDisplay();
  }

  startTimer() {
    if (this.timerInterval || this.timeLimit <= 0 || this.game?.winner) return;
    this.timerInterval = setInterval(() => {
      if (!this.game || this.game.winner || this.timeLimit <= 0) {
        this.stopTimer();
        return;
      }
      const player = this.game.currentPlayer === 'B' ? 'B' : 'A';
      this.timeRemaining[player] = Math.max(0, Number(this.timeRemaining[player] || 0) - 1);
      if (this.timeRemaining[player] <= 0) {
        const winner = otherPlayer(player);
        this.game.winner = winner;
        this.history.push(`Player ${winner} ${this.t('wins on time', 'wins on time')}.`);
        this.selected = null;
        this.legal = [];
        this.stopTimer();
        this.network.sendState({ type: 'time_win' });
      }
      this.updateTimerDisplay();
      this.render();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  formatTimer(seconds) {
    if (this.timeLimit <= 0) return '--';
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    const mins = Math.floor(value / 60);
    const secs = value % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  updateTimerDisplay() {
    const timed = this.timeLimit > 0;
    if (this.timerRow) this.timerRow.hidden = false;
    if (this.timerAEl) {
      this.timerAEl.textContent = `A ${this.formatTimer(this.timeRemaining.A)}`;
      this.timerAEl.classList.toggle('active', timed && this.game?.currentPlayer === 'A' && !this.game?.winner);
    }
    if (this.timerBEl) {
      this.timerBEl.textContent = `B ${this.formatTimer(this.timeRemaining.B)}`;
      this.timerBEl.classList.toggle('active', timed && this.game?.currentPlayer === 'B' && !this.game?.winner);
    }
  }

  onCanvasClick(event) {
    if (performance.now() < this.suppressCanvasClickUntil) return;
    if (this.open4DSliceFromEvent(event)) return;
    if (!this.canCurrentUserAct()) return;
    const coord = this.coordFromEvent(event);
    if (!coord) return;
    if (this.selected) {
      if (this.game.chainFrom && samePoint(this.selected, coord)) {
        this.stopJumpChain();
        return;
      }
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
          <span>${escapeHtml(this.t('Movable Pieces', 'Movable Pieces'))}</span>
          <span class="jump-picker-summary" id="jumpPieceSummary">${escapeHtml(this.t('Current player pieces', 'Current player pieces'))}</span>
        </div>
        <div class="jump-piece-strip" id="jumpMovablePiecesList"></div>
        <div class="jump-move-picker-head jump-move-options-head">
          <span>${escapeHtml(this.t('Available Moves', 'Available Moves'))}</span>
          <span class="jump-picker-summary" id="jumpMoveSummary">${escapeHtml(this.t('Select a piece', 'Select a piece'))}</span>
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
      const coord = parseCoordKey(button.dataset.pieceKey);
      if (this.game.chainFrom && this.selected && samePoint(this.selected, coord)) {
        this.stopJumpChain();
        return;
      }
      this.selectJumpPiece(coord);
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

  stopJumpChain() {
    if (!this.game?.chainFrom) return false;
    this.game.endTurn();
    this.selected = null;
    this.legal = [];
    this.afterMove('jump chain stopped');
    return true;
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
    const visibleMovablePieces = movablePieces
      .slice()
      .sort((a, b) => (a.key === selectedKey ? -1 : b.key === selectedKey ? 1 : 0))
      .slice(0, this.dimension >= 3 ? 24 : movablePieces.length);

    if (!canMove) {
      const text = this.game.winner
        ? this.resultText()
        : `${this.t('Waiting for Player', 'Waiting for Player')} ${player}`;
      if (this.movePicker.pieceSummary) this.movePicker.pieceSummary.textContent = text;
      if (this.movePicker.pieces) this.movePicker.pieces.innerHTML = `<span class="jump-empty-row">${escapeHtml(text)}</span>`;
      if (this.movePicker.moveSummary) this.movePicker.moveSummary.textContent = this.t('No active selection', 'No active selection');
      if (this.movePicker.moves) this.movePicker.moves.innerHTML = `<span class="jump-empty-row">${escapeHtml(this.t('Destinations appear on your turn.', 'Destinations appear on your turn.'))}</span>`;
      return;
    }

    if (this.movePicker.pieceSummary) this.movePicker.pieceSummary.textContent = `${this.t('Player', 'Player')} ${player}: ${movablePieces.length} ${this.t('movable', 'movable')}`;
    if (this.movePicker.pieces) {
      this.movePicker.pieces.innerHTML = movablePieces.length
        ? visibleMovablePieces.map(({ key, coord, moves }) => `
          <button class="jump-piece-button${key === selectedKey ? ' active' : ''}" type="button" data-piece-key="${escapeHtml(key)}" aria-pressed="${key === selectedKey}">
            <span class="jump-piece-owner">${escapeHtml(player)}</span>
            <span class="jump-piece-coord">${escapeHtml(this.formatCoord(coord))}</span>
            <span class="jump-piece-count">${moves.length}</span>
          </button>
        `).join('')
        : `<span class="jump-empty-row">${escapeHtml(this.t('No movable pieces.', 'No movable pieces.'))}</span>`;
    }

    if (!this.selected) {
      if (this.movePicker.moveSummary) this.movePicker.moveSummary.textContent = this.t('Select a piece', 'Select a piece');
      if (this.movePicker.moves) this.movePicker.moves.innerHTML = `<span class="jump-empty-row">${escapeHtml(this.t('Select a movable piece to list destinations.', 'Select a movable piece to list destinations.'))}</span>`;
      return;
    }

    if (this.movePicker.moveSummary) this.movePicker.moveSummary.textContent = `${this.formatCoord(this.selected)} -> ${this.legal.length} ${this.t('destination', this.legal.length === 1 ? 'destination' : 'destinations')}`;
    if (this.movePicker.moves) {
      this.movePicker.moves.innerHTML = this.legal.length
        ? this.legal.map((move) => `
          <button class="jump-move-option ${move.type}" type="button" data-move-id="${escapeHtml(move.id)}">
            ${escapeHtml(this.formatMoveLabel(move))}
          </button>
        `).join('')
        : `<span class="jump-empty-row">${escapeHtml(this.t('This piece has no legal destinations.', 'This piece has no legal destinations.'))}</span>`;
    }
  }

  formatCoord(coord) { return `(${coord.join(',')})`; }
  moveTypeLabel(type) {
    if (type === 'jump') return this.t('jumpMove', 'jump');
    if (type === 'step') return this.t('stepMove', 'step');
    return this.t(type, type);
  }
  formatMoveLabel(move) {
    const over = move.over ? ` ${this.t('over', 'over')} ${this.formatCoord(move.over)}` : '';
    return `${this.moveTypeLabel(move.type)} -> ${this.formatCoord(move.to)}${over}`;
  }

  afterMove(label) {
    if (!this.game.winner) this.startTimer();
    else this.stopTimer();
    this.render();
    this.network.sendState({ type: label || 'jump_move' });
    if (this.modeSelect?.value === 'online' && this.game.playerCount >= 3 && this.game.currentPlayer === 'C' && this.myColor === 'A') {
      setTimeout(() => this.onlineRobotTurn('C'), JUMP_ROBOT_STEP_MS);
    }
    if (this.modeSelect?.value === 'robot' && !this.game.winner && this.game.currentPlayer !== 'A') setTimeout(() => this.robotTurn(), JUMP_ROBOT_STEP_MS);
  }

  recordJumpRobotMove(player, move, result = null) {
    recordRobotLearningMove({
      gameType: 'jump',
      variant: `${this.dimension}d`,
      topology: `${this.game?.topologyName || this.topologyName || 'standard'}:${this.game?.lattice || this.lattice || 'triangular'}:${this.game?.playerCount || 2}p`,
      player,
      robot: this.trainedRobotScorer ? 'trained-local' : 'heuristic-local',
      move: move ? {
        type: move.type,
        from: move.from,
        to: move.to,
        over: move.over || null,
        chain: Boolean(result?.continueJump)
      } : { type: 'pass' },
      result: this.game?.winner ? { gameOver: true, winner: this.game.winner } : null
    });
  }

  async onlineRobotTurn(player = 'C') {
    if (this.modeSelect?.value !== 'online' || this.game.currentPlayer !== player || this.game.winner) return;
    const move = this.chooseRobotMove(player);
    if (!move) {
      this.game.endTurn();
      this.history.push(`Robot ${player} had no legal move and passed the turn.`);
      this.recordJumpRobotMove(player, null);
    } else {
      if (await this.tryScheduleRobotJump(player, move)) {
        this.recordJumpRobotMove(player, move, { scheduled: true });
        this.render();
        this.network.sendState({ type: 'jump_robot_scheduled_move' });
        return;
      }
      const result = this.game.applyMove(move);
      if (!result.ok) {
        this.history.push(`Robot ${player} skipped rejected move: ${move.from.join(',')} -> ${move.to.join(',')}`);
        this.game.endTurn();
      } else {
        this.history.push(`Robot ${player} ${move.type}: ${move.from.join(',')} -> ${move.to.join(',')}`);
        this.recordJumpRobotMove(player, move, result);
        if (result.continueJump) {
          this.render();
          this.network.sendState({ type: 'jump_robot_chain_move' });
          setTimeout(() => this.onlineRobotTurn(player), JUMP_ROBOT_STEP_MS);
          return;
        }
      }
    }
    this.render();
    this.network.sendState({ type: 'jump_robot_c_move' });
  }

  async robotTurn() {
    const robotPlayer = this.game.currentPlayer;
    if (robotPlayer !== 'B' || this.game.playerCount >= 3) {
      if (robotPlayer === 'A' || this.game.winner) return;
      const move = this.chooseRobotMove(robotPlayer);
      if (!move) {
        this.game.endTurn();
        this.history.push(`Robot ${robotPlayer} had no legal move and passed the turn.`);
        this.recordJumpRobotMove(robotPlayer, null);
      } else {
        if (await this.tryScheduleRobotJump(robotPlayer, move)) {
          this.recordJumpRobotMove(robotPlayer, move, { scheduled: true });
          this.render();
          return;
        }
        const result = this.game.applyMove(move);
        if (!result.ok) {
          this.history.push(`Robot ${robotPlayer} skipped rejected move: ${move.from.join(',')} -> ${move.to.join(',')}`);
          this.game.endTurn();
        } else {
          this.history.push(`Robot ${robotPlayer} ${move.type}: ${move.from.join(',')} -> ${move.to.join(',')}`);
          this.recordJumpRobotMove(robotPlayer, move, result);
          if (result.continueJump) {
            this.render();
            setTimeout(() => this.robotTurn(), JUMP_ROBOT_STEP_MS);
            return;
          }
        }
      }
      this.render();
      if (this.modeSelect?.value === 'robot' && !this.game.winner && this.game.currentPlayer !== 'A') {
        setTimeout(() => this.robotTurn(), JUMP_ROBOT_STEP_MS);
      }
      return;
    }
    if (this.game.currentPlayer !== 'B' || this.game.winner) return;
    let guard = 0;
    do {
      const move = this.chooseRobotMove('B');
      if (!move) {
        this.game.endTurn();
        this.history.push('Robot had no legal move and passed the turn.');
        this.recordJumpRobotMove('B', null);
        break;
      }
      if (await this.tryScheduleRobotJump('B', move)) {
        this.recordJumpRobotMove('B', move, { scheduled: true });
        break;
      }
      const result = this.game.applyMove(move);
      if (!result.ok) {
        this.history.push(`Robot skipped rejected move: ${move.from.join(',')} -> ${move.to.join(',')}`);
        this.game.endTurn();
        break;
      }
      this.history.push(`Robot ${move.type}: ${move.from.join(',')} → ${move.to.join(',')}`);
      this.recordJumpRobotMove('B', move, result);
      this.render();
      guard += 1;
      if (result.continueJump) {
        await waitJumpRobotStep();
        continue;
      }
      break;
    } while (this.game.currentPlayer === 'B' && !this.game.winner);
    this.render();
  }

  async tryScheduleRobotJump(player, move) {
    if (!move || typeof this.__spaceTimeScheduleRobotAction !== 'function') return false;
    const scheduled = await this.__spaceTimeScheduleRobotAction({
      kind: 'jump',
      player,
      move,
      score: Number(move.robotScore || 0)
    });
    if (scheduled) this.history.push(`Robot ${player} scheduled hidden Jump action.`);
    return Boolean(scheduled);
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
      if (this.usesOpaqueSurfaceView() && p.frontFacing === false) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestDist) { bestDist = d; best = coord; }
    }
    return bestDist < this.cellRadius() * 1.2 ? best : null;
  }

  open4DSliceFromEvent(event) {
    if (this.dimension !== 4 || this.viewModeSelect?.value !== 'all_slices' || !this.sliceTileRegions?.length) return false;
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const tile = this.sliceTileRegions.find((region) =>
      x >= region.left && x <= region.right && y >= region.top && y <= region.titleBottom);
    if (!tile) return false;
    this.viewModeSelect.value = 'w_slice';
    if (this.sliceInputs?.w) this.sliceInputs.w.value = String(tile.w + 1);
    this.updateR3SliceFilterVisibility();
    this.render();
    return true;
  }

  visibleCoord(coord) {
    if ((this.game?.dimension || this.effectiveDimensionForTopology()) <= 2) return true;
    if (this.dimension === 4 && this.viewModeSelect?.value === 'all_slices') return true;
    if (this.dimension === 4 && this.viewModeSelect?.value === 'stacked_4d') return true;
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
    const show = this.isFreeAxis3DBoard();
    const allSlices = this.dimension === 4 && this.viewModeSelect?.value === 'all_slices';
    const stacked = this.dimension === 4 && this.viewModeSelect?.value === 'stacked_4d';
    if (this.dimension === 4 && this.sliceInputs?.w) {
      this.sliceInputs.w.max = String(this.game?.size || this.config.size || 5);
      const current = Math.max(1, Math.min(Number(this.sliceInputs.w.value) || 1, Number(this.sliceInputs.w.max)));
      this.sliceInputs.w.value = String(current);
    }
    this.renderWSliceButtons();
    if (this.sliceFilterEl) this.sliceFilterEl.hidden = !show || allSlices || stacked;
    if (this.viewControls.focusOwn) this.viewControls.focusOwn.hidden = !show;
    this.viewControls.cameraPad?.classList.toggle('is-visible', show);
    if (!show) this.clearR3SliceFilters(false);
  }

  renderWSliceButtons() {
    if (!this.wSliceButtons || !this.sliceInputs?.w) return;
    const count = this.game?.size || 1;
    const selected = Math.max(0, Number(this.sliceInputs.w.value || 1) - 1);
    this.wSliceButtons.replaceChildren(...Array.from({ length: count }, (_, w) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `w=${w}`;
      button.setAttribute('aria-pressed', String(selected === w));
      button.addEventListener('click', () => {
        this.sliceInputs.w.value = String(w + 1);
        if (this.viewModeSelect) this.viewModeSelect.value = 'w_slice';
        this.updateViewControls();
        this.renderWSliceButtons();
        this.render();
      });
      return button;
    }));
  }

  focusPlayer() {
    return this.modeSelect?.value === 'online' && this.myColor ? this.myColor : this.game.currentPlayer;
  }

  syncPieceFocusButton() {
    this.viewControls.focusOwn?.setAttribute('aria-pressed', String(this.focusOwnPieces));
  }

  isPolarBoard() {
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    return this.dimension === 2 && topology === 'polar';
  }

  polarLayout(width = this.canvas.clientWidth || 720, height = this.canvas.clientHeight || 520) {
    const radius = Math.min(width, height) * 0.39 * (this.view.zoom || 1);
    return {
      cx: width / 2,
      cy: height * 0.5,
      radius,
      step: radius / Math.max(1, (this.game?.size || 2) - 1)
    };
  }

  cellRadius() {
    if (this.sliceProjectionMap) return Math.max(3, this.sliceCellSize * 0.28);
    return Math.max(8, Math.min(this.canvas.clientWidth || 720, this.canvas.clientHeight || 520) / (this.game.size * 2.8));
  }

  usesEmbeddedView() {
    if (this.dimension === 4 && this.viewModeSelect?.value === 'all_slices') return false;
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    return this.dimension >= 3 || ['projection', '4d-torus', 'hypercube'].includes(topology);
  }

  usesOpaqueSurfaceView() {
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    return this.dimension >= 3 && ['cylinder', 'torus', 'mobius', 'klein', 'rp2', 'sphere', 'shell'].includes(topology);
  }

  usesVolumeGraphView() {
    return this.dimension >= 3 && !this.usesOpaqueSurfaceView();
  }

  embeddedSurfaceNormal(coord, point) {
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    const [x = 0, y = 0, z = 0] = point;
    const normalize = (vector) => {
      const length = Math.hypot(vector[0] || 0, vector[1] || 0, vector[2] || 0);
      return length > 0.0001 ? vector.map((value) => value / length) : null;
    };
    if (topology === 'sphere' || topology === 'shell' || topology === 'rp2' || topology === 'mobius' || topology === 'klein') {
      return normalize(point);
    }
    if (topology === 'cylinder') return normalize([x, 0, z]);
    if (topology === 'torus' || topology === '4d-torus') {
      const angle = Math.atan2(y, x);
      const center = [1.45 * Math.cos(angle), 1.45 * Math.sin(angle), 0];
      return normalize([x - center[0], y - center[1], z - center[2]]);
    }
    return null;
  }

  planarLatticeCoord(coord) {
    const size = Math.max(1, this.game?.size || 1);
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    const lattice = String(this.game?.lattice || this.latticeSelect?.value || 'square').toLowerCase();
    const graphDimension = this.game?.dimension || this.dimension;
    if (graphDimension === 2 && topology === 'diamond') {
      const points = this.game.topology.allCoords().map((c) => ({
        x: (c[0] || 0) + (c[1] || 0) * 0.5,
        y: (c[1] || 0) * Math.sqrt(3) / 2
      }));
      const minX = Math.min(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxX = Math.max(...points.map((p) => p.x));
      const maxY = Math.max(...points.map((p) => p.y));
      const x = (coord[0] || 0) + (coord[1] || 0) * 0.5;
      const y = (coord[1] || 0) * Math.sqrt(3) / 2;
      return {
        x: x - minX,
        y: y - minY,
        maxX: Math.max(1, maxX - minX),
        maxY: Math.max(1, maxY - minY)
      };
    }
    if (graphDimension === 2 && (lattice === 'triangular' || lattice === 'kagome') && !this.isPolarBoard()) {
      const last = Math.max(0, size - 1);
      if (lattice === 'triangular') {
        return {
          x: (coord[0] || 0) + (coord[1] || 0) * 0.5,
          y: (coord[1] || 0) * Math.sqrt(3) / 2,
          maxX: Math.max(1, last * 1.5),
          maxY: Math.max(1, last * Math.sqrt(3) / 2)
        };
      }
      return {
        x: (coord[0] || 0) + ((coord[1] || 0) % 2) * 0.5,
        y: (coord[1] || 0) * Math.sqrt(3) / 2,
        maxX: Math.max(1, last + 0.5),
        maxY: Math.max(1, last * Math.sqrt(3) / 2)
      };
    }
    return {
      x: coord[0] || 0,
      y: coord[1] || 0,
      maxX: Math.max(1, size - 1),
      maxY: Math.max(1, size - 1)
    };
  }

  embeddedPoint(coord) {
    const n = Math.max(1, this.game.size - 1);
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    const planar = this.planarLatticeCoord(coord);
    const u = (planar.x / Math.max(1, planar.maxX + 1)) * Math.PI * 2;
    const v = (planar.y / Math.max(1, planar.maxY + 1)) * Math.PI * 2;
    if (topology === 'torus' || topology === '4d-torus') {
      const R = 1.45;
      const r = 0.48;
      return [(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)];
    }
    if (topology === 'cylinder') {
      const radial = 1.18;
      const vertical = (coord[1] / Math.max(1, n) - 0.5) * 2.2 + ((coord[3] || 0) / Math.max(1, n) - 0.5) * 0.38;
      return [radial * Math.cos(u), vertical, radial * Math.sin(u)];
    }
    if (topology === 'mobius') {
      const t = (coord[1] / Math.max(1, n) - 0.5) * 0.9;
      return [(1.35 + t * Math.cos(u / 2)) * Math.cos(u), (1.35 + t * Math.cos(u / 2)) * Math.sin(u), t * Math.sin(u / 2)];
    }
    if (topology === 'klein') {
      const r = 2 + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v);
      const tube = Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v);
      return [
        r * Math.cos(u) * 0.98,
        tube * 1.02,
        r * Math.sin(u) * 0.76
      ];
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
    const sliced = this.sliceProjectionMap?.get(coordKey(coord));
    if (sliced) return sliced;
    const n = this.game.size;
    const width = this.canvas.clientWidth || 720;
    const height = this.canvas.clientHeight || 520;
    if (this.isPolarBoard()) {
      const layout = this.polarLayout(width, height);
      if ((coord[0] || 0) === 0) return { x: layout.cx, y: layout.cy, depth: 0 };
      const angle = -Math.PI / 2 + ((coord[1] || 0) / Math.max(1, n)) * Math.PI * 2;
      const r = (coord[0] || 0) * layout.step;
      return { x: layout.cx + Math.cos(angle) * r, y: layout.cy + Math.sin(angle) * r, depth: 0 };
    }
    if (this.usesEmbeddedView()) {
      const model = this.embeddedPoint(coord);
      const [x, y, z] = this.rotatePoint3D(model);
      const normal = this.usesOpaqueSurfaceView() ? this.embeddedSurfaceNormal(coord, model) : null;
      const rotatedNormal = normal ? this.rotatePoint3D(normal) : null;
      const perspective = 1 / Math.max(0.35, 1 + z * 0.18);
      const baseScale = this.usesOpaqueSurfaceView() ? 0.31 : 0.39;
      const scale = Math.min(width, height) * baseScale * (this.view.zoom || 1) * perspective;
      const centerY = height * (this.usesOpaqueSurfaceView() ? 0.5 : 0.42);
      return {
        x: width / 2 + x * scale,
        y: centerY + y * scale,
        depth: z,
        frontFacing: !rotatedNormal || rotatedNormal[2] >= -0.08
      };
    }
    const zoom = this.view.zoom || 1;
    const pad = Math.max(40, Math.min(width, height) * 0.08);
    const usableW = width - pad * 2;
    const usableH = height - pad * 2;
    const planar = this.planarLatticeCoord(coord);
    const boardScale = Math.min(usableW / planar.maxX, usableH / planar.maxY) * zoom;
    const boardW = planar.maxX * boardScale;
    const boardH = planar.maxY * boardScale;
    const originX = pad + (usableW - boardW) / 2;
    const originY = pad + (usableH - boardH) / 2;
    const zShift = this.dimension >= 3 ? (coord[2] - (n - 1) / 2) * boardScale * 0.18 : 0;
    const wShift = this.dimension >= 4 ? (coord[3] - (n - 1) / 2) * boardScale * 0.12 : 0;
    return {
      x: originX + planar.x * boardScale + zShift,
      y: originY + planar.y * boardScale - zShift + wShift
    };
  }

  surfaceDrawAlpha(coord) {
    if (!this.usesOpaqueSurfaceView()) return 1;
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    const front = this.project(coord).frontFacing !== false;
    if (topology === 'torus' || topology === 'cylinder') return front ? 1 : 0.72;
    return front ? 1 : 0.68;
  }

  projectEmbeddedModelPoint(model, normal = null) {
    const width = this.canvas.widthCss || this.canvas.clientWidth || 720;
    const height = this.canvas.heightCss || this.canvas.clientHeight || 520;
    const [x, y, z] = this.rotatePoint3D(model);
    const rotatedNormal = normal ? this.rotatePoint3D(normal) : null;
    const perspective = 1 / Math.max(0.35, 1 + z * 0.18);
    const baseScale = 0.31;
    const scale = Math.min(width, height) * baseScale * (this.view.zoom || 1) * perspective;
    return {
      x: width / 2 + x * scale,
      y: height * 0.5 + y * scale,
      depth: z,
      frontFacing: !rotatedNormal || rotatedNormal[2] >= -0.08
    };
  }

  goStyleSurfacePoint(topology, u, v) {
    if (topology === 'torus') {
      const R = 1.45;
      const r = 0.48;
      const point = [(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)];
      const normal = [Math.cos(u) * Math.cos(v), Math.sin(u) * Math.cos(v), Math.sin(v)];
      return { point, normal };
    }
    const radius = 1.18;
    const y = (0.5 - v) * 2.25;
    return {
      point: [radius * Math.cos(u), y, radius * Math.sin(u)],
      normal: [Math.cos(u), 0, Math.sin(u)]
    };
  }

  drawGoStyleEmbeddedSurface(topology) {
    if (topology !== 'torus' && topology !== 'cylinder') return false;
    const ctx = this.ctx;
    const uSegments = topology === 'torus' ? 42 : 36;
    const vSegments = topology === 'torus' ? 18 : 12;
    const cells = [];
    for (let iu = 0; iu < uSegments; iu += 1) {
      const u0 = (iu / uSegments) * Math.PI * 2;
      const u1 = ((iu + 1) / uSegments) * Math.PI * 2;
      for (let iv = 0; iv < vSegments; iv += 1) {
        const v0 = topology === 'torus' ? (iv / vSegments) * Math.PI * 2 : iv / vSegments;
        const v1 = topology === 'torus' ? ((iv + 1) / vSegments) * Math.PI * 2 : (iv + 1) / vSegments;
        const samples = [
          this.goStyleSurfacePoint(topology, u0, v0),
          this.goStyleSurfacePoint(topology, u1, v0),
          this.goStyleSurfacePoint(topology, u1, v1),
          this.goStyleSurfacePoint(topology, u0, v1)
        ].map(({ point, normal }) => this.projectEmbeddedModelPoint(point, normal));
        const depth = samples.reduce((sum, point) => sum + point.depth, 0) / samples.length;
        const frontCount = samples.filter((point) => point.frontFacing).length;
        cells.push({ samples, depth, front: frontCount >= 2 });
      }
    }
    cells.sort((a, b) => b.depth - a.depth);
    ctx.save();
    for (const cell of cells) {
      ctx.beginPath();
      cell.samples.forEach((point, index) => {
        if (index) ctx.lineTo(point.x, point.y);
        else ctx.moveTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fillStyle = cell.front ? '#17304a' : '#0d1d2d';
      ctx.fill();
      ctx.strokeStyle = cell.front ? 'rgba(113, 185, 255, 0.32)' : 'rgba(113, 185, 255, 0.12)';
      ctx.lineWidth = cell.front ? 0.9 : 0.55;
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  render() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(1.5, Math.max(1, devicePixelRatio || 1));
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
    if (this.dimension === 4 && this.viewModeSelect?.value === 'all_slices') {
      this.draw4DAllSlices(width, height);
      return;
    }
    this.sliceProjectionMap = null;
    const visibleCoords = this.game.topology.allCoords().filter((c) => this.visibleCoord(c));
    if (this.usesOpaqueSurfaceView()) this.drawEmbeddedSurfaceFill(visibleCoords);
    const coords = visibleCoords;
    if (this.isPolarBoard()) this.drawPolarFrame(width, height);
    const volumeGraph = this.usesVolumeGraphView();
    ctx.lineWidth = volumeGraph ? 1.35 : 1;
    ctx.strokeStyle = volumeGraph ? 'rgba(132, 202, 255, 0.52)' : 'rgba(95, 174, 255, 0.26)';
    const edgeKeys = new Set();
    for (const coord of coords) {
      for (const dir of (this.game.directionsFor?.(coord) || this.game.directions)) {
        const next = this.game.topology.step(coord, dir)?.position;
        if (!next || !this.visibleCoord(next)) continue;
        if (this.isPolarBoard()) continue;
        const edgeKey = [coordKey(coord), coordKey(next)].sort().join('|');
        if (edgeKeys.has(edgeKey)) continue;
        edgeKeys.add(edgeKey);
        const a = this.project(coord);
        const b = this.project(next);
        if (!this.usesEmbeddedView() && Math.hypot(a.x - b.x, a.y - b.y) > Math.min(width, height) / 2) continue;
        const edgeAlpha = this.usesOpaqueSurfaceView() ? Math.min(this.surfaceDrawAlpha(coord), this.surfaceDrawAlpha(next)) : 1;
        if (edgeAlpha <= 0) continue;
        ctx.save();
        ctx.globalAlpha = edgeAlpha;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.restore();
      }
    }
    this.drawFlatBoundaryCue(coords, width, height);
    for (const coord of coords) {
      const alpha = this.surfaceDrawAlpha(coord);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      this.drawZone(coord);
      ctx.restore();
    }
    for (const coord of coords) {
      const alpha = this.surfaceDrawAlpha(coord);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      this.drawSite(coord);
      ctx.restore();
    }
    for (const [key, owner] of this.game.pieces.entries()) {
      const coord = parseCoordKey(key);
      if (!this.visibleCoord(coord)) continue;
      const alpha = this.surfaceDrawAlpha(coord);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      this.drawPiece(coord, owner, this.game.labels.get(key));
      ctx.restore();
    }
    if (this.game.chainPath.length) this.drawPath(this.game.chainPath);
    if (this.selected) this.drawSelected(this.selected);
    for (const move of this.legal) this.drawLegal(move);
  }

  draw4DAllSlices(width, height) {
    const size = this.game.size;
    const count = size * size;
    const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / columns);
    const outer = Math.max(10, Math.min(width, height) * 0.02);
    const gap = Math.max(6, Math.min(width, height) * 0.009);
    const tileWidth = (width - outer * 2 - gap * (columns - 1)) / columns;
    const tileHeight = (height - outer * 2 - gap * (rows - 1)) / rows;
    const titleHeight = Math.max(12, Math.min(20, tileHeight * 0.13));
    this.sliceProjectionMap = new Map();
    this.sliceTileRegions = [];
    this.sliceCellSize = 0;
    const ctx = this.ctx;
    let tile = 0;

    for (let w = 0; w < size; w += 1) {
      for (let z = 0; z < size; z += 1) {
        const column = tile % columns;
        const row = Math.floor(tile / columns);
        const left = outer + column * (tileWidth + gap);
        const top = outer + row * (tileHeight + gap);
        const boardTop = top + titleHeight;
        const availableHeight = tileHeight - titleHeight;
        const padding = Math.max(4, Math.min(tileWidth, availableHeight) * 0.08);
        const spacing = Math.min(
          (tileWidth - padding * 2) / Math.max(1, size - 1),
          (availableHeight - padding * 2) / Math.max(1, size - 1)
        );
        this.sliceCellSize = spacing;
        const startX = left + (tileWidth - spacing * (size - 1)) / 2;
        const startY = boardTop + (availableHeight - spacing * (size - 1)) / 2;
        ctx.fillStyle = 'rgba(9, 20, 33, 0.98)';
        ctx.fillRect(left, top, tileWidth, tileHeight);
        ctx.strokeStyle = 'rgba(97,174,255,.28)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(left + 0.5, top + 0.5, tileWidth - 1, tileHeight - 1);
        ctx.fillStyle = '#b9cfe2';
        ctx.font = `${Math.max(8, Math.min(12, titleHeight * 0.65))}px system-ui`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`z=${z}, w=${w}`, left + 5, top + titleHeight * 0.5);
        this.sliceTileRegions.push({
          left,
          right: left + tileWidth,
          top,
          titleBottom: top + titleHeight,
          z,
          w
        });
        for (let y = 0; y < size; y += 1) {
          for (let x = 0; x < size; x += 1) {
            this.sliceProjectionMap.set(coordKey([x, y, z, w]), {
              x: startX + x * spacing,
              y: startY + y * spacing,
              depth: tile
            });
          }
        }
        tile += 1;
      }
    }

    ctx.strokeStyle = 'rgba(132,202,255,.38)';
    ctx.lineWidth = 0.75;
    for (const coord of this.game.topology.allCoords()) {
      const from = this.project(coord);
      for (const axis of [0, 1]) {
        const next = [...coord];
        next[axis] += 1;
        if (next[axis] >= size) continue;
        const to = this.project(next);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }
    for (const coord of this.game.topology.allCoords()) this.drawZone(coord);
    for (const coord of this.game.topology.allCoords()) this.drawSite(coord);
    for (const [key, owner] of this.game.pieces.entries()) {
      this.drawPiece(parseCoordKey(key), owner, this.game.labels.get(key));
    }
    if (this.game.chainPath.length) this.drawPath(this.game.chainPath);
    if (this.selected) this.drawSelected(this.selected);
    for (const move of this.legal) this.drawLegal(move);
  }

  drawFlatBoundaryCue(coords, width, height) {
    if (this.usesEmbeddedView() || this.isPolarBoard() || this.dimension !== 2 || !coords?.length) return;
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    if (!['cylinder', 'torus', 'pbc', 'mobius', 'klein', 'klein_bottle', 'rp2', 'projective', 'projection'].includes(topology)) return;
    const points = coords.map((coord) => this.project(coord));
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const pad = Math.max(16, this.cellRadius() * 1.35);
    const left = Math.max(8, minX - pad);
    const right = Math.min(width - 8, maxX + pad);
    const top = Math.max(8, minY - pad);
    const bottom = Math.min(height - 8, maxY + pad);
    const midX = (left + right) / 2;
    const midY = (top + bottom) / 2;
    const ctx = this.ctx;
    const label = (text, x, y, rotate = 0) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotate);
      ctx.font = `${Math.max(11, Math.min(15, this.cellRadius() * 0.92))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(3, 7, 18, 0.82)';
      ctx.fillStyle = 'rgba(226, 246, 255, 0.92)';
      const translated = this.t(text, text);
      ctx.strokeText(translated, 0, 0);
      ctx.fillText(translated, 0, 0);
      ctx.restore();
    };
    const dashedLine = (x1, y1, x2, y2, color) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.6, this.cellRadius() * 0.1);
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    if (topology === 'cylinder') {
      dashedLine(left, top, left, bottom, 'rgba(34, 197, 94, 0.76)');
      dashedLine(right, top, right, bottom, 'rgba(34, 197, 94, 0.76)');
      label('x-wrap', left, midY, -Math.PI / 2);
      label('x-wrap', right, midY, Math.PI / 2);
      return;
    }
    if (topology === 'torus' || topology === 'pbc') {
      dashedLine(left, top, left, bottom, 'rgba(34, 197, 94, 0.72)');
      dashedLine(right, top, right, bottom, 'rgba(34, 197, 94, 0.72)');
      dashedLine(left, top, right, top, 'rgba(96, 165, 250, 0.72)');
      dashedLine(left, bottom, right, bottom, 'rgba(96, 165, 250, 0.72)');
      label('x-wrap', left, midY, -Math.PI / 2);
      label('x-wrap', right, midY, Math.PI / 2);
      label('y-wrap', midX, top);
      label('y-wrap', midX, bottom);
      return;
    }
    if (topology === 'mobius') {
      dashedLine(left, top, left, bottom, 'rgba(45, 212, 191, 0.78)');
      dashedLine(right, top, right, bottom, 'rgba(45, 212, 191, 0.78)');
      label('x-wrap + y-twist', left, midY, -Math.PI / 2);
      label('x-wrap + y-twist', right, midY, Math.PI / 2);
      return;
    }
    if (topology === 'klein' || topology === 'klein_bottle') {
      dashedLine(left, top, left, bottom, 'rgba(45, 212, 191, 0.78)');
      dashedLine(right, top, right, bottom, 'rgba(45, 212, 191, 0.78)');
      dashedLine(left, top, right, top, 'rgba(250, 204, 21, 0.7)');
      dashedLine(left, bottom, right, bottom, 'rgba(250, 204, 21, 0.7)');
      label('x-wrap + y-twist', left, midY, -Math.PI / 2);
      label('x-wrap + y-twist', right, midY, Math.PI / 2);
      label('y-wrap', midX, top);
      label('y-wrap', midX, bottom);
      return;
    }
    dashedLine(left, top, left, bottom, 'rgba(216, 180, 254, 0.76)');
    dashedLine(right, top, right, bottom, 'rgba(216, 180, 254, 0.76)');
    dashedLine(left, top, right, top, 'rgba(216, 180, 254, 0.76)');
    dashedLine(left, bottom, right, bottom, 'rgba(216, 180, 254, 0.76)');
    label('x/y antipodal', midX, top);
    label('x/y antipodal', midX, bottom);
  }

  drawEmbeddedSurfaceFill(coords) {
    if (!coords?.length) return;
    const topology = String(this.topologySelect?.value || this.config.topology || this.game?.topologyName || '').toLowerCase();
    if (this.drawGoStyleEmbeddedSurface(topology)) return;
    const projected = coords
      .map((coord) => this.project(coord))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (projected.length < 3) return;
    const hull = this.convexHull(projected);
    if (hull.length < 3) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    hull.forEach((point, index) => {
      if (index) ctx.lineTo(point.x, point.y);
      else ctx.moveTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgb(19, 40, 58)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(97, 174, 255, 0.38)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  convexHull(points) {
    const sorted = [...points]
      .sort((a, b) => (a.x - b.x) || (a.y - b.y))
      .filter((point, index, list) => index === 0 || Math.hypot(point.x - list[index - 1].x, point.y - list[index - 1].y) > 0.5);
    if (sorted.length <= 3) return sorted;
    const cross = (origin, a, b) => (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
    const lower = [];
    for (const point of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
      lower.push(point);
    }
    const upper = [];
    for (let index = sorted.length - 1; index >= 0; index -= 1) {
      const point = sorted[index];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
      upper.push(point);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
  }

  drawPolarFrame(width, height) {
    const ctx = this.ctx;
    const layout = this.polarLayout(width, height);
    const n = this.game.size;
    ctx.save();
    ctx.strokeStyle = 'rgba(95, 174, 255, 0.18)';
    ctx.lineWidth = 1.2;
    for (let ring = 1; ring < n; ring += 1) {
      ctx.beginPath();
      ctx.arc(layout.cx, layout.cy, ring * layout.step, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let sector = 0; sector < n; sector += 1) {
      const angle = -Math.PI / 2 + (sector / Math.max(1, n)) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(layout.cx, layout.cy);
      ctx.lineTo(layout.cx + Math.cos(angle) * layout.radius, layout.cy + Math.sin(angle) * layout.radius);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawZone(coord) {
    const key = coordKey(coord);
    const p = this.project(coord);
    const r = this.cellRadius() * 0.72;
    const ctx = this.ctx;
    const drawDisc = (fill, stroke, scale = 1, lineWidth = 1.15) => {
      const volumeBlock = this.dimension >= 3 && this.usesVolumeGraphView();
      ctx.beginPath();
      if (volumeBlock) {
        const side = r * scale * 2.25;
        ctx.rect(p.x - side / 2, p.y - side / 2, side, side);
      } else {
        ctx.arc(p.x, p.y, r * scale, 0, Math.PI * 2);
      }
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
    };
    if (this.isPolarBoard()) {
      if (this.game.zones.aHome.has(key)) drawDisc('rgba(84, 164, 255, 0.2)', null, 0.86);
      if (this.game.zones.aTarget.has(key)) drawDisc(null, 'rgba(84, 164, 255, 0.72)', 0.88);
      if (this.game.zones.bHome.has(key)) drawDisc('rgba(255, 190, 76, 0.2)', null, 0.86);
      if (this.game.zones.bTarget.has(key)) drawDisc(null, 'rgba(255, 190, 76, 0.72)', 0.76);
      if (this.game.zones.cHome?.has(key)) drawDisc('rgba(190, 96, 255, 0.2)', null, 0.86);
      if (this.game.zones.cTarget?.has(key)) drawDisc(null, 'rgba(190, 96, 255, 0.72)', 0.64);
      return;
    }
    if (this.game.zones.aHome.has(key)) drawDisc('rgba(84, 164, 255, 0.4)', 'rgba(132, 201, 255, 0.82)', 0.86);
    if (this.game.zones.aTarget.has(key)) drawDisc(null, 'rgba(84, 164, 255, 0.72)', 0.88);
    if (this.game.zones.bHome.has(key)) drawDisc('rgba(255, 190, 76, 0.4)', 'rgba(255, 216, 132, 0.82)', 0.86);
    if (this.game.zones.bTarget.has(key)) drawDisc(null, 'rgba(255, 190, 76, 0.72)', 0.76);
    if (this.game.zones.cHome?.has(key)) drawDisc('rgba(190, 96, 255, 0.4)', 'rgba(218, 157, 255, 0.82)', 0.86);
    if (this.game.zones.cTarget?.has(key)) drawDisc(null, 'rgba(190, 96, 255, 0.72)', 0.64);
  }

  drawSite(coord) {
    const p = this.project(coord);
    const ctx = this.ctx;
    const volumeGraph = this.usesVolumeGraphView();
    ctx.fillStyle = volumeGraph ? 'rgba(232, 244, 255, 0.96)' : 'rgba(210, 230, 255, 0.85)';
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(volumeGraph ? 2.6 : 2, this.cellRadius() * (volumeGraph ? 0.16 : 0.13)), 0, Math.PI * 2); ctx.fill();
  }

  drawPiece(coord, owner, label) {
    const p = this.project(coord);
    const r3VolumePiece = this.dimension === 3 && this.usesVolumeGraphView();
    const r = this.cellRadius() * (r3VolumePiece ? 0.88 : 0.72);
    const ctx = this.ctx;
    const focus = this.focusOwnPieces ? this.focusPlayer() : null;
    ctx.save();
    if (focus && owner !== focus) ctx.globalAlpha = 0.34;
    ctx.fillStyle = owner === 'A' ? '#54a4ff' : owner === 'C' ? '#be60ff' : '#ffbe4c';
    ctx.strokeStyle = '#f8fbff';
    ctx.lineWidth = this.usesVolumeGraphView() ? 2.6 : 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = owner === 'A' ? '#04111f' : owner === 'C' ? '#170620' : '#160d02';
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
    const c = this.game.playerCount >= 3 ? this.game.targetProgress('C') : null;
    if (this.statusEl) this.statusEl.textContent = this.game.winner
      ? this.resultText()
      : `${this.t('Turn', 'Turn')} ${this.game.turnNumber}: ${this.t('Player', 'Player')} ${this.game.currentPlayer}`;
    if (this.progressEl) {
      this.progressEl.innerHTML = `<span>${escapeHtml(this.t('Player', 'Player'))} A ${escapeHtml(this.t('target', 'target'))}: ${a.percentage}% (${a.filled}/${a.total})</span><span>${escapeHtml(this.t('Player', 'Player'))} B ${escapeHtml(this.t('target', 'target'))}: ${b.percentage}% (${b.filled}/${b.total})</span>${c ? `<span>${escapeHtml(this.t('Player', 'Player'))} C ${escapeHtml(this.t('target', 'target'))}: ${c.percentage}% (${c.filled}/${c.total})</span>` : ''}`;
    }
    if (this.endJumpButton) this.endJumpButton.disabled = !this.game.chainFrom;
    if (this.historyEl) this.historyEl.innerHTML = this.history.slice(-10).map((line) => `<li>${escapeHtml(line)}</li>`).join('');
    this.updateTimerDisplay();
    this.syncPieceFocusButton();
    this.renderMovePicker();
  }

  resultText() {
    if (!this.game?.winner) return '';
    const players = ['A', 'B', ...(this.game.playerCount >= 3 ? ['C'] : [])];
    const parts = players.map((player) => {
      const progress = this.game.targetProgress(player);
      return `${this.t('Player', 'Player')} ${player} ${progress.filled}/${progress.total} (${progress.percentage}%)`;
    });
    return `${this.t('Winner', 'Winner')}: ${this.game.winner} - ${parts.join(', ')}`;
  }

  showAnalysis() {
    const a = this.game.targetProgress('A');
    const b = this.game.targetProgress('B');
    const c = this.game.playerCount >= 3 ? this.game.targetProgress('C') : null;
    const best = this.chooseRobotMove(this.game.currentPlayer, false);
    if (this.analysisEl) {
      const suggested = best
        ? `${this.moveTypeLabel(best.type)} ${best.from.join(',')} -> ${best.to.join(',')}`
        : this.t('none', 'none');
      this.analysisEl.textContent = `${this.t('Current player', 'Current player')}: ${this.game.currentPlayer}\n${this.t('Legal moves', 'Legal moves')}: ${this.game.allLegalMoves().length}\n${this.t('Suggested move', 'Suggested move')}: ${suggested}\n${this.t('Player', 'Player')} A ${this.t('progress', 'progress')}: ${a.percentage}%\n${this.t('Player', 'Player')} B ${this.t('progress', 'progress')}: ${b.percentage}%${c ? `\n${this.t('Player', 'Player')} C ${this.t('progress', 'progress')}: ${c.percentage}%` : ''}\n${this.t('Score estimate for A', 'Score estimate for A')}: ${this.game.score('A')}`;
    }
  }

  setStatus(text) { if (this.statusEl && text) this.statusEl.textContent = text; }
  updateUI() { this.render(); }
  exportState() {
    return {
      ...this.game.serialize(),
      timerEnabled: this.timeLimit > 0,
      timeLimit: this.timeLimit,
      timeRemaining: { ...this.timeRemaining }
    };
  }
  exportNetworkState() { return this.exportState(); }
  importState(state) {
    const normalized = normalizeJumpNetworkState(state);
    if (normalized.topology && this.topologySelect && [...this.topologySelect.options].some((option) => option.value === normalized.topology)) {
      this.topologySelect.value = normalized.topology;
    }
    if (normalized.playerCount && this.playerCountSelect && [...this.playerCountSelect.options].some((option) => option.value === String(normalized.playerCount))) {
      this.playerCountSelect.value = String(normalized.playerCount);
    }
    if (normalized.lattice && this.latticeSelect) {
      const topology = normalized.topology || this.topologySelect?.value;
      this.latticeSelect.value = normalizeJumpLattice(normalized.lattice, this.effectiveDimensionForTopology(topology), topology);
    }
    this.syncLatticeAvailability(normalized.topology || this.topologySelect?.value);
    this.game.import(normalized);
    this.timeLimit = Number(normalized.timeLimit || 0) || 0;
    this.timeRemaining = {
      A: Number.isFinite(Number(normalized.timeRemaining?.A)) ? Number(normalized.timeRemaining.A) : this.timeLimit,
      B: Number.isFinite(Number(normalized.timeRemaining?.B)) ? Number(normalized.timeRemaining.B) : this.timeLimit
    };
    if (this.timerSelect && [...this.timerSelect.options].some((option) => Number(option.value) === this.timeLimit)) {
      this.timerSelect.value = String(this.timeLimit);
    }
    if (this.timeLimit > 0 && !this.game.winner) this.startTimer();
    else this.stopTimer();
    this.selected = null;
    this.legal = [];
    this.updateLabels();
    this.updateR3SliceFilterVisibility();
    this.render();
  }
  importNetworkState(state) { this.importState(state); }
  updateOnlineControls() {
    const online = this.modeSelect?.value === 'online';
    if (this.onlineControls) this.onlineControls.hidden = !online;
  }

  enterOnlineMode() {
    if (this.modeSelect) this.modeSelect.value = 'online';
    this.updateOnlineControls();
  }
  onlineGameKey() { return `jump-${this.dimension}d-${this.config.labMode || 'game'}`; }
  onlineMatchKey() {
    const t = this.topologySelect?.value || this.config.topology || 'plane';
    const lattice = normalizeJumpLattice(this.latticeSelect?.value || this.config.lattice || 'square', this.effectiveDimensionForTopology(t), t);
    const players = this.playerCountSelect?.value || this.config.playerCount || this.game?.playerCount || 2;
    const s = this.sizeSelect?.value || this.config.size;
    const timer = this.timerSelect?.value || this.config.timer || this.config.timeLimit || 0;
    const axis = this.axisSelect?.value || 'x';
    const target = this.targetModeSelect?.value || 'opponentHome';
    return `jump:${this.dimension}d:${t}:players${players}:lattice${lattice}:size${s}:timer${timer}:axis${axis}:target${target}:lab${this.config.labMode || 'none'}`;
  }
  updateOnlineRoomUI(roomId, color) { if (roomId) this.enterOnlineMode(); this.setOnlineColor(color); }
  setOnlineColor(color) { this.myColor = playerFromOnlineColor(color); }
}

function samePoint(a, b) { return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]); }
function escapeHtml(text) { return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function jumpIntroText() {
  if (jumpLanguage() === 'zh') {
    return '\u8df3\u68cb\u4f7f\u7528\u4e00\u6b65\u79fb\u52d5\u8207\u9023\u8df3\u3002\u6a19\u6e96\u8df3\u68cb\u662f\u5169\u4eba\u83f1\u5f62 / \u661f\u5f62\u68cb\u76e4\uff0c\u68cb\u5b50\u5f9e\u672c\u65b9\u4e09\u89d2\u71df\u5340\u51fa\u767c\uff0c\u76ee\u6a19\u662f\u5168\u90e8\u79fb\u5230\u5c0d\u9762\u71df\u5340\u3002\u4e0d\u540c\u6676\u683c\u90fd\u7528\u76f8\u540c\u76f4\u7dda\u8df3\u8e8d\u898f\u5247\uff1a\u6cbf\u4e00\u689d\u53ef\u898b\u9023\u7dda\u8df3\u904e\u76f8\u9130\u4e00\u500b\u68cb\u5b50\uff0c\u843d\u5728\u540c\u4e00\u76f4\u7dda\u7684\u4e0b\u4e00\u500b\u7a7a\u4f4d\u3002\u65b9\u683c\u8207\u4e09\u89d2\u683c\u53ea\u6539\u8b8a\u53ef\u898b\u7684\u76f4\u7dda\u65b9\u5411\uff1b\u74b0\u9762\u3001\u83ab\u6bd4\u70cf\u65af\u3001Klein\u3001RP2\u3001\u7403\u9762\u30013D \u8207 4D \u68cb\u76e4\u6703\u76f4\u63a5\u6a19\u51fa\u76ee\u6a19\u5340\u3002';
  }
  return 'Chinese Checkers uses step moves and chain jumps. Standard Jump is a two-player diamond/star board: pieces start in triangular camps and race into the opposite camp. Every lattice type uses the same straight jump rule: follow one visible lattice line, jump over one adjacent occupied site, and land on the next empty site on that same line. Square, Triangular, and Kagome lattices only change which visible line directions are available. Torus, Mobius, Klein, RP2, sphere, 3D, and 4D boards mark target zones explicitly because opposite changes with the space.';
}
function dimensionDescription(d) {
  if (jumpLanguage() === 'zh') {
    if (d === 2) return '\u4e2d\u570b\u8df3\u68cb\u5f0f\u7684\u6a19\u6e96\u5169\u4eba\u83f1\u5f62 / \u661f\u5f62\u68cb\u76e4\uff0c\u5f9e\u4e09\u89d2\u71df\u5340\u51fa\u767c\uff0c\u6cbf\u76f4\u7dda\u4e00\u6b65\u6216\u9023\u8df3\u5230\u5c0d\u9762\u71df\u5340\u3002';
    if (d === 3) return '在體積、層與包裹空間中進行跳棋連跳，3D 拓撲會改變距離、包圍與目標區。';
    if (d === 4) return '在投影的高維棋盤上競速，用連跳與目標區探索 4D 空間策略。';
    return '在平面與拓撲棋盤上一步移動和連跳，把棋子從本方區域移到對方目標區。';
  }
  if (d === 3) return 'Chinese Checkers-style jumping through volumes, layers, and wrapped spaces. Every jump crosses one adjacent piece along a visible straight lattice line.';
  if (d === 4) return 'Chinese Checkers-style jumping on projected higher-dimensional boards, with chain jumps and explicit target zones for 4D strategy.';
  if (d === 2) return 'Chinese Checkers-style Standard Jump starts on a two-player diamond/star board with triangular camps and straight-line step or chain jumps.';
  return 'Leap and chain across standard and topological boards. Move pieces from your home zone into the opponent’s target zone.';
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
