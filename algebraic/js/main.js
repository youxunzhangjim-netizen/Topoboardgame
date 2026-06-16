import { CliffordReversiGame } from '../../js/localgames/CliffordReversi.js';
import { CliffordGoGame } from '../../js/localgames/CliffordGo.js';
import { PhysicalCliffordReversiGame } from '../../js/localgames/PhysicalCliffordReversi.js';
import { PhysicalVirasoroReversiGame } from '../../js/localgames/PhysicalVirasoroReversi.js';
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
import {
    createPrivateRoom,
    findMatch,
    getOnlineState,
    initOnline,
    joinPrivateRoom,
    leaveRoom,
    reconnectRoom,
    sendChatMessage,
    sendMove
} from '../../online.js';

const els = {
    modeSelect: document.querySelector('#modeSelect'),
    modeControl: document.querySelector('#modeControl'),
    physicalProblemControl: document.querySelector('#physicalProblemControl'),
    physicalProblemSelect: document.querySelector('#physicalProblemSelect'),
    qecPairsEControl: document.querySelector('#qecPairsEControl'),
    qecPairsEInput: document.querySelector('#qecPairsEInput'),
    qecPairsMControl: document.querySelector('#qecPairsMControl'),
    qecPairsMInput: document.querySelector('#qecPairsMInput'),
    qecPairSeparationControl: document.querySelector('#qecPairSeparationControl'),
    qecPairSeparationInput: document.querySelector('#qecPairSeparationInput'),
    stabilizerErrorDensityControl: document.querySelector('#stabilizerErrorDensityControl'),
    stabilizerErrorDensityInput: document.querySelector('#stabilizerErrorDensityInput'),
    stabilizerLogicalChecksControl: document.querySelector('#stabilizerLogicalChecksControl'),
    stabilizerLogicalChecksSelect: document.querySelector('#stabilizerLogicalChecksSelect'),
    stabilizerAncillaControl: document.querySelector('#stabilizerAncillaControl'),
    stabilizerAncillaSelect: document.querySelector('#stabilizerAncillaSelect'),
    stabilizerPhaseKickControl: document.querySelector('#stabilizerPhaseKickControl'),
    stabilizerPhaseKickSelect: document.querySelector('#stabilizerPhaseKickSelect'),
    stabilizerMaxTurnsControl: document.querySelector('#stabilizerMaxTurnsControl'),
    stabilizerMaxTurnsInput: document.querySelector('#stabilizerMaxTurnsInput'),
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
    cliffordAlgebraSetControl: document.querySelector('#cliffordAlgebraSetControl'),
    cliffordAlgebraSetSelect: document.querySelector('#cliffordAlgebraSetSelect'),
    physicalCliffordControls: document.querySelector('#physicalCliffordControls'),
    anyonAlgebraControls: document.querySelector('#anyonAlgebraControls'),
    virasoroAlgebraControls: document.querySelector('#virasoroAlgebraControls'),
    cftReversiControls: document.querySelector('#cftReversiControls'),
    cftModelControl: document.querySelector('#cftModelControl'),
    cftModelSelect: document.querySelector('#cftModelSelect'),
    cftInitialStateSelect: document.querySelector('#cftInitialStateSelect'),
    cftDomainWallThicknessControl: document.querySelector('#cftDomainWallThicknessControl'),
    cftDomainWallThicknessInput: document.querySelector('#cftDomainWallThicknessInput'),
    cftPrimarySelect: document.querySelector('#cftPrimarySelect'),
    cftActionSelect: document.querySelector('#cftActionSelect'),
    cftDirectionControl: document.querySelector('#cftDirectionControl'),
    cftDirectionSelect: document.querySelector('#cftDirectionSelect'),
    cftMeasurementControl: document.querySelector('#cftMeasurementControl'),
    cftMeasurementSelect: document.querySelector('#cftMeasurementSelect'),
    cftHiddenChannelSelect: document.querySelector('#cftHiddenChannelSelect'),
    cftMaxModeSelect: document.querySelector('#cftMaxModeSelect'),
    cftCentralChargeInput: document.querySelector('#cftCentralChargeInput'),
    cftTemperatureInput: document.querySelector('#cftTemperatureInput'),
    pauliControl: document.querySelector('#pauliControl'),
    transformControl: document.querySelector('#transformControl'),
    phaseSignControl: document.querySelector('#phaseSignControl'),
    phaseSignSelect: document.querySelector('#phaseSignSelect'),
    physicalInitialStateSelect: document.querySelector('#physicalInitialStateSelect'),
    physicalDomainWallThicknessControl: document.querySelector('#physicalDomainWallThicknessControl'),
    physicalDomainWallThicknessInput: document.querySelector('#physicalDomainWallThicknessInput'),
    physicsViewSelect: document.querySelector('#physicsViewSelect'),
    physicalActionSelect: document.querySelector('#physicalActionSelect'),
    physicalPauliControl: document.querySelector('#physicalPauliControl'),
    physicalPauliSelect: document.querySelector('#physicalPauliSelect'),
    physicalPhaseControl: document.querySelector('#physicalPhaseControl'),
    physicalPhaseSelect: document.querySelector('#physicalPhaseSelect'),
    ancillaBasisControl: document.querySelector('#ancillaBasisControl'),
    ancillaBasisSelect: document.querySelector('#ancillaBasisSelect'),
    entangleGateControl: document.querySelector('#entangleGateControl'),
    entangleGateSelect: document.querySelector('#entangleGateSelect'),
    physicalMeasurementControl: document.querySelector('#physicalMeasurementControl'),
    physicalMeasurementSelect: document.querySelector('#physicalMeasurementSelect'),
    physicalMeasurementBasisControl: document.querySelector('#physicalMeasurementBasisControl'),
    physicalMeasurementBasisSelect: document.querySelector('#physicalMeasurementBasisSelect'),
    physicalPhaseGateControl: document.querySelector('#physicalPhaseGateControl'),
    physicalPhaseGateSelect: document.querySelector('#physicalPhaseGateSelect'),
    phaseKickThetaControl: document.querySelector('#phaseKickThetaControl'),
    phaseKickThetaInput: document.querySelector('#phaseKickThetaInput'),
    braidMemoryControl: document.querySelector('#braidMemoryControl'),
    braidMemoryModeSelect: document.querySelector('#braidMemoryModeSelect'),
    anyonModelControl: document.querySelector('#anyonModelControl'),
    anyonSetupControl: document.querySelector('#anyonSetupControl'),
    anyonSetupSelect: document.querySelector('#anyonSetupSelect'),
    anyonActionControl: document.querySelector('#anyonActionControl'),
    anyonActionSelect: document.querySelector('#anyonActionSelect'),
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
    playModeSelect: document.querySelector('#playModeSelect'),
    onlineRoomInput: document.querySelector('#onlineRoomInput'),
    onlineButtonGrid: document.querySelector('#onlineButtonGrid'),
    onlineFindButton: document.querySelector('#onlineFindButton'),
    onlineCreateButton: document.querySelector('#onlineCreateButton'),
    onlineJoinButton: document.querySelector('#onlineJoinButton'),
    onlineReconnectButton: document.querySelector('#onlineReconnectButton'),
    onlineLeaveButton: document.querySelector('#onlineLeaveButton'),
    connectionStatus: document.querySelector('#connectionStatus'),
    roomInfo: document.querySelector('#roomInfo'),
    roomIdDisplay: document.querySelector('#roomIdDisplay'),
    shareLinkInput: document.querySelector('#shareLinkInput'),
    copyLinkButton: document.querySelector('#copyLinkButton'),
    onlineStatus: document.querySelector('#onlineStatus'),
    onlineChatMessages: document.querySelector('#onlineChatMessages'),
    onlineChatInput: document.querySelector('#onlineChatInput'),
    onlineChatSendButton: document.querySelector('#onlineChatSendButton'),
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
    blackCountLabel: document.querySelector('#blackCountLabel'),
    whiteCountLabel: document.querySelector('#whiteCountLabel'),
    blackBraid: document.querySelector('#blackBraid'),
    whiteBraid: document.querySelector('#whiteBraid'),
    blackBraidLabel: document.querySelector('#blackBraidLabel'),
    whiteBraidLabel: document.querySelector('#whiteBraidLabel'),
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
    physicalCliffordRules: document.querySelector('[data-rules-mode="physical-clifford"]'),
    anyonRules: document.querySelector('[data-rules-mode="anyon"]'),
    virasoroRules: document.querySelector('[data-rules-mode="virasoro"]'),
    cftReversiRules: document.querySelector('[data-rules-mode="cft-reversi"]'),
    cftObservablePanel: document.querySelector('#cftObservablePanel'),
    cftObservableModel: document.querySelector('#cftObservableModel'),
    cftObservableCharge: document.querySelector('#cftObservableCharge'),
    cftObservableDominant: document.querySelector('#cftObservableDominant'),
    cftObservableEntropy: document.querySelector('#cftObservableEntropy'),
    cftObservableCorrelation: document.querySelector('#cftObservableCorrelation'),
    cftObservableChannels: document.querySelector('#cftObservableChannels'),
    cftObservableAnomalies: document.querySelector('#cftObservableAnomalies'),
    cftObservableVacuum: document.querySelector('#cftObservableVacuum'),
    cftIdentityBlockMeter: document.querySelector('#cftIdentityBlockMeter'),
    cftIdentityBlockValue: document.querySelector('#cftIdentityBlockValue'),
    cftEpsilonBlockMeter: document.querySelector('#cftEpsilonBlockMeter'),
    cftEpsilonBlockValue: document.querySelector('#cftEpsilonBlockValue'),
    cftObservableSummary: document.querySelector('#cftObservableSummary'),
    qecObservablePanel: document.querySelector('#qecObservablePanel'),
    qecTotalCharge: document.querySelector('#qecTotalCharge'),
    qecLogicalSector: document.querySelector('#qecLogicalSector'),
    qecMemoryState: document.querySelector('#qecMemoryState'),
    qecVacuumRecovery: document.querySelector('#qecVacuumRecovery'),
    qecAverageBraidLength: document.querySelector('#qecAverageBraidLength'),
    qecMaxBraidLength: document.querySelector('#qecMaxBraidLength'),
    qecUnbraidSuccess: document.querySelector('#qecUnbraidSuccess'),
    qecUnbraidFail: document.querySelector('#qecUnbraidFail'),
    qecObservableSummary: document.querySelector('#qecObservableSummary'),
    stabilizerObservablePanel: document.querySelector('#stabilizerObservablePanel'),
    stabilizerSyndromeWeight: document.querySelector('#stabilizerSyndromeWeight'),
    stabilizerViolationCount: document.querySelector('#stabilizerViolationCount'),
    stabilizerLogicalSector: document.querySelector('#stabilizerLogicalSector'),
    stabilizerGlobalParity: document.querySelector('#stabilizerGlobalParity'),
    stabilizerConflictCount: document.querySelector('#stabilizerConflictCount'),
    stabilizerAncillaCount: document.querySelector('#stabilizerAncillaCount'),
    stabilizerMeasurementErrors: document.querySelector('#stabilizerMeasurementErrors'),
    stabilizerVacuumState: document.querySelector('#stabilizerVacuumState'),
    stabilizerObservableSummary: document.querySelector('#stabilizerObservableSummary'),
    exportText: document.querySelector('#exportText')
};

const MODE_LABELS = {
    clifford_reversi: 'Clifford Reversi',
    clifford_go: 'Clifford Go',
    physical_virasoro_go: 'Virasoro Go',
    physical_virasoro_reversi: 'Virasoro Reversi',
    anyon_jump: 'Anyon Jump Chess'
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

function cloneValue(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}
const params = new URLSearchParams(window.location.search);
const RAW_INITIAL_MODE = params.get('mode') || params.get('game') || params.get('algebraicMode');
const INITIAL_MODE = normalizeMode(RAW_INITIAL_MODE);
const INITIAL_CLIFFORD_ALGEBRA_SET = params.get('algebraSet')
    || (['physical_clifford_reversi', 'physical_clifford', 'physical_reversi'].includes(RAW_INITIAL_MODE)
        ? 'physical'
        : '');
const INITIAL_TOPOLOGY = params.get('topology') || params.get('board') || '';
const URL_PHYSICAL_PROBLEM_ID = params.get('physicalProblem') || params.get('problemId') || '';

let game = null;
let selectedToken = '';
let selectedPhysicalCoord = null;
let selectedCFTCoords = [];
let hoverCoord = null;
let lastCancellation = null;
let lastWrongUnbraid = null;
let applyingRemoteState = false;
let onlineReady = null;
let statusHoldUntil = 0;
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
if (INITIAL_CLIFFORD_ALGEBRA_SET === 'physical') {
    els.cliffordAlgebraSetSelect.value = 'physical';
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
    if (value === 'physical_clifford_reversi' || value === 'physical_clifford' || value === 'physical_reversi') {
        return 'clifford_reversi';
    }
    if (value === 'cft_reversi' || value === 'virasoro_reversi') return 'physical_virasoro_reversi';
    if (['go', 'virasoro', 'virasoro_go', 'virasoro_go_game'].includes(value)) {
        return 'physical_virasoro_go';
    }
    return Object.hasOwn(MODE_LABELS, value) ? value : '';
}

function selectedMode() {
    return normalizeMode(els.modeSelect.value) || 'clifford_reversi';
}

function isPhysicalCliffordMode(mode = game?.mode || selectedMode()) {
    if (game && (game.algebraSet === 'physical' || game.physicalConfig)) return true;
    return mode === 'clifford_reversi' && els.cliffordAlgebraSetSelect?.value === 'physical';
}

function isReversiMode(mode = game?.mode || selectedMode()) {
    return mode === 'clifford_reversi' || mode === 'physical_virasoro_reversi';
}

function isCliffordGoMode(mode = game?.mode || selectedMode()) {
    return mode === 'clifford_go';
}

function isGoMode(mode = game?.mode || selectedMode()) {
    return isCliffordGoMode(mode) || isPhysicalVirasoroGoMode(mode);
}

function isCFTReversiMode(mode = game?.mode || selectedMode()) {
    return mode === 'physical_virasoro_reversi';
}

function isPhysicalVirasoroGoMode(mode = game?.mode || selectedMode()) {
    return mode === 'physical_virasoro_go';
}

function isCFTMode(mode = game?.mode || selectedMode()) {
    return isPhysicalVirasoroGoMode(mode) || isCFTReversiMode(mode);
}

function syncCFTInitialStateOptions(isGo) {
    const choices = isGo
        ? [
            ['vacuum', 'Vacuum'],
            ['two_point_insertions', 'Two-Point Insertions'],
            ['four_point_block', 'Four-Point Block'],
            ['boundary_cft', 'Boundary CFT'],
            ['thermal_sparse', 'Thermal Sparse']
        ]
        : [
            ['domain_wall_seed', 'Domain Wall Seed'],
            ['four_sigma_block', 'Four Sigma Block'],
            ['boundary_condition_change', 'Boundary Condition Change'],
            ['thermal_cft_sample', 'Thermal CFT Sample']
        ];
    const previous = els.cftInitialStateSelect.value;
    els.cftInitialStateSelect.replaceChildren(...choices.map(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
    }));
    els.cftInitialStateSelect.value = choices.some(([value]) => value === previous)
        ? previous
        : choices[0][0];
}

function syncCFTPrimaryOptions() {
    const choices = els.cftModelSelect.value === 'free_boson_CFT'
        ? [['vertex', 'Vertex'], ['identity', 'Identity']]
        : [['sigma', 'Sigma'], ['epsilon', 'Epsilon'], ['identity', 'Identity']];
    const previous = els.cftPrimarySelect.value;
    els.cftPrimarySelect.replaceChildren(...choices.map(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
    }));
    els.cftPrimarySelect.value = choices.some(([value]) => value === previous)
        ? previous
        : choices[0][0];
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
        const cost = Number(game?.excitationCost?.(type) ?? excitationCatalog().costs[type] ?? 0);
        const energy = Number(game?.energy?.[game.currentPlayer] ?? 12);
        option.textContent = `${anyonDisplay(type)} - ${formatNumber(cost)} energy`;
        option.disabled = cost > energy;
        return option;
    }));
    const available = [...els.anyonExcitationTypeSelect.options].filter((option) => !option.disabled);
    const selected = [...els.anyonExcitationTypeSelect.options]
        .find((option) => option.value === previous && !option.disabled);
    els.anyonExcitationTypeSelect.value = selected?.value || available[0]?.value || types[0];
}

function syncModeControls() {
    const mode = selectedMode();
    const isAnyon = mode === 'anyon_jump';
    const isVirasoroGo = isPhysicalVirasoroGoMode(mode);
    const isCFTReversi = mode === 'physical_virasoro_reversi';
    const isClifford = mode === 'clifford_reversi' || isCliffordGoMode(mode);
    const isPhysicalClifford = mode === 'clifford_reversi' && els.cliffordAlgebraSetSelect.value === 'physical';
    const isStandardClifford = isClifford && !isPhysicalClifford;
    if (els.modeSelect.value !== mode) els.modeSelect.value = mode;
    if (els.modeControl) els.modeControl.hidden = false;
    if (els.cliffordAlgebraControls) els.cliffordAlgebraControls.hidden = !isClifford;
    if (els.cliffordAlgebraSetControl) els.cliffordAlgebraSetControl.hidden = isCliffordGoMode(mode);
    if (els.physicalCliffordControls) els.physicalCliffordControls.hidden = !isPhysicalClifford;
    if (els.anyonAlgebraControls) els.anyonAlgebraControls.hidden = !isAnyon;
    if (els.virasoroAlgebraControls) els.virasoroAlgebraControls.hidden = true;
    if (els.cftReversiControls) els.cftReversiControls.hidden = !isVirasoroGo && !isCFTReversi;
    if (isVirasoroGo || isCFTReversi) {
        syncCFTInitialStateOptions(isVirasoroGo);
        if (isCFTReversi) els.cftModelSelect.value = 'ising_CFT';
        syncCFTPrimaryOptions();
    }
    if (els.cftModelControl) els.cftModelControl.hidden = !isVirasoroGo;
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
                : isVirasoroGo
                    ? ['', 'cft_conformal_block_observables']
                : isStandardClifford && mode === 'clifford_reversi'
                    ? ['', 'ising_domain_wall_topology']
                    : isPhysicalClifford ? ['', 'stabilizer_pauli_recovery'] : [''],
            ''
        );
    }
    const qecProblem = isAnyon && selectedPhysicalProblemId() === 'toric_code_memory_unbraid';
    els.qecPairsEControl.hidden = !qecProblem;
    els.qecPairsMControl.hidden = !qecProblem;
    els.qecPairSeparationControl.hidden = !qecProblem;
    const stabilizerProblem = isPhysicalClifford
        && selectedPhysicalProblemId() === 'stabilizer_pauli_recovery';
    els.stabilizerErrorDensityControl.hidden = !stabilizerProblem;
    els.stabilizerLogicalChecksControl.hidden = !stabilizerProblem;
    els.stabilizerAncillaControl.hidden = !stabilizerProblem;
    els.stabilizerPhaseKickControl.hidden = !stabilizerProblem;
    els.stabilizerMaxTurnsControl.hidden = !stabilizerProblem;

    if (isVirasoroGo || isCFTReversi) {
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

    els.pauliControl.hidden = !isStandardClifford;
    els.transformControl.hidden = !isClifford;
    els.phaseSignControl.hidden = !isStandardClifford;
    if (isPhysicalClifford) {
        let action = els.physicalActionSelect.value;
        const stabilizerProblem = selectedPhysicalProblemId() === 'stabilizer_pauli_recovery';
        const ancillasEnabled = !stabilizerProblem || els.stabilizerAncillaSelect.value === 'on';
        const phaseKickEnabled = !stabilizerProblem || els.stabilizerPhaseKickSelect.value === 'on';
        for (const option of els.physicalActionSelect.options) {
            if (['prepare_ancilla', 'entangle_ancilla', 'discard_ancilla'].includes(option.value)) {
                option.disabled = !ancillasEnabled;
            }
        }
        els.physicalPhaseGateSelect.querySelector('option[value="phase_kick"]').disabled = !phaseKickEnabled;
        if (!ancillasEnabled && ['prepare_ancilla', 'entangle_ancilla', 'discard_ancilla'].includes(action)) {
            els.physicalActionSelect.value = 'reversi';
            action = 'reversi';
        }
        if (!phaseKickEnabled && els.physicalPhaseGateSelect.value === 'phase_kick') {
            els.physicalPhaseGateSelect.value = 'S';
        }
        els.physicalPauliControl.hidden = action !== 'reversi';
        els.physicalPhaseControl.hidden = action !== 'reversi';
        els.ancillaBasisControl.hidden = action !== 'prepare_ancilla';
        els.entangleGateControl.hidden = action !== 'entangle_ancilla';
        els.physicalMeasurementControl.hidden = action !== 'measure';
        els.physicalMeasurementBasisControl.hidden = action !== 'measure';
        els.physicalPhaseGateControl.hidden = action !== 'phase_action';
        els.phaseKickThetaControl.hidden = action !== 'phase_action'
            || els.physicalPhaseGateSelect.value !== 'phase_kick';
    }
    if (els.physicalDomainWallThicknessControl) {
        els.physicalDomainWallThicknessControl.hidden = !isPhysicalClifford
            || els.physicalInitialStateSelect.value !== 'domain_wall_seed';
    }
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
    if (els.anyonActionControl) els.anyonActionControl.hidden = !excitationMode;
    if (!excitationMode) els.anyonActionSelect.value = 'move';
    if (els.anyonExcitationTypeControl) {
        els.anyonExcitationTypeControl.hidden = !excitationMode || els.anyonActionSelect.value !== 'excite';
    }
    if (els.anyonDropLossControl) els.anyonDropLossControl.hidden = !excitationMode;
    if (els.dropAnyonButton) els.dropAnyonButton.hidden = !excitationMode;
    els.braidedCaptureDetails.hidden = !isAnyon;
    els.braidCancellationControl.hidden = !isAnyon
        || !['word_exact', 'nonabelian_fusion_channel'].includes(els.braidMemoryModeSelect.value);
    if (isVirasoroGo || isCFTReversi) {
        const action = els.cftActionSelect.value;
        els.cftDirectionControl.hidden = !['L-1', 'L-2'].includes(action);
        els.cftMeasurementControl.hidden = action !== 'measure';
        if (els.cftDomainWallThicknessControl) {
            els.cftDomainWallThicknessControl.hidden = !isCFTReversi
                || els.cftInitialStateSelect.value !== 'domain_wall_seed';
        }
        setAllowedSelectValues(
            els.cftActionSelect,
            Number(els.cftMaxModeSelect.value) >= 2
                ? ['place', 'L-1', 'L0', 'L1', 'L-2', 'L2', 'measure']
                : ['place', 'L-1', 'L0', 'L1', 'measure'],
            'place'
        );
    }
    els.passButton.hidden = isAnyon;
    els.countButton.hidden = !isGoMode(mode);
    els.measureButton.hidden = isGoMode(mode) || isPhysicalClifford || isCFTReversi;
    els.unbraidHintButton.hidden = !isAnyon;
    els.dynamicsSection.hidden = isVirasoroGo || isCFTReversi;
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
    if (els.blackBraidCard) els.blackBraidCard.hidden = !isAnyon && !isCFTReversi;
    if (els.whiteBraidCard) els.whiteBraidCard.hidden = !isAnyon && !isCFTReversi;
    if (els.braidEventSection) els.braidEventSection.hidden = !isAnyon;
    if (els.cliffordRules) els.cliffordRules.hidden = !isStandardClifford;
    if (els.physicalCliffordRules) els.physicalCliffordRules.hidden = !isPhysicalClifford;
    if (els.anyonRules) els.anyonRules.hidden = !isAnyon;
    if (els.virasoroRules) els.virasoroRules.hidden = !isVirasoroGo;
    if (els.cftReversiRules) els.cftReversiRules.hidden = !isCFTReversi;
    if (els.rulesIntroButton) {
        els.rulesIntroButton.textContent = isVirasoroGo
            ? 'Virasoro Go Rules'
            : isCFTReversi ? 'CFT Reversi Rules' : isAnyon ? 'Anyon Rules' : 'Clifford Rules';
    }
    document.title = `${MODE_LABELS[mode]} - Algebraic Board Games`;
    return mode;
}

function topologyConfig() {
    const topology = els.topologySelect.value;
    const selectedLattice = els.latticeSelect?.value || 'square';
    const lattice = topology === 'flat_4d_grid' || topology === 'r3'
        ? 'square'
        : isReversiMode(selectedMode()) && selectedLattice === 'honeycomb'
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
            numPairsE: Number(params.get('numPairsE') || els.qecPairsEInput.value || 2),
            numPairsM: Number(params.get('numPairsM') || els.qecPairsMInput.value || 2),
            pairSeparation: Number(params.get('pairSeparation') || els.qecPairSeparationInput.value || 1),
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
    if (mode === 'clifford_reversi'
        && els.cliffordAlgebraSetSelect.value === 'physical'
        && physicalProblemId === 'stabilizer_pauli_recovery') {
        return {
            id: physicalProblemId,
            errorDensity: Number(els.stabilizerErrorDensityInput.value || 0.08),
            measurementErrorRate: Number(els.measurementErrorInput.value || 0.02),
            enableTopologyLogicalChecks: els.stabilizerLogicalChecksSelect.value === 'on',
            enableAncillaActions: els.stabilizerAncillaSelect.value === 'on',
            enableNonCliffordPhaseKick: els.stabilizerPhaseKickSelect.value === 'on',
            maxTurns: Number(els.stabilizerMaxTurnsInput.value || 100)
        };
    }
    if (mode === 'physical_virasoro_go'
        && physicalProblemId === 'cft_conformal_block_observables') {
        return {
            id: physicalProblemId,
            cftInitialState: els.cftInitialStateSelect.value,
            cftModel: els.cftModelSelect.value,
            centralCharge: Number(els.cftCentralChargeInput.value),
            maxMode: Number(els.cftMaxModeSelect.value),
            maxTurns: Number(params.get('maxTurns') || 100),
            seed: params.get('seed') || els.noiseSeedInput.value || 'cft-observables'
        };
    }
    return null;
}

function createGame() {
    const mode = syncModeControls();
    selectedToken = '';
    selectedPhysicalCoord = null;
    selectedCFTCoords = [];
    hoverCoord = null;
    lastCancellation = null;
    lastWrongUnbraid = null;
    legalReversiCache = { signature: '', keys: [] };
    const config = anyonConfig();
    const physicalProblem = physicalProblemConfig(mode);
    const usePhysicalWallThickness = mode === 'clifford_reversi'
        && els.cliffordAlgebraSetSelect.value === 'physical';
    const domainWallThicknessInput = usePhysicalWallThickness
        ? els.physicalDomainWallThicknessInput
        : els.cftDomainWallThicknessInput;
    if (physicalProblem?.id === 'toric_code_memory_unbraid') {
        config.anyonModel = 'toric_code';
        config.braidEffect = 'add_braid_token';
    }
    const options = {
        topology: topologyConfig(),
        algebraSet: mode === 'clifford_reversi' ? els.cliffordAlgebraSetSelect.value : null,
        defaultFlipTransform: els.transformSelect.value,
        trackPhaseSigns: phaseSignsEnabled(),
        physicalInitialState: els.physicalInitialStateSelect.value,
        sparseErrorDensity: physicalProblem?.errorDensity,
        cftReversiInitialState: els.cftInitialStateSelect.value,
        cftInitialState: els.cftInitialStateSelect.value,
        cftModel: els.cftModelSelect.value,
        primaryType: els.cftPrimarySelect.value,
        hiddenChannels: els.cftHiddenChannelSelect.value === 'on',
        centralCharge: Number(els.cftCentralChargeInput.value),
        maxMode: Number(els.cftMaxModeSelect.value),
        temperature: Number(els.cftTemperatureInput.value),
        domainWallThickness: Math.max(1, Math.min(6, Math.floor(Number(domainWallThicknessInput?.value) || 1))),
        config,
        virasoro: virasoroConfig(),
        probability: probabilityConfig(),
        time: timeConfig()
    };
    if (physicalProblem) options.physicalProblem = physicalProblem;
    if (mode === 'anyon_jump') game = new AnyonJumpGame(options);
    else if (mode === 'clifford_go') game = new CliffordGoGame(options);
    else if (mode === 'physical_virasoro_go') game = new VirasoroGoGame(options);
    else if (mode === 'physical_virasoro_reversi') game = new PhysicalVirasoroReversiGame(options);
    else if (mode === 'clifford_reversi' && els.cliffordAlgebraSetSelect.value === 'physical') {
        game = new PhysicalCliffordReversiGame(options);
    }
    else game = new CliffordReversiGame(options);
    normalizeLayerControls();
    render();
}

function currentOnlineMatchKey() {
    const mode = selectedMode();
    const topology = els.topologySelect.value;
    const lattice = els.latticeSelect.value;
    return [
        'algebraic',
        mode,
        topology,
        lattice,
        els.widthInput.value,
        els.heightInput.value,
        topology === 'r3' || topology === 'flat_4d_grid' ? els.zSizeInput.value : '',
        topology === 'flat_4d_grid' ? els.wSizeInput.value : '',
        mode === 'clifford_reversi' ? els.cliffordAlgebraSetSelect.value : ''
    ].join(':');
}

function restoreGoState(state) {
    const source = state.go;
    if (!source || !game.go) return;
    game.go.board.clear();
    source.board?.forEach((value, index) => {
        const key = game.go.vertexKeys[index];
        if (key && value) game.go.board.set(key, value);
    });
    game.go.currentPlayer = source.currentPlayer || state.currentPlayer || 'black';
    game.go.captures = { ...(source.captures || { black: 0, white: 0 }) };
    game.go.passCount = Number(source.passCount) || 0;
    game.go.scoringPending = Boolean(source.scoringPending);
    game.go.countAgreements = { ...(source.countAgreements || { black: false, white: false }) };
    game.go.gameOver = Boolean(source.gameOver);
    game.go.winner = source.winner || '';
    game.go.score = source.score ? { ...source.score } : null;
    game.go.moveNumber = Number(source.moveNumber) || 0;
    game.go.moveHistory = cloneValue(source.moveHistory || state.history || []);
    game.go.positionHistory = [...(source.positionHistory || [game.go.serializeBoard()])];
    game.go.positionSet = new Set(game.go.positionHistory);

    if (game.labels && Array.isArray(state.labels)) {
        game.labels.clear();
        for (const item of state.labels) {
            game.labels.set(item.key || coordKey(item.coord), {
                pauliLabel: item.pauliLabel,
                pauliSign: item.pauliSign
            });
        }
    }
    if (game.primaryBoard && Array.isArray(state.primaryBoard)) {
        game.primaryBoard.clear();
        for (const item of state.primaryBoard) {
            const { key, coord, ...stone } = item;
            game.primaryBoard.set(key || coordKey(coord), cloneValue(stone));
        }
    }
}

function restoreReversiState(state) {
    if (!game.board || !Array.isArray(state.board)) return;
    game.board.clear();
    for (const item of state.board) {
        const { key, coord, ...stone } = item;
        game.board.set(key || coordKey(coord), cloneValue(stone));
    }
    game.currentPlayer = state.currentPlayer || 'black';
    game.moveNumber = Number(state.moveNumber) || 0;
    game.history = cloneValue(state.history || []);
    game.positionHistory = cloneValue(state.positionHistory || []);
    if (Array.isArray(state.physicsHistory)) game.physicsHistory = cloneValue(state.physicsHistory);
    if (Array.isArray(state.circuitHistory)) game.circuitHistory = cloneValue(state.circuitHistory);
}

function restoreAnyonState(state) {
    if (!game.tokens || !Array.isArray(state.tokens)) return;
    game.tokens.clear();
    game.worldlines.clear();
    for (const snapshot of state.tokens) {
        const token = game.addToken({
            ...snapshot,
            vertex: snapshot.vertex || snapshot.coord
        });
        if (token) Object.assign(token, cloneValue(snapshot));
    }
    for (const [id, path] of Object.entries(state.worldlines || {})) {
        game.worldlines.set(id, path.map((coord) => [...coord]));
    }
    game.currentPlayer = state.currentPlayer || 'black';
    game.moveNumber = Number(state.moveNumber) || 0;
    game.energy = { ...(state.energy || game.energy) };
    game.braidTokens = { ...(state.braidTokens || game.braidTokens) };
    game.score = { ...(state.score || game.score) };
    game.parity = { ...(state.parity || game.parity) };
    game.braidEventLog = cloneValue(state.braidEventLog || []);
    game.unbraidAttempts = cloneValue(state.unbraidAttempts || []);
    game.fusionOutcomes = cloneValue(state.fusionOutcomes || []);
    game.topologicalSectors = cloneValue(state.topologicalSectors || []);
    game.history = cloneValue(state.history || []);
}

function loadOnlineGameState(state) {
    if (!state?.mode) return;
    applyingRemoteState = true;
    try {
        els.modeSelect.value = normalizeMode(state.mode);
        const topology = state.topology || state.go?.topology;
        if (topology?.name && [...els.topologySelect.options].some((option) => option.value === topology.name)) {
            els.topologySelect.value = topology.name;
        }
        if (topology?.sizes?.length) {
            els.widthInput.value = topology.sizes[0];
            els.heightInput.value = topology.sizes[1];
            if (topology.sizes[2]) els.zSizeInput.value = topology.sizes[2];
            if (topology.sizes[3]) els.wSizeInput.value = topology.sizes[3];
        }
        if (state.algebraSet) els.cliffordAlgebraSetSelect.value = state.algebraSet;
        if (state.cftConfig?.model) els.cftModelSelect.value = state.cftConfig.model;
        if (state.cftConfig?.initialState) els.cftInitialStateSelect.value = state.cftConfig.initialState;
        createGame();
        if (state.mode === 'anyon_jump') restoreAnyonState(state);
        else if (state.go) restoreGoState(state);
        else restoreReversiState(state);
        lastOnlineSnapshotJSON = JSON.stringify(game.exportState());
        render();
    } finally {
        applyingRemoteState = false;
    }
}

function setOnlineConfigurationLocked(locked) {
    for (const control of [
        els.modeSelect,
        els.topologySelect,
        els.latticeSelect,
        els.widthInput,
        els.heightInput,
        els.zSizeInput,
        els.wSizeInput,
        els.cliffordAlgebraSetSelect,
        els.cftModelSelect,
        els.cftInitialStateSelect
    ]) {
        if (control) control.disabled = locked;
    }
}

function updateOnlineConnectionUI(roomId = '', playerColor = '', room = null) {
    if (els.connectionStatus) {
        const status = room?.status || (roomId ? 'waiting' : 'disconnected');
        els.connectionStatus.classList.remove('disconnected', 'connecting', 'connected');
        if (status === 'playing') {
            els.connectionStatus.classList.add('connected');
            els.connectionStatus.textContent = 'Connected';
        } else if (roomId || status === 'waiting') {
            els.connectionStatus.classList.add('connecting');
            els.connectionStatus.textContent = 'Waiting for opponent';
        } else {
            els.connectionStatus.classList.add('disconnected');
            els.connectionStatus.textContent = 'Disconnected';
        }
    }
    if (els.roomInfo) els.roomInfo.hidden = !roomId;
    if (els.roomIdDisplay) els.roomIdDisplay.textContent = roomId || '';
    if (els.shareLinkInput) {
        if (roomId) {
            const url = new URL(window.location.href);
            url.searchParams.set('room', roomId);
            els.shareLinkInput.value = url.href;
        } else {
            els.shareLinkInput.value = '';
        }
    }
    els.onlineStatus.dataset.color = playerColor || '';
}

function syncOnlineModeVisibility() {
    const online = els.playModeSelect.value === 'online';
    els.onlineButtonGrid.hidden = !online;
    if (online && !els.onlineStatus.dataset.color && els.onlineStatus.textContent === 'Local pass and play.') {
        els.onlineStatus.textContent = 'Online mode selected.';
    }
}

function onlineHooks() {
    return {
        gameKey: `algebraic:${selectedMode()}`,
        matchKey: currentOnlineMatchKey(),
        getCurrentBoardState: () => game.exportState(),
        loadBoardState: loadOnlineGameState,
        applyMove: (state, move, color) => {
            if (!state || state.currentPlayer !== color || !move?.boardState) return null;
            return cloneValue(move.boardState);
        },
        getCurrentTurn: (state) => state?.currentPlayer || game.currentPlayer,
        getTurnFromBoard: (state) => state?.currentPlayer,
        renderBoard: render,
        showOnlineStatus: (text) => {
            els.onlineStatus.textContent = text;
        },
        onRoomChanged: ({ roomId, playerColor, room }) => {
            const connected = room?.status === 'playing';
            setOnlineConfigurationLocked(Boolean(roomId));
            updateOnlineConnectionUI(roomId, playerColor, room);
            if (roomId) {
                els.onlineRoomInput.value = roomId;
                const url = new URL(window.location.href);
                url.searchParams.set('room', roomId);
                history.replaceState(null, '', url);
            }
            if (room?.board) lastOnlineSnapshotJSON = JSON.stringify(room.board);
            const canChat = connected && Boolean(playerColor);
            els.onlineChatInput.disabled = !canChat;
            els.onlineChatSendButton.disabled = !canChat;
            if (connected) render();
        },
        onChatMessages: renderOnlineChat
    };
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function renderOnlineChat(messages = []) {
    if (!els.onlineChatMessages) return;
    const online = getOnlineState();
    if (!messages.length) {
        els.onlineChatMessages.innerHTML = '<div class="online-chat-empty">Connect online to chat.</div>';
        return;
    }
    els.onlineChatMessages.innerHTML = messages.map((message) => {
        const mine = message.uid === online.uid;
        return `<div class="online-chat-message${mine ? ' mine' : ''}"><span>${escapeHTML(capitalize(message.player || 'player'))}</span><p>${escapeHTML(message.text)}</p></div>`;
    }).join('');
    els.onlineChatMessages.scrollTop = els.onlineChatMessages.scrollHeight;
}

async function submitOnlineChat() {
    const text = els.onlineChatInput?.value.trim();
    if (!text) return;
    try {
        await sendChatMessage(text);
        els.onlineChatInput.value = '';
    } catch (error) {
        els.onlineStatus.textContent = `Chat failed: ${error.message}`;
    }
}

async function runOnlineAction(action) {
    try {
        return await action();
    } catch (error) {
        els.onlineStatus.textContent = `Online error: ${error.message}`;
        return null;
    }
}

async function prepareOnline() {
    if (onlineReady) return onlineReady;
    onlineReady = initOnline(onlineHooks());
    return onlineReady;
}

let lastOnlineSnapshotJSON = '';
let onlineSyncPending = false;

function maybeSyncOnlineState() {
    if (applyingRemoteState || onlineSyncPending || els.playModeSelect.value !== 'online') return;
    const online = getOnlineState();
    if (online.room?.status !== 'playing' || online.room.turn !== online.playerColor) return;
    const state = game.exportState();
    const serialized = JSON.stringify(state);
    if (serialized === lastOnlineSnapshotJSON) return;
    onlineSyncPending = true;
    sendMove({
        type: 'state_update',
        mode: game.mode,
        moveNumber: game.moveNumber,
        boardState: state
    }).then(() => {
        lastOnlineSnapshotJSON = serialized;
    }).catch((error) => {
        els.onlineStatus.textContent = `Move was not synchronized: ${error.message}`;
    }).finally(() => {
        onlineSyncPending = false;
    });
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
    if (!hoverCoord || !isReversiMode(game.mode)) return null;
    if (isPhysicalCliffordMode(game.mode) && els.physicalActionSelect.value !== 'reversi') return null;
    if (isCFTReversiMode(game.mode) && els.cftActionSelect.value !== 'place') return null;
    return game.previewMove(
        hoverCoord,
        game.currentPlayer,
        isCFTReversiMode(game.mode) ? els.cftPrimarySelect.value : els.transformSelect.value
    );
}

function reversiPlacementActive() {
    return isReversiMode(game.mode)
        && (!isPhysicalCliffordMode(game.mode) || els.physicalActionSelect.value === 'reversi')
        && (!isCFTReversiMode(game.mode) || els.cftActionSelect.value === 'place');
}

function currentVirasoroPreview() {
    if (!hoverCoord || !isPhysicalVirasoroGoMode(game.mode)) return null;
    const action = els.cftActionSelect.value;
    if (action === 'place' || action === 'measure') return null;
    return game.previewVirasoroAction({
        action,
        coord: hoverCoord,
        direction: selectedCFTDirection(),
        player: game.currentPlayer
    });
}

function selectedCFTDirection() {
    return els.cftDirectionSelect.value.split(',').map(Number);
}

function cftChannelDisplay(stone) {
    if (!stone) return 'identity';
    return stone.hiddenChannel ? 'unmeasured' : (stone.channelLabel || 'identity');
}

function currentCFTPreview() {
    if (!hoverCoord || !isCFTReversiMode(game?.mode)) return null;
    const action = els.cftActionSelect.value;
    if (action === 'place' || action === 'measure') return null;
    return game.previewVirasoroAction({
        action,
        coord: hoverCoord,
        direction: selectedCFTDirection(),
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
    const online = getOnlineState();
    const onlineLocked = els.playModeSelect.value === 'online'
        && (online.room?.status !== 'playing' || online.playerColor !== game.currentPlayer);
    for (const button of [
        els.newGameButton,
        els.passButton,
        els.countButton,
        els.measureButton,
        els.unbraidHintButton,
        els.manualNoiseButton,
        els.manualTimeButton,
        els.dropAnyonButton
    ]) {
        if (button) button.disabled = onlineLocked || (button === els.newGameButton && Boolean(online.roomId));
    }

    renderBoard();
    renderStats();
    renderCFTObservablePanel();
    renderQECObservablePanel();
    renderStabilizerObservablePanel();
    renderLegend();
    renderTimePanel();
    renderHistory();
    renderBraidEventLog();
    renderStochasticLog();
    renderExport();
    maybeSyncOnlineState();
}

function renderQECObservablePanel() {
    if (!els.qecObservablePanel) return;
    const exported = game?.physicalProblem?.id === 'toric_code_memory_unbraid'
        ? game.physicalProblem.export(game)
        : null;
    els.qecObservablePanel.hidden = !exported;
    if (!exported) return;
    const observables = exported.finalObservables;
    els.qecTotalCharge.textContent = observables.totalFusionCharge;
    els.qecLogicalSector.textContent = observables.logicalSector;
    els.qecMemoryState.textContent = observables.topologicalMemoryAlive ? 'Alive' : 'Lost';
    els.qecVacuumRecovery.textContent = exported.answer.vacuumRecovery ? 'Recovered' : 'No';
    els.qecAverageBraidLength.textContent = formatNumber(observables.averageBraidWordLength);
    els.qecMaxBraidLength.textContent = String(observables.maxBraidWordLength);
    els.qecUnbraidSuccess.textContent = String(observables.numberOfSuccessfulUnbraids);
    els.qecUnbraidFail.textContent = String(observables.numberOfFailedUnbraids);
    els.qecObservableSummary.textContent = `e ${observables.numE}, m ${observables.numM}, psi ${observables.numPsi}; winding (${observables.windingX},${observables.windingY}); ${exported.answer.finalAnswerLabel.replaceAll('_', ' ')}; lifetime ${exported.answer.memoryLifetime}.`;
}

function renderStabilizerObservablePanel() {
    if (!els.stabilizerObservablePanel) return;
    const exported = game?.physicalProblem?.id === 'stabilizer_pauli_recovery'
        ? game.physicalProblem.export(game)
        : null;
    els.stabilizerObservablePanel.hidden = !exported;
    if (!exported) return;
    const observables = exported.finalObservables;
    const answer = exported.finalAnswer;
    els.stabilizerSyndromeWeight.textContent = String(observables.syndromeWeight);
    els.stabilizerViolationCount.textContent =
        `${observables.stabilizerViolations} (X ${observables.localXCheckViolations}, Z ${observables.localZCheckViolations})`;
    els.stabilizerLogicalSector.textContent =
        `X${observables.logicalSector.x} Z${observables.logicalSector.z}`;
    els.stabilizerGlobalParity.textContent =
        `${observables.globalPauliParity.sign > 0 ? '+' : '-'}${observables.globalPauliParity.label}`;
    els.stabilizerConflictCount.textContent = String(observables.commutationConflictCount);
    els.stabilizerAncillaCount.textContent = String(observables.numberOfAncillas);
    els.stabilizerMeasurementErrors.textContent = String(observables.measurementErrors);
    els.stabilizerVacuumState.textContent = observables.vacuumRecovered ? 'Recovered' : 'Not recovered';
    els.stabilizerObservableSummary.textContent =
        `${answer.logicalErrorOccurred ? 'Logical error detected.' : 'Logical sector stable.'}`
        + ` ${answer.nonCliffordResourcesUsed ? 'Non-Clifford resources used.' : 'Clifford-only recovery.'}`;
}

function renderCFTObservablePanel() {
    if (!els.cftObservablePanel) return;
    const visible = isCFTMode(game?.mode);
    els.cftObservablePanel.hidden = !visible;
    if (!visible) return;
    const observables = game.computeCFTObservables();
    const physicalExport = game?.physicalProblem?.id === 'cft_conformal_block_observables'
        ? game.physicalProblem.export(game)
        : null;
    const identity = observables.conformalBlockWeights.identity || 0;
    const epsilon = observables.conformalBlockWeights.epsilon || 0;
    els.cftIdentityBlockMeter.value = identity;
    els.cftEpsilonBlockMeter.value = epsilon;
    els.cftIdentityBlockValue.textContent = identity.toFixed(3);
    els.cftEpsilonBlockValue.textContent = epsilon.toFixed(3);
    const strongest = observables.strongestCorrelations?.[0];
    const channels = {};
    for (const cluster of observables.OPEClusters || []) {
        for (const channel of cluster.channelLabels || []) {
            channels[channel] = (channels[channel] || 0) + 1;
        }
    }
    els.cftObservableModel.textContent = observables.cftModel === 'free_boson_CFT'
        ? 'Free Boson CFT'
        : 'Ising CFT';
    els.cftObservableCharge.textContent = formatNumber(observables.centralCharge);
    els.cftObservableDominant.textContent = observables.dominantConformalBlock;
    els.cftObservableEntropy.textContent = formatNumber(observables.entanglementEntropyEstimate);
    els.cftObservableCorrelation.textContent = strongest
        ? `${formatNumber(strongest.estimate)} (${strongest.pair.join(' / ')})`
        : 'not available';
    els.cftObservableChannels.textContent = Object.entries(channels)
        .map(([channel, count]) => `${channel} ${count}`)
        .join(', ') || 'identity 0';
    els.cftObservableAnomalies.textContent = String(observables.centralChargeAnomalyEvents.length);
    els.cftObservableVacuum.textContent = (
        physicalExport?.answer?.vacuumBlockDominates
        ?? observables.dominantConformalBlock === 'identity'
    ) ? 'Yes' : 'No';
    const crossRatio = observables.fourPointCrossRatio == null
        ? 'not available'
        : formatNumber(observables.fourPointCrossRatio);
    els.cftObservableSummary.textContent = `Dominant ${observables.dominantConformalBlock}; cross-ratio ${crossRatio}; entropy ${formatNumber(observables.entanglementEntropyEstimate)}; mutual information ${formatNumber(observables.mutualInformationEstimate)}; wall ${observables.domainWallLength}; anomalies ${observables.centralChargeAnomalyEvents.length}.`;
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
    const legalReversi = reversiPlacementActive()
        ? new Set(game.legalMoves(
            game.currentPlayer,
            isCFTReversiMode(game.mode) ? els.cftPrimarySelect.value : els.transformSelect.value
        ).map((move) => coordKey(move.coord)))
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
    const cftPreview = currentCFTPreview();
    const cftAffected = new Set((cftPreview?.affected || []).map((item) => item.key));
    const legalGoTargets = isGoMode(game.mode)
        ? new Set(isCliffordGoMode(game.mode) || els.cftActionSelect.value === 'place'
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
        const goStone = isGoMode(game.mode) ? game.getStone(coord) : null;
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
        if (cftAffected.has(key)) cell.classList.add('stress-preview');
        if (isCFTReversiMode(game.mode) && selectedCFTCoords.some((entry) => coordKey(entry) === key)) {
            cell.classList.add('cft-selected-region');
        }
        if (game.mode === 'anyon_jump' && game.isFusionSite(coord)) cell.classList.add('fusion-site');
        if (isPhysicalVirasoroGoMode(game.mode)) {
            const stress = game.stressAt(coord);
            if (stress.stress > 0) {
                cell.classList.add('stressed');
                cell.style.setProperty('--stress-level', String(stress.stress));
            }
        }
        if (isCFTReversiMode(game.mode)) {
            const stress = game.stressAt(coord);
            if (stress.stress > 0) {
                cell.classList.add('stressed');
                cell.style.setProperty('--stress-level', String(stress.stress));
            }
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
        cell.addEventListener('dblclick', (event) => {
            event.preventDefault();
            handleCellDoubleClick(coord);
        });

        if (isCFTReversiMode(game.mode)) renderCFTStone(cell, coord);
        else if (isReversiMode(game.mode)) renderReversiStone(cell, coord);
        else if (game.mode === 'anyon_jump') renderAnyonToken(cell, coord);
        else renderGoStone(cell, coord);

        if (isCFTMode(game.mode)) renderStress(cell, coord);

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
    if (reversiPlacementActive()) {
        const signature = [
            game.topology.name,
            game.topology.sizes.join('x'),
            game.moveNumber,
            game.currentPlayer,
            isCFTReversiMode(game.mode) ? els.cftPrimarySelect.value : els.transformSelect.value
        ].join(':');
        if (legalReversiCache.signature !== signature) {
            legalReversiCache = {
                signature,
                keys: game.legalMoves(
                    game.currentPlayer,
                    isCFTReversiMode(game.mode) ? els.cftPrimarySelect.value : els.transformSelect.value
                )
                    .map((move) => coordKey(move.coord))
            };
        }
        legalReversi = legalReversiCache.keys;
    }
    const legalAnyon = game.mode === 'anyon_jump' && selectedToken
        ? game.legalActionsForToken(selectedToken)
        : [];
    const virasoroPreview = currentVirasoroPreview();
    const cftPreview = currentCFTPreview();
    const legalGo = isGoMode(game.mode)
        ? (isCliffordGoMode(game.mode) || els.cftActionSelect.value === 'place'
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
        affectedKeys: new Set([
            ...(virasoroPreview?.affected || []).map((item) => item.key),
            ...(cftPreview?.affected || []).map((item) => item.key),
            ...selectedCFTCoords.map(coordKey),
            ...(selectedPhysicalCoord ? [coordKey(selectedPhysicalCoord)] : [])
        ]),
        trailKeys: braidTrailCells(),
        physicsView: els.physicsViewSelect.value,
        paths: game.mode === 'anyon_jump'
            ? [
                ...legalAnyon.map((action) => action.path),
                ...(game.braidEventLog || []).map((event) => event.path)
            ]
            : isCFTReversiMode(game.mode) && game.lastFlippedPath?.length
                ? [game.lastFlippedPath]
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
    const legalReversi = reversiPlacementActive()
        ? new Set(game.legalMoves(
            game.currentPlayer,
            isCFTReversiMode(game.mode) ? els.cftPrimarySelect.value : els.transformSelect.value
        ).map((move) => coordKey(move.coord)))
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
    const cftPreview = currentCFTPreview();
    const cftAffected = new Set((cftPreview?.affected || []).map((item) => item.key));
    const legalGoTargets = isGoMode(game.mode)
        ? new Set(isCliffordGoMode(game.mode) || els.cftActionSelect.value === 'place'
            ? game.legalMoves().map(coordKey)
            : (hoverCoord && virasoroPreview?.ok ? [coordKey(hoverCoord)] : []))
        : new Set();

    els.board.querySelectorAll('.cell[data-key]').forEach((cell) => {
        const key = cell.dataset.key;
        const coord = JSON.parse(cell.dataset.coord);
        const token = game.mode === 'anyon_jump' ? game.tokenAt(coord) : null;
        const goStone = isGoMode(game.mode) ? game.getStone(coord) : null;
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
        cell.classList.toggle('stress-preview', virasoroAffected.has(key) || cftAffected.has(key));
        cell.classList.toggle('cft-selected-region', selectedCFTCoords.some((entry) => coordKey(entry) === key));
        cell.classList.toggle('fusion-site', game.mode === 'anyon_jump' && game.isFusionSite(coord));
        const stress = isCFTMode(game.mode) ? game.stressAt(coord) : null;
        cell.classList.toggle('stressed', Boolean(stress?.stress > 0));
        cell.classList.toggle('unstable-group', false);
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
    if (stone.isAncilla) node.classList.add('ancilla');
    if (stone.nonStabilizerApprox) node.classList.add('non-stabilizer');
    if (stone.revealed === false || stone.pauliLabel === 'unknown') node.classList.add('hidden');
    const isPhysical = isPhysicalCliffordMode(game.mode);
    const display = isPhysical
        ? (els.physicsViewSelect.value === 'physics'
            ? game.physicalLabel(stone)
            : stone.isAncilla ? 'A' : stone.color === 'black' ? 'B' : 'W')
        : pauliDisplay(stone);
    node.textContent = stone.revealed === false || stone.pauliLabel === 'unknown' ? '?' : display;
    node.title = isPhysical
        ? `${stone.color} sector; ${game.physicalLabel(stone)}; Pauli ${stone.pauliLabel}; sign ${stone.pauliSign}; phase ${stone.phase}; ancilla ${stone.isAncilla ? stone.ancillaBasis : 'no'}; non-stabilizer ${stone.nonStabilizerApprox ? 'yes' : 'no'}; last ${stone.lastUpdate?.action || 'setup'}`
        : `${stone.color} ${pauliDisplay(stone)}; ${game.time?.tooltipForEntity(stone) || ''}`;
    cell.append(node);
}

function renderCFTStone(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone cft-primary-stone ${stone.color}`;
    node.textContent = game.primaryLabel(stone);
    if (stone.hiddenChannel) node.classList.add('hidden-channel');
    const stress = game.stressAt(coord);
    node.title = `${stone.color} ${game.primaryLabel(stone)}; h=${formatNumber(stone.h)}, hbar=${formatNumber(stone.hbar)}; phase=${formatNumber(stone.phaseAngle)}; channel=${cftChannelDisplay(stone)}; T=${formatNumber(stress.stress)}; last=${stone.lastUpdate?.action || 'setup'}`;
    const channel = document.createElement('span');
    channel.className = 'cft-badge';
    channel.textContent = cftChannelDisplay(stone);
    node.append(channel);
    cell.append(node);
}

function renderGoStone(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone go-stone ${stone.color}`;
    const groupInfo = game.groupInfoAt(coord);
    const cft = document.createElement('span');
    cft.className = 'cft-badge';
    cft.textContent = game.primaryLabel?.(stone)
        || (groupInfo ? `h=${formatNumber(groupInfo.h)}` : 'h=0');
    node.append(cft);
    node.title = groupInfo
        ? `${stone.color} ${game.primaryLabel?.(stone) || 'primary'}; h=${formatNumber(stone.h)}, hbar=${formatNumber(stone.hbar)}; liberties=${groupInfo.liberties.size}; channel=${cftChannelDisplay(stone)}`
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
    if (isCFTReversiMode(game.mode)) {
        const stone = game.getStone(coord);
        const stress = game.stressAt(coord);
        return stone
            ? `${game.topology.displayCoord(coord)} ${game.primaryLabel(stone)}; h=${stone.h}, hbar=${stone.hbar}; phase=${stone.phaseAngle}; channel=${cftChannelDisplay(stone)}; T=${stress.stress.toFixed(2)}`
            : `${game.topology.displayCoord(coord)} identity/empty; T=${stress.stress.toFixed(2)}`;
    }
    if (isPhysicalVirasoroGoMode(game.mode)) {
        const stress = game.stressAt(coord);
        const groupInfo = goStone ? game.groupInfoAt(coord) : null;
        const stressText = `T=${stress.stress.toFixed(2)}${stress.owner ? ` owner=${stress.owner}` : ''}`;
        if (groupInfo) {
            const channel = cftChannelDisplay(goStone);
            return `${game.topology.displayCoord(coord)} ${goStone.color} ${game.primaryLabel(goStone)}; h=${goStone.h}, hbar=${goStone.hbar}; channel=${channel}; group liberties=${groupInfo.liberties.size}; ${stressText}`;
        }
        return `${game.topology.displayCoord(coord)} empty; ${stressText}`;
    }
    if (isPhysicalCliffordMode(game.mode)) {
        const stone = game.getStone(coord);
        return stone
            ? `${game.topology.displayCoord(coord)} ${game.physicalLabel(stone)}; owner=${stone.color}; pauli=${stone.pauliLabel}; sign=${stone.pauliSign}; phase=${stone.phase}; ancilla=${stone.isAncilla ? stone.ancillaBasis : 'no'}; last=${stone.lastUpdate?.action || 'setup'}`
            : `${game.topology.displayCoord(coord)} empty / identity I`;
    }
    if (isCliffordGoMode(game.mode)) {
        const stone = game.getStone(coord);
        return stone
            ? `${game.topology.displayCoord(coord)} ${stone.color} ${game.primaryLabel(stone)}; liberties=${game.groupInfoAt(coord)?.liberties.size || 0}`
            : `${game.topology.displayCoord(coord)} empty Clifford-Go vertex`;
    }
    return timeState
        ? `${game.topology.displayCoord(coord)} stress=${timeState.stress.toFixed(2)} potential=${timeState.potential.toFixed(2)} charge=${timeState.charge.toFixed(2)}`
        : game.topology.displayCoord(coord);
}

function handlePhysicalCliffordClick(coord) {
    const action = els.physicalActionSelect.value;
    let result = null;
    if (action === 'reversi') {
        result = game.place(coord, {
            pauliLabel: els.physicalPauliSelect.value,
            phase: Number(els.physicalPhaseSelect.value),
            transform: els.transformSelect.value
        });
    } else if (action === 'prepare_ancilla') {
        result = game.prepareAncilla(coord, els.ancillaBasisSelect.value);
    } else if (action === 'measure') {
        result = game.measurePhysical(
            coord,
            els.physicalMeasurementSelect.value,
            els.physicalMeasurementBasisSelect.value
        );
    } else if (action === 'discard_ancilla') {
        result = game.discardAncilla(coord);
    } else if (action === 'phase_action') {
        result = game.phaseAction(coord, els.physicalPhaseGateSelect.value, {
            theta: Number(els.phaseKickThetaInput.value)
        });
    } else if (action === 'entangle_ancilla') {
        if (!selectedPhysicalCoord) {
            if (!game.getStone(coord)) {
                els.statusText.textContent = 'Choose an occupied control site first.';
                return;
            }
            selectedPhysicalCoord = [...coord];
            els.statusText.textContent = `Control selected at ${game.topology.displayCoord(coord)}. Choose the occupied target.`;
            render();
            return;
        }
        if (coordKey(selectedPhysicalCoord) === coordKey(coord)) {
            selectedPhysicalCoord = null;
            els.statusText.textContent = 'Entangling selection cleared.';
            render();
            return;
        }
        result = game.entangleAncilla(selectedPhysicalCoord, coord, els.entangleGateSelect.value);
        selectedPhysicalCoord = null;
    }

    if (!result) return;
    if (result.ok) {
        hoverCoord = null;
        selectedPhysicalCoord = null;
        const affected = result.event.affectedVertices?.length
            ?? (result.event.flipped?.length ? result.event.flipped.length + 1 : 1);
        els.statusText.textContent = `${capitalize(result.event.type || result.event.action)} completed on ${affected} site${affected === 1 ? '' : 's'}.`;
    } else {
        els.statusText.textContent = result.error;
    }
    render();
}

function handleCFTReversiClick(coord) {
    const action = els.cftActionSelect.value;
    let result = null;
    if (action === 'place') {
        result = game.place(coord, {
            primaryType: els.cftPrimarySelect.value,
            player: game.currentPlayer
        });
    } else if (action === 'measure') {
        const measurement = els.cftMeasurementSelect.value;
        if (measurement === 'four_point_block') {
            const key = coordKey(coord);
            const existing = selectedCFTCoords.findIndex((entry) => coordKey(entry) === key);
            if (existing >= 0) selectedCFTCoords.splice(existing, 1);
            else selectedCFTCoords.push([...coord]);
            if (selectedCFTCoords.length < 4) {
                els.statusText.textContent = `Selected ${selectedCFTCoords.length}/4 sigma sites for the four-point block.`;
                render();
                return;
            }
            result = game.measureFourPointBlock(selectedCFTCoords.slice(0, 4), game.currentPlayer);
        } else {
            const region = game.lastFlippedPath?.length
                && ['line_parity', 'region_entropy'].includes(measurement)
                ? game.lastFlippedPath
                : [coord];
            if (measurement === 'line_parity') result = game.measureLineParity(region, game.currentPlayer);
            else if (measurement === 'ope_channel') result = game.measureOPEChannel([coord], game.currentPlayer);
            else if (measurement === 'region_entropy') result = game.measureRegionEntropy(region, game.currentPlayer);
            else result = game.measureStress([coord], game.currentPlayer);
        }
    } else {
        result = game.applyVirasoroAction({
            action,
            coord,
            direction: selectedCFTDirection(),
            player: game.currentPlayer
        });
    }

    if (!result) return;
    if (result.ok) {
        hoverCoord = null;
        selectedCFTCoords = [];
        if (action === 'place') {
            els.statusText.textContent = `Placed ${els.cftPrimarySelect.value}; transformed ${result.event.flipped.length} interval site${result.event.flipped.length === 1 ? '' : 's'}.`;
        } else if (action === 'measure') {
            const measurement = result.measurement;
            const reported = typeof measurement.reported === 'number'
                ? formatNumber(measurement.reported)
                : String(measurement.reported);
            els.statusText.textContent = `${measurement.type.replaceAll('_', ' ')}: ${reported}${measurement.error ? ' (measurement error)' : ''}.`;
        } else {
            els.statusText.textContent = `${action} changed stress on ${result.event.affected.length} site${result.event.affected.length === 1 ? '' : 's'}${result.event.VirasoroActions?.[0]?.anomaly ? '; central-charge anomaly marker added' : ''}.`;
        }
    } else {
        els.statusText.textContent = result.error;
    }
    render();
}

function handleCFTGoClick(coord) {
    const action = els.cftActionSelect.value;
    let result = null;
    let message = '';
    if (action === 'place') {
        result = game.tryPlay(coord, game.currentPlayer, {
            primaryType: els.cftPrimarySelect.value
        });
    } else if (action === 'measure') {
        const measurement = els.cftMeasurementSelect.value;
        const required = ['four_point_block', 'dominant_block'].includes(measurement)
            ? 4
            : measurement === 'two_point' ? 2 : 1;
        const key = coordKey(coord);
        const existing = selectedCFTCoords.findIndex((entry) => coordKey(entry) === key);
        if (existing >= 0) selectedCFTCoords.splice(existing, 1);
        else selectedCFTCoords.push([...coord]);
        if (selectedCFTCoords.length < required) {
            els.statusText.textContent = `Selected ${selectedCFTCoords.length}/${required} CFT site${required === 1 ? '' : 's'}.`;
            render();
            return;
        }
        const selected = selectedCFTCoords.slice(0, required);
        if (measurement === 'two_point') result = game.measureTwoPoint(selected[0], selected[1]);
        else if (measurement === 'four_point_block') result = game.measureFourPoint(selected);
        else if (measurement === 'dominant_block') result = game.measureDominantBlock(selected);
        else if (measurement === 'ope_channel') result = game.measureOPEChannel(selected);
        else if (measurement === 'region_entropy') result = game.measureRegionEntropy(selected);
        else result = game.measureCFT('stress', selected);
    } else {
        result = game.applyVirasoroAction({
            action,
            coord,
            direction: selectedCFTDirection(),
            player: game.currentPlayer
        });
    }
    if (result?.ok) {
        hoverCoord = null;
        selectedCFTCoords = [];
        if (action === 'place') {
            message = `Inserted ${els.cftPrimarySelect.value}; captured ${result.captured || 0} primary field${result.captured === 1 ? '' : 's'}.`;
        } else if (action === 'measure') {
            const reported = typeof result.measurement.reported === 'number'
                ? formatNumber(result.measurement.reported)
                : String(result.measurement.reported);
            message = `${result.measurement.type.replaceAll('_', ' ')}: ${reported}${result.measurement.error ? ' (measurement error)' : ''}.`;
        } else {
            message = `${action} deformed ${result.event.affected.length} graph site${result.event.affected.length === 1 ? '' : 's'}.`;
        }
    } else if (result) {
        message = result.error;
    }
    render();
    if (message) {
        els.statusText.textContent = message;
        statusHoldUntil = Date.now() + 1800;
    }
}

function handleCellClick(coord) {
    if (els.playModeSelect.value === 'online') {
        const online = getOnlineState();
        if (online.room?.status !== 'playing') {
            els.statusText.textContent = 'Wait for the online room to connect both players.';
            return;
        }
        if (online.playerColor !== game.currentPlayer) {
            els.statusText.textContent = `Waiting for ${game.currentPlayer}.`;
            return;
        }
    }
    if (isPhysicalCliffordMode(game.mode)) {
        handlePhysicalCliffordClick(coord);
        return;
    }
    if (isCFTReversiMode(game.mode)) {
        handleCFTReversiClick(coord);
        return;
    }
    if (isCliffordGoMode(game.mode)) {
        const result = game.tryPlay(coord, game.currentPlayer, {
            pauliLabel: els.pauliSelect.value
        });
        els.statusText.textContent = result.ok
            ? `Inserted ${game.primaryLabel(game.getStone(coord))}; captured ${result.captured || 0}.`
            : result.error;
        if (result.ok) hoverCoord = null;
        render();
        return;
    }
    if (isPhysicalVirasoroGoMode(game.mode)) {
        handleCFTGoClick(coord);
        return;
    }
    if (isReversiMode(game.mode)) {
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
        if (game.config?.setupMode === 'excitation' && els.anyonActionSelect.value === 'recombine') {
            const result = game.dropAnyon(token.id, game.currentPlayer);
            els.statusText.textContent = result.ok
                ? `${capitalize(result.event.player)} recombined ${result.event.tokenId}; recovered ${formatNumber(result.event.recovered)} energy.`
                : result.error;
            if (result.ok) selectedToken = '';
            render();
            return;
        }
        selectedToken = token.id;
        els.statusText.textContent = `Selected ${token.id} (${token.anyonType}).`;
        render();
        return;
    }
    if (!token && game.config?.setupMode === 'excitation' && els.anyonActionSelect.value === 'excite') {
        syncAnyonExcitationTypeOptions();
        const selectedType = els.anyonExcitationTypeSelect.value;
        const result = game.exciteAnyon(coord, selectedType, game.currentPlayer);
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
        els.statusText.textContent = game.config?.setupMode === 'excitation'
            ? 'Use Turn Action = Excite Anyon to create a chosen particle, Move / Braid to move, or Recombine / Recover / double-click your anyon to regain energy.'
            : 'Select one of your anyons first.';
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

function handleCellDoubleClick(coord) {
    if (game.mode !== 'anyon_jump' || game.config?.setupMode !== 'excitation') return;
    const token = game.tokenAt(coord);
    if (!token || token.owner !== game.currentPlayer) return;
    const result = game.dropAnyon(token.id, game.currentPlayer);
    els.statusText.textContent = result.ok
        ? `${capitalize(result.event.player)} recombined ${result.event.tokenId}; recovered ${formatNumber(result.event.recovered)} energy${result.event.entanglement?.length ? `; ${result.event.entanglement.length} channel decohered` : ''}.`
        : result.error;
    if (result.ok) selectedToken = '';
    render();
}

function measureTarget() {
    if (isPhysicalVirasoroGoMode(game.mode)) {
        els.statusText.textContent = 'Choose Measure in Turn Action, then select the required CFT sites on the board.';
        return;
    }
    if (isReversiMode(game.mode)) {
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
    if (result?.applied && isReversiMode(game.mode)) game.recordPosition('manual-time');
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
    els.blackCountLabel.textContent = 'Black';
    els.whiteCountLabel.textContent = 'White';
    els.blackBraidLabel.textContent = 'Braid Black';
    els.whiteBraidLabel.textContent = 'Braid White';
    if (isPhysicalCliffordMode(game.mode)) {
        const counts = game.counts();
        const observables = game.computePhysicalObservables();
        els.blackCountLabel.textContent = 'Black / + Sector';
        els.whiteCountLabel.textContent = 'White / - Sector';
        els.blackBraidLabel.textContent = 'Check Violations';
        els.whiteBraidLabel.textContent = 'Ancillas';
        els.blackCount.textContent = `${counts.black} / +${observables.signDistribution.positive}`;
        els.whiteCount.textContent = `${counts.white} / -${observables.signDistribution.negative}`;
        els.blackBraid.textContent = observables.stabilizerViolations;
        els.whiteBraid.textContent = observables.numberOfAncillas;
        return;
    }
    if (isCFTReversiMode(game.mode)) {
        const counts = game.counts();
        const observables = game.computeCFTObservables();
        els.blackCountLabel.textContent = 'Positive Domain';
        els.whiteCountLabel.textContent = 'Negative Domain';
        els.blackBraidLabel.textContent = 'Wall Length';
        els.whiteBraidLabel.textContent = 'Anomalies';
        els.blackCount.textContent = counts.black;
        els.whiteCount.textContent = counts.white;
        els.blackBraid.textContent = observables.domainWallLength;
        els.whiteBraid.textContent = observables.centralChargeAnomalyEvents.length;
        return;
    }
    if (isReversiMode(game.mode)) {
        const counts = game.counts();
        els.blackCount.textContent = counts.black;
        els.whiteCount.textContent = counts.white;
        els.blackBraid.textContent = '0';
        els.whiteBraid.textContent = '0';
        return;
    }
    if (isGoMode(game.mode)) {
        const counts = game.counts();
        const observables = game.computeCFTObservables?.();
        els.blackCountLabel.textContent = isCliffordGoMode(game.mode) ? 'Black Pauli Stones' : 'Black Primaries';
        els.whiteCountLabel.textContent = isCliffordGoMode(game.mode) ? 'White Pauli Stones' : 'White Primaries';
        els.blackBraidLabel.textContent = isCliffordGoMode(game.mode) ? 'Black Captures' : 'Total Weight';
        els.whiteBraidLabel.textContent = isCliffordGoMode(game.mode) ? 'White Captures' : 'Anomalies';
        els.blackCount.textContent = `${counts.black} (${game.captures.black})`;
        els.whiteCount.textContent = `${counts.white} (${game.captures.white})`;
        els.blackBraid.textContent = isCliffordGoMode(game.mode)
            ? game.captures.black
            : formatNumber(observables.totalConformalWeight);
        els.whiteBraid.textContent = isCliffordGoMode(game.mode)
            ? game.captures.white
            : observables.centralChargeAnomalyEvents.length;
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
    if (Date.now() < statusHoldUntil) return;
    if (isPhysicalCliffordMode(game.mode)) {
        const action = els.physicalActionSelect.value;
        const observables = game.computePhysicalObservables();
        if (action === 'entangle_ancilla' && selectedPhysicalCoord) {
            els.statusText.textContent = `Control ${game.topology.displayCoord(selectedPhysicalCoord)} selected. Choose an occupied target for ${els.entangleGateSelect.value}.`;
        } else if (action === 'reversi') {
            const preview = currentReversiPreview();
            const moves = game.legalMoves(game.currentPlayer, els.transformSelect.value).length;
            els.statusText.textContent = preview?.legal
                ? `${capitalize(game.currentPlayer)} can flip ${preview.flips.length} physical site${preview.flips.length === 1 ? '' : 's'} with ${els.transformSelect.value}.`
                : `${capitalize(game.currentPlayer)}: ${moves} legal Reversi placement${moves === 1 ? '' : 's'}. Select another physical action when the state has no bracket.`;
        } else {
            const prompts = {
                prepare_ancilla: `Click an empty site to prepare ${els.ancillaBasisSelect.value}.`,
                entangle_ancilla: `Click an occupied control, then target, for ${els.entangleGateSelect.value}.`,
                measure: `Click a site for ${els.physicalMeasurementSelect.value} in the ${els.physicalMeasurementBasisSelect.value} basis.`,
                discard_ancilla: 'Click an ancilla to discard it.',
                phase_action: `Click an occupied site to apply ${els.physicalPhaseGateSelect.value}.`
            };
            els.statusText.textContent = `${prompts[action] || 'Choose a physical action.'} Violations ${observables.stabilizerViolations}; walls ${observables.domainWallLength}; ancillas ${observables.numberOfAncillas}.`;
        }
        return;
    }
    if (isCFTReversiMode(game.mode)) {
        const action = els.cftActionSelect.value;
        const observables = game.computeCFTObservables();
        if (action === 'place') {
            const preview = currentReversiPreview();
            const moves = game.legalMoves(game.currentPlayer, els.cftPrimarySelect.value).length;
            els.statusText.textContent = preview?.legal
                ? `${capitalize(game.currentPlayer)} brackets ${preview.flips.length} site${preview.flips.length === 1 ? '' : 's'} as a discrete CFT interval.`
                : `${capitalize(game.currentPlayer)} has ${moves} legal ${els.cftPrimarySelect.value} insertion${moves === 1 ? '' : 's'}.`;
        } else if (action === 'measure') {
            const type = els.cftMeasurementSelect.value.replaceAll('_', ' ');
            els.statusText.textContent = type === 'four point block'
                ? `Select four sigma insertions (${selectedCFTCoords.length}/4).`
                : `Click a site to measure ${type}; line and entropy measurements use the latest interval when available.`;
        } else {
            const preview = currentCFTPreview();
            els.statusText.textContent = hoverCoord
                ? (preview?.ok
                    ? `${action} affects ${preview.affected.length} stress site${preview.affected.length === 1 ? '' : 's'}.`
                    : preview?.error || `Choose a valid ${action} target.`)
                : `${capitalize(game.currentPlayer)} may apply ${action}. Current block: ${observables.dominantConformalBlock}; entropy estimate ${formatNumber(observables.entanglementEntropyEstimate)}.`;
        }
        return;
    }
    if (isReversiMode(game.mode)) {
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
    if (isCliffordGoMode(game.mode)) {
        els.statusText.textContent = `${capitalize(game.currentPlayer)} places ${els.pauliSelect.value}. Go captures use graph liberties; Pauli labels are carried by surviving stones.`;
        if (game.scoringPending) {
            els.statusText.textContent = 'Two passes made. Each player can press Count to agree and finish scoring.';
        }
        return;
    }
    if (isPhysicalVirasoroGoMode(game.mode)) {
        const action = els.cftActionSelect.value;
        const observables = game.computeCFTObservables();
        if (hoverCoord && !['place', 'measure'].includes(action)) {
            const preview = currentVirasoroPreview();
            els.statusText.textContent = preview?.ok
                ? `${action} will affect ${preview.affected.length} stress vertex${preview.affected.length === 1 ? '' : 'es'}.`
                : (preview?.error || `Choose a valid target for ${action}.`);
        } else if (action === 'place') {
            els.statusText.textContent = `${capitalize(game.currentPlayer)} inserts ${els.cftPrimarySelect.value}. Dominant block ${observables.dominantConformalBlock}; captures black ${game.captures.black}, white ${game.captures.white}.`;
        } else if (action === 'measure') {
            const required = ['four_point_block', 'dominant_block'].includes(els.cftMeasurementSelect.value)
                ? 4
                : els.cftMeasurementSelect.value === 'two_point' ? 2 : 1;
            els.statusText.textContent = `Select ${required} site${required === 1 ? '' : 's'} for ${els.cftMeasurementSelect.value.replaceAll('_', ' ')} (${selectedCFTCoords.length}/${required}).`;
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
            ? `${capitalize(game.currentPlayer)} energy ${formatNumber(game.energy?.[game.currentPlayer] || 0)}. Choose Excite and click empty vertex, or choose Recombine / double-click an owned anyon to recover energy.`
            : 'Select an anyon, then hop to a neighbor or jump over an occupied vertex.';
    }
}

function renderLegend() {
    const items = isPhysicalCliffordMode(game.mode)
        ? [
            els.physicsViewSelect.value === 'physics' ? 'Physics labels: coefficient and Pauli' : 'Game labels: owner sectors',
            'Black = positive sector; white = negative sector',
            'A_Z0, A_X+, A_magic: ancillas',
            'Phase is tracked modulo four',
            `Checks ${game.computePhysicalObservables().stabilizerViolations}; conflicts ${game.computePhysicalObservables().commutationConflictCount}`,
            game.nonCliffordResourcesUsed ? 'Non-Clifford resource used' : 'Stabilizer/Clifford resources only'
        ]
        : isCFTReversiMode(game.mode)
        ? [
            '+/- is the source or domain sign',
            '\u03c3 and \u03b5 are Ising CFT primary labels',
            'Gold outline: bracketed conformal interval',
            '? is a hidden OPE channel until measured',
            'T(v) is the discrete stress proxy',
            'Correlations, blocks, and entropy are graph estimators'
        ]
        : isReversiMode(game.mode)
        ? [
            phaseSignsEnabled() ? '+/- phase signs shown' : 'X,Y,Z Pauli labels',
            '? hidden until measured',
            'Gold outline: flip preview',
            'H/S transforms on flips',
            'Twisted seams apply H',
            'Virasoro mode evolves graph stress T(v)'
        ]
        : isPhysicalVirasoroGoMode(game.mode)
            ? [
                'Go captures still use graph liberties',
                '\u03c3, \u03b5, 1, or V labels are primary insertions',
                'T(v) is the approximate stress proxy',
                'Gold outline previews a conformal deformation',
                `Approximate ${els.cftModelSelect.value}; c=${Number(els.cftCentralChargeInput.value) || 0.5}; max N=${els.cftMaxModeSelect.value}`
            ]
            : isCliffordGoMode(game.mode)
                ? [
                    'Go captures use graph liberties',
                    '+X, +Y, and +Z are Pauli-labelled stones',
                    'Topology seams preserve the graph movement rules',
                    'Pass twice, then both players agree to count'
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
        if (isPhysicalCliffordMode(game.mode)) {
            const affected = event.affectedVertices?.length
                ?? (event.flipped?.length ? event.flipped.length + 1 : 0);
            const gates = event.gates?.length ? `; ${event.gates.join(', ')}` : '';
            const measurement = event.measurements?.[0];
            const measured = measurement
                ? `; measured ${measurement.reported}${measurement.error ? ' with error' : ''}`
                : '';
            item.textContent = `#${event.number} ${event.player} ${event.type}; affected ${affected}${gates}${measured}.`;
        } else if (isCFTReversiMode(game.mode)) {
            if (event.type === 'place') {
                item.textContent = `#${event.number} ${event.player} inserted ${event.placedStone.primaryType}; interval ${event.flippedPath.length}; OPE updates ${event.OPEUpdates.length}.`;
            } else if (event.type === 'virasoro') {
                const action = event.VirasoroActions?.[0];
                item.textContent = `#${event.number} ${event.player} ${action?.action || 'Virasoro action'} affected ${event.affected?.length || 0}${action?.anomaly ? '; anomaly marker' : ''}.`;
            } else if (event.type === 'measurement') {
                const measurement = event.measurements?.[0];
                const reported = typeof measurement?.reported === 'number'
                    ? formatNumber(measurement.reported)
                    : String(measurement?.reported ?? '');
                item.textContent = `#${event.number} ${event.player} measured ${measurement?.type}: ${reported}${measurement?.error ? ' with error' : ''}.`;
            } else {
                item.textContent = `#${event.number} ${event.player} ${event.type}.`;
            }
        } else if (event.type === 'measurement') {
            item.textContent = `measurement ${event.measurement.type}: ${event.measurement.reported}${event.measurement.error ? ' with error' : ''}.`;
        } else if (event.type === 'noise') {
            item.textContent = `${event.player} manual noise tick: ${event.noiseEvents} random event${event.noiseEvents === 1 ? '' : 's'}.`;
        } else if (event.type === 'pass') {
            item.textContent = `#${event.number} ${event.player || event.color} passed.`;
        } else if (isReversiMode(game.mode)) {
            const time = event.time?.applied ? `; t${event.time.after.tick} phase ${event.time.phase}` : '';
            item.textContent = `#${event.number} ${event.player} ${event.pauliLabel}@${event.coord.join(',')} flipped ${event.flipped.length}; winding (${event.winding.x},${event.winding.y})${time}.`;
        } else if (isGoMode(game.mode)) {
            if (event.type === 'play') {
                const inserted = isCliffordGoMode(game.mode)
                    ? `${event.pauliSign < 0 ? '-' : '+'}${event.pauliLabel || 'X'}`
                    : event.insertedPrimary?.primaryType || 'primary';
                item.textContent = `#${event.number} ${event.color} inserted ${inserted} at ${event.coord.join(',')}; captured ${event.captured}.`;
            } else if (event.type === 'virasoro') {
                item.textContent = `#${event.number} ${event.color} ${event.action} at ${event.coord?.join(',') || 'none'} affected ${event.affected?.length || 0}.`;
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
    if (!isGoMode(game?.mode)) return;
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
    els.cliffordAlgebraSetSelect,
    els.physicalInitialStateSelect,
    els.entanglementRangeSelect,
    els.entanglementDistanceInput,
    els.braidCancellationModeSelect,
    els.braidedPieceShieldSelect,
    els.captureRequiresUnbraidSelect,
    els.braidedPiecePenaltySelect,
    els.virasoroLayerSelect,
    els.physicalProblemSelect,
    els.physicalDomainWallThicknessInput,
    els.qecPairsEInput,
    els.qecPairsMInput,
    els.qecPairSeparationInput,
    els.stabilizerErrorDensityInput,
    els.stabilizerLogicalChecksSelect,
    els.stabilizerAncillaSelect,
    els.stabilizerPhaseKickSelect,
    els.stabilizerMaxTurnsInput,
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
for (const control of [
    els.cftInitialStateSelect,
    els.cftDomainWallThicknessInput,
    els.cftHiddenChannelSelect,
    els.cftMaxModeSelect,
    els.cftCentralChargeInput,
    els.cftTemperatureInput
]) {
    control.addEventListener('change', createGame);
}
els.cftModelSelect.addEventListener('change', () => {
    els.cftCentralChargeInput.value = els.cftModelSelect.value === 'free_boson_CFT' ? '1' : '0.5';
    createGame();
});
for (const control of [
    els.physicsViewSelect,
    els.physicalPauliSelect,
    els.physicalPhaseSelect,
    els.ancillaBasisSelect,
    els.entangleGateSelect,
    els.physicalMeasurementSelect,
    els.physicalMeasurementBasisSelect,
    els.phaseKickThetaInput
]) {
    control.addEventListener('change', render);
}
els.physicalActionSelect.addEventListener('change', () => {
    selectedPhysicalCoord = null;
    render();
});
els.physicalPhaseGateSelect.addEventListener('change', render);
els.virasoroActionSelect.addEventListener('change', render);
els.virasoroDirectionSelect.addEventListener('change', render);
els.cftActionSelect.addEventListener('change', () => {
    selectedCFTCoords = [];
    syncModeControls();
    render();
});
els.cftPrimarySelect.addEventListener('change', render);
els.cftDirectionSelect.addEventListener('change', render);
els.cftMeasurementSelect.addEventListener('change', () => {
    selectedCFTCoords = [];
    syncModeControls();
    render();
});
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
els.playModeSelect.addEventListener('change', async () => {
    const online = els.playModeSelect.value === 'online';
    syncOnlineModeVisibility();
    if (online) {
        const ready = await prepareOnline();
        if (!ready.ok) els.onlineStatus.textContent = ready.error || 'Online rooms are not available yet.';
    } else {
        await leaveRoom();
        setOnlineConfigurationLocked(false);
        updateOnlineConnectionUI();
        els.onlineStatus.textContent = 'Local pass and play.';
    }
});
els.onlineCreateButton.addEventListener('click', async () => {
    const ready = await runOnlineAction(() => prepareOnline());
    if (!ready?.ok) return;
    const result = await runOnlineAction(() => createPrivateRoom(game.exportState()));
    if (!result) return;
    els.onlineRoomInput.value = result.roomId;
});
els.onlineJoinButton.addEventListener('click', async () => {
    const ready = await runOnlineAction(() => prepareOnline());
    if (!ready?.ok) return;
    await runOnlineAction(() => joinPrivateRoom(els.onlineRoomInput.value));
});
els.onlineFindButton.addEventListener('click', async () => {
    const ready = await runOnlineAction(() => prepareOnline());
    if (!ready?.ok) return;
    const result = await runOnlineAction(() => findMatch(game.exportState()));
    if (!result) return;
    els.onlineRoomInput.value = result.roomId;
});
els.onlineReconnectButton.addEventListener('click', async () => {
    const ready = await runOnlineAction(() => prepareOnline());
    if (!ready?.ok) return;
    await runOnlineAction(() => reconnectRoom());
});
els.onlineLeaveButton.addEventListener('click', async () => {
    await runOnlineAction(() => leaveRoom());
    setOnlineConfigurationLocked(false);
    updateOnlineConnectionUI();
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    history.replaceState(null, '', url);
});
els.copyLinkButton?.addEventListener('click', async () => {
    if (!els.shareLinkInput?.value) return;
    await navigator.clipboard?.writeText(els.shareLinkInput.value);
    els.copyLinkButton.textContent = 'Copied';
    window.setTimeout(() => { els.copyLinkButton.textContent = 'Copy'; }, 1000);
});
els.onlineChatSendButton.addEventListener('click', submitOnlineChat);
els.onlineChatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submitOnlineChat();
});
els.passButton.addEventListener('click', () => {
    if (isReversiMode(game?.mode)) {
        game.pass();
        render();
    } else if (isGoMode(game?.mode)) {
        const result = game.pass(game.currentPlayer);
        els.statusText.textContent = result.ok ? `${capitalize(result.event.color)} passed.` : result.error;
        render();
    }
});
els.exportButton.addEventListener('click', exportJson);
window.addEventListener('pageshow', () => {
    syncOnlineModeVisibility();
    if (!game) createGame();
    else if (els.topologySelect.value !== game.topology.name) createGame();
    else render();
});

createGame();
syncOnlineModeVisibility();

const sharedRoomId = new URLSearchParams(window.location.search).get('room');
if (sharedRoomId) {
    els.playModeSelect.value = 'online';
    syncOnlineModeVisibility();
    els.onlineRoomInput.value = sharedRoomId;
    prepareOnline()
        .then((ready) => ready.ok && joinPrivateRoom(sharedRoomId))
        .catch((error) => {
            els.onlineStatus.textContent = `Reconnect failed: ${error.message}`;
        });
}
