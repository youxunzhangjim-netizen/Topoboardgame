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
        exportHasMode: document.querySelector('#exportText')?.value.includes('clifford_reversi')
    }));
    assert.equal(state.title, 'Clifford Reversi');
    assert.ok(state.cells >= 4, 'Expected rendered cells.');
    assert.equal(state.exportHasMode, true, 'Expected JSON export to contain the mode name.');

    await page.locator('#rulesIntroButton').click();
    const rulesState = await page.evaluate(() => ({
        visible: !document.querySelector('#rulesIntroPanel')?.hidden,
        text: [...document.querySelectorAll('#rulesIntroPanel [data-rules-mode]:not([hidden])')]
            .map((node) => node.textContent || '')
            .join(' ')
    }));
    assert.equal(rulesState.visible, true, 'Expected rules intro panel to open.');
    assert.match(rulesState.text, /Clifford Reversi/);
    assert.doesNotMatch(rulesState.text, /Toric code fusion/);

    await page.locator('.cell.legal').first().click();
    const reversiState = await page.evaluate(() => ({
        moveNumber: JSON.parse(document.querySelector('#exportText').value).moveNumber,
        blackCount: document.querySelector('#blackCount')?.textContent
    }));
    assert.equal(reversiState.moveNumber, 1, 'Expected a real pointer click to place a Clifford Reversi stone.');
    assert.equal(reversiState.blackCount, '4', 'Expected Clifford Reversi to flip one white stone.');

    await page.selectOption('#modeSelect', 'anyon_jump');
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
        braidVisible: !document.querySelector('#braidMemoryControl')?.hidden,
        rulesText: [...document.querySelectorAll('#rulesIntroPanel [data-rules-mode]:not([hidden])')]
            .map((node) => node.textContent || '')
            .join(' ')
    }));
    assert.equal(fixedAnyonState.title, 'Anyon Jump Chess');
    assert.equal(fixedAnyonState.modeControlHidden, true, 'Fixed launcher mode should hide the mixed mode selector.');
    assert.equal(fixedAnyonState.pauliHidden, true, 'Anyon Jump should hide Pauli Reversi controls.');
    assert.equal(fixedAnyonState.braidVisible, true, 'Anyon Jump should show braid controls.');
    assert.match(fixedAnyonState.rulesText, /Toric code fusion/);

    await page.goto(`http://127.0.0.1:${port}/?mode=virasoro_go`, { waitUntil: 'networkidle' });
    const fixedGoState = await page.evaluate(() => ({
        title: document.querySelector('#modeTitle')?.textContent,
        modeControlHidden: document.querySelector('#modeControl')?.hidden,
        virasoroVisible: !document.querySelector('#virasoroActionControl')?.hidden,
        braidHidden: document.querySelector('#braidMemoryControl')?.hidden,
        rulesText: [...document.querySelectorAll('#rulesIntroPanel [data-rules-mode]:not([hidden])')]
            .map((node) => node.textContent || '')
            .join(' ')
    }));
    assert.equal(fixedGoState.title, 'Virasoro Go');
    assert.equal(fixedGoState.modeControlHidden, true, 'Fixed Virasoro Go mode should hide the mixed mode selector.');
    assert.equal(fixedGoState.virasoroVisible, true, 'Virasoro Go should show Virasoro controls.');
    assert.equal(fixedGoState.braidHidden, true, 'Virasoro Go should hide Anyon braid controls.');
    assert.match(fixedGoState.rulesText, /Virasoro Go Rules/);
    await page.locator('.cell.legal').first().click();
    await page.locator('.cell.legal').first().click();
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
    console.log(JSON.stringify({ state, rulesVisible: rulesState.visible, reversiState, anyonState, fixedAnyonState, fixedGoState, goState, logs }, null, 2));
} finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
}
