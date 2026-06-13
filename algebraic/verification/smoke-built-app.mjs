import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), '..', 'dist'));
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
};

const server = createServer(async (request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const filePath = normalize(join(root, requestPath === '/' ? 'index.html' : requestPath));
    if (!filePath.startsWith(root)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    try {
        const data = await readFile(filePath);
        response.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
        response.end(data);
    } catch {
        response.writeHead(404);
        response.end('Not found');
    }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const logs = [];

const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('console', (message) => logs.push(`${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`));
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
    const state = await page.evaluate(() => ({
        title: document.querySelector('#modeTitle')?.textContent,
        cells: document.querySelectorAll('.cell').length,
        exportHasMode: document.querySelector('#exportText')?.value.includes('clifford_reversi'),
        currentParentClass: document.querySelector('#currentPlayer')?.closest('.board-header')?.className || ''
    }));
    assert.equal(state.title, 'Clifford Reversi');
    assert.ok(state.cells >= 4, 'Expected rendered cells.');
    assert.equal(state.exportHasMode, true, 'Expected JSON export to contain the mode name.');
    assert.match(state.currentParentClass, /board-header/, 'Current turn card should sit in the board header.');

    await page.locator('#rulesIntroButton').click();
    const rulesState = await page.evaluate(() => ({
        visible: document.querySelector('#rulesIntroPanel')?.getAttribute('aria-hidden') !== 'true',
        parentClass: document.querySelector('#rulesIntroPanel')?.parentElement?.className || '',
        text: [...document.querySelectorAll('#rulesIntroPanel [data-rules-mode]:not([hidden])')]
            .map((node) => node.textContent || '')
            .join(' ')
    }));
    assert.equal(rulesState.visible, true, 'Expected rules intro panel to open.');
    assert.match(rulesState.parentClass, /board-wrap/, 'Rules intro panel should live inside the board/game area.');
    assert.match(rulesState.text, /Clifford Reversi/);
    assert.doesNotMatch(rulesState.text, /Toric code fusion/);
    assert.equal(await page.locator('#topologySelect option[value="random_boundary"]').count(), 1, 'Random Boundary should be available in the topology selector.');
    await page.selectOption('#topologySelect', 'random_boundary');
    const randomBoundaryState = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            topology: exportState.topology?.name,
            hint: document.querySelector('#topologyHint')?.textContent || ''
        };
    });
    assert.equal(randomBoundaryState.topology, 'random_boundary');
    assert.match(randomBoundaryState.hint, /Random boundary/);

    await page.locator('.cell.legal').first().click();
    const reversiState = await page.evaluate(() => ({
        moveNumber: JSON.parse(document.querySelector('#exportText').value).moveNumber,
        blackCount: document.querySelector('#blackCount')?.textContent,
        physicalProblemOptions: [...document.querySelector('#physicalProblemSelect').options]
            .filter((option) => !option.hidden && !option.disabled)
            .map((option) => option.value)
    }));
    assert.equal(reversiState.moveNumber, 1, 'Expected a real pointer click to place a Clifford Reversi stone.');
    assert.equal(reversiState.blackCount, '4', 'Expected Clifford Reversi to flip one white stone.');
    assert.deepEqual(reversiState.physicalProblemOptions, ['', 'ising_domain_wall_topology']);

    await page.selectOption('#physicalProblemSelect', 'ising_domain_wall_topology');
    const selectedIsingState = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            selectedProblem: document.querySelector('#physicalProblemSelect')?.value,
            problemId: exportState.physicalProblem?.problemId
        };
    });
    assert.equal(selectedIsingState.selectedProblem, 'ising_domain_wall_topology');
    assert.equal(selectedIsingState.problemId, 'ising_domain_wall_topology', 'Visible Ising physical-problem selector should enable Ising export.');

    await page.selectOption('#modeSelect', 'anyon_jump');
    const anyonControlState = await page.evaluate(() => ({
        cliffordDisplay: getComputedStyle(document.querySelector('#cliffordAlgebraControls')).display,
        anyonDisplay: getComputedStyle(document.querySelector('#anyonAlgebraControls')).display,
        virasoroDisplay: getComputedStyle(document.querySelector('#virasoroAlgebraControls')).display,
        rulesButton: document.querySelector('#rulesIntroButton')?.textContent,
        physicalProblemOptions: [...document.querySelector('#physicalProblemSelect').options]
            .filter((option) => !option.hidden && !option.disabled)
            .map((option) => option.value)
    }));
    assert.equal(anyonControlState.cliffordDisplay, 'none', 'Anyon mode should hide Clifford algebra controls.');
    assert.notEqual(anyonControlState.anyonDisplay, 'none', 'Anyon mode should show Anyon algebra controls.');
    assert.equal(anyonControlState.virasoroDisplay, 'none', 'Anyon mode should hide Virasoro algebra controls.');
    assert.equal(anyonControlState.rulesButton, 'Anyon Rules');
    assert.deepEqual(anyonControlState.physicalProblemOptions, ['', 'toric_code_memory_unbraid']);
    await page.selectOption('#physicalProblemSelect', 'toric_code_memory_unbraid');
    const selectedToricState = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            selectedProblem: document.querySelector('#physicalProblemSelect')?.value,
            problemId: exportState.physicalProblem?.problemId
        };
    });
    assert.equal(selectedToricState.selectedProblem, 'toric_code_memory_unbraid');
    assert.equal(selectedToricState.problemId, 'toric_code_memory_unbraid', 'Visible Toric physical-problem selector should enable toric export.');
    await page.locator('.anyon.black').first().locator('xpath=..').click();
    const selected = await page.evaluate(() => document.querySelectorAll('.cell.legal').length);
    assert.ok(selected > 0, 'Expected selecting an anyon to reveal legal jump-game actions.');
    await page.locator('.cell.legal').first().click();
    const anyonState = await page.evaluate(() => ({
        mode: JSON.parse(document.querySelector('#exportText').value).mode,
        moveNumber: JSON.parse(document.querySelector('#exportText').value).moveNumber
    }));
    assert.equal(anyonState.mode, 'anyon_jump');
    assert.equal(anyonState.moveNumber, 1, 'Expected a real pointer click to move an anyon.');

    await page.goto(`http://127.0.0.1:${port}/?mode=anyon_jump`, { waitUntil: 'networkidle' });
    const fixedAnyonState = await page.evaluate(() => ({
        title: document.querySelector('#modeTitle')?.textContent,
        modeControlHidden: document.querySelector('#modeControl')?.hidden,
        pauliHidden: document.querySelector('#pauliControl')?.hidden,
        cliffordDisplay: getComputedStyle(document.querySelector('#cliffordAlgebraControls')).display,
        anyonDisplay: getComputedStyle(document.querySelector('#anyonAlgebraControls')).display,
        virasoroDisplay: getComputedStyle(document.querySelector('#virasoroAlgebraControls')).display,
        braidVisible: !document.querySelector('#braidMemoryControl')?.hidden,
        anyonGradeHidden: document.querySelector('#anyonGradeControl')?.hidden,
        rulesText: [...document.querySelectorAll('#rulesIntroPanel [data-rules-mode]:not([hidden])')]
            .map((node) => node.textContent || '')
            .join(' ')
    }));
    assert.equal(fixedAnyonState.title, 'Anyon Jump Chess');
    assert.equal(fixedAnyonState.modeControlHidden, true, 'Fixed launcher mode should hide the mixed mode selector.');
    assert.equal(fixedAnyonState.pauliHidden, true, 'Anyon Jump should hide Pauli Reversi controls.');
    assert.equal(fixedAnyonState.cliffordDisplay, 'none');
    assert.notEqual(fixedAnyonState.anyonDisplay, 'none');
    assert.equal(fixedAnyonState.virasoroDisplay, 'none');
    assert.equal(fixedAnyonState.braidVisible, true, 'Anyon Jump should show braid controls.');
    assert.equal(fixedAnyonState.anyonGradeHidden, true, 'Z_n phase grade control is hidden until that model is selected.');
    assert.match(fixedAnyonState.rulesText, /Toric code fusion/);
    assert.match(fixedAnyonState.rulesText, /Vacuum 1/);
    assert.match(fixedAnyonState.rulesText, /General Z_n phase/);
    await page.selectOption('#anyonModelSelect', 'zn_phase');
    const zPhaseControlState = await page.evaluate(() => ({
        anyonGradeHidden: document.querySelector('#anyonGradeControl')?.hidden,
        config: JSON.parse(document.querySelector('#exportText').value).tokens[0]
    }));
    assert.equal(zPhaseControlState.anyonGradeHidden, false, 'General Z_n phase model should expose the grade n control.');

    const firstBlackAnyonCell = page.locator('.anyon.black').first().locator('xpath=..');
    await firstBlackAnyonCell.click();
    const selectedOnce = await page.evaluate(() => document.querySelectorAll('.anyon.selected').length);
    await firstBlackAnyonCell.click();
    const selectedTwice = await page.evaluate(() => document.querySelectorAll('.anyon.selected').length);
    assert.equal(selectedOnce, 1, 'Clicking a friendly anyon selects it.');
    assert.equal(selectedTwice, 0, 'Clicking the selected anyon again clears selection.');

    await page.goto(`http://127.0.0.1:${port}/?mode=anyon_jump&physicalProblem=toric_code_memory_unbraid&boardSize=6&numPairsE=1&numPairsM=1`, { waitUntil: 'networkidle' });
    const physicalProblemState = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            problemId: exportState.physicalProblem?.problemId,
            totalCharge: exportState.physicalProblem?.initialObservables?.totalFusionCharge,
            numE: exportState.physicalProblem?.initialObservables?.numE,
            numM: exportState.physicalProblem?.initialObservables?.numM,
            answerLabel: exportState.physicalProblem?.answer?.finalAnswerLabel
        };
    });
    assert.equal(physicalProblemState.problemId, 'toric_code_memory_unbraid');
    assert.equal(physicalProblemState.totalCharge, '1');
    assert.equal(physicalProblemState.numE, 2);
    assert.equal(physicalProblemState.numM, 2);
    assert.ok(physicalProblemState.answerLabel, 'Physical problem export should include an answer label.');

    await page.goto(`http://127.0.0.1:${port}/?mode=clifford_reversi&physicalProblem=ising_domain_wall_topology&problemTopology=torus&boardSize=4&initialState=checkerboard`, { waitUntil: 'networkidle' });
    const isingProblemState = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            mode: exportState.mode,
            problemId: exportState.physicalProblem?.problemId,
            energy: exportState.physicalProblem?.initialObservables?.energy,
            domainWallDensity: exportState.physicalProblem?.initialObservables?.domainWallDensity,
            answerLabel: exportState.physicalProblem?.answer?.topologyEffectLabel,
            summary: exportState.physicalProblem?.answer?.summary
        };
    });
    assert.equal(isingProblemState.mode, 'clifford_reversi');
    assert.equal(isingProblemState.problemId, 'ising_domain_wall_topology');
    assert.equal(isingProblemState.energy, 32);
    assert.equal(isingProblemState.domainWallDensity, 1);
    assert.equal(isingProblemState.answerLabel, 'disordered');
    assert.match(isingProblemState.summary, /Ising-Reversi game/);

    await page.goto(`http://127.0.0.1:${port}/?mode=virasoro_go`, { waitUntil: 'networkidle' });
    const fixedGoState = await page.evaluate(() => ({
        title: document.querySelector('#modeTitle')?.textContent,
        modeControlHidden: document.querySelector('#modeControl')?.hidden,
        virasoroVisible: !document.querySelector('#virasoroActionControl')?.hidden,
        cliffordDisplay: getComputedStyle(document.querySelector('#cliffordAlgebraControls')).display,
        anyonDisplay: getComputedStyle(document.querySelector('#anyonAlgebraControls')).display,
        virasoroDisplay: getComputedStyle(document.querySelector('#virasoroAlgebraControls')).display,
        pauliHidden: document.querySelector('#pauliControl')?.hidden,
        pauliDisplay: getComputedStyle(document.querySelector('#pauliControl')).display,
        braidHidden: document.querySelector('#braidMemoryControl')?.hidden,
        braidDisplay: getComputedStyle(document.querySelector('#braidMemoryControl')).display,
        rulesButton: document.querySelector('#rulesIntroButton')?.textContent,
        physicalProblemOptions: [...document.querySelector('#physicalProblemSelect').options]
            .filter((option) => !option.hidden && !option.disabled)
            .map((option) => option.value),
        rulesText: [...document.querySelectorAll('#rulesIntroPanel [data-rules-mode]:not([hidden])')]
            .map((node) => node.textContent || '')
            .join(' ')
    }));
    assert.equal(fixedGoState.title, 'Virasoro Go');
    assert.equal(fixedGoState.modeControlHidden, true, 'Fixed Virasoro Go mode should hide the mixed mode selector.');
    assert.equal(fixedGoState.virasoroVisible, true, 'Virasoro Go should show Virasoro controls.');
    assert.equal(fixedGoState.cliffordDisplay, 'none', 'Virasoro Go should hide Clifford algebra group.');
    assert.equal(fixedGoState.anyonDisplay, 'none', 'Virasoro Go should hide Anyon algebra group.');
    assert.notEqual(fixedGoState.virasoroDisplay, 'none', 'Virasoro Go should show Virasoro algebra group.');
    assert.equal(fixedGoState.pauliHidden, true, 'Virasoro Go should hide Clifford Pauli controls.');
    assert.equal(fixedGoState.pauliDisplay, 'none', 'Hidden Clifford controls should not occupy layout space.');
    assert.equal(fixedGoState.braidHidden, true, 'Virasoro Go should hide Anyon braid controls.');
    assert.equal(fixedGoState.braidDisplay, 'none', 'Hidden Anyon controls should not occupy layout space.');
    assert.equal(fixedGoState.rulesButton, 'Virasoro Rules');
    assert.deepEqual(fixedGoState.physicalProblemOptions, [''], 'Virasoro Go should not show incompatible physical-problem wrappers.');
    assert.match(fixedGoState.rulesText, /Virasoro Go Rules/);
    await page.locator('#rulesIntroButton').click();
    const visibleVirasoroRules = await page.evaluate(() => ({
        visible: document.querySelector('#rulesIntroPanel')?.getAttribute('aria-hidden') !== 'true',
        text: [...document.querySelectorAll('#rulesIntroPanel [data-rules-mode]:not([hidden])')]
            .map((node) => node.textContent || '')
            .join(' ')
    }));
    assert.equal(visibleVirasoroRules.visible, true, 'Virasoro rules should open in the board area.');
    assert.match(visibleVirasoroRules.text, /Stress pressure/);
    await page.locator('.cell.legal').first().click();
    await page.locator('.cell.legal').first().click();
    const cftStoneState = await page.evaluate(() => ({
        blackStones: document.querySelectorAll('.stone.go-stone.black').length,
        cftBadges: document.querySelectorAll('.stone.go-stone .cft-badge').length,
        firstTitle: document.querySelector('.stone.go-stone.black')?.getAttribute('title') || ''
    }));
    assert.ok(cftStoneState.blackStones >= 1, 'Virasoro Go stones should render on the board.');
    assert.ok(cftStoneState.cftBadges >= 1, 'Virasoro Go stones should show CFT h badges.');
    assert.match(cftStoneState.firstTitle, /h=/);
    await page.selectOption('#virasoroActionSelect', 'L0');
    await page.locator('.stone.black').first().locator('xpath=..').click();
    const goState = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            mode: exportState.mode,
            historyType: exportState.history[0]?.type,
            stressCount: exportState.virasoro.vertexStates.filter((entry) => entry.stress > 0).length
        };
    });
    assert.equal(goState.mode, 'virasoro_go');
    assert.equal(goState.historyType, 'virasoro');
    assert.ok(goState.stressCount > 0, 'Expected L0 to create stress on Go liberties.');
    assert.equal(logs.some((line) => line.startsWith('pageerror')), false, logs.join('\n'));
    console.log(JSON.stringify({ state, rulesVisible: rulesState.visible, reversiState, anyonState, fixedAnyonState, physicalProblemState, isingProblemState, fixedGoState, visibleVirasoroRules, goState, logs }, null, 2));
} finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
}
