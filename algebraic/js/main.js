import { CliffordReversiGame } from '../../js/localgames/CliffordReversi.js';
import { AnyonJumpGame } from '../../js/localgames/AnyonJump.js';

const els = {
    modeSelect: document.querySelector('#modeSelect'),
    topologySelect: document.querySelector('#topologySelect'),
    widthInput: document.querySelector('#widthInput'),
    heightInput: document.querySelector('#heightInput'),
    zSizeInput: document.querySelector('#zSizeInput'),
    wSizeInput: document.querySelector('#wSizeInput'),
    pauliSelect: document.querySelector('#pauliSelect'),
    transformSelect: document.querySelector('#transformSelect'),
    pauliControl: document.querySelector('#pauliControl'),
    transformControl: document.querySelector('#transformControl'),
    newGameButton: document.querySelector('#newGameButton'),
    passButton: document.querySelector('#passButton'),
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
    statusText: document.querySelector('#statusText'),
    historyList: document.querySelector('#historyList'),
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

function createGame() {
    selectedToken = '';
    hoverCoord = null;
    const options = {
        topology: topologyConfig(),
        defaultFlipTransform: els.transformSelect.value
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

    renderBoard();
    renderStats();
    renderLegend();
    renderHistory();
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
        if (legalReversi.has(key) || legalAnyonTargets.has(key)) cell.classList.add('legal');
        if (previewFlips.has(key)) cell.classList.add('preview-flip');
        if (jumpPath.has(key)) cell.classList.add('jump-path');
        if (game.mode === 'anyon_jump' && game.isFusionSite(coord)) cell.classList.add('fusion-site');
        cell.title = game.topology.displayCoord(coord);
        cell.addEventListener('mouseenter', () => {
            hoverCoord = coord;
            renderBoard();
            updateStatus();
        });
        cell.addEventListener('mouseleave', () => {
            hoverCoord = null;
            renderBoard();
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

function renderReversiStone(cell, coord) {
    const stone = game.getStone(coord);
    if (!stone) return;
    const node = document.createElement('span');
    node.className = `stone ${stone.color}`;
    node.textContent = stone.pauliLabel;
    cell.append(node);
}

function renderAnyonToken(cell, coord) {
    const token = game.tokenAt(coord);
    if (!token) return;
    const node = document.createElement('span');
    node.className = `anyon ${token.owner}`;
    if (token.id === selectedToken) node.classList.add('selected');
    node.textContent = token.anyonType;
    node.title = `${token.id} ${token.owner} ${token.anyonType}`;
    cell.append(node);
}

function handleCellClick(coord) {
    if (game.mode === 'clifford_reversi') {
        const result = game.place(coord, {
            pauliLabel: els.pauliSelect.value,
            transform: els.transformSelect.value
        });
        els.statusText.textContent = result.ok
            ? `Flipped ${result.event.flipped.length} stone${result.event.flipped.length === 1 ? '' : 's'}.`
            : result.error;
        render();
        return;
    }

    const token = game.tokenAt(coord);
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
        selectedToken = game.tokens.has(selectedToken) ? selectedToken : '';
        els.statusText.textContent = result.event.braid?.effect?.effect === 'add_braid_token'
            ? 'Jump recorded a nontrivial braid token.'
            : `${capitalize(result.event.kind)} completed.`;
    } else {
        els.statusText.textContent = result.error;
    }
    render();
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
        ? ['X,Y,Z Pauli labels', 'Gold outline: flip preview', 'H/S transforms on flips', 'Twisted seams apply H']
        : ['e,m,psi toric anyons', 'Blue path: jump line', 'Diamond: fusion site', 'Braid token for e around m'];
    els.legend.innerHTML = items.map((item) => `<span>${item}</span>`).join('');
}

function renderHistory() {
    els.historyList.innerHTML = '';
    const events = game.history.slice(0, 18);
    for (const event of events) {
        const item = document.createElement('li');
        if (game.mode === 'clifford_reversi') {
            item.textContent = `#${event.number} ${event.player} ${event.pauliLabel}@${event.coord.join(',')} flipped ${event.flipped.length}; winding (${event.winding.x},${event.winding.y}).`;
        } else {
            const braid = event.braid?.phase === -1 ? ' braid -1' : '';
            const fusion = event.fusion?.resolved ? ` fusion ${event.fusion.input.join('x')}=${event.fusion.resolved}` : '';
            item.textContent = `#${event.number} ${event.player} ${event.kind} ${event.tokenId} -> ${event.to.join(',')}${braid}${fusion}.`;
        }
        els.historyList.append(item);
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
    els.wSizeInput
]) {
    control.addEventListener('change', createGame);
}
els.transformSelect.addEventListener('change', render);
els.pauliSelect.addEventListener('change', render);
els.zLayerInput.addEventListener('input', render);
els.wLayerInput.addEventListener('input', render);
els.newGameButton.addEventListener('click', createGame);
els.passButton.addEventListener('click', () => {
    if (game?.mode === 'clifford_reversi') {
        game.pass();
        render();
    }
});
els.exportButton.addEventListener('click', exportJson);

createGame();
