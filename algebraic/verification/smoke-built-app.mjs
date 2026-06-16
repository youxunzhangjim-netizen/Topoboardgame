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
    const state = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            title: document.querySelector('#modeTitle')?.textContent,
            cells: document.querySelectorAll('.cell').length,
            exportHasMode: document.querySelector('#exportText')?.value.includes('clifford_reversi'),
            algebraSet: exportState.algebraSet,
            currentParentClass: document.querySelector('#currentPlayer')?.closest('.board-header')?.className || ''
        };
    });
    assert.equal(state.title, 'Clifford Reversi');
    assert.ok(state.cells >= 4, 'Expected rendered cells.');
    assert.equal(state.exportHasMode, true, 'Expected JSON export to contain the mode name.');
    assert.equal(state.algebraSet, 'standard');
    assert.match(state.currentParentClass, /board-header/, 'Current turn card should sit in the board header.');
    assert.equal(
        await page.locator('#modeSelect option[value="physical_clifford_reversi"]').count(),
        0,
        'Physical Clifford is configured inside the single Clifford Reversi mode.'
    );
    assert.equal(await page.locator('#cliffordAlgebraSetSelect').inputValue(), 'standard');

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
    assert.equal(await page.locator('#topologySelect option[value="random_boundary"]').count(), 1, '2D RBC should be available in the topology selector.');
    await page.selectOption('#topologySelect', 'random_boundary');
    const randomBoundaryState = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            topology: exportState.topology?.name,
            hint: document.querySelector('#topologyHint')?.textContent || ''
        };
    });
    assert.equal(randomBoundaryState.topology, 'random_boundary');
    assert.match(randomBoundaryState.hint, /2D RBC|random boundary/i);

    await page.selectOption('#topologySelect', 'flat');
    await page.selectOption('#latticeSelect', 'honeycomb');
    const honeycombState = await page.evaluate(() => {
        const cells = [...document.querySelectorAll('#board .cell')].map((cell) => {
            const rect = cell.getBoundingClientRect();
            return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        });
        const lefts = cells.map((cell) => cell.left);
        const tops = cells.map((cell) => cell.top);
        return {
            className: document.querySelector('#board')?.className || '',
            count: cells.length,
            xSpread: Math.max(...lefts) - Math.min(...lefts),
            ySpread: Math.max(...tops) - Math.min(...tops),
            minWidth: Math.min(...cells.map((cell) => cell.width)),
            minHeight: Math.min(...cells.map((cell) => cell.height)),
            visibleCells: cells.filter((cell) => cell.width > 8 && cell.height > 8).length
        };
    });
    assert.match(honeycombState.className, /lattice-hex-cells/, 'Clifford honeycomb Reversi should use hex-cell rendering.');
    assert.equal(honeycombState.count, 64, 'Default Clifford honeycomb board should still expose 64 cells.');
    assert.ok(honeycombState.xSpread > 320, 'Honeycomb Reversi should spread across the x axis, not collapse into strips.');
    assert.ok(honeycombState.ySpread > 320, 'Honeycomb Reversi should spread across the y axis, not collapse into strips.');
    assert.ok(honeycombState.minWidth > 10 && honeycombState.minHeight > 10, 'Honeycomb cells should have visible hex patch sizes.');
    assert.equal(honeycombState.visibleCells, 64, 'Every honeycomb Reversi cell should be visibly placed.');

    await page.selectOption('#topologySelect', 'torus');
    const torus3DState = await page.evaluate(() => ({
        canvasVisible: !document.querySelector('#algebraic3dBoard')?.hidden,
        flatBoardHidden: document.querySelector('#board')?.hidden,
        width: document.querySelector('#algebraic3dBoard')?.width || 0,
        height: document.querySelector('#algebraic3dBoard')?.height || 0,
        topology: JSON.parse(document.querySelector('#exportText').value).topology?.name,
        rules: document.querySelector('[data-rules-mode="clifford"]')?.textContent || ''
    }));
    assert.equal(torus3DState.canvasVisible, true, 'T2 algebraic games should use the interactive 3D canvas.');
    assert.equal(torus3DState.flatBoardHidden, true, 'The projected 2D board should hide for a 3D topology view.');
    assert.ok(torus3DState.width > 300 && torus3DState.height > 300, 'The T2 WebGL canvas should have a usable size.');
    assert.equal(torus3DState.topology, 'torus');
    assert.match(torus3DState.rules, /solid torus/i);

    await page.selectOption('#topologySelect', 'r3');
    const r3State = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            canvasVisible: !document.querySelector('#algebraic3dBoard')?.hidden,
            topology: exportState.topology?.name,
            dimensions: exportState.topology?.dimensions,
            hint: document.querySelector('#topologyHint')?.textContent || ''
        };
    });
    assert.equal(r3State.canvasVisible, true, 'R3 algebraic games should use the interactive 3D canvas.');
    assert.equal(r3State.topology, 'r3');
    assert.equal(r3State.dimensions, 3);
    assert.match(r3State.hint, /six axis-neighbors/i);
    const projectedLegalMove = await page.evaluate(() => {
        const view = window.algebraic3dBoard;
        const index = view.pointCoords.findIndex((coord) => view.viewState.legalKeys.has(coord.join(',')));
        const point = view.pointPositions[index].clone().project(view.camera);
        const rect = view.canvas.getBoundingClientRect();
        return {
            x: (point.x + 1) * rect.width / 2,
            y: (1 - point.y) * rect.height / 2,
            camera: view.camera.position.toArray()
        };
    });
    await page.locator('#algebraic3dBoard').click({
        position: { x: projectedLegalMove.x, y: projectedLegalMove.y }
    });
    const r3MoveState = await page.evaluate((before) => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        const after = window.algebraic3dBoard.camera.position.toArray();
        return {
            moveNumber: exportState.moveNumber,
            cameraDelta: Math.hypot(...after.map((value, index) => value - before.camera[index]))
        };
    }, projectedLegalMove);
    assert.equal(r3MoveState.moveNumber, 1, 'Clicking a projected legal R3 vertex should make a real move.');
    assert.equal(r3MoveState.cameraDelta, 0, 'Placing on the 3D algebraic board should not move the camera.');

    await page.selectOption('#topologySelect', 'sphere_latitude');
    assert.equal(
        await page.locator('#algebraic3dBoard').evaluate((canvas) => !canvas.hidden),
        true,
        'S2 algebraic games should use the interactive 3D canvas.'
    );
    await page.selectOption('#topologySelect', 'flat');

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

    await page.selectOption('#cliffordAlgebraSetSelect', 'physical');
    const physicalVacuumState = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            title: document.querySelector('#modeTitle')?.textContent,
            mode: exportState.mode,
            algebraSet: exportState.algebraSet,
            selectedAlgebraSet: document.querySelector('#cliffordAlgebraSetSelect')?.value,
            boardSize: exportState.board.length,
            vacuumRecovered: exportState.physicalAnswer?.stabilizerVacuumRecovered,
            physicalControlsVisible: getComputedStyle(document.querySelector('#physicalCliffordControls')).display !== 'none',
            ordinaryPauliHidden: document.querySelector('#pauliControl')?.hidden,
            optionalPhaseSignsHidden: document.querySelector('#phaseSignControl')?.hidden,
            anyonControlsVisible: getComputedStyle(document.querySelector('#anyonAlgebraControls')).display !== 'none',
            currentLabel: document.querySelector('#blackCountLabel')?.textContent
        };
    });
    assert.equal(physicalVacuumState.title, 'Clifford Reversi');
    assert.equal(physicalVacuumState.mode, 'clifford_reversi');
    assert.equal(physicalVacuumState.algebraSet, 'physical');
    const physicalProblemOptions = await page.evaluate(() =>
        [...document.querySelector('#physicalProblemSelect').options]
            .filter((option) => !option.hidden && !option.disabled)
            .map((option) => option.value)
    );
    assert.deepEqual(
        physicalProblemOptions,
        ['', 'stabilizer_pauli_recovery'],
        'Physical Clifford Reversi only exposes the stabilizer recovery wrapper.'
    );
    await page.selectOption('#physicalProblemSelect', 'stabilizer_pauli_recovery');
    await page.waitForTimeout(100);
    const stabilizerProblemState = await page.evaluate(() => {
        const state = JSON.parse(document.querySelector('#exportText').value);
        return {
            problemId: state.physicalProblem?.problemId,
            panelVisible: !document.querySelector('#stabilizerObservablePanel')?.hidden,
            syndrome: document.querySelector('#stabilizerSyndromeWeight')?.textContent,
            vacuum: document.querySelector('#stabilizerVacuumState')?.textContent,
            toricPanelHidden: document.querySelector('#qecObservablePanel')?.hidden
        };
    });
    assert.equal(stabilizerProblemState.problemId, 'stabilizer_pauli_recovery');
    assert.equal(stabilizerProblemState.panelVisible, true);
    assert.equal(Number.isFinite(Number(stabilizerProblemState.syndrome)), true, 'Stabilizer panel should report a numeric syndrome weight.');
    assert.match(stabilizerProblemState.vacuum, /Recovered|Not recovered/);
    assert.equal(stabilizerProblemState.toricPanelHidden, true);
    assert.equal(physicalVacuumState.selectedAlgebraSet, 'physical');
    assert.notEqual(physicalVacuumState.boardSize, 4, 'Physical vacuum must not inherit the ordinary four-stone opening.');
    assert.equal(typeof physicalVacuumState.vacuumRecovered, 'boolean');
    assert.equal(physicalVacuumState.physicalControlsVisible, true);
    assert.equal(physicalVacuumState.ordinaryPauliHidden, true);
    assert.equal(physicalVacuumState.optionalPhaseSignsHidden, true, 'Physical mode always tracks phase modulo four.');
    assert.equal(physicalVacuumState.anyonControlsVisible, false);
    assert.match(physicalVacuumState.currentLabel, /Sector/);

    await page.selectOption('#physicalInitialStateSelect', 'prepared_clifford_circuit');
    const preparedPhysicalState = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            boardSize: exportState.board.length,
            ancillas: exportState.physicalObservables?.numberOfAncillas,
            nonClifford: exportState.physicalObservables?.nonCliffordResourcesUsed,
            labels: [...document.querySelectorAll('#board .stone')].map((stone) => stone.textContent.trim())
        };
    });
    assert.ok(preparedPhysicalState.boardSize >= 4, 'Prepared circuit creates physical sites.');
    assert.ok(preparedPhysicalState.ancillas >= 3, 'Prepared circuit includes optional ancillas.');
    assert.equal(preparedPhysicalState.nonClifford, true, 'Magic ancilla is marked as a non-Clifford resource.');
    assert.ok(preparedPhysicalState.labels.some((label) => label.startsWith('A_')), 'Physics view renders ancilla basis labels.');

    await page.selectOption('#physicalActionSelect', 'phase_action');
    assert.equal(
        await page.locator('#physicalPhaseGateControl').evaluate((node) => !node.hidden),
        true,
        'Phase actions reveal their matching controls only in physical mode.'
    );
    await page.locator('#rulesIntroButton').click();
    const physicalRules = await page.evaluate(() =>
        [...document.querySelectorAll('#rulesIntroPanel [data-rules-mode]:not([hidden])')]
            .map((node) => node.textContent || '')
            .join(' ')
    );
    assert.match(physicalRules, /stabilizer vacuum/i);
    assert.match(physicalRules, /ancilla/i);
    assert.match(physicalRules, /CNOT/i);

    await page.selectOption('#topologySelect', 'torus');
    assert.equal(
        await page.locator('#algebraic3dBoard').evaluate((canvas) => !canvas.hidden),
        true,
        'Physical Clifford Reversi keeps the interactive 3D topology board.'
    );
    const physicalDesktopPixels = await page.locator('#algebraic3dBoard').evaluate((canvas) => {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        let colored = 0;
        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index] + pixels[index + 1] + pixels[index + 2] > 24 && pixels[index + 3] > 0) colored++;
        }
        return { colored, width: gl.drawingBufferWidth, height: gl.drawingBufferHeight };
    });
    assert.ok(physicalDesktopPixels.colored > 1000, 'Desktop physical torus must render nonblank WebGL pixels.');
    const desktopScreenshot = await page.screenshot();
    assert.ok(desktopScreenshot.length > 10000, 'Desktop physical-mode screenshot should contain rendered UI.');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    const physicalMobileState = await page.locator('#algebraic3dBoard').evaluate((canvas) => {
        const rect = canvas.getBoundingClientRect();
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        let colored = 0;
        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index] + pixels[index + 1] + pixels[index + 2] > 24 && pixels[index + 3] > 0) colored++;
        }
        return {
            colored,
            width: rect.width,
            height: rect.height,
            withinViewport: rect.left >= 0 && rect.right <= window.innerWidth + 1
        };
    });
    assert.ok(physicalMobileState.colored > 500, 'Mobile physical torus must render nonblank WebGL pixels.');
    assert.ok(physicalMobileState.width > 300 && physicalMobileState.height > 300);
    assert.equal(physicalMobileState.withinViewport, true, 'Mobile 3D board should remain inside the viewport.');
    const mobileScreenshot = await page.screenshot();
    assert.ok(mobileScreenshot.length > 10000, 'Mobile physical-mode screenshot should contain rendered UI.');

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`http://127.0.0.1:${port}/?mode=physical_clifford_reversi`, { waitUntil: 'networkidle' });
    assert.equal(
        await page.locator('#cliffordAlgebraSetSelect').inputValue(),
        'physical',
        'Legacy physical-mode URLs should open the physical algebra set inside Clifford Reversi.'
    );
    await page.selectOption('#cliffordAlgebraSetSelect', 'standard');
    const restoredStandard = await page.evaluate(() => {
        const state = JSON.parse(document.querySelector('#exportText').value);
        return {
            mode: state.mode,
            algebraSet: state.algebraSet,
            boardSize: state.board.length
        };
    });
    assert.deepEqual(
        restoredStandard,
        { mode: 'clifford_reversi', algebraSet: 'standard', boardSize: 4 },
        'Switching back to Standard restores the ordinary four-stone opening in the same game mode.'
    );
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
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
    assert.equal(anyonControlState.rulesButton, 'Anyon Intro');
    assert.deepEqual(anyonControlState.physicalProblemOptions, ['', 'toric_code_memory_unbraid']);
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
    assert.equal(fixedAnyonState.modeControlHidden, false, 'Launcher-selected mode should remain changeable inside the algebraic app.');
    assert.equal(fixedAnyonState.pauliHidden, true, 'Anyon Jump should hide Pauli Reversi controls.');
    assert.equal(fixedAnyonState.cliffordDisplay, 'none');
    assert.notEqual(fixedAnyonState.anyonDisplay, 'none');
    assert.equal(fixedAnyonState.virasoroDisplay, 'none');
    assert.equal(fixedAnyonState.braidVisible, true, 'Anyon Jump should show braid controls.');
    assert.equal(fixedAnyonState.anyonGradeHidden, true, 'Z_n phase grade control is hidden until that model is selected.');
    assert.match(fixedAnyonState.rulesText, /Toric code fusion/);
    assert.match(fixedAnyonState.rulesText, /Vacuum 1/);
    assert.match(fixedAnyonState.rulesText, /General Z_n phase/);
    assert.match(fixedAnyonState.rulesText, /alternative channels/);
    await page.selectOption('#anyonModelSelect', 'ising');
    await page.selectOption('#braidMemoryModeSelect', 'nonabelian_fusion_channel');
    const infiniteEntanglementState = await page.evaluate(() => ({
        rangeHidden: document.querySelector('#entanglementRangeControl')?.hidden,
        distanceHidden: document.querySelector('#entanglementDistanceControl')?.hidden,
        range: document.querySelector('#entanglementRangeSelect')?.value,
        exportRange: JSON.parse(document.querySelector('#exportText').value).entanglement
    }));
    assert.equal(infiniteEntanglementState.rangeHidden, false, 'Non-Abelian mode should show entanglement range.');
    assert.equal(infiniteEntanglementState.distanceHidden, true, 'Infinite range should hide the finite distance input.');
    assert.equal(infiniteEntanglementState.range, 'infinite');
    assert.equal(infiniteEntanglementState.exportRange.rangeMode, 'infinite');
    await page.selectOption('#entanglementRangeSelect', 'finite');
    await page.locator('#entanglementDistanceInput').fill('3');
    await page.locator('#entanglementDistanceInput').press('Enter');
    const finiteEntanglementState = await page.evaluate(() => ({
        distanceHidden: document.querySelector('#entanglementDistanceControl')?.hidden,
        distance: document.querySelector('#entanglementDistanceInput')?.value,
        exportRange: JSON.parse(document.querySelector('#exportText').value).entanglement
    }));
    assert.equal(finiteEntanglementState.distanceHidden, false, 'Finite range should show the distance input.');
    assert.equal(finiteEntanglementState.distance, '3');
    assert.equal(finiteEntanglementState.exportRange.rangeMode, 'finite');
    assert.equal(finiteEntanglementState.exportRange.distance, 3);
    const isingExcitationOptions = await page.locator('#anyonExcitationTypeSelect option').evaluateAll((options) =>
        options.map((option) => ({ value: option.value, label: option.textContent })));
    assert.deepEqual(
        isingExcitationOptions.map((option) => option.value),
        ['sigma', 'psi'],
        'Ising excitation selector should expose every non-vacuum Ising type.'
    );
    assert.ok(isingExcitationOptions.every((option) => /energy/.test(option.label)), 'Excitation labels should show energy cost.');
    await page.selectOption('#anyonModelSelect', 'fibonacci');
    const fibonacciExcitationOptions = await page.locator('#anyonExcitationTypeSelect option').evaluateAll((options) =>
        options.map((option) => ({ value: option.value, label: option.textContent })));
    assert.deepEqual(fibonacciExcitationOptions.map((option) => option.value), ['tau'], 'Fibonacci excitation selector should expose tau.');
    assert.match(fibonacciExcitationOptions[0].label, /energy/);
    await page.selectOption('#anyonModelSelect', 'zn_phase');
    const zPhaseControlState = await page.evaluate(() => ({
        anyonGradeHidden: document.querySelector('#anyonGradeControl')?.hidden,
        excitationTypes: [...document.querySelectorAll('#anyonExcitationTypeSelect option')]
            .map((option) => ({ value: option.value, label: option.textContent })),
        tokenTypes: JSON.parse(document.querySelector('#exportText').value).tokens.map((token) => token.anyonType)
    }));
    assert.equal(zPhaseControlState.anyonGradeHidden, false, 'General Z_n phase model should expose the grade n control.');
    assert.deepEqual(
        zPhaseControlState.excitationTypes.map((entry) => entry.value),
        ['z1', 'z2', 'z3', 'z4'],
        'Z_5 excitation selector should expose every non-vacuum grade.'
    );
    assert.deepEqual(
        zPhaseControlState.excitationTypes.map((entry) => entry.label),
        ['\u03b1\u2081 - 2 energy', '\u03b1\u2082 - 2 energy', '\u03b1\u2083 - 2 energy', '\u03b1\u2084 - 2 energy'],
        'Z_n grades should use Greek alpha labels in the UI.'
    );
    assert.ok(zPhaseControlState.tokenTypes.every((type) => /^z[1-4]$/.test(type)), 'Z_n setup tokens should retain Z_n charge types.');

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
            answerLabel: exportState.physicalProblem?.answer?.finalAnswerLabel,
            qecPanelVisible: !document.querySelector('#qecObservablePanel')?.hidden,
            qecCharge: document.querySelector('#qecTotalCharge')?.textContent,
            qecSector: document.querySelector('#qecLogicalSector')?.textContent,
            qecMemory: document.querySelector('#qecMemoryState')?.textContent,
            initialUsesVertices: exportState.physicalProblem?.initialState?.tokens
                ?.every((token) => Array.isArray(token.vertex)),
            hasLogicalHistory: exportState.physicalProblem?.logicalSectorHistory?.length > 0
        };
    });
    assert.equal(physicalProblemState.problemId, 'toric_code_memory_unbraid');
    assert.equal(physicalProblemState.totalCharge, '1');
    assert.equal(physicalProblemState.numE, 2);
    assert.equal(physicalProblemState.numM, 2);
    assert.ok(physicalProblemState.answerLabel, 'Physical problem export should include an answer label.');
    assert.equal(physicalProblemState.qecPanelVisible, true, 'Toric physical problem should show the QEC panel.');
    assert.equal(physicalProblemState.qecCharge, '1');
    assert.equal(physicalProblemState.qecSector, '(0,0)');
    assert.equal(physicalProblemState.qecMemory, 'Alive');
    assert.equal(physicalProblemState.initialUsesVertices, true);
    assert.equal(physicalProblemState.hasLogicalHistory, true);

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
        cftControlsDisplay: getComputedStyle(document.querySelector('#cftReversiControls')).display,
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
    assert.equal(fixedGoState.modeControlHidden, false, 'Launcher-selected Virasoro Go should remain changeable inside the algebraic app.');
    assert.notEqual(fixedGoState.cftControlsDisplay, 'none', 'Virasoro Go should show its CFT/Virasoro controls.');
    assert.equal(fixedGoState.cliffordDisplay, 'none', 'Virasoro Go should hide Clifford algebra group.');
    assert.equal(fixedGoState.anyonDisplay, 'none', 'Virasoro Go should hide Anyon algebra group.');
    assert.equal(fixedGoState.virasoroDisplay, 'none', 'Virasoro Go should hide the retired legacy Virasoro group.');
    assert.equal(fixedGoState.pauliHidden, true, 'Virasoro Go should hide Clifford Pauli controls.');
    assert.equal(fixedGoState.pauliDisplay, 'none', 'Hidden Clifford controls should not occupy layout space.');
    assert.equal(fixedGoState.braidHidden, true, 'Virasoro Go should hide Anyon braid controls.');
    assert.equal(fixedGoState.braidDisplay, 'none', 'Hidden Anyon controls should not occupy layout space.');
    assert.equal(fixedGoState.rulesButton, 'Virasoro Go Intro');
    assert.deepEqual(
        fixedGoState.physicalProblemOptions,
        ['', 'cft_conformal_block_observables'],
        'Virasoro Go should expose its compatible CFT observable wrapper only.'
    );
    assert.match(fixedGoState.rulesText, /Virasoro Go Introduction/);
    await page.locator('#rulesIntroButton').click();
    const visibleVirasoroRules = await page.evaluate(() => ({
        visible: document.querySelector('#rulesIntroPanel')?.getAttribute('aria-hidden') !== 'true',
        text: [...document.querySelectorAll('#rulesIntroPanel [data-rules-mode]:not([hidden])')]
            .map((node) => node.textContent || '')
            .join(' ')
    }));
    assert.equal(visibleVirasoroRules.visible, true, 'Virasoro rules should open in the board area.');
    assert.match(visibleVirasoroRules.text, /Virasoro actions/);
    await page.locator('.cell.legal').first().click();
    await page.locator('.site-action-palette .site-action-choice').first().click();
    await page.locator('.cell.legal').first().click();
    await page.locator('.site-action-palette .site-action-choice').first().click();
    const cftStoneState = await page.evaluate(() => ({
        blackStones: document.querySelectorAll('.stone.go-stone.black').length,
        cftBadges: document.querySelectorAll('.stone.go-stone .cft-badge').length,
        firstTitle: document.querySelector('.stone.go-stone.black')?.getAttribute('title') || ''
    }));
    assert.ok(cftStoneState.blackStones >= 1, 'Virasoro Go stones should render on the board.');
    assert.ok(cftStoneState.cftBadges >= 1, 'Virasoro Go stones should show CFT h badges.');
    assert.match(cftStoneState.firstTitle, /h=/);
    await page.selectOption('#cftActionSelect', 'L0');
    await page.locator('.stone.black').first().locator('xpath=..').click();
    const goState = await page.evaluate(() => {
        const exportState = JSON.parse(document.querySelector('#exportText').value);
        return {
            mode: exportState.mode,
            historyAction: exportState.physicsHistory.at(-1)?.action,
            stressCount: exportState.cft.stress.filter((entry) => entry.stress > 0).length
        };
    });
    assert.equal(goState.mode, 'physical_virasoro_go');
    assert.equal(goState.historyAction, 'virasoro_deformation');
    assert.ok(goState.stressCount > 0, 'Expected L0 to create stress on Go liberties.');

    await page.goto(`http://127.0.0.1:${port}/?mode=physical_virasoro_reversi`, { waitUntil: 'networkidle' });
    const cftInitialState = await page.evaluate(() => {
        const exported = JSON.parse(document.querySelector('#exportText').value);
        return {
            title: document.querySelector('#modeTitle')?.textContent,
            mode: exported.mode,
            boardSize: exported.board.length,
            sigmaCount: exported.counts.primaryTypes.sigma,
            controlsVisible: !document.querySelector('#cftReversiControls')?.hidden,
            cliffordHidden: document.querySelector('#cliffordAlgebraControls')?.hidden,
            blockVisible: !document.querySelector('#cftObservablePanel')?.hidden,
            legalMoves: document.querySelectorAll('.cell.legal').length
        };
    });
    assert.equal(cftInitialState.title, 'Virasoro Reversi');
    assert.equal(cftInitialState.mode, 'physical_virasoro_reversi');
    assert.equal(cftInitialState.boardSize, 4);
    assert.equal(cftInitialState.sigmaCount, 4);
    assert.equal(cftInitialState.controlsVisible, true);
    assert.equal(cftInitialState.cliffordHidden, true);
    assert.equal(cftInitialState.blockVisible, true);
    assert.ok(cftInitialState.legalMoves > 0, 'Four-sigma opening should expose legal CFT brackets.');

    await page.locator('.cell.legal').first().click();
    await page.locator('.site-action-palette .site-action-choice').first().click();
    const cftMoveState = await page.evaluate(() => {
        const exported = JSON.parse(document.querySelector('#exportText').value);
        return {
            moveNumber: exported.moveNumber,
            historyType: exported.history[0]?.type,
            opeUpdates: exported.history[0]?.OPEUpdates?.length,
            physicsHistory: exported.physicsHistory.length,
            entropy: exported.observables.entanglementEntropyEstimate
        };
    });
    assert.equal(cftMoveState.moveNumber, 1);
    assert.equal(cftMoveState.historyType, 'place');
    assert.ok(cftMoveState.opeUpdates > 0);
    assert.ok(cftMoveState.physicsHistory >= 2);
    assert.equal(typeof cftMoveState.entropy, 'number');

    await page.locator('#rulesIntroButton').click();
    const cftRules = await page.locator('[data-rules-mode="cft-reversi"]').textContent();
    assert.match(cftRules, /Ising CFT/);
    assert.match(cftRules, /approximation|estimator/i);

    await page.selectOption('#topologySelect', 'torus');
    await page.waitForTimeout(250);
    const cft3DState = await page.evaluate(() => ({
        canvasVisible: !document.querySelector('#algebraic3dBoard')?.hidden,
        canvasWidth: document.querySelector('#algebraic3dBoard')?.width || 0,
        canvasHeight: document.querySelector('#algebraic3dBoard')?.height || 0,
        flatHidden: document.querySelector('#board')?.hidden
    }));
    assert.equal(cft3DState.canvasVisible, true, 'Torus CFT Reversi should use the rotatable 3D graph board.');
    assert.equal(cft3DState.flatHidden, true);
    assert.ok(cft3DState.canvasWidth > 100 && cft3DState.canvasHeight > 100);

    assert.equal(logs.some((line) => line.startsWith('pageerror')), false, logs.join('\n'));
    console.log(JSON.stringify({ state, rulesVisible: rulesState.visible, reversiState, anyonState, fixedAnyonState, physicalProblemState, isingProblemState, fixedGoState, visibleVirasoroRules, goState, cftInitialState, cftMoveState, cft3DState, logs }, null, 2));
} finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
}
