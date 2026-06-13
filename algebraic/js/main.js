import { CliffordReversiGame } from '../../js/localgames/CliffordReversi.js';
import { AnyonJumpGame } from '../../js/localgames/AnyonJump.js';
import { VirasoroGoGame } from '../../js/localgames/VirasoroGo.js';
import {
    braidWordToText,
    nextRequiredUnbraidGenerator,
    requiredInverseBraidWordText
} from '../../js/anyon/BraidMemory.js';
import { fusionChannelDisplay } from '../../js/anyon/NonabelianFusionMemory.js';

const els = {
    modeSelect: document.querySelector('#modeSelect'),
    modeControl: document.querySelector('#modeControl'),
    topologySelect: document.querySelector('#topologySelect'),
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
    anyonModelSelect: document.querySelector('#anyonModelSelect'),
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
const params = new URLSearchParams(window.location.search);
const FIXED_MODE = normalizeMode(params.get('mode') || params.get('game') || params.get('algebraicMode'));
const PHYSICAL_PROBLEM_ID = params.get('physicalProblem') || params.get('problemId') || '';

let game = null;
let selectedToken = '';
let hoverCoord = null;
let lastCancellation = null;
let lastWrongUnbraid = null;

if (FIXED_MODE) {
    els.modeSelect.value = FIXED_MODE;
    els.modeSelect.disabled = true;
    document.body.dataset.fixedAlgebraicMode = FIXED_MODE;
}

function normalizeMode(value) {
    if (value === 'anyon' || value === 'anyon_jump_chess') return 'anyon_jump';
    if (value === 'clifford' || value === 'reversi') return 'clifford_reversi';
    if (value === 'go' || value === 'virasoro' || value === 'virasoro_go_game') return 'virasoro_go';
    return Object.hasOwn(MODE_LABELS, value) ? value : '';
}

function selectedMode() {
    return normalizeMode(FIXED_MODE || els.modeSelect.value) || 'clifford_reversi';
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

function syncModeControls() {
    const mode = selectedMode();
    const isAnyon = mode === 'anyon_jump';
    const isVirasoroGo = mode === 'virasoro_go';
    const isClifford = mode === 'clifford_reversi';
    if (els.modeSelect.value !== mode) els.modeSelect.value = mode;
    if (els.modeControl) els.modeControl.hidden = Boolean(FIXED_MODE);
    if (els.cliffordAlgebraControls) els.cliffordAlgebraControls.hidden = !isClifford;
    if (els.anyonAlgebraControls) els.anyonAlgebraControls.hidden = !isAnyon;
    if (els.virasoroAlgebraControls) els.virasoroAlgebraControls.hidden = !isVirasoroGo;

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
    return {
        topology: els.topologySelect.value,
        width: Number(els.widthInput.value),
        height: Number(els.heightInput.value),
        nx: Number(els.widthInput.value),
        ny: Number(els.heightInput.value),
        nz: Number(els.zSizeInput.value),
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
    return [parts[0] || 0, parts[1] || 0];
}

function anyonConfig() {
    if (els.braidMemoryModeSelect.value === 'nonabelian_fusion_channel'
        && els.anyonModelSelect.value === 'toric_code') {
        els.anyonModelSelect.value = 'ising';
    }
    return {
        anyonModel: els.anyonModelSelect.value,
        braidMemoryMode: els.braidMemoryModeSelect.value,
        braidCancellationMode: els.braidCancellationModeSelect.value,
        requireReverseInverseOrder: true,
        braidedPieceShield: els.braidedPieceShieldSelect.value === 'on',
        captureRequiresUnbraid: els.captureRequiresUnbraidSelect.value === 'on',
        braidedPiecePenalty: els.braidedPiecePenaltySelect.value === 'on'
    };
}

function physicalProblemConfig(mode) {
    const topology = topologyConfig();
    if (mode === 'anyon_jump' && PHYSICAL_PROBLEM_ID === 'toric_code_memory_unbraid') {
        return {
            id: PHYSICAL_PROBLEM_ID,
            topology: params.get('problemTopology') || topology.topology,
            boardSize: Number(params.get('boardSize') || params.get('size') || topology.width),
            numPairsE: Number(params.get('numPairsE') || 2),
            numPairsM: Number(params.get('numPairsM') || 2),
            createPairsLocally: params.get('createPairsLocally') !== 'false',
            enableTwistSeam: params.get('enableTwistSeam') !== 'false'
        };
    }
    if (mode === 'clifford_reversi' && PHYSICAL_PROBLEM_ID === 'ising_domain_wall_topology') {
        return {
            id: PHYSICAL_PROBLEM_ID,
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
    const is4D = els.topologySelect.value === 'flat_4d_grid';
    const noiseEnabled = els.noiseModeSelect.value !== 'off';
    const timeEnabled = els.floquetModeSelect.value !== 'off';
    els.geometryDetails.hidden = !is4D;
    els.zSizeControl.hidden = !is4D;
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
    const [width] = game.topology.sizes;
    els.board.style.gridTemplateColumns = `repeat(${width}, minmax(0, 1fr))`;
    els.board.innerHTML = '';

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

function updateBoardHighlights() {
    if (!game) return;
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
    node.className = `stone ${stone.color}`;
    const groupInfo = game.groupInfoAt(coord);
    if (groupInfo?.unstable) node.classList.add('hidden');
    node.textContent = groupInfo?.unstable ? '!' : '';
    node.title = groupInfo
        ? `${stone.color} group h=${groupInfo.h}; liberties=${groupInfo.liberties.size}${groupInfo.unstable ? `; unstable pressure=${groupInfo.unstable.enemyStressPressure}` : ''}`
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
    node.textContent = token.revealed === false ? '?' : anyonDisplay(token.anyonType);
    const parity = token.braidParity || 0;
    const inverseInfo = parity === 1 || token.isBraided ? '; inverse loop available' : '';
    const word = braidWordToText(token.braidWord);
    const required = requiredInverseBraidWordText(token.braidWord);
    const channel = fusionChannelDisplay(token);
    const channelInfo = channel ? `; fusion channel ${channel}` : '';
    const measured = token.measurementHistory?.length ? `; measurements ${token.measurementHistory.length}` : '';
    const braidInfo = ` status ${braidStatusLabel(token)}; parity ${parity}; braid word ${word}; required inverse ${required}${channelInfo}${measured}${inverseInfo}`;
    node.title = `${token.id} ${token.owner} ${anyonDisplay(token.anyonType)} (${token.anyonType});${braidInfo}; ${game.time?.tooltipForEntity(token) || ''}`;
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
    els.blackCount.textContent = tokens.filter((token) => token.owner === 'black').length;
    els.whiteCount.textContent = tokens.filter((token) => token.owner === 'white').length;
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
        els.statusText.textContent = 'Select an anyon, then hop to a neighbor or jump over an occupied vertex.';
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
            els.anyonModelSelect.value === 'ising'
                ? 'Ising anyons: 1, \u03c3, \u03c8'
                : els.anyonModelSelect.value === 'fibonacci'
                    ? 'Fibonacci anyons: 1, \u03c4'
                    : 'e,m,\u03c8 toric anyons',
            '? hidden until measured',
            'Blue path: jump line',
            'Braided marker: nontrivial memory',
            'Green UNBRAID badge: next inverse loop'
        ];
    els.legend.innerHTML = items.map((item) => `<span>${item}</span>`).join('');
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
            } else {
                const braid = event.braid?.phase === -1 ? ' braid -1' : '';
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
                item.textContent = `#${event.number} ${event.player} ${event.kind} ${event.tokenId} -> ${event.to.join(',')}${braid}${unbraid}${channel}${fusion}${time}.`;
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
        item.textContent = `t${event.tick} ${event.player} ${event.type} ${event.movingTokenId}->${event.targetId || 'cycle'} ${generator}: ${result}, word ${event.braidWordBefore.length}->${event.braidWordAfter.length}${channel}.`;
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
    return ANYON_SYMBOLS[type] || type;
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

for (const control of [
    els.modeSelect,
    els.topologySelect,
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
    els.braidCancellationModeSelect,
    els.braidedPieceShieldSelect,
    els.captureRequiresUnbraidSelect,
    els.braidedPiecePenaltySelect,
    els.virasoroLayerSelect,
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

createGame();
