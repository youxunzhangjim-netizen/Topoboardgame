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
import { buildOnlineMatchKey } from '../../js/shared/OnlineMatchKey.js';

const els = {
    labsModelCatalog: document.querySelector('#labsModelCatalog'),
    labSimpleModeButton: document.querySelector('#labSimpleModeButton'),
    labResearchModeButton: document.querySelector('#labResearchModeButton'),
    labResearchBuilderLink: document.querySelector('#labResearchBuilderLink'),
    labHeaderModelName: document.querySelector('#labHeaderModelName'),
    labHeaderDescription: document.querySelector('#labHeaderDescription'),
    labValidationBadge: document.querySelector('#labValidationBadge'),
    labModelFamilyBadge: document.querySelector('#labModelFamilyBadge'),
    labExperimentHashBadge: document.querySelector('#labExperimentHashBadge'),
    labAppVersionBadge: document.querySelector('#labAppVersionBadge'),
    labSystemIntroductionButton: document.querySelector('#labSystemIntroductionButton'),
    labSystemIntroductionPanel: document.querySelector('#labSystemIntroductionPanel'),
    labScienceScopeBadge: document.querySelector('#labScienceScopeBadge'),
    labScienceSystem: document.querySelector('#labScienceSystem'),
    labScienceObjective: document.querySelector('#labScienceObjective'),
    labScienceModel: document.querySelector('#labScienceModel'),
    labScienceHamiltonian: document.querySelector('#labScienceHamiltonian'),
    labScienceEvolution: document.querySelector('#labScienceEvolution'),
    labSciencePartition: document.querySelector('#labSciencePartition'),
    labScienceMeasurements: document.querySelector('#labScienceMeasurements'),
    labScienceImplementation: document.querySelector('#labScienceImplementation'),
    labScienceBoundary: document.querySelector('#labScienceBoundary'),
    labScienceReferences: document.querySelector('#labScienceReferences'),
    labObservableFigureSelect: document.querySelector('#labObservableFigureSelect'),
    labObservableSpecGrid: document.querySelector('#labObservableSpecGrid'),
    labObservableCanvas: document.querySelector('#labObservableCanvas'),
    labObservableFigureCaption: document.querySelector('#labObservableFigureCaption'),
    labStateLocalStates: document.querySelector('#labStateLocalStates'),
    labStateEncoding: document.querySelector('#labStateEncoding'),
    labStateConstraints: document.querySelector('#labStateConstraints'),
    labStateInterpretation: document.querySelector('#labStateInterpretation'),
    labRuleName: document.querySelector('#labRuleName'),
    labRuleNeighborhood: document.querySelector('#labRuleNeighborhood'),
    labRuleSchedule: document.querySelector('#labRuleSchedule'),
    labRuleDeterminism: document.querySelector('#labRuleDeterminism'),
    labRuleHash: document.querySelector('#labRuleHash'),
    labInitialPreset: document.querySelector('#labInitialPreset'),
    labInitialSeed: document.querySelector('#labInitialSeed'),
    labManualEditState: document.querySelector('#labManualEditState'),
    labTopologyDimension: document.querySelector('#labTopologyDimension'),
    labBoundaryCondition: document.querySelector('#labBoundaryCondition'),
    labTopologyInvariants: document.querySelector('#labTopologyInvariants'),
    labTopologyHash: document.querySelector('#labTopologyHash'),
    labResearchAssumptions: document.querySelector('#labResearchAssumptions'),
    labResearchApproximation: document.querySelector('#labResearchApproximation'),
    labResearchValidation: document.querySelector('#labResearchValidation'),
    labResearchReferences: document.querySelector('#labResearchReferences'),
    snapshotButton: document.querySelector('#snapshotButton'),
    exportConfigButton: document.querySelector('#exportConfigButton'),
    exportSnapshotButton: document.querySelector('#exportSnapshotButton'),
    copyCitationButton: document.querySelector('#copyCitationButton'),
    copyExperimentLinkButton: document.querySelector('#copyExperimentLinkButton'),
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
    showEdgesToggle: document.querySelector('#showEdgesToggle'),
    showLabelsToggle: document.querySelector('#showLabelsToggle'),
    lowerDetailButton: document.querySelector('#lowerDetailButton'),
    pauseUpdatesButton: document.querySelector('#pauseUpdatesButton'),
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
    isingRules: document.querySelector('[data-rules-mode="ising-domain"]'),
    twoPhaseRules: document.querySelector('[data-rules-mode="two-phase"]'),
    jumpParticleRules: document.querySelector('[data-rules-mode="physical-jump-particles"]'),
    spinIceRules: document.querySelector('[data-rules-mode="spin-ice"]'),
    z2GaugeRules: document.querySelector('[data-rules-mode="z2-gauge"]'),
    rulesSections: [...document.querySelectorAll('[data-rules-mode]')],
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
    clifford_reversi: 'Stabilizer Operator Grid',
    physical_clifford_reversi: 'Pauli-Frame Recovery Operators',
    clifford_go: 'Clifford Insertion Field',
    physical_clifford_go: 'Physical Clifford Field Operators',
    clifford_jump: 'Clifford Worldline Operators',
    physical_clifford_jump: 'Physical Clifford Worldlines',
    anyon_reversi: 'Anyon Charge Fusion Grid',
    physical_anyon_reversi: 'Physical Anyon Charge Grid',
    physical_virasoro_go: 'CFT Field Insertion Graph',
    physical_virasoro_reversi: 'CFT Local OPE Operators',
    virasoro_jump: 'Virasoro Worldline Operators',
    physical_virasoro_jump: 'Physical Virasoro Worldlines',
    anyon_jump: 'Anyon Fusion & Braiding Worldlines',
    physical_anyon_jump: 'Topological Memory Worldlines',
    ising_domain_game: 'Spin & Phase Domain Experiment',
    two_phase_competition_game: 'Two-Phase Competition Experiment',
    physical_cluster_go: 'Physical Cluster Field',
    physical_jump_particles: 'Particle Hopping / Reaction System',
    spin_ice_vertex_game: 'Spin Ice Vertex Experiment',
    z2_gauge_loop_game: 'Z2 Gauge Loop Experiment'
};
const LAB_APP_VERSION = '0.1.0';
const LAB_SECTION_ORDER = [
    'Spin Systems',
    'Statistical Dynamics',
    'Quantum Information',
    'Topological Matter',
    'Field Theory',
    'Mathematical Structures'
];
const LAB_MODEL_METADATA = Object.freeze({
    clifford_reversi: {
        section: 'Quantum Information',
        family: 'Pauli Algebra',
        validationLevel: 'toy',
        description: 'Pauli-labeled local operators on topology-aware graph rays with Clifford frame transforms.',
        stateSpace: {
            localStates: 'Empty, Black/White controlled Pauli operators I/X/Y/Z with optional sign and phase.',
            encoding: 'symbolic Pauli label plus owner sector',
            constraints: 'Legal updates use graph rays, seam transport, and local Pauli-frame compatibility.',
            interpretation: 'A discrete operator sandbox for topology-dependent Pauli transport.'
        },
        rule: {
            name: 'Topology-aware Clifford local update',
            neighborhood: 'Graph rays and adjacent vertices from the selected topology.',
            schedule: 'Manual event-driven update',
            deterministic: 'Deterministic unless noise controls are enabled.'
        },
        observables: ['Pauli distribution', 'Owner counts', 'Phase/sign distribution', 'Commutation conflicts'],
        assumptions: 'Educational Pauli/Clifford operator transport on finite graphs.',
        approximation: 'Toy symbolic algebra; not a calibrated quantum device simulation.',
        validation: 'Internal consistency and seeded replay checks are the intended baseline.'
    },
    clifford_go: {
        section: 'Quantum Information',
        family: 'Pauli Algebra',
        validationLevel: 'toy',
        description: 'Local Pauli insertions on graph sites for comparing operator labels across topologies.',
        stateSpace: {
            localStates: 'Empty graph vertices and inserted X/Y/Z Pauli operators.',
            encoding: 'symbolic site state',
            constraints: 'Insertion and local interactions follow graph adjacency.',
            interpretation: 'Operator insertion field for discrete Pauli labels.'
        },
        rule: {
            name: 'Pauli insertion field update',
            neighborhood: 'Local graph adjacency and topology seams.',
            schedule: 'Manual event-driven update',
            deterministic: 'Deterministic unless noise controls are enabled.'
        },
        observables: ['Inserted operators', 'Label distribution', 'Topology contacts'],
        assumptions: 'Graph insertion model for operator-label exploration.',
        approximation: 'Toy symbolic estimator.',
        validation: 'Requires benchmark adapters before research-grade claims.'
    },
    clifford_jump: {
        section: 'Quantum Information',
        family: 'Pauli Algebra',
        validationLevel: 'toy',
        description: 'Worldline-style Pauli operator transport through hops and exchanges on graph topology.',
        stateSpace: {
            localStates: 'Mobile X/Y/Z operator tokens and empty graph vertices.',
            encoding: 'token state plus symbolic Pauli label',
            constraints: 'Movement follows graph adjacency and selected exchange paths.',
            interpretation: 'Worldline transport sandbox for local operator labels.'
        },
        rule: {
            name: 'Pauli worldline hop/exchange',
            neighborhood: 'Adjacent vertices and jump paths in the topology graph.',
            schedule: 'Manual event-driven update',
            deterministic: 'Deterministic unless noise controls are enabled.'
        },
        observables: ['Token counts', 'Path history', 'Pauli labels', 'Exchange events'],
        assumptions: 'Worldline visualization for topology-dependent label transport.',
        approximation: 'Toy transport model.',
        validation: 'Replay and event-log consistency only.'
    },
    physical_clifford_reversi: {
        section: 'Quantum Information',
        family: 'Stabilizer Codes',
        validationLevel: 'estimator',
        description: 'Pauli-frame recovery workspace for syndrome defects, ancillas, and logical-sector checks.',
        stateSpace: {
            localStates: 'I/X/Y/Z qubit-site operators with sign, phase, owner sector, and optional ancilla state.',
            encoding: 'symbolic Pauli frame with integer phase',
            constraints: 'Syndrome checks, logical cycle checks, and allowed ancilla actions.',
            interpretation: 'Discrete stabilizer recovery estimator on a reusable topology graph.'
        },
        rule: {
            name: 'Pauli-frame recovery update',
            neighborhood: 'Local graph neighborhoods and topology cycles.',
            schedule: 'Manual recovery actions with optional measurement/noise events',
            deterministic: 'Seeded stochastic when measurement error or noise is enabled.'
        },
        observables: ['Syndrome weight', 'Logical sector', 'Global parity', 'Commutation conflicts', 'Vacuum recovery'],
        assumptions: 'Stabilizer bookkeeping is discrete and graph-local.',
        approximation: 'Estimator for recovery behavior, not hardware-calibrated QEC.',
        validation: 'Benchmarks should compare against known stabilizer examples before upgrade.'
    },
    physical_clifford_go: {
        extends: 'physical_clifford_reversi',
        description: 'Physical Clifford insertion workspace for graph-local Pauli-frame experiments.'
    },
    physical_clifford_jump: {
        extends: 'physical_clifford_reversi',
        description: 'Physical Clifford worldline workspace for Pauli-frame transport and recovery events.'
    },
    anyon_reversi: {
        section: 'Topological Matter',
        family: 'Fusion',
        validationLevel: 'toy',
        description: 'Anyon charge placement and fusion on topology-aware graph intervals.',
        stateSpace: {
            localStates: 'Vacuum and anyon charge labels from the selected anyon model.',
            encoding: 'symbolic charge labels',
            constraints: 'Fusion rules and topology-aware local contacts.',
            interpretation: 'Discrete topological charge fusion sandbox.'
        },
        rule: {
            name: 'Local charge fusion update',
            neighborhood: 'Adjacent graph sites and local interval contacts.',
            schedule: 'Manual event-driven update',
            deterministic: 'Deterministic unless noise controls are enabled.'
        },
        observables: ['Charge counts', 'Fusion outcomes', 'Vacuum recovery'],
        assumptions: 'Symbolic anyon fusion rules on finite graphs.',
        approximation: 'Toy topological matter visualization.',
        validation: 'Requires external benchmark examples for stronger claims.'
    },
    anyon_jump: {
        section: 'Topological Matter',
        family: 'Braiding',
        validationLevel: 'toy',
        description: 'Mobile anyon worldlines for braiding, unbraiding, and fusion-memory experiments.',
        stateSpace: {
            localStates: 'Mobile anyon tokens, vacuum vertices, braid words, fusion channels, and energy metadata.',
            encoding: 'token state plus symbolic charge and braid memory',
            constraints: 'Graph-local hops, exchanges, inverse unbraiding, and model-specific fusion rules.',
            interpretation: 'Worldline workspace for topological charge transport.'
        },
        rule: {
            name: 'Anyon hop, braid, unbraid, and fusion update',
            neighborhood: 'Adjacent vertices, jump paths, and topology cycles.',
            schedule: 'Manual event-driven update',
            deterministic: 'Seeded stochastic when anyon noise is enabled.'
        },
        observables: ['Total fusion charge', 'Braid word length', 'Logical sector', 'Energy history', 'Unbraid success'],
        assumptions: 'Symbolic braid/fusion memory with graph-local moves.',
        approximation: 'Toy or estimator depending on model and settings.',
        validation: 'Replay and known fusion-rule checks are the baseline.'
    },
    physical_anyon_jump: {
        extends: 'anyon_jump',
        family: 'Topological Memory',
        validationLevel: 'estimator',
        description: 'Topological memory experiment for toric-code anyon pairs, logical sectors, braiding, and recovery.'
    },
    physical_anyon_reversi: {
        extends: 'anyon_reversi',
        description: 'Physical anyon charge grid for local fusion and charge-sector observables.'
    },
    physical_virasoro_go: {
        section: 'Field Theory',
        family: 'Toy CFT',
        validationLevel: 'estimator',
        description: 'Discrete CFT field insertion graph for primary fields, correlations, entropy, and stress proxies.',
        stateSpace: {
            localStates: 'Identity background and primary-field insertions such as sigma and epsilon.',
            encoding: 'symbolic primary field with channel metadata',
            constraints: 'Graph contact, OPE channel rules, and optional Virasoro truncation.',
            interpretation: 'Graph estimator for field insertions and CFT-like observables.'
        },
        rule: {
            name: 'Primary insertion and Virasoro graph update',
            neighborhood: 'Local graph contacts, intervals, and selected generator direction.',
            schedule: 'Manual insertion, generator, and measurement events',
            deterministic: 'Seeded stochastic only when measurement/noise options are enabled.'
        },
        observables: ['Dominant conformal block', 'OPE channels', 'Entropy estimate', 'Correlation estimate', 'Stress proxy'],
        assumptions: 'Discrete graph estimators approximate selected CFT concepts.',
        approximation: 'Estimator, not an exact continuum CFT calculation.',
        validation: 'Known limitations should remain visible with every export.'
    },
    physical_virasoro_reversi: {
        extends: 'physical_virasoro_go',
        description: 'Local OPE operator workspace for primary insertions, domain signs, and channel updates.'
    },
    virasoro_jump: {
        extends: 'physical_virasoro_go',
        description: 'Virasoro worldline operator sandbox for graph-local field transport.'
    },
    physical_virasoro_jump: {
        extends: 'physical_virasoro_go',
        description: 'Physical Virasoro worldline workspace for graph-local CFT-inspired dynamics.'
    },
    ising_domain_game: {
        section: 'Spin Systems',
        family: 'Ising / Domain Wall',
        validationLevel: 'estimator',
        description: 'Spin-domain experiment for local flips, domain-wall stability, energy, and topology winding.',
        stateSpace: {
            localStates: 'Spin up s=+1, spin down s=-1, and optional empty/undecided graph sites.',
            encoding: 'integer spin sector per site',
            constraints: 'Graph-neighbor interactions and optional Metropolis acceptance.',
            interpretation: 'Discrete spin field on a topology-aware lattice graph.'
        },
        rule: {
            name: 'Ising graph energy and domain-wall update',
            neighborhood: 'Nearest graph neighbors from the selected topology.',
            schedule: 'Manual local update with optional Metropolis stochastic acceptance',
            deterministic: 'Seeded stochastic when temperature/Metropolis or noise is enabled.'
        },
        observables: ['Energy', 'Magnetization', 'Domain wall length', 'Domain count', 'Topology winding'],
        assumptions: 'Finite graph Ising-like estimator with selected boundary conditions.',
        approximation: 'Discrete estimator; not a continuum thermodynamic solver.',
        validation: 'Benchmarking should compare energy and magnetization against known Ising cases.'
    },
    two_phase_competition_game: {
        section: 'Spin Systems',
        family: 'Phase Competition',
        validationLevel: 'estimator',
        description: 'Two-phase substrate experiment for nucleation, growth, interface cost, and wrapped domains.',
        stateSpace: {
            localStates: 'Phase A, phase B, and metastable empty substrate.',
            encoding: 'enum site state',
            constraints: 'Growth and interface updates follow graph contacts and energy settings.',
            interpretation: 'Discrete phase-field competition on a topology graph.'
        },
        rule: {
            name: 'Nucleation, growth, and interface update',
            neighborhood: 'Adjacent graph sites and interface contacts.',
            schedule: 'Manual or auto-selected local update',
            deterministic: 'Seeded stochastic when droplet noise is enabled.'
        },
        observables: ['Interface length', 'Area fractions', 'Domain count', 'Energy', 'Wrapped interfaces'],
        assumptions: 'Toy phase-field energy on a finite graph substrate.',
        approximation: 'Estimator for qualitative interface behavior.',
        validation: 'Needs benchmark cases before quantitative use.'
    },
    physical_cluster_go: {
        section: 'Statistical Dynamics',
        family: 'Cluster Growth',
        validationLevel: 'estimator',
        description: 'Cluster growth and percolation workspace for resources, open contacts, and topology wrapping.',
        stateSpace: {
            localStates: 'Empty resource sites and occupied cluster sectors A/B.',
            encoding: 'enum site state with connected-component metadata',
            constraints: 'Connected clusters require graph-neighbor contacts; zero-contact clusters can be removed.',
            interpretation: 'Statistical cluster dynamics on finite topology graphs.'
        },
        rule: {
            name: 'Cluster placement, growth, and zero-contact removal',
            neighborhood: 'Connected graph clusters and nearest-neighbor resource contacts.',
            schedule: 'Manual or auto local update with optional diffusion/noise',
            deterministic: 'Seeded stochastic when cluster noise is enabled.'
        },
        observables: ['Largest cluster', 'Cluster-size distribution', 'Interface length', 'Percolation probability', 'Wrapping clusters'],
        assumptions: 'Finite statistical cluster dynamics on a reusable topology graph.',
        approximation: 'Estimator for graph percolation and cluster growth.',
        validation: 'Percolation benchmarks should be added for known lattices.'
    },
    physical_jump_particles: {
        section: 'Statistical Dynamics',
        family: 'Reaction-Diffusion',
        validationLevel: 'toy',
        description: 'Particle hopping, exchange scattering, recombination, and path parity on topology graphs.',
        stateSpace: {
            localStates: 'Empty vertices and mobile particle species/charge signs.',
            encoding: 'token or site occupancy state',
            constraints: 'Hops, exchanges, scattering paths, and recombination follow graph reachability.',
            interpretation: 'Discrete particle transport and reaction sandbox.'
        },
        rule: {
            name: 'Particle hop, exchange, scatter, and recombine update',
            neighborhood: 'Adjacent vertices and allowed multi-step scattering paths.',
            schedule: 'Manual event-driven update',
            deterministic: 'Deterministic unless noise controls are enabled.'
        },
        observables: ['Particle count', 'Exchange events', 'Recombination count', 'Path parity', 'Average path length'],
        assumptions: 'Qualitative graph reaction-diffusion system.',
        approximation: 'Toy dynamics, not calibrated chemistry.',
        validation: 'Replay and graph-reachability checks only.'
    },
    spin_ice_vertex_game: {
        section: 'Spin Systems',
        family: 'Spin Ice',
        validationLevel: 'estimator',
        description: 'Edge-arrow spin ice workspace for vertex constraints, monopoles, strings, loops, and winding.',
        stateSpace: {
            localStates: 'Edge arrows aligned or anti-aligned with graph orientation.',
            encoding: 'signed edge state',
            constraints: 'Vertex ice-rule checks and allowed string/loop flips.',
            interpretation: 'Discrete constrained edge system with monopole-like defects.'
        },
        rule: {
            name: 'Edge-arrow flip, string, loop, and monopole update',
            neighborhood: 'Incident edges, vertex checks, paths, and cycles.',
            schedule: 'Manual event-driven update',
            deterministic: 'Deterministic unless noise controls are enabled.'
        },
        observables: ['Ice-rule violations', 'Monopole count', 'String length', 'Loop winding', 'Energy'],
        assumptions: 'Finite graph vertex-model estimator.',
        approximation: 'Estimator for constrained edge dynamics.',
        validation: 'Compare small graph sectors before stronger claims.'
    },
    z2_gauge_loop_game: {
        section: 'Topological Matter',
        family: 'Wilson Loops',
        validationLevel: 'estimator',
        description: 'Z2 gauge edge-field workspace for star checks, plaquette flux, Wilson loops, and logical sectors.',
        stateSpace: {
            localStates: 'Edge field Ue=+1 or Ue=-1 with optional charge/flux syndrome metadata.',
            encoding: 'signed edge state',
            constraints: 'Star checks, plaquette/cycle checks, and topology-cycle logical sectors.',
            interpretation: 'Discrete Z2 lattice gauge and memory estimator.'
        },
        rule: {
            name: 'Edge, path, loop, check, and decoder update',
            neighborhood: 'Incident edges, open paths, closed loops, local faces, and cycles.',
            schedule: 'Manual event-driven update with optional decoder/noise',
            deterministic: 'Seeded stochastic when noisy edge flips are enabled.'
        },
        observables: ['Syndrome weight', 'Star violations', 'Plaquette flux', 'Wilson loops', 'Logical sector'],
        assumptions: 'Discrete Z2 gauge toy/estimator on graph topology.',
        approximation: 'Estimator; face definitions depend on available graph cell structure.',
        validation: 'Small-code and known-loop tests should be benchmarked.'
    }
});
const LAB_SCIENCE_PROFILES = Object.freeze({
    pauli_transport: {
        scope: { en: 'Symbolic discrete model', zh: '符號式離散模型' },
        system: {
            en: 'A finite topology graph whose occupied sites carry Pauli labels I, X, Y, or Z, an owner sector, and optional sign or phase metadata. The graph supplies adjacency, rays, seams, and boundary identifications.',
            zh: '有限拓撲圖上的已佔據格點帶有 Pauli 標記 I、X、Y 或 Z、控制扇區，以及可選的正負號或相位資料。圖結構提供鄰接、射線、接縫與邊界識別。'
        },
        model: {
            en: 'The implementation composes symbolic Pauli labels and Clifford-frame updates along legal graph paths. It tracks operator labels and commutation bookkeeping; it does not store a complex state vector or density matrix.',
            zh: '實作會沿合法圖路徑組合符號式 Pauli 標記與 Clifford frame 更新，並追蹤算符標記及對易關係；不儲存複數態向量或密度矩陣。'
        },
        hamiltonian: {
            en: 'No Hamiltonian is evaluated. The displayed changes are rule-based operator transformations, not time evolution generated by exp(-iHt).',
            zh: '目前不計算 Hamiltonian。畫面中的變化是規則驅動的算符轉換，不是由 exp(-iHt) 產生的時間演化。'
        },
        evolution: {
            en: 'Manual, event-driven placement, transport, exchange, and Clifford transformation. Optional seeded noise changes the event sequence but remains reproducible for the same configuration and app version.',
            zh: '採手動、事件驅動的放置、傳輸、交換與 Clifford 轉換。可選的定種子噪聲會改變事件序列，但在相同設定與應用程式版本下可重現。'
        },
        partition: {
            en: 'Not applicable to the implemented symbolic update system. No thermal ensemble, Boltzmann weights, or partition function Z is sampled.',
            zh: '不適用於目前的符號式更新系統；不取樣熱系綜、Boltzmann 權重或配分函數 Z。'
        },
        measurements: {
            en: 'Pauli-label distribution, owner-sector counts, sign and phase distribution, path history, exchange events, and commutation conflicts where available.',
            zh: '可計算 Pauli 標記分布、控制扇區數量、正負號與相位分布、路徑歷史、交換事件，以及可用時的對易衝突。'
        },
        implementation: {
            en: 'A deterministic graph-state update engine applies local algebra tables to selected sites and topology-aware paths. Export records the seed, topology hash, rule hash, event log, and final symbolic configuration.',
            zh: '確定性的圖狀態更新引擎會把局部代數表套用至所選格點與拓撲感知路徑。匯出內容記錄種子、拓撲 hash、規則 hash、事件紀錄與最終符號組態。'
        },
        boundary: {
            en: 'Use this as an operator-algebra teaching and topology comparison sandbox. It is not a quantum-circuit simulator, a many-body solver, or a hardware-calibrated error model.',
            zh: '適合用作算符代數教學與拓撲比較沙盒；不是量子電路模擬器、多體求解器或硬體校準誤差模型。'
        },
        references: [
            { label: 'Gottesman, Stabilizer Codes and Quantum Error Correction', url: 'https://arxiv.org/abs/quant-ph/9705052' }
        ]
    },
    stabilizer_recovery: {
        scope: { en: 'Discrete stabilizer estimator', zh: '離散穩定子估計器' },
        system: {
            en: 'A finite graph of qubit sites carrying a symbolic Pauli frame. Local checks, ancilla actions, graph cycles, and selected boundary identifications define the recovery workspace.',
            zh: '有限圖上的量子位格點帶有符號式 Pauli frame。局部檢查、ancilla 動作、圖循環與所選邊界識別共同定義復原工作區。'
        },
        model: {
            en: 'The code tracks Pauli-frame labels, syndrome/check violations, commutation conflicts, global parity, and logical-cycle sectors. It uses stabilizer-style bookkeeping without evolving quantum amplitudes.',
            zh: '程式追蹤 Pauli frame 標記、syndrome／檢查違反、對易衝突、全域 parity 與邏輯循環扇區；採用 stabilizer 式記帳，但不演化量子振幅。'
        },
        hamiltonian: {
            en: 'No many-body Hamiltonian expectation value is computed. The violation count is a discrete penalty/diagnostic and must not be interpreted as a calibrated physical energy spectrum.',
            zh: '目前不計算多體 Hamiltonian 期望值。違反數量只是離散懲罰與診斷，不可解讀為已校準的物理能譜。'
        },
        evolution: {
            en: 'Manual recovery operations and optional ancilla measurements update the Pauli frame. Seeded measurement error and noise events are appended to the replay log.',
            zh: '手動復原操作與可選 ancilla 測量會更新 Pauli frame；定種子的測量誤差與噪聲事件會加入可重播紀錄。'
        },
        partition: {
            en: 'No equilibrium ensemble or partition function is implemented. Error-density controls generate finite seeded configurations rather than Gibbs samples.',
            zh: '未實作平衡系綜或配分函數。誤差密度控制會產生有限的定種子組態，而不是 Gibbs 取樣。'
        },
        measurements: {
            en: 'Syndrome weight, check violations, logical sector, global parity, commutation conflicts, ancilla count, measurement errors, and vacuum/recovery status.',
            zh: '可計算 syndrome 權重、檢查違反、邏輯扇區、全域 parity、對易衝突、ancilla 數量、測量誤差與真空／復原狀態。'
        },
        implementation: {
            en: 'Graph-local checks and cycle tests run after each accepted action. The result is a classical symbolic trace suitable for deterministic replay and small known-case validation.',
            zh: '每個已接受動作後都會執行圖局部檢查與循環測試。結果是可確定重播、適合小型已知案例驗證的古典符號軌跡。'
        },
        boundary: {
            en: 'This estimates recovery logic only. It does not model quantum amplitudes, decoherence channels, fault-tolerant circuits, threshold scaling, or device-specific noise.',
            zh: '本工具只估計復原邏輯；不模擬量子振幅、退相干通道、容錯電路、閾值尺度或裝置特定噪聲。'
        },
        references: [
            { label: 'Gottesman, Stabilizer Codes and Quantum Error Correction', url: 'https://arxiv.org/abs/quant-ph/9705052' },
            { label: 'Dennis et al., Topological Quantum Memory', url: 'https://arxiv.org/abs/quant-ph/0110143' }
        ]
    },
    anyon_dynamics: {
        scope: { en: 'Symbolic topological estimator', zh: '符號式拓撲估計器' },
        system: {
            en: 'Mobile topological-charge labels occupy vertices of a finite graph. State also includes worldline segments, braid words or parity, fusion channels, energy metadata, and logical winding sectors when supported.',
            zh: '可移動的拓撲電荷標記佔據有限圖的頂點。狀態也包含 worldline 線段、braid word 或 parity、融合通道、能量資料，以及支援時的邏輯繞行扇區。'
        },
        model: {
            en: 'Model-specific fusion tables update symbolic charges. Hops and exchanges append worldline and braid data; inverse generators can unbraid stored words. Toric-code, Ising, Fibonacci, and Z_n labels use different algebra tables.',
            zh: '模型專屬融合表會更新符號式電荷。躍遷與交換會加入 worldline 與編織資料；反生成元可解開已儲存的 braid word。Toric code、Ising、Fibonacci 與 Z_n 標記使用不同代數表。'
        },
        hamiltonian: {
            en: 'No microscopic anyon Hamiltonian or wavefunction is solved. Optional excitation costs are bookkeeping gaps used by the interaction rules, not eigenvalues obtained from diagonalization.',
            zh: '不求解微觀 anyon Hamiltonian 或波函數。可選的激發成本是互動規則使用的記帳能隙，不是由對角化得到的本徵值。'
        },
        evolution: {
            en: 'Manual graph-local hops, exchanges, braids, inverse unbraids, fusion, recombination, and measurements. Seeded noise may create pairs or alter labels according to the selected model.',
            zh: '採手動圖局部躍遷、交換、編織、反向解編織、融合、重組與測量。定種子噪聲可依所選模型產生配對或改變標記。'
        },
        partition: {
            en: 'No thermal partition function or path integral is evaluated. The finite event history is a symbolic trajectory, not an ensemble average.',
            zh: '不計算熱配分函數或路徑積分。有限事件歷史是符號式軌跡，不是系綜平均。'
        },
        measurements: {
            en: 'Total fusion charge, charge populations, braid-word length, braid parity, fusion outcomes, logical sector, memory lifetime, energy history, and unbraid success.',
            zh: '可計算總融合電荷、電荷數量、braid word 長度、編織 parity、融合結果、邏輯扇區、記憶壽命、能量歷史與解編織成功率。'
        },
        implementation: {
            en: 'A classical graph engine validates local paths, updates algebraic labels, and records every worldline/fusion event. Exactness applies only to the encoded symbolic tables and replay, not to a microscopic material.',
            zh: '古典圖引擎會驗證局部路徑、更新代數標記並記錄每個 worldline／融合事件。精確性只適用於已編碼的符號表與重播，不代表微觀材料。'
        },
        boundary: {
            en: 'Use this to study how symbolic fusion and winding records depend on topology. Do not treat it as a quantum many-body simulation or evidence of experimentally realized anyons.',
            zh: '可用來研究符號式融合與繞行紀錄如何依賴拓撲；不可視為量子多體模擬或實驗實現 anyon 的證據。'
        },
        references: [
            { label: 'Kitaev, Fault-tolerant quantum computation by anyons', url: 'https://arxiv.org/abs/quant-ph/9707021' },
            { label: 'Nayak et al., Non-Abelian Anyons and Topological Quantum Computation', url: 'https://arxiv.org/abs/0707.1889' }
        ]
    },
    cft_graph: {
        scope: { en: 'Discrete CFT-inspired estimator', zh: '離散 CFT 啟發式估計器' },
        system: {
            en: 'A finite topology graph represents a discretized surface. Vertices carry identity or primary-field labels, source signs, OPE-channel metadata, and optional truncated Virasoro actions.',
            zh: '有限拓撲圖代表離散化曲面。頂點帶有 identity 或 primary field 標記、源正負號、OPE 通道資料，以及可選的截斷 Virasoro 動作。'
        },
        model: {
            en: 'Local graph contacts apply selected symbolic OPE tables. Correlation, conformal-block, entropy, and stress values are finite graph proxies derived from distances, labels, and event history.',
            zh: '局部圖接觸會套用所選符號式 OPE 表。相關函數、conformal block、熵與 stress 數值是由距離、標記與事件歷史得到的有限圖 proxy。'
        },
        hamiltonian: {
            en: 'No continuum action, transfer matrix, CFT Hamiltonian, or spectrum is solved. Virasoro labels are truncated rule operators, not an exact representation on a Hilbert space.',
            zh: '不求解連續作用量、轉移矩陣、CFT Hamiltonian 或能譜。Virasoro 標記是截斷規則算符，不是 Hilbert 空間上的精確表示。'
        },
        evolution: {
            en: 'Manual primary insertion, local OPE/contact update, truncated L_n action, and measurement events. Optional seeded errors affect measurements and replay.',
            zh: '採手動 primary insertion、局部 OPE／接觸更新、截斷 L_n 動作與測量事件。可選的定種子誤差會影響測量與重播。'
        },
        partition: {
            en: 'No path integral or partition function Z = Tr exp(-beta H) is computed. Conformal-block weights are normalized graph estimators, not exact continuum block decompositions.',
            zh: '不計算路徑積分或配分函數 Z = Tr exp(-beta H)。Conformal block 權重是正規化圖估計量，不是精確的連續 conformal block 分解。'
        },
        measurements: {
            en: 'Primary counts, OPE-channel distribution, two-point proxy, four-point cross-ratio, dominant block, entropy estimate, mutual-information proxy, stress proxy, and anomaly-event count.',
            zh: '可計算 primary 數量、OPE 通道分布、兩點 proxy、四點交比、主導 block、熵估計、mutual information proxy、stress proxy 與 anomaly 事件數。'
        },
        implementation: {
            en: 'The engine combines topology-aware graph distance/contact data with explicit symbolic OPE and Virasoro update tables. Every value is exported with estimator limitations.',
            zh: '引擎把拓撲感知圖距離／接觸資料與明確的符號式 OPE、Virasoro 更新表結合；每個數值匯出時都附帶估計限制。'
        },
        boundary: {
            en: 'Use for qualitative, educational comparison of graph/topology effects. It is not a continuum CFT solver and cannot establish scaling dimensions, central charge, or exact correlators.',
            zh: '適合定性教學比較圖與拓撲效應；不是連續 CFT 求解器，不能據此確立 scaling dimension、central charge 或精確 correlator。'
        },
        references: [
            { label: 'Simmons-Duffin, TASI Lectures on the Conformal Bootstrap', url: 'https://arxiv.org/abs/1602.07982' }
        ]
    },
    ising: {
        scope: { en: 'Finite-lattice statistical estimator', zh: '有限晶格統計估計器' },
        system: {
            en: 'A finite topology graph with site spins s_i in {+1, -1}; optional undecided sites are excluded from pair interactions. Graph edges define nearest-neighbor couplings and boundary seams.',
            zh: '有限拓撲圖上的格點自旋 s_i 屬於 {+1, -1}；可選的未決格點不計入成對交互作用。圖邊定義最近鄰耦合與邊界接縫。'
        },
        model: {
            en: 'The implemented energy is E(s) = -J sum_(ij in E) s_i s_j - h sum_i s_i. Each undirected graph edge is counted once. Domain walls are edges joining opposite spins.',
            zh: '實作能量為 E(s) = -J sum_(ij in E) s_i s_j - h sum_i s_i；每條無向圖邊只計一次。Domain wall 是連接相反自旋的圖邊。'
        },
        hamiltonian: {
            en: 'The displayed E is the classical Ising Hamiltonian evaluated on the current finite configuration. It is an exact value for this encoded graph and parameter set, not a thermodynamic-limit result.',
            zh: '畫面中的 E 是目前有限組態上的古典 Ising Hamiltonian；對已編碼圖與參數而言是精確值，但不是熱力學極限結果。'
        },
        evolution: {
            en: 'A proposed local or connected-domain flip gives Delta E. With Metropolis enabled, downhill moves are accepted and uphill moves use p = exp(-Delta E / T), with k_B set to 1 and seeded random draws.',
            zh: '局部或連通 domain 翻轉提案會得到 Delta E。啟用 Metropolis 時，降能量動作接受；升能量動作以 p = exp(-Delta E / T) 接受，並設 k_B = 1、使用定種子亂數。'
        },
        partition: {
            en: 'The formal equilibrium distribution is proportional to exp(-E/T), with Z = sum_s exp(-E(s)/T). This app does not enumerate Z, estimate free energy, or prove equilibration; manual moves are not an unbiased equilibrium sampler.',
            zh: '形式上的平衡分布正比於 exp(-E/T)，Z = sum_s exp(-E(s)/T)。本程式不枚舉 Z、不估計自由能，也不證明已平衡；手動動作不是無偏平衡取樣器。'
        },
        measurements: {
            en: 'Energy, magnetization, domain-wall length, connected-domain count, area fractions, accepted move flag, Delta E, and topology winding indicators.',
            zh: '可計算能量、磁化、domain wall 長度、連通 domain 數、面積比例、動作接受旗標、Delta E 與拓撲繞行指標。'
        },
        implementation: {
            en: 'The engine stores spins in a keyed map, enumerates unique graph-edge pairs, evaluates E before and after a proposal, applies the seeded acceptance test, and logs observables after every event.',
            zh: '引擎以 keyed map 儲存自旋、枚舉唯一圖邊配對、計算提案前後的 E、執行定種子接受測試，並在每個事件後記錄觀測量。'
        },
        boundary: {
            en: 'Finite-size, initialization, update scheduling, and topology strongly affect results. Quantitative phase-transition claims require convergence, autocorrelation, uncertainty, and benchmark analysis not supplied by the interactive board alone.',
            zh: '有限尺寸、初始條件、更新排程與拓撲會強烈影響結果。定量相變主張需要收斂、自相關、不確定性與基準分析，不能只靠互動棋盤。'
        },
        references: [
            { label: 'Metropolis et al., Equation of State Calculations by Fast Computing Machines', url: 'https://doi.org/10.1063/1.1699114' }
        ]
    },
    phase_field: {
        scope: { en: 'Finite graph phase-field estimator', zh: '有限圖相場估計器' },
        system: {
            en: 'Each graph site is phase A, phase B, or metastable empty substrate. Opposite occupied neighbors form interfaces; local graph geometry determines contact and curvature proxies.',
            zh: '每個圖格點為 phase A、phase B 或 metastable 空基底。相鄰的相反已佔據格點形成界面；局部圖幾何決定接觸與曲率 proxy。'
        },
        model: {
            en: 'The implemented objective is E = gamma L - b_A A_A - b_B A_B + kappa C, where L is unlike-neighbor interface count, A_A and A_B are occupied areas, and C is a discrete interface-bend penalty.',
            zh: '實作目標為 E = gamma L - b_A A_A - b_B A_B + kappa C，其中 L 是異相鄰居界面數，A_A 與 A_B 是佔據面積，C 是離散界面彎折懲罰。'
        },
        hamiltonian: {
            en: 'E is an explicit toy free-energy functional for the current graph configuration. It is not derived from a calibrated material Hamiltonian and has no physical units unless the user supplies an external mapping.',
            zh: 'E 是目前圖組態的明確 toy 自由能泛函；不是由已校準材料 Hamiltonian 推導，除非使用者提供外部映射，否則沒有物理單位。'
        },
        evolution: {
            en: 'Nucleation, domain growth, and interface flips update local site states. Interface flips reject positive Delta E in the current rule; optional seeded droplets add stochastic perturbations.',
            zh: '成核、domain 成長與界面翻轉會更新局部格點狀態。目前規則會拒絕正 Delta E 的界面翻轉；可選的定種子 droplets 加入隨機擾動。'
        },
        partition: {
            en: 'No partition function or equilibrium Gibbs sampler is implemented. The energy guides local actions but the trajectory is a controlled finite process, not a thermodynamic ensemble.',
            zh: '未實作配分函數或平衡 Gibbs 取樣器。能量會引導局部動作，但軌跡是受控有限過程，不是熱力學系綜。'
        },
        measurements: {
            en: 'Energy, Delta E, phase area fractions, metastable fraction, interface length, domain count, interface velocity proxy, homology, winding, and twisted-sector indicators.',
            zh: '可計算能量、Delta E、相面積比例、metastable 比例、界面長度、domain 數、界面速度 proxy、homology、繞行與扭曲扇區指標。'
        },
        implementation: {
            en: 'Connected components and unlike-neighbor edges are recomputed on the reusable topology graph. Event logs preserve nucleation, growth, flips, noise droplets, and observable snapshots.',
            zh: '程式會在可重用拓撲圖上重新計算連通分量與異相鄰居邊。事件紀錄保留成核、成長、翻轉、noise droplets 與觀測快照。'
        },
        boundary: {
            en: 'Interpret only as qualitative interface competition. It does not solve Cahn-Hilliard, Allen-Cahn, or continuum hydrodynamic equations.',
            zh: '只能解讀為定性界面競爭；不求解 Cahn-Hilliard、Allen-Cahn 或連續流體動力方程。'
        },
        references: [
            { label: 'Bray, Theory of Phase-Ordering Kinetics', url: 'https://arxiv.org/abs/cond-mat/9501089' }
        ]
    },
    cluster: {
        scope: { en: 'Graph cluster and percolation estimator', zh: '圖團簇與滲流估計器' },
        system: {
            en: 'A finite graph with empty resource sites and occupied cluster sectors A or B. Connected components, vacant contacts, seams, and noncontractible wrapping are derived from graph adjacency.',
            zh: '有限圖包含空資源格點與已佔據的 cluster 扇區 A 或 B。連通分量、空缺接觸、接縫與不可收縮繞行由圖鄰接關係導出。'
        },
        model: {
            en: 'Local placement and growth operate on occupied connected components. Zero-contact components can be removed, while optional diffusion/noise changes occupancy. Percolation is diagnosed from graph connectivity and wrapping metadata.',
            zh: '局部放置與成長作用於已佔據連通分量。零接觸分量可被移除；可選 diffusion／noise 會改變佔據。Percolation 由圖連通性與繞行資料診斷。'
        },
        hamiltonian: {
            en: 'No Hamiltonian or free-energy functional is evaluated. Interface length and cluster sizes are geometric observables, not energy terms.',
            zh: '不計算 Hamiltonian 或自由能泛函。界面長度與 cluster 大小是幾何觀測量，不是能量項。'
        },
        evolution: {
            en: 'Manual or automatic local placement, connected growth, contact-loss removal, and optional seeded diffusion/noise. Update order is part of the experiment definition.',
            zh: '採手動或自動局部放置、連通成長、失去接觸後移除，以及可選的定種子 diffusion／noise。更新順序是實驗定義的一部分。'
        },
        partition: {
            en: 'No random-cluster partition function is computed. Reported percolation values are finite-run connectivity estimators and require repeated seeds for uncertainty.',
            zh: '不計算 random-cluster 配分函數。所報告的 percolation 數值是有限執行的連通性估計，需重複種子才能評估不確定性。'
        },
        measurements: {
            en: 'Cluster count, largest cluster, cluster-size distribution, occupied fractions, vacant contacts, interface length, wrapping components, and finite-run percolation indicator.',
            zh: '可計算 cluster 數、最大 cluster、cluster 大小分布、佔據比例、空缺接觸、界面長度、繞行分量與有限執行 percolation 指標。'
        },
        implementation: {
            en: 'Breadth/depth graph searches identify connected components; topology seam and homology metadata classify wrapping. Seeded runs and exports preserve the complete occupancy trace.',
            zh: '程式使用圖廣度／深度搜尋辨識連通分量，並以拓撲接縫與 homology 資料分類繞行。定種子執行與匯出會保留完整佔據軌跡。'
        },
        boundary: {
            en: 'Finite-size crossing is not a critical threshold. Research claims require lattice-specific scaling, repeated seeds, confidence intervals, and comparison with known percolation benchmarks.',
            zh: '有限尺寸的跨越不等於臨界閾值。研究主張需要晶格特定 scaling、重複種子、信賴區間與已知 percolation 基準比較。'
        },
        references: [
            { label: 'Saberi, Recent advances in percolation theory and its applications', url: 'https://arxiv.org/abs/1504.02898' }
        ]
    },
    particles: {
        scope: { en: 'Discrete transport and reaction sandbox', zh: '離散傳輸與反應沙盒' },
        system: {
            en: 'Mobile particle or charge labels occupy vertices of a finite topology graph. Each token stores ownership, path length, optional parity, and reaction bookkeeping.',
            zh: '可移動的粒子或電荷標記佔據有限拓撲圖頂點。每個 token 儲存控制權、路徑長度、可選 parity 與反應記帳資料。'
        },
        model: {
            en: 'Allowed hops follow adjacency; exchanges or scattering use validated graph paths; compatible encounters can recombine. This is an event model, not a discretized differential equation.',
            zh: '合法躍遷遵循鄰接；交換或 scattering 使用已驗證圖路徑；相容相遇可重組。這是事件模型，不是微分方程離散化。'
        },
        hamiltonian: {
            en: 'No kinetic Hamiltonian, interaction potential, or quantum propagator is evaluated. Optional recovered energy is rule bookkeeping.',
            zh: '不計算動能 Hamiltonian、交互作用勢或量子 propagator。可選的回收能量只是規則記帳。'
        },
        evolution: {
            en: 'Manual event-driven hopping, exchange, scattering, and recombination. Seeded randomness is used only where an enabled rule requests it.',
            zh: '採手動事件驅動的躍遷、交換、scattering 與重組。只有啟用規則需要時才使用定種子亂數。'
        },
        partition: {
            en: 'No equilibrium partition function, master-equation integration, or reaction-rate ensemble is computed.',
            zh: '不計算平衡配分函數、master equation 積分或反應速率系綜。'
        },
        measurements: {
            en: 'Particle counts, recombination count, exchange events, path-length distribution, average path length, parity sector, recovered energy, and survival fraction.',
            zh: '可計算粒子數、重組數、交換事件、路徑長度分布、平均路徑長度、parity 扇區、回收能量與存活比例。'
        },
        implementation: {
            en: 'The graph engine validates reachability and collision rules, updates token records, and stores every accepted path and reaction in the event log.',
            zh: '圖引擎驗證可達性與碰撞規則、更新 token 紀錄，並把每個已接受路徑與反應存入事件紀錄。'
        },
        boundary: {
            en: 'Use for topology-dependent path and reaction logic. It is not calibrated chemistry, molecular dynamics, quantum transport, or a continuum reaction-diffusion solver.',
            zh: '適合研究拓撲依賴的路徑與反應邏輯；不是校準化學、分子動力學、量子傳輸或連續 reaction-diffusion 求解器。'
        },
        references: [
            { label: 'Täuber, Howard, and Vollmayr-Lee, Applications of field-theoretic renormalization group methods to reaction-diffusion problems', url: 'https://arxiv.org/abs/cond-mat/0501678' }
        ]
    },
    spin_ice: {
        scope: { en: 'Finite graph vertex-model estimator', zh: '有限圖頂點模型估計器' },
        system: {
            en: 'Oriented graph edges carry arrows. At every vertex, incoming and outgoing arrows define a discrete charge; preferred local configurations satisfy the selected ice rule.',
            zh: '有向圖邊帶有箭頭。每個頂點的流入與流出箭頭定義離散電荷；偏好的局部組態滿足所選 ice rule。'
        },
        model: {
            en: 'Vertex charge and ice-rule violations are computed from incident edge orientations. Open strings create endpoint defects; closed loop flips can change winding without creating endpoints.',
            zh: '頂點電荷與 ice-rule 違反由關聯圖邊方向計算。開放 string 產生端點缺陷；封閉 loop 翻轉可改變繞行而不產生端點。'
        },
        hamiltonian: {
            en: 'The implemented penalty is E = Delta sum_v max(1, |q_v|/2) over violating vertices. It is a simplified defect energy, not a dipolar spin-ice Hamiltonian.',
            zh: '實作懲罰為 E = Delta sum_v max(1, |q_v|/2)，總和遍及違規頂點。這是簡化缺陷能量，不是 dipolar spin-ice Hamiltonian。'
        },
        evolution: {
            en: 'Manual edge flips, strings, loops, and monopole-directed updates. Candidate local flips may be ranked by their change in the simplified defect energy.',
            zh: '採手動圖邊翻轉、string、loop 與 monopole 導向更新。候選局部翻轉可依簡化缺陷能量變化排序。'
        },
        partition: {
            en: 'No six-vertex/eight-vertex transfer matrix or thermal partition function is computed. Configurations are controlled event trajectories rather than equilibrium samples.',
            zh: '不計算 six-vertex／eight-vertex 轉移矩陣或熱配分函數。組態是受控事件軌跡，不是平衡樣本。'
        },
        measurements: {
            en: 'Energy penalty, ice-rule violation count, monopole count and charge, defect density, string lengths, closed-loop events, and topological winding sector.',
            zh: '可計算能量懲罰、ice-rule 違反數、monopole 數與電荷、缺陷密度、string 長度、封閉 loop 事件與拓撲繞行扇區。'
        },
        implementation: {
            en: 'Incident-edge orientation is evaluated at every graph vertex. Path and cycle operations flip signed edge states and append defect/loop observables to the history.',
            zh: '程式在每個圖頂點評估關聯邊方向。路徑與循環操作會翻轉帶符號的圖邊狀態，並把缺陷／loop 觀測量加入歷史。'
        },
        boundary: {
            en: 'This captures constrained edge logic and topology qualitatively. It omits long-range dipolar interactions, material geometry, quantum tunneling, and thermodynamic equilibration.',
            zh: '本工具定性表現受限圖邊邏輯與拓撲；省略長程 dipolar 交互作用、材料幾何、量子 tunneling 與熱力學平衡。'
        },
        references: [
            { label: 'Castelnovo, Moessner, and Sondhi, Spin Ice, Fractionalization and Topological Order', url: 'https://arxiv.org/abs/1112.3793' }
        ]
    },
    z2_gauge: {
        scope: { en: 'Discrete Z2 gauge and memory estimator', zh: '離散 Z2 規範與記憶估計器' },
        system: {
            en: 'Graph edges carry Z2 variables U_e in {+1, -1}. Vertex-star checks, available face/plaquette checks, paths, closed loops, and noncontractible cycles define local syndrome and logical sectors.',
            zh: '圖邊帶有 Z2 變數 U_e 屬於 {+1, -1}。頂點 star 檢查、可用的 face／plaquette 檢查、路徑、封閉 loop 與不可收縮循環定義局部 syndrome 與邏輯扇區。'
        },
        model: {
            en: 'Products of edge variables evaluate star/flux checks and Wilson-loop signs. Open path flips create endpoint syndrome; closed or noncontractible loops can alter flux or logical sector.',
            zh: '圖邊變數乘積用來評估 star／flux 檢查與 Wilson loop 正負號。開放路徑翻轉產生端點 syndrome；封閉或不可收縮 loop 可改變 flux 或邏輯扇區。'
        },
        hamiltonian: {
            en: 'The displayed energy is E = N_star-violations + N_flux-violations. It is a unit-weight syndrome penalty inspired by commuting-projector gauge/code models, not a quantum expectation value.',
            zh: '畫面能量為 E = N_star-violations + N_flux-violations。這是受 commuting-projector gauge／code 模型啟發的單位權重 syndrome 懲罰，不是量子期望值。'
        },
        evolution: {
            en: 'Manual edge, path, and loop flips with optional decoder and seeded noisy edge flips. Every update recomputes checks and logical Wilson-loop sectors.',
            zh: '採手動圖邊、路徑與 loop 翻轉，可選 decoder 與定種子 noisy edge flip。每次更新都重新計算檢查與邏輯 Wilson loop 扇區。'
        },
        partition: {
            en: 'No gauge-theory path integral or finite-temperature partition function is computed. Noise controls generate event histories rather than equilibrium gauge ensembles.',
            zh: '不計算 gauge theory 路徑積分或有限溫度配分函數。噪聲控制產生事件歷史，而不是平衡 gauge 系綜。'
        },
        measurements: {
            en: 'Star violations, plaquette/flux violations, syndrome weight, unit penalty energy, Wilson-loop signs, logical sector, memory status, loop-length distribution, and decoder success.',
            zh: '可計算 star 違反、plaquette／flux 違反、syndrome 權重、單位懲罰能量、Wilson loop 正負號、邏輯扇區、記憶狀態、loop 長度分布與 decoder 成功率。'
        },
        implementation: {
            en: 'Signed edge maps and explicit graph cycles provide deterministic check products. Face-dependent quantities are computed only where the topology adapter supplies usable plaquettes.',
            zh: '帶符號圖邊 map 與明確圖循環提供確定性的檢查乘積。只有拓撲 adapter 提供可用 plaquette 時才計算依賴 face 的量。'
        },
        boundary: {
            en: 'Use as a finite symbolic gauge/code estimator. It does not evolve a quantum state, calculate spectra, or establish a topological phase.',
            zh: '適合用作有限符號式 gauge／code 估計器；不演化量子態、不計算能譜，也不能據此確立拓撲相。'
        },
        references: [
            { label: 'Kitaev, Fault-tolerant quantum computation by anyons', url: 'https://arxiv.org/abs/quant-ph/9707021' },
            { label: 'Dennis et al., Topological Quantum Memory', url: 'https://arxiv.org/abs/quant-ph/0110143' }
        ]
    }
});
const LAB_SCIENCE_PROFILE_BY_MODE = Object.freeze({
    clifford_reversi: 'pauli_transport',
    clifford_go: 'pauli_transport',
    clifford_jump: 'pauli_transport',
    physical_clifford_reversi: 'stabilizer_recovery',
    physical_clifford_go: 'stabilizer_recovery',
    physical_clifford_jump: 'stabilizer_recovery',
    anyon_reversi: 'anyon_dynamics',
    anyon_jump: 'anyon_dynamics',
    physical_anyon_reversi: 'anyon_dynamics',
    physical_anyon_jump: 'anyon_dynamics',
    physical_virasoro_go: 'cft_graph',
    physical_virasoro_reversi: 'cft_graph',
    virasoro_jump: 'cft_graph',
    physical_virasoro_jump: 'cft_graph',
    ising_domain_game: 'ising',
    two_phase_competition_game: 'phase_field',
    physical_cluster_go: 'cluster',
    physical_jump_particles: 'particles',
    spin_ice_vertex_game: 'spin_ice',
    z2_gauge_loop_game: 'z2_gauge'
});
const LAB_RESEARCH_OBJECTIVES = Object.freeze({
    pauli_transport: {
        en: 'Determine how graph topology, boundary identification, and local path structure alter symbolic Pauli transport, Clifford-frame updates, and commutation diagnostics under an otherwise fixed update rule.',
        zh: '在固定更新規則下，研究圖拓撲、邊界識別與局部路徑結構如何改變符號式 Pauli 傳輸、Clifford frame 更新與對易診斷。'
    },
    stabilizer_recovery: {
        en: 'Compare finite-graph recovery trajectories and logical-sector outcomes across topologies under matched Pauli-error seeds, check structure, measurement settings, and recovery actions.',
        zh: '在匹配的 Pauli 誤差種子、檢查結構、測量設定與復原動作下，比較不同拓撲上的有限圖復原軌跡與邏輯扇區結果。'
    },
    anyon_dynamics: {
        en: 'Test how local transport, symbolic braid history, fusion outcomes, and noncontractible winding records depend on graph topology for a fixed anyon algebra and seeded event protocol.',
        zh: '在固定 anyon 代數與定種子事件流程下，檢驗局部傳輸、符號式編織歷史、融合結果與不可收縮繞行紀錄如何依賴圖拓撲。'
    },
    cft_graph: {
        en: 'Measure the sensitivity of finite-graph OPE-channel, correlation, entropy, block-weight, and stress proxies to topology, insertion geometry, and truncated local operator actions.',
        zh: '測量有限圖 OPE 通道、相關、熵、block 權重與 stress proxy 對拓撲、插入幾何及截斷局部算符動作的敏感度。'
    },
    ising: {
        en: 'Compare finite-size spin energy, magnetization, domain morphology, and winding under matched couplings, initial states, update schedules, and random seeds across boundary identifications.',
        zh: '在匹配的耦合、初始態、更新排程與亂數種子下，比較不同邊界識別的有限尺寸自旋能量、磁化、domain 形態與繞行。'
    },
    phase_field: {
        en: 'Quantify how finite graph topology and local interface penalties change phase selection, coarsening, wrapped interfaces, and metastable retention under matched initial conditions.',
        zh: '在匹配初始條件下，量化有限圖拓撲與局部界面懲罰如何改變相選擇、粗化、繞行界面與 metastable 保留。'
    },
    cluster: {
        en: 'Compare connected-component growth, finite-size crossing, cluster-size statistics, and topology wrapping under matched occupancy rules and random seeds.',
        zh: '在匹配的佔據規則與亂數種子下，比較連通分量成長、有限尺寸跨越、cluster 大小統計與拓撲繞行。'
    },
    particles: {
        en: 'Characterize topology-dependent reachability, path-length statistics, exchange parity, recombination, and survival under a fixed discrete transport and reaction protocol.',
        zh: '在固定離散傳輸與反應流程下，描述拓撲依賴的可達性、路徑長度統計、交換 parity、重組與存活。'
    },
    spin_ice: {
        en: 'Compare defect production, string evolution, loop winding, and recovery of the local ice constraint across finite graph topologies under matched edge-update protocols.',
        zh: '在匹配圖邊更新流程下，比較有限圖拓撲上的缺陷產生、string 演化、loop 繞行與局部 ice constraint 復原。'
    },
    z2_gauge: {
        en: 'Test the topology dependence of local syndrome removal, Wilson-loop sectors, loop-length statistics, and logical-memory outcomes under matched Z2 edge-error and decoder protocols.',
        zh: '在匹配的 Z2 圖邊誤差與 decoder 流程下，檢驗局部 syndrome 移除、Wilson loop 扇區、loop 長度統計與邏輯記憶結果的拓撲依賴性。'
    }
});
function observableSpec(id, key, name, nameZh, definition, definitionZh, units, meaning, meaningZh) {
    return {
        id,
        key,
        name: { en: name, zh: nameZh },
        definition: { en: definition, zh: definitionZh },
        units,
        meaning: { en: meaning, zh: meaningZh }
    };
}

const LAB_OBSERVABLE_SPECS = Object.freeze({
    pauli_transport: [
        observableSpec('occupied', 'occupiedSites', 'Occupied operator sites', '已佔據算符格點', 'Number of graph sites carrying an operator token.', '帶有算符 token 的圖格點數。', 'count', 'Operator support size.', '算符支撐大小。'),
        observableSpec('sector-a', 'sectorA', 'Sector A operators', '扇區 A 算符', 'Count controlled by sector A / Black.', '由扇區 A／黑方控制的數量。', 'count', 'Control-sector population.', '控制扇區數量。'),
        observableSpec('sector-b', 'sectorB', 'Sector B operators', '扇區 B 算符', 'Count controlled by sector B / White.', '由扇區 B／白方控制的數量。', 'count', 'Control-sector population.', '控制扇區數量。'),
        observableSpec('events', 'eventCount', 'Accepted updates', '已接受更新', 'Number of accepted discrete update events.', '已接受離散更新事件數。', 'events', 'Trajectory length.', '軌跡長度。')
    ],
    stabilizer_recovery: [
        observableSpec('syndrome', 'syndromeWeight', 'Syndrome weight', 'Syndrome 權重', 'N_X-violations + N_Z-violations.', 'N_X 違反數 + N_Z 違反數。', 'count', 'Residual local-check burden.', '剩餘局部檢查負擔。'),
        observableSpec('violations', 'stabilizerViolations', 'Violated checks', '違反檢查數', 'Number of sites whose local X or Z parity differs from its target check.', '局部 X 或 Z parity 與目標檢查不同的格點數。', 'count', 'Spatial extent of recovery defects.', '復原缺陷的空間範圍。'),
        observableSpec('conflicts', 'commutationConflictCount', 'Commutation conflicts', '對易衝突', 'Number of adjacent occupied Pauli labels that anticommute.', '相鄰已佔據 Pauli 標記中反對易的配對數。', 'count', 'Local algebraic incompatibility.', '局部代數不相容性。'),
        observableSpec('ancillas', 'numberOfAncillas', 'Ancilla count', 'Ancilla 數量', 'Number of sites currently marked as ancillas.', '目前標記為 ancilla 的格點數。', 'count', 'Measurement/recovery resources in use.', '使用中的測量／復原資源。')
    ],
    anyon_dynamics: [
        observableSpec('particles', 'particleCount', 'Anyon count', 'Anyon 數量', 'Number of non-vacuum mobile charge tokens.', '非真空可移動電荷 token 數。', 'count', 'Excitation population.', '激發數量。'),
        observableSpec('braids', 'totalBraids', 'Accepted braids', '已接受編織', 'Count of non-skipped braid events.', '未略過的 braid 事件數。', 'events', 'Accumulated exchange history.', '累積交換歷史。'),
        observableSpec('word-length', 'averageBraidWordLength', 'Mean braid-word length', '平均 braid word 長度', 'Mean number of stored braid generators per token.', '每個 token 儲存的 braid generator 數量平均。', 'generators/token', 'Symbolic braid-memory complexity.', '符號式編織記憶複雜度。'),
        observableSpec('winding', 'sectorChanges', 'Topology-sector events', '拓撲扇區事件', 'Number of recorded noncontractible winding-sector changes.', '已記錄不可收縮繞行扇區變化數。', 'events', 'Topology-sensitive worldline activity.', '拓撲敏感 worldline 活動。')
    ],
    cft_graph: [
        observableSpec('entropy', 'entanglementEntropyEstimate', 'Entropy estimator', '熵估計量', 'Finite-graph interval estimator returned by the selected CFT rule.', '所選 CFT 規則回傳的有限圖區間估計量。', 'dimensionless estimator', 'Relative interval complexity; not exact continuum entropy.', '相對區間複雜度；不是精確連續熵。'),
        observableSpec('wall', 'domainWallLength', 'Domain-wall length', 'Domain wall 長度', 'Count of graph edges joining opposite source signs.', '連接相反源正負號的圖邊數。', 'edges', 'Discrete interface geometry.', '離散界面幾何。'),
        observableSpec('mutual-info', 'mutualInformationEstimate', 'Mutual-information estimator', 'Mutual information 估計量', 'Graph estimator computed from domain and interface data.', '由 domain 與界面資料計算的圖估計量。', 'dimensionless estimator', 'Relative inter-region dependence.', '區域間相依程度。'),
        observableSpec('anomalies', 'anomalyCount', 'Anomaly events', 'Anomaly 事件', 'Number of recorded central-charge anomaly markers.', '已記錄 central-charge anomaly marker 數。', 'events', 'Overlap events in the truncated N=2 update rule.', '截斷 N=2 更新規則中的重疊事件。')
    ],
    ising: [
        observableSpec('energy', 'energy', 'Energy', '能量', 'E = -J sum_(ij in E) s_i s_j - h sum_i s_i.', 'E = -J sum_(ij in E) s_i s_j - h sum_i s_i。', 'model energy', 'Current finite-graph Ising Hamiltonian value.', '目前有限圖 Ising Hamiltonian 值。'),
        observableSpec('magnetization', 'magnetization', 'Magnetization', '磁化', 'M = (1/N_occ) sum_i s_i.', 'M = (1/N_occ) sum_i s_i。', 'dimensionless', 'Spin-order parameter.', '自旋序參量。'),
        observableSpec('wall', 'domainWallLength', 'Domain-wall length', 'Domain wall 長度', 'Count of edges with s_i != s_j.', 's_i != s_j 的圖邊數。', 'edges', 'Interface extent.', '界面範圍。'),
        observableSpec('correlation', 'correlationEstimate', 'Nearest-neighbor correlation', '最近鄰相關', 'C_1 = mean_(ij in E)(s_i s_j) over occupied pairs.', 'C_1 = mean_(ij in E)(s_i s_j)，只計已佔據配對。', 'dimensionless', 'Local alignment estimator.', '局部對齊估計量。')
    ],
    phase_field: [
        observableSpec('energy', 'energy', 'Phase objective', '相目標能量', 'E = gamma L - b_A A_A - b_B A_B + kappa C.', 'E = gamma L - b_A A_A - b_B A_B + kappa C。', 'model energy', 'Current interface/bias objective.', '目前界面／bias 目標。'),
        observableSpec('interface', 'interfaceLength', 'Interface length', '界面長度', 'Count of unlike occupied neighbor edges.', '異相已佔據鄰居圖邊數。', 'edges', 'Phase-boundary extent.', '相邊界範圍。'),
        observableSpec('fraction-a', 'areaFractionA', 'Phase A fraction', 'Phase A 比例', 'A_A / N_sites.', 'A_A / N_sites。', 'fraction', 'Coverage by phase A.', 'Phase A 佔據率。'),
        observableSpec('domains', 'numberOfDomains', 'Domain count', 'Domain 數量', 'Number of connected same-phase components.', '同相連通分量數。', 'count', 'Coarsening state.', '粗化狀態。')
    ],
    cluster: [
        observableSpec('largest', 'largestCluster', 'Largest cluster', '最大 cluster', 'Maximum occupied connected-component size.', '最大已佔據連通分量大小。', 'sites', 'Dominant connected mass.', '主導連通質量。'),
        observableSpec('percolation', 'percolationProbability', 'Percolation estimator', 'Percolation 估計量', '1 for detected wrapping; otherwise min(1, 2 S_max/N).', '偵測到繞行時為 1；否則 min(1, 2 S_max/N)。', 'finite-run estimator', 'Finite graph crossing/wrapping tendency.', '有限圖跨越／繞行傾向。'),
        observableSpec('clusters', 'numberOfClusters', 'Cluster count', 'Cluster 數量', 'Number of occupied connected components.', '已佔據連通分量數。', 'count', 'Fragmentation state.', '碎裂狀態。'),
        observableSpec('correlation', 'correlationLengthEstimate', 'Correlation-length proxy', '相關長度 proxy', 'sqrt(sum_s s^2 n_s / N_occ).', 'sqrt(sum_s s^2 n_s / N_occ)。', 'sites^0.5', 'Weighted cluster-size scale.', '加權 cluster 大小尺度。')
    ],
    particles: [
        observableSpec('count', 'particleCount', 'Particle count', '粒子數', 'Number of occupied particle vertices.', '已佔據粒子頂點數。', 'count', 'Remaining mobile population.', '剩餘可移動數量。'),
        observableSpec('path', 'averagePathLength', 'Mean path length', '平均路徑長度', 'Arithmetic mean of stored token path lengths.', 'token 儲存路徑長度的算術平均。', 'graph steps', 'Transport range.', '傳輸範圍。'),
        observableSpec('recombine', 'recombinationCount', 'Recombination count', '重組數', 'Number of accepted opposite-particle recombination events.', '已接受的相反粒子重組事件數。', 'events', 'Reaction progress.', '反應進度。'),
        observableSpec('survival', 'survivalFraction', 'Survival fraction', '存活比例', 'N_final / max(1, N_initial).', 'N_final / max(1, N_initial)。', 'fraction', 'Population persistence.', '數量持續性。')
    ],
    spin_ice: [
        observableSpec('energy', 'energy', 'Defect energy', '缺陷能量', 'E = Delta sum_v max(1, |q_v|/2) over violating vertices.', 'E = Delta sum_v max(1, |q_v|/2)，總和遍及違規頂點。', 'model energy', 'Simplified ice-rule defect cost.', '簡化 ice-rule 缺陷成本。'),
        observableSpec('violations', 'iceRuleViolations', 'Ice-rule violations', 'Ice-rule 違反', 'Number of vertices outside the preferred in/out rule.', '不符合偏好流入／流出規則的頂點數。', 'count', 'Local constraint failure.', '局部 constraint 失敗。'),
        observableSpec('monopoles', 'monopoleCount', 'Monopole defects', 'Monopole 缺陷', 'Number of violating vertices with q_v != 0.', 'q_v != 0 的違規頂點數。', 'count', 'Charged endpoint defects.', '帶電端點缺陷。'),
        observableSpec('density', 'defectDensity', 'Defect density', '缺陷密度', 'N_violations / N_vertices.', 'N_violations / N_vertices。', 'fraction', 'Normalized defect burden.', '正規化缺陷負擔。')
    ],
    z2_gauge: [
        observableSpec('energy', 'energy', 'Violation energy', '違反能量', 'E = N_star-violations + N_flux-violations.', 'E = N_star-violations + N_flux-violations。', 'unit penalty', 'Residual gauge/check burden.', '剩餘 gauge／檢查負擔。'),
        observableSpec('syndrome', 'syndromeWeight', 'Syndrome weight', 'Syndrome 權重', 'N_star-violations + N_flux-violations.', 'N_star-violations + N_flux-violations。', 'count', 'Total local error syndrome.', '局部誤差 syndrome 總量。'),
        observableSpec('star', 'starViolations', 'Star violations', 'Star 違反', 'Number of vertex-star products in the violating sector.', '位於違反扇區的 vertex-star 乘積數。', 'count', 'Charge-like syndrome.', '類電荷 syndrome。'),
        observableSpec('flux', 'plaquetteFluxViolations', 'Flux violations', 'Flux 違反', 'Number of available plaquette/cycle products in the violating sector.', '可用 plaquette／cycle 乘積中位於違反扇區的數量。', 'count', 'Flux-like syndrome.', '類 flux syndrome。')
    ]
});
const LAB_GUIDE_LABELS = Object.freeze({
    clifford: { en: 'Clifford Guide Book', zh: 'Clifford 指南書' },
    'physical-clifford': { en: 'Stabilizer Guide Book', zh: 'Stabilizer 指南書' },
    'physical-cluster-go': { en: 'Cluster Field Guide Book', zh: 'Cluster Field 指南書' },
    'ising-domain': { en: 'Spin Domain Guide Book', zh: 'Spin Domain 指南書' },
    'two-phase': { en: 'Two-Phase Guide Book', zh: 'Two-Phase 指南書' },
    'physical-jump-particles': { en: 'Particle Jump Guide Book', zh: 'Particle Jump 指南書' },
    'spin-ice': { en: 'Spin Ice Guide Book', zh: 'Spin Ice 指南書' },
    'z2-gauge': { en: 'Z2 Gauge Guide Book', zh: 'Z2 Gauge 指南書' },
    'cft-reversi': { en: 'CFT OPE Guide Book', zh: 'CFT OPE 指南書' },
    anyon: { en: 'Anyon Guide Book', zh: 'Anyon 指南書' },
    virasoro: { en: 'Virasoro / CFT Field Guide Book', zh: 'Virasoro / CFT Field 指南書' }
});
const LAB_SHARED_DEVICE_GUIDE = Object.freeze({
    en: {
        heading: 'Controls on desktop and mobile',
        items: [
            'Desktop: click a board site or graph vertex, use the selectors for the active action, drag 3D boards to rotate, and use the wheel or reset button for camera control.',
            'Mobile: tap the site or vertex, scroll the side controls normally, one-finger drag 3D boards to rotate, and pinch to zoom when the board is dense.',
            'After changing topology, lattice, board size, initial state, or a physical model, press Reset Experiment so the legal moves and observables rebuild from the new graph.'
        ]
    },
    zh: {
        heading: '桌機與手機操作',
        items: [
            '桌機：點棋盤格或 graph vertex，用選單選目前 action；3D 棋盤可拖曳旋轉，並用滾輪或 reset camera 控制視角。',
            '手機：點擊 site 或 vertex，側邊控制可正常捲動；3D 棋盤用單指拖曳旋轉，棋盤很密時用雙指縮放。',
            '改變 topology、lattice、棋盤大小、initial state 或 physical model 後，按 Reset Experiment 讓合法走法與 observables 依新 graph 重建。'
        ]
    }
});
const LAB_GUIDE_BOOKS = Object.freeze({
    clifford: {
        en: {
            title: 'Clifford / Pauli Operator Game Guide',
            subtitle: 'A playable Reversi, insertion, and worldline lab for Pauli labels, Clifford transforms, topology rays, and exports.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'Black and White take turns controlling Pauli-labelled pieces on the selected topology graph.',
                        'In Reversi mode the familiar goal is board control: make legal brackets, flip opponent chains, and finish with more controlled sites.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'Reversi: click an empty legal vertex that brackets at least one opponent chain along a topology-aware ray; the bracketed chain flips immediately.',
                        'Clifford Insertion Field: click a legal site, then choose X, Y, or Z from the local palette. Clifford Worldline Operators: select a token and move or exchange it along graph adjacency.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'The game ends when neither side has legal moves or both sides pass where passing is enabled. Final ownership counts decide the winner.',
                        'Exports also preserve the operator labels, topology, lattice, move history, and time/noise events for later study.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'X, Y, and Z are Pauli operators. H and S are Clifford transforms that change labels while preserving Pauli commutation structure.',
                        'Twisted seams and wrapped boards change which local rays touch, so the same rule can behave differently on flat, torus, Klein, RP2, S2, R3, or 4D graphs.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Use the observables to compare Pauli distribution, symplectic conflicts, phase/sign display, noise response, and topology transport.',
                        'Use seeded noise and time evolution when you need reproducible operator-spreading samples across geometries.'
                    ]
                }
            ]
        },
        zh: {
            title: 'Clifford / Pauli Operator 遊戲指南',
            subtitle: '把 Reversi、insertion 與 worldline 放在 Pauli label、Clifford transform、topology ray 與 export 裡一起玩。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        '黑白雙方輪流在選定的 topology graph 上控制帶有 Pauli label 的棋子。',
                        'Reversi 模式的基本目標是控制棋盤：走合法夾擊、翻轉對方鏈，最後控制更多 site。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        'Reversi：點一個可以沿 topology-aware ray 夾住至少一串對方棋子的空 vertex；被夾住的鏈會立刻翻轉。',
                        'Clifford Insertion Field：點合法 site 後，在局部選單選 X、Y 或 Z。Clifford Worldline Operators：選 token，沿 graph adjacency 移動或交換。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        '沒有合法走法，或可 pass 的模式中雙方都 pass 時結束；最後依控制 site 數量決定勝負。',
                        'Export 也會保留 operator label、topology、lattice、move history 與 time/noise event，方便之後研究。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        'X、Y、Z 是 Pauli operator。H 與 S 是 Clifford transform，會改變 label 但保留 Pauli commutation 結構。',
                        'Twisted seam 與 wrap board 會改變局部 ray 的接觸，所以同一套規則在 flat、torus、Klein、RP2、S2、R3 或 4D graph 上會有不同表現。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '用 observables 比較 Pauli distribution、symplectic conflict、phase/sign display、noise response 與 topology transport。',
                        '需要可重現的 operator spreading 樣本時，使用 seeded noise 與 time evolution 在不同 geometry 間比較。'
                    ]
                }
            ]
        }
    },
    'physical-clifford': {
        en: {
            title: 'Stabilizer / Pauli-Frame Recovery Guide',
            subtitle: 'A stabilizer recovery game for defects, syndrome checks, ancillas, measurements, and logical-sector tracking.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'Treat the board as a damaged quantum memory. Your job is to place or apply local Pauli-frame actions so defects shrink instead of spreading.',
                        'Black and White are positive and negative sectors. Empty sites are identity I unless the initial state or Custom Setup changes them.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'Choose a physical action: apply a Pauli recovery operator, prepare an ancilla, entangle by CNOT or CZ, measure, discard, or apply a phase action.',
                        'In Custom Setup, click sites to set I/X/Y/Z and sign first, then press Start to begin recovery from the designed board.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'For recovery play, success means lowering syndrome defects and returning toward the intended stabilizer vacuum or logical sector.',
                        'For board-game counting, use the normal ownership count, but the export records the physical answer as recovery state, logical error, and final sector.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'The mode models stabilizer bookkeeping: local Pauli operators, signs, phases, syndrome checks, ancilla operations, and seeded measurement errors.',
                        'Logical-cycle parity and global parity show whether local repair accidentally moved the memory into a different logical sector.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Use the syndrome weight, commutation conflicts, logical sector, recovery time, measurement errors, and non-Clifford resource markers as the primary observables.',
                        'Export the QEC log to compare recovery policies across topology, lattice, error rate, and prepared-circuit starts.'
                    ]
                }
            ]
        },
        zh: {
            title: 'Stabilizer / Pauli-Frame Recovery 指南',
            subtitle: '用 defect、syndrome check、ancilla、measurement 與 logical-sector tracking 組成的 stabilizer recovery 遊戲。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        '把棋盤看成受損的 quantum memory。你的目標是放置或套用局部 Pauli-frame action，讓 defect 減少而不是擴散。',
                        '黑白代表 positive 與 negative sector。空 site 預設是 identity I，除非 initial state 或 Custom Setup 改變它。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        '選一個 physical action：apply Pauli recovery operator、prepare ancilla、用 CNOT 或 CZ entangle、measure、discard，或 apply phase action。',
                        'Custom Setup 中先點 site 設定 I/X/Y/Z 與正負號，再按 Start 從設計好的棋盤開始 recovery。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        'Recovery play 的成功是降低 syndrome defect，並讓棋盤回到預期的 stabilizer vacuum 或 logical sector。',
                        '若以 board-game count 結束，仍可看 ownership；但 export 會把 physical answer 記成 recovery state、logical error 與 final sector。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        '此模式做 stabilizer bookkeeping：local Pauli operator、sign、phase、syndrome check、ancilla operation 與 seeded measurement error。',
                        'Logical-cycle parity 與 global parity 顯示局部修復是否不小心把 memory 推到不同 logical sector。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '主要觀察 syndrome weight、commutation conflict、logical sector、recovery time、measurement error 與 non-Clifford resource marker。',
                        '匯出 QEC log，可比較不同 topology、lattice、error rate 與 prepared-circuit start 下的 recovery policy。'
                    ]
                }
            ]
        }
    },
    'physical-cluster-go': {
        en: {
            title: 'Physical Cluster Field Guide',
            subtitle: 'A Go-like growth and capture lab for species competition, percolation, extinction, and topology-wrapping clusters.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'Black is species A and White is species B. Empty sites are resources or open growth sites.',
                        'You try to grow connected clusters, keep them supplied by neighboring empty contacts, and prevent the opponent from percolating through the board.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'Click an empty legal site to place a species, or choose a growth action to expand a connected cluster into a neighboring resource site.',
                        'A connected cluster with zero open contacts can be removed as local extinction, annihilation, or confinement depending on the model.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'The practical winner is the species that survives, occupies more area, or forms the stronger topology-wrapping/percolating cluster.',
                        'Export reports survival or extinction time, largest cluster, wrapping count, and a percolation answer.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'The same rule can represent percolation clusters, reaction-diffusion domains, two-species competition, exciton/hole recombination, or spin-domain growth.',
                        'Topology changes the neighbor graph, so a cluster that dies on an open board may wrap and survive on a torus or Klein-style board.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Track cluster-size distribution, largest cluster, interface length, correlation-length estimate, survival probability, and topology-wrapping count.',
                        'Use random density and thermal samples to compare repeatable growth statistics across lattice choices.'
                    ]
                }
            ]
        },
        zh: {
            title: 'Physical Cluster Field 指南',
            subtitle: '類 Go 的 growth/capture Lab，用來觀察 species competition、percolation、extinction 與 topology-wrapping cluster。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        '黑方是 species A，白方是 species B。空 site 是 resource 或可生長位置。',
                        '你要擴張 connected cluster，讓它保有鄰近空接觸，並阻止對方形成穿過棋盤的 percolating cluster。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        '點合法空 site 放置 species，或選 growth action，把 connected cluster 擴張到相鄰 resource site。',
                        '若 connected cluster 沒有 open contact，會依模型被視為 local extinction、annihilation 或 confinement 而移除。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        '實際勝方是能存活、佔更多面積，或形成較強 topology-wrapping/percolating cluster 的 species。',
                        'Export 會報告 survival/extinction time、largest cluster、wrapping count 與 percolation answer。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        '同一套規則可解讀為 percolation cluster、reaction-diffusion domain、two-species competition、exciton/hole recombination 或 spin-domain growth。',
                        'Topology 會改變 neighbor graph，因此在 open board 死掉的 cluster，可能在 torus 或 Klein-style board 上包回並存活。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '觀察 cluster-size distribution、largest cluster、interface length、correlation-length estimate、survival probability 與 topology-wrapping count。',
                        '用 random density 與 thermal sample 比較不同 lattice 下可重現的 growth statistics。'
                    ]
                }
            ]
        }
    },
    'ising-domain': {
        en: {
            title: 'Spin & Phase Domain Guide',
            subtitle: 'A spin-domain game for local flips, domain-wall motion, magnetization, energy, and coarsening on topology graphs.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'Black is spin up s=+1 and White is spin down s=-1. Your moves reshape domains of matching spins.',
                        'Try to make your spin phase stable, reduce bad interfaces, or create a persistent topology-winding wall.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'Use the action selector to place or flip one spin, flip a connected domain, rewrite a line interval, pass, or try Metropolis temperature updates.',
                        'A legal action is judged by graph neighbors, not by a flat-square assumption, so twisted and wrapped boards can change domain contact.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'The readable game result is whether up spins, down spins, or a mixed/walled phase dominates at the end.',
                        'The export summarizes ordered, mixed, stable-wall, or topology-winding outcomes.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'The board estimates Ising-like energy, magnetization, domain-wall length, and accepted or rejected thermal moves.',
                        'Topology can stabilize walls that would collapse on a simple open board.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Compare energy, magnetization, wall density, domain count, and coarsening events across topology, lattice, temperature, and seeds.',
                        'Use the same initial state on different graphs to see whether topology or local lattice degree controls the phase outcome.'
                    ]
                }
            ]
        },
        zh: {
            title: 'Spin & Phase Domain 指南',
            subtitle: '在 topology graph 上用 local flip、domain-wall motion、magnetization、energy 與 coarsening 組成的 spin-domain 遊戲。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        '黑方是 spin up s=+1，白方是 spin down s=-1。你的走法會改變相同 spin 形成的 domain。',
                        '目標是讓自己的 spin phase 穩定、減少不利 interface，或創造持續存在的 topology-winding wall。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        '用 action selector 選 place/flip one spin、flip connected domain、rewrite line interval、pass，或嘗試 Metropolis temperature update。',
                        '合法 action 依 graph neighbor 判斷，不假設平面方格；twisted 或 wrapped board 會改變 domain contact。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        '直觀結果是結束時 up spin、down spin，或 mixed/walled phase 哪一種佔優勢。',
                        'Export 會總結 ordered、mixed、stable-wall 或 topology-winding outcome。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        '棋盤估計 Ising-like energy、magnetization、domain-wall length，以及 thermal move 的 accepted/rejected 狀態。',
                        'Topology 可能穩定在普通 open board 上會消失的 wall。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '比較不同 topology、lattice、temperature 與 seed 下的 energy、magnetization、wall density、domain count 與 coarsening event。',
                        '在不同 graph 上使用相同 initial state，可觀察 phase outcome 主要受 topology 還是 local lattice degree 控制。'
                    ]
                }
            ]
        }
    },
    'two-phase': {
        en: {
            title: 'Two-Phase Competition Guide',
            subtitle: 'A phase-invasion game for nucleation, growth, interface cost, metastability, and wrapped domains.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'Black is phase A, White is phase B, and empty sites are metastable substrate.',
                        'You try to nucleate, grow, and protect your phase while pushing or pinning the interface against the other phase.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'Auto mode chooses a reasonable nucleate, grow, or flip-interface action. Manual actions let you force one of those move types.',
                        'A phase grows from neighboring same-phase sites. Interface flips depend on the local graph contacts and energy setting.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'The winner is the phase with stronger final area, stable interface control, or a noncontractible wrapped region.',
                        'Export reports the winning phase, interface stability, area fractions, nucleation count, and wrapping status.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'This is a toy model for nucleation, coarsening, pinning, droplet noise, and phase separation.',
                        'Different lattices change local interface cost; different topologies change whether an invading phase can trap or wrap.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Compare energy, interface length, domain count, coarsening events, area fraction, and wrapped-interface observables.',
                        'Use metastable empty or droplet starts to test sensitivity to nucleation seeds.'
                    ]
                }
            ]
        },
        zh: {
            title: 'Two-Phase Competition 指南',
            subtitle: '用 nucleation、growth、interface cost、metastability 與 wrapped domain 組成的 phase-invasion 遊戲。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        '黑方是 phase A，白方是 phase B，空 site 是 metastable substrate。',
                        '你要 nucleate、grow 並保護自己的 phase，同時推動或釘住和對方 phase 之間的 interface。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        'Auto mode 會選合理的 nucleate、grow 或 flip-interface action。Manual action 可指定其中一種走法。',
                        'Phase 會從相鄰 same-phase site 生長。Interface flip 取決於 local graph contact 與 energy setting。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        '勝方是 final area 較大、interface control 較穩，或形成 noncontractible wrapped region 的 phase。',
                        'Export 會報告 winning phase、interface stability、area fraction、nucleation count 與 wrapping status。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        '這是 nucleation、coarsening、pinning、droplet noise 與 phase separation 的 toy model。',
                        '不同 lattice 會改變 local interface cost；不同 topology 會改變入侵 phase 是否能被困住或包回。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '比較 energy、interface length、domain count、coarsening event、area fraction 與 wrapped-interface observable。',
                        '用 metastable empty 或 droplet start 測試對 nucleation seed 的敏感度。'
                    ]
                }
            ]
        }
    },
    'physical-jump-particles': {
        en: {
            title: 'Particle Hopping / Reaction Guide',
            subtitle: 'A Jump-style particle lab for hops, exchanges, scattering chains, recombination, path parity, and reaction outcomes.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'Black and White are two particle species or charge signs. Empty vertices are available sites.',
                        'You move particles through the graph, set up exchanges, and recombine opposite charges when that improves your reaction state.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'Hop Adjacent moves one particle to a neighboring empty vertex. Exchange Across Particle jumps over an occupied neighbor into the next reachable empty vertex.',
                        'Multi-step Scattering follows a legal chain, Recombine Opposite removes or neutralizes adjacent opposite charges, and Measure Path Parity records the path sector.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'A practical win means producing the better final reaction state: recombined charges, separated charges, persistent scattering path, or favorable parity sector.',
                        'The export states whether recombination, separation, scattering, or parity change dominated the result.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'This mode maps Jump-like local movement to hopping particles, exchange scattering, and reaction-diffusion contact.',
                        'Topology changes which particles are locally reachable and whether paths can wrap before recombination.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Use particle count, recombination count, exchange events, path length, braid-like parity, and recovered energy to compare reaction models.',
                        'Run the same seed on different topologies to identify whether scattering is geometry-driven or rule-driven.'
                    ]
                }
            ]
        },
        zh: {
            title: 'Particle Hopping / Reaction 指南',
            subtitle: '把 Jump-style movement 轉成 hop、exchange、scattering chain、recombination、path parity 與 reaction outcome 的粒子 Lab。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        '黑白代表兩種 particle species 或 charge sign。空 vertex 是可用位置。',
                        '你要讓粒子沿 graph 移動、設置 exchange，並在有利時讓 opposite charge recombine。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        'Hop Adjacent 讓粒子移到相鄰空 vertex。Exchange Across Particle 會跳過相鄰 occupied particle，到下一個可達空 vertex。',
                        'Multi-step Scattering 走合法連鎖；Recombine Opposite 移除或中和相鄰 opposite charge；Measure Path Parity 記錄 path sector。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        '實際勝利是得到較好的 final reaction state：recombined charge、separated charge、persistent scattering path 或有利 parity sector。',
                        'Export 會說明 recombination、separation、scattering 或 parity change 哪一種主導結果。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        '此模式把 Jump-like local movement 對應到 hopping particle、exchange scattering 與 reaction-diffusion contact。',
                        'Topology 會改變哪些粒子局部可達，以及 path 是否能在 recombination 前包回。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '用 particle count、recombination count、exchange event、path length、braid-like parity 與 recovered energy 比較 reaction model。',
                        '在不同 topology 上跑同一 seed，可判斷 scattering 主要由 geometry 還是 rule 驅動。'
                    ]
                }
            ]
        }
    },
    'spin-ice': {
        en: {
            title: 'Spin Ice Vertex Guide',
            subtitle: 'An edge-arrow game for ice-rule defects, monopoles, strings, loops, winding, and vacuum recovery.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'The pieces live on graph edges. Black arrows follow the chosen edge orientation; White arrows point opposite.',
                        'Try to reduce ice-rule violations, move monopoles together, or create controlled strings and closed loops.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'You can flip one arrow, flip a connected string, flip a closed loop, move a monopole along an edge path, annihilate a monopole pair, or pass.',
                        'Closed loops often preserve local constraints, while open strings can leave monopole defects at their endpoints.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'The clearest success is returning to an ice-rule vacuum or ending with fewer defects and lower energy than the opponent.',
                        'Export reports monopole sector, string/loop sector, winding, energy trend, and vacuum recovery status.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'Spin Ice represents constrained edge variables where local vertex rules create emergent monopole-like defects.',
                        'Noncontractible loops may exist on wrapped spaces and can carry winding information even when local defects vanish.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Track energy, ice-rule violations, monopole count, string length, loop count, loop winding, and defect density.',
                        'Compare loop sectors across torus, Klein, Mobius, RP2, sphere, R3, and 4D graphs.'
                    ]
                }
            ]
        },
        zh: {
            title: 'Spin Ice Vertex 指南',
            subtitle: '把 edge-arrow、ice-rule defect、monopole、string、loop、winding 與 vacuum recovery 放在一起的遊戲。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        '棋子活在 graph edge 上。黑箭頭沿選定 edge orientation，白箭頭則反向。',
                        '目標是減少 ice-rule violation、讓 monopole 互相靠近，或創造可控制的 string 與 closed loop。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        '你可以 flip one arrow、flip connected string、flip closed loop、沿 edge path move monopole、annihilate monopole pair，或 pass。',
                        'Closed loop 通常保留 local constraint；open string 可能在端點留下 monopole defect。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        '最清楚的成功是回到 ice-rule vacuum，或結束時 defect 更少、energy 更低。',
                        'Export 會報告 monopole sector、string/loop sector、winding、energy trend 與 vacuum recovery status。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        'Spin Ice 是受限 edge variable；local vertex rule 會產生 emergent monopole-like defect。',
                        'Wrapped space 上可能存在 noncontractible loop，即使 local defect 消失，仍可攜帶 winding information。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '觀察 energy、ice-rule violation、monopole count、string length、loop count、loop winding 與 defect density。',
                        '比較 torus、Klein、Mobius、RP2、sphere、R3 與 4D graph 上的 loop sector。'
                    ]
                }
            ]
        }
    },
    'z2-gauge': {
        en: {
            title: 'Z2 Gauge Loop Guide',
            subtitle: 'An edge-field memory game for star checks, plaquette flux, loop updates, Wilson loops, and decoder repair.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'Edges carry Z2 values Ue=+1 or Ue=-1. Your moves flip edges, paths, or loops to create or repair charge and flux defects.',
                        'Try to keep the gauge state in the vacuum sector or repair it before a logical loop error survives.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'Flip One Edge changes one edge. Flip Connected Path creates or moves endpoint charges. Flip Closed Loop changes a loop sector while preserving local endpoints.',
                        'Measure Star Check and Measure Plaquette Check reveal local violations. Noisy Edge Flip and the decoder let you test recovery.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'Success means no unrepaired charge or flux defects and no unwanted logical loop error at the end.',
                        'Export reports vacuum sector, logical sector, Wilson-loop values, decoder actions, and memory status.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'Z2 Gauge models discrete gauge fields on edges. Star checks test charge-like violations, and plaquette checks test flux-like violations.',
                        'Noncontractible closed loops can change logical memory without leaving local defects.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Track syndrome weight, star violations, plaquette flux, logical sector, Wilson-loop values, decoder moves, and memory lifetime.',
                        'Use noisy starts and logical-loop errors to compare decoder behavior on different topologies.'
                    ]
                }
            ]
        },
        zh: {
            title: 'Z2 Gauge Loop 指南',
            subtitle: '用 edge-field memory、star check、plaquette flux、loop update、Wilson loop 與 decoder repair 組成的遊戲。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        'Edge 帶有 Z2 value Ue=+1 或 Ue=-1。你可以翻轉 edge、path 或 loop，來製造或修復 charge/flux defect。',
                        '目標是讓 gauge state 保持 vacuum sector，或在 logical loop error 存活前把它修復。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        'Flip One Edge 改變單一 edge。Flip Connected Path 會創造或移動 endpoint charge。Flip Closed Loop 可改變 loop sector 且保留局部端點限制。',
                        'Measure Star Check 與 Measure Plaquette Check 顯示 local violation。Noisy Edge Flip 與 decoder 可測試 recovery。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        '成功是結束時沒有未修復的 charge/flux defect，也沒有不想要的 logical loop error。',
                        'Export 會報告 vacuum sector、logical sector、Wilson-loop value、decoder action 與 memory status。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        'Z2 Gauge 在 edge 上模擬 discrete gauge field。Star check 測 charge-like violation，plaquette check 測 flux-like violation。',
                        'Noncontractible closed loop 可以在不留下 local defect 的情況下改變 logical memory。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '觀察 syndrome weight、star violation、plaquette flux、logical sector、Wilson-loop value、decoder move 與 memory lifetime。',
                        '用 noisy start 與 logical-loop error 比較不同 topology 上的 decoder behavior。'
                    ]
                }
            ]
        }
    },
    'cft-reversi': {
        en: {
            title: 'CFT Local OPE Operators Guide',
            subtitle: 'A local CFT board game for primary insertions, OPE channels, domain signs, Virasoro actions, and graph entropy estimates.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'Black and White are source signs or player control for primary/domain insertions on a graph.',
                        'You place primary fields and use local OPE updates to reorganize nearby signs, channels, and domain walls.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'Click a legal site to insert a primary or domain field. This local-OPE mode does not require an ordinary Reversi bracket.',
                        'Use actions such as L_-1, L0, L1, L_-2, L2, or Measure when enabled. Measurements can reveal OPE channel, interval parity, block, entropy, or stress estimates.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'A playable result is the side or sign with the stronger stable domain, plus the dominant final OPE or CFT sector.',
                        'Export summarizes dominant channel, domain-wall length, entropy growth, anomaly count, and final CFT sector.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'Primary fields, OPE rules, and Virasoro-style actions are represented as discrete graph estimators for play and comparison.',
                        'Ising CFT is the default model; the values are not exact continuum CFT calculations.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Track primary counts, OPE channel transitions, conformalBlockWeights, dominant block, interval entropy estimate, stress proxy, and anomaly events.',
                        'Use topology changes to test how graph contacts alter local OPE propagation and domain-wall stability.'
                    ]
                }
            ]
        },
        zh: {
            title: 'CFT Local OPE Operators 指南',
            subtitle: '在 graph 上操作 primary insertion、OPE channel、domain sign、Virasoro action 與 graph entropy estimate 的 local CFT 遊戲。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        '黑白代表 source sign 或玩家對 primary/domain insertion 的控制。',
                        '你要放置 primary field，並利用 local OPE update 重組附近 sign、channel 與 domain wall。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        '點合法 site 插入 primary 或 domain field。這個 local-OPE 模式不需要普通 Reversi bracket。',
                        '可用 action 包含啟用時的 L_-1、L0、L1、L_-2、L2 或 Measure。Measurement 可顯示 OPE channel、interval parity、block、entropy 或 stress estimate。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        '可玩的結果是比較哪一方或 sign 擁有較穩定 domain，以及最後主導的 OPE/CFT sector。',
                        'Export 會總結 dominant channel、domain-wall length、entropy growth、anomaly count 與 final CFT sector。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        'Primary field、OPE rule 與 Virasoro-style action 以 discrete graph estimator 表示，供遊戲與比較使用。',
                        '預設模型是 Ising CFT；這些數值不是精確 continuum CFT calculation。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '觀察 primary count、OPE channel transition、conformalBlockWeights、dominant block、interval entropy estimate、stress proxy 與 anomaly event。',
                        '改變 topology 測試 graph contact 如何改變 local OPE propagation 與 domain-wall stability。'
                    ]
                }
            ]
        }
    },
    anyon: {
        en: {
            title: 'Anyon Fusion & Braiding Guide',
            subtitle: 'A topological memory game for anyon creation, hopping, braiding, unbraiding, fusion, energy, and logical sectors.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'You control mobile anyons on the topology graph. The main skills are moving, braiding, unbraiding, and fusing charges back to a useful sector.',
                        'In Excitation Energy mode, spend energy to create an anyon and recover energy by recombination or vacuum fusion.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'A token can hop to an adjacent empty vertex or exchange across a neighboring token into the next empty vertex when the graph allows it.',
                        'Braiding records a word or phase. Unbraiding must follow the reverse inverse sequence; a wrong target adds a new braid instead of removing memory.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'For memory play, success means the intended logical sector remains alive and nontrivial charges fuse back to vacuum when desired.',
                        'For energy play, success means using creation, movement, recombination, and fusion more efficiently than the opponent.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'Toric Code, Ising, Fibonacci, and Z_n models define different charge labels and fusion rules.',
                        'Non-Abelian choices store hidden fusion-channel information; finite entanglement distance can decohere that channel when particles separate too far.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Track total fusion charge, logical sector, memory alive/lost, vacuum recovery, braid word length, unbraid success, energy history, and logical-error rate.',
                        'Use exact braid words and seeded noise to compare Abelian and non-Abelian memory behavior across topology.'
                    ]
                }
            ]
        },
        zh: {
            title: 'Anyon Fusion & Braiding 指南',
            subtitle: '用 anyon creation、hopping、braiding、unbraiding、fusion、energy 與 logical sector 組成的 topological memory 遊戲。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        '你在 topology graph 上控制可移動的 anyon。主要技巧是移動、braiding、unbraiding，並把 charge fusion 回有用 sector。',
                        'Excitation Energy 模式中，花 energy 創造 anyon，並透過 recombination 或 vacuum fusion 回收 energy。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        'Token 可 hop 到相鄰空 vertex；若 graph 允許，也可 exchange across 相鄰 token 到下一個空 vertex。',
                        'Braiding 會記錄 word 或 phase。Unbraiding 必須依反向 inverse sequence；點錯 target 會新增 braid，而不是清除 memory。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        'Memory play 的成功是 intended logical sector 仍存活，且 nontrivial charge 能在需要時 fusion 回 vacuum。',
                        'Energy play 的成功是比對手更有效率地使用 creation、movement、recombination 與 fusion。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        'Toric Code、Ising、Fibonacci 與 Z_n model 定義不同 charge label 與 fusion rule。',
                        'Non-Abelian 選項會保存 hidden fusion-channel information；finite entanglement distance 會在粒子分太遠時讓 channel decohere。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '觀察 total fusion charge、logical sector、memory alive/lost、vacuum recovery、braid word length、unbraid success、energy history 與 logical-error rate。',
                        '用 exact braid word 與 seeded noise 比較 Abelian 與 non-Abelian memory 在不同 topology 上的表現。'
                    ]
                }
            ]
        }
    },
    virasoro: {
        en: {
            title: 'Virasoro / CFT Field Insertion Guide',
            subtitle: 'A graph-CFT lab for primary fields, OPE contacts, Virasoro actions, block estimates, entropy, stress, and anomaly markers.',
            sections: [
                {
                    heading: 'For players',
                    items: [
                        'The board is a graph surface. Empty sites are identity operators; placed stones are primary-field insertions controlled by Black or White.',
                        'Try to arrange insertions so your source sign, OPE sector, or conformal block becomes dominant.'
                    ]
                },
                {
                    heading: 'Rules and moves',
                    items: [
                        'Insert Field places a primary at a legal site. L_-1, L0, and L1 shift, rescale, or focus local fields. N=2 also enables L_-2 and L2 toy actions.',
                        'Measure actions estimate two-point or four-point correlators, OPE channel, dominant block, region entropy, or stress proxy.'
                    ]
                },
                {
                    heading: 'Win or finish',
                    items: [
                        'The game result is the final dominant block or OPE sector, plus which side keeps stronger source/domain control.',
                        'Export records identity/vacuum block dominance, entropy growth, strongest correlations, final OPE sector, and anomaly count.'
                    ]
                },
                {
                    heading: 'Physics idea',
                    items: [
                        'This mode discretizes CFT ideas on a graph, using Ising CFT by default and Free Boson as an alternate estimator.',
                        'Virasoro actions are playable graph updates, not exact continuum Virasoro algebra computation.'
                    ]
                },
                {
                    heading: 'For researchers',
                    items: [
                        'Track primary counts, OPE channel distribution, two-point estimates, cross-ratio, conformalBlockWeights, stress proxy, entropy, mutual information, and anomaly events.',
                        'Use the same initial insertion set across topologies to compare contact graph effects on block dominance.'
                    ]
                }
            ]
        },
        zh: {
            title: 'Virasoro / CFT Field Insertion 指南',
            subtitle: '用 primary field、OPE contact、Virasoro action、block estimate、entropy、stress 與 anomaly marker 組成的 graph-CFT Lab。',
            sections: [
                {
                    heading: '給玩家',
                    items: [
                        '棋盤是一個 graph surface。空 site 是 identity operator；放上的 stone 是由黑白控制的 primary-field insertion。',
                        '你的目標是安排 insertion，讓自己的 source sign、OPE sector 或 conformal block 成為主導。'
                    ]
                },
                {
                    heading: '規則與走法',
                    items: [
                        'Insert Field 在合法 site 放 primary。L_-1、L0、L1 會 shift、rescale 或 focus local field。N=2 也會啟用 L_-2 與 L2 toy action。',
                        'Measure action 可估計 two-point 或 four-point correlator、OPE channel、dominant block、region entropy 或 stress proxy。'
                    ]
                },
                {
                    heading: '勝利或結束',
                    items: [
                        '遊戲結果看 final dominant block 或 OPE sector，以及哪一方保有較強 source/domain control。',
                        'Export 會記錄 identity/vacuum block dominance、entropy growth、strongest correlation、final OPE sector 與 anomaly count。'
                    ]
                },
                {
                    heading: '物理意義',
                    items: [
                        '此模式把 CFT idea 離散化到 graph 上，預設使用 Ising CFT，也可用 Free Boson 作 alternate estimator。',
                        'Virasoro action 是可玩的 graph update，不是精確 continuum Virasoro algebra computation。'
                    ]
                },
                {
                    heading: '給研究者',
                    items: [
                        '觀察 primary count、OPE channel distribution、two-point estimate、cross-ratio、conformalBlockWeights、stress proxy、entropy、mutual information 與 anomaly event。',
                        '在不同 topology 上使用相同 initial insertion set，比較 contact graph 對 block dominance 的影響。'
                    ]
                }
            ]
        }
    }
});
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
let activeRulesMode = 'clifford';
let labObservableTimeline = [];
let labObservableTimelineMode = '';
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

function labGuideLanguage() {
    const queryLanguage = new URLSearchParams(window.location.search).get('lang');
    const savedLanguage = localStorage.getItem('topological-boardgame:language')
        || localStorage.getItem('topoboardgame-language')
        || localStorage.getItem('topoboardgame.lang')
        || '';
    const language = queryLanguage || savedLanguage || document.documentElement.lang || navigator.language || 'en';
    return String(language).toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function labGuideLabel(rulesMode = activeRulesMode) {
    const language = labGuideLanguage();
    const labels = LAB_GUIDE_LABELS[rulesMode] || LAB_GUIDE_LABELS.clifford;
    return labels[language] || labels.en;
}

function appendLabGuideList(parent, items = []) {
    const list = document.createElement('ul');
    for (const text of items) {
        const item = document.createElement('li');
        item.textContent = text;
        list.append(item);
    }
    parent.append(list);
}

function renderLabGuideBook(rulesMode = activeRulesMode) {
    activeRulesMode = rulesMode || 'clifford';
    const section = (els.rulesSections || []).find((entry) => entry.dataset.rulesMode === activeRulesMode);
    if (!section) return;
    const language = labGuideLanguage();
    const source = LAB_GUIDE_BOOKS[activeRulesMode] || LAB_GUIDE_BOOKS.clifford;
    const book = source[language] || source.en;
    const shared = LAB_SHARED_DEVICE_GUIDE[language] || LAB_SHARED_DEVICE_GUIDE.en;
    const modeHeading = section.querySelector('h2');
    if (modeHeading) {
        modeHeading.dataset.noLocalize = 'true';
        modeHeading.textContent = book.title;
        modeHeading.hidden = false;
    }
    let guide = [...section.children].find((child) => child.classList?.contains('lab-guide-book'));
    if (!guide) {
        guide = document.createElement('section');
        guide.className = 'lab-guide-book';
        guide.dataset.noLocalize = 'true';
        guide.setAttribute('aria-label', book.title);
        if (modeHeading) modeHeading.insertAdjacentElement('afterend', guide);
        else section.prepend(guide);
    }
    for (const child of [...section.children]) {
        child.hidden = child !== guide && child !== modeHeading;
    }
    guide.setAttribute('aria-label', book.title);
    guide.replaceChildren();

    const headerLabel = els.rulesIntroPanel?.querySelector('.rules-intro-header span');
    if (headerLabel) {
        headerLabel.dataset.noLocalize = 'true';
        headerLabel.textContent = language === 'zh' ? '指南書' : 'Guide Book';
    }
    if (els.rulesIntroCloseButton) {
        els.rulesIntroCloseButton.dataset.noLocalize = 'true';
        els.rulesIntroCloseButton.textContent = language === 'zh' ? '關閉' : 'Cancel';
        els.rulesIntroCloseButton.setAttribute('aria-label', language === 'zh' ? '關閉指南書' : 'Close guide book');
    }

    const header = document.createElement('div');
    header.className = 'lab-guide-book-header';
    const kicker = document.createElement('span');
    kicker.textContent = language === 'zh' ? '模式指南' : 'Mode Guide';
    const title = document.createElement('h3');
    title.textContent = book.title;
    const subtitle = document.createElement('div');
    subtitle.className = 'lab-guide-book-subtitle';
    subtitle.textContent = book.subtitle;
    header.append(kicker, title, subtitle);
    guide.append(header);

    const grid = document.createElement('div');
    grid.className = 'lab-guide-book-grid';
    const allSections = [...(book.sections || []), shared];
    for (const entry of allSections) {
        const card = document.createElement('article');
        card.className = 'lab-guide-card';
        const heading = document.createElement('h4');
        heading.textContent = entry.heading;
        card.append(heading);
        appendLabGuideList(card, entry.items);
        grid.append(card);
    }
    guide.append(grid);

    const actions = document.createElement('div');
    actions.className = 'lab-guide-actions';
    const mode = selectedMode();
    const languageQuery = `lang=${encodeURIComponent(language)}`;
    const modelQuery = `model=${encodeURIComponent(mode)}`;
    const builderLink = document.createElement('a');
    builderLink.href = `../labs/experiments/?${modelQuery}&${languageQuery}`;
    builderLink.textContent = language === 'zh' ? '打開實驗建構器' : 'Open Experiment Builder';
    const compareLink = document.createElement('a');
    compareLink.href = `../labs/experiments/?mode=compare-topologies&${modelQuery}&${languageQuery}`;
    compareLink.textContent = language === 'zh' ? '比較拓撲' : 'Compare Topologies';
    const note = document.createElement('p');
    note.textContent = language === 'zh'
        ? '用相同種子在多個拓撲上重跑此模型，並匯出可重現資料集。'
        : 'Rerun this model across topologies with stored seeds and export reproducible datasets.';
    actions.append(builderLink, compareLink, note);
    guide.append(actions);
}

function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    return `{${Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
        .join(',')}}`;
}

function labHash(value, prefix = 'lab') {
    const text = typeof value === 'string' ? value : stableStringify(value);
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return `${prefix}:${hash.toString(16).padStart(8, '0')}`;
}

function resolvedLabMetadata(mode = selectedMode()) {
    const direct = LAB_MODEL_METADATA[mode] || LAB_MODEL_METADATA[baseMode(mode)] || LAB_MODEL_METADATA.clifford_reversi;
    if (!direct.extends) return direct;
    return {
        ...resolvedLabMetadata(direct.extends),
        ...direct,
        stateSpace: {
            ...resolvedLabMetadata(direct.extends).stateSpace,
            ...(direct.stateSpace || {})
        },
        rule: {
            ...resolvedLabMetadata(direct.extends).rule,
            ...(direct.rule || {})
        },
        observables: direct.observables || resolvedLabMetadata(direct.extends).observables
    };
}

function currentLabLanguage() {
    return document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function updateResearchBuilderLink() {
    if (!els.labResearchBuilderLink) return;
    const url = new URL('../labs/experiments/', window.location.href);
    url.searchParams.set('lang', currentLabLanguage());
    els.labResearchBuilderLink.href = url.href;
}

function labLocalized(value) {
    if (!value || typeof value !== 'object') return String(value ?? '');
    return value[currentLabLanguage()] || value.en || Object.values(value)[0] || '';
}

function resolvedLabScience(mode = selectedMode()) {
    const profileId = LAB_SCIENCE_PROFILE_BY_MODE[mode]
        || LAB_SCIENCE_PROFILE_BY_MODE[baseModeForPhysicalVariant(mode)]
        || 'pauli_transport';
    return LAB_SCIENCE_PROFILES[profileId];
}

function renderLabScienceIntroduction(mode = selectedMode()) {
    const science = resolvedLabScience(mode);
    if (!science) return;
    const profileId = LAB_SCIENCE_PROFILE_BY_MODE[mode]
        || LAB_SCIENCE_PROFILE_BY_MODE[baseModeForPhysicalVariant(mode)]
        || 'pauli_transport';
    const bindings = [
        [els.labScienceScopeBadge, science.scope],
        [els.labScienceSystem, science.system],
        [els.labScienceObjective, LAB_RESEARCH_OBJECTIVES[profileId]],
        [els.labScienceModel, science.model],
        [els.labScienceHamiltonian, science.hamiltonian],
        [els.labScienceEvolution, science.evolution],
        [els.labSciencePartition, science.partition],
        [els.labScienceMeasurements, science.measurements],
        [els.labScienceImplementation, science.implementation],
        [els.labScienceBoundary, science.boundary]
    ];
    for (const [element, value] of bindings) {
        if (element) element.textContent = labLocalized(value);
    }
    if (els.labScienceReferences) {
        els.labScienceReferences.replaceChildren();
        for (const reference of science.references || []) {
            const link = document.createElement('a');
            link.href = reference.url;
            link.target = '_blank';
            link.rel = 'noreferrer';
            link.textContent = reference.label;
            els.labScienceReferences.append(link);
        }
    }
}

function observableProfileId(mode = selectedMode()) {
    return LAB_SCIENCE_PROFILE_BY_MODE[mode]
        || LAB_SCIENCE_PROFILE_BY_MODE[baseModeForPhysicalVariant(mode)]
        || 'pauli_transport';
}

function labObservableSource(mode = selectedMode()) {
    try {
        if (typeof game?.computePhysicalObservables === 'function') return game.computePhysicalObservables();
        if (typeof game?.computeCFTObservables === 'function') {
            const source = game.computeCFTObservables();
            return {
                ...source,
                anomalyCount: source.centralChargeAnomalyEvents?.length || 0
            };
        }
    } catch {
        // The live figure must not interrupt an interactive update.
    }
    const counts = typeof game?.counts === 'function' ? game.counts() : {};
    const source = {
        occupiedSites: Number(game?.board?.size || game?.tokens?.size || 0),
        sectorA: Number(counts.black || 0),
        sectorB: Number(counts.white || 0),
        eventCount: Number(game?.moveNumber || game?.history?.length || 0)
    };
    if (game?.tokens instanceof Map) {
        const braidStats = typeof game.braidStatistics === 'function' ? game.braidStatistics() : {};
        Object.assign(source, braidStats, {
            particleCount: game.tokens.size,
            sectorChanges: game.topologicalSectors?.length || 0
        });
    } else if (String(mode).includes('anyon') && game?.board instanceof Map) {
        const stones = [...game.board.values()];
        Object.assign(source, {
            particleCount: stones.length,
            totalBraids: stones.reduce((sum, stone) => sum + Number(stone.braidHistory?.length || 0), 0),
            averageBraidWordLength: stones.length
                ? stones.reduce((sum, stone) => sum + Number(stone.braidWord?.length || 0), 0) / stones.length
                : 0,
            sectorChanges: Number(game.moveNumber || 0)
        });
    }
    return source;
}

function numericObservableValue(source, key) {
    const value = source?.[key];
    if (typeof value === 'boolean') return value ? 1 : 0;
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function formatObservableValue(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '-';
    if (Math.abs(number) >= 1000 || (Math.abs(number) > 0 && Math.abs(number) < 0.001)) return number.toExponential(2);
    return Number(number.toFixed(4)).toString();
}

function drawLabObservableFigure(spec, points) {
    const canvas = els.labObservableCanvas;
    if (!canvas || !spec) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width || 960);
    const height = Math.max(300, rect.height || 420);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const context = canvas.getContext('2d');
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    const compact = width < 520;
    const margin = { left: compact ? 58 : 76, right: 24, top: 58, bottom: 66 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const values = points.map((point) => point.value);
    let min = values.length ? Math.min(...values) : 0;
    let max = values.length ? Math.max(...values) : 1;
    if (min === max) {
        const padding = Math.max(1, Math.abs(min) * 0.1);
        min -= padding;
        max += padding;
    }
    const range = max - min;
    const text = (value, x, y, options = {}) => {
        context.save();
        context.fillStyle = options.color || '#243b34';
        context.font = `${options.weight || 500} ${options.size || 12}px system-ui`;
        context.textAlign = options.align || 'left';
        context.textBaseline = options.baseline || 'alphabetic';
        if (options.rotate) {
            context.translate(x, y);
            context.rotate(options.rotate);
            context.fillText(value, 0, 0);
        } else context.fillText(value, x, y);
        context.restore();
    };
    text(labLocalized(spec.name), width / 2, 24, { size: compact ? 14 : 16, weight: 750, align: 'center' });
    text(`${labLocalized(spec.definition)} [${spec.units}]`, width / 2, 43, { color: '#52645e', size: compact ? 9 : 11, align: 'center' });
    for (let tick = 0; tick <= 4; tick++) {
        const y = margin.top + (plotHeight * tick) / 4;
        context.strokeStyle = '#d9e2df';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(margin.left, y);
        context.lineTo(margin.left + plotWidth, y);
        context.stroke();
        text(formatObservableValue(max - (range * tick) / 4), margin.left - 8, y + 4, { size: 10, align: 'right' });
    }
    context.strokeStyle = '#29423a';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(margin.left, margin.top);
    context.lineTo(margin.left, margin.top + plotHeight);
    context.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    context.stroke();
    const xFor = (index) => margin.left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
    const yFor = (value) => margin.top + plotHeight - ((value - min) / range) * plotHeight;
    if (points.length) {
        context.strokeStyle = '#287fa6';
        context.lineWidth = 3;
        context.beginPath();
        points.forEach((point, index) => {
            const x = xFor(index);
            const y = yFor(point.value);
            if (index) context.lineTo(x, y);
            else context.moveTo(x, y);
        });
        context.stroke();
        points.forEach((point, index) => {
            context.fillStyle = '#ffffff';
            context.strokeStyle = '#287fa6';
            context.lineWidth = 2;
            context.beginPath();
            context.arc(xFor(index), yFor(point.value), 4, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        });
        const stride = Math.max(1, Math.ceil(points.length / 6));
        points.forEach((point, index) => {
            if (index % stride && index !== points.length - 1) return;
            text(String(point.step), xFor(index), margin.top + plotHeight + 18, { size: 10, align: 'center' });
        });
    }
    const isZh = currentLabLanguage() === 'zh';
    text(isZh ? '離散實驗步驟' : 'Discrete experiment step', margin.left + plotWidth / 2, height - 19, {
        size: 12,
        weight: 700,
        align: 'center'
    });
    text(`${labLocalized(spec.name)} (${spec.units})`, 17, margin.top + plotHeight / 2, {
        size: 12,
        weight: 700,
        align: 'center',
        rotate: -Math.PI / 2
    });
}

function renderLabObservableMethods(mode = selectedMode()) {
    const profileId = observableProfileId(mode);
    const specs = LAB_OBSERVABLE_SPECS[profileId] || LAB_OBSERVABLE_SPECS.pauli_transport;
    if (!els.labObservableSpecGrid || !els.labObservableFigureSelect) return;
    if (labObservableTimelineMode !== mode) {
        labObservableTimelineMode = mode;
        labObservableTimeline = [];
    }
    if (els.labObservableFigureSelect.dataset.profile !== profileId) {
        els.labObservableFigureSelect.dataset.profile = profileId;
        els.labObservableFigureSelect.replaceChildren(...specs.map((spec) => new Option(labLocalized(spec.name), spec.id)));
    } else {
        [...els.labObservableFigureSelect.options].forEach((option, index) => {
            option.textContent = labLocalized(specs[index]?.name || option.textContent);
        });
    }
    const source = labObservableSource(mode);
    const step = Number(game?.moveNumber ?? game?.history?.length ?? 0);
    const sample = {
        step,
        values: Object.fromEntries(specs.map((spec) => [spec.id, numericObservableValue(source, spec.key)]))
    };
    const last = labObservableTimeline.at(-1);
    if (last?.step === step) labObservableTimeline[labObservableTimeline.length - 1] = sample;
    else labObservableTimeline.push(sample);
    if (labObservableTimeline.length > 200) labObservableTimeline.shift();
    els.labObservableSpecGrid.replaceChildren();
    for (const spec of specs) {
        const card = document.createElement('article');
        card.className = 'lab-observable-spec';
        const value = sample.values[spec.id];
        card.innerHTML = `
            <div><strong>${labLocalized(spec.name)}</strong><output>${formatObservableValue(value)} ${spec.units}</output></div>
            <p><b>${currentLabLanguage() === 'zh' ? '定義' : 'Definition'}:</b> ${labLocalized(spec.definition)}</p>
            <p><b>${currentLabLanguage() === 'zh' ? '意義' : 'Meaning'}:</b> ${labLocalized(spec.meaning)}</p>
        `;
        card.addEventListener('click', () => {
            els.labObservableFigureSelect.value = spec.id;
            renderLabObservableMethods(mode);
        });
        els.labObservableSpecGrid.append(card);
    }
    const selected = specs.find((spec) => spec.id === els.labObservableFigureSelect.value) || specs[0];
    const points = labObservableTimeline.map((entry) => ({ step: entry.step, value: entry.values[selected.id] }));
    drawLabObservableFigure(selected, points);
    if (els.labObservableFigureCaption) {
        els.labObservableFigureCaption.textContent = currentLabLanguage() === 'zh'
            ? `${labLocalized(selected.name)} 對離散實驗步驟的有限軌跡。每個點是該步驟後直接由目前組態計算的值；連線只供辨識趨勢。`
            : `${labLocalized(selected.name)} over discrete experiment steps. Each point is computed directly from the configuration after that step; connecting lines show trend only.`;
    }
}

function setLabSystemIntroductionOpen(open) {
    if (!els.labSystemIntroductionPanel || !els.labSystemIntroductionButton) return;
    els.labSystemIntroductionPanel.hidden = !open;
    els.labSystemIntroductionButton.setAttribute('aria-expanded', String(open));
    els.labSystemIntroductionButton.textContent = open
        ? (currentLabLanguage() === 'zh' ? '收合研究系統與方法' : 'Close Research System & Method')
        : (currentLabLanguage() === 'zh' ? '研究系統與方法' : 'Research System & Method');
    if (open) window.requestAnimationFrame(() => renderLabObservableMethods());
}

function selectedOptionText(select) {
    return select?.selectedOptions?.[0]?.textContent?.trim() || select?.value || 'Not configured';
}

function visibleValueText(element) {
    return element && !element.closest('[hidden]') && !element.hidden
        ? selectedOptionText(element.tagName === 'SELECT' ? element : element.querySelector?.('select, input'))
        : '';
}

function currentInitialConditionText(mode = selectedMode()) {
    if (isIsingDomainMode(mode)) return selectedOptionText(els.isingInitialStateSelect);
    if (isTwoPhaseCompetitionMode(mode)) return selectedOptionText(els.twoPhaseInitialStateSelect);
    if (isPhysicalClusterGoMode(mode)) return selectedOptionText(els.clusterInitialStateSelect);
    if (isSpinIceVertexMode(mode)) return selectedOptionText(els.spinIceInitialStateSelect);
    if (isZ2GaugeLoopMode(mode)) return selectedOptionText(els.z2GaugeInitialStateSelect);
    if (isPhysicalJumpParticlesMode(mode)) return selectedOptionText(els.jumpParticleModelSelect);
    if (isCFTMode(mode)) return selectedOptionText(els.cftInitialStateSelect);
    if (baseMode(mode) === 'clifford_reversi' && els.cliffordAlgebraSetSelect?.value === 'physical') {
        return selectedOptionText(els.physicalInitialStateSelect);
    }
    if (isJumpMode(mode)) return selectedOptionText(els.anyonSetupSelect) || 'Standard worldline seed';
    return 'Standard seeded configuration';
}

function currentActionText(mode = selectedMode()) {
    if (isIsingDomainMode(mode)) return selectedOptionText(els.isingActionSelect);
    if (isTwoPhaseCompetitionMode(mode)) return selectedOptionText(els.twoPhaseActionSelect);
    if (isPhysicalClusterGoMode(mode)) return selectedOptionText(els.clusterActionSelect);
    if (isSpinIceVertexMode(mode)) return selectedOptionText(els.spinIceActionSelect);
    if (isZ2GaugeLoopMode(mode)) return selectedOptionText(els.z2GaugeActionSelect);
    if (isPhysicalJumpParticlesMode(mode)) return selectedOptionText(els.jumpParticleActionSelect);
    if (isCFTMode(mode)) return selectedOptionText(els.cftActionSelect);
    if (baseMode(mode) === 'clifford_reversi' && els.cliffordAlgebraSetSelect?.value === 'physical') {
        return selectedOptionText(els.physicalActionSelect);
    }
    if (isJumpMode(mode)) return selectedOptionText(els.anyonActionSelect) || 'Move / braid';
    return selectedOptionText(els.transformSelect) || 'Local update';
}

function topologyIdentity() {
    const config = topologyConfig();
    const topology = game?.topology || {};
    const topologyName = topology.name || config.topology;
    const dimension = topology.dimensions || (config.topology === 'flat_4d_grid' ? 4 : config.topology === 'r3' ? 3 : 2);
    const boundaryMap = {
        flat: 'open',
        r3: 'open',
        cylinder: 'periodic x / open y',
        torus: 'periodic x,y',
        klein_bottle: 'periodic x / twisted y',
        mobius: 'twisted x / open y',
        rp2: 'projective edge identification',
        sphere_latitude: 'closed sphere with poles',
        random_boundary: 'fixed random boundary condition',
        flat_4d_grid: 'open 4D grid'
    };
    const data = {
        topology: topologyName,
        lattice: config.lattice,
        dimension,
        width: config.width,
        height: config.height,
        depth: config.depth,
        nw: config.nw,
        boundary: boundaryMap[topologyName] || boundaryMap[config.topology] || 'custom',
        seam: topology.seamSummary?.() || ''
    };
    return {
        ...data,
        hash: labHash(data, 'topology')
    };
}

function experimentParameters(mode = selectedMode()) {
    return {
        topology: topologyIdentity(),
        initialCondition: currentInitialConditionText(mode),
        action: currentActionText(mode),
        noise: selectedOptionText(els.noiseModeSelect),
        timeEvolution: selectedOptionText(els.timeUpdateSelect),
        seed: els.noiseSeedInput?.value || 'topology-seed',
        modelControls: {
            physicalProblem: selectedOptionText(els.physicalProblemSelect),
            algebraSet: selectedOptionText(els.cliffordAlgebraSetSelect),
            anyonModel: selectedOptionText(els.anyonModelSelect),
            cftModel: selectedOptionText(els.cftModelSelect)
        }
    };
}

function currentExperimentHash(mode = selectedMode()) {
    const metadata = resolvedLabMetadata(mode);
    return labHash({
        appVersion: LAB_APP_VERSION,
        mode,
        section: metadata.section,
        family: metadata.family,
        parameters: experimentParameters(mode)
    }, 'experiment');
}

function currentRuleHash(mode = selectedMode()) {
    const metadata = resolvedLabMetadata(mode);
    return labHash({
        mode,
        rule: metadata.rule,
        action: currentActionText(mode),
        noise: selectedOptionText(els.noiseModeSelect),
        time: selectedOptionText(els.timeUpdateSelect)
    }, 'rule');
}

function collectObservableSamples(mode = selectedMode()) {
    const metadata = resolvedLabMetadata(mode);
    const samples = [
        { id: 'active-sector-a', name: els.blackCountLabel?.textContent || 'Sector A', value: els.blackCount?.textContent || '0', units: 'count' },
        { id: 'active-sector-b', name: els.whiteCountLabel?.textContent || 'Sector B', value: els.whiteCount?.textContent || '0', units: 'count' }
    ];
    if (!els.blackBraidCard?.hidden) {
        samples.push(
            { id: 'braid-a', name: els.blackBraidLabel?.textContent || 'Braid A', value: els.blackBraid?.textContent || '0', units: 'events' },
            { id: 'braid-b', name: els.whiteBraidLabel?.textContent || 'Braid B', value: els.whiteBraid?.textContent || '0', units: 'events' }
        );
    }
    if (!els.cftObservablePanel?.hidden) {
        samples.push(
            { id: 'cft-dominant-block', name: 'Dominant Block', value: els.cftObservableDominant.textContent, units: 'symbolic' },
            { id: 'cft-entropy', name: 'Entropy', value: els.cftObservableEntropy.textContent, units: 'estimator' },
            { id: 'cft-anomalies', name: 'Anomaly Events', value: els.cftObservableAnomalies.textContent, units: 'count' }
        );
    }
    if (!els.qecObservablePanel?.hidden) {
        samples.push(
            { id: 'qec-total-charge', name: 'Total Charge', value: els.qecTotalCharge.textContent, units: 'symbolic' },
            { id: 'qec-logical-sector', name: 'Logical Sector', value: els.qecLogicalSector.textContent, units: 'symbolic' },
            { id: 'qec-memory', name: 'Memory', value: els.qecMemoryState.textContent, units: 'state' }
        );
    }
    if (!els.stabilizerObservablePanel?.hidden) {
        samples.push(
            { id: 'stabilizer-syndrome', name: 'Syndrome Weight', value: els.stabilizerSyndromeWeight.textContent, units: 'count' },
            { id: 'stabilizer-logical-sector', name: 'Logical Sector', value: els.stabilizerLogicalSector.textContent, units: 'symbolic' },
            { id: 'stabilizer-vacuum', name: 'Vacuum', value: els.stabilizerVacuumState.textContent, units: 'state' }
        );
    }
    return samples.map((sample, index) => ({
        definition: metadata.observables[index] || sample.name,
        limitation: metadata.approximation,
        ...sample
    }));
}

function buildLabExperimentConfig() {
    const mode = selectedMode();
    const metadata = resolvedLabMetadata(mode);
    const topology = topologyIdentity();
    return {
        experimentId: currentExperimentHash(mode),
        modelId: mode,
        modelName: MODE_LABELS[mode],
        modelFamily: metadata.family,
        section: metadata.section,
        validationLevel: metadata.validationLevel,
        topologyId: `${topology.topology}:${topology.lattice}:${topology.width}x${topology.height}`,
        stateSpaceId: `${mode}:state-space`,
        localRuleId: `${mode}:local-rule`,
        initialConditionId: currentInitialConditionText(mode),
        parameters: experimentParameters(mode),
        seed: els.noiseSeedInput?.value || 'topology-seed',
        steps: Number(game?.moveNumber ?? game?.go?.moveNumber ?? 0) || 0,
        observables: collectObservableSamples(mode).map((sample) => sample.id),
        exportOptions: {
            json: true,
            csv: true,
            includeTopology: true,
            includeStateSpace: true,
            includeSnapshots: true,
            includeEventLog: true,
            includeObservableTimeSeries: true
        },
        appVersion: LAB_APP_VERSION,
        createdAt: new Date().toISOString(),
        experimentHash: currentExperimentHash(mode)
    };
}

function buildLabExperimentResult() {
    const state = game?.exportState?.() || {};
    const samples = collectObservableSamples();
    const eventLog = [
        ...(Array.isArray(game?.history) ? game.history : []),
        ...(Array.isArray(game?.braidEventLog) ? game.braidEventLog : []),
        ...(Array.isArray(game?.probability?.randomEvents) ? game.probability.randomEvents : [])
    ];
    const config = buildLabExperimentConfig();
    const finalStateHash = labHash(state, 'state');
    const result = {
        config,
        finalState: {
            topologyId: config.topologyId,
            stateSpaceId: config.stateSpaceId,
            step: config.steps,
            time: config.steps,
            legacyState: state,
            stateHash: finalStateHash
        },
        observableTimeSeries: Object.fromEntries(samples.map((sample) => [
            sample.id,
            [{
                step: config.steps,
                time: config.steps,
                value: sample.value,
                units: sample.units,
                definition: sample.definition,
                limitation: sample.limitation,
                sampleHash: labHash(sample, 'sample')
            }]
        ])),
        eventLog,
        snapshots: [{
            id: `${config.experimentId}:snapshot:${config.steps}`,
            step: config.steps,
            time: config.steps,
            stateHash: finalStateHash,
            preview: {
                mode: config.modelName,
                topology: config.parameters.topology.topology,
                observables: samples.slice(0, 5)
            },
            snapshotHash: labHash({ stateHash: finalStateHash, step: config.steps }, 'snapshot')
        }],
        summary: {
            status: 'complete',
            finalStep: config.steps,
            finalTime: config.steps,
            observableSummary: Object.fromEntries(samples.map((sample) => [sample.id, sample.value])),
            interpretation: resolvedLabMetadata(selectedMode()).description,
            limitations: [resolvedLabMetadata(selectedMode()).approximation]
        },
        warnings: [resolvedLabMetadata(selectedMode()).validation],
        resultHash: ''
    };
    return { ...result, resultHash: labHash(result, 'result') };
}

function observableCsv() {
    const result = buildLabExperimentResult();
    const rows = ['experimentHash,step,time,observableId,name,value,units,definition,limitation'];
    for (const sample of collectObservableSamples()) {
        rows.push([
            result.config.experimentHash,
            result.config.steps,
            result.config.steps,
            sample.id,
            sample.name,
            sample.value,
            sample.units,
            sample.definition,
            sample.limitation
        ].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','));
    }
    return rows.join('\n');
}

function setLabUIMode(mode) {
    const next = mode === 'simple' ? 'simple' : 'research';
    document.body.dataset.labUiMode = next;
    localStorage.setItem('topoboard-labs-ui-mode', next);
    if (els.labSimpleModeButton) els.labSimpleModeButton.setAttribute('aria-pressed', String(next === 'simple'));
    if (els.labResearchModeButton) els.labResearchModeButton.setAttribute('aria-pressed', String(next === 'research'));
    if (next === 'simple') setLabSystemIntroductionOpen(false);
}

function initialLabUIMode() {
    const requested = String(params.get('ui') || params.get('labUi') || params.get('audience') || '').toLowerCase();
    if (['simple', 'play', 'player', 'players'].includes(requested)) return 'simple';
    if (['research', 'researcher', 'researchers'].includes(requested)) return 'research';
    return localStorage.getItem('topoboard-labs-ui-mode') || 'research';
}

function renderLabsModelCatalog() {
    if (!els.labsModelCatalog || els.labsModelCatalog.dataset.rendered === 'true') return;
    els.labsModelCatalog.dataset.rendered = 'true';
    for (const section of LAB_SECTION_ORDER) {
        const sectionModes = Object.entries(MODE_LABELS)
            .filter(([mode]) => resolvedLabMetadata(mode).section === section);
        if (!sectionModes.length) continue;
        for (const [mode, label] of sectionModes) {
            const metadata = resolvedLabMetadata(mode);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'labs-model-card';
            button.dataset.labMode = mode;
            button.innerHTML = `
                <span>${metadata.section}</span>
                <strong>${label}</strong>
                <small>${metadata.description}</small>
                <span class="labs-card-meta">
                    <em>${metadata.validationLevel}</em>
                    <em>${metadata.family}</em>
                    <em>${metadata.observables.length} observables</em>
                    <em>${metadata.validationLevel === 'toy' ? 'beginner-friendly' : 'research-focused'}</em>
                </span>
            `;
            button.addEventListener('click', () => {
                const layer = modeLayerForMode(mode);
                if (els.gameLayerSelect) els.gameLayerSelect.value = layer;
                syncModeCatalogForLayer({ chooseFirst: false });
                els.modeSelect.value = mode;
                createGame();
            });
            els.labsModelCatalog.append(button);
        }
    }
}

function updateLabWorkspace() {
    const mode = selectedMode();
    const metadata = resolvedLabMetadata(mode);
    const topology = topologyIdentity();
    const experimentHash = currentExperimentHash(mode);
    if (els.labHeaderModelName) els.labHeaderModelName.textContent = MODE_LABELS[mode];
    if (els.labHeaderDescription) els.labHeaderDescription.textContent = metadata.description;
    if (els.labValidationBadge) {
        els.labValidationBadge.textContent = metadata.validationLevel;
        els.labValidationBadge.dataset.level = metadata.validationLevel;
    }
    if (els.labModelFamilyBadge) els.labModelFamilyBadge.textContent = `${metadata.section} / ${metadata.family}`;
    if (els.labExperimentHashBadge) els.labExperimentHashBadge.textContent = experimentHash;
    if (els.labAppVersionBadge) els.labAppVersionBadge.textContent = `v${LAB_APP_VERSION}`;
    if (els.labStateLocalStates) els.labStateLocalStates.textContent = metadata.stateSpace.localStates;
    if (els.labStateEncoding) els.labStateEncoding.textContent = metadata.stateSpace.encoding;
    if (els.labStateConstraints) els.labStateConstraints.textContent = metadata.stateSpace.constraints;
    if (els.labStateInterpretation) els.labStateInterpretation.textContent = metadata.stateSpace.interpretation;
    if (els.labRuleName) els.labRuleName.textContent = metadata.rule.name;
    if (els.labRuleNeighborhood) els.labRuleNeighborhood.textContent = metadata.rule.neighborhood;
    if (els.labRuleSchedule) els.labRuleSchedule.textContent = metadata.rule.schedule;
    if (els.labRuleDeterminism) els.labRuleDeterminism.textContent = metadata.rule.deterministic;
    if (els.labRuleHash) els.labRuleHash.textContent = currentRuleHash(mode);
    if (els.labInitialPreset) els.labInitialPreset.textContent = currentInitialConditionText(mode);
    if (els.labInitialSeed) els.labInitialSeed.textContent = els.noiseSeedInput?.value || 'topology-seed';
    if (els.labManualEditState) {
        els.labManualEditState.textContent = els.physicalInitialStateSelect?.value === 'custom_setup'
            ? 'Custom Pauli setup is active; edit sites, then press Start.'
            : 'Manual edit is available where the selected model exposes a local palette or custom setup.';
    }
    if (els.labTopologyDimension) els.labTopologyDimension.textContent = `${topology.dimension}D`;
    if (els.labBoundaryCondition) els.labBoundaryCondition.textContent = topology.boundary;
    if (els.labTopologyInvariants) {
        els.labTopologyInvariants.textContent = topology.topology === 'torus'
            ? 'orientable, periodic cycles'
            : topology.topology === 'klein_bottle'
                ? 'non-orientable, twisted cycle'
                : topology.topology === 'sphere_latitude'
                    ? 'closed surface with poles'
                    : 'computed from graph adjacency when adapter data is available';
    }
    if (els.labTopologyHash) els.labTopologyHash.textContent = topology.hash;
    if (els.labResearchAssumptions) els.labResearchAssumptions.textContent = metadata.assumptions;
    if (els.labResearchApproximation) els.labResearchApproximation.textContent = metadata.approximation;
    if (els.labResearchValidation) els.labResearchValidation.textContent = metadata.validation;
    if (els.labResearchReferences) els.labResearchReferences.textContent = 'References placeholder; attach benchmark notes before raising validation level.';
    renderLabScienceIntroduction(mode);
    renderLabObservableMethods(mode);
    document.querySelectorAll('.labs-model-card').forEach((card) => {
        card.classList.toggle('is-active', card.dataset.labMode === mode);
    });
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
    const rulesMode = isIsing ? 'ising-domain'
        : isTwoPhase ? 'two-phase'
        : isCluster ? 'physical-cluster-go'
        : isJumpParticles ? 'physical-jump-particles'
        : isSpinIce ? 'spin-ice'
        : isZ2Gauge ? 'z2-gauge'
        : isPhysicalClifford ? 'physical-clifford'
        : isCFTReversi ? 'cft-reversi'
        : isVirasoroGo || isVirasoroJump ? 'virasoro'
        : isAnyon || isAnyonReversi ? 'anyon'
        : 'clifford';
    for (const section of els.rulesSections || []) {
        section.hidden = section.dataset.rulesMode !== rulesMode;
    }
    activeRulesMode = rulesMode;
    renderLabGuideBook(rulesMode);
    if (els.rulesIntroButton) {
        const guideLabel = labGuideLabel(rulesMode);
        els.rulesIntroButton.textContent = guideLabel;
        if (els.rulesIntroTitle) els.rulesIntroTitle.textContent = guideLabel;
    }
    document.title = `${MODE_LABELS[mode]} - Topological Labs`;
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
    labObservableTimeline = [];
    labObservableTimelineMode = '';
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
                allowedActions: ['place_spin', 'flip_spin', 'flip_domain', 'line_interval_rewrite', 'pass'],
                localUpdateRules: 'Energy is E=-J sum_<ij> s_i s_j - h sum_i s_i over topology.neighbors(vertex). Local updates propose changed spins on graph vertices, compute deltaE, optionally apply Metropolis acceptance, then recompute domain-wall and topology observables. Optional line-interval rewrite is a constrained spin update, not a Reversi rule.'
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
                    physicalSystemName: 'Physical cluster-field competition graph',
                    blackWhiteMeaning: 'black = species A / phase A / spin sector A; white = species B / phase B / spin sector B; empty = local growth/resource site; neighboring vacancies are resource/oxygen contacts; zero-contact clusters undergo local extinction, annihilation, or confinement',
                    initialStateOptions: ['sparse_seeds', 'random_density', 'two_cluster_competition', 'interface_seed', 'thermal_cluster_sample'],
                    allowedActions: ['place_species', 'grow_connected_cluster', 'remove_zero_contact_cluster', 'diffusion_noise_step', 'pass'],
                    localUpdateRules: 'Topology-aware neighbor contacts define local resources. A species can nucleate on empty vertices or grow from adjacent same-species clusters. Opponent clusters with zero open contacts are removed as local extinction, annihilation, or confinement; optional diffusion/noise grows random local droplets after updates.'
                })
            : mode === 'physical_jump_particles'
                ? createPhysicalModeDefinition(mode, {
                    physicalSystemName: 'Particle hopping, exchange, and reaction graph system',
                    blackWhiteMeaning: 'black/white = two particle species or charge signs; hop = adjacent propagation; exchange/scatter crosses an occupied barrier particle; recombination removes opposite charges or converts local state',
                    initialStateOptions: ['paired_particles', 'charge_recombination_pair', 'spin_exchange_seed', 'anyon_worldline_seed'],
                    allowedActions: ['hop_to_adjacent_empty_vertex', 'exchange_over_occupied_vertex', 'multi_step_scattering_path', 'recombine_opposite_charges', 'measure_path_parity'],
                    localUpdateRules: 'Particles occupy graph vertices. A hop moves to an adjacent empty vertex, an exchange/scattering update crosses one occupied barrier particle, a multi-step scattering path follows consecutive allowed landings, recombination removes adjacent opposite charges and recovers energy, and path-parity measurement records exchange or braid parity.'
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
                    physicalSystemName: 'CFT field-insertion graph on a discretized Riemann surface',
                    blackWhiteMeaning: 'board = discretized Riemann surface / graph manifold; empty = identity operator; stone = primary-field insertion; black/white = source sign or player control; primaryType carries the physical field',
                    initialStateOptions: ['two_point_insertions', 'four_point_block', 'boundary_cft', 'thermal_sparse', 'identity_background_with_defects'],
                    allowedActions: ['insert_primary_field', 'local_OPE_fusion_update', 'measure_ope_channel', 'measure_two_point_correlator', 'measure_four_point_correlator', 'apply_Ln_deformation', 'pass', 'count'],
                    localUpdateRules: 'Topology-aware field insertion adds primary operators to graph vertices. Local OPE fusion updates use adjacent graph connectivity and stress proxies rather than a boardgame capture goal. Measurements estimate OPE channels and two-/four-point CFT observables. L_n Virasoro deformations update stress proxies, with N=2 tracking central-charge anomaly events.'
                })
            : mode === 'physical_virasoro_reversi'
                ? createPhysicalModeDefinition(mode, {
                    physicalSystemName: 'CFT local OPE interval system on a topology graph',
                    blackWhiteMeaning: 'black = + source/domain sign; white = - source/domain sign; stone = primary field or spin/domain insertion; nearby occupied graph rays form a discrete OPE interaction interval; no enclosing boardgame bracket is required',
                    initialStateOptions: ['domain_wall_seed', 'four_sigma_block', 'boundary_condition_change', 'thermal_cft_sample', 'two_phase_interval_seed'],
                    allowedActions: ['insert_primary_field', 'propagate_local_ope_kernel', 'update_ope_channel_along_interval', 'measure_interval_parity', 'measure_ope_channel', 'measure_region_entropy', 'apply_Ln_deformation', 'pass'],
                    localUpdateRules: 'A primary insertion is legal on an empty graph vertex. The inserted field couples to occupied nearby graph rays through the Ising-CFT OPE table, updates channel labels, seam phase transport, stress, entropy, and conformal-block estimators. Measurements reveal interval parity, OPE channel, entropy, stress, or four-point block estimators; L_n actions update stress and N=2 anomaly events.'
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
    const z = topology === 'r3' || topology === 'flat_4d_grid' ? els.zSizeInput.value : '';
    const w = topology === 'flat_4d_grid' ? els.wSizeInput.value : '';
    const rulesetDetails = {
        algebra: base === 'clifford_reversi' ? els.cliffordAlgebraSetSelect.value : '',
        anyonSetup: isJumpMode(mode) ? els.anyonSetupSelect.value : '',
        anyonModel: base === 'anyon_jump' || base === 'anyon_reversi' ? els.anyonModelSelect.value : '',
        braidMemory: isJumpMode(mode) ? els.braidMemoryModeSelect.value : '',
        clusterInitialState: mode === 'physical_cluster_go' ? els.clusterInitialStateSelect.value : '',
        clusterModel: mode === 'physical_cluster_go' ? els.clusterModelSelect.value : '',
        particleModel: mode === 'physical_jump_particles' ? els.jumpParticleModelSelect.value : '',
        particleAction: mode === 'physical_jump_particles' ? els.jumpParticleActionSelect.value : '',
        update: els.timeUpdateSelect?.value || 'off',
        noise: els.noiseModeSelect?.value || 'off',
        applyNoise: els.applyNoiseSelect?.value || '',
        noiseProbability: els.noiseProbabilityInput?.value || '',
        noiseSeed: els.noiseSeedInput?.value || '',
        timeParameter: els.timeParameterInput?.value || ''
    };
    return buildOnlineMatchKey({
        gameFamily: 'algebraic',
        dimension: topology === 'flat_4d_grid' ? 4 : (topology === 'r3' ? 3 : 2),
        boardSpace: topology,
        topology,
        lattice,
        boundary: topology,
        size: [els.widthInput.value, els.heightInput.value, z, w].filter(Boolean),
        ruleset: { mode, ...rulesetDetails },
        rulesetVersion: 1,
        labsMode: base
    });
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
    if (els.onlineStatus) els.onlineStatus.dataset.color = playerColor || '';
}

function isOnlineExperimentMode() {
    return els.playModeSelect?.value === 'online';
}

function syncOnlineRoomTurn(room) {
    if (!room?.turn || !game) return;
    game.currentPlayer = room.turn;
    if (game.go) game.go.currentPlayer = room.turn;
}

function syncOnlineModeVisibility() {
    if (!els.playModeSelect || !els.onlineButtonGrid) return;
    const online = isOnlineExperimentMode();
    els.onlineButtonGrid.hidden = !online;
    if (online && els.onlineStatus && !els.onlineStatus.dataset.color && els.onlineStatus.textContent === 'Local experiment.') {
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
            if (els.onlineStatus) els.onlineStatus.textContent = text;
        },
        onRoomChanged: ({ roomId, playerColor, room }) => {
            const connected = room?.status === 'playing';
            setOnlineConfigurationLocked(Boolean(roomId));
            updateOnlineConnectionUI(roomId, playerColor, room);
            if (roomId && els.onlineRoomInput) {
                els.onlineRoomInput.value = roomId;
                const url = new URL(window.location.href);
                url.searchParams.set('room', roomId);
                history.replaceState(null, '', url);
            }
            if (room?.board) lastOnlineSnapshotJSON = JSON.stringify(room.board);
            if (connected) syncOnlineRoomTurn(room);
            const canChat = connected && Boolean(playerColor);
            if (els.onlineChatInput) els.onlineChatInput.disabled = !canChat;
            if (els.onlineChatSendButton) els.onlineChatSendButton.disabled = !canChat;
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
        if (els.onlineStatus) els.onlineStatus.textContent = `Chat failed: ${error.message}`;
    }
}

async function runOnlineAction(action) {
    try {
        return await action();
    } catch (error) {
        if (els.onlineStatus) els.onlineStatus.textContent = `Online error: ${error.message}`;
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
    if (applyingRemoteState || onlineSyncPending || !isOnlineExperimentMode()) return;
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
        if (els.onlineStatus) els.onlineStatus.textContent = `Move was not synchronized: ${error.message}`;
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
    const onlineLocked = isOnlineExperimentMode()
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
    updateLabWorkspace();
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
    badge.textContent = `R${stone.liberties ?? 0}`;
    node.append(badge);
    node.title = `${stone.label}; resource contacts ${stone.liberties ?? 0}`;
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
        ? `${stone.color} ${game.primaryLabel?.(stone) || 'primary'}; h=${formatNumber(stone.h)}, hbar=${formatNumber(stone.hbar)}; resource contacts=${groupInfo.liberties.size}; channel=${cftChannelDisplay(stone)}`
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
        const resourceContacts = game.groupInfoAt(coord)?.liberties.size || 0;
        return `${game.topology.displayCoord(coord)} species ${species}; resource contacts ${resourceContacts}; same neighbors ${same}; interface neighbors ${opposite}`;
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
            return `${game.topology.displayCoord(coord)} ${goStone.color} ${game.primaryLabel(goStone)}; h=${goStone.h}, hbar=${goStone.hbar}; channel=${channel}; group resource contacts=${groupInfo.liberties.size}; ${stressText}`;
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
            ? `${game.topology.displayCoord(coord)} ${stone.color} ${game.primaryLabel(stone)}; graph contacts=${game.groupInfoAt(coord)?.liberties.size || 0}`
            : `${game.topology.displayCoord(coord)} empty Clifford field vertex`;
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
            : `${(result.event.type || result.event.action || '').replaceAll('_', ' ')} completed on ${affected} site${affected === 1 ? '' : 's'}.`;
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
            message = `Inserted ${els.cftPrimarySelect.value}; locally fused ${result.captured || 0} primary field${result.captured === 1 ? '' : 's'}.`;
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
        els.statusText.textContent = `${result.event.action.replaceAll('_', ' ')}; removed ${captured}; largest ${observables.largestCluster}; survival ${formatNumber(observables.survivalProbability)}; wraps ${observables.topologyWrappingClusterCount}.`;
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
        ? `Inserted ${game.primaryLabel(game.getStone(coord))}; locally fused ${result.captured || 0}.`
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
        message = `Inserted ${els.cftPrimarySelect.value}; locally fused ${result.captured || 0} primary field${result.captured === 1 ? '' : 's'}.`;
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
        status: 'Choose the anyon charge for this local fusion insertion.',
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
    if (isOnlineExperimentMode()) {
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
        const physicalCliffordField = normalizeMode(game.mode) === 'physical_clifford_go';
        els.blackCountLabel.textContent = isCliffordGoMode(game.mode)
            ? (physicalCliffordField ? 'Black Pauli Operators' : 'Black Pauli Stones')
            : 'Black Primaries';
        els.whiteCountLabel.textContent = isCliffordGoMode(game.mode)
            ? (physicalCliffordField ? 'White Pauli Operators' : 'White Pauli Stones')
            : 'White Primaries';
        els.blackBraidLabel.textContent = isCliffordGoMode(game.mode)
            ? (physicalCliffordField ? 'Black Contact Removals' : 'Black Captures')
            : 'Total Weight';
        els.whiteBraidLabel.textContent = isCliffordGoMode(game.mode)
            ? (physicalCliffordField ? 'White Contact Removals' : 'White Captures')
            : 'Anomalies';
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
                ? `${capitalize(game.currentPlayer)} can apply a Pauli recovery operator at this site with frame transform ${els.transformSelect.value}.`
                : `${capitalize(game.currentPlayer)}: choose a site to apply the selected Pauli recovery operator; ${moves} data site${moves === 1 ? '' : 's'} available.`;
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
                ? `${capitalize(game.currentPlayer)} will insert ${els.cftPrimarySelect.value} and update ${preview.flips.length} nearby OPE site${preview.flips.length === 1 ? '' : 's'}.`
                : `${capitalize(game.currentPlayer)} has ${moves} empty ${els.cftPrimarySelect.value} insertion site${moves === 1 ? '' : 's'}.`;
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
                els.statusText.textContent = `${capitalize(game.currentPlayer)} can fuse ${preview.flips.length} locally coupled charge${preview.flips.length === 1 ? '' : 's'} with ${jumpTypeDisplay(selectedType)}.`;
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
        els.statusText.textContent = `${capitalize(game.currentPlayer)} inserts ${els.pauliSelect.value}. Graph contact rules update connected Pauli clusters and preserve topology seams.`;
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
            els.statusText.textContent = `${capitalize(game.currentPlayer)} inserts ${els.cftPrimarySelect.value}. Dominant block ${observables.dominantConformalBlock}; OPE sector ${observables.finalOPESector}; local fusions black ${game.captures.black}, white ${game.captures.white}.`;
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
        els.statusText.textContent = `Selected ${selectedToken}: ${braidStatusLabel(token)}, parity ${token?.braidParity || 0}, word ${braidWordToText(token?.braidWord || [])}${channelText}, ${actions.length} local propagation/exchange option${actions.length === 1 ? '' : 's'}.${cancel}${inverse}${warning}${recovery}`;
    } else {
        const anyonTurnAction = game.config?.setupMode === 'excitation' ? els.anyonActionSelect.value : 'move';
        els.statusText.textContent = game.config?.setupMode === 'excitation' && anyonTurnAction === 'excite'
            ? `${capitalize(game.currentPlayer)} energy ${formatNumber(game.energy?.[game.currentPlayer] || 0)}. Excite ${jumpTypeDisplay(els.anyonExcitationTypeSelect.value)} on an empty vertex.`
            : game.config?.setupMode === 'excitation' && anyonTurnAction === 'recombine'
            ? `${capitalize(game.currentPlayer)} energy ${formatNumber(game.energy?.[game.currentPlayer] || 0)}. Click an owned anyon to recombine and recover energy.`
            : game.config?.setupMode === 'excitation'
            ? `${capitalize(game.currentPlayer)} energy ${formatNumber(game.energy?.[game.currentPlayer] || 0)}. Select an owned anyon to move/braid, or choose Excite Anyon.`
            : 'Select an anyon, then hop to a neighbor or exchange around an occupied vertex.';
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
            'Gold outline: local OPE interaction interval',
            '? is a hidden OPE channel until measured',
            'T(v) is the discrete stress proxy',
            'Correlations, blocks, and entropy are graph estimators'
        ]
        : isAnyonReversiMode(game.mode)
        ? [
            `${els.anyonModelSelect.value === 'zn_phase' ? 'Z_n charges' : 'Anyon charges'} are placed with the local site palette`,
            'Gold outline previews local fusion propagation',
            'Affected chains update by charge-fusion transport',
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
            'Resource contacts are available neighboring growth/resource sites',
            'Clusters with zero resource contacts are removed as local extinction or confinement',
            'Optional diffusion/noise grows random local droplets after updates',
            'Observables track cluster distribution, largest cluster, percolation, survival, and wrapping clusters'
        ]
        : isPhysicalJumpParticlesMode(game.mode)
        ? [
            'Black/white are two particle species or charge signs',
            'Hop moves to an adjacent empty vertex',
            'Exchange/scattering crosses an occupied interaction particle into an empty landing',
            'Multi-step scattering follows consecutive legal exchange landings',
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
                'Local OPE/contact updates use graph adjacency',
                '\u03c3, \u03b5, 1, or V labels are primary insertions',
                'T(v) is the approximate stress proxy',
                'Gold outline previews a conformal deformation',
                `Approximate ${els.cftModelSelect.value}; c=${Number(els.cftCentralChargeInput.value) || 0.5}; max N=${els.cftMaxModeSelect.value}`
            ]
            : isCliffordGoMode(game.mode)
                ? [
                    'Graph contacts update connected Pauli clusters',
                    '+X, +Y, and +Z are Pauli-labelled stones',
                    'Topology seams preserve the graph movement rules',
                    'Pass twice, then both players agree to count'
                ]
            : [
            isCliffordJumpMode(game.mode)
                ? 'Clifford worldline labels: X, Z, and Y propagate on the graph'
                : isVirasoroJumpMode(game.mode)
                ? 'Virasoro worldline labels: sigma and epsilon primary excitations'
                : els.anyonModelSelect.value === 'zn_phase'
                ? `General Z_${Math.max(2, Math.min(64, Math.floor(Number(els.anyonGradeInput?.value) || 5)))} phase: braid +1/n, inverse -1/n`
                : els.anyonModelSelect.value === 'ising'
                ? 'Ising anyons: 1, \u03c3, \u03c8'
                : els.anyonModelSelect.value === 'fibonacci'
                    ? 'Fibonacci anyons: 1, \u03c4'
                    : 'e,m,\u03c8 toric anyons',
            '? hidden until measured',
            'Blue path: worldline / exchange path',
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
            item.textContent = `#${event.number} ${event.player} ${event.action || event.type}; removed ${update.capturedCount || 0}; largest ${observables.largestCluster ?? 0}; wraps ${observables.topologyWrappingClusterCount ?? 0}; survival ${formatNumber(observables.survivalProbability ?? 0)}.`;
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
                item.textContent = `#${event.number} ${event.color} inserted ${inserted} at ${event.coord.join(',')}; fused/removed ${event.captured}.`;
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
    els.exportText.value = JSON.stringify(buildLabExperimentResult(), null, 2);
}

function downloadText(filename, data, type = 'application/json') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function exportConfigJson() {
    downloadText(
        `${game.mode}-${game.topology.name}-experiment-config.json`,
        JSON.stringify(buildLabExperimentConfig(), null, 2)
    );
}

function exportJson() {
    downloadText(
        `${game.mode}-${game.topology.name}-experiment-result.json`,
        JSON.stringify(buildLabExperimentResult(), null, 2)
    );
}

function exportCsv() {
    downloadText(
        `${game.mode}-${game.topology.name}-observable-series.csv`,
        observableCsv(),
        'text/csv'
    );
}

function exportSnapshotJson() {
    const result = buildLabExperimentResult();
    downloadText(
        `${game.mode}-${game.topology.name}-snapshot-${result.config.steps}.json`,
        JSON.stringify(result.snapshots[0], null, 2)
    );
}

async function copyLabText(text, status = 'Copied to clipboard.') {
    try {
        await navigator.clipboard.writeText(text);
        els.statusText.textContent = status;
    } catch {
        els.exportText.value = text;
        els.exportText.select();
        document.execCommand?.('copy');
        els.statusText.textContent = status;
    }
}

function copyCitationText() {
    const config = buildLabExperimentConfig();
    const citation = `Topoboard Labs ${LAB_APP_VERSION}: ${config.modelName}, ${config.modelFamily}, ${config.topologyId}, seed ${config.seed}, experiment ${config.experimentHash}.`;
    copyLabText(citation, 'Citation text copied.');
}

function copyExperimentLink() {
    const config = buildLabExperimentConfig();
    const url = new URL(window.location.href);
    url.searchParams.set('mode', selectedMode());
    url.searchParams.set('topology', els.topologySelect.value);
    url.searchParams.set('lattice', els.latticeSelect.value);
    url.searchParams.set('width', els.widthInput.value);
    url.searchParams.set('height', els.heightInput.value);
    url.searchParams.set('seed', String(config.seed));
    url.searchParams.set('experiment', config.experimentHash);
    copyLabText(url.toString(), 'Reproducible experiment link copied.');
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
els.showEdgesToggle?.addEventListener('change', () => {
    algebraic3d.configurePerformance({ showEdges: els.showEdgesToggle.checked });
});
els.showLabelsToggle?.addEventListener('change', () => {
    algebraic3d.configurePerformance({ showLabels: els.showLabelsToggle.checked });
});
els.lowerDetailButton?.addEventListener('click', () => {
    const active = els.lowerDetailButton.getAttribute('aria-pressed') !== 'true';
    els.lowerDetailButton.setAttribute('aria-pressed', String(active));
    algebraic3d.configurePerformance({ lowerDetail: active, performanceMode: active });
});
els.pauseUpdatesButton?.addEventListener('click', () => {
    const active = els.pauseUpdatesButton.getAttribute('aria-pressed') !== 'true';
    els.pauseUpdatesButton.setAttribute('aria-pressed', String(active));
    algebraic3d.configurePerformance({ pauseUpdates: active });
    if (!active) renderAlgebraic3DBoard();
});
els.dropAnyonButton.addEventListener('click', dropSelectedAnyon);
els.rulesIntroButton.addEventListener('click', toggleRulesIntro);
els.rulesIntroCloseButton.addEventListener('click', () => setRulesIntroOpen(false));
els.rulesIntroPanel.addEventListener('pointerdown', (event) => {
    if (event.target === els.rulesIntroPanel) setRulesIntroOpen(false);
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && rulesIntroIsOpen()) setRulesIntroOpen(false);
});
window.addEventListener('languagechange', () => {
    window.requestAnimationFrame(() => {
        updateResearchBuilderLink();
        renderLabGuideBook(activeRulesMode);
        renderLabScienceIntroduction();
        setLabSystemIntroductionOpen(!els.labSystemIntroductionPanel?.hidden);
        if (els.rulesIntroButton) {
            const guideLabel = labGuideLabel(activeRulesMode);
            els.rulesIntroButton.textContent = guideLabel;
            if (els.rulesIntroTitle) els.rulesIntroTitle.textContent = guideLabel;
        }
    });
});
els.playModeSelect?.addEventListener('change', async () => {
    const online = isOnlineExperimentMode();
    syncOnlineModeVisibility();
    if (online) {
        const ready = await prepareOnline();
        if (!ready.ok && els.onlineStatus) els.onlineStatus.textContent = ready.error || 'Online rooms are not available yet.';
    } else {
        await leaveRoom();
        setOnlineConfigurationLocked(false);
        updateOnlineConnectionUI();
        if (els.onlineStatus) els.onlineStatus.textContent = 'Local experiment.';
    }
});
els.onlineCreateButton?.addEventListener('click', async () => {
    const ready = await runOnlineAction(() => prepareOnline());
    if (!ready?.ok) return;
    const result = await runOnlineAction(() => createPrivateRoom(game.exportState()));
    if (!result) return;
    if (els.onlineRoomInput) els.onlineRoomInput.value = result.roomId;
});
els.onlineJoinButton?.addEventListener('click', async () => {
    const ready = await runOnlineAction(() => prepareOnline());
    if (!ready?.ok) return;
    await runOnlineAction(() => joinPrivateRoom(els.onlineRoomInput?.value || ''));
});
els.onlineFindButton?.addEventListener('click', async () => {
    const ready = await runOnlineAction(() => prepareOnline());
    if (!ready?.ok) return;
    const result = await runOnlineAction(() => findMatch(game.exportState()));
    if (!result) return;
    if (els.onlineRoomInput) els.onlineRoomInput.value = result.roomId;
});
els.onlineReconnectButton?.addEventListener('click', async () => {
    const ready = await runOnlineAction(() => prepareOnline());
    if (!ready?.ok) return;
    await runOnlineAction(() => reconnectRoom());
});
els.onlineLeaveButton?.addEventListener('click', async () => {
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
els.onlineChatSendButton?.addEventListener('click', submitOnlineChat);
els.onlineChatInput?.addEventListener('keydown', (event) => {
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
els.exportConfigButton?.addEventListener('click', exportConfigJson);
els.exportCsvButton?.addEventListener('click', exportCsv);
els.exportSnapshotButton?.addEventListener('click', exportSnapshotJson);
els.snapshotButton?.addEventListener('click', exportSnapshotJson);
els.copyCitationButton?.addEventListener('click', copyCitationText);
els.copyExperimentLinkButton?.addEventListener('click', copyExperimentLink);
els.labSimpleModeButton?.addEventListener('click', () => setLabUIMode('simple'));
els.labResearchModeButton?.addEventListener('click', () => setLabUIMode('research'));
els.labSystemIntroductionButton?.addEventListener('click', () => {
    setLabSystemIntroductionOpen(Boolean(els.labSystemIntroductionPanel?.hidden));
});
els.labObservableFigureSelect?.addEventListener('change', () => renderLabObservableMethods());
window.addEventListener('resize', () => {
    if (!els.labSystemIntroductionPanel?.hidden) renderLabObservableMethods();
});
window.addEventListener('pageshow', () => {
    syncOnlineModeVisibility();
    if (!game) createGame();
    else if (els.topologySelect.value !== game.topology.name) createGame();
    else render();
});

renderLabsModelCatalog();
setLabUIMode(initialLabUIMode());
updateResearchBuilderLink();
createGame();
syncOnlineModeVisibility();

const sharedRoomId = new URLSearchParams(window.location.search).get('room');
if (sharedRoomId && els.playModeSelect && els.onlineRoomInput) {
    els.playModeSelect.value = 'online';
    syncOnlineModeVisibility();
    els.onlineRoomInput.value = sharedRoomId;
    prepareOnline()
        .then((ready) => ready.ok && joinPrivateRoom(sharedRoomId))
        .catch((error) => {
            if (els.onlineStatus) els.onlineStatus.textContent = `Reconnect failed: ${error.message}`;
        });
}
