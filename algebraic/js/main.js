import { CliffordReversiGame } from '../../js/localgames/CliffordReversi.js';
import { AnyonJumpGame } from '../../js/localgames/AnyonJump.js';

const els = {
    modeSelect: document.querySelector('#modeSelect'),
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
    pauliControl: document.querySelector('#pauliControl'),
    transformControl: document.querySelector('#transformControl'),
    noiseModeSelect: document.querySelector('#noiseModeSelect'),
    pauliNoiseControl: document.querySelector('#pauliNoiseControl'),
    pauliNoiseTypeSelect: document.querySelector('#pauliNoiseTypeSelect'),
    noiseRateInput: document.querySelector('#noiseRateInput'),
    measurementErrorInput: document.querySelector('#measurementErrorInput'),
    applyNoiseSelect: document.querySelector('#applyNoiseSelect'),
    noiseDetails: document.querySelector('#noiseDetails'),
    floquetModeSelect: document.querySelector('#floquetModeSelect'),
    timeDetails: document.querySelector('#timeDetails'),
    timeUpdateSelect: document.querySelector('#timeUpdateSelect'),
    timePeriodInput: document.querySelector('#timePeriodInput'),
    noiseSeedInput: document.querySelector('#noiseSeedInput'),
    anyonFlipControl: document.querySelector('#anyonFlipControl'),
    anyonFlipSelect: document.querySelector('#anyonFlipSelect'),
    newGameButton: document.querySelector('#newGameButton'),
    passButton: document.querySelector('#passButton'),
    measureButton: document.querySelector('#measureButton'),
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
    timeStatus: document.querySelector('#timeStatus'),
    phaseTimeline: document.querySelector('#phaseTimeline'),
    statusText: document.querySelector('#statusText'),
    historyList: document.querySelector('#historyList'),
    stochasticList: document.querySelector('#stochasticList'),
    legend: document.querySelector('#legend'),
    exportText: document.querySelector('#exportText')
};

let game = null;
let selectedToken = '';
let hoverCoord = null;

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

function createGame() {
    selectedToken = '';
    hoverCoord = null;
    const options = {
        topology: topologyConfig(),
        defaultFlipTransform: els.transformSelect.value,
        probability: probabilityConfig(),
        time: timeConfig()
    };
    game = els.modeSelect.value === 'anyon_jump'
        ? new AnyonJumpGame(options)
        : new CliffordReversiGame(options);
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

function render() {
    if (!game) return;
    normalizeLayerControls();
    const isAnyon = game.mode === 'anyon_jump';
    els.modeTitle.textContent = isAnyon ? 'Anyon Jump' : 'Clifford Reversi';
    els.currentPlayer.textContent = capitalize(game.currentPlayer);
    els.topologyHint.textContent = game.topology.seamSummary();
    els.pauliControl.hidden = isAnyon;
    els.transformControl.hidden = isAnyon;
    els.passButton.hidden = isAnyon;
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
    els.pauliNoiseControl.hidden = !['pauli', 'custom'].includes(els.noiseModeSelect.value);
    els.anyonFlipControl.hidden = !isAnyon;

    renderBoard();
    renderStats();
    renderLegend();
    renderTimePanel();
    renderHistory();
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

    for (const coord of visibleCells()) {
        const key = coordKey(coord);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell';
        cell.dataset.coord = JSON.stringify(coord);
        cell.dataset.key = key;
        if (legalReversi.has(key) || legalAnyonTargets.has(key)) cell.classList.add('legal');
        if (previewFlips.has(key)) cell.classList.add('preview-flip');
        if (jumpPath.has(key)) cell.classList.add('jump-path');
        if (game.mode === 'anyon_jump' && game.isFusionSite(coord)) cell.classList.add('fusion-site');
        const vertexState = game.probability?.getVertexState(coord);
        const timeState = game.time?.getVertexState(coord);
        if (vertexState?.noiseLevel > 0 || vertexState?.stress > 0) cell.classList.add('noisy');
        if (timeState && (Math.abs(timeState.stress) > 0.001 || Math.abs(timeState.potential) > 0.001 || Math.abs(timeState.charge) > 0.001)) {
            cell.classList.add('fielded');
        }
        if (vertexState?.measured) cell.classList.add('measured');
        cell.title = timeState
            ? `${game.topology.displayCoord(coord)} stress=${timeState.stress.toFixed(2)} potential=${timeState.potential.toFixed(2)} charge=${timeState.charge.toFixed(2)}`
            : game.topology.displayCoord(coord);
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
        else renderAnyonToken(cell, coord);

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

    els.board.querySelectorAll('.cell[data-key]').forEach((cell) => {
        const key = cell.dataset.key;
        const coord = JSON.parse(cell.dataset.coord);
        cell.classList.toggle('legal', legalReversi.has(key) || legalAnyonTargets.has(key));
        cell.classList.toggle('preview-flip', previewFlips.has(key));
        cell.classList.toggle('jump-path', jumpPath.has(key));
        cell.classList.toggle('fusion-site', game.mode === 'anyon_jump' && game.isFusionSite(coord));
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

function renderReversiStone(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone ${stone.color}`;
    if (stone.revealed === false || stone.pauliLabel === 'unknown') node.classList.add('hidden');
    node.textContent = stone.revealed === false || stone.pauliLabel === 'unknown' ? '?' : stone.pauliLabel;
    node.title = `${stone.color} ${stone.pauliLabel}; ${game.time?.tooltipForEntity(stone) || ''}`;
    cell.append(node);
}

function renderAnyonToken(cell, coord) {
    const token = game.tokenAt(coord);
    if (!token) return;
    const node = document.createElement('span');
    node.className = `anyon ${token.owner}`;
    if (token.id === selectedToken) node.classList.add('selected');
    if (token.isBraided) node.classList.add('braided');
    if (token.revealed === false) node.classList.add('hidden');
    node.textContent = token.revealed === false ? '?' : token.anyonType;
    const braidInfo = token.isBraided ? ` braid word ${token.braidWord.length}` : ' unbraided';
    node.title = `${token.id} ${token.owner} ${token.anyonType};${braidInfo}; ${game.time?.tooltipForEntity(token) || ''}`;
    cell.append(node);
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

    const token = game.tokenAt(coord);
    if (token && selectedToken && token.id !== selectedToken) {
        const selected = game.tokens.get(selectedToken);
        const path = selected ? [selected.coord, coord] : [];
        const direction = selected ? coord.map((value, axis) => value - selected.coord[axis]) : [];
        const result = game.attemptUnbraid(selectedToken, token.id, { path, direction });
        if (result.ok) {
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
        selectedToken = '';
        hoverCoord = null;
        els.statusText.textContent = result.event.braid?.effect?.effect === 'add_braid_token'
            ? 'Jump recorded a nontrivial braid token.'
            : `${capitalize(result.event.kind)} completed${result.event.noise?.length ? `; ${result.event.noise.length} noise rolls logged` : ''}${result.event.time?.applied ? `; Floquet phase ${result.event.time.phase} applied` : ''}.`;
    } else {
        els.statusText.textContent = result.error;
    }
    render();
}

function measureTarget() {
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

function toggleRulesIntro() {
    const hidden = !els.rulesIntroPanel.hidden;
    els.rulesIntroPanel.hidden = hidden;
    els.rulesIntroButton.setAttribute('aria-expanded', String(!hidden));
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
            els.statusText.textContent = `${capitalize(game.currentPlayer)} can flip ${preview.flips.length} with ${els.transformSelect.value}.`;
        } else if (!hoverCoord) {
            const moves = game.legalMoves(game.currentPlayer, els.transformSelect.value).length;
            els.statusText.textContent = `${capitalize(game.currentPlayer)} has ${moves} legal Clifford Reversi move${moves === 1 ? '' : 's'}.`;
        }
        return;
    }
    if (selectedToken) {
        const actions = game.legalActionsForToken(selectedToken);
        els.statusText.textContent = `Selected ${selectedToken}: ${actions.length} local move/jump option${actions.length === 1 ? '' : 's'}.`;
    } else {
        els.statusText.textContent = 'Select an anyon, then hop to a neighbor or jump over an occupied vertex.';
    }
}

function renderLegend() {
    const items = game.mode === 'clifford_reversi'
        ? ['X,Y,Z Pauli labels', '? hidden until measured', 'Gold outline: flip preview', 'H/S transforms on flips', 'Twisted seams apply H']
        : ['e,m,psi toric anyons', '? hidden until measured', 'Blue path: jump line', 'Click target: attempt unbraid', 'Braid word cancels only by inverse order'];
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
            item.textContent = `#${event.number} ${event.player} passed.`;
        } else if (game.mode === 'clifford_reversi') {
            const time = event.time?.applied ? `; t${event.time.after.tick} phase ${event.time.phase}` : '';
            item.textContent = `#${event.number} ${event.player} ${event.pauliLabel}@${event.coord.join(',')} flipped ${event.flipped.length}; winding (${event.winding.x},${event.winding.y})${time}.`;
        } else {
            if (event.kind === 'attempt_unbraid') {
                const result = event.unbraid.fullyUnbraided
                    ? 'fully unbraided'
                    : event.unbraid.successfulPartialUnbraid
                        ? 'partial inverse'
                        : 'wrong order';
                item.textContent = `#${event.number} ${event.player} attempt_unbraid ${event.tokenId} around ${event.targetId}: ${result}, word ${event.unbraid.afterLength}.`;
            } else {
                const braid = event.braid?.phase === -1 ? ' braid -1' : '';
                const fusion = event.fusion?.resolved ? ` fusion ${event.fusion.input.join('x')}=${event.fusion.resolved}` : '';
                const time = event.time?.applied ? ` t${event.time.after.tick} phase ${event.time.phase}` : '';
                item.textContent = `#${event.number} ${event.player} ${event.kind} ${event.tokenId} -> ${event.to.join(',')}${braid}${fusion}${time}.`;
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
    els.anyonFlipSelect
]) {
    control.addEventListener('change', createGame);
}
els.noiseRateInput.addEventListener('change', createGame);
els.measurementErrorInput.addEventListener('change', createGame);
els.noiseSeedInput.addEventListener('change', createGame);
els.timePeriodInput.addEventListener('change', createGame);
els.transformSelect.addEventListener('change', render);
els.pauliSelect.addEventListener('change', render);
els.zLayerInput.addEventListener('input', render);
els.wLayerInput.addEventListener('input', render);
els.newGameButton.addEventListener('click', createGame);
els.measureButton.addEventListener('click', measureTarget);
els.manualNoiseButton.addEventListener('click', applyNoiseNow);
els.manualTimeButton.addEventListener('click', applyTimeNow);
els.rulesIntroButton.addEventListener('click', toggleRulesIntro);
els.passButton.addEventListener('click', () => {
    if (game?.mode === 'clifford_reversi') {
        game.pass();
        render();
    }
});
els.exportButton.addEventListener('click', exportJson);

createGame();
