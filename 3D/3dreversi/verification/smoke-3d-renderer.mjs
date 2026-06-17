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
    '.js': 'text/javascript; charset=utf-8'
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

function vectorDistance(a, b) {
    return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
}

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (process.platform === 'linux' ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-web-security', '--disable-features=BlockInsecurePrivateNetworkRequests'] });
const logs = [];

try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('console', (message) => logs.push(`${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`));

    await page.goto(`http://127.0.0.1:${port}/?mode=t2&size=8`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.reversi3dApp?.renderer?.nodePoints);
    await page.waitForTimeout(350);

    const canvasStats = await page.evaluate(() => {
        const source = document.getElementById('reversiBoard');
        const copy = document.createElement('canvas');
        copy.width = source.width;
        copy.height = source.height;
        const context = copy.getContext('2d');
        context.drawImage(source, 0, 0);
        const data = context.getImageData(0, 0, copy.width, copy.height).data;
        let brightPixels = 0;
        let variedPixels = 0;
        for (let index = 0; index < data.length; index += 4 * 31) {
            const max = Math.max(data[index], data[index + 1], data[index + 2]);
            const min = Math.min(data[index], data[index + 1], data[index + 2]);
            if (max > 42) brightPixels += 1;
            if (max - min > 8) variedPixels += 1;
        }
        return {
            width: source.width,
            height: source.height,
            brightPixels,
            variedPixels,
            nodeCount: window.reversi3dApp.renderer.pointCoords.length,
            title: document.querySelector('h1')?.textContent
        };
    });
    assert.equal(canvasStats.title, '3D Reversi');
    assert.equal(canvasStats.nodeCount, 64, 'T2 size 8 should expose 64 pickable graph points.');
    assert.ok(canvasStats.width >= 320 && canvasStats.height >= 360, 'Canvas should have a real render size.');
    assert.ok(canvasStats.brightPixels > 40, 'Expected nonblank bright board pixels.');
    assert.ok(canvasStats.variedPixels > 20, 'Expected varied rendered geometry colors.');

    const before = await page.evaluate(() => window.reversi3dApp.renderer.camera.position.toArray());
    const box = await page.locator('#reversiBoard').boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.42, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(250);
    const after = await page.evaluate(() => window.reversi3dApp.renderer.camera.position.toArray());
    assert.ok(vectorDistance(before, after) > 0.05, 'Dragging the 3D board should rotate the camera.');

    await page.setViewportSize({ width: 390, height: 760 });
    await page.goto(`http://127.0.0.1:${port}/?mode=sphere&size=8`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.reversi3dApp?.renderer?.nodePoints);
    await page.waitForTimeout(250);
    const mobileStats = await page.evaluate(() => ({
        nodeCount: window.reversi3dApp.renderer.pointCoords.length,
        canvasWidth: document.getElementById('reversiBoard').width,
        canvasHeight: document.getElementById('reversiBoard').height,
        mode: window.reversi3dApp.logic.topology.topology
    }));
    assert.equal(mobileStats.mode, 'sphere');
    assert.equal(mobileStats.nodeCount, 64, 'S2 size 8 should expose 64 pickable graph points.');
    assert.ok(mobileStats.canvasWidth >= 320 && mobileStats.canvasHeight >= 360, 'Mobile canvas should remain visible.');
    assert.equal(logs.some((line) => line.startsWith('pageerror')), false, logs.join('\n'));

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`http://127.0.0.1:${port}/?mode=r3&size=8&lattice=hcp`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.reversi3dApp?.renderer?.nodePoints);
    await page.waitForTimeout(350);
    const hcpStats = await page.evaluate(() => {
        const source = document.getElementById('reversiBoard');
        const copy = document.createElement('canvas');
        copy.width = source.width;
        copy.height = source.height;
        const context = copy.getContext('2d');
        context.drawImage(source, 0, 0);
        const data = context.getImageData(0, 0, copy.width, copy.height).data;
        let brightPixels = 0;
        for (let index = 0; index < data.length; index += 4 * 37) {
            const max = Math.max(data[index], data[index + 1], data[index + 2]);
            if (max > 42) brightPixels += 1;
        }
        return {
            lattice: window.reversi3dApp.logic.topology.lattice,
            nodeCount: window.reversi3dApp.renderer.pointCoords.length,
            display: document.querySelector('#modeDisplay')?.textContent,
            latticeVisible: getComputedStyle(document.querySelector('#latticeControlGroup')).display !== 'none',
            selectedLattice: document.querySelector('#latticeSelect')?.value,
            brightPixels
        };
    });
    assert.equal(hcpStats.lattice, 'hcp', 'R3 Reversi should construct an HCP topology when HCP is selected.');
    assert.equal(hcpStats.selectedLattice, 'hcp');
    assert.equal(hcpStats.latticeVisible, true, 'The HCP lattice selector should be visible for R3 mode.');
    assert.equal(hcpStats.nodeCount, 512, 'R3 HCP size 8 should expose 8^3 pickable graph points.');
    assert.match(hcpStats.display, /HCP/);
    assert.ok(hcpStats.brightPixels > 40, 'Expected nonblank HCP board pixels.');

    console.log(JSON.stringify({ canvasStats, mobileStats, hcpStats }, null, 2));
} finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
}
