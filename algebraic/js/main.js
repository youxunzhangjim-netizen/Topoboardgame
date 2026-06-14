import { CliffordReversiGame } from '../../js/localgames/CliffordReversi.js';
import { AnyonJumpGame } from '../../js/localgames/AnyonJump.js';
import { VirasoroGoGame } from '../../js/localgames/VirasoroGo.js';
import {
    braidWordToText,
    nextRequiredUnbraidGenerator,
    requiredInverseBraidWordText
} from '../../js/anyon/BraidMemory.js';
import { anyonTypes } from '../../js/anyon/AnyonAlgebra.js';
import { fusionChannelDisplay } from '../../js/anyon/NonabelianFusionMemory.js';
import { Algebraic3DBoard, usesAlgebraic3DView } from './Algebraic3DBoard.js';

const els = {
    modeSelect: document.querySelector('#modeSelect'),
    modeControl: document.querySelector('#modeControl'),
    physicalProblemControl: document.querySelector('#physicalProblemControl'),
    physicalProblemSelect: document.querySelector('#physicalProblemSelect'),
    topologySelect: document.querySelector('#topologySelect'),
    latticeControl: document.querySelector('#latticeControl'),
    latticeSelect: document.querySelector('#latticeSelect'),
    widthInput: document.querySelector('#widthInput'),
    heightInput: document.querySelector('#heightInput'),
    geometryDetails: document.querySelector('#geometryDetails'),
    zSizeControl: document.querySelector('#zSizeControl'),
    zSizeInput: document.querySelector('#zSizeInput'),
    wSizeControl: document.querySelector('#wSizeControl'),
    wSizeInput: document.querySelector('#wSizeInput'),
    pauliSelect: document.querySelector('#pauliSelect'),
    transformSelect: document.querySelector('#transformSelect'),
    cliffordAlgebraControls: document.querySelector('#cliffordAlgebraControls'),
    anyonAlgebraControls: document.querySelector('#anyonAlgebraControls'),
    virasoroAlgebraControls: document.querySelector('#virasoroAlgebraControls'),
    pauliControl: document.querySelector('#pauliControl'),
    transformControl: document.querySelector('#transformControl'),
    phaseSignControl: document.querySelector('#phaseSignControl'),
    phaseSignSelect: document.querySelector('#phaseSignSelect'),
    braidMemoryControl: document.querySelector('#braidMemoryControl'),
    braidMemoryModeSelect: document.querySelector('#braidMemoryModeSelect'),
    anyonModelControl: document.querySelector('#anyonModelControl'),
    anyonSetupControl: document.querySelector('#anyonSetupControl'),
    anyonSetupSelect: document.querySelector('#anyonSetupSelect'),
    anyonExcitationTypeControl: document.querySelector('#anyonExcitationTypeControl'),
    anyonExcitationTypeSelect: document.querySelector('#anyonExcitationTypeSelect'),
    anyonDropLossControl: document.querySelector('#anyonDropLossControl'),
    anyonDropLossInput: document.querySelector('#anyonDropLossInput'),
    anyonModelSelect: document.querySelector('#anyonModelSelect'),
    anyonGradeControl: document.querySelector('#anyonGradeControl'),
    anyonGradeInput: document.querySelector('#anyonGradeInput'),
    entanglementRangeControl: document.querySelector('#entanglementRangeControl'),
    entanglementRangeSelect: document.querySelector('#entanglementRangeSelect'),
    entanglementDistanceControl: document.querySelector('#entanglementDistanceControl'),
    entanglementDistanceInput: document.querySelector('#entanglementDistanceInput'),
    braidCancellationControl: document.querySelector('#braidCancellationControl'),
    braidCancellationModeSelect: document.querySelector('#braidCancellationModeSelect'),
    virasoroLayerControl: document.querySelector('#virasoroLayerControl'),
    virasoroLayerSelect: document.querySelector('#virasoroLayerSelect'),
    virasoroActionControl: document.querySelector('#virasoroActionControl'),
    virasoroActionSelect: document.querySelector('#virasoroActionSelect'),
    virasoroDirectionControl: document.querySelector('#virasoroDirectionControl'),
    virasoroDirectionSelect: document.querySelector('#virasoroDirectionSelect'),
    virasoroMaxModeControl: document.querySelector('#virasoroMaxModeControl'),
    virasoroMaxModeSelect: document.querySelector('#virasoroMaxModeSelect'),
    centralChargeControl: document.querySelector('#centralChargeControl'),
    centralChargeInput: document.querySelector('#centralChargeInput'),
    unstableRuleControl: document.querySelector('#unstableRuleControl'),
    unstableRuleSelect: document.querySelector('#unstableRuleSelect'),
    braidedCaptureDetails: document.querySelector('#braidedCaptureDetails'),
    braidedPieceShieldSelect: document.querySelector('#braidedPieceShieldSelect'),
    captureRequiresUnbraidSelect: document.querySelector('#captureRequiresUnbraidSelect'),
    braidedPiecePenaltySelect: document.querySelector('#braidedPiecePenaltySelect'),
    noiseModeSelect: document.querySelector('#noiseModeSelect'),
    pauliNoiseControl: document.querySelector('#pauliNoiseControl'),
    pauliNoiseTypeSelect: document.querySelector('#pauliNoiseTypeSelect'),
    noiseRateInput: document.querySelector('#noiseRateInput'),
    measurementErrorInput: document.querySelector('#measurementErrorInput'),
    applyNoiseSelect: document.querySelector('#applyNoiseSelect'),
    noiseDetails: document.querySelector('#noiseDetails'),
    floquetModeSelect: document.querySelector('#floquetModeSelect'),
    dynamicsSection: document.querySelector('#dynamicsSection'),
    timeDetails: document.querySelector('#timeDetails'),
    timeUpdateSelect: document.querySelector('#timeUpdateSelect'),
    timePeriodInput: document.querySelector('#timePeriodInput'),
    noiseSeedInput: document.querySelector('#noiseSeedInput'),
    anyonFlipControl: document.querySelector('#anyonFlipControl'),
    anyonFlipSelect: document.querySelector('#anyonFlipSelect'),
    newGameButton: document.querySelector('#newGameButton'),
    passButton: document.querySelector('#passButton'),
    countButton: document.querySelector('#countButton'),
    measureButton: document.querySelector('#measureButton'),
    unbraidHintButton: document.querySelector('#unbraidHintButton'),
    manualNoiseButton: document.querySelector('#manualNoiseButton'),
    manualTimeButton: document.querySelector('#manualTimeButton'),
    dropAnyonButton: document.querySelector('#dropAnyonButton'),
    rulesIntroButton: document.querySelector('#rulesIntroButton'),
    rulesIntroPanel: document.querySelector('#rulesIntroPanel'),
    exportButton: document.querySelector('#exportButton'),
    layerPanel: document.querySelector('#layerPanel'),
    zLayerInput: document.querySelector('#zLayerInput'),
    wLayerInput: document.querySelector('#wLayerInput'),
    layerLabel: document.querySelector('#layerLabel'),
    currentPlayer: document.querySelector('#currentPlayer'),
    modeTitle: document.querySelector('#modeTitle'),
    topologyHint: document.querySelector('#topologyHint'),
    board: document.querySelector('#board'),
    algebraic3dBoard: document.querySelector('#algebraic3dBoard'),
    reset3dCameraButton: document.querySelector('#reset3dCameraButton'),
    blackCount: document.querySelector('#blackCount'),
    whiteCount: document.querySelector('#whiteCount'),
    blackBraid: document.querySelector('#blackBraid'),
    whiteBraid: document.querySelector('#whiteBraid'),
    blackBraidCard: document.querySelector('#blackBraid')?.closest('div'),
    whiteBraidCard: document.querySelector('#whiteBraid')?.closest('div'),
    timeStatus: document.querySelector('#timeStatus'),
    phaseTimeline: document.querySelector('#phaseTimeline'),
    statusText: document.querySelector('#statusText'),
    historyList: document.querySelector('#historyList'),
    braidEventList: document.querySelector('#braidEventList'),
    braidEventSection: document.querySelector('#braidEventList')?.closest('section'),
    stochasticList: document.querySelector('#stochasticList'),
    legend: document.querySelector('#legend'),
    cliffordRules: document.querySelector('[data-rules-mode="clifford"]'),
    anyonRules: document.querySelector('[data-rules-mode="anyon"]'),
    virasoroRules: document.querySelector('[data-rules-mode="virasoro"]'),
    exportText: document.querySelector('#exportText')
};

const MODE_LABELS = {
    clifford_reversi: 'Clifford Reversi',
    anyon_jump: 'Anyon Jump Chess',
    virasoro_go: 'Virasoro Go'
};
const ANYON_SYMBOLS = {
    psi: '\u03c8',
    sigma: '\u03c3',
    tau: '\u03c4'
};
const SUBSCRIPT_DIGITS = {
    0: '\u2080',
    1: '\u2081',
    2: '\u2082',
    3: '\u2083',
    4: '\u2084',
    5: '\u2085',
    6: '\u2086',
    7: '\u2087',
    8: '\u2088',
    9: '\u2089'
};
const params = new URLSearchParams(window.location.search);
const INITIAL_MODE = normalizeMode(params.get('mode') || params.get('game') || params.get('algebraicMode'));
const INITIAL_TOPOLOGY = params.get('topology') || params.get('board') || '';
const URL_PHYSICAL_PROBLEM_ID = params.get('physicalProblem') || params.get('problemId') || '';

let game = null;
let selectedToken = '';
let hoverCoord = null;
let lastCancellation = null;
let lastWrongUnbraid = null;
let legalReversiCache = { signature: '', keys: [] };
const algebraic3d = new Algebraic3DBoard({
    canvas: els.algebraic3dBoard,
    resetButton: els.reset3dCameraButton,
    onHover(coord) {
        hoverCoord = coord;
        if (game && usesAlgebraic3DView(game.topology.name)) {
            renderAlgebraic3DBoard();
            updateStatus();
        }
    },
    onSelect(coord) {
        handleCellClick(coord);
    }
});
window.algebraic3dBoard = algebraic3d;

if (INITIAL_MODE) {
    els.modeSelect.value = INITIAL_MODE;
    document.body.dataset.initialAlgebraicMode = INITIAL_MODE;
}
if (INITIAL_TOPOLOGY && [...els.topologySelect.options].some((option) => option.value === INITIAL_TOPOLOGY)) {
    els.topologySelect.value = INITIAL_TOPOLOGY;
}
if (URL_PHYSICAL_PROBLEM_ID && els.physicalProblemSelect) {
    els.physicalProblemSelect.value = URL_PHYSICAL_PROBLEM_ID;
}

function normalizeMode(value) {
    if (value === 'anyon' || value === 'anyon_jump_chess') return 'anyon_jump';
    if (value === 'clifford' || value === 'reversi') return 'clifford_reversi';
    if (value === 'go' || value === 'virasoro' || value === 'virasoro_go_game') return 'virasoro_go';
    return Object.hasOwn(MODE_LABELS, value) ? value : '';
}

function selectedMode() {
    return normalizeMode(els.modeSelect.value) || 'clifford_reversi';
}

function selectedPhysicalProblemId() {
    return String(els.physicalProblemSelect?.value || '').trim();
}

function setAllowedSelectValues(select, allowedValues, fallback = 'off') {
    const allowed = new Set(allowedValues);
    for (const option of select.options) {
        const isAllowed = allowed.has(option.value);
        option.hidden = !isAllowed;
        option.disabled = !isAllowed;
    }
    if (!allowed.has(select.value)) {
        select.value = allowed.has(fallback) ? fallback : allowedValues[0];
    }
}

function selectedAnyonGrade() {
    return Math.max(2, Math.min(64, Math.floor(Number(els.anyonGradeInput?.value) || 5)));
}

function selectedAnyonEngineModel() {
    return els.anyonModelSelect.value === 'zn_phase' ? 'zn' : els.anyonModelSelect.value;
}

function excitationCatalog() {
    const model = selectedAnyonEngineModel();
    const grade = selectedAnyonGrade();
    const types = anyonTypes(model, grade).filter((type) => type !== '1');
    const costs = Object.fromEntries(types.map((type) => {
        if (model === 'toric_code' || model === 'ising') return [type, type === 'psi' ? 4 : 2];
        if (model === 'fibonacci') return [type, 3];
        return [type, 2];
    }));
    return { model, grade, types, costs };
}

function syncAnyonExcitationTypeOptions() {
    const { types } = excitationCatalog();
    const previous = els.anyonExcitationTypeSelect.value;
    els.anyonExcitationTypeSelect.replaceChildren(...types.map((type) => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = anyonDisplay(type);
        return option;
    }));
    els.anyonExcitationTypeSelect.value = types.includes(previous) ? previous : types[0];
}

function syncModeControls() {
    const mode = selectedMode();
    const isAnyon = mode === 'anyon_jump';
    const isVirasoroGo = mode === 'virasoro_go';
    const isClifford = mode === 'clifford_reversi';
    if (els.modeSelect.value !== mode) els.modeSelect.value = mode;
    if (els.modeControl) els.modeControl.hidden = false;
    if (els.cliffordAlgebraControls) els.cliffordAlgebraControls.hidden = !isClifford;
    if (els.anyonAlgebraControls) els.anyonAlgebraControls.hidden = !isAnyon;
    if (els.virasoroAlgebraControls) els.virasoroAlgebraControls.hidden = !isVirasoroGo;
    setAllowedSelectValues(
        els.latticeSelect,
        isVirasoroGo ? ['square', 'honeycomb', 'triangular'] : ['square', 'honeycomb'],
        'square'
    );
    if (els.physicalProblemSelect) {
        setAllowedSelectValues(
            els.physicalProblemSelect,
            isAnyon
                ? ['', 'toric_code_memory_unbraid']
                : isClifford ? ['', 'ising_domain_wall_topology'] : [''],
            ''
        );
    }

    if (isVirasoroGo) {
        els.noiseModeSelect.value = 'off';
        els.floquetModeSelect.value = 'off';
    } else {
        setAllowedSelectValues(
            els.noiseModeSelect,
            isAnyon
                ? ['off', 'anyon_pair_creation', 'measurement_error', 'field_noise', 'custom']
                : ['off', 'pauli', 'measurement_error', 'field_noise', 'custom']
        );
        setAllowedSelectValues(
            els.floquetModeSelect,
            isAnyon
                ? ['off', 'basic', 'anyon', 'virasoro']
                : ['off', 'basic', 'clifford', 'virasoro']
        );
    }
    if (!isAnyon) els.anyonFlipSelect.value = 'off';

    els.pauliControl.hidden = !isClifford;
    els.transformControl.hidden = !isClifford;
    els.phaseSignControl.hidden = !isClifford;
    els.braidMemoryControl.hidden = !isAnyon;
    els.anyonModelControl.hidden = !isAnyon;
    if (isAnyon && els.anyonModelSelect.value === 'zn_phase'
        && els.braidMemoryModeSelect.value === 'nonabelian_fusion_channel') {
        els.braidMemoryModeSelect.value = 'word_exact';
    }
    if (isAnyon) syncAnyonExcitationTypeOptions();
    if (els.anyonGradeControl) els.anyonGradeControl.hidden = !isAnyon || els.anyonModelSelect.value !== 'zn_phase';
    const nonabelianMemory = isAnyon
        && els.braidMemoryModeSelect.value === 'nonabelian_fusion_channel';
    if (els.entanglementRangeControl) els.entanglementRangeControl.hidden = !nonabelianMemory;
    if (els.entanglementDistanceControl) {
        els.entanglementDistanceControl.hidden = !nonabelianMemory
            || els.entanglementRangeSelect.value !== 'finite';
    }
    if (els.anyonSetupControl) els.anyonSetupControl.hidden = !isAnyon;
    const excitationMode = isAnyon && els.anyonSetupSelect?.value === 'excitation';
    if (els.anyonExcitationTypeControl) els.anyonExcitationTypeControl.hidden = !excitationMode;
    if (els.anyonDropLossControl) els.anyonDropLossControl.hidden = !excitationMode;
    if (els.dropAnyonButton) els.dropAnyonButton.hidden = !excitationMode;
    els.braidedCaptureDetails.hidden = !isAnyon;
    els.braidCancellationControl.hidden = !isAnyon
        || !['word_exact', 'nonabelian_fusion_channel'].includes(els.braidMemoryModeSelect.value);
    els.virasoroLayerControl.hidden = !isVirasoroGo;
    els.virasoroActionControl.hidden = !isVirasoroGo;
    els.virasoroDirectionControl.hidden = !isVirasoroGo
        || !['L-1', 'L-2'].includes(els.virasoroActionSelect.value);
    els.virasoroMaxModeControl.hidden = !isVirasoroGo;
    els.centralChargeControl.hidden = !isVirasoroGo;
    els.unstableRuleControl.hidden = !isVirasoroGo;
    els.passButton.hidden = isAnyon;
    els.countButton.hidden = !isVirasoroGo;
    els.measureButton.hidden = isVirasoroGo;
    els.unbraidHintButton.hidden = !isAnyon;
    els.dynamicsSection.hidden = isVirasoroGo;
    setAllowedSelectValues(
        els.virasoroActionSelect,
        Number(els.virasoroMaxModeSelect.value) >= 2
            ? ['play', 'L-1', 'L0', 'L1', 'L-2', 'L2']
            : ['play', 'L-1', 'L0', 'L1'],
        'play'
    );
    setAllowedSelectValues(
        els.virasoroDirectionSelect,
        els.topologySelect.value === 'flat_4d_grid'
            ? ['1,0', '-1,0', '0,1', '0,-1', '0,0,1,0', '0,0,-1,0', '0,0,0,1', '0,0,0,-1']
            : els.topologySelect.value === 'r3'
                ? ['1,0', '-1,0', '0,1', '0,-1', '0,0,1,0', '0,0,-1,0']
            : els.latticeSelect.value === 'triangular'
                ? ['1,0', '-1,0', '0,1', '0,-1', '1,-1', '-1,1']
                : ['1,0', '-1,0', '0,1', '0,-1'],
        '1,0'
    );
    if (els.blackBraidCard) els.blackBraidCard.hidden = !isAnyon;
    if (els.whiteBraidCard) els.whiteBraidCard.hidden = !isAnyon;
    if (els.braidEventSection) els.braidEventSection.hidden = !isAnyon;
    if (els.cliffordRules) els.cliffordRules.hidden = !isClifford;
    if (els.anyonRules) els.anyonRules.hidden = !isAnyon;
    if (els.virasoroRules) els.virasoroRules.hidden = !isVirasoroGo;
    if (els.rulesIntroButton) {
        els.rulesIntroButton.textContent = isVirasoroGo
            ? 'Virasoro Rules'
            : isAnyon ? 'Anyon Rules' : 'Clifford Rules';
    }
    document.title = `${MODE_LABELS[mode]} - Algebraic Board Games`;
    return mode;
}

function topologyConfig() {
    const topology = els.topologySelect.value;
    const selectedLattice = els.latticeSelect?.value || 'square';
    const lattice = topology === 'flat_4d_grid' || topology === 'r3'
        ? 'square'
        : selectedMode() === 'clifford_reversi' && selectedLattice === 'honeycomb'
            ? 'hex_cells'
            : selectedLattice;
    if (els.latticeControl) els.latticeControl.hidden = topology === 'flat_4d_grid' || topology === 'r3';
    return {
        topology,
        lattice,
        width: Number(els.widthInput.value),
        height: Number(els.heightInput.value),
        nx: Number(els.widthInput.value),
        ny: Number(els.heightInput.value),
        nz: Number(els.zSizeInput.value),
        depth: Number(els.zSizeInput.value),
        nw: Number(els.wSizeInput.value)
    };
}

function probabilityConfig() {
    const noiseMode = els.noiseModeSelect.value;
    return {
        enabled: noiseMode !== 'off',
        seed: els.noiseSeedInput.value || 'topology-seed',
        noiseMode,
        noiseRate: Number(els.noiseRateInput.value),
        measurementErrorRate: Number(els.measurementErrorInput.value),
        applyNoise: els.applyNoiseSelect.value,
        pauliNoiseType: els.pauliNoiseTypeSelect.value,
        enableAnyonLabelFlips: els.anyonFlipSelect.value === 'on'
    };
}

function centerCoord(offsetX = 0, offsetY = 0) {
    const config = topologyConfig();
    const x = Math.max(0, Math.min(config.width - 1, Math.floor(config.width / 2) + offsetX));
    const y = Math.max(0, Math.min(config.height - 1, Math.floor(config.height / 2) + offsetY));
    if (config.topology === 'flat_4d_grid') {
        return [
            x,
            y,
            Math.floor(Number(els.zSizeInput.value) / 2),
            Math.floor(Number(els.wSizeInput.value) / 2)
        ];
    }
    if (config.topology === 'r3') {
        return [x, y, Math.floor(Number(els.zSizeInput.value) / 2)];
    }
    return [x, y];
}

function timeConfig() {
    const floquetMode = els.floquetModeSelect.value;
    const updateMode = els.timeUpdateSelect.value;
    const hDefect = centerCoord(0, 0);
    const sDefect = centerCoord(1, 0);
    return {
        floquetMode,
        updateMode,
        period: Number(els.timePeriodInput.value) || 4,
        markedVertices: [hDefect],
        hDefectVertices: [hDefect],
        sDefectVertices: [sDefect],
        seamAutomorphismVertices: [hDefect],
        rechargeRate: 0.1,
        decayRate: 0.92,
        diffusionRate: 0.15,
        virasoro_CFT_N2: floquetMode === 'virasoro'
    };
}

function phaseSignsEnabled() {
    return els.phaseSignSelect.value === 'on';
}

function virasoroConfig() {
    return {
        enabled: els.virasoroLayerSelect.value === 'on',
        centralCharge: Number(els.centralChargeInput.value) || 1,
        maxMode: Number(els.virasoroMaxModeSelect.value) || 1,
        removeUnstable: els.unstableRuleSelect.value === 'remove'
    };
}

function selectedDirection() {
    const parts = String(els.virasoroDirectionSelect.value || '1,0').split(',').map(Number);
    if (els.topologySelect.value === 'flat_4d_grid') {
        return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] || 0];
    }
    if (els.topologySelect.value === 'r3') {
        return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    }
    return [parts[0] || 0, parts[1] || 0];
}

function anyonConfig() {
    if (els.braidMemoryModeSelect.value === 'nonabelian_fusion_channel'
        && els.anyonModelSelect.value === 'toric_code') {
        els.anyonModelSelect.value = 'ising';
    }
    if (els.anyonModelSelect.value === 'zn_phase'
        && els.braidMemoryModeSelect.value === 'nonabelian_fusion_channel') {
        els.braidMemoryModeSelect.value = 'word_exact';
    }
    const selectedAnyonModel = els.anyonModelSelect.value;
    const useGeneralPhase = selectedAnyonModel === 'zn_phase';
    const catalog = excitationCatalog();
    return {
        anyonModel: catalog.model,
        phaseModel: useGeneralPhase ? 'zn_phase' : 'off',
        generalAnyonGrade: catalog.grade,
        setupMode: els.anyonSetupSelect?.value === 'excitation' ? 'excitation' : 'standard',
        excitationType: els.anyonExcitationTypeSelect?.value || catalog.types[0],
        excitationEnergy: { black: 12, white: 12 },
        anyonGaps: { '1': 0, ...catalog.costs },
        excitationCosts: { '1': 0, ...catalog.costs },
        dropLossRate: Math.max(0, Math.min(1, Number(els.anyonDropLossInput?.value) || 0)),
        braidMemoryMode: els.braidMemoryModeSelect.value,
        braidCancellationMode: els.braidCancellationModeSelect.value,
        requireReverseInverseOrder: true,
        braidedPieceShield: els.braidedPieceShieldSelect.value === 'on',
        captureRequiresUnbraid: els.captureRequiresUnbraidSelect.value === 'on',
        braidedPiecePenalty: els.braidedPiecePenaltySelect.value === 'on',
        entanglementRangeMode: els.entanglementRangeSelect.value === 'finite' ? 'finite' : 'infinite',
        entanglementDistance: Math.max(
            1,
            Math.min(256, Math.floor(Number(els.entanglementDistanceInput.value) || 4))
        )
    };
}

function physicalProblemConfig(mode) {
    const topology = topologyConfig();
    const physicalProblemId = selectedPhysicalProblemId();
    if (mode === 'anyon_jump' && physicalProblemId === 'toric_code_memory_unbraid') {
        return {
            id: physicalProblemId,
            topology: params.get('problemTopology') || topology.topology,
            boardSize: Number(params.get('boardSize') || params.get('size') || topology.width),
            numPairsE: Number(params.get('numPairsE') || 2),
            numPairsM: Number(params.get('numPairsM') || 2),
            createPairsLocally: params.get('createPairsLocally') !== 'false',
            enableTwistSeam: params.get('enableTwistSeam') !== 'false'
        };
    }
    if (mode === 'clifford_reversi' && physicalProblemId === 'ising_domain_wall_topology') {
        return {
            id: physicalProblemId,
            topology: params.get('problemTopology') || topology.topology,
            boardSize: Number(params.get('boardSize') || params.get('size') || topology.width),
            J: Number(params.get('J') || 1),
            temperature: Number(params.get('temperature') || 0),
            enableMetropolis: params.get('enableMetropolis') === 'true',
            enableFloquetJ: params.get('enableFloquetJ') === 'true',
            initialState: params.get('initialState') || 'infer_current',
            stableWallTurns: Number(params.get('stableWallTurns') || params.get('K') || 5),
            seed: params.get('seed') || 'ising-domain-wall'
        };
    }
    return null;
}

function createGame() {
    const mode = syncModeControls();
    selectedToken = '';
    hoverCoord = null;
    lastCancellation = null;
    lastWrongUnbraid = null;
    legalReversiCache = { signature: '', keys: [] };
    const config = anyonConfig();
    const physicalProblem = physicalProblemConfig(mode);
    if (physicalProblem?.id === 'toric_code_memory_unbraid') {
        config.anyonModel = 'toric_code';
        config.braidEffect = 'add_braid_token';
    }
    const options = {
        topology: topologyConfig(),
        defaultFlipTransform: els.transformSelect.value,
        trackPhaseSigns: phaseSignsEnabled(),
        config,
        virasoro: virasoroConfig(),
        probability: probabilityConfig(),
        time: timeConfig()
    };
    if (physicalProblem) options.physicalProblem = physicalProblem;
    if (mode === 'anyon_jump') game = new AnyonJumpGame(options);
    else if (mode === 'virasoro_go') game = new VirasoroGoGame(options);
    else game = new CliffordReversiGame(options);
    normalizeLayerControls();
    render();
}

function normalizeLayerControls() {
    const is4D = game?.topology?.dimensions === 4;
    els.layerPanel.hidden = !is4D;
    const zMax = Math.max(0, (game?.topology?.sizes?.[2] || 1) - 1);
    const wMax = Math.max(0, (game?.topology?.sizes?.[3] || 1) - 1);
    els.zLayerInput.max = String(zMax);
    els.wLayerInput.max = String(wMax);
    els.zLayerInput.value = String(Math.min(Number(els.zLayerInput.value), zMax));
    els.wLayerInput.value = String(Math.min(Number(els.wLayerInput.value), wMax));
    els.layerLabel.textContent = `(z,w) = (${els.zLayerInput.value},${els.wLayerInput.value})`;
}

function coordForCell(x, y) {
    if (game.topology.dimensions === 4) {
        return [x, y, Number(els.zLayerInput.value), Number(els.wLayerInput.value)];
    }
    return [x, y];
}

function visibleCells() {
    const [width, height] = game.topology.sizes;
    const cells = [];
    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) cells.push(coordForCell(x, y));
    }
    return cells;
}

function coordKey(coord) {
    return coord.join(',');
}

function isSameCoord(a, b) {
    return a && b && coordKey(a) === coordKey(b);
}

function specialLatticePoint(coord, width, height, lattice) {
    const displayY = height - 1 - coord[1];
    if (lattice === 'hex_cells') {
        const rawWidth = Math.max(1, 0.75 * (width - 1) + 1);
        const rawHeight = Math.max(1, height + 0.5);
        return {
            x: 5 + 90 * (0.75 * coord[0] + 0.5) / rawWidth,
            y: 5 + 90 * (displayY + 0.5 + (coord[0] % 2) * 0.5) / rawHeight
        };
    }
    if (lattice === 'honeycomb') {
        const rawWidth = Math.max(1, (width - 1) * Math.sqrt(3) / 2);
        const rawHeight = Math.max(1, height - 0.5);
        return {
            x: 5 + 90 * (coord[0] * Math.sqrt(3) / 2) / rawWidth,
            y: 5 + 90 * (displayY + (coord[0] % 2) * 0.5) / rawHeight
        };
    }
    const rawWidth = Math.max(1, 1.5 * (width - 1) + 2);
    const rawHeight = Math.max(1, Math.sqrt(3) * (1.5 * (height - 1) + 1));
    return {
        x: 5 + 90 * (1 + 1.5 * coord[0]) / rawWidth,
        y: 5 + 90 * (Math.sqrt(3) * (0.5 + displayY + coord[0] / 2)) / rawHeight
    };
}

function appendHoneycombEdges(width, height) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('lattice-edge-layer');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    for (let x = 0; x <= width - 3; x += 2) {
        for (let y = 0; y <= height - 2; y++) {
            const faceCoords = [
                [x, y],
                [x + 1, y],
                [x + 2, y],
                [x + 2, y + 1],
                [x + 1, y + 1],
                [x, y + 1]
            ];
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.classList.add('honeycomb-face');
            if ((x / 2 + y) % 2 === 1) polygon.classList.add('alternate');
            polygon.setAttribute('points', faceCoords.map((coord) => {
                const point = specialLatticePoint(coord, width, height, 'honeycomb');
                return `${point.x},${point.y}`;
            }).join(' '));
            svg.append(polygon);
        }
    }
    const drawn = new Set();
    for (const coord of game.topology.vertices()) {
        const fromKey = coordKey(coord);
        const from = specialLatticePoint(coord, width, height, 'honeycomb');
        for (const neighbor of game.topology.neighbors(coord)) {
            if (Math.abs(neighbor[0] - coord[0]) > 1 || Math.abs(neighbor[1] - coord[1]) > 1) continue;
            const edgeKey = [fromKey, coordKey(neighbor)].sort().join('|');
            if (drawn.has(edgeKey)) continue;
            drawn.add(edgeKey);
            const to = specialLatticePoint(neighbor, width, height, 'honeycomb');
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', String(from.x));
            line.setAttribute('y1', String(from.y));
            line.setAttribute('x2', String(to.x));
            line.setAttribute('y2', String(to.y));
            svg.append(line);
        }
    }
    els.board.append(svg);
}

function applySpecialLatticeCellLayout(cell, coord, width, height, lattice) {
    const point = specialLatticePoint(coord, width, height, lattice);
    const cellSize = lattice === 'hex_cells'
        ? Math.min(12, 82 / Math.max(width * 0.78, height))
        : lattice === 'honeycomb'
        ? Math.min(10, 76 / Math.max(width, height))
        : Math.min(13, 94 / Math.max(width, height));
    cell.style.left = `${point.x - cellSize / 2}%`;
    cell.style.top = `${point.y - cellSize / 2}%`;
    cell.style.width = `${cellSize}%`;
    cell.style.height = `${cellSize}%`;
}

function currentReversiPreview() {
    if (!hoverCoord || game.mode !== 'clifford_reversi') return null;
    return game.previewMove(hoverCoord, game.currentPlayer, els.transformSelect.value);
}

function currentVirasoroPreview() {
    if (!hoverCoord || game.mode !== 'virasoro_go') return null;
    const action = els.virasoroActionSelect.value;
    if (action === 'play') return null;
    return game.previewVirasoroAction({
        action,
        coord: hoverCoord,
        direction: selectedDirection(),
        player: game.currentPlayer
    });
}

function render() {
    if (!game) return;
    normalizeLayerControls();
    const mode = syncModeControls();
    const isAnyon = mode === 'anyon_jump';
    els.modeTitle.textContent = MODE_LABELS[mode];
    els.currentPlayer.textContent = capitalize(game.currentPlayer);
    els.topologyHint.textContent = game.topology.seamSummary();
    if (els.topologySelect.value !== game.topology.name) {
        const matchingOption = [...els.topologySelect.options].find((option) => option.value === game.topology.name);
        if (matchingOption) els.topologySelect.value = game.topology.name;
    }
    const is4D = els.topologySelect.value === 'flat_4d_grid';
    const isR3 = els.topologySelect.value === 'r3';
    const noiseEnabled = els.noiseModeSelect.value !== 'off';
    const timeEnabled = els.floquetModeSelect.value !== 'off';
    els.geometryDetails.hidden = !is4D && !isR3;
    els.zSizeControl.hidden = !is4D && !isR3;
    els.wSizeControl.hidden = !is4D;
    els.noiseDetails.hidden = !noiseEnabled;
    els.timeDetails.hidden = !timeEnabled;
    els.manualNoiseButton.hidden = !noiseEnabled;
    els.manualTimeButton.hidden = !timeEnabled;
    els.pauliNoiseControl.hidden = isAnyon || !['pauli', 'custom'].includes(els.noiseModeSelect.value);
    els.anyonFlipControl.hidden = !isAnyon || !['anyon_pair_creation', 'custom'].includes(els.noiseModeSelect.value);

    renderBoard();
    renderStats();
    renderLegend();
    renderTimePanel();
    renderHistory();
    renderBraidEventLog();
    renderStochasticLog();
    renderExport();
}

function renderBoard() {
    if (usesAlgebraic3DView(game.topology.name)) {
        els.board.hidden = true;
        algebraic3d.setVisible(true);
        renderAlgebraic3DBoard();
        if (!algebraic3d.pointCoords?.length) {
            algebraic3d.setVisible(false);
            els.board.hidden = false;
            renderFlatBoard();
        }
        updateStatus();
        return;
    }
    algebraic3d.setVisible(false);
    els.board.hidden = false;
    renderFlatBoard();
}

function renderFlatBoard() {
    const [width, height] = game.topology.sizes;
    const honeycombNodes = game.topology.lattice === 'honeycomb';
    const hexCells = game.topology.lattice === 'hex_cells';
    els.board.style.gridTemplateColumns = `repeat(${width}, minmax(0, 1fr))`;
    els.board.classList.toggle('lattice-square', game.topology.lattice === 'square');
    els.board.classList.toggle('lattice-triangular', game.topology.lattice === 'triangular');
    els.board.classList.toggle('lattice-honeycomb-nodes', honeycombNodes);
    els.board.classList.toggle('lattice-hex-cells', hexCells);
    els.board.innerHTML = '';
    if (honeycombNodes) appendHoneycombEdges(width, height);

    const preview = currentReversiPreview();
    const previewFlips = new Set((preview?.flips || []).map((flip) => flip.key));
    const legalReversi = game.mode === 'clifford_reversi'
        ? new Set(game.legalMoves(game.currentPlayer, els.transformSelect.value).map((move) => coordKey(move.coord)))
        : new Set();
    const legalAnyon = game.mode === 'anyon_jump' && selectedToken
        ? game.legalActionsForToken(selectedToken)
        : [];
    const legalAnyonTargets = new Set(legalAnyon.map((action) => coordKey(action.to)));
    const jumpPath = new Set(legalAnyon.flatMap((action) => action.path.map(coordKey)));
    const braidTrail = braidTrailCells();
    const cancelTargetId = cancelTargetForSelectedToken();
    const warningTargets = wrongUnbraidTargetIds();
    const virasoroPreview = currentVirasoroPreview();
    const virasoroAffected = new Set((virasoroPreview?.affected || []).map((item) => item.key));
    const legalGoTargets = game.mode === 'virasoro_go'
        ? new Set(els.virasoroActionSelect.value === 'play'
            ? game.legalMoves().map(coordKey)
            : (hoverCoord && virasoroPreview?.ok ? [coordKey(hoverCoord)] : []))
        : new Set();

    for (const coord of visibleCells()) {
        const key = coordKey(coord);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell';
        cell.dataset.coord = JSON.stringify(coord);
        cell.dataset.key = key;
        if (honeycombNodes || hexCells) {
            applySpecialLatticeCellLayout(cell, coord, width, height, game.topology.lattice);
        }
        if (legalReversi.has(key) || legalAnyonTargets.has(key) || legalGoTargets.has(key)) cell.classList.add('legal');
        const token = game.mode === 'anyon_jump' ? game.tokenAt(coord) : null;
        const goStone = game.mode === 'virasoro_go' ? game.getStone(coord) : null;
        if (braidTrail.has(key)) cell.classList.add('braid-trail');
        if (token) {
            const status = braidStatusForToken(token);
            cell.classList.add(`braid-status-${status}`);
            if (token.id === cancelTargetId) cell.classList.add('cancel-latest', 'legal-unbraid');
            if (warningTargets.has(token.id)) cell.classList.add('wrong-unbraid');
            if (lastCancellation && [lastCancellation.movingTokenId, lastCancellation.targetId].includes(token.id)) {
                cell.classList.add('cancellation-flash');
            }
            if (lastWrongUnbraid && [lastWrongUnbraid.movingTokenId, lastWrongUnbraid.targetId].includes(token.id)) {
                cell.classList.add('wrong-unbraid-flash');
            }
        }
        if (previewFlips.has(key)) cell.classList.add('preview-flip');
        if (jumpPath.has(key)) cell.classList.add('jump-path');
        if (virasoroAffected.has(key)) cell.classList.add('stress-preview');
        if (game.mode === 'anyon_jump' && game.isFusionSite(coord)) cell.classList.add('fusion-site');
        if (game.mode === 'virasoro_go') {
            const stress = game.stressAt(coord);
            const groupInfo = goStone ? game.groupInfoAt(coord) : null;
            if (stress.stress > 0) {
                cell.classList.add('stressed');
                cell.style.setProperty('--stress-level', String(stress.stress));
            }
            if (groupInfo?.unstable) cell.classList.add('unstable-group');
        }
        const vertexState = game.probability?.getVertexState(coord);
        const timeState = game.time?.getVertexState(coord);
        if (vertexState?.noiseLevel > 0 || vertexState?.stress > 0) cell.classList.add('noisy');
        if (timeState && (Math.abs(timeState.stress) > 0.001 || Math.abs(timeState.potential) > 0.001 || Math.abs(timeState.charge) > 0.001)) {
            cell.classList.add('fielded');
        }
        if (vertexState?.measured) cell.classList.add('measured');
        cell.title = cellTooltip(coord, { timeState, goStone });
        cell.addEventListener('mouseenter', () => {
            hoverCoord = coord;
            updateBoardHighlights();
            updateStatus();
        });
        cell.addEventListener('mouseleave', () => {
            hoverCoord = null;
            updateBoardHighlights();
            updateStatus();
        });
        cell.addEventListener('click', () => handleCellClick(coord));

        if (game.mode === 'clifford_reversi') renderReversiStone(cell, coord);
        else if (game.mode === 'anyon_jump') renderAnyonToken(cell, coord);
        else renderGoStone(cell, coord);

        if (game.mode === 'virasoro_go') renderStress(cell, coord);

        if (token?.id === cancelTargetId) {
            const badge = document.createElement('span');
            badge.className = 'unbraid-badge';
            badge.textContent = 'UNBRAID';
            cell.append(badge);
        } else if (token && warningTargets.has(token.id)) {
            const badge = document.createElement('span');
            badge.className = 'unbraid-badge wrong';
            badge.textContent = 'APPEND';
            cell.append(badge);
        }

        const coordNode = document.createElement('span');
        coordNode.className = 'coord';
        coordNode.textContent = game.topology.dimensions === 4
            ? `${coord[0]},${coord[1]}`
            : `${coord[0]},${coord[1]}`;
        cell.append(coordNode);
        els.board.append(cell);
    }
    updateStatus();
}

function algebraic3DViewState() {
    const preview = currentReversiPreview();
    let legalReversi = [];
    if (game.mode === 'clifford_reversi') {
        const signature = [
            game.topology.name,
            game.topology.sizes.join('x'),
            game.moveNumber,
            game.currentPlayer,
            els.transformSelect.value
        ].join(':');
        if (legalReversiCache.signature !== signature) {
            legalReversiCache = {
                signature,
                keys: game.legalMoves(game.currentPlayer, els.transformSelect.value)
                    .map((move) => coordKey(move.coord))
            };
        }
        legalReversi = legalReversiCache.keys;
    }
    const legalAnyon = game.mode === 'anyon_jump' && selectedToken
        ? game.legalActionsForToken(selectedToken)
        : [];
    const virasoroPreview = currentVirasoroPreview();
    const legalGo = game.mode === 'virasoro_go'
        ? (els.virasoroActionSelect.value === 'play'
            ? game.legalMoves().map(coordKey)
            : (hoverCoord && virasoroPreview?.ok ? [coordKey(hoverCoord)] : []))
        : [];
    return {
        selectedToken,
        legalKeys: new Set([
            ...legalReversi,
            ...legalAnyon.map((action) => coordKey(action.to)),
            ...legalGo
        ]),
        previewKeys: new Set((preview?.flips || []).map((flip) => flip.key)),
        affectedKeys: new Set((virasoroPreview?.affected || []).map((item) => item.key)),
        trailKeys: braidTrailCells(),
        paths: game.mode === 'anyon_jump'
            ? [
                ...legalAnyon.map((action) => action.path),
                ...(game.braidEventLog || []).map((event) => event.path)
            ]
            : []
    };
}

function renderAlgebraic3DBoard() {
    if (!game || !usesAlgebraic3DView(game.topology.name)) return;
    algebraic3d.renderGame(game, algebraic3DViewState());
}

function updateBoardHighlights() {
    if (!game) return;
    if (usesAlgebraic3DView(game.topology.name)) {
        renderAlgebraic3DBoard();
        return;
    }
    const preview = currentReversiPreview();
    const previewFlips = new Set((preview?.flips || []).map((flip) => flip.key));
    const legalReversi = game.mode === 'clifford_reversi'
        ? new Set(game.legalMoves(game.currentPlayer, els.transformSelect.value).map((move) => coordKey(move.coord)))
        : new Set();
    const legalAnyon = game.mode === 'anyon_jump' && selectedToken
        ? game.legalActionsForToken(selectedToken)
        : [];
    const legalAnyonTargets = new Set(legalAnyon.map((action) => coordKey(action.to)));
    const jumpPath = new Set(legalAnyon.flatMap((action) => action.path.map(coordKey)));
    const braidTrail = braidTrailCells();
    const cancelTargetId = cancelTargetForSelectedToken();
    const warningTargets = wrongUnbraidTargetIds();
    const virasoroPreview = currentVirasoroPreview();
    const virasoroAffected = new Set((virasoroPreview?.affected || []).map((item) => item.key));
    const legalGoTargets = game.mode === 'virasoro_go'
        ? new Set(els.virasoroActionSelect.value === 'play'
            ? game.legalMoves().map(coordKey)
            : (hoverCoord && virasoroPreview?.ok ? [coordKey(hoverCoord)] : []))
        : new Set();

    els.board.querySelectorAll('.cell[data-key]').forEach((cell) => {
        const key = cell.dataset.key;
        const coord = JSON.parse(cell.dataset.coord);
        const token = game.mode === 'anyon_jump' ? game.tokenAt(coord) : null;
        const goStone = game.mode === 'virasoro_go' ? game.getStone(coord) : null;
        cell.classList.toggle('legal', legalReversi.has(key) || legalAnyonTargets.has(key) || legalGoTargets.has(key));
        cell.classList.toggle('braid-trail', braidTrail.has(key));
        for (const status of ['trivial', 'braided', 'partially_unbraided']) {
            cell.classList.toggle(`braid-status-${status}`, Boolean(token && braidStatusForToken(token) === status));
        }
        cell.classList.toggle('cancel-latest', Boolean(token && token.id === cancelTargetId));
        cell.classList.toggle('legal-unbraid', Boolean(token && token.id === cancelTargetId));
        cell.classList.toggle('wrong-unbraid', Boolean(token && warningTargets.has(token.id)));
        cell.classList.toggle('cancellation-flash', Boolean(token && lastCancellation && [lastCancellation.movingTokenId, lastCancellation.targetId].includes(token.id)));
        cell.classList.toggle('wrong-unbraid-flash', Boolean(token && lastWrongUnbraid && [lastWrongUnbraid.movingTokenId, lastWrongUnbraid.targetId].includes(token.id)));
        cell.classList.toggle('preview-flip', previewFlips.has(key));
        cell.classList.toggle('jump-path', jumpPath.has(key));
        cell.classList.toggle('stress-preview', virasoroAffected.has(key));
        cell.classList.toggle('fusion-site', game.mode === 'anyon_jump' && game.isFusionSite(coord));
        const stress = game.mode === 'virasoro_go' ? game.stressAt(coord) : null;
        const groupInfo = game.mode === 'virasoro_go' && goStone ? game.groupInfoAt(coord) : null;
        cell.classList.toggle('stressed', Boolean(stress?.stress > 0));
        cell.classList.toggle('unstable-group', Boolean(groupInfo?.unstable));
        const vertexState = game.probability?.getVertexState(coord);
        const timeState = game.time?.getVertexState(coord);
        cell.classList.toggle('noisy', Boolean(vertexState?.noiseLevel > 0 || vertexState?.stress > 0));
        cell.classList.toggle('fielded', Boolean(timeState && (
            Math.abs(timeState.stress) > 0.001
            || Math.abs(timeState.potential) > 0.001
            || Math.abs(timeState.charge) > 0.001
        )));
        cell.classList.toggle('measured', Boolean(vertexState?.measured));
    });
}

function cancelTargetForSelectedToken() {
    if (game?.mode !== 'anyon_jump' || !selectedToken) return '';
    const token = game.tokens.get(selectedToken);
    if (!token) return '';
    if (game.config?.braidMemoryMode === 'abelian_parity') {
        return token.braidParity === 1 ? (token.braidedWith[token.braidedWith.length - 1] || '') : '';
    }
    return nextRequiredUnbraidGenerator(token.braidWord)?.targetId || '';
}

function wrongUnbraidTargetIds() {
    if (game?.mode !== 'anyon_jump' || !selectedToken) return new Set();
    const selected = game.tokens.get(selectedToken);
    if (!selected || (!selected.isBraided && Number(selected.braidParity || 0) === 0)) return new Set();
    const cancelTarget = cancelTargetForSelectedToken();
    return new Set([...game.tokens.values()]
        .filter((token) => token.id !== selectedToken && token.id !== cancelTarget)
        .map((token) => token.id));
}

function braidTrailCells() {
    if (game?.mode !== 'anyon_jump') return new Set();
    const cells = new Set();
    for (const event of game.braidEventLog || []) {
        for (const coord of event.path || []) cells.add(coordKey(coord));
    }
    for (const event of game.history || []) {
        for (const braid of event.braidEvents || []) {
            for (const coord of braid.path || []) cells.add(coordKey(coord));
        }
    }
    return cells;
}

function braidStatusForToken(token) {
    return game?.braidStatusForToken?.(token) || ((token?.isBraided || Number(token?.braidParity || 0) === 1) ? 'braided' : 'trivial');
}

function braidStatusLabel(token) {
    return braidStatusForToken(token).replaceAll('_', ' ');
}

function renderReversiStone(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone ${stone.color}`;
    if (stone.revealed === false || stone.pauliLabel === 'unknown') node.classList.add('hidden');
    node.textContent = stone.revealed === false || stone.pauliLabel === 'unknown' ? '?' : pauliDisplay(stone);
    node.title = `${stone.color} ${pauliDisplay(stone)}; ${game.time?.tooltipForEntity(stone) || ''}`;
    cell.append(node);
}

function renderGoStone(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone go-stone ${stone.color}`;
    const groupInfo = game.groupInfoAt(coord);
    if (groupInfo?.unstable) node.classList.add('unstable');
    const cft = document.createElement('span');
    cft.className = 'cft-badge';
    cft.textContent = groupInfo
        ? `h=${formatNumber(groupInfo.h)}`
        : 'h=0';
    node.append(cft);
    if (groupInfo?.unstable) {
        const pressure = document.createElement('span');
        pressure.className = 'cft-pressure';
        pressure.textContent = `P=${formatNumber(groupInfo.unstable.enemyStressPressure)}`;
        node.append(pressure);
    }
    node.title = groupInfo
        ? `${stone.color} group h=${formatNumber(groupInfo.h)}; liberties=${groupInfo.liberties.size}; threshold h+c=${formatNumber((groupInfo.h || 0) + (game.virasoro?.config?.centralCharge || 0))}${groupInfo.unstable ? `; unstable pressure=${formatNumber(groupInfo.unstable.enemyStressPressure)}` : ''}`
        : stone.color;
    cell.append(node);
}

function renderStress(cell, coord) {
    const state = game.stressAt(coord);
    if (!state || state.stress <= 0) return;
    const node = document.createElement('span');
    node.className = 'stress-value';
    node.textContent = Number(state.stress.toFixed(1)).toString();
    node.title = `T=${state.stress.toFixed(2)}${state.owner ? ` controlled by ${state.owner}` : ''}`;
    cell.append(node);
}

function renderAnyonToken(cell, coord) {
    const token = game.tokenAt(coord);
    if (!token) return;
    const node = document.createElement('span');
    node.className = `anyon ${token.owner}`;
    node.classList.add(`status-${braidStatusForToken(token)}`);
    if (token.id === selectedToken) node.classList.add('selected');
    if ((token.braidParity || 0) === 1 || token.isBraided) node.classList.add('braided');
    if (token.revealed === false) node.classList.add('hidden');
    const phase = anyonPhaseDisplay(token);
    if (phase.active) node.classList.add('phase-active', phase.sign > 0 ? 'phase-positive' : 'phase-negative');
    const label = document.createElement('span');
    label.className = 'anyon-label';
    label.textContent = token.revealed === false ? '?' : anyonDisplay(token.anyonType);
    node.append(label);
    if (phase.active) {
        const phaseNode = document.createElement('span');
        phaseNode.className = 'phase-pancake';
        phaseNode.textContent = phase.text;
        phaseNode.title = `General Z_${phase.denominator} braid phase ${phase.text}`;
        node.append(phaseNode);
    }
    const parity = token.braidParity || 0;
    const inverseInfo = parity === 1 || token.isBraided ? '; inverse loop available' : '';
    const word = braidWordToText(token.braidWord);
    const required = requiredInverseBraidWordText(token.braidWord);
    const channel = fusionChannelDisplay(token);
    const channelInfo = channel ? `; fusion channel ${channel}` : '';
    const measured = token.measurementHistory?.length ? `; measurements ${token.measurementHistory.length}` : '';
    const phaseInfo = phase.enabled ? `; Z_${phase.denominator} phase ${phase.active ? phase.text : '0'}` : '';
    const braidInfo = ` status ${braidStatusLabel(token)}; parity ${parity}; braid word ${word}; required inverse ${required}${phaseInfo}${channelInfo}${measured}${inverseInfo}`;
    const energyInfo = game.config?.setupMode === 'excitation' ? `; gap ${game.excitationGap?.(token.anyonType) ?? 0}` : '';
    node.title = `${token.id} ${token.owner} ${anyonDisplay(token.anyonType)} (${token.anyonType})${energyInfo};${braidInfo}; ${game.time?.tooltipForEntity(token) || ''}`;
    cell.append(node);
}

function cellTooltip(coord, { timeState = null, goStone = null } = {}) {
    if (game.mode === 'virasoro_go') {
        const stress = game.stressAt(coord);
        const groupInfo = goStone ? game.groupInfoAt(coord) : null;
        const stressText = `T=${stress.stress.toFixed(2)}${stress.owner ? ` owner=${stress.owner}` : ''}`;
        if (groupInfo) {
            const unstable = groupInfo.unstable
                ? ` unstable: pressure ${groupInfo.unstable.enemyStressPressure.toFixed(2)} > h+c ${groupInfo.unstable.threshold.toFixed(2)}`
                : '';
            return `${game.topology.displayCoord(coord)} ${goStone.color} group h=${groupInfo.h}, liberties=${groupInfo.liberties.size}; ${stressText}${unstable}`;
        }
        return `${game.topology.displayCoord(coord)} empty; ${stressText}`;
    }
    return timeState
        ? `${game.topology.displayCoord(coord)} stress=${timeState.stress.toFixed(2)} potential=${timeState.potential.toFixed(2)} charge=${timeState.charge.toFixed(2)}`
        : game.topology.displayCoord(coord);
}

function handleCellClick(coord) {
    if (game.mode === 'clifford_reversi') {
        const result = game.place(coord, {
            pauliLabel: els.pauliSelect.value,
            transform: els.transformSelect.value
        });
        els.statusText.textContent = result.ok
            ? `Flipped ${result.event.flipped.length} stone${result.event.flipped.length === 1 ? '' : 's'}${result.event.noise?.length ? `; ${result.event.noise.length} noise rolls logged` : ''}${result.event.time?.applied ? `; Floquet phase ${result.event.time.phase} applied` : ''}.`
            : result.error;
        if (result.ok) hoverCoord = null;
        render();
        return;
    }

    if (game.mode === 'virasoro_go') {
        const action = els.virasoroActionSelect.value;
        const result = action === 'play' || els.virasoroLayerSelect.value === 'off'
            ? game.tryPlay(coord, game.currentPlayer)
            : game.applyVirasoroAction({
                action,
                coord,
                direction: selectedDirection(),
                player: game.currentPlayer
            });
        if (result.ok) {
            hoverCoord = null;
            if (action === 'play' || els.virasoroLayerSelect.value === 'off') {
                els.statusText.textContent = `Placed Go stone; captured ${result.captured || 0}.`;
            } else {
                const unstableCount = result.instability?.unstableGroups?.length || 0;
                els.statusText.textContent = `${action} applied to ${result.event.affected.length} stress vertex${result.event.affected.length === 1 ? '' : 'es'}${unstableCount ? `; ${unstableCount} group${unstableCount === 1 ? '' : 's'} unstable` : ''}.`;
            }
        } else {
            els.statusText.textContent = result.error;
        }
        render();
        return;
    }

    const token = game.tokenAt(coord);
    if (token && selectedToken && token.id === selectedToken) {
        selectedToken = '';
        hoverCoord = null;
        els.statusText.textContent = 'Selection cleared.';
        render();
        return;
    }
    if (token && selectedToken && token.id !== selectedToken) {
        const selected = game.tokens.get(selectedToken);
        const path = selected ? [selected.coord, coord] : [];
        const direction = selected ? coord.map((value, axis) => value - selected.coord[axis]) : [];
        const expected = selected ? nextRequiredUnbraidGenerator(selected.braidWord) : null;
        const exactInverse = expected?.targetId === token.id
            ? { sign: expected.sign, index: expected.index }
            : {};
        const result = game.attemptUnbraid(selectedToken, token.id, { path, direction, ...exactInverse });
        if (result.ok) {
            if (result.event.unbraid.successfulPartialUnbraid || result.event.unbraid.fullyUnbraided) {
                lastCancellation = { movingTokenId: selectedToken, targetId: token.id, tick: Date.now() };
                lastWrongUnbraid = null;
            } else {
                lastWrongUnbraid = { movingTokenId: selectedToken, targetId: token.id, tick: Date.now() };
                lastCancellation = null;
            }
            selectedToken = '';
            hoverCoord = null;
            els.statusText.textContent = result.event.unbraid.fullyUnbraided
                ? 'Full inverse sequence completed; token is unbraided.'
                : result.event.unbraid.successfulPartialUnbraid
                    ? 'Correct inverse generator applied; braid word shortened.'
                    : 'Wrong unbraid path/order; braid word grew.';
        } else {
            els.statusText.textContent = result.error;
        }
        render();
        return;
    }

    if (token && token.owner === game.currentPlayer) {
        selectedToken = token.id;
        els.statusText.textContent = `Selected ${token.id} (${token.anyonType}).`;
        render();
        return;
    }
    if (!token && game.config?.setupMode === 'excitation') {
        const result = game.exciteAnyon(coord, els.anyonExcitationTypeSelect.value, game.currentPlayer);
        els.statusText.textContent = result.ok
            ? `${capitalize(result.event.player)} excited ${anyonDisplay(result.event.anyonType)} at (${result.event.coord.join(',')}); energy ${formatNumber(result.event.energyAfter)}.`
            : result.error;
        if (result.ok) {
            selectedToken = '';
            hoverCoord = null;
        }
        render();
        return;
    }
    if (!selectedToken) {
        els.statusText.textContent = 'Select one of your anyons first.';
        return;
    }
    const result = game.move(selectedToken, coord);
    if (result.ok) {
        if (result.event.braid?.unbraid?.successfulPartialUnbraid || result.event.braid?.fullyUnbraided) {
            lastCancellation = {
                movingTokenId: selectedToken,
                targetId: result.event.braid.targetId,
                tick: Date.now()
            };
            lastWrongUnbraid = null;
        }
        selectedToken = '';
        hoverCoord = null;
        if (result.event.fusion?.blocked) {
            els.statusText.textContent = `Capture blocked: ${result.event.fusion.reason}.`;
        } else if (result.event.entanglement?.length) {
            els.statusText.textContent = `${capitalize(result.event.kind)} completed; ${result.event.entanglement.length} fusion channel decohered beyond the finite entanglement distance.`;
        } else if (result.event.braid?.unbraid?.successfulPartialUnbraid) {
            els.statusText.textContent = 'Inverse jump shortened the braid word.';
        } else if (result.event.braid?.effect?.effect === 'add_braid_token') {
            els.statusText.textContent = 'Jump recorded a nontrivial braid token.';
        } else {
            els.statusText.textContent = `${capitalize(result.event.kind)} completed${result.event.noise?.length ? `; ${result.event.noise.length} noise rolls logged` : ''}${result.event.time?.applied ? `; Floquet phase ${result.event.time.phase} applied` : ''}.`;
        }
    } else {
        els.statusText.textContent = result.error;
    }
    render();
}

function measureTarget() {
    if (game.mode === 'virasoro_go') {
        els.statusText.textContent = 'Virasoro Go uses stress actions instead of measurement actions.';
        return;
    }
    if (game.mode === 'clifford_reversi') {
        const target = hoverCoord || [...game.board.keys()][0]?.split(',').map(Number);
        const result = game.measurePauliParity(target, game.currentPlayer);
        els.statusText.textContent = result.ok
            ? `Measured Pauli parity: ${result.measurement.reported}${result.measurement.error ? ' (error)' : ''}.`
            : result.error;
        render();
        return;
    }
    const tokenIds = selectedToken
        ? [selectedToken]
        : [...game.tokens.values()].filter((token) => token.owner === game.currentPlayer).slice(0, 1).map((token) => token.id);
    const result = game.measureAnyonCharge(tokenIds, game.currentPlayer);
    els.statusText.textContent = result.ok
        ? `Measured total charge: ${result.measurement.reported}${result.measurement.error ? ' (error)' : ''}.`
        : result.error;
    render();
}

function applyNoiseNow() {
    if (typeof game.applyNoiseCycle !== 'function') {
        els.statusText.textContent = 'Noise is not available for this mode.';
        return;
    }
    const events = game.applyNoiseCycle({ player: game.currentPlayer, trigger: 'manual' });
    els.statusText.textContent = events.length
        ? `Noise tick logged ${events.length} random event${events.length === 1 ? '' : 's'}.`
        : 'Noise is off or unavailable for this mode.';
    render();
}

function applyTimeNow() {
    const result = game.time?.applyTimeEvolution({
        trigger: 'manual',
        player: game.currentPlayer,
        board: game.board,
        tokens: game.tokens,
        game
    });
    els.statusText.textContent = result?.applied
        ? `Time step applied phase ${result.phase}; tick is now ${result.after.tick}.`
        : 'Time layer is off.';
    if (result?.applied && game.mode === 'clifford_reversi') game.recordPosition('manual-time');
    render();
}

function dropSelectedAnyon() {
    if (game.mode !== 'anyon_jump' || game.config?.setupMode !== 'excitation') {
        els.statusText.textContent = 'Drop recovery is only available in Anyon excitation mode.';
        return;
    }
    if (!selectedToken) {
        els.statusText.textContent = 'Select one of your anyons to drop.';
        return;
    }
    const result = game.dropAnyon(selectedToken, game.currentPlayer);
    els.statusText.textContent = result.ok
        ? `${capitalize(result.event.player)} dropped ${result.event.tokenId}; recovered ${formatNumber(result.event.recovered)} energy${result.event.entanglement?.length ? `; ${result.event.entanglement.length} channel decohered` : ''}.`
        : result.error;
    if (result.ok) selectedToken = '';
    render();
}

function rulesIntroIsOpen() {
    return els.rulesIntroPanel?.getAttribute('aria-hidden') !== 'true';
}

function setRulesIntroOpen(open) {
    syncModeControls();
    els.rulesIntroPanel.classList.toggle('is-open', open);
    els.rulesIntroPanel.setAttribute('aria-hidden', String(!open));
    els.rulesIntroButton.setAttribute('aria-expanded', String(open));
    if (open) {
        window.requestAnimationFrame(() => {
            els.rulesIntroPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    }
}

function toggleRulesIntro() {
    setRulesIntroOpen(!rulesIntroIsOpen());
}

function renderStats() {
    if (game.mode === 'clifford_reversi') {
        const counts = game.counts();
        els.blackCount.textContent = counts.black;
        els.whiteCount.textContent = counts.white;
        els.blackBraid.textContent = '0';
        els.whiteBraid.textContent = '0';
        return;
    }
    if (game.mode === 'virasoro_go') {
        const counts = game.counts();
        els.blackCount.textContent = `${counts.black} (${game.captures.black})`;
        els.whiteCount.textContent = `${counts.white} (${game.captures.white})`;
        els.blackBraid.textContent = '0';
        els.whiteBraid.textContent = '0';
        return;
    }
    const tokens = [...game.tokens.values()];
    const energyText = game.config?.setupMode === 'excitation'
        ? (owner) => ` E=${formatNumber(game.energy?.[owner] || 0)}`
        : () => '';
    els.blackCount.textContent = `${tokens.filter((token) => token.owner === 'black').length}${energyText('black')}`;
    els.whiteCount.textContent = `${tokens.filter((token) => token.owner === 'white').length}${energyText('white')}`;
    els.blackBraid.textContent = game.braidTokens.black;
    els.whiteBraid.textContent = game.braidTokens.white;
}

function renderTimePanel() {
    if (!game?.time) {
        els.timeStatus.textContent = 'Time layer off.';
        els.phaseTimeline.innerHTML = '';
        return;
    }
    const state = game.time.gameTime;
    const config = game.time.config;
    els.timeStatus.textContent = config.floquetMode === 'off' || config.updateMode === 'off'
        ? 'Time layer off.'
        : `tick ${state.tick}, round ${state.round}, phase ${state.phase}/${state.period - 1}, ${config.floquetMode}, ${config.updateMode}`;
    els.phaseTimeline.innerHTML = game.time.phaseTimeline()
        .map((item) => `<span class="${item.active ? 'active' : ''}" title="${item.label}">${item.phase}</span>`)
        .join('');
}

function updateStatus() {
    if (!game) return;
    if (game.mode === 'clifford_reversi') {
        const preview = currentReversiPreview();
        if (preview?.legal) {
            const phase = phaseSignsEnabled() ? ' with phase signs' : '';
            els.statusText.textContent = `${capitalize(game.currentPlayer)} can flip ${preview.flips.length} with ${els.transformSelect.value}${phase}.`;
        } else if (!hoverCoord) {
            const moves = game.legalMoves(game.currentPlayer, els.transformSelect.value).length;
            els.statusText.textContent = `${capitalize(game.currentPlayer)} has ${moves} legal Clifford Reversi move${moves === 1 ? '' : 's'}.`;
        }
        return;
    }
    if (game.mode === 'virasoro_go') {
        const action = els.virasoroActionSelect.value;
        if (hoverCoord && action !== 'play') {
            const preview = currentVirasoroPreview();
            els.statusText.textContent = preview?.ok
                ? `${action} will affect ${preview.affected.length} stress vertex${preview.affected.length === 1 ? '' : 'es'}.`
                : (preview?.error || `Choose a valid target for ${action}.`);
        } else if (action === 'play') {
            els.statusText.textContent = `${capitalize(game.currentPlayer)} to play Go. Captures: black ${game.captures.black}, white ${game.captures.white}.`;
        } else {
            els.statusText.textContent = `${capitalize(game.currentPlayer)} may use ${action}. Select a ${['L1', 'L2'].includes(action) ? 'target empty vertex' : 'friendly group'}.`;
        }
        if (game.scoringPending) {
            els.statusText.textContent = 'Two passes made. Each player can press Count to agree and finish scoring.';
        }
        return;
    }
    if (selectedToken) {
        const actions = game.legalActionsForToken(selectedToken);
        const token = game.tokens.get(selectedToken);
        const inverse = token && ((token.braidParity || 0) === 1 || token.isBraided)
            ? ' Click a braid target to try the inverse loop.'
            : '';
        const next = token ? nextRequiredUnbraidGenerator(token.braidWord) : null;
        const cancel = next ? ` Next cancel: ${braidWordToText([next])} around ${next.targetId}.` : '';
        const channel = token ? fusionChannelDisplay(token) : '';
        const channelText = channel ? `, channel ${channel}` : '';
        const hoveredToken = hoverCoord ? game.tokenAt(hoverCoord) : null;
        const warning = hoveredToken && hoveredToken.id !== selectedToken && wrongUnbraidTargetIds().has(hoveredToken.id)
            ? ` Warning: attempting this unbraid appends ${braidWordToText([game.braidGeneratorFor(token, hoveredToken.id, { path: [token.coord, hoveredToken.coord] })])} instead of cancelling.`
            : '';
        els.statusText.textContent = `Selected ${selectedToken}: ${braidStatusLabel(token)}, parity ${token?.braidParity || 0}, word ${braidWordToText(token?.braidWord || [])}${channelText}, ${actions.length} local move/jump option${actions.length === 1 ? '' : 's'}.${cancel}${inverse}${warning}`;
    } else {
        els.statusText.textContent = game.config?.setupMode === 'excitation'
            ? `${capitalize(game.currentPlayer)} energy ${formatNumber(game.energy?.[game.currentPlayer] || 0)}. Click an empty vertex to excite ${anyonDisplay(els.anyonExcitationTypeSelect.value)}, or select an anyon to braid/drop.`
            : 'Select an anyon, then hop to a neighbor or jump over an occupied vertex.';
    }
}

function renderLegend() {
    const items = game.mode === 'clifford_reversi'
        ? [
            phaseSignsEnabled() ? '+/- phase signs shown' : 'X,Y,Z Pauli labels',
            '? hidden until measured',
            'Gold outline: flip preview',
            'H/S transforms on flips',
            'Twisted seams apply H',
            'Virasoro mode evolves graph stress T(v)'
        ]
        : game.mode === 'virasoro_go'
            ? [
                'Go stones use graph liberties',
                'T(v) badge: Virasoro stress',
                'Gold outline: affected stress preview',
                'Red outline: unstable group warning',
                `c=${Number(els.centralChargeInput.value) || 1}, max N=${els.virasoroMaxModeSelect.value}`
            ]
            : [
            els.anyonModelSelect.value === 'zn_phase'
                ? `General Z_${Math.max(2, Math.min(64, Math.floor(Number(els.anyonGradeInput?.value) || 5)))} phase: braid +1/n, inverse -1/n`
                : els.anyonModelSelect.value === 'ising'
                ? 'Ising anyons: 1, \u03c3, \u03c8'
                : els.anyonModelSelect.value === 'fibonacci'
                    ? 'Fibonacci anyons: 1, \u03c4'
                    : 'e,m,\u03c8 toric anyons',
            '? hidden until measured',
            'Blue path: jump line',
            'Braided marker: nontrivial memory',
            'Green UNBRAID badge: next inverse loop',
            game.config?.setupMode === 'excitation'
                ? `Excitation mode: ${excitationCatalog().types.map(anyonDisplay).join(', ')} use energy; drop/fusion recovers energy with loss`
                : 'Standard mode: fixed initial anyon set',
            game.config?.braidMemoryMode === 'nonabelian_fusion_channel'
                ? `Entanglement range: ${game.config.entanglementRangeMode === 'finite'
                    ? `${game.config.entanglementDistance} graph steps`
                    : 'infinite'}`
                : null
        ];
    els.legend.innerHTML = items.filter(Boolean).map((item) => `<span>${item}</span>`).join('');
}

function renderHistory() {
    els.historyList.innerHTML = '';
    const events = game.history.slice(0, 18);
    for (const event of events) {
        const item = document.createElement('li');
        if (event.type === 'measurement') {
            item.textContent = `measurement ${event.measurement.type}: ${event.measurement.reported}${event.measurement.error ? ' with error' : ''}.`;
        } else if (event.type === 'noise') {
            item.textContent = `${event.player} manual noise tick: ${event.noiseEvents} random event${event.noiseEvents === 1 ? '' : 's'}.`;
        } else if (event.type === 'pass') {
            item.textContent = `#${event.number} ${event.player || event.color} passed.`;
        } else if (game.mode === 'clifford_reversi') {
            const time = event.time?.applied ? `; t${event.time.after.tick} phase ${event.time.phase}` : '';
            item.textContent = `#${event.number} ${event.player} ${event.pauliLabel}@${event.coord.join(',')} flipped ${event.flipped.length}; winding (${event.winding.x},${event.winding.y})${time}.`;
        } else if (game.mode === 'virasoro_go') {
            if (event.type === 'play') {
                item.textContent = `#${event.number} ${event.color} played ${event.coord.join(',')}; captured ${event.captured}.`;
            } else if (event.type === 'virasoro') {
                const unstable = event.instability?.unstableGroups?.length || 0;
                item.textContent = `#${event.number} ${event.color} ${event.action} at ${event.coord?.join(',') || 'none'} affected ${event.affected?.length || 0}${unstable ? `; unstable ${unstable}` : ''}.`;
            } else if (event.type === 'score') {
                item.textContent = `score: black ${event.score.black}, white ${event.score.white}; winner ${event.winner}.`;
            }
        } else {
            if (event.kind === 'attempt_unbraid') {
                const result = event.unbraid.fullyUnbraided
                    ? 'fully unbraided'
                    : event.unbraid.successfulPartialUnbraid
                        ? 'partial inverse'
                        : 'wrong order';
                const channel = event.unbraid.fusionChannelUpdate?.currentChannel
                    || event.unbraid.fusionChannelUpdate?.afterChannel
                    || event.unbraid.fusionChannel
                    || '';
                item.textContent = `#${event.number} ${event.player} attempt_unbraid ${event.tokenId} around ${event.targetId}: ${result}, parity ${event.unbraid.braidParity}, word ${event.unbraid.afterLength}${channel ? `, channel ${channel}` : ''}.`;
            } else if (event.kind === 'excite') {
                item.textContent = `#${event.number} ${event.player} excited ${anyonDisplay(event.anyonType)} at ${event.coord.join(',')}; cost ${event.cost}.`;
            } else if (event.kind === 'drop') {
                item.textContent = `#${event.number} ${event.player} dropped ${event.tokenId}; recovered ${formatNumber(event.recovered)}.`;
            } else {
                const braid = event.braid?.phase === -1 ? ' braid -1' : '';
                const anyonPhase = event.braid?.anyonPhase?.after?.text
                    ? ` phase ${event.braid.anyonPhase.after.text}`
                    : '';
                const unbraid = event.braid?.unbraid?.successfulPartialUnbraid ? ' unbraid' : '';
                const channel = event.braid?.fusionChannelUpdate?.afterChannel
                    ? ` channel ${event.braid.fusionChannelUpdate.afterChannel}`
                    : '';
                const fusion = event.fusion?.blocked
                    ? ` blocked ${event.fusion.reason}`
                    : event.fusion?.resolved
                        ? ` fusion ${event.fusion.input.join('x')}=${event.fusion.resolved}`
                        : '';
                const time = event.time?.applied ? ` t${event.time.after.tick} phase ${event.time.phase}` : '';
                item.textContent = `#${event.number} ${event.player} ${event.kind} ${event.tokenId} -> ${event.to.join(',')}${braid}${unbraid}${anyonPhase}${channel}${fusion}${time}.`;
            }
        }
        els.historyList.append(item);
    }
}

function renderStochasticLog() {
    els.stochasticList.innerHTML = '';
    const events = [...(game.probability?.randomEvents || [])].slice(-18).reverse();
    if (!events.length) {
        const item = document.createElement('li');
        item.textContent = 'No random events yet. Noise and measurement rolls are seeded and logged here.';
        els.stochasticList.append(item);
        return;
    }
    for (const event of events) {
        const item = document.createElement('li');
        const target = event.affectedTokens?.length
            ? event.affectedTokens.join(',')
            : (event.affectedVertices || []).map((coord) => coord.join(',')).join(' | ');
        const outcome = event.outcome?.applied || event.outcome?.triggered ? 'hit' : 'miss';
        item.textContent = `t${event.tick} ${event.type} p=${event.probability} ${outcome}${target ? ` target ${target}` : ''}.`;
        els.stochasticList.append(item);
    }
}

function renderBraidEventLog() {
    if (!els.braidEventList) return;
    els.braidEventList.innerHTML = '';
    const events = game.mode === 'anyon_jump' ? [...(game.braidEventLog || [])].slice(-18).reverse() : [];
    if (!events.length) {
        const item = document.createElement('li');
        item.textContent = game.mode === 'anyon_jump'
            ? 'No braid or unbraid events yet.'
            : 'Braid memory is available in Anyon Jump.';
        els.braidEventList.append(item);
        return;
    }
    for (const event of events) {
        const item = document.createElement('li');
        const generator = event.generator ? braidWordToText([event.generator]) : 'none';
        const result = event.cancellationOccurred
            ? 'cancelled'
            : event.wrongOrder
                ? 'appended'
                : event.skipped || 'recorded';
        const channel = event.fusionChannelBefore !== event.fusionChannelAfter
            ? ` channel ${event.fusionChannelBefore || '?'}->${event.fusionChannelAfter || '?'}`
            : '';
        const phase = event.anyonPhaseBefore || event.anyonPhaseAfter
            ? `, phase ${event.anyonPhaseBefore?.text || '0'}->${event.anyonPhaseAfter?.text || '0'}`
            : '';
        item.textContent = `t${event.tick} ${event.player} ${event.type} ${event.movingTokenId}->${event.targetId || 'cycle'} ${generator}: ${result}, word ${event.braidWordBefore.length}->${event.braidWordAfter.length}${phase}${channel}.`;
        els.braidEventList.append(item);
    }
}

function renderExport() {
    els.exportText.value = JSON.stringify(game.exportState(), null, 2);
}

function exportJson() {
    const data = JSON.stringify(game.exportState(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${game.mode}-${game.topology.name}-history.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function pauliDisplay(stone) {
    if (!phaseSignsEnabled()) return stone.pauliLabel;
    return `${Number(stone.pauliSign || 1) < 0 ? '-' : '+'}${stone.pauliLabel}`;
}

function anyonDisplay(type) {
    const znMatch = String(type || '').match(/^z(\d+)$/);
    if (znMatch) {
        const subscript = [...znMatch[1]].map((digit) => SUBSCRIPT_DIGITS[digit] || digit).join('');
        return `\u03b1${subscript}`;
    }
    return ANYON_SYMBOLS[type] || type;
}

function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0';
    return Number(number.toFixed(2)).toString();
}

function anyonPhaseDisplay(token) {
    const denominator = Math.max(2, Number(token?.anyonPhaseDenominator || game?.config?.generalAnyonGrade || 2));
    const raw = ((Number(token?.anyonPhaseNumerator || 0) % denominator) + denominator) % denominator;
    if (game?.config?.phaseModel !== 'zn_phase') {
        return { enabled: false, active: false, numerator: raw, denominator, sign: 0, text: '0' };
    }
    if (raw === 0) return { enabled: true, active: false, numerator: raw, denominator, sign: 0, text: '0' };
    const signed = raw > denominator / 2 ? raw - denominator : raw;
    const sign = signed >= 0 ? 1 : -1;
    const text = `${sign > 0 ? '+' : '-'}${Math.abs(signed)}/${denominator}`;
    return { enabled: true, active: true, numerator: raw, denominator, sign, text };
}

function showUnbraidHint() {
    if (game?.mode !== 'anyon_jump') return;
    if (!selectedToken) {
        els.statusText.textContent = 'Select a braided anyon first. A green UNBRAID badge will mark the next inverse target.';
        return;
    }
    const token = game.tokens.get(selectedToken);
    if (!token) return;
    if (token.braidParity === 1 && game.config?.braidMemoryMode === 'abelian_parity') {
        const targetId = cancelTargetForSelectedToken();
        els.statusText.textContent = targetId
            ? `Click the green UNBRAID badge on ${targetId} to toggle braid parity back to 0.`
            : 'This token has parity 1 but no recorded target remains on the board.';
        return;
    }
    const next = nextRequiredUnbraidGenerator(token.braidWord);
    els.statusText.textContent = next
        ? `Next inverse is ${braidWordToText([next])} around ${next.targetId}. Click that green UNBRAID target.`
        : 'Selected token has trivial braid memory; no unbraid is needed.';
}

function handleCount() {
    if (game?.mode !== 'virasoro_go') return;
    const agreeingPlayer = game.currentPlayer;
    const result = game.agreeToCount(agreeingPlayer);
    if (result.ok && !result.score) {
        game.currentPlayer = agreeingPlayer === 'black' ? 'white' : 'black';
    }
    els.statusText.textContent = result.ok
        ? (result.score
            ? `Final score: black ${result.score.black}, white ${result.score.white}. Winner: ${result.winner}.`
            : `${capitalize(agreeingPlayer)} agreed to count. ${capitalize(game.currentPlayer)} must agree too.`)
        : result.error;
    render();
}

function capitalize(value) {
    return String(value || '').slice(0, 1).toUpperCase() + String(value || '').slice(1);
}

els.topologySelect.addEventListener('change', () => {
    if (els.topologySelect.value === 'r3') {
        els.zSizeInput.value = String(Math.max(2, Math.min(19, Number(els.widthInput.value) || 8)));
    }
});

for (const control of [
    els.modeSelect,
    els.topologySelect,
    els.latticeSelect,
    els.widthInput,
    els.heightInput,
    els.zSizeInput,
    els.wSizeInput,
    els.noiseModeSelect,
    els.pauliNoiseTypeSelect,
    els.applyNoiseSelect,
    els.floquetModeSelect,
    els.timeUpdateSelect,
    els.anyonFlipSelect,
    els.braidMemoryModeSelect,
    els.anyonModelSelect,
    els.anyonSetupSelect,
    els.anyonExcitationTypeSelect,
    els.anyonDropLossInput,
    els.anyonGradeInput,
    els.entanglementRangeSelect,
    els.entanglementDistanceInput,
    els.braidCancellationModeSelect,
    els.braidedPieceShieldSelect,
    els.captureRequiresUnbraidSelect,
    els.braidedPiecePenaltySelect,
    els.virasoroLayerSelect,
    els.physicalProblemSelect,
    els.virasoroMaxModeSelect,
    els.unstableRuleSelect
]) {
    control.addEventListener('change', createGame);
}
els.noiseRateInput.addEventListener('change', createGame);
els.measurementErrorInput.addEventListener('change', createGame);
els.noiseSeedInput.addEventListener('change', createGame);
els.timePeriodInput.addEventListener('change', createGame);
els.phaseSignSelect.addEventListener('change', createGame);
els.centralChargeInput.addEventListener('change', createGame);
els.virasoroActionSelect.addEventListener('change', render);
els.virasoroDirectionSelect.addEventListener('change', render);
els.transformSelect.addEventListener('change', render);
els.pauliSelect.addEventListener('change', render);
els.zLayerInput.addEventListener('input', render);
els.wLayerInput.addEventListener('input', render);
els.newGameButton.addEventListener('click', createGame);
els.measureButton.addEventListener('click', measureTarget);
els.countButton.addEventListener('click', handleCount);
els.unbraidHintButton.addEventListener('click', showUnbraidHint);
els.manualNoiseButton.addEventListener('click', applyNoiseNow);
els.manualTimeButton.addEventListener('click', applyTimeNow);
els.dropAnyonButton.addEventListener('click', dropSelectedAnyon);
els.rulesIntroButton.addEventListener('click', toggleRulesIntro);
els.passButton.addEventListener('click', () => {
    if (game?.mode === 'clifford_reversi') {
        game.pass();
        render();
    } else if (game?.mode === 'virasoro_go') {
        const result = game.pass(game.currentPlayer);
        els.statusText.textContent = result.ok ? `${capitalize(result.event.color)} passed.` : result.error;
        render();
    }
});
els.exportButton.addEventListener('click', exportJson);
window.addEventListener('pageshow', () => {
    if (!game) createGame();
    else if (els.topologySelect.value !== game.topology.name) createGame();
    else render();
});

createGame();
