import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'local-app', 'build-resources', 'steam-screenshots');
const baseUrl = (process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:5207').replace(/\/+$/, '');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setEnglish(page) {
  await page.addInitScript(() => {
    for (const key of [
      'topological-boardgame:language',
      'topoboardgame-language',
      'topoboardgame.lang',
      '3dgo:language'
    ]) {
      localStorage.setItem(key, 'en');
    }
    localStorage.setItem('3dchess:selectedVariant', 'torus');
  });
}

async function open(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
}

async function choose(page, selector, value) {
  const exists = await page.locator(selector).count();
  if (!exists) return;
  await page.selectOption(selector, value).catch(() => {});
  await page.dispatchEvent(selector, 'change').catch(() => {});
  await page.waitForTimeout(550);
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(outputDir, name),
    fullPage: false,
    type: 'png'
  });
}

async function setThreeCamera(page, appPath, position = [5.5, 4.4, 6.8], target = [0, 0, 0]) {
  await page.evaluate(({ appPath, position, target }) => {
    const app = appPath.split('.').reduce((object, key) => object?.[key], window);
    const renderer = app?.renderer;
    if (!renderer?.camera) return;
    renderer.camera.position.set(position[0], position[1], position[2]);
    renderer.controls?.target?.set(target[0], target[1], target[2]);
    renderer.controls?.update?.();
    if (typeof renderer.render === 'function') renderer.render(app.logic || app.activeGame || app.game);
  }, { appPath, position, target });
  await page.waitForTimeout(600);
}

async function captureTorusChess(page) {
  await open(page, '/3D/3dchess/?variant=torus&lang=en');
  await page.waitForFunction(() => window.gameApp?.activeGame?.renderer, null, { timeout: 30000 });
  await setThreeCamera(page, 'gameApp.activeGame', [7.5, 5.2, 8.4]);
  await screenshot(page, '01_torus_chess_en_1920x1080.png');
}

async function captureTorusTriangularGo(page) {
  await open(page, '/3D/3dgo/?lang=en');
  await page.waitForFunction(() => window.go3dApp?.logic && window.go3dApp?.renderer, null, { timeout: 30000 });
  await choose(page, '#goModeSelect', 't2');
  await choose(page, '#latticeSelect', 'triangular');
  await choose(page, '#boardSizeSelect', '9');
  await page.evaluate(async () => {
    const app = window.go3dApp;
    const coords = [[4, 4], [5, 4], [4, 5], [5, 5], [3, 4], [6, 4], [3, 5], [6, 5]];
    for (const coord of coords) {
      app.playAt(coord);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    app.renderer?.camera?.position?.set?.(8.8, 6.2, 10.8);
    app.renderer?.controls?.target?.set?.(0, 0, 0);
    app.renderer?.controls?.update?.();
    app.updateUI?.();
  });
  await page.waitForTimeout(900);
  await screenshot(page, '02_torus_triangular_go_en_1920x1080.png');
}

async function captureHoneycombReversi2D(page) {
  await open(page, '/2D/2dreversi/?lang=en&lattice=honeycomb');
  await page.waitForFunction(() => window.reversi2dApp?.logic, null, { timeout: 30000 });
  await choose(page, '#latticeSelect', 'honeycomb');
  await choose(page, '#boardSizeSelect', '8');
  await page.evaluate(async () => {
    const app = window.reversi2dApp;
    app.boardZoom = 1.08;
    app.resize?.();
    for (let turn = 0; turn < 28; turn += 1) {
      const moves = app.logic.legalMoves();
      if (!moves.length) {
        const pass = app.logic.pass?.();
        if (!pass?.ok) break;
        app.updateUI?.();
        continue;
      }
      const center = [app.logic.topology.width / 2, app.logic.topology.height / 2];
      const move = moves
        .slice()
        .sort((a, b) => {
          const da = Math.hypot((a.coord?.[0] ?? 0) - center[0], (a.coord?.[1] ?? 0) - center[1]);
          const db = Math.hypot((b.coord?.[0] ?? 0) - center[0], (b.coord?.[1] ?? 0) - center[1]);
          const fa = Array.isArray(a.flips) ? a.flips.length : 0;
          const fb = Array.isArray(b.flips) ? b.flips.length : 0;
          return (fb - fa) || (da - db);
        })[0];
      const result = app.logic.play(move.coord);
      if (!result.ok) break;
      app.updateUI?.();
      app.render?.();
      await new Promise((resolve) => setTimeout(resolve, 55));
    }
    app.boardZoom = 1.06;
    app.resize?.();
    app.updateUI?.();
  });
  await page.waitForTimeout(900);
  await screenshot(page, '03_2d_honeycomb_reversi_en_1920x1080.png');
}

async function captureJump(page) {
  await open(page, '/3D/jump/?lang=en&topology=cube&size=5');
  await page.waitForFunction(() => window.jumpApp?.game, null, { timeout: 30000 });
  await page.evaluate(() => {
    const app = window.jumpApp;
    app.view.rotX = -34;
    app.view.rotY = 44;
    app.view.rotZ = -6;
    app.view.zoom = 0.82;
    for (const [id, value] of [
      ['viewRotateX', -34],
      ['viewRotateY', 44],
      ['viewRotateZ', -6],
      ['viewZoom', 0.82]
    ]) {
      const input = document.getElementById(id);
      if (input) input.value = String(value);
    }
    app.render();
  });
  await page.waitForTimeout(700);
  await screenshot(page, '04_3d_jump_tilted_en_1920x1080.png');
}

async function captureSphereHex(page) {
  await open(page, '/3D/hex/?lang=en');
  await page.waitForFunction(() => window.hexApp?.game, null, { timeout: 30000 });
  await choose(page, '#topologySelect', 'sphere');
  await choose(page, '#latticeSelect', 'sphere_coordinate');
  await choose(page, '#boardSizeSelect', '5');
  await page.evaluate(async () => {
    const app = window.hexApp;
    const game = app?.game;
    const coords = game?.topology?.coordinates?.() || [];
    document.getElementById('rotateX').value = '-16';
    document.getElementById('rotateY').value = '-16';
    document.getElementById('rotateZ').value = '0';
    document.getElementById('zoom').value = '0.62';
    app?.render?.();
    const projectedCells = new Map((app?.getSpaceTimeCells?.() || []).map((cell) => [cell.key, cell]));
    const boardCenter = [app.canvas.width / 2, app.canvas.height / 2];
    for (let turn = 0; turn < 10; turn += 1) {
      const color = game.currentColor;
      const opponentZone = color === 'black' ? game.topology.goalZones.white : game.topology.goalZones.black;
      const moves = coords
        .filter((coord) => !game.getCell(coord))
        .filter((coord) => !opponentZone.start(coord) && !opponentZone.end(coord))
        .map((coord) => ({ coord, screen: projectedCells.get(coord.join(',')) }))
        .filter((entry) => entry.screen)
        .sort((a, b) => {
          const ax = a.screen.x - boardCenter[0] + (turn % 2 ? 80 : -80);
          const ay = a.screen.y - boardCenter[1] + (turn % 3 - 1) * 60;
          const bx = b.screen.x - boardCenter[0] + (turn % 2 ? 80 : -80);
          const by = b.screen.y - boardCenter[1] + (turn % 3 - 1) * 60;
          return Math.hypot(ax, ay) - Math.hypot(bx, by);
        });
      const move = moves[0]?.coord;
      if (!move) break;
      app.playAt(move);
      await new Promise((resolve) => setTimeout(resolve, 45));
    }
    window.hexApp?.render?.();
  });
  await page.waitForTimeout(800);
  await screenshot(page, '05_sphere_geodesic_hex_en_1920x1080.png');
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await setEnglish(page);
  page.on('pageerror', (error) => console.error(`[pageerror] ${error.message}`));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) console.error(`[${message.type()}] ${message.text()}`);
  });

  await captureTorusChess(page);
  await captureTorusTriangularGo(page);
  await captureHoneycombReversi2D(page);
  await captureJump(page);
  await captureSphereHex(page);

  await browser.close();
  console.log(`Steam screenshots written to ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
