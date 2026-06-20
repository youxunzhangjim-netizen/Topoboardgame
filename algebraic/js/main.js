import { CliffordReversiGame } from '../../js/localgames/CliffordReversi.js';
import { CliffordGoGame } from '../../js/localgames/CliffordGo.js';
import { PhysicalCliffordReversiGame } from '../../js/localgames/PhysicalCliffordReversi.js';
import { PhysicalVirasoroReversiGame } from '../../js/localgames/PhysicalVirasoroReversi.js';
import { AnyonJumpGame } from '../../js/localgames/AnyonJump.js';
import { CliffordJumpGame } from '../../js/localgames/CliffordJump.js';
import { VirasoroJumpGame } from '../../js/localgames/VirasoroJump.js';
import { AnyonReversiGame } from '../../js/localgames/AnyonReversi.js';
import { VirasoroGoGame } from '../../js/localgames/VirasoroGo.js';
import { IsingDomainGame } from '../../js/localgames/IsingDomainGame.js';
import { TwoPhaseCompetitionGame } from '../../js/localgames/TwoPhaseCompetitionGame.js';
import { SpinIceVertexGame } from '../../js/localgames/SpinIceVertexGame.js';
import { Z2GaugeLoopGame } from '../../js/localgames/Z2GaugeLoopGame.js';
import { PhysicalClusterGoGame } from '../../js/localgames/PhysicalClusterGo.js';
import { PhysicalJumpParticlesGame } from '../../js/localgames/PhysicalJumpParticlesGame.js';
import {
    braidWordToText,
    nextRequiredUnbraidGenerator,
    requiredInverseBraidWordText
} from '../../js/anyon/BraidMemory.js';
import { anyonTypes } from '../../js/anyon/AnyonAlgebra.js';
import { fusionChannelDisplay } from '../../js/anyon/NonabelianFusionMemory.js';
import { Algebraic3DBoard, usesAlgebraic3DView } from './Algebraic3DBoard.js';
import {
    attachPhysicalGameFramework,
    baseModeForPhysicalVariant,
    createPhysicalModeDefinition,
    isPhysicalVariantMode
} from '../../js/physics/PhysicalGameFramework.js';
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
    gameLayerControl: document.querySelector('#gameLayerControl'),
    gameLayerSelect: document.querySelector('#gameLayerSelect'),
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
    startCustomRecoveryButton: document.querySelector('#startCustomRecoveryButton'),
    isingInitialStateControl: document.querySelector('#isingInitialStateControl'),
    isingInitialStateSelect: document.querySelector('#isingInitialStateSelect'),
    isingActionControl: document.querySelector('#isingActionControl'),
    isingActionSelect: document.querySelector('#isingActionSelect'),
    isingJControl: document.querySelector('#isingJControl'),
    isingJInput: document.querySelector('#isingJInput'),
    isingHControl: document.querySelector('#isingHControl'),
    isingHInput: document.querySelector('#isingHInput'),
    isingTemperatureControl: document.querySelector('#isingTemperatureControl'),
    isingTemperatureInput: document.querySelector('#isingTemperatureInput'),
    isingWallThicknessControl: document.querySelector('#isingWallThicknessControl'),
    isingWallThicknessInput: document.querySelector('#isingWallThicknessInput'),
    isingMetropolisControl: document.querySelector('#isingMetropolisControl'),
    isingMetropolisSelect: document.querySelector('#isingMetropolisSelect'),
    isingDomainFlipControl: document.querySelector('#isingDomainFlipControl'),
    isingDomainFlipSelect: document.querySelector('#isingDomainFlipSelect'),
    isingBracketFlipControl: document.querySelector('#isingBracketFlipControl'),
    isingBracketFlipSelect: document.querySelector('#isingBracketFlipSelect'),
    twoPhaseInitialStateControl: document.querySelector('#twoPhaseInitialStateControl'),
    twoPhaseInitialStateSelect: document.querySelector('#twoPhaseInitialStateSelect'),
    twoPhaseActionControl: document.querySelector('#twoPhaseActionControl'),
    twoPhaseActionSelect: document.querySelector('#twoPhaseActionSelect'),
    twoPhaseInterfaceCostControl: document.querySelector('#twoPhaseInterfaceCostControl'),
    twoPhaseInterfaceCostInput: document.querySelector('#twoPhaseInterfaceCostInput'),
    twoPhaseBiasAControl: document.querySelector('#twoPhaseBiasAControl'),
    twoPhaseBiasAInput: document.querySelector('#twoPhaseBiasAInput'),
    twoPhaseBiasBControl: document.querySelector('#twoPhaseBiasBControl'),
    twoPhaseBiasBInput: document.querySelector('#twoPhaseBiasBInput'),
    twoPhaseCurvatureControl: document.querySelector('#twoPhaseCurvatureControl'),
    twoPhaseCurvatureSelect: document.querySelector('#twoPhaseCurvatureSelect'),
    twoPhaseCurvaturePenaltyControl: document.querySelector('#twoPhaseCurvaturePenaltyControl'),
    twoPhaseCurvaturePenaltyInput: document.querySelector('#twoPhaseCurvaturePenaltyInput'),
    twoPhaseNoiseControl: document.querySelector('#twoPhaseNoiseControl'),
    twoPhaseNoiseSelect: document.querySelector('#twoPhaseNoiseSelect'),
    twoPhaseNoiseRateControl: document.querySelector('#twoPhaseNoiseRateControl'),
    twoPhaseNoiseRateInput: document.querySelector('#twoPhaseNoiseRateInput'),
    clusterInitialStateControl: document.querySelector('#clusterInitialStateControl'),
    clusterInitialStateSelect: document.querySelector('#clusterInitialStateSelect'),
    clusterActionControl: document.querySelector('#clusterActionControl'),
    clusterActionSelect: document.querySelector('#clusterActionSelect'),
    clusterModelControl: document.querySelector('#clusterModelControl'),
    clusterModelSelect: document.querySelector('#clusterModelSelect'),
    clusterNoiseControl: document.querySelector('#clusterNoiseControl'),
    clusterNoiseSelect: document.querySelector('#clusterNoiseSelect'),
    clusterNoiseRateControl: document.querySelector('#clusterNoiseRateControl'),
    clusterNoiseRateInput: document.querySelector('#clusterNoiseRateInput'),
    spinIceInitialStateControl: document.querySelector('#spinIceInitialStateControl'),
    spinIceInitialStateSelect: document.querySelector('#spinIceInitialStateSelect'),
    spinIceActionControl: document.querySelector('#spinIceActionControl'),
    spinIceActionSelect: document.querySelector('#spinIceActionSelect'),
    spinIceViolationEnergyControl: document.querySelector('#spinIceViolationEnergyControl'),
    spinIceViolationEnergyInput: document.querySelector('#spinIceViolationEnergyInput'),
    spinIceStringLengthControl: document.querySelector('#spinIceStringLengthControl'),
    spinIceStringLengthInput: document.querySelector('#spinIceStringLengthInput'),
    z2GaugeInitialStateControl: document.querySelector('#z2GaugeInitialStateControl'),
    z2GaugeInitialStateSelect: document.querySelector('#z2GaugeInitialStateSelect'),
    z2GaugeActionControl: document.querySelector('#z2GaugeActionControl'),
    z2GaugeActionSelect: document.querySelector('#z2GaugeActionSelect'),
    z2GaugePathLengthControl: document.querySelector('#z2GaugePathLengthControl'),
    z2GaugePathLengthInput: document.querySelector('#z2GaugePathLengthInput'),
    z2GaugeNoiseControl: document.querySelector('#z2GaugeNoiseControl'),
    z2GaugeNoiseSelect: document.querySelector('#z2GaugeNoiseSelect'),
    z2GaugeNoiseRateControl: document.querySelector('#z2GaugeNoiseRateControl'),
    z2GaugeNoiseRateInput: document.querySelector('#z2GaugeNoiseRateInput'),
    z2GaugeDecoderControl: document.querySelector('#z2GaugeDecoderControl'),
    z2GaugeDecoderSelect: document.querySelector('#z2GaugeDecoderSelect'),
    jumpParticleModelControl: document.querySelector('#jumpParticleModelControl'),
    jumpParticleModelSelect: document.querySelector('#jumpParticleModelSelect'),
    jumpParticleActionControl: document.querySelector('#jumpParticleActionControl'),
    jumpParticleActionSelect: document.querySelector('#jumpParticleActionSelect'),
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
    customInitialSignControl: document.querySelector('#customInitialSignControl'),
    customInitialSignSelect: document.querySelector('#customInitialSignSelect'),
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
    dynamicsSection: document.querySelector('#dynamicsSection'),
    timeDetails: document.querySelector('#timeDetails'),
    timeUpdateSelect: document.querySelector('#timeUpdateSelect'),
    timePeriodInput: document.querySelector('#timePeriodInput'),
    timeHamiltonianSelect: document.querySelector('#timeHamiltonianSelect'),
    timeHamiltonianStrengthInput: document.querySelector('#timeHamiltonianStrengthInput'),
    timeMomentumInput: document.querySelector('#timeMomentumInput'),
    timeSpinBiasInput: document.querySelector('#timeSpinBiasInput'),
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
    rulesIntroCloseButton: document.querySelector('#rulesIntroCloseButton'),
    rulesIntroPanel: document.querySelector('#rulesIntroPanel'),
    rulesIntroTitle: document.querySelector('#rulesIntroTitle'),
    exportButton: document.querySelector('#exportButton'),
    exportCsvButton: document.querySelector('#exportCsvButton'),
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
    timeEvolutionPanel: document.querySelector('#timeEvolutionPanel'),
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
    clusterRules: document.querySelector('[data-rules-mode="physical-cluster-go"]'),
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
    clifford_reversi: 'Stabilizer Recovery Reversi',
    physical_clifford_reversi: 'Pauli-Frame Recovery Reversi',
    clifford_go: 'Clifford Go',
    physical_clifford_go: 'Physical Clifford Go',
    clifford_jump: 'Clifford Jump Chess',
    physical_clifford_jump: 'Physical Clifford Jump Chess',
    anyon_reversi: 'Anyon Reversi',
    physical_anyon_reversi: 'Physical Anyon Reversi',
    physical_virasoro_go: 'CFT Field Insertion Go',
    physical_virasoro_reversi: 'CFT Domain-Wall Reversi',
    virasoro_jump: 'Virasoro Jump Chess',
    physical_virasoro_jump: 'Physical Virasoro Jump Chess',
    anyon_jump: 'Anyon Fusion & Braiding Jump',
    physical_anyon_jump: 'Topological Memory Jump',
    ising_domain_game: 'Spin & Phase Domain Game',
    two_phase_competition_game: 'Two-Phase Competition Game',
    physical_cluster_go: 'Physical Cluster Go',
    physical_jump_particles: 'Physical Jump Particles Game',
    spin_ice_vertex_game: 'Spin Ice Vertex Game',
    z2_gauge_loop_game: 'Z2 Gauge Loop Game'
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
        || INITIAL_MODE === 'physical_clifford_reversi'
        ? 'physical'
        : '');
function normalizeTopologyAlias(value = '') {
    const topology = String(value || '').trim().toLowerCase();
    const aliases = {
        t2: 'torus',
        torus2d: 'torus',
        '2-torus': 'torus',
        cyl: 'cylinder',
        pbcx: 'cylinder',
        'pbc-x': 'cylinder',
        'x-periodic': 'cylinder',
        s2: 'sphere_latitude',
        sphere: 'sphere_latitude',
        sphere_lat: 'sphere_latitude',
        sphere_latitude_ns: 'sphere_latitude',
        's2-sphere': 'sphere_latitude',
        r2: 'flat',
        plane: 'flat',
        standard: 'flat',
        rbc: 'random_boundary',
        random: 'random_boundary',
        'random-boundary': 'random_boundary',
        '4d': 'flat_4d_grid',
        flat_4d: 'flat_4d_grid',
        '4d_grid': 'flat_4d_grid',
        '3d': 'r3',
        flat_3d_grid: 'r3'
    };
    return aliases[topology] || topology;
}

const INITIAL_TOPOLOGY = normalizeTopologyAlias(params.get('topology') || params.get('board') || '');
const URL_PHYSICAL_PROBLEM_ID = params.get('physicalProblem') || params.get('problemId') || '';
const MODE_SELECT_CATALOG = [...els.modeSelect.querySelectorAll('optgroup')].map((group) => ({
    label: group.label,
    options: [...group.querySelectorAll('option')].map((option) => ({
        value: option.value,
        text: option.textContent,
        layer: option.dataset.layer || '',
        disabled: option.disabled
    }))
}));

let game = null;
let selectedToken = '';
let selectedPhysicalCoord = null;
let selectedJumpParticleCoord = null;
let selectedCFTCoords = [];
let hoverCoord = null;
let lastCancellation = null;
let lastWrongUnbraid = null;
let applyingRemoteState = false;
let onlineReady = null;
let statusHoldUntil = 0;
let legalReversiCache = { signature: '', keys: [] };
let actionPalette = null;
let actionPaletteOpenedAt = 0;
let anyonClickTimer = 0;
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
    onSelect(coord, event) {
        handleCellPointerActivation(coord, event);
    },
    onDoubleSelect(coord, event) {
        handleCellDoubleClick(coord, event);
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
function applyURLSelectParam(select, ...names) {
    if (!select) return;
    const value = names.map((name) => params.get(name)).find(Boolean);
    if (!value) return;
    const option = [...select.options].find((entry) => entry.value === value);
    if (option && !option.disabled) select.value = value;
}
applyURLSelectParam(els.physicalInitialStateSelect, 'physicalInitialState', 'initialState');
applyURLSelectParam(els.isingInitialStateSelect, 'isingInitialState', 'physicalInitialState', 'initialState');
applyURLSelectParam(els.twoPhaseInitialStateSelect, 'twoPhaseInitialState', 'physicalInitialState', 'initialState');
applyURLSelectParam(els.clusterInitialStateSelect, 'clusterInitialState', 'physicalInitialState', 'initialState');
applyURLSelectParam(els.spinIceInitialStateSelect, 'spinIceInitialState', 'physicalInitialState', 'initialState');
applyURLSelectParam(els.z2GaugeInitialStateSelect, 'z2GaugeInitialState', 'physicalInitialState', 'initialState');
applyURLSelectParam(els.cftInitialStateSelect, 'cftInitialState', 'cftReversiInitialState', 'physicalInitialState', 'initialState');
applyURLSelectParam(els.jumpParticleModelSelect, 'jumpParticleModel', 'model');
applyURLSelectParam(els.jumpParticleActionSelect, 'jumpParticleAction', 'action');
applyURLSelectParam(els.virasoroMaxModeSelect, 'virasoroN', 'virasoroMaxMode');

function modeLayerForMode(mode = '') {
    const normalized = normalizeMode(mode) || mode;
    if (normalized.startsWith('physical_')
        || normalized === 'ising_domain_game'
        || normalized === 'two_phase_competition_game'
        || normalized === 'physical_cluster_go'
        || normalized === 'physical_jump_particles'
        || normalized === 'spin_ice_vertex_game'
        || normalized === 'z2_gauge_loop_game') {
        return 'physical';
    }
    return 'algebraic';
}

function selectedModeOption() {
    return els.modeSelect?.selectedOptions?.[0] || null;
}

function optionBelongsToLayer(option, layer) {
    return (option?.dataset?.layer || modeLayerForMode(option?.value || '')) === layer;
}

function syncModeCatalogForLayer({ chooseFirst = false } = {}) {
    const layer = els.gameLayerSelect?.value || modeLayerForMode(els.modeSelect?.value || '');
    if (els.gameLayerSelect && els.gameLayerSelect.value !== layer) els.gameLayerSelect.value = layer;
    const previous = normalizeMode(els.modeSelect.value) || els.modeSelect.value;
    els.modeSelect.replaceChildren();
    for (const groupData of MODE_SELECT_CATALOG) {
        const options = groupData.options.filter((option) => (option.layer || modeLayerForMode(option.value)) === layer);
        if (!options.length) continue;
        const group = document.createElement('optgroup');
        group.label = groupData.label;
        for (const optionData of options) {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.textContent = optionData.text;
            option.dataset.layer = optionData.layer || modeLayerForMode(optionData.value);
            option.disabled = optionData.disabled;
            group.append(option);
        }
        els.modeSelect.append(group);
    }
    const visibleValues = new Set([...els.modeSelect.options]
        .filter((option) => !option.disabled)
        .map((option) => option.value));
    if (!chooseFirst && visibleValues.has(previous)) {
        els.modeSelect.value = previous;
    } else {
        const first = [...els.modeSelect.options].find((option) => !option.disabled);
        if (first) els.modeSelect.value = first.value;
    }
}

function syncLayerFromSelectedMode() {
    const option = selectedModeOption();
    const layer = option?.dataset?.layer || modeLayerForMode(els.modeSelect.value);
    if (els.gameLayerSelect && els.gameLayerSelect.value !== layer) {
        els.gameLayerSelect.value = layer;
        syncModeCatalogForLayer();
    }
}

if (els.gameLayerSelect) {
    els.gameLayerSelect.value = modeLayerForMode(els.modeSelect.value);
    syncModeCatalogForLayer();
}

function normalizeMode(value) {
    const mode = String(value || '').toLowerCase();
    if (Object.hasOwn(MODE_LABELS, mode)) return mode;
    if (mode === 'anyon' || mode === 'anyon_jump_chess' || mode === 'anyon_fusion_braiding') return 'anyon_jump';
    if (mode === 'anyon_reversi_game') return 'anyon_reversi';
    if (mode === 'z2_gauge' || mode === 'z2_gauge_loop' || mode === 'toric_code_loop') return 'z2_gauge_loop_game';
    if (mode === 'spin_ice_vertex' || mode === 'spin_ice') return 'spin_ice_vertex_game';
    if (mode === 'cluster_go' || mode === 'physical_cluster' || mode === 'physical_cluster_go_game') return 'physical_cluster_go';
    if (mode === 'jump_particles' || mode === 'physical_jump_particles_game' || mode === 'particle_jump') return 'physical_jump_particles';
    if (mode === 'domain_wall_reversi' || mode === 'thermal_spin_game' || mode === 'physical_reversi_domain_conversion' || mode === 'spin_phase_domain_game') return 'ising_domain_game';
    if (mode === 'toric_memory_unbraid' || mode === 'topological_memory' || mode === 'braided_jump') return 'physical_anyon_jump';
    if (mode === 'cft_field_insertion' || mode === 'cft_correlator_game') return 'physical_virasoro_go';
    if (mode === 'cft_domain_wall_reversi') return 'physical_virasoro_reversi';
    if (mode === 'pauli_frame_recovery') return 'physical_clifford_reversi';
    if (mode === 'stabilizer_recovery') return 'clifford_reversi';
    if (mode === 'clifford_jump_chess') return 'clifford_jump';
    if (mode === 'virasoro_jump_chess' || mode === 'cft_jump') return 'virasoro_jump';
    if (mode === 'clifford' || mode === 'reversi') return 'clifford_reversi';
    if (mode === 'physical_clifford' || mode === 'physical_reversi') {
        return 'clifford_reversi';
    }
    if (mode === 'cft_reversi' || mode === 'virasoro_reversi') return 'physical_virasoro_reversi';
    if (['go', 'virasoro', 'virasoro_go', 'virasoro_go_game'].includes(mode)) {
        return 'physical_virasoro_go';
    }
    return '';
}

function selectedMode() {
    return normalizeMode(els.modeSelect.value) || 'clifford_reversi';
}

function baseMode(mode = selectedMode()) {
    return baseModeForPhysicalVariant(normalizeMode(mode) || mode);
}

function isSharedPhysicalMode(mode = selectedMode()) {
    mode = normalizeMode(mode) || mode;
    return isPhysicalVariantMode(mode)
        || mode === 'ising_domain_game'
        || mode === 'two_phase_competition_game'
        || mode === 'physical_cluster_go'
        || mode === 'physical_jump_particles'
        || mode === 'spin_ice_vertex_game'
        || mode === 'z2_gauge_loop_game'
        || (mode === 'clifford_reversi' && els.cliffordAlgebraSetSelect?.value === 'physical');
}

function isIsingDomainMode(mode = game?.mode || selectedMode()) {
    return (normalizeMode(mode) || mode) === 'ising_domain_game';
}

function isTwoPhaseCompetitionMode(mode = game?.mode || selectedMode()) {
    return (normalizeMode(mode) || mode) === 'two_phase_competition_game';
}

function isPhysicalClusterGoMode(mode = game?.mode || selectedMode()) {
    return (normalizeMode(mode) || mode) === 'physical_cluster_go';
}

function isPhysicalJumpParticlesMode(mode = game?.mode || selectedMode()) {
    return (normalizeMode(mode) || mode) === 'physical_jump_particles';
}

function isSpinIceVertexMode(mode = game?.mode || selectedMode()) {
    return (normalizeMode(mode) || mode) === 'spin_ice_vertex_game';
}

function isZ2GaugeLoopMode(mode = game?.mode || selectedMode()) {
    return (normalizeMode(mode) || mode) === 'z2_gauge_loop_game';
}

function isPhysicalCliffordMode(mode = game?.mode || selectedMode()) {
    if (game && (game.algebraSet === 'physical' || game.physicalConfig)) return true;
    return baseMode(mode) === 'clifford_reversi'
        && (els.cliffordAlgebraSetSelect?.value === 'physical' || normalizeMode(mode) === 'physical_clifford_reversi');
}

function isReversiMode(mode = game?.mode || selectedMode()) {
    if (isIsingDomainMode(mode) || isTwoPhaseCompetitionMode(mode) || isPhysicalClusterGoMode(mode) || isPhysicalJumpParticlesMode(mode) || isSpinIceVertexMode(mode) || isZ2GaugeLoopMode(mode)) return false;
    const base = baseMode(mode);
    return base === 'clifford_reversi' || base === 'physical_virasoro_reversi' || isAnyonReversiMode(mode);
}

function isAnyonReversiMode(mode = game?.mode || selectedMode()) {
    return baseMode(mode) === 'anyon_reversi';
}

function isCliffordJumpMode(mode = game?.mode || selectedMode()) {
    return baseMode(mode) === 'clifford_jump';
}

function isVirasoroJumpMode(mode = game?.mode || selectedMode()) {
    return baseMode(mode) === 'virasoro_jump';
}

function isJumpMode(mode = game?.mode || selectedMode()) {
    return baseMode(mode) === 'anyon_jump' || isCliffordJumpMode(mode) || isVirasoroJumpMode(mode);
}

function isCliffordGoMode(mode = game?.mode || selectedMode()) {
    return baseMode(mode) === 'clifford_go';
}

function isGoMode(mode = game?.mode || selectedMode()) {
    return isCliffordGoMode(mode) || isPhysicalVirasoroGoMode(mode);
}

function isCFTReversiMode(mode = game?.mode || selectedMode()) {
    return baseMode(mode) === 'physical_virasoro_reversi';
}

function isPhysicalVirasoroGoMode(mode = game?.mode || selectedMode()) {
    return baseMode(mode) === 'physical_virasoro_go';
}

function isCFTMode(mode = game?.mode || selectedMode()) {
    return isPhysicalVirasoroGoMode(mode) || isCFTReversiMode(mode);
}

function syncCFTInitialStateOptions(isGo) {
    const choices = isGo
        ? [
            ['two_point_insertions', 'Two-Point Insertions'],
            ['four_point_block', 'Four-Point Block'],
            ['boundary_cft', 'Boundary CFT'],
            ['thermal_sparse', 'Thermal Sparse'],
            ['identity_background_with_defects', 'Identity Background + Defects']
        ]
        : [
            ['domain_wall_seed', 'Domain Wall Seed'],
            ['four_sigma_block', 'Four Sigma Block'],
            ['boundary_condition_change', 'Boundary Condition Change'],
            ['thermal_cft_sample', 'Thermal CFT Sample'],
            ['two_phase_interval_seed', 'Two-Phase Interval Seed']
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
        : isGo ? 'four_point_block' : choices[0][0];
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

function customStabilizerSetupSelected(mode = selectedMode()) {
    return isPhysicalCliffordMode(mode)
        && selectedPhysicalProblemId() === 'stabilizer_pauli_recovery'
        && els.physicalInitialStateSelect?.value === 'custom_setup';
}

function customStabilizerSetupPending() {
    return customStabilizerSetupSelected(game?.mode || selectedMode())
        && Boolean(game?.physicalProblemPendingStart);
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

function selectedAnyonEngineModel(mode = selectedMode()) {
    if (isCliffordJumpMode(mode)) return 'toric_code';
    if (isVirasoroJumpMode(mode)) return 'ising';
    return els.anyonModelSelect.value === 'zn_phase' ? 'zn' : els.anyonModelSelect.value;
}

function excitationCatalog(mode = selectedMode()) {
    if (isCliffordJumpMode(mode)) {
        return {
            model: 'toric_code',
            grade: 2,
            types: ['X', 'Z', 'Y'],
            costs: { X: 2, Z: 2, Y: 4 }
        };
    }
    if (isVirasoroJumpMode(mode)) {
        return {
            model: 'ising',
            grade: 2,
            types: ['sigma', 'epsilon'],
            costs: { sigma: 2, epsilon: 4 }
        };
    }
    const model = selectedAnyonEngineModel(mode);
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
        option.textContent = `${jumpTypeDisplay(type)} - ${formatNumber(cost)} energy`;
        option.disabled = cost > energy;
        return option;
    }));
    const available = [...els.anyonExcitationTypeSelect.options].filter((option) => !option.disabled);
    const selected = [...els.anyonExcitationTypeSelect.options]
        .find((option) => option.value === previous && !option.disabled);
    els.anyonExcitationTypeSelect.value = selected?.value || available[0]?.value || types[0];
}

function closeActionPalette() {
    actionPalette?.remove();
    actionPalette = null;
    actionPaletteOpenedAt = 0;
    algebraic3d?.setInteractionLocked?.(false);
}

function cancelAnyonClickTimer() {
    if (!anyonClickTimer) return;
    window.clearTimeout(anyonClickTimer);
    anyonClickTimer = 0;
}

function isAnyonInteractionMode(mode = game?.mode) {
    return isJumpMode(mode) || isAnyonReversiMode(mode);
}

function paletteAnchorFor(coord, event = null) {
    if (event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
        return { x: event.clientX, y: event.clientY };
    }
    const key = coordKey(coord);
    const escapedKey = window.CSS?.escape ? CSS.escape(key) : key.replace(/["\\]/g, '\\$&');
    const cell = els.board?.querySelector(`[data-key="${escapedKey}"]`);
    const rect = cell?.getBoundingClientRect();
    if (rect) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const canvasRect = els.algebraic3dBoard?.hidden ? null : els.algebraic3dBoard?.getBoundingClientRect();
    if (canvasRect) return { x: canvasRect.left + canvasRect.width / 2, y: canvasRect.top + canvasRect.height / 2 };
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function showActionPalette(coord, event, { title, items, status = '' }) {
    const enabledItems = items.filter(Boolean);
    if (!enabledItems.length) return false;
    event?.stopPropagation?.();
    closeActionPalette();

    const palette = document.createElement('div');
    palette.className = 'site-action-palette';
    palette.setAttribute('role', 'menu');
    palette.dataset.coord = coordKey(coord);
    palette.addEventListener('pointerdown', (paletteEvent) => {
        paletteEvent.preventDefault();
        paletteEvent.stopPropagation();
    });
    palette.addEventListener('dblclick', (paletteEvent) => {
        paletteEvent.preventDefault();
        paletteEvent.stopPropagation();
    });

    const heading = document.createElement('div');
    heading.className = 'site-action-title';
    heading.textContent = title;
    palette.append(heading);

    for (const item of enabledItems) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'site-action-choice';
        button.disabled = Boolean(item.disabled);
        button.setAttribute('role', 'menuitem');
        const label = document.createElement('span');
        label.textContent = item.label;
        button.append(label);
        if (item.detail) {
            const detail = document.createElement('small');
            detail.textContent = item.detail;
            button.append(detail);
        }
        button.addEventListener('click', (choiceEvent) => {
            choiceEvent.stopPropagation();
            if (button.disabled) return;
            closeActionPalette();
            item.onChoose?.();
        });
        palette.append(button);
    }

    const anchor = paletteAnchorFor(coord, event);
    palette.style.left = `${anchor.x}px`;
    palette.style.top = `${anchor.y}px`;
    document.body.append(palette);
    const rect = palette.getBoundingClientRect();
    const margin = 10;
    const left = Math.min(window.innerWidth - rect.width - margin, Math.max(margin, anchor.x - rect.width / 2));
    const top = Math.min(window.innerHeight - rect.height - margin, Math.max(margin, anchor.y + 14));
    palette.style.left = `${left}px`;
    palette.style.top = `${top}px`;
    actionPalette = palette;
    actionPaletteOpenedAt = Date.now();
    algebraic3d?.setInteractionLocked?.(true);
    if (status) els.statusText.textContent = status;
    return true;
}

function optionItems(select, onChoose) {
    return [...select.options]
        .filter((option) => !option.hidden)
        .map((option) => ({
            label: option.textContent.trim(),
            disabled: option.disabled,
            onChoose: () => onChoose(option.value)
        }));
}

document.addEventListener('pointerdown', (event) => {
    const target = event.target;
    const formControl = target?.closest?.('select, option, input, button, textarea, label, .control-panel, .site-action-palette');
    if (formControl) algebraic3d?.setInteractionLocked?.(true);
    if (actionPalette && !actionPalette.contains(target)) closeActionPalette();
});

document.addEventListener('pointerup', (event) => {
    const target = event.target;
    if (!actionPalette && target?.closest?.('select, option, input, button, textarea, label, .control-panel')) {
        requestAnimationFrame(() => algebraic3d?.setInteractionLocked?.(false));
    }
});

document.addEventListener('focusin', (event) => {
    if (event.target?.closest?.('select, input, button, textarea, .site-action-palette')) {
        algebraic3d?.setInteractionLocked?.(true);
    }
});

document.addEventListener('focusout', () => {
    if (!actionPalette) requestAnimationFrame(() => algebraic3d?.setInteractionLocked?.(false));
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeActionPalette();
});

window.addEventListener('resize', closeActionPalette);
window.addEventListener('scroll', () => {
    if (!actionPalette || Date.now() - actionPaletteOpenedAt < 350) return;
    closeActionPalette();
}, true);

function syncModeControls() {
    syncModeCatalogForLayer();
    const mode = selectedMode();
    document.body.dataset.mode = mode;
    syncLayerFromSelectedMode();
    const base = baseMode(mode);
    const isIsing = isIsingDomainMode(mode);
    const isTwoPhase = isTwoPhaseCompetitionMode(mode);
    const isCluster = isPhysicalClusterGoMode(mode);
    const isJumpParticles = isPhysicalJumpParticlesMode(mode);
    const isSpinIce = isSpinIceVertexMode(mode);
    const isZ2Gauge = isZ2GaugeLoopMode(mode);
    const isAnyon = base === 'anyon_jump';
    const isJump = isJumpMode(mode);
    const isAnyonReversi = isAnyonReversiMode(mode);
    const isCliffordJump = isCliffordJumpMode(mode);
    const isVirasoroJump = isVirasoroJumpMode(mode);
    const usesAnyonControls = isJump || isAnyonReversi;
    const usesFreeAnyonModel = isAnyon || isAnyonReversi;
    const isVirasoroGo = isPhysicalVirasoroGoMode(mode);
    const isCFTReversi = base === 'physical_virasoro_reversi';
    const isClifford = !isIsing && !isTwoPhase && !isCluster && !isJumpParticles && !isSpinIce && !isZ2Gauge && (base === 'clifford_reversi' || isCliffordGoMode(mode) || isCliffordJump);
    const isPhysicalClifford = base === 'clifford_reversi'
        && (els.cliffordAlgebraSetSelect.value === 'physical' || mode === 'physical_clifford_reversi');
    const isStandardClifford = isClifford && !isPhysicalClifford;
    if (els.modeSelect.value !== mode) els.modeSelect.value = mode;
    if (mode === 'physical_clifford_reversi') els.cliffordAlgebraSetSelect.value = 'physical';
    if (els.modeControl) els.modeControl.hidden = false;
    if (els.cliffordAlgebraControls) els.cliffordAlgebraControls.hidden = !isClifford;
    if (els.cliffordAlgebraSetControl) els.cliffordAlgebraSetControl.hidden = isCliffordGoMode(mode) || isCliffordJump;
    if (els.physicalCliffordControls) els.physicalCliffordControls.hidden = !isPhysicalClifford;
    if (els.anyonAlgebraControls) els.anyonAlgebraControls.hidden = !usesAnyonControls;
    if (els.virasoroAlgebraControls) els.virasoroAlgebraControls.hidden = true;
    if (els.cftReversiControls) els.cftReversiControls.hidden = !isVirasoroGo && !isCFTReversi && !isVirasoroJump;
    for (const control of [
        els.isingInitialStateControl,
        els.isingActionControl,
        els.isingJControl,
        els.isingHControl,
        els.isingTemperatureControl,
        els.isingWallThicknessControl,
        els.isingMetropolisControl,
        els.isingDomainFlipControl,
        els.isingBracketFlipControl
    ]) {
        if (control) control.hidden = !isIsing;
    }
    for (const control of [
        els.twoPhaseInitialStateControl,
        els.twoPhaseActionControl,
        els.twoPhaseInterfaceCostControl,
        els.twoPhaseBiasAControl,
        els.twoPhaseBiasBControl,
        els.twoPhaseCurvatureControl,
        els.twoPhaseCurvaturePenaltyControl,
        els.twoPhaseNoiseControl,
        els.twoPhaseNoiseRateControl
    ]) {
        if (control) control.hidden = !isTwoPhase;
    }
    for (const control of [
        els.clusterInitialStateControl,
        els.clusterActionControl,
        els.clusterModelControl,
        els.clusterNoiseControl,
        els.clusterNoiseRateControl
    ]) {
        if (control) control.hidden = !isCluster;
    }
    for (const control of [
        els.jumpParticleModelControl,
        els.jumpParticleActionControl
    ]) {
        if (control) control.hidden = !isJumpParticles;
    }
    for (const control of [
        els.spinIceInitialStateControl,
        els.spinIceActionControl,
        els.spinIceViolationEnergyControl,
        els.spinIceStringLengthControl
    ]) {
        if (control) control.hidden = !isSpinIce;
    }
    for (const control of [
        els.z2GaugeInitialStateControl,
        els.z2GaugeActionControl,
        els.z2GaugePathLengthControl,
        els.z2GaugeNoiseControl,
        els.z2GaugeNoiseRateControl,
        els.z2GaugeDecoderControl
    ]) {
        if (control) control.hidden = !isZ2Gauge;
    }
    if (isVirasoroGo || isCFTReversi || isVirasoroJump) {
        syncCFTInitialStateOptions(isVirasoroGo || isVirasoroJump);
        if (isCFTReversi) els.cftModelSelect.value = 'ising_CFT';
        syncCFTPrimaryOptions();
    }
    if (els.cftModelControl) els.cftModelControl.hidden = !isVirasoroGo && !isVirasoroJump;
    setAllowedSelectValues(
        els.latticeSelect,
        isVirasoroGo || isVirasoroJump ? ['square', 'honeycomb', 'triangular'] : ['square', 'honeycomb'],
        'square'
    );
    const selectedTopologyForLattice = els.topologySelect?.value || 'r2';
    if (selectedTopologyForLattice === 'sphere_latitude') {
        // S2 / S2_NS polar graphs are latitude-longitude substrates; honeycomb cannot be continuous at the poles.
        setAllowedSelectValues(els.latticeSelect, ['square', 'triangular'], 'square');
    } else if (selectedTopologyForLattice === 'flat_4d_grid' || selectedTopologyForLattice === 'r3') {
        setAllowedSelectValues(els.latticeSelect, ['square'], 'square');
    }
    if (els.physicalProblemSelect) {
        setAllowedSelectValues(
            els.physicalProblemSelect,
            isIsing || isTwoPhase || isCluster || isJumpParticles || isSpinIce || isZ2Gauge ? [''] : isAnyon
                ? ['', 'toric_code_memory_unbraid']
                : isVirasoroGo
                    ? ['', 'cft_conformal_block_observables']
                : isStandardClifford && base === 'clifford_reversi'
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
    const customStabilizerSetup = stabilizerProblem && els.physicalInitialStateSelect.value === 'custom_setup';
    els.stabilizerErrorDensityControl.hidden = !stabilizerProblem
        || els.physicalInitialStateSelect.value !== 'sparse_pauli_errors';
    els.stabilizerLogicalChecksControl.hidden = !stabilizerProblem;
    els.stabilizerAncillaControl.hidden = !stabilizerProblem;
    els.stabilizerPhaseKickControl.hidden = !stabilizerProblem;
    els.stabilizerMaxTurnsControl.hidden = !stabilizerProblem;
    if (els.startCustomRecoveryButton) {
        els.startCustomRecoveryButton.hidden = !customStabilizerSetup;
        els.startCustomRecoveryButton.disabled = customStabilizerSetup && game
            ? !game.physicalProblemPendingStart
            : false;
    }
    if (els.customInitialSignControl) els.customInitialSignControl.hidden = !customStabilizerSetup;

    if (isVirasoroGo || isCFTReversi) {
        els.noiseModeSelect.value = 'off';
        els.timeUpdateSelect.value = 'off';
    } else {
        setAllowedSelectValues(
            els.noiseModeSelect,
            isJump
                ? ['off', 'anyon_pair_creation', 'measurement_error', 'field_noise', 'custom']
                : isAnyonReversi ? ['off', 'measurement_error', 'field_noise']
                : ['off', 'pauli', 'measurement_error', 'field_noise', 'custom']
        );
    }
    if (!isJump) els.anyonFlipSelect.value = 'off';

    els.pauliControl.hidden = !isStandardClifford;
    els.transformControl.hidden = !isClifford || isCliffordJump;
    els.phaseSignControl.hidden = !isStandardClifford || isCliffordJump;
    if (isPhysicalClifford) {
        let action = els.physicalActionSelect.value;
        const stabilizerProblem = selectedPhysicalProblemId() === 'stabilizer_pauli_recovery';
        if (customStabilizerSetup && action !== 'reversi') {
            els.physicalActionSelect.value = 'reversi';
            action = 'reversi';
        }
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
    els.braidMemoryControl.hidden = !isJump;
    els.anyonModelControl.hidden = !usesFreeAnyonModel;
    if (usesFreeAnyonModel && els.anyonModelSelect.value === 'zn_phase'
        && els.braidMemoryModeSelect.value === 'nonabelian_fusion_channel') {
        els.braidMemoryModeSelect.value = 'word_exact';
    }
    if (usesAnyonControls) syncAnyonExcitationTypeOptions();
    if (els.anyonGradeControl) els.anyonGradeControl.hidden = !usesFreeAnyonModel || els.anyonModelSelect.value !== 'zn_phase';
    const nonabelianMemory = isJump
        && els.braidMemoryModeSelect.value === 'nonabelian_fusion_channel';
    if (els.entanglementRangeControl) els.entanglementRangeControl.hidden = !nonabelianMemory;
    if (els.entanglementDistanceControl) {
        els.entanglementDistanceControl.hidden = !nonabelianMemory
            || els.entanglementRangeSelect.value !== 'finite';
    }
    if (els.anyonSetupControl) els.anyonSetupControl.hidden = !isJump;
    const excitationMode = isJump && els.anyonSetupSelect?.value === 'excitation';
    if (els.anyonActionControl) els.anyonActionControl.hidden = !excitationMode;
    if (!excitationMode) els.anyonActionSelect.value = 'move';
    if (els.anyonExcitationTypeControl) {
        els.anyonExcitationTypeControl.hidden = !excitationMode;
        if (excitationMode) syncAnyonExcitationTypeOptions();
    }
    if (els.anyonDropLossControl) els.anyonDropLossControl.hidden = !excitationMode;
    if (els.dropAnyonButton) els.dropAnyonButton.hidden = !excitationMode;
    els.braidedCaptureDetails.hidden = !isJump;
    els.braidCancellationControl.hidden = !isJump
        || !['word_exact', 'nonabelian_fusion_channel'].includes(els.braidMemoryModeSelect.value);
    if (isVirasoroGo || isCFTReversi || isVirasoroJump) {
        const action = els.cftActionSelect.value;
        els.cftDirectionControl.hidden = isVirasoroJump || !['L-1', 'L-2'].includes(action);
        els.cftMeasurementControl.hidden = isVirasoroJump || action !== 'measure';
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
        setAllowedSelectValues(
            els.cftMeasurementSelect,
            isVirasoroGo
                ? ['two_point', 'ope_channel', 'four_point_block', 'dominant_block', 'region_entropy', 'stress']
                : ['line_parity', 'ope_channel', 'four_point_block', 'dominant_block', 'region_entropy', 'stress'],
            isVirasoroGo ? 'two_point' : 'line_parity'
        );
    }
    els.passButton.hidden = isJump;
    els.countButton.hidden = !isGoMode(mode);
    els.measureButton.hidden = isIsing || isTwoPhase || isCluster || isJumpParticles || isSpinIce || isZ2Gauge || isGoMode(mode) || isPhysicalClifford || isCFTReversi;
    els.unbraidHintButton.hidden = !isJump;
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
    const usesObservableCards = isJump || isCFTReversi || isIsing || isTwoPhase || isCluster || isJumpParticles || isSpinIce || isZ2Gauge;
    if (els.blackBraidCard) els.blackBraidCard.hidden = !usesObservableCards;
    if (els.whiteBraidCard) els.whiteBraidCard.hidden = !usesObservableCards;
    if (els.braidEventSection) els.braidEventSection.hidden = !isJump;
    if (els.cliffordRules) els.cliffordRules.hidden = !isStandardClifford && !isIsing && !isTwoPhase && !isJumpParticles && !isSpinIce && !isZ2Gauge;
    if (els.physicalCliffordRules) els.physicalCliffordRules.hidden = !isPhysicalClifford;
    if (els.anyonRules) els.anyonRules.hidden = !isAnyon && !isAnyonReversi;
    if (els.virasoroRules) els.virasoroRules.hidden = !isVirasoroGo && !isVirasoroJump;
    if (els.cftReversiRules) els.cftReversiRules.hidden = !isCFTReversi;
    if (els.clusterRules) els.clusterRules.hidden = !isCluster;
    if (els.rulesIntroButton) {
        const introLabel = isVirasoroGo
            ? 'CFT Observable Go Intro'
            : isVirasoroJump ? 'Virasoro Jump Intro'
            : isCFTReversi ? 'CFT Domain-Wall Reversi Intro'
            : isCluster ? 'Cluster Go Intro'
            : isJumpParticles ? 'Jump Particles Intro'
            : isAnyon || isAnyonReversi ? 'Anyon Intro'
            : isCliffordJump ? 'Clifford Jump Intro' : 'Clifford Intro';
        els.rulesIntroButton.textContent = introLabel;
        if (els.rulesIntroTitle) els.rulesIntroTitle.textContent = introLabel.replace('Intro', 'Introduction');
    }
    document.title = `${MODE_LABELS[mode]} - Algebraic Board Games`;
    return mode;
}

function topologyConfig() {
    const topology = els.topologySelect.value;
    const selectedLattice = els.latticeSelect?.value || 'square';
    const safeSelectedLattice = topology === 'sphere_latitude' && selectedLattice === 'honeycomb'
        ? 'square'
        : selectedLattice;
    if (els.latticeSelect && safeSelectedLattice !== selectedLattice) els.latticeSelect.value = safeSelectedLattice;
    const lattice = topology === 'flat_4d_grid' || topology === 'r3'
        ? 'square'
        : isReversiMode(selectedMode()) && safeSelectedLattice === 'honeycomb'
            ? 'hex_cells'
            : safeSelectedLattice;
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
    const updateMode = els.timeUpdateSelect.value;
    const hDefect = centerCoord(0, 0);
    const sDefect = centerCoord(1, 0);
    return {
        floquetMode: updateMode === 'off' ? 'off' : 'basic',
        updateMode,
        period: Number(els.timePeriodInput.value) || 4,
        hamiltonianMode: els.timeHamiltonianSelect?.value || 'off',
        hamiltonianStrength: Number(els.timeHamiltonianStrengthInput?.value || 0),
        initialMomentum: Number(els.timeMomentumInput?.value || 0),
        initialSpinBias: Number(els.timeSpinBiasInput?.value || 0),
        markedVertices: [hDefect],
        hDefectVertices: [hDefect],
        sDefectVertices: [sDefect],
        seamAutomorphismVertices: [hDefect],
        rechargeRate: 0.1,
        decayRate: 0.92,
        diffusionRate: 0.15,
        virasoro_CFT_N2: false
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
    const mode = selectedMode();
    const fixedJumpAlgebra = isCliffordJumpMode(mode) || isVirasoroJumpMode(mode);
    if (!fixedJumpAlgebra
        && els.braidMemoryModeSelect.value === 'nonabelian_fusion_channel'
        && els.anyonModelSelect.value === 'toric_code') {
        els.anyonModelSelect.value = 'ising';
    }
    if (!fixedJumpAlgebra
        && els.anyonModelSelect.value === 'zn_phase'
        && els.braidMemoryModeSelect.value === 'nonabelian_fusion_channel') {
        els.braidMemoryModeSelect.value = 'word_exact';
    }
    const selectedAnyonModel = fixedJumpAlgebra ? excitationCatalog(mode).model : els.anyonModelSelect.value;
    const useGeneralPhase = selectedAnyonModel === 'zn_phase';
    const catalog = excitationCatalog(mode);
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

function isingConfig() {
    return {
        J: Number(els.isingJInput?.value ?? 1),
        h: Number(els.isingHInput?.value ?? 0),
        temperature: Number(els.isingTemperatureInput?.value ?? 0),
        metropolis: els.isingMetropolisSelect?.value === 'on',
        domainFlipEnabled: els.isingDomainFlipSelect?.value !== 'off',
        bracketFlipEnabled: els.isingBracketFlipSelect?.value === 'on',
        wallThickness: Number(els.isingWallThicknessInput?.value ?? 1),
        initialState: els.isingInitialStateSelect?.value || 'domain_wall_seed',
        seed: els.noiseSeedInput?.value || 'ising-domain-game'
    };
}

function twoPhaseConfig() {
    return {
        interfaceCost: Number(els.twoPhaseInterfaceCostInput?.value ?? 1),
        biasA: Number(els.twoPhaseBiasAInput?.value ?? 0),
        biasB: Number(els.twoPhaseBiasBInput?.value ?? 0),
        curvaturePenaltyEnabled: els.twoPhaseCurvatureSelect?.value === 'on',
        curvaturePenalty: Number(els.twoPhaseCurvaturePenaltyInput?.value ?? 0.25),
        noiseEnabled: els.twoPhaseNoiseSelect?.value === 'on',
        noiseRate: Number(els.twoPhaseNoiseRateInput?.value ?? 0.02),
        initialState: els.twoPhaseInitialStateSelect?.value || 'phase_separated',
        seed: els.noiseSeedInput?.value || 'two-phase-competition-game'
    };
}

function clusterConfig() {
    return {
        initialState: els.clusterInitialStateSelect?.value || 'sparse_seeds',
        model: els.clusterModelSelect?.value || 'two_species_competition',
        diffusionNoiseEnabled: els.clusterNoiseSelect?.value === 'on',
        noiseRate: Number(els.clusterNoiseRateInput?.value ?? 0.02),
        seed: els.noiseSeedInput?.value || 'physical-cluster-go'
    };
}

function spinIceConfig() {
    return {
        violationEnergy: Number(els.spinIceViolationEnergyInput?.value ?? 1),
        stringLength: Number(els.spinIceStringLengthInput?.value ?? 4),
        initialState: els.spinIceInitialStateSelect?.value || 'ice_rule_vacuum',
        seed: els.noiseSeedInput?.value || 'spin-ice-vertex-game'
    };
}

function z2GaugeConfig() {
    return {
        pathLength: Number(els.z2GaugePathLengthInput?.value ?? 4),
        noisyEdgeFlip: els.z2GaugeNoiseSelect?.value === 'on',
        noiseRate: Number(els.z2GaugeNoiseRateInput?.value ?? 0.02),
        decoderEnabled: els.z2GaugeDecoderSelect?.value === 'on',
        initialState: els.z2GaugeInitialStateSelect?.value || 'gauge_vacuum',
        seed: els.noiseSeedInput?.value || 'z2-gauge-loop-game'
    };
}

function jumpParticlesConfig() {
    return {
        model: els.jumpParticleModelSelect?.value || 'charge_recombination',
        action: els.jumpParticleActionSelect?.value || 'auto',
        pathParityEnabled: true
    };
}

function physicalProblemConfig(mode) {
    const base = baseMode(mode);
    const topology = topologyConfig();
    const physicalProblemId = selectedPhysicalProblemId();
    if (base === 'anyon_jump' && physicalProblemId === 'toric_code_memory_unbraid') {
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
    if (base === 'clifford_reversi' && physicalProblemId === 'ising_domain_wall_topology') {
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
    if (base === 'clifford_reversi'
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
    if (base === 'physical_virasoro_go'
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
    const base = baseMode(mode);
    selectedToken = '';
    selectedPhysicalCoord = null;
    selectedJumpParticleCoord = null;
    selectedCFTCoords = [];
    hoverCoord = null;
    lastCancellation = null;
    lastWrongUnbraid = null;
    legalReversiCache = { signature: '', keys: [] };
    const config = anyonConfig();
    const physicalProblem = physicalProblemConfig(mode);
    const usePhysicalWallThickness = base === 'clifford_reversi'
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
        algebraSet: base === 'clifford_reversi'
            ? els.cliffordAlgebraSetSelect.value
            : isCliffordJumpMode(mode) ? 'clifford_jump'
                : isAnyonReversiMode(mode) ? 'anyon' : null,
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
        deferPhysicalProblemStart: physicalProblem?.id === 'stabilizer_pauli_recovery'
            && els.physicalInitialStateSelect.value === 'custom_setup',
        config,
        virasoro: virasoroConfig(),
        probability: probabilityConfig(),
        time: timeConfig(),
        ising: isingConfig(),
        twoPhase: twoPhaseConfig(),
        cluster: clusterConfig(),
        spinIce: spinIceConfig(),
        z2Gauge: z2GaugeConfig(),
        jumpParticles: jumpParticlesConfig()
    };
    if (physicalProblem) options.physicalProblem = physicalProblem;
    if (mode === 'ising_domain_game') game = new IsingDomainGame(options);
    else if (mode === 'two_phase_competition_game') game = new TwoPhaseCompetitionGame(options);
    else if (mode === 'physical_cluster_go') game = new PhysicalClusterGoGame(options);
    else if (mode === 'physical_jump_particles') game = new PhysicalJumpParticlesGame(options);
    else if (mode === 'spin_ice_vertex_game') game = new SpinIceVertexGame(options);
    else if (mode === 'z2_gauge_loop_game') game = new Z2GaugeLoopGame(options);
    else if (base === 'anyon_jump') game = new AnyonJumpGame(options);
    else if (base === 'clifford_jump') game = new CliffordJumpGame(options);
    else if (base === 'virasoro_jump') game = new VirasoroJumpGame(options);
    else if (base === 'anyon_reversi') game = new AnyonReversiGame(options);
    else if (base === 'clifford_go') game = new CliffordGoGame(options);
    else if (base === 'physical_virasoro_go') game = new VirasoroGoGame(options);
    else if (base === 'physical_virasoro_reversi') game = new PhysicalVirasoroReversiGame(options);
    else if (base === 'clifford_reversi' && els.cliffordAlgebraSetSelect.value === 'physical') {
        game = new PhysicalCliffordReversiGame(options);
    }
    else game = new CliffordReversiGame(options);
    if (isSharedPhysicalMode(mode)) {
        const definition = mode === 'ising_domain_game'
            ? createPhysicalModeDefinition(mode, {
                physicalSystemName: 'Ising spin-domain graph system',
                blackWhiteMeaning: 'black = spin up s=+1; white = spin down s=-1; empty = unoccupied / undecided site; board = graph embedded in the selected topology',
                initialStateOptions: ['random_spins', 'domain_wall_seed', 'droplet_seed', 'stripe_seed', 'checkerboard', 'thermal_sample'],
                allowedActions: ['place_spin', 'flip_spin', 'flip_domain', 'bracket_flip', 'pass'],
                localUpdateRules: 'Energy is E=-J sum_<ij> s_i s_j - h sum_i s_i over topology.neighbors(vertex). Local updates propose changed spins on graph vertices, compute deltaE, optionally apply Metropolis acceptance, then recompute domain-wall and topology observables.'
            })
            : mode === 'two_phase_competition_game'
                ? createPhysicalModeDefinition(mode, {
                    physicalSystemName: 'Two-phase competition graph substrate',
                    blackWhiteMeaning: 'black = phase A; white = phase B; empty = metastable or unconverted region; board = physical substrate graph on the selected topology',
                    initialStateOptions: ['phase_separated', 'random_droplets', 'single_nucleus', 'two_nuclei', 'stripe_domains', 'metastable_empty'],
                    allowedActions: ['nucleate_phase', 'grow_domain', 'flip_interface', 'pass'],
                    localUpdateRules: 'Energy is E=interfaceCost*interfaceLength - biasA*areaA - biasB*areaB plus optional curvature penalty. Actions nucleate empty metastable sites, grow adjacent domains, flip energetically allowed interface sites, and optionally add stochastic droplets.'
                })
            : mode === 'physical_cluster_go'
                ? createPhysicalModeDefinition(mode, {
                    physicalSystemName: 'Physical cluster Go competition graph',
                    blackWhiteMeaning: 'black = species A / phase A / spin sector A; white = species B / phase B / spin sector B; empty = local growth/resource site; liberties = available growth/oxygen/resource sites; capture = local extinction / annihilation / confinement',
                    initialStateOptions: ['sparse_seeds', 'random_density', 'two_cluster_competition', 'interface_seed', 'thermal_cluster_sample'],
                    allowedActions: ['place_species', 'grow_connected_cluster', 'capture_zero_liberty_cluster', 'diffusion_noise_step', 'pass'],
                    localUpdateRules: 'Topology-aware graph liberties define local resources. A species can place on empty vertices or grow from adjacent same-species clusters. Opponent clusters with zero liberties are captured as local extinction; optional diffusion/noise grows random local droplets after updates.'
                })
            : mode === 'physical_jump_particles'
                ? createPhysicalModeDefinition(mode, {
                    physicalSystemName: 'Jumping particle reaction/exchange graph system',
                    blackWhiteMeaning: 'black/white = two particle species or charge signs; jump = hopping over a barrier, exchange, or scattering event; capture = annihilation, recombination, or conversion',
                    initialStateOptions: ['paired_particles', 'charge_recombination_pair', 'spin_exchange_seed', 'anyon_worldline_seed'],
                    allowedActions: ['hop_to_adjacent_empty_vertex', 'jump_over_occupied_vertex', 'chain_jump', 'recombine_opposite_charges', 'measure_path_parity'],
                    localUpdateRules: 'Particles occupy graph vertices. A hop moves to an adjacent empty vertex, a jump crosses one occupied barrier particle, a chain jump follows consecutive jump landings, recombination removes adjacent opposite charges and recovers energy, and optional path-parity measurement records exchange or braid parity.'
                })
            : mode === 'spin_ice_vertex_game'
                ? createPhysicalModeDefinition(mode, {
                    physicalSystemName: 'Spin ice / vertex-model graph system',
                    blackWhiteMeaning: 'black = arrow along the chosen edge orientation; white = arrow opposite the chosen edge orientation; board variables live on graph edges',
                    initialStateOptions: ['ice_rule_vacuum', 'random_arrows', 'monopole_pair', 'loop_excitation', 'thermal_ice_sample'],
                    allowedActions: ['flip_arrow', 'flip_string', 'flip_loop', 'move_monopole', 'annihilate_monopole_pair', 'pass'],
                    localUpdateRules: 'Edge arrows define incoming and outgoing arrows at each graph vertex. The square-ice rule prefers two in and two out; violations are monopoles. Actions flip one arrow, strings, closed loops, or paths that move and annihilate monopoles.'
                })
            : mode === 'z2_gauge_loop_game'
                ? createPhysicalModeDefinition(mode, {
                    physicalSystemName: 'Z2 gauge loop graph system',
                    blackWhiteMeaning: 'black edge = U_e=+1; white edge = U_e=-1; vertex charge is the product of adjacent edge variables and plaquette flux is the product around local faces/cycles',
                    initialStateOptions: ['gauge_vacuum', 'random_edge_errors', 'paired_charge_defects', 'paired_flux_defects', 'logical_loop_error'],
                    allowedActions: ['flip_edge', 'flip_path', 'flip_loop', 'measure_star', 'measure_plaquette', 'noisy_edge_flip', 'pass'],
                    localUpdateRules: 'Open strings flip connected edge paths and create star-charge endpoints. Closed loops preserve local constraints. Noncontractible loops change Wilson-loop logical sectors when the selected topology supports cycles.'
                })
            : mode === 'physical_virasoro_go'
                ? createPhysicalModeDefinition(mode, {
                    physicalSystemName: 'CFT observable Go on a discretized Riemann graph',
                    blackWhiteMeaning: 'board = discretized Riemann surface / graph manifold; empty = identity operator; stone = primary-field insertion; black/white = source sign or player control; primaryType carries the physical field',
                    initialStateOptions: ['two_point_insertions', 'four_point_block', 'boundary_cft', 'thermal_sparse', 'identity_background_with_defects'],
                    allowedActions: ['place_primary_field', 'capture_fuse_cluster', 'measure_ope_channel', 'measure_two_point_correlator', 'measure_four_point_correlator', 'apply_Ln_deformation', 'pass', 'count'],
                    localUpdateRules: 'Topology-aware Go placement inserts primary fields and captures/fuses clusters by graph liberties. Measurements estimate OPE channels and two-/four-point CFT observables. L_n Virasoro deformations update stress proxies, with N=2 tracking central-charge anomaly events.'
                })
            : mode === 'physical_virasoro_reversi'
                ? createPhysicalModeDefinition(mode, {
                    physicalSystemName: 'CFT/domain-wall interval Reversi on a topology graph',
                    blackWhiteMeaning: 'black = + source/domain sign; white = - source/domain sign; stone = primary field or spin/domain insertion; bracketed Reversi line = discrete CFT interval; flipping = OPE channel/domain transformation',
                    initialStateOptions: ['domain_wall_seed', 'four_sigma_block', 'boundary_condition_change', 'thermal_cft_sample', 'two_phase_interval_seed'],
                    allowedActions: ['place_primary_domain_stone', 'flip_bracketed_interval', 'update_ope_channel_along_interval', 'measure_interval_parity', 'measure_ope_channel', 'measure_region_entropy', 'apply_Ln_deformation', 'pass'],
                    localUpdateRules: 'A legal Reversi placement brackets an opponent path as a discrete CFT interval. Flipped interval stones change source/domain sign and update Ising OPE channels. Measurements reveal interval parity, OPE channel, entropy, stress, or four-point block estimators; L_n actions update stress and N=2 anomaly events.'
                })
            : createPhysicalModeDefinition(mode);
        attachPhysicalGameFramework(game, definition);
        game.mode = mode;
    }
    normalizeLayerControls();
    render();
}

function currentOnlineMatchKey() {
    const mode = selectedMode();
    const base = baseMode(mode);
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
        base === 'clifford_reversi' ? els.cliffordAlgebraSetSelect.value : '',
        isJumpMode(mode) ? els.anyonSetupSelect.value : '',
        base === 'anyon_jump' || base === 'anyon_reversi' ? els.anyonModelSelect.value : '',
        isJumpMode(mode) ? els.braidMemoryModeSelect.value : '',
        mode === 'physical_cluster_go' ? els.clusterInitialStateSelect.value : '',
        mode === 'physical_cluster_go' ? els.clusterModelSelect.value : '',
        mode === 'physical_jump_particles' ? els.jumpParticleModelSelect.value : '',
        mode === 'physical_jump_particles' ? els.jumpParticleActionSelect.value : '',
        els.timeUpdateSelect?.value || 'off',
        els.noiseModeSelect?.value || 'off',
        els.applyNoiseSelect?.value || '',
        els.noiseProbabilityInput?.value || '',
        els.noiseSeedInput?.value || '',
        els.timeParameterInput?.value || ''
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

function restoreGraphPhysicalState(state) {
    if (!(game?.board instanceof Map) || !Array.isArray(state.board)) return false;
    const mode = normalizeMode(state.mode) || state.mode;
    if (![
        'ising_domain_game',
        'two_phase_competition_game',
        'physical_cluster_go',
        'physical_jump_particles'
    ].includes(mode)) return false;
    game.board.clear();
    for (const item of state.board) {
        const key = item.key || (Array.isArray(item.coord) ? coordKey(item.coord) : '');
        if (!key) continue;
        if (mode === 'ising_domain_game') game.board.set(key, Number(item.spin) < 0 ? -1 : 1);
        else if (mode === 'two_phase_competition_game') game.board.set(key, item.phase === 'B' ? 'B' : 'A');
        else if (mode === 'physical_cluster_go') game.board.set(key, item.species === 'B' ? 'B' : 'A');
        else game.board.set(key, cloneValue(item));
    }
    game.currentPlayer = state.currentPlayer || game.currentPlayer || 'black';
    game.moveNumber = Number(state.moveNumber) || 0;
    game.history = cloneValue(state.history || []);
    if (game.captures && state.captures) game.captures = { ...game.captures, ...state.captures };
    if (Array.isArray(state.physicsHistory)) game.physicsHistory = cloneValue(state.physicsHistory);
    if (Array.isArray(state.positionHistory)) game.positionHistory = cloneValue(state.positionHistory);
    if (game.positionSet && typeof game.serializeBoard === 'function') {
        game.positionSet = new Set([game.serializeBoard()]);
    }
    return true;
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
        if (isJumpMode(state.mode)) restoreAnyonState(state);
        else if (restoreGraphPhysicalState(state)) {}
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
        els.cftInitialStateSelect,
        els.clusterInitialStateSelect,
        els.clusterModelSelect,
        els.clusterNoiseSelect,
        els.clusterNoiseRateInput,
        els.jumpParticleModelSelect,
        els.jumpParticleActionSelect
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

function syncOnlineRoomTurn(room) {
    if (!room?.turn || !game) return;
    game.currentPlayer = room.turn;
    if (game.go) game.go.currentPlayer = room.turn;
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
            if (connected) syncOnlineRoomTurn(room);
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
        return `<div class="online-chat-message${mine ? ' mine' : ''}"><span>${escapeHTML(message.displayName || capitalize(message.player || 'player'))}</span><p>${escapeHTML(message.text)}</p></div>`;
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
        selectedReversiAlgebraValue()
    );
}

function reversiPlacementActive() {
    return isReversiMode(game.mode)
        && (!isPhysicalCliffordMode(game.mode) || els.physicalActionSelect.value === 'reversi')
        && (!isCFTReversiMode(game.mode) || els.cftActionSelect.value === 'place');
}

function selectedReversiAlgebraValue() {
    if (isCFTReversiMode(game?.mode)) return els.cftPrimarySelect.value;
    if (isAnyonReversiMode(game?.mode)) return els.anyonExcitationTypeSelect.value || game?.placementTypes?.()[0] || 'e';
    return els.transformSelect.value;
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
    const isJump = isJumpMode(mode);
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
    const timeEnabled = els.timeUpdateSelect.value !== 'off';
    els.geometryDetails.hidden = !is4D && !isR3;
    els.zSizeControl.hidden = !is4D && !isR3;
    els.wSizeControl.hidden = !is4D;
    els.noiseDetails.hidden = !noiseEnabled;
    els.timeDetails.hidden = !timeEnabled;
    els.manualNoiseButton.hidden = !noiseEnabled;
    els.manualTimeButton.hidden = !timeEnabled;
    els.pauliNoiseControl.hidden = isJump || isAnyonReversiMode(mode) || !['pauli', 'custom'].includes(els.noiseModeSelect.value);
    els.anyonFlipControl.hidden = !isJump || !['anyon_pair_creation', 'custom'].includes(els.noiseModeSelect.value);
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
        els.dropAnyonButton,
        els.startCustomRecoveryButton
    ]) {
        if (button) {
            button.disabled = onlineLocked
                || (button === els.newGameButton && Boolean(online.roomId))
                || (button === els.startCustomRecoveryButton && !game?.physicalProblemPendingStart);
        }
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
    if (game?.physicalProblem?.id === 'stabilizer_pauli_recovery' && game.physicalProblemPendingStart) {
        const observables = game.computePhysicalObservables();
        els.stabilizerObservablePanel.hidden = false;
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
        els.stabilizerVacuumState.textContent = 'Setup';
        els.stabilizerObservableSummary.textContent = 'Custom initial board is editable. Press Start to begin recovery from this state.';
        return;
    }
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
    const channels = observables.opeChannelDistribution || {};
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
    els.cftObservableSummary.textContent = `Dominant ${observables.dominantConformalBlock}; OPE sector ${observables.finalOPESector || 'identity'}; cross-ratio ${crossRatio}; entropy ${formatNumber(observables.entanglementEntropyEstimate)}; mutual information ${formatNumber(observables.mutualInformationEstimate)}; anomalies ${observables.centralChargeAnomalyEvents.length}.`;
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
    const goNodeBoard = (isGoMode(game.mode) || isPhysicalClusterGoMode(game.mode)) && !honeycombNodes && !hexCells;
    els.board.style.gridTemplateColumns = `repeat(${width}, minmax(0, 1fr))`;
    els.board.style.setProperty('--board-cols', String(width));
    els.board.style.setProperty('--board-rows', String(height));
    els.board.classList.toggle('lattice-square', game.topology.lattice === 'square');
    els.board.classList.toggle('lattice-triangular', game.topology.lattice === 'triangular');
    els.board.classList.toggle('lattice-honeycomb-nodes', honeycombNodes);
    els.board.classList.toggle('lattice-hex-cells', hexCells);
    els.board.classList.toggle('go-node-board', goNodeBoard);
    els.board.innerHTML = '';
    if (honeycombNodes) appendHoneycombEdges(width, height);

    const preview = currentReversiPreview();
    const previewFlips = new Set((preview?.flips || []).map((flip) => flip.key));
    const legalReversi = customStabilizerSetupPending()
        ? new Set(game.topology.vertices().map(coordKey))
        : reversiPlacementActive()
        ? new Set(game.legalMoves(
            game.currentPlayer,
            selectedReversiAlgebraValue()
        ).map((move) => coordKey(move.coord)))
        : new Set();
    const legalAnyon = isJumpMode(game.mode) && selectedToken
        ? game.legalActionsForToken(selectedToken)
        : [];
    const legalAnyonTargets = new Set(legalAnyon.map((action) => coordKey(action.to)));
    const legalAnyonExciteTargets = isJumpMode(game.mode) && game.config?.setupMode === 'excitation'
        ? new Set(game.topology.vertices()
            .filter((coord) => !game.tokenAt(coord))
            .map(coordKey))
        : new Set();
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
    const legalIsingTargets = isIsingDomainMode(game.mode)
        ? new Set(game.topology.vertices().map(coordKey))
        : new Set();
    const legalTwoPhaseTargets = isTwoPhaseCompetitionMode(game.mode)
        ? new Set(game.legalMoves().map((move) => coordKey(move.coord)))
        : new Set();
    const legalClusterTargets = isPhysicalClusterGoMode(game.mode)
        ? new Set(game.legalMoves().map((move) => coordKey(move.coord)))
        : new Set();
    const legalJumpParticleTargets = isPhysicalJumpParticlesMode(game.mode)
        ? new Set(game.legalMoves(selectedJumpParticleCoord, els.jumpParticleActionSelect?.value || 'auto')
            .map((move) => coordKey(move.coord)))
        : new Set();
    const legalSpinIceTargets = isSpinIceVertexMode(game.mode)
        ? new Set(game.legalMoves().map((move) => coordKey(move.coord)))
        : new Set();
    const legalZ2GaugeTargets = isZ2GaugeLoopMode(game.mode)
        ? new Set(game.legalMoves().map((move) => coordKey(move.coord)))
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
        if (legalReversi.has(key) || legalAnyonTargets.has(key) || legalAnyonExciteTargets.has(key) || legalGoTargets.has(key) || legalIsingTargets.has(key) || legalTwoPhaseTargets.has(key) || legalClusterTargets.has(key) || legalJumpParticleTargets.has(key) || legalSpinIceTargets.has(key) || legalZ2GaugeTargets.has(key)) cell.classList.add('legal');
        const token = isJumpMode(game.mode) ? game.tokenAt(coord) : null;
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
        if (isPhysicalJumpParticlesMode(game.mode) && selectedJumpParticleCoord && coordKey(selectedJumpParticleCoord) === key) {
            cell.classList.add('cft-selected-region');
        }
        if (isJumpMode(game.mode) && game.isFusionSite(coord)) cell.classList.add('fusion-site');
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
        cell.addEventListener('click', (event) => handleCellPointerActivation(coord, event));
        cell.addEventListener('dblclick', (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleCellDoubleClick(coord, event);
        });

        if (isIsingDomainMode(game.mode)) renderIsingSpin(cell, coord);
        else if (isTwoPhaseCompetitionMode(game.mode)) renderTwoPhaseSite(cell, coord);
        else if (isPhysicalClusterGoMode(game.mode)) renderClusterSite(cell, coord);
        else if (isPhysicalJumpParticlesMode(game.mode)) renderJumpParticleSite(cell, coord);
        else if (isSpinIceVertexMode(game.mode)) renderSpinIceVertex(cell, coord);
        else if (isZ2GaugeLoopMode(game.mode)) renderZ2GaugeVertex(cell, coord);
        else if (isCFTReversiMode(game.mode)) renderCFTStone(cell, coord);
        else if (isReversiMode(game.mode)) renderReversiStone(cell, coord);
        else if (isJumpMode(game.mode)) renderAnyonToken(cell, coord);
        else renderGoStone(cell, coord);

        appendAgeRing(cell, token || goStone || game.getStone?.(coord));

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

        if (isZ2GaugeLoopMode(game.mode)) renderZ2GaugeEdges(cell, coord);

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
    if (customStabilizerSetupPending()) {
        legalReversiCache = {
            signature: 'custom-stabilizer-setup',
            keys: game.topology.vertices().map(coordKey)
        };
        legalReversi = legalReversiCache.keys;
    } else if (reversiPlacementActive()) {
        const signature = [
            game.topology.name,
            game.topology.sizes.join('x'),
            game.moveNumber,
            game.currentPlayer,
            selectedReversiAlgebraValue()
        ].join(':');
        if (legalReversiCache.signature !== signature) {
                legalReversiCache = {
                    signature,
                    keys: game.legalMoves(
                        game.currentPlayer,
                        selectedReversiAlgebraValue()
                    )
                    .map((move) => coordKey(move.coord))
            };
        }
        legalReversi = legalReversiCache.keys;
    }
    const legalAnyon = isJumpMode(game.mode) && selectedToken
        ? game.legalActionsForToken(selectedToken)
        : [];
    const legalAnyonExciteTargets = isJumpMode(game.mode) && game.config?.setupMode === 'excitation'
        ? game.topology.vertices()
            .filter((coord) => !game.tokenAt(coord))
            .map(coordKey)
        : [];
    const virasoroPreview = currentVirasoroPreview();
    const cftPreview = currentCFTPreview();
    const legalGo = isGoMode(game.mode)
        ? (isCliffordGoMode(game.mode) || els.cftActionSelect.value === 'place'
            ? game.legalMoves().map(coordKey)
            : (hoverCoord && virasoroPreview?.ok ? [coordKey(hoverCoord)] : []))
        : [];
    const legalIsing = isIsingDomainMode(game.mode)
        ? game.topology.vertices().map(coordKey)
        : [];
    const legalTwoPhase = isTwoPhaseCompetitionMode(game.mode)
        ? game.legalMoves().map((move) => coordKey(move.coord))
        : [];
    const legalCluster = isPhysicalClusterGoMode(game.mode)
        ? game.legalMoves().map((move) => coordKey(move.coord))
        : [];
    const legalJumpParticles = isPhysicalJumpParticlesMode(game.mode)
        ? game.legalMoves(selectedJumpParticleCoord, els.jumpParticleActionSelect?.value || 'auto')
            .map((move) => coordKey(move.coord))
        : [];
    const legalSpinIce = isSpinIceVertexMode(game.mode)
        ? game.legalMoves().map((move) => coordKey(move.coord))
        : [];
    const legalZ2Gauge = isZ2GaugeLoopMode(game.mode)
        ? game.legalMoves().map((move) => coordKey(move.coord))
        : [];
    return {
        selectedToken,
        legalKeys: new Set([
            ...legalReversi,
            ...legalAnyon.map((action) => coordKey(action.to)),
            ...legalAnyonExciteTargets,
            ...legalGo,
            ...legalIsing,
            ...legalTwoPhase,
            ...legalCluster,
            ...legalJumpParticles,
            ...legalSpinIce,
            ...legalZ2Gauge
        ]),
        previewKeys: new Set((preview?.flips || []).map((flip) => flip.key)),
        affectedKeys: new Set([
            ...(virasoroPreview?.affected || []).map((item) => item.key),
            ...(cftPreview?.affected || []).map((item) => item.key),
            ...selectedCFTCoords.map(coordKey),
            ...(selectedPhysicalCoord ? [coordKey(selectedPhysicalCoord)] : []),
            ...(selectedJumpParticleCoord ? [coordKey(selectedJumpParticleCoord)] : [])
        ]),
        trailKeys: braidTrailCells(),
        physicsView: els.physicsViewSelect.value,
        paths: isJumpMode(game.mode)
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
    const legalReversi = customStabilizerSetupPending()
        ? new Set(game.topology.vertices().map(coordKey))
        : reversiPlacementActive()
        ? new Set(game.legalMoves(
            game.currentPlayer,
            selectedReversiAlgebraValue()
        ).map((move) => coordKey(move.coord)))
        : new Set();
    const legalAnyon = isJumpMode(game.mode) && selectedToken
        ? game.legalActionsForToken(selectedToken)
        : [];
    const legalAnyonTargets = new Set(legalAnyon.map((action) => coordKey(action.to)));
    const legalAnyonExciteTargets = isJumpMode(game.mode) && game.config?.setupMode === 'excitation'
        ? new Set(game.topology.vertices()
            .filter((coord) => !game.tokenAt(coord))
            .map(coordKey))
        : new Set();
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
    const legalIsingTargets = isIsingDomainMode(game.mode)
        ? new Set(game.topology.vertices().map(coordKey))
        : new Set();
    const legalTwoPhaseTargets = isTwoPhaseCompetitionMode(game.mode)
        ? new Set(game.legalMoves().map((move) => coordKey(move.coord)))
        : new Set();
    const legalClusterTargets = isPhysicalClusterGoMode(game.mode)
        ? new Set(game.legalMoves().map((move) => coordKey(move.coord)))
        : new Set();
    const legalJumpParticleTargets = isPhysicalJumpParticlesMode(game.mode)
        ? new Set(game.legalMoves(selectedJumpParticleCoord, els.jumpParticleActionSelect?.value || 'auto')
            .map((move) => coordKey(move.coord)))
        : new Set();
    const legalSpinIceTargets = isSpinIceVertexMode(game.mode)
        ? new Set(game.legalMoves().map((move) => coordKey(move.coord)))
        : new Set();
    const legalZ2GaugeTargets = isZ2GaugeLoopMode(game.mode)
        ? new Set(game.legalMoves().map((move) => coordKey(move.coord)))
        : new Set();

    els.board.querySelectorAll('.cell[data-key]').forEach((cell) => {
        const key = cell.dataset.key;
        const coord = JSON.parse(cell.dataset.coord);
        const token = isJumpMode(game.mode) ? game.tokenAt(coord) : null;
        const goStone = isGoMode(game.mode) ? game.getStone(coord) : null;
        cell.classList.toggle('legal', legalReversi.has(key) || legalAnyonTargets.has(key) || legalAnyonExciteTargets.has(key) || legalGoTargets.has(key) || legalIsingTargets.has(key) || legalTwoPhaseTargets.has(key) || legalClusterTargets.has(key) || legalJumpParticleTargets.has(key) || legalSpinIceTargets.has(key) || legalZ2GaugeTargets.has(key));
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
        cell.classList.toggle('cft-selected-region', selectedCFTCoords.some((entry) => coordKey(entry) === key) || Boolean(selectedJumpParticleCoord && coordKey(selectedJumpParticleCoord) === key));
        cell.classList.toggle('fusion-site', isJumpMode(game.mode) && game.isFusionSite(coord));
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
    if (!isJumpMode(game?.mode) || !selectedToken) return '';
    const token = game.tokens.get(selectedToken);
    if (!token) return '';
    if (game.config?.braidMemoryMode === 'abelian_parity') {
        return token.braidParity === 1 ? (token.braidedWith[token.braidedWith.length - 1] || '') : '';
    }
    return nextRequiredUnbraidGenerator(token.braidWord)?.targetId || '';
}

function wrongUnbraidTargetIds() {
    if (!isJumpMode(game?.mode) || !selectedToken) return new Set();
    const selected = game.tokens.get(selectedToken);
    if (!selected || (!selected.isBraided && Number(selected.braidParity || 0) === 0)) return new Set();
    const cancelTarget = cancelTargetForSelectedToken();
    return new Set([...game.tokens.values()]
        .filter((token) => token.id !== selectedToken && token.id !== cancelTarget)
        .map((token) => token.id));
}

function braidTrailCells() {
    if (!isJumpMode(game?.mode)) return new Set();
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
    const isAnyonReversi = isAnyonReversiMode(game.mode);
    const display = isAnyonReversi
        ? jumpTypeDisplay(stone.anyonType)
        : isPhysical
        ? (els.physicsViewSelect.value === 'physics'
            ? game.physicalLabel(stone)
            : stone.isAncilla ? 'A' : stone.color === 'black' ? 'B' : 'W')
        : pauliDisplay(stone);
    node.textContent = stone.revealed === false || stone.pauliLabel === 'unknown' ? '?' : display;
    node.title = isAnyonReversi
        ? `${stone.color} ${jumpTypeDisplay(stone.anyonType)} (${stone.anyonType}); fusions ${stone.fusionHistory?.length || 0}; ${game.time?.tooltipForEntity(stone) || ''}`
        : isPhysical
        ? `${stone.color} sector; ${game.physicalLabel(stone)}; Pauli ${stone.pauliLabel}; sign ${stone.pauliSign}; phase ${stone.phase}; ancilla ${stone.isAncilla ? stone.ancillaBasis : 'no'}; non-stabilizer ${stone.nonStabilizerApprox ? 'yes' : 'no'}; last ${stone.lastUpdate?.action || 'setup'}`
        : `${stone.color} ${pauliDisplay(stone)}; ${game.time?.tooltipForEntity(stone) || ''}`;
    cell.append(node);
}

function renderIsingSpin(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone ising-spin ${stone.color}`;
    node.textContent = stone.spin > 0 ? '+1' : '-1';
    node.title = `${stone.color === 'black' ? 'spin up' : 'spin down'} ${stone.label}`;
    cell.append(node);
}

function renderTwoPhaseSite(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone ising-spin two-phase-site ${stone.color}`;
    node.textContent = stone.phase;
    node.title = stone.phase === 'A' ? 'phase A domain' : 'phase B domain';
    cell.append(node);
}

function renderClusterSite(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone go-stone cluster-site ${stone.color}`;
    node.textContent = stone.species;
    const badge = document.createElement('span');
    badge.className = 'cft-badge';
    badge.textContent = `L${stone.liberties ?? 0}`;
    node.append(badge);
    node.title = `${stone.label}; liberties ${stone.liberties ?? 0}`;
    cell.append(node);
}

function renderJumpParticleSite(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone go-stone jump-particle-site ${stone.color}`;
    node.textContent = stone.color === 'black' ? 'P+' : 'P-';
    const badge = document.createElement('span');
    badge.className = 'cft-badge';
    badge.textContent = `π${stone.parity || 0}`;
    node.append(badge);
    node.title = `${stone.label}; path length ${stone.pathLength || 0}; parity ${stone.parity || 0}`;
    cell.append(node);
}

function renderSpinIceVertex(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone ising-spin spin-ice-vertex ${stone.color}`;
    if (stone.violation) node.classList.add('violation');
    node.textContent = stone.violation ? `M${stone.charge > 0 ? '+' : '-'}${Math.abs(stone.charge)}` : 'ice';
    node.title = `${stone.incoming} in / ${stone.outgoing} out${stone.violation ? '; monopole violation' : '; ice rule satisfied'}`;
    cell.append(node);
}

function renderZ2GaugeVertex(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone ising-spin z2-gauge-vertex ${stone.color}`;
    if (stone.violation) node.classList.add('violation');
    node.textContent = stone.label;
    node.title = `star ${stone.star > 0 ? '+1' : '-1'}; flux ${stone.flux > 0 ? '+1' : '-1'}`;
    cell.append(node);
}

function renderZ2GaugeEdges(cell, coord) {
    if (typeof game.incidentEdges !== 'function') return;
    const sourceKey = coordKey(coord);
    for (const edge of game.incidentEdges(coord)) {
        const atA = coordKey(edge.a) === sourceKey;
        const other = atA ? edge.b : edge.a;
        if (coord.length > 2 && other.slice(2).some((value, axis) => value !== coord[axis + 2])) continue;
        const dx = Number(other[0]) - Number(coord[0]);
        const dy = Number(other[1]) - Number(coord[1]);
        if ((dx === 0 && dy === 0) || Math.abs(dx) > 1 || Math.abs(dy) > 1) continue;
        const value = game.value(edge);
        const segment = document.createElement('span');
        segment.className = `z2-gauge-edge ${value > 0 ? 'black' : 'white'}`;
        segment.style.setProperty('--edge-angle', `${Math.atan2(-dy, dx) * 180 / Math.PI}deg`);
        segment.title = `${edge.key}: Ue=${value > 0 ? '+1' : '-1'}`;
        segment.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleZ2GaugeEdgeClick(edge.key, coord);
        });
        cell.append(segment);
    }
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
    const groupInfo = game.groupInfoAt?.(coord) || null;
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
    label.textContent = token.revealed === false ? '?' : jumpTypeDisplay(token.anyonType);
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
    node.title = `${token.id} ${token.owner} ${jumpTypeDisplay(token.anyonType)} (${token.anyonType})${energyInfo};${braidInfo}; ${game.time?.tooltipForEntity(token) || ''}`;
    cell.append(node);
}

function cellTooltip(coord, { timeState = null, goStone = null } = {}) {
    if (isIsingDomainMode(game.mode)) {
        const spin = game.getSpin(coord);
        if (spin == null) return `${game.topology.displayCoord(coord)} empty / undecided Ising site`;
        const same = game.topology.neighbors(coord).filter((neighbor) => game.getSpin(neighbor) === spin).length;
        const opposite = game.topology.neighbors(coord).filter((neighbor) => game.getSpin(neighbor) === -spin).length;
        return `${game.topology.displayCoord(coord)} ${spin > 0 ? 'spin up s=+1' : 'spin down s=-1'}; same neighbors ${same}; opposite neighbors ${opposite}`;
    }
    if (isTwoPhaseCompetitionMode(game.mode)) {
        const phase = game.getPhase(coord);
        if (!phase) return `${game.topology.displayCoord(coord)} metastable / unconverted site`;
        const same = game.topology.neighbors(coord).filter((neighbor) => game.getPhase(neighbor) === phase).length;
        const opposite = game.topology.neighbors(coord).filter((neighbor) => {
            const neighborPhase = game.getPhase(neighbor);
            return neighborPhase && neighborPhase !== phase;
        }).length;
        return `${game.topology.displayCoord(coord)} phase ${phase}; same neighbors ${same}; interface neighbors ${opposite}`;
    }
    if (isPhysicalClusterGoMode(game.mode)) {
        const species = game.getSpecies(coord);
        if (!species) return `${game.topology.displayCoord(coord)} empty growth/resource site`;
        const same = game.topology.neighbors(coord).filter((neighbor) => game.getSpecies(neighbor) === species).length;
        const opposite = game.topology.neighbors(coord).filter((neighbor) => {
            const neighborSpecies = game.getSpecies(neighbor);
            return neighborSpecies && neighborSpecies !== species;
        }).length;
        const liberties = game.groupInfoAt(coord)?.liberties.size || 0;
        return `${game.topology.displayCoord(coord)} species ${species}; liberties ${liberties}; same neighbors ${same}; interface neighbors ${opposite}`;
    }
    if (isSpinIceVertexMode(game.mode)) {
        const info = game.getVertexState(coord);
        if (!info) return `${game.topology.displayCoord(coord)} spin-ice vertex`;
        return `${game.topology.displayCoord(coord)} ${info.incoming} in / ${info.outgoing} out; charge ${info.charge}; ${info.violation ? 'monopole violation' : 'ice rule satisfied'}`;
    }
    if (isZ2GaugeLoopMode(game.mode)) {
        const state = game.getVertexState(coord);
        if (!state) return `${game.topology.displayCoord(coord)} Z2 gauge vertex`;
        const flux = state.plaquette ? game.plaquetteValue(state.plaquette) : 1;
        return `${game.topology.displayCoord(coord)} star=${state.star > 0 ? '+1' : '-1'}; plaquette flux=${flux > 0 ? '+1' : '-1'}; incident edges ${state.incidentEdges.length}`;
    }
    if (isCFTReversiMode(game.mode)) {
        const stone = game.getStone(coord);
        const stress = game.stressAt(coord);
        return stone
            ? `${game.topology.displayCoord(coord)} ${game.primaryLabel(stone)}; h=${stone.h}, hbar=${stone.hbar}; phase=${stone.phaseAngle}; channel=${cftChannelDisplay(stone)}; T=${stress.stress.toFixed(2)}`
            : `${game.topology.displayCoord(coord)} identity/empty; T=${stress.stress.toFixed(2)}`;
    }
    if (isPhysicalVirasoroGoMode(game.mode)) {
        const stress = game.stressAt(coord);
        const groupInfo = goStone ? game.groupInfoAt?.(coord) || null : null;
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

function executeCustomPauliSite(coord, { pauliLabel, pauliSign, phase = Number(els.physicalPhaseSelect.value) || 0 } = {}) {
    if ([...els.physicalPauliSelect.options].some((option) => option.value === pauliLabel)) {
        els.physicalPauliSelect.value = pauliLabel;
    }
    if (els.customInitialSignSelect) els.customInitialSignSelect.value = String(pauliSign || 1);
    const result = game.setCustomInitialSite(coord, {
        pauliLabel,
        pauliSign,
        phase
    });
    if (result?.ok) {
        hoverCoord = null;
        selectedPhysicalCoord = null;
        els.statusText.textContent = pauliLabel === 'I'
            ? `Custom setup cleared ${game.topology.displayCoord(coord)}. Press Start when the initial board is ready.`
            : `Custom setup set ${pauliSign < 0 ? '-' : '+'}${pauliLabel} at ${game.topology.displayCoord(coord)}. Press Start when the initial board is ready.`;
    } else if (result) {
        els.statusText.textContent = result.error;
    }
    render();
}

function showCustomPauliSetupPalette(coord, event) {
    const phase = Number(els.physicalPhaseSelect.value) || 0;
    const labels = ['X', 'Y', 'Z'];
    const items = [
        {
            label: 'Clear / I',
            detail: 'Set this site to empty identity I.',
            onChoose: () => executeCustomPauliSite(coord, { pauliLabel: 'I', pauliSign: 1, phase })
        },
        ...labels.flatMap((pauliLabel) => [
            {
                label: `Set +${pauliLabel}`,
                detail: 'Positive stabilizer-sector Pauli site.',
                onChoose: () => executeCustomPauliSite(coord, { pauliLabel, pauliSign: 1, phase })
            },
            {
                label: `Set -${pauliLabel}`,
                detail: 'Negative stabilizer-sector Pauli site.',
                onChoose: () => executeCustomPauliSite(coord, { pauliLabel, pauliSign: -1, phase })
            }
        ])
    ];
    return showActionPalette(coord, event, {
        title: `Custom Pauli at ${game.topology.displayCoord(coord)}`,
        status: 'Choose I/X/Y/Z and sign for this recovery initial site.',
        items
    });
}

function handlePhysicalCliffordClick(coord, event = null) {
    const action = els.physicalActionSelect.value;
    let result = null;
    if (action === 'reversi' && customStabilizerSetupPending()) {
        showCustomPauliSetupPalette(coord, event);
        return;
    } else if (action === 'reversi') {
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
        els.statusText.textContent = result.event.type === 'custom_initial_site'
            ? `Custom setup updated ${game.topology.displayCoord(coord)}. Press Start when the initial board is ready.`
            : `${capitalize(result.event.type || result.event.action)} completed on ${affected} site${affected === 1 ? '' : 's'}.`;
    } else {
        els.statusText.textContent = result.error;
    }
    render();
}

function startCustomStabilizerRecovery() {
    if (!customStabilizerSetupSelected(game?.mode || selectedMode())) {
        els.statusText.textContent = 'Choose Pauli Error Correction / Recovery with Custom Setup first.';
        return;
    }
    const result = game?.startPhysicalProblemNow?.();
    if (result?.ok) {
        els.statusText.textContent = `Recovery started from ${result.event.customSiteCount} custom site${result.event.customSiteCount === 1 ? '' : 's'}.`;
    } else {
        els.statusText.textContent = result?.error || 'Could not start custom recovery.';
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

function handleIsingClick(coord) {
    const action = els.isingActionSelect?.value || 'place_or_flip';
    let result = null;
    if (action === 'flip_domain') {
        result = game.flipDomain(coord, game.currentPlayer);
    } else if (action === 'bracket_flip') {
        result = game.bracketFlip(coord, game.currentPlayer);
    } else if (game.isEmpty(coord)) {
        result = game.placeSpin(coord, game.currentPlayer);
    } else {
        result = game.flipSpin(coord, game.currentPlayer);
    }
    if (result?.ok) {
        hoverCoord = null;
        const update = result.event.physicalUpdate;
        els.statusText.textContent = `${result.event.action.replaceAll('_', ' ')} ${update.acceptedMove ? 'accepted' : 'rejected'}; deltaE ${formatNumber(update.deltaEnergy)}; E ${formatNumber(result.event.observables.energy)}.`;
    } else if (result) {
        els.statusText.textContent = result.error;
    }
    render();
}

function handleTwoPhaseClick(coord) {
    const action = els.twoPhaseActionSelect?.value || 'auto';
    let result = null;
    if (action === 'nucleate') {
        result = game.nucleate(coord, game.currentPlayer);
    } else if (action === 'grow') {
        result = game.growDomain(coord, game.currentPlayer);
    } else if (action === 'flip_interface') {
        result = game.flipInterface(coord, game.currentPlayer);
    } else if (game.isEmpty(coord)) {
        const phase = game.currentPlayer === 'white' ? 'B' : 'A';
        const canGrow = game.topology.neighbors(coord).some((neighbor) => game.getPhase(neighbor) === phase);
        result = canGrow ? game.growDomain(coord, game.currentPlayer) : game.nucleate(coord, game.currentPlayer);
    } else {
        result = game.flipInterface(coord, game.currentPlayer);
    }
    if (result?.ok) {
        hoverCoord = null;
        const update = result.event.physicalUpdate;
        const observables = result.event.observables;
        render();
        els.statusText.textContent = `${result.event.action.replaceAll('_', ' ')}; deltaE ${formatNumber(update.deltaEnergy)}; interface ${observables.interfaceLength}; A ${formatNumber(observables.areaFractionA)}, B ${formatNumber(observables.areaFractionB)}.`;
        statusHoldUntil = Date.now() + 1800;
        return;
    } else if (result) {
        els.statusText.textContent = result.error;
    }
    render();
}

function handleClusterClick(coord) {
    const action = els.clusterActionSelect?.value || 'auto';
    let result = null;
    if (action === 'grow_connected_cluster') {
        result = game.growCluster(coord, game.currentPlayer);
    } else if (action === 'diffusion_noise_step') {
        result = game.applyDiffusionNoise(game.currentPlayer);
    } else if (action === 'place_species') {
        result = game.placeSpecies(coord, game.currentPlayer);
    } else {
        const species = game.currentPlayer === 'white' ? 'B' : 'A';
        const canGrow = game.isEmpty(coord)
            && game.topology.neighbors(coord).some((neighbor) => game.getSpecies(neighbor) === species);
        result = canGrow ? game.growCluster(coord, game.currentPlayer) : game.placeSpecies(coord, game.currentPlayer);
    }
    if (result?.ok) {
        hoverCoord = null;
        render();
        const observables = result.event.observables;
        const update = result.event.physicalUpdate || {};
        const captured = Number(update.capturedCount || 0);
        els.statusText.textContent = `${result.event.action.replaceAll('_', ' ')}; captured ${captured}; largest ${observables.largestCluster}; survival ${formatNumber(observables.survivalProbability)}; wraps ${observables.topologyWrappingClusterCount}.`;
        statusHoldUntil = Date.now() + 1800;
        return;
    } else if (result) {
        els.statusText.textContent = result.error;
    }
    render();
}

function handleJumpParticlesClick(coord) {
    const action = els.jumpParticleActionSelect?.value || 'auto';
    const particle = game.getParticle(coord);
    let result = null;

    if (action === 'measure_path_parity') {
        result = game.measurePathParity(coord, game.currentPlayer);
    } else if (selectedJumpParticleCoord) {
        const selectedKey = coordKey(selectedJumpParticleCoord);
        const clickedKey = coordKey(coord);
        if (selectedKey === clickedKey) {
            selectedJumpParticleCoord = null;
            els.statusText.textContent = 'Particle selection cleared.';
            render();
            return;
        }
        if (particle && particle.color !== game.currentPlayer) {
            result = game.recombine(selectedJumpParticleCoord, coord);
        } else if (!particle) {
            result = game.moveParticle(selectedJumpParticleCoord, coord, { action });
        } else if (particle.color === game.currentPlayer) {
            selectedJumpParticleCoord = coord;
            els.statusText.textContent = `Selected ${game.topology.displayCoord?.(coord) || coord.join(',')} for ${action.replaceAll('_', ' ')}.`;
            render();
            return;
        }
    } else if (particle?.color === game.currentPlayer) {
        selectedJumpParticleCoord = coord;
        els.statusText.textContent = `Selected ${particle.species}. Choose an empty landing, or an adjacent opposite particle to recombine.`;
        render();
        return;
    } else if (particle) {
        els.statusText.textContent = 'Select one of your own particles first.';
        render();
        return;
    } else {
        els.statusText.textContent = 'Select one of your particles, then choose a hop, jump, chain jump, or recombination target.';
        render();
        return;
    }

    if (result?.ok) {
        hoverCoord = null;
        selectedJumpParticleCoord = null;
        render();
        const observables = result.event.observables || game.computePhysicalObservables();
        els.statusText.textContent = result.event.action === 'measure_path_parity'
            ? `Path parity measured: ${result.measurement.reported}.`
            : `${result.event.action.replaceAll('_', ' ')}; particles ${observables.particleCount}; recombinations ${observables.recombinationCount}; avg path ${formatNumber(observables.averagePathLength)}.`;
        statusHoldUntil = Date.now() + 1800;
        return;
    } else if (result) {
        els.statusText.textContent = result.error;
    }
    render();
}

function handleSpinIceClick(coord) {
    const action = els.spinIceActionSelect?.value || 'flip_arrow';
    let result = null;
    if (action === 'flip_string') result = game.flipString(coord, game.currentPlayer);
    else if (action === 'flip_loop') result = game.flipLoop(coord, game.currentPlayer);
    else if (action === 'move_monopole') result = game.moveMonopole(coord, game.currentPlayer);
    else if (action === 'annihilate_pair') result = game.annihilateMonopoles(coord, game.currentPlayer);
    else result = game.flipArrow(coord, game.currentPlayer);
    if (result?.ok) {
        hoverCoord = null;
        render();
        const observables = result.event.observables;
        const update = result.event.physicalUpdate;
        els.statusText.textContent = `${result.event.action.replaceAll('_', ' ')}; dE ${formatNumber(update.deltaEnergy)}; monopoles ${observables.monopoleCount}; defects ${observables.iceRuleViolations}; string ${observables.stringLength}.`;
        statusHoldUntil = Date.now() + 1800;
        return;
    } else if (result) {
        els.statusText.textContent = result.error;
    }
    render();
}

function handleZ2GaugeClick(coord) {
    const action = els.z2GaugeActionSelect?.value || 'flip_edge';
    let result = null;
    if (action === 'flip_path') result = game.flipGaugePath(coord, game.currentPlayer);
    else if (action === 'flip_loop') result = game.flipGaugeLoop(coord, game.currentPlayer);
    else if (action === 'measure_star') result = game.measureGaugeCheck(coord, 'star', game.currentPlayer);
    else if (action === 'measure_plaquette') result = game.measureGaugeCheck(coord, 'plaquette', game.currentPlayer);
    else if (action === 'noisy_edge_flip') result = game.applyGaugeNoise(coord, game.currentPlayer);
    else result = game.flipGaugeEdge(coord, game.currentPlayer);
    if (result?.ok) {
        hoverCoord = null;
        render();
        const observables = result.event.observables;
        const update = result.event.physicalUpdate || {};
        const measurement = update.measurement ? `; ${update.measurement.check}=${update.measurement.value > 0 ? '+1' : '-1'}` : '';
        els.statusText.textContent = `${result.event.action.replaceAll('_', ' ')}; dE ${formatNumber(update.deltaEnergy || 0)}; syndrome ${observables.syndromeWeight}; sector ${observables.logicalSector}${measurement}.`;
        statusHoldUntil = Date.now() + 1800;
        return;
    } else if (result) {
        els.statusText.textContent = result.error;
    }
    render();
}

function handleZ2GaugeEdgeClick(edgeKey, fallbackCoord) {
    const action = els.z2GaugeActionSelect?.value || 'flip_edge';
    let result = null;
    if (action === 'noisy_edge_flip') result = game.applyGaugeNoiseByKey(edgeKey, game.currentPlayer);
    else if (action === 'flip_edge') result = game.flipGaugeEdgeByKey(edgeKey, game.currentPlayer);
    else return handleZ2GaugeClick(fallbackCoord);
    if (result?.ok) {
        hoverCoord = null;
        render();
        const observables = result.event.observables;
        const update = result.event.physicalUpdate || {};
        els.statusText.textContent = `Edge ${edgeKey} ${result.event.action.replaceAll('_', ' ')}; dE ${formatNumber(update.deltaEnergy || 0)}; syndrome ${observables.syndromeWeight}; sector ${observables.logicalSector}.`;
        statusHoldUntil = Date.now() + 1800;
        return;
    } else if (result) {
        els.statusText.textContent = result.error;
    }
    render();
}

function executeCliffordGoPlacement(coord, pauliLabel = els.pauliSelect.value) {
    els.pauliSelect.value = pauliLabel;
    const result = game.tryPlay(coord, game.currentPlayer, { pauliLabel });
    els.statusText.textContent = result.ok
        ? `Inserted ${game.primaryLabel(game.getStone(coord))}; captured ${result.captured || 0}.`
        : result.error;
    if (result.ok) hoverCoord = null;
    render();
}

function showCliffordGoPalette(coord, event) {
    return showActionPalette(coord, event, {
        title: `Set Pauli at ${game.topology.displayCoord(coord)}`,
        status: 'Choose the Pauli operator for this Clifford Go insertion.',
        items: optionItems(els.pauliSelect, (value) => executeCliffordGoPlacement(coord, value))
    });
}

function executeCFTGoPrimaryPlacement(coord, primaryType = els.cftPrimarySelect.value) {
    els.cftPrimarySelect.value = primaryType;
    const result = game.tryPlay(coord, game.currentPlayer, { primaryType });
    let message = '';
    if (result?.ok) {
        hoverCoord = null;
        selectedCFTCoords = [];
        message = `Inserted ${els.cftPrimarySelect.value}; captured ${result.captured || 0} primary field${result.captured === 1 ? '' : 's'}.`;
    } else if (result) {
        message = result.error;
    }
    render();
    if (message) {
        els.statusText.textContent = message;
        statusHoldUntil = Date.now() + 1800;
    }
}

function executeCFTReversiPrimaryPlacement(coord, primaryType = els.cftPrimarySelect.value) {
    els.cftPrimarySelect.value = primaryType;
    const result = game.place(coord, {
        primaryType,
        player: game.currentPlayer
    });
    if (result?.ok) {
        hoverCoord = null;
        selectedCFTCoords = [];
        els.statusText.textContent = `Placed ${primaryType}; transformed ${result.event.flipped.length} interval site${result.event.flipped.length === 1 ? '' : 's'}.`;
    } else if (result) {
        els.statusText.textContent = result.error;
    }
    render();
}

function showCFTPrimaryPalette(coord, event, { go = false } = {}) {
    return showActionPalette(coord, event, {
        title: `Insert primary at ${game.topology.displayCoord(coord)}`,
        status: 'Choose the CFT primary/operator for this site.',
        items: optionItems(els.cftPrimarySelect, (value) => {
            if (go) executeCFTGoPrimaryPlacement(coord, value);
            else executeCFTReversiPrimaryPlacement(coord, value);
        })
    });
}

function executeAnyonReversiPlacement(coord, anyonType = els.anyonExcitationTypeSelect.value) {
    if ([...els.anyonExcitationTypeSelect.options].some((option) => option.value === anyonType)) {
        els.anyonExcitationTypeSelect.value = anyonType;
    }
    const result = game.place(coord, {
        anyonType,
        player: game.currentPlayer
    });
    if (result?.ok) {
        hoverCoord = null;
        els.statusText.textContent = `Placed ${jumpTypeDisplay(result.event.anyonType)}; fused ${result.event.flipped.length} interval charge${result.event.flipped.length === 1 ? '' : 's'}.`;
    } else if (result) {
        els.statusText.textContent = result.error;
    }
    render();
}

function showAnyonReversiPalette(coord, event) {
    const types = game.placementTypes?.() || excitationCatalog().types;
    return showActionPalette(coord, event, {
        title: `Place charge at ${game.topology.displayCoord(coord)}`,
        status: 'Choose the anyon charge for this Reversi placement.',
        items: types.map((type) => ({
            label: `Place ${jumpTypeDisplay(type)}`,
            detail: game.config?.anyonModel === 'zn' ? `Z_${game.config.generalAnyonGrade} charge ${type}` : type,
            onChoose: () => executeAnyonReversiPlacement(coord, type)
        }))
    });
}

function executeAnyonDrop(tokenId) {
    const result = game.dropAnyon(tokenId, game.currentPlayer);
    els.statusText.textContent = result.ok
        ? `${capitalize(result.event.player)} recombined ${result.event.tokenId}; recovered ${formatNumber(result.event.recovered)} energy${result.event.entanglement?.length ? `; ${result.event.entanglement.length} channel decohered` : ''}.`
        : result.error;
    if (result.ok) selectedToken = '';
    render();
}

function executeAnyonExcite(coord, anyonType) {
    els.anyonExcitationTypeSelect.value = anyonType;
    const result = game.exciteAnyon(coord, anyonType, game.currentPlayer);
    els.statusText.textContent = result.ok
        ? `${capitalize(result.event.player)} excited ${jumpTypeDisplay(result.event.anyonType)} at (${result.event.coord.join(',')}); energy ${formatNumber(result.event.energyAfter)}.`
        : result.error;
    if (result.ok) {
        selectedToken = '';
        hoverCoord = null;
    }
    render();
}

function executeAnyonSelect(token) {
    selectedToken = token.id;
    els.statusText.textContent = `Selected ${token.id} (${jumpTypeDisplay(token.anyonType)}). Click an empty site to move, another token to braid/unbraid, or use Recombine / Recover.`;
    render();
}

function executeAnyonTargetToken(token) {
    if (!selectedToken) {
        els.statusText.textContent = 'Select one of your anyons first.';
        return;
    }
    const selected = game.tokens.get(selectedToken);
    const path = selected ? [selected.coord, token.coord] : [];
    const direction = selected ? token.coord.map((value, axis) => value - selected.coord[axis]) : [];
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
}

function executeAnyonMove(coord) {
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
            els.statusText.textContent = `${capitalize(result.event.kind)} completed${result.event.noise?.length ? `; ${result.event.noise.length} noise rolls logged` : ''}${result.event.time?.applied ? `; time clock ${result.event.time.phase} applied` : ''}.`;
        }
    } else {
        els.statusText.textContent = result.error;
    }
    render();
}

function anyonExcitationItems(coord, { availableOnly = false } = {}) {
    syncAnyonExcitationTypeOptions();
    const options = [...els.anyonExcitationTypeSelect.options]
        .filter((option) => !availableOnly || !option.disabled);
    return options.map((option) => ({
        label: `Excite ${jumpTypeDisplay(option.value)}`,
        detail: option.textContent.trim().replace(`${jumpTypeDisplay(option.value)} - `, ''),
        disabled: option.disabled,
        onChoose: () => executeAnyonExcite(coord, option.value)
    }));
}

function jumpSetTypeItems(token, { prefix = 'Set' } = {}) {
    const source = game.excitationTypeOptions?.() || excitationCatalog().types.map((value) => ({
        value,
        label: jumpTypeDisplay(value),
        detail: ''
    }));
    return source.map((option) => ({
        label: `${prefix} ${jumpTypeDisplay(option.value)}`,
        detail: option.detail || option.label || '',
        disabled: option.disabled,
        onChoose: () => {
            const result = game.setTokenType(token.id, option.value, game.currentPlayer, { consumeTurn: false });
            els.statusText.textContent = result.ok
                ? `${token.id} algebra label set to ${jumpTypeDisplay(result.event.after)}.`
                : result.error;
            selectedToken = '';
            hoverCoord = null;
            render();
        }
    }));
}

function showOwnedJumpTokenPalette(token, coord, event, { excitationMode = false } = {}) {
    const items = [
        {
            label: 'Select / Move',
            detail: 'Use this piece for hop, jump, braid, or unbraid.',
            onChoose: () => executeAnyonSelect(token)
        },
        ...jumpSetTypeItems(token)
    ];
    if (excitationMode) {
        items.push({
            label: 'Recombine / Recover',
            detail: 'Remove this owned excitation and recover energy.',
            onChoose: () => {
                const result = game.dropAnyon(token.id, game.currentPlayer);
                els.statusText.textContent = result.ok
                    ? `${capitalize(result.event.player)} recombined ${result.event.tokenId}; recovered ${formatNumber(result.event.recovered)} energy.`
                    : result.error;
                selectedToken = '';
                hoverCoord = null;
                render();
            }
        });
    }
    showActionPalette(coord, event, {
        title: `${token.id} ${jumpTypeDisplay(token.anyonType)}`,
        status: 'Choose how to use or relabel this owned piece.',
        items
    });
}

function handleAnyonExcitationClick(coord, event = null) {
    const token = game.tokenAt(coord);
    if (token) {
        if (selectedToken && token.id !== selectedToken) {
            executeAnyonTargetToken(token);
            return;
        }
        if (token.owner === game.currentPlayer) {
            showOwnedJumpTokenPalette(token, coord, event, { excitationMode: true });
            return;
        }
        els.statusText.textContent = selectedToken
            ? 'That target cannot be braided or unbraided by the selected anyon.'
            : 'Select one of your own anyons first.';
        return;
    }

    if (selectedToken) {
        executeAnyonMove(coord);
        return;
    }
    const items = anyonExcitationItems(coord, { availableOnly: true });
    if (!items.length) {
        els.statusText.textContent = `${capitalize(game.currentPlayer)} has no affordable excitation for this empty site.`;
        return;
    }
    showActionPalette(coord, event, {
        title: `Empty site ${game.topology.displayCoord(coord)}`,
        status: 'Choose an available excitation particle for this site.',
        items
    });
}

function handleCellPointerActivation(coord, event = null) {
    if (!isAnyonInteractionMode()) {
        handleCellClick(coord, event);
        return;
    }
    cancelAnyonClickTimer();
    anyonClickTimer = window.setTimeout(() => {
        anyonClickTimer = 0;
        handleCellClick(coord, event);
    }, 210);
}

function handleCellClick(coord, event = null) {
    cancelAnyonClickTimer();
    closeActionPalette();
    if (els.playModeSelect.value === 'online') {
        const online = getOnlineState();
        if (online.room?.status !== 'playing') {
            els.statusText.textContent = 'Wait for the online room to connect both players.';
            return;
        }
        if (online.playerColor !== game.currentPlayer) {
            els.statusText.textContent = `You are ${online.playerColor || 'spectator'}; waiting for ${game.currentPlayer}.`;
            return;
        }
    }
    if (isPhysicalCliffordMode(game.mode)) {
        handlePhysicalCliffordClick(coord, event);
        return;
    }
    if (isIsingDomainMode(game.mode)) {
        handleIsingClick(coord);
        return;
    }
    if (isTwoPhaseCompetitionMode(game.mode)) {
        handleTwoPhaseClick(coord);
        return;
    }
    if (isPhysicalClusterGoMode(game.mode)) {
        handleClusterClick(coord);
        return;
    }
    if (isPhysicalJumpParticlesMode(game.mode)) {
        handleJumpParticlesClick(coord);
        return;
    }
    if (isSpinIceVertexMode(game.mode)) {
        handleSpinIceClick(coord);
        return;
    }
    if (isZ2GaugeLoopMode(game.mode)) {
        handleZ2GaugeClick(coord);
        return;
    }
    if (isCFTReversiMode(game.mode)) {
        if (els.cftActionSelect.value === 'place') {
            showCFTPrimaryPalette(coord, event, { go: false });
            return;
        }
        handleCFTReversiClick(coord);
        return;
    }
    if (isAnyonReversiMode(game.mode)) {
        executeAnyonReversiPlacement(coord, els.anyonExcitationTypeSelect.value);
        return;
    }
    if (isCliffordGoMode(game.mode)) {
        showCliffordGoPalette(coord, event);
        return;
    }
    if (isPhysicalVirasoroGoMode(game.mode)) {
        if (els.cftActionSelect.value === 'place') {
            showCFTPrimaryPalette(coord, event, { go: true });
            return;
        }
        handleCFTGoClick(coord);
        return;
    }
    if (isReversiMode(game.mode)) {
        const result = game.place(coord, {
            pauliLabel: els.pauliSelect.value,
            transform: els.transformSelect.value
        });
        els.statusText.textContent = result.ok
            ? `Flipped ${result.event.flipped.length} stone${result.event.flipped.length === 1 ? '' : 's'}${result.event.noise?.length ? `; ${result.event.noise.length} noise rolls logged` : ''}${result.event.time?.applied ? `; time clock ${result.event.time.phase} applied` : ''}.`
            : result.error;
        if (result.ok) hoverCoord = null;
        render();
        return;
    }

    const token = game.tokenAt(coord);
    const excitationMode = game.config?.setupMode === 'excitation';
    if (excitationMode) {
        handleAnyonExcitationClick(coord, event);
        return;
    }
    const anyonTurnAction = excitationMode ? els.anyonActionSelect.value : 'move';
    if (token && selectedToken && token.id === selectedToken) {
        if (excitationMode && anyonTurnAction === 'recombine' && token.owner === game.currentPlayer) {
            const result = game.dropAnyon(token.id, game.currentPlayer);
            els.statusText.textContent = result.ok
                ? `${capitalize(result.event.player)} recombined ${result.event.tokenId}; recovered ${formatNumber(result.event.recovered)} energy${result.event.entanglement?.length ? `; ${result.event.entanglement.length} channel decohered` : ''}.`
                : result.error;
            if (result.ok) selectedToken = '';
            render();
            return;
        }
        selectedToken = '';
        hoverCoord = null;
        els.statusText.textContent = 'Selection cleared.';
        render();
        return;
    }
    if (token && selectedToken && token.id !== selectedToken) {
        if (excitationMode && anyonTurnAction === 'recombine' && token.owner === game.currentPlayer) {
            const result = game.dropAnyon(token.id, game.currentPlayer);
            els.statusText.textContent = result.ok
                ? `${capitalize(result.event.player)} recombined ${result.event.tokenId}; recovered ${formatNumber(result.event.recovered)} energy${result.event.entanglement?.length ? `; ${result.event.entanglement.length} channel decohered` : ''}.`
                : result.error;
            if (result.ok) selectedToken = '';
            render();
            return;
        }
        if (excitationMode && anyonTurnAction !== 'move') {
            els.statusText.textContent = anyonTurnAction === 'excite'
                ? 'Excite targets an empty vertex. Choose Move / Braid to unbraid or move existing anyons.'
                : 'Recombine / Recover targets one of your own anyons.';
            return;
        }
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
        if (excitationMode && anyonTurnAction === 'recombine') {
            const result = game.dropAnyon(token.id, game.currentPlayer);
            els.statusText.textContent = result.ok
                ? `${capitalize(result.event.player)} recombined ${result.event.tokenId}; recovered ${formatNumber(result.event.recovered)} energy${result.event.entanglement?.length ? `; ${result.event.entanglement.length} channel decohered` : ''}.`
                : result.error;
            if (result.ok) selectedToken = '';
            render();
            return;
        }
        if (excitationMode && anyonTurnAction === 'excite') {
            executeAnyonSelect(token);
            return;
        }
        executeAnyonSelect(token);
        return;
    }
    if (!token && excitationMode && anyonTurnAction === 'excite') {
        syncAnyonExcitationTypeOptions();
        const selectedType = els.anyonExcitationTypeSelect.value;
        const result = game.exciteAnyon(coord, selectedType, game.currentPlayer);
        els.statusText.textContent = result.ok
            ? `${capitalize(result.event.player)} excited ${jumpTypeDisplay(result.event.anyonType)} at (${result.event.coord.join(',')}); energy ${formatNumber(result.event.energyAfter)}.`
            : result.error;
        if (result.ok) {
            selectedToken = '';
            hoverCoord = null;
        }
        render();
        return;
    }
    if (!selectedToken) {
        els.statusText.textContent = excitationMode && anyonTurnAction === 'recombine'
            ? 'Choose one of your own anyons to recombine and recover energy.'
            : excitationMode && anyonTurnAction === 'excite'
            ? 'Click an empty vertex to excite the selected particle type.'
            : excitationMode
            ? 'Select one of your anyons first, or choose Excite Anyon to create a new particle.'
            : 'Select one of your anyons first.';
        return;
    }
    if (excitationMode && anyonTurnAction !== 'move') {
        els.statusText.textContent = anyonTurnAction === 'recombine'
            ? 'Choose one of your own anyons to recombine and recover energy.'
            : 'Click an empty vertex to excite the selected particle type.';
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
            els.statusText.textContent = `${capitalize(result.event.kind)} completed${result.event.noise?.length ? `; ${result.event.noise.length} noise rolls logged` : ''}${result.event.time?.applied ? `; time clock ${result.event.time.phase} applied` : ''}.`;
        }
    } else {
        els.statusText.textContent = result.error;
    }
    render();
}

function showAnyonJumpOptions(coord, event = null) {
    const token = game.tokenAt(coord);
    const excitationMode = game.config?.setupMode === 'excitation';
    if (token && token.owner === game.currentPlayer) {
        showOwnedJumpTokenPalette(token, coord, event, { excitationMode });
        return true;
    }
    if (excitationMode && !token) {
        const items = anyonExcitationItems(coord, { availableOnly: true });
        if (!items.length) {
            els.statusText.textContent = `${capitalize(game.currentPlayer)} has no affordable excitation for this empty site.`;
            return false;
        }
        return showActionPalette(coord, event, {
            title: `Empty site ${game.topology.displayCoord(coord)}`,
            status: 'Choose an available excitation particle for this site.',
            items
        });
    }
    if (token) {
        els.statusText.textContent = selectedToken
            ? 'Single-click this target to braid or unbraid with the selected anyon.'
            : 'Only owned anyons have local option menus.';
    } else {
        els.statusText.textContent = selectedToken
            ? 'Single-click an empty site to move the selected anyon.'
            : 'Select one of your anyons first, or double-click an owned anyon for options.';
    }
    return false;
}

function handleCellDoubleClick(coord, event = null) {
    cancelAnyonClickTimer();
    event?.preventDefault?.();
    event?.stopPropagation?.();
    closeActionPalette();
    if (isAnyonReversiMode(game.mode)) {
        showAnyonReversiPalette(coord, event);
        return;
    }
    if (isJumpMode(game.mode)) {
        showAnyonJumpOptions(coord, event);
    }
}

function measureTarget() {
    if (isPhysicalVirasoroGoMode(game.mode)) {
        els.statusText.textContent = 'Choose Measure in Turn Action, then select the required CFT sites on the board.';
        return;
    }
    if (isReversiMode(game.mode)) {
        const target = hoverCoord || [...game.board.keys()][0]?.split(',').map(Number);
        const result = isAnyonReversiMode(game.mode)
            ? game.measureAnyonChargeAt(target, game.currentPlayer)
            : game.measurePauliParity(target, game.currentPlayer);
        els.statusText.textContent = result.ok
            ? `Measured ${isAnyonReversiMode(game.mode) ? 'anyon charge' : 'Pauli parity'}: ${result.measurement.reported}${result.measurement.error ? ' (error)' : ''}.`
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
        ? `Time step applied clock ${result.phase}; tick is now ${result.after.tick}.`
        : 'Time evolution is off.';
    if (result?.applied && isReversiMode(game.mode)) game.recordPosition('manual-time');
    render();
}

function dropSelectedAnyon() {
    if (!isJumpMode(game.mode) || game.config?.setupMode !== 'excitation') {
        els.statusText.textContent = 'Drop recovery is only available in Jump excitation mode.';
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
    document.body.classList.toggle('modal-open', open);
    if (open) window.requestAnimationFrame(() => els.rulesIntroPanel.focus({ preventScroll: true }));
    else els.rulesIntroButton.focus({ preventScroll: true });
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
    if (isIsingDomainMode(game.mode)) {
        const counts = game.counts();
        const observables = game.computePhysicalObservables();
        els.blackCountLabel.textContent = 'Spin Up / +1';
        els.whiteCountLabel.textContent = 'Spin Down / -1';
        els.blackBraidLabel.textContent = 'Energy / M';
        els.whiteBraidLabel.textContent = 'Wall / Domains';
        els.blackCount.textContent = counts.black;
        els.whiteCount.textContent = counts.white;
        els.blackBraid.textContent = `${formatNumber(observables.energy)} / ${formatNumber(observables.magnetization)}`;
        els.whiteBraid.textContent = `${observables.domainWallLength} / ${observables.numberOfBlackDomains + observables.numberOfWhiteDomains}`;
        return;
    }
    if (isTwoPhaseCompetitionMode(game.mode)) {
        const counts = game.counts();
        const observables = game.computePhysicalObservables();
        els.blackCountLabel.textContent = 'Phase A';
        els.whiteCountLabel.textContent = 'Phase B';
        els.blackBraidLabel.textContent = 'Energy / Interface';
        els.whiteBraidLabel.textContent = 'Domains / Nuclei';
        els.blackCount.textContent = `${counts.black} (${formatNumber(observables.areaFractionA)})`;
        els.whiteCount.textContent = `${counts.white} (${formatNumber(observables.areaFractionB)})`;
        els.blackBraid.textContent = `${formatNumber(observables.energy)} / ${observables.interfaceLength}`;
        els.whiteBraid.textContent = `${observables.numberOfDomains} / ${observables.nucleationCount}`;
        return;
    }
    if (isPhysicalClusterGoMode(game.mode)) {
        const counts = game.counts();
        const observables = game.computePhysicalObservables();
        els.blackCountLabel.textContent = 'Species A';
        els.whiteCountLabel.textContent = 'Species B';
        els.blackBraidLabel.textContent = 'Largest / Wraps';
        els.whiteBraidLabel.textContent = 'Captures / Survival';
        els.blackCount.textContent = `${counts.black} (${formatNumber(observables.areaFractionA)})`;
        els.whiteCount.textContent = `${counts.white} (${formatNumber(observables.areaFractionB)})`;
        els.blackBraid.textContent = `${observables.largestCluster} / ${observables.topologyWrappingClusterCount}`;
        els.whiteBraid.textContent = `${observables.captureEvents} / ${formatNumber(observables.survivalProbability)}`;
        return;
    }
    if (isPhysicalJumpParticlesMode(game.mode)) {
        const counts = game.counts();
        const observables = game.computePhysicalObservables();
        els.blackCountLabel.textContent = 'P+ / Black';
        els.whiteCountLabel.textContent = 'P- / White';
        els.blackBraidLabel.textContent = 'Recombine / Energy';
        els.whiteBraidLabel.textContent = 'Exchange / Parity';
        els.blackCount.textContent = counts.black;
        els.whiteCount.textContent = counts.white;
        els.blackBraid.textContent = `${observables.recombinationCount} / ${formatNumber(observables.energyRecoveredFromRecombination)}`;
        els.whiteBraid.textContent = `${observables.exchangeEvents} / ${observables.braidExchangeParity ?? 0}`;
        return;
    }
    if (isSpinIceVertexMode(game.mode)) {
        const counts = game.counts();
        const observables = game.computePhysicalObservables();
        els.blackCountLabel.textContent = 'Along Orientation';
        els.whiteCountLabel.textContent = 'Opposite Orientation';
        els.blackBraidLabel.textContent = 'Defects / Monopoles';
        els.whiteBraidLabel.textContent = 'Strings / Loops';
        els.blackCount.textContent = counts.black;
        els.whiteCount.textContent = counts.white;
        els.blackBraid.textContent = `${observables.iceRuleViolations} / ${observables.monopoleCount}`;
        els.whiteBraid.textContent = `${observables.stringLength} / ${observables.closedLoopCount}`;
        return;
    }
    if (isZ2GaugeLoopMode(game.mode)) {
        const counts = game.counts();
        const observables = game.computePhysicalObservables();
        els.blackCountLabel.textContent = 'Ue = +1';
        els.whiteCountLabel.textContent = 'Ue = -1';
        els.blackBraidLabel.textContent = 'Star / Flux';
        els.whiteBraidLabel.textContent = 'Syndrome / Sector';
        els.blackCount.textContent = counts.black;
        els.whiteCount.textContent = counts.white;
        els.blackBraid.textContent = `${observables.starViolations} / ${observables.plaquetteFluxViolations}`;
        els.whiteBraid.textContent = `${observables.syndromeWeight} / ${observables.logicalSector}`;
        return;
    }
    if (isReversiMode(game.mode)) {
        const counts = game.counts();
        if (isAnyonReversiMode(game.mode)) {
            els.blackCountLabel.textContent = 'Black Charges';
            els.whiteCountLabel.textContent = 'White Charges';
            els.blackBraidLabel.textContent = 'Charge Types';
            els.whiteBraidLabel.textContent = 'Fusion Moves';
            els.blackCount.textContent = counts.black;
            els.whiteCount.textContent = counts.white;
            els.blackBraid.textContent = Object.entries(counts.labels || {})
                .filter(([, count]) => count)
                .map(([type, count]) => `${jumpTypeDisplay(type)}:${count}`)
                .join(' ') || '0';
            els.whiteBraid.textContent = game.history.filter((event) => event.type === 'place').length;
            return;
        }
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
    const config = game?.time?.config || null;
    const enabled = Boolean(game?.time?.isEnabled?.()) && config?.updateMode !== 'off';
    if (els.timeEvolutionPanel) els.timeEvolutionPanel.hidden = !enabled;
    if (!game?.time || !enabled) {
        els.timeStatus.textContent = 'Time evolution off.';
        els.phaseTimeline.innerHTML = '';
        return;
    }
    const state = game.time.gameTime;
    const attached = [];
    if (config.hamiltonianMode && config.hamiltonianMode !== 'off') {
        attached.push(`H=${config.hamiltonianMode}:${formatNumber(config.hamiltonianStrength)}`);
    }
    if (Math.abs(Number(config.initialMomentum) || 0) > 0) attached.push(`p0=${formatNumber(config.initialMomentum)}`);
    if (Math.abs(Number(config.initialSpinBias) || 0) > 0) attached.push(`spin=${formatNumber(config.initialSpinBias)}`);
    els.timeStatus.textContent = config.updateMode === 'off'
        ? 'Time evolution off.'
        : `tick ${state.tick}, round ${state.round}, clock ${state.phase}/${state.period - 1}, ${config.updateMode}${attached.length ? `, ${attached.join(', ')}` : ''}`;
    els.phaseTimeline.innerHTML = game.time.phaseTimeline()
        .map((item) => `<span class="${item.active ? 'active' : ''}" title="${item.label}"><i>${item.phase}</i></span>`)
        .join('');
}

function updateStatus() {
    if (!game) return;
    if (Date.now() < statusHoldUntil) return;
    if (isIsingDomainMode(game.mode)) {
        const observables = game.computePhysicalObservables();
        const answer = game.computePhysicalAnswer();
        const action = els.isingActionSelect?.value || 'place_or_flip';
        els.statusText.textContent = `${capitalize(game.currentPlayer)} ${action.replaceAll('_', ' ')}. E=${formatNumber(observables.energy)}, M=${formatNumber(observables.magnetization)}, wall=${observables.domainWallLength}, density=${formatNumber(observables.domainWallDensity)}, phase=${answer.finalPhase}.`;
        return;
    }
    if (isTwoPhaseCompetitionMode(game.mode)) {
        const observables = game.computePhysicalObservables();
        const answer = game.computePhysicalAnswer();
        const action = els.twoPhaseActionSelect?.value || 'auto';
        els.statusText.textContent = `${capitalize(game.currentPlayer)} ${action.replaceAll('_', ' ')}. E=${formatNumber(observables.energy)}, A=${formatNumber(observables.areaFractionA)}, B=${formatNumber(observables.areaFractionB)}, interface=${observables.interfaceLength}, winner=${answer.winnerPhase}.`;
        return;
    }
    if (isPhysicalClusterGoMode(game.mode)) {
        const observables = game.computePhysicalObservables();
        const answer = game.computePhysicalAnswer();
        const action = els.clusterActionSelect?.value || 'auto';
        els.statusText.textContent = `${capitalize(game.currentPlayer)} ${action.replaceAll('_', ' ')}. Largest=${observables.largestCluster}, percolation=${formatNumber(observables.percolationProbability)}, interface=${observables.interfaceLength}, answer=${answer.whichSpeciesPercolated}.`;
        return;
    }
    if (isPhysicalJumpParticlesMode(game.mode)) {
        const observables = game.computePhysicalObservables();
        const answer = game.computePhysicalAnswer();
        const action = els.jumpParticleActionSelect?.value || 'auto';
        const selected = selectedJumpParticleCoord
            ? ` Selected ${game.topology.displayCoord?.(selectedJumpParticleCoord) || selectedJumpParticleCoord.join(',')}.`
            : '';
        els.statusText.textContent = `${capitalize(game.currentPlayer)} ${action.replaceAll('_', ' ')}. Particles=${observables.particleCount}, recomb=${observables.recombinationCount}, avg path=${formatNumber(observables.averagePathLength)}, final=${answer.finalState}.${selected}`;
        return;
    }
    if (isSpinIceVertexMode(game.mode)) {
        const observables = game.computePhysicalObservables();
        const answer = game.computePhysicalAnswer();
        const action = els.spinIceActionSelect?.value || 'flip_arrow';
        els.statusText.textContent = `${capitalize(game.currentPlayer)} ${action.replaceAll('_', ' ')}. E=${formatNumber(observables.energy)}, defects=${observables.iceRuleViolations}, monopoles=${observables.monopoleCount}, sector=${answer.topologicalLoopSector}.`;
        return;
    }
    if (isZ2GaugeLoopMode(game.mode)) {
        const observables = game.computePhysicalObservables();
        const action = els.z2GaugeActionSelect?.value || 'flip_edge';
        els.statusText.textContent = `${capitalize(game.currentPlayer)} ${action.replaceAll('_', ' ')}. Syndrome=${observables.syndromeWeight}, star=${observables.starViolations}, flux=${observables.plaquetteFluxViolations}, sector=${observables.logicalSector}.`;
        return;
    }
    if (isPhysicalCliffordMode(game.mode)) {
        const action = els.physicalActionSelect.value;
        const observables = game.computePhysicalObservables();
        if (customStabilizerSetupPending()) {
            els.statusText.textContent = `Custom Pauli correction setup: click a site to choose I/X/Y/Z and sign. Current custom sites ${game.board.size}; press Start when ready.`;
        } else if (action === 'entangle_ancilla' && selectedPhysicalCoord) {
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
        if (isAnyonReversiMode(game.mode)) {
            const selectedType = selectedReversiAlgebraValue();
            if (preview?.legal) {
                els.statusText.textContent = `${capitalize(game.currentPlayer)} can fuse ${preview.flips.length} bracketed charge${preview.flips.length === 1 ? '' : 's'} with ${jumpTypeDisplay(selectedType)}.`;
            } else if (!hoverCoord) {
                const moves = game.legalMoves(game.currentPlayer, selectedType).length;
                els.statusText.textContent = `${capitalize(game.currentPlayer)} has ${moves} legal Anyon Reversi move${moves === 1 ? '' : 's'}.`;
            }
            return;
        }
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
            els.statusText.textContent = `${capitalize(game.currentPlayer)} inserts ${els.cftPrimarySelect.value}. Dominant block ${observables.dominantConformalBlock}; OPE sector ${observables.finalOPESector}; captures black ${game.captures.black}, white ${game.captures.white}.`;
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
        const anyonTurnAction = game.config?.setupMode === 'excitation' ? els.anyonActionSelect.value : 'move';
        if (anyonTurnAction === 'recombine') {
            els.statusText.textContent = `Recombine / Recover: click ${selectedToken} or another owned anyon to recover energy.`;
            return;
        }
        if (anyonTurnAction === 'excite') {
            els.statusText.textContent = `Excite ${jumpTypeDisplay(els.anyonExcitationTypeSelect.value)}: click an empty vertex. Choose Move / Braid to move ${selectedToken}.`;
            return;
        }
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
        const recovery = game.config?.setupMode === 'excitation'
            ? ' Choose Recombine / Recover to reclaim its energy.'
            : '';
        els.statusText.textContent = `Selected ${selectedToken}: ${braidStatusLabel(token)}, parity ${token?.braidParity || 0}, word ${braidWordToText(token?.braidWord || [])}${channelText}, ${actions.length} local move/jump option${actions.length === 1 ? '' : 's'}.${cancel}${inverse}${warning}${recovery}`;
    } else {
        const anyonTurnAction = game.config?.setupMode === 'excitation' ? els.anyonActionSelect.value : 'move';
        els.statusText.textContent = game.config?.setupMode === 'excitation' && anyonTurnAction === 'excite'
            ? `${capitalize(game.currentPlayer)} energy ${formatNumber(game.energy?.[game.currentPlayer] || 0)}. Excite ${jumpTypeDisplay(els.anyonExcitationTypeSelect.value)} on an empty vertex.`
            : game.config?.setupMode === 'excitation' && anyonTurnAction === 'recombine'
            ? `${capitalize(game.currentPlayer)} energy ${formatNumber(game.energy?.[game.currentPlayer] || 0)}. Click an owned anyon to recombine and recover energy.`
            : game.config?.setupMode === 'excitation'
            ? `${capitalize(game.currentPlayer)} energy ${formatNumber(game.energy?.[game.currentPlayer] || 0)}. Select an owned anyon to move/braid, or choose Excite Anyon.`
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
        : isAnyonReversiMode(game.mode)
        ? [
            `${els.anyonModelSelect.value === 'zn_phase' ? 'Z_n charges' : 'Anyon charges'} are placed with the local site palette`,
            'Gold outline previews bracketed fusion flips',
            'Flipped chains fuse with the placed charge',
            'Twisted seams apply the topology charge automorphism',
            'Measurement reports connected-domain total charge'
        ]
        : isTwoPhaseCompetitionMode(game.mode)
        ? [
            'Black = phase A; white = phase B',
            'Empty sites are metastable / unconverted substrate',
            'Growth requires neighboring same-phase material',
            'Interface flips must not increase the energy',
            'Energy balances interface cost, phase bias, and optional curvature',
            'Observables track area fractions, domains, nucleation, coarsening, and winding interfaces'
        ]
        : isPhysicalClusterGoMode(game.mode)
        ? [
            'Black = species A / phase A / spin sector A; white = species B / phase B / spin sector B',
            'Empty sites are local growth, oxygen, or resource vertices',
            'Liberties are available neighboring growth/resource sites',
            'Clusters with zero liberties are captured as local extinction or confinement',
            'Optional diffusion/noise grows random local droplets after updates',
            'Observables track cluster distribution, largest cluster, percolation, survival, and wrapping clusters'
        ]
        : isPhysicalJumpParticlesMode(game.mode)
        ? [
            'Black/white are two particle species or charge signs',
            'Hop moves to an adjacent empty vertex',
            'Jump crosses an occupied barrier particle into an empty landing',
            'Chain jump follows consecutive jump landings',
            'Adjacent opposite charges can recombine and recover energy',
            'Path parity records exchange or braid-like worldline complexity'
        ]
        : isSpinIceVertexMode(game.mode)
        ? [
            'Variables live on graph edges, not vertices',
            'Black arrows follow the chosen edge orientation; white arrows oppose it',
            'Square ice prefers two arrows in and two arrows out at each vertex',
            'Violations are monopoles with signed in/out charge',
            'String and loop flips update connected edge arrows',
            'Observables track monopoles, string length, loop winding, energy, and defect density'
        ]
        : isZ2GaugeLoopMode(game.mode)
        ? [
            'Variables live on graph edges: Ue = +1 or -1',
            'Black edges are Ue=+1; white edges are Ue=-1',
            'Star checks multiply adjacent edge variables at a vertex',
            'Plaquette checks multiply edge variables around local faces/cycles',
            'Open paths create charge endpoints; closed loops preserve local constraints',
            'Noncontractible loops change the Wilson-loop logical sector'
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
            isCliffordJumpMode(game.mode)
                ? 'Clifford Jump labels: X, Z, and Y move by Anyon Jump rules'
                : isVirasoroJumpMode(game.mode)
                ? 'Virasoro Jump labels: sigma and epsilon primary excitations'
                : els.anyonModelSelect.value === 'zn_phase'
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
                ? `Excitation mode: ${excitationCatalog().types.map(jumpTypeDisplay).join(', ')} use energy; drop/fusion recovers energy with loss`
                : 'Standard mode: fixed initial token set',
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
        } else if (isIsingDomainMode(game.mode)) {
            const update = event.physicalUpdate || {};
            const affected = event.affectedVertices?.length || 0;
            item.textContent = `#${event.number} ${event.player} ${event.action || event.type}; affected ${affected}; dE ${formatNumber(update.deltaEnergy)}; ${update.acceptedMove === false ? 'rejected' : 'accepted'}.`;
        } else if (isTwoPhaseCompetitionMode(game.mode)) {
            const update = event.physicalUpdate || {};
            const affected = event.affectedVertices?.length || 0;
            const observables = event.observables || {};
            item.textContent = `#${event.number} ${event.player} ${event.action || event.type}; affected ${affected}; dE ${formatNumber(update.deltaEnergy)}; interface ${observables.interfaceLength ?? 0}; A ${formatNumber(observables.areaFractionA ?? 0)}.`;
        } else if (isPhysicalClusterGoMode(game.mode)) {
            const update = event.physicalUpdate || {};
            const observables = event.observables || {};
            item.textContent = `#${event.number} ${event.player} ${event.action || event.type}; captured ${update.capturedCount || 0}; largest ${observables.largestCluster ?? 0}; wraps ${observables.topologyWrappingClusterCount ?? 0}; survival ${formatNumber(observables.survivalProbability ?? 0)}.`;
        } else if (isPhysicalJumpParticlesMode(game.mode)) {
            const update = event.physicalUpdate || {};
            const observables = event.observables || {};
            const measurement = event.measurement ? `; parity ${event.measurement.reported}` : '';
            item.textContent = `#${event.number} ${event.player} ${event.action || event.type}; particles ${observables.particleCount ?? 0}; recomb ${observables.recombinationCount ?? 0}; path ${formatNumber(update.pathLength || observables.averagePathLength || 0)}${measurement}.`;
        } else if (isSpinIceVertexMode(game.mode)) {
            const update = event.physicalUpdate || {};
            const observables = event.observables || {};
            item.textContent = `#${event.number} ${event.player} ${event.action || event.type}; edges ${event.affectedEdges?.length || 0}; dE ${formatNumber(update.deltaEnergy)}; monopoles ${observables.monopoleCount ?? 0}; defects ${observables.iceRuleViolations ?? 0}.`;
        } else if (isZ2GaugeLoopMode(game.mode)) {
            const update = event.physicalUpdate || {};
            const observables = event.observables || {};
            const measurement = update.measurement ? `; measured ${update.measurement.check} ${update.measurement.value > 0 ? '+1' : '-1'}` : '';
            item.textContent = `#${event.number} ${event.player} ${event.action || event.type}; edges ${event.affectedEdges?.length || 0}; syndrome ${observables.syndromeWeight ?? 0}; sector ${observables.logicalSector || 'trivial'}${measurement}.`;
        } else if (event.type === 'measurement') {
            item.textContent = `measurement ${event.measurement.type}: ${event.measurement.reported}${event.measurement.error ? ' with error' : ''}.`;
        } else if (event.type === 'noise') {
            item.textContent = `${event.player} manual noise tick: ${event.noiseEvents} random event${event.noiseEvents === 1 ? '' : 's'}.`;
        } else if (event.type === 'pass') {
            item.textContent = `#${event.number} ${event.player || event.color} passed.`;
        } else if (isReversiMode(game.mode)) {
            const time = event.time?.applied ? `; t${event.time.after.tick} phase ${event.time.phase}` : '';
            if (isAnyonReversiMode(game.mode)) {
                item.textContent = `#${event.number} ${event.player} ${jumpTypeDisplay(event.anyonType)}@${event.coord.join(',')} fused ${event.flipped.length}; winding (${event.winding.x},${event.winding.y})${time}.`;
            } else {
                item.textContent = `#${event.number} ${event.player} ${event.pauliLabel}@${event.coord.join(',')} flipped ${event.flipped.length}; winding (${event.winding.x},${event.winding.y})${time}.`;
            }
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
                item.textContent = `#${event.number} ${event.player} excited ${jumpTypeDisplay(event.anyonType)} at ${event.coord.join(',')}; cost ${event.cost}.`;
            } else if (event.kind === 'drop') {
                item.textContent = `#${event.number} ${event.player} dropped ${event.tokenId}; recovered ${formatNumber(event.recovered)}.`;
            } else if (event.kind === 'set_algebra') {
                item.textContent = `#${event.number} ${event.player} set ${event.tokenId} ${jumpTypeDisplay(event.before)} -> ${jumpTypeDisplay(event.after)} at ${event.coord.join(',')}.`;
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
    const events = isJumpMode(game.mode) ? [...(game.braidEventLog || [])].slice(-18).reverse() : [];
    if (!events.length) {
        const item = document.createElement('li');
        item.textContent = isJumpMode(game.mode)
            ? 'No braid or unbraid events yet.'
            : 'Braid memory is available in Jump modes.';
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

function exportCsv() {
    const csv = typeof game.exportPhysicalHistoryCSV === 'function'
        ? game.exportPhysicalHistoryCSV()
        : [
            'number,player,type,coord,event',
            ...(Array.isArray(game.history) ? game.history : []).map((event) => [
                event.number ?? event.tick ?? '',
                event.player ?? '',
                event.type ?? event.kind ?? event.action ?? '',
                event.coord ? event.coord.join('|') : event.to ? event.to.join('|') : '',
                JSON.stringify(event ?? {}).replaceAll('"', '""')
            ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
        ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${game.mode}-${game.topology.name}-physics-history.csv`;
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

function jumpTypeDisplay(type) {
    if (game?.displayType) return game.displayType(type);
    if (isCliffordJumpMode()) {
        return ({ e: 'X', m: 'Z', psi: 'Y', 1: 'I' })[type] || type;
    }
    if (isVirasoroJumpMode()) {
        return ({ sigma: '\u03c3', epsilon: '\u03b5', psi: '\u03b5', 1: '1', identity: '1' })[type] || anyonDisplay(type);
    }
    return anyonDisplay(type);
}

function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0';
    return Number(number.toFixed(2)).toString();
}

function temporalAgeProgress(entity = null) {
    if (!game?.time?.isEnabled?.() || !entity || typeof entity !== 'object') return null;
    const age = Number(entity.age ?? 0);
    if (!Number.isFinite(age) || age <= 0) return null;
    const period = Math.max(1, Number(els.timePeriodInput?.value || game.time?.config?.period || 4));
    const cycleAge = ((age % period) + period) % period;
    if (cycleAge <= 0) return null;
    const progress = Math.max(0.04, Math.min(1, cycleAge / period));
    return { age: cycleAge, totalAge: age, progress, period };
}

function appendAgeRing(cell, entity = null) {
    const temporal = temporalAgeProgress(entity);
    if (!temporal) return;
    const ring = document.createElement('span');
    ring.className = 'age-ring';
    ring.style.setProperty('--age-angle', `${Math.round(temporal.progress * 360)}deg`);
    ring.title = `age ${temporal.age}/${temporal.period}`;
    if (temporal.progress >= 0.95) ring.classList.add('age-ring-due');
    cell.append(ring);
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
    if (!isJumpMode(game?.mode)) return;
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

function handleConfigControlChange(event) {
    if (event?.currentTarget === els.cliffordAlgebraSetSelect
        && els.cliffordAlgebraSetSelect.value === 'standard'
        && selectedMode() === 'physical_clifford_reversi') {
        if (els.gameLayerSelect) els.gameLayerSelect.value = 'algebraic';
        syncModeCatalogForLayer();
        els.modeSelect.value = 'clifford_reversi';
    }
    createGame();
}

for (const control of [
    els.gameLayerSelect,
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
    els.timeUpdateSelect,
    els.timeHamiltonianSelect,
    els.anyonFlipSelect,
    els.braidMemoryModeSelect,
    els.anyonModelSelect,
    els.anyonSetupSelect,
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
    els.isingInitialStateSelect,
    els.isingJInput,
    els.isingHInput,
    els.isingTemperatureInput,
    els.isingWallThicknessInput,
    els.isingMetropolisSelect,
    els.isingDomainFlipSelect,
    els.isingBracketFlipSelect,
    els.twoPhaseInitialStateSelect,
    els.twoPhaseInterfaceCostInput,
    els.twoPhaseBiasAInput,
    els.twoPhaseBiasBInput,
    els.twoPhaseCurvatureSelect,
    els.twoPhaseCurvaturePenaltyInput,
    els.twoPhaseNoiseSelect,
    els.twoPhaseNoiseRateInput,
    els.clusterInitialStateSelect,
    els.clusterModelSelect,
    els.clusterNoiseSelect,
    els.clusterNoiseRateInput,
    els.spinIceInitialStateSelect,
    els.spinIceViolationEnergyInput,
    els.spinIceStringLengthInput,
    els.z2GaugeInitialStateSelect,
    els.z2GaugePathLengthInput,
    els.z2GaugeNoiseSelect,
    els.z2GaugeNoiseRateInput,
    els.z2GaugeDecoderSelect,
    els.jumpParticleModelSelect,
    els.virasoroMaxModeSelect,
    els.unstableRuleSelect
]) {
    control.addEventListener('change', handleConfigControlChange);
}
els.isingActionSelect?.addEventListener('change', render);
els.twoPhaseActionSelect?.addEventListener('change', render);
els.clusterActionSelect?.addEventListener('change', render);
els.jumpParticleActionSelect?.addEventListener('change', () => {
    selectedJumpParticleCoord = null;
    render();
});
els.spinIceActionSelect?.addEventListener('change', render);
els.z2GaugeActionSelect?.addEventListener('change', render);
els.noiseRateInput.addEventListener('change', createGame);
els.measurementErrorInput.addEventListener('change', createGame);
els.noiseSeedInput.addEventListener('change', createGame);
els.timePeriodInput.addEventListener('change', createGame);
els.timeHamiltonianStrengthInput.addEventListener('change', createGame);
els.timeMomentumInput.addEventListener('change', createGame);
els.timeSpinBiasInput.addEventListener('change', createGame);
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
    els.customInitialSignSelect,
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
els.anyonActionSelect.addEventListener('change', () => {
    syncModeControls();
    render();
});
els.anyonExcitationTypeSelect.addEventListener('change', render);
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
els.startCustomRecoveryButton?.addEventListener('click', startCustomStabilizerRecovery);
els.measureButton.addEventListener('click', measureTarget);
els.countButton.addEventListener('click', handleCount);
els.unbraidHintButton.addEventListener('click', showUnbraidHint);
els.manualNoiseButton.addEventListener('click', applyNoiseNow);
els.manualTimeButton.addEventListener('click', applyTimeNow);
els.dropAnyonButton.addEventListener('click', dropSelectedAnyon);
els.rulesIntroButton.addEventListener('click', toggleRulesIntro);
els.rulesIntroCloseButton.addEventListener('click', () => setRulesIntroOpen(false));
els.rulesIntroPanel.addEventListener('pointerdown', (event) => {
    if (event.target === els.rulesIntroPanel) setRulesIntroOpen(false);
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && rulesIntroIsOpen()) setRulesIntroOpen(false);
});
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
    if (isIsingDomainMode(game?.mode) || isTwoPhaseCompetitionMode(game?.mode) || isPhysicalClusterGoMode(game?.mode) || isSpinIceVertexMode(game?.mode) || isZ2GaugeLoopMode(game?.mode)) {
        game.pass();
        render();
    } else if (isReversiMode(game?.mode)) {
        game.pass();
        render();
    } else if (isGoMode(game?.mode)) {
        const result = game.pass(game.currentPlayer);
        els.statusText.textContent = result.ok ? `${capitalize(result.event.color)} passed.` : result.error;
        render();
    }
});
els.exportButton.addEventListener('click', exportJson);
els.exportCsvButton?.addEventListener('click', exportCsv);
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
