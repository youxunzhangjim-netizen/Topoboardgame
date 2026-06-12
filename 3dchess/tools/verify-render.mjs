import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'verification');
const port = 5173;
const url = `http://127.0.0.1:${port}/`;

await mkdir(outDir, { recursive: true });

let serverText = '';
let server = null;

async function isServerReady() {
    try {
        const response = await fetch(url);
        return response.ok;
    } catch {
        return false;
    }
}

async function waitForServer() {
    const started = Date.now();
    while (Date.now() - started < 20000) {
        if (await isServerReady()) return;
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Vite server did not start. Output:\n${serverText}`);
}

function summarizePixels(pixels) {
    const unique = new Set();
    let nonBackground = 0;
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        unique.add(`${r >> 4},${g >> 4},${b >> 4}`);
        if (Math.abs(r - 11) + Math.abs(g - 15) + Math.abs(b - 22) > 18) {
            nonBackground++;
        }
    }
    return { unique: unique.size, nonBackground };
}

try {
    if (!(await isServerReady())) {
        server = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
            cwd: root,
            shell: false,
            stdio: 'pipe'
        });

        server.stdout.on('data', (chunk) => {
            serverText += chunk.toString();
        });
        server.stderr.on('data', (chunk) => {
            serverText += chunk.toString();
        });

        await waitForServer();
    }

    const browser = await chromium.launch({ timeout: 30000 });
    const checks = [];

    for (const viewport of [
        { name: 'desktop', width: 1280, height: 900 },
        { name: 'mobile', width: 390, height: 844 }
    ]) {
        const page = await browser.newPage({ viewport });
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.game?.renderer?.renderer);
        await page.waitForTimeout(500);

        const languageCheck = await page.evaluate(() => {
            const switchRect = document.querySelector('.language-switch').getBoundingClientRect();
            document.querySelector('[data-lang-option="zh"]').click();
            const zhTitle = document.querySelector('h1')?.textContent || '';
            const zhControls = document.querySelector('.sidebar h2')?.textContent || '';
            const zhTurn = document.getElementById('playerTurn')?.textContent || '';
            const pieceSign = document.querySelector('#movablePiecesList .piece-icon')?.textContent?.trim() || '';

            document.querySelector('[data-lang-option="en"]').click();
            const enTitle = document.querySelector('h1')?.textContent || '';
            const enControls = document.querySelector('.sidebar h2')?.textContent || '';

            return {
                zhTitle,
                zhControls,
                zhTurn,
                pieceSign,
                enTitle,
                enControls,
                peerLoaded: Boolean(window.Peer),
                switchWidth: Math.round(switchRect.width),
                switchHeight: Math.round(switchRect.height)
            };
        });

        if (
            !languageCheck.zhTitle.includes('西洋棋')
            || languageCheck.zhControls !== '遊戲控制'
            || !languageCheck.zhTurn.includes('白方')
            || !/^[KQRBNPkqrbnp]$/.test(languageCheck.pieceSign)
            || languageCheck.enTitle !== '8x8x8 3D Chess'
            || languageCheck.enControls !== 'Game Controls'
            || !languageCheck.peerLoaded
            || languageCheck.switchWidth > 90
            || languageCheck.switchHeight > 38
        ) {
            throw new Error(`${viewport.name}: language toggle failed ${JSON.stringify(languageCheck)}.`);
        }

        const roomCodeCheck = await page.evaluate(() => {
            const codes = Array.from({ length: 20 }, () => window.game.network.generateRoomCode());
            return {
                codes,
                fromLink: window.game.network.extractRoomId('https://example.test/3dchess/?room=54321'),
                fromHash: window.game.network.extractRoomId('https://example.test/3dchess/#/?room=67890'),
                fromText: window.game.network.extractRoomId('room=12345'),
                localShareUrl: window.game.network.buildShareUrl('24680'),
                rejected: window.game.network.extractRoomId('not-a-room')
            };
        });

        if (
            !roomCodeCheck.codes.every((code) => /^\d{5}$/.test(code))
            || roomCodeCheck.fromLink !== '54321'
            || roomCodeCheck.fromHash !== '67890'
            || roomCodeCheck.fromText !== '12345'
            || roomCodeCheck.localShareUrl !== 'https://youxunzhangjim-netizen.github.io/3dchess/?room=24680'
            || roomCodeCheck.rejected !== ''
        ) {
            throw new Error(`${viewport.name}: room code handling failed ${JSON.stringify(roomCodeCheck)}.`);
        }

        const reconnectStateCheck = await page.evaluate(async () => {
            const game = window.game;
            game.resetGame();
            game.gameMode = 'online';
            game.myColor = 'black';
            game.network.roomId = '13579';
            game.network.myColor = 'black';
            game.network.isHost = false;
            game.network.rememberRoomSession('13579', 'black');

            const moved = await game.applyMove({
                from: { x: 0, y: 1, z: 0 },
                to: { x: 0, y: 2, z: 0 }
            });
            const saved = game.network.getStoredRoomSession('13579');

            game.setupBoard3D();
            game.currentPlayer = 'white';
            game.moveHistory = [];
            game.gameStarted = false;
            game.gameOver = false;
            game.capturedPieces = { white: [], black: [] };
            game.selectedSquare = null;
            game.legalMoves = [];
            game.pendingMoveTarget = null;

            const restored = game.network.restoreStoredRoomState('13579');
            const pieceAtRestoredTarget = game.getPiece(0, 2, 0);

            game.gameMode = 'local';
            game.myColor = null;
            game.network.roomId = '';
            game.network.myColor = null;
            game.network.isHost = false;
            game.network.isConnected = false;
            game.resetGame();

            return {
                moved,
                savedColor: saved?.color,
                savedHistoryLength: saved?.state?.moveHistory?.length || 0,
                restored,
                restoredPiece: pieceAtRestoredTarget?.type || '',
                restoredColor: pieceAtRestoredTarget?.color || '',
                currentPlayerAfterRestore: saved?.state?.currentPlayer || ''
            };
        });

        if (
            !reconnectStateCheck.moved
            || reconnectStateCheck.savedColor !== 'black'
            || reconnectStateCheck.savedHistoryLength !== 1
            || !reconnectStateCheck.restored
            || reconnectStateCheck.restoredPiece !== 'P'
            || reconnectStateCheck.restoredColor !== 'white'
            || reconnectStateCheck.currentPlayerAfterRestore !== 'black'
        ) {
            throw new Error(`${viewport.name}: reconnect state restore failed ${JSON.stringify(reconnectStateCheck)}.`);
        }

        const renderCheck = await page.evaluate(() => {
            const canvas = document.getElementById('gameCanvas');
            const gl = window.game.renderer.renderer.getContext();
            const width = gl.drawingBufferWidth;
            const height = gl.drawingBufferHeight;
            const sampleWidth = Math.min(160, width);
            const sampleHeight = Math.min(160, height);
            const x = Math.floor((width - sampleWidth) / 2);
            const y = Math.floor((height - sampleHeight) / 2);
            const pixels = new Uint8Array(sampleWidth * sampleHeight * 4);
            gl.readPixels(x, y, sampleWidth, sampleHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            return {
                cssWidth: canvas.clientWidth,
                cssHeight: canvas.clientHeight,
                drawingWidth: width,
                drawingHeight: height,
                pixels: Array.from(pixels)
            };
        });

        const summary = summarizePixels(renderCheck.pixels);
        if (renderCheck.cssWidth < 250 || renderCheck.cssHeight < 250) {
            throw new Error(`${viewport.name}: canvas is too small (${renderCheck.cssWidth}x${renderCheck.cssHeight}).`);
        }
        if (summary.unique < 3 || summary.nonBackground < 150) {
            throw new Error(`${viewport.name}: canvas pixel sample looks blank (${JSON.stringify(summary)}).`);
        }

        const hintCheck = await page.evaluate(() => {
            window.game.selectSquare(0, 1, 0);
            const onCount = window.game.renderer.highlightGroup.children
                .filter((child) => child.userData?.type === 'legal-move').length;

            window.game.showMoveHints = false;
            window.game.renderer.clearLegalMoveHints();
            const offCount = window.game.renderer.highlightGroup.children
                .filter((child) => child.userData?.type === 'legal-move').length;

            window.game.showMoveHints = true;
            window.game.renderer.showLegalMoves(window.game.legalMoves);
            const restoredCount = window.game.renderer.highlightGroup.children
                .filter((child) => child.userData?.type === 'legal-move').length;

            return { onCount, offCount, restoredCount };
        });

        if (hintCheck.onCount <= 0 || hintCheck.offCount !== 0 || hintCheck.restoredCount <= 0) {
            throw new Error(`${viewport.name}: hint toggle failed ${JSON.stringify(hintCheck)}.`);
        }

        const pickerCheck = await page.evaluate(async () => {
            window.game.resetGame();
            const pieceButtonsBefore = document.querySelectorAll('#movablePiecesList button[data-piece-x]').length;
            const firstPiece = document.querySelector('#movablePiecesList button[data-piece-x]');
            firstPiece.click();
            await new Promise((resolve) => requestAnimationFrame(resolve));

            const moveButtonsBefore = document.querySelectorAll('#moveOptionsList button[data-move-x]').length;
            const firstMove = document.querySelector('#moveOptionsList button[data-move-x]');
            firstMove.click();
            await new Promise((resolve) => requestAnimationFrame(resolve));

            const pendingButtons = document.querySelectorAll('#moveOptionsList .move-option.pending').length;
            const yellowHighlights = window.game.renderer.highlightGroup.children
                .filter((child) => child.userData?.type === 'chosen-move').length;

            document.querySelector('#moveOptionsList .move-option.pending').click();
            await new Promise((resolve) => requestAnimationFrame(resolve));

            const blackPickerIcons = Array.from(document.querySelectorAll('#movablePiecesList .piece-icon'))
                .map((item) => item.textContent.trim());
            const visiblePieceNames = document.querySelectorAll('#movablePiecesList .piece-kind').length;

            return {
                pieceButtonsBefore,
                moveButtonsBefore,
                pendingButtons,
                yellowHighlights,
                historyLength: window.game.moveHistory.length,
                currentPlayer: window.game.currentPlayer,
                blackPickerIcons,
                visiblePieceNames
            };
        });

        if (
            pickerCheck.pieceButtonsBefore <= 0
            || pickerCheck.moveButtonsBefore <= 0
            || pickerCheck.pendingButtons !== 1
            || pickerCheck.yellowHighlights <= 0
            || pickerCheck.historyLength !== 1
            || pickerCheck.currentPlayer !== 'black'
            || pickerCheck.blackPickerIcons.some((icon) => !/^[KQRBNP]$/.test(icon))
            || !pickerCheck.blackPickerIcons.includes('N')
            || !pickerCheck.blackPickerIcons.includes('P')
            || pickerCheck.visiblePieceNames !== 0
        ) {
            throw new Error(`${viewport.name}: move picker failed ${JSON.stringify(pickerCheck)}.`);
        }

        const promotionRuleCheck = await page.evaluate(() => ({
            whiteXEdgeOnly: window.game.isPromotionSquare('white', 7, 1, 0),
            whiteInsideCorner: window.game.isPromotionSquare('white', 3, 5, 5),
            whiteFarYFace: window.game.isPromotionSquare('white', 3, 7, 5),
            whiteFarZFace: window.game.isPromotionSquare('white', 3, 5, 7),
            whiteTooEarlyYFace: window.game.isPromotionSquare('white', 3, 7, 4),
            whiteTooEarlyZFace: window.game.isPromotionSquare('white', 3, 4, 7),
            blackXEdgeOnly: window.game.isPromotionSquare('black', 0, 6, 7),
            blackInsideCorner: window.game.isPromotionSquare('black', 3, 2, 2),
            blackLowYFace: window.game.isPromotionSquare('black', 3, 0, 2),
            blackLowZFace: window.game.isPromotionSquare('black', 3, 2, 0),
            blackTooEarlyYFace: window.game.isPromotionSquare('black', 3, 0, 3),
            blackTooEarlyZFace: window.game.isPromotionSquare('black', 3, 3, 0)
        }));

        if (
            promotionRuleCheck.whiteXEdgeOnly
            || promotionRuleCheck.whiteInsideCorner
            || !promotionRuleCheck.whiteFarYFace
            || !promotionRuleCheck.whiteFarZFace
            || promotionRuleCheck.whiteTooEarlyYFace
            || promotionRuleCheck.whiteTooEarlyZFace
            || promotionRuleCheck.blackXEdgeOnly
            || promotionRuleCheck.blackInsideCorner
            || !promotionRuleCheck.blackLowYFace
            || !promotionRuleCheck.blackLowZFace
            || promotionRuleCheck.blackTooEarlyYFace
            || promotionRuleCheck.blackTooEarlyZFace
        ) {
            throw new Error(`${viewport.name}: promotion rule failed ${JSON.stringify(promotionRuleCheck)}.`);
        }

        await page.screenshot({ path: path.join(outDir, `${viewport.name}.png`), fullPage: true });
        checks.push({ viewport: viewport.name, render: summary, language: languageCheck, roomCode: roomCodeCheck, reconnectState: reconnectStateCheck, hints: hintCheck, picker: pickerCheck, promotion: promotionRuleCheck });
        await page.close();
    }

    await browser.close();
    console.log(JSON.stringify({ ok: true, checks }, null, 2));
} finally {
    if (server) server.kill();
}
