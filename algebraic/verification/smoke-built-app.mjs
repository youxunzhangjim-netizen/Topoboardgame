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
    assert.equal(logs.some((line) => line.startsWith('pageerror')), false, logs.join('\n'));
    console.log(JSON.stringify({ state, reversiState, anyonState, logs }, null, 2));
} finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
}
